'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load.js');

const ORG = load(['chem.js', 'stereo.js']);
const S = ORG.stereo;
const C = ORG.chem;
const plain = load.plain;
const P = (smi) => C.parse(smi);

// ---------------------------------------------------------------- CIP

test('cip: amino acids and glyceraldehyde', () => {
  // Alanine: N > COOH > CH3 > H. C[C@H](N)C(=O)O lists CH3, H, N, COOH = 3,4,1,2 (an odd permutation of 4,1,2,3), @ flips to @@ -> S (L-alanine).
  assert.equal(S.cip(P('C[C@H](N)C(=O)O'), 1), 'S');
  // The brief wrote C[C@@H](N)C(=O)O as L-alanine; that is its mirror image, D-alanine, R.
  assert.equal(S.cip(P('C[C@@H](N)C(=O)O'), 1), 'R');
  // Serine: N > COOH > CH2OH > H, the same pattern: the @ form is L (S).
  assert.equal(S.cip(P('OC[C@H](N)C(=O)O'), 2), 'S');
  assert.equal(S.cip(P('OC[C@@H](N)C(=O)O'), 2), 'R');
  // Cysteine: N > CH2SH (S beats O at the next sphere) > COOH > H. SC[C@H](N)C(=O)O lists CH2SH, H, N, COOH = 2,4,1,3 (even), @ -> R (L-cysteine).
  assert.equal(S.cip(P('SC[C@H](N)C(=O)O'), 2), 'R');
  assert.equal(S.cip(P('SC[C@@H](N)C(=O)O'), 2), 'S');
  // Glyceraldehyde: OH > CHO (O,O,H) > CH2OH (O,H,H) > H; OC[C@@H](O)C=O lists CH2OH, H, OH, CHO = 3,4,1,2 (odd), @@ flips to @ -> R (D-glyceraldehyde).
  assert.equal(S.cip(P('OC[C@@H](O)C=O'), 2), 'R');
  assert.equal(S.cip(P('OC[C@H](O)C=O'), 2), 'S');
});

test('cip: carvone, 2-butanol, menthol', () => {
  // Carvone centre: isopropenyl (C,C,C) > CH2-C=O side (C,H,H; then O,O,C) > ring CH2 (C,H,H; then C,C,H) > H.
  // CC1=CC[C@H](CC1=O)C(C)=C lists ring CH2, H, CH2C=O, isopropenyl = 3,4,2,1 (even permutation of 4,1,2,3), @ -> R.
  assert.equal(S.cip(P('CC1=CC[C@H](CC1=O)C(C)=C'), 4), 'R');
  assert.equal(S.cip(P('CC1=CC[C@@H](CC1=O)C(C)=C'), 4), 'S'); // the mirror image: (S)-carvone
  // 2-butanol: OH > ethyl > CH3 > H; C[C@@H](O)CC lists CH3, H, OH, ethyl = 3,4,1,2 (odd), @@ flips to @ -> R.
  assert.equal(S.cip(P('C[C@@H](O)CC'), 1), 'R');
  assert.equal(S.cip(P('C[C@H](O)CC'), 1), 'S');
  // (-)-menthol is (1R,2S,5R)-2-isopropyl-5-methylcyclohexanol: OH carbon (atom 5) R, isopropyl carbon (atom 4) S, methyl carbon (atom 1) R.
  const men = P('C[C@@H]1CC[C@H]([C@@H](C1)O)C(C)C');
  assert.deepEqual([5, 4, 1].map((i) => S.cip(men, i)), ['R', 'S', 'R']);
});

test('cip: duplicated atoms (vinyl beats isopropyl)', () => {
  // C=C[C@H](C)C(C)C, centre atom 2: vinyl CH= has (C,C,H) with the duplicate C; isopropyl CH has (C,C,H): tie at the second sphere.
  // Third sphere: vinyl branches {C,H,H} (the real =CH2) and {0,0,0} (the duplicate); isopropyl branches {H,H,H} twice: vinyl wins.
  // Priorities vinyl 1, iPr 2, CH3 3, H 4. Neighbours in order: vinyl, H, CH3, iPr = 1,4,3,2 (even permutation of 4,1,2,3), @ -> R.
  assert.equal(S.cip(P('C=C[C@H](C)C(C)C'), 2), 'R');
  assert.equal(S.cip(P('C=C[C@@H](C)C(C)C'), 2), 'S');
});

