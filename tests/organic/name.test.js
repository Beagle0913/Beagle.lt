'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load.js');

const ORG = load();
const N = ORG.name;
const C = ORG.chem;
const P = load.plain;

// names.tsv: smiles, Lithuanian name, English name, source. `null` marks a molecule outside the rules.
const rows = fs.readFileSync(path.join(__dirname, 'fixtures', 'names.tsv'), 'utf8')
  .split('\n').slice(1).filter((l) => l.trim()).map((l) => {
    const [smi, lt, en, src] = l.split('\t');
    return { smi, lt, en, src };
  });

const nm = (smi, lang, extra) => {
  const r = N.name(smi, Object.assign({ lang }, extra || {}));
  return r === null ? null : P(r);
};

test('names.tsv has at least 150 rows and every row is complete', () => {
  assert.ok(rows.length >= 150, 'rows: ' + rows.length);
  rows.forEach((r) => {
    assert.ok(r.smi && r.lt && r.en && r.src, 'incomplete row: ' + JSON.stringify(r));
    assert.strictEqual(r.lt === 'null', r.en === 'null', 'null in both columns or none: ' + r.smi);
    assert.doesNotThrow(() => C.parse(r.smi), r.smi);
  });
  const nulls = rows.filter((r) => r.lt === 'null').length;
  assert.ok(nulls >= 10, 'rows marked null: ' + nulls);
});

test('every row: the Lithuanian name', () => {
  rows.forEach((r) => {
    const got = nm(r.smi, 'lt');
    assert.strictEqual(got === null ? 'null' : got.name, r.lt, r.smi + ' (' + r.src + ')');
  });
});

test('every row: the English name', () => {
  rows.forEach((r) => {
    const got = nm(r.smi, 'en');
    assert.strictEqual(got === null ? 'null' : got.name, r.en, r.smi + ' (' + r.src + ')');
  });
});

test('alts never contain the main name, no duplicates, no placeholders; names stay within 80 characters', () => {
  rows.forEach((r) => {
    ['lt', 'en'].forEach((lang) => {
      const got = nm(r.smi, lang);
      if (got === null) return;
      assert.ok(Array.isArray(got.alts), r.smi);
      assert.ok(got.alts.indexOf(got.name) < 0, 'main name repeated in alts: ' + got.name);
      assert.strictEqual(new Set(got.alts).size, got.alts.length, 'duplicate alts: ' + got.alts.join(' | '));
      [got.name].concat(got.alts).forEach((x) => {
        assert.ok(x.length <= 80, 'too long: ' + x);
        assert.ok(x === x.trim() && !/\s{2}|undefined|NaN|null|\?/.test(x), 'bad text: ' + JSON.stringify(x));
        assert.ok(!/[A-Z]/.test(x.replace(/\((?:[RSEZ0-9,]+)\)-/g, '').replace(/\bN['']*(?=[-,])/g, '').replace(/\bN['']*$/, '')),
          'capital letters: ' + x);
      });
    });
  });
});

test('inScope agrees with null-ness', () => {
  rows.forEach((r) => {
    assert.strictEqual(N.inScope(r.smi), r.lt !== 'null', r.smi);
    assert.strictEqual(N.inScope(C.parse(r.smi)), r.lt !== 'null', r.smi + ' (parsed)');
  });
});

test('the name does not depend on the order of the atoms in the SMILES', () => {
  rows.forEach((r) => {
    if (r.lt === 'null') return;
    const again = C.canonical(C.parse(r.smi), { stereo: false });
    ['lt', 'en'].forEach((lang) => {
      const a = nm(r.smi, lang);
      const b = nm(again, lang);
      assert.deepEqual(b, a, r.smi + ' -> ' + again);
    });
  });
});

test('both languages describe the same numbering: the same locants in the same order', () => {
  // the locants are written in the same places in both languages, except where one language
  // leaves a forced locant out; compare the sorted multiset of digits
  const digits = (s) => (s.match(/[0-9]+/g) || []).slice().sort((a, b) => a - b).join(',');
  rows.forEach((r) => {
    if (r.lt === 'null') return;
    const lt = digits(r.lt);
    const en = digits(r.en);
    // English may add locants (propan-2-one, ethan-1-ol); it never has fewer than Lithuanian
    const ltList = lt ? lt.split(',') : [];
    const enList = en ? en.split(',') : [];
    const pool = enList.slice();
    ltList.forEach((d) => {
      const k = pool.indexOf(d);
      assert.ok(k >= 0, 'Lithuanian locant ' + d + ' missing in English: ' + r.lt + ' / ' + r.en);
      pool.splice(k, 1);
    });
  });
});

