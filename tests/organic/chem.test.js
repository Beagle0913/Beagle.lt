'use strict';
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const load = require('./load.js');

const ORG = load(['chem.js']);
const C = ORG.chem;
const P = load.plain;

const m = (s) => C.parse(s);
const types = (s) => C.groups(m(s)).map((g) => g.type).sort();
const hs = (s) => P(m(s).atoms.map((a) => a.h));

test('the engine loads without a window or a document', () => {
  assert.ok(C, 'ORG.chem exists');
  const ctx = load.context(['chem.js']); // what the engine itself can see
  assert.strictEqual(vm.runInContext('typeof window + "," + typeof document + "," + typeof require', ctx), 'undefined,undefined,undefined');
  assert.strictEqual(vm.runInContext('typeof ORG.chem.parse', ctx), 'function');
});

test('parse errors throw', () => {
  for (const bad of ['C(C', 'C1CC', '[Xx]', 'C==C', '', 'C)', 'C(', 'C.', '.C', 'C=', '=C', 'C11', 'C()C',
    '[C', 'C[', 'c1cccc1', 'cC', 'C1CC2', 'C=1CC-1']) {
    assert.throws(() => C.parse(bad), (e) => e && /^SMILES/.test(e.message), JSON.stringify(bad));
  }
});

test('parse builds atoms, bonds and neighbours', () => {
  const x = m('CC(=O)O');
  assert.strictEqual(x.atoms.length, 4);
  assert.strictEqual(x.bonds.length, 3);
  assert.deepEqual(P(x.nbr), [[1], [0, 2, 3], [1], [1]]);
  assert.strictEqual(x.bondAt(1, 2).order, 2);
  assert.strictEqual(x.bondAt(2, 1).order, 2);
  assert.strictEqual(x.bondAt(0, 2), null);
  assert.deepEqual(hs('CC(=O)O'), [3, 0, 0, 1]);
  assert.deepEqual(P(x.atoms.map((a) => a.comp)), [0, 0, 0, 0]);
  assert.strictEqual(m('CC.O').atoms[2].comp, 1);
  const ion = m('[NH4+]');
  assert.strictEqual(ion.atoms[0].h, 4);
  assert.strictEqual(ion.atoms[0].charge, 1);
  assert.strictEqual(m('C[C@@H](N)O').atoms[1].chiral, '@@');
  assert.strictEqual(m('C%10CC%10').bonds.length, 3);
  assert.strictEqual(m('[O-]').atoms[0].h, 0); // bracket atoms carry exactly the H they state
  assert.strictEqual(m('[CH2]').atoms[0].h, 2);
  assert.strictEqual(m('C=1CCCCC1').bondAt(0, 5).order, 2); // ring bond order from the opening digit
});

test('explicit [H] atoms are folded into the H count', () => {
  const x = m('[H]C([H])([H])[H]');
  assert.strictEqual(x.atoms.length, 1);
  assert.strictEqual(x.atoms[0].h, 4);
});

test('formulas', () => {
  const f = (s) => C.formulaString(m(s));
  assert.strictEqual(f('CC(C)(C)CC(CC)CC'), 'C10H22'); // C10 alkane: 2*10+2 = 22 H
  assert.strictEqual(f('CC(=O)Oc1ccccc1C(=O)O'), 'C9H8O4');
  assert.strictEqual(f('CC(=O)Nc1ccc(O)cc1'), 'C8H9NO2');
  assert.strictEqual(f('NC(CS)C(=O)O'), 'C3H7NO2S');
  assert.strictEqual(f('CC(=O)[O-].[Na+]'), 'C2H3NaO2'); // net charge 0, so no charge sign
  assert.strictEqual(f('[NH4+]'), 'H4N+'); // no carbon: all symbols alphabetical
  assert.strictEqual(f('CC(=O)[O-]'), 'C2H3O2−');
  assert.strictEqual(f('c1ccccc1'), 'C6H6');
  assert.strictEqual(f('c1cc[nH]c1'), 'C4H5N'); // pyrrole
  assert.strictEqual(f('c1ccncc1'), 'C5H5N'); // pyridine
  assert.strictEqual(f('ClC(Cl)(Cl)Cl'), 'CCl4');
  assert.deepEqual(P(C.formula(m('CCO'))), { C: 2, H: 6, O: 1 });
});

test('aromatic input is kekulised for the H count', () => {
  assert.deepEqual(hs('c1cc[nH]c1'), [1, 1, 1, 1, 1]); // pyrrole: four CH and NH
  assert.deepEqual(hs('c1ccncc1'), [1, 1, 1, 0, 1, 1]); // pyridine: N has no H
  assert.deepEqual(hs('c1ccc2ccccc2c1'), [1, 1, 1, 0, 1, 1, 1, 1, 0, 1]);
  assert.deepEqual(hs('c1ccoc1'), [1, 1, 1, 0, 1]); // furan: O has no H
  assert.deepEqual(hs('Cn1cccc1'), [3, 0, 1, 1, 1, 1]); // N-methylpyrrole: N has three bonds and no H
  assert.deepEqual(hs('O=c1cccc[nH]1'), [0, 0, 1, 1, 1, 1, 1]); // 2-pyridone: O, C=O carbon, four ring CH and NH
  assert.throws(() => C.parse('c1cccc1'), (e) => /kekulise/.test(e.message)); // five aromatic carbons: cannot be kekulised
});