test('cip: null when unspecified, not a centre or not rankable', () => {
  assert.equal(S.cip(P('CC(O)CC'), 1), null);
  assert.equal(S.cip(P('C[C@H](C)CC'), 1), null); // two methyls
  assert.equal(S.cip(P('CCO'), 1), null);
});

// ---------------------------------------------------------------- E/Z

test('ez: simple alkenes', () => {
  assert.equal(S.ez(P('C/C=C/C'), 1, 2), 'E');
  assert.equal(S.ez(P('C/C=C\\C'), 1, 2), 'Z');
  assert.equal(S.ez(P('Cl/C=C/Br'), 1, 2), 'E');
  assert.equal(S.ez(P('Cl/C=C\\Br'), 1, 2), 'Z');
});

test('ez: priorities decide, not the written order', () => {
  // F/C(Cl)=C/Br: F is below the carbon so Cl (17 > 9) is above; Br is above. Cl and Br are the top groups on the same side: Z.
  assert.equal(S.ez(P('F/C(Cl)=C/Br'), 1, 3), 'Z');
  // F/C(Cl)=C\Br: Br below, Cl above: E.
  assert.equal(S.ez(P('F/C(Cl)=C\\Br'), 1, 3), 'E');
  // C/C=C/C(C)=O: CH3 and the acyl carbon (O,O,C beats H) on opposite sides: E.
  assert.equal(S.ez(P('C/C=C/C(C)=O'), 1, 2), 'E');
  assert.equal(S.ez(P('C/C=C/Cl'), 1, 2), 'E');
});

test('ez: null when not stereogenic or unspecified', () => {
  assert.equal(S.ez(P('CC(C)=CC'), 1, 3), null); // two methyls on one end
  assert.equal(S.ez(P('CC=CC'), 1, 2), null); // no / or \ written
  assert.equal(S.ez(P('C=CC'), 0, 1), null); // CH2 end
  assert.equal(S.ez(P('CCCC'), 1, 2), null); // not a double bond
});

test('ez: conjugated diene shares a bond mark', () => {
  // C/C=C/C=C/C is E,E: both inner marks come from the same bond.
  const m = P('C/C=C/C=C/C');
  assert.equal(S.ez(m, 1, 2), 'E');
  assert.equal(S.ez(m, 3, 4), 'E');
  const z = P('C/C=C\\C=C/C'); // both Z
  assert.equal(S.ez(z, 1, 2), 'Z');
  assert.equal(S.ez(z, 3, 4), 'Z');
});

test('cisTrans on double bonds and rings', () => {
  assert.equal(S.cisTrans(P('C/C=C/C'), 1, 2), 'trans');
  assert.equal(S.cisTrans(P('C/C=C\\C'), 1, 2), 'cis');
  assert.equal(S.cisTrans(P('CC=CC'), 1, 2), null);
  // 1,2-dimethylcyclohexane: the meso form (1R,2S) is cis, the (S,S)/(R,R) form is trans.
  assert.equal(S.cisTrans(P('C[C@H]1CCCC[C@H]1C'), 1, 6), 'cis');
  assert.equal(S.cisTrans(P('C[C@H]1CCCC[C@@H]1C'), 1, 6), 'trans');
  assert.equal(S.cisTrans(P('CC1CCCCC1C'), 1, 6), null);
});

// ---------------------------------------------------------------- stereocentres and bonds

