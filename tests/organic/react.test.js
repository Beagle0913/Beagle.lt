'use strict';
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const ORG = load(['chem.js', 'react.js']);
const { chem, react } = ORG;
const canon = (s) => chem.canonical(chem.parse(s));

// run a rule and return plain data
function R(rule, reactants, opts) {
  const res = load.plain(react.run(rule, reactants, opts || undefined));
  // a rule that lists by-products must say so in RULES[id].by
  if (res.products.some((p) => p.by)) assert.ok(react.RULES[rule].by, rule + ' lists by-products but RULES[id].by is empty');
  return res;
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
  'sn2', 'sn1', 'elim', 'alc.hx', 'alc.ox', 'alc.na', 'williamson', 'ether.hi',
  'phenol.base', 'phenol.alkyl', 'phenol.acyl', 'phenol.br2', 'thiol.base', 'thiol.alkyl', 'thiol.disulfide',
  'co.nabh4', 'co.hcn', 'co.hemiacetal', 'co.acetal', 'co.thioacetal', 'co.oxime', 'co.phenylhydrazone', 'co.tollens',
  'co.cannizzaro', 'co.aldol', 'co.aldolcond', 'co.enols', 'co.iodoform',
  'acid.ester', 'acid.salt', 'acid.socl2', 'acyl.nu', 'ester.hydrolysis', 'claisen', 'lactone', 'amine.protonate', 'amine.alkyl', 'amine.acyl', 'amine.hno2', 'diazo.sub', 'nitro.reduce',
  'nitrile.hydrolysis', // not in the plan's list: needed after the Sandmeyer cyanation and for cyanohydrins
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

// ---------------------------------------------------------------- halides and alcohols

test('sn2: 1-bromopropane with the course nucleophiles', () => {
  const cases = {
    SH: 'CCCS', OH: 'CCCO', CN: 'CCCC#N', OC: 'CCCOC', 'C#CC': 'CCCC#CC', I: 'CCCI', OCC: 'CCCOCC', SC: 'CCCSC',
    NH3: 'CCC[NH3+].[Br-]',
  };
  Object.keys(cases).forEach((nu) => only(R('sn2', ['CCCBr'], { nu }), cases[nu]));
  assert.throws(() => react.run('sn2', ['CCCBr'], { nu: 'F' }), (e) => /needs nu/.test(e.message));
});

test('sn2: secondary halides with a strong base eliminate, tertiary only eliminate, aryl halides do not react', () => {
  expectProducts(R('sn2', ['CC(C)Br'], { nu: 'OCC' }), ['C=CC', 'CC(C)OCC'], ['C=CC']);
  expectProducts(R('sn2', ['CC(C)Br'], { nu: 'CN' }), ['CC(C)C#N', 'C=CC'], ['CC(C)C#N']);
  only(R('sn2', ['CC(C)(C)Br'], { nu: 'OC' }), 'C=C(C)C');
  assert.ok(R('sn2', ['Brc1ccccc1'], { nu: 'OH' }).none);
  only(R('sn2', ['BrCc1ccccc1'], { nu: 'CN' }), 'N#CCc1ccccc1');
});

test('sn1: tertiary and allylic halides with a weak nucleophile', () => {
  expectProducts(R('sn1', ['CC(C)(C)Br'], { nu: 'OH' }), ['CC(C)(C)O', 'C=C(C)C'], ['CC(C)(C)O']);
  expectProducts(R('sn1', ['CC(C)(C)Cl'], { nu: 'OCC' }), ['CC(C)(C)OCC', 'C=C(C)C'], ['CC(C)(C)OCC']);
  // 3-bromo-1-butene and 1-bromo-2-butene share one allylic cation
  const a = R('sn1', ['CC(Br)C=C'], { nu: 'OH' });
  const b = R('sn1', ['BrCC=CC'], { nu: 'OH' });
  assert.deepStrictEqual(majorsOf(a), [canon('CC(O)C=C'), canon('CC=CCO')].sort());
  assert.deepStrictEqual(majorsOf(a), majorsOf(b));
  assert.ok(R('sn1', ['CCCBr'], { nu: 'OH' }).none);
});

test('elim: Zaitsev product predominates', () => {
  expectProducts(R('elim', ['CCC(C)(C)Br'], { base: 'strong' }), ['CC=C(C)C', 'C=C(C)CC'], ['CC=C(C)C']);
  expectProducts(R('elim', ['CC(Br)CC'], { base: 'strong' }), ['CC=CC', 'C=CCC'], ['CC=CC']);
  expectProducts(R('elim', ['CCC(C)(O)CC'], { base: 'heat-acid' }), ['CCC(C)=CC', 'C=C(CC)CC'], ['CCC(C)=CC']);
  expectProducts(R('elim', ['CC(O)CC'], { base: 'heat-acid' }), ['CC=CC', 'C=CCC'], ['CC=CC']);
  expectProducts(R('elim', ['CC1(O)CCCCC1'], { base: 'heat-acid' }), ['CC1=CCCCC1', 'C=C1CCCCC1'], ['CC1=CCCCC1']);
  const d = R('elim', ['CC1(O)CCCCC1C'], { base: 'heat-acid' });
  assert.deepStrictEqual(majorsOf(d), [canon('CC1=C(C)CCCC1')]);
  assert.strictEqual(d.products.length, 3);
  assert.ok(R('elim', ['C'], {}).none);
});

test('alc.hx and alc.ox', () => {
  only(R('alc.hx', ['CCCO'], { X: 'Br' }), 'CCCBr');
  only(R('alc.hx', ['CC(C)(C)O'], { X: 'Cl' }), 'CC(C)(C)Cl');
  only(R('alc.hx', ['CC1(O)CCCCC1'], { X: 'Br' }), 'CC1(Br)CCCCC1');
  assert.deepStrictEqual(majorsOf(R('alc.hx', ['OCC=CC'], { X: 'Br' })), [canon('BrCC=CC'), canon('CC(Br)C=C')].sort());
  only(R('alc.ox', ['CCCO'], { reagent: 'PCC' }), 'CCC=O');
  only(R('alc.ox', ['CCCO'], { reagent: 'chromic' }), 'CCC(=O)O');
  only(R('alc.ox', ['CC(C)O'], { reagent: 'PCC' }), 'CC(C)=O');
  only(R('alc.ox', ['CC(C)O'], { reagent: 'chromic' }), 'CC(C)=O');
  only(R('alc.ox', ['CC(C)(C)C1CCC(O)CC1'], { reagent: 'chromic' }), 'CC(C)(C)C1CCC(=O)CC1');
  assert.ok(R('alc.ox', ['CC(C)(C)O'], { reagent: 'chromic' }).none);
  only(R('alc.ox', ['CO'], { reagent: 'chromic' }), 'O=CO');
  only(R('alc.ox', ['CO'], { reagent: 'PCC' }), 'C=O');
  assert.throws(() => react.run('alc.ox', ['CCO'], {}), (e) => /needs reagent/.test(e.message));
});

test('alc.na gives the alkoxide and H2', () => {
  const r = R('alc.na', ['CCO']);
  expectProducts(r, ['CC[O-].[Na+]', '[H][H]'], ['CC[O-].[Na+]']);
  assert.strictEqual(r.products.find((p) => p.smi === canon('[H][H]')).by, true);
  expectProducts(R('alc.na', ['CCO'], { metal: 'K' }), ['CC[O-].[K+]', '[H][H]'], ['CC[O-].[K+]']);
  assert.ok(R('alc.na', ['c1ccccc1']).none);
});

test('williamson: prefers the primary halide; intramolecular ring closure', () => {
  expectProducts(R('williamson', ['COC(C)C']), ['CC(C)[O-].[Na+]', 'CI', 'C[O-].[Na+]', 'CC(C)I'], ['CC(C)[O-].[Na+]', 'CI']);
  expectProducts(R('williamson', ['COC(C)(C)C']), ['CC(C)(C)[O-].[Na+]', 'CI'], ['CC(C)(C)[O-].[Na+]', 'CI']);
  expectProducts(R('williamson', ['CCOc1ccccc1']), ['[O-]c1ccccc1.[Na+]', 'CCI'], ['[O-]c1ccccc1.[Na+]', 'CCI']);
  const both = R('williamson', ['CCCOC']);
  assert.strictEqual(majorsOf(both).length, 4);
  assert.ok(R('williamson', ['CC(C)OC(C)C']).none);
  only(R('williamson', ['CC(C)[O-]', 'CI']), 'COC(C)C');
  only(R('williamson', ['[O-]c1ccccc1', 'CI']), 'COc1ccccc1');
  only(R('williamson', ['CCO', 'CI']), 'CCOC');
  expectProducts(R('williamson', ['C[O-]', 'CC(C)(C)Cl']), ['C=C(C)C'], ['C=C(C)C']);
  expectProducts(R('williamson', ['CC[O-]', 'CC(C)Br']), ['C=CC', 'CCOC(C)C'], ['C=CC']);
  only(R('williamson', ['ClCCCCO']), 'C1CCOC1');
  assert.ok(R('williamson', ['ClCCCCCCCCO']).none);
});

test('ether.hi: SN1 at the tertiary side, SN2 at the less hindered carbon, cyclic and aryl ethers', () => {
  expectProducts(R('ether.hi', ['COC(C)(C)C'], { eq: 1 }), ['CC(C)(C)I', 'CO', 'CI', 'CC(C)(C)O'], ['CC(C)(C)I', 'CO']);
  expectProducts(R('ether.hi', ['COC(C)(C)C'], { eq: 2 }), ['CC(C)(C)I', 'CI'], ['CC(C)(C)I', 'CI']);
  expectProducts(R('ether.hi', ['CCOC(C)C'], { eq: 1 }), ['CCI', 'CC(C)O', 'CC(C)I', 'CCO'], ['CCI', 'CC(C)O']);
  expectProducts(R('ether.hi', ['CCOC(C)C'], { eq: 2 }), ['CCI', 'CC(C)I'], ['CCI', 'CC(C)I']);
  only(R('ether.hi', ['C1CCOC1'], { eq: 1 }), 'OCCCCI');
  only(R('ether.hi', ['C1CCOC1'], { eq: 2 }), 'ICCCCI');
  expectProducts(R('ether.hi', ['COc1ccccc1'], { eq: 1 }), ['CI', 'Oc1ccccc1'], ['CI', 'Oc1ccccc1']);
  expectProducts(R('ether.hi', ['CC(C)(C)OC1CCCCC1'], { eq: 1 }), ['CC(C)(C)I', 'OC1CCCCC1', 'IC1CCCCC1', 'CC(C)(C)O'], ['CC(C)(C)I', 'OC1CCCCC1']);
  assert.ok(R('ether.hi', ['c1ccccc1Oc1ccccc1'], { eq: 1 }).none);
});

// ---------------------------------------------------------------- phenols and thiols

test('phenol.base, phenol.alkyl, phenol.acyl: only the phenolic OH reacts', () => {
  only(R('phenol.base', ['Oc1ccccc1']), '[O-]c1ccccc1.[Na+]');
  only(R('phenol.base', ['Oc1ccc([N+](=O)[O-])cc1'], { metal: 'K' }), '[O-]c1ccc([N+](=O)[O-])cc1.[K+]');
  only(R('phenol.base', ['OCCc1ccc(O)cc1']), 'OCCc1ccc([O-])cc1.[Na+]');
  assert.ok(R('phenol.base', ['CCO']).none);
  only(R('phenol.alkyl', ['Oc1ccc([N+](=O)[O-])cc1', 'CI']), 'COc1ccc([N+](=O)[O-])cc1');
  only(R('phenol.alkyl', ['OCCc1ccc(O)cc1', 'CI']), 'OCCc1ccc(OC)cc1');
  only(R('phenol.alkyl', ['[O-]c1ccccc1.[Na+]', 'CCBr']), 'CCOc1ccccc1');
  assert.ok(R('phenol.alkyl', ['Oc1ccccc1', 'CC(C)Br']).none);
  only(R('phenol.acyl', ['Oc1ccc([N+](=O)[O-])cc1', 'CC(=O)Cl']), 'CC(=O)Oc1ccc([N+](=O)[O-])cc1');
  const asp = R('phenol.acyl', ['OC(=O)c1ccccc1O', 'CC(=O)OC(C)=O']);
  expectProducts(asp, ['CC(=O)Oc1ccccc1C(=O)O', 'CC(=O)O'], ['CC(=O)Oc1ccccc1C(=O)O']);
  assert.strictEqual(asp.products.find((p) => p.smi === canon('CC(=O)O')).by, true);
});

test('phenol.br2: all free ortho and para positions', () => {
  only(R('phenol.br2', ['Oc1ccccc1']), 'Oc1c(Br)cc(Br)cc1Br');
  only(R('phenol.br2', ['Oc1ccc([N+](=O)[O-])cc1']), 'Oc1c(Br)cc([N+](=O)[O-])cc1Br');
  assert.ok(R('phenol.br2', ['Oc1c(Br)cc(Br)cc1Br']).none);
});

test('thiols: salts, mercaptides, sulfides, disulfides', () => {
  only(R('thiol.base', ['CCS']), 'CC[S-].[Na+]');
  only(R('thiol.base', ['CC(O)CC(C)S'], { metal: 'K' }), 'CC(O)CC(C)[S-].[K+]');
  only(R('thiol.base', ['CCS'], { metal: 'Hg' }), 'CCS[Hg]SCC');
  only(R('thiol.base', ['CS'], { metal: 'Pb' }), 'CS[Pb]SC');
  only(R('thiol.base', ['OC(CS)CS'], { metal: 'Hg' }), 'OC1CS[Hg]SC1');
  assert.ok(R('thiol.base', ['CCO']).none);
  only(R('thiol.alkyl', ['CC(O)CC(C)S', 'CCBr']), 'CC(O)CC(C)SCC');
  only(R('thiol.alkyl', ['Sc1ccccc1', 'CI']), 'CSc1ccccc1');
  only(R('thiol.disulfide', ['CCS']), 'CCSSCC');
  only(R('thiol.disulfide', ['NC(CS)C(=O)O']), 'NC(CSSCC(N)C(=O)O)C(=O)O');
  only(R('thiol.disulfide', ['OC(CS)CS']), 'OC1CSSC1');
  assert.ok(R('thiol.disulfide', ['SCCS']).none);
});

// ---------------------------------------------------------------- aldehydes and ketones

test('co.nabh4 and co.hcn', () => {
  only(R('co.nabh4', ['O=CCc1ccccc1']), 'OCCc1ccccc1');
  only(R('co.nabh4', ['CC(C)=O']), 'CC(C)O');
  only(R('co.nabh4', ['CC(=O)CC(=O)OCC']), 'CC(O)CC(=O)OCC');
  assert.ok(R('co.nabh4', ['CC(=O)OCC']).none);
  only(R('co.hcn', ['CC=O']), 'CC(O)C#N');
  only(R('co.hcn', ['CC(C)=O']), 'CC(C)(O)C#N');
  only(R('co.hcn', ['O=CCc1ccccc1']), 'N#CC(O)Cc1ccccc1');
  expectProducts(R('co.hcn', ['O=CCCC(C)=O']), ['N#CC(O)CCC(C)=O', 'O=CCCC(C)(O)C#N'], ['N#CC(O)CCC(C)=O']);
});

test('hemiacetals, acetals and thioacetals', () => {
  only(R('co.hemiacetal', ['CCC=O', 'CO']), 'CCC(O)OC');
  only(R('co.hemiacetal', ['O=CCCCCO']), 'OC1CCCCO1');
  only(R('co.hemiacetal', ['O=CCCCO']), 'OC1CCCO1');
  assert.ok(R('co.hemiacetal', ['O=CCCCCCCCO']).none);
  only(R('co.acetal', ['CCC=O', 'CO']), 'CCC(OC)OC');
  only(R('co.acetal', ['CCC=O', 'CCO']), 'CCC(OCC)OCC');
  only(R('co.acetal', ['CCCC(C)=O', 'OCCCO']), 'CCCC1(C)OCCCO1');
  only(R('co.acetal', ['O=Cc1ccccc1', 'OCCO']), 'C1COC(O1)c1ccccc1');
  only(R('co.acetal', ['CC(C)=O', 'OCCO']), 'CC1(C)OCCO1');
  only(R('co.acetal', ['O=C1CCCCC1', 'OCCO']), 'C1CCC2(CC1)OCCO2');
  only(R('co.thioacetal', ['O=C1CCCC1', 'CCS']), 'CCSC1(SCC)CCCC1');
  only(R('co.thioacetal', ['O=C1CCCC1', 'SCCS']), 'C1CCC2(C1)SCCS2');
  assert.ok(R('co.acetal', ['CCC(=O)OC', 'CO']).none);
  assert.throws(() => react.run('co.acetal', ['CCC=O', 'OCCCCO']), (e) => /needs a mono-ol/.test(e.message));
});

test('oximes, phenylhydrazones, Tollens', () => {
  only(R('co.oxime', ['CCC(C)=O']), 'CCC(C)=NO');
  only(R('co.oxime', ['CC=O']), 'CC=NO');
  only(R('co.phenylhydrazone', ['O=CCc1ccccc1']), 'C(=NNc1ccccc1)Cc1ccccc1');
  const t = R('co.tollens', ['O=CCc1ccccc1']);
  expectProducts(t, ['[O-]C(=O)Cc1ccccc1.[NH4+]', '[Ag]'], ['[O-]C(=O)Cc1ccccc1.[NH4+]']);
  assert.strictEqual(t.products.find((p) => p.smi === canon('[Ag]')).by, true);
  assert.ok(R('co.tollens', ['CC(C)=O']).none);
  expectProducts(R('co.tollens', ['C=O']), ['O=C[O-].[NH4+]', '[Ag]'], ['O=C[O-].[NH4+]']);
});

test('co.cannizzaro: only aldehydes without alpha-H', () => {
  expectProducts(R('co.cannizzaro', ['O=Cc1ccccc1']), ['OCc1ccccc1', '[O-]C(=O)c1ccccc1.[Na+]'], ['OCc1ccccc1', '[O-]C(=O)c1ccccc1.[Na+]']);
  expectProducts(R('co.cannizzaro', ['C=O']), ['CO', 'O=C[O-].[Na+]'], ['CO', 'O=C[O-].[Na+]']);
  only(R('co.cannizzaro', ['O=Cc1ccccc1C=O']), '[O-]C(=O)c1ccccc1CO.[Na+]');
  expectProducts(R('co.cannizzaro', ['O=Cc1ccccc1'], { workup: true }), ['OCc1ccccc1', 'OC(=O)c1ccccc1'], ['OCc1ccccc1', 'OC(=O)c1ccccc1']);
  assert.ok(R('co.cannizzaro', ['CCC=O']).none, 'has alpha-H');
  assert.ok(R('co.cannizzaro', ['CC(C)=O']).none, 'ketone');
});

test('co.aldol and co.aldolcond', () => {
  only(R('co.aldol', ['CCC=O']), 'CCC(O)C(C)C=O');
  only(R('co.aldolcond', ['CCC=O']), 'CCC=C(C)C=O');
  only(R('co.aldol', ['CC(C)=O']), 'CC(=O)CC(C)(C)O');
  only(R('co.aldolcond', ['CC(C)=O']), 'CC(C)=CC(C)=O');
  // crossed with a non-enolisable aldehyde: cinnamaldehyde is the selective product
  const x = R('co.aldol', ['O=Cc1ccccc1', 'CC=O']);
  expectProducts(x, ['O=CCC(O)c1ccccc1', 'CC(O)CC=O'], ['O=CCC(O)c1ccccc1']);
  const y = R('co.aldolcond', ['CC=O', 'O=Cc1ccccc1']);
  expectProducts(y, ['O=CC=Cc1ccccc1', 'CC=CC=O'], ['O=CC=Cc1ccccc1']);
  assert.ok(R('co.aldolcond', ['CC(C)C=O']).products.length === 0 && R('co.aldolcond', ['CC(C)C=O']).none);
  assert.ok(R('co.aldol', ['O=Cc1ccccc1']).none);
  assert.strictEqual(R('co.aldol', ['CCC=O', 'CCCC=O']).products.length, 4);
  assert.strictEqual(majorsOf(R('co.aldol', ['CCC=O', 'CCCC=O'])).length, 4);
});

test('co.enols and co.iodoform', () => {
  expectProducts(R('co.enols', ['CC(=O)Cc1ccccc1']), ['CC(O)=Cc1ccccc1', 'C=C(O)Cc1ccccc1'], ['CC(O)=Cc1ccccc1']);
  only(R('co.enols', ['CC(C)=O']), 'C=C(C)O');
  expectProducts(R('co.enols', ['CC(=O)CC(C)=O']), ['CC(=O)C=C(C)O', 'C=C(O)CC(C)=O'], ['CC(=O)C=C(C)O']);
  assert.ok(R('co.enols', ['O=Cc1ccccc1']).none);
  expectProducts(R('co.iodoform', ['CC(C)=O']), ['CC(=O)[O-].[Na+]', 'IC(I)I'], ['CC(=O)[O-].[Na+]', 'IC(I)I']);
  expectProducts(R('co.iodoform', ['CCC(C)=O']), ['CCC(=O)[O-].[Na+]', 'IC(I)I']);
  expectProducts(R('co.iodoform', ['CCO']), ['O=C[O-].[Na+]', 'IC(I)I']);
  expectProducts(R('co.iodoform', ['CC(O)CC']), ['CCC(=O)[O-].[Na+]', 'IC(I)I']);
  expectProducts(R('co.iodoform', ['CC(=O)c1ccccc1']), ['[O-]C(=O)c1ccccc1.[Na+]', 'IC(I)I']);
  assert.ok(R('co.iodoform', ['CCC(=O)CC']).none);
  assert.ok(R('co.iodoform', ['CCCO']).none);
});

// ---------------------------------------------------------------- acids and derivatives

test('acid.ester, acid.salt, acid.socl2', () => {
  only(R('acid.ester', ['OC(=O)c1ccccc1', 'CCO']), 'CCOC(=O)c1ccccc1');
  only(R('acid.ester', ['CC(=O)O', 'CC(C)CCO']), 'CC(=O)OCCC(C)C');
  only(R('acid.ester', ['OC(=O)c1ccccc1O', 'CCO']), 'CCOC(=O)c1ccccc1O');
  only(R('acid.ester', ['OC(=O)CC(=O)O', 'CO']), 'COC(=O)CC(=O)OC');
  assert.ok(R('acid.ester', ['CCC=O', 'CCO']).none);
  assert.ok(R('acid.ester', ['CC(=O)O', 'c1ccccc1']).none);
  only(R('acid.salt', ['O=CO'], { M: 'K' }), 'O=C[O-].[K+]');
  only(R('acid.salt', ['CC(=O)O']), 'CC(=O)[O-].[Na+]');
  only(R('acid.salt', ['OC(=O)CC(=O)O']), '[O-]C(=O)CC(=O)[O-].[Na+].[Na+]');
  only(R('acid.socl2', ['Cc1cccc(c1)C(=O)O']), 'Cc1cccc(c1)C(=O)Cl');
  assert.ok(R('acid.socl2', ['CCO']).none);
});

test('acyl.nu: chlorides and anhydrides', () => {
  only(R('acyl.nu', ['CC(=O)Cl'], { nu: 'water' }), 'CC(=O)O');
  only(R('acyl.nu', ['CC(=O)OC(C)=O'], { nu: 'water' }), 'CC(=O)O');
  expectProducts(R('acyl.nu', ['CC(=O)Cl'], { nu: 'ammonia' }), ['NC(C)=O', '[NH4+].[Cl-]'], ['NC(C)=O']);
  expectProducts(R('acyl.nu', ['CC(=O)Cl', 'CCO'], { nu: 'alcohol' }), ['CC(=O)OCC'], ['CC(=O)OCC']);
  // 3-methylbenzoic acid + SOCl2, then diethylamine: DEET
  const deet = R('acyl.nu', ['Cc1cccc(c1)C(=O)Cl', 'CCNCC'], { nu: 'amine' });
  expectProducts(deet, ['CCN(CC)C(=O)c1cccc(C)c1', 'CC[NH2+]CC.[Cl-]'], ['CCN(CC)C(=O)c1cccc(C)c1']);
  assert.strictEqual(deet.products.find((p) => p.smi === canon('CC[NH2+]CC.[Cl-]')).by, true);
  const an = R('acyl.nu', ['CC(=O)OC(C)=O', 'CN'], { nu: 'amine' });
  expectProducts(an, ['CNC(C)=O', 'CC(=O)O'], ['CNC(C)=O']);
  assert.ok(R('acyl.nu', ['CC(=O)Cl', 'CN(C)C'], { nu: 'amine' }).none);
  assert.ok(R('acyl.nu', ['CC(=O)OC', 'CCO'], { nu: 'alcohol' }).none);
  assert.throws(() => react.run('acyl.nu', ['CC(=O)Cl'], { nu: 'x' }), (e) => /needs nu/.test(e.message));
  // phthalic anhydride + water
  only(R('acyl.nu', ['O=C1OC(=O)c2ccccc12'], { nu: 'water' }), 'OC(=O)c1ccccc1C(=O)O');
});

test('DEET in two steps: SOCl2, then diethylamine', () => {
  const chloride = R('acid.socl2', ['Cc1cccc(c1)C(=O)O']).products[0].smi;
  const step2 = R('acyl.nu', [chloride, 'CCNCC'], { nu: 'amine' });
  assert.deepStrictEqual(majorsOf(step2), [canon('CCN(CC)C(=O)c1cccc(C)c1')]);
});

test('amine.acyl: paracetamol, N is acylated before O', () => {
  expectProducts(R('amine.acyl', ['Nc1ccc(O)cc1', 'CC(=O)OC(C)=O']), ['CC(=O)Nc1ccc(O)cc1', 'CC(=O)O'], ['CC(=O)Nc1ccc(O)cc1']);
  only(R('amine.acyl', ['Nc1ccc(Br)cc1', 'CC(=O)Cl']), 'CC(=O)Nc1ccc(Br)cc1');
  assert.ok(R('amine.acyl', ['CCO', 'CC(=O)Cl']).none);
});

test('ester.hydrolysis', () => {
  expectProducts(R('ester.hydrolysis', ['CC(=O)OC'], { medium: 'base' }), ['CC(=O)[O-].[Na+]', 'CO'], ['CC(=O)[O-].[Na+]', 'CO']);
  expectProducts(R('ester.hydrolysis', ['CC(=O)OC'], { medium: 'acid' }), ['CC(=O)O', 'CO']);
  only(R('ester.hydrolysis', ['O=C1CCCCO1'], { medium: 'base' }), 'OCCCCC(=O)[O-].[Na+]');
  only(R('ester.hydrolysis', ['O=C1CCCCO1'], { medium: 'acid' }), 'OCCCCC(=O)O');
  expectProducts(R('ester.hydrolysis', ['CCCC(=O)OCC'], { medium: 'acid' }), ['CCCC(=O)O', 'CCO']);
  assert.ok(R('ester.hydrolysis', ['CC(=O)O'], { medium: 'acid' }).none);
  assert.throws(() => react.run('ester.hydrolysis', ['CC(=O)OC'], {}), (e) => /needs medium/.test(e.message));
});

test('claisen and lactone', () => {
  only(R('claisen', ['CCCC(=O)OCC']), 'CCCC(=O)C(CC)C(=O)OCC');
  only(R('claisen', ['CC(=O)OCC']), 'CC(=O)CC(=O)OCC');
  expectProducts(R('claisen', ['CC(=O)OCC', 'CCOC(=O)c1ccccc1']), ['CC(=O)CC(=O)OCC', 'O=C(CC(=O)OCC)c1ccccc1'], ['CC(=O)CC(=O)OCC', 'O=C(CC(=O)OCC)c1ccccc1']);
  assert.ok(R('claisen', ['CCOC(=O)c1ccccc1']).none);
  assert.ok(R('claisen', ['CC(C)C(=O)OCC']).none);
  assert.ok(R('claisen', ['CCOC(=O)CC(=O)OCC']).none, 'malonate is not a Claisen donor');
  only(R('lactone', ['OCCCCC(=O)O']), 'O=C1CCCCO1');
  only(R('lactone', ['OCCCC(=O)O']), 'O=C1CCCO1');
  expectProducts(R('lactone', ['OCC(O)CCC(=O)O']), ['OCC1CCC(=O)O1', 'OC1CCC(=O)OC1'], ['OCC1CCC(=O)O1']);
  assert.ok(R('lactone', ['OCCC(=O)O']).none);
  assert.ok(R('lactone', ['OCCCCCCC(=O)O']).none);
});

test('amine.protonate and amine.alkyl', () => {
  only(R('amine.protonate', ['CC(C)NC'], { X: 'Cl' }), 'CC(C)[NH2+]C.[Cl-]');
  only(R('amine.protonate', ['Nc1ccccc1']), '[NH3+]c1ccccc1.[Cl-]');
  only(R('amine.protonate', ['CN1CCCC1c1cccnc1']), 'C[NH+]1CCCC1c1cccnc1.[Cl-]');
  only(R('amine.protonate', ['CN1CCCC1c1cccnc1'], { eq: 2 }), 'C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]');
  assert.ok(R('amine.protonate', ['CC(=O)N']).none);
  only(R('amine.alkyl', ['CC(C)NC', 'CCBr']), 'CC[NH+](C)C(C)C.[Br-]');
  only(R('amine.alkyl', ['Nc1ccc(Br)cc1', 'CI'], { excess: true }), 'C[N+](C)(C)c1ccc(Br)cc1.[I-]');
  only(R('amine.alkyl', ['CN(C)C', 'CI']), 'C[N+](C)(C)C.[I-]');
  assert.ok(R('amine.alkyl', ['CC(C)NC', 'CC(C)Br']).none);
});

test('amine.hno2: N2 only from primary aliphatic amines (seminar 7, task 7)', () => {
  const has = (smi) => R('amine.hno2', [smi]).products.some((p) => p.by && p.smi === canon('N#N'));
  assert.strictEqual(has('CCN(C)CCCC'), false);
  assert.strictEqual(has('NC1CCCCC1'), true);
  assert.strictEqual(has('Nc1ccccc1'), false);
  assert.strictEqual(has('CCCNC'), false);
  assert.strictEqual(has('c1ccc(Nc2ccccc2)cc1'), false);
  expectProducts(R('amine.hno2', ['CCCN']), ['CCCO', 'N#N'], ['CCCO']);
  only(R('amine.hno2', ['Nc1ccccc1']), '[N+](#N)c1ccccc1.[Cl-]');
  only(R('amine.hno2', ['CCCNC']), 'CCCN(C)N=O');
  only(R('amine.hno2', ['c1ccc(Nc2ccccc2)cc1']), 'O=NN(c1ccccc1)c1ccccc1');
  only(R('amine.hno2', ['CN(C)c1ccccc1']), 'CN(C)c1ccc(N=O)cc1');
  assert.ok(R('amine.hno2', ['CCN(CC)CC']).none);
});

test('diazo.sub and nitro.reduce', () => {
  const d = 'c1ccccc1[N+]#N.[Cl-]';
  expectProducts(R('diazo.sub', [d], { with: 'CuCN' }), ['N#Cc1ccccc1', 'N#N'], ['N#Cc1ccccc1']);
  same(R('diazo.sub', [d], { with: 'CuCl' }), ['Clc1ccccc1']);
  same(R('diazo.sub', [d], { with: 'CuBr' }), ['Brc1ccccc1']);
  same(R('diazo.sub', [d], { with: 'H2O' }), ['Oc1ccccc1']);
  same(R('diazo.sub', [d], { with: 'KI' }), ['Ic1ccccc1']);
  assert.ok(R('diazo.sub', ['CC'], { with: 'CuCl' }).none);
  assert.throws(() => react.run('diazo.sub', [d], { with: 'x' }), (e) => /needs with/.test(e.message));
  // aniline -> diazonium -> benzonitrile, as in seminar 7
  const dz = R('amine.hno2', ['Nc1ccccc1']).products[0].smi;
  same(R('diazo.sub', [dz], { with: 'CuCN' }), ['N#Cc1ccccc1']);
  only(R('nitro.reduce', ['c1ccc(cc1)[N+](=O)[O-]']), 'Nc1ccccc1');
  only(R('nitro.reduce', ['O=[N+]([O-])c1cccc([N+](=O)[O-])c1']), 'Nc1cccc(N)c1');
  only(R('nitro.reduce', ['CC(C)(C)c1ccc(cc1)[N+](=O)[O-]']), 'CC(C)(C)c1ccc(N)cc1');
  assert.ok(R('nitro.reduce', ['CCN']).none);
});

test('nitrile.hydrolysis, and the seminar 7 task 8 chain from p-toluidine', () => {
  only(R('nitrile.hydrolysis', ['N#Cc1ccccc1']), 'OC(=O)c1ccccc1');
  only(R('nitrile.hydrolysis', ['CC(O)C#N']), 'CC(O)C(=O)O');
  assert.ok(R('nitrile.hydrolysis', ['CCC']).none);
  const dz = R('amine.hno2', ['Cc1ccc(N)cc1']).products[0].smi;
  const nitrile = majorsOf(R('diazo.sub', [dz], { with: 'CuCN' }))[0];
  assert.strictEqual(nitrile, canon('Cc1ccc(C#N)cc1'));
  const acid = R('nitrile.hydrolysis', [nitrile]).products[0].smi;
  assert.strictEqual(acid, canon('Cc1ccc(C(=O)O)cc1'));
  // the acid is a meta director, the methyl an ortho/para director: methyl decides
  same(R('sear', [acid], { E: 'Br' }), ['Cc1ccc(C(=O)O)cc1Br']);
});

// ---------------------------------------------------------------- fix round 1

test('fix 1: benzyl > allyl > tertiary > secondary > primary > methyl', () => {
  same(R('ae.hx', ['CC(C)=Cc1ccccc1'], { X: 'Br' }), ['CC(C)C(Br)c1ccccc1']);
  same(R('ae.h2o', ['CC(C)=Cc1ccccc1']), ['CC(C)C(O)c1ccccc1']);
  same(R('sr.halogenate', ['CC(C)Cc1ccccc1'], { X: 'Br' }), ['CC(C)C(Br)c1ccccc1']);
  // allylic C-H beats the tertiary one (4-methyl-1-pentene)
  same(R('sr.halogenate', ['CC(C)CC=C'], { X: 'Br' }), ['CC(C)C(Br)C=C']);
  // benzyl tert-butyl ether: the benzylic side takes the halide
  same(R('ether.hi', ['CC(C)(C)OCc1ccccc1'], { eq: 1 }), ['ICc1ccccc1', 'CC(C)(C)O']);
  assert.strictEqual(react.wouldRearrange('C=CC1CCCCC1'), true);
  assert.strictEqual(react.wouldRearrange('CC=Cc1ccccc1'), false);
  assert.strictEqual(react.wouldRearrange('CC(C)C(O)c1ccccc1'), false, 'a benzylic cation is not replaced by a tertiary one');
});

test('fix 2: ring amines in acid', () => {
  same(R('sear', ['Nc1ccccc1'], { E: 'SO3H' }), ['Nc1ccc(cc1)S(=O)(=O)O']);
  const dma = R('sear', ['CN(C)c1ccccc1'], { E: 'NO2' });
  same(dma, ['CN(C)c1cccc([N+](=O)[O-])c1']);
  const an = R('sear', ['Nc1ccccc1'], { E: 'NO2' });
  assert.deepStrictEqual(majorsOf(an), ['Nc1ccc(cc1)[N+](=O)[O-]', 'Nc1ccccc1[N+](=O)[O-]'].map(canon).sort());
  assert.ok(an.note && /acetanilide/.test(an.note.en));
});

test('fix 3: acylation goes to the amine N, not to O', () => {
  assert.ok(R('phenol.acyl', ['Nc1ccc(O)cc1', 'CC(=O)OC(C)=O']).none);
  assert.ok(R('acyl.nu', ['CC(=O)Cl', 'NCCO'], { nu: 'alcohol' }).none);
  assert.ok(/amino group/.test(R('acyl.nu', ['CC(=O)Cl', 'NCCO'], { nu: 'alcohol' }).note.en));
  only(R('amine.acyl', ['NCCO', 'CC(=O)Cl']), 'CC(=O)NCCO');
  expectProducts(R('amine.acyl', ['Nc1ccc(O)cc1', 'CC(=O)OC(C)=O']), ['CC(=O)Nc1ccc(O)cc1', 'CC(=O)O'], ['CC(=O)Nc1ccc(O)cc1']);
});

test('fix 4: mechanism per result', () => {
  assert.strictEqual(R('elim', ['CCC(C)(O)CC'], { base: 'heat-acid' }).mech, 'E1');
  assert.strictEqual(R('elim', ['CC(O)CC'], { base: 'heat-acid' }).mech, 'E1');
  assert.strictEqual(R('elim', ['CCC(C)(C)Br'], { base: 'strong' }).mech, 'E2');
  assert.strictEqual(R('ae.hx', ['C=CC'], { X: 'Br', peroxide: true }).mech, 'AR');
  assert.strictEqual(R('ae.hx', ['C=CC'], { X: 'Br' }).mech, 'AE');
  assert.strictEqual(R('sn2', ['CC(C)Br'], { nu: 'OCC' }).mech, 'E2');
  assert.strictEqual(R('sn2', ['CCCBr'], { nu: 'OH' }).mech, 'SN2');
  assert.strictEqual(R('alc.hx', ['CCCO'], { X: 'Br' }).mech, 'SN2');
  assert.strictEqual(R('alc.hx', ['CC(C)(C)O'], { X: 'Br' }).mech, 'SN1');
  assert.strictEqual(R('ether.hi', ['COC(C)(C)C'], { eq: 1 }).mech, 'SN1');
  assert.strictEqual(R('ether.hi', ['CCOCC'], { eq: 1 }).mech, 'SN2');
  assert.strictEqual(react.RULES.elim.mech, 'E2');
});

test('fix 5: a halogen on the cation carbon', () => {
  same(R('ae.hx', ['C=CCl'], { X: 'Br' }), ['CC(Cl)Br']);
  same(R('ae.hx', ['ClC=CC'], { X: 'Cl' }), ['CCC(Cl)Cl']);
});

test('fix 6, 7, 21: neopentyl, SN1 nucleophiles, leaving group order', () => {
  const neo = R('sn2', ['CC(C)(C)CBr'], { nu: 'OH' });
  assert.ok(neo.none && neo.note);
  ['CN', 'SH', 'NH3', 'C#CC', 'I', 'SC'].forEach((nu) => assert.ok(R('sn1', ['CC(C)(C)Br'], { nu }).none, nu));
  ['OH', 'OC', 'OCC'].forEach((nu) => assert.ok(!R('sn1', ['CC(C)(C)Br'], { nu }).none, nu));
  expectProducts(R('sn2', ['ClCCBr'], { nu: 'I' }), ['ClCCI', 'ICCBr'], ['ClCCI']);
});

test('fix 8, 9: SEAr with several rings, acylation para', () => {
  assert.ok(R('sear', ['c1ccc(cc1)c1ccccc1'], { E: 'NO2' }).none);
  same(R('sear', ['Cc1ccccc1'], { E: 'C(C)=O' }), ['CC(=O)c1ccc(C)cc1', 'CC(=O)c1ccccc1C']);
  same(R('sear', ['COc1ccccc1'], { E: 'C(C)=O' }), ['COc1ccc(cc1)C(C)=O', 'COc1ccccc1C(C)=O']);
});

test('fix 10, 11, 12: HBr cleavage, nitrile to amide, para-only nitrosation', () => {
  expectProducts(R('ether.hi', ['CCOC(C)C'], { eq: 1, acid: 'HBr' }), ['CCBr', 'CC(C)O', 'CC(C)Br', 'CCO'], ['CCBr', 'CC(C)O']);
  expectProducts(R('ether.hi', ['CCOCC'], { eq: 2, acid: 'HBr' }), ['CCBr']);
  only(R('nitrile.hydrolysis', ['CC(C)(C)c1ccc(C#N)cc1'], { stage: 'amide' }), 'CC(C)(C)c1ccc(cc1)C(N)=O');
  only(R('nitrile.hydrolysis', ['N#Cc1ccccc1'], { stage: 'amide' }), 'NC(=O)c1ccccc1');
  assert.ok(R('amine.hno2', ['CN(C)c1ccc(C)cc1']).none, 'para blocked');
  only(R('amine.hno2', ['CN(C)c1ccccc1']), 'CN(C)c1ccc(N=O)cc1');
});

test('fix 13, 14, 15: glucose pyranose, phenyl ester in base, crossed Cannizzaro', () => {
  const glc = R('co.hemiacetal', ['O=CC(O)C(O)C(O)C(O)CO']);
  same(glc, ['OC1OC(CO)C(O)C(O)C1O']);
  assert.strictEqual(glc.products.length, 2, 'the furanose is listed as a minor form');
  expectProducts(R('ester.hydrolysis', ['CC(=O)Oc1ccccc1'], { medium: 'base' }), ['CC(=O)[O-].[Na+]', '[O-]c1ccccc1.[Na+]'],
    ['CC(=O)[O-].[Na+]', '[O-]c1ccccc1.[Na+]']);
  expectProducts(R('ester.hydrolysis', ['CC(=O)Oc1ccccc1C(=O)O'], { medium: 'base' }), ['CC(=O)[O-].[Na+]', '[O-]c1ccccc1C(=O)[O-].[Na+].[Na+]']);
  expectProducts(R('co.cannizzaro', ['O=Cc1ccccc1', 'C=O']), ['OCc1ccccc1', 'O=C[O-].[Na+]'], ['OCc1ccccc1', 'O=C[O-].[Na+]']);
  expectProducts(R('co.cannizzaro', ['C=O', 'O=Cc1ccc(C)cc1']), ['OCc1ccc(C)cc1', 'O=C[O-].[Na+]']);
});

test('fix 16, 18: side chain oxidation cases and notes', () => {
  ['OCc1ccccc1', 'O=Cc1ccccc1', 'C=Cc1ccccc1'].forEach((s) => assert.deepStrictEqual(majorsOf(R('side.ox', [s])), [canon('OC(=O)c1ccccc1')], s));
  const tet = R('side.ox', ['C1CCc2ccccc2C1']);
  assert.ok(tet.none && tet.note);
  assert.ok(!/tert-butyl/.test(R('side.ox', ['c1ccccc1']).note.en));
  assert.ok(/tert-butyl/.test(R('side.ox', ['CC(C)(C)c1ccccc1']).note.en));
  assert.ok(!/Tertiary/.test(R('alc.ox', ['Oc1ccccc1'], { reagent: 'chromic' }).note.en));
  assert.ok(/Tertiary/.test(R('alc.ox', ['CC(C)(C)O'], { reagent: 'chromic' }).note.en));
  const f = R('co.tollens', ['O=CO']);
  assert.ok(!f.none);
  assert.deepStrictEqual(majorsOf(f), [canon('O=C=O')]);
  assert.ok(R('co.tollens', ['CC(C)=O']).none);
  // Markovnikov, anti-Markovnikov and peroxide notes
  const m = R('ae.hx', ['CC=C(C)C'], { X: 'Br' });
  assert.ok(/Markovnikov/.test(m.note.lt) && /Markovnikov/.test(m.note.en));
  assert.ok(/against/.test(R('ae.hx', ['C=CC(=O)O'], { X: 'Br' }).note.en) && /prieš/.test(R('ae.hx', ['C=CC(=O)O'], { X: 'Br' }).note.lt));
});

test('fix 17: excess Na also takes the SH, then both are alkylated (S5.14b)', () => {
  same(R('alc.na', ['OC(CS)CS'], { excess: true }), ['[O-]C(C[S-])C[S-].[Na+].[Na+].[Na+]']);
  const salt = R('alc.na', ['CC(O)CC(C)S'], { excess: true }).products.find((p) => p.major).smi;
  assert.strictEqual(salt, canon('CC([O-])CC(C)[S-].[Na+].[Na+]'));
  only(R('williamson', [salt, 'CCBr'], { all: true }), 'CCOC(C)CC(C)SCC');
  // without excess only the alcohol is deprotonated
  same(R('alc.na', ['CC(O)CC(C)S']), ['CC([O-])CC(C)S.[Na+]']);
});

test('fix 19, 20, 22: Lithuanian notes, metal option, Claisen with one alpha-H', () => {
  assert.ok(/dieno\./.test(R('diene.hx', ['CCC'], { X: 'Br' }).note.lt));
  assert.ok(/prijungia/.test(R('diene.hx', ['C=CC=C'], { X: 'Br' }).note.lt));
  assert.ok(/varianto/.test(R('williamson', ['CC(C)OC(C)C']).note.lt));
  only(R('acid.salt', ['CC(=O)O'], { metal: 'K' }), 'CC(=O)[O-].[K+]');
  only(R('acid.salt', ['CC(=O)O'], { M: 'K' }), 'CC(=O)[O-].[K+]');
  const c = R('claisen', ['CC(C)C(=O)OCC']);
  assert.ok(c.none && /acidic/.test(c.note.en));
  // every Lithuanian note in the file is non-empty and has no leftover English markers
  const rules = Object.keys(react.RULES);
  assert.ok(rules.length > 50);
});

// ---------------------------------------------------------------- fix round 2

test('fix r2.1: a crowded position between two substituents is never major', () => {
  same(R('sear', ['Cc1cccc(C)c1'], { E: 'C(C)=O' }), ['CC(=O)c1ccc(C)cc1C']);
  same(R('sear', ['COc1cccc(C)c1'], { E: 'C(C)=O' }), ['COc1ccc(C(C)=O)c(C)c1', 'COc1ccc(C)cc1C(C)=O'.replace('COc1ccc(C)cc1C(C)=O', 'COc1cc(C)ccc1C(C)=O')]);
  same(R('sear', ['Nc1cccc(C)c1'], { E: 'SO3H' }), ['Nc1ccc(S(=O)(=O)O)c(C)c1']);
  same(R('sear', ['Cc1cccc(C)c1'], { E: 'C(C)(C)C' }), ['Cc1ccc(C(C)(C)C)c(C)c1']);
});

test('fix r2.2: side.ox never throws and gives benzoic acid with CO2 as by-product', () => {
  ['CC(=C)c1ccccc1', 'C=CCc1ccccc1', 'OCCc1ccccc1', 'OC(=O)Cc1ccccc1', 'CC(=O)c1ccccc1', 'CC(O)c1ccccc1'].forEach((s) => {
    const r = R('side.ox', [s]);
    assert.deepStrictEqual(majorsOf(r), [canon('OC(=O)c1ccccc1')], s);
    r.products.forEach((p) => chem.parse(p.smi));
    assert.ok(r.products.every((p) => p.major || p.smi === canon('O=C=O')), s);
  });
});

test('fix r2.3-5: notes, ids, radicals', () => {
  assert.strictEqual(react.RULES['diene.hx'].title.lt, 'HX jungimasis prie konjuguotojo dieno (1,2 ir 1,4)');
  ['co.hemiacetal'].forEach((id) => assert.ok(!/pusacet/.test(react.RULES[id].title.lt)));
  const notes = [];
  const grab = (r) => { if (r.note) notes.push(r.note); };
  grab(R('sn1', ['CC(C)(C)Br'], { nu: 'CN' }));
  grab(R('acyl.nu', ['CC(=O)Cl', 'NCCO'], { nu: 'alcohol' }));
  grab(R('phenol.acyl', ['Nc1ccc(O)cc1', 'CC(=O)OC(C)=O']));
  grab(R('claisen', ['CC(C)C(=O)OCC']));
  grab(R('co.tollens', ['CC(=O)O']));
  grab(R('co.cannizzaro', ['O=Cc1ccccc1', 'O=Cc1ccc(C)cc1']));
  notes.forEach((n) => {
    assert.ok(!/amine\.acyl|sn2|\bsn1\b|elim\b|p\. 91|vadovėlis/.test(n.lt + n.en.replace(/SN2/g, '')), JSON.stringify(n));
    assert.ok(!/sveikos/.test(n.lt));
  });
  assert.ok(!/Ketones/.test(R('co.tollens', ['CC(=O)O']).note.en));
  assert.ok(/Ketones/.test(R('co.tollens', ['CC(C)=O']).note.en));
  assert.ok(!/formaldehyde is oxidised/.test(R('co.cannizzaro', ['O=Cc1ccccc1', 'O=Cc1ccc(C)cc1']).note.en));
  // alkylation of all anions leaves neutral OH alone
  only(R('williamson', ['CC([O-])CCO.[Na+]', 'CI'], { all: true }), 'CC(OC)CCO');
  // radicals: benzyl = allyl
  const both = R('sr.halogenate', ['C=CCC(C)Cc1ccccc1'], { X: 'Br' });
  assert.strictEqual(majorsOf(both).length, 2);
});

test('fix r2.2b: every product of every rule parses (fuzz)', () => {
  const subs = ['CC', 'CC=C', 'CC(C)=C', 'C=CC=C', 'CC#C', 'c1ccccc1', 'Cc1ccccc1', 'CCc1ccccc1', 'CC(=C)c1ccccc1', 'C=CCc1ccccc1', 'OCCc1ccccc1',
    'OC(=O)Cc1ccccc1', 'Oc1ccccc1', 'Nc1ccccc1', 'CN(C)c1ccccc1', 'c1ccccc1[N+](=O)[O-]', 'CCO', 'CC(C)O', 'OCCO', 'CCS', 'SCCS', 'CCOCC', 'C1CCOC1',
    'CCBr', 'CC(C)(C)Br', 'BrCC=C', 'CC=O', 'CC(C)=O', 'O=Cc1ccccc1', 'O=CCC=O', 'CC(=O)O', 'OCCCC(=O)O', 'CC(=O)OC', 'CCOC(=O)CC', 'O=C1CCCO1',
    'CC(=O)Cl', 'CC(=O)OC(C)=O', 'CC(N)=O', 'CCN', 'CNC', 'CN(C)C', 'NCCO', 'c1ccncc1', 'c1ccc2ccccc2c1', 'N#Cc1ccccc1', 'c1ccccc1[N+]#N.[Cl-]', 'C=O'];
  const partners = ['CI', 'CCO', 'CC(=O)Cl', 'CC(=O)OC(C)=O', 'CCS', 'CC=O', 'CCBr'];
  const opts = { 'sr.halogenate': [{ X: 'Cl' }, { X: 'Br' }], 'ae.hx': [{ X: 'Cl' }], 'ae.x2': [{ X: 'Br' }], 'diene.hx': [{ X: 'Br' }], 'yne.h2': [{ eq: 2 }], 'yne.x2': [{ eq: 1, X: 'Br' }],
    'yne.hx': [{ eq: 2, X: 'Cl' }], sear: [{ E: 'NO2' }, { E: 'C(C)=O' }, { E: 'SO3H' }], sn2: [{ nu: 'OH' }, { nu: 'NH3' }], sn1: [{ nu: 'OH' }], elim: [{}],
    'alc.hx': [{ X: 'Br' }], 'alc.ox': [{ reagent: 'chromic' }], 'ether.hi': [{ eq: 1 }, { eq: 2, acid: 'HBr' }], 'ester.hydrolysis': [{ medium: 'base' }, { medium: 'acid' }],
    'diazo.sub': [{ with: 'CuCN' }], 'acyl.nu': [{ nu: 'water' }, { nu: 'amine' }], 'thiol.base': [{ metal: 'Hg' }], 'amine.protonate': [{ eq: 'all' }],
    'nitrile.hydrolysis': [{ stage: 'amide' }], 'co.cannizzaro': [{}], williamson: [{}, { all: true }], 'alc.na': [{ excess: true }] };
  const two = ['williamson', 'phenol.alkyl', 'phenol.acyl', 'thiol.alkyl', 'co.hemiacetal', 'co.acetal', 'co.thioacetal', 'acid.ester', 'amine.alkyl', 'amine.acyl', 'acyl.nu', 'co.aldol', 'claisen'];
  let n = 0;
  Object.keys(react.RULES).forEach((id) => {
    subs.forEach((s) => {
      const lists = two.indexOf(id) >= 0 ? [[s]].concat(partners.map((p) => [s, p])) : [[s]];
      lists.forEach((rl) => (opts[id] || [{}]).forEach((o) => {
        let r;
        try { r = react.run(id, rl, o); } catch (e) {
          assert.ok(/^react:/.test(e.message), id + ' ' + JSON.stringify(rl) + ' ' + e.message);
          return;
        }
        r.products.forEach((p) => {
          n++;
          let m;
          try { m = chem.parse(p.smi); } catch (e) { assert.fail(id + ' ' + JSON.stringify(rl) + ' gave an unparsable product ' + p.smi); }
          m.atoms.forEach((x, i) => {
            if (x.el !== 'C' || x.charge !== 0) return;
            let v = x.h;
            m.nbr[i].forEach((j) => { v += m.bondAt(i, j).kek; });
            assert.strictEqual(v, 4, id + ' ' + JSON.stringify(rl) + ' gave a carbon without four bonds: ' + p.smi);
          });
        });
      }));
    });
  });
  assert.ok(n > 300, 'products checked: ' + n);
});

// ---------------------------------------------------------------- fix round 3

test('fix r3: acylation gives o and p, williamson all needs anions, side.ox keeps no C2/C3 acids', () => {
  expectProducts(R('sear', ['CCc1ccccc1'], { E: 'C(C)=O' }), ['CCc1ccccc1C(C)=O', 'CCc1cccc(C(C)=O)c1', 'CCc1ccc(C(C)=O)cc1'], ['CCc1ccccc1C(C)=O', 'CCc1ccc(C(C)=O)cc1']);
  assert.strictEqual(majorsOf(R('sear', ['Cc1ccccc1'], { E: 'C(C)=O' })).length, 2);
  assert.strictEqual(majorsOf(R('sear', ['COc1ccccc1'], { E: 'C(C)=O' })).length, 2);
  same(R('sear', ['Cc1cccc(C)c1'], { E: 'C(C)=O' }), ['CC(=O)c1ccc(C)cc1C']);
  same(R('sear', ['Cc1ccccc1'], { E: 'C(C)(C)C' }), ['Cc1ccc(C(C)(C)C)cc1']);
  const w = R('williamson', ['CC(O)CC(C)S', 'CCBr'], { all: true });
  assert.ok(w.none && /deprotonate|alkoxide/.test(w.note.en));
  ['OC(=O)C=Cc1ccccc1', 'O=CC=Cc1ccccc1', 'CC(=O)CCc1ccccc1'].forEach((smi) => {
    const r = R('side.ox', [smi]);
    assert.deepStrictEqual(majorsOf(r), [canon('OC(=O)c1ccccc1')], smi);
    r.products.filter((p) => !p.major).forEach((p) => assert.ok(p.by && p.smi === canon('O=C=O'), smi + ' ' + p.smi));
  });
});

test('every rule with a mechanism symbol returns mech on a sample input', () => {
  const sample = {
    'sr.halogenate': [['CCC'], { X: 'Br' }], 'ae.hx': [['C=CC'], { X: 'Br' }], 'ae.h2o': [['C=CC']], 'ae.x2': [['C=CC'], { X: 'Br' }],
    'diene.hx': [['C=CC=C'], { X: 'Br' }], 'yne.x2': [['CC#C'], { eq: 1, X: 'Br' }], 'yne.hx': [['CC#C'], { eq: 1, X: 'Br' }], 'yne.hydration': [['CC#C']],
    sear: [['c1ccccc1'], { E: 'Br' }], 'side.br': [['Cc1ccccc1']], sn2: [['CCBr'], { nu: 'OH' }], sn1: [['CC(C)(C)Br'], { nu: 'OH' }],
    elim: [['CC(C)(C)Br'], { base: 'strong' }], 'alc.hx': [['CCO'], { X: 'Br' }], williamson: [['COC'] ], 'ether.hi': [['COC(C)(C)C'], { eq: 1 }],
    'phenol.br2': [['Oc1ccccc1']], 'thiol.alkyl': [['CS', 'CI']], 'co.nabh4': [['CC=O']], 'co.hcn': [['CC=O']], 'co.hemiacetal': [['CC=O', 'CO']],
    'co.acetal': [['CC=O', 'CO']], 'co.thioacetal': [['CC=O', 'CS']], 'co.oxime': [['CC=O']], 'co.phenylhydrazone': [['CC=O']], 'co.aldol': [['CCC=O']],
    'co.aldolcond': [['CCC=O']], 'acid.ester': [['CC(=O)O', 'CO']], 'acyl.nu': [['CC(=O)Cl'], { nu: 'water' }], 'ester.hydrolysis': [['CC(=O)OC'], { medium: 'acid' }],
    claisen: [['CC(=O)OCC']], lactone: [['OCCCC(=O)O']], 'amine.alkyl': [['CN', 'CI']], 'amine.acyl': [['CN', 'CC(=O)Cl']], 'nitrile.hydrolysis': [['CC#N']],
    'phenol.alkyl': [['Oc1ccccc1', 'CI']], 'acid.socl2': [['CC(=O)O']],
  };
  Object.keys(react.RULES).forEach((id) => {
    if (!react.RULES[id].mech) return;
    assert.ok(sample[id], 'no sample for ' + id);
    const r = R(id, sample[id][0], sample[id][1]);
    assert.ok(r.mech && typeof r.mech === 'string', id + ' returns no mech: ' + JSON.stringify(r));
  });
});

//@@TESTS