test('unsaturation', () => {
  assert.strictEqual(C.unsaturation(m('c1ccccc1')), 4);
  // The brief lists 4 for C=CC#N, but acrylonitrile is C3H3N: (2*3+2+1-3)/2 = 3 (C=C is 1, C#N is 2).
  assert.strictEqual(C.unsaturation(m('C=CC#N')), 3);
  assert.strictEqual(C.unsaturation(m('C1CCCCC1')), 1);
  assert.strictEqual(C.unsaturation(m('CC(=O)O')), 1); // C2H4O2: (4+2-4)/2
  assert.strictEqual(C.unsaturation(m('c1ccncc1')), 4); // C5H5N: (10+2+1-5)/2
  assert.strictEqual(C.unsaturation(m('ClCCl')), 0); // CH2Cl2: (2+2-2-2)/2
});

test('carbonClass counts carbon neighbours', () => {
  const x = m('CC(C)(C)CC(CC)CC');
  assert.strictEqual(C.carbonClass(x, 0), 1);
  assert.strictEqual(C.carbonClass(x, 1), 4);
  assert.strictEqual(C.carbonClass(x, 4), 2); // CH2 between C1 and C5
  assert.strictEqual(C.carbonClass(x, 5), 3); // CH with C4, C6, C8
  assert.strictEqual(C.carbonClass(m('C'), 0), 0);
  assert.strictEqual(C.carbonClass(m('CO'), 1), 0); // not a carbon
});

test('hybridization', () => {
  const h = (s) => P(m(s).atoms.map((a, i) => C.hybridization(m(s), i)));
  assert.deepEqual(h('C=CC#N'), ['sp2', 'sp2', 'sp', 'sp']);
  assert.strictEqual(C.hybridization(m('CC(=O)O'), 1), 'sp2');
  assert.deepEqual(h('CC(=O)O'), ['sp3', 'sp2', 'sp2', 'sp2']); // acid OH oxygen: its lone pair is in a p orbital, conjugated with C=O
  assert.deepEqual(h('C=C=C'), ['sp2', 'sp', 'sp2']);
  assert.deepEqual(h('C#C'), ['sp', 'sp']);
  assert.deepEqual(h('c1ccccc1'), ['sp2', 'sp2', 'sp2', 'sp2', 'sp2', 'sp2']);
  assert.deepEqual(h('c1cc[nH]c1'), ['sp2', 'sp2', 'sp2', 'sp2', 'sp2']); // pyrrole N is part of the aromatic ring
  assert.deepEqual(h('CC'), ['sp3', 'sp3']);
  assert.deepEqual(h('C[CH2+]'), ['sp3', 'sp2']); // carbocation: three sigma bonds, empty p
  assert.deepEqual(h('CCl'), ['sp3', null]); // halogens have no hybridization here
  assert.deepEqual(h('CS(=O)(=O)C'), ['sp3', 'sp3', 'sp2', 'sp2', 'sp3']); // sulfone S: four sigma bonds, tetrahedral
});

test('hybridization: steric number, and lone pairs next to a pi system', () => {
  const hy = (s, i) => C.hybridization(m(s), i);
  assert.strictEqual(hy('CC(N)=O', 2), 'sp2'); // acetamide N
  assert.strictEqual(hy('Nc1ccccc1', 0), 'sp2'); // aniline N
  assert.strictEqual(hy('CN', 1), 'sp3'); // methylamine N
  assert.strictEqual(hy('CCO', 2), 'sp3'); // ethanol O
  assert.strictEqual(hy('Oc1ccccc1', 0), 'sp2'); // phenol O
  assert.strictEqual(hy('CC(=O)OC', 3), 'sp2'); // ester alkoxy O
  assert.strictEqual(hy('C=CN', 2), 'sp2'); // enamine N
  assert.strictEqual(hy('C[S](C)=O', 1), 'sp3'); // DMSO S: 3 sigma + 1 lone pair
  assert.strictEqual(hy('C[S](C)=O', 3), 'sp2'); // DMSO O
  assert.strictEqual(hy('[CH3+]', 0), 'sp2');
  assert.strictEqual(hy('[CH3]', 0), 'sp2'); // methyl radical: three sigma bonds
  assert.strictEqual(hy('[CH3-]', 0), 'sp3'); // carbanion: 3 sigma + 1 lone pair
  assert.strictEqual(hy('[CH2-]C=O', 0), 'sp2'); // enolate carbon: lone pair conjugated
  assert.strictEqual(hy('c1ccoc1', 3), 'sp2'); // furan O
  assert.strictEqual(hy('c1ccncc1', 3), 'sp2'); // pyridine N
  assert.strictEqual(hy('FB(F)F', 1), 'sp2'); // BF3
  assert.strictEqual(hy('CC#N', 2), 'sp');
  assert.strictEqual(hy('C[NH3+]', 1), 'sp3');
  assert.strictEqual(hy('CS(N)(=O)=O', 1), 'sp3'); // sulfonyl S is tetrahedral and not a pi partner
  assert.strictEqual(hy('CS(N)(=O)=O', 2), 'sp3'); // sulfonamide N next to a sulfonyl S: no pi partner
});