test('stereocentres', () => {
  assert.deepEqual(plain(S.stereocentres(P('CC(O)CC'))), [1]); // 2-butanol
  assert.deepEqual(plain(S.stereocentres(P('CC(Cl)CCCl'))), [1]); // 1,3-dichlorobutane
  assert.deepEqual(plain(S.stereocentres(P('CCC(CC)CC'))), []); // 3-ethylpentane
  assert.deepEqual(plain(S.stereocentres(P('CC(Br)CBr'))), [1]); // 1,2-dibromopropane
  assert.deepEqual(plain(S.stereocentres(P('ClCCCCCCl'))), []); // 1,5-dichloropentane: Cl0 C1..C5 Cl6
  assert.deepEqual(plain(S.stereocentres(P('OC(C(O)C(=O)O)C(=O)O'))), [1, 2]); // tartaric acid
  assert.deepEqual(plain(S.stereocentres(P('CC(C)C1CCC(C)CC1O'))), [3, 6, 9]); // menthol: C-iPr, C-Me, C-OH
  assert.deepEqual(plain(S.stereocentres(P('CC(C)=CC'))), []);
  assert.deepEqual(plain(S.stereocentres(P('CC(C)O'))), []);
  assert.deepEqual(plain(S.stereocentres(P('c1ccccc1C'))), []);
});

test('stereocentres means four constitutionally different substituents (the course definition)', () => {
  // Ring carbons whose two ring paths are equivalent give cis/trans isomers but are not chiral centres.
  const none = ['CC1CCC(C)CC1', 'OC1CCC(C)CC1', 'OC1CCC(O)CC1', 'CC1CC(C)C1', 'C1CCC2CCCCC2C1', 'C1CC2CCC1C2', 'CC1CC(C)CC(C)C1', 'CC1CCCCC1'];
  none.forEach((smi) => assert.deepEqual(plain(S.stereocentres(P(smi))), [], smi));
  // 1,3-dimethylcyclohexane: C1 and C3 differ (one ring path is longer than the other): both are centres.
  assert.deepEqual(plain(S.stereocentres(P('CC1CCCC(C)C1'))), [1, 5]);
  // pentane-2,4-diol: two centres; the middle CH2 is not one. Pentane-2,3,4-triol: C3 has two equal branches, so only C2 and C4.
  assert.deepEqual(plain(S.stereocentres(P('CC(O)CC(C)O'))), [1, 4]);
  assert.deepEqual(plain(S.stereocentres(P('CC(O)C(O)C(O)C'))), [1, 5]);
  // a carbon whose two branches differ only by E/Z geometry is not a chiral centre either
  assert.deepEqual(plain(S.stereocentres(P('CC=CC(O)C=CC'))), []);
});

test('stereoBonds', () => {
  assert.deepEqual(plain(S.stereoBonds(P('CC=CC'))), [[1, 2]]);
  assert.deepEqual(plain(S.stereoBonds(P('C=CC'))), []);
  assert.deepEqual(plain(S.stereoBonds(P('CC(C)=CC'))), []);
  assert.deepEqual(plain(S.stereoBonds(P('CC=CC=CC'))), [[1, 2], [3, 4]]);
  assert.deepEqual(plain(S.stereoBonds(P('C1CC=CC1'))), []); // small ring
  assert.deepEqual(plain(S.stereoBonds(P('C1CCCCCC=C1'))), [[6, 7]]); // cyclooctene: ring of 8
  assert.deepEqual(plain(S.stereoBonds(P('CC=NO'))), [[1, 2]]); // oxime
});

// ---------------------------------------------------------------- stereoisomer counts, chirality, meso

test('stereoisomer counts', () => {
  const n = (smi) => S.stereoisomers(P(smi)).length;
  assert.equal(n('OC(C(O)C(=O)O)C(=O)O'), 3); // tartaric: RR, SS, meso
  assert.equal(n('CC(Br)C(Br)C'), 3);
  assert.equal(n('CC(Br)C(Cl)C'), 4);
  assert.equal(n('CNC(C)C(O)c1ccccc1'), 4);
  assert.equal(n('CC(C)C1CCC(C)CC1O'), 8); // menthol
  assert.equal(n('CC=CC'), 2);
  assert.equal(n('C=CC'), 1);
  assert.equal(n('CC=CC=CC'), 3); // EE, EZ, ZZ
  assert.equal(n('CC1CCC(C)CC1'), 2); // cis, trans
  assert.equal(n('CCO'), 1);
  assert.equal(n('CC(O)CC'), 2);
  assert.equal(n('CC(O)C=CC'), 4);
  assert.equal(n('C[C@H](O)CC'), 2); // existing marks are ignored
});

