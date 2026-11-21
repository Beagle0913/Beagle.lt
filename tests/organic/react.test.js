'use strict';
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const ORG = load();
const { chem, react } = ORG;
const canon = (s) => chem.canonical(chem.parse(s));

// run a rule and return plain data
function R(rule, reactants, opts) {
  return load.plain(react.run(rule, reactants, opts || undefined));
}

// the set of products must be exactly `want` (SMILES), and `majors` exactly the major ones
function expectProducts(res, want, majors, msg) {
  const got = res.products.map((p) => p.smi).sort();
  const w = want.map(canon).sort();
  assert.deepStrictEqual(got, w, (msg || '') + ' products: got ' + JSON.stringify(got));
  if (majors) {
    const gm = res.products.filter((p) => p.major).map((p) => p.smi).sort();
    const wm = majors.map(canon).sort();
    assert.deepStrictEqual(gm, wm, (msg || '') + ' majors: got ' + JSON.stringify(gm));
  }
}

function only(res, smi) { expectProducts(res, [smi], [smi]); }

// rule ids required by the plan, added family by family
const REQUIRED = [
  'sr.halogenate', 'ae.hx', 'ae.h2o', 'ae.x2', 'ae.h2', 'ox.kmno4.mild', 'ox.kmno4.harsh', 'diene.hx',
  'yne.h2', 'yne.x2', 'yne.hx', 'yne.hydration', 'yne.cu', 'sear', 'side.br', 'side.ox',
  //@@REQUIRED
];

test('react: every required rule exists and has a Lithuanian and English title', () => {
  REQUIRED.forEach((id) => {
    const t = react.RULES[id] && react.RULES[id].title;
    assert.ok(t && t.lt && t.en, id);
  });
  Object.keys(react.RULES).forEach((id) => {
    assert.ok(REQUIRED.indexOf(id) >= 0, 'rule not in the required list: ' + id);
    const t = react.RULES[id].title;
    assert.ok(t.lt.length > 3 && t.en.length > 3, id);
  });
});

test('react: unknown rule and bad input throw', () => {
  assert.throws(() => react.run('nope', ['C']), (e) => /unknown rule/.test(e.message));
  assert.throws(() => react.run('ae.hx', ['C=C'], {}), (e) => /needs X/.test(e.message));
});

// ---------------------------------------------------------------- hydrocarbons

const majorsOf = (res) => res.products.filter((p) => p.major).map((p) => p.smi).sort();
const same = (a, b) => assert.deepStrictEqual(majorsOf(a), b.map(canon).sort());

test('sr.halogenate: butane + Cl2 gives both monochlorides, Br2 mainly 2-bromobutane', () => {
  expectProducts(R('sr.halogenate', ['CCCC'], { X: 'Cl' }), ['CCCCCl', 'CCC(C)Cl'], ['CCCCCl', 'CCC(C)Cl']);
  expectProducts(R('sr.halogenate', ['CCCC'], { X: 'Br' }), ['CCCCBr', 'CCC(C)Br'], ['CCC(C)Br']);
});

test('sr.halogenate: Br picks the tertiary C-H, neopentane gives one product, methylcyclopentane', () => {
  same(R('sr.halogenate', ['CC(C)CC'], { X: 'Br' }), ['CCC(C)(C)Br']);
  expectProducts(R('sr.halogenate', ['CC(C)(C)C'], { X: 'Cl' }), ['CC(C)(C)CCl'], ['CC(C)(C)CCl']);
  assert.strictEqual(R('sr.halogenate', ['CC1CCCC1'], { X: 'Cl' }).products.length, 4);
  same(R('sr.halogenate', ['CC1CCCC1'], { X: 'Br' }), ['CC1(Br)CCCC1']);
});