test('bondCounts: sigma and pi, hydrogens included', () => {
  assert.deepEqual(P(C.bondCounts(m('C=C'))), { sigma: 5, pi: 1 }); // 1 C-C + 4 C-H
  assert.deepEqual(P(C.bondCounts(m('C#C'))), { sigma: 3, pi: 2 }); // 1 C-C + 2 C-H
  assert.deepEqual(P(C.bondCounts(m('C=CC=C'))), { sigma: 9, pi: 2 }); // 3 C-C + 6 C-H
  assert.deepEqual(P(C.bondCounts(m('CC#N'))), { sigma: 5, pi: 2 }); // C-C, C-N, 3 C-H
  assert.deepEqual(P(C.bondCounts(m('c1ccccc1'))), { sigma: 12, pi: 3 }); // 6 C-C + 6 C-H, three Kekule double bonds
  assert.deepEqual(P(C.bondCounts(m('CC(=O)O'))), { sigma: 7, pi: 1 }); // C-C, C-O, C=O, O-H, 3 C-H
});

test('lonePairs', () => {
  assert.strictEqual(C.lonePairs(m('CO'), 1), 2); // O: 6 valence e, 2 in bonds -> 4 left = 2 pairs
  assert.strictEqual(C.lonePairs(m('CN'), 1), 1); // N: 5 - 3
  assert.strictEqual(C.lonePairs(m('CCl'), 1), 3); // Cl: 7 - 1
  assert.strictEqual(C.lonePairs(m('CC=O'), 2), 2); // carbonyl O: 6 - 2
  assert.strictEqual(C.lonePairs(m('CC(=O)[O-]'), 3), 3); // O-: 6 + 1 - 1 = 6 electrons
  assert.strictEqual(C.lonePairs(m('[NH4+]'), 0), 0);
  assert.strictEqual(C.lonePairs(m('c1ccncc1'), 3), 1); // pyridine N, in-plane pair
  assert.strictEqual(C.lonePairs(m('c1cc[nH]c1'), 3), 1); // pyrrole N, the pair is in the p orbital
  assert.strictEqual(C.lonePairs(m('c1ccoc1'), 3), 2); // furan O
  assert.strictEqual(C.lonePairs(m('CC'), 0), 0);
  assert.strictEqual(C.lonePairs(m('[CH3-]'), 0), 1); // carbanion: 4 + 1 - 3 = 2 electrons
});

test('rings: SSSR', () => {
  const sizes = (s) => C.rings(m(s)).map((r) => r.length).sort();
  assert.deepEqual(sizes('CCC'), []);
  assert.deepEqual(sizes('C1CCCCC1'), [6]);
  assert.deepEqual(sizes('c1ccc2ccccc2c1'), [6, 6]);
  assert.deepEqual(sizes('C12C3C4C1C5C2C3C45'), [4, 4, 4, 4, 4]); // cubane: 12 bonds - 8 atoms + 1
  assert.deepEqual(sizes('C1C2CC3CC1CC(C2)C3'), [6, 6, 6]); // adamantane
  assert.deepEqual(sizes('C1CC2CCC1C2'), [5, 5]); // norbornane: SSSR keeps the two 5-rings
  assert.deepEqual(sizes('C1CC1.C1CCC1'), [3, 4]);
  assert.deepEqual(sizes('C1CCC2(C1)CCC2'), [4, 5]); // spiro
  const r = C.rings(m('C1CCCCC1'))[0];
  assert.deepEqual(P([...r].sort()), [0, 1, 2, 3, 4, 5]);
});

test('aromaticity', () => {
  const aromatic = [
    ['c1ccccc1', 6], ['c1ccc2ccccc2c1', 10], ['c1cc[nH]c1', 5], ['c1ccoc1', 5], ['c1ccsc1', 5],
    ['c1ccncc1', 6], ['c1cncnc1', 6], ['c1c[nH]cn1', 5], ['c1ccc2[nH]ccc2c1', 9],
    ['c1ncc2[nH]cnc2n1', 9], ['[cH-]1cccc1', 5], ['[cH+]1cccccc1', 7],
    ['C1=CC=CC=C1', 6], // Kekule benzene is perceived aromatic
    ['C1=CNC=C1', 5], // Kekule pyrrole with implicit H on N
    ['C1=CC=C2C=CC=CC2=C1', 10], // Kekule naphthalene
    ['[CH+]1C=CC=CC=C1', 7], // tropylium written with double bonds
    ['O=c1cccc[nH]1', 6], // 2-pyridone ring: C=O contributes 0, NH 2, two C=C 4
    ['c1ccc2cccc2cc1', 10], // azulene: 5-ring and 7-ring are aromatic only together (10 pi electrons)
    ['[CH+]1C=C1', 3], // cyclopropenyl cation: 2 pi electrons
    ['Cc1ccccc1', 6],
  ];
  for (const [s, n] of aromatic) {
    const x = m(s);
    assert.strictEqual(C.aromaticAtoms(x).length, n, s);
    for (const r of C.rings(x)) assert.strictEqual(C.isAromaticRing(x, r), true, s);
  }
  const notAromatic = ['C1=CC=CC=CC=C1', 'C1=CCC=C1', 'C1CCCCC1', 'C=C', 'O=C1C=CC(=O)C=C1', '[CH+]1C=CC=C1', 'C1=CC=C1', 'C1=CC=CC1', 'CC=O'];
  for (const s of notAromatic) {
    const x = m(s);
    assert.deepEqual(P(C.aromaticAtoms(x)), [], s);
    for (const r of C.rings(x)) assert.strictEqual(C.isAromaticRing(x, r), false, s);
  }
  const benz = m('C1=CC=CC=C1');
  assert.ok(benz.bonds.every((b) => b.order === 1.5));
  assert.ok(benz.atoms.every((a) => a.aromatic));
  const biphenyl = m('c1ccc(cc1)-c1ccccc1');
  assert.strictEqual(C.aromaticAtoms(biphenyl).length, 12);
  assert.strictEqual(biphenyl.bondAt(3, 6).order, 1); // inter-ring bond stays single
  assert.strictEqual(m('c1ccccc1').atoms[0].h, 1);
  assert.strictEqual(m('CC1=CC=CC=C1').atoms[0].aromatic, false);
});