test('stereoisomers are distinct canonical strings and read back', () => {
  const list = plain(S.stereoisomers(P('CC(O)CC')));
  assert.equal(new Set(list).size, 2);
  list.forEach((s) => assert.equal(S.stereocentres(P(s)).length, 1));
  const labels = list.map((s) => { const m = P(s); return S.cip(m, S.stereocentres(m)[0]); }).sort();
  assert.deepEqual(labels, ['R', 'S']);
  const t = plain(S.stereoisomers(P('CC=CC'))).map((s) => { const m = P(s); const b = S.stereoBonds(m)[0]; return S.ez(m, b[0], b[1]); }).sort();
  assert.deepEqual(t, ['E', 'Z']);
});

test('isMeso and isChiral', () => {
  const meso = P('O[C@H](C(=O)O)[C@@H](O)C(=O)O'); // atoms O0 C1 C2(=O3)O4 C5 O6 C7(=O8)O9; centres 1 and 5
  // C1: OH > COOH (O,O,O) > C5 (O,C,H) > H; neighbours O, H, COOH, C5 = 1,4,2,3, an odd permutation of 4,1,2,3, so @ flips to @@ -> S.
  // C5: neighbours C1, H, O, COOH = 3,4,1,2, odd as well, @@ flips to @ -> R. S and R in one molecule: meso.
  assert.deepEqual(plain(S.stereocentres(meso)), [1, 5]);
  assert.equal(S.cip(meso, 1), 'S');
  assert.equal(S.cip(meso, 5), 'R');
  assert.equal(S.isMeso(meso), true);
  assert.equal(S.isChiral(meso), false);
  const ss = P('O[C@H](C(=O)O)[C@H](O)C(=O)O'); // (S,S)-tartaric acid
  assert.equal(S.cip(ss, 1), 'S');
  assert.equal(S.cip(ss, 5), 'S');
  assert.equal(S.isMeso(ss), false);
  assert.equal(S.isChiral(ss), true);
  // unspecified molecules: can they be chiral?
  assert.equal(S.isChiral(P('CC(Cl)CCCl')), true);
  assert.equal(S.isChiral(P('CC(Br)CBr')), true);
  assert.equal(S.isChiral(P('ClCCCCCCl')), false);
  assert.equal(S.isChiral(P('CCC(CC)CC')), false);
  assert.equal(S.isMeso(P('CC(Br)C(Br)C')), true); // a meso form exists
  assert.equal(S.isMeso(P('CC(Br)C(Cl)C')), false);
  assert.equal(S.isMeso(P('CC=CC')), false);
  assert.equal(S.isMeso(P('CC(O)CC')), false);
  assert.equal(S.isMeso(P('C[C@H](O)CC')), false);
});

test('withConfig', () => {
  const r = S.withConfig(P('CC(O)CC'), { 1: 'R' });
  assert.ok(C.same(r, 'C[C@@H](O)CC', { stereo: true }));
  assert.equal(S.cip(P(r), S.stereocentres(P(r))[0]), 'R');
  assert.ok(C.same(S.withConfig('CC(O)CC', { 1: 'S' }), 'C[C@H](O)CC', { stereo: true }));
  // ephedrine skeleton CNC(C)C(O)c1ccccc1 (C0 N1 C2 C3 C4): centres 2 and 4; every combination gives a distinct stereoisomer
  const seen = new Set();
  ['R', 'S'].forEach((a) => ['R', 'S'].forEach((b) => {
    const smi = S.withConfig('CNC(C)C(O)c1ccccc1', { 2: a, 4: b });
    const m = P(smi);
    const lab = S.stereocentres(m).map((i) => S.cip(m, i)).sort().join('');
    assert.equal(lab, [a, b].sort().join(''));
    seen.add(smi);
  }));
  assert.equal(seen.size, 4);
  // an existing configuration is replaced
  assert.ok(C.same(S.withConfig('C[C@@H](O)CC', { 1: 'S' }), 'C[C@H](O)CC', { stereo: true }));
  // the result, read back, has the asked labels
  const m = P(S.withConfig('SC[C@@H](N)C(=O)O', { 2: 'R' }));
  assert.equal(S.cip(m, S.stereocentres(m).filter((i) => m.atoms[i].el === 'C' && m.nbr[i].some((j) => m.atoms[j].el === 'N'))[0]), 'R');
});

