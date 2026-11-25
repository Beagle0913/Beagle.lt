'use strict';
// Regression tests for the fact-check fixes of the engine and u09 (plan 2026-11-25, Task A).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const load = require('./load.js');

const ORG = load();
const { chem, react, name: N, check: C } = ORG;
const canon = (s) => chem.canonical(chem.parse(s));
const plain = load.plain;

const run = (rule, rs, o) => plain(react.run(rule, rs, o || undefined));
const majors = (res) => res.products.filter((p) => p.major).map((p) => p.smi).sort();
const want = (list) => list.map(canon).sort();

// ---- A1: mercapto names are put in alphabetical order -------------------------------------
test('A1: mercapto / alkylthio alternatives keep the prefixes in alphabetical order', () => {
  const accepts = (smi, nm) => {
    const r = N.name(smi, { lang: 'en' });
    return [r.name].concat(r.alts).indexOf(nm) >= 0;
  };
  const step = (smi, input) => C.checkStep({ type: 'name', kind: 'name', answer: { smi } }, input, 'en').ok;
  assert.ok(accepts('SC(C)(C)CCO', '3-mercapto-3-methylbutan-1-ol'));
  assert.ok(accepts('SC(C)(C)CCO', '3-mercapto-3-methyl-1-butanol'));
  assert.ok(!accepts('SC(C)(C)CCO', '3-methyl-3-mercaptobutan-1-ol'));
  assert.ok(step('SC(C)(C)CCO', '3-mercapto-3-methylbutan-1-ol'));
  assert.ok(!step('SC(C)(C)CCO', '3-methyl-3-mercaptobutan-1-ol'));
  assert.ok(step('SC(C)(C)CCO', '3-methyl-3-sulfanylbutan-1-ol'));
  assert.ok(accepts('OCC(CC)CS', '2-(mercaptomethyl)butan-1-ol'));
  assert.ok(accepts('OCC(Cl)CS', '2-chloro-3-mercaptopropan-1-ol'));
  assert.ok(accepts('OCC(C)CS', '3-mercapto-2-methylpropan-1-ol'));
  assert.ok(!accepts('OCC(C)CS', '2-methyl-3-mercaptopropan-1-ol'));
  assert.ok(accepts('OCCC(C)(S)CC', '3-mercapto-3-methylpentan-1-ol'));
  assert.ok(accepts('OCCC(CC)(S)CC', '3-ethyl-3-mercaptopentan-1-ol'));
  assert.ok(accepts('CSCCO', '2-(methylthio)ethan-1-ol'));
  assert.ok(accepts('CSC(C)CO', '2-(methylthio)propan-1-ol'));
  assert.ok(accepts('CCSCC(O)C', '1-(ethylthio)propan-2-ol'));
  assert.ok(accepts('CCSCC(O)C', '1-(ethylsulfanyl)propan-2-ol'));
});

// ---- A2: acylation is para-selective ------------------------------------------------------
test('A2: Friedel-Crafts acylation of o/p-directing rings gives para only as the main product', () => {
  const ac = { E: 'C(C)=O' };
  [['Cc1ccccc1', 'Cc1ccc(cc1)C(C)=O'], ['COc1ccccc1', 'COc1ccc(cc1)C(C)=O'], ['Fc1ccccc1', 'Fc1ccc(cc1)C(C)=O'],
    ['CC(=O)Nc1ccccc1', 'CC(=O)Nc1ccc(cc1)C(C)=O'], ['CCc1ccccc1', 'CCc1ccc(cc1)C(C)=O'], ['Clc1ccccc1', 'Clc1ccc(cc1)C(C)=O']].forEach(([s, p]) => {
    const r = run('sear', [s], ac);
    assert.deepStrictEqual(majors(r), want([p]), s);
    assert.ok(r.products.length >= 2, s + ': the ortho ketone stays a minor product');
  });
  // alkylation and nitration still give o + p
  assert.deepStrictEqual(majors(run('sear', ['Cc1ccccc1'], { E: 'NO2' })), want(['Cc1ccccc1[N+](=O)[O-]', 'Cc1ccc(cc1)[N+](=O)[O-]']));
  assert.deepStrictEqual(majors(run('sear', ['Cc1ccccc1'], { E: 'CH3' })).length, 2);
  // benzene and a meta director are unchanged
  assert.deepStrictEqual(majors(run('sear', ['c1ccccc1'], ac)), want(['CC(=O)c1ccccc1']));
  assert.ok(run('sear', ['CC(=O)c1ccccc1'], ac).none);
});

