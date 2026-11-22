// site/organic/units/u10.js: unit 10, haloalkanes: SN1, SN2, E1, E2
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // arrow labels that are only formulas or symbols

  /* ---------- shared helpers ---------- */
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const formulaOf = (ctx, s) => ctx.chem.formulaString(ctx.chem.parse(s));
  const HALNAME = { Cl: { lt: 'chlor', en: 'chloro' }, Br: { lt: 'brom', en: 'bromo' }, I: { lt: 'jod', en: 'iodo' } };

  // options: the right molecules first, then wrong ones with the same formula, distinct by structure; at most n options in total
  function molOptions(ctx, rights, wrongs, n) {
    const seen = new Set(rights.map((s) => canon(ctx, s)));
    const out = rights.map((smi) => ({ mol: { smi } }));
    const want = formulaOf(ctx, rights[0]);
    wrongs.forEach((s) => {
      if (!s || out.length >= n) return;
      let k;
      try { if (formulaOf(ctx, s) !== want) return; k = canon(ctx, s); } catch (e) { return; }
      if (!seen.has(k)) { seen.add(k); out.push({ mol: { smi: s } }); }
    });
    return out;
  }

  // the carbon that carries the halogen, its halogen, and the carbon class (1..3, 0 = methyl) in a haloalkane SMILES
  function halideSite(ctx, smi) {
    const m = ctx.chem.parse(smi);
    const hs = [];
    m.atoms.forEach((a, i) => {
      if (!/^(Cl|Br|I)$/.test(a.el)) return;
      const c = m.nbr[i][0];
      if (c === undefined || m.atoms[c].el !== 'C') return;
      hs.push({ x: i, c, k: m.nbr[c].filter((j) => m.atoms[j].el === 'C').length });
    });
    return hs.length === 1 ? hs[0] : null;
  }


  /* ---------- SMILES string surgery (atom indices follow the order of atoms in the string) ---------- */

  // spans of the atom tokens of a SMILES string, in atom order: a..b the atom symbol, r the end including ring-closure digits
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

  // a haloalkane with exactly one Cl, Br or I on a carbon: {x, c, m}; m is the parsed molecule
  function site(ctx, smi) {
    const m = ctx.chem.parse(smi);
    const hs = [];
    m.atoms.forEach((a, i) => { if (/^(Cl|Br|I)$/.test(a.el)) hs.push(i); });
    if (hs.length !== 1) return null;
    const c = m.nbr[hs[0]][0];
    return { x: hs[0], c, m };
  }
  const cNb = (m, i) => m.nbr[i].filter((j) => m.atoms[j].el === 'C');
  const ordOf = (m, i, j) => { const b = m.bonds.find((q) => (q.a === i && q.b === j) || (q.a === j && q.b === i)); return b ? b.order : 0; };
  const sp3 = (m, i) => m.atoms[i].el === 'C' && !m.atoms[i].aromatic && m.nbr[i].every((j) => ordOf(m, i, j) === 1);

  // the molecule without its halogen (the alkane), and the new index of every old atom
  function dehalo(ctx, smi) {
    const s = site(ctx, smi);
    const sp = spans(smi);
    const tok = sp[s.x];
    let from = tok.a, to = tok.b;
    if (smi[from - 1] === '(' && smi[to] === ')') { from--; to++; }
    return { alkane: smi.slice(0, from) + smi.slice(to), c: s.c < s.x ? s.c : s.c - 1, shift: (i) => (i > s.x ? i - 1 : i), s };
  }
  // put the group frag (SMILES of the substituent, starting with its attached atom) on atom k of a SMILES string
  function attachAt(smi, k, frag) {
    const sp = spans(smi);
    return smi.slice(0, sp[k].r) + '(' + frag + ')' + smi.slice(sp[k].r);
  }
  // the carbocation of a haloalkane (same atoms, halogen gone), written from the alkane string
  function cationOf(ctx, smi) {
    const d = dehalo(ctx, smi);
    const h = d.s.m.atoms[d.s.c].h;
    return replaceTokens(d.alkane, [{ i: d.c, text: '[C' + hTok(h) + '+]' }]);
  }
  // the cations that a hydride shift from neighbour carbon k to the cation carbon would give (wrong options)
  function shiftedCations(ctx, smi) {
    const d = dehalo(ctx, smi);
    const m = d.s.m;
    const out = [];
    cNb(m, d.s.c).forEach((k) => {
      if (!sp3(m, k) || m.atoms[k].h < 1 || m.atoms[k].aromatic) return;
      out.push(replaceTokens(d.alkane, [{ i: d.c, text: '[C' + hTok(m.atoms[d.s.c].h + 1) + ']' }, { i: d.shift(k), text: '[C' + hTok(m.atoms[k].h - 1) + '+]' }]));
    });
    return out;
  }
  function replaceTokens(smi, edits) {
    const sp = spans(smi);
    let s = smi;
    edits.slice().sort((p, q) => q.i - p.i).forEach((e) => { s = s.slice(0, sp[e.i].a) + e.text + s.slice(sp[e.i].b); });
    return s;
  }
  // the same alkane skeleton with the group frag on every other sp3 carbon (same formula as the right product: wrong options)
  function otherPositions(ctx, smi, frag) {
    const d = dehalo(ctx, smi);
    const m = ctx.chem.parse(d.alkane);
    const out = [];
    m.atoms.forEach((a, k) => { if (k !== d.c && sp3(m, k) && m.atoms[k].h >= 1) out.push(attachAt(d.alkane, k, frag)); });
    return out;
  }
  const putHalogen = (tpl, X) => tpl.replace(/X/g, X);
  // straight-chain isomers of an alkane skeleton with the group frag at the end and at position 2 (extra wrong options; the formula filter drops unsuitable ones)
  function chainIsomers(alkane, frag) {
    const n = (alkane.match(/C/g) || []).length;
    return n < 3 ? [] : ['C'.repeat(n) + frag, 'CC(' + frag + ')' + 'C'.repeat(n - 2)];
  }

  /* ---------- builders for hand-written problems ---------- */
  const tx = (lt, en) => ({ text: t(lt, en) });
  const mo = (smi, opts) => ({ mol: opts ? { smi, opts } : { smi } });
  const cho = (prompt, options, answer, hint, solution) => ({ prompt, kind: 'choice', options, answer, hint, solution });
  const MECH4 = [tx('SN1', 'SN1'), tx('SN2', 'SN2'), tx('E1', 'E1'), tx('E2', 'E2')];
  const NOSN = tx('Nei SN1, nei SN2 (įprastomis sąlygomis)', 'Neither SN1 nor SN2 (under ordinary conditions)');

  // alkyl groups written so that they end at the carbon that carries the substituent; iso = isomeric groups with the same carbon count
  const PRIM = [
    { p: 'CC', iso: [] },
    { p: 'CCC', iso: ['CC(C)'] },
    { p: 'CCCC', iso: ['CCC(C)', 'CC(C)C', 'CC(C)(C)'] },
    { p: 'CC(C)C', iso: ['CCCC', 'CCC(C)', 'CC(C)(C)'] },
    { p: 'CCCCC', iso: ['CCCC(C)', 'CCC(CC)', 'CC(C)CC', 'CCC(C)(C)'] },
    { p: 'CC(C)CC', iso: ['CCCCC', 'CCCC(C)', 'CCC(CC)'] },
    { p: 'CCCCCC', iso: ['CCCCC(C)', 'CCCC(CC)', 'CCCC(C)C'] },
    { p: 'CCCCCCC', iso: ['CCCCCC(C)', 'CCCCC(CC)', 'CCCC(CCC)'] }
  ];
  const NUC = {
    OH: { nm: t('hidroksidas', 'hydroxide'), frag: 'O', salt: 'NaOH', cls: t('alkoholis', 'alcohol'), basic: true },
    SH: { nm: t('hidrosulfidas', 'hydrosulfide'), frag: 'S', salt: 'NaSH', cls: t('tiolis', 'thiol') },
    CN: { nm: t('cianidas', 'cyanide'), frag: 'C#N', salt: 'NaCN', cls: t('nitrilas', 'nitrile') },
    OC: { nm: t('metoksidas', 'methoxide'), frag: 'OC', salt: 'NaOCH3', cls: t('eteris', 'ether'), basic: true },
    OCC: { nm: t('etoksidas', 'ethoxide'), frag: 'OCC', salt: 'NaOC2H5', cls: t('eteris', 'ether'), basic: true },
    SC: { nm: t('metiltiolatas', 'methanethiolate'), frag: 'SC', salt: 'NaSCH3', cls: t('sulfidas', 'sulfide') },
    'C#CC': { nm: t('propinidas', 'propynide'), frag: 'C#CC', salt: 'NaC≡CCH3', cls: t('alkinas', 'alkyne'), basic: true },
    I: { nm: t('jodidas', 'iodide'), frag: 'I', salt: 'NaI', cls: t('jodidas', 'iodide') }
  };

  ORG.unit({
    id: 'u10',
    notes: [
      /* ------------------------------------------------------------ 1 */
      {
        id: 'halides',
        title: t('Halogenalkanai ir jų reakcijų tipai', 'Alkyl halides and their reaction types'),
        blocks: [
          { h: t('Polinis C–Hal ryšys', 'The polar C–Hal bond') },
          {
            p: t('Halogenas elektroneigiamesnis už anglį, todėl C–Hal ryšys polinis: anglis tampa δ+, o halogenas δ−. Ryšys lengvai poliarizuojasi ir gali skilti heterolitiškai, todėl nukleofilas gali pulti anglį ir išstumti halogenido joną, nueinančiąją grupę.',
              'Halogen is more electronegative than carbon, so the C–Hal bond is polar: carbon is δ+ and halogen δ−. The bond is easily polarised and can break heterolytically, so a nucleophile can attack the carbon and push out the halide ion, the leaving group.'),
            src: 'L10 p3'
          },
          {
            scheme: { items: [{ smi: 'CCBr', opts: { deltas: { 1: '+', 2: '-' } } }, { plus: true }, { smi: '[OH-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CCO' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
            caption: t('Nukleofilinis pakeitimas (SN): hidroksidas pakeičia bromidą.', 'Nucleophilic substitution (SN): hydroxide replaces bromide.'),
            src: 'L10 p3'
          },
          {
            p: t('Kartu su pakeitimu dažnai vyksta eliminavimas (E): nukleofilas veikia kaip bazė, atplėšia protoną nuo gretimo (β) atomo ir susidaro alkenas. Todėl reikia spręsti: SN1, SN2, E1 ar E2?',
              'Elimination (E) often competes: the nucleophile acts as a base, removes a proton from the neighbouring (β) carbon and an alkene forms. So one must decide: SN1, SN2, E1 or E2?'),
            src: 'L10 p18'
          },
          { h: t('Pirminiai, antriniai, tretiniai', 'Primary, secondary, tertiary') },
          {
            mol: [
              { smi: 'CCCBr', name: t('1-brompropanas', '1-bromopropane'), caption: t('pirminis', 'primary') },
              { smi: 'CC(C)Br', name: t('2-brompropanas', '2-bromopropane'), caption: t('antrinis', 'secondary') },
              { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane'), caption: t('tretinis', 'tertiary') }
            ]
          },
          {
            rule: t('Halogenalkano klasę nusako anglies atomas su halogenu: pirminis turi vieną kaimyninį anglies atomą, antrinis – du, tretinis – tris. Nuo klasės priklauso mechanizmas: pirminiams būdingi SN2 ir E2, tretiniams – SN1 ir E1.',
              'The class of an alkyl halide is set by the carbon that bears the halogen: a primary one has one neighbouring carbon, a secondary one two, a tertiary one three. The class decides the mechanism: primary halides favour SN2 and E2, tertiary ones SN1 and E1.'),
            src: 'L10 p2, p21'
          },
          {
            pitfall: t('Klasę rodo tik halogeną turinčio atomo kaimynai, o ne molekulės šakotumas. Šis halogenalkanas šakotas, bet halogenas prisijungęs prie $CH2$ grupės, todėl jis pirminis.',
              'Only the neighbours of the carbon that bears the halogen matter, not how branched the molecule is. This halide is strongly branched, but the halogen sits on a $CH2$ group, so it is primary.'),
            src: 'L10 p2'
          },
          { mol: { smi: 'CC(C)CCBr', name: t('1-brom-3-metilbutanas', '1-bromo-3-methylbutane'), caption: t('pirminis', 'primary') } },
          { practice: 'u10.class' }
        ]
      },
      /* ------------------------------------------------------------ 2 */
      {
        id: 'sn2',
        title: t('SN2: vienos stadijos pakeitimas', 'SN2: one-stage substitution'),
        blocks: [
          { h: t('Puolimas iš nugaros', 'Backside attack') },
          {
            p: t('SN2 reakcija vyksta viena stadija: nukleofilas puola anglį iš pusės, priešingos nueinančiajai grupei, ir tuo pat metu nutrūksta C–Hal ryšys. Pereinamojoje būsenoje anglis iš dalies susijusi ir su nukleofilu, ir su halogenu. Greitis priklauso nuo abiejų reagentų koncentracijų, todėl reakcija bimolekulinė.',
              'SN2 takes place in one stage: the nucleophile attacks the carbon from the side opposite the leaving group while the C–Hal bond breaks at the same moment. In the transition state the carbon is partly bonded to both the nucleophile and the halogen. The rate depends on the concentrations of both reagents, so the reaction is bimolecular.'),
            src: 'L10 p5'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CBr', opts: { allH: true, lonePairs: [1] } }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
                note: t('Viena stadija: hidroksidas puola anglį, o C–Br elektronai pereina bromui.', 'One stage: hydroxide attacks carbon while the C–Br electrons move to bromine.')
              }
            ],
            caption: t('Brommetanas ir hidroksidas.', 'Bromomethane and hydroxide.'),
            src: 'L10 p5'
          },
          { scheme: { items: [{ smi: 'CBr' }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: '[Br-]' }] }, caption: t('Produktai: metanolis ir bromidas.', 'Products: methanol and bromide.') },
          {
            rule: t('SN2: viena stadija, greitis = $k[RX][Nu]$, puolimas iš nugaros. Nuo nukleofilo koncentracijos ir stiprumo greitis auga.',
              'SN2: one stage, rate = $k[RX][Nu]$, backside attack. The rate rises with the concentration and strength of the nucleophile.'),
            src: 'L10 p5, p9'
          },
          { h: t('Konfigūracijos inversija', 'Inversion of configuration') },
          {
            p: t('Nukleofilui puolant iš nugaros, kitos trys grupės atsilenkia kaip skėčio stipinai, o stereocentro konfigūracija apsiverčia: gaunamas kitas enantiomeras. Iš (S)-2-brombutano su hidrosulfidu susidaro (R)-2-butantiolis.',
              'As the nucleophile comes in from the back, the other three groups flip over like an umbrella in the wind and the configuration of the stereocentre is inverted: the other enantiomer forms. (S)-2-bromobutane with hydrosulfide gives (R)-butane-2-thiol.'),
            src: 'L10 p6'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: '[SH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC[C@H](C)Br' }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 2 } }, { from: { m: 1, b: [2, 4] }, to: { m: 1, a: 4 } }],
                note: t('HS⁻ puola iš pusės, priešingos bromui.', 'HS⁻ attacks from the side opposite bromine.')
              }
            ],
            src: 'L10 p6'
          },
          {
            scheme: { items: [{ smi: 'CC[C@H](C)Br' }, { plus: true }, { smi: '[SH-]' }, { arrow: '→' }, { smi: 'CC[C@@H](C)S' }, { plus: true }, { smi: '[Br-]' }] },
            caption: t('Stereocentras apsiverčia: (S)-2-brombutanas virsta (R)-2-butantioliu. Pastaba: produktas pasuktas; HS pateko priešingoje pusėje nei Br.', 'The stereocentre is inverted: (S)-2-bromobutane becomes (R)-butane-2-thiol. Note: the product is redrawn; HS entered on the side opposite Br.'),
            src: 'L10 p6'
          },
          {
            pitfall: t('Inversija – erdvinis apsivertimas. Ar pasikeičia žymuo R/S, lemia CIP prioritetai; čia nukleofilas ir bromas užima tą pačią vietą eilėje, todėl S virsta R.',
              'Inversion is a spatial flip. Whether the label R/S changes depends on the CIP priorities; here the nucleophile and bromine rank alike, so S becomes R.'),
            src: 'L10 p6'
          },
          {
            example: {
              q: [
                { p: t('(R)-2-chlorpentanas reaguoja su natrio cianidu. Koks produktas ir kokia jo konfigūracija?', '(R)-2-chloropentane reacts with sodium cyanide. What is the product and what is its configuration?') },
                { mol: { smi: 'CCC[C@@H](C)Cl', name: t('2-chlorpentanas', '2-chloropentane'), caption: t('(R)', '(R)') } }
              ],
              steps: [
                [{ p: t('Antrinis halogenalkanas su stipriu, bet silpnai baziniu nukleofilu $CN-$: vyksta SN2.', 'A secondary halide with the strong, only weakly basic nucleophile $CN-$ reacts by SN2.') }],
                [{ p: t('Cianidas puola iš nugaros, todėl stereocentras apsiverčia. $CN-$ ir $Cl-$ prioritetai tokie pat (aukščiausi), tad R virsta S.', 'Cyanide attacks from the back, so the stereocentre is inverted. $CN-$ and $Cl-$ rank the same (highest), so R becomes S.') }],
                [{ p: t('Produktas – (S)-2-metilpentannitrilas.', 'The product is (S)-2-methylpentanenitrile.') }, { mol: { smi: 'CCC[C@H](C)C#N', name: t('2-metilpentannitrilas', '2-methylpentanenitrile'), caption: t('(S)', '(S)') } }]
              ]
            },
            claims: [
              { cip: ['CCC[C@@H](C)Cl', 3, 'R'] },
              { cip: ['CCC[C@H](C)C#N', 3, 'S'] },
              { react: ['sn2', ['CCCC(C)Cl'], { nu: 'CN' }, 'CCCC(C)C#N'] },
              { name: ['CCCC(C)C#N', t('2-metilpentannitrilas', '2-methylpentanenitrile')] }
            ]
          },
          { practice: 'u10.sn2' },
          { practice: 'u10.stereo' }
        ]
      },
      /* ------------------------------------------------------------ 3 */
      {
        id: 'sn1',
        title: t('SN1: dviejų stadijų pakeitimas', 'SN1: two-stage substitution'),
        blocks: [
          { h: t('Pirmiausia karbokatijonas', 'The carbocation first') },
          {
            p: t('SN1 reakcija turi dvi stadijas. Lėtoji (I st.): halogenalkanas jonizuojasi į karbokatijoną ir halogenido joną. Greitoji (II st.): nukleofilas prisijungia prie karbokatijono. Greitį lemia lėtoji stadija, todėl nukleofilo kiekis jo nekeičia: svarbi tik halogenalkano koncentracija.',
              'SN1 has two stages. Slow stage I: the alkyl halide ionises into a carbocation and a halide ion. Fast stage II: the nucleophile bonds to the carbocation. The slow stage sets the rate, so it depends only on the alkyl halide concentration.'),
            src: 'L10 p4'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'CC(C)(C)Br', opts: { lonePairs: [4] } }] },
                arrows: [{ from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }],
                note: t('I st. (lėta): C–Br ryšys skyla heterolitiškai.', 'Stage I (slow): the C–Br bond breaks heterolytically.')
              },
              {
                scheme: { items: [{ smi: 'C[C+](C)C' }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }] },
                arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
                note: t('II st. (greita): vandens deguonies laisva pora sudaro ryšį su katijonu.', 'Stage II (fast): a lone pair of water oxygen bonds to the cation.')
              }
            ],
            caption: t('Vandens ir 2-brom-2-metilpropano reakcija.', 'The reaction of 2-bromo-2-methylpropane with water.'),
            src: 'L10 p4'
          },
          {
            scheme: { items: [{ smi: 'CC(C)(C)[OH2+]' }, { plus: true }, { smi: 'O' }, { arrow: '→' }, { smi: 'CC(C)(C)O' }, { plus: true }, { smi: '[OH3+]' }] },
            caption: t('Oksonio jonas atiduoda protoną vandeniui: gaunamas alkoholis.', 'The oxonium ion gives a proton to water: the alcohol is formed.'),
            src: 'L10 p4'
          },
          {
            rule: t('SN1: dvi stadijos, greitis = $k[RX]$, tarpinis junginys – karbokatijonas. Nuo nukleofilo koncentracijos greitis nepriklauso.',
              'SN1: two stages, rate = $k[RX]$, the intermediate is a carbocation. The rate does not depend on the concentration of the nucleophile.'),
            src: 'L10 p4'
          },
          { h: t('Kodėl tretiniai? Hiperkonjugacija', 'Why tertiary? Hyperconjugation') },
          {
            p: t('Katijono anglis turi tuščią p orbitalę. Gretimų alkilgrupių C–H ryšių elektronai iš dalies persiklauso su ja – tai hiperkonjugacija. Kiekviena gretima alkilgrupė gali nukreipti vieną C–H ryšį į tuščią p orbitalę: pirminiame katijone tokių ryšių vienas, antriniame – du, tretiniame – trys. Todėl SN1 vyksta per tretinius katijonus.',
              'The cationic carbon has an empty p orbital. Electrons of C–H bonds in neighbouring alkyl groups overlap with it partly: hyperconjugation. Each neighbouring alkyl group can align one C–H bond with the empty p orbital: one such bond in a primary cation, two in a secondary, three in a tertiary. So SN1 goes through tertiary cations.'),
            src: 'L10 p7, p8'
          },
          {
            mol: [
              { smi: 'C[C+](C)C', caption: t('tretinis', 'tertiary') },
              { smi: 'C[CH+]C', caption: t('antrinis', 'secondary') },
              { smi: 'C[CH2+]', caption: t('pirminis', 'primary') },
              { smi: '[CH3+]', caption: t('metilkatijonas', 'methyl') }
            ],
            caption: t('Stabilumas mažėja iš kairės į dešinę.', 'Stability decreases from left to right.'),
            src: 'L10 p8'
          },
          { h: t('Stereochemija: racematas', 'Stereochemistry: the racemate') },
          {
            p: t('Katijono centras plokščias (sp²), todėl nukleofilas gali prisijungti iš abiejų pusių: iš chiralinio halogenalkano gaunamas racematas.',
              'The cation centre is flat (sp²), so the nucleophile can bond from either face: a chiral alkyl halide gives a racemate.'),
            src: 'L10 p6'
          },
          {
            scheme: { items: [{ smi: 'CCC[C@](C)(Br)CC' }, { plus: true }, { smi: 'O' }, { arrow: '→' }, { smi: 'CCC[C@](C)(O)CC' }, { plus: true }, { smi: 'CCC[C@@](C)(O)CC' }] },
            caption: t('3-brom-3-metilheksanas su vandeniu: du enantiomerai, (R) ir (S), maždaug po lygiai.', '3-bromo-3-methylhexane with water: two enantiomers, (R) and (S), in roughly equal amounts.'),
            src: 'L10 p6'
          },
          {
            pitfall: t('SN1 greičio nekeičia nukleofilo kiekis, o SN2 greitį didina.',
              'The amount of nucleophile does not change the SN1 rate, but it raises the SN2 rate.'),
            src: 'L10 p4, p5'
          },
          {
            example: {
              q: [
                { p: t('2-brom-2-metilbutanas tirpsta etanolyje. Koks pagrindinis produktas ir koks mechanizmas?', '2-bromo-2-methylbutane dissolves in ethanol. What is the main product and which mechanism applies?') },
                { mol: { smi: 'CC(C)(Br)CC', name: t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane') } }
              ],
              steps: [
                [{ p: t('Halogenas prisijungęs prie tretinio atomo, nukleofilas silpnas (etanolis), tirpiklis polinis protoninis: SN1.', 'The halogen sits on a tertiary carbon, the nucleophile is weak (ethanol) and the solvent is polar protic: SN1.') }],
                [{ p: t('I st.: bromidas atsiskiria, lieka tretinis karbokatijonas.', 'Stage I: bromide leaves and a tertiary carbocation remains.') }, { mol: { smi: 'CC[C+](C)C' } }],
                [{ p: t('II st.: etanolio deguonis prisijungia prie katijono, o oksonio jonas atiduoda protoną tirpikliui. Gaunamas eteris; šalutiniai produktai – alkenai (E1).', 'Stage II: the oxygen of ethanol bonds to the cation and the oxonium ion gives a proton to the solvent. An ether results; alkenes (E1) are by-products.') }, { mol: { smi: 'CCC(C)(C)OCC', name: t('2-etoksi-2-metilbutanas', '2-ethoxy-2-methylbutane') } }],
              ]
            },
            claims: [
              { react: ['sn1', ['CC(C)(Br)CC'], { nu: 'OCC' }, 'CCC(C)(C)OCC'] },
              { carbon: ['CC(C)(Br)CC', 1, 3] },
              { formula: ['CC[C+](C)C', 'C5H11+'] }
            ]
          },
          { practice: 'u10.sn1' }
        ]
      },
      /* ------------------------------------------------------------ 4 */
      {
        id: 'factors',
        title: t('Kas lemia mechanizmą', 'What decides the mechanism'),
        blocks: [
          { h: t('Keturi veiksniai', 'Four factors') },
          {
            table: {
              head: [t('Veiksnys', 'Factor'), t('Palankesnis SN1', 'Favours SN1'), t('Palankesnis SN2', 'Favours SN2')],
              rows: [
                [t('substratas', 'substrate'), t('tretinis (stabilus karbokatijonas)', 'tertiary (stable carbocation)'), t('metilo, pirminis (nestabilus karbokatijonas)', 'methyl, primary (unstable carbocation)')],
                [t('nukleofilas', 'nucleophile'), t('silpnas, kiekis nesvarbus ($H2O$, $ROH$)', 'weak, amount does not matter ($H2O$, $ROH$)'), t('stiprus, didelė koncentracija ($RO-$, $HO-$)', 'strong, high concentration ($RO-$, $HO-$)')],
                [t('tirpiklis', 'solvent'), t('poliniai protoniniai (vanduo, alkoholiai)', 'polar protic (water, alcohols)'), t('poliniai aprotoniniai ($(CH3)2SO$, $HCON(CH3)2$, $CH3CN$)', 'polar aprotic ($(CH3)2SO$, $HCON(CH3)2$, $CH3CN$)')],
                [t('nueinančioji grupė', 'leaving group'), t('geresnė grupė greitina abu mechanizmus', 'a better group speeds up both mechanisms'), t('geresnė grupė greitina abu mechanizmus', 'a better group speeds up both mechanisms')]
              ]
            },
            src: 'L10 p7, p9, p10'
          },
          { h: t('Nukleofilo stiprumas', 'Nucleophile strength') },
          {
            rule: t('Neigiamą krūvį turintis nukleofilas stipresnis už savo konjuguotąją rūgštį ($HO-$ > $H2O$). Kai nukleofilinis atomas tas pats, nukleofiliškumas sutampa su bazingumu, todėl alkoksidas > hidroksidas >> karboksilatas > alkoholis > vanduo.',
              'A negatively charged nucleophile is stronger than its conjugate acid ($HO-$ > $H2O$). When the nucleophilic atom is the same, nucleophilicity follows basicity, so alkoxide > hydroxide >> carboxylate > alcohol > water.'),
            src: 'L10 p9'
          },
          { h: t('Nueinančioji grupė', 'Leaving group') },
          {
            rule: t('Geriausiai išeina grupė, kurios neigiamas krūvis stabiliausias, t. y. silpniausia bazė. Todėl SN reakcijose RI > RBr > RCl > RF.',
              'The best leaving group is the one whose negative charge is best stabilised, i.e. the weakest base. So in SN reactions RI > RBr > RCl > RF.'),
            src: 'L10 p10'
          },
          {
            pitfall: t('Fluoras elektroneigiamiausias, bet fluoridas – stipriausia bazė iš halogenidų, todėl blogiausia nueinančioji grupė.',
              'Fluorine is the most electronegative, but fluoride is the strongest base of the halides and so the worst leaving group.'),
            src: 'L10 p10'
          },
          {
            example: {
              q: [
                { p: t('Kas atsitinka, kai natrio metoksidas veikia (a) brommetaną ir (b) 2-brom-2-metilpropaną?', 'What happens when sodium methoxide acts on (a) bromomethane and (b) 2-bromo-2-methylpropane?') },
                { mol: [{ smi: 'CBr', name: t('brommetanas', 'bromomethane') }, { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane') }] }
              ],
              steps: [
                [{ p: t('Sprendžia substrato klasė: metilo anglis atvira, tretinė užstota.', 'The class of the substrate decides: a methyl carbon is open, a tertiary one is shielded.') }],
                [{ p: t('(a) Metilo katijonas nestabilus, o anglis atvira puolimui iš nugaros: SN2, susidaro eteris.', '(a) A methyl cation is unstable and the carbon is open to backside attack: SN2, an ether forms.') }, { mol: { smi: 'COC', name: t('metoksimetanas', 'methoxymethane') } }],
                [{ p: t('(b) Tretinio atomo iš nugaros užstoja trys alkilgrupės, SN2 neįmanomas; stipri bazė atplėšia protoną: E2, susidaro alkenas.', '(b) Three alkyl groups shield the tertiary carbon from the back, so SN2 is impossible; the strong base removes a proton: E2, an alkene forms.') }, { mol: { smi: 'CC(C)=C', name: t('2-metilpropenas', '2-methylpropene') } }]
              ]
            },
            claims: [
              { react: ['sn2', ['CBr'], { nu: 'OC' }, 'COC'] },
              { react: ['sn2', ['CC(C)(C)Br'], { nu: 'OC' }, 'CC(C)=C'] }
            ]
          },
          { practice: 'u10.pick' },
          { practice: 'u10.rank' }
        ]
      },
      /* ------------------------------------------------------------ 5 */
      {
        id: 'products',
        title: t('SN2 produktai ir sintezė', 'SN2 products and synthesis'),
        blocks: [
          { h: t('Nukleofilai ir junginių klasės', 'Nucleophiles and classes of compounds') },
          {
            p: t('SN reakcijos geriausiai vyksta su pirminiais halogenalkanais; su antriniais ir tretiniais atsiranda eliminavimo produktų. Keisdami nukleofilą, gauname skirtingų klasių junginius.',
              'SN reactions go best with primary halides; secondary and tertiary ones also give elimination products. By changing the nucleophile we obtain compounds of different classes.'),
            src: 'L10 p14'
          },
          {
            table: {
              head: [t('Reagentas', 'Reagent'), t('Susidaro', 'Product class'), t('Iš 1-brompropano', 'From 1-bromopropane')],
              rows: [
                [f('$NaOH$'), t('alkoholis', 'alcohol'), { smi: 'CCCO', name: t('1-propanolis', 'propan-1-ol') }],
                [f('$NaSH$'), t('tiolis', 'thiol'), { smi: 'CCCS', name: t('1-propantiolis', 'propane-1-thiol') }],
                [f('$NaOCH3$'), t('eteris', 'ether'), { smi: 'CCCOC', name: t('1-metoksipropanas', '1-methoxypropane') }],
                [f('$NaSCH3$'), t('sulfidas', 'sulfide'), { smi: 'CCCSC', name: t('1-metiltiopropanas', '1-(methylsulfanyl)propane') }],
                [f('$NaCN$'), t('nitrilas', 'nitrile'), { smi: 'CCCC#N', name: t('butannitrilas', 'butanenitrile') }],
                [f('$NaC≡CCH3$'), t('alkinas', 'alkyne'), { smi: 'CCCC#CC', name: t('2-heksinas', 'hex-2-yne') }],
                [t('$NH3$ (perteklius)', '$NH3$ (excess)'), t('aminas', 'amine'), { smi: 'CCCN', name: t('1-propanaminas', 'propan-1-amine') }],
                [f('$CH3COOAg$'), t('esteris', 'ester'), { smi: 'CCCOC(C)=O', name: t('propiletanoatas', 'propyl ethanoate') }]
              ]
            },
            src: 'L10 p14'
          },
          {
            p: t('Visos šios reakcijos tipinės SN2; alkoksido reakcija yra Viljamsono eterių sintezė.',
              'All of these are typical SN2 reactions; the alkoxide reaction is the Williamson ether synthesis.'),
            src: 'L10 p12, p13'
          },
          {
            p: t('Amoniakas ir aminai nukleofiliškai pakeičia halogeną ir sudaro aminus; amoniako imama pertekliaus, kad gautas aminas toliau nealkilintųsi. Karboksirūgšties sidabro druska su halogenalkanu duoda esterį: karboksilato deguonis yra nukleofilas, o susidaro nuosėdos $AgBr$.',
              'Ammonia and amines replace the halogen as nucleophiles and give amines; ammonia is used in excess so that the amine formed is not alkylated further. The silver salt of a carboxylic acid gives an ester with a haloalkane: the carboxylate oxygen is the nucleophile, and $AgBr$ precipitates.'),
            src: 'T p69'
          },
          {
            scheme: { items: [{ smi: 'CI' }, { plus: true }, { smi: '[O-]C1CCCC1' }, { arrow: '→' }, { smi: 'COC1CCCC1', name: t('metoksiciklopentanas', 'methoxycyclopentane') }, { plus: true }, { smi: '[I-]' }], maxWidth: 640 },
            caption: t('Jodmetanas – metilinimo reagentas: nukleofilas gauna $CH3$ grupę.', 'Iodomethane is a methylating reagent: the nucleophile receives a $CH3$ group.'),
            src: 'L10 p12, p15'
          },
          {
            p: t('Gyvuose organizmuose metilina S-adenozilmetioninas (SAM) ir N⁵-metiltetrahidrofolatas: nukleofilas, pavyzdžiui, noradrenalino aminogrupė, SN2 būdu puola sulfonio grupės metilo anglį, o nueinančioji grupė yra neutralus S-adenozilhomocisteinas. Taip noradrenalinas virsta adrenalinu. Panašiai dehalogenazės fermentai SN2 būdu šalina halogeną iš toksiškų halogenalkanų.',
              'In living organisms S-adenosylmethionine (SAM) and N⁵-methyltetrahydrofolate methylate: a nucleophile such as the amino group of noradrenaline attacks the methyl carbon of the sulfonium group by SN2, and the leaving group is neutral S-adenosylhomocysteine. This is how noradrenaline becomes adrenaline. Likewise dehalogenase enzymes remove halogen from toxic alkyl halides by SN2.'),
            src: 'L10 p15, p16, p17'
          },
          {
            scheme: { items: [{ smi: 'NCC(O)c1ccc(O)c(O)c1' }, { plus: true }, { smi: 'C[S+](C)C' }, { arrow: '→' }, { smi: 'CNCC(O)c1ccc(O)c(O)c1' }, { plus: true }, { smi: 'CSC' }, { plus: true }, { smi: '[H+]' }] },
            caption: t('Modelis: trimetilsulfonis vietoje SAM; noradrenalino aminogrupė gauna CH₃ grupę (SN2) ir susidaro adrenalinas.', 'Model: trimethylsulfonium in place of SAM; the amino group of noradrenaline receives a CH₃ group (SN2) and adrenaline forms.'),
            src: 'L10 p16'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)[O-]' }, { plus: true }, { smi: 'ClCCCl', name: t('1,2-dichloretanas', '1,2-dichloroethane') }, { arrow: '→' }, { smi: 'CC(=O)OCCCl' }, { plus: true }, { smi: '[Cl-]' }] },
            caption: t('Dehalogenazė (modelis: acetatas): karboksilato deguonis pakeičia vieną chlorą (SN2).', 'Dehalogenase (model: acetate): the carboxylate oxygen replaces one chlorine (SN2).'),
            src: 'L10 p17'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OCCCl' }, { plus: true }, { smi: 'O' }, { arrow: '→' }, { smi: 'CC(=O)[O-]' }, { plus: true }, { smi: 'OCCCl', name: t('2-chloretanolis', '2-chloroethanol') }, { plus: true }, { smi: '[H+]' }] },
            caption: t('Antroji dalis: esterio hidrolizė atkuria fermentą ir duoda 2-chloretanolį.', 'Second part: hydrolysis of the ester regenerates the enzyme and gives 2-chloroethanol.'),
            src: 'L10 p17'
          },
          { h: t('Intramolekulinė SN2', 'Intramolecular SN2') },
          {
            p: t('Jeigu viena molekulė turi nukleofilinę ir elektrofilinę dalis, nukleofilas gali pulti savo paties anglį ir susidaro žiedas; lengviausiai susidaro penkianariai ir šešianariai žiedai.',
              'If a molecule has both a nucleophilic and an electrophilic centre, the nucleophile can attack a carbon of its own molecule and a ring forms; five- and six-membered rings form most easily.'),
            src: 'S5.9'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: '[O-]CCCCBr', opts: { lonePairs: [0], coords: [[0, 0], [0, 1], [0.87, 1.5], [1.73, 1], [1.73, 0], [2.6, -0.5]] } }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, a: 4 } }, { from: { m: 0, b: [4, 5] }, to: { m: 0, a: 5 } }],
                note: t('Alkoksido deguonis puola anglį, susijusią su bromu; susidaro penkianaris žiedas.', 'The alkoxide oxygen attacks the carbon that bears bromine; a five-membered ring forms.')
              }
            ],
            src: 'S5.9'
          },
          { scheme: { items: [{ smi: '[O-]CCCCBr' }, { arrow: '→' }, { smi: 'C1CCOC1', name: t('tetrahidrofuranas (oksolanas)', 'tetrahydrofuran (oxolane)') }, { plus: true }, { smi: '[Br-]' }] }, caption: t('4-brombutoksidas virsta tetrahidrofuranu.', '4-bromobutoxide becomes tetrahydrofuran.') },
          {
            example: {
              q: [
                { p: t('Kokį heterociklą sudaro 5-brompentoksidas?', 'Which heterocycle does 5-bromopentoxide form?') },
                { mol: { smi: '[O-]CCCCCBr' } }
              ],
              steps: [
                [{ p: t('Nukleofilas yra alkoksido deguonis, elektrofilas – anglis su bromu.', 'The nucleophile is the alkoxide oxygen and the electrophile is the carbon that bears bromine.') }],
                [{ p: t('Deguonis puola iš nugaros ir išstumia bromidą: ryšys užsidaro ir tarp jų lieka penki anglies atomai.', 'Oxygen attacks from the back and pushes out bromide: the bond closes and five carbons remain between the two ends.') }],
                [{ p: t('Susidaro šešianaris žiedas su vienu deguonimi – tetrahidropiranas.', 'A six-membered ring with one oxygen forms: tetrahydropyran.') }, { mol: { smi: 'C1CCCOC1', name: t('tetrahidropiranas (oksanas)', 'tetrahydropyran (oxane)') } }]
              ]
            },
            claims: [{ formula: ['C1CCCOC1', 'C5H10O'] }, { formula: ['[O-]CCCCCBr', 'C5H10BrO-'] }]
          },
          { practice: 'u10.sn2' },
          { practice: 'u10.intra' }
        ]
      },
      /* ------------------------------------------------------------ 6 */
      {
        id: 'elim',
        title: t('Eliminavimas: E2, E1 ir Zaicevo taisyklė', 'Elimination: E2, E1 and Zaitsev’s rule'),
        blocks: [
          { h: t('Dehidrohalogeninimas', 'Dehydrohalogenation') },
          {
            p: t('Eliminuojant halogenalkaną netenkama vandenilio halogenido ir susidaro alkenas. Anijonas čia veikia kaip bazė: atplėšia protoną nuo β atomo, esančio šalia anglies su halogenu. Eliminavimas gali būti bimolekulinis (E2) arba monomolekulinis (E1).',
              'In elimination an alkyl halide loses a hydrogen halide and an alkene forms. The anion acts as a base: it removes a proton from the β carbon next to the carbon with the halogen. Elimination may be bimolecular (E2) or unimolecular (E1).'),
            src: 'L10 p18'
          },
          { h: t('E2: viena stadija', 'E2: one stage') },
          {
            mech: [
              {
                scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CCBr', opts: { allH: true, lonePairs: [2] } }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, mid: [0, 1] } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
                note: t('Vienu metu: bazė atplėšia $H$, susidaro $C=C$, bromidas išeina.', 'All at once: the base removes $H$, the $C=C$ forms and bromide leaves.')
              }
            ],
            caption: t('Brometanas ir hidroksidas.', 'Bromoethane and hydroxide.'),
            src: 'L10 p19'
          },
          { scheme: { items: [{ smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane') }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }, { smi: 'CC(C)=C', name: t('2-metilpropenas', '2-methylpropene') }, { plus: true }, { smi: 'O' }, { plus: true }, { smi: '[Br-]' }] }, caption: t('Tretinis halogenalkanas su hidroksidu taip pat eliminuojasi (E2).', 'A tertiary alkyl halide also eliminates with hydroxide (E2).'), src: 'L10 p19' },
          { h: t('E1: dvi stadijos', 'E1: two stages') },
          {
            p: t('E1 turi tą pačią lėtąją I stadiją kaip SN1. Antrojoje stadijoje silpna bazė (vanduo, alkoholis) atplėšia protoną nuo kaimyninio atomo ir susidaro $C=C$. Todėl E1 ir SN1 vyksta kartu.',
              'E1 has the same slow stage I as SN1. In stage II a weak base (water, alcohol) removes a proton from a neighbouring carbon and the $C=C$ forms. So E1 and SN1 take place together.'),
            src: 'L10 p19'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'O', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[CH+]C', opts: { allH: true } }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, mid: [0, 1] } }],
                note: t('II st.: vanduo atplėšia protoną nuo β anglies, elektronai sudaro dvigubąjį ryšį. Pavyzdyje – supaprastintas antrinis katijonas; tretiniam tas pats mechanizmas.', 'Stage II: water removes a proton from the β carbon and the electrons form the double bond. The picture shows a simplified secondary cation; a tertiary one follows the same mechanism.')
              }
            ],
            src: 'L10 p19'
          },
          { h: t('Zaicevo taisyklė', 'Zaitsev’s rule') },
          {
            rule: t('Jei galimi keli izomeriniai alkenai, vyrauja tas, kurio prie dvigubojo ryšio daugiau alkilgrupių, t. y. vandenilis atskyla nuo kaimyninio anglies atomo, turinčio mažiausiai vandenilių (Zaicevo taisyklė).',
              'If several isomeric alkenes are possible, the one with more alkyl groups on the double bond predominates: the hydrogen leaves the neighbouring carbon that has the fewest hydrogens (Zaitsev’s rule).'),
            src: 'L10 p20'
          },
          {
            scheme: { items: [{ smi: 'CC(Br)CC' }, { arrow: '→', above: f('C2H5ONa'), below: f('C2H5OH') }, { smi: 'CC=CC' }, { plus: true }, { smi: 'CCC=C' }], maxWidth: 640 },
            caption: t('2-brombutanas: dominuoja dvigubai pakeistas 2-butenas (81 %), 1-butenas sudaro 19 %.', '2-bromobutane: the disubstituted but-2-ene predominates (81 %), but-1-ene is 19 %.'),
            src: 'L10 p20'
          },
          {
            pitfall: t('Vandenilis atplėšiamas ne nuo anglies su halogenu, o nuo gretimos (β). Be β vandenilio eliminavimas neįmanomas.',
              'The hydrogen is removed not from the carbon with the halogen but from the neighbouring (β) one. Without a β hydrogen elimination is impossible.'),
            src: 'L10 p18'
          },
          {
            example: {
              q: [
                { p: t('Kokie alkenai susidaro iš 2-brom-3-metilbutano su stipria baze? Kuris dominuoja?', 'Which alkenes form from 2-bromo-3-methylbutane with a strong base? Which one predominates?') },
                { mol: { smi: 'CC(C(C)C)Br', name: t('2-brom-3-metilbutanas', '2-bromo-3-methylbutane'), opts: { numbers: 'all' } } }
              ],
              steps: [
                [{ p: t('Halogenas prie atomo Nr. 2; β atomai yra Nr. 1 (trys H) ir Nr. 3 (vienas H).', 'The halogen is on carbon no. 2; the β carbons are no. 1 (three H) and no. 3 (one H).') }],
                [{ p: t('Jei H atskyla nuo Nr. 1, dvigubasis ryšys susidaro tarp Nr. 1 ir Nr. 2: monopakeistas alkenas.', 'If H leaves from no. 1, the double bond forms between no. 1 and no. 2: a monosubstituted alkene.') }, { mol: { smi: 'CC(C)C=C', name: t('3-metil-1-butenas', '3-methylbut-1-ene') } }],
                [{ p: t('Jei H atskyla nuo Nr. 3 (mažiausiai H), ryšys susidaro tarp Nr. 2 ir Nr. 3: trijų alkilgrupių alkenas.', 'If H leaves from no. 3 (fewest H), the bond forms between no. 2 and no. 3: an alkene with three alkyl groups.') }, { mol: { smi: 'CC=C(C)C', name: t('2-metil-2-butenas', '2-methylbut-2-ene') } }],
              ]
            },
            claims: [
              { react: ['elim', ['CC(C(C)C)Br'], { base: 'strong' }, 'CC=C(C)C'] },
              { name: ['CC(C)C=C', t('3-metil-1-butenas', '3-methylbut-1-ene')] },
              { carbon: ['CC(C(C)C)Br', 1, 2] }
            ]
          },
          { practice: 'u10.elim' },
          { practice: 'u10.draw' }
        ]
      },
      /* ------------------------------------------------------------ 7 */
      {
        id: 'compete',
        title: t('Pakeitimas ar eliminavimas?', 'Substitution or elimination?'),
        blocks: [
          { h: t('Konkurencija', 'Competition') },
          {
            scheme: { items: [{ smi: 'CC(C)(C)Cl' }, { arrow: '→', above: f('80 % C2H5OH'), below: f('20 % H2O, 25 °C') }, { smi: 'CC(C)(C)O' }, { plus: true }, { smi: 'CC(C)(C)OCC' }, { plus: true }, { smi: 'CC(C)=C' }] },
            caption: t('Tretinis chloridas vandeniniame etanolyje (silpni nukleofilai): SN1 (83 %) ir E1 (17 %).', 'A tertiary chloride in aqueous ethanol (weak nucleophiles): SN1 (83 %) and E1 (17 %).'),
            src: 'L10 p22'
          },
          {
            p: t('Su stipria baze (etoksidu) rezultatas priklauso nuo klasės.', 'With a strong base (ethoxide) the result depends on the class.'),
            src: 'L10 p23'
          },
          {
            table: {
              head: [t('Klasė', 'Class'), t('Halogenalkanas + etoksidas', 'Alkyl halide + ethoxide'), t('SN2', 'SN2'), t('E2', 'E2')],
              rows: [
                [t('pirminis', 'primary'), { smi: 'CCBr', name: t('brometanas', 'bromoethane') }, { smi: 'CCOCC' }, { smi: 'C=C', opts: { allH: true } }],
                [t('antrinis', 'secondary'), { smi: 'CC(C)Br', name: t('2-brompropanas', '2-bromopropane') }, { smi: 'CCOC(C)C' }, { smi: 'CC=C' }],
                [t('tretinis', 'tertiary'), { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane') }, t('nevyksta', 'does not occur'), { smi: 'CC(C)=C' }]
              ]
            },
            caption: t('Pirminis: 90 % SN2 ir 10 % E2; antrinis: 21 % SN2 ir 79 % E2; tretinis: 100 % eliminavimas (55 °C, etanolis).', 'Primary: 90 % SN2 and 10 % E2; secondary: 21 % SN2 and 79 % E2; tertiary: 100 % elimination (55 °C, ethanol).'),
            src: 'L10 p23'
          },
          {
            rule: t('Santrauka: metilo ir pirminiai – SN2. Tretiniai: su stipria baze – E2; su silpnu nukleofilu ($H2O$, $ROH$) arba geru, bet silpnai baziniu nukleofilu ($HS-$, $RS-$, $I-$) poliniame protoniniame tirpiklyje – SN1 (kartu šiek tiek E1). Antriniai: su stipria baze – daugiausia E2; su geru, bet silpnai baziniu nukleofilu poliniame aprotoniniame tirpiklyje – SN2.',
              'Summary: methyl and primary: SN2. Tertiary: with a strong base E2; with a weak nucleophile ($H2O$, $ROH$) or a good but weakly basic nucleophile ($HS-$, $RS-$, $I-$) in a polar protic solvent SN1 (with a little E1). Secondary: with a strong base mostly E2; with a good but weakly basic nucleophile in a polar aprotic solvent SN2.'),
            src: 'L10 p21, p23, S5.8, Klein'
          },
          {
            pitfall: t('Tretiniuose halogenalkanuose SN2 nevyksta. Su stipria baze jie eliminuojasi (E2), o su silpnu ar silpnai baziniu nukleofilu poliniame protoniniame tirpiklyje jonizuojasi (SN1).',
              'SN2 does not occur at a tertiary carbon. With a strong base the halide eliminates (E2); with a weak or weakly basic nucleophile in a polar protic solvent it ionises (SN1).'),
            src: 'L10 p23'
          },
          {
            example: {
              q: [
                { p: t('2-brompropanas kaitinamas su natrio etoksidu etanolyje. Koks pagrindinis produktas ir kodėl?', '2-bromopropane is heated with sodium ethoxide in ethanol. What is the main product and why?') },
                { mol: { smi: 'CC(C)Br', name: t('2-brompropanas', '2-bromopropane') } }
              ],
              steps: [
                [{ p: t('Antrinis halogenalkanas, o etoksidas – stipri bazė: pagrindinis kelias E2.', 'A secondary halide and ethoxide is a strong base: the main path is E2.') }],
                [{ p: t('Bazė atplėšia vandenilį nuo vieno iš dviejų metilų, susidaro propenas.', 'The base removes a hydrogen from one of the two methyl groups and propene forms.') }, { mol: { smi: 'CC=C', name: t('propenas', 'propene') } }],
                [{ p: t('Šalutinis kelias – SN2: susidaro 2-etoksipropanas (apie 21 %).', 'The side path is SN2: 2-ethoxypropane forms (about 21 %).') }, { mol: { smi: 'CCOC(C)C', name: t('2-etoksipropanas', '2-ethoxypropane') } }],
              ]
            },
            claims: [
              { react: ['sn2', ['CC(C)Br'], { nu: 'OCC' }, 'CC=C'] },
              { name: ['CCOC(C)C', t('2-etoksipropanas', '2-ethoxypropane')] },
              { carbon: ['CC(C)Br', 1, 2] }
            ]
          },
          { practice: 'u10.compete' }
        ]
      },
      /* ------------------------------------------------------------ 8 */
      {
        id: 'allyl',
        title: t('Alilo ir benzilo halogenidai', 'Allylic and benzylic halides'),
        blocks: [
          { h: t('Stabilizuoti karbokatijonai', 'Stabilised carbocations') },
          {
            p: t('Jei halogenas prijungtas prie anglies šalia $C=C$ (alilo) ar benzeno žiedo (benzilo), jonizacija lengva: katijono krūvis delokalizuojasi konjugacijos būdu. Stabilumo eilė: benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas.',
              'If the halogen sits on a carbon next to a $C=C$ (allylic) or a benzene ring (benzylic), ionisation is easy: the charge of the cation is delocalised by conjugation. Stability order: benzylic > allylic > tertiary > secondary > primary > methyl.'),
            src: 'L7 p9, S5.11'
          },
          {
            resonance: [{ smi: 'C=C[CH+]C' }, { smi: '[CH2+]C=CC' }],
            caption: t('Alilkatijonas: du galai turi dalį teigiamo krūvio.', 'The allyl cation: both ends carry part of the positive charge.')
          },
          {
            resonance: [{ smi: '[CH2+]c1ccccc1' }, { smi: 'C=C1C=CC=C[CH+]1' }, { smi: 'C=C1C=C[CH+]C=C1' }],
            caption: t('Benzilkatijonas: krūvis pasiskirsto orto ir para padėtyse.', 'The benzyl cation: the charge is spread to the ortho and para positions.')
          },
          { h: t('Du skirtingi halogenidai, vienas katijonas', 'Two different halides, one cation') },
          {
            p: t('3-brom-1-butenas yra antrinis, o 1-brom-2-butenas – pirminis alilo halogenidas. Abu praranda bromidą ir sudaro tą patį alilo katijoną, todėl SN1 greičiai beveik vienodi. Vanduo gali pulti bet kurį katijono galą, tad iš abiejų gaunamas tas pats dviejų alkoholių mišinys.',
              '3-bromobut-1-ene is a secondary and 1-bromobut-2-ene a primary allylic halide. Both lose bromide and form the same allyl cation, so their SN1 rates are almost equal. Water may attack either end of the cation, so both give the same mixture of two alcohols.'),
            src: 'S5.11'
          },
          {
            scheme: { items: [{ smi: 'C=CC(C)Br', name: t('3-brom-1-butenas', '3-bromobut-1-ene') }, { arrow: '→', above: f('−Br-') }, { smi: 'C=C[CH+]C' }], maxWidth: 640 },
            src: 'S5.11'
          },
          {
            scheme: { items: [{ smi: 'CC=CCBr', name: t('1-brom-2-butenas', '1-bromobut-2-ene') }, { arrow: '→', above: f('−Br-') }, { smi: 'C=C[CH+]C' }], maxWidth: 640 },
            caption: t('Abu halogenidai duoda tą patį alilo katijoną.', 'Both halides give the same allyl cation.'),
            src: 'S5.11'
          },
          {
            scheme: { items: [{ smi: 'C=C[CH+]C' }, { plus: true }, { smi: 'O' }, { arrow: '→' }, { smi: 'C=CC(C)O' }, { plus: true }, { smi: 'CC=CCO' }], maxWidth: 640 },
            caption: t('Du produktai: antrinis ir pirminis alilo alkoholis.', 'Two products: a secondary and a primary allylic alcohol.')
          },
          {
            pitfall: t('Alilo halogenidas (halogenas prie sp³ anglies šalia $C=C$) reaktyvus, o vinilo (halogenas pačiame $C=C$) – ne.',
              'An allylic halide (halogen on an sp³ carbon next to $C=C$) is reactive, a vinylic one (halogen on the $C=C$ itself) is not.'),
            src: 'L10 p24'
          },
          {
            example: {
              q: [
                { p: t('1-brom-3-metil-2-butenas tirpsta vandenyje. Kokie alkoholiai susidaro?', '1-bromo-3-methylbut-2-ene dissolves in water. Which alcohols form?') },
                { mol: { smi: 'CC(C)=CCBr', name: t('1-brom-3-metil-2-butenas', '1-bromo-3-methylbut-2-ene') } }
              ],
              steps: [
                [{ p: t('Pirminis alilo halogenidas: bromidas lengvai atsiskiria ir gaunamas alilo katijonas, kurio teigiamas krūvis dalijasi tarp pirminio ir tretinio atomų.', 'A primary allylic halide: bromide leaves easily and an allyl cation forms, whose charge is shared between a primary and a tertiary carbon.') }],
                [{ p: t('Vanduo gali prisijungti prie abiejų galų: pirminis alkoholis ir tretinis alkoholis.', 'Water can bond at both ends: a primary and a tertiary alcohol.') }, { mol: [{ smi: 'CC(C)=CCO', name: t('3-metil-2-buten-1-olis', '3-methylbut-2-en-1-ol') }, { smi: 'CC(C)(O)C=C', name: t('2-metil-3-buten-2-olis', '2-methylbut-3-en-2-ol') }] }]
              ]
            },
            claims: [
              { react: ['sn1', ['CC(C)=CCBr'], { nu: 'OH' }, 'CC(C)=CCO'] },
              { react: ['sn1', ['CC(C)=CCBr'], { nu: 'OH' }, 'CC(C)(O)C=C'] }
            ]
          },
          { practice: 'u10.allyl' },
          { practice: 'u10.sn1' }
        ]
      },
      /* ------------------------------------------------------------ 9 */
      {
        id: 'unreactive',
        title: t('Halogenalkenai ir halogenarenai', 'Haloalkenes and haloarenes'),
        blocks: [
          { h: t('Kodėl jie nereaguoja SN būdu?', 'Why they do not undergo SN') },
          {
            p: t('Chloreteno ir chlorbenzeno halogeno laisva pora sąveikauja su π sistema ($p,π$-konjugacija), todėl C–Hal ryšys trumpesnis ir tvirtesnis nei halogenalkanuose. Reikia griežtų sąlygų, o aukštoje temperatūroje vyrauja eliminavimas, prisijungimas ar polimerizacija.',
              'In chloroethene and chlorobenzene a lone pair of the halogen interacts with the π system ($p,π$ conjugation), so the C–Hal bond is shorter and stronger than in alkyl halides. Harsh conditions are needed, and at high temperature elimination, addition or polymerisation takes over.'),
            src: 'L10 p24'
          },
          {
            resonance: [{ smi: 'C=CCl', opts: { lonePairs: [2] } }, { smi: '[CH2-]C=[Cl+]' }],
            caption: t('Chloro laisvoji pora konjuguota su dvigubuoju ryšiu (rezonansinės formulės).', 'The chlorine lone pair is conjugated with the double bond (resonance structures).'),
            src: 'L10 p24'
          },
          { h: t('Kada jie vis dėlto reaguoja', 'When they do react') },
          {
            scheme: { items: [{ smi: 'Clc1ccccc1' }, { plus: true }, { smi: '[OH-]' }, { arrow: '→', above: f('300 °C') }, { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }, { plus: true }, { smi: '[Cl-]' }], maxWidth: 640 },
            caption: t('Chlorbenzenas virsta fenoliu tik labai aukštoje temperatūroje (virš 200 °C).', 'Chlorobenzene becomes phenol only at a very high temperature (above 200 °C).'),
            src: 'L10 p25'
          },
          {
            scheme: { items: [{ smi: 'CC=C(Br)C' }, { plus: true }, { smi: '[OH-]' }, { arrow: '→', below: t('koncentruotas šarmas', 'concentrated alkali') }, { smi: 'CC#CC' }, { plus: true }, { smi: '[Br-]' }, { plus: true }, { smi: 'O' }] },
            caption: t('Halogenalkenas su H prie $C=C$ ir koncentruotas šarmas: HX atskyla, susidaro alkinas.', 'A haloalkene with H on the $C=C$ and concentrated alkali: HX is lost and an alkyne forms.'),
            src: 'L10 p25'
          },
          {
            p: t('Jei benzeno žiede yra stiprių elektronų akceptorinių grupių, halogenas pakeičiamas nukleofilu: trinitrochlorbenzenas su hidroksidu duoda pikrino rūgštį. Panašiai Sangerio reagentas (1-fluor-2,4-dinitrobenzenas) reaguoja su peptido N-galo aminogrupe.',
              'If the benzene ring carries strong electron-withdrawing groups, its halogen can be replaced by a nucleophile: trinitrochlorobenzene with hydroxide gives picric acid. Likewise Sanger’s reagent (1-fluoro-2,4-dinitrobenzene) reacts with the N-terminal amino group of a peptide.'),
            src: 'L10 p26'
          },
          {
            scheme: { items: [{ smi: 'Clc1c([N+](=O)[O-])cc([N+](=O)[O-])cc1[N+](=O)[O-]' }, { arrow: '→', above: f('1. OH-'), below: f('2. H3O+') }, { smi: 'Oc1c([N+](=O)[O-])cc([N+](=O)[O-])cc1[N+](=O)[O-]', name: t('2,4,6-trinitrofenolis', '2,4,6-trinitrophenol') }] },
            src: 'L10 p26'
          },
          {
            scheme: { items: [{ smi: 'Fc1ccc(cc1[N+](=O)[O-])[N+](=O)[O-]', name: t('1-fluor-2,4-dinitrobenzenas', '1-fluoro-2,4-dinitrobenzene') }, { plus: true }, { smi: 'NCC(=O)NCC(=O)O' }, { arrow: '→' }, { smi: 'OC(=O)CNC(=O)CNc1ccc(cc1[N+](=O)[O-])[N+](=O)[O-]' }, { plus: true }, { smi: 'F' }] },
            caption: t('Sangerio reagentas su dipeptido N-galo aminogrupe.', 'Sanger’s reagent with the N-terminal amino group of a dipeptide.'),
            src: 'L10 p26'
          },
          {
            pitfall: t('Jei halogenas yra prie $C=C$ ar benzeno žiedo, SN1 ir SN2 mechanizmų nerašykite.',
              'If the halogen is on a $C=C$ or a benzene ring, do not write SN1 or SN2.'),
            src: 'L10 p24, p29'
          },
          { practice: 'u10.unreact' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka: SN1, SN2, E1, E2', 'Cheat sheet: SN1, SN2, E1, E2') },
      {
        table: {
          head: [t('Požymis', 'Feature'), f('SN2'), f('SN1'), f('E2'), f('E1')],
          rows: [
            [t('stadijos', 'stages'), t('viena', 'one'), t('dvi (I st. lėta)', 'two (stage I slow)'), t('viena', 'one'), t('dvi (I st. lėta)', 'two (stage I slow)')],
            [t('greitis', 'rate'), f('$k[RX][Nu]$'), f('$k[RX]$'), f('$k[RX][B]$'), f('$k[RX]$')],
            [t('substratas', 'substrate'), t('metilo, pirminis', 'methyl, primary'), t('tretinis, alilo, benzilo', 'tertiary, allylic, benzylic'), t('antrinis, tretinis (ir pirminis)', 'secondary, tertiary (and primary)'), t('tretinis, alilo, benzilo', 'tertiary, allylic, benzylic')],
            [t('reagentas', 'reagent'), t('stiprus nukleofilas', 'strong nucleophile'), t('silpnas nukleofilas ($H2O$, $ROH$)', 'weak nucleophile ($H2O$, $ROH$)'), t('stipri bazė ($RO-$, $HO-$)', 'strong base ($RO-$, $HO-$)'), t('silpna bazė ($H2O$, $ROH$)', 'weak base ($H2O$, $ROH$)')],
            [t('tirpiklis', 'solvent'), t('poliniai aprotoniniai', 'polar aprotic'), t('poliniai protoniniai', 'polar protic'), t('nėra svarbus', 'not decisive'), t('poliniai protoniniai', 'polar protic')],
            [t('tarpinis junginys', 'intermediate'), t('nėra (tik pereinamoji būsena)', 'none (transition state only)'), t('karbokatijonas', 'carbocation'), t('nėra (tik pereinamoji būsena)', 'none (transition state only)'), t('karbokatijonas', 'carbocation')],
            [t('rezultatas', 'result'), t('inversija', 'inversion'), t('racematas', 'racemate'), t('Zaicevo taisyklė', 'Zaitsev’s rule'), t('Zaicevo taisyklė', 'Zaitsev’s rule')]
          ]
        },
        src: 'L10 p4, p5, p19, p21'
      },
      {
        list: [
          t('Nueinančioji grupė: RI > RBr > RCl > RF (silpniausia bazė išeina geriausiai).', 'Leaving group: RI > RBr > RCl > RF (the weakest base leaves best).'),
          t('Nukleofilas: alkoksidas > hidroksidas >> karboksilatas > alkoholis > vanduo; anijonas stipresnis už konjuguotąją rūgštį.', 'Nucleophile: alkoxide > hydroxide >> carboxylate > alcohol > water; an anion is stronger than its conjugate acid.'),
          t('Katijono stabilumas: benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas.', 'Cation stability: benzylic > allylic > tertiary > secondary > primary > methyl.'),
          t('Pirminiai: SN2 (ir E2). Tretiniai: su stipria baze E2, kitaip SN1 ir E1. Antriniai: su stipria baze daugiausia E2, su silpnai baziniu nukleofilu aprotoniniame tirpiklyje SN2.', 'Primary: SN2 (and E2). Tertiary: E2 with a strong base, otherwise SN1 and E1. Secondary: mostly E2 with a strong base, SN2 with a weakly basic nucleophile in an aprotic solvent.'),
          t('Zaicevo taisyklė: dominuoja alkenas, kurio prie $C=C$ daugiau alkilgrupių.', 'Zaitsev’s rule: the alkene with more alkyl groups on the $C=C$ predominates.'),
          t('Vinilo ir arilo halogenidai SN1 ir SN2 būdu nereaguoja; alilo ir benzilo halogenidai SN1 reaguoja lengvai.', 'Vinyl and aryl halides do not react by SN1 or SN2; allylic and benzylic halides undergo SN1 readily.'),
          t('Intramolekulinė SN2 suriša molekulės galus į žiedą (geriausiai 5–6 narių).', 'Intramolecular SN2 closes the ends of a molecule into a ring (best with 5 or 6 members).')
        ]
      }
    ],
    types: [
      /* ============================================================ u10.class */
      {
        id: 'u10.class',
        title: t('Halogenido klasė ir tinkamas mechanizmas', 'Class of the halide and its mechanism'),
        mirrors: [],
        gen(rng, ctx) {
          const { chem, name } = ctx;
          const TPL = {
            methyl: ['CX'],
            primary: ['CCX', 'CCCX', 'CCCCX', 'CC(C)CX', 'CCCCCX', 'CC(C)CCX', 'XCC1CCCCC1', 'CCC(C)CX', 'CCCCCCX', 'XCCCC(C)C'],
            secondary: ['CC(X)C', 'CCC(X)C', 'CC(X)CC(C)C', 'XC1CCCCC1', 'CC(X)C(C)C', 'CCCC(C)X', 'XC1CCCC1', 'CCC(X)CC', 'CC(X)CCCC'],
            tertiary: ['CC(C)(C)X', 'CCC(C)(C)X', 'CC(C)C(C)(C)X', 'XC1(C)CCCCC1', 'CCC(C)(X)CC', 'CCCC(C)(C)X', 'XC1(C)CCCC1', 'CC(C)(X)CCC'],
            vinyl: ['C=CX', 'CC=CX', 'C=C(X)C', 'XC1=CCCCC1', 'CC(X)=CC', 'CCC=CX'],
            aryl: ['Xc1ccccc1', 'Cc1ccc(X)cc1', 'Cc1ccccc1X', 'CCc1ccc(X)cc1', 'Xc1ccc(C)cc1C']
          };
          const KIND = {
            methyl: { opt: 0, mech: 0, lt: 'metilo halogenidas (halogenas prie CH₃)', en: 'a methyl halide (halogen on a CH₃)' },
            primary: { opt: 1, mech: 0, lt: 'pirminis halogenalkanas', en: 'a primary alkyl halide' },
            secondary: { opt: 2, mech: 2, lt: 'antrinis halogenalkanas', en: 'a secondary alkyl halide' },
            tertiary: { opt: 3, mech: 1, lt: 'tretinis halogenalkanas', en: 'a tertiary alkyl halide' },
            vinyl: { opt: 4, mech: 3, lt: 'halogenalkenas (halogenas prie $C=C$ anglies)', en: 'a haloalkene (halogen on a $C=C$ carbon)' },
            aryl: { opt: 5, mech: 3, lt: 'halogenarenas (halogenas prie benzeno žiedo)', en: 'a haloarene (halogen on the benzene ring)' }
          };
          const key = ctx.pick(Object.keys(TPL));
          const X = ctx.pick(['Cl', 'Br', 'I']);
          const smi = putHalogen(ctx.pick(TPL[key]), X);
          const s = site(ctx, smi);
          if (!s) throw new Error('u10.class: bad template ' + smi);
          const k = KIND[key];
          const nbs = cNb(s.m, s.c).length;
          const NBW = [['neturi kaimyninių anglies atomų', 'has no neighbouring carbon'], ['turi vieną kaimyninį anglies atomą', 'has one neighbouring carbon'], ['turi du kaimyninius anglies atomus', 'has two neighbouring carbons'], ['turi tris kaimyninius anglies atomus', 'has three neighbouring carbons']];
          const steps = [
            {
              prompt: t('Kokia yra halogeną turinčios anglies hibridizacija?', 'What is the hybridisation of the carbon that bears the halogen?'),
              kind: 'choice', options: [tx('sp³', 'sp³'), tx('sp²', 'sp²'), tx('sp', 'sp')], answer: (key === 'vinyl' || key === 'aryl') ? 1 : 0,
              hint: t('Ar halogeno anglis turi dvigubąjį ryšį arba priklauso benzeno žiedui?', 'Does the halogen carbon have a double bond, or belong to a benzene ring?'),
              solution: (key === 'vinyl' || key === 'aryl')
                ? t('Halogeno anglis priklauso dvigubajam ryšiui ar aromatiniam žiedui, todėl ji sp² hibridizuota.', 'The halogen carbon belongs to a double bond or an aromatic ring, so it is sp².')
                : t('Halogeno anglis turi tik vienkartinius ryšius, todėl ji sp³ hibridizuota.', 'The halogen carbon has only single bonds, so it is sp³.')
            },
            {
              prompt: t('Kokio tipo šis halogenidas?', 'What kind of halide is this?'),
              kind: 'choice',
              options: [tx('metilo halogenidas', 'methyl halide'), tx('pirminis halogenalkanas', 'primary alkyl halide'), tx('antrinis halogenalkanas', 'secondary alkyl halide'),
                tx('tretinis halogenalkanas', 'tertiary alkyl halide'), tx('halogenalkenas (halogenas prie $C=C$ anglies)', 'haloalkene (halogen on a $C=C$ carbon)'), tx('halogenarenas (halogenas prie benzeno žiedo)', 'haloarene (halogen on the benzene ring)')],
              answer: k.opt,
              hint: t('Pirmiausia nustatykite, ar halogeno anglis yra sp³ hibridizuota. Jei taip, suskaičiuokite jos kaimynus, kurie yra anglies atomai.', 'First decide whether the halogen carbon is sp³. If it is, count its neighbours that are carbon atoms.'),
              solution: key === 'vinyl' || key === 'aryl'
                ? t('Halogeno anglis yra sp² hibridizuota: tai ' + k.lt + '.', 'The halogen carbon is sp²: this is ' + k.en + '.')
                : t('Halogeno anglis ' + NBW[nbs][0] + ': tai ' + k.lt + '.', 'The halogen carbon ' + NBW[nbs][1] + ': this is ' + k.en + '.')
            },
            {
              prompt: t('Kuris teiginys apie šio junginio nukleofilinį pakeitimą teisingas?', 'Which statement about nucleophilic substitution of this compound is right?'),
              kind: 'choice',
              options: [
                tx('Būdingas SN2: halogeno anglis atvira puolimui iš nugaros, o katijonas nestabilus.', 'SN2 is typical: the carbon is open to backside attack and the cation is unstable.'),
                tx('Būdingi SN1 ir E1: susidaro stabilus tretinis karbokatijonas.', 'SN1 and E1 are typical: a stable tertiary carbocation forms.'),
                tx('Galimi ir SN1, ir SN2: tai lemia nukleofilas ir tirpiklis.', 'Both SN1 and SN2 are possible: the nucleophile and the solvent decide.'),
                tx('SN1 ir SN2 nevyksta įprastomis sąlygomis: $p,π$-konjugacija sustiprina C–Hal ryšį.', 'SN1 and SN2 do not occur under ordinary conditions: $p,π$ conjugation strengthens the C–Hal bond.')
              ],
              answer: k.mech,
              hint: t('Pagalvokite, ar anglis atvira puolimui iš nugaros ir ar iš jos galėtų susidaryti stabilus katijonas.', 'Think about whether the carbon is open to backside attack and whether a stable cation could form from it.'),
              solution: t('Čia ' + k.lt + '. ' + [
                'Pirminiams ir metilo halogenidams būdingas SN2.',
                'Tretiniams būdingi SN1 ir E1.',
                'Antriniams vyksta abu keliai, o pasirinkimą lemia sąlygos.',
                'Vinilo ir arilo halogenidų SN reakcijoms reikia griežtų sąlygų.'
              ][k.mech], 'This is ' + k.en + '. ' + [
                'Primary and methyl halides favour SN2.',
                'Tertiary halides favour SN1 and E1.',
                'Secondary halides can go both ways and the conditions decide.',
                'Substitution of vinyl and aryl halides needs harsh conditions.'
              ][k.mech])
            }
          ];
          const lt = name.name(smi, { lang: 'lt' }), en = name.name(smi, { lang: 'en' });
          if (lt && en) {
            steps.push({
              prompt: t('Pavadinkite junginį.', 'Name the compound.'),
              kind: 'name', mol: { smi }, answer: { smi },
              hint: t('Raskite pagrindinę grandinę ar žiedą ir sunumeruokite taip, kad pakaitai gautų mažiausius numerius.', 'Find the parent chain or ring and number it so that the substituents get the lowest numbers.'),
              solution: t(lt.name, en.name)
            });
          }
          return {
            q: [{ p: t('Pateiktas halogenidas.', 'Here is a halide.') }, { mol: { smi } }],
            steps,
            why: t('Halogenalkano klasę nusako halogeno anglies kaimynai: vienas – pirminis, du – antrinis, trys – tretinis. Pirminis ir metilo halogenidai reaguoja SN2, tretinis – SN1 ir E1 per stabilų karbokatijoną. Jei halogenas prie sp² anglies, SN1 ir SN2 nevyksta.',
              'The class of an alkyl halide is set by the neighbours of the halogen carbon: one is primary, two secondary, three tertiary. Primary and methyl halides react by SN2, tertiary ones by SN1 and E1 through a stable carbocation. If the halogen is on an sp² carbon, neither SN1 nor SN2 takes place.'),
            src: 'L10 p2, p7, p21, p24'
          };
        }
      },
      /* ============================================================ u10.pick */
      {
        id: 'u10.pick',
        title: t('Kuris mechanizmas vyraus ir kodėl', 'Which mechanism wins, and why'),
        mirrors: ['S5.8'],
        bank: [
          {
            id: 'u10.pick.1',
            q: [{ p: t('1-brombutanas reaguoja su natrio cianidu dimetilsulfokside.', '1-bromobutane reacts with sodium cyanide in dimethyl sulfoxide.') }, { scheme: { items: [{ smi: 'CCCCBr', name: t('1-brombutanas', '1-bromobutane') }, { arrow: '→', above: f('NaCN'), below: f('(CH3)2SO') }] } }],
            steps: [
              cho(t('Kuris mechanizmas vyrauja?', 'Which mechanism predominates?'), MECH4.concat([NOSN]), 1,
                t('Įvertinkite substrato klasę, nukleofilą ir tirpiklį.', 'Consider the class of the substrate, the nucleophile and the solvent.'),
                t('SN2: pirminis substratas, stiprus nukleofilas, polinis aprotoninis tirpiklis.', 'SN2: a primary substrate, a strong nucleophile and a polar aprotic solvent.')),
              cho(t('Kuris paaiškinimas teisingas?', 'Which explanation is right?'), [
                tx('Pirminis katijonas nestabilus, o anglis atvira puolimui iš nugaros; cianidas stiprus, o aprotoninis tirpiklis jo nesilpnina.', 'A primary cation is unstable and the carbon is open to backside attack; cyanide is strong and an aprotic solvent does not weaken it.'),
                tx('Pirminis katijonas stabilus, todėl vyksta SN1, o cianidas prisijungia antroje stadijoje.', 'A primary cation is stable, so SN1 takes place and cyanide bonds in the second stage.'),
                tx('Cianidas yra stipri bazė, todėl atplėšia β vandenilį ir vyksta E2.', 'Cyanide is a strong base, so it removes a β hydrogen and E2 takes place.'),
                tx('Poliniai aprotoniniai tirpikliai skatina SN1, nes stabilizuoja halogenido joną.', 'Polar aprotic solvents favour SN1 because they stabilise the halide ion.')
              ], 0, t('Kuo pirminis katijonas skiriasi nuo tretinio?', 'How does a primary cation differ from a tertiary one?'),
                t('Alkilgrupių mažai, hiperkonjugacija silpna, todėl SN1 neįmanomas; nukleofilas puola iš nugaros.', 'There are few alkyl groups, so hyperconjugation is weak and SN1 is out; the nucleophile attacks from the back.'))
            ],
            why: t('Metilo ir pirminiai halogenidai su stipriais nukleofilais reaguoja SN2 būdu, nes jie sudaro nestabilų katijoną, o anglis nėra užstota. Aprotoniniai tirpikliai nukleofilo nesolvatuoja ir jį sustiprina.',
              'Methyl and primary halides react with strong nucleophiles by SN2, because they give an unstable cation and the carbon is not shielded. Aprotic solvents do not solvate the nucleophile and keep it strong.'),
            src: 'L10 p7, p9, p10',
            claims: [{ react: ['sn2', ['CCCCBr'], { nu: 'CN' }, 'CCCCC#N'] }]
          },
          {
            id: 'u10.pick.2',
            q: [{ p: t('2-brom-2-metilbutanas tirpinamas metanolyje.', '2-bromo-2-methylbutane is dissolved in methanol.') }, { scheme: { items: [{ smi: 'CC(C)(Br)CC', name: t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane') }, { arrow: '→', above: f('CH3OH') }] } }],
            steps: [
              cho(t('Kuris mechanizmas vyrauja?', 'Which mechanism predominates?'), MECH4.concat([NOSN]), 0,
                t('Metanolis čia ir nukleofilas, ir tirpiklis.', 'Methanol is both the nucleophile and the solvent.'),
                t('SN1 (su E1 kaip šalutiniu keliu): tretinis halogenalkanas silpname nukleofile.', 'SN1 (with E1 as a side path): a tertiary halide in a weak nucleophile.')),
              cho(t('Kuri stadija lemia reakcijos greitį?', 'Which stage sets the reaction rate?'), [
                tx('Bromido atsiskyrimas ir karbokatijono susidarymas', 'Loss of bromide and formation of the carbocation'),
                tx('Metanolio prisijungimas prie karbokatijono', 'Bonding of methanol to the carbocation'),
                tx('Oksonio jono deprotonavimas', 'Deprotonation of the oxonium ion'),
                tx('Visos stadijos vienodai', 'All stages equally')
              ], 0, t('Kuri stadija lėta?', 'Which stage is slow?'),
                t('Lėtoji I stadija yra jonizacija; po jos viskas vyksta greitai.', 'The slow stage I is ionisation; everything after it is fast.'))
            ],
            why: t('Tretinis halogenalkanas gali sudaryti stabilų karbokatijoną, o protoninis tirpiklis jį stabilizuoja. Puolimą iš nugaros užstoja trys alkilgrupės, todėl vyksta SN1; greitį lemia tik halogenalkano koncentracija.',
              'A tertiary alkyl halide forms a stable carbocation, which the protic solvent stabilises further. Three alkyl groups block attack from the back, so SN1 takes place; the rate depends only on the alkyl halide concentration.'),
            src: 'L10 p4, p7, p10',
            claims: [{ react: ['sn1', ['CC(C)(Br)CC'], { nu: 'OC' }, 'CCC(C)(C)OC'] }]
          },
          {
            id: 'u10.pick.3',
            q: [{ p: t('2-brompropanas kaitinamas su natrio etoksidu etanolyje.', '2-bromopropane is heated with sodium ethoxide in ethanol.') }, { scheme: { items: [{ smi: 'CC(C)Br', name: t('2-brompropanas', '2-bromopropane') }, { arrow: '→', above: f('C2H5ONa'), below: f('C2H5OH, 55 °C') }] } }],
            steps: [
              cho(t('Kuris kelias vyrauja?', 'Which path predominates?'), MECH4, 3,
                t('Etoksidas yra stipri bazė, o substratas antrinis.', 'Ethoxide is a strong base and the substrate is secondary.'),
                t('E2: pagrindinis produktas propenas (apie 79 %), SN2 eteris – tik apie 21 %.', 'E2: the main product is propene (about 79 %), the SN2 ether only about 21 %.')),
              cho(t('Kodėl SN2 čia užleidžia vietą eliminavimui?', 'Why does SN2 give way to elimination here?'), [
                tx('Du metilai iš dalies užstoja anglį iš nugaros, o stipri bazė lengviau atplėšia gretimą protoną.', 'Two methyl groups partly shield the carbon from the back, and a strong base removes a neighbouring proton more easily.'),
                tx('Antrinis katijonas labai stabilus, todėl vyksta E1.', 'A secondary cation is very stable, so E1 takes place.'),
                tx('Etanolis yra aprotoninis tirpiklis ir skatina E2.', 'Ethanol is an aprotic solvent and favours E2.'),
                tx('Etoksidas yra silpnas nukleofilas, todėl visai nereaguoja.', 'Ethoxide is a weak nucleophile, so it does not react at all.')
              ], 0, t('Palyginkite, kas lengviau: pulti anglį ar atplėšti vandenilį.', 'Compare what is easier: attacking carbon or removing a hydrogen.'),
                t('Didėjant bazės stiprumui ir substrato klasei, auga eliminavimo dalis.', 'The share of elimination grows with the strength of the base and the class of the substrate.'))
            ],
            why: t('Su stipria baze pirminis halogenalkanas daugiausia pakeičiamas, antrinis daugiausia eliminuojamas, o tretinis – tik eliminuojamas. Pasirinkimą lemia ir erdvinė kliūtis, ir bazės stiprumas.',
              'With a strong base a primary halide is mostly substituted, a secondary one mostly eliminated and a tertiary one only eliminated. Both steric hindrance and base strength decide.'),
            src: 'L10 p21, p23',
            claims: [{ react: ['sn2', ['CC(C)Br'], { nu: 'OCC' }, 'CC=C'] }]
          },
          {
            id: 'u10.pick.4',
            q: [{ p: t('1-brom-1-metilciklopentanas veikiamas vandeniu.', '1-bromo-1-methylcyclopentane is treated with water.') }, { scheme: { items: [{ smi: 'CC1(Br)CCCC1', name: t('1-brom-1-metilciklopentanas', '1-bromo-1-methylcyclopentane') }, { arrow: '→', above: f('H2O') }] } }],
            steps: [
              {
                prompt: t('Bakstelėkite anglies atomą, kuris pirmoje stadijoje taps teigiamu.', 'Tap the carbon that becomes positive in the first stage.'),
                kind: 'atoms', mol: { smi: 'CC1(Br)CCCC1', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Kuris atomas lieka be ryšio elektronų, kai halogenas išeina su jais?', 'Which atom is left without the bonding electrons when the halogen leaves with them?'),
                solution: t('Atomas Nr. 2 turi tris anglies kaimynus, todėl tai tretinis karbokatijonas.', 'Atom no. 2 has three carbon neighbours, so this is a tertiary carbocation.')
              },
              cho(t('Kuris mechanizmas vyrauja?', 'Which mechanism predominates?'), MECH4, 0,
                t('Pažiūrėkite, koks karbokatijonas susidarytų ir koks nukleofilas čia yra.', 'See which carbocation would form and which nucleophile is present.'),
                t('SN1 per tretinį karbokatijoną; vanduo – silpnas nukleofilas.', 'SN1 through a tertiary carbocation; water is a weak nucleophile.'))
            ],
            why: t('Tretinis katijonas stabilizuotas trijų alkilgrupių (hiperkonjugacija), todėl jonizacija lengva, o vanduo kaip tirpiklis jį dar ir stabilizuoja. Produktas – tretinis alkoholis, o šalutiniai – alkenai.',
              'A tertiary cation is stabilised by three alkyl groups (hyperconjugation), so ionisation is easy, and water as a solvent stabilises it further. The product is a tertiary alcohol and the by-products are alkenes.'),
            src: 'L10 p7, p8, S5.8',
            claims: [{ react: ['sn1', ['CC1(Br)CCCC1'], { nu: 'OH' }, 'CC1(O)CCCC1'] }]
          },
          {
            id: 'u10.pick.5',
            q: [{ p: t('(Chlormetil)cikloheksanas reaguoja su hidroksido jonu.', '(Chloromethyl)cyclohexane reacts with hydroxide ion.') }, { scheme: { items: [{ smi: 'ClCC1CCCCC1', name: t('(chlormetil)cikloheksanas', '(chloromethyl)cyclohexane') }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }] } }],
            steps: [
              cho(t('Kuris mechanizmas vyrauja?', 'Which mechanism predominates?'), MECH4, 1,
                t('Nustatykite halogenalkano klasę.', 'Find the class of the alkyl halide.'),
                t('SN2: halogenas prie $CH2$ grupės, tai pirminis halogenalkanas, o hidroksidas – stiprus nukleofilas.', 'SN2: the halogen is on a $CH2$ group, a primary alkyl halide, and hydroxide is a strong nucleophile.')),
              cho(t('Kas atsitiktų, jei nukleofilo koncentracija padvigubėtų?', 'What would happen if the concentration of the nucleophile doubled?'), [
                tx('Reakcijos greitis padidėtų maždaug dvigubai.', 'The reaction rate would roughly double.'),
                tx('Greitis nepasikeistų, nes lėtoji stadija yra jonizacija.', 'The rate would not change, because the slow stage is ionisation.'),
                tx('Greitis sumažėtų, nes nukleofilas užstotų substratą.', 'The rate would fall, because the nucleophile would shield the substrate.'),
                tx('Reakcija taptų SN1.', 'The reaction would become SN1.')
              ], 0, t('Kokie reagentai įeina į SN2 greičio lygtį?', 'Which reagents appear in the rate law of SN2?'),
                t('Greitis = $k[RX][Nu]$, todėl padvigubinus Nu, greitis padvigubėja.', 'Rate = $k[RX][Nu]$, so doubling [Nu] doubles the rate.'))
            ],
            why: t('SN2 greitis priklauso nuo abiejų reagentų koncentracijų, o SN1 – tik nuo halogenalkano. Todėl nukleofilo koncentracija yra paprastas bandymas, kuriuo skiriami šie mechanizmai.',
              'The SN2 rate depends on the concentrations of both reagents, SN1 only on the alkyl halide. The effect of the nucleophile concentration is therefore a simple experiment that tells the mechanisms apart.'),
            src: 'L10 p4, p5, p29',
            claims: [{ react: ['sn2', ['ClCC1CCCCC1'], { nu: 'OH' }, 'OCC1CCCCC1'] }]
          },
          {
            id: 'u10.pick.6',
            q: [{ p: t('Trys halogenidai veikiami natrio metoksidu metanolyje.', 'Three halides are treated with sodium methoxide in methanol.') },
              { mol: [{ smi: 'CBr', caption: t('a', 'a') }, { smi: 'CC(C)(C)Br', caption: t('b', 'b') }, { smi: 'CCCBr', caption: t('c', 'c') }] }],
            steps: [{
              prompt: t('Sudėkite junginius pagal SN2 produkto dalį: nuo didžiausios iki mažiausios.', 'Put the compounds in order of the share of SN2 product: from the largest to the smallest.'),
              kind: 'order',
              options: [tx('a: brommetanas', 'a: bromomethane'), tx('c: 1-brompropanas', 'c: 1-bromopropane'), tx('b: 2-brom-2-metilpropanas', 'b: 2-bromo-2-methylpropane')],
              hint: t('Kuo labiau užstota anglis ir kuo stipresnė bazė, tuo mažiau SN2.', 'The more shielded the carbon and the stronger the base, the less SN2.'),
              solution: t('Metilo halogenidas tik pakeičiamas, pirminis daugiausia pakeičiamas, tretinis SN2 produkto nesudaro (E2).', 'A methyl halide is only substituted, a primary one mostly substituted, a tertiary one gives no SN2 product (E2).')
            }, cho(t('Kokį mechanizmą turi tretinis halogenidas su metoksidu?', 'Which mechanism does the tertiary halide follow with methoxide?'), MECH4, 3,
              t('Metoksidas yra ir nukleofilas, ir stipri bazė.', 'Methoxide is a nucleophile and also a strong base.'),
              t('E2: SN2 neįmanomas, o stipri bazė atplėšia β protoną.', 'E2: SN2 is impossible and the strong base removes a β proton.'))],
            why: t('Didėjant halogeno anglies klasei SN2 dalis mažėja: metilo > pirminis > antrinis >> tretinis. Tretinis halogenidas su stipria baze eliminuojamas.',
              'As the class of the halogen carbon rises, the SN2 share falls: methyl > primary > secondary >> tertiary. A tertiary halide with a strong base eliminates.'),
            src: 'L10 p14, p21, p23',
            claims: [{ react: ['sn2', ['CBr'], { nu: 'OC' }, 'COC'] }, { react: ['sn2', ['CC(C)(C)Br'], { nu: 'OC' }, 'CC(C)=C'] }]
          },
          {
            id: 'u10.pick.7',
            q: [{ p: t('Šie halogenidai yra nukleofilinio pakeitimo substratai.', 'These halides are substrates for nucleophilic substitution.') },
              { mol: [{ smi: 'CCC(C)(C)Br', caption: t('a', 'a') }, { smi: 'Cc1ccc(Br)cc1', caption: t('b', 'b') }, { smi: 'CC(Br)=C', caption: t('c', 'c') }, { smi: 'CC(C)CCBr', caption: t('d', 'd') }] }],
            steps: [{
              prompt: t('Priskirkite kiekvienam substratui jam būdingą mechanizmą.', 'Match each substrate with the mechanism typical of it.'),
              kind: 'match',
              answer: {
                left: [mo('CCC(C)(C)Br'), mo('Cc1ccc(Br)cc1'), mo('CC(Br)=C'), mo('CC(C)CCBr')],
                right: [tx('SN1 (su silpnu nukleofilu, pvz., vandeniu)', 'SN1 (with a weak nucleophile such as water)'), tx('SN2 (su stipriu nukleofilu)', 'SN2 (with a strong nucleophile)'), NOSN],
                pairs: [0, 2, 2, 1]
              },
              hint: t('Pirmiausia pažiūrėkite, ar halogenas prie sp³ anglies.', 'First check whether the halogen is on an sp³ carbon.'),
              solution: t('a – tretinis: SN1; b – arilo halogenidas, c – vinilo halogenidas: SN nevyksta; d – pirminis: SN2.', 'a is tertiary: SN1; b is an aryl halide and c a vinyl halide: no SN; d is primary: SN2.')
            }],
            why: t('Pirmiausia ieškoma halogeno anglies hibridizacija: sp² anglis reiškia, kad SN nevyksta. Tada sprendžia klasė: tretinis – SN1, pirminis – SN2.',
              'First look at the hybridisation of the halogen carbon: an sp² carbon means no SN. Then the class decides: tertiary gives SN1, primary gives SN2.'),
            src: 'L10 p24, p29'
          },
          {
            id: 'u10.pick.8',
            q: [{ p: t('2-chlor-2,3-dimetilbutanas reaguoja su natrio hidrosulfidu etanolyje.', '2-chloro-2,3-dimethylbutane reacts with sodium hydrosulfide in ethanol.') }, { scheme: { items: [{ smi: 'CC(C)C(C)(C)Cl', name: t('2-chlor-2,3-dimetilbutanas', '2-chloro-2,3-dimethylbutane') }, { arrow: '→', above: f('NaSH'), below: f('C2H5OH') }, { smi: 'CC(C)C(C)(C)S' }] } }],
            steps: [
              cho(t('Pagal kokį mechanizmą susidaro tiolis?', 'By which mechanism does the thiol form?'), MECH4, 0,
                t('Pažiūrėkite, ar iš tokio halogenalkano gali susidaryti stabilus katijonas.', 'See whether a stable cation can form from such a halide.'),
                t('SN1: tretinis substratas jonizuojasi, o hidrosulfidas prisijungia prie karbokatijono.', 'SN1: the tertiary substrate ionises and hydrosulfide bonds to the carbocation.')),
              cho(t('Kodėl SN2 čia neįmanomas?', 'Why is SN2 not possible here?'), [
                tx('Tretinio atomo iš nugaros užstoja trys alkilgrupės.', 'Three alkyl groups shield the tertiary carbon from the back.'),
                tx('Hidrosulfidas yra pernelyg silpnas nukleofilas.', 'Hydrosulfide is far too weak a nucleophile.'),
                tx('Chloras yra bloga nueinančioji grupė.', 'Chlorine is a bad leaving group.'),
                tx('Vyksta tik reakcijos su anijonais, turinčiais deguonį.', 'Only reactions of oxygen-containing anions take place.')
              ], 0, t('Atsiminkite, kaip nukleofilas turi pulti SN2 metu.', 'Recall how the nucleophile must attack in SN2.'),
                t('Puolimas iš nugaros prie tretinio atomo užkertamas erdviškai.', 'Backside attack at a tertiary carbon is blocked sterically.'))
            ],
            why: t('Tretinis halogenalkanas su geru, bet silpnai baziniu nukleofilu protoniniame tirpiklyje reaguoja SN1 būdu: SN2 užstotas, o E2 reikia stiprios bazės. Pirma lėtai susidaro karbokatijonas, paskui greitai prisijungia $HS-$.',
              'A tertiary alkyl halide with a good but weakly basic nucleophile in a protic solvent reacts by SN1: SN2 is blocked and E2 needs a strong base. The carbocation forms slowly, then $HS-$ bonds quickly.'),
            src: 'L10 p4, p7, S5.8',
            claims: [{ carbon: ['CC(C)C(C)(C)Cl', 3, 3] }]
          }
        ]
      },
      /* ============================================================ u10.sn2 */
      {
        id: 'u10.sn2',
        title: t('SN2 produktai su įvairiais nukleofilais', 'SN2 products with various nucleophiles'),
        mirrors: ['S5.1'],
        gen(rng, ctx) {
          const { react, name } = ctx;
          let pick = null;
          for (let tries = 0; tries < 80 && !pick; tries++) {
            const g = ctx.pick(PRIM);
            const X = ctx.pick(['Cl', 'Br', 'I']);
            const nuKey = ctx.pick(Object.keys(NUC));
            if (nuKey === 'I' && X === 'I') continue;
            const nu = NUC[nuKey];
            const smi = g.p + X;
            const right = g.p + nu.frag;
            const res = react.run('sn2', [smi], { nu: nuKey });
            const majors = res.products.filter((p) => p.major);
            if (majors.length !== 1 || canon(ctx, majors[0].smi) !== canon(ctx, right)) continue;
            const wrongs = ctx.shuffle(g.iso.map((p) => p + nu.frag));
            const nR = g.p.replace(/[^C]/g, '').length;
            const nN = nu.frag.replace(/[^C]/g, '').length;
            if (nR >= 2 && (nuKey === 'OC' || nuKey === 'OCC' || nuKey === 'SC')) wrongs.unshift('C'.repeat(nR - 1) + nu.frag[0] + 'C'.repeat(nN + 1));
            if (nuKey === 'OH') wrongs.push('C'.repeat(nR - 1) + 'OC');
            if (nuKey === 'SH') wrongs.push('C'.repeat(nR - 1) + 'SC');
            if (nuKey === 'CN') wrongs.push(g.p + '[N+]#[C-]');
            const options = molOptions(ctx, [right], wrongs, 4);
            if (options.length < 3) continue;
            pick = { g, X, nuKey, nu, smi, right, options };
          }
          if (!pick) throw new Error('u10.sn2: no usable pair');
          const { g, nu, smi, right, nuKey, options } = pick;
          const alk = react.run('elim', [smi], { base: 'strong' }).products.find((p) => p.major);
          const ALL5 = ['OH', 'SH', 'CN', 'C#CC', 'OC'];
          const right5 = ALL5.map((k) => mo(g.p + NUC[k].frag));
          if (alk) right5.push(mo(alk.smi));
          const steps = [
            {
              prompt: t('Tą patį halogenalkaną veikiant pakaitomis penkiais reagentais, kokį produktą duoda kiekvienas?', 'If the same alkyl halide is treated in turn with five reagents, which product does each give?'),
              kind: 'match',
              answer: { left: ALL5.map((k) => ({ text: f(NUC[k].salt) })), right: right5, pairs: [0, 1, 2, 3, 4] },
              hint: t('Palyginkite, kuris nukleofilo atomas lieka prijungtas prie alkilo grupės.', 'Compare which atom of the nucleophile stays bonded to the alkyl group.'),
              solution: t('NaOH duoda alkoholį, NaSH – tiolį, NaCN – nitrilą, NaC≡CCH3 – alkiną, NaOCH3 – eterį. Alkenas būtų eliminavimo produktas, o ne pakeitimo.', 'NaOH gives an alcohol, NaSH a thiol, NaCN a nitrile, NaC≡CCH3 an alkyne and NaOCH3 an ether. The alkene would be an elimination product, not a substitution product.')
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options, answer: 0,
              hint: t('Pažiūrėkite, prie kurio anglies atomo buvo prisijungęs halogenas ir kas užima jo vietą.', 'See which carbon the halogen was bonded to and what takes its place.'),
              solution: [{ p: t('Halogenido jonas pakeičiamas nukleofilu tame pačiame anglies atome; susidaro ' + nu.cls.lt + '.', 'The halide ion is replaced by the nucleophile on the same carbon; a ' + nu.cls.en + ' forms.') }, { mol: { smi: right } }]
            },
            {
              prompt: t('Kuris mechanizmas čia veikia ir kuo tai pagrįsta?', 'Which mechanism operates here, and what supports it?'),
              kind: 'choice',
              options: [
                tx('SN2: pirminis substratas, nestabilus katijonas, o ' + nu.nm.lt + ' puola iš nugaros.', 'SN2: a primary substrate, an unstable cation, and ' + nu.nm.en + ' attacks from the back.'),
                tx('SN1: pirminis katijonas yra stabilus, todėl halogenas pirma atsiskiria.', 'SN1: a primary cation is stable, so the halogen leaves first.'),
                tx('E2: bet kuris anijonas pirmiausia atplėšia β protoną.', 'E2: any anion first removes a β proton.'),
                tx('SN1: ' + nu.nm.lt + ' greitina jonizaciją.', 'SN1: ' + nu.nm.en + ' speeds up ionisation.')
              ],
              answer: 0,
              hint: t('Palyginkite, ar iš pirminio halogenalkano galėtų susidaryti stabilus katijonas.', 'Consider whether a stable cation could form from a primary alkyl halide.'),
              solution: t('Pirminis karbokatijonas nestabilus, todėl SN1 nevyksta. Anglis atvira puolimui iš nugaros, tad vyksta viena stadija – SN2.', 'A primary carbocation is unstable, so SN1 does not take place. The carbon is open to backside attack, so one stage follows: SN2.')
            }
          ];
          const lt = name.name(right, { lang: 'lt' }), en = name.name(right, { lang: 'en' });
          if (lt && en) {
            steps.push({
              prompt: t('Pavadinkite produktą.', 'Name the product.'),
              kind: 'name', mol: { smi: right }, answer: { smi: right },
              hint: t('Raskite pagrindinę grandinę su pagrindine grupe ir sunumeruokite ją nuo galo, arčiausio pagrindinės grupės.', 'Find the parent chain with the principal group and number it from the nearest end.'),
              solution: t(lt.name, en.name)
            });
          }
          return {
            q: [{ p: t('Pirminis halogenalkanas reaguoja su nukleofilo druska.', 'A primary alkyl halide reacts with the salt of a nucleophile.') }, { scheme: { items: [{ smi }, { arrow: '→', above: f(nu.salt) }] } }],
            steps,
            why: t('Pirminis halogenalkanas su stipriu nukleofilu reaguoja SN2: nukleofilas puola anglį iš nugaros ir išstumia halogenido joną. Nukleofilo prigimtis lemia produkto klasę: alkoholis, tiolis, eteris, sulfidas, nitrilas ar alkinas.',
              'A primary alkyl halide reacts with a strong nucleophile by SN2: the nucleophile attacks the carbon from the back and pushes out the halide ion. The nature of the nucleophile decides the product class: alcohol, thiol, ether, sulfide, nitrile or alkyne.'),
            src: 'L10 p5, p12, p13, p14, S5.1',
            claims: [{ react: ['sn2', [smi], { nu: nuKey }, right] }]
          };
        }
      },
      /* ============================================================ u10.draw */
      {
        id: 'u10.draw',
        title: t('Reakcijų mechanizmai su lenktomis rodyklėmis', 'Reaction mechanisms with curved arrows'),
        mirrors: ['S5.8'],
        bank: [
          {
            id: 'u10.draw.1',
            q: [{ p: t('1-jodbutanas reaguoja su natrio etoksidu. Išanalizuokite mechanizmą.', '1-iodobutane reacts with sodium ethoxide. Analyse the mechanism.') },
              { scheme: { items: [{ smi: 'CCCCI', name: t('1-jodbutanas', '1-iodobutane'), opts: { numbers: 'all' } }, { plus: true }, { smi: 'CC[O-]' }, { arrow: '→' }, { smi: 'CCCCOCC' }, { plus: true }, { smi: '[I-]' }] } }],
            steps: [
              {
                prompt: t('Bakstelėkite ryšį, kuris nutrūksta reakcijos metu.', 'Tap the bond that breaks during the reaction.'),
                kind: 'atoms', bonds: true, mol: { smi: 'CCCCI', opts: { numbers: 'all' } }, answer: [[3, 4]],
                hint: t('Kuris ryšys jungia anglį su atomu, kuris išeis pasiimdamas ryšio elektronus?', 'Which bond joins carbon to the atom that will leave with the bonding electrons?'),
                solution: t('Nutrūksta C–I ryšys (atomai Nr. 4 ir Nr. 5): jodas išeina su ryšio elektronų pora.', 'The C–I bond (atoms no. 4 and no. 5) breaks: iodine leaves with the bonding electron pair.')
              },
              cho(t('Koks šios reakcijos mechanizmas?', 'What is the mechanism of this reaction?'), MECH4, 1,
                t('Pirminis halogenalkanas, stiprus nukleofilas.', 'A primary alkyl halide and a strong nucleophile.'),
                [{ p: t('SN2: viena stadija, nukleofilas puola iš nugaros, kartu išstumiamas jodidas.', 'SN2: one stage, the nucleophile attacks from the back and pushes out iodide at the same moment.') },
                  { mech: [{ scheme: { items: [{ smi: 'CC[O-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CCCCI', opts: { lonePairs: [4] } }] }, arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 3 } }, { from: { m: 1, b: [3, 4] }, to: { m: 1, a: 4 } }] }] }]),
              cho(t('Kaip pakistų reakcijos greitis, jei padvigubintume ir halogenalkano, ir etoksido koncentracijas?', 'How would the rate change if both the alkyl halide and ethoxide concentrations were doubled?'), [
                tx('Padidėtų keturis kartus', 'It would rise four times'),
                tx('Padidėtų du kartus', 'It would double'),
                tx('Nepakistų', 'It would not change'),
                tx('Sumažėtų per pusę', 'It would be halved')
              ], 0, t('Greičio lygtyje yra abu reagentai.', 'Both reagents appear in the rate law.'), t('Greitis = $k[RX][Nu]$: du kartus × du kartus = keturis kartus.', 'Rate = $k[RX][Nu]$: two times two is four times.'))
            ],
            why: t('SN2 – bimolekulinė vienos stadijos reakcija. Etoksido deguonies laisva pora sudaro naują ryšį su anglimi, o C–I elektronai pereina jodui. Greitis priklauso nuo abiejų reagentų.',
              'SN2 is a bimolecular one-stage reaction. A lone pair of ethoxide oxygen forms a new bond to carbon while the C–I electrons go to iodine. The rate depends on both reagents.'),
            src: 'L10 p5, S5.8',
            claims: [{ react: ['sn2', ['CCCCI'], { nu: 'OCC' }, 'CCCCOCC'] }]
          },
          {
            id: 'u10.draw.2',
            q: [{ p: t('2-chlor-2,3-dimetilbutanas reaguoja su natrio hidrosulfidu etanolyje ir susidaro tiolis. Išanalizuokite mechanizmą.', '2-chloro-2,3-dimethylbutane reacts with sodium hydrosulfide in ethanol and a thiol forms. Analyse the mechanism.') },
              { scheme: { items: [{ smi: 'CC(C)C(C)(C)Cl', name: t('2-chlor-2,3-dimetilbutanas', '2-chloro-2,3-dimethylbutane') }, { plus: true }, { smi: '[SH-]' }, { arrow: '→', below: f('C2H5OH') }, { smi: 'CC(C)C(C)(C)S' }, { plus: true }, { smi: '[Cl-]' }] } }],
            steps: [
              {
                prompt: t('Kuri mechanizmo stadija lėta ir kodėl?', 'Which stage of the mechanism is slow, and why?'),
                kind: 'choice',
                options: [
                  tx('I stadija – C–Cl ryšio skilimas: jis sudaro nestabilų karbokatijoną, todėl lėtas, o nukleofilo puolimas vyksta greitai.', 'Stage I, the C–Cl bond breaking: it forms an unstable carbocation, so it is slow, while the attack of the nucleophile is fast.'),
                  tx('II stadija – $HS-$ puolimas: dideli nukleofilai artėja lėtai.', 'Stage II, the attack of $HS-$: large nucleophiles approach slowly.'),
                  tx('Abi stadijos vienodai greitos, nes reakcija vienstadijė.', 'Both stages are equally fast because the reaction is a one-stage process.'),
                  tx('I stadija – $HS-$ atplėšia protoną, todėl reakcija lėta.', 'Stage I, $HS-$ removing a proton, so the reaction is slow.')
                ],
                answer: 0,
                hint: t('Kuri stadija reikalauja energijos jonams sudaryti?', 'Which stage needs energy to create ions?'),
                solution: [{ p: t('Pirmoji, lėtoji stadija – jonizacija; antroji, greitoji – nukleofilo prisijungimas.', 'The first, slow stage is ionisation; the second, fast stage is bonding of the nucleophile.') },
                  { mech: [
                    { scheme: { items: [{ smi: 'CC(C)C(C)(C)Cl', opts: { lonePairs: [6] } }] }, arrows: [{ from: { m: 0, b: [3, 6] }, to: { m: 0, a: 6 } }], note: t('I st.: C–Cl ryšys skyla.', 'Stage I: the C–Cl bond breaks.') },
                    { scheme: { items: [{ smi: '[SH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(C)[C+](C)C' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 3 } }], note: t('II st.: HS⁻ puola katijoną.', 'Stage II: HS⁻ attacks the cation.') }
                  ] }]
              },
              cho(t('Kuris mechanizmo simbolis tinka?', 'Which mechanism symbol fits?'), MECH4, 0,
                t('Pažiūrėkite, kiek stadijų turi reakcija.', 'See how many stages the reaction has.'),
                t('SN1: dvi stadijos, monomolekulinė lėtoji stadija.', 'SN1: two stages and a unimolecular slow stage.')),
              cho(t('Kuri išraiška aprašo greitį?', 'Which expression describes the rate?'), [tx('$v = k[RX]$','$v = k[RX]$'), tx('$v = k[RX][Nu]$','$v = k[RX][Nu]$'), tx('$v = k[Nu]$','$v = k[Nu]$'), tx('$v = k[RX][Nu]^2^$','$v = k[RX][Nu]^2^$')], 0,
                t('Greitį lemia lėtoji stadija.', 'The slow stage sets the rate.'), t('Lėtoji stadija – tik halogenalkano jonizacija, todėl nukleofilo koncentracija neįeina.', 'The slow stage is only the ionisation of the halide, so the nucleophile concentration does not appear.'))
            ],
            why: t('Tretinis halogenalkanas pirmiausia jonizuojasi į stabilų karbokatijoną; tik tada prisijungia nukleofilas. Pakeitimo greitį lemia tik halogenalkano koncentracija.',
              'A tertiary alkyl halide first ionises into a stable carbocation; only then does the nucleophile bond. The substitution rate depends only on the alkyl halide.'),
            src: 'L10 p4, S5.8',
            claims: [{ carbon: ['CC(C)C(C)(C)Cl', 3, 3] }]
          },
          {
            id: 'u10.draw.3',
            q: [{ p: t('2-brombutanas reaguoja su natrio etoksidu, ir susidaro alkenai.', '2-Bromobutane reacts with sodium ethoxide and alkenes form.') },
              { scheme: { items: [{ smi: 'CC(CC)Br', name: t('2-brombutanas', '2-bromobutane'), opts: { numbers: 'all' } }, { plus: true }, { smi: 'CC[O-]' }, { arrow: '→' }] } }],
            steps: [
              {
                prompt: t('Bakstelėkite anglies atomus, nuo kurių gali būti atplėštas protonas ($β$ atomai).', 'Tap the carbons from which a proton can be removed (the $β$ carbons).'),
                kind: 'atoms', mol: { smi: 'CC(CC)Br', opts: { numbers: 'all' } }, answer: [0, 2],
                hint: t('Ieškokite atomų, kurie yra šalia anglies su halogenu.', 'Look for the atoms that are next to the carbon with the halogen.'),
                solution: t('Halogenas prie atomo Nr. 2; jo kaimynai Nr. 1 ir Nr. 3 yra β atomai.', 'The halogen is on carbon no. 2; its neighbours no. 1 and no. 3 are the β carbons.')
              },
              cho(t('Nuo kurio β atomo vandenilis atskils dažniausiai?', 'From which β carbon will the hydrogen leave most often?'), [
                tx('Nuo atomo Nr. 3 ($CH2$): susidaro 2-butenas', 'From carbon no. 3 ($CH2$): but-2-ene forms'),
                tx('Nuo atomo Nr. 1 ($CH3$): susidaro 1-butenas', 'From carbon no. 1 ($CH3$): but-1-ene forms'),
                tx('Nuo abiejų lygiai po pusę', 'From both, half each'),
                tx('Nuo atomo Nr. 2, nes jis turi halogeną', 'From carbon no. 2, because it bears the halogen')
              ], 0, t('Prisiminkite Zaicevo taisyklę: kuris β atomas turi mažiau vandenilių?', 'Recall Zaitsev’s rule: which β carbon has fewer hydrogens?'),
                [{ p: t('Pagal Zaicevo taisyklę H atskyla nuo β atomo, turinčio mažiausiai vandenilių, ir susidaro labiau pakeistas alkenas.', 'By Zaitsev’s rule H leaves from the β carbon with the fewest hydrogens and the more substituted alkene forms.') },
                  { mech: [{ scheme: { items: [{ smi: 'CC[O-]', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CC(CC)Br', opts: { allH: true, lonePairs: [4] } }] },
                    arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 'H2' } }, { from: { m: 1, b: [2, 'H2'] }, to: { m: 1, mid: [1, 2] } }, { from: { m: 1, b: [1, 4] }, to: { m: 1, a: 4 } }],
                    note: t('E2: viena stadija.', 'E2: one stage.') }] }]),
              cho(t('Kuris mechanizmas vyksta?', 'Which mechanism takes place?'), MECH4, 3,
                t('Stipri bazė, antrinis halogenalkanas.', 'A strong base and a secondary alkyl halide.'),
                t('E2: bazė, protono atplėšimas, dvigubojo ryšio susidarymas ir bromido išėjimas vyksta vienu metu.', 'E2: removal of the proton, formation of the double bond and loss of bromide all happen at once.'))
            ],
            why: t('E2 yra vienos stadijos reakcija: stipri bazė atplėšia β protoną, tuo pat metu susidaro $C=C$ ir išeina nueinančioji grupė. Iš kelių galimų alkenų dominuoja pakeistiausias (Zaicevo taisyklė).',
              'E2 is a one-stage reaction: a strong base removes a β proton while the $C=C$ forms and the leaving group departs. Of several possible alkenes the most substituted dominates (Zaitsev’s rule).'),
            src: 'L10 p18, p19, p20',
            claims: [{ react: ['elim', ['CC(CC)Br'], { base: 'strong' }, 'CC=CC'] }]
          },
          {
            id: 'u10.draw.4',
            q: [{ p: t('2-chlor-2-metilbutanas tirpsta etanolyje, ir kartu su eteriu susidaro alkenas.', '2-chloro-2-methylbutane dissolves in ethanol, and an alkene forms along with the ether.') },
              { scheme: { items: [{ smi: 'CC(C)(Cl)CC', name: t('2-chlor-2-metilbutanas', '2-chloro-2-methylbutane') }, { arrow: '→', above: f('C2H5OH') }, { smi: 'CCC(C)(C)OCC' }] } }],
            steps: [
              {
                prompt: t('Kuri E1 stadija lėta ir kodėl?', 'Which E1 stage is slow, and why?'),
                kind: 'choice',
                options: [
                  tx('I stadija – jonizacija: C–Cl ryšys nutrūksta ir susidaro karbokatijonas, todėl ji lėta, o protono atplėšimas vyksta greitai.', 'Stage I, ionisation: the C–Cl bond breaks and a carbocation forms, so it is slow, while removal of the proton is fast.'),
                  tx('II stadija – protono atplėšimas: silpna bazė atplėšia protoną lėtai.', 'Stage II, removal of the proton: a weak base removes the proton slowly.'),
                  tx('Abi stadijos vienodai greitos.', 'Both stages are equally fast.'),
                  tx('I stadija – etanolis atplėšia protoną, o chloridas išeina vėliau.', 'Stage I, ethanol removes the proton and chloride leaves later.')
                ],
                answer: 0,
                hint: t('Pirma stadija ta pati kaip SN1: kas joje nutinka su ryšiu?', 'The first stage is the same as in SN1: what happens to the bond in it?'),
                solution: t('I st.: jonizacija; II st.: bazė (etanolis) atplėšia $H+$ nuo gretimo atomo, ir elektronų pora sudaro $C=C$.', 'Stage I: ionisation; stage II: the base (ethanol) removes $H+$ from a neighbouring carbon and the electron pair forms the $C=C$.')
              },
              cho(t('Kuris alkenas dominuos?', 'Which alkene will dominate?'), [
                mo('CC=C(C)C'), mo('CCC(C)=C'), mo('CC(C)C=C'), mo('CCCC=C')
              ], 0, t('Ieškokite alkeno su daugiausia alkilgrupių prie $C=C$.', 'Look for the alkene with the most alkyl groups on the $C=C$.'),
                t('Trijų alkilgrupių alkenas – 2-metil-2-butenas – pagal Zaicevo taisyklę dominuoja.', 'The alkene with three alkyl groups, 2-methylbut-2-ene, dominates by Zaitsev’s rule.')),
              cho(t('Kuris mechanizmas atsakingas už alkeną?', 'Which mechanism is responsible for the alkene?'), MECH4, 2,
                t('Silpnas nukleofilas ir bazė, tretinis substratas.', 'A weak nucleophile and base, a tertiary substrate.'),
                t('E1: dvi stadijos, per karbokatijoną; vyksta kartu su SN1.', 'E1: two stages through a carbocation; it takes place alongside SN1.'))
            ],
            why: t('SN1 ir E1 turi bendrą lėtąją stadiją. Karbokatijonas arba prisijungia nukleofilą (SN1), arba atiduoda protoną (E1). Alkeno dalis didėja didėjant temperatūrai.',
              'SN1 and E1 share the slow stage. The carbocation either bonds a nucleophile (SN1) or loses a proton (E1). The share of alkene increases with temperature.'),
            src: 'L10 p19, p22',
            claims: [{ react: ['elim', ['CC(C)(Cl)CC'], {}, 'CC=C(C)C'] }]
          },
          {
            id: 'u10.draw.5',
            q: [{ p: t('Tiriant 2-brom-2-metilpropano reakciją su vandeniu nustatyta: padvigubinus halogenalkano koncentraciją, greitis padvigubėja, o padvigubinus hidroksido koncentraciją, nepasikeičia.', 'In a study of 2-bromo-2-methylpropane with water, doubling the alkyl halide concentration doubles the rate, while doubling the hydroxide concentration leaves it unchanged.') }],
            steps: [
              { prompt: t('Kurie mechanizmai atitinka šiuos duomenis?', 'Which mechanisms fit these data?'), kind: 'multi', options: MECH4, answer: [0, 2],
                hint: t('Kokie reagentai įeina į lėtąją stadiją?', 'Which reagents take part in the slow stage?'),
                solution: t('SN1 ir E1: abiejų lėtoji stadija – tik halogenalkano jonizacija, todėl greitis = $k[RX]$. SN2 ir E2 greitis priklausytų ir nuo nukleofilo (bazės) koncentracijos.', 'SN1 and E1: in both the slow stage is the ionisation of the alkyl halide alone, so rate = $k[RX]$. The SN2 and E2 rates would also depend on the nucleophile (base) concentration.') },
              cho(t('Kuris tarpinis junginys susidaro?', 'Which intermediate forms?'), [mo('C[C+](C)C'), mo('CC(C)(C)O'), mo('CC(C)[CH2+]'), mo('[CH3+]')], 0,
                t('Tretinis halogenalkanas praranda halogenido joną.', 'A tertiary alkyl halide loses the halide ion.'),
                t('Susidaro stabiliausias – tretinis – katijonas (iš 2-brom-2-metilpropano susidaro $(CH3)3C+$).', 'The most stable, tertiary, cation forms (here from 2-bromo-2-methylpropane, $(CH3)3C+$).'))
            ],
            why: t('Greičio lygtis rodo, kokios dalelės dalyvauja lėtoje stadijoje. Jei nukleofilo koncentracija neįeina, jis prisijungia vėliau, jau po karbokatijono susidarymo.',
              'The rate law shows which particles take part in the slow stage. If the nucleophile concentration does not appear, it bonds later, after the carbocation has formed.'),
            src: 'L10 p4',
            claims: [{ formula: ['C[C+](C)C', 'C4H9+'] }]
          },
          {
            id: 'u10.draw.6',
            q: [{ p: t('(S)-2-brombutanas reaguoja su natrio hidrosulfidu aprotoniniame tirpiklyje. Reakcijos greitis proporcingas ir halogenalkano, ir hidrosulfido koncentracijoms.', '(S)-2-bromobutane reacts with sodium hydrosulfide in an aprotic solvent. The rate is proportional to both the concentration of the halide and that of hydrosulfide.') },
              { mol: { smi: 'CC[C@H](C)Br', caption: t('(S)', '(S)') } }],
            steps: [
              cho(t('Koks mechanizmas?', 'Which mechanism?'), MECH4, 1,
                t('Greičio lygtyje yra abu reagentai.', 'Both reagents appear in the rate law.'),
                t('SN2: bimolekulinė vienos stadijos reakcija.', 'SN2: a bimolecular one-stage reaction.')),
              cho(t('Kokia stereocheminė baigtis?', 'What is the stereochemical outcome?'), [
                tx('Konfigūracijos inversija: susidaro (R)-2-butantiolis.', 'Inversion of configuration: (R)-butane-2-thiol forms.'),
                tx('Konfigūracija išlieka: susidaro (S)-2-butantiolis.', 'The configuration is retained: (S)-butane-2-thiol forms.'),
                tx('Racematas: lygiai po pusę (R) ir (S).', 'A racemate: half (R) and half (S).'),
                tx('Susidaro achiralinis produktas.', 'An achiral product forms.')
              ], 0, t('Kaip nukleofilas artėja prie anglies?', 'How does the nucleophile approach the carbon?'),
                t('Puolimas iš nugaros apverčia konfigūraciją; šiuo atveju CIP prioritetai nesikeičia, todėl S virsta R.', 'Backside attack inverts the configuration; here the CIP priorities do not change, so S becomes R.'))
            ],
            why: t('Bimolekulinė vienos stadijos reakcija reiškia SN2, o SN2 visada apverčia stereocentro konfigūraciją. Racematas būdingas SN1, kai tarpinis karbokatijonas plokščias.',
              'A bimolecular one-stage reaction means SN2, and SN2 always inverts the configuration of a stereocentre. A racemate is typical of SN1, where the intermediate carbocation is flat.'),
            src: 'L10 p5, p6',
            claims: [{ cip: ['CC[C@H](C)Br', 2, 'S'] }, { cip: ['CC[C@@H](C)S', 2, 'R'] }]
          },
          {
            id: 'u10.draw.7',
            q: [{ p: t('Natrio benzentiolatas reaguoja su jodmetanu.', 'Sodium benzenethiolate reacts with iodomethane.') },
              { scheme: { items: [{ smi: '[S-]c1ccccc1' }, { plus: true }, { smi: 'CI', name: t('jodmetanas', 'iodomethane') }, { arrow: '→' }, { smi: 'CSc1ccccc1' }, { plus: true }, { smi: '[I-]' }] } }],
            steps: [
              {
                prompt: t('Priskirkite reagentams jų vaidmenį.', 'Assign each reagent its role.'),
                kind: 'match',
                answer: { left: [mo('[S-]c1ccccc1'), mo('CI')], right: [tx('nukleofilas', 'nucleophile'), tx('elektrofilas (substratas)', 'electrophile (substrate)')], pairs: [0, 1] },
                hint: t('Kuris reagentas turi neigiamą krūvį ir laisvų elektronų porų, o kuris – dalinį teigiamą krūvį ant anglies?', 'Which reagent has a negative charge and lone pairs, and which has a partial positive charge on carbon?'),
                solution: t('Tiolatas (S⁻) dovanoja elektronų porą, todėl yra nukleofilas; jodmetano anglis turi δ+, todėl jis – elektrofilas.', 'The thiolate (S⁻) donates an electron pair, so it is the nucleophile; the carbon of iodomethane is δ+, so it is the electrophile.')
              },
              cho(t('Kuris mechanizmas?', 'Which mechanism?'), MECH4, 1,
                t('Metilo halogenidas.', 'A methyl halide.'),
                [{ p: t('SN2: metilo katijonas nestabilus, o anglis neužstota, todėl nukleofilas puola iš nugaros.', 'SN2: a methyl cation is unstable and the carbon is unshielded, so the nucleophile attacks from the back.') },
                  { mech: [{ scheme: { items: [{ smi: '[S-]c1ccccc1', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'CI', opts: { lonePairs: [1] } }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }] }]),
              cho(t('Kodėl jodmetanas gerai tinka metilinimui?', 'Why is iodomethane a good methylating reagent?'), [
                tx('Jodidas yra gera nueinančioji grupė, o metilo anglis neužstota.', 'Iodide is a good leaving group and the methyl carbon is unshielded.'),
                tx('Jodmetanas sudaro stabilų karbokatijoną.', 'Iodomethane forms a stable carbocation.'),
                tx('Jodas yra stipri bazė.', 'Iodine is a strong base.'),
                tx('Jodmetanas yra nukleofilas.', 'Iodomethane is a nucleophile.')
              ], 0, t('Kokios dvi savybės reikalingos SN2?', 'Which two properties does SN2 need?'),
                t('RI yra labiausiai reaktyvus iš RHal, o metilo grupė mažiausiai užstota.', 'RI is the most reactive of the RHal and the methyl group is the least shielded.'))
            ],
            why: t('Metilinimas – tipiška SN2 reakcija. Gyvuose organizmuose tą patį daro S-adenozilmetioninas: nukleofilas puola metilgrupę, o sulfonio siera išeina kaip nueinančioji grupė.',
              'Methylation is a typical SN2 reaction. In living organisms S-adenosylmethionine does the same: a nucleophile attacks the methyl group and the sulfonium sulfur leaves as the leaving group.'),
            src: 'L10 p13, p15, p16',
            claims: [{ name: ['CSc1ccccc1', t('metiltiobenzenas', '(methylsulfanyl)benzene')] }]
          },
          {
            id: 'u10.draw.8',
            q: [{ p: t('Fermento halogenalkanų dehalogenazės aktyvioje vietoje yra karboksilato grupė. Ji reaguoja su 1,2-dichloretanu ir pakeičia vieną chlorą. Karboksilatas modeliuojamas acetatu.', 'In the active site of the enzyme haloalkane dehalogenase there is a carboxylate group. It reacts with 1,2-dichloroethane and replaces one chlorine. The carboxylate is modelled by acetate.') },
              { scheme: { items: [{ smi: 'CC(=O)[O-]' }, { plus: true }, { smi: 'ClCCCl', name: t('1,2-dichloretanas', '1,2-dichloroethane') }, { arrow: '→' }, { smi: 'CC(=O)OCCCl' }, { plus: true }, { smi: '[Cl-]' }] } }],
            steps: [
              {
                prompt: t('Priskirkite reagentams jų vaidmenį.', 'Assign each reagent its role.'),
                kind: 'match',
                answer: { left: [mo('CC(=O)[O-]'), mo('ClCCCl')], right: [tx('nukleofilas', 'nucleophile'), tx('elektrofilas (substratas)', 'electrophile (substrate)')], pairs: [0, 1] },
                hint: t('Kuris reagentas turi neigiamą krūvį, o kuris – anglį, sujungtą su elektroneigiamu chloru?', 'Which reagent carries the negative charge, and which has a carbon bonded to electronegative chlorine?'),
                solution: t('Karboksilato deguonis turi neigiamą krūvį ir laisvų porų – tai nukleofilas; dichloretano anglis turi δ+, todėl tai elektrofilas.', 'The carboxylate oxygen carries the negative charge and lone pairs, so it is the nucleophile; the carbon of dichloroethane is δ+, so it is the electrophile.')
              },
              cho(t('Pagal kokį mechanizmą deguonis pakeičia chlorą?', 'By which mechanism does oxygen replace chlorine?'), MECH4, 1,
                t('Pirminis halogenalkanas, anijonas kaip nukleofilas.', 'A primary alkyl halide and an anion as the nucleophile.'),
                [{ p: t('SN2: karboksilato deguonis puola pirminę anglį iš nugaros.', 'SN2: the carboxylate oxygen attacks the primary carbon from the back.') },
                  { mech: [{ scheme: { items: [{ smi: 'CC(=O)[O-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'ClCCCl', opts: { lonePairs: [0] } }] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 } }] }] }]),
              cho(t('Kuris produktas susidaro pirmojoje stadijoje?', 'Which product forms in the first step?'), [mo('CC(=O)OCCCl'), mo('CC(=O)OCCOC(C)=O'), mo('OCCCl'), mo('C=CCl')], 0,
                t('Pakeičiamas tik vienas chloras.', 'Only one chlorine is replaced.'),
                t('Susidaro esteris su likusiu $CH2Cl$ galu; paskui jis hidrolizuojasi į 2-chloretanolį ir atkuria fermentą.', 'An ester with the remaining $CH2Cl$ end forms; it is then hydrolysed to 2-chloroethanol and the enzyme is regenerated.'))
            ],
            why: t('Gyvose ląstelėse nuodingi halogenalkanai detoksikuojami SN2 reakcija, kurioje fermento nukleofilas pakeičia halogeną. Taigi gyvas organizmas taiko tuos pačius SN2 principus kaip ir reakcijų kolba.',
              'In living cells toxic alkyl halides are detoxified by an SN2 reaction in which a nucleophile of the enzyme replaces the halogen. The organism uses the same principles as the flask.'),
            src: 'L10 p17',
            claims: [{ name: ['ClCCCl', t('1,2-dichloretanas', '1,2-dichloroethane')] }]
          },
          {
            id: 'u10.draw.9',
            q: [{ p: t('Apie SN2 reakciją pateikti teiginiai.', 'Statements about the SN2 reaction are listed.') }],
            steps: [{
              prompt: t('Pažymėkite visus teisingus teiginius.', 'Pick every true statement.'),
              kind: 'multi',
              options: [
                tx('Reakcija vyksta viena stadija.', 'The reaction takes place in one stage.'),
                tx('Nukleofilas puola iš pusės, priešingos nueinančiajai grupei.', 'The nucleophile attacks from the side opposite the leaving group.'),
                tx('Greitis priklauso ir nuo nukleofilo, ir nuo halogenalkano koncentracijos.', 'The rate depends on the concentration of both the nucleophile and the alkyl halide.'),
                tx('Susidaro stabilus karbokatijonas.', 'A stable carbocation forms.'),
                tx('Iš chiralinio substrato susidaro racematas.', 'A chiral substrate gives a racemate.'),
                tx('Reakciją skatina poliniai protoniniai tirpikliai.', 'Polar protic solvents favour the reaction.')
              ],
              answer: [0, 1, 2],
              hint: t('Prisiminkite lentelę: SN2 yra bimolekulinė vienos stadijos reakcija.', 'Recall the comparison: SN2 is a bimolecular one-stage reaction.'),
              solution: t('Teisingi pirmieji trys. Karbokatijonas ir racematas – SN1 požymiai, o protoniniai tirpikliai skatina SN1.', 'The first three are true. A carbocation and a racemate belong to SN1, and protic solvents favour SN1.')
            }],
            why: t('SN2 požymiai: viena stadija, puolimas iš nugaros, konfigūracijos inversija, greitis $k[RX][Nu]$. SN1 požymiai: dvi stadijos, karbokatijonas, racematas, greitis $k[RX]$.',
              'Features of SN2: one stage, backside attack, inversion of configuration, rate $k[RX][Nu]$. Features of SN1: two stages, a carbocation, a racemate, rate $k[RX]$.'),
            src: 'L10 p4, p5, p6, p10'
          }
        ]
      },
      /* ============================================================ u10.sn1 */
      {
        id: 'u10.sn1',
        title: t('SN1: karbokatijonas ir produktas', 'SN1: the carbocation and the product'),
        mirrors: ['S5.8', 'S5.11'],
        gen(rng, ctx) {
          const { react, name, chem } = ctx;
          const TPL = {
            tertiary: ['CC(C)(C)X', 'CCC(C)(C)X', 'CC(C)(X)CC', 'CCC(C)(X)CC', 'CCCC(C)(C)X', 'XC1(C)CCCCC1', 'XC1(C)CCCC1', 'CC(C)(X)CCC', 'CCC(C)(X)CCC', 'CC(C)C(C)(C)X'],
            benzylic: ['XCc1ccccc1', 'CC(X)c1ccccc1', 'CC(C)(X)c1ccccc1', 'CCC(X)c1ccccc1', 'XCc1ccc(C)cc1', 'CC(X)c1ccc(C)cc1'],
            allylic: ['C=CCX', 'CC=CCX', 'C=CC(C)X', 'CC(C)=CCX', 'CC=CC(C)X', 'C=CC(X)CC', 'CCC=CCX', 'CC(C)=CC(C)X', 'C=CC(C)(C)X']
          };
          const NU = {
            OH: { frag: 'O', lt: 'vanduo', loc: 'vandenyje', en: 'water', f: 'H2O', cls: t('alkoholis', 'alcohol') },
            OC: { frag: 'OC', lt: 'metanolis', loc: 'metanolyje', en: 'methanol', f: 'CH3OH', cls: t('eteris', 'ether') },
            OCC: { frag: 'OCC', lt: 'etanolis', loc: 'etanolyje', en: 'ethanol', f: 'C2H5OH', cls: t('eteris', 'ether') }
          };
          const CAT = { tertiary: t('tretinis karbokatijonas', 'tertiary carbocation'), benzylic: t('benzilkatijonas', 'benzylic carbocation'), allylic: t('alilkatijonas', 'allylic carbocation') };
          let pick = null;
          for (let tries = 0; tries < 80 && !pick; tries++) {
            const key = ctx.pick(Object.keys(TPL));
            const smi = putHalogen(ctx.pick(TPL[key]), ctx.pick(['Cl', 'Br', 'I']));
            const nuKey = ctx.pick(Object.keys(NU));
            if (react.wouldRearrange(smi)) continue;
            const res = react.run('sn1', [smi], { nu: nuKey });
            if (res.none) continue;
            const majors = res.products.filter((p) => p.major).map((p) => p.smi);
            if (!majors.length || majors.length > 2 || (key !== 'allylic' && majors.length !== 1)) continue;
            const frag0 = NU[nuKey].frag;
            const alk = dehalo(ctx, smi).alkane;
            const prodOpts = molOptions(ctx, majors, otherPositions(ctx, smi, frag0).concat(chainIsomers(alk, frag0)), 4);
            if (prodOpts.length < majors.length + 2) continue;
            pick = { key, smi, nuKey, majors, prodOpts };
          }
          if (!pick) throw new Error('u10.sn1: no usable substrate');
          const { key, smi, nuKey, majors, prodOpts } = pick;
          const nu = NU[nuKey];
          const s = site(ctx, smi);
          const m = s.m;
          let ends = [s.c];
          if (key === 'allylic') {
            const w = cNb(m, s.c).find((j) => ordOf(m, s.c, j) === 1 && !m.atoms[j].aromatic && cNb(m, j).some((u) => ordOf(m, j, u) === 2));
            const u = cNb(m, w).find((q) => ordOf(m, w, q) === 2);
            ends = [s.c, u].sort((a, b) => a - b);
          }
          const cation = cationOf(ctx, smi);
          const shifted = shiftedCations(ctx, smi);
          const catOpts = [mo(cation)];
          const seenCat = new Set([canon(ctx, cation)]);
          shifted.forEach((x) => { const k = canon(ctx, x); if (catOpts.length < 3 && !seenCat.has(k)) { seenCat.add(k); catOpts.push(mo(x)); } });
          catOpts.push(tx('Karbokatijonas nesusidaro: nukleofilas puola ir halogenas išeina vienu metu.', 'No carbocation forms: the nucleophile attacks and the halogen leaves at the same moment.'));
          const tie = majors.length === 2;
          const steps = [
            {
              prompt: key === 'allylic'
                ? t('Bakstelėkite anglies atomus, tarp kurių pasidalija teigiamas krūvis tarpiniame katijone.', 'Tap the carbons that share the positive charge in the intermediate cation.')
                : t('Bakstelėkite anglies atomą, kuris taps teigiamas tarpiniame katijone.', 'Tap the carbon that becomes positive in the intermediate cation.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: ends,
              hint: key === 'allylic' ? t('Pažiūrėkite, su kuo konjuguotas katijono centras.', 'See what the cationic centre is conjugated with.') : t('Kuris atomas lieka be ryšio elektronų, kai halogenas išeina su jais?', 'Which atom is left without the bonding electrons when the halogen leaves with them?'),
              solution: key === 'allylic'
                ? t('Katijonas alilo tipo: krūvis delokalizuotas tarp atomų Nr. ' + (ends[0] + 1) + ' ir Nr. ' + (ends[1] + 1) + '.', 'The cation is allylic: the charge is delocalised over carbons no. ' + (ends[0] + 1) + ' and no. ' + (ends[1] + 1) + '.')
                : t('Po halogeno atskilimo teigiamas krūvis lieka ant atomo Nr. ' + (s.c + 1) + ': ' + CAT[key].lt + '.', 'After the halogen leaves, the positive charge stays on carbon no. ' + (s.c + 1) + ': a ' + CAT[key].en + '.')
            },
            {
              prompt: t('Kuris tarpinis junginys susidaro lėtojoje stadijoje?', 'Which intermediate forms in the slow stage?'),
              kind: 'choice', options: catOpts, answer: 0,
              hint: t('Halogenalkanas atiduoda tik halogenido joną; kitų atomų jungtys nesikeičia.', 'The alkyl halide gives up the halide ion and nothing else; no atom moves.'),
              solution: [{ p: t('Jonizacijos metu išeina tik halogenido jonas, todėl teigiamas krūvis lieka ant ' + (key === 'allylic' ? 'alilo sistemos' : 'atomo Nr. ' + (s.c + 1)) + '. Rezonansas ar hiperkonjugacija jį stabilizuoja.', 'Only the halide ion leaves in ionisation, so the positive charge stays on ' + (key === 'allylic' ? 'the allylic system' : 'carbon no. ' + (s.c + 1)) + '. Resonance or hyperconjugation stabilises it.') }, { mol: { smi: cation } }]
            },
            tie ? {
              prompt: t('Pažymėkite visus produktus, kurie susidaro panašiu kiekiu.', 'Pick every product that forms in comparable amounts.'),
              kind: 'multi', options: prodOpts, answer: majors.map((_, i) => i),
              hint: t('Nukleofilas gali prisijungti prie bet kurio katijono galo, kuris turi dalį teigiamo krūvio.', 'The nucleophile can bond at either end of the cation that carries part of the positive charge.'),
              solution: [{ p: t('Teigiamas krūvis dalijasi tarp dviejų galų, todėl vanduo ar alkoholis prisijungia prie abiejų ir susidaro du produktai.', 'The positive charge is shared between two ends, so water or alcohol bonds at both and two products form.') }].concat(majors.map((x) => ({ mol: { smi: x } })))
            } : {
              prompt: t('Koks yra pagrindinis pakeitimo produktas?', 'What is the main substitution product?'),
              kind: 'choice', options: prodOpts, answer: 0,
              hint: t('Nukleofilas prisijungia ten, kur buvo teigiamas krūvis.', 'The nucleophile bonds where the positive charge was.'),
              solution: [{ p: t(nu.lt[0].toUpperCase() + nu.lt.slice(1) + ' prisijungia prie karbokatijono, o oksonio jonas atiduoda protoną tirpikliui. Susidaro ' + nu.cls.lt + '.', 'The ' + nu.en + ' bonds to the carbocation and the oxonium ion gives a proton to the solvent. A' + (nu.cls.en === 'alcohol' ? 'n alcohol' : 'n ether') + ' forms.') }, { mol: { smi: majors[0] } }]
            }
          ];
          if (rng() < 0.5) {
            steps.push({
              prompt: t('Kuris teiginys apie šios reakcijos greitį teisingas?', 'Which statement about the rate of this reaction is right?'),
              kind: 'choice',
              options: [
                tx('Greitį lemia vien halogenalkano koncentracija.', 'The rate is set by the concentration of the alkyl halide alone.'),
                tx('Greitis priklauso nuo halogenalkano ir nukleofilo koncentracijų.', 'The rate depends on the concentrations of the alkyl halide and the nucleophile.'),
                tx('Greitis priklauso tik nuo nukleofilo koncentracijos.', 'The rate depends only on the concentration of the nucleophile.'),
                tx('Greitis nepriklauso nei nuo vieno reagento.', 'The rate depends on neither reagent.')
              ],
              answer: 0,
              hint: t('Kuri stadija lėta?', 'Which stage is slow?'),
              solution: t('Lėtoji stadija yra jonizacija, kurioje nukleofilas nedalyvauja, todėl greitis = $k[RX]$.', 'The slow stage is ionisation, in which the nucleophile takes no part, so rate = $k[RX]$.')
            });
          }
          const lt = !tie && name.name(majors[0], { lang: 'lt' }), en = !tie && name.name(majors[0], { lang: 'en' });
          if (lt && en) {
            steps.push({
              prompt: t('Pavadinkite pagrindinį produktą.', 'Name the main product.'),
              kind: 'name', mol: { smi: majors[0] }, answer: { smi: majors[0] },
              hint: t('Raskite pagrindinę grandinę ar žiedą su pagrindine grupe ir sunumeruokite taip, kad ji gautų mažiausią numerį.', 'Find the parent chain or ring with the principal group and number it so that the group gets the lowest locant.'),
              solution: t(lt.name, en.name)
            });
          }
          return {
            q: [{ p: t('Halogenalkanas tirpinamas ' + nu.loc + '.', 'An alkyl halide is dissolved in ' + nu.en + '.') }, { scheme: { items: [{ smi }, { arrow: '→', above: f(nu.f) }] } }],
            steps,
            why: key === 'allylic'
              ? t('Alilo halogenidas jonizuojasi lengvai, nes alilkatijono krūvis delokalizuotas per $C=C$. Silpnas nukleofilas gali prisijungti prie abiejų galų, todėl dažnai susidaro du izomeriniai produktai.', 'An allylic halide ionises easily because the charge of the allyl cation is delocalised over the $C=C$. A weak nucleophile can bond at both ends, so two isomeric products often form.')
              : t('SN1 prasideda lėta jonizacija į stabilų karbokatijoną (tretinį ar benzilo). Silpnas nukleofilas (vanduo, alkoholis) prisijungia greitai, o protoną atiduoda tirpikliui.', 'SN1 starts with slow ionisation to a stable carbocation (tertiary or benzylic). A weak nucleophile (water, alcohol) bonds quickly and the proton goes to the solvent.'),
            src: 'L10 p4, p7, p8, S5.11',
            claims: majors.map((x) => ({ react: ['sn1', [smi], { nu: nuKey }, x] }))
          };
        }
      },
      /* ============================================================ u10.stereo */
      {
        id: 'u10.stereo',
        title: t('Stereochemija: inversija ar racematas', 'Stereochemistry: inversion or racemate'),
        mirrors: [],
        gen(rng, ctx) {
          for (let i = 0; i < 60; i++) { const p = attempt(rng, ctx); if (p) return p; }
          throw new Error('u10.stereo: no usable case');
          function attempt(rng, ctx) {
          const { chem, stereo, react } = ctx;
          const flip = (s) => s.replace(/@@?/g, (q) => (q === '@@' ? '@' : '@@'));
          const sn2Branch = ctx.pick([true, false]);
          const X = ctx.pick(['Cl', 'Br', 'I']);
          const mirror = ctx.pick([true, false]);
          if (sn2Branch) {
            const TPL = ['CC[C@H](C)X', 'CCC[C@H](C)X', 'CCCC[C@H](C)X', 'CCCCC[C@H](C)X', 'CCCCCC[C@H](C)X', 'CCC[C@H](CC)X', 'CCCC[C@H](CC)X', 'CCCC[C@H](CCC)X'];
            let tpl = ctx.pick(TPL);
            if (mirror) tpl = flip(tpl);
            const nuKey = ctx.pick(['SH', 'CN', 'SC']);
            if (nuKey === 'I' && X === 'I') return null; //(' skip');
            const nu = NUC[nuKey];
            const sub = putHalogen(tpl, X);
            const base = sub.slice(0, sub.length - X.length);
            const inv = flip(base) + nu.frag, ret = base + nu.frag;
            const plain = sub.replace(/@/g, '');
            const res = react.run('sn2', [plain], { nu: nuKey });
            const maj = res.products.filter((p) => p.major);
            if (maj.length !== 1 || canon(ctx, maj[0].smi) !== canon(ctx, plain.slice(0, plain.length - X.length) + nu.frag)) return null; //(' engine disagrees');
            const centre = stereo.stereocentres(chem.parse(sub));
            if (centre.length !== 1) return null; //(' one centre expected');
            const idx = centre[0];
            const cS = stereo.cip(chem.parse(sub), idx), cI = stereo.cip(chem.parse(inv), idx), cR = stereo.cip(chem.parse(ret), idx);
            if (!cS || !cI || cI === cS || cR !== cS) return null; //(' descriptors do not behave');
            const desc = (c) => '(' + c + ')';
            const steps = [
              cho(t('Kuris mechanizmas vyrauja?', 'Which mechanism predominates?'), MECH4, 1,
                t('Kokį kelią lemia substrato klasė, nukleofilo stiprumas ir tirpiklio tipas?', 'Which path is decided by the class of the substrate, the strength of the nucleophile and the type of solvent?'),
                t('SN2: stiprus, silpnai bazinis nukleofilas poliniame aprotoniniame tirpiklyje puola iš nugaros.', 'SN2: a strong, weakly basic nucleophile in a polar aprotic solvent attacks from the back.')),
              {
                prompt: t('Kuris produktas susidaro?', 'Which product forms?'),
                kind: 'choice', options: [mo(inv), mo(ret), tx('Racematas: lygiai po pusę abiejų enantiomerų', 'A racemate: equal amounts of both enantiomers')], answer: 0,
                hint: t('Iš kurios pusės puola nukleofilas, palyginti su nueinančiąja grupe?', 'From which side does the nucleophile attack, relative to the leaving group?'),
                solution: t('Puolimas iš nugaros apverčia stereocentro konfigūraciją (inversija); kitos trys grupės lieka savo vietose, tik atsilenkia.', 'Backside attack inverts the configuration of the stereocentre (inversion); the other three groups stay where they are and only flip over.')
              },
              {
                prompt: t('Kokia produkto konfigūracija pagal CIP taisykles?', 'What is the configuration of the product by the CIP rules?'),
                kind: 'choice', options: [tx(desc('R'), desc('R')), tx(desc('S'), desc('S')), tx('(R,S): racematas', '(R,S): a racemate')], answer: cI === 'R' ? 0 : 1,
                hint: t('Palyginkite nukleofilo ir halogeno vietą prioritetų eilėje.', 'Compare the place of the nucleophile and of the halogen in the priority order.'),
                solution: t('Substratas ' + desc(cS) + '. Nukleofilas prioritetų eilėje užima tą pačią vietą kaip halogenas, todėl žymuo pasikeičia: produktas ' + desc(cI) + '.', 'The substrate is ' + desc(cS) + '. The nucleophile takes the same place in the priority order as the halogen, so the label changes: the product is ' + desc(cI) + '.')
              }
            ];
            return {
              q: [{ p: t('Chiralinis halogenalkanas, kurio konfigūracija ' + desc(cS) + ', reaguoja su stipriu nukleofilu poliniame aprotoniniame tirpiklyje.', 'A chiral alkyl halide of configuration ' + desc(cS) + ' reacts with a strong nucleophile in a polar aprotic solvent.') },
                { scheme: { items: [{ smi: sub, caption: t(desc(cS), desc(cS)) }, { arrow: '→', above: f(nu.salt), below: f('(CH3)2SO') }] } }],
              steps,
              why: t('SN2 vyksta puolant iš nugaros, todėl stereocentras visada apsiverčia. Ar pasikeičia žymuo R/S, lemia CIP prioritetai: čia nukleofilas ir halogenas yra aukščiausio prioriteto, todėl žymuo pasikeičia. Racematas būtų SN1 požymis.', 'SN2 takes place by backside attack, so the stereocentre is always inverted. Whether the label R/S changes depends on the CIP priorities: here the nucleophile and the halogen both rank highest, so the label changes. A racemate would indicate SN1.'),
              src: 'L10 p6',
              claims: [{ cip: [sub, idx, cS] }, { cip: [inv, idx, cI] }, { react: ['sn2', [plain], { nu: nuKey }, plain.slice(0, plain.length - X.length) + nu.frag] }]
            };
          }
          // SN1 branch: a chiral tertiary or benzylic halide in water or an alcohol
          const TPL1 = ['CCC[C@](C)(X)CC', 'CCCC[C@](C)(X)CC', 'CC[C@](C)(X)CCCC', 'CC[C@](C)(X)C(C)C', 'CC[C@](C)(X)c1ccccc1', 'C[C@H](X)c1ccccc1', 'CC[C@H](X)c1ccccc1'];
          let tpl1 = ctx.pick(TPL1);
          if (mirror) tpl1 = flip(tpl1);
          const SOLV = { OH: { frag: 'O', f: 'H2O', lt: 'vandenyje', en: 'water' }, OC: { frag: 'OC', f: 'CH3OH', lt: 'metanolyje', en: 'methanol' }, OCC: { frag: 'OCC', f: 'C2H5OH', lt: 'etanolyje', en: 'ethanol' } };
          const nuKey = ctx.pick(Object.keys(SOLV));
          const sv = SOLV[nuKey];
          const sub = putHalogen(tpl1, X);
          const ret = sub.replace(X, sv.frag), inv = flip(sub).replace(X, sv.frag);
          const plain = sub.replace(/@/g, '');
          if (react.wouldRearrange(plain)) return null; //(' rearranges');
          const res = react.run('sn1', [plain], { nu: nuKey });
          const maj = res.products.filter((p) => p.major);
          if (maj.length !== 1 || canon(ctx, maj[0].smi) !== canon(ctx, plain.replace(X, sv.frag))) return null; //(' engine disagrees');
          const centre = stereo.stereocentres(chem.parse(sub));
          if (centre.length !== 1) return null; //(' one centre expected');
          const idx = centre[0];
          const cS = stereo.cip(chem.parse(sub), idx), cRet = stereo.cip(chem.parse(ret), idx), cInv = stereo.cip(chem.parse(inv), idx);
          if (!cS || !cRet || !cInv || cRet === cInv) return null; //(' descriptors');
          const desc = (c) => '(' + c + ')';
          return {
            q: [{ p: t('Chiralinis halogenalkanas, kurio konfigūracija ' + desc(cS) + ', tirpsta ' + sv.lt + '.', 'A chiral alkyl halide of configuration ' + desc(cS) + ' dissolves in ' + sv.en + '.') },
              { scheme: { items: [{ smi: sub, caption: t(desc(cS), desc(cS)) }, { arrow: '→', above: f(sv.f) }] } }],
            steps: [
              cho(t('Kuris mechanizmas vyrauja?', 'Which mechanism predominates?'), MECH4, 0,
                t('Silpnas nukleofilas ir stabilus karbokatijonas.', 'A weak nucleophile and a stable carbocation.'),
                t('SN1: tretinis ar benzilo substratas silpname nukleofile jonizuojasi į karbokatijoną.', 'SN1: a tertiary or benzylic substrate ionises to a carbocation in a weak nucleophile.')),
              {
                prompt: t('Kokia produkto stereochemija?', 'What is the stereochemistry of the product?'),
                kind: 'choice', options: [mo(inv), mo(ret), tx('Racematas: lygiai po pusę abiejų enantiomerų', 'A racemate: equal amounts of both enantiomers')], answer: 2,
                hint: t('Kokia yra karbokatijono geometrija jo centre?', 'What is the geometry of the carbocation at its centre?'),
                solution: [{ p: t('Plokščias sp² katijonas gali būti atakuojamas iš abiejų pusių, todėl susidaro ' + desc(cRet) + ' ir ' + desc(cInv) + ' enantiomerai maždaug po lygiai.', 'The flat sp² cation can be attacked from either face, so the ' + desc(cRet) + ' and ' + desc(cInv) + ' enantiomers form in roughly equal amounts.') }, { mol: [{ smi: ret, caption: t(desc(cRet), desc(cRet)) }, { smi: inv, caption: t(desc(cInv), desc(cInv)) }] }]
              },
              cho(t('Ar produktų mišinys sukamas poliarizuotą šviesą?', 'Does the product mixture rotate plane-polarised light?'), [
                tx('Ne: racematas optiškai neaktyvus.', 'No: a racemate is optically inactive.'),
                tx('Taip: dominuoja vienas enantiomeras.', 'Yes: one enantiomer predominates.'),
                tx('Taip: nes substratas buvo optiškai aktyvus.', 'Yes: because the substrate was optically active.')
              ], 0, t('Kaip viena kitą veikia dviejų enantiomerų sukimai?', 'How do the rotations of two enantiomers act on each other?'),
                t('Lygūs kiekiai enantiomerų sukimus panaikina.', 'Equal amounts of enantiomers cancel each other’s rotation.'))
            ],
            why: t('SN1 vyksta per plokščią karbokatijoną, o nukleofilas gali prisijungti iš abiejų pusių. Iš optiškai aktyvaus halogenalkano gaunamas racematas, kuris optiškai neaktyvus. Tai priešingas SN2 rezultatas, kai gaunamas vienas enantiomeras.', 'SN1 goes through a flat carbocation and the nucleophile can bond from either face. An optically active alkyl halide gives a racemate, which is optically inactive. This is the opposite of SN2, which gives a single enantiomer.'),
            src: 'L10 p4, p6',
            claims: [{ cip: [sub, idx, cS] }, { cip: [ret, idx, cRet] }, { cip: [inv, idx, cInv] }, { react: ['sn1', [plain], { nu: nuKey }, plain.replace(X, sv.frag)] }]
          };
          }
        }
      },
      /* ============================================================ u10.rank */
      {
        id: 'u10.rank',
        title: t('Reaktingumo ir stabilumo eilės', 'Orders of reactivity and stability'),
        mirrors: [],
        bank: [
          {
            id: 'u10.rank.1',
            q: [{ p: t('Etilo halogenidai reaguoja su tuo pačiu nukleofilu.', 'Ethyl halides react with the same nucleophile.') }, { mol: [{ smi: 'CCF' }, { smi: 'CCCl' }, { smi: 'CCBr' }, { smi: 'CCI' }] }],
            steps: [
              {
                prompt: t('Sudėkite halogenidus pagal SN reaktingumą: nuo reaktyviausio iki mažiausiai reaktyvaus.', 'Put the halides in order of SN reactivity: from the most reactive to the least reactive.'),
                kind: 'order', options: [tx('jodetanas', 'iodoethane'), tx('brometanas', 'bromoethane'), tx('chloretanas', 'chloroethane'), tx('fluoretanas', 'fluoroethane')],
                hint: t('Kuris halogenido anijonas yra silpniausia bazė?', 'Which halide anion is the weakest base?'),
                solution: t('RI > RBr > RCl > RF.', 'RI > RBr > RCl > RF.')
              },
              cho(t('Kodėl jodidas yra geriausia nueinančioji grupė?', 'Why is iodide the best leaving group?'), [
                tx('Jis silpniausia bazė, o jo neigiamas krūvis geriausiai stabilizuotas.', 'It is the weakest base and its negative charge is best stabilised.'),
                tx('C–I ryšys yra poliausias.', 'The C–I bond is the most polar.'),
                tx('Jodas yra elektroneigiamiausias halogenas.', 'Iodine is the most electronegative halogen.'),
                tx('Jodidas yra stipriausia bazė iš halogenidų.', 'Iodide is the strongest base of the halides.')
              ], 0, t('Kokia grupė lengviausiai išeina su elektronų pora?', 'Which group leaves most easily with the electron pair?'),
                t('Lengviausiai išeina grupės su labiausiai stabilizuotu neigiamu krūviu, t. y. silpnos bazės. Fluoras elektroneigiamiausias, bet fluoridas – stipriausia bazė.', 'The groups that leave most easily are those with the best stabilised negative charge, i.e. weak bases. Fluorine is the most electronegative, but fluoride is the strongest base.'))
            ],
            why: t('Nueinančiosios grupės gebą lemia anijono stabilumas, o ne ryšio poliškumas. Silpnesnė bazė – geresnė nueinančioji grupė, todėl SN reakcijose RI > RBr > RCl > RF.', 'The ability of a leaving group depends on the stability of the anion, not on bond polarity. The weaker base is the better leaving group, so in SN reactions RI > RBr > RCl > RF.'),
            src: 'L10 p10'
          },
          {
            id: 'u10.rank.2',
            q: [{ p: t('Penki deguonies nukleofilai.', 'Five oxygen nucleophiles.') }],
            steps: [
              {
                prompt: t('Sudėkite nukleofilus pagal stiprumą: nuo stipriausio iki silpniausio.', 'Put the nucleophiles in order of strength: from the strongest to the weakest.'),
                kind: 'order', options: [tx('$CH3O-$', '$CH3O-$'), tx('$HO-$', '$HO-$'), tx('$CH3COO-$', '$CH3COO-$'), tx('$CH3OH$', '$CH3OH$'), tx('$H2O$', '$H2O$')],
                hint: t('Neigiamą krūvį turintis nukleofilas stipresnis už neutralų; vienodiems atomams nukleofiliškumas seka bazingumą.', 'A negatively charged nucleophile beats a neutral one; for the same atom nucleophilicity follows basicity.'),
                solution: t('Metoksidas > hidroksidas >> acetatas > metanolis > vanduo.', 'Methoxide > hydroxide >> acetate > methanol > water.')
              },
              cho(t('Kodėl metoksidas stipresnis nukleofilas už metanolį?', 'Why is methoxide a stronger nucleophile than methanol?'), [
                tx('Jis turi neigiamą krūvį ir yra stipresnė bazė už savo konjuguotąją rūgštį.', 'It carries a negative charge and is a stronger base than its conjugate acid.'),
                tx('Jis turi daugiau anglies atomų.', 'It has more carbon atoms.'),
                tx('Jis yra silpnesnė bazė.', 'It is a weaker base.'),
                tx('Jis neturi laisvų elektronų porų.', 'It has no lone pairs.')
              ], 0, t('Palyginkite anijoną ir jo konjuguotąją rūgštį.', 'Compare the anion with its conjugate acid.'),
                t('Anijonas atiduoda elektronų porą lengviau nei neutrali molekulė.', 'An anion donates its electron pair more readily than a neutral molecule.'))
            ],
            why: t('Su ta pačia nukleofiline sritimi (deguonimi) nukleofilo stiprumas auga kartu su bazingumu, o neigiamas krūvis dar labiau didina elektronų porų reaktingumą.', 'For the same nucleophilic atom (oxygen) the strength of a nucleophile rises with basicity, and a negative charge increases the reactivity of the lone pairs further.'),
            src: 'L10 p9'
          },
          {
            id: 'u10.rank.3',
            q: [{ p: t('Karbokatijonai susidaro SN1 reakcijų metu.', 'Carbocations form during SN1 reactions.') }, { mol: [{ smi: 'C[C+](C)C' }, { smi: 'C[CH+]C' }, { smi: 'C[CH2+]' }, { smi: '[CH3+]' }] }],
            steps: [
              {
                prompt: t('Sudėkite katijonus pagal stabilumą: nuo stabiliausio iki nestabiliausio.', 'Put the cations in order of stability: from the most stable to the least stable.'),
                kind: 'order', options: [tx('tretinis', 'tertiary'), tx('antrinis', 'secondary'), tx('pirminis', 'primary'), tx('metilkatijonas', 'methyl cation')],
                hint: t('Kiek alkilgrupių stabilizuoja teigiamą anglį?', 'How many alkyl groups stabilise the positive carbon?'),
                solution: t('Tretinis > antrinis > pirminis > metilo.', 'Tertiary > secondary > primary > methyl.')
              },
              cho(t('Kuo paaiškinama ši eilė?', 'What explains this order?'), [
                tx('Hiperkonjugacija: alkilgrupių C–H ryšių elektronai persiklauso su tuščia p orbitale.', 'Hyperconjugation: the electrons of C–H bonds of alkyl groups overlap with the empty p orbital.'),
                tx('Alkilgrupės traukia elektronus ir didina teigiamą krūvį.', 'Alkyl groups withdraw electrons and increase the positive charge.'),
                tx('Tretinis katijonas yra mažesnis ir todėl stabilesnis.', 'A tertiary cation is smaller and therefore more stable.'),
                tx('Teigiamą krūvį stabilizuoja halogenido jonas.', 'The halide ion stabilises the positive charge.')
              ], 0, t('Kokia tuščia orbitalė yra katijone ir su kuo ji gali persiklauti?', 'Which empty orbital does the cation have and what can it overlap with?'),
                t('Kuo daugiau alkilgrupių, tuo daugiau C–H ryšių dalijasi elektronų tankį su katijonu.', 'The more alkyl groups, the more C–H bonds share electron density with the cation.'))
            ],
            why: t('Stabilesnis katijonas susidaro lengviau, todėl SN1 vyksta per tretinius karbokatijonus. Metilo ir pirminio katijono hiperkonjugacija silpna, todėl tokie halogenalkanai reaguoja SN2.', 'A more stable cation forms more easily, so SN1 goes through tertiary carbocations. Hyperconjugation in methyl and primary cations is weak, so such alkyl halides react by SN2.'),
            src: 'L10 p7, p8, L7 p9'
          },
          {
            id: 'u10.rank.4',
            q: [{ p: t('Trys bromidai tirpinami vandenyje (SN1).', 'Three bromides are dissolved in water (SN1).') }, { mol: [{ smi: 'CCCCBr' }, { smi: 'CCC(C)Br' }, { smi: 'CCC(C)(C)Br' }] }],
            steps: [
              {
                prompt: t('Sudėkite bromidus pagal SN1 greitį: nuo greičiausio iki lėčiausio.', 'Put the bromides in order of SN1 rate: from the fastest to the slowest.'),
                kind: 'order', options: [tx('2-brom-2-metilbutanas', '2-bromo-2-methylbutane'), tx('2-brombutanas', '2-bromobutane'), tx('1-brombutanas', '1-bromobutane')],
                hint: t('SN1 greitį lemia susidarančio katijono stabilumas.', 'The SN1 rate is set by the stability of the cation formed.'),
                solution: t('Tretinis > antrinis > pirminis: kuo stabilesnis katijonas, tuo greitesnė lėtoji stadija.', 'Tertiary > secondary > primary: the more stable the cation, the faster the slow stage.')
              },
              cho(t('Kaip ši eilė pasikeistų, jei reakcija vyktų SN2 būdu su stipriu nukleofilu?', 'How would the order change if the reaction took place by SN2 with a strong nucleophile?'), [
                tx('Ji apsiverstų: pirminis greičiausias, tretinis lėčiausias.', 'It would reverse: primary the fastest, tertiary the slowest.'),
                tx('Nepasikeistų.', 'It would not change.'),
                tx('Antrinis taptų greičiausias.', 'The secondary one would become the fastest.'),
                tx('Visi reaguotų vienodai.', 'All would react at the same rate.')
              ], 0, t('Kas SN2 trukdo: erdvinė kliūtis ar katijono stabilumas?', 'What hinders SN2: steric hindrance or the stability of a cation?'),
                t('SN2 puola iš nugaros, todėl labiausiai užstotas tretinis atomas reaguoja lėčiausiai.', 'SN2 attacks from the back, so the most shielded, tertiary carbon reacts the slowest.'))
            ],
            why: t('SN1 ir SN2 klasių eilės priešingos. SN1: tretinis > antrinis > pirminis (stabilus katijonas). SN2: metilo > pirminis > antrinis > tretinis (erdvinė kliūtis).', 'The class orders of SN1 and SN2 are opposite. SN1: tertiary > secondary > primary (stable cation). SN2: methyl > primary > secondary > tertiary (steric hindrance).'),
            src: 'L10 p7, p21, Klein'
          },
          {
            id: 'u10.rank.5',
            q: [{ p: t('Šie halogenidai jonizuojasi SN1 reakcijose.', 'These halides ionise in SN1 reactions.') }, { mol: [{ smi: 'BrCc1ccccc1' }, { smi: 'C=CCBr' }, { smi: 'CC(C)(C)Br' }, { smi: 'CC(C)Br' }, { smi: 'CCBr' }] }],
            steps: [
              {
                prompt: t('Sudėkite halogenidus pagal SN1 reaktingumą: nuo didžiausio iki mažiausio.', 'Put the halides in order of SN1 reactivity: from the highest to the lowest.'),
                kind: 'order', options: [tx('benzilo bromidas', 'benzyl bromide'), tx('alilo bromidas', 'allyl bromide'), tx('tretinis bromidas', 'tertiary bromide'), tx('antrinis bromidas', 'secondary bromide'), tx('pirminis bromidas', 'primary bromide')],
                hint: t('Pasinaudokite katijonų stabilumo eile.', 'Use the order of cation stability.'),
                solution: t('Benzilo > alilo > tretinis > antrinis > pirminis: pirmieji du katijonai stabilizuoti rezonansu.', 'Benzylic > allylic > tertiary > secondary > primary: the first two cations are stabilised by resonance.')
              },
              cho(t('Kodėl benzilo katijonas stabilesnis už tretinį alkilkatijoną?', 'Why is the benzyl cation more stable than a tertiary alkyl cation?'), [
                tx('Teigiamas krūvis delokalizuojasi per benzeno žiedą rezonansu.', 'The positive charge is delocalised over the benzene ring by resonance.'),
                tx('Benzeno žiedas yra didesnis už tris alkilgrupes.', 'A benzene ring is larger than three alkyl groups.'),
                tx('Benzeno žiedas traukia elektronus ir mažina krūvį.', 'The benzene ring withdraws electrons and reduces the charge.'),
                tx('Benzilo katijonas nestabilus.', 'The benzyl cation is not stable.')
              ], 0, t('Kiek rezonansinių formulių galima parašyti?', 'How many resonance structures can be written?'),
                t('Krūvis pasiskirsto orto ir para padėtyse, todėl katijonas ypač stabilus.', 'The charge is spread to the ortho and para positions, so the cation is especially stable.'))
            ],
            why: t('Rezonansas stabilizuoja katijoną stipriau nei hiperkonjugacija. Todėl benzilo ir alilo halogenidai jonizuojasi lengviau net už tretinius, nors jie gali būti pirminiai.', 'Resonance stabilises a cation more than hyperconjugation does. Benzylic and allylic halides therefore ionise more easily even than tertiary ones, although they may be primary.'),
            src: 'L7 p9, S5.11'
          },
          {
            id: 'u10.rank.6',
            q: [{ p: t('Tas pats halogenalkanas reaguoja skirtinguose tirpikliuose.', 'The same alkyl halide reacts in different solvents.') }],
            steps: [{
              prompt: t('Priskirkite tirpiklius jų skatinamiems mechanizmams.', 'Match the solvents with the mechanisms they favour.'),
              kind: 'match',
              answer: {
                left: [tx('vanduo', 'water'), tx('etanolis', 'ethanol'), tx('dimetilsulfoksidas', 'dimethyl sulfoxide'), tx('acetonitrilas', 'acetonitrile')],
                right: [tx('SN1 ir E1', 'SN1 and E1'), tx('SN2', 'SN2')],
                pairs: [0, 0, 1, 1]
              },
              hint: t('Kurie tirpikliai turi O–H grupę?', 'Which solvents have an O–H group?'),
              solution: t('Poliniai protoniniai (vanduo, alkoholiai) skatina SN1 ir E1; poliniai aprotoniniai (DMSO, DMF, acetonitrilas) – SN2.', 'Polar protic solvents (water, alcohols) favour SN1 and E1; polar aprotic ones (DMSO, DMF, acetonitrile) favour SN2.')
            },
            cho(t('Kodėl vanduo ir alkoholiai greitina SN1?', 'Why do water and alcohols speed up SN1?'), [
              tx('Jie stabilizuoja susidarančius jonus (katijoną ir halogenidą).', 'They stabilise the ions that form (the cation and the halide).'),
              tx('Jie padidina nukleofilo koncentraciją.', 'They raise the concentration of the nucleophile.'),
              tx('Jie neleidžia nukleofilui prisijungti.', 'They stop the nucleophile from bonding.'),
              tx('Jie yra stipresni nukleofilai už anijonus.', 'They are stronger nucleophiles than anions.')
            ], 0, t('Ką protoninis tirpiklis daro su jonais?', 'What does a protic solvent do to ions?'),
              t('Lėtoji SN1 stadija sudaro jonus, todėl jonus solvatuojantis tirpiklis ją greitina.', 'The slow SN1 stage makes ions, so a solvent that solvates ions speeds it up.'))],
            why: t('Tirpiklis veikia pereinamosios būsenos stabilumą. SN1 lėtojoje stadijoje susidaro jonai, todėl jos greitį didina protoniniai tirpikliai; SN2 vyksta be jonų susidarymo, ir aprotoninis tirpiklis nukleofilo nesilpnina.', 'The solvent acts on the stability of the transition state. The slow SN1 stage creates ions, so protic solvents raise its rate; SN2 creates no ions, and an aprotic solvent does not weaken the nucleophile.'),
            src: 'L10 p10, p21'
          },
          {
            id: 'u10.rank.7',
            q: [{ p: t('Du pirminiai halogenalkanai reaguoja su natrio hidroksidu vandeniniame etanolyje.', 'Two primary alkyl halides react with sodium hydroxide in aqueous ethanol.') }, { mol: [{ smi: 'CCCCCl', caption: t('a', 'a') }, { smi: 'CCCCI', caption: t('b', 'b') }] }],
            steps: [
              cho(t('Kuris halogenalkanas reaguoja greičiau?', 'Which alkyl halide reacts faster?'), [
                tx('b: jodbutanas', 'b: iodobutane'), tx('a: chlorbutanas', 'a: chlorobutane'), tx('Greičiai vienodi', 'The rates are equal'), tx('Nė vienas nereaguoja', 'Neither reacts')], 0,
                t('Palyginkite nueinančiąsias grupes.', 'Compare the leaving groups.'),
                t('Substratai vienodi, skiriasi tik halogenas; jodidas geriau išeina.', 'The substrates are the same except for the halogen; iodide leaves better.')),
              cho(t('Kaip pasikeistų greitis, jei vietoje $HO-$ būtų naudojamas $H2O$ (SN2)?', 'How would the rate change if $H2O$ replaced $HO-$ (SN2)?'), [
                tx('Sumažėtų: vanduo – daug silpnesnis nukleofilas.', 'It would fall: water is a much weaker nucleophile.'),
                tx('Padidėtų: vanduo yra neutralus.', 'It would rise: water is neutral.'),
                tx('Nepasikeistų.', 'It would not change.'),
                tx('Reakcija taptų SN1.', 'The reaction would become SN1.')], 0,
                t('Palyginkite $HO-$ ir $H2O$ pagal nukleofilų eilę.', 'Compare $HO-$ and $H2O$ in the order of nucleophiles.'),
                t('$HO-$ >> $H2O$, o SN2 greitis auga su nukleofilo stiprumu.', '$HO-$ >> $H2O$, and the SN2 rate rises with the strength of the nucleophile.'))
            ],
            why: t('SN2 greitį didina geresnė nueinančioji grupė, stipresnis nukleofilas ir didesnė jo koncentracija. Substrato klasė ir tirpiklis lemia, ar vyksta SN2, ar SN1.', 'The SN2 rate rises with a better leaving group, a stronger nucleophile and a higher concentration of it. The class of the substrate and the solvent decide whether SN2 or SN1 takes place.'),
            src: 'L10 p9, p10'
          },
          {
            id: 'u10.rank.8',
            q: [{ p: t('Keturi halogenalkanai reaguoja su natrio etoksidu etanolyje (55 °C).', 'Four alkyl halides react with sodium ethoxide in ethanol (55 °C).') }, { mol: [{ smi: 'CBr', caption: t('a', 'a') }, { smi: 'CCBr', caption: t('b', 'b') }, { smi: 'CC(C)Br', caption: t('c', 'c') }, { smi: 'CC(C)(C)Br', caption: t('d', 'd') }] }],
            steps: [
              {
                prompt: t('Sudėkite halogenalkanus pagal eliminavimo produkto dalį: nuo mažiausios iki didžiausios.', 'Put the alkyl halides in order of the share of elimination product: from the smallest to the largest.'),
                kind: 'order', options: [tx('a: brommetanas', 'a: bromomethane'), tx('b: brometanas', 'b: bromoethane'), tx('c: 2-brompropanas', 'c: 2-bromopropane'), tx('d: 2-brom-2-metilpropanas', 'd: 2-bromo-2-methylpropane')],
                hint: t('Eliminavimui reikia β vandenilio; didėjant klasei, SN2 vis labiau užstojamas.', 'Elimination needs a β hydrogen; as the class rises SN2 is increasingly shielded.'),
                solution: t('Brommetanas neturi β atomo, pirminis duoda 10 % alkeno, antrinis – 79 %, tretinis – 100 %.', 'Bromomethane has no β carbon, a primary halide gives 10 % alkene, a secondary one 79 %, a tertiary one 100 %.')
              }
            ],
            why: t('Didėjant halogeno anglies klasei, SN2 vis labiau užstojamas, o stipri bazė lengviau atplėšia β protoną, todėl eliminavimo dalis auga: pirminis < antrinis < tretinis.', 'As the class of the halogen carbon increases, SN2 is increasingly shielded and a strong base removes a β proton more easily, so the share of elimination rises: primary < secondary < tertiary.'),
            src: 'L10 p23'
          }
        ]
      },
      /* ============================================================ u10.elim */
      {
        id: 'u10.elim',
        title: t('Eliminavimo produktai ir Zaicevo taisyklė', 'Elimination products and Zaitsev’s rule'),
        mirrors: ['S5.2'],
        gen(rng, ctx) {
          for (let i = 0; i < 40; i++) { const r = attempt(ctx); if (r) return r; }
          throw new Error('u10.elim: no usable halide');
          function attempt(ctx) {
          const { react, name, chem } = ctx;
          const TPL = [
            'CC(X)CC', 'CC(X)CCC', 'CC(X)C(C)C', 'CC(X)CC(C)C', 'CCC(X)C(C)C', 'CCCC(X)CC', 'CC1CCCCC1X', 'XC(C)C1CCCCC1', 'XC(C)C1CCCC1',
            'CC(C)(X)CC', 'CC(C)(X)CCC', 'CCC(C)(X)CC', 'CC(C)(X)C(C)C', 'CC(C)(X)CC(C)C', 'XC1(C)CCCCC1', 'XC1(C)CCCC1', 'CCC(C)(X)CCC', 'CC(C)(X)CCCC',
            'CC(C)CC(C)(X)C(C)C', 'CC(C)(X)C(C)CC', 'CCC(X)CCC(C)C', 'CCCC(C)(X)CC'
          ];
          let pick = null;
          for (let tries = 0; tries < 80 && !pick; tries++) {
            const X = ctx.pick(['Cl', 'Br', 'I']);
            const smi = putHalogen(ctx.pick(TPL), X);
            const res = react.run('elim', [smi], { base: 'strong' });
            const prods = res.products.map((p) => p.smi);
            const majors = res.products.filter((p) => p.major).map((p) => p.smi);
            if (prods.length < 2 || majors.length !== 1) continue;
            pick = { X, smi, prods, major: majors[0] };
          }
          if (!pick) return null;
          const { X, smi, prods, major } = pick;
          const s = site(ctx, smi);
          const m = s.m;
          const beta = cNb(m, s.c).filter((j) => sp3(m, j) && m.atoms[j].h >= 1).sort((a, b) => a - b);
          const d = dehalo(ctx, smi);
          const rightSet = new Set(prods.map((x) => canon(ctx, x)));
          const wrongs = [];
          const am = chem.parse(d.alkane);
          ctx.shuffle(am.atoms.map((_, k) => k)).forEach((k) => {
            if (k === d.c || !sp3(am, k) || am.atoms[k].h < 1) return;
            const alt = attachAt(d.alkane, k, X);
            const rr = react.run('elim', [alt], { base: 'strong' });
            rr.products.forEach((p) => { const c = canon(ctx, p.smi); if (!rightSet.has(c) && !wrongs.some((w) => canon(ctx, w) === c)) wrongs.push(p.smi); });
          });
          const wr = wrongs.slice(0, 3);
          if (!wr.length) return null;
          const multiOpts = molOptions(ctx, prods, wr, prods.length + 2);
          const minors = prods.filter((x) => x !== major);
          const domOpts = molOptions(ctx, [major], minors.concat(wr.slice(0, 1)), 4);
          const lab = (idx) => idx + 1;
          const steps = [
            {
              prompt: t('Bakstelėkite anglies atomus, nuo kurių gali būti atplėštas protonas (β atomai).', 'Tap the carbons from which a proton can be removed (the β carbons).'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: beta,
              hint: t('Raskite anglį su halogenu; β atomai yra jos anglies kaimynai, turintys bent vieną vandenilį.', 'Find the carbon with the halogen; the β carbons are its carbon neighbours that have at least one hydrogen.'),
              solution: t('Halogenas prie atomo Nr. ' + lab(s.c) + '. β atomai su vandeniliu: Nr. ' + beta.map(lab).join(', ') + '.', 'The halogen is on carbon no. ' + lab(s.c) + '. The β carbons with hydrogen are no. ' + beta.map(lab).join(', ') + '.')
            },
            {
              prompt: t('Pažymėkite visus alkenus, kurie gali susidaryti (cis ir trans izomerų neskirkite).', 'Pick every alkene that can form (do not distinguish cis and trans isomers).'),
              kind: 'multi', options: multiOpts, answer: prods.map((_, i) => i),
              hint: t('Dvigubasis ryšys susidaro tarp anglies su halogenu ir vieno iš β atomų.', 'The double bond forms between the carbon with the halogen and one of the β carbons.'),
              solution: [{ p: t('Kiekvienas β atomas duoda savo alkeną, nes dvigubasis ryšys susidaro tarp jo ir anglies su halogenu. Alkenai, kuriuose ryšys toliau nuo halogeno anglies, negalimi.', 'Each β carbon gives its own alkene, since the double bond forms between it and the carbon with the halogen. Alkenes with the bond farther from the halogen carbon are not possible.') }].concat(prods.map((x) => ({ mol: { smi: x } }))),
            },
            {
              prompt: t('Kuris alkenas dominuoja?', 'Which alkene predominates?'),
              kind: 'choice', options: domOpts, answer: 0,
              hint: t('Palyginkite, kiek alkilgrupių yra prie dvigubojo ryšio kiekviename alkene.', 'Compare how many alkyl groups are on the double bond in each alkene.'),
              solution: [{ p: t('Pagal Zaicevo taisyklę dominuoja alkenas su daugiausia alkilgrupių prie $C=C$: vandenilis atskyla nuo β atomo, turinčio mažiausiai vandenilių.', 'By Zaitsev’s rule the alkene with the most alkyl groups on the $C=C$ predominates: the hydrogen leaves from the β carbon with the fewest hydrogens.') }, { mol: { smi: major } }]
            }
          ];
          const lt = name.name(major, { lang: 'lt' }), en = name.name(major, { lang: 'en' });
          if (lt && en) {
            steps.push({
              prompt: t('Pavadinkite dominuojantį alkeną.', 'Name the predominant alkene.'),
              kind: 'name', mol: { smi: major }, answer: { smi: major },
              hint: t('Pagrindinėje grandinėje turi būti dvigubasis ryšys; numeruokite nuo galo, arčiausio jo.', 'The main chain must contain the double bond; number from the end nearest to it.'),
              solution: t(lt.name, en.name)
            });
          }
          return {
            q: [{ p: t('Halogenalkanas veikiamas stipria baze (natrio etoksidu etanolyje).', 'An alkyl halide is treated with a strong base (sodium ethoxide in ethanol).') }, { scheme: { items: [{ smi }, { arrow: '→', above: f('C2H5ONa'), below: f('C2H5OH') }] } }],
            steps,
            why: t('Stipri bazė atplėšia β protoną ir kartu išstumia halogenidą (E2). Iš kelių β atomų gali susidaryti keli alkenai, o dominuoja pakeistiausias, nes jo dvigubasis ryšys stabilesnis (Zaicevo taisyklė).', 'A strong base removes a β proton and pushes out the halide at the same time (E2). Several β carbons can give several alkenes, and the most substituted one predominates because its double bond is more stable (Zaitsev’s rule).'),
            src: 'L10 p18, p19, p20, S5.2',
            claims: [{ react: ['elim', [smi], { base: 'strong' }, major] }]
          };
          }
        }
      },
      /* ============================================================ u10.compete */
      {
        id: 'u10.compete',
        title: t('Pakeitimas ar eliminavimas: kuris kelias vyrauja', 'Substitution or elimination: which path wins'),
        mirrors: [],
        gen(rng, ctx) {
          for (let i = 0; i < 40; i++) { const r = attempt(ctx); if (r) return r; }
          throw new Error('u10.compete: no usable case');
          function attempt(ctx) {
          const { react } = ctx;
          const SUBS = {
            primary: ['CCCX', 'CCCCX', 'CCCCCX'],
            secondary: ['CC(X)C', 'CCC(X)C', 'XC1CCCCC1', 'CC(X)CC(C)C', 'CCCC(X)C'],
            tertiary: ['CC(C)(C)X', 'CCC(C)(C)X', 'XC1(C)CCCCC1', 'CCC(C)(X)CC', 'CC(C)(X)CCC']
          };
          const STRONG = {
            OCC: { f: 'C2H5ONa', s: 'C2H5OH' },
            OC: { f: 'CH3ONa', s: 'CH3OH' },
            OH: { f: 'NaOH', s: 'H2O, C2H5OH' }
          };
          const GOOD = { CN: 'NaCN', SH: 'NaSH', I: 'NaI', SC: 'NaSCH3' };
          const WEAK = { OH: { f: 'H2O', s: '25 °C' }, OC: { f: 'CH3OH', s: '25 °C' }, OCC: { f: 'C2H5OH', s: '25 °C' } };
          const REASON = {
            primarySN2: t('Pirminis halogenalkanas: anglis atvira puolimui iš nugaros, o katijonas nestabilus, todėl vyksta SN2.', 'A primary alkyl halide: the carbon is open to backside attack and the cation is unstable, so SN2 takes place.'),
            secE2: t('Antrinis halogenalkanas su stipria baze: SN2 iš dalies užstotas, o bazė lengvai atplėšia β protoną, todėl vyrauja E2.', 'A secondary alkyl halide with a strong base: SN2 is partly shielded and the base removes a β proton easily, so E2 predominates.'),
            secSN2: t('Antrinis halogenalkanas su geru, bet silpnai baziniu nukleofilu aprotoniniame tirpiklyje: vyksta SN2.', 'A secondary alkyl halide with a good but weakly basic nucleophile in an aprotic solvent: SN2 takes place.'),
            tertE2: t('Tretinis halogenalkanas su stipria baze: iš nugaros užstota anglis, SN2 neįmanomas, todėl bazė atplėšia protoną: E2.', 'A tertiary alkyl halide with a strong base: the carbon is shielded from the back, SN2 is impossible, so the base removes a proton: E2.'),
            tertSN1: t('Tretinis halogenalkanas silpname nukleofile ir poliniame protoniniame tirpiklyje: stabilus karbokatijonas, vyksta SN1 (kartu šiek tiek E1).', 'A tertiary alkyl halide in a weak nucleophile and a polar protic solvent: a stable carbocation, SN1 takes place (with a little E1).')
          };
          let pick = null;
          for (let tries = 0; tries < 80 && !pick; tries++) {
            const scen = ctx.pick(['strong', 'strong', 'good', 'weak']);
            const cls = scen === 'weak' ? 'tertiary' : scen === 'good' ? ctx.pick(['primary', 'secondary']) : ctx.pick(['primary', 'secondary', 'tertiary']);
            const X = ctx.pick(['Cl', 'Br', 'I']);
            const smi = putHalogen(ctx.pick(SUBS[cls]), X);
            const nuKey = scen === 'strong' ? ctx.pick(Object.keys(STRONG)) : scen === 'good' ? ctx.pick(Object.keys(GOOD)) : ctx.pick(Object.keys(WEAK));
            if (scen === 'good' && nuKey === 'I' && X === 'I') continue;
            if (react.wouldRearrange(smi)) continue;
            const res = react.run(scen === 'weak' ? 'sn1' : 'sn2', [smi], { nu: nuKey });
            if (res.none) continue;
            const majors = res.products.filter((p) => p.major);
            if (majors.length !== 1) continue;
            pick = { scen, cls, X, smi, nuKey, res, major: majors[0].smi };
          }
          if (!pick) return null;
          const { scen, cls, smi, nuKey, res, major } = pick;
          const path = res.mech;
          if (['SN1', 'SN2', 'E2'].indexOf(path) < 0) throw new Error('u10.compete: unexpected path ' + path);
          const reasonKey = path === 'SN2' ? (cls === 'primary' ? 'primarySN2' : 'secSN2') : path === 'SN1' ? 'tertSN1' : (cls === 'secondary' ? 'secE2' : 'tertE2');
          const reasons = Object.keys(REASON).filter((k) => k !== reasonKey);
          const reasonOpts = [{ text: REASON[reasonKey] }].concat(ctx.shuffle(reasons).slice(0, 3).map((k) => ({ text: REASON[k] })));
          const frag = scen === 'strong' || scen === 'weak' ? { OH: 'O', OC: 'OC', OCC: 'OCC' }[nuKey] : NUC[nuKey].frag;
          const d = dehalo(ctx, smi);
          const sn = attachAt(d.alkane, d.c, frag);
          const isE = path === 'E2';
          const wrongs = isE
            ? res.products.filter((p) => !p.major).map((p) => p.smi).concat([sn]).concat(otherPositions(ctx, smi, frag).slice(0, 1))
            : otherPositions(ctx, smi, frag).concat(res.products.filter((p) => !p.major).map((p) => p.smi));
          const prodOpts = molOptions(ctx, [major], wrongs.concat(chainIsomers(d.alkane, frag)), 4);
          const seenC = new Set(prodOpts.map((o) => canon(ctx, o.mol.smi)));
          const alk = react.run('elim', [smi], { base: 'strong' }).products.find((p) => p.major);
          [isE ? sn : (alk && alk.smi)].concat(otherPositions(ctx, smi, frag)).forEach((x) => {
            if (!x || prodOpts.length >= 4) return;
            const k = canon(ctx, x);
            if (!seenC.has(k)) { seenC.add(k); prodOpts.push({ mol: { smi: x } }); }
          });
          if (prodOpts.length < 3) return null;
          const above = scen === 'strong' ? STRONG[nuKey].f : scen === 'good' ? GOOD[nuKey] : WEAK[nuKey].f;
          const below = scen === 'strong' ? STRONG[nuKey].s : scen === 'good' ? '(CH3)2SO' : WEAK[nuKey].s;
          const clsLt = { primary: 'pirminis', secondary: 'antrinis', tertiary: 'tretinis' }[cls];
          const clsEn = cls;
          const steps = [
            cho(t('Kuris kelias vyrauja?', 'Which path predominates?'), [tx('SN1', 'SN1'), tx('SN2', 'SN2'), tx('E1', 'E1'), tx('E2', 'E2')], { SN1: 0, SN2: 1, E1: 2, E2: 3 }[path],
              t('Įvertinkite substrato klasę, o paskui – ar reagentas stipri bazė, ar geras nukleofilas.', 'Consider the class of the substrate, and then whether the reagent is a strong base or a good nucleophile.'),
              REASON[reasonKey]),
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options: prodOpts, answer: 0,
              hint: t('Pagal pasirinktą kelią nuspręskite, ar halogenas pakeičiamas, ar atskeliamas HX.', 'From the path you chose decide whether the halogen is replaced or HX is lost.'),
              solution: [{ p: t('Vyrauja ' + path + ': ' + (isE ? 'halogenalkanas atskelia HX ir susidaro alkenas.' : 'halogenas pakeičiamas nukleofilu.'), path + ' predominates: ' + (isE ? 'the alkyl halide loses HX and an alkene forms.' : 'the halogen is replaced by the nucleophile.')) }, { mol: { smi: major } }]
            },
            { prompt: t('Kuris paaiškinimas tinka?', 'Which explanation fits?'), kind: 'choice', options: reasonOpts, answer: 0,
              hint: t('Palyginkite substrato klasę su reagento savybėmis.', 'Compare the class of the substrate with the properties of the reagent.'),
              solution: REASON[reasonKey] }
          ];
          return {
            q: [{ p: t('Halogenalkanas (' + clsLt + ') reaguoja šiomis sąlygomis.', 'An alkyl halide (' + clsEn + ') reacts under these conditions.') }, { scheme: { items: [{ smi }, { arrow: '→', above: f(above), below: f(below) }] } }],
            steps,
            why: t('Kelią lemia substrato klasė ir reagentas. Su stipria baze: pirminis – SN2, antrinis ir tretinis – E2. Su geru, bet silpnai baziniu nukleofilu aprotoniniame tirpiklyje: pirminis ir antrinis – SN2. Silpname nukleofile protoniniame tirpiklyje tretinis – SN1.', 'The path depends on the class of the substrate and on the reagent. With a strong base: primary gives SN2, secondary and tertiary give E2. With a good but weakly basic nucleophile in an aprotic solvent: primary and secondary give SN2. In a weak nucleophile in a protic solvent a tertiary halide gives SN1.'),
            src: 'L10 p21, p22, p23',
            claims: [{ react: [scen === 'weak' ? 'sn1' : 'sn2', [smi], { nu: nuKey }, major] }]
          };
          }
        }
      },
      /* ============================================================ u10.allyl */
      {
        id: 'u10.allyl',
        title: t('Alilo ir benzilo halogenidai SN1 reakcijose', 'Allylic and benzylic halides in SN1'),
        mirrors: ['S5.11'],
        bank: [
          {
            id: 'u10.allyl.1',
            q: [{ p: t('3-chlor-1-pentenas ir 1-chlor-2-pentenas reaguoja su vandeniu SN1 būdu beveik vienodu greičiu, nors pirmasis yra antrinis, o antrasis – pirminis halogenidas.', '3-chloropent-1-ene and 1-chloropent-2-ene react with water by SN1 at almost the same rate, although the first is a secondary and the second a primary halide.') },
              { mol: [{ smi: 'C=CC(Cl)CC', name: t('3-chlor-1-pentenas', '3-chloropent-1-ene'), caption: t('antrinis', 'secondary') }, { smi: 'ClCC=CCC', name: t('1-chlor-2-pentenas', '1-chloropent-2-ene'), caption: t('pirminis', 'primary') }] }],
            steps: [
              cho(t('Kodėl jų greičiai panašūs?', 'Why are their rates similar?'), [
                tx('Abu praranda chloridą ir sudaro tą patį rezonansu stabilizuotą alilo katijoną.', 'Both lose chloride and form the same resonance-stabilised allyl cation.'),
                tx('Abu reaguoja SN2, o klasės skirtumas nesvarbus.', 'Both react by SN2 and the difference in class does not matter.'),
                tx('Pirminis halogenidas visada reaguoja greičiau.', 'A primary halide always reacts faster.'),
                tx('Antrinis halogenidas sudaro stabilesnį katijoną.', 'A secondary halide forms a more stable cation.')
              ], 0, t('Parašykite katijoną, kuris susidaro iš kiekvieno halogenido.', 'Write the cation that forms from each halide.'),
                t('SN1 greitį lemia lėtoji jonizacija, o abiejų halogenidų jonizacija duoda tą patį katijoną.', 'The SN1 rate is set by slow ionisation, and the ionisation of both halides gives the same cation.')),
              {
                prompt: t('Bakstelėkite anglies atomus, kuriems tenka teigiamas krūvis alilo katijone.', 'Tap the carbons that carry the positive charge in the allyl cation.'),
                kind: 'atoms', mol: { smi: 'C=C[CH+]CC', opts: { numbers: 'all' } }, answer: [0, 2],
                hint: t('Nupieškite rezonansines formules: kur gali persikelti krūvis per π ryšį?', 'Draw the resonance structures: where can the charge move through the π bond?'),
                solution: [{ p: t('Teigiamas krūvis dalijasi tarp atomų Nr. 1 ir Nr. 3.', 'The positive charge is shared by carbons no. 1 and no. 3.') }, { resonance: [{ smi: 'C=C[CH+]CC' }, { smi: '[CH2+]C=CCC' }] }]
              },
              cho(t('Kuris produktų rinkinys susidaro iš abiejų halogenidų su vandeniu?', 'Which set of products forms from both halides with water?'), [
                { scheme: { items: [{ smi: 'C=CC(O)CC' }, { plus: true }, { smi: 'OCC=CCC' }] } },
                { scheme: { items: [{ smi: 'C=CC(O)CC' }] } },
                { scheme: { items: [{ smi: 'OCC=CCC' }] } },
                { scheme: { items: [{ smi: 'C=CCC(O)C' }, { plus: true }, { smi: 'OCCC=CC' }] } }
              ], 0, t('Vanduo gali pulti abu katijono galus.', 'Water can attack both ends of the cation.'),
                t('Iš abiejų halogenidų gaunamas tas pats antrinio ir pirminio alilo alkoholių mišinys.', 'Both halides give the same mixture of a secondary and a primary allylic alcohol.'))
            ],
            why: t('SN1 greitį lemia jonizacija, o ne pradinio halogenalkano klasė. Kai du halogenidai duoda tą patį karbokatijoną, jų SN1 greičiai beveik vienodi, o produktų mišinys sutampa.', 'The SN1 rate is set by ionisation, not by the class of the starting halide. When two halides give the same carbocation, their SN1 rates are almost equal and the product mixture is the same.'),
            src: 'S5.11, L7 p9',
            claims: [{ react: ['sn1', ['C=CC(Cl)CC'], { nu: 'OH' }, 'C=CC(O)CC'] }, { react: ['sn1', ['ClCC=CCC'], { nu: 'OH' }, 'OCC=CCC'] }]
          },
          {
            id: 'u10.allyl.2',
            q: [{ p: t('Benzilo chloridas ($C6H5CH2Cl$) su etanoliu reaguoja (SN1, solvolizė) daug greičiau už 1-chlorbutaną, nors abu yra pirminiai.', 'Benzyl chloride ($C6H5CH2Cl$) reacts with ethanol (SN1 solvolysis) much faster than 1-chlorobutane, although both are primary.') }],
            steps: [
              {
                prompt: t('Bakstelėkite atomus, kuriems tenka teigiamas krūvis benzilo katijone.', 'Tap the atoms that carry the positive charge in the benzyl cation.'),
                kind: 'atoms', mol: { smi: '[CH2+]c1ccccc1', opts: { numbers: 'all' } }, answer: [0, 2, 4, 6],
                hint: t('Nupieškite rezonansines formules: į kuriuos žiedo atomus gali pereiti krūvis?', 'Draw the resonance structures: to which ring atoms can the charge move?'),
                solution: [{ p: t('Be benzilo anglies Nr. 1, krūvis pasiskirsto orto (Nr. 3 ir Nr. 7) ir para (Nr. 5) atomuose.', 'Besides benzylic carbon no. 1 the charge is spread over the ortho (no. 3 and no. 7) and para (no. 5) carbons.') }, { resonance: [{ smi: '[CH2+]c1ccccc1' }, { smi: 'C=C1C=CC=C[CH+]1' }, { smi: 'C=C1C=C[CH+]C=C1' }] }]
              },
              cho(t('Kuris paaiškinimas tinka?', 'Which explanation fits?'), [
                tx('Benzilo katijonas stabilizuotas rezonansu, todėl jonizacija (lėtoji stadija) greita.', 'The benzyl cation is stabilised by resonance, so ionisation (the slow stage) is fast.'),
                tx('Benzilo chloridas – stipresnė bazė.', 'Benzyl chloride is the stronger base.'),
                tx('Benzilo halogenidas turi geresnę nueinančiąją grupę už 1-chlorbutaną.', 'Benzyl chloride has a better leaving group than 1-chlorobutane.'),
                tx('1-chlorbutanas reaguoja SN1, o benzilo chloridas – SN2.', '1-chlorobutane reacts by SN1 and benzyl chloride by SN2.')
              ], 0, t('Nueinančioji grupė abiem ta pati; kuo skiriasi katijonai?', 'The leaving group is the same in both; how do the cations differ?'),
                t('Chloridas tas pats; skiriasi susidarančio katijono stabilumas.', 'The chloride is the same; what differs is the stability of the cation.'))
            ],
            why: t('Benzilkatijonas stabilesnis už pirminius, antrinius ir net tretinius alkilkatijonus (kurso eilė, L7 p9), nes krūvis delokalizuotas per aromatinį žiedą. Todėl benzilo halogenidai lengvai reaguoja SN1, nors yra pirminiai.', 'The benzyl cation is more stable than primary, secondary and even tertiary alkyl cations (the course order, L7 p9) because its charge is delocalised over the aromatic ring. Benzylic halides therefore undergo SN1 readily even though they are primary.'),
            src: 'L7 p9, S5.11',
            claims: [{ react: ['sn1', ['ClCc1ccccc1'], { nu: 'OCC' }, 'CCOCc1ccccc1'] }]
          },
          {
            id: 'u10.allyl.3',
            q: [{ p: t('Šiuose junginiuose halogenas yra skirtingose vietose.', 'In these compounds the halogen sits at different places.') },
              { mol: [{ smi: 'C=CCBr', name: t('3-brompropenas', '3-bromoprop-1-ene'), caption: t('a', 'a') }, { smi: 'C=CBr', name: t('brometenas', 'bromoethene'), caption: t('b', 'b') }, { smi: 'CCCBr', name: t('1-brompropanas', '1-bromopropane'), caption: t('c', 'c') }] }],
            steps: [
              {
                prompt: t('Sudėkite junginius pagal SN1 reaktingumą: nuo didžiausio iki mažiausio.', 'Put the compounds in order of SN1 reactivity: from the highest to the lowest.'),
                kind: 'order', options: [tx('a: alilo bromidas', 'a: allyl bromide'), tx('c: 1-brompropanas', 'c: 1-bromopropane'), tx('b: vinilo bromidas', 'b: vinyl bromide')],
                hint: t('Kurį katijoną stabilizuoja rezonansas, o kuris nestabilus ar neįmanomas?', 'Which cation is stabilised by resonance and which is unstable or impossible?'),
                solution: t('Alilo bromidas sudaro rezonansu stabilizuotą katijoną; pirminis alkilkatijonas nestabilus; vinilo halogenidas SN nereaguoja.', 'Allyl bromide forms a resonance-stabilised cation; a primary alkyl cation is unstable; a vinyl halide does not undergo SN.')
              },
              cho(t('Kodėl brometenas nereaguoja nukleofiliniu pakeitimu?', 'Why does bromoethene not undergo nucleophilic substitution?'), [
                tx('Bromo laisva pora sąveikauja su $C=C$ ($p,π$-konjugacija), todėl C–Br ryšys tvirtesnis.', 'A lone pair of bromine interacts with the $C=C$ ($p,π$ conjugation), so the C–Br bond is stronger.'),
                tx('Bromas čia yra blogesnė nueinančioji grupė nei kituose junginiuose.', 'Bromine is a worse leaving group here than in the other compounds.'),
                tx('Vinilo katijonas stabilesnis už alilo.', 'A vinyl cation is more stable than an allyl cation.'),
                tx('Anglis yra per daug užstota iš nugaros.', 'The carbon is too shielded from the back.')
              ], 0, t('Ką galima pasakyti apie brome esančią laisvą elektronų porą?', 'What can be said about the lone pair on bromine?'),
                t('Halogeno laisva pora dalyvauja konjugacijoje, todėl ryšys trumpesnis ir sunkiau nutraukiamas.', 'The lone pair of the halogen takes part in conjugation, so the bond is shorter and harder to break.'))
            ],
            why: t('Svarbu, ar halogenas prie sp³ anglies šalia $C=C$ (alilo – reaktyvus), ar pačiame $C=C$ (vinilo – nereaktyvus). Pirmajame jonizacija duoda stabilų katijoną, antrajame ryšys sustiprėja.', 'What matters is whether the halogen is on an sp³ carbon next to a $C=C$ (allylic, reactive) or on the $C=C$ itself (vinylic, unreactive). In the first, ionisation gives a stable cation; in the second the bond is strengthened.'),
            src: 'L10 p24, L7 p9'
          },
          {
            id: 'u10.allyl.4',
            q: [{ p: t('1-chlor-3-metil-2-pentenas tirpinamas vandenyje.', '1-chloro-3-methylpent-2-ene is dissolved in water.') }, { mol: { smi: 'ClCC=C(C)CC', name: t('1-chlor-3-metil-2-pentenas', '1-chloro-3-methylpent-2-ene') } }],
            steps: [
              cho(t('Koks katijonas susidaro?', 'Which cation forms?'), [
                mo('[CH2+]C=C(C)CC'), mo('[CH2+]C(C)=CCC'), mo('CC=C(C)[CH+]C'), tx('Katijonas nesusidaro.', 'No cation forms.')
              ], 0, t('Kas išeina jonizacijos metu ir ar keičiasi anglies skeletas?', 'What leaves in ionisation, and does the carbon skeleton change?'),
                [{ p: t('Susidaro alilkatijonas: krūvis dalijasi tarp pirminio ir tretinio atomų.', 'An allyl cation forms: the charge is shared between a primary and a tertiary carbon.') }, { resonance: [{ smi: '[CH2+]C=C(C)CC' }, { smi: 'C=C[C+](C)CC' }] }]),
              {
                prompt: t('Pažymėkite visus susidarančius alkoholius.', 'Pick every alcohol that forms.'),
                kind: 'multi', options: [mo('OCC=C(C)CC'), mo('C=CC(C)(O)CC'), mo('C=C(CC)CCO'), mo('C=CC(C)C(C)O')], answer: [0, 1],
                hint: t('Vanduo gali jungtis prie abiejų galų, kur yra dalis teigiamo krūvio.', 'Water can bond at both ends that carry part of the positive charge.'),
                solution: t('Gaunami pirminis (prie CH₂) ir tretinis alilo alkoholiai; kiti du turi kitokį anglies skeletą ar OH vietą.', 'A primary (on the CH₂) and a tertiary allylic alcohol form; the other two have a different carbon skeleton or OH position.')
              }
            ],
            why: t('Alilkatijonas turi du reaktyvius galus. Kai galai nevienodi, gaunamas dviejų izomerų mišinys; santykį lemia katijono stabilumas ir erdvinė kliūtis.', 'An allyl cation has two reactive ends. When the ends are different a mixture of two isomers results; the ratio depends on the stability of the cation and on steric hindrance.'),
            src: 'S5.11, L7 p9',
            claims: [{ react: ['sn1', ['ClCC=C(C)CC'], { nu: 'OH' }, 'OCC=C(C)CC'] }, { react: ['sn1', ['ClCC=C(C)CC'], { nu: 'OH' }, 'C=CC(C)(O)CC'] }]
          },
          {
            id: 'u10.allyl.5',
            q: [{ p: t('Kuriuos iš šių halogenidų SN1 reakcijoje su vandeniu duos tą patį alilo katijoną ir tą patį produktų mišinį?', 'Which of these halides give the same allyl cation, and the same product mixture, in an SN1 reaction with water?') },
              { mol: [{ smi: 'C=CC(C)Br', caption: t('a', 'a') }, { smi: 'CC=CCBr', caption: t('b', 'b') }, { smi: 'C=CCCBr', caption: t('c', 'c') }, { smi: 'CCCCBr', caption: t('d', 'd') }] }],
            steps: [{
              prompt: t('Pažymėkite pasirinktus junginius.', 'Pick the compounds.'),
              kind: 'multi', options: [tx('a', 'a'), tx('b', 'b'), tx('c', 'c'), tx('d', 'd')], answer: [0, 1],
              hint: t('Išmeskite bromidą ir palyginkite susidariusius katijonus.', 'Remove bromide and compare the cations that result.'),
              solution: t('a ir b duoda tą patį 1-metilalilo katijoną. c – ne alilo halogenidas (halogenas toliau nuo $C=C$), jonizacija duotų nestabilų pirminį katijoną; d – pirminis alkilo.', 'a and b give the same 1-methylallyl cation. c is not an allylic halide (the halogen is farther from the $C=C$) and would give an unstable primary cation; d is a primary alkyl halide.')
            }],
            why: t('Bendras katijonas reiškia bendrą lėtąją stadiją ir bendrą produktų mišinį. Halogenas turi būti prijungtas prie anglies, besiribojančios su $C=C$ (alilo padėtis).', 'A common cation means a common slow stage and a common product mixture. The halogen must be on a carbon adjacent to the $C=C$ (the allylic position).'),
            src: 'S5.11',
            claims: [{ react: ['sn1', ['C=CC(C)Br'], { nu: 'OH' }, 'C=CC(C)O'] }, { react: ['sn1', ['CC=CCBr'], { nu: 'OH' }, 'C=CC(C)O'] }]
          },
          {
            id: 'u10.allyl.6',
            q: [{ p: t('(R)-1-feniletilo chloridas tirpinamas vandenyje ir virsta alkoholiu.', '(R)-1-phenylethyl chloride is dissolved in water and becomes an alcohol.') },
              { mol: { smi: 'C[C@@H](Cl)c1ccccc1', caption: t('(R)', '(R)') } }],
            steps: [
              cho(t('Kodėl šis antrinis halogenidas lengvai reaguoja SN1?', 'Why does this secondary halide readily react by SN1?'), [
                tx('Benzilo katijonas stabilizuotas rezonansu.', 'The benzylic cation is stabilised by resonance.'),
                tx('Antriniai katijonai visada stabilūs.', 'Secondary cations are always stable.'),
                tx('Vanduo yra stiprus nukleofilas.', 'Water is a strong nucleophile.'),
                tx('Chloras yra geriausia nueinančioji grupė.', 'Chlorine is the best leaving group.')
              ], 0, t('Su kuo greta yra teigiamo krūvio anglis?', 'What is next to the carbon that bears the positive charge?'),
                t('Šalia katijono centro yra benzeno žiedas.', 'A benzene ring sits next to the cationic centre.')),
              cho(t('Kokia produkto stereochemija?', 'What is the stereochemistry of the product?'), [
                tx('Racematas: katijonas plokščias, vanduo puola iš abiejų pusių.', 'A racemate: the cation is flat and water attacks from both faces.'),
                tx('Tik (S) enantiomeras (inversija).', 'Only the (S) enantiomer (inversion).'),
                tx('Tik (R) enantiomeras (konfigūracija išlieka).', 'Only the (R) enantiomer (the configuration is retained).'),
                tx('Produktas achiralinis.', 'The product is achiral.')
              ], 0, t('Kokia yra katijono centrinio atomo hibridizacija ir geometrija?', 'What are the hybridisation and geometry of the central atom of the cation?'),
                t('SN1 per plokščią sp² centrą iš chiralinio substrato duoda racematą.', 'SN1 through a flat sp² centre gives a racemate from a chiral substrate.'))
            ],
            why: t('Benzilo (kaip ir alilo) halogenidai reaguoja SN1 būdu, todėl iš jų gaunami racematai. SN2 apverstų konfigūraciją, bet su silpnu nukleofilu ir protoniniu tirpikliu SN2 neįvyksta.', 'Benzylic (like allylic) halides react by SN1, so they give racemates. SN2 would invert the configuration, but with a weak nucleophile and a protic solvent SN2 does not take place.'),
            src: 'L10 p6, L7 p9',
            claims: [{ cip: ['C[C@@H](Cl)c1ccccc1', 1, 'R'] }]
          },
          {
            id: 'u10.allyl.7',
            q: [{ p: t('Šie halogenidai pagal klasę nėra tretiniai, bet kai kurie jonizuojasi greitai.', 'None of these halides is tertiary by class, but some ionise quickly.') },
              { mol: [{ smi: 'BrCc1ccccc1', caption: t('a', 'a') }, { smi: 'CC(C)Br', caption: t('b', 'b') }, { smi: 'C=CC(C)Br', caption: t('c', 'c') }, { smi: 'CCCBr', caption: t('d', 'd') }] }],
            steps: [{
              prompt: t('Pažymėkite junginius, kurie SN1 reakcijoje jonizuojasi lengviausiai.', 'Pick the compounds that ionise most readily in an SN1 reaction.'),
              kind: 'multi', options: [tx('a', 'a'), tx('b', 'b'), tx('c', 'c'), tx('d', 'd')], answer: [0, 2],
              hint: t('Kuriuos katijonus stabilizuoja rezonansas?', 'Which cations are stabilised by resonance?'),
              solution: t('a duoda benzilo, c – alilo katijoną: rezonansas stabilizuoja stipriau už alkilgrupes. b duotų antrinį, d – pirminį alkilo katijoną.', 'a gives a benzylic and c an allylic cation: resonance stabilises more than alkyl groups do. b would give a secondary and d a primary alkyl cation.')
            }],
            why: t('Pagal kurso katijonų stabilumo eilę benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas, benzilo ir alilo halogenidai jonizuojasi lengviausiai.', 'By the course’s order of cation stability, benzylic > allylic > tertiary > secondary > primary > methyl, benzylic and allylic halides ionise most readily.'),
            src: 'L7 p9, S5.11'
          },
          {
            id: 'u10.allyl.8',
            q: [{ p: t('3-chlor-3-metil-1-butenas tirpinamas vandenyje.', '3-chloro-3-methylbut-1-ene is dissolved in water.') }, { mol: { smi: 'C=CC(C)(C)Cl', name: t('3-chlor-3-metil-1-butenas', '3-chloro-3-methylbut-1-ene'), caption: t('tretinis alilo halogenidas', 'tertiary allylic halide') } }],
            steps: [
              cho(t('Koks katijonas susidaro?', 'Which cation forms?'), [mo('C=C[C+](C)C'), mo('C=C(C)[CH+]C'), mo('[CH2+]C(C)=CC'), tx('Nesusidaro joks katijonas.', 'No cation forms.')], 0,
                t('Išeina tik chloridas.', 'Only chloride leaves.'),
                [{ p: t('Susidaro tretinis alilo katijonas, kurio krūvis dalijasi su pirminiu atomu.', 'A tertiary allylic cation forms whose charge is shared with a primary carbon.') }, { resonance: [{ smi: 'C=C[C+](C)C' }, { smi: '[CH2+]C=C(C)C' }] }]),
              {
                prompt: t('Pažymėkite abu pakeitimo produktus.', 'Pick both substitution products.'),
                kind: 'multi', options: [mo('C=CC(C)(C)O'), mo('OCC=C(C)C'), mo('C=C(C)CCO'), mo('C=C(C)C(C)O')], answer: [0, 1],
                hint: t('Kiekvienas katijono galas gali prisijungti vandenį.', 'Each end of the cation can bond water.'),
                solution: t('Vanduo prisijungia prie tretinio galo (tretinis alkoholis) ir prie pirminio galo (pirminis alkoholis).', 'Water bonds at the tertiary end (a tertiary alcohol) and at the primary end (a primary alcohol).')
              }
            ],
            why: t('Tas pats katijonas susidaro ir iš šio halogenido, ir iš jo izomero 1-chlor-3-metil-2-buteno. Teigiamas krūvis pasiskirsto per alilo sistemą, todėl nukleofilas gali prisijungti prie kito galo, nei buvo halogenas (alilinis persigrupavimas).', 'The same cation forms from this halide and from its isomer 1-chloro-3-methylbut-2-ene. The positive charge is spread over the allylic system, so the nucleophile can bond at the other end from where the halogen was (allylic rearrangement).'),
            src: 'S5.11',
            claims: [{ react: ['sn1', ['C=CC(C)(C)Cl'], { nu: 'OH' }, 'C=CC(C)(C)O'] }, { react: ['sn1', ['C=CC(C)(C)Cl'], { nu: 'OH' }, 'OCC=C(C)C'] }]
          }
        ]
      },
      /* ============================================================ u10.intra */
      {
        id: 'u10.intra',
        title: t('Intramolekulinė SN2: žiedo susidarymas', 'Intramolecular SN2: ring closure'),
        mirrors: ['S5.9'],
        gen(rng, ctx) {
          const n = ctx.pick([3, 4, 4, 5, 5, 6]);
          const Z = ctx.pick(['O', 'O', 'S']);
          const X = ctx.pick(['Cl', 'Br', 'I']);
          const me = Z === 'O' && n >= 4 ? ctx.pick([false, true]) : false;
          const anion = '[' + Z + '-]';
          // alkoxide or thiolate, n carbons, halogen on the last one; me puts a methyl on the carbon next to the nucleophilic atom
          const open = anion + (me ? 'C(C)' + 'C'.repeat(n - 1) : 'C'.repeat(n)) + X;
          const ring = me ? 'CC1' + 'C'.repeat(n - 1) + Z + '1' : 'C1' + 'C'.repeat(n - 1) + Z + '1';
          const rsize = n + 1;
          const nC = n + (me ? 1 : 0);
          const alkene = me ? 'CC(' + Z + ')' + 'C'.repeat(n - 3) + 'C=C' : 'C=C' + 'C'.repeat(n - 2) + Z;
          const smaller = 'CC1' + 'C'.repeat(n - (me ? 3 : 2)) + Z + '1';
          const names = {
            O: { 3: ['oksetanas', 'oxetane'], 4: ['tetrahidrofuranas (oksolanas)', 'tetrahydrofuran (oxolane)'], 5: ['tetrahidropiranas (oksanas)', 'tetrahydropyran (oxane)'], 6: ['oksepanas', 'oxepane'] },
            S: { 3: ['tietanas', 'thietane'], 4: ['tiolanas', 'thiolane'], 5: ['tianas', 'thiane'], 6: ['tiepanas', 'thiepane'] }
          };
          const ME = { 4: ['2-metiltetrahidrofuranas (2-metiloksolanas)', '2-methyltetrahydrofuran (2-methyloxolane)'], 5: ['2-metiltetrahidropiranas (2-metiloksanas)', '2-methyltetrahydropyran (2-methyloxane)'], 6: ['2-metiloksepanas', '2-methyloxepane'] };
          const nm = me ? ME[n] : names[Z][n];
          const sizeWord = { 4: 'keturnaris', 5: 'penkianaris', 6: 'šešianaris', 7: 'septynnaris' }[rsize];
          const sizeEn = { 4: 'four-membered', 5: 'five-membered', 6: 'six-membered', 7: 'seven-membered' }[rsize];
          const nucAtom = 0;
          const mol = ctx.chem.parse(open);
          const hal = mol.atoms.findIndex((a) => /^(Cl|Br|I)$/.test(a.el));
          const cIdx = mol.nbr[hal][0];
          const ringOpts = molOptions(ctx, [ring], [alkene, smaller], 3);
          if (ringOpts.length < 2) throw new Error('u10.intra: options');
          const steps = [
            {
              prompt: t('Kiek narių turės susidaręs žiedas?', 'How many members will the ring have?'),
              kind: 'number', answer: { value: rsize, tol: 0 },
              hint: t('Žiedą sudaro nukleofilinis atomas ir visi anglies atomai grandinėje iki anglies su halogenu.', 'The ring consists of the nucleophilic atom and all the chain carbons up to the carbon with the halogen.'),
              solution: t('Žiede yra nukleofilinis atomas ir ' + n + ' grandinės anglies atomai: ' + rsize + ' nariai.', 'The ring contains the nucleophilic atom and ' + n + ' chain carbons: ' + rsize + ' members.')
            },
            {
              prompt: t('Kuris produktas susidaro?', 'Which product forms?'),
              kind: 'choice', options: ringOpts, answer: 0,
              hint: t('Nukleofilas ir elektrofilas yra toje pačioje molekulėje: ką jie sudaro, kai susijungia?', 'The nucleophile and the electrophile are in the same molecule: what do they form when they join?'),
              solution: [{ p: t('Nukleofilas puola savo molekulės anglį ir išstumia halogenidą. Susidaro ' + sizeWord + ' žiedas: ' + nm[0] + '.', 'The nucleophile attacks a carbon of its own molecule and pushes out the halide. A ' + sizeEn + ' ring forms: ' + nm[1] + '.') }, { mol: { smi: ring, name: t(nm[0], nm[1]) } }]
            }
          ];
          return {
            q: [{ p: t('Viena molekulė turi ir nukleofilinę, ir elektrofilinę dalį.', 'One molecule has both a nucleophilic and an electrophilic part.') }, { scheme: { items: [{ smi: open }, { arrow: '→' }] } }],
            steps,
            why: t('Kai nukleofilas ir elektrofilas yra toje pačioje molekulėje, SN2 vyksta intramolekuliškai, o produktas yra žiedas. Šiame pavyzdyje susidaro ' + sizeWord + ' žiedas; penkianariai ir šešianariai žiedai susidaro lengviausiai.' + (rsize === 4 || rsize === 7 ? ' Šis žiedas susidaro lėčiau.' : ''), 'When the nucleophile and the electrophile are in the same molecule, SN2 takes place intramolecularly and the product is a ring. Here a ' + sizeEn + ' ring forms; five- and six-membered rings form most easily.' + (rsize === 4 || rsize === 7 ? ' This ring forms more slowly.' : '')),
            src: 'S5.9, L10 p5',
            claims: [{ formula: [ring, (Z === 'O' ? 'C' + nC + 'H' + (2 * nC) + 'O' : 'C' + nC + 'H' + (2 * nC) + 'S')] }]
          };
        }
      },
      /* ============================================================ u10.unreact */
      {
        id: 'u10.unreact',
        title: t('Halogenalkenai ir halogenarenai', 'Haloalkenes and haloarenes'),
        mirrors: [],
        bank: [
          {
            id: 'u10.unreact.1',
            q: [{ p: t('Keturi halogenidai veikiami vandeniniu natrio hidroksido tirpalu, švelniai pašildžius.', 'Four halides are treated with aqueous sodium hydroxide with gentle warming.') },
              { mol: [{ smi: 'CCCl', caption: t('a', 'a') }, { smi: 'C=CCl', caption: t('b', 'b') }, { smi: 'Clc1ccccc1', caption: t('c', 'c') }, { smi: 'C=CCCl', caption: t('d', 'd') }] }],
            steps: [{
              prompt: t('Pažymėkite junginius, kurie lengvai pakeičia halogeną (SN).', 'Pick the compounds in which the halogen is replaced easily (SN).'),
              kind: 'multi', options: [tx('a: chloretanas', 'a: chloroethane'), tx('b: chloretenas', 'b: chloroethene'), tx('c: chlorbenzenas', 'c: chlorobenzene'), tx('d: 3-chlorpropenas', 'd: 3-chloroprop-1-ene')], answer: [0, 3],
              hint: t('Pažiūrėkite, ar halogenas prie sp³ anglies.', 'See whether the halogen is on an sp³ carbon.'),
              solution: t('Chloretanas (pirminis) ir 3-chlorpropenas (alilo) turi halogeną prie sp³ anglies. Chloretenas ir chlorbenzenas turi halogeną prie sp² anglies, todėl SN nevyksta.', 'Chloroethane (primary) and 3-chloroprop-1-ene (allylic) have the halogen on an sp³ carbon. Chloroethene and chlorobenzene have it on an sp² carbon, so SN does not take place.')
            }],
            why: t('Halogeno laisva pora konjuguota su $C=C$ ar benzeno žiedu, todėl C–Hal ryšys tvirtesnis ir SN nevyksta įprastomis sąlygomis. Alilo junginys konjugacijos nesudaro, nes halogenas prie sp³ anglies.', 'The lone pair of the halogen is conjugated with the $C=C$ or the benzene ring, so the C–Hal bond is stronger and SN does not take place under ordinary conditions. The allylic compound has no such conjugation because its halogen is on an sp³ carbon.'),
            src: 'L10 p24'
          },
          {
            id: 'u10.unreact.2',
            q: [{ p: t('Chlorbenzenas ir chloretenas nereaguoja SN būdu, nors jų C–Cl ryšys polinis.', 'Chlorobenzene and chloroethene do not react by SN although their C–Cl bond is polar.') }],
            steps: [cho(t('Kodėl jų halogenas sunkiai pakeičiamas?', 'Why is their halogen hard to replace?'), [
              tx('Chloro laisva pora konjuguota su $π$ sistema ($p,π$-konjugacija), todėl ryšys trumpesnis ir tvirtesnis.', 'A lone pair of chlorine is conjugated with the $π$ system ($p,π$ conjugation), so the bond is shorter and stronger.'),
              tx('Chloras čia yra stipri bazė.', 'Chlorine is a strong base here.'),
              tx('Šie junginiai yra nepolinės molekulės.', 'These compounds are non-polar molecules.'),
              tx('Anglis yra per daug užstota iš nugaros.', 'The carbon is too shielded from the back.')
            ], 0, t('Kas atsitinka su halogeno laisva elektronų pora greta $π$ sistemos?', 'What happens to the lone pair of the halogen next to a $π$ system?'),
              [{ p: t('Laisva pora persikelia į $π$ sistemą, ryšys C–Cl įgyja dalinio dvigubojo pobūdžio.', 'The lone pair is delocalised into the $π$ system and the C–Cl bond gains partial double-bond character.') },
                { resonance: [{ smi: 'C=CCl', opts: { lonePairs: [2] } }, { smi: '[CH2-]C=[Cl+]' }] }])],
            why: t('Dėl $p,π$-konjugacijos C–Hal ryšys halogenalkenuose ir halogenarenuose tvirtesnis negu halogenalkanuose. Todėl SN1 ir SN2 čia neįprastos, o norint vykdyti reakcijas reikia aukštos temperatūros ar specialių aktyvinančių grupių.', 'Because of $p,π$ conjugation the C–Hal bond in haloalkenes and haloarenes is stronger than in alkyl halides. SN1 and SN2 are therefore unusual here, and reactions need a high temperature or special activating groups.'),
            src: 'L10 p24'
          },
          {
            id: 'u10.unreact.3',
            q: [{ p: t('Chlorbenzenas kaitinamas su natrio hidroksidu 300 °C temperatūroje, po to parūgštinamas.', 'Chlorobenzene is heated with sodium hydroxide at 300 °C and then acidified.') }, { scheme: { items: [{ smi: 'Clc1ccccc1', name: t('chlorbenzenas', 'chlorobenzene') }, { arrow: '→', above: f('NaOH'), below: f('300 °C') }] } }],
            steps: [cho(t('Koks yra produktas?', 'What is the product?'), [mo('Oc1ccccc1'), tx('Reakcija nevyksta', 'No reaction'), mo('[O-]c1ccccc1.[Na+]'), mo('c1ccc(Oc2ccccc2)cc1')], 0,
              t('Kuris atomas jungiasi prie žiedo, kai chloras išeina, ir kas atsitinka po parūgštinimo?', 'Which atom bonds to the ring when chlorine leaves, and what does acidification do?'),
              t('Susidaro fenolis: hidroksidas pakeičia chlorą, o parūgštinimas paverčia fenoksidą fenoliu.', 'Phenol forms: hydroxide replaces chlorine and acidification turns phenoxide into phenol.'))],
            why: t('Halogenarenai reaguoja su nukleofilais tik aukštesnėje nei 200 °C temperatūroje. Taip pramonėje galima iš chlorbenzeno gauti fenolį.', 'Haloarenes react with nucleophiles only above 200 °C. This is how phenol can be made from chlorobenzene in industry.'),
            src: 'L10 p25',
            claims: [{ formula: ['Oc1ccccc1', 'C6H6O'] }]
          },
          {
            id: 'u10.unreact.4',
            q: [{ p: t('1-brompropenas veikiamas koncentruotu šarmų tirpalu.', '1-bromopropene is treated with a concentrated alkali solution.') }, { scheme: { items: [{ smi: 'CC=CBr', name: t('1-brompropenas', '1-bromopropene') }, { arrow: '→', above: f('NaOH') }] } }],
            steps: [cho(t('Kas susidaro?', 'What forms?'), [mo('CC#C'), mo('C=C=C'), mo('CC=CO'), mo('CCC#N')], 0,
              t('Ką stipri bazė gali atplėšti nuo kito dvigubojo ryšio atomo?', 'What can a strong base remove from the other carbon of the double bond?'),
              [{ p: t('Bazė atplėšia vandenilį nuo kito $C=C$ atomo, o bromidas išeina; dvigubasis ryšys virsta trigubuoju.', 'The base removes the hydrogen from the other $C=C$ carbon and bromide leaves; the double bond becomes a triple bond.') }, { mol: { smi: 'CC#C', name: t('propinas', 'propyne') } }])],
            why: t('Halogenalkenas su vandeniliu prie dvigubojo ryšio koncentruotame šarme eliminuojasi į alkiną: tai dehidrohalogeninimas: atskeliamas HX ir dvigubasis ryšys virsta trigubuoju.', 'A haloalkene with hydrogen on the double bond eliminates in concentrated alkali to an alkyne: this is dehydrohalogenation: HX is lost and the double bond becomes a triple bond.'),
            src: 'L10 p25',
            claims: [{ formula: ['CC#C', 'C3H4'] }]
          },
          {
            id: 'u10.unreact.5',
            q: [{ p: t('1-chlor-2,4-dinitrobenzenas reaguoja su hidroksido jonu lengvai, šiek tiek pašildžius.', '1-chloro-2,4-dinitrobenzene reacts with hydroxide readily on gentle warming.') }, { scheme: { items: [{ smi: 'Clc1ccc([N+](=O)[O-])cc1[N+](=O)[O-]', name: t('1-chlor-2,4-dinitrobenzenas', '1-chloro-2,4-dinitrobenzene') }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }] } }],
            steps: [
              cho(t('Koks yra produktas?', 'What is the product?'), [mo('Oc1ccc([N+](=O)[O-])cc1[N+](=O)[O-]'), mo('Oc1cc([N+](=O)[O-])cc([N+](=O)[O-])c1'), mo('Oc1c([N+](=O)[O-])cccc1[N+](=O)[O-]'), tx('Reakcija vyksta tik virš 200 °C', 'The reaction takes place only above 200 °C')], 0,
                t('Halogenas pakeičiamas nukleofilu.', 'The halogen is replaced by the nucleophile.'),
                t('Susidaro 2,4-dinitrofenolis.', '2,4-dinitrophenol forms.')),
              cho(t('Kodėl šis halogenarenas reaguoja lengviau už chlorbenzeną?', 'Why does this haloarene react more easily than chlorobenzene?'), [
                tx('Stiprios elektronų akceptorinės nitrogrupės mažina žiedo elektronų tankį ir leidžia nukleofilui pakeisti halogeną.', 'The strong electron-withdrawing nitro groups lower the electron density of the ring and allow a nucleophile to replace the halogen.'),
                tx('Nitrogrupės yra elektronų donorai ir stiprina nukleofilą.', 'Nitro groups are electron donors and strengthen the nucleophile.'),
                tx('Nitrogrupės paverčia chlorą geriausia baze.', 'Nitro groups make chlorine the best base.'),
                tx('Reakcija vyksta SN2 prie žiedo anglies iš nugaros.', 'The reaction is an SN2 on the ring carbon from the back.')
              ], 0, t('Kokį poveikį žiedui turi stiprios akceptorinės grupės?', 'What do strong electron-withdrawing groups do to the ring?'),
                t('Akceptorinės grupės, ypač orto ir para padėtyse, leidžia nukleofilui atakuoti žiedo anglį su halogenu.', 'Withdrawing groups, especially in the ortho and para positions, allow a nucleophile to attack the ring carbon bearing the halogen.'))
            ],
            why: t('Halogenarenai žiede su stipriomis elektronų akceptorinėmis grupėmis reaguoja su nukleofilais lengvai. Tuo grindžiamas ir Sangerio reagentas aminorūgščių sekai nustatyti.', 'Haloarenes with strong electron-withdrawing groups on the ring react readily with nucleophiles. Sanger’s reagent for determining amino acid sequences is based on this.'),
            src: 'L10 p26',
            claims: [{ name: ['Oc1ccc([N+](=O)[O-])cc1[N+](=O)[O-]', t('2,4-dinitrofenolis', '2,4-dinitrophenol')] }]
          },
          {
            id: 'u10.unreact.6',
            q: [{ p: t('Sangerio reagentas (1-fluor-2,4-dinitrobenzenas) reaguoja su peptido N-galo aminogrupe.', 'Sanger’s reagent (1-fluoro-2,4-dinitrobenzene) reacts with the N-terminal amino group of a peptide.') }, { mol: { smi: 'Fc1ccc([N+](=O)[O-])cc1[N+](=O)[O-]', name: t('1-fluor-2,4-dinitrobenzenas', '1-fluoro-2,4-dinitrobenzene') } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomą, kurį pakeičia nukleofilas.', 'Tap the atom that the nucleophile replaces.'),
                kind: 'atoms', mol: { smi: 'Fc1ccc([N+](=O)[O-])cc1[N+](=O)[O-]', opts: { numbers: 'all' } }, answer: [0],
                hint: t('Kuris atomas išeina kaip anijonas, kai nukleofilas jungiasi prie žiedo?', 'Which atom leaves as an anion when the nucleophile bonds to the ring?'),
                solution: t('Fluoras Nr. 1 išeina kaip fluoridas, o jo vietą užima aminorūgšties azotas.', 'Fluorine no. 1 leaves as fluoride and the nitrogen of the amino acid takes its place.')
              },
              cho(t('Kuris peptido atomas veikia kaip nukleofilas?', 'Which atom of the peptide acts as the nucleophile?'), [
                tx('N-galinės aminogrupės azotas, turintis laisvą elektronų porą.', 'The nitrogen of the N-terminal amino group, which has a lone pair.'),
                tx('Amido azotas (jo laisvoji pora konjuguota su $C=O$).', 'The amide nitrogen (its lone pair is conjugated with $C=O$).'),
                tx('Amido karbonilo anglis.', 'The carbonyl carbon of an amide.'),
                tx('C-galinės karboksigrupės vandenilis.', 'The hydrogen of the C-terminal carboxyl group.')
              ], 0, t('Kuris peptido atomas gali dovanoti elektronų porą naujam ryšiui?', 'Which atom of the peptide can donate an electron pair to a new bond?'),
                t('Laisva azoto elektronų pora sudaro naują C–N ryšį.', 'The lone pair of nitrogen forms the new C–N bond.'))
            ],
            why: t('Nitrogrupės aktyvuoja žiedą nukleofiliniam pakeitimui, todėl net silpnas nukleofilas (aminogrupė) išstumia fluoridą. Gautas dinitrofenilo darinys žymi N-galinę aminorūgštį.', 'Nitro groups activate the ring for nucleophilic substitution, so even a weak nucleophile (an amino group) pushes out fluoride. The resulting dinitrophenyl derivative marks the N-terminal amino acid.'),
            src: 'L10 p26'
          },
          {
            id: 'u10.unreact.7',
            q: [{ p: t('Chloretenas kaitinamas 100–200 °C temperatūroje su nukleofilu.', 'Chloroethene is heated at 100–200 °C with a nucleophile.') }],
            steps: [cho(t('Kas vyksta vietoje SN reakcijos?', 'What takes place instead of an SN reaction?'), [
              tx('Pašalinės reakcijos: eliminavimas, prisijungimas ir polimerizacija.', 'Side reactions: elimination, addition and polymerisation.'),
              tx('Greita SN2 reakcija.', 'A fast SN2 reaction.'),
              tx('SN1 per vinilo katijoną.', 'SN1 through a vinyl cation.'),
              tx('Nieko nevyksta, nors temperatūra aukšta.', 'Nothing happens although the temperature is high.')
            ], 0, t('Ką halogenalkenas gali daryti, be to, kad keičia halogeną?', 'What can a haloalkene do other than replace its halogen?'),
              t('Aukštoje temperatūroje vyrauja pašalinės reakcijos, o ne SN.', 'At high temperature side reactions predominate instead of SN.'))],
            why: t('Halogenalkenų SN reakcijoms reikia griežtų sąlygų, bet tada pradeda vykti kitos reakcijos: eliminavimas, prisijungimas ir polimerizacija. SN čia praktiškai nevyksta.', 'SN reactions of haloalkenes need harsh conditions, but then other reactions set in: elimination, addition and polymerisation. SN practically does not take place here.'),
            src: 'L10 p24'
          },
          {
            id: 'u10.unreact.8',
            q: [{ p: t('Šie halogenidai reaguoja su natrio cianidu dimetilsulfokside.', 'These halides react with sodium cyanide in dimethyl sulfoxide.') },
              { mol: [{ smi: 'CCCCBr', caption: t('a', 'a') }, { smi: 'Brc1ccccc1', caption: t('b', 'b') }, { smi: 'CC(C)(C)Br', caption: t('c', 'c') }, { smi: 'ClCc1ccccc1', caption: t('d', 'd') }, { smi: 'BrC1=CCCCC1', caption: t('e', 'e') }, { smi: 'CBr', caption: t('f', 'f') }] }],
            steps: [{
              prompt: t('Pažymėkite junginius, kurie pagrindinį produktą duoda SN2 būdu.', 'Pick the compounds whose main product forms by SN2.'),
              kind: 'multi', options: ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => tx(x, x)), answer: [0, 3, 5],
              hint: t('SN2 reikia sp³ anglies, kuri nėra tretinė.', 'SN2 needs an sp³ carbon that is not tertiary.'),
              solution: t('a ir d – halogenas prie pirminės sp³ anglies, f – prie metilo anglies: vyksta SN2. b ir e – halogenas prie sp² anglies, SN nevyksta. c – tretinis: puolimas iš nugaros užstotas, SN2 neįmanomas.', 'a and d have the halogen on a primary sp³ carbon and f on a methyl carbon: SN2 takes place. In b and e the halogen is on an sp² carbon, so no SN. c is tertiary: backside attack is blocked, so SN2 is impossible.')
            }],
            why: t('SN2 tinka pirminiams (ir metilo) sp³ halogenidams. Tretinis užstotas, o sp² halogenidai konjuguoti, todėl šiems halogenidams SN2 neįprastas.', 'SN2 suits primary (and methyl) sp³ halides. A tertiary one is shielded and sp² halides are conjugated, so SN2 is unusual for these.'),
            src: 'L10 p14, p24'
          }
        ]
      }
    ],
    coverage: {
      'S5.1': ['u10.sn2', 'u10.pick'],
      'S5.2': ['u10.elim'],
      'S5.8': ['u10.pick', 'u10.draw', 'u10.sn1'],
      'S5.9': ['u10.intra'],
      'S5.11': ['u10.sn1', 'u10.allyl']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