// ---------------------------------------------------------------- constitutional isomers

test('isomers: alkanes and simple heteroatom formulas', () => {
  assert.equal(S.isomers('C5H12').length, 3);
  assert.equal(S.isomers('C6H14').length, 5);
  assert.equal(S.isomers('C4H9Cl').length, 4);
  assert.equal(S.isomers('C2H7N').length, 2);
  assert.equal(S.isomers('C2H6O').length, 2);
  assert.equal(S.isomers('C3H8O').length, 3);
  assert.equal(S.isomers('C4H10').length, 2);
  assert.equal(S.isomers('CH4').length, 1);
});

test('isomers: filters and rings', () => {
  assert.equal(S.isomers('C3H6O2', { filter: 'ester' }).length, 2);
  assert.equal(S.isomers('C4H7N', { filter: 'nitrile' }).length, 2);
  assert.equal(S.isomers('C4H8').length, 3); // acyclic only by default
  assert.equal(S.isomers('C4H8', { rings: true }).length, 5);
  assert.equal(S.isomers('C3H6O', { filter: 'aldehyde' }).length, 1);
  assert.equal(S.isomers('C3H6O', { filter: 'ketone' }).length, 1);
  assert.equal(S.isomers('C4H8O2', { filter: 'acid' }).length, 2);
  assert.equal(S.isomers('C4H11N', { filter: 'amine1' }).length, 4);
  assert.equal(S.isomers('C4H11N', { filter: 'any' }).length, 8);
  assert.equal(S.isomers('C4H9Br', { filter: 'halide' }).length, 4);
});

test('isomers: results are canonical SMILES of the right formula, distinct', () => {
  const list = plain(S.isomers('C5H12'));
  assert.equal(new Set(list).size, 3);
  list.forEach((s) => assert.equal(C.formulaString(P(s)), 'C5H12'));
  list.forEach((s) => assert.equal(C.canonical(P(s)), s));
  assert.equal(S.isomers('C7H16').length, 9);
});

test('isomers: unstable structures are left out', () => {
  // C3H6O2, acyclic, textbook count: propanoic acid, methyl acetate, ethyl formate, 2-hydroxypropanal,
  // 3-hydroxypropanal, hydroxyacetone, methoxyacetaldehyde. Left out: enols, hemiacetals, peroxides, gem-diols.
  const list = plain(S.isomers('C3H6O2'));
  assert.equal(list.length, 7);
  ['CCC(=O)O', 'CC(=O)OC', 'CCOC=O', 'CC(O)C=O', 'OCCC=O', 'CC(=O)CO', 'COCC=O'].forEach((smi) => {
    assert.ok(list.indexOf(C.canonical(P(smi))) >= 0, smi);
  });
  // C3H6O any: no enols
  assert.equal(S.isomers('C3H6O', { rings: true }).length, 7); // propanal, acetone, allyl alcohol, methyl vinyl ether, oxirane, oxetane, cyclopropanol
  assert.equal(S.isomers('C2H6O2').length, 1); // ethylene glycol; dimethyl peroxide and 1,1-ethanediol are left out
  // rings of fewer than 8 atoms have no triple bonds and no cumulated double bonds
  const c4 = plain(S.isomers('C4H4', { rings: true }));
  assert.ok(c4.indexOf(C.canonical(P('C1#CCC1'))) < 0); // cyclobutyne
  assert.ok(c4.indexOf(C.canonical(P('C1=C=CC1'))) < 0); // 1,2-cyclobutadiene
  assert.ok(c4.indexOf(C.canonical(P('C1=CC=C1'))) >= 0); // cyclobutadiene stays
  assert.ok(c4.indexOf(C.canonical(P('C=CC#C'))) >= 0); // vinylacetylene stays
});

