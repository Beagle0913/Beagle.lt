// site/organic/units/u11.js: unit 11, alcohols and their reactions (lecture 11, seminar 5, lab 6)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });          // reagent labels: formulas only
  const tx = (lt, en) => ({ text: t(lt, en) });

  /* ---------- helpers shared by the generators ---------- */

  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const formulaOf = (ctx, s) => ctx.chem.formulaString(ctx.chem.parse(s));
  const firstMajor = (res) => { const p = res.products.find(x => x.major && !x.by); return p ? p.smi : null; };
  const majorsOf = (res) => res.products.filter(x => x.major && !x.by).map(x => x.smi);

  // Atom token spans of a SMILES string, in atom order (to swap one atom for a bracket atom without moving indices).
  function spans(smi) {
    const out = [];
    let i = 0;
    while (i < smi.length) {
      const c = smi[i];
      if (c === '[') { const j = smi.indexOf(']', i); out.push({ a: i, b: j + 1 }); i = j + 1; }
      else if ((c === 'C' && smi[i + 1] === 'l') || (c === 'B' && smi[i + 1] === 'r')) { out.push({ a: i, b: i + 2 }); i += 2; }
      else if (/[BCNOPSFIcnops]/.test(c)) { out.push({ a: i, b: i + 1 }); i++; }
      else if (c === '%') i += 3;
      else i++;
    }
    return out;
  }
  const replaceAtom = (smi, idx, text) => { const s = spans(smi)[idx]; return smi.slice(0, s.a) + text + smi.slice(s.b); };

  // the OH group of an alcohol: {o, c, k}: oxygen, carbinol carbon, number of carbon neighbours of that carbon (1, 2, 3)
  function site(chem, smi) {
    const m = chem.parse(smi);
    for (let i = 0; i < m.atoms.length; i++) {
      const a = m.atoms[i];
      if (a.el !== 'O' || a.h !== 1 || m.nbr[i].length !== 1 || a.charge) continue;
      const c = m.nbr[i][0];
      if (m.atoms[c].el !== 'C' || m.atoms[c].aromatic) continue;
      return { o: i, c, k: m.nbr[c].filter(j => m.atoms[j].el === 'C').length };
    }
    return null;
  }
  // the carbons of the C=C bonds of a molecule
  function alkeneCarbons(chem, smi) {
    const m = chem.parse(smi);
    const out = [];
    m.bonds.forEach(b => { if (b.order === 2 && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C' && !m.atoms[b.a].aromatic) out.push(b.a, b.b); });
    return out;
  }

  // options with the right one first; duplicates dropped; entries are SMILES strings or ready option objects
  function optionList(ctx, right, extras, n) {
    const key = (o) => (o.mol ? 'm:' + canon(ctx, o.mol.smi) : JSON.stringify(o));
    const seen = new Set();
    const out = [];
    [right].concat(extras).forEach(e => {
      if (!e || out.length >= n) return;
      const o = typeof e === 'string' ? { mol: { smi: e } } : e;
      const k = key(o);
      if (seen.has(k)) return;
      seen.add(k);
      out.push(o);
    });
    return out;
  }

  const nm = (ctx, smi) => {
    const lt = ctx.name.name(smi, { lang: 'lt' });
    const en = ctx.name.name(smi, { lang: 'en' });
    return lt && en ? { lt: lt.name, en: en.name } : null;
  };
  const nameStep = (ctx, smi, prompt, hint, why) => {
    const n = nm(ctx, smi);
    if (!n) return null;
    return {
      prompt: prompt || t('Pavadinkite produktą.', 'Name the product.'),
      kind: 'name', mol: { smi }, answer: { smi },
      hint: hint || t('Raskite pagrindinę grandinę ar žiedą su pagrindine grupe ir sunumeruokite taip, kad pakaitai gautų mažiausius numerius.', 'Find the parent chain or ring with the principal group and number it so the substituents get the lowest numbers.'),
      solution: why ? t(why.lt + ' Pavadinimas: ' + n.lt + '.', why.en + ' Name: ' + n.en + '.') : t('Pavadinimas: ' + n.lt + '.', 'Name: ' + n.en + '.')
    };
  };

  const CLS_LT = ['pirminis', 'antrinis', 'tretinis'];
  const CLS_EN = ['primary', 'secondary', 'tertiary'];
  const classOptions = () => [tx('Pirminis alkoholis', 'Primary alcohol'), tx('Antrinis alkoholis', 'Secondary alcohol'), tx('Tretinis alkoholis', 'Tertiary alcohol')];
  const classStep = (s) => ({
    prompt: t('Kokios klasės yra šis alkoholis?', 'What class of alcohol is this?'),
    kind: 'choice', options: classOptions(), answer: s.k - 1,
    hint: t('Alkoholio klasę nusako, kiek kitų anglies atomų prijungta prie anglies, turinčios OH grupę.', 'The class is set by how many other carbons are bonded to the carbon that carries the OH group.'),
    solution: t('Prie anglies atomo Nr. ' + (s.c + 1) + ' (su OH) prijungta anglies atomų: ' + s.k + ', todėl tai ' + CLS_LT[s.k - 1] + ' alkoholis.',
      'The carbon that carries the OH (no. ' + (s.c + 1) + ') has ' + s.k + ' carbon neighbour' + (s.k === 1 ? '' : 's') + ', so this is a ' + CLS_EN[s.k - 1] + ' alcohol.')
  });

  /* ---------- alcohol pools (all stay within the namer's scope; names are never spliced into sentences) ---------- */
  const PRIM = ['CCO', 'CCCO', 'CCCCO', 'CC(C)CO', 'CCCCCO', 'CC(C)CCO', 'CCC(C)CO', 'CCCCCCO', 'OCC1CCCC1', 'OCC1CCCCC1', 'CCC(CC)CO', 'CCCCCCCO'];
  const SEC = ['CC(C)O', 'CCC(C)O', 'CCCC(C)O', 'CCC(O)CC', 'CCCCC(C)O', 'OC1CCCC1', 'OC1CCCCC1', 'CC(C)CC(C)O', 'CC1CCCCC1O', 'CCC(O)CCC', 'OC1CCCCCC1', 'CCCCCC(C)O', 'CC1CCCC1O'];
  const TERT = ['CC(C)(C)O', 'CCC(C)(C)O', 'CCC(C)(O)CC', 'CC1(O)CCCCC1', 'CC1(O)CCCC1', 'CC(C)(O)CCC', 'CCC(C)(O)CCC', 'CC1(O)CCCCC1C', 'CC(C)(O)C(C)C', 'CCC(CC)(CC)O', 'CCCC(C)(C)O', 'CC1(O)CCCC1C', 'CCC1(O)CCCC1'];
  const ALL_ALC = PRIM.concat(SEC, TERT);
  // isomeric alcohols of the pools (same formula, other structure)
  const isoAlcohols = (ctx, smi) => ALL_ALC.filter(x => formulaOf(ctx, x) === formulaOf(ctx, smi) && canon(ctx, x) !== canon(ctx, smi));

  // an unreactive-looking decoy ether of the same formula as some alcohols (by formula)
  const ETHER_BY_FORMULA = { C3H8O: 'CCOC', C4H10O: 'CCCOC', C5H12O: 'CCCOCC', C6H14O: 'CCCOCCC', C7H16O: 'CCCCOCCC', C6H12O: 'COC1CCCC1', C7H14O: 'COC1CCCCC1', C8H18O: 'CCCCOCCCC' };

  const oxOfRule = (react, a, rule) => { const r = react.run('alc.ox', [a], { reagent: rule }); return r.none ? null : firstMajor(r); };

  const HAL = ['Cl', 'Br', 'I'];
  const otherHal = (X) => HAL.filter(h => h !== X);
  const HX_SMI = { Cl: 'Cl', Br: 'Br', I: 'I' };      // the drawer shows these as HCl, HBr, HI

  /* ================= notes ================= */
  const NOTES = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'struct',
      title: t('Alkoholių sandara, pavadinimai ir klasės', 'Structure, names and classes of alcohols'),
      blocks: [
        { h: t('Kas yra alkoholis?', 'What is an alcohol?') },
        {
          p: t('Alkoholiais vadinami junginiai, kurių molekulėje viena ar kelios hidroksigrupės $OH$ prijungtos prie sp³ hibridizuotų anglies atomų. Sotieji monohidroksiliai alkoholiai atitinka formulę CₙH₂ₙ₊₁OH. Dėl deguonies elektroneigiamumo ryšiai $C-O$ ir $O-H$ yra poliniai, o tai lemia beveik visas alkoholių savybes.',
            'Alcohols are compounds in which one or more hydroxyl groups $OH$ are bonded to sp³ hybridised carbon atoms. Saturated monohydric alcohols fit the formula CₙH₂ₙ₊₁OH. Because oxygen is electronegative, both the $C-O$ and the $O-H$ bonds are polar, and this explains nearly all the behaviour of alcohols.'),
          src: 'L11 p2, T p71'
        },
        {
          mol: [{ smi: 'CO', name: t('metanolis', 'methanol') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'CC(C)O', name: t('2-propanolis', '2-propanol') }, { smi: 'OCC(O)CO', name: t('glicerolis', 'glycerol') }, { smi: 'OCc1ccccc1', name: t('benzilo alkoholis', 'benzyl alcohol') }],
          src: 'L11 p2'
        },
        {
          rule: t('Pavadinimas: pagrindinė grandinė apima anglį su $OH$, galūnė yra -olis, o grandinė numeruojama nuo galo, arčiau kurio yra $OH$. Numeris rašomas prieš pavadinimą: 2-butanolis.',
            'Name: the parent chain contains the carbon with the $OH$, the ending is -ol, and the chain is numbered from the end nearer to the $OH$. The number goes before the name: 2-butanol.'),
          src: 'L11 p2'
        },
        {
          pitfall: t('Numeruokite nuo galo, arčiau kurio yra $OH$, net jei pakaitas gauna didesnį numerį. Todėl šis alkoholis yra 4-metil-2-pentanolis, o ne 2-metil-4-pentanolis.',
            'Number from the end nearer to the $OH$ even if a substituent then gets a higher number. This alcohol is therefore 4-methyl-2-pentanol, not 2-methyl-4-pentanol.')
        },
        { mol: { smi: 'CC(O)CC(C)C', name: t('4-metil-2-pentanolis', '4-methyl-2-pentanol') } },
        { h: t('Alkoholių klasės', 'Classes of alcohols') },
        {
          p: t('Alkoholio klasę nusako anglis, prie kurios prijungta $OH$: pirminėje ji turi vieną kaimynę anglį, antrinėje – dvi, tretinėje – tris. Klasė svarbiausia, nes nuo jos priklauso halogeninimo mechanizmas, dehidratacija ir oksidacija.',
            'The class of an alcohol is set by the carbon that carries the $OH$: it has one carbon neighbour in a primary alcohol, two in a secondary and three in a tertiary one. The class matters most, because it decides the mechanism of halogenation, the dehydration and the oxidation.'),
          src: 'L11 p8, p20'
        },
        { mol: [{ smi: 'CCCO', caption: t('pirminis: 1-propanolis', 'primary: 1-propanol') }, { smi: 'CCC(C)O', caption: t('antrinis: 2-butanolis', 'secondary: 2-butanol') }, { smi: 'CC(C)(C)O', caption: t('tretinis: 2-metil-2-propanolis', 'tertiary: 2-methyl-2-propanol') }], src: 'L11 p8' },
        {
          p: t('Alkoholių gausu gamtoje: geraniolis kvepia rožėmis ir geranijomis, cholesterolis būtinas steroidų biosintezei, vitaminas $D3$ reguliuoja kalcio kiekį. Visuose šiuose junginiuose yra ta pati $OH$ grupė, todėl jie reaguoja pagal tuos pačius dėsnius.',
            'Alcohols are common in nature: geraniol smells of roses and geraniums, cholesterol is needed for steroid biosynthesis and vitamin $D3$ regulates calcium. They all contain the same $OH$ group, so they follow the same rules.'),
          src: 'L11 p3'
        },
        { mol: [{ smi: 'CC(C)=CCCC(C)=CCO', name: t('3,7-dimetil-2,6-oktadien-1-olis', '3,7-dimethylocta-2,6-dien-1-ol') }], src: 'L11 p3' },
        {
          pitfall: t('Ne kiekvienas junginys su $OH$ yra alkoholis. Jei $OH$ prijungta prie aromatinio žiedo, tai fenolis, jei prie $C=C$ anglies – enolis, jei prie karbonilo – karboksirūgštis. Šiuose junginiuose OH sudaro kitos klasės funkcinę grupę.',
            'Not every compound with an $OH$ is an alcohol. An $OH$ on an aromatic ring makes a phenol, on a $C=C$ carbon an enol, on a carbonyl carbon a carboxylic acid. In these compounds the OH forms a functional group of another class.')
        },
        {
          example: {
            q: [{ p: t('Pavadinkite alkoholį ir nustatykite jo klasę. Skaičiai prie atomų rodo grandinės numeraciją.', 'Name the alcohol and decide its class. The numbers at the atoms give the chain numbering.') },
              { mol: { smi: 'CC(O)CC(C)C', name: t('4-metil-2-pentanolis', '4-methyl-2-pentanol'), opts: { numbers: { 0: '1', 1: '2', 3: '3', 4: '4', 6: '5' } } } }],
            steps: [
              [{ p: t('Ilgiausia grandinė, kurioje yra anglis su $OH$, turi penkis anglies atomus: pentanolis.', 'The longest chain that contains the carbon with the $OH$ has five carbons: a pentanol.') }],
              [{ p: t('Numeruojame nuo galo, arčiau kurio yra $OH$: ji ties C2. Metilo pakaitas yra ties C4.', 'We number from the end nearer the $OH$: it sits on C2. The methyl substituent is on C4.') }],
              [{ p: t('Pavadinimas: 4-metil-2-pentanolis.', 'Name: 4-methyl-2-pentanol.') }, { mol: { smi: 'CC(O)CC(C)C', name: t('4-metil-2-pentanolis', '4-methyl-2-pentanol') } }],
              [{ p: t('Anglis C2 turi dvi kaimynes anglis (C1 ir C3): tai antrinis alkoholis.', 'Carbon C2 has two carbon neighbours (C1 and C3): this is a secondary alcohol.') }]
            ]
          },
          claims: [{ name: ['CC(O)CC(C)C', { lt: '4-metil-2-pentanolis', en: '4-methyl-2-pentanol' }] }, { carbon: ['CC(O)CC(C)C', 1, 2] }, { formula: ['CC(O)CC(C)C', 'C6H14O'] }]
        },
        { h: t('Kur reaguoja alkoholis?', 'Where does an alcohol react?') },
        {
          p: t('Alkoholio molekulėje yra keli reakcijos centrai. Deguonis traukia elektronus, todėl anglis tampa $δ+$ ir ją gali atakuoti nukleofilas, o vandenilis tampa rūgštus. Deguonis turi laisvųjų elektronų porų, todėl pats gali būti nukleofilas.',
            'An alcohol molecule has several reaction centres. Oxygen pulls electrons, so the carbon is $δ+$ and a nucleophile can attack it, and the hydrogen becomes acidic. Oxygen has lone pairs, so it can itself act as a nucleophile.'),
          src: 'L11 p5, T p71'
        },
        { mol: { smi: 'CCO', opts: { deltas: { 1: '+', 2: '-' } }, caption: t('poliarizuotas $C-O$ ryšys', 'the polarised $C-O$ bond') }, src: 'L11 p5' },
        {
          table: {
            head: [t('Centras', 'Centre'), t('Reakcija', 'Reaction'), t('Kur sužinoti', 'Where')],
            rows: [
              [t('$O-H$ vandenilis', '$O-H$ hydrogen'), t('rūgštinės savybės: alkoksidas', 'acidic behaviour: alkoxide'), t('2 skyrius', 'section 3')],
              [t('$δ+$ anglis', '$δ+$ carbon'), t('SN: halogenalkanas', 'SN: haloalkane'), t('3 skyrius', 'section 4')],
              [t('$β$ vandenilis', '$β$ hydrogen'), t('E: alkenas', 'E: alkene'), t('4 skyrius', 'section 5')],
              [t('deguonies laisvoji pora', 'oxygen lone pair'), t('SN, kai nukleofilas – alkoholis: eteris, esteris', 'SN with the alcohol as nucleophile: ether, ester'), t('5 skyrius', 'section 6')],
              [t('$C-H$ prie anglies su $OH$', '$C-H$ on the carbon with the $OH$'), t('oksidacija: aldehidas, ketonas, rūgštis', 'oxidation: aldehyde, ketone, acid'), t('6 skyrius', 'section 7')]
            ]
          },
          src: 'L11 p5'
        },
        { practice: 'u11.cls' }
      ]
    },
    /* ------------------------------------------------------------ 2 */
    {
      id: 'phys',
      title: t('Fizikinės savybės: vandeniliniai ryšiai', 'Physical properties: hydrogen bonds'),
      blocks: [
        { h: t('Kodėl alkoholiai verda aukštai?', 'Why do alcohols boil high?') },
        {
          p: t('$O-H$ grupės vandenilis yra $δ+$, o gretimos molekulės deguonis – $δ−$ ir turi laisvąsias poras. Todėl alkoholio molekulės tarpusavyje sudaro vandenilinius ryšius $O-H···O$. Jiems nutraukti reikia energijos, todėl alkoholiai verda daug aukščiau nei tokio paties dydžio molekulės be $OH$ grupės.',
            'The hydrogen of an $O-H$ group is $δ+$, and the oxygen of a neighbouring molecule is $δ−$ and carries lone pairs. Alcohol molecules therefore form hydrogen bonds $O-H···O$ with each other. Energy is needed to break them, so alcohols boil much higher than molecules of the same size without an $OH$ group.'),
          src: 'L11 p4'
        },
        {
          table: {
            head: [t('Junginys', 'Compound'), t('Formulė', 'Structure'), t('Virimo temperatūra', 'Boiling point')],
            rows: [
              [t('etanas', 'ethane'), { smi: 'CC' }, t('−89 °C', '−89 °C')],
              [t('chloretanas', 'chloroethane'), { smi: 'CCCl' }, t('12 °C', '12 °C')],
              [t('etanolis', 'ethanol'), { smi: 'CCO' }, t('78 °C', '78 °C')]
            ]
          },
          src: 'L11 p4'
        },
        {
          rule: t('Vandeniliniai ryšiai kyla tarp $O-H$ grupės vandenilio ir kitos molekulės deguonies; jie pakelia virimo temperatūrą ir didina tirpumą vandenyje. Eteris, haloalkanas ir alkanas $O-H$ neturi.', 'Hydrogen bonds form between the hydrogen of an $O-H$ group and the oxygen of another molecule; they raise the boiling point and the solubility in water. An ether, a haloalkane and an alkane have no $O-H$.'),
          src: 'L11 p4'
        },
        { h: t('Tirpumas vandenyje', 'Solubility in water') },
        {
          p: t('Alkoholio molekulė turi hidrofilinę $OH$ ir hidrofobinę alkilo dalį. Anglies grandinei ilgėjant, vyrauja hidrofobinė dalis ir tirpumas vandenyje mažėja. Metanolis, etanolis ir propanoliai su vandeniu maišosi visiškai, o 1-oktanolis beveik netirpsta.',
            'An alcohol molecule has a hydrophilic $OH$ and a hydrophobic alkyl part. As the carbon chain grows, the hydrophobic part dominates and the solubility in water falls. Methanol, ethanol and the propanols mix with water completely, whereas 1-octanol is nearly insoluble.'),
          src: 'L11 p4'
        },
        { mol: [{ smi: 'CO', caption: t('metanolis: tirpsta bet kokiomis proporcijomis', 'methanol: mixes in all proportions') }, { smi: 'CCCCCCCCO', caption: t('1-oktanolis: beveik netirpsta', '1-octanol: nearly insoluble') }], src: 'L11 p4' },
        {
          pitfall: t('Virimo temperatūrą lemia ne tik molekulinė masė. Chloretanas (64,5 g/mol) verda žemiau už etanolį (46 g/mol), nes etanolis sudaro vandenilinius ryšius, o chloretanas – ne.',
            'The boiling point is not set by the molar mass alone. Chloroethane (64.5 g/mol) boils lower than ethanol (46 g/mol) because ethanol forms hydrogen bonds and chloroethane does not.')
        },
        {
          example: {
            q: [{ p: t('1-propanolis ir metoksietanas turi tą pačią formulę. Kuris verda aukščiau ir kodėl?', '1-Propanol and methoxyethane have the same formula. Which boils higher, and why?') },
              { mol: [{ smi: 'CCCO', name: t('1-propanolis', '1-propanol') }, { smi: 'CCOC', name: t('metoksietanas', 'methoxyethane') }] }],
            steps: [
              [{ p: t('Abu junginiai yra izomerai ($C3H8O$), todėl masė nesvarbi.', 'Both are isomers ($C3H8O$), so the mass does not matter.') }],
              [{ p: t('Alkoholis turi $O-H$ grupę ir sudaro vandenilinius ryšius; eteris vandenilio prie deguonies neturi.', 'The alcohol has an $O-H$ group and forms hydrogen bonds; the ether has no hydrogen on oxygen.') }],
              [{ p: t('Aukščiau verda 1-propanolis (97 °C); metoksietanas verda 7 °C.', '1-Propanol boils higher (97 °C); methoxyethane boils at 7 °C.') }]
            ]
          },
          claims: [{ formula: ['CCCO', 'C3H8O'] }, { formula: ['CCOC', 'C3H8O'] }]
        },
        { practice: 'u11.hb' }
      ]
    },
    /* ------------------------------------------------------------ 3 */
    {
      id: 'acid',
      title: t('Rūgštinės savybės: alkoksidai', 'Acidic behaviour: alkoxides'),
      blocks: [
        { h: t('Su kuo alkoholis reaguoja kaip rūgštis?', 'With what does an alcohol react as an acid?') },
        {
          p: t('Alkoholio rūgštingumas toks menkas ($pKa$ 15–18), kad jis prilygsta vandens. Dėl to deprotonuoti jį gali tik šarminiai ir žemės šarminiai metalai arba itin stipri bazė, pavyzdžiui, $NaH$; vandeninis šarmas nepakanka. Susidariusi druska vadinama alkoksidu, arba alkoholiatu.',
            'Alcohols are very weak acids ($pKa$ 15–18), similar to water. They therefore react only with alkali and alkaline-earth metals and with very strong bases such as $NaH$. Monohydric alcohols do not react with alkalis. The products are called alkoxides, or alcoholates.'),
          src: 'L11 p6'
        },
        {
          scheme: { items: [{ smi: 'CCO' }, { plus: true }, { smi: '[Na]' }, { arrow: '→' }, { smi: 'CC[O-].[Na+]' }, { plus: true }, { smi: '[H][H]' }] },
          caption: t('Natris išstumia vandenilį: dvi alkoholio molekulės duoda vieną $H2$ molekulę.', 'Sodium displaces hydrogen: two alcohol molecules give one $H2$ molecule.'),
          src: 'L11 p6'
        },
        {
          p: t('Su $NaH$ reakciją sukelia hidrido jonas $H−$. Jis yra bazė: savo elektronų pora sudaro ryšį su alkoholio vandeniliu, o $O-H$ elektronai lieka deguoniui. Susidaręs $H2$ pabėga, todėl alkoholis virsta alkoksidu visiškai.',
            'With $NaH$ the hydride ion $H−$ does the work. It is a base: its electron pair bonds to the hydrogen of the alcohol while the $O-H$ electrons stay on oxygen. The $H2$ that forms escapes, so the alcohol is converted into the alkoxide completely.'),
          src: 'L11 p6'
        },
        {
          mech: [{
            scheme: { items: [{ smi: 'CO', opts: { allH: true } }, { plus: true }, { smi: '[H-].[Na+]', opts: { lonePairs: true } }] },
            arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H1' } }, { from: { m: 0, b: [1, 'H1'] }, to: { m: 0, a: 1 } }],
            note: t('$H−$ atplėšia protoną; $O-H$ elektronai pereina deguoniui.', '$H−$ removes the proton; the $O-H$ electrons go to oxygen.')
          }],
          caption: t('Alkoholis ir $NaH$ (metanolis parodytas dėl aiškumo).', 'An alcohol and $NaH$ (methanol is shown for clarity).'),
          src: 'L11 p6'
        },
        { scheme: { items: [{ smi: 'C[O-].[Na+]' }, { plus: true }, { smi: '[H][H]' }] }, caption: t('Produktai: alkoksidas ir vandenilis.', 'Products: the alkoxide and hydrogen.') },
        {
          p: t('Su metalu mechanizmas kitoks: alkoholio molekulė adsorbuojasi ant metalo paviršiaus, metalo elektronas pereina $O-H$ ryšiui ir šis homolitiškai skyla. Susidaro alkoksido anijonas ir vandenilio radikalas, o du radikalai sudaro $H2$. Radikalo atomui pavaizduoti naudojama viena pusinė rodyklė.',
            'With a metal the mechanism is different: the alcohol molecule is adsorbed on the metal surface, an electron of the metal passes into the $O-H$ bond, which then breaks homolytically. An alkoxide anion and a hydrogen radical result, and two radicals combine to $H2$. A single-barbed arrow shows the movement of one electron.'),
          src: 'L11 p7'
        },
        {
          mech: [{
            scheme: { items: [{ smi: 'CO', opts: { allH: true } }, { plus: true }, { smi: '[Na]' }] },
            arrows: [{ from: { m: 1, a: 0 }, to: { m: 0, mid: [1, 'H1'] }, half: true }, { from: { m: 0, b: [1, 'H1'] }, to: { m: 0, a: 'H1' }, half: true }],
            note: t('Natrio elektronas pereina $O-H$ ryšiui; ryšys skyla homolitiškai.', 'An electron of sodium passes to the $O-H$ bond; the bond breaks homolytically.')
          }],
          src: 'L11 p7'
        },
        { scheme: { items: [{ smi: 'C[O-]' }, { plus: true }, { smi: '[Na+]' }, { plus: true }, { smi: '[H]' }, { arrow: '→' }, { smi: '[H][H]' }] }, caption: t('Du vandenilio radikalai sudaro $H2$.', 'Two hydrogen radicals combine to $H2$.') },
        {
          rule: t('Alkoholis + $Na$, $K$ arba $NaH$ → alkoksidas + $H2$. Požymis: vandenilio dujų burbuliukai. Su $NaOH$ ar $KOH$ alkoholis nereaguoja.',
            'Alcohol + $Na$, $K$ or $NaH$ → alkoxide + $H2$. Sign: bubbles of hydrogen gas. An alcohol does not react with $NaOH$ or $KOH$.'),
          src: 'L11 p6'
        },
        {
          p: t('Alkoksidas yra stipresnė bazė už $OH−$, todėl vandenyje jis grįžta į alkoholį: $C2H5ONa + H2O → C2H5OH + NaOH$. Todėl alkoksidas laikomas be vandens, o po jo hidrolizės fenolftaleinas parausta (6 laboratorinis darbas).',
            'An alkoxide is a stronger base than $OH−$, so in water it returns to the alcohol: $C2H5ONa + H2O → C2H5OH + NaOH$. That is why an alkoxide is kept dry, and after its hydrolysis phenolphthalein turns crimson (lab 6).'),
          src: 'LW6 p2'
        },
        {
          pitfall: t('Nesumaišykite rūgštingumo su stipriu reagavimu. Natris su alkoholiu reaguoja dėl to, kad yra stiprus reduktorius, o ne dėl to, kad alkoholis yra stipri rūgštis: jo $pKa$ didesnis net už vandens.',
            'Do not confuse acidity with a vigorous reaction. Sodium reacts with an alcohol because it is a strong reductant, not because the alcohol is a strong acid: its $pKa$ is even higher than that of water.')
        },
        {
          example: {
            q: [{ p: t('Parašykite 2-metil-2-propanolio reakciją su kaliu ir pasakykite, ką pamatysime.', 'Write the reaction of 2-methyl-2-propanol with potassium and say what you would see.') },
              { mol: { smi: 'CC(C)(C)O', name: t('2-metil-2-propanolis', '2-methyl-2-propanol') } }],
            steps: [
              [{ p: t('Alkoholis reaguoja kaip rūgštis, o kalis – kaip reduktorius.', 'The alcohol reacts as an acid and potassium acts as the reductant.') }],
              [{ p: t('Kalis atiduoda elektroną, alkoholio protonas virsta $H2$, o deguonis lieka su neigiamu krūviu: kalio tret-butoksidas.', 'Potassium gives up an electron, the proton of the alcohol ends up as $H2$ and oxygen keeps the negative charge: potassium tert-butoxide.') }, { scheme: { items: [{ smi: 'CC(C)(C)O' }, { arrow: '→', above: f('K') }, { smi: 'CC(C)(C)[O-].[K+]' }, { plus: true }, { smi: '[H][H]' }] } }],
              [{ p: t('Požymis – vandenilio dujų burbuliukai (tretinis alkoholis reaguoja lėčiau nei pirminis).', 'The sign is bubbles of hydrogen gas (a tertiary alcohol reacts more slowly than a primary one).') }]
            ]
          },
          claims: [{ react: ['alc.na', ['CC(C)(C)O'], { metal: 'K' }, 'CC(C)(C)[O-].[K+]'] }]
        },
        { practice: 'u11.acid' },
        { practice: 'u11.acidwhy' }
      ]
    },
    /* ------------------------------------------------------------ 4 */
    {
      id: 'hx',
      title: t('Alkoholiai virsta halogenalkanais (SN)', 'Alcohols to haloalkanes (SN)'),
      blocks: [
        { h: t('Reagentai ir mechanizmai', 'Reagents and mechanisms') },
        {
          p: t('Visų klasių alkoholiai su $HI$, $HBr$ ar $HCl$, taip pat su $PBr3$, $PBr5$, $PCl5$ ir $SOCl2$ virsta halogenalkanais, nes $OH$ pakeičiama halogenu. Pats $OH−$ yra bloga nueinančioji grupė, todėl rūgštis ją pirma protonuoja: $OH2+$ išeina kaip vanduo.',
            'Primary, secondary and tertiary alcohols react with hydrogen halides ($HI$, $HBr$, $HCl$) and with other reagents ($PBr3$, $PBr5$, $PCl5$, $SOCl2$): the $OH$ is replaced by a halogen. $OH−$ itself is a poor leaving group, so the acid protonates it first and $OH2+$ leaves as water.'),
          src: 'L11 p8'
        },
        {
          scheme: { items: [{ smi: 'CCCO' }, { plus: true }, { smi: 'I' }, { arrow: '→', above: f('Δ') }, { smi: 'CCCI' }, { plus: true }, { smi: 'O' }], maxWidth: 560 },
          caption: t('Pirminis alkoholis: 1-propanolis ir $HI$ duoda 1-jodpropaną.', 'A primary alcohol: 1-propanol and $HI$ give 1-iodopropane.'), src: 'L11 p8'
        },
        {
          scheme: { items: [{ smi: 'CC(C)(C)O' }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'CC(C)(C)Cl' }, { plus: true }, { smi: 'O' }], maxWidth: 560 },
          caption: t('Tretinis alkoholis reaguoja be kaitinimo.', 'A tertiary alcohol reacts without heating.'), src: 'L11 p8'
        },
        {
          scheme: { items: [{ smi: 'CCCO' }, { arrow: '→', above: f('PBr3') }, { smi: 'CCCBr' }, { plus: true }, { smi: 'CCO' }, { arrow: '→', above: f('SOCl2') }, { smi: 'CCCl' }], maxWidth: 560 },
          caption: t('Tie patys halogenalkanai gaunami ir su $PBr3$ ar $SOCl2$ (be $HX$).', 'The same haloalkanes also form with $PBr3$ or $SOCl2$ (without $HX$).'), src: 'L11 p8'
        },
        {
          rule: t('Pirminiai alkoholiai reaguoja pagal SN2 (vienas žingsnis, nukleofilas iš galinės pusės), antriniai ir tretiniai – pagal SN1 (karbokatijono stadija). Rezultatas visada halogenalkanas su tuo pačiu skeletu.',
            'Primary alcohols react by SN2 (one step, the nucleophile attacks from the back); secondary and tertiary alcohols react by SN1 (through a carbocation). The result is always a haloalkane with the same skeleton.'),
          src: 'L11 p8, p9, p10'
        },
        { h: t('SN2: pirminiai alkoholiai', 'SN2: primary alcohols') },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CCO', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 stadija: deguonies pora sudaro ryšį su $H+$ ($HBr$ elektronai pereina bromui).', 'Stage 1: an oxygen lone pair bonds to $H+$ (the $HBr$ electrons go to bromine).')
            },
            {
              scheme: { items: [{ smi: 'CC[OH2+]' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
              note: t('2 stadija: bromidas atakuoja anglį iš galinės pusės, o $H2O$ išeina vienu metu.', 'Stage 2: bromide attacks the carbon from the back while $H2O$ leaves at the same moment.')
            }
          ],
          src: 'L11 p10'
        },
        { scheme: { items: [{ smi: 'CCBr' }, { plus: true }, { smi: 'O' }] }, caption: t('Produktai: bromoetanas ir vanduo.', 'Products: bromoethane and water.') },
        { h: t('SN1: antriniai ir tretiniai alkoholiai', 'SN1: secondary and tertiary alcohols') },
        {
          p: t('Šie alkoholiai sudaro stabilų karbokatijoną. Protonuotas alkoholis praranda vandenį ir susidaro katijonas (lėtoji stadija), o halogenidas prie jo prisijungia (greitoji). Katijonas gali ir prarasti protoną: tada šalutinis produktas yra alkenas (E1).',
            'These alcohols form a stable carbocation. The protonated alcohol loses water to give the cation (the slow stage) and the halide then bonds to it (the fast stage). The cation can also lose a proton: the side product is then an alkene (E1).'),
          src: 'L11 p9'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CC(C)(C)O', opts: { lonePairs: [4] } }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, lp: 4 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 stadija: protonuojamas deguonis.', 'Stage 1: oxygen is protonated.')
            },
            {
              scheme: { items: [{ smi: 'CC(C)(C)[OH2+]' }] },
              arrows: [{ from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }],
              note: t('2 stadija (lėtoji): $C-O$ elektronai pereina deguoniui, išeina $H2O$.', 'Stage 2 (slow): the $C-O$ electrons go to oxygen and $H2O$ leaves.')
            },
            {
              scheme: { items: [{ smi: 'C[C+](C)C' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
              note: t('3 stadija (greitoji): bromidas jungiasi prie karbokatijono.', 'Stage 3 (fast): bromide bonds to the carbocation.')
            }
          ],
          src: 'L11 p9'
        },
        { scheme: { items: [{ smi: 'CC(C)(C)Br' }, { plus: true }, { smi: 'O' }] }, caption: t('Produktai: 2-brom-2-metilpropanas ir vanduo.', 'Products: 2-bromo-2-methylpropane and water.') },
        {
          pitfall: t('SN2 nereiškia „vienos žingsnio“ be protonavimo. Prieš nukleofilo ataką visada vyksta protonavimas: be jo $OH−$ neišeitų, nes jis blogai išeinanti grupė.',
            'SN2 does not mean there is no protonation. Protonation always comes first: without it the $OH−$ would not leave, because it is a poor leaving group.')
        },
        {
          example: {
            q: [{ p: t('Kokiu mechanizmu 1-butanolis ir 2-metil-2-propanolis reaguoja su $HBr$? Parašykite produktus.', 'By which mechanism do 1-butanol and 2-methyl-2-propanol react with $HBr$? Write the products.') },
              { mol: [{ smi: 'CCCCO', name: t('1-butanolis', '1-butanol') }, { smi: 'CC(C)(C)O', name: t('2-metil-2-propanolis', '2-methyl-2-propanol') }] }],
            steps: [
              [{ p: t('1-butanolis yra pirminis alkoholis: pirminis karbokatijonas per nestabilus, todėl vyksta SN2.', '1-Butanol is primary: a primary carbocation is too unstable, so the reaction is SN2.') }, { mol: { smi: 'CCCCBr', name: t('1-brombutanas', '1-bromobutane') } }],
              [{ p: t('2-metil-2-propanolis yra tretinis: jis sudaro tretinį karbokatijoną, todėl vyksta SN1.', '2-Methyl-2-propanol is tertiary: it forms a tertiary carbocation, so the reaction is SN1.') }, { mol: { smi: 'CC(C)(C)Br', name: t('2-brom-2-metilpropanas', '2-bromo-2-methylpropane') } }]
            ]
          },
          claims: [{ react: ['alc.hx', ['CCCCO'], { X: 'Br' }, 'CCCCBr'] }, { react: ['alc.hx', ['CC(C)(C)O'], { X: 'Br' }, 'CC(C)(C)Br'] }, { name: ['CCCCBr', { lt: '1-brombutanas', en: '1-bromobutane' }] }, { name: ['CC(C)(C)Br', { lt: '2-brom-2-metilpropanas', en: '2-bromo-2-methylpropane' }] }]
        },
        { practice: 'u11.hx' },
        { practice: 'u11.mech' }
      ]
    },
    /* ------------------------------------------------------------ 5 */
    {
      id: 'dehyd',
      title: t('Dehidratacija: alkenai ir eteriai', 'Dehydration: alkenes and ethers'),
      blocks: [
        { h: t('Vidumolekulinė dehidratacija: alkenai (E1)', 'Intramolecular dehydration: alkenes (E1)') },
        {
          p: t('Stiprios mineralinės rūgštys ($H2SO4$, $H3PO4$) kaitinant iš antrinio ar tretinio alkoholio molekulės pašalina vandenį ir gaunamas alkenas. Tretiniai alkoholiai dehidratuojasi lengviausiai, antriniai sunkiau, nes karbokatijonas stabilumas mažėja. Aukštesnėje temperatūroje alkenų gaunama ir iš pirminių alkoholių.',
            'When secondary and tertiary alcohols are heated with strong mineral acids ($H2SO4$, $H3PO4$), water leaves a single molecule and an alkene forms. Tertiary alcohols dehydrate most easily and secondary ones less so, because the stability of the carbocation falls. At a higher temperature alkenes also form from primary alcohols.'),
          src: 'L11 p12'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CC1(O)CCCCC1', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'OS(=O)(=O)O', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 stadija: alkoholis protonuojamas.', 'Stage 1: the alcohol is protonated.')
            },
            {
              scheme: { items: [{ smi: 'CC1([OH2+])CCCCC1' }] },
              arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
              note: t('2 stadija: išeina $H2O$, lieka tretinis karbokatijonas.', 'Stage 2: $H2O$ leaves and a tertiary carbocation remains.')
            },
            {
              scheme: { items: [{ smi: 'C[C+]1CCCCC1', opts: { allH: true } }, { plus: true }, { smi: 'O', opts: { allH: true, lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H2' } }, { from: { m: 0, b: [2, 'H2'] }, to: { m: 0, mid: [1, 2] } }],
              note: t('3 stadija: vanduo kaip bazė atplėšia $β$ protoną, o $C-H$ elektronai sudaro dvigubąjį ryšį.', 'Stage 3: water acts as a base and removes a $β$ proton; the $C-H$ electrons form the double bond.')
            }
          ],
          src: 'L11 p12, p27'
        },
        { scheme: { items: [{ smi: 'CC1=CCCCC1', name: t('1-metilcikloheksenas', '1-methylcyclohexene') }, { plus: true }, { smi: '[OH3+]' }] }, caption: t('Produktas – 1-metilcikloheksenas.', 'The product is 1-methylcyclohexene.') },
        {
          rule: t('Zaicevo taisyklė: iš kelių galimų alkenų daugiausia susidaro tas, kurio $C=C$ apsuptas daugiausia alkilgrupių; tam protonas turi pasitraukti nuo kaimyninės anglies, kuri turi mažiausiai $H$.',
            'Zaitsev’s rule: when several alkenes can form, the one whose double bond carries more alkyl groups predominates: the proton leaves the neighbouring carbon that has the fewest hydrogens.'),
          src: 'L11 p13'
        },
        {
          scheme: { items: [{ smi: 'CCC(C)O' }, { arrow: '→', above: f('60 % H2SO4'), below: f('100 °C') }, { smi: 'CC=CC' }, { plus: true }, { smi: 'CCC=C' }], maxWidth: 560 },
          caption: t('2-butanolis: vyrauja 2-butenas, šalutinis – 1-butenas.', '2-Butanol: 2-butene predominates, 1-butene is the minor product.'), src: 'L11 p13'
        },
        {
          p: t('Karbokatijono tarpinė dalelė paaiškina, kodėl kitas alkenas taip pat galimas: protonas gali atsiskirti nuo bet kurios gretimos anglies. Nuo kurios – lemia stabilumas: daugiau pakeistas alkenas yra stabilesnis.',
            'The carbocation intermediate explains why another alkene is also possible: the proton can leave any neighbouring carbon. Which one is decided by stability: a more substituted alkene is more stable.'),
          src: 'L11 p13'
        },
        {
          pitfall: t('Protonas atskyla nuo anglies, kuri turi mažiausiai vandenilių, o ne daugiausia. Tai priešinga Markovnikovo taisyklės formuluotei (ten $H$ jungiasi prie anglies su daugiau vandenilių), bet ta pati idėja: vyrauja stabilesnis produktas.',
            'The proton leaves the carbon with the fewest hydrogens, not the most. That sounds opposite to Markovnikov’s rule (where the $H$ goes to the carbon with more hydrogens) but it is the same idea: the more stable product wins.')
        },
        { h: t('Tarpmolekulinė dehidratacija: eteriai (SN2)', 'Intermolecular dehydration: ethers (SN2)') },
        {
          p: t('Pirminiai alkoholiai su rūgštimi žemesnėje temperatūroje (apie 140 °C) sudaro eterius, o aukštesnėje (apie 180 °C) – alkenus. Protonuotas alkoholis tampa elektrofilu, o antroji alkoholio molekulė – nukleofilu.',
            'Primary alcohols with acid give ethers at a lower temperature (about 140 °C) and alkenes at a higher one (about 180 °C). A protonated alcohol becomes the electrophile and a second alcohol molecule acts as the nucleophile.'),
          src: 'L11 p11, T p73'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CCO', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CC[OH2+]' }] },
              arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
              note: t('SN2: alkoholio deguonis atakuoja protonuoto alkoholio anglį, išeina $H2O$.', 'SN2: the oxygen of one alcohol attacks the carbon of the protonated alcohol and $H2O$ leaves.')
            }
          ],
          src: 'L11 p11'
        },
        { scheme: { items: [{ smi: 'CC[OH+]CC' }, { arrow: '→', above: t('−H+', '−H+') }, { smi: 'CCOCC' }] }, caption: t('Susidaręs oksonio jonas netenka protono ir duoda dietilo eterį.', 'The oxonium ion loses a proton and gives diethyl ether.') },
        {
          p: t('Gyvuose organizmuose dehidratacijos reakcijas katalizuoja fermentai: fumarazė malatą (obuolių rūgšties anijoną) paverčia fumaratu citrinų rūgšties cikle. Kartais dehidratacija vyksta E1cb būdu: bazė pirmiausia atplėšia protoną nuo anglies šalia karbonilo, o iš gauto anijono išeina hidroksigrupė. Taip veikia ir aldolinė kondensacija.',
            'In living organisms enzymes catalyse dehydration: fumarase turns malate into fumarate in the citric acid cycle. Dehydration sometimes follows the E1cb route: a base first removes a proton from the carbon next to a carbonyl, and the hydroxide then leaves the resulting anion. Aldol condensation works in the same way.'),
          src: 'L11 p14, p15'
        },
        {
          scheme: { items: [{ smi: 'OC(CC(=O)[O-])C(=O)[O-]' }, { arrow: '⇌', above: t('fumarazė', 'fumarase') }, { smi: '[O-]C(=O)/C=C/C(=O)[O-]' }, { plus: true }, { smi: 'O' }], maxWidth: 600 },
          caption: t('malatas → fumaratas + vanduo', 'malate → fumarate + water'), src: 'L11 p14'
        },
        {
          example: {
            q: [{ p: t('Kokius alkenus duoda 2-metil-2-pentanolis, kai kaitinamas su $H2SO4$? Kuris vyrauja?', 'Which alkenes does 2-methyl-2-pentanol give when it is heated with $H2SO4$? Which predominates?') },
              { mol: { smi: 'CC(C)(O)CCC', name: t('2-metil-2-pentanolis', '2-methyl-2-pentanol'), opts: { numbers: { 0: '1', 1: '2', 4: '3', 5: '4', 6: '5' } } } }],
            steps: [
              [{ p: t('Alkoholis tretinis, todėl susidaro tretinis karbokatijonas (E1).', 'The alcohol is tertiary, so a tertiary carbocation forms (E1).') }],
              [{ p: t('Protonas gali atskilti nuo C1 (iš metilo) arba nuo C3 (iš $CH2$). Taip gaunami du alkenai.', 'The proton can leave C1 (a methyl) or C3 (a $CH2$). Two alkenes result.') }, { mol: [{ smi: 'C=C(C)CCC', name: t('2-metil-1-pentenas', '2-methyl-1-pentene') }, { smi: 'CC(C)=CCC', name: t('2-metil-2-pentenas', '2-methyl-2-pentene') }] }],
              [{ p: t('Vyrauja 2-metil-2-pentenas: jo dvigubasis ryšys turi tris alkilgrupes, o 1-pentene – tik dvi (Zaicevo taisyklė).', '2-Methyl-2-pentene predominates: its double bond carries three alkyl groups, while the 1-pentene has only two (Zaitsev’s rule).') }]
            ]
          },
          claims: [{ react: ['elim', ['CC(C)(O)CCC'], { base: 'heat-acid' }, 'CC(C)=CCC'] }, { formula: ['C=C(C)CCC', 'C6H12'] }, { formula: ['CC(C)(O)CCC', 'C6H14O'] }, { name: ['CC(C)=CCC', { lt: '2-metil-2-pentenas', en: '2-methyl-2-pentene' }] }, { name: ['C=C(C)CCC', { lt: '2-metil-1-pentenas', en: '2-methyl-1-pentene' }] }]
        },
        { practice: 'u11.elim' }
      ]
    },
    /* ------------------------------------------------------------ 6 */
    {
      id: 'nu',
      title: t('Alkoholis kaip nukleofilas: eteriai ir esteriai', 'The alcohol as a nucleophile: ethers and esters'),
      blocks: [
        { h: t('Viljamsono eterių sintezė', 'Williamson ether synthesis') },
        {
          p: t('Eteriams gaminti dažniausiai naudojama Viljamsono sintezė. Alkoholis pirmiausia paverčiamas alkoksidu (su $Na$ ar $NaH$), o šis su halogenalkanu reaguoja SN2 būdu ir sudaro eterį. Alkoksido jonas yra stipresnis nukleofilas už alkoholį.',
            'Ethers are most often made by the Williamson synthesis. The alcohol is first converted into the alkoxide (with $Na$ or $NaH$), and this reacts with a haloalkane by SN2 to give the ether. The alkoxide ion is a much stronger nucleophile than the alcohol.'),
          src: 'L11 p16'
        },
        {
          scheme: { items: [{ smi: 'OC1CCCCC1' }, { arrow: '→', above: f('Na') }, { smi: 'C1CCC(CC1)[O-].[Na+]' }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'COC1CCCCC1' }, { plus: true }, { smi: '[Na+].[I-]' }], maxWidth: 700 },
          caption: t('Cikloheksanolis duoda metoksicikloheksaną.', 'Cyclohexanol gives methoxycyclohexane.'), src: 'L11 p16'
        },
        {
          mech: [{
            scheme: { items: [{ smi: 'CC(C)(C)[O-]', opts: { lonePairs: [4] } }, { plus: true }, { smi: 'CI', opts: { lonePairs: false } }] },
            arrows: [{ from: { m: 0, lp: 4 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
            note: t('SN2: alkoksido pora atakuoja anglį iš galinės pusės, jodidas išeina.', 'SN2: the alkoxide lone pair attacks the carbon from the back and iodide leaves.')
          }],
          src: 'L11 p17'
        },
        { scheme: { items: [{ smi: 'CC(C)(C)OC' }, { plus: true }, { smi: '[Na+].[I-]' }] }, caption: t('Produktai: tret-butilmetileteris ir natrio jodidas.', 'Products: tert-butyl methyl ether and sodium iodide.') },
        {
          rule: t('Nesimetrinį eterį planuokite taip: šakotesnė pusė – alkoksidas, kita pusė – metilo ar pirminis halogenalkanas. Kai halogenalkanas antrinis ar tretinis, vyksta E2: alkoksidas veikia kaip bazė ir atplėšia $β$ protoną.',
            'Make an unsymmetrical ether from the more hindered alkoxide and the less hindered (best primary or methyl) haloalkane. With a secondary or tertiary haloalkane E2 takes place: the alkoxide acts as a base and removes a $β$ proton.'),
          src: 'L11 p17'
        },
        {
          scheme: { items: [{ smi: 'C[O-].[Na+]' }, { plus: true }, { smi: 'CC(C)(C)Cl' }, { arrow: '→' }, { smi: 'CC(C)=C' }, { plus: true }, { smi: 'CO' }, { plus: true }, { smi: '[Na+].[Cl-]' }], maxWidth: 700 },
          caption: t('Ne tas variantas: metoksidas su tretiniu chlorbutanu duoda alkeną.', 'The wrong route: methoxide with a tertiary chloride gives an alkene.'), src: 'L11 p17'
        },
        {
          p: t('Dar vienas variantas naudoja švelnesnę bazę $Ag2O$: alkoholis (o ne iš anksto sudarytas alkoksidas) reaguoja su halogenalkanu, o sidabras surišamas kaip sidabro halogenidas. Taip metilinamas, pavyzdžiui, gliukozės visų $OH$ grupių junginys su $CH3I$.',
            'Another variant uses the milder base $Ag2O$: the alcohol itself (not a preformed alkoxide) reacts with the haloalkane and silver is removed as silver halide. This is how glucose is methylated on all its $OH$ groups with $CH3I$.'),
          src: 'L11 p18'
        },
        {
          pitfall: t('Slaidėje L11 p16 yra klaida pavadinime: ciklopentilmetileteris yra metoksiciklopentanas (penkių anglies atomų žiedas), o ne „metoksiciklopropanas“. Visada palyginkite pavadinimo žiedą su nupieštu.',
            'Slide L11 p16 contains an error in the name: cyclopentyl methyl ether is methoxycyclopentane (a five-carbon ring), not "methoxycyclopropane". Always compare the ring in the name with the ring that is drawn.')
        },
        { h: t('Esterinimas', 'Esterification') },
        {
          p: t('Alkoholis su mineraline ar karboksirūgštimi, esant rūgštiniam katalizatoriui, sudaro esterį. Alkoholio deguonis atakuoja karbonilo anglį (nukleofilinio acilpakeitimo reakcija), o išeina vanduo. Reakcija grįžtama.',
            'An alcohol with a mineral or a carboxylic acid forms an ester in the presence of an acid catalyst. The alcohol oxygen attacks the carbonyl carbon (nucleophilic acyl substitution) and water leaves. The reaction is reversible.'),
          src: 'L11 p19'
        },
        { scheme: { items: [{ smi: 'CCO' }, { plus: true }, { smi: 'CC(=O)O' }, { arrow: '⇌', above: f('H+') }, { smi: 'CCOC(C)=O' }, { plus: true }, { smi: 'O' }], maxWidth: 640 }, caption: t('Etanolis ir etano rūgštis duoda etilo etanoatą (etilacetatą).', 'Ethanol and ethanoic acid give ethyl ethanoate (ethyl acetate).'), src: 'L11 p19' },
        {
          example: {
            q: [{ p: t('Kaip pagaminti etil-tret-butileterį ($CH3CH2-O-C(CH3)3$)? Kuri reagentų pora tinka?', 'How can ethyl tert-butyl ether ($CH3CH2-O-C(CH3)3$) be made? Which pair of reagents works?') },
              { mol: { smi: 'CCOC(C)(C)C', name: t('2-etoksi-2-metilpropanas', '2-ethoxy-2-methylpropane') } }],
            steps: [
              [{ p: t('Eteris turi dvi $C-O$ jungtis: etilo ir tret-butilo. Galimi du keliai.', 'The ether has two $C-O$ bonds: ethyl and tert-butyl. Two routes are possible.') }],
              [{ p: t('Tret-butilo halogenidas su alkoksidu eliminuojasi (E2), todėl šis kelias netinka.', 'A tert-butyl halide eliminates with an alkoxide (E2), so this route fails.') }],
              [{ p: t('Tinka tret-butoksidas ir jodetanas (pirminis halogenalkanas): SN2.', 'Tert-butoxide and iodoethane (a primary haloalkane) work: SN2.') }, { scheme: { items: [{ smi: 'CC(C)(C)[O-].[Na+]' }, { plus: true }, { smi: 'CCI' }, { arrow: '→' }, { smi: 'CCOC(C)(C)C' }] } }]
            ]
          },
          claims: [{ react: ['williamson', ['CC(C)(C)[O-].[Na+]', 'CCI'], null, 'CCOC(C)(C)C'] }, { react: ['williamson', ['CC[O-].[Na+]', 'CC(C)(C)I'], null, 'CC(C)=C'] }]
        },
        { practice: 'u11.willi' }
      ]
    },
    /* ------------------------------------------------------------ 7 */
    {
      id: 'ox',
      title: t('Oksidacija: aldehidai, ketonai ir rūgštys', 'Oxidation: aldehydes, ketones and acids'),
      blocks: [
        { h: t('Nuo ko priklauso produktas?', 'What decides the product?') },
        {
          p: t('Alkoholio oksidacijos produktas priklauso nuo alkoholio klasės ir nuo oksidatoriaus stiprumo. Oksiduojant prarandamas vandenilis nuo anglies su $OH$ ir prisidedama prie $C=O$ ryšio. Todėl tretiniai alkoholiai, kurie šio vandenilio neturi, įprastomis sąlygomis neoksiduojasi.',
            'The product of an oxidation depends on the class of the alcohol and on the strength of the oxidant. Oxidation removes a hydrogen from the carbon with the $OH$ and creates a $C=O$ bond. Tertiary alcohols, which have no such hydrogen, are therefore not oxidised under the usual conditions.'),
          src: 'L11 p20'
        },
        {
          scheme: { items: [{ smi: 'CCCO' }, { arrow: '→', above: f('[O]') }, { smi: 'CCC=O' }, { arrow: '→', above: f('[O]') }, { smi: 'CCC(=O)O' }], maxWidth: 640 },
          caption: t('Pirminis alkoholis → aldehidas → karboksirūgštis.', 'Primary alcohol → aldehyde → carboxylic acid.'), src: 'L11 p20'
        },
        {
          scheme: { items: [{ smi: 'CC(O)CC' }, { arrow: '→', above: f('[O]') }, { smi: 'CC(=O)CC' }], maxWidth: 560 },
          caption: t('Antrinis alkoholis → ketonas.', 'Secondary alcohol → ketone.'), src: 'L11 p20'
        },
        {
          p: t('Tretiniai alkoholiai įprastomis sąlygomis neoksiduojasi; veikiami stipriais oksidatoriais ir griežtomis sąlygomis jie suyra, nutrūksta $C-C$ ryšiai ir susidaro ketonų ir rūgščių mišinys.',
            'Tertiary alcohols are not oxidised under the usual conditions; with strong oxidants under harsh conditions they degrade, $C-C$ bonds break and a mixture of ketones and acids forms.'),
          src: 'L11 p20, T p73'
        },
        { h: t('Švelnūs ir stiprūs oksidatoriai', 'Mild and strong oxidants') },
        {
          p: t('Švelnus oksidatorius piridinio chlorchromatas (PCC) dichlormetane pirminį alkoholį oksiduoja tik iki aldehido. Stiprūs oksidatoriai ($CrO3$, $Na2Cr2O7$, $KMnO4$) vandeninėje rūgščioje aplinkoje pirminį alkoholį perveda iki karboksirūgšties: aldehidas čia tik tarpinė stotelė ir negaunamas. Antrinis alkoholis visada baigia ketonu, kad ir koks oksidatorius.',
            'Pyridinium chlorochromate (PCC), a mild oxidant, in dichloromethane oxidises a primary alcohol only as far as the aldehyde. Most common strong oxidants ($CrO3$, $Na2Cr2O7$, $KMnO4$) in aqueous acid take a primary alcohol all the way to the carboxylic acid: the aldehyde is only an intermediate and is not isolated. Secondary alcohols are oxidised to ketones by any oxidant.'),
          src: 'L11 p21, p22, p23'
        },
        {
          scheme: { items: [{ smi: 'CCCCCCCO' }, { arrow: '→', above: f('PCC, CH2Cl2') }, { smi: 'CCCCCCC=O' }], maxWidth: 600 },
          caption: t('1-heptanolis → heptanalis (PCC).', '1-heptanol → heptanal (PCC).'), src: 'L11 p21'
        },
        {
          scheme: { items: [{ smi: 'CCCCCCCCCCO' }, { arrow: '→', above: f('CrO3'), below: f('H3O+') }, { smi: 'CCCCCCCCCC(=O)O' }], maxWidth: 600 },
          caption: t('1-dekanolis → dekano rūgštis (stiprus oksidatorius).', '1-decanol → decanoic acid (a strong oxidant).'), src: 'L11 p22'
        },
        {
          scheme: { items: [{ smi: 'CC(C)(C)C1CCC(O)CC1' }, { arrow: '→', above: f('Na2Cr2O7'), below: f('H2O, CH3COOH') }, { smi: 'CC(C)(C)C1CCC(=O)CC1' }], maxWidth: 640 },
          caption: t('Antrinis alkoholis visada duoda ketoną.', 'A secondary alcohol always gives the ketone.'), src: 'L11 p23'
        },
        {
          rule: t('Pirminis alkoholis: PCC → aldehidas; $CrO3$, $Na2Cr2O7$, $KMnO4$ rūgštyje → karboksirūgštis. Antrinis alkoholis → ketonas (bet kuris oksidatorius). Tretinis alkoholis → neoksiduojasi.',
            'Primary alcohol: PCC → aldehyde; $CrO3$, $Na2Cr2O7$, $KMnO4$ in acid → carboxylic acid. Secondary alcohol → ketone (any oxidant). Tertiary alcohol → not oxidised.'),
          src: 'L11 p20, p21, p22, p23'
        },
        { h: t('Mechanizmas su chromo rūgštimi', 'The mechanism with chromic acid') },
        {
          p: t('Pirmojoje stadijoje alkoholis ir chromo rūgštis greitai ir grįžtamai sudaro chromato esterį $R2CH-O-CrO3H$. Antrojoje stadijoje vyksta eliminavimas: vandens molekulė, būdama bazė, nutraukia protoną nuo anglies, prie kurios yra $O$, o $C-H$ elektronai sudaro $C=O$ $π$ ryšį, kai $O-Cr$ ryšys nutrūksta ir chromas redukuojasi. Todėl būtinas vandenilis prie tos anglies: tretiniuose alkoholiuose šios stadijos nėra.',
            'In the first stage the alcohol and chromic acid rapidly and reversibly form a chromate ester $R2CH-O-CrO3H$. The second stage is an elimination: water as a base removes the proton from the carbon that bears the $O$, and the $C-H$ electrons form the $C=O$ $π$ bond as the $O-Cr$ bond breaks and chromium is reduced. A hydrogen on that carbon is therefore essential, and tertiary alcohols have none.'),
          src: 'L11 p24'
        },
        {
          p: t('Chromo rūgštis ($H2CrO4$) susidaro iš $CrO3$ ar $Na2Cr2O7$ vandenyje. Spalvos pasikeitimas rodo reakciją: oranžinis $Cr(VI)$ virsta žaliu $Cr(III)$, violetinis permanganatas išblunka ir iškrenta rudas $MnO2$ (6 laboratorinis darbas).',
            'Chromic acid ($H2CrO4$) forms from $CrO3$ or $Na2Cr2O7$ in water. The colour change shows the reaction: orange $Cr(VI)$ becomes green $Cr(III)$, and violet permanganate fades with brown $MnO2$ precipitating (lab 6).'),
          src: 'L11 p22; LW6 p2'
        },
        { h: t('Biologinė oksidacija', 'Biological oxidation') },
        {
          p: t('Organizme alkoholius oksiduoja alkoholio dehidrogenazė, kai oksidatorius yra $NAD+$. Metanolis virsta formaldehidu ir toksiška skruzdžių rūgštimi, o etanolis – acetaldehidu ir acto rūgštimi. Kadangi etanolis oksiduojasi greičiau, jis naudojamas kaip metanolio apsinuodijimo priešnuodis.',
            'In the body alcohols are oxidised by alcohol dehydrogenase with $NAD+$ as the oxidant. Methanol becomes formaldehyde and the toxic formic acid, and ethanol becomes acetaldehyde and acetic acid. Because ethanol is oxidised faster, it is used as an antidote in methanol poisoning.'),
          src: 'L11 p25'
        },
        {
          scheme: { items: [{ smi: 'CO' }, { arrow: '→', above: f('$NAD+$') }, { smi: 'C=O' }, { arrow: '→', above: f('$NAD+$') }, { smi: 'OC=O' }], maxWidth: 640 },
          caption: t('metanolis → formaldehidas → skruzdžių rūgštis', 'methanol → formaldehyde → formic acid'), src: 'L11 p25'
        },
        {
          pitfall: t('Oksidacija nereiškia, kad alkoholis prijungia deguonį iš oksidatoriaus: pagrindinė pasikeitimo esmė – vandenilio netekimas nuo anglies su $OH$. Todėl nuo $H$ priklauso, ar alkoholis gali oksiduotis.',
            'Oxidation does not mean that the alcohol simply picks up oxygen from the oxidant: the essence is the loss of the hydrogen from the carbon with the $OH$. Whether an alcohol can be oxidised therefore depends on that $H$.')
        },
        {
          example: {
            q: [{ p: t('Kas susidaro 2-metil-1-butanolį veikiant PCC ir kas – $Na2Cr2O7$ rūgštyje? Atomų numeriai atitinka grandinės numeraciją.', 'What forms when 2-methyl-1-butanol is treated with PCC, and what with $Na2Cr2O7$ in acid? The atom numbers follow the chain numbering.') },
              { mol: { smi: 'OCC(C)CC', name: t('2-metil-1-butanolis', '2-methyl-1-butanol'), opts: { numbers: { 1: '1', 2: '2', 4: '3', 5: '4' } } } }],
            steps: [
              [{ p: t('Anglis C1 turi $OH$ ir dvi vandenilius: pirminis alkoholis.', 'Carbon C1 has the $OH$ and two hydrogens: a primary alcohol.') }],
              [{ p: t('PCC dichlormetane sustoja ties aldehidu.', 'PCC in dichloromethane stops at the aldehyde.') }, { mol: { smi: 'O=CC(C)CC', name: t('2-metilbutanalis', '2-methylbutanal') } }],
              [{ p: t('$Na2Cr2O7$ rūgštyje aldehidą oksiduoja toliau iki karboksirūgšties.', '$Na2Cr2O7$ in acid oxidises the aldehyde further to the carboxylic acid.') }, { mol: { smi: 'OC(=O)C(C)CC', name: t('2-metilbutano rūgštis', '2-methylbutanoic acid') } }]
            ]
          },
          claims: [{ react: ['alc.ox', ['OCC(C)CC'], { reagent: 'PCC' }, 'O=CC(C)CC'] }, { react: ['alc.ox', ['OCC(C)CC'], { reagent: 'chromic' }, 'OC(=O)C(C)CC'] }, { name: ['O=CC(C)CC', { lt: '2-metilbutanalis', en: '2-methylbutanal' }] }, { name: ['OC(=O)C(C)CC', { lt: '2-metilbutano rūgštis', en: '2-methylbutanoic acid' }] }, { carbon: ['OCC(C)CC', 1, 1] }]
        },
        { practice: 'u11.ox' },
        { practice: 'u11.oxwhy' }
      ]
    },
    /* ------------------------------------------------------------ 8 */
    {
      id: 'multi',
      title: t('Kelios funkcinės grupės ir reakcijų schemos', 'Several functional groups and reaction schemes'),
      blocks: [
        { h: t('Reaguoja grupė, o ne visa molekulė', 'The group reacts, not the whole molecule') },
        {
          p: t('Didelėse molekulėse (cholesteryje, geraniolyje) kiekvienas reagentas randa savo funkcinę grupę. Dydis nesvarbu: suraskite $OH$ ir $C=C$ ir kiekvienai grupei pritaikykite jos taisykles. $Br2$, $H2O/H+$ ir $H2/Pd$ jungiasi prie $C=C$, o $PCC$ ir $Na$ veikia $OH$.',
            'In complex compounds (cholesterol, geraniol) every reagent finds its own functional group. Ignore the size of the molecule: find the $OH$ and the $C=C$ and apply the rules of each group. $Br2$, $H2O/H+$ and $H2/Pd$ add to the $C=C$, whereas $PCC$ and $Na$ act on the $OH$.'),
          src: 'S5.16, L11 p26'
        },
        { mol: { smi: 'CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C', caption: t('cholesterolis: antrinis alkoholis ir trigubai pakeistas $C=C$', 'cholesterol: a secondary alcohol and a trisubstituted $C=C$') }, src: 'L11 p3' },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), t('Kuri grupė reaguoja', 'Which group reacts'), t('Produktas (4-metilcikloheks-3-en-1-olis)', 'Product (4-methylcyclohex-3-en-1-ol)')],
            rows: [
              [t('$Br2$', '$Br2$'), t('$C=C$ (AE)', '$C=C$ (AE)'), { smi: 'CC1(Br)C(Br)CC(O)CC1' }],
              [t('$H2O$, $H+$', '$H2O$, $H+$'), t('$C=C$ (Markovnikovas)', '$C=C$ (Markovnikov)'), { smi: 'CC1(O)CCC(O)CC1' }],
              [t('$PCC$', '$PCC$'), t('$OH$ (oksidacija)', '$OH$ (oxidation)'), { smi: 'CC1=CCC(=O)CC1' }],
              [t('1. $Na$; 2. $CH3I$', '1. $Na$; 2. $CH3I$'), t('$OH$ (alkoksidas, SN2)', '$OH$ (alkoxide, SN2)'), { smi: 'CC1=CCC(OC)CC1' }]
            ]
          },
          src: 'S5.16'
        },
        {
          pitfall: t('Neturi reaguoti viskas iš karto. Su $PCC$ dvigubasis ryšys nereaguoja, o su $Br2$ ar $H2O/H+$ nesikeičia alkoholio grupė. Tik reagentas lemia, kuri grupė pasikeičia.',
            'Not everything has to react at once. A double bond does not react with $PCC$, and the alcohol group does not change with $Br2$ or $H2O/H+$. Only the reagent decides which group changes.')
        },
        { h: t('Schemos su A ir B', 'Schemes with A and B') },
        {
          p: t('Schemas skaitykite po vieną reakciją: kiekvieno junginio produktas yra kitos reakcijos pradinė medžiaga. Pirmiausia nustatykite reakcijos tipą (SN2, prijungimas), tada alkoholio klasę, tada pasirinkite, ką duoda oksidatorius.',
            'Read a scheme one reaction at a time: the product of each is the starting material of the next. First identify the type of reaction (SN2, addition), then the class of the alcohol, then decide what the oxidant gives.'),
          src: 'S5.15'
        },
        {
          scheme: { items: [{ smi: 'CCCCBr' }, { arrow: '→', above: f('NaOH') }, { smi: 'CCCCO' }, { arrow: '→', above: f('PCC, CH2Cl2') }, { smi: 'CCCC=O' }], maxWidth: 700 },
          caption: t('Halogenalkanas → alkoholis (A) → aldehidas (B).', 'Haloalkane → alcohol (A) → aldehyde (B).'), src: 'S5.15'
        },
        {
          scheme: { items: [{ smi: 'CCC=C' }, { arrow: '→', above: f('H2O, H2SO4') }, { smi: 'CCC(C)O' }, { arrow: '→', above: f('CrO3, H3O+') }, { smi: 'CCC(C)=O' }], maxWidth: 700 },
          caption: t('Alkenas → antrinis alkoholis (A) → ketonas (B).', 'Alkene → secondary alcohol (A) → ketone (B).'), src: 'S5.15'
        },
        {
          example: {
            q: [{ p: t('Įrašykite A ir B: 1-hepteno hidratacija, o po to oksidacija $CrO3$ rūgštyje.', 'Fill in A and B: hydration of 1-heptene, followed by oxidation with $CrO3$ in acid.') },
              { scheme: { items: [{ smi: 'CCCCCC=C' }, { arrow: '→', above: f('H2O, H2SO4') }, { arrow: '→', above: f('CrO3, H3O+') }] } }],
            steps: [
              [{ p: t('Vandens prijungimas vyksta pagal Markovnikovo taisyklę: $OH$ atitenka antrajai anglies. A yra 2-heptanolis, antrinis alkoholis.', 'Water adds by Markovnikov’s rule: the $OH$ goes to carbon 2. A is 2-heptanol, a secondary alcohol.') }, { mol: { smi: 'CC(O)CCCCC', name: t('2-heptanolis', '2-heptanol') } }],
              [{ p: t('Antrinis alkoholis oksiduojasi iki ketono: B yra 2-heptanonas.', 'A secondary alcohol is oxidised to a ketone: B is 2-heptanone.') }, { mol: { smi: 'CC(=O)CCCCC', name: t('2-heptanonas', '2-heptanone') } }]
            ]
          },
          claims: [{ react: ['ae.h2o', ['CCCCCC=C'], null, 'CC(O)CCCCC'] }, { react: ['alc.ox', ['CC(O)CCCCC'], { reagent: 'chromic' }, 'CC(=O)CCCCC'] }, { name: ['CC(O)CCCCC', { lt: '2-heptanolis', en: '2-heptanol' }] }, { name: ['CC(=O)CCCCC', { lt: '2-heptanonas', en: '2-heptanone' }] }]
        },
        { practice: 'u11.multi' },
        { practice: 'u11.chain' },
        { practice: 'u11.react4' },
        { practice: 'u11.map' }
      ]
    },
    /* ------------------------------------------------------------ 9 */
    {
      id: 'lab',
      title: t('Alkoholių bandymai laboratorijoje (6 laboratorinis darbas)', 'Alcohol tests in the lab (lab 6)'),
      blocks: [
        { h: t('Ką parodo spalvų ir dujų požymiai', 'What the colours and gases show') },
        {
          p: t('Laboratorijoje alkoholiai atpažįstami pagal keletą paprastų reakcijų. Kiekvienas bandymas rodo vieną savybę: rūgštinį protoną, galimybę oksiduotis, gretimas $OH$ grupes.',
            'In the laboratory alcohols are recognised by a few simple reactions. Each test shows one property: an acidic proton, the ability to be oxidised, adjacent $OH$ groups.'),
          src: 'LW6 p1, p2'
        },
        {
          table: {
            head: [t('Bandymas', 'Test'), t('Stebėjimas', 'Observation'), t('Paaiškinimas', 'Explanation')],
            rows: [
              [t('Etanolis + koncentruota $H2SO4$, kaitinimas', 'Ethanol + conc. $H2SO4$, heat'), t('dujos, kurios nuspalvina bromo vandenį ir permanganatą', 'a gas that decolourises bromine water and permanganate'), t('dehidratacija: susidaro etenas ($C=C$)', 'dehydration: ethene forms ($C=C$)')],
              [t('Etanolis + baltas $CuSO4$', 'Ethanol + white $CuSO4$'), t('pamėlynuoja, jei yra vandens', 'turns blue if water is present'), t('susidaro $CuSO4·5H2O$', '$CuSO4·5H2O$ forms')],
              [t('Etanolis + natris', 'Ethanol + sodium'), t('burbuliukai; dujos dega; fenolftaleinas parausta', 'bubbles; the gas burns; phenolphthalein turns crimson'), t('alkoksidas ir $H2$; hidrolizė duoda $NaOH$', 'alkoxide and $H2$; hydrolysis gives $NaOH$')],
              [t('Glicerolis + $Cu(OH)2$', 'Glycerol + $Cu(OH)2$'), t('ryškiai mėlynas tirpalas', 'an intense blue solution'), t('kompleksas su gretimomis $OH$ grupėmis', 'a complex with adjacent $OH$ groups')],
              [t('Etanolis + rūgštus $K2Cr2O7$ ar $KMnO4$', 'Ethanol + acidic $K2Cr2O7$ or $KMnO4$'), t('oranžinis → žalias; violetinis → bespalvis', 'orange → green; violet → colourless'), t('oksidacija iki aldehido ir rūgšties', 'oxidation to the aldehyde and the acid')]
            ]
          },
          src: 'LW6 p1, p2'
        },
        {
          scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: f('H2SO4, t°') }, { smi: 'C=C', opts: { allH: true } }, { plus: true }, { smi: 'O' }], maxWidth: 560 },
          caption: t('Etenas iš etanolio: tarpinis produktas yra etilo hidrosulfatas.', 'Ethene from ethanol: the intermediate is ethyl hydrogen sulfate.'), src: 'LW6 p1'
        },
        {
          p: t('Etenas atpažįstamas dviem būdais. Bromo vandenyje geltona spalva išnyksta, nes susidaro bespalvis 1,2-dibrometanas. Rūgštiniame ar neutraliame permanganate violetinė spalva išnyksta ir iškrenta rudos $MnO2$ nuosėdos, nes susidaro 1,2-diolis. Todėl abiem bandymais nustatomas nesotumas.',
            'Ethene is recognised in two ways. In bromine water the yellow colour fades because colourless 1,2-dibromoethane forms. In permanganate the violet colour disappears and brown $MnO2$ precipitates because a 1,2-diol forms. Both reactions are used to detect double and triple bonds.'),
          src: 'LW6 p1, p2'
        },
        {
          scheme: { items: [{ smi: 'C=C', opts: { allH: true } }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'BrCCBr' }], maxWidth: 560 },
          caption: t('Eteno ir bromo reakcija: bespalvis dibromidas.', 'Ethene and bromine: a colourless dibromide.'), src: 'LW6 p1'
        },
        {
          pitfall: t('Nepamirškite, kad glicerolio ir $Cu(OH)2$ bandymas ir fenolio brominimas yra kitų junginių tipų reakcijos: čia jos naudojamos kaip alkoholių ir polialkoholių atpažinimo būdas. Paprastas alkoholis, pvz., etanolis, mėlyno komplekso neduoda.',
            'Remember that the glycerol and $Cu(OH)2$ test is a reaction of polyols, not of simple alcohols. A simple alcohol such as ethanol does not give the blue complex.')
        },
        { practice: 'u11.lab' }
      ]
    }
  ];

  const SUMMARY = [
    { h: t('Alkoholių reakcijos vienoje lentelėje', 'The reactions of alcohols in one table') },
    {
      table: {
        head: [t('Reagentas', 'Reagent'), t('Produktas', 'Product'), t('Pastaba', 'Note')],
        rows: [
          [t('$Na$, $K$, $NaH$', '$Na$, $K$, $NaH$'), t('alkoksidas + $H2$', 'alkoxide + $H2$'), t('rūgštinės savybės; su $NaOH$ nereaguoja', 'acidic behaviour; no reaction with $NaOH$')],
          [t('$HX$, $PBr3$, $SOCl2$', '$HX$, $PBr3$, $SOCl2$'), t('halogenalkanas', 'haloalkane'), t('pirminis SN2, antr. ir tretin. SN1', 'primary SN2, secondary and tertiary SN1')],
          [t('$H2SO4$, 140 °C', '$H2SO4$, 140 °C'), t('eteris (pirminis alkoholis)', 'ether (primary alcohol)'), t('SN2', 'SN2')],
          [t('$H2SO4$, kaitinimas', '$H2SO4$, heat'), t('alkenas (antrinis, tretinis)', 'alkene (secondary, tertiary)'), t('E1; Zaicevo taisyklė', 'E1; Zaitsev’s rule')],
          [t('1. $Na$ 2. $RX$', '1. $Na$ 2. $RX$'), t('eteris', 'ether'), t('Viljamsonas, SN2; $RX$ pirminis', 'Williamson, SN2; $RX$ primary')],
          [t('$PCC$', '$PCC$'), t('aldehidas (pirminis); ketonas (antrinis)', 'aldehyde (primary); ketone (secondary)'), t('tretinis nereaguoja', 'tertiary does not react')],
          [t('$CrO3$, $Na2Cr2O7$, $KMnO4$ + $H3O+$', '$CrO3$, $Na2Cr2O7$, $KMnO4$ + $H3O+$'), t('rūgštis (pirminis); ketonas (antrinis)', 'acid (primary); ketone (secondary)'), t('spalvos pokytis', 'colour change')],
          [t('$R-COOH$, $H+$', '$R-COOH$, $H+$'), t('esteris + $H2O$', 'ester + $H2O$'), t('grįžtama', 'reversible')]
        ]
      },
      src: 'L11 p26'
    },
    {
      list: [
        t('Klasė: pirminė (1 C kaimynas), antrinė (2), tretinė (3). Ji lemia halogeninimo mechanizmą, dehidrataciją ir oksidaciją.', 'Class: primary (1 C neighbour), secondary (2), tertiary (3). It decides the halogenation mechanism, the dehydration and the oxidation.'),
        t('Vandeniliniai ryšiai: aukšta virimo temperatūra, tirpumas vandenyje mažėja ilgėjant grandinei.', 'Hydrogen bonds: a high boiling point; the solubility in water falls as the chain gets longer.'),
        t('Alkoholio $pKa$ 15–18: silpna rūgštis, alkoksidui reikia $Na$, $K$ ar $NaH$, ne $NaOH$.', 'The $pKa$ of an alcohol is 15–18: a weak acid, an alkoxide needs $Na$, $K$ or $NaH$, not $NaOH$.'),
        t('Karbokatijono stabilumas: tretinis > antrinis > pirminis: lemia SN1 ir E1; pirminiai alkoholiai eina SN2.', 'Carbocation stability: tertiary > secondary > primary: decides SN1 and E1; primary alcohols go by SN2.'),
        t('Zaicevo taisyklė: vyrauja daugiausia pakeistas alkenas.', 'Zaitsev’s rule: the most substituted alkene predominates.'),
        t('Viljamsono sintezė: šakotesnė dalis – alkoksidas, mažiau šakota – halogenalkanas (pirminis ar metilo).', 'Williamson synthesis: the more hindered part is the alkoxide, the less hindered one the haloalkane (primary or methyl).'),
        t('Oksidacija reikalauja $H$ prie anglies su $OH$: tretinis alkoholis neoksiduojasi.', 'Oxidation needs an $H$ on the carbon with the $OH$: a tertiary alcohol is not oxidised.'),
        t('Atpažinimas: $Na$ – $H2$; $Cu(OH)2$ – mėlynas kompleksas (gretimos $OH$); dichromatas oranžinis → žalias.', 'Tests: $Na$ gives $H2$; $Cu(OH)2$ gives a blue complex (adjacent $OH$); dichromate orange → green.'),
        t('Dvigubasis ryšys neturi būti painiojamas su $OH$: kiekvienas reagentas reaguoja su „savo“ grupe.', 'Do not mix up the double bond and the $OH$: each reagent reacts with its own group.')
      ]
    }
  ];

  /* ================= generated types ================= */

  // mechanism pieces for the solutions: HX protonates the OH oxygen, then SN1 (cation) or SN2 (bromide from behind)
  const MECH_POOL = [
    { a: 'CC(C)(C)O', cat: 'C[C+](C)C', alt: 'CC(C)[CH2+]' },
    { a: 'CCC(C)(C)O', cat: 'CC[C+](C)C', alt: 'CC(C)C[CH2+]' },
    { a: 'CC1(O)CCCCC1', cat: 'C[C+]1CCCCC1', alt: 'CC1CCC[CH2+]C1' },
    { a: 'CCC(C)(O)CC', cat: 'CC[C+](C)CC', alt: 'CCC(C)C[CH2+]' },
    { a: 'CC1(O)CCCC1', cat: 'C[C+]1CCCC1', alt: 'CC1CCC[CH+]1' },
    { a: 'CC(C)O', cat: 'C[CH+]C', alt: 'CC[CH2+]' },
    { a: 'CCC(C)O', cat: 'CC[CH+]C', alt: 'CC(C)[CH2+]' },
    { a: 'OC1CCCCC1', cat: 'C1CC[CH+]CC1', alt: 'C[CH+]CCC[CH2+]' },
    { a: 'CCC(O)CC', cat: 'CC[CH+]CC', alt: 'CCCC[CH2+]' },
    { a: 'OC1CCCC1', cat: 'C1CC[CH+]C1', alt: 'CC1CC[CH+]1' },
    { a: 'CCO' }, { a: 'CCCO' }, { a: 'CCCCO' }, { a: 'CC(C)CO' }, { a: 'CCCCCO' }, { a: 'OCC1CCCCC1' }
  ];
  const chargedAtom = (chem, smi) => chem.parse(smi).atoms.findIndex(a => a.charge === 1 && a.el === 'C');

  const TYPES_GEN = [
    /* ---- recognition, class, names ---- */
    {
      id: 'u11.cls',
      title: t('Alkoholių atpažinimas, klasė ir pavadinimas', 'Recognising alcohols: class and name'),
      mirrors: [],
      gen(rng, ctx) {
        const { chem } = ctx;
        if (rng() < 0.35) {
          const GOOD = ['CCO', 'CC(C)O', 'CC(C)(C)O', 'OC1CCCCC1', 'OCc1ccccc1', 'OCC(O)CO', 'CCC(O)CC', 'OCCO', 'CCCCO', 'C=CCO', 'CC1CCCCC1O', 'OCC1CCCC1'];
          const BAD = ['Oc1ccccc1', 'CCOCC', 'CC(=O)O', 'CCS', 'CC=CO', 'CCC=O', 'COC', 'Cc1ccccc1O', 'CC(=O)OC', 'CCN', 'CCC(=O)C', 'COc1ccccc1'];
          const nGood = ctx.int(1, 2);
          const good = ctx.shuffle(GOOD.slice()).slice(0, nGood);
          const bad = ctx.shuffle(BAD.slice()).slice(0, 4 - nGood);
          return {
            q: [{ p: t('Čia pateikta keletas junginių su deguonies atomu arba kitomis funkcinėmis grupėmis.', 'Several compounds are shown, with oxygen or other functional groups.') }],
            steps: [{
              prompt: t('Pažymėkite visus alkoholius.', 'Pick every alcohol.'),
              kind: 'multi', options: good.concat(bad).map(s => ({ mol: { smi: s } })), answer: good.map((_, i) => i),
              hint: t('Atkreipkite dėmesį, prie kokio atomo prijungta OH grupė: ar tai sp3 hibridizuota anglis?', 'Look at the atom the OH group is attached to: is it an sp3 carbon?'),
              solution: t('Alkoholyje OH jungiasi prie sp3 hibridizuotos anglies. Fenolyje OH prijungta prie aromatinio žiedo, enolyje – prie C=C anglies, rūgštyje – prie karbonilo anglies, o eteryje deguonis neturi vandenilio.',
                'In an alcohol the OH sits on an sp3 carbon. In a phenol it is on an aromatic ring, in an enol on a C=C carbon, in an acid on a carbonyl carbon, and the oxygen of an ether carries no hydrogen.')
            }],
            why: t('Alkoholis atpažįstamas pagal hidroksigrupę, prijungtą prie sp3 hibridizuotos anglies. Ta pati grupė prie sp2 anglies jau yra kito junginių tipo funkcinė grupė, ir reaguoja kitaip.',
              'An alcohol is recognised by a hydroxyl group on an sp3 carbon. The same group on an sp2 carbon belongs to another compound class and reacts differently.'),
            src: 'L11 p2'
          };
        }
        const alc = ctx.pick(ALL_ALC);
        const s = site(chem, alc);
        const steps = [
          {
            prompt: t('Bakstelėkite anglies atomą, prie kurio prijungta OH grupė.', 'Tap the carbon atom that carries the OH group.'),
            kind: 'atoms', mol: { smi: alc, opts: { numbers: 'all' } }, answer: [s.c],
            hint: t('Raskite deguonies atomą su vandeniliu ir pažiūrėkite, prie ko jis prijungtas.', 'Find the oxygen with a hydrogen and see what it is attached to.'),
            solution: t('Hidroksigrupė prijungta prie atomo Nr. ' + (s.c + 1) + '.', 'The hydroxyl group is attached to atom no. ' + (s.c + 1) + '.')
          },
          classStep(s)
        ];
        const ns = nameStep(ctx, alc, t('Pavadinkite alkoholį.', 'Name the alcohol.'),
          t('Pagrindinė grandinė turi apimti anglį su OH, o numeruojama nuo galo, arčiau kurio yra OH. Pavadinimo galūnė -olis.', 'The parent chain must contain the carbon with the OH and is numbered from the end nearer to the OH. The ending is -ol.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Išnagrinėkite alkoholį.', 'Examine this alcohol.') }, { mol: { smi: alc } }],
          steps,
          why: t('Alkoholio klasę nusako anglis su OH: pirminėje yra viena anglies kaimynė (arba nė vienos), antrinėje dvi, tretinėje trys. Klasė lemia, kaip alkoholis reaguoja: oksidacijoje, halogeninime, dehidratacijoje.',
            'The class of an alcohol is set by the carbon that carries the OH: one carbon neighbour for primary, two for secondary, three for tertiary. The class decides how the alcohol behaves in oxidation, halogenation and dehydration.'),
          src: 'L11 p2, p27'
        };
      }
    },
    /* ---- acid properties: Na, K, NaH (S5.3) ---- */
    {
      id: 'u11.acid',
      title: t('Alkoholiai su Na, K, NaH: alkoksidai', 'Alcohols with Na, K, NaH: alkoxides'),
      mirrors: ['S5.3', 'S5.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const R = ctx.pick([{ k: 'Na', m: 'Na' }, { k: 'Na', m: 'Na' }, { k: 'K', m: 'K' }, { k: 'K', m: 'K' }, { k: 'NaH', m: 'Na' }, { k: 'NaH', m: 'Na' }, { k: 'NaOH', m: 'Na' }]);
        const alc = ctx.pick(ALL_ALC.concat(['OCc1ccccc1']));
        const label = R.k;
        const q = [{ scheme: { items: [{ smi: alc }, { arrow: '→', above: f(label) }] } }];
        if (R.k === 'NaOH') {
          return {
            q,
            steps: [
              {
                prompt: t('Ar alkoholis su NaOH virsta alkoksidu?', 'Does the alcohol turn into an alkoxide with NaOH?'),
                kind: 'choice',
                options: [
                  tx('Ne: alkoholis per silpna rūgštis ($pKa$ 15–18), kad NaOH jį praktiškai deprotonuotų; reakcija nevyksta.', 'No: an alcohol is too weak an acid ($pKa$ 15–18) for NaOH to deprotonate it appreciably; no reaction takes place.'),
                  tx('Taip: susidaro alkoksidas ir vanduo, reakcija vyksta iki galo.', 'Yes: an alkoxide and water form, and the reaction goes to completion.'),
                  tx('Taip: $OH-$ atskelia vandenį ir susidaro alkenas.', 'Yes: $OH-$ removes water and an alkene forms.'),
                  tx('Taip: alkoholis oksiduojasi iki aldehido ar ketono.', 'Yes: the alcohol is oxidised to an aldehyde or a ketone.')
                ],
                answer: 0,
                hint: t('Palyginkite alkoholio ir vandens rūgštingumą: kokia bazė sudaro silpną rūgštį ir ar ji pakankamai stipri?', 'Compare the acidity of the alcohol with that of water: what is the conjugate acid of the base, and is the base strong enough?'),
                solution: t('Alkoholio $pKa$ (15–18) yra panašus į vandens, todėl $OH-$ negali jo pilnai deprotonuoti: pusiausvyra lieka prie alkoholio. Su šarmais monohidroksiliai alkoholiai nereaguoja.',
                  'The $pKa$ of an alcohol (15–18) is close to that of water, so $OH-$ cannot deprotonate it fully: the equilibrium stays on the alcohol side. Monohydric alcohols do not react with alkalis.')
              },
              {
                prompt: t('Kuris reagentas tinka alkoksidui gauti?', 'Which reagent will make the alkoxide?'),
                kind: 'choice',
                options: [tx('Natris metalas arba $NaH$', 'Sodium metal or $NaH$'), tx('$NaOH$ vandeniniame tirpale', '$NaOH$ in water'), tx('$NaCl$', '$NaCl$'), tx('$Na2SO4$', '$Na2SO4$')],
                answer: 0,
                hint: t('Reikia bazės, kurios konjuguotoji rūgštis daug silpnesnė už alkoholį.', 'You need a base whose conjugate acid is much weaker than the alcohol.'),
                solution: t('Šarminis metalas atiduoda elektroną (susidaro $H2$), o hidrido jonas $H-$ yra labai stipri bazė: jo konjuguotoji rūgštis $H2$ labai silpna. Abu reagentai alkoholį deprotonuoja visiškai.',
                  'An alkali metal gives up an electron (and $H2$ forms), and the hydride ion $H-$ is a very strong base: its conjugate acid $H2$ is extremely weak. Both reagents deprotonate the alcohol completely.')
              }
            ],
            why: t('Alkoholiai yra labai silpnos rūgštys, panašios į vandenį, todėl su vandeniniu šarmu alkoksido praktiškai nesudaro. Alkoksidui gauti reikia labai stiprios bazės: šarminio metalo ar $NaH$.',
              'Alcohols are very weak acids, similar to water, so they give practically no alkoxide with an aqueous alkali. An alkoxide needs a very strong base: an alkali metal or $NaH$.'),
            src: 'L11 p6'
          };
        }
        const res = react.run('alc.na', [alc], { metal: R.m });
        const prod = firstMajor(res);
        if (!prod) throw new Error('u11.acid: no alkoxide for ' + alc);
        const alkene = (() => { const r = react.run('elim', [alc], { base: 'heat-acid' }); return r.none ? null : firstMajor(r); })();
        const isos = isoAlcohols(ctx, alc);
        const extras = [];
        if (isos.length) extras.push({ mol: { smi: firstMajor(react.run('alc.na', [ctx.pick(isos)], { metal: R.m })) } });
        if (alkene) extras.push({ mol: { smi: alkene + '.[' + R.m + '+].[OH-]' } });
        const wrongMetal = R.k === 'K' ? 'Na' : 'K';
        extras.push({ mol: { smi: prod.replace(/\[(Na|K)\+\]/, '[' + wrongMetal + '+]') } });
        const options = optionList(ctx, { mol: { smi: prod } }, extras, 4);
        const wordsGas = [
          tx('Išsiskiria bespalvės dujos (burbuliukai) – vandenilis.', 'A colourless gas (bubbles) is evolved: hydrogen.'),
          tx('Tirpalas pasidaro oranžinis ir išsiskiria rudos dujos.', 'The solution turns orange and brown fumes appear.'),
          tx('Iškrenta rudos $MnO2$ nuosėdos.', 'Brown $MnO2$ precipitates.'),
          tx('Išsiskiria $CO2$, kalkių vanduo drumsčiasi.', '$CO2$ is evolved and lime water turns cloudy.')
        ];
        return {
          q,
          steps: [
            {
              prompt: t('Koks susidaro organinis produktas?', 'What organic product forms?'),
              kind: 'choice', options, answer: 0,
              hint: t('Alkoholis čia elgiasi kaip rūgštis: kuris atomas netenka protono?', 'Here the alcohol acts as an acid: which atom loses its proton?'),
              solution: [
                { p: t('Šarminis metalas (ar $NaH$) atplėšia protoną nuo $O-H$ grupės; deguonis lieka su neigiamu krūviu, o metalas virsta katijonu.', 'The alkali metal (or $NaH$) takes the proton from the $O-H$ group; oxygen keeps the negative charge and the metal becomes a cation.') },
                { mol: { smi: prod } }
              ]
            },
            {
              prompt: t('Ką pastebėsite per šią reakciją?', 'What would you observe during this reaction?'),
              kind: 'choice', options: wordsGas, answer: 0,
              hint: t('Pagalvokite, kuo virsta alkoholio protonas ir metalo elektronas (ar hidrido jonas).', 'Think what the proton of the alcohol and the electron of the metal (or the hydride ion) turn into.'),
              solution: t('Alkoholio protonas ir metalo elektronas (ar hidrido jonas) sudaro vandenilio dujas, todėl matyti burbuliukai.', 'The proton of the alcohol and the electron of the metal (or the hydride ion) make hydrogen gas, so bubbles are seen.')
            },
            {
              prompt: t('Parašykite išsiskiriančių dujų formulę.', 'Write the formula of the gas that is evolved.'),
              kind: 'formula', mol: { smi: '[H][H]' }, answer: 'H2',
              hint: t('Du vandenilio atomai jungiasi į molekulę.', 'Two hydrogen atoms combine into a molecule.'),
              solution: t('Dujos – vandenilis $H2$: ' + (R.k === 'NaH' ? 'hidrido jonas atplėšia protoną.' : 'dvi elektronų ir protonų poros sudaro $H2$.'), 'The gas is hydrogen $H2$: ' + (R.k === 'NaH' ? 'the hydride ion takes the proton.' : 'two electron and proton pairs make $H2$.'))
            }
          ],
          why: t('Alkoholis yra silpna rūgštis, bet labai stipri bazė (šarminis metalas arba $NaH$) jį visiškai deprotonuoja. Susidaro alkoksidas ir vandenilis, kuris išsiskiria dujų burbuliukais.',
            'An alcohol is a weak acid, but a very strong base (an alkali metal or $NaH$) deprotonates it completely. An alkoxide and hydrogen form, and the hydrogen bubbles off as a gas.'),
          src: 'L11 p6, p7; S5.3'
        };
      }
    },
    /* ---- alcohol + HX / PBr3 / SOCl2 ---- */
    {
      id: 'u11.hx',
      title: t('Alkoholis virsta halogenalkanu', 'Alcohol to haloalkane'),
      mirrors: ['S5.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        let pick = null;
        for (let tries = 0; tries < 80 && !pick; tries++) {
          const alc = ctx.pick(ALL_ALC);
          if (react.wouldRearrange(alc)) continue;
          const s = site(chem, alc);
          const kind = ctx.pick(['hx', 'hx', 'hx', 'p']);
          let X, lab;
          if (kind === 'hx') {
            X = s.k === 3 ? ctx.pick(['Cl', 'Br', 'I']) : ctx.pick(['Br', 'I']);
            lab = X;
          } else {
            const r = ctx.pick(['PBr3', 'SOCl2']);
            X = r === 'PBr3' ? 'Br' : 'Cl';
            lab = r;
          }
          const res = react.run('alc.hx', [alc], { X });
          const majors = majorsOf(res);
          if (res.none || majors.length !== 1) continue;
          pick = { alc, s, kind, X, lab, prod: majors[0], mech: res.mech };
        }
        if (!pick) throw new Error('u11.hx: no usable alcohol');
        const { alc, s, kind, X, lab, prod } = pick;
        const alkene = firstMajor(react.run('elim', [alc], { base: 'heat-acid' }));
        const alkane = alkene ? firstMajor(react.run('ae.h2', [alkene], {})) : null;
        const isoHal = alkane ? react.run('sr.halogenate', [alkane], { X: 'Br' }).products.filter(p => !p.by).map(p => p.smi.replace('Br', X)) : [];
        const extras = [];
        if (alkene) extras.push({ scheme: { items: [{ smi: alkene }, { plus: true }, { smi: HX_SMI[X] }] } });
        extras.push(prod.replace(X, ctx.pick(otherHal(X))));
        extras.push(...ctx.shuffle(isoHal.slice()));
        const options = optionList(ctx, { mol: { smi: prod } }, extras, 4);
        const arrowItem = kind === 'hx' && s.k < 3 ? { arrow: '→', above: f('Δ') } : (kind === 'hx' ? { arrow: '→' } : { arrow: '→', above: f(lab) });
        const q = [{ scheme: { items: kind === 'hx' ? [{ smi: alc }, { plus: true }, { smi: HX_SMI[X] }, arrowItem] : [{ smi: alc }, arrowItem] } }];
        const steps = [classStep(s)];
        if (kind === 'hx') {
          const sn2 = pick.mech === 'SN2';
          steps.push({
            prompt: t('Kuriuo mechanizmu vyksta ši reakcija?', 'By which mechanism does this reaction proceed?'),
            kind: 'choice', options: [tx('SN1', 'SN1'), tx('SN2', 'SN2'), tx('E1', 'E1'), tx('AE', 'AE')], answer: sn2 ? 1 : 0,
            hint: t('Ar iš protonuoto alkoholio gali lengvai susidaryti pakankamai stabilus karbokatijonas?', 'Can a reasonably stable carbocation form easily from the protonated alcohol?'),
            solution: sn2
              ? t('Pirminis katijonas per nestabilus, todėl bromidas (ar kitas halogenidas) iš galinės pusės išstumia vandenį vienu žingsniu: SN2.', 'A primary cation is too unstable, so the halide attacks from behind and pushes out water in one step: SN2.')
              : t('Antriniai ir tretiniai alkoholiai praranda vandenį ir sudaro karbokatijoną, prie kurio jungiasi halogenidas: SN1.', 'Secondary and tertiary alcohols lose water to give a carbocation, to which the halide then bonds: SN1.')
          });
        }
        steps.push({
          prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: 'choice', options, answer: 0,
          hint: t('OH grupė pakeičiama halogenu; atidžiai pažiūrėkite, kuris halogenas pateiktas reagente.', 'The OH group is replaced by a halogen; check which halogen the reagent supplies.'),
          solution: [{ p: t('OH grupė (protonuota – kaip $H2O$) išeina, o jos vietą užima halogenas; anglies skeletas nesikeičia.', 'The OH group (protonated, so it leaves as $H2O$) is replaced by the halogen; the carbon skeleton does not change.') }, { mol: { smi: prod } }]
        });
        const ns = nameStep(ctx, prod);
        if (ns) steps.push(ns);
        return {
          q,
          steps,
          why: t('Alkoholio OH yra bloga nueinančioji grupė, bet protonuota (arba su $PBr3$, $SOCl2$ paversta geresne) ji išeina. Pirminiai alkoholiai reaguoja SN2, antriniai ir tretiniai – SN1 per karbokatijoną. Rezultatas: halogenalkanas su tuo pačiu skeletu.',
            'The OH of an alcohol is a poor leaving group, but once protonated (or converted into a better one by $PBr3$ or $SOCl2$) it leaves. Primary alcohols react by SN2, secondary and tertiary by SN1 through a carbocation. The result is a haloalkane with the same skeleton.'),
          src: 'L11 p8, p9, p10'
        };
      }
    },
    /* ---- mechanism of the haloalkane formation ---- */
    {
      id: 'u11.mech',
      title: t('Alkoholio ir HX mechanizmas: SN1 ir SN2', 'The mechanism of alcohol + HX: SN1 and SN2'),
      mirrors: [],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const e = ctx.pick(MECH_POOL);
        const X = ctx.pick(['Cl', 'Br', 'I']);
        const alc = e.a;
        const s = site(chem, alc);
        const res = react.run('alc.hx', [alc], { X });
        const prod = firstMajor(res);
        if (!prod) throw new Error('u11.mech: no product');
        const ox = replaceAtom(alc, s.o, '[OH2+]');
        const xm = '[' + X + '-]';
        const protonation = {
          scheme: { items: [{ smi: alc, opts: { lonePairs: [s.o] } }, { plus: true }, { smi: HX_SMI[X], opts: { allH: true } }] },
          arrows: [{ from: { m: 0, lp: s.o }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
          note: t('Deguonies laisvoji pora sudaro ryšį su $H+$; $H-X$ elektronai pereina halogenui.', 'A lone pair of oxygen bonds to $H+$; the $H-X$ electrons go to the halogen.')
        };
        const tertiaryLike = !!e.cat;
        const steps = [
          {
            prompt: t('Bakstelėkite atomą, kurį pirmiausia protonuoja rūgštis.', 'Tap the atom that the acid protonates first.'),
            kind: 'atoms', mol: { smi: alc, opts: { numbers: 'all' } }, answer: [s.o],
            hint: t('Ieškokite labiausiai baziško atomo su laisvosiomis elektronų poromis.', 'Look for the most basic atom, the one with lone pairs.'),
            solution: [{ p: t('Deguonies atomas (Nr. ' + (s.o + 1) + ') turi laisvąsias poras, todėl jis protonuojamas pirmas; susidaro oksonio jonas, o $OH2+$ yra gera nueinančioji grupė.', 'The oxygen (no. ' + (s.o + 1) + ') has lone pairs, so it is protonated first; this gives an oxonium ion, and $OH2+$ is a good leaving group.') }, { mech: [protonation] }]
          }
        ];
        if (tertiaryLike) {
          const ci = chargedAtom(chem, e.cat);
          const options = optionList(ctx, { mol: { smi: e.cat } }, [{ mol: { smi: e.alt } }, tx('Jokio katijono: halogenidas atakuoja iš karto', 'No cation: the halide attacks at once')], 3);
          steps.push({
            prompt: t('Kokia tarpinė dalelė susidaro, kai nuo oksonio jono atskyla vanduo?', 'Which intermediate forms when water leaves the oxonium ion?'),
            kind: 'choice', options, answer: 0,
            hint: t('Teigiamas krūvis lieka ten, kur buvo C–O ryšys. Kuris katijonas stabilesnis?', 'The positive charge stays where the C–O bond was. Which cation is more stable?'),
            solution: [
              { p: t('Vanduo išeina su abiem C–O ryšio elektronais; krūvį pasilieka anglis, kuri turėjo OH. Šis ' + (s.k === 3 ? 'tretinis' : 'antrinis') + ' katijonas stabiliausias iš galimų.', 'Water leaves with both electrons of the C–O bond and the carbon that carried the OH keeps the charge. This ' + (s.k === 3 ? 'tertiary' : 'secondary') + ' cation is the most stable one possible.') },
              { mech: [{ scheme: { items: [{ smi: ox }] }, arrows: [{ from: { m: 0, b: [s.c, s.o] }, to: { m: 0, a: s.o } }], note: t('$C-O$ ryšio elektronai pereina deguoniui: išeina $H2O$.', 'The $C-O$ electrons go to oxygen: $H2O$ leaves.') },
                { scheme: { items: [{ smi: e.cat }, { plus: true }, { smi: xm, opts: { lonePairs: true } }] }, arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: ci } }], note: t('Halogenido laisvoji pora sudaro ryšį su karbokatijonu.', 'A lone pair of the halide bonds to the carbocation.') }] }
            ]
          });
        } else {
          steps.push({
            prompt: t('Kaip ištrūksta vanduo iš pirminio oksonio jono?', 'How does water leave a primary oxonium ion?'),
            kind: 'choice',
            options: [
              tx('Halogenidas atakuoja anglį iš priešingos pusės, o vanduo išeina tuo pačiu metu.', 'The halide attacks the carbon from the opposite side while water leaves at the same moment.'),
              tx('Pirmiausia susidaro pirminis karbokatijonas, po to prisijungia halogenidas.', 'A primary carbocation forms first, then the halide bonds to it.'),
              tx('Nuo gretimos anglies atskyla protonas ir susidaro alkenas.', 'A proton leaves the neighbouring carbon and an alkene forms.'),
              tx('Halogenidas pirmiausia prisijungia prie deguonies.', 'The halide bonds to oxygen first.')
            ],
            answer: 0,
            hint: t('Ar pirminis katijonas pakankamai stabilus, kad susidarytų kaip tarpinė dalelė?', 'Is a primary cation stable enough to form as an intermediate?'),
            solution: [
              { p: t('Pirminis katijonas per nestabilus, todėl nukleofilas jungiasi iš galinės pusės, kol vanduo išeina: vienas žingsnis, SN2.', 'A primary cation is too unstable, so the nucleophile bonds from the back while water leaves: one step, SN2.') },
              { mech: [{ scheme: { items: [{ smi: ox }, { plus: true }, { smi: xm, opts: { lonePairs: true } }] }, arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: s.c } }, { from: { m: 0, b: [s.c, s.o] }, to: { m: 0, a: s.o } }], note: t('Halogenidas atakuoja anglį, tuo pačiu išeina $H2O$.', 'The halide attacks the carbon while $H2O$ leaves.') }] }
            ]
          });
        }
        steps.push({
          prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
          kind: 'choice', options: [tx('SN1', 'SN1'), tx('SN2', 'SN2'), tx('E1', 'E1'), tx('AE', 'AE')], answer: tertiaryLike ? 0 : 1,
          hint: t('Ar yra karbokatijono tarpinė dalelė, ar viskas vyksta vienu žingsniu?', 'Is there a carbocation intermediate, or does everything happen in one step?'),
          solution: tertiaryLike
            ? t('Su karbokatijono tarpine dalele, kurios susidarymas lėtas: SN1.', 'With a carbocation intermediate whose formation is slow: SN1.')
            : t('Vienas žingsnis su atakuojančiu nukleofilu ir išeinančia grupe vienu metu: SN2.', 'One step with the nucleophile attacking and the leaving group departing together: SN2.')
        });
        return {
          q: [{ p: t('Alkoholis reaguoja su vandenilio halogenidu.', 'An alcohol reacts with a hydrogen halide.') }, { scheme: { items: [{ smi: alc }, { plus: true }, { smi: HX_SMI[X] }, { arrow: '→' }, { smi: prod }, { plus: true }, { smi: 'O' }] } }],
          steps,
          why: t('Pirmasis žingsnis visada tas pats: protonuojamas deguonis. Toliau lemia katijono stabilumas: tretinis ir antrinis alkoholiai sudaro karbokatijoną (SN1), pirminiai nesudaro ir reaguoja SN2 būdu.',
            'The first step is always the same: oxygen is protonated. What follows depends on the stability of the cation: tertiary and secondary alcohols form a carbocation (SN1), primary ones do not and react by SN2.'),
          src: 'L11 p9, p10'
        };
      }
    },
    /* ---- dehydration to alkenes (S5.4) ---- */
    {
      id: 'u11.elim',
      title: t('Dehidratacija į alkenus: Zaicevo taisyklė', 'Dehydration to alkenes: Zaitsev’s rule'),
      mirrors: ['S5.4', 'S5.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        let pick = null;
        for (let tries = 0; tries < 80 && !pick; tries++) {
          const alc = ctx.pick(SEC.concat(TERT));
          if (react.wouldRearrange(alc)) continue;
          const res = react.run('elim', [alc], { base: 'heat-acid' });
          if (res.none) continue;
          const prods = res.products.filter(p => !p.by);
          const majors = prods.filter(p => p.major);
          if (prods.length < 2 || majors.length !== 1) continue;
          pick = { alc, prods: prods.map(p => p.smi), major: majors[0].smi, mech: res.mech };
        }
        if (!pick) throw new Error('u11.elim: no usable alcohol');
        const { alc, major } = pick;
        const s = site(chem, alc);
        const formed = pick.prods;
        const formedKeys = new Set(formed.map(x => canon(ctx, x)));
        // alkenes of the same skeleton that cannot form (double bond not next to the carbinol carbon)
        const alkane = firstMajor(react.run('ae.h2', [major], {}));
        const decoys = [];
        react.run('sr.halogenate', [alkane], { X: 'Br' }).products.filter(p => !p.by).forEach(p => {
          const r = react.run('elim', [p.smi], { base: 'strong' });
          if (!r.none) r.products.filter(x => !x.by).forEach(x => { if (!formedKeys.has(canon(ctx, x.smi)) && !decoys.some(d => canon(ctx, d) === canon(ctx, x.smi))) decoys.push(x.smi); });
        });
        const dec = ctx.shuffle(decoys.slice());
        const step1opts = formed.map(x => ({ mol: { smi: x } })).concat(dec.slice(0, 2).map(x => ({ mol: { smi: x } })));
        const minors = formed.filter(x => canon(ctx, x) !== canon(ctx, major));
        const domOpts = optionList(ctx, { mol: { smi: major } }, minors.concat(dec.slice(0, 1)), 4);
        const steps = [
          {
            prompt: t('Pažymėkite visus alkenus, kurie gali susidaryti.', 'Pick every alkene that can form.'),
            kind: 'multi', options: step1opts, answer: formed.map((_, i) => i),
            hint: t('Dvigubas ryšys susidaro tarp anglies, kuri turėjo OH, ir gretimos anglies, turinčios vandenilį.', 'The double bond forms between the carbon that carried the OH and a neighbouring carbon that has a hydrogen.'),
            solution: t('Galimi tik alkenai, kuriuose dvigubas ryšys prasideda ties anglimi, turėjusia OH. Alkenai, kurių dvigubas ryšys nutolęs, šios reakcijos metu nesusidaro.', 'Only alkenes whose double bond starts at the carbon that carried the OH can form. Alkenes with the double bond farther away do not form in this reaction.')
          },
          {
            prompt: t('Kuris alkenas vyrauja?', 'Which alkene predominates?'),
            kind: 'choice', options: domOpts, answer: 0,
            hint: t('Palyginkite, prie kiek alkilgrupių yra dvigubas ryšys kiekviename alkene.', 'Compare how many alkyl groups sit on the double bond in each alkene.'),
            solution: [{ p: t('Pagal Zaicevo taisyklę vyrauja alkenas, kurio dvigubasis ryšys turi daugiausia alkilgrupių: protonas atskyla nuo gretimo C atomo, turinčio mažiausiai vandenilių.', 'By Zaitsev’s rule the alkene with the most alkyl groups on the double bond predominates: the proton leaves the neighbouring carbon that has the fewest hydrogens.') }, { mol: { smi: major } }]
          },
          {
            prompt: t('Kokio tipo karbokatijonas susidaro pirmajame etape po vandens atskilimo?', 'What type of carbocation forms after water has left?'),
            kind: 'choice', options: [tx('Pirminis karbokatijonas', 'Primary carbocation'), tx('Antrinis karbokatijonas', 'Secondary carbocation'), tx('Tretinis karbokatijonas', 'Tertiary carbocation')], answer: s.k - 1,
            hint: t('Karbokatijono tipas sutampa su alkoholio, iš kurio jis susidarė, klase.', 'The type of the carbocation matches the class of the alcohol it came from.'),
            solution: t('Teigiamas krūvis lieka ant anglies, turėjusios OH, o ji ' + (s.k === 3 ? 'turi tris' : 'turi dvi') + ' anglies kaimynes: ' + CLS_LT[s.k - 1] + ' katijonas.', 'The positive charge stays on the carbon that carried the OH, which has ' + (s.k === 3 ? 'three' : 'two') + ' carbon neighbours: a ' + CLS_EN[s.k - 1] + ' cation.')
          },
          {
            prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
            kind: 'choice', options: [tx('E1', 'E1'), tx('E2', 'E2'), tx('SN1', 'SN1'), tx('AE', 'AE')], answer: 0,
            hint: t('Pirmiausia protonuojamas deguonis, po to išeina vanduo. Ar yra karbokatijono tarpinė dalelė?', 'The oxygen is protonated first, then water leaves. Is there a carbocation intermediate?'),
            solution: t('Antriniai ir tretiniai alkoholiai su stipria rūgštimi dehidratuojasi per karbokatijoną: eliminavimas E1.', 'Secondary and tertiary alcohols dehydrate in strong acid through a carbocation: elimination E1.')
          }
        ];
        if (rng() < 0.5) { const ns = nameStep(ctx, major, t('Pavadinkite pagrindinį produktą.', 'Name the main product.')); if (ns) steps.push(ns); }
        return {
          q: [{ p: t('Alkoholis kaitinamas su koncentruota sieros rūgštimi.', 'The alcohol is heated with concentrated sulfuric acid.') }, { scheme: { items: [{ smi: alc }, { arrow: '→', above: f('H2SO4, Δ') }] } }],
          steps,
          why: t('Rūgštyje alkoholis protonuojamas, praranda vandenį ir sudaro karbokatijoną, po to protonas atskyla nuo gretimos anglies (E1). Kai galimi keli alkenai, vyrauja stabiliausias, daugiausia pakeistas (Zaicevo taisyklė).',
            'In acid the alcohol is protonated, loses water to form a carbocation, and then a proton leaves a neighbouring carbon (E1). When several alkenes are possible the most stable, most substituted one predominates (Zaitsev’s rule).'),
          src: 'L11 p12, p13; S5.4'
        };
      }
    }
    ,
    /* ---- oxidation (S5.7) ---- */
    {
      id: 'u11.ox',
      title: t('Alkoholių oksidacija: PCC ir chromo rūgštis', 'Oxidation of alcohols: PCC and chromic acid'),
      mirrors: ['S5.7', 'S5.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        let alc, s, RE, res, prod, options;
        for (let tries = 0; tries < 40 && !(options && options.length >= 3); tries++) {
        alc = ctx.pick(ALL_ALC);
        s = site(chem, alc);
        RE = ctx.pick([
          { lab: 'PCC, CH2Cl2', rule: 'PCC' }, { lab: 'PCC, CH2Cl2', rule: 'PCC' },
          { lab: 'CrO3, H3O+', rule: 'chromic' }, { lab: 'Na2Cr2O7, H2SO4, H2O', rule: 'chromic' }, { lab: 'K2Cr2O7, H2SO4', rule: 'chromic' }, { lab: 'KMnO4, H3O+', rule: 'chromic' }
        ]);
        res = react.run('alc.ox', [alc], { reagent: RE.rule });
        prod = res.none ? null : firstMajor(res);
        const oxOf = (a, rule) => { const r = react.run('alc.ox', [a], { reagent: rule }); return r.none ? null : firstMajor(r); };
        const noRxn = tx('Reakcija nevyksta', 'No reaction');
        const isos = ctx.shuffle(isoAlcohols(ctx, alc));
        const extras = [];
        if (s.k === 1) {
          const other = oxOf(alc, RE.rule === 'PCC' ? 'chromic' : 'PCC');   // the other stage of oxidation
          if (other) extras.push(other);
          isos.forEach(a => { const x = oxOf(a, 'PCC'); if (x && site(chem, a).k > 1) extras.push(x); });
          extras.push(noRxn);
        } else if (s.k === 2) {
          isos.forEach(a => { const x = oxOf(a, 'PCC'); if (x) extras.push(x); });
          extras.push(noRxn);
        } else {
          isos.forEach(a => { const x = oxOf(a, 'PCC'); if (x) extras.push(x); });
        }
        const right = prod ? { mol: { smi: prod } } : noRxn;
        options = optionList(ctx, right, extras, 4);
        }
        if (!options || options.length < 3) throw new Error('u11.ox: too few options');
        const ns = prod ? nameStep(ctx, prod, t('Pavadinkite produktą.', 'Name the product.')) : null;
        const whyStrong = s.k === 1 && RE.rule === 'chromic';
        const steps = [
          classStep(s),
          {
            prompt: t('Koks yra produktas?', 'What is the product?'),
            kind: 'choice', options, answer: 0,
            hint: s.k === 3
              ? t('Ar anglis su OH turi vandenilio, kurį galima prarasti oksidacijoje?', 'Does the carbon with the OH have a hydrogen that can be lost in the oxidation?')
              : t('Pažiūrėkite ir į alkoholio klasę, ir į oksidatoriaus stiprumą.', 'Consider both the class of the alcohol and the strength of the oxidant.'),
            solution: [{
              p: s.k === 3
                ? t('Tretinis alkoholis neturi vandenilio prie anglies su OH, todėl įprastomis sąlygomis neoksiduojasi.', 'A tertiary alcohol has no hydrogen on the carbon with the OH, so it is not oxidised under the usual conditions.')
                : s.k === 2
                  ? t('Antrinis alkoholis oksiduojasi į ketoną su bet kuriuo iš šių oksidatorių: ketonas tolesnės oksidacijos nebeturi kur vykti.', 'A secondary alcohol is oxidised to a ketone with any of these oxidants; the ketone cannot be oxidised further.')
                  : (whyStrong
                    ? t('Vandeninėje rūgščioje terpėje stiprus oksidatorius pirminį alkoholį oksiduoja per aldehidą iki karboksirūgšties; aldehidas neišskiriamas.', 'In aqueous acid a strong oxidant takes a primary alcohol through the aldehyde to the carboxylic acid; the aldehyde is not isolated.')
                    : t('PCC dichlormetane yra švelnus oksidatorius: pirminis alkoholis sustoja ties aldehidu.', 'PCC in dichloromethane is a mild oxidant: a primary alcohol stops at the aldehyde.'))
            }].concat(prod ? [{ mol: { smi: prod } }] : [])
          }
        ];
        if (ns) steps.push(ns);
        return {
          q: [{ scheme: { items: [{ smi: alc }, { arrow: '→', above: f(RE.lab) }] } }],
          steps,
          why: t('Oksidacijos produktą lemia alkoholio klasė ir oksidatorius. Pirminis alkoholis su PCC sustoja ties aldehidu, su stipriu oksidatoriumi vandeninėje rūgštyje virsta rūgštimi; antrinis visada duoda ketoną; tretinis neoksiduojasi.',
            'The product of an oxidation depends on the class of the alcohol and on the oxidant. A primary alcohol stops at the aldehyde with PCC and becomes the acid with a strong oxidant in aqueous acid; a secondary alcohol always gives a ketone; a tertiary alcohol is not oxidised.'),
          src: 'L11 p20, p21, p22, p23; S5.7'
        };
      }
    },
    /* ---- schemes with A and B (S5.15) ---- */
    {
      id: 'u11.chain',
      title: t('Schemos su A ir B: alkoholis iš halogenalkano ar alkeno', 'Schemes with A and B: the alcohol from a haloalkane or an alkene'),
      mirrors: ['S5.15'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const HALS = ['CCCBr', 'CCCCBr', 'CCCCCBr', 'CC(C)CBr', 'CCCCCCBr', 'BrCC1CCCCC1', 'CCCCI', 'CCCCCl', 'CCC(C)CBr', 'BrCC1CCCC1', 'CC(C)CCBr', 'CCCI', 'CCCCCCI', 'CCCCCCl'];
        const ALKS = ['CCC=C', 'CC(C)=C', 'CC(C)=CC', 'CCCC=C', 'CCC(C)=C', 'C1=CCCCC1', 'CC1=CCCC1', 'C=C1CCCC1', 'CCCCC=C', 'CC(C)CC=C', 'CC(C)=CCC', 'CC=C', 'CCC=C(C)C', 'CCC(C)=CC', 'CC1=CCCCC1', 'C=C1CCCCC1'];
        const fromHal = rng() < 0.5;
        const OXR = ctx.pick([{ lab: 'PCC, CH2Cl2', rule: 'PCC' }, { lab: 'CrO3, H3O+', rule: 'chromic' }, { lab: 'Na2Cr2O7, H2SO4, H2O', rule: 'chromic' }]);
        let start = null, A = null, mech = null, step1 = null;
        for (let tries = 0; tries < 80 && !A; tries++) {
          if (fromHal) {
            const h = ctx.pick(HALS);
            const r = react.run('sn2', [h], { nu: 'OH' });
            const m = majorsOf(r);
            if (r.none || m.length !== 1 || r.products.length !== 1) continue;
            start = h; A = m[0]; mech = 'SN2'; step1 = f('NaOH');
          } else {
            const a = ctx.pick(ALKS);
            if (react.wouldRearrange(a)) continue;
            const r = react.run('ae.h2o', [a], {});
            const m = majorsOf(r);
            if (r.none || m.length !== 1) continue;
            start = a; A = m[0]; mech = 'AE'; step1 = f('H2O, H2SO4');
          }
        }
        if (!A) throw new Error('u11.chain: no usable start');
        const sA = site(chem, A);
        const rB = react.run('alc.ox', [A], { reagent: OXR.rule });
        const B = rB.none ? null : firstMajor(rB);
        const noRxn = tx('B nesusidaro: reakcija nevyksta', 'B does not form: no reaction');
        // wrong options for A: another alcohol of the same formula, an ether of the same formula
        const isos = ctx.shuffle(isoAlcohols(ctx, A));
        const etherSmi = ETHER_BY_FORMULA[formulaOf(ctx, A)];
        const extrasA = isos.slice(0, 2).concat(etherSmi ? [etherSmi] : []);
        const optsA = optionList(ctx, { mol: { smi: A } }, extrasA, 4);
        const otherOx = oxOfRule(react, A, OXR.rule === 'PCC' ? 'chromic' : 'PCC');
        const extrasB = [];
        if (sA.k === 1 && otherOx) extrasB.push(otherOx);
        isos.forEach(a => { const r = react.run('alc.ox', [a], { reagent: OXR.rule }); if (!r.none) extrasB.push(firstMajor(r)); });
        extrasB.push(A);
        const optsB = optionList(ctx, B ? { mol: { smi: B } } : noRxn, extrasB.concat(B ? [noRxn] : []), 4);
        const steps = [
          {
            prompt: t('Koks yra junginys A?', 'What is compound A?'),
            kind: 'choice', options: optsA, answer: 0,
            hint: fromHal ? t('Hidroksido jonas yra nukleofilas, o pirminis halogenalkanas reaguoja SN2 būdu.', 'The hydroxide ion is the nucleophile and a primary haloalkane reacts by SN2.')
              : t('Vanduo jungiasi prie dvigubo ryšio rūgštyje. Kuriam atomui atitenka OH pagal Markovnikovo taisyklę?', 'Water adds across the double bond in acid. Which carbon gets the OH by Markovnikov’s rule?'),
            solution: [{
              p: fromHal ? t('Halogeną pakeičia OH grupė (SN2); anglies skeletas ir OH vieta nesikeičia.', 'The halogen is replaced by OH (SN2); the skeleton and the position of the OH do not change.')
                : t('Protonas jungiasi prie dvigubo ryšio atomo su daugiau vandenilių, todėl OH atitenka atomui, kuris sudaro stabilesnį karbokatijoną (Markovnikovo taisyklė).', 'The proton bonds to the double-bond carbon with more hydrogens, so the OH goes to the carbon that makes the more stable cation (Markovnikov’s rule).')
            }, { mol: { smi: A } }]
          },
          {
            prompt: t('Koks yra junginys B?', 'What is compound B?'),
            kind: 'choice', options: optsB, answer: 0,
            hint: t('Pirmiausia nustatykite alkoholio A klasę, tada žiūrėkite į oksidatorių.', 'First decide the class of alcohol A, then look at the oxidant.'),
            solution: [{
              p: B ? (sA.k === 1
                ? (OXR.rule === 'PCC' ? t('A yra pirminis alkoholis, PCC jį oksiduoja iki aldehido.', 'A is a primary alcohol and PCC oxidises it to the aldehyde.') : t('A yra pirminis alkoholis, o stiprus oksidatorius vandeninėje rūgštyje jį oksiduoja iki karboksirūgšties.', 'A is a primary alcohol and a strong oxidant in aqueous acid oxidises it to the carboxylic acid.'))
                : t('A yra antrinis alkoholis: jis oksiduojasi iki ketono.', 'A is a secondary alcohol: it is oxidised to a ketone.'))
                : t('A yra tretinis alkoholis, kuris neoksiduojasi, todėl B nesusidaro.', 'A is a tertiary alcohol, which is not oxidised, so B does not form.')
            }].concat(B ? [{ mol: { smi: B } }] : [])
          },
          {
            prompt: t('Kuriuo simboliu žymimas pirmosios reakcijos (į A) mechanizmas?', 'Which symbol names the mechanism of the first reaction (to A)?'),
            kind: 'choice', options: [tx('SN2', 'SN2'), tx('AE', 'AE'), tx('E2', 'E2'), tx('SN1', 'SN1')], answer: fromHal ? 0 : 1,
            hint: fromHal ? t('Pirminis halogenalkanas ir stiprus nukleofilas.', 'A primary haloalkane and a strong nucleophile.') : t('Reagentas prisijungia prie dvigubo ryšio.', 'A reagent adds across a double bond.'),
            solution: fromHal ? t('Pirminis halogenalkanas su $OH-$: nukleofilinis pakeitimas SN2.', 'A primary haloalkane with $OH-$: nucleophilic substitution, SN2.') : t('Alkenas prijungia vandenį rūgštyje: elektrofilinis prijungimas AE.', 'An alkene adds water in acid: electrophilic addition, AE.')
          }
        ];
        return {
          q: [
            { p: t('Įrašykite junginių A ir B formules.', 'Write the formulas of compounds A and B.') },
            { scheme: { items: [{ smi: start }, { arrow: '→', above: step1 }, { arrow: '→', above: f(OXR.lab) }] }, caption: t('Pradinis junginys – prieš pirmąją rodyklę, A – tarp rodyklių, B – po antrosios.', 'The starting compound is before the first arrow, A between the arrows, B after the second.') }
          ],
          steps,
          why: t('Schemą skaitykite po vieną reakciją. Pirmiausia nustatykite, ar halogenas pakeičiamas (SN2), ar prijungiamas vanduo (AE); tada pagal gauto alkoholio klasę ir oksidatorių nustatykite B: aldehidas, rūgštis, ketonas ar jokios reakcijos.',
            'Read the scheme one reaction at a time. First decide whether the halogen is replaced (SN2) or water is added (AE); then use the class of the alcohol and the oxidant to find B: aldehyde, acid, ketone, or no reaction.'),
          src: 'L11 p20, p21, p26; S5.15'
        };
      }
    },
    /* ---- Williamson ether synthesis ---- */
    {
      id: 'u11.willi',
      title: t('Viljamsono eterių sintezė: kurią porą rinktis?', 'Williamson ether synthesis: which pair to choose?'),
      mirrors: [],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        // [ether, [alcohol, halide template], [alcohol, halide template] or null, kind of the failing route]
        const T = [
          ['COC(C)(C)C', ['CC(C)(C)O', 'CX'], ['CO', 'CC(C)(C)X'], 'tert'],
          ['COCC', ['CCO', 'CX'], ['CO', 'CCX'], 'tie'],
          ['CCOc1ccccc1', ['Oc1ccccc1', 'CCX'], ['CCO', 'c1ccccc1X'], 'aryl'],
          ['COC1CCCC1', ['OC1CCCC1', 'CX'], ['CO', 'C1CCCC1X'], 'sec'],
          ['CCOC(C)C', ['CC(C)O', 'CCX'], ['CCO', 'CC(C)X'], 'sec'],
          ['COC1CCCCC1', ['OC1CCCCC1', 'CX'], ['CO', 'C1CCCCC1X'], 'sec'],
          ['CCCOC(C)(C)C', ['CC(C)(C)O', 'CCCX'], ['CCCO', 'CC(C)(C)X'], 'tert'],
          ['COc1ccccc1', ['Oc1ccccc1', 'CX'], ['CO', 'c1ccccc1X'], 'aryl'],
          ['CCCOCC', ['CCCO', 'CCX'], ['CCO', 'CCCX'], 'tie'],
          ['CCC(C)OC', ['CCC(C)O', 'CX'], ['CO', 'CCC(C)X'], 'sec'],
          ['CCCCOCC', ['CCCCO', 'CCX'], ['CCO', 'CCCCX'], 'tie'],
          ['CCOC(C)(C)C', ['CC(C)(C)O', 'CCX'], ['CCO', 'CC(C)(C)X'], 'tert'],
          ['CCOC1CCCCC1', ['OC1CCCCC1', 'CCX'], ['CCO', 'C1CCCCC1X'], 'sec'],
          ['CCOC(C)(C)CC', ['CCC(C)(C)O', 'CCX'], ['CCO', 'CCC(C)(C)X'], 'tert'],
          ['CCCCOc1ccccc1', ['Oc1ccccc1', 'CCCCX'], ['CCCCO', 'c1ccccc1X'], 'aryl'],
          ['COCC1CCCCC1', ['OCC1CCCCC1', 'CX'], ['CO', 'XCC1CCCCC1'], 'tie']
        ];
        const e = ctx.pick(T);
        const X = ctx.pick(HAL);
        const [ether, good, bad, kind] = e;
        const hal = (tpl) => tpl.replace('X', X);
        const alkoxide = (alc) => (site(chem, alc) ? firstMajor(react.run('alc.na', [alc], { metal: 'Na' })) : alc.replace('O', '[O-]') + '.[Na+]');
        const routeOf = (r) => ({ alc: r[0], halide: hal(r[1]), alkoxide: alkoxide(r[0]) });
        const rGood = routeOf(good), rBad = routeOf(bad);
        const tie = kind === 'tie';
        // self-check against the engine: the good route gives the ether; the bad route does not (unless it is a tie)
        const prodOf = (r) => { const x = react.run('williamson', [r.alkoxide, r.halide], {}); return x.none ? null : firstMajor(x); };
        const pg = prodOf(rGood);
        if (!pg || canon(ctx, pg) !== canon(ctx, ether)) throw new Error('u11.willi: route does not give ' + ether);
        const pb = prodOf(rBad);
        const badWorks = pb && canon(ctx, pb) === canon(ctx, ether);
        if (tie !== !!badWorks) throw new Error('u11.willi: tie flag disagrees with the engine for ' + ether);
        const pairOpt = (r) => ({ scheme: { items: [{ smi: r.alkoxide }, { plus: true }, { smi: r.halide }] } });
        const neutralOpt = (r) => ({ scheme: { items: [{ smi: r.alc }, { plus: true }, { smi: r.halide }] } });
        const dehydr = { scheme: { items: [{ smi: good[0] }, { plus: true }, { smi: bad[0] }, { arrow: '→', above: f('H2SO4, 140 °C') }] } };
        const options = tie
          ? [pairOpt(rGood), pairOpt(rBad), neutralOpt(rGood), dehydr]
          : [pairOpt(rGood), pairOpt(rBad), neutralOpt(rGood), dehydr];
        const steps = [
          {
            prompt: tie ? t('Pažymėkite visas poras, kurios duoda šį eterį gerais išeigomis.', 'Pick every pair that gives this ether in good yield.') : t('Kuri pora duoda šį eterį gerai?', 'Which pair gives this ether well?'),
            kind: tie ? 'multi' : 'choice', options, answer: tie ? [0, 1] : 0,
            hint: t('Alkoksido jonas yra ir nukleofilas, ir bazė. Kuriame halogenalkane SN2 galima be konkurencinio eliminavimo?', 'The alkoxide ion is both a nucleophile and a base. In which haloalkane is SN2 possible without competing elimination?'),
            solution: [
              { p: tie ? t('Abu halogenalkanai metilo ar pirminiai, todėl SN2 vyksta abiem keliais.', 'Both haloalkanes are methyl or primary, so SN2 works both ways.')
                : t('Reikalingas metilo ar pirminis halogenalkanas, o šakotesnė eterio dalis imama kaip alkoksidas. Alkoksidas turi būti jonas (gaunamas su Na ar NaH), o ne neutralus alkoholis.', 'Use a methyl or primary haloalkane and take the more hindered part of the ether as the alkoxide. The alkoxide must be an ion (made with Na or NaH), not the neutral alcohol.') },
              { scheme: { items: [{ smi: rGood.alkoxide }, { plus: true }, { smi: rGood.halide }, { arrow: '→' }, { smi: ether }] } }
            ]
          }
        ];
        if (!tie) {
          const reasons = {
            tert: { lt: 'Tretinis halogenalkanas su alkoksidu eliminuojasi (E2): alkoksidas veikia kaip bazė ir atplėšia β-protoną, todėl susidaro alkenas.', en: 'A tertiary haloalkane eliminates with an alkoxide (E2): the alkoxide acts as a base and removes a β proton, giving an alkene.' },
            sec: { lt: 'Antrinis halogenalkanas su alkoksidu daugiausia eliminuojasi (E2): alkoksidas yra stipri bazė, todėl vietoj eterio susidaro alkenas.', en: 'A secondary haloalkane mostly eliminates with an alkoxide (E2): the alkoxide is a strong base, so an alkene forms instead of the ether.' },
            aryl: { lt: 'Arilhalogenidai SN2 nereaguoja: nukleofilas negali atakuoti sp2 anglies iš galinės pusės.', en: 'Aryl halides do not undergo SN2: the nucleophile cannot attack an sp2 carbon from behind.' }
          };
          const R = reasons[kind];
          const wrongs = [
            { lt: 'Metoksido ar etoksido jonas yra per mažas ir negali atakuoti anglies.', en: 'A methoxide or ethoxide ion is too small to attack a carbon.' },
            { lt: 'Halogenas yra blogesnė nueinančioji grupė pirminiame halogenalkane nei šakotame.', en: 'The halogen is a poorer leaving group on a primary haloalkane than on a branched one.' },
            { lt: 'Šioje poroje alkoksidas neturi laisvųjų elektronų porų.', en: 'In this pair the alkoxide has no lone pairs.' }
          ];
          steps.push({
            prompt: t('Kodėl antroji pora (alkoksidas su šakotesniu ar aromatiniu halogenidu) netinka?', 'Why does the other pair (alkoxide with the more branched or aromatic halide) not work?'),
            kind: 'choice', options: [{ text: t(R.lt, R.en) }].concat(wrongs.map(w => ({ text: t(w.lt, w.en) }))), answer: 0,
            hint: t('Alkoksidas nukleofilas, bet ir bazė. Pagalvokite, kokį halogenalkaną SN2 atakuoja lengvai.', 'The alkoxide is a nucleophile but also a base. Think about which haloalkane SN2 attacks easily.'),
            solution: t(R.lt, R.en)
          });
        }
        const ns = nameStep(ctx, ether, t('Pavadinkite eterį.', 'Name the ether.'), t('Eteris vadinamas kaip alkoksialkanas: mažesnė grupė tampa pakaitu „oksi“, didesnė – pagrindu.', 'Name the ether as an alkoxyalkane: the smaller group becomes the alkoxy substituent and the larger one the parent.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Nesimetrinį eterį reikia pagaminti Viljamsono sinteze.', 'An unsymmetrical ether is to be made by the Williamson synthesis.') }, { mol: { smi: ether } }],
          steps,
          why: t('Viljamsono sintezė yra SN2: alkoksido jonas atakuoja metilo ar pirminį halogenalkaną. Alkoksidas yra ir bazė, todėl su antriniu ar tretiniu halogenidu vyksta eliminavimas, o aril­halogenidai nereaguoja. Taigi šakotesnę eterio dalį imame kaip alkoksidą.',
            'The Williamson synthesis is an SN2: the alkoxide ion attacks a methyl or primary haloalkane. The alkoxide is also a base, so a secondary or tertiary halide eliminates and aryl halides do not react. Therefore the more hindered part of the ether is taken as the alkoxide.'),
          src: 'L11 p16, p17, p27'
        };
      }
    },
    /* ---- the same reagent on alcohols with a second group (S5.16) ---- */
    {
      id: 'u11.multi',
      title: t('Alkoholiai su kita funkcine grupe: kuri grupė reaguoja?', 'Alcohols with a second functional group: which group reacts?'),
      mirrors: ['S5.16'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const MOLS = ['C=CCCCO', 'C=CCC(C)O', 'CC(=C)CCO', 'CC(=C)CC(C)O', 'CC1=CCC(O)CC1', 'OC1CCC(=C)CC1', 'CC(C)=CCCO', 'CC(O)CCCC=C', 'C=CCCC(C)(C)O', 'C=CCC(C)(C)O', 'OCCC1=CCCCC1', 'OC1CCCC(=C)C1',
          'CC(C)=CCC(C)O', 'C=CCCCC(C)O', 'OCCCC=CC', 'CC(=C)CCCO', 'CC(O)C(C)CC=C', 'C=C(C)CCC(C)(C)O'];
        const REAGS = [
          { k: 'br2', lab: f('Br2'), run: (m) => firstMajor(react.run('ae.x2', [m], { X: 'Br' })), group: 'alkene', rule: 'ae.x2' },
          { k: 'h2o', lab: f('H2O, H+'), run: (m) => firstMajor(react.run('ae.h2o', [m], {})), group: 'alkene' },
          { k: 'h2', lab: f('H2, Pd'), run: (m) => firstMajor(react.run('ae.h2', [m], {})), group: 'alkene' },
          { k: 'pcc', lab: f('PCC, CH2Cl2'), run: (m) => { const r = react.run('alc.ox', [m], { reagent: 'PCC' }); return r.none ? null : firstMajor(r); }, group: 'alcohol' },
          { k: 'na', lab: f('1. Na  2. CH3I'), run: (m) => { const ox = firstMajor(react.run('alc.na', [m], { metal: 'Na' })); const r = ox && react.run('williamson', [ox, 'CI'], {}); return r && !r.none ? firstMajor(r) : null; }, group: 'alcohol' }
        ];
        let pick = null;
        for (let tries = 0; tries < 80 && !pick; tries++) {
          const m = ctx.pick(MOLS);
          const R = ctx.pick(REAGS);
          const outs = {};
          let ok = true;
          REAGS.forEach(r => { try { outs[r.k] = r.run(m); } catch (e) { outs[r.k] = undefined; } });
          const res = outs[R.k];
          if (res === undefined) continue;
          // one major product for the alkene reagents
          if (R.group === 'alkene') { const rr = react.run(R.k === 'br2' ? 'ae.x2' : R.k === 'h2o' ? 'ae.h2o' : 'ae.h2', [m], R.k === 'br2' ? { X: 'Br' } : {}); if (majorsOf(rr).length !== 1) continue; }
          REAGS.forEach(r => { if (outs[r.k] === undefined) ok = false; });
          if (!ok) continue;
          pick = { m, R, outs };
        }
        if (!pick) throw new Error('u11.multi: no usable molecule');
        const { m, R, outs } = pick;
        const s = site(chem, m);
        const prod = outs[R.k];
        const noRxn = tx('Reakcija nevyksta', 'No reaction');
        const sibling = REAGS.filter(r => r.k !== R.k).map(r => outs[r.k]).filter(x => x);
        const right = prod ? { mol: { smi: prod } } : noRxn;
        const options = optionList(ctx, right, ctx.shuffle(sibling.slice()).concat(prod ? [noRxn] : []), 4);
        const steps = [];
        const dbl = alkeneCarbons(chem, m);
        const q = [{ p: t('Molekulėje yra du funkcinių grupių tipai. Nekreipkite dėmesio į molekulės dydį: žiūrėkite į grupes.', 'The molecule contains two kinds of functional group. Ignore the size of the molecule and look at the groups.') }, { scheme: { items: [{ smi: m, opts: { numbers: 'all' } }, { arrow: '→', above: R.lab }] } }];
        if (prod) {
          const target = R.group === 'alkene' ? dbl : (R.k === 'na' ? [s.o] : [s.c]);
          steps.push({
            prompt: R.group === 'alkene' ? t('Bakstelėkite atomus, kurie reaguoja su šiuo reagentu.', 'Tap the atoms that react with this reagent.')
              : (R.k === 'na' ? t('Bakstelėkite atomą, kuris reaguoja su natriu.', 'Tap the atom that reacts with sodium.') : t('Bakstelėkite anglies atomą, kuris oksiduojamas.', 'Tap the carbon atom that is oxidised.')),
            kind: 'atoms', mol: { smi: m, opts: { numbers: 'all' } }, answer: target,
            hint: R.group === 'alkene' ? t('Kuri grupė turi $π$ ryšį, kurį gali atakuoti reagentas?', 'Which group has the $π$ bond that the reagent can attack?')
              : t('Kuri grupė turi $O-H$ ryšį ir vandenilius prie šalia esančios anglies?', 'Which group has the $O-H$ bond and hydrogens on the carbon next to it?'),
            solution: R.group === 'alkene' ? t('Reaguoja dvigubo ryšio atomai (Nr. ' + dbl.map(x => x + 1).join(' ir ') + '); alkoholio grupė šio reagento nepaveikia.', 'The double-bond carbons (no. ' + dbl.map(x => x + 1).join(' and ') + ') react; the alcohol group is not touched by this reagent.')
              : (R.k === 'na' ? t('Natris deprotonuoja OH grupę (deguonis Nr. ' + (s.o + 1) + '); dvigubas ryšys nereaguoja.', 'Sodium deprotonates the OH group (oxygen no. ' + (s.o + 1) + '); the double bond does not react.')
                : t('Oksiduojama anglis su OH ir vandeniliu (Nr. ' + (s.c + 1) + '); dvigubas ryšys su PCC nereaguoja.', 'The carbon with the OH and a hydrogen (no. ' + (s.c + 1) + ') is oxidised; the double bond does not react with PCC.'))
          });
        }
        steps.push({
          prompt: t('Koks yra produktas?', 'What is the product?'),
          kind: 'choice', options, answer: 0,
          hint: prod ? t('Pakeičiama tik ta grupė, kuri reaguoja su šiuo reagentu; kita lieka nepakitusi.', 'Only the group that reacts with this reagent changes; the other stays as it is.')
            : t('Patikrinkite, ar anglis su OH turi vandenilių, kuriuos oksidatorius galėtų atimti.', 'Check whether the carbon with the OH has hydrogens that the oxidant could remove.'),
          solution: prod ? [{ p: t('Reaguoja tik viena grupė; kita (' + (R.group === 'alkene' ? 'alkoholio OH' : 'dvigubas ryšys') + ') išlieka.', 'Only one group reacts; the other (' + (R.group === 'alkene' ? 'the alcohol OH' : 'the double bond') + ') survives.') }, { mol: { smi: prod } }]
            : t('Tretinis alkoholis neoksiduojasi, o su PCC dvigubas ryšys nereaguoja, todėl reakcijos nėra.', 'A tertiary alcohol is not oxidised and the double bond does not react with PCC, so there is no reaction.')
        });
        return {
          q, steps,
          why: t('Kiekvienas reagentas atpažįsta savo grupę: $Br2$, $H2O/H+$ ir $H2/Pd$ jungiasi prie dvigubo ryšio, o $PCC$ ir $Na$ veikia alkoholio grupę. Dėl molekulės dydžio nesijaudinkite: svarbios tik funkcinės grupės.',
            'Each reagent finds its own group: $Br2$, $H2O/H+$ and $H2/Pd$ add to the double bond, while $PCC$ and $Na$ act on the alcohol group. Do not worry about the size of the molecule: only the functional groups matter.'),
          src: 'L11 p26; S5.16'
        };
      }
    },
    /* ---- the four reagents of S5.12 on one alcohol ---- */
    {
      id: 'u11.react4',
      title: t('Vienas alkoholis, keli reagentai', 'One alcohol, several reagents'),
      mirrors: ['S5.12'],
      gen(rng, ctx) {
        const { chem, react } = ctx;
        const alc = ctx.pick(SEC.concat(TERT, TERT));
        if (react.wouldRearrange(alc)) return TYPES_GEN.find(x => x.id === 'u11.react4').gen(rng, ctx);
        const s = site(chem, alc);
        const R = {
          hbr: { lab: 'HBr', run: () => firstMajor(react.run('alc.hx', [alc], { X: 'Br' })), kind: s.k === 3 ? 'SN1' : 'SN1' },
          na: { lab: '1. Na  2. C2H5I', run: () => { const x = firstMajor(react.run('alc.na', [alc], { metal: 'Na' })); return firstMajor(react.run('williamson', [x, 'CCI'], {})); }, kind: 'SN2' },
          h2so4: { lab: 'H2SO4, H2O, Δ', run: () => { const r = react.run('elim', [alc], { base: 'heat-acid' }); return r.none ? null : firstMajor(r); }, kind: 'E1' },
          cr: { lab: 'Na2Cr2O7, H3O+', run: () => { const r = react.run('alc.ox', [alc], { reagent: 'chromic' }); return r.none ? null : firstMajor(r); }, kind: 'ox' },
          ester: { lab: 'CH3COOH, H+', run: () => firstMajor(react.run('acid.ester', ['CC(=O)O', alc], {})), kind: 'ester' }
        };
        const key = ctx.pick(s.k === 3 ? ['hbr', 'na', 'h2so4', 'cr'] : ['hbr', 'na', 'h2so4', 'cr', 'ester']);
        const prods = {};
        Object.keys(R).forEach(k => { prods[k] = R[k].run(); });
        const prod = prods[key];
        if (prod === undefined) throw new Error('u11.react4: undefined');
        const noRxn = tx('Reakcija nevyksta', 'No reaction');
        const sibling = Object.keys(R).filter(k => k !== key).map(k => prods[k]).filter(x => x);
        const right = prod ? { mol: { smi: prod } } : noRxn;
        const options = optionList(ctx, right, ctx.shuffle(sibling.slice()).concat(prod ? [noRxn] : []), 4);
        const types = {
          SN1: tx('Nukleofilinis pakeitimas (SN1)', 'Nucleophilic substitution (SN1)'),
          SN2: tx('Nukleofilinis pakeitimas (SN2), po alkoksido susidarymo', 'Nucleophilic substitution (SN2), after the alkoxide has formed'),
          E1: tx('Eliminavimas (E1)', 'Elimination (E1)'),
          ox: tx('Oksidacija', 'Oxidation'),
          ester: tx('Esterinimas (nukleofilinis acilpakeitimas)', 'Esterification (nucleophilic acyl substitution)')
        };
        const typeKey = R[key].kind;
        const steps = [{
          prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: 'choice', options, answer: 0,
          hint: t('Pirmiausia nustatykite, kokio tipo reakciją šis reagentas sukelia alkoholyje.', 'First decide which kind of reaction this reagent causes in an alcohol.'),
          solution: [{
            p: key === 'hbr' ? t('HBr pakeičia OH bromu (SN1 per karbokatijoną).', 'HBr replaces OH by bromine (SN1 through a carbocation).')
              : key === 'na' ? t('Natris sudaro alkoksidą, kuris su jodetanu reaguoja SN2 ir sudaro etilo eterį.', 'Sodium forms the alkoxide, which reacts with iodoethane by SN2 to give the ethyl ether.')
                : key === 'h2so4' ? t('Su koncentruota rūgštimi kaitinant vyksta dehidratacija; vyrauja daugiausia pakeistas alkenas.', 'Heating with concentrated acid dehydrates the alcohol; the most substituted alkene predominates.')
                  : key === 'cr' ? (prod ? t('Chromo rūgštis antrinį alkoholį oksiduoja iki ketono.', 'Chromic acid oxidises a secondary alcohol to a ketone.') : t('Tretinis alkoholis neturi vandenilio prie anglies su OH ir neoksiduojasi.', 'A tertiary alcohol has no hydrogen on the carbon with the OH and is not oxidised.'))
                    : t('Rūgštinėje terpėje alkoholis ir karboksirūgštis sudaro esterį ir vandenį.', 'In acid an alcohol and a carboxylic acid give an ester and water.')
          }].concat(prod ? [{ mol: { smi: prod } }] : [])
        }, {
          prompt: t('Kuri apibūdinimas geriausiai tinka šiai reakcijai?', 'Which description fits this reaction best?'),
          kind: 'choice',
          options: optionList(ctx, types[typeKey], [types.SN1, types.E1, types.ox, types.SN2, types.ester].filter(x => x !== types[typeKey]), 4),
          answer: 0,
          hint: t('Pagalvokite, kas atsitinka su alkoholio grupe ir su anglies skeletu.', 'Think about what happens to the alcohol group and to the carbon skeleton.'),
          solution: types[typeKey].text
        }];
        if (key === 'hbr' || key === 'h2so4') {
          if (key === 'h2so4') steps[1].options = optionList(ctx, types.E1, [types.SN1, types.ox, types.SN2], 4);
        }
        return {
          q: [{ p: t('Alkoholis reaguoja su reagentu.', 'The alcohol reacts with a reagent.') }, { scheme: { items: [{ smi: alc }, { arrow: '→', above: f(R[key].lab) }] } }],
          steps,
          why: t('Tas pats alkoholis su skirtingais reagentais virsta skirtingais junginiais: halogenalkanu ($HBr$), eteriu (alkoksidas ir halogenalkanas), alkenu (rūgštis kaitinant), ketonu (oksidatorius) arba esteriu. Kiekvienu atveju prisimenate, kuri alkoholio vieta reaguoja: O–H, C–O ar C–H.',
            'The same alcohol gives different compounds with different reagents: a haloalkane ($HBr$), an ether (alkoxide and haloalkane), an alkene (acid and heat), a ketone (oxidant) or an ester. In each case ask which part of the alcohol reacts: O–H, C–O or C–H.'),
          src: 'L11 p26; S5.12'
        };
      }
    },
    /* ---- the map of ethanol reactions (matching) ---- */
    {
      id: 'u11.map',
      title: t('Alkoholio reakcijų žemėlapis: reagentas ir produktas', 'The map of alcohol reactions: reagent and product'),
      mirrors: [],
      gen(rng, ctx) {
        const { react } = ctx;
        const PRIMS = ['CCO', 'CCCO', 'CCCCO', 'CC(C)CO', 'CCCCCO', 'CC(C)CCO', 'CCC(C)CO'];
        const alc = ctx.pick(PRIMS);
        const alkoxide = firstMajor(react.run('alc.na', [alc], { metal: 'Na' }));
        const iodide = firstMajor(react.run('alc.hx', [alc], { X: 'I' }));
        const ether = firstMajor(react.run('williamson', [alkoxide, iodide], {}));
        const methylEther = firstMajor(react.run('williamson', [alkoxide, 'CI'], {}));
        const alkene = firstMajor(react.run('elim', [alc], { base: 'heat-acid' }));
        const ald = firstMajor(react.run('alc.ox', [alc], { reagent: 'PCC' }));
        const acid = firstMajor(react.run('alc.ox', [alc], { reagent: 'chromic' }));
        const ester = firstMajor(react.run('acid.ester', ['CC(=O)O', alc], {}));
        const ALL = [
          { lab: f('Na'), smi: alkoxide },
          { lab: f('HI, Δ'), smi: iodide },
          { lab: f('H2SO4, 140 °C'), smi: ether },
          { lab: f('H2SO4, 180 °C'), smi: alkene },
          { lab: f('PCC, CH2Cl2'), smi: ald },
          { lab: f('Na2Cr2O7, H3O+'), smi: acid },
          { lab: f('CH3COOH, H+'), smi: ester },
          { lab: f('1. Na  2. CH3I'), smi: methylEther }
        ];
        const chosen = ctx.shuffle(ALL.slice()).slice(0, 4);
        const keys = chosen.map(c => canon(ctx, c.smi));
        if (new Set(keys).size !== chosen.length) throw new Error('u11.map: equal products');
        return {
          q: [{ p: t('Pirminis alkoholis reaguoja su skirtingais reagentais.', 'A primary alcohol reacts with several different reagents.') }, { mol: { smi: alc } }],
          steps: [{
            prompt: t('Suporuokite kiekvieną reagentą su produktu, kuris iš alkoholio susidaro.', 'Pair each reagent with the product it makes from the alcohol.'),
            kind: 'match',
            answer: { left: chosen.map(c => ({ text: c.lab })), right: chosen.map(c => ({ mol: { smi: c.smi } })), pairs: chosen.map((_, i) => i) },
            hint: t('Kiekvienam reagentui pasakykite, kuri alkoholio dalis reaguoja: O–H, C–O ar C–H.', 'For each reagent say which part of the alcohol reacts: O–H, C–O or C–H.'),
            solution: t('Na deprotonuoja O–H (alkoksidas); HI pakeičia OH jodu; rūgštis žemesnėje temperatūroje sudaro eterį, aukštesnėje – alkeną; PCC duoda aldehidą; chromo rūgštis – karboksirūgštį; su rūgštimi ir H+ susidaro esteris; Na ir CH3I duoda metilo eterį.',
              'Na deprotonates O–H (alkoxide); HI replaces OH by iodine; acid gives an ether at the lower temperature and an alkene at the higher; PCC gives the aldehyde; chromic acid the carboxylic acid; an acid with H+ makes an ester; Na and CH3I give the methyl ether.')
          }],
          why: t('Bet kuris pirminis alkoholis elgiasi pagal tą patį žemėlapį. Pažiūrėkite į reagentą ir nuspręskite: ar jis atplėšia protoną (Na), pakeičia OH (HX), atskelia vandenį (rūgštis, kaitinant), ar atima vandenilius (oksidatorius).',
            'Any primary alcohol follows the same map. Look at the reagent and decide whether it removes a proton (Na), replaces the OH (HX), removes water (acid, heat) or removes hydrogens (oxidant).'),
          src: 'L11 p26'
        };
      }
    }
  ];

  /* ================= banks ================= */
  // a choice step whose right option comes first: opts = [[lt, en], ...]
  const ch = (pLt, pEn, opts, hLt, hEn, sLt, sEn) => ({
    prompt: t(pLt, pEn), kind: 'choice', options: opts.map(o => tx(o[0], o[1])), answer: 0, hint: t(hLt, hEn), solution: t(sLt, sEn)
  });
  const chMol = (pLt, pEn, smis, hLt, hEn, sLt, sEn) => ({
    prompt: t(pLt, pEn), kind: 'choice', options: smis.map(s => ({ mol: { smi: s } })), answer: 0, hint: t(hLt, hEn), solution: t(sLt, sEn)
  });

  const HB = [
    {
      id: 'u11.hb.1',
      q: [{ p: t('Trys junginiai turi panašų dydį, bet labai skirtingas virimo temperatūras: −89 °C, 12 °C ir 78 °C.', 'Three compounds are of similar size but have very different boiling points: −89 °C, 12 °C and 78 °C.') },
        { mol: [{ smi: 'CC', name: t('etanas', 'ethane') }, { smi: 'CCCl', name: t('chloretanas', 'chloroethane') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }] }],
      steps: [
        {
          prompt: t('Išdėstykite junginius nuo aukščiausios iki žemiausios virimo temperatūros.', 'Order the compounds from the highest to the lowest boiling point.'),
          kind: 'order', options: [tx('etanolis', 'ethanol'), tx('chloretanas', 'chloroethane'), tx('etanas', 'ethane')],
          hint: t('Pagalvokite, kokios jėgos laiko molekules skystyje: nepoliniai ryšiai, polinis ryšys ar vandeniliniai ryšiai.', 'Think about what holds the molecules together in the liquid: non-polar bonds, a polar bond, or hydrogen bonds.'),
          solution: t('Etanolis (78 °C) > chloretanas (12 °C) > etanas (−89 °C).', 'Ethanol (78 °C) > chloroethane (12 °C) > ethane (−89 °C).')
        },
        ch('Kodėl etanolis verda daug aukštesnėje temperatūroje už chloretaną, nors chloretano molekulė sunkesnė?', 'Why does ethanol boil far higher than chloroethane, although the chloroethane molecule is heavier?',
          [['Etanolio molekulės tarpusavyje sudaro vandenilinius ryšius $O-H···O$.', 'Ethanol molecules form hydrogen bonds $O-H···O$ with each other.'],
            ['Etanolio molekulė turi didesnę molekulinę masę.', 'The ethanol molecule has the greater molar mass.'],
            ['Etanolyje yra daugiau kovalentinių ryšių, kuriuos reikia nutraukti virinant.', 'Ethanol has more covalent bonds that must be broken on boiling.'],
            ['Chloras sudaro stipresnį ryšį su anglimi nei deguonis.', 'Chlorine forms a stronger bond to carbon than oxygen does.']],
          'Virimas nutraukia ne kovalentinius ryšius, o tarpmolekulines sąveikas. Kuris junginys gali būti ir vandenilio donoras, ir akceptorius?', 'Boiling does not break covalent bonds but intermolecular attractions. Which compound can be both a hydrogen donor and an acceptor?',
          'Virimo temperatūrą lemia tarpmolekulinės jėgos. $O-H$ ryšys taip poliarizuotas, kad vandenilis ($δ+$) traukiamas gretimos molekulės deguonies ($δ−$): susidaro vandeniliniai ryšiai. Chloretano $C-Cl$ ryšys sudaro tik silpnesnę dipolių sąveiką.',
          'Boiling is set by intermolecular forces. The $O-H$ bond is so polar that the hydrogen ($δ+$) is attracted to the oxygen ($δ−$) of a neighbouring molecule: hydrogen bonds. The $C-Cl$ bond of chloroethane gives only a weaker dipole attraction.')
      ],
      why: t('Alkoholių virimo temperatūra neįprastai aukšta, nes jų molekulės sudaro vandenilinius ryšius. Be $O-H$ grupės junginys, kurio molekulė panašaus dydžio, verda daug žemesnėje temperatūroje.', 'Alcohols boil unusually high because their molecules form hydrogen bonds. Without an $O-H$ group, a compound with a molecule of similar size boils far lower.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.2',
      q: [{ p: t('Šie du junginiai yra izomerai ir turi vienodą formulę $C3H8O$.', 'These two compounds are isomers with the same formula $C3H8O$.') },
        { mol: [{ smi: 'CCCO', name: t('1-propanolis', '1-propanol') }, { smi: 'CCOC', name: t('metoksietanas', 'methoxyethane') }] }],
      steps: [
        chMol('Kuris junginys verda aukštesnėje temperatūroje?', 'Which compound boils at the higher temperature?', ['CCCO', 'CCOC'],
          'Ar abi molekulės turi $O-H$ grupę?', 'Do both molecules have an $O-H$ group?',
          '1-propanolis verda 97 °C, o metoksietanas tik 7 °C: alkoholio molekulės sudaro vandenilinius ryšius.', '1-Propanol boils at 97 °C and methoxyethane only at 7 °C: alcohol molecules form hydrogen bonds.'),
        ch('Kodėl eteris vandenilinių ryšių tarpusavyje nesudaro?', 'Why can the ether not form hydrogen bonds with itself?',
          [['Eterio deguonis neturi prie jo prijungto vandenilio, todėl nėra vandenilio donoro.', 'The oxygen of the ether carries no hydrogen, so there is no hydrogen donor.'],
            ['Eterio deguonis neturi laisvųjų elektronų porų.', 'The oxygen of the ether has no lone pairs.'],
            ['Eterio $C-O$ ryšys yra nepolinis.', 'The $C-O$ bond of the ether is non-polar.'],
            ['Eteris yra per sunkus.', 'The ether is too heavy.']],
          'Vandeninis ryšys reikalauja dviejų dalių: vandenilio donoro ir akceptoriaus.', 'A hydrogen bond needs two partners: a hydrogen donor and an acceptor.',
          'Eterio deguonis turi laisvąsias poras (akceptorius), bet nėra $O-H$ grupės (donoro), todėl tarp eterio molekulių vandenilinių ryšių nėra.',
          'The ether oxygen has lone pairs (an acceptor) but no $O-H$ group (a donor), so there are no hydrogen bonds between ether molecules.')
      ],
      why: t('Izomerai gali skirtis virimo temperatūra dešimtimis laipsnių: skiria ne masė, o galimybė sudaryti vandenilinius ryšius.', 'Isomers can differ in boiling point by tens of degrees: it is not the mass but the ability to form hydrogen bonds that decides.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.3',
      q: [{ p: t('Trys izomeriniai butanoliai verda 118 °C, 99 °C ir 83 °C temperatūroje.', 'The three isomeric butanols boil at 118 °C, 99 °C and 83 °C.') },
        { mol: [{ smi: 'CCCCO', name: t('1-butanolis', '1-butanol') }, { smi: 'CCC(C)O', name: t('2-butanolis', '2-butanol') }, { smi: 'CC(C)(C)O', name: t('2-metil-2-propanolis', '2-methyl-2-propanol') }] }],
      steps: [
        {
          prompt: t('Išdėstykite juos nuo aukščiausios iki žemiausios virimo temperatūros.', 'Order them from the highest to the lowest boiling point.'),
          kind: 'order', options: [tx('1-butanolis', '1-butanol'), tx('2-butanolis', '2-butanol'), tx('2-metil-2-propanolis', '2-methyl-2-propanol')],
          hint: t('Šakotos molekulės yra labiau panašios į rutulį. Kaip tai veikia jų sąlytį su kaimynėmis?', 'Branched molecules are closer to a sphere. How does that affect their contact with neighbours?'),
          solution: t('1-butanolis (118 °C) > 2-butanolis (99 °C) > 2-metil-2-propanolis (83 °C).', '1-Butanol (118 °C) > 2-butanol (99 °C) > 2-methyl-2-propanol (83 °C).')
        },
        ch('Kodėl šakotas izomeras verda žemesnėje temperatūroje, nors turi tokią pat $O-H$ grupę?', 'Why does the branched isomer boil lower, although it has the same $O-H$ group?',
          [['Šakota molekulė labiau suapvalėjusi, todėl liečiasi su kaimynėmis mažesniu paviršiumi, o $OH$ grupė labiau užstota.', 'The branched molecule is more compact, so it touches its neighbours over a smaller surface, and the $OH$ group is more shielded.'],
            ['Šakotame alkoholyje nėra vandenilinių ryšių.', 'There are no hydrogen bonds in the branched alcohol.'],
            ['Šakotas alkoholis turi mažiau anglies atomų.', 'The branched alcohol has fewer carbon atoms.'],
            ['Šakotame alkoholyje $O-H$ ryšys yra nepolinis.', 'In the branched alcohol the $O-H$ bond is non-polar.']],
          'Palyginkite, kiek molekulės paviršiaus gali liestis su kaimynėmis ir kiek sunku „prieiti“ prie $OH$.', 'Compare how much of the molecule can touch its neighbours and how easily the $OH$ can be reached.',
          'Visi trys sudaro vandenilinius ryšius ir turi vienodą masę. Šakotos molekulės kompaktiškesnės, ir jų $OH$ užstotas alkilgrupių, todėl tarpmolekulinė sąveika silpnesnė.',
          'All three form hydrogen bonds and have the same mass. The branched molecules are more compact and their $OH$ is shielded by alkyl groups, so the intermolecular attraction is weaker.')
      ],
      why: t('Be vandenilinių ryšių, virimo temperatūrai įtakos turi ir molekulės forma: šakotos molekulės verda žemiau už nešakotas.', 'Besides hydrogen bonding, the shape of the molecule matters: branched molecules boil lower than unbranched ones.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.4',
      q: [{ p: t('Metanolis maišosi su vandeniu bet kokiomis proporcijomis, o 1-oktanolis vandenyje beveik netirpsta.', 'Methanol mixes with water in all proportions, whereas 1-octanol is almost insoluble in water.') },
        { mol: [{ smi: 'CO', name: t('metanolis', 'methanol') }, { smi: 'CCCCCCCCO', name: t('1-oktanolis', '1-octanol') }] }],
      steps: [
        {
          prompt: t('Bakstelėkite 1-oktanolio atomą, kuris sudaro hidrofilinę dalį.', 'Tap the atom of 1-octanol that forms the hydrophilic part.'),
          kind: 'atoms', mol: { smi: 'CCCCCCCCO', opts: { numbers: 'all' } }, answer: [8],
          hint: t('Kuris atomas sudaro vandenilinius ryšius su vandeniu?', 'Which atom forms hydrogen bonds with water?'),
          solution: t('Deguonis (Nr. 9) su vandeniliu sudaro hidrofilinę dalį; aštuonių anglies atomų grandinė yra hidrofobinė.', 'The oxygen (no. 9) with its hydrogen forms the hydrophilic part; the chain of eight carbons is hydrophobic.')
        },
        ch('Kodėl ilgėjant anglies grandinei alkoholio tirpumas vandenyje mažėja?', 'Why does the solubility of an alcohol in water fall as the carbon chain gets longer?',
          [['Didėja nepolinės, hidrofobinės dalies dydis, o hidrofilinė $OH$ grupė lieka viena.', 'The non-polar, hydrophobic part grows while there is still only one hydrophilic $OH$ group.'],
            ['Ilgesnėje molekulėje $O-H$ ryšys nustoja būti polinis.', 'In a longer molecule the $O-H$ bond stops being polar.'],
            ['Ilgesni alkoholiai yra rūgštesni ir reaguoja su vandeniu.', 'Longer alcohols are more acidic and react with water.'],
            ['Anglies grandinė sudaro vandenilinius ryšius tarpusavyje stipriau nei $OH$.', 'The carbon chain forms hydrogen bonds with itself more strongly than the $OH$ does.']],
          'Palyginkite hidrofilinės ir hidrofobinės molekulės dalių santykį.', 'Compare the share of the hydrophilic and the hydrophobic parts of the molecule.',
          'Vienas $OH$ vandenyje „išlaiko“ nedidelę nepolinę dalį (metanolis, etanolis, propanolis maišosi visiškai), bet ne oktilo grandinę.',
          'One $OH$ can carry a small non-polar part into water (methanol, ethanol and propanol mix completely) but not an octyl chain.')
      ],
      why: t('Alkoholio molekulė turi hidrofilinę ($OH$) ir hidrofobinę (alkilo) dalis. Kuo ilgesnė alkilo grandinė, tuo labiau vyrauja hidrofobiškumas ir tuo blogiau alkoholis tirpsta vandenyje.', 'An alcohol molecule has a hydrophilic ($OH$) and a hydrophobic (alkyl) part. The longer the alkyl chain, the more the hydrophobic part dominates and the worse the alcohol dissolves in water.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.5',
      q: [{ p: t('Nustatykite, kurių skystų junginių molekulės tarpusavyje gali sudaryti vandenilinius ryšius.', 'Decide which liquid compounds can form hydrogen bonds between their own molecules.') }],
      steps: [{
        prompt: t('Pažymėkite visus tokius junginius.', 'Pick every such compound.'),
        kind: 'multi', options: [{ mol: { smi: 'CCCO' } }, { mol: { smi: 'CC(=O)O' } }, { mol: { smi: 'CCOCC' } }, { mol: { smi: 'CCCCC' } }, { mol: { smi: 'CCCl' } }],
        answer: [0, 1],
        hint: t('Vandenilinis ryšys susidaro tarp $O-H$ (ar $N-H$) grupės ir kitos molekulės deguonies.', 'A hydrogen bond forms between an $O-H$ (or $N-H$) group and an oxygen of another molecule.'),
        solution: t('Alkoholis ir karboksirūgštis turi $O-H$ grupę (donoras) ir deguonį (akceptorius). Eteris turi tik akceptorių, o alkanas ir haloalkanas vandenilio donoro neturi.', 'An alcohol and a carboxylic acid have an $O-H$ group (donor) and oxygen (acceptor). The ether has only an acceptor, and the alkane and haloalkane have no hydrogen donor.')
      }],
      why: t('Vandenilinį ryšį sudaro vandenilis, prijungtas prie labai elektroneigiamo atomo ($O$, $N$, $F$), ir kito elektroneigiamo atomo laisvoji pora. Todėl alkoholiai ir rūgštys turi neįprastai aukštas virimo temperatūras.', 'A hydrogen bond forms between a hydrogen on a very electronegative atom ($O$, $N$, $F$) and a lone pair of another electronegative atom. That is why alcohols and acids have unusually high boiling points.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.6',
      q: [{ p: t('Etanolis verda 78 °C, o etano-1,2-diolis (etilenglikolis) – 197 °C.', 'Ethanol boils at 78 °C and ethane-1,2-diol (ethylene glycol) at 197 °C.') },
        { mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }] }],
      steps: [
        ch('Kuo paaiškinamas toks didelis skirtumas?', 'What explains such a large difference?',
          [['Diolio molekulė gali sudaryti dvigubai daugiau vandenilinių ryšių, nes turi dvi $OH$ grupes.', 'The diol molecule can form twice as many hydrogen bonds because it has two $OH$ groups.'],
            ['Diolis turi daugiau anglies atomų.', 'The diol has more carbon atoms.'],
            ['Diolio $C-C$ ryšys yra stipresnis.', 'The $C-C$ bond of the diol is stronger.'],
            ['Etanolis nesudaro vandenilinių ryšių.', 'Ethanol does not form hydrogen bonds.']],
          'Palyginkite hidroksigrupių skaičių abiejose molekulėse (abu turi po 2 C).', 'Compare the number of hydroxyl groups in the two molecules (both have two carbons).',
          'Abiejų junginių angliavandenilių dalis vienoda (du C), bet diolis turi dvi $OH$ grupes ir sudaro daugiau vandenilinių ryšių tarp molekulių.', 'Both have the same carbon part (two C), but the diol has two $OH$ groups and forms more hydrogen bonds between molecules.'),
        ch('Kaip tikėtis, kad pasikeis tirpumas vandenyje?', 'What should one expect for the solubility in water?',
          [['Diolis maišosi su vandeniu bent taip pat gerai kaip etanolis.', 'The diol mixes with water at least as well as ethanol.'],
            ['Diolis vandenyje tirpsta daug blogiau už etanolį.', 'The diol dissolves much worse in water than ethanol.'],
            ['Diolis su vandeniu reaguoja ir išskiria vandenilį.', 'The diol reacts with water and releases hydrogen.'],
            ['Diolis vandenyje netirpsta, nes yra pernelyg poliarus.', 'The diol is insoluble in water because it is too polar.']],
          'Daugiau $OH$ grupių – daugiau vietų vandeniliniams ryšiams su vandeniu.', 'More $OH$ groups mean more places for hydrogen bonds with water.',
          'Dvi hidrofilinės grupės dar labiau didina tirpumą vandenyje, todėl glikoliai maišosi su vandeniu.', 'Two hydrophilic groups raise the solubility even more, so glycols mix with water.')
      ],
      why: t('Kiekviena papildoma $OH$ grupė didina vandeninių ryšių skaičių: pakyla virimo temperatūra ir tirpumas vandenyje.', 'Each extra $OH$ group increases the number of hydrogen bonds: the boiling point and the solubility in water both rise.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.7',
      q: [{ p: t('Trys junginiai turi beveik vienodą molekulinę masę (44–46): propanas, dimetileteris ir etanolis.', 'Three compounds have almost the same molar mass (44–46): propane, dimethyl ether and ethanol.') },
        { mol: [{ smi: 'CCC', name: t('propanas', 'propane') }, { smi: 'COC', name: t('dimetileteris', 'dimethyl ether') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }] }],
      steps: [
        {
          prompt: t('Išdėstykite juos pagal virimo temperatūrą nuo aukščiausios iki žemiausios.', 'Order them by boiling point, highest first.'),
          kind: 'order', options: [tx('etanolis (78 °C)', 'ethanol (78 °C)'), tx('dimetileteris (−24 °C)', 'dimethyl ether (−24 °C)'), tx('propanas (−42 °C)', 'propane (−42 °C)')],
          hint: t('Palyginkite jėgas: vandeniliniai ryšiai, polinis ryšys, tik dispersinė sąveika.', 'Compare the forces: hydrogen bonds, a polar bond, dispersion only.'),
          solution: t('Etanolis (vandeniliniai ryšiai) > dimetileteris (polinis $C-O-C$) > propanas (tik dispersinė sąveika).', 'Ethanol (hydrogen bonds) > dimethyl ether (polar $C-O-C$) > propane (dispersion only).')
        },
        ch('Kuri savybė labiausiai pakelia virimo temperatūrą palyginti su panašios masės nepoliniu junginiu?', 'Which feature raises the boiling point most compared with a non-polar compound of similar mass?',
          [['Vandeniliniai ryšiai tarp molekulių.', 'Hydrogen bonds between molecules.'], ['Didesnis atomų skaičius.', 'A larger number of atoms.'], ['Didesnis anglies atomų skaičius.', 'A larger number of carbon atoms.'], ['Mažesnis vandenilių skaičius.', 'A smaller number of hydrogens.']],
          'Masė čia beveik vienoda, tad ieškokite kitos priežasties.', 'The mass is almost the same here, so look for another reason.',
          'Vandeniliniai ryšiai yra stipresni už dipolių sąveiką, o šie – už dispersines jėgas, todėl eilė ir tokia.', 'Hydrogen bonds are stronger than dipole attractions, and those are stronger than dispersion forces, which gives this order.')
      ],
      why: t('Molekulinė masė ne vienintelis dalykas: virimo temperatūrą lemia tarpmolekulinių jėgų tipas.', 'Molar mass is not the only thing: the kind of intermolecular force decides the boiling point.'),
      src: 'L11 p4'
    },
    {
      id: 'u11.hb.8',
      q: [{ p: t('Etanolis su vandeniu maišosi bet kokiomis proporcijomis, o heksanas – ne.', 'Ethanol mixes with water in all proportions, hexane does not.') },
        { mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'CCCCCC', name: t('heksanas', 'hexane') }] }],
      steps: [
        ch('Kuris paaiškinimas teisingas?', 'Which explanation is correct?',
          [['Etanolio $OH$ sudaro vandenilinius ryšius su vandeniu (kaip donoras ir kaip akceptorius), o heksanas to negali.', 'The $OH$ of ethanol forms hydrogen bonds with water (as donor and as acceptor); hexane cannot.'],
            ['Heksanas yra poliarus, o vanduo – ne.', 'Hexane is polar and water is not.'],
            ['Etanolis su vandeniu reaguoja ir sudaro naują junginį.', 'Ethanol reacts with water to give a new compound.'],
            ['Etanolio molekulė mažesnė už vandens molekulę.', 'An ethanol molecule is smaller than a water molecule.']],
          'Kuri medžiaga gali sudaryti vandenilinius ryšius su vandeniu?', 'Which substance can form hydrogen bonds with water?',
          'Panašus ištirpsta panašiame: poliarinis ir vandeniliniais ryšiais susijungiantis alkoholis tirpsta poliniame vandenyje, o nepolinis angliavandenilis – ne.', 'Like dissolves like: an alcohol that is polar and hydrogen-bonding dissolves in polar water, while a non-polar hydrocarbon does not.'),
        ch('Kas atsitiks, jei prie etanolio pridėsime 100 mL vandens ir 100 mL heksano?', 'What will happen if 100 mL of water and 100 mL of hexane are shaken with some ethanol?',
          [['Didžioji dalis etanolio pateks į vandens fazę, o heksanas liks atskiru sluoksniu.', 'Most of the ethanol goes into the water layer and the hexane stays as a separate layer.'], ['Visos medžiagos susimaišys į vieną fazę.', 'Everything mixes into one phase.'], ['Etanolis visiškai pereis į heksaną.', 'The ethanol goes entirely into the hexane.'], ['Heksanas ištirps vandenyje.', 'The hexane dissolves in the water.']],
          'Kur etanolis jaučiasi geriau: vandenyje ar heksane?', 'Where is ethanol more comfortable: in water or in hexane?',
          'Etanolis daug geriau tirpsta vandenyje, o heksanas su vandeniu nesimaišo, todėl lieka du sluoksniai.', 'Ethanol dissolves much better in water, and hexane does not mix with water, so two layers remain.')
      ],
      why: t('Vandeniliniai ryšiai su vandeniu ir hidrofobinė dalis lemia, ar alkoholis tirpsta vandenyje: trumpi alkoholiai maišosi, ilgi – ne.', 'Hydrogen bonds with water and the hydrophobic part decide whether an alcohol dissolves in water: short alcohols mix, long ones do not.'),
      src: 'L11 p4'
    }
  ];

  const ACID = [
    {
      id: 'u11.acidwhy.1',
      q: [{ p: t('Palyginkite rūgštingumą šių junginių: etano rūgšties ($pKa$ 4,75), fenolio (≈10), vandens (15,7), etanolio (≈16) ir 2-metil-2-propanolio (≈18).', 'Compare the acidity of ethanoic acid ($pKa$ 4.75), phenol (≈10), water (15.7), ethanol (≈16) and 2-methyl-2-propanol (≈18).') }],
      steps: [
        {
          prompt: t('Išdėstykite nuo stipriausios iki silpniausios rūgšties.', 'Order from the strongest to the weakest acid.'),
          kind: 'order', options: [tx('etano rūgštis', 'ethanoic acid'), tx('fenolis', 'phenol'), tx('vanduo', 'water'), tx('etanolis', 'ethanol'), tx('2-metil-2-propanolis', '2-methyl-2-propanol')],
          hint: t('Mažesnis $pKa$ reiškia stipresnę rūgštį.', 'A smaller $pKa$ means a stronger acid.'),
          solution: t('Etano rūgštis (4,75) > fenolis (10) > vanduo (15,7) > etanolis (16) > 2-metil-2-propanolis (18).', 'Ethanoic acid (4.75) > phenol (10) > water (15.7) > ethanol (16) > 2-methyl-2-propanol (18).')
        },
        ch('Ką rodo, kad alkoholių $pKa$ (15–18) yra artimas vandens $pKa$?', 'What does it tell us that the $pKa$ of alcohols (15–18) is close to that of water?',
          [['Alkoholiai yra labai silpnos rūgštys, panašios į vandenį, todėl su šarmais praktiškai nereaguoja.', 'Alcohols are very weak acids, similar to water, so they hardly react with alkalis.'],
            ['Alkoholiai yra stiprios rūgštys, nes reaguoja su natriu.', 'Alcohols are strong acids because they react with sodium.'],
            ['Alkoholiai yra stipresnės rūgštys už fenolį.', 'Alcohols are stronger acids than phenol.'],
            ['Alkoholiai yra neutralūs ir protonų neatiduoda.', 'Alcohols are neutral and do not give up protons.']],
          'Palyginkite alkoholio ir $OH-$ konjuguotosios rūgšties (vandens) stiprumą.', 'Compare the alcohol with the conjugate acid of $OH-$ (water).',
          'Su natriu alkoholis reaguoja, nes natris yra labai stipri bazė (elektronų donoras), bet alkoholio rūgštingumas toks silpnas, kad $OH-$ jo nepakankamai deprotonuoja.', 'An alcohol reacts with sodium because sodium is a very strong reductant, but its acidity is so weak that $OH-$ cannot deprotonate it appreciably.')
      ],
      why: t('Alkoholiai yra silpnos rūgštys ($pKa$ 15–18), nusileidžia vandeniui, fenoliams ir karboksirūgštims. Todėl alkoksidui gauti reikia stipresnės bazės už $OH-$.', 'Alcohols are weak acids ($pKa$ 15–18), weaker than water, phenols and carboxylic acids. So an alkoxide needs a stronger base than $OH-$.'),
      src: 'L11 p6'
    },
    {
      id: 'u11.acidwhy.2',
      q: [{ p: t('Etanolis turi virsti natrio etoksidu.', 'Ethanol has to be converted into sodium ethoxide.') }, { scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: f('?') }, { smi: 'CC[O-].[Na+]' }] } }],
      steps: [{
        prompt: t('Pažymėkite visus reagentus, kurie etanolį paverstų etoksidu.', 'Pick every reagent that would convert ethanol into the ethoxide.'),
        kind: 'multi', options: [tx('$Na$', '$Na$'), tx('$NaH$', '$NaH$'), tx('$K$', '$K$'), tx('$NaOH$ vandenyje', '$NaOH$ in water'), tx('$NaHCO3$', '$NaHCO3$')],
        answer: [0, 1, 2],
        hint: t('Reikia stipresnės bazės arba reduktoriaus, kuris atplėštų protoną nuo labai silpnos rūgšties.', 'You need a stronger base or reductant that can take the proton from a very weak acid.'),
        solution: t('Natris ir kalis atiduoda elektroną protonui (išsiskiria $H2$), o $NaH$ yra stipri bazė ($H-$). $NaOH$ ir $NaHCO3$ per silpnos bazės.', 'Sodium and potassium give an electron to the proton ($H2$ is evolved), and $NaH$ is a strong base ($H-$). $NaOH$ and $NaHCO3$ are too weak.')
      }],
      why: t('Alkoksidą galima gauti tik veikiant šarminiu metalu arba itin stipria baze, pavyzdžiui, $NaH$.', 'Alkoxides are made with alkali or alkaline-earth metals or with very strong bases such as $NaH$.'),
      src: 'L11 p6'
    },
    {
      id: 'u11.acidwhy.3',
      q: [{ p: t('Į etanolį įmetamas natrio gabalėlis, ir vėliau mišinys atsargiai skiedžiamas vandeniu. Į tirpalą įlašinama fenolftaleino.', 'A piece of sodium is dropped into ethanol and the mixture is later diluted carefully with water. Phenolphthalein is added to the solution.') }],
      steps: [
        ch('Kas susidaro, kai natrio etoksidas patenka į vandenį?', 'What forms when sodium ethoxide meets water?',
          [['Etanolis ir natrio hidroksidas.', 'Ethanol and sodium hydroxide.'], ['Eteris ir natrio hidroksidas.', 'An ether and sodium hydroxide.'], ['Etanolis ir natrio vandenilis.', 'Ethanol and sodium hydride.'], ['Natrio acetatas ir vandenilis.', 'Sodium acetate and hydrogen.']],
          'Alkoksidas yra stipresnė bazė už $OH-$. Ką jis atima iš vandens?', 'An alkoxide is a stronger base than $OH-$. What does it take from water?',
          'Etoksido jonas atplėšia protoną nuo vandens ir virsta etanoliu, o vandens deguonis lieka kaip $OH-$ (hidrolizė): $C2H5ONa + H2O → C2H5OH + NaOH$.', 'The ethoxide ion takes a proton from water and becomes ethanol, while the oxygen of the water remains as $OH-$ (hydrolysis): $C2H5ONa + H2O → C2H5OH + NaOH$.'),
        ch('Kokia spalva atsiranda ir kodėl?', 'What colour appears, and why?',
          [['Raudonai violetinė, nes tirpalas šarminis (susidarė $NaOH$).', 'Crimson, because the solution is alkaline ($NaOH$ has formed).'], ['Bespalvė, nes tirpalas neutralus.', 'None, because the solution is neutral.'], ['Geltona, nes susidarė aldehidas.', 'Yellow, because an aldehyde has formed.'], ['Žalia, nes susidarė chromo druskos.', 'Green, because chromium salts have formed.']],
          'Fenolftaleinas šarminėje terpėje yra spalvotas.', 'Phenolphthalein is coloured in an alkaline medium.',
          'Fenolftaleinas šarminėje terpėje yra raudonai violetinis. Kadangi hidrolizės metu susidaro $NaOH$, tirpalas parausta.', 'Phenolphthalein is crimson in an alkaline medium. Hydrolysis produces $NaOH$, so the solution turns crimson.')
      ],
      why: t('Alkoksidas yra stipresnė bazė už hidroksido joną, todėl vandenyje grįžta į alkoholį ir sudaro šarmą. Todėl alkoksidus laikome be vandens.', 'An alkoxide is a stronger base than the hydroxide ion, so in water it returns to the alcohol and forms an alkali. That is why alkoxides are kept dry.'),
      src: 'LW6 p2; L11 p6'
    },
    {
      id: 'u11.acidwhy.4',
      q: [{ p: t('Palyginkite šių anijonų bazingumą.', 'Compare the basicity of these anions.') },
        { mol: [{ smi: 'CC(C)(C)[O-]', name: t('tret-butoksidas', 'tert-butoxide') }, { smi: 'CC[O-]', name: t('etoksidas', 'ethoxide') }, { smi: '[OH-]', name: t('hidroksidas', 'hydroxide') }, { smi: '[O-]c1ccccc1', name: t('fenoksidas', 'phenoxide') }] }],
      steps: [
        {
          prompt: t('Išdėstykite juos nuo stipriausios iki silpniausios bazės.', 'Order them from the strongest to the weakest base.'),
          kind: 'order', options: [tx('tret-butoksidas', 'tert-butoxide'), tx('etoksidas', 'ethoxide'), tx('hidroksidas', 'hydroxide'), tx('fenoksidas', 'phenoxide')],
          hint: t('Stipri bazė turi silpną konjuguotąją rūgštį. Prisiminkite jų $pKa$.', 'A strong base has a weak conjugate acid. Recall their $pKa$.'),
          solution: t('2-metil-2-propanolio $pKa$ ≈ 18, etanolio ≈ 16, vandens 15,7, fenolio ≈ 10: kuo didesnis konjuguotosios rūgšties $pKa$, tuo stipresnė bazė.', 'The $pKa$ of 2-methyl-2-propanol is ≈ 18, of ethanol ≈ 16, of water 15.7 and of phenol ≈ 10: the larger the $pKa$ of the conjugate acid, the stronger the base.')
        },
        ch('Kodėl fenoksidas yra daug silpnesnė bazė už alkoksidus?', 'Why is phenoxide a much weaker base than the alkoxides?',
          [['Jo neigiamas krūvis pasiskirsto per aromatinį žiedą, todėl anijonas stabilesnis.', 'Its negative charge is spread over the aromatic ring, so the anion is more stable.'], ['Fenoksido deguonis neturi laisvųjų poros.', 'The oxygen of phenoxide has no lone pairs.'], ['Fenoksidas turi daugiau anglies atomų.', 'Phenoxide has more carbon atoms.'], ['Fenoksido anglis yra sp3 hibridizuota.', 'The carbon of phenoxide is sp3 hybridised.']],
          'Nupieškite fenoksidą ir pabandykite parašyti kelias rezonansines formules.', 'Draw phenoxide and try to write several resonance structures.',
          'Stabilus anijonas nelinkęs prijungti protono, todėl jo konjuguotoji rūgštis (fenolis) stipresnė.', 'A stable anion is reluctant to take up a proton, so its conjugate acid (phenol) is stronger.')
      ],
      why: t('Bazingumą nusako konjuguotosios rūgšties $pKa$: alkoksidai yra stipresnės bazės už hidroksidą, todėl ir deprotonuoja alkoholį, ir vandenyje sudaro $OH-$.', 'The basicity is set by the $pKa$ of the conjugate acid: alkoxides are stronger bases than hydroxide, so they both deprotonate an alcohol and generate $OH-$ in water.'),
      src: 'L11 p6, T p72'
    },
    {
      id: 'u11.acidwhy.5',
      q: [{ p: t('Palyginkite, kaip greitai šie alkoholiai reaguoja su natriu (esant tokioms pačioms sąlygoms).', 'Compare how fast these alcohols react with sodium under the same conditions.') },
        { mol: [{ smi: 'CO', name: t('metanolis', 'methanol') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'CC(C)O', name: t('2-propanolis', '2-propanol') }, { smi: 'CC(C)(C)O', name: t('2-metil-2-propanolis', '2-methyl-2-propanol') }] }],
      steps: [
        {
          prompt: t('Išdėstykite juos nuo greičiausiai iki lėčiausiai reaguojančio.', 'Order them from the fastest to the slowest.'),
          kind: 'order', options: [tx('metanolis', 'methanol'), tx('etanolis', 'ethanol'), tx('2-propanolis', '2-propanol'), tx('2-metil-2-propanolis', '2-methyl-2-propanol')],
          hint: t('Kaip alkilgrupės veikia $O-H$ rūgštingumą ir deguonies užstojimą?', 'How do alkyl groups affect the acidity of the $O-H$ and the shielding of the oxygen?'),
          solution: t('Metanolis > etanolis > 2-propanolis > 2-metil-2-propanolis: kuo daugiau alkilgrupių, tuo mažiau rūgštus alkoholis.', 'Methanol > ethanol > 2-propanol > 2-methyl-2-propanol: the more alkyl groups, the less acidic the alcohol.')
        },
        ch('Kuo paaiškinama ši eilė?', 'What explains this order?',
          [['Alkilgrupės stumia elektronus (+I) ir šakoja aplinką, todėl alkoksido anijonas mažiau stabilizuojamas tirpiklio.', 'Alkyl groups push electrons (+I) and crowd the oxygen, so the alkoxide anion is less stabilised by the solvent.'],
            ['Alkilgrupės traukia elektronus ir didina $O-H$ poliškumą.', 'Alkyl groups withdraw electrons and increase the polarity of $O-H$.'],
            ['Šakoti alkoholiai neturi $O-H$ ryšio.', 'Branched alcohols have no $O-H$ bond.'],
            ['Natris neprasiskverbia į šakotas molekules.', 'Sodium cannot get into branched molecules.']],
          'Pagalvokite, kaip alkilgrupės veikia anijono stabilumą.', 'Think about how alkyl groups affect the stability of an anion.',
          'Rūgštingumas mažėja metanolis > pirminis > antrinis > tretinis: alkilgrupės didina elektronų tankį ant deguonies ir apsunkina anijono tirpinimą.', 'The acidity falls in the order methanol > primary > secondary > tertiary: alkyl groups raise the electron density on oxygen and make it harder to solvate the anion.')
      ],
      why: t('Alkoholiai su natriu reaguoja skirtingu greičiu: metanolis audringiausiai, tretiniai alkoholiai lėčiausiai. Tačiau visi virsta alkoksidais ir išskiria vandenilį.', 'Alcohols react with sodium at different speeds: methanol most vigorously, tertiary alcohols slowest. All of them still give alkoxides and hydrogen.'),
      src: 'T p72; Klein'
    },
    {
      id: 'u11.acidwhy.6',
      q: [{ p: t('Į tris mėgintuvėlius su natrio gabalėliu įpilama po skirtingą skystį.', 'A different liquid is added to each of three test tubes that hold a piece of sodium.') },
        { mol: [{ smi: 'CCO', caption: t('A', 'A') }, { smi: 'CCOCC', caption: t('B', 'B') }, { smi: 'CCCCCC', caption: t('C', 'C') }] }],
      steps: [
        ch('Kuriame mėgintuvėlyje matomi vandenilio dujų burbuliukai?', 'In which tube are bubbles of hydrogen visible?',
          [['Tik A (alkoholyje).', 'Only A (the alcohol).'], ['Tik B (eteryje).', 'Only B (the ether).'], ['Tik C (alkane).', 'Only C (the alkane).'], ['Visuose trijuose.', 'In all three.']],
          'Kuris iš skysčių turi rūgštų protoną ($O-H$)?', 'Which of the liquids has an acidic proton ($O-H$)?',
          'Reaguoja tik alkoholis: jis turi poliarų $O-H$ ryšį. Eteris ir alkanas neturi rūgštaus vandenilio, todėl su natriu nereaguoja.', 'Only the alcohol reacts: it has a polar $O-H$ bond. The ether and the alkane have no acidic hydrogen and do not react with sodium.'),
        ch('Kodėl eteris ir heksanas tinka kaip tirpikliai reakcijoms su šarminiais metalais?', 'Why are ethers and hexane suitable solvents for reactions with alkali metals?',
          [['Jie neturi rūgštaus protono, kurį metalas galėtų atplėšti.', 'They have no acidic proton that the metal could remove.'], ['Jie tirpina natrį ir sudaro druskas.', 'They dissolve sodium and form salts.'], ['Jie yra stipresnės rūgštys už alkoholius.', 'They are stronger acids than alcohols.'], ['Jie reaguoja su natriu lėčiau už alkoholį, bet vis tiek reaguoja.', 'They react with sodium more slowly than an alcohol, but still react.']],
          'Ieškokite grupės, kuri su natriu pasikeistų.', 'Look for a group that would change with sodium.',
          'Be $O-H$ grupės natris neturi ką atplėšti, todėl tirpiklis lieka nepakitęs.', 'Without an $O-H$ group the sodium has nothing to remove, so the solvent stays unchanged.')
      ],
      why: t('Su natriu reaguoja medžiagos, turinčios rūgštų protoną: išsiskiria vandenilis. Eteriai ir alkanai tokios grupės neturi.', 'Sodium reacts with substances that have an acidic proton, giving hydrogen. Ethers and alkanes have no such group.'),
      src: 'L11 p6; LW6 p2'
    },
    {
      id: 'u11.acidwhy.7',
      q: [{ p: t('Etanolis reaguoja su natrio hidridu.', 'Ethanol reacts with sodium hydride.') }, { scheme: { items: [{ smi: 'CCO' }, { plus: true }, { smi: '[Na+].[H-]' }, { arrow: '→' }] } }],
      steps: [
        {
          prompt: t('Bakstelėkite atomą, kuris reakcijoje atplėšia protoną.', 'Tap the atom that removes the proton in this reaction.'),
          kind: 'atoms', mol: { smi: 'CCO.[Na+].[H-]', opts: { numbers: 'all' } }, answer: [4],
          hint: t('Kuri dalelė turi laisvąją elektronų porą ir yra bazė?', 'Which particle has a lone electron pair and is the base?'),
          solution: t('Hidrido jonas $H-$ (Nr. 5) yra stipri bazė: savo elektronų pora jis sudaro ryšį su alkoholio $O-H$ vandeniliu.', 'The hydride ion $H-$ (no. 5) is the strong base: it bonds with its electron pair to the hydrogen of the alcohol’s $O-H$.')
        },
        ch('Kodėl reakcija su $NaH$ yra negrįžtama?', 'Why is the reaction with $NaH$ irreversible?',
          [['Susidaręs $H2$ išsiskiria kaip dujos ir pusiausvyra pasislenka alkoksido link.', 'The $H2$ formed escapes as a gas, which drives the equilibrium toward the alkoxide.'], ['Alkoksidas visiškai netirpsta.', 'The alkoxide is completely insoluble.'], ['$NaH$ yra rūgštis.', '$NaH$ is an acid.'], ['Reakcija iš tikrųjų yra grįžtama.', 'The reaction is in fact reversible.']],
          'Kas išeina iš reakcijos mišinio?', 'What leaves the reaction mixture?',
          'Kai vienas produktas išsiskiria dujų pavidalu, grįžtamoji reakcija praktiškai nevyksta: alkoholis virsta alkoksidu visiškai.', 'When one product leaves as a gas, the reverse reaction practically cannot occur: the alcohol is converted into the alkoxide completely.')
      ],
      why: t('Hidrido jonas yra labai stipri bazė, nes jo konjuguotoji rūgštis $H2$ yra itin silpna. Protonas pasiima, o vandenilio dujos pabėga, todėl alkoksidas susidaro visiškai.', 'The hydride ion is a very strong base because its conjugate acid $H2$ is extremely weak. It takes the proton and the hydrogen gas escapes, so the alkoxide forms completely.'),
      src: 'L11 p6'
    },
    {
      id: 'u11.acidwhy.8',
      q: [{ p: t('Natris ir kalis reaguoja su etanoliu. Kalio atveju reakcija audringesnė.', 'Sodium and potassium react with ethanol; with potassium the reaction is more violent.') }, { scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: f('K') }, { smi: 'CC[O-].[K+]' }, { plus: true }, { smi: '[H][H]' }] } }],
      steps: [
        {
          prompt: t('Pagal kurią lygtį reakcija vyksta?', 'Which equation describes the reaction?'),
          kind: 'choice',
          options: [tx('$2 C2H5OH + 2 K → 2 C2H5OK + H2$', '$2 C2H5OH + 2 K → 2 C2H5OK + H2$'), tx('$C2H5OH + K → C2H5K + OH$', '$C2H5OH + K → C2H5K + OH$'), tx('$C2H5OH + K → C2H4 + KOH$', '$C2H5OH + K → C2H4 + KOH$'), tx('$C2H5OH + 2 K → C2H5OK + KH$', '$C2H5OH + 2 K → C2H5OK + KH$')],
          answer: 0,
          hint: t('Suskaičiuokite vandenilio atomus abiejose pusėse: iš kiekvienos molekulės išeina vienas protonas.', 'Count the hydrogen atoms on both sides: one proton leaves each molecule.'),
          solution: t('Du alkoholio protonai ir du metalo elektronai sudaro vieną $H2$ molekulę; metalas netenka elektrono ir virsta $K+$.', 'Two protons of the alcohol and two electrons of the metal form one $H2$ molecule; the metal loses an electron and becomes $K+$.')
        },
        ch('Kodėl kalis reaguoja audringiau nei natris?', 'Why does potassium react more violently than sodium?',
          [['Kalis atiduoda elektroną lengviau (mažesnė jonizacijos energija).', 'Potassium gives up its electron more easily (lower ionisation energy).'], ['Kalis yra mažesnis atomas.', 'Potassium is a smaller atom.'], ['Kalis yra elektroneigiamesnis.', 'Potassium is more electronegative.'], ['Kalio alkoksidas yra rūgštis.', 'Potassium alkoxide is an acid.']],
          'Čia metalas yra reduktorius: kas lemia, kaip lengvai jis atiduoda elektroną?', 'The metal acts as a reductant: what decides how easily it gives up an electron?',
          'Žemyn grupėje atomo spindulys didėja, o jonizacijos energija mažėja, todėl kalis yra stipresnis reduktorius.', 'Down the group the atomic radius grows and the ionisation energy falls, so potassium is the stronger reductant.')
      ],
      why: t('Visų šarminių metalų reakcija su alkoholiu panaši: metalas atiduoda elektroną, alkoholis netenka protono, išsiskiria $H2$. Skiriasi tik greitis.', 'All alkali metals react with an alcohol in the same way: the metal gives up an electron, the alcohol loses a proton and $H2$ is evolved. Only the speed differs.'),
      src: 'L11 p6, p7'
    }
  ];

  const OXW = [
    {
      id: 'u11.oxwhy.1',
      q: [{ p: t('Chromo rūgštimi oksiduojamas antrinis alkoholis. Pirmoje stadijoje susidaro chromato esteris, antroje stadijoje vanduo atplėšia protoną nuo anglies, turinčios $OH$.', 'A secondary alcohol is oxidised by chromic acid. In the first stage a chromate ester forms; in the second stage water removes the proton from the carbon that carried the $OH$.') }],
      steps: [
        ch('Kodėl tretinis alkoholis tuo pačiu būdu neoksiduojasi?', 'Why is a tertiary alcohol not oxidised in the same way?',
          [['Anglis su $OH$ neturi vandenilio, kurį vanduo galėtų atplėšti antrojoje (eliminavimo) stadijoje.', 'The carbon with the $OH$ has no hydrogen that water could remove in the second (elimination) stage.'],
            ['Tretinis alkoholis nesudaro chromato esterio, nes yra per didelis.', 'A tertiary alcohol cannot form the chromate ester because it is too big.'],
            ['Tretinis alkoholis yra per rūgštus.', 'A tertiary alcohol is too acidic.'],
            ['Chromo rūgštis reaguoja tik su pirminiais alkoholiais.', 'Chromic acid reacts only with primary alcohols.']],
          'Kuris atomas netenka protono antroje stadijoje?', 'Which atom loses a proton in the second stage?',
          'Antroje stadijoje vyksta eliminavimas: atplėšiamas $C-H$ protonas, o elektronų pora sudaro $C=O$ ryšį. Tretiniame alkoholyje prie anglies su $OH$ nėra $H$.', 'The second stage is an elimination: a $C-H$ proton is removed and its electron pair forms the $C=O$ bond. A tertiary alcohol has no $H$ on the carbon with the $OH$.')
      ],
      why: t('Oksidacija iš esmės yra $H$ ir $OH$ praradimas iš to paties atomo, todėl reikia vandenilio ties anglimi, turinčia $OH$. Pirminiai (du $H$) ir antriniai (vienas $H$) alkoholiai oksiduojasi, tretiniai – ne.', 'An oxidation is in essence the loss of an $H$ and the $OH$ from the same carbon, so a hydrogen is needed on the carbon with the $OH$. Primary (two $H$) and secondary (one $H$) alcohols are oxidised, tertiary ones are not.'),
      src: 'L11 p24, p20'
    },
    {
      id: 'u11.oxwhy.2',
      q: [{ p: t('1-heptanolis su PCC dichlormetane duoda heptanalį, o su $CrO3$ vandeninėje rūgštyje – heptano rūgštį.', '1-Heptanol gives heptanal with PCC in dichloromethane but heptanoic acid with $CrO3$ in aqueous acid.') }],
      steps: [
        ch('Kodėl PCC sustoja ties aldehidu?', 'Why does PCC stop at the aldehyde?',
          [['PCC yra švelnesnis oksidatorius ir naudojamas be vandens, todėl aldehidas toliau neoksiduojamas.', 'PCC is a milder oxidant used without water, so the aldehyde is not oxidised further.'],
            ['PCC redukuoja aldehidą atgal į alkoholį.', 'PCC reduces the aldehyde back to the alcohol.'],
            ['PCC oksiduoja tik antrinius alkoholius.', 'PCC oxidises only secondary alcohols.'],
            ['Aldehidai su jokiu oksidatoriumi neoksiduojasi.', 'Aldehydes are not oxidised by any oxidant.']],
          'Palyginkite terpes: kuri turi vandens ir rūgšties?', 'Compare the media: which contains water and acid?',
          'Vandeninėje rūgščioje terpėje aldehidas (hidratuotas) lengvai oksiduojasi iki rūgšties; PCC dichlormetane nėra vandens, todėl reakcija sustoja ties aldehidu.', 'In aqueous acid the aldehyde (as its hydrate) is easily oxidised to the acid; PCC in dichloromethane has no water, so the reaction stops at the aldehyde.'),
        ch('Kurį oksidatorių rinktis, jei reikia ketono iš antrinio alkoholio?', 'Which oxidant would you choose to make a ketone from a secondary alcohol?',
          [['Tinka ir PCC, ir chromo rūgštis.', 'Both PCC and chromic acid work.'], ['Tik PCC.', 'Only PCC.'], ['Tik chromo rūgštis.', 'Only chromic acid.'], ['Nė vienas: antriniai alkoholiai neoksiduojasi.', 'None: secondary alcohols are not oxidised.']],
          'Ar ketoną galima oksiduoti toliau lengvai?', 'Can a ketone easily be oxidised further?',
          'Ketonas neturi vandenilio prie karbonilo anglies, todėl lengvai neoksiduojasi toliau: antriniai alkoholiai visais atvejais duoda ketonus.', 'A ketone has no hydrogen on the carbonyl carbon and is not easily oxidised further: secondary alcohols give ketones in every case.')
      ],
      why: t('Pirminį alkoholį galima sustabdyti ties aldehidu tik švelniu oksidatoriumi be vandens (PCC). Stiprus oksidatorius vandenyje nuvaro jį iki rūgšties. Antrinis alkoholis visada sustoja ties ketonu.', 'A primary alcohol can be stopped at the aldehyde only with a mild oxidant in the absence of water (PCC). A strong oxidant in water takes it all the way to the acid. A secondary alcohol always stops at the ketone.'),
      src: 'L11 p21, p22, p23'
    },
    {
      id: 'u11.oxwhy.3',
      q: [{ p: t('Šie keturi junginiai turi tą patį anglies skeletą ir skirtingą oksidacijos lygį.', 'These four compounds have the same carbon skeleton and a different oxidation level.') },
        { mol: [{ smi: 'CCC', name: t('propanas', 'propane') }, { smi: 'CCCO', name: t('1-propanolis', '1-propanol') }, { smi: 'CCC=O', name: t('propanalis', 'propanal') }, { smi: 'CCC(=O)O', name: t('propano rūgštis', 'propanoic acid') }] }],
      steps: [{
        prompt: t('Išdėstykite juos nuo labiausiai redukuoto iki labiausiai oksiduoto.', 'Order them from the most reduced to the most oxidised.'),
        kind: 'order', options: [tx('propanas', 'propane'), tx('1-propanolis', '1-propanol'), tx('propanalis', 'propanal'), tx('propano rūgštis', 'propanoic acid')],
        hint: t('Suskaičiuokite, kiek ryšių su deguonimi turi pirmoji anglis.', 'Count how many bonds to oxygen the first carbon has.'),
        solution: t('Propanas (0 ryšių su $O$) < alkoholis (1) < aldehidas (2) < rūgštis (3): kiekviena oksidacija prideda ryšį su deguonimi arba atima vandenilį.', 'Propane (0 bonds to $O$) < alcohol (1) < aldehyde (2) < acid (3): each oxidation adds a bond to oxygen or removes a hydrogen.')
      }],
      why: t('Pirminio alkoholio oksidacija yra seka: alkoholis → aldehidas → rūgštis. Kiekvienas žingsnis padidina anglies oksidacijos laipsnį.', 'The oxidation of a primary alcohol is a sequence: alcohol → aldehyde → acid. Each step raises the oxidation state of the carbon.'),
      src: 'L11 p20'
    },
    {
      id: 'u11.oxwhy.4',
      q: [{ p: t('Metanolis organizme oksiduojasi iki skruzdžių rūgšties, o etanolis – iki acto rūgšties. Šias reakcijas katalizuoja alkoholio dehidrogenazė.', 'In the body methanol is oxidised to formic acid and ethanol to acetic acid. The reactions are catalysed by alcohol dehydrogenase.') },
        { scheme: { items: [{ smi: 'CO' }, { arrow: '→', above: f('$NAD+$') }, { smi: 'C=O' }, { arrow: '→', above: f('$NAD+$') }, { smi: 'OC=O' }] }, caption: t('metanolis → formaldehidas → skruzdžių rūgštis', 'methanol → formaldehyde → formic acid') }],
      steps: [
        ch('Kodėl nuo metanolio apsinuodijusiam žmogui duodama etanolio?', 'Why is ethanol given to a person poisoned by methanol?',
          [['Etanolis oksiduojasi greičiau ir užima fermentą, todėl metanolis nevirsta toksiška skruzdžių rūgštimi ir pasišalina kitu keliu.', 'Ethanol is oxidised faster and occupies the enzyme, so methanol is not turned into toxic formic acid and is excreted by another route.'],
            ['Etanolis neutralizuoja skruzdžių rūgštį.', 'Ethanol neutralises formic acid.'],
            ['Etanolis oksiduoja metanolį į nekenksmingą produktą.', 'Ethanol oxidises methanol to a harmless product.'],
            ['Etanolis sudaro su metanoliu esterį.', 'Ethanol forms an ester with methanol.']],
          'Du substratai varžosi dėl to paties fermento. Kuris jį veikia greičiau?', 'Two substrates compete for the same enzyme. Which one is processed faster?',
          'Fermentas pirmiausia oksiduoja etanolį, o tuo metu metanolis nespėja virsti skruzdžių rūgštimi ir ilgiau pasilieka iki pasišalinimo.', 'The enzyme oxidises ethanol first, so methanol is not converted into formic acid and stays until it is excreted.'),
        ch('Koks yra NAD⁺ vaidmuo šiose reakcijose?', 'What is the role of NAD⁺ in these reactions?',
          [['Oksidatorius: jis priima vandenilį iš alkoholio ir virsta NADH.', 'The oxidant: it takes hydrogen from the alcohol and becomes NADH.'], ['Reduktorius: jis atiduoda vandenilį alkoholiui.', 'The reductant: it gives hydrogen to the alcohol.'], ['Rūgštis, kuri protonuoja alkoholį.', 'An acid that protonates the alcohol.'], ['Tirpiklis.', 'A solvent.']],
          'Alkoholis oksiduojasi: kas turi imti iš jo elektronus ir vandenilį?', 'The alcohol is oxidised: who has to take electrons and hydrogen from it?',
          'Alkoholis atiduoda hidridą ir protoną, o NAD⁺ yra priimantysis, todėl redukuojasi į NADH. Tai biologinis oksidatorius.', 'The alcohol gives up a hydride and a proton, and NAD⁺ is the acceptor, so it is reduced to NADH. It is a biological oxidant.')
      ],
      why: t('Gyvame organizme oksidacija vyksta fermentų pagalba su NAD⁺ kaip oksidatoriumi. Dėl konkurencijos tarp metanolio ir etanolio etanolis veikia kaip priešnuodis.', 'In a living organism oxidation is carried out by enzymes with NAD⁺ as the oxidant. Because methanol and ethanol compete for the enzyme, ethanol works as an antidote.'),
      src: 'L11 p25'
    },
    {
      id: 'u11.oxwhy.5',
      q: [{ p: t('Į oranžinį kalio bichromato tirpalą su sieros rūgštimi įlašinama po lašą šių skysčių ir pašildoma.', 'A drop of each of these liquids is added to an orange solution of potassium dichromate in sulfuric acid, and warmed.') },
        { mol: [{ smi: 'CCO', caption: t('A', 'A') }, { smi: 'CC(C)O', caption: t('B', 'B') }, { smi: 'CC(C)(C)O', caption: t('C', 'C') }, { smi: 'CCOCC', caption: t('D', 'D') }] }],
      steps: [
        {
          prompt: t('Pažymėkite skysčius, su kuriais tirpalas pažaliuoja.', 'Pick the liquids with which the solution turns green.'),
          kind: 'multi', options: [tx('A', 'A'), tx('B', 'B'), tx('C', 'C'), tx('D', 'D')], answer: [0, 1],
          hint: t('Chromatas pažaliuoja, kai pats redukuojasi, o tam kažkas turi oksiduotis.', 'The chromate turns green when it is itself reduced, so something has to be oxidised.'),
          solution: t('Pirminis (A) ir antrinis (B) alkoholiai oksiduojasi, o $Cr(VI)$ (oranžinis) virsta $Cr(III)$ (žaliu). Tretinis alkoholis (C) ir eteris (D) neoksiduojasi, tirpalas lieka oranžinis.', 'The primary (A) and secondary (B) alcohols are oxidised and $Cr(VI)$ (orange) becomes $Cr(III)$ (green). The tertiary alcohol (C) and the ether (D) are not oxidised, so the solution stays orange.')
        },
        ch('Kuris oksidacijos laipsnio pasikeitimas atsiranda reakcijoje, kurios metu tirpalas keičia spalvą?', 'Which change of oxidation state is behind the colour change?',
          [['Chromas keičiasi nuo $+6$ iki $+3$.', 'Chromium changes from $+6$ to $+3$.'], ['Chromas keičiasi nuo $+3$ iki $+6$.', 'Chromium changes from $+3$ to $+6$.'], ['Anglis keičiasi nuo $+3$ iki $0$.', 'Carbon changes from $+3$ to $0$.'], ['Deguonis keičiasi nuo $−2$ iki $0$.', 'Oxygen changes from $−2$ to $0$.']],
          'Spalvą keičia oksidatorius: jis priima elektronus.', 'The oxidant changes colour: it accepts electrons.',
          'Oksidatorius redukuojasi: oranžinis bichromatas ($Cr$ $+6$) virsta žaliais $Cr^3+^$ jonais.', 'The oxidant is reduced: orange dichromate ($Cr$ $+6$) becomes green $Cr^3+^$ ions.')
      ],
      why: t('Spalvos pasikeitimas parodo, kad oksidatorius redukavosi, taigi alkoholis oksidavosi. Tretinis alkoholis ir eteris tokios reakcijos neduoda, todėl bandymas padeda juos atskirti.', 'The colour change shows that the oxidant was reduced, so the alcohol was oxidised. A tertiary alcohol and an ether do not react in this way, so the test helps tell them apart.'),
      src: 'L11 p22; LW6 p2'
    },
    {
      id: 'u11.oxwhy.6',
      q: [{ p: t('Etanolis oksiduojamas iki etanalio, po to iki etano rūgšties.', 'Ethanol is oxidised to ethanal and then to ethanoic acid.') },
        { scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: f('[O]') }, { smi: 'CC=O' }, { arrow: '→', above: f('[O]') }, { smi: 'CC(=O)O' }] } }],
      steps: [
        ch('Kodėl pirmoji reakcija laikoma oksidacija?', 'Why is the first reaction called an oxidation?',
          [['Alkoholis netenka dviejų vandenilių ($H$ nuo $C$ ir nuo $O$), o anglis sudaro $C=O$ ryšį.', 'The alcohol loses two hydrogens ($H$ from $C$ and from $O$) and the carbon forms a $C=O$ bond.'],
            ['Alkoholis prisijungia vandenilį.', 'The alcohol adds hydrogen.'],
            ['Alkoholis netenka deguonies.', 'The alcohol loses oxygen.'],
            ['Alkoholio anglis pakeičia $C-C$ ryšį.', 'The carbon of the alcohol replaces a $C-C$ bond.']],
          'Palyginkite vandenilių ir deguonies skaičių prie pirmosios anglies prieš ir po reakcijos.', 'Compare the number of hydrogens and oxygens at the first carbon before and after.',
          'Organinėje chemijoje oksidacija – tai ryšių su deguonimi didėjimas arba vandenilio netekimas. Čia alkoholis netenka $H2$ ir virsta aldehidu.', 'In organic chemistry oxidation means more bonds to oxygen or loss of hydrogen. Here the alcohol loses $H2$ and becomes an aldehyde.'),
        ch('Kodėl iš pirminio alkoholio gauti aldehidą sunkiau nei ketoną iš antrinio?', 'Why is it harder to obtain an aldehyde from a primary alcohol than a ketone from a secondary one?',
          [['Aldehidas dar turi $H$ prie karbonilo anglies ir oksiduojasi toliau, o ketono atveju tokio $H$ nebėra.', 'The aldehyde still has an $H$ on the carbonyl carbon and is oxidised further, whereas a ketone has none.'],
            ['Aldehidas yra stabilesnis už ketoną.', 'An aldehyde is more stable than a ketone.'],
            ['Pirminis alkoholis nereaguoja su stipriais oksidatoriais.', 'A primary alcohol does not react with strong oxidants.'],
            ['Antrinis alkoholis yra rūgštesnis.', 'A secondary alcohol is more acidic.']],
          'Kas pasilieka prie karbonilo anglies aldehide ir ketone?', 'What remains on the carbonyl carbon in an aldehyde and in a ketone?',
          'Aldehido $C-H$ ryšys lengvai oksiduojamas ($H$ → $OH$), todėl su stipriais oksidatoriais sustoti ties aldehidu sunku.', 'The $C-H$ bond of an aldehyde is easily oxidised ($H$ → $OH$), so stopping at the aldehyde with strong oxidants is hard.')
      ],
      why: t('Alkoholių oksidacija yra vandenilio netekimas ir ryšių su deguonimi didėjimas. Pirminio alkoholio oksidaciją galima sustabdyti ties aldehidu tik švelniomis sąlygomis, o ketonas toliau neoksiduojamas.', 'The oxidation of alcohols is a loss of hydrogen and a gain in bonds to oxygen. The oxidation of a primary alcohol can be stopped at the aldehyde only under mild conditions, and a ketone is not oxidised further.'),
      src: 'L11 p20, LW6 p2'
    },
    {
      id: 'u11.oxwhy.7',
      q: [{ p: t('Tretinis alkoholis kaitinamas su stipriu oksidatoriumi rūgščioje terpėje.', 'A tertiary alcohol is heated with a strong oxidant in acidic solution.') },
        { scheme: { items: [{ smi: 'CC(C)(C)O' }, { arrow: '→', above: f('KMnO4, H3O+, Δ') }] } }],
      steps: [
        ch('Ką galima tikėtis, kad atsitiks, jei reakcijos sąlygos labai griežtos?', 'What can be expected if the conditions are very harsh?',
          [['Nutrūksta $C-C$ ryšiai ir susidaro ketonų bei rūgščių mišinys.', 'The $C-C$ bonds break and a mixture of ketones and acids forms.'], ['Susidaro aldehidas, kaip ir pirminio alkoholio atveju.', 'An aldehyde forms, as with a primary alcohol.'], ['Susidaro ta pati ketono forma kaip antrinio alkoholio atveju.', 'The same ketone forms as with a secondary alcohol.'], ['Alkoholis visiškai nepasikeičia.', 'The alcohol is left entirely unchanged.']],
          'Įprastomis sąlygomis tretinis alkoholis neoksiduojasi, bet griežtomis sąlygomis jis gali suirti.', 'Under normal conditions a tertiary alcohol is not oxidised, but under harsh conditions it can degrade.',
          'Tretiniai alkoholiai atsparūs oksidacijai, bet veikiami stipriais oksidatoriais jie suyra: nutrūksta $C-C$ ryšiai ir susidaro ketonų bei rūgščių mišiniai.', 'Tertiary alcohols resist oxidation, but with strong oxidants they degrade: $C-C$ bonds break and mixtures of ketones and acids form.')
      ],
      why: t('Tretinis alkoholis neturi $H$ prie anglies su $OH$, todėl įprastu būdu neoksiduojasi. Tik griežtomis sąlygomis nutrūksta $C-C$ ryšiai, bet tai jau ne kontroliuojama oksidacija.', 'A tertiary alcohol has no $H$ on the carbon with the $OH$, so it is not oxidised in the usual way. Only under harsh conditions $C-C$ bonds break, but that is no longer a controlled oxidation.'),
      src: 'T p73; L11 p20'
    },
    {
      id: 'u11.oxwhy.8',
      q: [{ p: t('Oranžinis bichromatas ir violetinis permanganatas rūgščioje terpėje keičia spalvą, kai su jais reaguoja alkoholis.', 'In acid, orange dichromate and violet permanganate change colour when an alcohol reacts with them.') }],
      steps: [{
        prompt: t('Sudėkite kiekvieną reagentą su spalvos pasikeitimu.', 'Pair each reagent with its colour change.'),
        kind: 'match',
        answer: {
          left: [{ text: t('$K2Cr2O7$ / $H2SO4$', '$K2Cr2O7$ / $H2SO4$') }, { text: t('$KMnO4$ / $H2SO4$', '$KMnO4$ / $H2SO4$') }, { text: t('$KMnO4$ neutralioje ar šarminėje terpėje', '$KMnO4$ in neutral or alkaline medium') }],
          right: [{ text: t('oranžinis → žalias ($Cr^3+^$)', 'orange → green ($Cr^3+^$)') }, { text: t('violetinis → bespalvis ($Mn^2+^$)', 'violet → colourless ($Mn^2+^$)') }, { text: t('violetinis → rudos $MnO2$ nuosėdos', 'violet → brown $MnO2$ precipitate') }],
          pairs: [0, 1, 2]
        },
        hint: t('Kiekvienu atveju metalas redukuojasi, tik į skirtingą oksidacijos laipsnį.', 'In each case the metal is reduced, only to a different oxidation state.'),
        solution: t('Dichromatas virsta žaliu $Cr^3+^$; rūgščioje terpėje permanganatas redukuojasi iki beveik bespalvio $Mn^2+^$, o silpnai rūgščioje, neutralioje ar šarminėje – iki rudo $MnO2$.', 'Dichromate becomes green $Cr^3+^$; in acid permanganate is reduced to the almost colourless $Mn^2+^$, and in neutral or alkaline medium to brown $MnO2$.')
      }],
      why: t('Oksidatoriaus spalvos pokytis yra alkoholio oksidacijos požymis, todėl šios reakcijos naudojamos alkoholiams atpažinti.', 'The colour change of the oxidant is the sign that an alcohol is being oxidised, so these reactions are used to detect alcohols.'),
      src: 'L11 p22; LW6 p2'
    }
  ];

  const LAB = [
    {
      id: 'u11.lab.1',
      q: [{ p: t('Į mėgintuvėlį su etanoliu ir koncentruota sieros rūgštimi pridedama žiupsnelis $Al2O3$ ir mišinys kaitinamas. Dujos barbotuojamos per bromo vandenį.', 'A pinch of $Al2O3$ is added to a test tube with ethanol and concentrated sulfuric acid, and the mixture is heated. The gas is bubbled through bromine water.') }],
      steps: [
        ch('Kokios dujos susidaro?', 'Which gas forms?',
          [['Etenas, $CH2=CH2$.', 'Ethene, $CH2=CH2$.'], ['Etanas, $CH3CH3$.', 'Ethane, $CH3CH3$.'], ['Anglies dioksidas.', 'Carbon dioxide.'], ['Vandenilis.', 'Hydrogen.']],
          'Koncentruota sieros rūgštis kaitinant atskelia vandenį iš alkoholio.', 'Hot concentrated sulfuric acid removes water from the alcohol.',
          'Etanolis su rūgštimi sudaro etilo hidrosulfatą, kurį kaitinant skyla į etaną ir rūgštį: bendrai vyksta dehidratacija ir susidaro etenas.', 'Ethanol and the acid first make ethyl hydrogen sulfate, which on heating breaks down to ethene and the acid: overall a dehydration to ethene.'),
        ch('Ką pamatysite bromo vandenyje ir kodėl?', 'What do you see in the bromine water, and why?',
          [['Geltona spalva išnyksta, nes etenas prijungia bromą ir susidaro bespalvis 1,2-dibrometanas.', 'The yellow colour fades because ethene adds bromine and colourless 1,2-dibromoethane forms.'], ['Spalva tamsėja, nes susidaro bromo perteklius.', 'The colour deepens because excess bromine forms.'], ['Iškrenta rudos nuosėdos.', 'A brown precipitate forms.'], ['Nieko nepasikeičia, nes etenas yra inertiškas.', 'Nothing happens because ethene is inert.']],
          'Dvigubas ryšys reaguoja su bromu. Kokia yra produkto spalva?', 'The double bond reacts with bromine. What colour is the product?',
          'Bromo vanduo yra geltonas; etenas prijungia $Br2$ prie $C=C$ ir susidaro bespalvis dibromidas, todėl tirpalas išblunka.', 'Bromine water is yellow; ethene adds $Br2$ across the $C=C$ and a colourless dibromide forms, so the solution fades.')
      ],
      why: t('Eteno gavimas iš etanolio yra dehidratacija, o spalvos išnykimas bromo vandenyje įrodo dvigubą ryšį.', 'Making ethene from ethanol is a dehydration, and the fading of bromine water proves a double bond.'),
      src: 'LW6 p1'
    },
    {
      id: 'u11.lab.2',
      q: [{ p: t('Etenas praleidžiamas per rūgštinį kalio permanganato tirpalą.', 'Ethene is passed through a solution of potassium permanganate.') }],
      steps: [
        ch('Kas pastebima?', 'What is observed?',
          [['Violetinė spalva išnyksta ir iškrenta rudos $MnO2$ nuosėdos.', 'The violet colour disappears and brown $MnO2$ precipitates.'], ['Tirpalas pasidaro žalias.', 'The solution turns green.'], ['Iškrenta baltos nuosėdos.', 'A white precipitate forms.'], ['Spalva nesikeičia.', 'The colour does not change.']],
          'Permanganatas redukuojasi, o etenas oksiduojasi.', 'Permanganate is reduced and ethene is oxidised.',
          '$KMnO4$ oksiduoja $C=C$ iki 1,2-diolio (etano-1,2-diolio), pats redukuodamasis į rudą $MnO2$.', '$KMnO4$ oxidises the $C=C$ to a 1,2-diol (ethane-1,2-diol) while being reduced to brown $MnO2$.'),
        ch('Ką įrodo abu bandymai (bromo vanduo ir permanganatas)?', 'What do the two tests (bromine water and permanganate) show together?',
          [['Dvigubo (arba trigubo) ryšio buvimą.', 'The presence of a double (or triple) bond.'], ['Alkoholio hidroksigrupės buvimą.', 'The presence of an alcohol hydroxyl group.'], ['Aromatinio žiedo buvimą.', 'The presence of an aromatic ring.'], ['Aldehido grupės buvimą.', 'The presence of an aldehyde group.']],
          'Abu reagentai prisijungia prie tos pačios struktūros.', 'Both reagents react with the same structural unit.',
          'Tai nesotumo (dvigubo ar trigubo ryšio) požymis.', 'These reactions are used to detect double and triple bonds.')
      ],
      why: t('Du spalvų bandymai kartu patvirtina nesotumą: bromo vandens išblukimas ir permanganato spalvos išnykimas su rudomis nuosėdomis.', 'Two colour tests together confirm unsaturation: the fading of bromine water and the loss of permanganate colour with brown precipitate.'),
      src: 'LW6 p1, p2'
    },
    {
      id: 'u11.lab.3',
      q: [{ p: t('Norima atpažinti, ar etanolis yra sausas. Į mėgintuvėlį su etanoliu įberiama baltų bevandenio vario sulfato miltelių.', 'You want to know whether an ethanol sample is dry. White powder of anhydrous copper sulfate is added to the test tube with the ethanol.') }],
      steps: [
        ch('Ką rodo miltelių pamėlynavimas?', 'What does it mean when the powder turns blue?',
          [['Etanolyje yra vandens: $CuSO4$ jį jungia ir sudaro mėlyną kristalohidratą.', 'The ethanol contains water: $CuSO4$ binds it and forms a blue crystal hydrate.'], ['Etanolis reagavo su $CuSO4$ ir susidarė alkoksidas.', 'The ethanol reacted with $CuSO4$ and formed an alkoxide.'], ['Etanolis oksidavosi.', 'The ethanol was oxidised.'], ['Susidarė kompleksas su $OH$ grupe.', 'A complex with the $OH$ group formed.']],
          'Bevandenė druska keičia spalvą, kai prisijungia vandenį.', 'The anhydrous salt changes colour when it takes up water.',
          'Balti $CuSO4$ milteliai su vandeniu sudaro melsvą kristalohidratą $CuSO4·5H2O$, todėl jais galima surišti vandenį iš etanolio ir gauti absoliutų etanolį.', 'White $CuSO4$ powder forms the blue crystal hydrate $CuSO4·5H2O$ with water, so it can bind the water from ethanol and give absolute ethanol.'),
        ch('Kodėl vandens iš etanolio negalima visiškai pašalinti paprasta distiliacija?', 'Why can the water not be removed from ethanol completely by simple distillation?',
          [['Etanolis su vandeniu sudaro azeotropą (95,5 % etanolio), kuris distiliuojasi nekeisdamas sudėties.', 'Ethanol forms an azeotrope with water (95.5 % ethanol) which distils without changing its composition.'], ['Vandens virimo temperatūra žemesnė už etanolio.', 'Water boils lower than ethanol.'], ['Etanolis ir vanduo reaguoja ir sudaro eterį.', 'Ethanol and water react to form an ether.'], ['Vandens negalima distiliuoti.', 'Water cannot be distilled.']],
          'Mišinio sudėtis garuose ir skystyje gali tapti vienoda.', 'The composition of the vapour and the liquid can become the same.',
          'Azeotropinio mišinio skystis ir garai turi vienodą sudėtį, todėl distiliuojantis jis nesikeičia. Visiškai sausas (absoliutus) etanolis gaunamas vandenį surišant chemiškai, pvz., su $CaO$.', 'The liquid and vapour of an azeotrope have the same composition, so it does not change on distillation. Fully dry (absolute) ethanol is obtained by binding the water chemically, for example with $CaO$.')
      ],
      why: t('Vandens pėdsakus etanolyje atpažįstame pagal bevandenio vario sulfato spalvą, o jam pašalinti reikia cheminio, ne distiliacijos, būdo.', 'Traces of water in ethanol are detected by the colour of anhydrous copper sulfate, and removing them takes a chemical method, not distillation.'),
      src: 'LW6 p1, p2; LW6 p4 (explanations)'
    },
    {
      id: 'u11.lab.4',
      q: [{ p: t('Natrio gabalėlis įmetamas į bevandenį etanolį, o mėgintuvėlis uždengiamas pirštu. Po kurio laiko prie angos priartinamas liepsnojantis degtukas.', 'A small piece of sodium goes into anhydrous ethanol and the tube is closed with a finger. After a while a flaming splint is brought to the opening.') }],
      steps: [
        ch('Kas matoma tirpale ir kas atsitinka prie degtuko?', 'What is seen in the liquid and what happens at the splint?',
          [['Gaunami dujų burbuliukai, o dujos sudega (vandenilis, su pokšėjimu).', 'Gas bubbles form, and the gas burns (hydrogen, with a pop).'], ['Tirpalas pasidaro oranžinis, degtukas užgęsta.', 'The liquid turns orange and the splint goes out.'], ['Susidaro dūmai, degtukas užgęsta nuo $CO2$.', 'Fumes form and the splint is put out by $CO2$.'], ['Nieko nepastebima.', 'Nothing is observed.']],
          'Kuris iš produktų yra dujos, ir kaip jis dega?', 'Which product is a gas, and how does it burn?',
          'Alkoholio protonas ir natrio elektronas sudaro vandenilį, kuris dega.', 'The proton of the alcohol and the electron of sodium make hydrogen, which burns.'),
        ch('Kodėl pastaboje sakoma, kad etanolis turi būti sausas?', 'Why must the ethanol be dry?',
          [['Natris reaguoja ir su vandeniu, todėl vandens priemaiša sudarytų $NaOH$ ir sugadintų stebėjimą.', 'Sodium also reacts with water, so a water impurity would give $NaOH$ and spoil the observation.'], ['Vanduo katalizuoja etanolio oksidaciją.', 'Water catalyses the oxidation of ethanol.'], ['Vanduo sudaro eterį su natriu.', 'Water forms an ether with sodium.'], ['Sausas etanolis neturi $OH$ grupės.', 'Dry ethanol has no $OH$ group.']],
          'Natris reaguoja su bet kuriuo rūgščiu protonu.', 'Sodium reacts with any acidic proton.',
          'Vanduo irgi turi $O-H$ ryšį ir su natriu reaguoja dar audringiau, todėl tik absoliutus etanolis rodo alkoholio reakciją.', 'Water also has an $O-H$ bond and reacts with sodium even more violently, so only absolute ethanol shows the reaction of the alcohol alone.')
      ],
      why: t('Metalo ir alkoholio bandymas rodo rūgščiąjį $O-H$ protoną: išsiskiria degantis vandenilis, o susidaro natrio etoksidas.', 'The test with the metal shows the acidic $O-H$ proton: hydrogen that burns is evolved and sodium ethoxide forms.'),
      src: 'LW6 p2; L11 p6'
    },
    {
      id: 'u11.lab.5',
      q: [{ p: t('Šviežiai nusodintas vario hidroksidas $Cu(OH)2$ (iš $CuSO4$ ir $NaOH$) pilamas į kelis skysčius.', 'Freshly precipitated copper hydroxide $Cu(OH)2$ (from $CuSO4$ and $NaOH$) is added to several liquids.') },
        { mol: [{ smi: 'CCO', caption: t('A', 'A') }, { smi: 'OCC(O)CO', caption: t('B', 'B') }, { smi: 'OCCCO', caption: t('C', 'C') }, { smi: 'OCCO', caption: t('D', 'D') }] }],
      steps: [
        {
          prompt: t('Su kuriais skysčiais susidaro ryškiai mėlynas tirpalas?', 'With which liquids does an intensely blue solution form?'),
          kind: 'multi', options: [tx('A', 'A'), tx('B', 'B'), tx('C', 'C'), tx('D', 'D')], answer: [1, 3],
          hint: t('Kompleksą sudaro dvi $OH$ grupės, prijungtos prie gretimų anglies atomų.', 'The complex is formed by two $OH$ groups on adjacent carbon atoms.'),
          solution: t('Glicerolis (B) ir etano-1,2-diolis (D) turi $OH$ prie gretimų atomų ir sudaro mėlyną kompleksą su $Cu^2+^$. Etanolis (A) ir 1,3-propandiolis (C) tokio komplekso nesudaro.', 'Glycerol (B) and ethane-1,2-diol (D) have $OH$ on adjacent carbons and form a blue complex with $Cu^2+^$. Ethanol (A) and 1,3-propanediol (C) do not.')
        }
      ],
      why: t('Reakcija su $Cu(OH)2$ atpažįsta gretimas hidroksigrupes: polialkoholius, angliavandenius ir $α$-aminorūgštis. Paprastas alkoholis jos neduoda.', 'The reaction with $Cu(OH)2$ detects adjacent hydroxyl groups: polyols, carbohydrates and $α$-amino acids. A simple alcohol does not give it.'),
      src: 'LW6 p2; LW6 p6 (explanations)'
    },
    {
      id: 'u11.lab.6',
      q: [{ p: t('Etanolis kaitinamas su rūgščiu kalio bichromato tirpalu, o kitame mėgintuvėlyje – su rūgščiu kalio permanganatu.', 'Ethanol is heated with an acidic potassium dichromate solution, and in another tube with acidic potassium permanganate.') }],
      steps: [
        ch('Kaip keičiasi tirpalų spalva?', 'How do the colours of the solutions change?',
          [['Bichromatas: oranžinis → žalias; permanganatas: violetinis → bespalvis.', 'Dichromate: orange → green; permanganate: violet → colourless.'], ['Bichromatas: žalias → oranžinis; permanganatas: bespalvis → violetinis.', 'Dichromate: green → orange; permanganate: colourless → violet.'], ['Bichromatas: oranžinis → mėlynas; permanganatas: violetinis → raudonas.', 'Dichromate: orange → blue; permanganate: violet → red.'], ['Abu išlieka nepakitę.', 'Both stay unchanged.']],
          'Oksidatoriai redukuojasi iki $Cr^3+^$ ir $Mn^2+^$ druskų.', 'The oxidants are reduced to $Cr^3+^$ and $Mn^2+^$ salts.',
          '$Cr(VI)$ virsta žaliu $Cr(III)$ sulfatu, o permanganatas – bespalviu $Mn(II)$ sulfatu (galimos rudos $MnO2$ nuosėdos).', '$Cr(VI)$ becomes green $Cr(III)$ sulfate and permanganate becomes colourless $Mn(II)$ sulfate (brown $MnO2$ may precipitate).'),
        chMol('Kuris junginys susidaro iš etanolio, kai oksidatoriaus yra pakankamai ir kaitinama?', 'Which compound forms from ethanol when enough oxidant is used and the mixture is heated?',
          ['CC(=O)O', 'CC=O', 'CCOCC', 'C=C'],
          'Su stipriu oksidatoriumi rūgščioje terpėje oksidacija nesustoja ties tarpiniu produktu.', 'With a strong oxidant in acid the oxidation does not stop at the intermediate.',
          'Etanolis oksiduojasi iki etanalio, o šis toliau iki etano rūgšties.', 'Ethanol is oxidised to ethanal and this further to ethanoic acid.')
      ],
      why: t('Spalvos pasikeitimas rodo, kad alkoholis oksiduojasi, o stipriu oksidatoriumi pirminis alkoholis nueina iki karboksirūgšties.', 'The colour change shows that the alcohol is being oxidised, and with a strong oxidant a primary alcohol goes all the way to the carboxylic acid.'),
      src: 'LW6 p2; L11 p22'
    },
    {
      id: 'u11.lab.7',
      q: [{ p: t('Du mėgintuvėliai: viename etanolis, kitame – 2-metil-2-propanolis. Į kiekvieną pilama rūgšti $K2Cr2O7$ tirpalo ir pašildoma.', 'Two test tubes: one with ethanol and one with 2-methyl-2-propanol. Acidic $K2Cr2O7$ solution is added to each, and the tubes are warmed.') },
        { mol: [{ smi: 'CCO', caption: t('A', 'A') }, { smi: 'CC(C)(C)O', caption: t('B', 'B') }] }],
      steps: [
        ch('Kuris mėgintuvėlis pažaliuos?', 'Which tube turns green?',
          [['Tik A.', 'Only A.'], ['Tik B.', 'Only B.'], ['Abu.', 'Both.'], ['Nė vienas.', 'Neither.']],
          'Kuris alkoholis turi vandenilį prie anglies su $OH$?', 'Which alcohol has a hydrogen on the carbon with the $OH$?',
          'Etanolis (pirminis) oksiduojasi ir bichromatas pažaliuoja. 2-Metil-2-propanolis (tretinis) neoksiduojasi, tirpalas lieka oranžinis.', 'Ethanol (primary) is oxidised and the dichromate turns green. 2-Methyl-2-propanol (tertiary) is not oxidised and the solution stays orange.'),
        ch('Ką šis bandymas parodo apie alkoholio klasę?', 'What does this test tell you about the class of the alcohol?',
          [['Tretinį alkoholį galima atskirti nuo pirminio ir antrinio.', 'A tertiary alcohol can be told apart from a primary or secondary one.'], ['Pirminį alkoholį galima atskirti nuo antrinio.', 'A primary alcohol can be told apart from a secondary one.'], ['Jis parodo, kiek anglies atomų yra molekulėje.', 'It shows how many carbon atoms the molecule has.'], ['Jis parodo, ar alkoholis tirpsta vandenyje.', 'It shows whether the alcohol dissolves in water.']],
          'Ieškokite alkoholio, kuris nereaguoja.', 'Look for the alcohol that does not react.',
          'Bichromatas atskiria tretinį (nereaguoja) nuo pirminio ir antrinio (reaguoja), bet pirminio nuo antrinio neatskiria, nes pasikeičia ta pati spalva.', 'Dichromate separates tertiary (no reaction) from primary and secondary (reaction), but not primary from secondary, since the colour change is the same.')
      ],
      why: t('Oksidacijos bandymas atskiria alkoholius, turinčius vandenilį prie anglies su $OH$, nuo tretinių.', 'The oxidation test separates alcohols that have a hydrogen on the carbon with the $OH$ from tertiary ones.'),
      src: 'LW6 p2; L11 p20, p22'
    },
    {
      id: 'u11.lab.8',
      q: [{ p: t('Susiekite bandymą su tuo, ką jis rodo alkoholio ar kito junginio atveju.', 'Match each test with what it shows.') }],
      steps: [{
        prompt: t('Suporuokite bandymus su stebėjimais.', 'Pair the tests with the observations.'),
        kind: 'match',
        answer: {
          left: [{ text: t('Alkoholis + natris', 'Alcohol + sodium') }, { text: t('Etenas + bromo vanduo', 'Ethene + bromine water') }, { text: t('Glicerolis + $Cu(OH)2$', 'Glycerol + $Cu(OH)2$') }, { text: t('Etanolis + rūgštus $K2Cr2O7$', 'Ethanol + acidic $K2Cr2O7$') }],
          right: [{ text: t('burbuliukai (vandenilis)', 'bubbles (hydrogen)') }, { text: t('geltona spalva išnyksta', 'the yellow colour fades') }, { text: t('ryškiai mėlynas kompleksas', 'an intensely blue complex') }, { text: t('oranžinis → žalias', 'orange → green') }],
          pairs: [0, 1, 2, 3]
        },
        hint: t('Kiekvienas bandymas atpažįsta kitą funkcinę grupę ar jos reakciją.', 'Each test detects a different functional group or reaction.'),
        solution: t('Natris – rūgščiojo $O-H$ požymis (vandenilis); bromo vanduo – $C=C$; $Cu(OH)2$ – gretimos $OH$ grupės; bichromatas – oksiduojamas alkoholis.', 'Sodium – the acidic $O-H$ (hydrogen); bromine water – $C=C$; $Cu(OH)2$ – adjacent $OH$ groups; dichromate – an oxidisable alcohol.')
      }],
      why: t('Kiekviena funkcinė grupė turi savo spalvų ar dujų požymį, todėl keli paprasti bandymai leidžia ją atpažinti.', 'Each functional group has its own colour or gas sign, so a few simple tests are enough to identify it.'),
      src: 'LW6 p1, p2'
    }
  ];

  const bank = (id, title, mirrors, list) => ({ id, title, mirrors, bank: list });
  const TYPES = TYPES_GEN.concat([
    bank('u11.hb', t('Vandeniliniai ryšiai, virimo temperatūra ir tirpumas', 'Hydrogen bonds, boiling point and solubility'), [], HB),
    bank('u11.acidwhy', t('Alkoholių rūgštingumas ir alkoksidų bazingumas', 'Acidity of alcohols and basicity of alkoxides'), [], ACID),
    bank('u11.oxwhy', t('Oksidacija: kodėl ir kaip', 'Oxidation: why and how'), [], OXW),
    bank('u11.lab', t('Alkoholių bandymai 6 laboratoriniame darbe', 'The alcohol tests of lab 6'), [], LAB)
  ]);

  ORG.unit({
    id: 'u11',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S5.3': ['u11.acid'],
      'S5.4': ['u11.elim'],
      'S5.7': ['u11.ox'],
      'S5.12': ['u11.react4', 'u11.hx', 'u11.elim', 'u11.ox', 'u11.acid'],
      'S5.15': ['u11.chain'],
      'S5.16': ['u11.multi']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
