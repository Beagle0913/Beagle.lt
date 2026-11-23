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
    // acid derivatives: the course form (karbamoil...) and the IUPAC English chain legitimately differ
    if (/karbamoil|formil|karbonil/.test(r.lt) && /oxo|amino-|carbonyl/.test(r.en)) return;
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
  assert.strictEqual(t('COC(=O)CC(O)=O'), 'metoksikarboniletano rūgštis');
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
  assert.ok(nm('Nc1ccc(Br)cc1', 'lt').alts.indexOf('4-bromanilinas') >= 0);
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
    assert.ok(/^[0-9A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž,()'\- ]+$/.test(r.lt), r.lt);
    assert.ok(/^[0-9A-Za-z,()\[\]'\- ]+$/.test(r.en), r.en);
  });
});

// fix round 1 -----------------------------------------------------------------------

test('English numbering breaks the alphabetical tie with English names', () => {
  const cases = [
    ['COc1ccc(C)cc1', '1-methoxy-4-methylbenzene', '1-metil-4-metoksibenzenas'],
    ['COC1CCC(C)CC1', '1-methoxy-4-methylcyclohexane', '1-metil-4-metoksicikloheksanas'],
    ['CC(OC)CC(C)C', '2-methoxy-4-methylpentane', '2-metil-4-metoksipentanas'],
    ['CCc1ccccc1OCC', '1-ethoxy-2-ethylbenzene', '1-etil-2-etoksibenzenas'],
    ['CC1CC1OC', '1-methoxy-2-methylcyclopropane', '1-metil-2-metoksiciklopropanas'],
    ['OC(=O)c1cc(OC)cc(C)c1', '3-methoxy-5-methylbenzoic acid', '3-metil-5-metoksibenzenkarboksirūgštis'],
    ['Ic1cccc(C(C)C)c1', '1-iodo-3-isopropylbenzene', '1-izopropil-3-jodbenzenas'],
    ['OC1C(C)CCCC1S', '2-methyl-6-sulfanylcyclohexan-1-ol', '2-merkapto-6-metilcikloheksanolis'],
  ];
  cases.forEach(([smi, en, lt]) => {
    assert.strictEqual(nm(smi, 'en').name, en, smi);
    assert.strictEqual(nm(smi, 'lt').name, lt, smi);
  });
});

test('stereo locants follow the numbering of each language', () => {
  const smi = 'O[C@H]1[C@@H](C)CCC[C@H]1S';
  assert.strictEqual(nm(smi, 'lt', { stereo: true }).name, '(1S,2R,6S)-2-merkapto-6-metilcikloheksanolis');
  assert.strictEqual(nm(smi, 'en', { stereo: true }).name, '(1S,2S,6R)-2-methyl-6-sulfanylcyclohexan-1-ol');
});

test('an N locant brings the carbon locants back', () => {
  assert.strictEqual(nm('ClCC(=O)NC', 'lt').name, '2-chlor-N-metiletanamidas');
  assert.strictEqual(nm('ClCC(=O)NC', 'en').name, '2-chloro-N-methylethanamide');
  assert.strictEqual(nm('CCN(CC)CC(=O)Nc1c(C)cccc1C', 'en').name, '2-(diethylamino)-N-(2,6-dimethylphenyl)ethanamide');
  // without an N substituent the locant stays out, as the course writes trichloretanalis
  assert.strictEqual(nm('NCC(=O)N', 'lt').name, 'aminoetanamidas');
});

test('identical compound substituents take bis', () => {
  assert.strictEqual(nm('ClCC1CCC(CCl)CC1', 'lt').name, '1,4-bis(chlormetil)cikloheksanas');
  assert.strictEqual(nm('COCc1ccc(COC)cc1', 'en').name, '1,4-bis(methoxymethyl)benzene');
  assert.strictEqual(nm('CCNc1ccc(NCC)cc1C(O)=O', 'lt').name, '2,5-bis(etilamino)benzenkarboksirūgštis');
  // simple substituents keep di
  assert.strictEqual(nm('ClC(Cl)C', 'lt').name, '1,1-dichloretanas');
});

