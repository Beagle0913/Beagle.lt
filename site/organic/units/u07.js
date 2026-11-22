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

  // rank of the cation on carbon i when its double-bond partner j takes H+: benzylic 6, allylic 5, else the number of carbon neighbours
  function catRank(m, i, j) {
    let r = cN(m, i);
    m.nbr[i].forEach(k => {
      if (k === j || m.atoms[k].el !== 'C') return;
      if (m.atoms[k].aromatic) r = Math.max(r, 6);
      else if (m.nbr[k].some(l => l !== i && m.atoms[l].el === 'C' && m.bondAt(k, l).order === 2)) r = Math.max(r, 5);
    });
    return r;
  }
  // Markovnikov sides chosen by the stability of the cation (benzylic > allylic > tertiary > secondary > primary); null if equal
  function sides(chem, smi) {
    const d = dbl(chem, smi);
    if (!d) return null;
    const ra = catRank(d.m, d.a, d.b);
    const rb = catRank(d.m, d.b, d.a);
    if (ra === rb) return null;
    const [hC, xC] = ra < rb ? [d.a, d.b] : [d.b, d.a];
    const rk = Math.max(ra, rb);
    return { hC, xC, cls: Math.min(cN(d.m, xC), 3), kind: rk === 6 ? 'benzyl' : rk === 5 ? 'allyl' : 'alkyl' };
  }
  // the cation class in words (nominative and genitive)
  function catName(p) {
    if (p.kind === 'benzyl') return { nom: t('benzilkatijonas', 'a benzylic carbocation'), gen: t('benzilkatijono', 'the benzylic carbocation') };
    const i = p.cls - 1;
    return { nom: t(LTCLS[i] + ' karbokatijonas', 'a ' + ENCLS[i] + ' carbocation'), gen: t(LTCLS_G[i] + ' karbokatijono', 'the ' + ENCLS[i] + ' carbocation') };
  }
  const toCarboxylate = (s) => s.replace(/C\(O\)=O/g, 'C(=O)[O-]').replace(/OC\(=O\)/g, '[O-]C(=O)');
  const toAldehyde = (s) => ((s.match(/C\(O\)=O/g) || []).length === 1 && /C\(O\)=O$/.test(s) ? s.replace(/C\(O\)=O$/, 'C=O') : null);
  // both groups on the same carbon: a typical wrong answer with the formula of the vicinal product
  function gemAdduct(chem, smi, grp) {
    const d = dbl(chem, smi);
    if (!d) return null;
    const c = d.m.nbr[d.b].length <= 2 ? d.b : d.m.nbr[d.a].length <= 2 ? d.a : -1;
    return c < 0 ? null : adduct(smi, c === d.b ? d.a : d.b, c, grp + ')(' + grp);
  }
  const setKey = (ctx, ps) => ps.map(x => canon(ctx, x)).sort().join('+');
  // the reagents of the unit and what they do to an alkene (null when the engine gives no single answer)
  function reagentList(ctx, smi) {
    const { react } = ctx;
    const one = (rule, o) => () => { const m = react.run(rule, [smi], o).products.filter(x => x.major); return m.length === 1 ? [m[0].smi] : null; };
    return [
      { id: 'hbr', l: t('$HBr$', '$HBr$'), o: one('ae.hx', { X: 'Br' }),
        w: t('Prisijungė vienas $H$ ir vienas $Br$, o $Br$ atsidūrė prie atomo su mažiau vandenilių (Markovnikovo taisyklė): $HBr$ be peroksidų.', 'One $H$ and one $Br$ added, with $Br$ on the carbon with fewer hydrogens (Markovnikov\u2019s rule): $HBr$ without peroxides.') },
      { id: 'hbrp', l: t('$HBr$, $ROOR$', '$HBr$, $ROOR$'), o: one('ae.hx', { X: 'Br', peroxide: true }),
        w: t('Prisijungė vienas $H$ ir vienas $Br$, bet $Br$ atsidūrė prie atomo su daugiau vandenilių, prieš Markovnikovo taisyklę: $HBr$ su peroksidais.', 'One $H$ and one $Br$ added, but $Br$ is on the carbon with more hydrogens, against Markovnikov\u2019s rule: $HBr$ with peroxides.') },
      { id: 'h2o', l: t('$H2O$, $H+$', '$H2O$, $H+$'), o: one('ae.h2o', {}),
        w: t('Prisijungė $H$ ir $OH$ pagal Markovnikovo taisyklę: reikia vandens rūgštyje.', '$H$ and $OH$ added by Markovnikov\u2019s rule: water in acid is needed.') },
      { id: 'br2', l: t('$Br2$', '$Br2$'), o: () => [first(react.run('ae.x2', [smi], { X: 'Br' }))],
        w: t('Du bromo atomai prisijungė prie gretimų anglies atomų: $Br2$.', 'Two bromine atoms added to adjacent carbons: $Br2$.') },
      { id: 'h2', l: t('$H2$, $Pd$', '$H2$, $Pd$'), o: () => [first(react.run('ae.h2', [smi], {}))],
        w: t('Dvigubasis ryšys prisotintas, anglies skeletas nepakito: $H2$ su katalizatoriumi.', 'The double bond is saturated and the carbon skeleton is unchanged: $H2$ with a catalyst.') },
      { id: 'cold', l: t('$KMnO4$, $OH-$ (šaltas)', '$KMnO4$, $OH-$ (cold)'), o: () => [first(react.run('ox.kmno4.mild', [smi], {}))],
        w: t('Prie abiejų atomų prisijungė po $OH$, grandinė nenutrūko: šaltas šarminis $KMnO4$.', 'An $OH$ added to each carbon and the chain stayed intact: cold alkaline $KMnO4$.') },
      { id: 'hotacid', l: t('$KMnO4$, $H3O+$, $t°$', '$KMnO4$, $H3O+$, $t°$'), o: () => harshProducts(ctx, smi),
        w: t('$C=C$ ryšys nutrūko, gautos rūgštys ir (ar) ketonai: karštas rūgštus $KMnO4$.', 'The $C=C$ bond was cleaved to acids and (or) ketones: hot acidic $KMnO4$.') },
      { id: 'hotalk', l: t('$KMnO4$, $OH-$, $t°$', '$KMnO4$, $OH-$, $t°$'), o: () => harshProducts(ctx, smi).map(toCarboxylate),
        w: t('$C=C$ ryšys nutrūko, o rūgštys yra druskų pavidalu: karštas šarminis $KMnO4$.', 'The $C=C$ bond was cleaved and the acids are present as salts: hot alkaline $KMnO4$.') }
    ];
  }
  // two reagents that differ only in the form of the acid, or in H/Br direction, are offered together on purpose; hot acid and hot alkali never
  function pickReagents(ctx, R, n) {
    let chosen = ctx.shuffle(R.slice()).slice(0, n);
    const has = (id) => chosen.some(r => r.id === id);
    if (has('hotacid') && has('hotalk')) chosen = chosen.filter(r => r.id !== 'hotalk').concat(R.filter(r => r.id === 'h2o' && !has('h2o')).slice(0, 1));
    if (has('hbr') !== has('hbrp')) {
      const need = R.find(r => r.id === (has('hbr') ? 'hbrp' : 'hbr'));
      const drop = chosen.slice().reverse().find((r, i) => r.id !== 'hbr' && r.id !== 'hbrp' && chosen.indexOf(r) !== 0);
      chosen = chosen.filter(r => r !== drop).concat([need]);
    }
    return chosen.slice(0, n);
  }
  // the carbocation made when H+ adds to hC: same atom order as the alkene SMILES, so atom numbers carry over
  function cationSmi(chem, smi, hC, xC) {
    const m = chem.parse(smi);
    const sp = spans(smi);
    const later = Math.max(hC, xC);
    const eq = sp[later].a - 1;
    if (smi[eq] !== '=') return null;
    const edits = [
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
  const LTCLS_G = ['pirminio', 'antrinio', 'tretinio'];
  const ENCLS = ['primary', 'secondary', 'tertiary'];

  // pools of alkenes (all stay within the namer's scope and avoid ring-closure double bonds)
  const ALK_U = ['CC=C', 'CC(C)=C', 'CCC=C', 'CCCC=C', 'CC(C)=CC', 'CCC(C)=C', 'CCC(C)=CC', 'CC(C)=CCC', 'CCC(C)=CCC',
    'CCCC(C)=C', 'CC(C)CC=C', 'CC1=CCCCC1', 'CC1=CCCC1', 'C=C1CCCCC1', 'C=C1CCCC1', 'CCCC(C)=CC', 'CCC(CC)=CC', 'CCCCC=C',
    'CC(C)=CCCC', 'CC(C)(C)C=C', 'CCCCC(C)=C', 'CCCC(CC)=C', 'CC(C)CCC=C', 'CCC(C)CC=C', 'CCCCC(C)=CC'];
  const ALK_B = ['CC=Cc1ccccc1', 'C=Cc1ccccc1', 'CCC=Cc1ccccc1'];                   // benzylic cation
  const ALK_H = ALK_U.concat(ALK_B);
  const ALK_S = ['C1=CCCCCC1', 'CCCC=CCCC', 'C1=CCCCC1', 'C1=CCCC1', 'CC=CC', 'CCC=CCC', 'CC(C)=C(C)C'];
  const ALK_T = ['CC=CCC', 'CC=CCCC', 'CC=CCCCC', 'CCC=CCCC'];             // both cations of the same class: two comparable products
  const ALK_Q = ['CC(C)=C1CCCCC1', 'CCC(C)=C(C)C', 'CCC(C)=C1CCCC1'];       // two ketones on cleavage
  const ALK_ALL = ALK_U.concat(ALK_S, ALK_T, ALK_Q);

  const NOTES = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'structure',
      title: t('Alkenų sandara ir pavadinimai', 'Structure and names of alkenes'),
      blocks: [
        { h: t('Kas yra alkenas?', 'What is an alkene?') },
        {
          p: t('Alkenai yra angliavandeniliai, kurių molekulėje yra dvigubas anglies–anglies ryšys. Du jo atomai yra sp² hibridizuoti ir kartu su pakaitais guli vienoje plokštumoje, ryšių kampai apie 120°. Dvigubąjį ryšį sudaro stipresnis σ ryšys ir silpnesnis π ryšys, kurio elektronų debesis yra virš molekulės plokštumos ir po ja. Vieną dvigubąjį ryšį turintys acikliniai alkenai atitinka formulę CₙH₂ₙ.',
            'Alkenes are hydrocarbons that contain a carbon–carbon double bond. Its two atoms are sp² hybridised and lie in one plane together with their substituents, with bond angles near 120°. The double bond consists of a stronger σ bond and a weaker π bond whose electron cloud sits above and below the molecular plane. An acyclic alkene with one double bond fits the formula CₙH₂ₙ.'),
          src: 'L7 p4'
        },
        { mol: [{ smi: 'C=C', opts: { condensed: true }, name: t('etenas', 'ethene') }, { smi: 'CC=C', name: t('propenas', 'propene') }, { smi: 'C1=CCCCC1', name: t('cikloheksenas', 'cyclohexene') }], src: 'L7 p2' },
        {
          p: t('Būtent π ryšys lemia alkenų reakcijas: jo elektronai laikomi silpniau nei σ ryšio, todėl alkenas lengvai prijungia reagentus. Reakcijos metu silpnesnis π ryšys nutrūksta, o vietoje jo susidaro du nauji σ ryšiai, todėl prijungimas energetiškai naudingas.',
            'It is the π bond that decides how alkenes react: its electrons are held more loosely than those of a σ bond, so an alkene readily adds reagents. In the reaction the weaker π bond breaks and two new σ bonds form in its place, which is why addition is energetically favourable.'),
          src: 'L7 p4'
        },
        {
          rule: t('Pavadinimas: pagrindinė grandinė turi apimti dvigubąjį ryšį. Ji numeruojama nuo to galo, kuris arčiau C=C, o prieš pavadinimą rašomas pirmojo dvigubojo ryšio atomo numeris; galūnė yra -enas.',
            'Name: the main chain must contain the double bond. Number it from the end nearer to the C=C, put the number of the first double-bond carbon before the name, and end the name in -ene.'),
          src: 'L7 p2'
        },
        { mol: [{ smi: 'CCC=C', name: t('1-butenas', '1-butene') }, { smi: 'CC=CC', name: t('2-butenas', '2-butene') }, { smi: 'CC=CCCC', name: t('2-heksenas', '2-hexene') }], src: 'L7 p2' },
        {
          pitfall: t('Numeruojama nuo galo, arčiau kurio yra C=C, net jei pakaitas dėl to gauna didesnį numerį: $CH3CH(CH3)CH=CHCH3$ yra 4-metil-2-pentenas, o ne 2-metil-3-pentenas.',
            'Number from the end nearer to the C=C even if a substituent then gets a larger number: $CH3CH(CH3)CH=CHCH3$ is 4-methyl-2-pentene, not 2-methyl-3-pentene.')
        },
        { mol: { smi: 'CC(C)C=CC', name: t('4-metil-2-pentenas', '4-methyl-2-pentene') } },
        { h: t('Cis ir trans izomerai', 'Cis and trans isomers') },
        {
          p: t('Aplink dvigubąjį ryšį sukti negalima, todėl 2-butenas turi du stereoizomerus: cis (Z) ir trans (E). Kaip pagal Z/E taisyklę juos vadinti, aiškinama skyriuje „Izomerija“. Šio skyriaus reakcijose abu izomerai duoda tuos pačius konstitucinius produktus.',
            'There is no rotation about a double bond, so 2-butene has two stereoisomers: cis (Z) and trans (E). How to name them by the Z/E rule is explained in the unit “Isomerism”. In the reactions of this unit both isomers give the same constitutional products.')
        },
        { mol: [{ smi: 'C/C=C\\C', caption: t('cis-2-butenas (Z)', 'cis-2-butene (Z)') }, { smi: 'C/C=C/C', caption: t('trans-2-butenas (E)', 'trans-2-butene (E)') }] },
        {
          example: {
            q: [{ p: t('Pavadinkite alkeną.', 'Name this alkene.') }, { mol: { smi: 'CC(C)=CCC', name: t('2-metil-2-pentenas', '2-methyl-2-pentene') } }],
            steps: [
              [{ p: t('Raskite ilgiausią grandinę, kurioje yra C=C: tai penkių anglies atomų grandinė, taigi pentenas.', 'Find the longest chain that contains the C=C: five carbons, so a pentene.') }],
              [{ p: t('Sunumeruokite nuo galo, arčiau kurio dvigubasis ryšys: C=C yra tarp 2 ir 3 atomo, vadinasi, 2-pentenas.', 'Number from the end nearer to the double bond: the C=C is between carbons 2 and 3, so a 2-pentene.') }],
              [{ p: t('Pakaitas metilas yra ties antruoju atomu.', 'The methyl substituent is on carbon 2.') }, { mol: { smi: 'CC(C)=CCC', name: t('2-metil-2-pentenas', '2-methyl-2-pentene') } }]
            ]
          }
        },
        { practice: 'u07.name' }
      ]
    },
    {
      id: 'ae',
      title: t('Elektrofilinis prijungimas (AE)', 'Electrophilic addition (AE)'),
      blocks: [
        { h: t('Alkenas yra nukleofilas', 'An alkene is a nucleophile') },
        {
          p: t('Alkeno π elektronai yra išsikišę į abi plokštumos puses ir silpnai laikomi, todėl alkenas elgiasi kaip nukleofilas ir reaguoja su elektrofiliniais reagentais. Tokia reakcija vadinama elektrofiliniu prijungimu, trumpai AE (joninis prijungimas). Bendras vaizdas: reagentas $E-Nu$ suskyla, o jo dalys prisijungia prie abiejų C=C atomų.',
            'The π electrons of an alkene bulge out on both sides of the plane and are held loosely, so an alkene behaves as a nucleophile and reacts with electrophilic reagents. This reaction is called electrophilic addition, AE for short (an ionic addition). In general the reagent $E-Nu$ splits and its two parts bond to the two carbons of the C=C.'),
          src: 'L7 p5'
        },
        { scheme: { items: [{ smi: 'C=C', opts: { condensed: true } }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CCBr' }] }, caption: t('Eteno ir HBr reakcija: prijungimas.', 'Ethene and HBr: an addition.') },
        { h: t('Dvi stadijos', 'Two stages') },
        {
          p: t('Pirmoji stadija lėta: π ryšio elektronų pora sudaro ryšį su elektrofilu (čia $H+$ iš HBr), o antrasis dvigubojo ryšio atomas netenka elektronų ir tampa karbokatijonu. Antroji stadija greita: bromido anijonas savo laisvąja elektronų pora prisijungia prie karbokatijono.',
            'The first stage is slow: the π electron pair bonds to the electrophile (here $H+$ from HBr), and the other double-bond carbon, now short of electrons, becomes a carbocation. The second stage is fast: the bromide anion bonds to the carbocation with a lone pair.'),
          src: 'L7 p7'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=C', opts: { allH: true } }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'C[CH2+]' }, { plus: true }, { smi: '[Br-]' }], maxWidth: 640 },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('I stadija (lėtoji): π elektronai sudaro $C-H$ ryšį, $H-Br$ elektronai pereina bromui.', 'Stage I (slow): the π electrons form the $C-H$ bond; the $H-Br$ electrons go to bromine.')
            },
            {
              scheme: { items: [{ smi: 'C[CH2+]' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CCBr' }], maxWidth: 640 },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
              note: t('II stadija (greitoji): bromido laisvoji pora sudaro $C-Br$ ryšį.', 'Stage II (fast): a lone pair of bromide forms the $C-Br$ bond.')
            }
          ],
          src: 'L7 p7, p18'
        },
        {
          rule: t('AE: π elektronai atakuoja elektrofilą (lėtoji stadija) ir susidaro karbokatijonas; nukleofilas prisijungia prie karbokatijono (greitoji stadija). Produktą lemia karbokatijonas.',
            'AE: the π electrons attack the electrophile (slow stage) and a carbocation forms; the nucleophile bonds to the carbocation (fast stage). The carbocation decides the product.'),
          src: 'L7 p18'
        },
        {
          p: t('Reaktyvumas didėja eilėje HF < HCl < HBr < HI: kuo stipresnė rūgštis, tuo greičiau protonizuojamas alkenas.',
            'Reactivity grows in the order HF < HCl < HBr < HI: the stronger the acid, the faster the alkene is protonated.'),
          src: 'T p55'
        },
        {
          pitfall: t('Lenkta rodyklė rodo elektronų porą: ji prasideda nuo ryšio arba laisvosios poros ir baigiasi ten, kur elektronai sudaro naują ryšį. Nepradėkite rodyklės nuo teigiamo atomo ar nuo $H+$.',
            'A curved arrow shows an electron pair: it starts at a bond or a lone pair and ends where the electrons form a new bond. Never start an arrow at a positive atom or at $H+$.')
        },
        {
          example: {
            q: [{ p: t('Parašykite eteno ir HCl reakcijos pirmąją stadiją.', 'Write the first stage of ethene with HCl.') }],
            steps: [
              [{ p: t('Alkenas yra nukleofilas, o HCl – elektrofilas: $H$ yra $δ+$, nes chloras elektroneigiamesnis.', 'The alkene is the nucleophile and HCl the electrophile: $H$ is $δ+$ because chlorine is more electronegative.') }],
              [{ p: t('π ryšio elektronų pora sudaro ryšį su $H$; kartu $H-Cl$ ryšio elektronai pereina chlorui.', 'The π electron pair bonds to $H$; at the same time the $H-Cl$ electrons move to chlorine.') }],
              [{ p: t('Gaunamas etilo katijonas ir chlorido anijonas.', 'The result is the ethyl cation and a chloride anion.') }, { scheme: { items: [{ smi: 'C[CH2+]' }, { plus: true }, { smi: '[Cl-]' }] } }]
            ]
          },
          claims: [{ formula: ['C[CH2+]', 'C2H5+'] }]
        },
        { practice: 'u07.mech' }
      ]
    },
    {
      id: 'markovnikov',
      title: t('Nesimetriniai alkenai: Markovnikovo taisyklė', 'Unsymmetrical alkenes: Markovnikov’s rule'),
      blocks: [
        { h: t('Kuris produktas vyrauja?', 'Which product wins?') },
        {
          p: t('Propeno $H+$ gali prisijungti prie bet kurio dvigubojo ryšio atomo, todėl galimi du karbokatijonai ir du produktai. Reakcijos eigą lemia tarpinis karbokatijonas: susidaro tas produktas, kurio karbokatijonas stabilesnis.',
            'In propene $H+$ can bond to either double-bond carbon, so two carbocations and two products are possible. The intermediate carbocation decides: the product forms whose carbocation is more stable.'),
          src: 'L7 p9, p11'
        },
        {
          mol: [{ smi: 'C[CH+]C', caption: t('antrinis → 2-chlorpropanas (pagrindinis)', 'secondary → 2-chloropropane (main)') }, { smi: 'CC[CH2+]', caption: t('pirminis → 1-chlorpropanas (pėdsakai)', 'primary → 1-chloropropane (traces)') }],
          src: 'L7 p11'
        },
        {
          rule: t('Karbokatijonų stabilumas: benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas.',
            'Carbocation stability: benzyl > allyl > tertiary > secondary > primary > methyl.'),
          src: 'L7 p9'
        },
        {
          table: {
            head: [t('Katijonas', 'Cation'), t('Pavyzdys', 'Example'), t('Kas jį stabilizuoja', 'What stabilises it')],
            rows: [
              [t('benzilkatijonas', 'benzyl'), { smi: '[CH2+]c1ccccc1' }, t('konjugacija su žiedu', 'conjugation with the ring')],
              [t('alilkatijonas', 'allyl'), { smi: 'C=C[CH2+]' }, t('konjugacija su C=C', 'conjugation with the C=C')],
              [t('tretinis', 'tertiary'), { smi: 'C[C+](C)C' }, t('trys alkilo pakaitai (hiperkonjugacija)', 'three alkyl groups (hyperconjugation)')],
              [t('antrinis', 'secondary'), { smi: 'C[CH+]C' }, t('du alkilo pakaitai', 'two alkyl groups')],
              [t('pirminis', 'primary'), { smi: 'CC[CH2+]' }, t('vienas alkilo pakaitas', 'one alkyl group')],
              [t('metilkatijonas', 'methyl'), { smi: '[CH3+]' }, t('nėra pakaitų', 'no substituents')]
            ]
          },
          src: 'L7 p9'
        },
        {
          p: t('Alkilgrupių stabilizuojantis poveikis vadinamas hiperkonjugacija: kaimyninių $C-H$ ir $C-C$ ryšių elektronai iš dalies persikelia į katijono tuščią p orbitalę. Kuo daugiau alkilo pakaitų, tuo daugiau tokių ryšių, todėl tretinis katijonas stabiliausias. Alilkatijono ir benzilkatijono krūvis dar pasiskirsto konjugacijos būdu.',
            'The stabilising effect of alkyl groups is called hyperconjugation: electrons of neighbouring $C-H$ and $C-C$ bonds shift partly into the empty p orbital of the cation. The more alkyl groups, the more such bonds, so the tertiary cation is the most stable. In allyl and benzyl cations the charge is also spread by conjugation.'),
          src: 'L7 p9, p10'
        },
        {
          rule: t('Markovnikovo taisyklė: HX (ir kiti HY) jungiasi taip, kad $H$ patenka prie dvigubojo ryšio atomo, turinčio daugiau vandenilių, o halogenas – prie atomo su mažiau vandenilių, jei prie C=C nėra elektronų akceptorinių pakaitų. Priežastis: taip susidaro stabilesnis karbokatijonas.',
            'Markovnikov’s rule: HX (and other HY) adds with $H$ going to the double-bond carbon that has more hydrogens and the halogen to the carbon with fewer, as long as the C=C carries no electron-withdrawing substituent. The reason: this gives the more stable carbocation.'),
          src: 'L7 p13'
        },
        {
          scheme: { items: [{ smi: 'CC(C)=CC' }, { plus: true }, { smi: 'I' }, { arrow: '→' }, { smi: 'CCC(C)(C)I' }, { plus: true }, { smi: 'CC(C)C(C)I' }], maxWidth: 520 },
          caption: t('2-metil-2-butenas ir HI: pirmasis produktas pagrindinis (tretinis katijonas), antrasis šalutinis (antrinis katijonas).', '2-methyl-2-butene and HI: the first product is the main one (tertiary cation), the second the minor one (secondary cation).'),
          src: 'L7 p8'
        },
        { h: t('Kai abu katijonai vienodi', 'When both cations are alike') },
        {
          p: t('3-heksenas gali sudaryti tik vieną antrinį katijoną, todėl duoda tik 3-bromheksaną. 2-heksenas sudaro du antrinius katijonus, taigi duoda 2- ir 3-bromheksano mišinį. Čia vien skaičiuoti vandenilius neužtenka: reikia palyginti katijonus.',
            '3-Hexene can form only one secondary cation, so it gives only 3-bromohexane. 2-Hexene forms two secondary cations, so it gives a mixture of 2- and 3-bromohexane. Counting hydrogens is not enough here: compare the cations.'),
          src: 'L7 p12'
        },
        { scheme: { items: [{ smi: 'CCC=CCC' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CCC(Br)CC' }] }, src: 'L7 p12' },
        {
          scheme: { items: [{ smi: 'CC=CCCC' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CC(Br)CCCC' }, { plus: true }, { smi: 'CCC(Br)CCC' }], maxWidth: 520 },
          caption: t('Abu produktai susidaro panašiu kiekiu.', 'Both products form in comparable amounts.'), src: 'L7 p12'
        },
        { h: t('Benzilkatijonas nugali', 'The benzylic cation wins') },
        {
          p: t('Jei vienas iš galimų katijonų konjuguotas su benzeno žiedu (benzilkatijonas), jis stabiliausias, net kai abu dvigubojo ryšio atomai turi po tiek pat vandenilių. Todėl 1-fenilpropenas su HBr duoda 1-brom-1-fenilpropaną: bromas prisijungia prie anglies šalia žiedo.',
            'If one of the possible cations is conjugated with the benzene ring (a benzylic cation), it is the most stable even when both double-bond carbons carry the same number of hydrogens. So 1-phenylpropene and HBr give 1-bromo-1-phenylpropane: bromine bonds to the carbon next to the ring.'),
          src: 'L7 p9, p17'
        },
        { scheme: { items: [{ smi: 'CC=Cc1ccccc1' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CCC(Br)c1ccccc1' }], maxWidth: 520 } },
        {
          pitfall: t('Taisyklė „halogenas ten, kur mažiau vandenilių“ yra tik trumpesnis kelias. Pirmiausia nubraižykite abu katijonus ir palyginkite jų tipus; jei jie vienodi, susidaro abiejų produktų mišinys.',
            'The rule “halogen where there are fewer hydrogens” is only a shortcut. First draw both cations and compare their types; if they are equal, a mixture of both products forms.')
        },
        { h: t('Atvirkštinis prijungimas: HBr su peroksidais', 'Reverse addition: HBr with peroxides') },
        {
          p: t('Jei tirpale yra peroksidų (arba apšviečiama UV šviesa), vandenilio bromidas – tik jis – prisijungia atvirkščiai, nei numato Markovnikovo taisyklė. Tada vyksta radikalinis prijungimas, AR: peroksidas suskyla į radikalus, $Br•$ prisijungia prie atomo su daugiau vandenilių ir sudaro stabilesnį (antrinį) radikalą, o šis atplėšia $H$ nuo HBr ir atkuria $Br•$.',
            'If peroxides are present (or UV light), hydrogen bromide, and only that one, adds against Markovnikov’s rule. A radical addition, AR, takes place: the peroxide splits into radicals, $Br•$ bonds to the carbon with more hydrogens and gives the more stable (secondary) radical, which then takes $H$ from HBr and regenerates $Br•$.'),
          src: 'L7 p13, p14'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'OO' }, { arrow: '→' }, { smi: '[OH]' }, { plus: true }, { smi: '[OH]' }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }],
              note: t('Peroksidas skyla į radikalus.', 'The peroxide splits into radicals.')
            },
            {
              scheme: { items: [{ smi: '[OH]' }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'O' }, { plus: true }, { smi: '[Br]' }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 'H0' }, half: true }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 }, half: true }],
              note: t('Radikalas atplėšia $H$ nuo HBr: gaunamas $Br•$.', 'The radical takes $H$ from HBr: $Br•$ forms.')
            },
            {
              scheme: { items: [{ smi: '[Br]' }, { plus: true }, { smi: 'CC=C' }, { arrow: '→' }, { smi: 'C[CH]CBr' }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 2 }, half: true }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 1 }, half: true }],
              note: t('$Br•$ jungiasi prie atomo su daugiau vandenilių: susidaro antrinis radikalas.', '$Br•$ bonds to the carbon with more hydrogens: a secondary radical forms.')
            },
            {
              scheme: { items: [{ smi: 'C[CH]CBr' }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'CCCBr' }, { plus: true }, { smi: '[Br]' }] },
              arrows: [{ from: { m: 1, b: [0, 'H0'] }, to: { m: 0, a: 1 }, half: true }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 }, half: true }],
              note: t('Radikalas atplėšia $H$ nuo HBr ir atkuria $Br•$: grandinė tęsiasi.', 'The radical takes $H$ from HBr and regenerates $Br•$: the chain goes on.')
            }
          ],
          src: 'L7 p14'
        },
        {
          scheme: { items: [{ smi: 'CC=Cc1ccccc1' }, { plus: true }, { smi: 'Br' }, { arrow: '→', below: f('ROOR') }, { smi: 'CC(Br)Cc1ccccc1' }], maxWidth: 520 },
          caption: t('1-fenilpropenas su peroksidais: bromas atsiduria prie antrojo atomo, nes radikalas stabilesnis benzilo padėtyje.', '1-Phenylpropene with peroxides: bromine ends up on carbon 2, because the radical is more stable in the benzylic position.'),
          src: 'L7 p17'
        },
        {
          example: {
            q: [{ p: t('Koks pagrindinis 2-metil-1-buteno ir HBr reakcijos produktas? Kodėl?', 'What is the main product of 2-methyl-1-butene with HBr? Why?') }, { mol: { smi: 'C=C(C)CC', opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Atomas Nr. 1 (=CH₂) turi du vandenilius, atomas Nr. 2 – nė vieno. $H+$ jungiasi prie atomo Nr. 1.', 'Carbon no. 1 (=CH₂) has two hydrogens, carbon no. 2 has none. $H+$ bonds to carbon no. 1.') }],
              [{ p: t('Teigiamas krūvis lieka ant atomo Nr. 2: tretinis katijonas (kitas galimas būtų pirminis).', 'The positive charge stays on carbon no. 2: a tertiary cation (the alternative would be primary).') }, { mol: { smi: 'CC[C+](C)C' } }],
              [{ p: t('Bromidas jungiasi prie šio atomo.', 'Bromide bonds to that carbon.') }, { mol: { smi: 'CCC(C)(C)Br', name: t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane') } }]
            ]
          },
          claims: [{ react: ['ae.hx', ['C=C(C)CC'], { X: 'Br' }, 'CCC(C)(C)Br'] }, { name: ['CCC(C)(C)Br', t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane')] }]
        },
        { practice: 'u07.hx' },
        { practice: 'u07.cation' },
        { practice: 'u07.radical' },
        { practice: 'u07.why' }
      ]
    },
    {
      id: 'ewg',
      title: t('Išimtis: elektronų akceptorinis pakaitas', 'The exception: an electron-withdrawing group'),
      blocks: [
        { h: t('Kai Markovnikovo taisyklė nebetinka', 'When Markovnikov’s rule fails') },
        {
          p: t('Taisyklė galioja, jei prie C=C yra alkilo (elektronų donorų) pakaitų. Jei prie dvigubojo ryšio yra elektronų akceptorinė grupė ($COOH$, $C=O$, $CN$, $CF3$), prijungimas vyksta prieš Markovnikovo taisyklę: nukleofilas jungiasi prie anglies, esančios toliau nuo grupės.',
            'The rule holds when the C=C carries alkyl (electron-donating) substituents. If the double bond bears an electron-withdrawing group ($COOH$, $C=O$, $CN$, $CF3$), addition goes against Markovnikov’s rule: the nucleophile bonds to the carbon farther from the group.'),
          src: 'L7 p13'
        },
        { scheme: { items: [{ smi: 'C=CC(=O)O' }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H+') }, { smi: 'OCCC(=O)O' }] }, caption: t('Propeno rūgštis hidratuojama į 3-hidroksipropano rūgštį.', 'Propenoic acid is hydrated to 3-hydroxypropanoic acid.'), src: 'S4.13' },
        {
          p: t('Kodėl? Elektronų akceptorinė grupė mažina π elektronų tankį ir destabilizuotų karbokatijoną šalia savęs, todėl protonui sunku prisijungti prie paties dvigubojo ryšio. Rūgštis protonizuoja kitą vietą – karbonilo deguonį.',
            'Why? The withdrawing group lowers the π electron density and would destabilise a cation next to it, so a proton does not easily add to the double bond itself. The acid protonates another site instead: the carbonyl oxygen.'),
          src: 'L7 p16'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=CC(=O)O' }, { plus: true }, { smi: '[OH3+]', opts: { allH: true } }, { arrow: '→' }, { smi: 'C=CC(=[OH+])O' }, { plus: true }, { smi: 'O' }], maxWidth: 640 },
              arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('Karbonilo deguonies laisvoji pora paima protoną.', 'A lone pair of the carbonyl oxygen takes the proton.')
            }
          ],
          src: 'L7 p16'
        },
        { resonance: [{ smi: 'C=CC(=[OH+])O' }, { smi: 'C=C[C+](O)O' }, { smi: '[CH2+]C=C(O)O' }], caption: t('Protonizuotos rūgšties rezonansinės formulės: krūvis pasiekia tolimąjį (β) C atomą.', 'Resonance structures of the protonated acid: the charge reaches the far (β) carbon.'), src: 'L7 p16' },
        {
          p: t('Mechanizmas: $H3O+$ protonizuoja karbonilo deguonį. Per konjuguotą sistemą teigiamas krūvis pasiekia tolimąjį (β) anglies atomą – tai rodo rezonansinės formulės. Vanduo prisijungia prie β anglies, oksonio jonas netenka protono, o susidaręs enolis izomerizuojasi į rūgštį.',
            'Mechanism: $H3O+$ protonates the carbonyl oxygen. Through the conjugated system the positive charge reaches the far (β) carbon, as the resonance structures show. Water bonds to the β carbon, the oxonium ion loses a proton, and the enol that forms tautomerises to the acid.'),
          src: 'L7 p16, S4.13'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: '[CH2+]C=C(O)O' }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }, { arrow: '→' }, { smi: '[OH2+]CC=C(O)O' }], maxWidth: 640 },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 0 } }],
              note: t('Vanduo prisijungia prie tolimojo (β) C atomo.', 'Water bonds to the far (β) carbon.')
            }
          ],
          src: 'L7 p16'
        },
        {
          mech: [{
            scheme: { items: [{ smi: '[OH2+]CC=C(O)O', opts: { allH: true } }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'OCC=C(O)O' }, { plus: true }, { smi: '[OH3+]' }], maxWidth: 640 },
            arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H0' } }, { from: { m: 0, b: [0, 'H0'] }, to: { m: 0, a: 0 } }],
            note: t('Vanduo paima protoną: atsiranda enolis, atsikuria $H3O+$.', 'Water takes a proton: the enol forms and $H3O+$ is regenerated.')
          }],
          src: 'L7 p16'
        },
        { scheme: { items: [{ smi: 'OCC=C(O)O' }, { arrow: '⇌', above: t('izomerizacija', 'tautomerisation') }, { smi: 'OCCC(=O)O' }] }, caption: t('Enolis izomerizuojasi į 3-hidroksipropano rūgštį.', 'The enol tautomerises to 3-hydroxypropanoic acid.'), src: 'S4.13' },
        {
          p: t('Grupė $CF3$ neturi π sistemos, kuria krūvis galėtų persikelti, todėl čia veikia tik stiprus indukcijos efektas: katijonas šalia $CF3$ labai nepalankus. $H+$ jungiasi prie anglies su $CF3$, o nukleofilas – prie tolimesnės, ir $CF3CH=CH2$ su HBr duoda $CF3CH2CH2Br$.',
            'The $CF3$ group has no π system for the charge to move through, so only a strong inductive effect acts: a cation next to $CF3$ is very unfavourable. $H+$ bonds to the carbon carrying $CF3$ and the nucleophile to the farther one, and $CF3CH=CH2$ with HBr gives $CF3CH2CH2Br$.'),
          src: 'L7 p13'
        },
        {
          pitfall: t('Prieš taikydami Markovnikovo taisyklę pažiūrėkite, kas yra prie C=C. $CF3$, $CN$, $COOH$, $CHO$ ir panašios grupės keičia kryptį. Nepainiokite jų su alkilo pakaitais.',
            'Before applying Markovnikov’s rule look at what sits on the C=C. $CF3$, $CN$, $COOH$, $CHO$ and similar groups reverse the direction. Do not confuse them with alkyl substituents.')
        },
        {
          example: {
            q: [{ p: t('Kas susidaro propenalio ($CH2=CH-CHO$) reakcijoje su HBr?', 'What forms from propenal ($CH2=CH-CHO$) and HBr?') }, { mol: { smi: 'C=CC=O', opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Grupė $CHO$ yra elektronų akceptorė, todėl Markovnikovo taisyklė netinka. Protonizuojamas karbonilo deguonis (atomas Nr. 4).', 'The $CHO$ group withdraws electrons, so Markovnikov’s rule does not apply. The carbonyl oxygen (atom no. 4) is protonated.') }],
              [{ p: t('Teigiamas krūvis rezonansu pasiekia atomą Nr. 1, toliausiai nuo grupės.', 'The positive charge reaches carbon no. 1 by resonance, the one farthest from the group.') }],
              [{ p: t('Bromidas jungiasi prie atomo Nr. 1.', 'Bromide bonds to carbon no. 1.') }, { mol: { smi: 'BrCCC=O', name: t('3-brompropanalis', '3-bromopropanal') } }]
            ]
          },
          claims: [{ react: ['ae.hx', ['C=CC=O'], { X: 'Br' }, 'BrCCC=O'] }, { name: ['BrCCC=O', t('3-brompropanalis', '3-bromopropanal')] }]
        },
        { practice: 'u07.ewg' }
      ]
    },
    {
      id: 'reagents',
      title: t('Halogenai, vanduo ir vandenilis', 'Halogens, water and hydrogen'),
      blocks: [
        { h: t('Halogenų prijungimas', 'Addition of halogens') },
        {
          p: t('$Br2$ molekulė nepolinė, bet šalia π elektronų debesies jos ryšys poliarizuojasi: artimesnis bromo atomas tampa $δ+$. Alkeno π elektronai sudaro su juo ryšį, o kitas bromas atskyla kaip bromido jonas. Susidaro trinaris bromonio jonas; bromidas jį atakuoja iš pusės, priešingos tilteliniam bromui, žiedas atsiveria ir gaunamas vicinalinis (Br prie gretimų C atomų) dibromidas.',
            '$Br2$ is non-polar, but next to the π cloud its bond becomes polarised: the nearer bromine turns $δ+$. The π electrons bond to it and the other bromine leaves as bromide. A three-membered bromonium ion forms; bromide attacks it from the side opposite the bridging bromine, the ring opens and a vicinal dibromide (Br on adjacent carbons) results.'),
          src: 'L7 p6'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=C', opts: { allH: true } }, { plus: true }, { smi: 'BrBr' }], maxWidth: 640 },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
              note: t('π elektronai atakuoja bromą, $Br-Br$ elektronai pereina tolimesniam bromui.', 'The π electrons attack bromine; the $Br-Br$ electrons go to the far bromine.')
            },
            {
              scheme: { items: [{ smi: 'C1C[Br+]1', opts: { coords: [[0, 0.9], [1.6, 0.9], [0.8, 0]] } }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'BrCCBr' }], maxWidth: 640 },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 0 } }, { from: { m: 0, b: [0, 2] }, to: { m: 0, a: 2 } }],
              note: t('Bromidas atveria bromonio žiedą iš priešingos pusės.', 'Bromide opens the bromonium ring from the opposite side.')
            }
          ],
          src: 'L7 p6'
        },
        { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'CC(Br)CBr' }] }, caption: t('Propenas ir bromas: 1,2-dibrompropanas.', 'Propene and bromine: 1,2-dibromopropane.') },
        {
          rule: t('$Br2$ ar $Cl2$ jungiasi prie abiejų C=C atomų. Oranžinio (geltono) bromo tirpalo spalva išnyksta: tai dvigubojo (ir trigubojo) ryšio atpažinimo reakcija.',
            '$Br2$ or $Cl2$ bonds to both carbons of the C=C. The orange (yellow) bromine solution loses its colour: this is the test reaction for a double (and a triple) bond.'),
          src: 'L7 p6'
        },
        { h: t('Vandens prijungimas (hidratacija)', 'Addition of water (hydration)') },
        {
          p: t('Be rūgšties vanduo prie alkenų nesijungia. Pats $H2O$ yra per silpnas elektrofilas, o sieros rūgštis sudaro oksonio joną $H3O+$, kuris ir yra elektrofilinė dalelė. Produktai – alkoholiai, kryptis pagal Markovnikovo taisyklę.',
            'Without an acid, water does not add to alkenes. $H2O$ itself is too weak an electrophile; sulfuric acid makes the oxonium ion $H3O+$, which is the electrophilic particle. The products are alcohols, with the direction given by Markovnikov’s rule.'),
          src: 'L7 p19'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: '[OH3+]', opts: { allH: true } }, { arrow: '→' }, { smi: 'C[CH+]C' }, { plus: true }, { smi: 'O' }], maxWidth: 640 },
              arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1: $H+$ prisijungia (lėtai), susidaro antrinis katijonas.', '1: $H+$ adds (slowly), giving the secondary cation.')
            },
            {
              scheme: { items: [{ smi: 'C[CH+]C' }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CC(C)[OH2+]' }], maxWidth: 640 },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
              note: t('2: vanduo prisijungia prie katijono.', '2: water bonds to the cation.')
            },
            {
              scheme: { items: [{ smi: 'CC(C)[OH2+]', opts: { allH: true, coords: [[0, 0], [0.87, 0.5], [1.73, 0], [0.87, 1.5]] } }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CC(C)O' }, { plus: true }, { smi: '[OH3+]' }], maxWidth: 640 },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H3' } }, { from: { m: 0, b: [3, 'H3'] }, to: { m: 0, a: 3 } }],
              note: t('3: vanduo paima protoną, atsikuria katalizatorius.', '3: water takes a proton, regenerating the catalyst.')
            }
          ],
          src: 'L7 p19'
        },
        { scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H2SO4') }, { smi: 'CC(C)O' }] }, caption: t('Propenas: pagrindinis produktas 2-propanolis.', 'Propene: the main product is 2-propanol.') },
        { h: t('Vandenilio prijungimas (hidrinimas)', 'Addition of hydrogen (hydrogenation)') },
        {
          p: t('Su $H2$ ir $Pt$, $Pd$ ar $Ni$ katalizatoriumi alkenas hidrinamas į alkaną (katalitinis hidrinimas). Abu reagentai adsorbuojasi katalizatoriaus paviršiuje, o π ryšys virsta dviem $C-H$ ryšiais. Abu vandeniliai prisijungia iš tos pačios pusės. Tai ir prijungimas, ir redukcija.',
            'With $H2$ and a $Pt$, $Pd$ or $Ni$ catalyst an alkene is hydrogenated to an alkane (catalytic hydrogenation). Both reagents adsorb on the catalyst surface and the π bond becomes two $C-H$ bonds. Both hydrogens add from the same face. It is both an addition and a reduction.'),
          src: 'L7 p20, p21'
        },
        { scheme: { items: [{ smi: 'CC(C)=CC' }, { plus: true }, { smi: '[H][H]' }, { arrow: '→', above: f('Pd') }, { smi: 'CCC(C)C' }] }, caption: t('2-metil-2-butenas virsta 2-metilbutanu.', '2-methyl-2-butene becomes 2-methylbutane.') },
        {
          pitfall: t('Katalitinio hidrinimo (H₂/Pd) mechanizmas vyksta katalizatoriaus paviršiuje ir nėra elektrofilinis, todėl jo AE simboliu nežymime. AE vartojame HX, $H2O/H+$ ir $X2$ prijungimui.',
            'Catalytic hydrogenation (H₂/Pd) happens on a catalyst surface and is not electrophilic, so we do not label it AE. AE is used for the addition of HX, $H2O/H+$ and $X2$.')
        },
        {
          example: {
            q: [{ p: t('Kokie produktai gaunami iš 2-metilpropeno su (a) $Br2$, (b) $H2O/H+$, (c) $H2/Pd$?', 'What are the products of 2-methylpropene with (a) $Br2$, (b) $H2O/H+$, (c) $H2/Pd$?') }, { mol: { smi: 'CC(C)=C' } }],
            steps: [
              [{ p: t('(a) Bromas jungiasi prie abiejų atomų.', '(a) Bromine bonds to both carbons.') }, { mol: { smi: 'CC(C)(Br)CBr' } }],
              [{ p: t('(b) Pagal Markovnikovo taisyklę: $H$ prie CH₂, $OH$ prie tretinio atomo.', '(b) By Markovnikov’s rule: $H$ to CH₂, $OH$ to the tertiary carbon.') }, { mol: { smi: 'CC(C)(C)O' } }],
              [{ p: t('(c) Dvigubasis ryšys prisotinamas.', '(c) The double bond is saturated.') }, { mol: { smi: 'CC(C)C' } }]
            ]
          },
          claims: [{ react: ['ae.x2', ['CC(C)=C'], { X: 'Br' }, 'CC(C)(Br)CBr'] }, { react: ['ae.h2o', ['CC(C)=C'], null, 'CC(C)(C)O'] }, { react: ['ae.h2', ['CC(C)=C'], null, 'CC(C)C'] }]
        },
        { practice: 'u07.x2h2' },
        { practice: 'u07.hydr' }
      ]
    },
    {
      id: 'ox',
      title: t('Alkenų oksidavimas KMnO₄', 'Oxidation of alkenes with KMnO₄'),
      blocks: [
        { h: t('Ką lemia sąlygos', 'What the conditions decide') },
        {
          p: t('Kas susidaro, lemia trys dalykai: ar tirpalas rūgštus, neutralus ar šarminis, ar jis šaltas ar karštas, ir kokį pakaitų rinkinį turi dvigubasis ryšys. Švelniomis sąlygomis (šaltame šarminiame ar neutraliame tirpale) anglies grandinė nenutrūksta: prie abiejų C=C atomų prisijungia po OH grupę ir susidaro 1,2-diolis (dihidroksilinimas). Griežtomis sąlygomis ryšys skyla.',
            'Three things decide what forms: whether the solution is acidic, neutral or alkaline, whether it is cold or hot, and the substituents on the double bond. Under mild conditions (cold alkaline or neutral solution) the chain stays intact: an OH adds to each C=C carbon and a 1,2-diol forms (dihydroxylation). Under harsh conditions the bond is cleaved.'),
          src: 'L7 p22, p23'
        },
        { scheme: { items: [{ smi: 'CC(C)=CC' }, { arrow: '→', above: f('KMnO4, OH-, H2O'), below: t('šaltas', 'cold') }, { smi: 'CC(C)(O)C(C)O' }] }, caption: t('Švelnus oksidavimas: diolis; violetinė spalva išnyksta, iškrenta rudos $MnO2$ nuosėdos.', 'Mild oxidation: a diol; the violet colour fades and brown $MnO2$ precipitates.'), src: 'L7 p23' },
        {
          p: t('Abi OH grupės prisijungia iš tos pačios pusės: tarpinis ciklinis manganato esteris (neišskiriamas) suskyla į cis-diolį.',
            'Both OH groups add from the same side: the intermediate cyclic manganate ester (not isolated) breaks down to the cis-diol.'),
          src: 'L7 p23'
        },
        {
          scheme: { items: [{ smi: 'C1=CCCCC1' }, { arrow: '→', above: f('KMnO4') }, { smi: '[O-][Mn]1(=O)OC2CCCCC2O1' }, { arrow: '→', above: f('OH-') }, { smi: 'O[C@H]1CCCC[C@H]1O' }], maxWidth: 640 },
          caption: t('Cikloheksenas: ciklinis esteris, po to cis-1,2-cikloheksandiolis.', 'Cyclohexene: the cyclic ester, then cis-1,2-cyclohexanediol.'), src: 'L7 p23'
        },
        { h: t('Oksidacinis skilimas', 'Oxidative cleavage') },
        {
          p: t('Rūgščioje terpėje skilimas vyksta ir šaltyje, ir kaitinant, o šarminėje bei neutralioje – tik kaitinant (šarminėje gaunamos rūgščių druskos). Kiekvienas dvigubojo ryšio atomas virsta karbonilo anglimi, o jos tipas priklauso nuo pakaitų.',
            'In acid the cleavage takes place both cold and hot; in alkaline or neutral medium only when heated (in alkali the acids form as salts). Each double-bond carbon becomes a carbonyl carbon whose type depends on its substituents.'),
          src: 'L7 p24'
        },
        {
          table: {
            head: [t('Terpė', 'Medium'), t('Šalta', 'Cold'), t('Kaitinant', 'Hot')],
            rows: [
              [t('rūgšti', 'acidic'), t('skilimas', 'cleavage'), t('skilimas', 'cleavage')],
              [t('neutrali ar šarminė', 'neutral or alkaline'), t('diolis', 'diol'), t('skilimas (druskos)', 'cleavage (salts)')]
            ]
          },
          src: 'L7 p23, p24'
        },
        {
          rule: t('Monopakeistas C atomas (=CH–R) virsta karboksirūgštimi, dipakeistas (=CR₂) – ketonu, galinė grupė =CH₂ – $CO2$ ir $H2O$.',
            'A monosubstituted carbon (=CH–R) becomes a carboxylic acid, a disubstituted one (=CR₂) becomes a ketone, and a terminal =CH₂ becomes $CO2$ and $H2O$.'),
          src: 'L7 p24, p25'
        },
        {
          scheme: { items: [{ smi: 'CC(C)=CCC', name: t('2-metil-2-pentenas', '2-methyl-2-pentene') }, { arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }, { smi: 'CC(C)=O' }, { plus: true }, { smi: 'CCC(O)=O' }], maxWidth: 520 },
          caption: t('2-metil-2-pentenas: acetonas ir propano rūgštis.', '2-methyl-2-pentene: acetone and propanoic acid.'), src: 'L7 p26'
        },
        {
          scheme: { items: [{ smi: 'CCCC=C', name: t('1-pentenas', '1-pentene') }, { arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }, { smi: 'CCCC(O)=O' }, { plus: true }, { smi: 'O=C=O' }], maxWidth: 520 },
          caption: t('1-pentenas: butano rūgštis ir $CO2$.', '1-pentene: butanoic acid and $CO2$.'), src: 'L7 p26'
        },
        {
          scheme: { items: [{ smi: 'CC(C)=CC' }, { arrow: '→', above: f('KMnO4, OH-'), below: f('t°') }, { smi: 'CC(C)=O' }, { plus: true }, { smi: 'CC(=O)[O-]' }], maxWidth: 520 },
          caption: t('Šarminėje terpėje kaitinant gaunamas ketonas ir rūgšties druska (acetatas).', 'In hot alkaline medium the products are a ketone and the salt of the acid (acetate).'), src: 'L7 p26'
        },
        { h: t('Kaip vyksta skilimas', 'How the cleavage goes') },
        {
          p: t('Skilimas eina per diolį: glikolis oksiduojamas, o C–C ryšys tarp OH grupių nutrūksta. Susidaro ketonas (stabilus) ir aldehidas, o aldehidas oksiduojamas toliau iki rūgšties.',
            'The cleavage goes through the diol: the glycol is oxidised and the C–C bond between the OH groups breaks. A ketone (stable) and an aldehyde form, and the aldehyde is oxidised further to the acid.'),
          src: 'L7 p25'
        },
        {
          scheme: { items: [{ smi: 'CC(C)=CC' }, { arrow: '→', above: f('KMnO4') }, { smi: 'CC(C)(O)C(C)O' }, { arrow: '→' }, { smi: 'CC(C)=O' }, { plus: true }, { smi: 'CC=O' }, { arrow: '→', above: f('[O]') }, { smi: 'CC(O)=O' }], maxWidth: 640 },
          src: 'L7 p25'
        },
        {
          p: t('Jei molekulėje yra du dvigubieji ryšiai, grandinės dalis tarp jų abiem galais virsta karboksilo grupėmis: gaunama dirūgštis. Pavyzdžiui, dienas $CH3CH2C(CH3)=CHCH2CH=CH2$ duoda butanoną, propano dirūgštį ir $CO2$.',
            'If the molecule has two double bonds, the chain segment between them becomes a carboxyl group at both ends: a diacid forms. Thus the diene $CH3CH2C(CH3)=CHCH2CH=CH2$ gives butanone, propanedioic acid and $CO2$.'),
          src: 'L7 p25, T p57'
        },
        { scheme: { items: [{ smi: 'CCC(C)=CCC=C' }, { arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }, { smi: 'CCC(C)=O' }, { plus: true }, { smi: 'OC(=O)CC(O)=O' }, { plus: true }, { smi: 'O=C=O' }], maxWidth: 640 }, src: 'L7 p25' },
        { h: t('Nuo produktų atgal prie alkeno', 'From the products back to the alkene') },
        {
          p: t('Atvirkštinis uždavinys sprendžiamas taip: raskite visus C=O anglies atomus produktuose. Tai buvę dvigubojo ryšio atomai. Sujunkite du iš jų dvigubuoju ryšiu (ketono ir rūgšties anglis, arba abi vieno produkto anglis, jei alkenas buvo žiedinis) ir gausite alkeną. Jei gautas tik vienas produktas, alkenas simetrinis: sujunkite dvi jo molekules.',
            'Work backwards like this: find every C=O carbon in the products. These were the double-bond carbons. Join two of them with a double bond (a ketone carbon with an acid carbon, or both carbons of one product if the alkene was cyclic) and you have the alkene. If there is only one product, the alkene is symmetrical: join two molecules of it.'),
          src: 'L7 p28'
        },
        {
          example: {
            q: [{ p: t('Oksiduojant alkeną $KMnO4/H3O+$ gauti propanonas ir butano rūgštis. Koks alkenas?', 'Oxidising an alkene with $KMnO4/H3O+$ gave propanone and butanoic acid. Which alkene?') }, { mol: [{ smi: 'CC(C)=O' }, { smi: 'CCCC(O)=O' }] }],
            steps: [
              [{ p: t('Ketono C=O anglis buvo dipakeistas =CR₂ (du metilai), rūgšties anglis – monopakeistas =CH–R.', 'The ketone C=O carbon was disubstituted =CR₂ (two methyls), the acid carbon was monosubstituted =CH–R.') }],
              [{ p: t('Sujungiame šias dvi anglis dvigubuoju ryšiu.', 'Join these two carbons with a double bond.') }, { mol: { smi: 'CC(C)=CCCC', name: t('2-metil-2-heksenas', '2-methyl-2-hexene') } }]
            ]
          },
          claims: [{ react: ['ox.kmno4.harsh', ['CC(C)=CCCC'], null, 'CC(C)=O'] }, { react: ['ox.kmno4.harsh', ['CC(C)=CCCC'], null, 'CCCC(O)=O'] }, { name: ['CC(C)=CCCC', t('2-metil-2-heksenas', '2-methyl-2-hexene')] }]
        },
        {
          pitfall: t('Nesupainiokite terpės ir temperatūros: šaltas šarminis $KMnO4$ duoda diolį (ryšys lieka), rūgšti terpė – skilimo produktus. Be to, =CH–R atomas virsta ne aldehidu, o rūgštimi: aldehidas oksiduojamas toliau.',
            'Do not mix up medium and temperature: cold alkaline $KMnO4$ gives a diol (the bond stays), acidic medium gives the cleavage products. And =CH–R becomes an acid, not an aldehyde: the aldehyde is oxidised further.')
        },
        { practice: 'u07.kmno4' },
        { practice: 'u07.back' },
        { practice: 'u07.fate' }
      ]
    },
    {
      id: 'tests',
      title: t('Dvigubojo ryšio atpažinimas ir bandymai', 'Testing for a double bond; the lab'),
      blocks: [
        { h: t('Du kokybiniai bandymai', 'Two qualitative tests') },
        {
          p: t('Dvigubasis ryšys atpažįstamas pagal dvi reakcijas: su bromo vandeniu ir su kalio permanganato tirpalu. Abi vyksta greitai, be kaitinimo, ir keičia tirpalo spalvą.',
            'A double bond is detected by two reactions: with bromine water and with potassium permanganate solution. Both are fast, need no heating and change the colour of the solution.'),
          src: 'L7 p6, p23'
        },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), t('Reakcija', 'Reaction'), t('Ką matome', 'Observation')],
            rows: [
              [t('bromo vanduo', 'bromine water'), t('prijungimas (AE); bromas sunaudojamas', 'addition (AE); the bromine is used up'), t('oranžinis tirpalas pasidaro bespalvis', 'the orange solution turns colourless')],
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
          scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: t('H2SO4 (konc.)', 'H2SO4 (conc.)'), below: f('t°') }, { smi: 'C=C', opts: { condensed: true } }, { arrow: '→', above: f('Br2') }, { smi: 'BrCCBr' }], maxWidth: 520 },
          src: 'LW6 p1'
        },
        { scheme: { items: [{ smi: 'C=C', opts: { condensed: true } }, { arrow: '→', above: f('KMnO4, H2O') }, { smi: 'OCCO' }, { plus: true }, { smi: 'O=[Mn]=O' }] }, caption: t('Rudos nuosėdos yra $MnO2$.', 'The brown precipitate is $MnO2$.'), src: 'LW6 p1' },
        {
          pitfall: t('Abu bandymai teigiami ir trigubajam ryšiui, o $KMnO4$ oksiduoja ir kitus junginius (pvz., aldehidus, alkoholius). Teigiamas bandymas rodo nesotumą, bet nepatvirtina, kad tai būtent alkenas.',
            'Both tests are also positive for a triple bond, and $KMnO4$ oxidises other compounds too (aldehydes, alcohols). A positive result shows unsaturation but does not prove that it is an alkene.'),
          src: 'L7 p6'
        },
        {
          example: {
            q: [{ p: t('Dviejuose mėgintuvėliuose yra heksanas ir 1-heksenas. Kaip juos atskirti?', 'Two test tubes hold hexane and 1-hexene. How do you tell them apart?') }],
            steps: [
              [{ p: t('Į abu mėgintuvėlius įpilame bromo vandens. Alkanas be šviesos nereaguoja.', 'Add bromine water to both tubes. The alkane does not react without light.') }],
              [{ p: t('Alkene vyksta AE: oranžinė spalva išnyksta.', 'The alkene undergoes AE: the orange colour disappears.') }, { scheme: { items: [{ smi: 'CCCCC=C' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'CCCCC(Br)CBr' }] } }]
            ]
          },
          claims: [{ react: ['ae.x2', ['CCCCC=C'], { X: 'Br' }, 'CCCCC(Br)CBr'] }]
        },
        { practice: 'u07.test' },
        { practice: 'u07.deduce' }
      ]
    }
  ];

  const SUMMARY = [
    { h: t('Alkenų reakcijų santrauka', 'Summary of alkene reactions') },
    {
      table: {
        head: [t('Reagentas', 'Reagent'), t('Produktas', 'Product'), t('Pastaba', 'Note')],
        rows: [
          [t('$HX$', '$HX$'), t('halogenalkanas', 'haloalkane'), t('hidrohalogeninimas, AE; Markovnikovo taisyklė', 'hydrohalogenation, AE; Markovnikov’s rule')],
          [t('$H2O / H+$', '$H2O / H+$'), t('alkoholis', 'alcohol'), t('hidratacija, AE; reikia rūgšties', 'hydration, AE; needs acid')],
          [t('$Br2$, $Cl2$', '$Br2$, $Cl2$'), t('vicinalinis dihalogenidas', 'vicinal dihalide'), t('AE; Br₂ spalva išnyksta', 'AE; the Br₂ colour fades')],
          [t('$H2 / Pd$', '$H2 / Pd$'), t('alkanas', 'alkane'), t('katalitinis hidrinimas (redukcija)', 'catalytic hydrogenation (reduction)')],
          [t('$KMnO4$, $OH-$, šaltas', '$KMnO4$, $OH-$, cold'), t('1,2-diolis', '1,2-diol'), t('dihidroksilinimas; violetinė → rudos $MnO2$ nuosėdos', 'dihydroxylation; violet → brown $MnO2$')],
          [t('$KMnO4$, $H3O+$, $t°$', '$KMnO4$, $H3O+$, $t°$'), t('ketonai, rūgštys, $CO2$', 'ketones, acids, $CO2$'), t('=CR₂ → ketonas; =CH–R → rūgštis', '=CR₂ → ketone; =CH–R → acid')],
          [t('$HBr$ + $ROOR$', '$HBr$ + $ROOR$'), t('bromalkanas prieš Markovnikovo taisyklę (Br – prie atomo su daugiau H)', 'the anti-Markovnikov bromide (Br on the carbon with more H)'), t('AR (radikalinis prijungimas)', 'AR (radical addition)')]
        ]
      },
      src: 'L7 p27'
    },
    {
      list: [
        t('Karbokatijonų stabilumas: benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas.', 'Carbocation stability: benzyl > allyl > tertiary > secondary > primary > methyl.'),
        t('AE: lėtoji stadija – katijono susidarymas, greitoji – nukleofilo prisijungimas.', 'AE: the slow stage forms the cation, the fast stage adds the nucleophile.'),
        t('Elektronų akceptorinis pakaitas prie C=C: protonizuojamas heteroatomas, nukleofilas jungiasi prie tolimesnio (β) atomo.', 'An electron-withdrawing group on the C=C: the heteroatom is protonated and the nucleophile bonds to the far (β) carbon.'),
        t('Atpažinimas: bromo vanduo ir $KMnO4$ praranda spalvą; $KMnO4$ palieka rudą $MnO2$.', 'Test: bromine water and $KMnO4$ lose their colour; $KMnO4$ leaves brown $MnO2$.'),
        t('Atgal nuo skilimo produktų: sujunkite C=O anglis dvigubuoju ryšiu; vienas produktas – simetrinis alkenas.', 'Back from cleavage products: join the C=O carbons with a double bond; a single product means a symmetrical alkene.')
      ]
    }
  ];

  /* ================= generated types ================= */
  const enNameOf = (en) => (/[0-9]/.test(en.name) ? ([en.name].concat(en.alts || []).find(a => /^[0-9]/.test(a)) || en.name) : en.name);
  // chain length, locant of the C=C and substituents read from the Lithuanian name (null if the name is not of the simple form)
  function nameDetail(ltName) {
    const roots = { et: 2, prop: 3, but: 4, pent: 5, heks: 6, hept: 7, okt: 8 };
    const m = /^(?:(.+?)-)?(?:(\d+)-)?(ciklo)?(et|prop|but|pent|heks|hept|okt)en(?:as|o)?$/.exec(ltName);
    if (!m) return null;
    const ring = !!m[3];
    return { n: roots[m[4]], loc: m[2] || '1', ring, sub: m[1] || '' };
  }
  function nameSolution(lt, enName) {
    const d = nameDetail(lt);
    if (!d) return t('Pavadinimas: ' + lt + '. Pagrindinė grandinė ar žiedas, pakaitai ir jų numeriai skaitomi iš struktūros.', 'The name is ' + enName + ': the parent chain or ring, the substituents and their numbers are read from the structure.');
    return t('Pavadinimas: ' + lt + '. Pagrindinė ' + (d.ring ? 'žiedas' : 'grandinė') + ' turi ' + d.n + ' C atomus, dvigubojo ryšio numeris pavadinime – ' + d.loc + (d.sub ? ', pakaitai: ' + d.sub : ', pakaitų nėra') + '.',
      'The name is ' + enName + '. The parent ' + (d.ring ? 'ring' : 'chain') + ' has ' + d.n + ' carbons, the locant of the double bond is ' + d.loc + (d.sub ? ', substituents: ' + d.sub : ', no substituents') + '.');
  }
  const nameStep = (ctx, smi, prompt) => {
    const lt = ctx.name.name(smi, { lang: 'lt' });
    const en = ctx.name.name(smi, { lang: 'en' });
    if (!lt || !en) return null;
    const enName = enNameOf(en);
    return {
      prompt: prompt || t('Pavadinkite produktą.', 'Name the product.'),
      kind: 'name', mol: { smi }, answer: { smi },
      hint: t('Raskite pagrindinę grandinę ar žiedą ir sunumeruokite taip, kad pakaitai gautų mažiausius numerius.', 'Find the parent chain or ring and number it so the substituents get the lowest numbers.'),
      solution: nameSolution(lt.name, enName)
    };
  };
  const mechHX = (smi, cat, hC, xC, X) => ({
    scheme: { items: [{ smi }, { plus: true }, { smi: X, opts: { allH: true } }, { arrow: '→' }, { smi: cat }, { plus: true }, { smi: '[' + X + '-]' }], maxWidth: 640 },
    arrows: [{ from: { m: 0, b: [hC, xC] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
    note: t('Lėtoji stadija: $π$ elektronai sudaro $C-H$ ryšį; $H-X$ elektronai pereina halogenui.', 'The slow stage: the $π$ electrons form the $C-H$ bond; the $H-X$ electrons go to the halogen.')
  });
  const mechNu = (cat, xC, X, product) => ({
    scheme: { items: [{ smi: cat }, { plus: true }, { smi: '[' + X + '-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: product }], maxWidth: 640 },
    arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: xC } }],
    note: t('Greitoji stadija: halogenido laisvoji pora sudaro ryšį su katijono anglimi.', 'The fast stage: a lone pair of the halide forms the bond to the cation carbon.')
  });
  function mechTie(ctx, X) {
    const { chem, react } = ctx;
    let smi = null;
    let majors = null;
    for (let k = 0; k < 40 && !majors; k++) {
      smi = ctx.pick(ALK_T);
      if (react.wouldRearrange(smi)) continue;
      const m = react.run('ae.hx', [smi], { X }).products.filter(x => x.major);
      if (m.length === 2) majors = m;
    }
    if (!majors) throw new Error('u07.mech: no two-product alkene');
    const d = dbl(chem, smi);
    const alkane = first(react.run('ae.h2', [smi], {}));
    const dihalide = first(react.run('ae.x2', [smi], { X }));
    const c1 = cationSmi(chem, smi, d.b, d.a);
    const c2 = cationSmi(chem, smi, d.a, d.b);
    return {
      q: [
        { p: t('Alkenas reaguoja su vandenilio halogenidu. Išnagrinėkite mechanizmą.', 'An alkene reacts with a hydrogen halide. Work through the mechanism.') },
        { scheme: { items: [{ smi }, { plus: true }, { smi: X }, { arrow: '→' }] } }
      ],
      steps: [
        {
          prompt: t('Bakstelėkite visus dvigubojo ryšio atomus, prie kurių gali prisijungti protonas.', 'Tap every double-bond carbon that can receive the proton.'),
          kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: [d.a, d.b],
          hint: t('Palyginkite abu dvigubojo ryšio atomus: kokie katijonai susidarytų?', 'Compare the two double-bond carbons: which cations would result?'),
          solution: t('Abu atomai turi po vieną vandenilį ir po vieną alkilo pakaitą, todėl protonas gali jungtis prie bet kurio.', 'Both carbons have one hydrogen and one alkyl group, so the proton can bond to either.')
        },
        {
          prompt: t('Kokie karbokatijonai gali susidaryti?', 'Which carbocations can form?'),
          kind: 'choice',
          options: [
            { text: t('Du antriniai karbokatijonai, vienodai stabilūs.', 'Two secondary carbocations of similar stability.') },
            { text: t('Vienas antrinis ir vienas pirminis.', 'One secondary and one primary.') },
            { text: t('Tik vienas tretinis.', 'Only one tertiary.') },
            { text: t('Tik vienas antrinis.', 'Only one secondary.') }
          ],
          answer: 0,
          hint: t('Suskaičiuokite anglies atomus prie kiekvieno galimo teigiamo atomo.', 'Count the carbons on each possible positive carbon.'),
          solution: [{ p: t('Abu katijonai yra antriniai.', 'Both cations are secondary.') }, { mol: [{ smi: c1 }, { smi: c2 }] }]
        },
        {
          prompt: t('Pažymėkite visus produktus, kurie susidaro panašiu kiekiu.', 'Select every product that forms in comparable amounts.'),
          kind: 'multi',
          options: [{ mol: { smi: majors[0].smi } }, { mol: { smi: majors[1].smi } }, { mol: { smi: dihalide } }, { mol: { smi: alkane } }],
          answer: [0, 1],
          hint: t('Halogenidas jungiasi prie kiekvieno katijono.', 'The halide bonds to each cation.'),
          solution: [{ p: t('Kiekvienas katijonas duoda savo produktą: gaunamas dviejų izomerų mišinys.', 'Each cation gives its own product: a mixture of two isomers.') }, { mol: [{ smi: majors[0].smi }, { smi: majors[1].smi }] }]
        },
        {
          prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
          kind: 'choice', options: [{ text: t('AE', 'AE') }, { text: t('AN', 'AN') }, { text: t('SR', 'SR') }, { text: t('SN1', 'SN1') }], answer: 0,
          hint: t('Dvigubąjį ryšį atakuoja elektrofilas, ir reagentas prisijungia prie abiejų jo atomų.', 'An electrophile attacks the double bond, and the reagent adds across it.'),
          solution: t('AE, elektrofilinis prijungimas.', 'AE, electrophilic addition.')
        }
      ],
      why: t('Kai abu katijonai vienodos klasės, jų stabilumas panašus ir susidaro abiejų produktų mišinys. Markovnikovo taisyklė pasirenka vieną produktą tik tada, kai vienas katijonas stabilesnis.',
        'When both cations are of the same class their stability is similar and a mixture of both products forms. Markovnikov’s rule picks one product only when one cation is more stable.'),
      src: 'L7 p12, S4.3'
    };
  }
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
        const p = sym ? pickSym(ctx, ALK_S, 'ae.hx', { X }) : pickUnsym(ctx, ALK_H, 'ae.hx', { X }, true);
        const dihalide = first(react.run('ae.x2', [p.smi], { X }));
        const alkane = first(react.run('ae.h2', [p.smi], {}));
        const alcohol = first(react.run('ae.h2o', [p.smi], {}));
        const gem = gemAdduct(chem, p.smi, X);
        const options = optionList(ctx, p.major, p.minor.concat([gem, dihalide, alkane, alcohol]), 4);
        const steps = [];
        if (!sym) {
          const cn = catName(p);
          steps.push({
            prompt: t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
            kind: 'atoms', mol: { smi: p.smi, opts: { numbers: 'all' } }, answer: [p.hC],
            hint: t('Po protono prisijungimo ant kito atomo lieka teigiamas krūvis. Kuris katijonas stabilesnis?', 'After the proton bonds, the other carbon carries the positive charge. Which cation is more stable?'),
            solution: t('Atomas Nr. ' + (p.hC + 1) + ' gauna $H+$, nes teigiamas krūvis lieka ant atomo Nr. ' + (p.xC + 1) + ' ir ten susidaro ' + cn.nom.lt + '.',
              'Carbon no. ' + (p.hC + 1) + ' receives $H+$, because the positive charge stays on carbon no. ' + (p.xC + 1) + ' and ' + cn.nom.en + ' forms there.')
          });
        } else {
          steps.push({
            prompt: t('Kodėl šio alkeno reakcijoje susidaro tik vienas monohalogenidas?', 'Why does this alkene give only one monohalide?'),
            kind: 'choice',
            options: [
              { text: t('Abu dvigubojo ryšio atomai vienodi, todėl abu katijonai tokie patys.', 'Both double-bond carbons are alike, so both cations are the same.') },
              { text: t('Halogenas jungiasi prie abiejų atomų iš karto.', 'The halogen bonds to both carbons at once.') },
              { text: t('Vienas katijonas visada labai nestabilus.', 'One cation is always very unstable.') },
              { text: t('Susidaro du skirtingi katijonai, bet vienas iš karto persigrupuoja.', 'Two different cations form but one rearranges at once.') }
            ],
            answer: 0,
            hint: t('Palyginkite, kas prijungta prie kiekvieno dvigubojo ryšio atomo.', 'Compare what is attached to each double-bond carbon.'),
            solution: t('Alkenas simetriškas: prijungus $H+$ prie bet kurio atomo, gaunamas tas pats katijonas ir tas pats produktas.', 'The alkene is symmetrical: $H+$ adding to either carbon gives the same cation and the same product.')
          });
        }
        steps.push({
          prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: 'choice', options, answer: 0,
          hint: sym
            ? t('Kiek $HX$ molekulių prisijungia ir prie kiek atomų?', 'How many $HX$ molecules add, and to how many carbons?')
            : t('Pirmiausia atmeskite variantus, kuriuose prisijungė ne viena $HX$ molekulė arba kitas reagentas, tada palyginkite prijungimo kryptis.', 'First rule out options that are not a single $HX$ addition, then compare the directions of addition.'),
          solution: [{ p: sym ? t('Abu atomai vienodi, todėl susidaro vienas produktas.', 'Both carbons are alike, so only one product forms.') : (() => { const cn = catName(p); return t('Halogenas jungiasi prie ' + cn.gen.lt + ' anglies.', 'The halogen bonds to the carbon of ' + cn.gen.en + '.'); })() }, { mol: { smi: p.major } }]
        });
        const ns = nameStep(ctx, p.major);
        if (ns) steps.push(ns);
        return {
          q: [{ scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: X }, { arrow: '→' }] } }],
          steps,
          why: t('$HX$ prijungimas vyksta per karbokatijoną: protonas pasirenka dvigubojo ryšio atomą, po kurio lieka stabilesnis katijonas (benzilkatijonas, tretinis > antrinis > pirminis), o halogenidas jungiasi prie teigiamos anglies. Todėl pagrindinis produktas atitinka Markovnikovo taisyklę, o ne atvirkštinę kryptį.',
            '$HX$ addition goes through a carbocation: the proton chooses the double-bond carbon that leaves the more stable cation (benzylic, tertiary > secondary > primary), and the halide bonds to the positive carbon. That is why the main product follows Markovnikov’s rule and not the reverse.'),
          src: 'L7 p9'
        };
      }
    },
    /* ---- mechanism ---- */
    {
      id: 'u07.mech',
      title: t('HX prijungimo mechanizmas stadija po stadijos', 'The mechanism of HX addition, stage by stage'),
      mirrors: ['S4.3', 'S4.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const X = ctx.pick(['Cl', 'Br', 'I']);
        if (rng() < 0.25) return mechTie(ctx, X);
        const p = pickUnsym(ctx, ALK_H, 'ae.hx', { X }, true);
        const cn = catName(p);
        const cat = cationSmi(chem, p.smi, p.hC, p.xC);
        const other = cationSmi(chem, p.smi, p.xC, p.hC);
        if (!cat || !other) throw new Error('u07.mech: cation');
        const alkane = first(react.run('ae.h2', [p.smi], {}));
        const dihalide = first(react.run('ae.x2', [p.smi], { X }));
        return {
          q: [
            { p: t('Alkenas reaguoja su vandenilio halogenidu. Išnagrinėkite mechanizmą.', 'An alkene reacts with a hydrogen halide. Work through the mechanism.') },
            { scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: X }, { arrow: '→' }] } }
          ],
          steps: [
            {
              prompt: t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
              kind: 'atoms', mol: { smi: p.smi, opts: { numbers: 'all' } }, answer: [p.hC],
              hint: t('Kuris dvigubojo ryšio atomas turi daugiau vandenilių, ir prie kurio atomo teigiamas krūvis po to būtų stabilesnis?', 'Which double-bond carbon has more hydrogens, and where would the positive charge be more stable afterwards?'),
              solution: t('Atomas Nr. ' + (p.hC + 1) + ' gauna protoną, nes tada teigiamas krūvis lieka ant atomo Nr. ' + (p.xC + 1) + ' ir susidaro ' + cn.nom.lt + '. $π$ elektronai atakuoja $H+$ ties atomu Nr. ' + (p.hC + 1) + '.',
                'Carbon no. ' + (p.hC + 1) + ' receives the proton because the positive charge then stays on carbon no. ' + (p.xC + 1) + ' and ' + cn.nom.en + ' forms. The $π$ electrons attack $H+$ at carbon no. ' + (p.hC + 1) + '.')
            },
            {
              prompt: t('Kuris karbokatijonas susidaro?', 'Which carbocation forms?'),
              kind: 'choice',
              options: [{ mol: { smi: cat } }, { mol: { smi: other } }, { text: t('Karbokatijonas nesusidaro: halogenidas prisijungia pirmas.', 'No carbocation forms: the halide adds first.') }],
              answer: 0,
              hint: t('Palyginkite abu galimus katijonus: konjuguotas ir tretinis > antrinis > pirminis.', 'Compare the two possible cations: conjugated and tertiary > secondary > primary.'),
              solution: [
                { p: t('Susidaro stabilesnis katijonas – ' + cn.nom.lt + '. Alternatyva būtų mažiau stabilus katijonas, todėl ji lėtesnė.', 'The more stable cation forms: ' + cn.nom.en + '. The alternative would be less stable and so slower.') },
                { mech: [mechHX(p.smi, cat, p.hC, p.xC, X)] }
              ]
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options: optionList(ctx, p.major, p.minor.concat([dihalide, alkane]), 4), answer: 0,
              hint: t('Halogenido anijonas jungiasi prie teigiamo atomo.', 'The halide anion bonds to the positive carbon.'),
              solution: [
                { p: t('Halogenido laisvoji elektronų pora sudaro ryšį su katijono anglimi.', 'A lone pair of the halide bonds to the cation carbon.') },
                { mech: [mechNu(cat, p.xC, X, p.major)] }
              ]
            },
            {
              prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
              kind: 'choice', options: [{ text: t('AE', 'AE') }, { text: t('AN', 'AN') }, { text: t('SR', 'SR') }, { text: t('SN1', 'SN1') }], answer: 0,
              hint: t('Dvigubąjį ryšį atakuoja elektrofilas, ir reagentas prisijungia prie abiejų jo atomų.', 'An electrophile attacks the double bond, and the reagent adds across it.'),
              solution: t('AE, elektrofilinis prijungimas: elektrofilas $H+$ atakuoja $π$ ryšį, po to nukleofilas prisijungia prie karbokatijono.', 'AE, electrophilic addition: the electrophile $H+$ attacks the $π$ bond, then the nucleophile bonds to the carbocation.')
            }
          ],
          why: t('Alkenas yra nukleofilas: jo $π$ elektronai atakuoja $H+$. Protonas jungiasi taip, kad susidarytų stabilesnis katijonas, o halogenidas tada prisijungia prie jo. Šios dvi stadijos yra elektrofilinis prijungimas (AE); lėtoji yra pirmoji.',
            'An alkene is a nucleophile: its $π$ electrons attack $H+$. The proton bonds so that the more stable cation forms, and the halide then bonds to it. These two stages are electrophilic addition (AE); the first is the slow one.'),
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
            prompt: t('Kodėl alilkatijonas ir benzilkatijonas stabilesni už alkilkatijonus?', 'Why are allyl and benzyl cations more stable than alkyl cations?'),
            options: [
              { text: t('Teigiamas krūvis pasiskirsto konjugacijos būdu per $π$ sistemą (rezonansinės formulės).', 'The positive charge is spread over the $π$ system by conjugation (resonance structures).') },
              { text: t('Jie turi daugiau alkilo pakaitų, todėl hiperkonjugacija stipresnė.', 'They have more alkyl groups, so hyperconjugation is stronger.') },
              { text: t('Dvigubasis ryšys stipriai stumia elektronus per $σ$ ryšius (+I).', 'The double bond pushes electrons strongly through $σ$ bonds (+I).') },
              { text: t('Jie mažesni, todėl jų sterinė įtampa mažesnė.', 'They are smaller, so their steric strain is lower.') }
            ],
            hint: t('Nupieškite katijoną ir pabandykite parašyti daugiau nei vieną rezonansinę formulę.', 'Draw the cation and try to write more than one resonance structure.'),
            solution: t('Alilkatijone ir benzilkatijone tuščia p orbitalė yra konjuguota su $π$ ryšiu, todėl krūvis pasiskirsto keliuose atomuose. Tai stabilizuoja stipriau nei alkilgrupių hiperkonjugacija.', 'In allyl and benzyl cations the empty p orbital is conjugated with a $π$ bond, so the charge is shared among several atoms. This stabilises more than hyperconjugation by alkyl groups.')
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
            solution: t('Kiekviena alkilgrupė pasidalija elektronais per $C-H$ ir $C-C$ ryšius su tuščia p orbitale (hiperkonjugacija). Kuo daugiau pakaitų, tuo stipresnis stabilizavimas: tretinis > antrinis > pirminis > metilkatijonas.', 'Each alkyl group shares electrons from its $C-H$ and $C-C$ bonds with the empty p orbital (hyperconjugation). The more substituents, the stronger the stabilisation: tertiary > secondary > primary > methyl.')
          };
        return {
          q: [{ p: t('Palyginkite karbokatijonų stabilumą.', 'Compare the stability of these carbocations.') }, { mol: options.map(o => o.mol) }],
          steps: [
            {
              prompt: t('Išdėstykite karbokatijonus nuo stabiliausio iki mažiausiai stabilaus.', 'Put the carbocations in order from most stable to least stable.'),
              kind: 'order', options,
              hint: t('Pirmiausia ieškokite konjuguotų katijonų (alilkatijono, benzilkatijono), tada skaičiuokite alkilo pakaitus.', 'Look first for conjugated cations (allyl, benzyl), then count the alkyl substituents.'),
              solution: t('Eilė: benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas.', 'Order: benzyl > allyl > tertiary > secondary > primary > methyl.')
            },
            { prompt: reason.prompt, kind: 'choice', options: reason.options, answer: 0, hint: reason.hint, solution: reason.solution }
          ],
          why: t('Alkeno prijungimo kryptį lemia tarpinio katijono stabilumas. Stabilumą didina konjugacija (alilkatijonas, benzilkatijonas) ir hiperkonjugacija su alkilo pakaitais, todėl prijungimas vyksta per stabiliausią katijoną.',
            'The stability of the intermediate cation decides the direction of addition. Stability grows with conjugation (allyl, benzyl) and with hyperconjugation by alkyl groups, so addition goes through the most stable cation.'),
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
        const { chem, react } = ctx;
        const sym = rng() < 0.3;
        const p = sym ? pickSym(ctx, ALK_S, 'ae.h2o', {}) : pickUnsym(ctx, ALK_H, 'ae.h2o', {}, true);
        const diol = first(react.run('ox.kmno4.mild', [p.smi], {}));
        const alkane = first(react.run('ae.h2', [p.smi], {}));
        const options = optionList(ctx, p.major, p.minor.concat([diol, alkane]), 4);
        const steps = [];
        if (!sym) {
          const cn = catName(p);
          steps.push({
            prompt: t('Bakstelėkite anglies atomą, prie kurio prisijungia $OH$ grupė.', 'Tap the carbon that receives the $OH$ group.'),
            kind: 'atoms', mol: { smi: p.smi, opts: { numbers: 'all' } }, answer: [p.xC],
            hint: t('$H+$ jungiasi pirmas. Prie kurios anglies lieka teigiamas krūvis ir kodėl ten jis stabilesnis?', '$H+$ bonds first. Which carbon is left positive, and why is the cation more stable there?'),
            solution: t('Vanduo jungiasi prie atomo Nr. ' + (p.xC + 1) + ', nes ten susidaro ' + cn.nom.lt + '.', 'Water bonds to carbon no. ' + (p.xC + 1) + ', because ' + cn.nom.en + ' forms there.')
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
          why: t('Rūgštyje $H3O+$ yra elektrofilas, todėl vyksta toks pat dviejų stadijų AE kaip su $HX$: susidaro stabilesnis katijonas, o jį atakuoja vanduo. Po to prarandamas protonas ir susidaro alkoholis.',
            'In acid $H3O+$ is the electrophile, so the same two-stage AE as with $HX$ takes place: the more stable cation forms and water attacks it. A proton is then lost and the alcohol forms.'),
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
        const { react, chem } = ctx;
        const smi = ctx.pick(ALK_ALL);
        const mode = ctx.pick(['Br', 'Cl', 'H2']);
        const hx = (() => { try { const r = react.run('ae.hx', [smi], { X: mode === 'Cl' ? 'Cl' : 'Br' }); return r.products.find(x => x.major).smi; } catch (e) { return null; } })();
        const diol = first(react.run('ox.kmno4.mild', [smi], {}));
        const alkane = first(react.run('ae.h2', [smi], {}));
        const dihalide = mode === 'H2' ? first(react.run('ae.x2', [smi], { X: 'Br' })) : first(react.run('ae.x2', [smi], { X: mode }));
        const gem = mode === 'H2' ? null : gemAdduct(chem, smi, mode);
        const right = mode === 'H2' ? alkane : dihalide;
        const wrong = mode === 'H2' ? [dihalide, hx, diol] : [gem, hx, diol, alkane];
        const options = optionList(ctx, right, wrong, 4);
        const above = mode === 'H2' ? 'H2, Pd' : mode + '2';
        const steps = [{
          prompt: t('Koks yra produktas?', 'What is the product?'),
          kind: 'choice', options, answer: 0,
          hint: mode === 'H2'
            ? t('Kiek vandenilio atomų prisijungia ir kas atsitinka su $C=C$?', 'How many hydrogen atoms add, and what happens to the $C=C$?')
            : t('Kiek halogeno atomų prisijungia ir prie kurių anglies atomų?', 'How many halogen atoms add, and to which carbons?'),
          solution: [{ p: mode === 'H2' ? t('$π$ ryšys virsta dviem $C-H$ ryšiais: gaunamas alkanas.', 'The $π$ bond becomes two $C-H$ bonds: an alkane.') : t('Du halogeno atomai jungiasi prie dviejų gretimų $C=C$ atomų (po vieną prie kiekvieno): gaunamas vicinalinis dihalogenidas.', 'Two halogen atoms bond to the two adjacent $C=C$ carbons (one to each): a vicinal dihalide.') }, { mol: { smi: right } }]
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
            ? t('Su $H2$ ir metalo katalizatoriumi dvigubasis ryšys prisotinamas: gaunamas alkanas su tuo pačiu anglies skeletu. Tai katalitinis hidrinimas (redukcija), kurio nežymime AE.', 'With $H2$ and a metal catalyst the double bond is saturated: an alkane with the same carbon skeleton results. This is catalytic hydrogenation (a reduction) and we do not label it AE.')
            : t('Halogenas prijungiamas prie abiejų $C=C$ atomų (AE per halogenonio, t. y. bromonio ar chloronio, joną), todėl gaunamas vicinalinis dihalogenidas, o ne HX produktas. Tai ir dvigubojo ryšio atpažinimo reakcija.', 'The halogen adds to both $C=C$ carbons (AE through a halonium, i.e. bromonium or chloronium, ion), so a vicinal dihalide forms, not the HX product. This is also the test reaction for a double bond.'),
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
        // s, carbon that receives the nucleophile, carbon that gets H, site of the first protonation (null: only the inductive effect), water allowed
        const POOL = [
          ['C=CC(=O)O', 0, 1, 'O', true], ['C=CC=O', 0, 1, 'O', true], ['C=CC(C)=O', 0, 1, 'O', true], ['CC=CC(=O)O', 1, 2, 'O', true],
          ['C=CC(=O)CC', 0, 1, 'O', true], ['CC=CC=O', 1, 2, 'O', true], ['CCC=CC(=O)O', 2, 3, 'O', true], ['C=CC(=O)OCC', 0, 1, 'O', false], ['C=CC(=O)OC', 0, 1, 'O', false], ['C=CC(N)=O', 0, 1, 'O', false], ['C=CC#N', 0, 1, 'N', false], ['C=CC(F)(F)F', 0, 1, null, false]
        ];
        for (let k = 0; k < 60; k++) {
          const [smi, nu, h, site, water] = ctx.pick(POOL);
          const hx = ctx.pick(water ? ['Cl', 'Br', 'I', 'OH'] : ['Cl', 'Br', 'I']);
          const res = hx === 'OH' ? react.run('ae.h2o', [smi], {}) : react.run('ae.hx', [smi], { X: hx });
          const majors = res.products.filter(x => x.major);
          if (majors.length !== 1) continue;
          const mine = adduct(smi, h, nu, hx === 'OH' ? 'O' : hx);
          if (!mine || !chem.same(mine, majors[0].smi, { stereo: false })) continue;
          const wrong = res.products.filter(x => !x.major).map(x => x.smi);
          const alkane = first(react.run('ae.h2', [smi], {}));
          const dihalide = hx === 'OH' ? first(react.run('ox.kmno4.mild', [smi], {})) : first(react.run('ae.x2', [smi], { X: hx }));
          const prodOptions = optionList(ctx, majors[0].smi, wrong.concat([dihalide, alkane]), 4);
          const siteLt = site === 'N' ? 'Nitrilo azotas' : 'Karbonilo deguonis';
          const siteEn = site === 'N' ? 'The nitrile nitrogen' : 'The carbonyl oxygen';
          const tapStep = {
            prompt: t('Bakstelėkite anglies atomą, prie kurio prisijungs nukleofilas.', 'Tap the carbon to which the nucleophile will bond.'),
            kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: [nu],
            hint: t('Prie $C=C$ yra elektronų akceptorinė grupė. Prie kurio atomo gali atsirasti teigiamas krūvis?', 'The $C=C$ carries an electron-withdrawing group. Where can a positive charge appear?'),
            solution: site
              ? t('Per konjuguotą sistemą teigiamas krūvis atsiduria ant tolimesnio (β) atomo Nr. ' + (nu + 1) + '; ten jungiasi nukleofilas.', 'Through the conjugated system the positive charge sits on the far (β) carbon no. ' + (nu + 1) + '; the nucleophile bonds there.')
              : t('Grupė destabilizuoja katijoną gretimame atome, todėl $H+$ jungiasi prie atomo Nr. ' + (h + 1) + ', o nukleofilas – prie atomo Nr. ' + (nu + 1) + '.', 'The group destabilises a cation on the adjacent carbon, so $H+$ bonds to carbon no. ' + (h + 1) + ' and the nucleophile to carbon no. ' + (nu + 1) + '.')
          };
          const prodStep = {
            prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
            kind: 'choice', options: prodOptions, answer: 0,
            hint: t('Nukleofilas jungiasi ten, kur buvo teigiamas krūvis.', 'The nucleophile bonds where the positive charge was.'),
            solution: [{ p: t('Nukleofilas atsiduria ant anglies, nutolusios nuo akceptorinės grupės.', 'The nucleophile ends up on the carbon away from the withdrawing group.') }, { mol: { smi: majors[0].smi } }]
          };
          const steps = [];
          if (site) {
            steps.push({
              prompt: t('Kur pirmiausia prisijungia $H+$?', 'Where does $H+$ bond first?'),
              kind: 'choice',
              options: [
                { text: t(siteLt + '.', siteEn + '.') },
                { text: t('Dvigubojo ryšio atomas prie grupės (α).', 'The double-bond carbon next to the group (α).') },
                { text: t('Tolimesnis dvigubojo ryšio atomas (β).', 'The far double-bond carbon (β).') },
                { text: t('Prie dvigubojo ryšio nejungiasi niekas: reakcija nevyksta.', 'Nothing bonds at all: no reaction.') }
              ],
              answer: 0,
              hint: t('Akceptorinė grupė mažina $π$ elektronų tankį dvigubajame ryšyje. Kur yra laisvųjų elektronų porų?', 'The withdrawing group lowers the $π$ electron density of the double bond. Where are the lone pairs?'),
              solution: t('Protonizuojamas ' + siteLt.toLowerCase() + ', nes dvigubąjį ryšį protonizuoti sunku. Teigiamas krūvis per konjuguotą sistemą persikelia į β anglį.', siteEn.replace('The ', 'the ') + ' is protonated, because protonating the double bond itself is hard. The positive charge moves through the conjugated system to the β carbon.')
            });
          }
          steps.push(tapStep);
          steps.push(prodStep);
          steps.push({
            prompt: t('Kodėl produktas prieštarauja Markovnikovo taisyklei?', 'Why does the product go against Markovnikov’s rule?'),
            kind: 'choice',
            options: site ? [
              { text: t('Protonizuojamas karbonilo (ar nitrilo) heteroatomas, o teigiamas krūvis per konjuguotą sistemą persikelia į tolimąjį (β) anglies atomą; ten jungiasi nukleofilas.', 'The heteroatom of the carbonyl (or nitrile) is protonated and the positive charge moves through the conjugated system to the far (β) carbon; the nucleophile bonds there.') },
              { text: t('Grupė stumia elektronus į dvigubąjį ryšį ir stabilizuoja katijoną prie savęs.', 'The group pushes electrons into the double bond and stabilises a cation next to it.') },
              { text: t('Protonas, kaip visada, jungiasi prie atomo, turinčio daugiau vandenilių.', 'The proton, as always, goes to the carbon with more hydrogens.') },
              { text: t('Pirmiausia prisijungia nukleofilas, o ne $H+$.', 'The nucleophile adds first, not $H+$.') }
            ] : [
              { text: t('$CF3$ labai traukia elektronus, todėl katijonas šalia jos destabilizuotas; $H+$ jungiasi prie anglies su $CF3$, o nukleofilas – prie tolimesnės.', '$CF3$ withdraws electrons strongly, so a cation next to it is destabilised; $H+$ bonds to the carbon carrying $CF3$ and the nucleophile to the farther carbon.') },
              { text: t('$CF3$ stumia elektronus ir stabilizuoja katijoną prie savęs.', '$CF3$ pushes electrons and stabilises a cation next to it.') },
              { text: t('Protonas, kaip visada, jungiasi prie atomo, turinčio daugiau vandenilių.', 'The proton, as always, goes to the carbon with more hydrogens.') },
              { text: t('Pirmiausia prisijungia nukleofilas, o ne $H+$.', 'The nucleophile adds first, not $H+$.') }
            ],
            answer: 0,
            hint: site ? t('Prisiminkite paskaitoje aptartą maleino rūgšties izomerizacijos mechanizmą: kas protonizuojamas pirmiausia?', 'Recall the maleic acid mechanism: what is protonated first?') : t('Palyginkite katijoną prie $CF3$ ir toliau nuo jos.', 'Compare the cation next to $CF3$ and the one farther away.'),
            solution: site
              ? t('Karbonilo (nitrilo) heteroatomas turi laisvųjų porų, todėl protonizuojamas lengviau nei dvigubasis ryšys. Rezonansinės formulės perkelia krūvį į β anglį, kurią atakuoja nukleofilas.', 'The carbonyl (nitrile) heteroatom has lone pairs, so it is protonated more easily than the double bond. Resonance structures move the charge to the β carbon, which the nucleophile attacks.')
              : t('$CF3$ neturi $π$ sistemos, kuria krūvis galėtų persikelti; veikia tik stiprus indukcijos efektas. Katijonas prie $CF3$ būtų labai nepalankus.', '$CF3$ has no $π$ system for the charge to move through; only a strong inductive effect acts. A cation next to $CF3$ would be very unfavourable.')
          });
          return {
            q: [{ scheme: { items: [{ smi }, { plus: true }, hx === 'OH' ? { smi: 'O' } : { smi: hx }, hx === 'OH' ? { arrow: '→', above: f('H+') } : { arrow: '→' }] } }],
            steps,
            why: site
              ? t('Kai prie $C=C$ yra karbonilo ar nitrilo grupė, rūgštis protonizuoja jos heteroatomą, ir teigiamas krūvis per konjugaciją atsiduria ant tolimesnio (β) atomo. Todėl nukleofilas jungiasi prie β anglies, prieš Markovnikovo taisyklę.', 'When a carbonyl or nitrile group sits on the $C=C$, the acid protonates its heteroatom and the positive charge reaches the far (β) carbon by conjugation. The nucleophile therefore bonds to the β carbon, against Markovnikov’s rule.')
              : t('$CF3$ stipriai traukia elektronus ir destabilizuoja gretimą teigiamą anglį, todėl $H+$ jungiasi prie anglies su grupe, o nukleofilas – prie tolimesnės.', '$CF3$ withdraws electrons strongly and destabilises the adjacent positive carbon, so $H+$ bonds to the carbon with the group and the nucleophile to the farther one.'),
            src: 'L7 p13, p16, S4.13'
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
        const POOL = ['CC(C)=CC', 'CCC=C', 'C=C1CCCCC1', 'C1=CCCCC1', 'CC=CCC', 'CC(C)=CCC', 'CCC(C)=CC', 'CCCC=C', 'CC=CCCC', 'CC1=CCCCC1', 'C=C1CCCC1', 'CC(C)=C', 'CCC=CCC', 'CCC(C)=C', 'CC(C)=C(C)C',
          'CC(C)=C1CCCCC1', 'CCC(C)=C(C)C'];
        const { react, chem } = ctx;
        const smi = ctx.pick(POOL);
        const medium = ctx.pick(['acid', 'neutral', 'alk']);
        const hot = rng() < 0.5;
        const cleave = medium === 'acid' || hot;
        const diol = first(react.run('ox.kmno4.mild', [smi], {}));
        const acids0 = harshProducts(ctx, smi);
        const m0 = chem.parse(smi);
        const d0 = dbl(chem, smi);
        const symmetric = acids0.length === 1 && !chem.rings(m0).some(r => r.includes(d0.a) && r.includes(d0.b));
        const acids = symmetric ? [acids0[0], acids0[0]] : acids0;
        const shown = medium === 'acid' ? acids : acids.map(toCarboxylate);          // salts in neutral or alkaline medium
        const other = medium === 'acid' ? acids.map(toCarboxylate) : acids;
        const alkane = first(react.run('ae.h2', [smi], {}));
        const alcohol = (() => { try { return first(react.run('ae.h2o', [smi], {})); } catch (e) { return null; } })();
        let cands;
        let right;
        if (cleave) {
          right = shown;
          cands = [];
          const aldAt = acids.findIndex(x => toAldehyde(x));
          if (aldAt >= 0) cands.push(shown.map((x, i) => ((symmetric || i === aldAt) ? (toAldehyde(acids[i]) || x) : x)));   // the aldehyde instead of the acid
          if (acids.includes('O=C=O')) cands.push(shown.map(x => (x === 'O=C=O' ? 'OC=O' : x)));        // formic acid instead of CO2
          if (medium === 'acid') cands.push(other);                                                       // the salt instead of the acid (wrong only in acid)
          cands.push([diol]);
        } else {
          right = [diol];
          cands = [acids0, [alcohol], [alkane]].filter(c => c[0]);
        }
        const rk = setKey(ctx, right);
        const opts = [right];
        const keys = new Set([rk]);
        cands.forEach(c => { if (!c || c.some(x => !x)) return; const k = setKey(ctx, c); if (!keys.has(k) && opts.length < 4) { keys.add(k); opts.push(c); } });
        const options = opts.map(setOption);
        const tempLt = hot ? 'kaitinant' : 'šaltyje';
        const above = medium === 'acid' ? 'KMnO4, H3O+' : medium === 'neutral' ? 'KMnO4, H2O' : 'KMnO4, OH-, H2O';
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
            answer: cleave ? 1 : 0,
            hint: t('Pažiūrėkite ir į terpę, ir į temperatūrą.', 'Look at both the medium and the temperature.'),
            solution: medium === 'acid'
              ? t('Rūgščioje terpėje skilimas vyksta ir šaltyje, ir kaitinant.', 'In acid the cleavage takes place both cold and hot.')
              : hot ? t('Neutralioje ar šarminėje terpėje kaitinant $C=C$ skyla (gaunamos rūgščių druskos).', 'In neutral or alkaline medium on heating the $C=C$ is cleaved (salts of the acids form).')
                : t('Šaltame neutraliame ar šarminiame tirpale $C=C$ lieka kaip $C-C$ ir susidaro diolis.', 'In a cold neutral or alkaline solution the $C=C$ remains as $C-C$ and a diol forms.')
          },
          {
            prompt: t('Kokie yra produktai?', 'What are the products?'),
            kind: 'choice', options, answer: 0,
            hint: cleave ? t('Kiekvienas dvigubojo ryšio atomas virsta karbonilo anglimi: ketonu, rūgštimi (druska) ar $CO2$.', 'Each double-bond carbon becomes a carbonyl carbon: a ketone, an acid (a salt) or $CO2$.') : t('Prie kiekvieno $C=C$ atomo prisijungia po vieną $OH$.', 'One $OH$ bonds to each $C=C$ carbon.'),
            solution: [{ p: cleave ? t('=CR₂ virsta ketonu, =CH–R rūgštimi' + (medium === 'acid' ? '' : ' (šarminėje ar neutralioje terpėje – jos druska)') + ', =CH₂ – $CO2$.', '=CR₂ becomes a ketone, =CH–R an acid' + (medium === 'acid' ? '' : ' (its salt in neutral or alkaline medium)') + ', =CH₂ becomes $CO2$.') : t('Abu atomai gauna po $OH$.', 'Both carbons receive an $OH$.') }, setOption(right)]
          }
        ];
        if (!cleave) {
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
          q: [{ scheme: { items: [{ smi }, { arrow: '→', above: f(above), below: hot ? f('t°') : t('šaltas', 'cold') }] } }],
          steps,
          why: cleave
            ? t('Rūgščioje terpėje $KMnO4$ skaido $C=C$ net šaltyje, o neutralioje ar šarminėje – kaitinant (tada gaunamos rūgščių druskos). Skaitykite pagal pakaitus: dipakeistas =CR₂ duoda ketoną, monopakeistas =CH–R rūgštį, =CH₂ – $CO2$. Diolis čia – tik tarpinis junginys, kuris oksiduojamas toliau.',
              'In acid $KMnO4$ cleaves the $C=C$ even cold, in neutral or alkaline medium only when heated (the acids then form as salts). Read it by substituents: disubstituted =CR₂ gives a ketone, monosubstituted =CH–R an acid, =CH₂ gives $CO2$. The diol here is only an intermediate that is oxidised further.')
            : t('Švelniomis sąlygomis (šaltame šarminiame ar neutraliame tirpale) anglies grandinė nenutrūksta: prie abiejų $C=C$ atomų prisijungia po $OH$ grupę ir susidaro 1,2-diolis. Spalvos kaita (violetinė → rudas $MnO2$) rodo dvigubąjį ryšį.',
              'Under mild conditions (cold alkaline or neutral solution) the chain stays intact: an $OH$ adds to each $C=C$ carbon and a 1,2-diol forms. The colour change (violet → brown $MnO2$) signals a double bond.'),
          src: cleave ? 'L7 p24, p26' : 'L7 p23'
        };
      }
    },
    /* ---- back to the alkene ---- */
    {
      id: 'u07.back',
      title: t('Nuo $KMnO4$ produktų atgal prie alkeno', 'Back from the $KMnO4$ products to the alkene'),
      mirrors: ['S4.14'],
      gen(rng, ctx) {
        const { chem, stereo } = ctx;
        const POOL = ['CC(C)=CC', 'CCC=C', 'C=C1CCCCC1', 'C1=CCCCC1', 'CC=CCC', 'CC(C)=CCC', 'CCC(C)=CC', 'CCCC=C', 'CC=CCCC', 'CC1=CCCCC1', 'C=C1CCCC1', 'CC(C)=C', 'CCC=CCC', 'CCC(C)=C', 'CC(C)=C(C)C', 'CC(C)=CCCC',
          'CC(C)=C1CCCCC1', 'CCC(C)=C(C)C'];
        const smi = ctx.pick(POOL);
        const prods = harshProducts(ctx, smi);
        const m0 = chem.parse(smi);
        const d = dbl(chem, smi);
        const inRing = chem.rings(m0).some(r => r.includes(d.a) && r.includes(d.b));
        const symmetric = prods.length === 1 && !inRing;
        const shownProds = symmetric ? [prods[0], prods[0]] : prods;
        const joined = shownProds.join('.');
        const jm = chem.parse(joined);
        const carbonyl = [];
        jm.atoms.forEach((a, i) => { if (a.el === 'C' && jm.nbr[i].some(j => jm.atoms[j].el === 'O' && jm.bondAt(i, j).order === 2)) carbonyl.push(i); });
        if (carbonyl.length < 2) throw new Error('u07.back: carbonyls');
        // wrong options: isomers with the same formula whose cleavage gives other products
        const formula = chem.formulaString(m0);
        const rightKey = setKey(ctx, prods);
        let iso = [];
        try { iso = stereo.isomers(formula, { filter: 'alkene', rings: true }) || []; } catch (e) { iso = []; }
        iso = ctx.shuffle(iso.slice()).filter(s => chem.same(s, smi, { stereo: false }) === false && (() => { try { const im = chem.parse(s); return im.bonds.filter(b => b.order === 2).length === 1 && !im.bonds.some(b => b.order === 3) && chem.rings(im).every(r => r.length >= 5) && !/=C=/.test(s) && setKey(ctx, harshProducts(ctx, s)) !== rightKey; } catch (e) { return false; } })());
        const poolSame = ctx.shuffle(POOL.slice()).filter(s => s !== smi && chem.formulaString(chem.parse(s)) === formula && setKey(ctx, harshProducts(ctx, s)) !== rightKey);
        const poolOther = ctx.shuffle(POOL.slice()).filter(s => s !== smi && setKey(ctx, harshProducts(ctx, s)) !== rightKey);
        const options = optionList(ctx, smi, poolSame.concat(iso, poolOther), 4);
        if (options.length < 3) throw new Error('u07.back: too few options');
        const steps = [
          {
            prompt: t('Bakstelėkite anglies atomus, kurie buvo dvigubojo ryšio atomai.', 'Tap the carbons that were the double-bond carbons.'),
            kind: 'atoms', mol: { smi: joined, opts: { numbers: 'all' } }, answer: carbonyl,
            hint: t('Ten, kur dabar yra $C=O$, ryšys buvo nutrauktas.', 'The bond was cut where a $C=O$ is now.'),
            solution: t('Visi $C=O$ anglies atomai (' + carbonyl.map(i => i + 1).join(', ') + ') buvo dvigubojo ryšio atomai.', 'All the $C=O$ carbons (' + carbonyl.map(i => i + 1).join(', ') + ') were double-bond carbons.')
          },
          {
            prompt: t('Kuris alkenas buvo oksiduotas?', 'Which alkene was oxidised?'),
            kind: 'choice', options, answer: 0,
            hint: symmetric ? t('Gauta viena medžiaga: sujunkite dvi jos molekules dvigubuoju ryšiu.', 'Only one compound formed: join two molecules of it with a double bond.') : inRing ? t('Gautas vienas produktas su dviem $C=O$ grupėmis: sujunkite jų anglis grandinės viduje.', 'A single product with two $C=O$ groups: join their carbons inside the chain.') : t('Sujunkite dvi $C=O$ anglis dvigubuoju ryšiu: ketono ir rūgšties atomus.', 'Join two $C=O$ carbons with a double bond: those of the ketone and the acid.'),
            solution: [{ p: t('Atkūrus $C=C$ ten, kur buvo $C=O$, gaunamas alkenas. Izomerai su kitoje vietoje esančiu $C=C$ duotų kitus produktus.', 'Restoring the $C=C$ where the $C=O$ groups are gives the alkene. Isomers with the $C=C$ elsewhere would give other products.') }, { mol: { smi } }]
          }
        ];
        const ns = nameStep(ctx, smi, t('Pavadinkite alkeną.', 'Name the alkene.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: symmetric ? t('Alkeną oksiduojant $KMnO4$ rūgščioje terpėje kaitinant gauta tik viena medžiaga (iš kiekvienos alkeno molekulės susidaro dvi tokios molekulės).', 'Oxidising an alkene with $KMnO4$ in hot acid gave a single compound (each alkene molecule gives two molecules of it).') : t('Alkeną oksiduojant $KMnO4$ rūgščioje terpėje kaitinant gauti šie produktai.', 'Oxidising an alkene with $KMnO4$ in hot acid gave these products.') },
            { scheme: { items: [{ arrow: '→', above: f('KMnO4, H3O+'), below: f('t°') }].concat(prods.reduce((a, s, i) => a.concat(i ? [{ plus: true }] : [], [{ smi: s }]), [])) } }],
          steps,
          why: t('Skilimo produktai nurodo, kur buvo dvigubasis ryšys: kiekvienas $C=O$ anglies atomas yra buvęs $C=C$ atomas. Ketonas rodo dipakeistą =CR₂, rūgštis – monopakeistą =CH–R, $CO2$ – galinį =CH₂. Jei produktas vienas, alkenas simetrinis arba žiedinis.', 'The cleavage products show where the double bond was: every $C=O$ carbon was a $C=C$ carbon. A ketone points to disubstituted =CR₂, an acid to monosubstituted =CH–R, $CO2$ to a terminal =CH₂. A single product means a symmetrical or a cyclic alkene.'),
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
        const R = reagentList(ctx, smi);
        const chosen = pickReagents(ctx, R, 4);
        const retry = () => TYPES_GEN.find(x => x.id === 'u07.fate').gen(rng, ctx);
        const outs = chosen.map(r => r.o());
        if (chosen.length < 4 || outs.some(o => !o || o.some(x => !x))) return retry();
        if (new Set(outs.map(o => setKey(ctx, o))).size !== 4) return retry();
        return {
          q: [{ p: t('Šis alkenas reaguoja su skirtingais reagentais.', 'This alkene reacts with different reagents.') }, { mol: { smi } }],
          steps: [{
            prompt: t('Suporuokite reagentą su pagrindiniu produktu.', 'Match each reagent with its main product.'),
            kind: 'match',
            answer: { left: chosen.map(r => ({ text: r.l })), right: outs.map(o => setOption(o)), pairs: [0, 1, 2, 3] },
            hint: t('Pirmiausia išskirkite reagentus, kurie nutraukia $C=C$, tuos, kurie jį palieka, ir tuos, kurie prijungia $H$ ir $X$ nesimetriškai (pagal Markovnikovo taisyklę).', 'First separate the reagents that cleave the $C=C$, those that keep it, and those that add $H$ and $X$ unsymmetrically (by Markovnikov’s rule).'),
            solution: t('$HBr$ ir $H2O/H+$ jungiasi pagal Markovnikovo taisyklę; $Br2$ ir $KMnO4$ (šaltas) prijungia po vieną grupę prie abiejų atomų; $H2$ duoda alkaną; karštas rūgštus $KMnO4$ skaido ryšį.', '$HBr$ and $H2O/H+$ add by Markovnikov’s rule; $Br2$ and cold $KMnO4$ put one group on each carbon; $H2$ gives the alkane; hot acidic $KMnO4$ cleaves the bond.')
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
        const p = pickUnsym(ctx, ALK_H, 'ae.hx', { X: 'Br' }, true);
        const res = react.run('ae.hx', [p.smi], { X: 'Br', peroxide: perox });
        const majors = res.products.filter(x => x.major);
        if (majors.length !== 1) return TYPES_GEN.find(x => x.id === 'u07.radical').gen(rng, ctx);
        const right = majors[0].smi;
        const other = res.products.filter(x => !x.major).map(x => x.smi);
        const options = optionList(ctx, right, other.concat([first(react.run('ae.x2', [p.smi], { X: 'Br' })), first(react.run('ae.h2', [p.smi], {}))]), 4);
        const cn = catName(p);
        return {
          q: [{ scheme: { items: [{ smi: p.smi }, { plus: true }, { smi: 'Br' }, perox ? { arrow: '→', below: f('ROOR') } : { arrow: '→' }] } }],
          steps: [
            {
              prompt: t('Koks mechanizmas vyksta?', 'Which mechanism takes place?'),
              kind: 'choice',
              options: [{ text: t('AE', 'AE') }, { text: t('AR', 'AR') }, { text: t('SR', 'SR') }, { text: t('AN', 'AN') }],
              answer: perox ? 1 : 0,
              hint: t('Palyginkite sąlygas su tomis, kuriose $HBr$ jungiasi per katijoną ir per radikalą.', 'Compare the conditions with those where $HBr$ adds through a cation and through a radical.'),
              solution: perox ? t('Su peroksidais vyksta radikalinis prijungimas, AR: peroksidai sudaro $Br•$ radikalus.', 'With peroxides a radical addition, AR, takes place: peroxides make $Br•$ radicals.') : t('Be peroksidų vyksta elektrofilinis prijungimas, AE, per ' + cn.nom.lt + '.', 'Without peroxides an electrophilic addition, AE, takes place through ' + cn.nom.en + '.')
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options, answer: 0,
              hint: perox ? t('Kuris radikalas stabilesnis: gautas prisijungus $Br•$ prie vieno ar kito atomo?', 'Which radical is more stable: the one from $Br•$ adding to one carbon or to the other?') : t('Palyginkite galimus karbokatijonus.', 'Compare the possible carbocations.'),
              solution: [{ p: perox ? t('$Br•$ jungiasi taip, kad susidarytų stabilesnis radikalas (benzilinis > tretinis > antrinis > pirminis), todėl $Br$ atsiduria ant kito atomo nei be peroksidų (prieš Markovnikovo taisyklę).', '$Br•$ bonds so that the more stable radical forms; $Br$ ends up on the carbon with more hydrogens (against Markovnikov’s rule).') : t('Halogenas jungiasi prie stabilesnio katijono anglies (Markovnikovo taisyklė).', 'The halogen bonds to the carbon of the more stable cation (Markovnikov’s rule).') }, { mol: { smi: right } }]
            }
          ],
          why: t('Be peroksidų HBr jungiasi per karbokatijoną (AE) pagal Markovnikovo taisyklę. Su peroksidais sudaromi $Br•$ radikalai: jie jungiasi pirmi, ir kryptį lemia radikalo, o ne katijono stabilumas, todėl produktas yra priešingas. Tai galioja tik $HBr$.',
            'Without peroxides HBr adds through a carbocation (AE) following Markovnikov’s rule. With peroxides $Br•$ radicals form and add first; the radical, not the cation, decides the direction, so the product is the opposite one. This holds only for $HBr$.'),
          src: 'L7 p13, p14, p17'
        };
      }
    },
    /* ---- reagent choice ---- */
    {
      id: 'u07.reagent',
      title: t('Kokio reagento reikia?', 'Which reagent do you need?'),
      mirrors: ['S4.4', 'S4.6'],
      gen(rng, ctx) {
        const { react } = ctx;
        let smi = null;
        for (let k = 0; k < 60; k++) { const s = ctx.pick(ALK_U); if (!react.wouldRearrange(s)) { smi = s; break; } }
        if (!smi) throw new Error('u07.reagent');
        const R = reagentList(ctx, smi);
        const chosen = pickReagents(ctx, R, 4);
        const outs = chosen.map(r => r.o());
        if (chosen.length < 4 || outs.some(o => !o || o.some(x => !x))) return TYPES_GEN.find(x => x.id === 'u07.reagent').gen(rng, ctx);
        if (new Set(outs.map(o => setKey(ctx, o))).size !== 4) return TYPES_GEN.find(x => x.id === 'u07.reagent').gen(rng, ctx);
        const product = setOption(outs[0]);
        const items = [{ smi }, { arrow: '→', above: f('?') }].concat(outs[0].reduce((a, s, i) => a.concat(i ? [{ plus: true }] : [], [{ smi: s }]), []));
        return {
          q: [{ p: t('Alkenas paverčiamas nurodytu produktu (produktais).', 'The alkene is converted into the product(s) shown.') }, { scheme: { items } }],
          steps: [{
            prompt: t('Kuris reagentas tai atlieka?', 'Which reagent does this?'),
            kind: 'choice', options: chosen.map(r => ({ text: r.l })), answer: 0,
            hint: t('Palyginkite produkto ir alkeno formules: ar prisijungė $H$, halogenas, $OH$, ar skilo $C=C$?', 'Compare the formulas of product and alkene: did $H$, a halogen or $OH$ add, or was the $C=C$ cleaved?'),
            solution: [{ p: chosen[0].w }, product]
          }],
          why: t('Reagentą parenkame iš to, kas atsitiko su $C=C$: vienas $H$ ir vienas $X$ ar $OH$ (HX, $H2O/H+$), du halogenai ($Br2$), du vandeniliai ($H2$), du $OH$ ($KMnO4$ šaltas) ar ryšio skilimas ($KMnO4$ karštas, rūgštus).',
            'Choose the reagent from what happened to the $C=C$: one $H$ and one $X$ or $OH$ (HX, $H2O/H+$), two halogens ($Br2$), two hydrogens ($H2$), two $OH$ (cold $KMnO4$) or cleavage of the bond (hot acidic $KMnO4$).'),
          src: 'L7 p27'
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
        const enName = enNameOf(nm.en);
        if (rng() < 0.6) {
          const f1 = chem.formulaString(chem.parse(smi));
          return {
            q: [{ mol: { smi } }],
            steps: [
              {
                prompt: t('Kokia šio alkeno molekulinė formulė?', 'What is the molecular formula of this alkene?'),
                kind: 'formula', mol: { smi }, answer: f1,
                hint: t('Suskaičiuokite anglies atomus; vienas dvigubasis ryšys atitinka formulę CₙH₂ₙ (žiedinio – CₙH₂ₙ₋₂).', 'Count the carbons; one double bond fits CₙH₂ₙ (a ring with one double bond: CₙH₂ₙ₋₂).'),
                solution: t('Formulė: ' + f1 + '.', 'The formula is ' + f1 + '.')
              },
              {
                prompt: t('Pavadinkite alkeną.', 'Name the alkene.'),
                kind: 'name', mol: { smi }, answer: { smi },
                hint: t('Ilgiausia grandinė turi apimti $C=C$; numeruokite nuo galo, arčiau dvigubojo ryšio.', 'The longest chain must contain the $C=C$; number from the end nearer to the double bond.'),
                solution: nameSolution(nm.lt.name, enName)
              }
            ],
            why: t('Pagrindinė grandinė turi apimti dvigubąjį ryšį, numeruojama nuo galo, arčiau kurio jis yra, o pavadinimas baigiasi -enas su dvigubojo ryšio numeriu. Pakaitų numeriai skaičiuojami pagal tą pačią numeraciją.',
              'The main chain must contain the double bond and is numbered from the end nearer to it; the name ends in -ene with the locant of the double bond. Substituent locants follow the same numbering.'),
            src: 'L7 p2'
          };
        }
        const f = chem.formulaString(chem.parse(smi));
        const same = ctx.shuffle(POOL.slice()).filter(s => s !== smi && (() => { try { return chem.formulaString(chem.parse(s)) === f; } catch (e) { return false; } })());
        const rest = ctx.shuffle(POOL.slice()).filter(s => s !== smi);
        const options = optionList(ctx, smi, same.concat(rest), 4);
        return {
          q: [{ p: t('Pasirinkite struktūrą, atitinkančią pavadinimą: ' + nm.lt.name + '.', 'Choose the structure that matches the name: ' + enName + '.') }],
          steps: [{
            prompt: t('Kuri struktūra atitinka pavadinimą?', 'Which structure matches the name?'),
            kind: 'choice', options, answer: 0,
            hint: t('Suraskite pagrindinę grandinę, dvigubojo ryšio vietą ir pakaitus.', 'Find the main chain, the position of the double bond and the substituents.'),
            solution: [{ p: t('Pavadinime nurodyta grandinė, dvigubojo ryšio numeris ir pakaitai.', 'The name gives the chain, the locant of the double bond and the substituents.') }, { mol: { smi } }]
          }],
          why: t('Skaitykite pavadinimą iš galo: -enas rodo dvigubąjį ryšį, prieš jį esantis skaičius – jo vietą, o pradžioje esantys pakaitai ir jų numeriai nusako šonines grupes.', 'Read the name from the end: -ene shows the double bond, the number before it its position, and the prefixes with their numbers give the side groups.'),
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
          hint: t('Kuri stadija lėta ir nustato produktą?', 'Which stage is slow and fixes the product?'),
          solution: t('Lėtojoje stadijoje susidaro karbokatijonas; stabilesnio katijono kelias greitesnis, todėl vyrauja 2-brompentanas.', 'The slow stage forms the carbocation; the path through the more stable cation is faster, so 2-bromopentane predominates.')
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
          hint: t('Nubraižykite katijoną, kai $H+$ jungiasi prie kiekvieno dvigubojo ryšio atomo.', 'Draw the cation for $H+$ adding to each double-bond carbon.'),
          solution: t('Kiekvienas dvigubojo ryšio atomas turi po vieną vandenilį ir po vieną alkilo pakaitą, todėl abu katijonai antriniai. Gaunamas 2- ir 3-brompentano mišinys.', 'Each double-bond carbon has one hydrogen and one alkyl group, so both cations are secondary. A mixture of 2- and 3-bromopentane results.')
        },
        {
          prompt: t('Pažymėkite abu produktus, kurie susidaro.', 'Select both products that form.'),
          kind: 'multi',
          options: [{ mol: { smi: 'CCCC(C)Br' } }, { mol: { smi: 'CCC(Br)CC' } }, { mol: { smi: 'CCCCCBr' } }, { mol: { smi: 'CCC(Br)C(C)Br' } }],
          answer: [0, 1],
          hint: t('Halogenas atsiduria ten, kur buvo teigiamas krūvis.', 'The halogen ends up where the positive charge was.'),
          solution: t('2-brompentanas (katijonas ties antruoju grandinės atomu) ir 3-brompentanas (katijonas ties trečiuoju). 1-brompentanui reikėtų pirminio katijono, o dibromidas – antros HBr molekulės.', '2-Bromopentane (cation at the second chain carbon) and 3-bromopentane (cation at the third). 1-Bromopentane would need a primary cation, and a dibromide a second HBr.')
        }
      ],
      why: t('Kai abu katijonai vienodos klasės, Markovnikovo taisyklė negali pasirinkti: susidaro abiejų izomerų mišinys. Taisyklė veikia tik tada, kai vienas katijonas stabilesnis.', 'When both cations are of the same class, Markovnikov’s rule cannot choose: a mixture of both isomers forms. The rule only picks a winner when one cation is more stable.'),
      src: 'S4.12, L7 p12'
    },
    {
      id: 'u07.why.3',
      q: [{ p: t('Norima sintetinti 4-bromoktaną iš alkeno ir HBr.', 'You want to make 4-bromooctane from an alkene and HBr.') }, { mol: { smi: 'CCCC(Br)CCCC' } }],
      steps: [
        {
          prompt: t('Kuris alkenas tinkamesnis, kad susidarytų tik šis produktas?', 'Which alkene is better if only this product should form?'),
          kind: 'choice', options: [{ mol: { smi: 'CCCC=CCCC' } }, { mol: { smi: 'CCC=CCCCC' } }, { mol: { smi: 'C=CCCCCCC' } }], answer: 0,
          hint: t('Nubraižykite katijonus, kuriuos gali sudaryti kiekvienas alkenas.', 'Draw the cations that each alkene can form.'),
          solution: t('4-oktenas simetriškas ir gali sudaryti tik vieną katijoną (ties ketvirtuoju grandinės atomu). 3-oktenas sudaro du antrinius katijonus ir duotų ir 3-bromoktaną.', 'Oct-4-ene is symmetrical and forms only one cation (at the fourth chain carbon). Oct-3-ene forms two secondary cations and would also give 3-bromooctane.')
        },
        {
          prompt: t('Kodėl 3-oktenas netinka?', 'Why is oct-3-ene unsuitable?'),
          kind: 'choice',
          options: [
            { text: t('Abu jo katijonai antriniai, todėl susidaro 3- ir 4-bromoktano mišinys.', 'Both of its cations are secondary, so a mixture of 3- and 4-bromooctane forms.') },
            { text: t('Jis neturi dvigubojo ryšio.', 'It has no double bond.') },
            { text: t('Vienas jo katijonas pirminis, todėl reakcija nevyksta.', 'One of its cations is primary, so no reaction occurs.') },
            { text: t('Jis duoda tik 3-bromoktaną.', 'It gives only 3-bromooctane.') }
          ],
          answer: 0,
          hint: t('Palyginkite abiejų katijonų tipus.', 'Compare the types of both cations.'),
          solution: t('Abu dvigubojo ryšio atomai turi po vieną alkilą, todėl abu katijonai antriniai ir vienodai tikėtini.', 'Both double-bond carbons have one alkyl group, so both cations are secondary and equally likely.')
        }
      ],
      why: t('Sintezei renkamasi alkenas, kurio simetrija duoda vieną katijoną. Tada produktas vienintelis, o ne mišinys.', 'For a synthesis choose the alkene whose symmetry allows only one cation. Then the product is unique rather than a mixture.'),
      src: 'L7 p12'
    },
    {
      id: 'u07.why.4',
      q: [{ p: t('Alkenas reaguoja su HCl.', 'An alkene reacts with HCl.') }, { scheme: { items: [{ smi: 'CCC(C)=C1CCCC1', opts: { numbers: 'all' } }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }] } }],
      steps: [
        {
          prompt: t('Kokių tipų katijonai gali susidaryti?', 'What types of cation can form?'),
          kind: 'choice',
          options: [
            { text: t('Du tretiniai katijonai: prie žiedo ir prie šoninės grandinės anglies.', 'Two tertiary cations: on the ring carbon and on the side-chain carbon.') },
            { text: t('Vienas tretinis ir vienas antrinis.', 'One tertiary and one secondary.') },
            { text: t('Tik vienas tretinis katijonas.', 'Only one tertiary cation.') },
            { text: t('Du antriniai katijonai.', 'Two secondary cations.') }
          ],
          answer: 0,
          hint: t('Prie kiekvieno dvigubojo ryšio atomo suskaičiuokite anglies kaimynus.', 'Count the carbon neighbours of each double-bond carbon.'),
          solution: [
            { p: t('Abu dvigubojo ryšio atomai neturi vandenilių ir turi po tris anglies kaimynus, todėl jungiantis $H+$ bet kuriam gaunamas tretinis katijonas.', 'Both double-bond carbons have no hydrogen and three carbon neighbours each, so adding $H+$ to either gives a tertiary cation.') },
            { mech: [
              { scheme: { items: [{ smi: 'CCC(C)=C1CCCC1' }, { plus: true }, { smi: 'Cl', opts: { allH: true } }, { arrow: '→' }, { smi: 'CCC(C)[C+]1CCCC1' }, { plus: true }, { smi: '[Cl-]' }], maxWidth: 680 }, arrows: [{ from: { m: 0, b: [2, 4] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }], note: t('Protonas prie šoninės grandinės atomo: katijonas ant žiedo.', 'The proton goes to the side-chain carbon: the cation is on the ring.') },
              { scheme: { items: [{ smi: 'CCC(C)=C1CCCC1' }, { plus: true }, { smi: 'Cl', opts: { allH: true } }, { arrow: '→' }, { smi: 'CC[C+](C)C1CCCC1' }, { plus: true }, { smi: '[Cl-]' }], maxWidth: 680 }, arrows: [{ from: { m: 0, b: [4, 2] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }], note: t('Protonas prie žiedo atomo: katijonas ant šoninės grandinės anglies.', 'The proton goes to the ring carbon: the cation is on the side-chain carbon.') }
            ] }
          ]
        },
        {
          prompt: t('Pažymėkite abu pagrindinius produktus.', 'Select both main products.'),
          kind: 'multi',
          options: [{ mol: { smi: 'CCC(C)C1(Cl)CCCC1' } }, { mol: { smi: 'CCC(C)(Cl)C1CCCC1' } }, { mol: { smi: 'CCC(C)C1CCCC1Cl' } }, { mol: { smi: 'CCC(C)(Cl)C1(Cl)CCCC1' } }],
          answer: [0, 1],
          hint: t('Chloras jungiasi prie teigiamos anglies kiekvienu atveju.', 'Chlorine bonds to the positive carbon in each case.'),
          solution: t('Du tretiniai katijonai duoda du izomerinius chloralkanus. Trečiasis variantas reikalautų antrinio katijono, ketvirtasis – antros HCl molekulės.', 'Two tertiary cations give two isomeric chloroalkanes. The third option would need a secondary cation, the fourth a second HCl.')
        }
      ],
      why: t('Abu katijonai tretiniai, todėl jų stabilumas panašus ir susidaro du produktai. Tai Markovnikovo taisyklės ribos: ji nenurodo vieno atsakymo, kai tipai vienodi.', 'Both cations are tertiary, so their stability is similar and two products form. This is a limit of Markovnikov’s rule: it gives no single answer when the types are equal.'),
      src: 'S4.14, L7 p9'
    },
    {
      id: 'u07.why.5',
      q: [{ p: t('Apie $AE$ mechanizmą pateikti teiginiai.', 'Statements about the AE mechanism.') }],
      steps: [{
        prompt: t('Pažymėkite visus teisingus teiginius apie alkeno ir HBr reakciją.', 'Select every correct statement about the reaction of an alkene with HBr.'),
        kind: 'multi',
        options: [
          tx('Lėtoji stadija yra karbokatijono susidarymas.', 'The slow stage is the formation of the carbocation.'),
          tx('$π$ elektronai atakuoja protoną.', 'The $π$ electrons attack the proton.'),
          tx('Bromidas jungiasi prie katijono antrojoje, greitojoje stadijoje.', 'Bromide bonds to the cation in the second, fast stage.'),
          tx('Abi stadijos vyksta vienu metu vienoje stadijoje.', 'Both stages happen at once in a single stage.'),
          tx('Pirmiausia prisijungia bromido anijonas.', 'The bromide anion adds first.')
        ],
        answer: [0, 1, 2],
        hint: t('Prisiminkite, kas yra nukleofilas, o kas elektrofilas.', 'Recall which is the nucleophile and which the electrophile.'),
        solution: t('Alkenas yra nukleofilas, todėl jo $π$ elektronai atakuoja $H+$. Pirmojoje (lėtojoje) stadijoje susidaro katijonas, antrojoje (greitojoje) jį atakuoja bromidas. Tai dviejų stadijų, o ne vienstadijis mechanizmas.', 'The alkene is the nucleophile, so its $π$ electrons attack $H+$. The first (slow) stage forms the cation, the second (fast) stage has bromide attack it. It is a two-stage mechanism, not a one-stage one.')
      }],
      why: t('AE yra dviejų stadijų procesas: elektrofilo prisijungimas prie $π$ ryšio sukuria karbokatijoną, o nukleofilas jį užbaigia. Ši schema paaiškina ir produkto kryptį.', 'AE is a two-stage process: the electrophile bonding to the $π$ bond creates a carbocation, and the nucleophile completes it. This scheme also explains the direction of the product.'),
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
          tx('Rūgštis hidrina dvigubąjį ryšį.', 'The acid hydrogenates the double bond.')
        ],
        answer: 0,
        hint: t('Alkenas yra nukleofilas. Kam jis atiduoda elektronus pirmojoje stadijoje?', 'The alkene is a nucleophile. To what does it give electrons in the first stage?'),
        solution: t('Pirmojoje stadijoje reikia elektrofilo. $H2O$ nėra pakankamai elektrofilinis, o $H3O+$ – yra. Reakcijos pabaigoje protonas grąžinamas, todėl rūgštis yra tik katalizatorius.', 'The first stage needs an electrophile. $H2O$ is not electrophilic enough but $H3O+$ is. A proton is returned at the end, so the acid is only a catalyst.')
      }],
      why: t('Alkenas yra nukleofilas ir jam reikia elektrofilo. Rūgštis suteikia $H3O+$, o pabaigoje atsikuria, todėl vandens prijungimas vyksta tik rūgštyje.', 'The alkene is a nucleophile and needs an electrophile. The acid supplies $H3O+$ and is regenerated at the end, so water adds only in acid.'),
      src: 'L7 p19'
    },
    {
      id: 'u07.why.7',
      q: [{ p: t('Iš 1-buteno reikia gauti 1-brombutaną.', 'You need to make 1-bromobutane from 1-butene.') }, { scheme: { items: [{ smi: 'CCC=C' }, { arrow: '→' }, { smi: 'CCCCBr' }] } }],
      steps: [
        {
          prompt: t('Kuri sąlyga tinka?', 'Which conditions work?'),
          kind: 'choice',
          options: [tx('$HBr$ ir peroksidai (arba UV šviesa)', '$HBr$ with peroxides (or UV light)'), tx('$HBr$ be peroksidų', '$HBr$ without peroxides'), tx('$Br2$', '$Br2$'), tx('$H2O/H+$, tada $HBr$', '$H2O/H+$, then $HBr$')],
          answer: 0,
          hint: t('Palyginkite norimo produkto brominimo vietą su Markovnikovo produktu.', 'Compare where the bromine sits in the target with the Markovnikov product.'),
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
          prompt: t('Koks yra abiejų alkenų pagrindinis produktas?', 'What is the main product of each alkene?'),
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
    },
    {
      id: 'u07.why.9',
      q: [{ p: t('1-fenilpropenas reaguoja su HBr: vieną kartą be peroksidų, kitą kartą jų terpėje.', '1-Phenylpropene reacts with HBr: once without peroxides and once in their presence.') }, { mol: { smi: 'C(=CC)c1ccccc1', opts: { numbers: 'all' }, name: t('1-fenilpropenas', '1-phenylpropene') } }],
      steps: [
        {
          prompt: t('Koks yra pagrindinis produktas be peroksidų?', 'What is the main product without peroxides?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(Br)c1ccccc1' } }, { mol: { smi: 'CC(Br)Cc1ccccc1' } }, { mol: { smi: 'CCCc1ccccc1' } }, { mol: { smi: 'CC(Br)C(Br)c1ccccc1' } }], answer: 0,
          hint: t('Kuris katijonas stabilesnis: prie žiedo ar prie metilo grupės?', 'Which cation is more stable: the one next to the ring or the one next to the methyl?'),
          solution: [{ p: t('Protonas jungiasi prie atomo Nr. 2, o katijonas atsiranda prie žiedo (benzilkatijonas, konjuguotas su žiedu). Bromidas jungiasi prie atomo Nr. 1.', 'The proton bonds to carbon no. 2 and the cation forms next to the ring (a benzylic cation, conjugated with the ring). Bromide bonds to carbon no. 1.') }, { mol: { smi: 'CCC(Br)c1ccccc1' } }]
        },
        {
          prompt: t('Koks yra pagrindinis produktas su peroksidais?', 'What is the main product with peroxides?'),
          kind: 'choice', options: [{ mol: { smi: 'CC(Br)Cc1ccccc1' } }, { mol: { smi: 'CCC(Br)c1ccccc1' } }, { mol: { smi: 'CCCc1ccccc1' } }, { mol: { smi: 'CC(Br)C(Br)c1ccccc1' } }], answer: 0,
          hint: t('Radikalinėje reakcijoje pirmas jungiasi $Br•$. Kuris radikalas stabilesnis?', 'In the radical reaction $Br•$ bonds first. Which radical is more stable?'),
          solution: t('$Br•$ jungiasi prie atomo Nr. 2, o radikalas lieka benzilo padėtyje (stabilesnis). Produktas yra priešingas: 2-brom-1-fenilpropanas.', '$Br•$ bonds to carbon no. 2 and the radical stays in the benzylic position (more stable). The product is the opposite one: 2-bromo-1-phenylpropane.')
        }
      ],
      why: t('Be peroksidų kryptį lemia katijono, su peroksidais – radikalo stabilumas. Abiem atvejais stabiliausia dalelė yra benzilo padėtyje, bet bromas prisijungia prie skirtingų atomų, nes pirma jungiasi skirtingos dalelės ($H+$ arba $Br•$).', 'Without peroxides the cation stability decides, with peroxides the radical stability. In both cases the most stable species is in the benzylic position, but bromine ends up on different carbons because different particles bond first ($H+$ or $Br•$).'),
      src: 'L7 p17, p13',
      claims: [{ react: ['ae.hx', ['CC=Cc1ccccc1'], { X: 'Br' }, 'CCC(Br)c1ccccc1'] }, { react: ['ae.hx', ['CC=Cc1ccccc1'], { X: 'Br', peroxide: true }, 'CC(Br)Cc1ccccc1'] }]
    }
  ];

  const DEDUCE = [
    {
      id: 'u07.deduce.1',
      q: [{ p: t('Angliavandenilis A, prijungdamas HCl, duoda junginį $C8H17Cl$, o oksiduojamas $KMnO4$ rūgščioje terpėje kaitinant duoda tik butanoną.', 'Hydrocarbon A adds HCl to give $C8H17Cl$, and oxidation with $KMnO4$ in hot acid gives only butanone.') }],
      steps: [
        {
          prompt: t('Koks yra alkenas A?', 'What is alkene A?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(C)=C(C)CC' } }, { mol: { smi: 'CCCC=CCCC' } }, { mol: { smi: 'CCC(C)=CCCC' } }, { mol: { smi: 'CC(C)=C(C)CCC' } }], answer: 0,
          hint: t('Vienas skilimo produktas rodo simetrišką alkeną: sujunkite dvi ketono molekules.', 'A single cleavage product points to a symmetrical alkene: join two ketone molecules.'),
          solution: [{ p: t('Sujungus dvi butanono molekules dvigubuoju ryšiu, gaunamas 3,4-dimetil-3-heksenas.', 'Joining two butanone molecules with a double bond gives 3,4-dimethyl-3-hexene.') }, { mol: { smi: 'CCC(C)=C(C)CC', name: t('3,4-dimetil-3-heksenas', '3,4-dimethyl-3-hexene') } }]
        },
        {
          prompt: t('Koks yra A ir HCl reakcijos produktas?', 'What is the product of A with HCl?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(C)(Cl)C(C)CC' } }, { mol: { smi: 'CCC(C)C(C)CCl' } }, { mol: { smi: 'CCC(C)(Cl)C(C)(Cl)CC' } }, { mol: { smi: 'CCC(C)C(C)CC' } }], answer: 0,
          hint: t('Abu dvigubojo ryšio atomai vienodi: koks katijonas susidaro?', 'Both double-bond carbons are alike: which cation forms?'),
          solution: t('Prijungus $H+$ susidaro tretinis katijonas, prie kurio jungiasi chloridas: 3-chlor-3,4-dimetilheksanas, $C8H17Cl$.', 'Adding $H+$ gives a tertiary cation, to which chloride bonds: 3-chloro-3,4-dimethylhexane, $C8H17Cl$.')
        }
      ],
      why: t('Vienas skilimo produktas ir vienas halogenidas rodo simetrišką alkeną. Formulė $C8H17Cl$ patvirtina, kad prisijungė viena HCl molekulė.', 'A single cleavage product and a single halide point to a symmetrical alkene. The formula $C8H17Cl$ confirms that one HCl molecule added.'),
      src: 'L7 p28, S4.14',
      claims: [{ formula: ['CCC(C)(Cl)C(C)CC', 'C8H17Cl'] }, { react: ['ae.hx', ['CCC(C)=C(C)CC'], { X: 'Cl' }, 'CCC(C)(Cl)C(C)CC'] }, { react: ['ox.kmno4.harsh', ['CCC(C)=C(C)CC'], null, 'CCC(C)=O'] }, { name: ['CCC(C)(Cl)C(C)CC', t('3-chlor-3,4-dimetilheksanas', '3-chloro-3,4-dimethylhexane')] }]
    },
    {
      id: 'u07.deduce.2',
      q: [{ p: t('Alkenas $C5H10$ oksiduojamas $KMnO4$ rūgščioje terpėje kaitinant. Gaunama etano rūgštis ir propanonas.', 'An alkene $C5H10$ is oxidised with $KMnO4$ in hot acid. Ethanoic acid and propanone form.') }],
      steps: [
        {
          prompt: t('Koks yra alkenas?', 'What is the alkene?'),
          kind: 'choice', options: [{ mol: { smi: 'CC(C)=CC' } }, { mol: { smi: 'CC=CCC' } }, { mol: { smi: 'CCC(C)=C' } }, { mol: { smi: 'C=CC(C)C' } }], answer: 0,
          hint: t('Ketono anglis buvo dipakeista, rūgšties – monopakeista.', 'The ketone carbon was disubstituted, the acid carbon monosubstituted.'),
          solution: [{ p: t('Sujungiame propanono ir etano rūgšties $C=O$ anglis.', 'Join the $C=O$ carbons of propanone and ethanoic acid.') }, { mol: { smi: 'CC(C)=CC', name: t('2-metil-2-butenas', '2-methyl-2-butene') } }]
        },
        {
          prompt: t('Koks pagrindinis šio alkeno ir HBr produktas?', 'What is the main product of this alkene with HBr?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(C)(C)Br' } }, { mol: { smi: 'CC(C)C(C)Br' } }, { mol: { smi: 'CC(Br)C(C)(C)Br' } }, { mol: { smi: 'CCC(C)C' } }], answer: 0,
          hint: t('Palyginkite tretinį ir antrinį katijonus.', 'Compare the tertiary and secondary cations.'),
          solution: t('Susidaro tretinis katijonas, todėl bromas jungiasi prie anglies su dviem metilais: 2-brom-2-metilbutanas.', 'The tertiary cation forms, so bromine bonds to the carbon with two methyls: 2-bromo-2-methylbutane.')
        }
      ],
      why: t('Skilimo produktai nurodo alkeną, o alkeno struktūra – prijungimo kryptį. Du uždaviniai sujungiami per tą patį alkeną.', 'The cleavage products identify the alkene and its structure gives the direction of addition. Two questions are linked through the same alkene.'),
      src: 'L7 p28, S4.14',
      claims: [{ react: ['ox.kmno4.harsh', ['CC(C)=CC'], null, 'CC(C)=O'] }, { react: ['ox.kmno4.harsh', ['CC(C)=CC'], null, 'CC(O)=O'] }, { react: ['ae.hx', ['CC(C)=CC'], { X: 'Br' }, 'CCC(C)(C)Br'] }]
    },
    {
      id: 'u07.deduce.3',
      q: [{ p: t('Angliavandenilis $C6H12$ išblukina bromo vandenį, su $H2/Pd$ duoda 2-metilpentaną, o su $KMnO4$ rūgščioje terpėje kaitinant – propanoną ir propano rūgštį.', 'A hydrocarbon $C6H12$ decolourises bromine water, gives 2-methylpentane with $H2/Pd$, and gives propanone and propanoic acid with $KMnO4$ in hot acid.') }],
      steps: [
        {
          prompt: t('Koks yra angliavandenilis?', 'What is the hydrocarbon?'),
          kind: 'choice', options: [{ mol: { smi: 'CC(C)=CCC' } }, { mol: { smi: 'C=C(C)CCC' } }, { mol: { smi: 'CC(C)CC=C' } }, { mol: { smi: 'CC(C)C=CC' } }], answer: 0,
          hint: t('Visi variantai turi 2-metilpentano skeletą; sprendžia skilimo produktai.', 'All options have the 2-methylpentane skeleton; the cleavage products decide.'),
          solution: t('Propanonas rodo =C(CH₃)₂, propano rūgštis – =CH–CH₂CH₃: 2-metil-2-pentenas.', 'Propanone shows =C(CH₃)₂ and propanoic acid shows =CH–CH₂CH₃: 2-methyl-2-pentene.')
        },
        {
          prompt: t('Koks pagrindinis šio alkeno ir $H2O/H+$ produktas?', 'What is the main product of this alkene with $H2O/H+$?'),
          kind: 'choice', options: [{ mol: { smi: 'CCCC(C)(C)O' } }, { mol: { smi: 'CCC(O)C(C)C' } }, { mol: { smi: 'CCCC(C)(O)C(C)(C)O' } }, { mol: { smi: 'CCCC(C)C' } }], answer: 0,
          hint: t('Kuri anglis sudaro tretinį katijoną?', 'Which carbon gives the tertiary cation?'),
          solution: t('Vanduo jungiasi prie atomo su dviem metilais: 2-metil-2-pentanolis.', 'Water bonds to the carbon with the two methyls: 2-methyl-2-pentanol.')
        }
      ],
      why: t('Hidrinimas parodo anglies skeletą, skilimas – dvigubojo ryšio vietą. Kartu jie vienareikšmiškai nusako alkeną.', 'Hydrogenation shows the carbon skeleton and cleavage shows the position of the double bond. Together they define the alkene uniquely.'),
      src: 'L7 p28, S4.14',
      claims: [{ react: ['ox.kmno4.harsh', ['CC(C)=CCC'], null, 'CC(C)=O'] }, { react: ['ox.kmno4.harsh', ['CC(C)=CCC'], null, 'CCC(O)=O'] }, { react: ['ae.h2', ['CC(C)=CCC'], null, 'CC(C)CCC'] }, { react: ['ae.h2o', ['CC(C)=CCC'], null, 'CCCC(C)(C)O'] }]
    },
    {
      id: 'u07.deduce.4',
      q: [{ p: t('Junginys $C4H8$ su HBr duoda vieną bromidą, o oksiduojamas $KMnO4$ rūgščioje terpėje kaitinant – tik etano rūgštį.', 'A compound $C4H8$ gives a single bromide with HBr, and with $KMnO4$ in hot acid gives only ethanoic acid.') }],
      steps: [
        {
          prompt: t('Koks yra junginys?', 'What is the compound?'),
          kind: 'choice', options: [{ mol: { smi: 'CC=CC' } }, { mol: { smi: 'CCC=C' } }, { mol: { smi: 'CC(C)=C' } }, { mol: { smi: 'C1CCC1' } }], answer: 0,
          hint: t('Kuris variantas turi $C=C$ ir duoda tik vieną skilimo produktą?', 'Which option has a $C=C$ and gives only one cleavage product?'),
          solution: t('Tik 2-butenas simetriškas: dvi etano rūgšties molekulės. Ciklobutanas $C=C$ neturi.', 'Only 2-butene is symmetrical: two molecules of ethanoic acid. Cyclobutane has no $C=C$.')
        },
        {
          prompt: t('Kodėl su HBr susidaro tik vienas bromidas?', 'Why does only one bromide form with HBr?'),
          kind: 'choice',
          options: [
            { text: t('Abu dvigubojo ryšio atomai vienodi, todėl abu katijonai tokie patys.', 'Both double-bond carbons are alike, so both cations are the same.') },
            { text: t('Susidaro tik tretinis katijonas.', 'Only a tertiary cation forms.') },
            { text: t('Bromidas jungiasi prie abiejų atomų.', 'Bromide bonds to both carbons.') },
            { text: t('Alkenas dėl šoninių grandinių nereaguoja.', 'The alkene does not react because of its side chains.') }
          ],
          answer: 0,
          hint: t('Palyginkite, kas prijungta prie abiejų dvigubojo ryšio atomų.', 'Compare what is attached to both double-bond carbons.'),
          solution: t('Simetriškas alkenas duoda tą patį katijoną, todėl susidaro tik 2-brombutanas.', 'A symmetrical alkene gives the same cation, so only 2-bromobutane forms.')
        }
      ],
      why: t('Vienas skilimo produktas ir vienas halogenidas yra tos pačios simetrijos ženklai. Formulė $C4H8$ tinka ir alkenui, ir cikloalkanui: alkeną parodo bandymai su $KMnO4$.', 'A single cleavage product and a single halide are signs of the same symmetry. The formula $C4H8$ fits an alkene and a cycloalkane alike: the $KMnO4$ test shows the alkene.'),
      src: 'L7 p28, S4.14',
      claims: [{ formula: ['CC=CC', 'C4H8'] }, { formula: ['C1CCC1', 'C4H8'] }]
    },
    {
      id: 'u07.deduce.5',
      q: [{ p: t('Angliavandenilis $C6H10$ karštame rūgščiame $KMnO4$ virsta vieninteliu produktu – heksano dirūgštimi.', 'A hydrocarbon $C6H10$ in hot acidic $KMnO4$ becomes a single product, hexanedioic acid.') }, { mol: { smi: 'OC(=O)CCCCC(O)=O', name: t('heksano dirūgštis', 'hexanedioic acid') } }],
      steps: [
        {
          prompt: t('Koks yra angliavandenilis?', 'What is the hydrocarbon?'),
          kind: 'choice', options: [{ mol: { smi: 'C1=CCCCC1' } }, { mol: { smi: 'CC1=CCCC1' } }, { mol: { smi: 'C=C1CCCC1' } }, { mol: { smi: 'C=CCCC=C' } }], answer: 0,
          hint: t('Ištisa šešių anglies grandinė su dviem karboksilo grupėmis gali atsirasti tik atvėrus žiedą.', 'A continuous six-carbon chain with two carboxyl groups can only come from opening a ring.'),
          solution: t('Cikloheksenas: skilus $C=C$ žiedas atsiveria, abi anglys virsta $COOH$.', 'Cyclohexene: when the $C=C$ is cleaved the ring opens and both carbons become $COOH$.')
        },
        {
          prompt: t('Koks yra šio junginio ir HBr produktas?', 'What is the product of this compound with HBr?'),
          kind: 'choice', options: [{ mol: { smi: 'BrC1CCCCC1' } }, { mol: { smi: 'BrC1(Br)CCCCC1' } }, { mol: { smi: 'BrC1CCCCC1Br' } }, { mol: { smi: 'C1CCCCC1' } }], answer: 0,
          hint: t('Alkenas simetriškas: kiek halogeno atomų prisijungia ir kur?', 'The alkene is symmetrical: how many halogen atoms add, and where?'),
          solution: t('Prisijungia viena HBr molekulė; abu žiedo atomai vienodi, todėl gaunamas vienintelis produktas bromcikloheksanas.', 'One HBr molecule adds; both ring carbons are alike, so the only product is bromocyclohexane.')
        }
      ],
      why: t('Jei oksidavimas duoda vieną dirūgštį, alkenas žiedinis ir $C=C$ yra žiedo viduje. Prijungimas žiedo neatveria.', 'If oxidation gives a single diacid, the alkene is cyclic and the $C=C$ is inside the ring. Hydrogenation does not open the ring.'),
      src: 'L7 p28, S4.14',
      claims: [{ react: ['ae.hx', ['C1=CCCCC1'], { X: 'Br' }, 'BrC1CCCCC1'] }, { formula: ['C1=CCCCC1', 'C6H10'] }, { react: ['ox.kmno4.harsh', ['C1=CCCCC1'], null, 'OC(=O)CCCCC(O)=O'] }]
    },
    {
      id: 'u07.deduce.6',
      q: [{ p: t('Alkenas $C6H12$ kaitinamas su $KMnO4$ rūgščioje terpėje ir duoda butanoną bei etano rūgštį.', 'An alkene $C6H12$ heated with $KMnO4$ in acid gives butanone and ethanoic acid.') }],
      steps: [
        {
          prompt: t('Koks yra alkenas?', 'What is the alkene?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(C)=CC' } }, { mol: { smi: 'CC(C)=CCC' } }, { mol: { smi: 'CC=CC(C)C' } }, { mol: { smi: 'CCC(=C)CC' } }], answer: 0,
          hint: t('Sujunkite ketono ir rūgšties $C=O$ anglis.', 'Join the $C=O$ carbons of the ketone and the acid.'),
          solution: [{ p: t('Butanono anglis buvo dipakeistas =CR₂ (metilas ir etilas), etano rūgšties – monopakeistas =CH–CH₃.', 'The butanone carbon was disubstituted =CR₂ (methyl and ethyl), the ethanoic acid carbon was monosubstituted =CH–CH₃.') }, { mol: { smi: 'CCC(C)=CC', name: t('3-metil-2-pentenas', '3-methyl-2-pentene') } }]
        },
        {
          prompt: t('Koks pagrindinis šio alkeno ir HBr produktas?', 'What is the main product of this alkene with HBr?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(C)(Br)CC' } }, { mol: { smi: 'CCC(C)C(C)Br' } }, { mol: { smi: 'CCC(C)(Br)C(C)Br' } }, { mol: { smi: 'CCC(C)CC' } }], answer: 0,
          hint: t('Palyginkite tretinį ir antrinį katijonus.', 'Compare the tertiary and secondary cations.'),
          solution: t('Tretinis katijonas atsiranda ant atomo su metilu ir etilu: 3-brom-3-metilpentanas.', 'The tertiary cation forms on the carbon with the methyl and the ethyl: 3-bromo-3-methylpentane.')
        }
      ],
      why: t('Du skilimo produktai parodo, kad alkenas nesimetriškas, o jų struktūra nurodo abi pakaitų grupes prie $C=C$. Po to prijungimo kryptis nustatoma pagal katijono stabilumą.', 'Two cleavage products show that the alkene is unsymmetrical and their structures give the groups on both sides of the $C=C$. The direction of addition then follows from the cation stability.'),
      src: 'L7 p28, S4.14',
      claims: [{ react: ['ox.kmno4.harsh', ['CCC(C)=CC'], null, 'CCC(C)=O'] }, { react: ['ox.kmno4.harsh', ['CCC(C)=CC'], null, 'CC(O)=O'] }, { react: ['ae.hx', ['CCC(C)=CC'], { X: 'Br' }, 'CCC(C)(Br)CC'] }, { formula: ['CCC(C)=CC', 'C6H12'] }]
    },
    {
      id: 'u07.deduce.7',
      q: [{ p: t('Alkenas $C7H12$ su $KMnO4$ rūgščioje terpėje kaitinant duoda cikloheksanoną ir $CO2$.', 'An alkene $C7H12$ with $KMnO4$ in hot acid gives cyclohexanone and $CO2$.') }, { mol: { smi: 'O=C1CCCCC1' } }],
      steps: [
        {
          prompt: t('Koks yra alkenas?', 'What is the alkene?'),
          kind: 'choice', options: [{ mol: { smi: 'C=C1CCCCC1' } }, { mol: { smi: 'CC1=CCCCC1' } }, { mol: { smi: 'C=CC1CCCC1' } }, { mol: { smi: 'CC=C1CCCC1' } }], answer: 0,
          hint: t('$CO2$ rodo galinę =CH₂ grupę, ketono žiedas – dipakeistą žiedo atomą.', '$CO2$ points to a terminal =CH₂ group, the ketone ring to a disubstituted ring carbon.'),
          solution: [{ p: t('Žiedo anglis su $C=O$ buvo dipakeista, o $CO2$ atsiranda iš =CH₂.', 'The ring carbon with the $C=O$ was disubstituted, and $CO2$ comes from =CH₂.') }, { mol: { smi: 'C=C1CCCCC1' } }]
        },
        {
          prompt: t('Koks pagrindinis šio alkeno ir HBr produktas?', 'What is the main product of this alkene with HBr?'),
          kind: 'choice', options: [{ mol: { smi: 'CC1(Br)CCCCC1' } }, { mol: { smi: 'BrCC1CCCCC1' } }, { mol: { smi: 'BrCC1(Br)CCCCC1' } }, { mol: { smi: 'CC1CCCCC1' } }], answer: 0,
          hint: t('$H+$ jungiasi prie $CH2$; kokia katijono klasė lieka ant žiedo?', '$H+$ bonds to $CH2$; what type of cation is left on the ring?'),
          solution: t('Lieka tretinis katijonas žiede, todėl bromas jungiasi prie žiedo anglies: 1-brom-1-metilcikloheksanas.', 'A tertiary cation is left on the ring, so bromine bonds to the ring carbon: 1-bromo-1-methylcyclohexane.')
        }
      ],
      why: t('$CO2$ ir ciklinis ketonas kartu rodo egzociklinį =CH₂. Prijungimo kryptis vėl nustatoma pagal katijoną.', '$CO2$ together with a cyclic ketone points to an exocyclic =CH₂. The direction of addition again follows from the cation.'),
      src: 'L7 p26, S4.14',
      claims: [{ react: ['ae.hx', ['C=C1CCCCC1'], { X: 'Br' }, 'CC1(Br)CCCCC1'] }, { formula: ['C=C1CCCCC1', 'C7H12'] }]
    },
    {
      id: 'u07.deduce.8',
      q: [{ p: t('Alkenas $C9H10$ išblukina bromo vandenį. Oksiduojant $KMnO4$ rūgščioje terpėje kaitinant gaunama benzenkarboksirūgštis ir etano rūgštis.', 'An alkene $C9H10$ decolourises bromine water. Oxidation with $KMnO4$ in hot acid gives benzoic acid and ethanoic acid.') }],
      steps: [
        {
          prompt: t('Koks yra alkenas?', 'What is the alkene?'),
          kind: 'choice', options: [{ mol: { smi: 'CC=Cc1ccccc1' } }, { mol: { smi: 'C=CCc1ccccc1' } }, { mol: { smi: 'C=C(C)c1ccccc1' } }, { mol: { smi: 'C=Cc1ccccc1C' } }], answer: 0,
          hint: t('Benzenkarboksirūgštis atsiranda iš $=CH-$ prie žiedo, etano rūgštis – iš $=CH-CH3$.', 'Benzoic acid comes from $=CH-$ next to the ring, ethanoic acid from $=CH-CH3$.'),
          solution: [{ p: t('Sujungus abiejų rūgščių karboksilo anglis dvigubuoju ryšiu gaunamas 1-fenilpropenas.', 'Joining the carboxyl carbons of both acids with a double bond gives 1-phenylpropene.') }, { mol: { smi: 'CC=Cc1ccccc1', name: t('1-fenilpropenas', '1-phenylpropene') } }]
        },
        {
          prompt: t('Koks pagrindinis šio alkeno ir HBr produktas (be peroksidų)?', 'What is the main product of this alkene with HBr (no peroxides)?'),
          kind: 'choice', options: [{ mol: { smi: 'CCC(Br)c1ccccc1' } }, { mol: { smi: 'CC(Br)Cc1ccccc1' } }, { mol: { smi: 'CCC(Br)c1ccc(Br)cc1' } }, { mol: { smi: 'CCCc1ccccc1' } }], answer: 0,
          hint: t('Kuris katijonas konjuguotas su žiedu?', 'Which cation is conjugated with the ring?'),
          solution: t('Susidaro benzilkatijonas, todėl bromas jungiasi prie anglies prie žiedo: 1-brom-1-fenilpropanas.', 'A benzylic cation forms, so bromine bonds to the carbon next to the ring: 1-bromo-1-phenylpropane.')
        }
      ],
      why: t('Aromatinis žiedas nesiskaido; skyla šoninės grandinės $C=C$. Katijonas, konjuguotas su žiedu, nusprendžia ir HBr prijungimo kryptį.', 'The aromatic ring is not cleaved; the side-chain $C=C$ is. The cation conjugated with the ring also decides the direction of HBr addition.'),
      src: 'L7 p17, p28',
      claims: [{ react: ['ae.hx', ['CC=Cc1ccccc1'], { X: 'Br' }, 'CCC(Br)c1ccccc1'] }, { formula: ['CC=Cc1ccccc1', 'C9H10'] }]
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
        prompt: t('Ką pamatysite mėgintuvėlyje su cikloheksenu?', 'What will you see with cyclohexene?'),
        kind: 'choice',
        options: [
          tx('Violetinė spalva išnyksta ir iškrenta rudos nuosėdos ($MnO2$).', 'The violet colour fades and brown $MnO2$ precipitates.'),
          tx('Tirpalas lieka violetinis ir nesikeičia.', 'The solution stays violet and does not change.'),
          tx('Tirpalas tampa oranžinis.', 'The solution turns orange.'),
          tx('Išsiskiria dujos ir tirpalas tampa mėlynas.', 'A gas is released and the solution turns blue.')
        ],
        answer: 0,
        hint: t('Alkenas oksiduojamas į diolį, o $MnO4-$ redukuojasi.', 'The alkene is oxidised to a diol and $MnO4-$ is reduced.'),
        solution: t('Cikloheksenas virsta 1,2-cikloheksandioliu, o $MnO4-$ – rudu $MnO2$. Cikloheksanas nereaguoja.', 'Cyclohexene becomes 1,2-cyclohexanediol and $MnO4-$ becomes brown $MnO2$. Cyclohexane does not react.')
      }],
      why: t('Spalvos išnykimas ir rudos nuosėdos rodo, kad $KMnO4$ buvo redukuotas, vadinasi, kažkas oksidavosi, čia – dvigubasis ryšys.', 'The loss of colour and the brown precipitate show that $KMnO4$ was reduced, so something was oxidised, here the double bond.'),
      src: 'L7 p23, LW6 p1'
    },
    {
      id: 'u07.test.3',
      q: [{ p: t('Etanolį kaitinant su koncentruota $H2SO4$ išsiskiria dujos. Jos praleidžiamos pro bromo vandenį ir pro $KMnO4$ tirpalą.', 'Heating ethanol with concentrated $H2SO4$ releases a gas. It is passed through bromine water and through $KMnO4$ solution.') }],
      steps: [{
        prompt: t('Pažymėkite visus stebėjimus, rodančius, kad dujos nesotusis junginys.', 'Select every observation showing that the gas is unsaturated.'),
        kind: 'multi',
        options: [
          tx('Bromo vanduo iš oranžinio tampa bespalvis.', 'Bromine water turns from orange to colourless.'),
          tx('$KMnO4$ violetinė spalva išnyksta ir atsiranda rudų nuosėdų.', 'The violet colour of $KMnO4$ fades and brown solid appears.'),
          tx('Bromo vanduo tampa tamsiai raudonas.', 'Bromine water turns dark red.'),
          tx('$KMnO4$ tirpalas lieka violetinis.', 'The $KMnO4$ solution stays violet.')
        ],
        answer: [0, 1],
        hint: t('Kas atsitinka su reagentu, kai jis prisijungia prie $C=C$ arba oksiduoja jį?', 'What happens to the reagent when it adds to a $C=C$ or oxidises it?'),
        solution: t('Etenas prijungia bromą ir oksiduojamas $KMnO4$: abu reagentai sunaudojami, todėl spalvos išnyksta ($MnO2$ – rudas). Likę variantai reikštų, kad reagentai nereagavo.', 'Ethene adds bromine and is oxidised by $KMnO4$: both reagents are consumed, so the colours disappear ($MnO2$ is brown). The other options would mean that the reagents did not react.')
      }],
      why: t('Du pirmieji stebėjimai yra dvigubojo ryšio testai: reagentas sunaudojamas ir spalva išnyksta.', 'The first two observations are tests for a double bond: the reagent is consumed and the colour disappears.'),
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
        hint: t('Kurioje poroje tirpalas išblunka abiejuose mėgintuvėliuose?', 'In which pair does the solution fade in both tubes?'),
        solution: t('Ir alkenas, ir alkinas prijungia bromą ir išblukina tirpalą; kitose porose vienas junginys prisotintas ir nereaguoja.', 'Both the alkene and the alkyne add bromine and decolourise the solution; in the other pairs one compound is saturated and does not react.')
      }],
      why: t('Bromo vandens ir $KMnO4$ bandymai yra kokybiniai dvigubojo ir trigubojo ryšio testai: jie atskiria nesotųjį nuo sotaus, bet ne alkeno nuo alkino.', 'Bromine water and $KMnO4$ are qualitative tests for a double and a triple bond: they separate unsaturated from saturated, but not an alkene from an alkyne.'),
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
      q: [{ p: t('Etenas gaunamas kaitinant etanolį su koncentruota sieros rūgštimi.', 'Ethene is made by heating ethanol with concentrated sulfuric acid.') }, { scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: t('H2SO4 (konc.)', 'H2SO4 (conc.)'), below: f('t°') }, { smi: 'C=C' }] } }],
      steps: [{
        prompt: t('Koks procesas vyksta?', 'Which process takes place?'),
        kind: 'choice',
        options: [tx('Dehidratacija: prarandamas vanduo.', 'Dehydration: water is lost.'), tx('Hidratacija: prisijungia vanduo.', 'Hydration: water is added.'), tx('Hidrinimas: prisijungia vandenilis.', 'Hydrogenation: hydrogen is added.'), tx('Halogeninimas: prisijungia halogenas.', 'Halogenation: a halogen is added.')],
        answer: 0,
        hint: t('Palyginkite etanolio ir eteno formules.', 'Compare the formulas of ethanol and ethene.'),
        solution: t('$C2H6O$ → $C2H4$: prarandama $H2O$, tai dehidratacija; tai atvirkštinė alkeno hidratacijai.', '$C2H6O$ → $C2H4$: $H2O$ is lost, so it is dehydration, the reverse of hydration.')
      }],
      why: t('Praskiestoje rūgštyje alkenas prijungia vandenį ir virsta alkoholiu, o koncentruotoje rūgštyje kaitinant alkoholis vandenį praranda ir virsta alkenu. Tai ta pati pusiausvyra, pastumta į priešingas puses.', 'In dilute acid an alkene adds water and becomes an alcohol; in concentrated acid with heat the alcohol loses water and becomes an alkene. It is one equilibrium, pushed in opposite directions.'),
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
      why: t('Formulė CₙH₂ₙ tinka ir alkenui, ir cikloalkanui, todėl formulės nepakanka. Spalvos kaita rodo, kad yra $π$ ryšys.', 'The formula CₙH₂ₙ fits both an alkene and a cycloalkane, so the formula is not enough. The colour change shows that a $π$ bond is present.'),
      src: 'L7 p6',
      claims: [{ formula: ['CCCC=CC', 'C6H12'] }, { formula: ['C1CCCCC1', 'C6H12'] }, { formula: ['CCCCCC', 'C6H14'] }]
    }
  ];

  ORG.unit({
    id: 'u07',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES_GEN.concat([
      { id: 'u07.why', title: t('Kryptis ir priežastis', 'Direction and reason'), mirrors: ['S4.3', 'S4.12', 'S4.14'], bank: WHY },
      { id: 'u07.deduce', title: t('Alkeno nustatymas pagal duomenis', 'Deducing the alkene from data'), mirrors: ['S4.14'], bank: DEDUCE },
      { id: 'u07.test', title: t('Dvigubojo ryšio atpažinimas', 'Testing for a double bond'), mirrors: ['S4.4'], bank: TEST }
    ]),
    coverage: {
      'S4.3': ['u07.hx', 'u07.mech', 'u07.why'],
      'S4.4': ['u07.hx', 'u07.x2h2', 'u07.test', 'u07.reagent'],
      'S4.5': ['u07.hydr'],
      'S4.6': ['u07.x2h2', 'u07.kmno4', 'u07.fate', 'u07.reagent'],
      'S4.12': ['u07.mech', 'u07.cation', 'u07.why'],
      'S4.13': ['u07.ewg'],
      'S4.14': ['u07.kmno4', 'u07.back', 'u07.why', 'u07.fate', 'u07.deduce']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
