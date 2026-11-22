// site/organic/units/u03.js: unit 3, interactions between atoms, reactions and reagents
// (inductive and mesomeric effects, conjugation, radicals and ions, nucleophiles and electrophiles,
// reaction types and mechanism symbols, curved arrows, oxidation state)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // arrow labels that are only formulas or symbols

  /* ---------- shared helpers ---------- */
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const formulaOf = (ctx, s) => ctx.chem.formulaString(ctx.chem.parse(s));
  // `mol` option objects, distinct by structure
  function distinctMols(ctx, smis) {
    const seen = new Set();
    const out = [];
    smis.forEach((s) => { const k = canon(ctx, s); if (!seen.has(k)) { seen.add(k); out.push({ mol: { smi: s } }); } });
    return out;
  }


  // number of atoms in a SMILES fragment (bracket atoms, Cl, Br, aromatic atoms), used to find the index of a marked atom
  function atomCount(smi) {
    let n = 0, i = 0;
    while (i < smi.length) {
      const c = smi[i];
      if (c === '[') { i = smi.indexOf(']', i) + 1; n++; }
      else if ((c === 'C' && smi[i + 1] === 'l') || (c === 'B' && smi[i + 1] === 'r')) { i += 2; n++; }
      else if (/[BCNOPSFIcnops]/.test(c)) { i++; n++; }
      else i++;
    }
    return n;
  }

  // Carbon centres with a charge or an unpaired electron: template (the centre is {c}), H count on the centre, class
  // (0 methyl, 1 primary, 2 secondary, 3 tertiary, 4 allylic, 5 benzylic)
  const SKEL = [
    { t: '{c}', h: 3, cls: 0 },
    { t: 'C{c}', h: 2, cls: 1 }, { t: 'CC{c}', h: 2, cls: 1 }, { t: 'CCC{c}', h: 2, cls: 1 }, { t: 'CC(C)C{c}', h: 2, cls: 1 }, { t: 'c1ccccc1C{c}', h: 2, cls: 1 },
    { t: 'C{c}C', h: 1, cls: 2 }, { t: 'CC{c}C', h: 1, cls: 2 }, { t: 'CC{c}CC', h: 1, cls: 2 }, { t: 'C1CC{c}CC1', h: 1, cls: 2 }, { t: 'CC(C){c}C', h: 1, cls: 2 },
    { t: 'C{c}(C)C', h: 0, cls: 3 }, { t: 'CC{c}(C)C', h: 0, cls: 3 }, { t: 'CC{c}(C)CC', h: 0, cls: 3 }, { t: 'CC(C)C{c}(C)C', h: 0, cls: 3 }, { t: 'CCC{c}(C)CC', h: 0, cls: 3 },
    { t: 'C=C{c}', h: 2, cls: 4 }, { t: 'CC=C{c}', h: 2, cls: 4 }, { t: 'C=C{c}C', h: 1, cls: 4 }, { t: 'CC=C{c}C', h: 1, cls: 4 }, { t: 'C=C{c}(C)C', h: 0, cls: 4 },
    { t: 'c1ccccc1{c}', h: 2, cls: 5 }, { t: 'c1ccccc1{c}C', h: 1, cls: 5 }, { t: 'c1ccccc1{c}(C)C', h: 0, cls: 5 }, { t: 'Cc1ccc(cc1){c}', h: 2, cls: 5 }
  ];
  const hTok = (n) => (n === 0 ? '' : n === 1 ? 'H' : 'H' + n);
  // the species of a skeleton: kind 'cation', 'radical', 'anion'; also the neutral precursor with Br or H on the centre
  function species(sk, kind) {
    const tok = '[C' + hTok(sk.h) + (kind === 'cation' ? '+' : kind === 'anion' ? '-' : '') + ']';
    const pre = sk.t.slice(0, sk.t.indexOf('{c}'));
    return { smi: sk.t.replace('{c}', tok), centre: atomCount(pre) };
  }
  const precursor = (sk, X) => sk.t.replace('{c}', X ? 'C(' + X + ')' : 'C');
  const CLASS_NAMES = [
    { lt: 'metilo', en: 'methyl' }, { lt: 'pirminis', en: 'primary' }, { lt: 'antrinis', en: 'secondary' },
    { lt: 'tretinis', en: 'tertiary' }, { lt: 'alilo', en: 'allylic' }, { lt: 'benzilo', en: 'benzylic' }
  ];

  // an option that shows two particles side by side
  const pairOpt = (a, b) => ({ scheme: { items: [{ smi: a }, { plus: true }, { smi: b }] } });

  // a description of curved arrows for an answer option: each part is [lt, en]
  const A = (...parts) => ({
    lt: parts.map((p, i) => 'Rodyklė ' + (i + 1) + ': ' + p[0] + '.').join(' '),
    en: parts.map((p, i) => 'Arrow ' + (i + 1) + ': ' + p[1] + '.').join(' ')
  });
  const ARROW_HINT = t('Pradėkite nuo nukleofilo: kur yra jo laisvoji elektronų pora (ar $π$ ryšys) ir link kurio atomo ji slenka? Po to patikrinkite oktetą.', 'Start with the nucleophile: where is its lone pair (or $π$ bond) and which atom does it move towards? Then check the octet.');

  // oxidation state of carbon i (course rule, L3 p40): +1 for each bond to O, N, S or a halogen, -1 for each bond to H, 0 for a bond to C
  const HETERO = ['N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
  function oxState(mol, i) {
    let s = -mol.atoms[i].h;
    mol.nbr[i].forEach((j) => { if (HETERO.indexOf(mol.atoms[j].el) >= 0) s += mol.bondAt(i, j).order; });
    return s;
  }
  const oxList = (ctx, smi) => { const m = ctx.chem.parse(smi); const out = []; m.atoms.forEach((a, i) => { if (a.el === 'C') out.push([i, oxState(m, i)]); }); return out; };
  const oxSum = (ctx, smi) => oxList(ctx, smi).reduce((s, x) => s + x[1], 0);
  const signed = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

  ORG.unit({
    id: 'u03',
    notes: [
      /* ============ 1. inductive effect ============ */
      {
        id: 'induction',
        title: t('Elektroniniai efektai: indukcijos efektas', 'Electronic effects: the inductive effect'),
        blocks: [
          { h: t('Kaip atomai veikia vienas kitą', 'How atoms act on each other') },
          {
            p: t('Molekulės atomai daro įtaką vieni kitiems. Ši įtaka sklinda arba ryšiais (elektroniniai efektai), arba erdve (erdviniai efektai). Elektroniniai efektai nusako, kiek atomas ar funkcinė grupė gali paveikti kaimynus kovalentiniais ryšiais, todėl nuo jų priklauso, kaip pasiskirsto elektronų tankis ramioje molekulėje ir kokios stabilios yra tarpinės dalelės. Taip jie iš dalies nulemia, kaip lengvai junginys reaguoja. Yra du jų tipai: indukcijos efektas, plintantis $σ$ ryšiais, ir mezomerijos efektas, plintantis $π$ ryšiais.',
              'The atoms of a molecule influence one another. The influence travels either along bonds (electronic effects) or through space (steric effects). An electronic effect tells how far an atom or functional group can affect its neighbours through covalent bonds, so it decides how electron density is spread in a quiet molecule and how stable the intermediates are. That is how it partly determines how readily a compound reacts. There are two kinds: the inductive effect, which spreads through $σ$ bonds, and the mesomeric effect, which spreads through $π$ bonds.'),
            src: 'L3 p2'
          },
          {
            rule: t('Indukcijos efektas yra kovalentinio $σ$ ryšio poliarizacija: ryšio elektronų pora pasislenka link atomo, kurio elektrinis neigiamumas didesnis. Poliarizacija persiduoda grandine, bet greitai silpnėja: stipriausiai ji jaučiama dviem artimiausiems atomams ir beveik išnyksta po 3–4 ryšių. Rodyklė braižoma išilgai ryšio, smaigaliu į elektronus patraukiantį atomą.',
              'The inductive effect is the polarisation of a covalent $σ$ bond: the bonding pair shifts towards the atom of higher electronegativity. The polarisation is passed along the chain but fades quickly: it is strongest at the two nearest atoms and almost gone after 3–4 bonds. The arrow is drawn along the bond, its head pointing to the atom that attracts the electrons.'),
            src: 'L3 p3'
          },
          {
            mol: { smi: 'ClCCCC', opts: { deltas: { 0: '-', 1: '+', 2: '+', 3: '+' }, rotate: 0 } },
            caption: t('1-chlorbutanas: chloras patraukia $σ$ ryšio elektronus, anglis C-1 gauna didžiausią dalinį teigiamą krūvį, C-2 mažesnį, C-3 dar mažesnį: $δ1+ > δ2+ > δ3+$.',
              '1-chlorobutane: chlorine pulls the $σ$ electrons, carbon C-1 gets the largest partial positive charge, C-2 less, C-3 less still: $δ1+ > δ2+ > δ3+$.'),
            src: 'L3 p3'
          },
          { h: t('Efekto ženklas: +I ir −I', 'The sign of the effect: +I and −I') },
          {
            p: t('Pakaito poveikis vertinamas lyginant su vandeniliu: jo indukcijos efektas imamas kaip nulis. Jei pakaitas $X$ $σ$ ryšio elektronus traukia stipriau nei $H$, jam būdingas neigiamas efektas −I. Jei pakaitas $Y$ elektronų tankį grandinėje padidina, jo efektas teigiamas, +I.',
              'The effect of a substituent is measured against a hydrogen atom, whose inductive effect is taken as zero. A substituent $X$ that pulls the $σ$ electrons harder than hydrogen has a negative effect, −I; a substituent $Y$ that raises the electron density in the chain has a positive effect, +I.'),
            src: 'L3 p4'
          },
          {
            scheme: { items: [{ smi: 'ClC' }, { arrow: '→', below: t('−I (Cl patraukia elektronus)', '−I (Cl attracts electrons)') }] },
            caption: t('Rodyklė rodo, kuria kryptimi pasislenka ryšio elektronų pora: $R → CH2 → Cl$.', 'The arrow shows where the bonding pair shifts: $R → CH2 → Cl$.')
          },
          {
            table: {
              head: [t('Efektas', 'Effect'), t('Pakaitai', 'Substituents'), t('Kas jį stiprina', 'What strengthens it')],
              rows: [
                [t('−I', '−I'), t('halogeno atomai ($−F$, $−Cl$, $−Br$ ir $−I$); $−OH$ ir $−OR$; aminogrupės ($−NH2$, $−NHR$, $−NR2$); $−NO2$, $−CN$, $−CF3$, $−SO3H$; rūgšties grupės ($−COOH$, $−COOR$, $−CONH2$); karbonilo grupės ($−CHO$, $>C=O$); $−NH3+$ ir $−NR3+$', 'halogen atoms ($−F$, $−Cl$, $−Br$ and $−I$); $−OH$ and $−OR$; amino groups ($−NH2$, $−NHR$, $−NR2$); $−NO2$, $−CN$, $−CF3$, $−SO3H$; acid groups ($−COOH$, $−COOR$, $−CONH2$); carbonyl groups ($−CHO$, $>C=O$); $−NH3+$ and $−NR3+$'),
                  t('Kuo didesnis ryšį su anglimi sudarančio atomo elektrinis neigiamumas, tuo stipresnis −I.', 'The more electronegative the atom bonded to carbon, the stronger the −I effect.')],
                [t('+I', '+I'), t('alkilai $−CH3$, $−CH2CH3$, $−CH(CH3)2$, $−C(CH3)3$ (kai jie prisijungę prie $sp2$ ar $sp$ anglies); anijonai $−O-$, $−COO-$, $−S-$; metalų, kurių elektrinis neigiamumas mažas, atomai ($Li$, $Mg$, $Si$)', 'alkyl groups $−CH3$, $−CH2CH3$, $−CH(CH3)2$, $−C(CH3)3$ (when they are bonded to an $sp2$ or $sp$ carbon); anions $−O-$, $−COO-$, $−S-$; atoms of metals whose electronegativity is low ($Li$, $Mg$, $Si$)'),
                  t('Alkilų +I stiprėja didėjant C atomų skaičiui ir šakotumui: $−C(CH3)3 > −CH(CH3)2 > −CH2CH3 > −CH3$.', 'The +I of alkyl groups grows with the number of carbons and with branching: $−C(CH3)3 > −CH(CH3)2 > −CH2CH3 > −CH3$.')]
              ]
            },
            src: 'L3 p5'
          },
          {
            pitfall: t('Indukcijos efektas keliauja tik per $σ$ ryšius ir greitai gęsta. Jis neapima viso molekulės karkaso, o tolimesnės anglys beveik nejaučia pakaito. Nesupainiokite jo su mezomerijos efektu, kuris keliauja per $π$ sistemą daug toliau.',
              'The inductive effect travels only through $σ$ bonds and dies out quickly. It does not reach the whole skeleton, and distant carbons hardly feel the substituent. Do not confuse it with the mesomeric effect, which travels much further through a $π$ system.'),
            src: 'L3 p15'
          },
          {
            example: {
              q: [
                { p: t('Trijų anglių grandinė turi chlorą. Kuri anglis jaučia chloro indukcijos efektą stipriausiai ir kokio jis ženklo? Atomų numeriai atitinka grandinės numeraciją.', 'A three-carbon chain carries a chlorine. Which carbon feels the inductive effect of chlorine most, and what is its sign? The atom numbers follow the chain numbering.') },
                { mol: { smi: 'ClCCC', name: t('1-chlorpropanas', '1-chloropropane'), opts: { numbers: { 1: '1', 2: '2', 3: '3' } } } }
              ],
              steps: [
                [{ p: t('Chloro elektrinis neigiamumas didesnis už anglies, todėl $C−Cl$ ryšio elektronai slenka link chloro: tai −I efektas.', 'Chlorine is more electronegative than carbon, so the $C−Cl$ bonding electrons shift towards chlorine: this is a −I effect.') }],
                [{ p: t('Atomas Nr. 1 yra tiesiogiai sujungtas su chloru ir netenka daugiausia elektronų tankio: ant jo atsiranda didžiausias $δ+$.', 'Carbon no. 1 is bonded directly to chlorine and loses the most electron density: it gets the largest $δ+$.') }],
                [{ p: t('Per $C1−C2$ ir $C2−C3$ ryšius poliarizacija persiduoda, bet silpnėja: $δ1+ > δ2+ > δ3+$.', 'Polarisation passes on through the $C1−C2$ and $C2−C3$ bonds but weakens: $δ1+ > δ2+ > δ3+$.') },
                  { mol: { smi: 'ClCCC', opts: { deltas: { 0: '-', 1: '+', 2: '+' } } } }]
              ]
            },
            claims: [{ name: ['ClCCC', t('1-chlorpropanas', '1-chloropropane')] }, { formula: ['ClCCC', 'C3H7Cl'] }]
          },
          { practice: 'u03.induct' }
        ]
      },

      /* ============ 2. conjugation ============ */
      {
        id: 'conjugation',
        title: t('Konjugacija ir konjuguotosios sistemos', 'Conjugation and conjugated systems'),
        blocks: [
          { h: t('Kodėl svarbi konjugacija', 'Why conjugation matters') },
          {
            p: t('Kai kurie elektronai nepriklauso vienam ryšiui ar atomui, o pasiskirsto keliuose atomuose. Tokia delokalizacija išskiria energiją, todėl konjuguotosios sistemos yra termodinamiškai stabilios. Konjugacija taip pat sudaro sąlygas mezomerijos efektui.',
              'Some electrons do not belong to a single bond or atom but are spread over several atoms. This delocalisation releases energy, so conjugated systems are thermodynamically stable. Conjugation also makes the mesomeric effect possible.'),
            src: 'T p28'
          },
          {
            rule: t('Konjugacija atsiranda, kai persidengia bent trijų gretimų atomų lygiagrečios $p$ orbitalės, kurios nėra hibridizuotos. Konjuguotoje sistemoje judrius elektronus (kelių $π$ ryšių arba $π$ ryšių ir laisvųjų elektronų porų) skiria tik vienas viengubasis ryšys. Tokia sistema gali būti atvira arba uždara.',
              'Conjugation is the overlap of three or more neighbouring, parallel, unhybridised $p$ orbitals. In a conjugated system the mobile electrons (those of several $π$ bonds, or of $π$ bonds and lone pairs) are separated by exactly one single bond. The system may be open-chain or closed (cyclic).'),
            src: 'L3 p6'
          },
          {
            mol: [
              { smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene'), opts: { numbers: 'all' } },
              { smi: 'c1ccccc1', name: t('benzenas', 'benzene'), opts: { circle: true } }
            ],
            caption: t('Paprasčiausi pavyzdžiai: atviros grandinės 1,3-butadienas ir uždaros grandinės benzenas. Visi jų C atomai yra $sp2$, o $p$ orbitalės statmenos $σ$ ryšių plokštumai ir lygiagrečios viena kitai.',
              'The simplest examples: open-chain buta-1,3-diene and cyclic benzene. All their carbons are $sp2$, and the $p$ orbitals are perpendicular to the plane of the $σ$ bonds and parallel to each other.'),
            src: 'L3 p6'
          },
          {
            p: t('1,3-Butadiene $p$ orbitalės persidengia ne tik tarp C-1 ir C-2 bei C-3 ir C-4, bet ir tarp C-2 ir C-3. Dėl šio papildomo persidengimo susidaro viena delokalizuota $π$ sistema. Benzene šešios $p$ orbitalės sudaro uždarą žiedinę sistemą, o visi $C−C$ ryšiai vienodi (0,139 nm), nes elektronų tankis pasiskirsto tolygiai.',
              'In buta-1,3-diene the $p$ orbitals overlap not only between C-1 and C-2 and between C-3 and C-4 but also between C-2 and C-3. This extra overlap gives a single delocalised $π$ system. In benzene six $p$ orbitals form a closed ring system, and all $C−C$ bonds are equal (0.139 nm) because the electron density is spread evenly.'),
            src: 'L3 p6'
          },
          { h: t('Konjugacijos rūšys', 'Kinds of conjugation') },
          {
            p: t('Jei persidengia gretimų $π$ ryšių orbitalės, tai $π,π$-konjugacija. Jei $π$ ryšio orbitalė persidengia su gretimo atomo $p$ orbitale (dažniausiai $N$, $O$, halogeno laisvoji elektronų pora, tačiau tai gali būti ir tuščia orbitalė ar vienišas elektronas), tai $p,π$-konjugacija.',
              'If the orbitals of neighbouring $π$ bonds overlap, it is $π,π$ conjugation. If a $π$ bond overlaps with the $p$ orbital of a neighbouring atom (most often the lone pair of $N$, $O$ or a halogen, but also an empty orbital or a single electron), it is $p,π$ conjugation.'),
            src: 'L3 p8'
          },
          {
            table: {
              head: [t('Rūšis', 'Kind'), t('Pavyzdžiai', 'Examples')],
              rows: [
                [t('$π,π$-konjugacija', '$π,π$ conjugation'), { smi: 'C=C(C)C=C', name: t('2-metil-1,3-butadienas', '2-methylbuta-1,3-diene') }],
                [t('$π,π$-konjugacija', '$π,π$ conjugation'), { smi: 'C=CC=O', name: t('propenalis', 'prop-2-enal') }],
                [t('$π,π$-konjugacija', '$π,π$ conjugation'), { smi: 'C=CC#N', name: t('propennitrilas', 'prop-2-enenitrile') }],
                [t('$p,π$-konjugacija', '$p,π$ conjugation'), { smi: 'C=COC', name: t('metoksietenas', 'methoxyethene'), opts: { lonePairs: [2] } }],
                [t('$p,π$-konjugacija', '$p,π$ conjugation'), { smi: 'CC(N)=O', name: t('etanamidas', 'ethanamide'), opts: { lonePairs: [2] } }],
                [t('$p,π$-konjugacija', '$p,π$ conjugation'), { smi: 'C=CCl', name: t('chloretenas', 'chloroethene'), opts: { lonePairs: [2] } }]
              ]
            },
            src: 'L3 p8'
          },
          {
            p: t('Alilo dalelėse prie $π$ ryšio prisijungusio $sp2$ atomo $p$ orbitalė gali būti tuščia (katijonas), turėti vieną elektroną (radikalas) arba elektronų porą (anijonas); visais trim atvejais gaunama trijų atomų $p,π$-sistema.',
              'In allyl particles the $sp2$ atom next to the $π$ bond carries a $p$ orbital that is empty, singly occupied or doubly occupied; in all three cases the result is a three-atom $p,π$ system.'),
            src: 'L3 p9'
          },
          {
            mol: [
              { smi: 'C=C[CH2+]', name: t('alilo katijonas', 'allyl cation') },
              { smi: 'C=C[CH2]', caption: t('alilo radikalas', 'allyl radical') },
              { smi: 'C=C[CH2-]', caption: t('alilo anijonas', 'allyl anion') }
            ],
            src: 'L3 p9'
          },
          {
            pitfall: t('Ne kiekvienas dvigubasis ryšys sudaro konjuguotąją sistemą. Jei tarp $π$ ryšių yra $sp3$ atomas (1,4-pentadienas $CH2=CH−CH2−CH=CH2$), ryšiai yra izoliuoti. Kumuliuotų ryšių ($C=C=C$) $π$ orbitalės statmenos viena kitai ir taip pat nesudaro konjuguotosios sistemos. Į sistemą skaičiuojami tik atomai, turintys persidengiančias $p$ orbitales: $sp3$ metilo grupė, pavyzdžiui izoprene, į ją neįeina.',
              'Not every double bond forms a conjugated system. If an $sp3$ atom lies between the $π$ bonds (penta-1,4-diene, $CH2=CH−CH2−CH=CH2$), the bonds are isolated. For cumulated bonds ($C=C=C$) the $π$ orbitals are perpendicular to each other and again no conjugated system forms. Only atoms with overlapping $p$ orbitals count towards the system: an $sp3$ methyl group, for example in isoprene, is not part of it.'),
            src: 'L3 p8'
          },
          {
            example: {
              q: [
                { p: t('Kiek atomų sudaro izopreno konjuguotąją sistemą? Atomų numeriai atitinka SMILES eilės tvarką.', 'How many atoms form the conjugated system of isoprene? The atom numbers follow the order in which the atoms are listed.') },
                { mol: { smi: 'C=C(C)C=C', name: t('2-metil-1,3-butadienas', '2-methylbuta-1,3-diene'), opts: { numbers: 'all' } } }
              ],
              steps: [
                [{ p: t('Surandame $sp2$ atomus: atomai Nr. 1, 2, 4 ir 5 yra dvigubųjų ryšių atomai.', 'Find the $sp2$ atoms: carbons no. 1, 2, 4 and 5 belong to double bonds.') }],
                [{ p: t('Dvigubuosius ryšius $C1=C2$ ir $C4=C5$ skiria vienas viengubasis ryšys $C2−C4$, todėl $π$ ryšiai konjuguoti.', 'The double bonds $C1=C2$ and $C4=C5$ are separated by one single bond $C2−C4$, so the $π$ bonds are conjugated.') }],
                [{ p: t('Atomas Nr. 3 yra $sp3$ metilo anglis: jos $p$ orbitalės neturi, todėl sistemai nepriklauso.', 'Carbon no. 3 is an $sp3$ methyl carbon: it has no $p$ orbital, so it does not belong to the system.') }],
                [{ p: t('Konjuguotąją sistemą sudaro 4 atomai.', 'The conjugated system consists of 4 atoms.') }]
              ]
            },
            claims: [{ name: ['C=C(C)C=C', t('2-metil-1,3-butadienas', '2-methylbuta-1,3-diene')] }, { formula: ['C=C(C)C=C', 'C5H8'] }, { hyb: ['C=C(C)C=C', 2, 'sp3'] }, { hyb: ['C=C(C)C=C', 3, 'sp2'] }]
          },
          { practice: 'u03.conj' },
          { practice: 'u03.natural' }
        ]
      },

      /* ============ 3. mesomeric effect, resonance, donors and acceptors ============ */
      {
        id: 'mesomeric',
        title: t('Mezomerijos efektas, rezonansas, donorai ir akceptoriai', 'Mesomeric effect, resonance, donors and acceptors'),
        blocks: [
          { h: t('Pakaitas konjuguotoje sistemoje', 'A substituent in a conjugated system') },
          {
            p: t('Kai pakaitas pats yra konjuguotosios sistemos dalis, be indukcijos efekto pasireiškia ir jo mezomerijos efektas. Jis persiduoda per $π$ sistemą, apima visą konjuguotąją sistemą ir veikia daug toliau už indukcijos efektą: priešingi krūviai atsiranda sistemos galuose.',
              'When a substituent is itself part of a conjugated system, besides its inductive effect it shows a mesomeric effect. This is passed through the $π$ system, covers the whole conjugated system and reaches much further than the inductive effect: opposite partial charges appear at the ends of the system.'),
            src: 'L3 p10'
          },
          {
            rule: t('Mezomerijos efektas (M) – tai savybė paduoti arba patraukti elektronus per $π$ ryšius, kurią turi atomas ar funkcinė grupė. Teigiamą efektą +M turi pakaitai, didinantys sistemos elektronų tankį: jie turi laisvųjų elektronų porų ar neigiamą krūvį ($−O-$, $−S-$, hidroksilas ir alkoksilas $−OH$, $−OR$, tiolio grupė $−SH$, aminogrupės $−NH2$, $−NHR$, $−NR2$, halogenai). Neigiamą efektą −M turi pakaitai, šį tankį mažinantys: jų daugialypis ryšys jungia atomą su didesnio elektrinio neigiamumo atomu (nitrogrupė $−NO2$, nitrilo grupė $−CN$, karbonilo grupės $−CHO$ ir $>C=O$, rūgšties ir jos darinių grupės $−COOH$, $−COOR$, $−CONH2$, sulfogrupė $−SO3H$).',
              'The mesomeric effect (M) is the ability of an atom or functional group to donate or withdraw electrons through $π$ bonds. A positive effect, +M, belongs to substituents that raise the electron density of the system: they have lone pairs or a negative charge ($−O-$, $−S-$, hydroxyl and alkoxyl $−OH$, $−OR$, the thiol group $−SH$, amino groups $−NH2$, $−NHR$, $−NR2$, halogens). A negative effect, −M, belongs to substituents that lower this density: their multiple bond joins the atom to a more electronegative atom (the nitro group $−NO2$, the nitrile group $−CN$, carbonyl groups $−CHO$ and $>C=O$, acid and derivative groups $−COOH$, $−COOR$, $−CONH2$, the sulfo group $−SO3H$).'),
            src: 'L3 p11'
          },
          {
            p: t('Elektronų poslinkis vaizduojamas lenktomis rodyklėmis. Rodyklė prasideda ten, iš kur juda $p$ ar $π$ elektronai, ir baigiasi ryšyje ar atome, link kurio jie juda.',
              'The shift of electrons is drawn with curved arrows: the tail marks the source of electrons ($p$ or $π$ electrons) and the head marks the bond or atom they move towards.'),
            src: 'L3 p12'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'C=COC', opts: { lonePairs: [2] } }, { arrow: '↔' }, { smi: '[CH2-]C=[O+]C' }] },
              arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, b: [1, 2] } }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 } }],
              note: t('+M: deguonies laisvoji pora tampa $C−O$ ryšio dalimi, $π$ ryšys pasislenka į galinį atomą, todėl jame padaugėja elektronų.', '+M: the lone pair of oxygen becomes part of the $C−O$ bond and the $π$ bond shifts to the terminal carbon, which therefore gains electron density.')
            }],
            caption: t('Metoksietenas: pakaitas $−OCH3$ turi +M efektą.', 'Methoxyethene: the substituent $−OCH3$ shows a +M effect.'),
            src: 'L3 p10'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'C=CC=O' }, { arrow: '↔' }, { smi: '[CH2+]C=C[O-]' }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, b: [1, 2] } }, { from: { m: 0, b: [2, 3] }, to: { m: 0, a: 3 } }],
              note: t('−M: $π$ elektronai slenka link deguonies, todėl galinis anglies atomas netenka elektronų tankio ($δ+$), o deguonis jo gauna ($δ−$).', '−M: the $π$ electrons shift towards oxygen, so the terminal carbon loses electron density ($δ+$) and oxygen gains it ($δ−$).')
            }],
            caption: t('Propenalis: formilo grupė $−CHO$ turi −M efektą.', 'Prop-2-enal: the formyl group $−CHO$ shows a −M effect.'),
            src: 'L3 p12'
          },
          { h: t('Rezonansinės formulės', 'Resonance structures') },
          {
            p: t('Elektronų delokalizaciją galima užrašyti kaip kelias rezonansines formules. Tarp jų dedama rodyklė $↔$. Keičiasi tik elektronų, bet ne atomų padėtis; kiekviena formulė turi būti teisinga Lewiso formulė (neviršijamas oktetas). Tikroji molekulė, jonas ar radikalas yra visų formulių hibridas, ir kuo daugiau formulių galima parašyti, tuo labiau krūvis išsklaidytas ir tuo stabilesnė dalelė.',
              'Electron delocalisation can be written as several resonance structures, joined by the arrow $↔$. Only the electrons change place, never the atoms, and each structure must be a valid Lewis structure (the octet is not exceeded). The real molecule, ion or radical is a hybrid of all the structures, and the more structures can be written, the more the charge is spread and the more stable the particle is.'),
            src: 'L4 p17'
          },
          { resonance: [{ smi: 'C=C[CH2+]' }, { smi: '[CH2+]C=C' }], caption: t('Alilo katijonas: teigiamas krūvis dalijasi tarp galinių atomų.', 'The allyl cation: the positive charge is shared by the terminal carbons.'), src: 'L3 p9' },
          { resonance: [{ smi: 'C=C[CH2-]' }, { smi: '[CH2-]C=C' }], caption: t('Alilo anijonas: neigiamas krūvis dalijasi tarp galinių atomų.', 'The allyl anion: the negative charge is shared by the terminal carbons.'), src: 'L3 p9' },
          { resonance: [{ smi: 'Nc1ccccc1', opts: { lonePairs: [0] } }, { smi: '[NH2+]=C1C=CC=C[CH-]1' }, { smi: '[NH2+]=C1C=C[CH-]C=C1' }], caption: t('Anilinas (+M): neigiamas krūvis atsiranda orto ir para padėtyse.', 'Aniline (+M): negative charge appears in the ortho and para positions.'), src: 'L3 p12' },
          { resonance: [{ smi: 'O=Cc1ccccc1' }, { smi: '[O-]C=C1C=CC=C[CH+]1' }, { smi: '[O-]C=C1C=C[CH+]C=C1' }], caption: t('Benzenkarbaldehidas (−M): teigiamas krūvis atsiranda orto ir para padėtyse.', 'Benzaldehyde (−M): positive charge appears in the ortho and para positions.'), src: 'L3 p10' },
          { h: t('Elektronų donorai ir akceptoriai', 'Electron donors and acceptors') },
          {
            p: t('Norint įvertinti pakaito poveikį elektronų tankiui, reikia sudėti jo indukcijos ir mezomerijos efektus. Pagal bendrą rezultatą pakaitai skirstomi į elektronų donorinius (ED), kurie didina elektronų tankį, ir elektronų akceptorinius (EA), kurie jį mažina. Dažniausiai ženklą lemia mezomerijos efektas, o halogenai yra išimtis.',
              'To judge what a substituent does to the electron density, add up its inductive and mesomeric effects. By the overall result substituents are electron donors (ED), which raise the electron density, or electron acceptors (EA), which lower it. The sign is usually decided by the mesomeric effect, except for the halogens.'),
            src: 'L3 p13'
          },
          {
            table: {
              head: [t('Pakaitas', 'Substituent'), t('Indukcijos efektas', 'Inductive'), t('Mezomerijos efektas', 'Mesomeric'), t('Poveikis konjuguotai sistemai', 'Effect on a conjugated system')],
              rows: [
                [t('Alkilas $−CH3$, $−C2H5$', 'Alkyl $−CH3$, $−C2H5$'), t('+I', '+I'), t('nėra', 'none'), t('donoras', 'donor')],
                [t('$−NH2$, $−NHR$, $−NR2$', '$−NH2$, $−NHR$, $−NR2$'), t('−I', '−I'), t('+M', '+M'), t('donoras (+M ≫ −I)', 'donor (+M ≫ −I)')],
                [t('$−OH$, $−OR$', '$−OH$, $−OR$'), t('−I', '−I'), t('+M', '+M'), t('donoras (+M > −I)', 'donor (+M > −I)')],
                [t('$−F$, $−Cl$, $−Br$, $−I$ (halogenai)', '$−F$, $−Cl$, $−Br$, $−I$ (halogens)'), t('−I', '−I'), t('+M', '+M'), t('akceptorius (−I > +M)', 'acceptor (−I > +M)')],
                [t('$>C=O$, $−CHO$, $−COOH$, $−COOR$, $−CONH2$, $−CN$, $−NO2$, $−SO3H$', '$>C=O$, $−CHO$, $−COOH$, $−COOR$, $−CONH2$, $−CN$, $−NO2$, $−SO3H$'), t('−I', '−I'), t('−M', '−M'), t('akceptorius', 'acceptor')]
              ]
            },
            src: 'L3 p14'
          },
          {
            rule: t('Donorai (ED): alkilai, aminogrupės ($−NH2$, $−NHR$, $−NR2$), hidroksilas $−OH$, alkoksilas $−OR$ ir $−SH$. Akceptoriai (EA): halogenai, karbonilo junginių grupės $−CHO$ ir $>C=O$, rūgšties grupės $−COOH$, $−COOR$, $−CONH2$, nitrilo grupė $−C≡N$, $−NO2$ ir $−SO3H$. Kai pasireiškia vien indukcijos efektas, $−NH2$ ir $−OH$ taip pat tampa akceptoriais ($−I$).',
              'Donors (ED): alkyl groups, amino groups ($−NH2$, $−NHR$, $−NR2$), hydroxyl $−OH$, alkoxyl $−OR$ and $−SH$. Acceptors (EA): halogens, the groups $−CHO$ and $>C=O$ of carbonyl compounds, acid groups $−COOH$, $−COOR$, $−CONH2$, the nitrile group $−C≡N$, $−NO2$ and $−SO3H$. When only the inductive effect appears, $−NH2$ and $−OH$ become acceptors as well ($−I$).'),
            src: 'L3 p13'
          },
          {
            pitfall: t('Mezomerijos efektas atsiranda tik tada, kai pakaito atomas tiesiogiai sujungtas su $π$ sistema. Anilino $−NH2$ turi +M, bet benzilamino $−NH2$ nuo žiedo atskirtas $sp3$ grupe $CH2$, todėl veikia tik −I. Halogenas turi ir −I, ir +M, bet −I stipresnis, todėl jis akceptorius.',
              'The mesomeric effect appears only when the substituent atom is attached directly to the $π$ system. The $−NH2$ of aniline has +M, but in benzylamine it is separated from the ring by an $sp3$ group $CH2$, so only −I acts. A halogen has both −I and +M, but −I is stronger, so it is an acceptor.'),
            src: 'L3 p16'
          },
          {
            example: {
              q: [
                { p: t('Kokius elektroninius efektus turi $−NH2$ grupė anilino ir benzilamino molekulėse ir ar ji elektronų donoras, ar akceptorius? Atomų numeriai atitinka SMILES eilės tvarką.', 'What electronic effects does the $−NH2$ group show in aniline and in benzylamine, and is it an electron donor or an acceptor? The atom numbers follow the order in which the atoms are listed.') },
                { mol: [{ smi: 'Nc1ccccc1', name: t('anilinas', 'aniline'), opts: { numbers: 'all' } }, { smi: 'NCc1ccccc1', name: t('benzilaminas', 'benzylamine'), opts: { numbers: 'all' } }] }
              ],
              steps: [
                [{ p: t('Anilino molekulėje azotas (Nr. 1) jungiasi tiesiai su žiedo anglimi Nr. 2: jo laisvoji pora gali persidengti su žiedo $π$ sistema ($p,π$-konjugacija).', 'In aniline nitrogen no. 1 is bonded directly to ring carbon no. 2: its lone pair can overlap with the $π$ system of the ring ($p,π$ conjugation).') }],
                [{ p: t('Todėl anilino $−NH2$ turi −I ir +M efektus; +M daug stipresnis, todėl grupė yra donoras ir žiede padidina elektronų tankį orto ir para padėtyse.', 'So in aniline $−NH2$ shows −I and +M; +M is much stronger, so the group is a donor and raises the electron density in the ortho and para positions.') }],
                [{ p: t('Benzilamino molekulėje tarp azoto Nr. 1 ir žiedo yra $sp3$ anglis Nr. 2: konjugacijos nėra, mezomerijos efekto nėra.', 'In benzylamine an $sp3$ carbon, no. 2, lies between nitrogen no. 1 and the ring: there is no conjugation and no mesomeric effect.') }],
                [{ p: t('Lieka tik −I efektas, todėl benzilamino $−NH2$ yra akceptorius (silpnas).', 'Only the −I effect remains, so in benzylamine $−NH2$ is an acceptor (a weak one).') }]
              ]
            },
            claims: [{ name: ['Nc1ccccc1', t('anilinas', 'aniline')] }, { name: ['NCc1ccccc1', t('benzilaminas', 'benzylamine')] }, { hyb: ['NCc1ccccc1', 1, 'sp3'] }]
          },
          { practice: 'u03.effects' },
          { practice: 'u03.donor' },
          { practice: 'u03.resonance' }
        ]
      },

      /* ============ 4. reaction mechanism and energetics ============ */
      {
        id: 'mechanism',
        title: t('Reakcijos mechanizmas ir energetika', 'Reaction mechanism and energetics'),
        blocks: [
          { h: t('Kodėl ir kaip vyksta reakcija', 'Why and how a reaction proceeds') },
          {
            p: t('Vykstant cheminei reakcijai, vieni ryšiai nutrūksta, o kiti susidaro. Reakcija įmanoma, jei gali atsirasti mažesnės laisvosios energijos, taigi stabilesnė sistema. Kryptį nulemia du dalykai: kaip pasiskirstęs elektronų tankis pradinėse medžiagose (statinis veiksnys) ir kokios stabilios yra galimos tarpinės dalelės (dinaminis veiksnys).',
              'In a chemical reaction some bonds break and others form. A reaction goes when a system of lower free energy, that is a more stable one, can form. Two factors decide its direction: the electron density distribution in the starting compounds (the static factor) and the relative stability of the possible intermediates (the dynamic factor).'),
            src: 'L3 p18'
          },
          {
            p: t('Organinė reakcija paprastai vyksta keliomis nuosekliomis stadijomis, o jų išsamus aprašas vadinamas mechanizmu. Mechanizmas yra hipotezė, siūloma eksperimentiniams faktams paaiškinti, o ne tiesiogiai pamatytas dalykas.',
              'Most organic reactions consist of several consecutive stages. A detailed description of them is called the mechanism. A mechanism is a hypothesis offered to explain experimental facts, not a directly observed fact.'),
            src: 'L3 p18'
          },
          {
            rule: t('Sudėtingos reakcijos greitį lemia jos lėčiausia stadija. Elementariosios stadijos greitis priklauso nuo aktyvacijos energijos $Ea$: kuo ji mažesnė, tuo reakcija greitesnė. Katalizatorius sumažina $Ea$ ir pagreitina reakciją, bet nepakeičia pradinių medžiagų ir produkto energijų, todėl nekeičia pusiausvyros.',
              'The rate of a complex reaction is set by its slowest stage. The rate of an elementary stage depends on the activation energy $Ea$: the smaller it is, the faster the reaction. A catalyst lowers $Ea$ and speeds the reaction up, but it does not change the energies of the starting materials and the product, so it does not shift the equilibrium.'),
            src: 'L3 p19'
          },
          {
            table: {
              head: [t('Sąvoka', 'Term'), t('Reikšmė', 'Meaning')],
              rows: [
                [t('Aktyvacijos energija $Ea$', 'Activation energy $Ea$'), t('Energija, kurios reikia, kad susidūrimas būtų efektyvus ir sistema pasiektų tarpinį būvį, iš kurio savaime susidaro produktai.', 'The energy needed for a collision to be effective and for the system to reach the intermediate state from which products form by themselves.')],
                [t('Tarpinis būvis (pereinamoji būsena)', 'Transition state'), t('Energijos kreivės viršūnė: nestabili sandara, kurioje ryšiai vienu metu skyla ir formuojasi. Jos išskirti negalima.', 'The top of the energy curve: an unstable arrangement in which bonds are breaking and forming at the same time. It cannot be isolated.')],
                [t('Tarpinė dalelė (intermediatas)', 'Intermediate'), t('Nestabili dalelė energijos kreivės duobėje tarp dviejų stadijų (karbokatijonas, radikalas, karbanijonas). Jos stabilumas didėja, kai krūvis ar laisvoji pora labiau delokalizuoti.', 'An unstable particle in an energy valley between two stages (carbocation, radical, carbanion). Its stability grows as the charge or lone pair is more delocalised.')],
                [t('Kinetinė kontrolė', 'Kinetic control'), t('Švelnios sąlygos: daugiausia susidaro greičiausiai susidarantis izomeras.', 'Mild conditions: mostly the isomer that forms fastest.')],
                [t('Termodinaminė kontrolė', 'Thermodynamic control'), t('Griežtos sąlygos (aukšta temperatūra, ilgas laikas): daugiausia susidaro stabiliausias izomeras.', 'Harsh conditions (high temperature, long time): mostly the most stable isomer.')]
              ]
            },
            src: 'L3 p19'
          },
          {
            p: t('Energijos diagramoje laisvoji energija atidedama reakcijos eigos atžvilgiu: pradiniai junginiai yra vienoje pusėje, produktai – kitoje, o tarp jų yra kalnas, kurio aukštis ir yra $Ea$. Su katalizatoriumi kalnas žemesnis ($Ea′ < Ea$), bet pradinių junginių ir produktų lygiai tie patys.',
              'In an energy diagram the free energy is plotted against the progress of the reaction: the starting compounds are at one side, the products at the other, and between them lies a hill whose height is $Ea$. With a catalyst the hill is lower ($Ea′ < Ea$), but the levels of the starting compounds and products are the same.'),
            src: 'L3 p20'
          },
          {
            pitfall: t('Katalizatorius reakciją tik pagreitina: jis nepakeičia nei produkto, nei to, kiek pusiausvyroje yra pradinės medžiagos ir produkto. Taip pat nesupainiokite intermediato (energijos duobė, kartais galima užfiksuoti) su tarpiniu būviu (energijos viršūnė, tik trumpas pereinamasis akimirksnis).',
              'A catalyst only speeds the reaction up: it changes neither the product nor the ratio of starting material to product at equilibrium. Also do not confuse an intermediate (an energy valley, sometimes detectable) with the transition state (an energy peak, only a brief passing moment).'),
            src: 'L3 p19'
          },
          {
            p: t('Gyvuose organizmuose labai svarbi katalizė fermentais. Fermentai – tai baltymų prigimties biokatalizatoriai; jei juos laikome reagentais, tai medžiagos, kurias jie veikia, yra substratai. Fermentai reakciją gali pagreitinti net $10^15$ kartų.',
              'Enzymatic catalysis is especially important in living organisms. Enzymes are protein biocatalysts; treated as reagents, the substances they act on are substrates. Enzymes can speed up a reaction by as much as $10^15$ times.'),
            src: 'T p30'
          },
          { practice: 'u03.energy' }
        ]
      },

      /* ============ 5. cleavage, radicals, cations, anions ============ */
      {
        id: 'species',
        title: t('Ryšio skilimas: radikalai, katijonai, anijonai', 'Bond cleavage: radicals, cations, anions'),
        blocks: [
          { h: t('Trys reakcijų klasės pagal elektronų persitvarkymą', 'Three reaction classes by electron rearrangement') },
          {
            p: t('Reaguojant organiniams junginiams, vieni kovalentiniai ryšiai nutrūksta, kiti susidaro. Pagal valentinių elektronų persitvarkymą reakcijos būna sinchroninės, heterolizinės (joninės) ir homolizinės (radikalinės).',
              'When organic substances react, some covalent bonds break and others form. By how the valence electrons rearrange, reactions are divided into heterolytic (ionic), homolytic (radical) and synchronous ones.'),
            src: 'L3 p21'
          },
          {
            rule: t('Heterolizinė reakcija: ryšiui nutrūkstant, abu jo elektronai atitenka vienam atomui ($X:Y → X+ + :Y-$), o ryšiui formuojantis abu elektronus pateikia vienas atomas ($X+ + :Y- → X:Y$). Homolizinė reakcija: ryšio elektronų pora pasidalija po lygiai ($X:Y → X• + •Y$), o naujam ryšiui kiekviena dalelė duoda po elektroną. Sinchroninė reakcija: ryšiai nutrūksta ir susidaro tuo pačiu metu, jonų ir radikalų nepasirodant.',
              'Heterolytic reaction: when the bond breaks one atom takes both electrons ($X:Y → X+ + :Y-$), and when a bond forms one atom supplies both electrons ($X+ + :Y- → X:Y$). Homolytic reaction: the bonding pair is divided equally ($X:Y → X• + •Y$), and each particle supplies one electron to form a bond. Synchronous (concerted) reaction: bonds break and form at the same time, and neither ions nor radicals appear.'),
            src: 'L3 p21'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'CBr' }, { arrow: '→' }, { smi: '[CH3+]' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 } }],
              note: t('Heterolizė: abu $C−Br$ ryšio elektronai lieka prie elektrinio neigiamesnio atomo (brono); susidaro karbokatijonas ir bromido anijonas.', 'Heterolysis: both $C−Br$ bonding electrons stay with the more electronegative atom (bromine); a carbocation and a bromide anion form.')
            }],
            caption: t('Pilna rodyklė rodo visos elektronų poros judėjimą.', 'A full-headed arrow shows the movement of a whole electron pair.'),
            src: 'L3 p21'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'ClCl' }, { arrow: '→' }, { smi: '[Cl]' }, { plus: true }, { smi: '[Cl]' }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }],
              note: t('Homolizė: ryšio elektronų pora dalijasi, prie kiekvieno atomo lieka po vieną elektroną; susidaro du radikalai.', 'Homolysis: the bonding pair is shared out, one electron stays on each atom; two radicals form.')
            }],
            caption: t('Pusinė (žūklės kabliuko) rodyklė rodo vieno elektrono judėjimą.', 'A half-headed (fish-hook) arrow shows the movement of one electron.'),
            src: 'L3 p21'
          },
          {
            p: t('Heterolizinės reakcijos dažniausiai vyksta skystyje: stipriai rūgščioje ar šarminėje terpėje arba jonizuojančiuose tirpikliuose (didelė dielektrinė konstanta). Dujose jų beveik nebūna. Homolizinės reakcijos vyksta ir dujose, ir skystyje, ir ant kietų paviršių, dažniausiai grandininiu mechanizmu.',
              'Heterolytic reactions usually take place in the liquid phase, in a strongly acidic or basic medium or in ionising solvents (high dielectric constant). They hardly occur in the gas phase. Homolytic reactions take place in gas, in liquid and on solid surfaces, usually by a chain mechanism.'),
            src: 'T p31'
          },
          { h: t('Radikalai, karbokatijonai ir karbanijonai', 'Radicals, carbocations and carbanions') },
          {
            p: t('Skylant ryšiui susidaro trys tipinės organinės tarpinės dalelės. Radikalas turi nesuporuotą elektroną, karbokatijonas – tuščią $p$ orbitalę (elektronų sekstetą, teigiamas krūvis), karbanijonas – laisvąją elektronų porą (neigiamas krūvis).',
              'Bond cleavage produces three typical organic intermediates. A radical has an unpaired electron, a carbocation has an empty $p$ orbital (an electron sextet, positive charge) and a carbanion has a lone pair (negative charge).'),
            src: 'L3 p21'
          },
          {
            mol: [
              { smi: '[CH3]', caption: t('radikalas: nesuporuotas elektronas', 'radical: unpaired electron') },
              { smi: '[CH3+]', caption: t('karbokatijonas: sekstetas, tuščia $p$ orbitalė', 'carbocation: sextet, empty $p$ orbital') },
              { smi: '[CH3-]', caption: t('karbanijonas: laisvoji pora', 'carbanion: lone pair'), opts: { lonePairs: true } }
            ]
          },
          {
            rule: t('Karbokatijonų ir radikalų stabilumas didėja šia tvarka: metilo < pirminis < antrinis < tretinis < alilo < benzilo. Alkilo grupės elektronų tankį perduoda centrui (+I efektas, hiperkonjugacija), o alilo ir benzilo dalelėse krūvis ar nesuporuotas elektronas delokalizuojasi konjuguotoje sistemoje. Karbanijonams alkilo grupės veikia priešingai (jos didina elektronų tankį ir destabilizuoja), o alilo ir benzilo karbanijonai stabilizuojami delokalizacija.',
              'The stability of carbocations and radicals grows in the order methyl < primary < secondary < tertiary < allyl < benzyl. Alkyl groups pass electron density to the centre (+I effect, hyperconjugation), and in allyl and benzyl particles the charge or unpaired electron is delocalised over a conjugated system. For carbanions alkyl groups act the other way (they add electron density and destabilise), while allyl and benzyl carbanions are stabilised by delocalisation.'),
            src: 'L7 p9'
          },
          {
            mol: [
              { smi: '[CH3+]', caption: t('metilo', 'methyl') },
              { smi: 'C[CH2+]', caption: t('pirminis', 'primary') },
              { smi: 'C[CH+]C', caption: t('antrinis', 'secondary') },
              { smi: 'C[C+](C)C', caption: t('tretinis', 'tertiary') },
              { smi: 'C=C[CH2+]', caption: t('alilo', 'allyl') },
              { smi: '[CH2+]c1ccccc1', caption: t('benzilo', 'benzyl') }
            ],
            caption: t('Karbokatijonų stabilumas didėja iš kairės į dešinę.', 'Carbocation stability grows from left to right.'),
            src: 'L7 p9'
          },
          {
            p: t('Homolizinių reakcijų reagentai yra laisvieji radikalai, pavyzdžiui $CH2=CH−CH2•$, $C6H5CH2•$, $(C6H5)3C•$, $HOO•$, $HO•$, $Cl•$ ir $Br•$.',
              'The reagents of homolytic reactions are free radicals, for example $CH2=CH−CH2•$, $C6H5CH2•$, $(C6H5)3C•$, $HOO•$, $HO•$, $Cl•$ and $Br•$.'),
            src: 'L3 p31'
          },
          {
            pitfall: t('Pusinė (kabliuko pavidalo) rodyklė rodo vieną elektroną ir yra tik radikalinėms reakcijoms; heterolizinėms reakcijoms visada braižoma pilna rodyklė. Taip pat nesupainiokite karbokatijono ir radikalo: karbokatijonas neturi nei vieno elektrono toje orbitalėje, o radikalas turi vieną.',
              'A half-headed arrow shows one electron and is used only for radical reactions; for heterolytic reactions always draw a full-headed arrow. Also do not confuse a carbocation with a radical: a carbocation has no electron in that orbital, a radical has one.'),
            src: 'L3 p21'
          },
          {
            example: {
              q: [
                { p: t('2-brom-2-metilpropanas ištirpsta vandenyje ir heterolizės būdu praranda bromidą. Koks karbokatijonas susidaro ir kodėl būtent toks? Atomų numeriai atitinka SMILES eilės tvarką.', '2-Bromo-2-methylpropane dissolves in water and loses bromide by heterolysis. Which carbocation forms and why? The atom numbers follow the order in which the atoms are listed.') },
                { mol: { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane'), opts: { numbers: 'all' } } }
              ],
              steps: [
                [{ p: t('Ryšys $C2−Br5$ skyla heterolizės būdu: abu elektronai pasilieka prie brono ($Br-$), o anglis Nr. 2 lieka su elektronų sekstetu.', 'The bond $C2−Br5$ breaks heterolytically: both electrons stay on bromine ($Br-$) and carbon no. 2 is left with an electron sextet.') }],
                [{ p: t('Anglis Nr. 2 turi tris kitus anglies atomus, todėl tai tretinis karbokatijonas.', 'Carbon no. 2 has three other carbon atoms, so it is a tertiary carbocation.') }],
                [{ p: t('Trys metilo grupės perduoda centrui elektronų tankį (+I, hiperkonjugacija); tretinis katijonas stabilesnis už antrinį ir pirminį, todėl būtent toks ir susidaro.', 'The three methyl groups pass electron density to the centre (+I, hyperconjugation); a tertiary cation is more stable than a secondary or primary one, which is why it forms.') },
                  { mol: { smi: 'C[C+](C)C' } }]
              ]
            },
            claims: [{ name: ['CC(C)(C)Br', t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane')] }, { carbon: ['CC(C)(C)Br', 1, 3] }, { formula: ['C[C+](C)C', 'C4H9+'] }]
          },
          { practice: 'u03.species' },
          { practice: 'u03.stab' },
          { practice: 'u03.cleave' }
        ]
      },

      /* ============ 6. reagents: nucleophiles and electrophiles ============ */
      {
        id: 'reagents',
        title: t('Reagentai: elektrofilai ir nukleofilai', 'Reagents: electrophiles and nucleophiles'),
        blocks: [
          { h: t('Reagentas ir substratas', 'Reagent and substrate') },
          {
            p: t('Elementariame reakcijos akte paprastai dalyvauja dvi dalelės (tirpiklio molekulių neskaitome). Sutarta vieną vadinti reagentu, kitą – substratu. Reagentu laikoma chemiškai aktyvesnė ir mažesnė dalelė, o substratu – ta, kuri naujam kovalentiniam ryšiui suteikia anglies atomą. Pavyzdžiui, reakcijoje $CH3I + HO- → CH3OH + I-$ reagentas yra $HO-$, o substratas – $CH3I$.',
              'An elementary act of reaction usually involves two particles (not counting solvent molecules). By convention one is called the reagent and the other the substrate. The reagent is the smaller, chemically more active particle, and the substrate is the particle that gives the carbon atom for the new covalent bond. For example, in $CH3I + HO- → CH3OH + I-$ the reagent is $HO-$ and the substrate is $CH3I$.'),
            src: 'L3 p22'
          },
          {
            p: t('Heterolizinių reakcijų reagentai yra dviejų tipų: elektrofilai ir nukleofilai. Jų sąveika yra elektronų poros perdavimas: nukleofilas ją duoda, elektrofilas priima.',
              'The reagents of heterolytic reactions are of two types: electrophiles and nucleophiles. Their interaction is the transfer of an electron pair: the nucleophile gives it and the electrophile accepts it.'),
            src: 'L3 p23'
          },
          {
            rule: t('Elektrofilas – teigiamai įkrauta dalelė arba molekulės fragmentas su tuščia orbitale (ar daliniu teigiamu krūviu), galintis priimti nukleofilo elektronų porą. Tai katijonai ($NO2+$, $H+$, $Cl+$, $Br+$, $RC+=O$, $R3C+$) ir neutralios polinės molekulės, turinčios $δ+$ atomų ($SO3$, $BF3$, $AlCl3$, $FeBr3$, $R3C−X$). Nukleofilas – reagentas su laisvąja elektronų pora: anijonas ($HO-$, $RO-$, $HS-$, $RS-$, $NH2-$, $H-$, $RCOO-$, $Hal-$) arba neutrali molekulė ($H2O$, $NH3$, $NR3$, $ROR$, $ROH$). Nukleofilas puola tuos molekulės taškus, kuriuose elektronų tankis yra mažiausias ($δ+$).',
              'An electrophile is a positively charged particle or molecular fragment with an empty orbital (or a partial positive charge) that can accept the electron pair of a nucleophile. These are cations ($NO2+$, $H+$, $Cl+$, $Br+$, $RC+=O$, $R3C+$) and neutral polar molecules that contain $δ+$ atoms ($SO3$, $BF3$, $AlCl3$, $FeBr3$, $R3C−X$). A nucleophile is a reagent with a lone pair: an anion ($HO-$, $RO-$, $HS-$, $RS-$, $NH2-$, $H-$, $RCOO-$, $Hal-$) or a neutral molecule ($H2O$, $NH3$, $NR3$, $ROR$, $ROH$). A nucleophile attacks the spots of the molecule where the electron density is lowest ($δ+$).'),
            src: 'L3 p23'
          },
          {
            mol: [
              { smi: 'O=[N+]=O', caption: t('$NO2+$ (elektrofilas)', '$NO2+$ (electrophile)') },
              { smi: 'C[C+]=O', caption: t('$CH3CO+$ (elektrofilas)', '$CH3CO+$ (electrophile)') },
              { smi: 'O=S(=O)=O', caption: t('$SO3$ (elektrofilas)', '$SO3$ (electrophile)') },
              { smi: '[C-]#N', caption: t('$CN-$ (nukleofilas)', '$CN-$ (nucleophile)'), opts: { lonePairs: true } },
              { smi: 'CO', caption: t('$CH3OH$ (nukleofilas)', '$CH3OH$ (nucleophile)'), opts: { lonePairs: true } },
              { smi: 'CN', caption: t('$CH3NH2$ (nukleofilas)', '$CH3NH2$ (nucleophile)'), opts: { lonePairs: true } }
            ],
            src: 'L3 p23'
          },
          { h: t('Kur yra nukleofilinis ir elektrofilinis centras', 'Where the nucleophilic and electrophilic centres are') },
          {
            p: t('Nukleofiliniai centrai yra deguonies ar azoto laisvoji pora, karbanijono pora ir dvigubojo ryšio $π$ elektronai. Elektrofiliniai centrai yra karbokatijonas, anglis su halogenu, vandenilis prie elektrinio neigiamo atomo ir karbonilo grupės anglis. Ta pati molekulė gali turėti ir nukleofilinį, ir elektrofilinį centrą.',
              'Nucleophilic centres are the lone pair of oxygen or nitrogen, the pair of a carbanion and the $π$ electrons of a double bond. Electrophilic centres are a carbocation, a carbon bearing a halogen, a hydrogen on an electronegative atom, and the carbon of a carbonyl group. One molecule can have both a nucleophilic and an electrophilic centre.'),
            src: 'L3 p30'
          },
          {
            mol: [
              { smi: 'NC1CCC(Br)CC1', name: t('4-bromcikloheksanaminas', '4-bromocyclohexan-1-amine'), opts: { lonePairs: [0], deltas: { 4: '+', 5: '-' } } },
              { smi: 'CC(=O)Cl', name: t('etanoilchloridas', 'ethanoyl chloride'), opts: { lonePairs: [2], deltas: { 1: '+' } } }
            ],
            caption: t('Pirmoje molekulėje $−NH2$ laisvoji pora yra nukleofilinis centras, o anglis su bromu ($δ+$) – elektrofilinis. Antroje $O$ laisvosios poros yra nukleofilinis, o karbonilo anglis ($δ+$) – elektrofilinis centras.',
              'In the first molecule the $−NH2$ lone pair is the nucleophilic centre and the carbon bonded to bromine ($δ+$) is the electrophilic one. In the second the $O$ lone pairs are nucleophilic and the carbonyl carbon ($δ+$) is the electrophilic centre.'),
            src: 'L3 p30'
          },
          { h: t('Nukleofiliškumas', 'Nucleophilicity') },
          {
            p: t('Nukleofiliškumas – tai geba prisijungti prie anglies ar kito atomo, turinčio pilną ar nepilną teigiamą krūvį, naujam ryšiui atiduodant savo elektronų porą. Dažniausiai jis kinta panašiai kaip bazingumas: hidroksido jonas bazingesnis bei nukleofiliškesnis už acetatą $CH3COO-$, o acetatas – už vandenį.',
              'Nucleophilicity is the ability to bond to a carbon or other atom with a partial or full positive charge, giving up its electron pair to form the bond. It often changes just like basicity: $HO-$ is more basic and more nucleophilic than the acetate ion $CH3COO-$, and that in turn is more than $H2O$.'),
            src: 'L3 p25'
          },
          {
            list: [
              t('Einant periodu iš kairės į dešinę (nuo anglies prie azoto, deguonies, fluoro), elektrinis neigiamumas didėja, atomas elektronų porą laiko stipriau ir nukleofiliškumas mažėja: $CH3- > NH2- > HO- > F-$ ir $NH3 > H2O > HF$.', 'Going across a period from left to right (from carbon to nitrogen, oxygen, fluorine) electronegativity grows, the atom holds its pair more tightly and nucleophilicity falls: $CH3- > NH2- > HO- > F-$ and $NH3 > H2O > HF$.'),
              t('Anijonai nukleofiliškesni už atitinkamas neutralias molekules (pavyzdžiui $HO- > H2O$, $NH2- > NH3$, $HS- > H2S$, $F- > HF$). Tarp neutralių nukleofilų aminai yra stipriausi, alkoholiai, vanduo bei fenoliai kur kas silpnesni.', 'Anions are more nucleophilic than the corresponding neutral molecules (for example $HO- > H2O$, $NH2- > NH3$, $HS- > H2S$, $F- > HF$). Among neutral nucleophiles amines are the strongest, alcohols, water and phenols are much weaker.'),
              t('Elektronų donoriniai pakaitai nukleofiliškumą didina, akceptoriniai – mažina: $CH3O- > HO- > C6H5O- > CH3COO-$ ir $CH3OH > H2O > C6H5OH > CH3COOH$.', 'Electron-donating substituents raise nucleophilicity, accepting ones lower it: $CH3O- > HO- > C6H5O- > CH3COO-$ and $CH3OH > H2O > C6H5OH > CH3COOH$.'),
              t('Vienoje grupėje žemyn nukleofiliškumas auga, nors bazingumas silpnėja: $HS-$ nukleofiliškesnis už $HO-$, tioliai yra geresni nukleofilai už alkoholius, bet blogesnės bazės.', 'Within one group, going down, nucleophilicity grows although basicity falls: $HS-$ is more nucleophilic than $HO-$, thiols are more nucleophilic than alcohols, and alcohols are stronger bases than thiols.'),
              t('Erdviniai trukdžiai nukleofiliškumą mažina: tret-butoksido anijonas yra labai stipri bazė, bet silpnas nukleofilas, nes didelės grupės trukdo prieiti prie anglies, o mažas protonas pasiekiamas lengvai.', 'Steric hindrance lowers nucleophilicity: the tert-butoxide anion is a very strong base but a weak nucleophile, because the bulky groups block the approach to carbon, while the small proton is reached easily.')
            ],
            ordered: true,
            src: 'L3 p26'
          },
          {
            pitfall: t('Nukleofiliškumas ir bazingumas kinta ne visada vienodai. Kriterijus, tinkantis atomams vienoje eilutėje, žemyn grupe duoda priešingą rezultatą, o erdviniai trukdžiai eilę visiškai pakeičia.',
              'Nucleophilicity does not always change like basicity. The criterion that works when comparing atoms in one row gives the opposite result down a group, and steric hindrance changes the order altogether.'),
            src: 'L3 p29'
          },
          {
            example: {
              q: [
                { p: t('Išdėstykite šiuos anijonus nukleofiliškumo mažėjimo tvarka ir paaiškinkite.', 'Put these anions in order of decreasing nucleophilicity and explain.') },
                { mol: [{ smi: 'C[O-]', opts: { lonePairs: true } }, { smi: '[O-]c1ccccc1', opts: { lonePairs: [0] } }, { smi: 'CC(=O)[O-]', opts: { lonePairs: [3] } }] }
              ],
              steps: [
                [{ p: t('Visi trys anijonai nukleofilinį centrą turi ant deguonies, todėl palyginamas pakaitų poveikis tam deguoniui.', 'All three anions have the nucleophilic centre on oxygen, so what is compared is the effect of the substituent on that oxygen.') }],
                [{ p: t('Metoksido deguonį veikia donorinė metilo grupė, o neigiamas krūvis lieka ant deguonies: nukleofiliškiausias.', 'The oxygen of methoxide is affected by the donating methyl group and the negative charge stays on oxygen: the most nucleophilic.') }],
                [{ p: t('Fenoksido krūvis dalijasi su benzeno žiedu ($p,π$ konjugacija), todėl deguonis laisvesnę porą atiduoda sunkiau.', 'The charge of phenoxide is shared with the benzene ring ($p,π$ conjugation), so the oxygen gives up its pair less readily.') }],
                [{ p: t('Acetato krūvis dalijasi tarp dviejų deguonies atomų ir dar traukiamas karbonilo grupės: silpniausias nukleofilas. Eilė: $CH3O- > C6H5O- > CH3COO-$.', 'The acetate charge is shared between two oxygens and pulled by the carbonyl group: the weakest nucleophile. Order: $CH3O- > C6H5O- > CH3COO-$.') }]
              ]
            }
          },
          { practice: 'u03.nuel' },
          { practice: 'u03.nuc' }
        ]
      },

      /* ============ 7. classification of reactions, mechanism symbols ============ */
      {
        id: 'classes',
        title: t('Reakcijų klasifikacija ir mechanizmų simboliai', 'Classification of reactions and mechanism symbols'),
        blocks: [
          { h: t('Trys klasifikacijos', 'Three classifications') },
          {
            p: t('Organines reakcijas galima klasifikuoti trimis būdais: pagal ryšių skilimo pobūdį (heterolizinės, homolizinės, sinchroninės), pagal reagento tipą ir pagal rezultatą. Pagal reagentą reakcijos būna nukleofilinės (N), elektrofilinės (E) ir radikalinės (R); sinchroninėse reakcijose reagento ir substrato skirtumas netenka prasmės. Pagal rezultatą jos skirstomos į pakeitimo (S), jungimosi (A), eliminavimo (E) ir persigrupavimo reakcijas.',
              'Organic reactions can be classified in three ways: by how the bonds break (heterolytic, homolytic, synchronous), by the type of reagent and by the result. By reagent, reactions are nucleophilic (N), electrophilic (E) or radical (R); for synchronous reactions the ideas of reagent and substrate make no sense. By result, they are substitution (S), addition (A), elimination (E) and rearrangement reactions.'),
            src: 'L3 p31'
          },
          {
            rule: t('Pakeitimo reakcijoje dvi medžiagos apsikeičia fragmentais ir iš jų atsiranda dvi kitos. Jungimosi reakcijoje dvi medžiagos susijungia į vieną. Eliminavimo reakcijoje viena medžiaga suskyla į dvi naujas. Persigrupavimo reakcijoje vienos medžiagos ryšiai ir atomai persitvarko ir susidaro jos izomeras.',
              'In a substitution two reacting substances exchange parts and two new substances form. In an addition two substances join into one. In an elimination one substance splits into two new ones. In a rearrangement the bonds and atoms of one substance are reorganised and its isomer forms.'),
            src: 'L3 p32'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OC' }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H+') }, { smi: 'CC(=O)O' }, { plus: true }, { smi: 'CO' }] },
            caption: t('Pakeitimas: esterio ir vandens dalys pasikeičia vietomis.', 'Substitution: the ester and water exchange parts.'),
            src: 'L3 p32'
          },
          {
            scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CCBr' }] },
            caption: t('Jungimasis: eteno ir $HBr$ molekulės susijungia į vieną produktą.', 'Addition: ethene and $HBr$ join into one product.'),
            src: 'L3 p32'
          },
          {
            scheme: { items: [{ smi: 'CCO' }, { arrow: '⇌', above: f('H+') }, { smi: 'C=C' }, { plus: true }, { smi: 'O' }] },
            caption: t('Eliminavimas: etanolis skyla į etreną ir vandenį.', 'Elimination: ethanol splits into ethene and water.'),
            src: 'L3 p33'
          },
          {
            scheme: { items: [{ smi: 'OCC(=O)CO' }, { arrow: '→' }, { smi: 'OCC(O)C=O' }] },
            caption: t('Persigrupavimas: dihidroksiacetonas virsta savo izomeru gliceraldehidu.', 'Rearrangement: dihydroxyacetone turns into its isomer glyceraldehyde.'),
            src: 'L3 p33'
          },
          { h: t('Klasifikacijų sujungimas: mechanizmų simboliai', 'Combining the classifications: mechanism symbols') },
          {
            p: t('Abi klasifikacijas priimta jungti: apatinis indeksas nurodo atakuojančio reagento tipą. Pakeitimo reakcijos gali būti nukleofilinės ($SN$), elektrofilinės ($SE$) ir radikalinės ($SR$). Šiame skyriuje tik susipažįstama su simboliais; kiekvieną iš jų kitose temose išnagrinėsime išsamiai.',
              'It is customary to combine the two classifications: the subscript names the type of attacking reagent. Substitutions can be nucleophilic ($SN$), electrophilic ($SE$) or radical ($SR$). This unit only introduces the symbols; each one is studied in detail in later units.'),
            src: 'L3 p34'
          },
          {
            scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[I-]' }] },
            caption: t('$SN$: nukleofilas $HO-$ pakeičia jodą metilo jodide (haloalkanai, alkoholiai, rūgštys ir jų dariniai).', '$SN$: the nucleophile $HO-$ replaces iodine in methyl iodide (haloalkanes, alcohols, acids and their derivatives).'),
            src: 'L3 p34'
          },
          {
            scheme: { items: [{ smi: 'c1ccccc1' }, { plus: true }, { smi: 'O=[N+]=O' }, { arrow: '→' }, { smi: 'O=[N+]([O-])c1ccccc1' }, { plus: true }, { smi: '[H+]' }] },
            caption: t('$SEAr$: elektrofilas $NO2+$ pakeičia vandenilį benzene (arenai ir heteroarenai).', '$SEAr$: the electrophile $NO2+$ replaces a hydrogen in benzene (arenes and heteroarenes).'),
            src: 'L3 p34'
          },
          {
            scheme: { items: [{ smi: '[Cl]' }, { plus: true }, { smi: 'C' }, { arrow: '→' }, { smi: 'Cl' }, { plus: true }, { smi: '[CH3]' }] },
            caption: t('$SR$: chloro atomas (radikalas) atplėšia vandenilį nuo metano (sotieji angliavandeniliai). Susidaręs metilo radikalas reaguoja su $Cl2$ ir sudaro $CH3Cl$ bei naują $Cl•$.', '$SR$: a chlorine atom (radical) abstracts hydrogen from methane (saturated hydrocarbons). The methyl radical formed reacts with $Cl2$ giving $CH3Cl$ and a new $Cl•$.'),
            src: 'L3 p34'
          },
          {
            table: {
              head: [t('Simbolis', 'Symbol'), t('Pavadinimas', 'Name'), t('Tipiški substratai', 'Typical substrates'), t('Atakuojantis reagentas', 'Attacking reagent')],
              rows: [
                [t('$SR$', '$SR$'), t('radikalinis pakeitimas', 'radical substitution'), t('alkanai', 'alkanes'), t('radikalas', 'radical')],
                [t('$SN1$, $SN2$', '$SN1$, $SN2$'), t('nukleofilinis pakeitimas', 'nucleophilic substitution'), t('haloalkanai, alkoholiai', 'haloalkanes, alcohols'), t('nukleofilas', 'nucleophile')],
                [t('$SEAr$', '$SEAr$'), t('elektrofilinis aromatinis pakeitimas', 'electrophilic aromatic substitution'), t('arenai', 'arenes'), t('elektrofilas', 'electrophile')],
                [t('$AE$', '$AE$'), t('elektrofilinis jungimasis', 'electrophilic addition'), t('alkenai, alkinai, dienai', 'alkenes, alkynes, dienes'), t('elektrofilas ($H+$)', 'electrophile ($H+$)')],
                [t('$AN$', '$AN$'), t('nukleofilinis jungimasis', 'nucleophilic addition'), t('aldehidai, ketonai', 'aldehydes, ketones'), t('nukleofilas', 'nucleophile')],
                [t('$E1$, $E2$', '$E1$, $E2$'), t('eliminavimas', 'elimination'), t('haloalkanai, alkoholiai', 'haloalkanes, alcohols'), t('bazė', 'base')]
              ]
            },
            src: 'L3 p34'
          },
          {
            pitfall: t('Raidė E turi dvi reikšmes: kaip apatinis indeksas ($SE$, $AE$) ji žymi elektrofilinį reagentą, o viena ($E1$, $E2$) – eliminavimą. Pagal reaguojančių ir susidarančių dalelių skaičių atskirkite tipą: 2 → 2 pakeitimas, 2 → 1 jungimasis, 1 → 2 eliminavimas, 1 → 1 persigrupavimas.',
              'The letter E has two meanings: as a subscript ($SE$, $AE$) it marks an electrophilic reagent, on its own ($E1$, $E2$) it means elimination. Tell the type from the number of particles that react and form: 2 → 2 substitution, 2 → 1 addition, 1 → 2 elimination, 1 → 1 rearrangement.'),
            src: 'L3 p32'
          },
          {
            example: {
              q: [
                { p: t('Nustatykite, ar kiekviena iš šių reakcijų yra pakeitimo, ar jungimosi, ar eliminavimo, ar persigrupavimo.', 'Which type (substitution, addition, elimination, rearrangement) are these reactions?') },
                {
                  scheme: { items: [{ smi: 'CBr' }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[Br-]' }] }
                },
                { scheme: { items: [{ smi: 'CCBr' }, { arrow: '→' }, { smi: 'C=C' }, { plus: true }, { smi: 'Br' }] } },
                { scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: '[H][H]' }, { arrow: '→' }, { smi: 'CC' }] } }
              ],
              steps: [
                [{ p: t('Pirmojoje dvi dalelės ($CH3Br$ ir $HO-$) apsikeičia fragmentais ir atsiranda dvi kitos ($CH3OH$ ir $Br-$): pakeitimas.', 'In the first, two particles ($CH3Br$ and $HO-$) exchange parts and two new ones form ($CH3OH$ and $Br-$): substitution.') }],
                [{ p: t('Antrojoje viena molekulė skyla į dvi ($C=C$ ir $HBr$): eliminavimas.', 'In the second one molecule splits into two (an alkene and $HBr$): elimination.') }],
                [{ p: t('Trečiojoje dvi molekulės susijungia į vieną ($C=C$ prisijungia $H2$): jungimasis.', 'In the third two molecules join into one ($H2$ adds to $C=C$): addition.') }]
              ]
            },
            claims: [{ react: ['sn2', ['CBr'], { nu: 'OH' }, 'CO'] }, { react: ['elim', ['CCBr'], { base: 'strong' }, 'C=C'] }, { react: ['ae.h2', ['C=C'], null, 'CC'] }]
          },
          { practice: 'u03.rtype' }
        ]
      },

      /* ============ 8. curved arrows ============ */
      {
        id: 'arrows',
        title: t('Lenktos rodyklės: elektronų judėjimas reakcijoje', 'Curved arrows: how electrons move in a reaction'),
        blocks: [
          { h: t('Kaip skaityti ir braižyti lenktas rodykles', 'How to read and draw curved arrows') },
          {
            p: t('Heterolizinių reakcijų eigą piešiame lenktomis rodyklėmis: iš nukleofilo elektronų poros ($Nu:$ ar $Nu:-$) rodyklė nukreipta į elektrofilą, o jos smaigalys atsiremia į elektrofilinį centrą, į kurį ta pora keliauja. Rodyklė visada vaizduoja elektronus, ne atomus.',
              'The course of a heterolytic reaction is shown with curved arrows. The tail of an arrow marks the electron pair of the nucleophile ($Nu:$ or $Nu:-$) that moves towards the electrophile, and the head marks the electrophilic centre the pair moves to. An arrow always shows electrons, never atoms.'),
            src: 'L3 p36'
          },
          {
            rule: t('Rodyklės pradžia: laisvoji elektronų pora arba ryšys (taip pat $π$ ryšys). Rodyklės galas: atomas (naujas ryšys su juo) arba tarpas tarp atomų. Būtina paisyti oktetų taisyklės: kai pora artėja prie atomo, jau turinčio aštuonis elektronus (vandenilio – du), iš to atomo privalo pasitraukti kita pora. Neigiamo krūvio nukleofilas, puldamas teigiamą elektrofilą, sudaro neutralų prijungimo produktą.',
              'The tail starts at a lone pair or a bond (a $π$ bond too). The head ends at an atom (a new bond to it) or in the gap between two atoms. The octet rule must be kept: if an electron pair moves towards an atom that already has eight electrons (two for hydrogen), another pair must move away from that atom. A negatively charged nucleophile attacks a positively charged electrophile and a neutral addition product forms.'),
            src: 'L3 p37'
          },
          {
            list: [
              t('Raskite nukleofilą (laisvoji pora, $π$ ryšys, neigiamas krūvis) ir elektrofilą ($δ+$, katijonas, tuščia orbitalė).', 'Find the nucleophile (lone pair, $π$ bond, negative charge) and the electrophile ($δ+$, cation, empty orbital).'),
              t('Nubrėžkite rodyklę nuo nukleofilo elektronų poros prie elektrofilo atomo.', 'Draw an arrow from the electron pair of the nucleophile to the atom of the electrophile.'),
              t('Patikrinkite oktetą: jei elektrofilo atomas dėl to viršytų oktetą, nubrėžkite antrą rodyklę nuo jo kito ryšio prie atomo, kuris išeina (išeinančioji grupė).', 'Check the octet: if the electrophile atom would then exceed an octet, draw a second arrow from one of its other bonds to the atom that leaves (the leaving group).'),
              t('Užrašykite produktus su teisingais formaliaisiais krūviais.', 'Write the products with the correct formal charges.')
            ],
            ordered: true,
            src: 'L3 p37'
          },
          {
            mech: [{
              scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[C+](C)C' }, { arrow: '→' }, { smi: 'CC(C)(C)Br' }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }],
              note: t('Anijonas atakuoja katijoną: pakanka vienos rodyklės, nes katijono atomas turi tuščią orbitalę ir oktetas neviršijamas.', 'An anion attacks a cation: one arrow is enough because the cation atom has an empty orbital and the octet is not exceeded.')
            }],
            caption: t('Nukleofilas ir teigiamas elektrofilas.', 'A nucleophile and a positive electrophile.'),
            src: 'L3 p37'
          },
          {
            mech: [{
              scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[I-]' }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
              note: t('Anglis jau turi oktetą, todėl, atėjus deguonies porai, $C−I$ elektronai pasitraukia prie jodo.', 'Carbon already has an octet, so when the pair of oxygen arrives, the $C−I$ electrons leave to iodine.')
            }],
            caption: t('Neutrali polinė molekulė kaip elektrofilas ($δ+$ anglis).', 'A neutral polar molecule as an electrophile (a $δ+$ carbon).'),
            src: 'L3 p34'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'CO', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC([O-])(Cl)[OH+]C' }] },
              arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
              note: t('Neutralus nukleofilas (alkoholis) atakuoja dalinį teigiamą krūvį turinčią karbonilo anglį; $π$ ryšys pereina prie deguonies.', 'A neutral nucleophile (an alcohol) attacks the partly positive carbonyl carbon; the $π$ bond moves to oxygen.')
            }],
            caption: t('Neutralus nukleofilas ir polinė $C=O$ grupė.', 'A neutral nucleophile and a polar $C=O$ group.'),
            src: 'L3 p37'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'CC(=O)[CH2-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'CC(=O)CC' }, { plus: true }, { smi: '[Br-]' }] },
              arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
              note: t('Karbanijono anglies pora sudaro naują $C−C$ ryšį, o $C−Br$ elektronai pereina bromui.', 'The pair of the carbanion carbon forms a new $C−C$ bond and the $C−Br$ electrons go to bromine.')
            }],
            caption: t('Karbanijonas kaip nukleofilas.', 'A carbanion as a nucleophile.'),
            src: 'L3 p38'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'C=C', opts: { allH: true } }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'C[CH2+]' }, { plus: true }, { smi: '[Br-]' }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('Dvigubojo ryšio $π$ elektronai yra nukleofilas: jie atakuoja protoną, o $H−Br$ elektronai pereina bromui.', 'The $π$ electrons of the double bond act as the nucleophile: they attack the proton while the $H−Br$ electrons go to bromine.')
            }],
            caption: t('$π$ ryšys kaip nukleofilas (pirmoji $AE$ stadija).', 'A $π$ bond as the nucleophile (the first stage of $AE$).'),
            src: 'L3 p36'
          },
          {
            pitfall: t('Dažniausios klaidos: rodyklė pradedama nuo atomo ar protono, o ne nuo elektronų poros ar ryšio; rodyklė nubrėžiama nuo elektrofilo prie nukleofilo; atėjus porai prie atomo su oktetu neparodoma, kuri pora išeina. Protono pernešimui reikia dviejų rodyklių: nuo bazės poros prie $H$ ir nuo $H−A$ ryšio prie $A$.',
              'Typical mistakes: starting the arrow at an atom or at the proton instead of at an electron pair or a bond; drawing the arrow from the electrophile to the nucleophile; not showing which pair leaves when a pair arrives at an atom with an octet. A proton transfer needs two arrows: from the lone pair of the base to $H$ and from the $H−A$ bond to $A$.'),
            src: 'L3 p37'
          },
          {
            example: {
              q: [
                { p: t('Pavaizduokite lenktomis rodyklėmis, kaip amoniakas reaguoja su vandenilio chloridu.', 'Show with curved arrows how ammonia reacts with hydrogen chloride.') },
                { scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: '[NH4+]' }, { plus: true }, { smi: '[Cl-]' }] } }
              ],
              steps: [
                [{ p: t('Amoniakas turi azoto laisvąją porą: tai nukleofilas. Vandenilio chlorido protonas yra elektrofilas ($δ+$).', 'Ammonia has a nitrogen lone pair: it is the nucleophile. The proton of hydrogen chloride is the electrophile ($δ+$).') }],
                [{ p: t('Pirmoji rodyklė: nuo azoto laisvosios poros prie $H$.', 'First arrow: from the nitrogen lone pair to $H$.') }],
                [{ p: t('Vandenilis jau turi dvi elektronų poros (dublet), todėl kita pora turi pasitraukti: antroji rodyklė nuo $H−Cl$ ryšio prie chloro.', 'Hydrogen already has its two electrons (a duet), so another pair must leave: the second arrow goes from the $H−Cl$ bond to chlorine.') },
                  {
                    mech: [{
                      scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'Cl', opts: { allH: true } }, { arrow: '→' }, { smi: '[NH4+]' }, { plus: true }, { smi: '[Cl-]' }] },
                      arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }]
                    }]
                  }]
              ]
            },
            claims: [{ formula: ['[NH4+]', 'H4N+'] }, { formula: ['N', 'H3N'] }]
          },
          { practice: 'u03.arrows' },
          { practice: 'u03.products' }
        ]
      },

      /* ============ 9. oxidation and reduction ============ */
      {
        id: 'redox',
        title: t('Oksidacija, redukcija ir oksidacijos laipsnis', 'Oxidation, reduction and oxidation state'),
        blocks: [
          { h: t('Ką reiškia oksidacija organinėje chemijoje', 'What oxidation means in organic chemistry') },
          {
            p: t('Oksidacija – tai elektronų netekimas, t. y. elektronų tankio prie anglies sumažėjimas, o redukcija – elektronų įgijimas, t. y. tankio padidėjimas. Oksidacijos laipsnis – sąlyginis krūvis, kurį atomas turėtų junginyje, jei visus ryšio elektronus visiškai atiduotų arba paimtų.',
              'Oxidation is loss of electrons (a drop in electron density at a carbon atom), reduction is gain of electrons (a rise in density). The oxidation state is the formal charge an atom would have in a compound if all bonding electrons were completely given up or taken.'),
            src: 'L3 p40'
          },
          {
            rule: t('Anglies oksidacijos laipsnį randame sudėdami ryšių įnašus: kiekvienas ryšys su didesnio elektrinio neigiamumo atomu ($O$, $N$, halogenu) duoda +1, kiekvienas ryšys su $H$ duoda −1, ryšys su kita anglimi duoda 0; dvigubas ryšys skaičiuojamas du kartus. Jei reakcijoje oksidacijos laipsnis auga, ji yra oksidacija, jei krenta – redukcija.',
              'The oxidation state of carbon is the sum of its bond contributions: each bond to a more electronegative atom ($O$, $N$, halogen) counts +1, each bond to $H$ counts −1, a bond to another carbon counts 0; a double bond counts twice. A reaction in which the oxidation state rises is an oxidation, one in which it falls is a reduction.'),
            src: 'L3 p40'
          },
          {
            table: {
              head: [t('Junginys', 'Compound'), t('Struktūra', 'Structure'), t('Anglies oksidacijos laipsnis', 'Oxidation state of carbon')],
              rows: [
                [t('metanas', 'methane'), { smi: 'C' }, t('−4', '−4')],
                [t('metanolis', 'methanol'), { smi: 'CO' }, t('−2', '−2')],
                [t('metanalis', 'methanal'), { smi: 'C=O' }, t('0', '0')],
                [t('metano rūgštis', 'methanoic acid'), { smi: 'OC=O' }, t('+2', '+2')],
                [t('anglies dioksidas', 'carbon dioxide'), { smi: 'O=C=O' }, t('+4', '+4')]
              ]
            },
            caption: t('Oksidacija vyksta iš viršaus į apačią (didėjantis oksidacijos laipsnis), redukcija – iš apačios į viršų.', 'Oxidation runs from top to bottom (rising oxidation state), reduction from bottom to top.'),
            src: 'L3 p40'
          },
          {
            scheme: { items: [{ smi: 'CC(C)O' }, { arrow: '→', above: f('H2CrO4') }, { smi: 'CC(C)=O' }] },
            caption: t('Izopropanolio oksidacija: karbinolio anglies laipsnis padidėja nuo 0 iki +2.', 'Oxidation of isopropanol: the oxidation state of the carbinol carbon rises from 0 to +2.'),
            src: 'L3 p41'
          },
          {
            scheme: { items: [{ smi: 'C=C(C)C' }, { arrow: '→', above: t('H2O, rūgštis', 'H2O, acid') }, { smi: 'CC(C)(C)O' }] },
            caption: t('Vandens prijungimas prie 2-metilpropeno: viena anglis oksiduojasi, kita redukuojasi, bendras laipsnis nesikeičia – tai nei oksidacija, nei redukcija.', 'Water adds to 2-methylpropene: one carbon is oxidised, the other reduced, the total does not change: this is neither oxidation nor reduction.'),
            src: 'L3 p42'
          },
          {
            pitfall: t('Kai reakcijoje dalyvauja kelios anglys, lyginama reaguojančių anglių oksidacijos laipsnių suma. Pridėjus $H2$ prie dvigubo ryšio anglys redukuojasi, o pridėjus $H2O$ ar $HX$ suma nesikeičia. Oksidacijos laipsnis nėra tikrasis krūvis, tai tik skaičiavimo taisyklė.',
              'When several carbons take part in the reaction, compare the sum of the oxidation states of the reacting carbons. Adding $H2$ across a double bond reduces the carbons, while adding $H2O$ or $HX$ leaves the sum unchanged. The oxidation state is not a real charge, only a counting rule.'),
            src: 'L3 p42'
          },
          {
            example: {
              q: [
                { p: t('2-butanolis oksiduojamas chromo rūgštimi. Ar tai oksidacija, redukcija, ar nei viena? Atomų numeriai atitinka grandinės numeraciją.', '2-Butanol is oxidised with chromic acid. Is it an oxidation, a reduction or neither? The atom numbers follow the chain numbering.') },
                { scheme: { items: [{ smi: 'CC(O)CC', name: t('2-butanolis', 'butan-2-ol'), opts: { numbers: { 0: '1', 1: '2', 3: '3', 4: '4' } } }, { arrow: '→', above: f('H2CrO4') }, { smi: 'CC(=O)CC', name: t('butanonas', 'butan-2-one'), opts: { numbers: { 0: '1', 1: '2', 3: '3', 4: '4' } } }] } }
              ],
              steps: [
                [{ p: t('Atomas Nr. 2 alkoholyje turi ryšius: $O$ (+1), $H$ (−1) ir dvi anglis (0, 0). Suma: 0.', 'Carbon no. 2 in the alcohol has bonds to $O$ (+1), $H$ (−1) and two carbons (0, 0). Sum: 0.') }],
                [{ p: t('Ketone tas pats atomas turi dvigubą ryšį su $O$ (+2) ir dvi anglis (0, 0). Suma: +2.', 'In the ketone the same carbon has a double bond to $O$ (+2) and two carbons (0, 0). Sum: +2.') }],
                [{ p: t('Laipsnis padidėjo nuo 0 iki +2, todėl tai oksidacija. Kitų anglių laipsniai nepakito.', 'The state rose from 0 to +2, so this is an oxidation. The other carbons did not change.') }]
              ]
            },
            claims: [{ react: ['alc.ox', ['CCC(C)O'], { reagent: 'chromic' }, 'CCC(C)=O'] }, { name: ['CC(O)CC', t('2-butanolis', 'butan-2-ol')] }, { name: ['CC(=O)CC', t('butanonas', 'butan-2-one')] }]
          },
          { practice: 'u03.redox' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka: elektroniniai efektai', 'Cheat sheet: electronic effects') },
      {
        table: {
          head: [t('Pakaitas', 'Substituent'), t('Indukcijos', 'Inductive'), t('Mezomerijos', 'Mesomeric'), t('Poveikis', 'Net effect')],
          rows: [
            [t('alkilai', 'alkyl groups'), t('+I', '+I'), t('nėra', 'none'), t('donoras', 'donor')],
            [t('$−NH2$, $−NHR$, $−NR2$', '$−NH2$, $−NHR$, $−NR2$'), t('−I', '−I'), t('+M', '+M'), t('donoras', 'donor')],
            [t('$−OH$, $−OR$, $−SH$', '$−OH$, $−OR$, $−SH$'), t('−I', '−I'), t('+M', '+M'), t('donoras', 'donor')],
            [t('$−F$, $−Cl$, $−Br$, $−I$', '$−F$, $−Cl$, $−Br$, $−I$'), t('−I', '−I'), t('+M', '+M'), t('akceptorius (−I > +M)', 'acceptor (−I > +M)')],
            [t('$>C=O$, $−CHO$, $−COOH$, $−COOR$, $−CONH2$, $−CN$, $−NO2$, $−SO3H$', '$>C=O$, $−CHO$, $−COOH$, $−COOR$, $−CONH2$, $−CN$, $−NO2$, $−SO3H$'), t('−I', '−I'), t('−M', '−M'), t('akceptorius', 'acceptor')]
          ]
        },
        src: 'L3 p14'
      },
      {
        list: [
          t('Indukcijos efektas keliauja per $σ$ ryšius ir gęsta po 2–3 ryšių; mezomerijos efektas keliauja per visą konjuguotąją $π$ sistemą.', 'The inductive effect travels through $σ$ bonds and fades after 2–3 bonds; the mesomeric effect travels through the whole conjugated $π$ system.'),
          t('Konjuguotoji sistema: $π$ ryšiai ar $π$ ryšiai ir laisvosios poros, atskirti vienu viengubuoju ryšiu; $sp3$ atomas ją nutraukia.', 'Conjugated system: $π$ bonds or $π$ bonds and lone pairs separated by one single bond; an $sp3$ atom breaks it.'),
          t('Mezomerijos efektas atsiranda tik tada, kai pakaitas tiesiogiai sujungtas su $π$ sistema (anilinas, bet ne benzilaminas).', 'The mesomeric effect appears only when the substituent is attached directly to the $π$ system (aniline, but not benzylamine).')
        ],
        src: 'L3 p15'
      },
      { h: t('Dalelės ir reagentai', 'Particles and reagents') },
      {
        list: [
          t('Heterolizė: abu elektronai pas vieną atomą (jonai, pilna rodyklė). Homolizė: po vieną elektroną (radikalai, pusinė rodyklė). Sinchroninė: be jonų ir radikalų.', 'Heterolysis: both electrons go to one atom (ions, full-headed arrow). Homolysis: one electron each (radicals, half-headed arrow). Synchronous: no ions and no radicals.'),
          t('Karbokatijonų ir radikalų stabilumas: benzilo > alilo > tretinis > antrinis > pirminis > metilo.', 'Stability of carbocations and radicals: benzyl > allyl > tertiary > secondary > primary > methyl.'),
          t('Nukleofilas turi laisvąją porą (duoda ją), elektrofilas turi tuščią orbitalę ar $δ+$ (priima porą).', 'A nucleophile has a lone pair (gives it); an electrophile has an empty orbital or a $δ+$ (accepts a pair).'),
          t('Nukleofiliškumas: anijonas > neutrali molekulė; periode mažėja iš kairės į dešinę ($CH3- > NH2- > HO- > F-$); grupėje žemyn didėja ($HS- > HO-$); donoriniai pakaitai jį didina; erdviniai trukdžiai mažina.', 'Nucleophilicity: anion > neutral molecule; falls from left to right in a period ($CH3- > NH2- > HO- > F-$); grows down a group ($HS- > HO-$); donor substituents raise it; steric hindrance lowers it.')
        ],
        src: 'L3 p26'
      },
      { h: t('Reakcijų tipai ir simboliai', 'Reaction types and symbols') },
      {
        table: {
          head: [t('Tipas', 'Type'), t('Dalelių skaičius', 'Particles'), t('Simboliai', 'Symbols')],
          rows: [
            [t('pakeitimas', 'substitution'), t('2 → 2', '2 → 2'), t('$SR$, $SN1$, $SN2$, $SEAr$', '$SR$, $SN1$, $SN2$, $SEAr$')],
            [t('jungimasis', 'addition'), t('2 → 1', '2 → 1'), t('$AE$, $AN$', '$AE$, $AN$')],
            [t('eliminavimas', 'elimination'), t('1 → 2', '1 → 2'), t('$E1$, $E2$', '$E1$, $E2$')],
            [t('persigrupavimas', 'rearrangement'), t('1 → 1 (izomeras)', '1 → 1 (isomer)'), t('–', '–')]
          ]
        },
        src: 'L3 p32'
      },
      {
        list: [
          t('Lenktos rodyklės rodo elektronų porų judėjimą: nuo laisvosios poros ar ryšio prie atomo ar ryšio; atėjus porai prie atomo su oktetu viena pora turi išeiti.', 'Curved arrows show the movement of electron pairs: from a lone pair or bond to an atom or bond; when a pair arrives at an atom with an octet, one pair must leave.'),
          t('Oksidacija: anglies oksidacijos laipsnis didėja ($C−O$, $C−N$, $C−X$ +1, $C−H$ −1, $C−C$ 0); redukcija: mažėja; hidratacija ir $HX$ jungimasis nėra redoksas.', 'Oxidation: the oxidation state of carbon rises ($C−O$, $C−N$, $C−X$ +1, $C−H$ −1, $C−C$ 0); reduction: it falls; hydration and $HX$ addition are not redox.'),
          t('Katalizatorius mažina $Ea$ ir greitina reakciją, nekeisdamas pusiausvyros; greitį lemia lėčiausia stadija.', 'A catalyst lowers $Ea$ and speeds the reaction without shifting the equilibrium; the slowest stage sets the rate.')
        ],
        src: 'L3 p42'
      }
    ],
    types: [
      /* ============ u03.induct: inductive effect (generator + bank) ============ */
      {
        id: 'u03.induct',
        title: t('Indukcijos efektas: ženklas ir poveikis grandinei', 'The inductive effect: sign and reach along the chain'),
        mirrors: [],
        gen(rng, ctx) {
          const X = [
            { f: 'F', s: -1, k: 'hal' }, { f: 'Cl', s: -1, k: 'hal' }, { f: 'Br', s: -1, k: 'hal' }, { f: 'I', s: -1, k: 'hal' },
            { f: 'O', s: -1, k: 'het' }, { f: 'OC', s: -1, k: 'het' }, { f: 'N', s: -1, k: 'het' }, { f: 'S', s: -1, k: 'het' },
            { f: '[N+](=O)[O-]', s: -1, k: 'multi' }, { f: 'C#N', s: -1, k: 'multi' }, { f: 'C(=O)O', s: -1, k: 'multi' }, { f: 'C=O', s: -1, k: 'multi' },
            { f: 'C(=O)OC', s: -1, k: 'multi' }, { f: 'C(=O)N', s: -1, k: 'multi' }, { f: 'C(F)(F)F', s: -1, k: 'multi' }, { f: '[NH3+]', s: -1, k: 'cation' },
            { f: '[O-]', s: 1, k: 'anion' }, { f: 'C(=O)[O-]', s: 1, k: 'anion' }, { f: '[S-]', s: 1, k: 'anion' }
          ];
          const x = ctx.pick(X);
          const n = ctx.pick([3, 4, 5]);
          const smi = 'C'.repeat(n) + x.f;
          const mol = ctx.chem.parse(smi);
          const xAtoms = [];
          for (let i = n; i < mol.atoms.length; i++) xAtoms.push(i);
          const view = (extra) => ({ smi, opts: Object.assign({ numbers: 'all', highlight: { atoms: xAtoms, tone: 2 } }, extra || {}) });
          const near = n - 1, far = 0;       // chain atoms: 0 is the far end, n - 1 carries the substituent
          const whyKind = {
            hal: t('Halogenas elektrinis neigiamesnis už anglį, todėl patraukia $σ$ ryšio elektronus.', 'A halogen is more electronegative than carbon, so it pulls the $σ$ bonding electrons.'),
            het: t('Deguonis, azotas ir siera su anglimi sujungti poliniu ryšiu, o jų elektrinis neigiamumas didesnis už anglies, todėl elektronai slenka link heteroatomo.', 'Oxygen, nitrogen and sulfur are bonded to carbon by a polar bond, and their electronegativity is higher than that of carbon, so the electrons shift towards the heteroatom.'),
            multi: t('Grupės atomų (N, O, F) elektrinis neigiamumas didesnis už anglies, be to, jie sujungti daugialypiais ryšiais, todėl grupė traukia elektronus iš grandinės.', 'The atoms of the group (N, O, F) are more electronegative than carbon and are joined by multiple bonds, so the group pulls electrons out of the chain.'),
            cation: t('Grupė turi teigiamą krūvį, todėl stipriai traukia elektronus iš grandinės.', 'The group carries a positive charge, so it pulls electrons strongly out of the chain.'),
            anion: t('Anijonas turi pilną neigiamą krūvį ir dalį jo perduoda grandinei, todėl didina elektronų tankį.', 'An anion has a full negative charge and passes part of it to the chain, so it raises the electron density.')
          }[x.k];
          const dl = {};
          if (x.s < 0) { dl[xAtoms[0]] = '-'; dl[near] = '+'; if (n > 1) dl[near - 1] = '+'; }
          else { dl[near] = '-'; if (n > 1) dl[near - 1] = '-'; }
          const sign = x.s < 0 ? '−I' : '+I';
          return {
            q: [
              { p: t('Pažymėtas pakaitas yra prisijungęs prie sotaus grandinės galo (anglies atomai sunumeruoti nuo tolimojo galo).', 'The marked substituent is attached to the end of a saturated chain (the carbons are numbered from the far end).') },
              { mol: view() }
            ],
            steps: [
              {
                prompt: t('Koks yra pažymėto pakaito indukcijos efektas, palyginus su vandenilio atomu?', 'What is the inductive effect of the marked substituent compared with a hydrogen atom?'),
                kind: 'choice',
                options: [
                  { text: t('−I: pakaitas patraukia $σ$ ryšio elektronus stipriau nei vandenilis', '−I: the substituent pulls the $σ$ bonding electrons harder than hydrogen does') },
                  { text: t('+I: pakaitas didina elektronų tankį grandinėje', '+I: the substituent raises the electron density in the chain') },
                  { text: t('I = 0: pakaitas elektronų tankio nekeičia', 'I = 0: the substituent does not change the electron density') }
                ],
                answer: x.s < 0 ? 0 : 1,
                hint: t('Palyginkite pakaitą su vandeniliu, kurio efektas imamas kaip nulis: ar pakaitas elektronus traukia stipriau, ar tiesia grandinei?', 'Compare the substituent with a hydrogen atom, whose inductive effect is taken as zero: does it pull electrons harder or push them into the chain?'),
                solution: [{ p: t('Efektas yra ' + sign + '.', 'The effect is ' + sign + '.') }, { p: whyKind }, { mol: { smi, opts: { deltas: dl } } }]
              },
              {
                prompt: t('Bakstelėkite anglies atomą, kuris pakaito indukcijos efektą jaučia stipriausiai.', 'Tap the carbon atom that feels the inductive effect of the substituent most strongly.'),
                kind: 'atoms', mol: view(), answer: [near],
                hint: t('Kuris grandinės atomas sujungtas tiesiogiai su pakaitu? Pagalvokite, kaip poliarizacija silpnėja per $σ$ ryšius.', 'Which chain atom is bonded directly to the substituent? Think about how polarisation fades through $σ$ bonds.'),
                solution: t('Stipriausiai efektą jaučia anglis Nr. ' + (near + 1) + ', sujungta su pakaitu. Poliarizacija persiduoda per $σ$ ryšius ir su kiekvienu ryšiu silpnėja.', 'The carbon that feels it most is no. ' + (near + 1) + ', bonded to the substituent. The polarisation passes on through $σ$ bonds and weakens with each bond.')
              },
              {
                prompt: t('Bakstelėkite anglies atomą, kuris pakaito indukcijos efektą jaučia silpniausiai.', 'Tap the carbon atom that feels the inductive effect of the substituent least.'),
                kind: 'atoms', mol: view(), answer: [far],
                hint: t('Per kiek ryšių poliarizacija pasiekia kiekvieną anglį? Kuo toliau, tuo silpnesnė.', 'Through how many bonds does the polarisation reach each carbon? The further, the weaker.'),
                solution: t('Tolimiausias nuo pakaito yra atomas Nr. 1: efektas pasiekia jį per daugiausia ryšių, todėl beveik išnyksta.', 'The atom furthest from the substituent is no. 1: the effect reaches it through the most bonds, so it has almost died out.')
              }
            ],
            why: t('Pakaito indukcijos efektas nusakomas palyginus su vandeniliu: kas elektronus traukia stipriau, turi −I, kas tiesia – +I. Poliarizacija perduodama per $σ$ ryšius ir greitai gęsta, todėl stipriausia ji prie pakaito.', 'The inductive effect of a substituent is judged against hydrogen: whatever pulls electrons harder has −I, whatever pushes them has +I. The polarisation is passed on through $σ$ bonds and fades fast, so it is strongest next to the substituent.'),
            src: 'L3 p4'
          };
        },
        bank: [
          {
            id: 'u03.induct.1',
            q: [{ p: t('Halogenai turi skirtingą −I efektą.', 'The halogens differ in their −I effect.') }],
            steps: [
              {
                prompt: t('Išdėstykite pakaitus nuo stipriausio −I efekto iki silpniausio.', 'Put the substituents in order from the strongest −I effect to the weakest.'),
                kind: 'order',
                options: [{ text: f('$−F$') }, { text: f('$−Cl$') }, { text: f('$−Br$') }, { text: f('$−I$') }],
                hint: t('Palyginkite, kiek elektrinis neigiamumas kinta periodinėje lentelėje žemyn grupe.', 'Compare how electronegativity changes going down a group of the periodic table.'),
                solution: t('Fluoro elektrinis neigiamumas didžiausias, toliau seka chloras, bromas ir jodas: $−F > −Cl > −Br > −I$.', 'Fluorine is the most electronegative, followed by chlorine, bromine and iodine: $−F > −Cl > −Br > −I$.')
              },
              {
                prompt: t('Kuo grindžiama ši eilė?', 'What is this order based on?'),
                kind: 'choice',
                options: [
                  { text: t('Atomas stipriau traukia $σ$ ryšio elektronus, kai jo elektrinis neigiamumas yra didesnis nei anglies.', 'An atom pulls the $σ$ bonding electrons harder when its electronegativity is higher than that of carbon.') },
                  { text: t('Kuo didesnė halogeno masė, tuo stipresnis −I efektas.', 'The heavier the halogen, the stronger the −I effect.') },
                  { text: t('−I efektas priklauso nuo $π$ ryšių skaičiaus molekulėje.', 'The −I effect depends on the number of $π$ bonds in the molecule.') },
                  { text: t('Halogenų +M efektas stiprėja žemyn grupe ir nusveria −I.', 'The +M effect of the halogens grows down the group and outweighs −I.') }
                ],
                answer: 0,
                hint: t('Indukcijos efektas yra $σ$ ryšio poliarizacija. Kas nuo to priklauso?', 'The inductive effect is the polarisation of a $σ$ bond. What does that depend on?'),
                solution: t('Poliarizaciją lemia atomų elektrinio neigiamumo skirtumas, o ne masė. Mezomerijos efektas čia nesvarbus, nes grandinė sotioji.', 'Polarisation is set by the difference in electronegativity, not by mass. The mesomeric effect is irrelevant here because the chain is saturated.')
              }
            ],
            why: t('−I efektas stiprėja didėjant atomo, sujungto su anglimi, elektriniam neigiamumui. Todėl fluoras traukia elektronus stipriausiai, o jodas silpniausiai.', 'The −I effect grows with the electronegativity of the atom bonded to carbon. That is why fluorine pulls electrons hardest and iodine least.'),
            src: 'L3 p5'
          },
          {
            id: 'u03.induct.2',
            q: [{ p: t('Alkilo grupės, prisijungusios prie $sp2$ anglies, didina elektronų tankį.', 'Alkyl groups attached to an $sp2$ carbon raise the electron density.') }],
            steps: [
              {
                prompt: t('Išdėstykite alkilo pakaitus nuo stipriausio +I efekto iki silpniausio.', 'Put the alkyl substituents in order from the strongest +I effect to the weakest.'),
                kind: 'order',
                options: [{ text: f('$−C(CH3)3$') }, { text: f('$−CH(CH3)2$') }, { text: f('$−CH2CH3$') }, { text: f('$−CH3$') }],
                hint: t('Palyginkite anglies atomų skaičių ir grandinės šakotumą.', 'Compare the number of carbon atoms and the branching of the chain.'),
                solution: t('Alkilo +I efektas stiprėja didėjant C atomų skaičiui ir šakotumui: $−C(CH3)3 > −CH(CH3)2 > −CH2CH3 > −CH3$.', 'The +I effect of alkyl groups grows with the number of carbon atoms and with branching: $−C(CH3)3 > −CH(CH3)2 > −CH2CH3 > −CH3$.')
              }
            ],
            why: t('Alkilo grupė veikia kaip elektronų tankio šaltinis. Kuo daugiau anglies atomų ir kuo šakotesnė grandinė, tuo daugiau elektronų ji gali perduoti.', 'An alkyl group acts as a source of electron density. The more carbon atoms and the more branched the chain, the more electrons it can pass on.'),
            src: 'L3 p5'
          },
          {
            id: 'u03.induct.3',
            q: [{ p: t('Trys pakaitai prijungti prie sotaus anglies atomo: $−F$, $−OH$ ir $−NH2$, o ketvirtasis yra $−CH3$.', 'Three substituents are bonded to a saturated carbon: $−F$, $−OH$ and $−NH2$, and a fourth is $−CH3$.') }],
            steps: [
              {
                prompt: t('Išdėstykite pakaitus pagal tai, kaip stipriai jie traukia $σ$ ryšio elektronus (stipriausias pirmas).', 'Put the substituents in order of how strongly they pull the $σ$ bonding electrons (strongest first).'),
                kind: 'order',
                options: [{ text: f('$−F$') }, { text: f('$−OH$') }, { text: f('$−NH2$') }, { text: f('$−CH3$') }],
                hint: t('Palyginkite pirmųjų atomų elektrinį neigiamumą: kuris elementas yra toliausiai dešinėje periode?', 'Compare the electronegativity of the first atoms: which element lies furthest to the right in the period?'),
                solution: t('Elektrinis neigiamumas didėja $N < O < F$, o metilas elektronų netraukia, o dar jų duoda (+I). Eilė: $−F > −OH > −NH2 > −CH3$.', 'Electronegativity grows $N < O < F$, and methyl does not pull electrons but even gives them (+I). Order: $−F > −OH > −NH2 > −CH3$.')
              }
            ],
            why: t('Vienoje periodo eilutėje elektrinis neigiamumas didėja iš kairės į dešinę, todėl ir −I efektas stiprėja: $N < O < F$.', 'In one row of the periodic table electronegativity grows from left to right, so the −I effect grows too: $N < O < F$.'),
            src: 'L3 p5'
          },
          {
            id: 'u03.induct.4',
            q: [
              { p: t('1-Chlorbutane chloras patraukia $σ$ ryšio elektronus.', 'In 1-chlorobutane the chlorine pulls the $σ$ bonding electrons.') },
              { mol: { smi: 'ClCCCC', name: t('1-chlorbutanas', '1-chlorobutane'), opts: { numbers: { 1: '1', 2: '2', 3: '3', 4: '4' } } } }
            ],
            steps: [
              {
                prompt: t('Išdėstykite anglis pagal dalinį teigiamą krūvį $δ+$ (didžiausias pirmas).', 'Put the carbons in order of partial positive charge $δ+$ (largest first).'),
                kind: 'order',
                options: [{ text: t('anglis Nr. 1', 'carbon no. 1') }, { text: t('anglis Nr. 2', 'carbon no. 2') }, { text: t('anglis Nr. 3', 'carbon no. 3') }, { text: t('anglis Nr. 4', 'carbon no. 4') }],
                hint: t('Pagalvokite, kuris atomas yra arčiausiai chloro ir kaip poliarizacija silpnėja grandine.', 'Think about which atom is nearest to chlorine and how polarisation fades along the chain.'),
                solution: t('Poliarizacija silpnėja su kiekvienu ryšiu: $δ1+ > δ2+ > δ3+ > δ4+$.', 'The polarisation weakens with each bond: $δ1+ > δ2+ > δ3+ > δ4+$.')
              },
              {
                prompt: t('Per kiek ryšių indukcijos efektas praktiškai išnyksta?', 'After about how many bonds has the inductive effect practically died out?'),
                kind: 'choice',
                options: [
                  { text: t('jau po pirmojo ryšio', 'already after the first bond') },
                  { text: t('maždaug po 3–4 ryšių', 'after about 3–4 bonds') },
                  { text: t('maždaug po 10 ryšių', 'after about 10 bonds') },
                  { text: t('jis nesilpnėja', 'it does not weaken') }
                ],
                answer: 1,
                hint: t('$σ$ ryšys sunkiai poliarizuojamas: efektas greitai gęsta.', 'A $σ$ bond is hardly polarisable: the effect fades quickly.'),
                solution: t('$σ$ ryšys sunkiai poliarizuojamas, todėl efektą stipriausiai jaučia dvi artimiausios anglys, o po 3–4 ryšių jis beveik nebejuntamas.', 'Because a $σ$ bond is hardly polarisable, the effect is strongest at the two nearest carbons and has almost vanished after 3–4 bonds.')
              }
            ],
            why: t('Indukcijos efektas silpnėja didėjant atstumui nuo pakaito, todėl jį reikia vertinti tik artimiausioms dviem trims anglims.', 'The inductive effect weakens with distance from the substituent, so it has to be considered only for the nearest two or three carbons.'),
            src: 'L3 p3',
            claims: [{ name: ['ClCCCC', t('1-chlorbutanas', '1-chlorobutane')] }]
          },
          {
            id: 'u03.induct.5',
            q: [{ p: t('Pateikti šeši pakaitai.', 'Six substituents are listed.') }],
            steps: [
              {
                prompt: t('Pažymėkite visus pakaitus, turinčius teigiamą indukcijos efektą +I.', 'Pick all the substituents that have a positive inductive effect, +I.'),
                kind: 'multi',
                options: [{ text: f('$−O-$') }, { text: f('$−COO-$') }, { text: f('$−C(CH3)3$') }, { text: f('$−NO2$') }, { text: f('$−Cl$') }, { text: f('$−OCH3$') }],
                answer: [0, 1, 2],
                hint: t('+I turi anijonai ir alkilai; ar kitus pakaitus sudaro labai didelio elektrinio neigiamumo atomai?', '+I is shown by anions and alkyl groups; are the other substituents made of strongly electronegative atoms?'),
                solution: t('+I turi anijonai $−O-$, $−COO-$ ir alkilo grupė $−C(CH3)3$. $−NO2$, $−Cl$ ir $−OCH3$ traukia elektronus (−I).', '+I is shown by the anions $−O-$ and $−COO-$ and by the alkyl group $−C(CH3)3$. $−NO2$, $−Cl$ and $−OCH3$ pull electrons (−I).')
              }
            ],
            why: t('Dauguma pakaitų turi −I efektą. +I rodo anijonai, mažo elektrinio neigiamumo metalai ir alkilai.', 'Most substituents have a −I effect. +I is shown by anions, by metals of low electronegativity and by alkyl groups.'),
            src: 'L3 p5'
          },
          {
            id: 'u03.induct.6',
            q: [{ p: t('Suporuokite pakaitus su jų indukcijos efektu.', 'Pair each substituent with its inductive effect.') }],
            steps: [
              {
                prompt: t('Kiekvienam pakaitui parinkite efektą.', 'Choose the effect for each substituent.'),
                kind: 'match',
                answer: {
                  left: [{ text: f('$−CH3$') }, { text: f('$−NO2$') }, { text: f('$−O-$') }, { text: f('$−Cl$') }],
                  right: [{ text: t('+I', '+I') }, { text: t('−I', '−I') }],
                  pairs: [0, 1, 0, 1]
                },
                hint: t('Ar pakaitas traukia elektronus stipriau už vandenilį, ar atvirkščiai?', 'Does the substituent pull electrons harder than hydrogen, or the opposite?'),
                solution: t('$−CH3$ ir $−O-$ didina elektronų tankį (+I), o $−NO2$ ir $−Cl$ jį mažina (−I).', '$−CH3$ and $−O-$ raise the electron density (+I), while $−NO2$ and $−Cl$ lower it (−I).')
              }
            ],
            why: t('Ženklas nustatomas palyginus su vandeniliu: elektronus traukiantis pakaitas −I, elektronus tiesiantis +I.', 'The sign is set against hydrogen: an electron-pulling substituent is −I, an electron-pushing one +I.'),
            src: 'L3 p4'
          },
          {
            id: 'u03.induct.7',
            q: [
              { p: t('Chloretano rūgštis (pKa 2,86) yra stipresnė už etano rūgštį (pKa 4,76).', 'Chloroethanoic acid (pKa 2.86) is a stronger acid than ethanoic acid (pKa 4.76).') },
              { mol: [{ smi: 'ClCC(=O)O', name: t('chloretano rūgštis', 'chloroethanoic acid') }, { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }] }
            ],
            steps: [
              {
                prompt: t('Kuo grindžiamas šis skirtumas?', 'What explains this difference?'),
                kind: 'choice',
                options: [
                  { text: t('Chloro −I efektas patraukia elektronus iš karboksilato anijono ir jį stabilizuoja.', 'The −I effect of chlorine pulls electrons from the carboxylate anion and stabilises it.') },
                  { text: t('Chloro +I efektas padidina elektronų tankį ties $O−H$ ryšiu ir silpnina jį.', 'The +I effect of chlorine raises the electron density at the $O−H$ bond and weakens it.') },
                  { text: t('Chloro atomas yra didesnis už vandenilį, todėl rūgšties molekulė stabilesnė.', 'The chlorine atom is bigger than hydrogen, so the acid molecule is more stable.') },
                  { text: t('Chloras su karboksilo grupe sudaro $p,π$-konjugaciją.', 'Chlorine forms a $p,π$ conjugation with the carboxyl group.') }
                ],
                answer: 0,
                hint: t('Rūgštingumą nusako konjuguotosios bazės stabilumas. Ką chloras daro su elektronų tankiu anijone?', 'Acidity is set by the stability of the conjugate base. What does chlorine do to the electron density in the anion?'),
                solution: t('Chloras turi −I efektą: jis perima dalį neigiamo krūvio iš karboksilato, todėl anijonas stabilesnis ir rūgštis stipresnė. Tarp chloro ir karboksilo grupės yra $sp3$ anglis, todėl konjugacijos nėra.', 'Chlorine has a −I effect: it takes part of the negative charge from the carboxylate, so the anion is more stable and the acid stronger. An $sp3$ carbon lies between chlorine and the carboxyl group, so there is no conjugation.')
              }
            ],
            why: t('Indukcijos efektas keičia rūgštingumą: elektronus traukiantis pakaitas stabilizuoja anijoną. Rūgščių ir bazių temoje šį principą naudosime dažnai.', 'The inductive effect changes acidity: an electron-withdrawing substituent stabilises the anion. We will use this principle often in the acids and bases unit.'),
            src: 'L3 p5',
            claims: [{ name: ['ClCC(=O)O', t('chloretano rūgštis', 'chloroethanoic acid')] }, { name: ['CC(=O)O', t('etano rūgštis', 'ethanoic acid')] }]
          },
          {
            id: 'u03.induct.8',
            q: [{ p: t('Vaizduojant indukcijos efektą $C−Cl$ ryšyje, rodyklė braižoma ypatingu būdu.', 'When the inductive effect of a $C−Cl$ bond is drawn, the arrow is drawn in a particular way.') }],
            steps: [
              {
                prompt: t('Kuris vaizdavimas teisingas?', 'Which drawing is correct?'),
                kind: 'choice',
                options: [
                  { text: t('Tiesi rodyklė išilgai $C−Cl$ ryšio, smaigaliu į chlorą.', 'A straight arrow along the $C−Cl$ bond, head pointing to chlorine.') },
                  { text: t('Tiesi rodyklė išilgai ryšio, smaigaliu į anglį.', 'A straight arrow along the bond, head pointing to carbon.') },
                  { text: t('Lenkta rodyklė nuo chloro laisvosios poros prie $C−Cl$ ryšio.', 'A curved arrow from a chlorine lone pair to the $C−Cl$ bond.') },
                  { text: t('Lenkta rodyklė nuo $C−Cl$ ryšio prie chloro atomo.', 'A curved arrow from the $C−Cl$ bond to the chlorine atom.') }
                ],
                answer: 0,
                hint: t('Indukcijos efektas yra dalinis poslinkis per $σ$ ryšį, o ne visa elektronų pora šokinėja iš vietos į vietą.', 'The inductive effect is a partial shift along a $σ$ bond, not a whole electron pair jumping from place to place.'),
                solution: t('Indukcijos efektas vaizduojamas tiesia rodykle, sutampančia su ryšio linija ir nukreipta į elektronus patraukiantį atomą. Lenktos rodyklės skirtos mezomerijos efektui ir reakcijoms.', 'The inductive effect is drawn as a straight arrow that lies on the bond and points to the atom that pulls the electrons. Curved arrows are for the mesomeric effect and for reactions.')
              }
            ],
            why: t('Rodyklės rūšis nurodo efektą: tiesi rodyklė – indukcijos, lenkta – mezomerijos ar reakcijos elektronų poros judėjimas.', 'The kind of arrow names the effect: a straight arrow means inductive, a curved arrow the mesomeric effect or the movement of an electron pair in a reaction.'),
            src: 'L3 p3'
          },
          {
            id: 'u03.induct.9',
            q: [
              { p: t('Trifluormetilo grupė yra labai stiprus elektronų akceptorius, nors jos anglis neturi $π$ ryšių.', 'The trifluoromethyl group is a very strong electron acceptor even though its carbon has no $π$ bonds.') },
              { mol: { smi: 'FC(F)(F)C', opts: { deltas: { 1: '+' } } } }
            ],
            steps: [
              {
                prompt: t('Kodėl $−CF3$ turi stiprų −I efektą?', 'Why does $−CF3$ have a strong −I effect?'),
                kind: 'choice',
                options: [
                  { text: t('Trys fluoro atomai, kurių elektrinis neigiamumas didžiausias, kartu patraukia elektronus iš anglies.', 'Three fluorine atoms, the most electronegative of all, together pull the electrons from carbon.') },
                  { text: t('Fluoro atomai su anglimi sudaro $π$ ryšius.', 'The fluorine atoms form $π$ bonds with carbon.') },
                  { text: t('$−CF3$ turi stiprų +M efektą.', '$−CF3$ has a strong +M effect.') },
                  { text: t('Fluoro atomai yra dideli ir stumia elektronus.', 'The fluorine atoms are large and push electrons away.') }
                ],
                answer: 0,
                hint: t('Kiek atomų su dideliu elektriniu neigiamumu prisijungę prie tos pačios anglies?', 'How many atoms of high electronegativity are bonded to the same carbon?'),
                solution: t('Kiekvienas $C−F$ ryšys stipriai poliarizuotas link fluoro, o trijų poliarizacijos sumuojasi: ant anglies lieka didelis $δ+$. $π$ ryšių nėra, todėl mezomerijos efekto nėra.', 'Every $C−F$ bond is strongly polarised towards fluorine and the three polarisations add up, leaving a large $δ+$ on carbon. There are no $π$ bonds, so there is no mesomeric effect.')
              }
            ],
            why: t('Indukcijos efektai sumuojasi: kelios polinės ryšio poliarizacijos prie to paties atomo kartu duoda labai stiprų efektą.', 'Inductive effects add up: several polar bonds to the same atom together give a very strong effect.'),
            src: 'L3 p5',
            claims: [{ formula: ['FC(F)(F)C', 'C2H3F3'] }]
          }
        ]
      },
      /* ============ u03.effects: I and M effects of a substituent, donor or acceptor (generator) ============ */
      {
        id: 'u03.effects',
        title: t('Pakaito elektroniniai efektai: I, M, donoras ar akceptorius', 'Electronic effects of a substituent: I, M, donor or acceptor'),
        mirrors: ['S2.12'],
        gen(rng, ctx) {
          const { chem } = ctx;
          // I, M: sign of the inductive and the mesomeric effect (M 0 = none); net: electron donor (ED) or acceptor (EA) on a conjugated system;
          // vres: resonance form of CH2=CH-X; ares: resonance form (ortho) of benzene-X; k: how to explain the effects
          const SUBS = [
            { f: 'N', I: -1, M: 1, net: 'ED', k: 'lp', vres: '[CH2-]C=[NH2+]', ares: '[NH2+]=C1C=CC=C[CH-]1' },
            { f: 'NC', I: -1, M: 1, net: 'ED', k: 'lp', vres: '[CH2-]C=[NH+]C', ares: 'C[NH+]=C1C=CC=C[CH-]1' },
            { f: 'O', I: -1, M: 1, net: 'ED', k: 'lp', vres: '[CH2-]C=[OH+]', ares: '[OH+]=C1C=CC=C[CH-]1' },
            { f: 'OC', I: -1, M: 1, net: 'ED', k: 'lp', vres: '[CH2-]C=[O+]C', ares: 'C[O+]=C1C=CC=C[CH-]1' },
            { f: 'S', I: -1, M: 1, net: 'ED', k: 'lp', vres: '[CH2-]C=[SH+]', ares: '[SH+]=C1C=CC=C[CH-]1' },
            { f: '[O-]', I: 1, M: 1, net: 'ED', k: 'anion', vres: '[CH2-]C=O', ares: 'O=C1C=CC=C[CH-]1' },
            { f: 'F', I: -1, M: 1, net: 'EA', k: 'hal', vres: '[CH2-]C=[F+]', ares: '[F+]=C1C=CC=C[CH-]1' },
            { f: 'Cl', I: -1, M: 1, net: 'EA', k: 'hal', vres: '[CH2-]C=[Cl+]', ares: '[Cl+]=C1C=CC=C[CH-]1' },
            { f: 'Br', I: -1, M: 1, net: 'EA', k: 'hal', vres: '[CH2-]C=[Br+]', ares: '[Br+]=C1C=CC=C[CH-]1' },
            { f: 'C', I: 1, M: 0, net: 'ED', k: 'alkyl' },
            { f: 'CC', I: 1, M: 0, net: 'ED', k: 'alkyl' },
            { f: 'C=O', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=C[O-]', ares: '[O-]C=C1C=CC=C[CH+]1' },
            { f: 'C(=O)C', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=C([O-])C', ares: '[O-]C(C)=C1C=CC=C[CH+]1' },
            { f: 'C(=O)O', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=C([O-])O', ares: '[O-]C(O)=C1C=CC=C[CH+]1' },
            { f: 'C(=O)OC', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=C([O-])OC', ares: '[O-]C(OC)=C1C=CC=C[CH+]1' },
            { f: 'C(=O)N', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=C([O-])N', ares: '[O-]C(N)=C1C=CC=C[CH+]1' },
            { f: 'C#N', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=C=[N-]', ares: '[N-]=C=C1C=CC=C[CH+]1' },
            { f: '[N+](=O)[O-]', I: -1, M: -1, net: 'EA', k: 'acc', vres: '[CH2+]C=[N+]([O-])[O-]', ares: '[O-][N+]([O-])=C1C=CC=C[CH+]1' },
            { f: 'C(F)(F)F', I: -1, M: 0, net: 'EA', k: 'sp3acc' },
            { f: '[NH3+]', I: -1, M: 0, net: 'EA', k: 'sp3acc' }
          ];
          const CTX = [
            { id: 'alkyl', base: 'CCC', att: 2 },
            { id: 'benzyl', base: 'c1ccccc1C', att: 6 },
            { id: 'vinyl', base: 'C=C', att: 1 },
            { id: 'aryl', base: 'c1ccccc1', att: 5 }
          ];
          let pick = null;
          for (let tries = 0; tries < 40 && !pick; tries++) {
            const s = ctx.pick(SUBS), c = ctx.pick(CTX);
            if (s.k === 'alkyl' && (c.id === 'alkyl' || c.id === 'benzyl')) continue;   // an alkyl on an alkyl chain says nothing
            const smi = c.base + s.f;
            const first = chem.parse(c.base).atoms.length;   // first atom of the substituent
            const sys = chem.conjugated(chem.parse(smi));
            const conj = sys.some((g) => g.includes(c.att) && g.includes(first));
            const hasM = conj && s.M !== 0;
            pick = { s, c, smi, first, hasM, conj };
          }
          if (!pick) throw new Error('u03.effects: nothing picked');
          const { s, c, smi, first, hasM } = pick;
          const nAt = chem.parse(smi).atoms.length;
          const sub = [];
          for (let i = first; i < nAt; i++) sub.push(i);
          const view = () => ({ smi, opts: { numbers: 'all', highlight: { atoms: sub, tone: 2 } } });

          // the effects present, as an option index
          const OPT = [
            t('Tik −I (indukcijos efektas)', 'Only −I (inductive effect)'),
            t('Tik +I (indukcijos efektas)', 'Only +I (inductive effect)'),
            t('−I ir +M', '−I and +M'),
            t('−I ir −M', '−I and −M'),
            t('+I ir +M', '+I and +M')
          ];
          const idx = hasM ? (s.M > 0 ? (s.I < 0 ? 2 : 4) : 3) : (s.I < 0 ? 0 : 1);
          const net = hasM ? s.net : (s.I < 0 ? 'EA' : 'ED');

          const ctxLT = {
            alkyl: 'Pakaitas prisijungęs prie sotaus ($sp3$) anglies, todėl su $π$ sistema nesusijęs: mezomerijos efekto nėra, lieka tik indukcijos efektas.',
            benzyl: 'Tarp žiedo ir pakaito yra $sp3$ grupė $CH2$. Ji nutraukia konjugaciją, todėl mezomerijos efekto nėra, lieka tik indukcijos efektas.',
            vinyl: 'Pakaito atomas jungiasi tiesiai su $C=C$, todėl yra konjuguotosios sistemos dalis ir gali turėti mezomerijos efektą.',
            aryl: 'Pakaito atomas jungiasi tiesiai su benzeno žiedu, todėl yra konjuguotosios sistemos dalis ir gali turėti mezomerijos efektą.'
          }[c.id];
          const ctxEN = {
            alkyl: 'The substituent sits on a saturated ($sp3$) carbon, so it is not tied to a $π$ system: there is no mesomeric effect, only the inductive effect remains.',
            benzyl: 'A $sp3$ group $CH2$ lies between the ring and the substituent. It breaks the conjugation, so there is no mesomeric effect and only the inductive effect remains.',
            vinyl: 'The substituent atom is bonded directly to the $C=C$, so it is part of the conjugated system and can show a mesomeric effect.',
            aryl: 'The substituent atom is bonded directly to the benzene ring, so it is part of the conjugated system and can show a mesomeric effect.'
          }[c.id];
          const kLT = {
            lp: 'Didelio elektrinio neigiamumo atomas traukia $σ$ elektronus (−I), o jo laisvoji pora persidengia su $π$ sistema (+M).',
            anion: 'Neigiamas krūvis didina elektronų tankį per $σ$ ryšį (+I), o laisvoji pora persidengia su $π$ sistema (+M).',
            hal: 'Halogenas traukia $σ$ elektronus (−I) ir savo laisvąja pora persidengia su $π$ sistema (+M).',
            alkyl: 'Alkilas $σ$ ryšiu elektronus tiesia (+I) ir laisvųjų porų ar $π$ ryšių neturi.',
            acc: 'Grupė su daugialypiu ryšiu su $O$ arba $N$ traukia elektronus per $σ$ ryšį (−I), o $π$ elektronai slenka link šio atomo (−M).',
            sp3acc: 'Grupė $σ$ ryšiu traukia elektronus (−I), bet laisvųjų porų ar $π$ ryšių, kurie persidengtų su sistema, neturi.'
          }[s.k];
          const kEN = {
            lp: 'The electronegative atom pulls the $σ$ electrons (−I) and its lone pair overlaps with the $π$ system (+M).',
            anion: 'The negative charge raises the electron density through the $σ$ bond (+I) and the lone pair overlaps with the $π$ system (+M).',
            hal: 'A halogen pulls the $σ$ electrons (−I) and its lone pair overlaps with the $π$ system (+M).',
            alkyl: 'An alkyl group pushes electrons through the $σ$ bond (+I) and has no lone pairs or $π$ bonds.',
            acc: 'A group with a multiple bond to $O$ or $N$ pulls electrons through the $σ$ bond (−I) and the $π$ electrons shift towards that atom (−M).',
            sp3acc: 'The group pulls electrons through the $σ$ bond (−I) but has no lone pairs or $π$ bonds that could overlap with the system.'
          }[s.k];
          const noMLT = !hasM && (c.id === 'vinyl' || c.id === 'aryl') ? ' Šis pakaitas neturi laisvųjų porų ar $π$ ryšių, kurie persidengtų su sistema, todėl mezomerijos efekto nėra.' : '';
          const noMEN = !hasM && (c.id === 'vinyl' || c.id === 'aryl') ? ' This substituent has no lone pair or $π$ bond that could overlap with the system, so there is no mesomeric effect.' : '';

          const iLT = s.I < 0 ? 'Pakaitas traukia $σ$ ryšio elektronus (−I).' : 'Pakaitas elektronus per $σ$ ryšį tiesia (+I).';
          const iEN = s.I < 0 ? 'The substituent pulls the $σ$ bonding electrons (−I).' : 'The substituent pushes electrons through the $σ$ bond (+I).';
          const steps = [{
            prompt: t('Kokius elektroninius efektus šiame junginyje turi pažymėtas pakaitas?', 'Which electronic effects does the marked substituent have in this compound?'),
            kind: 'choice',
            options: OPT.map((o) => ({ text: o })),
            answer: idx,
            hint: t('Atsakykite į du klausimus: ar pakaitas per $σ$ ryšį elektronus traukia, ar tiesia, ir ar jo atomas yra konjuguotosios sistemos dalis?', 'Answer two questions: does the substituent pull or push electrons through the $σ$ bond, and is its atom part of a conjugated system?'),
            solution: t(hasM ? ctxLT + ' ' + kLT : ctxLT + ' ' + iLT + noMLT, hasM ? ctxEN + ' ' + kEN : ctxEN + ' ' + iEN + noMEN)
          }, {
            prompt: t('Ar šis pakaitas čia yra elektronų donoras, ar akceptorius?', 'Is this substituent an electron donor or an acceptor here?'),
            kind: 'choice',
            options: [{ text: t('Elektronų donoras (ED): didina elektronų tankį', 'Electron donor (ED): raises the electron density') }, { text: t('Elektronų akceptorius (EA): mažina elektronų tankį', 'Electron acceptor (EA): lowers the electron density') }],
            answer: net === 'ED' ? 0 : 1,
            hint: t('Sudėkite indukcijos ir mezomerijos efektų poveikį; jei mezomerijos efekto nėra, lieka tik indukcijos efektas.', 'Add up the effects of induction and mesomerism; if there is no mesomeric effect, only the inductive effect remains.'),
            solution: t(net === 'ED' ? 'Bendras rezultatas didina elektronų tankį, todėl pakaitas yra donoras.' : 'Bendras rezultatas mažina elektronų tankį, todėl pakaitas yra akceptorius.' + (s.k === 'hal' ? ' Halogeno −I stipresnis už +M.' : ''), net === 'ED' ? 'The overall result raises the electron density, so the substituent is a donor.' : 'The overall result lowers the electron density, so the substituent is an acceptor.' + (s.k === 'hal' ? ' For a halogen −I is stronger than +M.' : ''))
          }];
          if (hasM) {
            const donor = s.M > 0;
            const targets = c.id === 'vinyl' ? [0] : [0, 2, 4];
            let sol;
            if (c.id === 'vinyl') {
              sol = [{ p: t('Mezomerijos efektas perkelia krūvį į galinį $C=C$ atomą.', 'The mesomeric effect moves charge to the terminal $C=C$ carbon.') }, {
                mech: [{
                  scheme: { items: [{ smi, opts: donor ? { lonePairs: [first] } : {} }, { arrow: '↔' }, { smi: s.vres }] },
                  arrows: donor ? [{ from: { m: 0, lp: first }, to: { m: 0, b: [1, first] } }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 } }]
                    : [{ from: { m: 0, b: [0, 1] }, to: { m: 0, b: [1, first] } }, { from: { m: 0, b: [first, first + 1] }, to: { m: 0, a: first + 1 } }]
                }]
              }];
            } else {
              sol = [{ p: t('Mezomerijos efektas perkelia krūvį į žiedo orto ir para padėtis (atomai Nr. 1, 3 ir 5).', 'The mesomeric effect moves charge to the ortho and para positions of the ring (atoms no. 1, 3 and 5).') },
                { resonance: [{ smi }, { smi: s.ares }] }];
            }
            steps.push({
              prompt: t('Bakstelėkite anglies atomus, kuriuose dėl mezomerijos efekto atsiranda dalinis krūvis.', 'Tap the carbon atoms that gain a partial charge because of the mesomeric effect.'),
              kind: 'atoms', mol: view(), answer: targets,
              hint: c.id === 'vinyl'
                ? t('Pagalvokite, į kurį $C=C$ galą pasislenka $π$ elektronai (ar iš jo).', 'Think about which end of the $C=C$ the $π$ electrons move to (or away from).')
                : t('Nupieškite rezonansines formules: kuriose žiedo padėtyse atsiranda krūvis?', 'Draw the resonance structures: in which ring positions does the charge appear?'),
              solution: sol
            });
          }
          return {
            q: [
              { p: t('Pažymėtas pakaitas yra prisijungęs prie pateiktos anglies sistemos.', 'The marked substituent is bonded to the carbon system shown.') },
              { mol: view() }
            ],
            steps,
            why: t('Pakaito poveikį sudaro indukcijos efektas (per $σ$ ryšius) ir mezomerijos efektas, kuris atsiranda tik tada, kai pakaito atomas yra konjuguotosios $π$ sistemos dalis. Ženklą dažniausiai nulemia mezomerijos efektas; halogenų atveju stipresnis −I.', 'The effect of a substituent is the inductive effect (through $σ$ bonds) plus the mesomeric effect, which appears only when the substituent atom is part of a conjugated $π$ system. The sign is usually set by the mesomeric effect; for halogens −I is stronger.'),
            src: 'L3 p14'
          };
        },
      },
      /* ============ u03.donor: effects in pairs of compounds, donors and acceptors (bank) ============ */
      {
        id: 'u03.donor',
        title: t('Elektroniniai efektai palyginant junginius', 'Electronic effects compared across compounds'),
        mirrors: ['S2.12'],
        bank: [
          {
            id: 'u03.donor.1',
            q: [
              { p: t('Palyginkite chloro atomą trijuose junginiuose.', 'Compare the chlorine atom in three compounds.') },
              { mol: [{ smi: 'ClCC', name: t('chloretanas', 'chloroethane') }, { smi: 'Clc1ccccc1', name: t('chlorbenzenas', 'chlorobenzene') }, { smi: 'ClCc1ccccc1', name: t('chlormetilbenzenas', '(chloromethyl)benzene') }] }
            ],
            steps: [
              {
                prompt: t('Kuriame junginyje chloras turi mezomerijos efektą?', 'In which compound does chlorine show a mesomeric effect?'),
                kind: 'choice',
                options: [{ mol: { smi: 'ClCC' } }, { mol: { smi: 'Clc1ccccc1' } }, { mol: { smi: 'ClCc1ccccc1' } }],
                answer: 1,
                hint: t('Mezomerijos efektui reikia, kad atomas būtų tiesiogiai sujungtas su $π$ sistema. Kuriuose junginiuose yra $π$ sistema ir ar chloras prie jos prisijungęs?', 'A mesomeric effect needs the atom to be attached directly to a $π$ system. Which compounds contain one, and is chlorine attached to it?')
                , solution: t('Tik chlorbenzene chloras yra prie žiedo anglies: jo laisvoji pora persidengia su $π$ sistema (+M). Chloretane $π$ sistemos nėra, o benzilo chloride tarp žiedo ir chloro yra $sp3$ grupė $CH2$.', 'Only in chlorobenzene is chlorine on a ring carbon: its lone pair overlaps with the $π$ system (+M). Chloroethane has no $π$ system, and in benzyl chloride an $sp3$ group $CH2$ lies between ring and chlorine.')
              },
              {
                prompt: t('Ar chloras chlorbenzene yra elektronų donoras, ar akceptorius?', 'Is chlorine in chlorobenzene an electron donor or an acceptor?'),
                kind: 'choice',
                options: [{ text: t('Akceptorius: −I efektas stipresnis už +M', 'Acceptor: the −I effect is stronger than +M') }, { text: t('Donoras: +M efektas stipresnis už −I', 'Donor: the +M effect is stronger than −I') }, { text: t('Donoras: chloras turi tik +I efektą', 'Donor: chlorine has only a +I effect') }, { text: t('Akceptorius: chloras turi −M efektą', 'Acceptor: chlorine has a −M effect') }],
                answer: 0,
                hint: t('Halogenai turi abu efektus. Kuris jų stipresnis, nulemia bendrą poveikį.', 'Halogens show both effects. Whichever is stronger decides the overall result.'),
                solution: t('Chloras turi −I (didelis elektrinis neigiamumas) ir +M (laisvoji pora). Halogenų −I stipresnis už +M, todėl bendras poveikis – akceptorius.', 'Chlorine has −I (high electronegativity) and +M (lone pair). For halogens −I is stronger than +M, so the net effect is that of an acceptor.')
              }
            ],
            why: t('Mezomerijos efektas atsiranda tik tada, kai pakaitas prijungtas prie $π$ sistemos. Halogenai yra išimtis tarp donorų: nors turi +M, jų −I stipresnis ir jie elektronų tankį mažina.', 'A mesomeric effect appears only when the substituent is attached to a $π$ system. Halogens are an exception among lone-pair donors: although they have +M, their −I is stronger and they lower the electron density.'),
            src: 'S2.12',
            claims: [{ name: ['ClCC', t('chloretanas', 'chloroethane')] }, { name: ['Clc1ccccc1', t('chlorbenzenas', 'chlorobenzene')] }, { name: ['ClCc1ccccc1', t('chlormetilbenzenas', '(chloromethyl)benzene')] }]
          },
          {
            id: 'u03.donor.2',
            q: [
              { p: t('Propenalis ir propanalis abu turi formilo grupę $−CHO$.', 'Prop-2-enal and propanal both contain the formyl group $−CHO$.') },
              { mol: [{ smi: 'C=CC=O', name: t('propenalis', 'prop-2-enal') }, { smi: 'CCC=O', name: t('propanalis', 'propanal') }] }
            ],
            steps: [
              {
                prompt: t('Kuriame junginyje formilo grupė turi neigiamą mezomerijos efektą −M?', 'In which compound does the formyl group have a negative mesomeric effect, −M?'),
                kind: 'choice',
                options: [{ mol: { smi: 'C=CC=O' } }, { mol: { smi: 'CCC=O' } }],
                answer: 0,
                hint: t('Ar formilo grupės $C=O$ yra prie $C=C$, ar prie $sp3$ anglies?', 'Is the $C=O$ of the formyl group next to a $C=C$ or next to an $sp3$ carbon?'),
                solution: t('Propenale $C=C$ ir $C=O$ atskirti vienu viengubuoju ryšiu, todėl jie konjuguoti ir $π$ elektronai slenka link deguonies (−M). Propanale $C=O$ prisijungęs prie $sp3$ grupės, konjugacijos nėra.', 'In prop-2-enal the $C=C$ and $C=O$ are separated by one single bond, so they are conjugated and the $π$ electrons shift towards oxygen (−M). In propanal the $C=O$ is attached to an $sp3$ group, so there is no conjugation.')
              },
              {
                prompt: t('Bakstelėkite propenalio anglį, kuri dėl −M efekto gauna dalinį teigiamą krūvį.', 'Tap the carbon of prop-2-enal that gets a partial positive charge because of the −M effect.'),
                kind: 'atoms', mol: { smi: 'C=CC=O', opts: { numbers: 'all' } }, answer: [0],
                hint: t('$π$ elektronai slenka link deguonies per visą konjuguotąją sistemą: nuo kurio galo?', 'The $π$ electrons shift towards oxygen across the whole conjugated system: away from which end?'),
                solution: t('Elektronai slenka nuo galinio $CH2$ (Nr. 1) link $O$, todėl Nr. 1 gauna $δ+$, o deguonis – $δ−$.', 'The electrons shift away from the terminal $CH2$ (no. 1) towards $O$, so no. 1 gets $δ+$ and oxygen gets $δ−$.')
              }
            ],
            why: t('−M efektas gali pasireikšti tik konjuguotoje sistemoje. Nekonjuguotame propanale formilo grupė turi tik −I efektą.', 'A −M effect can appear only in a conjugated system. In non-conjugated propanal the formyl group has only a −I effect.'),
            src: 'S2.12',
            claims: [{ name: ['C=CC=O', t('propenalis', 'prop-2-enal')] }, { name: ['CCC=O', t('propanalis', 'propanal')] }]
          },
          {
            id: 'u03.donor.3',
            q: [
              { p: t('Formilo grupė prijungta prie benzeno žiedo ir prie metilo grupės.', 'The formyl group is attached to a benzene ring and to a methyl group.') },
              { mol: [{ smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }] }
            ],
            steps: [
              {
                prompt: t('Kuriame junginyje formilo grupė turi −I ir −M efektus?', 'In which compound does the formyl group have both −I and −M effects?'),
                kind: 'choice',
                options: [{ mol: { smi: 'O=Cc1ccccc1' } }, { mol: { smi: 'CC=O' } }],
                answer: 0,
                hint: t('Pažiūrėkite, ar $C=O$ yra su $π$ sistema vienoje konjuguotoje sistemoje.', 'Look at whether the $C=O$ belongs to one conjugated system with a $π$ system.'),
                solution: t('Benzenkarbaldehide $C=O$ konjuguotas su benzeno žiedu, todėl turi ir −I, ir −M. Etanale yra tik −I.', 'In benzaldehyde the $C=O$ is conjugated with the benzene ring, so it has both −I and −M. Ethanal has only −I.')
              },
              {
                prompt: t('Kuris teiginys apie formilo grupę benzenkarbaldehide teisingas?', 'Which statement about the formyl group in benzaldehyde is correct?'),
                kind: 'choice',
                options: [
                  { text: t('Akceptorius: mažina elektronų tankį žiede, ypač orto ir para padėtyse.', 'Acceptor: lowers the electron density in the ring, especially in the ortho and para positions.') },
                  { text: t('Donoras: laisvoji deguonies pora didina elektronų tankį žiede.', 'Donor: the oxygen lone pair raises the electron density in the ring.') },
                  { text: t('Donoras: +I efektas stipresnis už −M.', 'Donor: the +I effect is stronger than −M.') },
                  { text: t('Neutrali grupė: −I ir −M vienas kitą panaikina.', 'Neutral group: −I and −M cancel each other.') }
                ],
                answer: 0,
                hint: t('Abu efektai (−I ir −M) turi tą patį ženklą, todėl jie susideda, o ne panaikina vienas kitą.', 'Both effects (−I and −M) have the same sign, so they add up instead of cancelling.'),
                solution: t('−I ir −M abu traukia elektronus, todėl formilo grupė yra akceptorius; $δ+$ atsiranda orto ir para padėtyse.', '−I and −M both pull electrons, so the formyl group is an acceptor; $δ+$ appears in the ortho and para positions.')
              }
            ],
            why: t('Tos pačios grupės elektroniniai efektai priklauso nuo aplinkos: prijungta prie $π$ sistemos formilo grupė turi −I ir −M, o prie $sp3$ anglies – tik −I.', 'The electronic effects of the same group depend on its surroundings: attached to a $π$ system the formyl group has −I and −M, attached to an $sp3$ carbon only −I.'),
            src: 'S2.12',
            claims: [{ name: ['O=Cc1ccccc1', t('benzenkarbaldehidas', 'benzaldehyde')] }, { name: ['CC=O', t('etanalis', 'ethanal')] }]
          },
          {
            id: 'u03.donor.4',
            q: [
              { p: t('Hidroksilo grupė yra hidroksietano rūgštyje ir fenolyje.', 'A hydroxyl group is present in hydroxyethanoic acid and in phenol.') },
              { mol: [{ smi: 'OCC(=O)O', name: t('hidroksietano rūgštis', '2-hydroxyethanoic acid') }, { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }] }
            ],
            steps: [
              {
                prompt: t('Kuriame junginyje hidroksilo grupė yra elektronų donoras?', 'In which compound is the hydroxyl group an electron donor?'),
                kind: 'choice',
                options: [{ mol: { smi: 'OCC(=O)O' } }, { mol: { smi: 'Oc1ccccc1' } }],
                answer: 1,
                hint: t('Donoru $−OH$ tampa, kai jo laisvoji pora gali persidengti su $π$ sistema.', '$−OH$ becomes a donor when its lone pair can overlap with a $π$ system.'),
                solution: t('Fenolyje deguonis jungiasi prie žiedo anglies: laisvoji pora persidengia su $π$ sistema (+M > −I), todėl $−OH$ yra donoras. Hidroksietano rūgštyje deguonis prie $sp3$ anglies: lieka tik −I ir grupė – akceptorius.', 'In phenol oxygen is bonded to a ring carbon: the lone pair overlaps with the $π$ system (+M > −I), so $−OH$ is a donor. In hydroxyethanoic acid oxygen sits on an $sp3$ carbon: only −I remains and the group is an acceptor.')
              }
            ],
            why: t('$−OH$ yra donorius tik tada, kai jo +M efektas turi kur pasireikšti. Prie sotaus anglies jis tik traukia elektronus per $σ$ ryšį.', '$−OH$ is a donor only when its +M effect has somewhere to act. On a saturated carbon it only pulls electrons through the $σ$ bond.'),
            src: 'S2.12',
            claims: [{ name: ['OCC(=O)O', t('hidroksietano rūgštis', '2-hydroxyethanoic acid')] }, { name: ['Oc1ccccc1', t('fenolis', 'phenol')] }]
          },
          {
            id: 'u03.donor.5',
            q: [
              { p: t('Aminogrupė anilne ir benzilamine.', 'The amino group in aniline and in benzylamine.') },
              { mol: [{ smi: 'Nc1ccccc1', name: t('anilinas', 'aniline'), opts: { numbers: 'all' } }, { smi: 'NCc1ccccc1', name: t('benzilaminas', 'benzylamine'), opts: { numbers: 'all' } }] }
            ],
            steps: [
              {
                prompt: t('Kuriame junginyje $−NH2$ turi ir −I, ir +M efektus?', 'In which compound does $−NH2$ have both −I and +M effects?'),
                kind: 'choice',
                options: [{ mol: { smi: 'Nc1ccccc1' } }, { mol: { smi: 'NCc1ccccc1' } }],
                answer: 0,
                hint: t('Ar tarp azoto ir žiedo yra $sp3$ atomas?', 'Is there an $sp3$ atom between nitrogen and the ring?'),
                solution: t('Anilino molekulėje azotas prisijungęs tiesiai prie žiedo, todėl jo pora konjuguota su $π$ sistema. Benzilamine $CH2$ konjugaciją nutraukia.', 'In aniline nitrogen is attached directly to the ring, so its lone pair is conjugated with the $π$ system. In benzylamine the $CH2$ breaks the conjugation.')
              },
              {
                prompt: t('Bakstelėkite anilino žiedo anglis, kuriose dėl +M efekto padaugėja elektronų tankio.', 'Tap the ring carbons of aniline whose electron density rises because of the +M effect.'),
                kind: 'atoms', mol: { smi: 'Nc1ccccc1', opts: { numbers: 'all' } }, answer: [2, 4, 6],
                hint: t('Parašykite rezonansines formules: kuriose žiedo padėtyse atsiranda neigiamas krūvis?', 'Write the resonance structures: in which ring positions does negative charge appear?'),
                solution: t('Neigiamas krūvis atsiranda orto (Nr. 3 ir Nr. 7) ir para (Nr. 5) padėtyse. Meta padėtys krūvio negauna.', 'Negative charge appears in the ortho (no. 3 and no. 7) and para (no. 5) positions. The meta positions get none.')
              }
            ],
            why: t('+M efektas paskirsto neigiamą krūvį orto ir para padėtyse. Tai paaiškina, kodėl anilino žiedas turtingesnis elektronų nei benzeno.', 'The +M effect puts negative charge in the ortho and para positions. This is why the aniline ring is richer in electrons than benzene.'),
            src: 'L3 p16',
            claims: [{ name: ['Nc1ccccc1', t('anilinas', 'aniline')] }, { name: ['NCc1ccccc1', t('benzilaminas', 'benzylamine')] }]
          },
          {
            id: 'u03.donor.6',
            q: [
              { p: t('Karboksilo grupė propano ir propeno rūgštyse.', 'The carboxyl group in propanoic and prop-2-enoic acid.') },
              { mol: [{ smi: 'CCC(=O)O', name: t('propano rūgštis', 'propanoic acid') }, { smi: 'C=CC(=O)O', name: t('propeno rūgštis', 'prop-2-enoic acid'), opts: { numbers: 'all' } }] }
            ],
            steps: [
              {
                prompt: t('Kurioje rūgštyje karboksilo grupė turi −M efektą?', 'In which acid does the carboxyl group have a −M effect?'),
                kind: 'choice',
                options: [{ mol: { smi: 'CCC(=O)O' } }, { mol: { smi: 'C=CC(=O)O' } }],
                answer: 1,
                hint: t('Suraskite rūgštį, kurioje karbonilo grupė konjuguota su $π$ ryšiu.', 'Find the acid in which the carbonyl group is conjugated with a $π$ bond.'),
                solution: t('Propeno rūgštyje $C=C$ ir $C=O$ konjuguoti. Propano rūgštyje yra tik $sp3$ anglys, todėl lieka tik −I.', 'In prop-2-enoic acid the $C=C$ and $C=O$ are conjugated. Propanoic acid has only $sp3$ carbons, so only −I remains.')
              },
              {
                prompt: t('Bakstelėkite visus propeno rūgšties atomus, sudarančius konjuguotąją sistemą.', 'Tap all the atoms of prop-2-enoic acid that form the conjugated system.'),
                kind: 'atoms', mol: { smi: 'C=CC(=O)O', opts: { numbers: 'all' } }, from: 'conjugated',
                hint: t('Be $C=C$ ir $C=O$, patikrinkite, ar hidroksilo deguonies laisvoji pora taip pat gretima $π$ ryšiui.', 'Besides $C=C$ and $C=O$, check whether the lone pair of the hydroxyl oxygen is also next to a $π$ bond.'),
                solution: t('Į sistemą įeina visi penki atomai: $C=C$ (Nr. 1, 2), karbonilo anglis (Nr. 3), karbonilo deguonis (Nr. 4) ir hidroksilo deguonis (Nr. 5), nes jo laisvoji pora persidengia su $π$ sistema ($p,π$-konjugacija).', 'All five atoms belong to it: the $C=C$ (no. 1, 2), the carbonyl carbon (no. 3), the carbonyl oxygen (no. 4) and the hydroxyl oxygen (no. 5), because its lone pair overlaps with the $π$ system ($p,π$ conjugation).')
              }
            ],
            why: t('Konjugacija leidžia −M efektui perduoti elektronų poslinkį per $C=C$. Nekonjuguotoje rūgštyje to efekto nėra.', 'Conjugation lets the −M effect pass the electron shift along the $C=C$. In the non-conjugated acid that effect is absent.'),
            src: 'L3 p16',
            claims: [{ name: ['CCC(=O)O', t('propano rūgštis', 'propanoic acid')] }, { name: ['C=CC(=O)O', t('propeno rūgštis', 'prop-2-enoic acid')] }]
          },
          {
            id: 'u03.donor.7',
            q: [{ p: t('Penki pakaitai prijungti prie benzeno žiedo.', 'Five substituents are attached to a benzene ring.') }],
            steps: [
              {
                prompt: t('Suporuokite kiekvieną pakaitą su jo poveikiu benzeno žiedui.', 'Pair each substituent with its effect on the benzene ring.'),
                kind: 'match',
                answer: {
                  left: [{ text: f('$−NH2$') }, { text: f('$−OCH3$') }, { text: f('$−CH3$') }, { text: f('$−Cl$') }, { text: f('$−NO2$') }],
                  right: [{ text: t('elektronų donoras', 'electron donor') }, { text: t('elektronų akceptorius', 'electron acceptor') }],
                  pairs: [0, 0, 0, 1, 1]
                },
                hint: t('Sudėkite indukcijos ir mezomerijos efektus; vienas pakaitas yra išimtis tarp turinčių laisvąsias poras.', 'Add up the inductive and mesomeric effects; one substituent is an exception among those with lone pairs.'),
                solution: t('Donorai: $−NH2$ (+M ≫ −I), $−OCH3$ (+M > −I), $−CH3$ (+I). Akceptoriai: $−Cl$ (−I > +M) ir $−NO2$ (−I, −M).', 'Donors: $−NH2$ (+M ≫ −I), $−OCH3$ (+M > −I), $−CH3$ (+I). Acceptors: $−Cl$ (−I > +M) and $−NO2$ (−I, −M).')
              }
            ],
            why: t('Pakaito poveikis žiedui yra viso jo efektų rinkinio rezultatas. Laisvoji pora ne visada reiškia donorą: halogenų −I nusveria +M.', 'The effect of a substituent on the ring is the result of its whole set of effects. A lone pair does not always mean a donor: for halogens −I outweighs +M.'),
            src: 'L3 p14'
          },
          {
            id: 'u03.donor.8',
            q: [
              { p: t('Chloras chlorbenzene turi du priešingus efektus.', 'Chlorine in chlorobenzene has two opposing effects.') },
              { mol: { smi: 'Clc1ccccc1', name: t('chlorbenzenas', 'chlorobenzene') } }
            ],
            steps: [
              {
                prompt: t('Pažymėkite visus teiginius, kurie teisingi chloro atomui chlorbenzene.', 'Pick every statement that is true of the chlorine atom in chlorobenzene.'),
                kind: 'multi',
                options: [
                  { text: t('Turi −I efektą.', 'It has a −I effect.') },
                  { text: t('Turi +M efektą.', 'It has a +M effect.') },
                  { text: t('Yra akceptorius.', 'It is an acceptor.') },
                  { text: t('Jo +M efektas stipresnis už −I.', 'Its +M effect is stronger than −I.') },
                  { text: t('Turi −M efektą.', 'It has a −M effect.') }
                ],
                answer: [0, 1, 2],
                hint: t('Chloro elektrinis neigiamumas didesnis už anglies ir jis turi laisvąsias poras. Kuris iš efektų laimi?', 'Chlorine is more electronegative than carbon and has lone pairs. Which of the effects wins?'),
                solution: t('Chloras turi −I (elektrinis neigiamumas) ir +M (laisvosios poros); −I stipresnis, todėl chloras yra akceptorius. −M jis neturi, nes neturi daugialypio ryšio.', 'Chlorine has −I (electronegativity) and +M (lone pairs); −I is stronger, so chlorine is an acceptor. It has no −M because it has no multiple bond.')
              }
            ],
            why: t('Halogenai yra vienintelė laisvųjų porų turinčių pakaitų grupė, kurioje −I viršija +M. Tai lemia ir jų reakcingumą žiede.', 'The halogens are the one group of lone-pair substituents in which −I exceeds +M. This also governs their behaviour on the ring.'),
            src: 'L3 p14',
            claims: [{ name: ['Clc1ccccc1', t('chlorbenzenas', 'chlorobenzene')] }]
          },
          {
            id: 'u03.donor.9',
            q: [{ p: t('Pakaitai prie benzeno žiedo skiriasi donoriškumu.', 'Substituents on a benzene ring differ in how strongly they donate.') }],
            steps: [
              {
                prompt: t('Išdėstykite pakaitus nuo stipriausio elektronų donoro iki stipriausio akceptoriaus.', 'Put the substituents in order from the strongest electron donor to the strongest acceptor.'),
                kind: 'order',
                options: [{ text: f('$−NH2$') }, { text: f('$−OH$') }, { text: f('$−Cl$') }, { text: f('$−NO2$') }],
                hint: t('Palyginkite, ar ir kiek +M viršija −I, ir kurie pakaitai yra akceptoriai.', 'Compare how much +M exceeds −I and which substituents are acceptors.'),
                solution: t('$−NH2$ (+M ≫ −I) donoriškesnis už $−OH$ (+M > −I). $−Cl$ yra silpnas akceptorius (−I > +M), o $−NO2$ turi −I ir −M, todėl stipriausias akceptorius.', '$−NH2$ (+M ≫ −I) is a stronger donor than $−OH$ (+M > −I). $−Cl$ is a weak acceptor (−I > +M) and $−NO2$ has both −I and −M, so it is the strongest acceptor.')
              }
            ],
            why: t('Azoto elektrinis neigiamumas mažesnis už deguonies, todėl savo laisvąją porą atiduoda lengviau ir +M efektas aminogrupėje didesnis nei hidroksilo.', 'Nitrogen is less electronegative than oxygen, so it gives its lone pair more readily and the +M effect of the amino group is larger than that of hydroxyl.'),
            src: 'L3 p14'
          }
        ]
      },
      /* ============ u03.conj: conjugated systems, tap and count (generator) ============ */
      {
        id: 'u03.conj',
        title: t('Konjuguotoji sistema: atomai ir jų skaičius', 'The conjugated system: its atoms and their number'),
        mirrors: ['S2.10', 'S2.11'],
        gen(rng, ctx) {
          const { chem } = ctx;
          const POOL = [
            // open-chain polyenes and conjugated carbonyl / nitrile compounds
            'C=CC=C', 'C=CC=CC', 'CC=CC=CC', 'C=CC=CC=C', 'C=C(C)C=C', 'CC=CC(C)=C', 'C=CC=CC=CC=C', 'C=C(C)C(C)=C', 'CC=CC=CC=CC',
            'C=CC=O', 'CC=CC=O', 'C=CC(C)=O', 'C=CC(=O)O', 'C=CC(=O)OC', 'C=CC(N)=O', 'C=CC#N', 'CC=CC#N', 'C=CC=CC=O', 'O=CC=O', 'O=CC=CC=O',
            'C=CC(=O)C=C', 'CC(C)=CC(C)=O', 'CC=CC=CC(=O)O',
            // lone pair, charge or unpaired electron next to a pi bond
            'C=COC', 'C=CN', 'C=CCl', 'C=CBr', 'C=CSC', 'CC(N)=O', 'CC(=O)OC', 'CC(=O)O', 'NC(=O)N', 'C=CN(C)C',
            'C=C[CH2+]', 'C=C[CH2-]', 'C=C[CH2]', 'CC=C[CH2+]', 'C=CC=C[CH2+]', 'C=C[CH+]C', 'C=C[C+](C)C',
            // rings and aromatic compounds
            'c1ccccc1', 'Cc1ccccc1', 'C=Cc1ccccc1', 'Nc1ccccc1', 'Oc1ccccc1', 'O=Cc1ccccc1', 'N#Cc1ccccc1', 'OC(=O)c1ccccc1', 'COc1ccccc1', 'Clc1ccccc1',
            'C=CC=Cc1ccccc1', 'c1ccc2ccccc2c1', 'c1ccc(cc1)c1ccccc1', 'CC(=O)c1ccccc1', 'CCc1ccccc1',
            'C1=CC=CCC1', 'C1=CC=CC1', 'C=C1C=CCCC1', 'O=C1C=CCCC1', 'O=C1C=CC(=O)C=C1', 'C1=CC=CC=CC1',
            // isolated double bonds beside a conjugated part, and no conjugation at all
            'C=CC=CCC=C', 'CC(=O)C=CCC=C', 'C=CC=CCC=CC=C', 'C=CCC=C', 'C=C=C', 'CC=CCC=CC', 'C=CCCC=C', 'C1=CCC=CC1', 'C=CCC(C)=O', 'O=CCC=O', 'C=CCO'
          ];
          const smi = ctx.pick(POOL);
          const m = chem.parse(smi);
          const systems = chem.conjugated(m).filter((s) => s.length >= 3);   // a lone pi bond is not a conjugated system
          const all = Array.from(new Set(systems.flat())).sort((a, b) => a - b);
          const big = systems.slice().sort((a, b) => b.length - a.length)[0] || [];
          const lab = (list) => list.map((i) => i + 1).join(', ');
          const view = (extra) => ({ smi, opts: Object.assign({ numbers: 'all' }, extra || {}) });

          const steps = [{
            prompt: t('Ar šioje molekulėje yra konjuguotoji sistema ir kiek jų?', 'Does this molecule contain a conjugated system, and how many?'),
            kind: 'choice',
            options: [{ text: t('Nėra: $π$ ryšiai izoliuoti', 'None: the $π$ bonds are isolated') }, { text: t('Yra viena konjuguotoji sistema', 'One conjugated system') }, { text: t('Yra dvi atskiros konjuguotosios sistemos', 'Two separate conjugated systems') }],
            answer: Math.min(systems.length, 2),
            hint: t('Konjuguotoji sistema – $π$ ryšiai ar $π$ ryšiai ir laisvosios poros, atskirti vienu viengubuoju ryšiu. Ar kas nors juos atskiria daugiau?', 'A conjugated system is made of $π$ bonds, or $π$ bonds and lone pairs, separated by one single bond. Does anything separate them further?'),
            solution: systems.length === 0
              ? t('Tarp $π$ ryšių yra $sp3$ atomas ar jie yra kumuliuoti, todėl $π$ ryšių orbitalės viena su kita nepersidengia: konjuguotosios sistemos nėra.', 'An $sp3$ atom lies between the $π$ bonds or they are cumulated, so the $π$ orbitals do not overlap with each other: there is no conjugated system.')
              : t('Konjuguotųjų sistemų skaičius: ' + systems.length + '. Izoliuotas $π$ ryšys, atskirtas $sp3$ atomu, į sistemą neįeina.', 'Number of conjugated systems: ' + systems.length + '. An isolated $π$ bond separated by an $sp3$ atom is not part of a system.')
          }];
          if (systems.length) {
            steps.push({
              prompt: t('Bakstelėkite visus atomus, sudarančius konjuguotąją sistemą (ar sistemas).', 'Tap all the atoms that form the conjugated system (or systems).'),
              kind: 'atoms', mol: view(), answer: all,
              hint: t('Suraskite $sp2$ ar $sp$ atomus ir laisvąsias poras, esančias šalia $π$ ryšio. Kur $sp3$ atomas nutraukia grandinę?', 'Find the $sp2$ or $sp$ atoms and the lone pairs next to a $π$ bond. Where does an $sp3$ atom break the chain?'),
              solution: [{ p: t('Į sistemą įeina atomai Nr. ' + lab(all) + '.', 'The system consists of atoms no. ' + lab(all) + '.') }, { mol: { smi, opts: { highlight: { atoms: all, tone: 2 }, numbers: 'all' } } }]
            });
            steps.push({
              prompt: t(systems.length > 1 ? 'Kiek atomų sudaro didžiausią konjuguotąją sistemą?' : 'Kiek atomų sudaro konjuguotąją sistemą?', systems.length > 1 ? 'How many atoms form the largest conjugated system?' : 'How many atoms form the conjugated system?'),
              kind: 'number', answer: { value: big.length, tol: 0 },
              hint: t('Skaičiuokite tik atomus su persidengiančiomis $p$ orbitalėmis (įskaitant laisvąją porą ar krūvį), o ne pakaitus su $sp3$ atomais.', 'Count only atoms with overlapping $p$ orbitals (including a lone pair or a charge), not substituents with $sp3$ atoms.'),
              solution: t('Didžiausią sistemą sudaro ' + big.length + ' atomai: Nr. ' + lab(big) + '.', 'The largest system consists of ' + big.length + ' atoms: no. ' + lab(big) + '.')
            });
            // kind of conjugation of the largest system
            const bondsIn = m.bonds.filter((b) => big.includes(b.a) && big.includes(b.b));
            const pi = bondsIn.reduce((s, b) => s + (b.order >= 3 ? 2 : b.order >= 2 ? 1 : b.order === 1.5 ? 0.5 : 0), 0);
            const donors = big.filter((i) => !m.bonds.some((b) => (b.a === i || b.b === i) && (b.order >= 2 || b.order === 1.5)));
            const kind = donors.length === 0 ? 0 : (pi >= 2 ? 2 : 1);
            steps.push({
              prompt: t('Kokios rūšies konjugacija yra šioje sistemoje?', 'What kind of conjugation does this system have?'),
              kind: 'choice',
              options: [{ text: t('$π,π$-konjugacija: tik $π$ ryšiai', '$π,π$ conjugation: only $π$ bonds') }, { text: t('$p,π$-konjugacija: $π$ ryšys su laisvąja pora, krūviu ar nesuporuotu elektronu', '$p,π$ conjugation: a $π$ bond with a lone pair, a charge or an unpaired electron') }, { text: t('Ir $π,π$-, ir $p,π$-konjugacija kartu', 'Both $π,π$ and $p,π$ conjugation together') }],
              answer: kind,
              hint: t('Patikrinkite, ar kuris nors sistemos atomas neturi $π$ ryšio, o tik laisvąją porą, krūvį ar nesuporuotą elektroną.', 'Check whether any atom of the system has no $π$ bond but only a lone pair, a charge or an unpaired electron.'),
              solution: kind === 0
                ? t('Visi sistemos atomai priklauso $π$ ryšiams, todėl tai $π,π$-konjugacija.', 'All atoms of the system belong to $π$ bonds, so it is $π,π$ conjugation.')
                : kind === 1
                  ? t('Sistemoje yra atomas su laisvąja pora, krūviu ar nesuporuotu elektronu (Nr. ' + lab(donors) + ') ir tik vienas $π$ ryšys: tai $p,π$-konjugacija.', 'The system has an atom with a lone pair, a charge or an unpaired electron (no. ' + lab(donors) + ') and only one $π$ bond: this is $p,π$ conjugation.')
                  : t('Sistemoje yra keli $π$ ryšiai ($π,π$) ir atomas su laisvąja pora (Nr. ' + lab(donors) + '), kuris persidengia su jais ($p,π$): abi rūšys kartu.', 'The system has several $π$ bonds ($π,π$) and an atom with a lone pair (no. ' + lab(donors) + ') that overlaps with them ($p,π$): both kinds together.')
            });
          }
          return {
            q: [{ p: t('Išnagrinėkite molekulės konjugaciją. Atomai sunumeruoti.', 'Examine the conjugation of the molecule. The atoms are numbered.') }, { mol: view() }],
            steps,
            why: t('Konjuguotąją sistemą sudaro gretimi atomai su lygiagrečiomis $p$ orbitalėmis. $sp3$ atomas ją nutraukia, o pakaitai, neturintys $π$ ryšio ar laisvosios poros (pavyzdžiui $CH3$), į sistemą neįeina.', 'A conjugated system is made of neighbouring atoms with parallel $p$ orbitals. An $sp3$ atom breaks it, and substituents with no $π$ bond or lone pair (for example $CH3$) are not part of it.'),
            src: 'L3 p6'
          };
        }
      },
      /* ============ u03.natural: conjugated systems in natural compounds (bank) ============ */
      {
        id: 'u03.natural',
        title: t('Konjuguotosios sistemos gamtiniuose junginiuose', 'Conjugated systems in natural compounds'),
        mirrors: ['S2.11'],
        bank: [
          {
            id: 'u03.natural.1',
            q: [
              { p: t('Akonito rūgštis yra svarbus citrinų rūgšties ciklo tarpinis produktas.', 'Aconitic acid is an important intermediate of the citric acid cycle.') },
              { mol: { smi: 'OC(=O)CC(C(=O)O)=CC(=O)O', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite visus atomus, priklausančius konjuguotosioms sistemoms (įskaitant karboksilo grupių $p,π$-konjugaciją).', 'Tap all the atoms that belong to conjugated systems (including the $p,π$ conjugation of the carboxyl groups).'),
                kind: 'atoms', mol: { smi: 'OC(=O)CC(C(=O)O)=CC(=O)O', opts: { numbers: 'all' } }, answer: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
                hint: t('Suraskite, kuris atomas atskiria vieną karboksilo grupę nuo likusios molekulės dalies.', 'Find the atom that separates one carboxyl group from the rest of the molecule.'),
                solution: t('Karboksilo grupė Nr. 1–3 yra atskira $p,π$-sistema, nes $sp3$ anglis Nr. 4 ją atskiria. Likusieji atomai Nr. 5–12 sudaro vieną sistemą: $C=C$ ir dvi karboksilo grupės.', 'The carboxyl group no. 1–3 is a separate $p,π$ system because the $sp3$ carbon no. 4 isolates it. The remaining atoms no. 5–12 form one system: the $C=C$ and two carboxyl groups.')
              },
              {
                prompt: t('Kiek atomų sudaro didžiausią konjuguotąją sistemą?', 'How many atoms form the largest conjugated system?'),
                kind: 'number', answer: { value: 8, tol: 0 },
                hint: t('Skaičiuokite $C=C$ atomus ir dvi prie jų prisijungusias karboksilo grupes (anglis ir abu deguonys kiekvienoje).', 'Count the $C=C$ atoms and the two carboxyl groups attached to them (the carbon and both oxygens of each).'),
                solution: t('Du $C=C$ atomai ir dvi karboksilo grupės po tris atomus: $2 + 3 + 3 = 8$.', 'Two $C=C$ atoms and two carboxyl groups of three atoms each: $2 + 3 + 3 = 8$.')
              }
            ],
            why: t('Konjuguotoji sistema apima visus atomus su persidengiančiomis $p$ orbitalėmis, įskaitant karbonilo ir hidroksilo deguonis. $sp3$ anglis ją nutraukia ir sukuria atskirą trijų atomų sistemą.', 'A conjugated system includes every atom with overlapping $p$ orbitals, including the carbonyl and hydroxyl oxygens. An $sp3$ carbon breaks it and leaves a separate three-atom system.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.2',
            q: [
              { p: t('Ocimenas yra daugelio augalų eterinių aliejų sudedamoji dalis.', 'Ocimene is a component of the essential oils of many plants.') },
              { mol: { smi: 'C=CC(C)=CCC=C(C)C', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, sudarančius konjuguotąją sistemą.', 'Tap the atoms that form the conjugated system.'),
                kind: 'atoms', mol: { smi: 'C=CC(C)=CCC=C(C)C', opts: { numbers: 'all' } }, answer: [0, 1, 2, 4],
                hint: t('Kurie du dvigubieji ryšiai atskirti vienu viengubuoju ryšiu?', 'Which two double bonds are separated by one single bond?'),
                solution: t('Konjuguoti $C1=C2$ ir $C3=C5$ (atomai Nr. 1, 2, 3, 5). Metilo anglis Nr. 4 yra $sp3$ ir nepriklauso.', 'The $C1=C2$ and $C3=C5$ bonds (atoms no. 1, 2, 3, 5) are conjugated. The methyl carbon no. 4 is $sp3$ and does not belong.')
              },
              {
                prompt: t('Kodėl trečiasis dvigubasis ryšys nekonjuguotas?', 'Why is the third double bond not conjugated?'),
                kind: 'choice',
                options: [
                  { text: t('Ji atskirta $sp3$ grupe $CH2$ (atomas Nr. 6).', 'It is separated by the $sp3$ group $CH2$ (atom no. 6).') },
                  { text: t('Tai kumuliuotas dvigubasis ryšys.', 'It is a cumulated double bond.') },
                  { text: t('Prie jo prisijungusios metilo grupės neleidžia konjugacijos.', 'The methyl groups attached to it prevent conjugation.') },
                  { text: t('Jį nuo kitų skiria du viengubieji ryšiai su $sp2$ atomu.', 'Two single bonds with an $sp2$ atom separate it from the others.') }
                ],
                answer: 0,
                hint: t('Pažiūrėkite, kas yra tarp $C5$ ir $C7$.', 'Look at what lies between $C5$ and $C7$.'),
                solution: t('Tarp atomų Nr. 5 ir Nr. 7 yra $CH2$ (Nr. 6), $sp3$ anglis, kuri neturi $p$ orbitalės. Todėl $C7=C8$ yra izoliuotas.', 'Between atoms no. 5 and no. 7 lies $CH2$ (no. 6), an $sp3$ carbon without a $p$ orbital. So $C7=C8$ is isolated.')
              }
            ],
            why: t('Trys dvigubieji ryšiai nebūtinai sudaro vieną sistemą: vienas $sp3$ atomas ją perskiria.', 'Three double bonds do not necessarily form one system: a single $sp3$ atom divides it.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.3',
            q: [
              { p: t('Jazmonas suteikia jazmino kvapui būdingą natą.', 'Jasmone gives jasmine its characteristic note.') },
              { mol: { smi: 'CCC=CCC1=C(C)CCC1=O', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, sudarančius konjuguotąją sistemą.', 'Tap the atoms that form the conjugated system.'),
                kind: 'atoms', mol: { smi: 'CCC=CCC1=C(C)CCC1=O', opts: { numbers: 'all' } }, answer: [5, 6, 10, 11],
                hint: t('Karbonilo grupė yra ciklo viduje: su kuriuo dvigubuoju ryšiu ji sujungta tiesiogiai?', 'The carbonyl group sits in the ring: with which double bond is it directly joined?'),
                solution: t('Žiedo $C=C$ (Nr. 6, 7) ir karbonilas $C=O$ (Nr. 11, 12) sudaro $π,π$-sistemą iš 4 atomų. Šoninės grandinės $C=C$ (Nr. 3, 4) izoliuotas.', 'The ring $C=C$ (no. 6, 7) and the carbonyl $C=O$ (no. 11, 12) form a $π,π$ system of 4 atoms. The side-chain $C=C$ (no. 3, 4) is isolated.')
              },
              {
                prompt: t('Kiek konjuguotųjų sistemų turi molekulė, jei nelaikome pavienio $π$ ryšio sistema?', 'How many conjugated systems does the molecule have if a lone $π$ bond is not counted as a system?'),
                kind: 'number', answer: { value: 1, tol: 0 },
                hint: t('Kiek $π$ ryšių grupių turi bent du ryšius, atskirtus vienu viengubuoju ryšiu?', 'How many groups of $π$ bonds have at least two bonds separated by one single bond?'),
                solution: t('Tik žiedo $C=C$ ir $C=O$ sudaro sistemą. Šoninis $C=C$ yra vienas, todėl konjuguotos sistemos nesudaro.', 'Only the ring $C=C$ and $C=O$ form a system. The side-chain $C=C$ is alone, so it does not form a conjugated system.')
              }
            ],
            why: t('Konjuguotoji sistema reikalauja bent trijų gretimų atomų su lygiagrečiomis $p$ orbitalėmis: pavienis dvigubasis ryšys jos nesudaro.', 'A conjugated system needs at least three neighbouring atoms with parallel $p$ orbitals: a lone double bond does not form one.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.4',
            q: [
              { p: t('(R)-Karvonas suteikia kvapą kmynų sėkloms.', '(R)-Carvone gives caraway seeds their smell.') },
              { mol: { smi: 'CC1=CC[C@H](CC1=O)C(C)=C', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, sudarančius konjuguotąją sistemą.', 'Tap the atoms that form the conjugated system.'),
                kind: 'atoms', mol: { smi: 'CC1=CC[C@H](CC1=O)C(C)=C', opts: { numbers: 'all' } }, answer: [1, 2, 6, 7],
                hint: t('Surasite $C=C$ ir $C=O$, tarp kurių yra tik vienas viengubasis ryšys.', 'Find the $C=C$ and $C=O$ with only one single bond between them.'),
                solution: t('Žiedo $C=C$ (Nr. 2, 3) ir $C=O$ (Nr. 7, 8) sujungti per $C2−C7$: 4 atomai. Izopropenilo $C=C$ (Nr. 9, 11) izoliuotas.', 'The ring $C=C$ (no. 2, 3) and the $C=O$ (no. 7, 8) are joined through $C2−C7$: 4 atoms. The isopropenyl $C=C$ (no. 9, 11) is isolated.')
              },
              {
                prompt: t('Kiek atomų sudaro konjuguotąją sistemą?', 'How many atoms form the conjugated system?'),
                kind: 'number', answer: { value: 4, tol: 0 },
                hint: t('Skaičiuokite tik atomus, kuriuos bakstelėjote.', 'Count only the atoms you tapped.'),
                solution: t('4 atomai: du $C=C$ ir du $C=O$ atomai.', '4 atoms: two of the $C=C$ and two of the $C=O$.')
              }
            ],
            why: t('Karbonilo grupė prie ciklo $C=C$ sudaro $π,π$-sistemą, o metilo grupė ir izopropenilo grupė į ją neįeina.', 'A carbonyl group next to a ring $C=C$ forms a $π,π$ system, while the methyl group and the isopropenyl group are not part of it.'),
            src: 'S2.11',
            claims: [{ chiral: ['CC1=CC[C@H](CC1=O)C(C)=C', true] }, { cip: ['CC1=CC[C@H](CC1=O)C(C)=C', 4, 'R'] }]
          },
          {
            id: 'u03.natural.5',
            q: [
              { p: t('Citralis suteikia citrinos žievei kvapą ir turi dvi $C=C$ grupes ir $C=O$.', 'Citral gives lemon peel its smell and has two $C=C$ groups and a $C=O$.') },
              { mol: { smi: 'CC(C)=CCCC(C)=CC=O', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, sudarančius konjuguotąją sistemą.', 'Tap the atoms that form the conjugated system.'),
                kind: 'atoms', mol: { smi: 'CC(C)=CCCC(C)=CC=O', opts: { numbers: 'all' } }, answer: [6, 8, 9, 10],
                hint: t('Kurį $C=C$ nuo $C=O$ skiria tik vienas viengubasis ryšys?', 'Which $C=C$ is only one single bond away from the $C=O$?'),
                solution: t('Antrasis $C=C$ (Nr. 7, 9) ir $C=O$ (Nr. 10, 11) sudaro $π,π$-sistemą iš 4 atomų. Pirmasis $C=C$ (Nr. 2, 4) atskirtas dviem $CH2$ grupėmis.', 'The second $C=C$ (no. 7, 9) and the $C=O$ (no. 10, 11) form a $π,π$ system of 4 atoms. The first $C=C$ (no. 2, 4) is separated by two $CH2$ groups.')
              },
              {
                prompt: t('Kiek atomų sudaro konjuguotąją sistemą?', 'How many atoms form the conjugated system?'),
                kind: 'number', answer: { value: 4, tol: 0 },
                hint: t('Metilo grupės prie $C=C$ nėra sistemos dalis.', 'The methyl groups on the $C=C$ are not part of the system.'),
                solution: t('4 atomai: $C=C$ ir $C=O$, sujungti vienu viengubuoju ryšiu.', '4 atoms: a $C=C$ and a $C=O$ joined by one single bond.')
              }
            ],
            why: t('Dvigubieji ryšiai atsiranda dažnai, bet sistemą sudaro tik tie, kuriuos skiria vienas viengubasis ryšys.', 'Double bonds appear often, but only those separated by a single bond form a system.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.6',
            q: [
              { p: t('β-Jononas gaunamas iš augalų pigmento kvapiosios dalies.', 'β-Ionone is a fragrance compound obtained from plant pigments.') },
              { mol: { smi: 'CC(=O)C=CC1=C(C)CCCC1(C)C', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Kiek atomų sudaro konjuguotąją sistemą?', 'How many atoms form the conjugated system?'),
                kind: 'number', answer: { value: 6, tol: 0 },
                hint: t('Pradėkite nuo $C=O$ ir sekite per visus dvigubuosius ryšius, atskirtus vienu viengubuoju ryšiu.', 'Start at the $C=O$ and follow all double bonds that are separated by a single bond.'),
                solution: t('$C=O$ (2 atomai), grandinės $C=C$ (2 atomai) ir žiedo $C=C$ (2 atomai) sudaro 6 atomų sistemą: Nr. 2–7.', 'The $C=O$ (2 atoms), the chain $C=C$ (2 atoms) and the ring $C=C$ (2 atoms) form a system of 6 atoms: no. 2–7.')
              },
              {
                prompt: t('Bakstelėkite sistemos atomus.', 'Tap the atoms of the system.'),
                kind: 'atoms', mol: { smi: 'CC(=O)C=CC1=C(C)CCCC1(C)C', opts: { numbers: 'all' } }, answer: [1, 2, 3, 4, 5, 6],
                hint: t('Metilo grupės ir $sp3$ žiedo anglys sistemai nepriklauso.', 'The methyl groups and the $sp3$ ring carbons are not part of the system.'),
                solution: t('Atomai Nr. 2 (C), 3 (O), 4, 5 (grandinės $C=C$), 6 ir 7 (žiedo $C=C$).', 'Atoms no. 2 (C), 3 (O), 4, 5 (the chain $C=C$), 6 and 7 (the ring $C=C$).')
              }
            ],
            why: t('Ilgesnė konjuguotoji sistema tęsiasi per visą kryžminį dvigubųjų ryšių ir karbonilo grandinį; kiekvienas $sp3$ atomas ją nutrauktų.', 'A longer conjugated system runs along the whole chain of alternating double bonds and the carbonyl; any $sp3$ atom would break it.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.7',
            q: [
              { p: t('Mircenas yra apynių ir lauro eterinių aliejų sudedamoji dalis.', 'Myrcene is a component of the essential oils of hops and bay.') },
              { mol: { smi: 'C=CC(=C)CCC=C(C)C', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite konjuguotosios sistemos atomus.', 'Tap the atoms of the conjugated system.'),
                kind: 'atoms', mol: { smi: 'C=CC(=C)CCC=C(C)C', opts: { numbers: 'all' } }, answer: [0, 1, 2, 3],
                hint: t('Šalia šakos ($=CH2$) yra du $C=C$: kuriuos skiria tik vienas viengubasis ryšys?', 'There are two $C=C$ next to the branch ($=CH2$): which are separated by only one single bond?'),
                solution: t('$C1=C2$ ir $C3=C4$ sujungti per $C2−C3$: 4 atomai (Nr. 1–4). Trečiasis $C=C$ (Nr. 7, 8) izoliuotas.', 'The $C1=C2$ and $C3=C4$ are joined through $C2−C3$: 4 atoms (no. 1–4). The third $C=C$ (no. 7, 8) is isolated.')
              },
              {
                prompt: t('Kiek atomų sudaro konjuguotąją sistemą?', 'How many atoms form the conjugated system?'),
                kind: 'number', answer: { value: 4, tol: 0 },
                hint: t('Atomas su dviem dvigubaisiais ryšiais iš tos pačios sistemos vis tiek skaičiuojamas vieną kartą.', 'An atom is counted only once even if it belongs to two double-bond units.'),
                solution: t('Sistemą sudaro 4 anglies atomai.', 'The system consists of 4 carbon atoms.')
              }
            ],
            why: t('Dienas gali būti konjuguotas ir tada, kai prie jo prisijungia $=CH2$ šaka: svarbu, kad $C=C$ ryšiai būtų atskirti vienu viengubuoju ryšiu.', 'A diene can be conjugated even when a $=CH2$ branch is attached: what matters is that the $C=C$ bonds are separated by one single bond.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.8',
            q: [
              { p: t('Limonenas suteikia citrusinių vaisių žievėms jų kvapą.', 'Limonene gives citrus peel its smell.') },
              { mol: { smi: 'CC1=CCC(CC1)C(C)=C', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Ar limonene yra konjuguotoji sistema?', 'Is there a conjugated system in limonene?'),
                kind: 'choice',
                options: [{ text: t('Ne, abu dvigubieji ryšiai izoliuoti.', 'No, both double bonds are isolated.') }, { text: t('Taip, abu $C=C$ sudaro vieną sistemą per žiedą.', 'Yes, the two $C=C$ form one system through the ring.') }, { text: t('Taip, žiedo $C=C$ konjuguotas su metilo grupe.', 'Yes, the ring $C=C$ is conjugated with the methyl group.') }],
                answer: 0,
                hint: t('Suskaičiuokite $sp3$ atomus tarp žiedo $C=C$ ir izopropenilo $C=C$.', 'Count the $sp3$ atoms between the ring $C=C$ and the isopropenyl $C=C$.'),
                solution: t('Tarp dviejų $C=C$ yra bent du $sp3$ atomai ($CH2$ ir $CH$), todėl $π$ ryšiai izoliuoti. Metilo grupė $p$ orbitalės neturi.', 'At least two $sp3$ atoms ($CH2$ and $CH$) lie between the two $C=C$, so the $π$ bonds are isolated. A methyl group has no $p$ orbital.')
              },
              {
                prompt: t('Kuris teiginys apie izopropenilo $C=C$ teisingas?', 'Which statement about the isopropenyl $C=C$ is correct?'),
                kind: 'choice',
                options: [
                  { text: t('Jis atskirtas nuo žiedo $C=C$ $sp3$ atomais, todėl konjugacijos nėra.', 'It is separated from the ring $C=C$ by $sp3$ atoms, so there is no conjugation.') },
                  { text: t('Jis konjuguotas su žiedo $C=C$ per $σ$ ryšius.', 'It is conjugated with the ring $C=C$ through $σ$ bonds.') },
                  { text: t('Jis konjuguotas, nes abu $C=C$ yra toje pačioje molekulėje.', 'It is conjugated because both $C=C$ are in the same molecule.') }
                ],
                answer: 0,
                hint: t('Konjugacijai reikia gretimų $p$ orbitalių, o ne vien buvimo toje pačioje molekulėje.', 'Conjugation needs neighbouring $p$ orbitals, not just being in the same molecule.'),
                solution: t('$sp3$ atomai neturi $p$ orbitalių, todėl jie nutraukia $π$ sistemą.', '$sp3$ atoms have no $p$ orbitals, so they break the $π$ system.')
              }
            ],
            why: t('Du dvigubieji ryšiai toje pačioje molekulėje ne visada sudaro konjuguotąją sistemą: jos nėra, jei juos skiria $sp3$ atomai.', 'Two double bonds in one molecule do not always form a conjugated system: there is none if $sp3$ atoms separate them.'),
            src: 'S2.11'
          },
          {
            id: 'u03.natural.9',
            q: [
              { p: t('Eugenolis suteikia gvazdikėliams jų kvapą.', 'Eugenol gives cloves their smell.') },
              { mol: { smi: 'C=CCc1ccc(O)c(OC)c1', opts: { numbers: 'all' } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, sudarančius konjuguotąją sistemą (įskaitant deguonis su laisvosiomis poromis, prisijungusius prie žiedo).', 'Tap the atoms that form the conjugated system (including the oxygens with lone pairs that are attached to the ring).'),
                kind: 'atoms', mol: { smi: 'C=CCc1ccc(O)c(OC)c1', opts: { numbers: 'all' } }, answer: [3, 4, 5, 6, 7, 8, 9, 11],
                hint: t('Alilo grupės $C=C$ nuo žiedo atskirta $CH2$. Kokie atomai dar gretimi žiedui?', 'The allyl $C=C$ is separated from the ring by $CH2$. Which other atoms are next to the ring?'),
                solution: t('Į sistemą įeina šeši žiedo atomai (Nr. 4–7, 9 ir 12) ir du deguonys (Nr. 8 ir 10), nes jų laisvosios poros persidengia su žiedu ($p,π$). Alilo $C=C$ (Nr. 1, 2) izoliuotas.', 'The system includes the six ring atoms (no. 4–7, 9 and 12) and two oxygens (no. 8 and 10) whose lone pairs overlap with the ring ($p,π$). The allyl $C=C$ (no. 1, 2) is isolated.')
              },
              {
                prompt: t('Kiek atomų sudaro konjuguotąją sistemą?', 'How many atoms form the conjugated system?'),
                kind: 'number', answer: { value: 8, tol: 0 },
                hint: t('Žiedas sudaro šešis atomus; kiek atomų prideda dar kiti?', 'The ring gives six atoms; how many more are added?'),
                solution: t('6 žiedo atomai ir 2 deguonys: 8. Metilo anglis (Nr. 11) yra $sp3$ ir nepriklauso.', '6 ring atoms and 2 oxygens: 8. The methyl carbon (no. 11) is $sp3$ and does not belong.')
              }
            ],
            why: t('Benzeno žiedas su pakaitais, turinčiais laisvąsias poras, sudaro vieną $π,π$- ir $p,π$-sistemą. Alilo grupė sistemos neapima, nes $CH2$ ją atskiria.', 'A benzene ring with lone-pair substituents forms one $π,π$ and $p,π$ system. The allyl group is not part of it because $CH2$ separates it.'),
            src: 'S2.11'
          }
        ]
      },
      /* ============ u03.resonance: resonance structures (bank) ============ */
      {
        id: 'u03.resonance',
        title: t('Rezonansinės formulės ir krūvio delokalizacija', 'Resonance structures and charge delocalisation'),
        mirrors: ['S2.12'],
        bank: [
          {
            id: 'u03.resonance.1',
            q: [{ p: t('Alilo katijonas turi tris anglies atomus.', 'The allyl cation has three carbon atoms.') }, { mol: { smi: 'C=C[CH2+]', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Kuri formulė yra šios dalelės rezonansinė formulė?', 'Which formula is a resonance structure of this particle?'),
                kind: 'choice',
                options: [{ mol: { smi: '[CH2+]C=C' } }, { mol: { smi: 'C[C+]=C' } }, { mol: { smi: 'C1C[CH+]1' } }],
                answer: 0,
                hint: t('Rezonansinėse formulėse atomai ir $σ$ ryšių skeletas nesikeičia, keičiasi tik $π$ elektronų ir krūvio padėtis.', 'In resonance structures the atoms and the $σ$ skeleton stay the same; only the position of $π$ electrons and charge changes.'),
                solution: [{ p: t('Teisinga formulė gaunama pasislinkus $π$ elektronams: dvigubas ryšys perkeliamas, krūvis atsiduria kitame gale. Kitos dvi formulės yra izomerai: pakeistas atomų išsidėstymas.', 'The correct structure comes from shifting the $π$ electrons: the double bond moves and the charge ends up at the other end. The other two are isomers: the arrangement of atoms is changed.') }, { resonance: [{ smi: 'C=C[CH2+]' }, { smi: '[CH2+]C=C' }] }]
              },
              {
                prompt: t('Bakstelėkite atomus, tarp kurių dalijasi teigiamas krūvis.', 'Tap the atoms between which the positive charge is shared.'),
                kind: 'atoms', mol: { smi: 'C=C[CH2+]', opts: { numbers: 'all' } }, answer: [0, 2],
                hint: t('Teigiamas krūvis atsiduria tame $C=C$ gale, kuris neturi $π$ ryšio kitoje formulėje.', 'The positive charge ends up at the end of the $C=C$ that has no $π$ bond in the other structure.'),
                solution: t('Krūvis dalijasi tarp galinių atomų Nr. 1 ir Nr. 3 (po pusę), o vidurinis atomas Nr. 2 krūvio neturi.', 'The charge is shared between the terminal atoms no. 1 and no. 3 (half each), while the middle atom no. 2 has none.')
              }
            ],
            why: t('Alilo katijone tuščia $p$ orbitalė persidengia su $π$ ryšiu ir krūvis išsklaidomas dviem atomais. Todėl alilo katijonas stabilesnis už pirminį alkilo katijoną.', 'In the allyl cation the empty $p$ orbital overlaps with the $π$ bond and the charge is spread over two atoms. This makes the allyl cation more stable than a primary alkyl cation.'),
            src: 'L3 p9'
          },
          {
            id: 'u03.resonance.2',
            q: [{ p: t('Alilo anijonas turi neigiamą krūvį.', 'The allyl anion carries a negative charge.') }, { mol: { smi: 'C=C[CH2-]', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, kuriuose pasiskirsto neigiamas krūvis.', 'Tap the atoms over which the negative charge is spread.'),
                kind: 'atoms', mol: { smi: 'C=C[CH2-]', opts: { numbers: 'all' } }, answer: [0, 2],
                hint: t('Laisvoji pora persidengia su $π$ ryšiu ir juda link jo.', 'The lone pair overlaps with the $π$ bond and moves towards it.'),
                solution: [{ p: t('Krūvis dalijasi tarp galinių atomų Nr. 1 ir Nr. 3.', 'The charge is shared between the terminal atoms no. 1 and no. 3.') }, { resonance: [{ smi: 'C=C[CH2-]' }, { smi: '[CH2-]C=C' }] }]
              },
              {
                prompt: t('Ką galima pasakyti apie abu $C−C$ ryšius alilo anijone?', 'What can be said about the two $C−C$ bonds in the allyl anion?'),
                kind: 'choice',
                options: [{ text: t('Jie vienodi: nei dvigubi, nei viengubi, o tarpiniai.', 'They are equal: neither double nor single, but intermediate.') }, { text: t('Vienas dvigubas, kitas viengubas, nes anijonas greitai šoka iš vienos formos į kitą.', 'One is double and the other single, because the anion switches rapidly between two forms.') }, { text: t('Abu yra viengubi, nes krūvis juos prailgina.', 'Both are single, because the charge lengthens them.') }],
                answer: 0,
                hint: t('Rezonansinės formulės nėra realios dalelės: tikroji dalelė yra visų jų hibridas.', 'Resonance structures are not real particles: the real particle is a hybrid of all of them.'),
                solution: t('Tikroji dalelė yra hibridas, o ne pusiausvyra tarp formų. Delokalizuoti $π$ elektronai abu ryšius daro vienodus (tarpinio ilgio).', 'The real particle is a hybrid, not an equilibrium between forms. The delocalised $π$ electrons make both bonds equal (of intermediate length).')
              }
            ],
            why: t('Rezonansinių formulių rodyklė $↔$ nereiškia pusiausvyros: ji sako, kad tikra dalelė yra visų formulių hibridas su delokalizuotu krūviu.', 'The arrow $↔$ between resonance structures does not mean an equilibrium: it says that the real particle is a hybrid of all the structures with a delocalised charge.'),
            src: 'L3 p9'
          },
          {
            id: 'u03.resonance.3',
            q: [{ p: t('Fenoksido jone neigiamas krūvis iš pradžių yra ant deguonies.', 'In the phenoxide ion the negative charge starts on oxygen.') }, { mol: { smi: '[O-]c1ccccc1', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite visus atomus, kuriuose rezonansinėse formulėse atsiranda neigiamas krūvis.', 'Tap all the atoms on which negative charge appears in the resonance structures.'),
                kind: 'atoms', mol: { smi: '[O-]c1ccccc1', opts: { numbers: 'all' } }, answer: [0, 2, 4, 6],
                hint: t('Deguonies pora juda link žiedo; kurie žiedo atomai gauna elektronų tankį (orto ir para)?', 'The oxygen pair moves into the ring; which ring atoms gain electron density (ortho and para)?'),
                solution: [{ p: t('Neigiamas krūvis dalijasi tarp deguonies (Nr. 1), orto atomų (Nr. 3 ir Nr. 7) ir para atomo (Nr. 5).', 'The negative charge is shared by oxygen (no. 1), the ortho atoms (no. 3 and no. 7) and the para atom (no. 5).') }, { resonance: [{ smi: '[O-]c1ccccc1' }, { smi: 'O=C1C=CC=C[CH-]1' }, { smi: 'O=C1C=C[CH-]C=C1' }] }]
              },
              {
                prompt: t('Kodėl fenoksido jonas stabilesnis už etoksido joną $CH3CH2O-$?', 'Why is the phenoxide ion more stable than the ethoxide ion $CH3CH2O-$?'),
                kind: 'choice',
                options: [{ text: t('Fenoksido krūvis delokalizuotas per benzeno žiedą, etoksido – ne.', 'The phenoxide charge is delocalised over the benzene ring, the ethoxide charge is not.') }, { text: t('Fenoksido jone yra daugiau anglies atomų.', 'The phenoxide ion has more carbon atoms.') }, { text: t('Etilo grupė yra elektronų akceptorius.', 'The ethyl group is an electron acceptor.') }, { text: t('Fenoksido jonas neturi laisvųjų porų.', 'The phenoxide ion has no lone pairs.') }],
                answer: 0,
                hint: t('Stabilumą didina krūvio išsklaidymas keliuose atomuose.', 'Stability grows when the charge is spread over several atoms.'),
                solution: t('Etoksido krūvis lieka ant vieno deguonies, o etilo grupė dar jį didina savo +I efektu. Fenoksido krūvį sugeria žiedas.', 'The ethoxide charge stays on one oxygen, and the ethyl group even adds to it through its +I effect. The phenoxide charge is taken up by the ring.')
              }
            ],
            why: t('Kuo daugiau atomų dalijasi krūvį, tuo stabilesnė dalelė. Todėl konjuguotieji anijonai yra stabilesni už nekonjuguotus.', 'The more atoms share the charge, the more stable the particle. That is why conjugated anions are more stable than non-conjugated ones.'),
            src: 'L3 p10'
          },
          {
            id: 'u03.resonance.4',
            q: [{ p: t('Acetato jonas, turintis dvi $C−O$ grupes.', 'The acetate ion, with two $C−O$ groups.') }, { mol: { smi: 'CC(=O)[O-]', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Kuris teiginys apie acetato joną teisingas?', 'Which statement about the acetate ion is correct?'),
                kind: 'choice',
                options: [
                  { text: t('Abu $C−O$ ryšiai vienodi, o neigiamas krūvis po pusę pasiskirsto abiem deguonims.', 'Both $C−O$ bonds are equal and the negative charge is shared half and half by the two oxygens.') },
                  { text: t('Vienas $C−O$ ryšys dvigubas, kitas viengubas, o krūvis yra ant vieno deguonies.', 'One $C−O$ bond is double, the other single, and the charge sits on one oxygen.') },
                  { text: t('Jonas yra pusiausvyra tarp dviejų skirtingų anijonų.', 'The ion is an equilibrium between two different anions.') },
                  { text: t('Neigiamas krūvis dalijasi tarp deguonies ir metilo anglies.', 'The negative charge is shared between oxygen and the methyl carbon.') }
                ],
                answer: 0,
                hint: t('Parašykite rezonansines formules ir palyginkite, ką jos sako apie du deguonis.', 'Write the resonance structures and compare what they say about the two oxygens.'),
                solution: [{ p: t('Abi rezonansinės formulės yra lygiavertės: $O$ ir $O$ sukeičia vietomis. Todėl ryšiai vienodi.', 'The two resonance structures are equivalent: the two oxygens swap places. So the bonds are equal.') }, { resonance: [{ smi: 'CC(=O)[O-]' }, { smi: 'CC([O-])=O' }] }]
              },
              {
                prompt: t('Bakstelėkite atomus, kurie dalijasi neigiamą krūvį.', 'Tap the atoms that share the negative charge.'),
                kind: 'atoms', mol: { smi: 'CC(=O)[O-]', opts: { numbers: 'all' } }, answer: [2, 3],
                hint: t('Metilo anglis $sp3$ ir su $π$ sistema nesusijusi.', 'The methyl carbon is $sp3$ and not part of the $π$ system.'),
                solution: t('Krūvį dalijasi du deguonys (Nr. 3 ir Nr. 4). Karboksilato anglis (Nr. 2) turi aštuonis elektronus ir krūvio nepriima.', 'Two oxygens (no. 3 and no. 4) share the charge. The carboxylate carbon (no. 2) has eight electrons and takes no charge.')
              }
            ],
            why: t('Kai rezonansinės formulės lygiavertės, delokalizacija didžiausia, o ryšiai vienodi. Tai viena priežasčių, kodėl karboksilatai tokie stabilūs.', 'When the resonance structures are equivalent, delocalisation is at its greatest and the bonds are equal. This is one reason why carboxylates are so stable.'),
            src: 'L3 p10'
          },
          {
            id: 'u03.resonance.5',
            q: [{ p: t('Benzilo katijonas: teigiamą krūvį turi $CH2$ anglis, prisijungusi prie žiedo.', 'The benzyl cation: the $CH2$ carbon attached to the ring carries the positive charge.') }, { mol: { smi: '[CH2+]c1ccccc1', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite visus atomus, kuriuose rezonansinėse formulėse yra teigiamas krūvis.', 'Tap all the atoms that carry positive charge in the resonance structures.'),
                kind: 'atoms', mol: { smi: '[CH2+]c1ccccc1', opts: { numbers: 'all' } }, answer: [0, 2, 4, 6],
                hint: t('Žiedo $π$ elektronai juda link tuščios $p$ orbitalės; iš kokių atomų jie pasitraukia?', 'The ring $π$ electrons move towards the empty $p$ orbital; which atoms do they leave?'),
                solution: [{ p: t('Krūvis dalijasi tarp $CH2$ (Nr. 1) ir žiedo orto (Nr. 3, 7) bei para (Nr. 5) atomų.', 'The charge is shared by the $CH2$ (no. 1) and the ring ortho (no. 3, 7) and para (no. 5) atoms.') }, { resonance: [{ smi: '[CH2+]c1ccccc1' }, { smi: 'C=C1C=CC=C[CH+]1' }, { smi: 'C=C1C=C[CH+]C=C1' }] }]
              },
              {
                prompt: t('Kodėl benzilo katijonas stabilesnis už metilo katijoną?', 'Why is the benzyl cation more stable than the methyl cation?'),
                kind: 'choice',
                options: [{ text: t('Teigiamas krūvis delokalizuojamas konjuguotoje žiedo sistemoje.', 'The positive charge is delocalised in the conjugated ring system.') }, { text: t('Benzeno žiedas turi stiprų −I efektą ir stabilizuoja krūvį.', 'The benzene ring has a strong −I effect and stabilises the charge.') }, { text: t('Benzilo katijonas turi daugiau elektronų.', 'The benzyl cation has more electrons.') }],
                answer: 0,
                hint: t('Elektronų trūkumą kompensuoja gretimos $π$ sistemos elektronai.', 'The electrons of the neighbouring $π$ system compensate the electron deficiency.'),
                solution: t('Tuščia $p$ orbitalė persidengia su žiedo $π$ sistema, todėl krūvis pasiskirsto keturiuose atomuose. −I efektas katijoną tik destabilizuotų.', 'The empty $p$ orbital overlaps with the $π$ system of the ring, so the charge is spread over four atoms. A −I effect would only destabilise the cation.')
              }
            ],
            why: t('Delokalizacija per konjuguotą sistemą stabilizuoja katijoną ir paaiškina, kodėl benzilo katijonas yra stabiliausias iš šioje temoje nagrinėjamų karbokatijonų.', 'Delocalisation over a conjugated system stabilises the cation and explains why the benzyl cation is the most stable of the carbocations in this unit.'),
            src: 'L3 p9'
          },
          {
            id: 'u03.resonance.6',
            q: [{ p: t('Chloretene chloras turi laisvųjų porų ir yra prijungtas prie $C=C$.', 'In chloroethene chlorine has lone pairs and is attached to the $C=C$.') }, { mol: { smi: 'C=CCl', opts: { numbers: 'all', lonePairs: [2] } } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, kurie turi formalųjį krūvį rezonansinėje formulėje su pasislinkusia chloro pora.', 'Tap the atoms that carry a formal charge in the resonance structure in which the chlorine pair has shifted.'),
                kind: 'atoms', mol: { smi: 'C=CCl', opts: { numbers: 'all', lonePairs: [2] } }, answer: [0, 2],
                hint: t('Pora iš chloro sudaro $C−Cl$ ryšį, o $π$ elektronai pasislenka į galinį anglies atomą.', 'The pair from chlorine forms the $C−Cl$ bond and the $π$ electrons shift to the terminal carbon.'),
                solution: [{ p: t('Chloras tampa teigiamas (Nr. 3), galinė anglis – neigiama (Nr. 1).', 'Chlorine becomes positive (no. 3) and the terminal carbon negative (no. 1).') }, { resonance: [{ smi: 'C=CCl', opts: { lonePairs: [2] } }, { smi: '[CH2-]C=[Cl+]' }] }]
              },
              {
                prompt: t('Kokio ženklo efektą tai atitinka?', 'Which kind of effect does this correspond to?'),
                kind: 'choice',
                options: [{ text: t('+M: laisvoji pora didina $π$ sistemos elektronų tankį', '+M: the lone pair raises the electron density of the $π$ system') }, { text: t('−M: $π$ elektronai slenka link chloro', '−M: the $π$ electrons shift towards chlorine') }, { text: t('+I: chloras tiesia elektronus per $σ$ ryšį', '+I: chlorine pushes electrons through the $σ$ bond') }],
                answer: 0,
                hint: t('Ar elektronų tankis atsiranda $π$ sistemoje, ar iš jos pasitraukia?', 'Does electron density arrive in the $π$ system or leave it?'),
                solution: t('Elektronų tankis perkeliamas iš chloro į galinę anglį: tai +M. Tačiau chloro −I stipresnis, todėl bendras poveikis – akceptorius.', 'Electron density is moved from chlorine to the terminal carbon: this is +M. But the −I of chlorine is stronger, so the net effect is that of an acceptor.')
              }
            ],
            why: t('Laisvųjų porų turintis atomas prie $π$ sistemos duoda +M efektą, kurį rodo rezonansinė formulė su teigiamu heteroatomu.', 'An atom with lone pairs attached to a $π$ system gives a +M effect, shown by the resonance structure with a positive heteroatom.'),
            src: 'L3 p10'
          },
          {
            id: 'u03.resonance.7',
            q: [{ p: t('Propenalis gali būti užrašytas keliomis formulėmis.', 'Prop-2-enal can be written with several structures.') }, { mol: { smi: 'C=CC=O' } }],
            steps: [
              {
                prompt: t('Kuri formulė yra propenalio rezonansinė formulė?', 'Which formula is a resonance structure of prop-2-enal?'),
                kind: 'choice',
                options: [{ mol: { smi: '[CH2+]C=C[O-]' } }, { mol: { smi: 'C=C=CO' } }, { mol: { smi: 'CC=C=O' } }],
                answer: 0,
                hint: t('Rezonansinė formulė gaunama tik slenkant elektronams; kiti du variantai turi atomus kitose vietose.', 'A resonance structure comes only from shifting electrons; the other two options have atoms in different places.'),
                solution: [{ p: t('$π$ elektronai slenka link deguonies, todėl galinis atomas tampa teigiamas, o deguonis – neigiamas. Kiti du junginiai yra izomerai.', 'The $π$ electrons shift towards oxygen, so the terminal atom becomes positive and oxygen negative. The other two compounds are isomers.') }, { resonance: [{ smi: 'C=CC=O' }, { smi: '[CH2+]C=C[O-]' }] }]
              },
              {
                prompt: t('Kuri iš dviejų rezonansinių formulių labiau atitinka tikrąją molekulę?', 'Which of the two resonance structures resembles the real molecule more?'),
                kind: 'choice',
                options: [{ mol: { smi: 'C=CC=O' } }, { mol: { smi: '[CH2+]C=C[O-]' } }],
                answer: 0,
                hint: t('Kurioje formulėje mažiau krūvio atskyrimo ir visi atomai turi oktetus?', 'In which structure is there less charge separation and do all atoms have octets?'),
                solution: t('Neutrali formulė vyrauja: joje visi atomai turi oktetus ir nėra krūvių atskyrimo. Krūvį atskyrusi formulė ją tik papildo ir parodo $δ+$ ir $δ−$ vietas.', 'The neutral structure dominates: all its atoms have octets and there is no charge separation. The charge-separated structure only supplements it and shows where $δ+$ and $δ−$ lie.')
              }
            ],
            why: t('Skirtingos rezonansinės formulės prie hibrido prisideda nevienodai: svarbiausia yra ta, kurioje mažiau krūvių atskyrimo ir visi atomai turi oktetus.', 'Different resonance structures contribute unequally to the hybrid: the main contributor is the one with the least charge separation in which all atoms have octets.'),
            src: 'L3 p12'
          },
          {
            id: 'u03.resonance.8',
            q: [{ p: t('Acetono enolato jonas.', 'The enolate ion of acetone.') }, { mol: { smi: 'C=C([O-])C', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, kuriuose pasiskirsto neigiamas krūvis.', 'Tap the atoms over which the negative charge is distributed.'),
                kind: 'atoms', mol: { smi: 'C=C([O-])C', opts: { numbers: 'all' } }, answer: [0, 2],
                hint: t('Deguonies pora gali sudaryti $C=O$ ryšį, o $π$ elektronai pasislenka į galinę anglį.', 'The oxygen pair can form a $C=O$ bond while the $π$ electrons shift to the terminal carbon.'),
                solution: [{ p: t('Krūvis dalijasi tarp galinės anglies (Nr. 1) ir deguonies (Nr. 3).', 'The charge is shared between the terminal carbon (no. 1) and oxygen (no. 3).') }, { resonance: [{ smi: 'C=C([O-])C' }, { smi: '[CH2-]C(=O)C' }] }]
              },
              {
                prompt: t('Kodėl šis anijonas stabilesnis už paprastą alkilo karbanijoną?', 'Why is this anion more stable than a simple alkyl carbanion?'),
                kind: 'choice',
                options: [{ text: t('Neigiamas krūvis dalijasi su elektrinio neigiamesniu deguonimi.', 'The negative charge is shared with the more electronegative oxygen.') }, { text: t('Metilo grupės didina elektronų tankį ties anglimi.', 'The methyl groups raise the electron density at carbon.') }, { text: t('Anijonas yra aromatinis.', 'The anion is aromatic.') }],
                answer: 0,
                hint: t('Kurioje rezonansinėje formulėje krūvis yra ant elektrinės neigiamesnio atomo?', 'In which resonance structure does the charge sit on the more electronegative atom?'),
                solution: t('Deguonis geriau išlaiko neigiamą krūvį nei anglis, todėl delokalizacija į jį stipriai stabilizuoja anijoną.', 'Oxygen holds a negative charge better than carbon, so delocalisation onto it strongly stabilises the anion.')
              }
            ],
            why: t('Anijono stabilumas didėja, kai krūvis dalijasi su elektrinės neigiamesniu atomu; to pagrindu aldehidų ir ketonų $α$ vandenilis yra pakankamai rūgštus.', 'The stability of an anion grows when the charge is shared with a more electronegative atom; this is why the $α$ hydrogen of aldehydes and ketones is acidic enough.'),
            src: 'L3 p30'
          },
          {
            id: 'u03.resonance.9',
            q: [{ p: t('Pentadienilo katijonas turi penkis anglies atomus.', 'The pentadienyl cation has five carbon atoms.') }, { mol: { smi: 'C=CC=C[CH2+]', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, kuriuose rezonansinėse formulėse yra teigiamas krūvis.', 'Tap the atoms that carry positive charge in the resonance structures.'),
                kind: 'atoms', mol: { smi: 'C=CC=C[CH2+]', opts: { numbers: 'all' } }, answer: [0, 2, 4],
                hint: t('Kiekvieną kartą $π$ ryšys pasislenka per du atomus: krūvis šokinėja kas antrą atomą.', 'Each time a $π$ bond shifts by two atoms: the charge jumps to every other atom.'),
                solution: [{ p: t('Krūvis dalijasi tarp atomų Nr. 1, 3 ir 5; atomai Nr. 2 ir 4 krūvio negauna.', 'The charge is shared by atoms no. 1, 3 and 5; atoms no. 2 and 4 get none.') }, { resonance: [{ smi: '[CH2+]C=CC=C' }, { smi: 'C=C[CH+]C=C' }, { smi: 'C=CC=C[CH2+]' }] }]
              },
              {
                prompt: t('Kiek atomų išsklaido krūvį?', 'Over how many atoms is the charge spread?'),
                kind: 'number', answer: { value: 3, tol: 0 },
                hint: t('Skaičiuokite tik atomus, kuriuose rezonansinėse formulėse yra krūvis.', 'Count only the atoms that carry charge in some resonance structure.'),
                solution: t('Trys atomai (Nr. 1, 3, 5), todėl ši dalelė stabilesnė už alilo katijoną.', 'Three atoms (no. 1, 3, 5), so this particle is more stable than the allyl cation.')
              }
            ],
            why: t('Ilgesnė konjuguota sistema išsklaido krūvį per daugiau atomų ir stabilizuoja dalelę dar labiau.', 'A longer conjugated system spreads the charge over more atoms and stabilises the particle further.'),
            src: 'T p30'
          },
          {
            id: 'u03.resonance.10',
            q: [{ p: t('Rezonansinės formulės ir jų rodyklė $↔$ dažnai suprantami klaidingai.', 'Resonance structures and their arrow $↔$ are often misunderstood.') }],
            steps: [
              {
                prompt: t('Pažymėkite visus teisingus teiginius.', 'Pick every correct statement.'),
                kind: 'multi',
                options: [
                  { text: t('Rezonansinėse formulėse keičiasi tik elektronų padėtis, bet ne atomų.', 'In resonance structures only the position of electrons changes, not that of atoms.') },
                  { text: t('Rodyklė $↔$ reiškia greitą pusiausvyrą tarp dviejų skirtingų dalelių.', 'The arrow $↔$ means a rapid equilibrium between two different particles.') },
                  { text: t('Tikroji dalelė yra visų rezonansinių formulių hibridas.', 'The real particle is a hybrid of all the resonance structures.') },
                  { text: t('Kiekviena formulė turi būti teisinga Lewiso formulė (neviršijamas oktetas).', 'Every structure must be a valid Lewis structure (the octet is not exceeded).') },
                  { text: t('Kuo daugiau rezonansinių formulių galima parašyti, tuo labiau krūvis išsklaidytas ir dalelė stabilesnė.', 'The more resonance structures can be written, the more the charge is spread and the more stable the particle.') }
                ],
                answer: [0, 2, 3, 4],
                hint: t('Pagalvokite, ar rezonansas yra dviejų realių dalelių pusiausvyra.', 'Think about whether resonance is an equilibrium of two real particles.'),
                solution: t('Neteisingas tik antrasis: rezonansas nėra pusiausvyra. Dalelė viena, ir ji yra formulių hibridas.', 'Only the second is wrong: resonance is not an equilibrium. There is one particle, and it is a hybrid of the structures.')
              }
            ],
            why: t('Rezonansas yra užrašymo būdas elektronų delokalizacijai parodyti, o ne cheminė reakcija.', 'Resonance is a way of writing electron delocalisation, not a chemical reaction.'),
            src: 'L4 p17'
          }
        ]
      },
      /* ============ u03.energy: reaction rate, catalysis, intermediates (bank) ============ */
      {
        id: 'u03.energy',
        title: t('Reakcijos greitis, katalizė ir tarpinės dalelės', 'Reaction rate, catalysis and intermediates'),
        mirrors: [],
        bank: [
          {
            id: 'u03.energy.1',
            q: [{ p: t('Reakcijos kryptį lemia du veiksniai.', 'Two factors decide the direction of a reaction.') }],
            steps: [
              {
                prompt: t('Suporuokite kiekvieną veiksnį su jo reikšme.', 'Pair each factor with its meaning.'),
                kind: 'match',
                answer: {
                  left: [{ text: t('Statinis veiksnys', 'Static factor') }, { text: t('Dinaminis veiksnys', 'Dynamic factor') }],
                  right: [
                    { text: t('Kaip pasiskirstęs elektronų tankis pradinėse medžiagose', 'How the electron density is distributed in the starting materials') },
                    { text: t('Kiek stabilios yra galimos tarpinės dalelės', 'How stable the possible intermediates are') },
                    { text: t('Katalizatoriaus kiekis', 'Amount of catalyst') },
                    { text: t('Reakcijos greitis laiko vienetui', 'Rate of reaction per unit time') }
                  ],
                  pairs: [0, 1]
                },
                hint: t('Vienas veiksnys apibūdina molekules prieš reakciją, kitas – tai, kas susidaro reakcijos metu.', 'One factor describes the molecules before the reaction, the other what forms during it.'),
                solution: t('Statinis veiksnys yra pradinių molekulių poliškumas (kur yra $δ+$ ir $δ−$), o dinaminis – galimų tarpinių dalelių stabilumas: susidaro stabilesnės.', 'The static factor is the electron density distribution in the starting compounds (where the $δ+$ and $δ−$ are), the dynamic factor is the stability of the possible intermediates: the more stable ones form.')
              }
            ],
            why: t('Reakcija pasirenka kryptį, kuri leidžia stabiliausią tarpinę dalelę, o pradinių junginių poliškumas parodo, kuriame taške ji prasidės.', 'A reaction chooses the direction that allows the most stable intermediate, and the polarity of the starting compounds shows where it starts.'),
            src: 'L3 p18'
          },
          {
            id: 'u03.energy.2',
            q: [{ p: t('Dvi reakcijos vyksta toje pačioje temperatūroje. Pirmosios aktyvacijos energija 50 kJ/mol, antrosios 80 kJ/mol.', 'Two reactions run at the same temperature. The first has an activation energy of 50 kJ/mol, the second 80 kJ/mol.') }],
            steps: [
              {
                prompt: t('Kuri reakcija greitesnė?', 'Which reaction is faster?'),
                kind: 'choice',
                options: [{ text: t('Pirmoji (50 kJ/mol)', 'The first (50 kJ/mol)') }, { text: t('Antroji (80 kJ/mol)', 'The second (80 kJ/mol)') }, { text: t('Abi vienodai greitos', 'Both are equally fast') }],
                answer: 0,
                hint: t('Aktyvacijos energija yra barjeras, kurį susidūrusios molekulės turi įveikti.', 'The activation energy is a barrier that colliding molecules have to overcome.'),
                solution: t('Kuo mažesnė $Ea$, tuo daugiau susidūrimų būna efektyvūs, todėl pirmoji reakcija greitesnė.', 'The smaller the $Ea$, the more collisions are effective, so the first reaction is faster.')
              },
              {
                prompt: t('Į antrąją reakciją įdedama tinkamo katalizatoriaus. Kas pasikeičia?', 'A suitable catalyst is added to the second reaction. What changes?'),
                kind: 'choice',
                options: [{ text: t('Sumažėja $Ea$ ir reakcija pagreitėja; produktų energija nekinta.', '$Ea$ falls and the reaction speeds up; the energy of the products does not change.') }, { text: t('Padidėja produktų stabilumas ir pasislenka pusiausvyra.', 'The stability of the products rises and the equilibrium shifts.') }, { text: t('Sumažėja tik pradinių junginių energija.', 'Only the energy of the starting compounds falls.') }],
                answer: 0,
                hint: t('Katalizatorius keičia kelią, bet ne pradinę ir galinę būsenas.', 'A catalyst changes the path, not the initial and final states.'),
                solution: t('Katalizatorius sumažina kalno aukštį ($Ea$), bet pradinių junginių ir produktų lygiai lieka tie patys, todėl pusiausvyra nepasislenka.', 'A catalyst lowers the height of the hill ($Ea$) but the levels of the starting compounds and products stay the same, so the equilibrium does not shift.')
              }
            ],
            why: t('Greitį lemia aktyvacijos energija, o ne reakcijos energijų skirtumas. Katalizatorius veikia tik pirmąjį.', 'The rate is set by the activation energy, not by the energy difference of the reaction. A catalyst affects only the former.'),
            src: 'L3 p19'
          },
          {
            id: 'u03.energy.3',
            q: [{ p: t('Į reakcijos mišinį įdedamas katalizatorius.', 'A catalyst is added to a reaction mixture.') }],
            steps: [
              {
                prompt: t('Pažymėkite visus teisingus teiginius.', 'Pick every correct statement.'),
                kind: 'multi',
                options: [
                  { text: t('Sumažina aktyvacijos energiją.', 'It lowers the activation energy.') },
                  { text: t('Pagreitina reakciją.', 'It speeds the reaction up.') },
                  { text: t('Pakeičia pradinės medžiagos ir produkto energiją.', 'It changes the energy of the starting material and product.') },
                  { text: t('Pakeičia pradinės medžiagos ir produkto santykį pusiausvyroje.', 'It changes the ratio of starting material to product at equilibrium.') },
                  { text: t('Pasidaro nauju reagentu ir keičia produktą.', 'It becomes a new reagent and changes the product.') }
                ],
                answer: [0, 1],
                hint: t('Katalizatorius reakciją pagreitina, bet nekeičia pradinės ir galutinės būsenos.', 'A catalyst accelerates the reaction but leaves the initial and final states unchanged.'),
                solution: t('Tikrieji teiginiai: $Ea$ mažėja ir reakcija greitėja. Kiti trys neteisingi: katalizatorius nekeičia produkto, energijų ar pusiausvyros.', 'The true statements: $Ea$ falls and the reaction speeds up. The other three are wrong: a catalyst changes neither the product, the energies nor the equilibrium.')
              }
            ],
            why: t('Katalizatorius yra tik greičio reguliatorius: pusiausvyra priklauso nuo pradinio ir galutinio energijos lygio.', 'A catalyst is only a rate regulator: the equilibrium depends on the initial and final energy levels.'),
            src: 'L3 p19'
          },
          {
            id: 'u03.energy.4',
            q: [{ p: t('Reakcija vyksta dviem stadijomis: lėta I stadija ($Ea$ = 90 kJ/mol) ir greita II stadija ($Ea$ = 20 kJ/mol).', 'A reaction proceeds in two stages: a slow stage I ($Ea$ = 90 kJ/mol) and a fast stage II ($Ea$ = 20 kJ/mol).') }],
            steps: [
              {
                prompt: t('Kuri stadija lemia bendrą reakcijos greitį?', 'Which stage sets the overall rate of the reaction?'),
                kind: 'choice',
                options: [{ text: t('I stadija, nes ji lėčiausia', 'Stage I, because it is the slowest') }, { text: t('II stadija, nes ji greičiausia', 'Stage II, because it is the fastest') }, { text: t('Abiejų stadijų vidurkis', 'The average of the two stages') }],
                answer: 0,
                hint: t('Pagalvokite apie butelio kakliuką: greitį nusako siauriausia vieta.', 'Think of a bottleneck: the narrowest place sets the flow.'),
                solution: t('Bendrą sudėtingos reakcijos greitį lemia lėčiausia stadija, todėl katalizatoriaus tikslas – sumažinti jos $Ea$.', 'The overall rate of a complex reaction is set by its slowest stage, so a catalyst aims to lower its $Ea$.')
              }
            ],
            why: t('Daugiastadijėje reakcijoje greitis ribojamas lėčiausios stadijos, o greitesnės stadijos jo nekeičia.', 'In a multistage reaction the rate is limited by the slowest stage, and the faster stages do not change it.'),
            src: 'L3 p19'
          },
          {
            id: 'u03.energy.5',
            q: [{ p: t('Energijos diagramoje tarp pradinių junginių ir produktų yra du kalnai ir tarp jų duobė.', 'In the energy diagram two hills with a valley between them lie between the starting compounds and the products.') }],
            steps: [
              {
                prompt: t('Kas atitinka tarpinę dalelę (intermediatą)?', 'What corresponds to an intermediate?'),
                kind: 'choice',
                options: [{ text: t('Energijos minimumas tarp dviejų stadijų', 'An energy minimum between the two stages') }, { text: t('Kiekvieno kalno viršūnė', 'The top of each hill') }, { text: t('Pradinių junginių lygis', 'The level of the starting compounds') }, { text: t('Produktų lygis', 'The level of the products') }],
                answer: 0,
                hint: t('Intermediatas yra nestabili, bet realiai egzistuojanti dalelė su gyvavimo trukme.', 'An intermediate is an unstable but real particle with a lifetime.'),
                solution: t('Intermediatas yra duobė tarp dviejų kalnų, o kalnų viršūnės yra tarpiniai būviai, kurių negalima išskirti.', 'An intermediate is the valley between two hills, while the tops of the hills are transition states, which cannot be isolated.')
              },
              {
                prompt: t('Nuo ko priklauso intermediato stabilumas ir susidarymo tikimybė?', 'What do the stability and the probability of formation of an intermediate depend on?'),
                kind: 'choice',
                options: [{ text: t('Nuo krūvio ar laisvosios poros delokalizacijos galimybės', 'On the possibility of delocalising the charge or lone pair') }, { text: t('Nuo molekulės masės', 'On the mass of the molecule') }, { text: t('Nuo tirpiklio spalvos', 'On the colour of the solvent') }],
                answer: 0,
                hint: t('Prisiminkite, kodėl benzilo katijonas stabilesnis už metilo.', 'Recall why the benzyl cation is more stable than methyl.'),
                solution: t('Kuo labiau krūvis ar laisvoji pora delokalizuota, tuo stabilesnė tarpinė dalelė ir tuo didesnė jos susidarymo tikimybė.', 'The more the charge or lone pair is delocalised, the more stable the intermediate and the more likely its formation.')
              }
            ],
            why: t('Reakcijos kelias eina per stabiliausius intermediatus, nes jų susidarymo barjeras mažiausias.', 'A reaction path goes through the most stable intermediates because the barrier to their formation is the lowest.'),
            src: 'T p30'
          },
          {
            id: 'u03.energy.6',
            q: [{ p: t('Protonui jungiantis prie propeno galimi du karbokatijonai.', 'Two carbocations are possible when a proton adds to propene.') }, { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
            steps: [
              {
                prompt: t('Kuris intermediatas susidaro lengviau?', 'Which intermediate forms more readily?'),
                kind: 'choice',
                options: [{ mol: { smi: 'C[CH+]C' } }, { mol: { smi: 'CC[CH2+]' } }],
                answer: 0,
                hint: t('Palyginkite karbokatijonų stabilumą pagal pakeistų atomų skaičių.', 'Compare the stability of the carbocations by the number of carbon substituents.'),
                solution: t('Antrinis karbokatijonas stabilesnis už pirminį, nes dvi alkilo grupės perduoda elektronų tankį centrui. Dinaminis veiksnys: susidaro stabilesnis tarpinis katijonas.', 'The secondary carbocation is more stable than the primary one because two alkyl groups pass electron density to the centre. Dynamic factor: the more stable intermediate cation forms.')
              }
            ],
            why: t('Reakcijos kryptį nulemia susidarančios tarpinės dalelės stabilumas; tai ir yra Markovnikovo taisyklės esmė.', 'The direction of a reaction is determined by the stability of the intermediate that forms; this is the essence of Markovnikov’s rule.'),
            src: 'L3 p18',
            claims: [{ react: ['ae.hx', ['CC=C'], { X: 'Br' }, 'CC(C)Br'] }]
          },
          {
            id: 'u03.energy.7',
            q: [{ p: t('Reakcija gali duoti du izomerinius produktus A ir B. A susidaro greičiau, o B yra stabilesnis.', 'A reaction can give two isomeric products, A and B. A forms faster while B is more stable.') }],
            steps: [
              {
                prompt: t('Suporuokite sąlygas su pagrindiniu produktu.', 'Pair each set of conditions with the main product.'),
                kind: 'match',
                answer: {
                  left: [{ text: t('Švelnios sąlygos (žema temperatūra, trumpas laikas)', 'Mild conditions (low temperature, short time)') }, { text: t('Griežtos sąlygos (aukšta temperatūra, ilgas laikas)', 'Harsh conditions (high temperature, long time)') }],
                  right: [{ text: t('A: greičiausiai susidarantis izomeras (kinetinė kontrolė)', 'A: the fastest-forming isomer (kinetic control)') }, { text: t('B: stabiliausias izomeras (termodinaminė kontrolė)', 'B: the most stable isomer (thermodynamic control)') }],
                  pairs: [0, 1]
                },
                hint: t('Pagalvokite, ar aukštoje temperatūroje ir per ilgą laiką sistema spėja pasiekti stabiliausią būseną.', 'Think about whether at high temperature and over a long time the system reaches its most stable state.'),
                solution: t('Švelniomis sąlygomis gaunamas greičiausiai susidarantis izomeras (kinetinės kontrolės produktas), griežtomis – termodinamiškai stabilesnis (termodinaminės kontrolės produktas).', 'Under mild conditions the fastest-forming isomer is obtained (kinetic control product), under harsh conditions the thermodynamically more stable one (thermodynamic control product).')
              }
            ],
            why: t('Greitis ir stabilumas nebūtinai sutampa: kinetika sprendžia, kuris produktas susidaro pirmiau, termodinamika – kuris išlieka.', 'Rate and stability do not necessarily coincide: kinetics decides which product forms first, thermodynamics which one remains.'),
            src: 'L3 p30'
          },
          {
            id: 'u03.energy.8',
            q: [{ p: t('Vadovėlyje rašoma, kad reakcijos mechanizmas yra hipotezė.', 'The textbook says that a reaction mechanism is a hypothesis.') }],
            steps: [
              {
                prompt: t('Ką tai reiškia?', 'What does this mean?'),
                kind: 'choice',
                options: [{ text: t('Mechanizmas yra siūlomas paaiškinimas eksperimentiniams faktams, kurį naujos žinios gali pakeisti.', 'A mechanism is a proposed explanation of experimental facts that new findings may change.') }, { text: t('Mechanizmas yra tiesiogiai stebimas faktas.', 'A mechanism is a directly observed fact.') }, { text: t('Mechanizmas yra gamtos dėsnis, kuris niekada nesikeičia.', 'A mechanism is a law of nature that never changes.') }],
                answer: 0,
                hint: t('Ar mes galime „pamatyti“ atskirų elektronų judėjimą reakcijoje?', 'Can we “see” the movement of single electrons in a reaction?'),
                solution: t('Mechanizmas aprašo reakcijos stadijas, bet jis tikrinamas pagal faktus (greitį, tarpinius produktus) ir gali būti patikslintas.', 'A mechanism describes the stages of a reaction, but it is tested against facts (rate, intermediates) and can be refined.')
              },
              {
                prompt: t('Kaip paprastai vyksta organinė reakcija?', 'How does an organic reaction usually proceed?'),
                kind: 'choice',
                options: [{ text: t('Vyksta kelios nuoseklios stadijos, kiekviena su savo aktyvacijos energija', 'It runs in several consecutive stages, each with its own activation energy') }, { text: t('Vyksta viena stadija, kurioje visi ryšiai pasikeičia iš karto', 'It runs in a single stage in which all bonds change at once') }, { text: t('Vyksta be tarpinių dalelių ir be energijos barjero', 'It runs without intermediates and without an energy barrier') }],
                answer: 0,
                hint: t('Dauguma organinių reakcijų turi intermediatų.', 'Most organic reactions have intermediates.'),
                solution: t('Dauguma organinių reakcijų yra daugiastadijės: kiekviena stadija turi savo $Ea$, o jungiantis intermediatai.', 'Most organic reactions are multistage: each stage has its own $Ea$ and intermediates link them.')
              }
            ],
            why: t('Mechanizmas yra modelis. Jis naudingas, nes leidžia numatyti produktus, kai žinome, kaip juda elektronai.', 'A mechanism is a model. It is useful because it lets us predict products once we know how the electrons move.'),
            src: 'L3 p18'
          },
          {
            id: 'u03.energy.9',
            q: [{ p: t('Reakcija vyksta, kai gali susidaryti mažesnės laisvosios energijos sistema.', 'A reaction takes place when a system of lower free energy can form.') }],
            steps: [
              {
                prompt: t('Kuris teiginys teisingas?', 'Which statement is correct?'),
                kind: 'choice',
                options: [{ text: t('Reakcija, kuri energetiškai palanki, vis tiek gali būti labai lėta, jei $Ea$ didelė.', 'An energetically favourable reaction can still be very slow if $Ea$ is large.') }, { text: t('Jei reakcija energetiškai palanki, ji būtinai greita.', 'If a reaction is energetically favourable it is necessarily fast.') }, { text: t('Greitis priklauso tik nuo pradinės ir galinės energijos skirtumo.', 'The rate depends only on the difference between the initial and final energy.') }],
                answer: 0,
                hint: t('Palyginkite, ką nusako energijų skirtumas ir ką nusako kalno aukštis.', 'Compare what the energy difference tells and what the height of the hill tells.'),
                solution: t('Energijų skirtumas nusako, ar reakcija galima, o $Ea$ – kaip greitai ji vyks. Tai du nepriklausomi dydžiai.', 'The energy difference tells whether a reaction is possible, and $Ea$ tells how fast it will go. These are two independent quantities.')
              }
            ],
            why: t('Termodinamika nusako kryptį, kinetika – greitį. Katalizatorius veikia tik kinetiką.', 'Thermodynamics tells the direction, kinetics the rate. A catalyst affects only the kinetics.'),
            src: 'L3 p18'
          }
        ]
      },
      /* ============ u03.species: radicals, carbocations, carbanions (generator) ============ */
      {
        id: 'u03.species',
        title: t('Radikalai, karbokatijonai ir karbanijonai', 'Radicals, carbocations and carbanions'),
        mirrors: [],
        gen(rng, ctx) {
          const sk = ctx.pick(SKEL);
          const kind = ctx.pick(['cation', 'radical', 'anion']);
          const sp = species(sk, kind);
          const sub = precursor(sk, kind === 'anion' ? null : 'Br');
          const KIND = {
            cation: { lt: 'karbokatijonas', en: 'carbocation', idx: 0 },
            radical: { lt: 'radikalas', en: 'radical', idx: 1 },
            anion: { lt: 'karbanijonas', en: 'carbanion', idx: 2 }
          }[kind];
          const desc = {
            cation: t('Ryšys $C−Br$ skyla heterolizės būdu: abu ryšio elektronai lieka prie brono. Kokia dalelė susidaro iš anglies fragmento?', 'The bond $C−Br$ breaks heterolytically: both bonding electrons stay on bromine. Which particle forms from the carbon fragment?'),
            radical: t('Ryšys $C−Br$ skyla homolizės būdu: prie kiekvieno atomo lieka po vieną elektroną. Kokia dalelė susidaro iš anglies fragmento?', 'The bond $C−Br$ breaks homolytically: one electron stays on each atom. Which particle forms from the carbon fragment?'),
            anion: t('Paryškintos anglies $C−H$ ryšys skyla taip, kad abu elektronai lieka prie anglies (vandenilis išeina be elektronų). Kokia dalelė susidaro iš anglies fragmento?', 'A $C−H$ bond of the highlighted carbon breaks so that both electrons stay on carbon (hydrogen leaves without electrons). Which particle forms from the carbon fragment?')
          }[kind];
          const sMol = (extra) => ({ smi: sp.smi, opts: Object.assign({ numbers: 'all' }, extra || {}) });
          const opts = [species(sk, 'cation'), species(sk, 'radical'), species(sk, 'anion')].map((x) => ({ mol: { smi: x.smi } }));
          const clsLT = CLASS_NAMES[sk.cls].lt, clsEN = CLASS_NAMES[sk.cls].en;
          const clsOpts = CLASS_NAMES.map((c) => ({ text: t(c.lt, c.en) }));
          return {
            q: [{ p: desc }, { mol: { smi: sub, opts: Object.assign({ numbers: 'all' }, kind === 'anion' ? { highlight: { atoms: [sp.centre], tone: 2 } } : {}) } }],
            steps: [
              {
                prompt: t('Kokia dalelė susidaro?', 'Which particle forms?'),
                kind: 'choice', options: opts, answer: KIND.idx,
                hint: t('Suskaičiuokite, kiek elektronų lieka prie anglies atomo: vienas nesuporuotas, nei vieno ar pora?', 'Count how many electrons stay on the carbon atom: one unpaired, none, or a pair?'),
                solution: kind === 'cation'
                  ? t('Anglis netenka abiejų ryšio elektronų: lieka elektronų sekstetas ir tuščia $p$ orbitalė. Tai karbokatijonas.', 'Carbon loses both bonding electrons: an electron sextet and an empty $p$ orbital remain. This is a carbocation.')
                  : kind === 'radical'
                    ? t('Prie anglies lieka vienas ryšio elektronas, kuris tampa nesuporuotas. Tai radikalas.', 'One bonding electron stays on carbon and becomes unpaired. This is a radical.')
                    : t('Prie anglies lieka abu elektronai kaip laisvoji pora: tai karbanijonas.', 'Both electrons stay on carbon as a lone pair: this is a carbanion.')
              },
              {
                prompt: t('Bakstelėkite atomą, turintį krūvį ar nesuporuotą elektroną.', 'Tap the atom that carries the charge or the unpaired electron.'),
                kind: 'atoms', mol: sMol(), answer: [sp.centre],
                hint: t('Ieškokite anglies atomo, kuris turi tik tris ryšius (kartu su vandeniliais) arba kitokį nei įprasta elektronų skaičių.', 'Look for the carbon atom that has only three bonds (counting hydrogens) or an unusual number of electrons.'),
                solution: t('Centras yra anglis Nr. ' + (sp.centre + 1) + '.', 'The centre is carbon no. ' + (sp.centre + 1) + '.')
              },
              {
                prompt: t('Kokio tipo yra šis anglies centras?', 'What type of carbon centre is this?'),
                kind: 'choice', options: clsOpts, answer: sk.cls,
                hint: t('Suskaičiuokite, kiek anglies atomų prijungta prie centro, ir ar šalia yra $C=C$ arba benzeno žiedas.', 'Count how many carbon atoms are attached to the centre, and whether a $C=C$ or a benzene ring is next to it.'),
                solution: t('Tai ' + clsLT + ' centras.' + (sk.cls === 4 ? ' Jis šalia $C=C$, todėl krūvis ar nesuporuotas elektronas delokalizuojasi.' : sk.cls === 5 ? ' Jis šalia benzeno žiedo, todėl krūvis ar nesuporuotas elektronas delokalizuojasi.' : sk.cls === 1 && /c1ccccc1C\{c\}/.test(sk.t) ? ' Tarp centro ir žiedo yra $CH2$, todėl tai ne benzilo centras.' : ''), 'It is a ' + clsEN + ' centre.' + (sk.cls === 4 ? ' It is next to a $C=C$, so the charge or unpaired electron is delocalised.' : sk.cls === 5 ? ' It is next to a benzene ring, so the charge or unpaired electron is delocalised.' : sk.cls === 1 && /c1ccccc1C\{c\}/.test(sk.t) ? ' A $CH2$ lies between the centre and the ring, so this is not a benzylic centre.' : ''))
              },
              {
                prompt: t('Kokiu reagentu ši dalelė gali būti reakcijoje?', 'What kind of reagent can this particle be in a reaction?'),
                kind: 'choice',
                options: [{ text: t('Elektrofilas', 'Electrophile') }, { text: t('Laisvasis radikalas', 'Free radical') }, { text: t('Nukleofilas', 'Nucleophile') }],
                answer: kind === 'cation' ? 0 : kind === 'radical' ? 1 : 2,
                hint: t('Ar dalelė gali priimti elektronų porą, duoti ją, ar turi nesuporuotą elektroną?', 'Can the particle accept an electron pair, give one, or does it have an unpaired electron?'),
                solution: kind === 'cation'
                  ? t('Karbokatijonas turi tuščią orbitalę ir priima elektronų porą: elektrofilas.', 'A carbocation has an empty orbital and accepts an electron pair: an electrophile.')
                  : kind === 'radical'
                    ? t('Radikalas turi nesuporuotą elektroną ir veikia homolizinėse reakcijose: laisvasis radikalas.', 'A radical has an unpaired electron and acts in homolytic reactions: a free radical.')
                    : t('Karbanijonas turi laisvąją porą ir ją atiduoda: nukleofilas.', 'A carbanion has a lone pair and gives it away: a nucleophile.')
              }
            ],
            why: t('Ryšio skilimo būdas nulemia dalelę: heterolizė, kai elektronai lieka prie elektrinės neigiamesnio atomo, duoda karbokatijoną arba karbanijoną, o homolizė – radikalą. Centro tipas (alilo, benzilo, tretinis…) nulemia jo stabilumą.', 'The way the bond breaks decides the particle: heterolysis gives a carbocation or a carbanion depending on which atom keeps the electrons, homolysis gives a radical. The type of the centre (allylic, benzylic, tertiary…) decides its stability.'),
            src: 'L3 p21'
          };
        }
      },
      /* ============ u03.stab: stability of carbocations, radicals and carbanions (generator) ============ */
      {
        id: 'u03.stab',
        title: t('Karbokatijonų, radikalų ir karbanijonų stabilumas', 'Stability of carbocations, radicals and carbanions'),
        mirrors: [],
        gen(rng, ctx) {
          const kind = ctx.pick(['cation', 'radical', 'anion']);
          const cls = ctx.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3);
          // course order for cations and radicals: benzyl > allyl > tertiary > secondary > primary > methyl (L7 p9, L6 p16);
          // carbanions: delocalised ones first, then methyl > primary > secondary > tertiary (alkyl groups destabilise)
          const score = (c) => (kind === 'anion' ? { 5: 5, 4: 4, 0: 3, 1: 2, 2: 1, 3: 0 }[c] : c);
          cls.sort((a, b) => score(b) - score(a));
          const picks = cls.map((c) => ctx.pick(SKEL.filter((s) => s.cls === c)));
          const mols = picks.map((sk) => species(sk, kind).smi);
          const KN = { cation: t('karbokatijonų', 'carbocations'), radical: t('radikalų', 'radicals'), anion: t('karbanijonų', 'carbanions') }[kind];
          const hasConj = cls.some((c) => c >= 4);
          const names = cls.map((c) => CLASS_NAMES[c]);
          const orderLT = names.map((n) => n.lt).join(' > ');
          const orderEN = names.map((n) => n.en).join(' > ');

          const R = {
            alkylUp: t('Alkilo grupės perduoda elektronų tankį centrui (+I, hiperkonjugacija), todėl kuo jų daugiau, tuo stabilesnė dalelė.', 'Alkyl groups pass electron density to the centre (+I, hyperconjugation), so the more of them, the more stable the particle.'),
            alkylDown: t('Alkilo grupės didina elektronų tankį centre ir destabilizuoja anijoną, todėl kuo jų daugiau, tuo mažiau stabili dalelė.', 'Alkyl groups raise the electron density at the centre and destabilise the anion, so the more of them, the less stable the particle.'),
            deloc: t('Pagrindinis veiksnys – krūvio ar nesuporuoto elektrono delokalizacija konjuguotoje sistemoje (alilo, benzilo); alkilų elektronų donoriškumas stabilumą didina papildomai.', 'The main factor is the delocalisation of the charge or unpaired electron in a conjugated system (allylic, benzylic); the electron-donating effect of alkyl groups adds to it.'),
            delocAn: t('Delokalizacija stabilizuoja alilo ir benzilo anijonus, o alkilo grupės (elektronų donorai) anijoną destabilizuoja.', 'Delocalisation stabilises allyl and benzyl anions, while alkyl groups (electron donors) destabilise an anion.'),
            wrong1: t('Alkilo grupės traukia elektronus iš centro (−I) ir taip jį stabilizuoja.', 'Alkyl groups pull electrons out of the centre (−I) and so stabilise it.'),
            wrong2: t('Stabilumą lemia tik anglies atomų skaičius dalelėje.', 'Stability is decided only by the number of carbon atoms in the particle.'),
            wrong3: t('Konjugacija stabilumo nekeičia, lemia tik alkilo grupių skaičius.', 'Conjugation does not change stability, only the number of alkyl groups does.')
          };
          let right, wrongs;
          if (kind === 'anion') { right = hasConj ? R.delocAn : R.alkylDown; wrongs = hasConj ? [R.alkylUp, R.wrong2, R.wrong3] : [R.alkylUp, R.deloc, R.wrong2]; }
          else { right = hasConj ? R.deloc : R.alkylUp; wrongs = hasConj ? [R.wrong1, R.wrong2, R.wrong3] : [R.wrong1, R.deloc, R.wrong2]; }
          const optsText = [right].concat(wrongs).map((x) => ({ text: x }));

          return {
            q: [{ p: t('Palyginkite šių ' + KN.lt + ' stabilumą.', 'Compare the stability of these ' + KN.en + '.') }, { mol: mols.map((smi) => ({ smi })) }],
            steps: [
              {
                prompt: t('Išdėstykite daleles nuo stabiliausios iki mažiausiai stabilios.', 'Put the particles in order from the most stable to the least stable.'),
                kind: 'order',
                options: mols.map((smi) => ({ mol: { smi } })),
                hint: t('Kiek alkilo grupių prijungta prie kiekvieno centro ir ar šalia yra $C=C$ ar benzeno žiedas, su kuriuo galima delokalizacija?', 'How many alkyl groups are attached to each centre, and is there a $C=C$ or benzene ring next to it that allows delocalisation?'),
                solution: t('Eilė: ' + orderLT + '.', 'Order: ' + orderEN + '.')
              },
              {
                prompt: t('Kuo grindžiama ši eilė?', 'What is this order based on?'),
                kind: 'choice', options: optsText, answer: 0,
                hint: kind === 'anion'
                  ? t('Pagalvokite, ką alkilo grupės daro su elektronų tankiu centre, kai centras jau turi laisvąją porą.', 'Think about what alkyl groups do to the electron density at a centre that already has a lone pair.')
                  : t('Palyginkite, kas padeda centrui, kuriam trūksta elektronų ar kuris turi nesuporuotą elektroną: elektronų tankio tiekimas ar jo sklaida.', 'Compare what helps a centre that is short of electrons or has an unpaired one: a supply of electron density or its spreading out.'),
                solution: kind === 'anion'
                  ? t('Anijonui elektronų daugiau nereikia: alkilų +I jį destabilizuoja, todėl metilo anijonas stabilesnis už tretinį. Delokalizacija (alilo, benzilo) krūvį išskaido ir stabilizuoja.', 'An anion needs no more electrons: the +I of alkyl groups destabilises it, so the methyl anion is more stable than the tertiary one. Delocalisation (allylic, benzylic) spreads the charge and stabilises.')
                  : t('Elektronų trūkstančiam centrui padeda elektronų tankis iš alkilų (+I, hiperkonjugacija) ir krūvio sklaida per konjuguotąją sistemą (alilo, benzilo).', 'A centre short of electrons is helped by electron density from alkyl groups (+I, hyperconjugation) and by spreading the charge over a conjugated system (allylic, benzylic).')
              }
            ],
            why: kind === 'anion'
              ? t('Karbanijono stabilumą didina krūvio delokalizacija, o alkilų +I jį mažina. Todėl alkilų eilė atvirkštinė, nei karbokatijonų.', 'The stability of a carbanion is raised by delocalisation of the charge and lowered by the +I of alkyl groups. That is why the order for alkyl groups is the reverse of that for carbocations.')
              : t('Karbokatijonų ir radikalų stabilumas didėja: metilo < pirminis < antrinis < tretinis < alilo < benzilo. Stabilesnė tarpinė dalelė susidaro lengviau, todėl šioje eilėje paaiškinama reakcijų kryptis.', 'The stability of carbocations and radicals grows: methyl < primary < secondary < tertiary < allylic < benzylic. A more stable intermediate forms more readily, so this order explains the direction of reactions.'),
            src: kind === 'anion' ? 'Klein' : 'L7 p9'
          };
        }
      },
      /* ============ u03.cleave: homolytic, heterolytic and synchronous reactions (bank) ============ */
      {
        id: 'u03.cleave',
        title: t('Heterolizė, homolizė ir sinchroninės reakcijos', 'Heterolysis, homolysis and synchronous reactions'),
        mirrors: [],
        bank: [
          {
            id: 'u03.cleave.1',
            q: [{ p: t('Chloro molekulė apšviečiama ultravioletine šviesa ir skyla.', 'A chlorine molecule is irradiated with ultraviolet light and splits.') }, { scheme: { items: [{ smi: 'ClCl' }, { arrow: '→', above: f('hν') }] } }],
            steps: [
              {
                prompt: t('Kokio pobūdžio ryšio skilimas vyksta?', 'What kind of bond cleavage takes place?'),
                kind: 'choice',
                options: [{ text: t('Homolizinis: elektronų pora dalijasi per pusę', 'Homolytic: the electron pair is shared out equally') }, { text: t('Heterolizinis: abu elektronai lieka prie vieno atomo', 'Heterolytic: both electrons stay on one atom') }, { text: t('Sinchroninis: kartu susidaro naujas ryšys', 'Synchronous: a new bond forms at the same time') }],
                answer: 0,
                hint: t('Abu atomai vienodi, todėl nė vienas nepatraukia ryšio elektronų stipriau už kitą.', 'Both atoms are identical, so neither pulls the bonding electrons harder than the other.'),
                solution: t('Ryšys $Cl−Cl$ nepolinis, o energiją suteikia šviesa, todėl ryšys skyla simetriškai (homolizė).', 'The $Cl−Cl$ bond is nonpolar and the energy comes from light, so the bond breaks symmetrically (homolysis).')
              },
              {
                prompt: t('Kokios dalelės susidaro?', 'Which particles form?'),
                kind: 'choice',
                options: [pairOpt('[Cl]', '[Cl]'), pairOpt('[Cl+]', '[Cl-]'), pairOpt('[Cl-]', '[Cl-]')],
                answer: 0,
                hint: t('Po homolizės kiekvienas atomas pasilieka po vieną elektroną.', 'After homolysis each atom keeps one electron.'),
                solution: [{ p: t('Susidaro du chloro atomai su nesuporuotais elektronais (radikalai). Jų neišlaikytų ryšio pora vaizduojama dviem pusinėmis rodyklėmis.', 'Two chlorine atoms with unpaired electrons form (radicals). Their bonding pair is shown with two half-headed arrows.') }, {
                  mech: [{ scheme: { items: [{ smi: 'ClCl' }, { arrow: '→' }, { smi: '[Cl]' }, { plus: true }, { smi: '[Cl]' }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }] }]
                }]
              }
            ],
            why: t('Nepolinis ryšys, šviesa ar aukšta temperatūra yra homolizės požymiai: susidaro radikalai.', 'A nonpolar bond, light or high temperature point to homolysis: radicals form.'),
            src: 'L3 p21'
          },
          {
            id: 'u03.cleave.2',
            q: [{ p: t('Metilbromido ryšys $C−Br$ skyla heterolizės būdu.', 'The $C−Br$ bond of methyl bromide breaks heterolytically.') }, { mol: { smi: 'CBr', opts: { numbers: 'all', deltas: { 0: '+', 1: '-' } } } }],
            steps: [
              {
                prompt: t('Kuris atomas pasiima abu ryšio elektronus?', 'Which atom takes both bonding electrons?'),
                kind: 'atoms', mol: { smi: 'CBr', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Elektronai juda link didesnio elektrinio neigiamumo atomo.', 'The electrons move towards the atom of higher electronegativity.'),
                solution: t('Bromas (Nr. 2) elektrinis neigiamesnis už anglį (Nr. 1), todėl pasiima porą ir tampa $Br-$.', 'Bromine (no. 2) is more electronegative than carbon (no. 1), so it takes the pair and becomes $Br-$.')
              },
              {
                prompt: t('Kokie jonai susidaro?', 'Which ions form?'),
                kind: 'choice',
                options: [pairOpt('[CH3+]', '[Br-]'), pairOpt('[CH3-]', '[Br+]'), pairOpt('[CH3]', '[Br]')],
                answer: 0,
                hint: t('Kuris atomas lieka su elektronų trūkumu?', 'Which atom is left short of electrons?'),
                solution: [{ p: t('Anglis netenka elektronų poros ir tampa karbokatijonu, bromas gauna ją ir tampa bromido anijonu.', 'Carbon loses the electron pair and becomes a carbocation, bromine gains it and becomes a bromide anion.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CBr' }, { arrow: '→' }, { smi: '[CH3+]' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 } }] }]
                }]
              }
            ],
            why: t('Heterolizėje elektronai lieka prie elektrinio neigiamesnio atomo: halogenalkanuose susidaro karbokatijonas ir halogenido anijonas.', 'In heterolysis the electrons stay on the more electronegative atom: haloalkanes give a carbocation and a halide anion.'),
            src: 'L3 p21',
            claims: [{ formula: ['CBr', 'CH3Br'] }]
          },
          {
            id: 'u03.cleave.3',
            q: [{ p: t('Vandenilio peroksidas kaitinamas: silpnas ryšys $O−O$ skyla.', 'Hydrogen peroxide is heated: the weak $O−O$ bond breaks.') }, { scheme: { items: [{ smi: 'OO' }, { arrow: '→', above: f('t°') }] } }],
            steps: [
              {
                prompt: t('Kokios dalelės susidaro?', 'Which particles form?'),
                kind: 'choice',
                options: [pairOpt('[OH]', '[OH]'), pairOpt('[H]', '[O]O'), pairOpt('O', '[O]')],
                answer: 0,
                hint: t('Kuris ryšys silpnas ir nepolinis: $O−O$ ar $O−H$? Koks skilimo pobūdis tada labiausiai tikėtinas?', 'Which bond is weak and nonpolar, $O−O$ or $O−H$? Which kind of cleavage is then most likely?'),
                solution: t('Nepolinis ryšys skyla homolizės būdu: susidaro du hidroksilo radikalai $HO•$.', 'A nonpolar bond breaks homolytically: two hydroxyl radicals $HO•$ form.')
              },
              {
                prompt: t('Kokio tipo reagentai tai yra tolesnėse reakcijose?', 'What kind of reagent are these in later reactions?'),
                kind: 'choice',
                options: [{ text: t('Laisvieji radikalai', 'Free radicals') }, { text: t('Elektrofilai', 'Electrophiles') }, { text: t('Nukleofilai', 'Nucleophiles') }],
                answer: 0,
                hint: t('Ar dalelė turi krūvį, laisvąją porą ar nesuporuotą elektroną?', 'Does the particle have a charge, a lone pair or an unpaired electron?'),
                solution: t('Hidroksilo radikalas turi nesuporuotą elektroną ir yra homolizinių reakcijų reagentas.', 'The hydroxyl radical has an unpaired electron and is a reagent of homolytic reactions.')
              }
            ],
            why: t('Silpnas, mažai polinis ryšys šildant skyla homolitiškai ir duoda radikalus, kurie inicijuoja grandines reakcijas.', 'A weak, hardly polar bond breaks homolytically on heating and gives radicals that start chain reactions.'),
            src: 'L3 p31',
            claims: [{ formula: ['OO', 'H2O2'] }]
          },
          {
            id: 'u03.cleave.4',
            q: [{ p: t('2-Brom-2-metilpropanas ištirpsta vandenyje ir praranda bromo atomą.', '2-Bromo-2-methylpropane dissolves in water and loses its bromine.') }, { mol: { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane') } }],
            steps: [
              {
                prompt: t('Kokios dalelės susidaro pirmoje stadijoje?', 'Which particles form in the first stage?'),
                kind: 'choice',
                options: [pairOpt('C[C+](C)C', '[Br-]'), pairOpt('C[C-](C)C', '[Br+]'), pairOpt('C[C](C)C', '[Br]')],
                answer: 0,
                hint: t('Poliniame tirpiklyje vyksta jonizacija, o ne radikalų susidarymas.', 'A polar solvent causes ionisation, not formation of radicals.'),
                solution: t('Polinis tirpiklis stabilizuoja jonus, todėl ryšys skyla heterolizės būdu: susidaro tretinis karbokatijonas ir bromido anijonas.', 'A polar solvent stabilises ions, so the bond breaks heterolytically: a tertiary carbocation and a bromide anion form.')
              },
              {
                prompt: t('Kodėl heterolizė čia palanki?', 'Why is heterolysis favourable here?'),
                kind: 'choice',
                options: [{ text: t('Susidaro stabilus tretinis karbokatijonas, o polinis tirpiklis solvatuoja jonus.', 'A stable tertiary carbocation forms and the polar solvent solvates the ions.') }, { text: t('Vandenyje daug laisvųjų radikalų.', 'Water contains many free radicals.') }, { text: t('Ryšys $C−Br$ nepolinis.', 'The $C−Br$ bond is nonpolar.') }],
                answer: 0,
                hint: t('Prisiminkite, kokie veiksniai stabilizuoja katijoną ir jonus tirpale.', 'Recall which factors stabilise a cation and ions in solution.'),
                solution: t('Heterolizinės reakcijos vyksta poliniuose, jonizuojančiuose tirpikliuose, o tretinis katijonas yra stabilus dėl trijų alkilo grupių.', 'Heterolytic reactions take place in polar, ionising solvents, and a tertiary cation is stable because of its three alkyl groups.')
              }
            ],
            why: t('Heterolizę skatina poliniai ryšiai, jonizuojantis tirpiklis ir stabilus karbokatijonas.', 'Heterolysis is favoured by polar bonds, an ionising solvent and a stable carbocation.'),
            src: 'T p31',
            claims: [{ name: ['CC(C)(C)Br', t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane')] }]
          },
          {
            id: 'u03.cleave.5',
            q: [{ p: t('Etanas labai aukštoje temperatūroje dujų fazėje skyla pagal ryšį $C−C$.', 'Ethane in the gas phase at a very high temperature splits at its $C−C$ bond.') }, { scheme: { items: [{ smi: 'CC' }, { arrow: '→', above: f('t°') }] } }],
            steps: [
              {
                prompt: t('Kokios dalelės susidaro?', 'Which particles form?'),
                kind: 'choice',
                options: [pairOpt('[CH3]', '[CH3]'), pairOpt('[CH3+]', '[CH3-]'), pairOpt('[CH3-]', '[CH3-]')],
                answer: 0,
                hint: t('Dujų fazėje jonų beveik nebūna, o du metilo fragmentai identiški.', 'Ions hardly occur in the gas phase and the two methyl fragments are identical.'),
                solution: t('Abu fragmentai vienodi ir nepoliniai: skilimas homolizinis, susidaro du metilo radikalai.', 'Both fragments are identical and nonpolar: the cleavage is homolytic and two methyl radicals form.')
              }
            ],
            why: t('Dujų fazėje ir aukštoje temperatūroje vyksta homolizinės reakcijos, nes jonų tokiomis sąlygomis beveik nebūna.', 'In the gas phase and at high temperature homolytic reactions take place because ions hardly occur under such conditions.'),
            src: 'T p31'
          },
          {
            id: 'u03.cleave.6',
            q: [{ p: t('Trys procesai parašyti reakcijų lygtimis.', 'Three processes are written as equations.') }],
            steps: [
              {
                prompt: t('Suporuokite kiekvieną procesą su jo klase.', 'Pair each process with its class.'),
                kind: 'match',
                answer: {
                  left: [
                    { scheme: { items: [{ smi: 'ClCl' }, { arrow: '→', above: f('hν') }, { smi: '[Cl]' }, { plus: true }, { smi: '[Cl]' }] } },
                    { scheme: { items: [{ smi: '[OH-]' }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[I-]' }] } },
                    { scheme: { items: [{ smi: 'C=CC=C' }, { plus: true }, { smi: 'C=C' }, { arrow: '→', above: f('t°') }, { smi: 'C1=CCCCC1' }] } }
                  ],
                  right: [{ text: t('homolizinė', 'homolytic') }, { text: t('heterolizinė (joninė)', 'heterolytic (ionic)') }, { text: t('sinchroninė', 'synchronous') }],
                  pairs: [0, 1, 2]
                },
                hint: t('Ieškokite, kur reagentai yra radikalai, kur nukleofilas ir polinis ryšys, o kur nėra nei vieno iš jų ir ciklas susidaro vienoje stadijoje.', 'Look for where the reagents are radicals, where there is a nucleophile and a polar bond, and where there is neither and a ring forms in a single stage.'),
                solution: t('Pirmuoju atveju susidaro radikalai (homolizė). Antruoju elektronų pora iš $HO-$ pereina prie anglies, o $C−I$ elektronai pereina jodui: tai heterolizinė (joninė) reakcija. Trečiuoju visi ryšiai susidaro ir nutrūksta vienu metu ciklinėje pereinamojoje būsenoje, be jonų ir radikalų: sinchroninė.', 'In the first case radicals form (homolysis). In the second an electron pair moves from $HO-$ to carbon and the $C−I$ electrons move to iodine: this is a heterolytic (ionic) reaction. In the third all bonds form and break at the same time in a cyclic transition state, with no ions or radicals: synchronous.')
              }
            ],
            why: t('Klasę nusako tai, kaip persitvarko elektronai: po vieną (radikalai), poromis į vieną atomą (jonai) arba visi vienu metu be tarpinių dalelių.', 'The class is set by how the electrons rearrange: one each (radicals), as a pair to one atom (ions) or all at the same time without intermediates.'),
            src: 'L3 p21'
          },
          {
            id: 'u03.cleave.7',
            q: [{ p: t('Norima, kad ryšys skiltų homolitiškai.', 'A bond is meant to break homolytically.') }],
            steps: [
              {
                prompt: t('Pažymėkite sąlygas, kurios palankios homolizei.', 'Pick the conditions that favour homolysis.'),
                kind: 'multi',
                options: [
                  { text: t('Ultravioletinė šviesa', 'Ultraviolet light') },
                  { text: t('Aukšta temperatūra', 'High temperature') },
                  { text: t('Dujų fazė', 'Gas phase') },
                  { text: t('Stipriai rūgšti terpė', 'A strongly acidic medium') },
                  { text: t('Polinis jonizuojantis tirpiklis', 'A polar ionising solvent') }
                ],
                answer: [0, 1, 2],
                hint: t('Heterolizei reikia polinės terpės, kuri stabilizuoja jonus.', 'Heterolysis needs a polar medium that stabilises ions.'),
                solution: t('Šviesa, aukšta temperatūra ir dujų fazė palankios radikalams. Rūgšti terpė ir polinis tirpiklis skatina jonines (heterolizines) reakcijas.', 'Light, high temperature and the gas phase favour radicals. An acidic medium and a polar solvent promote ionic (heterolytic) reactions.')
              }
            ],
            why: t('Homolizinės reakcijos vyksta ir dujose, ir skystyje, dažnai grandininiu mechanizmu, o heterolizinės – daugiausia skystoje fazėje poliniuose tirpikliuose.', 'Homolytic reactions occur in gas and in liquid, often by a chain mechanism, while heterolytic ones occur mainly in the liquid phase in polar solvents.'),
            src: 'T p31'
          },
          {
            id: 'u03.cleave.8',
            q: [{ p: t('Rodyklių rūšis rodo, kaip juda elektronai.', 'The kind of arrow shows how electrons move.') }, { mol: { smi: 'ClCl' } }],
            steps: [
              {
                prompt: t('Kaip pavaizduoti $Cl−Cl$ ryšio homolizę?', 'How is the homolysis of the $Cl−Cl$ bond drawn?'),
                kind: 'choice',
                options: [
                  { text: t('Dvi pusinės rodyklės nuo ryšio prie kiekvieno atomo.', 'Two half-headed arrows from the bond, one to each atom.') },
                  { text: t('Viena pilna rodyklė nuo ryšio prie vieno atomo.', 'One full-headed arrow from the bond to one atom.') },
                  { text: t('Dvi pilnos rodyklės nuo ryšio prie abiejų atomų.', 'Two full-headed arrows from the bond to both atoms.') },
                  { text: t('Pilna rodyklė nuo atomo prie ryšio.', 'A full-headed arrow from an atom to the bond.') }
                ],
                answer: 0,
                hint: t('Kiek elektronų juda kiekvienu atveju: pora ar po vieną?', 'How many electrons move in each case: a pair or one each?'),
                solution: [{ p: t('Pusinė (kabliuko) rodyklė rodo vieno elektrono judėjimą, todėl homolizei reikia dviejų.', 'A half-headed (fish-hook) arrow shows the movement of one electron, so homolysis needs two.') }, {
                  mech: [{ scheme: { items: [{ smi: 'ClCl' }, { arrow: '→' }, { smi: '[Cl]' }, { plus: true }, { smi: '[Cl]' }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }] }]
                }]
              },
              {
                prompt: t('Kokia rodyklė vaizduoja $HBr$ heterolizę, kai bromas pasiima porą?', 'Which arrow shows the heterolysis of $HBr$ in which bromine takes the pair?'),
                kind: 'choice',
                options: [
                  { text: t('Viena pilna rodyklė nuo $H−Br$ ryšio prie bromo.', 'One full-headed arrow from the $H−Br$ bond to bromine.') },
                  { text: t('Viena pilna rodyklė nuo $H−Br$ ryšio prie vandenilio.', 'One full-headed arrow from the $H−Br$ bond to hydrogen.') },
                  { text: t('Dvi pusinės rodyklės nuo ryšio prie abiejų atomų.', 'Two half-headed arrows from the bond to both atoms.') }
                ],
                answer: 0,
                hint: t('Pilna rodyklė rodo, kur nueina visa elektronų pora.', 'A full-headed arrow shows where the whole electron pair goes.'),
                solution: t('Visa pora juda prie elektrinės neigiamesnio atomo – bromo, todėl rodyklės smaigalys nukreiptas į bromą.', 'The whole pair moves to the more electronegative atom, bromine, so the arrowhead points to bromine.')
              }
            ],
            why: t('Rodyklės rūšis yra kodas: pilna rodyklė – elektronų pora (jonai), pusinė – vienas elektronas (radikalai).', 'The kind of arrow is a code: a full-headed arrow means an electron pair (ions), a half-headed arrow one electron (radicals).'),
            src: 'L3 p21'
          },
          {
            id: 'u03.cleave.9',
            q: [{ p: t('Yra reakcijų, kuriose ryšiai nutrūksta ir susidaro vienu metu.', 'There are reactions in which bonds break and form at the same time.') }],
            steps: [
              {
                prompt: t('Kuris teiginys apibūdina sinchroninę reakciją?', 'Which statement describes a synchronous reaction?'),
                kind: 'choice',
                options: [
                  { text: t('Visi ryšiai nutrūksta ir susidaro vienu metu, o jonų ir radikalų neatsiranda.', 'All bonds break and form at the same time, and no ions or radicals appear.') },
                  { text: t('Reakcija vyksta tik dujų fazėje ir yra grandininė.', 'The reaction takes place only in the gas phase and is a chain reaction.') },
                  { text: t('Susidaro karbokatijonas, o po to nukleofilas.', 'A carbocation forms and then a nucleophile.') },
                  { text: t('Vienas atomas pasiima abu ryšio elektronus.', 'One atom takes both bonding electrons.') }
                ],
                answer: 0,
                hint: t('Pavadinime esantis žodis nusako laiką.', 'The word in its name refers to time.'),
                solution: t('Sinchroninėje reakcijoje tarpinių dalelių nėra, todėl reagento ir substrato sąvokos prasmės neturi.', 'In a synchronous reaction there are no intermediates, so the ideas of reagent and substrate make no sense.')
              }
            ],
            why: t('Sinchroninės reakcijos yra trečioji klasė šalia heterolizinių ir homolizinių. Jose nėra nei jonų, nei radikalų.', 'Synchronous reactions are the third class beside heterolytic and homolytic ones. They have neither ions nor radicals.'),
            src: 'L3 p21'
          }
        ]
      },
      /* ============ u03.nuel: electrophiles and nucleophiles (generator + bank) ============ */
      {
        id: 'u03.nuel',
        title: t('Elektrofilai ir nukleofilai', 'Electrophiles and nucleophiles'),
        mirrors: ['S2.7'],
        gen(rng, ctx) {
          // atoms: the atom(s) through which the particle gives (nucleophile) or accepts (electrophile) the electron pair
          const E = [
            { smi: 'O=[N+]=O', atoms: [1] }, { smi: 'C[C+]=O', atoms: [1] }, { smi: 'O=S(=O)=O', atoms: [1] }, { smi: 'FB(F)F', atoms: [1] },
            { smi: '[H+]', atoms: [0] }, { smi: '[Br+]', atoms: [0] }, { smi: '[Cl+]', atoms: [0] }, { smi: 'C[CH2+]', atoms: [1] }, { smi: 'C[C+](C)C', atoms: [1] },
            { smi: 'CBr', atoms: [0] }, { smi: 'CI', atoms: [0] }, { smi: 'CC(=O)Cl', atoms: [1] }, { smi: 'C=O', atoms: [0] }, { smi: 'CC=O', atoms: [1] }, { smi: 'CC(C)=O', atoms: [1] }
          ];
          const N = [
            { smi: '[C-]#N', atoms: [0] }, { smi: 'CO', atoms: [1] }, { smi: 'O', atoms: [0] }, { smi: 'CN', atoms: [1] }, { smi: 'N', atoms: [0] }, { smi: 'CS', atoms: [1] },
            { smi: '[OH-]', atoms: [0] }, { smi: 'C[O-]', atoms: [1] }, { smi: '[SH-]', atoms: [0] }, { smi: '[Cl-]', atoms: [0] }, { smi: '[Br-]', atoms: [0] },
            { smi: 'CC(=O)[O-]', atoms: [2, 3] }, { smi: 'CN(C)C', atoms: [1] }, { smi: 'COC', atoms: [1] }, { smi: '[NH2-]', atoms: [0] }, { smi: '[CH3-]', atoms: [0] }, { smi: '[H-]', atoms: [0] }
          ];
          if (rng() < 0.4) {
            // which of the listed particles are electrophiles
            const ne = ctx.int(1, 3);
            const pe = ctx.shuffle(E.slice()).slice(0, ne), pn = ctx.shuffle(N.slice()).slice(0, 5 - ne);
            const all = ctx.shuffle(pe.concat(pn));
            const right = all.map((x, i) => (E.includes(x) ? i : -1)).filter((i) => i >= 0);
            return {
              q: [{ p: t('Pateiktos penkios dalelės.', 'Five particles are given.') }],
              steps: [{
                prompt: t('Pažymėkite visas daleles, kurios reaguodamos elgiasi kaip elektrofilai.', 'Pick all the particles that behave as electrophiles in a reaction.'),
                kind: 'multi', options: all.map((x) => ({ mol: { smi: x.smi } })), answer: right,
                hint: t('Elektrofilas priima elektronų porą: ieškokite krūvio $+$, tuščios orbitalės ar $δ+$ atomo. Nukleofilas turi laisvąją porą.', 'An electrophile accepts an electron pair: look for a $+$ charge, an empty orbital or a $δ+$ atom. A nucleophile has a lone pair.'),
                solution: t('Elektrofilų yra ' + right.length + ': jie turi tuščią orbitalę, teigiamą krūvį ar $δ+$ centrą. Likusios dalelės turi laisvąsias poras ir yra nukleofilai.', 'There ' + (right.length === 1 ? 'is 1 electrophile' : 'are ' + right.length + ' electrophiles') + ': each has an empty orbital, a positive charge or a $δ+$ centre. The other particles have lone pairs and are nucleophiles.')
              }],
              why: t('Elektrofilai ir nukleofilai skiriasi elektronų pora: nukleofilas ją atiduoda, elektrofilas priima. Neutrali molekulė gali būti bet kuris iš jų, priklausomai nuo to, ar turi laisvąją porą, ar $δ+$ atomą.', 'Electrophiles and nucleophiles differ in the electron pair: a nucleophile gives it, an electrophile accepts it. A neutral molecule can be either, depending on whether it has a lone pair or a $δ+$ atom.'),
              src: 'S2.7'
            };
          }
          const isE = rng() < 0.5;
          const x = ctx.pick(isE ? E : N);
          const others = ctx.shuffle((isE ? N : E).slice()).slice(0, 1).concat(ctx.shuffle((isE ? E : N).filter((y) => y !== x)).slice(0, 2));
          const mol = (extra) => ({ smi: x.smi, opts: Object.assign({ numbers: 'all' }, extra || {}) });
          const lab = x.atoms.map((i) => i + 1).join(' ir Nr. ');
          const labEN = x.atoms.map((i) => i + 1).join(' and no. ');
          const steps = [
            {
              prompt: t('Kuo ši dalelė yra reakcijoje su organine molekule: nukleofilu ar elektrofilu?', 'What is this particle in a reaction with an organic molecule: a nucleophile or an electrophile?'),
              kind: 'choice', options: [{ text: t('Nukleofilas', 'Nucleophile') }, { text: t('Elektrofilas', 'Electrophile') }], answer: isE ? 1 : 0,
              hint: t('Ar dalelė gali atiduoti elektronų porą, ar ją priimti?', 'Can the particle give an electron pair or accept one?'),
              solution: isE
                ? t('Dalelė turi tuščią orbitalę ar $δ+$ centrą ir priima elektronų porą: tai elektrofilas.', 'The particle has an empty orbital or a $δ+$ centre and accepts an electron pair: it is an electrophile.')
                : t('Dalelė turi laisvąją elektronų porą (ar neigiamą krūvį) ir ją atiduoda: tai nukleofilas.', 'The particle has a lone pair (or a negative charge) and gives it away: it is a nucleophile.')
            },
            {
              prompt: isE ? t('Bakstelėkite atomą, kuris priima elektronų porą.', 'Tap the atom that accepts the electron pair.') : t('Bakstelėkite atomą, kuris atiduoda elektronų porą.', 'Tap the atom that gives the electron pair.'),
              kind: 'atoms', mol: mol(), answer: x.atoms,
              hint: isE ? t('Ieškokite atomo su tuščia orbitale arba su $δ+$ krūviu.', 'Look for the atom with an empty orbital or a $δ+$ charge.') : t('Ieškokite atomo su laisvąja elektronų pora.', 'Look for the atom with a lone pair.'),
              solution: [{ p: t('Reaguojantis centras yra atomas Nr. ' + lab + '.', 'The reacting centre is atom no. ' + labEN + '.') }, { mol: { smi: x.smi, opts: { numbers: 'all', lonePairs: !isE } } }]
            },
            {
              prompt: t('Kuri iš šių dalelių gali reaguoti su šia dalele?', 'Which of these particles can react with this one?'),
              kind: 'choice',
              options: [{ mol: { smi: others[0].smi } }, { mol: { smi: others[1].smi } }, { mol: { smi: others[2].smi } }],
              answer: 0,
              hint: isE ? t('Elektrofilui reikia partnerio, kuris duoda elektronų porą.', 'An electrophile needs a partner that gives an electron pair.') : t('Nukleofilui reikia partnerio, kuris priima elektronų porą.', 'A nucleophile needs a partner that accepts an electron pair.'),
              solution: isE
                ? t('Elektrofilas reaguoja su nukleofilu, kuris atiduoda elektronų porą. Dvi elektrofilinės dalelės viena kitai poros nepasiūlo.', 'An electrophile reacts with a nucleophile, which gives the electron pair. Two electrophilic particles offer each other no pair.')
                : t('Nukleofilas reaguoja su elektrofilu, kuris poros reikalauja. Dvi nukleofilinės dalelės viena kitą stumia, nes abi turi poros perteklių.', 'A nucleophile reacts with an electrophile, which needs a pair. Two nucleophilic particles repel each other because both have a surplus of pairs.')
            }
          ];
          return {
            q: [{ p: t('Išnagrinėkite dalelę.', 'Examine the particle.') }, { mol: mol() }],
            steps,
            why: t('Nukleofilas yra elektronų poros donoras, elektrofilas – akceptorius. Reakcija vyksta tada, kai donoras susitinka su akceptoriumi.', 'A nucleophile is an electron-pair donor, an electrophile an acceptor. A reaction takes place when a donor meets an acceptor.'),
            src: 'L3 p23'
          };
        },
        bank: [
          {
            id: 'u03.nuel.1',
            q: [{ p: t('Ta pati molekulė gali turėti nukleofilinį ir elektrofilinį centrą.', 'One molecule can have both a nucleophilic and an electrophilic centre.') }, { mol: { smi: 'NC1CCC(Br)CC1', name: t('4-bromcikloheksanaminas', '4-bromocyclohexan-1-amine'), opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite nukleofilinį centrą.', 'Tap the nucleophilic centre.'),
                kind: 'atoms', mol: { smi: 'NC1CCC(Br)CC1', opts: { numbers: 'all' } }, answer: [0],
                hint: t('Kuris atomas gali atiduoti savo elektronų porą?', 'Which atom can give up its electron pair?'),
                solution: t('Azotas (Nr. 1) turi laisvąją porą ir ją atiduoda.', 'Nitrogen (no. 1) has a lone pair and gives it away.')
              },
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'NC1CCC(Br)CC1', opts: { numbers: 'all' } }, answer: [4],
                hint: t('Kuri anglis sujungta su elektrinės neigiamu atomu?', 'Which carbon is bonded to an atom of high electronegativity?'),
                solution: t('Anglis Nr. 5 sujungta su bromu: $C−Br$ ryšys poliarizuotas, todėl anglis turi $δ+$.', 'Carbon no. 5 is bonded to bromine: the $C−Br$ bond is polarised, so the carbon has $δ+$.')
              },
              {
                prompt: t('Kuri dalelė galėtų atakuoti elektrofilinį centrą?', 'Which particle could attack the electrophilic centre?'),
                kind: 'choice', options: [{ mol: { smi: '[OH-]' } }, { mol: { smi: '[H+]' } }, { mol: { smi: 'FB(F)F' } }], answer: 0,
                hint: t('Elektrofilinį centrą atakuoja dalelė, turinti ką atiduoti.', 'An electrophilic centre is attacked by a particle that has something to give.'),
                solution: t('Elektrofilinį centrą atakuoja nukleofilas, pavyzdžiui $HO-$. $H+$ ir $BF3$ yra elektrofilai.', 'An electrophilic centre is attacked by a nucleophile, for example $HO-$. $H+$ and $BF3$ are electrophiles.')
              }
            ],
            why: t('Atakos kryptis priklauso nuo poros srauto: nukleofilas ieško $δ+$ vietos, elektrofilas – laisvosios poros.', 'The direction of attack depends on the flow of the pair: a nucleophile looks for a $δ+$ place, an electrophile for a lone pair.'),
            src: 'L3 p30',
            claims: [{ name: ['NC1CCC(Br)CC1', t('4-bromcikloheksanaminas', '4-bromocyclohexan-1-amine')] }]
          },
          {
            id: 'u03.nuel.2',
            q: [{ p: t('Acetilo chloridas turi keletą reakcingų centrų.', 'Acetyl chloride has several reactive centres.') }, { mol: { smi: 'CC(=O)Cl', name: t('etanoilchloridas', 'ethanoyl chloride'), opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'CC(=O)Cl', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Kuri anglis sujungta su dviem elektrinės neigiamais atomais?', 'Which carbon is bonded to two electronegative atoms?'),
                solution: t('Karbonilo anglis (Nr. 2) turi dalinį teigiamą krūvį, nes deguonis ir chloras traukia elektronus.', 'The carbonyl carbon (no. 2) has a partial positive charge because oxygen and chlorine pull electrons.')
              },
              {
                prompt: t('Bakstelėkite atomą, kuris labiausiai tinka kaip nukleofilinis centras (laisvosios poros).', 'Tap the atom that fits best as a nucleophilic centre (lone pairs).'),
                kind: 'atoms', mol: { smi: 'CC(=O)Cl', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Kuris iš heteroatomų lengviausiai atiduoda laisvąją porą: dvigubo ryšio deguonis ar chloras su dideliu elektriniu neigiamumu?', 'Which heteroatom gives up a lone pair most easily: the double-bonded oxygen or chlorine with its high electronegativity?'),
                solution: t('Karbonilo deguonis (Nr. 3) turi dvi laisvąsias poras ir yra silpnas nukleofilinis centras. Chloras $C−Cl$ ryšyje pora tampa išeinančia grupe.', 'The carbonyl oxygen (no. 3) has two lone pairs and is a weak nucleophilic centre. Chlorine takes the pair of the $C−Cl$ bond as the leaving group.')
              }
            ],
            why: t('Karbonilo anglis yra elektrofilinė, o deguonis – nukleofilinis; tokia poliarizacija būdinga visoms karbonilo grupėms.', 'The carbonyl carbon is electrophilic and the oxygen nucleophilic; this polarisation is typical of all carbonyl groups.'),
            src: 'L3 p36',
            claims: [{ name: ['CC(=O)Cl', t('etanoilchloridas', 'ethanoyl chloride')] }]
          },
          {
            id: 'u03.nuel.3',
            q: [{ p: t('Etanalis turi $C=O$ grupę.', 'Ethanal has a $C=O$ group.') }, { mol: { smi: 'CC=O', name: t('etanalis', 'ethanal'), opts: { numbers: 'all', deltas: { 1: '+', 2: '-' } } } }],
            steps: [
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'CC=O', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Kuris $C=O$ atomas turi $δ+$?', 'Which atom of the $C=O$ has $δ+$?'),
                solution: t('Deguonis traukia $π$ ir $σ$ elektronus, todėl anglis (Nr. 2) turi $δ+$.', 'Oxygen pulls $π$ and $σ$ electrons, so carbon (no. 2) has $δ+$.')
              },
              {
                prompt: t('Kuris iš šių nukleofilų galėtų atakuoti šį centrą?', 'Which of these nucleophiles could attack this centre?'),
                kind: 'choice', options: [{ mol: { smi: '[C-]#N' } }, { mol: { smi: '[Br+]' } }, { mol: { smi: 'C[C+](C)C' } }], answer: 0,
                hint: t('Iš trijų dalelių tik viena turi poros perteklių.', 'Of the three particles only one has a surplus of electron pairs.'),
                solution: t('$CN-$ turi laisvąją porą ir yra nukleofilas. $Br+$ ir tretinis karbokatijonas yra elektrofilai.', '$CN-$ has a lone pair and is a nucleophile. $Br+$ and the tertiary carbocation are electrophiles.')
              }
            ],
            why: t('Nukleofilas atakuoja anglį su $δ+$, kurią sukuria elektrinės neigiamesnis kaimynas.', 'A nucleophile attacks a carbon with $δ+$ created by a more electronegative neighbour.'),
            src: 'L3 p36',
            claims: [{ name: ['CC=O', t('etanalis', 'ethanal')] }]
          },
          {
            id: 'u03.nuel.4',
            q: [{ p: t('Glicinas turi aminogrupę ir karboksilo grupę.', 'Glycine has an amino group and a carboxyl group.') }, { mol: { smi: 'NCC(=O)O', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite stipriausią nukleofilinį centrą.', 'Tap the strongest nucleophilic centre.'),
                kind: 'atoms', mol: { smi: 'NCC(=O)O', opts: { numbers: 'all' } }, answer: [0],
                hint: t('Neutraliuose nukleofiluose aminai stipriausi.', 'Among neutral nucleophiles amines are the strongest.'),
                solution: t('Azoto (Nr. 1) laisvoji pora atiduodama lengviausiai: aminai yra stipresni nukleofilai už alkoholius ar rūgštis.', 'The lone pair of nitrogen (no. 1) is given up most readily: amines are stronger nucleophiles than alcohols or acids.')
              },
              {
                prompt: t('Bakstelėkite anglį, kurią atakuoja nukleofilai.', 'Tap the carbon that nucleophiles attack.'),
                kind: 'atoms', mol: { smi: 'NCC(=O)O', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Ieškokite anglies su dviem elektrinės neigiamais atomais.', 'Look for the carbon with two electronegative atoms.'),
                solution: t('Karboksilo anglis (Nr. 3) turi $δ+$, nes ją veikia $C=O$ ir $O−H$ deguonys.', 'The carboxyl carbon (no. 3) has $δ+$ because it is acted on by the $C=O$ and $O−H$ oxygens.')
              }
            ],
            why: t('Viena molekulė gali elgtis ir kaip nukleofilas, ir kaip elektrofilas: aminas atiduoda porą, o karboksilo anglis priima.', 'One molecule can act as a nucleophile and as an electrophile: the amine gives a pair, the carboxyl carbon accepts one.'),
            src: 'L3 p30'
          },
          {
            id: 'u03.nuel.5',
            q: [{ p: t('2-Chloretanolis turi hidroksilo grupę ir $C−Cl$ ryšį.', '2-Chloroethanol has a hydroxyl group and a $C−Cl$ bond.') }, { mol: { smi: 'OCCCl', name: t('2-chloretanolis', '2-chloroethan-1-ol'), opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite nukleofilinį centrą.', 'Tap the nucleophilic centre.'),
                kind: 'atoms', mol: { smi: 'OCCCl', opts: { numbers: 'all' } }, answer: [0],
                hint: t('Kuris atomas turi laisvąsias poras ir nėra išeinanti grupė?', 'Which atom has lone pairs and is not a leaving group?'),
                solution: t('Hidroksilo deguonis (Nr. 1) turi dvi laisvąsias poras.', 'The hydroxyl oxygen (no. 1) has two lone pairs.')
              },
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'OCCCl', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Ieškokite $C−X$ ryšio anglies.', 'Look for the carbon of the $C−X$ bond.'),
                solution: t('Anglis Nr. 3 sujungta su chloru, todėl turi $δ+$ ir yra elektrofilas.', 'Carbon no. 3 is bonded to chlorine, so it has $δ+$ and is an electrophile.')
              }
            ],
            why: t('Halogenalkano anglis yra elektrofilinė, nes halogenas traukia $σ$ elektronus; heteroatomo laisvosios poros duoda nukleofilinį centrą.', 'The carbon of a haloalkane is electrophilic because the halogen pulls $σ$ electrons; the lone pairs of a heteroatom provide a nucleophilic centre.'),
            src: 'L3 p36',
            claims: [{ name: ['OCCCl', t('2-chloretanolis', '2-chloroethan-1-ol')] }]
          },
          {
            id: 'u03.nuel.6',
            q: [{ p: t('Acetonitrilas turi trigubą ryšį $C≡N$.', 'Acetonitrile has a triple bond $C≡N$.') }, { mol: { smi: 'CC#N', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomą su laisvąja pora, galintį veikti kaip nukleofilas.', 'Tap the atom with a lone pair that can act as a nucleophile.'),
                kind: 'atoms', mol: { smi: 'CC#N', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Azotas turi laisvąją porą, kuri nedalyvauja $π$ ryšyje.', 'Nitrogen has a lone pair that is not part of the $π$ bonds.'),
                solution: t('Azoto (Nr. 3) laisvoji pora yra $sp$ orbitalėje ir gali būti atiduodama.', 'The lone pair of nitrogen (no. 3) is in an $sp$ orbital and can be given up.')
              },
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'CC#N', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Elektrofiliniu centru tampa anglis, kurią azotas nutraukia nuo elektronų.', 'The electrophilic centre is the carbon from which nitrogen pulls electrons away.'),
                solution: t('Nitrilo anglis (Nr. 2) turi $δ+$, nes azotas traukia $π$ elektronus.', 'The nitrile carbon (no. 2) has $δ+$ because nitrogen pulls the $π$ electrons.')
              }
            ],
            why: t('Daugialypis ryšys su elektrinės neigiamesniu atomu poliarizuotas, todėl anglis elektrofilinė, o heteroatomas nukleofilinis.', 'A multiple bond to a more electronegative atom is polarised, so the carbon is electrophilic and the heteroatom nucleophilic.'),
            src: 'L3 p36'
          },
          {
            id: 'u03.nuel.7',
            q: [{ p: t('Metilacetatas yra esteris.', 'Methyl acetate is an ester.') }, { mol: { smi: 'CC(=O)OC', name: t('metiletanoatas', 'methyl ethanoate'), opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'CC(=O)OC', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Ieškokite anglies su dviem deguonimis.', 'Look for the carbon with two oxygens.'),
                solution: t('Karbonilo anglis (Nr. 2) sujungta su dviem deguonimis ir turi $δ+$.', 'The carbonyl carbon (no. 2) is bonded to two oxygens and has $δ+$.')
              },
              {
                prompt: t('Bakstelėkite karbonilo deguonį, kuris veikia kaip silpnas nukleofilas.', 'Tap the carbonyl oxygen that acts as a weak nucleophile.'),
                kind: 'atoms', mol: { smi: 'CC(=O)OC', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Ar deguonis su dvigubu ryšiu, ar su dviem viengubaisiais, yra labiau nukleofilinis?', 'Is the oxygen with the double bond or the one with two single bonds more nucleophilic?'),
                solution: t('Karbonilo deguonies (Nr. 3) pora prieinamesnė nei eterinio deguonies (Nr. 4), kurios pora delokalizuota su $C=O$ ($p,π$-konjugacija).', 'The pair of the carbonyl oxygen (no. 3) is more available than that of the ether-type oxygen (no. 4), whose pair is delocalised with the $C=O$ ($p,π$ conjugation).')
              }
            ],
            why: t('Karbonilinis junginys visada turi elektrofilinę anglį ir nukleofilinį deguonį. Tai paaiškina daugelį jo reakcijų.', 'A carbonyl compound always has an electrophilic carbon and a nucleophilic oxygen. This explains many of its reactions.'),
            src: 'L3 p36',
            claims: [{ name: ['CC(=O)OC', t('metiletanoatas', 'methyl ethanoate')] }]
          },
          {
            id: 'u03.nuel.8',
            q: [{ p: t('2-Brometanaminas turi aminogrupę ir $C−Br$ ryšį.', '2-Bromoethanamine has an amino group and a $C−Br$ bond.') }, { mol: { smi: 'NCCBr', name: t('2-brometanaminas', '2-bromoethan-1-amine'), opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite nukleofilinį centrą.', 'Tap the nucleophilic centre.'),
                kind: 'atoms', mol: { smi: 'NCCBr', opts: { numbers: 'all' } }, answer: [0],
                hint: t('Kuris atomas turi laisvąją porą, kurią lengviausiai atiduotų?', 'Which atom has the lone pair that is easiest to give?'),
                solution: t('Azotas (Nr. 1) atiduoda laisvąją porą.', 'Nitrogen (no. 1) gives up its lone pair.')
              },
              {
                prompt: t('Bakstelėkite elektrofilinį centrą.', 'Tap the electrophilic centre.'),
                kind: 'atoms', mol: { smi: 'NCCBr', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Kuri anglis sujungta su bromu?', 'Which carbon is bonded to bromine?'),
                solution: t('Anglis Nr. 3 turi $δ+$ dėl $C−Br$ poliarizacijos.', 'Carbon no. 3 has $δ+$ because of the polarisation of the $C−Br$ bond.')
              }
            ],
            why: t('Kai molekulė turi nukleofilinį ir elektrofilinį centrą kartu, molekulės gali reaguoti tarpusavyje arba užsisklęsti žiedu.', 'When a molecule carries a nucleophilic and an electrophilic centre together, molecules can react with each other or cyclise.'),
            src: 'L3 p30'
          }
        ]
      },
      /* ============ u03.nuc: comparing nucleophilicity (generator + bank) ============ */
      {
        id: 'u03.nuc',
        title: t('Nukleofiliškumo palyginimas', 'Comparing nucleophilicity'),
        mirrors: ['S2.13'],
        gen(rng, ctx) {
          const it = (smi, f, r) => ({ smi, f: '$' + f + '$', r });
          // families of species whose nucleophilicity is ordered by the rank r (higher = more nucleophilic), each with the reason and typical wrong reasons
          const PERIOD = {
            reason: t('Einant periodu iš kairės į dešinę elektrinis neigiamumas didėja: atomas stipriau laiko savo elektronų porą ir sunkiau ją atiduoda.', 'Going across a period from left to right electronegativity grows: the atom holds its electron pair more tightly and gives it up less readily.'),
            wrongs: [t('Didesnio elektrinio neigiamumo atomas elektronų porą atiduoda lengviau.', 'An atom of higher electronegativity gives up its electron pair more readily.'), t('Nukleofiliškumą lemia tik atomo dydis: mažiausias atomas yra nukleofiliškiausias.', 'Nucleophilicity is decided by atom size alone: the smallest atom is the most nucleophilic.'), t('Visi šie atomai vienodai atiduoda elektronų porą, nes yra vienoje eilutėje.', 'All these atoms give up an electron pair equally because they are in one row.')]
          };
          const CHARGE = {
            reason: t('Anijonas turi pilną neigiamą krūvį ir laisvąją porą atiduoda lengviau nei neutrali molekulė.', 'An anion has a full negative charge and gives up its lone pair more readily than a neutral molecule.'),
            wrongs: [t('Neutrali molekulė turi daugiau vandenilio atomų, todėl nukleofiliškesnė.', 'The neutral molecule has more hydrogen atoms, so it is more nucleophilic.'), t('Anijonas yra mažesnis, todėl stipriau laiko elektronų porą.', 'The anion is smaller, so it holds the electron pair more tightly.'), t('Krūvis nukleofiliškumui įtakos neturi.', 'Charge has no influence on nucleophilicity.')]
          };
          const GROUP = {
            reason: t('Žemyn grupe atomas didesnis ir lengviau poliarizuojasi, todėl jo laisvoji pora prieinamesnė: nukleofiliškumas auga, nors bazingumas silpnėja.', 'Going down a group the atom is larger and more polarisable, so it gives up its lone pair more readily: nucleophilicity grows although basicity falls.'),
            wrongs: [t('Žemyn grupe elektrinis neigiamumas didėja, todėl didėja ir nukleofiliškumas.', 'Going down a group electronegativity grows, so nucleophilicity grows too.'), t('Stipresnė bazė visada yra ir stipresnis nukleofilas.', 'The stronger base is always the stronger nucleophile.'), t('Nukleofiliškumas grupėje nekinta.', 'Nucleophilicity does not change within a group.')]
          };
          const SUBST = {
            reason: t('Elektronų donorai nukleofiliškumą didina, o krūvio delokalizacija ir akceptoriniai pakaitai jį mažina: išsklaidyta pora atiduodama sunkiau.', 'Electron donors raise nucleophilicity, while charge delocalisation and acceptor substituents lower it: a spread-out pair is given up less readily.'),
            wrongs: [t('Kuo daugiau atomų molekulėje, tuo nukleofiliškesnė dalelė.', 'The more atoms the molecule has, the more nucleophilic the particle.'), t('Delokalizuotas krūvis padaro nukleofilą stipresnį.', 'A delocalised charge makes a nucleophile stronger.'), t('Visos šios dalelės turi vieną deguonį, todėl yra vienodos.', 'All these particles have one oxygen, so they are equal.')]
          };
          const AMINE = {
            reason: t('Azoto elektrinis neigiamumas mažesnis už deguonies, todėl azotas laisvąją porą atiduoda lengviau; aminai yra stipriausi neutralūs nukleofilai.', 'The electronegativity of nitrogen is lower than that of oxygen, so nitrogen gives up its lone pair more readily; amines are the strongest neutral nucleophiles.'),
            wrongs: [t('Deguonis elektrinės neigiamesnis, todėl laisvąją porą atiduoda lengviau.', 'Oxygen is more electronegative, so it gives up its lone pair more readily.'), t('Alkoholiai turi daugiau laisvųjų porų, todėl nukleofiliškesni.', 'Alcohols have more lone pairs, so they are more nucleophilic.'), t('Aminas yra rūgštesnis, todėl ir nukleofiliškesnis.', 'The amine is more acidic, so it is also more nucleophilic.')]
          };
          const FAM = [
            Object.assign({ items: [it('[CH3-]', 'CH3-', 3), it('[NH2-]', 'NH2-', 2), it('[OH-]', 'HO-', 1), it('[F-]', 'F-', 0)] }, PERIOD),
            Object.assign({ items: [it('N', 'NH3', 2), it('O', 'H2O', 1), it('F', 'HF', 0)] }, PERIOD),
            Object.assign({ items: [it('[NH2-]', 'NH2-', 1), it('N', 'NH3', 0)] }, CHARGE),
            Object.assign({ items: [it('[OH-]', 'HO-', 1), it('O', 'H2O', 0)] }, CHARGE),
            Object.assign({ items: [it('[F-]', 'F-', 1), it('F', 'HF', 0)] }, CHARGE),
            Object.assign({ items: [it('[SH-]', 'HS-', 1), it('S', 'H2S', 0)] }, CHARGE),
            Object.assign({ items: [it('[I-]', 'I-', 3), it('[Br-]', 'Br-', 2), it('[Cl-]', 'Cl-', 1), it('[F-]', 'F-', 0)] }, GROUP),
            Object.assign({ items: [it('[SH-]', 'HS-', 1), it('[OH-]', 'HO-', 0)] }, GROUP),
            Object.assign({ items: [it('S', 'H2S', 1), it('O', 'H2O', 0)] }, GROUP),
            Object.assign({ items: [it('CS', 'CH3SH', 1), it('CO', 'CH3OH', 0)] }, GROUP),
            Object.assign({ items: [it('C[O-]', 'CH3O-', 3), it('[OH-]', 'HO-', 2), it('[O-]c1ccccc1', 'C6H5O-', 1), it('CC(=O)[O-]', 'CH3COO-', 0)] }, SUBST),
            Object.assign({ items: [it('CO', 'CH3OH', 3), it('O', 'H2O', 2), it('Oc1ccccc1', 'C6H5OH', 1), it('CC(=O)O', 'CH3COOH', 0)] }, SUBST),
            Object.assign({ items: [it('CN', 'CH3NH2', 1), it('CO', 'CH3OH', 0)] }, AMINE),
            Object.assign({ items: [it('N', 'NH3', 1), it('O', 'H2O', 0)] }, AMINE),
            Object.assign({ items: [it('CN(C)C', '(CH3)3N', 1), it('COC', '(CH3)2O', 0)] }, AMINE),
            Object.assign({ items: [it('CCN', 'C2H5NH2', 1), it('CCO', 'C2H5OH', 0)] }, AMINE)
          ];
          const fam = ctx.pick(FAM);
          const pair = ctx.shuffle(fam.items.slice()).slice(0, 2);
          pair.sort((a, b) => b.r - a.r);            // pair[0] is the more nucleophilic
          const flip = rng() < 0.5;
          const shown = flip ? [pair[1], pair[0]] : [pair[0], pair[1]];
          const right = flip ? 1 : 0;
          const opts = [fam.reason].concat(fam.wrongs).map((x) => ({ text: x }));
          return {
            q: [{ p: t('Palyginkite dviejų dalelių nukleofiliškumą.', 'Compare the nucleophilicity of two particles.') }, { mol: shown.map((x) => ({ smi: x.smi })) }],
            steps: [
              {
                prompt: t('Kuri dalelė yra nukleofiliškesnė?', 'Which particle is the more nucleophilic?'),
                kind: 'choice', options: shown.map((x) => ({ mol: { smi: x.smi } })), answer: right,
                hint: t('Palyginkite nukleofilinius atomus: kuris laisvąją elektronų porą atiduotų lengviau ir kodėl?', 'Compare the nucleophilic atoms: which one would give up its lone pair more readily, and why?'),
                solution: t('Nukleofiliškesnė yra ' + pair[0].f + ' (palyginti su ' + pair[1].f + ').', 'The more nucleophilic is ' + pair[0].f + ' (compared with ' + pair[1].f + ').')
              },
              {
                prompt: t('Kuo grindžiamas šis skirtumas?', 'What explains the difference?'),
                kind: 'choice', options: opts, answer: 0,
                hint: t('Pagalvokite, kuo šios dalelės skiriasi: krūviu, atomo vieta periodinėje lentelėje ar pakaitais.', 'Think about how the particles differ: in charge, in the position of the atom in the periodic table, or in substituents.'),
                solution: fam.reason
              }
            ],
            why: t('Nukleofiliškumas parodo, kaip lengvai dalelė atiduoda elektronų porą. Jį didina neigiamas krūvis, mažesnis elektrinis neigiamumas ir elektronų donorai; žemyn grupe jis didėja, o erdviniai trukdžiai jį mažina.', 'Nucleophilicity shows how readily a particle gives up an electron pair. It is raised by a negative charge, lower electronegativity and electron donors; it grows down a group and is lowered by steric hindrance.'),
            src: 'L3 p26'
          };
        },
        bank: [
          {
            id: 'u03.nuc.1',
            q: [{ p: t('Palyginkite dimetilamido anijoną ir dimetilaminą.', 'Compare the dimethylamide anion and dimethylamine.') }, { mol: [{ smi: 'C[N-]C', opts: { lonePairs: true } }, { smi: 'CNC', opts: { lonePairs: true } }] }],
            steps: [
              {
                prompt: t('Kuri dalelė nukleofiliškesnė?', 'Which particle is more nucleophilic?'),
                kind: 'choice', options: [{ mol: { smi: 'C[N-]C' } }, { mol: { smi: 'CNC' } }], answer: 0,
                hint: t('Ar dalelė turi neigiamą krūvį?', 'Does the particle carry a negative charge?'),
                solution: t('Anijonas turi pilną neigiamą krūvį ir laisvąją porą atiduoda lengviau, todėl nukleofiliškesnis yra $(CH3)2N-$.', 'The anion carries a full negative charge and gives up its lone pair more readily, so $(CH3)2N-$ is the more nucleophilic.')
              }
            ],
            why: t('Anijonai nukleofiliškesni už atitinkamas neutralias molekules: $NH2- > NH3$, $HO- > H2O$ ir t. t.', 'Anions are more nucleophilic than the corresponding neutral molecules: $NH2- > NH3$, $HO- > H2O$ and so on.'),
            src: 'S2.13'
          },
          {
            id: 'u03.nuc.2',
            q: [{ p: t('Palyginkite trimetilboraną ir trimetilaminą.', 'Compare trimethylborane and trimethylamine.') }, { mol: [{ smi: 'CB(C)C', name: t('trimetilboranas', 'trimethylborane') }, { smi: 'CN(C)C', name: t('N,N-dimetilmetanaminas', 'N,N-dimethylmethanamine') }] }],
            steps: [
              {
                prompt: t('Kuris junginys gali būti nukleofilas?', 'Which compound can be a nucleophile?'),
                kind: 'choice', options: [{ mol: { smi: 'CB(C)C' } }, { mol: { smi: 'CN(C)C' } }], answer: 1,
                hint: t('Nukleofilui reikia laisvosios elektronų poros. Kurį atomą supa kiek elektronų?', 'A nucleophile needs a lone pair. How many electrons surround each central atom?'),
                solution: t('Trimetilborano boras turi tik tris ryšius ir tuščią $p$ orbitalę: jis priima elektronų porą, todėl yra elektrofilas. Azotas turi laisvąją porą ir yra nukleofilas.', 'Boron in trimethylborane has only three bonds and an empty $p$ orbital: it accepts an electron pair, so it is an electrophile. Nitrogen has a lone pair and is a nucleophile.')
              },
              {
                prompt: t('Kuo grindžiamas skirtumas?', 'What explains the difference?'),
                kind: 'choice',
                options: [{ text: t('Azotas turi laisvąją porą, o boras – tuščią orbitalę.', 'Nitrogen has a lone pair, boron an empty orbital.') }, { text: t('Boras elektrinis neigiamesnis už azotą.', 'Boron is more electronegative than nitrogen.') }, { text: t('Trimetilboranas turi daugiau $C−H$ ryšių.', 'Trimethylborane has more $C−H$ bonds.') }],
                answer: 0,
                hint: t('Nukleofiliškumas prasideda nuo elektronų poros, kurią galima atiduoti.', 'Nucleophilicity starts with an electron pair that can be given.'),
                solution: t('Elektronų poros turėjimas lemia, ar dalelė yra donoras ar akceptorius.', 'Having an electron pair decides whether a particle is a donor or an acceptor.')
              }
            ],
            why: t('Pirmiausia reikia patikrinti, ar dalelė turi laisvąją porą: be jos nukleofiliškumo nėra, o tuščia orbitalė reiškia elektrofilą.', 'First check whether the particle has a lone pair: without one there is no nucleophilicity, and an empty orbital means an electrophile.'),
            src: 'S2.13',
            claims: [{ name: ['CB(C)C', t('trimetilboranas', 'trimethylborane')] }]
          },
          {
            id: 'u03.nuc.3',
            q: [{ p: t('Palyginkite vandenį ir vandenilio sulfidą.', 'Compare water and hydrogen sulfide.') }, { mol: [{ smi: 'O' }, { smi: 'S' }] }],
            steps: [
              {
                prompt: t('Kuri molekulė nukleofiliškesnė?', 'Which molecule is more nucleophilic?'),
                kind: 'choice', options: [{ mol: { smi: 'O' } }, { mol: { smi: 'S' } }], answer: 1,
                hint: t('Palyginkite atomų dydį ir poliarizuojamumą vienoje grupėje.', 'Compare the size and polarisability of the atoms within one group.'),
                solution: t('Siera didesnė ir lengviau poliarizuojasi nei deguonis, todėl $H2S$ yra nukleofiliškesnis, nors silpnesnė bazė.', 'Sulfur is larger and more polarisable than oxygen, so $H2S$ is the more nucleophilic although the weaker base.')
              },
              {
                prompt: t('Kuri molekulė yra stipresnė bazė?', 'Which molecule is the stronger base?'),
                kind: 'choice', options: [{ mol: { smi: 'O' } }, { mol: { smi: 'S' } }], answer: 0,
                hint: t('Bazingumas grupėje žemyn kinta priešingai nei nukleofiliškumas.', 'Basicity changes down a group in the opposite way to nucleophilicity.'),
                solution: t('Vanduo yra stipresnė bazė, nes mažesnis deguonis stipriau jungia protoną. Nukleofiliškumas ir bazingumas čia eina priešingomis kryptimis.', 'Water is the stronger base because the smaller oxygen binds a proton more strongly. Nucleophilicity and basicity run in opposite directions here.')
              }
            ],
            why: t('Grupėje žemyn nukleofiliškumas auga, o bazingumas krenta; tai paaiškina, kodėl tioliai yra geresni nukleofilai, o alkoholiai – stipresnės bazės.', 'Within a group, going down, nucleophilicity grows while basicity falls: that is why thiols are more nucleophilic than alcohols and alcohols are stronger bases.'),
            src: 'S2.13'
          },
          {
            id: 'u03.nuc.4',
            q: [{ p: t('Etoksido ir tret-butoksido anijonai abu yra stiprios bazės.', 'The ethoxide and tert-butoxide anions are both strong bases.') }, { mol: [{ smi: 'CC[O-]' }, { smi: 'CC(C)(C)[O-]' }] }],
            steps: [
              {
                prompt: t('Kuris anijonas yra geresnis nukleofilas?', 'Which anion is the better nucleophile?'),
                kind: 'choice', options: [{ mol: { smi: 'CC[O-]' } }, { mol: { smi: 'CC(C)(C)[O-]' } }], answer: 0,
                hint: t('Nukleofilas turi prieiti prie anglies atomo; ar tam kas nors trukdo?', 'A nucleophile has to approach a carbon atom; does anything get in the way?'),
                solution: t('Tret-butoksido deguonis apsuptas trijų metilo grupių, kurios trukdo prieiti prie anglies, todėl jis silpnesnis nukleofilas.', 'The oxygen of tert-butoxide is surrounded by three methyl groups that block the approach to carbon, so it is the weaker nucleophile.')
              },
              {
                prompt: t('Kodėl tret-butoksidas vis tiek yra stipri bazė?', 'Why is tert-butoxide still a strong base?'),
                kind: 'choice',
                options: [{ text: t('Mažas protonas lengvai pasiekiamas ir pro erdvinius trukdžius.', 'The small proton is easily reached despite the steric hindrance.') }, { text: t('Tret-butoksidas neturi laisvųjų porų.', 'tert-Butoxide has no lone pairs.') }, { text: t('Tret-butoksidas yra rūgštis.', 'tert-Butoxide is an acid.') }],
                answer: 0,
                hint: t('Palyginkite, ką ataka prieina: didelę anglį ar mažą protoną.', 'Compare what is being approached: a large carbon or a tiny proton.'),
                solution: t('Bazingumas reiškia protono prisijungimą, o tam erdviniai trukdžiai beveik nekliudo.', 'Basicity means taking up a proton, which steric hindrance hardly blocks.')
              }
            ],
            why: t('Erdviniai trukdžiai mažina nukleofiliškumą, bet ne bazingumą, todėl šios savybės nėra tapačios.', 'Steric hindrance lowers nucleophilicity but not basicity, so these properties are not identical.'),
            src: 'L3 p29'
          },
          {
            id: 'u03.nuc.5',
            q: [{ p: t('Keturi deguonies anijonai.', 'Four oxygen anions.') }, { mol: [{ smi: 'C[O-]' }, { smi: '[O-]c1ccccc1' }, { smi: 'CC(=O)[O-]' }, { smi: '[OH-]' }] }],
            steps: [
              {
                prompt: t('Išdėstykite anijonus nuo stipriausio nukleofilo iki silpniausio.', 'Put the anions in order from the strongest nucleophile to the weakest.'),
                kind: 'order',
                options: [{ mol: { smi: 'C[O-]' } }, { mol: { smi: '[OH-]' } }, { mol: { smi: '[O-]c1ccccc1' } }, { mol: { smi: 'CC(=O)[O-]' } }],
                hint: t('Palyginkite, kiek krūvis delokalizuotas ir kaip pakaitai veikia deguonį.', 'Compare how far the charge is delocalised and how the substituents act on oxygen.'),
                solution: t('$CH3O- > HO- > C6H5O- > CH3COO-$: metilas yra donoras, fenoksido krūvis dalijasi žiede, o acetato – tarp dviejų deguonių su karbonilo akceptoriumi.', '$CH3O- > HO- > C6H5O- > CH3COO-$: methyl is a donor, the phenoxide charge is shared in the ring and the acetate charge between two oxygens with a carbonyl acceptor.')
              }
            ],
            why: t('Donoriniai pakaitai didina, o akceptoriniai ir delokalizacija mažina nukleofiliškumą.', 'Donor substituents raise nucleophilicity, while acceptor substituents and delocalisation lower it.'),
            src: 'L3 p28'
          },
          {
            id: 'u03.nuc.6',
            q: [{ p: t('Trys neutralios molekulės iš vienos eilutės.', 'Three neutral molecules from one row.') }, { mol: [{ smi: 'N' }, { smi: 'O' }, { smi: 'F' }] }],
            steps: [
              {
                prompt: t('Išdėstykite molekules nuo stipriausio nukleofilo iki silpniausio.', 'Put the molecules in order from the strongest nucleophile to the weakest.'),
                kind: 'order',
                options: [{ mol: { smi: 'N' } }, { mol: { smi: 'O' } }, { mol: { smi: 'F' } }],
                hint: t('Pagalvokite, kaip kinta elektrinis neigiamumas nuo azoto iki fluoro.', 'Think about how electronegativity changes from nitrogen to fluorine.'),
                solution: t('$NH3 > H2O > HF$: kuo elektrinis neigiamumas didesnis, tuo sunkiau atiduodama laisvoji pora.', '$NH3 > H2O > HF$: the higher the electronegativity, the harder it is to give up the lone pair.')
              }
            ],
            why: t('Periode iš kairės į dešinę nukleofiliškumas mažėja, nes elektrinis neigiamumas didėja.', 'Across a period from left to right nucleophilicity falls because electronegativity rises.'),
            src: 'L3 p26'
          },
          {
            id: 'u03.nuc.7',
            q: [{ p: t('Keturi halogenidų anijonai.', 'Four halide anions.') }, { mol: [{ smi: '[F-]' }, { smi: '[Cl-]' }, { smi: '[Br-]' }, { smi: '[I-]' }] }],
            steps: [
              {
                prompt: t('Išdėstykite anijonus nuo stipriausio nukleofilo iki silpniausio.', 'Put the anions in order from the strongest nucleophile to the weakest.'),
                kind: 'order',
                options: [{ mol: { smi: '[I-]' } }, { mol: { smi: '[Br-]' } }, { mol: { smi: '[Cl-]' } }, { mol: { smi: '[F-]' } }],
                hint: t('Nukleofiliškumas grupėje žemyn kinta priešingai nei bazingumas.', 'Nucleophilicity changes down a group in the opposite way to basicity.'),
                solution: t('$I- > Br- > Cl- > F-$: didesni atomai lengviau poliarizuojasi ir laisvąją porą atiduoda lengviau.', '$I- > Br- > Cl- > F-$: larger atoms are more polarisable and give up their lone pair more readily.')
              }
            ],
            why: t('Žemyn vienoje grupėje nukleofiliškumas auga, nors bazingumas silpnėja.', 'Within a group, going down, nucleophilicity grows although basicity falls.'),
            src: 'L3 p29'
          },
          {
            id: 'u03.nuc.8',
            q: [{ p: t('Nukleofiliškumas ir bazingumas dažnai, bet ne visada, kinta kartu.', 'Nucleophilicity and basicity often, but not always, change together.') }],
            steps: [
              {
                prompt: t('Pažymėkite teisingus teiginius.', 'Pick the correct statements.'),
                kind: 'multi',
                options: [
                  { text: t('$HS-$ yra silpnesnė bazė už $HO-$, bet nukleofiliškesnis.', '$HS-$ is a weaker base than $HO-$ but more nucleophilic.') },
                  { text: t('Alkoholiai yra stipresnės bazės už tiolius, o tioliai nukleofiliškesni už alkoholius.', 'Alcohols are stronger bases than thiols, while thiols are more nucleophilic than alcohols.') },
                  { text: t('Stipri bazė visada yra stiprus nukleofilas.', 'A strong base is always a strong nucleophile.') },
                  { text: t('Tret-butoksidas yra stiprus nukleofilas, nes yra stipri bazė.', 'tert-Butoxide is a strong nucleophile because it is a strong base.') }
                ],
                answer: [0, 1],
                hint: t('Prisiminkite dvi išimtis: žemyn grupe ir erdvinius trukdžius.', 'Recall the two exceptions: down a group and steric hindrance.'),
                solution: t('Teisingi pirmieji du: žemyn grupe nukleofiliškumas didėja, bazingumas mažėja. Trečias ir ketvirtas neteisingi, nes erdviniai trukdžiai nukleofiliškumą sumažina.', 'The first two are correct: down a group nucleophilicity grows and basicity falls. The third and fourth are wrong because steric hindrance reduces nucleophilicity.')
              }
            ],
            why: t('Bazingumas yra protono prisijungimas, nukleofiliškumas – prisijungimas prie kitų atomų, todėl jie turi skirtingas išimtis.', 'Basicity is taking up a proton, nucleophilicity is bonding to other atoms, so they have different exceptions.'),
            src: 'L3 p29'
          }
        ]
      },
      /* ============ u03.rtype: type of reaction, mechanism symbol, reagent type (generator) ============ */
      {
        id: 'u03.rtype',
        title: t('Reakcijos tipas, mechanizmo simbolis ir reagentas', 'Type of reaction, mechanism symbol and reagent'),
        mirrors: ['S2.8'],
        gen(rng, ctx) {
          const { react } = ctx;
          const one = (res) => { const m = res.products.filter((p) => p.major); return m.length === 1 ? m[0].smi : null; };
          // each builder gives { type: 0 substitution, 1 addition, 2 elimination, 3 rearrangement, sym, reactant, label, product }
          const B = {
            sn2() {
              const h = ctx.pick(['CBr', 'CCBr', 'CCCBr', 'CCCCBr', 'CI', 'CCI', 'CCCI', 'CCCCl', 'CCCCCl', 'CCl', 'CCCl', 'CC(C)CBr']);
              const nu = ctx.pick([['OH', 'KOH, H2O'], ['CN', 'KCN'], ['SH', 'NaSH'], ['OC', 'CH3ONa']]);
              const r = react.run('sn2', [h], { nu: nu[0] });
              const p = one(r);
              return p && r.mech === 'SN2' ? { type: 0, sym: 'SN2', reactant: h, label: nu[1], product: p } : null;
            },
            sn1() {
              const h = ctx.pick(['CC(C)(C)Cl', 'CC(C)(C)Br', 'CCC(C)(C)Cl', 'CCC(C)(C)Br', 'CC(C)(C)I', 'CCC(C)(CC)Br']);
              const nu = ctx.pick([['OH', 'H2O'], ['OC', 'CH3OH'], ['OCC', 'C2H5OH']]);
              const r = react.run('sn1', [h], { nu: nu[0] });
              const p = one(r);
              return p && r.mech === 'SN1' ? { type: 0, sym: 'SN1', reactant: h, label: nu[1], product: p } : null;
            },
            e2() {
              const h = ctx.pick(['CCBr', 'CCCBr', 'CC(C)Br', 'CCC(C)Br', 'CC(C)CBr', 'CCCCl', 'CCC(C)Cl', 'CC(C)Cl', 'CCCCBr']);
              const r = react.run('elim', [h], { base: 'strong' });
              const p = one(r);
              return p && r.mech === 'E2' ? { type: 2, sym: 'E2', reactant: h, label: 'KOH, EtOH, t°', product: p } : null;
            },
            e1() {
              const a = ctx.pick(['CC(C)(C)O', 'CC(C)O', 'CCC(C)O', 'CCC(C)(C)O', 'C1CCCCC1O', 'CCC(O)CC']);
              if (react.wouldRearrange(a)) return null;
              const r = react.run('elim', [a], { base: 'heat-acid' });
              const p = one(r);
              return p && r.mech === 'E1' ? { type: 2, sym: 'E1', reactant: a, label: 'H2SO4, t°', product: p } : null;
            },
            ae() {
              const a = ctx.pick(['C=C', 'CC=C', 'CC=CC', 'CC(C)=C', 'CCC=C', 'CC1=CCCCC1', 'C1=CCCCC1', 'CCC=CC', 'CC(C)=CC']);
              const w = ctx.pick(['hx', 'hx', 'h2o', 'x2']);
              if (w !== 'x2' && react.wouldRearrange(a)) return null;
              const X = ctx.pick(['Cl', 'Br']);
              const r = w === 'hx' ? react.run('ae.hx', [a], { X }) : w === 'x2' ? react.run('ae.x2', [a], { X }) : react.run('ae.h2o', [a]);
              const p = one(r);
              return p && r.mech === 'AE' ? { type: 1, sym: 'AE', reactant: a, label: w === 'hx' ? 'H' + X : w === 'x2' ? X + '2' : 'H2O, H+', product: p } : null;
            },
            sr() {
              const a = ctx.pick(['C', 'CC', 'CCC', 'CC(C)C', 'CCCC', 'C1CCCCC1', 'CC(C)(C)C']);
              const X = ctx.pick(['Cl', 'Br']);
              const r = react.run('sr.halogenate', [a], { X });
              const p = one(r);
              return p && r.mech === 'SR' ? { type: 0, sym: 'SR', reactant: a, label: X + '2, hν', product: p } : null;
            },
            sear() {
              const s = ctx.pick(['c1ccccc1', 'c1ccccc1', 'O=[N+]([O-])c1ccccc1']);
              const e = ctx.pick([['Br', 'Br2, FeBr3'], ['Cl', 'Cl2, AlCl3'], ['NO2', 'HNO3, H2SO4'], ['SO3H', 'H2SO4, SO3'], ['CH3', 'CH3Cl, AlCl3']]);
              if (s !== 'c1ccccc1' && e[0] === 'CH3') return null;
              const r = react.run('sear', [s], { E: e[0] });
              const p = one(r);
              return p && r.mech === 'SEAr' ? { type: 0, sym: 'SEAr', reactant: s, label: e[1], product: p } : null;
            },
            an() {
              const c = ctx.pick(['CC=O', 'CCC=O', 'C=O', 'CC(C)=O', 'CCC(C)=O', 'c1ccccc1C=O', 'CCCC=O', 'CC(=O)CC']);
              const w = ctx.pick([['co.nabh4', 'NaBH4'], ['co.hcn', 'HCN']]);
              const r = react.run(w[0], [c]);
              const p = one(r);
              return p && r.mech === 'AN' ? { type: 1, sym: 'AN', reactant: c, label: w[1], product: p } : null;
            },
            h2() {
              const a = ctx.pick(['C=C', 'CC=C', 'CC=CC', 'CC(C)=C', 'C1=CCCCC1', 'CCC=C']);
              const r = react.run('ae.h2', [a]);
              const p = one(r);
              return p ? { type: 1, sym: null, reactant: a, label: 'H2, Pd', product: p } : null;
            },
            rearr() {
              const pr = ctx.pick([['C=CCC', 'CC=CC'], ['OCC(=O)CO', 'OCC(O)C=O'], ['C=CO', 'CC=O'], ['C=C(O)C', 'CC(C)=O']]);
              return { type: 3, sym: null, reactant: pr[0], label: null, product: pr[1] };
            }
          };
          const NAMES = ['sn2', 'sn2', 'sn1', 'e2', 'e1', 'ae', 'ae', 'sr', 'sear', 'an', 'h2', 'rearr'];
          let c = null;
          for (let tries = 0; tries < 80 && !c; tries++) c = B[ctx.pick(NAMES)]();
          if (!c) throw new Error('u03.rtype: nothing built');

          const TYPE = [t('Pakeitimo reakcija', 'Substitution'), t('Jungimosi reakcija', 'Addition'), t('Eliminavimo reakcija', 'Elimination'), t('Persigrupavimo reakcija', 'Rearrangement')];
          const typeWhy = [
            t('Viena grupė ar atomas pakeičiamas kitu: dvi reaguojančios dalelės pasikeičia dalimis.', 'One group or atom is replaced by another: two reacting particles exchange parts.'),
            t('Prie dvigubojo ryšio ($C=C$ ar $C=O$) prisijungia reagento dalys, ryšys sutrumpėja iki viengubojo.', 'Parts of the reagent add to a double bond ($C=C$ or $C=O$), which becomes a single bond.'),
            t('Iš molekulės pasitraukia maža molekulė ($HX$ ar $H2O$) ir susidaro dvigubasis ryšys.', 'A small molecule ($HX$ or $H2O$) leaves the molecule and a double bond forms.'),
            t('Produktas yra pradinio junginio izomeras: formulė nekinta, persitvarko ryšiai ir atomai.', 'The product is an isomer of the starting compound: the formula does not change, bonds and atoms are reorganised.')
          ];
          const SYMTXT = {
            SN2: t('Pirminis halogenalkanas su stipriu nukleofilu: nukleofilas atakuoja anglį, o halogenas išeina vienu metu.', 'A primary haloalkane with a strong nucleophile: the nucleophile attacks carbon while the halogen leaves at the same time.'),
            SN1: t('Tretinis halogenalkanas silpname nukleofile (vandenyje, alkoholyje): pirma susidaro karbokatijonas, po to jį atakuoja nukleofilas.', 'A tertiary haloalkane in a weak nucleophile (water, alcohol): a carbocation forms first and the nucleophile then attacks it.'),
            SR: t('Alkanas su halogenu šviesoje ar kaitinant: radikalinis pakeitimas.', 'An alkane with a halogen under light or heat: radical substitution.'),
            SEAr: t('Arenas su elektrofilu ir katalizatoriumi: elektrofilas pakeičia vandenilį žiede.', 'An arene with an electrophile and a catalyst: the electrophile replaces a hydrogen on the ring.'),
            AE: t('Alkenas su elektrofilu ($H+$, halogenas): $π$ ryšys atakuoja elektrofilą, po to prisijungia nukleofilas.', 'An alkene with an electrophile ($H+$, halogen): the $π$ bond attacks the electrophile and then the nucleophile adds.'),
            AN: t('Karbonilo junginys su nukleofilu ($H-$ iš $NaBH4$, $CN-$): nukleofilas atakuoja karbonilo anglį.', 'A carbonyl compound with a nucleophile ($H-$ from $NaBH4$, $CN-$): the nucleophile attacks the carbonyl carbon.'),
            E1: t('Alkoholio dehidratacija rūgštyje kaitinant: eliminavimas per karbokatijoną.', 'Dehydration of an alcohol in hot acid: elimination through a carbocation.'),
            E2: t('Halogenalkanas su stipria baze (KOH alkoholyje): vienos stadijos eliminavimas.', 'A haloalkane with a strong base (KOH in alcohol): one-stage elimination.')
          };
          const FAMILY = { 0: ['SN1', 'SN2', 'SR', 'SEAr'], 1: ['AE', 'AN', 'SR', 'SN2'], 2: ['E1', 'E2', 'SN1', 'SN2'] };
          const RT = { SN1: 0, SN2: 0, AN: 0, AE: 1, SEAr: 1, SR: 2 };       // 0 nucleophilic, 1 electrophilic, 2 radical
          const RTWHY = [
            t('Atakuoja nukleofilas: laisvąją elektronų porą turinti dalelė.', 'A nucleophile attacks: a particle with a lone pair.'),
            t('Atakuoja elektrofilas: dalelė, priimanti elektronų porą.', 'An electrophile attacks: a particle that accepts an electron pair.'),
            t('Atakuoja radikalas: dalelė su nesuporuotu elektronu.', 'A radical attacks: a particle with an unpaired electron.')
          ];

          const items = [{ smi: c.reactant }, c.label ? { arrow: '→', above: f(c.label) } : { arrow: '→' }, { smi: c.product }];
          const steps = [{
            prompt: t('Kokiam tipui priskirtumėte šią reakciją?', 'What type of reaction is this?'),
            kind: 'choice', options: TYPE.map((x) => ({ text: x })), answer: c.type,
            hint: t('Palyginkite, kiek dalelių reaguoja ir kiek jų susidaro, ir ką pakeitė skirtumas tarp formulių.', 'Compare how many particles react and how many form, and what the difference between the formulas is.'),
            solution: typeWhy[c.type]
          }];
          if (c.sym) {
            const fam = FAMILY[c.type];
            steps.push({
              prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
              kind: 'choice', options: fam.map((x) => ({ text: f(x) })), answer: fam.indexOf(c.sym),
              hint: t('Atsižvelkite į substratą ir sąlygas: ar tai šviesa, rūgštis, stipri bazė, ar nukleofilas?', 'Take the substrate and the conditions into account: light, acid, strong base or nucleophile?'),
              solution: SYMTXT[c.sym]
            });
            if (RT[c.sym] !== undefined) {
              steps.push({
                prompt: t('Kokio tipo yra atakuojantis reagentas?', 'What kind of reagent attacks?'),
                kind: 'choice', options: [{ text: t('Nukleofilas', 'Nucleophile') }, { text: t('Elektrofilas', 'Electrophile') }, { text: t('Laisvasis radikalas', 'Free radical') }], answer: RT[c.sym],
                hint: t('Ar atakuojanti dalelė turi laisvąją porą, tuščią orbitalę ar nesuporuotą elektroną?', 'Does the attacking particle have a lone pair, an empty orbital or an unpaired electron?'),
                solution: RTWHY[RT[c.sym]]
              });
            }
          }
          return {
            q: [{ p: t('Išnagrinėkite reakciją.', 'Examine the reaction.') }, { scheme: { items } }],
            steps,
            why: t('Reakcijos tipą nusako, kas vyksta su dalelėmis: pakeitimas (2 → 2), jungimasis (2 → 1), eliminavimas (1 → 2), persigrupavimas (1 → 1, izomeras). Simbolis papildomai parodo atakuojantį reagentą: $SN$ nukleofilinis, $SE$ elektrofilinis, $SR$ radikalinis.', 'The type of a reaction is set by what happens to the particles: substitution (2 → 2), addition (2 → 1), elimination (1 → 2), rearrangement (1 → 1, an isomer). The symbol also shows the attacking reagent: $SN$ nucleophilic, $SE$ electrophilic, $SR$ radical.'),
            src: 'L3 p32'
          };
        }
      },
      /* ============ u03.arrows: choose the curved arrows for a reaction (bank) ============ */
      {
        id: 'u03.arrows',
        title: t('Lenktų rodyklių parinkimas reakcijoje', 'Choosing the curved arrows of a reaction'),
        mirrors: ['S2.14'],
        bank: [
          {
            id: 'u03.arrows.1',
            q: [{ p: t('Amoniakas reaguoja su vandenilio bromidu.', 'Ammonia reacts with hydrogen bromide.') }, { scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: '[NH4+]' }, { plus: true }, { smi: '[Br-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo azoto laisvosios poros prie $H$ atomo', 'from the nitrogen lone pair to the $H$ atom'], ['nuo $H−Br$ ryšio prie bromo', 'from the $H−Br$ bond to bromine']) },
                  { text: A(['nuo $H$ atomo prie azoto', 'from the $H$ atom to nitrogen'], ['nuo bromo prie $H−Br$ ryšio', 'from bromine to the $H−Br$ bond']) },
                  { text: A(['nuo azoto laisvosios poros prie $H$ atomo', 'from the nitrogen lone pair to the $H$ atom']) },
                  { text: A(['nuo azoto laisvosios poros prie $H$ atomo', 'from the nitrogen lone pair to the $H$ atom'], ['nuo $H−Br$ ryšio prie azoto', 'from the $H−Br$ bond to nitrogen']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Pora iš azoto sudaro naują $N−H$ ryšį. Vandenilis negali turėti daugiau nei dviejų elektronų, todėl $H−Br$ elektronai pereina bromui.', 'The pair from nitrogen forms a new $N−H$ bond. Hydrogen cannot hold more than two electrons, so the $H−Br$ electrons move to bromine.') }, {
                  mech: [{ scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: '[NH4+]' }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }]
                }]
              },
              {
                prompt: t('Kuri dalelė šioje reakcijoje yra nukleofilas?', 'Which particle is the nucleophile in this reaction?'),
                kind: 'choice',
                options: [{ text: f('$NH3$') }, { text: f('$HBr$') }, { text: f('$NH4+$') }],
                answer: 0,
                hint: t('Nukleofilas turi laisvąją elektronų porą, kurią atiduoda.', 'A nucleophile has a lone pair that it gives away.'),
                solution: t('Amoniakas atiduoda azoto laisvąją porą protonui: tai nukleofilas (ir bazė).', 'Ammonia gives its nitrogen lone pair to the proton: it is the nucleophile (and a base).')
              }
            ],
            why: t('Protono pernešimas visada reikalauja dviejų rodyklių: nuo bazės poros prie $H$ ir nuo $H−A$ ryšio prie $A$. Taip išsaugomas vandenilio dubletas.', 'A proton transfer always needs two arrows: from the lone pair of the base to $H$ and from the $H−A$ bond to $A$. This keeps the duet of hydrogen.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.2',
            q: [{ p: t('Hidroksido jonas reaguoja su metilo jodidu.', 'The hydroxide ion reacts with methyl iodide.') }, { scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[I-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo deguonies laisvosios poros prie anglies', 'from an oxygen lone pair to carbon'], ['nuo $C−I$ ryšio prie jodo', 'from the $C−I$ bond to iodine']) },
                  { text: A(['nuo anglies prie deguonies', 'from carbon to oxygen'], ['nuo jodo prie $C−I$ ryšio', 'from iodine to the $C−I$ bond']) },
                  { text: A(['nuo deguonies laisvosios poros prie jodo', 'from an oxygen lone pair to iodine'], ['nuo $C−I$ ryšio prie anglies', 'from the $C−I$ bond to carbon']) },
                  { text: A(['nuo deguonies laisvosios poros prie anglies', 'from an oxygen lone pair to carbon']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Anglis jau turi oktetą, todėl, kai deguonies pora sudaro $C−O$ ryšį, $C−I$ elektronai turi pereiti jodui.', 'Carbon already has an octet, so when the oxygen pair forms the $C−O$ bond the $C−I$ electrons have to go to iodine.') }, {
                  mech: [{ scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[I-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }]
                }]
              },
              {
                prompt: t('Kuri dalelė yra elektrofilas?', 'Which particle is the electrophile?'),
                kind: 'choice',
                options: [{ text: f('$CH3I$') }, { text: f('$HO-$') }, { text: f('$I-$') }],
                answer: 0,
                hint: t('Elektrofilas turi $δ+$ atomą, kuris priima elektronų porą.', 'An electrophile has a $δ+$ atom that accepts an electron pair.'),
                solution: t('Metilo jodide anglis turi $δ+$ dėl jodo, todėl $CH3I$ yra elektrofilas.', 'In methyl iodide carbon has $δ+$ because of iodine, so $CH3I$ is the electrophile.')
              }
            ],
            why: t('Pakeitimo reakcijoje nukleofilo pora sudaro naują ryšį, o senasis ryšys nutrūksta ir pora pereina išeinančiajai grupei: visada dvi rodyklės.', 'In a substitution the pair of the nucleophile forms the new bond while the old bond breaks and its pair goes to the leaving group: always two arrows.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.3',
            q: [{ p: t('Acetono enolato jonas reaguoja su metilo bromidu ir sudaro naują $C−C$ ryšį.', 'The enolate ion of acetone reacts with methyl bromide and forms a new $C−C$ bond.') }, { scheme: { items: [{ smi: 'CC(=O)[CH2-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'CC(=O)CC' }, { plus: true }, { smi: '[Br-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo karbanijono anglies laisvosios poros prie $CH3$ anglies', 'from the lone pair of the carbanion carbon to the $CH3$ carbon'], ['nuo $C−Br$ ryšio prie bromo', 'from the $C−Br$ bond to bromine']) },
                  { text: A(['nuo $CH3$ anglies prie karbanijono anglies', 'from the $CH3$ carbon to the carbanion carbon'], ['nuo bromo prie $C−Br$ ryšio', 'from bromine to the $C−Br$ bond']) },
                  { text: A(['nuo karbonilo deguonies laisvosios poros prie $CH3$ anglies', 'from a lone pair of the carbonyl oxygen to the $CH3$ carbon'], ['nuo $C−Br$ ryšio prie bromo', 'from the $C−Br$ bond to bromine']) },
                  { text: A(['nuo karbanijono anglies laisvosios poros prie bromo', 'from the lone pair of the carbanion carbon to bromine'], ['nuo $C−Br$ ryšio prie anglies', 'from the $C−Br$ bond to carbon']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Karbanijono anglies pora sudaro naują $C−C$ ryšį, o $C−Br$ elektronai pereina bromui.', 'The pair of the carbanion carbon forms the new $C−C$ bond and the $C−Br$ electrons go to bromine.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CC(=O)[CH2-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'CC(=O)CC' }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }]
                }]
              },
              {
                prompt: t('Koks yra mechanizmo simbolis?', 'What is the symbol of the mechanism?'),
                kind: 'choice',
                options: [{ text: f('SN2') }, { text: f('SN1') }, { text: f('AE') }, { text: f('SR') }],
                answer: 0,
                hint: t('Nukleofilas atakuoja anglį, o halogenas išeina vienu metu.', 'The nucleophile attacks carbon while the halogen leaves at the same time.'),
                solution: t('Nukleofilas pakeičia halogeną pirminėje anglyje vienoje stadijoje: SN2.', 'The nucleophile replaces the halogen on a primary carbon in one stage: SN2.')
              }
            ],
            why: t('Karbanijonas yra nukleofilas: jo laisvoji pora sudaro $C−C$ ryšį. Šitaip statomas anglies skeletas.', 'A carbanion is a nucleophile: its lone pair forms a $C−C$ bond. This is how a carbon skeleton is built.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.4',
            q: [{ p: t('Tetraedrinis anijonas suyra, išstumdamas chlorido joną.', 'A tetrahedral anion collapses, expelling a chloride ion.') }, { scheme: { items: [{ smi: 'CC([O-])(Cl)OC', opts: { lonePairs: [2] } }, { arrow: '→' }, { smi: 'CC(=O)OC' }, { plus: true }, { smi: '[Cl-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo deguonies anijono laisvosios poros į ryšį tarp anglies ir deguonies ($C=O$ susidarymas)', 'from a lone pair of the oxide oxygen into the bond between carbon and oxygen (forming $C=O$)'], ['nuo $C−Cl$ ryšio prie chloro', 'from the $C−Cl$ bond to chlorine']) },
                  { text: A(['nuo deguonies anijono laisvosios poros prie chloro', 'from a lone pair of the oxide oxygen to chlorine'], ['nuo $C−Cl$ ryšio prie anglies', 'from the $C−Cl$ bond to carbon']) },
                  { text: A(['nuo deguonies anijono laisvosios poros į ryšį tarp anglies ir deguonies ($C=O$ susidarymas)', 'from a lone pair of the oxide oxygen into the bond between carbon and oxygen (forming $C=O$)'], ['nuo $C−OCH3$ ryšio prie deguonies', 'from the $C−OCH3$ bond to oxygen']) },
                  { text: A(['nuo $C−Cl$ ryšio prie deguonies anijono', 'from the $C−Cl$ bond to the oxide oxygen'], ['nuo deguonies laisvosios poros prie anglies', 'from an oxygen lone pair to carbon']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Deguonies pora sudaro $π$ ryšį su anglimi, todėl iš anglies turi išeiti viena grupė. Chloras yra geresnė išeinanti grupė už metoksidą: jam pereina $C−Cl$ elektronai.', 'The oxygen pair forms a $π$ bond with carbon, so one group has to leave carbon. Chlorine is a better leaving group than methoxide: the $C−Cl$ electrons go to it.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CC([O-])(Cl)OC', opts: { lonePairs: [2] } }, { arrow: '→' }, { smi: 'CC(=O)OC' }, { plus: true }, { smi: '[Cl-]' }] }, arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, b: [1, 2] } }, { from: { m: 0, b: [1, 3] }, to: { m: 0, a: 3 } }] }]
                }]
              },
              {
                prompt: t('Kokia dalelė išeina kaip išeinančioji grupė?', 'Which particle leaves as the leaving group?'),
                kind: 'choice',
                options: [{ text: f('$Cl-$') }, { text: f('$CH3O-$') }, { text: f('$CH3-$') }],
                answer: 0,
                hint: t('Išeinančioji grupė yra silpniausia bazė iš galimų.', 'The leaving group is the weakest base of the possible ones.'),
                solution: t('Chloridas yra labai silpna bazė ir stabilus anijonas, todėl geriausiai išeina. $CH3-$ praktiškai niekada neišeina.', 'Chloride is a very weak base and a stable anion, so it leaves best. $CH3-$ practically never leaves.')
              }
            ],
            why: t('Kai deguonies pora grįžta sudaryti $C=O$, oktetas išsaugomas tik išstūmus geriausią išeinančią grupę. Taip vyksta karboksirūgščių darinių reakcijos.', 'When an oxygen pair comes back to form $C=O$ the octet is kept only if the best leaving group is expelled. This is how reactions of carboxylic acid derivatives proceed.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.5',
            q: [{ p: t('2-Metilpropenas reaguoja su vandenilio bromidu (pirmoji stadija).', '2-Methylpropene reacts with hydrogen bromide (first stage).') }, { scheme: { items: [{ smi: 'C=C(C)C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'C[C+](C)C' }, { plus: true }, { smi: '[Br-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo $C=C$ $π$ ryšio prie $H$ atomo', 'from the $C=C$ $π$ bond to the $H$ atom'], ['nuo $H−Br$ ryšio prie bromo', 'from the $H−Br$ bond to bromine']) },
                  { text: A(['nuo $H$ atomo prie $C=C$ ryšio', 'from the $H$ atom to the $C=C$ bond'], ['nuo bromo prie $H−Br$ ryšio', 'from bromine to the $H−Br$ bond']) },
                  { text: A(['nuo bromo laisvosios poros prie $C=C$ ryšio', 'from a lone pair of bromine to the $C=C$ bond']) },
                  { text: A(['nuo $C=C$ $π$ ryšio prie $H$ atomo', 'from the $C=C$ $π$ bond to the $H$ atom']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Alkeno $π$ ryšys yra nukleofilas: jo pora sudaro $C−H$ ryšį, o $H−Br$ elektronai pereina bromui.', 'The $π$ bond of the alkene is the nucleophile: its pair forms the $C−H$ bond and the $H−Br$ electrons go to bromine.') }, {
                  mech: [{ scheme: { items: [{ smi: 'C=C(C)C' }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'C[C+](C)C' }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }]
                }]
              },
              {
                prompt: t('Kuris atomas gauna protoną, kad susidarytų stabilesnis katijonas?', 'Which atom receives the proton so that the more stable cation forms?'),
                kind: 'atoms', mol: { smi: 'C=C(C)C', opts: { numbers: 'all' } }, answer: [0],
                hint: t('Teigiamas krūvis turi atsirasti prie anglies su daugiau pakaitų.', 'The positive charge has to appear on the carbon with more substituents.'),
                solution: t('Protonas jungiasi prie atomo Nr. 1 ($CH2$), o teigiamas krūvis lieka ant tretinės anglies Nr. 2.', 'The proton bonds to atom no. 1 ($CH2$), and the positive charge stays on the tertiary carbon no. 2.')
              }
            ],
            why: t('Alkenas elgiasi kaip nukleofilas: $π$ ryšys yra elektronų šaltinis ir rodyklė prasideda nuo jo.', 'An alkene behaves as a nucleophile: the $π$ bond is the electron source and the arrow starts from it.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.6',
            q: [{ p: t('Acetonas protonuojamas vandenilio chloridu.', 'Acetone is protonated by hydrogen chloride.') }, { scheme: { items: [{ smi: 'CC(C)=O', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'CC(C)=[OH+]' }, { plus: true }, { smi: '[Cl-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo karbonilo deguonies laisvosios poros prie $H$ atomo', 'from a lone pair of the carbonyl oxygen to the $H$ atom'], ['nuo $H−Cl$ ryšio prie chloro', 'from the $H−Cl$ bond to chlorine']) },
                  { text: A(['nuo $C=O$ $π$ ryšio prie $H$ atomo', 'from the $C=O$ $π$ bond to the $H$ atom'], ['nuo $H−Cl$ ryšio prie chloro', 'from the $H−Cl$ bond to chlorine']) },
                  { text: A(['nuo $H$ atomo prie deguonies', 'from the $H$ atom to oxygen'], ['nuo chloro prie $H−Cl$ ryšio', 'from chlorine to the $H−Cl$ bond']) },
                  { text: A(['nuo karbonilo deguonies laisvosios poros prie $H$ atomo', 'from a lone pair of the carbonyl oxygen to the $H$ atom']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Deguonis turi laisvųjų porų, todėl jos atiduodamos protonui, o $H−Cl$ ryšys suyra.', 'Oxygen has lone pairs, so one is given to the proton and the $H−Cl$ bond breaks.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CC(C)=O', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'Cl', opts: { allH: true } }, { arrow: '→' }, { smi: 'CC(C)=[OH+]' }, { plus: true }, { smi: '[Cl-]' }] }, arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }]
                }]
              },
              {
                prompt: t('Kuo šioje reakcijoje yra acetonas?', 'What is acetone in this reaction?'),
                kind: 'choice',
                options: [{ text: t('Bazė (nukleofilas)', 'A base (nucleophile)') }, { text: t('Rūgštis (elektrofilas)', 'An acid (electrophile)') }, { text: t('Radikalas', 'A radical') }],
                answer: 0,
                hint: t('Ar acetonas atiduoda, ar priima protoną?', 'Does acetone give or take the proton?'),
                solution: t('Acetonas priima protoną naudodamas deguonies laisvąją porą: tai bazė, o $HCl$ – rūgštis.', 'Acetone accepts the proton with a lone pair of oxygen: it is a base, and $HCl$ is the acid.')
              }
            ],
            why: t('Karbonilo deguonis laisvąją porą gali atiduoti protonui; rodyklė prasideda ne nuo $π$ ryšio, kol yra laisvoji pora.', 'The carbonyl oxygen can give a lone pair to a proton; the arrow does not start from the $π$ bond while a lone pair is available.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.7',
            q: [{ p: t('Amoniakas reaguoja su metilo bromidu.', 'Ammonia reacts with methyl bromide.') }, { scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'C[NH3+]' }, { plus: true }, { smi: '[Br-]' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo azoto laisvosios poros prie anglies', 'from the nitrogen lone pair to carbon'], ['nuo $C−Br$ ryšio prie bromo', 'from the $C−Br$ bond to bromine']) },
                  { text: A(['nuo azoto laisvosios poros prie bromo', 'from the nitrogen lone pair to bromine'], ['nuo $C−Br$ ryšio prie anglies', 'from the $C−Br$ bond to carbon']) },
                  { text: A(['nuo anglies prie azoto', 'from carbon to nitrogen'], ['nuo bromo prie $C−Br$ ryšio', 'from bromine to the $C−Br$ bond']) },
                  { text: A(['nuo azoto laisvosios poros prie anglies', 'from the nitrogen lone pair to carbon']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Azoto pora sudaro $N−C$ ryšį, todėl iš anglies pasitraukia $C−Br$ elektronai.', 'The nitrogen pair forms the $N−C$ bond, so the $C−Br$ electrons leave carbon.') }, {
                  mech: [{ scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'C[NH3+]' }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }]
                }]
              },
              {
                prompt: t('Koks yra azoto formalusis krūvis produkte?', 'What is the formal charge of nitrogen in the product?'),
                kind: 'choice',
                options: [{ text: t('+1: azotas turi keturis ryšius', '+1: nitrogen has four bonds') }, { text: t('0: azotas turi tris ryšius', '0: nitrogen has three bonds') }, { text: t('−1: azotas turi laisvąją porą', '−1: nitrogen has a lone pair') }],
                answer: 0,
                hint: t('Suskaičiuokite ryšius prie azoto produkte.', 'Count the bonds at nitrogen in the product.'),
                solution: t('Azotas atidavė porą ir turi keturis ryšius be laisvosios poros, todėl krūvis +1.', 'Nitrogen gave its pair and has four bonds without a lone pair, so its charge is +1.')
              }
            ],
            why: t('Neutralus nukleofilas po atakos įgyja teigiamą formalųjį krūvį, nes atidavė elektronų porą. Todėl produktas yra jonas.', 'A neutral nucleophile gains a positive formal charge after the attack because it gave away an electron pair. That is why the product is an ion.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.8',
            q: [{ p: t('Bromido anijonas jungiasi prie tretinio karbokatijono.', 'A bromide anion bonds to a tertiary carbocation.') }, { scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[C+](C)C' }, { arrow: '→' }, { smi: 'CC(C)(C)Br' }] } }],
            steps: [
              {
                prompt: t('Kiek ir kokių rodyklių reikia?', 'How many arrows, and which ones, are needed?'),
                kind: 'choice',
                options: [
                  { text: t('Viena: nuo bromido laisvosios poros prie teigiamos anglies.', 'One: from a lone pair of bromide to the positive carbon.') },
                  { text: t('Viena: nuo teigiamos anglies prie bromido.', 'One: from the positive carbon to bromide.') },
                  { text: t('Dvi: nuo bromido poros prie anglies ir nuo $C−CH3$ ryšio prie anglies.', 'Two: from the bromide pair to carbon and from a $C−CH3$ bond to carbon.') },
                  { text: t('Viena: nuo bromido laisvosios poros prie metilo grupės vandenilio.', 'One: from a lone pair of bromide to a hydrogen of a methyl group.') }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Katijono anglis turi tuščią $p$ orbitalę (sekstetą), todėl pora gali ateiti ir niekas neturi išeiti: pakanka vienos rodyklės.', 'The cation carbon has an empty $p$ orbital (a sextet), so a pair can arrive and nothing has to leave: one arrow is enough.') }, {
                  mech: [{ scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[C+](C)C' }, { arrow: '→' }, { smi: 'CC(C)(C)Br' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }] }]
                }]
              }
            ],
            why: t('Antrosios rodyklės reikia tik tada, kai atomas po atakos viršytų oktetą. Katijonas oktetą tik užpildo.', 'A second arrow is needed only if the atom would exceed an octet after the attack. A cation merely completes its octet.'),
            src: 'S2.14'
          },
          {
            id: 'u03.arrows.9',
            q: [{ p: t('Metanolis atakuoja etanoilo chlorido karbonilo anglį (pirmoji stadija).', 'Methanol attacks the carbonyl carbon of ethanoyl chloride (first stage).') }, { scheme: { items: [{ smi: 'CO', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC([O-])(Cl)[OH+]C' }] } }],
            steps: [
              {
                prompt: t('Kurie lenktų rodyklių pavaizdavimas teisingas?', 'Which description of the curved arrows is correct?'),
                kind: 'choice',
                options: [
                  { text: A(['nuo metanolio deguonies laisvosios poros prie karbonilo anglies', 'from a lone pair of the methanol oxygen to the carbonyl carbon'], ['nuo $C=O$ $π$ ryšio prie deguonies', 'from the $C=O$ $π$ bond to oxygen']) },
                  { text: A(['nuo metanolio deguonies laisvosios poros prie karbonilo anglies', 'from a lone pair of the methanol oxygen to the carbonyl carbon'], ['nuo $C−Cl$ ryšio prie chloro', 'from the $C−Cl$ bond to chlorine']) },
                  { text: A(['nuo karbonilo deguonies prie metanolio deguonies', 'from the carbonyl oxygen to the methanol oxygen'], ['nuo $π$ ryšio prie anglies', 'from the $π$ bond to carbon']) },
                  { text: A(['nuo metanolio deguonies laisvosios poros prie chloro', 'from a lone pair of the methanol oxygen to chlorine']) }
                ],
                answer: 0,
                hint: ARROW_HINT,
                solution: [{ p: t('Karbonilo anglis jau turi oktetą, todėl priėjus deguonies porai, $π$ ryšio elektronai pereina deguoniui, kuris tampa anijonu. Chloras kol kas lieka.', 'The carbonyl carbon already has an octet, so when the oxygen pair arrives the $π$ electrons go to oxygen, which becomes an anion. Chlorine stays for now.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CO', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC([O-])(Cl)[OH+]C' }] }, arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }]
                }]
              }
            ],
            why: t('Neutralus nukleofilas ir polinė $C=O$ grupė: pirmoji rodyklė sudaro ryšį, antroji išsaugo oktetą perkeldama $π$ elektronus į deguonį.', 'A neutral nucleophile and a polar $C=O$ group: the first arrow forms the bond, the second keeps the octet by moving the $π$ electrons to oxygen.'),
            src: 'S2.14'
          }
        ]
      },
      /* ============ u03.products: predict the products from the curved arrows (bank) ============ */
      {
        id: 'u03.products',
        title: t('Produktai pagal lenktas rodykles', 'Products from the curved arrows'),
        mirrors: ['S2.15'],
        bank: [
          {
            id: 'u03.products.1',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktus.', 'Taking the movement of the electron pairs into account, predict the products of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(=O)O', opts: { allH: true } }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H3' } }, { from: { m: 1, b: [3, 'H3'] }, to: { m: 1, a: 3 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokie produktai susidaro?', 'Which products form?'),
                kind: 'choice',
                options: [pairOpt('CC(=O)[O-]', 'O'), { scheme: { items: [{ smi: 'CC(O)([O-])O' }] } }, pairOpt('[CH2-]C(=O)O', 'O')],
                answer: 0,
                hint: t('Pirmoji rodyklė eina prie vandenilio, ne prie anglies.', 'The first arrow goes to a hydrogen, not to a carbon.'),
                solution: [{ p: t('Hidroksido pora sudaro $O−H$ ryšį su rūgšties vandeniliu, o $O−H$ elektronai pereina rūgšties deguoniui: susidaro vanduo ir acetato jonas.', 'The hydroxide pair forms an $O−H$ bond with the acid hydrogen and the $O−H$ electrons go to the acid oxygen: water and the acetate ion form.') }, {
                  mech: [{ scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(=O)O', opts: { allH: true } }, { arrow: '→' }, { smi: 'O' }, { plus: true }, { smi: 'CC(=O)[O-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H3' } }, { from: { m: 1, b: [3, 'H3'] }, to: { m: 1, a: 3 } }] }]
                }]
              },
              {
                prompt: t('Kokio tipo reakcija tai?', 'What kind of reaction is this?'),
                kind: 'choice',
                options: [{ text: t('Rūgščių ir bazių reakcija (protono pernešimas)', 'An acid–base reaction (proton transfer)') }, { text: t('Nukleofilinis jungimasis prie $C=O$', 'Nucleophilic addition to $C=O$') }, { text: t('Eliminavimas', 'Elimination') }],
                answer: 0,
                hint: t('Ar rodyklių galas nukreiptas į anglį, ar į vandenilį?', 'Do the arrowheads point to a carbon or to a hydrogen?'),
                solution: t('Judantis protonas rodo rūgščių ir bazių reakciją.', 'A moving proton means an acid–base reaction.')
              }
            ],
            why: t('Rodyklių rinkinys iš karto parodo reakcijos tipą: poros eina prie $H$ – protono pernešimas, prie anglies – nukleofilinė ataka.', 'The set of arrows immediately shows the type of reaction: pairs going to $H$ mean proton transfer, pairs going to carbon a nucleophilic attack.'),
            src: 'S2.15'
          },
          {
            id: 'u03.products.2',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktus.', 'Taking the movement of the electron pairs into account, predict the products of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(C)=O', opts: { allH: true } }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, b: [0, 1] } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokie produktai susidaro?', 'Which products form?'),
                kind: 'choice',
                options: [pairOpt('C=C([O-])C', 'O'), { scheme: { items: [{ smi: 'CC(C)([O-])O' }] } }, pairOpt('C=C(O)C', '[OH-]')],
                answer: 0,
                hint: t('Sekite pirmąją rodyklę: ji nukreipta į $α$ vandenilį, o ne į karbonilo anglį.', 'Follow the first arrow: it points to an $α$ hydrogen and not to the carbonyl carbon.'),
                solution: [{ p: t('Hidroksidas atplėšia $α$ protoną, $C−H$ elektronai sudaro $C=C$ ryšį, o $C=O$ $π$ elektronai pereina deguoniui. Susidaro enolato jonas ir vanduo.', 'Hydroxide removes the $α$ proton, the $C−H$ electrons form the $C=C$ bond and the $C=O$ $π$ electrons go to oxygen. The enolate ion and water form.') }, {
                  mech: [{ scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(C)=O', opts: { allH: true } }, { arrow: '→' }, { smi: 'O' }, { plus: true }, { smi: 'C=C([O-])C' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, b: [0, 1] } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }]
                }]
              },
              {
                prompt: t('Kuris atomas produkte turi neigiamą formalųjį krūvį?', 'Which atom of the organic product carries the negative formal charge?'),
                kind: 'atoms', mol: { smi: 'C=C([O-])C', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Pažiūrėkite, kuris atomas gavo $π$ elektronus iš $C=O$ ryšio.', 'Look at which atom received the $π$ electrons from the $C=O$ bond.'),
                solution: t('Deguonis (Nr. 3) gavo $C=O$ $π$ elektronus, todėl turi neigiamą krūvį; rezonansas jį dalija su galine anglimi.', 'Oxygen (no. 3) received the $C=O$ $π$ electrons and so carries the negative charge; resonance shares it with the terminal carbon.')
              }
            ],
            why: t('Trys rodyklės viena po kitos perneša protoną ir $π$ elektronus: tai enolato susidarymas, pirmas aldolinės reakcijos žingsnis.', 'Three arrows in succession transfer the proton and the $π$ electrons: this is the formation of an enolate, the first stage of the aldol reaction.'),
            src: 'S2.15'
          },
          {
            id: 'u03.products.3',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktus.', 'Taking the movement of the electron pairs into account, predict the products of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: 'CC(C)([O-])OC', opts: { lonePairs: [3] } }] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 0, b: [1, 3] } }, { from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokie produktai susidaro?', 'Which products form?'),
                kind: 'choice',
                options: [pairOpt('CC(C)=O', 'C[O-]'), pairOpt('CC(=O)OC', '[CH3-]'), pairOpt('C=C(C)OC', '[OH-]')],
                answer: 0,
                hint: t('Pažiūrėkite, kurio ryšio elektronai pereina deguoniui, ir pasakykite, kuris atomas išeina.', 'Look at which bond sends its electrons to oxygen, and say which atom leaves.'),
                solution: [{ p: t('Pora iš $O-$ sudaro $C=O$, o $C−OCH3$ elektronai pereina deguoniui: išeina metoksido jonas ir lieka acetonas.', 'The pair from $O-$ forms $C=O$ and the $C−OCH3$ electrons go to oxygen: the methoxide ion leaves and acetone remains.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CC(C)([O-])OC', opts: { lonePairs: [3] } }, { arrow: '→' }, { smi: 'CC(C)=O' }, { plus: true }, { smi: 'C[O-]' }] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 0, b: [1, 3] } }, { from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }] }]
                }]
              },
              {
                prompt: t('Kuris atomas pasiima $C−O$ ryšio elektronus?', 'Which atom takes the electrons of the $C−O$ bond?'),
                kind: 'atoms', mol: { smi: 'CC(C)([O-])OC', opts: { numbers: 'all' } }, answer: [4],
                hint: t('Pažiūrėkite, kur nukreiptas antrosios rodyklės smaigalys.', 'Look at where the head of the second arrow points.'),
                solution: t('Eterinis deguonis (Nr. 5) pasiima porą ir tampa metoksido anijonu.', 'The ether-type oxygen (no. 5) takes the pair and becomes the methoxide anion.')
              }
            ],
            why: t('Pora iš anijono grįžta sudaryti $C=O$, bet anglis negali turėti daugiau nei aštuonių elektronų: išeina geriausia išeinančioji grupė – čia alkoksidas.', 'The pair from the anion returns to form $C=O$, but carbon cannot hold more than eight electrons: the best leaving group goes, here the alkoxide.'),
            src: 'S2.15'
          },
          {
            id: 'u03.products.4',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktus.', 'Taking the movement of the electron pairs into account, predict the products of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'CBr' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokie produktai susidaro?', 'Which products form?'),
                kind: 'choice',
                options: [pairOpt('C[NH3+]', '[Br-]'), pairOpt('CN', 'Br'), pairOpt('N', 'CBr')],
                answer: 0,
                hint: t('Po rodyklių azotas turi keturis ryšius.', 'After the arrows nitrogen has four bonds.'),
                solution: [{ p: t('Azoto pora sudaro $N−C$ ryšį, o $C−Br$ elektronai pereina bromui: susidaro metilamonio katijonas ir bromido anijonas.', 'The nitrogen pair forms an $N−C$ bond and the $C−Br$ electrons go to bromine: the methylammonium cation and the bromide anion form.') }, {
                  mech: [{ scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'C[NH3+]' }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }]
                }]
              },
              {
                prompt: t('Kokio tipo reakcija tai?', 'What kind of reaction is this?'),
                kind: 'choice',
                options: [{ text: f('SN2') }, { text: f('AE') }, { text: f('E2') }, { text: f('SR') }],
                answer: 0,
                hint: t('Nukleofilas pakeičia halogeną vienoje stadijoje.', 'A nucleophile replaces the halogen in one stage.'),
                solution: t('Nukleofilinis pakeitimas pirminėje anglyje vyksta SN2 mechanizmu.', 'Nucleophilic substitution at a primary carbon goes by the SN2 mechanism.')
              }
            ],
            why: t('Neutralus aminas dėl laisvosios poros yra nukleofilas: jis pakeičia halogeną ir tampa amonio druska.', 'A neutral amine is a nucleophile thanks to its lone pair: it replaces the halogen and becomes an ammonium salt.'),
            src: 'S2.15'
          },
          {
            id: 'u03.products.5',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktus.', 'Taking the movement of the electron pairs into account, predict the products of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: 'CC=CC', opts: { allH: true } }, { plus: true }, { smi: 'Br', opts: { allH: true } }] }, arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokie produktai susidaro po šių dviejų rodyklių?', 'Which products form after these two arrows?'),
                kind: 'choice',
                options: [pairOpt('CC[CH+]C', '[Br-]'), { scheme: { items: [{ smi: 'CCC(C)Br' }] } }, pairOpt('CCC[CH2+]', '[Br-]')],
                answer: 0,
                hint: t('Rodyklės rodo tik pirmąją stadiją, o ne galutinį produktą.', 'The arrows show only the first stage, not the final product.'),
                solution: [{ p: t('$π$ elektronai sudaro $C−H$ ryšį, todėl viena anglis lieka su sekstetu. Bromas pasiima $H−Br$ elektronus ir tampa bromidu.', 'The $π$ electrons form the $C−H$ bond, so one carbon is left with a sextet. Bromine takes the $H−Br$ electrons and becomes bromide.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CC=CC', opts: { allH: true } }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'CC[CH+]C' }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }]
                }]
              },
              {
                prompt: t('Kokio tipo yra susidariusi tarpinė dalelė?', 'What kind of intermediate has formed?'),
                kind: 'choice',
                options: [{ text: t('Antrinis karbokatijonas', 'A secondary carbocation') }, { text: t('Pirminis karbokatijonas', 'A primary carbocation') }, { text: t('Karbanijonas', 'A carbanion') }, { text: t('Radikalas', 'A radical') }],
                answer: 0,
                hint: t('Suskaičiuokite anglies atomus, prisijungusius prie teigiamos anglies.', 'Count the carbon atoms attached to the positive carbon.'),
                solution: t('Teigiama anglis turi du anglies kaimynus: tai antrinis karbokatijonas.', 'The positive carbon has two carbon neighbours: it is a secondary carbocation.')
              }
            ],
            why: t('$π$ ryšys kaip nukleofilas atakuoja protoną; pirmoje stadijoje visada susidaro karbokatijonas, ir tik antroje bromidas prie jo prisijungia.', 'The $π$ bond attacks a proton as a nucleophile; the first stage always gives a carbocation and only in the second does bromide add to it.'),
            src: 'S2.15'
          },
          {
            id: 'u03.products.6',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktą.', 'Taking the movement of the electron pairs into account, predict the product of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[C+](C)C' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }] }] }
            ],
            steps: [
              {
                prompt: t('Koks produktas susidaro?', 'Which product forms?'),
                kind: 'choice',
                options: [{ scheme: { items: [{ smi: 'CC(C)(C)Br' }] } }, pairOpt('CC(C)=C', 'Br'), { scheme: { items: [{ smi: 'CC(C)CBr' }] } }],
                answer: 0,
                hint: t('Viena rodyklė baigiasi teigiamoje anglyje.', 'The single arrow ends at the positive carbon.'),
                solution: [{ p: t('Bromido pora sudaro $C−Br$ ryšį su teigiama anglimi: susidaro 2-brom-2-metilpropanas.', 'The bromide pair forms a $C−Br$ bond with the positive carbon: 2-bromo-2-methylpropane forms.') }, {
                  mech: [{ scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[C+](C)C' }, { arrow: '→' }, { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane') }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }] }]
                }]
              }
            ],
            why: t('Rodyklė baigiasi atome, kuriame pora sudaro ryšį. Eliminavimui prireiktų rodyklės į metilo grupės vandenilį, o persigrupavimui – metilo grupės judėjimo, kurio čia nėra.', 'The arrow ends at the atom where the pair forms a bond. Elimination would need an arrow to a hydrogen of a methyl group, and a rearrangement would need a methyl group to move, which is not shown here.'),
            src: 'S2.15',
            claims: [{ name: ['CC(C)(C)Br', t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane')] }]
          },
          {
            id: 'u03.products.7',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktą.', 'Taking the movement of the electron pairs into account, predict the product of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: 'CO', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'CC(=O)Cl' }] }, arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokia dalelė susidaro?', 'Which particle forms?'),
                kind: 'choice',
                options: [{ scheme: { items: [{ smi: 'CC([O-])(Cl)[OH+]C' }] } }, pairOpt('CC(=O)OC', 'Cl'), { scheme: { items: [{ smi: 'CC(O)(Cl)OC' }] } }],
                answer: 0,
                hint: t('Nė viena iš rodyklių nesiekia $C−Cl$ ryšio.', 'Neither arrow touches the $C−Cl$ bond.'),
                solution: [{ p: t('Metanolio pora sudaro $C−O$ ryšį, $C=O$ $π$ elektronai pereina deguoniui. Susidaro tetraedrinė dalelė su $O-$ ir $OH+$; chloras dar neišėjo.', 'The methanol pair forms the $C−O$ bond and the $C=O$ $π$ electrons go to oxygen. A tetrahedral particle with $O-$ and $OH+$ forms; chlorine has not left yet.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CO', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC([O-])(Cl)[OH+]C' }] }, arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }]
                }]
              },
              {
                prompt: t('Kuris atomas produkte turi teigiamą formalųjį krūvį?', 'Which atom of the product carries the positive formal charge?'),
                kind: 'atoms', mol: { smi: 'CC([O-])(Cl)[OH+]C', opts: { numbers: 'all' } }, answer: [4],
                hint: t('Kuris atomas atidavė savo laisvąją porą?', 'Which atom gave away its lone pair?'),
                solution: t('Metanolio deguonis (Nr. 5) atidavė porą ir turi tris ryšius bei teigiamą krūvį.', 'The methanol oxygen (no. 5) gave away a pair and has three bonds and a positive charge.')
              }
            ],
            why: t('Kiekviena rodyklė keičia tik tai, ką rodo: be trečiosios rodyklės chloras lieka, todėl produktas yra tarpinė dalelė, o ne galutinis esteris.', 'Each arrow changes only what it shows: without a third arrow chlorine stays, so the product is an intermediate and not the final ester.'),
            src: 'S2.15'
          },
          {
            id: 'u03.products.8',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktus.', 'Taking the movement of the electron pairs into account, predict the products of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: 'CC(=O)[CH2-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'CBr' }] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokie produktai susidaro?', 'Which products form?'),
                kind: 'choice',
                options: [pairOpt('CC(=O)CC', '[Br-]'), pairOpt('C=C(C)OC', '[Br-]'), pairOpt('CC(=O)CBr', '[CH3-]')],
                answer: 0,
                hint: t('Pirmoji rodyklė prasideda nuo karbanijono anglies, o ne nuo deguonies.', 'The first arrow starts at the carbanion carbon, not at oxygen.'),
                solution: [{ p: t('Karbanijono anglis sudaro $C−C$ ryšį su metilo grupe, o bromas išeina kaip bromidas. Gaunamas butanonas.', 'The carbanion carbon forms a $C−C$ bond with the methyl group and bromine leaves as bromide. Butanone is obtained.') }, {
                  mech: [{ scheme: { items: [{ smi: 'CC(=O)[CH2-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'CBr' }, { arrow: '→' }, { smi: 'CC(=O)CC', name: t('butanonas', 'butan-2-one') }, { plus: true }, { smi: '[Br-]' }] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }]
                }]
              },
              {
                prompt: t('Kuri dalelė šioje reakcijoje yra nukleofilas?', 'Which particle is the nucleophile in this reaction?'),
                kind: 'choice',
                options: [{ text: t('Karbanijonas (enolatas)', 'The carbanion (enolate)') }, { text: f('$CH3Br$') }, { text: f('$Br-$') }],
                answer: 0,
                hint: t('Kuri dalelė atiduoda elektronų porą naujam ryšiui?', 'Which particle gives the electron pair for the new bond?'),
                solution: t('Karbanijonas atiduoda porą ir sudaro $C−C$ ryšį, o $CH3Br$ yra elektrofilas.', 'The carbanion gives the pair and forms the $C−C$ bond, while $CH3Br$ is the electrophile.')
              }
            ],
            why: t('Karbanijonas yra nukleofilas: jo pora ima naują ryšį su elektrofilo anglimi, o išeinančioji grupė pasiima senąją porą.', 'A carbanion is a nucleophile: its pair takes a new bond to the carbon of the electrophile while the leaving group takes the old pair.'),
            src: 'S2.15',
            claims: [{ name: ['CC(=O)CC', t('butanonas', 'butan-2-one')] }]
          },
          {
            id: 'u03.products.9',
            q: [
              { p: t('Pagal rodyklių parodytą elektronų porų judėjimą nustatykite produktą.', 'Taking the movement of the electron pairs into account, predict the product of the reaction.') },
              { mech: [{ scheme: { items: [{ smi: '[C-]#N', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'CC=O' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }] }
            ],
            steps: [
              {
                prompt: t('Kokia dalelė susidaro?', 'Which particle forms?'),
                kind: 'choice',
                options: [{ scheme: { items: [{ smi: 'CC([O-])C#N' }] } }, { scheme: { items: [{ smi: 'CC([O-])[N+]#[C-]' }] } }, pairOpt('CC=O', '[C-]#N')],
                answer: 0,
                hint: t('Prisiminkite, kuris cianido atomas sudaro ryšį su karbonilo anglimi, ir kur nukeliauja $π$ elektronai.', 'Recall which atom of cyanide bonds to the carbonyl carbon and where the $π$ electrons go.'),
                solution: [{ p: t('Cianido anglies pora sudaro $C−C$ ryšį su karbonilo anglimi, $C=O$ $π$ elektronai pereina deguoniui: susidaro alkoksido anijonas.', 'The carbon pair of cyanide forms a $C−C$ bond to the carbonyl carbon and the $C=O$ $π$ electrons go to oxygen: an alkoxide anion forms.') }, {
                  mech: [{ scheme: { items: [{ smi: '[C-]#N', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'CC=O' }, { arrow: '→' }, { smi: 'CC([O-])C#N' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }]
                }]
              },
              {
                prompt: t('Koks mechanizmo simbolis?', 'What is the mechanism symbol?'),
                kind: 'choice',
                options: [{ text: f('AN') }, { text: f('AE') }, { text: f('SN2') }, { text: f('E2') }],
                answer: 0,
                hint: t('Nukleofilas jungiasi prie karbonilo grupės.', 'A nucleophile adds to the carbonyl group.'),
                solution: t('Nukleofilas prijungiamas prie $C=O$: nukleofilinis jungimasis, AN.', 'A nucleophile is added across the $C=O$: nucleophilic addition, AN.')
              }
            ],
            why: t('Karbonilo anglis yra elektrofilinė, todėl nukleofilas ją atakuoja, o $π$ elektronai pereina deguoniui. Gautas anijonas po protonavimo duoda cianhidriną.', 'The carbonyl carbon is electrophilic, so a nucleophile attacks it and the $π$ electrons go to oxygen. The resulting anion gives a cyanohydrin after protonation.'),
            src: 'S2.15'
          }
        ]
      },
      /* ============ u03.redox: oxidation state of carbon, oxidation or reduction (generator + bank) ============ */
      {
        id: 'u03.redox',
        title: t('Oksidacijos laipsnis: oksidacija ar redukcija', 'Oxidation state: oxidation or reduction'),
        mirrors: [],
        gen(rng, ctx) {
          const { react } = ctx;
          const one = (res) => { const m = res.products.filter((p) => p.major); return m.length === 1 ? m[0].smi : null; };
          const MK = {
            alcox() {
              const a = ctx.pick(['CCO', 'CCCO', 'CCCCO', 'CC(C)CO', 'CC(C)O', 'CCC(C)O', 'CCC(O)CC', 'C1CCCCC1O']);
              const reagent = ctx.pick(['PCC', 'chromic']);
              const r = react.run('alc.ox', [a], { reagent });
              const p = one(r);
              return p ? { reactant: a, label: reagent === 'PCC' ? 'PCC' : 'H2CrO4', product: p } : null;
            },
            hydrog() {
              const a = ctx.pick(['C=C', 'CC=C', 'CC=CC', 'CC(C)=C', 'C1=CCCCC1', 'CCC=C']);
              const p = one(react.run('ae.h2', [a]));
              return p ? { reactant: a, label: 'H2, Pd', product: p } : null;
            },
            nabh4() {
              const a = ctx.pick(['CC=O', 'CCC=O', 'CC(C)=O', 'CCC(C)=O', 'CCCC=O', 'C1CCCCC1=O']);
              const p = one(react.run('co.nabh4', [a]));
              return p ? { reactant: a, label: 'NaBH4', product: p } : null;
            },
            hydration() {
              const a = ctx.pick(['C=C', 'CC=C', 'CC(C)=C', 'CCC=C', 'CC=CC', 'C1=CCCCC1']);
              if (react.wouldRearrange(a)) return null;
              const p = one(react.run('ae.h2o', [a]));
              return p ? { reactant: a, label: 'H2O, H+', product: p } : null;
            },
            hx() {
              const a = ctx.pick(['C=C', 'CC=C', 'CC(C)=C', 'CCC=C', 'CC=CC']);
              if (react.wouldRearrange(a)) return null;
              const X = ctx.pick(['Cl', 'Br']);
              const p = one(react.run('ae.hx', [a], { X }));
              return p ? { reactant: a, label: 'H' + X, product: p } : null;
            },
            x2() {
              const a = ctx.pick(['C=C', 'CC=C', 'CC=CC', 'CC(C)=C', 'C1=CCCCC1']);
              const X = ctx.pick(['Cl', 'Br']);
              const p = one(react.run('ae.x2', [a], { X }));
              return p ? { reactant: a, label: X + '2', product: p } : null;
            },
            halog() {
              const a = ctx.pick(['C', 'CC', 'C1CCCCC1', 'CC(C)(C)C']);
              const p = one(react.run('sr.halogenate', [a], { X: 'Cl' }));
              return p ? { reactant: a, label: 'Cl2, hν', product: p } : null;
            },
            sub() {
              const a = ctx.pick(['CBr', 'CCBr', 'CCCBr', 'CI', 'CCI', 'CCCCl']);
              const r = react.run('sn2', [a], { nu: 'OH' });
              const p = one(r);
              return p ? { reactant: a, label: 'KOH, H2O', product: p } : null;
            },
            elim() {
              const a = ctx.pick(['CCBr', 'CCCBr', 'CC(C)Br', 'CCC(C)Br', 'CCCCl']);
              const p = one(react.run('elim', [a], { base: 'strong' }));
              return p ? { reactant: a, label: 'KOH, EtOH, t°', product: p } : null;
            }
          };
          const NAMES = ['alcox', 'alcox', 'hydrog', 'nabh4', 'hydration', 'hx', 'x2', 'halog', 'sub', 'elim'];
          let c = null;
          for (let tries = 0; tries < 80 && !c; tries++) c = MK[ctx.pick(NAMES)]();
          if (!c) throw new Error('u03.redox: nothing built');
          const sa = oxSum(ctx, c.reactant), sb = oxSum(ctx, c.product);
          const d = sb - sa;
          const cls = d > 0 ? 0 : d < 0 ? 1 : 2;
          const listLT = (smi) => oxList(ctx, smi).map((x) => 'Nr. ' + (x[0] + 1) + ': ' + signed(x[1])).join('; ');
          const listEN = (smi) => oxList(ctx, smi).map((x) => 'no. ' + (x[0] + 1) + ': ' + signed(x[1])).join('; ');
          const num = { numbers: 'all' };
          return {
            q: [
              { p: t('Skaičiuokite visų anglies atomų oksidacijos laipsnių sumą prieš reakciją ir po jos.', 'Work out the sum of the oxidation states of all carbon atoms before and after the reaction.') },
              { scheme: { items: [{ smi: c.reactant, opts: num }, { arrow: '→', above: f(c.label) }, { smi: c.product, opts: num }] } }
            ],
            steps: [
              {
                prompt: t('Kokia visų anglies atomų oksidacijos laipsnių suma pradiniame junginyje?', 'What is the sum of the oxidation states of all carbon atoms in the starting compound?'),
                kind: 'number', answer: { value: sa, tol: 0 },
                hint: t('Kiekvienam C: +1 už kiekvieną ryšį su $O$, $N$ ar halogenu (dvigubas ryšys – du), −1 už kiekvieną ryšį su $H$, 0 už ryšį su $C$. Po to sudėkite.', 'For each C: +1 for each bond to $O$, $N$ or a halogen (a double bond counts twice), −1 for each bond to $H$, 0 for a bond to $C$. Then add them up.'),
                solution: t('Atskirų anglių laipsniai: ' + listLT(c.reactant) + '. Suma: ' + signed(sa) + '.', 'The oxidation states of the individual carbons: ' + listEN(c.reactant) + '. Sum: ' + signed(sa) + '.')
              },
              {
                prompt: t('Kokia ta pati suma produkte?', 'What is the same sum in the product?'),
                kind: 'number', answer: { value: sb, tol: 0 },
                hint: t('Tos pačios taisyklės: pakeitimas ar prijungimas keičia ryšius su $H$, $O$ ir halogenais.', 'The same rules: substitution or addition changes the bonds to $H$, $O$ and halogens.'),
                solution: t('Atskirų anglių laipsniai: ' + listLT(c.product) + '. Suma: ' + signed(sb) + '.', 'The oxidation states of the individual carbons: ' + listEN(c.product) + '. Sum: ' + signed(sb) + '.')
              },
              {
                prompt: t('Kuo ši reakcija yra anglies atžvilgiu?', 'What is this reaction with respect to carbon?'),
                kind: 'choice', options: [{ text: t('Oksidacija', 'Oxidation') }, { text: t('Redukcija', 'Reduction') }, { text: t('Nei oksidacija, nei redukcija', 'Neither oxidation nor reduction') }], answer: cls,
                hint: t('Palyginkite abi sumas: padidėjo, sumažėjo ar nepasikeitė?', 'Compare the two sums: did it rise, fall or stay the same?'),
                solution: t('Suma pasikeitė ' + signed(sa) + ' → ' + signed(sb) + (cls === 0 ? ': laipsnis didėja, tai oksidacija.' : cls === 1 ? ': laipsnis mažėja, tai redukcija.' : ': nepasikeitė, tai nei oksidacija, nei redukcija.'), 'The sum changed ' + signed(sa) + ' → ' + signed(sb) + (cls === 0 ? ': the oxidation state rises, so this is an oxidation.' : cls === 1 ? ': the oxidation state falls, so this is a reduction.' : ': it did not change, so this is neither oxidation nor reduction.'))
              }
            ],
            why: t('Oksidacija didina anglies oksidacijos laipsnį (daugiau ryšių su $O$, $N$, halogenais, mažiau su $H$), redukcija jį mažina. Jei viena anglis oksiduojasi, o kita redukuojasi ir suma nesikeičia, reakcija nėra redoksas.', 'Oxidation raises the oxidation state of carbon (more bonds to $O$, $N$, halogens, fewer to $H$), reduction lowers it. If one carbon is oxidised and another reduced and the sum does not change, the reaction is not a redox reaction.'),
            src: 'L3 p40'
          };
        },
        bank: [
          {
            id: 'u03.redox.1',
            q: [{ p: t('Penki vienos anglies junginiai.', 'Five one-carbon compounds.') }, { mol: [{ smi: 'C' }, { smi: 'CO' }, { smi: 'C=O' }, { smi: 'OC=O' }, { smi: 'O=C=O' }] }],
            steps: [
              {
                prompt: t('Išdėstykite junginius pagal anglies oksidacijos laipsnį nuo mažiausio iki didžiausio.', 'Put the compounds in order of the oxidation state of carbon, from lowest to highest.'),
                kind: 'order',
                options: [{ mol: { smi: 'C' } }, { mol: { smi: 'CO' } }, { mol: { smi: 'C=O' } }, { mol: { smi: 'OC=O' } }, { mol: { smi: 'O=C=O' } }],
                hint: t('Suskaičiuokite ryšius su $O$ ir su $H$ kiekvienai anglimi.', 'Count the bonds to $O$ and to $H$ on each carbon.'),
                solution: t('Metanas −4, metanolis −2, metanalis 0, metano rūgštis +2, anglies dioksidas +4.', 'Methane −4, methanol −2, methanal 0, methanoic acid +2, carbon dioxide +4.')
              }
            ],
            why: t('Kiekvienas naujas ryšys su deguonimi, pakeičiantis ryšį su vandeniliu, padidina anglies oksidacijos laipsnį dviem.', 'Each new bond to oxygen that replaces a bond to hydrogen raises the oxidation state of carbon by two.'),
            src: 'L3 p40'
          },
          {
            id: 'u03.redox.2',
            q: [{ p: t('Keturi dviejų anglių junginiai, pažymėta viena anglis.', 'Four two-carbon compounds, one carbon is highlighted.') }, { mol: [{ smi: 'CC', opts: { highlight: { atoms: [1], tone: 2 } } }, { smi: 'CCO', opts: { highlight: { atoms: [1], tone: 2 } } }, { smi: 'CC=O', opts: { highlight: { atoms: [1], tone: 2 } } }, { smi: 'CC(=O)O', opts: { highlight: { atoms: [1], tone: 2 } } }] }],
            steps: [
              {
                prompt: t('Išdėstykite pažymėtų anglių oksidacijos laipsnius nuo mažiausio iki didžiausio.', 'Put the oxidation states of the highlighted carbons in order from lowest to highest.'),
                kind: 'order',
                options: [{ mol: { smi: 'CC', opts: { highlight: { atoms: [1], tone: 2 } } } }, { mol: { smi: 'CCO', opts: { highlight: { atoms: [1], tone: 2 } } } }, { mol: { smi: 'CC=O', opts: { highlight: { atoms: [1], tone: 2 } } } }, { mol: { smi: 'CC(=O)O', opts: { highlight: { atoms: [1], tone: 2 } } } }],
                hint: t('Palyginkite, kiek ryšių su deguonimi ir kiek su vandeniliu turi kiekviena pažymėta anglis.', 'Compare how many bonds to oxygen and how many to hydrogen each highlighted carbon has.'),
                solution: t('Etanas −3, etanolis −1, etanalis +1, etano rūgštis +3.', 'Ethane −3, ethanol −1, ethanal +1, ethanoic acid +3.')
              }
            ],
            why: t('Alkoholio, aldehido ir rūgšties anglis turi vis daugiau ryšių su deguonimi ir vis mažiau su vandeniliu, todėl oksidacijos laipsnis didėja kas dviem.', 'The carbon of an alcohol, an aldehyde and an acid has more and more bonds to oxygen and fewer to hydrogen, so the oxidation state rises by two each time.'),
            src: 'L3 p40'
          },
          {
            id: 'u03.redox.3',
            q: [{ p: t('2-Metilpropenas prijungia vandenį rūgščioje terpėje.', '2-Methylpropene adds water in acid.') }, { scheme: { items: [{ smi: 'C=C(C)C' }, { arrow: '→', above: t('H2O, rūgštis', 'H2O, acid') }, { smi: 'CC(C)(C)O' }] } }],
            steps: [
              {
                prompt: t('Kokia visų anglių oksidacijos laipsnių suma pradiniame junginyje?', 'What is the sum of the oxidation states of all carbons in the starting compound?'),
                kind: 'number', answer: { value: -8, tol: 0 },
                hint: t('Dvigubojo ryšio anglys: viena turi du $H$, kita – nė vieno; metilo grupės turi po tris $H$.', 'The double-bond carbons: one has two $H$, the other none; the methyl groups have three $H$ each.'),
                solution: t('$CH2=$: −2; $=C<$: 0; du $CH3$: −3 ir −3. Suma: −8.', '$CH2=$: −2; $=C<$: 0; two $CH3$: −3 and −3. Sum: −8.')
              },
              {
                prompt: t('Kokia ta pati suma produkte?', 'What is the same sum in the product?'),
                kind: 'number', answer: { value: -8, tol: 0 },
                hint: t('Dabar viena anglis turi ryšį su $O$ ir nė vieno su $H$.', 'Now one carbon has a bond to $O$ and none to $H$.'),
                solution: t('Tretinė anglis: +1 (ryšys su $O$); trys $CH3$: −9. Suma: −8.', 'The tertiary carbon: +1 (bond to $O$); three $CH3$: −9. Sum: −8.')
              },
              {
                prompt: t('Kuo yra ši reakcija?', 'What is this reaction?'),
                kind: 'choice', options: [{ text: t('Oksidacija', 'Oxidation') }, { text: t('Redukcija', 'Reduction') }, { text: t('Nei oksidacija, nei redukcija', 'Neither oxidation nor reduction') }], answer: 2,
                hint: t('Palyginkite abi sumas.', 'Compare the two sums.'),
                solution: t('Viena anglis oksidavosi (−2 → 0), kita redukavosi (0 → −3), bendra suma nepasikeitė.', 'One carbon was oxidised, the other reduced, the total did not change.')
              }
            ],
            why: t('Vandens prijungimas yra ne redoksas: viena anglis atiduoda elektronų tankį, kita jį priima.', 'Addition of water is not a redox reaction: one carbon gives up electron density and the other takes it up.'),
            src: 'L3 p42',
            claims: [{ react: ['ae.h2o', ['C=C(C)C'], null, 'CC(C)(C)O'] }]
          },
          {
            id: 'u03.redox.4',
            q: [{ p: t('Cikloheksanolis oksiduojamas chromo rūgštimi.', 'Cyclohexanol is oxidised with chromic acid.') }, { scheme: { items: [{ smi: 'OC1CCCCC1', opts: { numbers: 'all' } }, { arrow: '→', above: f('H2CrO4') }, { smi: 'O=C1CCCCC1', opts: { numbers: 'all' } }] } }],
            steps: [
              {
                prompt: t('Kokio oksidacijos laipsnio yra anglis, turinti deguonį (Nr. 2), alkoholyje?', 'What is the oxidation state of the carbon that bears the oxygen (no. 2) in the alcohol?'),
                kind: 'number', answer: { value: 0, tol: 0 },
                hint: t('Šios anglies ryšiai: su $O$, su $H$ ir su dviem anglimis.', 'The bonds of this carbon: to $O$, to $H$ and to two carbons.'),
                solution: t('+1 (su $O$) −1 (su $H$) + 0 + 0 = 0.', '+1 (to $O$) −1 (to $H$) + 0 + 0 = 0.')
              },
              {
                prompt: t('Kokio ji laipsnio ketone?', 'What is its oxidation state in the ketone?'),
                kind: 'number', answer: { value: 2, tol: 0 },
                hint: t('Dvigubas ryšys su deguonimi skaičiuojamas du kartus.', 'A double bond to oxygen counts twice.'),
                solution: t('+2 (dvigubas ryšys su $O$) + 0 + 0 = +2.', '+2 (double bond to $O$) + 0 + 0 = +2.')
              },
              {
                prompt: t('Kuo yra ši reakcija?', 'What is this reaction?'),
                kind: 'choice', options: [{ text: t('Oksidacija', 'Oxidation') }, { text: t('Redukcija', 'Reduction') }, { text: t('Nei oksidacija, nei redukcija', 'Neither oxidation nor reduction') }], answer: 0,
                hint: t('Ar laipsnis didėjo, ar mažėjo?', 'Did the state rise or fall?'),
                solution: t('Laipsnis padidėjo nuo 0 iki +2: oksidacija.', 'The state rose from 0 to +2: an oxidation.')
              }
            ],
            why: t('Antrinio alkoholio oksidacija sukuria $C=O$: anglis netenka ryšio su $H$ ir gauna antrąjį ryšį su $O$.', 'Oxidation of a secondary alcohol creates $C=O$: carbon loses its bond to $H$ and gains a second bond to $O$.'),
            src: 'L3 p41',
            claims: [{ react: ['alc.ox', ['OC1CCCCC1'], { reagent: 'chromic' }, 'O=C1CCCCC1'] }]
          },
          {
            id: 'u03.redox.5',
            q: [{ p: t('Pateikti šeši organinių junginių virtimai.', 'Six organic conversions are listed.') }],
            steps: [
              {
                prompt: t('Pažymėkite visas oksidacijas.', 'Pick every oxidation.'),
                kind: 'multi',
                options: [
                  { text: f('$CH3CH2OH → CH3CHO$') },
                  { text: f('$CH3CHO → CH3CH2OH$') },
                  { text: f('$CH2=CH2 → CH3CH2OH$') },
                  { text: f('$CH3CH3 → CH3CH2Cl$') },
                  { text: f('$CH3CH=CH2 → CH3CH2CH3$') },
                  { text: f('$CH3CHO → CH3COOH$') }
                ],
                answer: [0, 3, 5],
                hint: t('Skaičiuokite, ar reakcijoje pridedama ryšių su $O$ ar halogenu, o atimama ryšių su $H$.', 'Count whether bonds to $O$ or halogen are added and bonds to $H$ removed.'),
                solution: t('Oksidacijos: alkoholis → aldehidas (laipsnis −1 → +1), anglis etane → chloretano anglis su chloru (−3 → −1), aldehidas → rūgštis (+1 → +3). Aldehido virtimas alkoholiu ir propeno hidrinimas yra redukcijos, o eteno hidratacija – ne redoksas.', 'Oxidations: alcohol → aldehyde (−1 → +1), carbon of ethane → the chlorine-bearing carbon of chloroethane (−3 → −1), aldehyde → acid (+1 → +3). The aldehyde to alcohol conversion and the hydrogenation of propene are reductions, and the hydration of ethene is not a redox reaction.')
              }
            ],
            why: t('Oksidacija: daugiau ryšių su $O$ ar halogenu, mažiau su $H$. Redukcija: priešingai. Prijungiant $H2O$ ar $HX$, bendras laipsnis nesikeičia.', 'Oxidation: more bonds to $O$ or halogen, fewer to $H$. Reduction: the opposite. When $H2O$ or $HX$ is added the total does not change.'),
            src: 'L3 p40'
          },
          {
            id: 'u03.redox.6',
            q: [{ p: t('Aldehido ir ketono karbonilo anglys.', 'The carbonyl carbons of an aldehyde and a ketone.') }, { mol: [{ smi: 'CC=O', opts: { numbers: 'all' } }, { smi: 'CC(C)=O', opts: { numbers: 'all' } }] }],
            steps: [
              {
                prompt: t('Kokio oksidacijos laipsnio yra etanalio $C=O$ anglis (Nr. 2)?', 'What is the oxidation state of the $C=O$ carbon of ethanal (no. 2)?'),
                kind: 'number', answer: { value: 1, tol: 0 },
                hint: t('Dvigubas ryšys su $O$ skaičiuojamas du kartus, ryšys su $H$ – kaip −1.', 'A double bond to $O$ counts twice and a bond to $H$ counts as −1.'),
                solution: t('+2 (su $O$) −1 (su $H$) + 0 (su $C$) = +1.', '+2 (to $O$) −1 (to $H$) + 0 (to $C$) = +1.')
              },
              {
                prompt: t('Kokio oksidacijos laipsnio yra propanono $C=O$ anglis (Nr. 2)?', 'What is the oxidation state of the $C=O$ carbon of propanone (no. 2)?'),
                kind: 'number', answer: { value: 2, tol: 0 },
                hint: t('Ši anglis neturi vandenilių.', 'This carbon has no hydrogens.'),
                solution: t('+2 (su $O$) + 0 + 0 = +2.', '+2 (to $O$) + 0 + 0 = +2.')
              }
            ],
            why: t('Ketono karbonilo anglis yra aukštesnio oksidacijos laipsnio nei aldehido, todėl aldehidai oksiduojasi lengviau, o ketonai oksiduojasi tik suskaldant $C−C$ ryšį.', 'The carbonyl carbon of a ketone is at a higher oxidation state than that of an aldehyde, which is why aldehydes oxidise easily while ketones oxidise only with cleavage of a $C−C$ bond.'),
            src: 'L3 p40'
          },
          {
            id: 'u03.redox.7',
            q: [{ p: t('Etanolis oksiduojamas iki etano rūgšties.', 'Ethanol is oxidised to ethanoic acid.') }, { scheme: { items: [{ smi: 'CCO', opts: { numbers: 'all' } }, { arrow: '→', above: f('H2CrO4') }, { smi: 'CC(=O)O', opts: { numbers: 'all' } }] } }],
            steps: [
              {
                prompt: t('Kiek pasikeitė visų anglių oksidacijos laipsnių suma?', 'By how much did the sum of the oxidation states of all carbons change?'),
                kind: 'number', answer: { value: 4, tol: 0 },
                hint: t('Apskaičiuokite sumą etanole ir rūgštyje, tada atimkite.', 'Work out the sum in ethanol and in the acid, then subtract.'),
                solution: t('Etanolis: −3 ir −1, suma −4. Rūgštis: −3 ir +3, suma 0. Pokytis: 0 − (−4) = +4.', 'Ethanol: −3 and −1, sum −4. Acid: −3 and +3, sum 0. Change: 0 − (−4) = +4.')
              }
            ],
            why: t('Pirminio alkoholio oksidacija iki rūgšties yra keturių elektronų procesas: pirma iki aldehido (+2), po to iki rūgšties (+2).', 'Oxidation of a primary alcohol to an acid is a four-electron process: first to the aldehyde (+2), then to the acid (+2).'),
            src: 'L3 p40',
            claims: [{ react: ['alc.ox', ['CCO'], { reagent: 'chromic' }, 'CC(=O)O'] }]
          },
          {
            id: 'u03.redox.8',
            q: [{ p: t('Etenas hidrinamas vandeniliu su paladžio katalizatoriumi.', 'Ethene is hydrogenated with hydrogen over a palladium catalyst.') }, { scheme: { items: [{ smi: 'C=C', opts: { numbers: 'all' } }, { arrow: '→', above: f('H2, Pd') }, { smi: 'CC', opts: { numbers: 'all' } }] } }],
            steps: [
              {
                prompt: t('Kokio oksidacijos laipsnio yra kiekviena anglis etene ir etane?', 'What is the oxidation state of each carbon in ethene and in ethane?'),
                kind: 'choice',
                options: [{ text: t('Etene −2, etane −3', 'Ethene −2, ethane −3') }, { text: t('Etene −3, etane −2', 'Ethene −3, ethane −2') }, { text: t('Abiejuose 0', '0 in both') }, { text: t('Etene +2, etane −3', 'Ethene +2, ethane −3') }],
                answer: 0,
                hint: t('Suskaičiuokite $H$ ryšius kiekvienai anglies atomui ir atminkite, kad ryšys su $C$ duoda 0.', 'Count the $H$ bonds on each carbon and remember that a bond to $C$ gives 0.'),
                solution: t('Etene kiekviena anglis turi du $H$: −2. Etane – tris $H$: −3.', 'In ethene each carbon has two $H$: −2. In ethane three $H$: −3.')
              },
              {
                prompt: t('Kuo yra ši reakcija?', 'What is this reaction?'),
                kind: 'choice', options: [{ text: t('Oksidacija', 'Oxidation') }, { text: t('Redukcija', 'Reduction') }, { text: t('Nei oksidacija, nei redukcija', 'Neither oxidation nor reduction') }], answer: 1,
                hint: t('Ar laipsnis mažėjo?', 'Did the state fall?'),
                solution: t('Abi anglys prijungė vandenilį, laipsnis sumažėjo nuo −2 iki −3: redukcija.', 'Both carbons took up hydrogen, the state fell from −2 to −3: a reduction.')
              }
            ],
            why: t('Vandenilio prijungimas yra redukcija, vandenilio atskyrimas – oksidacija. Taip organinėje chemijoje dažniausiai atpažįstami redoksai.', 'Adding hydrogen is a reduction, removing hydrogen an oxidation. This is how redox reactions are most often recognised in organic chemistry.'),
            src: 'L3 p40',
            claims: [{ react: ['ae.h2', ['C=C'], null, 'CC'] }]
          }
        ]
      },
    ],
    coverage: {
      'S2.7': ['u03.nuel'],
      'S2.8': ['u03.rtype'],
      'S2.10': ['u03.conj'],
      'S2.11': ['u03.conj', 'u03.natural'],
      'S2.12': ['u03.effects', 'u03.donor', 'u03.resonance'],
      'S2.13': ['u03.nuc'],
      'S2.14': ['u03.arrows'],
      'S2.15': ['u03.products']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
