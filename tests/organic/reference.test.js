'use strict';
// Compares the trainer's own engine (ORG.chem, ORG.stereo) with RDKit's answers frozen in
// fixtures/reference.json (made by tools/organic/reference.py; RDKit is not needed to run this).
//
// Per entry: formula, aromatic atoms, stereocentres, CIP labels, E/Z, and (over all pairs with
// the same formula) same() against RDKit canonical SMILES equality.
// An entry may carry
//   aromaticNote  a documented model difference; only the aromatic-atom comparison is skipped
//   stereoNote    RDKit over-flags the stereocentres (cage compounds) and the engine is right; only the
//                 stereocentre and CIP comparisons are skipped
//   knownBug      a real engine disagreement; the entry is left out of the property tests and
//                 reported as a todo test, so the run stays green but the bug stays visible.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load.js');

// Only the chemistry files are needed; other files (draw, name, react ...) are not loaded.
const JS = path.join(__dirname, '..', '..', 'site', 'organic', 'js');
const ORG = load(['chem.js', 'stereo.js'].filter((f) => fs.existsSync(path.join(JS, f))));
const C = ORG.chem;
const S = ORG.stereo;
const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'reference.json'), 'utf8'));

const hillString = (counts) => {
  const els = Object.keys(counts).filter((el) => counts[el] > 0);
  const out = [];
  const add = (el) => out.push(el + (counts[el] > 1 ? counts[el] : ''));
  if (counts.C > 0) {
    add('C');
    if (counts.H > 0) add('H');
    els.filter((el) => el !== 'C' && el !== 'H').sort().forEach(add);
  } else {
    els.sort().forEach(add);
  }
  return out.join('');
};

const mols = new Map();
function parsed(e) {
  if (!mols.has(e.smi)) {
    try { mols.set(e.smi, C.parse(e.smi)); } catch (err) { mols.set(e.smi, { error: err.message }); }
  }
  return mols.get(e.smi);
}

const sameArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const num = (a, b) => a - b;

// Each check returns a problem string or null.
const checks = {
  parse(e) {
    const m = parsed(e);
    return m.error ? 'our parser throws: ' + m.error : null;
  },
  formula(e) {
    const m = parsed(e);
    if (m.error) return null;
    const ours = hillString(load.plain(C.formula(m)));
    const charge = m.atoms.reduce((s, a) => s + a.charge, 0);
    if (ours !== e.formula) return 'ours ' + ours + ', RDKit ' + e.formula;
    if (charge !== e.charge) return 'net charge ours ' + charge + ', RDKit ' + e.charge;
    return null;
  },
  aromatic(e) {
    const m = parsed(e);
    if (m.error || e.aromaticNote) return null;
    const ours = load.plain(C.aromaticAtoms(m)).sort(num);
    return sameArr(ours, e.aromaticAtoms) ? null : 'ours [' + ours + '], RDKit [' + e.aromaticAtoms + ']';
  },
  centres(e) {
    const m = parsed(e);
    if (m.error || e.stereoNote) return null;
    const ours = load.plain(S.stereocentres(m)).sort(num);
    return sameArr(ours, e.centres) ? null : 'ours [' + ours + '], RDKit [' + e.centres + ']';
  },
  cip(e) {
    const m = parsed(e);
    if (m.error || e.stereoNote) return null;
    const bad = [];
    for (const i of e.centres) {
      if (e.pseudo[i]) continue; // r/s pseudo-asymmetric labels are not R/S: not compared
      const rd = e.cip[i] || null;
      const ours = S.cip(m, i);
      if (ours !== rd) bad.push('atom ' + i + ' ours ' + ours + ', RDKit ' + rd);
    }
    return bad.length ? bad.join('; ') : null;
  },
  ez(e) {
    const m = parsed(e);
    if (m.error) return null;
    const want = new Map(e.ez.map(([a, b, l]) => [a + '-' + b, l]));
    const bad = [];
    for (const b of m.bonds) {
      if (b.order !== 2) continue;
      const lo = Math.min(b.a, b.b);
      const hi = Math.max(b.a, b.b);
      const rd = want.get(lo + '-' + hi) || null;
      const ours = S.ez(m, lo, hi);
      if (ours !== rd) bad.push('bond ' + lo + '=' + hi + ' ours ' + ours + ', RDKit ' + rd);
    }
    return bad.length ? bad.join('; ') : null;
  },
};
const stereoChecks = new Set(['centres', 'cip', 'ez']);

const known = FIX.molecules ? FIX.molecules : FIX;
const good = known.filter((e) => !e.knownBug);
const buggy = known.filter((e) => e.knownBug);

function collect(prop, entries) {
  const out = [];
  for (const e of entries) {
    const p = checks[prop](e);
    if (p) out.push(e.smi + ': ' + p);
  }
  return out;
}

