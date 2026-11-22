// site/organic/units/u07.js: unit 7, alkenes and electrophilic addition (AE)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // reagent labels: formulas only

  /* ---------- helpers shared by the generators ---------- */

  // Atom token spans of a SMILES string, in atom order: a..b the atom, r the end including ring-closure digits.
  function spans(smi) {
    const out = [];
    let i = 0;
    while (i < smi.length) {
      const c = smi[i];
      if (c === '[') { const j = smi.indexOf(']', i); out.push({ a: i, b: j + 1, r: j + 1 }); i = j + 1; }
      else if ((c === 'C' && smi[i + 1] === 'l') || (c === 'B' && smi[i + 1] === 'r')) { out.push({ a: i, b: i + 2, r: i + 2 }); i += 2; }
      else if (/[BCNOPSFIcnops]/.test(c)) { out.push({ a: i, b: i + 1, r: i + 1 }); i++; }
      else if (c === '%') { if (out.length) out[out.length - 1].r = i + 3; i += 3; }
      else if (/[0-9]/.test(c)) { if (out.length) out[out.length - 1].r = i + 1; i++; }
      else i++;
    }
    return out;
  }
  const hTok = (n) => (n === 0 ? '' : n === 1 ? 'H' : 'H' + n);

  // the C=C of an alkene: {a, b} (carbon atoms), or null
  function dbl(chem, smi) {
    const m = chem.parse(smi);
    const b = m.bonds.find(x => x.order === 2 && m.atoms[x.a].el === 'C' && m.atoms[x.b].el === 'C');
    return b ? { m, a: b.a, b: b.b } : null;
  }
  const cN = (m, i) => m.nbr[i].filter(j => m.atoms[j].el === 'C').length;

  // Markovnikov sides of an alkene: hC gets H+, xC becomes the cation (more carbon neighbours); null if alike
  function sides(chem, smi) {
    const d = dbl(chem, smi);
    if (!d || cN(d.m, d.a) === cN(d.m, d.b)) return null;
    const [hC, xC] = cN(d.m, d.a) < cN(d.m, d.b) ? [d.a, d.b] : [d.b, d.a];
    return { hC, xC, cls: cN(d.m, xC) };
  }

  // the carbocation made when H+ adds to hC: same atom order as the alkene SMILES, so atom numbers carry over
  function cationSmi(chem, smi, hC, xC) {
    const m = chem.parse(smi);
    const sp = spans(smi);
    const later = Math.max(hC, xC);
    const eq = sp[later].a - 1;
    if (smi[eq] !== '=') return null;
    const edits = [
      { from: sp[hC].a, to: sp[hC].b, text: '[C' + hTok(m.atoms[hC].h + 1) + ']' },
      { from: sp[xC].a, to: sp[xC].b, text: '[C' + hTok(m.atoms[xC].h) + '+]' },
      { from: eq, to: eq + 1, text: '' }
    ].sort((p, q) => q.from - p.from);
    let s = smi;
    edits.forEach(e => { s = s.slice(0, e.from) + e.text + s.slice(e.to); });
    return s;
  }

  // the adduct H-xC... : group grp (Br, Cl, I, O) on xC; H on hC comes from the implicit hydrogens
  function adduct(smi, hC, xC, grp) {
    const sp = spans(smi);
    const later = Math.max(hC, xC);
    const eq = sp[later].a - 1;
    if (smi[eq] !== '=') return null;
    const ins = sp[xC].r;
    let s = smi.slice(0, ins) + '(' + grp + ')' + smi.slice(ins);
    const pos = eq + (eq >= ins ? grp.length + 2 : 0);
    return s.slice(0, pos) + s.slice(pos + 1);
  }

  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });

  // an unsymmetrical alkene with one clear main product that the engine and the hand-built adduct agree on
  function pickUnsym(ctx, pool, rule, ropts, noRearr) {
    const { chem, react } = ctx;
    for (let k = 0; k < 120; k++) {
      const smi = ctx.pick(pool);
      if (noRearr && react.wouldRearrange(smi)) continue;
      const d = sides(chem, smi);
      if (!d) continue;
      const res = react.run(rule, [smi], ropts);
      const majors = res.products.filter(p => p.major);
      if (majors.length !== 1) continue;
      const grp = ropts && ropts.X ? ropts.X : 'O';
      const mine = adduct(smi, d.hC, d.xC, grp);
      if (!mine || !chem.same(mine, majors[0].smi, { stereo: false })) continue;
      return Object.assign({ smi, major: majors[0].smi, minor: res.products.filter(p => !p.major).map(p => p.smi) }, d);
    }
    throw new Error('u07: no usable alkene for ' + rule);
  }
  // a symmetrical alkene: one product only
  function pickSym(ctx, pool, rule, ropts) {
    const { chem, react } = ctx;
    for (let k = 0; k < 120; k++) {
      const smi = ctx.pick(pool);
      const res = react.run(rule, [smi], ropts);
      if (res.products.length !== 1 || !res.products[0].major) continue;
      return { smi, major: res.products[0].smi, minor: [] };
    }
    throw new Error('u07: no usable symmetrical alkene for ' + rule);
  }

  // options with the right one first; duplicates (by structure) are dropped; at most n
  function optionList(ctx, right, extras, n) {
    const seen = new Set([canon(ctx, right)]);
    const out = [{ mol: { smi: right } }];
    extras.forEach(s => {
      if (!s || out.length >= n) return;
      const k = canon(ctx, s);
      if (!seen.has(k)) { seen.add(k); out.push({ mol: { smi: s } }); }
    });
    return out;
  }
  const first = (res) => { const p = res.products.find(x => x.major); return p ? p.smi : null; };

  // products of KMnO4 cleavage: structures (CO2 included, listed once)
  function harshProducts(ctx, smi) {
    const res = ctx.react.run('ox.kmno4.harsh', [smi], {});
    const seen = new Set();
    const out = [];
    res.products.forEach(p => {
      const s = p.by ? 'O=C=O' : p.smi;
      const k = canon(ctx, s);
      if (!seen.has(k)) { seen.add(k); out.push(s); }
    });
    return out;
  }
  const setOption = (prods) => (prods.length === 1
    ? { mol: { smi: prods[0] } }
    : { scheme: { items: prods.reduce((a, s, i) => a.concat(i ? [{ plus: true }] : [], [{ smi: s }]), []) } });

  const LTCLS = ['pirminis', 'antrinis', 'tretinis'];
  const ENCLS = ['primary', 'secondary', 'tertiary'];

  // pools of alkenes (all stay within the namer's scope and avoid ring-closure double bonds)
  const ALK_U = ['CC=C', 'CC(C)=C', 'CCC=C', 'CCCC=C', 'CC(C)=CC', 'CCC(C)=C', 'CCC(C)=CC', 'CC(C)=CCC', 'CCC(C)=CCC',
    'CCCC(C)=C', 'CC(C)CC=C', 'CC1=CCCCC1', 'CC1=CCCC1', 'C=C1CCCCC1', 'C=C1CCCC1', 'CCCC(C)=CC', 'CCC(CC)=CC', 'CCCCC=C',
    'CC(C)=CCCC', 'CC(C)(C)C=C', 'CCCCC(C)=C', 'CCCC(CC)=C', 'CC(C)CCC=C', 'CCC(C)CC=C', 'CCCCC(C)=CC'];
  const ALK_S = ['C1=CCCCCC1', 'CCCC=CCCC', 'C1=CCCCC1', 'C1=CCCC1', 'CC=CC', 'CCC=CCC', 'CC(C)=C(C)C', 'CCCC=CCC'];
  const ALK_T = ['CC=CCC', 'CC=CCCC'];             // both ends alike in substitution: two comparable products
  const ALK_ALL = ALK_U.concat(ALK_S, ALK_T);

  const NOTES = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'structure',
      title: t('Alkenų sandara ir pavadinimai', 'Structure and names of alkenes'),
      blocks: [
        { h: t('Kas yra alkenas?', 'What is an alkene?') },
        {
          p: t('Alkenai yra angliavandeniliai, kurių molekulėje yra dvigubas anglies–anglies ryšys. Du jo atomai yra sp² hibridizuoti ir kartu su pakaitais guli vienoje plokštumoje, ryšių kampai apie 120°. Dvigubą ryšį sudaro stipresnis σ ryšys ir silpnesnis π ryšys, kurio elektronų debesis yra virš ir po molekulės plokštuma. Vieną dvigubą ryšį turintys aciklai alkenai atitinka formulę $CnH2n$.',
            'Alkenes are hydrocarbons that contain a carbon–carbon double bond. Its two atoms are sp² hybridised and lie in one plane together with their substituents, with bond angles near 120°. The double bond consists of a stronger σ bond and a weaker π bond whose electron cloud sits above and below the molecular plane. An acyclic alkene with one double bond fits the formula $CnH2n$.'),
          src: 'L7 p4'
        },
        { mol: [{ smi: 'C=C', name: t('etenas', 'ethene') }, { smi: 'CC=C', name: t('propenas', 'propene') }, { smi: 'C1=CCCCC1', name: t('cikloheksenas', 'cyclohexene') }], src: 'L7 p2' },
        {
          p: t('Būtent π ryšys lemia alkenų reakcijas: jo elektronai laikomi silpniau nei σ ryšio, todėl alkenas lengvai jungia reagentus. Mažiau patvarus π ryšys virsta dviem patvaresniais σ ryšiais.',
            'It is the π bond that decides how alkenes react: its electrons are held more loosely than those of a σ bond, so an alkene readily adds reagents. The weaker π bond is traded for two stronger σ bonds.'),
          src: 'L7 p4'
        },
        {
          rule: t('Pavadinimas: pagrindinė grandinė turi apimti dvigubą ryšį. Ji numeruojama nuo to galo, kuris arčiau C=C, o prieš pavadinimą rašomas pirmojo dvigubo ryšio atomo numeris; galūnė yra -enas.',
            'Name: the main chain must contain the double bond. Number it from the end nearer to the C=C, put the number of the first double-bond carbon before the name, and end the name in -ene.'),
          src: 'L7 p2'
        },
        { mol: [{ smi: 'CCC=C', name: t('1-butenas', '1-butene') }, { smi: 'CC=CC', name: t('2-butenas', '2-butene') }, { smi: 'CC=CCCC', name: t('2-heksenas', '2-hexene') }], src: 'L7 p2' },
        {
          pitfall: t('Numeruojama nuo galo, arčiau kurio yra C=C, net jei pakaitas dėl to gauna didesnį numerį: $CC(C)C=CC$ yra 4-metil-2-pentenas, o ne 2-metil-3-pentenas.',
            'Number from the end nearer to the C=C even if a substituent then gets a larger number: $CC(C)C=CC$ is 4-methyl-2-pentene, not 2-methyl-3-pentene.')
        },
        { mol: { smi: 'CC(C)C=CC', name: t('4-metil-2-pentenas', '4-methyl-2-pentene') } },
        { h: t('Cis ir trans izomerai', 'Cis and trans isomers') },
        {
          p: t('Aplink dvigubą ryšį sukti negalima, todėl 2-butenas turi du stereoizomerus: cis (Z) ir trans (E). Kaip pagal Z/E taisyklę juos vadinti, aiškinama 5 skyriuje („Izomerija“). Šio skyriaus reakcijose abu izomerai duoda tuos pačius konstitucinius produktus.',
            'There is no rotation about a double bond, so 2-butene has two stereoisomers: cis (Z) and trans (E). How to name them by the Z/E rule is explained in unit 5 (isomerism). In the reactions of this unit both isomers give the same constitutional products.')
        },
        { mol: [{ smi: 'C/C=C\\C', caption: t('cis-2-butenas (Z)', 'cis-2-butene (Z)') }, { smi: 'C/C=C/C', caption: t('trans-2-butenas (E)', 'trans-2-butene (E)') }] },
        {
          example: {
            q: [{ p: t('Pavadinkite alkeną.', 'Name this alkene.') }, { mol: { smi: 'CC(C)=CCC' } }],
            steps: [
              [{ p: t('Raskite ilgiausią grandinę, kurioje yra C=C: tai penkių anglies atomų grandinė, taigi pentenas.', 'Find the longest chain that contains the C=C: five carbons, so a pentene.') }],
              [{ p: t('Sunumeruokite nuo galo, arčiau kurio dvigubas ryšys: C=C yra tarp 2 ir 3 atomo, vadinasi, 2-pentenas.', 'Number from the end nearer to the double bond: the C=C is between carbons 2 and 3, so a 2-pentene.') }],
              [{ p: t('Pakaitas metilas yra ties antruoju atomu.', 'The methyl substituent is on carbon 2.') }, { mol: { smi: 'CC(C)=CCC', name: t('2-metil-2-pentenas', '2-methyl-2-pentene') } }]
            ]
          }
        },
        { practice: 'u07.name' }
      ]
    },
    /* ------------------------------------------------------------ 2 */
    {
      id: 'ae',
      title: t('Elektrofilinis prijungimas (AE)', 'Electrophilic addition (AE)'),
      blocks: [
        { h: t('Alkenas yra nukleofilas', 'An alkene is a nucleophile') },
        {
          p: t('Alkeno π elektronai yra išsikišę į abi plokštumos puses ir silpnai laikomi, todėl alkenas elgiasi kaip nukleofilas ir reaguoja su elektrofiliniais reagentais. Tokia reakcija vadinama elektrofiliniu prijungimu, trumpai AE. Bendras vaizdas: reagentas $E-Nu$ suskyla, o jo dalys prisijungia prie abiejų C=C atomų.',
            'The π electrons of an alkene bulge out on both sides of the plane and are held loosely, so an alkene behaves as a nucleophile and reacts with electrophilic reagents. This reaction is called electrophilic addition, AE for short. In general the reagent $E-Nu$ splits and its two parts bond to the two carbons of the C=C.'),
          src: 'L7 p5'
        },
        { scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CCBr' }] }, caption: t('Eteno ir HBr reakcija: prijungimas.', 'Ethene and HBr: an addition.') },
        { h: t('Du žingsniai', 'Two steps') },
        {
          p: t('Pirmasis žingsnis lėtas: π ryšio elektronų pora sudaro ryšį su elektrofilu (čia $H+$ iš HBr), o antrasis dvigubo ryšio atomas netenka elektronų ir tampa karbokatijonu. Antrasis žingsnis greitas: bromido anijonas savo laisvąja elektronų pora prisijungia prie karbokatijono.',
            'The first step is slow: the π electron pair bonds to the electrophile (here $H+$ from HBr), and the other double-bond carbon, now short of electrons, becomes a carbocation. The second step is fast: the bromide anion bonds to the carbocation with a lone pair.'),
          src: 'L7 p7'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 žingsnis (lėtas): π elektronai sudaro $C-H$ ryšį, $H-Br$ elektronai pereina bromui.', 'Step 1 (slow): the π electrons form the $C-H$ bond; the $H-Br$ electrons go to bromine.')
            },
            {
              scheme: { items: [{ smi: 'C[CH2+]' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
              note: t('2 žingsnis (greitas): bromido laisvoji pora sudaro $C-Br$ ryšį.', 'Step 2 (fast): a lone pair of bromide forms the $C-Br$ bond.')
            }
          ],
          src: 'L7 p7, p18'
        },
        {
          rule: t('AE: π elektronai atakuoja elektrofilą (lėtas žingsnis) ir susidaro karbokatijonas; nukleofilas prisijungia prie karbokatijono (greitas žingsnis). Produktą lemia karbokatijonas.',
            'AE: the π electrons attack the electrophile (slow step) and a carbocation forms; the nucleophile bonds to the carbocation (fast step). The carbocation decides the product.'),
          src: 'L7 p18'
        },
        {
          pitfall: t('Lenkta rodyklė rodo elektronų porą: ji prasideda nuo ryšio arba laisvosios poros ir baigiasi ten, kur elektronai sudaro naują ryšį. Nepradėkite rodyklės nuo teigiamo atomo ar nuo $H+$.',
            'A curved arrow shows an electron pair: it starts at a bond or a lone pair and ends where the electrons form a new bond. Never start an arrow at a positive atom or at $H+$.')
        },
        {
          example: {
            q: [{ p: t('Parašykite eteno ir HCl reakcijos pirmąjį žingsnį.', 'Write the first step of ethene with HCl.') }],
            steps: [
              [{ p: t('Alkenas yra nukleofilas, o HCl – elektrofilas: $H$ yra $δ+$, nes chloras elektroneigiamesnis.', 'The alkene is the nucleophile and HCl the electrophile: $H$ is $δ+$ because chlorine is more electronegative.') }],
              [{ p: t('π ryšio elektronų pora sudaro ryšį su $H$; kartu $H-Cl$ ryšio elektronai pereina chlorui.', 'The π electron pair bonds to $H$; at the same time the $H-Cl$ electrons move to chlorine.') }],
              [{ p: t('Gaunamas etilo katijonas ir chlorido anijonas.', 'The result is the ethyl cation and a chloride anion.') }, { scheme: { items: [{ smi: 'C[CH2+]' }, { plus: true }, { smi: '[Cl-]' }] } }]
            ]
          }
        },
        { practice: 'u07.mech' }
      ]
    },
    /* ------------------------------------------------------------ 3 */
    {
      id: 'markovnikov',
      title: t('Nesimetriniai alkenai: Markovnikovo taisyklė', 'Unsymmetrical alkenes: Markovnikov’s rule'),
      blocks: [
        { h: t('Kuris produktas vyrauja?', 'Which product wins?') },
        {
          p: t('Propeno $H+$ gali prisijungti prie bet kurio dvigubo ryšio atomo, todėl galimi du karbokatijonai ir du produktai. Reakcijos eigą lemia tarpinis karbokatijonas: susidaro tas produktas, kurio karbokatijonas stabilesnis.',
            'In propene $H+$ can bond to either double-bond carbon, so two carbocations and two products are possible. The intermediate carbocation decides: the product forms whose carbocation is more stable.'),
          src: 'L7 p9, p11'
        },
        {
          mol: [{ smi: 'C[CH+]C', caption: t('antrinis → 2-chlorpropanas (pagrindinis)', 'secondary → 2-chloropropane (main)') }, { smi: 'CC[CH2+]', caption: t('pirminis → 1-chlorpropanas (pėdsakai)', 'primary → 1-chloropropane (traces)') }],
          src: 'L7 p11'
        },
        {
          rule: t('Karbokatijonų stabilumas: benzilo > alilo > tretinis > antrinis > pirminis > metilo.',
            'Carbocation stability: benzyl > allyl > tertiary > secondary > primary > methyl.'),
          src: 'L7 p9'
        },
        {
          table: {
            head: [t('Katijonas', 'Cation'), t('Pavyzdys', 'Example'), t('Kas jį stabilizuoja', 'What stabilises it')],
            rows: [
              [t('benzilo', 'benzyl'), { smi: '[CH2+]c1ccccc1' }, t('konjugacija su žiedu', 'conjugation with the ring')],
              [t('alilo', 'allyl'), { smi: 'C=C[CH2+]' }, t('konjugacija su C=C', 'conjugation with the C=C')],
              [t('tretinis', 'tertiary'), { smi: 'C[C+](C)C' }, t('trys alkilo pakaitai (hiperkonjugacija)', 'three alkyl groups (hyperconjugation)')],
              [t('antrinis', 'secondary'), { smi: 'C[CH+]C' }, t('du alkilo pakaitai', 'two alkyl groups')],
              [t('pirminis', 'primary'), { smi: 'CC[CH2+]' }, t('vienas alkilo pakaitas', 'one alkyl group')],
              [t('metilo', 'methyl'), { smi: '[CH3+]' }, t('nėra pakaitų', 'no substituents')]
            ]
          },
          src: 'L7 p9'
        },
        {
          p: t('Alkilgrupių stabilizavimas vadinamas hiperkonjugacija: kaimyninių $C-H$ ir $C-C$ ryšių elektronai iš dalies persikelia į katijono tuščią p orbitalę. Kuo daugiau alkilo pakaitų, tuo daugiau tokių ryšių, todėl tretinis katijonas stabiliausias. Alilo ir benzilo katijonų krūvis dar pasiskirsto konjugacijos būdu.',
            'Stabilisation by alkyl groups is called hyperconjugation: electrons of neighbouring $C-H$ and $C-C$ bonds shift partly into the empty p orbital of the cation. The more alkyl groups, the more such bonds, so the tertiary cation is the most stable. In allyl and benzyl cations the charge is also spread by conjugation.'),
          src: 'L7 p9, p10'
        },
        {
          rule: t('Markovnikovo taisyklė: HX (ir kiti HY) jungiasi taip, kad $H$ patenka prie dvigubo ryšio atomo, turinčio daugiau vandenilių, o halogenas – prie atomo su mažiau vandenilių, jei prie C=C nėra elektronų akceptorinių pakaitų. Priežastis: taip susidaro stabilesnis karbokatijonas.',
            'Markovnikov’s rule: HX (and other HY) adds with $H$ going to the double-bond carbon that has more hydrogens and the halogen to the carbon with fewer, as long as the C=C carries no electron-withdrawing substituent. The reason: this gives the more stable carbocation.'),
          src: 'L7 p13'
        },
        {
          scheme: { items: [{ smi: 'CC(C)=CC' }, { plus: true }, { smi: 'I' }, { arrow: '→' }, { smi: 'CCC(C)(C)I' }, { plus: true }, { smi: 'CC(C)C(C)I' }], maxWidth: 520 },
          caption: t('2-metil-2-butenas ir HI: pagrindinis produktas (tretinis katijonas) ir šalutinis (antrinis katijonas).', '2-methyl-2-butene and HI: the main product (tertiary cation) and the minor one (secondary cation).'),
          src: 'L7 p8'
        },
        { h: t('Kai abu katijonai vienodi', 'When both cations are alike') },
        {
          p: t('3-heksenas gali sudaryti tik vieną antrinį katijoną, todėl duoda tik 3-bromheksaną. 2-heksenas sudaro du antrinius katijonus, taigi duoda 2- ir 3-bromheksano mišinį. Čia vien skaičiuoti vandenilius neužtenka: reikia palyginti katijonus.',
            '3-Hexene can form only one secondary cation, so it gives only 3-bromohexane. 2-Hexene forms two secondary cations, so it gives a mixture of 2- and 3-bromohexane. Counting hydrogens is not enough here: compare the cations.'),
          src: 'L7 p12'
        },
        { scheme: { items: [{ smi: 'CCC=CCC' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CCC(Br)CC' }] }, src: 'L7 p12' },
        { scheme: { items: [{ smi: 'CC=CCCC' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CC(Br)CCCC' }, { plus: true }, { smi: 'CCC(Br)CCC' }], maxWidth: 520 }, src: 'L7 p12' },
        {
          pitfall: t('Taisyklė „halogenas ten, kur mažiau vandenilių“ yra tik trumpesnis kelias. Pirmiausia nubraižykite abu katijonus ir palyginkite jų klases; jei jos vienodos, susidaro abiejų produktų mišinys.',
            'The rule “halogen where there are fewer hydrogens” is only a shortcut. First draw both cations and compare their classes; if they are equal, a mixture of both products forms.')
        },
        { h: t('Atvirkštinis prijungimas: HBr su peroksidais', 'Reverse addition: HBr with peroxides') },
        {
          p: t('Esant peroksidams (arba UV šviesai) HBr, ir tik HBr, jungiasi prieš Markovnikovo taisyklę. Tada vyksta radikalinis prijungimas, AR: $Br•$ prisijungia prie atomo su daugiau vandenilių ir sudaro stabilesnį (antrinį) radikalą, o šis atplėšia $H$ nuo HBr.',
            'In the presence of peroxides (or UV light) HBr, and only HBr, adds against Markovnikov’s rule. A radical addition, AR, takes place: $Br•$ bonds to the carbon with more hydrogens and gives the more stable (secondary) radical, which then takes $H$ from HBr.'),
          src: 'L7 p13, p14'
        },
        { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: '[Br]' }, { arrow: '→' }, { smi: 'C[CH]CBr' }, { arrow: '→', above: f('HBr') }, { smi: 'CCCBr' }], maxWidth: 520 }, caption: t('Propenas: radikalas, po to 1-brompropanas.', 'Propene: the radical, then 1-bromopropane.'), src: 'L7 p14' },
        {
          example: {
            q: [{ p: t('Koks pagrindinis 2-metil-1-butenos ir HBr reakcijos produktas? Kodėl?', 'What is the main product of 2-methyl-1-butene with HBr? Why?') }, { mol: { smi: 'CCC(C)=C', opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Atomas Nr. 4 (CH₂) turi du vandenilius, atomas Nr. 2 – nė vieno. $H+$ jungiasi prie atomo Nr. 4.', 'Carbon no. 4 (CH₂) has two hydrogens, carbon no. 2 has none. $H+$ bonds to carbon no. 4.') }],
              [{ p: t('Teigiamas krūvis lieka ant atomo Nr. 2: tretinis katijonas (alternatyva būtų pirminis).', 'The positive charge stays on carbon no. 2: a tertiary cation (the alternative would be primary).') }, { mol: { smi: 'CC[C+](C)C' } }],
              [{ p: t('Bromidas jungiasi prie šio atomo.', 'Bromide bonds to that carbon.') }, { mol: { smi: 'CCC(C)(C)Br', name: t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane') } }]
            ]
          }
        },
        { practice: 'u07.hx' },
        { practice: 'u07.cation' },
        { practice: 'u07.radical' },
        { practice: 'u07.why' }
      ]
    },
    /* ------------------------------------------------------------ 4 */
    {
      id: 'ewg',
      title: t('Išimtis: elektronų akceptorinis pakaitas', 'The exception: an electron-withdrawing group'),
      blocks: [
        { h: t('Kai Markovnikovo taisyklė nebetinka', 'When Markovnikov’s rule fails') },
        {
          p: t('Taisyklė galioja, jei prie C=C yra alkilo (elektronų donorų) pakaitų. Jei prie dvigubo ryšio yra elektronų akceptorinė grupė ($COOH$, $C=O$, $CN$, $CF3$), prijungimas vyksta prieš Markovnikovo taisyklę: $H$ patenka prie atomo, turinčio šią grupę, o nukleofilas – prie tolimesnio atomo.',
            'The rule holds when the C=C carries alkyl (electron-donating) substituents. If the double bond bears an electron-withdrawing group ($COOH$, $C=O$, $CN$, $CF3$), addition goes against Markovnikov’s rule: $H$ goes to the carbon that carries the group and the nucleophile to the farther carbon.'),
          src: 'L7 p13'
        },
        { scheme: { items: [{ smi: 'C=CC(=O)O' }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H+') }, { smi: 'OCCC(=O)O' }] }, caption: t('Propeno rūgštis hidratuojama į 3-hidroksipropano rūgštį.', 'Propenoic acid is hydrated to 3-hydroxypropanoic acid.'), src: 'S4.13' },
        {
          p: t('Kodėl? Pirmas paaiškinimas – karbokatijonų stabilumas. Karbonilo anglis yra $δ+$, todėl katijonas tiesiai šalia jos būtų destabilizuotas (du teigiami atomai gretimi). Jis mažiau stabilus net už pirminį katijoną toliau nuo grupės.',
            'Why? The first explanation is cation stability. The carbonyl carbon is $δ+$, so a cation right next to it would be destabilised (two adjacent positive atoms), even less stable than the primary cation farther from the group.'),
          src: 'S4.13'
        },
        { mol: [{ smi: 'C[CH+]C(=O)O', caption: t('prie grupės: nepalankus', 'next to the group: unfavourable') }, { smi: '[CH2+]CC(=O)O', caption: t('toliau nuo grupės: palankesnis', 'away from the group: better') }] },
        {
          p: t('Antras paaiškinimas – mechanizmas. Rūgštyje pirmiausia protonizuojamas karbonilo deguonis (panašiai kaip maleino rūgšties izomerizacijoje). Teigiamas krūvis rezonansu pasiskirsto ir atsiduria ant tolimesnio C atomo; ten prisijungia vanduo.',
            'The second explanation is the mechanism. In acid the carbonyl oxygen is protonated first (much as in the isomerisation of maleic acid). The positive charge spreads by resonance and also sits on the farther carbon; water bonds there.'),
          src: 'L7 p16'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=CC(=O)O' }, { plus: true }, { smi: '[OH3+]', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('Karbonilo deguonies laisvoji pora paima protoną.', 'A lone pair of the carbonyl oxygen takes the proton.')
            }
          ]
        },
        { resonance: [{ smi: 'C=CC(=[OH+])O' }, { smi: 'C=C[C+](O)O' }, { smi: '[CH2+]C=C(O)O' }], caption: t('Protonizuotos rūgšties rezonansinės formulės: krūvis pasiskirsto iki tolimesnio C atomo.', 'Resonance structures of the protonated acid: the charge reaches the far carbon.') },
        {
          mech: [
            {
              scheme: { items: [{ smi: '[CH2+]C=C(O)O' }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 0 } }],
              note: t('Vanduo prisijungia prie tolimesnio C atomo.', 'Water bonds to the far carbon.')
            }
          ]
        },
        {
          p: t('Netekęs protono susidaręs enolis virsta rūgštimi: gaunama 3-hidroksipropano rūgštis. Abu paaiškinimai veda prie to paties atsakymo: nukleofilas jungiasi prie atomo, nutolusio nuo akceptorinės grupės.',
            'After losing a proton the enol turns into the acid, giving 3-hydroxypropanoic acid. Both explanations lead to the same answer: the nucleophile bonds to the carbon far from the withdrawing group.'),
          src: 'S4.13'
        },
        {
          pitfall: t('Prieš taikydami Markovnikovo taisyklę pažiūrėkite, kas yra prie C=C. $CF3$, $CN$, $COOH$, $CHO$ ir panašios grupės keičia kryptį. Nepainiokite jų su alkilo pakaitais.',
            'Before applying Markovnikov’s rule look at what sits on the C=C. $CF3$, $CN$, $COOH$, $CHO$ and similar groups reverse the direction. Do not confuse them with alkyl substituents.')
        },
        {
          example: {
            q: [{ p: t('Kas susidaro propenonitrilui ($CH2=CH-CN$) reaguojant su HBr?', 'What forms from propenenitrile ($CH2=CH-CN$) and HBr?') }, { mol: { smi: 'C=CC#N', opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Grupė $CN$ yra elektronų akceptorė, todėl Markovnikovo taisyklė netinka.', 'The $CN$ group withdraws electrons, so Markovnikov’s rule does not apply.') }],
              [{ p: t('$H+$ jungiasi prie atomo Nr. 2 (su grupe), o katijonas atsiranda ant atomo Nr. 1, toliau nuo $CN$.', '$H+$ bonds to carbon no. 2 (with the group) and the cation forms on carbon no. 1, farther from $CN$.') }],
              [{ p: t('Bromidas jungiasi prie atomo Nr. 1.', 'Bromide bonds to carbon no. 1.') }, { mol: { smi: 'BrCCC#N' } }]
            ]
          }
        },
        { practice: 'u07.ewg' }
      ]
    },
    /* ------------------------------------------------------------ 5 */
    {
      id: 'reagents',
      title: t('Halogenai, vanduo ir vandenilis', 'Halogens, water and hydrogen'),
      blocks: [
        { h: t('Halogenų prijungimas', 'Addition of halogens') },
        {
          p: t('Artėdama prie dvigubo ryšio, $Br2$ molekulė poliarizuojasi. π elektronai atakuoja teigiamąjį bromo atomą ir susidaro bromonio jonas, kurį iš kitos pusės atakuoja bromido jonas. Atsivėrus žiedui gaunamas vicinalinis dibromalkanas.',
            'On approaching a double bond the $Br2$ molecule becomes polarised. The π electrons attack the positive bromine atom and a bromonium ion forms; bromide then attacks it from the other side. The ring opens and a vicinal dibromoalkane results.'),
          src: 'L7 p6'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: 'BrBr' }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
              note: t('π elektronai atakuoja bromą, $Br-Br$ elektronai pereina tolimesniam bromui.', 'The π electrons attack bromine; the $Br-Br$ electrons go to the far bromine.')
            },
            {
              scheme: { items: [{ smi: 'C1C[Br+]1', opts: { coords: [[0, 0], [1, 0], [0.5, -0.87]] } }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 0 } }, { from: { m: 0, b: [0, 2] }, to: { m: 0, a: 2 } }],
              note: t('Bromidas atveria bromonio žiedą iš priešingos pusės.', 'Bromide opens the bromonium ring from the opposite side.')
            }
          ],
          src: 'L7 p6'
        },
        { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'CC(Br)CBr' }] }, caption: t('Propenas ir bromas: 1,2-dibrompropanas.', 'Propene and bromine: 1,2-dibromopropane.') },
        {
          rule: t('$Br2$ ar $Cl2$ jungiasi prie abiejų C=C atomų. Oranžinio (geltono) bromo tirpalo spalva išnyksta: tai dvigubo (ir trigubo) ryšio atpažinimo reakcija.',
            '$Br2$ or $Cl2$ bonds to both carbons of the C=C. The orange (yellow) bromine solution loses its colour: this is the test reaction for a double (and a triple) bond.'),
          src: 'L7 p6'
        },
        { h: t('Vandens prijungimas (hidratacija)', 'Addition of water (hydration)') },
        {
          p: t('Vanduo prie alkenų jungiasi tik rūgštyje. Pats $H2O$ yra per silpnas elektrofilas, o sieros rūgštis sudaro hidroksonio joną $H3O+$, kuris ir yra elektrofilinė dalelė. Produktai – alkoholiai, kryptis pagal Markovnikovo taisyklę.',
            'Water adds to alkenes only in acid. $H2O$ itself is too weak an electrophile; sulfuric acid makes the hydronium ion $H3O+$, which is the electrophilic particle. The products are alcohols, with the direction given by Markovnikov’s rule.'),
          src: 'L7 p19'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: '[OH3+]', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1: $H+$ prisijungia (lėtai), susidaro antrinis katijonas.', '1: $H+$ adds (slowly), giving the secondary cation.')
            },
            {
              scheme: { items: [{ smi: 'C[CH+]C' }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
              note: t('2: vanduo prisijungia prie katijono.', '2: water bonds to the cation.')
            },
            {
              scheme: { items: [{ smi: 'CC(C)[OH2+]', opts: { allH: true, coords: [[0, 0], [0.87, 0.5], [1.73, 0], [0.87, 1.5]] } }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H3' } }, { from: { m: 0, b: [3, 'H3'] }, to: { m: 0, a: 3 } }],
              note: t('3: vanduo paima protoną, atsikuria katalizatorius.', '3: water takes a proton, regenerating the catalyst.')
            }
          ],
          src: 'L7 p19'
        },
        { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H2SO4') }, { smi: 'CC(C)O' }] }, caption: t('Propenas: pagrindinis produktas 2-propanolis.', 'Propene: the main product is 2-propanol.') },
        { h: t('Vandenilio prijungimas (hidrinimas)', 'Addition of hydrogen (hydrogenation)') },
        {
          p: t('Su $H2$ ir $Pt$, $Pd$ ar $Ni$ katalizatoriumi alkenas hidrinamas į alkaną. Abu reagentai adsorbuojasi katalizatoriaus paviršiuje, o π ryšys virsta dviem $C-H$ ryšiais. Tai ir prijungimas, ir redukcija.',
            'With $H2$ and a $Pt$, $Pd$ or $Ni$ catalyst an alkene is hydrogenated to an alkane. Both reagents adsorb on the catalyst surface and the π bond becomes two $C-H$ bonds. It is both an addition and a reduction.'),
          src: 'L7 p20, p21'
        },
        { scheme: { items: [{ smi: 'CC(C)=CC' }, { plus: true }, { smi: '[H][H]' }, { arrow: '→', above: f('Pd') }, { smi: 'CCC(C)C' }] }, caption: t('2-metil-2-butenas virsta 2-metilbutanu.', '2-methyl-2-butene becomes 2-methylbutane.') },
        {
          pitfall: t('Hidrinimo (H₂/Pd) mechanizmas yra katalizinis paviršiuje, ne elektrofilinis, todėl jo AE simboliu nežymime. AE vartojame HX, $H2O/H+$ ir $X2$ prijungimui.',
            'Hydrogenation (H₂/Pd) is catalytic on a surface, not electrophilic, so we do not label it AE. AE is used for the addition of HX, $H2O/H+$ and $X2$.')
        },
        {
          example: {
            q: [{ p: t('Kokie produktai gaunami iš 2-metilpropeno su (a) $Br2$, (b) $H2O/H+$, (c) $H2/Pd$?', 'What are the products of 2-methylpropene with (a) $Br2$, (b) $H2O/H+$, (c) $H2/Pd$?') }, { mol: { smi: 'CC(C)=C' } }],
            steps: [
              [{ p: t('(a) Bromas jungiasi prie abiejų atomų.', '(a) Bromine bonds to both carbons.') }, { mol: { smi: 'CC(C)(Br)CBr' } }],
              [{ p: t('(b) Markovnikovas: $H$ prie CH₂, $OH$ prie tretinio atomo.', '(b) Markovnikov: $H$ to CH₂, $OH$ to the tertiary carbon.') }, { mol: { smi: 'CC(C)(C)O' } }],
              [{ p: t('(c) Dvigubas ryšys prisotinamas.', '(c) The double bond is saturated.') }, { mol: { smi: 'CC(C)C' } }]
            ]
          }
        },
        { practice: 'u07.x2h2' },
        { practice: 'u07.hydr' }
      ]
    },
    /* ------------------------------------------------------------ 6 */
    {
      id: 'ox',
      title: t('Alkenų oksidavimas KMnO₄', 'Oxidation of alkenes with KMnO₄'),
      blocks: [
        { h: t('Ką lemia sąlygos', 'What the conditions decide') },
        {
          p: t('Produktai priklauso nuo terpės (rūgštinė, neutrali, šarminė), temperatūros ir alkeno struktūros. Švelnioje (šaltoje, šarminėje ar neutralioje) terpėje $C=C$ lieka kaip $C-C$ ir susidaro 1,2-diolis. Griežtomis sąlygomis ryšys skyla.',
            'The products depend on the medium (acidic, neutral, alkaline), the temperature and the structure of the alkene. Under mild conditions (cold, alkaline or neutral) the $C=C$ stays as $C-C$ and a 1,2-diol forms. Under harsh conditions the bond is cleaved.'),
          src: 'L7 p22'
        },
        { scheme: { items: [{ smi: 'CC(C)=CC' }, { arrow: '→', above: f('KMnO4, OH-, H2O'), below: t('šaltas', 'cold') }, { smi: 'CC(C)(O)C(C)O' }] }, caption: t('Švelnus oksidavimas: diolis; violetinė spalva išnyksta, iškrenta rudos $MnO2$ nuosėdos.', 'Mild oxidation: a diol; the violet colour fades and brown $MnO2$ precipitates.'), src: 'L7 p23' },
        { h: t('Oksidacinis skilimas', 'Oxidative cleavage') },
        {
          p: t('Rūgštinėje terpėje skilimas vyksta ir šaltyje, ir kaitinant, o šarminėje bei neutralioje – tik kaitinant. Kiekvienas dvigubo ryšio atomas virsta karbonilo anglimi, o jos tipas priklauso nuo pakaitų.',
            'In acid the cleavage takes place both cold and hot; in alkaline or neutral medium only when heated. Each double-bond carbon becomes a carbonyl carbon whose type depends on its substituents.'),
          src: 'L7 p24'
        },
        {
          rule: t('Atomas =CH–R virsta karboksirūgštimi, atomas =CR₂ – ketonu, galinė grupė =CH₂ – $CO2$ (ir $H2O$).',
            'A =CH–R carbon becomes a carboxylic acid, a =CR₂ carbon becomes a ketone, and a terminal =CH₂ becomes $CO2$ (and $H2O$).'),
          src: 'L7 p24, p25'
        },
        {
          table: {
            head: [t('C=C atomas', 'C=C carbon'), t('Produktas', 'Product')],
            rows: [
              [t('=CR₂ (du anglies pakaitai)', '=CR₂ (two carbon substituents)'), t('ketonas $R2C=O$', 'ketone $R2C=O$')],
              [t('=CH–R (vienas pakaitas)', '=CH–R (one substituent)'), t('rūgštis $RCOOH$', 'acid $RCOOH$')],
              [t('=CH₂ (galinis)', '=CH₂ (terminal)'), t('$CO2$ ir $H2O$', '$CO2$ and $H2O$')]
            ]
          },
          src: 'L7 p24'
        },
        {
          scheme: { items: [{ smi: 'CC(C)=CCC' }, { arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }, { smi: 'CC(C)=O' }, { plus: true }, { smi: 'CCC(O)=O' }], maxWidth: 520 },
          caption: t('2-metil-2-pentenas: acetonas ir propano rūgštis.', '2-methyl-2-pentene: acetone and propanoic acid.'), src: 'L7 p26'
        },
        {
          scheme: { items: [{ smi: 'CCCC=C' }, { arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }, { smi: 'CCCC(O)=O' }, { plus: true }, { smi: 'O=C=O' }], maxWidth: 520 },
          caption: t('1-pentenas: butano rūgštis ir $CO2$.', '1-pentene: butanoic acid and $CO2$.'), src: 'L7 p26'
        },
        { h: t('Nuo produktų atgal prie alkeno', 'From the products back to the alkene') },
        {
          p: t('Atvirkštinis uždavinys sprendžiamas taip: raskite visus C=O anglies atomus produktuose. Tai buvę dvigubo ryšio atomai. Sujunkite du iš jų dvigubu ryšiu (ketono ir rūgšties anglis, arba vieno žiedinio produkto dvi anglis) ir gausite alkeną.',
            'Work backwards like this: find every C=O carbon in the products. These were the double-bond carbons. Join two of them with a double bond (a ketone carbon with an acid carbon, or the two carbons of one ring-opened product) and you have the alkene.'),
          src: 'L7 p28'
        },
        {
          example: {
            q: [{ p: t('Oksiduojant alkeną $KMnO4/H3O+$ gauta propanonas ir butano rūgštis. Koks alkenas?', 'Oxidising an alkene with $KMnO4/H3O+$ gave propanone and butanoic acid. Which alkene?') }, { mol: [{ smi: 'CC(C)=O' }, { smi: 'CCCC(O)=O' }] }],
            steps: [
              [{ p: t('Ketono C=O anglis buvo =CR₂ (du metilai), rūgšties anglis – =CH–R.', 'The ketone C=O carbon was =CR₂ (two methyls), the acid carbon was =CH–R.') }],
              [{ p: t('Sujungiame šias dvi anglis dvigubu ryšiu.', 'Join these two carbons with a double bond.') }, { mol: { smi: 'CC(C)=CCC', name: t('2-metil-2-pentenas', '2-methyl-2-pentene') } }]
            ]
          }
        },
        {
          pitfall: t('Neklyskite dėl terpės: šaltame šarminiame $KMnO4$ gaunamas diolis (ryšys lieka), o rūgštinėje terpėje – skilimo produktai. Taip pat rūgštis nėra aldehidas: $=CH-R$ oksiduojasi iki galo.',
            'Do not mix up the medium: cold alkaline $KMnO4$ gives a diol (the bond stays), acidic medium gives the cleavage products. And the product is an acid, not an aldehyde: $=CH-R$ is oxidised all the way.')
        },
        { practice: 'u07.kmno4' },
        { practice: 'u07.back' },
        { practice: 'u07.fate' }
      ]
    },
    /* ------------------------------------------------------------ 7 */
    {
      id: 'tests',
      title: t('Dvigubo ryšio atpažinimas ir bandymai', 'Testing for a double bond; the lab'),
      blocks: [
        { h: t('Du kokybiniai bandymai', 'Two qualitative tests') },
        {
          p: t('Dvigubas ryšys atpažįstamas pagal dvi reakcijas: su bromo vandeniu ir su kalio permanganato tirpalu. Abi vyksta greitai, be kaitinimo, ir keičia tirpalo spalvą.',
            'A double bond is detected by two reactions: with bromine water and with potassium permanganate solution. Both are fast, need no heating and change the colour of the solution.'),
          src: 'L7 p6, p23'
        },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), t('Reakcija', 'Reaction'), t('Ką matome', 'Observation')],
            rows: [
              [t('bromo vanduo', 'bromine water'), t('AE: vicinalinis dibromidas', 'AE: a vicinal dibromide'), t('oranžinis tirpalas pasidaro bespalvis', 'the orange solution turns colourless')],
              [t('$KMnO4$ (neutralus ar šarminis)', '$KMnO4$ (neutral or alkaline)'), t('oksidavimas į diolį', 'oxidation to a diol'), t('violetinė spalva išnyksta, iškrenta rudos $MnO2$ nuosėdos', 'the violet colour fades and brown $MnO2$ precipitates')]
            ]
          },
          src: 'L7 p6, p23'
        },
        {
          p: t('Laboratorijoje etenas gaunamas kaitinant etanolį su konc. $H2SO4$. Dujos praleidžiamos pro bromo vandenį ir pro $KMnO4$ tirpalą; abiejų tirpalų spalva išnyksta.',
            'In the lab ethene is made by heating ethanol with conc. $H2SO4$. The gas is passed through bromine water and through $KMnO4$ solution; both solutions lose their colour.'),
          src: 'LW6 p1'
        },
        {
          scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: f('H2SO4 (konc.)'), below: f('t°') }, { smi: 'C=C' }, { arrow: '→', above: f('Br2') }, { smi: 'BrCCBr' }], maxWidth: 520 },
          src: 'LW6 p1'
        },
        { scheme: { items: [{ smi: 'C=C' }, { arrow: '→', above: f('KMnO4, H2O') }, { smi: 'OCCO' }, { plus: true }, { smi: 'O=[Mn]=O' }] }, caption: t('Rudos nuosėdos yra $MnO2$.', 'The brown precipitate is $MnO2$.'), src: 'LW6 p1' },
        {
          pitfall: t('Abu bandymai teigiami ir trigubam ryšiui, o $KMnO4$ oksiduoja ir kitus junginius (pvz., aldehidus, alkoholius). Teigiamas bandymas rodo nesotumą, bet nepatvirtina, kad tai būtent alkenas.',
            'Both tests are also positive for a triple bond, and $KMnO4$ oxidises other compounds too (aldehydes, alcohols). A positive result shows unsaturation but does not prove that it is an alkene.'),
          src: 'L7 p6'
        },
        {
          example: {
            q: [{ p: t('Dviejuose mėgintuvėliuose yra heksanas ir 1-heksenas. Kaip juos atskirti?', 'Two test tubes hold hexane and 1-hexene. How do you tell them apart?') }],
            steps: [
              [{ p: t('Pilame į abu bromo vandens. Alkanas be šviesos nereaguoja.', 'Add bromine water to both. The alkane does not react without light.') }],
              [{ p: t('Alkene vyksta AE: oranžinė spalva išnyksta.', 'The alkene undergoes AE: the orange colour disappears.') }, { scheme: { items: [{ smi: 'CCCCC=C' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'CCCCC(Br)CBr' }] } }]
            ]
          }
        },
        { practice: 'u07.test' }
      ]
    }
  ];

  const SUMMARY = [
    { h: t('Alkenų reakcijų santrauka', 'Summary of alkene reactions') },
    {
      table: {
        head: [t('Reagentas', 'Reagent'), t('Produktas', 'Product'), t('Pastaba', 'Note')],
        rows: [
          [t('$HX$', '$HX$'), t('halogenalkanas', 'haloalkane'), t('AE; Markovnikovo taisyklė', 'AE; Markovnikov’s rule')],
          [t('$H2O / H+$', '$H2O / H+$'), t('alkoholis', 'alcohol'), t('AE; reikia rūgšties', 'AE; needs acid')],
          [t('$Br2$, $Cl2$', '$Br2$, $Cl2$'), t('vicinalinis dihalogenidas', 'vicinal dihalide'), t('AE; Br₂ spalva išnyksta', 'AE; the Br₂ colour fades')],
          [t('$H2 / Pd$', '$H2 / Pd$'), t('alkanas', 'alkane'), t('hidrinimas (redukcija)', 'hydrogenation (reduction)')],
          [t('$KMnO4$, $OH-$, šaltas', '$KMnO4$, $OH-$, cold'), t('1,2-diolis', '1,2-diol'), t('violetinė → rudos $MnO2$ nuosėdos', 'violet → brown $MnO2$')],
          [t('$KMnO4$, $H3O+$, $t°$', '$KMnO4$, $H3O+$, $t°$'), t('ketonai, rūgštys, $CO2$', 'ketones, acids, $CO2$'), t('=CR₂ → ketonas; =CH–R → rūgštis', '=CR₂ → ketone; =CH–R → acid')],
          [t('$HBr$ + $ROOR$', '$HBr$ + $ROOR$'), t('1-bromalkanas', 'the anti-Markovnikov bromide'), t('AR; prieš Markovnikovą', 'AR; against Markovnikov')]
        ]
      },
      src: 'L7 p27'
    },
    {
      list: [
        t('Karbokatijonų stabilumas: benzilo > alilo > tretinis > antrinis > pirminis > metilo.', 'Carbocation stability: benzyl > allyl > tertiary > secondary > primary > methyl.'),
        t('AE: lėtas žingsnis – katijono susidarymas, greitas – nukleofilo prisijungimas.', 'AE: the slow step forms the cation, the fast step adds the nucleophile.'),
        t('Elektronų akceptorinis pakaitas prie C=C: nukleofilas jungiasi prie tolimesnio atomo.', 'An electron-withdrawing group on the C=C: the nucleophile bonds to the farther carbon.'),
        t('Atpažinimas: bromo vanduo ir $KMnO4$ praranda spalvą; $KMnO4$ palieka rudą $MnO2$.', 'Test: bromine water and $KMnO4$ lose their colour; $KMnO4$ leaves brown $MnO2$.'),
        t('Atgal nuo skilimo produktų: sujunkite C=O anglis dvigubu ryšiu.', 'Back from cleavage products: join the C=O carbons with a double bond.')
      ]
    }
  ];

  /* ================= generated types ================= */
  const nameStep = (ctx, smi, prompt) => {
    const lt = ctx.name.name(smi, { lang: 'lt' });
    const en = ctx.name.name(smi, { lang: 'en' });
    if (!lt || !en) return null;
    return {
      prompt: prompt || t('Pavadinkite produktą.', 'Name the product.'),
      kind: 'name', mol: { smi }, answer: { smi },
      hint: t('Raskite ilgiausią grandinę su pagrindine grupe ir sunumeruokite ją taip, kad pakaitai gautų mažiausius numerius.', 'Find the longest chain with the main group and number it so the substituents get the lowest numbers.'),
      solution: t(lt.name, en.name)
    };
  };
  const mechHX = (smi, hC, xC, X) => ({
    scheme: { items: [{ smi }, { plus: true }, { smi: X, opts: { allH: true } }] },
    arrows: [{ from: { m: 0, b: [hC, xC] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
    note: t('$π$ elektronai sudaro $C-H$ ryšį; $H-X$ elektronai pereina halogenui.', 'The $π$ electrons form the $C-H$ bond; the $H-X$ electrons go to the halogen.')
  });
  const mechNu = (cat, xC, X) => ({
    scheme: { items: [{ smi: cat }, { plus: true }, { smi: '[' + X + '-]', opts: { lonePairs: true } }] },
    arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: xC } }],
    note: t('Halogenido laisvoji pora sudaro ryšį su katijono anglimi.', 'A lone pair of the halide forms the bond to the cation carbon.')
  });

  const TYPES_GEN = [
    /* ---- HX ---- */
    {
      id: 'u07.hx',
      title: t('HX prijungimas: pagrindinis produktas', 'HX addition: the main product'),
      mirrors: ['S4.3', 'S4.4'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const X = ctx.pick(['Cl', 'Br', 'I']);
        const sym = rng() < 0.25;
        const p = sym ? pickSym(ctx, ALK_S, 'ae.hx', { X }) : pickUnsym(ctx, ALK_U, 'ae.hx', { X }, true);
        const dihalide = first(react.run('ae.x2', [p.smi], { X }));
        const alkane = first(react.run('ae.h2', [p.smi], {}));
        const alcohol = first(react.run('ae.h2o', [p.smi], {}));
        const options = optionList(ctx, p.major, p.minor.concat([dihalide, alkane, alcohol]), 4);
        const steps = [];
        if (!sym) {
          steps.push({
            prompt: t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
            kind: 'atoms', mol: { smi: p.smi, opts: { numbers: 'all' } }, answer: [p.hC],
            hint: t('Po protono prisijungimo ant kito atomo lieka teigiamas krūvis. Kuris katijonas stabilesnis?', 'After the proton bonds, the other carbon carries the positive charge. Which cation is more stable?'),
            solution: t('Atomas Nr. ' + (p.hC + 1) + ' gauna $H+$, nes teigiamas krūvis lieka ant atomo Nr. ' + (p.xC + 1) + ' ir ten susidaro ' + LTCLS[p.cls - 1] + ' katijonas.',
              'Carbon no. ' + (p.hC + 1) + ' receives $H+$, because the positive charge stays on carbon no. ' + (p.xC + 1) + ', a ' + ENCLS[p.cls - 1] + ' cation.')
          });
        }
        steps.push({
          prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: 'choice', options, answer: 0,
          hint: sym
            ? t('Abu dvigubo ryšio atomai vienodi. Kiek $HX$ molekulių prisijungia?', 'Both double-bond carbons are alike. How many $HX$ molecules add?')
            : t('Pirmiausia atmeskite variantus, kuriuose prisijungė ne viena $HX$ molekulė arba kitas reagentas, tada palyginkite krypties.', 'First rule out options that are not a single $HX$ addition, then compare the directions.'),
          solution: [{ p: sym ? t('Abu atomai vienodi, todėl susidaro vienas produktas.', 'Both carbons are alike, so only one product forms.') : t('Halogenas jungiasi prie ' + LTCLS[p.cls - 1] + ' katijono anglies.', 'The halogen bonds to the carbon of the ' + ENCLS[p.cls - 1] + ' cation.') }, { mol: { smi: p.major } }]
        });
        const ns = nameStep(ctx, p.major);
        if (ns) steps.push(ns);
        return {
          q: [{ scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: X }, { arrow: '→' }] } }],
          steps,
          why: t('$HX$ prijungimas vyksta per karbokatijoną: protonas pasirenka dvigubo ryšio atomą, po kurio lieka stabilesnis katijonas (tretinis > antrinis > pirminis), o halogenidas jungiasi prie teigiamos anglies. Todėl pagrindinis produktas atitinka Markovnikovo taisyklę, o ne atvirkštinę kryptį.',
            '$HX$ addition goes through a carbocation: the proton chooses the double-bond carbon that leaves the more stable cation (tertiary > secondary > primary), and the halide bonds to the positive carbon. That is why the main product follows Markovnikov’s rule and not the reverse.'),
          src: 'L7 p9'
        };
      }
    },
    /* ---- mechanism ---- */
    {
      id: 'u07.mech',
      title: t('HX prijungimo mechanizmas žingsnis po žingsnio', 'The mechanism of HX addition, step by step'),
      mirrors: ['S4.3', 'S4.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const X = ctx.pick(['Cl', 'Br', 'I']);
        const p = pickUnsym(ctx, ALK_U, 'ae.hx', { X }, true);
        const cat = cationSmi(chem, p.smi, p.hC, p.xC);
        const other = cationSmi(chem, p.smi, p.xC, p.hC);
        if (!cat || !other) throw new Error('u07.mech: cation');
        const alkane = first(react.run('ae.h2', [p.smi], {}));
        const dihalide = first(react.run('ae.x2', [p.smi], { X }));
        const wrongProd = p.minor.concat([dihalide, alkane]);
        return {
          q: [
            { p: t('Alkenas reaguoja su vandenilio halogenidu. Išnagrinėkite mechanizmą.', 'An alkene reacts with a hydrogen halide. Work through the mechanism.') },
            { scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: X }, { arrow: '→' }] } }
          ],
          steps: [
            {
              prompt: t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
              kind: 'atoms', mol: { smi: p.smi, opts: { numbers: 'all' } }, answer: [p.hC],
              hint: t('Kuris dvigubo ryšio atomas turi daugiau vandenilių, ir kuris po to išlaiko stabilesnį krūvį?', 'Which double-bond carbon has more hydrogens, and which one is better at carrying the charge afterwards?'),
              solution: t('Atomas Nr. ' + (p.hC + 1) + ' gauna protoną; $π$ elektronai atakuoja $H+$ ties šiuo atomu.', 'Carbon no. ' + (p.hC + 1) + ' receives the proton; the $π$ electrons attack $H+$ at this carbon.')
            },
            {
              prompt: t('Kuris karbokatijonas susidaro?', 'Which carbocation forms?'),
              kind: 'choice',
              options: [{ mol: { smi: cat } }, { mol: { smi: other } }, { text: t('Karbokatijonas nesusidaro: halogenidas prisijungia pirmas.', 'No carbocation forms: the halide adds first.') }],
              answer: 0,
              hint: t('Palyginkite anglies atomų skaičių prie teigiamo atomo: tretinis > antrinis > pirminis.', 'Count the carbons attached to the positive carbon: tertiary > secondary > primary.'),
              solution: [
                { p: t('Teigiamas krūvis lieka ant atomo Nr. ' + (p.xC + 1) + ': tai ' + LTCLS[p.cls - 1] + ' katijonas, stabilesnis už kitą galimą.', 'The positive charge stays on carbon no. ' + (p.xC + 1) + ': a ' + ENCLS[p.cls - 1] + ' cation, more stable than the alternative.') },
                { mech: [mechHX(p.smi, p.hC, p.xC, X)] }
              ]
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options: optionList(ctx, p.major, wrongProd, 4), answer: 0,
              hint: t('Halogenido anijonas jungiasi prie teigiamo atomo.', 'The halide anion bonds to the positive carbon.'),
              solution: [
                { p: t('Halogenido laisvoji elektronų pora sudaro ryšį su katijono anglimi.', 'A lone pair of the halide bonds to the cation carbon.') },
                { mech: [mechNu(cat, p.xC, X)] },
                { mol: { smi: p.major } }
              ]
            },
            {
              prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
              kind: 'choice', options: [{ text: t('AE', 'AE') }, { text: t('AN', 'AN') }, { text: t('SR', 'SR') }, { text: t('SN1', 'SN1') }], answer: 0,
              hint: t('Dvigubą ryšį atakuoja elektrofilas ir molekulė jungiasi.', 'An electrophile attacks the double bond and the molecule adds up.'),
              solution: t('AE, elektrofilinis prijungimas: elektrofilas $H+$ atakuoja $π$ ryšį, po to nukleofilas prisijungia prie karbokatijono.', 'AE, electrophilic addition: the electrophile $H+$ attacks the $π$ bond, then the nucleophile bonds to the carbocation.')
            }
          ],
          why: t('Alkenas yra nukleofilas: jo $π$ elektronai atakuoja $H+$. Protonas jungiasi taip, kad susidarytų stabilesnis katijonas, o halogenidas tada prisijungia prie jo. Šie du žingsniai yra elektrofilinis prijungimas (AE); lėtas yra pirmasis.',
            'An alkene is a nucleophile: its $π$ electrons attack $H+$. The proton bonds so that the more stable cation forms, and the halide then bonds to it. These two steps are electrophilic addition (AE); the first is the slow one.'),
          src: 'L7 p7, p9'
        };
      }
    },
    /* ---- cation stability ---- */
    {
      id: 'u07.cation',
      title: t('Karbokatijonų stabilumas', 'Carbocation stability'),
      mirrors: ['S4.12'],
      gen(rng, ctx) {
        const CAT = [
          ['benzyl', ['[CH2+]c1ccccc1']],
          ['allyl', ['C=C[CH2+]']],
          ['tert', ['C[C+](C)C', 'CC[C+](C)C', 'CC[C+](C)CC', 'C[C+]1CCCCC1', 'CC(C)[C+](C)C']],
          ['sec', ['C[CH+]C', 'CC[CH+]C', 'CC[CH+]CC', 'C1CC[CH+]CC1', 'CCC[CH+]C']],
          ['prim', ['C[CH2+]', 'CC[CH2+]', 'CCC[CH2+]', 'CC(C)[CH2+]']],
          ['meth', ['[CH3+]']]
        ];
        const n = ctx.int(4, 5);
        const classes = ctx.shuffle(CAT.slice()).slice(0, n).sort((a, b) => CAT.indexOf(a) - CAT.indexOf(b));
        const options = classes.map(c => ({ mol: { smi: ctx.pick(c[1]) } }));
        const conj = classes.some(c => c[0] === 'benzyl' || c[0] === 'allyl');
        const reason = conj
          ? {
            prompt: t('Kodėl alilo ir benzilo katijonai stabilesni už alkilo katijonus?', 'Why are allyl and benzyl cations more stable than alkyl cations?'),
            options: [
              { text: t('Teigiamas krūvis pasiskirsto konjugacijos būdu per $π$ sistemą (rezonansinės formulės).', 'The positive charge is spread over the $π$ system by conjugation (resonance structures).') },
              { text: t('Jie turi daugiau alkilo pakaitų, todėl hiperkonjugacija stipresnė.', 'They have more alkyl groups, so hyperconjugation is stronger.') },
              { text: t('Dvigubas ryšys stipriai stumia elektronus per $σ$ ryšius (+I).', 'The double bond pushes electrons strongly through $σ$ bonds (+I).') },
              { text: t('Jie mažesni, todėl jų sterinė įtampa mažesnė.', 'They are smaller, so their steric strain is lower.') }
            ],
            hint: t('Nupieškite katijoną ir pabandykite parašyti daugiau nei vieną rezonansinę formulę.', 'Draw the cation and try to write more than one resonance structure.'),
            solution: t('Alilo ir benzilo katijone tuščia p orbitalė yra konjuguota su $π$ ryšiu, todėl krūvis pasiskirsto keliuose atomuose. Tai stabilizuoja stipriau nei alkilgrupių hiperkonjugacija.', 'In allyl and benzyl cations the empty p orbital is conjugated with a $π$ bond, so the charge is shared among several atoms. This stabilises more than hyperconjugation by alkyl groups.')
          }
          : {
            prompt: t('Kodėl katijonas stabilesnis, kai prie teigiamos anglies yra daugiau alkilo pakaitų?', 'Why is a cation more stable when it carries more alkyl groups on the positive carbon?'),
            options: [
              { text: t('Kaimyninių $C-H$ ir $C-C$ ryšių elektronai iš dalies persikelia į tuščią p orbitalę (hiperkonjugacija).', 'Electrons of neighbouring $C-H$ and $C-C$ bonds shift partly into the empty p orbital (hyperconjugation).') },
              { text: t('Alkilgrupės traukia elektronus (−I) ir sumažina krūvį.', 'Alkyl groups withdraw electrons (−I) and reduce the charge.') },
              { text: t('Daugiau pakaitų sukuria sterinį barjerą, todėl nukleofilas jungiasi lėčiau.', 'More substituents create a steric barrier, so the nucleophile bonds more slowly.') },
              { text: t('Didesnis katijonas turi daugiau rezonansinių formulių su $π$ ryšiais.', 'A larger cation has more resonance structures with $π$ bonds.') }
            ],
            hint: t('Pagalvokite, kas padeda tuščiai p orbitalei: kaimyniniai ryšiai su elektronais.', 'Think about what helps the empty p orbital: neighbouring bonds that carry electrons.'),
            solution: t('Kiekviena alkilgrupė pasidalija elektronais per $C-H$ ir $C-C$ ryšius su tuščia p orbitale (hiperkonjugacija). Kuo daugiau pakaitų, tuo stipresnis stabilizavimas: tretinis > antrinis > pirminis > metilo.', 'Each alkyl group shares electrons from its $C-H$ and $C-C$ bonds with the empty p orbital (hyperconjugation). The more substituents, the stronger the stabilisation: tertiary > secondary > primary > methyl.')
          };
        return {
          q: [{ p: t('Palyginkite karbokatijonų stabilumą.', 'Compare the stability of these carbocations.') }, { mol: options.map(o => o.mol) }],
          steps: [
            {
              prompt: t('Išdėstykite karbokatijonus nuo stabiliausio iki mažiausiai stabilaus.', 'Put the carbocations in order from most stable to least stable.'),
              kind: 'order', options,
              hint: t('Pirmiausia ieškokite konjuguotų katijonų (alilo, benzilo), tada skaičiuokite alkilo pakaitus.', 'Look first for conjugated cations (allyl, benzyl), then count the alkyl substituents.'),
              solution: t('Eilė: benzilo > alilo > tretinis > antrinis > pirminis > metilo.', 'Order: benzyl > allyl > tertiary > secondary > primary > methyl.')
            },
            { prompt: reason.prompt, kind: 'choice', options: reason.options, answer: 0, hint: reason.hint, solution: reason.solution }
          ],
          why: t('Alkeno prijungimo kryptį lemia tarpinio katijono stabilumas. Stabilumą didina konjugacija (alilo, benzilo) ir hiperkonjugacija su alkilo pakaitais, todėl prijungimas vyksta per labiausiai pakeistą katijoną.',
            'The stability of the intermediate cation decides the direction of addition. Stability grows with conjugation (allyl, benzyl) and with hyperconjugation by alkyl groups, so addition goes through the most substituted cation.'),
          src: 'L7 p9, p10'
        };
      }
    },
    /* ---- hydration ---- */
    {
      id: 'u07.hydr',
      title: t('Vandens prijungimas (hidratacija) $H2O/H+$', 'Water addition (hydration) $H2O/H+$'),
      mirrors: ['S4.5'],
      gen(rng, ctx) {
        const { react } = ctx;
        const sym = rng() < 0.3;
        const p = sym ? pickSym(ctx, ALK_S, 'ae.h2o', {}) : pickUnsym(ctx, ALK_U, 'ae.h2o', {}, true);
        const diol = first(react.run('ox.kmno4.mild', [p.smi], {}));
        const alkane = first(react.run('ae.h2', [p.smi], {}));
        const options = optionList(ctx, p.major, p.minor.concat([diol, alkane]), 4);
        const steps = [];
        if (!sym) {
          steps.push({
            prompt: t('Bakstelėkite anglies atomą, prie kurio prisijungia $OH$ grupė.', 'Tap the carbon that receives the $OH$ group.'),
            kind: 'atoms', mol: { smi: p.smi, opts: { numbers: 'all' } }, answer: [p.xC],
            hint: t('$H+$ jungiasi pirmas. Prie kurios anglies lieka teigiamas krūvis ir kodėl ten jis stabilesnis?', '$H+$ bonds first. Which carbon is left positive, and why is the cation more stable there?'),
            solution: t('Vanduo jungiasi prie atomo Nr. ' + (p.xC + 1) + ', nes ten susidaro ' + LTCLS[p.cls - 1] + ' katijonas.', 'Water bonds to carbon no. ' + (p.xC + 1) + ', because a ' + ENCLS[p.cls - 1] + ' cation forms there.')
          });
        }
        steps.push({
          prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: 'choice', options, answer: 0,
          hint: t('Prijungiama viena vandens molekulė ($H$ ir $OH$).', 'One water molecule adds ($H$ and $OH$).'),
          solution: [{ p: t('$H$ patenka prie atomo su daugiau vandenilių, $OH$ – prie kitos anglies.', '$H$ goes to the carbon with more hydrogens, $OH$ to the other carbon.') }, { mol: { smi: p.major } }]
        });
        const ns = nameStep(ctx, p.major, t('Pavadinkite alkoholį.', 'Name the alcohol.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Alkenas hidratuojamas rūgštyje.', 'An alkene is hydrated in acid.') }, { scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H2SO4') }] } }],
          steps,
          why: t('Rūgštyje $H3O+$ yra elektrofilas, todėl vyksta toks pat dviejų žingsnių AE kaip su $HX$: susidaro stabilesnis katijonas, o jį atakuoja vanduo. Po to prarandamas protonas ir susidaro alkoholis.',
            'In acid $H3O+$ is the electrophile, so the same two-step AE as with $HX$ takes place: the more stable cation forms and water attacks it. A proton is then lost and the alcohol forms.'),
          src: 'L7 p19'
        };
      }
    },
    /* ---- X2 / H2 ---- */
    {
      id: 'u07.x2h2',
      title: t('Halogenai ir vandenilis: produktai', 'Halogens and hydrogen: the products'),
      mirrors: ['S4.4', 'S4.6'],
      gen(rng, ctx) {
        const { react } = ctx;
        const smi = ctx.pick(ALK_ALL);
        const mode = ctx.pick(['Br', 'Cl', 'H2']);
        const hx = (() => { try { const r = react.run('ae.hx', [smi], { X: mode === 'Cl' ? 'Cl' : 'Br' }); return r.products.find(x => x.major).smi; } catch (e) { return null; } })();
        const diol = first(react.run('ox.kmno4.mild', [smi], {}));
        const alkane = first(react.run('ae.h2', [smi], {}));
        const dihalide = mode === 'H2' ? first(react.run('ae.x2', [smi], { X: 'Br' })) : first(react.run('ae.x2', [smi], { X: mode }));
        const right = mode === 'H2' ? alkane : dihalide;
        const wrong = mode === 'H2' ? [dihalide, hx, diol] : [hx, diol, alkane];
        const options = optionList(ctx, right, wrong, 4);
        const above = mode === 'H2' ? 'H2, Pd' : mode + '2';
        const steps = [{
          prompt: t('Koks yra produktas?', 'What is the product?'),
          kind: 'choice', options, answer: 0,
          hint: mode === 'H2'
            ? t('Kiek vandenilio atomų prisijungia ir kas atsitinka su $C=C$?', 'How many hydrogen atoms add, and what happens to the $C=C$?')
            : t('Kiek halogeno atomų prisijungia ir prie kurių anglies atomų?', 'How many halogen atoms add, and to which carbons?'),
          solution: [{ p: mode === 'H2' ? t('$π$ ryšys virsta dviem $C-H$ ryšiais: gaunamas alkanas.', 'The $π$ bond becomes two $C-H$ bonds: an alkane.') : t('Du halogeno atomai jungiasi prie abiejų $C=C$ atomų: gaunamas vicinalinis dihalogenidas.', 'Two halogen atoms bond to the two $C=C$ carbons: a vicinal dihalide.') }, { mol: { smi: right } }]
        }];
        if (mode === 'Br') {
          steps.push({
            prompt: t('Ką pastebėsite, alkeną supylę su bromo vandeniu?', 'What do you observe when the alkene is mixed with bromine water?'),
            kind: 'choice',
            options: [
              { text: t('Oranžinis tirpalas tampa bespalvis.', 'The orange solution turns colourless.') },
              { text: t('Tirpalas lieka oranžinis.', 'The solution stays orange.') },
              { text: t('Tirpalas tampa violetinis.', 'The solution turns violet.') },
              { text: t('Iškrenta rudos nuosėdos.', 'A brown precipitate forms.') }
            ],
            answer: 0,
            hint: t('Kas atsitinka su $Br2$, kai jis prisijungia?', 'What happens to the $Br2$ when it adds?'),
            solution: t('$Br2$ sunaudojamas, o dibromidas bespalvis, todėl oranžinė spalva išnyksta.', '$Br2$ is used up and the dibromide is colourless, so the orange colour disappears.')
          });
        }
        const ns = nameStep(ctx, right);
        if (ns) steps.push(ns);
        return {
          q: [{ scheme: { items: [{ smi }, { arrow: '→', above: f(above) }] } }],
          steps,
          why: mode === 'H2'
            ? t('Su $H2$ ir metalo katalizatoriumi dvigubas ryšys prisotinamas: gaunamas alkanas su tuo pačiu anglies skeletu. Tai redukcija, kurios nežymime AE.', 'With $H2$ and a metal catalyst the double bond is saturated: an alkane with the same carbon skeleton results. This is a reduction and we do not label it AE.')
            : t('Halogenas prijungiamas prie abiejų $C=C$ atomų (AE per bromonio joną), todėl gaunamas dihalogenidas, o ne HX produktas. Tai ir dvigubo ryšio atpažinimo reakcija.', 'The halogen adds to both $C=C$ carbons (AE through a bromonium ion), so a dihalide forms, not the HX product. This is also the test reaction for a double bond.'),
          src: mode === 'H2' ? 'L7 p20' : 'L7 p6'
        };
      }
    },
    /* ---- EWG ---- */
    {
      id: 'u07.ewg',
      title: t('Elektronų akceptorinis pakaitas: išimtis', 'An electron-withdrawing group: the exception'),
      mirrors: ['S4.13'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const POOL = [
          ['C=CC(=O)O', 0, 1], ['C=CC#N', 0, 1], ['C=CC=O', 0, 1], ['C=CC(C)=O', 0, 1], ['C=CC(=O)OC', 0, 1], ['C=CC(F)(F)F', 0, 1],
          ['CC=CC(=O)O', 1, 2], ['C=CC(N)=O', 0, 1]
        ];
        for (let k = 0; k < 40; k++) {
          const [smi, nu, h] = ctx.pick(POOL);
          const hx = ctx.pick(['Cl', 'Br', 'I', 'OH']);
          const res = hx === 'OH' ? react.run('ae.h2o', [smi], {}) : react.run('ae.hx', [smi], { X: hx });
          const majors = res.products.filter(x => x.major);
          if (majors.length !== 1) continue;
          const mine = adduct(smi, h, nu, hx === 'OH' ? 'O' : hx);
          if (!mine || !chem.same(mine, majors[0].smi, { stereo: false })) continue;
          const wrong = res.products.filter(x => !x.major).map(x => x.smi);
          const alkane = first(react.run('ae.h2', [smi], {}));
          const dihalide = hx === 'OH' ? first(react.run('ox.kmno4.mild', [smi], {})) : first(react.run('ae.x2', [smi], { X: hx }));
          const options = optionList(ctx, majors[0].smi, wrong.concat([dihalide, alkane]), 4);
          const reag = hx === 'OH' ? { smi: 'O' } : { smi: hx };
          const steps = [
            {
              prompt: t('Bakstelėkite anglies atomą, prie kurio prisijungs nukleofilas.', 'Tap the carbon to which the nucleophile will bond.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: [nu],
              hint: t('Prie $C=C$ yra elektronų akceptorinė grupė. Kur katijonas būtų destabilizuotas?', 'The $C=C$ carries an electron-withdrawing group. Where would a cation be destabilised?'),
              solution: t('Grupė destabilizuoja katijoną gretimame atome, todėl $H+$ jungiasi prie atomo Nr. ' + (h + 1) + ', o nukleofilas – prie atomo Nr. ' + (nu + 1) + '.', 'The group destabilises a cation on the adjacent carbon, so $H+$ bonds to carbon no. ' + (h + 1) + ' and the nucleophile to carbon no. ' + (nu + 1) + '.')
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options, answer: 0,
              hint: t('Atsimintina: tai išimtis iš Markovnikovo taisyklės.', 'Remember: this is the exception to Markovnikov’s rule.'),
              solution: [{ p: t('Nukleofilas patenka prie anglies, nutolusios nuo akceptorinės grupės.', 'The nucleophile ends up on the carbon away from the withdrawing group.') }, { mol: { smi: majors[0].smi } }]
            },
            {
              prompt: t('Kodėl produktas prieštarauja Markovnikovo taisyklei?', 'Why does the product go against Markovnikov’s rule?'),
              kind: 'choice',
              options: [
                { text: t('Akceptorinė grupė destabilizuoja katijoną prie savęs, todėl nukleofilas jungiasi prie tolimesnės anglies.', 'The withdrawing group destabilises a cation next to it, so the nucleophile bonds to the farther carbon.') },
                { text: t('Grupė skatina elektronus į dvigubą ryšį ir stabilizuoja katijoną prie savęs.', 'The group pushes electrons into the double bond and stabilises a cation next to it.') },
                { text: t('Pirmiausia prisijungia nukleofilas, o ne $H+$.', 'The nucleophile adds first, not $H+$.') },
                { text: t('Markovnikovo taisyklė visada galioja, o vandenilių skaičiaus skirtumas čia nesvarbus.', 'Markovnikov’s rule always applies; the hydrogen count does not matter here.') }
              ],
              answer: 0,
              hint: t('Palyginkite katijoną prie grupės ir katijoną toliau nuo jos.', 'Compare the cation next to the group with the cation farther from it.'),
              solution: t('Karbonilo, nitrilo ar $CF3$ grupė traukia elektronus, todėl gretimas teigiamas krūvis yra nepalankus. Todėl nukleofilas jungiasi prie anglies, esančios toliau.', 'A carbonyl, nitrile or $CF3$ group withdraws electrons, so an adjacent positive charge is unfavourable. The nucleophile therefore bonds to the carbon farther away.')
            }
          ];
          return {
            q: [{ scheme: { items: [{ smi }, { plus: true }, reag, hx === 'OH' ? { arrow: '→', above: f('H+') } : { arrow: '→' }] } }],
            steps,
            why: t('Markovnikovo taisyklė remiasi katijono stabilumu, o elektronų akceptorinis pakaitas ($COOH$, $CN$, $C=O$, $CF3$) destabilizuoja gretimą teigiamą anglį. Todėl $H$ patenka prie atomo su grupe, o nukleofilas – prie tolimesnio atomo.',
              'Markovnikov’s rule rests on cation stability, and an electron-withdrawing group ($COOH$, $CN$, $C=O$, $CF3$) destabilises the adjacent positive carbon. So $H$ goes to the carbon with the group and the nucleophile to the farther carbon.'),
            src: 'S4.13'
          };
        }
        throw new Error('u07.ewg: no problem');
      }
    },
    /* ---- KMnO4 ---- */
    {
      id: 'u07.kmno4',
      title: t('Alkenų oksidavimas $KMnO4$: diolis ar skilimas', 'Oxidation with $KMnO4$: diol or cleavage'),
      mirrors: ['S4.6', 'S4.14'],
      gen(rng, ctx) {
        const POOL = ['CC(C)=CC', 'CCC=C', 'C=C1CCCCC1', 'C1=CCCCC1', 'CC=CCC', 'CC(C)=CCC', 'CCC(C)=CC', 'CCCC=C', 'CC=CCCC', 'CC1=CCCCC1', 'C=C1CCCC1', 'CC(C)=C', 'CCC=CCC', 'CCC(C)=C', 'CC(C)=C(C)C'];
        const { react } = ctx;
        const smi = ctx.pick(POOL);
        const harsh = rng() < 0.5;
        const diol = first(react.run('ox.kmno4.mild', [smi], {}));
        const prods = harshProducts(ctx, smi);
        const alkane = first(react.run('ae.h2', [smi], {}));
        const alcohol = (() => { try { return first(react.run('ae.h2o', [smi], {})); } catch (e) { return null; } })();
        let opts;
        if (harsh) {
          const cands = [{ mol: { smi: diol } }];
          const siblings = ctx.shuffle(POOL.slice()).filter(s => s !== smi).map(s => harshProducts(ctx, s))
            .filter(ps => ps.some(x => prods.some(y => canon(ctx, x) === canon(ctx, y))) && ps.map(x => canon(ctx, x)).sort().join() !== prods.map(x => canon(ctx, x)).sort().join());
          siblings.slice(0, 2).forEach(ps => cands.push(setOption(ps)));
          cands.push({ mol: { smi: alcohol || alkane } });
          opts = [setOption(prods)].concat(cands).slice(0, 4);
        } else {
          opts = [{ mol: { smi: diol } }, setOption(prods), { mol: { smi: alcohol || alkane } }, { mol: { smi: alkane } }];
          const seen = new Set();
          opts = opts.filter(o => { const k = JSON.stringify(o); if (seen.has(k)) return false; seen.add(k); return true; });
        }
        const cond = harsh ? { above: 'KMnO4, H3O+', below: f('t°') } : { above: 'KMnO4, OH-, H2O', below: t('šaltas', 'cold') };
        const steps = [
          {
            prompt: t('Ką parodo reakcijos sąlygos?', 'What do the conditions tell you?'),
            kind: 'choice',
            options: [
              { text: t('Švelnus oksidavimas: $C=C$ tampa $C-C$, susidaro 1,2-diolis.', 'Mild oxidation: $C=C$ becomes $C-C$ and a 1,2-diol forms.') },
              { text: t('Oksidacinis skilimas: $C=C$ ryšys nutrūksta.', 'Oxidative cleavage: the $C=C$ bond is broken.') },
              { text: t('Hidratacija: prisijungia vanduo pagal Markovnikovo taisyklę.', 'Hydration: water adds according to Markovnikov’s rule.') },
              { text: t('Hidrinimas: susidaro alkanas.', 'Hydrogenation: an alkane forms.') }
            ],
            answer: harsh ? 1 : 0,
            hint: t('Palyginkite terpę ir temperatūrą: šalta ir šarminė ar rūgštinė ir kaitinama?', 'Compare medium and temperature: cold and alkaline, or acidic and hot?'),
            solution: harsh ? t('Rūgštinė terpė ir kaitinimas – griežtos sąlygos: $C=C$ skyla.', 'Acidic medium and heating are harsh conditions: the $C=C$ is cleaved.') : t('Šalta šarminė terpė – švelnios sąlygos: $C=C$ lieka kaip $C-C$ ir susidaro diolis.', 'A cold alkaline medium is mild: the $C=C$ remains as $C-C$ and a diol forms.')
          },
          {
            prompt: t('Kokie yra produktai?', 'What are the products?'),
            kind: 'choice', options: opts, answer: 0,
            hint: harsh ? t('Kiekvienas dvigubo ryšio atomas virsta karbonilo anglimi: ketonu, rūgštimi ar $CO2$.', 'Each double-bond carbon becomes a carbonyl carbon: a ketone, an acid or $CO2$.') : t('Prie kiekvieno $C=C$ atomo prisijungia po $OH$.', 'An $OH$ bonds to each $C=C$ carbon.'),
            solution: [{ p: harsh ? t('=CR₂ virsta ketonu, =CH–R rūgštimi, =CH₂ – $CO2$.', '=CR₂ becomes a ketone, =CH–R an acid, =CH₂ becomes $CO2$.') : t('Abu atomai gauna po $OH$.', 'Both carbons receive an $OH$.') }, setOption(harsh ? prods : [diol])]
          }
        ];
        if (!harsh) {
          steps.push({
            prompt: t('Ką pastebėsite reakcijos metu?', 'What do you observe?'),
            kind: 'choice',
            options: [
              { text: t('Violetinė spalva išnyksta, iškrenta rudos nuosėdos.', 'The violet colour fades and a brown precipitate forms.') },
              { text: t('Tirpalas lieka violetinis.', 'The solution stays violet.') },
              { text: t('Oranžinė spalva išnyksta.', 'The orange colour fades.') },
              { text: t('Išsiskiria dujos, tirpalas tampa žalias.', 'A gas is released and the solution turns green.') }
            ],
            answer: 0,
            hint: t('Į kokį junginį redukuojasi $MnO4-$ šarminėje terpėje?', 'What does $MnO4-$ get reduced to in alkaline medium?'),
            solution: t('$MnO4-$ virsta rudu $MnO2$, todėl violetinė spalva išnyksta ir iškrenta rudos nuosėdos.', '$MnO4-$ is reduced to brown $MnO2$, so the violet colour fades and brown solid precipitates.')
          });
        }
        return {
          q: [{ scheme: { items: [{ smi }, { arrow: '→', above: f(cond.above), below: cond.below }] } }],
          steps,
          why: harsh
            ? t('Griežtomis sąlygomis (rūgštinė terpė, kaitinimas) $KMnO4$ nutraukia $C=C$ ryšį. Skaitykite pagal pakaitus: =CR₂ duoda ketoną, =CH–R rūgštį, =CH₂ – $CO2$. Diolis būtų tik tarpinis, neišlaikantis tokio oksidavimo.', 'Under harsh conditions (acid, heat) $KMnO4$ breaks the $C=C$ bond. Read it by substituents: =CR₂ gives a ketone, =CH–R an acid, =CH₂ gives $CO2$. A diol would be only an intermediate that does not survive such oxidation.')
            : t('Šaltame šarminiame arba neutraliame $KMnO4$ į kiekvieną $C=C$ atomą įvedamas $OH$, o anglies skeletas išlieka: gaunamas 1,2-diolis. Spalvos kaita (violetinė → rudas $MnO2$) rodo dvigubą ryšį.', 'Cold alkaline or neutral $KMnO4$ puts an $OH$ on each $C=C$ carbon and keeps the carbon skeleton: a 1,2-diol. The colour change (violet → brown $MnO2$) signals a double bond.'),
          src: harsh ? 'L7 p24' : 'L7 p23'
        };
      }
    },
    /* ---- back to the alkene ---- */
    {
      id: 'u07.back',
      title: t('Nuo $KMnO4$ produktų atgal prie alkeno', 'Back from the $KMnO4$ products to the alkene'),
      mirrors: ['S4.14'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const POOL = ['CC(C)=CC', 'CCC=C', 'C=C1CCCCC1', 'C1=CCCCC1', 'CC=CCC', 'CC(C)=CCC', 'CCC(C)=CC', 'CCCC=C', 'CC=CCCC', 'CC1=CCCCC1', 'C=C1CCCC1', 'CC(C)=C', 'CCC=CCC', 'CCC(C)=C', 'CC(C)=C(C)C', 'CC(C)=CCCC'];
        const smi = ctx.pick(POOL);
        const prods = harshProducts(ctx, smi);
        const key = ps => ps.map(x => canon(ctx, x)).sort().join();
        const joined = prods.join('.');
        const jm = chem.parse(joined);
        const carbonyl = [];
        jm.atoms.forEach((a, i) => { if (a.el === 'C' && jm.nbr[i].some(j => jm.atoms[j].el === 'O' && jm.bondAt(i, j).order === 2)) carbonyl.push(i); });
        if (!carbonyl.length) throw new Error('u07.back: no carbonyl');
        const sib = ctx.shuffle(POOL.slice()).filter(s => s !== smi && key(harshProducts(ctx, s)) !== key(prods));
        sib.sort((a, b) => harshProducts(ctx, b).filter(x => prods.some(y => canon(ctx, x) === canon(ctx, y))).length - harshProducts(ctx, a).filter(x => prods.some(y => canon(ctx, x) === canon(ctx, y))).length);
        const options = optionList(ctx, smi, sib, 4);
        const steps = [
          {
            prompt: t('Bakstelėkite anglies atomus, kurie buvo dvigubo ryšio atomai.', 'Tap the carbons that were the double-bond carbons.'),
            kind: 'atoms', mol: { smi: joined, opts: { numbers: 'all' } }, answer: carbonyl,
            hint: t('Dvigubas ryšys nutrūko ten, kur dabar yra $C=O$.', 'The double bond was cut where a $C=O$ is now.'),
            solution: t('Visi $C=O$ anglies atomai (' + carbonyl.map(i => i + 1).join(', ') + ') buvo dvigubo ryšio atomai.', 'All the $C=O$ carbons (' + carbonyl.map(i => i + 1).join(', ') + ') were double-bond carbons.')
          },
          {
            prompt: t('Kuris alkenas buvo oksiduotas?', 'Which alkene was oxidised?'),
            kind: 'choice', options, answer: 0,
            hint: t('Sujunkite dvi $C=O$ anglis dvigubu ryšiu: ketono ir rūgšties atomus arba vieno produkto dvi anglis.', 'Join two $C=O$ carbons with a double bond: those of the ketone and the acid, or two carbons of one product.'),
            solution: [{ p: t('Atkūrus $C=C$ ten, kur buvo $C=O$, gaunamas alkenas.', 'Restoring the $C=C$ where the $C=O$ groups are gives the alkene.') }, { mol: { smi } }]
          }
        ];
        const ns = nameStep(ctx, smi, t('Pavadinkite alkeną.', 'Name the alkene.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Alkeną oksiduojant $KMnO4$ rūgštinėje terpėje kaitinant gauti šie produktai.', 'Oxidising an alkene with $KMnO4$ in hot acid gave these products.') },
            { scheme: { items: [{ arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }].concat(prods.reduce((a, s, i) => a.concat(i ? [{ plus: true }] : [], [{ smi: s }]), [])) } }],
          steps,
          why: t('Skilimo produktai nurodo, kur buvo dvigubas ryšys: kiekvienas $C=O$ anglies atomas yra buvęs $C=C$ atomas. Ketonas rodo atomą =CR₂, rūgštis – =CH–R, $CO2$ – galinį =CH₂.', 'The cleavage products show where the double bond was: every $C=O$ carbon was a $C=C$ carbon. A ketone points to =CR₂, an acid to =CH–R, $CO2$ to a terminal =CH₂.'),
          src: 'L7 p28, S4.14'
        };
      }
    },
    /* ---- one alkene, several reagents ---- */
    {
      id: 'u07.fate',
      title: t('Vienas alkenas, keli reagentai', 'One alkene, several reagents'),
      mirrors: ['S4.6', 'S4.14'],
      gen(rng, ctx) {
        const { react } = ctx;
        const smi = (() => { for (let k = 0; k < 60; k++) { const s = ctx.pick(ALK_U); if (!react.wouldRearrange(s)) return s; } throw new Error('u07.fate'); })();
        const R = [
          { l: t('$HBr$', '$HBr$'), o: () => { const r = react.run('ae.hx', [smi], { X: 'Br' }); const m = r.products.filter(x => x.major); return m.length === 1 ? [m[0].smi] : null; } },
          { l: t('$H2O$, $H+$', '$H2O$, $H+$'), o: () => { const r = react.run('ae.h2o', [smi], {}); const m = r.products.filter(x => x.major); return m.length === 1 ? [m[0].smi] : null; } },
          { l: t('$Br2$', '$Br2$'), o: () => [first(react.run('ae.x2', [smi], { X: 'Br' }))] },
          { l: t('$H2$, $Pd$', '$H2$, $Pd$'), o: () => [first(react.run('ae.h2', [smi], {}))] },
          { l: t('$KMnO4$, $OH-$ (šaltas)', '$KMnO4$, $OH-$ (cold)'), o: () => [first(react.run('ox.kmno4.mild', [smi], {}))] },
          { l: t('$KMnO4$, $H3O+$, $t°$', '$KMnO4$, $H3O+$, $t°$'), o: () => harshProducts(ctx, smi) }
        ];
        const chosen = ctx.shuffle(R.slice()).slice(0, 4);
        const outs = chosen.map(r => r.o());
        if (outs.some(o => !o)) return gen_retry();
        const keys = outs.map(o => o.map(x => canon(ctx, x)).sort().join('+'));
        if (new Set(keys).size !== 4) return gen_retry();
        function gen_retry() { return TYPES_GEN.find(x => x.id === 'u07.fate').gen(rng, ctx); }
        return {
          q: [{ p: t('Šis alkenas reaguoja su skirtingais reagentais.', 'This alkene reacts with different reagents.') }, { mol: { smi } }],
          steps: [{
            prompt: t('Suporuokite reagentą su pagrindiniu produktu.', 'Match each reagent with its main product.'),
            kind: 'match',
            answer: { left: chosen.map(r => ({ text: r.l })), right: outs.map(o => setOption(o)), pairs: [0, 1, 2, 3] },
            hint: t('Pirmiausia išskirkite reagentus, kurie nutraukia $C=C$, tuos, kurie jį palieka, ir tuos, kurie prijungia $H$ ir $X$ nevienodai.', 'First separate the reagents that cleave the $C=C$, those that keep it, and those that add $H$ and $X$ unevenly.'),
            solution: t('$HBr$ ir $H2O/H+$ jungiasi pagal Markovnikovo taisyklę; $Br2$ ir $KMnO4$ (šaltas) prijungia po vieną grupę prie abiejų atomų; $H2$ duoda alkaną; karštas rūgštinis $KMnO4$ skaido ryšį.', '$HBr$ and $H2O/H+$ add by Markovnikov’s rule; $Br2$ and cold $KMnO4$ put one group on each carbon; $H2$ gives the alkane; hot acidic $KMnO4$ cleaves the bond.')
          }],
          why: t('Reagentas nusprendžia, kas atsitinka su $C=C$: elektrofilai ($HX$, $H3O+$) jungiasi per katijoną, halogenas prijungiamas prie abiejų atomų, $H2$ prisotina, o $KMnO4$ oksiduoja – švelniai iki diolio arba griežtai iki skilimo.', 'The reagent decides what happens to the $C=C$: electrophiles ($HX$, $H3O+$) add through a cation, a halogen adds to both carbons, $H2$ saturates, and $KMnO4$ oxidises – mildly to a diol or harshly to cleavage.'),
          src: 'L7 p27'
        };
      }
    },
    /* ---- peroxides ---- */
    {
      id: 'u07.radical',
      title: t('$HBr$ su peroksidais ir be jų', '$HBr$ with and without peroxides'),
      mirrors: [],
      gen(rng, ctx) {
        const { react } = ctx;
        const perox = rng() < 0.5;
        const p = pickUnsym(ctx, ALK_U, 'ae.hx', { X: 'Br' }, true);
        const res = react.run('ae.hx', [p.smi], { X: 'Br', peroxide: perox });
        const majors = res.products.filter(x => x.major);
        if (majors.length !== 1) return TYPES_GEN.find(x => x.id === 'u07.radical').gen(rng, ctx);
        const right = majors[0].smi;
        const other = res.products.filter(x => !x.major).map(x => x.smi);
        const options = optionList(ctx, right, other.concat([first(react.run('ae.x2', [p.smi], { X: 'Br' })), first(react.run('ae.h2', [p.smi], {}))]), 4);
        return {
          q: [{ scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: 'Br' }, (perox ? { arrow: '→', above: f('HBr'), below: f('ROOR') } : { arrow: '→', above: f('HBr') })] } }],
          steps: [
            {
              prompt: t('Koks mechanizmas vyksta?', 'Which mechanism takes place?'),
              kind: 'choice',
              options: [{ text: t('AE', 'AE') }, { text: t('AR', 'AR') }, { text: t('SR', 'SR') }, { text: t('AN', 'AN') }],
              answer: perox ? 1 : 0,
              hint: t('Ar yra peroksidų, kurie sudaro radikalus?', 'Are peroxides present to make radicals?'),
              solution: perox ? t('Su peroksidais vyksta radikalinis prijungimas, AR.', 'With peroxides a radical addition, AR, takes place.') : t('Be peroksidų vyksta elektrofilinis prijungimas, AE.', 'Without peroxides an electrophilic addition, AE, takes place.')
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options, answer: 0,
              hint: perox ? t('Kuris radikalas stabilesnis: gautas prisijungus $Br•$ prie vieno ar kito atomo?', 'Which radical is more stable: the one from $Br•$ adding to one carbon or to the other?') : t('Palyginkite galimus karbokatijonus.', 'Compare the possible carbocations.'),
              solution: [{ p: perox ? t('$Br•$ jungiasi prie atomo, kad susidarytų stabilesnis radikalas; $Br$ atsiduria ties atomu su daugiau vandenilių (prieš Markovnikovo taisyklę).', '$Br•$ bonds so that the more stable radical forms; $Br$ ends up on the carbon with more hydrogens (against Markovnikov’s rule).') : t('Halogenas jungiasi prie stabilesnio katijono anglies (Markovnikovo taisyklė).', 'The halogen bonds to the carbon of the more stable cation (Markovnikov’s rule).') }, { mol: { smi: right } }]
            }
          ],
          why: t('Be peroksidų HBr jungiasi per karbokatijoną (AE) pagal Markovnikovo taisyklę. Su peroksidais sudaromi $Br•$ radikalai: jie jungiasi pirmi, ir kryptį lemia radikalo, o ne katijono stabilumas, todėl produktas yra priešingas. Tai galioja tik HBr.',
            'Without peroxides HBr adds through a carbocation (AE) following Markovnikov’s rule. With peroxides $Br•$ radicals form and add first; the radical, not the cation, decides the direction, so the product is the opposite one. This holds only for HBr.'),
          src: 'L7 p13, p14'
        };
      }
    },
    /* ---- names ---- */
    {
      id: 'u07.name',
      title: t('Alkenų pavadinimai ir struktūros', 'Names and structures of alkenes'),
      mirrors: [],
      gen(rng, ctx) {
        const { name, chem } = ctx;
        const POOL = ALK_ALL.concat(['CC(C)C=CC', 'CCCCC=C', 'CC=CC(C)C', 'C=CC(C)CC', 'CC(C)C=C', 'C1=CCCC1C', 'CC1=CC(C)CCC1', 'CCC=C']);
        const smi = ctx.pick(POOL);
        const nm = { lt: name.name(smi, { lang: 'lt' }), en: name.name(smi, { lang: 'en' }) };
        if (!nm.lt || !nm.en) return TYPES_GEN.find(x => x.id === 'u07.name').gen(rng, ctx);
        if (rng() < 0.6) {
          return {
            q: [{ mol: { smi } }],
            steps: [
              {
                prompt: t('Bakstelėkite dvigubo ryšio anglies atomus.', 'Tap the carbons of the double bond.'),
                kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, from: 'hyb:sp2',
                hint: t('Dvigubo ryšio anglies atomai yra sp² hibridizuoti.', 'The double-bond carbons are sp² hybridised.'),
                solution: t('Šiuos du sp² atomus jungia $C=C$.', 'These two sp² carbons are joined by the $C=C$.')
              },
              {
                prompt: t('Pavadinkite alkeną.', 'Name the alkene.'),
                kind: 'name', mol: { smi }, answer: { smi },
                hint: t('Ilgiausia grandinė turi apimti $C=C$; numeruokite nuo galo, arčiau dvigubo ryšio.', 'The longest chain must contain the $C=C$; number from the end nearer to the double bond.'),
                solution: t(nm.lt.name, nm.en.name)
              }
            ],
            why: t('Pagrindinė grandinė turi apimti dvigubą ryšį, numeruojama nuo galo, arčiau kurio jis yra, o pavadinimas baigiasi -enas su dvigubo ryšio numeriu. Pakaitų numeriai skaičiuojami pagal tą pačią numeraciją.',
              'The main chain must contain the double bond and is numbered from the end nearer to it; the name ends in -ene with the locant of the double bond. Substituent locants follow the same numbering.'),
            src: 'L7 p2'
          };
        }
        const f = chem.formulaString(chem.parse(smi));
        const same = ctx.shuffle(POOL.slice()).filter(s => s !== smi && (() => { try { return chem.formulaString(chem.parse(s)) === f; } catch (e) { return false; } })());
        const rest = ctx.shuffle(POOL.slice()).filter(s => s !== smi);
        const options = optionList(ctx, smi, same.concat(rest), 4);
        return {
          q: [{ p: t('Pasirinkite struktūrą, atitinkančią pavadinimą: ' + nm.lt.name + '.', 'Choose the structure that matches the name: ' + nm.en.name + '.') }],
          steps: [{
            prompt: t('Kuri struktūra atitinka pavadinimą?', 'Which structure matches the name?'),
            kind: 'choice', options, answer: 0,
            hint: t('Suraskite pagrindinę grandinę, dvigubo ryšio vietą ir pakaitus.', 'Find the main chain, the position of the double bond and the substituents.'),
            solution: [{ p: t('Pavadinime nurodyta grandinė, dvigubo ryšio numeris ir pakaitai.', 'The name gives the chain, the locant of the double bond and the substituents.') }, { mol: { smi } }]
          }],
          why: t('Skaitykite pavadinimą iš galo: -enas rodo dvigubą ryšį, prieš jį esantis skaičius – jo vietą, o pradžioje esantys pakaitai ir jų numeriai nusako šonines grupes.', 'Read the name from the end: -ene shows the double bond, the number before it its position, and the prefixes with their numbers give the side groups.'),
          src: 'L7 p2'
        };
      }
    }
  ];

  /* ================= bank types ================= */
  const tx = (lt, en) => ({ text: t(lt, en) });

  const WHY = [
    {
      id: 'u07.why.1',
      q: [{ p: t('1-pentenas reaguoja su HBr.', '1-Pentene reacts with HBr.') }, { scheme: { items: [{ smi: 'CCCC=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
      steps: [
        {
          prompt: t('Kuris karbokatijonas susidaro?', 'Which carbocation forms?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC[CH+]C' } }, { mol: { smi: 'CCCC[CH2+]' } }, tx('Abu susidaro vienodai greitai.', 'Both form equally fast.')], answer: 0,
          hint: t('Palyginkite, kiek anglies atomų prisijungę prie teigiamo atomo.', 'Compare how many carbons are attached to the positive carbon.'),
          solution: t('$H+$ jungiasi prie galinio $CH2$, o teigiamas krūvis lieka ant antrojo atomo: tai antrinis katijonas, stabilesnis už pirminį.', '$H+$ bonds to the terminal $CH2$ and the positive charge stays on carbon 2: a secondary cation, more stable than the primary one.')
        },
        {
          prompt: t('Kas nulemia šios reakcijos kryptį?', 'What determines the direction of this reaction?'),
          kind: 'choice',
          options: [
            tx('Tarpinio karbokatijono stabilumas: susidaro stabilesnis (antrinis) katijonas.', 'The stability of the intermediate carbocation: the more stable (secondary) cation forms.'),
            tx('Steriniai trukdžiai: bromidas jungiasi prie mažiau užimtos anglies.', 'Steric hindrance: bromide bonds to the less crowded carbon.'),
            tx('Pirminis katijonas stabilesnis, nes turi mažiau pakaitų.', 'The primary cation is more stable because it has fewer substituents.'),
            tx('Atsitiktinumas: abu produktai susidaro vienodai.', 'Chance: both products form equally.')
          ],
          answer: 0,
          hint: t('Kuris žingsnis lėtas ir nustato produktą?', 'Which step is slow and fixes the product?'),
          solution: t('Lėtame žingsnyje susidaro karbokatijonas; stabilesnio katijono kelias greitesnis, todėl vyrauja 2-brompentanas.', 'The slow step forms the carbocation; the path through the more stable cation is faster, so 2-bromopentane predominates.')
        }
      ],
      why: t('Kryptį lemia ne produkto tipas, o tarpinio katijono stabilumas. Antrinis katijonas turi daugiau alkilo pakaitų nei pirminis, todėl susidaro greičiau ir duoda 2-brompentaną.', 'The direction is set not by the product but by the stability of the intermediate cation. A secondary cation has more alkyl groups than a primary one, so it forms faster and gives 2-bromopentane.'),
      src: 'S4.12',
      claims: [{ react: ['ae.hx', ['CCCC=C'], { X: 'Br' }, 'CCCC(C)Br'] }]
    },
    {
      id: 'u07.why.2',
      q: [{ p: t('2-pentenas reaguoja su HBr.', '2-Pentene reacts with HBr.') }, { scheme: { items: [{ smi: 'CC=CCC' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
      steps: [
        {
          prompt: t('Kiek produktų susidaro panašiu kiekiu ir kodėl?', 'How many products form in comparable amounts, and why?'),
          kind: 'choice',
          options: [
            tx('Du: abu galimi katijonai yra antriniai ir panašiai stabilūs.', 'Two: both possible cations are secondary and similarly stable.'),
            tx('Vienas: Markovnikovo taisyklė visada duoda tik vieną produktą.', 'One: Markovnikov’s rule always gives a single product.'),
            tx('Du: vienas katijonas pirminis, kitas antrinis.', 'Two: one cation is primary and the other secondary.'),
            tx('Trys: be to, prisijungia antra HBr molekulė.', 'Three: a second HBr molecule also adds.')
          ],
          answer: 0,
          hint: t('Nubraižykite katijoną, kai $H+$ jungiasi prie kiekvieno dvigubo ryšio atomo.', 'Draw the cation for $H+$ adding to each double-bond carbon.'),
          solution: t('Kiekvienas dvigubo ryšio atomas turi po vieną vandenilį ir po vieną alkilo pakaitą, todėl abu katijonai antriniai. Gaunamas 2- ir 3-brompentano mišinys.', 'Each double-bond carbon has one hydrogen and one alkyl group, so both cations are secondary. A mixture of 2- and 3-bromopentane results.')
        },
        {
          prompt: t('Pažymėkite abu produktus, kurie susidaro.', 'Select both products that form.'),
          kind: 'multi',
          options: [{ mol: { smi: 'CCCC(C)Br' } }, { mol: { smi: 'CCC(Br)CC' } }, { mol: { smi: 'CCCCCBr' } }, { mol: { smi: 'CCC(Br)C(C)Br' } }],
          answer: [0, 1],
          hint: t('Halogenas atsiduria ten, kur buvo teigiamas krūvis.', 'The halogen ends up where the positive charge was.'),
          solution: t('2-brompentanas (katijonas ties atomu 2) ir 3-brompentanas (katijonas ties atomu 3). 1-brompentanui reikėtų pirminio katijono, o dibromidas – antros HBr molekulės.', '2-Bromopentane (cation at carbon 2) and 3-bromopentane (cation at carbon 3). 1-Bromopentane would need a primary cation, and a dibromide a second HBr.')
        }
      ],
      why: t('Kai abu katijonai vienodos klasės, Markovnikovo taisyklė negali pasirinkti: susidaro abiejų izomerų mišinys. Taisyklė veikia tik tada, kai vienas katijonas stabilesnis.', 'When both cations are of the same class, Markovnikov’s rule cannot choose: a mixture of both isomers forms. The rule only picks a winner when one cation is more stable.'),
      src: 'S4.12, L7 p12'
    },
    {
      id: 'u07.why.3',
      q: [{ p: t('Norima sintetinti 3-bromheksaną iš alkeno ir HBr.', 'You want to make 3-bromohexane from an alkene and HBr.') }, { mol: { smi: 'CCC(Br)CCC' } }],
      steps: [
        {
          prompt: t('Kuris alkenas tinkamesnis, kad gautųsi tik šis produktas?', 'Which alkene is better if only this product should form?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC=CCC' } }, { mol: { smi: 'CC=CCCC' } }, { mol: { smi: 'C=CCCCC' } }], answer: 0,
          hint: t('Nubraižykite katijonus, kuriuos gali sudaryti kiekvienas alkenas.', 'Draw the cations that each alkene can form.'),
          solution: t('3-heksenas gali sudaryti tik vieną katijoną (ties atomu 3), o 2-heksenas – du, todėl duotų ir 2-bromheksaną.', '3-Hexene can form only one cation (at carbon 3), whereas 2-hexene forms two and would also give 2-bromohexane.')
        },
        {
          prompt: t('Kodėl 2-heksenas netinka?', 'Why is 2-hexene unsuitable?'),
          kind: 'choice',
          options: [
            tx('Abu jo katijonai antriniai, todėl susidaro 2- ir 3-bromheksano mišinys.', 'Both of its cations are secondary, so a mixture of 2- and 3-bromohexane forms.'),
            tx('Jis neturi dvigubo ryšio.', 'It has no double bond.'),
            tx('Vienas jo katijonas pirminis, todėl reakcija nevyksta.', 'One of its cations is primary, so no reaction occurs.'),
            tx('Jis duoda tik 2-bromheksaną.', 'It gives only 2-bromohexane.')
          ],
          answer: 0,
          hint: t('Palyginkite abiejų katijonų klases.', 'Compare the classes of both cations.'),
          solution: t('Abu dvigubo ryšio atomai turi po vieną alkilą, todėl abu katijonai antriniai ir vienodai tikėtini.', 'Both double-bond carbons have one alkyl group, so both cations are secondary and equally likely.')
        }
      ],
      why: t('Sintezei renkamasi alkenas, kurio simetrija duoda vieną katijoną. Tada produktas vienintelis, o ne mišinys.', 'For a synthesis choose the alkene whose symmetry allows only one cation. Then the product is unique rather than a mixture.'),
      src: 'L7 p12'
    },
    {
      id: 'u07.why.4',
      q: [{ p: t('Alkenas izopropilidencikloheksanas reaguoja su HCl.', 'The alkene isopropylidenecyclohexane reacts with HCl.') }, { scheme: { items: [{ smi: 'CC(C)=C1CCCCC1', opts: { numbers: 'all' } }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }] } }],
      steps: [
        {
          prompt: t('Kokios klasės katijonai gali susidaryti?', 'What classes of cation can form?'),
          kind: 'choice',
          options: [
            tx('Du tretiniai katijonai: prie žiedo ir prie izopropilo anglies.', 'Two tertiary cations: on the ring carbon and on the isopropyl carbon.'),
            tx('Vienas tretinis ir vienas antrinis.', 'One tertiary and one secondary.'),
            tx('Tik vienas tretinis katijonas.', 'Only one tertiary cation.'),
            tx('Du antriniai katijonai.', 'Two secondary cations.')
          ],
          answer: 0,
          hint: t('Prie kiekvieno dvigubo ryšio atomo suskaičiuokite anglies kaimynus.', 'Count the carbon neighbours of each double-bond carbon.'),
          solution: [
            { p: t('Abu dvigubo ryšio atomai neturi vandenilių ir turi po tris anglies kaimynus, todėl jungiantis $H+$ bet kuriam gaunamas tretinis katijonas.', 'Both double-bond carbons have no hydrogen and three carbon neighbours each, so adding $H+$ to either gives a tertiary cation.') },
            { mech: [
              { scheme: { items: [{ smi: 'CC(C)=C1CCCCC1' }, { plus: true }, { smi: 'Cl', opts: { allH: true } }] }, arrows: [{ from: { m: 0, b: [1, 3] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }], note: t('Protonas prie izopropilo atomo: katijonas ant žiedo.', 'The proton goes to the isopropyl carbon: the cation is on the ring.') },
              { scheme: { items: [{ smi: 'CC(C)=C1CCCCC1' }, { plus: true }, { smi: 'Cl', opts: { allH: true } }] }, arrows: [{ from: { m: 0, b: [3, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }], note: t('Protonas prie žiedo atomo: katijonas ant izopropilo anglies.', 'The proton goes to the ring carbon: the cation is on the isopropyl carbon.') }
            ] }
          ]
        },
        {
          prompt: t('Pažymėkite abu pagrindinius produktus.', 'Select both main products.'),
          kind: 'multi',
          options: [{ mol: { smi: 'CC(C)C1(Cl)CCCCC1' } }, { mol: { smi: 'CC(C)(Cl)C1CCCCC1' } }, { mol: { smi: 'CC(C)C1CCCCC1Cl' } }, { mol: { smi: 'CC(C)(Cl)C1(Cl)CCCCC1' } }],
          answer: [0, 1],
          hint: t('Chloras jungiasi prie teigiamos anglies kiekvienu atveju.', 'Chlorine bonds to the positive carbon in each case.'),
          solution: t('Du tretiniai katijonai duoda du izomerinius chloralkanus. Trečiasis variantas reikalautų antrinio katijono, ketvirtasis – antros HCl molekulės.', 'Two tertiary cations give two isomeric chloroalkanes. The third option would need a secondary cation, the fourth a second HCl.')
        }
      ],
      why: t('Abu katijonai tretiniai, todėl jų stabilumas panašus ir susidaro du produktai. Tai Markovnikovo taisyklės ribos: ji nenurodo vieno atsakymo, kai klasės vienodos.', 'Both cations are tertiary, so their stability is similar and two products form. This is a limit of Markovnikov’s rule: it gives no single answer when the classes are equal.'),
      src: 'S4.14, L7 p9'
    },
    {
      id: 'u07.why.5',
      q: [{ p: t('Apie $AE$ mechanizmą pateikti teiginiai.', 'Statements about the AE mechanism.') }],
      steps: [{
        prompt: t('Pažymėkite visus teisingus teiginius apie alkeno ir HBr reakciją.', 'Select every correct statement about the reaction of an alkene with HBr.'),
        kind: 'multi',
        options: [
          tx('Lėtasis žingsnis yra karbokatijono susidarymas.', 'The slow step is the formation of the carbocation.'),
          tx('$π$ elektronai atakuoja protoną.', 'The $π$ electrons attack the proton.'),
          tx('Bromidas jungiasi prie katijono antrajame, greitame žingsnyje.', 'Bromide bonds to the cation in the second, fast step.'),
          tx('Abu žingsniai vyksta vienu metu vienoje stadijoje.', 'Both steps happen at once in a single stage.'),
          tx('Pirmiausia prisijungia bromido anijonas.', 'The bromide anion adds first.')
        ],
        answer: [0, 1, 2],
        hint: t('Prisiminkite, kas yra nukleofilas, o kas elektrofilas.', 'Recall which is the nucleophile and which the electrophile.'),
        solution: t('Alkenas yra nukleofilas, todėl jo $π$ elektronai atakuoja $H+$. Pirmajame (lėtame) žingsnyje susidaro katijonas, antrajame (greitame) jį atakuoja bromidas. Dviejų žingsnių mechanizmas, o ne vienstadijis.', 'The alkene is the nucleophile, so its $π$ electrons attack $H+$. The first (slow) step forms the cation, the second (fast) step has bromide attack it. It is a two-step mechanism, not a one-stage one.')
      }],
      why: t('AE yra dviejų žingsnių procesas: elektrofilo prisijungimas prie $π$ ryšio sukuria karbokatijoną, o nukleofilas jį užbaigia. Ši schema paaiškina ir produkto kryptį.', 'AE is a two-step process: the electrophile bonding to the $π$ bond creates a carbocation, and the nucleophile completes it. This scheme also explains the direction of the product.'),
      src: 'L7 p7, p18'
    },
    {
      id: 'u07.why.6',
      q: [{ p: t('Propenas hidratuojamas, bet kolbos turinyje nėra rūgšties.', 'Propene is hydrated, but the flask contains no acid.') }, { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'O' }, { arrow: '→' }] } }],
      steps: [{
        prompt: t('Kodėl reakcijai reikia rūgšties?', 'Why does the reaction need an acid?'),
        kind: 'choice',
        options: [
          tx('Vanduo pats yra per silpnas elektrofilas; rūgštis sudaro $H3O+$, kuris atakuojamas $π$ elektronų.', 'Water itself is too weak an electrophile; the acid makes $H3O+$, which the $π$ electrons can attack.'),
          tx('Rūgštis oksiduoja alkeną į diolį.', 'The acid oxidises the alkene to a diol.'),
          tx('Rūgštis sunaudojama, nes jungiasi prie alkoholio kaip esteris, ir tuo reakcija baigiasi.', 'The acid is consumed because it bonds to the alcohol as an ester, which ends the reaction.'),
          tx('Rūgštis hidrina dvigubą ryšį.', 'The acid hydrogenates the double bond.')
        ],
        answer: 0,
        hint: t('Alkenas yra nukleofilas. Kam jis atiduoda elektronus pirmajame žingsnyje?', 'The alkene is a nucleophile. To what does it give electrons in the first step?'),
        solution: t('Pirmajame žingsnyje reikia elektrofilo. $H2O$ nėra pakankamai elektrofilinis, o $H3O+$ – yra. Žingsnio pabaigoje protonas grįžta, todėl rūgštis yra tik katalizatorius.', 'The first step needs an electrophile. $H2O$ is not electrophilic enough but $H3O+$ is. A proton returns at the end, so the acid is only a catalyst.')
      }],
      why: t('Alkenas yra nukleofilas ir jam reikia elektrofilo. Rūgštis suteikia $H3O+$, o pabaigoje atsikuria, todėl vandens prijungimas vyksta tik rūgštyje.', 'The alkene is a nucleophile and needs an electrophile. The acid supplies $H3O+$ and is regenerated at the end, so water adds only in acid.'),
      src: 'L7 p19'
    },
    {
      id: 'u07.why.7',
      q: [{ p: t('Iš 1-butenos reikia gauti 1-brombutaną.', 'You need to make 1-bromobutane from 1-butene.') }, { scheme: { items: [{ smi: 'CCC=C' }, { arrow: '→' }, { smi: 'CCCCBr' }] } }],
      steps: [
        {
          prompt: t('Kuri sąlyga tinka?', 'Which conditions work?'),
          kind: 'choice',
          options: [tx('$HBr$ ir peroksidai (arba UV šviesa)', '$HBr$ with peroxides (or UV light)'), tx('$HBr$ be peroksidų', '$HBr$ without peroxides'), tx('$Br2$', '$Br2$'), tx('$H2O/H+$, tada $HBr$', '$H2O/H+$, then $HBr$')],
          answer: 0,
          hint: t('Reikia produkto prieš Markovnikovo taisyklę.', 'You need the product against Markovnikov’s rule.'),
          solution: t('Tik su peroksidais $HBr$ jungiasi radikaliniu keliu ir $Br$ patenka prie galinės anglies.', 'Only with peroxides does $HBr$ add by the radical path and put $Br$ on the terminal carbon.')
        },
        {
          prompt: t('Koks mechanizmas?', 'Which mechanism?'),
          kind: 'choice', options: [tx('AR', 'AR'), tx('AE', 'AE'), tx('SN1', 'SN1'), tx('E2', 'E2')], answer: 0,
          hint: t('Peroksidai sudaro radikalus.', 'Peroxides make radicals.'),
          solution: t('AR, radikalinis prijungimas: $Br•$ pirmas atakuoja alkeną ir sudaro stabilesnį antrinį radikalą.', 'AR, radical addition: $Br•$ attacks the alkene first and makes the more stable secondary radical.')
        }
      ],
      why: t('Be peroksidų kryptį lemia katijono stabilumas (AE), su peroksidais – radikalo stabilumas (AR), ir produktas atvirkščias. Šis poveikis būdingas tik $HBr$.', 'Without peroxides the cation stability decides (AE); with peroxides the radical stability decides (AR) and the product is reversed. This effect is specific to $HBr$.'),
      src: 'L7 p13, p14'
    },
    {
      id: 'u07.why.8',
      q: [{ p: t('Du izomerai reaguoja su HBr.', 'Two isomers react with HBr.') }, { mol: [{ smi: 'CCC(C)=C' }, { smi: 'CC(C)=CC' }] }],
      steps: [
        {
          prompt: t('Ar pagrindinis produktas skiriasi?', 'Does the main product differ?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(C)(C)Br' } }, { mol: { smi: 'CC(C)C(C)Br' } }, { mol: { smi: 'CCC(C)CBr' } }], answer: 0,
          hint: t('Kuris katijonas stabiliausias abiem atvejais?', 'Which cation is the most stable in both cases?'),
          solution: t('Abu alkenai gali sudaryti tą patį tretinį katijoną, todėl pagrindinis produktas tas pats: 2-brom-2-metilbutanas.', 'Both alkenes can form the same tertiary cation, so the main product is the same: 2-bromo-2-methylbutane.')
        },
        {
          prompt: t('Kuris iš jų duoda ir šalutinį produktą?', 'Which one also gives a notable minor product?'),
          kind: 'choice',
          options: [tx('2-metil-2-butenas (kitas katijonas antrinis)', '2-methyl-2-butene (the other cation is secondary)'), tx('2-metil-1-butenas (kitas katijonas pirminis)', '2-methyl-1-butene (the other cation is primary)'), tx('Abu vienodai', 'Both equally'), tx('Nė vienas', 'Neither')],
          answer: 0,
          hint: t('Palyginkite alternatyvų katijoną kiekvienu atveju.', 'Compare the alternative cation in each case.'),
          solution: t('2-metil-2-butenas gali sudaryti antrinį katijoną, todėl turi pastebimą šalutinį produktą; 2-metil-1-butenui alternatyva būtų pirminis katijonas, kuris beveik nesusidaro.', '2-Methyl-2-butene can form a secondary cation and so has a noticeable minor product; for 2-methyl-1-butene the alternative would be a primary cation, which hardly forms.')
        }
      ],
      why: t('Produktą nusako katijonas, ne pradinio alkeno forma. Skirtingi alkenai gali duoti tą patį stabiliausią katijoną ir tą patį pagrindinį produktą.', 'The cation, not the shape of the starting alkene, defines the product. Different alkenes can give the same most stable cation and the same main product.'),
      src: 'S4.12, L7 p8',
      claims: [{ react: ['ae.hx', ['CCC(C)=C'], { X: 'Br' }, 'CCC(C)(C)Br'] }, { react: ['ae.hx', ['CC(C)=CC'], { X: 'Br' }, 'CCC(C)(C)Br'] }]
    }
  ];

  const TEST = [
    {
      id: 'u07.test.1',
      q: [{ p: t('Du mėgintuvėliai: viename heksanas, kitame 1-heksenas.', 'Two test tubes: one holds hexane, the other 1-hexene.') }, { mol: [{ smi: 'CCCCCC' }, { smi: 'CCCCC=C' }] }],
      steps: [{
        prompt: t('Kuris bandymas juos atskirs ir ką pamatysite?', 'Which test tells them apart, and what will you see?'),
        kind: 'choice',
        options: [
          tx('Bromo vanduo: alkeno mėgintuvėlyje oranžinė spalva išnyksta, alkano – ne.', 'Bromine water: the orange colour disappears in the alkene tube, not in the alkane tube.'),
          tx('Bromo vanduo: alkano mėgintuvėlyje oranžinė spalva išnyksta, alkeno – ne.', 'Bromine water: the orange colour disappears in the alkane tube, not in the alkene tube.'),
          tx('Vanduo: alkenas ištirpsta, alkanas – ne.', 'Water: the alkene dissolves, the alkane does not.'),
          tx('Skiedžiama rūgštis: iškrenta rudos nuosėdos alkene.', 'Dilute acid: a brown precipitate forms in the alkene.')
        ],
        answer: 0,
        hint: t('Kuris junginys turi $π$ ryšį, galintį prijungti bromą?', 'Which compound has a $π$ bond that can add bromine?'),
        solution: t('Alkenas jungia $Br2$ (AE), todėl oranžinė spalva išnyksta; alkanas be šviesos nereaguoja.', 'The alkene adds $Br2$ (AE), so the orange colour vanishes; the alkane does not react without light.')
      }],
      why: t('Bromo vandenį nuspalvina tik reakcija su $π$ ryšiu. Prisotintas angliavandenilis tokių reakcijų be šviesos nevykdo.', 'Only reaction with a $π$ bond decolourises bromine water. A saturated hydrocarbon does not react like this without light.'),
      src: 'L7 p6'
    },
    {
      id: 'u07.test.2',
      q: [{ p: t('Cikloheksenas ir cikloheksanas lašinami į šaltą neutralų $KMnO4$ tirpalą.', 'Cyclohexene and cyclohexane are added to cold neutral $KMnO4$ solution.') }, { mol: [{ smi: 'C1=CCCCC1' }, { smi: 'C1CCCCC1' }] }],
      steps: [{
        prompt: t('Ką pamatysite cikloheksene?', 'What will you see with cyclohexene?'),
        kind: 'choice',
        options: [
          tx('Violetinė spalva išnyksta ir iškrenta rudos nuosėdos ($MnO2$).', 'The violet colour fades and brown $MnO2$ precipitates.'),
          tx('Tirpalas lieka violetinis, o cikloheksanas pasidaro rudas.', 'The solution stays violet while the cyclohexane turns brown.'),
          tx('Tirpalas tampa oranžinis.', 'The solution turns orange.'),
          tx('Išsiskiria dujos ir tirpalas tampa mėlynas.', 'A gas is released and the solution turns blue.')
        ],
        answer: 0,
        hint: t('Alkenas oksiduojamas į diolį, o $MnO4-$ redukuojasi.', 'The alkene is oxidised to a diol and $MnO4-$ is reduced.'),
        solution: t('Cikloheksenas virsta 1,2-cikloheksandioliu, o $MnO4-$ – rudu $MnO2$. Cikloheksanas nereaguoja.', 'Cyclohexene becomes 1,2-cyclohexanediol and $MnO4-$ becomes brown $MnO2$. Cyclohexane does not react.')
      }],
      why: t('Spalvos išnykimas ir rudos nuosėdos rodo, kad $KMnO4$ buvo redukuotas, vadinasi, kažkas oksidavosi, čia – dvigubas ryšys.', 'The loss of colour and the brown precipitate show that $KMnO4$ was reduced, so something was oxidised, here the double bond.'),
      src: 'L7 p23, LW6 p1'
    },
    {
      id: 'u07.test.3',
      q: [{ p: t('Etanolį kaitinant su koncentruota $H2SO4$ išsiskiria etenas, kuris praleidžiamas pro skirtingus tirpalus.', 'Heating ethanol with concentrated $H2SO4$ releases ethene, which is passed through different solutions.') }],
      steps: [{
        prompt: t('Suporuokite situaciją su stebėjimu.', 'Match each situation with its observation.'),
        kind: 'match',
        answer: {
          left: [tx('Etenas ir bromo vanduo', 'Ethene and bromine water'), tx('Etenas ir $KMnO4$ tirpalas', 'Ethene and $KMnO4$ solution'), tx('Etanolis ir $H2SO4$ kaitinant', 'Ethanol and $H2SO4$ on heating')],
          right: [tx('Oranžinė spalva išnyksta.', 'The orange colour disappears.'), tx('Violetinė spalva išnyksta, atsiranda rudos nuosėdos.', 'The violet colour disappears and a brown precipitate appears.'), tx('Mišinys putoja, išsiskiria dujos.', 'The mixture froths and a gas is released.')],
          pairs: [0, 1, 2]
        },
        hint: t('Kas yra reagentas, o kas dujų šaltinis?', 'Which is the reagent and which the source of gas?'),
        solution: t('Etenas prijungia bromą ir oksiduojasi $KMnO4$; etanolis su rūgštimi dehidratuojasi iki eteno, kurio dujos išsiskiria.', 'Ethene adds bromine and is oxidised by $KMnO4$; ethanol is dehydrated by the acid to ethene, whose gas is released.')
      }],
      why: t('Du pirmieji stebėjimai yra dvigubo ryšio testai; trečiasis rodo, kad etenas iš tikrųjų susidarė.', 'The first two observations are tests for the double bond; the third shows that ethene was really formed.'),
      src: 'LW6 p1'
    },
    {
      id: 'u07.test.4',
      q: [{ p: t('Ketinama atskirti junginių poras bromo vandeniu.', 'You plan to tell pairs of compounds apart with bromine water.') }],
      steps: [{
        prompt: t('Kurios poros bromo vandeniu neatskirtumėte?', 'Which pair could you not tell apart with bromine water?'),
        kind: 'choice',
        options: [
          { scheme: { items: [{ smi: 'CCCCC=C' }, { plus: true }, { smi: 'CCCCC#C' }] } },
          { scheme: { items: [{ smi: 'CCCCC=C' }, { plus: true }, { smi: 'CCCCCC' }] } },
          { scheme: { items: [{ smi: 'C1=CCCCC1' }, { plus: true }, { smi: 'C1CCCCC1' }] } },
          { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'CCC' }] } }
        ],
        answer: 0,
        hint: t('Kurio junginio tirpalas šiuo atveju išblunka abiem atvejais?', 'In which pair does the solution fade in both tubes?'),
        solution: t('Ir alkenas, ir alkinas prijungia bromą ir išblukina tirpalą; kitose porose vienas junginys prisotintas ir nereaguoja.', 'Both the alkene and the alkyne add bromine and decolourise the solution; in the other pairs one compound is saturated and does not react.')
      }],
      why: t('Bromo vandens ir $KMnO4$ bandymai yra kokybiniai dvigubo ir trigubo ryšio testai: jie atskiria nesotųjį nuo sotaus, bet ne alkeno nuo alkino.', 'Bromine water and $KMnO4$ are qualitative tests for a double and a triple bond: they separate unsaturated from saturated, but not an alkene from an alkyne.'),
      src: 'L7 p6'
    },
    {
      id: 'u07.test.5',
      q: [{ p: t('Etenas praleidžiamas pro violetinį $KMnO4$ tirpalą ir atsiranda rudos nuosėdos.', 'Ethene is passed through a violet $KMnO4$ solution and brown solid appears.') }, { scheme: { items: [{ smi: 'C=C' }, { arrow: '→', above: f('KMnO4, H2O') }] } }],
      steps: [
        {
          prompt: t('Kas yra rudos nuosėdos?', 'What is the brown solid?'),
          kind: 'choice', options: [tx('$MnO2$', '$MnO2$'), tx('$KMnO4$', '$KMnO4$'), tx('$Br2$', '$Br2$'), tx('$K2SO4$', '$K2SO4$')], answer: 0,
          hint: t('Kuo virsta $MnO4-$ neutralioje terpėje?', 'What does $MnO4-$ become in neutral medium?'),
          solution: t('$MnO4-$ redukuojasi iki rudo $MnO2$.', '$MnO4-$ is reduced to brown $MnO2$.')
        },
        {
          prompt: t('Koks organinis produktas?', 'What is the organic product?'),
          kind: 'choice', options: [{ mol: { smi: 'OCCO' } }, { mol: { smi: 'CCO' } }, { mol: { smi: 'BrCCBr' } }, { mol: { smi: 'CC' } }], answer: 0,
          hint: t('Švelnus oksidavimas prijungia po $OH$ prie abiejų atomų.', 'Mild oxidation puts an $OH$ on both carbons.'),
          solution: t('Etenas virsta 1,2-etandioliu (etilenglikoliu).', 'Ethene becomes 1,2-ethanediol (ethylene glycol).')
        }
      ],
      why: t('Reakcija: $3 CH2=CH2 + 2 KMnO4 + 4 H2O → 3 HOCH2CH2OH + 2 MnO2 + 2 KOH$. Oksiduojasi alkenas, redukuojasi Mn.', 'The reaction: $3 CH2=CH2 + 2 KMnO4 + 4 H2O → 3 HOCH2CH2OH + 2 MnO2 + 2 KOH$. The alkene is oxidised and manganese reduced.'),
      src: 'LW6 p1'
    },
    {
      id: 'u07.test.6',
      q: [{ p: t('Etenas gaunamas kaitinant etanolį su koncentruota sieros rūgštimi.', 'Ethene is made by heating ethanol with concentrated sulfuric acid.') }, { scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: f('H2SO4 (konc.)'), below: f('t°') }, { smi: 'C=C' }] } }],
      steps: [{
        prompt: t('Koks procesas vyksta?', 'Which process takes place?'),
        kind: 'choice',
        options: [tx('Dehidratacija: prarandamas vanduo.', 'Dehydration: water is lost.'), tx('Hidratacija: prisijungia vanduo.', 'Hydration: water is added.'), tx('Hidrinimas: prisijungia vandenilis.', 'Hydrogenation: hydrogen is added.'), tx('Halogeninimas: prisijungia halogenas.', 'Halogenation: a halogen is added.')],
        answer: 0,
        hint: t('Palyginkite etanolio ir eteno formules.', 'Compare the formulas of ethanol and ethene.'),
        solution: t('$C2H6O$ → $C2H4$: prarandama $H2O$, tai dehidratacija; tai atvirkštinė alkeno hidratacijai.', '$C2H6O$ → $C2H4$: $H2O$ is lost, so it is dehydration, the reverse of hydration.')
      }],
      why: t('Rūgštyje alkenas gali prijungti vandenį, o koncentruotoje rūgštyje ir kaitinant – jį prarasti. Tai tas pats pusiausvyros procesas.', 'In dilute acid an alkene adds water, in concentrated acid and heat it loses it. It is the same equilibrium process.'),
      src: 'LW6 p1',
      claims: [{ formula: ['CCO', 'C2H6O'] }, { formula: ['C=C', 'C2H4'] }]
    },
    {
      id: 'u07.test.7',
      q: [{ p: t('Heksaną sumaišius su bromo vandeniu tamsoje spalva nepasikeičia, o heksenas jį išblukina iškart.', 'Hexane mixed with bromine water in the dark leaves the colour unchanged, while hexene decolourises it at once.') }],
      steps: [{
        prompt: t('Kodėl alkenas reaguoja, o alkanas – ne?', 'Why does the alkene react but not the alkane?'),
        kind: 'choice',
        options: [
          tx('Alkenas turi nukleofilinį $π$ ryšį, kurį atakuoja elektrofilinis bromas.', 'The alkene has a nucleophilic $π$ bond that electrophilic bromine attacks.'),
          tx('Alkanas turi $π$ ryšį, kuris per stiprus.', 'The alkane has a $π$ bond that is too strong.'),
          tx('Alkanas tirpsta vandenyje ir praskiedžia bromą.', 'The alkane dissolves in water and dilutes the bromine.'),
          tx('Alkenas yra rūgštis ir neutralizuoja bromą.', 'The alkene is an acid and neutralises the bromine.')
        ],
        answer: 0,
        hint: t('Kuris junginys turi $π$ elektronus, kuriuos gali atiduoti?', 'Which compound has $π$ electrons to give?'),
        solution: t('Alkanas turi tik $σ$ ryšius ir neturi elektronų, kuriuos lengvai atiduotų; bromą jis jungia tik radikaliniu keliu su šviesa (SR).', 'The alkane has only $σ$ bonds and no electrons to give easily; it substitutes bromine only by the radical route with light (SR).')
      }],
      why: t('Alkenas yra nukleofilas ir jungia bromą AE keliu be šviesos, o alkano reakcija yra radikalinė ir reikalauja šviesos ar kaitinimo.', 'The alkene is a nucleophile and adds bromine by AE without light, while the alkane’s reaction is radical and needs light or heat.'),
      src: 'L7 p4, p6'
    },
    {
      id: 'u07.test.8',
      q: [{ p: t('Nežinomas junginys $C6H12$ išblukina bromo vandenį ir $KMnO4$ tirpalą.', 'An unknown compound $C6H12$ decolourises bromine water and $KMnO4$ solution.') }],
      steps: [{
        prompt: t('Kuris iš šių junginių galėtų būti?', 'Which of these could it be?'),
        kind: 'choice', options: [{ mol: { smi: 'CCCC=CC' } }, { mol: { smi: 'C1CCCCC1' } }, { mol: { smi: 'CCCCCC' } }, { mol: { smi: 'CC1CCCC1' } }], answer: 0,
        hint: t('Du bandymai rodo nesotumą. Kuris variantas turi $π$ ryšį?', 'Both tests show unsaturation. Which option has a $π$ bond?'),
        solution: t('Tik heksenas turi $C=C$. Cikloheksanas ir metilciklopentanas yra sotūs žiedai (taip pat $C6H12$), o heksanas yra $C6H14$.', 'Only the hexene has a $C=C$. Cyclohexane and methylcyclopentane are saturated rings (also $C6H12$), and hexane is $C6H14$.')
      }],
      why: t('Formulė $CnH2n$ tinka ir alkenui, ir cikloalkanui, todėl formulės nepakanka. Spalvos kaita rodo, kad yra $π$ ryšys.', 'The formula $CnH2n$ fits both an alkene and a cycloalkane, so the formula is not enough. The colour change shows that a $π$ bond is present.'),
      src: 'L7 p6',
      claims: [{ formula: ['CCCC=CC', 'C6H12'] }, { formula: ['C1CCCCC1', 'C6H12'] }, { formula: ['CCCCCC', 'C6H14'] }]
    }
  ];

  ORG.unit({
    id: 'u07',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES_GEN.concat([
      { id: 'u07.why', title: t('Kryptis ir priežastis', 'Direction and reason'), mirrors: ['S4.12', 'S4.14'], bank: WHY },
      { id: 'u07.test', title: t('Dvigubo ryšio atpažinimas', 'Testing for a double bond'), mirrors: ['S4.4'], bank: TEST }
    ]),
    coverage: {
      'S4.3': ['u07.hx', 'u07.mech'],
      'S4.4': ['u07.hx', 'u07.x2h2', 'u07.test'],
      'S4.5': ['u07.hydr'],
      'S4.6': ['u07.x2h2', 'u07.kmno4', 'u07.fate'],
      'S4.12': ['u07.mech', 'u07.cation', 'u07.why'],
      'S4.13': ['u07.ewg'],
      'S4.14': ['u07.kmno4', 'u07.back', 'u07.why', 'u07.fate']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