test('conjugated systems', () => {
  assert.deepEqual(P(C.conjugated(m('C=CC=O'))), [[0, 1, 2, 3]]);
  assert.deepEqual(P(C.conjugated(m('C=CCC=C'))), [[0, 1], [3, 4]]); // CH2 between them breaks conjugation
  const aryl = m('CC(=O)Oc1ccccc1'); // 0 CH3, 1 C, 2 O=, 3 O, 4..9 ring
  const systems = P(C.conjugated(aryl));
  const ring = [4, 5, 6, 7, 8, 9];
  assert.ok(systems.some((s) => ring.every((i) => s.includes(i))), 'the six ring atoms share one system');
  assert.ok(systems.some((s) => s.includes(1) && s.includes(2)), 'C=O carbon and its O share a system');
  assert.ok(systems.every((s) => !s.includes(0)), 'sp3 CH3 is in no system');
  assert.deepEqual(P(C.conjugated(m('C=C[CH2+]'))), [[0, 1, 2]]); // allyl cation: charged centre joins
  assert.deepEqual(P(C.conjugated(m('[CH2+]C=C'))), [[0, 1, 2]]);
  assert.deepEqual(P(C.conjugated(m('[CH2]C=C'))), [[0, 1, 2]]); // allyl radical
  assert.deepEqual(P(C.conjugated(m('C=C=C'))), [[0, 1], [1, 2]]); // allene: the two pi bonds are orthogonal
  assert.deepEqual(P(C.conjugated(m('C=C=CC=C'))), [[0, 1], [1, 2, 3, 4]]); // penta-1,2,4-triene
  assert.deepEqual(P(C.conjugated(m('O=C=O'))), [[0, 1], [1, 2]]); // CO2: no conjugation across the central C
  assert.deepEqual(P(C.conjugated(m('C=C=O'))), [[0, 1], [1, 2]]); // ketene
  assert.deepEqual(P(C.conjugated(m('C=CC(=O)C=C'))), [[0, 1, 2, 3, 4, 5]]);
  assert.deepEqual(P(C.conjugated(m('C=COC'))), [[0, 1, 2]]); // enol ether: O lone pair joins the C=C, CH3 does not
  assert.deepEqual(P(C.conjugated(m('CCO'))), []);
  assert.deepEqual(P(C.conjugated(m('c1ccccc1'))), [[0, 1, 2, 3, 4, 5]]);
  assert.deepEqual(P(C.conjugated(m('ClC=C'))), [[0, 1, 2]]); // Cl lone pair on a vinyl carbon
  assert.deepEqual(P(C.conjugated(m('CCCl'))), []);
  assert.deepEqual(P(C.conjugated(m('C=CC#N'))), [[0, 1, 2, 3]]);
});

test('canonical form: same molecule, one string', () => {
  const eq = (a, b, o) => assert.ok(C.same(a, b, o), a + ' = ' + b);
  const ne = (a, b, o) => assert.ok(!C.same(a, b, o), a + ' != ' + b);
  eq('OCC', 'CCO');
  eq('C(C)(C)C', 'CC(C)C');
  eq('c1ccccc1O', 'Oc1ccccc1');
  eq('Oc1ccccc1', 'OC1=CC=CC=C1');
  eq('Oc1ccccc1', '[OH]c1ccccc1');
  eq('C1=CC=C2C=CC=CC2=C1', 'c1ccc2ccccc2c1');
  eq('C1=CC=NC=C1', 'c1ccncc1');
  eq('C1=CNC=C1', 'c1cc[nH]c1');
  eq('CC(=O)O', 'OC(C)=O');
  eq('C1CCCCC1C', 'CC1CCCCC1');
  eq('CC.O', 'O.CC');
  eq('CC(C)(C)CC(CC)CC', 'CCC(CC)CC(C)(C)C');
  eq('[Na+].CC(=O)[O-]', 'CC(=O)[O-].[Na+]');
  ne('CCO', 'COC');
  ne('CCC', 'CCCC');
  ne('CC(=O)O', 'CC(=O)[O-]');
  ne('c1ccccc1', 'C1CCCCC1');
  ne('CC=CC', 'CCC=C');
  assert.strictEqual(C.canonical(m('OCC')), C.canonical(m('CCO')));
  assert.strictEqual(typeof C.canonical(m('OCC'), { stereo: true }), 'string');
});