function report(prop, problems, total) {
  assert.strictEqual(problems.length, 0,
    prop + ': ' + problems.length + ' of ' + total + ' entries disagree with RDKit\n  ' + problems.slice(0, 25).join('\n  '));
}

test('the fixture has at least 300 molecules and each entry has its fields', () => {
  assert.ok(known.length >= 300, 'only ' + known.length + ' entries');
  for (const e of known) {
    for (const k of ['smi', 'formula', 'charge', 'aromaticAtoms', 'centres', 'cip', 'pseudo', 'ez', 'canonical', 'flat']) {
      assert.ok(k in e, e.smi + ' lacks ' + k);
    }
  }
  assert.strictEqual(new Set(known.map((e) => e.smi)).size, known.length, 'duplicate smi in fixture');
});

for (const prop of ['parse', 'formula', 'aromatic']) {
  test('RDKit agreement: ' + prop, () => report(prop, collect(prop, good), good.length));
}

for (const prop of ['centres', 'cip', 'ez']) {
  test('RDKit agreement: ' + prop, { skip: !S && 'ORG.stereo is not written yet' },
    () => report(prop, collect(prop, good), good.length));
}

// Pairs: our same() equals RDKit's canonical SMILES equality, with and without stereo.
const groups = new Map();
for (const e of good) {
  const k = e.formula + '/' + e.charge;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(e);
}
test('RDKit agreement: same() on every pair with equal formula', () => {
  const bad = [];
  let pairs = 0;
  for (const list of groups.values()) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const ma = parsed(a);
      if (ma.error) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const mb = parsed(b);
        if (mb.error) continue;
        pairs++;
        const wantS = a.canonical === b.canonical;
        const gotS = C.same(ma, mb, { stereo: true });
        if (gotS !== wantS) bad.push('stereo ' + a.smi + ' vs ' + b.smi + ': ours ' + gotS + ', RDKit ' + wantS);
        const wantF = a.flat === b.flat;
        const gotF = C.same(ma, mb, { stereo: false });
        if (gotF !== wantF) bad.push('flat ' + a.smi + ' vs ' + b.smi + ': ours ' + gotF + ', RDKit ' + wantF);
      }
    }
  }
  assert.ok(pairs > 1000, 'only ' + pairs + ' pairs compared');
  report('same', bad, pairs);
});

test('canonical() is stable: every spelling of a molecule gives the same string', () => {
  const byBase = new Map();
  for (const e of good) {
    const base = e.variantOf || e.smi;
    const m = parsed(e);
    if (m.error) continue;
    if (!byBase.has(base)) byBase.set(base, new Set());
    byBase.get(base).add(C.canonical(m, { stereo: true }));
  }
  const bad = [...byBase].filter(([, set]) => set.size > 1).map(([b, set]) => b + ' -> ' + [...set].join(' | '));
  report('canonical', bad, byBase.size);
});

// Entries with a known engine bug: reported as todo, they never turn the run red.
const allGroups = new Map();
for (const e of known) {
  const k = e.formula + '/' + e.charge;
  if (!allGroups.has(k)) allGroups.set(k, []);
  allGroups.get(k).push(e);
}
const bugGroups = new Map(); // one group per molecule (RDKit canonical), so equal spellings share a verdict
for (const e of buggy) {
  const base = e.canonical;
  if (!bugGroups.has(base)) bugGroups.set(base, []);
  bugGroups.get(base).push(e);
}
for (const [base, list] of bugGroups) {
  const check = () => {
    const probs = [];
    for (const e of list) {
      for (const prop of Object.keys(checks)) {
        if (stereoChecks.has(prop) && !S) continue;
        const p = checks[prop](e);
        if (p) probs.push(e.smi + ' ' + prop + ': ' + p);
      }
    }
    const canon = new Set(list.map((e) => C.canonical(parsed(e), { stereo: true })));
    if (canon.size > 1) probs.push('spellings give ' + canon.size + ' canonical strings');
    for (const e of list) {
      for (const o of allGroups.get(e.formula + '/' + e.charge) || []) {
        if (o === e) continue;
        const want = e.canonical === o.canonical;
        if (C.same(parsed(e), parsed(o), { stereo: true }) !== want) probs.push('same(' + e.smi + ', ' + o.smi + ') should be ' + want);
        const wantF = e.flat === o.flat;
        if (C.same(parsed(e), parsed(o), { stereo: false }) !== wantF) probs.push('flat same(' + e.smi + ', ' + o.smi + ') should be ' + wantF);
      }
    }
    return probs;
  };
  const probs = check();
  // Still broken: a todo test (visible, never red). Fixed: a real failing test that says so.
  test(base + ' (' + list[0].knownBug + ')', probs.length ? { todo: list[0].knownBug } : {}, () => {
    assert.ok(probs.length > 0, 'fixed: remove from KNOWN_BUGS in tools/organic/reference.py (' + base + ')');
    assert.strictEqual(probs.length, 0, probs.join('; '));
  });
}
