/* Interface of the organic chemistry trainer: routes, notes, exercise player, exam and review modes.
   Everything on the page is built with createElement / textContent. Text from unit files and from browser storage is never parsed as HTML. */
(function (ORG) {
  'use strict';
  const doc = document;
  const KEY = 'beagle-organic-v1', LKEY = 'beagle-lang';
  const app = doc.getElementById('app');
  const P = ORG.progress, CK = ORG.check;
  const OTHER = { lt: 'en', en: 'lt' };

  let lang = 'lt', prog = P.load(null);
  try {
    prog = P.load(localStorage.getItem(KEY));
    if (localStorage.getItem(LKEY) === 'en') lang = 'en';
  } catch (e) { /* storage unavailable or corrupt: start fresh */ }
  const saveProg = () => { try { localStorage.setItem(KEY, P.save(prog)); } catch (e) { /* ignore */ } };
  const saveLang = () => { try { localStorage.setItem(LKEY, lang); } catch (e) { /* ignore */ } };

  /* ---------- interface texts ---------- */
  const dec = (n) => String(n).replace('.', lang === 'lt' ? ',' : '.');
  const STR = {
    lt: {
      title: 'Organinė chemija', brand: ['Organinė ', 'chemija'], reset: 'Ištrinti pažangą', reset2: 'Spustelėkite dar kartą, kad ištrintumėte', langLabel: 'Kalba',
      examBox: 'Egzamino praktika', mt1: '1 tarpinis (1–5)', mt2: '2 tarpinis (6–16)', exam: 'Visas kursas', reviewBtn: n => `Klaidos (${n})`,
      units: 'Skyriai', notOpened: 'neatidaryta', progressOf: (d, t) => `${d} iš ${t} tipų įsisavinta`,
      back: '← Visi skyriai', learn: 'Mokytis', practice: 'Treniruotis', unitTabs: 'Skyriaus dalys',
      toc: 'Turinys', summary: 'Santrauka', readOf: (a, b) => `Perskaityta ${a} iš ${b} dalių`, mixAll: 'Maišyti visus', mixTitle: 'Visi tipai', types: 'Uždavinių tipai', noTypes: 'Šiame skyriuje uždavinių dar nėra.',
      lectureMissing: 'Kai šis skyrius buvo rašomas, paskaitos skaidrių dar nebuvo: jis sudarytas pagal pratybų lapą, kurso aprašą ir vadovėlį.',
      loading: 'Kraunama…', unavailable: 'Šio skyriaus dar nėra arba jo nepavyko įkelti.', retry: 'Bandyti dar kartą', notFound: 'Tokio puslapio nėra.', home: 'Į skyrių sąrašą',
      rule: 'Taisyklė', pitfall: 'Dažna klaida', example: 'Pavyzdys', nextStep: 'Kitas žingsnis', showAll: 'Rodyti visus', practiseThis: 'Treniruotis šį tipą →', practiseType: t => `Treniruotis: ${t} →`, noDrawing: 'Brėžinys dar neparengtas', figure: 'Brėžinys',
      stepOf: (k, n) => `${k} žingsnis iš ${n}`, check: 'Tikrinti', answer: 'Atsakyti', hint: 'Užuomina', show: 'Rodyti sprendimą', solution: 'Sprendimas', why: 'Kodėl', mirrors: 'Pratybų užduotys',
      right: 'Teisingai.', wrong: 'Dar ne. Pasitaisykite ir bandykite dar kartą.', pick: 'Pirmiausia pasirinkite arba įrašykite atsakymą.', solvedFirst: 'Išspręsta!', solvedHelp: 'Išspręsta su pagalba', another: 'Dar vienas toks uždavinys', nextType: 'Kitas tipas →', listBack: '← Visi šio skyriaus tipai',
      tapAtoms: 'Bakstelėkite atomus. Dar kartą bakstelėjus pažymėjimas nuimamas.', tapBonds: 'Bakstelėkite ryšius. Dar kartą bakstelėjus pažymėjimas nuimamas.', selected: 'pažymėta', atomWord: 'atomas', bondWord: 'ryšys',
      up: 'Pakelti aukštyn', down: 'Nuleisti žemyn', position: (n, m) => `${n} iš ${m}`, choose: '— pasirinkite —', matchWith: 'Pasirinkite pora', typeNumber: 'skaičius', typeName: 'pavadinimas', typeFormula: 'pvz., C5H12',
      numberFor: 'Skaičiaus atsakymas', nameFor: 'Pavadinimo atsakymas', formulaFor: 'Formulės atsakymas',
      examOf: (k, n) => `Uždavinys ${k} iš ${n}`, examHead: { mt1: 'Egzamino praktika: 1 tarpinis', mt2: 'Egzamino praktika: 2 tarpinis', exam: 'Egzamino praktika: visas kursas' },
      examNote: 'Užuominų nėra. Kiekvienas žingsnis tikrinamas vieną kartą, sprendimus pamatysite pabaigoje.', examLoading: 'Renkami uždaviniai…', examFewer: n => `Kai kurių skyrių (${n}) nepavyko įkelti, todėl uždavinių mažiau.`, examNone: 'Egzamino uždavinių sudaryti nepavyko: skyriai dar neparengti arba neįkelti.',
      nextProblem: 'Kitas uždavinys', seeResult: 'Rezultatas', result: 'Rezultatas', scoreOf: (s, m) => `${dec(s)} iš ${dec(m)} balų`,
      passMt2: 'Antram tarpiniam egzaminui išlaikyti reikia ne mažiau kaip 1,7 balo.', passYes: 'Šio bandymo rezultato pakanka.', passNo: 'Šio bandymo rezultato nepakanka.',
      perProblem: 'Uždaviniai ir sprendimai', stepsRight: (a, b) => `${a} iš ${b} žingsnių`, newTry: 'Naujas bandymas', toReview: 'Klaidos', gotRight: 'teisingai', gotWrong: 'neteisingai', lost: 'Nepavyko sudaryti uždavinio.', zoom: 'Padidinti', unzoom: 'Pritaikyti prie ekrano', preparing: 'Skyriai dar ruošiami.', molLabel: 'Molekulės struktūra',
      reviewHead: 'Klaidos', reviewEmpty: 'Klaidų sąrašas tuolaik tuščias. Neteisingai išspręsti uždaviniai atsiras čia.', reviewLeft: n => `Liko uždavinių: ${n}`, reviewDone: n => n ? `Peržiūra baigta. Sąraše dar liko: ${n}.` : 'Peržiūra baigta. Klaidų sąrašas tuščias.', nextMissed: 'Kitas uždavinys',
      noscript: 'Šiam treniruokliui reikia „JavaScript“.'
    },
    en: {
      title: 'Organic chemistry', brand: ['Organic ', 'chemistry'], reset: 'Reset progress', reset2: 'Click again to erase progress', langLabel: 'Language',
      examBox: 'Exam practice', mt1: 'Midterm 1 (1–5)', mt2: 'Midterm 2 (6–16)', exam: 'Whole course', reviewBtn: n => `Mistakes (${n})`,
      units: 'Units', notOpened: 'not opened', progressOf: (d, t) => `${d} of ${t} types mastered`,
      back: '← All units', learn: 'Learn', practice: 'Practise', unitTabs: 'Parts of the unit',
      toc: 'Contents', summary: 'Summary', readOf: (a, b) => `Read ${a} of ${b} sections`, mixAll: 'Mix all types', mixTitle: 'All types', types: 'Exercise types', noTypes: 'There are no exercises in this unit yet.',
      lectureMissing: 'The lecture slides for this unit were not available when it was written: it is based on the seminar sheet, the course description and the textbook.',
      loading: 'Loading…', unavailable: 'This unit is not available yet, or it could not be loaded.', retry: 'Try again', notFound: 'There is no such page.', home: 'To the list of units',
      rule: 'Rule', pitfall: 'Common mistake', example: 'Worked example', nextStep: 'Next step', showAll: 'Show all', practiseThis: 'Practise this type →', practiseType: t => `Practise: ${t} →`, noDrawing: 'Drawing not available yet', figure: 'Drawing',
      stepOf: (k, n) => `Step ${k} of ${n}`, check: 'Check', answer: 'Answer', hint: 'Hint', show: 'Show solution', solution: 'Solution', why: 'Why', mirrors: 'Seminar tasks',
      right: 'Correct.', wrong: 'Not yet. Adjust and try again.', pick: 'Pick or type an answer first.', solvedFirst: 'Solved!', solvedHelp: 'Solved, with help', another: 'Another one like this', nextType: 'Next type →', listBack: '← All types in this unit',
      tapAtoms: 'Tap the atoms. Tap again to unselect.', tapBonds: 'Tap the bonds. Tap again to unselect.', selected: 'selected', atomWord: 'atom', bondWord: 'bond',
      up: 'Move up', down: 'Move down', position: (n, m) => `${n} of ${m}`, choose: '— choose —', matchWith: 'Choose the partner', typeNumber: 'number', typeName: 'name', typeFormula: 'e.g. C5H12',
      numberFor: 'Number answer', nameFor: 'Name answer', formulaFor: 'Formula answer',
      examOf: (k, n) => `Problem ${k} of ${n}`, examHead: { mt1: 'Exam practice: midterm 1', mt2: 'Exam practice: midterm 2', exam: 'Exam practice: whole course' },
      examNote: 'No hints. Each step is checked once, and the solutions are shown at the end.', examLoading: 'Choosing problems…', examFewer: n => `${n} unit(s) could not be loaded, so there are fewer problems.`, examNone: 'No exam problems could be made: the units are not ready or could not be loaded.',
      nextProblem: 'Next problem', seeResult: 'Result', result: 'Result', scoreOf: (s, m) => `${dec(s)} out of ${dec(m)} points`,
      passMt2: 'Midterm 2 needs at least 1.7 points to pass.', passYes: 'This attempt is enough.', passNo: 'This attempt is not enough.',
      perProblem: 'Problems and solutions', stepsRight: (a, b) => `${a} of ${b} steps`, newTry: 'New attempt', toReview: 'Mistakes', gotRight: 'right', gotWrong: 'wrong', lost: 'Could not make a problem.', zoom: 'Enlarge', unzoom: 'Fit to screen', preparing: 'The units are still being prepared.', molLabel: 'Molecule structure',
      reviewHead: 'Mistakes', reviewEmpty: 'The list of mistakes is empty. Problems you get wrong will appear here.', reviewLeft: n => `Left in this round: ${n}`, reviewDone: n => n ? `Review finished. Still on the list: ${n}.` : 'Review finished. The list of mistakes is empty.', nextMissed: 'Next problem',
      noscript: 'This trainer needs JavaScript.'
    }
  };
  let S = STR[lang];

  /* ---------- small helpers ---------- */
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); return n; };
  const tx = t => typeof t === 'string' ? t : (t && typeof t === 'object' ? (t[lang] || t[OTHER[lang]] || '') : '');
  function rich(parent, t) {
    for (const sp of CK.markup(tx(t))) {
      if (!sp.b && !sp.i && !sp.sub && !sp.sup) { parent.append(doc.createTextNode(sp.text)); continue; }
      const n = el(sp.sup ? 'sup' : sp.sub ? 'sub' : 'span', (sp.b ? 'b ' : '') + (sp.i ? 'i' : ''), sp.text);
      parent.append(n);
    }
    return parent;
  }
  const richEl = (tag, cls, t) => rich(el(tag, cls), t);
  const plain = t => CK.markup(tx(t)).map(s => s.text).join('');
  const rand = () => Math.floor(Math.random() * 2147483647);
  const link = (href, text, cls) => { const a = el('a', cls, text); a.setAttribute('href', href); return a; };
  const button = (text, cls, fn) => { const b = el('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; };
  const unitOfType = id => ORG.readyUnits().find(u => id.startsWith(u.id + '.')) || null;
  const isInt = Number.isInteger;

  /* ---------- molecules and drawings ---------- */
  const dcache = new Map();
  function drawing(mol, extra) {
    const D = ORG.draw;
    if (!D || typeof D.molecule !== 'function' || typeof D.toDom !== 'function') return null;
    const opts = Object.assign({ maxWidth: colW() }, mol.opts || {}, extra || {});
    const key = mol.smi + '|' + JSON.stringify(opts);
    try {
      let d = dcache.get(key);
      if (!d) { d = D.molecule(mol.smi, opts); if (dcache.size > 200) dcache.clear(); dcache.set(key, d); }
      return { d, svg: fit(D.toDom(d.svg, doc), d) };
    } catch (e) { return null; }
  }
  // width available to a drawing in the column it is placed in (the drawer and the views shrink to it)
  let inset = 0;
  const narrow = () => window.innerWidth <= 700;
  function colW() {
    const cs = window.getComputedStyle(app);
    const w = app.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - inset;
    return Math.max(160, Math.floor(w));
  }
  function fit(svg, d, zoom) {
    if (!svg.getAttribute('viewBox') && d && d.width && d.height) svg.setAttribute('viewBox', `0 0 ${d.width} ${d.height}`);
    if (d && d.width && d.height) { const k = zoom || 1; svg.setAttribute('width', String(Math.round(d.width * k))); svg.setAttribute('height', String(Math.round(d.height * k))); }
    if (zoom) svg.classList.add('zoomed');
    svg.classList.add('drawn');
    return svg;
  }
  function molNode(mol, extra) {
    const r = drawing(mol, extra);
    const box = el('span', 'molbox');
    if (r) { box.append(r.svg); box.setAttribute('role', 'img'); box.setAttribute('aria-label', plain(mol.name) || S.molLabel); return box; }
    const c = el('code', 'smi', mol.smi);
    box.append(c);
    return box;
  }
  const VIEW_FN = { scheme: 'scheme', mech: 'mechanism', fischer: 'fischer', newman: 'newman', chair: 'chair', resonance: 'resonance' };
  function schemeText(spec) {
    return (spec && Array.isArray(spec.items) ? spec.items : []).map(it => it.smi ? it.smi : it.plus ? '+' : it.arrow ? (it.arrow + (it.above ? ' ' + plain(it.above) : '') + (it.below ? ' ' + plain(it.below) : '')) : '').join('  ');
  }
  function viewNode(kind, spec) {
    const V = ORG.views, D = ORG.draw;
    const box = el('div', 'viewbox');
    try {
      if (V && D && typeof D.toDom === 'function' && typeof V[VIEW_FN[kind]] === 'function') {
        const mw = colW();
        let d;
        if (kind === 'resonance') {
          const items = [];
          (spec || []).forEach((m, i) => { if (i) items.push({ arrow: '↔' }); items.push(m); });
          d = V.scheme({ items, lang, maxWidth: mw });
        } else if (kind === 'scheme') d = V.scheme(Object.assign({ lang, maxWidth: mw }, spec));
        else if (kind === 'mech') d = V.mechanism(Object.assign({ lang }, spec, { scheme: Object.assign({ maxWidth: mw }, spec.scheme) }));
        else d = V[VIEW_FN[kind]](Object.assign({ lang }, spec));
        box.append(fit(D.toDom(d.svg, doc), d));
        return box;
      }
    } catch (e) { /* fall back to text */ }
    box.classList.add('ph');
    if (kind === 'scheme') box.append(el('code', 'smi', schemeText(spec)));
    else if (kind === 'resonance') box.append(el('code', 'smi', (spec || []).map(m => m.smi).join('  ↔  ')));
    else box.append(el('span', 'phnote', S.noDrawing));
    return box;
  }
  function optionContent(node, o) {
    if (o && o.text !== undefined) rich(node, o.text);
    else if (o && o.mol) node.append(molNode(o.mol));
    else if (o && o.scheme) node.append(viewNode('scheme', o.scheme));
    return node;
  }

  /* ---------- notes: blocks ---------- */
  const revealed = {};
  let revealAll = false; // the author playground shows every step of a worked example
  function blocks(parent, list, path) {
    (list || []).forEach((b, i) => block(parent, b, path + '/' + i));
  }
  function figure(parent, node, caption) {
    const f = el('figure', 'fig');
    f.append(node);
    if (caption) f.append(richEl('figcaption', '', caption));
    parent.append(f);
  }
  function block(parent, b, path) {
    if (b.h !== undefined) return parent.append(richEl('h3', 'bh', b.h));
    if (b.p !== undefined) return parent.append(richEl('p', '', b.p));
    if (b.list) { const l = el(b.ordered ? 'ol' : 'ul', 'bl'); for (const x of b.list) l.append(richEl('li', '', x)); return parent.append(l); }
    if (b.rule !== undefined || b.pitfall !== undefined) {
      const isRule = b.rule !== undefined;
      const box = el('div', 'box ' + (isRule ? 'rule' : 'pitfall'));
      box.append(el('span', 'boxlabel', isRule ? S.rule : S.pitfall), richEl('div', 'boxbody', isRule ? b.rule : b.pitfall));
      return parent.append(box);
    }
    if (b.mol) {
      const mols = Array.isArray(b.mol) ? b.mol : [b.mol];
      const row = el('div', 'molrow');
      for (const m of mols) { const it = el('div', 'molitem'); it.append(molNode(m)); if (m.name || m.caption) it.append(richEl('div', 'molname', m.caption || m.name)); row.append(it); }
      return figure(parent, row, b.caption);
    }
    for (const k of ['scheme', 'resonance', 'fischer', 'newman', 'chair']) if (b[k] !== undefined) return figure(parent, viewNode(k, b[k]), b.caption);
    if (b.mech) {
      const wrap = el('div', 'mechsteps');
      for (const st of b.mech) { const one = el('div', 'mechstep'); one.append(viewNode('mech', st)); if (st.note) one.append(richEl('div', 'mechnote', st.note)); wrap.append(one); }
      return figure(parent, wrap, b.caption);
    }
    if (b.table) {
      const wrap = el('div', 'tablewrap'), t = el('table', 'tbl'), hr = el('tr');
      for (const c of b.table.head) hr.append(richEl('th', '', c));
      const thead = el('thead'); thead.append(hr); t.append(thead);
      const tb = el('tbody');
      for (const r of b.table.rows) { const tr = el('tr'); for (const c of r) { const td = el('td'); if (c && c.smi) td.append(molNode(c)); else rich(td, c); tr.append(td); } tb.append(tr); }
      t.append(tb); wrap.append(t); parent.append(wrap);
      if (b.caption) parent.append(richEl('p', 'cap', b.caption));
      return;
    }
    if (b.example) return example(parent, b.example, path);
    if (b.practice) {
      const u = unitOfType(b.practice) || (route && route.unit) || ORG.UNITS.find(x => b.practice.startsWith(x.id + '.'));
      const lu = ORG.units[u && u.id] || ORG.units[(b.practice.split('.')[0])];
      const type = lu ? lu.types.find(t => t.id === b.practice) : null;
      const a = link('#/' + (u ? u.id : '') + '/t/' + encodeURIComponent(b.practice), type ? S.practiseType(plain(type.title)) : S.practiseThis, 'btn practise');
      const pr = el('p', 'practicerow'); pr.append(a);
      return parent.append(pr);
    }
  }
  function example(parent, ex, path) {
    inset += 34;
    if (revealAll) revealed[path] = ex.steps.length;
    const box = el('div', 'example');
    box.append(el('span', 'boxlabel', S.example));
    const q = el('div', 'exq'); blocks(q, ex.q, path + '/q'); box.append(q);
    const steps = el('ol', 'exsteps'); box.append(steps);
    const bar = el('div', 'exbar');
    const draw = () => {
      clear(steps);
      const n = Math.min(revealed[path] || 0, ex.steps.length);
      for (let i = 0; i < n; i++) { const li = el('li'); blocks(li, ex.steps[i], path + '/s' + i); steps.append(li); }
      bar.hidden = n >= ex.steps.length;
    };
    const next = button(S.nextStep, 'btn', () => { revealed[path] = (revealed[path] || 0) + 1; draw(); });
    const all = button(S.showAll, 'btn ghost', () => { revealed[path] = ex.steps.length; draw(); next.focus(); });
    bar.append(next, all); box.append(bar); draw();
    parent.append(box);
    inset -= 34;
  }

  /* ---------- unit loading ---------- */
  function inject(src, done) {
    const s = doc.createElement('script');
    s.src = src;
    s.onload = () => { s.remove(); done(); };
    s.onerror = () => { s.remove(); done(new Error('could not load ' + src)); };
    doc.head.appendChild(s);
  }
  function getUnit(id) {
    return ORG.loadUnit(id, inject).then(u => { if (P.rememberTotal(prog, id, u.types.length)) saveProg(); return u; });
  }
  function unavailable(retry) {
    const box = el('div', 'notice');
    box.setAttribute('role', 'alert');
    box.append(el('p', '', S.unavailable));
    if (retry) box.append(button(S.retry, 'btn', retry));
    box.append(link('#/', S.home, 'btn ghost'));
    return box;
  }

  /* ---------- routing ---------- */
  let route = { view: 'home' };
  let token = 0;
  let sess = null;
  function parseHash() {
    const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    if (!parts.length) return { view: 'home', key: 'home' };
    if (parts[0] === 'review') return { view: 'review', key: 'review' };
    if (parts[0] === 'exam' && P.EXAMS[parts[1]] && ORG.examUnits(parts[1]).length) return { view: 'exam', exam: parts[1], key: 'exam:' + parts[1] };
    const unit = ORG.readyUnit(parts[0]);
    if (unit) {
      if (!parts[1]) return { view: 'unit', unit, tab: 'learn', key: 'u:' + unit.id };
      if (parts[1] === 'practice') return { view: 'unit', unit, tab: 'practice', key: 'u:' + unit.id };
      if (parts[1] === 'mix') return { view: 'mix', unit, key: 'mix:' + unit.id };
      if (parts[1] === 't' && parts[2]) return { view: 'type', unit, typeId: parts[2], key: 't:' + parts[2] };
    }
    return { view: 'notfound', key: 'nf' };
  }
  function go(fresh) {
    const r = parseHash();
    if (fresh || !sess || sess.key !== r.key) sess = null;
    route = r;
    render();
  }
  function render() {
    const my = ++token;
    S = STR[lang];
    inset = 0;
    clear(app);
    const draw = { home: renderHome, unit: renderUnit, type: renderType, mix: renderMix, exam: renderExam, review: renderReview, notfound: renderNotFound }[route.view];
    draw(my);
  }
  const alive = my => my === token;
  function heading(text, tabindex) { const h = richEl('h2', 'pagetitle', text); h.tabIndex = -1; return h; }
  function focusTop() { const h = app.querySelector('h2'); (h || app).focus({ preventScroll: true }); }

  function renderNotFound() {
    app.append(heading(S.notFound), link('#/', S.home, 'btn'));
    focusTop();
  }

  /* ---------- home ---------- */
  function renderHome() {
    const queue = P.reviewQueue(prog).filter(r => unitOfType(r.type));
    const exams = ['mt1', 'mt2', 'exam'].filter(k => ORG.examUnits(k).length);
    if (!ORG.readyUnits().length) { app.append(el('p', 'plain', S.preparing)); doc.title = S.title; return; }
    const box = el('section', 'examsbox');
    box.append(el('h2', 'boxtitle', S.examBox));
    const row = el('div', 'examrow');
    for (const k of exams) row.append(link('#/exam/' + k, S[k], 'btn'));
    row.append(link('#/review', S.reviewBtn(queue.length), 'btn' + (queue.length ? ' warn' : '')));
    box.append(row);
    app.append(box);
    for (const part of ORG.readyParts()) {
      const sec = el('section', 'group');
      sec.append(richEl('h2', 'grouptitle', part.title));
      const ol = el('ol', 'ulist');
      for (const u of ORG.readyUnits().filter(x => x.part === part.part)) {
        const c = P.unitCounts(prog, ORG.units[u.id] || u);
        const li = el('li');
        const a = link('#/' + u.id, '', 'urow');
        a.append(el('span', 'uno', u.part === 3 ? u.n : u.n.padStart(2, '0')), richEl('span', 'utitle', u.title));
        const bar = el('span', 'bar'); bar.setAttribute('aria-hidden', 'true');
        const fill = el('span', 'barfill'); fill.style.width = (c.total ? Math.round(100 * c.done / c.total) : 0) + '%'; bar.append(fill);
        const cnt = el('span', 'ucount', c.total ? `${c.done}/${c.total}` : '–');
        a.append(bar, cnt);
        a.setAttribute('aria-label', plain(u.title) + (c.total ? ': ' + S.progressOf(c.done, c.total) : ''));
        li.append(a); ol.append(li);
      }
      sec.append(ol); app.append(sec);
    }
    doc.title = S.title;
  }

  /* ---------- a unit: learn and practice ---------- */
  function unitHead(u, tab, unit) {
    const head = el('div', 'uhead');
    head.append(link('#/', S.back, 'backlink'));
    const h = el('h2', 'pagetitle'); h.tabIndex = -1;
    h.append(el('span', 'uno', u.part === 3 ? u.n : u.n.padStart(2, '0')), doc.createTextNode(' '), richEl('span', '', u.title));
    head.append(h);
    const tabs = el('nav', 'tabs'); tabs.setAttribute('aria-label', S.unitTabs);
    for (const [k, label, href] of [['learn', S.learn, '#/' + u.id], ['practice', S.practice, '#/' + u.id + '/practice']]) {
      const a = link(href, label, 'tab'); if (k === tab) a.setAttribute('aria-current', 'page'); tabs.append(a);
    }
    head.append(tabs);
    return head;
  }
  function renderUnit(my) {
    const u = route.unit, tab = route.tab;
    app.append(unitHead(u, tab));
    doc.title = plain(u.title) + ' – ' + S.title;
    const body = el('div', 'unitbody'); app.append(body);
    body.append(el('p', 'loading', S.loading));
    focusTop();
    getUnit(u.id).then(unit => {
      if (!alive(my)) return;
      clear(body);
      if (tab === 'learn') learnView(body, u, unit); else practiceView(body, u, unit);
    }, () => {
      if (!alive(my)) return;
      clear(body); body.append(unavailable(() => render()));
    });
  }
  function learnView(body, u, unit) {
    if (unit.lectureMissing) body.append(el('p', 'notice soft', S.lectureMissing));
    inset = narrow() ? 26 : 42;
    const opened = new Set((prog.sections && prog.sections[u.id]) || []);
    const readNote = el('p', 'readnote');
    const upd = () => { readNote.textContent = S.readOf(unit.notes.filter(s => opened.has(s.id)).length, unit.notes.length); };
    if (unit.notes.length > 1) {
      const toc = el('nav', 'toc'); toc.setAttribute('aria-label', S.toc);
      toc.append(el('span', 'toclabel', S.toc));
      const ul = el('ul');
      unit.notes.forEach(sec => {
        const li = el('li');
        li.append(button(plain(sec.title), 'linkb', () => { const t = doc.getElementById('sec-' + sec.id); if (t) { t.scrollIntoView({ block: 'start' }); t.focus({ preventScroll: true }); mark(sec.id); } }));
        ul.append(li);
      });
      toc.append(ul); body.append(toc, readNote);
    }
    const mark = id => { if (P.openSection(prog, u.id, id)) { saveProg(); } opened.add(id); upd(); };
    const sections = [];
    unit.notes.forEach((sec, i) => {
      const s = el('section', 'sec'); s.id = 'sec-' + sec.id; s.tabIndex = -1; s.dataset.sec = sec.id;
      s.append(richEl('h3', 'sectitle', sec.title));
      blocks(s, sec.blocks, u.id + '/n' + i);
      body.append(s); sections.push(s);
    });
    if (unit.summary && unit.summary.length) {
      const s = el('section', 'sec summary');
      s.append(el('h3', 'sectitle', S.summary));
      blocks(s, unit.summary, u.id + '/sum');
      body.append(s);
    }
    upd();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => { for (const en of entries) if (en.isIntersecting) { mark(en.target.dataset.sec); io.unobserve(en.target); } }, { threshold: 0.25 });
      sections.forEach(s => io.observe(s));
    }
    const tl = el('p', 'tolist'); tl.append(link('#/' + u.id + '/practice', S.practice + ' →', 'btn')); body.append(tl);
  }
  const starsText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  function practiceView(body, u, unit) {
    if (!unit.types.length) { body.append(el('p', '', S.noTypes)); return; }
    const top = el('div', 'practicetop');
    top.append(el('h3', 'sectitle', S.types), link('#/' + u.id + '/mix', S.mixAll, 'btn primary'));
    body.append(top);
    const ul = el('ul', 'tlist');
    for (const t of unit.types) {
      const li = el('li');
      const a = link('#/' + u.id + '/t/' + encodeURIComponent(t.id), '', 'trow');
      const n = P.stars(prog, t.id);
      a.append(richEl('span', 'ttitle', t.title));
      if (t.mirrors && t.mirrors.length) a.append(el('span', 'tmirrors', t.mirrors.join(', ')));
      const st = el('span', 'stars' + (P.mastered(prog, t.id) ? ' full' : ''), starsText(n));
      st.setAttribute('role', 'img'); st.setAttribute('aria-label', `${n}/3`);
      a.append(st);
      li.append(a); ul.append(li);
    }
    body.append(ul);
  }

  /* ---------- the exercise player ---------- */
  function newSt(p, k) {
    const step = p.problem.steps[k];
    const st = { k, status: 'active', entry: null, tries: 0, hintOpen: false, fb: null, bad: null, ok: null, perm: null, rperm: null };
    const seed = (p.seed || 0) * 7919 + k * 31 + 1;
    const mk = (n, avoidIdentity) => {
      let perm = CK.shuffleWith(CK.rng(seed), [...Array(n).keys()]);
      if (avoidIdentity && n > 1 && perm.every((v, i) => v === i)) perm = perm.slice(1).concat(perm[0]);
      return perm;
    };
    switch (step.kind) {
      case 'choice': st.perm = mk(step.options.length); st.entry = null; break;
      case 'multi': st.perm = mk(step.options.length); st.entry = []; break;
      case 'order': st.perm = mk(step.options.length, true); st.entry = st.perm.slice(); break;
      case 'atoms': st.entry = []; break;
      case 'match': st.rperm = mk(step.answer.right.length); st.entry = step.answer.left.map(() => null); break;
      default: st.entry = '';
    }
    return st;
  }
  function makePlay(mode, unit, type, seed, extra) {
    let problem;
    try { problem = CK.makeProblem(type, seed); } catch (e) { return null; }
    if (!problem || CK.validateProblem(problem).length) return null;
    let p;
    try { p = Object.assign({ mode, unit, type, seed, problem, k: 0, steps: [], finished: false, firstTry: true, hinted: false, focus: 'title' }, extra || {}); p.steps.push(newSt(p, 0)); } catch (e) { return null; }
    return p;
  }
  const hasEntry = (step, e) => {
    switch (step.kind) {
      case 'choice': return isInt(e);
      case 'multi': case 'atoms': return Array.isArray(e) && e.length > 0;
      case 'order': return Array.isArray(e);
      case 'match': return Array.isArray(e) && e.every(x => x !== null && x !== undefined);
      default: return typeof e === 'string' && e.trim() !== '';
    }
  };

  // --- widgets: each builds into a container, keeps its state in st.entry, and reports changes with st.bad cleared
  function widget(p, st, step, locked) {
    const w = el('div', 'widget w-' + step.kind);
    const done = st.status !== 'active';
    const cls = st.status === 'done' ? 'right' : st.status === 'shown' ? 'shown' : '';
    const edited = () => { st.bad = null; st.fb = null; const fb = w.closest('.step') && w.closest('.step').querySelector('.fb'); if (fb) { fb.textContent = ''; fb.className = 'fb'; } w.querySelectorAll('.bad').forEach(x => x.classList.remove('bad')); };
    const letters = 'abcdefghijkl';
    switch (step.kind) {
      case 'choice': case 'multi': {
        const box = el('div', 'opts'); box.setAttribute('role', 'group');
        st.perm.forEach((oi, j) => {
          const b = el('button', 'opt'); b.type = 'button';
          const sel = step.kind === 'choice' ? st.entry === oi : st.entry.includes(oi);
          b.setAttribute('aria-pressed', sel ? 'true' : 'false');
          b.append(el('span', 'optkey', `(${letters[j]})`), optionContent(el('span', 'optbody'), step.options[oi]));
          if (sel && cls) b.classList.add(cls);
          if (st.bad && sel) b.classList.add('bad');
          if (locked) b.disabled = true;
          b.addEventListener('click', () => {
            if (step.kind === 'choice') { st.entry = oi; box.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); }
            else { const at = st.entry.indexOf(oi); if (at >= 0) st.entry.splice(at, 1); else st.entry.push(oi); b.setAttribute('aria-pressed', at >= 0 ? 'false' : 'true'); }
            edited();
          });
          box.append(b);
        });
        w.append(box);
        break;
      }
      case 'atoms': w.append(atomsWidget(p, st, step, locked, cls, edited)); break;
      case 'order': {
        const ol = el('ol', 'order');
        const draw = (focusPos, dir) => {
          clear(ol);
          st.entry.forEach((oi, pos) => {
            const li = el('li', 'orderitem' + (cls ? ' ' + cls : ''));
            li.append(el('span', 'ordno', String(pos + 1)), optionContent(el('span', 'optbody'), step.options[oi]));
            const label = plain(step.options[oi].text) || letters[st.perm.indexOf(oi)] || String(pos + 1);
            const up = button('↑', 'mv up'), dn = button('↓', 'mv down');
            up.setAttribute('aria-label', `${S.up}: ${label} (${S.position(pos + 1, st.entry.length)})`);
            dn.setAttribute('aria-label', `${S.down}: ${label} (${S.position(pos + 1, st.entry.length)})`);
            up.disabled = locked || pos === 0; dn.disabled = locked || pos === st.entry.length - 1;
            const move = d => () => { const t = st.entry[pos]; st.entry[pos] = st.entry[pos + d]; st.entry[pos + d] = t; edited(); draw(pos + d, d); };
            up.addEventListener('click', move(-1)); dn.addEventListener('click', move(1));
            li.append(up, dn); ol.append(li);
          });
          if (focusPos !== undefined) {
            const li = ol.children[focusPos];
            let b = li && li.querySelector(dir < 0 ? '.up' : '.down');
            if (b && b.disabled) b = li.querySelector(dir < 0 ? '.down' : '.up');
            if (b) b.focus();
          }
        };
        draw(); w.append(ol);
        break;
      }
      case 'number': case 'name': case 'formula': {
        const i = el('input', 'in in-' + step.kind); i.type = 'text';
        i.autocomplete = 'off'; i.spellcheck = false; i.setAttribute('autocapitalize', 'off'); i.setAttribute('autocorrect', 'off');
        if (step.kind === 'number') i.setAttribute('inputmode', 'decimal');
        i.setAttribute('aria-label', step.kind === 'number' ? S.numberFor : step.kind === 'name' ? S.nameFor : S.formulaFor);
        if (step.kind === 'formula') i.placeholder = S.typeFormula;
        i.value = st.entry || '';
        if (cls) i.classList.add(cls);
        if (st.bad) i.classList.add('bad');
        if (locked) i.disabled = true;
        i.addEventListener('input', () => { st.entry = i.value; i.classList.remove('bad'); edited(); });
        w.append(i);
        break;
      }
      case 'match': {
        const a = step.answer;
        const textOnly = a.right.every(o => o.text !== undefined);
        if (!textOnly) {
          const legend = el('ol', 'legend');
          st.rperm.forEach((ri, j) => { const li = el('li'); li.append(el('span', 'optkey', `(${letters[j]})`), optionContent(el('span', 'optbody'), a.right[ri])); legend.append(li); });
          w.append(legend);
        }
        const rows = el('div', 'matchrows');
        a.left.forEach((lo, li) => {
          const row = el('div', 'matchrow' + (cls ? ' ' + cls : ''));
          const lab = el('div', 'matchleft'); optionContent(lab, lo); row.append(lab);
          const sel = el('select', 'matchsel'); sel.setAttribute('aria-label', S.matchWith + ': ' + (plain(lo.text) || String(li + 1)));
          const o0 = el('option', '', S.choose); o0.value = ''; sel.append(o0);
          st.rperm.forEach((ri, j) => { const o = el('option', '', textOnly ? plain(a.right[ri].text) : `(${letters[j]})`); o.value = String(ri); sel.append(o); });
          sel.value = st.entry[li] === null || st.entry[li] === undefined ? '' : String(st.entry[li]);
          if (st.bad && st.bad.includes(li)) sel.classList.add('bad');
          if (locked) sel.disabled = true;
          sel.addEventListener('change', () => { st.entry[li] = sel.value === '' ? null : parseInt(sel.value, 10); edited(); });
          row.append(sel); rows.append(row);
        });
        w.append(rows);
        break;
      }
    }
    return w;
  }

  function atomsWidget(p, st, step, locked, cls, edited) {
    const wrap = el('div', 'atomsw');
    const bonds = !!step.bonds;
    wrap.append(el('p', 'tapnote', bonds ? S.tapBonds : S.tapAtoms));
    const keyOf = v => bonds ? Math.min(v[0], v[1]) + '-' + Math.max(v[0], v[1]) : String(v);
    const has = v => st.entry.some(x => keyOf(x) === keyOf(v));
    let mol = null;
    if (ORG.chem && ORG.chem.parse) { try { mol = ORG.chem.parse(step.mol.smi); } catch (e) { mol = null; } }
    const labelOf = v => !mol ? `${bonds ? S.bondWord : S.atomWord} ${bonds ? v.join('-') : v}` : bonds ? `${mol.atoms[v[0]].el}${v[0] + 1}–${mol.atoms[v[1]].el}${v[1] + 1}` : `${mol.atoms[v].el}${v + 1}`;
    const targets = [];
    const paint = (node, v) => {
      const on = has(v);
      node.classList.toggle('sel', on); node.setAttribute('aria-pressed', on ? 'true' : 'false');
      node.classList.toggle('ok', on && cls === 'right'); node.classList.toggle('shownsel', on && cls === 'shown');
      node.classList.toggle('bad', on && !!st.bad);
    };
    const toggle = (node, v) => {
      if (locked) return;
      const at = st.entry.findIndex(x => keyOf(x) === keyOf(v));
      if (at >= 0) st.entry.splice(at, 1); else st.entry.push(bonds ? [Math.min(v[0], v[1]), Math.max(v[0], v[1])] : v);
      edited(); targets.forEach(t => paint(t.node, t.v));
    };
    const wire = (node, v) => {
      node.setAttribute('tabindex', locked ? '-1' : '0'); node.setAttribute('role', 'button');
      if (!node.getAttribute('aria-label')) node.setAttribute('aria-label', labelOf(v));
      node.addEventListener('click', () => toggle(node, v));
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(node, v); } });
      targets.push({ node, v }); paint(node, v);
    };
    const zoom = !!st.zoom;
    const r = drawing(step.mol, zoom ? { targets: bonds ? 'bonds' : 'atoms', maxWidth: 0 } : { targets: bonds ? 'bonds' : 'atoms' });
    if (r) {
      if (zoom) fit(r.svg, r.d, 1.6);
      if (!locked && (narrow() || (r.d && r.d.scale && r.d.scale < 1) || zoom)) {
        const z = button(zoom ? S.unzoom : S.zoom, 'btn zoombtn', () => { st.zoom = !st.zoom; p.focus = 'zoom'; if (p.hooks) p.hooks.redraw(); });
        z.dataset.fid = 'zoom'; z.setAttribute('aria-pressed', zoom ? 'true' : 'false'); wrap.append(z);
      }
      const box = el('div', 'molbox tap' + (zoom ? ' zoombox' : '')); box.append(r.svg); wrap.append(box);
      r.svg.querySelectorAll(bonds ? '[data-bond]' : '[data-atom]').forEach(n => {
        const v = bonds ? String(n.getAttribute('data-bond')).split('-').map(Number) : Number(n.getAttribute('data-atom'));
        if (bonds ? v.length === 2 && v.every(isInt) : isInt(v)) wire(n, v);
      });
    } else {
      // no drawing yet: the structure as text and a plain list of buttons, so the step still works
      wrap.append(molNode(step.mol));
      if (mol) {
        const list = el('div', 'taplist');
        const items = bonds ? mol.bonds.map(b => [b.a, b.b]) : mol.atoms.map((_, i) => i);
        for (const v of items) { const b = el('button', 'opt tapbtn', labelOf(v)); b.type = 'button'; list.append(b); wire(b, v); }
        wrap.append(list);
      }
    }
    return wrap;
  }

  // --- the problem sheet
  function stepFeedback(st) {
    if (!st.fb) return null;
    if (st.fb.kind === 'wrong') return [S.wrong, 'no'];
    if (st.fb.kind === 'pick') return [S.pick, 'no'];
    return [S.right, 'yes'];
  }
  function renderSheet(p, host, hooks) {
    try { renderSheetUnsafe(p, host, hooks); } catch (e) { inset = 0; clear(host); host.append(lostBox()); }
  }
  function renderSheetUnsafe(p, host, hooks) {
    p.hooks = hooks;
    const base = narrow() ? 28 : 52;
    inset = base;
    clear(host);
    const prob = p.problem;
    const sheet = el('div', 'sheet');
    const head = el('div', 'phead');
    const title = richEl('h2', 'ptitle', p.type.title); title.tabIndex = -1;
    head.append(title);
    if (p.type.mirrors && p.type.mirrors.length) head.append(el('span', 'pmirrors', S.mirrors + ': ' + p.type.mirrors.join(', ')));
    sheet.append(head);
    if (prob.q && prob.q.length) { const stmt = el('div', 'stmt'); blocks(stmt, prob.q, 'q'); sheet.append(stmt); }
    const ol = el('ol', 'steps');
    p.steps.forEach(st => { inset = base + (narrow() ? 38 : 46); ol.append(stepLi(p, st, hooks)); });
    inset = base;
    sheet.append(ol);
    if (p.finished) sheet.append(finishBar(p, hooks));
    inset = 0;
    host.append(sheet);
    // focus: the first control of the active step, or a named control
    const f = p.focus; p.focus = null;
    if (f === 'title') title.focus({ preventScroll: true });
    else if (f === 'step') {
      const act = host.querySelector('.step.active');
      const c = act && act.querySelector('input:not(:disabled), select:not(:disabled), .opt:not(:disabled), [role="button"][tabindex="0"], .mv:not(:disabled)');
      if (c) c.focus({ preventScroll: true });
      if (act) act.scrollIntoView({ block: 'nearest' });
    } else if (f === 'finish') {
      const b = host.querySelector('.finish .primary') || host.querySelector('.finish .btn');
      if (b) b.focus({ preventScroll: true });
      const fin = host.querySelector('.finish'); if (fin) fin.scrollIntoView({ block: 'nearest' });
    } else if (f) { const b = host.querySelector('[data-fid="' + f + '"]'); if (b) b.focus({ preventScroll: true }); }
  }
  function stepLi(p, st, hooks) {
    const step = p.problem.steps[st.k];
    const exam = p.mode === 'exam';
    const li = el('li', 'step ' + (exam && st.status !== 'active' ? 'answered' : st.status));
    li.append(el('div', 'no', String(st.k + 1)));
    const body = el('div', 'stepbody');
    const prompt = richEl('div', 'sq', step.prompt);
    prompt.id = `prompt-${st.k}`;
    body.append(prompt);
    if (step.mol && step.kind !== 'atoms') { const mb = el('div', 'stepmol'); mb.append(molNode(step.mol)); body.append(mb); }
    const locked = st.status !== 'active';
    const w = widget(p, st, step, locked);
    w.setAttribute('aria-labelledby', prompt.id);
    body.append(w);
    if (!locked) {
      const acts = el('div', 'acts');
      const bCheck = button(exam ? S.answer : S.check, 'btn primary', () => hooks.check(st));
      bCheck.dataset.fid = 'check';
      acts.append(bCheck);
      if (!exam) {
        const bHint = button(S.hint, 'btn', () => { st.hintOpen = true; p.hinted = true; p.focus = 'hint'; hooks.redraw(); });
        bHint.dataset.fid = 'hint';
        const bShow = button(S.show, 'btn', () => hooks.show(st));
        acts.append(bHint, bShow);
      }
      const fb = el('span', 'fb'); fb.setAttribute('role', 'status'); acts.append(fb);
      const f = stepFeedback(st); if (f) { fb.textContent = f[0]; fb.classList.add(f[1]); }
      body.append(acts);
      if (st.hintOpen && !exam) { const hbox = el('div', 'hint'); hbox.append(el('span', 'tag', S.hint)); rich(hbox, step.hint); body.append(hbox); }
      bindEnter(w, bCheck);
    } else if (!exam) {
      if (st.status === 'done') {
        const note = el('p', 'fb yes', S.right); body.append(note);
        if (st.note) body.append(richEl('p', 'fb note', st.note));
      }
      if (p.reveal) { const hbox = el('div', 'hint'); hbox.append(el('span', 'tag', S.hint)); rich(hbox, step.hint); body.append(hbox); }
      body.append(solutionBox(step, st.status));
    }
    li.append(body);
    return li;
  }
  function bindEnter(w, btn) {
    w.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } }));
  }
  function solutionBox(step, status) {
    const s = el('div', 'sol' + (status === 'shown' ? ' shown' : ''));
    s.append(el('span', 'tag', S.solution));
    if (Array.isArray(step.solution)) { const inner = el('div', 'solbody'); blocks(inner, step.solution, 'sol'); s.append(inner); } else rich(s, step.solution);
    return s;
  }
  function finishBar(p, hooks) {
    const fin = el('div', 'finish');
    if (p.problem.why && p.mode !== 'exam') {
      const why = el('div', 'why');
      why.append(el('span', 'tag', S.why));
      if (Array.isArray(p.problem.why)) { const inner = el('div', 'solbody'); blocks(inner, p.problem.why, 'why'); why.append(inner); } else rich(why, p.problem.why);
      fin.append(why);
    }
    const bar = el('div', 'finishbar');
    if (p.mode !== 'exam' && !p.reveal) bar.append(el('span', 'verdict' + (p.hinted || !p.firstTry ? ' help' : ''), p.hinted || !p.firstTry ? S.solvedHelp : S.solvedFirst));
    for (const a of hooks.finishActions()) bar.append(a);
    fin.append(bar);
    return fin;
  }

  // --- play logic, shared by practice, exam and review
  function playHooks(p, host, extra) {
    const redraw = () => renderSheet(p, host, hooks);
    const advance = () => {
      if (p.k + 1 < p.problem.steps.length) { p.k++; p.steps.push(newSt(p, p.k)); p.focus = 'step'; redraw(); } else finishPlay(p, extra, redraw);
    };
    const hooks = {
      redraw,
      check: st => {
        const step = p.problem.steps[st.k];
        if (!hasEntry(step, st.entry)) { st.fb = { kind: 'pick' }; p.focus = 'check'; redraw(); return; }
        const r = CK.checkStep(step, st.entry, lang);
        st.tries++;
        if (p.mode === 'exam') { st.ok = !!r.ok; st.status = 'answered'; advance(); return; }
        if (r.ok) { st.status = 'done'; st.note = r.note || null; st.ok = st.tries === 1; if (st.tries > 1) p.firstTry = false; advance(); return; }
        p.firstTry = false; st.fb = { kind: 'wrong' }; st.bad = r.bad || true;
        p.focus = 'check'; redraw();
      },
      show: st => {
        const step = p.problem.steps[st.k];
        st.entry = CK.answerEntry(step, lang); st.status = 'shown'; st.ok = false; p.firstTry = false; p.hinted = true;
        advance();
      },
      finishActions: () => extra.actions(p, redraw)
    };
    return hooks;
  }
  function finishPlay(p, extra, redraw) {
    p.finished = true;
    const right = p.steps.filter(s => s.ok).length;
    p.right = right;
    if (!p.recorded) {
      p.recorded = true;
      P.record(prog, p.type.id, { firstTry: p.mode === 'exam' ? right === p.steps.length : p.firstTry, hinted: p.hinted, problemRef: { type: p.type.id, seed: p.seed } });
      saveProg();
    }
    p.focus = 'finish';
    redraw();
    if (extra.onFinish) extra.onFinish(p);
  }
  function pickSeed(type, last) {
    if (type.bank && type.bank.length) {
      const n = type.bank.length;
      if (n === 1) return 0;
      let s; do { s = Math.floor(Math.random() * n); } while (s === last);
      return s;
    }
    return rand();
  }
  function freshPlay(mode, unit, type, last, extra) {
    for (let tries = 0; tries < 5; tries++) {
      const p = makePlay(mode, unit, type, pickSeed(type, last), extra);
      if (p) return p;
    }
    return null;
  }
  function lostBox() { const b = el('div', 'notice'); b.setAttribute('role', 'alert'); b.append(el('p', '', S.lost), link('#/', S.home, 'btn')); return b; }

  /* ---- a single type, or a mix of a unit's types */
  function renderType(my) {
    const u = route.unit;
    app.append(link('#/' + u.id + '/practice', S.listBack, 'backlink'));
    const host = el('div', 'playhost'); app.append(host);
    host.append(el('p', 'loading', S.loading));
    getUnit(u.id).then(unit => {
      if (!alive(my)) return;
      const type = unit.types.find(t => t.id === route.typeId);
      if (!type) { clear(host); host.append(unavailable(null)); return; }
      doc.title = plain(type.title) + ' – ' + S.title;
      const extra = { actions: () => {
        const out = [button(S.another, 'btn primary', () => { sess.play = freshPlay('practice', u, type, sess.play && sess.play.seed, {}); sess.mount(); })];
        const nxt = unit.types[(unit.types.indexOf(type) + 1) % unit.types.length];
        if (unit.types.length > 1) out.push(link('#/' + u.id + '/t/' + encodeURIComponent(nxt.id), S.nextType, 'btn'));
        return out;
      } };
      if (!sess) { sess = { key: route.key }; sess.play = freshPlay('practice', u, type, null, {}); }
      sess.mount = () => { if (!sess.play) { clear(host); host.append(lostBox()); return; } renderSheet(sess.play, host, playHooks(sess.play, host, extra)); };
      sess.mount();
    }, () => { if (!alive(my)) return; clear(host); host.append(unavailable(() => render())); }).catch(() => { if (alive(my)) { clear(host); host.append(lostBox()); } });
  }
  function renderMix(my) {
    const u = route.unit;
    app.append(link('#/' + u.id + '/practice', S.listBack, 'backlink'));
    const host = el('div', 'playhost'); app.append(host);
    host.append(el('p', 'loading', S.loading));
    getUnit(u.id).then(unit => {
      if (!alive(my)) return;
      if (!unit.types.length) { clear(host); host.append(unavailable(null)); return; }
      doc.title = S.mixTitle + ' – ' + plain(u.title);
      const nextPlay = () => {
        // favour the types with the fewest stars so a mix covers everything
        const w = unit.types.map(t => 1 / (1 + P.stars(prog, t.id)) * (sess.last === t.id && unit.types.length > 1 ? 0 : 1));
        let r = Math.random() * w.reduce((a, b) => a + b, 0), type = unit.types[0];
        for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) { type = unit.types[i]; break; } }
        sess.last = type.id;
        return freshPlay('practice', u, type, null, {});
      };
      const extra = { actions: () => [button(S.another, 'btn primary', () => { sess.play = nextPlay(); sess.mount(); })] };
      if (!sess) { sess = { key: route.key, last: null }; sess.play = nextPlay(); }
      sess.mount = () => { if (!sess.play) { clear(host); host.append(lostBox()); return; } renderSheet(sess.play, host, playHooks(sess.play, host, extra)); };
      sess.mount();
    }, () => { if (!alive(my)) return; clear(host); host.append(unavailable(() => render())); }).catch(() => { if (alive(my)) { clear(host); host.append(lostBox()); } });
  }

  /* ---- review of missed problems */
  function renderReview(my) {
    app.append(link('#/', S.back, 'backlink'));
    const h = el('h2', 'pagetitle', S.reviewHead); h.tabIndex = -1; app.append(h);
    const host = el('div', 'playhost'); app.append(host);
    doc.title = S.reviewHead + ' – ' + S.title;
    if (!sess) {
      const list = P.reviewQueue(prog).filter(r => unitOfType(r.type));
      if (!list.length) { host.append(el('p', 'plain', S.reviewEmpty), link('#/', S.home, 'btn')); return; }
      sess = { key: route.key, list, i: 0, play: null };
    }
    const show = () => {
      const s = sess;
      if (s.i >= s.list.length) { clear(host); host.append(el('p', 'plain', S.reviewDone(P.reviewQueue(prog).length)), link('#/', S.home, 'btn')); return; }
      clear(host); host.append(el('p', 'loading', S.loading));
      const ref = s.list[s.i], un = unitOfType(ref.type);
      const skip = () => { s.i++; show(); };
      if (!un) return skip();
      getUnit(un.id).then(unit => {
        if (!alive(my) || sess !== s) return;
        const type = unit.types.find(t => t.id === ref.type);
        if (!type) { P.forget(prog, ref); saveProg(); return skip(); }
        s.play = makePlay('review', un, type, ref.seed, { ref });
        if (!s.play) { P.forget(prog, ref); saveProg(); return skip(); }
        s.mount();
      }, () => { if (!alive(my) || sess !== s) return; clear(host); host.append(unavailable(skip)); }).catch(() => { if (alive(my)) { clear(host); host.append(lostBox()); } });
    };
    sess.mount = () => {
      const s = sess; if (!s.play) return show();
      const extra = { actions: () => [button(s.i + 1 < s.list.length ? S.nextMissed : S.seeResult, 'btn primary', () => { s.i++; s.play = null; show(); })] };
      const wrapHost = clear(host);
      wrapHost.append(el('p', 'plain muted', S.reviewLeft(s.list.length - s.i)));
      const sh = el('div'); wrapHost.append(sh);
      renderSheet(s.play, sh, playHooks(s.play, sh, extra));
    };
    sess.show = show;
    if (sess.play) sess.mount(); else show();
  }

  /* ---- exam practice */
  function renderExam(my) {
    const kind = route.exam, info = P.EXAMS[kind];
    app.append(link('#/', S.back, 'backlink'));
    const h = el('h2', 'pagetitle', S.examHead[kind]); h.tabIndex = -1; app.append(h);
    app.append(el('p', 'plain muted', S.examNote));
    const host = el('div', 'playhost'); app.append(host);
    doc.title = S.examHead[kind] + ' – ' + S.title;
    const build = () => {
      clear(host); host.append(el('p', 'loading', S.examLoading));
      const units = ORG.examUnits(kind);
      Promise.all(units.map(u => getUnit(u.id).then(x => x, () => null))).then(loaded => {
        if (!alive(my)) return;
        const items = [];
        let failed = 0;
        loaded.forEach((unit, i) => {
          if (!unit) { failed++; return; }
          const usable = CK.shuffleWith(Math.random, unit.types.filter(t => (t.bank && t.bank.length) || typeof t.gen === 'function'));
          let taken = 0;
          for (const type of usable) {
            if (taken >= 2) break;
            const seed = pickSeed(type, null);
            let ok = false;
            try { ok = CK.validateProblem(CK.makeProblem(type, seed)).length === 0; } catch (e) { ok = false; }
            if (ok) { items.push({ unit: units[i], type, seed }); taken++; }
          }
        });
        const chosen = CK.shuffleWith(Math.random, items).slice(0, 10);
        sess = { key: route.key, kind, items: chosen, i: 0, plays: [], failed, play: null, done: false };
        if (!chosen.length) { clear(host); host.append(el('div', 'notice', S.examNone), link('#/', S.home, 'btn')); sess.none = true; return; }
        startItem(); mount();
      }).catch(() => { if (alive(my)) { clear(host); host.append(lostBox()); } });
    };
    const startItem = () => { const s = sess, it = s.items[s.i]; s.play = makePlay('exam', it.unit, it.type, it.seed, { index: s.i }); if (!s.play) { s.plays[s.i] = { type: it.type, unit: it.unit, right: 0, steps: 1, lost: true }; } };
    const mount = () => {
      const s = sess; clear(host);
      if (s.none) { host.append(el('div', 'notice', S.examNone), link('#/', S.home, 'btn')); return; }
      if (s.done) return examResult(host, s, kind, info, build);
      if (!s.play) { s.plays[s.i] = { lost: true }; s.i++; if (s.i >= s.items.length) s.done = true; else startItem(); return mount(); }
      if (s.failed) host.append(el('p', 'plain muted', S.examFewer(s.failed)));
      host.append(el('p', 'examprog', S.examOf(s.i + 1, s.items.length)));
      const sh = el('div'); host.append(sh);
      const last = s.i + 1 >= s.items.length;
      const extra = { actions: () => [button(last ? S.seeResult : S.nextProblem, 'btn primary', () => { s.plays[s.i] = s.play; if (last) s.done = true; else { s.i++; startItem(); } mount(); window.scrollTo(0, 0); })] };
      renderSheet(s.play, sh, playHooks(s.play, sh, extra));
    };
    if (!sess) build(); else mount();
  }
  function examResult(host, s, kind, info, rebuild) {
    const results = s.plays.map(p => p && !p.lost ? { right: p.right || 0, steps: p.steps.length } : { right: 0, steps: 1 });
    const sc = P.examScore(results, kind);
    inset = narrow() ? 50 : 70;
    const box = el('section', 'result');
    const h = el('h3', 'resulttitle', S.result); h.tabIndex = -1; box.append(h);
    box.append(el('p', 'score', S.scoreOf(sc.score, sc.max)));
    if (sc.pass !== null) box.append(el('p', 'passnote ' + (sc.pass ? 'yes' : 'no'), S.passMt2 + ' ' + (sc.pass ? S.passYes : S.passNo)));
    box.append(el('h3', 'sectitle', S.perProblem));
    s.plays.forEach((p, i) => {
      if (!p || p.lost) return;
      const d = el('details', 'exres');
      const sum = el('summary'); sum.append(el('span', 'uno', p.unit.part === 3 ? p.unit.n : p.unit.n.padStart(2, '0')), doc.createTextNode(' '), richEl('span', '', p.type.title), el('span', 'exshare ' + (p.right === p.steps.length ? 'yes' : p.right ? 'part' : 'no'), ' ' + S.stepsRight(p.right, p.steps.length)));
      d.append(sum);
      if (p.problem.q && p.problem.q.length) { const q = el('div', 'stmt'); blocks(q, p.problem.q, 'xq' + i); d.append(q); }
      p.problem.steps.forEach((step, k) => {
        const st = p.steps[k];
        const row = el('div', 'exstep');
        row.append(el('span', 'exmark ' + (st && st.ok ? 'yes' : 'no'), st && st.ok ? '✓ ' + S.gotRight : '✗ ' + S.gotWrong), richEl('div', 'sq', step.prompt), solutionBox(step, 'done'));
        d.append(row);
      });
      if (p.problem.why) { const why = el('div', 'why'); why.append(el('span', 'tag', S.why)); if (Array.isArray(p.problem.why)) { const inner = el('div', 'solbody'); blocks(inner, p.problem.why, 'xw' + i); why.append(inner); } else rich(why, p.problem.why); d.append(why); }
      box.append(d);
    });
    const bar = el('div', 'finishbar');
    bar.append(button(S.newTry, 'btn primary', () => { sess = null; rebuild(); }), link('#/review', S.toReview, 'btn'), link('#/', S.home, 'btn ghost'));
    box.append(bar);
    host.append(box);
    inset = 0;
    h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- header: language, reset ---------- */
  function applyLang() {
    S = STR[lang];
    doc.documentElement.lang = lang;
    doc.title = S.title;
    const brand = doc.getElementById('brand');
    clear(brand); brand.append(doc.createTextNode(S.brand[0]), el('b', '', S.brand[1]));
    doc.getElementById('reset').textContent = S.reset;
    doc.getElementById('langs').setAttribute('aria-label', S.langLabel);
    doc.querySelectorAll('#langs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
  }
  doc.querySelectorAll('#langs button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang === 'en' ? 'en' : 'lt'; saveLang(); applyLang();
    const y = window.scrollY, active = doc.activeElement && doc.activeElement.dataset ? doc.activeElement.dataset.fid : null;
    if (sess && sess.play && !sess.play.focus) sess.play.focus = active || null;
    render();
    window.scrollTo(0, y);
  }));
  let armed = false;
  const resetBtn = doc.getElementById('reset');
  resetBtn.addEventListener('click', () => {
    if (!armed) { armed = true; resetBtn.textContent = S.reset2; setTimeout(() => { armed = false; resetBtn.textContent = S.reset; }, 4000); return; }
    prog = P.load(null); saveProg(); armed = false; resetBtn.textContent = S.reset;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    sess = null; render();
  });

  let resizeTimer = 0, lastW = app.clientWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (Math.abs(app.clientWidth - lastW) < 8) return;
      lastW = app.clientWidth;
      if (ORG.ui && ORG.ui.onResize) { ORG.ui.onResize(); return; }
      const y = window.scrollY; render(); window.scrollTo(0, y);
    }, 200);
  });
  window.addEventListener('hashchange', () => { go(false); window.scrollTo(0, 0); });
  /* ---------- for the author playground (tools/organic/playground.js): the same renderers, outside the page flow ---------- */
  const setLang = l => { lang = l === 'en' ? 'en' : 'lt'; S = STR[lang]; doc.documentElement.lang = lang; };
  ORG.ui = {
    onResize: null,
    setLang,
    // blocks of notes (molecules, schemes, mechanisms, worked examples with every step shown) into a container
    renderBlocks(container, list, l, path) {
      setLang(l); inset = 0; revealAll = true;
      try { blocks(container, list, path || 'pg'); } finally { revealAll = false; }
    },
    // one problem with every step answered: the right options marked, the hint, the solution and the why shown
    renderProblem(container, problem, l, opts) {
      setLang(l);
      const type = (opts && opts.type) || { title: { lt: '', en: '' }, mirrors: [] };
      const p = { mode: 'practice', unit: null, type, seed: 0, problem, k: problem.steps.length - 1, steps: [], finished: true, firstTry: true, hinted: false, reveal: true, focus: null };
      problem.steps.forEach((step, k) => {
        const st = newSt(p, k);
        if (st.perm) st.perm = st.perm.map((_, i) => i);
        if (st.rperm) st.rperm = st.rperm.map((_, i) => i);
        st.entry = CK.answerEntry(step, lang);
        st.status = 'shown'; st.ok = false;
        p.steps.push(st);
      });
      renderSheet(p, container, { redraw() {}, check() {}, show() {}, finishActions: () => [] });
    }
  };

  applyLang();
  go(true);
})(globalThis.ORG = globalThis.ORG || {});