// ---- A3: tertiary halide with a weakly basic nucleophile ------------------------------------
test('A3: tertiary halide + I-, HS-, RS- is SN1, never "SN2" / E2', () => {
  ['I', 'SH', 'SC'].forEach((nu) => {
    ['CC(C)(C)Br', 'CC(C)C(C)(C)Cl'].forEach((s) => {
      assert.ok(run('sn2', [s], { nu }).none, 'sn2 ' + s + ' ' + nu);
      const r = run('sn1', [s], { nu });
      assert.ok(!r.none, 'sn1 ' + s + ' ' + nu);
      assert.strictEqual(r.mech, 'SN1');
      const m = r.products.filter((p) => p.major);
      assert.strictEqual(m.length, 1);
      assert.ok(!/=/.test(m[0].smi), 'the major product is the substitution product, not an alkene');
    });
  });
  assert.deepStrictEqual(majors(run('sn1', ['CC(C)C(C)(C)Cl'], { nu: 'SH' })), want(['CC(C)C(C)(C)S']));
  assert.deepStrictEqual(majors(run('sn1', ['CC(C)(C)Br'], { nu: 'I' })), want(['CC(C)(C)I']));
  // strong bases still eliminate; other nucleophiles still refuse SN1
  assert.deepStrictEqual(majors(run('sn2', ['CC(C)(C)Br'], { nu: 'OC' })), want(['CC(C)=C']));
  assert.ok(run('sn1', ['CC(C)(C)Br'], { nu: 'CN' }).none);
  assert.deepStrictEqual(majors(run('sn2', ['CCBr'], { nu: 'I' })), want(['CCI']));
  // thiolate + tertiary halide: the sulfide by SN1
  const t = run('thiol.alkyl', ['CCS', 'CC(C)(C)Br']);
  assert.deepStrictEqual(majors(t), want(['CCSC(C)(C)C']));
  assert.strictEqual(t.mech, 'SN1');
  const p = run('thiol.alkyl', ['CCS', 'CCBr']);
  assert.deepStrictEqual(majors(p), want(['CCSCC']));
  assert.ok(p.mech === undefined || p.mech === 'SN2');
});

// ---- A4: radical halogenation of small rings -----------------------------------------------
test('A4: cyclobutane is halogenated like an alkane; only cyclopropane is refused', () => {
  assert.deepStrictEqual(majors(run('sr.halogenate', ['C1CCC1'], { X: 'Cl' })), want(['ClC1CCC1']));
  assert.deepStrictEqual(majors(run('sr.halogenate', ['CC1CCC1'], { X: 'Br' })), want(['CC1(Br)CCC1']));
  assert.ok(run('sr.halogenate', ['C1CC1'], { X: 'Cl' }).none);
  assert.ok(run('sr.halogenate', ['CC1CC1'], { X: 'Br' }).none);
  assert.deepStrictEqual(majors(run('sr.halogenate', ['C1CCCC1'], { X: 'Cl' })), want(['ClC1CCCC1']));
});

// ---- A5: alpha-hydroxy ketones and Tollens' reagent -----------------------------------------
test('A5: alpha-hydroxy ketones give a positive Tollens test; plain ketones do not', () => {
  ['OCC(=O)C(O)C(O)C(O)CO', 'CC(=O)CO', 'OCC(=O)CO'].forEach((s) => {
    const r = run('co.tollens', [s]);
    assert.ok(!r.none, s);
    assert.ok(r.products.some((p) => p.smi === '[Ag]'), s + ' deposits silver');
  });
  ['CC(=O)C', 'CCC(=O)CC', 'CC(=O)CCO', 'CC(O)CC(C)=O'].forEach((s) => assert.ok(run('co.tollens', [s]).none, s));
  assert.ok(!run('co.tollens', ['CC=O']).none);
});

