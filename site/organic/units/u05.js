// site/organic/units/u05.js: unit 5, isomerism (constitutional isomers, stereoisomers, conformations)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // labels that are only formulas or symbols
  const BS = String.fromCharCode(92);    // the backslash of SMILES bond marks

  /* ---------- helpers shared by the generators ---------- */

  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: true });
  const natoms = (ctx, s) => ctx.chem.parse(s).atoms.length;

  // substituents of a stereocentre or a double bond. rk = CIP rank (higher = senior), set = atoms on the first atom
  const LIG = {
    Br:    { smi: 'Br',        rk: 14, f: 'Br' },
    Cl:    { smi: 'Cl',        rk: 13, f: 'Cl' },
    SH:    { smi: 'S',         rk: 12, f: 'SH' },
    OH:    { smi: 'O',         rk: 11, f: 'OH' },
    NH2:   { smi: 'N',         rk: 10, f: 'NH2' },
    COOH:  { smi: 'C(=O)O',    rk: 9,  f: 'COOH',   set: 'O,O,O' },
    CHO:   { smi: 'C=O',       rk: 8,  f: 'CHO',    set: 'O,O,H' },
    CH2OH: { smi: 'CO',        rk: 7,  f: 'CH2OH',  set: 'O,H,H' },
    CN:    { smi: 'C#N',       rk: 6,  f: 'CN',     set: 'N,N,N' },
    Ph:    { smi: 'c1ccccc1',  rk: 5,  f: 'C6H5',   set: 'C,C,C' },
    vinyl: { smi: 'C=C',       rk: 4,  f: 'CH=CH2', set: 'C,C,H' },
    Et:    { smi: 'CC',        rk: 3,  f: 'CH2CH3', set: 'C,H,H' },
    CH3:   { smi: 'C',         rk: 2,  f: 'CH3',    set: 'H,H,H' },
    H:     { smi: '',          rk: 1,  f: 'H' }
  };
  const lf = (k) => '$' + LIG[k].f + '$';
  const lopt = (k) => ({ text: f(lf(k)) });
  const byRank = (keys) => keys.slice().sort((a, b) => LIG[b].rk - LIG[a].rk);
  const inversions = (a) => { let n = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) n++; return n; };
  // R or S from the written order of the neighbours (SMILES tag '@' or '@@') and the ranks of the neighbours (hydrogen = 1)
  function rsFromTag(tag, ranks) {
    const target = ranks.slice().sort((a, b) => a - b);               // lowest first, then ascending... we need lowest, then descending
    const low = target[0];
    const want = [low].concat(target.slice(1).reverse());
    const idx = ranks.map(r => want.indexOf(r));
    const odd = inversions(idx) % 2 === 1;
    return ((tag === '@') !== odd) ? 'R' : 'S';
  }
  // explains the priority order in words for a list of substituent keys (senior first)
  function orderText(keys) {
    const parts = keys.map(k => lf(k));
    const ties = keys.filter(k => LIG[k].set);
    const lt = parts.join(' > ');
    if (ties.length > 1) {
      const sets = ties.map(k => lf(k) + ' ($' + LIG[k].set + '$)').join(', ');
      return { lt: lt + '. Anglies grupės sutampa pirmuoju atomu, todėl lyginami prie jo prijungti atomai: ' + sets + '.', en: lt + '. The carbon groups tie at the first atom, so the atoms attached to it decide: ' + sets + '.' };
    }
    return { lt: lt + '. Pirmenybę lemia atomo, tiesiogiai prijungto prie centro, atominis skaičius.', en: lt + '. The atomic number of the atom bonded directly to the centre decides.' };
  }
  // SMILES of a stereocentre [C@H](A)(B)C with ligand keys; returns first-atom indices of every ligand
  function centreSmi(ctx, keys, tag) {
    const heavy = keys.filter(k => k !== 'H');
    const hasH = heavy.length < keys.length;
    let s = '[C' + tag + (hasH ? 'H' : '') + ']';
    const first = {};
    let n = 1;
    heavy.forEach((k, i) => {
      first[k] = n;
      n += natoms(ctx, LIG[k].smi);
      s += (i < heavy.length - 1) ? '(' + LIG[k].smi + ')' : LIG[k].smi;
    });
    return { smi: s, first, order: (hasH ? ['H'] : []).concat(heavy) };
  }
  // the numbers in a step text: atom label = SMILES index + 1
  const lab = (i) => String(i + 1);

  // single-line list of formula labels for a text
  const fl = (keys) => keys.map(lf).join(', ');

  // the same Fischer ligand written on the right and on the left of the vertical line
  const FIS = {
    OH: { r: 'OH', l: 'HO' }, NH2: { r: 'NH2', l: 'H2N' }, Cl: { r: 'Cl', l: 'Cl' }, Br: { r: 'Br', l: 'Br' },
    CH3: { r: 'CH3', l: 'H3C' }, Et: { r: 'CH2CH3', l: 'H3CH2C' }, COOH: { r: 'COOH', l: 'HOOC' }, CHO: { r: 'CHO', l: 'OHC' },
    CH2OH: { r: 'CH2OH', l: 'HOH2C' }, H: { r: 'H', l: 'H' }
  };

  // geometry of a Fischer centre drawn as rows: st = [top, right, bottom, left] ligand keys; vertical bonds go away from the viewer, horizontal ones towards it
  const FV = [[0, 1, -1], [1, 0, 1], [0, -1, -1], [-1, 0, 1]];
  const det3 = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  function fischerRS(st) {
    const order = [0, 1, 2, 3].sort((x, y) => LIG[st[y]].rk - LIG[st[x]].rk);   // senior first
    const [a, b, c, d] = order.map(i => FV[i]);
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    return det3(sub(a, d), sub(b, d), sub(c, d)) < 0 ? 'R' : 'S';
  }
  const fischerDraw = (st) => ({ rows: [{ left: FIS[st[3]].l, right: FIS[st[1]].r }], top: FIS[st[0]].r, bottom: FIS[st[2]].r });
  // direction (clockwise or not) of the three senior ligands as drawn on the paper (y down), H ignored
  function fischerSeen(st) {
    const P = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const order = [0, 1, 2, 3].filter(i => st[i] !== 'H').sort((x, y) => LIG[st[y]].rk - LIG[st[x]].rk).map(i => P[i]);
    const [a, b, c] = order;
    return ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 0;
  }

  /* ================================================================ notes ================================================================ */

  const NOTES = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'kinds',
      title: t('Izomerų rūšys: sandaros izomerai ir tautomerai', 'Kinds of isomers: constitutional isomers and tautomers'),
      blocks: [
        { h: t('Kas yra izomerai?', 'What are isomers?') },
        {
          p: t('Du junginiai gali turėti tą pačią molekulinę formulę, bet skirtingas savybes, nes jų atomai sujungti arba išdėstyti skirtingai. Todėl vien formulės organinėje chemijoje nepakanka: reikia žinoti, kokia tvarka atomai sujungti ir kaip jie išsidėstę erdvėje.',
            'Two compounds can have the same molecular formula and still differ in their properties, because their atoms are connected or arranged differently. A formula alone is therefore not enough in organic chemistry: you must know in which order the atoms are connected and how they sit in space.'),
          src: 'L5 p2'
        },
        {
          rule: t('Izomerai – tai junginiai su ta pačia molekuline formule, bet skirtingos medžiagos. Sandaros izomeruose atomai sujungti kita tvarka; stereoizomeruose jungimosi tvarka ta pati, tačiau atomai erdvėje išsidėstę kitaip.',
            'Isomers are different compounds with the same molecular formula. In constitutional isomers the atoms are connected in a different order; in stereoisomers they are connected in the same way but arranged differently in space.'),
          src: 'L5 p2'
        },
        {
          list: [
            t('Sandaros izomerai: grandinės (skeleto), padėties (dvigubojo ar trigubojo ryšio ir funkcinės grupės vietos) ir funkciniai.', 'Constitutional isomers: chain (skeleton), position (of a double or triple bond or of a functional group) and functional isomers.'),
            t('Erdviniai izomerai: konfigūraciniai (enantiomerai ir diastereomerai, kuriuos sudaro $σ$- ir $π$-diastereomerai) bei konformaciniai.', 'Stereoisomers: configurational (enantiomers and diastereomers, which split into $σ$- and $π$-diastereomers) and conformational.')
          ],
          src: 'L5 p2'
        },
        { h: t('Sandaros izomerai', 'Constitutional isomers') },
        {
          p: t('Grandinės (skeleto) izomerų anglies atomų skeletas skirtingas: grandinė šakota ar nešakota, o gali būti ir ciklas. Pentanas, 2-metilbutanas ir 2,2-dimetilpropanas turi formulę $C5H12$, o ciklobutanas ir metilciklopropanas – $C4H8$.',
            'Chain (skeleton) isomers have different carbon skeletons: the chain is branched or unbranched, and a ring is possible too. Pentane, 2-methylbutane and 2,2-dimethylpropane all have the formula $C5H12$, and cyclobutane and methylcyclopropane have $C4H8$.'),
          src: 'L5 p3'
        },
        {
          mol: [
            { smi: 'CCCCC', name: t('pentanas', 'pentane') },
            { smi: 'CC(C)CC', name: t('2-metilbutanas', '2-methylbutane') },
            { smi: 'CC(C)(C)C', name: t('2,2-dimetilpropanas', '2,2-dimethylpropane') },
            { smi: 'C1CCC1', name: t('ciklobutanas', 'cyclobutane') },
            { smi: 'CC1CC1', name: t('metilciklopropanas', 'methylcyclopropane') }
          ],
          src: 'L5 p3'
        },
        {
          p: t('Padėties izomerų skeletas tas pats, bet skiriasi dvigubojo ar trigubojo ryšio arba funkcinės grupės vieta. Pavyzdžiai: 1-butenas ir 2-butenas, 1-propanolis ir 2-propanolis, o benzene – trys dichlorbenzenai (1,2-, 1,3- ir 1,4-).',
            'Position isomers share the skeleton but differ in the place of a double or triple bond or of a functional group. Examples are 1-butene and 2-butene, 1-propanol and 2-propanol, and, on a benzene ring, the three dichlorobenzenes (1,2-, 1,3- and 1,4-).'),
          src: 'L5 p4'
        },
        {
          mol: [
            { smi: 'C=CCC', name: t('1-butenas', '1-butene') },
            { smi: 'CC=CC', name: t('2-butenas', '2-butene') },
            { smi: 'CCCO', name: t('1-propanolis', '1-propanol') },
            { smi: 'CC(C)O', name: t('2-propanolis', '2-propanol') },
            { smi: 'Clc1ccccc1Cl', name: t('1,2-dichlorbenzenas', '1,2-dichlorobenzene') },
            { smi: 'Clc1cccc(Cl)c1', name: t('1,3-dichlorbenzenas', '1,3-dichlorobenzene') },
            { smi: 'Clc1ccc(Cl)cc1', name: t('1,4-dichlorbenzenas', '1,4-dichlorobenzene') }
          ],
          src: 'L5 p4'
        },
        {
          p: t('Funkciniai izomerai turi tą pačią formulę, bet skirtingas funkcines grupes, todėl jų cheminės savybės visai kitokios: propanalis ir propanonas ($C3H6O$), etanolis ir metoksimetanas ($C2H6O$).',
            'Functional isomers have the same formula but different functional groups, so their chemistry is quite different: propanal and propanone ($C3H6O$), ethanol and methoxymethane ($C2H6O$).'),
          src: 'L5 p5'
        },
        {
          mol: [
            { smi: 'CCC=O', name: t('propanalis', 'propanal') },
            { smi: 'CC(C)=O', name: t('propanonas', 'propanone') },
            { smi: 'CCO', name: t('etanolis', 'ethanol') },
            { smi: 'COC', name: t('metoksimetanas', 'methoxymethane') }
          ],
          src: 'L5 p5'
        },
        {
          pitfall: t('Skaičiuodami izomerus nesuskaičiuokite to paties junginio du kartus: 2-metilbutaną galima nupiešti keliais būdais (pasukus ar apvertus brėžinį), bet tai viena medžiaga. Veikite sistemingai: pirmiausia ilgiausia grandinė, po to trumpesnė su šakomis, tada keiskite grupės vietą.',
            'When counting isomers do not count the same compound twice: 2-methylbutane can be drawn in several ways (turned or flipped), but it is one substance. Work systematically: first the longest chain, then shorter chains with branches, then move the group.')
        },
        {
          example: {
            q: [
              { p: t('Kiek sandaros izomerų turi $C4H9Cl$ ir kokie jie?', 'How many constitutional isomers does $C4H9Cl$ have, and what are they?') }
            ],
            steps: [
              [{ p: t('Pirmiausia pasirenkame anglies skeletą: keturių anglies atomų nešakota grandinė (butanas) arba šakotas skeletas (2-metilpropanas). Daugiau skeletų nėra.', 'First choose the carbon skeleton: an unbranched four-carbon chain (butane) or a branched one (2-methylpropane). There are no others.') }],
              [{ p: t('Prie butano chlorą galima prijungti prie krašto atomo (C1) arba prie vidinio (C2). Atomai C3 ir C4 tokie patys kaip C2 ir C1, todėl nauji izomerai nesusidaro: du izomerai.', 'On butane chlorine can sit on an end carbon (C1) or on an inner one (C2). C3 and C4 repeat C2 and C1, so they add nothing new: two isomers.') }],
              [{ p: t('Prie 2-metilpropano chlorą galima prijungti prie metilo grupės arba prie centrinio atomo: dar du izomerai.', 'On 2-methylpropane chlorine can go on a methyl group or on the central carbon: two more isomers.') }],
              [{ p: t('Iš viso keturi izomerai.', 'In total four isomers.') }, {
                mol: [
                  { smi: 'CCCCCl', name: t('1-chlorbutanas', '1-chlorobutane') },
                  { smi: 'CCC(C)Cl', name: t('2-chlorbutanas', '2-chlorobutane') },
                  { smi: 'CC(C)CCl', name: t('1-chlor-2-metilpropanas', '1-chloro-2-methylpropane') },
                  { smi: 'CC(C)(C)Cl', name: t('2-chlor-2-metilpropanas', '2-chloro-2-methylpropane') }
                ]
              }]
            ]
          },
          claims: [
            { isomers: ['C4H9Cl', 4] },
            { name: ['CCCCCl', t('1-chlorbutanas', '1-chlorobutane')] }, { name: ['CCC(C)Cl', t('2-chlorbutanas', '2-chlorobutane')] },
            { name: ['CC(C)CCl', t('1-chlor-2-metilpropanas', '1-chloro-2-methylpropane')] }, { name: ['CC(C)(C)Cl', t('2-chlor-2-metilpropanas', '2-chloro-2-methylpropane')] }
          ]
        },
        { h: t('Tautomerai', 'Tautomers') },
        {
          p: t('Ypatingas funkcinių izomerų atvejis yra tautomerai: tai izomerai, kurie dinaminėje pusiausvyroje lengvai virsta vienas kitu. Dažniausia prototropinė tautomerija, kai migruoja protonas $H+$.',
            'A special case of functional isomers is the tautomers: isomers that readily convert into each other and exist in a dynamic equilibrium. The commonest is prototropic tautomerism, in which a proton $H+$ migrates.'),
          src: 'L5 p5'
        },
        {
          rule: t('Tautomerai yra skirtingi junginiai, tarp kurių nusistovi pusiausvyra, nes juose skiriasi protono padėtis. Rezonansinėse formulėse atomai nejuda, juda tik elektronai.',
            'Tautomers are different compounds in equilibrium, because the position of a proton differs between them. In resonance structures the atoms do not move, only electrons do.'),
          src: 'L5 p5'
        },
        {
          scheme: { items: [{ smi: 'CC(=O)CC(=O)O' }, { arrow: '⇌' }, { smi: 'CC(O)=CC(=O)O' }] },
          caption: t('Ketoenolinė tautomerija: ketoninė forma ⇌ enolinė forma (3-oksobutano rūgštis).', 'Keto-enol tautomerism: keto form ⇌ enol form (3-oxobutanoic acid).'),
          src: 'L5 p6'
        },
        {
          scheme: { items: [{ smi: 'O=C1CCCN1' }, { arrow: '⇌' }, { smi: 'OC1=NCCC1' }] },
          caption: t('Laktamlaktiminė tautomerija: laktamas ⇌ laktimas ($N–H$ protonas pereina prie deguonies). Skaidrėje tai parodyta uracilo pavyzdžiu, tarp jų dar yra hemilaktamas.', 'Lactam-lactim tautomerism: lactam ⇌ lactim (the $N–H$ proton moves to oxygen). The lecture shows it with uracil, which also has an intermediate hemilactam form.'),
          src: 'L5 p7'
        },
        {
          scheme: { items: [{ smi: 'OCCCC=O' }, { arrow: '⇌' }, { smi: 'OC1CCCO1' }] },
          caption: t('Žiedo ir grandinės tautomerija: grandininis izomeras (hidroksialdehidas) ⇌ žiedo izomeras.', 'Ring-chain tautomerism: the chain isomer (a hydroxy aldehyde) ⇌ the ring isomer.'),
          src: 'L5 p7'
        },
        {
          pitfall: t('Tautomerų nepainiokite su rezonansinėmis formulėmis. Tautomerai yra du realūs, skirtingi junginiai (pavyzdžiui, ketonas ir enolis), o rezonansinės formulės – tik vieno junginio elektronų pasiskirstymo užrašymo būdai, tarp kurių pusiausvyros nėra.',
            'Do not confuse tautomers with resonance structures. Tautomers are two real, different compounds (for example a ketone and an enol), whereas resonance structures are only ways of writing the electron distribution of one compound, and there is no equilibrium between them.')
        },
        { practice: 'u05.constit' },
        { practice: 'u05.kinds' }
      ]
    },

    /* ------------------------------------------------------------ 2 */
    {
      id: 'chirality',
      title: t('Erdviniai izomerai ir chirališkumas', 'Stereoisomers and chirality'),
      blocks: [
        { h: t('Konfigūracija ir konformacija', 'Configuration and conformation') },
        {
          p: t('Erdviniai izomerai (stereoizomerai) turi tą pačią atomų jungimosi tvarką, bet skirtingai išsidėsto erdvėje. Skirtumas gali būti konfigūracijos arba konformacijos.',
            'Stereoisomers have the same order of connected atoms but a different arrangement in space. The difference can be one of configuration or of conformation.'),
          src: 'L5 p8'
        },
        {
          rule: t('Konfigūracija nusako atomų išsidėstymą erdvėje, neįskaitant skirtumų, atsirandančių grupei pasisukus apie viengubąjį $σ$ ryšį. O konformacija – viena iš tokio sukimosi duodamų molekulės formų.',
            'Configuration is the order in which atoms are arranged in space, disregarding differences caused by rotation about a single $σ$ bond. A conformation is a specific geometric shape of the molecule that arises from rotation about a single $σ$ bond.'),
          src: 'L5 p8'
        },
        { h: t('Tetraedrinis anglies atomas', 'The tetrahedral carbon') },
        {
          p: t('Anglis, kurios hibridizacija $sp3$, yra tetraedro centre, o keturi jos ryšiai eina į jo viršūnių pusę (kampai 109,5°). Popieriuje tetraedrą vaizduojame pleištine (perspektyvine) formule: du ryšiai guli lapo plokštumoje ir braižomi paprastomis linijomis, trečias, nukreiptas į žiūrintįjį, – paryškintu pleištu, ketvirtas, atsukęs nuo žiūrinčiojo, – brūkšniuotu pleištu.',
            'An $sp3$ carbon sits at the centre of a tetrahedron with its four bonds pointing to the corners, at angles of 109.5°. On paper we draw the tetrahedron as a wedge (perspective) formula: two bonds lie in the plane of the paper and are drawn as plain lines, the third, towards the viewer, as a bold wedge, and the fourth, behind the plane, as a hashed wedge.'),
          src: 'L5 p9'
        },
        { mol: { smi: 'C[C@H](Br)CC', name: t('2-brombutanas', '2-bromobutane') }, caption: t('Pleištinė formulė: brūkšniuotas ryšys eina už lapo plokštumos, paprastos linijos guli plokštumoje (vandenilis neparodytas).', 'A wedge formula: the hashed bond goes behind the plane of the paper, the plain lines lie in the plane (the hydrogen is not shown).'), src: 'L5 p21' },
        { h: t('Simetrija ir chirališkumas', 'Symmetry and chirality') },
        {
          p: t('Molekulės simetrijos elementai yra ašis, plokštuma ir centras. Jei molekulė turi simetrijos plokštumą (arba centrą), ji sutampa su savo veidrodiniu atspindžiu ir vadinama achiraline. Molekulė be tokių elementų su atspindžiu nesutampa ir vadinama chiraline (iš graikų cheir – ranka), kaip kairė ir dešinė rankos.',
            'The symmetry elements of a molecule are an axis, a plane and a centre. A molecule with a plane (or centre) of symmetry coincides with its mirror image and is called achiral. A molecule without such elements does not coincide with its mirror image and is called chiral (from Greek cheir, hand), like a left and a right hand.'),
          src: 'L5 p10'
        },
        {
          rule: t('Chiralinis centras (vadinamas ir asimetriniu centru) yra atomas, prie kurio prijungti keturi nevienodi pakaitai; anglies atveju jis žymimas $*C$. Anglis gali tapti tokiu centru tik būdama $sp3$ hibridizacijos. Molekulė su vienu chiraliniu centru visada chiralinė.',
            'A chiral centre (also called an asymmetric centre) is an atom with four different substituents, marked $*C$. A carbon can have four different substituents only when it is $sp3$ hybridised. A molecule with a single chiral centre is always chiral.'),
          src: 'L5 p15'
        },
        {
          p: t('Stereogeninis centras (stereocentras) – platesnė sąvoka: atomas, kurio dviejų pakaitų sukeitimas duoda kitą stereoizomerą. Todėl stereocentrai yra ir chiraliniai centrai (sukeitus gaunamas enantiomeras), ir dvigubojo ryšio atomai (sukeitus gaunamas $Z$ ar $E$ izomeras). Uždaviniuose „chiralinis centras“ reiškia atomą su keturiais skirtingais pakaitais.',
            'A stereogenic centre (stereocentre) is a wider term: an atom at which swapping two substituents gives another stereoisomer. Chiral centres qualify (the swap gives the enantiomer) and so do the carbons of a double bond (the swap gives the $Z$ or $E$ isomer). In the tasks "chiral centre" means an atom with four different substituents.'),
          src: 'L5 p42'
        },
        {
          mol: [
            { smi: 'CC[C@H](C)Br', name: t('2-brombutanas', '2-bromobutane') },
            { smi: 'CCC(C)(C)Br', name: t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane') }
          ],
          caption: t('2-brombutanas turi keturis skirtingus pakaitus ($Br$, $CH3$, $CH2CH3$, $H$), todėl yra chiralinis; 2-brom-2-metilbutano molekulėje yra dvi vienodos metilo grupės, todėl jis achiralinis.', '2-Bromobutane has four different substituents ($Br$, $CH3$, $CH2CH3$, $H$) and is chiral; 2-bromo-2-methylbutane has two identical methyl groups and is achiral.'),
          src: 'L5 p14'
        },
        {
          pitfall: t('Lyginkite visas grupes, ne tik pirmuosius atomus. Prie 3-metilheksano trečiojo atomo yra $CH3$, $H$, etilas ir propilas: keturios skirtingos grupės, nors visos prasideda anglimi. Be to, chiralinis centras dar nereiškia chiralinės molekulės: mezoformos turi chiralinių centrų, bet yra achiralinės.',
            'Compare whole groups, not just the first atoms. The third carbon of 3-methylhexane carries $CH3$, $H$, ethyl and propyl: four different groups, even though all start with carbon. A chiral centre also does not yet make the molecule chiral: meso forms have chiral centres but are achiral.')
        },
        {
          example: {
            q: [
              { p: t('Raskite chiralinius centrus 1-chlor-2-metilbutane.', 'Find the chiral centres in 1-chloro-2-methylbutane.') },
              { mol: { smi: 'ClCC(C)CC', name: t('1-chlor-2-metilbutanas', '1-chloro-2-methylbutane'), opts: { numbers: { 1: '1', 2: '2', 4: '3', 5: '4' } } } }
            ],
            steps: [
              [{ p: t('Chiraliniu centru gali būti tik $sp3$ anglis, prie kurios yra keturi skirtingi pakaitai. Visi keturi anglies atomai čia yra $sp3$.', 'Only an $sp3$ carbon with four different substituents can be a chiral centre. All four carbons here are $sp3$.') }],
              [{ p: t('C1 turi du vandenilius ($CH2Cl$), C4 – tris ($CH3$): vienodų pakaitų yra, todėl jie ne centrai.', 'C1 has two hydrogens ($CH2Cl$) and C4 has three ($CH3$): identical substituents, so neither is a centre.') }],
              [{ p: t('C3 turi du vandenilius, todėl taip pat ne centras.', 'C3 has two hydrogens, so it is not a centre either.') }],
              [{ p: t('C2 turi $H$, $CH3$, $CH2Cl$ ir $CH2CH3$: keturios skirtingos grupės. C2 yra vienintelis chiralinis centras.', 'C2 carries $H$, $CH3$, $CH2Cl$ and $CH2CH3$: four different groups. C2 is the only chiral centre.') }]
            ]
          },
          claims: [{ centres: ['ClCC(C)CC', [2]] }, { name: ['ClCC(C)CC', t('1-chlor-2-metilbutanas', '1-chloro-2-methylbutane')] }]
        },
        { h: t('Prochirališkumas', 'Prochirality') },
        {
          p: t('Prochiralinė molekulė pati achiralinė, bet reaguodama su achiraliniu reagentu virsta chiralinė. Prochiralinis atomas – achiralinis atomas, kuris tampa chiraliniu centru, kai vienas jo pakaitas pakeičiamas kitu.',
            'An achiral molecule that becomes chiral in a reaction with an achiral reagent is called prochiral. A prochiral atom is an achiral atom that becomes a chiral centre when one of its substituents is replaced by a new one.'),
          src: 'L5 p17'
        },
        {
          scheme: { items: [{ smi: 'CCC(C)=O', name: t('2-butanonas', '2-butanone') }, { arrow: '→', above: f('NaBH4') }, { smi: 'CCC(C)O', name: t('2-butanolis', '2-butanol') }] },
          caption: t('2-butanonas yra prochiralinis: redukuojant jo karbonilo anglis tampa chiraliniu centru. Acetonas taip nesielgtų, nes 2-propanolyje yra dvi vienodos metilo grupės.', '2-Butanone is prochiral: on reduction its carbonyl carbon becomes a chiral centre. Acetone would not, because 2-propanol has two identical methyl groups.'),
          src: 'L5 p18',
          claims: [{ react: ['co.nabh4', ['CCC(C)=O'], null, 'CCC(C)O'] }]
        },
        { practice: 'u05.centres' },
        { practice: 'u05.chiral' }
      ]
    },

    /* ------------------------------------------------------------ 3 */
    {
      id: 'enantiomers',
      title: t('Enantiomerai, optinis aktyvumas ir projekcinės formulės', 'Enantiomers, optical activity and projection formulas'),
      blocks: [
        { h: t('Enantiomerai', 'Enantiomers') },
        {
          p: t('Chiralinė molekulė gali turėti dvi erdvines formas. Kiekviena jų yra kitos atspindys veidrodyje, kurio neįmanoma uždėti ant originalo, ir tokia pora vadinama enantiomerais. Jų fizikinės ir cheminės savybės vienodos (lydymosi ir virimo temperatūra, tirpumas, reaktingumas), bet jie skirtingai suka poliarizuotos šviesos plokštumą ir skirtingai veikia kitus chiralinius objektus, pavyzdžiui, receptorius.',
            'A chiral molecule exists as a pair of stereoisomers. These are mirror images of each other that cannot be superimposed, and they are called enantiomers. Their physical and chemical properties are identical (melting and boiling point, solubility, reactivity), but they rotate the plane of polarised light in different directions and interact differently with other chiral objects such as receptors.'),
          src: 'L5 p19'
        },
        {
          rule: t('Poliarizuotos šviesos plokštumą vienas enantiomeras pasuka į dešinę (+), o antrasis tokiu pat kampu į kairę (−), todėl abu optiškai aktyvūs. Mišinys, kuriame enantiomerų yra po lygiai, vadinamas racematu ir šviesos plokštumos nesuka. Kiek ir kuria kryptimi molekulė suka šviesą, iš struktūros nuspėti negalima, tai išmatuojama.',
            'One enantiomer rotates the plane of polarised light to the right (+), the other by the same angle to the left (−): they are optically active. A mixture of equal amounts of the enantiomers is called a racemate and is optically inactive. The size and sign of the rotation cannot be predicted: it is measured.'),
          src: 'L5 p19'
        },
        {
          mol: [
            { smi: 'CC[C@@H](C)CO', name: t('2-metil-1-butanolis', '2-methyl-1-butanol') },
            { smi: 'CC[C@H](C)CO', name: t('2-metil-1-butanolis', '2-methyl-1-butanol') }
          ],
          caption: t('(R)-(+) ir (S)-(−) 2-metil-1-butanolis: sukimo kampai +5,75° ir −5,75°.', '(R)-(+) and (S)-(−) 2-methyl-1-butanol: rotations +5.75° and −5.75°.'),
          src: 'L5 p19',
          claims: [{ cip: ['CC[C@@H](C)CO', 2, 'R'] }, { cip: ['CC[C@H](C)CO', 2, 'S'] }]
        },
        { h: t('Pleištinės formulės', 'Wedge formulas') },
        {
          p: t('Enantiomerus galima vaizduoti pleištinėmis formulėmis. Asimetrinį atomą ir du ryšius braižome popieriaus plokštumoje paprastomis linijomis, trečiąjį ryšį – paryškinta pleištu (į stebėtoją), ketvirtąjį – brūkšniuotu pleištu (nuo stebėtojo). Trečiojo ir ketvirtojo ryšio negalima įterpti tarp pirmųjų dviejų. Antrąjį enantiomerą nupiešiame kaip pirmojo veidrodinį atspindį.',
            'Enantiomers can be shown with wedge formulas. The stereocentre and two bonds are drawn in the plane of the paper as plain lines, the third bond as a bold wedge (towards the viewer) and the fourth as a hashed wedge (away from the viewer). The third and fourth bonds must not be placed between the first two. The second enantiomer is drawn as the mirror image of the first.'),
          src: 'L5 p21'
        },
        { h: t('Fišerio projekcinės formulės', 'Fischer projections') },
        {
          p: t('Fišerio formulėje tetraedras projektuojamas į popieriaus plokštumą pagal taisykles: anglies grandinė išdėstoma vertikaliai, viršuje – grandinės pradžia (vyriausioji funkcinė grupė, pavyzdžiui, $COOH$); chiralinis atomas vaizduojamas kryžiaus susikirtimo taške ir simboliu nežymimas; kiti pakaitai rašomi horizontalioje linijoje. Horizontalios linijos nukreiptos į stebėtoją, vertikalios – už popieriaus plokštumos.',
            'In a Fischer projection the tetrahedron is projected onto the plane of the paper by rules: the carbon chain is placed vertically with the start of the chain at the top (the principal functional group, for example $COOH$); the chiral atom is the crossing point of the lines and is not written; the other substituents go on the horizontal line. Horizontal lines point towards the viewer, vertical lines behind the plane.'),
          src: 'L5 p22'
        },
        {
          fischer: { smi: 'C[C@H](O)C(=O)O', top: 3, bottom: 0 },
          caption: t('(S)-pieno rūgštis (L-forma).', '(S)-lactic acid (the L form).'),
          src: 'L5 p22'
        },
        {
          fischer: { smi: 'C[C@@H](O)C(=O)O', top: 3, bottom: 0 },
          caption: t('(R)-pieno rūgštis (D-forma) – pirmosios veidrodinis atspindys.', '(R)-lactic acid (the D form), the mirror image of the first.'),
          src: 'L5 p22'
        },
        {
          rule: t('Fišerio formulės negalima išimti iš lapo plokštumos. Vieną kartą (ar nelyginį kartų skaičių) sukeitus du pakaitus arba pasukus formulę plokštumoje 90°, gaunamas kitas enantiomeras. Dukart sukeitus pakaitus arba pasukus 180°, konfigūracija lieka ta pati.',
            'A Fischer projection must not be lifted out of the plane of the paper. Swapping two substituents (an odd number of times) or turning the formula by 90° in the plane changes the stereochemical meaning: the other enantiomer results. An even number of swaps or a 180° turn leaves the configuration unchanged.'),
          src: 'L5 p22'
        },
        {
          p: t('Tą pačią taisyklę matome ant pavyzdžio: pieno rūgštį (viršuje $COOH$, apačioje $CH3$, kairėje $H$, dešinėje $OH$) pasukus 180° gauname tą pačią medžiagą, o sukeitus $H$ ir $OH$ – enantiomerą.',
            'The same rule on an example: turning lactic acid (top $COOH$, bottom $CH3$, left $H$, right $OH$) by 180° gives the same substance, whereas swapping $H$ and $OH$ gives the enantiomer.'),
          src: 'L5 p22'
        },
        {
          fischer: { rows: [{ left: 'H', right: 'OH' }], top: 'COOH', bottom: 'CH3' },
          caption: t('Pradinė formulė.', 'The starting formula.'),
          src: 'L5 p22'
        },
        {
          fischer: { rows: [{ left: 'HO', right: 'H' }], top: 'CH3', bottom: 'COOH' },
          caption: t('Pasukus 180°: ta pati medžiaga.', 'Turned by 180°: the same substance.'),
          src: 'L5 p22'
        },
        {
          fischer: { rows: [{ left: 'OH', right: 'H' }], top: 'COOH', bottom: 'CH3' },
          caption: t('Sukeitus $H$ ir $OH$: enantiomeras.', 'After swapping $H$ and $OH$: the enantiomer.'),
          src: 'L5 p22'
        },
        { h: t('D,L sistema', 'The D,L system') },
        {
          p: t('D,L sistemoje, kurią sukūrė Fišeris, chiralinio centro konfigūraciją siejame su etalonu – glicerolio aldehidu. Kai Fišerio projekcijoje (oksiduočiausia grupė viršuje) funkcinė grupė ($OH$, $NH2$, halogenas) yra grandinės dešinėje, tai $D$ forma, o kairėje – $L$ forma.',
            'In the D,L system proposed by Fischer, the configuration of a chiral centre is found by comparison with a standard, glyceraldehyde. If in the Fischer projection (the most oxidised group at the top) the functional group ($OH$, $NH2$, halogen) stands on the right of the chain, the enantiomer is $D$; if on the left, it is $L$.'),
          src: 'L5 p23'
        },
        {
          mol: [
            { smi: 'OC[C@@H](O)C=O', name: t('2,3-dihidroksipropanalis', '2,3-dihydroxypropanal') },
            { smi: 'OC[C@H](O)C=O', name: t('2,3-dihidroksipropanalis', '2,3-dihydroxypropanal') }
          ],
          caption: t('D-glicerolio aldehidas ir L-glicerolio aldehidas (pleištinės formulės).', 'D-glyceraldehyde and L-glyceraldehyde (wedge formulas).'),
          src: 'L5 p23'
        },
        {
          fischer: { smi: 'OC[C@@H](O)C=O', top: 4, bottom: 1 },
          caption: t('D-glicerolio aldehidas: $OH$ dešinėje.', 'D-glyceraldehyde: $OH$ on the right.'),
          src: 'L5 p23'
        },
        {
          fischer: { smi: 'OC[C@H](O)C=O', top: 4, bottom: 1 },
          caption: t('L-glicerolio aldehidas: $OH$ kairėje.', 'L-glyceraldehyde: $OH$ on the left.'),
          src: 'L5 p23'
        },
        {
          pitfall: t('Raidės $D,L$, $R,S$ ir ženklai (+), (−) žymi tris skirtingus dalykus: santykinę konfigūraciją, absoliučią konfigūraciją ir išmatuotą sukimo kryptį. Jų nuspėti vienas iš kito negalima. Pavyzdžiui, $D$-glicerolio aldehidas yra $R$ ir (+), o $L$-alaninas yra $S$ ir (+).',
            'The letters $D,L$, $R,S$ and the signs (+), (−) stand for three different things: relative configuration, absolute configuration and measured direction of rotation. One cannot be predicted from another. For example $D$-glyceraldehyde is $R$ and (+), and $L$-alanine is $S$ and (+).')
        },
        { h: t('Chirališkumas gamtoje ir vaistuose', 'Chirality in nature and in drugs') },
        {
          p: t('Baltymai, angliavandeniai ir receptoriai yra chiraliniai, todėl enantiomerus jie atpažįsta skirtingai, kaip dešinė ranka dešinę pirštinę. Limoneno $R$-enantiomeras kvepia apelsinais, $S$-enantiomeras – citrinomis. Vaistų atveju dažnai veikia tik vienas enantiomeras: ibuprofeno aktyvus $S$ (organizme dalis $R$ virsta $S$), levodopos – tik $S$, escitalopramo $S$ ~100 kartų aktyvesnis už $R$; propranololis (hipertenzijos vaistas) parduodamas kaip racematas, nors aktyvus tik $S$, o $R$ įtariamas esant toksiškas. Fermentai gali veikti tik vieną enantiomerą, o tai leidžia juos atskirti.',
            'Proteins, carbohydrates and receptors are chiral, so they recognise the enantiomers differently, like a right hand a right glove. The $R$ enantiomer of limonene smells of oranges and the $S$ enantiomer of lemons. Drugs often act through one enantiomer only: ibuprofen is active as $S$ (in the body part of the $R$ form turns into $S$), levodopa only as $S$, and the $S$ form of escitalopram is about 100 times more active than $R$; propranolol (an antihypertensive) is sold as a racemate although only $S$ is active and $R$ is suspected to be toxic. Enzymes may act on one enantiomer only, which allows them to be separated.'),
          src: 'L5 p26'
        },
        {
          mol: [
            { smi: 'CC1=CC[C@@H](CC1)C(C)=C' },
            { smi: 'CC1=CC[C@H](CC1)C(C)=C' }
          ],
          caption: t('(R)-(+)-limonenas (apelsinai) ir (S)-(−)-limonenas (citrinos).', '(R)-(+)-limonene (oranges) and (S)-(−)-limonene (lemons).'),
          src: 'L5 p26'
        },
        { practice: 'u05.fmoves' },
        { practice: 'u05.dl' },
        { practice: 'u05.reasons' }
      ]
    },

    /* ------------------------------------------------------------ 4 */
    {
      id: 'cip',
      title: t('Kano–Ingolto–Prelogo R,S sistema', 'The R,S system (Cahn–Ingold–Prelog)'),
      blocks: [
        { h: t('Kaip nustatyti R ar S', 'How to assign R or S') },
        {
          p: t('$R,S$ sistema nusako absoliučią chiralinio centro konfigūraciją, remdamasi pakaitų vyresniškumu. Taip enantiomerai gauna skirtingus pavadinimus, kurių nereikia lyginti su etalonu.',
            'The $R,S$ system describes the absolute configuration of a chiral centre using the priorities of the substituents. In this way the enantiomers get different names that need no comparison with a standard.'),
          src: 'L5 p24'
        },
        {
          list: [
            t('Pakaitų pirmenybę lemia atomas, tiesiogiai prisijungęs prie chiralinio centro: kuo didesnis jo atominis skaičius, tuo pakaitas vyresnis (vyresniškumo eilė: $H$ < $C$ < $N$ < $O$ < $Cl$ < $Br$).', 'The priority of a substituent is decided by the atomic number of the first atom bonded to the chiral centre: the higher it is, the senior the substituent ($Br$ > $Cl$ > $O$ > $N$ > $C$ > $H$).'),
            t('Kai pirmieji atomai vienodi (pavyzdžiui, prie centro prisijungusi anglis su funkcine grupe), lyginami prie jų prijungti atomai: $CH2SH$ > $COOH$ > $CHO$ > $CH2OH$.', 'If the first atoms tie (for example a carbon with a functional group), the atoms attached to them are compared: $CH2SH$ > $COOH$ > $CHO$ > $CH2OH$.'),
            t('Molekulę reikia žiūrėti taip, kad jauniausias pakaitas (dažniausiai $H$) būtų kuo toliau nuo stebėtojo.', 'The molecule is viewed so that the lowest-priority substituent (usually $H$) points as far from the viewer as possible.'),
            t('Jei eiga nuo vyriausio iš trijų pakaitų prie jauniausio iš jų sukasi laikrodžio rodyklės kryptimi, konfigūracija $R$ (rectus, dešinysis), jei priešinga kryptimi – $S$ (sinister, kairysis).', 'If the priority decreases clockwise the configuration is $R$ (rectus, right); if anticlockwise it is $S$ (sinister, left).')
          ],
          ordered: true,
          src: 'L5 p24'
        },
        {
          table: {
            head: [t('Pakaitas', 'Substituent'), t('Atomai prie pirmosios anglies', 'Atoms on the first carbon'), t('Vyresniškumas', 'Rank')],
            rows: [
              [f('$I$, $Br$, $Cl$'), t('pirmasis atomas halogenas', 'first atom is a halogen'), t('aukščiausias', 'highest')],
              [f('$OCH3$, $OH$'), t('pirmasis atomas deguonis', 'first atom is oxygen'), t('labai aukštas', 'very high')],
              [f('$NH2$'), t('pirmasis atomas azotas', 'first atom is nitrogen'), t('aukštas', 'high')],
              [f('$COOH$'), f('$(O,O,O)$'), t('aukščiausia iš lentelės anglies grupių', 'highest of the carbon groups in this table')],
              [f('$CHO$'), f('$(O,O,H)$'), t('žemesnė už $COOH$', 'below $COOH$')],
              [f('$CH2OH$'), f('$(O,H,H)$'), t('žemesnė už $CHO$', 'below $CHO$')],
              [f('$C≡N$'), f('$(N,N,N)$'), t('žemesnė už $CH2OH$', 'below $CH2OH$')],
              [f('$C6H5$'), f('$(C,C,C)$'), t('žemesnė už $C≡N$', 'below $C≡N$')],
              [f('$CH=CH2$'), f('$(C,C,H)$'), t('žemesnė už fenilą', 'below phenyl')],
              [f('$CH2CH3$'), f('$(C,H,H)$'), t('žemesnė už vinilą', 'below vinyl')],
              [f('$CH3$'), f('$(H,H,H)$'), t('žemiausia iš anglies grupių', 'lowest of the carbon groups')],
              [f('$H$'), t('–', '–'), t('visada jauniausias', 'always lowest')]
            ]
          },
          src: 'T p44'
        },
        {
          p: t('Dvigubasis ir trigubasis ryšys skaičiuojamas kaip du ar trys tokie patys atomai: $C=O$ prie anglies duoda $(O,O)$, todėl $COOH$ yra $(O,O,O)$, $CHO$ – $(O,O,H)$, $C≡N$ – $(N,N,N)$, fenilas – $(C,C,C)$, vinilas – $(C,C,H)$. Jei antrojo laipsnio atomai vienodi, lyginama toliau: žiūrima, kuriame pakaite pirmą kartą atsiranda didesnio atominio skaičiaus atomas.',
            'A double or triple bond counts the atom at its far end twice or three times: $C=O$ on a carbon gives $(O,O)$, so $COOH$ is $(O,O,O)$, $CHO$ is $(O,O,H)$, $C≡N$ is $(N,N,N)$, phenyl $(C,C,C)$ and vinyl $(C,C,H)$. If the atoms of the second sphere are the same, keep going outward and rank by the first point of difference.'),
          src: 'L5 p24, p43'
        },
        {
          mol: { smi: 'OC[C@@H](O)C=O', name: t('2,3-dihidroksipropanalis', '2,3-dihydroxypropanal') },
          caption: t('(R)-glicerolio aldehidas: $OH$ (1) > $CHO$ (2) > $CH2OH$ (3) > $H$ (4); žiūrint nuo $H$ priešingos pusės 1 → 2 → 3 sukasi pagal laikrodžio rodyklę.', '(R)-glyceraldehyde: $OH$ (1) > $CHO$ (2) > $CH2OH$ (3) > $H$ (4); viewed from the side opposite to $H$, 1 → 2 → 3 runs clockwise.'),
          src: 'L5 p24'
        },
        {
          rule: t('Kai chiralinis centras nupieštas Fišerio projekcijoje, o jauniausias pakaitas yra horizontalioje linijoje (nukreiptas į stebėtoją), matoma eigos 1 → 2 → 3 kryptis yra priešinga tikrajai. Jei jauniausias pakaitas yra vertikalioje linijoje (už plokštumos), kryptis tokia, kokią matote.',
            'When a chiral centre is drawn in a Fischer projection and the lowest-priority group is on a horizontal line (pointing to the viewer), the direction of 1 → 2 → 3 that you see is the opposite of the true one. If the lowest-priority group is on a vertical line (behind the plane), the direction is as you see it.'),
          src: 'L5 p25'
        },
        {
          fischer: { smi: 'OC[C@@H](O)C=O', top: 4, bottom: 1 },
          caption: t('D-glicerolio aldehidas: ant popieriaus eiga $OH$ → $CHO$ → $CH2OH$ sukasi prieš laikrodžio rodyklę, o $H$ nukreiptas į stebėtoją, todėl tikroji kryptis pagal laikrodžio rodyklę: $R$.', 'D-glyceraldehyde: on the paper $OH$ → $CHO$ → $CH2OH$ runs anticlockwise, and $H$ points to the viewer, so the true direction is clockwise: $R$.'),
          src: 'L5 p25'
        },
        {
          example: {
            q: [
              { p: t('Kokia $L$-alanino konfigūracija $R,S$ sistemoje?', 'What is the configuration of $L$-alanine in the $R,S$ system?') },
              { fischer: { smi: 'C[C@H](N)C(=O)O', top: 3, bottom: 0 } }
            ],
            steps: [
              [{ p: t('Pakaitų vyresniškumas: $NH2$ (azotas) > $COOH$ (anglis, prie jos $O,O,O$) > $CH3$ (anglis, prie jos $H,H,H$) > $H$.', 'Priorities: $NH2$ (nitrogen) > $COOH$ (carbon, with $O,O,O$) > $CH3$ (carbon, with $H,H,H$) > $H$.') }],
              [{ p: t('Ant popieriaus: $NH2$ kairėje, $COOH$ viršuje, $CH3$ apačioje. Eiga kairė → viršus → apačia sukasi pagal laikrodžio rodyklę.', 'On the paper: $NH2$ on the left, $COOH$ at the top, $CH3$ at the bottom. The path left → top → bottom runs clockwise.') }],
              [{ p: t('$H$ yra horizontalioje linijoje, nukreiptoje į stebėtoją, todėl tikroji kryptis priešinga: prieš laikrodžio rodyklę.', '$H$ is on a horizontal line pointing to the viewer, so the true direction is reversed: anticlockwise.') }],
              [{ p: t('Konfigūracija yra $S$: $L$-alaninas yra $(S)$-2-aminopropano rūgštis.', 'The configuration is $S$: $L$-alanine is $(S)$-2-aminopropanoic acid.') }]
            ]
          },
          claims: [{ cip: ['C[C@H](N)C(=O)O', 1, 'S'] }, { name: ['CC(N)C(=O)O', t('2-aminopropano rūgštis', '2-aminopropanoic acid')] }]
        },
        {
          pitfall: t('Vyresniškumą lemia atominis skaičius, o ne grandinės ilgis ar grupės dydis: $CH2OH$ vyresnė už $CH2CH3$, nes deguonis vyresnis už anglį. Cisteinas yra $L$ eilės, bet jo konfigūracija $R$, nes $CH2SH$ (siera) vyresnė už $COOH$; serinas ($L$) yra $S$, nes jo $CH2OH$ jaunesnė už $COOH$.',
            'Priority is decided by atomic number, not by chain length or size of the group: $CH2OH$ outranks $CH2CH3$ because oxygen outranks carbon. Cysteine is of the $L$ series but has the $R$ configuration, because $CH2SH$ (sulfur) outranks $COOH$; serine ($L$) is $S$ because its $CH2OH$ ranks below $COOH$.'),
          src: 'S3.14'
        },
        {
          mol: [
            { smi: 'OC[C@H](N)C(=O)O' },
            { smi: 'SC[C@H](N)C(=O)O' }
          ],
          caption: t('$L$-serinas ($S$) ir $L$-cisteinas ($R$): ta pati erdvinė struktūra, skirtingos raidės.', '$L$-serine ($S$) and $L$-cysteine ($R$): the same spatial arrangement, different letters.'),
          src: 'S3.14',
          claims: [{ cip: ['OC[C@H](N)C(=O)O', 2, 'S'] }, { cip: ['SC[C@H](N)C(=O)O', 2, 'R'] }]
        },
        { practice: 'u05.rs' },
        { practice: 'u05.fischer' }
      ]
    },

    /* ------------------------------------------------------------ 5 */
    {
      id: 'diastereomers',
      title: t('Diastereomerai: σ ir π, mezoformos, Z/E', 'Diastereomers: σ and π, meso forms, Z/E'),
      blocks: [
        { h: t('σ-diastereomerai ir stereoizomerų skaičius', 'σ-diastereomers and the number of stereoisomers') },
        {
          p: t('Diastereomerais vadiname stereoizomerus, kurie nesudaro veidrodinės poros. Yra dvi jų rūšys: $σ$-diastereomerai, kuriuose dalis chiralinių centrų turi tą pačią konfigūraciją, o kita dalis – priešingą, ir $π$-diastereomerai, kurių skirtumą lemia dvigubasis ryšys.',
            'Stereoisomers that are not enantiomers (not mirror images of each other) are called diastereomers. They are divided into $σ$- and $π$-diastereomers. In $σ$-diastereomers some chiral centres have the same configuration and others the opposite one, and $π$-diastereomers differ because of a double bond.'),
          src: 'L5 p33'
        },
        {
          rule: t('Molekulė su $n$ chiraliniais centrais gali turėti $2^n^$ stereoizomerų ($2^n−1^$ enantiomerų porų). Pavyzdžiui, cholesterolis turi 8 centrus, todėl galėtų turėti $2^8^$ = 256 stereoizomerus.',
            'A molecule with $n$ chiral centres can have $2^n^$ stereoisomers ($2^n−1^$ enantiomer pairs). Cholesterol, for instance, has 8 centres and could have $2^8^$ = 256 stereoisomers.'),
          src: 'L5 p33'
        },
        {
          mol: { smi: 'CNC(C)C(O)c1ccccc1', name: t('1-fenil-2-metilamino-1-propanolis', '2-(methylamino)-1-phenylpropan-1-ol') },
          caption: t('Efedrinas turi du chiralinius centrus, todėl turi $2^2^$ = 4 stereoizomerus (dvi enantiomerų poros).', 'Ephedrine has two chiral centres, so $2^2^$ = 4 stereoisomers (two pairs of enantiomers).'),
          src: 'S3.4',
          claims: [{ centres: ['CNC(C)C(O)c1ccccc1', [2, 4]] }, { stereoisomers: ['CNC(C)C(O)c1ccccc1', 4] }]
        },
        { h: t('Vyno rūgštis ir mezoformos', 'Tartaric acid and meso forms') },
        {
          p: t('Jeigu abu chiraliniai centrai turi tuos pačius pakaitus, stereoizomerų sumažėja. Pavyzdys – vyno rūgštis (sisteminis pavadinimas 2,3-dihidroksibutano dirūgštis, formulė $HOOC–CHOH–CHOH–COOH$): centrų du, o stereoizomerų tik trys – du enantiomerai ir mezovyno rūgštis. Mezoformą pasukus 180° gaunama ta pati struktūra, todėl ketvirto izomero nėra.',
            'When two chiral centres of a molecule carry the same groups, there are fewer stereoisomers. Tartaric acid (2,3-dihydroxybutanedioic acid) has two chiral centres but only three stereoisomers: two enantiomers and meso-tartaric acid. If the meso form is turned by 180° it gives the same structure, so there is no fourth isomer.'),
          src: 'L5 p34'
        },
        {
          fischer: { smi: 'OC(=O)[C@H](O)[C@H](O)C(=O)O', top: 1, bottom: 7 },
          caption: t('Mezovyno rūgštis $(2R,3S)$: simetrijos plokštuma kerta vidurį tarp centrų, formulė achiralinė.', 'meso-Tartaric acid $(2R,3S)$: a plane of symmetry passes between the centres, the formula is achiral.'),
          src: 'L5 p34',
          claims: [{ cip: ['OC(=O)[C@H](O)[C@H](O)C(=O)O', 3, 'R'] }, { cip: ['OC(=O)[C@H](O)[C@H](O)C(=O)O', 5, 'S'] }, { chiral: ['OC(=O)[C@H](O)[C@H](O)C(=O)O', false] }]
        },
        {
          fischer: { smi: 'OC(=O)[C@H](O)[C@@H](O)C(=O)O', top: 1, bottom: 7 },
          caption: t('Vyno rūgštis $(2R,3R)$.', 'Tartaric acid $(2R,3R)$.'),
          src: 'L5 p34',
          claims: [{ cip: ['OC(=O)[C@H](O)[C@@H](O)C(=O)O', 3, 'R'] }, { cip: ['OC(=O)[C@H](O)[C@@H](O)C(=O)O', 5, 'R'] }, { chiral: ['OC(=O)[C@H](O)[C@@H](O)C(=O)O', true] }]
        },
        {
          fischer: { smi: 'OC(=O)[C@@H](O)[C@H](O)C(=O)O', top: 1, bottom: 7 },
          caption: t('Vyno rūgštis $(2S,3S)$ – ankstesnės enantiomeras.', 'Tartaric acid $(2S,3S)$, the enantiomer of the previous one.'),
          src: 'L5 p34',
          claims: [{ cip: ['OC(=O)[C@@H](O)[C@H](O)C(=O)O', 3, 'S'] }, { cip: ['OC(=O)[C@@H](O)[C@H](O)C(=O)O', 5, 'S'] }, { chiral: ['OC(=O)[C@@H](O)[C@H](O)C(=O)O', true] }]
        },
        {
          p: t('Mezoforma ir kiekvienas iš enantiomerų yra diastereomerai, todėl jų savybės skirtingos, o enantiomerų – vienodos (išskyrus sukimo ženklą).', 'The meso form and either enantiomer are diastereomers, so their properties differ, whereas the enantiomers share theirs (except the sign of rotation).'),
          src: 'L5 p35'
        },
        {
          table: {
            head: [t('Vyno rūgštis', 'Tartaric acid'), t('Lydymosi temperatūra, °C', 'Melting point, °C'), t('Sukimo kampas, °', 'Rotation, °')],
            rows: [
              [t('(+) enantiomeras', '(+) enantiomer'), f('171'), f('+12')],
              [t('(−) enantiomeras', '(−) enantiomer'), f('171'), f('−12')],
              [t('racematas (mišinys)', 'racemate (mixture)'), f('206'), f('0')],
              [t('mezoforma', 'meso form'), f('147'), f('0')]
            ]
          },
          src: 'L5 p35'
        },
        {
          rule: t('Mezojunginys turi chiralinių centrų, bet yra achiralinis, nes turi simetrijos plokštumą, todėl optiškai neaktyvus. Mezoforma yra viena medžiaga (vidinė kompensacija), o racematas – dviejų enantiomerų mišinys (išorinė kompensacija).',
            'A meso compound has chiral centres but is achiral because it has a plane of symmetry, so it is optically inactive. A meso form is one substance (internal compensation), whereas a racemate is a mixture of two enantiomers (external compensation).'),
          src: 'L5 p34'
        },
        {
          pitfall: t('Mezoforma gaunama tik tada, kai abu centrai pakeisti vienodai ir turi priešingas konfigūracijas ($R,S$). Konfigūracijos $(R,R)$ ir $(S,S)$ yra enantiomerai, o $(R,S)$ ir $(S,R)$ – ta pati medžiaga, nors nupiešti skirtingai.',
            'A meso form arises only when both centres carry the same groups and have opposite configurations ($R,S$). The configurations $(R,R)$ and $(S,S)$ are enantiomers, whereas $(R,S)$ and $(S,R)$ are the same substance drawn differently.')
        },
        {
          example: {
            q: [
              { p: t('Kiek stereoizomerų turi 2,3-dichlorbutanas ir ar visi jie optiškai aktyvūs?', 'How many stereoisomers does 2,3-dichlorobutane have, and are all of them optically active?') },
              { mol: { smi: 'CC(Cl)C(C)Cl', name: t('2,3-dichlorbutanas', '2,3-dichlorobutane'), opts: { numbers: 'all' } } }
            ],
            steps: [
              [{ p: t('Chiraliniai centrai yra atomai Nr. 2 ir Nr. 4 (C2 ir C3): kiekvienas turi $H$, $Cl$, $CH3$ ir $CHClCH3$.', 'The chiral centres are atom no. 2 and atom no. 4 (C2 and C3): each carries $H$, $Cl$, $CH3$ and $CHClCH3$.') }],
              [{ p: t('Pagal $2^n^$ turėtų būti $2^2^$ = 4 izomerai: $(R,R)$, $(S,S)$, $(R,S)$, $(S,R)$.', 'By $2^n^$ there would be $2^2^$ = 4 isomers: $(R,R)$, $(S,S)$, $(R,S)$, $(S,R)$.') }],
              [{ p: t('Abu centrai pakeisti vienodai, todėl $(R,S)$ ir $(S,R)$ yra ta pati achiralinė mezoforma.', 'Both centres carry the same groups, so $(R,S)$ and $(S,R)$ are the same achiral meso form.') }],
              [{ p: t('Iš viso trys stereoizomerai: du enantiomerai (optiškai aktyvūs) ir mezoforma (neaktyvi).', 'In total three stereoisomers: two enantiomers (optically active) and the meso form (inactive).') }]
            ]
          },
          claims: [{ centres: ['CC(Cl)C(C)Cl', [1, 3]] }, { stereoisomers: ['CC(Cl)C(C)Cl', 3] }, { name: ['CC(Cl)C(C)Cl', t('2,3-dichlorbutanas', '2,3-dichlorobutane')] }]
        },
        { h: t('π-diastereomerai: cis,trans ir Z,E', 'π-diastereomers: cis,trans and Z,E') },
        {
          p: t('$π$-Diastereomerai yra stereoizomerai su $π$ ryšiu; jie atsiranda todėl, kad sukimasis apie dvigubąjį ryšį negalimas. Jų molekulės achiralinės (turi simetrijos plokštumą, kurioje guli $sp2$ anglies atomų $σ$ ryšiai), bet fizikinės ir cheminės savybės skiriasi.',
            '$π$-Diastereomers are stereoisomers that contain a $π$ bond; they exist because rotation about a double bond is impossible. Their molecules are achiral (they have a plane of symmetry containing the $σ$ bonds of the $sp2$ carbons), but their physical and chemical properties differ.'),
          src: 'L5 p38'
        },
        {
          mol: [
            { smi: 'C/C=C\\C' },
            { smi: 'C/C=C/C' }
          ],
          caption: t('Cis: du vienodi pakaitai guli toje pačioje dvigubojo ryšio plokštumos pusėje; trans: priešingose pusėse.', 'Cis: identical substituents on the same side of the plane of the $π$ bond; trans: on opposite sides.'),
          src: 'L5 p38'
        },
        {
          p: t('Kai prie dvigubojo ryšio atomų yra visiškai skirtingi pakaitai, cis ir trans nebetinka, todėl taikomas $Z,E$ žymėjimas. Pakaitai rūšiuojami pagal vyresniškumą tomis pačiomis taisyklėmis kaip $R,S$ atveju. Kai abu vyresnieji pakaitai guli vienoje dvigubojo ryšio pusėje, izomeras vadinamas $Z$ (vok. zusammen, kartu); kai skirtingose – $E$ (entgegen, priešingai).',
            'When the substituents on the double bond are all different, cis,trans no longer fits and the $Z,E$ system is used. The priorities of the substituents are decided as in the $R,S$ system. If the two senior substituents are on the same side of the plane of the $π$ bond the isomer is $Z$ (zusammen, together), if on opposite sides $E$ (entgegen, opposite).'),
          src: 'L5 p40'
        },
        {
          mol: [
            { smi: 'C(/Cl)(Br)=C(/C(=O)O)' },
            { smi: 'C(/Cl)(Br)=C(' + BS + 'C(=O)O)' }
          ],
          caption: t('Vyresnieji pakaitai: $Br$ (prieš $Cl$) ir $COOH$ (prieš $H$). Priešingose pusėse – $E$, toje pačioje – $Z$.', 'Senior substituents: $Br$ (over $Cl$) and $COOH$ (over $H$). On opposite sides is $E$, on the same side $Z$.'),
          src: 'L5 p40',
          claims: [{ ez: ['C(/Cl)(Br)=C(/C(=O)O)', 0, 3, 'E'] }, { ez: ['C(/Cl)(Br)=C(' + BS + 'C(=O)O)', 0, 3, 'Z'] }]
        },
        {
          pitfall: t('Cis ir $Z$ ne visada sutampa: $Z,E$ žiūri į pakaitų vyresniškumą, o cis,trans – į vienodus pakaitus. Jei prie dvigubojo ryšio yra trys ar keturi skirtingi pakaitai, vartokite $Z,E$.',
            'Cis and $Z$ do not always coincide: $Z,E$ looks at priorities, cis,trans at identical groups. If the double bond carries three or four different substituents, use $Z,E$.')
        },
        {
          example: {
            q: [
              { p: t('Nustatykite 2-metil-2-buten-1-olio izomero konfigūraciją $Z,E$ sistemoje.', 'Determine the $Z,E$ configuration of this 2-methyl-2-buten-1-ol isomer.') },
              { mol: { smi: 'OC/C(C)=C/C', name: t('2-metil-2-buten-1-olis', '2-methylbut-2-en-1-ol'), opts: { numbers: { 1: '1', 2: '2', 4: '3', 5: '4' } } } }
            ],
            steps: [
              [{ p: t('Prie C2 yra $CH2OH$ ir $CH3$: $CH2OH$ vyresnė (deguonis vyresnis už vandenilį prie pirmosios anglies).', 'On C2 there are $CH2OH$ and $CH3$: $CH2OH$ is senior (oxygen outranks hydrogen on the first carbon).') }],
              [{ p: t('Prie C3 yra $CH3$ ir $H$: vyresnė $CH3$.', 'On C3 there are $CH3$ and $H$: $CH3$ is senior.') }],
              [{ p: t('$CH2OH$ (C2) ir $CH3$ (C3) yra priešingose dvigubojo ryšio pusėse.', '$CH2OH$ (on C2) and $CH3$ (on C3) are on opposite sides of the double bond.') }],
              [{ p: t('Vyresnieji pakaitai priešingose pusėse, todėl tai $E$ izomeras.', 'The senior substituents are on opposite sides, so this is the $E$ isomer.') }]
            ]
          },
          claims: [{ ez: ['OC/C(C)=C/C', 2, 4, 'E'] }, { name: ['OC/C(C)=C/C', t('2-metil-2-buten-1-olis', '2-methylbut-2-en-1-ol')] }]
        },
        { h: t('Ciklinių junginių diastereomerija', 'Diastereomerism of cyclic compounds') },
        {
          p: t('Žiedo atomų pakaitai gali stovėti ta pačia žiedo plokštumos puse (cis) arba skirtingomis pusėmis (trans); tokie stereoizomerai yra diastereomerai. Kai pakaitai vienodi, galioja tokios taisyklės: ciklobutano 1,3-dariniai ir cikloheksano 1,4-dariniai yra achiraliniai (chiralinių centrų neturi), todėl jiems egzistuoja tik cis ir trans formos. Visi kiti dipakeisti ciklai (ciklobutano, ciklopentano, cikloheksano) turi po du chiralinius centrus: cis forma – mezoforma, o trans forma chiralinė ir yra enantiomerų pora.',
            'In cycloalkanes two or more substituents can be on the same (cis) or on different (trans) faces of the ring plane. Such stereoisomers are diastereomers. For two identical substituents the rules are: 1,3-disubstituted cyclobutanes and 1,4-disubstituted cyclohexanes are achiral (without chiral centres), so only the cis and trans isomers exist. Other disubstituted cyclobutanes, cyclopentanes and cyclohexanes have two chiral centres: the cis isomer is a meso form, the trans isomer is chiral and exists as a pair of enantiomers.'),
          src: 'L5 p37, p64'
        },
        {
          mol: [
            { smi: 'O[C@H]1CCCC[C@@H]1O' },
            { smi: 'O[C@@H]1CCCC[C@H]1O' },
            { smi: 'O[C@H]1CCCC[C@H]1O' }
          ],
          caption: t('Cikloheksan-1,2-diolio stereoizomerų yra trys, ne keturi: dvi trans formos (enantiomerai) ir cis mezoforma.', 'Cyclohexane-1,2-diol has only 3 stereoisomers: a trans pair of enantiomers and the cis meso form (not 4).'),
          src: 'L5 p64',
          claims: [{ stereoisomers: ['OC1CCCCC1O', 3] }, { chiral: ['O[C@H]1CCCC[C@@H]1O', true] }, { chiral: ['O[C@H]1CCCC[C@H]1O', false] }]
        },
        { practice: 'u05.meso' },
        { practice: 'u05.pairs' },
        { practice: 'u05.ez' },
        { practice: 'u05.ezcase' }
      ]
    },

    /* ------------------------------------------------------------ 6 */
    {
      id: 'conformers',
      title: t('Konformacijos: etanas ir butanas, Njumeno projekcijos', 'Conformations: ethane and butane, Newman projections'),
      blocks: [
        { h: t('Sukimasis apie σ ryšį', 'Rotation about a σ bond') },
        {
          p: t('$σ$ ryšys yra ašinis orbitalių persidengimas, todėl apie viengubąjį ryšį grupės gali suktis ir skirtingos molekulės dalys erdvėje atsiduria nevienodose padėtyse. Šios molekulės formos vadinamos konformacijomis. Konformeriais (konformaciniais izomerais) vadiname stereoizomerus, kurie skiriasi tik molekulės dalių pasisukimu apie viengubąjį ryšį; vienam virsti kitu ryšių nutraukti nereikia.',
            'A $σ$ bond is an axial overlap of orbitals, so atoms and groups can rotate about a single bond and different parts of the molecule take up different positions in space. Conformations are the different geometric shapes of a molecule that result from this rotation. Conformational isomers (conformers) are stereoisomers whose difference comes from rotation of parts of the molecule about a single bond; no bond needs to be broken for one to turn into another.'),
          src: 'L5 p45–46'
        },
        {
          p: t('Konformacijoms vaizduoti naudojamos Njumeno projekcinės formulės: žiūrime išilgai $C–C$ ryšio. Arčiau stebėtojo esantis anglies atomas yra apskritimo centre (jo trys ryšiai susieina centre), tolimesnysis – apskritimas (jo ryšiai prasideda už apskritimo krašto).',
            'Conformations are drawn with Newman projections: we look along the $C–C$ bond. The carbon nearer the viewer is at the centre of the circle (its three bonds meet in the centre), the farther carbon is the circle (its bonds start at the edge of the circle).'),
          src: 'L5 p46'
        },
        { h: t('Etano konformacijos', 'Conformations of ethane') },
        {
          newman: { front: ['H', 'H', 'H'], back: ['H', 'H', 'H'], angle: 60 },
          caption: t('Sustabdytoji konformacija: ryšiai kuo toliau vienas nuo kito.', 'The staggered conformation: the bonds are as far apart as possible.'),
          src: 'L5 p47'
        },
        {
          newman: { front: ['H', 'H', 'H'], back: ['H', 'H', 'H'], angle: 0 },
          caption: t('Užstotoji konformacija: ryšiai vienas prieš kitą (užpakalinis ryšys nupieštas šiek tiek į šoną, kad būtų matomas).', 'The eclipsed conformation: the bonds are right in front of each other (the back bonds are drawn a little aside so that they stay visible).'),
          src: 'L5 p47'
        },
        {
          rule: t('Užstotoji konformacija turi didžiausią energiją, nes suartėja $C–H$ ryšių elektronai (torsinė, Pitzerio įtempis); sustabdytoji – mažiausią. Etano energijų skirtumas (sukimosi barjeras) yra 12 kJ/mol; jis mažas, todėl kambario temperatūroje etanas sukasi nuolat ir yra konformacijų pusiausvyrinis mišinys.',
            'The eclipsed conformation has the highest energy because the $C–H$ bonding electrons come close (torsional or Pitzer strain); the staggered one has the lowest. For ethane the energy difference (the rotational barrier) is 12 kJ/mol; it is small, so at room temperature ethane rotates all the time and is an equilibrium mixture of conformations.'),
          src: 'L5 p47'
        },
        { h: t('Butano konformacijos (C2–C3 ryšys)', 'Conformations of butane (the C2–C3 bond)') },
        {
          p: t('Keičiant vandenilius metilo grupėmis, atsiranda didelių grupių atostūmis (van der Valso jėgos), todėl konformacijos tampa nevienodos. Žiūrint išilgai $C2–C3$ ryšio, svarbiausios keturios: anti, goš (gauche), užstotoji su užstotais vandeniliais ir užstotoji, kurioje $CH3$ užstoja $CH3$.',
            'Replacing hydrogens by methyl groups brings repulsion between large groups (van der Waals forces), so the conformations are no longer equal. Looking along the $C2–C3$ bond four are the most important: anti, gauche, eclipsed with hydrogens eclipsing, and eclipsed with $CH3$ in front of $CH3$.'),
          src: 'L5 p49'
        },
        { newman: { front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 180 }, caption: t('Anti (180°): mažiausia energija.', 'Anti (180°): the lowest energy.'), src: 'L5 p49' },
        { newman: { front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 60 }, caption: t('Goš (60°): maždaug 4 kJ/mol aukščiau.', 'Gauche (60°): about 4 kJ/mol higher.'), src: 'L5 p49' },
        { newman: { front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 120 }, caption: t('Užstotoji (120°): maždaug 16 kJ/mol.', 'Eclipsed (120°): about 16 kJ/mol.'), src: 'L5 p49' },
        { newman: { front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 0 }, caption: t('Užstotoji (0°): $CH3$ prieš $CH3$, apie 19 kJ/mol – didžiausia energija.', 'Eclipsed (0°): $CH3$ in front of $CH3$, about 19 kJ/mol, the highest energy.'), src: 'L5 p49' },
        {
          table: {
            head: [t('Kampas tarp $CH3$ grupių', 'Angle between the $CH3$ groups'), t('Konformacija', 'Conformation'), t('Energija, kJ/mol', 'Energy, kJ/mol')],
            rows: [
              [f('180°'), t('anti, sustabdytoji', 'anti, staggered'), f('0')],
              [f('60°, 300°'), t('goš, sustabdytoji', 'gauche, staggered'), f('≈ 4')],
              [f('120°, 240°'), t('užstotoji ($CH3$ prieš $H$)', 'eclipsed ($CH3$ in front of $H$)'), f('≈ 16')],
              [f('0°'), t('užstotoji ($CH3$ prieš $CH3$)', 'eclipsed ($CH3$ in front of $CH3$)'), f('≈ 19')]
            ]
          },
          src: 'L5 p49'
        },
        {
          p: t('Kambario temperatūroje apie 69 % butano molekulių yra anti konformacijos (mažiausia energija), apie 31 % – goš.', 'At room temperature about 69 % of the butane molecules are in the anti conformation (lowest energy) and about 31 % in the gauche conformation.'),
          src: 'L5 p49'
        },
        {
          pitfall: t('Goš konformacija yra sustabdytoji, ne užstotoji: ji turi daugiau energijos už anti tik todėl, kad didelės grupės arti viena kitos, ne dėl užstotų ryšių. Ir nepamirškite, kuris atomas yra priekyje: ryšiai iš centro priklauso arčiau esančiam atomui, o ryšiai, prasidedantys apskritime, – tolimesniam.',
            'The gauche conformation is staggered, not eclipsed: its energy is above anti only because the large groups are close, not because of eclipsed bonds. And do not forget which atom is in front: bonds from the centre belong to the nearer atom, bonds that start on the circle to the farther one.')
        },
        {
          example: {
            q: [
              { p: t('Nubraižykite stabiliausią ir nestabiliausią 1-chlorpropano konformaciją žiūrint išilgai $C1–C2$ ryšio.', 'Draw the most stable and the least stable conformation of 1-chloropropane looking along the $C1–C2$ bond.') },
              { mol: { smi: 'ClCCC', name: t('1-chlorpropanas', '1-chloropropane'), opts: { highlight: { bonds: [[1, 2]], tone: 2 } } } }
            ],
            steps: [
              [{ p: t('Priekinis atomas $C1$ turi $Cl$, $H$, $H$; užpakalinis $C2$ turi $CH3$, $H$, $H$. Dvi didelės grupės: $Cl$ ir $CH3$.', 'The front atom $C1$ carries $Cl$, $H$, $H$; the back atom $C2$ carries $CH3$, $H$, $H$. The two large groups are $Cl$ and $CH3$.') }],
              [{ p: t('Stabiliausia – sustabdytoji, kurioje $Cl$ ir $CH3$ yra kuo toliau viena nuo kitos (anti, 180°).', 'The most stable one is staggered, with $Cl$ and $CH3$ as far apart as possible (anti, 180°).') }, { newman: { front: ['Cl', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 180 } }],
              [{ p: t('Nestabiliausia – užstotoji, kurioje $Cl$ stovi tiesiai prieš $CH3$ (0°): čia veikia ir torsinė įtampa, ir didelių grupių atostūmis.', 'The least stable one is eclipsed with $Cl$ directly in front of $CH3$ (0°): torsional strain and repulsion of the large groups act together.') }, { newman: { front: ['Cl', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 0 } }]
            ]
          },
          claims: [{ name: ['ClCCC', t('1-chlorpropanas', '1-chloropropane')] }]
        },
        { practice: 'u05.newman' },
        { practice: 'u05.confreason' }
      ]
    },

    /* ------------------------------------------------------------ 7 */
    {
      id: 'rings',
      title: t('Cikloalkanų konformacijos: kėdė, ašiniai ir ekvatoriniai ryšiai', 'Conformations of cycloalkanes: the chair, axial and equatorial bonds'),
      blocks: [
        { h: t('Žiedo įtempis', 'Ring strain') },
        {
          p: t('Ciklų stabilumą mažina kampinė (Bajerio) įtemptis, atsirandanti dėl valentinių kampų nukrypimo nuo $sp3$ hibridizacijos anglies kampo 109,5°, ir torsinė įtemptis dėl užstotų ryšių.',
            'The stability of rings is lowered by angle (Baeyer) strain, caused by the bond angles deviating from the 109.5° of an $sp3$ atom, and by torsional strain from eclipsed bonds.'),
          src: 'L5 p51'
        },
        {
          table: {
            head: [t('Ciklas', 'Ring'), t('Kampo skirtumas nuo 109,5°', 'Angle difference from 109.5°'), t('Pastaba', 'Remark')],
            rows: [
              [t('ciklopropanas', 'cyclopropane'), f('109,5° − 60° = 49,5°'), t('plokščias, visi $H$ užstoti, „bananiniai“ ryšiai; reakcijose lengvai atsiveria', 'planar, all $H$ eclipsed, “banana” bonds; opens easily in reactions')],
              [t('ciklobutanas', 'cyclobutane'), f('109,5° − 90° = 19,5°'), t('neplokščias („sulenktas kvadratas“), žemas perėjimo barjeras', 'not planar (a “folded square”), low barrier between forms')],
              [t('ciklopentanas', 'cyclopentane'), f('109,5° − 108° = 1,5°'), t('voko konformacija, ciklas „pulsuoja“, patvarus', 'envelope conformation, the ring “pulsates”, stable')],
              [t('cikloheksanas', 'cyclohexane'), f('0°'), t('kėdė: kampai 109,5°, užstotų padėčių nėra, mažiausia energija', 'chair: angles 109.5°, no eclipsed positions, lowest energy')]
            ]
          },
          src: 'L5 p51–55'
        },
        { h: t('Cikloheksano kėdė', 'The cyclohexane chair') },
        {
          p: t('Plokščias cikloheksanas būtų labai įtemptas (kampai 120°, visi $H$ užstoti), todėl jis egzistuoja neplokščiomis formomis. Patvariausia yra kėdė, kurioje nėra nei kampinės įtempties, nei užstotų padėčių. Valties konformacijoje $H$ atomai prie $C2$ ir $C3$ bei $C5$ ir $C6$ užstoti, o dar du ($H$ „vėliavos stulpai“) arti vienas kito, todėl valties energija maždaug 30 kJ/mol didesnė; kambario temperatūroje 99,99 % molekulių yra kėdės konformacijos.',
            'Planar cyclohexane would be very strained (angles 120°, all $H$ eclipsed), so it exists in non-planar forms. The most stable is the chair, with neither angle strain nor eclipsed positions. In the boat conformation the hydrogens on $C2$ and $C3$ and on $C5$ and $C6$ are eclipsed and two more (the “flagpole” hydrogens) are close together, so the boat is about 30 kJ/mol higher in energy; at room temperature 99.99 % of the molecules are in the chair.'),
          src: 'L5 p55–56'
        },
        {
          p: t('Kėdėje yra dvi $C–H$ ryšių rūšys. Ašiniais (a) vadinami šeši ryšiai, einantys lygiagrečiai kėdės ašiai: vienas atomas juos nukreipia į viršų, gretimas – žemyn. Kiti šeši, ekvatoriniai (e), su ašimi sudaro maždaug 109,5° kampą ir taip pat kaitaliojasi aukštyn ir žemyn. Kiekviena anglis turi po vieną ašinį ir vieną ekvatorinį ryšį.',
            'Six $C–H$ bonds parallel to the symmetry axis of the chair and pointing alternately up and down are called axial (a). The other six lie at about 109.5° to the axis, also alternately up and down, and are called equatorial (e). Every carbon carries one axial and one equatorial bond.'),
          src: 'L5 p57'
        },
        {
          chair: { subs: [1, 2, 3, 4, 5, 6].map(p => ({ pos: p, ax: true, label: '' })) },
          caption: t('Šeši ašiniai ryšiai: vertikalūs, gretimuose atomuose nukreipti priešingomis kryptimis.', 'The six axial bonds: vertical, pointing in opposite directions on neighbouring atoms.'),
          src: 'L5 p57'
        },
        {
          chair: { subs: [1, 2, 3, 4, 5, 6].map(p => ({ pos: p, ax: false, label: '' })) },
          caption: t('Šeši ekvatoriniai ryšiai: pasvirę į šoną, beveik ciklo plokštumoje; prie to paties atomo jis nukreiptas priešinga kryptimi nei ašinis.', 'The six equatorial bonds: tilted sideways, nearly in the plane of the ring; on the same atom it points the opposite way to the axial bond.'),
          src: 'L5 p57'
        },
        {
          p: t('Kėdės piešimas: 1) pirmiausia dvi vienodo ilgio pasvirusios lygiagrečios atkarpos; 2) jų viršutinius galus sujunkite plačiai atverta „V“, kurios kairioji šaka ilgesnė, o apatinius – apversta „V“ su trumpesne kairiąja šaka, kad priešingos šešiakampio kraštinės liktų lygiagrečios; 3) ašinius ryšius brėžkite vertikaliai, paeiliui aukštyn ir žemyn, o ekvatorinius – lygiagrečiai ciklo kraštinėms, einančioms per vieną atomą toliau.',
            'To draw a chair: 1) draw two parallel slanted lines of equal length; 2) join the tops with a widened “V” whose left part is longer, and the bottoms with an inverted “V” whose left part is shorter (opposite sides of the hexagon are parallel); 3) draw the axial bonds vertically, alternately up and down, and the equatorial bonds parallel to the ring bonds one atom away.'),
          src: 'L5 p58'
        },
        { h: t('Ciklo inversija', 'Ring inversion') },
        {
          p: t('Cikloheksanas turi dvi vienodos energijos kėdės formas. Viena virsta kita per tarpines formas (pusę kėdės, tvist valtį, valtį), įveikdama maždaug 45 kJ/mol barjerą. Šis virsmas vadinamas ciklo inversija: ašiniai pakaitai pereina į ekvatorines padėtis, o ekvatoriniai – į ašines.',
            'Cyclohexane has two chair conformations of equal energy. One turns into the other through intermediate forms (half-chair, twist-boat, boat); the energy barrier is about 45 kJ/mol. This process is called ring inversion; in it the axial bonds become equatorial and the equatorial bonds become axial.'),
          src: 'L5 p59–60'
        },
        {
          rule: t('Ciklo inversijoje pakaito kryptis (į viršų ar į apačią) nesikeičia: pakaitas, buvęs ašinis ir nukreiptas aukštyn, tampa ekvatoriniu, bet vis dar žiūri į viršų. Todėl cis ir trans padėtis ciklo inversija nepakeičiama.',
            'In ring inversion the face of a substituent (up or down) does not change: a substituent that was axial and pointing up becomes equatorial but still points up. A cis or trans relationship is therefore not altered by ring inversion.'),
          src: 'L5 p61'
        },
        { h: t('Pakeisti cikloheksanai', 'Substituted cyclohexanes') },
        {
          p: t('Kai monopakeisto cikloheksano pakaitas yra ašinis, jis artimai sąveikauja su kitais tos pačios žiedo pusės ašiniais $H$ (1,3-diašinė sąveika), todėl palankesnė ekvatorinė padėtis, nutolusi nuo žiedo. Metilcikloheksane ekvatorinė forma 7,5 kJ/mol stabilesnė (95 % molekulių), o su $tert$-butilo grupe ekvatorinės formos yra 99,99 %.',
            'In a monosubstituted cyclohexane an axial substituent interacts closely with the other axial $H$ on the same side of the ring (1,3-diaxial interaction), so the more stable conformation has the substituent equatorial, away from the ring. In methylcyclohexane the equatorial form is 7.5 kJ/mol more stable (95 % equatorial), and with a $tert$-butyl group 99.99 % of the molecules have it equatorial.'),
          src: 'L5 p62'
        },
        {
          chair: { subs: [{ pos: 1, ax: false, label: 'CH3' }] },
          caption: t('Metilcikloheksanas, $CH3$ ekvatorinėje padėtyje (stabilesnė forma).', 'Methylcyclohexane with $CH3$ equatorial (the more stable form).'),
          src: 'L5 p62'
        },
        {
          chair: { subs: [{ pos: 1, ax: false, label: 'CH3' }], flip: true },
          caption: t('Po ciklo inversijos $CH3$ ašinis (apie 5 % molekulių).', 'After ring inversion $CH3$ is axial (about 5 % of the molecules).'),
          src: 'L5 p62'
        },
        {
          table: {
            head: [t('Dipakeistas cikloheksanas', 'Disubstituted cyclohexane'), t('cis', 'cis'), t('trans', 'trans')],
            rows: [
              [f('1,2'), t('ašinė, ekvatorinė (a,e)', 'axial, equatorial (a,e)'), t('abu ekvatoriniai (e,e) arba abu ašiniai (a,a)', 'both equatorial (e,e) or both axial (a,a)')],
              [f('1,3'), t('(e,e) arba (a,a)', '(e,e) or (a,a)'), t('(a,e)', '(a,e)')],
              [f('1,4'), t('(a,e)', '(a,e)'), t('(e,e) arba (a,a)', '(e,e) or (a,a)')]
            ]
          },
          src: 'L5 p63'
        },
        {
          p: t('cis-1,3-Dipakeistame cikloheksane stabilesnė kėdė, kurioje abu pakaitai ekvatoriniai (jei ašinės grupės nesudaro vandenilinio ryšio). trans-1,3 darinyje vienas pakaitas visada ašinis, todėl stabilesnę kėdę reikia nustatyti iš papildomų duomenų: ašinis etilas kainuoja apie 8 kJ/mol, ašinis chloras – apie 2 kJ/mol, tad stabilesnė forma, kurioje ašinis yra chloras.',
            'For cis-1,3-disubstituted cyclohexane the more stable conformation has both substituents equatorial (if the axial substituents cannot form hydrogen bonds). In a trans-1,3 compound one substituent is always axial, so the more stable conformation must be found from extra data: an axial ethyl group costs about 8 kJ/mol, an axial chlorine about 2 kJ/mol, so the more stable form has chlorine axial.'),
          src: 'L5 p63'
        },
        {
          chair: { subs: [{ pos: 2, ax: false, label: 'CH3' }, { pos: 4, ax: false, label: 'CH3' }] },
          caption: t('cis-1,3-Dimetilcikloheksanas: abi metilo grupės ekvatorinės (stabilesnė kėdė).', 'cis-1,3-Dimethylcyclohexane: both methyl groups equatorial (the more stable chair).'),
          src: 'L5 p63'
        },
        {
          chair: { subs: [{ pos: 2, ax: false, label: 'CH3' }, { pos: 4, ax: false, label: 'CH3' }], flip: true },
          caption: t('Ta pati molekulė po ciklo inversijos: abi grupės ašinės, labai nepalanku.', 'The same molecule after ring inversion: both groups axial, very unfavourable.'),
          src: 'L5 p63'
        },
        {
          pitfall: t('Kėdės konformacijos nepainiokite su cis,trans izomeriją: konformacijos greitai (ciklo inversija) virsta viena kita, o cis ir trans yra du skirtingi junginiai, kurie vienas į kitą nevirsta nenutraukus ryšių.',
            'Do not confuse chair conformations with cis,trans isomerism: conformations interconvert quickly (ring inversion), whereas cis and trans are two different compounds that do not interconvert without breaking bonds.')
        },
        {
          p: t('Cikloheksano žiedas yra daugelio gamtinių junginių dalis. Mioinozitolis (vitaminas B8) kėdės konformacijoje turi 5 ekvatorinius ir 1 ašinį $OH$. $β$-Gliukozė (šešianaris žiedas su ciklo deguonimi) stabiliausioje kėdėje visus pakaitus turi ekvatorinėje padėtyje, todėl yra stabilesnė už $α$-gliukozę ir manozę, kuriose viena $OH$ grupė ašinė. Kamparas – pavyzdys, kai cikloheksano žiedas yra valties formos.',
            'The cyclohexane ring is part of many natural compounds. myo-Inositol (vitamin B8) has 5 equatorial and 1 axial $OH$ in its chair. $β$-Glucose (a six-membered ring with a ring oxygen) has all its substituents equatorial in the most stable chair, so it is more stable than $α$-glucose and mannose, in which one $OH$ group is axial. Camphor is an example where the six-membered ring is in the boat form.'),
          src: 'L5 p65–66'
        },
        {
          chair: { subs: [{ pos: 6, ax: false, label: 'OH' }, { pos: 1, ax: false, label: 'OH' }, { pos: 2, ax: false, label: 'OH' }, { pos: 3, ax: false, label: 'OH' }, { pos: 4, ax: false, label: 'CH2OH' }] },
          caption: t('$β$-D-Gliukopiranozė stabiliausioje kėdėje: visi penki pakaitai ekvatoriniai; šeštoji viršūnė be užrašo – tarp anglies su $CH2OH$ ir anglies su $OH$ – yra ciklo deguonis.', '$β$-D-Glucopyranose in its most stable chair: all five substituents equatorial; the unlabelled sixth vertex, between the carbon with $CH2OH$ and the carbon with $OH$, is the ring oxygen.'),
          src: 'L5 p66'
        },
        { practice: 'u05.chair' },
        { practice: 'u05.confreason' }
      ]
    }
  ];

  const SUMMARY = [
    { h: t('Santrauka', 'Summary') },
    {
      table: {
        head: [t('Izomerų rūšis', 'Kind of isomer'), t('Kuo skiriasi', 'What differs'), t('Pavyzdys', 'Example')],
        rows: [
          [t('grandinės (skeleto)', 'chain (skeleton)'), t('anglies skeletas', 'carbon skeleton'), t('pentanas, 2-metilbutanas', 'pentane, 2-methylbutane')],
          [t('padėties', 'position'), t('dvigubojo ryšio ar grupės vieta', 'place of the double bond or group'), t('1-butenas, 2-butenas', '1-butene, 2-butene')],
          [t('funkciniai', 'functional'), t('funkcinė grupė', 'functional group'), t('etanolis, metoksimetanas', 'ethanol, methoxymethane')],
          [t('tautomerai', 'tautomers'), t('protono vieta, pusiausvyra', 'proton position, equilibrium'), t('ketonas ⇌ enolis', 'ketone ⇌ enol')],
          [t('enantiomerai', 'enantiomers'), t('veidrodiniai atspindžiai; vienodos savybės, priešingas sukimas', 'mirror images; same properties, opposite rotation'), t('(R)- ir (S)-bromchlorfluormetanas', '(R)- and (S)-bromochlorofluoromethane')],
          [t('σ-diastereomerai', 'σ-diastereomers'), t('dalies centrų konfigūracija', 'configuration of some centres'), t('vyno ir mezovyno rūgštis', 'tartaric and meso-tartaric acid')],
          [t('π-diastereomerai', 'π-diastereomers'), t('dvigubojo ryšio geometrija', 'geometry of the double bond'), t('$Z$ / $E$, cis / trans', '$Z$ / $E$ (cis / trans)')],
          [t('konformeriai', 'conformers'), t('sukimasis apie $σ$ ryšį', 'rotation about a $σ$ bond'), t('anti, goš, užstotoji', 'anti, gauche, eclipsed')]
        ]
      },
      src: 'L5 p2'
    },
    {
      list: [
        t('Chiralinis centras: atomas su keturiais skirtingais pakaitais. $n$ centrų – daugiausia $2^n^$ stereoizomerų; mezoforma (simetrijos plokštuma) sumažina skaičių.', 'Chiral centre: an atom with four different substituents. $n$ centres give at most $2^n^$ stereoisomers; a meso form (plane of symmetry) lowers the number.'),
        t('$R,S$: pakaitų vyresniškumas pagal atominį skaičių; jauniausias nuo stebėtojo; pagal laikrodžio rodyklę – $R$. Fišerio projekcijoje horizontalus jauniausias pakaitas apverčia matomą kryptį.', '$R,S$: priority by atomic number; lowest away from the viewer; clockwise is $R$. In a Fischer projection a horizontal lowest-priority group reverses the direction you see.'),
        t('Fišerio projekcija: nelyginis sukeitimų skaičius ar pasukimas 90° keičia prasmę (enantiomeras), lyginis ar 180° – ne. $D$: funkcinė grupė dešinėje.', 'Fischer projection: an odd number of swaps or a 90° turn changes the meaning (enantiomer), an even number or 180° does not. $D$: functional group on the right.'),
        t('$Z$: vyresnieji pakaitai toje pačioje pusėje; $E$: priešingose.', '$Z$: senior substituents on the same side; $E$: on opposite sides.'),
        t('Etano sukimosi barjeras 12 kJ/mol. Butanas: anti (0) < goš (≈ 4) < užstotoji su $H$ (≈ 16) < užstotoji $CH3$/$CH3$ (≈ 19 kJ/mol).', 'Ethane rotational barrier 12 kJ/mol. Butane: anti (0) < gauche (≈ 4) < eclipsed with $H$ (≈ 16) < eclipsed $CH3$/$CH3$ (≈ 19 kJ/mol).'),
        t('Cikloheksano kėdė: nėra įtempties; ciklo inversija sukeičia a ir e. Pakaitas stabilesnis ekvatorinėje padėtyje; 1,2 ir 1,4 trans bei 1,3 cis – (e,e).', 'Cyclohexane chair: no strain; ring inversion swaps a and e. A substituent is more stable equatorial; 1,2- and 1,4-trans and 1,3-cis can be (e,e).')
      ],
      src: 'L5 p2–63'
    }
  ];

  /* ================================================================ exercise types ================================================================ */

  // class names for the filters of ORG.stereo.isomers: [genitive plural LT, plural EN, nominative plural LT]
  const GROUPS = {
    alcohol: ['alkoholių', 'alcohols', 'alkoholiai'], ether: ['eterių', 'ethers', 'eteriai'], aldehyde: ['aldehidų', 'aldehydes', 'aldehidai'],
    ketone: ['ketonų', 'ketones', 'ketonai'], ester: ['esterių', 'esters', 'esteriai'], acid: ['karboksirūgščių', 'carboxylic acids', 'karboksirūgštys'],
    amine1: ['pirminių aminų', 'primary amines', 'pirminiai aminai'], amine2: ['antrinių aminų', 'secondary amines', 'antriniai aminai'],
    amine3: ['tretinių aminų', 'tertiary amines', 'tretiniai aminai'], nitrile: ['nitrilų', 'nitriles', 'nitrilai']
  };
  // [formula, filter, other classes of the same formula]; filter null = every constitutional isomer of the formula,
  // the third item is then a list of formulas of near neighbours whose structures serve as wrong options
  const ISO = [
    ['C3H8O', 'alcohol', ['ether']], ['C4H10O', 'alcohol', ['ether']], ['C4H10O', 'ether', ['alcohol']], ['C5H12O', 'alcohol', ['ether']],
    ['C5H12O', 'ether', ['alcohol']], ['C4H8O', 'aldehyde', ['ketone']], ['C5H10O', 'aldehyde', ['ketone']], ['C5H10O', 'ketone', ['aldehyde']],
    ['C3H6O2', 'ester', ['acid']], ['C4H8O2', 'ester', ['acid']], ['C4H8O2', 'acid', ['ester']], ['C5H10O2', 'acid', ['ester']],
    ['C3H9N', 'amine1', ['amine2', 'amine3']], ['C4H11N', 'amine1', ['amine2', 'amine3']], ['C4H11N', 'amine2', ['amine1', 'amine3']],
    ['C4H7N', 'nitrile', null],
    ['C5H12', null, ['C5H10']], ['C4H9Cl', null, ['C4H9Br', 'C4H8']], ['C2H7N', null, ['C2H5N']], ['C2H6O', null, ['C2H4O', 'C2H5Cl']]
  ];
  // wrong options for nitriles: same formula, other functional groups
  const NITRILE_WRONG = ['C=CCN=C', 'CC#CCN', 'C=CCC=N', 'CC=CC=N', 'CC(C#C)N'];

  let CHIRAL_SPLIT = null;

  const TYPES = [
    /* ---------------------------------------------------------------- constitutional isomers ---- */
    {
      id: 'u05.constit',
      title: t('Sandaros izomerai pagal formulę', 'Constitutional isomers of a formula'),
      mirrors: ['S3.1', 'S3.2'],
      gen(rng, ctx) {
        const { stereo } = ctx;
        const [formula, filt, others] = ctx.pick(ISO);
        const right = filt ? stereo.isomers(formula, { filter: filt }) : stereo.isomers(formula);
        const wrongPool = [];
        if (!filt) others.forEach(f => stereo.isomers(f).forEach(s => wrongPool.push(s)));
        else if (others) others.forEach(o => stereo.isomers(formula, { filter: o }).forEach(s => wrongPool.push(s)));
        else NITRILE_WRONG.forEach(s => wrongPool.push(s));
        if (right.length < 2 || wrongPool.length < 1) throw new Error('u05.constit: ' + formula + ' ' + filt);
        const g = filt ? GROUPS[filt] : null;
        const nr = ctx.int(wrongPool.length < 2 ? 2 : 1, Math.min(right.length, 3));
        const picked = ctx.shuffle(right).slice(0, nr);
        const wrong = ctx.shuffle(wrongPool).slice(0, Math.min(wrongPool.length, Math.max(2, 4 - nr)));
        const options = picked.concat(wrong).map(s => ({ mol: { smi: s } }));
        const shown = ctx.shuffle(right.slice()).slice(0, 8);
        const steps = [
          {
            prompt: filt ? t('Kiek yra ' + g[0] + ', kurių molekulinė formulė $' + formula + '$?', 'How many ' + g[1] + ' have the molecular formula $' + formula + '$?')
              : t('Kiek sandaros izomerų turi formulė $' + formula + '$?', 'How many constitutional isomers does the formula $' + formula + '$ have?'),
            kind: 'number', answer: { value: right.length, tol: 0 },
            hint: t('Pirmiausia pasirinkite ilgiausią anglies grandinę, po to ją trumpinkite ir stumdykite funkcinę grupę. Nesuskaičiuokite to paties junginio du kartus.',
              'Start with the longest carbon chain, then shorten it and move the functional group. Do not count the same compound twice.'),
            solution: [
              { p: t('Visi ' + right.length + ' izomerai:', 'All ' + right.length + ' isomers:') },
              { mol: right.map(s => ({ smi: s })) }
            ]
          },
          {
            prompt: filt ? t('Pažymėkite visas struktūras, kurios yra ' + g[2] + ' ($' + formula + '$).', 'Pick every structure that is one of the ' + g[1] + ' of $' + formula + '$.')
              : t('Pažymėkite visas struktūras, kurių molekulinė formulė $' + formula + '$.', 'Pick every structure whose molecular formula is $' + formula + '$.'),
            kind: 'multi', options, answer: picked.map((_, i) => i),
            hint: filt ? t('Visų variantų formulė ta pati, todėl žiūrėkite tik į funkcinę grupę.', 'All options have the same formula, so look only at the functional group.')
              : t('Suskaičiuokite kiekvienos struktūros $C$, $H$ ir kitų atomų skaičių.', 'Count the $C$, $H$ and other atoms of each structure.'),
            solution: filt ? t('Teisingos struktūros priklauso klasei ' + g[0] + '; kiti variantai turi tą pačią formulę, bet kitą funkcinę grupę (funkciniai izomerai).',
              'The right structures belong to the class of ' + g[1] + '; the others have the same formula but another functional group (functional isomers).')
              : t('Teisingos struktūros turi formulę $' + formula + '$; kitų struktūrų atomų skaičius kitoks, todėl jos nėra šios formulės izomerai.',
                'The right structures have the formula $' + formula + '$; the others have a different number of atoms, so they are not isomers of this formula.')
          }
        ];
        return {
          q: [{ p: t('Sandaros izomerai: tos pačios molekulinės formulės, skirtinga atomų jungimosi tvarka.', 'Constitutional isomers: the same molecular formula, a different order of connecting the atoms.') }],
          steps,
          why: t('Sandaros izomerus randame sistemingai: pasirenkame grandinės skeletą (grandininiai izomerai), po to keičiame funkcinės grupės ar dvigubojo ryšio vietą (padėties izomerai). Tos pačios formulės junginiai su kita funkcine grupe yra funkciniai izomerai.',
            'Constitutional isomers are found systematically: choose the carbon skeleton (chain isomers), then move the functional group or double bond (position isomers). Compounds of the same formula with another functional group are functional isomers.'),
          src: 'L5 p3',
          claims: [{ isomers: filt ? [formula, right.length, filt] : [formula, right.length] }]
        };
      }
    },

    /* ---------------------------------------------------------------- chiral centres and number of stereoisomers ---- */
    {
      id: 'u05.centres',
      title: t('Chiraliniai centrai ir stereoizomerų skaičius', 'Chiral centres and the number of stereoisomers'),
      mirrors: ['S3.3', 'S3.4', 'S3.10', 'S3.11', 'S3.12'],
      gen(rng, ctx) {
        const { stereo, chem, name } = ctx;
        // [smiles, may be named]; all have at least one chiral centre
        const POOL = [
          ['CCC(C)CCC', 1], ['ClCC(C)CC', 1], ['CC(N)C(=O)O', 1], ['OCC(O)C=O', 1], ['CC(Cl)CCCl', 1], ['CC(Br)CBr', 1], ['CCC(C)Br', 1],
          ['CC(O)CC', 1], ['CC(O)C(=O)O', 1], ['CCC(C)C(=O)O', 1], ['CC(Cl)C(C)Cl', 1], ['CC(O)C(O)C', 1], ['OC(=O)C(O)C(O)C(=O)O', 1],
          ['CC(O)C(Cl)C', 1], ['CC(O)C(N)C(=O)O', 0], ['CC(C)C(N)C(=O)O', 0], ['CC(CC)C(N)C(=O)O', 0], ['CNC(C)C(O)c1ccccc1', 0],
          ['OCC(NC(=O)C(Cl)Cl)C(O)c1ccc(cc1)[N+](=O)[O-]', 0], ['CC1=CCC(CC1)C(C)=C', 0], ['CC1=CCC(CC1=O)C(C)=C', 0], ['CC(C)C1CCC(C)CC1O', 0],
          ['O=C1C=C2CCC(C(C)=C)CC2(C)C(C)C1', 0], ['OCC(O)C1OC(=O)C(O)=C1O', 0], ['CCC(=O)OC(Cc1ccccc1)(c1ccccc1)C(C)CN(C)C', 0],
          ['CCC(C)C(C)CC', 0], ['ClC(=C)C(CBr)(Cl)CCCC(C)(C)Cl', 0], ['CC(O)C=C', 0], ['CC(Br)CC(Cl)C', 0], ['CC(N)c1ccccc1', 0], ['OCC(Cl)C=C', 0]
        ];
        const [smi, named] = ctx.pick(POOL);
        const mol = chem.parse(smi);
        const cs = stereo.stereocentres(mol);
        if (!cs.length) throw new Error('u05.centres: no centre in ' + smi);
        const total = stereo.stereoisomers(smi).length;
        const full = Math.pow(2, cs.length);
        const steps = [
          {
            prompt: t('Bakstelėkite visus chiralinius centrus.', 'Tap every chiral centre.'),
            kind: 'atoms', mol: { smi }, from: 'stereocentres',
            hint: t('Chiralinis centras yra sp³ anglis, prie kurios prijungti keturi skirtingi pakaitai. Lyginkite visas grupes, ne tik pirmuosius atomus.',
              'A chiral centre is an sp³ carbon with four different substituents. Compare whole groups, not just the first atoms.'),
            solution: t('Chiralinių centrų: ' + cs.length + '. Prie kiekvieno jų prijungti keturi skirtingi pakaitai (viena iš grupių gali būti vandenilis).',
              'Chiral centres: ' + cs.length + '. Each carries four different substituents (one of the groups may be hydrogen).')
          },
          {
            prompt: t('Kiek stereoizomerų (kartu su enantiomerais) gali turėti šis junginys?', 'How many stereoisomers (enantiomers included) can this compound have?'),
            kind: 'number', answer: { value: total, tol: 0 },
            hint: t('Molekulė su $n$ chiraliniais centrais turi ne daugiau kaip $2^n^$ stereoizomerų. Pagalvokite, ar molekulės pusės vienodos.',
              'A molecule with $n$ chiral centres has at most $2^n^$ stereoisomers. Think about whether the two halves are the same.'),
            solution: total === full
              ? t('Centrų yra ' + cs.length + ', todėl stereoizomerų $2^n^$ = ' + full + '.', 'There are ' + cs.length + ' centres, so the number of stereoisomers is $2^n^$ = ' + full + '.')
              : t('Centrų yra ' + cs.length + ', pagal $2^n^$ būtų ' + full + ', bet molekulė simetriška: yra mezoforma, todėl iš tikrųjų ' + total + '.',
                'There are ' + cs.length + ' centres, which would give ' + full + ' by $2^n^$, but the molecule is symmetrical: a meso form exists, so the real number is ' + total + '.')
          }
        ];
        const nm = named && !smi.includes('1') ? [name.name(smi, { lang: 'lt' }), name.name(smi, { lang: 'en' })] : null;
        if (nm && nm[0] && nm[1]) {
          steps.push({
            prompt: t('Pavadinkite junginį pagal IUPAC taisykles.', 'Give the IUPAC name of the compound.'),
            kind: 'name', mol: { smi }, answer: { smi },
            hint: t('Raskite pagrindinę grandinę (su pagrindine grupe) ir sunumeruokite ją taip, kad pagrindinė grupė, po to pakaitai gautų mažiausius numerius.',
              'Find the main chain (carrying the principal group) and number it so that the principal group, then the substituents, get the lowest numbers.'),
            solution: t(nm[0].name, nm[1].name)
          });
        }
        return {
          q: [{ p: t('Raskite chiralinius centrus šiame junginyje.', 'Find the chiral centres in this compound.') }, { mol: { smi } }],
          steps,
          why: t('Chiralinis centras yra atomas su keturiais skirtingais pakaitais. Jei yra $n$ tokių centrų, galimi $2^n^$ stereoizomerų; kai molekulė turi simetrijos plokštumą (mezoforma), jų būna mažiau.',
            'A chiral centre is an atom with four different substituents. With $n$ such centres up to $2^n^$ stereoisomers are possible; when the molecule has a plane of symmetry (a meso form), there are fewer.'),
          src: 'L5 p15',
          claims: [{ centres: [smi, cs] }, { stereoisomers: [smi, total] }]
        };
      }
    },

    /* ---------------------------------------------------------------- chiral or achiral ---- */
    {
      id: 'u05.chiral',
      title: t('Chiralinė ar achiralinė molekulė?', 'Chiral or achiral molecule?'),
      mirrors: ['S3.10', 'S3.16'],
      gen(rng, ctx) {
        const { stereo } = ctx;
        const CH = ['C[C@H](N)C(=O)O', 'CC[C@@H](C)O', 'C[C@H](O)C(=O)O', 'C[C@H]1CCCC[C@@H]1C', 'C[C@@H]1CCC[C@@H](C)C1', 'C[C@H](Br)[C@H](C)Br',
          'OC(=O)[C@H](O)[C@@H](O)C(=O)O', 'C[C@H](Cl)CCCl', 'C[C@H](Br)CBr', 'CC[C@H](C)CCC', 'ClC[C@H](C)CC', 'C[C@@H](O)c1ccccc1', 'C[C@H](O)[C@H](O)C',
          'O[C@H]1CCCC[C@@H]1O', 'C[C@H]1CCC[C@@H]1C'];
        const AC = ['OC(=O)[C@H](O)[C@H](O)C(=O)O', 'C[C@H](Br)[C@@H](C)Br', 'C[C@H]1CCCC[C@H]1C', 'C[C@@H]1CCC[C@H](C)C1', 'C[C@H]1CC[C@H](C)CC1',
          'C[C@H]1CC[C@@H](C)CC1', 'CCC(CC)CC', 'ClCCCCCCl', 'CC(C)O', 'CCC(C)(C)Br', 'CCC1(c2ccccc2)C(=O)NC(=O)NC1=O', 'C[C@H](O)[C@@H](O)C', 'O[C@H]1CCCC[C@H]1O',
          'C[C@H]1CCC[C@H]1C', 'CC(C)C(C)C', 'ClCC(Cl)CCl', 'CC(Cl)Cl'];
        if (!CHIRAL_SPLIT) { const all = CH.concat(AC); CHIRAL_SPLIT = { ch: all.filter(s => stereo.isChiral(s)), ac: all.filter(s => !stereo.isChiral(s)) }; }
        const nr = ctx.pick([1, 2, 2, 3]);
        const items = ctx.shuffle(CHIRAL_SPLIT.ch.slice()).slice(0, nr).concat(ctx.shuffle(CHIRAL_SPLIT.ac.slice()).slice(0, 4 - nr));
        const opts = ctx.shuffle(items);
        const chiral = opts.map(s => stereo.isChiral(s));
        const answer = chiral.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
        const first = opts[answer[0]];
        const cs = stereo.stereocentres(first);
        const mesoIn = opts.filter(s => !stereo.isChiral(s) && stereo.stereocentres(s).length >= 2);
        return {
          q: [{ p: t('Struktūrose pavaizduotos tikslios erdvinės konfigūracijos (pleištai, brūkšniai, ryšių kryptys).', 'The structures show exact spatial configurations (wedges, dashes, bond directions).') }],
          steps: [
            {
              prompt: t('Pažymėkite visas chiralines molekules.', 'Pick every chiral molecule.'),
              kind: 'multi', options: opts.map(s => ({ mol: { smi: s } })), answer,
              hint: t('Chiralinė molekulė nesutampa su veidrodiniu atspindžiu. Ieškokite simetrijos plokštumos arba centro; chiralinis centras dar nereiškia, kad molekulė chiralinė.',
                'A chiral molecule is not superimposable on its mirror image. Look for a plane or centre of symmetry; a chiral centre does not yet mean the molecule is chiral.'),
              solution: mesoIn.length
                ? t('Chiralios yra tik molekulės be simetrijos plokštumos. Mezoformos turi chiralinių centrų, bet turi simetrijos plokštumą, todėl yra achiralinės; molekulės be chiralinių centrų taip pat achiralinės.',
                  'Only molecules without a plane of symmetry are chiral. Meso forms have chiral centres but also a plane of symmetry, so they are achiral; molecules without chiral centres are achiral too.')
                : t('Chiralios yra molekulės be simetrijos plokštumos ir be simetrijos centro. Molekulės be chiralinių centrų ir molekulės su simetrijos plokštuma yra achiralinės.',
                  'Chiral molecules have neither a plane nor a centre of symmetry. Molecules without chiral centres, or with a plane of symmetry, are achiral.')
            },
            {
              prompt: t('Pirmojoje sąraše (skaitant iš kairės į dešinę) chiralinėje molekulėje bakstelėkite chiralinius centrus.', 'In the first chiral molecule in the list (reading left to right), tap the chiral centres.'),
              kind: 'atoms', mol: { smi: first }, answer: cs,
              hint: t('Kuriuose anglies atomuose yra keturios skirtingos grupės?', 'Which carbons carry four different groups?'),
              solution: t('Chiralinių centrų: ' + cs.length + '. Tai sp³ anglys su keturiais skirtingais pakaitais.', 'Chiral centres: ' + cs.length + '. They are sp³ carbons with four different substituents.')
            }
          ],
          why: t('Molekulės chirališkumą lemia simetrija, ne vien chiralinių centrų skaičius. Jei molekulė turi simetrijos plokštumą (mezoforma, cis-1,2-dipakeistas cikloalkanas) arba visai neturi chiralinių centrų, ji achiralinė.',
            'The chirality of a molecule is decided by symmetry, not just by the number of chiral centres. A molecule with a plane of symmetry (a meso form, a cis-1,2-disubstituted cycloalkane) or without any chiral centre is achiral.'),
          src: 'L5 p12'
        };
      }
    },

    /* ---------------------------------------------------------------- R/S from a wedge drawing ---- */
    {
      id: 'u05.rs',
      title: t('R,S konfigūracija iš pleištinės formulės', 'R,S configuration from a wedge drawing'),
      mirrors: ['S3.5', 'S3.13', 'S3.14', 'S3.15'],
      gen(rng, ctx) {
        const { stereo, chem } = ctx;
        const KEYS = Object.keys(LIG).filter(k => k !== 'H');
        for (let tries = 0; tries < 80; tries++) {
          const withH = rng() < 0.8;
          const pool = ctx.shuffle(KEYS.slice());
          const heavy = pool.slice(0, withH ? 3 : 4);
          const ranks = heavy.map(k => LIG[k].rk);
          if (new Set(ranks).size !== heavy.length) continue;
          const tag = rng() < 0.5 ? '@' : '@@';
          const cs = centreSmi(ctx, withH ? ['H'].concat(heavy) : heavy, tag);
          const mol = chem.parse(cs.smi);
          if (stereo.stereocentres(mol).join() !== '0') continue;
          const engine = stereo.cip(mol, 0);
          const mine = rsFromTag(tag, cs.order.map(k => LIG[k].rk));
          if (engine !== mine) continue;
          const sorted = byRank(withH ? heavy.concat(['H']) : heavy);
          const ot = orderText(sorted);
          return {
            q: [{ p: t('Kokia pavaizduoto stereocentro $R,S$ konfigūracija?', 'Determine the configuration of the stereocentre in the $R,S$ system.') }, { mol: { smi: cs.smi } }],
            steps: [
              {
                prompt: t('Išdėstykite pakaitus nuo vyriausio iki jauniausio (CIP vyresniškumas).', 'Put the substituents in order from the highest to the lowest CIP priority.'),
                kind: 'order', options: sorted.map(lopt),
                hint: t('Lyginkite atomus, tiesiogiai prijungtus prie stereocentro: didesnis atominis skaičius reiškia vyresnį pakaitą. Jei jie vienodi, žiūrėkite, prie jų prijungtus atomus.',
                  'Compare the atoms bonded directly to the stereocentre: a higher atomic number means a higher priority. If they tie, look at the atoms attached to them.'),
                solution: t(ot.lt, ot.en)
              },
              {
                prompt: t('Kokia stereocentro konfigūracija?', 'What is the configuration of the stereocentre?'),
                kind: 'choice', options: [{ text: f('$R$') }, { text: f('$S$') }], answer: engine === 'R' ? 0 : 1,
                hint: t('Pasukite molekulę taip, kad jauniausias pakaitas būtų nuo jūsų, ir sekite kryptį 1 → 2 → 3.', 'Orient the molecule so that the lowest-priority group points away from you, and follow 1 → 2 → 3.'),
                solution: t('Žiūrint taip, kad jauniausias pakaitas būtų nuo stebėtojo, eiga 1 → 2 → 3 ' + (engine === 'R' ? 'sukasi pagal laikrodžio rodyklę, tai $R$.' : 'sukasi prieš laikrodžio rodyklę, tai $S$.'),
                  'Viewed with the lowest-priority group pointing away, the sequence 1 → 2 → 3 runs ' + (engine === 'R' ? 'clockwise, so the configuration is $R$.' : 'anticlockwise, so the configuration is $S$.'))
              }
            ],
            why: t('$R,S$ konfigūraciją nusako pakaitų vyresniškumas pagal atominį skaičių (kai pirmieji atomai vienodi, lyginami toliau prijungti atomai) ir eigos kryptis, žiūrint nuo jauniausio pakaito: pagal laikrodžio rodyklę $R$, prieš – $S$.',
              'The $R,S$ configuration follows from the priorities by atomic number (ties are broken by the atoms further out) and the direction of travel, viewed with the lowest-priority group away: clockwise is $R$, anticlockwise is $S$.'),
            src: 'L5 p24',
            claims: [{ cip: [cs.smi, 0, engine] }]
          };
        }
        throw new Error('u05.rs: no usable centre');
      }
    },

    /* ---------------------------------------------------------------- R/S from a Fischer projection ---- */
    {
      id: 'u05.fischer',
      title: t('R,S konfigūracija iš Fišerio projekcijos', 'R,S configuration from a Fischer projection'),
      mirrors: ['S3.5', 'S3.15'],
      gen(rng, ctx) {
        const { stereo, chem } = ctx;
        const KEYS = Object.keys(LIG).filter(k => k !== 'H');
        const KEYS_V = ['OH', 'NH2', 'Cl', 'Br', 'CH3', 'Et', 'COOH', 'CHO', 'CH2OH'];
        const vert = rng() < 0.4;                              // hydrogen on the vertical line (behind the plane), S3.15c
        for (let tries = 0; tries < 80; tries++) {
          const heavy = ctx.shuffle((vert ? KEYS_V : KEYS).slice()).slice(0, 3);
          if (new Set(heavy.map(k => LIG[k].rk)).size !== 3) continue;
          let cs = null, engine, spec;
          if (vert) {
            const hp = ctx.pick([0, 2]);
            const st = [null, null, null, null];
            st[hp] = 'H'; st[2 - hp] = heavy[0]; st[1] = heavy[1]; st[3] = heavy[2];
            engine = fischerRS(st);
            if (fischerSeen(st) !== (engine === 'R')) throw new Error('u05.fischer: seen direction disagrees');
            for (const tag of ['@', '@@']) {
              const c2 = centreSmi(ctx, ['H'].concat(heavy), tag);
              if (stereo.cip(chem.parse(c2.smi), 0) === engine) cs = c2;
            }
            if (!cs) continue;
            spec = fischerDraw(st);
          } else {
            const tag = rng() < 0.5 ? '@' : '@@';
            cs = centreSmi(ctx, ['H'].concat(heavy), tag);
            const mol = chem.parse(cs.smi);
            engine = stereo.cip(mol, 0);
            spec = { smi: cs.smi, top: cs.first[heavy[0]], bottom: cs.first[heavy[1]] };
            const read = ORG.views.readFischer(spec);
            if (read[0] !== engine || engine !== rsFromTag(tag, cs.order.map(k => LIG[k].rk))) continue;
          }
          const sorted = byRank(['H'].concat(heavy));
          const ot = orderText(sorted);
          const apparentClockwise = vert ? engine === 'R' : engine === 'S';   // H horizontal: the direction read on paper is reversed; H vertical: it is the true one
          return {
            q: [{ p: t('Nustatykite stereocentro konfigūraciją pagal Fišerio projekciją.', 'Determine the configuration of the stereocentre from the Fischer projection.') }, { fischer: spec }],
            steps: [
              {
                prompt: t('Išdėstykite pakaitus nuo vyriausio iki jauniausio.', 'Put the substituents in order from the highest to the lowest priority.'),
                kind: 'order', options: sorted.map(lopt),
                hint: t('Lyginkite atomus, tiesiogiai prijungtus prie stereocentro; vienodus atomus skirkite pagal prie jų prijungtus atomus.',
                  'Compare the atoms bonded directly to the stereocentre; break ties by the atoms attached to them.'),
                solution: t(ot.lt, ot.en)
              },
              {
                prompt: vert ? t('Vandenilis yra vertikalioje linijoje. Ar eiga 1 → 2 → 3, kurią matote ant popieriaus, sukasi pagal laikrodžio rodyklę?', 'The hydrogen is on a vertical line. Does the sequence 1 → 2 → 3 that you read on the paper run clockwise?')
                  : t('Vandenilis yra horizontalioje linijoje. Ar eiga 1 → 2 → 3, kurią matote ant popieriaus, sukasi pagal laikrodžio rodyklę?', 'The hydrogen is on a horizontal line. Does the sequence 1 → 2 → 3 that you read on the paper run clockwise?'),
                kind: 'choice',
                options: [{ text: t('Taip, pagal laikrodžio rodyklę', 'Yes, clockwise') }, { text: t('Ne, prieš laikrodžio rodyklę', 'No, anticlockwise') }],
                answer: apparentClockwise ? 0 : 1,
                hint: t('Sekite pirmąjį, antrąjį ir trečiąjį pakaitą ant brėžinio taip, tarsi vandenilio nebūtų.', 'Follow the first, second and third substituent on the drawing as if the hydrogen were not there.'),
                solution: t('Ant popieriaus eiga sukasi ' + (apparentClockwise ? 'pagal' : 'prieš') + ' laikrodžio rodyklę.', 'On the paper the sequence runs ' + (apparentClockwise ? 'clockwise.' : 'anticlockwise.'))
              },
              {
                prompt: t('Kokia stereocentro konfigūracija?', 'What is the configuration of the stereocentre?'),
                kind: 'choice', options: [{ text: f('$R$') }, { text: f('$S$') }], answer: engine === 'R' ? 0 : 1,
                hint: vert ? t('Vertikalios Fišerio linijos eina už plokštumos. Ką tai sako apie jauniausią pakaitą ir apie matomą kryptį?',
                  'The vertical lines of a Fischer projection go behind the plane. What does that say about the lowest-priority group and about the direction you see?')
                  : t('Horizontalios Fišerio linijos nukreiptos į stebėtoją, todėl jauniausias pakaitas yra ne už plokštumos. Ką tai daro su matoma kryptimi?',
                    'The horizontal lines of a Fischer projection point towards the viewer, so the lowest-priority group is not behind the plane. What does that do to the direction you see?'),
                solution: vert ? t('Jauniausias pakaitas (H) yra vertikalioje linijoje, t. y. už plokštumos, todėl matoma kryptis ir yra tikroji: ' + (engine === 'R' ? 'pagal laikrodžio rodyklę – $R$.' : 'prieš laikrodžio rodyklę – $S$.'),
                  'The lowest-priority group (H) is on a vertical line, i.e. behind the plane, so the direction you see is the true one: ' + (engine === 'R' ? 'clockwise, so $R$.' : 'anticlockwise, so $S$.'))
                  : t('Jauniausias pakaitas (H) nukreiptas į stebėtoją, todėl tikroji kryptis priešinga matomai: ' + (engine === 'R' ? 'ant popieriaus prieš laikrodžio rodyklę, iš tikrųjų pagal – $R$.' : 'ant popieriaus pagal laikrodžio rodyklę, iš tikrųjų prieš – $S$.'),
                    'The lowest-priority group (H) points towards the viewer, so the true direction is the opposite of the one you see: ' + (engine === 'R' ? 'anticlockwise on paper, really clockwise, so $R$.' : 'clockwise on paper, really anticlockwise, so $S$.'))
              }
            ],
            why: t('Fišerio projekcijoje horizontalios linijos nukreiptos į stebėtoją, vertikalios – nuo jo. Kai jauniausias pakaitas yra horizontalioje linijoje, matoma eigos kryptis būna priešinga tikrajai; kai vertikalioje – kryptis tokia pati.',
              'In a Fischer projection horizontal lines point towards the viewer and vertical lines away. When the lowest-priority group is on a horizontal line, the direction you see is the opposite of the true one; on a vertical line it is the same.'),
            src: 'L5 p25',
            claims: [{ cip: [cs.smi, 0, engine] }]
          };
        }
        throw new Error('u05.fischer: no usable centre');
      }
    },

    /* ---------------------------------------------------------------- moves of a Fischer projection ---- */
    {
      id: 'u05.fmoves',
      title: t('Fišerio projekcijos veiksmai', 'Operations on a Fischer projection'),
      mirrors: ['S3.5', 'S3.13'],
      gen(rng, ctx) {
        const rsOf = fischerRS, draw = fischerDraw;
        const VERT = ['COOH', 'CHO', 'CH2OH', 'CH3', 'Et'];
        const HOR = ['OH', 'NH2', 'Cl', 'Br', 'H', 'CH3'];
        const OPS = [
          { id: 'swap', lt: 'sukeitus vietomis du pakaitus', en: 'swapping two substituents', odd: true },
          { id: 'rot90', lt: 'pasukus brėžinį lapo plokštumoje ketvirtadaliu apskritimo (90°)', en: 'turning the formula by 90° in the plane of the paper', odd: true },
          { id: 'rot180', lt: 'apsukus brėžinį lapo plokštumoje (180°)', en: 'turning the formula by 180° in the plane of the paper', odd: false },
          { id: 'swap2', lt: 'du kartus sukeitus pakaitus vietomis (dvi poros)', en: 'swapping two pairs of substituents', odd: false },
          { id: 'cyc3', lt: 'trims pakaitams cikliškai pasikeitus vietomis (kiekvienas užima gretimo vietą)', en: 'three substituents cyclically exchanging places (each takes the place of the next)', odd: false }
        ];
        for (let tries = 0; tries < 60; tries++) {
          const v = ctx.shuffle(VERT.slice()).slice(0, 2);
          const h = ctx.shuffle(HOR.slice()).slice(0, 2);
          if (new Set(v.concat(h)).size !== 4) continue;
          const s1 = [v[0], h[0], v[1], h[1]];
          const op = ctx.pick(OPS);
          let s2;
          if (op.id === 'swap') { const i = ctx.int(0, 3); let j = ctx.int(0, 3); if (j === i) j = (i + 1) % 4; s2 = s1.slice(); s2[i] = s1[j]; s2[j] = s1[i]; }
          else if (op.id === 'rot90') s2 = [s1[3], s1[0], s1[1], s1[2]];
          else if (op.id === 'rot180') s2 = [s1[2], s1[3], s1[0], s1[1]];
          else if (op.id === 'swap2') { const k = ctx.pick([[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]]); s2 = s1.slice(); s2[k[0]] = s1[k[1]]; s2[k[1]] = s1[k[0]]; s2[k[2]] = s1[k[3]]; s2[k[3]] = s1[k[2]]; }
          else { const miss = ctx.int(0, 3); const idx = [0, 1, 2, 3].filter(i => i !== miss); s2 = s1.slice(); s2[idx[0]] = s1[idx[1]]; s2[idx[1]] = s1[idx[2]]; s2[idx[2]] = s1[idx[0]]; }
          const r1 = rsOf(s1), r2 = rsOf(s2);
          const enant = r1 !== r2;
          if (enant !== op.odd) continue;                                   // the rule and the geometry must agree
          return {
            q: [
              { p: t('Antroji formulė gauta iš pirmosios ' + op.lt + '.', 'The second formula comes from the first by ' + op.en + '.') },
              { fischer: draw(s1), caption: t('Pirmoji formulė', 'First formula') },
              { fischer: draw(s2), caption: t('Antroji formulė', 'Second formula') }
            ],
            steps: [
              {
                prompt: t('Ar tai tas pats junginys, ar enantiomerai?', 'Are the two formulas the same compound or enantiomers?'),
                kind: 'choice',
                options: [{ text: t('Tas pats junginys', 'The same compound') }, { text: t('Enantiomerai', 'Enantiomers') }, { text: t('Diastereomerai', 'Diastereomers') }],
                answer: enant ? 1 : 0,
                hint: t('Prisiminkite taisyklę: nelyginis sukeitimų skaičius arba pasukimas 90° keičia stereocheminę prasmę, lyginis ar 180° – ne.', 'Recall the rule: an odd number of swaps or a 90° turn changes the stereochemical meaning, an even number or a 180° turn does not.'),
                solution: t(enant ? 'Veiksmas keičia stereocheminę prasmę, todėl formulės vaizduoja enantiomerus.' : 'Veiksmas stereocheminės prasmės nekeičia, todėl abi formulės vaizduoja tą patį junginį.',
                  enant ? 'The operation changes the stereochemical meaning, so the formulas show enantiomers.' : 'The operation does not change the stereochemical meaning, so both formulas show the same compound.')
              },
              {
                prompt: t('Pirmoji formulė yra $' + r1 + '$ konfigūracijos. Kokia antrosios konfigūracija?', 'The first formula has the $' + r1 + '$ configuration. What is the configuration of the second?'),
                kind: 'choice', options: [{ text: f('$R$') }, { text: f('$S$') }], answer: r2 === 'R' ? 0 : 1,
                hint: t('Jei tai tas pats junginys, konfigūracija nepasikeitė; jei enantiomerai, ji priešinga.', 'If it is the same compound the configuration is unchanged; if they are enantiomers it is the opposite.'),
                solution: t(enant ? 'Enantiomerų konfigūracijos priešingos: $' + r2 + '$.' : 'Tas pats junginys turi tą pačią konfigūraciją: $' + r2 + '$.', enant ? 'Enantiomers have opposite configurations: $' + r2 + '$.' : 'The same compound has the same configuration: $' + r2 + '$.')
              }
            ],
            why: t('Fišerio projekcija remiasi susitarimu: vertikalios linijos eina už plokštumos, horizontalios – į stebėtoją. Todėl lyginis pakaitų sukeitimų skaičius ar pasukimas 180° nieko nekeičia, o nelyginis skaičius ar pasukimas 90° duoda enantiomerą.',
              'The Fischer projection rests on a convention: vertical lines go behind the plane, horizontal lines towards the viewer. An even number of swaps or a 180° turn changes nothing, whereas an odd number or a 90° turn gives the enantiomer.'),
            src: 'L5 p22'
          };
        }
        throw new Error('u05.fmoves: no usable case');
      }
    },

    /* ---------------------------------------------------------------- D and L ---- */
    {
      id: 'u05.dl',
      title: t('D,L ir R,S: aminorūgštys ir glicerolio aldehidas', 'D,L and R,S: amino acids and glyceraldehyde'),
      mirrors: ['S3.5', 'S3.13', 'S3.14'],
      gen(rng, ctx) {
        const { stereo, chem } = ctx;
        // [name LT (genitive), name EN, L-form SMILES, top atom, bottom atom, priority order of the groups]
        const DL = [
          ['glicerolio aldehido', 'glyceraldehyde', 'OC[C@H](O)C=O', 4, 1, '$OH$ > $CHO$ > $CH2OH$ > $H$'],
          ['alanino', 'alanine', 'C[C@H](N)C(=O)O', 3, 0, '$NH2$ > $COOH$ > $CH3$ > $H$'],
          ['serino', 'serine', 'OC[C@H](N)C(=O)O', 4, 1, '$NH2$ > $COOH$ > $CH2OH$ > $H$'],
          ['cisteino', 'cysteine', 'SC[C@H](N)C(=O)O', 4, 1, '$NH2$ > $CH2SH$ > $COOH$ > $H$'],
          ['fenilalanino', 'phenylalanine', 'c1ccccc1C[C@H](N)C(=O)O', 9, 6, '$NH2$ > $COOH$ > $CH2C6H5$ > $H$'],
          ['valino', 'valine', 'CC(C)[C@H](N)C(=O)O', 5, 1, '$NH2$ > $COOH$ > $CH(CH3)2$ > $H$'],
          ['leucino', 'leucine', 'CC(C)C[C@H](N)C(=O)O', 6, 3, '$NH2$ > $COOH$ > $CH2CH(CH3)2$ > $H$'],
          ['metionino', 'methionine', 'CSCC[C@H](N)C(=O)O', 6, 3, '$NH2$ > $COOH$ > $CH2CH2SCH3$ > $H$'],
          ['pieno rūgšties', 'lactic acid', 'C[C@H](O)C(=O)O', 3, 0, '$OH$ > $COOH$ > $CH3$ > $H$'],
          ['glicerino rūgšties', 'glyceric acid', 'OC[C@H](O)C(=O)O', 4, 1, '$OH$ > $COOH$ > $CH2OH$ > $H$'],
          ['asparto rūgšties', 'aspartic acid', 'OC(=O)C[C@H](N)C(=O)O', 6, 3, '$NH2$ > $COOH$ > $CH2COOH$ > $H$'],
          ['glutamo rūgšties', 'glutamic acid', 'OC(=O)CC[C@H](N)C(=O)O', 7, 4, '$NH2$ > $COOH$ > $CH2CH2COOH$ > $H$'],
          ['2-aminobutano rūgšties', '2-aminobutanoic acid', 'CC[C@H](N)C(=O)O', 4, 1, '$NH2$ > $COOH$ > $CH2CH3$ > $H$'],
          ['tirozino', 'tyrosine', 'Oc1ccc(cc1)C[C@H](N)C(=O)O', 10, 7, '$NH2$ > $COOH$ > $CH2C6H4OH$ > $H$']
        ];
        const [lt, en, lsmi, top, bot, pri] = ctx.pick(DL);
        const isD = rng() < 0.5;
        const smi = isD ? lsmi.replace('[C@H]', '[C@@H]') : lsmi;
        const mol = chem.parse(smi);
        const c = stereo.stereocentres(mol)[0];
        const rs = stereo.cip(mol, c);
        if (ORG.views.readFischer({ smi, top, bottom: bot })[c] !== rs) throw new Error('u05.dl: Fischer disagrees for ' + smi);
        const q3 = rng() < 0.5;
        const same = (isD && rs === 'R') || (!isD && rs === 'S');
        const steps = [
          {
            prompt: t('Ar tai D, ar L stereocheminės eilės junginys?', 'Is this a D or an L compound?'),
            kind: 'choice', options: [{ text: f('$D$') }, { text: f('$L$') }], answer: isD ? 0 : 1,
            hint: t('Žiūrėkite, kurioje vertikaliosios linijos pusėje yra funkcinė grupė ($OH$ arba $NH2$), kai oksiduočiausia grupė viršuje.', 'See on which side of the vertical line the functional group ($OH$ or $NH2$) stands, with the most oxidised group at the top.'),
            solution: t('Funkcinė grupė yra ' + (isD ? 'dešinėje' : 'kairėje') + ', todėl tai ' + (isD ? 'D' : 'L') + ' eilė (kaip D-glicerolio aldehide, kur $OH$ dešinėje).',
              'The functional group is on the ' + (isD ? 'right' : 'left') + ', so this is the ' + (isD ? 'D' : 'L') + ' series (as in D-glyceraldehyde, where $OH$ is on the right).')
          },
          {
            prompt: t('Kokia stereocentro konfigūracija $R,S$ sistemoje?', 'What is the configuration of the stereocentre in the $R,S$ system?'),
            kind: 'choice', options: [{ text: f('$R$') }, { text: f('$S$') }], answer: rs === 'R' ? 0 : 1,
            hint: t('Pirmiausia nustatykite pakaitų vyresniškumą, po to kryptį 1 → 2 → 3. Horizontalioje linijoje esantis pakaitas nukreiptas į jus.', 'First rank the substituents, then follow 1 → 2 → 3. A substituent on a horizontal line points towards you.'),
            solution: t('Vyresniškumas: ' + pri + '. Konfigūracija $' + rs + '$.', 'Priority: ' + pri + '. The configuration is $' + rs + '$.')
          },
          q3 ? {
            prompt: t('Ar iš raidės $D$, $L$, $R$ ar $S$ galima nuspėti, ar junginys suka poliarizuotą šviesą į dešinę (+)?', 'Can you tell from the letter $D$, $L$, $R$ or $S$ whether the compound rotates polarised light to the right (+)?'),
            kind: 'choice',
            options: [
              { text: t('Ne: sukimo ženklą nustato eksperimentas, jo nuspėti negalima.', 'No: the sign of rotation is found by experiment and cannot be predicted.') },
              { text: t('Taip: visi $D$ junginiai yra dešiniojo sukimo (+).', 'Yes: all $D$ compounds are dextrorotatory (+).') },
              { text: t('Taip: $R$ reiškia (+), $S$ reiškia (−).', 'Yes: $R$ means (+) and $S$ means (−).') },
              { text: t('Taip, bet tik aminorūgštims.', 'Yes, but only for amino acids.') }
            ],
            answer: 0,
            hint: t('Ar $D$, $L$, $R$, $S$ nusako atomų išdėstymą, ar išmatuojamą fizikinę savybę?', 'Do $D$, $L$, $R$, $S$ describe the arrangement of atoms or a measured physical property?'),
            solution: t('Raidės nusako erdvinį išdėstymą, o sukimo kryptis (+) ar (−) yra išmatuojama savybė. Pavyzdžiui, $D$-glicerolio aldehidas yra (+), o $L$-alaninas taip pat (+).', 'The letters describe the spatial arrangement, whereas the direction of rotation (+) or (−) is a measured property. For example $D$-glyceraldehyde is (+) and $L$-alanine is (+) as well.')
          } : {
            prompt: t('Ar visada $L$ reiškia $S$ konfigūraciją?', 'Does $L$ always mean the $S$ configuration?'),
            kind: 'choice',
            options: [
              { text: t('Ne: $D,L$ nusako santykinę konfigūraciją pagal glicerolio aldehidą, o $R,S$ priklauso nuo pakaitų vyresniškumo, todėl sutapimas nėra visuotinis.', 'No: $D,L$ describes the relative configuration against glyceraldehyde, while $R,S$ depends on substituent priorities, so the match is not universal.') },
              { text: t('Taip: $L$ visada yra $S$.', 'Yes: $L$ is always $S$.') },
              { text: t('Ne: $L$ visada yra $R$.', 'No: $L$ is always $R$.') },
              { text: t('Taip, nes abu žymi tą patį kairiojo sukimo požymį.', 'Yes, because both stand for the same levorotatory property.') }
            ],
            answer: 0,
            hint: t('Pagalvokite apie $L$-cisteiną, kurio konfigūracija yra priešinga $L$-serino.', 'Think about $L$-cysteine, whose configuration is opposite to that of $L$-serine.'),
            solution: t('Daugumos $L$-aminorūgščių konfigūracija $S$, bet $L$-cisteino – $R$, nes $CH2SH$ yra vyresnė už $COOH$ (S vyresnė už O). ' + (same ? 'Šiame junginyje raidės sutampa, bet taip būna ne visada.' : 'Šiame junginyje raidės nesutampa.'),
              'Most $L$-amino acids are $S$, but $L$-cysteine is $R$, because $CH2SH$ ranks above $COOH$ (S outranks O). ' + (same ? 'In this compound the letters happen to agree, but that is not always so.' : 'In this compound the letters do not agree.'))
          }
        ];
        return {
          q: [{ p: t('Fišerio projekcija pavaizduotas ' + lt + ' stereoizomeras.', 'A stereoisomer of ' + en + ' is drawn as a Fischer projection.') }, { fischer: { smi, top, bottom: bot } }],
          steps,
          why: t('$D,L$ sistema lygina su glicerolio aldehidu: kai oksiduočiausia grupė viršuje, funkcinė grupė dešinėje reiškia $D$, kairėje – $L$. $R,S$ sistema remiasi pakaitų vyresniškumu, todėl raidės nebūtinai sutampa, o sukimo ženklo nenusako nė viena.',
            'The $D,L$ system compares with glyceraldehyde: with the most oxidised group at the top, a functional group on the right means $D$, on the left $L$. The $R,S$ system is based on substituent priorities, so the letters do not necessarily agree, and neither predicts the sign of rotation.'),
          src: 'L5 p23',
          claims: [{ cip: [smi, c, rs] }]
        };
      }
    },

    /* ---------------------------------------------------------------- meso compounds and counting ---- */
    {
      id: 'u05.meso',
      title: t('Mezojunginiai ir stereoizomerų skaičius', 'Meso compounds and counting stereoisomers'),
      mirrors: ['S3.4', 'S3.6', 'S3.16'],
      gen(rng, ctx) {
        const { stereo, chem } = ctx;
        const CHAIN = ['C[C{a}H](X)[C{b}H](X)C', 'CC[C{a}H](X)[C{b}H](X)CC', 'C[C{a}H](X)C[C{b}H](X)C', 'C[C{a}H](X)CC[C{b}H](X)C',
          'OC(=O)[C{a}H](X)[C{b}H](X)C(=O)O', 'CC[C{a}H](X)C[C{b}H](X)CC', 'OC[C{a}H](X)[C{b}H](X)CO'];
        const RING = ['X[C{a}H]1CCCC[C{b}H]1X', 'X[C{a}H]1CCC[C{b}H]1X', 'X[C{a}H]1CCC[C{b}H](X)C1', 'C[C{a}H]1CCCC[C{b}H]1C', 'C[C{a}H]1CCC[C{b}H](C)C1'];
        const XS = ['Br', 'Cl', 'O', 'N'];
        const ring = rng() < 0.4;
        const tpl = ring ? ctx.pick(RING) : ctx.pick(CHAIN);
        const X = ctx.pick(XS);
        const fill = (a, b) => tpl.replace(/X/g, X).replace('{a}', a).replace('{b}', b);
        // the template without stereo marks, for counting
        const flat = tpl.replace(/X/g, X).replace('{a}', '').replace('{b}', '');
        const cs = stereo.stereocentres(chem.parse(flat));
        if (cs.length !== 2) throw new Error('u05.meso: ' + flat + ' has ' + cs.length + ' centres');
        const total = stereo.stereoisomers(flat).length;
        if (total !== 3) throw new Error('u05.meso: ' + flat + ' gives ' + total);
        const combos = [['@', '@'], ['@@', '@@'], ['@', '@@'], ['@@', '@']].map(([a, b]) => fill(a, b));
        const seen = new Set();
        const reps = [];
        combos.forEach(s => { const k = canon(ctx, s); if (!seen.has(k)) { seen.add(k); reps.push(s); } });
        if (reps.length !== 3) throw new Error('u05.meso: ' + flat + ' has ' + reps.length + ' distinct forms');
        const chiral = reps.map(s => stereo.isChiral(s));
        if (chiral.filter(c => !c).length !== 1) throw new Error('u05.meso: ' + flat + ' needs one meso form');
        const opts = ctx.shuffle(reps.slice());
        const mesoIdx = opts.findIndex(s => !stereo.isChiral(s));
        return {
          q: [{ p: t('Junginyje yra du vienodai pakeisti chiraliniai centrai.', 'The compound contains two chiral centres carrying the same substituents.') }, { mol: { smi: flat } }],
          steps: [
            {
              prompt: t('Bakstelėkite chiralinius centrus.', 'Tap the chiral centres.'),
              kind: 'atoms', mol: { smi: flat }, from: 'stereocentres',
              hint: t('Kurie anglies atomai turi keturis skirtingus pakaitus?', 'Which carbons carry four different substituents?'),
              solution: t('Yra du chiraliniai centrai.', 'There are two chiral centres.')
            },
            {
              prompt: t('Kiek stereoizomerų turi šis junginys?', 'How many stereoisomers does this compound have?'),
              kind: 'number', answer: { value: 3, tol: 0 },
              hint: t('Pagal formulę $2^n^$ būtų keturi. Ar visos keturios formos skirtingos, kai abu centrai vienodi?', 'The $2^n^$ rule would give four. Are all four forms different when the two centres are alike?'),
              solution: t('Pagal $2^n^$ būtų 4, bet $(R,S)$ ir $(S,R)$ yra ta pati mezoforma, todėl iš tikrųjų 3: pora enantiomerų ir mezoforma.', 'The $2^n^$ rule would give 4, but $(R,S)$ and $(S,R)$ are the same meso form, so there are really 3: a pair of enantiomers and the meso form.')
            },
            {
              prompt: t('Kuris stereoizomeras yra optiškai neaktyvus mezojunginys?', 'Which stereoisomer is the optically inactive meso compound?'),
              kind: 'choice', options: opts.map(s => ({ mol: { smi: s } })), answer: mesoIdx,
              hint: t('Ieškokite formos, kuri sutampa su savo veidrodiniu atspindžiu: pusės viena kitos atvaizdas veidrodyje.', 'Look for the form that coincides with its mirror image: its two halves are mirror images of each other.'),
              solution: t('Mezoforma turi simetrijos plokštumą, nes vienas centras yra $R$, kitas – $S$ ir jie vienodai pakeisti. Likusios dvi formos sudaro veidrodinę porą (enantiomerai).', 'The meso form has a plane of symmetry because one centre is $R$ and the other $S$ and they carry the same groups. The other two forms are mirror images of each other (enantiomers).')
            }
          ],
          why: t('Kai du chiraliniai centrai pakeisti vienodai, molekulė turi simetrijos plokštumą, kai jų konfigūracijos priešingos. Ši forma sutampa su veidrodiniu atspindžiu (mezoforma) ir optiškai neaktyvi, todėl stereoizomerų yra 3, ne 4.',
            'When two chiral centres carry the same groups, a molecule whose centres have opposite configurations has a plane of symmetry. It coincides with its mirror image (a meso form) and is optically inactive, so there are 3 stereoisomers, not 4.'),
          src: 'L5 p34',
          claims: [{ centres: [flat, cs] }, { stereoisomers: [flat, 3] }]
        };
      }
    },

    /* ---------------------------------------------------------------- relationship of two stereoisomers ---- */
    {
      id: 'u05.pairs',
      title: t('Enantiomerai, diastereomerai ar tas pats junginys?', 'Enantiomers, diastereomers or the same compound?'),
      mirrors: ['S3.6'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const TPL = ['C[C{a}H](Br)[C{b}H](C)Br', 'C[C{a}H](O)[C{b}H](O)C', 'C[C{a}H](Cl)[C{b}H](Br)C', 'C[C{a}H](O)[C{b}H](N)C(=O)O',
          'OC(=O)[C{a}H](O)[C{b}H](O)C(=O)O', 'C[C{a}H](O)[C{b}H](O)c1ccccc1', 'CN[C{a}H](C)[C{b}H](O)c1ccccc1', 'O[C{a}H]1CCCC[C{b}H]1O',
          'C[C{a}H]1CCCC[C{b}H]1C', 'C[C{a}H]1CCC[C{b}H](C)C1', 'O=C[C{a}H](O)[C{b}H](O)[C{c}H](O)CO',
          'OC(=O)[C{a}H](N)[C{b}H](O)C'];
        const tpl = ctx.pick(TPL);
        const kind = ctx.pick(['same', 'enant', 'diast']);
        const tagsOf = (n) => { const o = []; for (let i = 0; i < n; i++) o.push(rng() < 0.5 ? '@' : '@@'); return o; };
        const n = (tpl.match(/\{[abc]\}/g) || []).length;
        const build = (tags) => { let s = tpl; ['{a}', '{b}', '{c}'].slice(0, n).forEach((k, i) => { s = s.replace(k, tags[i]); }); return s; };
        const flip = (tags) => tags.map(x => (x === '@' ? '@@' : '@'));
        const classify = (A, B) => {
          if (canon(ctx, A) === canon(ctx, B)) return 'same';
          return canon(ctx, build(flip(tagsFor(A)))) === canon(ctx, B) ? 'enant' : 'diast';
        };
        const tagsFor = (s) => { const tags = []; const re = /\[C(@@|@)H\]/g; let m; while ((m = re.exec(s))) tags.push(m[1]); return tags; };
        for (let tries = 0; tries < 80; tries++) {
          const ta = tagsOf(n);
          let tb;
          if (kind === 'same') tb = rng() < 0.5 ? ta : tagsOf(n);
          else if (kind === 'enant') tb = flip(ta);
          else tb = tagsOf(n);
          const A = build(ta), B = build(tb);
          if (classify(A, B) !== kind) continue;
          const rotB = (A === B) || rng() < 0.5;     // identical SMILES are always shown turned, never as the same picture twice
          const mols = [{ smi: A }, { smi: B, opts: rotB ? { rotate: 180 } : {} }];
          return {
            q: [{ p: t('Palyginkite dvi pavaizduotas molekules.', 'Compare the two drawn molecules.') }, { mol: mols }],
            steps: [
              {
                prompt: t('Koks yra santykis tarp šių dviejų struktūrų?', 'What is the relationship between these two structures?'),
                kind: 'choice',
                options: [{ text: t('Tas pats junginys', 'The same compound') }, { text: t('Enantiomerai', 'Enantiomers') }, { text: t('Diastereomerai', 'Diastereomers') }],
                answer: kind === 'same' ? 0 : kind === 'enant' ? 1 : 2,
                hint: t('Palyginkite kiekvieno chiralinio centro konfigūraciją: jei visų centrų priešingos, tai enantiomerai; jei kai kurių vienodos, kitų skirtingos, tai diastereomerai. Mezoformos atveju skirtingai užrašytos struktūros gali būti ta pati medžiaga.',
                  'Compare the configuration of every chiral centre: if all are opposite the structures are enantiomers; if some are the same and some differ they are diastereomers. With a meso form, differently drawn structures can be the same substance.'),
                solution: t(kind === 'same' ? 'Struktūros sutampa (kartais tik pasukus ar apsukus vieną iš jų), todėl tai tas pats junginys.' : kind === 'enant' ? 'Visų chiralinių centrų konfigūracijos priešingos: struktūros sudaro veidrodinę porą, kurios narių sutapdinti neįmanoma.' : 'Dalies chiralinių centrų konfigūracija vienoda, dalies skirtinga, o struktūros nėra veidrodiniai atspindžiai: tai $σ$-diastereomerai.',
                  kind === 'same' ? 'The structures coincide (sometimes only after turning one of them), so this is the same compound.' : kind === 'enant' ? 'The configurations of all chiral centres are opposite: the structures are mirror images that cannot be superimposed.' : 'Some chiral centres have the same configuration and others differ, and the structures are not mirror images: these are $σ$-diastereomers.')
              },
              {
                prompt: t('Ką galima pasakyti apie šių medžiagų savybes?', 'What can be said about the properties of these substances?'),
                kind: 'choice',
                options: [
                  { text: t('Tos pačios lydymosi ir virimo temperatūros, bet priešingi sukimo kampo ženklai.', 'The same melting and boiling points, but opposite signs of optical rotation.') },
                  { text: t('Skirtingos lydymosi ir virimo temperatūros bei nesusijęs sukimo kampas.', 'Different melting and boiling points and unrelated optical rotation.') },
                  { text: t('Tai ta pati medžiaga, visos savybės vienodos.', 'This is the same substance, all properties are identical.') },
                  { text: t('Priešingi sukimo kampo ženklai ir skirtingos lydymosi temperatūros.', 'Opposite signs of rotation and different melting points.') }
                ],
                answer: kind === 'enant' ? 0 : kind === 'diast' ? 1 : 2,
                hint: t('Enantiomerų fizikinės savybės vienodos (išskyrus sukimą), diastereomerų – skirtingos.', 'Enantiomers share their physical properties (except the rotation), diastereomers differ.'),
                solution: t(kind === 'enant' ? 'Enantiomerai skiriasi tik poliarizuotos šviesos sukimo kryptimi (ir sąveika su kitais chiraliniais objektais).' : kind === 'diast' ? 'Diastereomerai yra skirtingi junginiai su skirtingomis fizikinėmis ir cheminėmis savybėmis.' : 'Tas pats junginys, savybės vienodos.',
                  kind === 'enant' ? 'Enantiomers differ only in the direction in which they rotate polarised light (and in their interaction with other chiral objects).' : kind === 'diast' ? 'Diastereomers are different compounds with different physical and chemical properties.' : 'The same compound: all properties are identical.')
              }
            ],
            why: t('Du stereoizomerai yra enantiomerai, kai kiekvieno chiralinio centro konfigūracija priešinga, ir diastereomerai, kai ji priešinga tik kai kuriuose centruose. Mezoformos atveju $(R,S)$ ir $(S,R)$ yra ta pati medžiaga.',
              'Two stereoisomers are enantiomers when every chiral centre has the opposite configuration, and diastereomers when only some do. For a meso form $(R,S)$ and $(S,R)$ are the same substance.'),
            src: 'L5 p33'
          };
        }
        throw new Error('u05.pairs: no case of kind ' + kind + ' for ' + tpl);
      }
    },

    /* ---------------------------------------------------------------- Z/E ---- */
    {
      id: 'u05.ez',
      title: t('Z ar E: dvigubojo ryšio izomeras', 'Configuration of a double bond: Z or E'),
      mirrors: ['S3.7', 'S3.17'],
      gen(rng, ctx) {
        const { stereo, chem } = ctx;
        const POOL = ['H', 'H', 'CH3', 'Et', 'Cl', 'Br', 'OH', 'NH2', 'COOH', 'CHO', 'CH2OH', 'CN', 'SH', 'Ph'];
        // no two heteroatom groups, and no OH / NH2 / SH together with a halogen, on one alkene carbon
        const HET = ['OH', 'NH2', 'SH'], HAL = ['Cl', 'Br'];
        const heteroClash = (a, b) => (HET.includes(a) && (HET.includes(b) || HAL.includes(b))) || (HET.includes(b) && HAL.includes(a));
        const pair = () => {
          for (let k = 0; k < 40; k++) {
            const a = ctx.pick(POOL), b = ctx.pick(POOL);
            if (a !== b && !heteroClash(a, b)) return [a, b];
          }
          return ['H', 'CH3'];
        };
        for (let tries = 0; tries < 80; tries++) {
          const [a1, b1] = pair(), [a2, b2] = pair();
          // m = the substituent that carries the bond mark (never hydrogen), u = the other one
          const m1 = a1 === 'H' ? b1 : a1, u1 = a1 === 'H' ? a1 : b1;
          const m2 = a2 === 'H' ? b2 : a2, u2 = a2 === 'H' ? a2 : b2;
          const same = rng() < 0.5;
          const smi = 'C(/' + LIG[m1].smi + ')' + (u1 === 'H' ? '' : '(' + LIG[u1].smi + ')') + '=C(' + (same ? '/' : BS) + LIG[m2].smi + ')' + (u2 === 'H' ? '' : LIG[u2].smi);
          const mol = chem.parse(smi);
          const dbl = mol.bonds.find(b => b.order === 2 && mol.atoms[b.a].el === 'C' && mol.atoms[b.b].el === 'C' && !mol.atoms[b.a].aromatic);
          const c1 = dbl.a, c2 = dbl.b;
          const engine = stereo.ez(mol, c1, c2);
          // by hand: the senior group of each carbon, and the side it stands on
          const top1 = LIG[m1].rk > LIG[u1].rk ? m1 : u1;
          const top2 = LIG[m2].rk > LIG[u2].rk ? m2 : u2;
          const side1 = top1 === m1 ? 1 : -1;
          const side2 = (top2 === m2 ? 1 : -1) * (same ? 1 : -1);
          const mine = side1 === side2 ? 'Z' : 'E';
          if (engine !== mine) continue;
          const i1 = 1 + (top1 === m1 ? 0 : natoms(ctx, LIG[m1].smi));
          const c2idx = 1 + natoms(ctx, LIG[m1].smi) + (u1 === 'H' ? 0 : natoms(ctx, LIG[u1].smi));
          if (c2idx !== c2) continue;
          const i2 = c2 + 1 + (top2 === m2 ? 0 : natoms(ctx, LIG[m2].smi));
          const bothH = a1 === 'H' || b1 === 'H' ? (a2 === 'H' || b2 === 'H') : false;
          const sorted1 = byRank([m1, u1]), sorted2 = byRank([m2, u2]);
          const steps = [
            {
              prompt: t('Kiekvienam dvigubojo ryšio atomui bakstelėkite vyresnįjį pakaitą (atomą, tiesiogiai prijungtą prie $C=C$).', 'For each carbon of the double bond tap the senior substituent (its atom bonded directly to the $C=C$).'),
              kind: 'atoms', mol: { smi }, answer: [i1, i2].sort((x, y) => x - y),
              hint: t('Pakaitus rūšiuokite taip, kaip darėte su $R,S$: pirmiausia pagal atominį skaičių, po to pagal prie jų prijungtus atomus.', 'The priority of the substituents is decided as in the $R,S$ system: first by atomic number, then by the atoms attached to them.'),
              solution: t('Pirmajame atome vyresnis pakaitas ' + lf(sorted1[0]) + ' (prieš ' + lf(sorted1[1]) + '), antrajame – ' + lf(sorted2[0]) + ' (prieš ' + lf(sorted2[1]) + ').', 'On the first carbon the senior group is ' + lf(sorted1[0]) + ' (over ' + lf(sorted1[1]) + '), on the second ' + lf(sorted2[0]) + ' (over ' + lf(sorted2[1]) + ').')
            },
            {
              prompt: t('Kokia dvigubojo ryšio konfigūracija?', 'What is the configuration of the double bond?'),
              kind: 'choice', options: [{ text: f('$Z$') }, { text: f('$E$') }], answer: engine === 'Z' ? 0 : 1,
              hint: t('Ar abu vyresnieji pakaitai guli vienoje dvigubojo ryšio pusėje, ar skirtingose?', 'Are the two senior substituents on the same side of the $π$ bond plane or on opposite sides?'),
              solution: t('Vyresnieji pakaitai yra ' + (engine === 'Z' ? 'toje pačioje pusėje: $Z$ (zusammen).' : 'priešingose pusėse: $E$ (entgegen).'), 'The senior substituents are on ' + (engine === 'Z' ? 'the same side: $Z$ (zusammen).' : 'opposite sides: $E$ (entgegen).'))
            }
          ];
          if (bothH) {
            steps.push({
              prompt: t('Kaip šį izomerą vadina cis,trans sistemoje?', 'What is this isomer called in the cis,trans system?'),
              kind: 'choice', options: [{ text: f('cis') }, { text: f('trans') }], answer: engine === 'Z' ? 0 : 1,
              hint: t('Kai kiekvienas dvigubojo ryšio atomas turi po vandenilį, cis reiškia, kad abu kiti pakaitai vienoje pusėje.', 'When each carbon of the double bond carries a hydrogen, cis means that the two other substituents are on the same side.'),
              solution: t('Abu nevandeniliniai pakaitai yra ' + (engine === 'Z' ? 'vienoje pusėje: cis (kartu $Z$).' : 'priešingose pusėse: trans (kartu $E$).'), 'The two non-hydrogen groups are on ' + (engine === 'Z' ? 'the same side: cis (and $Z$).' : 'opposite sides: trans (and $E$).'))
            });
          }
          return {
            q: [{ p: t('Nustatykite dvigubojo ryšio konfigūraciją.', 'Determine the configuration of the double bond.') }, { mol: { smi } }],
            steps,
            why: t('$Z,E$ žymėjimas remiasi pakaitų vyresniškumu: jei prie abiejų dvigubojo ryšio atomų vyresnieji pakaitai yra toje pačioje plokštumos pusėje, tai $Z$ izomeras, jei priešingose – $E$. Cis ir trans tinka tik tada, kai galima palyginti vienodus pakaitus.',
              'The $Z,E$ label rests on substituent priorities: if the senior substituents of the two double-bond carbons are on the same side of the plane the isomer is $Z$, on opposite sides $E$. Cis and trans only fit when identical groups can be compared.'),
            src: 'L5 p40',
            claims: [{ ez: [smi, c1, c2, engine] }]
          };
        }
        throw new Error('u05.ez: no usable alkene');
      }
    },

    /* ---------------------------------------------------------------- Newman projections ---- */
    {
      id: 'u05.newman',
      title: t('Njumeno projekcijos: butano ir halogenalkanų konformacijos', 'Newman projections: conformations of butane and haloalkanes'),
      mirrors: ['S3.8', 'S3.18'],
      gen(rng, ctx) {
        // smi and the bond whose Newman projection is drawn (atom indices), the groups on the front and back atom
        const P = [
          { smi: 'CCCC', bond: [1, 2], front: 'CH3', back: 'CH3', lt: 'butano C2–C3 ryšys', en: 'the C2–C3 bond of butane' },
          { smi: 'ClCCC', bond: [1, 2], front: 'Cl', back: 'CH3', lt: '1-chlorpropano C1–C2 ryšys', en: 'the C1–C2 bond of 1-chloropropane' },
          { smi: 'BrCCC', bond: [1, 2], front: 'Br', back: 'CH3', lt: '1-brompropano C1–C2 ryšys', en: 'the C1–C2 bond of 1-bromopropane' },
          { smi: 'ClCCCl', bond: [1, 2], front: 'Cl', back: 'Cl', lt: '1,2-dichloretano C1–C2 ryšys', en: 'the C1–C2 bond of 1,2-dichloroethane' },
          { smi: 'BrCCBr', bond: [1, 2], front: 'Br', back: 'Br', lt: '1,2-dibrometano C1–C2 ryšys', en: 'the C1–C2 bond of 1,2-dibromoethane' },
          { smi: 'OCCC', bond: [1, 2], front: 'OH', back: 'CH3', lt: '1-propanolio C1–C2 ryšys', en: 'the C1–C2 bond of 1-propanol' },
          { smi: 'CCCCC', bond: [1, 2], front: 'CH3', back: 'CH2CH3', lt: 'pentano C2–C3 ryšys', en: 'the C2–C3 bond of pentane' }
        ];
        const p = ctx.pick(P);
        const X = p.front, Y = p.back;
        const dir = (a) => ({ front: [X, 'H', 'H'], back: [Y, 'H', 'H'], angle: a });
        const CLASS = (a) => (a === 180 ? 'anti' : a === 60 || a === 300 ? 'gauche' : a === 0 ? 'full' : 'part');
        const ENERGY = { anti: 0, gauche: 1, part: 2, full: 3 };
        const mol = { smi: p.smi, opts: { highlight: { bonds: [p.bond], tone: 2 } } };
        const lead = t('Žiūrime išilgai ryšio: ' + p.lt + '. Priekinis atomas pavaizduotas centre, užpakalinis – apskritime.', 'We look along ' + p.en + '. The front atom is drawn at the centre, the back atom is the circle.');
        if (rng() < 0.5) {
          const a = ctx.pick([0, 60, 120, 180, 240, 300]);
          const cl = CLASS(a);
          const names = {
            anti: t('Sustabdytoji, anti: $' + X + '$ ir $' + Y + '$ priešingose pusėse', 'Staggered, anti: $' + X + '$ and $' + Y + '$ on opposite sides'),
            gauche: t('Sustabdytoji, goš (gauche): $' + X + '$ ir $' + Y + '$ 60° kampu', 'Staggered, gauche: $' + X + '$ and $' + Y + '$ at 60°'),
            part: t('Užstotoji: $' + X + '$ užstoja vandenilį, $' + Y + '$ taip pat', 'Eclipsed: $' + X + '$ eclipses a hydrogen, and so does $' + Y + '$'),
            full: t('Užstotoji: $' + X + '$ tiesiai prieš $' + Y + '$', 'Eclipsed: $' + X + '$ directly in front of $' + Y + '$')
          };
          const order = ['anti', 'gauche', 'part', 'full'];
          const eopts = [
            t('Žemiausios energijos (globalinis minimumas)', 'The lowest energy (global minimum)'),
            t('Vietinis minimumas, aukštesnis už globalųjį', 'A local minimum above the global minimum'),
            t('Vietinis maksimumas', 'A local maximum'),
            t('Didžiausios energijos (globalinis maksimumas)', 'The highest energy (global maximum)')
          ];
          return {
            q: [{ mol }, { p: lead }, { newman: dir(a) }],
            steps: [
              {
                prompt: t('Kuri tai konformacija?', 'Which conformation is this?'),
                kind: 'choice', options: order.map(k => ({ text: names[k] })), answer: order.indexOf(cl),
                hint: t('Palyginkite pakaitų $' + X + '$ ir $' + Y + '$ tarpusavio kampą. Ar atomų ryšiai vienas prieš kitą (užstotoji), ar tarp vienas kito?', 'Compare the angle between $' + X + '$ and $' + Y + '$. Are the bonds right in front of each other (eclipsed) or between each other (staggered)?'),
                solution: t('Kampas tarp $' + X + '$ ir $' + Y + '$ yra ' + (a > 180 ? 360 - a : a) + '°: ' + names[cl].lt + '.', 'The angle between $' + X + '$ and $' + Y + '$ is ' + (a > 180 ? 360 - a : a) + '°: ' + names[cl].en + '.')
              },
              {
                prompt: t('Kaip šios konformacijos energija atrodo tarp visų to paties junginio konformacijų?', 'Where does the energy of this conformation stand among all conformations of the same compound?'),
                kind: 'choice', options: eopts.map(x => ({ text: x })), answer: ENERGY[cl],
                hint: t('Didžiausia energija, kai didelės grupės arčiausiai viena kitos; mažiausia – kai labiausiai nutolusios.', 'The energy is highest when the large groups are closest to each other and lowest when they are as far apart as possible.'),
                solution: t(cl === 'anti' ? 'Anti konformacijoje didelės grupės nutolusios labiausiai: tai energijos minimumas.' : cl === 'gauche' ? 'Goš konformacija sustabdyta, bet grupės arti viena kitos (van der Valso atostūmis), todėl energija šiek tiek didesnė už anti.' : cl === 'part' ? 'Užstotoji konformacija turi didesnę energiją (torsinė įtampa), bet grupės $' + X + '$ ir $' + Y + '$ užstoja vandenilius, todėl tai ne aukščiausias maksimumas.' : 'Grupės $' + X + '$ ir $' + Y + '$ užstoja viena kitą: torsinė įtampa ir van der Valso atostūmis kartu duoda didžiausią energiją.',
                  cl === 'anti' ? 'In the anti conformation the large groups are as far apart as possible: this is the energy minimum.' : cl === 'gauche' ? 'The gauche conformation is staggered but the groups are close (van der Waals repulsion), so its energy is a little above anti.' : cl === 'part' ? 'An eclipsed conformation has higher energy (torsional strain), but $' + X + '$ and $' + Y + '$ eclipse hydrogens, so it is not the highest maximum.' : '$' + X + '$ and $' + Y + '$ eclipse each other: torsional strain and van der Waals repulsion together give the highest energy.')
              }
            ],
            why: t('Sukantis apie $C–C$ ryšį molekulė keičia konformaciją. Užstotosios konformacijos turi daugiau energijos (torsinė įtampa), sustabdytosios – mažiau; didelės grupės mažiausiai trukdo viena kitai anti padėtyje.',
              'Rotation about the $C–C$ bond changes the conformation. Eclipsed conformations have more energy (torsional strain), staggered ones less; large groups interfere least in the anti position.'),
            src: 'L5 p49'
          };
        }
        const angles = ctx.shuffle([0, ctx.pick([60, 300]), ctx.pick([120, 240]), 180]).slice(0, 3);
        const letters = ['A', 'B', 'C'];
        const en = angles.map((a, i) => ({ a, L: letters[i], e: ENERGY[CLASS(a)] }));
        const hi = en.slice().sort((x, y) => y.e - x.e);
        return {
          q: [{ mol }, { p: lead }].concat(en.map(x => ({ newman: dir(x.a), caption: f(x.L) }))),
          steps: [
            {
              prompt: t('Išdėstykite konformacijas nuo didžiausios iki mažiausios energijos.', 'Put the conformations in order from the highest to the lowest energy.'),
              kind: 'order', options: hi.map(x => ({ text: f(x.L) })),
              hint: t('Užstotosios konformacijos turi daugiau energijos už sustabdytąsias. Tarp užstotųjų ir tarp sustabdytųjų lemia, ar didelės grupės arti viena kitos.', 'Eclipsed conformations have more energy than staggered ones. Within each kind it matters whether the large groups are close together.'),
              solution: t('Energija mažėja taip: užstotoji, kurioje $' + X + '$ užstoja $' + Y + '$ (didžiausia) > užstotoji su užstotais vandeniliais > goš > anti (mažiausia).', 'The energy falls in this order: eclipsed with $' + X + '$ in front of $' + Y + '$ (highest) > eclipsed with hydrogens in front > gauche > anti (lowest).')
            },
            {
              prompt: t('Kuri konformacija stabiliausia?', 'Which conformation is the most stable?'),
              kind: 'choice', options: en.map(x => ({ text: f(x.L) })), answer: en.indexOf(en.slice().sort((x, y) => x.e - y.e)[0]),
              hint: t('Stabiliausia ta, kurios energija mažiausia.', 'The most stable one has the lowest energy.'),
              solution: t('Stabiliausia yra konformacija su mažiausia energija, t. y. ta, kurioje didelės grupės labiausiai nutolusios.', 'The most stable conformation is the one of lowest energy, where the large groups are farthest apart.')
            }
          ],
          why: t('Konformacijos energiją didina torsinė įtampa (užstoti ryšiai) ir van der Valso atostūmis tarp didelių grupių. Todėl užstotoji konformacija, kurioje didelės grupės užstoja viena kitą, yra aukščiausia, o anti – žemiausia.', 'The energy of a conformation is raised by torsional strain (eclipsed bonds) and by van der Waals repulsion between large groups. Hence the eclipsed conformation with the large groups in front of each other is the highest and anti the lowest.'),
          src: 'L5 p49'
        };
      }
    },

    /* ---------------------------------------------------------------- chair conformations ---- */
    {
      id: 'u05.chair',
      title: t('Cikloheksano kėdės ir ciklo inversija', 'Cyclohexane chairs and ring inversion'),
      mirrors: ['S3.9', 'S3.19', 'S3.20', 'S3.21'],
      gen(rng, ctx) {
        const AV = { CH3: 7.5, Et: 8, Cl: 2, tBu: 20 };                    // kJ/mol: energy cost of the axial position
        const LB = { CH3: 'CH3', Et: 'CH2CH3', Cl: 'Cl', tBu: 'C(CH3)3' };
        const upOf = (pos, ax) => ((pos % 2 === 1) === ax ? 'up' : 'down');
        const lead = (specs) => [
          { chair: { subs: specs }, caption: t('Kėdė A', 'Chair A') },
          { chair: { subs: specs, flip: true }, caption: t('Kėdė B (po ciklo inversijos)', 'Chair B (after ring inversion)') }
        ];
        if (rng() < 0.3) {
          const g = ctx.pick(['CH3', 'Et', 'Cl', 'tBu']);
          const pos = ctx.pick([1, 4]);
          const ax = rng() < 0.5;
          const specs = [{ pos, ax, label: LB[g] }];
          return {
            q: [{ p: t('Monopakeistas cikloheksanas, pakaitas $' + LB[g] + '$. Pavaizduotos abi kėdės konformacijos.', 'A monosubstituted cyclohexane with the substituent $' + LB[g] + '$. Both chair conformations are drawn.') }].concat(lead(specs)),
            steps: [
              {
                prompt: t('Kurioje padėtyje yra pakaitas kėdėje A?', 'In which position is the substituent in chair A?'),
                kind: 'choice', options: [{ text: t('Ašinėje (a)', 'Axial (a)') }, { text: t('Ekvatorinėje (e)', 'Equatorial (e)') }], answer: ax ? 0 : 1,
                hint: t('Ašiniai ryšiai lygiagretūs ciklo ašiai (vertikalūs), ekvatoriniai nukreipti į šoną, beveik ciklo plokštumoje.', 'Axial bonds are parallel to the ring axis (vertical), equatorial bonds point sideways, nearly in the plane of the ring.'),
                solution: t('Pakaito ryšys ' + (ax ? 'vertikalus: ašinė padėtis.' : 'nukreiptas į šoną: ekvatorinė padėtis.'), 'The bond to the substituent is ' + (ax ? 'vertical: axial.' : 'tilted sideways: equatorial.'))
              },
              {
                prompt: t('Kuri kėdė stabilesnė?', 'Which chair is more stable?'),
                kind: 'choice', options: [{ text: t('Kėdė A', 'Chair A') }, { text: t('Kėdė B', 'Chair B') }, { text: t('Jos vienodai stabilios', 'They are equally stable') }], answer: ax ? 1 : 0,
                hint: t('Ciklo inversijoje ašiniai ryšiai tampa ekvatoriniais ir atvirkščiai. Kurioje padėtyje pakaitui erdvės daugiau?', 'In ring inversion axial bonds become equatorial and the other way round. In which position does the substituent have more room?'),
                solution: t('Stabilesnė ta forma, kurioje pakaitas ekvatorinis, t. y. toliau nuo žiedo. ' + (g === 'tBu' ? 'Su didele grupe $C(CH3)3$ pusiausvyroje beveik 100 % yra ekvatorinė forma.' : g === 'Cl' ? 'Chloro grupei skirtumas nedidelis (apie 2 kJ/mol).' : 'Metilo ar etilo grupei ašinė padėtis kainuoja apie 7,5–8 kJ/mol.'),
                  'The more stable conformation is the one with the substituent equatorial (farther from the ring). ' + (g === 'tBu' ? 'With the large $C(CH3)3$ group almost 100 % of the molecules are in the equatorial form.' : g === 'Cl' ? 'For chlorine the difference is small (about 2 kJ/mol).' : 'For a methyl or ethyl group the axial position costs about 7.5–8 kJ/mol.'))
              },
              {
                prompt: t('Kodėl ašinė padėtis nepalanki?', 'Why is the axial position unfavourable?'),
                kind: 'choice',
                options: [
                  { text: t('Ašinis pakaitas artimai sąveikauja su kitais ašiniais vandeniliais toje pačioje ciklo pusėje (1,3-diašinė sąveika).', 'An axial substituent interacts closely with the other axial hydrogens on the same side of the ring (1,3-diaxial interaction).') },
                  { text: t('Ašinė kėdė turi kampinę (Bajerio) įtemptį.', 'The axial chair has angle (Baeyer) strain.') },
                  { text: t('Ašinis ryšys $C–X$ visada ilgesnis ir silpnesnis.', 'An axial $C–X$ bond is always longer and weaker.') },
                  { text: t('Ašiniai pakaitai yra užstotose padėtyse su ciklo anglimis.', 'Axial substituents are eclipsed with the ring carbons.') }
                ],
                answer: 0,
                hint: t('Pažiūrėkite, kokie atomai yra arti ašinio pakaito toje pačioje ciklo pusėje.', 'Look at which atoms lie close to an axial substituent on the same side of the ring.'),
                solution: t('Ašinis pakaitas yra arti dviejų kitų ašinių atomų toje pačioje pusėje (per vieną atomą nuo pakaito abiem kryptimis), todėl jie stumia vienas kitą. Kampinės įtempties kėdėje nėra, užstotų padėčių taip pat.', 'An axial substituent sits close to two other axial atoms on the same side (one atom away from the substituent carbon on each side), so they repel each other. A chair has neither angle strain nor eclipsed positions.')
              }
            ],
            why: t('Cikloheksano kėdėje pakaitas gali būti ašinis arba ekvatorinis, o ciklo inversija šias padėtis sukeičia. Ekvatorinė padėtis stabilesnė, nes ašinis pakaitas sąveikauja su kitais ašiniais atomais toje pačioje ciklo pusėje.', 'In the cyclohexane chair a substituent is axial or equatorial, and ring inversion swaps the two positions. Equatorial is more stable because an axial substituent interacts with the other axial atoms on the same side of the ring.'),
            src: 'L5 p62'
          };
        }
        const kinds = { o: [1, 2], m: [2, 4], p: [1, 4] };
        const kind = ctx.pick(['o', 'm', 'p']);
        const [p1, p2] = kinds[kind];
        const PAIRS = [['CH3', 'CH3'], ['CH3', 'Cl'], ['Et', 'Cl'], ['tBu', 'CH3'], ['tBu', 'Cl'], ['Et', 'Et']];
        let [g1, g2] = ctx.pick(PAIRS);
        if (rng() < 0.5) { const x = g1; g1 = g2; g2 = x; }
        const cis = rng() < 0.5;
        const ax1 = rng() < 0.5;
        const u1 = upOf(p1, ax1);
        const u2 = cis ? u1 : (u1 === 'up' ? 'down' : 'up');
        const ax2 = (u2 === 'up') ? (p2 % 2 === 1) : (p2 % 2 === 0);
        const specs = [{ pos: p1, ax: ax1, label: LB[g1] }, { pos: p2, ax: ax2, label: LB[g2] }];
        if (upOf(p2, ax2) !== u2) throw new Error('u05.chair: up/down rule');
        const eA = (ax1 ? AV[g1] : 0) + (ax2 ? AV[g2] : 0);
        const eB = (ax1 ? 0 : AV[g1]) + (ax2 ? 0 : AV[g2]);
        const stable = Math.abs(eA - eB) < 0.01 ? 2 : eA < eB ? 0 : 1;
        const nAx = (ax1 ? 1 : 0) + (ax2 ? 1 : 0);
        const kindLt = { o: '1,2-', m: '1,3-', p: '1,4-' }[kind];
        const rule = { o: t('1,2: trans = ee arba aa, cis = ae', '1,2: trans = ee or aa, cis = ae'), m: t('1,3: cis = ee arba aa, trans = ae', '1,3: cis = ee or aa, trans = ae'), p: t('1,4: trans = ee arba aa, cis = ae', '1,4: trans = ee or aa, cis = ae') }[kind];
        const sameGroups = g1 === g2;
        return {
          q: [{ p: t(kindLt + 'dipakeistas cikloheksanas, pakaitai $' + LB[g1] + '$ ir $' + LB[g2] + '$. Pavaizduotos abi kėdės konformacijos.', 'A ' + kindLt + 'disubstituted cyclohexane with the substituents $' + LB[g1] + '$ and $' + LB[g2] + '$. Both chair conformations are drawn.') }].concat(lead(specs)),
          steps: [
            {
              prompt: t('Kiek pakaitų yra ašinėje padėtyje kėdėje A?', 'How many substituents are axial in chair A?'),
              kind: 'number', answer: { value: nAx, tol: 0 },
              hint: t('Ašiniai ryšiai vertikalūs, ekvatoriniai pasvirę į šoną.', 'Axial bonds are vertical, equatorial bonds are tilted sideways.'),
              solution: t('Ašinėje padėtyje yra ' + nAx + ' pakaitų.', 'There are ' + nAx + ' axial substituents.')
            },
            {
              prompt: t('Ar tai cis, ar trans izomeras?', 'Is this the cis or the trans isomer?'),
              kind: 'choice', options: [{ text: f('cis') }, { text: f('trans') }], answer: cis ? 0 : 1,
              hint: t('Stebėkite, į kurią ciklo pusę (viršų ar apačią) nukreiptas kiekvienas pakaitas: ašinis ryšys prie gretimų atomų žiūri priešingomis kryptimis, o ekvatorinis – priešingai nei to paties atomo ašinis.', 'Follow which face of the ring (up or down) each substituent points to: an axial bond points in opposite directions on neighbouring atoms, and an equatorial bond points opposite to the axial bond of the same atom.'),
              solution: t('Pakaitai nukreipti ' + (cis ? 'į tą pačią ciklo pusę: cis. ' : 'į skirtingas ciklo puses: trans. ') + 'Taisyklė: ' + rule.lt + '.', 'The substituents point to ' + (cis ? 'the same face of the ring: cis. ' : 'opposite faces of the ring: trans. ') + 'Rule: ' + rule.en + '.')
            },
            {
              prompt: t('Kuri kėdė stabilesnė?', 'Which chair is more stable?'),
              kind: 'choice', options: [{ text: t('Kėdė A', 'Chair A') }, { text: t('Kėdė B', 'Chair B') }, { text: t('Jos vienodai stabilios', 'They are equally stable') }], answer: stable,
              hint: t('Palyginkite, kiek ir kokių pakaitų ašinėje padėtyje kiekvienoje kėdėje. Didesnė grupė labiau nori į ekvatorinę padėtį.', 'Compare how many and which substituents are axial in each chair. A larger group prefers the equatorial position more strongly.'),
              solution: t(stable === 2 ? 'Abiejose kėdėse ašinėje padėtyje po vienodą grupę, todėl energijos vienodos.' : 'Stabilesnė kėdė ' + (stable === 0 ? 'A' : 'B') + ': joje ašinėje padėtyje mažiau ar mažesnių grupių (ašinis $' + LB.CH3 + '$ kainuoja apie 7,5, $' + LB.Et + '$ apie 8, $Cl$ apie 2 kJ/mol).',
                stable === 2 ? 'Both chairs have an identical group axial, so the energies are the same.' : 'Chair ' + (stable === 0 ? 'A' : 'B') + ' is more stable: fewer or smaller groups are axial in it (an axial $' + LB.CH3 + '$ costs about 7.5, $' + LB.Et + '$ about 8, $Cl$ about 2 kJ/mol).')
            }
          ],
          why: t('Dipakeisto cikloheksano dvi kėdės skiriasi tuo, kad ašinės padėtys tampa ekvatorinėmis. Ar abu pakaitai gali užimti ekvatorines padėtis, priklauso nuo izomero: 1,2 ir 1,4 trans bei 1,3 cis gali, kitais atvejais viena grupė visada ašinė, ir ašinėje turi būti mažesnė grupė.',
            'The two chairs of a disubstituted cyclohexane differ in that axial positions become equatorial. Which isomer can place both groups equatorially depends on the positions: 1,2- and 1,4-trans and 1,3-cis can, otherwise one group is always axial and the smaller group should be the axial one.'),
          src: 'L5 p63'
        };
      }
    },

    /* ================================================================ banks ================================================================ */

    /* ---------------------------------------------------------------- kinds of isomerism and tautomers ---- */
    {
      id: 'u05.kinds',
      title: t('Izomerijos rūšis ir tautomerai', 'Kind of isomerism and tautomers'),
      mirrors: [],
      bank: (() => {
        const KINDS = [
          { text: t('Grandinės (skeleto) izomerai', 'Chain (skeleton) isomers') },
          { text: t('Padėties izomerai', 'Position isomers') },
          { text: t('Funkciniai izomerai', 'Functional isomers') },
          { text: t('Erdviniai izomerai (stereoizomerai)', 'Stereoisomers') }
        ];
        const kindStep = (n, hint, solution) => ({
          prompt: t('Kokia izomerija sieja šiuos du junginius?', 'What kind of isomerism relates these two compounds?'),
          kind: 'choice', options: KINDS, answer: n, hint, solution
        });
        return [
          {
            id: 'u05.kinds.1',
            q: [{ mol: [{ smi: 'CCCCC', name: t('pentanas', 'pentane') }, { smi: 'CC(C)CC', name: t('2-metilbutanas', '2-methylbutane') }] }],
            steps: [
              kindStep(0, t('Palyginkite anglies atomų skeletą: ar vienas junginys šakotas?', 'Compare the carbon skeleton: is one of the compounds branched?'),
                t('Abu junginiai neturi funkcinių grupių, o skiriasi tik anglies skeletu: viena grandinė nešakota, kita šakota. Tai grandinės izomerai.', 'Neither compound has a functional group; they differ only in the carbon skeleton: one chain is unbranched and the other branched. They are chain isomers.')),
              { prompt: t('Įrašykite abiejų junginių molekulinę formulę.', 'Give the molecular formula of both compounds.'), kind: 'formula', mol: { smi: 'CCCCC' }, answer: 'C5H12',
                hint: t('Suskaičiuokite anglies ir vandenilio atomus, nepamirškite pasikartojančių $CH2$ grupių.', 'Count the carbon and hydrogen atoms; do not forget the repeating $CH2$ groups.'),
                solution: t('Penkios anglys ir 12 vandenilių: $C5H12$. 2-metilbutanas turi tą pačią formulę, todėl jie izomerai.', 'Five carbons and 12 hydrogens: $C5H12$. 2-Methylbutane has the same formula, so they are isomers.') }
            ],
            why: t('Grandinės izomerų formulė ta pati, o skiriasi anglies skeletas. Funkcinių grupių čia nėra, todėl negali būti nei padėties, nei funkcinių izomerų.', 'Chain isomers share the formula and differ in the carbon skeleton. There is no functional group here, so they cannot be position or functional isomers.'),
            src: 'L5 p3',
            claims: [{ formula: ['CCCCC', 'C5H12'] }, { formula: ['CC(C)CC', 'C5H12'] }]
          },
          {
            id: 'u05.kinds.2',
            q: [{ mol: [{ smi: 'C=CCC', name: t('1-butenas', '1-butene') }, { smi: 'CC=CC', name: t('2-butenas', '2-butene') }] }],
            steps: [
              kindStep(1, t('Ar skeletas vienodas? Kuo skiriasi dvigubojo ryšio vieta?', 'Is the skeleton the same? What differs about the double bond?'),
                t('Anglies skeletas tas pats, bet dvigubasis ryšys skirtingoje vietoje: tai padėties izomerai.', 'The skeleton is the same but the double bond is in a different place: position isomers.')),
              { prompt: t('Ar pats 2-butenas turi stereoizomerų?', 'Does 2-butene itself have stereoisomers?'), kind: 'choice',
                options: [{ text: t('Taip: cis ir trans izomerai ($Z$ ir $E$), nes sukimasis apie dvigubąjį ryšį negalimas.', 'Yes: cis and trans isomers ($Z$ and $E$), because rotation about the double bond is impossible.') },
                  { text: t('Ne, nes visi jo pakaitai vienodi.', 'No, because all its substituents are the same.') },
                  { text: t('Taip, bet tik enantiomerai.', 'Yes, but only enantiomers.') },
                  { text: t('Ne, nes dvigubasis ryšys yra plokščias.', 'No, because the double bond is planar.') }],
                answer: 0,
                hint: t('Kiekvienas dvigubojo ryšio atomas turi $CH3$ ir $H$. Ar galima jas sukeisti taip, kad gautųsi kita medžiaga?', 'Each carbon of the double bond carries $CH3$ and $H$. Can they be swapped to give a different substance?'),
                solution: t('Kiekvienas dvigubojo ryšio atomas turi du skirtingus pakaitus, o sukimasis apie dvigubąjį ryšį negalimas, todėl egzistuoja cis ir trans izomerai ($π$-diastereomerai). Jie achiraliniai, todėl enantiomerų nėra.', 'Each carbon of the double bond has two different substituents and rotation is impossible, so cis and trans isomers ($π$-diastereomers) exist. They are achiral, so there are no enantiomers.') }
            ],
            why: t('Padėties izomerai skiriasi funkcinės grupės ar dvigubojo ryšio vieta. Atskiras klausimas yra tai, ar kuris nors iš jų dar turi stereoizomerų.', 'Position isomers differ in the place of a functional group or double bond. Whether either of them also has stereoisomers is a separate question.'),
            src: 'L5 p4',
            claims: [{ formula: ['C=CCC', 'C4H8'] }, { formula: ['CC=CC', 'C4H8'] }]
          },
          {
            id: 'u05.kinds.3',
            q: [{ mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'COC', name: t('metoksimetanas', 'methoxymethane') }] }],
            steps: [
              kindStep(2, t('Palyginkite funkcines grupes: kokios jos?', 'Compare the functional groups: what are they?'),
                t('Etanolis turi hidroksigrupę, metoksimetanas – eterio grupę, formulė ta pati ($C2H6O$): funkciniai izomerai.', 'Ethanol has a hydroxy group, methoxymethane an ether group, with the same formula ($C2H6O$): functional isomers.')),
              { prompt: t('Įrašykite molekulinę formulę.', 'Give the molecular formula.'), kind: 'formula', mol: { smi: 'CCO' }, answer: 'C2H6O',
                hint: t('Suskaičiuokite visus atomus, ir vandenilius prie deguonies bei anglių.', 'Count all atoms, including the hydrogens on oxygen and on carbon.'),
                solution: t('Dvi anglys, šeši vandeniliai, vienas deguonis: $C2H6O$.', 'Two carbons, six hydrogens and one oxygen: $C2H6O$.') }
            ],
            why: t('Funkciniai izomerai turi skirtingas funkcines grupes, todėl jų cheminės savybės visai kitokios, nors formulė ta pati.', 'Functional isomers carry different functional groups, so their chemistry is quite different even though the formula is the same.'),
            src: 'L5 p5',
            claims: [{ formula: ['CCO', 'C2H6O'] }, { formula: ['COC', 'C2H6O'] }]
          },
          {
            id: 'u05.kinds.4',
            q: [{ mol: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }] }],
            steps: [
              kindStep(2, t('Kuo skiriasi karbonilo grupė?', 'How does the carbonyl group differ?'),
                t('Propanalis yra aldehidas, propanonas – ketonas: funkcinės grupės skirtingos, formulė ta pati ($C3H6O$). Tai funkciniai izomerai.', 'Propanal is an aldehyde and propanone a ketone: the functional groups differ while the formula is the same ($C3H6O$). They are functional isomers.')),
              { prompt: t('Kuris dar yra $C3H6O$ izomeras?', 'Which of these is also an isomer of $C3H6O$?'), kind: 'choice',
                options: [{ mol: { smi: 'C=CCO' } }, { mol: { smi: 'CCCO' } }, { mol: { smi: 'CCC(C)=O' } }, { mol: { smi: 'OCC(O)C' } }], answer: 0,
                hint: t('Suskaičiuokite anglis ir vandenilius kiekviename variante: reikia $C3H6O$.', 'Count carbons and hydrogens in each option: you need $C3H6O$.'),
                solution: t('Alilo alkoholis $CH2=CH–CH2OH$ yra $C3H6O$ (funkcinis izomeras su alkeno ir alkoholio grupėmis). Kiti variantai turi kitą formulę: $C3H8O$, $C4H8O$ ir $C3H8O2$.', 'Allyl alcohol $CH2=CH–CH2OH$ is $C3H6O$ (a functional isomer with alkene and alcohol groups). The others have different formulas: $C3H8O$, $C4H8O$ and $C3H8O2$.') }
            ],
            why: t('Izomerai turi tą pačią molekulinę formulę. Prieš klasifikuodami, visada pirmiausia suskaičiuokite atomus.', 'Isomers have the same molecular formula. Before classifying, always count the atoms first.'),
            src: 'L5 p5',
            claims: [{ formula: ['CCC=O', 'C3H6O'] }, { formula: ['CC(C)=O', 'C3H6O'] }, { formula: ['C=CCO', 'C3H6O'] }, { formula: ['CCCO', 'C3H8O'] }, { formula: ['CCC(C)=O', 'C4H8O'] }, { formula: ['OCC(O)C', 'C3H8O2'] }]
          },
          {
            id: 'u05.kinds.5',
            q: [{ mol: [{ smi: 'Clc1ccccc1Cl', name: t('1,2-dichlorbenzenas', '1,2-dichlorobenzene') }, { smi: 'Clc1cccc(Cl)c1', name: t('1,3-dichlorbenzenas', '1,3-dichlorobenzene') }] }],
            steps: [
              kindStep(1, t('Kas skiriasi: skeletas, grupė ar jos vieta?', 'What differs: the skeleton, the group or its position?'),
                t('Benzeno žiedas ir chloro atomai tie patys, skiriasi tik chlorų padėtis žiede: padėties izomerai.', 'The benzene ring and chlorine atoms are the same; only the positions of the chlorines on the ring differ: position isomers.')),
              { prompt: t('Kiek skirtingų dichlorbenzenų egzistuoja?', 'How many different dichlorobenzenes exist?'), kind: 'number', answer: { value: 3, tol: 0 },
                hint: t('Pirmą chlorą pritvirtinkite bet kur, o antrąjį dėkite į kiekvieną skirtingą padėtį.', 'Attach the first chlorine anywhere, then put the second in each different position.'),
                solution: t('Antrasis chloras gali būti gretimas (1,2), per vieną atomą (1,3) ar priešingas (1,4). Daugiau skirtingų nėra: 3 izomerai.', 'The second chlorine can be next to the first (1,2), one atom away (1,3) or opposite (1,4). There are no other distinct ones: 3 isomers.') }
            ],
            why: t('Žiedo padėčių skaičiavimas yra padėties izomerijos pavyzdys: simetrija sumažina skirtingų junginių skaičių.', 'Counting positions on a ring is an example of position isomerism: symmetry reduces the number of distinct compounds.'),
            src: 'L5 p4',
            claims: [{ formula: ['Clc1ccccc1Cl', 'C6H4Cl2'] }, { formula: ['Clc1cccc(Cl)c1', 'C6H4Cl2'] }]
          },
          {
            id: 'u05.kinds.6',
            q: [{ mol: [{ smi: 'C1CCC1', name: t('ciklobutanas', 'cyclobutane') }, { smi: 'CC1CC1', name: t('metilciklopropanas', 'methylcyclopropane') }] }],
            steps: [
              kindStep(0, t('Abu junginiai ciklai be funkcinių grupių.', 'Both compounds are rings without functional groups.'),
                t('Abu turi formulę $C4H8$ ir skiriasi žiedo dydžiu bei šakomis, t. y. skeletu: grandinės izomerai.', 'Both have the formula $C4H8$ and differ in ring size and branching, i.e. in the skeleton: chain isomers.')),
              { prompt: t('Kiek izomerų turi $C4H8$, jei skaičiuojame ir ciklinius junginius (stereoizomerų neskaičiuojame)?', 'How many isomers does $C4H8$ have if rings are counted too (stereoisomers are not counted)?'), kind: 'number', answer: { value: 5, tol: 0 },
                hint: t('Suskaičiuokite alkenus (jų trys), po to žiedus.', 'Count the alkenes (there are three), then the rings.'),
                solution: t('Trys alkenai (1-butenas, 2-butenas, 2-metilpropenas) ir du ciklai (ciklobutanas, metilciklopropanas): iš viso 5.', 'Three alkenes (1-butene, 2-butene, 2-methylpropene) and two rings (cyclobutane, methylcyclopropane): 5 in all.') }
            ],
            why: t('Formulė $CnH2n$ tinka ir alkenams, ir cikloalkanams, todėl sandaros izomerų skaičius priklauso nuo to, ar skaičiuojame ciklus.', 'The formula $CnH2n$ fits both alkenes and cycloalkanes, so the number of constitutional isomers depends on whether rings are counted.'),
            src: 'L5 p3',
            claims: [{ formula: ['C1CCC1', 'C4H8'] }, { formula: ['CC1CC1', 'C4H8'] }, { isomers: ['C4H8', 5, null, { rings: true }] }]
          },
          {
            id: 'u05.kinds.7',
            q: [{ p: t('Acetonas ($CH3COCH3$) yra ketonas. Raskite jo enolinę formą.', 'Acetone ($CH3COCH3$) is a ketone. Find its enol form.') }, { mol: { smi: 'CC(C)=O', name: t('propanonas', 'propanone') } }],
            steps: [
              { prompt: t('Kuri struktūra yra acetono enolis (tautomeras)?', 'Which structure is the enol (tautomer) of acetone?'), kind: 'choice',
                options: [{ mol: { smi: 'CC(O)=C' } }, { mol: { smi: 'C=CCO' } }, { mol: { smi: 'CCC=O' } }, { mol: { smi: 'COC=C' } }], answer: 0,
                hint: t('Enolyje hidroksigrupė prijungta prie dvigubojo ryšio anglies, o karbonilo anglis išlieka ta pati. Kuris vandenilis persikelia?', 'In an enol the hydroxy group is on a double-bond carbon, and it is the same carbon that was the carbonyl carbon. Which hydrogen moves?'),
                solution: t('Vandenilis iš metilo grupės persikelia prie deguonies, o dvigubas ryšys atsiranda tarp karbonilo anglies ir metilo anglies: $CH2=C(OH)CH3$. Kiti variantai turi tą pačią formulę, bet yra ne tautomerai, o kiti sandaros izomerai (anglies skeletas ar atomų jungimosi tvarka kitokia).', 'A hydrogen moves from the methyl group to oxygen and the double bond forms between the carbonyl carbon and the methyl carbon: $CH2=C(OH)CH3$. The other options have the same formula but are other constitutional isomers, not tautomers (they connect the atoms differently).') },
              { prompt: t('Kas persikelia tarp ketoninės ir enolinės formos?', 'What migrates between the keto and the enol form?'), kind: 'choice',
                options: [{ text: t('Protonas $H+$ (prototropinė tautomerija)', 'A proton $H+$ (prototropic tautomerism)') }, { text: t('Metilo grupė', 'A methyl group') }, { text: t('Hidrido jonas $H-$', 'A hydride ion $H-$') }, { text: t('Deguonies atomas', 'The oxygen atom') }],
                answer: 0,
                hint: t('Tautomerijos pavadinimas „prototropinė“ jau užsimena apie migruojančią dalelę.', 'The name “prototropic” already hints at the migrating particle.'),
                solution: t('Migruoja protonas $H+$; tautomerai greitai virsta vienas kitu dinaminėje pusiausvyroje.', 'A proton $H+$ migrates; the tautomers interconvert quickly in a dynamic equilibrium.') }
            ],
            why: t('Ketoenolinė tautomerija yra funkcinės izomerijos ypatingas atvejis: tautomerai skiriasi protono ir dvigubojo ryšio padėtimi ir pusiausvyroje virsta vienas kitu.', 'Keto-enol tautomerism is a special case of functional isomerism: the tautomers differ in the position of a proton and a double bond and interconvert in an equilibrium.'),
            src: 'L5 p6',
            claims: [{ formula: ['CC(O)=C', 'C3H6O'] }, { formula: ['COC=C', 'C3H6O'] }, { formula: ['CCC=O', 'C3H6O'] }]
          },
          {
            id: 'u05.kinds.8',
            q: [{ scheme: { items: [{ smi: 'O=C1CCCN1' }, { arrow: '⇌' }, { smi: 'OC1=NCCC1' }] } }],
            steps: [
              { prompt: t('Kaip vadinasi šių dviejų struktūrų santykis?', 'What do you call the relationship between these two structures?'), kind: 'choice',
                options: [{ text: t('Tautomerai (laktamas ir laktimas)', 'Tautomers (lactam and lactim)') }, { text: t('Rezonansinės formulės', 'Resonance structures') }, { text: t('Enantiomerai', 'Enantiomers') }, { text: t('Grandinės izomerai', 'Chain isomers') }],
                answer: 0,
                hint: t('Palyginkite, ar tarp struktūrų pasikeitė atomų (vandenilio) padėtis, ar tik elektronų išsidėstymas.', 'Compare whether the position of an atom (a hydrogen) differs between the structures or only the electron distribution.'),
                solution: t('$N–H$ vandenilis pasikeitė į $O–H$, o dvigubas ryšys persikėlė iš $C=O$ į $C=N$: pasikeitė atomo padėtis, todėl tai ne rezonansinės formulės, o tautomerai (amido ir iminolio (laktimo) formos).', 'The $N–H$ hydrogen turned into an $O–H$ and the double bond moved from $C=O$ to $C=N$: the position of an atom changed, so these are not resonance structures but tautomers (the amide (lactam) and imidic acid / iminol (lactim) forms).') },
              { prompt: t('Kuris atomas „keliauja“ iš vienos formos į kitą?', 'Which atom “travels” from one form to the other?'), kind: 'choice',
                options: [{ text: t('Vandenilis nuo azoto prie deguonies', 'A hydrogen from nitrogen to oxygen') }, { text: t('Azotas', 'The nitrogen') }, { text: t('Anglies atomas', 'A carbon atom') }, { text: t('Nė vienas, keičiasi tik elektronai', 'None, only electrons move') }],
                answer: 0,
                hint: t('Pažiūrėkite, prie kurio atomo prijungtas vandenilis kairėje ir dešinėje.', 'Look at which atom carries the hydrogen on the left and on the right.'),
                solution: t('Kairėje vandenilis prie azoto, dešinėje – prie deguonies.', 'On the left the hydrogen is on nitrogen, on the right on oxygen.') }
            ],
            why: t('Laktam–laktimo tautomerija yra tas pats reiškinys kaip ketoenolinė: protonas pereina nuo vieno heteroatomo prie kito ir pasislenka dvigubasis ryšys.', 'Lactam-lactim tautomerism is the same phenomenon as keto-enol: a proton moves from one heteroatom to another and the double bond shifts.'),
            src: 'L5 p7',
            claims: [{ formula: ['O=C1CCCN1', 'C4H7NO'] }, { formula: ['OC1=NCCC1', 'C4H7NO'] }]
          },
          {
            id: 'u05.kinds.9',
            q: [{ scheme: { items: [{ smi: 'OCCCC=O' }, { arrow: '⇌' }, { smi: 'OC1CCCO1' }] } }],
            steps: [
              { prompt: t('Kokia tautomerija pavaizduota?', 'Which kind of tautomerism is shown?'), kind: 'choice',
                options: [{ text: t('Žiedo ir grandinės tautomerija', 'Ring-chain tautomerism') }, { text: t('Ketoenolinė tautomerija', 'Keto-enol tautomerism') }, { text: t('Laktam–laktimo tautomerija', 'Lactam-lactim tautomerism') }, { text: t('Cis–trans izomerija', 'Cis-trans isomerism') }],
                answer: 0,
                hint: t('Viena struktūra atvira grandinė, kita – žiedas.', 'One structure is an open chain, the other a ring.'),
                solution: t('Hidroksialdehido $OH$ prisijungia prie $C=O$ ir susidaro penkių narių žiedas su deguonimi: grandininis ir žiedo izomerai greitai virsta vienas kitu.', 'The $OH$ of the hydroxy aldehyde adds to the $C=O$ and a five-membered ring with oxygen forms: the chain and ring isomers interconvert quickly.') },
              { prompt: t('Kuo tautomerai skiriasi nuo rezonansinių formulių?', 'How do tautomers differ from resonance structures?'), kind: 'choice',
                options: [{ text: t('Tautomerai yra skirtingi junginiai, kurie virsta vienas kitu pusiausvyroje; rezonansinės formulės – tik vieno junginio užrašymo būdai.', 'Tautomers are different compounds that interconvert in an equilibrium; resonance structures are only ways of writing one compound.') },
                  { text: t('Tautomerai neturi tos pačios formulės.', 'Tautomers do not have the same formula.') },
                  { text: t('Rezonansinės formulės yra du izomerai pusiausvyroje.', 'Resonance structures are two isomers in equilibrium.') },
                  { text: t('Skirtumo nėra.', 'There is no difference.') }],
                answer: 0,
                hint: t('Ar tarp rezonansinių formulių yra pusiausvyra, ar tai viena molekulė?', 'Is there an equilibrium between resonance structures, or is it one molecule?'),
                solution: t('Tautomerų atomų padėtis skiriasi (migruoja protonas), tai du realūs junginiai. Rezonansinių formulių atomai nejuda, o tikroji molekulė yra jų hibridas.', 'In tautomers the position of an atom differs (a proton migrates) and they are two real compounds. In resonance structures no atom moves and the real molecule is their hybrid.') }
            ],
            why: t('Žiedo ir grandinės tautomerija būdinga hidroksialdehidams ir hidroksiketonams, kurių $OH$ gali pasiekti karbonilo grupę, ir sudaro penkių ar šešių narių žiedą.', 'Ring-chain tautomerism is typical of hydroxy aldehydes and hydroxy ketones whose $OH$ can reach the carbonyl group and form a five- or six-membered ring.'),
            src: 'L5 p7',
            claims: [{ formula: ['OCCCC=O', 'C4H8O2'] }, { formula: ['OC1CCCO1', 'C4H8O2'] }]
          },
          {
            id: 'u05.kinds.10',
            q: [{ p: t('Keturios izomerų poros pavaizduotos žemiau.', 'Four pairs of isomers are shown.') }],
            steps: [
              { prompt: t('Kuri pora yra tautomerai?', 'Which pair are tautomers?'), kind: 'choice',
                options: [
                  { scheme: { items: [{ smi: 'CCCCC' }, { arrow: '→' }, { smi: 'CC(C)CC' }] } },
                  { scheme: { items: [{ smi: 'CC(=O)C' }, { arrow: '⇌' }, { smi: 'CC(O)=C' }] } },
                  { scheme: { items: [{ smi: 'CCO' }, { arrow: '→' }, { smi: 'COC' }] } },
                  { scheme: { items: [{ smi: 'C/C=C\\C' }, { arrow: '→' }, { smi: 'C/C=C/C' }] } }
                ],
                answer: 1,
                hint: t('Tautomerai greitai virsta vienas kitu, kai protonas pereina iš vienos vietos į kitą. Kurioje poroje skiriasi tik vandenilio ir dvigubojo ryšio padėtis?', 'Tautomers interconvert quickly when a proton moves from one place to another. In which pair do only the positions of a hydrogen and a double bond differ?'),
                solution: t('Ketonas ir enolis: protonas persikelia nuo anglies prie deguonies. Pentanas ir 2-metilbutanas – grandinės izomerai, etanolis ir eteris – funkciniai, cis ir trans butenas – stereoizomerai; jie vienas į kitą kambario temperatūroje nevirsta.', 'The ketone and the enol: a proton moves from carbon to oxygen. Pentane and 2-methylbutane are chain isomers, ethanol and the ether are functional isomers, and cis and trans butene are stereoisomers; they do not interconvert at room temperature.') }
            ],
            why: t('Tautomerija – dinaminė pusiausvyra, kai migruoja protonas. Kitos izomerų poros yra pastovūs junginiai, kuriuos galima išskirti ir kurie vienas į kitą savaime nevirsta.', 'Tautomerism is a dynamic equilibrium in which a proton migrates. The other pairs of isomers are stable compounds that can be isolated and do not turn into each other spontaneously.'),
            src: 'L5 p5',
            claims: [{ formula: ['CC(=O)C', 'C3H6O'] }, { formula: ['CC(O)=C', 'C3H6O'] }]
          }
        ];
      })()
    },

    /* ---------------------------------------------------------------- reasoning about chirality ---- */
    {
      id: 'u05.reasons',
      title: t('Chirališkumas: priežastys ir pavyzdžiai', 'Chirality: reasons and examples'),
      mirrors: ['S3.14'],
      bank: [
        {
          id: 'u05.reasons.1',
          q: [
            { p: t('Natūralūs $L$-aminorūgščių stereocentrai dažniausiai yra $S$ konfigūracijos, tačiau $L$-cisteino – $R$.', 'The stereocentres of natural $L$-amino acids are mostly $S$, but that of $L$-cysteine is $R$.') },
            { mol: [{ smi: 'OC[C@H](N)C(=O)O' }, { smi: 'SC[C@H](N)C(=O)O' }], caption: t('$L$-serinas ir $L$-cisteinas', '$L$-serine and $L$-cysteine') }
          ],
          steps: [
            {
              prompt: t('Išdėstykite cisteino stereocentro pakaitus nuo vyriausio iki jauniausio.', 'Put the substituents of the cysteine stereocentre in order from the highest to the lowest priority.'),
              kind: 'order', options: [{ text: f('$NH2$') }, { text: f('$CH2SH$') }, { text: f('$COOH$') }, { text: f('$H$') }],
              hint: t('Pirmiausia lyginkite atomus, tiesiogiai prijungtus prie stereocentro. Dvi grupės prasideda anglimi: tada žiūrėkite, kokie atomai prijungti prie tų anglių.', 'First compare the atoms bonded directly to the stereocentre. Two groups start with carbon: then look at the atoms attached to those carbons.'),
              solution: t('$NH2$ (azotas) aukščiausias. Tarp dviejų anglies grupių: prie $CH2SH$ anglies prijungta $(S,H,H)$, prie $COOH$ – $(O,O,O)$. Pirmasis skirtumas lyginant didžiausią atomą: siera (16) vyresnė už deguonį (8), todėl $CH2SH$ vyresnė už $COOH$.', '$NH2$ (nitrogen) is highest. Between the two carbon groups: the carbon of $CH2SH$ carries $(S,H,H)$, that of $COOH$ $(O,O,O)$. At the first difference, comparing the highest atoms, sulfur (16) outranks oxygen (8), so $CH2SH$ outranks $COOH$.')
            },
            {
              prompt: t('Išdėstykite serino stereocentro pakaitus nuo vyriausio iki jauniausio.', 'Put the substituents of the serine stereocentre in order from the highest to the lowest priority.'),
              kind: 'order', options: [{ text: f('$NH2$') }, { text: f('$COOH$') }, { text: f('$CH2OH$') }, { text: f('$H$') }],
              hint: t('Palyginkite anglies grupes pagal prie jų prijungtus atomus.', 'Compare the carbon groups by the atoms attached to them.'),
              solution: t('Serine $COOH$ $(O,O,O)$ vyresnė už $CH2OH$ $(O,H,H)$, nes pirmieji atomai vienodi, o antrasis ir trečiasis deguonys didesni už vandenilius.', 'In serine $COOH$ $(O,O,O)$ outranks $CH2OH$ $(O,H,H)$, because the first atoms tie and the second and third oxygens outrank hydrogens.')
            },
            {
              prompt: t('Kodėl $L$-cisteino konfigūracija $R$, nors erdvinė struktūra tokia pati kaip $L$-serino?', 'Why is $L$-cysteine $R$ although its spatial arrangement is the same as that of $L$-serine?'),
              kind: 'choice',
              options: [
                { text: t('Cisteine siera vyresnė už deguonį, todėl $CH2SH$ aplenkia $COOH$: antros ir trečios vietos sukeičiamos ir raidė pasikeičia.', 'In cysteine sulfur outranks oxygen, so $CH2SH$ overtakes $COOH$: the second and third places swap and the letter changes.') },
                { text: t('Cisteinas yra $D$ eilės junginys.', 'Cysteine belongs to the $D$ series.') },
                { text: t('Siera yra didesnė, todėl cisteinas suka šviesą į priešingą pusę.', 'Sulfur is larger, so cysteine rotates light in the opposite direction.') },
                { text: t('Cisteino stereocentras nechiralinis.', 'The stereocentre of cysteine is not chiral.') }
              ],
              answer: 0,
              hint: t('Palyginkite pakaitų eilę serine ir cisteine: kuri vieta pasikeičia?', 'Compare the order of priorities in serine and in cysteine: which place changes?'),
              solution: t('Kai du pakaitai sukeičiami pagal vyresniškumą, o erdvinė struktūra lieka ta pati, eigos kryptis keičiasi į priešingą: $S$ virsta $R$.', 'When two substituents swap in priority while the spatial arrangement stays the same, the direction of travel reverses: $S$ becomes $R$.')
            }
          ],
          why: t('$R,S$ ir $D,L$ nusako skirtingus dalykus. $L$ reiškia tą pačią santykinę erdvinę struktūrą kaip $L$-glicerolio aldehidas, o $R,S$ priklauso nuo pakaitų vyresniškumo, todėl vienas pakaitas, pasikeitęs vieta eilėje, gali pakeisti raidę.', '$R,S$ and $D,L$ describe different things. $L$ means the same relative spatial arrangement as $L$-glyceraldehyde, while $R,S$ depends on the priorities of the substituents, so a substituent that changes its place in the order can change the letter.'),
          src: 'S3.14',
          claims: [{ cip: ['OC[C@H](N)C(=O)O', 2, 'S'] }, { cip: ['SC[C@H](N)C(=O)O', 2, 'R'] }]
        },
        {
          id: 'u05.reasons.2',
          q: [
            { p: t('Prochiralinė molekulė, reaguodama su achiraliniu reagentu, virsta chiraline. Žemiau pavaizduoti keturi ketonai, kuriuos redukuoja $NaBH4$.', 'A prochiral molecule becomes chiral in a reaction with an achiral reagent. Four ketones are shown, each reduced with $NaBH4$.') },
            { mol: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'CCC(C)=O', name: t('2-butanonas', '2-butanone') }, { smi: 'CCC(=O)CC', name: t('3-pentanonas', '3-pentanone') }, { smi: 'O=C1CCCCC1', name: t('cikloheksanonas', 'cyclohexanone') }] }
          ],
          steps: [
            {
              prompt: t('Redukuojant kuris ketonas duoda chiralinį alkoholį?', 'On reduction which ketone gives a chiral alcohol?'),
              kind: 'choice', options: [{ mol: { smi: 'CC(C)=O' } }, { mol: { smi: 'CCC(C)=O' } }, { mol: { smi: 'CCC(=O)CC' } }, { mol: { smi: 'O=C1CCCCC1' } }], answer: 1,
              hint: t('Redukcijos metu karbonilo anglis gauna vandenilį ir tampa $CH(OH)$. Ar šioje anglyje bus keturios skirtingos grupės?', 'In the reduction the carbonyl carbon gains a hydrogen and becomes $CH(OH)$. Will that carbon carry four different groups?'),
              solution: t('Susidaro antriniai alkoholiai. Iš 2-butanono gaunamas 2-butanolis: prie anglies yra $H$, $OH$, $CH3$ ir $CH2CH3$ (keturi skirtingi pakaitai). Kitų ketonų alkoholiuose yra dvi vienodos grupės, todėl jie achiraliniai.', 'Secondary alcohols form. 2-Butanone gives 2-butanol, whose carbon has $H$, $OH$, $CH3$ and $CH2CH3$ (four different substituents). The alcohols from the other ketones contain two identical groups and are achiral.')
            },
            {
              prompt: t('Kuris teiginys apibūdina prochiralinį atomą?', 'Which statement describes a prochiral atom?'),
              kind: 'choice',
              options: [
                { text: t('Achiralinis atomas, kuris tampa chiraliniu centru, kai vienas jo pakaitas pakeičiamas kitu.', 'An achiral atom that becomes a chiral centre when one of its substituents is replaced by a new one.') },
                { text: t('Atomas su keturiais skirtingais pakaitais.', 'An atom with four different substituents.') },
                { text: t('Atomas, per kurį eina simetrijos plokštuma.', 'An atom through which a plane of symmetry passes.') },
                { text: t('Atomas, kuris suka poliarizuotą šviesą.', 'An atom that rotates polarised light.') }
              ],
              answer: 0,
              hint: t('Pirma „pro-“ reiškia „prieš“: atomas dar nėra chiralinis centras, bet gali juo tapti.', 'The prefix “pro-” hints that the atom is not yet a chiral centre, but may become one.'),
              solution: t('2-Butanono karbonilo anglis prochiralinė: pakeitus $=O$ į $H$ ir $OH$ ji tampa chiraliniu centru.', 'The carbonyl carbon of 2-butanone is prochiral: once $=O$ is replaced by $H$ and $OH$ it becomes a chiral centre.')
            }
          ],
          why: t('Prochirališkumas rodo, ar reakcija gali sukurti stereocentrą. Ketonas su dviem skirtingais pakaitais prie karbonilo yra prochiralinis, o simetriškas ketonas – ne.', 'Prochirality tells whether a reaction can create a stereocentre. A ketone with two different groups on the carbonyl carbon is prochiral, a symmetrical ketone is not.'),
          src: 'L5 p17–18',
          claims: [
            { react: ['co.nabh4', ['CCC(C)=O'], null, 'CCC(C)O'] }, { react: ['co.nabh4', ['CC(C)=O'], null, 'CC(C)O'] },
            { react: ['co.nabh4', ['CCC(=O)CC'], null, 'CCC(O)CC'] }, { react: ['co.nabh4', ['O=C1CCCCC1'], null, 'OC1CCCCC1'] },
            { chiral: ['CCC(C)O', true] }, { chiral: ['CC(C)O', false] }
          ]
        },
        {
          id: 'u05.reasons.3',
          q: [
            { p: t('Gryno (R)-2-metil-1-butanolio sukimo kampas $[α]$ = +5,75°, o (S)-enantiomero −5,75°. Sumaišomas lygus jų kiekis.', 'The rotation $[α]$ of pure (R)-2-methyl-1-butanol is +5.75° and that of the (S) enantiomer −5.75°. Equal amounts of the two are mixed.') },
            { mol: [{ smi: 'CC[C@@H](C)CO' }, { smi: 'CC[C@H](C)CO' }], caption: t('(R) ir (S)', '(R) and (S)') }
          ],
          steps: [
            {
              prompt: t('Koks mišinio sukimo kampas, laipsniais?', 'What is the rotation of the mixture, in degrees?'),
              kind: 'number', answer: { value: 0, tol: 0 },
              hint: t('Ką padaro vienodi bet priešingi sukimai?', 'What do equal but opposite rotations do?'),
              solution: t('Kiekvienos (R) molekulės poveikį kompensuoja (S) molekulė: +5,75° ir −5,75° susideda į 0°.', 'The effect of every (R) molecule is cancelled by an (S) molecule: +5.75° and −5.75° add up to 0°.')
            },
            {
              prompt: t('Kodėl mišinys optiškai neaktyvus?', 'Why is the mixture optically inactive?'),
              kind: 'choice',
              options: [
                { text: t('Tai racematas: viena molekulė sukimą kompensuoja kitos enantiomero molekulė (išorinė kompensacija), nors kiekviena molekulė chiralinė.', 'It is a racemate: the rotation of one enantiomer is cancelled by the other (external compensation) although every molecule is chiral.') },
                { text: t('Mišinio molekulės tampa achiralinės.', 'The molecules of the mixture become achiral.') },
                { text: t('Tai mezoforma su simetrijos plokštuma.', 'It is a meso form with a plane of symmetry.') },
                { text: t('Enantiomerai sureaguoja vienas su kitu.', 'The enantiomers react with each other.') }
              ],
              answer: 0,
              hint: t('Ar mišinyje kiekviena atskira molekulė pakito?', 'Has every single molecule in the mixture changed?'),
              solution: t('Racemate molekulės lieka chiralinės; neaktyvumas atsiranda dėl dviejų enantiomerų kompensacijos. Mezoformos molekulė, atvirkščiai, pati achiralinė.', 'In a racemate the molecules stay chiral; the inactivity arises from the compensation of two enantiomers. A meso molecule, by contrast, is achiral itself.')
            }
          ],
          why: t('Mišinys, kuriame enantiomerų yra po lygiai, vadinamas racematu ir optiškai neaktyvus. Tai ne tas pats, kas mezoforma: racematas – dviejų medžiagų mišinys, mezoforma – viena achiralinė medžiaga.', 'A mixture of equal amounts of enantiomers is called a racemate and is optically inactive. This is not the same as a meso form: a racemate is a mixture of two substances, a meso form is one achiral substance.'),
          src: 'L5 p19',
          claims: [{ cip: ['CC[C@@H](C)CO', 2, 'R'] }, { cip: ['CC[C@H](C)CO', 2, 'S'] }]
        },
        {
          id: 'u05.reasons.4',
          q: [{ p: t('Pagalvokite apie du vieno chiralinio junginio enantiomerus achiralinėje aplinkoje (pavyzdžiui, ištirpintus vandenyje).', 'Think of the two enantiomers of one chiral compound in an achiral environment (for example dissolved in water).') }],
          steps: [
            {
              prompt: t('Pažymėkite visas savybes, kurios abiem enantiomerams vienodos.', 'Pick every property that is identical for both enantiomers.'),
              kind: 'multi',
              options: [
                { text: t('Lydymosi temperatūra', 'Melting point') }, { text: t('Virimo temperatūra', 'Boiling point') }, { text: t('Tirpumas vandenyje', 'Solubility in water') },
                { text: t('Reakcija su achiraliniu reagentu', 'Reaction with an achiral reagent') }, { text: t('Poliarizuotos šviesos sukimo kryptis', 'Direction of rotation of polarised light') },
                { text: t('Sąveika su chiraliniu receptoriumi', 'Interaction with a chiral receptor') }
              ],
              answer: [0, 1, 2, 3],
              hint: t('Atskirti enantiomerus galima tik chiraliniu veiksniu. Kurios savybės jo reikalauja?', 'Enantiomers can be told apart only by a chiral agent. Which properties involve one?'),
              solution: t('Vienodi: tirpumas, lydymosi bei virimo temperatūra ir reaktingumas su achiraliniais reagentais. Skiriasi sukimo kryptis (priešinga) ir sąveika su chiraliniais objektais, pavyzdžiui, receptoriais.', 'Melting and boiling points, solubility and reactions with achiral reagents are identical. The direction of rotation (opposite) and the interaction with chiral objects such as receptors differ.')
            },
            {
              prompt: t('Kodėl enantiomerai gali skirtingai veikti organizmą?', 'Why can enantiomers act differently on the body?'),
              kind: 'choice',
              options: [
                { text: t('Receptoriai yra chiraliniai baltymai: vieną enantiomerą jie atpažįsta, kito ne.', 'Receptors are chiral proteins: they recognise one enantiomer and not the other.') },
                { text: t('Enantiomerai turi skirtingą molekulinę formulę.', 'The enantiomers have different molecular formulas.') },
                { text: t('Vienas enantiomeras yra nepolinis, kitas polinis.', 'One enantiomer is nonpolar and the other polar.') },
                { text: t('Vienas enantiomeras lengviau tirpsta vandenyje.', 'One enantiomer dissolves more easily in water.') }
              ],
              answer: 0,
              hint: t('Pagalvokite apie raktą ir spyną arba dešinę ranką ir pirštinę.', 'Think of a key and a lock, or a right hand and a glove.'),
              solution: t('Receptorius yra chiralinis, todėl su vienu enantiomeru jis sąveikauja, o su kitu ne, panašiai kaip dešinė pirštinė tinka tik dešinei rankai. Pavyzdys: limonenas, kurio $R$ forma kvepia apelsinais, $S$ – citrinomis.', 'A receptor is chiral, so it binds one enantiomer and not the other, much as a right glove fits only a right hand. An example is limonene, whose $R$ form smells of oranges and $S$ form of lemons.')
            }
          ],
          why: t('Fizikinės ir cheminės savybės skiriasi tik chiralinėje aplinkoje (poliarizuotoje šviesoje, su receptoriais ir fermentais). Dėl šios priežasties daugelio vaistų aktyvus tik vienas enantiomeras.', 'The properties differ only in a chiral environment (polarised light, receptors and enzymes). For this reason many drugs are active as one enantiomer only.'),
          src: 'L5 p19, p30'
        },
        {
          id: 'u05.reasons.5',
          q: [{ p: t('Keli chiraliniai vaistai parduodami kaip racematas arba kaip vienas enantiomeras.', 'Several chiral drugs are sold either as a racemate or as a single enantiomer.') }],
          steps: [
            {
              prompt: t('Suporuokite vaistą su teiginiu.', 'Match the drug with the statement.'),
              kind: 'match',
              answer: {
                left: [{ text: t('Ibuprofenas', 'Ibuprofen') }, { text: t('Levodopa', 'Levodopa') }, { text: t('Escitalopramas', 'Escitalopram') }, { text: t('Propranololis', 'Propranolol') }],
                right: [
                  { text: t('Parduodamas racematas, nors aktyvus tik $S$; organizme dalis $R$ virsta $S$', 'Sold as a racemate although only $S$ is active; in the body part of $R$ turns into $S$') },
                  { text: t('Naudojamas tik $S$ enantiomeras; $R$ nevirsta aktyviuoju, todėl jis ir racematas toksiški', 'Only the $S$ enantiomer is used; $R$ is not converted, so it and the racemate are toxic') },
                  { text: t('Naudojamas tik $S$ enantiomeras, maždaug 100 kartų aktyvesnis už $R$', 'Only the $S$ enantiomer is used, about 100 times more active than $R$') },
                  { text: t('Parduodamas racematas, nors aktyvus tik $S$; įtariama, kad $R$ gali būti toksiškas', 'Sold as a racemate although only $S$ is active; $R$ is suspected to be toxic') }
                ],
                pairs: [0, 1, 2, 3]
              },
              hint: t('Pirmiausia atmeskite vaistus, kurie parduodami grynu vienu enantiomeru, tada palyginkite, kas pasakyta apie $R$ formą.', 'First set aside the drugs sold as one pure enantiomer, then compare what is said about the $R$ form.'),
              solution: t('Ibuprofenas (priešuždegiminis) ir propranololis (širdies vaistas) parduodami kaip racematas; levodopa (Parkinsono liga) ir escitalopramas (depresija) – kaip gryni $S$ enantiomerai.', 'Ibuprofen (anti-inflammatory) and propranolol (heart drug) are sold as racemates; levodopa (Parkinson’s disease) and escitalopram (depression) as pure $S$ enantiomers.')
            }
          ],
          why: t('Kiekvieno vaisto enantiomerų biologinis poveikis skirtingas, nes receptoriai ir fermentai chiraliniai. Kartais antrasis enantiomeras tik neaktyvus, o kartais toksiškas, todėl vaistai vis dažniau gaminami kaip vienas enantiomeras.', 'The enantiomers of a drug differ in biological effect because receptors and enzymes are chiral. Sometimes the other enantiomer is merely inactive and sometimes toxic, so drugs are increasingly made as single enantiomers.'),
          src: 'L5 p27'
        },
        {
          id: 'u05.reasons.6',
          q: [
            { p: t('Fermentas $D$-aminorūgšties oksidazė oksiduoja tik $R$ enantiomerą. Jis veikia $R$ ir $S$ alanino mišinį.', 'The enzyme $D$-amino acid oxidase oxidises only the $R$ enantiomer. It acts on a mixture of $R$ and $S$ alanine.') },
            { scheme: { items: [{ smi: 'C[C@@H](N)C(=O)O' }, { plus: true }, { smi: 'C[C@H](N)C(=O)O' }, { arrow: '→', above: t('oksidazė', 'oxidase') }] } }
          ],
          steps: [
            {
              prompt: t('Kuris enantiomeras lieka nesureagavęs?', 'Which enantiomer is left unreacted?'),
              kind: 'choice',
              options: [{ text: t('$S$-alaninas', '$S$-alanine') }, { text: t('$R$-alaninas', '$R$-alanine') }, { text: t('Abu sureaguoja', 'Both react') }, { text: t('Abu lieka nepakitę', 'Both stay unchanged') }],
              answer: 0,
              hint: t('Fermentas atpažįsta tik vieną enantiomerą.', 'The enzyme recognises only one enantiomer.'),
              solution: t('$R$-alaninas oksiduojamas iki imino, o $S$ lieka nepakitęs.', '$R$-alanine is oxidised to the imine while $S$ stays unchanged.')
            },
            {
              prompt: t('Ką ši reakcija rodo apie fermentus?', 'What does this reaction show about enzymes?'),
              kind: 'choice',
              options: [
                { text: t('Fermentai yra chiraliniai ir atskiria enantiomerus, todėl reakcija leidžia juos atskirti.', 'Enzymes are chiral and distinguish enantiomers, so the reaction allows them to be separated.') },
                { text: t('Fermentai veikia visus stereoizomerus vienodai.', 'Enzymes act on all stereoisomers alike.') },
                { text: t('Fermentai keičia molekulės konfigūraciją.', 'Enzymes change the configuration of the molecule.') },
                { text: t('Fermentai veikia tik achiralines molekules.', 'Enzymes act only on achiral molecules.') }
              ],
              answer: 0,
              hint: t('Ar fermento aktyvusis centras simetriškas?', 'Is the active site of the enzyme symmetrical?'),
              solution: t('Fermentas yra chiralinis baltymas, todėl veikia tik vieną enantiomerą. Po reakcijos produktas ir nesureagavęs $S$ enantiomeras yra skirtingos medžiagos, todėl juos galima atskirti.', 'An enzyme is a chiral protein and acts on one enantiomer only. After the reaction the product and the unreacted $S$ enantiomer are different substances and can be separated.')
            }
          ],
          why: t('Chiralinis katalizatorius (pavyzdžiui, fermentas) paspartina tik vieno enantiomero virsmą. Tai gamtos ir laboratorijų būdas atskirti enantiomerus.', 'A chiral catalyst such as an enzyme can speed up the reaction of one enantiomer only. This is how nature, and laboratories, can tell enantiomers apart.'),
          src: 'L5 p31',
          claims: [{ cip: ['C[C@@H](N)C(=O)O', 1, 'R'] }, { cip: ['C[C@H](N)C(=O)O', 1, 'S'] }]
        },
        {
          id: 'u05.reasons.7',
          q: [
            { p: t('Pavaizduotas junginys, turintis dvi $CHBr$ grupes (Fišerio projekcija).', 'A compound with two $CHBr$ groups is shown (a Fischer projection).') },
            { fischer: { rows: [{ left: 'Br', right: 'H' }, { left: 'H', right: 'Br' }], top: 'CHO', bottom: 'CH2OH' } }
          ],
          steps: [
            { prompt: t('Kiek chiralinių centrų yra molekulėje?', 'How many chiral centres does the molecule have?'), kind: 'number', answer: { value: 2, tol: 0 },
              hint: t('Kiekviena horizontali linija žymi chiralinį atomą su keturiais pakaitais.', 'Each horizontal line marks a chiral atom with four substituents.'),
              solution: t('Du: kiekvienas turi $H$, $Br$ ir dvi skirtingas grandinės dalis.', 'Two: each carries $H$, $Br$ and two different parts of the chain.') },
            { prompt: t('Kiek stereoizomerų gali turėti šis junginys?', 'How many stereoisomers can this compound have?'), kind: 'number', answer: { value: 4, tol: 0 },
              hint: t('Pagalvokite, ar abu centrai pakeisti vienodai.', 'Think about whether the two centres carry the same groups.'),
              solution: t('Vienas centras yra prie $CHO$, kitas prie $CH2OH$, todėl pusės nevienodos, mezoformos nėra: $2^2^$ = 4.', 'One centre is next to $CHO$, the other next to $CH2OH$, so the halves are not alike and no meso form exists: $2^2^$ = 4.') },
            { prompt: t('Ar visi šie stereoizomerai optiškai aktyvūs?', 'Are all these stereoisomers optically active?'), kind: 'choice',
              options: [{ text: t('Taip, visi chiraliniai', 'Yes, all are chiral') }, { text: t('Ne, vienas yra mezoforma', 'No, one is a meso form') }, { text: t('Ne, du yra racematai', 'No, two are racemates') }, { text: t('Nė vienas nėra aktyvus', 'None of them is active') }], answer: 0,
              hint: t('Mezoforma galima tik tada, kai molekulės pusės vienodos.', 'A meso form is possible only if the halves of the molecule are the same.'),
              solution: t('Nė vienas stereoizomeras neturi simetrijos plokštumos, todėl visi keturi chiraliniai ir optiškai aktyvūs (dvi enantiomerų poros).', 'No stereoisomer has a plane of symmetry, so all four are chiral and optically active (two pairs of enantiomers).') }
          ],
          why: t('Mezoformos atsiranda tik tada, kai molekulės pusės vienodos. Kai du centrai skirtingi, $2^n^$ formulė galioja ir visi stereoizomerai chiraliniai.', 'Meso forms occur only when the two halves of the molecule are alike. When the two centres are different the $2^n^$ rule holds and all stereoisomers are chiral.'),
          src: 'L5 p69',
          claims: [{ centres: ['O=CC(Br)C(Br)CO', [2, 4]] }, { stereoisomers: ['O=CC(Br)C(Br)CO', 4] }]
        },
        {
          id: 'u05.reasons.8',
          q: [
            { p: t('Paskaitoje stereogeniniu vadinamas atomas, kuriame dviejų pakaitų sukeitimas duoda kitą stereoizomerą.', 'In the lecture a stereogenic centre is an atom at which swapping two substituents gives another stereoisomer.') },
            { mol: { smi: 'C/C=C/[C@H](C)Br', opts: { numbers: 'all' } } }
          ],
          steps: [
            {
              prompt: t('Bakstelėkite visus stereogeninius atomus.', 'Tap every stereogenic atom.'),
              kind: 'atoms', mol: { smi: 'C/C=C/[C@H](C)Br', opts: { numbers: 'all' } }, answer: [1, 2, 3],
              hint: t('Dvigubojo ryšio atomai taip pat gali būti stereogeniniai: sukeitus jų pakaitus gaunamas $Z$ arba $E$ izomeras.', 'The double-bond carbons can be stereogenic too: swapping their substituents gives the $Z$ or $E$ isomer.'),
              solution: t('Stereogeniniai yra abu dvigubojo ryšio atomai (sukeitus pakaitus keičiasi $Z/E$) ir atomas prie $Br$ (sukeitus gaunamas enantiomeras).', 'Both double-bond carbons are stereogenic (swapping substituents changes $Z/E$) and so is the carbon bearing $Br$ (swapping gives the enantiomer).')
            },
            {
              prompt: t('Kuris iš jų yra chiralinis centras (keturi skirtingi pakaitai)?', 'Which of them is a chiral centre (four different substituents)?'),
              kind: 'atoms', mol: { smi: 'C/C=C/[C@H](C)Br', opts: { numbers: 'all' } }, from: 'stereocentres',
              hint: t('Chiralinis centras turi būti $sp3$ anglis su keturiomis skirtingomis grupėmis.', 'A chiral centre must be an $sp3$ carbon with four different groups.'),
              solution: t('Tik atomas prie $Br$ yra chiralinis centras ($H$, $Br$, $CH3$, propenilas). Dvigubojo ryšio atomai turi tik tris pakaitus ir sukuria $π$-diastereomeriją.', 'Only the carbon bearing $Br$ is a chiral centre ($H$, $Br$, $CH3$, propenyl). The double-bond carbons have only three substituents and give $π$-diastereomerism.')
            }
          ],
          why: t('Stereogeninis centras yra platesnė sąvoka nei chiralinis centras: į ją patenka ir $π$-diastereomerų, ir enantiomerų atsiradimo vietos.', 'A stereogenic centre is a wider term than a chiral centre: it covers both the places where $π$-diastereomers and where enantiomers arise.'),
          src: 'L5 p42',
          claims: [{ centres: ['C/C=C/[C@H](C)Br', [3]] }]
        },
        {
          id: 'u05.reasons.9',
          q: [
            { p: t('Meso-vyno rūgštis ir raceminė vyno rūgštis abi neturi sukimo kampo ($[α]$ = 0°). Lydymosi temperatūros yra 147 °C ir 206 °C.', 'meso-Tartaric acid and racemic tartaric acid both show no rotation ($[α]$ = 0°). Their melting points are 147 °C and 206 °C.') },
            { mol: [{ smi: 'OC(=O)[C@H](O)[C@H](O)C(=O)O' }, { smi: 'OC(=O)[C@H](O)[C@@H](O)C(=O)O' }, { smi: 'OC(=O)[C@@H](O)[C@H](O)C(=O)O' }] }
          ],
          steps: [
            {
              prompt: t('Kuo skiriasi šie du neaktyvūs variantai?', 'What distinguishes these two inactive cases?'),
              kind: 'choice',
              options: [
                { text: t('Mezoforma yra viena achiralinė medžiaga (vidinė kompensacija), racematas – dviejų chiralinių enantiomerų mišinys (išorinė kompensacija).', 'The meso form is one achiral substance (internal compensation), a racemate is a mixture of two chiral enantiomers (external compensation).') },
                { text: t('Racematas yra viena medžiaga, mezoforma – mišinys.', 'A racemate is one substance, the meso form is a mixture.') },
                { text: t('Abu yra tas pats junginys.', 'Both are the same compound.') },
                { text: t('Mezoformos molekulės chiralinės, racemato – achiralinės.', 'Meso molecules are chiral, racemate molecules achiral.') }
              ],
              answer: 0,
              hint: t('Mezoforma turi simetrijos plokštumą pačioje molekulėje. Ar racemato molekulės ją turi?', 'The meso form has a plane of symmetry within the molecule itself. Do the molecules of a racemate have one?'),
              solution: t('Mezoforma neaktyvi, nes jos molekulė pati achiralinė. Racemate kiekviena molekulė chiralinė, o neaktyvumas atsiranda dėl dviejų enantiomerų kompensacijos.', 'The meso form is inactive because its molecule is itself achiral. In a racemate each molecule is chiral and the inactivity comes from the compensation of two enantiomers.')
            },
            {
              prompt: t('Kodėl jų lydymosi temperatūros skiriasi?', 'Why do their melting points differ?'),
              kind: 'choice',
              options: [
                { text: t('Mezoforma yra diastereomeras (kita medžiaga), o diastereomerų fizikinės savybės skiriasi.', 'The meso form is a diastereomer (a different substance), and diastereomers differ in physical properties.') },
                { text: t('Enantiomerų lydymosi temperatūros skiriasi.', 'The melting points of enantiomers differ.') },
                { text: t('Mezoforma turi daugiau atomų.', 'The meso form has more atoms.') },
                { text: t('Racematas turi kitą molekulinę formulę.', 'The racemate has a different molecular formula.') }
              ],
              answer: 0,
              hint: t('Kokį santykį turi mezoforma su kiekvienu enantiomeru?', 'What relationship does the meso form have to each enantiomer?'),
              solution: t('Mezoforma ir bet kuris enantiomeras yra $σ$-diastereomerai, todėl jų savybės skiriasi. Enantiomerai tarpusavyje turi vienodas lydymosi temperatūras (171 °C), o racematas yra jų mišinys su savo kristalų struktūra.', 'The meso form and either enantiomer are $σ$-diastereomers, so their properties differ. The enantiomers share the same melting point (171 °C), and the racemate is their mixture with its own crystal structure.')
            }
          ],
          why: t('Optinis neaktyvumas gali kilti iš dviejų priežasčių: molekulės simetrijos (mezoforma) arba dviejų enantiomerų kompensacijos (racematas). Tai skirtingos medžiagos.', 'Optical inactivity can have two origins: the symmetry of the molecule (meso form) or the compensation of two enantiomers (racemate). They are different substances.'),
          src: 'L5 p35',
          claims: [{ stereoisomers: ['OC(=O)C(O)C(O)C(=O)O', 3] }]
        },
        {
          id: 'u05.reasons.10',
          q: [
            { p: t('Pavaizduota 2,3-dibrombutano molekulė Fišerio projekcija.', 'A molecule of 2,3-dibromobutane is drawn as a Fischer projection.') },
            { fischer: { rows: [{ left: 'H', right: 'Br' }, { left: 'H', right: 'Br' }], top: 'CH3', bottom: 'CH3' } }
          ],
          steps: [
            {
              prompt: t('Ar ši molekulė chiralinė?', 'Is this molecule chiral?'),
              kind: 'choice',
              options: [
                { text: t('Ne: ji turi simetrijos plokštumą (mezoforma), nors turi du chiralinius centrus.', 'No: it has a plane of symmetry (a meso form) although it has two chiral centres.') },
                { text: t('Taip, nes turi du chiralinius centrus.', 'Yes, because it has two chiral centres.') },
                { text: t('Taip, nes abu $Br$ yra dešinėje.', 'Yes, because both $Br$ are on the right.') },
                { text: t('Negalima nustatyti iš Fišerio projekcijos.', 'It cannot be decided from a Fischer projection.') }
              ],
              answer: 0,
              hint: t('Palyginkite viršutinę ir apatinę pusę: ar jos viena kitos atspindys?', 'Compare the upper and the lower half: are they mirror images of each other?'),
              solution: t('Abu $Br$ yra tame pačioje pusėje, todėl horizontali plokštuma tarp $C2$ ir $C3$ yra simetrijos plokštuma: viena pusė yra kitos atspindys. Molekulė achiralinė – tai mezoforma.', 'Both $Br$ are on the same side, so the horizontal plane between $C2$ and $C3$ is a plane of symmetry: one half is the mirror image of the other. The molecule is achiral: a meso form.')
            },
            {
              prompt: t('Kiek stereoizomerų turi 2,3-dibrombutanas?', 'How many stereoisomers does 2,3-dibromobutane have?'),
              kind: 'number', answer: { value: 3, tol: 0 },
              hint: t('Dvi vienodai pakeistos chiralinių centrų pusės sumažina skaičių, palyginti su $2^n$.', 'Two identically substituted halves reduce the number compared with $2^n$.'),
              solution: t('Yra pora enantiomerų ($R,R$ ir $S,S$) ir viena mezoforma ($R,S$): iš viso 3 stereoizomerai, o ne $2^2 = 4$.', 'There is a pair of enantiomers ($R,R$ and $S,S$) and one meso form ($R,S$): 3 stereoisomers in all, not $2^2 = 4$.')
            }
          ],
          why: t('Chiralumą lemia visos molekulės simetrija, o ne chiralinių centrų skaičius. Fišerio projekcijoje užstotoje konformacijoje simetrijos plokštumą matome iš karto: jei viršutinė pusė atspindi apatinę, molekulė mezo.', 'Chirality depends on the symmetry of the whole molecule, not on the number of chiral centres. In the eclipsed Fischer projection a plane of symmetry is seen at once: if the upper half mirrors the lower one the molecule is meso.'),
          src: 'L5 p69',
          claims: [{ stereoisomers: ['CC(Br)C(Br)C', 3] }, { chiral: ['C[C@H](Br)[C@H](Br)C', false] }]
        }
      ]
    },

    /* ---------------------------------------------------------------- conformations and strain ---- */
    {
      id: 'u05.confreason',
      title: t('Konformacijos ir įtempis: priežastys', 'Conformations and strain: reasons'),
      mirrors: ['S3.8', 'S3.9', 'S3.19', 'S3.20', 'S3.21'],
      bank: [
        {
          id: 'u05.confreason.1',
          q: [{ p: t('Etano molekulė žiūrint išilgai $C–C$ ryšio:', 'The ethane molecule viewed along the $C–C$ bond:') }, { newman: { front: ['H', 'H', 'H'], back: ['H', 'H', 'H'], angle: 0 } }],
          steps: [
            {
              prompt: t('Kuri tai konformacija?', 'Which conformation is this?'), kind: 'choice',
              options: [{ text: t('Užstotoji (didžiausia energija)', 'Eclipsed (highest energy)') }, { text: t('Sustabdytoji (mažiausia energija)', 'Staggered (lowest energy)') }, { text: t('Goš', 'Gauche') }, { text: t('Anti', 'Anti') }],
              answer: 0,
              hint: t('Ar priekinio ir užpakalinio atomų ryšiai yra vienas prieš kitą?', 'Are the bonds of the front and back atoms right in front of each other?'),
              solution: t('Užpakaliniai ryšiai nukreipti tiesiai už priekinių, todėl konformacija užstotoji.', 'The back bonds point directly behind the front ones, so the conformation is eclipsed.')
            },
            {
              prompt: t('Kas lemia etano sukimosi barjerą?', 'What causes the rotational barrier of ethane?'), kind: 'choice',
              options: [
                { text: t('Suartėjusių $C–H$ ryšių elektronų atostūmis užstotoje konformacijoje (torsinė įtampa).', 'Repulsion of the $C–H$ bonding electrons when the bonds come close in the eclipsed conformation (torsional strain).') },
                { text: t('Metilo grupių van der Valso atostūmis.', 'Van der Waals repulsion of methyl groups.') },
                { text: t('Kampinė (Bajerio) įtampa.', 'Angle (Baeyer) strain.') },
                { text: t('Vandeniliniai ryšiai tarp molekulių.', 'Hydrogen bonds between molecules.') }
              ],
              answer: 0,
              hint: t('Etane yra tik $C$ ir $H$ atomai, o valentiniai kampai ne deformuoti.', 'Ethane has only $C$ and $H$ atoms and its bond angles are not distorted.'),
              solution: t('Etane nėra didelių grupių ir kampai normalūs; barjerą sukuria elektronų atostūmis tarp $C–H$ ryšių, kai jie suartėja.', 'Ethane has no large groups and the angles are normal; the barrier comes from the electron repulsion between $C–H$ bonds as they come close.')
            },
            {
              prompt: t('Koks etano sukimosi barjeras, kJ/mol?', 'What is the rotational barrier of ethane, in kJ/mol?'), kind: 'number', answer: { value: 12, tol: 0.5 },
              hint: t('Skaičius mažesnis už 20 kJ/mol.', 'The number is below 20 kJ/mol.'),
              solution: t('Etano barjeras yra 12 kJ/mol: toks mažas, kad kambario temperatūroje molekulė laisvai sukasi.', 'The barrier of ethane is 12 kJ/mol: so low that at room temperature the molecule rotates freely.')
            }
          ],
          why: t('Konformacijų energijų skirtumas sukuria sukimosi barjerą. Etane jis atsiranda tik dėl torsinės įtampos, todėl yra mažas, ir etanas yra konformacijų pusiausvyrinis mišinys.', 'The energy difference between conformations creates a rotational barrier. In ethane it comes from torsional strain alone and is therefore small, so ethane is an equilibrium mixture of conformations.'),
          src: 'L5 p47'
        },
        {
          id: 'u05.confreason.2',
          q: [
            { p: t('Butano $C2–C3$ ryšio dvi sustabdytosios konformacijos:', 'Two staggered conformations about the $C2–C3$ bond of butane:') },
            { newman: { front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 180 }, caption: t('Anti', 'Anti') },
            { newman: { front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 60 }, caption: t('Goš', 'Gauche') }
          ],
          steps: [
            {
              prompt: t('Kuri konformacija turi mažesnę energiją?', 'Which conformation has the lower energy?'), kind: 'choice',
              options: [{ text: t('Anti', 'Anti') }, { text: t('Goš', 'Gauche') }, { text: t('Jų energijos vienodos', 'Their energies are equal') }],
              answer: 0, hint: t('Kur didelės grupės labiau nutolusios?', 'Where are the large groups farther apart?'),
              solution: t('Anti konformacijoje metilo grupės 180° kampu, kuo toliau viena nuo kitos.', 'In the anti conformation the methyl groups are at 180°, as far apart as possible.')
            },
            {
              prompt: t('Kiek kJ/mol goš konformacija energingesnė už anti?', 'By how many kJ/mol is the gauche conformation above the anti one?'), kind: 'number', answer: { value: 4, tol: 1 },
              hint: t('Tai nedidelis skirtumas, žymiai mažesnis už užstotųjų konformacijų barjerą (16–19 kJ/mol).', 'It is a small difference, much below the barrier of the eclipsed conformations (16–19 kJ/mol).'),
              solution: t('Goš konformacija apie 4 kJ/mol energingesnė už anti.', 'The gauche conformation is about 4 kJ/mol above anti.')
            },
            {
              prompt: t('Kodėl goš konformacija energingesnė, nors ji sustabdytoji?', 'Why is gauche higher in energy although it is staggered?'), kind: 'choice',
              options: [
                { text: t('Abi $CH3$ grupės artimos, todėl veikia van der Valso atostūmis.', 'The two $CH3$ groups are close, so van der Waals repulsion acts.') },
                { text: t('Joje ryšiai užstoti.', 'Its bonds are eclipsed.') },
                { text: t('Joje yra kampinė įtampa.', 'It has angle strain.') },
                { text: t('Joje sutrumpėja $C–C$ ryšys.', 'The $C–C$ bond becomes shorter in it.') }
              ],
              answer: 0, hint: t('Pažiūrėkite į atstumą tarp metilo grupių 60° kampu.', 'Look at the distance between the methyl groups at 60°.'),
              solution: t('Goš yra sustabdytoji, todėl torsinės įtampos nėra; skirtumas atsiranda dėl artimų $CH3$ grupių van der Valso atostūmio.', 'Gauche is staggered, so there is no torsional strain; the difference comes from the van der Waals repulsion of the nearby $CH3$ groups.')
            }
          ],
          why: t('Sustabdytųjų konformacijų energiją lemia ne torsinė įtampa, o didelių grupių atstumas: anti turi mažiausią energiją, o goš – šiek tiek didesnę. Kambario temperatūroje apie 69 % butano molekulių yra anti, 31 % – goš.', 'The energy of staggered conformations is decided not by torsional strain but by the distance between large groups: anti has the lowest energy, gauche a little more. At room temperature about 69 % of butane molecules are anti and 31 % gauche.'),
          src: 'L5 p49'
        },
        {
          id: 'u05.confreason.3',
          q: [
            { p: t('1,2-Etandiolio ($HOCH2CH2OH$) $C1–C2$ ryšio trys Njumeno vaizdai:', 'Three Newman views of the $C1–C2$ bond of 1,2-ethanediol ($HOCH2CH2OH$):') },
            { newman: { front: ['OH', 'H', 'H'], back: ['OH', 'H', 'H'], angle: 180 }, caption: f('A') },
            { newman: { front: ['OH', 'H', 'H'], back: ['OH', 'H', 'H'], angle: 0 }, caption: f('B') },
            { newman: { front: ['OH', 'H', 'H'], back: ['OH', 'H', 'H'], angle: 60 }, caption: f('C') }
          ],
          steps: [
            {
              prompt: t('Kuri konformacija turi didžiausią energiją?', 'Which conformation has the highest energy?'), kind: 'choice',
              options: [{ text: f('A') }, { text: f('B') }, { text: f('C') }], answer: 1,
              hint: t('Ieškokite užstotosios konformacijos, kurioje didelės grupės arčiausiai viena kitos.', 'Look for the eclipsed conformation in which the large groups are closest to each other.'),
              solution: t('B yra užstotoji ir abi hidroksigrupės viena prieš kitą: torsinė įtampa ir atostūmis susideda.', 'B is eclipsed with the two hydroxy groups in front of each other: torsional strain and repulsion add up.')
            },
            {
              prompt: t('Kurios konformacijos yra sustabdytosios?', 'Which conformations are staggered?'), kind: 'multi',
              options: [{ text: f('A') }, { text: f('B') }, { text: f('C') }], answer: [0, 2],
              hint: t('Sustabdytojoje užpakaliniai ryšiai yra tarp priekinių.', 'In a staggered conformation the back bonds lie between the front ones.'),
              solution: t('A (anti, 180°) ir C (goš, 60°) sustabdytosios; B užstotoji (0°).', 'A (anti, 180°) and C (gauche, 60°) are staggered; B is eclipsed (0°).')
            }
          ],
          why: t('Aukščiausios energijos konformacija visada užstotoji, o ypač kai didelės grupės viena prieš kitą. Stabiliausios yra sustabdytosios.', 'The conformation of highest energy is always an eclipsed one, especially with large groups in front of each other. The most stable ones are staggered.'),
          src: 'L5 p50'
        },
        {
          id: 'u05.confreason.4',
          q: [{ p: t('Ciklopropano žiedas yra plokščias, o jo $C–C–C$ kampai yra 60°.', 'The cyclopropane ring is planar and its $C–C–C$ angles are 60°.') }],
          steps: [
            {
              prompt: t('Kiek laipsnių nukrypsta kampas nuo $sp3$ atomo kampo 109,5°?', 'By how many degrees does the angle deviate from the 109.5° of an $sp3$ atom?'), kind: 'number', answer: { value: 49.5, tol: 0.1 },
              hint: t('Atimkite 60° iš tetraedrinio kampo.', 'Subtract 60° from the tetrahedral angle.'),
              solution: t('109,5° − 60° = 49,5°. Tai kampinė (Bajerio) įtemptis.', '109.5° − 60° = 49.5°. This is angle (Baeyer) strain.')
            },
            {
              prompt: t('Kodėl ciklopropanas reakcijose dažniausiai atsiveria?', 'Why does cyclopropane usually open its ring in reactions?'), kind: 'choice',
              options: [
                { text: t('Atsivėrus žiedui panaikinama didelė įtempis, o „bananiniai“ $C–C$ ryšiai silpni.', 'Ring opening relieves the large strain, and the “banana” $C–C$ bonds are weak.') },
                { text: t('Ciklopropanas yra aromatinis.', 'Cyclopropane is aromatic.') },
                { text: t('Jis turi dvigubą ryšį.', 'It has a double bond.') },
                { text: t('Jo $C–H$ ryšiai labai poliniai.', 'Its $C–H$ bonds are very polar.') }
              ],
              answer: 0, hint: t('Ar atviras propanas turėtų tokią įtempį?', 'Would open-chain propane have this strain?'),
              solution: t('Dėl didelės įtempties ir blogai persidengiančių orbitalių ryšiai tarp anglies atomų silpni, o atsivėrus žiedui įtampa išnyksta.', 'Because of the large strain and poorly overlapping orbitals the bonds between carbons are weak, and ring opening removes the strain.')
            }
          ],
          why: t('Mažuose cikluose valentiniai kampai nukrypsta nuo 109,5°, ir tai didina energiją. Ciklopropano nuokrypis (49,5°) didžiausias, todėl jis chemiškai aktyviausias.', 'In small rings the bond angles deviate from 109.5° and this raises the energy. The deviation in cyclopropane (49.5°) is the largest, so it is the most reactive chemically.'),
          src: 'L5 p51'
        },
        {
          id: 'u05.confreason.5',
          q: [{ p: t('Ciklobutano žiedas ne visai plokščias: du anglies atomai pakelti virš kitų dviejų plokštumos arba nuleisti žemiau jos.', 'The cyclobutane ring is not completely planar: two carbons sit above or below the other two.') }],
          steps: [
            {
              prompt: t('Kokį kampo nuokrypį nuo 109,5° duotų plokščias kvadratas (90°)?', 'What angle deviation from 109.5° would a planar square (90°) give?'), kind: 'number', answer: { value: 19.5, tol: 0.1 },
              hint: t('Atimkite 90° iš 109,5°.', 'Subtract 90° from 109.5°.'),
              solution: t('109,5° − 90° = 19,5°.', '109.5° − 90° = 19.5°.')
            },
            {
              prompt: t('Kodėl ciklobutano žiedas šiek tiek „sulenkiamas“?', 'Why is the cyclobutane ring slightly “folded”?'), kind: 'choice',
              options: [
                { text: t('Sulenkus sumažėja užstotų $CH2$ grupių atostūmis, o perėjimo tarp formų barjeras žemas.', 'Folding reduces the repulsion of eclipsed $CH2$ groups, and the barrier between the forms is low.') },
                { text: t('Sulenkus kampai tampa tiksliai 109,5°.', 'On folding the angles become exactly 109.5°.') },
                { text: t('Sulenkus žiedas tampa aromatinis.', 'On folding the ring becomes aromatic.') },
                { text: t('Sulenktas žiedas turi mažiau vandenilių.', 'The folded ring has fewer hydrogens.') }
              ],
              answer: 0, hint: t('Plokščiame ciklobutane visi $H$ užstoti.', 'In planar cyclobutane all the $H$ are eclipsed.'),
              solution: t('Neplokščia forma sumažina užstotas padėtis, nors kampas dar sumažėja iki 88°. Žemas perėjimo barjeras leidžia laikyti žiedą beveik plokščiu.', 'The non-planar form reduces eclipsing, even though the angle falls to 88°. The low barrier allows the ring to be regarded as almost planar.')
            }
          ],
          why: t('Žiedo forma yra kompromisas tarp kampinės ir torsinės įtempties. Ciklobutane ir ciklopentane (voko forma) žiedai šiek tiek išlinksta, kad sumažintų užstotas padėtis.', 'The shape of a ring is a compromise between angle strain and torsional strain. In cyclobutane and cyclopentane (the envelope form) the rings pucker slightly to reduce eclipsing.'),
          src: 'L5 p52–53, Klein'
        },
        {
          id: 'u05.confreason.6',
          q: [{ p: t('Cikloheksanas gali egzistuoti kėdės ir valties konformacijomis.', 'Cyclohexane can exist in a chair and a boat conformation.') }],
          steps: [
            {
              prompt: t('Kuri forma stabilesnė ir kodėl?', 'Which form is more stable, and why?'), kind: 'choice',
              options: [
                { text: t('Kėdė: joje nėra užstotų $H$, o kampai 109,5°.', 'The chair: it has no eclipsed $H$ and the angles are 109.5°.') },
                { text: t('Valtis: joje $H$ „vėliavos stulpai“ yra toliausiai vienas nuo kito.', 'The boat: its “flagpole” $H$ are farthest apart.') },
                { text: t('Jų stabilumas vienodas.', 'Their stability is equal.') },
                { text: t('Valtis, nes ji lanksčiau išsilenkia.', 'The boat, because it bends more flexibly.') }
              ],
              answer: 0, hint: t('Palyginkite, kiek užstotų $C–H$ ryšių yra kiekvienoje formoje.', 'Compare how many eclipsed $C–H$ bonds each form has.'),
              solution: t('Valtyje $H$ prie $C2$–$C3$ ir $C5$–$C6$ užstoti, o dvi „vėliavos stulpų“ grupės arti viena kitos. Kėdėje užstotų padėčių nėra.', 'In the boat the $H$ on $C2$–$C3$ and $C5$–$C6$ are eclipsed and the two “flagpole” hydrogens are close together. The chair has no eclipsed positions.')
            },
            {
              prompt: t('Maždaug kiek kJ/mol valties energija didesnė už kėdės?', 'About how many kJ/mol is the boat above the chair?'), kind: 'number', answer: { value: 30, tol: 5 },
              hint: t('Skaičius yra kelios dešimtys kJ/mol.', 'The number is a few tens of kJ/mol.'),
              solution: t('Apie 30 kJ/mol (vadovėlyje – 35), todėl kambario temperatūroje 99,99 % molekulių yra kėdės formos.', 'About 30 kJ/mol (35 in the textbook), so at room temperature 99.99 % of the molecules are in the chair form.')
            }
          ],
          why: t('Kėdė stabiliausia, nes joje nėra kampinės įtempties ir nėra užstotų padėčių. Valtis ir kitos tarpinės formos yra tik trumpalaikės ciklo inversijos tarpinės būsenos.', 'The chair is the most stable because it has neither angle strain nor eclipsed positions. The boat and other intermediate forms are only short-lived stages of ring inversion.'),
          src: 'L5 p55–56'
        },
        {
          id: 'u05.confreason.7',
          q: [
            { p: t('Metilcikloheksano kėdės konformacijos (pusiausvyroje viena virsta kita).', 'The chair conformations of methylcyclohexane (one turns into the other in an equilibrium).') },
            { chair: { subs: [{ pos: 1, ax: true, label: 'CH3' }] }, caption: t('Kėdė A', 'Chair A') },
            { chair: { subs: [{ pos: 1, ax: true, label: 'CH3' }], flip: true }, caption: t('Kėdė B', 'Chair B') }
          ],
          steps: [
            {
              prompt: t('Kokioje padėtyje yra metilo grupė kėdėje B?', 'In which position is the methyl group in chair B?'), kind: 'choice',
              options: [{ text: t('Ekvatorinėje', 'Equatorial') }, { text: t('Ašinėje', 'Axial') }], answer: 0,
              hint: t('Ciklo inversijoje ašinės padėtys tampa ekvatorinėmis.', 'In ring inversion axial positions become equatorial.'),
              solution: t('Kėdėje A metilas ašinis (vertikalus ryšys), todėl kėdėje B jis ekvatorinis.', 'In chair A the methyl is axial (a vertical bond), so in chair B it is equatorial.')
            },
            {
              prompt: t('Kiek procentų molekulių pusiausvyroje turi metilą ekvatorinėje padėtyje?', 'What percentage of the molecules have the methyl equatorial at equilibrium?'), kind: 'number', answer: { value: 95, tol: 1 },
              hint: t('Ekvatorinė forma 7,5 kJ/mol stabilesnė: absoliuti dauguma.', 'The equatorial form is 7.5 kJ/mol more stable: the large majority.'),
              solution: t('Apie 95 % (ašinė forma – apie 5 %).', 'About 95 % (the axial form about 5 %).')
            },
            {
              prompt: t('Kodėl ašinis metilas nepalankus?', 'Why is the axial methyl unfavourable?'), kind: 'choice',
              options: [
                { text: t('Ašinis $CH3$ artimai sąveikauja su ašiniais $H$ toje pačioje ciklo pusėje (1,3-diašinė sąveika).', 'An axial $CH3$ interacts closely with the axial $H$ on the same side of the ring (1,3-diaxial interaction).') },
                { text: t('Kėdė A turi kampinę įtemptį.', 'Chair A has angle strain.') },
                { text: t('Ašiniai ryšiai ilgesni.', 'Axial bonds are longer.') },
                { text: t('Metilas yra užstotas su žiedo anglimis.', 'The methyl is eclipsed with ring carbons.') }
              ],
              answer: 0, hint: t('Kas yra arti ašinio pakaito toje pačioje pusėje?', 'What is close to an axial substituent on the same side?'),
              solution: t('Ašinis pakaitas yra arti dviejų kitų ašinių $H$ toje pačioje pusėje (per vieną atomą nuo pakaito), todėl atsiranda atostūmis, kainuojantis apie 7,5 kJ/mol.', 'An axial substituent is close to two other axial $H$ on the same side (one atom away from the substituent carbon on each side), giving a repulsion that costs about 7.5 kJ/mol.')
            }
          ],
          why: t('Ciklo inversija sukeičia ašines ir ekvatorines padėtis. Pusiausvyroje vyrauja forma, kurioje pakaitas ekvatorinis, t. y. nutolęs nuo žiedo.', 'Ring inversion swaps axial and equatorial positions. In a monosubstituted cyclohexane the form with the substituent equatorial (farther from the ring) predominates.'),
          src: 'L5 p59, p62'
        },
        {
          id: 'u05.confreason.8',
          q: [
            { p: t('Dviejų 1,3-dimetilcikloheksano diastereomerų kėdės.', 'Chairs of the two diastereomers of 1,3-dimethylcyclohexane.') },
            { chair: { subs: [{ pos: 2, ax: false, label: 'CH3' }, { pos: 4, ax: false, label: 'CH3' }] }, caption: t('Pirmasis izomeras, kėdė A', 'First isomer, chair A') },
            { chair: { subs: [{ pos: 2, ax: false, label: 'CH3' }, { pos: 4, ax: false, label: 'CH3' }], flip: true }, caption: t('Pirmasis izomeras, kėdė B', 'First isomer, chair B') },
            { chair: { subs: [{ pos: 2, ax: false, label: 'CH3' }, { pos: 4, ax: true, label: 'CH3' }] }, caption: t('Antrasis izomeras, kėdė A', 'Second isomer, chair A') },
            { chair: { subs: [{ pos: 2, ax: false, label: 'CH3' }, { pos: 4, ax: true, label: 'CH3' }], flip: true }, caption: t('Antrasis izomeras, kėdė B', 'Second isomer, chair B') }
          ],
          steps: [
            {
              prompt: t('Kiek metilo grupių ašinėse padėtyse yra stabiliausioje pirmojo izomero kėdėje?', 'How many methyl groups are axial in the most stable chair of the first isomer?'), kind: 'number', answer: { value: 0, tol: 0 },
              hint: t('Palyginkite kėdes A ir B: kur mažiau ašinių grupių?', 'Compare chairs A and B: where are fewer groups axial?'),
              solution: t('Kėdėje A abi grupės ekvatorinės, kėdėje B – abi ašinės; stabilesnė A: nulis ašinių.', 'In chair A both groups are equatorial and in chair B both are axial; A is more stable: zero axial.')
            },
            {
              prompt: t('Kiek ašinių metilo grupių turi bet kuri antrojo izomero kėdė?', 'How many axial methyl groups does either chair of the second isomer have?'), kind: 'number', answer: { value: 1, tol: 0 },
              hint: t('Ciklo inversija sukeičia padėtis, bet viena grupė visada ašinė.', 'Ring inversion swaps the positions, but one group is always axial.'),
              solution: t('Abiejose kėdėse viena grupė ašinė, kita ekvatorinė.', 'In both chairs one group is axial and the other equatorial.')
            },
            {
              prompt: t('Kuris izomeras stabilesnis ir kodėl?', 'Which isomer is more stable, and why?'), kind: 'choice',
              options: [
                { text: t('Pirmasis (cis): jis gali turėti abu pakaitus ekvatorinius, antrasis (trans) visada turi vieną ašinį.', 'The first (cis): it can have both substituents equatorial, whereas the second (trans) always has one axial.') },
                { text: t('Antrasis (trans), nes viena grupė ašinė.', 'The second (trans), because one group is axial.') },
                { text: t('Vienodai stabilūs.', 'Equally stable.') },
                { text: t('Pirmasis (trans), nes grupės toliau viena nuo kitos.', 'The first (trans), because the groups are farther apart.') }
              ],
              answer: 0, hint: t('Kiek ašinių grupių yra geriausioje konformacijoje?', 'How many axial groups are there in the best conformation?'),
              solution: t('cis-1,3-Izomero kėdė su dviem ekvatoriniais metilais neturi 1,3-diašinės sąveikos, todėl cis izomeras stabilesnis už trans.', 'The chair of the cis-1,3 isomer with two equatorial methyls has no 1,3-diaxial interaction, so the cis isomer is more stable than the trans one.')
            }
          ],
          why: t('cis-1,3-dipakeisto cikloheksano viena kėdė turi abu pakaitus ekvatorinius, o trans izomere vienas pakaitas visada ašinis. Dėl to cis izomeras stabilesnis už trans.', 'One chair of a cis-1,3-disubstituted cyclohexane has both substituents equatorial, whereas in the trans isomer one substituent is always axial. The cis isomer is therefore more stable than the trans one.'),
          src: 'L5 p63, S3.19'
        },
        {
          id: 'u05.confreason.9',
          q: [
            { p: t('Mioinozitolis (1,2,3,4,5,6-cikloheksanheksaolis, vitaminas B8) turi šešias $OH$ grupes. Pavaizduotos jo dvi kėdės.', 'myo-Inositol (cyclohexane-1,2,3,4,5,6-hexol, vitamin B8) has six $OH$ groups. Its two chairs are drawn.') },
            { chair: { subs: [1, 2, 3, 4, 5, 6].map(p => ({ pos: p, ax: p === 1, label: 'OH' })) }, caption: t('Kėdė A', 'Chair A') },
            { chair: { subs: [1, 2, 3, 4, 5, 6].map(p => ({ pos: p, ax: p === 1, label: 'OH' })), flip: true }, caption: t('Kėdė B', 'Chair B') }
          ],
          steps: [
            {
              prompt: t('Kuri kėdė stabilesnė?', 'Which chair is more stable?'), kind: 'choice',
              options: [{ text: t('Kėdė A', 'Chair A') }, { text: t('Kėdė B', 'Chair B') }], answer: 0,
              hint: t('Suskaičiuokite ašines $OH$ grupes kiekvienoje kėdėje.', 'Count the axial $OH$ groups in each chair.'),
              solution: t('Kėdėje A ašinė tik viena $OH$, kėdėje B – penkios. Mažiau ašinių pakaitų reiškia mažiau 1,3-diašinių sąveikų.', 'In chair A only one $OH$ is axial, in chair B five. Fewer axial substituents means fewer 1,3-diaxial interactions.')
            },
            {
              prompt: t('Kiek $OH$ grupių ašinėje padėtyje yra stabilesnėje kėdėje?', 'How many $OH$ groups are axial in the more stable chair?'), kind: 'number', answer: { value: 1, tol: 0 },
              hint: t('Žiūrėkite į stabilesnę kėdę ir skaičiuokite vertikalius ryšius.', 'Look at the more stable chair and count the vertical bonds.'),
              solution: t('Viena ašinė ir penkios ekvatorinės $OH$ grupės.', 'One axial and five equatorial $OH$ groups.')
            }
          ],
          why: t('Mioinozitolis gali pasirinkti kėdę, kurioje penkios iš šešių $OH$ grupių ekvatorinės. Gamtinių junginių cikloheksano žiedai dažniausiai yra kėdės formos.', 'myo-Inositol can adopt the chair with five of the six $OH$ groups equatorial. The cyclohexane rings of natural compounds are mostly in the chair form.'),
          src: 'T p51, S3.20'
        },
        {
          id: 'u05.confreason.10',
          q: [
            { p: t('$β$-D-Gliukopiranozės kėdės (šešta viršūnė be užrašo, esanti tarp anglies su $CH2OH$ ir anglies su $OH$, yra ciklo deguonis).', 'The chairs of $β$-D-glucopyranose (the unlabelled sixth vertex, between the carbon with $CH2OH$ and the carbon with $OH$, is the ring oxygen).') },
            { chair: { subs: [{ pos: 6, ax: false, label: 'OH' }, { pos: 1, ax: false, label: 'OH' }, { pos: 2, ax: false, label: 'OH' }, { pos: 3, ax: false, label: 'OH' }, { pos: 4, ax: false, label: 'CH2OH' }] }, caption: t('Kėdė A', 'Chair A') },
            { chair: { subs: [{ pos: 6, ax: false, label: 'OH' }, { pos: 1, ax: false, label: 'OH' }, { pos: 2, ax: false, label: 'OH' }, { pos: 3, ax: false, label: 'OH' }, { pos: 4, ax: false, label: 'CH2OH' }], flip: true }, caption: t('Kėdė B', 'Chair B') }
          ],
          steps: [
            {
              prompt: t('Kiek pakaitų ašinėje padėtyje yra kėdėje A?', 'How many substituents are axial in chair A?'), kind: 'number', answer: { value: 0, tol: 0 },
              hint: t('Skaičiuokite vertikalius ryšius su pakaitais.', 'Count the vertical bonds that carry substituents.'),
              solution: t('Visi penki pakaitai ekvatoriniai.', 'All five substituents are equatorial.')
            },
            {
              prompt: t('Kodėl $β$-gliukozė stabilesnė už manozę (kurioje viena $OH$ ašinė)?', 'Why is $β$-glucose more stable than mannose (in which one $OH$ is axial)?'), kind: 'choice',
              options: [
                { text: t('$β$-Gliukozėje visi pakaitai ekvatoriniai, todėl nėra 1,3-diašinių sąveikų.', 'In $β$-glucose all substituents are equatorial, so there are no 1,3-diaxial interactions.') },
                { text: t('Manozėje yra daugiau atomų.', 'Mannose has more atoms.') },
                { text: t('Manozė yra plokščia.', 'Mannose is planar.') },
                { text: t('$β$-Gliukozė neturi ciklo deguonies.', '$β$-Glucose has no ring oxygen.') }
              ],
              answer: 0, hint: t('Kiek ašinių grupių turi kiekvienas junginys stabiliausioje kėdėje?', 'How many axial groups does each compound have in its most stable chair?'),
              solution: t('Ašinė $OH$ manozėje (prie $C2$) sukuria 1,3-diašinę sąveiką, o $β$-gliukozėje visos grupės ekvatorinės.', 'The axial $OH$ of mannose (on $C2$) creates a 1,3-diaxial interaction, whereas in $β$-glucose all groups are equatorial.')
            }
          ],
          why: t('Heksozės šešianaris žiedas elgiasi kaip cikloheksanas, tik viena viršūnė yra deguonis. Stabiliausią kėdę pasirenkame taip pat: kuo daugiau (didesnių) pakaitų ekvatorinėje padėtyje.', 'The six-membered ring of a hexose behaves like cyclohexane, with one vertex being oxygen. The most stable chair is chosen in the same way: as many (and as large) substituents as possible equatorial.'),
          src: 'L5 p66, S3.21'
        }
      ]
    },

    /* ---------------------------------------------------------------- Z/E in named compounds ---- */
    {
      id: 'u05.ezcase',
      title: t('Z ar E: konkretūs junginiai', 'Z or E: named compounds'),
      mirrors: ['S3.7', 'S3.17'],
      bank: (() => {
        const ZE = [{ text: f('$Z$') }, { text: f('$E$') }];
        const mk = (n, smi, nm, tap, ze, c1, c2, tapSol, why, src) => ({
          id: 'u05.ezcase.' + n,
          q: [{ p: t('Nustatykite dvigubojo ryšio konfigūraciją $Z,E$ sistemoje.', 'Determine the configuration of the double bond in the $Z,E$ system.') }, { mol: nm ? { smi, name: nm, opts: { numbers: 'all' } } : { smi, opts: { numbers: 'all' } } }],
          steps: [
            { prompt: t('Kiekvienam dvigubojo ryšio atomui bakstelėkite vyresniojo pakaito pirmąjį atomą.', 'For each carbon of the double bond tap the first atom of the senior substituent.'), kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: tap,
              hint: t('Vyresniškumą nustatykite kaip $R,S$ sistemoje: pagal atominį skaičių, o jei jie vienodi – pagal toliau prijungtus atomus.', 'Rank as in the $R,S$ system: by atomic number, and if tied by the atoms further out.'),
              solution: tapSol },
            { prompt: t('Kokia konfigūracija?', 'Which configuration?'), kind: 'choice', options: ZE, answer: ze === 'Z' ? 0 : 1,
              hint: t('Ar vyresnieji pakaitai toje pačioje plokštumos pusėje?', 'Are the senior substituents on the same side of the plane?'),
              solution: t('Vyresnieji pakaitai yra ' + (ze === 'Z' ? 'toje pačioje pusėje: $Z$.' : 'priešingose pusėse: $E$.'), 'The senior substituents are on ' + (ze === 'Z' ? 'the same side: $Z$.' : 'opposite sides: $E$.')) }
          ],
          why, src,
          claims: [{ ez: [smi, c1, c2, ze] }]
        });
        return [
          mk(1, 'OC/C=C/C', t('2-buten-1-olis', 'but-2-en-1-ol'), [1, 4], 'E', 2, 3,
            t('Prie vieno atomo $CH2OH$ vyresnė už $H$, prie kito $CH3$ vyresnė už $H$; jos priešingose pusėse.', 'On one carbon $CH2OH$ outranks $H$, on the other $CH3$ outranks $H$; they are on opposite sides.'),
            t('Kai kiekvienas atomas turi po vandenilį, vyresnysis pakaitas yra tiesiog kitas pakaitas, todėl $Z$ sutampa su cis, $E$ su trans.', 'When each carbon carries a hydrogen the senior substituent is simply the other group, so $Z$ coincides with cis and $E$ with trans.'), 'S3.7'),
          mk(2, 'C/C=C(/C)CO', t('2-metil-2-buten-1-olis', '2-methylbut-2-en-1-ol'), [0, 4], 'Z', 1, 2,
            t('Prie 3 atomo: $CH2OH$ vyresnė už $CH3$ (deguonis); prie 2 atomo: $CH3$ vyresnė už $H$.', 'On atom 3: $CH2OH$ outranks $CH3$ (oxygen); on atom 2: $CH3$ outranks $H$.'),
            t('Čia cis,trans sąvokos nebetinka: $CH3$ grupės yra priešingose pusėse, bet vyresnioji prie 3 atomo yra ne metilas, o $CH2OH$, todėl konfigūracija $Z$.', 'Cis and trans no longer fit here: the $CH3$ groups are on opposite sides, but the senior group on atom 3 is $CH2OH$, not methyl, so the configuration is $Z$.'), 'S3.7'),
          mk(3, 'Br/C(Cl)=C/F', t('1-brom-1-chlor-2-fluoretenas', '1-bromo-1-chloro-2-fluoroethene'), [0, 4], 'E', 1, 3,
            t('Prie vieno atomo $Br$ vyresnis už $Cl$; prie kito $F$ vyresnis už $H$.', 'On one carbon $Br$ outranks $Cl$; on the other $F$ outranks $H$.'),
            t('Pakaitų vyresniškumą lemia atominis skaičius: $Br$ > $Cl$, $F$ > $H$.', 'The priorities follow atomic number: $Br$ > $Cl$, $F$ > $H$.'), 'S3.7'),
          mk(4, 'CC/C(C)=C/C(=O)O', t('3-metil-2-penteno rūgštis', '3-methylpent-2-enoic acid'), [1, 5], 'E', 2, 4,
            t('Prie 3 atomo: $CH2CH3$ vyresnė už $CH3$ (antrasis atomas $C,H,H$ prieš $H,H,H$); prie 5 atomo: $COOH$ vyresnė už $H$.', 'On atom 3: $CH2CH3$ outranks $CH3$ (second atoms $C,H,H$ over $H,H,H$); on atom 5: $COOH$ outranks $H$.'),
            t('Vienodus pirmuosius atomus ($C$ ir $C$) reikia skirti pagal toliau prijungtus atomus.', 'Tied first atoms ($C$ and $C$) must be separated by the atoms attached further out.'), 'S3.17'),
          mk(5, 'Cl/C(C)=C/C(=O)O', t('3-chlor-2-buteno rūgštis', '3-chlorobut-2-enoic acid'), [0, 4], 'E', 1, 3,
            t('Prie 2 atomo: $Cl$ vyresnis už $CH3$; prie 4 atomo: $COOH$ vyresnė už $H$.', 'On atom 2: $Cl$ outranks $CH3$; on atom 4: $COOH$ outranks $H$.'),
            t('Halogenas visada vyresnis už anglį; priešingose pusėse esantys vyresnieji pakaitai reiškia $E$.', 'A halogen always outranks carbon; senior substituents on opposite sides mean $E$.'), 'S3.17'),
          mk(6, 'C/C(C(=O)O)=C' + BS + 'C(=O)O', t('2-metil-2-buteno dirūgštis', '2-methylbut-2-enedioic acid'), [2, 6], 'E', 1, 5,
            t('Prie 2 atomo: $COOH$ vyresnė už $CH3$; prie 6 atomo: $COOH$ vyresnė už $H$.', 'On atom 2: $COOH$ outranks $CH3$; on atom 6: $COOH$ outranks $H$.'),
            t('Čia abu vyresnieji pakaitai yra $COOH$ grupės; jų santykinė padėtis lemia $E$ (mezakono rūgštis) arba $Z$ (citrakono rūgštis).', 'Both senior substituents here are $COOH$ groups; their relative position decides $E$ (mesaconic acid) or $Z$ (citraconic acid).'), 'S3.17'),
          mk(7, 'Oc1ccc(/C=C/c2cc(O)cc(O)c2)cc1', null, [4, 7], 'E', 5, 6,
            t('Prie abiejų dvigubojo ryšio atomų yra arilo grupė ir $H$; vyresnė arilo grupė (anglis prieš vandenilį).', 'Each carbon of the double bond carries an aryl group and $H$; the aryl group is senior (carbon over hydrogen).'),
            t('Dviejų arilų priešingos pusės reiškia $E$ (trans): tokią konfigūraciją turi gamtinis resveratrolis.', 'Two aryl groups on opposite sides mean $E$ (trans): natural resveratrol has this configuration.'), 'S3.17'),
          mk(8, 'N#C/C=C' + BS + 'C(=O)O', t('3-cian-2-propeno rūgštis', '3-cyanoprop-2-enoic acid'), [1, 4], 'Z', 2, 3,
            t('Prie 3 atomo: $C≡N$ ($N,N,N$) vyresnė už $H$; prie 4 atomo: $COOH$ vyresnė už $H$.', 'On atom 3: $C≡N$ ($N,N,N$) outranks $H$; on atom 4: $COOH$ outranks $H$.'),
            t('Abu nevandeniliniai pakaitai toje pačioje pusėje: tai cis ir $Z$ izomeras.', 'Both non-hydrogen groups on the same side: the cis and $Z$ isomer.'), 'S3.17'),
          mk(9, 'COC(=O)/C(C(=O)O)=C(/CC)C=C', null, [2, 11], 'Z', 4, 8,
            t('Prie 5 atomo: $CO2CH3$ ir $COOH$ abu $(O,O,O)$, tad lyginama toliau: $O–CH3$ (anglis) vyresnė už $O–H$, todėl vyresnis esteris; prie 9 atomo: vinilas $(C,C,H)$ vyresnis už etilą $(C,H,H)$.', 'On atom 5: $CO2CH3$ and $COOH$ are both $(O,O,O)$, so go further out: $O–CH3$ (carbon) outranks $O–H$, so the ester is senior; on atom 9: vinyl $(C,C,H)$ outranks ethyl $(C,H,H)$.'),
            t('Kai pirmųjų dviejų atomų aibės vienodos, lyginama toliau iki pirmojo skirtumo. Metilesterio ir vinilo grupės yra toje pačioje pusėje, todėl konfigūracija $Z$.', 'When the sets of the first two spheres tie, keep going outward to the first point of difference. The ester and vinyl groups are on the same side, so the configuration is $Z$.'), 'S3.17')
        ];
      })()
    }
  ];

  ORG.unit({
    id: 'u05',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S3.1': ['u05.constit'],
      'S3.2': ['u05.constit'],
      'S3.3': ['u05.centres'],
      'S3.4': ['u05.centres', 'u05.meso'],
      'S3.5': ['u05.rs', 'u05.fischer', 'u05.fmoves', 'u05.dl'],
      'S3.6': ['u05.meso', 'u05.pairs'],
      'S3.7': ['u05.ez', 'u05.ezcase'],
      'S3.8': ['u05.newman', 'u05.confreason'],
      'S3.9': ['u05.chair', 'u05.confreason'],
      'S3.10': ['u05.centres', 'u05.chiral'],
      'S3.11': ['u05.centres'],
      'S3.12': ['u05.centres'],
      'S3.13': ['u05.rs', 'u05.fmoves', 'u05.dl'],
      'S3.14': ['u05.rs', 'u05.dl', 'u05.reasons'],
      'S3.15': ['u05.rs', 'u05.fischer'],
      'S3.16': ['u05.meso', 'u05.chiral'],
      'S3.17': ['u05.ez', 'u05.ezcase'],
      'S3.18': ['u05.newman'],
      'S3.19': ['u05.chair', 'u05.confreason'],
      'S3.20': ['u05.chair', 'u05.confreason'],
      'S3.21': ['u05.chair', 'u05.confreason']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