test('trivial names are not used by name()', () => {
  [['CC(C)=O', 'acetonas'], ['C=O', 'formaldehidas'], ['Cc1ccccc1', 'toluenas'], ['OCC(O)CO', 'glicerolis']].forEach(([smi, triv]) => {
    assert.notStrictEqual(nm(smi, 'lt').name, triv, smi);
  });
});

test('trivial(): names from the course, and null for anything else', () => {
  const t = (smi) => { const r = N.trivial(smi); return r === null ? null : P(r); };
  assert.deepEqual(t('CC(C)=O'), { lt: 'acetonas', en: 'acetone' });
  assert.deepEqual(t('OC(=O)C(O)=O'), { lt: 'oksalo rūgštis', en: 'oxalic acid' });
  assert.deepEqual(t('CC(O)C(O)=O'), { lt: 'pieno rūgštis', en: 'lactic acid' });
  assert.deepEqual(t('OC(=O)C(O)C(O)C(O)=O'), { lt: 'vyno rūgštis', en: 'tartaric acid' });
  assert.deepEqual(t('OC(=O)CC(O)(CC(O)=O)C(O)=O'), { lt: 'citrinų rūgštis', en: 'citric acid' });
  assert.deepEqual(t('Nc1ccccc1'), { lt: 'anilinas', en: 'aniline' });
  assert.deepEqual(t(C.parse('CC(=O)OC(C)=O')), { lt: 'acetanhidridas', en: 'acetic anhydride' });
  assert.strictEqual(t('CCCCCCC'), null);
  assert.strictEqual(t('CCCC(O)=O'), null);
  // stereo is ignored, atom order does not matter
  assert.deepEqual(t('CC(=O)C'), { lt: 'acetonas', en: 'acetone' });
});

// E/Z and R/S ------------------------------------------------------------------

test('E and Z descriptors', () => {
  assert.strictEqual(nm('C/C=C/C', 'lt', { stereo: true }).name, '(E)-2-butenas');
  assert.strictEqual(nm('C/C=C\\C', 'lt', { stereo: true }).name, '(Z)-2-butenas');
  assert.strictEqual(nm('C/C=C/C', 'en', { stereo: true }).name, '(E)-but-2-ene');
  assert.strictEqual(nm('C/C=C\\C', 'en', { stereo: true }).name, '(Z)-but-2-ene');
  assert.strictEqual(nm('C/C=C/C=C/C', 'lt', { stereo: true }).name, '(2E,4E)-2,4-heksadienas');
  assert.strictEqual(nm('C/C=C/C(O)=O', 'lt', { stereo: true }).name, '(E)-2-buteno rūgštis');
  assert.strictEqual(nm('O=C/C=C/c1ccccc1', 'lt', { stereo: true }).name, '(E)-3-fenilpropenalis');
  // without stereo:true the descriptor is never written
  assert.strictEqual(nm('C/C=C/C', 'lt').name, '2-butenas');
});

test('R and S descriptors', () => {
  assert.strictEqual(nm('C[C@@H](O)CC', 'en', { stereo: true }).name, '(R)-butan-2-ol');
  assert.strictEqual(nm('C[C@H](O)CC', 'en', { stereo: true }).name, '(S)-butan-2-ol');
  assert.strictEqual(nm('C[C@@H](O)CC', 'lt', { stereo: true }).name, '(R)-2-butanolis');
  assert.strictEqual(nm('C[C@H](N)C(O)=O', 'lt', { stereo: true }).name, '(S)-2-aminopropano rūgštis');
  assert.strictEqual(nm('C[C@H](Cl)[C@@H](C)Br', 'en', { stereo: true }).name, '(2R,3S)-2-bromo-3-chlorobutane');
  assert.strictEqual(nm('C[C@@H](O)CC', 'lt').name, '2-butanolis');
  // descriptors are also added to the alternative names
  const r = nm('C[C@@H](O)CC', 'en', { stereo: true });
  r.alts.forEach((a) => assert.ok(/^\(R\)-/.test(a), a));
});