// ---- A6: acid and vicinal diols ---------------------------------------------------------------
test('A6: acid dehydration of a vicinal diol gives no enols (no reaction)', () => {
  ['CC(O)CO', 'OCCO', 'CC(C)(O)C(C)(C)O', 'CCC(O)C(O)CC'].forEach((s) => assert.ok(run('elim', [s], { base: 'heat-acid' }).none, s));
  // ordinary alcohols are unaffected
  assert.deepStrictEqual(majors(run('elim', ['CCC(C)(C)O'], { base: 'heat-acid' })), want(['CC=C(C)C']));
  assert.ok(!run('elim', ['CC(O)CCO'], { base: 'heat-acid' }).none);
});

// ---- A7: side-chain oxidation of phenols and anilines -------------------------------------------
test('A7: side.ox gives no reaction when the ring carries a free OH or NH2/NHR', () => {
  ['Cc1ccc(O)cc1', 'Cc1ccc(N)cc1', 'Cc1ccc(NC)cc1', 'CCc1ccccc1O', 'Cc1ccc([O-])cc1'].forEach((s) => assert.ok(run('side.ox', [s]).none, s));
  // ethers and amides keep the ring intact
  assert.deepStrictEqual(majors(run('side.ox', ['Cc1ccc(OC)cc1'])), want(['COc1ccc(cc1)C(O)=O']));
  assert.deepStrictEqual(majors(run('side.ox', ['Cc1ccc(NC(C)=O)cc1'])), want(['CC(=O)Nc1ccc(cc1)C(O)=O']));
  assert.deepStrictEqual(majors(run('side.ox', ['Cc1ccccc1'])), want(['OC(=O)c1ccccc1']));
});

// ---- A8: nitration of aniline -----------------------------------------------------------------
test('A8: nitration of a free ArNH2 / ArNHR gives no clean product', () => {
  assert.ok(run('sear', ['Nc1ccccc1'], { E: 'NO2' }).none);
  assert.ok(run('sear', ['CNc1ccccc1'], { E: 'NO2' }).none);
  assert.ok(run('sear', ['Cc1ccc(N)cc1'], { E: 'NO2' }).none);
  // N,N-dialkylaniline (protonated: meta) and acetanilide (o/p) as before
  assert.deepStrictEqual(majors(run('sear', ['CN(C)c1ccccc1'], { E: 'NO2' })), want(['CN(C)c1cccc(c1)[N+](=O)[O-]']));
  assert.ok(majors(run('sear', ['CC(=O)Nc1ccccc1'], { E: 'NO2' })).length >= 1);
  // halogenation of aniline is not touched
  assert.ok(!run('sear', ['Nc1ccccc1'], { E: 'Br' }).none);
});

// ---- A9: two successive hydride shifts ------------------------------------------------------------
test('A9: wouldRearrange sees the two-shift case of 4-methylpentan-2-ol', () => {
  ['CC(C)CC(C)O', 'CC(C)CC(C)Br', 'CC(C)CC(C)Cl'].forEach((s) => assert.strictEqual(react.wouldRearrange(s), true, s));
  // plain cases stay false
  ['CCCC(C)O', 'CCC(C)O', 'CCCCC(C)O', 'CC(C)(C)O', 'CCCCBr', 'CC(C)CCO', 'CC=CC', 'CCC=C'].forEach((s) => assert.strictEqual(react.wouldRearrange(s), false, s));
  // the known cases are still found
  ['CC(C)C(C)O', 'CC(C)(C)C(C)O', 'CC(C)(C)C=C', 'CC(C)C=C'].forEach((s) => assert.strictEqual(react.wouldRearrange(s), true, s));
});

// ---- u09 generators -------------------------------------------------------------------------------
const u09 = load.unit(path.join(__dirname, '..', '..', 'site', 'organic', 'units', 'u09.js'));
const type = (id) => u09.types.find((x) => x.id === id);
const cache = {};
const problems = (id, n) => {
  const have = cache[id] || (cache[id] = []);
  for (let s = have.length + 1; s <= n; s++) have.push(C.makeProblem(type(id), s));
  return have.slice(0, n);
};
const txt = (x) => JSON.stringify(x);