test('ae.hx: Markovnikov, carbocation stability, peroxide effect', () => {
  expectProducts(R('ae.hx', ['CC=C(C)C'], { X: 'Br' }), ['CCC(C)(C)Br', 'CC(Br)C(C)C'], ['CCC(C)(C)Br']);
  expectProducts(R('ae.hx', ['C=CC'], { X: 'Cl' }), ['CC(C)Cl', 'CCCCl'], ['CC(C)Cl']);
  expectProducts(R('ae.hx', ['CC=CCCC'], { X: 'Br' }), ['CC(Br)CCCC', 'CCC(Br)CCC'], ['CC(Br)CCCC', 'CCC(Br)CCC']);
  expectProducts(R('ae.hx', ['C=CC'], { X: 'Br', peroxide: true }), ['CC(C)Br', 'CCCBr'], ['CCCBr']);
  expectProducts(R('ae.hx', ['C=Cc1ccccc1'], { X: 'Br' }), ['CC(Br)c1ccccc1', 'BrCCc1ccccc1'], ['CC(Br)c1ccccc1']);
  // isopropylidenecyclohexane: two tertiary cations, two chloroalkanes
  expectProducts(R('ae.hx', ['CC(C)=C1CCCCC1'], { X: 'Cl' }), ['CC(C)(Cl)C1CCCCC1', 'CC(C)C1(Cl)CCCCC1'],
    ['CC(C)(Cl)C1CCCCC1', 'CC(C)C1(Cl)CCCCC1']);
});

test('ae.h2o: Markovnikov, and against it next to an electron-withdrawing group (propenoic acid)', () => {
  expectProducts(R('ae.h2o', ['C=C(C)C']), ['CC(C)(C)O', 'CC(C)CO'], ['CC(C)(C)O']);
  same(R('ae.h2o', ['CC1=CCCCC1']), ['CC1(O)CCCCC1']);
  expectProducts(R('ae.h2o', ['C=CC(=O)O']), ['OCCC(=O)O', 'CC(O)C(=O)O'], ['OCCC(=O)O']);
});

test('ae.x2, ae.h2', () => {
  only(R('ae.x2', ['C=C'], { X: 'Br' }), 'BrCCBr');
  only(R('ae.x2', ['CC=CC'], { X: 'Cl' }), 'CC(Cl)C(Cl)C');
  only(R('ae.h2', ['CC=C(C)C']), 'CCC(C)C');
  only(R('ae.h2', ['C=CC=C']), 'CCCC');
  assert.ok(R('ae.h2', ['CCC']).none);
});

test('ox.kmno4: mild gives the diol, harsh cleaves (acid, ketone, CO2)', () => {
  only(R('ox.kmno4.mild', ['CC=C(C)C']), 'CC(O)C(C)(C)O');
  expectProducts(R('ox.kmno4.harsh', ['CC=C(C)C']), ['CC(C)=O', 'CC(=O)O'], ['CC(C)=O', 'CC(=O)O']);
  expectProducts(R('ox.kmno4.harsh', ['CC(C)=C1CCCCC1']), ['CC(C)=O', 'O=C1CCCCC1'], ['CC(C)=O', 'O=C1CCCCC1']);
  const t = R('ox.kmno4.harsh', ['CCCC=C']);
  expectProducts(t, ['CCCC(=O)O', 'O=C=O'], ['CCCC(=O)O']);
  assert.strictEqual(t.products.find((p) => p.smi === canon('O=C=O')).by, true);
  expectProducts(R('ox.kmno4.harsh', ['CCC(C)=CCC=C']), ['CCC(C)=O', 'OC(=O)CC(=O)O', 'O=C=O'], ['CCC(C)=O', 'OC(=O)CC(=O)O']);
  only(R('ox.kmno4.harsh', ['C1CCC=CC1']), 'OC(=O)CCCCC(=O)O');
  only(R('ox.kmno4.harsh', ['CC1=CCCCC1']), 'CC(=O)CCCCC(=O)O');
  // ethene gives only CO2
  only(R('ox.kmno4.harsh', ['C=C']), 'O=C=O');
});

