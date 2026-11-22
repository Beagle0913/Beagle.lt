// site/organic/units/u09.js: unit 9, arenes and electrophilic aromatic substitution (SEAr)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // labels that are only formulas or symbols

  /* ---------- substituents and electrophiles ---------- */

  // Ring substituents. frag = SMILES written from the ring atom outward; f = formula for the text;
  // kind: 'don' (donor with a lone pair), 'alk' (alkyl), 'hal' (halogen), 'acc' (meta director);
  // lvl = reactivity toward E+ (4 strong activator ... 1 benzene ... 0 halogen ... -1 moderate and -2 strong deactivator, L9 p28);
  // st = strength as an o/p director when two groups compete (the stronger donor decides, L9 p34).
  const SUB = {
    NH2:  { frag: 'N', f: 'NH2', kind: 'don', lvl: 4, st: 4, lt: 'anilinas', en: 'aniline' },
    OH:   { frag: 'O', f: 'OH', kind: 'don', lvl: 4, st: 4, lt: 'fenolis', en: 'phenol' },
    NMe2: { frag: 'N(C)C', f: 'N(CH3)2', kind: 'don', lvl: 4, st: 4, lt: 'N,N-dimetilanilinas', en: 'N,N-dimethylaniline' },
    OMe:  { frag: 'OC', f: 'OCH3', kind: 'don', lvl: 3, st: 3, lt: 'metoksibenzenas', en: 'methoxybenzene' },
    NHAc: { frag: 'NC(C)=O', f: 'NHCOCH3', kind: 'don', lvl: 3, st: 2, lt: 'N-feniletanamidas', en: 'N-phenylethanamide (acetanilide)' },
    NEt2: { frag: 'N(CC)CC', f: 'N(C2H5)2', kind: 'don', lvl: 4, st: 4, lt: 'N,N-dietilanilinas', en: 'N,N-diethylaniline' },
    NMeEt: { frag: 'N(C)CC', f: 'N(CH3)C2H5', kind: 'don', lvl: 4, st: 4, lt: 'N-etil-N-metilanilinas', en: 'N-ethyl-N-methylaniline' },
    Me:   { frag: 'C', f: 'CH3', kind: 'alk', lvl: 2, st: 1, lt: 'toluenas', en: 'toluene' },
    Et:   { frag: 'CC', f: 'C2H5', kind: 'alk', lvl: 2, st: 1, lt: 'etilbenzenas', en: 'ethylbenzene' },
    Pr:   { frag: 'CCC', f: 'C3H7', kind: 'alk', lvl: 2, st: 1, lt: 'propilbenzenas', en: 'propylbenzene' },
    iPr:  { frag: 'C(C)C', f: 'CH(CH3)2', kind: 'alk', lvl: 2, st: 1, lt: 'izopropilbenzenas', en: 'isopropylbenzene' },
    tBu:  { frag: 'C(C)(C)C', f: 'C(CH3)3', kind: 'alk', lvl: 2, st: 1, lt: 'tret-butilbenzenas', en: 'tert-butylbenzene' },
    H:    { frag: null, f: 'H', kind: 'none', lvl: 1, st: 0, lt: 'benzenas', en: 'benzene' },
    F:    { frag: 'F', f: 'F', kind: 'hal', lvl: 0, st: -1, lt: 'fluorbenzenas', en: 'fluorobenzene' },
    Cl:   { frag: 'Cl', f: 'Cl', kind: 'hal', lvl: 0, st: -1, lt: 'chlorbenzenas', en: 'chlorobenzene' },
    Br:   { frag: 'Br', f: 'Br', kind: 'hal', lvl: 0, st: -1, lt: 'brombenzenas', en: 'bromobenzene' },
    I:    { frag: 'I', f: 'I', kind: 'hal', lvl: 0, st: -1, lt: 'jodbenzenas', en: 'iodobenzene' },
    COMe: { frag: 'C(C)=O', f: 'COCH3', kind: 'acc', lvl: -1, st: -3, lt: 'acetofenonas', en: 'acetophenone' },
    COOH: { frag: 'C(=O)O', f: 'COOH', kind: 'acc', lvl: -1, st: -3, lt: 'benzenkarboksirūgštis', en: 'benzoic acid' },
    CHO:  { frag: 'C=O', f: 'CHO', kind: 'acc', lvl: -1, st: -3, lt: 'benzenkarbaldehidas', en: 'benzaldehyde' },
    CN:   { frag: 'C#N', f: 'CN', kind: 'acc', lvl: -1, st: -3, lt: 'benzenkarbonitrilas', en: 'benzonitrile' },
    COOMe: { frag: 'C(=O)OC', f: 'COOCH3', kind: 'acc', lvl: -1, st: -3, lt: 'metilbenzoatas', en: 'methyl benzoate' },
    CONH2: { frag: 'C(N)=O', f: 'CONH2', kind: 'acc', lvl: -1, st: -3, lt: 'benzenkarboksamidas', en: 'benzamide' },
    SO3H: { frag: 'S(=O)(=O)O', f: 'SO3H', kind: 'acc', lvl: -1, st: -3, lt: 'benzensulfonrūgštis', en: 'benzenesulfonic acid' },
    NO2:  { frag: '[N+](=O)[O-]', f: 'NO2', kind: 'acc', lvl: -2, st: -3, lt: 'nitrobenzenas', en: 'nitrobenzene' },
    CF3:  { frag: 'C(F)(F)F', f: 'CF3', kind: 'acc', lvl: -2, st: -3, lt: 'trifluormetilbenzenas', en: '(trifluoromethyl)benzene' },
    CCl3: { frag: 'C(Cl)(Cl)Cl', f: 'CCl3', kind: 'acc', lvl: -2, st: -3, lt: 'trichlormetilbenzenas', en: '(trichloromethyl)benzene' }
  };
  const isOP = (k) => SUB[k].kind !== 'acc' && SUB[k].kind !== 'none';

  // The six electrophiles of the course (L9 p12); key = the E of react.run('sear')
  const ELE = {
    Cl:     { frag: 'Cl', reag: 'Cl2, FeCl3', lt: 'chlorinimas', en: 'chlorination', fc: false },
    Br:     { frag: 'Br', reag: 'Br2, FeBr3', lt: 'brominimas', en: 'bromination', fc: false },
    NO2:    { frag: '[N+](=O)[O-]', reag: 'HNO3, H2SO4', lt: 'nitrinimas', en: 'nitration', fc: false },
    SO3H:   { frag: 'S(=O)(=O)O', reag: 'SO3, H2SO4', lt: 'sulfoninimas', en: 'sulfonation', fc: false },
    CH3:    { frag: 'C', reag: 'CH3Cl, AlCl3', lt: 'alkilinimas', en: 'alkylation', fc: true },
    'C(C)=O': { frag: 'C(C)=O', reag: 'CH3COCl, AlCl3', lt: 'acilinimas', en: 'acylation', fc: true }
  };

  const ATOM = /Cl|Br|[BCNOPSFIcnops]|\[[^\]]+\]/g;
  const nat = (s) => (s.match(ATOM) || []).length;

  // A benzene ring with substituents: subs = 6 keys of SUB / fragments (or null for H). Returns the SMILES and the SMILES index of each ring atom.
  function ringSmi(subs, ele) {
    let s = '';
    let n = 0;
    const ring = [];
    for (let i = 0; i < 6; i++) {
      ring.push(n);
      s += i === 0 ? 'c1' : 'c';
      n++;
      let fr = subs[i];
      if (fr && SUB[fr]) fr = SUB[fr].frag;
      if (fr && ele && ele[i]) fr = null; // never both
      if (ele && ele[i]) fr = ele[i];
      if (fr) { s += '(' + fr + ')'; n += nat(fr); }
    }
    return { smi: s + '1', ring };
  }
  const subsOf = (a, pos) => { const x = [null, null, null, null, null, null]; (pos || []).forEach((p, i) => { x[p] = a[i]; }); return x; };

  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const lang = (ctx, smi, l) => { const r = ctx.name.name(smi, { lang: l }); return r && r.name ? r.name : null; };
  const nameT = (ctx, smi) => { const a = lang(ctx, smi, 'lt'); const b = lang(ctx, smi, 'en'); return a && b ? t(a, b) : null; };
  const formulaT = (s) => t(s, s);

  // Where does E+ go? subs = array of 6 keys (null = H). Returns null (no reaction) or
  // {smi, ring, free, major: [ring positions], products: [{smi, major, pos: [ring positions]}], res}
  function attack(ctx, subs, ek) {
    const { react, chem } = ctx;
    const base = ringSmi(subs);
    const res = react.run('sear', [base.smi], { E: ek });
    if (res.none) return null;
    const free = [];
    subs.forEach((x, i) => { if (!x) free.push(i); });
    const products = [];
    const majorPos = [];
    for (const p of free) {
      const e = [null, null, null, null, null, null];
      e[p] = ELE[ek].frag;
      const mine = ringSmi(subs, e).smi;
      const hit = res.products.find((x) => chem.same(mine, x.smi, { stereo: false }));
      if (!hit) throw new Error('u09: engine and hand-built product disagree for ' + base.smi + ' ' + ek);
      let pr = products.find((x) => x.smi === hit.smi);
      if (!pr) { pr = { smi: hit.smi, major: !!hit.major, pos: [] }; products.push(pr); }
      pr.pos.push(p);
      if (hit.major) majorPos.push(p);
    }
    return { smi: base.smi, ring: base.ring, free, major: majorPos, products, res };
  }

  // the short reason for each type of substituent (both languages), used in solutions
  const KIND_WHY = {
    don: t('turi laisvųjų elektronų porų ir paduoda elektronus į žiedą (+M): žiedas aktyvuojamas, o-/p-orientantas',
      'has lone pairs and donates electrons into the ring (+M): it activates the ring and directs o/p'),
    alk: t('yra silpnas elektronų donoras (+I, hiperkonjugacija): žiedas silpnai aktyvuojamas, o-/p-orientantas',
      'is a weak electron donor (+I, hyperconjugation): it activates the ring weakly and directs o/p'),
    hal: t('turi laisvųjų elektronų porų, bet jo −I efektas stipresnis už +M: žiedas deaktyvuojamas, tačiau orientantas lieka o-/p-',
      'has lone pairs, but its −I effect is stronger than its +M effect: it deactivates the ring, yet it is still an o/p director'),
    acc: t('traukia elektronus (−I, −M): žiedas deaktyvuojamas, m-orientantas',
      'withdraws electrons (−I, −M): it deactivates the ring and is a meta director')
  };

  /* ---------- exports for the end of the file are inline: the unit object below ---------- */

  // Arenium ion of an attack at ring position k (Z, if any, on ring atom 0; E fragment ef on atom k), one resonance structure drawn
  // with the + on ring atom c (a neighbour of k). Returns the SMILES, the SMILES index of each ring atom and the three atoms that can carry the +.
  function arenium(zkey, k, c, ef) {
    const path = c === (k + 1) % 6 ? [2, 3, 4, 5] : [1, 2, 3, 4];
    const dbl = {};
    const pr = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);
    dbl[pr((k + path[0]) % 6, (k + path[1]) % 6)] = true;
    dbl[pr((k + path[2]) % 6, (k + path[3]) % 6)] = true;
    const z = zkey && SUB[zkey] ? SUB[zkey].frag : null;
    let s = '';
    let n = 0;
    const idx = [];
    for (let q = 0; q < 6; q++) {
      idx.push(n);
      const bond = q > 0 && dbl[pr(q - 1, q)] ? '=' : '';
      let tok = q === c ? (q === 0 && z ? '[C+]' : '[CH+]') : 'C';
      tok += q === 0 ? '1' : (q === 5 ? (dbl[pr(5, 0)] ? '=1' : '1') : '');
      s += bond + tok;
      n++;
      if (q === 0 && z) { s += '(' + z + ')'; n += nat(z); }
      if (q === k) { s += '(' + ef + ')'; n += nat(ef); }
    }
    return { smi: s, idx, plus: [(k + 1) % 6, (k + 5) % 6, (k + 3) % 6] };
  }
  const BR = 'Br';

  /* ---------- notes ---------- */

  const notes = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'arom',
      title: t('Aromatiškumas ir Hiukelio taisyklė', 'Aromaticity and Hückel’s rule'),
      blocks: [
        { h: t('Kodėl benzenas nesijungia kaip alkenas?', 'Why does benzene not add reagents like an alkene?') },
        {
          p: t('Benzenas $C6H6$ yra nesotusis junginys, bet bromo jis neprijungia, $KMnO4$ jo neoksiduoja, o vanduo rūgštinėje terpėje nesijungia. Tik esant aukštai temperatūrai ir slėgiui benzenas hidrinamas iki cikloheksano.',
            'Benzene $C6H6$ is unsaturated, yet it does not take up bromine, $KMnO4$ does not oxidise it, and water does not add in acid. Hydrogen adds only at high temperature and pressure, giving cyclohexane.'),
          src: 'L9 p4'
        },
        { scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { arrow: '→', above: f('H2, Ni'), below: t('aukšta t° ir slėgis', 'high t° and pressure') }, { smi: 'C1CCCCC1' }] }, src: 'L9 p4' },
        {
          p: t('Priežastis slypi elektronų sandaroje. Visi šeši C atomai yra $sp2$ hibridizuoti ir guli vienoje plokštumoje, o šeši $p$ elektronai sudaro vientisą delokalizuotą debesį virš žiedo ir po juo. Kekulės formulė su trimis dvigubaisiais ryšiais yra tik rezonansinė formulė: tikrajame žiede visi C–C ryšiai vienodo ilgio.',
            'The reason is the electronic structure. All six carbons are $sp2$ hybridised and lie in one plane, and the six $p$ electrons form one continuous delocalised cloud above and below the ring. Kekulé’s formula with three double bonds is only a resonance structure: in the real ring all C–C bonds are equally long.'),
          src: 'L9 p5'
        },
        {
          rule: t('Hiukelio taisyklė: aromatinei sistemai reikia uždaro plokščio ciklo, kurio visi atomai suteikia $p$ orbitales vientisai konjuguotai π sistemai, ir $4n + 2$ π elektronų (n = 0, 1, 2, ...), t. y. 2, 6, 10, 14 ...',
            'Hückel’s rule: a compound is aromatic if it is cyclic and planar, every ring atom has a $p$ orbital (one continuous conjugated π system) and the number of π electrons is $4n + 2$ (n = 0, 1, 2, ...), that is 2, 6, 10, 14 ...'),
          src: 'L9 p6'
        },
        {
          p: t('Aromatiniai junginiai labai stabilūs, todėl jie renkasi reakcijas, kurios nesuardo aromatinės sistemos: pakeitimo, o ne prijungimo.',
            'Aromatic compounds are very stable, so they prefer reactions that leave the aromatic system intact: substitution rather than addition.'),
          src: 'L9 p6'
        },
        {
          mol: [
            { smi: 'c1ccccc1', opts: { circle: true }, caption: t('benzenas, 6 π e−', 'benzene, 6 π e−') },
            { smi: 'c1ccc2ccccc2c1', caption: t('naftalenas, 10 π e−', 'naphthalene, 10 π e−') },
            { smi: 'c1ccncc1', caption: t('piridinas, 6 π e−', 'pyridine, 6 π e−') },
            { smi: 'c1cc[nH]c1', caption: t('pirolis, 6 π e−', 'pyrrole, 6 π e−') },
            { smi: 'c1ccoc1', caption: t('furanas, 6 π e−', 'furan, 6 π e−') }
          ],
          caption: t('Aromatiniai junginiai.', 'Aromatic compounds.'), src: 'L9 p6'
        },
        {
          mol: [
            { smi: '[CH-]1C=CC=C1', caption: t('ciklopentadienilanijonas, 6 π e−: aromatinis', 'cyclopentadienyl anion, 6 π e−: aromatic') },
            { smi: '[CH+]1C=CC=CC=C1', caption: t('cikloheptatrienilkatijonas, 6 π e−: aromatinis', 'cycloheptatrienyl cation, 6 π e−: aromatic') },
            { smi: '[CH+]1C=CC=C1', caption: t('ciklopentadienilkatijonas, 4 π e−: ne', 'cyclopentadienyl cation, 4 π e−: not aromatic') },
            { smi: '[CH-]1C=CC=CC=C1', caption: t('cikloheptatrienilanijonas, 8 π e−: ne', 'cycloheptatrienyl anion, 8 π e−: not aromatic') }
          ],
          caption: t('Ciklopentadienilo ir cikloheptatrienilo dariniai: π elektronų skaičius priklauso nuo krūvio.', 'Cyclopentadienyl and cycloheptatrienyl species: the number of π electrons depends on the charge.'), src: 'L9 p7'
        },
        {
          pitfall: t('Į π sistemą įeina tik elektronai, esantys $p$ orbitalėse. Piridino azoto laisvoji pora yra žiedo plokštumoje ir neskaičiuojama (6 π elektronai iš trijų $C=C$), o pirolio azoto pora yra $p$ orbitalėje ir skaičiuojama (4 + 2). Žiedas su vienu $sp3$ atomu (ciklopentadienas) nėra vientisai konjuguotas, todėl nearomatinis.',
            'Only electrons in $p$ orbitals belong to the π system. The lone pair of pyridine nitrogen lies in the ring plane and is not counted (6 π electrons from three $C=C$), while the pyrrole nitrogen pair sits in a $p$ orbital and is counted (4 + 2). A ring with one $sp3$ atom (cyclopentadiene) is not continuously conjugated, so it is not aromatic.')
        },
        {
          example: {
            q: [{ p: t('Ar ciklopentadienilanijonas yra aromatinis?', 'Is the cyclopentadienyl anion aromatic?') }, { mol: { smi: '[CH-]1C=CC=C1', opts: { lonePairs: [0] } } }],
            steps: [
              [{ p: t('Visi penki žiedo atomai yra $sp2$: dviejose C=C yra 4 π elektronai, o neigiamo C laisvoji pora guli $p$ orbitalėje.', 'All five ring atoms are $sp2$: the two C=C contain 4 π electrons, and the lone pair of the negative carbon sits in a $p$ orbital.') }],
              [{ p: t('Iš viso π elektronų: 4 + 2 = 6. Žiedas ciklinis, plokščias ir vientisai konjuguotas.', 'Total π electrons: 4 + 2 = 6. The ring is cyclic, planar and continuously conjugated.') }],
              [{ p: t('6 = 4 · 1 + 2, todėl Hiukelio taisyklė tenkinama: anijonas aromatinis.', '6 = 4 · 1 + 2, so Hückel’s rule is met: the anion is aromatic.') }]
            ]
          },
          claims: [{ aromatic: ['[CH-]1C=CC=C1', true] }, { formula: ['[CH-]1C=CC=C1', 'C5H5−'] }]
        },
        { practice: 'u09.arom' },
        { practice: 'u09.huckel' }
      ]
    },
    /* ------------------------------------------------------------ 2 */
    {
      id: 'mech',
      title: t('SEAr mechanizmas', 'The SEAr mechanism'),
      blocks: [
        { h: t('Elektrofilinis aromatinis pakeitimas', 'Electrophilic aromatic substitution') },
        {
          p: t('Aromatinio žiedo π elektronai yra abiejose plokštumos pusėse, todėl arenas elgiasi kaip nukleofilas ir gali jį atakuoti elektrofilas. Vandenilio atomas pakeičiamas elektrofiline dalele $E+$, o aromatinė sistema išsaugoma. Ši reakcija vadinama SEAr (elektrofilinis aromatinis pakeitimas).',
            'The π electrons of an aromatic ring lie on both sides of the plane, so an arene behaves as a nucleophile and an electrophile can attack it. A hydrogen is replaced by the electrophilic particle $E+$ and the aromatic system is kept. This reaction is called SEAr (electrophilic aromatic substitution).'),
          src: 'L9 p8, T p62'
        },
        {
          list: [
            t('**I stadija** – elektrofilinės dalelės susidarymas: reagentas $E-A$ poliarizuojasi ir skyla į $E+$ ir $A-$, dažniausiai veikiamas katalizatoriaus.', '**Stage I** – formation of the electrophile: the reagent $E-A$ is polarised and splits into $E+$ and $A-$, usually with the help of a catalyst.'),
            t('**II stadija (lėtoji)** – susidaro arenio jonas (σ-kompleksas): π elektronai sudaro ryšį su $E+$. Atsiranda nearomatinis karbokatijonas: vienas žiedo atomas $sp3$, penki $sp2$, o 4 π elektronai pasiskirsto penkiose $p$ orbitalėse.', '**Stage II (slow)** – formation of the arenium ion (σ complex): the π electrons bond to $E+$. A non-aromatic carbocation forms: one ring atom is $sp3$, five are $sp2$, and 4 π electrons are spread over five $p$ orbitals.'),
            t('**III stadija (greitoji)** – protono atskilimas: bazė atplėšia $H+$ nuo $sp3$ atomo, C–H ryšio elektronai grįžta į π sistemą ir aromatiškumas atsistato.', '**Stage III (fast)** – loss of the proton: a base removes $H+$ from the $sp3$ carbon, the C–H electrons return to the π system and aromaticity is restored.')
          ],
          src: 'L9 p8–10'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C1=CC=CC=C1' }, { plus: true }, { smi: '[Br+]' }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 0 } }],
              note: t('II stadija (lėtoji): π elektronų pora sudaro ryšį su elektrofilu.', 'Stage II (slow): the π electron pair bonds to the electrophile.')
            },
            {
              scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'BrC1[CH+]C=CC=C1', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H1' } }, { from: { m: 1, b: [1, 'H1'] }, to: { m: 1, mid: [1, 2] } }],
              note: t('III stadija (greitoji): bazė atplėšia protoną, elektronai grįžta į žiedą.', 'Stage III (fast): the base removes the proton and the electrons return to the ring.')
            }
          ],
          caption: t('Benzeno brominimas: šioje schemoje $E+$ yra $Br+$.', 'Bromination of benzene: here $E+$ is $Br+$.'),
          src: 'L9 p9–11'
        },
        { scheme: { items: [{ smi: 'BrC1[CH+]C=CC=C1' }, { plus: true }, { smi: '[Br-]' }, { arrow: '→' }, { smi: 'Brc1ccccc1' }, { plus: true }, { smi: 'Br' }] }, caption: t('Rezultatas: bromobenzenas ir $HBr$.', 'Result: bromobenzene and $HBr$.') },
        {
          resonance: [{ smi: 'BrC1[CH+]C=CC=C1' }, { smi: 'BrC1C=C[CH+]C=C1' }, { smi: 'BrC1C=CC=C[CH+]1' }],
          caption: t('Arenio jono rezonansinės formulės: teigiamas krūvis dalijamas tarp trijų atomų (dviejų gretimų sp³ atomui ir priešingo jam).', 'Resonance structures of the arenium ion: the positive charge is shared by three carbons (the two next to the sp³ carbon and the one opposite it).'),
          src: 'L9 p11'
        },
        {
          rule: t('Lėtoji II stadija lemia visos reakcijos greitį. Stabilesnis arenio jonas reiškia greitesnę ir lengvesnę SEAr reakciją.',
            'The slow stage II sets the rate of the whole reaction. The more stable the arenium ion, the faster and easier the SEAr reaction.'),
          src: 'L9 p9'
        },
        {
          pitfall: t('Arenio jonas nėra aromatinis, todėl jis nelieka žiede: jis aromatiškumą atgauna netekdamas $H+$, o ne prijungdamas nukleofilą. Prijungimas duotų nearomatinį produktą, todėl nevyksta.',
            'The arenium ion is not aromatic and does not stay: it regains aromaticity by losing $H+$, not by adding a nucleophile. Addition would give a non-aromatic product, so it does not happen.')
        },
        { practice: 'u09.mech' }
      ]
    },
    /* ------------------------------------------------------------ 3 */
    {
      id: 'reag',
      title: t('Halogeninimas, nitrinimas, sulfoninimas', 'Halogenation, nitration, sulfonation'),
      blocks: [
        { h: t('Trys reakcijos – viena schema', 'Three reactions, one pattern') },
        {
          p: t('Visos šios reakcijos eina tuo pačiu mechanizmu, skiriasi tik elektrofilas. Jį sukuria reagentas, o dažnai ir rūgštis ar katalizatorius.',
            'All of these reactions follow the same mechanism; only the electrophile differs. A reagent makes it, often together with an acid or a catalyst.'),
          src: 'L9 p12'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { plus: true }, { smi: 'BrBr' }, { arrow: '→', above: f('FeBr3') }, { smi: 'Brc1ccccc1' }, { plus: true }, { smi: 'Br' }] },
          caption: t('Halogeninimas: $Br2$ + $FeBr3$ duoda $Br+$; su chloru – $Cl2$ ir $FeCl3$.', 'Halogenation: $Br2$ + $FeBr3$ gives $Br+$; for chlorine use $Cl2$ and $FeCl3$.'), src: 'L9 p13'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { plus: true }, { smi: 'O[N+](=O)[O-]' }, { arrow: '→', above: f('H2SO4') }, { smi: '[O-][N+](=O)c1ccccc1' }, { plus: true }, { smi: 'O' }] },
          caption: t('Nitrinimas: $HNO3$ su $H2SO4$ sudaro nitronio joną $NO2+$.', 'Nitration: $HNO3$ with $H2SO4$ forms the nitronium ion $NO2+$.'), src: 'L9 p14'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { plus: true }, { smi: 'OS(=O)(=O)O' }, { arrow: '⇌', above: f('t°') }, { smi: 'OS(=O)(=O)c1ccccc1' }, { plus: true }, { smi: 'O' }] },
          caption: t('Sulfoninimas yra grįžtamasis: elektrofilas – $SO3H+$ (iš $SO3$ arba $H2SO4$).', 'Sulfonation is reversible: the electrophile is $SO3H+$ (from $SO3$ or $H2SO4$).'), src: 'L9 p15'
        },
        {
          mol: [
            { smi: '[Br+]', caption: t('$Br+$ (iš $Br2$ + $FeBr3$)', '$Br+$ (from $Br2$ + $FeBr3$)') },
            { smi: 'O=[N+]=O', caption: t('nitronio jonas $NO2+$', 'nitronium ion $NO2+$') },
            { smi: 'O[S+](=O)=O', caption: t('$SO3H+$', '$SO3H+$') }
          ],
          caption: t('Elektrofilai.', 'The electrophiles.'), src: 'L9 p12–15'
        },
        {
          p: t('Nitrogrupė paprastai redukuojama į aminogrupę: taip iš nitroarenų gaunami aromatiniai aminai (anilinai), kurių reikia dažams ir vaistams.',
            'A nitro group is easily reduced to an amino group: this is how aromatic amines (anilines) for dyes and drugs are made from nitroarenes.'),
          src: 'L9 p14'
        },
        { scheme: { items: [{ smi: '[O-][N+](=O)c1ccccc1' }, { arrow: '→', above: f('1. Fe, H3O+'), below: f('2. HO−') }, { smi: 'Nc1ccccc1' }] }, src: 'L9 p14' },
        {
          p: t('Kondensuotieji arenai mažiau stabilūs, todėl reaguoja švelnesnėmis sąlygomis. Naftalenas nitrinamas į α padėtį: susidaro 1-nitronaftalenas. Laboratorijoje jis pirmiausia matomas kaip oranžinis aliejinis sluoksnelis, o praskiedus vandeniu sukietėja į geltonas nuosėdas.',
            'Fused arenes are less stable and react under milder conditions. Naphthalene is nitrated in the α position to give 1-nitronaphthalene. In the lab it first shows as an orange oily layer and turns into a yellow solid when diluted with water.'),
          src: 'T p66, LW6 p1'
        },
        { scheme: { items: [{ smi: 'c1ccc2ccccc2c1' }, { arrow: '→', above: f('HNO3') }, { smi: '[O-][N+](=O)c1cccc2ccccc12', name: t('1-nitronaftalenas', '1-nitronaphthalene') }] } },
        {
          pitfall: t('Aktyvi dalelė yra ne reagentas, o jo darinys: $HNO3$ pats nenitrina, nitrina nitronio jonas, kurį sukuria $H2SO4$. Be $FeBr3$ benzenas su $Br2$ nereaguoja.',
            'The active particle is not the reagent itself but a derivative of it: $HNO3$ alone does not nitrate, the nitronium ion made by $H2SO4$ does. Without $FeBr3$ benzene does not react with $Br2$.')
        },
        {
          p: t('SEAr vyksta ir gyvuosiuose organizmuose: tiroksino sintezėje tirozino žiedas jodinamas, o fermentas peroksidazė sukuria elektrofilą $I+$. Vitamino K1 sintezėje elektrofilas yra alilo tipo katijonas, alkilinantis naftaleno darinį.',
            'SEAr also happens in living organisms: in thyroxine synthesis the ring of tyrosine is iodinated and the enzyme peroxidase makes the electrophile $I+$. In vitamin K1 synthesis the electrophile is an allyl-type cation that alkylates a naphthalene derivative.'),
          src: 'L9 p18–20'
        },
        { practice: 'u09.sear' }
      ]
    },
    /* ------------------------------------------------------------ 4 */
    {
      id: 'fc',
      title: t('Friedelio ir Krafto reakcijos', 'Friedel–Crafts reactions'),
      blocks: [
        { h: t('Alkilinimas ir acilinimas', 'Alkylation and acylation') },
        {
          p: t('Šios reakcijos įveda į žiedą anglies grandinę. Abiem atvejais reikia Liuiso rūgšties $AlCl3$: ji ištraukia chloridą iš reagento, ir susidaro elektrofilas.',
            'These reactions attach a carbon chain to the ring. Both need the Lewis acid $AlCl3$: it pulls chloride out of the reagent and the electrophile forms.'),
          src: 'L9 p16–17'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { plus: true }, { smi: 'CCl' }, { arrow: '→', above: f('AlCl3') }, { smi: 'Cc1ccccc1' }, { plus: true }, { smi: 'Cl' }] },
          caption: t('Alkilinimas: elektrofilas – $R+$.', 'Alkylation: the electrophile is $R+$.'), src: 'L9 p16'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→', above: f('1. AlCl3'), below: f('2. H2O') }, { smi: 'CC(=O)c1ccccc1' }, { plus: true }, { smi: 'Cl' }] },
          caption: t('Acilinimas: elektrofilas – acilio jonas.', 'Acylation: the electrophile is the acylium ion.'), src: 'L9 p17'
        },
        { resonance: [{ smi: 'CC#[O+]' }, { smi: 'C[C+]=O' }], caption: t('Acilio jonas $R-C=O+$: du rezonansiniai pavidalai.', 'The acylium ion $R-C=O+$: two resonance structures.'), src: 'L9 p17' },
        {
          list: [
            t('Jei žiedą stipriai deaktyvuoja elektronus traukiantis pakaitas (pvz., $NO2$) arba jame yra aminogrupė, reakcijos nėra.', 'The reaction fails when the ring carries a strong electron-withdrawing group (for example $NO2$) or an amino group.'),
            t('Alkilinant dažnai gaunami polialkilinti produktai, nes alkilgrupė aktyvuoja žiedą. Acilinant to nėra: acilgrupė žiedą deaktyvuoja.', 'Alkylation often gives polyalkylated products because an alkyl group activates the ring. Acylation does not: an acyl group deactivates the ring.'),
            t('Su ilgesnės grandinės halogenalkanais grandinė persigrupuoja, todėl susidaro ir šakotesnių produktų.', 'With longer alkyl halides the chain rearranges, so more branched products form as well.')
          ],
          src: 'L9 p16'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1', opts: { circle: true } }, { plus: true }, { smi: 'CCCCCl' }, { arrow: '→', above: f('AlCl3') }, { smi: 'CCC(C)c1ccccc1' }, { plus: true }, { smi: 'CCCCc1ccccc1' }] },
          caption: t('Pirminis katijonas persigrupuoja į stabilesnį antrinį, todėl gaunamas ir šakotas produktas.', 'The primary cation rearranges to the more stable secondary one, so a branched product forms too.'), src: 'L9 p16'
        },
        {
          scheme: { items: [{ smi: 'Cc1ccccc1' }, { arrow: '→', above: f('CH3COCl, AlCl3') }, { smi: 'CC(=O)c1ccccc1C' }, { plus: true }, { smi: 'CC(=O)c1ccc(C)cc1' }] },
          caption: t('Toluenas acilinamas į o- ir p- padėtis (toliau žr. kreipiamąjį pakaitų poveikį).', 'Toluene is acylated at the o and p positions (see the directing effects below).'), src: 'L9 p35'
        },
        {
          rule: t('Friedelio–Krafto reakcijos: alkilinimas ($RCl$, $AlCl3$) ir acilinimas ($RCOCl$, $AlCl3$, paskui $H2O$). Jos nevyksta su stipriais akceptoriniais pakaitais ir aminogrupe; alkilinant galimas polialkilinimas ir persigrupavimas.',
            'Friedel–Crafts reactions: alkylation ($RCl$, $AlCl3$) and acylation ($RCOCl$, $AlCl3$, then $H2O$). They fail with strong electron-withdrawing groups and with amino groups; alkylation can give polyalkylation and rearrangement.'),
          src: 'L9 p16'
        },
        {
          pitfall: t('Iš benzeno ir 1-chlorpropano nepasigaminsite propilbenzeno: pirminis katijonas persigrupuos, ir daugiausia susidarys izopropilbenzenas. Norint gauti nešakotą grandinę, tinka acilinimas, nes acilio jonas nepersigrupuoja.',
            'Benzene and 1-chloropropane do not give propylbenzene: the primary cation rearranges and isopropylbenzene is the main product. For an unbranched chain use acylation, because the acylium ion does not rearrange.'),
          src: 'L9 p16'
        },
        {
          example: {
            q: [{ p: t('Kas susidaro benzenkarboksirūgštį veikiant $CH3Cl$ ir $AlCl3$?', 'What forms when benzoic acid is treated with $CH3Cl$ and $AlCl3$?') }, { mol: { smi: 'OC(=O)c1ccccc1', name: t('benzenkarboksirūgštis', 'benzoic acid') } }],
            steps: [
              [{ p: t('Žiede yra karboksigrupė – stiprus elektronų akceptorius.', 'The ring carries a carboxyl group, a strong electron-withdrawing substituent.') }],
              [{ p: t('Alkilinimas nevyksta, nes žiedas pernelyg deaktyvuotas.', 'Alkylation does not take place because the ring is too deactivated.') }],
              [{ p: t('Atsakymas: reakcijos nėra; benzenkarboksirūgštis lieka nepakitusi.', 'Answer: no reaction; the benzoic acid is left unchanged.') }]
            ]
          },
          claims: [{ name: ['OC(=O)c1ccccc1', t('benzenkarboksirūgštis', 'benzoic acid')] }]
        },
        { practice: 'u09.fc' }
      ]
    },
    /* ------------------------------------------------------------ 5 */
    {
      id: 'dir',
      title: t('Pakaitų kreipiamasis poveikis', 'Directing effects of substituents'),
      blocks: [
        { h: t('Orientantai ir aktyvumas', 'Orienting groups and reactivity') },
        {
          p: t('Kai žiede jau yra pakaitas, jis lemia ir kitos grupės vietą, ir reakcijos greitį. Pagal vietą pakaitai skirstomi į dvi grupes.',
            'When a substituent is already on the ring, it decides where the next group goes and how fast the reaction runs. By position, substituents fall into two groups.')
        },
        {
          list: [
            t('**Pirmos eilės** pakaitai verčia naują grupę užimti orto (2) arba para (4) padėtį; paprastai tai elektronų donorai (ED).', '**First-order groups** direct the next group to positions 2 (ortho) and 4 (para). Most of them are electron donors (ED).'),
            t('**Antros eilės** pakaitai verčia ją užimti meta (3) padėtį; tai elektronų akceptoriai (EA).', '**Second-order groups** direct the next group to position 3 (meta). They are electron acceptors (EA).')
          ],
          src: 'L9 p24, p26'
        },
        {
          table: {
            head: [t('Pakaitai', 'Substituents'), t('Poveikis reakcijai', 'Effect on the reaction'), t('Orientacija', 'Orientation')],
            rows: [
              [t('$NH2$, $NHR$, $NR2$, $OH$, $O-$', '$NH2$, $NHR$, $NR2$, $OH$, $O-$'), t('stiprūs aktyvuojantys', 'strongly activating'), t('o-, p-', 'o, p')],
              [t('$OR$, $NHCOR$, $OCOR$', '$OR$, $NHCOR$, $OCOR$'), t('vidutiniai aktyvuojantys', 'moderately activating'), t('o-, p-', 'o, p')],
              [t('alkilai: $CH3$, $C2H5$', 'alkyl: $CH3$, $C2H5$'), t('silpnai aktyvuojantys', 'weakly activating'), t('o-, p-', 'o, p')],
              [t('$F$, $Cl$, $Br$, $I$', '$F$, $Cl$, $Br$, $I$'), t('silpnai deaktyvuojantys', 'weakly deactivating'), t('o-, p-', 'o, p')],
              [t('$CHO$, $COR$, $COOH$, $COOR$, $CONH2$, $SO3H$, $CN$', '$CHO$, $COR$, $COOH$, $COOR$, $CONH2$, $SO3H$, $CN$'), t('vidutiniai deaktyvuojantys', 'moderately deactivating'), t('m-', 'm')],
              [t('$NO2$, $NR3+$, $CX3$ (X = halogenas)', '$NO2$, $NR3+$, $CX3$ (X = halogen)'), t('stiprūs deaktyvuojantys', 'strongly deactivating'), t('m-', 'm')]
            ]
          },
          caption: t('Aktyvuojantys ir deaktyvuojantys pakaitai.', 'Activating and deactivating substituents.'), src: 'L9 p28'
        },
        {
          p: t('Elektronų donoras didina elektronų tankį žiede (ypač o- ir p- padėtyse), todėl žiedas aktyvesnis. Akceptorius elektronų tankį mažina, todėl žiedas deaktyvuojamas, o santykinai daugiausia elektronų lieka m- padėtyse.',
            'An electron donor raises the electron density in the ring (above all at the o and p positions), so the ring is more reactive. An acceptor lowers it, so the ring is deactivated and relatively the most electron density remains at the m positions.'),
          src: 'L9 p30'
        },
        {
          mol: [
            { smi: 'Cc1ccccc1', opts: { deltas: { 2: '-', 4: '-', 6: '-' } }, caption: t('toluenas: ED, o-/p- padėtys δ−', 'toluene: ED, o/p positions δ−') },
            { smi: '[O-][N+](=O)c1ccccc1', opts: { deltas: { 4: '+', 6: '+', 8: '+' } }, caption: t('nitrobenzenas: EA, o-/p- padėtys δ+', 'nitrobenzene: EA, o/p positions δ+') }
          ],
          src: 'L9 p30'
        },
        {
          table: {
            head: [t('Nitrinimas', 'Nitration'), t('orto', 'ortho'), t('meta', 'meta'), t('para', 'para')],
            rows: [
              [t('toluenas', 'toluene'), t('63 %', '63 %'), t('3 %', '3 %'), t('34 %', '34 %')],
              [t('trifluormetilbenzenas', '(trifluoromethyl)benzene'), t('6 %', '6 %'), t('91 %', '91 %'), t('3 %', '3 %')]
            ]
          },
          caption: t('Išskirti izomerai: ED pakaitas duoda o-/p-, EA – daugiausia m- produkto.', 'Isomers obtained: the donor gives o/p, the acceptor mostly the m product.'), src: 'L9 p23'
        },
        {
          pitfall: t('Halogenai yra išimtis: jie turi laisvųjų porų (+M), bet jų –I efektas stipresnis, todėl jie žiedą deaktyvuoja ir vis tiek kreipia į o- ir p- padėtis. Nepainiokite „deaktyvuoja“ su „kreipia į meta“.',
            'Halogens are the exception: they have lone pairs (+M), but their −I effect is stronger, so they deactivate the ring and still direct to o and p. Do not confuse “deactivates” with “directs meta”.'),
          src: 'L9 p25'
        },
        { h: t('Keli pakaitai', 'Several substituents') },
        {
          rule: t('Kai žiede keli pakaitai, žiūrima į kiekvieno kreipimą. Jei jie kreipia į tas pačias padėtis, nauja grupė patenka ten. Jei ne, lemia stipresnis elektronų donoras. Padėtis tarp dviejų pakaitų dėl kliūčių nepasirenkama.',
            'With several substituents, look at the direction of each. If they point to the same positions, the new group goes there. If not, the stronger electron donor decides. The position between two substituents is avoided for steric reasons.'),
          src: 'L9 p34'
        },
        {
          scheme: { items: [{ smi: 'Cc1ccc(cc1)[N+](=O)[O-]' }, { arrow: '→', above: f('Br2, FeBr3') }, { smi: 'Cc1ccc(cc1Br)[N+](=O)[O-]' }] },
          caption: t('$CH3$ ir $NO2$ kreipia į tas pačias padėtis (šalia $CH3$).', '$CH3$ and $NO2$ direct to the same positions (next to $CH3$).'), src: 'L9 p34'
        },
        {
          scheme: { items: [{ smi: 'Oc1ccc(C)cc1' }, { arrow: '→', above: f('HNO3, H2SO4') }, { smi: 'Oc1ccc(C)cc1[N+](=O)[O-]' }] },
          caption: t('Stipresnis donoras $OH$ nukreipia nitro grupę į savo orto padėtį.', 'The stronger donor $OH$ sends the nitro group to its own ortho position.'), src: 'L9 p34'
        },
        {
          example: {
            q: [{ p: t('Kur patenka bromas, brominant 1-metoksi-4-nitrobenzeną?', 'Where does bromine go when 1-methoxy-4-nitrobenzene is brominated?') }, { mol: { smi: 'COc1ccc(cc1)[N+](=O)[O-]', name: t('1-metoksi-4-nitrobenzenas', '1-methoxy-4-nitrobenzene') } }],
            steps: [
              [{ p: t('$OCH3$ – stiprus elektronų donoras, o-/p- orientantas; $NO2$ – akceptorius, m- orientantas.', '$OCH3$ is a strong electron donor and an o/p director; $NO2$ is an acceptor and a meta director.') }],
              [{ p: t('Para padėtis jau užimta, todėl $OCH3$ kreipia į savo o- padėtis, o $NO2$ – į padėtis, esančias jo m- atžvilgiu. Tai tos pačios padėtys.', 'The para position is already taken, so $OCH3$ points to its ortho positions, and $NO2$ points to the positions meta to it. These are the same positions.') }],
              [{ p: t('Kreipimas suderintas: bromas patenka šalia $OCH3$ grupės.', 'The directions agree: bromine enters next to the $OCH3$ group.') }, { mol: { smi: 'COc1ccc(cc1Br)[N+](=O)[O-]', name: t('2-brom-1-metoksi-4-nitrobenzenas', '2-bromo-1-methoxy-4-nitrobenzene') } }]
            ]
          },
          claims: [{ react: ['sear', ['COc1ccc(cc1)[N+](=O)[O-]'], { E: 'Br' }, 'COc1ccc(cc1Br)[N+](=O)[O-]'] }]
        },
        { practice: 'u09.pos' },
        { practice: 'u09.rate' }
      ]
    },
    /* ------------------------------------------------------------ 6 */
    {
      id: 'sigma',
      title: t('Kodėl pakaitai kreipia: arenio jono rezonansas', 'Why substituents direct: resonance of the arenium ion'),
      blocks: [
        { h: t('Stabilumas lemia kryptį', 'Stability decides the direction') },
        {
          p: t('Elektrofilas gali pulti o-, m- ar p- padėtį. Kiekvienu atveju susidaro skirtingas arenio jonas, ir greičiausiai vyksta ta ataka, kurios jonas stabiliausias. Jo stabilumą rodo rezonansinės formulės: kuo labiau krūvis delokalizuotas, tuo jonas stabilesnis.',
            'The electrophile can attack the o, m or p position. Each attack gives a different arenium ion, and the fastest attack is the one with the most stable ion. Its stability shows in its resonance structures: the more the charge is delocalised, the more stable the ion.'),
          src: 'L9 p29–33'
        },
        {
          p: t('Atakuojant o- ar p- padėtį, teigiamas krūvis būna ir ant atomo su pakaitu. Atakuojant m- padėtį jis ten niekada neatsiduria.',
            'In o or p attack the positive charge also sits on the carbon that carries the substituent. In m attack it never does.'),
          src: 'L9 p31–33'
        },
        {
          resonance: [{ smi: arenium('OMe', 3, 2, BR).smi }, { smi: '[C+]1(OC)C=CC(Br)C=C1' }, { smi: arenium('OMe', 3, 4, BR).smi }, { smi: 'C[O+]=C1C=CC(Br)C=C1' }],
          caption: t('$OCH3$ ir ataka į para padėtį: ketvirtoji formulė (oksonio jonas) turi oktetus visiems atomams ir yra labai stabili.', '$OCH3$ and attack at the para position: the fourth structure (oxonium ion) has octets on all atoms and is very stable.'), src: 'L9 p31'
        },
        {
          resonance: [{ smi: 'C1(OC)[CH+]C(Br)C=CC=1' }, { smi: arenium('OMe', 2, 3, BR).smi }, { smi: 'C1(OC)=CC(Br)C=C[CH+]1' }],
          caption: t('$OCH3$ ir ataka į meta padėtį: teigiamas krūvis neatsiduria ant C–$OCH3$, papildomos formulės nėra.', '$OCH3$ and attack at the meta position: the charge never reaches C–$OCH3$, so there is no extra structure.'), src: 'L9 p31'
        },
        {
          resonance: [{ smi: arenium('NO2', 3, 2, BR).smi }, { smi: '[C+]1([N+](=O)[O-])C=CC(Br)C=C1' }, { smi: arenium('NO2', 3, 4, BR).smi }],
          caption: t('$NO2$ ir ataka į para padėtį: viena formulė turi $+$ ant atomo, sujungto su teigiamu azotu, – ji labai nepalanki.', '$NO2$ and attack at the para position: one structure has $+$ on the carbon bonded to the positive nitrogen, which is very unfavourable.'), src: 'L9 p33'
        },
        {
          list: [
            t('ED pakaitas (ypač su laisvąja pora) stabilizuoja arenio joną o-/p- atakos atveju: reakcija greitesnė už benzeno, produktai o- ir p-.', 'A donor (above all one with a lone pair) stabilises the arenium ion in o/p attack: the reaction is faster than for benzene and the products are o and p.'),
            t('Metilas: viena o-/p- formulė yra tretinis karbokatijonas, todėl jonas stabilesnis.', 'Methyl: one o/p structure is a tertiary carbocation, so the ion is more stable.'),
            t('EA pakaitas o-/p- atakoje duoda labai nepalankią formulę, todėl lieka m- ataka: ji lėtesnė už benzeno, bet mažiau nepalanki už o-/p-.', 'An acceptor gives a very unfavourable structure in o/p attack, so m attack remains: it is slower than for benzene but less unfavourable than o/p.')
          ],
          src: 'L9 p24, p26, p32'
        },
        {
          pitfall: t('Akceptorius nepadaro m- atakos palankios, jis tik labiau pablogina o- ir p- ataką. Todėl su deaktyvuotu žiedu m- produktas susidaro lėčiau nei benzeno reakcijoje.',
            'An acceptor does not make m attack favourable; it only makes o and p attack worse. That is why the m product forms more slowly than in the reaction of benzene.')
        },
        { practice: 'u09.sigma' }
      ]
    },
    /* ------------------------------------------------------------ 7 */
    {
      id: 'side',
      title: t('Šoninės grandinės reakcijos', 'Side-chain reactions'),
      blocks: [
        { h: t('Žiedas ar grandinė: sprendžia sąlygos', 'Ring or chain: the conditions decide') },
        {
          p: t('Alkilarenuose gali reaguoti ir žiedas, ir šoninė grandinė. Su $Br2$ ir $FeBr3$ pakeičiamas žiedo vandenilis (SEAr), o su $Br2$ ir šviesa – šoninės grandinės vandenilis (SR).',
            'In alkylarenes both the ring and the side chain can react. With $Br2$ and $FeBr3$ a ring hydrogen is replaced (SEAr); with $Br2$ and light a hydrogen on the side chain is replaced (SR).'),
          src: 'L9 p21, p35'
        },
        {
          scheme: { items: [{ smi: 'Cc1ccccc1' }, { arrow: '→', above: f('Br2, hν') }, { smi: 'BrCc1ccccc1', name: t('(brommetil)benzenas', '(bromomethyl)benzene') }] },
          caption: t('Radikalinis brominimas pakeičia benzilinį vandenilį: benzilo radikalas stabiliausias.', 'Radical bromination replaces a benzylic hydrogen: the benzyl radical is the most stable.'), src: 'L9 p21'
        },
        {
          p: t('Šoninė alkilgrandinė oksiduojasi: nesvarbu, kokio ilgio ji būtų, benzilo anglies atomas virsta $COOH$ grupe, o likusi grandinės dalis atskyla ($CO2$, acto rūgštis). Žiedas lieka.',
            'The alkyl side chain is oxidised: whatever its length, the benzylic carbon becomes a $COOH$ group, and the rest of the chain is cleaved off ($CO2$, acetic acid). The ring stays.'),
          src: 'L9 p21, T p63'
        },
        {
          scheme: { items: [{ smi: 'Cc1ccccc1' }, { arrow: '→', above: f('KMnO4, H2O'), below: f('t°') }, { smi: 'OC(=O)c1ccccc1' }] },
          src: 'L9 p21'
        },
        {
          scheme: { items: [{ smi: 'CCCc1ccccc1' }, { arrow: '→', above: f('K2Cr2O7, H2SO4'), below: f('t°') }, { smi: 'OC(=O)c1ccccc1' }, { plus: true }, { smi: 'CC(=O)O' }] },
          src: 'L9 p21'
        },
        {
          rule: t('Šoninės grandinės oksidacijai reikia bent vieno benzilinio vandenilio ($Ar-CH$). Visa alkilgrandinė virsta viena $COOH$ grupe; $tret$-butilas neoksiduojasi.',
            'Oxidation of a side chain needs at least one benzylic hydrogen ($Ar-CH$). The whole alkyl chain becomes one $COOH$ group; a tert-butyl group is not oxidised.'),
          src: 'L9 p21, T p63'
        },
        {
          pitfall: t('Nepainiokite sąlygų: $Br2$/$FeBr3$ keičia žiedą, $Br2$/$hν$ – grandinę. $KMnO4$ benzeno žiedo neardo: oksiduojasi tik šoninė grandinė.',
            'Do not mix up the conditions: $Br2$/$FeBr3$ changes the ring, $Br2$/$hν$ the chain. $KMnO4$ does not break the benzene ring: only the side chain is oxidised.')
        },
        {
          example: {
            q: [{ p: t('Kas susidaro etilbenzenui reaguojant su $Br2$ šviesoje ir su karštu $KMnO4$?', 'What forms from ethylbenzene with $Br2$ in light and with hot $KMnO4$?') }, { mol: { smi: 'CCc1ccccc1', name: t('etilbenzenas', 'ethylbenzene') } }],
            steps: [
              [{ p: t('$Br2$ šviesoje – radikalinis brominimas. Reaguoja grandinės atomas, sujungtas su žiedu (benzilinis), nes jo radikalas stabiliausias.', '$Br2$ in light is radical bromination. The chain carbon bonded to the ring (benzylic) reacts, because its radical is the most stable.') }, { mol: { smi: 'CC(Br)c1ccccc1', name: t('(1-brometil)benzenas', '(1-bromoethyl)benzene') } }],
              [{ p: t('$KMnO4$: grandinė virsta $COOH$, antrasis C atomas išsiskiria kaip $CO2$.', '$KMnO4$: the chain becomes $COOH$ and the second carbon is released as $CO2$.') }, { mol: { smi: 'OC(=O)c1ccccc1', name: t('benzenkarboksirūgštis', 'benzoic acid') } }]
            ]
          },
          claims: [{ react: ['side.br', ['CCc1ccccc1'], null, 'CC(Br)c1ccccc1'] }, { react: ['side.ox', ['CCc1ccccc1'], null, 'OC(=O)c1ccccc1'] }]
        },
        { practice: 'u09.side' },
        { practice: 'u09.reagent' }
      ]
    },
    /* ------------------------------------------------------------ 8 */
    {
      id: 'plan',
      title: t('Sintezių planavimas', 'Planning syntheses'),
      blocks: [
        { h: t('Tvarka lemia produktą', 'The order decides the product') },
        {
          p: t('Kiekviena įvesta grupė kreipia kitą, todėl reakcijų tvarka svarbi. Jei reikia m-izomero, pirma įvedamas akceptorius; jei o-/p-, pirma donoras arba halogenas. Tada o- ir p- izomerai atskiriami.',
            'Every group you add directs the next one, so the order matters. If you need the m isomer, introduce the acceptor first; for o/p, a donor or halogen first. The o and p isomers are then separated.'),
          src: 'L9 p34, p36'
        },
        {
          scheme: { items: [{ smi: 'Cc1ccccc1' }, { arrow: '→', above: f('HNO3, H2SO4') }, { smi: 'Cc1ccc(cc1)[N+](=O)[O-]' }, { arrow: '→', above: f('KMnO4, t°') }, { smi: 'OC(=O)c1ccc(cc1)[N+](=O)[O-]' }] },
          caption: t('Pirma nitrinama, paskui oksiduojama: 4-nitrobenzenkarboksirūgštis.', 'Nitrate first, then oxidise: 4-nitrobenzoic acid.'), src: 'L9 p36'
        },
        {
          scheme: { items: [{ smi: 'Cc1ccccc1' }, { arrow: '→', above: f('KMnO4, t°') }, { smi: 'OC(=O)c1ccccc1' }, { arrow: '→', above: f('HNO3, H2SO4') }, { smi: 'OC(=O)c1cccc(c1)[N+](=O)[O-]' }] },
          caption: t('Atvirkštinė tvarka duoda 3-nitrobenzenkarboksirūgštį.', 'The reverse order gives 3-nitrobenzoic acid.'), src: 'L9 p36'
        },
        {
          p: t('Esant stiprių akceptorių, halogeną žiede gali pakeisti ir nukleofilas. Taip Sangerio reagentas (1-fluor-2,4-dinitrobenzenas) pažymi N-galinę amino rūgštį nustatant baltymo seką.',
            'With strong acceptors on the ring, a halogen can also be replaced by a nucleophile. This is how Sanger’s reagent (1-fluoro-2,4-dinitrobenzene) labels the N-terminal amino acid when a protein sequence is determined.'),
          src: 'L9 p22'
        },
        {
          scheme: { items: [{ smi: 'Clc1c(cc(cc1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]' }, { arrow: '→', above: f('1. HO−'), below: f('2. H3O+') }, { smi: 'Oc1c(cc(cc1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]' }, { plus: true }, { smi: '[Cl-]' }] },
          caption: t('Halogenarenų nukleofilinis pakeitimas.', 'Nucleophilic substitution of a haloarene.'), src: 'L9 p22'
        },
        {
          pitfall: t('Neplanuokite Friedelio–Krafto reakcijos po stiprios EA grupės įvedimo: žiedas deaktyvuotas. Taip pat 3-bromtolueno tiesiogiai iš tolueno nepagaminsite: bromas patenka tik į o- ir p- padėtis, todėl reikia kitos grupių tvarkos.',
            'Do not plan a Friedel–Crafts reaction after a strong EA group is on the ring: the ring is deactivated. Likewise, 3-bromotoluene cannot be made by brominating toluene directly: bromine goes only to the o and p positions, so the groups have to come in another order.')
        },
        {
          example: {
            q: [{ p: t('Kaip iš benzeno gauti 3-brombenzenaminą?', 'How can 3-bromoaniline be made from benzene?') }, { mol: { smi: 'Nc1cccc(Br)c1', name: t('3-brombenzenaminas', '3-bromobenzenamine') } }],
            steps: [
              [{ p: t('Bromas ir aminogrupė yra m- vienas kito atžvilgiu. Aminogrupė (donoras) nukreiptų į o-/p-, todėl ją reikia įvesti paskutinę, iš $NO2$.', 'Bromine and the amino group are meta to each other. An amino group (donor) would direct o/p, so it must be introduced last, from $NO2$.') }],
              [{ p: t('1) $HNO3$/$H2SO4$: nitrobenzenas. 2) $Br2$/$FeBr3$: $NO2$ kreipia į m- padėtį.', '1) $HNO3$/$H2SO4$: nitrobenzene. 2) $Br2$/$FeBr3$: $NO2$ directs to the m position.') }, { mol: { smi: '[O-][N+](=O)c1cccc(Br)c1' } }],
              [{ p: t('3) $Fe$, $H3O+$, paskui $HO-$: nitrogrupė redukuojama į aminogrupę.', '3) $Fe$, $H3O+$, then $HO-$: the nitro group is reduced to an amino group.') }, { mol: { smi: 'Nc1cccc(Br)c1' } }]
            ]
          },
          claims: [{ react: ['sear', ['[O-][N+](=O)c1ccccc1'], { E: 'Br' }, '[O-][N+](=O)c1cccc(Br)c1'] }]
        },
        { practice: 'u09.synth' }
      ]
    },
    /* ------------------------------------------------------------ 9 */
    {
      id: 'korner',
      title: t('Kiornerio metodas ir aminai rūgštyje', 'Körner’s method and amines in acid'),
      blocks: [
        { h: t('Izomerų atpažinimas pagal mononitrinimą', 'Telling isomers apart by mononitration') },
        {
          p: t('Tris izomerinius dibrombenzenus (o-, m- ir p-) galima atskirti pagal tai, kiek skirtingų mononitrojunginių kiekvienas duoda. Tam reikia suskaičiuoti laisvas C–H padėtis, kurios nėra lygiavertės pagal simetriją. Šis būdas vadinamas Kiornerio metodu.',
            'The three isomeric dibromobenzenes (o, m and p) can be told apart by how many different mononitro products each gives. Count the free C–H positions that are not equivalent by symmetry. This is called Körner’s method.'),
          src: 'S4.21'
        },
        {
          table: {
            head: [t('Izomeras', 'Isomer'), t('Skirtingų laisvų padėčių', 'Different free positions'), t('Mononitro produktų', 'Mononitro products')],
            rows: [
              [{ smi: 'Brc1ccc(Br)cc1' }, t('visos keturios lygiavertės', 'all four equivalent'), t('1', '1')],
              [{ smi: 'Brc1ccccc1Br' }, t('dvi poros: 3 = 6 ir 4 = 5', 'two pairs: 3 = 6 and 4 = 5'), t('2', '2')],
              [{ smi: 'Brc1cccc(Br)c1' }, t('trys skirtingos: 2, 4 = 6 ir 5', 'three different: 2, 4 = 6 and 5'), t('3', '3')]
            ]
          },
          caption: t('Para – 1, orto – 2, meta – 3 produktai.', 'Para gives 1, ortho 2, meta 3 products.'), src: 'S4.21'
        },
        {
          rule: t('Kiornerio metodas: izomerą nusako skirtingų mononitro produktų skaičius: $p$ – 1, $o$ – 2, $m$ – 3. Reikia skaičiuoti visas simetriškai skirtingas padėtis, o ne tik pagrindinį produktą.',
            'Körner’s method: the number of different mononitro products identifies the isomer: p gives 1, o gives 2, m gives 3. Count every symmetry-distinct position, not just the main product.'),
          src: 'S4.21'
        },
        { h: t('Aminai rūgštinėje terpėje', 'Amines in acid') },
        {
          p: t('$N,N$-Dimetilanilinas yra stiprus donoras, todėl brominamas į o- ir p- padėtis. Nitrinimo mišinyje ($HNO3$, $H2SO4$) azoto laisvoji pora protonizuojama: susidariusi $-NH(CH3)2+$ grupė neturi laisvosios poros ir turi pilną teigiamą krūvį, taigi yra stiprus deaktyvuojantis m-orientantas, kaip $NR3+$.',
            '$N,N$-Dimethylaniline is a strong donor, so it is brominated at the o and p positions. In the nitrating mixture ($HNO3$, $H2SO4$) the nitrogen lone pair is protonated: the resulting $-NH(CH3)2+$ group has no lone pair and a full positive charge, so it is a strongly deactivating meta director, like $NR3+$.'),
          src: 'S4.22, L9 p28'
        },
        {
          scheme: { items: [{ smi: 'CN(C)c1ccccc1' }, { arrow: '→', above: f('Br2') }, { smi: 'CN(C)c1ccccc1Br' }, { plus: true }, { smi: 'CN(C)c1ccc(Br)cc1' }] },
          caption: t('Neutralus aminas: o-/p- orientantas.', 'The neutral amine: an o/p director.'), src: 'S4.22'
        },
        {
          scheme: { items: [{ smi: 'CN(C)c1ccccc1' }, { arrow: '⇌', above: f('H2SO4') }, { smi: 'C[NH+](C)c1ccccc1' }, { arrow: '→', above: f('HNO3') }, { smi: 'CN(C)c1cccc(c1)[N+](=O)[O-]' }] },
          caption: t('Protonuotas aminas: m-orientantas. Po reakcijos aminas atgauna protoną, gaunamas 3-nitro darinys.', 'The protonated amine: a meta director. After the reaction the amine loses the proton again; the 3-nitro derivative results.'), src: 'S4.22'
        },
        {
          pitfall: t('Žiūrėkite į terpę: ta pati aminogrupė rūgštyje ir neutralioje terpėje kreipia priešingai. Neutralioje – o-/p- (donoras su laisvąja pora), rūgščioje – m- (be laisvosios poros, teigiamas krūvis).',
            'Look at the medium: the same amino group directs oppositely in acid and in neutral conditions. Neutral: o/p (a donor with a lone pair); acidic: meta (no lone pair, positive charge).')
        },
        { practice: 'u09.korner' },
        { practice: 'u09.anil' }
      ]
    }
  ];

  /* ---------- summary ---------- */

  const summary = [
    { h: t('Santrauka: arenai ir SEAr', 'Summary: arenes and SEAr') },
    {
      table: {
        head: [t('Reakcija', 'Reaction'), t('Reagentai', 'Reagents'), t('Elektrofilas', 'Electrophile'), t('Produktas iš benzeno', 'Product from benzene')],
        rows: [
          [t('halogeninimas', 'halogenation'), t('$Br2$, $FeBr3$ ($Cl2$, $FeCl3$)', '$Br2$, $FeBr3$ ($Cl2$, $FeCl3$)'), t('$Br+$', '$Br+$'), { smi: 'Brc1ccccc1' }],
          [t('nitrinimas', 'nitration'), t('$HNO3$, $H2SO4$', '$HNO3$, $H2SO4$'), t('$NO2+$', '$NO2+$'), { smi: '[O-][N+](=O)c1ccccc1' }],
          [t('sulfoninimas (⇌)', 'sulfonation (⇌)'), t('$SO3$, $H2SO4$', '$SO3$, $H2SO4$'), t('$SO3H+$', '$SO3H+$'), { smi: 'OS(=O)(=O)c1ccccc1' }],
          [t('alkilinimas', 'alkylation'), t('$RCl$, $AlCl3$', '$RCl$, $AlCl3$'), t('$R+$', '$R+$'), { smi: 'Cc1ccccc1' }],
          [t('acilinimas', 'acylation'), t('$RCOCl$, $AlCl3$; $H2O$', '$RCOCl$, $AlCl3$; $H2O$'), t('$R-C=O+$', '$R-C=O+$'), { smi: 'CC(=O)c1ccccc1' }],
          [t('grandinės brominimas (SR)', 'chain bromination (SR)'), t('$Br2$, $hν$ (iš tolueno)', '$Br2$, $hν$ (from toluene)'), t('$Br•$', '$Br•$'), { smi: 'BrCc1ccccc1' }],
          [t('grandinės oksidacija', 'chain oxidation'), t('$KMnO4$, $H2O$, t° (iš tolueno)', '$KMnO4$, $H2O$, t° (from toluene)'), t('–', '–'), { smi: 'OC(=O)c1ccccc1' }]
        ]
      },
      src: 'L9 p12, p21, p35'
    },
    {
      list: [
        t('Aromatinis: ciklinis, plokščias, vientisa π sistema, $4n + 2$ π elektronų (2, 6, 10 ...).', 'Aromatic: cyclic, planar, one continuous π system, $4n + 2$ π electrons (2, 6, 10 ...).'),
        t('SEAr: I – $E+$ susidarymas; II (lėtoji) – arenio jonas (σ-kompleksas); III (greitoji) – $H+$ atskilimas.', 'SEAr: I – formation of $E+$; II (slow) – arenium ion (σ complex); III (fast) – loss of $H+$.'),
        t('Kuo stabilesnis arenio jonas, tuo greitesnė reakcija.', 'The more stable the arenium ion, the faster the reaction.'),
        t('o-/p-orientantai: $NH2$, $OH$, $OR$, $NHCOR$, alkilai (aktyvuoja); halogenai (deaktyvuoja). m-orientantai: $NO2$, $CN$, $SO3H$, $C=O$, $COOH$, $CX3$, $NR3+$ (deaktyvuoja).', 'o/p directors: $NH2$, $OH$, $OR$, $NHCOR$, alkyls (activate); halogens (deactivate). m directors: $NO2$, $CN$, $SO3H$, $C=O$, $COOH$, $CX3$, $NR3+$ (deactivate).'),
        t('Keli pakaitai: suderinta kryptis laimi; kitaip – stipresnis donoras; padėtis tarp pakaitų neprieinama.', 'Several substituents: agreeing directions win; otherwise the stronger donor; the position between two substituents is avoided.'),
        t('Friedelis–Kraftsas nevyksta su stipriais EA pakaitais ir $NH2$; alkilinimas – polialkilinimas, persigrupavimas; acilinimas – ne.', 'Friedel–Crafts fails with strong EA groups and $NH2$; alkylation – polyalkylation, rearrangement; acylation – neither.'),
        t('Šoninė grandinė: $Br2$/$hν$ – benzilinis $Br$; $KMnO4$ – $COOH$ (reikia benzilinio $H$).', 'Side chain: $Br2$/$hν$ – benzylic $Br$; $KMnO4$ – $COOH$ (needs a benzylic $H$).'),
        t('Kiornerio metodas: $p$ – 1, $o$ – 2, $m$ – 3 mononitro produktai.', 'Körner’s method: p gives 1, o gives 2, m gives 3 mononitro products.'),
        t('Aminas rūgštyje protonizuojamas: $-NHR2+$ yra m-orientantas; neutralus $-NR2$ – o-/p-.', 'An amine in acid is protonated: $-NHR2+$ is a meta director; the neutral $-NR2$ is o/p.')
      ]
    }
  ];

  /* ---------- helpers for the generators ---------- */

  const ENV = (ek) => ELE[ek].reag;
  const reagT = (reag) => f(reag);
  const kindName = (k) => (k === 'don' || k === 'alk' ? 0 : (k === 'hal' ? 1 : 2));
  const CLASS_OPTS = [
    { text: t('o-/p-orientantas, aktyvuoja žiedą', 'o/p director, activates the ring') },
    { text: t('o-/p-orientantas, deaktyvuoja žiedą', 'o/p director, deactivates the ring') },
    { text: t('m-orientantas, deaktyvuoja žiedą', 'meta director, deactivates the ring') },
    { text: t('m-orientantas, aktyvuoja žiedą', 'meta director, activates the ring') }
  ];
  const kindWhy = (zk) => t('Grupė $' + SUB[zk].f + '$ ' + KIND_WHY[SUB[zk].kind].lt + '.', 'The group $' + SUB[zk].f + '$ ' + KIND_WHY[SUB[zk].kind].en + '.');
  const posWord = { o: t('orto', 'ortho'), m: t('meta', 'meta'), p: t('para', 'para') };
  // ring distance 1 = ortho, 2 = meta, 3 = para
  const relPos = (i, j) => { const d = Math.abs(i - j); return ['', 'o', 'm', 'p'][Math.min(d, 6 - d)]; };
  const prodScheme = (sub, reag, prods) => {
    const items = [{ smi: sub }, { arrow: '→', above: f(reag) }];
    prods.forEach((s, i) => { if (i) items.push({ plus: true }); items.push({ smi: s }); });
    return { scheme: { items } };
  };

  /* ---------- exercise types ---------- */

  const types = [];

  // ---- u09.arom: aromatic or not (S4.17) ----
  const AR_TXT = {
    benz: t('Trys žiedo C=C duoda 6 π elektronus; pakaitas į žiedo π sistemą neįeina.', 'The three ring C=C give 6 π electrons; a substituent is not part of the ring π system.'),
    pyrid: t('Trys žiedo dvigubieji ryšiai duoda 6 π elektronus; azoto laisvoji pora guli žiedo plokštumoje ir neskaičiuojama.', 'The three ring double bonds give 6 π electrons; the nitrogen lone pair lies in the ring plane and is not counted.'),
    five: t('Dvi C=C (ar $C=N$) duoda 4 π elektronus, o heteroatomo laisvoji pora $p$ orbitalėje – dar 2: iš viso 6.', 'Two double bonds give 4 π electrons and the heteroatom lone pair in a $p$ orbital adds 2: 6 in total.'),
    naph: t('Penki dvigubieji ryšiai duoda 10 π elektronų ($4 · 2 + 2$).', 'Five double bonds give 10 π electrons ($4 · 2 + 2$).'),
    indole: t('Keturi dvigubieji ryšiai (8 π e−) ir azoto pora (2 e−): iš viso 10.', 'Four double bonds (8 π e−) and the nitrogen pair (2 e−): 10 in total.'),
    anion: t('Dvi C=C (4 e−) ir neigiamo C pora $p$ orbitalėje (2 e−): iš viso 6.', 'Two C=C (4 e−) and the lone pair of the negative carbon in a $p$ orbital (2 e−): 6 in total.'),
    trop: t('Trys C=C duoda 6 π elektronus, o tuščia $p$ orbitalė katijone elektronų neprideda: iš viso 6.', 'Three C=C give 6 π electrons, and the empty $p$ orbital of the cation adds none: 6 in total.'),
    prop: t('Viena C=C duoda 2 π elektronus, tuščia $p$ orbitalė – nė vieno: iš viso 2 ($n = 0$).', 'One C=C gives 2 π electrons and the empty $p$ orbital none: 2 in total ($n = 0$).'),
    anthr: t('Septyni dvigubieji ryšiai duoda 14 π elektronų ($4 · 3 + 2$).', 'Seven double bonds give 14 π electrons ($4 · 3 + 2$).')
  };
  const AROM = [
    ['c1ccccc1', 6, 'benz'], ['Cc1ccccc1', 6, 'benz'], ['Oc1ccccc1', 6, 'benz'], ['Nc1ccccc1', 6, 'benz'], ['CCc1ccccc1', 6, 'benz'],
    ['COc1ccccc1', 6, 'benz'], ['OC(=O)c1ccccc1', 6, 'benz'], ['[O-][N+](=O)c1ccccc1', 6, 'benz'], ['Clc1ccccc1', 6, 'benz'], ['C=Cc1ccccc1', 6, 'benz'],
    ['O=Cc1ccccc1', 6, 'benz'], ['c1ccc2ccccc2c1', 10, 'naph'], ['Cc1cccc2ccccc12', 10, 'naph'], ['Cc1ccc2ccccc2c1', 10, 'naph'], ['c1ccc2cc3ccccc3cc2c1', 14, 'anthr'],
    ['c1ccncc1', 6, 'pyrid'], ['Cc1cccnc1', 6, 'pyrid'], ['Cc1ccncc1', 6, 'pyrid'], ['c1cncnc1', 6, 'pyrid'],
    ['c1cc[nH]c1', 6, 'five'], ['Cn1cccc1', 6, 'five'], ['c1ccoc1', 6, 'five'], ['Cc1ccco1', 6, 'five'], ['c1ccsc1', 6, 'five'], ['Cc1cccs1', 6, 'five'],
    ['c1c[nH]cn1', 6, 'five'], ['c1cscn1', 6, 'five'], ['c1ccc2[nH]ccc2c1', 10, 'indole'], ['c1ccc2ncccc2c1', 10, 'naph'],
    ['[CH-]1C=CC=C1', 6, 'anion'], ['[CH+]1C=CC=CC=C1', 6, 'trop'], ['[CH+]1C=C1', 2, 'prop']
  ];
  const NON_AROM = [
    ['C1=CCCCC1', 'sp3'], ['CC1=CCCCC1', 'sp3'], ['C1=CC=CCC1', 'sp3'], ['C1C=CC=C1', 'sp3'], ['CC1C=CC=C1', 'sp3'],
    ['C1=CC=CCC=C1', 'sp3'], ['C1=CC=CC=CC=C1', 'cnt4'], ['[CH+]1C=CC=C1', 'cnt4'], ['[CH-]1C=CC=CC=C1', 'cnt4'], ['C1=CC=C1', 'cnt4'],
    ['C=CC=CC=C', 'acyc'], ['CC=CC=CC=CC', 'acyc'], ['C1CCC=CCC1', 'sp3']
  ];
  const AR_REASON = {
    sp3: t('Ciklą pertraukia $sp3$ atomas (arba ne visi ciklo atomai turi $p$ orbitales), todėl π sistema nėra vientisa.', 'An $sp3$ atom interrupts the ring (or not every ring atom has a $p$ orbital), so the π system is not continuous.'),
    cnt4: t('Ciklas vientisai konjuguotas, bet π elektronų yra $4n$ (4 arba 8), o ne $4n + 2$.', 'The ring is continuously conjugated, but it has $4n$ π electrons (4 or 8), not $4n + 2$.'),
    het: t('Žiede yra heteroatomas, o aromatinis junginys gali turėti tik anglies atomų.', 'The ring contains a heteroatom, and an aromatic compound may contain carbon atoms only.'),
    acyc: t('Konjuguota sistema yra ne ciklinė, o grandinė.', 'The conjugated system is an open chain, not a ring.')
  };
  types.push({
    id: 'u09.arom',
    title: t('Aromatinis ar ne? π elektronai', 'Aromatic or not? π electrons'),
    mirrors: ['S4.17'],
    gen(rng, ctx) {
      const all = AROM.map((x) => ({ smi: x[0], arom: true, pi: x[1], key: x[2] })).concat(NON_AROM.map((x) => ({ smi: x[0], arom: false, fail: x[1] })));
      const e = ctx.pick(all);
      const mol = ctx.chem.parse(e.smi);
      const isAr = ctx.chem.aromaticAtoms(mol).length > 0;
      if (isAr !== e.arom) throw new Error('u09.arom: the engine disagrees about ' + e.smi);
      const steps = [{
        prompt: t('Ar šis junginys aromatinis?', 'Is this compound aromatic?'),
        kind: 'choice', options: [{ text: t('Taip', 'Yes') }, { text: t('Ne', 'No') }], answer: e.arom ? 0 : 1,
        hint: t('Patikrinkite visas sąlygas iš eilės: ciklas, plokščias, visi ciklo atomai su $p$ orbitale, $4n + 2$ π elektronų.', 'Check the conditions one by one: ring, planar, every ring atom with a $p$ orbital, $4n + 2$ π electrons.'),
        solution: e.arom ? t('Taip: ciklas plokščias, vientisai konjuguotas ir turi $4n + 2$ π elektronų.', 'Yes: the ring is planar, continuously conjugated and has $4n + 2$ π electrons.')
          : t('Ne: bent viena aromatiškumo sąlyga netenkinama (žr. kitą žingsnį).', 'No: at least one condition for aromaticity is not met (see the next step).')
      }];
      if (e.arom) {
        steps.push({
          prompt: t('Bakstelėkite aromatinės sistemos atomus.', 'Tap the atoms of the aromatic system.'),
          kind: 'atoms', mol: { smi: e.smi, opts: { numbers: 'all' } }, from: 'aromatic',
          hint: t('Pakaitai ir kiti už žiedo esantys atomai į sistemą neįeina.', 'Substituents and other atoms outside the ring do not belong to the system.'),
          solution: t('Aromatinę sistemą sudaro tik žiedo atomai.', 'Only the ring atoms form the aromatic system.')
        });
        steps.push({
          prompt: t('Kiek π elektronų turi aromatinė sistema?', 'How many π electrons does the aromatic system have?'),
          kind: 'number', answer: { value: e.pi, tol: 0 },
          hint: t('Suskaičiuokite elektronus iš dvigubųjų ryšių ir iš laisvųjų porų, esančių $p$ orbitalėse.', 'Count the electrons from double bonds and from lone pairs sitting in $p$ orbitals.'),
          solution: AR_TXT[e.key]
        });
      } else {
        const keys = ['sp3', 'cnt4', 'acyc', 'het'];
        const wrong = keys.filter((k) => k !== e.fail);
        const opts = [{ text: AR_REASON[e.fail] }].concat(wrong.map((k) => ({ text: AR_REASON[k] })));
        steps.push({
          prompt: t('Kuri aromatiškumo sąlyga netenkinama?', 'Which condition for aromaticity fails?'),
          kind: 'choice', mol: { smi: e.smi }, options: opts, answer: 0,
          hint: t('Nubraižykite $p$ orbitales: ar jos sudaro vientisą žiedą ir kiek jose elektronų?', 'Draw the $p$ orbitals: do they form a continuous ring, and how many electrons are in them?'),
          solution: AR_REASON[e.fail]
        });
      }
      return {
        q: [{ mol: { smi: e.smi } }],
        steps,
        why: t('Aromatinis junginys turi būti ciklinis, plokščias, su vientisa konjuguota π sistema ir $4n + 2$ π elektronų (Hiukelio taisyklė). Pakaitai prie žiedo ir $sp3$ atomai sistemos nesudaro, o 4 ar 8 π elektronai aromatiškumo nesuteikia.',
          'An aromatic compound must be cyclic, planar, with one continuous conjugated π system and $4n + 2$ π electrons (Hückel’s rule). Substituents on the ring and $sp3$ atoms are not part of the system, and 4 or 8 π electrons do not give aromaticity.'),
        src: 'L9 p6–7'
      };
    }
  });

  // ---- u09.sear: products of SEAr on substituted benzenes (S4.8 a-d, S4.18) ----
  const SEAR_SUBS = ['Me', 'Et', 'iPr', 'tBu', 'OMe', 'OH', 'NHAc', 'F', 'Cl', 'Br', 'I', 'NO2', 'COOH', 'CN', 'CHO', 'COMe', 'COOMe', 'CF3', 'CCl3', 'SO3H', 'CONH2'];
  const SEAR_E = ['Cl', 'Br', 'NO2', 'SO3H', 'CH3', 'C(C)=O'];
  const NONE_OPT = { text: t('Reakcija nevyksta', 'No reaction') };

  // options for the product step: the engine products of one problem, majors first
  function productOptions(ctx, a, ek) {
    const majors = a.products.filter((p) => p.major);
    const minors = a.products.filter((p) => !p.major);
    const opts = majors.concat(minors).map((p) => ({ mol: { smi: p.smi } }));
    const rightIdx = majors.map((_, i) => i);
    if (ELE[ek].fc) opts.push(NONE_OPT);
    return { opts, rightIdx, majors };
  }
  const whyClass = {
    don: t('Elektronų donoras stabilizuoja arenio joną, kai $E+$ atakuoja o- ar p- padėtį, todėl žiedas aktyvesnis už benzeną ir susidaro o- ir p- produktai.', 'An electron donor stabilises the arenium ion when $E+$ attacks the o or p position, so the ring is more reactive than benzene and o and p products form.'),
    alk: t('Alkilgrupė silpnai stabilizuoja arenio joną o-/p- atakos atveju (+I, hiperkonjugacija), todėl žiedas šiek tiek aktyvesnis ir susidaro o- ir p- produktai.', 'An alkyl group weakly stabilises the arenium ion in o/p attack (+I, hyperconjugation), so the ring is slightly more reactive and o and p products form.'),
    hal: t('Halogenas turi laisvųjų porų, todėl nukreipia į o- ir p- padėtis, bet jo −I efektas didesnis, todėl žiedas deaktyvuotas.', 'A halogen has lone pairs, so it directs o and p, but its −I effect is stronger, so the ring is deactivated.'),
    acc: t('Akceptorius labiausiai destabilizuoja arenio joną o-/p- atakos atveju, todėl pagrindinis produktas yra m- izomeras, o žiedas deaktyvuotas.', 'An acceptor destabilises the arenium ion most in o/p attack, so the m isomer is the main product and the ring is deactivated.')
  };
  types.push({
    id: 'u09.sear',
    title: t('SEAr produktas: kur patenka nauja grupė?', 'SEAr product: where does the new group go?'),
    mirrors: ['S4.8', 'S4.18'],
    gen(rng, ctx) {
      let pick = null;
      for (let tries = 0; tries < 80 && !pick; tries++) {
        const zk = ctx.pick(SEAR_SUBS);
        const ek = ctx.pick(SEAR_E);
        const subs = subsOf([zk], [0]);
        const a = attack(ctx, subs, ek);
        if (!a) { if (ELE[ek].fc && SUB[zk].kind === 'acc') pick = { zk, ek, subs, none: true, smi: ringSmi(subs).smi }; continue; }
        const majors = a.products.filter((p) => p.major);
        if (majors.length < 1 || majors.length > 2) continue;
        const tie = majors.length === 2;
        // the course rule must agree with the engine: ED/halogen -> o/p, EA -> m
        const op = isOP(zk);
        if (op && !(tie || zk === 'tBu')) continue;
        if (!op && tie) continue;
        pick = { zk, ek, subs, a, tie, smi: a.smi };
      }
      if (!pick) throw new Error('u09.sear: no usable substrate');
      const { zk, ek, subs } = pick;
      const sub = SUB[zk];
      const steps = [{
        prompt: t('Kokio tipo pakaitas yra žiede?', 'What kind of substituent is on the ring?'),
        kind: 'choice', options: CLASS_OPTS, answer: kindName(sub.kind),
        hint: t('Pažiūrėkite į atomą, sujungtą su žiedu: ar jis turi laisvąją porą, ar dalinį teigiamą krūvį?', 'Look at the atom bonded to the ring: does it have a lone pair or a partial positive charge?'),
        solution: kindWhy(zk)
      }];
      const reag = ENV(ek);
      const head = prodScheme(pick.smi, reag, []);
      if (pick.none) {
        // the three isomers that a learner who forgot the limit would draw
        const isos = [1, 2, 3].map((p) => { const ee = [null, null, null, null, null, null]; ee[p] = ELE[ek].frag; return ringSmi(subs, ee).smi; });
        const options = isos.map((s) => ({ mol: { smi: s } })).concat([NONE_OPT]);
        steps.push({
          prompt: t('Koks yra produktas?', 'What is the product?'),
          kind: 'choice', options, answer: 3,
          hint: t('Friedelio–Krafto reakcijoms būtinas pakankamai reaktyvus žiedas. Ar tokį žiedą galima alkilinti ar acilinti?', 'Friedel–Crafts reactions need a sufficiently reactive ring. Can a ring like this be alkylated or acylated?'),
          solution: [{ p: t('Stiprus akceptorinis pakaitas deaktyvuoja žiedą, todėl Friedelio–Krafto reakcija nevyksta (L9 p16).', 'A strong electron-withdrawing group deactivates the ring, so the Friedel–Crafts reaction does not take place (L9 p16).') }]
        });
        return {
          q: [head],
          steps,
          why: t('Alkilinimas ir acilinimas reikalauja nesudeaktyvuoto žiedo. Karbonilo, nitro, ciano, sulfo ir trihalogenmetilo grupės žiedą sudeaktyvuoja, todėl $AlCl3$ ir $RCl$ ar $RCOCl$ jo nepakeičia.',
            'Alkylation and acylation need a ring that is not deactivated. Carbonyl, nitro, cyano, sulfo and trihalomethyl groups deactivate the ring, so $AlCl3$ with $RCl$ or $RCOCl$ does not substitute it.'),
          src: 'L9 p16'
        };
      }
      const a = pick.a;
      const { opts, rightIdx, majors } = productOptions(ctx, a, ek);
      const tie = pick.tie;
      steps.push({
        prompt: tie ? t('Pažymėkite pagrindinius produktus.', 'Pick the main products.') : t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: tie ? 'multi' : 'choice', options: opts, answer: tie ? rightIdx : 0,
        hint: ELE[ek].fc
          ? t('Visų junginių formulė ta pati, skiriasi tik naujos grupės vieta. Pirmiausia nuspręskite, ar tokį žiedą apskritai galima keisti.', 'All the compounds have the same formula; only the position of the new group differs. First decide whether such a ring can react at all.')
          : t('Visų junginių formulė ta pati, skiriasi tik naujos grupės vieta. Kur ją kreipia pakaitas?', 'All the compounds have the same formula; only the position of the new group differs. Where does the substituent send it?'),
        solution: [{ p: t('Pagrindinis produktas pagal SEAr ir pakaito orientaciją:', 'The main product by SEAr and the orientation of the substituent:') }, prodScheme(pick.smi, reag, majors.map((m) => m.smi))]
      });
      // a name step for the para product (o/p) or the only product
      const target = tie ? (a.products.find((p) => p.major && p.pos.some((x) => relPos(0, x) === 'p')) || majors[0]) : majors[0];
      const nm = nameT(ctx, target.smi);
      if (nm) {
        steps.push({
          prompt: tie ? t('Pavadinkite para izomerą.', 'Name the para isomer.') : t('Pavadinkite pagrindinį produktą.', 'Name the main product.'),
          kind: 'name', mol: { smi: target.smi }, answer: { smi: target.smi },
          hint: t('Sunumeruokite žiedą taip, kad pakaitai gautų mažiausius numerius, o pakaitus išvardykite abėcėlės tvarka.', 'Number the ring so that the substituents get the lowest numbers and list them alphabetically.'),
          solution: nm
        });
      }
      return {
        q: [head],
        steps,
        why: t(whyClass[sub.kind].lt + ' Reakcija: ' + ELE[ek].lt + ', mechanizmas SEAr.', whyClass[sub.kind].en + ' The reaction is ' + ELE[ek].en + ', mechanism SEAr.'),
        src: 'L9 p24–28'
      };
    }
  });

  // ---- u09.side: side chain or ring? (S4.8 e, f; S4.19) ----
  // anti = bromide on a non-benzylic carbon; chain = acid with only the end of the chain oxidised; mono = one of two chains oxidised
  const SIDE = [
    { s: 'Cc1ccccc1' },
    { s: 'CCc1ccccc1', anti: 'BrCCc1ccccc1', chain: 'OC(=O)Cc1ccccc1' },
    { s: 'CCCc1ccccc1', anti: 'BrCCCc1ccccc1', chain: 'OC(=O)CCc1ccccc1' },
    { s: 'CCCCc1ccccc1', anti: 'BrCCCCc1ccccc1', chain: 'OC(=O)CCCc1ccccc1' },
    { s: 'CC(C)c1ccccc1', anti: 'BrCC(C)c1ccccc1', chain: 'OC(=O)C(C)c1ccccc1' },
    { s: 'Cc1ccc(cc1)[N+](=O)[O-]' }, { s: 'Cc1ccc(Cl)cc1' }, { s: 'Cc1ccc(OC)cc1' }, { s: 'Cc1cccc(Cl)c1' },
    { s: 'Cc1ccc(C)cc1', mono: 'Cc1ccc(cc1)C(O)=O' }, { s: 'Cc1ccccc1C', mono: 'Cc1ccccc1C(O)=O' },
    { s: 'CCc1ccc(C)cc1', mono: 'Cc1ccc(cc1)C(O)=O' },
    { s: 'CC(C)(C)c1ccccc1' }, { s: 'CC(C)(C)c1ccc(C)cc1' }
  ];
  const SIDE_R = {
    SEAr: { lab: 'Br2, FeBr3' },
    SR: { lab: 'Br2, hν' },
    OX: { lab: 'KMnO4, H2O, t°' }
  };
  const SIDE_TYPE = [
    { text: t('SEAr: pakeičiamas žiedo vandenilis', 'SEAr: a ring hydrogen is replaced') },
    { text: t('SR: pakeičiamas šoninės grandinės (benzilinis) vandenilis', 'SR: a side-chain (benzylic) hydrogen is replaced') },
    { text: t('šoninės grandinės oksidacija iki $COOH$', 'oxidation of the side chain to $COOH$') },
    { text: t('reakcija nevyksta', 'no reaction') }
  ];
  const ringAcid = (ctx, res) => res.products.filter((p) => ctx.chem.aromaticAtoms(ctx.chem.parse(p.smi)).length > 0);
  const uniq = (ctx, list) => { const seen = new Set(); return list.filter((s) => { const k = canon(ctx, s); if (seen.has(k)) return false; seen.add(k); return true; }); };
  types.push({
    id: 'u09.side',
    title: t('Žiedas ar šoninė grandinė?', 'Ring or side chain?'),
    mirrors: ['S4.8', 'S4.19'],
    gen(rng, ctx) {
      const { react } = ctx;
      const e = ctx.pick(SIDE);
      const rk = ctx.pick(['SEAr', 'SR', 'OX']);
      const lab = SIDE_R[rk].lab;
      let right = null;
      let wrong = [];
      let tie = false;
      let none = false;
      if (rk === 'SR') {
        const r = react.run('side.br', [e.s], {});
        if (r.none) none = true;
        else {
          const m = r.products.filter((p) => p.major);
          if (m.length !== 1) throw new Error('u09.side: several benzylic bromides');
          right = [m[0].smi];
          const ring = react.run('sear', [e.s], { E: 'Br' }).products;
          wrong = ring.filter((p) => p.major).map((p) => p.smi).concat(e.anti ? [e.anti] : ring.filter((p) => !p.major).map((p) => p.smi));
        }
      } else if (rk === 'SEAr') {
        const r = react.run('sear', [e.s], { E: 'Br' });
        const m = r.products.filter((p) => p.major);
        if (m.length < 1 || m.length > 2) throw new Error('u09.side: unclear ring product');
        right = m.map((p) => p.smi);
        tie = m.length === 2;
        const sr = react.run('side.br', [e.s], {});
        wrong = (sr.none ? [] : sr.products.filter((p) => p.major).map((p) => p.smi)).concat(r.products.filter((p) => !p.major).map((p) => p.smi), e.anti ? [e.anti] : []);
      } else {
        const r = react.run('side.ox', [e.s], {});
        if (r.none) none = true;
        else {
          const ar = ringAcid(ctx, r);
          if (ar.length !== 1) throw new Error('u09.side: unclear oxidation product');
          right = [ar[0].smi];
          wrong = [ar[0].smi.replace('C(O)=O', 'C=O'), e.chain || e.mono || ar[0].smi.replace('C(O)=O', 'CO'), ar[0].smi.replace('C(O)=O', 'CO')];
        }
      }
      const q = [{ scheme: { items: [{ smi: e.s }, { arrow: '→', above: f(lab) }] } }];
      const steps = [{
        prompt: t('Kuris procesas vyksta?', 'Which process takes place?'),
        kind: 'choice', options: SIDE_TYPE, answer: none ? 3 : (rk === 'SEAr' ? 0 : (rk === 'SR' ? 1 : 2)),
        hint: t('Žiūrėkite į sąlygas: Liuiso rūgštis, šviesa ar oksidatorius – kiekviena skatina kitokį procesą.', 'Look at the conditions: a Lewis acid, light or an oxidant, each starts a different process.'),
        solution: rk === 'SEAr' ? t('$FeBr3$ sukuria elektrofilą $Br+$: pakeičiamas žiedo vandenilis (SEAr).', '$FeBr3$ makes the electrophile $Br+$: a ring hydrogen is replaced (SEAr).')
          : (rk === 'SR' ? t('Šviesa sukelia radikalinį brominimą (SR): keičiamas šoninės grandinės vandenilis.', 'Light starts radical bromination (SR): a hydrogen of the side chain is replaced.')
            : t('$KMnO4$ karštyje oksiduoja šoninę alkilgrandinę.', 'Hot $KMnO4$ oxidises an alkyl side chain.'))
      }];
      if (none) {
        const why1 = t('Nėra benzilinio vandenilio: benzilo anglis turi tris C atomus, todėl nei radikalas, nei oksidacija neįmanomi.', 'There is no benzylic hydrogen: the benzylic carbon carries three carbons, so neither a radical nor oxidation is possible.');
        steps[0].solution = why1;
        steps.push({
          prompt: t('Kodėl šoninė grandinė nereaguoja?', 'Why does the side chain not react?'),
          kind: 'choice', options: [
            { text: why1 },
            { text: t('Žiedą deaktyvuoja $tret$-butilo grupė, todėl šoninė grandinė negali reaguoti.', 'The tert-butyl group deactivates the ring, so the side chain cannot react.') },
            { text: t('$tret$-Butilas per didelis, todėl reagentas nepasiekia jokio vandenilio.', 'tert-Butyl is too large, so the reagent reaches no hydrogen at all.') },
            { text: t('Aromatinio žiedo šoninė grandinė niekada neoksiduojasi ir nehalogeninasi.', 'A side chain of an aromatic ring is never oxidised or halogenated.') }
          ], answer: 0,
          hint: t('Pažiūrėkite, ar anglis prie žiedo turi vandenilį.', 'Check whether the carbon next to the ring carries a hydrogen.'),
          solution: why1
        });
        return { q, steps, why: t('Šoninės grandinės reakcijos (SR, oksidacija) vyksta per benzilinę padėtį ir reikalauja benzilinio vandenilio. $tret$-Butilas jo neturi.', 'Side-chain reactions (SR, oxidation) go through the benzylic position and need a benzylic hydrogen. tert-Butyl has none.'), src: 'L9 p21, T p63' };
      }
      const cand = uniq(ctx, right.concat(wrong)).filter((s) => !right.some((r) => canon(ctx, r) === canon(ctx, s)));
      const options = right.map((s) => ({ mol: { smi: s } })).concat(cand.slice(0, tie ? 2 : 3).map((s) => ({ mol: { smi: s } })));
      if (rk === 'OX') options.push({ text: t('reakcija nevyksta', 'no reaction') });
      steps.push({
        prompt: tie ? t('Pažymėkite pagrindinius produktus.', 'Pick the main products.') : t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: tie ? 'multi' : 'choice', options, answer: tie ? [0, 1] : 0,
        hint: rk === 'OX' ? t('Šoninė alkilgrandinė oksiduojasi iki $COOH$ ties benzilo anglimi; kas lieka nuo ilgesnės grandinės, atskyla.', 'An alkyl side chain is oxidised to $COOH$ at the benzylic carbon; whatever is left of a longer chain is cleaved off.')
          : t('Visų variantų formulė ta pati: svarbu, kuris vandenilis pakeičiamas – žiedo ar grandinės, ir kuri grandinės anglis.', 'All options have the same formula: what matters is which hydrogen is replaced, on the ring or on the chain, and on which chain carbon.'),
        solution: [{ p: rk === 'SEAr' ? t('Alkilas yra o-/p-orientantas: bromas patenka į žiedą.', 'An alkyl group is an o/p director: bromine goes onto the ring.')
          : (rk === 'SR' ? t('Bromas pakeičia benzilinį vandenilį, nes benzilo radikalas stabiliausias.', 'Bromine replaces the benzylic hydrogen, because the benzyl radical is the most stable.')
            : t('Visa alkilgrandinė virsta viena $COOH$ grupe.', 'The whole alkyl chain becomes one $COOH$ group.')) }].concat(right.map((s) => ({ mol: { smi: s } })))
      });
      return {
        q, steps,
        why: rk === 'SEAr' ? t('$Br2$ su Liuiso rūgštimi $FeBr3$ elektrofiliškai pakeičia žiedo vandenilį; alkilas nukreipia į o- ir p- padėtis.', '$Br2$ with the Lewis acid $FeBr3$ replaces a ring hydrogen electrophilically; an alkyl group directs o and p.')
          : (rk === 'SR' ? t('Šviesoje vyksta radikalinis brominimas: pakeičiamas benzilinis vandenilis, nes benzilo radikalas stabilizuotas rezonansu su žiedu. Žiedas lieka nepakeistas.', 'In light radical bromination takes place: the benzylic hydrogen is replaced because the benzyl radical is stabilised by resonance with the ring. The ring is left unchanged.')
            : t('Karštas $KMnO4$ benzeno žiedo nesuardo, o šoninę grandinę, turinčią benzilinį vandenilį, oksiduoja iki $COOH$ grupės.', 'Hot $KMnO4$ leaves the benzene ring intact but oxidises a side chain with a benzylic hydrogen to a $COOH$ group.')),
        src: 'L9 p21, p35'
      };
    }
  });

  // ---- u09.reagent: choose reagents and conditions (S4.19) ----
  const REAG = {
    SR: { lab: 'Br2, hν', rule: 'side.br', o: null },
    BR: { lab: 'Br2, FeBr3', rule: 'sear', o: { E: 'Br' }, el: 'Br+' },
    CL: { lab: 'Cl2, FeCl3', rule: 'sear', o: { E: 'Cl' }, el: 'Cl+' },
    NO2: { lab: 'HNO3, H2SO4', rule: 'sear', o: { E: 'NO2' }, el: 'NO2+' },
    SO3H: { lab: 'SO3, H2SO4', rule: 'sear', o: { E: 'SO3H' }, el: 'SO3H+' },
    ME: { lab: 'CH3Cl, AlCl3', rule: 'sear', o: { E: 'CH3' }, el: 'CH3+' },
    AC: { lab: 'CH3COCl, AlCl3', rule: 'sear', o: { E: 'C(C)=O' }, el: 'CH3-C≡O+' },
    OX: { lab: 'KMnO4, H2O, t°', rule: 'side.ox', o: null }
  };
  const RE_SUBS = ['Me', 'Et', 'Pr', 'iPr', 'Cl', 'OMe', 'Br'];
  // the main product(s) of reagent r on substrate s (SMILES list), or null
  function reProducts(ctx, s, rk) {
    const r = REAG[rk];
    const res = ctx.react.run(r.rule, [s], r.o || {});
    if (res.none) return null;
    if (r.rule === 'side.ox') {
      const ar = ringAcid(ctx, res);
      return ar.length === 1 ? [ar[0].smi] : null;
    }
    return res.products.filter((p) => p.major).map((p) => p.smi);
  }
  types.push({
    id: 'u09.reagent',
    title: t('Kokie reagentai reikalingi?', 'Which reagents are needed?'),
    mirrors: ['S4.19'],
    gen(rng, ctx) {
      const { chem } = ctx;
      let pick = null;
      for (let tries = 0; tries < 100 && !pick; tries++) {
        const key = ctx.pick(RE_SUBS);
        const s = ringSmi(subsOf([key], [0])).smi;
        const rk = ctx.pick(Object.keys(REAG));
        const ps = reProducts(ctx, s, rk);
        if (!ps || ps.length > 2) continue;
        // the target: the para product when o/p form, otherwise the only product
        let target = ps[0];
        if (ps.length === 2) {
          const a = attack(ctx, subsOf([key], [0]), REAG[rk].o.E);
          const p = a && a.products.find((x) => x.major && x.pos.some((y) => relPos(0, y) === 'p'));
          if (!p) continue;
          target = p.smi;
        }
        const others = Object.keys(REAG).filter((k) => k !== rk).filter((k) => {
          const pp = reProducts(ctx, s, k);
          return !(pp && pp.some((x) => chem.same(x, target, { stereo: false })));
        });
        if (others.length < 3) continue;
        pick = { s, rk, target, others };
      }
      if (!pick) throw new Error('u09.reagent: no usable substrate');
      const { s, rk, target } = pick;
      // wrong options: prefer reagents that give an isomer of the target (the other mechanism), then the rest
      const sameForm = pick.others.filter((k) => { const pp = reProducts(ctx, s, k); return pp && chem.formulaString(chem.parse(pp[0])) === chem.formulaString(chem.parse(target)); });
      const rest = ctx.shuffle(pick.others.filter((k) => sameForm.indexOf(k) < 0));
      const wrong = ctx.shuffle(sameForm).concat(rest).slice(0, 3);
      const keys = [rk].concat(wrong);
      const q = [{ scheme: { items: [{ smi: s }, { arrow: '→' }, { smi: target }] } }];
      const steps = [{
        prompt: t('Kuris reagentų rinkinys duoda šį produktą?', 'Which set of reagents gives this product?'),
        kind: 'choice', options: keys.map((k) => ({ text: f(REAG[k].lab) })), answer: 0,
        hint: t('Palyginkite produktą su pradiniu junginiu: kas pasikeitė – žiedas ar šoninė grandinė, ir kokia grupė įvesta?', 'Compare the product with the starting compound: what changed, the ring or the side chain, and which group was introduced?'),
        solution: [{ p: t('Tinka šie reagentai:', 'These reagents fit:') }, { scheme: { items: [{ smi: s }, { arrow: '→', above: f(REAG[rk].lab) }, { smi: target }] } }]
      }];
      if (REAG[rk].rule === 'sear') {
        const els = ['Br+', 'Cl+', 'NO2+', 'SO3H+', 'CH3+', 'CH3-C≡O+'];
        const ew = els.filter((x) => x !== REAG[rk].el);
        steps.push({
          prompt: t('Kokia dalelė atakuoja aromatinį žiedą?', 'Which particle attacks the aromatic ring?'),
          kind: 'choice', options: [REAG[rk].el].concat(ctx.shuffle(ew).slice(0, 3)).map((x) => ({ text: f('$' + x + '$') })), answer: 0,
          hint: t('Reagentas ir katalizatorius kartu sukuria elektrofilą. Kokį?', 'The reagent and the catalyst together make an electrophile. Which one?'),
          solution: t('Elektrofilas yra $' + REAG[rk].el + '$; jis susidaro iš reagentų, o žiedas jam atiduoda π elektronus (SEAr).', 'The electrophile is $' + REAG[rk].el + '$; it forms from the reagents, and the ring gives it π electrons (SEAr).')
        });
      } else if (REAG[rk].rule === 'side.br') {
        steps.push({
          prompt: t('Kuriuo simboliu žymimas mechanizmas?', 'Which symbol names the mechanism?'),
          kind: 'choice', options: ['SR', 'SEAr', 'AE', 'SN2'].map((x) => ({ text: f(x) })), answer: 0,
          hint: t('Šviesa suskaido $Br2$ į radikalus.', 'Light splits $Br2$ into radicals.'),
          solution: t('Radikalinis pakeitimas, SR: bromo radikalas atplėšia benzilinį vandenilį.', 'Radical substitution, SR: a bromine radical removes the benzylic hydrogen.')
        });
      }
      return {
        q, steps,
        why: REAG[rk].rule === 'sear' ? t('Į žiedą grupę įveda SEAr reakcija; reagentai parenkami pagal tai, kokią dalelę reikia sukurti. Atsimintina, kad šviesa ir $KMnO4$ veikia šoninę grandinę, ne žiedą.', 'A group is put on the ring by an SEAr reaction; the reagents are chosen by the particle that must be made. Remember that light and $KMnO4$ act on the side chain, not on the ring.')
          : t('Šoninę grandinę keičia ne Liuiso rūgštis, o šviesa ($Br2$, $hν$, SR) arba oksidatorius ($KMnO4$, $t°$). Žiedą atakuoja elektrofilai su Liuiso rūgštimi.', 'The side chain is changed not by a Lewis acid but by light ($Br2$, $hν$, SR) or an oxidant ($KMnO4$, $t°$). The ring is attacked by electrophiles with a Lewis acid.'),
        src: 'L9 p12, p21, p35'
      };
    }
  });

  // ---- u09.pos: where does E+ attack a substituted ring? (S4.20) ----
  const POS_G = ['Me', 'Et', 'iPr', 'OMe', 'OH', 'NH2', 'NHAc', 'Cl', 'Br', 'F', 'NO2', 'COOH', 'CN', 'CHO', 'COMe', 'CF3', 'SO3H', 'COOMe'];
  // does the group at ring position i direct to position p?
  const dirOK = (k, i, p) => { const r = relPos(i, p); return isOP(k) ? (r === 'o' || r === 'p') : r === 'm'; };
  const ORIENT_T = {
    don: t('o-/p-orientantas, stiprus ar vidutinis donoras', 'o/p director, a strong or moderate donor'),
    alk: t('o-/p-orientantas, silpnas donoras', 'o/p director, a weak donor'),
    hal: t('o-/p-orientantas, bet deaktyvuoja', 'o/p director, but deactivating'),
    acc: t('m-orientantas, akceptorius', 'meta director, an acceptor')
  };
  types.push({
    id: 'u09.pos',
    title: t('Kur kreipiama elektrofilinė dalelė?', 'Where is the electrophile directed?'),
    mirrors: ['S4.20'],
    gen(rng, ctx) {
      let pick = null;
      for (let tries = 0; tries < 400 && !pick; tries++) {
        const n = rng() < 0.7 ? 2 : 3;
        const keys = [];
        while (keys.length < n) { const k = ctx.pick(POS_G); if (keys.indexOf(k) < 0) keys.push(k); }
        const positions = [0];
        while (positions.length < n) { const p = ctx.int(1, 5); if (positions.indexOf(p) < 0) positions.push(p); }
        const subs = subsOf(keys, positions);
        const ops = keys.filter(isOP);
        const top = ops.length ? Math.max.apply(null, ops.map((k) => SUB[k].st)) : null;
        if (ops.length && ops.filter((k) => SUB[k].st === top).length > 1) continue; // two equal donors: the course rule does not decide
        const E = ctx.pick(['Br', 'Cl']);
        const a = attack(ctx, subs, E);
        if (!a) continue;
        const maj = a.major;
        if (maj.length < 1 || maj.length > 3 || maj.length === a.free.length) continue;
        const common = a.free.filter((p) => keys.every((k, i) => dirOK(k, positions[i], p)));
        const coop = maj.every((p) => common.indexOf(p) >= 0);
        let ctrl = null;
        let allowed = common;
        if (!coop) {
          if (!ops.length) continue;
          ctrl = ops.find((k) => SUB[k].st === top);
          const ci = positions[keys.indexOf(ctrl)];
          allowed = a.free.filter((p) => dirOK(ctrl, ci, p));
          if (!maj.every((p) => allowed.indexOf(p) >= 0)) continue; // the engine and the rule must agree
        }
        pick = { keys, positions, subs, a, E, coop, ctrl, hindered: allowed.some((p) => maj.indexOf(p) < 0) };
      }
      if (!pick) throw new Error('u09.pos: no usable ring');
      const { keys, positions, a, coop, ctrl } = pick;
      const ringIdx = a.major.map((p) => a.ring[p]);
      const lines = keys.map((k) => t('$' + SUB[k].f + '$: ' + ORIENT_T[SUB[k].kind].lt, '$' + SUB[k].f + '$: ' + ORIENT_T[SUB[k].kind].en));
      const verdict = coop
        ? t('Pakaitų kryptys sutampa, todėl nauja grupė patenka į pažymėtas padėtis.', 'The directions of the substituents agree, so the new group goes to the marked positions.')
        : t('Kryptys nesutampa, todėl lemia stipresnis donoras $' + SUB[ctrl].f + '$.', 'The directions disagree, so the stronger donor $' + SUB[ctrl].f + '$ decides.');
      const sterics = pick.hindered
        ? t(' Padėtis tarp dviejų pakaitų dėl kliūčių nepasirenkama.', ' The position between two substituents is avoided for steric reasons.')
        : t('', '');
      const steps = [
        {
          prompt: t('Bakstelėkite žiedo anglies atomus, į kuriuos bus kreipiama elektrofilinė dalelė $E+$.', 'Tap the ring carbons to which the electrophile $E+$ is directed.'),
          kind: 'atoms', mol: { smi: a.smi, opts: { numbers: 'all' } }, answer: ringIdx,
          hint: t('Pirma nustatykite, ką kiekvienas pakaitas kreipia: o-/p- ar m- padėtis. Paskui palyginkite.', 'First decide what each substituent directs to, o/p or m positions. Then compare.'),
          solution: [{ list: lines }, { p: t(verdict.lt + sterics.lt, verdict.en + sterics.en) }]
        },
        {
          prompt: t('Kuris pakaitas nulemia atakos vietą?', 'Which substituent decides where the attack goes?'),
          kind: 'choice',
          options: keys.map((k) => ({ text: t('$' + SUB[k].f + '$', '$' + SUB[k].f + '$') })).concat([{ text: t('visi pakaitai kreipia į tas pačias padėtis', 'all substituents point to the same positions') }]),
          answer: coop ? keys.length : keys.indexOf(ctrl),
          hint: t('Palyginkite kiekvieno pakaito nurodytas padėtis: ar jos sutampa?', 'Compare the positions each substituent points to: do they coincide?'),
          solution: t(verdict.lt, verdict.en)
        }
      ];
      return {
        q: [{ p: t('Į kurias padėtis bus kreipiama elektrofilinė dalelė $E+$ vykstant SEAr reakcijai?', 'To which positions will the electrophile $E+$ be directed in an SEAr reaction?') }],
        steps,
        why: t('Kiekvienas pakaitas kreipia savaip. Jei kryptys sutampa, naujas pakaitas patenka į bendrą padėtį; jei ne, lemia stipresnis elektronų donoras. Padėtis tarp dviejų pakaitų dėl kliūčių paprastai nepasirenkama.',
          'Each substituent directs in its own way. If the directions agree, the new group goes to the common position; if not, the stronger electron donor decides. The position between two substituents is usually avoided for steric reasons.'),
        src: 'L9 p24–28, p34, S4.20'
      };
    }
  });

  // ---- u09.sigma: arenium ions and resonance (S4.9) ----
  const SIG_Z = ['OMe', 'OH', 'NH2', 'NMe2', 'NHAc', 'Me', 'Et', 'iPr', 'NO2', 'COOH', 'CN', 'CHO', 'COMe', 'CF3', 'SO3H', 'COOMe'];
  const SIG_EFFECT = {
    lp: t('Teigiamas krūvis gali atsidurti ant C su pakaitu, o pakaito laisvoji elektronų pora jį papildomai stabilizuoja: jonas stabilesnis.', 'The positive charge can sit on the carbon that carries the substituent, and the lone pair of the substituent stabilises it further: the ion is more stable.'),
    alk: t('Teigiamas krūvis gali atsidurti ant C su alkilu (tretinis katijonas), kurį stabilizuoja alkilgrupė: jonas šiek tiek stabilesnis.', 'The positive charge can sit on the carbon bearing the alkyl group (a tertiary cation), which the alkyl group stabilises: the ion is slightly more stable.'),
    acc: t('Teigiamas krūvis gali atsidurti ant C su akceptoriumi, šalia teigiamo ar elektronus traukiančio atomo: jonas labai nestabilus.', 'The positive charge can sit on the carbon bearing the acceptor, next to a positive or electron-withdrawing atom: the ion is very unstable.'),
    none: t('Teigiamas krūvis niekada neatsiduria ant C su pakaitu, todėl pakaitas šio jono tiesiogiai nei stabilizuoja, nei destabilizuoja.', 'The positive charge never sits on the carbon with the substituent, so the substituent neither stabilises nor destabilises this ion directly.')
  };
  const SIG_ORDER = ['lp', 'alk', 'acc', 'none'];
  types.push({
    id: 'u09.sigma',
    title: t('Arenio jono rezonansinės formulės', 'Resonance structures of the arenium ion'),
    mirrors: ['S4.9'],
    gen(rng, ctx) {
      const zk = ctx.pick(SIG_Z);
      const k = ctx.pick([1, 2, 3, 4, 5]);
      const c = ctx.pick([(k + 1) % 6, (k + 5) % 6]);
      const ef = ctx.pick(['Br', 'Cl', '[N+](=O)[O-]']);
      const A = arenium(zk, k, c, ef);
      const sub = SUB[zk];
      const rel = relPos(0, k);
      const carries = A.plus.indexOf(0) >= 0;
      const effect = !carries ? 'none' : (sub.kind === 'don' ? 'lp' : (sub.kind === 'alk' ? 'alk' : 'acc'));
      if (ctx.chem.formulaString(ctx.chem.parse(A.smi)).indexOf('+') < 0) throw new Error('u09.sigma: not a cation');
      const plusIdx = A.plus.map((q) => A.idx[q]);
      const finalAns = sub.kind === 'acc' ? 1 : 0;
      const relT = { o: t('orto', 'ortho'), m: t('meta', 'meta'), p: t('para', 'para') }[rel];
      const steps = [
        {
          prompt: t('Pavaizduota viena rezonansinė formulė. Bakstelėkite visus žiedo C atomus, ant kurių rezonansinėse formulėse gali būti teigiamas krūvis.', 'One resonance structure is shown. Tap every ring carbon that can carry the positive charge in some resonance structure.'),
          kind: 'atoms', mol: { smi: A.smi, opts: { numbers: 'all' } }, answer: plusIdx,
          hint: t('Krūvis juda per konjuguotą dienilo sistemą: perkelkite dvigubą ryšį gretimo atomo link ir pažiūrėkite, kur atsiranda $+$.', 'The charge moves through the conjugated diene part: shift a double bond toward the charged atom and see where the $+$ appears.'),
          solution: [{ p: t('Teigiamas krūvis dalijasi tarp trijų atomų: dviejų, gretimų $sp3$ atomui, ir atomo, esančio jam priešais.', 'The positive charge is shared by three atoms: the two next to the $sp3$ carbon and the one opposite to it.') }]
        },
        {
          prompt: t('Ar atomas, turintis pakaitą, yra tarp šių trijų, ir ką tai reiškia jonui?', 'Is the carbon that carries the substituent among these three, and what does that mean for the ion?'),
          kind: 'choice', options: SIG_ORDER.map((x) => ({ text: SIG_EFFECT[x] })), answer: SIG_ORDER.indexOf(effect),
          hint: t('Pažiūrėkite, ar pakaito turintis atomas yra tarp trijų pažymėtų, ir kokio tipo pakaitas tai.', 'See whether the carbon with the substituent is among the three marked and what kind of group it carries.'),
          solution: SIG_EFFECT[effect]
        },
        {
          prompt: t('Kokias padėtis šis pakaitas kreips pagrindinai?', 'Which positions will this substituent mainly direct to?'),
          kind: 'choice', options: [{ text: t('o- ir p- padėtis', 'the o and p positions') }, { text: t('m- padėtį', 'the m position') }, { text: t('visas padėtis vienodai', 'all positions equally') }], answer: finalAns,
          hint: t('Padėtis, kurių atakos jonas stabiliausias, bus pagrindinės. Kuriose atakose pakaito turintis atomas gauna krūvį?', 'The positions whose attack gives the most stable ion are the main ones. In which attacks does the substituent carbon get the charge?'),
          solution: sub.kind === 'acc'
            ? t('Akceptorius destabilizuoja jonus o- ir p- atakos atveju, todėl pagrindinė ataka – m- padėtyje.', 'An acceptor destabilises the ions of o and p attack, so the main attack is at the m position.')
            : t('Donoras stabilizuoja jonus o- ir p- atakos atveju, todėl pagrindinės – o- ir p- padėtys.', 'A donor stabilises the ions of o and p attack, so the o and p positions are the main ones.')
        }
      ];
      return {
        q: [{ p: t('Elektrofilas $E+$ atakuoja ' + relT.lt + ' padėtį benzeno darinio, turinčio pakaitą $' + sub.f + '$. Susidaręs arenio jonas parodytas pirmajame žingsnyje.', 'The electrophile $E+$ attacks the ' + relT.en + ' position of a benzene derivative that carries the substituent $' + sub.f + '$. The arenium ion that forms is shown in the first step.') },],
        steps,
        why: t('Arenio jono teigiamas krūvis visada dalijamas tarp trijų atomų: dviejų gretimų ir vieno priešais atakuotą atomą. Pakaitas ant vieno iš jų (o- ar p- ataka) stipriai keičia jono stabilumą: donoras jį didina, akceptorius – mažina. Atakuojant m- padėtį pakaitas krūvio negauna.',
          'The positive charge of an arenium ion is always shared by three carbons: the two next to the attacked carbon and the one opposite. A substituent on one of them (o or p attack) changes the stability of the ion strongly: a donor raises it, an acceptor lowers it. In m attack the substituent never gets the charge.'),
        src: 'L9 p29–33'
      };
    }
  });

  // ---- u09.rate: which arene reacts faster? (S4.9) ----
  const RATE_K = ['NH2', 'OH', 'OMe', 'NHAc', 'Me', 'Et', 'H', 'F', 'Cl', 'Br', 'I', 'COOH', 'CHO', 'CN', 'COMe', 'COOMe', 'SO3H', 'NO2', 'CF3'];
  const LVL_T = {
    4: t('stiprus aktyvuojantis pakaitas', 'a strongly activating group'),
    3: t('vidutiniškai aktyvuojantis pakaitas', 'a moderately activating group'),
    2: t('silpnai aktyvuojantis pakaitas (alkilas)', 'a weakly activating group (alkyl)'),
    1: t('nėra pakaito (benzenas)', 'no substituent (benzene)'),
    0: t('silpnai deaktyvuojantis pakaitas (halogenas)', 'a weakly deactivating group (halogen)'),
    '-1': t('vidutiniškai deaktyvuojantis pakaitas', 'a moderately deactivating group'),
    '-2': t('stipriai deaktyvuojantis pakaitas', 'a strongly deactivating group')
  };
  const RATE_REASON = [
    t('Greičiau reaguoja arenas, kurio pakaitas labiau didina elektronų tankį žiede ir stabilizuoja arenio joną (lėtoji II stadija greitesnė).', 'The arene whose substituent raises the electron density in the ring more and stabilises the arenium ion reacts faster (the slow stage II is faster).'),
    t('Greičiau reaguoja arenas, kurio pakaitas stipriau traukia elektronus, nes žiedas lengviau pritraukia elektrofilą.', 'The arene whose substituent withdraws electrons more strongly reacts faster, because the ring attracts the electrophile more easily.'),
    t('Greitį lemia tik pakaito dydis: didesnis pakaitas reiškia greitesnę reakciją.', 'The rate depends only on the size of the substituent: a bigger substituent means a faster reaction.'),
    t('Pakaito poveikis nesvarbus, nes lėtoji stadija – tik elektrofilo susidarymas.', 'The effect of the substituent does not matter, because the slow stage is only the formation of the electrophile.')
  ];
  const arene = (k) => ringSmi(subsOf([k], [0])).smi;
  types.push({
    id: 'u09.rate',
    title: t('Kuris arenas reaguoja greičiau?', 'Which arene reacts faster?'),
    mirrors: ['S4.9'],
    gen(rng, ctx) {
      const n = rng() < 0.6 ? 2 : 3;
      const ks = [];
      for (let tries = 0; tries < 60 && ks.length < n; tries++) {
        const k = ctx.pick(RATE_K);
        if (ks.every((x) => SUB[x].lvl !== SUB[k].lvl)) ks.push(k);
      }
      if (ks.length < n) throw new Error('u09.rate: no pool');
      const ek = ctx.pick(['Br', 'Cl', 'NO2', 'SO3H']);
      const sorted = ks.slice().sort((x, y) => SUB[y].lvl - SUB[x].lvl);
      const nm = (k) => t(SUB[k].lt, SUB[k].en);
      const mols = ks.map((k) => ({ smi: arene(k), caption: nm(k) }));
      const lines = sorted.map((k) => t(SUB[k].lt + ': ' + (k === 'H' ? LVL_T[1].lt : LVL_T[SUB[k].lvl].lt), SUB[k].en + ': ' + (k === 'H' ? LVL_T[1].en : LVL_T[SUB[k].lvl].en)));
      const rg = ELE[ek].reag.split(', ').map((x) => '$' + x + '$').join(', ');
      const steps = [];
      if (n === 2) {
        steps.push({
          prompt: t('Kuris arenas reaguoja greičiau?', 'Which arene reacts faster?'),
          kind: 'choice', options: ks.map((k) => ({ mol: { smi: arene(k) } })), answer: ks.indexOf(sorted[0]),
          hint: t('Palyginkite pakaitų poveikį žiedo elektronų tankiui: kuris pakaitas žiedą aktyvuoja labiau, kuris deaktyvuoja?', 'Compare the effect of the substituents on the electron density of the ring: which one activates more, which one deactivates?'),
          solution: [{ list: lines }]
        });
      } else {
        steps.push({
          prompt: t('Išdėstykite arenus nuo greičiausiai iki lėčiausiai reaguojančio.', 'Order the arenes from the fastest to the slowest reacting.'),
          kind: 'order', options: sorted.map((k) => ({ text: nm(k) })),
          hint: t('Pirma suskirstykite pakaitus: stiprūs ar silpni donorai, halogenai, akceptoriai.', 'First sort the substituents: strong or weak donors, halogens, acceptors.'),
          solution: [{ list: lines }]
        });
      }
      steps.push({
        prompt: t('Kodėl greičiau reaguoja arenas su aktyvesniu pakaitu?', 'Why does the arene with the more activating substituent react faster?'),
        kind: 'choice', options: RATE_REASON.map((x) => ({ text: x })), answer: 0,
        hint: t('Lėtoji stadija – arenio jono susidarymas. Kas nuo jo stabilumo priklauso?', 'The slow stage is the formation of the arenium ion. What depends on its stability?'),
        solution: RATE_REASON[0]
      });
      const fast = sorted[0];
      const a = fast === 'H' ? null : attack(ctx, subsOf([fast], [0]), ek);
      if (a) {
        const majors = a.products.filter((p) => p.major);
        if (majors.length >= 1 && majors.length <= 2) {
          const tie = majors.length === 2;
          steps.push({
            prompt: tie ? t('Kokie yra greitesnės reakcijos pagrindiniai produktai?', 'What are the main products of the faster reaction?') : t('Koks yra greitesnės reakcijos pagrindinis produktas?', 'What is the main product of the faster reaction?'),
            kind: tie ? 'multi' : 'choice', options: a.products.slice().sort((x, y) => (y.major ? 1 : 0) - (x.major ? 1 : 0)).map((p) => ({ mol: { smi: p.smi } })),
            answer: tie ? [0, 1] : 0,
            hint: t('Naudokite greitesnio arenų pakaito orientaciją.', 'Use the directing effect of the substituent of the faster arene.'),
            solution: [{ p: t('Šio pakaito orientacija:', 'The directing effect of this substituent:') }, prodScheme(a.smi, ENV(ek), majors.map((m) => m.smi))]
          });
        }
      }
      return {
        q: [{ p: t('Kuris iš šių arenų reaguoja greičiau su ' + rg + '? ' + (n === 2 ? 'Palyginkite du.' : 'Palyginkite visus tris.'), 'Which of these arenes reacts faster with ' + rg + '? ' + (n === 2 ? 'Compare the two.' : 'Compare all three.')) }, { mol: mols }],
        steps,
        why: t('SEAr greitį lemia arenio jono susidarymas (lėtoji II stadija). Donorai jį stabilizuoja ir reakciją greitina, akceptoriai destabilizuoja ir lėtina; halogenai silpnai lėtina. Eilė: stiprūs aktyvatoriai > vidutiniai > silpni > benzenas > halogenai > vidutiniai deaktyvatoriai > stiprūs deaktyvatoriai.',
          'The SEAr rate is set by the formation of the arenium ion (the slow stage II). Donors stabilise it and speed the reaction up; acceptors destabilise it and slow it down; halogens slow it slightly. Order: strong activators > moderate > weak > benzene > halogens > moderate deactivators > strong deactivators.'),
        src: 'L9 p28, S4.9'
      };
    }
  });

  // ---- u09.korner: Körner's method (S4.21) ----
  const KOR_X = ['Br', 'Cl', 'I', 'F', 'Me', 'Et', 'OMe', 'OH'];
  const nProd = (n) => t(n + (n === 1 ? ' mononitrojunginys' : ' mononitrojunginiai'), n + (n === 1 ? ' mononitro product' : ' mononitro products'));
  function nitroProducts(ctx, smi) {
    const res = ctx.react.run('sear', [smi], { E: 'NO2' });
    const seen = new Set();
    return res.products.map((p) => p.smi).filter((s) => { const k = canon(ctx, s); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  types.push({
    id: 'u09.korner',
    title: t('Kiornerio metodas: izomerų atpažinimas', 'Körner’s method: telling isomers apart'),
    mirrors: ['S4.21'],
    gen(rng, ctx) {
      const variant = ctx.pick(['count', 'di', 'tri']);
      const xk = ctx.pick(variant === 'tri' ? ['Me', 'Br', 'Cl', 'OMe', 'Et'] : KOR_X);
      const sets = variant === 'tri' ? [[0, 1, 2], [0, 1, 3], [0, 2, 4]] : [[0, 1], [0, 2], [0, 3]];
      const iso = sets.map((ps) => ringSmi(subsOf(ps.map(() => xk), ps)).smi);
      const prods = iso.map((s) => nitroProducts(ctx, s));
      const counts = prods.map((x) => x.length);
      const expect = variant === 'tri' ? [2, 3, 1] : [2, 3, 1];
      if (counts.join() !== expect.join()) throw new Error('u09.korner: unexpected counts ' + counts);
      const fname = SUB[xk].f;
      const schemes = iso.map((s, i) => prodScheme(s, 'HNO3, H2SO4', prods[i]));
      if (variant === 'count') {
        const i = ctx.int(0, 2);
        const all = [].concat.apply([], prods.map((ps, j) => ps.map((s) => ({ s, j }))));
        const right = all.filter((x) => x.j === i);
        const options = right.concat(all.filter((x) => x.j !== i)).map((x) => ({ mol: { smi: x.s } }));
        return {
          q: [{ p: t('Izomerinis junginys nitrinamas ($HNO3$, $H2SO4$), gaunant mononitrojunginius.', 'An isomeric compound is nitrated ($HNO3$, $H2SO4$) to give mononitro compounds.') }, { mol: { smi: iso[i] } }],
          steps: [
            {
              prompt: t('Kiek skirtingų mononitrojunginių gali susidaryti?', 'How many different mononitro compounds can form?'),
              kind: 'number', answer: { value: counts[i], tol: 0 },
              hint: t('Suskaičiuokite laisvas C–H padėtis, kurios nėra lygiavertės pagal simetriją.', 'Count the free C–H positions that are not equivalent by symmetry.'),
              solution: [{ p: t('Skirtingų padėčių skaičius lygus produktų skaičiui:', 'The number of different positions equals the number of products:') }, schemes[i]]
            },
            {
              prompt: t('Pažymėkite visus mononitrojunginius, kurie gali susidaryti iš šio izomero.', 'Pick every mononitro compound that can form from this isomer.'),
              kind: 'multi', options, answer: right.map((_, k) => k),
              hint: t('Kiekvienai skirtingai padėčiai – vienas produktas. Kiti variantai yra kitų izomerų produktai.', 'Each different position gives one product. The other options are products of the other isomers.'),
              solution: [schemes[i]]
            }
          ],
          why: t('Nitrogrupė gali patekti į kiekvieną laisvą padėtį, bet pagal simetriją lygiavertės padėtys duoda tą patį produktą. Todėl produktų skaičius priklauso tik nuo izomero simetrijos.', 'The nitro group can enter any free position, but positions that are equivalent by symmetry give the same product. So the number of products depends only on the symmetry of the isomer.'),
          src: 'S4.21'
        };
      }
      const order = ctx.shuffle([0, 1, 2]);
      const letters = ['A', 'B', 'C'];
      const perm = ctx.shuffle([0, 1, 2]);
      const left = perm.map((k, l) => ({ text: t(letters[l] + ': nitrinant gautas ' + nProd(counts[k]).lt, letters[l] + ': nitration gave ' + nProd(counts[k]).en) }));
      const right = order.map((k) => ({ mol: { smi: iso[k] } }));
      const pairs = perm.map((k) => order.indexOf(k));
      const nameOf = variant === 'tri'
        ? t('trijų vienodų pakaitų ($' + fname + '$) benzeno izomerai (1,2,3-, 1,2,4- ir 1,3,5-)', 'the isomeric benzenes with three identical substituents ($' + fname + '$): 1,2,3, 1,2,4 and 1,3,5')
        : t('dviejų vienodų pakaitų ($' + fname + '$) benzeno izomerai ($o$-, $m$- ir $p$-)', 'the isomeric benzenes with two identical substituents ($' + fname + '$): o, m and p');
      return {
        q: [{ p: t('Trys izomerai A, B ir C yra ' + nameOf.lt + '. Juos atpažįstame mononitrinimu.', 'Three isomers A, B and C are ' + nameOf.en + '. They are told apart by mononitration.') }],
        steps: [{
          prompt: t('Kiekvieną izomerą priskirkite jo mononitrinimo rezultatui.', 'Match each isomer to the result of its mononitration.'),
          kind: 'match', answer: { left, right, pairs },
          hint: t('Suskaičiuokite, kiek skirtingų laisvų padėčių turi kiekvienas izomeras. Simetriškiausias duoda mažiausiai produktų.', 'Count how many different free positions each isomer has. The most symmetrical gives the fewest products.'),
          solution: schemes
        }],
        why: t('Kiornerio metodas: kuo simetriškesnis izomeras, tuo mažiau skirtingų mononitrojunginių. Dibrombenzenuose $p$ duoda 1, $o$ – 2, $m$ – 3; esant trims vienodiems pakaitams 1,3,5- duoda 1, 1,2,3- – 2, o 1,2,4- – 3.', 'Körner’s method: the more symmetrical the isomer, the fewer different mononitro compounds. For dibromobenzenes p gives 1, o gives 2, m gives 3; with three identical substituents 1,3,5 gives 1, 1,2,3 gives 2, and 1,2,4 gives 3.'),
        src: 'S4.21'
      };
    }
  });

  // ---- u09.anil: N,N-dialkylanilines in acid (S4.22) ----
  const ANIL_N = ['NMe2', 'NEt2', 'NMeEt'];
  const ANIL_Z = [null, 'Me', 'Cl', 'OMe', 'Br', 'Et'];
  const ANIL_E = { Br: 'Br2', Cl: 'Cl2', NO2: 'HNO3, H2SO4' };
  types.push({
    id: 'u09.anil',
    title: t('Dialkilanilinai skirtingoje terpėje', 'Dialkylanilines in different media'),
    mirrors: ['S4.22'],
    gen(rng, ctx) {
      const nk = ctx.pick(ANIL_N);
      const zk = ctx.pick(ANIL_Z);
      const ek = ctx.pick(['Br', 'Cl', 'NO2']);
      const subs = subsOf(zk ? [nk, zk] : [nk], zk ? [0, 3] : [0]);
      const a = attack(ctx, subs, ek);
      if (!a) throw new Error('u09.anil: no reaction');
      const majors = a.products.filter((p) => p.major);
      if (majors.length < 1 || majors.length > 2) throw new Error('u09.anil: unclear');
      const acid = ek === 'NO2';
      const tie = majors.length === 2;
      const amine = ringSmi(subs).smi;
      const rg = ANIL_E[ek].split(', ').map((x) => '$' + x + '$').join(', ');
      const steps = [
        {
          prompt: t('Kokia forma yra aminogrupė šioje terpėje?', 'In what form is the amino group in this medium?'),
          kind: 'choice', options: [
            { text: t('neprotonizuota: $-NR2$ su laisvąja elektronų pora', 'not protonated: $-NR2$ with its lone pair') },
            { text: t('protonizuota: $-NHR2+$ be laisvosios poros', 'protonated: $-NHR2+$ without a lone pair') },
            { text: t('oksiduota į $N$-oksidą', 'oxidised to the N-oxide') },
            { text: t('prie azoto prisijungia $E+$', 'the electrophile bonds to nitrogen') }
          ], answer: acid ? 1 : 0,
          hint: acid ? t('Pažiūrėkite į terpę: ar ji rūgšti? Ar azoto laisvoji pora gali paimti protoną?', 'Look at the medium: is it acidic? Can the nitrogen lone pair take a proton?')
            : t('Pažiūrėkite į terpę: ar joje yra stiprios rūgšties, galinčios protonizuoti azotą?', 'Look at the medium: is there a strong acid that could protonate nitrogen?'),
          solution: acid ? t('Nitrinimo mišinyje yra stiprios rūgšties $H2SO4$: azoto laisvoji pora paima protoną.', 'The nitrating mixture contains the strong acid $H2SO4$: the nitrogen lone pair takes a proton.')
            : t('Šioje terpėje stiprios rūgšties nėra, todėl azotas lieka su laisvąja pora.', 'There is no strong acid in this medium, so nitrogen keeps its lone pair.')
        },
        {
          prompt: t('Kokio tipo orientantas yra ši aminogrupė?', 'What kind of director is this amino group?'),
          kind: 'choice', options: [
            { text: t('o-/p-orientantas, aktyvuoja žiedą', 'o/p director, activates the ring') },
            { text: t('m-orientantas, deaktyvuoja žiedą', 'meta director, deactivates the ring') },
            { text: t('o-/p-orientantas, deaktyvuoja žiedą', 'o/p director, deactivates the ring') },
            { text: t('nekreipia: visos padėtys vienodos', 'no direction: all positions alike') }
          ], answer: acid ? 1 : 0,
          hint: t('Ar atomas, sujungtas su žiedu, turi laisvąją porą, ar pilną teigiamą krūvį?', 'Does the atom bonded to the ring have a lone pair or a full positive charge?'),
          solution: acid ? t('$-NHR2+$ neturi laisvosios poros ir turi pilną teigiamą krūvį (−I), kaip $NR3+$: m-orientantas.', '$-NHR2+$ has no lone pair and a full positive charge (−I), like $NR3+$: a meta director.')
            : t('$-NR2$ paduoda laisvąją porą į žiedą (+M): stiprus o-/p-orientantas.', '$-NR2$ donates its lone pair into the ring (+M): a strong o/p director.')
        },
        {
          prompt: tie ? t('Pažymėkite pagrindinius produktus.', 'Pick the main products.') : t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: tie ? 'multi' : 'choice', options: a.products.slice().sort((x, y) => (y.major ? 1 : 0) - (x.major ? 1 : 0)).map((p) => ({ mol: { smi: p.smi } })),
          answer: tie ? [0, 1] : 0,
          hint: t('Naudokite ankstesnių žingsnių išvadą apie aminogrupės formą.', 'Use the conclusion of the previous steps about the form of the amino group.'),
          solution: [prodScheme(amine, ANIL_E[ek], majors.map((m) => m.smi))]
        }
      ];
      const target = tie ? (a.products.find((p) => p.major && p.pos.some((x) => relPos(0, x) === 'p')) || majors[0]) : majors[0];
      const nm = nameT(ctx, target.smi);
      if (nm) {
        steps.push({
          prompt: tie ? t('Pavadinkite para izomerą.', 'Name the para isomer.') : t('Pavadinkite pagrindinį produktą.', 'Name the main product.'),
          kind: 'name', mol: { smi: target.smi }, answer: { smi: target.smi },
          hint: t('Pagrindinė grandinė – benzenaminas; azoto pakaitus žymėkite $N$.', 'The parent is the benzenamine; mark the nitrogen substituents with $N$.'),
          solution: nm
        });
      }
      return {
        q: [{ p: t('Reaguojama su ' + rg + '.', 'The reagent is ' + rg + '.') }, { scheme: { items: [{ smi: amine }, { arrow: '→', above: f(ANIL_E[ek]) }] } }],
        steps,
        why: t('Neutralus aminas yra stiprus donoras ir kreipia į o-/p- padėtis. Stipriai rūgščioje terpėje jis protonizuojamas, netenka laisvosios poros ir tampa m-orientantu. Todėl tas pats junginys su $Br2$ ir su $HNO3$/$H2SO4$ duoda skirtingus izomerus.', 'A neutral amine is a strong donor and directs o/p. In strongly acidic medium it is protonated, loses its lone pair and becomes a meta director. So the same compound gives different isomers with $Br2$ and with $HNO3$/$H2SO4$.'),
        src: 'S4.22, L9 p28'
      };
    }
  });

  /* ---------- banks ---------- */

  const tx = (lt, en) => ({ text: t(lt, en) });
  const ml = (smi, o) => ({ mol: Object.assign({ smi }, o || {}) });
  const ch = (prompt, options, answer, hint, solution, extra) => Object.assign({ prompt, kind: 'choice', options, answer, hint, solution }, extra || {});
  const mm = (smi, o) => Object.assign({ smi }, o || {});
  const sch = (items) => ({ scheme: { items } });
  const ar = (above, below) => (below ? { arrow: '→', above: f(above), below: f(below) } : { arrow: '→', above: f(above) });

  // ---- u09.huckel (S4.17) ----
  types.push({
    id: 'u09.huckel',
    title: t('Hiukelio taisyklė: jonai ir heterociklai', 'Hückel’s rule: ions and heterocycles'),
    mirrors: ['S4.17'],
    bank: [
      {
        id: 'u09.huckel.1',
        q: [{ p: t('Iš ciklopentadieno atėmus $H+$, $H•$ arba $H-$, gaunami trys penkianariai dariniai.', 'Removing $H+$, $H•$ or $H-$ from cyclopentadiene gives three five-membered species.') }, { mol: [{ smi: '[CH+]1C=CC=C1' }, { smi: '[CH]1C=CC=C1' }, { smi: '[CH-]1C=CC=C1' }] }],
        steps: [
          ch(t('Kuris iš trijų darinių yra aromatinis?', 'Which of the three species is aromatic?'), [ml('[CH+]1C=CC=C1'), ml('[CH]1C=CC=C1'), ml('[CH-]1C=CC=C1')], 2,
            t('Suskaičiuokite π elektronus kiekviename: dvi C=C ir tas, kas lieka ant penktojo atomo.', 'Count the π electrons in each: two C=C and whatever sits on the fifth atom.'),
            t('Katijonas turi 4, radikalas 5, anijonas 6 π elektronus. Tik 6 = 4n + 2 (n = 1).', 'The cation has 4, the radical 5, the anion 6 π electrons. Only 6 = 4n + 2 (n = 1).')),
          { prompt: t('Kiek π elektronų turi aromatinis darinys?', 'How many π electrons does the aromatic species have?'), kind: 'number', answer: { value: 6, tol: 0 },
            hint: t('Dvi C=C duoda 4 elektronus.', 'Two C=C give 4 electrons.'), solution: t('4 iš dviejų C=C ir 2 iš anijono laisvosios poros $p$ orbitalėje: 6.', '4 from the two C=C and 2 from the lone pair of the anion in a $p$ orbital: 6.') }
        ],
        why: t('Aromatiškumą nusako π elektronų skaičius, o ne krūvis: ciklopentadienilo anijonas turi 6 π elektronus, todėl stabilus, o katijonas (4) – ne.', 'Aromaticity depends on the number of π electrons, not on the charge: the cyclopentadienyl anion has 6 π electrons and is stable, the cation (4) is not.'),
        src: 'L9 p7', claims: [{ aromatic: ['[CH-]1C=CC=C1', true] }, { aromatic: ['[CH+]1C=CC=C1', false] }]
      },
      {
        id: 'u09.huckel.2',
        q: [{ p: t('Iš cikloheptatrieno gaunami katijonas, radikalas ir anijonas.', 'Cycloheptatriene gives a cation, a radical and an anion.') }, { mol: [{ smi: '[CH+]1C=CC=CC=C1' }, { smi: '[CH]1C=CC=CC=C1' }, { smi: '[CH-]1C=CC=CC=C1' }] }],
        steps: [
          ch(t('Kuris darinys aromatinis?', 'Which species is aromatic?'), [ml('[CH+]1C=CC=CC=C1'), ml('[CH]1C=CC=CC=C1'), ml('[CH-]1C=CC=CC=C1'), ml('C1=CC=CCC=C1')], 0,
            t('Tuščia $p$ orbitalė elektronų neprideda.', 'An empty $p$ orbital adds no electrons.'),
            t('Katijonas turi 3 C=C: 6 π elektronus. Radikalas turi 7, anijonas 8, o cikloheptatrienas turi $sp3$ atomą.', 'The cation has 3 C=C: 6 π electrons. The radical has 7, the anion 8, and cycloheptatriene has an $sp3$ carbon.'))
        ],
        why: t('Septynių narių žiedas aromatinis tik kaip katijonas (6 π e−). Tropilio katijonas yra pavyzdys, kad aromatinis gali būti ir ne šešianaris žiedas.', 'A seven-membered ring is aromatic only as the cation (6 π e−). The tropylium cation shows that an aromatic ring need not be six-membered.'),
        src: 'L9 p7', claims: [{ aromatic: ['[CH+]1C=CC=CC=C1', true] }, { aromatic: ['[CH-]1C=CC=CC=C1', false] }]
      },
      {
        id: 'u09.huckel.3',
        q: [{ p: t('Pirolis yra aromatinis.', 'Pyrrole is aromatic.') }, { mol: { smi: 'c1cc[nH]c1', name: t('pirolis', 'pyrrole'), opts: { numbers: 'all' } } }],
        steps: [
          { prompt: t('Bakstelėkite atomą, kurio laisvoji pora įeina į aromatinę π sistemą.', 'Tap the atom whose lone pair joins the aromatic π system.'), kind: 'atoms', mol: { smi: 'c1cc[nH]c1', opts: { numbers: 'all' } }, answer: [3],
            hint: t('Dvi C=C duoda tik 4 elektronus, o reikia 6.', 'Two C=C give only 4 electrons, but 6 are needed.'), solution: t('Azoto laisvoji pora guli $p$ orbitalėje ir duoda likusius 2 elektronus: 4 + 2 = 6.', 'The nitrogen lone pair sits in a $p$ orbital and gives the remaining 2 electrons: 4 + 2 = 6.') },
          { prompt: t('Kiek π elektronų turi pirolio žiedas?', 'How many π electrons does the pyrrole ring have?'), kind: 'number', answer: { value: 6, tol: 0 },
            hint: t('Sudėkite elektronus iš dvigubųjų ryšių ir iš azoto poros.', 'Add the electrons from the double bonds and from the nitrogen pair.'), solution: t('4 + 2 = 6 ($n = 1$).', '4 + 2 = 6 ($n = 1$).') }
        ],
        why: t('Heteroatomo laisvoji pora skaičiuojama tik tada, kai ji yra $p$ orbitalėje, t. y. dalyvauja konjugacijoje.', 'A heteroatom lone pair counts only when it is in a $p$ orbital, that is, when it takes part in the conjugation.'),
        src: 'L9 p6', claims: [{ aromatic: ['c1cc[nH]c1', true] }, { formula: ['c1cc[nH]c1', 'C4H5N'] }]
      },
      {
        id: 'u09.huckel.4',
        q: [{ p: t('Palyginkite piridino ir pirolio azoto atomus.', 'Compare the nitrogen atoms of pyridine and pyrrole.') }, { mol: [{ smi: 'c1ccncc1' }, { smi: 'c1cc[nH]c1' }] }],
        steps: [
          ch(t('Kurio junginio azoto laisvoji pora įeina į aromatinį sekstetą?', 'Whose nitrogen lone pair belongs to the aromatic sextet?'),
            [tx('tik pirolio', 'only pyrrole’s'), tx('tik piridino', 'only pyridine’s'), tx('abiejų', 'both'), tx('nė vieno', 'neither')], 0,
            t('Pažiūrėkite, kur nukreipta laisvoji pora: į žiedo plokštumą ar statmenai jai.', 'See where the lone pair points: into the ring plane or perpendicular to it.'),
            t('Piridine azotas jau duoda vieną elektroną $p$ orbitalėje ($C=N$), o jo laisvoji pora guli plokštumoje. Pirole azoto pora guli $p$ orbitalėje ir būtina sekstetui.', 'In pyridine the nitrogen already gives one electron in a $p$ orbital ($C=N$) and its lone pair lies in the plane. In pyrrole the nitrogen pair sits in a $p$ orbital and completes the sextet.'))
        ],
        why: t('Abu junginiai turi 6 π elektronus, bet piridino azoto pora lieka žiedo plokštumoje.', 'Both compounds have 6 π electrons, but the pyridine nitrogen pair stays in the ring plane.'),
        src: 'L9 p6'
      },
      {
        id: 'u09.huckel.5',
        q: [{ p: t('Furano deguonis turi dvi laisvąsias poras.', 'The oxygen of furan has two lone pairs.') }, { mol: { smi: 'c1ccoc1', name: t('furanas', 'furan'), opts: { lonePairs: true } } }],
        steps: [
          { prompt: t('Kiek π elektronų turi furano žiedas?', 'How many π electrons does the furan ring have?'), kind: 'number', answer: { value: 6, tol: 0 },
            hint: t('Ar abi deguonies poros guli $p$ orbitalėje?', 'Do both oxygen pairs lie in a $p$ orbital?'), solution: t('Dvi C=C – 4 elektronai, viena deguonies pora $p$ orbitalėje – 2; kita pora guli plokštumoje: 6.', 'Two C=C give 4 electrons and one oxygen pair in a $p$ orbital gives 2; the other pair lies in the plane: 6.') }
        ],
        why: t('Iš dviejų deguonies porų į π sistemą įeina tik viena.', 'Of the two oxygen pairs only one joins the π system.'),
        src: 'L9 p6', claims: [{ aromatic: ['c1ccoc1', true] }]
      },
      {
        id: 'u09.huckel.6',
        q: [{ p: t('Ciklooktatetraenas turi 8 π elektronus ir keturis dvigubuosius ryšius.', 'Cyclooctatetraene has 8 π electrons and four double bonds.') }, { mol: { smi: 'C1=CC=CC=CC=C1' } }],
        steps: [
          ch(t('Kodėl jis nearomatinis?', 'Why is it not aromatic?'),
            [tx('8 = 4n, o ne 4n + 2; be to, žiedas nėra plokščias', '8 = 4n, not 4n + 2; besides, the ring is not planar'), tx('turi per daug anglies atomų', 'it has too many carbon atoms'), tx('žiede nėra konjuguotų ryšių', 'the ring has no conjugated bonds'), tx('8 yra lyginis skaičius, o aromatiniai junginiai turi nelyginį π elektronų skaičių', '8 is even, and aromatic compounds have an odd number of π electrons')], 0,
            t('Palyginkite 8 su $4n + 2$ reikšmėmis: 2, 6, 10.', 'Compare 8 with the values of $4n + 2$: 2, 6, 10.'),
            t('Hiukelio taisyklei reikia 2, 6, 10 ... elektronų; 8 netinka.', 'Hückel’s rule needs 2, 6, 10 ... electrons; 8 does not fit.'))
        ],
        why: t('Žiedo dydis ir dvigubųjų ryšių skaičius aromatiškumo neapsprendžia: lemia π elektronų skaičius $4n + 2$ ir plokščia konjuguota sistema.', 'Ring size and the number of double bonds do not decide aromaticity: what counts is a planar conjugated system with $4n + 2$ π electrons.'),
        src: 'L9 p6', claims: [{ aromatic: ['C1=CC=CC=CC=C1', false] }]
      },
      {
        id: 'u09.huckel.7',
        q: [{ p: t('Nurodykite po vieną aromatinį junginį, turintį 2, 6 ir 10 π elektronų.', 'Give examples of aromatic compounds with 2, 6 and 10 π electrons.') }],
        steps: [{
          prompt: t('Priskirkite junginius π elektronų skaičiui.', 'Match the compounds to their number of π electrons.'), kind: 'match',
          answer: { left: [ml('[CH+]1C=C1'), ml('c1ccccc1'), ml('c1ccc2ccccc2c1')], right: [tx('2', '2'), tx('6', '6'), tx('10', '10')], pairs: [0, 1, 2] },
          hint: t('Suskaičiuokite dvigubuosius ryšius ir pridėkite laisvąsias poras $p$ orbitalėse.', 'Count the double bonds and add lone pairs in $p$ orbitals.'),
          solution: t('Ciklopropenilo katijonas: 1 C=C (2). Benzenas: 3 C=C (6). Naftalenas: 5 C=C (10).', 'Cyclopropenyl cation: 1 C=C (2). Benzene: 3 C=C (6). Naphthalene: 5 C=C (10).')
        }],
        why: t('Šie skaičiai atitinka $4n + 2$ su $n$ = 0, 1, 2.', 'These numbers fit $4n + 2$ with $n$ = 0, 1, 2.'),
        src: 'S4.17', claims: [{ aromatic: ['[CH+]1C=C1', true] }, { aromatic: ['c1ccc2ccccc2c1', true] }]
      },
      {
        id: 'u09.huckel.8',
        q: [{ p: t('Benzenas $KMnO4$ neoksiduoja ir bromo neprijungia.', 'Benzene is not oxidised by $KMnO4$ and does not add bromine.') }, { mol: { smi: 'c1ccccc1', opts: { circle: true } } }],
        steps: [
          ch(t('Kodėl benzenas nesijungia kaip alkenas?', 'Why does benzene not add reagents like an alkene?'),
            [tx('prijungimas suardytų aromatinę sistemą ir prarastų jos stabilumą', 'addition would destroy the aromatic system and lose its stability'), tx('benzene nėra π elektronų', 'benzene has no π electrons'), tx('benzenas per mažai polinis', 'benzene is too non-polar'), tx('žiedo C atomai yra $sp3$', 'the ring carbons are $sp3$')], 0,
            t('Palyginkite, kas lieka po prijungimo ir po pakeitimo.', 'Compare what is left after addition and after substitution.'),
            t('Po pakeitimo aromatinis žiedas išlieka, po prijungimo – ne.', 'After substitution the aromatic ring stays, after addition it does not.'))
        ],
        why: t('Aromatinis stabilumas lemia, kad benzenas renkasi pakeitimo (SEAr) reakcijas.', 'Aromatic stability makes benzene prefer substitution (SEAr) reactions.'),
        src: 'L9 p4, p6'
      }
    ]
  });

  // ---- u09.mech (lecture only) ----
  types.push({
    id: 'u09.mech',
    title: t('SEAr mechanizmas ir elektrofilai', 'The SEAr mechanism and the electrophiles'),
    mirrors: [],
    bank: [
      {
        id: 'u09.mech.1',
        q: [{ p: t('SEAr reakcija turi tris stadijas.', 'An SEAr reaction has three stages.') }],
        steps: [{
          prompt: t('Išdėstykite stadijas teisinga tvarka.', 'Put the stages in the right order.'), kind: 'order',
          options: [tx('reagentas poliarizuojasi ir susidaro elektrofilas $E+$', 'the reagent is polarised and the electrophile $E+$ forms'), tx('π elektronai atakuoja $E+$: susidaro arenio jonas (lėtoji stadija)', 'the π electrons attack $E+$: the arenium ion forms (slow stage)'), tx('bazė atplėšia $H+$ ir atsistato aromatiškumas (greitoji stadija)', 'a base removes $H+$ and aromaticity is restored (fast stage)')],
          hint: t('Pirma reikia atakuojančios dalelės, o aromatiškumas atsistato paskutinis.', 'The attacking particle is needed first, and aromaticity is restored last.'),
          solution: t('I – elektrofilo susidarymas; II – arenio jonas; III – protono atskilimas.', 'I – formation of the electrophile; II – the arenium ion; III – loss of the proton.')
        }],
        why: t('Aromatiškumas prarandamas tik trumpam, arenio jone, ir atgaunamas netekus protono.', 'Aromaticity is lost only briefly, in the arenium ion, and regained by losing a proton.'),
        src: 'L9 p8–10'
      },
      {
        id: 'u09.mech.2',
        q: [{ p: t('Benzeno nitrinimo energijos profilyje yra du pereinamieji taškai: arenio jono susidarymas ir protono atskilimas.', 'The energy profile of benzene nitration has two transition states: formation of the arenium ion and loss of the proton.') }],
        steps: [
          ch(t('Kuri stadija lėtesnė ir lemia reakcijos greitį?', 'Which stage is slower and sets the reaction rate?'),
            [tx('arenio jono susidarymas (II stadija)', 'formation of the arenium ion (stage II)'), tx('protono atskilimas (III stadija)', 'loss of the proton (stage III)'), tx('abi vienodai', 'both equally'), tx('jokia: reakcija vyksta vienu žingsniu', 'neither: the reaction goes in one step')], 0,
            t('Kurioje stadijoje prarandamas aromatiškumas?', 'In which stage is aromaticity lost?'),
            t('Aromatiškumo praradimas brangus, todėl II stadija lėta; III stadijoje aromatiškumas atsistato, ji greita.', 'Losing aromaticity is costly, so stage II is slow; in stage III aromaticity returns and it is fast.')),
          ch(t('Ką tai reiškia pakaitui, stabilizuojančiam arenio joną?', 'What does this mean for a substituent that stabilises the arenium ion?'),
            [tx('reakcija greitesnė', 'the reaction is faster'), tx('reakcija lėtesnė', 'the reaction is slower'), tx('greitis nepasikeičia', 'the rate does not change'), tx('reakcija tampa grįžtamoji', 'the reaction becomes reversible')], 0,
            t('Stabilesnis tarpinis junginys reiškia mažesnį barjerą.', 'A more stable intermediate means a lower barrier.'),
            t('Stabilesnis arenio jonas sumažina lėtosios stadijos barjerą.', 'A more stable arenium ion lowers the barrier of the slow stage.'))
        ],
        why: t('Lėtoji stadija lemia greitį, todėl arenio jono stabilumas lemia, kaip greitai reaguoja arenas.', 'The slow stage sets the rate, so the stability of the arenium ion decides how fast an arene reacts.'),
        src: 'L9 p9'
      },
      {
        id: 'u09.mech.3',
        q: [{ p: t('Benzenas nitrinamas $HNO3$ ir $H2SO4$ mišiniu.', 'Benzene is nitrated with a mixture of $HNO3$ and $H2SO4$.') }],
        steps: [
          ch(t('Kuri dalelė atakuoja benzeną?', 'Which particle attacks benzene?'), [ml('O=[N+]=O'), ml('O[N+](=O)[O-]'), ml('[O-][N+](=O)[O-]'), ml('[O-]N=O')], 0,
            t('Sieros rūgštis protonizuoja azoto rūgštį, ir ši praranda vandenį.', 'Sulfuric acid protonates nitric acid, which then loses water.'),
            [{ p: t('$H2SO4$ protonizuoja $HNO3$; netekęs $H2O$ susidaro nitronio jonas $NO2+$ – stiprus elektrofilas.', '$H2SO4$ protonates $HNO3$; after losing $H2O$ the nitronium ion $NO2+$ forms, a strong electrophile.') }, sch([mm('O[N+](=O)[O-]'), { plus: true }, mm('OS(=O)(=O)O'), { arrow: '⇌' }, mm('O=[N+]=O'), { plus: true }, mm('O'), { plus: true }, mm('[O-]S(=O)(=O)O')])])
        ],
        why: t('Pats $HNO3$ nepakankamai elektrofiliškas; rūgštis jį paverčia nitronio jonu.', '$HNO3$ itself is not electrophilic enough; the acid turns it into the nitronium ion.'),
        src: 'L9 p14'
      },
      {
        id: 'u09.mech.4',
        q: [{ p: t('Benzenas su $Br2$ nereaguoja, bet su $Br2$ ir $FeBr3$ – reaguoja.', 'Benzene does not react with $Br2$, but it does with $Br2$ and $FeBr3$.') }],
        steps: [
          ch(t('Ką daro $FeBr3$?', 'What does $FeBr3$ do?'),
            [tx('Liuiso rūgštis poliarizuoja $Br-Br$ ryšį ir padeda sukurti $Br+$', 'as a Lewis acid it polarises the $Br-Br$ bond and helps to make $Br+$'), tx('yra nukleofilas, atakuojantis žiedą', 'it is a nucleophile that attacks the ring'), tx('atplėšia protoną nuo arenio jono', 'it removes the proton from the arenium ion'), tx('redukuoja benzeną', 'it reduces benzene')], 0,
            t('Prisiminkite, ką $AlCl3$ daro su $RCl$.', 'Recall what $AlCl3$ does with $RCl$.'),
            t('$FeBr3$ priima elektronų porą iš bromo, todėl vienas bromo atomas tampa elektrofilu.', '$FeBr3$ accepts an electron pair from bromine, so one bromine atom becomes an electrophile.'))
        ],
        why: t('Katalizatorius dalyvauja tik I stadijoje: jis sukuria elektrofilą, o pats išsiskiria nepakitęs.', 'The catalyst acts only in stage I: it makes the electrophile and is recovered unchanged.'),
        src: 'L9 p8, p13'
      },
      {
        id: 'u09.mech.5',
        q: [{ p: t('Benzenui atakuojant $Br+$, susidaro arenio jonas.', 'When benzene attacks $Br+$, an arenium ion forms.') }, { mol: { smi: 'BrC1C=CC=C[CH+]1' } }],
        steps: [
          { prompt: t('Bakstelėkite anglies atomą, kuris tapo $sp3$.', 'Tap the carbon that became $sp3$.'), kind: 'atoms', mol: { smi: 'BrC1C=CC=C[CH+]1', opts: { numbers: 'all' } }, answer: [1],
            hint: t('Kuris žiedo atomas gavo naują ryšį ir nebeturi $p$ orbitalės π sistemoje?', 'Which ring atom got a new bond and no longer has a $p$ orbital in the π system?'),
            solution: t('Atomas Nr. 2 (pririštas prie $Br$) turi keturis σ ryšius ir yra $sp3$.', 'Atom no. 2 (bonded to $Br$) has four σ bonds and is $sp3$.') },
          ch(t('Kiek π elektronų yra penkiose $sp2$ anglyse?', 'How many π electrons are in the five $sp2$ carbons?'), [tx('4', '4'), tx('6', '6'), tx('5', '5'), tx('2', '2')], 0,
            t('Du π elektronai panaudoti naujam $C-Br$ ryšiui.', 'Two π electrons were used for the new $C-Br$ bond.'),
            t('Iš šešių π elektronų du sudarė ryšį su $Br$, lieka 4, pasiskirstę penkiose $p$ orbitalėse.', 'Of the six π electrons two formed the bond to $Br$; 4 remain, spread over five $p$ orbitals.'))
        ],
        why: t('Arenio jonas nearomatinis: ciklą pertraukia $sp3$ atomas, o 4 π elektronai nedaro $4n + 2$.', 'The arenium ion is not aromatic: an $sp3$ carbon interrupts the ring and 4 π electrons are not $4n + 2$.'),
        src: 'L9 p9, T p62'
      },
      {
        id: 'u09.mech.6',
        q: [{ p: t('Arenio jonas gali prijungti bromidą arba netekti protono.', 'The arenium ion can add bromide or lose a proton.') }],
        steps: [
          ch(t('Kodėl vyksta pakeitimas, o ne prijungimas?', 'Why does substitution happen rather than addition?'),
            [tx('netekęs $H+$ jonas atgauna aromatinį žiedą, o prijungimas jo neatgautų', 'by losing $H+$ the ion regains an aromatic ring, which addition would not'), tx('bromidas negali atakuoti katijono', 'bromide cannot attack a cation'), tx('pakeitimo produktas turi mažiau vandenilių', 'the substitution product has fewer hydrogens'), tx('prijungimas reikalauja aukštos temperatūros visada', 'addition always needs a high temperature')], 0,
            t('Palyginkite abiejų produktų aromatiškumą.', 'Compare the aromaticity of the two products.'),
            t('Pakeitimo produktas aromatinis, todėl energetiškai naudingesnis.', 'The substitution product is aromatic and therefore energetically better.'))
        ],
        why: t('Aromatinis stabilumas „nukreipia“ arenio joną į protono atskilimą.', 'Aromatic stability steers the arenium ion toward loss of the proton.'),
        src: 'L9 p10'
      },
      {
        id: 'u09.mech.7',
        q: [{ p: t('Benzenas kaitinamas su sieros rūgštimi, susidaro benzensulfonrūgštis ir vanduo.', 'Benzene is heated with sulfuric acid to give benzenesulfonic acid and water.') }, { scheme: { items: [ml('c1ccccc1').mol, { plus: true }, ml('OS(=O)(=O)O').mol, { arrow: '⇌', above: f('t°') }, ml('OS(=O)(=O)c1ccccc1', { name: t('benzensulfonrūgštis', 'benzenesulfonic acid') }).mol, { plus: true }, ml('O').mol] } }],
        steps: [
          ch(t('Kuo sulfoninimas skiriasi nuo nitrinimo ir halogeninimo?', 'How does sulfonation differ from nitration and halogenation?'),
            [tx('jis grįžtamasis', 'it is reversible'), tx('jis vyksta kitu mechanizmu', 'it follows a different mechanism'), tx('elektrofilas yra nukleofilas', 'the electrophile is a nucleophile'), tx('jis nevyksta su benzenu', 'it does not occur with benzene')], 0,
            t('Pažiūrėkite į reakcijos rodyklę.', 'Look at the reaction arrow.'),
            t('Schemoje yra ⇌: sulfoninimas yra grįžtamoji SEAr reakcija.', 'The scheme has ⇌: sulfonation is a reversible SEAr reaction.'))
        ],
        why: t('Mechanizmas tas pats (SEAr, elektrofilas $SO3H+$), bet pusiausvyra pasiekiama.', 'The mechanism is the same (SEAr, electrophile $SO3H+$), but an equilibrium is reached.'),
        src: 'L9 p15', claims: [{ name: ['OS(=O)(=O)c1ccccc1', t('benzensulfonrūgštis', 'benzenesulfonic acid')] }]
      },
      {
        id: 'u09.mech.8',
        q: [{ p: t('Laboratorijoje naftalenas kaitinamas su koncentruota $HNO3$, o mišinys praskiedžiamas šaltu vandeniu.', 'In the lab naphthalene is heated with concentrated $HNO3$ and the mixture is diluted with cold water.') }, { mol: { smi: 'c1ccc2ccccc2c1' } }],
        steps: [
          ch(t('Kuris produktas susidaro?', 'Which product forms?'), [ml('[O-][N+](=O)c1cccc2ccccc12', { name: t('1-nitronaftalenas', '1-nitronaphthalene') }), ml('[O-][N+](=O)c1ccc2ccccc2c1', { name: t('2-nitronaftalenas', '2-nitronaphthalene') })], 0,
            t('Palyginkite, kurios padėties arenio jonas turi daugiau rezonansinių formulių su išlikusiu benzeno žiedu.', 'Compare which position gives an arenium ion with more resonance structures that keep an intact benzene ring.'),
            t('Naftalenas atakuojamas α padėtyje (1-).', 'Naphthalene is attacked at the α position (1).')),
          ch(t('Ką matome mėgintuvėlyje?', 'What do we observe in the test tube?'),
            [tx('oranžinį aliejinį sluoksnį, kuris praskiedus vandeniu nusėda ir sukietėja į geltonas nuosėdas', 'an orange oily layer that sinks when diluted with water and solidifies to a yellow precipitate'), tx('bespalvį tirpalą be pokyčių', 'a colourless solution with no change'), tx('žalias dujas', 'green gas'), tx('mėlynas kristalines nuosėdas', 'a blue crystalline precipitate')], 0,
            t('Nitrojunginiams būdinga geltona spalva.', 'Nitro compounds are typically yellow.'),
            t('Susidaręs nitronaftalenas nesimaišo su vandeniu.', 'The nitronaphthalene formed does not mix with water.'))
        ],
        why: t('Naftalenas reaguoja lengviau už benzeną ir atakuojamas α padėtyje; produktas matomas kaip oranžinis aliejus, vėliau – geltonos nuosėdos.', 'Naphthalene reacts more easily than benzene and is attacked at the α position; the product shows as an orange oil and later a yellow solid.'),
        src: 'LW6 p1, T p66', claims: [{ name: ['[O-][N+](=O)c1cccc2ccccc12', t('1-nitronaftalenas', '1-nitronaphthalene')] }]
      },
      {
        id: 'u09.mech.9',
        q: [{ p: t('Trys reakcijos: benzenas su $Br2$/$FeBr3$, toluenas su $Br2$/$hν$ ir cikloheksenas su $HBr$.', 'Three reactions: benzene with $Br2$/$FeBr3$, toluene with $Br2$/$hν$, and cyclohexene with $HBr$.') }],
        steps: [{
          prompt: t('Priskirkite mechanizmo simbolį.', 'Match the mechanism symbol.'), kind: 'match',
          answer: { left: [tx('benzenas, $Br2$, $FeBr3$', 'benzene, $Br2$, $FeBr3$'), tx('toluenas, $Br2$, $hν$', 'toluene, $Br2$, $hν$'), tx('cikloheksenas, $HBr$', 'cyclohexene, $HBr$')], right: [tx('SEAr', 'SEAr'), tx('SR', 'SR'), tx('AE', 'AE')], pairs: [0, 1, 2] },
          hint: t('Kas atakuoja: elektrofilas ant žiedo, radikalas ant grandinės ar elektrofilas ant C=C?', 'What attacks: an electrophile on the ring, a radical on the chain, or an electrophile on C=C?'),
          solution: t('Žiedo pakeitimas elektrofilu – SEAr; grandinės radikalinis pakeitimas – SR; prijungimas prie C=C – AE.', 'Ring substitution by an electrophile is SEAr; radical substitution on the chain is SR; addition to C=C is AE.')
        }],
        why: t('Mechanizmą lemia sąlygos ir junginio tipas.', 'The conditions and the type of compound decide the mechanism.'),
        src: 'L9 p12, p21'
      }
    ]
  });

  // ---- u09.fc (S4.8 c, d; S4.18) ----
  const NB = '[O-][N+](=O)c1ccccc1';
  types.push({
    id: 'u09.fc',
    title: t('Friedelio ir Krafto reakcijos: ribos ir produktai', 'Friedel–Crafts reactions: limits and products'),
    mirrors: ['S4.8', 'S4.18'],
    bank: [
      {
        id: 'u09.fc.1',
        q: [{ p: t('Nitrobenzenas kaitinamas su $CH3Cl$ ir $AlCl3$.', 'Nitrobenzene is heated with $CH3Cl$ and $AlCl3$.') }, sch([mm(NB), { arrow: '→', above: f('CH3Cl, AlCl3') }])],
        steps: [ch(t('Kas vyksta?', 'What happens?'), [tx('reakcija nevyksta', 'no reaction'), ml('Cc1cccc(c1)[N+](=O)[O-]'), ml('Cc1ccc(cc1)[N+](=O)[O-]'), ml('Cc1ccccc1[N+](=O)[O-]')], 0,
          t('Ar toks žiedas pakankamai reaktyvus Friedelio–Krafto reakcijai?', 'Is such a ring reactive enough for a Friedel–Crafts reaction?'),
          t('Nitrogrupė stipriai deaktyvuoja žiedą, todėl alkilinimas nevyksta.', 'The nitro group deactivates the ring strongly, so alkylation does not take place.'))],
        why: t('Friedelio–Krafto reakcijos reikalauja pakankamai elektronais turtingo žiedo; stiprūs EA pakaitai jas užblokuoja.', 'Friedel–Crafts reactions need a sufficiently electron-rich ring; strong EA groups block them.'),
        src: 'L9 p16'
      },
      {
        id: 'u09.fc.2',
        q: [{ p: t('Anilinas bandomas acilinti $CH3COCl$ ir $AlCl3$.', 'Aniline is treated with $CH3COCl$ and $AlCl3$.') }, { mol: { smi: 'Nc1ccccc1', name: t('anilinas', 'aniline') } }],
        steps: [ch(t('Kodėl C-acilinimas nevyksta?', 'Why does C-acylation fail?'),
          [tx('aminogrupė su $AlCl3$ sudaro kompleksą, žiedas deaktyvuojamas', 'the amino group forms a complex with $AlCl3$ and the ring is deactivated'), tx('aminogrupė yra m-orientantas', 'the amino group is a meta director'), tx('anilinas per stabilus', 'aniline is too stable'), tx('žiede nėra π elektronų', 'the ring has no π electrons')], 0,
          t('Prisiminkite, kas yra $AlCl3$ ir ką turi azoto atomas.', 'Remember what $AlCl3$ is and what the nitrogen atom has.'),
          t('$AlCl3$ yra Liuiso rūgštis, azotas – bazė su laisvąja pora; susidaręs kompleksas deaktyvuoja žiedą.', '$AlCl3$ is a Lewis acid and nitrogen is a base with a lone pair; the complex that forms deactivates the ring.'))],
        why: t('Aminogrupė yra stiprus donoras, bet Friedelio–Krafto sąlygomis ji reaguoja su katalizatoriumi.', 'The amino group is a strong donor, but under Friedel–Crafts conditions it reacts with the catalyst.'),
        src: 'L9 p16'
      },
      {
        id: 'u09.fc.3',
        q: [{ p: t('Benzenas reaguoja su 1 ekvivalentu $CH3Cl$ ir $AlCl3$, bet gaunamas ir ksilenų, ir trimetilbenzenų mišinys.', 'Benzene reacts with 1 equivalent of $CH3Cl$ and $AlCl3$, but a mixture containing xylenes and trimethylbenzenes forms.') }],
        steps: [ch(t('Kodėl taip nutinka?', 'Why does this happen?'),
          [tx('toluenas reaktyvesnis už benzeną, todėl alkilinamas toliau', 'toluene is more reactive than benzene, so it is alkylated further'), tx('toluenas mažiau reaktyvus už benzeną', 'toluene is less reactive than benzene'), tx('$AlCl3$ pati prijungia metilą', '$AlCl3$ itself adds methyl'), tx('chlormetanas persigrupuoja', 'chloromethane rearranges')], 0,
          t('Kaip alkilgrupė veikia žiedo reaktyvumą?', 'How does an alkyl group affect the reactivity of the ring?'),
          t('Alkilas silpnai aktyvuoja žiedą, todėl produktas reaguoja greičiau už pradinį junginį.', 'An alkyl group activates the ring weakly, so the product reacts faster than the starting compound.'))],
        why: t('Todėl alkilinant naudojamas benzeno perteklius, o acilinant polisubstitucijos nėra.', 'That is why an excess of benzene is used in alkylation, and acylation has no polysubstitution.'),
        src: 'L9 p16'
      },
      {
        id: 'u09.fc.4',
        q: [{ p: t('Benzenas reaguoja su 1-chlorbutanu ($CH3CH2CH2CH2Cl$) ir $AlCl3$.', 'Benzene reacts with 1-chlorobutane ($CH3CH2CH2CH2Cl$) and $AlCl3$.') }, sch([mm('c1ccccc1', { opts: { circle: true } }), { plus: true }, mm('CCCCCl', { name: t('1-chlorbutanas', '1-chlorobutane') }), { arrow: '→', above: f('AlCl3') }])],
        steps: [
          { prompt: t('Pažymėkite visus produktus, kurie susidaro.', 'Pick every product that forms.'), kind: 'multi', options: [ml('CCCCc1ccccc1'), ml('CCC(C)c1ccccc1'), ml('CC(C)(C)c1ccccc1'), ml('CC(C)Cc1ccccc1')], answer: [0, 1],
            hint: t('Pirminis karbokatijonas gali persigrupuoti į stabilesnį, bet anglies skeletas nekeičiamas.', 'A primary carbocation can rearrange to a more stable one, but the carbon skeleton is not changed.'),
            solution: [{ p: t('Susidaro nešakotas produktas ir antrinis (po hidrido poslinkio). $tret$-Butilo ir izobutilo skeletų iš $n$-butilo gauti negalima.', 'The unbranched product and the secondary one (after a hydride shift) form. tert-Butyl and isobutyl skeletons cannot come from an n-butyl chain.') },
              sch([mm('CCC[CH2+]'), { arrow: '→', above: t('H− poslinkis', 'H− shift') }, mm('CC[CH+]C')])] },
          ch(t('Kodėl susidaro šakotas produktas?', 'Why does a branched product form?'),
            [tx('pirminis katijonas hidrido poslinkiu virsta stabilesniu antriniu', 'the primary cation becomes the more stable secondary one by a hydride shift'), tx('žiedas persigrupuoja', 'the ring rearranges'), tx('$AlCl3$ šakoja grandinę', '$AlCl3$ branches the chain'), tx('reakcija eina per radikalą', 'the reaction goes through a radical')], 0,
            t('Palyginkite pirminio ir antrinio karbokatijono stabilumą.', 'Compare the stability of primary and secondary carbocations.'),
            t('Antrinis katijonas stabilesnis už pirminį, todėl vandenilis juda su savo elektronų pora.', 'A secondary cation is more stable than a primary one, so a hydrogen moves with its electron pair.'))
        ],
        why: t('Ilgesnės grandinės halogenalkanai alkilinant persigrupuoja, todėl alkilinimu sunku gauti nešakotą grandinę.', 'Longer alkyl halides rearrange in alkylation, so an unbranched chain is hard to get this way.'),
        src: 'L9 p16'
      },
      {
        id: 'u09.fc.5',
        q: [{ p: t('Toluenas acilinamas $CH3COCl$ ir $AlCl3$ (paskui $H2O$).', 'Toluene is acylated with $CH3COCl$ and $AlCl3$ (then $H2O$).') }, sch([mm('Cc1ccccc1', { name: t('toluenas', 'toluene') }), { arrow: '→', above: f('1. CH3COCl, AlCl3'), below: f('2. H2O') }])],
        steps: [
          { prompt: t('Pažymėkite pagrindinius produktus.', 'Pick the main products.'), kind: 'multi', options: [ml('Cc1ccccc1C(C)=O'), ml('Cc1ccc(cc1)C(C)=O'), ml('Cc1cccc(c1)C(C)=O'), ml('CC(=O)Cc1ccccc1')], answer: [0, 1],
            hint: t('Ką kreipia metilgrupė? Ir ar acilas gali prisijungti prie metilo?', 'What does a methyl group direct? And can the acyl group bond to the methyl?'),
            solution: t('Metilas – o-/p-orientantas, todėl acetilgrupė patenka į o- ir p- padėtis. Fenilacetonas (ketvirtas variantas) reikalautų pakeisti metilo vandenilį.', 'Methyl is an o/p director, so the acetyl group goes to the o and p positions. The fourth option would need a methyl hydrogen replaced.') }
        ],
        why: t('Acilinimas yra SEAr: acilio jonas atakuoja žiedą pagal pakaito orientaciją.', 'Acylation is SEAr: the acylium ion attacks the ring according to the directing effect.'),
        src: 'L9 p35', claims: [{ react: ['sear', ['Cc1ccccc1'], { E: 'C(C)=O' }, 'Cc1ccc(cc1)C(C)=O'] }, { react: ['sear', ['Cc1ccccc1'], { E: 'C(C)=O' }, 'Cc1ccccc1C(C)=O'] }]
      },
      {
        id: 'u09.fc.6',
        q: [{ p: t('Pasirinkite metodą: iš benzeno norima gauti ketoną, ir žiede neturi atsirasti antros acilgrupės.', 'You want a ketone from benzene, with no second acyl group on the ring.') }],
        steps: [ch(t('Kodėl acilinant polisubstitucija nevyksta?', 'Why is there no polysubstitution in acylation?'),
          [tx('karbonilo grupė deaktyvuoja žiedą', 'the carbonyl group deactivates the ring'), tx('acilgrupė aktyvuoja žiedą', 'the acyl group activates the ring'), tx('ketonas netirpsta', 'the ketone does not dissolve'), tx('$AlCl3$ pasibaigia', '$AlCl3$ runs out')], 0,
          t('Palyginkite alkilo ir acilo poveikį žiedui.', 'Compare the effect of alkyl and acyl groups on the ring.'),
          t('Acilgrupė yra m-orientantas ir deaktyvuoja žiedą, todėl produktas reaguoja lėčiau už pradinį junginį.', 'An acyl group is a meta director and deactivates the ring, so the product reacts more slowly than the starting material.'))],
        why: t('Todėl acilinimas – patogesnis būdas įvesti vieną grandinę.', 'So acylation is the cleaner way to attach a single chain.'),
        src: 'L9 p16–17'
      },
      {
        id: 'u09.fc.7',
        q: [{ p: t('$CH3COCl$ reaguoja su $AlCl3$.', '$CH3COCl$ reacts with $AlCl3$.') }],
        steps: [ch(t('Kuri dalelė yra elektrofilas?', 'Which particle is the electrophile?'),
          [tx('acilio jonas $CH3-C≡O+$', 'the acylium ion $CH3-C≡O+$'), tx('chlorido jonas $Cl-$', 'the chloride ion $Cl-$'), tx('metilo katijonas $CH3+$', 'the methyl cation $CH3+$'), tx('chloro radikalas', 'a chlorine radical')], 0,
          t('$AlCl3$ ištraukia chloridą.', '$AlCl3$ pulls out chloride.'),
          t('Chloridas pereina prie $AlCl3$ ir susidaro $AlCl4-$, o likusi dalis yra acilio jonas, stabilizuotas rezonansu.', 'Chloride goes to $AlCl3$ to give $AlCl4-$, and what is left is the acylium ion, stabilised by resonance.'))],
        why: t('Acilio jonas nepersigrupuoja, todėl acilinant gaunama nešakota grandinė.', 'The acylium ion does not rearrange, so acylation gives an unbranched chain.'),
        src: 'L9 p17'
      },
      {
        id: 'u09.fc.8',
        q: [{ p: t('Metoksibenzenas acilinamas $CH3COCl$ ir $AlCl3$.', 'Methoxybenzene is acylated with $CH3COCl$ and $AlCl3$.') }, sch([mm('COc1ccccc1', { name: t('metoksibenzenas', 'methoxybenzene') }), { arrow: '→', above: f('CH3COCl, AlCl3') }])],
        steps: [{ prompt: t('Pažymėkite pagrindinius produktus.', 'Pick the main products.'), kind: 'multi', options: [ml('COc1ccccc1C(C)=O'), ml('COc1ccc(cc1)C(C)=O'), ml('COc1cccc(c1)C(C)=O')], answer: [0, 1],
          hint: t('Ką kreipia $OCH3$?', 'What does $OCH3$ direct?'), solution: t('$OCH3$ – o-/p-orientantas (+M).', '$OCH3$ is an o/p director (+M).') }],
        why: t('Stiprūs donorai aktyvuoja žiedą, todėl acilinimas vyksta lengvai ir į o-/p- padėtis.', 'Strong donors activate the ring, so acylation goes easily and to the o/p positions.'),
        src: 'S4.18, L9 p25', claims: [{ react: ['sear', ['COc1ccccc1'], { E: 'C(C)=O' }, 'COc1ccc(cc1)C(C)=O'] }]
      },
      {
        id: 'u09.fc.9',
        q: [{ p: t('Benzenas reaguoja su $tret$-butilchloridu ir $AlCl3$.', 'Benzene reacts with tert-butyl chloride and $AlCl3$.') }, sch([mm('c1ccccc1', { opts: { circle: true } }), { plus: true }, mm('CC(C)(C)Cl'), { arrow: '→', above: f('AlCl3') }])],
        steps: [ch(t('Koks produktas?', 'What is the product?'), [ml('CC(C)(C)c1ccccc1'), ml('CCC(C)c1ccccc1'), ml('CC(C)Cc1ccccc1'), ml('CCCCc1ccccc1')], 0,
          t('Koks karbokatijonas susidaro ir ar jis turi kur persigrupuoti?', 'Which carbocation forms, and has it anywhere to rearrange to?'),
          t('Susidaro tretinis katijonas – stabiliausias, todėl persigrupavimo nėra.', 'A tertiary cation forms, the most stable one, so there is no rearrangement.'))],
        why: t('Persigrupuoja tik tie katijonai, kurie gali tapti stabilesni.', 'Only cations that can become more stable rearrange.'),
        src: 'L9 p16', claims: [{ react: ['sear', ['c1ccccc1'], { E: 'C(C)(C)C' }, 'CC(C)(C)c1ccccc1'] }]
      }
    ]
  });

  // ---- u09.synth (S4.19) ----
  const ord = (prompt, opts, hint, solution) => ({ prompt, kind: 'order', options: opts, hint, solution });
  types.push({
    id: 'u09.synth',
    title: t('Kelių pakopų sintezės', 'Multi-step syntheses'),
    mirrors: ['S4.19'],
    bank: [
      {
        id: 'u09.synth.1',
        q: [{ p: t('Iš tolueno reikia gauti 4-nitrobenzenkarboksirūgštį.', 'Make 4-nitrobenzoic acid from toluene.') }, sch([mm('Cc1ccccc1'), { arrow: '→' }, mm('OC(=O)c1ccc(cc1)[N+](=O)[O-]', { name: t('4-nitrobenzenkarboksirūgštis', '4-nitrobenzoic acid') })])],
        steps: [ord(t('Išdėstykite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
          [tx('$HNO3$, $H2SO4$ (nitrinimas)', '$HNO3$, $H2SO4$ (nitration)'), tx('p-izomero atskyrimas', 'separate the p isomer'), tx('$KMnO4$, $t°$ (metilas virsta $COOH$)', '$KMnO4$, $t°$ (methyl becomes $COOH$)')],
          t('Kuri grupė kreipia nitrogrupę į para padėtį: $CH3$ ar $COOH$?', 'Which group sends the nitro group to the para position: $CH3$ or $COOH$?'),
          [{ p: t('Pirma nitrinama (metilas kreipia į o-/p-), tada p-izomeras oksiduojamas.', 'Nitrate first (methyl directs o/p), then oxidise the p isomer.') }, sch([mm('Cc1ccccc1'), ar('HNO3, H2SO4'), mm('Cc1ccc(cc1)[N+](=O)[O-]'), ar('KMnO4, t°'), mm('OC(=O)c1ccc(cc1)[N+](=O)[O-]')])])],
        why: t('$CH3$ yra o-/p-orientantas, o $COOH$ – m-orientantas: tvarka nulemia izomerą.', '$CH3$ is an o/p director and $COOH$ a meta director: the order decides the isomer.'),
        src: 'L9 p34, p36', claims: [{ react: ['sear', ['Cc1ccccc1'], { E: 'NO2' }, 'Cc1ccc(cc1)[N+](=O)[O-]'] }, { react: ['side.ox', ['Cc1ccc(cc1)[N+](=O)[O-]'], null, 'OC(=O)c1ccc(cc1)[N+](=O)[O-]'] }, { name: ['OC(=O)c1ccc(cc1)[N+](=O)[O-]', t('4-nitrobenzenkarboksirūgštis', '4-nitrobenzoic acid')] }]
      },
      {
        id: 'u09.synth.2',
        q: [{ p: t('Iš tolueno reikia gauti 3-nitrobenzenkarboksirūgštį.', 'Make 3-nitrobenzoic acid from toluene.') }, sch([mm('Cc1ccccc1'), { arrow: '→' }, mm('OC(=O)c1cccc(c1)[N+](=O)[O-]', { name: t('3-nitrobenzenkarboksirūgštis', '3-nitrobenzoic acid') })])],
        steps: [ord(t('Išdėstykite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
          [tx('$KMnO4$, $t°$ (oksidavimas iki $COOH$)', '$KMnO4$, $t°$ (oxidation to $COOH$)'), tx('$HNO3$, $H2SO4$ (nitrinimas)', '$HNO3$, $H2SO4$ (nitration)'), tx('produkto išskyrimas ir gryninimas', 'isolation and purification of the product')],
          t('Pirma gaukite m-orientantą.', 'Get the meta director first.'),
          [{ p: t('$COOH$ yra m-orientantas, todėl nitrinama po oksidavimo.', '$COOH$ is a meta director, so nitration comes after oxidation.') }, sch([mm('Cc1ccccc1'), ar('KMnO4, t°'), mm('OC(=O)c1ccccc1'), ar('HNO3, H2SO4'), mm('OC(=O)c1cccc(c1)[N+](=O)[O-]')])])],
        why: t('Atvirkštinė tvarka duotų 4- ir 2-nitro izomerus.', 'The reverse order would give the 4 and 2 nitro isomers.'),
        src: 'L9 p36', claims: [{ react: ['sear', ['OC(=O)c1ccccc1'], { E: 'NO2' }, 'OC(=O)c1cccc(c1)[N+](=O)[O-]'] }, { name: ['OC(=O)c1cccc(c1)[N+](=O)[O-]', t('3-nitrobenzenkarboksirūgštis', '3-nitrobenzoic acid')] }]
      },
      {
        id: 'u09.synth.3',
        q: [{ p: t('Iš benzeno reikia gauti 1-brom-3-nitrobenzeną.', 'Make 1-bromo-3-nitrobenzene from benzene.') }, sch([mm('c1ccccc1', { opts: { circle: true } }), { arrow: '→' }, mm('[O-][N+](=O)c1cccc(Br)c1', { name: t('1-brom-3-nitrobenzenas', '1-bromo-3-nitrobenzene') })])],
        steps: [ch(t('Kokia tvarka tinka?', 'Which order works?'),
          [tx('pirma nitrinti, paskui brominti', 'nitrate first, then brominate'), tx('pirma brominti, paskui nitrinti', 'brominate first, then nitrate'), tx('abi tvarkos vienodai', 'both orders equally'), tx('abi tvarkos neduoda produkto', 'neither order gives the product')], 0,
          t('Kuris iš pakaitų yra m-orientantas?', 'Which of the substituents is a meta director?'),
          [{ p: t('$NO2$ nukreipia bromą į m- padėtį. Pirma brominus, nitrogrupė pateks į o-/p- padėtis.', '$NO2$ sends bromine to the m position. If bromine goes first, the nitro group enters the o/p positions.') }, sch([mm('c1ccccc1'), ar('HNO3, H2SO4'), mm(NB), ar('Br2, FeBr3'), mm('[O-][N+](=O)c1cccc(Br)c1')])])],
        why: t('M-izomerui pirma įvedamas m-orientantas.', 'For the meta isomer the meta director goes in first.'),
        src: 'L9 p34', claims: [{ react: ['sear', [NB], { E: 'Br' }, '[O-][N+](=O)c1cccc(Br)c1'] }, { name: ['[O-][N+](=O)c1cccc(Br)c1', t('1-brom-3-nitrobenzenas', '1-bromo-3-nitrobenzene')] }]
      },
      {
        id: 'u09.synth.4',
        q: [{ p: t('Iš benzeno reikia gauti 4-brombenzenaminą (4-bromanliną).', 'Make 4-bromoaniline from benzene.') }, sch([mm('c1ccccc1', { opts: { circle: true } }), { arrow: '→' }, mm('Nc1ccc(Br)cc1', { name: t('4-brombenzenaminas', '4-bromobenzenamine') })])],
        steps: [ord(t('Išdėstykite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
          [tx('$Br2$, $FeBr3$ (brominimas)', '$Br2$, $FeBr3$ (bromination)'), tx('$HNO3$, $H2SO4$ ir p-izomero atskyrimas', '$HNO3$, $H2SO4$ and separation of the p isomer'), tx('$Fe$, $H3O+$; paskui $HO-$ (redukcija)', '$Fe$, $H3O+$; then $HO-$ (reduction)')],
          t('Bromas kreipia į o-/p-, o aminogrupę paprasčiausia gauti iš nitrogrupės.', 'Bromine directs o/p, and the amino group is easiest to make from a nitro group.'),
          [sch([mm('c1ccccc1'), ar('Br2, FeBr3'), mm('Brc1ccccc1'), ar('HNO3, H2SO4'), mm('[O-][N+](=O)c1ccc(Br)cc1'), ar('1. Fe, H3O+', '2. HO−'), mm('Nc1ccc(Br)cc1')])])],
        why: t('Aminogrupė paprastai įvedama paskutinė, redukuojant nitrogrupę.', 'The amino group is normally introduced last, by reducing a nitro group.'),
        src: 'L9 p14, p34', claims: [{ react: ['sear', ['Brc1ccccc1'], { E: 'NO2' }, '[O-][N+](=O)c1ccc(Br)cc1'] }]
      },
      {
        id: 'u09.synth.5',
        q: [{ p: t('Kaip toluenas paverčiamas 1-brom-3-(trichlormetil)benzenu?', 'Make 1-bromo-3-(trichloromethyl)benzene from toluene.') }, sch([mm('Cc1ccccc1'), { arrow: '→' }, mm('Brc1cccc(c1)C(Cl)(Cl)Cl', { name: t('1-brom-3-(trichlormetil)benzenas', '1-bromo-3-(trichloromethyl)benzene') })])],
        steps: [ord(t('Išdėstykite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
          [tx('$Cl2$ (perteklius), $hν$ (grandinės chlorinimas)', '$Cl2$ (excess), $hν$ (side-chain chlorination)'), tx('$Br2$, $FeBr3$ (žiedo brominimas)', '$Br2$, $FeBr3$ (ring bromination)'), tx('produkto išskyrimas ir gryninimas', 'isolation and purification of the product')],
          t('$CCl3$ yra stiprus EA pakaitas.', '$CCl3$ is a strong EA group.'),
          [{ p: t('Pirma šviesoje chlorinama grandinė, gaunamas m-orientantas $CCl3$; paskui $Br$ patenka į m- padėtį.', 'First the chain is chlorinated in light, giving the meta director $CCl3$; then $Br$ enters the m position.') }, sch([mm('Cc1ccccc1'), ar('Cl2, hν'), mm('ClC(Cl)(Cl)c1ccccc1'), ar('Br2, FeBr3'), mm('Brc1cccc(c1)C(Cl)(Cl)Cl')])])],
        why: t('M-izomeras gaunamas, kai m-orientantas atsiranda pirmas.', 'The m isomer results when the meta director appears first.'),
        src: 'L9 p36', claims: [{ react: ['sear', ['ClC(Cl)(Cl)c1ccccc1'], { E: 'Br' }, 'Brc1cccc(c1)C(Cl)(Cl)Cl'] }, { name: ['Brc1cccc(c1)C(Cl)(Cl)Cl', t('1-brom-3-(trichlormetil)benzenas', '1-bromo-3-(trichloromethyl)benzene')] }]
      },
      {
        id: 'u09.synth.6',
        q: [{ p: t('Kaip toluenas paverčiamas 1-brom-4-(trichlormetil)benzenu?', 'Make 1-bromo-4-(trichloromethyl)benzene from toluene.') }, sch([mm('Cc1ccccc1'), { arrow: '→' }, mm('Brc1ccc(cc1)C(Cl)(Cl)Cl', { name: t('1-brom-4-(trichlormetil)benzenas', '1-bromo-4-(trichloromethyl)benzene') })])],
        steps: [ord(t('Išdėstykite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
          [tx('$Br2$, $FeBr3$ (žiedo brominimas)', '$Br2$, $FeBr3$ (ring bromination)'), tx('p-izomero atskyrimas', 'separate the p isomer'), tx('$Cl2$ (perteklius), $hν$ (grandinės chlorinimas)', '$Cl2$ (excess), $hν$ (side-chain chlorination)')],
          t('Metilas kreipia į o-/p-: $CCl3$ to nedaro.', 'Methyl directs o/p; $CCl3$ does not.'),
          [sch([mm('Cc1ccccc1'), ar('Br2, FeBr3'), mm('Cc1ccc(cc1)Br'), ar('Cl2, hν'), mm('Brc1ccc(cc1)C(Cl)(Cl)Cl')])])],
        why: t('Pirma žiede įvedamas pakaitas su metilu, kuris kreipia į para, o metilas paskui chlorinamas.', 'The ring substituent is introduced while methyl still directs para; the methyl is chlorinated afterwards.'),
        src: 'L9 p36', claims: [{ react: ['sear', ['Cc1ccccc1'], { E: 'Br' }, 'Cc1ccc(cc1)Br'] }, { name: ['Brc1ccc(cc1)C(Cl)(Cl)Cl', t('1-brom-4-(trichlormetil)benzenas', '1-bromo-4-(trichloromethyl)benzene')] }]
      },
      {
        id: 'u09.synth.7',
        q: [{ p: t('Bromuojant tolueną su $Br2$ ir $FeBr3$ 3-bromtoluenas nesusidaro.', 'Brominating toluene with $Br2$ and $FeBr3$ does not give 3-bromotoluene.') }, { mol: { smi: 'Cc1cccc(Br)c1', name: t('1-brom-3-metilbenzenas', '1-bromo-3-methylbenzene') } }],
        steps: [ch(t('Kodėl?', 'Why not?'),
          [tx('metilas kreipia į o- ir p- padėtis, m- ataka mažiau palanki', 'methyl directs o and p, so m attack is less favourable'), tx('metilas yra m-orientantas', 'methyl is a meta director'), tx('bromas per didelis m- padėčiai', 'bromine is too big for the m position'), tx('$FeBr3$ blokuoja m- padėtį', '$FeBr3$ blocks the m position')], 0,
          t('Pažiūrėkite, kurioms padėtims arenio jonas stabilesnis.', 'See for which positions the arenium ion is more stable.'),
          t('Metilas stabilizuoja arenio joną o-/p- atakoje, todėl m- produkto labai nedaug.', 'Methyl stabilises the arenium ion in o/p attack, so very little m product forms.'))],
        why: t('Norint m-izomero, reikia kitos grupių tvarkos arba kito kelio.', 'To get the m isomer another order of groups or another route is needed.'),
        src: 'L9 p24, p29'
      },
      {
        id: 'u09.synth.8',
        q: [{ p: t('Iš tolueno reikia gauti 2-brom-4-nitrotolueną.', 'Make 2-bromo-4-nitrotoluene from toluene.') }, sch([mm('Cc1ccccc1'), { arrow: '→' }, mm('Cc1ccc(cc1Br)[N+](=O)[O-]', { name: t('2-brom-4-nitrotoluenas', '2-bromo-4-nitrotoluene') })])],
        steps: [ord(t('Išdėstykite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
          [tx('$HNO3$, $H2SO4$ (nitrinimas)', '$HNO3$, $H2SO4$ (nitration)'), tx('p-izomero atskyrimas', 'separate the p isomer'), tx('$Br2$, $FeBr3$', '$Br2$, $FeBr3$')],
          t('Antroji grupė turi patekti ten, kur sutampa abiejų pakaitų kryptys.', 'The second group must go where the directions of both substituents agree.'),
          [sch([mm('Cc1ccccc1'), ar('HNO3, H2SO4'), mm('Cc1ccc(cc1)[N+](=O)[O-]'), ar('Br2, FeBr3'), mm('Cc1ccc(cc1Br)[N+](=O)[O-]')])])],
        why: t('4-Nitrotoluene $CH3$ ir $NO2$ kreipia į tą pačią padėtį – šalia metilo.', 'In 4-nitrotoluene $CH3$ and $NO2$ direct to the same position, next to methyl.'),
        src: 'L9 p34', claims: [{ react: ['sear', ['Cc1ccc(cc1)[N+](=O)[O-]'], { E: 'Br' }, 'Cc1ccc(cc1Br)[N+](=O)[O-]'] }, { name: ['Cc1ccc(cc1Br)[N+](=O)[O-]', t('2-brom-4-nitrotoluenas', '2-bromo-4-nitrotoluene')] }]
      }
    ]
  });

  ORG.unit({
    id: 'u09',
    notes,
    summary,
    types,
    coverage: {
      'S4.8': ['u09.sear', 'u09.side', 'u09.fc'],
      'S4.9': ['u09.rate', 'u09.sigma'],
      'S4.17': ['u09.arom', 'u09.huckel'],
      'S4.18': ['u09.sear', 'u09.fc'],
      'S4.19': ['u09.reagent', 'u09.synth', 'u09.side'],
      'S4.20': ['u09.pos'],
      'S4.21': ['u09.korner'],
      'S4.22': ['u09.anil']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
