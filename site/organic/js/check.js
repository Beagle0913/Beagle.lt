/* Text markup, answer checking, unit validation and problem making. No DOM here. */
(function (ORG) {
  'use strict';
  const check = ORG.check = ORG.check || {};
  const MINUS = '−';

  /* ---------- inline markup ---------- */
  // markup(str) -> [{text, b?, i?, sub?, sup?}]. **bold**, *italic*, $formula$ (digits after a letter or ")" are subscripts,
  // a trailing + - or radical dot is a superscript, ^...^ forces a superscript). Anything else, including "<" and "$" alone, is plain text.
  function markup(str) {
    const out = [];
    if (typeof str !== 'string' || !str) return out;
    const add = (text, f) => {
      if (!text) return;
      const last = out[out.length - 1];
      if (last && !!last.b === !!f.b && !!last.i === !!f.i && !!last.sub === !!f.sub && !!last.sup === !!f.sup) { last.text += text; return; }
      const s = { text };
      if (f.b) s.b = true;
      if (f.i) s.i = true;
      if (f.sub) s.sub = true;
      if (f.sup) s.sup = true;
      out.push(s);
    };
    let parts = str.split('$');
    if (parts.length % 2 === 0) parts = parts.slice(0, -2).concat([parts[parts.length - 2] + '$' + parts[parts.length - 1]]);
    let b = false, it = false;
    parts.forEach((part, k) => {
      if (k % 2 === 0) {
        let buf = '';
        for (let n = 0; n < part.length; n++) {
          const c = part[n];
          if (c === '*') {
            add(buf, { b, i: it }); buf = '';
            if (part[n + 1] === '*') { b = !b; n++; } else it = !it;
          } else buf += c;
        }
        add(buf, { b, i: it });
      } else formula(part, b, it, add);
    });
    return out;
  }
  const isLetter = c => /[A-Za-z]/.test(c);
  function formula(f, b, it, add) {
    let bits = f.split('^');
    if (bits.length % 2 === 0) bits = bits.slice(0, -2).concat([bits[bits.length - 2] + '^' + bits[bits.length - 1]]);
    bits.forEach((bit, k) => {
      if (k % 2 === 1) { add(bit.replace(/-/g, MINUS), { b, i: it, sup: true }); return; }
      let charge = '';
      if (k === bits.length - 1) {
        const m = bit.match(/(\d*)([+\-−])$/);
        if (m) {
          let digits = m[1];
          const before = bit[bit.length - m[0].length - 1];
          if (digits && before && (isLetter(before) || before === ')')) digits = '';
          charge = digits + m[2];
        } else if (bit.endsWith('•')) charge = '•';
      }
      const body = charge ? bit.slice(0, bit.length - charge.length) : bit;
      let buf = '';
      for (let n = 0; n < body.length; n++) {
        const c = body[n];
        if (/\d/.test(c)) {
          let e = n; while (e < body.length && /\d/.test(body[e])) e++;
          const prev = n > 0 ? body[n - 1] : '';
          if (prev && (isLetter(prev) || prev === ')')) { add(buf, { b, i: it }); buf = ''; add(body.slice(n, e), { b, i: it, sub: true }); } else buf += body.slice(n, e);
          n = e - 1;
        } else buf += c;
      }
      add(buf, { b, i: it });
      if (charge) add(charge.replace(/-/g, MINUS), { b, i: it, sup: true });
    });
  }
  check.markup = markup;

  /* ---------- names ---------- */
  const FOLD = { 'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z' };
  const fold = s => s.replace(/[ąčęėįšųūž]/g, c => FOLD[c]).normalize('NFD').replace(/[̀-ͯ]/g, '');
  // key: lower case, with spaces, dashes and brackets removed (letters, digits and commas stay). folded: the same without Lithuanian letters.
  function normName(s) {
    let x = (typeof s === 'string' ? s : '').normalize('NFC').toLowerCase();
    // every separator (spaces, any dash or minus, brackets) is dropped; primes are kept on both sides, so "N metil", "N-metil" and "(E)-2-" compare equal
    x = x.replace(/″/g, "''").replace(/[′’‘`´]/g, "'"); // primes (N,N') are part of the name
    x = x.replace(/[‐-―−﹘﹣－­]/g, '').replace(/[-()\[\]{}\s  -​]/g, '');
    x = x.replace(/;/g, ',').replace(/,{2,}/g, ',').replace(/^,+|,+$/g, '');
    return { key: x, folded: fold(x) };
  }
  check.normName = normName;

  /* ---------- formulas ---------- */
  const ELEMENTS = new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U'.split(' '));
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  // "C5H12", "C₅H₁₂", "Ca(OH)2", "SO4^2-" -> {counts, charge} or null
  function parseFormula(raw) {
    if (typeof raw !== 'string') return null;
    let s = raw.replace(/[₀-₉]/g, c => String(SUB.indexOf(c))).replace(/[\s ]/g, '');
    let charge = 0;
    let m = s.match(/\^(\d*)([+\-−])\^?$/);
    if (m) { charge = (m[1] ? +m[1] : 1) * (m[2] === '+' ? 1 : -1); s = s.slice(0, m.index); }
    else if ((m = s.match(/([+\-−])$/))) { charge = m[1] === '+' ? 1 : -1; s = s.slice(0, -1); }
    if (!s) return null;
    let pos = 0;
    const group = close => {
      const counts = {};
      while (pos < s.length) {
        const c = s[pos];
        if (c === ')' || c === ']') { if (close === c) return counts; return null; }
        if (c === '(' || c === '[') {
          pos++;
          const inner = group(c === '(' ? ')' : ']');
          if (!inner) return null;
          pos++;
          const n = num();
          for (const k in inner) counts[k] = (counts[k] || 0) + inner[k] * n;
        } else if (/[A-Z]/.test(c)) {
          let el = c; pos++;
          if (pos < s.length && /[a-z]/.test(s[pos]) && ELEMENTS.has(el + s[pos])) { el += s[pos]; pos++; }
          if (!ELEMENTS.has(el)) return null;
          counts[el] = (counts[el] || 0) + num();
        } else return null;
      }
      return close ? null : counts;
    };
    const num = () => { let e = pos; while (e < s.length && /\d/.test(s[e])) e++; const n = e > pos ? parseInt(s.slice(pos, e), 10) : 1; pos = e; return n; };
    const counts = group(null);
    if (!counts) return null;
    for (const k in counts) if (!counts[k]) delete counts[k];
    return { counts, charge };
  }
  check.parseFormula = parseFormula;
  const sameFormula = (a, b) => {
    const A = parseFormula(a), B = parseFormula(b);
    if (!A || !B || A.charge !== B.charge) return false;
    const ka = Object.keys(A.counts), kb = Object.keys(B.counts);
    return ka.length === kb.length && ka.every(k => A.counts[k] === B.counts[k]);
  };

  /* ---------- checking ---------- */
  const isInt = v => Number.isInteger(v);
  const sortedInts = a => Array.isArray(a) && a.every(isInt) ? Array.from(new Set(a)).sort((x, y) => x - y) : null;
  const sameList = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  const pairKeys = a => Array.isArray(a) && a.every(p => Array.isArray(p) && p.length === 2 && isInt(p[0]) && isInt(p[1])) ? Array.from(new Set(a.map(p => Math.min(p[0], p[1]) + '-' + Math.max(p[0], p[1])))).sort() : null;

  // The atoms a step wants, recomputed from the engine when the step says `from` instead of listing them.
  function recompute(step) {
    const C = ORG.chem, S = ORG.stereo;
    if (!C || !step || !step.mol || typeof step.from !== 'string') return null;
    let mol;
    try { mol = C.parse(step.mol.smi); } catch (e) { return null; }
    const idx = [...mol.atoms.keys()];
    const f = step.from;
    let m;
    if (f === 'stereocentres') return S && S.stereocentres ? S.stereocentres(mol).slice().sort((a, b) => a - b) : null;
    if ((m = f.match(/^carbon:([1-4])$/))) return idx.filter(i => mol.atoms[i].el === 'C' && C.carbonClass(mol, i) === +m[1]);
    if ((m = f.match(/^hyb:(sp|sp2|sp3)$/))) return idx.filter(i => C.hybridization(mol, i) === m[1]);
    if (f === 'conjugated') return Array.from(new Set(C.conjugated(mol).flat())).sort((a, b) => a - b);
    if (f === 'aromatic') return C.aromaticAtoms(mol).slice().sort((a, b) => a - b);
    return null;
  }
  check.recompute = recompute;

  function parseNumber(v) {
    if (typeof v === 'number') return v;
    if (typeof v !== 'string') return NaN;
    const s = v.replace(/[‐-―−]/g, '-').replace(/\s+/g, '').replace(',', '.');
    return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
  }

  function acceptedNames(step, lang) {
    const a = step.answer || {};
    let list = Array.isArray(a[lang]) ? a[lang].slice() : typeof a[lang] === 'string' ? [a[lang]] : [];
    if (typeof a.smi === 'string' && ORG.name && ORG.name.name) {
      try {
        const r = ORG.name.name(a.smi, { lang });
        if (r) list = list.concat([r.name], r.alts || []);
      } catch (e) { /* the namer could not name it: only the written names count */ }
    }
    // names the author lists as also right (extra) count for the learner; the first name stays the main one
    const ex = a.extra && a.extra[lang];
    if (Array.isArray(ex)) list = list.concat(ex); else if (typeof ex === 'string') list.push(ex);
    return list.filter(x => typeof x === 'string' && x);
  }

  const noteSpelling = name => ({ lt: 'Teisingas rašymas: ' + name, en: 'Correct spelling: ' + name });

  function checkStepInner(step, input, lang) {
    const ans = step.answer;
    switch (step.kind) {
      case 'choice': return { ok: isInt(input) && input === ans };
      case 'multi': { const a = sortedInts(input), b = sortedInts(ans); return { ok: sameList(a, b) && a.length === (input || []).length }; }
      case 'atoms': {
        const want = ans !== undefined ? ans : recompute(step);
        if (!Array.isArray(want)) return { ok: false };
        if (step.bonds) { const a = pairKeys(input), b = pairKeys(want); return { ok: !!a && !!b && sameList(a, b) }; }
        const a = sortedInts(input), b = sortedInts(want);
        return { ok: !!a && sameList(a, b) };
      }
      case 'order': {
        const n = Array.isArray(step.options) ? step.options.length : 0;
        return { ok: Array.isArray(input) && input.length === n && n > 0 && input.every((v, i) => v === i) };
      }
      case 'number': {
        const v = parseNumber(input);
        if (!ans || !isFinite(v)) return { ok: false };
        const tol = (ans.tol || 0) + 1e-9 * Math.max(1, Math.abs(ans.value));
        return { ok: Math.abs(v - ans.value) <= tol };
      }
      case 'name': {
        const u = normName(input);
        if (!u.key) return { ok: false };
        let folded = null;
        for (const a of acceptedNames(step, lang)) {
          const n = normName(a);
          if (n.key === u.key) return { ok: true };
          if (!folded && n.folded === u.folded) folded = a;
        }
        return folded ? { ok: true, note: noteSpelling(folded) } : { ok: false };
      }
      case 'formula': return { ok: typeof input === 'string' && sameFormula(input, ans) };
      case 'match': {
        const pairs = ans && ans.pairs;
        if (!Array.isArray(pairs) || !Array.isArray(input)) return { ok: false };
        const bad = [];
        pairs.forEach((p, i) => { if (input[i] !== p) bad.push(i); });
        return bad.length ? { ok: false, bad } : { ok: true };
      }
      default: return { ok: false };
    }
  }
  check.checkStep = function (step, input, lang) {
    try { return checkStepInner(step || {}, input, lang === 'en' ? 'en' : 'lt'); } catch (e) { return { ok: false }; }
  };

  // The entry that checks as right (for "show the answer").
  check.answerEntry = function (step, lang) {
    lang = lang === 'en' ? 'en' : 'lt';
    const a = step.answer;
    switch (step.kind) {
      case 'choice': return a;
      case 'multi': return Array.isArray(a) ? a.slice() : [];
      case 'atoms': { const w = a !== undefined ? a : recompute(step); return Array.isArray(w) ? w.map(x => Array.isArray(x) ? x.slice() : x) : []; }
      case 'order': return (step.options || []).map((_, i) => i);
      case 'number': return a ? String(a.value) : '';
      case 'name': return acceptedNames(step, lang)[0] || '';
      case 'formula': return typeof a === 'string' ? a : '';
      case 'match': return a && Array.isArray(a.pairs) ? a.pairs.slice() : [];
      default: return null;
    }
  };

  /* ---------- unit validation ---------- */
  const KINDS = ['choice', 'multi', 'atoms', 'order', 'number', 'name', 'formula', 'match'];
  const BLOCKS = ['h', 'p', 'list', 'rule', 'pitfall', 'mol', 'scheme', 'mech', 'resonance', 'fischer', 'newman', 'chair', 'table', 'example', 'practice'];
  const isStr = v => typeof v === 'string' && v.length > 0;
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const isT = v => isObj(v) && isStr(v.lt) && isStr(v.en);

  function validateUnit(unit) {
    const errs = [];
    if (!isObj(unit)) return ['unit: not an object'];
    const err = (where, msg) => errs.push(where + ': ' + msg);
    const typeIds = new Set(Array.isArray(unit.types) ? unit.types.map(t => t && t.id) : []);
    const t = (v, where) => { if (!isT(v)) err(where, 'text needs both lt and en'); };
    const mol = (m, where) => {
      if (!isObj(m) || !isStr(m.smi)) return err(where, 'molecule needs a smi string');
      if (m.name !== undefined) t(m.name, where + '.name');
      if (m.caption !== undefined) t(m.caption, where + '.caption');
      if (m.opts !== undefined && !isObj(m.opts)) err(where, 'opts must be an object');
    };
    const scheme = (s, where) => {
      if (!isObj(s) || !Array.isArray(s.items)) return err(where, 'scheme needs items');
      s.items.forEach((it, i) => {
        const w = where + '.items[' + i + ']';
        if (!isObj(it)) return err(w, 'not an object');
        if ('smi' in it) mol(it, w);
        else if (!it.plus && !it.arrow) err(w, 'item is not a molecule, plus or arrow');
        else if (it.arrow) { if (it.above !== undefined) t(it.above, w + '.above'); if (it.below !== undefined) t(it.below, w + '.below'); }
      });
    };
    const option = (o, where) => {
      if (!isObj(o)) return err(where, 'option is not an object');
      if ('text' in o) t(o.text, where + '.text');
      else if ('mol' in o) mol(o.mol, where + '.mol');
      else if ('scheme' in o) scheme(o.scheme, where + '.scheme');
      else err(where, 'option needs text, mol or scheme');
    };
    const textOrBlocks = (v, where) => { if (Array.isArray(v)) blocks(v, where); else t(v, where); };
    function block(b, where) {
      if (!isObj(b)) return err(where, 'block is not an object');
      const keys = Object.keys(b).filter(k => k !== 'src' && k !== 'caption' && !(k === 'ordered' && 'list' in b));
      if (keys.length !== 1 || !BLOCKS.includes(keys[0])) return err(where, 'a block has exactly one of ' + BLOCKS.join(', ') + ' (found ' + (keys.join(', ') || 'none') + ')');
      if (b.caption !== undefined) t(b.caption, where + '.caption');
      const k = keys[0], v = b[k];
      const w = where + '.' + k;
      switch (k) {
        case 'h': case 'p': case 'rule': case 'pitfall': return t(v, w);
        case 'list': if (!Array.isArray(v) || !v.length) return err(w, 'needs items'); return v.forEach((x, i) => t(x, w + '[' + i + ']'));
        case 'mol': return Array.isArray(v) ? (v.length ? v.forEach((m, i) => mol(m, w + '[' + i + ']')) : err(w, 'empty')) : mol(v, w);
        case 'scheme': return scheme(v, w);
        case 'mech':
          if (!Array.isArray(v) || !v.length) return err(w, 'needs steps');
          return v.forEach((s, i) => { if (!isObj(s) || !Array.isArray(s.arrows)) err(w + '[' + i + ']', 'step needs scheme and arrows'); else { scheme(s.scheme, w + '[' + i + '].scheme'); if (s.note !== undefined) t(s.note, w + '[' + i + '].note'); } });
        case 'resonance': if (!Array.isArray(v) || v.length < 2) return err(w, 'needs two or more molecules'); return v.forEach((m, i) => mol(m, w + '[' + i + ']'));
        case 'fischer': case 'newman': case 'chair': if (!isObj(v)) err(w, 'needs a spec object'); return;
        case 'table':
          if (!isObj(v) || !Array.isArray(v.head) || !Array.isArray(v.rows)) return err(w, 'needs head and rows');
          v.head.forEach((x, i) => t(x, w + '.head[' + i + ']'));
          return v.rows.forEach((r, i) => { if (!Array.isArray(r) || r.length !== v.head.length) err(w + '.rows[' + i + ']', 'row length differs from head'); else r.forEach((c, j) => { if (isObj(c) && 'smi' in c) mol(c, w + '.rows[' + i + '][' + j + ']'); else t(c, w + '.rows[' + i + '][' + j + ']'); }); });
        case 'example':
          if (!isObj(v) || !Array.isArray(v.q) || !Array.isArray(v.steps) || !v.steps.length) return err(w, 'needs q and steps');
          blocks(v.q, w + '.q');
          return v.steps.forEach((s, i) => Array.isArray(s) ? blocks(s, w + '.steps[' + i + ']') : err(w + '.steps[' + i + ']', 'a step is a list of blocks'));
        case 'practice': if (!typeIds.has(v)) err(w, 'no such exercise type: ' + v); return;
      }
    }
    function blocks(list, where) { if (!Array.isArray(list)) return err(where, 'needs a list of blocks'); list.forEach((b, i) => block(b, where + '[' + i + ']')); }

    function step(s, where) {
      if (!isObj(s)) return err(where, 'step is not an object');
      if (!KINDS.includes(s.kind)) return err(where, 'unknown step kind ' + s.kind);
      t(s.prompt, where + '.prompt'); t(s.hint, where + '.hint'); textOrBlocks(s.solution, where + '.solution');
      const n = Array.isArray(s.options) ? s.options.length : 0;
      const a = s.answer;
      if (['choice', 'multi', 'order'].includes(s.kind)) {
        const lo = s.kind === 'order' ? 3 : 2, hi = s.kind === 'order' ? 6 : 12;
        if (n < lo || n > hi) return err(where, s.kind + ' needs ' + lo + ' to ' + hi + ' options (found ' + n + ')');
        s.options.forEach((o, i) => option(o, where + '.options[' + i + ']'));
      }
      if (s.mol !== undefined) mol(s.mol, where + '.mol');
      switch (s.kind) {
        case 'choice': if (!isInt(a) || a < 0 || a >= n) err(where, 'answer index out of range'); break;
        case 'multi': if (!Array.isArray(a) || !a.length || !a.every(x => isInt(x) && x >= 0 && x < n) || new Set(a).size !== a.length) err(where, 'answer must list option indices in range'); break;
        case 'atoms':
          if (!isObj(s.mol)) return err(where, 'atoms step needs a mol');
          if (a === undefined) { if (typeof s.from !== 'string' || !/^(stereocentres|carbon:[1-4]|hyb:(sp|sp2|sp3)|conjugated|aromatic)$/.test(s.from)) err(where, 'needs an answer or a valid from'); break; }
          if (!Array.isArray(a) || !(s.bonds ? pairKeys(a) : sortedInts(a))) { err(where, 'answer must list ' + (s.bonds ? 'atom pairs' : 'atom indices')); break; }
          if (ORG.chem && ORG.chem.parse) {
            try {
              const nat = ORG.chem.parse(s.mol.smi).atoms.length;
              if (a.flat().some(x => x < 0 || x >= nat)) err(where, 'atom index out of range');
            } catch (e) { err(where, 'molecule does not parse: ' + e.message); }
          }
          break;
        case 'number': if (!isObj(a) || typeof a.value !== 'number' || !isFinite(a.value) || typeof a.tol !== 'number' || !isFinite(a.tol) || a.tol < 0) err(where, 'answer needs {value, tol}'); break;
        case 'name':
          if (!isObj(a)) { err(where, 'answer needs names or smi'); break; }
          if (a.smi === undefined) {
            for (const lg of ['lt', 'en']) if (!Array.isArray(a[lg]) || !a[lg].length || !a[lg].every(isStr)) { err(where, 'answer needs a list of names in ' + lg); break; }
          } else if (!isStr(a.smi)) err(where, 'answer.smi must be a string');
          break;
        case 'formula': if (!isStr(a) || !parseFormula(a)) err(where, 'answer must be a formula string'); break;
        case 'match':
          if (!isObj(a) || !Array.isArray(a.left) || !Array.isArray(a.right) || !Array.isArray(a.pairs) || !a.left.length || !a.right.length) { err(where, 'answer needs left, right and pairs'); break; }
          a.left.forEach((o, i) => option(o, where + '.answer.left[' + i + ']'));
          a.right.forEach((o, i) => option(o, where + '.answer.right[' + i + ']'));
          if (a.pairs.length !== a.left.length || !a.pairs.every(x => isInt(x) && x >= 0 && x < a.right.length)) err(where, 'pairs must give one right item for each left item');
          break;
      }
    }

    const seen = new Set();
    function problem(p, where) {
      if (!isObj(p)) return err(where, 'problem is not an object');
      blocks(p.q, where + '.q');
      if (!Array.isArray(p.steps) || !p.steps.length) err(where, 'needs steps'); else p.steps.forEach((s, i) => step(s, where + '.steps[' + i + ']'));
      textOrBlocks(p.why, where + '.why');
      if (p.claims !== undefined && !Array.isArray(p.claims)) err(where, 'claims must be a list');
    }

    if (!isStr(unit.id)) err('unit', 'needs an id');
    if (!Array.isArray(unit.notes) || !unit.notes.length) err('notes', 'needs sections');
    else {
      const ids = new Set();
      unit.notes.forEach((sec, i) => {
        const w = 'notes[' + i + ']';
        if (!isObj(sec) || !isStr(sec.id)) return err(w, 'section needs an id');
        if (ids.has(sec.id)) err(w, 'duplicate section id ' + sec.id);
        ids.add(sec.id);
        t(sec.title, w + '.title'); blocks(sec.blocks, w + '.blocks');
      });
    }
    blocks(unit.summary, 'summary');
    if (!Array.isArray(unit.types) || !unit.types.length) err('types', 'needs exercise types');
    else {
      const tids = new Set();
      unit.types.forEach((ty, i) => {
        const w = 'types[' + i + ']';
        if (!isObj(ty) || !isStr(ty.id)) return err(w, 'type needs an id');
        if (isStr(unit.id) && !ty.id.startsWith(unit.id + '.')) err(w, 'type id ' + ty.id + ' must start with ' + unit.id + '.');
        if (tids.has(ty.id)) err(w, 'duplicate type id ' + ty.id);
        tids.add(ty.id);
        t(ty.title, w + '.title');
        if (!Array.isArray(ty.mirrors) || !ty.mirrors.every(isStr)) err(w, 'mirrors must be a list of task ids');
        const hasGen = typeof ty.gen === 'function', hasBank = Array.isArray(ty.bank) && ty.bank.length > 0;
        if (!hasGen && !hasBank) return err(w, 'needs a gen function or a bank');
        if (hasBank) ty.bank.forEach((p, j) => {
          const pw = (isObj(p) && p.id) || w + '.bank[' + j + ']';
          if (!isObj(p) || !isStr(p.id)) return err(w + '.bank[' + j + ']', 'bank problem needs an id');
          if (!p.id.startsWith(ty.id + '.')) err(pw, 'problem id must start with ' + ty.id + '.');
          if (seen.has(p.id)) err(pw, 'duplicate problem id ' + p.id);
          seen.add(p.id);
          problem(p, pw);
        });
      });
    }
    if (!isObj(unit.coverage)) err('coverage', 'needs a coverage map');
    else for (const [task, list] of Object.entries(unit.coverage)) {
      if (!Array.isArray(list) || !list.length) err('coverage.' + task, 'needs exercise types');
      else list.forEach(id => { if (!typeIds.has(id)) err('coverage.' + task, 'no such exercise type: ' + id); });
    }
    return errs;
  }
  check.validateUnit = validateUnit;
  // Structural check of one problem (a generated one before it is shown): the same rules as for a bank problem.
  check.validateProblem = function (p) {
    if (!isObj(p)) return ['problem: not an object'];
    const stub = { id: 'x', notes: [{ id: 'a', title: { lt: 'a', en: 'a' }, blocks: [] }], summary: [], types: [{ id: 'x.t', title: { lt: 'a', en: 'a' }, mirrors: [], bank: [Object.assign({}, p, { id: 'x.t.1' })] }], coverage: {} };
    try { return validateUnit(stub); } catch (e) { return ['problem: ' + e.message]; }
  };

  /* ---------- random numbers and problems ---------- */
  function rng(seed) {
    let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  check.rng = rng;
  check.shuffleWith = function (rand, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  };

  // makeProblem(type, seed): the same type and seed always give the same problem. Generated problems get the id "<type>#<seed>".
  check.makeProblem = function (type, seed) {
    seed = Number.isFinite(seed) ? Math.floor(seed) : 0;
    let p;
    if (typeof type.gen === 'function') {
      const rand = rng(seed);
      const ctx = {
        chem: ORG.chem, stereo: ORG.stereo, name: ORG.name, react: ORG.react, draw: ORG.draw,
        pick: arr => arr[Math.floor(rand() * arr.length)],
        shuffle: arr => check.shuffleWith(rand, arr),
        int: (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))
      };
      p = type.gen(rand, ctx);
    } else {
      const n = type.bank.length;
      p = type.bank[((seed % n) + n) % n];
    }
    return Object.assign({}, p, { typeId: type.id, seed, id: p.id || type.id + '#' + seed });
  };
})(globalThis.ORG = globalThis.ORG || {});