test('A11: CF3 and CCl3 are -I only, not -M', () => {
  let n = 0;
  problems('u09.sear', 400).forEach((p) => {
    const sol = txt(p.steps[0].solution);
    if (!/\$CF3\$|\$CCl3\$/.test(sol)) return;
    n++;
    assert.ok(!/−M/.test(sol), 'CX3 text must not claim −M: ' + sol);
    assert.ok(/−I/.test(sol) && /no π bond/.test(sol) && /neturi/.test(sol));
  });
  assert.ok(n >= 5, 'CF3/CCl3 problems were found (' + n + ')');
  // NO2 and C=O keep −I, −M
  let m = 0;
  problems('u09.sear', 400).forEach((p) => { const sol = txt(p.steps[0].solution); if (/\$NO2\$/.test(sol)) { m++; assert.ok(/−M/.test(sol)); } });
  assert.ok(m >= 3);
});

test('A12: u09.sear acylation of an o/p director has para as the only main product', () => {
  let n = 0;
  problems('u09.sear', 400).forEach((p) => {
    if (!/CH3COCl/.test(txt(p.q))) return;
    const prod = p.steps[1];
    if (!prod || !prod.options || !prod.options[prod.answer] || !prod.options[prod.answer].mol) return; // the "no reaction" problems
    if (!p.steps.some((s) => s.kind === 'name')) return;
    n++;
    assert.strictEqual(prod.kind, 'choice', 'a single main product, not a multi-choice');
    const nm = N.name(prod.options[prod.answer].mol.smi, { lang: 'en' });
    assert.ok(nm && /\(4-|4-/.test(nm.name), 'the keyed ketone is the para isomer: ' + (nm && nm.name));
    const nameStep = p.steps.find((s) => s.kind === 'name');
    if (nameStep) assert.ok(/4-/.test(N.name(nameStep.answer.smi, { lang: 'en' }).name));
  });
  assert.ok(n >= 10, 'acylation problems found (' + n + ')');
});

test('A12: bank fc.5 and fc.8 key the para ketone only', () => {
  const fc = type('u09.fc');
  ['u09.fc.5', 'u09.fc.8'].forEach((id) => {
    const pr = fc.bank.find((b) => b.id === id);
    assert.ok(pr, id);
    const st = pr.steps[0];
    assert.strictEqual(st.kind, 'choice');
    assert.strictEqual(st.answer, 1);
    const keyed = st.options[st.answer].mol.smi;
    assert.ok(N.name(keyed, { lang: 'en' }).name.indexOf('4-') >= 0);
    assert.ok(pr.claims.every((c) => c.react[3] === keyed || canon(c.react[3]) === canon(keyed)));
    assert.ok(!/strong/i.test(txt(pr)), id + ' does not call the donor strong');
  });
});

test('A13: u09.side tert-butylbenzene + KMnO4 has its own reason', () => {
  let ox = 0;
  let sr = 0;
  problems('u09.side', 300).forEach((p) => {
    if (p.steps.length < 2 || !/tert-Butyl is too large|tert-butyl group deactivates/.test(txt(p.steps[1].options))) return;
    const s = txt(p.steps);
    const keyed = p.steps[1].options[p.steps[1].answer].text;
    if (/KMnO4/.test(txt(p.q))) {
      ox++;
      assert.ok(/KMnO4/.test(keyed.en) && !/bromine|radical/.test(keyed.en), keyed.en);
      assert.ok(/KMnO4/.test(keyed.lt) && !/bromas|radikal/.test(keyed.lt), keyed.lt);
      assert.ok(!/bromine in light/.test(txt(p.steps[0].solution)));
    } else if (/Br2/.test(txt(p.q))) {
      sr++;
      assert.ok(/bromine in light/.test(keyed.en));
    }
    assert.ok(s.length > 0);
  });
  assert.ok(ox >= 1 && sr >= 1, 'both cases found: ox ' + ox + ', sr ' + sr);
});

test('A14: u09.pos never asks OCH3 against NHCOCH3', () => {
  let n = 0;
  problems('u09.pos', 400).forEach((p) => {
    const sol = txt(p.steps);
    if (/\$NHCOCH3\$/.test(sol)) n++;
    assert.ok(!(/\$NHCOCH3\$/.test(sol) && /\$OCH3\$/.test(sol)), 'OCH3 and NHCOCH3 together: ' + sol.slice(0, 200));
  });
  assert.ok(n >= 5, 'NHCOCH3 still appears with other groups (' + n + ')');
});
