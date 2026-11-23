'use strict';
// Content validator for the organic trainer: the gate every unit file passes.
//
//   node --test tests/organic/content.test.js            all unit files in site/organic/units
//   UNIT=u07 node --test tests/organic/content.test.js   one unit file
//   UNIT_DIR=tests/organic/fixtures node --test ...      the fixture units (unit-<letter>.js) instead, checked as if ready
//   SEEDS=50 ...                                         seeds per generator (default 40 locally, 300 when CI is set)
//
// checkUnit() is a plain function (no test runner inside), so the validator can be proved on
// mutated copies of the fixture unit: see the "validator" tests at the end.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load = require('./load.js');

const ROOT = path.join(__dirname, '..', '..');
const ORG = (load.load || load)(['chem.js', 'stereo.js', 'draw.js', 'views.js', 'name.js', 'react.js', 'units.js', 'check.js']);
const TASKS = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'seminar-tasks.json'), 'utf8'));
const FIXTURE = path.join(__dirname, 'fixtures', 'unit-a.js');

const SEEDS = Math.max(1, parseInt(process.env.SEEDS || (process.env.CI ? 300 : 40), 10) || 300);
const GEN_MS = 10000; // one generator type stops early (and says so) after this long
const MIN_DISTINCT = 30;

/* ---------- small helpers ---------- */
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isT = (v) => isObj(v) && isStr(v.lt) && isStr(v.en);
const snip = (s) => { s = String(s).replace(/\s+/g, ' '); return s.length > 60 ? s.slice(0, 57) + '...' : s; };
const sortNums = (a) => a.slice().sort((x, y) => x - y);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function taskKnown(id) {
  let m = /^S([1-7])\.(\d+)$/.exec(id);
  if (m) { const n = +m[2]; return n >= 1 && n <= TASKS['S' + m[1]]; }
  m = /^LW([1-6])\.(\d+)$/.exec(id);
  return !!m && +m[2] >= 1;
}
const allSeminarIds = () => Object.keys(TASKS).flatMap((s) => Array.from({ length: TASKS[s] }, (_, i) => s + '.' + (i + 1)));
const isLab = (id) => /^l\d+$/.test(id);

// A text that is the same in both languages is fine when it is only formulas, numbers, acronyms, symbols (pKa, pH, SN2, E1)
// or a single word. Ordinary words = tokens of 3+ letters, lower case with an optional capital first letter (Same, words),
// not formula-like (NaOH, HBr, DMSO); $...$ spans are ignored. Flag only when there are 2 or more ordinary words.
function sameTextIsWrong(s) {
  const tokens = s.replace(/\$[^$]*\$/g, ' ').split(/[^\p{L}\p{N}]+/u)
    .filter((t) => /^\p{Lu}?\p{Ll}{2,}$/u.test(t) && !/^([A-Z][a-z]?\d*)+$/.test(t));
  return tokens.length >= 2;
}

/* ---------- caches shared by every unit (the engine is pure) ---------- */
const parseCache = new Map();
function parse(smi) {
  if (!parseCache.has(smi)) {
    try { parseCache.set(smi, { mol: ORG.chem.parse(smi) }); } catch (e) { parseCache.set(smi, { err: e.message }); }
  }
  return parseCache.get(smi);
}
function need(smi) {
  const p = parse(smi);
  if (p.err) throw new Error('SMILES "' + smi + '" does not parse: ' + p.err);
  return p.mol;
}
const canonCache = new Map();
function canon(smi) {
  if (!canonCache.has(smi)) {
    let c = smi;
    try { c = ORG.chem.canonical(ORG.chem.parse(smi), { stereo: true }); } catch (e) { /* reported elsewhere */ }
    canonCache.set(smi, c);
  }
  return canonCache.get(smi);
}
const layoutCache = new Map();
function layoutQuality(smi, opts) {
  const key = smi + '|' + JSON.stringify(opts || {});
  if (!layoutCache.has(key)) {
    let r;
    try {
      const mol = ORG.chem.parse(smi);
      const lay = ORG.draw.layout(mol, opts || {});
      const q = ORG.draw.quality(mol, lay.pos, opts || {});
      r = { overlaps: q.overlaps, crossings: q.crossings, labelClashes: q.labelClashes };
    } catch (e) { r = { err: e.message }; }
    layoutCache.set(key, r);
  }
  return layoutCache.get(key);
}
const nameCache = new Map();
// { lt: Set(normalised keys), en: Set, show: {lt: [...], en: [...]} } or null when the namer does not cover the molecule
function namerAnswer(smi) {
  if (!nameCache.has(smi)) {
    let r = null;
    try {
      if (ORG.name.inScope(smi)) {
        r = { lt: new Set(), en: new Set(), show: { lt: [], en: [] } };
        let triv = null;
        try { triv = ORG.name.trivial(smi); } catch (e) { /* no trivial name */ }
        for (const lang of ['lt', 'en']) {
          for (const stereo of [false, true]) {
            const x = ORG.name.name(smi, { lang, stereo });
            if (!x) continue;
            for (const n of [x.name].concat(x.alts || [], triv && triv[lang] ? [triv[lang]] : [])) {
              r[lang].add(ORG.check.normName(n).key);
              if (!r.show[lang].includes(n)) r.show[lang].push(n);
            }
          }
        }
      }
    } catch (e) { r = { error: e.message }; }
    nameCache.set(smi, r);
  }
  return nameCache.get(smi);
}

/* ---------- report: one line per defect, repeated seeds folded together ---------- */
class Report {
  constructor(id) { this.id = id; this.errs = new Map(); this.warns = new Map(); this.unchecked = new Set(); this.extras = new Set(); this.seedsRun = {}; }
  add(map, loc, msg, tag) {
    const k = loc + '\u0000' + msg;
    let e = map.get(k);
    if (!e) { e = { loc, msg, tags: [] }; map.set(k, e); }
    if (tag !== undefined) e.tags.push(tag);
  }
  err(loc, msg, tag) { this.add(this.errs, loc, msg, tag); }
  warn(loc, msg, tag) { this.add(this.warns, loc, msg, tag); }
  lines(map) {
    return [...map.values()].map((e) => {
      let s = '[' + this.id + '] ' + (e.loc ? e.loc + ': ' : '') + e.msg;
      if (e.tags.length) s += ' (' + e.tags.slice(0, 5).join(', ') + (e.tags.length > 5 ? ' and ' + (e.tags.length - 5) + ' more' : '') + ')';
      return s;
    });
  }
}
const L = (type, prob, part) => [type ? 'type ' + type : '', prob ? 'problem ' + prob : '', part || ''].filter(Boolean).join(', ');

/* ---------- claims ---------- */
function claimCheck(claim, unchecked) {
  const C = ORG.chem, S = ORG.stereo;
  if (!isObj(claim)) return 'a claim is an object with one key';
  const keys = Object.keys(claim);
  if (keys.length !== 1) return 'a claim has exactly one key (found ' + keys.join(', ') + ')';
  const kind = keys[0], v = claim[kind];
  if (!Array.isArray(v)) return kind + ' claim needs a list';
  switch (kind) {
    case 'formula': {
      const mol = need(v[0]);
      const want = ORG.check.parseFormula(v[1]);
      if (!want) return 'formula "' + v[1] + '" cannot be read';
      const got = C.formula(mol);
      const charge = mol.atoms.reduce((s, a) => s + a.charge, 0);
      if (!same(Object.keys(got).sort().map((k) => k + got[k]), Object.keys(want.counts).sort().map((k) => k + want.counts[k])) || charge !== want.charge) {
        return v[0] + ' has formula ' + C.formulaString(mol) + ', not ' + v[1];
      }
      return null;
    }
    case 'name': {
      if (!isT(v[1])) return 'name claim needs [smi, {lt, en}]';
      need(v[0]);
      return nameProblem(v[0], v[1], unchecked);
    }
    case 'cip': {
      const got = S.cip(need(v[0]), v[1]);
      return got === v[2] ? null : 'atom ' + v[1] + ' of ' + v[0] + ' is ' + got + ', not ' + v[2];
    }
    case 'ez': {
      const got = S.ez(need(v[0]), v[1], v[2]);
      return got === v[3] ? null : 'bond ' + v[1] + '-' + v[2] + ' of ' + v[0] + ' is ' + got + ', not ' + v[3];
    }
    case 'centres': {
      const got = sortNums(S.stereocentres(need(v[0])));
      return same(got, sortNums(v[1])) ? null : v[0] + ' has stereocentres [' + got + '], not [' + v[1] + ']';
    }
    case 'stereoisomers': {
      const got = S.stereoisomers(need(v[0])).length;
      return got === v[1] ? null : v[0] + ' has ' + got + ' stereoisomers, not ' + v[1];
    }
    case 'isomers': {
      const got = S.isomers(v[0], Object.assign(v[2] ? { filter: v[2] } : {}, isObj(v[3]) ? v[3] : {})).length;
      return got === v[1] ? null : v[0] + (v[2] ? ' (' + v[2] + ')' : '') + (isObj(v[3]) ? ' ' + JSON.stringify(v[3]) : '') + ' has ' + got + ' constitutional isomers, not ' + v[1];
    }
    case 'hyb': {
      const got = C.hybridization(need(v[0]), v[1]);
      return got === v[2] ? null : 'atom ' + v[1] + ' of ' + v[0] + ' is ' + got + ', not ' + v[2];
    }
    case 'carbon': {
      const got = C.carbonClass(need(v[0]), v[1]);
      return got === v[2] ? null : 'atom ' + v[1] + ' of ' + v[0] + ' is class ' + got + ', not ' + v[2];
    }
    case 'sigmaPi': {
      const got = C.bondCounts(need(v[0]));
      return got.sigma === v[1] && got.pi === v[2] ? null : v[0] + ' has ' + got.sigma + ' sigma and ' + got.pi + ' pi bonds, not ' + v[1] + ' and ' + v[2];
    }
    case 'aromatic': {
      const got = C.aromaticAtoms(need(v[0])).length > 0;
      return got === v[1] ? null : v[0] + ' is ' + (got ? '' : 'not ') + 'aromatic';
    }
    case 'react': {
      const [rule, reactants, opts, major] = v;
      if (!ORG.react.RULES[rule]) return 'unknown reaction rule ' + rule;
      const res = ORG.react.run(rule, reactants, opts || undefined);
      const majors = (res.products || []).filter((p) => p.major).map((p) => p.smi);
      const ok = majors.some((m) => C.same(m, major, { stereo: false }));
      return ok ? null : rule + ' on ' + reactants.join(' + ') + ' gives major ' + (majors.join(', ') || (res.none ? 'no reaction' : 'nothing')) + ', not ' + major;
    }
    case 'same': {
      const stereo = /[@/\\]/.test(v[0] + v[1]);
      return C.same(need(v[0]), need(v[1]), { stereo }) ? null : v[0] + ' and ' + v[1] + ' are different structures' + (stereo ? ' (stereo compared)' : '');
    }
    case 'chiral': {
      const got = S.isChiral(need(v[0]));
      return got === v[1] ? null : v[0] + ' is ' + (got ? '' : 'not ') + 'chiral';
    }
    default: return 'unknown claim kind "' + kind + '"';
  }
}