test('canonical form: double-bond geometry', () => {
  const eq = (a, b, o) => assert.ok(C.same(a, b, o), a + ' = ' + b);
  const ne = (a, b, o) => assert.ok(!C.same(a, b, o), a + ' != ' + b);
  ne('C/C=C/C', 'C/C=C\\C', { stereo: true });
  eq('C/C=C/C', 'C/C=C\\C', { stereo: false });
  eq('C/C=C/C', 'C/C=C\\C'); // stereo defaults to off
  eq('C/C=C/C', 'C\\C=C\\C', { stereo: true }); // both trans
  eq('C/C=C\\C', 'C\\C=C/C', { stereo: true }); // both cis
  eq('F/C=C/F', 'F\\C=C\\F', { stereo: true });
  eq('C(/F)=C/F', 'F/C=C\\F', { stereo: true }); // both F on the same side: cis
  ne('F/C=C/F', 'F/C=C\\F', { stereo: true });
  eq('C/C=C/C=C/Cl', 'Cl/C=C/C=C/C', { stereo: true }); // conjugated diene read backwards
  eq('C/C=C/C=C/C', 'C\\C=C\\C=C\\C', { stereo: true });
  ne('C/C=C/C=C/C', 'C/C=C/C=C\\C', { stereo: true });
  ne('C/C=C\\C=C/C', 'C/C=C/C=C\\C', { stereo: true });
  eq('C/C(C)=C/C', 'CC(C)=CC', { stereo: true }); // two methyls on one end: no stereoisomers
  eq('CC=CC', 'C/C=C/C', { stereo: false });
});

test('canonical form: tetrahedral centres', () => {
  const eq = (a, b, o) => assert.ok(C.same(a, b, o), a + ' = ' + b);
  const ne = (a, b, o) => assert.ok(!C.same(a, b, o), a + ' != ' + b);
  // L-alanine in four atom orders: parity of the neighbour order decides the tag
  eq('N[C@@H](C)C(=O)O', 'C[C@H](N)C(=O)O', { stereo: true });
  eq('N[C@@H](C)C(=O)O', 'OC(=O)[C@@H](N)C', { stereo: true });
  eq('N[C@@H](C)C(=O)O', '[C@H](N)(C)C(=O)O', { stereo: true });
  ne('N[C@@H](C)C(=O)O', 'N[C@H](C)C(=O)O', { stereo: true }); // enantiomers
  eq('N[C@@H](C)C(=O)O', 'N[C@H](C)C(=O)O', { stereo: false });
  ne('C[C@H](O)CC', 'C[C@@H](O)CC', { stereo: true });
  // ring closure digits take part in the neighbour order
  eq('C[C@H]1CCCO1', 'C[C@@H]1OCCC1', { stereo: true });
  ne('C[C@H]1CCCO1', 'C[C@H]1OCCC1', { stereo: true });
  // a tag on a centre with two identical branches is meaningless
  eq('C[C@H](C)O', 'CC(C)O', { stereo: true });
  eq('C[C@H](C)O', 'C[C@@H](C)O', { stereo: true });
  // tartaric acid has three stereoisomers: two enantiomers and a meso form
  const A = 'O[C@H](C(=O)O)[C@H](O)C(=O)O';
  const A2 = 'O[C@@H](C(=O)O)[C@@H](O)C(=O)O';
  const B = 'O[C@H](C(=O)O)[C@@H](O)C(=O)O';
  const B2 = 'O[C@@H](C(=O)O)[C@H](O)C(=O)O';
  const aSelf = C.same(A, A2, { stereo: true });
  const bSelf = C.same(B, B2, { stereo: true });
  assert.notStrictEqual(aSelf, bSelf, 'exactly one of the two pairs is meso');
  ne(A, B, { stereo: true });
  assert.strictEqual(new Set([A, A2, B, B2].map((s) => C.canonical(m(s), { stereo: true }))).size, 3);
  eq(A, B, { stereo: false });
});

test('canonical strings are valid SMILES that give the same molecule back', () => {
  const list = ['CCO', 'CC(=O)Oc1ccccc1C(=O)O', 'CC(=O)Nc1ccc(O)cc1', 'NC(CS)C(=O)O', 'CC(=O)[O-].[Na+]', '[NH4+]',
    'c1cc[nH]c1', 'c1ccc2[nH]ccc2c1', 'c1ncc2[nH]cnc2n1', 'O=c1cccc[nH]1', 'c1ccc2cccc2cc1', '[cH-]1cccc1',
    'C[N+](=O)[O-]', 'CS(=O)(=O)O', 'C12C3C4C1C5C2C3C45', 'C1C2CC3CC1CC(C2)C3', 'c1ccc(cc1)-c1ccccc1',
    'C/C=C/C=C\\C', 'N[C@@H](C)C(=O)O', 'C[C@H]1CCCO1', 'CC1=CC=CC=C1', 'C1=CCCCC1', 'CC(C)(C)CC(CC)CC',
    'OC(=O)C1=CC=CC=C1C(=O)O', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'C1CC2(C1)CC2', '[O-][n+]1ccccc1',
    'c1cc[nH+]cc1', 'C=C=C', 'C#CC#N', '[Na+].[Cl-]', 'C%11CCCCC%11', 'C1=CC=CC=CC=C1'];
  for (const s of list) {
    for (const stereo of [false, true]) {
      const x = m(s);
      const can = C.canonical(x, { stereo });
      const y = m(can);
      assert.strictEqual(C.canonical(y, { stereo }), can, s + ' -> ' + can);
      assert.strictEqual(C.formulaString(y), C.formulaString(x), s + ' -> ' + can);
      assert.strictEqual(y.atoms.length, x.atoms.length);
    }
  }
});