test('diene.hx: 1,2 and 1,4 products', () => {
  expectProducts(R('diene.hx', ['CC=CC=CC'], { X: 'Cl' }), ['CCC(Cl)C=CC', 'CC(Cl)C=CCC'], ['CCC(Cl)C=CC', 'CC(Cl)C=CCC']);
  expectProducts(R('diene.hx', ['C=CC=C'], { X: 'Br' }), ['C=CC(C)Br', 'CC=CCBr'], ['C=CC(C)Br', 'CC=CCBr']);
  assert.ok(R('diene.hx', ['C=CCC=C'], { X: 'Br' }).none, 'isolated diene');
  assert.strictEqual(R('ae.hx', ['C=CC=C'], { X: 'Br' }).products.length, 2);
});

test('alkynes: hydrogenation, halogens, HX, hydration, copper acetylide', () => {
  const y = 'CC(C)CC#C';
  only(R('yne.h2', [y], { eq: 2 }), 'CC(C)CCC');
  only(R('yne.h2', [y], { eq: 1, lindlar: true }), 'CC(C)CC=C');
  assert.ok(R('yne.h2', [y], { eq: 1 }).note, 'plain Pd does not stop at the alkene');
  only(R('yne.h2', [y], { eq: 1 }), 'CC(C)CCC');
  only(R('yne.x2', [y], { eq: 1, X: 'Br' }), 'CC(C)CC(Br)=CBr');
  only(R('yne.x2', [y], { eq: 2, X: 'Cl' }), 'CC(C)CC(Cl)(Cl)C(Cl)Cl');
  expectProducts(R('yne.hx', [y], { eq: 1, X: 'Br' }), ['CC(C)CC(Br)=C', 'CC(C)CC=CBr'], ['CC(C)CC(Br)=C']);
  expectProducts(R('yne.hx', [y], { eq: 2, X: 'Cl' }), ['CC(C)CC(Cl)(Cl)C', 'CC(C)CCC(Cl)Cl'], ['CC(C)CC(Cl)(Cl)C']);
  only(R('yne.hydration', [y]), 'CC(C)CC(C)=O');
  only(R('yne.hydration', ['C#C']), 'CC=O');
  expectProducts(R('yne.hydration', ['CC#CCC']), ['CCCC(C)=O', 'CCC(=O)CC'], ['CCCC(C)=O', 'CCC(=O)CC']);
  only(R('yne.cu', [y]), 'CC(C)CC#C[Cu]');
  only(R('yne.cu', ['C#C']), '[Cu]C#C[Cu]');
  assert.ok(R('yne.cu', ['CC#CC']).none);
});