// null when the T matches the namer in both languages (or the namer cannot say), else a message
function nameProblem(smi, T, uncheckedSet) {
  const r = namerAnswer(smi);
  if (!r) { if (uncheckedSet) uncheckedSet.add(smi); return null; }
  if (r.error) { if (uncheckedSet) uncheckedSet.add(smi); return null; }
  const bad = [];
  for (const lang of ['lt', 'en']) {
    if (!r[lang].has(ORG.check.normName(T[lang]).key)) bad.push(lang + ' "' + T[lang] + '" (namer: ' + r.show[lang].join(' / ') + ')');
  }
  return bad.length ? 'name of ' + smi + ' is wrong: ' + bad.join('; ') : null;
}

function computeFrom(from, mol) {
  const C = ORG.chem;
  const idx = [...mol.atoms.keys()];
  let m;
  if (from === 'stereocentres') return sortNums(ORG.stereo.stereocentres(mol));
  if ((m = /^carbon:([1-4])$/.exec(from))) return idx.filter((i) => mol.atoms[i].el === 'C' && C.carbonClass(mol, i) === +m[1]);
  if ((m = /^hyb:(sp|sp2|sp3)$/.exec(from))) return idx.filter((i) => C.hybridization(mol, i) === m[1]);
  if (from === 'conjugated') return sortNums(Array.from(new Set(C.conjugated(mol).flat())));
  if (from === 'aromatic') return sortNums(C.aromaticAtoms(mol));
  return null;
}

const BLOCK_KEYS = ['h', 'p', 'list', 'rule', 'pitfall', 'mol', 'scheme', 'mech', 'resonance', 'fischer', 'newman', 'chair', 'table', 'example', 'practice'];
function hasNumberedMol(node) {
  if (Array.isArray(node)) return node.some(hasNumberedMol);
  if (!isObj(node)) return false;
  if (typeof node.smi === 'string' && isObj(node.opts) && node.opts.numbers) return true;
  return Object.values(node).some(hasNumberedMol);
}