test('isomers: aromatic OH is a phenol, nitrogen analogues of the unstable classes', () => {
  const has = (list, smi) => list.indexOf(C.canonical(P(smi))) >= 0;
  assert.deepEqual(plain(S.isomers('C6H6O', { rings: true, filter: 'phenol' })), [C.canonical(P('Oc1ccccc1'))]);
  // C7H8O with a benzene ring: o-, m-, p-cresol, benzyl alcohol, anisole
  const c7 = plain(S.isomers('C7H8O', { rings: true })).filter((smi) => {
    const m = P(smi);
    return C.rings(m).some((r) => r.length === 6 && C.isAromaticRing(m, r));
  });
  assert.equal(c7.length, 5);
  ['Cc1ccccc1O', 'Cc1cccc(O)c1', 'Cc1ccc(O)cc1', 'OCc1ccccc1', 'COc1ccccc1'].forEach((smi) => assert.ok(has(c7, smi), smi));
  // C2H5NO acyclic: acetamide, N-methylformamide, 2-aminoethanal, 2-hydroxyethanimine, methyl formimidate,
  // nitrosoethane. Left out: imidic acids (CH3C(=NH)OH, CH3N=CHOH), enols and enamine-ols, oxime/N-O compounds, the hemiaminal CH2=NCH2OH.
  const amide = plain(S.isomers('C2H5NO'));
  assert.equal(amide.length, 6);
  ['CC(N)=O', 'CNC=O', 'NCC=O', 'OCC=N', 'COC=N', 'CCN=O'].forEach((smi) => assert.ok(has(amide, smi), smi));
  // C2H7NO: 2-aminoethanol and methoxymethanamine; 1-aminoethanol (hemiaminal) and all N-O compounds are left out
  const ano = plain(S.isomers('C2H7NO'));
  assert.equal(ano.length, 2);
  ['NCCO', 'COCN'].forEach((smi) => assert.ok(has(ano, smi), smi));
  // C2H8N2: ethane-1,2-diamine only (ethane-1,1-diamine, CH3NHCH2NH2 and the hydrazines are left out)
  assert.deepEqual(plain(S.isomers('C2H8N2')), [C.canonical(P('NCCN'))]);
  // aromatic N-N and N-O bonds stay: pyrazole and imidazole are both C3H4N2
  const dz = plain(S.isomers('C3H4N2', { rings: true }));
  assert.ok(has(dz, 'c1cc[nH]n1'));
  assert.ok(has(dz, 'c1c[nH]cn1'));
  assert.ok(has(plain(S.isomers('C3H3NO', { rings: true })), 'c1conc1') || has(plain(S.isomers('C3H3NO', { rings: true })), 'c1cnoc1'));
});

test('errors are thrown, not hidden', () => {
  assert.throws(() => S.isomers('C9H20'), (e) => /heavy atoms/.test(e.message));
});

test('isomers: seven heavy atoms are fast', () => {
  const t = Date.now();
  assert.equal(S.isomers('C7H16').length, 9);
  assert.equal(S.isomers('C5H10O', { filter: 'ketone' }).length, 3);
  assert.ok(Date.now() - t < 2000, 'took ' + (Date.now() - t) + ' ms');
});

test('ring cases where the canonical form of the engine is not enough', () => {
  const n = (smi) => S.stereoisomers(P(smi)).length;
  assert.equal(n('CC1CC(C)CC(C)C1'), 2); // 1,3,5-trimethylcyclohexane: all-cis and cis,trans (both meso)
  assert.equal(n('OC1CC(O)CC(O)C1'), 2);
  assert.equal(n('CC1C(C)C1C'), 2); // 1,2,3-trimethylcyclopropane
  assert.equal(n('CC1CCCC(C)C1'), 3); // 1,3-dimethylcyclohexane: cis (meso), trans (R,R and S,S)
  assert.equal(n('C1CCC2CCCCC2C1'), 2); // decalin: cis and trans
  // cis-1,3-dimethylcyclohexane is meso, the trans form is chiral
  assert.equal(S.isChiral(P('C[C@H]1CCC[C@@H](C)C1')), false);
  assert.equal(S.isChiral(P('C[C@H]1CCC[C@H](C)C1')), true);
  assert.equal(S.isMeso(P('C[C@H]1CCC[C@@H](C)C1')), true);
});