test('sear: directing effects', () => {
  const toluene = R('sear', ['Cc1ccccc1'], { E: 'Cl' });
  expectProducts(toluene, ['Cc1ccccc1Cl', 'Cc1cccc(Cl)c1', 'Cc1ccc(Cl)cc1'], ['Cc1ccccc1Cl', 'Cc1ccc(Cl)cc1']);
  same(R('sear', ['c1ccc(cc1)[N+](=O)[O-]'], { E: 'Br' }), ['O=[N+]([O-])c1cccc(Br)c1']);
  only(R('sear', ['c1ccccc1'], { E: 'NO2' }), 'O=[N+]([O-])c1ccccc1');
  // N,N-dimethylaniline in strong acid acts as the ammonium ion: meta
  same(R('sear', ['CN(C)c1ccccc1'], { E: 'NO2' }), ['CN(C)c1cccc([N+](=O)[O-])c1']);
  // 4-nitrophenol: the OH decides (ortho to OH)
  same(R('sear', ['Oc1ccc([N+](=O)[O-])cc1'], { E: 'Br' }), ['Oc1ccc([N+](=O)[O-])cc1Br']);
  // tert-butyl: para only
  same(R('sear', ['Cc1ccccc1'], { E: 'C(C)(C)C' }), ['Cc1ccc(C(C)(C)C)cc1']);
  // seminar cases
  expectProducts(R('sear', ['COc1ccccc1'], { E: 'CH3' }), ['COc1ccccc1C', 'COc1cccc(C)c1', 'COc1ccc(C)cc1'], ['COc1ccccc1C', 'COc1ccc(C)cc1']);
  same(R('sear', ['N#Cc1ccccc1'], { E: 'NO2' }), ['N#Cc1cccc([N+](=O)[O-])c1']);
  same(R('sear', ['c1ccc2ccccc2c1'], { E: 'NO2' }), ['O=[N+]([O-])c1cccc2ccccc12']);
  // m-xylene: the position between the methyls is crowded
  same(R('sear', ['Cc1cccc(C)c1'], { E: 'Br' }), ['Cc1ccc(Br)c(C)c1']);
  // Koerner's method: the number of mononitro products of the dibromobenzenes
  assert.strictEqual(R('sear', ['Brc1ccc(Br)cc1'], { E: 'NO2' }).products.length, 1);
  assert.strictEqual(R('sear', ['Brc1ccccc1Br'], { E: 'NO2' }).products.length, 2);
  assert.strictEqual(R('sear', ['Brc1cccc(Br)c1'], { E: 'NO2' }).products.length, 3);
});

test('sear: Friedel-Crafts does not work on deactivated or amino rings', () => {
  assert.ok(R('sear', ['c1ccc(cc1)[N+](=O)[O-]'], { E: 'CH3' }).none);
  assert.ok(R('sear', ['Nc1ccccc1'], { E: 'C(C)=O' }).none);
  assert.ok(R('sear', ['CC(=O)c1ccccc1'], { E: 'C(C)=O' }).none);
  assert.ok(!R('sear', ['Brc1ccccc1'], { E: 'C(C)=O' }).none);
  assert.throws(() => react.run('sear', ['Cc1ccccc1'], { E: 'F' }), (e) => /needs E/.test(e.message));
});

test('side.br and side.ox', () => {
  only(R('side.br', ['Cc1ccccc1']), 'BrCc1ccccc1');
  only(R('side.br', ['CCc1ccccc1']), 'CC(Br)c1ccccc1');
  only(R('side.br', ['CC(C)c1ccccc1']), 'CC(C)(Br)c1ccccc1');
  assert.ok(R('side.br', ['c1ccccc1']).none);
  only(R('side.ox', ['Cc1ccccc1']), 'OC(=O)c1ccccc1');
  expectProducts(R('side.ox', ['Cc1ccc(CCC)cc1']), ['OC(=O)c1ccc(cc1)C(=O)O', 'CC(=O)O'], ['OC(=O)c1ccc(cc1)C(=O)O', 'CC(=O)O']);
  expectProducts(R('side.ox', ['CCc1ccccc1']), ['OC(=O)c1ccccc1', 'O=C=O'], ['OC(=O)c1ccccc1']);
  expectProducts(R('side.ox', ['CC(C)c1ccccc1']), ['OC(=O)c1ccccc1', 'O=C=O'], ['OC(=O)c1ccccc1']);
  assert.ok(R('side.ox', ['CC(C)(C)c1ccccc1']).none, 'no benzylic H');
});

test('wouldRearrange: shifts to a more stable cation', () => {
  const yes = ['CC(C)C=C', 'C=CC(C)(C)C', 'CC(O)C(C)C', 'OCC(C)(C)C', 'CC(Br)C(C)(C)C'];
  const no = ['C=CC', 'CC=C(C)C', 'CC(O)CC', 'CCCCO', 'CC(C)(C)O', 'CCCC=C', 'CC(Br)C', 'C1=CCCCC1'];
  yes.forEach((s) => assert.strictEqual(react.wouldRearrange(s), true, s));
  no.forEach((s) => assert.strictEqual(react.wouldRearrange(s), false, s));
});

//@@TESTS