test('with stereo: true every defined stereocentre and double bond gets a descriptor, or the answer is null', () => {
  const st = ORG.stereo;
  const smis = ['C[C@H](Cl)[C@@H](C)Br', 'C/C=C/C', 'C/C=C/C=C\C', 'C[C@@H](O)C[C@H](C)Cl', 'OC1CCCC[C@H]1C', 'CCC[C@H](C)[C@@H](Cl)C(C)(C)C',
    'C[C@H](CC)C(C)(C)[C@@H](Br)CC', 'CC[C@H](C)C(C)(C)C(C)(C)CC', 'C/C=C/[C@H](C)Cl', 'OC(=O)/C=C/c1ccccc1', 'CCC(C)CC'];
  smis.forEach((smi) => {
    const m = C.parse(smi);
    const defined = st.stereocentres(m).filter((i) => st.cip(m, i)).length +
      st.stereoBonds(m).filter((b) => st.ez(m, b[0], b[1])).length;
    ['lt', 'en'].forEach((lang) => {
      const got = nm(smi, lang, { stereo: true });
      if (got === null) return;
      const head = (got.name.match(/^\(([^)]*)\)-/) || [null, ''])[1];
      const n = head ? head.split(',').length : 0;
      assert.strictEqual(n, defined, smi + ': ' + got.name);
    });
  });
});

// shape of the answers ----------------------------------------------------------

test('accepts a parsed molecule and a SMILES string, and the same input gives the same answer', () => {
  const smi = 'CC(C)CC(=O)O';
  const a = nm(smi, 'lt');
  const b = P(N.name(C.parse(smi), { lang: 'lt' }));
  assert.deepEqual(a, b);
  assert.deepEqual(nm(smi, 'lt'), a);
  assert.strictEqual(a.name, '3-metilbutano rūgštis');
  // lang defaults to Lithuanian
  assert.strictEqual(P(N.name(smi)).name, a.name);
});

test('bad SMILES throws instead of returning a name', () => {
  assert.throws(() => N.name('C(C', { lang: 'lt' }), (e) => /^SMILES/.test(e.message));
});

test('Lithuanian rules from the lecture: seniority list', () => {
  // COOH > SO3H > COOM > anhydride > COOR > COX > CONH2 > CN > CHO > CO > OH > ArOH > SH > NH2 > C=C > C#C
  const t = (smi) => nm(smi, 'lt').name;
  assert.strictEqual(t('OC(=O)CS(O)(=O)=O'), 'sulfoetano rūgštis');
  assert.strictEqual(t('COC(=O)CC(O)=O'), '3-metoksi-3-oksopropano rūgštis');
  assert.strictEqual(t('NC(=O)CC(C)C#N'), '3-cianbutanamidas');
  assert.strictEqual(t('N#CCC=O'), '3-oksopropannitrilas');
  assert.strictEqual(t('O=CCC(C)=O'), '3-oksobutanalis');
  assert.strictEqual(t('CC(=O)CC(O)C'), '4-hidroksi-2-pentanonas');
  assert.strictEqual(t('OCc1ccc(O)cc1'), '(4-hidroksifenil)metanolis');
  assert.strictEqual(t('SCCO'), '2-merkaptoetanolis');
  assert.strictEqual(t('SCCN'), '2-aminoetantiolis');
  assert.strictEqual(t('NCC=C'), '2-propen-1-aminas');
  assert.strictEqual(t('C=CC#C'), '1-buten-3-inas');
});

test('Lithuanian rules from the lecture: main chain criteria a-d', () => {
  const t = (smi) => nm(smi, 'lt').name;
  // a) most principal groups beats the longer chain
  assert.strictEqual(t('OCC(CO)CCC'), '2-propil-1,3-propandiolis');
  // b) most multiple bonds beats the longer chain
  assert.strictEqual(t('C=CC(CCC)=CC'), '3-propil-1,3-pentadienas');
  assert.strictEqual(t('CCCC(=C)C=C'), '2-propil-1,3-butadienas');
  // c) longest chain
  assert.strictEqual(t('CC(C)CCC'), '2-metilpentanas');
  // d) most prefixes when the chains are equally long
  assert.strictEqual(t('CCC(CC)C(C)CC'), '3-etil-4-metilheksanas');
  // ring or chain: the ring carries the group
  assert.strictEqual(t('OC1CCCCC1CC'), '2-etilcikloheksanolis');
  assert.strictEqual(t('OCC1CCCCC1'), 'cikloheksilmetanolis');
});