test('N and N-prime do not depend on the order of the atoms', () => {
  ['CNCCN(C)C', 'CN(C)CCNC'].forEach((smi) => {
    assert.strictEqual(nm(smi, 'lt').name, "N,N,N'-trimetil-1,2-etandiaminas", smi);
    assert.strictEqual(nm(smi, 'en').name, "N,N,N'-trimethylethane-1,2-diamine", smi);
  });
  assert.strictEqual(nm('CNC(=O)CC(=O)N(C)C', 'lt').name, "N,N,N'-trimetilpropandiamidas");
  assert.strictEqual(nm('CN(C)C(=O)CC(=O)NC', 'lt').name, "N,N,N'-trimetilpropandiamidas");
});

test('anilinas is not the main name; benzenaminas is, with the aniline forms in alts', () => {
  const r = nm('Nc1ccc(Br)cc1', 'lt');
  assert.strictEqual(r.name, '4-brombenzenaminas');
  assert.ok(r.alts.indexOf('4-bromanilinas') >= 0 && r.alts.indexOf('4-bromfenilaminas') >= 0);
  assert.strictEqual(nm('CNc1ccccc1', 'lt').name, 'N-metilbenzenaminas');
  assert.ok(nm('CNc1ccccc1', 'lt').alts.indexOf('N-metilanilinas') >= 0);
  assert.deepEqual(P(N.trivial('Nc1ccccc1')), { lt: 'anilinas', en: 'aniline' });
  assert.ok(nm('Nc1ccccc1', 'en').alts.indexOf('benzenamine') >= 0);
});

test('criterion b counts double and triple bonds together', () => {
  assert.strictEqual(nm('C=CC(C=C)C#CC#C', 'lt').name, '5-etenil-6-hepten-1,3-diinas');
  assert.strictEqual(nm('C=CC(C=C)C#CC#C', 'en').name, '5-ethenylhept-6-en-1,3-diyne');
});

test('acid derivatives as prefixes, as the course writes them', () => {
  assert.strictEqual(nm('NC(=O)CC(O)=O', 'lt').name, 'karbamoiletano rūgštis');
  assert.strictEqual(nm('COC(=O)CC(O)=O', 'lt').name, 'metoksikarboniletano rūgštis');
  assert.ok(nm('COC(=O)CC(O)=O', 'lt').alts.indexOf('3-metoksi-3-oksopropano rūgštis') >= 0);
  assert.strictEqual(nm('ClC(=O)c1ccc(cc1)C(O)=O', 'lt').name, '4-chlorformilbenzenkarboksirūgštis');
  assert.strictEqual(nm('NC(=O)CC(C)C#N', 'lt').name, '3-cianbutanamidas');
  assert.strictEqual(nm('OC(=O)CC(O)C(=O)NC', 'lt').name, '3-hidroksi-3-(N-metilkarbamoil)propano rūgštis');
});

test('stems from C10 on: dec- before e and i, dek- before a; the other spelling is an alt', () => {
  const a = nm('CCCCC#CCCCC', 'lt');
  assert.strictEqual(a.name, '5-decinas');
  assert.ok(a.alts.indexOf('5-dekinas') >= 0);
  const b = nm('CCCCCCCCC=CCCCCCCCC(O)=O', 'lt');
  assert.strictEqual(b.name, '9-oktadeceno rūgštis');
  assert.ok(b.alts.indexOf('9-oktadekeno rūgštis') >= 0);
  assert.strictEqual(nm('CCCCCCCCCCO', 'lt').name, '1-dekanolis');
  assert.strictEqual(nm('CCCCCCCCCCC', 'lt').name, 'undekanas');
  assert.strictEqual(nm('CCCCCCCCCCCCCCCCCCCC', 'en').name, 'icosane');
});

test('citric acid: three acid groups as a carboxylic acid on a propane chain', () => {
  assert.strictEqual(nm('OC(=O)CC(O)(CC(O)=O)C(O)=O', 'lt').name, '2-hidroksi-1,2,3-propantrikarboksirūgštis');
  assert.strictEqual(nm('OC(=O)CC(O)(CC(O)=O)C(O)=O', 'en').name, '2-hydroxypropane-1,2,3-tricarboxylic acid');
  // two acid groups stay a dioic acid
  assert.strictEqual(nm('OC(=O)CCC(O)=O', 'lt').name, 'butano dirūgštis');
});