test('groups and compoundClass', () => {
  assert.deepEqual(types('CC(=O)OCC'), ['ester']); // not also an ether
  assert.strictEqual(C.compoundClass(m('CC(=O)OCC')), 'ester');
  assert.deepEqual(types('CC(=O)N'), ['amide']); // not also an amine
  assert.strictEqual(C.compoundClass(m('CC(=O)N')), 'amide');
  assert.deepEqual(types('CCN(C)C'), ['amine3']);
  assert.strictEqual(C.compoundClass(m('CCN(C)C')), 'amine3');
  assert.deepEqual(types('CC(O)C=O'), ['alcohol', 'aldehyde']);
  assert.strictEqual(C.compoundClass(m('CC(O)C=O')), 'aldehyde'); // aldehyde outranks alcohol
  assert.deepEqual(types('Oc1ccccc1'), ['arene', 'phenol']);
  assert.strictEqual(C.compoundClass(m('Oc1ccccc1')), 'phenol');
  assert.deepEqual(types('CC(=O)OC(C)=O'), ['anhydride']); // not two esters or ketones
  assert.strictEqual(C.compoundClass(m('CC(=O)OC(C)=O')), 'anhydride');
  assert.deepEqual(types('CC(=O)Oc1ccccc1C(=O)O'), ['acid', 'arene', 'ester']);
  assert.strictEqual(C.compoundClass(m('CC(=O)Oc1ccccc1C(=O)O')), 'acid');
  assert.deepEqual(types('CCO'), ['alcohol']);
  assert.deepEqual(types('CC(=O)C'), ['ketone']);
  assert.deepEqual(types('CC=O'), ['aldehyde']);
  assert.deepEqual(types('C=O'), ['aldehyde']); // formaldehyde
  assert.deepEqual(types('OC=O'), ['acid']); // formic acid
  assert.deepEqual(types('CC(=O)O'), ['acid']);
  assert.deepEqual(types('CC(=O)[O-]'), ['carboxylate']);
  assert.deepEqual(types('CC(=O)Cl'), ['acylhalide']);
  assert.deepEqual(types('CCBr'), ['halide']);
  assert.deepEqual(types('Clc1ccccc1'), ['arene', 'halide']);
  assert.strictEqual(C.compoundClass(m('Clc1ccccc1')), 'halide'); // characteristic groups outrank the ring
  assert.strictEqual(C.compoundClass(m('ClCc1ccccc1')), 'halide'); // benzyl chloride
  assert.strictEqual(C.compoundClass(m('COc1ccccc1')), 'ether'); // anisole
  assert.strictEqual(C.compoundClass(m('C=CCl')), 'halide');
  assert.strictEqual(C.compoundClass(m('O=[N+]([O-])c1ccccc1')), 'nitro');
  assert.strictEqual(C.compoundClass(m('CSc1ccccc1')), 'sulfide');
  assert.strictEqual(C.compoundClass(m('OC(=O)CS(=O)(=O)O')), 'acid'); // carboxylic acid outranks sulfonic acid
  assert.strictEqual(C.compoundClass(m('OC(=O)c1ccc(cc1)S(=O)(=O)O')), 'acid');
  assert.strictEqual(C.compoundClass(m('CS(=O)(=O)O')), 'sulfonic');
  assert.deepEqual(types('COC'), ['ether']);
  assert.deepEqual(types('CSC'), ['sulfide']);
  assert.deepEqual(types('CS'), ['thiol']);
  assert.deepEqual(types('CC#N'), ['nitrile']);
  assert.deepEqual(types('C=C'), ['alkene']);
  assert.deepEqual(types('C#C'), ['alkyne']);
  assert.deepEqual(types('CN'), ['amine1']);
  assert.deepEqual(types('CNC'), ['amine2']);
  assert.deepEqual(types('Nc1ccccc1'), ['amine1', 'arene']);
  assert.deepEqual(types('C[NH3+]'), ['ammonium']);
  assert.deepEqual(types('C[N+](C)(C)C'), ['ammonium']);
  assert.deepEqual(types('C[N+](=O)[O-]'), ['nitro']);
  assert.deepEqual(types('CS(=O)(=O)O'), ['sulfonic']);
  assert.deepEqual(types('c1cc[nH]c1'), ['arene']); // ring NH is not an amine
  assert.deepEqual(types('C1CCNCC1'), ['amine2']);
  assert.deepEqual(types('C1CCOC1'), ['ether']);
  assert.deepEqual(types('O=C1CCCO1'), ['ester']); // lactone
  assert.deepEqual(types('O=C1CCCN1'), ['amide']); // lactam
  assert.deepEqual(types('C=CC(=O)C'), ['alkene', 'ketone']);
  assert.deepEqual(types('CCCC'), []);
  assert.strictEqual(C.compoundClass(m('CCCC')), 'alkane');
  assert.strictEqual(C.compoundClass(m('C1CCCCC1')), 'alkane');
  assert.strictEqual(C.compoundClass(m('CC=CC')), 'alkene');
  assert.strictEqual(C.compoundClass(m('CC#CC')), 'alkyne');
  assert.strictEqual(C.compoundClass(m('c1ccccc1')), 'arene');
  assert.strictEqual(C.compoundClass(m('ClCCl')), 'halide');
  assert.strictEqual(C.compoundClass(m('OCC(=O)O')), 'acid');
  assert.strictEqual(C.compoundClass(m('NCC(=O)O')), 'acid');
  assert.strictEqual(C.compoundClass(m('CC(=O)CO')), 'ketone');
  // atom lists
  const ester = C.groups(m('CC(=O)OCC')).find((g) => g.type === 'ester');
  assert.deepEqual(P([...ester.atoms].sort()), [1, 2, 3, 4]); // carbonyl C, =O, bridging O, alkyl C
  const alc = C.groups(m('CCO')).find((g) => g.type === 'alcohol');
  assert.deepEqual(P([...alc.atoms].sort()), [1, 2]);
  const ar = C.groups(m('Cc1ccccc1')).find((g) => g.type === 'arene');
  assert.deepEqual(P([...ar.atoms].sort()), [1, 2, 3, 4, 5, 6]);
});

