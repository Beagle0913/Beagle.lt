/* Author playground for the organic trainer (never published). Renders one unit with the trainer's own code:
   validator errors, every molecule with atom numbers, every notes section, every problem and N seeds of every generator, answers revealed.
   Open  http://localhost:8001/tools/organic/playground.html?unit=u07   (see tools/organic/AUTHORING.md). */
(function () {
  'use strict';
  const ORG = globalThis.ORG;
  const doc = document;
  const app = doc.getElementById('app');
  const CK = ORG.check, D = ORG.draw, C = ORG.chem;

  /* ---------- page parameters ---------- */
  const qs = new URLSearchParams(location.search);
  const unitName = (qs.get('unit') || '').trim();
  const lang = qs.get('lang') === 'en' ? 'en' : 'lt';
  const seeds = Math.max(0, Math.min(40, parseInt(qs.get('seeds') || '5', 10) || 0));
  const theme = qs.get('theme');
  if (theme === 'dark' || theme === 'light') doc.documentElement.setAttribute('data-theme', theme);
  const UNIT_OK = /^(u(0[1-9]|1[0-6])|l[1-6]|fixture)$/;

  /* ---------- small helpers ---------- */
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); return n; };
  const plain = t => t && typeof t === 'object' ? CK.markup(t[lang] || t.lt || '').map(s => s.text).join('') : String(t == null ? '' : t);
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const msg = e => (e && e.message) || String(e);
  const link = (href, text) => { const a = el('a', '', text); a.setAttribute('href', href); return a; };
  const here = (patch) => {
    const p = new URLSearchParams(location.search);
    for (const k in patch) { if (patch[k] === null) p.delete(k); else p.set(k, patch[k]); }
    return '?' + p.toString();
  };

  /* ---------- walking a unit for molecules ---------- */
  function walkScheme(s, where, add) {
    if (!isObj(s) || !Array.isArray(s.items)) return;
    s.items.forEach((it, i) => { if (isObj(it) && typeof it.smi === 'string') add(it, where + '.items[' + i + ']'); });
  }
  function walkBlocks(list, where, add) { if (Array.isArray(list)) list.forEach((b, i) => walkBlock(b, where + '[' + i + ']', add)); }
  function walkBlock(b, where, add) {
    if (!isObj(b)) return;
    if (b.mol) (Array.isArray(b.mol) ? b.mol : [b.mol]).forEach((m, i) => add(m, where + '.mol[' + i + ']'));
    if (b.scheme) walkScheme(b.scheme, where + '.scheme', add);
    if (Array.isArray(b.mech)) b.mech.forEach((s, i) => { if (isObj(s)) walkScheme(s.scheme, where + '.mech[' + i + ']', add); });
    if (Array.isArray(b.resonance)) b.resonance.forEach((m, i) => add(m, where + '.resonance[' + i + ']'));
    if (isObj(b.fischer) && typeof b.fischer.smi === 'string') add({ smi: b.fischer.smi }, where + '.fischer');
    if (isObj(b.table) && Array.isArray(b.table.rows)) b.table.rows.forEach((r, i) => Array.isArray(r) && r.forEach((c, j) => { if (isObj(c) && typeof c.smi === 'string') add(c, where + '.table[' + i + '][' + j + ']'); }));
    if (isObj(b.example)) { walkBlocks(b.example.q, where + '.example.q', add); (b.example.steps || []).forEach((s, i) => walkBlocks(s, where + '.example.steps[' + i + ']', add)); }
  }
  function walkOption(o, where, add) {
    if (!isObj(o)) return;
    if (o.mol) add(o.mol, where + '.mol');
    if (o.scheme) walkScheme(o.scheme, where + '.scheme', add);
  }
  function walkProblem(p, where, add) {
    if (!isObj(p)) return;
    walkBlocks(p.q, where + '.q', add);
    (p.steps || []).forEach((s, k) => {
      if (!isObj(s)) return;
      const w = where + '.steps[' + k + ']';
      if (s.mol) add(s.mol, w + '.mol');
      (s.options || []).forEach((o, i) => walkOption(o, w + '.options[' + i + ']', add));
      if (isObj(s.answer) && Array.isArray(s.answer.left)) {
        s.answer.left.forEach((o, i) => walkOption(o, w + '.left[' + i + ']', add));
        s.answer.right.forEach((o, i) => walkOption(o, w + '.right[' + i + ']', add));
      }
      if (Array.isArray(s.solution)) walkBlocks(s.solution, w + '.solution', add);
    });
    if (Array.isArray(p.why)) walkBlocks(p.why, where + '.why', add);
  }

  /* ---------- extra checks the validator does not do ---------- */
  function lintProblem(p, label) {
    const out = [];
    if (!isObj(p) || !Array.isArray(p.steps)) return out;
    p.steps.forEach((s, k) => {
      if (!isObj(s)) return;
      const w = label + ' step ' + (k + 1);
      for (const lg of ['lt', 'en']) {
        try {
          const entry = CK.answerEntry(s, lg);
          if (!CK.checkStep(s, entry, lg).ok) out.push(w + ': the stored answer does not check as right (' + lg + ')');
        } catch (e) { out.push(w + ': checking the stored answer threw: ' + msg(e)); }
      }
      if (['choice', 'multi', 'order'].includes(s.kind) && Array.isArray(s.options)) {
        const seen = new Map();
        s.options.forEach((o, i) => {
          let key;
          try { key = o && o.mol ? 'mol:' + C.canonical(C.parse(o.mol.smi), { stereo: true }) : JSON.stringify(o); } catch (e) { key = JSON.stringify(o); }
          if (seen.has(key)) out.push(w + ': options ' + (seen.get(key) + 1) + ' and ' + (i + 1) + ' are the same');
          else seen.set(key, i);
        });
      }
    });
    return out;
  }

  /* ---------- drawings ---------- */
  function svgOf(smi, opts) {
    const d = D.molecule(smi, opts);
    const svg = D.toDom(d.svg, doc);
    if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 ' + d.width + ' ' + d.height);
    svg.setAttribute('width', String(Math.round(d.width))); svg.setAttribute('height', String(Math.round(d.height)));
    svg.classList.add('drawn');
    return svg;
  }
  const LAYOUT_KEYS = ['rotate', 'flip', 'coords', 'allH', 'condensed', 'circle', 'lonePairs', 'highlight', 'deltas'];
  const molKey = m => m.smi + '|' + JSON.stringify(LAYOUT_KEYS.map(k => m.opts ? m.opts[k] : undefined));

  function molCard(entry) {
    const card = el('div', 'pg-card');
    card.append(el('h4', '', entry.mol.smi));
    card.append(el('div', 'pg-where', entry.where + (entry.count > 1 ? '  (+' + (entry.count - 1) + ' more)' : '')));
    let m;
    try { m = C.parse(entry.mol.smi); } catch (e) { card.append(el('p', 'pg-err', 'does not parse: ' + msg(e))); entry.error = msg(e); return card; }
    const base = Object.assign({ maxWidth: 300 }, entry.mol.opts || {});
    delete base.numbers;
    const zero = {}; m.atoms.forEach((_, i) => { zero[i] = String(i); });
    const pair = el('div', 'pg-pair');
    for (const [label, numbers] of [['labels = SMILES index, from 0 (use these in answers)', zero], ['labels = drawer numbers, from 1 (what the learner sees)', 'all']]) {
      const box = el('div');
      try { box.append(el('div', 'molbox', null)); box.firstChild.append(svgOf(entry.mol.smi, Object.assign({}, base, { numbers }))); } catch (e) { box.append(el('p', 'pg-err', 'drawing failed: ' + msg(e))); entry.error = msg(e); }
      box.append(el('span', 'pg-cap', label));
      pair.append(box);
    }
    card.append(pair);
    // quality numbers of the layout actually used
    try {
      const o = Object.assign({}, entry.mol.opts || {});
      const lay = D.layout(m, o);
      const q = D.quality(m, lay.pos, o);
      const bad = q.overlaps + q.crossings + q.labelClashes > 0;
      if (bad) entry.quality = q;
      card.append(el('p', bad ? 'pg-err' : 'pg-ok', 'quality: overlaps ' + q.overlaps + ', crossings ' + q.crossings + ', label clashes ' + q.labelClashes + (bad ? '  (fix with opts.rotate, opts.flip or opts.coords)' : '')));
    } catch (e) { card.append(el('p', 'pg-err', 'quality check failed: ' + msg(e))); }
    // chemistry facts
    const facts = [];
    try { facts.push('formula ' + C.formulaString(m)); } catch (e) { /* ignore */ }
    try { facts.push('class ' + C.compoundClass(m)); } catch (e) { /* ignore */ }
    try { const g = Array.from(new Set(C.groups(m).map(x => x.type))); if (g.length) facts.push('groups: ' + g.join(', ')); } catch (e) { /* ignore */ }
    try {
      const sc = ORG.stereo.stereocentres(m);
      if (sc.length) facts.push('stereocentres (0-based): ' + sc.map(i => i + (ORG.stereo.cip(m, i) ? ' ' + ORG.stereo.cip(m, i) : '')).join(', '));
    } catch (e) { /* ignore */ }
    card.append(el('p', '', facts.join(' · ')));
    // names
    const names = [];
    for (const lg of ['lt', 'en']) {
      let r = null;
      try { r = ORG.name.name(m, { lang: lg }); } catch (e) { r = null; }
      names.push(lg.toUpperCase() + ': ' + (r ? r.name + (r.alts && r.alts.length ? '  (also ' + r.alts.join(', ') + ')' : '') : 'outside the namer’s scope'));
    }
    let triv = null; try { triv = ORG.name.trivial(m); } catch (e) { triv = null; }
    if (triv) names.push('trivial: ' + triv.lt + ' / ' + triv.en);
    names.forEach(n => card.append(el('p', '', n)));
    // atoms
    const tbl = el('table'), head = el('tr');
    ['idx', 'no.', 'el', 'H', 'hyb', 'C class', 'neighbours'].forEach(h => head.append(el('th', '', h)));
    tbl.append(head);
    m.atoms.forEach((a, i) => {
      const tr = el('tr');
      let hyb = '-', cls = '-';
      try { hyb = C.hybridization(m, i) || '-'; } catch (e) { /* ignore */ }
      try { if (a.el === 'C') cls = String(C.carbonClass(m, i)); } catch (e) { /* ignore */ }
      [String(i), String(i + 1), a.el + (a.aromatic ? ' (ar)' : '') + (a.charge ? (a.charge > 0 ? '+' : '−') : ''), String(a.h), hyb, cls, m.nbr[i].join(',')].forEach(t => tr.append(el('td', '', t)));
      tbl.append(tr);
    });
    const det = el('details', 'pg-fold'); det.append(el('summary', '', 'atom table')); det.append(tbl);
    card.append(det);
    return card;
  }

  /* ---------- the page ---------- */
  function toolbar(name, meta) {
    const bar = el('div', 'pg-bar');
    bar.append(el('h1', '', 'Organic playground'));
    const form = el('form'); form.setAttribute('method', 'get');
    form.className = 'pg-bar';
    const mk = (nameAttr, value, size) => { const i = el('input'); i.name = nameAttr; i.value = value; i.size = size; i.setAttribute('aria-label', nameAttr); return i; };
    const sel = el('select'); sel.name = 'lang'; sel.setAttribute('aria-label', 'language');
    for (const l of ['lt', 'en']) { const o = el('option', '', l.toUpperCase()); o.value = l; if (l === lang) o.selected = true; sel.append(o); }
    const go = el('button', '', 'Show'); go.type = 'submit';
    form.append(mk('unit', name, 9), sel, mk('seeds', String(seeds), 3), go);
    bar.append(form);
    for (const [label, t] of [['light', 'light'], ['dark', 'dark'], ['auto', null]]) {
      const b = el('button', 'linkb', label); b.type = 'button';
      b.addEventListener('click', () => { if (t) doc.documentElement.setAttribute('data-theme', t); else doc.documentElement.removeAttribute('data-theme'); });
      bar.append(b);
    }
    bar.append(link('#errors', 'errors'), link('#molecules', 'molecules'), link('#notes', 'notes'), link('#problems', 'problems'));
    if (meta) bar.append(el('span', 'pg-note', 'units.js: ' + meta.id + ' ready=' + meta.ready));
    return bar;
  }

  function render(unit) {
    clear(app);
    ORG.ui.setLang(lang);
    const meta = ORG.UNITS.find(u => u.id === unit.id) || null;
    app.append(toolbar(unitName, meta));
    const errors = [];
    const err = s => errors.push(s);

    // 1. structure
    CK.validateUnit(unit).forEach(e => err('validateUnit: ' + e));

    // 2. gather problems: banks and N seeds of every generator
    const mols = new Map();
    const addMol = (m, where) => {
      if (!isObj(m) || typeof m.smi !== 'string') return;
      const k = molKey(m);
      const e = mols.get(k);
      if (e) e.count++; else mols.set(k, { mol: m, where, count: 1 });
    };
    walkBlocks(unit.notes && unit.notes.flatMap ? unit.notes.flatMap(s => s.blocks || []) : [], 'notes', addMol);
    walkBlocks(unit.summary, 'summary', addMol);
    const types = (Array.isArray(unit.types) ? unit.types : []).filter(isObj).map(ty => {
      const items = [];
      if (Array.isArray(ty.bank)) ty.bank.forEach((p, i) => items.push({ problem: p, label: (p && p.id) || ty.id + '.bank[' + i + ']', kind: 'bank' }));
      if (typeof ty.gen === 'function') {
        for (let s = 1; s <= seeds; s++) {
          const label = ty.id + '#' + s;
          try {
            const p = CK.makeProblem(ty, s);
            const ve = CK.validateProblem(p);
            ve.forEach(e => err(label + ': ' + e));
            items.push({ problem: p, label, kind: 'gen', seed: s });
          } catch (e) { err(label + ': the generator threw: ' + msg(e)); items.push({ label, kind: 'gen', seed: s, thrown: msg(e) }); }
        }
      }
      return { type: ty, items };
    });
    types.forEach(({ type, items }) => items.forEach(it => {
      if (!it.problem) return;
      walkProblem(it.problem, it.label, addMol);
      lintProblem(it.problem, it.label).forEach(err);
    }));

    // 3. molecules (built first: their problems feed the error list)
    const molCards = [];
    for (const entry of mols.values()) molCards.push({ entry, card: molCard(entry) });
    molCards.forEach(({ entry }) => {
      if (entry.error) err('molecule ' + entry.mol.smi + ' (' + entry.where + '): ' + entry.error);
      if (entry.quality) err('molecule ' + entry.mol.smi + ' (' + entry.where + '): drawing quality ' + JSON.stringify(entry.quality));
    });

    // errors section
    const hs = (id, text) => { const h = el('h2', 'pg-sec', text); h.id = id; return h; };
    app.append(hs('errors', errors.length ? 'Problems found: ' + errors.length : 'No problems found'));
    if (errors.length) { const ul = el('ul', 'pg-list pg-err'); errors.forEach(e => ul.append(el('li', '', e))); app.append(ul); }
    else app.append(el('p', 'pg-ok', 'validateUnit, validateProblem, stored-answer check, duplicate-option check, molecule parse and drawing quality all pass for the ' + types.reduce((n, t) => n + t.items.length, 0) + ' problems shown (generators: ' + seeds + ' seeds each). Run the full test before committing: UNIT=' + unit.id + ' node --test tests/organic/content.test.js'));
    app.append(el('p', 'pg-note', 'Unit ' + unit.id + ': ' + (unit.notes || []).length + ' note sections, ' + types.length + ' exercise types (' + types.filter(t => t.type.gen).length + ' with a generator, ' + types.filter(t => t.type.bank).length + ' with a bank), coverage of ' + Object.keys(unit.coverage || {}).length + ' tasks.' + (unit.lectureMissing ? ' lectureMissing is set.' : '')));

    // molecules section
    app.append(hs('molecules', 'Molecules (' + molCards.length + ')'));
    app.append(el('p', 'pg-note', 'Answers in the unit file use the SMILES index, which starts at 0 (hydrogens are not counted). The drawer’s own numbers (opts.numbers, tap-target labels such as “C3”) start at 1: the atom labelled 3 is index 2. Both are drawn below. Atom tables list index, number, element, H count, hybridisation, carbon class and neighbours.'));
    const grid = el('div', 'pg-cards');
    molCards.forEach(({ card }) => grid.append(card));
    app.append(grid);

    // notes
    app.append(hs('notes', 'Notes'));
    (unit.notes || []).forEach((sec, i) => {
      const box = el('section', 'sec');
      box.append(el('h3', 'sectitle', plain(sec && sec.title) + '  [' + (sec && sec.id) + ']'));
      try { ORG.ui.renderBlocks(box, sec.blocks, lang, 'n' + i); } catch (e) { box.append(el('p', 'pg-err', 'rendering failed: ' + msg(e))); }
      app.append(box);
    });
    if (unit.summary && unit.summary.length) {
      const box = el('section', 'sec summary');
      box.append(el('h3', 'sectitle', 'Summary'));
      try { ORG.ui.renderBlocks(box, unit.summary, lang, 'sum'); } catch (e) { box.append(el('p', 'pg-err', 'rendering failed: ' + msg(e))); }
      app.append(box);
    }

    // problems
    app.append(hs('problems', 'Problems, answers revealed'));
    types.forEach(({ type, items }) => {
      const h = el('h3', 'pg-sub', type.id + ' — ' + plain(type.title) + '   mirrors: ' + ((type.mirrors || []).join(', ') || '–'));
      app.append(h);
      items.forEach(it => {
        const box = el('div', 'pg-prob');
        box.append(el('h3', '', it.label + (it.problem && Array.isArray(it.problem.claims) ? '   claims: ' + it.problem.claims.length : '') + (it.problem && it.problem.src ? '   src: ' + it.problem.src : '')));
        const host = el('div');
        box.append(host);
        if (it.thrown) host.append(el('p', 'pg-err', 'generator threw: ' + it.thrown));
        else { try { ORG.ui.renderProblem(host, it.problem, lang, { type }); } catch (e) { host.append(el('p', 'pg-err', 'rendering failed: ' + msg(e))); } }
        app.append(box);
      });
    });
    doc.title = 'Playground: ' + unit.id + ' (' + lang + ')';
  }

  function fail(text, detail) {
    clear(app);
    app.append(toolbar(unitName, null));
    app.append(el('h2', 'pg-sec pg-err', text));
    if (detail) app.append(el('pre', 'pg-list', detail));
    app.append(el('p', 'pg-note', 'Use ?unit=u07 (u01–u16, l1–l6) or ?unit=fixture. Optional: &lang=en &seeds=5 &theme=dark.'));
  }

  /* ---------- start ---------- */
  if (!UNIT_OK.test(unitName)) { fail(unitName ? 'Unknown unit: ' + unitName : 'No unit chosen'); return; }
  const thrown = [];
  window.addEventListener('error', e => { thrown.push((e.message || 'error') + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '')); });
  const s = doc.createElement('script');
  s.src = unitName === 'fixture' ? '../../tests/organic/fixtures/unit-a.js' : '../../site/organic/units/' + unitName + '.js';
  const finish = ok => {
    const unit = Object.values(ORG.units || {})[0];
    if (!ok || !unit) { fail('The unit file did not load or did not call ORG.unit.', thrown.join('\n') || 'Is the file there? The repo root must be served (launch config "repo", port 8001).'); return; }
    ORG.ui.onResize = () => render(unit);
    try { render(unit); } catch (e) { fail('The playground itself failed: ' + msg(e), e && e.stack); }
  };
  s.onload = () => finish(true);
  s.onerror = () => finish(false);
  doc.head.appendChild(s);
})();