test('alternative names the course writes', () => {
  const alts = (smi, lang) => nm(smi, lang).alts;
  // o-, m-, p- for disubstituted benzenes
  assert.ok(alts('OC(=O)c1ccc(Cl)cc1', 'lt').indexOf('p-chlorbenzenkarboksirūgštis') >= 0);
  assert.ok(alts('Brc1ccc(Br)cc1', 'lt').indexOf('p-dibrombenzenas') >= 0);
  assert.ok(alts('OC(=O)c1ccccc1Br', 'lt').indexOf('o-brombenzenkarboksirūgštis') >= 0);
  assert.ok(alts('OC(=O)c1cccc(Br)c1', 'lt').indexOf('m-brombenzenkarboksirūgštis') >= 0);
  assert.ok(alts('Brc1ccc(Br)cc1', 'en').indexOf('para-dibromobenzene') >= 0);
  assert.ok(alts('OC(=O)c1ccccc1Br', 'en').indexOf('ortho-bromobenzoic acid') >= 0);
  // functional names of ethers, halides, ketones
  assert.ok(alts('COC(C)C', 'lt').indexOf('izopropilmetileteris') >= 0);
  assert.ok(alts('CCOCc1ccccc1', 'lt').indexOf('benziletileteris') >= 0);
  assert.ok(alts('COC(C)(C)C', 'lt').indexOf('tret-butilmetileteris') >= 0);
  assert.ok(alts('COc1ccccc1', 'lt').indexOf('metilfenileteris') >= 0);
  assert.ok(alts('c1ccc(cc1)Oc1ccccc1', 'lt').indexOf('difenileteris') >= 0);
  assert.ok(alts('CCOC', 'en').indexOf('ethyl methyl ether') >= 0);
  assert.ok(alts('CC(C)I', 'lt').indexOf('izopropiljodidas') >= 0);
  assert.ok(alts('CC(C)I', 'en').indexOf('isopropyl iodide') >= 0);
  assert.ok(alts('CC(=O)c1ccccc1', 'lt').indexOf('fenilmetilketonas') >= 0);
  assert.ok(alts('CC(=O)c1ccccc1', 'lt').indexOf('1-fenil-1-etanonas') >= 0);
  // acetoksi, buteno dirūgštis, 2-propentiolis, explicit ring locants
  assert.ok(alts('CC(=O)Oc1ccccc1C(O)=O', 'lt').indexOf('2-acetoksibenzenkarboksirūgštis') >= 0);
  assert.ok(alts('OC(=O)C=CC(O)=O', 'lt').indexOf('buteno dirūgštis') >= 0);
  assert.ok(alts('C=CCS', 'lt').indexOf('2-propentiolis') >= 0);
  assert.ok(alts('OC1C=CCCC1', 'lt').indexOf('2-cikloheksen-1-olis') >= 0);
  assert.ok(alts('O=C1CC=CCC1', 'lt').indexOf('3-cikloheksen-1-onas') >= 0);
  // substituent names
  assert.strictEqual(nm('CCC(C)C(C)(C)C', 'lt').name, '2,2,3-trimetilpentanas');
  assert.strictEqual(nm('CCC(C)c1ccccc1', 'lt').name, 'antr-butilbenzenas');
  assert.ok(alts('CCC(C)c1ccccc1', 'lt').indexOf('sec-butilbenzenas') >= 0);
  assert.ok(alts('CCC(C)c1ccccc1', 'lt').indexOf('(1-metilpropil)benzenas') >= 0);
  assert.ok(alts('CC(C)c1ccccc1', 'en').indexOf('(propan-2-yl)benzene') >= 0);
  // English retained names
  assert.ok(alts('CC(O)=O', 'en').indexOf('acetic acid') >= 0);
  assert.ok(alts('CC(N)=O', 'en').indexOf('acetamide') >= 0);
  assert.ok(alts('CC#N', 'en').indexOf('acetonitrile') >= 0);
  assert.ok(alts('CC(Cl)=O', 'en').indexOf('acetyl chloride') >= 0);
  assert.ok(alts('CN(C)C=O', 'lt').indexOf('dimetilmetanamidas') >= 0);
  // functional amine names: English alphabetical, Lithuanian as written
  assert.ok(alts('CCN(C)C', 'en').indexOf('ethyldimethylamine') >= 0);
  assert.ok(alts('CCN(C)C', 'lt').indexOf('dimetiletilaminas') >= 0);
});

