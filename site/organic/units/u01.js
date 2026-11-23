// site/organic/units/u01.js: unit 1, formulas, classification and nomenclature
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });
  const tx = (lt, en) => ({ text: t(lt, en) });
  const mo = (smi, opts) => ({ mol: opts ? { smi, opts } : { smi } });

  /* ---------- helpers ---------- */
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const formulaOf = (ctx, s) => ctx.chem.formulaString(ctx.chem.parse(s));
  const nameOf = (ctx, smi) => {
    const lt = ctx.name.name(smi, { lang: 'lt' }), en = ctx.name.name(smi, { lang: 'en' });
    return lt && en ? { lt: lt.name, en: en.name } : null;
  };
  // a drawing without overlaps, crossings or label clashes
  const clean = (ctx, smi, opts) => { const m = ctx.chem.parse(smi); const lay = ctx.draw.layout(m, opts || {}); const q = ctx.draw.quality(m, lay.pos, opts || {}); return q.overlaps + q.crossings + q.labelClashes === 0; };
  const dedupe = (ctx, arr) => { const seen = new Set(); return arr.filter((s) => { const k = canon(ctx, s); if (seen.has(k)) return false; seen.add(k); return true; }); };

  // functional groups of the course: labels, symbol, rank in the seniority list (L1 p52)
  const G = {
    acid: { lt: 'karboksirūgštis', en: 'carboxylic acid', sym: '–COOH', rank: 1 },
    sulfonic: { lt: 'sulfonrūgštis', en: 'sulfonic acid', sym: '–SO3H', rank: 2 },
    carboxylate: { lt: 'karboksirūgšties druska', en: 'carboxylate (salt)', sym: '–COOM', rank: 3 },
    anhydride: { lt: 'anhidridas', en: 'anhydride', sym: '–(CO)2O', rank: 4 },
    ester: { lt: 'esteris', en: 'ester', sym: '–COOR', rank: 5 },
    acylhalide: { lt: 'rūgšties halogenanhidridas', en: 'acyl halide', sym: '–COX', rank: 6 },
    amide: { lt: 'amidas', en: 'amide', sym: '–CONH2', rank: 7 },
    nitrile: { lt: 'nitrilas', en: 'nitrile', sym: '–C≡N', rank: 8 },
    aldehyde: { lt: 'aldehidas', en: 'aldehyde', sym: '–CHO', rank: 9 },
    ketone: { lt: 'ketonas', en: 'ketone', sym: 'C=O', rank: 10 },
    alcohol: { lt: 'alkoholis', en: 'alcohol', sym: '–OH', rank: 11 },
    phenol: { lt: 'fenolis', en: 'phenol', sym: 'Ar–OH', rank: 12 },
    thiol: { lt: 'tiolis', en: 'thiol', sym: '–SH', rank: 13 },
    amine: { lt: 'aminas', en: 'amine', sym: '–NH2', rank: 14 },
    alkene: { lt: 'alkenas', en: 'alkene', sym: 'C=C', rank: 15 },
    alkyne: { lt: 'alkinas', en: 'alkyne', sym: 'C≡C', rank: 16 },
    halide: { lt: 'halogenidas', en: 'halide', sym: '–Hal', rank: 30 },
    ether: { lt: 'eteris', en: 'ether', sym: '–OR', rank: 31 },
    sulfide: { lt: 'sulfidas', en: 'sulfide', sym: '–SR', rank: 32 },
    nitro: { lt: 'nitrojunginys', en: 'nitro compound', sym: '–NO2', rank: 33 },
    arene: { lt: 'aromatinis žiedas (arenas ar heteroarenas)', en: 'aromatic ring (arene or heteroarene)', sym: '', rank: 40 },
    alkane: { lt: 'alkanas (cikloalkanas)', en: 'alkane (cycloalkane)', sym: '', rank: 50 }
  };
  const gkey = (type) => (/^amine/.test(type) ? 'amine' : type);
  const gLabel = (k) => { const g = G[k]; return t(g.lt + (g.sym ? ' ($' + g.sym + '$)' : ''), g.en + (g.sym ? ' ($' + g.sym + '$)' : '')); };
  // classes with the three kinds of amine kept apart
  const CLS = {
    amine1: { lt: 'pirminis aminas', en: 'primary amine' }, amine2: { lt: 'antrinis aminas', en: 'secondary amine' }, amine3: { lt: 'tretinis aminas', en: 'tertiary amine' },
    alkene: { lt: 'alkenas (ir cikloalkenas)', en: 'alkene (or cycloalkene)' }, halide: { lt: 'halogenidas (halogeno darinys)', en: 'halide (halogen compound)' },
    alkane: { lt: 'alkanas (cikloalkanas)', en: 'alkane (cycloalkane)' }
  };
  const clsLabel = (k) => { const c = CLS[k] || G[k]; return t(c.lt, c.en); };
  const CLS_ORDER = ['acid', 'sulfonic', 'carboxylate', 'anhydride', 'ester', 'acylhalide', 'amide', 'nitrile', 'aldehyde', 'ketone', 'alcohol', 'phenol', 'thiol',
    'amine1', 'amine2', 'amine3', 'alkene', 'alkyne', 'halide', 'ether', 'sulfide', 'nitro', 'arene'];
  const CONFUSE = {
    alkane: ['alkene', 'alkyne', 'arene'], alkene: ['alkane', 'alkyne', 'arene'], alkyne: ['alkene', 'alkane', 'nitrile'], arene: ['alkene', 'phenol', 'alkane'],
    halide: ['alcohol', 'alkane', 'ether'], alcohol: ['ether', 'phenol', 'thiol'], phenol: ['alcohol', 'arene', 'ether'], thiol: ['alcohol', 'sulfide', 'amine1'],
    sulfide: ['thiol', 'ether', 'alcohol'], ether: ['alcohol', 'ester', 'sulfide'], amine1: ['amine2', 'amide', 'alcohol'], amine2: ['amine1', 'amine3', 'amide'],
    amine3: ['amine2', 'amide', 'amine1'], aldehyde: ['ketone', 'alcohol', 'acid'], ketone: ['aldehyde', 'ester', 'alcohol'], acid: ['ester', 'aldehyde', 'alcohol'],
    ester: ['acid', 'ether', 'ketone'], amide: ['amine1', 'nitrile', 'ketone'], nitrile: ['amide', 'alkyne', 'amine1'], acylhalide: ['halide', 'acid', 'anhydride'],
    anhydride: ['ester', 'acid', 'acylhalide'], carboxylate: ['acid', 'ester', 'amide'], sulfonic: ['acid', 'sulfide', 'thiol'], nitro: ['amine1', 'nitrile', 'halide']
  };
  const typesOf = (ctx, smi) => Array.from(new Set(ctx.chem.groups(ctx.chem.parse(smi)).map((g) => g.type)));
  // the class by the course's seniority (L1 p52): the senior group, prefix-only groups next, then the ring
  const classKey = (ctx, smi) => { const s = new Set(typesOf(ctx, smi)); for (const k of CLS_ORDER) if (s.has(k)) return k; return 'alkane'; };
  const groupKeys = (ctx, smi) => Array.from(new Set(typesOf(ctx, smi).map(gkey))).sort((a, b) => G[a].rank - G[b].rank);
  const listLt = (keys) => keys.map((k) => G[k].lt).join(', ');
  const listEn = (keys) => keys.map((k) => G[k].en).join(', ');
  const cCount = (m) => m.atoms.filter((a) => a.el === 'C').length;
  // the atom counts of a formula in words: C – 9, H – 8, O – 4
  const atomCounts = (ctx, smi) => { const fo = ctx.chem.formula(ctx.chem.parse(smi)); const ks = Object.keys(fo).sort((a, b) => (a === 'C' ? -1 : b === 'C' ? 1 : a === 'H' ? -1 : b === 'H' ? 1 : a < b ? -1 : 1)); return ks.map((k) => k + ' – ' + fo[k]).join(', '); };

  // right option first, then the wrong ones (the trainer shuffles)
  function classOptions(right, extra) {
    const out = [right];
    (CONFUSE[right] || []).concat(extra || []).forEach((k) => { if (out.indexOf(k) < 0 && out.length < 4) out.push(k); });
    return out;
  }
  const classStep = (key, prompt) => {
    const opts = classOptions(key, ['alkane', 'alcohol', 'ester', 'amine1']);
    return {
      prompt: prompt || t('Kuriai organinių junginių klasei priklauso šis junginys?', 'Which class of organic compounds does this compound belong to?'),
      kind: 'choice', options: opts.map((k) => ({ text: clsLabel(k) })), answer: 0,
      hint: t('Raskite funkcinę grupę: atomus ar ryšius, kurie nėra paprasti $C-C$ ir $C-H$ ryšiai. Jei grupių keli, klasę lemia vyriausioji.', 'Find the functional group: the atoms or bonds beyond plain $C-C$ and $C-H$ bonds. If there are several, the senior one decides the class.'),
      solution: t('Šio junginio klasė: ' + clsLabel(key).lt + '.', 'The class of this compound: ' + clsLabel(key).en + '.')
    };
  };
  const nameHint = t('Raskite vyriausiąją funkcinę grupę (ji duoda priesagą), pagrindinę grandinę ar žiedą, sunumeruokite taip, kad grupė ar pakaitai gautų mažiausius numerius, ir pakaitus išvardykite abėcėlės tvarka.',
    'Find the senior functional group (it gives the suffix), the main chain or ring, number it so the group or substituents get the lowest numbers, and list the substituents alphabetically.');
  function nameStep(ctx, smi, prompt) {
    const n = nameOf(ctx, smi);
    if (!n) return null;
    const keys = groupKeys(ctx, smi).filter((k) => k !== 'alkane' && k !== 'arene');
    const top = keys.filter((k) => G[k].rank < 30)[0];
    const pre = keys.filter((k) => G[k].rank >= 30);
    let lt, en;
    if (!keys.length) { lt = 'Funkcinių grupių nėra: pavadinimą lemia grandinė ar žiedas ir pakaitai.'; en = 'There is no functional group: the chain or ring and the substituents decide the name.'; }
    else if (top) {
      lt = 'Funkcinės grupės: ' + listLt(keys) + '. Vyriausioji: ' + G[top].lt + ' – ji nusako priesagą ar galūnę' + (keys.length > 1 ? ', kitos grupės eina priešdėliais' : '') + '.';
      en = 'Functional groups: ' + listEn(keys) + '. Senior: ' + G[top].en + ' – it gives the suffix or ending' + (keys.length > 1 ? ', the other groups are written as prefixes' : '') + '.';
    } else {
      lt = 'Funkcinės grupės: ' + listLt(pre) + '. Jos pavadinime rašomos tik priešdėliais, todėl šaknį duoda angliavandenilis (alkanas ar arenas), o grupės tampa pakaitais.';
      en = 'Functional groups: ' + listEn(pre) + '. They are written in a name only as prefixes, so the root comes from a hydrocarbon (alkane or arene) and the groups become substituents.';
    }
    return {
      prompt: prompt || t('Pavadinkite junginį pagal IUPAC nomenklatūrą.', 'Name the compound by IUPAC nomenclature.'),
      kind: 'name', mol: { smi }, answer: { smi }, hint: nameHint,
      solution: t(lt + ' Visas pavadinimas: ' + n.lt + '.', en + ' Name: ' + n.en + '.')
    };
  }
  /* ---------- pools of compounds (SMILES) ---------- */
  // constitutional isomers by formula: every member must be named by the namer; used for formulas and for name <-> structure
  const ISO = [
    ['CCCO', 'CC(C)O', 'CCOC'],
    ['CCCCO', 'CCC(C)O', 'CC(C)CO', 'CC(C)(C)O', 'CCOCC', 'CCCOC', 'CC(C)OC'],
    ['CCCC=O', 'CCC(C)=O', 'CC(C)C=O', 'CC=CCO', 'C=CC(C)O'],
    ['CCCCC=O', 'CCCC(C)=O', 'CCC(=O)CC', 'CC(C)CC=O', 'CC(C)C(C)=O', 'CCC(C)C=O'],
    ['CCCC(O)=O', 'CC(C)C(O)=O', 'CCOC(C)=O', 'COC(=O)CC', 'CCCOC=O', 'CC(C)OC=O'],
    ['CCCCC(O)=O', 'CC(C)CC(O)=O', 'CCCOC(C)=O', 'CCOC(=O)CC', 'COC(=O)CCC', 'CC(C)OC(C)=O', 'CCCCOC=O'],
    ['CCCN', 'CC(C)N', 'CCNC', 'CN(C)C'],
    ['CCCCN', 'CCC(C)N', 'CC(C)CN', 'CC(C)(C)N', 'CCNCC', 'CCCNC', 'CCN(C)C', 'CC(C)NC'],
    ['CCC(O)=O', 'COC(C)=O', 'CCOC=O'],
    ['CCCCBr', 'CCC(C)Br', 'CC(C)CBr', 'CC(C)(C)Br'],
    ['CCCCCCl', 'CCCC(C)Cl', 'CCC(Cl)CC', 'CC(C)CCCl', 'CC(C)C(C)Cl', 'CCC(C)CCl'],
    ['CCCCCC', 'CC(C)CCC', 'CCC(C)CC', 'CC(C)(C)CC', 'CC(C)C(C)C'],
    ['CCCCCCC', 'CC(C)CCCC', 'CCC(C)CCC', 'CC(C)(C)CCC', 'CC(C)C(C)CC', 'CC(C)CC(C)C', 'CCC(C)(C)CC', 'CCC(CC)CC', 'CC(C)C(C)(C)C'],
    ['CCCCC=C', 'CCCC=CC', 'CCC=CCC', 'CC(C)CC=C', 'CC(C)C=CC', 'CCC(C)C=C', 'CC(C)=CCC', 'C=C(C)CCC'],
    ['C#CCC', 'CC#CC', 'C=CC=C'],
    ['C#CCCC', 'CC#CCC', 'C#CC(C)C', 'C=CCC=C', 'CC=CC=C'],
    ['CCc1ccccc1', 'Cc1ccccc1C', 'Cc1cccc(C)c1', 'Cc1ccc(C)cc1'],
    ['OCc1ccccc1', 'Cc1ccccc1O', 'Cc1cccc(O)c1', 'Cc1ccc(O)cc1', 'COc1ccccc1'],
    ['CCCC(N)=O', 'CC(C)C(N)=O', 'CCC(=O)NC', 'CC(=O)N(C)C', 'CC(=O)NCC'],
    ['CCCS', 'CC(C)S', 'CCSC'],
    ['CC1CCCC1', 'C1CCCCC1', 'CCC1CCC1']
  ];

  // names are the course's trivial names (captions only)
  const DRUGS = [
    ['CC(=O)Oc1ccccc1C(O)=O', 'acetilsalicilo rūgštis (aspirinas)', 'acetylsalicylic acid (aspirin)'],
    ['CC(=O)Nc1ccc(O)cc1', 'paracetamolis', 'paracetamol'],
    ['CC(C)c1cccc(C(C)C)c1O', 'propofolis', 'propofol'],
    ['CC(C)Cc1ccc(cc1)C(C)C(O)=O', 'ibuprofenas', 'ibuprofen'],
    ['CC(C)NCC(O)COc1ccc(CC(N)=O)cc1', 'atenololis', 'atenolol'],
    ['CCOC(=O)C(CCc1ccccc1)NC(C)C(=O)N1CCCC1C(O)=O', 'enalaprilis', 'enalapril'],
    ['CC(C)=CCCC(C)=CCO', 'geraniolis', 'geraniol'],
    ['C=CCc1ccc(O)c(OC)c1', 'eugenolis', 'eugenol'],
    ['COc1cc(C=O)ccc1O', 'vanilinas', 'vanillin'],
    ['O=CC=Cc1ccccc1', 'cinamono aldehidas', 'cinnamaldehyde'],
    ['CNCC(O)c1ccc(O)c(O)c1', 'adrenalinas', 'adrenaline'],
    ['CCN(CC)CC(=O)Nc1c(C)cccc1C', 'lidokainas', 'lidocaine'],
    ['CC1(C)SC2C(NC(=O)C(N)c3ccc(O)cc3)C(=O)N2C1C(O)=O', 'amoksicilinas', 'amoxicillin'],
    ['NC(Cc1c[nH]c2ccccc12)C(O)=O', 'triptofanas', 'tryptophan'],
    ['CN1CCCC1c1cccnc1', 'nikotinas', 'nicotine'],
    ['NCCc1ccc(O)c(O)c1', 'dopaminas', 'dopamine'],
    ['CC(N)Cc1ccccc1', 'amfetaminas', 'amphetamine'],
    ['CNC(C)C(O)c1ccccc1', 'efedrinas', 'ephedrine'],
    ['CCOC(=O)c1ccc(N)cc1', 'benzokainas', 'benzocaine'],
    ['COC(=O)c1ccccc1O', 'metilsalicilatas', 'methyl salicylate'],
    ['CC(C)C1CCC(C)CC1O', 'mentolis', 'menthol'],
    ['CC(C)=CCCC(C)=CC=O', 'citralis', 'citral'],
    ['CC1=CCC(CC1=O)C(C)=C', 'karvonas', 'carvone'],
    ['COc1cc(CNC(=O)CCCCC=CC(C)C)ccc1O', 'kapsaicinas', 'capsaicin'],
    ['Cc1ccc(C(C)C)c(O)c1', 'timolis', 'thymol'],
    ['CCN(CC)CCOC(=O)c1ccc(N)cc1', 'prokainas', 'procaine'],
    ['CCOc1ccc(NC(C)=O)cc1', 'fenacetinas', 'phenacetin'],
    ['COC(=O)C(Cc1ccccc1)NC(=O)C(N)CC(O)=O', 'aspartamas', 'aspartame'],
    ['OCC(O)C(O)C(O)C(O)C=O', 'gliukozė (atvirosios grandinės forma)', 'glucose (open-chain form)'],
    ['NC(Cc1ccc(O)cc1)C(O)=O', 'tirozinas', 'tyrosine'],
    ['NC(CCC(O)=O)C(O)=O', 'glutamo rūgštis', 'glutamic acid'],
    ['NCCCCC(N)C(O)=O', 'lizinas', 'lysine'],
    ['CC(O)C(N)C(O)=O', 'treoninas', 'threonine'],
    ['NCCCC(O)=O', 'γ-aminosviesto rūgštis (GABA)', 'γ-aminobutyric acid (GABA)']
  ];
  // biomolecules for the molecular formula: kekulé SMILES
  const BIO = [
    ['CC1=CNC(=O)NC1=O', 'timinas', 'thymine'],
    ['NC1=NC2=C(NC=N2)C(=O)N1', 'guaninas', 'guanine'],
    ['O=C1C=CNC(=O)N1', 'uracilas', 'uracil'],
    ['NC1=NC(=O)NC=C1', 'citozinas', 'cytosine'],
    ['NC1=C2N=CNC2=NC=N1', 'adeninas', 'adenine'],
    ['CN1C=NC2=C1C(=O)N(C)C(=O)N2C', 'kofeinas', 'caffeine'],
    ['OCC(O)C1OC(=O)C(O)=C1O', 'vitaminas C (askorbo rūgštis)', 'vitamin C (ascorbic acid)'],
    ['SCC(N)C(O)=O', 'cisteinas', 'cysteine'],
    ['NCC(O)=O', 'glicinas', 'glycine'],
    ['CC(N)C(O)=O', 'alaninas', 'alanine'],
    ['NC(Cc1ccccc1)C(O)=O', 'fenilalaninas', 'phenylalanine'],
    ['OC(=O)CC(O)(CC(O)=O)C(O)=O', 'citrinų rūgštis', 'citric acid']
  ];

  const HC = ['CCC(C)CCC', 'CC(C)CC(C)C', 'CCC(CC)CC', 'CC(C)(C)CC(C)C', 'CCC(C)C(C)CC', 'CC(C)C(C)C(C)C', 'CCCC(C)(C)CC', 'CC(C)CCC(C)C',
    'CCC(CC)C(C)C', 'CCCC(CC)CCC', 'CCC(C)(CC)CC', 'CC(C)(C)C(C)C', 'CCCCC(C)CC', 'CC(C)(C)CCC', 'CCC(C)CCCC',
    'CC=C(C)C', 'CC(C)=CCC', 'CCC=CC', 'C=CC(C)C', 'CC(C)CC=C', 'CCC(=C)C', 'CC=CC(C)C', 'C=C(C)C(C)C', 'CCC(C)=CC', 'CC(C)=C(C)C',
    'CCCC=C', 'C=CC=C', 'CC=CC=C', 'C=CCC=C',
    'CC#CC', 'C#CC(C)C', 'CC#CC(C)C', 'C#CCCC', 'CC#CCC', 'C#CC(C)(C)C', 'CCC#CCC',
    'CC1CCCC1', 'CC1CCCCC1', 'CCC1CCCCC1', 'CC1CCC(C)CC1', 'CC1CCCC(C)C1', 'CC(C)C1CCCCC1', 'CC1CCCC1C', 'CC1=CCCCC1', 'C1=CCCCC1', 'CC1CC=CCC1',
    'CCc1ccccc1', 'Cc1ccccc1C', 'Cc1cccc(C)c1', 'Cc1ccc(C)cc1', 'CCc1ccc(C)cc1', 'Cc1cccc(CC)c1', 'CC(C)c1ccccc1', 'Cc1ccc(C(C)C)cc1', 'CCc1ccccc1CC'];

  const HET = ['CCCCl', 'CC(C)Br', 'CC(C)(C)Cl', 'CC(C)CCl', 'CCC(C)Br', 'ClCCl', 'BrCCBr', 'CC(Cl)Cl', 'CCCCCI', 'CC(C)CCI', 'CCC(C)(C)Br', 'ClC(Cl)Cl',
    'CCCO', 'CC(C)O', 'CC(C)CO', 'CCC(C)O', 'CC(C)(C)O', 'CCCCO', 'CC(O)CC(C)C', 'OC1CCCCC1', 'CC1CCCCC1O', 'OCCCO', 'CC(O)C(C)O', 'OCCO', 'CCC(O)CC', 'CC(C)CCO',
    'COC', 'CCOC', 'CCOCC', 'CCOC(C)C', 'COCCC', 'COC(C)(C)C', 'CCOCCC', 'COC(C)C',
    'CCS', 'CCCS', 'CC(C)S', 'CSC', 'CCSC', 'SC1CCCC1', 'Sc1ccccc1', 'CCCSC', 'CC(C)SC', 'SCCS'];

  const AMINES = ['CCN', 'CCCN', 'CC(C)N', 'CCNC', 'CN(C)C', 'CCN(C)C', 'CCNCC', 'CCCNC', 'CC(C)NC', 'NCCCCN', 'NCCCN', 'Nc1ccccc1', 'CCN(CC)c1ccccc1', 'NCc1ccccc1',
    'Cc1ccc(N)cc1', 'CC(C)CN', 'NC1CCCCC1', 'CN(C)C1CCCCC1', 'Nc1ccc(cc1N)C(O)=O', 'CCCN(C)C', 'CC(C)(C)N', 'CC(C)N(C)C', 'CCCCNC', 'CCN(CC)CC',
    'CNc1ccccc1', 'Cc1cccc(N)c1', 'NCCN', 'CCCCCN', 'CCC(C)NC', 'CCCNCC'];

  // derivatives of carboxylic acids, carbonyl compounds, nitriles
  const ACYL = ['CCC(O)=O', 'CCCC(O)=O', 'CC(C)C(O)=O', 'CC(C)CC(O)=O', 'CCCCC(O)=O', 'OC(=O)CC(C)CC(O)=O', 'OC(=O)CCCCC(O)=O', 'OC(=O)C1CCCCC1', 'OC(=O)C1=CCCC1',
    'OC(=O)c1ccccc1', 'Cc1ccc(cc1)C(O)=O', 'OC(=O)CCl', 'CC(C)(C)C(O)=O', 'OC(=O)CCC(O)=O', 'OC(=O)CC(O)=O', 'CC(O)=O', 'OC=O',
    'CCC([O-])=O.[Na+]', 'O=C([O-])C1CCCCC1.[K+]', 'CC([O-])=O.[Na+]', 'CCCC([O-])=O.[K+]', 'O=C([O-])c1ccccc1.[Na+]',
    'CCOC(=O)CCC', 'COC(=O)CCC', 'CC(=O)OCC', 'CC(=O)OCCC', 'CCC(=O)OC', 'CC(=O)OC(C)C', 'CC(=O)OCCC(C)C', 'CCCC(=O)OCC', 'COC(=O)c1ccccc1', 'CCOC(=O)c1ccccc1',
    'CC(=O)OCCCC', 'COC(=O)C=C', 'CC(=O)OC=C', 'CCCCCC(=O)OC', 'COC(=O)CCCC',
    'CC(N)=O', 'CCC(N)=O', 'CCCC(N)=O', 'CC(C)C(N)=O', 'NC(=O)C1CCCCC1', 'CNC(=O)CC', 'CN(C)C(C)=O', 'CCNC(C)=O', 'NC(=O)c1ccccc1', 'CN(C)C=O', 'CC(C)NC(C)=O',
    'CC#N', 'CCC#N', 'CCCC#N', 'CC(C)C#N', 'N#CC1CCCCC1', 'N#Cc1ccccc1', 'CC(C)CC#N', 'CCC(C)CC#N', 'Sc1cccc(C#N)c1',
    'CC(Cl)=O', 'CCC(Cl)=O', 'O=C(Cl)c1ccccc1', 'O=C(Br)c1ccccc1', 'CC(C)C(Cl)=O', 'CCCC(Br)=O',
    'CC(=O)OC(C)=O', 'CCC(=O)OC(=O)CC'];

  const CARB = ['C=O', 'CC=O', 'CCC=O', 'CCCC=O', 'CC(C)C=O', 'O=CC1CCCCC1', 'O=Cc1ccccc1', 'CC(C)=O', 'CCC(C)=O', 'CCC(=O)CC', 'CC(C)C(C)=O', 'CCCC(C)=O',
    'O=C1CCCC1', 'O=C1CCCCC1', 'CC1CCCCC1=O', 'CC(=O)c1ccccc1', 'CC(C)=CC(C)=O', 'O=Cc1cccc(C)c1', 'Cc1ccc(C=O)cc1', 'CCCCC=O', 'CC(C)CC=O', 'CC(=O)CCCC'];

  // polyfunctional compounds: the senior group gives the suffix
  const POLY = ['OCCC(O)=O', 'CC(O)CC(O)=O', 'NCC(O)=O', 'CC(N)C(O)=O', 'SCC(N)C(O)=O', 'OCC(N)C(O)=O', 'NCCCC(O)=O', 'NC(CCC(O)=O)C(O)=O', 'CC(=O)CC(O)=O', 'O=CCC(O)=O',
    'O=CC(O)=O', 'OC(=O)CC(Br)C(O)=O', 'CC(Cl)C(O)=O', 'OC(=O)C=CC(O)=O', 'CC=CC(O)=O', 'OC(=O)C(O)C(O)C(O)=O', 'NCCO', 'CC(N)CO', 'OCCCl', 'C=CCO', 'CC(O)C=C', 'OCC#C',
    'CC(=O)CCO', 'O=CCCO', 'CC(O)CC=O', 'OCC(O)C(O)C(O)C(O)C=O', 'N#CCC(O)=O', 'CCOC(=O)CC(C)=O', 'COC(=O)CCC(C)=O', 'CC(=O)C=C', 'C=CC=O', 'NCCC(N)=O', 'OCCC(N)=O',
    'ClCC(Cl)=O', 'NCCS', 'SCCO', 'O=C1CCC(O)CC1', 'NC1CCC(O)CC1', 'Nc1ccc(cc1)C(O)=O', 'Oc1ccccc1C(O)=O', 'O=Cc1ccc(O)cc1', 'Nc1ccc(cc1)S(O)(=O)=O', 'OC(=O)c1ccc(cc1)S(O)(=O)=O',
    'N#Cc1ccc(cc1)C(O)=O', 'Nc1ccc(O)cc1', 'COC(=O)c1ccccc1OC', 'CC(C)C(Cl)C(C)=C', 'CC(O)CC#CC', 'CC(O)C(C)CC#C', 'O=CC1CCC(O)C(=O)C1', 'N#Cc1ccc(C=O)cc1', 'OC(=O)C1CCC(CC1)C(N)=O',
    'CC(C)(O)CC(O)=O', 'NC(=O)CC(O)CC(N)=O', 'CC(=O)CC(=O)OC', 'ClCCCC(O)=O', 'OCC(O)CC=O', 'CCC(O)C(O)=O', 'C=CCC(=O)CC', 'OCC(O)=O', 'CC(C)(S)CCO'];

  // classification by the type of the carbon chain: [smi, ring (0 none, 1 carbo, 2 hetero), saturation (0 saturated, 1 unsaturated, 2 aromatic), class key or null]
  const CHAINS = [
    ['CCCC', 0, 0, 'alkane'], ['CC(C)CC', 0, 0, 'alkane'], ['CCCCCC', 0, 0, 'alkane'], ['CCCO', 0, 0, 'alcohol'], ['CCCCCl', 0, 0, 'halide'], ['CCCN', 0, 0, 'amine1'], ['CC(C)SC', 0, 0, 'sulfide'],
    ['CC=C', 0, 1, 'alkene'], ['CC#C', 0, 1, 'alkyne'], ['C=CCC=C', 0, 1, 'alkene'], ['CC=CCO', 0, 1, 'alcohol'], ['C=CCCl', 0, 1, 'alkene'], ['CC#CC', 0, 1, 'alkyne'], ['C=CC=C', 0, 1, 'alkene'],
    ['C1CCCC1', 1, 0, 'alkane'], ['CC1CCCCC1', 1, 0, 'alkane'], ['OC1CCCCC1', 1, 0, 'alcohol'], ['NC1CCCCC1', 1, 0, 'amine1'], ['ClC1CCCC1', 1, 0, 'halide'], ['C1CC1', 1, 0, 'alkane'], ['C1CCCCCCC1', 1, 0, 'alkane'],
    ['C1=CCCCC1', 1, 1, 'alkene'], ['C1=CCCC1', 1, 1, 'alkene'], ['CC1=CCCCC1', 1, 1, 'alkene'], ['C1=CC=CCC1', 1, 1, 'alkene'], ['OC1C=CCCC1', 1, 1, 'alcohol'],
    ['c1ccccc1', 1, 2, 'arene'], ['Cc1ccccc1', 1, 2, 'arene'], ['Oc1ccccc1', 1, 2, 'phenol'], ['Nc1ccccc1', 1, 2, 'amine1'], ['c1ccc2ccccc2c1', 1, 2, 'arene'], ['OC(=O)c1ccccc1', 1, 2, 'acid'],
    ['C1CCOC1', 2, 0, 'ether'], ['C1CCNCC1', 2, 0, 'amine2'], ['C1CCNC1', 2, 0, 'amine2'], ['C1CCOCC1', 2, 0, 'ether'], ['C1CCSC1', 2, 0, 'sulfide'],
    ['C1=CNCC1', 2, 1, 'amine2'], ['C1=COCCC1', 2, 1, 'alkene'], ['C1=COCC1', 2, 1, 'alkene'],
    ['c1ccoc1', 2, 2, null], ['c1ccsc1', 2, 2, null], ['c1cc[nH]c1', 2, 2, null], ['c1ccncc1', 2, 2, null], ['c1cncnc1', 2, 2, null], ['c1c[nH]cn1', 2, 2, null]
  ];

  const LONE = ['COC', 'CC(N)=O', 'CC(Cl)=O', 'CCS', 'CC(O)=O', 'CC#N', 'CCO', 'CN', 'CNC', 'CCCl', 'CC(C)=O', 'C=O', 'CCOC(C)=O', 'NCCO', 'CCSC', 'NC(N)=O',
    'CC(=O)OC(C)=O', 'O=C(Cl)c1ccccc1', 'OC(=O)c1ccccc1', 'CCN(CC)CC', 'CC(=O)N(C)C', 'ClCCCl', 'CCC#N', 'Sc1ccccc1', 'CCBr', 'CI', 'CCCCO', 'CC(C)OC', 'CCCC#N', 'CCCS',
    'CC(=O)Cl', 'CCC(N)=O', 'CCCN', 'CCC(O)=O', 'O=Cc1ccccc1', 'CCCC=O'];

  // carbon classes: alkanes with several kinds of carbon
  const CARBS = ['CCC(CC)CC(C)(C)C', 'CC(C)CC(C)(C)C', 'CCC(C)C(C)(C)C', 'CC(C)(C)C(C)C', 'CC(C)C(C)C', 'CCC(C)(C)CC', 'CC(C)CCC(C)(C)C', 'CCCC(C)(CC)C', 'CCC(CC)C(C)(C)C',
    'CC(C)C(C)(C)CC', 'CCC(C)CC', 'CC(C)CC', 'CC(C)(C)C', 'CCC(C)C(C)CC', 'CC(C)(C)CC(C)C', 'CC(C)C(C)C(C)C', 'CCCC(C)(C)CC', 'CCC(CC)CC', 'CC(C)(C)C(C)(C)C', 'CCC(C)(C)C(C)C',
    'CC(C)CCC(C)C', 'CCC(CC)C(C)C', 'CCCC(CC)CCC', 'CCC(C)(CC)CC', 'CC(C)(C)CCC', 'CCCCC(C)CC', 'CCCCCC', 'CC(C)CCC', 'CCC(C)CCC', 'CC(C)(C)CC'];

  // alkanes with the same formula for the choice by a description of the carbons
  const ALK = [
    ['CCCCCC', 'CC(C)CCC', 'CCC(C)CC', 'CC(C)(C)CC', 'CC(C)C(C)C'],
    ['CCCCCCC', 'CC(C)CCCC', 'CCC(C)CCC', 'CC(C)(C)CCC', 'CC(C)C(C)CC', 'CC(C)CC(C)C', 'CCC(C)(C)CC', 'CCC(CC)CC', 'CC(C)C(C)(C)C'],
    ['CC(C)CC(C)(C)C', 'CCCCC(C)CC', 'CC(C)C(C)C(C)C', 'CCC(C)(C)C(C)C', 'CC(C)(C)C(C)(C)C', 'CCCC(C)(C)CC', 'CC(C)CCC(C)C', 'CCC(CC)C(C)C', 'CCCCCCCC']
  ];

  // trivial names of the course: [smiles, lt, en, source]
  const SYS_EN = { 'Nc1ccccc1': 'benzenamine', 'O=C(Cl)c1ccccc1': 'benzenecarbonyl chloride' };
  const TRIVP = [
    ['C=C', 'etilenas', 'ethylene', 'L1 p51'], ['C#C', 'acetilenas', 'acetylene', 'L1 p51'], ['ClC(Cl)Cl', 'chloroformas', 'chloroform', 'S1.11'],
    ['ClC(Cl)(Cl)Cl', 'anglies tetrachloridas', 'carbon tetrachloride', 'S1.11'], ['CC(C)=O', 'acetonas', 'acetone', 'L1 p51'], ['C=O', 'formaldehidas', 'formaldehyde', 'L1 p51'],
    ['CC=O', 'acetaldehidas', 'acetaldehyde', 'T p11'], ['OC=O', 'skruzdžių rūgštis', 'formic acid', 'T p12'], ['CC(O)=O', 'acto rūgštis', 'acetic acid', 'L1 p51'],
    ['OC(=O)C(O)=O', 'oksalo rūgštis', 'oxalic acid', 'S1.14'], ['OC(=O)CC(O)=O', 'malono rūgštis', 'malonic acid', 'S1.14'], ['OC(=O)CCC(O)=O', 'gintaro rūgštis', 'succinic acid', 'S1.14'],
    ['OC(=O)CCCC(O)=O', 'glutaro rūgštis', 'glutaric acid', 'S1.14'], ['CC(O)C(O)=O', 'pieno rūgštis', 'lactic acid', 'S1.14'], ['OC(=O)CC(O)C(O)=O', 'obuolių rūgštis', 'malic acid', 'S1.14'],
    ['CC(=O)C(O)=O', 'piruvo rūgštis', 'pyruvic acid', 'S1.14'], ['CC(=O)CC(O)=O', 'acetilacto rūgštis', 'acetoacetic acid', 'S1.14'], ['OC(=O)CC(=O)C(O)=O', 'oksalilacto rūgštis', 'oxaloacetic acid', 'S1.14'],
    ['OC(=O)CCC(=O)C(O)=O', 'α-ketoglutaro rūgštis', 'α-ketoglutaric acid', 'S1.14'], ['OC(=O)C(O)C(O)C(O)=O', 'vyno rūgštis', 'tartaric acid', 'S1.14'], ['OCC(O)CO', 'glicerolis', 'glycerol', 'T p11'], ['CCOCC', 'dietileteris', 'diethyl ether', 'S1.11'],
    ['CC(C)O', 'izopropanolis', 'isopropanol', 'S1.11'], ['CCOC(C)=O', 'etilacetatas', 'ethyl acetate', 'S1.11'], ['CN(C)C=O', 'dimetilformamidas', 'dimethylformamide', 'S1.11'],
    ['CC(=O)OC(C)=O', 'acetanhidridas', 'acetic anhydride', 'L1 p46'], ['CC(=O)Cl', 'acetilchloridas', 'acetyl chloride', 'L1 p45'], ['Nc1ccccc1', 'anilinas', 'aniline', 'L1 p51'],
    ['Cc1ccccc1', 'toluenas', 'toluene', 'T p10'], ['OCc1ccccc1', 'benzilo alkoholis', 'benzyl alcohol', 'L1 p51'], ['OC(=O)C=Cc1ccccc1', 'cinamono rūgštis', 'cinnamic acid', 'L1 p51'],
    ['O=C(Cl)c1ccccc1', 'benzoilchloridas', 'benzoyl chloride', 'L1 p45'], ['CC#N', 'acetonitrilas', 'acetonitrile', 'T p12'], ['CC(=O)c1ccccc1', 'acetofenonas', 'acetophenone', 'T p11'],
    ['C=CCl', 'vinilchloridas', 'vinyl chloride', 'T p11'], ['CC(C)(C)O', 'tret-butilo alkoholis', 'tert-butyl alcohol', 'T p11']
  ];

  /* ---------- notes ---------- */
  // two table rows for one class: the class (and group) in words, an example drawn, and its name; the second example repeats a dash
  const crow = (cl, gr, x, y) => [[gr ? t(cl.lt + ': ' + gr.lt, cl.en + ': ' + gr.en) : cl, x, nm1(x)], [f('–'), y, nm1(y)]];
  const nm1 = (m) => m.name || m.caption;

  const NOTES = [
    {
      id: 'organic',
      title: t('Kas yra organinė chemija', 'What organic chemistry is'),
      blocks: [
        { h: t('Organinės ir neorganinės medžiagos', 'Organic and inorganic substances') },
        {
          p: t('1807 m. švedų mokslininkas Bercelijus (J. J. Berzelius) suskirstė medžiagas į dvi rūšis: organines, gaunamas iš gyvų organizmų, ir neorganines, randamas mineraluose bei dujose. Tuomet manyta, kad organinių medžiagų negalima gauti be „gyvybinės jėgos“. 1828 m. vokiečių chemikas Violeris (F. Wöhler) tai paneigė: sušildęs neorganinę druską amonio cianatą, jis gavo organinį junginį karbamidą.',
            'In 1807 the Swedish scientist Berzelius sorted substances into two kinds: organic ones, which come from living organisms, and inorganic ones, found in minerals and gases. It was then believed that organic matter could not be made without a “vital force”. In 1828 the German chemist Wöhler refuted this: warming the inorganic salt ammonium cyanate, he obtained the organic compound urea.'),
          src: 'L1 p2, p3'
        },
        {
          scheme: { items: [{ smi: '[NH4+].N#C[O-]' }, { arrow: '→', above: t('kaitinimas', 'heating') }, { smi: 'NC(N)=O' }] },
          caption: t('Violerio karbamido sintezė: amonio cianatas virsta karbamidu.', 'Wöhler’s synthesis of urea: ammonium cyanate turns into urea.'), src: 'L1 p3'
        },
        {
          rule: t('Organiniais vadinami anglies junginiai, kuriuose atomai sujungti kovalentiniais ryšiais; jų sandarą ir virsmus nagrinėja organinė chemija. Šalia anglies čia dažniausiai randama vandenilio, deguonies ir azoto, rečiau sieros, fosforo, silicio ir halogenų. Heteroatomu vadinamas kiekvienas organinės molekulės atomas, kuris nėra nei anglis, nei vandenilis.',
            'Organic compounds are carbon compounds whose atoms are held together by covalent bonds; organic chemistry studies their structure and transformations. Besides carbon they most often contain hydrogen, oxygen and nitrogen, more rarely sulfur, phosphorus, silicon and halogens. A heteroatom is any atom of an organic molecule that is neither carbon nor hydrogen.'),
          src: 'L1 p6'
        },
        {
          p: t('Žinoma daugiau kaip 20 mln. organinių junginių ir mažiau kaip 1 mln. neorganinių. Kai kurie anglies junginiai priskiriami neorganiniams: anglies oksidai ($CO$, $CO2$), karbonatai (pavyzdžiui, $Na2CO3$), karbidai (pavyzdžiui, $CaC2$) ir paprastosios anglies medžiagos (deimantas, grafitas, fullerenas, grafenas). Už grafeną, vieno atomo storio anglies lakštą, 2010 m. paskirta fizikos Nobelio premija.',
            'More than 20 million organic compounds are known, and fewer than 1 million inorganic ones. Some carbon compounds count as inorganic: the carbon oxides ($CO$, $CO2$), carbonates (for example $Na2CO3$), carbides (for example $CaC2$) and the elemental forms of carbon (diamond, graphite, fullerene, graphene). Graphene, a sheet of carbon one atom thick, earned the 2010 Nobel Prize in Physics.'),
          src: 'L1 p6, p7, p8, p9, p10, p11'
        },
        { h: t('Vaistai ir gamtiniai junginiai', 'Drugs and natural compounds') },
        {
          mol: [
            { smi: 'CC(=O)Oc1ccccc1C(O)=O' }, { smi: 'CC(=O)Nc1ccc(O)cc1' }, { smi: 'CC(C)Cc1ccc(cc1)C(C)C(O)=O' }
          ],
          caption: t('Sintetiniai vaistai: aspirinas, paracetamolis, ibuprofenas.', 'Synthetic drugs: aspirin, paracetamol, ibuprofen.'), src: 'L1 p4'
        },
        {
          mol: [{ smi: 'CN1CCCC1c1cccnc1' }, { smi: 'OCC(O)C1OC(=O)C(O)=C1O' }],
          caption: t('Gamtiniai junginiai: nikotinas (tabakas) ir vitaminas C (erškėtrožės).', 'Natural compounds: nicotine (tobacco) and vitamin C (rose hips).'), src: 'L1 p5'
        },
        {
          p: t('Tiek daug junginių anglis sudaro todėl, kad stovi antrojo periodo viduryje: ji turi keturis valentinius elektronus ir su daugybe elementų sukuria stiprius kovalentinius ryšius. Anglies atomai jungiasi tarpusavyje į ilgesnes ir trumpesnes grandines bei žiedus, o ta pati sudėtis gali atitikti kelis izomerus. Be to, tokius junginius sintezuoti gana paprasta.',
            'Carbon gives so many compounds because it stands in the middle of period 2: it has four valence electrons and makes strong covalent bonds with a great many elements. Carbon atoms link to each other into shorter and longer chains and rings, and one composition can correspond to several isomers. Making such compounds is also fairly easy.'),
          src: 'L1 p14'
        }
      ]
    },

    {
      id: 'formulas',
      title: t('Organinių junginių formulės', 'Formulas of organic compounds'),
      blocks: [
        { h: t('Keturi formulių tipai', 'Four types of formula') },
        {
          p: t('Tą patį junginį galima užrašyti keliais būdais, ir kiekvienas rodo vis daugiau. Molekulinė formulė nusako sudėtį, kondensuotoji – grupių eilę, brūkšninė (struktūrinė) – kiekvieną ryšį, o skeleto formulė – anglies skeletą su heteroatomais. Taškinė (Luiso) formulė papildomai rodo elektronų poras.',
            'The same compound can be written in several ways, and each shows more. The molecular formula gives the composition, the condensed formula the order of the groups, the structural formula every bond, and the skeletal formula the carbon skeleton with the heteroatoms. The dot (Lewis) formula also shows the electron pairs.'),
          src: 'L1 p15'
        },
        {
          table: {
            head: [t('Formulė', 'Formula'), t('Pavyzdys: 3-hidroksibutanalis', 'Example: 3-hydroxybutanal')],
            rows: [
              [t('Molekulinė', 'Molecular'), f('$C4H8O2$')],
              [t('Kondensuotoji', 'Condensed'), { smi: 'CC(O)CC=O', opts: { condensed: true } }],
              [t('Brūkšninė (struktūrinė)', 'Structural'), { smi: 'CC(O)CC=O', opts: { allH: true } }],
              [t('Skeleto', 'Skeletal'), { smi: 'CC(O)CC=O', name: t('3-hidroksibutanalis', '3-hydroxybutanal') }]
            ]
          },
          src: 'L1 p15, p17'
        },
        {
          rule: t('Braižant formulę būtina prisiminti valentingumus: vandenilis ir halogenai – 1, deguonis – 2, azotas – 3, anglis – 4, siera – 2 (kartais 4 ar 6). Skeleto formulėje anglies atomai (laužtės kampuose ir galuose) ir jų vandeniliai nerašomi, o heteroatomai su savo vandeniliais rašomi visada. Ryšio linija brėžiama tik tarp atomų, kurie iš tikrųjų sujungti.',
            'When drawing a formula you must remember the valences: hydrogen and halogens – 1, oxygen – 2, nitrogen – 3, carbon – 4, sulfur – 2 (sometimes 4 or 6). In a skeletal formula carbon atoms (at the corners and ends of the zigzag) and their hydrogens are left out, while heteroatoms with their hydrogens are always written. A bond line is drawn only between atoms that are really bonded.'),
          src: 'L1 p21'
        },
        { h: t('Erdvinės formulės', 'Formulas showing space') },
        {
          p: t('Erdvinę sandarą rodo perspektyvinės (pleištinės) ir projekcinės Fišerio formulės. Žemiau pavaizduoti du 3-hidroksibutanalio veidrodiniai atspindžiai: viena molekulė ir jos atspindys nesutampa.',
            'Spatial structure is shown by perspective (wedge) formulas and Fischer projection formulas. Below are the two mirror images of 3-hydroxybutanal: one molecule and its reflection do not coincide.'),
          src: 'L1 p16'
        },
        {
          mol: [{ smi: 'C[C@H](O)CC=O' }, { smi: 'C[C@@H](O)CC=O' }],
          caption: t('Perspektyvinės formulės: pleištinis ryšys ateina į žiūrovą, brūkšninis – tolsta.', 'Perspective formulas: a wedge bond comes toward the viewer, a dashed bond goes away.'), claims: [{ chiral: ['C[C@H](O)CC=O', true] }, { chiral: ['C[C@@H](O)CC=O', true] }]
        },
        {
          fischer: { rows: [{ left: 'HO', right: 'H' }], top: 'CH2CHO', bottom: 'CH3' },
          src: 'L1 p16'
        },
        {
          fischer: { rows: [{ left: 'H', right: 'HO' }], top: 'CH2CHO', bottom: 'CH3' },
          src: 'L1 p16'
        },
        { h: t('Skirtingi, bet teisingi užrašymo būdai', 'Different but correct ways of writing') },
        {
          p: t('Funkcinės grupės gali būti rašomos iš bet kurios pusės, kad būtų aišku, kuri grupė dalyvauja reakcijoje: $–COOH$ arba $HOOC–$, $–NH2$ arba $H2N–$, $–OH$ arba $HO–$. Aromatinis žiedas braižomas su pakaitomis dvigubomis jungtimis arba su apskritimu: abu variantai teisingi.',
            'Functional groups may be written from either side to make clear which group takes part in a reaction: $–COOH$ or $HOOC–$, $–NH2$ or $H2N–$, $–OH$ or $HO–$. An aromatic ring is drawn with alternating double bonds or with a circle: both are correct.'),
          src: 'L1 p17, p18, p19'
        },
        {
          mol: [{ smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }, { smi: 'Nc1ccccc1', opts: { circle: true } }],
          caption: t('Anilinas: abi formulės reiškia tą patį junginį.', 'Aniline: both formulas mean the same compound.'), src: 'L1 p19'
        },
        {
          pitfall: t('Kondensuotosios formulės grupių eilė turi atitikti sandarą: 3-hidroksibutanalį vaizduoja $CH3CH(OH)CH2CHO$, o $CH3CH2CH(OH)CHO$ yra jau kitas junginys, 2-hidroksibutanalis. Naftaleno žiedų negalima žymėti dviem apskritimais, nes tada neaišku, kiek $π$ elektronų turi bendri atomai. Žiedo heteroatomų padėtis (pavyzdžiui, uracile) turi atitikti tikrąją sandarą.',
            'The order of the groups in a condensed formula must match the structure: 3-hydroxybutanal is $CH3CH(OH)CH2CHO$, while $CH3CH2CH(OH)CHO$ is a different compound, 2-hydroxybutanal. Naphthalene rings must not be drawn as two circles, because then it is unclear how many $π$ electrons the shared atoms have. The positions of ring heteroatoms (for example in uracil) must match the real structure.'),
          src: 'L1 p19, p20'
        },
        {
          mol: [{ smi: 'c1ccc2ccccc2c1', name: t('naftalenas', 'naphthalene') }, { smi: 'O=C1C=CNC(=O)N1' }],
          caption: t('Teisingos formulės: naftalenas ir uracilas (viena iš RNR bazių).', 'Correct formulas: naphthalene and uracil (one of the bases of RNA).'), src: 'L1 p19, p20'
        },
        {
          example: {
            q: [
              { p: t('Junginys užrašytas kondensuotąja formule $(CH3)2CHCH2COOH$. Parašykite molekulinę formulę ir nubraižykite skeleto formulę.', 'A compound is written with the condensed formula $(CH3)2CHCH2COOH$. Write the molecular formula and draw the skeletal formula.') }
            ],
            steps: [
              [{ p: t('Suskaičiuokite atomus: du $CH3$, vienas $CH$, vienas $CH2$ ir $COOH$. Anglies atomų: 2 + 1 + 1 + 1 = 5; vandenilių: 6 + 1 + 2 + 1 = 10; deguonies: 2.', 'Count the atoms: two $CH3$, one $CH$, one $CH2$ and $COOH$. Carbons: 2 + 1 + 1 + 1 = 5; hydrogens: 6 + 1 + 2 + 1 = 10; oxygens: 2.') }],
              [{ p: t('Molekulinė formulė: $C5H10O2$.', 'The molecular formula: $C5H10O2$.') }],
              [{ p: t('Skeleto formulėje grupės tampa laužtės viršūnėmis, o skliausteliuose esantys metilai – šakomis; $COOH$ lieka su deguonimi ir vandeniliu.', 'In the skeletal formula the groups become the vertices of the zigzag, the methyls in brackets become branches, and $COOH$ keeps its oxygen and hydrogen.') }, { mol: { smi: 'CC(C)CC(O)=O', name: t('3-metilbutano rūgštis', '3-methylbutanoic acid') } }]
            ]
          },
          claims: [{ formula: ['CC(C)CC(O)=O', 'C5H10O2'] }, { name: ['CC(C)CC(O)=O', t('3-metilbutano rūgštis', '3-methylbutanoic acid')] }]
        },
        { practice: 'u01.valence' },
        { practice: 'u01.formulas' }
      ]
    },

    {
      id: 'carbons',
      title: t('Anglies atomų klasės ir radikalai', 'Classes of carbon atoms and radicals'),
      blocks: [
        { h: t('Pirminis, antrinis, tretinis, ketvirtinis', 'Primary, secondary, tertiary, quaternary') },
        {
          rule: t('Klasę nusako tai, su kiek kitų $C$ atomų anglis sujungta ryšiais: vienas kaimynas – pirminė anglis, du – antrinė, trys – tretinė, keturi – ketvirtinė. Žiūrima tik į anglies kaimynus; vandenilis ir heteroatomai neskaičiuojami.',
            'The class is set by how many other $C$ atoms the carbon is bonded to: one neighbour – a primary carbon, two – secondary, three – tertiary, four – quaternary. Only carbon neighbours matter; hydrogen and heteroatoms are not counted.'),
          src: 'L1 p22, T p13'
        },
        {
          mol: [
            { smi: 'CCC', name: t('propanas', 'propane'), opts: { numbers: { 0: '1°', 1: '2°', 2: '1°' } } },
            { smi: 'CC(C)C', name: t('2-metilpropanas', '2-methylpropane'), opts: { numbers: { 0: '1°', 1: '3°', 2: '1°', 3: '1°' } } },
            { smi: 'CC(C)CC(C)(C)C', name: t('2,2,4-trimetilpentanas', '2,2,4-trimethylpentane'), opts: { numbers: { 0: '1°', 1: '3°', 2: '1°', 3: '2°', 4: '4°', 5: '1°', 6: '1°', 7: '1°' } } }
          ],
          caption: t('Propane yra du pirminiai ir vienas antrinis C, 2-metilpropane – vienas tretinis, 2,2,4-trimetilpentane yra visų keturių klasių atomų.', 'Propane has two primary and one secondary $C$, 2-methylpropane has one tertiary, and 2,2,4-trimethylpentane has carbons of all four classes.'), src: 'L1 p22'
        },
        {
          pitfall: t('Klasę lemia anglies kaimynai, o ne vandenilių skaičius: $CH3$, sujungta su kita anglimi, yra pirminė, bet pirminė gali būti ir $CH2$ (galinis $CH2–OH$). Anglis be anglies kaimynų ($CH4$, $CH3OH$) vadinama metilo anglimi, ne pirmine.',
            'The class is set by the carbon neighbours, not by the number of hydrogens: a $CH3$ bonded to another carbon is primary, but a terminal $CH2$ (as in $CH2–OH$) is primary too. A carbon without carbon neighbours ($CH4$, $CH3OH$) is a methyl carbon, not primary.'),
          src: 'L1 p22, T p13'
        },
        { h: t('Radikalai (pakaitai)', 'Radicals (substituents)') },
        {
          p: t('Radikalas – tai molekulės fragmentas, gautas atėmus vieną ar kelis vandenilio atomus; jis turi laisvų valentingumų. Vienvalenčių alkilo radikalų pavadinimai baigiasi -ilas: metilas, etilas. Aukštesnių homologų anglys nelygiavertės, todėl radikalų būna keli: pašalinus vandenilį nuo pirminio atomo gaunamas propilas, nuo antrinio – izopropilas.',
            'A radical is a fragment of a molecule obtained by removing one or more hydrogen atoms; it has free valences. The names of monovalent alkyl radicals end in -yl: methyl, ethyl. Carbons of higher homologues are not equivalent, so several radicals exist: removing hydrogen from a primary carbon of propane gives propyl, from the secondary one isopropyl.'),
          src: 'T p13, T p14'
        },
        {
          table: {
            head: [t('Radikalas', 'Radical'), t('Sandara', 'Structure'), t('Iš kurio atomo', 'From which carbon')],
            rows: [
              [t('metilas, etilas', 'methyl, ethyl'), f('$CH3–$, $CH3CH2–$'), t('pirminis', 'primary')],
              [t('propilas, butilas', 'propyl, butyl'), f('$CH3CH2CH2–$, $CH3CH2CH2CH2–$'), t('pirminis galinis', 'terminal primary')],
              [t('izopropilas', 'isopropyl'), f('$(CH3)2CH–$'), t('antrinis (propano)', 'secondary (of propane)')],
              [t('antr-butilas', 'sec-butyl'), f('$CH3CH2CH(CH3)–$'), t('antrinis (butano)', 'secondary (of butane)')],
              [t('izobutilas', 'isobutyl'), f('$(CH3)2CHCH2–$'), t('pirminis (izobutano)', 'primary (of isobutane)')],
              [t('tret-butilas', 'tert-butyl'), f('$(CH3)3C–$'), t('tretinis (izobutano)', 'tertiary (of isobutane)')],
              [t('vinilas, alilas', 'vinyl, allyl'), f('$CH2=CH–$, $CH2=CHCH2–$'), t('iš alkeno ($sp²$ ir $sp³$ atomas)', 'from an alkene ($sp²$ and $sp³$ carbon)')],
              [t('fenilas, benzilas', 'phenyl, benzyl'), f('$C6H5–$, $C6H5CH2–$'), t('iš benzeno ir toluenų', 'from benzene and toluene')],
              [t('acetilas, benzoilas', 'acetyl, benzoyl'), f('$CH3CO–$, $C6H5CO–$'), t('iš rūgščių (acilo radikalai)', 'from acids (acyl radicals)')]
            ]
          },
          src: 'T p14'
        },
        {
          p: t('Radikalai, kurių abu laisvi valentingumai yra grandinės galuose, vadinami -ilenais ($–CH2–$ metilenas, $–CH2CH2–$ etilenas, $–(CH2)4–$ tetrametilenas), o jei abu valentingumai yra ties vienu anglies atomu – -ilidenais (etilidenas $CH3CH<$).',
            'Radicals whose two free valences are at the ends of a chain are named -ylene ($–CH2–$ methylene, $–CH2CH2–$ ethylene, $–(CH2)4–$ tetramethylene), and if both valences are on the same carbon atom, -ylidene (ethylidene $CH3CH<$).'),
          src: 'T p14'
        },
        {
          example: {
            q: [{ p: t('Pateiktas 4-etil-2,2-dimetilheksanas. Nustatykite jo anglies atomų klases. Atomai pažymėti pagal pavadinimo numeraciją, etilo grupės atomai – 1′ ir 2′.', 'The compound is 4-ethyl-2,2-dimethylhexane. Find the classes of its carbons. The atoms are marked by the numbering of the name, the atoms of the ethyl group by 1′ and 2′.') },
              { mol: { smi: 'CC(C)(C)CC(CC)CC', name: t('4-etil-2,2-dimetilheksanas', '4-ethyl-2,2-dimethylhexane'), opts: { numbers: { 0: '1', 1: '2', 4: '3', 5: '4', 6: '1′', 7: '2′', 8: '5', 9: '6' } } } }],
            steps: [
              [{ p: t('Pirmiausia suskaičiuokite kiekvieno atomo anglies kaimynus. Atomai, turintys po vieną kaimyną (C-1, du metilai prie C-2, C-6 ir etilo galas 2′), yra pirminiai.', 'First count the carbon neighbours of every atom. The atoms with one neighbour each (C-1, the two methyls on C-2, C-6 and the ethyl end 2′) are primary.') }],
              [{ p: t('C-3, C-5 ir etilo $CH2$ (1′) turi po du kaimynus: tai antriniai atomai.', 'C-3, C-5 and the ethyl $CH2$ (1′) have two neighbours each: they are secondary.') }],
              [{ p: t('C-4 jungiasi su C-3, C-5 ir 1′: tretinis atomas. C-2 jungiasi su C-1, C-3 ir dviem metilais: ketvirtinis atomas.', 'C-4 is bonded to C-3, C-5 and 1′: a tertiary atom. C-2 is bonded to C-1, C-3 and two methyls: a quaternary atom.') }]
            ]
          },
          claims: [{ carbon: ['CC(C)(C)CC(CC)CC', 0, 1] }, { carbon: ['CC(C)(C)CC(CC)CC', 1, 4] }, { carbon: ['CC(C)(C)CC(CC)CC', 4, 2] }, { carbon: ['CC(C)(C)CC(CC)CC', 5, 3] }, { carbon: ['CC(C)(C)CC(CC)CC', 6, 2] }, { carbon: ['CC(C)(C)CC(CC)CC', 7, 1] }, { carbon: ['CC(C)(C)CC(CC)CC', 8, 2] }, { carbon: ['CC(C)(C)CC(CC)CC', 9, 1] }]
        },
        { practice: 'u01.carbons' },
        { practice: 'u01.alkane' }
      ]
    },

    {
      id: 'classes',
      title: t('Klasifikavimas: grandinė ir funkcinė grupė', 'Classification: the chain and the functional group'),
      blocks: [
        { h: t('Skirstymas pagal anglies skeletą', 'Division by the carbon skeleton') },
        {
          p: t('Organiniai junginiai pirmiausia skirstomi į acikliniuosius (atvira grandinė) ir ciklinius (uždara grandinė). Cikliniai gali būti karbociklinai (žiedą sudaro tik anglis) ir heterociklinai (žiede yra heteroatomų). Visos grupės dar skirstomos į sočiuosius, nesočiuosius ir aromatinius (aromatiniai yra tik cikliniai).',
            'Organic compounds are first divided into acyclic (open chain) and cyclic (closed chain). Cyclic ones can be carbocyclic (the ring is carbon only) and heterocyclic (the ring contains heteroatoms). Each group is further divided into saturated, unsaturated and aromatic (only cyclic ones can be aromatic).'),
          src: 'L1 p24, T p7'
        },
        {
          table: {
            head: [t('Grandinė', 'Chain'), t('Pavyzdys', 'Example'), t('Pavadinimas', 'Name')],
            rows: [
              ...crow(t('aciklinis sotusis; nesotusis', 'acyclic saturated; unsaturated'), null, { smi: 'CCCC', name: t('butanas', 'butane') }, { smi: 'CC=C', name: t('propenas', 'propene') }),
              ...crow(t('karbociklinis sotusis; nesotusis', 'carbocyclic saturated; unsaturated'), null, { smi: 'C1CCCC1', name: t('ciklopentanas', 'cyclopentane') }, { smi: 'C1=CCCCC1', name: t('cikloheksenas', 'cyclohexene') }),
              ...crow(t('karbociklinis aromatinis', 'carbocyclic aromatic'), null, { smi: 'c1ccccc1', name: t('benzenas', 'benzene') }, { smi: 'Cc1ccccc1', name: t('metilbenzenas', 'methylbenzene') }),
              ...crow(t('heterociklinis sotusis; nesotusis', 'heterocyclic saturated; unsaturated'), null, { smi: 'C1CCOC1', caption: t('tetrahidrofuranas', 'tetrahydrofuran') }, { smi: 'C1=CNCC1', caption: t('pirolinas', 'pyrroline') }),
              ...crow(t('heterociklinis aromatinis', 'heterocyclic aromatic'), null, { smi: 'c1ccncc1', name: t('piridinas', 'pyridine') }, { smi: 'c1ccoc1', caption: t('furanas', 'furan') })
            ]
          },
          caption: t('Tetrahidrofuranas ir pirolinas yra sotusis ir nesotusis heterociklai.', 'Tetrahydrofuran and pyrroline are the saturated and the unsaturated heterocycle.'), src: 'L1 p24'
        },
        { h: t('Pagal funkcines grupes', 'By functional groups') },
        {
          rule: t('Funkcinė grupė – atomas ar nedidelis atomų junginys (pavyzdžiui, $–OH$, $–NH2$, $–COOH$, $–Br$), nuo kurio priklauso būdingas medžiagos cheminis elgesys. Jei junginyje yra viena tokia grupė, jį galima užrašyti $R–X$: $R$ – angliavandenilio liekana (radikalas), $X$ – funkcinė grupė.',
            'A functional group is an atom or a small cluster of atoms (for example $–OH$, $–NH2$, $–COOH$, $–Br$) that determines the characteristic chemical behaviour of a substance. A compound with one such group can be written $R–X$, where $R$ is the hydrocarbon rest (radical) and $X$ the functional group.'),
          src: 'L1 p25, T p8'
        },
        {
          p: t('Cheminį elgesį dažniausiai lemia grupė, o ne likęs angliavandenilio karkasas, todėl propanolis labiau primena kitus alkoholius negu propaną. Junginys su viena grupe yra monofunkcinis (etanolis), su keliomis vienodomis – polifunkcinis (glicerolis), o su skirtingomis – heterofunkcinis (2-aminoetanolis).',
            'The chemical behaviour is mostly decided by the group and not by the remaining hydrocarbon framework, so propanol resembles other alcohols more than propane. A compound with one group is monofunctional (ethanol), with several identical groups polyfunctional (glycerol), and with different groups heterofunctional (2-aminoethanol).'),
          src: 'T p8'
        },
        {
          mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'OCC(O)CO', name: t('1,2,3-propantriolis', 'propane-1,2,3-triol') }, { smi: 'NCCO', name: t('2-aminoetanolis', '2-aminoethanol') }],
          caption: t('Monofunkcinis, polifunkcinis (glicerolis) ir heterofunkcinis junginys.', 'A monofunctional, a polyfunctional (glycerol) and a heterofunctional compound.'), src: 'T p8'
        },
        { h: t('Pagrindinės klasės: angliavandeniliai ir paprastosios grupės', 'The main classes: hydrocarbons and simple groups') },
        {
          table: {
            head: [t('Klasė ir funkcinė grupė', 'Class and functional group'), t('Pavyzdys', 'Example'), t('Pavadinimas', 'Name')],
            rows: [
              ...crow(t('alkanai (cikloalkanai)', 'alkanes (cycloalkanes)'), t('nėra', 'none'), { smi: 'CCC(C)C', name: t('2-metilbutanas', '2-methylbutane') }, { smi: 'CC1CCC(C1)C', name: t('1,3-dimetilciklopentanas', '1,3-dimethylcyclopentane') }),
              ...crow(t('alkenai', 'alkenes'), f('$C=C$'), { smi: 'CC(C)C=C', name: t('3-metil-1-butenas', '3-methylbut-1-ene') }, { smi: 'CC1CC=CCC1', name: t('4-metilcikloheksenas', '4-methylcyclohexene') }),
              ...crow(t('alkinai', 'alkynes'), f('$C≡C$'), { smi: 'CC#CC(C)C', name: t('4-metil-2-pentinas', '4-methylpent-2-yne') }, { smi: 'C#CC', name: t('propinas', 'propyne') }),
              ...crow(t('arenai', 'arenes'), t('aromatinis žiedas', 'aromatic ring'), { smi: 'CCc1cccc(C)c1', name: t('1-etil-3-metilbenzenas', '1-ethyl-3-methylbenzene') }, { smi: 'c1ccc2ccccc2c1', name: t('naftalenas', 'naphthalene') }),
              ...crow(t('halogenidai', 'halides'), f('$–F$, $–Cl$, $–Br$, $–I$'), { smi: 'CC(C)I', name: t('2-jodpropanas', '2-iodopropane') }, { smi: 'ClC(Cl)Cl', name: t('trichlormetanas', 'trichloromethane') }),
              ...crow(t('alkoholiai', 'alcohols'), t('$–OH$ (hidroksi)', '$–OH$ (hydroxy)'), { smi: 'CCCO', name: t('1-propanolis', 'propan-1-ol') }, { smi: 'OCc1ccccc1', name: t('fenilmetanolis', 'phenylmethanol') }),
              ...crow(t('fenoliai', 'phenols'), t('$–OH$ prie aromatinio žiedo', '$–OH$ on an aromatic ring'), { smi: 'Cc1ccc(O)cc1C', name: t('3,4-dimetilfenolis', '3,4-dimethylphenol') }, { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }),
              ...crow(t('tioliai', 'thiols'), t('$–SH$ (merkapto)', '$–SH$ (mercapto)'), { smi: 'CCCS', name: t('1-propantiolis', 'propane-1-thiol') }, { smi: 'Sc1ccccc1', name: t('benzentiolis', 'benzenethiol') }),
              ...crow(t('eteriai', 'ethers'), t('$–O–$ (alkoksi)', '$–O–$ (alkoxy)'), { smi: 'COC(C)C', name: t('2-metoksipropanas', '2-methoxypropane') }, { smi: 'CCOCC', name: t('etoksietanas', 'ethoxyethane') }),
              ...crow(t('sulfidai (tioeteriai)', 'sulfides (thioethers)'), t('$–S–$ (alkiltio)', '$–S–$ (alkylthio)'), { smi: 'CCSC', name: t('metiltioetanas', '(methylsulfanyl)ethane') }, { smi: 'CSC', name: t('metiltiometanas', '(methylsulfanyl)methane') }),
              ...crow(t('aminai', 'amines'), t('$–NH2$, $>NH$, $>N–$ (amino)', '$–NH2$, $>NH$, $>N–$ (amino)'), { smi: 'CCN', name: t('etanaminas', 'ethanamine') }, { smi: 'CCNC', name: t('N-metiletanaminas', 'N-methylethanamine') }),
              ...crow(t('sulfonrūgštys', 'sulfonic acids'), t('$–SO3H$ (sulfo)', '$–SO3H$ (sulfo)'), { smi: 'OS(=O)(=O)c1ccccc1', name: t('benzensulfonrūgštis', 'benzenesulfonic acid') }, { smi: 'CS(O)(=O)=O', name: t('metansulfonrūgštis', 'methanesulfonic acid') })
            ]
          },
          src: 'L1 p26-p37'
        },
        {
          p: t('Prie amino azoto gali būti prijungti vienas, du ar trys $C$ atomai – atitinkamai gaunamas pirminis, antrinis ar tretinis aminas: etanaminas yra pirminis, $N$-metiletanaminas – antrinis, $N,N$-dimetiletanaminas – tretinis.',
            'One, two or three $C$ atoms may be attached to the nitrogen of an amine, giving a primary, secondary or tertiary amine: ethanamine is primary, $N$-methylethanamine secondary, $N,N$-dimethylethanamine tertiary.'),
          src: 'L1 p37'
        },
        {
          mol: [{ smi: 'CCN', name: t('etanaminas', 'ethanamine') }, { smi: 'CCNC', name: t('N-metiletanaminas', 'N-methylethanamine') }, { smi: 'CCN(C)C', name: t('N,N-dimetiletanaminas', 'N,N-dimethylethanamine') }],
          caption: t('Pirminis, antrinis ir tretinis aminas.', 'A primary, a secondary and a tertiary amine.'), src: 'L1 p37'
        },
        { h: t('Karbonilo grupė ir rūgščių dariniai', 'The carbonyl group and acid derivatives') },
        {
          table: {
            head: [t('Klasė ir funkcinė grupė', 'Class and functional group'), t('Pavyzdys', 'Example'), t('Pavadinimas', 'Name')],
            rows: [
              ...crow(t('aldehidai', 'aldehydes'), t('$–CHO$ (formil)', '$–CHO$ (formyl)'), { smi: 'CCC=O', name: t('propanalis', 'propanal') }, { smi: 'O=Cc1cccc(C)c1', name: t('3-metilbenzenkarbaldehidas', '3-methylbenzaldehyde') }),
              ...crow(t('ketonai', 'ketones'), t('$C=O$ (karbonil, okso)', '$C=O$ (carbonyl, oxo)'), { smi: 'CCCC(C)=O', name: t('2-pentanonas', 'pentan-2-one') }, { smi: 'O=C1CCCC1', name: t('ciklopentanonas', 'cyclopentanone') }),
              ...crow(t('karboksirūgštys', 'carboxylic acids'), t('$–COOH$ (karboksi)', '$–COOH$ (carboxy)'), { smi: 'CC(O)=O', name: t('etano rūgštis', 'ethanoic acid') }, { smi: 'OC(=O)c1ccccc1', name: t('benzenkarboksirūgštis', 'benzoic acid') }),
              ...crow(t('karboksirūgščių druskos', 'salts of carboxylic acids'), t('$–COOM$ (karboksilatas)', '$–COOM$ (carboxylate)'), { smi: 'CCC([O-])=O.[Na+]', name: t('natrio propanoatas', 'sodium propanoate') }, { smi: 'O=C([O-])C1CCCCC1.[K+]', name: t('kalio cikloheksankarboksilatas', 'potassium cyclohexanecarboxylate') }),
              ...crow(t('esteriai', 'esters'), t('$–COOR$ (alkoksikarbonil)', '$–COOR$ (alkoxycarbonyl)'), { smi: 'CCCC(=O)OCC', name: t('etilbutanoatas', 'ethyl butanoate') }, { smi: 'COC(=O)c1ccccc1', name: t('metilbenzenkarboksilatas', 'methyl benzoate') }),
              ...crow(t('amidai', 'amides'), t('$–CONH2$ (karbamoil)', '$–CONH2$ (carbamoyl)'), { smi: 'CC(N)=O', name: t('etanamidas', 'ethanamide') }, { smi: 'NC(=O)C1CCCCC1', name: t('cikloheksankarboksamidas', 'cyclohexanecarboxamide') }),
              ...crow(t('nitrilai', 'nitriles'), t('$–C≡N$ (cian)', '$–C≡N$ (cyano)'), { smi: 'CC#N', name: t('etannitrilas', 'ethanenitrile') }, { smi: 'N#CC1CCCCC1', name: t('cikloheksankarbonitrilas', 'cyclohexanecarbonitrile') }),
              ...crow(t('halogenanhidridai', 'acyl halides'), t('$–COX$ (haloformil)', '$–COX$ (haloformyl)'), { smi: 'CC(Cl)=O', name: t('etanoilchloridas', 'ethanoyl chloride') }, { smi: 'O=C(Cl)c1ccccc1', name: t('benzenkarbonilchloridas', 'benzoyl chloride') }),
              ...crow(t('anhidridai', 'anhydrides'), t('$–(CO)2O$', '$–(CO)2O$'), { smi: 'CC(=O)OC(C)=O', name: t('etano rūgšties anhidridas', 'ethanoic anhydride') }, { smi: 'CCC(=O)OC(=O)CC', name: t('propano rūgšties anhidridas', 'propanoic anhydride') })
            ]
          },
          src: 'L1 p38-p46, T p9, p10'
        },
        {
          rule: t('Kai molekulėje yra kelios skirtingos grupės, ją paprastai priskiria vyriausiosios grupės klasei, o likusios išreiškiamos pavadinime, pavyzdžiui, aminorūgštis ar aromatinis hidroksialdehidas.',
            'When a molecule carries several different groups, it is usually put in the class of the senior group, and the rest are expressed in the name, for example an amino acid or an aromatic hydroxy aldehyde.'),
          src: 'L1 p48'
        },
        {
          mol: [{ smi: 'CC(N)CC(O)=O', name: t('3-aminobutano rūgštis', '3-aminobutanoic acid') }, { smi: 'O=Cc1cccc(O)c1', name: t('3-hidroksibenzenkarbaldehidas', '3-hydroxybenzaldehyde') }],
          caption: t('Aminorūgštis ir aromatinis hidroksialdehidas.', 'An amino acid and an aromatic hydroxy aldehyde.'), src: 'L1 p48'
        },
        {
          pitfall: t('Fenolį ir alkoholį skiria vieta, kur prijungtas $–OH$: prie aromatinio žiedo – fenolis, prie įsotintos anglies – alkoholis (fenilmetanolis yra alkoholis, nes $–OH$ prijungtas prie $CH2$). Aminą nuo amido skiria $C=O$ prie azoto, o esterį nuo rūgšties – $R$ vietoje vandenilio.',
            'The place where $–OH$ is attached tells a phenol from an alcohol: on an aromatic ring it is a phenol, on a saturated carbon an alcohol (phenylmethanol is an alcohol because the $–OH$ is on a $CH2$). A $C=O$ next to nitrogen makes an amide rather than an amine, and an $R$ in place of the acid hydrogen makes an ester.'),
          src: 'L1 p31, p32, p42, p43'
        },
        {
          example: {
            q: [{ p: t('Paracetamolis vartojamas karščiavimui mažinti. Nustatykite jo funkcines grupes ir klasę.', 'Paracetamol is used to lower fever. Find its functional groups and class.') }, { mol: { smi: 'CC(=O)Nc1ccc(O)cc1', name: t('N-(4-hidroksifenil)etanamidas', 'N-(4-hydroxyphenyl)ethanamide') } }],
            steps: [
              [{ p: t('Eikite per molekulę: $C=O$ prie azoto – amido grupė; $–OH$ prie benzeno žiedo – fenolio grupė; žiedas – aromatinis (areno) žiedas.', 'Go through the molecule: a $C=O$ next to nitrogen is an amide group; an $–OH$ on a benzene ring is a phenol group; the ring itself is an aromatic ring.') }],
              [{ p: t('Vyriausioji grupė – amidas (amidai vyresni už fenolius), todėl junginys priskiriamas amidams, o hidroksilas paminimas priešdėliu: $N$-(4-hidroksifenil)etanamidas.', 'The senior group is the amide (amides outrank phenols), so the compound belongs to the amides, and the hydroxyl is mentioned as a prefix: $N$-(4-hydroxyphenyl)ethanamide.') }]
            ]
          },
          claims: [{ name: ['CC(=O)Nc1ccc(O)cc1', t('N-(4-hidroksifenil)etanamidas', 'N-(4-hydroxyphenyl)ethanamide')] }, { formula: ['CC(=O)Nc1ccc(O)cc1', 'C8H9NO2'] }]
        },
        { practice: 'u01.classify' },
        { practice: 'u01.fgroups' }
      ]
    },

    {
      id: 'rules',
      title: t('IUPAC nomenklatūros taisyklės', 'The rules of IUPAC nomenclature'),
      blocks: [
        { h: t('Trivialieji ir sisteminiai pavadinimai', 'Trivial and systematic names') },
        {
          p: t('Trivialieji pavadinimai nenusako sandaros, o atspindi savybes, gavimo būdus ar pritaikymą (glicerolis – iš graikų „saldus“, laktozė – iš lotynų „pienas“). Jų taisyklių nėra, todėl reikia tiesiog išmokti. Sisteminiai pavadinimai sudaromi pagal IUPAC patvirtintas griežtas taisykles: pagal juos junginiui suteikiamas vienintelis pavadinimas, o pagal pavadinimą parašoma vienintelė formulė.',
            'Trivial names do not describe the structure but reflect properties, preparation or use (glycerol – from Greek “sweet”, lactose – from Latin “milk”). They follow no rules and simply have to be learned. Systematic names follow strict rules approved by IUPAC: a compound gets one name, and from a name exactly one formula can be written.'),
          src: 'L1 p50'
        },
        { h: t('Penki žingsniai (stadijos)', 'Five stages') },
        {
          list: [
            t('Nustatykite vyriausiąją funkcinę grupę: ji suteikia priesagą. Kitos grupės vadinamos priešdėliais.', 'Find the senior functional group: it provides the suffix. The other groups are named by prefixes.'),
            t('Raskite pagrindinę grandinę ar žiedą pagal kriterijus: a) daugiausia funkcinių grupių, b) daugiausia dvigubųjų ir trigubųjų ryšių, c) ilgiausia grandinė, d) daugiausia pakaitų, kurie gali stovėti tik prieš šaknį, ir angliavandenilių radikalų.', 'Find the main chain or ring by the criteria: a) the most functional groups, b) the most double and triple bonds, c) the longest chain, d) the most substituents that can stand only in front of the root, and hydrocarbon radicals.'),
            t('Grandinę sunumeruokite taip, kad vyriausiajai grupei atitektų mažiausias numeris; jei jos nėra, pirmiausia mažiausią numerį gauna dvigubasis ar trigubasis ryšys, po to pakaitai. Kai dvi kryptys skiriasi, lyginami lokantų rinkiniai ir laimi tas, kurio pirmasis besiskiriantis lokantas mažesnis (2,3,6, o ne 3,6,7).', 'Number the chain so that the senior group gets the lowest number; if there is none, the double or triple bond comes first, then the substituents. When the two directions differ, compare the sets of locants: the winner has the lower number at the first point of difference (2,3,6, not 3,6,7).'),
            t('Pavadinkite grandinę ir grupę: sotumas nusakomas priesagomis -an, -en, -in.', 'Name the chain and the group: the saturation is shown by the endings -an, -en, -in.'),
            t('Išvardykite pakaitus priešdėliais abėcėlės tvarka; vienodiems rašomi $di$-, $tri$-, $tetra$-.', 'List the substituents as prefixes alphabetically; identical ones take $di$-, $tri$-, $tetra$-.')
          ],
          ordered: true, src: 'L1 p52, p54, p55'
        },
        {
          rule: t('Kriterijai a) – d) taikomi paeiliui: į kiekvieną paskesnį žiūrima tik tada, kai ankstesnis neduoda vienareikšmio atsakymo. Pavadinimo schema: priešdėlis (jaunesnės grupės, radikalai, abėcėlės tvarka) – šaknis (pagrindinė grandinė) – sotumo priesaga (-an, -en, -in) – galūnė (vyriausioji grupė).',
            'Criteria a) to d) are applied in turn: each later one is considered only when the earlier gives no single answer. The scheme of a name: prefix (junior groups, radicals, alphabetically) – root (the main chain) – saturation ending (-an, -en, -in) – ending (the senior group).'),
          src: 'L1 p54, p56'
        },
        { h: t('Grupių vyresniškumas', 'Seniority of the groups') },
        {
          table: {
            head: [t('Grupė', 'Group'), t('Priešdėlis', 'Prefix'), t('Priesaga + galūnė', 'Suffix + ending')],
            rows: [
              [f('$–COOH$'), t('karboksi-', 'carboxy-'), t('-karboksirūgštis; -ano rūgštis', '-carboxylic acid; -anoic acid')],
              [f('$–SO3H$'), t('sulfo-', 'sulfo-'), t('-sulfonrūgštis', '-sulfonic acid')],
              [f('$–COOM$'), t('–', '–'), t('-karboksilatas; -oatas', '-carboxylate; -oate')],
              [f('$–(CO)2O$'), t('–', '–'), t('rūgšties anhidridas', 'acid anhydride')],
              [f('$–COOR$'), t('alkoksikarbonil-', 'alkoxycarbonyl-'), t('-karboksilatas; -oatas', '-carboxylate; -oate')],
              [f('$–COX$'), t('haloformil-', 'haloformyl-'), t('-karbonilhalogenidas; -oilhalogenidas', '-carbonyl halide; -oyl halide')],
              [f('$–CONH2$'), t('karbamoil-', 'carbamoyl-'), t('-karboksamidas; -amidas', '-carboxamide; -amide')],
              [f('$–C≡N$'), t('cian-', 'cyano-'), t('-karbonitrilas; -nitrilas', '-carbonitrile; -nitrile')],
              [f('$–CHO$'), t('formil-; okso-', 'formyl-; oxo-'), t('-karbaldehidas; -alis', '-carbaldehyde; -al')],
              [f('$C=O$'), t('okso-', 'oxo-'), t('-onas', '-one')],
              [f('$–OH$'), t('hidroksi-', 'hydroxy-'), t('-olis', '-ol')],
              [f('$–SH$'), t('merkapto-', 'mercapto- (also sulfanyl-)'), t('-tiolis', '-thiol')],
              [f('$–NH2$'), t('amino-', 'amino-'), t('-aminas', '-amine')],
              [f('$C=C$'), t('–', '–'), t('-enas', '-ene')],
              [f('$C≡C$'), t('–', '–'), t('-inas', '-yne')]
            ]
          },
          caption: t('Grupės išdėstytos vyresniškumo mažėjimo tvarka. Fenolinis $Ar–OH$ vyresnis už $–SH$, bet jaunesnis už alkoholio $–OH$. Prie žiedo prijungtai grupei naudojama priesaga su -karbo-, nes grupės anglis nėra žiedo dalis.', 'The groups are in order of decreasing seniority. The phenolic $Ar–OH$ ranks above $–SH$ but below an alcohol $–OH$. A group attached to a ring takes the suffix with -carbo-, because the carbon of the group is not part of the ring.'), src: 'L1 p52, T p15-p19'
        },
        {
          rule: t('Pavadinime kaip priešdėliai, bet niekada kaip priesagos, vartojami šie pakaitai: nitro ($–NO2$), nitrozo ($–NO$), azido ($–N3$), alkoksi ($–OR$), alkiltio ($–SR$) ir halogenų atomai ($–F$, $–Cl$, $–Br$, $–I$). Todėl, pavyzdžiui, eteris vadinamas alkoksialkanu.',
            'These substituents are used as prefixes in a name but never as a suffix: nitro ($–NO2$), nitroso ($–NO$), azido ($–N3$), alkoxy ($–OR$), alkylthio ($–SR$) and the halogen atoms ($–F$, $–Cl$, $–Br$, $–I$). So an ether, for example, is named as an alkoxyalkane.'),
          src: 'L1 p53'
        },
        {
          example: {
            q: [{ p: t('Pavadinkite penkių anglies atomų cukrų $HOCH2(CHOH)3CHO$ (ribozės atvirąją formą) ir paaiškinkite kiekvieną stadiją. Numeriai ant molekulės – grandinės numeracija.', 'Name the five-carbon sugar $HOCH2(CHOH)3CHO$ (the open form of ribose) and explain every stage. The numbers on the molecule are the numbering of the chain.') },
              { mol: { smi: 'O=CC(O)C(O)C(O)CO', opts: { numbers: { 1: '1', 2: '2', 4: '3', 6: '4', 8: '5' } } } }],
            steps: [
              [{ p: t('Grupės: aldehido $–CHO$ ir keturios $–OH$. Aldehidas vyresnis už alkoholį, todėl galūnė bus -alis, o hidroksilai – priešdėliai.', 'Groups: the aldehyde $–CHO$ and four $–OH$. The aldehyde outranks the alcohol, so the ending is -al and the hydroxyls are prefixes.') }],
              [{ p: t('Pagrindinė grandinė apima $–CHO$ anglį ir visus hidroksilus: 5 C atomai, sotus – pentanas.', 'The main chain includes the $–CHO$ carbon and all the hydroxyls: 5 C atoms, saturated – pentane.') }],
              [{ p: t('Aldehido anglis gauna numerį 1. Hidroksilai yra prie C-2, C-3, C-4 ir C-5.', 'The aldehyde carbon gets number 1. The hydroxyls are on C-2, C-3, C-4 and C-5.') }],
              [{ p: t('Keturi vienodi pakaitai žymimi priešdėliu tetra-, todėl pavadinimas yra 2,3,4,5-tetrahidroksipentanalis.', 'Four identical substituents take the prefix tetra-, so the name is 2,3,4,5-tetrahydroxypentanal.') }]
            ]
          },
          claims: [{ name: ['O=CC(O)C(O)C(O)CO', t('2,3,4,5-tetrahidroksipentanalis', '2,3,4,5-tetrahydroxypentanal')] }]
        },
        {
          example: {
            q: [{ p: t('Pavadinkite junginį, kuriame yra bromas ir nitro grupė.', 'Name the compound that contains bromine and a nitro group.') },
              { mol: { smi: 'BrCC([N+](=O)[O-])C(C)CC', opts: { numbers: { 1: '1', 2: '2', 6: '3', 8: '4', 9: '5' } } } }],
            steps: [
              [{ p: t('Čia nėra priesagą duodančios grupės: bromas ir nitro grupė rašomi tik priešdėliais. Pavadinimas bus alkano.', 'There is no group that gives a suffix: bromine and the nitro group are written only as prefixes. The name will be that of an alkane.') }],
              [{ p: t('Ilgiausia grandinė turi 5 C: pentanas. Numeruojama nuo galo, kur pakaitai gauna mažiausius lokantus: 1, 2, 3 (iš kito galo būtų 3, 4, 5).', 'The longest chain has 5 C: pentane. It is numbered from the end where the substituents get the lowest locants: 1, 2, 3 (from the other end they would be 3, 4, 5).') }],
              [{ p: t('Pakaitai abėcėlės tvarka: brom (1), metil (3), nitro (2). Pavadinimas: 1-brom-3-metil-2-nitropentanas.', 'Substituents alphabetically: bromo (1), methyl (3), nitro (2). Name: 1-bromo-3-methyl-2-nitropentane.') }]
            ]
          },
          claims: [{ name: ['BrCC([N+](=O)[O-])C(C)CC', t('1-brom-3-metil-2-nitropentanas', '1-bromo-3-methyl-2-nitropentane')] }]
        },
        {
          pitfall: t('Dažniausios klaidos: pasirinkti ilgiausią grandinę, nors ji neapima vyriausiosios grupės (kriterijus a) viršesnis už ilgį); numeruoti nuo netinkamo galo; išvardyti pakaitus ne abėcėlės tvarka (dimetil rašomas pagal „metil“, ne „di“); įskaityti visas anglis, o ne tik grandinės.',
            'Typical mistakes: choosing the longest chain although it misses the senior group (criterion a) outranks length); numbering from the wrong end; listing the substituents out of alphabetical order (dimethyl goes under “methyl”, not “di”); counting all the carbons instead of only those of the chain.'),
          src: 'L1 p54, p55'
        },
        { practice: 'u01.chain' },
        { practice: 'u01.numbering' },
        { practice: 'u01.senior' }
      ]
    },

    {
      id: 'names',
      title: t('Pavadinimų sudarymas pagal klases', 'Building names class by class'),
      blocks: [
        { h: t('Angliavandeniliai, halogenidai, alkoholiai, aminai', 'Hydrocarbons, halides, alcohols, amines') },
        {
          p: t('Alkano šaknis nusako anglių skaičių, o priesaga – sotumą: -an, -en, -in. Pakaitų ir dvigubųjų ryšių vieta nurodoma skaičiumi (dvigubajam ar trigubajam ryšiui – mažesniu). Ciklo anglys numeruojamos nuo to atomo, kur yra pakaitas ar ryšys, kad lokantai būtų kuo mažesni; cikloalkene dvigubasis ryšys gauna 1 ir 2. Cikle vyriausiosios grupės anglis gauna numerį 1, po to dvigubasis ryšys: 4-metil-3-cikloheksenonas.',
            'The root of an alkane gives the number of carbons and the ending the saturation: -ane, -ene, -yne. The place of substituents and double bonds is given by a number (for a double or triple bond the lower one). The ring carbons are numbered from the atom with a substituent or bond so the locants are as low as possible; in a cycloalkene the double bond gets 1 and 2. In a ring the carbon of the senior group is C-1, then the double bond: 4-methylcyclohex-3-en-1-one (L1 p57).'),
          src: 'L1 p26-p29, p55'
        },
        {
          mol: [{ smi: 'CCC(C)C', name: t('2-metilbutanas', '2-methylbutane') }, { smi: 'CC=C(C)C', name: t('2-metil-2-butenas', '2-methylbut-2-ene') }, { smi: 'CC#CC(C)C', name: t('4-metil-2-pentinas', '4-methylpent-2-yne') }, { smi: 'CC1C=CCCC1', name: t('3-metilcikloheksenas', '3-methylcyclohexene') }],
          caption: t('Alkanas, alkenas, alkinas ir cikloalkenas: priesagos -an, -en, -in.', 'An alkane, an alkene, an alkyne and a cycloalkene: the endings -ane, -ene, -yne.'), src: 'L1 p26, p27, p28'
        },
        {
          p: t('Halogenas visada rašomas priešdėliu: 2-jodpropanas. Alkoholio galūnė -olis, tiolio – -tiolis, eterio ir sulfido grupės pavadinamos priešdėliais (alkoksi-, alkiltio-): 2-metoksipropanas, metiltioetanas. Aminas turi galūnę -aminas, o pakaitus ant azoto žymi raidė $N$: $N$-metiletanaminas, $N,N$-dimetiletanaminas.',
            'A halogen is always a prefix: 2-iodopropane. The ending of an alcohol is -ol, of a thiol -thiol, and ethers and sulfides are named with prefixes (alkoxy-, alkylthio-): 2-methoxypropane, methylthioethane (also (methylsulfanyl)ethane). An amine takes the ending -amine, and the substituents on nitrogen are marked by the letter $N$: $N$-methylethanamine, $N,N$-dimethylethanamine.'),
          src: 'L1 p30-p37'
        },
        {
          mol: [{ smi: 'CC(C)I', name: t('2-jodpropanas', '2-iodopropane') }, { smi: 'COC(C)C', name: t('2-metoksipropanas', '2-methoxypropane') }, { smi: 'CCSC', name: t('metiltioetanas', '(methylsulfanyl)ethane') }, { smi: 'CCN(C)C', name: t('N,N-dimetiletanaminas', 'N,N-dimethylethanamine') }],
          caption: t('Halogenidas, eteris, sulfidas ir tretinis aminas.', 'A halide, an ether, a sulfide and a tertiary amine.'), src: 'L1 p30, p34, p35, p37'
        },
        { h: t('Aldehidai, ketonai ir rūgščių dariniai', 'Aldehydes, ketones and acid derivatives') },
        {
          p: t('Aldehido galūnė -alis (karbonilo anglis yra grandinės pradžia ir turi numerį 1), ketono – -onas (pavyzdžiui, 2-pentanonas). Visos karboksirūgšties darinių grupės turi karbonilo anglį, kuri įeina į grandinę. Todėl etano rūgštis turi 2 C, o pakeitus grupę gaunamas tos pačios šeimos darinys.',
            'The ending of an aldehyde is -al (the carbonyl carbon starts the chain and has number 1), of a ketone -one (for example pentan-2-one). All the groups derived from carboxylic acids have a carbonyl carbon that is part of the chain. So ethanoic acid has 2 C, and changing the group gives a derivative of the same family.'),
          src: 'L1 p38, p39, p40-p46'
        },
        {
          mol: [
            { smi: 'CC(O)=O', name: t('etano rūgštis', 'ethanoic acid') }, { smi: 'CC([O-])=O.[Na+]', name: t('natrio etanoatas', 'sodium ethanoate') }, { smi: 'CC(=O)OCC', name: t('etiletanoatas', 'ethyl ethanoate') },
            { smi: 'CC(N)=O', name: t('etanamidas', 'ethanamide') }, { smi: 'CC#N', name: t('etannitrilas', 'ethanenitrile') }, { smi: 'CC(Cl)=O', name: t('etanoilchloridas', 'ethanoyl chloride') }, { smi: 'CC(=O)OC(C)=O', name: t('etano rūgšties anhidridas', 'ethanoic anhydride') }
          ],
          caption: t('Etano rūgšties šeima: rūgštis, druska, esteris, amidas, nitrilas, halogenanhidridas ir anhidridas.', 'The ethanoic acid family: acid, salt, ester, amide, nitrile, acyl halide and anhydride.'), src: 'L1 p40-p46, T p15-p17'
        },
        {
          rule: t('Esterio pavadinimas prasideda alkilo grupe (alkoholio dalimi), o baigiasi rūgšties dalimi su galūne -oatas: etilbutanoatas. Druskos pavadinime pirmiau rašomas metalas: natrio propanoatas. Kai grupė prijungta prie žiedo, jos anglis nėra grandinės dalis ir priesaga gauna -karbo-: benzenkarboksirūgštis, cikloheksankarboksamidas, benzenkarbonitrilas, benzenkarbonilchloridas.',
            'The name of an ester starts with the alkyl group (the alcohol part) and ends with the acid part with the ending -oate: ethyl butanoate. In the name of a salt the metal comes first: sodium propanoate. When the group is attached to a ring, its carbon is not part of the ring and the suffix gets -carbo-: cyclohexanecarboxylic acid, cyclohexanecarboxamide, cyclohexanecarbonitrile. For benzene the retained names are used in English: benzoic acid, benzamide, benzonitrile, benzoyl chloride, methyl benzoate (the Lithuanian course writes benzenkarboksirūgštis, benzenkarbonitrilas).'),
          src: 'L1 p41, p42, p43, p44, p45'
        },
        {
          mol: [{ smi: 'CCCC(=O)OCC', name: t('etilbutanoatas', 'ethyl butanoate') }, { smi: 'COC(=O)c1ccccc1', name: t('metilbenzenkarboksilatas', 'methyl benzoate') }, { smi: 'CCCC(N)=O', name: t('butanamidas', 'butanamide') }, { smi: 'CNC(=O)CC', name: t('N-metilpropanamidas', 'N-methylpropanamide') }],
          caption: t('Esteris, aromatinis esteris, amidas ir $N$-pakeistas amidas.', 'An ester, an aromatic ester, an amide and an $N$-substituted amide.'), src: 'L1 p42, p43'
        },
        { h: t('Keletas funkcinių grupių', 'Several functional groups') },
        {
          p: t('Polifunkciniame junginyje priesagą nulemia vyriausioji grupė, o jaunesnės rašomos priešdėliais abėcėlės tvarka: γ-aminosviesto rūgštis (GABA) yra 4-aminobutano rūgštis. Kai aldehido ar ketono $C=O$ yra jaunesnė grupė, jos priešdėlis – okso-: 3-oksobutano rūgštis.',
            'In a polyfunctional compound the senior group decides the suffix and the junior ones are written as prefixes in alphabetical order: γ-aminobutyric acid (GABA) is 4-aminobutanoic acid. When the $C=O$ of an aldehyde or ketone is the junior group, its prefix is oxo-: 3-oxobutanoic acid.'),
          src: 'L1 p52, p54, T p15'
        },
        {
          mol: [{ smi: 'NCCCC(O)=O', name: t('4-aminobutano rūgštis', '4-aminobutanoic acid') }, { smi: 'CC(=O)CC(O)=O', name: t('3-oksobutano rūgštis', '3-oxobutanoic acid') }],
          caption: t('GABA ir acetilacto rūgštis.', 'GABA and acetoacetic acid.'), src: 'T p15, S1.14'
        },
        {
          example: {
            q: [{ p: t('Pavadinkite benzeno darinį su aldehido ir nitrilo grupėmis. Žiedo numeriai pažymėti ant molekulės.', 'Name the benzene derivative with an aldehyde and a nitrile group. The ring numbers are marked on the molecule.') },
              { mol: { smi: 'N#Cc1ccc(C=O)cc1', opts: { numbers: { 2: '1', 3: '2', 4: '3', 5: '4' } } } }],
            steps: [
              [{ p: t('Grupės: nitrilas $–C≡N$ ir aldehidas $–CHO$. Nitrilai vyresni už aldehidus, todėl vyriausioji grupė – nitrilas, o aldehidas bus priešdėlis formil-.', 'Groups: the nitrile $–C≡N$ and the aldehyde $–CHO$. Nitriles outrank aldehydes, so the senior group is the nitrile and the aldehyde becomes the prefix formyl-.') }],
              [{ p: t('Abi grupės prijungtos prie benzeno žiedo, todėl priesaga gauna -karbo-: benzenkarbonitrilas. Nitrilo prijungta anglis žiede yra C-1.', 'Both groups are attached to the benzene ring; the nitrile gives the parent name benzonitrile (systematically benzenecarbonitrile). The ring carbon carrying the nitrile is C-1.') }],
              [{ p: t('Formilas yra priešingame žiedo atome, C-4: 4-formilbenzenkarbonitrilas.', 'The formyl is on the opposite ring carbon, C-4: 4-formylbenzonitrile.') }]
            ]
          },
          claims: [{ name: ['N#Cc1ccc(C=O)cc1', t('4-formilbenzenkarbonitrilas', '4-formylbenzonitrile')] }]
        },
        { practice: 'u01.name' },
        { practice: 'u01.acidname' },
        { practice: 'u01.fromname' },
        { practice: 'u01.describe' },
        { practice: 'u01.lonepairs' }
      ]
    },

    {
      id: 'trivial',
      title: t('Trivialieji pavadinimai', 'Trivial names'),
      blocks: [
        { h: t('Dažniausiai vartojami trivialieji pavadinimai', 'The most common trivial names') },
        {
          p: t('Kai kurie junginiai ir šiandien vadinami nusistovėjusiais, neatitinkančiais IUPAC taisyklių pavadinimais. Daugelis jų sutinkami sintezėje, vaistų ir gamtos junginių chemijoje, todėl reikia mokėti perskaityti abu pavadinimus. Trivialiaisiais pavadinimais ypač dažnai vadinamos aminorūgštys, angliavandeniai, alkaloidai ir steroidai.',
            'Some compounds are still called by long-established names that do not follow IUPAC rules. Many occur in synthesis and in the chemistry of drugs and natural compounds, so you must be able to read both names. Amino acids, carbohydrates, alkaloids and steroids in particular are often called by trivial names.'),
          src: 'L1 p50, T p10'
        },
        {
          table: {
            head: [t('Formulė', 'Formula'), t('Trivialusis pavadinimas', 'Trivial name'), t('Sisteminis pavadinimas', 'Systematic name')],
            rows: [
              [{ smi: 'C=C' }, t('etilenas', 'ethylene'), t('etenas', 'ethene')],
              [{ smi: 'C#C' }, t('acetilenas', 'acetylene'), t('etinas', 'ethyne')],
              [{ smi: 'ClC(Cl)Cl' }, t('chloroformas', 'chloroform'), t('trichlormetanas', 'trichloromethane')],
              [{ smi: 'ClC(Cl)(Cl)Cl' }, t('anglies tetrachloridas', 'carbon tetrachloride'), t('tetrachlormetanas', 'tetrachloromethane')],
              [{ smi: 'CCOCC' }, t('eteris (dietileteris)', 'ether (diethyl ether)'), t('etoksietanas', 'ethoxyethane')],
              [{ smi: 'CC(C)O' }, t('izopropanolis', 'isopropanol'), t('2-propanolis', 'propan-2-ol')],
              [{ smi: 'CC(C)=O' }, t('acetonas', 'acetone'), t('propanonas', 'propanone')],
              [{ smi: 'C=O' }, t('formaldehidas', 'formaldehyde'), t('metanalis', 'methanal')],
              [{ smi: 'CC(=O)OCC' }, t('etilacetatas', 'ethyl acetate'), t('etiletanoatas', 'ethyl ethanoate')],
              [{ smi: 'CN(C)C=O' }, t('dimetilformamidas', 'dimethylformamide'), t('N,N-dimetilmetanamidas', 'N,N-dimethylmethanamide')],
              [{ smi: 'Nc1ccccc1' }, t('anilinas', 'aniline'), t('benzenaminas', 'benzenamine')],
              [{ smi: 'OCc1ccccc1' }, t('benzilo alkoholis', 'benzyl alcohol'), t('fenilmetanolis', 'phenylmethanol')],
              [{ smi: 'OC(=O)C=Cc1ccccc1' }, t('cinamono rūgštis', 'cinnamic acid'), t('3-fenilpropeno rūgštis', '3-phenylpropenoic acid')]
            ]
          },
          src: 'L1 p51, S1.11, T p10-p12'
        },
        { h: t('Rūgštys gyvų organizmų apykaitoje', 'Acids in the metabolism of living organisms') },
        {
          p: t('Šios rūgštys ir jų anijonai susidaro gyvų organizmų apykaitoje, todėl biochemijoje jie beveik visada vadinami trivialiaisiais vardais. Druskų ir anijonų pavadinimai gaunami galūnę -o rūgštis pakeitus į -atai: oksalatai, malonatai, sukcinatai, glutaratai, laktatai, malatai, tartratai, citratai, piruvatai, acetilacetatai, oksalilacetatai, α-ketoglutaratai.',
            'These acids and their anions form in the metabolism of living organisms, so in biochemistry they are almost always called by trivial names. The names of the salts and anions are obtained by changing the ending -ic acid to -ate: oxalate, malonate, succinate, glutarate, lactate, malate, tartrate, citrate, pyruvate, acetoacetate, oxaloacetate, α-ketoglutarate.'),
          src: 'S1.14'
        },
        {
          table: {
            head: [t('Formulė', 'Formula'), t('Trivialusis pavadinimas', 'Trivial name'), t('Sisteminis pavadinimas', 'Systematic name')],
            rows: [
              [{ smi: 'OC(=O)C(O)=O' }, t('oksalo rūgštis (oksalatai)', 'oxalic acid (oxalates)'), t('etano dirūgštis', 'ethanedioic acid')],
              [{ smi: 'OC(=O)CC(O)=O' }, t('malono rūgštis (malonatai)', 'malonic acid (malonates)'), t('propano dirūgštis', 'propanedioic acid')],
              [{ smi: 'OC(=O)CCC(O)=O' }, t('gintaro rūgštis (sukcinatai)', 'succinic acid (succinates)'), t('butano dirūgštis', 'butanedioic acid')],
              [{ smi: 'OC(=O)CCCC(O)=O' }, t('glutaro rūgštis (glutaratai)', 'glutaric acid (glutarates)'), t('pentano dirūgštis', 'pentanedioic acid')],
              [{ smi: 'CC(O)C(O)=O' }, t('pieno rūgštis (laktatai)', 'lactic acid (lactates)'), t('2-hidroksipropano rūgštis', '2-hydroxypropanoic acid')],
              [{ smi: 'OC(=O)CC(O)C(O)=O' }, t('obuolių rūgštis (malatai)', 'malic acid (malates)'), t('2-hidroksibutano dirūgštis', '2-hydroxybutanedioic acid')],
              [{ smi: 'OC(=O)C(O)C(O)C(O)=O' }, t('vyno rūgštis (tartratai)', 'tartaric acid (tartrates)'), t('2,3-dihidroksibutano dirūgštis', '2,3-dihydroxybutanedioic acid')],
              [{ smi: 'CC(=O)C(O)=O' }, t('piruvo rūgštis (piruvatai)', 'pyruvic acid (pyruvates)'), t('2-oksopropano rūgštis', '2-oxopropanoic acid')],
              [{ smi: 'CC(=O)CC(O)=O' }, t('acetilacto rūgštis (acetilacetatai)', 'acetoacetic acid (acetoacetates)'), t('3-oksobutano rūgštis', '3-oxobutanoic acid')],
              [{ smi: 'OC(=O)CC(=O)C(O)=O' }, t('oksalilacto rūgštis (oksalilacetatai)', 'oxaloacetic acid (oxaloacetates)'), t('2-oksobutano dirūgštis', '2-oxobutanedioic acid')],
              [{ smi: 'OC(=O)CCC(=O)C(O)=O' }, t('α-ketoglutaro rūgštis (α-ketoglutaratai)', 'α-ketoglutaric acid (α-ketoglutarates)'), t('2-oksopentano dirūgštis', '2-oxopentanedioic acid')],
              [{ smi: 'OC(=O)CC(O)(CC(O)=O)C(O)=O' }, t('citrinų rūgštis (citratai)', 'citric acid (citrates)'), t('2-hidroksipropan-1,2,3-trikarboksirūgštis', '2-hydroxypropane-1,2,3-tricarboxylic acid')]
            ]
          },
          src: 'S1.14, T p12'
        },
        { h: t('Esteriai gamtoje', 'Esters in nature') },
        {
          p: t('Karboksirūgščių esteriai yra gana stabilūs, todėl jų nemažai gamtoje: jie sudaro vaisių ir žiedų aromatą. Metilbutanoatas kvepia ananasais, 3-metilbutiletanoatas – bananais, o butiletanoatas primena kriaušes.',
            'Esters of carboxylic acids are fairly stable, so quite a few occur in nature: they make up the aroma of fruits and flowers. Methyl butanoate smells of pineapple, 3-methylbutyl ethanoate of banana, and butyl ethanoate recalls pear.'),
          src: 'S1.12'
        },
        {
          mol: [{ smi: 'CCCC(=O)OC', name: t('metilbutanoatas', 'methyl butanoate') }, { smi: 'CC(=O)OCCC(C)C', name: t('3-metilbutiletanoatas', '3-methylbutyl ethanoate') }, { smi: 'CC(=O)OCCCC', name: t('butiletanoatas', 'butyl ethanoate') }],
          caption: t('Ananasų, bananų ir kriaušių esteriai.', 'The esters of pineapple, banana and pear.'), src: 'S1.12'
        },
        {
          pitfall: t('Trivialieji pavadinimai atrodo kaip sisteminiai, bet nėra: acetonas nėra „acetanas“, o acto rūgštis – ne „acetano rūgštis“. Todėl esteris iš acto rūgšties turi ir trivialų (etilacetatas), ir sisteminį (etiletanoatas) pavadinimą. Mokykitės abiejų.',
            'Trivial names can look systematic but are not: acetone is not “acetane”, and acetic acid is not “acetanoic acid”. So an ester of acetic acid has both a trivial (ethyl acetate) and a systematic (ethyl ethanoate) name. Learn both.'),
          src: 'L1 p50, p51'
        },
        { practice: 'u01.trivial' }
      ]
    }
  ];

  const SUMMARY = [
    { h: t('Formulės ir klasifikavimas', 'Formulas and classification') },
    {
      list: [
        t('Formulės: molekulinė (sudėtis), kondensuotoji (grupių eilė), brūkšninė (visi ryšiai), skeleto (tik skeletas ir heteroatomai). Valentingumai: $H$ ir halogenai – 1, $O$, $S$ – 2, $N$ – 3, $C$ – 4.', 'Formulas: molecular (composition), condensed (order of groups), structural (all bonds), skeletal (skeleton and heteroatoms only). Valences: $H$ and halogens – 1, $O$, $S$ – 2, $N$ – 3, $C$ – 4.'),
        t('$C$ atomo klasė = kaimynų $C$ skaičius: 1 – pirminis, 2 – antrinis, 3 – tretinis, 4 – ketvirtinis.', 'Class of a $C$ = number of $C$ neighbours: 1 – primary, 2 – secondary, 3 – tertiary, 4 – quaternary.'),
        t('Pagal grandinę: aciklinis ir ciklinis (karbo-, heterociklinis), sotusis, nesotusis, aromatinis. Pagal funkcinę grupę: klasės lentelėje žemiau.', 'By chain: acyclic and cyclic (carbo-, heterocyclic), saturated, unsaturated, aromatic. By functional group: the classes in the table below.')
      ], src: 'L1 p15-p25'
    },
    { h: t('Seniorumo eilė ir vardų priesagos', 'Seniority series and name endings') },
    {
      table: {
        head: [t('Grupė (nuo vyriausios)', 'Group (from the senior)'), t('Priesaga ar galūnė', 'Suffix or ending'), t('Priešdėlis', 'Prefix')],
        rows: [
          [t('karboksirūgštis $–COOH$', 'carboxylic acid $–COOH$'), t('-o rūgštis; -karboksirūgštis', '-oic acid; -carboxylic acid'), t('karboksi-', 'carboxy-')],
          [t('sulfonrūgštis $–SO3H$', 'sulfonic acid $–SO3H$'), t('-sulfonrūgštis', '-sulfonic acid'), t('sulfo-', 'sulfo-')],
          [t('druska; anhidridas; esteris', 'salt; anhydride; ester'), t('-oatas; anhidridas; -oatas', '-oate; anhydride; -oate'), t('alkoksikarbonil-', 'alkoxycarbonyl-')],
          [t('halogenanhidridas; amidas; nitrilas', 'acyl halide; amide; nitrile'), t('-oilhalogenidas; -amidas; -nitrilas', '-oyl halide; -amide; -nitrile'), t('haloformil-; karbamoil-; cian-', 'haloformyl-; carbamoyl-; cyano-')],
          [t('aldehidas; ketonas', 'aldehyde; ketone'), t('-alis; -onas', '-al; -one'), t('formil-, okso-; okso-', 'formyl-, oxo-; oxo-')],
          [t('alkoholis; tiolis; aminas', 'alcohol; thiol; amine'), t('-olis; -tiolis; -aminas', '-ol; -thiol; -amine'), t('hidroksi-; merkapto-; amino-', 'hydroxy-; mercapto-; amino-')],
          [t('$C=C$; $C≡C$', '$C=C$; $C≡C$'), t('-enas; -inas', '-ene; -yne'), t('–', '–')],
          [t('tik priešdėliai', 'prefix only'), t('–', '–'), t('halogeno, alkoksi-, alkiltio-, nitro-', 'halo, alkoxy-, alkylthio-, nitro-')]
        ]
      },
      src: 'L1 p52, p53'
    },
    { h: t('Vardo sudarymas', 'Building a name') },
    {
      list: [
        t('1) vyriausioji grupė; 2) pagrindinė grandinė (a daugiausia grupių, b daugiausia $C=C$ ir $C≡C$, c ilgiausia, d daugiausia pakaitų); 3) numeravimas: grupė, tada pakaitai gauna mažiausius lokantus; 4) šaknis + -an, -en, -in + galūnė; 5) pakaitai abėcėlės tvarka, $di$-, $tri$-.', '1) the senior group; 2) the main chain (a most groups, b most $C=C$ and $C≡C$, c longest, d most substituents); 3) numbering: the group, then the substituents get the lowest locants; 4) root + -ane, -ene, -yne + ending; 5) substituents alphabetically, $di$-, $tri$-.'),
        t('Esteris: alkilas + rūgšties dalis (-oatas); druska: metalas + -oatas; prie žiedo prijungta grupė: priesaga su -karbo-.', 'Ester: alkyl + acid part (-oate); salt: metal + -oate; a group on a ring: the suffix with -carbo-.'),
        t('Aminas: -aminas, pakaitai ant azoto žymimi $N$-; fenolis, alkoholis, tiolis: -olis, -tiolis.', 'Amine: -amine, substituents on nitrogen marked $N$-; phenol, alcohol, thiol: -ol, -thiol.')
      ], src: 'L1 p52-p58'
    },
    { h: t('Dažniausios klaidos', 'Typical mistakes') },
    {
      list: [
        t('Ilgiausia grandinė pasirenkama, nors neapima vyriausiosios grupės.', 'The longest chain is chosen although it misses the senior group.'),
        t('Numeruojama nuo netinkamo galo arba pakaitai surašomi ne abėcėlės tvarka.', 'Numbering from the wrong end, or substituents listed out of alphabetical order.'),
        t('Alkoholio ir fenolio ($–OH$ prie žiedo), amino ir amido grupių painiojimas; trivialių ir sisteminių pavadinimų maišymas.', 'Confusing alcohol and phenol ($–OH$ on a ring), amino and amide groups; mixing trivial and systematic names.')
      ]
    }
  ];

  /* ---------- exercise types ---------- */
  const CAD = { lt: ['', 'pirminius', 'antrinius', 'tretinius', 'ketvirtinius'], ltg: ['', 'pirminių', 'antrinių', 'tretinių', 'ketvirtinių'], en: ['', 'primary', 'secondary', 'tertiary', 'quaternary'] };
  let namePoolCache = null;
  let acylPoolCache = null;

  // a valence problem: which condensed formula is wrong
  function valProblem(n, opts, wrong, why, sol, q) {
    return {
      id: 'u01.valence.' + n,
      q: [{ p: q || t('Kuri iš šių kondensuotųjų formulių parašyta neteisingai, nes pažeidžia valentingumo taisyklę?', 'Which of these condensed formulas is written incorrectly because it violates the valence rule?') }],
      steps: [{
        prompt: t('Pasirinkite neteisingą formulę.', 'Pick the incorrect formula.'),
        kind: 'choice', options: opts.map((o) => ({ text: f('$' + o + '$') })), answer: wrong,
        hint: t('Suskaičiuokite ryšius prie kiekvieno atomo ir palyginkite su valentingumu (vandenilis ir halogenai 1, deguonis bei siera 2, azotas 3, anglis 4). Dvigubasis ryšys užima du valentingumus.', 'Count the bonds at every atom and compare them with its valence (hydrogen and halogens 1, oxygen and sulfur 2, nitrogen 3, carbon 4). A double bond uses two valences.'),
        solution: sol
      }],
      why, src: 'L1 p21'
    };
  }

  const TYPES = [
    /* ============================================================ u01.valence */
    {
      id: 'u01.valence',
      title: t('Formulės ir valentingumas: kuri formulė neteisinga?', 'Formulas and valence: which formula is wrong?'),
      mirrors: [],
      bank: [
        valProblem(1, ['CH3CH=CH2', 'CH3CH2CH2OH', 'CH3CH2=CH2', 'CH3CH(OH)CH3'], 2,
          t('Kiekvieno elemento atomas sudaro tiek ryšių, kokia yra jo valentingumo vertė: anglis – keturis. Dvigubasis ryšys užima du iš keturių.', 'Every atom forms as many bonds as its valence: carbon four. A double bond takes up two of the four.'),
          t('Antroji grupė $CH2$ turi du $H$, dvigubąjį ryšį (du) ir dar vieną vienkartinį: iš viso penki ryšiai. Teisingai rašoma $CH3CH=CH2$.', 'The second $CH2$ group has two $H$, a double bond (two) and one more single bond: five bonds in all. The correct formula is $CH3CH=CH2$.')),
        valProblem(2, ['CH3CH2NH2', '(CH3)2NH', '(CH3)3N', 'CH3CH2NH3'], 3,
          t('Azotas organiniuose junginiuose sudaro tris kovalentinius ryšius (be krūvio).', 'Nitrogen in neutral organic compounds forms three covalent bonds.'),
          t('Formulėje $CH3CH2NH3$ azotas turėtų ryšį su $C$ ir trimis $H$: keturi ryšiai. Teisinga amino grupė: $–NH2$.', 'In $CH3CH2NH3$ nitrogen would bond to $C$ and three $H$: four bonds. The correct amino group is $–NH2$.')),
        valProblem(3, ['CH3CH2OH', 'CH3OCH3', 'HOCH2CH2OH', 'CH3CH2OH2'], 3,
          t('Deguonis sudaro du ryšius: arba du vienkartinius, arba vieną dvigubąjį.', 'Oxygen forms two bonds: either two single bonds or one double bond.'),
          t('$CH3CH2OH2$: deguonis susijungęs su $C$ ir dviem $H$, tai trys ryšiai. Hidroksilo grupė rašoma $–OH$.', '$CH3CH2OH2$: oxygen is bonded to $C$ and two $H$, three bonds. The hydroxyl group is written $–OH$.')),
        valProblem(4, ['CH3CHCl2', 'CH3CCl2CH3', 'ClCH2CH2Cl', 'CH3CHCl2CH3'], 3,
          t('Halogenas sudaro vieną ryšį, todėl jis niekada netampa „tiltu“ tarp dviejų atomų.', 'A halogen forms one bond, so it is never a bridge between two atoms.'),
          t('Viduriniame $CH3CHCl2CH3$ atome būtų penki ryšiai: du su $CH3$, vienas su $H$ ir du su $Cl$. Du chlorai ir du metilai tuo pačiu atomu galimi tik be vandenilio: $CH3CCl2CH3$.', 'The middle atom of $CH3CHCl2CH3$ would have five bonds: two to $CH3$, one to $H$ and two to $Cl$. Two chlorines and two methyls on one carbon are possible only without hydrogen: $CH3CCl2CH3$.')),
        valProblem(5, ['CH3CH2CHO', 'CH3COCH3', 'CH3CH2COOH', 'CH3CH2COH'], 3,
          t('Karbonilo anglis turi dvigubąjį ryšį su deguonimi ir dar du vienkartinius.', 'A carbonyl carbon has a double bond to oxygen and two more single bonds.'),
          t('Rašant $CH3CH2COH$, anglis turi tik tris ryšius (su $CH2$, $O$ ir $H$), o dvigubasis ryšys $C=O$ nepažymėtas. Aldehidų grupė rašoma $–CHO$, o $–COH$ yra dažna klaida.', 'In $CH3CH2COH$ the carbon has only three bonds (to $CH2$, $O$ and $H$) and the $C=O$ double bond is not shown. The aldehyde group is written $–CHO$; $–COH$ is a common mistake.')),
        valProblem(6, ['CH3C≡CH', 'CH3C≡CCH3', 'HC≡CH', 'CH3C≡CH2'], 3,
          t('Trigubasis ryšys užima tris iš keturių anglies valentingumų: lieka tik vienas vienkartinis ryšys.', 'A triple bond uses three of the four carbon valences: only one single bond is left.'),
          t('$C≡CH2$ galinis anglies atomas turėtų tris ryšius trigubajame ir dar du su $H$: penki. Teisingai: $CH3C≡CH$.', 'In $C≡CH2$ the end carbon would have three bonds in the triple bond and two to $H$: five. Correct: $CH3C≡CH$.')),
        valProblem(7, ['CH3SH', 'CH3SCH3', 'CH3SSCH3', 'CH3CH2SH2'], 3,
          t('Siera organiniuose junginiuose, kaip ir deguonis, dažniausiai sudaro du ryšius (turi ir valentingumus 4 bei 6).', 'Sulfur in organic compounds, like oxygen, usually forms two bonds (it also has valences 4 and 6).'),
          t('$CH3CH2SH2$: siera turėtų tris ryšius, o nelyginio skaičiaus ryšių siera neturi. Tiolio grupė rašoma $–SH$.', '$CH3CH2SH2$: sulfur would have three bonds, and sulfur never has an odd number. The thiol group is written $–SH$.')),
        valProblem(8, ['CH3CONH2', 'CH3CONHCH3', 'CH3CON(CH3)2', 'CH3CONH3'], 3,
          t('Amidų azotas, kaip ir aminų, turi tris ryšius.', 'The nitrogen of an amide, like that of an amine, has three bonds.'),
          t('$CH3CONH3$: azotas turėtų ryšį su $C$ ir trimis $H$: keturis. Pirminio amido grupė yra $–CONH2$.', '$CH3CONH3$: nitrogen would bond to $C$ and three $H$: four bonds. The primary amide group is $–CONH2$.')),
        valProblem(9, ['C4H10', 'C5H12', 'C3H9', 'C6H6'], 2,
          t('Angliavandenilių molekulinę formulę riboja valentingumas: sotus aciklinis $CnH2n+2$ yra didžiausias galimas $H$ skaičius, o dvigubi ryšiai ir ciklai $H$ skaičių mažina po du.', 'Valence limits the molecular formula of a hydrocarbon: a saturated acyclic $CnH2n+2$ is the largest possible number of $H$, and double bonds and rings remove $H$ in twos.'),
          t('$C3H9$ turėtų devynis vandenilius, o propanas turi aštuonis ($C3H8$). $C4H10$ ir $C5H12$ yra alkanai, $C6H6$ – benzenas.', '$C3H9$ would need nine hydrogens, but propane has eight ($C3H8$). $C4H10$ and $C5H12$ are alkanes, $C6H6$ is benzene.'),
          t('Kuri molekulinė formulė negali priklausyti neutraliam angliavandeniliui?', 'Which molecular formula cannot belong to a neutral hydrocarbon?'))
      ]
    },

    /* ============================================================ u01.formulas */
    {
      id: 'u01.formulas',
      title: t('Formulių rūšys ir perėjimas nuo vienos prie kitos', 'Types of formula and converting between them'),
      mirrors: ['S1.3', 'S1.5'],
      gen(rng, ctx) {
        const { chem, draw } = ctx;
        const cond = (s) => '$' + draw.condensed(chem.parse(s)) + '$';
        const v = ctx.int(0, 3);
        if (v === 2) {
          const e = ctx.pick(DRUGS.concat(BIO));
          const m = chem.parse(e[0]);
          const hetero = m.atoms.filter((a) => a.el !== 'C').length;
          return {
            q: [{ p: t('Pateikta organinės medžiagos skeleto formulė.', 'The skeletal formula of an organic compound is shown.') }, { mol: { smi: e[0] }, caption: t(e[1], e[2]) }],
            steps: [
              {
                prompt: t('Parašykite molekulinę formulę.', 'Write the molecular formula.'),
                kind: 'formula', mol: { smi: e[0] }, answer: formulaOf(ctx, e[0]),
                hint: t('Suskaičiuokite kiekvieno elemento atomus: kiekviena linijų sankirta ar galas yra $C$, o vandenilių skaičių nusako valentingumas (anglis – keturi ryšiai).', 'Count the atoms of every element: each corner or line end is a $C$, and the number of hydrogens follows from valence (carbon has four bonds).'),
                solution: t('Atomų skaičius: ' + atomCounts(ctx, e[0]) + '. Vandenilių skaičių lemia valentingumas: anglis turi turėti keturis ryšius. Formulė: $' + formulaOf(ctx, e[0]) + '$.', 'Atom counts: ' + atomCounts(ctx, e[0]) + '. The number of hydrogens follows from valence: every carbon must have four bonds. Formula: $' + formulaOf(ctx, e[0]) + '$.')
              },
              {
                prompt: t('Kiek heteroatomų (ne $C$ ir ne $H$) yra molekulėje?', 'How many heteroatoms (neither $C$ nor $H$) does the molecule contain?'),
                kind: 'number', answer: { value: hetero, tol: 0 },
                hint: t('Heteroatomu laikomas kiekvienas molekulės atomas, kuris nėra nei anglis, nei vandenilis.', 'A heteroatom is every atom of the molecule that is neither carbon nor hydrogen.'),
                solution: t('Heteroatomų: ' + hetero + ' (formulėje visi elementai, išskyrus $C$ ir $H$).', 'Heteroatoms: ' + hetero + ' (every element in the formula except $C$ and $H$).')
              }
            ],
            why: t('Skeleto formulėje anglies atomai ir vandenilis nepažymimi: viršūnės ir galai yra $C$, o $H$ skaičių papildo valentingumas. Pagal tai gaunama molekulinė formulė, kurioje matyti tik atomų skaičius, o ne sandara.', 'In a skeletal formula carbon atoms and hydrogens are not marked: corners and ends are $C$, and valence fills in the $H$. This gives the molecular formula, which shows only the number of atoms, not the structure.'),
            src: 'L1 p15, S1.3, S1.5'
          };
        }
        if (v === 3) {
          const small = ISO.reduce((a, b) => a.concat(b), []).filter((s) => chem.parse(s).atoms.length <= 6);
          const r = ctx.int(0, 3);
          const ro = r === 1 ? { condensed: true } : r === 2 ? { allH: true } : {};
          let smi = null;
          for (let i = 0; i < 40 && !smi; i++) { const c = ctx.pick(small); if (r === 0 || clean(ctx, c, ro)) smi = c; }
          if (!smi) throw new Error('u01.formulas: no clean drawing');
          const q = r === 0 ? { p: t('Junginys užrašytas formule $' + formulaOf(ctx, smi) + '$.', 'A compound is written with the formula $' + formulaOf(ctx, smi) + '$.') }
            : { mol: { smi, opts: ro } };
          return {
            q: [r === 0 ? q : { p: t('Žemiau pavaizduota junginio formulė.', 'The formula of a compound is shown below.') }].concat(r === 0 ? [] : [q]),
            steps: [{
              prompt: t('Kokio tipo ši formulė?', 'What type of formula is this?'),
              kind: 'choice',
              options: [tx('molekulinė', 'molecular'), tx('kondensuotoji', 'condensed'), tx('brūkšninė (struktūrinė)', 'structural (every bond drawn)'), tx('skeleto', 'skeletal')],
              answer: r,
              hint: t('Pažiūrėkite, ką formulė rodo: tik atomų skaičių, grupes eilute, kiekvieną ryšį ar tik anglies skeletą.', 'Look at what the formula shows: only the atom counts, groups written in a row, every bond, or only the carbon skeleton.'),
              solution: [t('Molekulinė formulė rodo tik atomų skaičių.', 'A molecular formula shows only the atom counts.'), t('Kondensuotoji formulė rašo grupes eilute ($CH3CH2OH$).', 'A condensed formula writes the groups in a row ($CH3CH2OH$).'), t('Brūkšninėje formulėje nubraižytas kiekvienas ryšys ir kiekvienas atomas.', 'A structural formula draws every bond and every atom.'), t('Skeleto formulėje nubraižytas tik anglies skeletas ir heteroatomai.', 'A skeletal formula draws only the carbon skeleton and the heteroatoms.')][r]
            }],
            why: t('Keturios formulių rūšys rodo vis daugiau: molekulinė – sudėtį, kondensuotoji – grupių eilę, brūkšninė – visus ryšius, skeleto – tik anglies grandinę su heteroatomais.', 'The four formula types show progressively more: molecular – the composition, condensed – the order of the groups, structural – all bonds, skeletal – only the carbon chain with the heteroatoms.'),
            src: 'L1 p15, T p7'
          };
        }
        let g, target, others, opts0;
        for (let tries = 0; tries < 30; tries++) {
          g = ctx.pick(ISO.filter((x) => x.length >= 3));
          target = ctx.pick(g);
          others = ctx.shuffle(g.filter((s) => s !== target)).slice(0, 3);
          opts0 = [cond(target)].concat(others.map(cond));
          if (v !== 0 || new Set(opts0).size === opts0.length) break;
          g = null;
        }
        if (!g) throw new Error('u01.formulas: equal condensed formulas');
        if (v === 0) {
          const opts = opts0;
          return {
            q: [{ p: t('Pateikta organinio junginio skeleto formulė.', 'The skeletal formula of an organic compound is shown.') }, { mol: { smi: target } }],
            steps: [
              {
                prompt: t('Parašykite molekulinę formulę.', 'Write the molecular formula.'),
                kind: 'formula', mol: { smi: target }, answer: formulaOf(ctx, target),
                hint: t('Suskaičiuokite $C$ (kiekviena viršūnė ar galas), tada heteroatomus; vandenilių skaičių lemia valentingumas.', 'Count the $C$ (every corner or end), then the heteroatoms; the number of hydrogens follows from valence.'),
                solution: t('Atomų skaičius: ' + atomCounts(ctx, target) + '. Formulė: $' + formulaOf(ctx, target) + '$.', 'Atom counts: ' + atomCounts(ctx, target) + '. Formula: $' + formulaOf(ctx, target) + '$.')
              },
              {
                prompt: t('Kuri kondensuotoji formulė atitinka šią struktūrą? Visos turi tą pačią molekulinę formulę.', 'Which condensed formula matches this structure? All have the same molecular formula.'),
                kind: 'choice', options: opts.map((o) => ({ text: f(o) })), answer: 0,
                hint: t('Eikite per skeletą iš vieno galo ir rašykite kiekvieną grupę su savo $H$ skaičiumi.', 'Walk along the skeleton from one end and write each group with its number of $H$.'),
                solution: t('Einant per skeletą, kiekviena viršūnė virsta grupe su savo vandenilių skaičiumi: ' + opts[0] + '.', 'Walking along the skeleton, every vertex becomes a group with its own number of hydrogens: ' + opts[0] + '.')
              }
            ],
            why: t('Izomerų molekulinė formulė ta pati, todėl iš jos nematyti, kokia yra sandara. Kondensuotoji formulė jau rodo, kaip jungiasi grupės.', 'Isomers have the same molecular formula, so it does not show the structure. A condensed formula already shows how the groups are joined.'),
            src: 'L1 p15, T p7'
          };
        }
        const opts = [mo(target)].concat(others.map((s) => mo(s)));
        return {
          q: [{ p: t('Junginio kondensuotoji formulė: ' + cond(target) + '.', 'The condensed formula of a compound: ' + cond(target) + '.') }],
          steps: [{
            prompt: t('Kuri skeleto formulė atitinka šią kondensuotąją formulę?', 'Which skeletal formula matches this condensed formula?'),
            kind: 'choice', options: opts, answer: 0,
            hint: t('Nubraižykite grandinę pagal grupių eilę ir pažiūrėkite, kur atsiranda šakos ir funkcinė grupė.', 'Draw the chain in the order of the groups and see where the branches and the functional group fall.'),
            solution: [{ p: t('Skeleto formulėje kiekviena $CH3$, $CH2$ ar $CH$ grupė yra viršūnė ar galas; grupės skliaustuose yra šakos.', 'In a skeletal formula every $CH3$, $CH2$ or $CH$ group is a vertex or an end; groups in brackets are branches.') }, mo(target)]
          }],
          why: t('Kondensuotoji ir skeleto formulės rodo tą pačią sandarą: grupės eilė virsta laužte, o skliausteliuose esančios grupės – šakomis.', 'Condensed and skeletal formulas show the same structure: the order of groups becomes the zigzag, and the groups in brackets become branches.'),
          src: 'L1 p15, p17'
        };
      }
    },

    /* ============================================================ u01.carbons */
    {
      id: 'u01.carbons',
      title: t('Pirminiai, antriniai, tretiniai ir ketvirtiniai C atomai', 'Primary, secondary, tertiary and quaternary carbons'),
      mirrors: ['S1.1'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const smi = ctx.pick(CARBS);
        const m = chem.parse(smi);
        const cls = m.atoms.map((a, i) => (a.el === 'C' ? chem.carbonClass(m, i) : 0));
        const present = [1, 2, 3, 4].filter((k) => cls.indexOf(k) >= 0);
        const k = ctx.pick(present);
        const rest = present.filter((x) => x !== k);
        const j = ctx.pick(rest);
        const count = cls.filter((x) => x === j).length;
        const idx = cls.map((x, i) => (x === k ? i + 1 : -1)).filter((x) => x > 0);
        const steps = [
          {
            prompt: t('Bakstelėkite visus ' + CAD.lt[k] + ' C atomus.', 'Tap all the ' + CAD.en[k] + ' carbons.'),
            kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, from: 'carbon:' + k,
            hint: t('Anglies klasę nusako, su kiek kitų $C$ atomų ji susijungusi: su vienu – pirminė, su dviem – antrinė, su trimis – tretinė, su keturiais – ketvirtinė.', 'The class of a carbon is set by how many other $C$ atoms it is bonded to: one – primary, two – secondary, three – tertiary, four – quaternary.'),
            solution: t('Šie atomai (Nr. ' + idx.join(', ') + ') turi po ' + ['', 'vieną', 'du', 'tris', 'keturis'][k] + ' anglies kaimyn' + (k === 1 ? 'ą' : 'us') + '.', 'These atoms (no. ' + idx.join(', ') + ') have ' + k + ' carbon neighbour' + (k > 1 ? 's' : '') + ' each.')
          },
          {
            prompt: t('Kiek šioje molekulėje yra ' + CAD.ltg[j] + ' C atomų?', 'How many ' + CAD.en[j] + ' carbons does this molecule have?'),
            kind: 'number', answer: { value: count, tol: 0 },
            hint: t('Pereikite per visus anglies atomus ir kiekvienam suskaičiuokite kaimynus, kurie taip pat yra $C$. Vandenilių ir heteroatomų neskaičiuokite.', 'Go through all the carbons and count each one\'s neighbours that are also $C$. Do not count hydrogens or heteroatoms.'),
            solution: t('Tokių atomų yra ' + count + '.', 'There are ' + count + ' of them.')
          }
        ];
        const ns = nameStep(ctx, smi);
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Pateiktas alkanas; atomai sunumeruoti.', 'An alkane is shown; the atoms are numbered.') }, { mol: { smi, opts: { numbers: 'all' } } }],
          steps,
          why: t('Anglies klasė priklauso tik nuo to, kiek kitų anglies atomų ji turi gretimai: vandenilis ir heteroatomai neskaičiuojami. Todėl $CH3$ grupė, sujungta su kita anglimi, yra pirminė, o alkane anglis be vandenilio – ketvirtinė.', 'The class of a carbon depends only on how many other carbons are next to it: hydrogen and heteroatoms do not count. So a $CH3$ group bonded to another carbon is primary, and in an alkane a carbon without hydrogen is quaternary.'),
          src: 'L1 p22, S1.1'
        };
      }
    },

    /* ============================================================ u01.alkane */
    {
      id: 'u01.alkane',
      title: t('Alkanas pagal anglies atomų aprašymą', 'The alkane that fits a description of its carbons'),
      mirrors: ['S1.2'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const count = (cls, k) => cls.filter((x) => x === k).length;
        const methylN = (m, i) => m.nbr[i].filter((j) => m.atoms[j].el === 'C' && m.nbr[j].length === 1).length;
        const PRED = [
          { lt: 'turi du tretinius C atomus', en: 'has two tertiary carbons', ok: (m, c) => count(c, 3) === 2 },
          { lt: 'turi izopropilo grupę $(CH3)2CH–$', en: 'contains an isopropyl group $(CH3)2CH–$', ok: (m, c) => c.some((x, i) => x === 3 && methylN(m, i) >= 2) },
          { lt: 'turi vieną ketvirtinį ir vieną antrinį C atomą', en: 'has one quaternary and one secondary carbon', ok: (m, c) => count(c, 4) === 1 && count(c, 2) === 1 },
          { lt: 'neturi antrinių C atomų', en: 'has no secondary carbons', ok: (m, c) => count(c, 2) === 0 },
          { lt: 'turi tret-butilo grupę $–C(CH3)3$', en: 'contains a tert-butyl group $–C(CH3)3$', ok: (m, c) => c.some((x, i) => x === 4 && methylN(m, i) >= 3) },
          { lt: 'turi vieną tretinį C atomą ir neturi ketvirtinių', en: 'has one tertiary carbon and no quaternary carbon', ok: (m, c) => count(c, 3) === 1 && count(c, 4) === 0 }
        ];
        let pick = null;
        for (let tries = 0; tries < 60 && !pick; tries++) {
          const pr = ctx.pick(PRED);
          const g = ctx.pick(ALK);
          const ok = g.filter((s) => { const m = chem.parse(s); return pr.ok(m, m.atoms.map((a, i) => chem.carbonClass(m, i))); });
          const bad = g.filter((s) => ok.indexOf(s) < 0);
          if (!ok.length || bad.length < 3) continue;
          pick = { pr, right: ctx.pick(ok), wrong: ctx.shuffle(bad).slice(0, 3) };
        }
        if (!pick) throw new Error('u01.alkane: no problem found');
        const rm = chem.parse(pick.right);
        const rc = rm.atoms.map((a, i) => chem.carbonClass(rm, i));
        const steps = [{
          prompt: t('Kuris iš šių alkanų atitinka aprašymą?', 'Which of these alkanes fits the description?'),
          kind: 'choice', options: [pick.right].concat(pick.wrong).map((s) => mo(s)), answer: 0,
          hint: t('Kiekvienam variantui nustatykite visų anglies atomų klases pagal tai, kiek kaimynų $C$ jie turi.', 'For every option work out the class of each carbon from the number of $C$ neighbours it has.'),
          solution: t('Tinkamo alkano anglys: pirminių ' + count(rc, 1) + ', antrinių ' + count(rc, 2) + ', tretinių ' + count(rc, 3) + ', ketvirtinių ' + count(rc, 4) + '. Kiti variantai aprašymo neatitinka.', 'The carbons of the right alkane: primary ' + count(rc, 1) + ', secondary ' + count(rc, 2) + ', tertiary ' + count(rc, 3) + ', quaternary ' + count(rc, 4) + '. The other options do not fit.')
        }];
        const ns = nameStep(ctx, pick.right, t('Pavadinkite pasirinktą alkaną.', 'Name the alkane you chose.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Pasirinkite alkaną, kuris ' + pick.pr.lt + '. Visų variantų molekulinė formulė ta pati.', 'Choose the alkane that ' + pick.pr.en + '. All the options have the same molecular formula.') }],
          steps,
          why: t('Izomerų formulė ta pati, todėl juos skiria tik šakojimosi tipas. Anglies klasė parodo, kiek šakų palieka atomas: tretinė anglis yra šakos viršūnė, ketvirtinė – dviguba šakos viršūnė.', 'Isomers have the same formula, so only the pattern of branching tells them apart. The class of a carbon shows how many branches meet at it: a tertiary carbon is a branch point, a quaternary one a double branch point.'),
          src: 'L1 p22, S1.2'
        };
      }
    },

    /* ============================================================ u01.classify */
    {
      id: 'u01.classify',
      title: t('Klasifikavimas pagal grandinės tipą ir funkcinę grupę', 'Classification by chain type and by functional group'),
      mirrors: [],
      gen(rng, ctx) {
        const { chem } = ctx;
        const e = ctx.pick(CHAINS);
        const m = chem.parse(e[0]);
        const rg = chem.rings(m);
        const hetero = rg.some((r) => r.some((i) => m.atoms[i].el !== 'C'));
        const aromatic = m.atoms.some((a) => a.aromatic);
        if ((e[1] === 0) === (rg.length > 0) || (e[1] === 2) !== hetero || (e[2] === 2) !== aromatic) throw new Error('u01.classify: pool entry does not match the engine: ' + e[0]);
        const steps = [
          {
            prompt: t('Ar grandinė atvira, ar uždara, ir ar žiede yra heteroatomų?', 'Is the chain open or closed, and does the ring contain heteroatoms?'),
            kind: 'choice', options: [tx('aciklinis (atvira grandinė)', 'acyclic (open chain)'), tx('karbociklinis (žiedas iš anglies atomų)', 'carbocyclic (ring of carbon atoms only)'), tx('heterociklinis (žiede yra heteroatomų)', 'heterocyclic (the ring contains heteroatoms)')], answer: e[1],
            hint: t('Pažiūrėkite, ar yra uždaras žiedas ir ar jo atomai visi yra $C$.', 'See whether there is a closed ring and whether all its atoms are $C$.'),
            solution: [t('Grandinė atvira, žiedo nėra: aciklinis junginys.', 'The chain is open and there is no ring: an acyclic compound.'), t('Žiedą sudaro tik anglies atomai: karbociklinis junginys.', 'The ring is made of carbon atoms only: a carbocyclic compound.'), t('Žiede yra heteroatomas: heterociklinis junginys.', 'The ring contains a heteroatom: a heterocyclic compound.')][e[1]]
          },
          {
            prompt: t('Koks yra anglies karkaso sotumas?', 'What is the saturation of the carbon skeleton?'),
            kind: 'choice', options: [tx('sotusis (tik vienkartiniai ryšiai)', 'saturated (single bonds only)'), tx('nesotusis, bet nearomatinis ($C=C$ ar $C≡C$)', 'unsaturated but not aromatic ($C=C$ or $C≡C$)'), tx('aromatinis (konjuguota $π$ sistema žiede)', 'aromatic (a conjugated $π$ system in the ring)')], answer: e[2],
            hint: t('Ieškokite dvigubųjų ar trigubųjų ryšių. Jei jie sudaro šešių narių ciklą su šešiais $π$ elektronais, tai jau aromatinė sistema.', 'Look for double or triple bonds. If they form a ring with six $π$ electrons, that is an aromatic system.'),
            solution: [t('Visi ryšiai vienkartiniai: sotusis junginys.', 'All bonds are single: a saturated compound.'), t('Yra $C=C$ ar $C≡C$, bet nėra aromatinės sistemos: nesotusis junginys.', 'There is a $C=C$ or $C≡C$ but no aromatic system: an unsaturated compound.'), t('Žiedas aromatinis: konjuguota $π$ sistema.', 'The ring is aromatic: a conjugated $π$ system.')][e[2]]
          }
        ];
        if (e[3]) steps.push(classStep(e[3], t('Kuriai klasei junginys priklauso pagal funkcinę grupę?', 'Which class does the compound belong to by its functional group?')));
        return {
          q: [{ p: t('Pateiktas junginys.', 'A compound is shown.') }, { mol: { smi: e[0] } }],
          steps,
          why: t('Žiūrint į anglies skeletą, junginiai būna aciklinis ar ciklinis (karbo- ar heterociklinis), o sotumas juos dar skiria į sočiuosius, nesočiuosius ir aromatinius. Pagal funkcinę grupę skirstoma į klases (alkoholiai, aminai ir kt.).', 'By the type of carbon chain, compounds are acyclic or cyclic (carbocyclic and heterocyclic), and saturation splits them into saturated, unsaturated and aromatic. By functional group they fall into classes (alcohols, amines and so on).'),
          src: 'L1 p24'
        };
      }
    },

    /* ============================================================ u01.fgroups */
    {
      id: 'u01.fgroups',
      title: t('Funkcinės grupės vaistuose ir gamtiniuose junginiuose', 'Functional groups in drugs and natural compounds'),
      mirrors: ['S1.3', 'S1.6', 'S1.9', 'S1.10'],
      gen(rng, ctx) {
        const e = ctx.pick(DRUGS);
        const smi = e[0];
        const keys = groupKeys(ctx, smi).filter((k) => k !== 'alkane');
        const extras = [];
        keys.forEach((k) => (CONFUSE[k] || []).forEach((c) => { const ck = gkey(c); if (keys.indexOf(ck) < 0 && extras.indexOf(ck) < 0 && ck !== 'alkane') extras.push(ck); }));
        const opts = keys.concat(ctx.shuffle(extras).slice(0, Math.max(2, 6 - keys.length)));
        const top = classKey(ctx, smi);
        const ranked = keys.filter((k) => G[k].rank < 30);
        const steps = [
          {
            prompt: t('Pažymėkite visas molekulėje esančias funkcines grupes.', 'Tick every functional group present in the molecule.'),
            kind: 'multi', options: opts.map((k) => ({ text: gLabel(k) })), answer: keys.map((k, i) => i),
            hint: t('Eikite per molekulę atomas po atomo ir atpažinkite grupes. Atskirkite alkoholį nuo fenolio (kur prijungta $–OH$), esterį nuo rūgšties ir amidą nuo amino.', 'Go through the molecule atom by atom and recognise the groups. Tell alcohol from phenol (where $–OH$ is attached), ester from acid, and amide from amine.'),
            solution: t('Molekulėje yra: ' + listLt(keys) + '.', 'The molecule contains: ' + listEn(keys) + '.')
          },
          classStep(top, t('Kuriai klasei junginys priskiriamas pagal vyriausiąją funkcinę grupę?', 'Which class is the compound assigned to by its senior functional group?'))
        ];
        steps[1].hint = t('Palyginkite rastas grupes pagal vyresniškumą: karboksirūgštys vyresnės už esterius, jie už amidus, šie už aldehidus ir ketonus, tie už alkoholius ir aminus, o dvigubieji ryšiai – žemiausiai.', 'Compare the groups you found by seniority: carboxylic acids outrank esters, those amides, those aldehydes and ketones, those alcohols and amines, and double bonds come last.');
        if (ranked.length >= 3 && ranked.length <= 6) {
          steps.push({
            prompt: t('Išdėstykite tos molekulės grupes nuo vyriausios iki jauniausios.', 'Put the groups of this molecule in order from the senior to the junior.'),
            kind: 'order', options: ranked.map((k) => tx(G[k].lt, G[k].en)),
            hint: t('Naudokitės vyresniškumo eile, kurią pavadinimo taisyklės taiko pasirenkant priesagą.', 'Use the seniority series the naming rules apply when choosing the suffix.'),
            solution: t('Eilė: ' + ranked.map((k) => G[k].lt).join(' > ') + '.', 'Order: ' + ranked.map((k) => G[k].en).join(' > ') + '.')
          });
        }
        const ns = nameStep(ctx, smi);
        const nmv = nameOf(ctx, smi);
        if (ns && nmv && nmv.en.length <= 60 && nmv.lt.length <= 60) steps.push(ns);
        return {
          q: [{ p: t('Šios fiziologiškai aktyvios medžiagos formulė pateikta žemiau.', 'The formula of this physiologically active compound is shown below.') }, { mol: { smi }, caption: t(e[1], e[2]) }],
          steps,
          why: t('Funkcinė grupė lemia junginio chemines savybes. Jei grupių yra kelios, junginys priskiriamas klasei pagal vyriausiąją, o kitos paminimos priešdėliais.', 'The functional group sets the chemical properties of a compound. If there are several, the compound is assigned to the class of the senior one, and the others are mentioned in prefixes.'),
          src: 'L1 p25, p47, p48, p52, S1.6 (drug names are shown, not asked, when they are long)'
        };
      }
    },

    /* ============================================================ u01.senior */
    {
      id: 'u01.senior',
      title: t('Vyriausioji grupė, priesaga ir priešdėliai', 'The senior group, the suffix and the prefixes'),
      mirrors: ['S1.9', 'S1.10', 'S1.13', 'S1.14', 'S1.15'],
      gen(rng, ctx) {
        const PFX = {
          alcohol: { d: t('grupė $–OH$', 'the group $–OH$'), p: ['hidroksi', 'hydroxy'] }, phenol: { d: t('fenolinė grupė $–OH$', 'the phenolic group $–OH$'), p: ['hidroksi', 'hydroxy'] },
          amine: { d: t('grupė $–NH2$', 'the group $–NH2$'), p: ['amino', 'amino'] }, thiol: { d: t('grupė $–SH$', 'the group $–SH$'), p: ['merkapto', 'mercapto'] },
          ketone: { d: t('karbonilo grupė $C=O$ (ketonas)', 'the carbonyl group $C=O$ (ketone)'), p: ['okso', 'oxo'] }, nitrile: { d: t('grupė $–C≡N$', 'the group $–C≡N$'), p: ['cian', 'cyano'] },
          aldehyde: { d: t('aldehido grupė $–CHO$ grandinėje', 'the aldehyde group $–CHO$ in the chain'), p: ['okso', 'oxo'] }
        };
        const ALLP = [['hidroksi', 'hydroxy'], ['amino', 'amino'], ['merkapto', 'mercapto'], ['okso', 'oxo'], ['cian', 'cyano'], ['chlor', 'chloro'], ['brom', 'bromo'], ['karboksi', 'carboxy'], ['nitro', 'nitro'], ['metoksi', 'methoxy']];
        const smi = ctx.pick(POLY);
        const m = ctx.chem.parse(smi);
        const keys = groupKeys(ctx, smi).filter((k) => k !== 'arene' && k !== 'alkane');
        const suffixKeys = keys.filter((k) => G[k].rank < 30);
        if (keys.length < 2 || !suffixKeys.length) throw new Error('u01.senior: ' + smi + ' has no pair of groups');
        const top = suffixKeys[0];
        const others = keys.filter((k) => k !== top);
        const extras = [];
        keys.forEach((k) => (CONFUSE[k] || []).forEach((c) => { const ck = gkey(c); if (keys.indexOf(ck) < 0 && extras.indexOf(ck) < 0 && ck !== 'alkane' && ck !== 'arene') extras.push(ck); }));
        const opts1 = [top].concat(others.filter((k) => k !== 'halide' || true), extras).filter((k, i, a) => a.indexOf(k) === i).slice(0, 4);
        const hasRing = m.atoms.some((a) => a.aromatic) || ctx.chem.rings(m).length > 0;
        const cand = others.filter((k) => (PFX[k] && !(k === 'aldehyde' && hasRing)) || k === 'halide');
        const steps = [{
          prompt: t('Kuri funkcinė grupė yra vyriausioji, t. y. išreiškiama pavadinimo priesaga ar galūne?', 'Which functional group is the senior one, that is, expressed by the suffix or ending of the name?'),
          kind: 'choice', options: opts1.map((k) => ({ text: gLabel(k) })), answer: 0,
          hint: t('Palyginkite grupes vyresniškumo eilėje: karboksirūgštys > sulfonrūgštys > druskos > anhidridai > esteriai > halogenanhidridai > amidai > nitrilai > aldehidai > ketonai > alkoholiai > fenoliai > tioliai > aminai > $C=C$ > $C≡C$.', 'Compare the groups in the seniority series: carboxylic acids > sulfonic acids > salts > anhydrides > esters > acyl halides > amides > nitriles > aldehydes > ketones > alcohols > phenols > thiols > amines > $C=C$ > $C≡C$.'),
          solution: t('Vyriausioji grupė: ' + G[top].lt + '; ji žymima priesaga ar galūne, o kitos grupės rašomos priešdėliais abėcėlės tvarka.', 'The senior group: ' + G[top].en + '; it is shown by the suffix or ending, and the other groups go in prefixes in alphabetical order.')
        }];
        if (cand.length) {
          const k = ctx.pick(cand);
          let pr = k === 'halide' ? (/Cl/.test(smi) ? ['chlor', 'chloro'] : /Br/.test(smi) ? ['brom', 'bromo'] : null) : PFX[k].p;
          if (pr) {
            const d = k === 'halide' ? t('halogeno atomas', 'the halogen atom') : PFX[k].d;
            const wrong = ctx.shuffle(ALLP.filter((x) => x[0] !== pr[0])).slice(0, 3);
            steps.push({
              prompt: t('Kokiu priešdėliu pavadinime išreiškiama ' + d.lt + '?', 'Which prefix expresses ' + d.en + ' in the name?'),
              kind: 'choice', options: [pr].concat(wrong).map((x) => tx(x[0] + '-', x[1] + '-')), answer: 0,
              hint: t('Jaunesnioji grupė, negalinti būti priesaga, pavadinime rašoma priešdėliu: $–OH$, $–NH2$, $=O$, $–SH$, halogenai turi savo priešdėlius.', 'A junior group that cannot be the suffix is written as a prefix: $–OH$, $–NH2$, $=O$, $–SH$ and the halogens each have their own.'),
              solution: t('Šios grupės priešdėlis: ' + pr[0] + '-.', 'The prefix of this group: ' + pr[1] + '-' + (pr[1] === 'mercapto' ? ' (IUPAC 2013: sulfanyl-)' : '') + '.')
            });
          }
        }
        const ns = nameStep(ctx, smi);
        if (!ns) throw new Error('u01.senior: ' + smi + ' is outside the namer');
        steps.push(ns);
        return {
          q: [{ p: t('Pateiktas junginys su keliomis funkcinėmis grupėmis.', 'A compound with several functional groups is shown.') }, { mol: { smi } }],
          steps,
          why: t('Junginio pavadinimas turi vieną priesagą: ją nulemia vyriausioji grupė, o visos kitos tampa priešdėliais. Pagrindinė grandinė turi apimti vyriausiąją grupę, ir ji numeruojama taip, kad ši gautų mažiausią numerį.', 'A name has just one suffix: the senior group decides it, and all the others become prefixes. The main chain must include the senior group, and it is numbered so that this group gets the lowest number.'),
          src: 'L1 p48, p52, p53, p54'
        };
      }
    },

    /* ============================================================ u01.chain */
    {
      id: 'u01.chain',
      title: t('Pagrindinė grandinė: kriterijai a) – d)', 'The main chain: criteria a) to d)'),
      mirrors: ['S1.8'],
      bank: (function () {
        const CRIT = [
          tx('a) daugiausia vyriausiųjų funkcinių grupių', 'a) the most senior functional groups'),
          tx('b) daugiausia dvigubųjų ir trigubųjų ryšių', 'b) the most double and triple bonds'),
          tx('c) didžiausias grandinės ilgis', 'c) the greatest chain length'),
          tx('d) daugiausia pakaitų ir angliavandenilių radikalų', 'd) the most substituents and hydrocarbon radicals')
        ];
        const P = (n, smi, opts, crit, name, why, sol) => ({
          id: 'u01.chain.' + n,
          q: [{ p: t('Raskite pagrindinę grandinę pagal pavadinimo taisyklių kriterijus a) – d) ir pavadinkite junginį.', 'Find the main chain by criteria a) to d) of the naming rules and name the compound.') }, { mol: { smi } }],
          steps: [
            {
              prompt: t('Kuri grandinė yra pagrindinė?', 'Which chain is the main chain?'),
              kind: 'choice', options: opts.map((o) => tx(o[0], o[1])), answer: 0,
              hint: t('Pagrindinė grandinė pirmiausia turi apimti kuo daugiau vyriausiųjų funkcinių grupių, paskui kuo daugiau dvigubųjų ir trigubųjų ryšių, tik tada skaičiuojamas ilgis.', 'The main chain must first contain as many senior functional groups as possible, then as many double and triple bonds, and only then does length count.'),
              solution: sol
            },
            {
              prompt: t('Kuris kriterijus išsprendė pasirinkimą?', 'Which criterion decided the choice?'),
              kind: 'choice', options: CRIT, answer: crit,
              hint: t('Kriterijai taikomi paeiliui: kiekvienas paskesnis tik tada, kai ankstesnis neduoda vienareikšmio atsakymo. Raskite pirmą, kuris išskiria kandidatus.', 'The criteria apply in order: each later one only when the earlier one gives no single answer. Find the first that separates the candidates.'),
              solution: why
            },
            { prompt: t('Pavadinkite junginį.', 'Name the compound.'), kind: 'name', mol: { smi }, answer: { smi }, hint: nameHint, solution: t(name[0], name[1]) }
          ],
          why, src: 'L1 p54, T p15',
          claims: [{ name: [smi, t(name[0], name[1])] }]
        });
        return [
          P(1, 'C=C(CC)CCCC', [['heksenas: 6 C atomų grandinė su dvigubuoju ryšiu', 'hexene: a chain of 6 C atoms with the double bond'], ['heptanas: ilgiausia, 7 C atomai, bet be dvigubojo ryšio', 'heptane: the longest, 7 C atoms, but without the double bond'], ['oktenas: visi 8 C atomai', 'octene: all 8 C atoms'], ['pentenas: 5 C atomų grandinė su dvigubuoju ryšiu', 'pentene: a chain of 5 C atoms with the double bond']], 1, ['2-etil-1-heksenas', '2-ethylhex-1-ene'],
            t('Dvigubąjį ryšį apimanti grandinė turi tik 6 C, o ilgiausia (7 C) jo neapima. Kriterijus b) viršesnis už c), todėl grandinė būtinai eina per $C=C$.', 'The chain through the double bond has only 6 C, and the longest one (7 C) misses it. Criterion b) outranks c), so the chain must pass through the $C=C$.'),
            t('Ilgiausia grandinė turi 7 anglis, bet jos dvigubojo ryšio nėra. Grandinė su $C=C$ yra 6 anglių ilgio, o etilas lieka pakaitu: 2-etil-1-heksenas.', 'The longest chain has 7 carbons but not the double bond. The chain with the $C=C$ is 6 carbons long, and ethyl is left as a substituent: 2-ethylhex-1-ene.')),
          P(2, 'OCC(CCC)CCC', [['pentanolis: 5 C atomų grandinė su $–OH$', 'pentanol: a chain of 5 C atoms bearing the $–OH$'], ['heptanas: 7 C atomai, bet $–OH$ lieka už grandinės', 'heptane: 7 C atoms, but the $–OH$ is left outside the chain'], ['butanolis: 4 C atomų grandinė su $–OH$', 'butanol: a chain of 4 C atoms bearing the $–OH$'], ['oktanolis: visi 8 C atomai', 'octanol: all 8 C atoms']], 0, ['2-propil-1-pentanolis', '2-propylpentan-1-ol'],
            t('Vyriausioji grupė $–OH$ turi būti pagrindinėje grandinėje: kriterijus a) taikomas pirmas, nors ilgesnė grandinė (7 C) $–OH$ neapima.', 'The senior group $–OH$ must be in the main chain: criterion a) applies first, even though a longer chain (7 C) misses the $–OH$.'),
            t('Ilgesnė, 7 C grandinė, $–OH$ neapima, todėl negalima. Grandinė su $–OH$ turi 5 C, o likusi dalis, propilas, yra pakaitas.', 'The longer 7 C chain does not include the $–OH$, so it is out. The chain with the $–OH$ has 5 C, and the rest, propyl, is a substituent.')),
          P(3, 'CCCC(CC)C(O)=O', [['pentano rūgštis: 5 C grandinė, kurios gale yra $–COOH$ anglis', 'pentanoic acid: a 5 C chain ending in the carbon of the $–COOH$'], ['heksanas: 6 C atomai, $–COOH$ lieka pakaitu', 'hexane: 6 C atoms, the $–COOH$ left as a substituent'], ['heptano rūgštis: visi 7 C atomai', 'heptanoic acid: all 7 C atoms'], ['butano rūgštis: 4 C atomų grandinė su $–COOH$', 'butanoic acid: a 4 C chain with the $–COOH$']], 0, ['2-etilpentano rūgštis', '2-ethylpentanoic acid'],
            t('Karboksirūgštis yra vyriausia grupė, todėl grandinė būtinai baigiasi jos anglimi. Per etilą einanti 6 C grandinė $–COOH$ neapimtų.', 'The carboxylic acid is the senior group, so the chain must end at its carbon. A 6 C chain through the ethyl group would not include the $–COOH$.'),
            t('$–COOH$ anglis visada yra grandinės dalis. Grandinė iki jos turi 5 C (pentano rūgštis), o etilas lieka pakaitu prie C-2.', 'The $–COOH$ carbon is always part of the chain. The chain up to it has 5 C (pentanoic acid), and ethyl is left as a substituent on C-2.')),
          P(4, 'C=CC(=C)CCC', [['butadienas: 4 C atomų grandinė su dviem dvigubaisiais ryšiais', 'butadiene: a chain of 4 C atoms with two double bonds'], ['heksenas: 6 C atomų grandinė su vienu dvigubuoju ryšiu', 'hexene: a chain of 6 C atoms with one double bond'], ['heptadienas: visi 7 C atomai', 'heptadiene: all 7 C atoms'], ['pentadienas: 5 C atomų grandinė su dviem dvigubaisiais ryšiais', 'pentadiene: a chain of 5 C atoms with two double bonds']], 1, ['2-propil-1,3-butadienas', '2-propylbuta-1,3-diene'],
            t('Abu $C=C$ galima įtraukti tik į 4 C grandinę, o ilgesnė grandinė apimtų tik vieną. Kriterijus b) reikalauja daugiausia dvigubųjų ryšių, todėl jis viršesnis už ilgį.', 'Both $C=C$ fit only in a 4 C chain, and a longer chain would include just one. Criterion b) asks for the most double bonds, so it outranks length.'),
            t('Dienas turinti grandinė turi 4 C, o 6 C grandinė apimtų tik vieną $C=C$. Daugiau dvigubųjų ryšių laimi: propilas yra pakaitas.', 'The chain with both double bonds has 4 C, while the 6 C chain would include only one $C=C$. More double bonds wins: propyl is a substituent.')),
          P(5, 'CC(Cl)C(CC)CC', [['pentanas su dviem pakaitais (chloru ir etilu)', 'pentane with two substituents (chlorine and ethyl)'], ['pentanas su vienu pakaitu (1-chloretilu)', 'pentane with one substituent (1-chloroethyl)'], ['heksanas: 6 C atomai', 'hexane: 6 C atoms'], ['butanas su trimis pakaitais', 'butane with three substituents']], 3, ['2-chlor-3-etilpentanas', '2-chloro-3-ethylpentane'],
            t('Abi 5 C grandinės vienodos pagal funkcines grupes (jų nėra), daugybinius ryšius ir ilgį. Tada skaičiuojami pakaitai, kurie gali būti tik priešdėliuose ($Cl$, radikalai): daugiau pakaitų turi grandinė per $CH3$ ir $CHCl$.', 'Both 5 C chains tie on functional groups (there are none), multiple bonds and length. Then the substituents that may appear only as prefixes ($Cl$, radicals) are counted: the chain through the $CH3$ and $CHCl$ has more.'),
            t('Per etilą einanti grandinė turėtų vieną pakaitą (1-chloretilą), o grandinė su $CH3–CHCl$ galu – du: chlorą ir etilą. Pagal kriterijų d) laimi grandinė su dviem pakaitais.', 'The chain through an ethyl group would have one substituent (1-chloroethyl), while the chain with the $CH3–CHCl$ end has two: chlorine and ethyl. By criterion d) the chain with two substituents wins.')),
          P(6, 'CC(C)C(CC)CCC', [['heksanas su dviem pakaitais (metilu ir etilu)', 'hexane with two substituents (methyl and ethyl)'], ['heksanas su vienu pakaitu (izopropilu)', 'hexane with one substituent (isopropyl)'], ['heptanas: 7 C atomai', 'heptane: 7 C atoms'], ['nonanas: visi 9 C atomai', 'nonane: all 9 C atoms']], 3, ['3-etil-2-metilheksanas', '3-ethyl-2-methylhexane'],
            t('Galimos dvi 6 C grandinės, o 7 C grandinės nėra. Ilgis vienodas, todėl lemia pakaitų skaičius: grandinė su dviem mažais pakaitais viršija grandinę su vienu didesniu.', 'There are two 6 C chains and no 7 C chain. The length ties, so the number of substituents decides: a chain with two small substituents beats one with a single larger one.'),
            t('Abi 6 C grandinės vienodo ilgio, bet viena palieka du pakaitus (metilą ir etilą), kita – vieną (izopropilą). Pagal d) renkamės grandinę su dviem pakaitais.', 'Both 6 C chains are the same length, but one leaves two substituents (methyl and ethyl) and the other one (isopropyl). By d) we pick the chain with two substituents.')),
          P(7, 'OCCC(CCC)CCO', [['pentandiolis: 5 C atomų grandinė su dviem $–OH$', 'pentanediol: a chain of 5 C atoms with two $–OH$'], ['heksanolis: 6 C atomų grandinė su vienu $–OH$', 'hexanol: a chain of 6 C atoms with one $–OH$'], ['oktandiolis: visi 8 C atomai', 'octanediol: all 8 C atoms'], ['butandiolis: 4 C atomų grandinė su dviem $–OH$', 'butanediol: a chain of 4 C atoms with two $–OH$']], 0, ['3-propil-1,5-pentandiolis', '3-propylpentane-1,5-diol'],
            t('Kriterijus a) reikalauja grandinės su kuo daugiau vyriausiųjų grupių: abi $–OH$ gali būti 5 C grandinėje, o ilgesnė 6 C grandinė apimtų tik vieną.', 'Criterion a) asks for the chain with the most senior groups: both $–OH$ fit in a 5 C chain, while a longer 6 C chain would include only one.'),
            t('6 C grandinė apimtų tik vieną $–OH$, todėl pasirenkama 5 C grandinė su abiem hidroksilais. Propilas lieka pakaitu prie C-3.', 'The 6 C chain would include only one $–OH$, so the 5 C chain with both hydroxyls is chosen. Propyl is left as a substituent on C-3.')),
          P(8, 'CCC(C)CCCC', [['heptanas: 7 C atomų grandinė', 'heptane: a 7 C chain'], ['heksanas: 6 C atomų grandinė', 'hexane: a 6 C chain'], ['oktanas: visi 8 C atomai', 'octane: all 8 C atoms'], ['pentanas: 5 C atomų grandinė', 'pentane: a 5 C chain']], 2, ['3-metilheptanas', '3-methylheptane'],
            t('Čia nėra nei funkcinių grupių, nei $C=C$, todėl pasirenkama ilgiausia grandinė. Metilas yra tik 1 C ilgio šaka, bendras anglių skaičius (8) grandinės ilgio nenusako.', 'There are no functional groups and no $C=C$ here, so the longest chain is chosen. The methyl is only a 1 C branch, and the total number of carbons (8) does not give the chain length.'),
            t('Ilgiausia grandinė eina nuo vieno galo iki kito neįtraukiant šakos: 7 C. Metilas yra pakaitas prie C-3.', 'The longest chain runs from one end to the other without taking the branch: 7 C. Methyl is a substituent on C-3.')),
          P(9, 'C=CCC(CC)C(C)=O', [['heksenonas: 6 C atomų grandinė su $C=O$ ir $C=C$', 'hexenone: a 6 C chain with the $C=O$ and the $C=C$'], ['heksenas: 6 C atomų grandinė per etilą, be $C=O$', 'hexene: a 6 C chain through the ethyl group, without the $C=O$'], ['oktenonas: visi 8 C atomai', 'octenone: all 8 C atoms'], ['pentenonas: 5 C atomų grandinė su $C=O$', 'pentenone: a 5 C chain with the $C=O$']], 0, ['3-etil-5-heksen-2-onas', '3-ethylhex-5-en-2-one'],
            t('Abi 6 C grandinės apimtų $C=C$, bet tik viena apima vyriausiąją grupę, ketoną. Kriterijus a) sprendžia anksčiau nei b) ir c).', 'Both 6 C chains would include the $C=C$, but only one includes the senior group, the ketone. Criterion a) decides before b) and c).'),
            t('Ketonas vyresnis už $C=C$, todėl grandinė privalo apimti $C=O$ ir $C=C$ kartu. Etilas lieka pakaitu prie C-3.', 'The ketone outranks $C=C$, so the chain must include the $C=O$ and the $C=C$ together. Ethyl is left as a substituent on C-3.'))
        ];
      })()
    },

    /* ============================================================ u01.numbering */
    {
      id: 'u01.numbering',
      title: t('Numeravimas ir pakaitų išvardijimas abėcėlės tvarka', 'Numbering and listing the substituents alphabetically'),
      mirrors: ['S1.1', 'S1.8'],
      gen(rng, ctx) {
        const STEMS = { lt: ['', '', '', '', 'but', 'pent', 'heks', 'hept', 'okt', 'non'], en: ['', '', '', '', 'but', 'pent', 'hex', 'hept', 'oct', 'non'] };
        const SUBS = [{ k: 'brom', lt: 'brom', en: 'bromo', smi: 'Br' }, { k: 'chlor', lt: 'chlor', en: 'chloro', smi: 'Cl' }, { k: 'etil', lt: 'etil', en: 'ethyl', smi: 'CC' }, { k: 'metil', lt: 'metil', en: 'methyl', smi: 'C' }];
        const MULT = ['', '', 'di', 'tri', 'tetra'];
        const asc = (a, b) => a - b;
        const cmp = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
        // the name for the substituents s ({s, p}) on a chain of n carbons with a double bond at locant d (0 = none)
        function build(n, d, subs, lang, opts) {
          const o = opts || {};
          const by = {};
          subs.forEach((x) => { (by[x.s.k] = by[x.s.k] || { s: x.s, loc: [] }).loc.push(x.p); });
          const items = Object.keys(by).map((k) => by[k]).sort((a, b) => (a.s.k < b.s.k ? -1 : 1) * (o.rev ? -1 : 1));
          const pre = items.map((g) => g.loc.sort(asc).join(',') + '-' + (o.noMult ? '' : MULT[g.loc.length]) + g.s[lang]).join('-');
          const stem = STEMS[lang][n];
          if (lang === 'lt') return d ? (pre ? pre + '-' : '') + d + '-' + stem + 'enas' : pre + stem + 'anas';
          return pre + (d ? stem + '-' + d + '-ene' : stem + 'ane');
        }
        let pick = null;
        for (let tries = 0; tries < 120 && !pick; tries++) {
          const n = ctx.int(5, 9);
          const d = ctx.int(0, 3) === 0 ? ctx.int(1, n - 1) : 0;
          const k = ctx.int(2, 3);
          const subs = [];
          const used = {};
          let bad = false;
          for (let i = 0; i < k; i++) {
            const s = ctx.pick(SUBS);
            const p = ctx.int(2, n - 1);
            if (s.k === 'etil' && (p < 3 || p > n - 2)) { bad = true; break; }
            const sp2 = d && (p === d || p === d + 1);
            if (used[p] && (sp2 || used[p] !== s.k || s.k !== 'metil')) { bad = true; break; }
            used[p] = used[p] ? used[p] : s.k;
            subs.push({ s, p });
          }
          if (bad || subs.length < 2) continue;
          const f = subs.map((x) => x.p).sort(asc);
          const r = subs.map((x) => n + 1 - x.p).sort(asc);
          let fwd;
          if (d && d !== n - d) fwd = d < n - d;
          else { const c = cmp(f, r); if (c === 0) continue; fwd = c < 0; }
          const sc = fwd ? subs : subs.map((x) => ({ s: x.s, p: n + 1 - x.p }));
          const wr = fwd ? subs.map((x) => ({ s: x.s, p: n + 1 - x.p })) : subs;
          const dl = d ? (fwd ? d : n - d) : 0;
          const dw = d ? (fwd ? n - d : d) : 0;
          // the SMILES: chain atoms in forward order with branches
          let smi = '';
          for (let i = 1; i <= n; i++) {
            smi += 'C';
            subs.filter((x) => x.p === i).forEach((x) => { smi += '(' + x.s.smi + ')'; });
            if (i < n) smi += (d === i ? '=' : '');
          }
          const ltN = ctx.name.name(smi, { lang: 'lt' }), enN = ctx.name.name(smi, { lang: 'en' });
          if (!ltN || !enN) continue;
          const mine = { lt: build(n, dl, sc, 'lt'), en: build(n, dl, sc, 'en') };
          if ([ltN.name].concat(ltN.alts).indexOf(mine.lt) < 0 || [enN.name].concat(enN.alts).indexOf(mine.en) < 0) continue;
          if (/^4-brom-3-metil-2-/.test(mine.lt)) continue;
          pick = { n, d, dl, dw, smi, sc, wr, mine, subs };
        }
        if (!pick) throw new Error('u01.numbering: no problem found');
        const { n, dl, dw, sc, wr, smi, mine } = pick;
        const locs = (arr) => arr.map((x) => x.p).sort(asc).join(',');
        const nameBoth = (a, o) => ({ lt: build(n, a.d, a.subs, 'lt', o), en: build(n, a.d, a.subs, 'en', o) });
        const cand = [];
        cand.push(nameBoth({ d: dw, subs: wr }));
        const kinds = Object.keys(sc.reduce((a, x) => { a[x.s.k] = 1; return a; }, {}));
        if (kinds.length > 1) cand.push(nameBoth({ d: dl, subs: sc }, { rev: true }));
        if (pick.d) {
          const fS = pick.subs.map((x) => x.p).sort(asc), rS = pick.subs.map((x) => n + 1 - x.p).sort(asc);
          const c = cmp(fS, rS);
          if (c !== 0) { const f2 = c < 0; cand.push(nameBoth({ d: f2 ? pick.d : n - pick.d, subs: f2 ? pick.subs : pick.subs.map((x) => ({ s: x.s, p: n + 1 - x.p })) })); }
        }
        const shifted = sc.map((x, i) => (i === 0 ? { s: x.s, p: x.p < n - 1 ? x.p + 1 : x.p - 1 } : x));
        if (locs(shifted) !== locs(sc)) cand.push(nameBoth({ d: dl, subs: shifted }));
        if (sc.some((x, i) => sc.some((y, j) => i !== j && x.s.k === y.s.k))) cand.push(nameBoth({ d: dl, subs: sc }, { noMult: true }));
        const wrongNames = [];
        cand.forEach((c) => { if (c.lt !== mine.lt && !wrongNames.some((w) => w.lt === c.lt)) wrongNames.push(c); });
        if (wrongNames.length < 3) throw new Error('u01.numbering: too few wrong names for ' + smi);
        const locOpt = (a, dd) => (dd ? '$C=C$ – ' + dd + '; ' : '') + 'pakaitai – ' + locs(a);
        const locOptEn = (a, dd) => (dd ? '$C=C$ – ' + dd + '; ' : '') + 'substituents – ' + locs(a);
        const lo = [{ a: sc, d: dl }, { a: wr, d: dw }, { a: shifted, d: dl }];
        const lopts = lo.filter((x, i) => lo.findIndex((y) => locOpt(y.a, y.d) === locOpt(x.a, x.d)) === i);
        const steps = [];
        if (lopts.length >= 2) {
          steps.push({
            prompt: t('Kokie lokantai teisingi, kai grandinė sunumeruota pagal taisykles?', 'Which locants are right when the chain is numbered by the rules?'),
            kind: 'choice', options: lopts.map((x) => ({ text: t(locOpt(x.a, x.d), locOptEn(x.a, x.d)) })), answer: 0,
            hint: pick.d ? t('Pirmiausia $C=C$ turi gauti mažiausią numerį; jei numeracijos kryptys tuo nesiskiria, lygina pakaitų lokantus pirmajame skirtumo taške.', 'First the $C=C$ must get the lowest number; if the directions tie on that, compare the locants of the substituents at the first point of difference.')
              : t('Sunumeruokite grandinę iš abiejų galų ir palyginkite pakaitų lokantų rinkinius: laimi tas, kurio pirmasis besiskiriantis lokantas mažesnis.', 'Number the chain from both ends and compare the sets of substituent locants: the winner has the lower number at the first point of difference.'),
            solution: t('Teisinga numeracija duoda lokantus: ' + locOpt(sc, dl) + '. Priešinga kryptimi gautume: ' + locOpt(wr, dw) + '.', 'The correct numbering gives: ' + locOptEn(sc, dl) + '. The other direction would give: ' + locOptEn(wr, dw) + '.')
          });
        }
        steps.push({
          prompt: t('Kuris pavadinimas sudarytas teisingai?', 'Which name is built correctly?'),
          kind: 'choice', options: [t(mine.lt, mine.en)].concat(ctx.shuffle(wrongNames).slice(0, 3).map((w) => t(w.lt, w.en))).map((x) => ({ text: x })), answer: 0,
          hint: t('Patikrinkite tris dalykus: numeracijos kryptį, pakaitų eilę (abėcėlės tvarka, nepaisant $di$, $tri$) ir dauginamuosius priešdėlius.', 'Check three things: the direction of numbering, the order of the substituents (alphabetical, ignoring $di$, $tri$) and the multiplying prefixes.'),
          solution: t('Teisingas pavadinimas: ' + mine.lt + '. Pakaitai išvardijami abėcėlės tvarka, o $di$, $tri$ į abėcėlę neįskaičiuojami.', 'The correct name: ' + mine.en + '. The substituents are listed alphabetically, and $di$, $tri$ do not count for the order.')
        });
        steps.push({
          prompt: t('Pavadinkite junginį.', 'Name the compound.'), kind: 'name', mol: { smi }, answer: { smi }, hint: nameHint,
          solution: t(mine.lt, mine.en)
        });
        return {
          q: [{ p: t('Pateiktas junginys. Sunumeruokite pagrindinę grandinę ir sudarykite pavadinimą.', 'A compound is shown. Number the main chain and build the name.') }, { mol: { smi } }],
          steps,
          why: t('Grandinė numeruojama iš to galo, kuriame pirmasis skirtumo taškas duoda mažesnį lokantą: pirmiausia dvigubajam ryšiui, po to pakaitams. Pavadinime pakaitai išvardijami abėcėlės tvarka, o pasikartojantys žymimi $di$, $tri$.', 'The chain is numbered from the end where the first point of difference gives the lower locant: first for the double bond, then for the substituents. In the name the substituents are listed alphabetically, and repeats are marked $di$, $tri$.'),
          src: 'L1 p54, p55, p58'
        };
      }
    },

    /* ============================================================ u01.name */
    {
      id: 'u01.name',
      title: t('Junginio klasė ir pavadinimas: angliavandeniliai, halogenidai, alkoholiai, aminai', 'Class and name: hydrocarbons, halides, alcohols, amines'),
      mirrors: ['S1.4', 'S1.8', 'S1.13'],
      gen(rng, ctx) {
        if (!namePoolCache) namePoolCache = dedupe(ctx, HC.concat(HET, AMINES));
        const smi = ctx.pick(namePoolCache);
        const key = classKey(ctx, smi);
        const steps = [classStep(key)];
        const ns = nameStep(ctx, smi);
        if (!ns) throw new Error('u01.name: ' + smi + ' is outside the namer');
        steps.push(ns);
        return {
          q: [{ p: t('Pateiktas junginys.', 'A compound is shown.') }, { mol: { smi } }],
          steps,
          why: t('Pavadinimas sudaromas iš pagrindinės grandinės šaknies, sotumo priesagos (-an, -en, -in), pakaitų priešdėlių ir vyriausiosios grupės galūnės. Aminas vadinamas pirminiu, antriniu ar tretiniu pagal tai, kiek $C$ atomų susijungę su azotu.', 'The name is built from the root of the main chain, the saturation ending (-an, -en, -in), the prefixes of the substituents and the ending of the senior group. An amine is primary, secondary or tertiary by the number of carbons bonded to nitrogen.'),
          src: 'L1 p26-p37, p52-p58, S1.8, S1.13'
        };
      }
    },

    /* ============================================================ u01.acidname */
    {
      id: 'u01.acidname',
      title: t('Karboksirūgštys ir jų dariniai: pavadinimai', 'Carboxylic acids and their derivatives: names'),
      mirrors: ['S1.4', 'S1.12', 'S1.14', 'S1.15'],
      gen(rng, ctx) {
        if (!acylPoolCache) acylPoolCache = dedupe(ctx, ACYL.concat(CARB));
        const { chem } = ctx;
        const smi = ctx.pick(acylPoolCache);
        const key = classKey(ctx, smi);
        const steps = [classStep(key)];
        if (key === 'ester') {
          const m = chem.parse(smi);
          let alk = null;
          m.atoms.forEach((a, c) => {
            if (a.el !== 'C') return;
            const dO = m.nbr[c].find((j) => m.atoms[j].el === 'O' && m.bondAt(c, j).kek === 2);
            const sO = m.nbr[c].find((j) => m.atoms[j].el === 'O' && m.bondAt(c, j).kek === 1 && m.nbr[j].length === 2);
            if (dO !== undefined && sO !== undefined) alk = m.nbr[sO].find((j) => j !== c);
          });
          const seen = new Set();
          if (alk !== null && alk !== undefined) {
            const sO = m.nbr[alk].find((j) => m.atoms[j].el === 'O' && m.nbr[j].length === 2 && m.nbr[j].some((x) => m.atoms[x].el === 'C' && m.nbr[x].some((y) => m.atoms[y].el === 'O' && m.bondAt(x, y).kek === 2)));
            const queue = [alk];
            seen.add(alk);
            while (queue.length) { const x = queue.shift(); m.nbr[x].forEach((y) => { if (y !== sO && !seen.has(y)) { seen.add(y); queue.push(y); } }); }
            const ans = Array.from(seen).sort((a, b) => a - b);
            steps.push({
              prompt: t('Bakstelėkite alkilo dalį $R$ esteryje $R–O–C(=O)–R′$, kuri pavadinime rašoma pirma.', 'Tap the alkyl part $R$ of the ester $R–O–C(=O)–R′$, which is written first in the name.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: ans,
              hint: t('Esterio pavadinimas prasideda alkilo grupe, kuri prisijungusi prie vienkartiniu ryšiu susijusio deguonies, o baigiasi rūgšties dalimi su galūne -oatas.', 'The name of an ester starts with the alkyl group bonded to the single-bonded oxygen and ends with the acid part with the ending -oate.'),
              solution: t('Alkilo dalis – atomai Nr. ' + ans.map((x) => x + 1).join(', ') + ': ji rašoma pirma, o rūgšties dalis gauna galūnę -oatas.', 'The alkyl part is atoms no. ' + ans.map((x) => x + 1).join(', ') + ': it is written first, and the acid part gets the ending -oate.')
            });
          }
        }
        const ns = nameStep(ctx, smi);
        if (!ns) throw new Error('u01.acidname: ' + smi + ' is outside the namer');
        steps.push(ns);
        const numbered = steps.some((s) => s.kind === 'atoms');
        return {
          q: [{ p: t('Pateiktas karbonilo junginys ar rūgšties darinys.', 'A carbonyl compound or an acid derivative is shown.') }, { mol: { smi, opts: numbered ? { numbers: 'all' } : {} } }],
          steps,
          why: t('Rūgšties darinio galūnė parodo grupę: -o rūgštis, -oatas (esteris ar druska), -amidas, -nitrilas, -oilchloridas, anhidridas; aldehidams – -alis, ketonams – -onas. Prie žiedo prijungta grupė gauna priesagą -karbo-, nes jos anglis nėra žiedo dalis.', 'The ending of an acid derivative shows the group: -oic acid, -oate (ester or salt), -amide, -nitrile, -oyl chloride, anhydride; for aldehydes -al, for ketones -one. A group attached to a ring takes the suffix -carbo-, because its carbon is not part of the ring.'),
          src: 'L1 p38-p46, p52-p58, S1.12, S1.14'
        };
      }
    },

    /* ============================================================ u01.fromname */
    {
      id: 'u01.fromname',
      title: t('Nuo pavadinimo prie struktūros ir atvirkščiai (izomerai)', 'From name to structure and back (isomers)'),
      mirrors: ['S1.1', 'S1.15'],
      gen(rng, ctx) {
        const g = ctx.pick(ISO.filter((x) => x.length >= 3));
        const idx = ctx.int(0, g.length - 1);
        const target = g[idx];
        const others = ctx.shuffle(g.filter((_, i) => i !== idx)).slice(0, 3);
        const nm = nameOf(ctx, target);
        const ons = others.map((s) => nameOf(ctx, s));
        if (!nm || ons.some((x) => !x)) throw new Error('u01.fromname: outside the namer');
        const v = ctx.int(0, 1);
        const key = classKey(ctx, target);
        const steps = [];
        if (v === 0) {
          steps.push({
            prompt: t('Kuri struktūra atitinka šį pavadinimą?', 'Which structure matches this name?'),
            kind: 'choice', options: [target].concat(others).map((s) => mo(s)), answer: 0,
            hint: t('Pirmiausia sužinokite iš galūnės, kokia funkcinė grupė, tada iš šaknies – kiek anglių grandinėje, o lokantai nurodo grupių ir pakaitų vietas.', 'First read the functional group from the ending, then the number of carbons from the root, and the locants give the positions of groups and substituents.'),
            solution: [{ p: t('Pavadinimas „' + nm.lt + '“ atitinka šią struktūrą; kiti variantai – tos pačios formulės izomerai su kita grupės vieta ar kita grupe.', 'The name “' + nm.en + '” matches this structure; the other options are isomers with the group in another place or another group.') }, mo(target)]
          });
        } else {
          steps.push({
            prompt: t('Koks yra šio junginio pavadinimas? Visi variantai yra izomerai.', 'What is the name of this compound? All the options are isomers.'),
            kind: 'choice', options: [{ text: t(nm.lt, nm.en) }].concat(ons.map((x) => ({ text: t(x.lt, x.en) }))), answer: 0,
            hint: t('Raskite vyriausiąją grupę, pagrindinę grandinę ir sunumeruokite taip, kad grupė ar pakaitai gautų mažiausius numerius.', 'Find the senior group and the main chain and number it so that the group or substituents get the lowest numbers.'),
            solution: t('Pavadinimas: ' + nm.lt + '.', 'The name: ' + nm.en + '.')
          });
        }
        steps.push(classStep(key));
        return {
          q: v === 0 ? [{ p: t('Pateiktas pavadinimas: **' + nm.lt + '**.', 'The name given: **' + nm.en + '**.') }] : [{ p: t('Pateikta struktūra.', 'A structure is shown.') }, { mol: { smi: target } }],
          steps,
          why: t('Vienos molekulinės formulės junginiai skiriasi grupės vieta ar pačia grupe, o tai matyti iš lokantų ir galūnės. Todėl pavadinimas vienareikšmiškai nusako struktūrą.', 'Compounds of one molecular formula differ in the place of the group or in the group itself, and the locants and the ending show this. That is why a name defines a structure unambiguously.'),
          src: 'L1 p50, p52-p55, S1.15'
        };
      }
    },

    /* ============================================================ u01.trivial */
    {
      id: 'u01.trivial',
      title: t('Trivialieji pavadinimai ir jų IUPAC atitikmenys', 'Trivial names and their IUPAC equivalents'),
      mirrors: ['S1.10', 'S1.11', 'S1.14'],
      gen(rng, ctx) {
        const items = ctx.shuffle(TRIVP).slice(0, 4);
        const nms = items.map((e) => nameOf(ctx, e[0]));
        if (nms.some((x) => !x) || new Set(nms.map((x) => x.lt)).size < 4) throw new Error('u01.trivial: clash');
        const left = items.map((e) => ({ text: t(e[1], e[2]) }));
        const src = Array.from(new Set(items.map((e) => e[3]))).join(', ');
        return {
          q: [{ p: t('Organinėje sintezėje ir biochemijoje dažnai vartojami trivialieji pavadinimai.', 'Trivial names are often used in organic synthesis and biochemistry.') }],
          steps: [
            {
              prompt: t('Suporuokite trivialųjį pavadinimą su struktūra.', 'Match each trivial name with its structure.'),
              kind: 'match', answer: { left, right: items.map((e) => mo(e[0])), pairs: [0, 1, 2, 3] },
              hint: t('Atpažinkite grupę (rūgštis, aldehidas, esteris...) ir anglies skeletą, kurį žymi trivialusis pavadinimas.', 'Recognise the group (acid, aldehyde, ester...) and the carbon skeleton that the trivial name stands for.'),
              solution: t('Trivialieji pavadinimai nesiremia taisyklėmis, todėl juos reikia išmokti: ' + items.map((e) => e[1]).join('; ') + '.', 'Trivial names follow no rules, so they must be learned: ' + items.map((e) => e[2]).join('; ') + '.')
            },
            {
              prompt: t('Suporuokite tuos pačius junginius su jų sisteminiais (IUPAC) pavadinimais.', 'Now match the same compounds with their systematic (IUPAC) names.'),
              kind: 'match', answer: { left, right: nms.map((x, i) => ({ text: t(x.lt, SYS_EN[items[i][0]] || x.en) })), pairs: [0, 1, 2, 3] },
              hint: t('Sisteminis pavadinimas nusako sandarą: ieškokite šaknies (anglių skaičius) ir galūnės (grupė).', 'A systematic name describes the structure: look for the root (the number of carbons) and the ending (the group).'),
              solution: t(items.map((e, i) => e[1] + ' kitaip vadinamas ' + nms[i].lt).join('; ') + '.', items.map((e, i) => e[2] + ' is systematically ' + (SYS_EN[e[0]] || nms[i].en)).join('; ') + '.')
            }
          ],
          why: t('Trivialieji pavadinimai atsirado prieš sandaros išaiškinimą ir nusako medžiagos kilmę ar savybes. Sisteminis pavadinimas pagal IUPAC taisykles vienareikšmiškai nusako formulę, bet chemikai ir toliau dažnai vartoja trivialiuosius.', 'Trivial names arose before structures were known and refer to origin or properties. The IUPAC systematic name defines the formula unambiguously, yet chemists still use the trivial ones a lot.'),
          src
        };
      }
    },

    /* ============================================================ u01.describe */
    {
      id: 'u01.describe',
      title: t('Struktūra pagal žodinį aprašymą', 'A structure from a verbal description'),
      mirrors: ['S1.7'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const has = (m, ...ty) => { const s = new Set(chem.groups(m).map((x) => gkey(x.type))); return ty.every((x) => s.has(x)); };
        const nC = (m) => cCount(m);
        const D = [
          { lt: 'ketonas, turintis 5 anglies atomus', en: 'a ketone with 5 carbon atoms', ok: (m) => has(m, 'ketone') && nC(m) === 5,
            right: ['CCCC(C)=O', 'CCC(=O)CC', 'CC(C)C(C)=O', 'O=C1CCCC1'], wrong: ['CCCCC=O', 'CCC(C)=O', 'CC(=O)CCCC', 'CC(C)CC=O', 'O=C1CCCCC1'] },
          { lt: 'amidas, turintis 4 anglies atomus', en: 'an amide with 4 carbon atoms', ok: (m) => has(m, 'amide') && nC(m) === 4,
            right: ['CCCC(N)=O', 'CC(C)C(N)=O', 'CCC(=O)NC', 'CC(=O)N(C)C', 'CC(=O)NCC'], wrong: ['CCC(N)=O', 'CCCCC(N)=O', 'CCCCN', 'CC(N)=O', 'CCCC#N'] },
          { lt: 'esteris, turintis 5 anglies atomus', en: 'an ester with 5 carbon atoms', ok: (m) => has(m, 'ester') && nC(m) === 5,
            right: ['CCCC(=O)OC', 'CC(=O)OCCC', 'CCC(=O)OCC', 'CC(=O)OC(C)C'], wrong: ['CCCCC(O)=O', 'CC(=O)OCC', 'CCCCC(=O)OC', 'CCOC(=O)CCC', 'CC(C)CC(O)=O'] },
          { lt: 'aromatinis aldehidas (grupė $–CHO$ prijungta prie benzeno žiedo)', en: 'an aromatic aldehyde (the $–CHO$ group attached to the benzene ring)',
            ok: (m) => has(m, 'aldehyde') && chem.groups(m).some((x) => x.type === 'aldehyde' && x.atoms.some((c) => m.nbr[c].some((j) => m.atoms[j].aromatic))),
            right: ['O=Cc1ccccc1', 'Cc1ccc(C=O)cc1', 'COc1cc(C=O)ccc1O', 'O=Cc1cccc(O)c1'], wrong: ['O=CCc1ccccc1', 'CC(=O)c1ccccc1', 'CCCCCC=O', 'OCc1ccccc1', 'CCCCC(C)=O'] },
          { lt: 'oksoesteris (esteris, turintis okso grupę)', en: 'an oxoester (an ester carrying an oxo group)', ok: (m) => has(m, 'ester') && (has(m, 'ketone') || has(m, 'aldehyde')),
            right: ['CCOC(=O)CC(C)=O', 'COC(=O)CCC=O', 'CC(=O)CCC(=O)OC', 'COC(=O)CC=O'], wrong: ['CCOC(=O)C(C)O', 'CC(=O)CC(O)=O', 'CCOC(=O)CCO', 'COC(=O)CCC(O)=O', 'CC(=O)CCCC(O)=O'] },
          { lt: 'aminoalkoholis', en: 'an amino alcohol', ok: (m) => has(m, 'amine', 'alcohol'),
            right: ['NCCO', 'CC(N)CO', 'NCCCO', 'CNCCO', 'CC(O)CN'], wrong: ['OCCO', 'NCCN', 'COCCN', 'CC(=O)CN', 'CCOCN'] },
          { lt: 'α-aminorūgštis', en: 'an α-amino acid', ok: (m) => chem.groups(m).some((x) => x.type === 'acid' && x.atoms.some((c) => m.atoms[c].el === 'C' && m.nbr[c].some((j) => m.atoms[j].el === 'C' && m.nbr[j].some((k) => m.atoms[k].el === 'N')))),
            right: ['NCC(O)=O', 'CC(N)C(O)=O', 'CC(C)C(N)C(O)=O', 'SCC(N)C(O)=O', 'OCC(N)C(O)=O'], wrong: ['NCCC(O)=O', 'NCCCC(O)=O', 'CC(N)CC(O)=O', 'NCC(=O)OC', 'CC(O)C(N)=O'] }
        ];
        const d = ctx.pick(D);
        const good = d.right.filter((s) => d.ok(chem.parse(s)));
        const bad = d.wrong.filter((s) => !d.ok(chem.parse(s)));
        if (good.length < 3 || bad.length < 3) throw new Error('u01.describe: the lists do not match the description');
        const right = ctx.pick(good);
        const wrong = ctx.shuffle(bad).slice(0, 3);
        const steps = [{
          prompt: t('Pasirinkite struktūrą, atitinkančią aprašymą.', 'Pick the structure that fits the description.'),
          kind: 'choice', options: [right].concat(wrong).map((s) => mo(s)), answer: 0,
          hint: t('Atskirkite klasę (kokia funkcinė grupė) ir suskaičiuokite anglies atomus, įskaitant karbonilo anglį. Aprašymas turi tenkinti abu dalykus.', 'Tell the class (which functional group) and count the carbon atoms, including the carbonyl carbon. The description must hold for both.'),
          solution: [{ p: t('Tinka tik ši struktūra; kiti variantai arba kitos klasės, arba turi kitą anglies atomų skaičių, arba grupė kitoje vietoje.', 'Only this structure fits; the other options are another class, have another number of carbons, or have the group in another place.') }, mo(right)]
        }];
        const ns = nameStep(ctx, right, t('Pavadinkite pasirinktą junginį.', 'Name the compound you chose.'));
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Raskite struktūrą pagal aprašymą: ' + d.lt + '.', 'Find the structure that fits the description: ' + d.en + '.') }],
          steps,
          why: t('Klasę nusako funkcinė grupė, o anglies atomų skaičius įskaito ir grupės anglį. Todėl, pavyzdžiui, to paties $C5$ aldehidas ir ketonas yra izomerai, bet priklauso skirtingoms klasėms.', 'The class is set by the functional group, and the number of carbon atoms includes the carbon of the group. So, for instance, an aldehyde and a ketone with the same $C5$ are isomers but belong to different classes.'),
          src: 'S1.7, L1 p25-p48'
        };
      }
    },

    /* ============================================================ u01.lonepairs */
    {
      id: 'u01.lonepairs',
      title: t('Heteroatomų laisvosios elektronų poros', 'Lone pairs on heteroatoms'),
      mirrors: ['S1.4'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const smi = ctx.pick(LONE);
        const m = chem.parse(smi);
        const lp = m.atoms.map((a, i) => (a.el === 'C' ? 0 : chem.lonePairs(m, i)));
        const total = lp.reduce((a, b) => a + b, 0);
        const kinds = [1, 2, 3].filter((k) => lp.indexOf(k) >= 0);
        if (!kinds.length) throw new Error('u01.lonepairs: no lone pairs in ' + smi);
        const k = ctx.pick(kinds);
        const ans = lp.map((x, i) => (x === k ? i : -1)).filter((x) => x >= 0);
        const where = (kk, en) => m.atoms.map((a, i) => (lp[i] === kk ? a.el + (en ? ' (no. ' : ' (Nr. ') + (i + 1) + ')' : null)).filter(Boolean).join(', ');
        const steps = [
          {
            prompt: t('Kiek laisvųjų elektronų porų turi visi molekulės heteroatomai kartu?', 'How many lone pairs do all the heteroatoms of the molecule have together?'),
            kind: 'number', answer: { value: total, tol: 0 },
            hint: t('Heteroatomas turi tiek laisvųjų porų, kiek valentinių elektronų lieka po ryšių: $N$ – viena, $O$ ir $S$ – dvi, halogenas – trys.', 'A heteroatom has as many lone pairs as valence electrons are left after the bonds: $N$ – one, $O$ and $S$ – two, a halogen – three.'),
            solution: [{ p: t('Poras turi: ' + [1, 2, 3].filter((x) => lp.indexOf(x) >= 0).map((x) => where(x) + ' – po ' + x).join('; ') + '. Iš viso: ' + total + '.', 'Pairs: ' + [1, 2, 3].filter((x) => lp.indexOf(x) >= 0).map((x) => where(x, true) + ' – ' + x + ' each').join('; ') + '. In total: ' + total + '.') }, mo(smi, { lonePairs: true, numbers: 'all' })]
          },
          {
            prompt: t('Bakstelėkite atomus, turinčius lygiai ' + k + ' laisv' + (k === 1 ? 'ąją elektronų porą' : k === 2 ? 'ąsias elektronų poras' : 'ąsias elektronų poras') + '.', 'Tap the atoms that have exactly ' + k + ' lone pair' + (k > 1 ? 's' : '') + '.'),
            kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: ans,
            hint: t('Palyginkite heteroatomų grupes: azotas, deguonis ir siera, halogenai turi skirtingą porų skaičių.', 'Compare the groups of heteroatoms: nitrogen, oxygen and sulfur, and the halogens each have a different number of pairs.'),
            solution: t('Tokie atomai: ' + where(k) + '.', 'These atoms: ' + where(k, true) + '.')
          }
        ];
        const ns = nameStep(ctx, smi);
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Pateiktas junginys; atomai sunumeruoti.', 'A compound is shown; the atoms are numbered.') }, { mol: { smi, opts: { numbers: 'all' } } }],
          steps,
          why: t('Skeleto formulėje heteroatomų laisvosios elektronų poros paprastai nežymimos, bet jas galima atskaityti iš valentingumo. Jos lemia heteroatomo savybes: aminų ir alkoholių bazingumą bei nukleofiliškumą.', 'In a skeletal formula the lone pairs of heteroatoms are normally not drawn, but they can be read from the valence. They set the properties of the heteroatom: the basicity and nucleophilicity of amines and alcohols.'),
          src: 'S1.4, L1 p15'
        };
      }
    }
  ];

  ORG.unit({
    id: 'u01',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S1.1': ['u01.carbons', 'u01.numbering', 'u01.fromname'],
      'S1.2': ['u01.alkane'],
      'S1.3': ['u01.formulas', 'u01.fgroups'],
      'S1.4': ['u01.lonepairs', 'u01.name', 'u01.acidname'],
      'S1.5': ['u01.formulas'],
      'S1.6': ['u01.fgroups'],
      'S1.7': ['u01.describe'],
      'S1.8': ['u01.chain', 'u01.numbering', 'u01.name'],
      'S1.9': ['u01.fgroups', 'u01.senior'],
      'S1.10': ['u01.fgroups', 'u01.senior', 'u01.trivial'],
      'S1.11': ['u01.trivial'],
      'S1.12': ['u01.acidname'],
      'S1.13': ['u01.name', 'u01.senior'],
      'S1.14': ['u01.trivial', 'u01.acidname', 'u01.senior'],
      'S1.15': ['u01.fromname', 'u01.acidname', 'u01.senior']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