// Learner-facing text lint. A SMILES-like token: 4+ chars of SMILES characters with one of =#()[]@ and two or more capitals.
function smilesLike(text) {
  const out = [];
  for (const raw of text.replace(/\$[^$]*\$/g, ' ').split(/\s+/)) {
    const tok = raw.replace(/[.,;:!?"'”“]+$/, '');
    if (/^[A-Za-z0-9=#()[\]@+\-\/%]{4,}$/.test(tok) && /([=#[\]@]|[A-Za-z0-9]\([^)]*\))/.test(tok) &&(tok.match(/[A-Z]/g) || []).length >= 2) out.push(tok);
  }
  return out;
}
const GENITIVE = /(?:met|et|prop|but|pent|heks|hept|okt|non|dek|adi)(an|en|in)os(?![\p{L}])/iu;

// Option-position references. The player shuffles choice and multi options, so a solution, hint or "why" must not point at an option by
// its place ("the first, second and fourth are correct", "the last one", "Teisingi pirmas ir antras"): say which statement it is by content.
// Ordinals that mean something else (the first stage, the second equivalent) are fine; a problem or step with fixedOrder: true is skipped.
const ORD_EN = '(?:first|second|third|fourth|fifth|last)';
const ORD_LT = String.raw`(?:pirm|antr|treči|ketvirt|penkt|paskutin)(?!in|iau)\p{L}*`;
const ORD_REFS = {
  en: [
    new RegExp(String.raw`\b(?:the\s+)?` + ORD_EN + String.raw`\s+(?:option|options|answer|answers|statement|statements|choice|choices|variant|equation|equations|observation|observations)\b`, 'i'),
    new RegExp(String.raw`\bonly\s+the\s+` + ORD_EN + String.raw`\s+(?:is|are|one)\b`, 'i'),
    new RegExp(String.raw`\bthe\s+last\s+one\b`, 'i'),
    new RegExp(String.raw`\b(?:the\s+)?` + ORD_EN + String.raw`(?:\s+(?:one|two|three|four))?(?:\s+and\s+(?:the\s+)?` + ORD_EN + String.raw`)?\s+(?:is|are|was|were)\s+(?:both\s+)?(?:correct|right|true|false|wrong|incorrect)\b`, 'i'),
    new RegExp(String.raw`\b` + ORD_EN + String.raw`,\s+(?:the\s+)?` + ORD_EN + String.raw`,?\s+(?:and\s+|or\s+)?(?:the\s+)?` + ORD_EN + String.raw`\s+(?:is|are|were)\b`, 'i')
  ],
  lt: [
    new RegExp(String.raw`(?<![\p{L}])` + ORD_LT + String.raw`\s+(?:variant\p{L}*|atsakym\p{L}*|teigin\p{L}*|lygt\p{L}*|stebėjim\p{L}*)`, 'iu'),
    new RegExp(String.raw`(?<![\p{L}])(?:teising\p{L}*|neteising\p{L}*|klaiding\p{L}*)\s+(?:tik\s+)?` + ORD_LT, 'iu'),
    new RegExp(String.raw`(?<![\p{L}])` + ORD_LT + String.raw`,?\s+(?:ir|ar)\s+` + ORD_LT + String.raw`\s+(?:yra|teising|neteising|klaiding)`, 'iu')
  ]
};
function ordinalRef(T) {
  for (const lang of ['lt', 'en']) {
    const s = String(T[lang]).replace(/\$[^$]*\$/g, ' ');
    for (const re of ORD_REFS[lang]) { const m = re.exec(s); if (m) return lang + ' text points at an option by its position ("' + m[0] + '")'; }
  }
  return null;
}

// Views are rendered once (both languages) to catch arrows to missing atoms, bad specs, NaN in the output.
const viewCache = new Map();
function viewProblem(kind, spec) {
  const key = kind + JSON.stringify(spec);
  if (!viewCache.has(key)) {
    let r = null;
    for (const lang of ['lt', 'en']) {
      try {
        let d;
        if (kind === 'mech') d = ORG.views.mechanism(Object.assign({}, spec, { lang }));
        else if (kind === 'resonance') d = ORG.views.resonance({ mols: spec, lang });
        else d = ORG.views[kind](Object.assign({}, spec, { lang }));
        const out = ORG.draw.toString(d.svg);
        if (/(?<![A-Za-z])NaN(?![A-Za-z])|undefined/.test(out)) { r = 'renders NaN or undefined (' + lang + ')'; break; }
      } catch (e) { r = 'does not render (' + lang + '): ' + e.message; break; }
    }
    viewCache.set(key, r);
  }
  return viewCache.get(key);
}
// A lone-pair arrow ref ({m, lp}) must name an atom that has a lone pair: N, O, S, P, a halogen, or any negatively charged atom.
const LONE_PAIR_EL = ['N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
function lonePairProblem(step) {
  if (!isObj(step) || !isObj(step.scheme) || !Array.isArray(step.scheme.items) || !Array.isArray(step.arrows)) return null;
  const mols = step.scheme.items.filter((it) => isObj(it) && typeof it.smi === 'string');
  for (const ar of step.arrows) {
    for (const ref of [ar && ar.from, ar && ar.to]) {
      if (!isObj(ref) || ref.lp === undefined || !mols[ref.m]) continue;
      const p = parse(mols[ref.m].smi);
      const a = p.err ? null : p.mol.atoms[ref.lp];
      if (a && !LONE_PAIR_EL.includes(a.el) && !(a.charge < 0)) return 'has a lone-pair arrow on atom ' + ref.lp + ' (' + a.el + ') of ' + mols[ref.m].smi + ', which has no lone pair';
    }
  }
  return null;
}
const VIEW_KINDS = ['mech', 'scheme', 'resonance', 'fischer', 'newman', 'chair'];

function optionKeys(o, lang) {
  if (!isObj(o)) return 'x:' + JSON.stringify(o);
  if ('mol' in o) return 'mol:' + canon(o.mol.smi);
  if ('scheme' in o) return 'scheme:' + JSON.stringify(o.scheme, (k, v) => (k === 'smi' && typeof v === 'string' ? canon(v) : v));
  if ('text' in o && isObj(o.text)) { const n = (x) => String(x).trim().toLowerCase(); return 'text:' + (lang ? n(o.text[lang]) : n(o.text.lt) + '|' + n(o.text.en)); }
  return 'x:' + JSON.stringify(o);
}

/* ---------- one unit ---------- */
// opts: { guide: 'fail' | 'warn' (guide minimums), seeds, genMs, slowIsWarning }
function checkUnit(unit, opts) {
  opts = Object.assign({ guide: 'fail', seeds: SEEDS, genMs: GEN_MS, slowIsWarning: !!process.env.CI }, opts);
  const R = new Report(isObj(unit) && unit.id ? unit.id : '?');
  const t0 = Date.now();
  if (!isObj(unit)) { R.err('', 'the unit file did not give a unit object'); return finish(); }
  const guide = (loc, msg) => (opts.guide === 'fail' ? R.err(loc, msg) : R.warn(loc, 'guide: ' + msg));
  const lab = isLab(String(unit.id));

  // `claims` on notes blocks are checked here; the structural validator is shown the notes without them
  const noClaims = (n) => (Array.isArray(n) ? n.map(noClaims) : isObj(n) ? Object.fromEntries(Object.entries(n).filter(([k]) => k !== 'claims').map(([k, v]) => [k, noClaims(v)])) : n);
  for (const e of ORG.check.validateUnit(Object.assign({}, unit, { notes: noClaims(unit.notes), summary: noClaims(unit.summary) }))) R.err('structure', e);

  let curNumbered = false; // the problem or block being scanned has a molecule with opts.numbers
  function textCheck(T, loc, tag) {
    for (const lang of ['lt', 'en']) {
      const s = T[lang];
      if (/<[A-Za-z]/.test(s)) R.err(loc, lang + ' text has "<" followed by a letter (markup is not HTML): "' + snip(s) + '"', tag);
      if (/\bundefined\b|\bNaN\b|\[object /.test(s)) R.err(loc, lang + ' text contains undefined / NaN / [object]: "' + snip(s) + '"', tag);
    }
    for (const lang of ['lt', 'en']) {
      const s = T[lang];
      let m;
      if (!curNumbered && (m = /\bNr\.\s*\d+|\bno\.\s*\d+|\b[Aa]tom(?:as|o|u|ą|ai)?\s+\d+/u.exec(s.replace(/\$[^$]*\$/g, ' ')))) R.err(loc, lang + ' text refers to an atom number ("' + m[0] + '") but no molecule here shows numbers: add opts.numbers to the molecule', tag);
      if ((m = /\bskyri\p{L}*\s+\d+|\bsection\s+\d+|\b\d+\s+skyriuje|\b\d+\s+section\b/iu.exec(s))) R.err(loc, lang + ' text refers to a section number ("' + m[0] + '"): sections are not numbered in the trainer; name the section instead', tag);
    }
    for (const lang of ['lt', 'en']) {
      const tokens = smilesLike(T[lang]);
      if (tokens.length) R.err(loc, lang + ' text shows a formula or SMILES to the learner ("' + tokens[0] + '"): write it inside $...$ or draw it as a molecule', tag);
    }
    const g = GENITIVE.exec(T.lt);
    if (g) R.err(loc, 'genitive of -' + g[1] + 'as is -' + g[1] + 'o ("' + g[0] + '"): ' + snip(T.lt), tag);
    if (T.lt === T.en && sameTextIsWrong(T.lt)) R.err(loc, 'lt and en are identical, one is not translated: "' + snip(T.lt) + '"', tag);
  }

  function nameCheck(smi, T, what, loc, tag) {
    if (parse(smi).err) return;
    const msg = nameProblem(smi, T, R.unchecked);
    if (msg) R.err(loc, what + ': ' + msg, tag);
  }

  function molCheck(m, loc, tag, parentKey) {
    const p = parse(m.smi);
    if (p.err) return R.err(loc, 'SMILES "' + m.smi + '" does not parse: ' + p.err, tag);
    if (parentKey === 'fischer' || parentKey === 'answer') return; // not drawn as a skeletal formula
    const o = isObj(m.opts) ? m.opts : {};
    const n = p.mol.atoms.length;
    const bad = [];
    const idx = (list, what) => (Array.isArray(list) ? list : []).forEach((i) => { if (!Number.isInteger(i) || i < 0 || i >= n) bad.push(what + ' ' + i); });
    if (Array.isArray(o.numbers)) idx(o.numbers, 'numbers');
    else if (isObj(o.numbers)) idx(Object.keys(o.numbers).map(Number), 'numbers');
    if (isObj(o.highlight)) { idx(o.highlight.atoms, 'highlight.atoms'); idx((o.highlight.bonds || []).flat(), 'highlight.bonds'); }
    if (isObj(o.deltas)) idx(Object.keys(o.deltas).map(Number), 'deltas');
    if (Array.isArray(o.lonePairs)) idx(o.lonePairs, 'lonePairs');
    if (bad.length) R.err(loc, 'molecule "' + m.smi + '" has atom numbers out of range (it has ' + n + ' atoms): ' + bad.join(', '), tag);
    if (o.coords) {
      if (!Array.isArray(o.coords) || o.coords.length < n) R.err(loc, 'molecule "' + m.smi + '" opts.coords needs ' + n + ' points', tag);
      return;
    }
    const q = layoutQuality(m.smi, o);
    if (q.err) return R.err(loc, 'molecule "' + m.smi + '" cannot be laid out: ' + q.err, tag);
    if (q.overlaps || q.crossings || q.labelClashes) {
      R.err(loc, 'molecule "' + m.smi + '" does not draw cleanly (overlaps ' + q.overlaps + ', crossings ' + q.crossings + ', label clashes ' + q.labelClashes + '): rotate or flip it, change its drawing options, or give opts.coords', tag);
    }
  }

  // every T, every Mol, every number under node
  function scan(node, loc, tag, parentKey) {
    if (Array.isArray(node)) {
      if (parentKey === 'mech') node.forEach((st, i) => { const e = isObj(st) ? viewProblem('mech', st) : null; if (e) R.err(loc, 'mechanism step ' + i + ' ' + e, tag); const lp = lonePairProblem(st); if (lp) R.err(loc, 'mechanism step ' + i + ' ' + lp, tag); });
      if (parentKey === 'resonance') { const e = viewProblem('resonance', node); if (e) R.err(loc, 'resonance block ' + e, tag); }
      node.forEach((x) => scan(x, loc, tag, parentKey)); return;
    }
    if (typeof node === 'number') { if (!Number.isFinite(node)) R.err(loc, 'a non-finite number under "' + parentKey + '"', tag); return; }
    if (!isObj(node)) return;
    if (isT(node)) { textCheck(node, loc, tag); return; }
    if (parentKey === 'scheme' || parentKey === 'fischer' || parentKey === 'newman' || parentKey === 'chair') { const e = viewProblem(parentKey, node); if (e) R.err(loc, parentKey + ' ' + e, tag); }
    if (Array.isArray(node.claims) && parentKey !== 'claim') {
      const kind = Object.keys(node).find((k) => BLOCK_KEYS.includes(k));
      const bloc = loc + (kind ? ', ' + kind + ' block' : '');
      node.claims.forEach((c, k) => runClaim(c, bloc + ', claims[' + k + ']', tag));
    }
    if (isObj(node.example) && !Array.isArray(node.claims) && hasNumberedMol(node.example)) {
      R.warn(loc, 'example block has a molecule with numbered atoms but no claims: prove its answer with claims: [...]', tag);
    }
    if (typeof node.smi === 'string') {
      molCheck(node, loc, tag, parentKey);
      if (isT(node.name)) nameCheck(node.smi, node.name, 'molecule name', loc, tag);
    }
    for (const k of Object.keys(node)) scan(node[k], loc, tag, k);
  }

  function dupCheck(list, what, loc, tag) {
    if (!Array.isArray(list)) return;
    for (const lang of ['lt', 'en', null]) {
      const seen = new Map();
      for (let i = 0; i < list.length; i++) {
        const k = optionKeys(list[i], lang);
        if (seen.has(k)) {
          const kind = k.startsWith('mol:') ? 'same molecule' : k.startsWith('scheme:') ? 'same scheme' : 'same text' + (lang ? ' in ' + lang : '');
          R.err(loc, what + ' ' + seen.get(k) + ' and ' + i + ' are the same (' + kind + '): ' + snip(k.replace(/^\w+:/, '')), tag);
          return;
        }
        seen.set(k, i);
      }
      if (lang === null) break;
    }
  }

  function stepChecks(s, i, type, prob, tag, p) {
    const loc = L(type, prob, 'steps[' + i + ']');
    if (!isObj(s)) return;
    if (Array.isArray(s.options)) dupCheck(s.options, 'options', loc, tag);
    if (s.kind === 'match' && isObj(s.answer)) { dupCheck(s.answer.left, 'left items', loc, tag); dupCheck(s.answer.right, 'right items', loc, tag); }
    if (s.kind === 'atoms' && typeof s.from === 'string' && isObj(s.mol) && isStr(s.mol.smi) && !parse(s.mol.smi).err) {
      if (s.bonds) return R.err(loc, '"from" works for atoms only, not bonds', tag);
      const got = computeFrom(s.from, parse(s.mol.smi).mol);
      if (!got) return R.err(loc, 'unknown from "' + s.from + '"', tag);
      if (!got.length) R.err(loc, 'from "' + s.from + '" gives no atoms in ' + s.mol.smi, tag);
      else if (Array.isArray(s.answer) && !same(sortNums(s.answer), got)) R.err(loc, 'answer [' + s.answer + '] differs from the engine\'s "' + s.from + '" atoms [' + got + '] in ' + s.mol.smi, tag);
    }
    if (s.kind === 'formula' && typeof s.answer === 'string') {
      // the molecule is step.mol, else the problem's only statement molecule (exactly one Mol among the top-level mol blocks of q)
      let m = isObj(s.mol) ? s.mol : null;
      if (!m) { const all = (Array.isArray(p && p.q) ? p.q : []).flatMap((b) => (isObj(b) && b.mol ? [].concat(b.mol) : [])); if (all.length === 1) m = all[0]; }
      const want = ORG.check.parseFormula(s.answer);
      if (m && isStr(m.smi) && !parse(m.smi).err && want) {
        const got = ORG.chem.formula(parse(m.smi).mol);
        const x = Object.keys(got).sort().map((k) => k + got[k]), y = Object.keys(want.counts).sort().map((k) => k + want.counts[k]);
        if (!same(x, y)) R.err(loc, 'formula answer ' + s.answer + ' is not the formula of ' + m.smi + ' (' + ORG.chem.formulaString(parse(m.smi).mol) + ')', tag);
      }
    }
    if (s.kind === 'name' && isObj(s.answer)) {
      const a = s.answer;
      // answer.extra {lt, en, src}: extra accepted names the namer does not produce; src is required, every extra is listed for review
      const ex = isObj(a.extra) ? a.extra : null;
      if (ex) {
        if (!isStr(ex.src)) R.err(loc, 'answer.extra needs a src (where the extra names come from)', tag);
        for (const lang of ['lt', 'en']) (Array.isArray(ex[lang]) ? ex[lang] : []).forEach((n) => R.extras.add(lang + ' "' + n + '" (' + (ex.src || 'no src') + ')'));
      }
      if (isStr(a.smi) && !(Array.isArray(a.lt) && Array.isArray(a.en))) {
        if (parse(a.smi).err) return;
        const r = namerAnswer(a.smi);
        if (!r || r.error) R.err(loc, 'answer.smi "' + a.smi + '" is outside the namer\'s scope: write the names in answer.lt and answer.en instead', tag);
      } else if (Array.isArray(a.lt) && Array.isArray(a.en) && a.lt.length && a.en.length && isObj(s.mol) && isStr(s.mol.smi)) {
        if (parse(s.mol.smi).err) return;
        // every name in answer.lt / answer.en must be the namer's name, one of its alternatives or its trivial name
        const r = namerAnswer(s.mol.smi);
        if (!r || r.error) R.unchecked.add(s.mol.smi);
        else for (const lang of ['lt', 'en']) {
          a[lang].forEach((n) => {
            if (r[lang].has(ORG.check.normName(n).key)) return;
            R.err(loc, 'accepted ' + lang + ' name "' + n + '" is wrong for ' + s.mol.smi + ' (namer: ' + r.show[lang].join(' / ') + '); a real course spelling the namer does not produce goes in answer.extra {lt, en, src}', tag);
          });
        }
      } else R.unchecked.add('(name step without molecule)');
    }
  }

  function runClaim(c, loc, tag) {
    scan(c, loc, tag, 'claim');
    // the same claim in many generated problems is proved once per unit
    const key = JSON.stringify(c);
    if (!claimCache.has(key)) { let r; try { r = { e: claimCheck(c, R.unchecked) }; } catch (e) { r = { e: 'claim could not be checked: ' + e.message }; } claimCache.set(key, r); }
    const res = claimCache.get(key);
    if (res.e) R.err(loc, res.e, tag);
  }
  const claimCache = new Map();

  // solution, hint and why of a problem that has a choice or multi step must not refer to options by position (see ORD_REFS)
  function ordinalChecks(p, type, prob, tag) {
    const steps = Array.isArray(p.steps) ? p.steps : [];
    if (p.fixedOrder || !steps.some((s) => isObj(s) && (s.kind === 'choice' || s.kind === 'multi'))) return;
    const texts = (node, out) => { if (isT(node)) out.push(node); else if (Array.isArray(node)) node.forEach((x) => texts(x, out)); else if (isObj(node)) Object.values(node).forEach((x) => texts(x, out)); return out; };
    const check = (node, part) => texts(node, []).forEach((T) => { const msg = ordinalRef(T); if (msg) R.err(L(type, prob, part), msg + ': describe the option by its content, because the options are shuffled', tag); });
    check(p.why, 'why');
    steps.forEach((s, i) => { if (isObj(s) && !s.fixedOrder && (s.kind === 'choice' || s.kind === 'multi')) { check(s.solution, 'steps[' + i + '].solution'); check(s.hint, 'steps[' + i + '].hint'); } });
  }

  function problemChecks(p, type, prob, tag) {
    if (!isObj(p)) return;
    curNumbered = hasNumberedMol(p);
    scan(p.q, L(type, prob, 'q'), tag, 'q');
    (Array.isArray(p.steps) ? p.steps : []).forEach((s, i) => { scan(s, L(type, prob, 'steps[' + i + ']'), tag, 'step'); stepChecks(s, i, type, prob, tag, p); });
    scan(p.why, L(type, prob, 'why'), tag, 'why');
    ordinalChecks(p, type, prob, tag);
    (Array.isArray(p.claims) ? p.claims : []).forEach((c, k) => runClaim(c, L(type, prob, 'claims[' + k + ']'), tag));
  }
  const safely = (fn, loc, tag) => { try { fn(); } catch (e) { if (!R.errs.size) R.err(loc, 'validator error: ' + e.message, tag); } };

  // notes and summary
  // text that mentions atom numbers must sit in a block that has a molecule with numbers (curNumbered)
  const scanBlocks = (blocks, loc) => (Array.isArray(blocks) ? blocks : []).forEach((b) => { curNumbered = hasNumberedMol(b); scan(b, loc, undefined, 'notes'); });
  if (Array.isArray(unit.notes)) unit.notes.forEach((sec, i) => safely(() => {
    const loc = 'notes section "' + (sec && sec.id) + '"';
    curNumbered = false;
    scan(sec && sec.title, loc, undefined, 'title');
    scanBlocks(sec && sec.blocks, loc);
  }, 'notes[' + i + ']'));
  safely(() => scanBlocks(unit.summary, 'summary'), 'summary');
  curNumbered = false;

  // notes length
  const words = { lt: 0, en: 0 };
  (function count(node) {
    if (Array.isArray(node)) return node.forEach(count);
    if (!isObj(node)) return;
    if (isT(node)) {
      for (const lang of ['lt', 'en']) words[lang] += ORG.check.markup(node[lang]).map((x) => x.text).join('').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
      return;
    }
    Object.values(node).forEach(count);
  })(unit.notes);
  const lo = lab ? 400 : 800, hi = lab ? 1000 : 2000;
  for (const lang of ['lt', 'en']) {
    if (words[lang] < lo) guide('notes', 'notes have ' + words[lang] + ' words in ' + lang + ', the guide asks for ' + lo + ' to ' + hi);
    else if (words[lang] > hi) R.warn('notes', 'notes have ' + words[lang] + ' words in ' + lang + ', above the guide maximum ' + hi);
  }

  // exercise types
  const types = Array.isArray(unit.types) ? unit.types.filter(isObj) : [];
  const minTypes = lab ? 5 : 8;
  if (types.length < minTypes) guide('types', 'the unit has ' + types.length + ' exercise types, the guide asks for at least ' + minTypes);
  const mirrorsBad = (ty) => (Array.isArray(ty.mirrors) ? ty.mirrors : []).filter((m) => typeof m === 'string' && !taskKnown(m));
  for (const ty of types) {
    const tid = ty.id;
    curNumbered = false;
    scan(ty.title, L(tid, '', 'title'), undefined, 'title');
    (Array.isArray(ty.mirrors) ? ty.mirrors : []).forEach((m) => {
      if (typeof m === 'string' && taskKnown(m) && !(isObj(unit.coverage) && Array.isArray(unit.coverage[m]) && unit.coverage[m].includes(tid))) R.err(L(tid, '', 'mirrors'), '"' + m + '" is mirrored but unit.coverage["' + m + '"] does not list ' + tid);
    });
    mirrorsBad(ty).forEach((m) => R.err(L(tid, '', 'mirrors'), '"' + m + '" is not a known task id', undefined));
    if (Array.isArray(ty.bank)) {
      if (ty.bank.length < 8) guide(L(tid), 'the bank has ' + ty.bank.length + ' problems, the guide asks for at least 8');
      ty.bank.forEach((p) => safely(() => problemChecks(p, tid, p && p.id), L(tid, p && p.id)));
    }
    if (typeof ty.gen === 'function') generatorChecks(ty);
  }

  function generatorChecks(ty) {
    const tid = ty.id;
    const prints = new Set();
    let genTime = 0; // only the generator itself (makeProblem) counts toward the limit, not the validator's own checks
    let ran = 0;
    for (let seed = 1; seed <= opts.seeds; seed++) {
      if (genTime > opts.genMs) break;
      ran++;
      const tag = 'seed ' + seed;
      let p;
      const tg = Date.now();
      try { p = ORG.check.makeProblem(ty, seed); genTime += Date.now() - tg; } catch (e) { genTime += Date.now() - tg; R.err(L(tid, '', 'generator'), 'gen threw: ' + e.message, tag); continue; }
      const bad = ORG.check.validateProblem(p);
      bad.forEach((e) => R.err(L(tid, '', 'structure'), e.replace(/^x\.t\.1/, 'problem'), tag));
      if (!bad.length) safely(() => problemChecks(p, tid, '', tag), L(tid), tag);
      prints.add(JSON.stringify([p.q, (p.steps || []).map((s) => [s.prompt, s.options, s.mol, s.answer, s.from])]));
      if (seed === 1) {
        try {
          const q = ORG.check.makeProblem(ty, 1);
          if (JSON.stringify([q.q, q.steps]) !== JSON.stringify([p.q, p.steps])) R.err(L(tid, '', 'generator'), 'seed 1 gives different problems on two runs (use the rng, not Math.random)');
        } catch (e) { R.err(L(tid, '', 'generator'), 'gen threw on the second run of seed 1: ' + e.message); }
      }
    }
    R.seedsRun[tid] = ran;
    if (ran < opts.seeds) {
      const msg = 'the generator is too slow: only ' + ran + ' of ' + opts.seeds + ' seeds ran in the ' + (opts.genMs / 1000) + ' s limit (' + genTime + ' ms in the generator); make it cheaper';
      // shared CI machines are slower and uneven: a timing limit must not block publishing there
      if (opts.slowIsWarning) console.warn('WARNING [' + tid + '] ' + msg);
      else R.err(L(tid, '', 'generator'), msg);
    }
    // distinct problems: at least 30 when 100 or more seeds ran, otherwise at least 30% of the seeds that ran
    const need = ran >= 100 ? MIN_DISTINCT : Math.ceil(0.3 * ran);
    if (prints.size < need) guide(L(tid, '', 'generator'), 'the generator gave only ' + prints.size + ' distinct problems in ' + ran + ' seeds, the guide asks for at least ' + need);
  }

  // coverage map
  if (isObj(unit.coverage)) for (const key of Object.keys(unit.coverage)) {
    if (!taskKnown(key)) R.err('coverage', '"' + key + '" is not a known task id (seminar S1.1-S7.n as in seminar-tasks.json, or LW1.1-LW6.n)');
  }

  return finish();

  function finish() {
    return {
      errors: R.lines(R.errs), warnings: R.lines(R.warns),
      stats: { extras: [...R.extras], unchecked: R.unchecked.size, uncheckedList: [...R.unchecked].slice(0, 5), seeds: R.seedsRun, words, ms: Date.now() - t0 }
    };
  }
}

/* ---------- checks across units ---------- */
// units: [{id, coverage}]; meta: ORG.UNITS-like [{id, ready}]
function checkSeminarCoverage(units, meta) {
  const errors = [];
  const lectureReady = meta.filter((m) => !isLab(m.id)).every((m) => m.ready);
  const labReady = meta.filter((m) => isLab(m.id)).every((m) => m.ready);
  if (lectureReady) {
    const covered = new Set();
    units.forEach((u) => Object.keys(u.coverage || {}).forEach((k) => covered.add(k)));
    const missing = allSeminarIds().filter((id) => !covered.has(id));
    if (missing.length) errors.push('seminar tasks not covered by any unit (' + missing.length + '): ' + missing.join(', '));
  }
  if (labReady) {
    for (const u of units.filter((x) => isLab(x.id))) {
      const n = Object.keys(u.coverage || {}).filter((k) => /^LW\d+\./.test(k)).length;
      if (n < 4) errors.push('[' + u.id + '] lab unit lists ' + n + ' LW items in coverage, at least 4 are required');
    }
  }
  return errors;
}

// meta: ORG.UNITS entries, files: unit ids found on disk
function checkReady(meta, files, warnings) {
  const errors = [];
  for (const m of meta) if (m.ready && !files.includes(m.id)) errors.push('unit ' + m.id + ' is marked ready in units.js but ' + m.file + ' does not exist');
  for (const id of files) {
    const m = meta.find((x) => x.id === id);
    if (!m) errors.push('unit file ' + id + '.js is not in ORG.UNITS');
    else if (!m.ready) (warnings || errors).push('unit file ' + id + '.js exists but the unit is not marked ready in units.js (set ready: true)');
  }
  return errors;
}

/* ---------- running the real (or fixture) unit files ---------- */
const UNIT = process.env.UNIT || '';
const UNIT_DIR = process.env.UNIT_DIR || '';
const dir = UNIT_DIR ? path.resolve(ROOT, UNIT_DIR) : path.join(ROOT, 'site', 'organic', 'units');
let fileNames = [];
if (fs.existsSync(dir)) {
  fileNames = fs.readdirSync(dir).filter((n) => (UNIT_DIR ? /^unit-[a-z]\.js$/.test(n) : /\.js$/.test(n))).sort();
}
if (UNIT) fileNames = fileNames.filter((n) => n === UNIT + '.js' || (UNIT_DIR && n === UNIT));
const loaded = new Map();
const getUnit = (name) => { if (!loaded.has(name)) loaded.set(name, load.unit(path.join(dir, name))); return loaded.get(name); };

test('unit files: a file for every ready unit, a ready flag for every file', (t) => {
  if (UNIT || UNIT_DIR) return t.skip('single unit or fixture run');
  const warns = [];
  const errs = checkReady(ORG.UNITS, fileNames.map((n) => n.replace(/\.js$/, '')), warns);
  for (const w of warns) console.warn('WARNING: ' + w);
  assert.ok(!errs.length, '\n' + errs.join('\n'));
});

if (UNIT && !fileNames.length) test('UNIT ' + UNIT, () => assert.fail('no unit file ' + UNIT + '.js in ' + dir));

for (const name of fileNames) {
  test('unit file ' + name, () => {
    let unit;
    try { unit = getUnit(name); } catch (e) { assert.fail('[' + name + '] the unit file does not load: ' + e.message); }
    const meta = ORG.UNITS.find((m) => m.file === 'units/' + name);
    const idErrs = [];
    if (!UNIT_DIR) {
      if (!meta) idErrs.push('[' + name + '] not in ORG.UNITS');
      else if (unit.id !== meta.id) idErrs.push('[' + name + '] unit.id "' + unit.id + '" does not match the file (expected "' + meta.id + '")');
    }
    const res = checkUnit(unit, { guide: UNIT_DIR ? 'warn' : 'fail' });
    const seeds = Object.values(res.stats.seeds);
    console.log('[' + unit.id + '] ' + res.stats.ms + ' ms; notes words lt ' + res.stats.words.lt + ' / en ' + res.stats.words.en +
      '; generators ' + seeds.length + (seeds.length ? ' (' + Math.min(...seeds) + '-' + Math.max(...seeds) + ' seeds)' : '') +
      (res.stats.extras.length ? '; extra names to review: ' + res.stats.extras.join(' | ') : '') + '; names unchecked (outside namer scope): ' + res.stats.unchecked + (res.stats.uncheckedList.length ? ' e.g. ' + res.stats.uncheckedList.join(' ') : '') +
      (res.warnings.length ? '\n' + res.warnings.join('\n') : ''));
    const all = idErrs.concat(res.errors);
    assert.ok(!all.length, '\n' + all.length + ' defect(s) in ' + name + ':\n' + all.join('\n'));
  });
}

test('seminar and lab coverage when every unit is ready', (t) => {
  if (UNIT || UNIT_DIR) return t.skip('single unit or fixture run');
  const units = fileNames.map((n) => getUnit(n));
  const errs = checkSeminarCoverage(units, ORG.UNITS);
  assert.ok(!errs.length, '\n' + errs.join('\n'));
});

/* ================= the validator proves itself ================= */
// A fresh copy of the fixture unit (functions included), without loading the whole engine again.
function fresh() {
  let found = null;
  const ctx = vm.createContext({ ORG: { unit: (u) => { found = u; } } });
  vm.runInContext(fs.readFileSync(FIXTURE, 'utf8'), ctx, { filename: FIXTURE });
  return found;
}
const T = (lt, en) => ({ lt, en });
const run = (u, extra) => checkUnit(u, Object.assign({ guide: 'warn', seeds: 40 }, extra));
function only(u, re, extra) {
  const r = run(u, extra);
  assert.equal(r.errors.length, 1, 'expected exactly one error, got:\n' + r.errors.join('\n'));
  assert.match(r.errors[0], re);
  return r;
}
const bankOf = (u) => u.types[0].bank[0];

test('validator: the fixture unit passes (guide minimums are warnings there)', () => {
  const r = run(fresh());
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => /exercise types/.test(w)), 'guide warnings are printed');
  assert.equal(r.stats.unchecked, 0);
});

test('validator: guide minimums fail in strict mode', () => {
  const r = checkUnit(fresh(), { guide: 'fail', seeds: 60 });
  const text = r.errors.join('\n');
  assert.match(text, /the unit has 2 exercise types, the guide asks for at least 8/);
  assert.match(text, /the bank has 1 problems, the guide asks for at least 8/);
  assert.match(text, /notes have \d+ words in lt, the guide asks for 800 to 2000/);
  assert.match(text, /notes have \d+ words in en/);
  assert.match(text, /type u01\.gen, generator: the generator gave only 8 distinct problems/);
  const lab = fresh(); lab.id = 'l1';
  assert.match(checkUnit(lab, { guide: 'fail', seeds: 5 }).errors.join('\n'), /at least 5.*|asks for 400 to 1000/s);
});

test('validator: missing en', () => {
  const u = fresh(); delete bankOf(u).steps[0].hint.en;
  only(u, /\[u01\] structure: u01\.bank\.1\.steps\[0\]\.hint: text needs both lt and en/);
});

test('validator: duplicate bank id', () => {
  const u = fresh(); u.types[0].bank.push(JSON.parse(JSON.stringify(bankOf(u))));
  only(u, /duplicate problem id u01\.bank\.1/);
});

test('validator: answer out of range', () => {
  const u = fresh(); bankOf(u).steps[0].answer = 7;
  only(u, /u01\.bank\.1\.steps\[0\]: answer index out of range/);
});

test('validator: wrong claims, one error each, naming unit, type, problem and claim', () => {
  const wrong = [
    [{ name: ['CCCCC', T('butanas', 'butane')] }, /name of CCCCC is wrong: lt "butanas" \(namer: pentanas\); en "butane"/],
    [{ formula: ['CCCCC', 'C5H10'] }, /CCCCC has formula C5H12, not C5H10/],
    [{ cip: ['C[C@H](N)C(=O)O', 1, 'R'] }, /atom 1 of C\[C@H\]\(N\)C\(=O\)O is S, not R/],
    [{ ez: ['C/C=C/C', 1, 2, 'Z'] }, /bond 1-2 of C.C=C.C is E, not Z/],
    [{ centres: ['C[C@H](N)C(=O)O', [0]] }, /has stereocentres \[1\], not \[0\]/],
    [{ stereoisomers: ['C[C@H](N)C(=O)O', 4] }, /has 2 stereoisomers, not 4/],
    [{ isomers: ['C4H8', 5] }, /C4H8 has 3 constitutional isomers, not 5/],
    [{ isomers: ['C5H12', 4] }, /C5H12 has 3 constitutional isomers, not 4/],
    [{ hyb: ['C=C', 0, 'sp3'] }, /is sp2, not sp3/],
    [{ carbon: ['CC(C)C', 1, 2] }, /is class 3, not 2/],
    [{ sigmaPi: ['C=C', 5, 2] }, /5 sigma and 1 pi bonds/],
    [{ aromatic: ['CCCCCC', true] }, /is not aromatic/],
    [{ react: ['ae.hx', ['CC=C'], { X: 'Br' }, 'CCCBr'] }, /ae\.hx on CC=C gives major CC\(C\)Br, not CCCBr/],
    [{ same: ['CCO', 'CCC'] }, /are different structures/],
    [{ chiral: ['CCO', true] }, /is not chiral/],
    [{ nonsense: [1] }, /unknown claim kind "nonsense"/]
  ];
  for (const [claim, re] of wrong) {
    const u = fresh(); bankOf(u).claims = [claim];
    only(u, new RegExp('^\\[u01\\] type u01\\.bank, problem u01\\.bank\\.1, claims\\[0\\]: .*?' + re.source));
  }
});

test('validator: isomers claim options', () => {
  for (const c of [['C4H8', 5, 'any', { rings: true }], ['C4H8', 3]]) { const u = fresh(); bankOf(u).claims = [{ isomers: c }]; assert.deepEqual(run(u).errors, [], JSON.stringify(c)); }
});

test('validator: right claims pass (fixture carries one of each kind)', () => {
  const u = fresh();
  const kinds = bankOf(u).claims.map((c) => Object.keys(c)[0]).sort();
  assert.deepEqual(kinds, ['aromatic', 'carbon', 'centres', 'chiral', 'cip', 'ez', 'formula', 'hyb', 'isomers', 'name', 'react', 'same', 'sigmaPi', 'stereoisomers']);
  assert.deepEqual(run(u).errors, []);
});

test('validator: names outside the namer scope are counted, not failed', () => {
  const u = fresh(); bankOf(u).claims = [{ name: ['c1ccncc1', T('piridinas', 'pyridine')] }];
  const r = run(u);
  assert.deepEqual(r.errors, []);
  assert.equal(r.stats.unchecked, 1);
});

test('validator: name steps and molecule captions are checked against the namer', () => {
  let u = fresh(); bankOf(u).steps[6].answer = { lt: ['pentanas', 'heksanas'], en: ['pentane'] };
  only(u, /type u01\.bank, problem u01\.bank\.1, steps\[6\]: accepted lt name "heksanas" is wrong for CCCCC \(namer: pentanas\)/);
  u = fresh(); bankOf(u).steps[6].answer = { lt: ['pentanas'], en: ['pentane'], extra: { en: ['pentan'] } };
  only(u, /answer\.extra needs a src/);
  u = fresh(); bankOf(u).steps[6].answer = { lt: ['pentanas'], en: ['pentane'], extra: { en: ['pentan'], src: 'L1 p3' } };
  const rx = run(u); assert.deepEqual(rx.errors, []); assert.match(rx.stats.extras[0], /en "pentan" \(L1 p3\)/);
  u = fresh(); bankOf(u).q[1] = { mol: { smi: 'CCCCC', name: T('butanas', 'butane') } };
  only(u, /problem u01\.bank\.1, q: molecule name: name of CCCCC is wrong/);
  u = fresh(); bankOf(u).steps[6].answer = { smi: 'c1ccncc1' };
  only(u, /answer\.smi "c1ccncc1" is outside the namer's scope/);
  u = fresh(); bankOf(u).steps[6].answer = { smi: 'CCCCC' };
  assert.deepEqual(run(u).errors, []);
});

test('validator: atoms steps with from are recomputed', () => {
  let u = fresh(); Object.assign(bankOf(u).steps[2], { from: 'carbon:1', answer: [1] });
  only(u, /steps\[2\]: answer \[1\] differs from the engine's "carbon:1" atoms \[0,1\] in CC\(=O\)O/);
  u = fresh(); Object.assign(bankOf(u).steps[2], { from: 'carbon:1', answer: [1, 0] });
  assert.deepEqual(run(u).errors, []);
  u = fresh(); Object.assign(bankOf(u).steps[2], { from: 'aromatic', answer: undefined });
  only(u, /steps\[2\]: from "aromatic" gives no atoms in CC\(=O\)O/);
});

test('validator: an overlapping molecule needs coords', () => {
  let u = fresh(); bankOf(u).q.push({ mol: { smi: 'C1CC2CCC1C2' } });
  only(u, /problem u01\.bank\.1, q: molecule "C1CC2CCC1C2" does not draw cleanly \(overlaps \d+, crossings \d+, label clashes \d+\)/);
  u = fresh(); bankOf(u).q.push({ mol: { smi: 'C1CC2CCC1C2', opts: { coords: [[0, 0], [1, 0], [1.5, 1], [1, 2], [0, 2], [-0.5, 1], [0.5, 1]] } } });
  assert.deepEqual(run(u).errors, []);
});

test('validator: bad SMILES and atom numbers out of range', () => {
  let u = fresh(); bankOf(u).q.push({ mol: { smi: 'C(C' } });
  only(u, /SMILES "C\(C" does not parse/);
  u = fresh(); bankOf(u).steps[2].mol = { smi: 'CC(=O)O', opts: { numbers: [0, 9] } };
  only(u, /atom numbers out of range \(it has 4 atoms\): numbers 9/);
});

test('validator: text checks', () => {
  let u = fresh(); bankOf(u).why = T('Pirmas <b>žodis</b>.', 'First <b>word</b>.');
  const r = run(u);
  assert.equal(r.errors.length, 2);
  assert.match(r.errors[0], /problem u01\.bank\.1, why: lt text has "<" followed by a letter/);
  u = fresh(); bankOf(u).why = T('Same words here', 'Same words here');
  only(u, /lt and en are identical, one is not translated/);
  u = fresh(); bankOf(u).why = T('$C5H12$ ir $CH4$', '$C5H12$ and $CH4$'); // different words: fine
  assert.deepEqual(run(u).errors, []);
  u = fresh(); bankOf(u).why = T('$C5H12$ 12 NaOH', '$C5H12$ 12 NaOH'); // only formulas and numbers: fine
  assert.deepEqual(run(u).errors, []);
  u = fresh(); bankOf(u).why = T('Rezultatas undefined', 'Result is NaN');
  assert.equal(run(u).errors.length, 2);
});

test('validator: generators', () => {
  const gen = (fn) => { const u = fresh(); u.types[1].gen = fn; return u; };
  const base = (steps) => ({ q: [{ p: T('Klausimas', 'Question') }], steps, why: T('Priežastis', 'Reason') });
  const choice = (options) => ({ prompt: T('Kuris?', 'Which?'), kind: 'choice', options, answer: 0, hint: T('Užuomina', 'Hint'), solution: T('Sprendimas', 'Solution') });
  // duplicate options (text, and molecules that are the same structure written two ways)
  let r = only(gen((rng, ctx) => base([choice([{ text: T('Taip', 'Yes') }, { text: T('Ne', 'No') }, { text: T('Taip', 'Yes') }])])), /type u01\.gen, steps\[0\]: options 0 and 2 are the same \(same text in lt\): taip \(seed 1, seed 2, seed 3, seed 4, seed 5 and 35 more\)/);
  only(gen(() => base([choice([{ mol: { smi: 'OCC' } }, { mol: { smi: 'CCO' } }, { mol: { smi: 'CCC' } }])])), /options 0 and 1 are the same \(same molecule\)/);
  // enantiomers are different options
  assert.deepEqual(run(gen(() => base([choice([{ mol: { smi: 'C[C@H](N)C(=O)O' } }, { mol: { smi: 'C[C@@H](N)C(=O)O' } }, { mol: { smi: 'CCC' } }])]))).errors.filter((e) => !/distinct/.test(e)), []);
  // throws, non-determinism, NaN in a number, "undefined" in text, too few distinct problems
  only(gen(() => { throw new Error('boom'); }), /type u01\.gen, generator: gen threw: boom \(seed 1,/);
  only(gen(() => base([{ prompt: T('Kiek?', 'How many?'), kind: 'number', answer: { value: NaN, tol: 0 }, hint: T('H', 'H1'), solution: T('S', 'S1') }])), /answer needs {value, tol}/);
  const nondet = gen(() => base([choice([{ text: T('Taip', 'Yes') }, { text: T('Ne' + Math.random(), 'No' + Math.random()) }])]));
  only(nondet, /seed 1 gives different problems on two runs/);
  const few = gen(() => base([choice([{ text: T('Taip', 'Yes') }, { text: T('Ne', 'No') }])]));
  assert.match(checkUnit(few, { guide: 'fail', seeds: 40 }).errors.join('\n'), /the generator gave only 1 distinct problems in 40 seeds/);
  assert.ok(r.stats.seeds['u01.gen'] === 40);
});

test('validator: coverage keys and mirrors must be known task ids', () => {
  let u = fresh(); u.coverage['S9.1'] = ['u01.bank'];
  only(u, /^\[u01\] coverage: "S9\.1" is not a known task id/);
  u = fresh(); u.coverage['S1.16'] = ['u01.bank'];
  only(u, /"S1\.16" is not a known task id/);
  u = fresh(); u.coverage['LW3.2'] = ['u01.bank'];
  assert.deepEqual(run(u).errors, []);
  u = fresh(); u.coverage['S1.1'] = ['u01.bank', 'u01.nothing'];
  only(u, /no such exercise type: u01\.nothing/);
  u = fresh(); u.types[0].mirrors = ['S1.1', 'S8.2'];
  only(u, /type u01\.bank, mirrors: "S8\.2" is not a known task id/);
});

test('validator: seminar and lab coverage across units', () => {
  const lectures = Array.from({ length: 16 }, (_, i) => ({ id: 'u' + String(i + 1).padStart(2, '0'), ready: true }));
  const labs = Array.from({ length: 6 }, (_, i) => ({ id: 'l' + (i + 1), ready: true }));
  const all = allSeminarIds();
  const units = lectures.map((m, i) => ({ id: m.id, coverage: Object.fromEntries(all.filter((_, k) => k % 16 === i).map((k) => [k, ['x']])) }));
  const labUnits = labs.map((m) => ({ id: m.id, coverage: { 'LW1.1': ['x'], 'LW1.2': ['x'], 'LW1.3': ['x'], 'LW1.4': ['x'] } }));
  assert.equal(all.length, 140);
  assert.deepEqual(checkSeminarCoverage(units.concat(labUnits), lectures.concat(labs)), []);
  delete units[3].coverage[Object.keys(units[3].coverage)[0]];
  assert.match(checkSeminarCoverage(units.concat(labUnits), lectures.concat(labs))[0], /seminar tasks not covered by any unit \(1\): S\d\.\d+/);
  delete labUnits[2].coverage['LW1.4'];
  assert.match(checkSeminarCoverage(units.concat(labUnits), lectures.concat(labs)).join('\n'), /\[l3\] lab unit lists 3 LW items/);
  // not enforced while a lecture unit is not ready
  const staged = lectures.map((m, i) => Object.assign({}, m, { ready: i < 5 }));
  assert.deepEqual(checkSeminarCoverage(units.concat(labUnits), staged.concat(labs.map((m) => Object.assign({}, m, { ready: false })))), []);
});

test('validator: step answers are cross-checked, mirrors need coverage, small rules', () => {
  const numGen = (hi) => (rng, ctx) => ({ q: [{ p: T('K', 'Q') }], steps: [{ prompt: T('Kiek?', 'How many?'), kind: 'number', answer: { value: ctx.int(1, hi), tol: 0 }, hint: T('H', 'Hint'), solution: T('S', 'Sol') }], why: T('P', 'R') });
  const gen = (fn) => { const x = fresh(); x.types[1].gen = fn; return x; };
  // 2: formula answer against step.mol (or the problem's only statement molecule)
  let u = fresh(); bankOf(u).steps[7].answer = 'C5H10';
  only(u, /steps\[7\]: formula answer C5H10 is not the formula of CCCCC \(C5H12\)/);
  u = fresh(); delete bankOf(u).steps[7].mol; bankOf(u).q = [bankOf(u).q[1]]; bankOf(u).steps[7].answer = 'C5H10';
  only(u, /formula answer C5H10 is not the formula of CCCCC/);
  // 3: mirrors need coverage
  u = fresh(); delete u.coverage['S1.1']; u.coverage['S1.3'] = ['u01.bank'];
  only(u, /type u01\.bank, mirrors: "S1\.1" is mirrored but unit\.coverage\["S1\.1"\] does not list u01\.bank/);
  // 4: separator in generated-problem structure messages
  const r4 = run(gen(() => ({ q: [], steps: [], why: T('a', 'b') })));
  assert.ok(r4.errors.some((e) => /structure: problem: needs steps/.test(e)), r4.errors.join('\n'));
  // 5: a generator that throws on the second call of seed 1 is reported
  let calls = 0;
  u = gen((rng, ctx) => { if (++calls === 2) throw new Error('second'); return numGen(9)(rng, ctx); });
  assert.match(run(u).errors.join('\n'), /gen threw on the second run of seed 1: second/);
  // 6: option text compared trimmed and case-insensitively
  u = fresh(); bankOf(u).steps[0].options = [{ text: T('Etanas', 'Ethane') }, { text: T('etanas ', 'ethane') }, { text: T('Propanas', 'Propane') }];
  only(u, /steps\[0\]: options 0 and 1 are the same/);
  // 7: a slow generator fails, with the time and seed count; distinct problems scale with the seeds that ran
  u = gen((rng, ctx) => { const t = Date.now(); while (Date.now() - t < 5) { /* wait */ } return numGen(90)(rng, ctx); });
  assert.match(checkUnit(u, { guide: 'warn', seeds: 200, genMs: 100, slowIsWarning: false }).errors.join('\n'), /the generator is too slow: only \d+ of 200 seeds ran in the 0\.1 s limit \(\d+ ms in the generator\)/);
  // the validator's own checks (layout of a numbered molecule) are cached across seeds and do not count toward the limit
  u = gen((rng, ctx) => ({ q: [{ p: T('K', 'Q') }, { mol: { smi: 'CC(C)CC(O)C(=O)NC1CCCCC1', opts: { numbers: 'all' } } }], steps: [{ prompt: T('Kiek?', 'How many?'), kind: 'number', answer: { value: ctx.int(1, 90), tol: 0 }, hint: T('H', 'Hint'), solution: T('S', 'Sol') }], why: T('P', 'R') }));
  const t0 = Date.now();
  const rc = checkUnit(u, { guide: 'warn', seeds: 300, genMs: 2000 });
  assert.deepEqual(rc.errors, []);
  assert.equal(rc.stats.seeds['u01.gen'], 300);
  assert.ok(Date.now() - t0 < 5000, 'took ' + (Date.now() - t0) + ' ms');
  u = gen(numGen(3));
  assert.match(checkUnit(u, { guide: 'fail', seeds: 50 }).errors.join('\n'), /gave only 3 distinct problems in 50 seeds, the guide asks for at least 15/);
  assert.doesNotMatch(checkUnit(u, { guide: 'fail', seeds: 8 }).errors.join('\n'), /distinct problems/);
  // 8: symbols and a single word are not "untranslated"; two ordinary words are
  for (const x of ['pKa', 'pH', 'SN2', 'E1', 'Markovnikov', '$SN2$ ir E1']) { u = fresh(); bankOf(u).why = T(x, x); assert.deepEqual(run(u).errors, [], x); }
  u = fresh(); bankOf(u).why = T('Same ordinary words', 'Same ordinary words');
  only(u, /lt and en are identical/);
});

test('validator: claims on notes blocks, numbered examples, text lint', () => {
  const exampleBlock = (extra) => Object.assign({ example: { q: [{ p: T('Klausimas', 'Question') }, { mol: { smi: 'CC(C)C=CC', opts: { numbers: 'all' } } }], steps: [[{ p: T('Žingsnis', 'Step') }]] } }, extra);
  const withBlock = (b) => { const u = fresh(); u.notes[1].blocks.push(b); return u; };
  // 1: claims on blocks are checked, with the block location
  let r = only(withBlock(exampleBlock({ claims: [{ formula: ['CC(C)C=CC', 'C6H14'] }] })), /notes section "more", example block, claims\[0\]: CC\(C\)C=CC has formula C6H12, not C6H14/);
  assert.deepEqual(run(withBlock(exampleBlock({ claims: [{ formula: ['CC(C)C=CC', 'C6H12'] }] }))).errors, []);
  assert.deepEqual(run(withBlock({ p: T('Tekstas', 'Text'), claims: [{ chiral: ['CCO', false] }] })).errors, []);
  // 2: a numbered example without claims is a warning
  r = run(withBlock(exampleBlock({})));
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => /example block has a molecule with numbered atoms but no claims/.test(w)));
  assert.ok(!run(withBlock(exampleBlock({ claims: [{ formula: ['CC(C)C=CC', 'C6H12'] }] }))).warnings.some((w) => /numbered atoms/.test(w)));
  // 3: SMILES in learner text, genitive of -enas / -inas / -anas
  only(withBlock({ p: T('Junginys CC(C)C=CC yra alkenas.', 'The compound is an alkene.') }), /lt text shows a formula or SMILES to the learner \("CC\(C\)C=CC"\)/);
  only(withBlock({ p: T('Junginys yra alkenas.', 'The compound CC(C)C=CC is an alkene.') }), /en text shows a formula or SMILES/);
  for (const ok of ['Junginys $CC(C)C=CC$ yra alkenas.', 'Žiūrėkite (E)-2-butenas ir (R)-alaninas, C=O ryšys.', 'Naudokite pH ir SN2 bei NaOH.', 'Elektrofilinė jungimosi (AE) reakcija su HBr) ir (SR).']) assert.deepEqual(run(withBlock({ p: T(ok, ok + ' (en)') })).errors, [], ok);
  only(withBlock({ p: T('Butenos molekulė.', 'The butene molecule.') }), /genitive of -enas is -eno \("Butenos"\)/);
  only(withBlock({ p: T('Pentinos formulė.', 'The pentyne formula.') }), /genitive of -inas is -ino/);
  only(withBlock({ p: T('Propanos formulė.', 'The propane formula.') }), /genitive of -anas is -ano/);
  assert.deepEqual(run(withBlock({ p: T('Buteno formulė ir dienos metu.', 'The butene formula.') })).errors, []);
  // formulas such as NR2 / NR3+ are not atom-number references; neither is anything inside $...$
  for (const ok of ['Aminai: –NR2 ir NR3+ grupės.', 'Amines: NR2, NR3 and NR4+ groups.', 'Grupė $Nr. 2$ ir $atom 3$.', 'Nr 5 be taško', 'Daug atomų 3 vietose', 'carbon 2 of the chain', 'C-3']) assert.deepEqual(run(withBlock({ p: T(ok, ok + ' (en)') })).errors, [], ok);
  for (const bad of ['Žr. Nr. 3.', 'Žr. no. 3.', 'Atomas 2', 'atomo 4']) assert.equal(run(withBlock({ p: T(bad, bad + ' (en)') })).errors.length, 2, bad);
  // atom-number and section-number references
  r = run(withBlock({ p: T('Žiūrėkite atomą 3.', 'Look at atom 3.') })); assert.equal(r.errors.length, 2);
  assert.match(r.errors[0], /^\[u01\] notes section "more": lt text refers to an atom number \("atomą 3"\)/);
  r = run(withBlock({ p: T('Pažiūrėkite Nr. 2.', 'See no. 2.') })); assert.equal(r.errors.length, 2);
  const numbered = { example: { q: [{ p: T('Atomas 3 yra anglis.', 'Atom 3 is carbon.') }, { mol: { smi: 'CCCC', opts: { numbers: 'all' } } }], steps: [[{ p: T('Žingsnis', 'Step') }]] }, claims: [{ formula: ['CCCC', 'C4H10'] }] };
  assert.deepEqual(run(withBlock(numbered)).errors, []);
  let u = fresh(); bankOf(u).why = T('Atomas 1 yra karbonilo anglis.', 'Atom 1 is the carbonyl carbon.'); // steps[2] of the fixture has numbers: fine
  assert.deepEqual(run(u).errors, []);
  u = fresh(); bankOf(u).steps[2].mol = { smi: 'CC(=O)O' }; bankOf(u).steps[3].mol = { smi: 'CC(=O)O' }; bankOf(u).why = T('Atomas 1 yra karbonilo anglis.', 'Atom 1 is the carbonyl carbon.');
  assert.equal(run(u).errors.length, 4); // the why (lt, en) and the fixture solution of steps[2] (lt, en)
  r = run(withBlock({ p: T('Žr. 3 skyrių ir 2 skyriuje.', 'See section 3 and 2 section.') })); assert.equal(r.errors.length, 2);
  assert.match(r.errors[0], /refers to a section number/);
});

test('validator: views are rendered (mechanism arrows to a missing atom)', () => {
  const mechBlock = (to) => ({ mech: [{ scheme: { items: [{ smi: 'ClCl' }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to, half: true }], note: T('Homolizė', 'Homolysis') }] });
  const withBlock = (b) => { const u = fresh(); u.notes[1].blocks.push(b); return u; };
  assert.deepEqual(run(withBlock(mechBlock({ m: 0, a: 1 }))).errors, []);
  only(withBlock(mechBlock({ m: 0, a: 99 })), /notes section "more": mechanism step 0 does not render [(]lt[)]: .*99/);
  const u = fresh(); bankOf(u).q.push(mechBlock({ m: 0, a: 99 }));
  only(u, /type u01.bank, problem u01.bank.1, q: mechanism step 0 does not render/);
});

test('validator: a lone-pair arrow needs an atom with a lone pair', () => {
  const lpBlock = (smi, lp) => ({ mech: [{ scheme: { items: [{ smi, opts: { lonePairs: true } }, { plus: true }, { smi: 'Cl', opts: { allH: true } }] }, arrows: [{ from: { m: 0, lp }, to: { m: 1, a: 'H0' } }], note: T('Protonavimas', 'Protonation') }] });
  const withBlock = (b) => { const u = fresh(); u.notes[1].blocks.push(b); return u; };
  assert.deepEqual(run(withBlock(lpBlock('CC(C)=O', 3))).errors, []);   // oxygen
  assert.deepEqual(run(withBlock(lpBlock('C[CH2-]', 1))).errors, []);   // negatively charged carbon
  only(withBlock(lpBlock('CC(C)=O', 2)), /mechanism step 0 has a lone-pair arrow on atom 2 \(C\) of CC\(C\)=O, which has no lone pair/);
  const u = fresh(); bankOf(u).q.push(lpBlock('CCC', 0));
  only(u, /type u01.bank, problem u01.bank.1, q: mechanism step 0 has a lone-pair arrow on atom 0 \(C\)/);
});

test('validator: choice and multi texts must not point at options by position', () => {
  const bad = [
    ['Teisingi pirmas, antras ir ketvirtas.', 'The first, second and fourth are correct.'],
    ['Neteisingas tik antrasis.', 'Only the second is wrong.'],
    ['Teisingi pirmieji du teiginiai.', 'The first two are correct.'],
    ['Trečiasis variantas netinka.', 'The third option does not fit.'],
    ['Pirmoji lygtis subalansuota.', 'The first equation is balanced.'],
    ['Paskutinis variantas yra produktas.', 'The last one is the product.']
  ];
  for (const [lt, en] of bad) {
    let u = fresh(); bankOf(u).steps[0].solution = T(lt, en);
    let r = run(u);
    assert.equal(r.errors.length, 1, en);
    assert.match(r.errors[0], /text points at an option by its position/, en);
    u = fresh(); bankOf(u).why = T(lt, en);
    assert.match(run(u).errors[0] || '', /why: .*points at an option by its position/, en);
  }
  // ordinals that mean a stage, an equivalent or a drawn molecule are fine, and so is a problem that says its order is fixed
  const ok = [['Pirmoji stadija lėta, pirmiausia dvi sferos.', 'The first stage is slow; the first two spheres tie.'], ['Antrasis ekvivalentas jungiasi prie kitos anglies.', 'The second equivalent adds to the other carbon.']];
  for (const [lt, en] of ok) { const u = fresh(); bankOf(u).steps[0].solution = T(lt, en); assert.deepEqual(run(u).errors, [], en); }
  let u = fresh(); bankOf(u).steps[0].solution = T('Pirmasis junginys neturi $α$-H.', 'The first compound has no $α$-H, the first two are correct.'); bankOf(u).steps[0].fixedOrder = true;
  assert.deepEqual(run(u).errors, []);
  // steps that are not choice or multi are not checked
  u = fresh(); bankOf(u).steps.forEach((s) => { s.kind = s.kind; }); bankOf(u).steps[2].hint = T('Pirmas ir antras teisingi.', 'The first two are correct.');
  assert.deepEqual(run(u).errors, []);
});

test('validator: ready flags and unit files agree', () => {
  const meta = [{ id: 'u01', file: 'units/u01.js', ready: true }, { id: 'u02', file: 'units/u02.js', ready: false }, { id: 'u03', file: 'units/u03.js', ready: false }];
  assert.deepEqual(checkReady(meta, ['u01']), []);
  assert.match(checkReady(meta, [])[0], /unit u01 is marked ready in units.js but units\/u01\.js does not exist/);
  const warns = [];
  assert.deepEqual(checkReady(meta, ['u01', 'u02'], warns), []);
  assert.match(warns[0], /unit file u02\.js exists but the unit is not marked ready/);
  assert.match(checkReady(meta, ['u01', 'u09'])[0], /u09\.js is not in ORG\.UNITS/);
});

test('validator: a unit file that throws is reported, not swallowed', () => {
  assert.throws(() => load.unit(path.join(__dirname, 'fixtures', 'unit-throws.js')), (e) => /fixture unit that fails to load/.test(e.message));
});