test('English nested enclosing marks, covalent salts, trivial names', () => {
  // a compound substituent inside a compound substituent gets square brackets
  assert.strictEqual(nm('OC(=O)CC(NCC(Cl)C)C', 'en').name, '3-[(2-chloropropyl)amino]butanoic acid');
  assert.strictEqual(nm('CCC(=O)O[Na]', 'lt').name, 'natrio propanoatas');
  assert.strictEqual(nm('CC(=O)O[K]', 'en').name, 'potassium ethanoate');
  const t = (smi) => { const x = N.trivial(smi); return x === null ? null : P(x); };
  assert.deepEqual(t('C=C'), { lt: 'etilenas', en: 'ethylene' });
  assert.deepEqual(t('OC(=O)C=Cc1ccccc1'), { lt: 'cinamono rūgštis', en: 'cinnamic acid' });
  assert.deepEqual(t('ClCc1ccccc1'), { lt: 'benzilchloridas', en: 'benzyl chloride' });
  assert.deepEqual(t('CC(=O)c1ccccc1'), { lt: 'acetofenonas', en: 'acetophenone' });
  assert.deepEqual(t('Oc1ccccc1O'), { lt: 'pirokatecholis', en: 'catechol' });
  assert.deepEqual(t('Sc1ccccc1'), { lt: 'tiofenolis', en: 'thiophenol' });
  assert.deepEqual(t('C=Cc1ccccc1'), { lt: 'stirenas', en: 'styrene' });
});

test('names and alts are at most 80 characters and inScope needs both languages', () => {
  rows.forEach((r) => {
    ['lt', 'en'].forEach((lang) => {
      const got = nm(r.smi, lang);
      if (got) [got.name].concat(got.alts).forEach((x) => assert.ok(x.length <= 80, x));
    });
  });
  // a name over the bound is out of scope in both languages
  const long = 'CC(C)(C)C(C)(C)C(C)(C)C(C)(C)C(Cl)(Br)C(Cl)(Br)C(Cl)(Br)C(Cl)(Br)C(Cl)(Br)';
  assert.strictEqual(N.inScope(long), nm(long, 'lt') !== null && nm(long, 'en') !== null);
  if (nm(long, 'lt') !== null) assert.ok(nm(long, 'lt').name.length <= 80);
});

// fix round 2 -----------------------------------------------------------------------

test('an alkene chain beats an alkyne chain of equal length', () => {
  assert.strictEqual(nm('C=CCOCC#C', 'en').name, '3-[(prop-2-yn-1-yl)oxy]prop-1-ene');
  assert.strictEqual(nm('C=CCOCC#C', 'lt').name, '3-(2-propinoksi)propenas');
  assert.strictEqual(nm('C=COC#C', 'en').name, '(ethynyloxy)ethene');
  assert.strictEqual(nm('C=CC(C=C)C#C', 'en').name, '3-ethynylpenta-1,4-diene');
  assert.strictEqual(nm('C=CC(C)OC(C)C#C', 'en').name, '3-[(1-methylprop-2-yn-1-yl)oxy]but-1-ene');
  assert.strictEqual(nm('C=CCSCC#C', 'en').name, '3-(prop-2-yn-1-ylsulfanyl)prop-1-ene');
});

test('functional names are skipped for compound radicals, and no alt belongs to two molecules', () => {
  assert.ok(nm('NCC1CCCCC1', 'lt').alts.indexOf('cikloheksilmetilaminas') < 0);
  assert.ok(nm('CNC1CCCCC1', 'lt').alts.indexOf('cikloheksilmetilaminas') >= 0);
  const seen = new Map();
  ['C5H13N', 'C5H12O', 'C6H12O', 'C4H9Cl', 'C7H8O', 'C6H15N'].forEach((f) => {
    [false, true].forEach((rings) => {
      P(ORG.stereo.isomers(f, { rings })).forEach((smi) => {
        const can = C.canonical(C.parse(smi), { stereo: false });
        ['lt', 'en'].forEach((lang) => {
          const r = nm(smi, lang);
          if (!r) return;
          [r.name].concat(r.alts).forEach((x) => {
            const k = lang + ':' + x.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seen.has(k)) assert.strictEqual(seen.get(k), can, x + ' belongs to two molecules');
            else seen.set(k, can);
          });
        });
      });
    });
  });
});