test('isMeso needs achirality and at least two chiral centres', () => {
  assert.equal(S.isMeso(P('C[C@H]1CCC[C@@H](C)C1')), true); // cis-1,3-dimethylcyclohexane
  assert.equal(S.isMeso(P('O[C@H](C(=O)O)[C@@H](O)C(=O)O')), true); // meso-tartaric acid
  assert.equal(S.isMeso(P('C[C@H](Br)[C@H](Br)C')), true); // meso-2,3-dibromobutane (2S,3R)
  // achiral cis/trans ring isomers without two chiral centres are not meso
  ['C[C@H]1CC[C@@H](C)CC1', 'C[C@H]1CC[C@H](C)CC1', 'C[C@H]1CC[C@H](O)CC1', 'C[C@H]1C[C@H](C)C1',
    'C[C@H]1C[C@@H](C)C[C@@H](C)C1', 'C[C@H]1C[C@H](C)C[C@H](C)C1'].forEach((smi) => {
    assert.equal(S.isMeso(P(smi)), false, smi);
    assert.equal(S.isChiral(P(smi)), false, smi);
  });
  assert.equal(S.isMeso(P('C1CCC2CCCCC2C1')), false); // decalin
  assert.equal(S.isMeso(P('OC1CCC(C)CC1')), false);
  // unspecified: no form of 1,4-dimethylcyclohexane is meso in the course sense
  assert.equal(S.isMeso(P('CC1CCC(C)CC1')), false);
});

test('stereoisomer counts do not depend on how the molecule is written', () => {
  ['CC(O)C(O)C(O)C', 'CC(O)C(O)C(C)O', 'OC(C)C(O)C(O)C', 'C(C)(O)C(O)C(C)O', 'OC(C(C)O)C(C)O', 'C(O)(C)C(C(C)O)O'].forEach((smi) => {
    assert.equal(S.stereoisomers(P(smi)).length, 4, smi); // two enantiomers' worth: (2R,4R), (2S,4S), and the meso r and s forms
  });
  // centres that are stereogenic only through E/Z branches: EE, ZZ and the enantiomeric E,Z pair
  assert.equal(S.stereoisomers(P('CC=CC(O)C=CC')).length, 4);
  assert.equal(S.stereoisomers(P('CC=CC(C)C=CC')).length, 4);
});

test('bridged bicycles count only the geometrically possible isomers', () => {
  const n = (smi) => S.stereoisomers(P(smi)).length;
  assert.equal(n('CC12CCC(CC1=O)C2(C)C'), 2); // camphor: the bridgeheads are tied to each other
  assert.equal(n('CC1=CCC2CC1C2(C)C'), 2); // alpha-pinene
  assert.equal(n('CC12CCC(CC1O)C2(C)C'), 4); // borneol / isoborneol: 2 bridgehead choices x CHOH
  assert.equal(n('C1CC2CCC1C2'), 1); // norbornane
});

test('isomers: alkenes and rings, larger formulas', () => {
  assert.equal(S.isomers('C6H12').length, 13); // hexenes, acyclic only
  assert.equal(S.isomers('C6H12', { rings: true }).length, 25);
  assert.equal(S.isomers('C7H14').length, 27);
  assert.equal(S.isomers('C8H18').length, 18);
  assert.equal(S.isomers('C3H8O', { filter: 'alcohol' }).length, 2);
  assert.equal(S.isomers('C3H8O', { filter: 'ether' }).length, 1);
  assert.deepEqual(plain(S.isomers('C6H15N', { filter: 'amine3' })), plain(S.isomers('C6H15N', { filter: 'amine3' })).slice().sort());
  assert.throws(() => S.isomers('Xx3'), (e) => /formula|element/.test(e.message));
});