test('Lithuanian rules from the lecture: numbering and alphabetical prefixes', () => {
  const t = (smi) => nm(smi, 'lt').name;
  // lowest locant to the principal group, then multiple bonds, then prefixes
  assert.strictEqual(t('CC(Cl)CC(O)CC'), '5-chlor-3-heksanolis');
  assert.strictEqual(t('CC(Cl)CC=CC'), '5-chlor-2-heksenas');
  assert.strictEqual(t('CC=CC(Cl)CC'), '4-chlor-2-heksenas');
  // alphabetical order ignores di, tri
  assert.strictEqual(t('CC(C)C(Cl)C(C)C(Br)C'), '2-brom-4-chlor-3,5-dimetilheksanas');
  assert.strictEqual(t('BrC(Br)C(Cl)CC'), '1,1-dibrom-2-chlorbutanas');
  // the first cited prefix gets the lowest locant when the sets are equal
  assert.strictEqual(t('CC(Br)CC(Cl)C'), '2-brom-4-chlorpentanas');
  assert.strictEqual(t('CC(Cl)CC(Br)C'), '2-brom-4-chlorpentanas');
  // multiplying prefixes for complex substituents
  assert.strictEqual(t('ClCCC(CCCl)CC'), '1,5-dichlor-3-etilpentanas');
  // a complex substituent goes in brackets, with bis for two of them
  assert.strictEqual(t('CCCC(CCCl)CCC'), '4-(2-chloretil)heptanas');
  assert.strictEqual(t('CCCC(CCCl)(CCCl)CCC'), '4,4-bis(2-chloretil)heptanas');
});

test('English rules: IUPAC 2013 style main name, older style in alts', () => {
  const r = (smi) => nm(smi, 'en');
  assert.strictEqual(r('CC=C(C)C').name, '2-methylbut-2-ene');
  assert.ok(r('CC=C(C)C').alts.indexOf('2-methyl-2-butene') >= 0);
  assert.strictEqual(r('CCCO').name, 'propan-1-ol');
  assert.ok(r('CCCO').alts.indexOf('1-propanol') >= 0);
  assert.strictEqual(r('CCCC(O)=O').name, 'butanoic acid');
  assert.strictEqual(r('CCCC(=O)OCC').name, 'ethyl butanoate');
  assert.ok(r('CCC(C)=O').alts.indexOf('2-butanone') >= 0);
  assert.ok(r('CC(C)=O').alts.indexOf('propanone') >= 0);
  assert.ok(r('OCCO').alts.indexOf('1,2-ethanediol') >= 0);
  // the course also writes the toluene and aniline forms
  assert.ok(nm('Cc1ccccc1Br', 'lt').alts.indexOf('2-bromtoluenas') >= 0);
  assert.ok(nm('Nc1ccc(Br)cc1', 'lt').alts.indexOf('4-brombenzenaminas') >= 0);
  assert.ok(nm('CC(Cl)=O', 'lt').alts.indexOf('acetilchloridas') >= 0);
});

test('large and unusual molecules are handled without throwing', () => {
  // estradiol, lithocholic acid, LSD, enalapril and the like have fused rings or hetero rings: null
  ['CC12CCC3c4ccc(O)cc4CCC3C1CCC2O', 'CC(CCC(O)=O)C1CCC2C3CCC4CC(O)CCC4(C)C3CCC12C', 'CCN(CC)C(=O)C1C=C2c3cccc4[nH]cc(c34)CC2N(C)C1',
    'CCOC(=O)C(CCc1ccccc1)NC(C)C(=O)N1CCCC1C(O)=O'].forEach((smi) => {
    assert.strictEqual(N.name(smi, { lang: 'lt' }), null, smi);
    assert.strictEqual(N.name(smi, { lang: 'en' }), null, smi);
  });
  // a long chain
  assert.strictEqual(nm('CCCCCCCCCCCCCCCCCCCC', 'lt').name, 'eikozanas');
  // a chain beyond the stem table is out of scope, not a wrong name
  assert.strictEqual(N.name('C'.repeat(30), { lang: 'lt' }), null);
});

test('every name in the table uses only letters, digits and the usual punctuation', () => {
  rows.forEach((r) => {
    if (r.lt === 'null') return;
    assert.ok(/^[0-9A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž,()\- ]+$/.test(r.lt), r.lt);
    assert.ok(/^[0-9A-Za-z,()'\- ]+$/.test(r.en), r.en);
  });
});