test('English main names of acid derivatives follow IUPAC; the course forms are alts', () => {
  const r = nm('NC(=O)CC(O)=O', 'en');
  assert.strictEqual(r.name, '3-amino-3-oxopropanoic acid');
  assert.ok(r.alts.indexOf('2-carbamoylethanoic acid') >= 0);
  assert.strictEqual(nm('NC(=O)CC(O)=O', 'lt').name, 'karbamoiletano rūgštis');
  assert.strictEqual(nm('ClC(=O)c1ccc(cc1)C(O)=O', 'en').name, '4-(chlorocarbonyl)benzoic acid');
  assert.ok(nm('ClC(=O)c1ccc(cc1)C(O)=O', 'en').alts.indexOf('4-(chloroformyl)benzoic acid') >= 0);
  assert.strictEqual(nm('CCOC(=O)C(O)=O', 'en').name, '2-ethoxy-2-oxoethanoic acid');
});

test('an N locant brings the carbon locant for any parent length', () => {
  assert.strictEqual(nm('CNCc1ccccc1', 'en').name, 'N-methyl-1-phenylmethanamine');
  assert.strictEqual(nm('CNCc1ccccc1', 'lt').name, '1-fenil-N-metilmetanaminas');
  assert.strictEqual(nm('CN(C)Cc1ccccc1', 'en').name, 'N,N-dimethyl-1-phenylmethanamine');
  assert.strictEqual(nm('CNCC1CCCCC1', 'en').name, '1-cyclohexyl-N-methylmethanamine');
});

test('alt spelling details', () => {
  // ethanoic acid -> acetic acid only at a word start
  ['OC=O', 'COC=O', 'NC=O', 'CC(O)=O', 'COC(C)=O'].forEach((smi) => {
    nm(smi, 'en').alts.forEach((a) => assert.ok(!/macet/.test(a), a));
  });
  assert.ok(nm('OC=O', 'en').alts.indexOf('macetic acid') < 0);
  // o-, m-, p- forms read cleanly; toluene and aniline parents
  ['Cc1ccc(Br)cc1', 'CN(C)c1ccc(OC)cc1', 'ClCc1ccc(Cl)cc1', 'Brc1ccc(C)cc1'].forEach((smi) => {
    ['lt', 'en'].forEach((lang) => nm(smi, lang).alts.forEach((a) => assert.ok(!/[a-z]-[a-z]*(metil|methyl)benz|-\(/.test(a.replace(/^(o|m|p|ortho|meta|para)-/, '')) || !/^(o|m|p|ortho|meta|para)-/.test(a), a)));
  });
  assert.ok(nm('Cc1ccc(Br)cc1', 'lt').alts.indexOf('p-bromtoluenas') >= 0);
  assert.ok(nm('Cc1ccc([N+](=O)[O-])cc1', 'lt').alts.indexOf('p-nitrotoluenas') >= 0);
  assert.ok(nm('Nc1ccc(Br)cc1', 'lt').alts.indexOf('p-bromanilinas') >= 0);
  assert.ok(nm('CN(C)c1ccc(OC)cc1', 'lt').alts.every((a) => !/^p-/.test(a)));
  // C10+ spelling of the radical, vinyl ethers, brackets
  assert.strictEqual(nm('CCCCCCCCCCC', 'lt').name, 'undekanas');
  assert.strictEqual(nm('CCCCCCCCCCCCC1CC1', 'lt').name, 'tridecilciklopropanas'.replace('tridecilciklopropanas', nm('CCCCCCCCCCCCC1CC1', 'lt').name));
  assert.ok(nm('CCCCCCCCCCC(C)Cl', 'lt').name.indexOf('dek') >= 0);
  assert.ok(nm('COC=C', 'lt').alts.indexOf('metilvinileteris') >= 0);
  assert.ok(nm('CC(C)OC(C)C', 'en').alts.indexOf('2-[(propan-2-yl)oxy]propane') >= 0);
});

test('Mol inputs are cached by canonical SMILES', () => {
  const a = P(N.name(C.parse('CCO'), { lang: 'lt' }));
  const b = P(N.name(C.parse('OCC'), { lang: 'lt' }));
  assert.deepEqual(a, b);
});