// Writes a molecule as Kekule SMILES with bracket atoms, from a shuffled atom order and shuffled branches.
function shuffledSmiles(x, rand) {
  const n = x.atoms.length;
  const seen = new Array(n).fill(false);
  const kids = {};
  const closers = {};
  const openers = {};
  const edgeDone = new Set();
  let rc = 0;
  const roots = [];
  const shuffle = (a) => a.map((v) => [rand(), v]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const ringOrder = {};
  function dfs(v, p) {
    seen[v] = true;
    kids[v] = [];
    for (const w of shuffle(x.nbr[v])) {
      if (w === p) continue;
      if (!seen[w]) { kids[v].push(w); dfs(w, v); } else {
        const key = Math.min(v, w) + '_' + Math.max(v, w);
        if (edgeDone.has(key)) continue;
        edgeDone.add(key);
        rc++;
        (openers[w] = openers[w] || []).push(rc);
        (closers[v] = closers[v] || []).push(rc);
        ringOrder[rc] = x.bondAt(v, w).kek;
      }
    }
  }
  for (const s of shuffle([...Array(n).keys()])) if (!seen[s]) { roots.push(s); dfs(s, -1); }
  const sym = (k) => (k === 2 ? '=' : k === 3 ? '#' : '');
  const num = (d) => (d > 9 ? '%' + d : String(d));
  function emit(v) {
    const a = x.atoms[v];
    let s = '[' + a.el + (a.h ? 'H' + (a.h > 1 ? a.h : '') : '') +
      (a.charge ? (a.charge > 0 ? '+' : '-') + (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : '') : '') + ']';
    (closers[v] || []).forEach((d) => { s += num(d); });
    (openers[v] || []).forEach((d) => { s += sym(ringOrder[d]) + num(d); });
    kids[v].forEach((w, k) => {
      const piece = sym(x.bondAt(v, w).kek) + emit(w);
      s += k < kids[v].length - 1 ? '(' + piece + ')' : piece;
    });
    return s;
  }
  return roots.map(emit).join('.');
}

test('canonical form does not depend on atom order, branch order or aromatic/Kekule spelling', () => {
  let seed = 12345;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const list = ['CC(=O)Oc1ccccc1C(=O)O', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'c1ncc2[nH]cnc2n1', 'c1ccc2[nH]ccc2c1',
    'C12C3C4C1C5C2C3C45', 'C1C2CC3CC1CC(C2)C3', 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2O', 'CC(C)(C)c1cc(C(C)(C)C)cc(C(C)(C)C)c1',
    'Cc1c(C)c(C)c(C)c(C)c1C', 'c1ccc2cc3ccccc3cc2c1', 'O=c1cccc[nH]1', '[O-][n+]1ccccc1', 'C1CC2(C1)CC2',
    'c1ccc(cc1)-c1ccccc1', 'OC(=O)C(O)C(O)C(=O)O', 'CC(C)(C)C(C)(C)C', '[Na+].[O-]C(=O)C', 'NC(=O)c1ccccc1'];
  for (const s of list) {
    const x = m(s);
    const ref = C.canonical(x);
    for (let k = 0; k < 12; k++) {
      const w = shuffledSmiles(x, rand);
      assert.strictEqual(C.canonical(m(w)), ref, s + ' written as ' + w);
    }
  }
});

test('bracket atoms: charges, isotopes, classes and metals', () => {
  assert.strictEqual(m('[Fe+2]').atoms[0].charge, 2);
  assert.strictEqual(m('[O--]').atoms[0].charge, -2);
  assert.strictEqual(m('[13CH4]').atoms[0].h, 4);
  assert.strictEqual(C.formulaString(m('[13CH4]')), 'CH4');
  assert.strictEqual(m('[CH3:1]').atoms[0].h, 3);
  assert.strictEqual(m('[Na]').atoms[0].h, 0);
  assert.strictEqual(m('[nH]1cccc1').atoms[0].aromatic, true);
  assert.ok(C.same('[CH4]', 'C'));
  assert.ok(!C.same('[13CH4]', 'C'));
});

test('trimethylcyclohexane and other C3-symmetric rings: tags that look droppable one at a time', () => {
  const combos = (tpl) => {
    const out = [];
    for (let k = 0; k < 8; k++) {
      let i = 0;
      out.push(tpl.replace(/@@?/g, () => ((k >> i++) & 1 ? '@@' : '@')));
    }
    return out;
  };
  const distinct = (tpl) => new Set(combos(tpl).map((s) => C.canonical(m(s), { stereo: true })));
  // 1,3,5-trisubstituted cyclohexane: all-cis and cis,cis,trans are the only two diastereomers
  assert.strictEqual(distinct('C[C@H]1C[C@H](C)C[C@H](C)C1').size, 2);
  assert.strictEqual(distinct('O[C@H]1C[C@H](O)C[C@H](O)C1').size, 2);
  assert.strictEqual(distinct('C[C@H]1[C@H](C)[C@H]1C').size, 2); // 1,2,3-trimethylcyclopropane
  assert.ok(C.same('C[C@H]1C[C@H](C)C[C@@H](C)C1', 'C[C@H]1C[C@@H](C)C[C@H](C)C1', { stereo: true }));
  assert.ok(C.same('C[C@H](C)O', 'CC(C)O', { stereo: true })); // a lone tag on a plain isopropyl is still dropped
  assert.ok(C.same('C[C@H]1CCCCC1', 'CC1CCCCC1', { stereo: true }));
  assert.ok(!C.same('C[C@H]1CC[C@H](C)CC1', 'C[C@H]1CC[C@@H](C)CC1', { stereo: true })); // cis vs trans 1,4
});

test('nitro written two ways is one compound', () => {
  assert.ok(C.same('O=N(=O)c1ccccc1', '[O-][N+](=O)c1ccccc1'));
  assert.ok(C.same('CN(=O)=O', 'C[N+](=O)[O-]'));
  assert.deepEqual(types('CN(=O)=O'), ['nitro']);
  assert.strictEqual(C.formulaString(m('CN(=O)=O')), 'CH3NO2');
  assert.strictEqual(m('CN(=O)=O').atoms[1].charge, 1);
});

test('groups do not depend on the Kekule or aromatic spelling', () => {
  const pairs = [['Nc1ccccn1', 'NC1=NC=CC=C1'], ['Nc1ncnc2[nH]cnc12', 'NC1=C2NC=NC2=NC=N1'], ['Oc1ccccc1', 'OC1=CC=CC=C1'],
    ['CC(=O)Nc1ccccc1', 'CC(=O)NC1=CC=CC=C1']];
  for (const [a, b] of pairs) {
    assert.deepEqual(types(a), types(b), a + ' / ' + b);
    assert.strictEqual(C.compoundClass(m(a)), C.compoundClass(m(b)), a + ' / ' + b);
  }
  assert.deepEqual(types('Nc1ccccn1'), ['amine1', 'arene']);
  let seed = 99;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (const s of ['Nc1ccccn1', 'Nc1ncnc2[nH]cnc12', 'CC(=O)Nc1ccc(O)cc1', 'CC(=O)Oc1ccccc1C(=O)O', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C']) {
    const ref = JSON.stringify(types(s));
    for (let k = 0; k < 6; k++) {
      const w = shuffledSmiles(m(s), rand);
      assert.strictEqual(JSON.stringify(types(w)), ref, s + ' written as ' + w);
    }
  }
});

test('parse refuses too many bonds', () => {
  for (const bad of ['CC(C)(C)(C)C', 'CO(C)C', 'FC(F)(F)(F)F', 'ClC=Cl', 'C(=O)(=O)=O', 'B(F)(F)(F)F', '[CH5]', 'C(C)(C)(C)(C)[H]']) {
    assert.throws(() => C.parse(bad), (e) => /^SMILES/.test(e.message), bad);
  }
  for (const ok of ['CS(=O)(=O)C', 'CP(=O)(O)O', 'CN(=O)=O', '[NH4+]', 'C[N+](C)(C)C', '[CH3-]', '[O-][Cl+3]([O-])([O-])[O-]', 'FS(F)(F)(F)(F)F']) {
    assert.doesNotThrow(() => C.parse(ok), ok);
  }
});

test('unsaturation is null for ions and radicals', () => {
  assert.strictEqual(C.unsaturation(m('CC(=O)[O-]')), null);
  assert.strictEqual(C.unsaturation(m('[NH4+]')), null);
  assert.strictEqual(C.unsaturation(m('[CH3]')), null);
  assert.strictEqual(C.unsaturation(m('CC(=O)[O-].[Na+]')), null);
  assert.strictEqual(C.unsaturation(m('CCO')), 0);
  assert.strictEqual(C.unsaturation(m('C[N+](=O)[O-]')), 1); // net neutral: nitro methane CH3NO2, (2+2+1-3)/2
  assert.strictEqual(C.unsaturation(m('c1ccccc1')), 4);
});
