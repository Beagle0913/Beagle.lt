// site/organic/units/u13.js: unit 13, aldehydes and ketones (nucleophilic addition AN, alpha-position reactions)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // reagent labels that are only formulas

  /* ---------- small helpers shared by the generators ---------- */
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  // the carbonyl carbon (aldehyde or ketone) of a SMILES: atom index, or -1
  function carbonylC(ctx, smi) {
    const g = ctx.chem.groups(ctx.chem.parse(smi)).find((x) => x.type === 'aldehyde' || x.type === 'ketone');
    return g ? g.atoms[0] : -1;
  }
  // alpha carbons that carry hydrogen (sp3 carbons next to the carbonyl carbon)
  function alphaCs(ctx, smi) {
    const m = ctx.chem.parse(smi);
    const c = carbonylC(ctx, smi);
    if (c < 0) return [];
    return m.nbr[c].filter((j) => m.atoms[j].el === 'C' && !m.atoms[j].aromatic && m.atoms[j].h > 0 && m.bondAt(c, j).order === 1);
  }
  // options: the right ones first, then distinct wrong ones; duplicates by structure are dropped
  function optList(ctx, rights, wrongs, n) {
    const seen = new Set();
    const out = [];
    const add = (s) => {
      if (!s) return false;
      const k = canon(ctx, s);
      if (seen.has(k)) return false;
      seen.add(k);
      out.push({ mol: { smi: s } });
      return true;
    };
    rights.forEach(add);
    wrongs.forEach((s) => { if (out.length < n) add(s); });
    return out;
  }
  const majors = (res) => res.products.filter((p) => p.major && !p.by).map((p) => p.smi);
  // 'CH3CH2CHO' for acyclic non-aromatic molecules, otherwise null
  const cond = (ctx, smi) => { const c = ctx.draw.condensed(smi); return c ? '$' + c + '$' : null; };
  const SMALL = ['C=O', 'CO', 'OC=O', '[O-]C', 'OCO'];
  const M = (smi) => (SMALL.includes(smi) ? { smi, opts: { allH: true } } : { smi });   // one-carbon compounds are drawn with their hydrogens
  const pairScheme = (smis) => ({ scheme: { items: smis.reduce((a, s, i) => a.concat(i ? [{ plus: true }] : [], [M(s)]), []) } });

  /* ---------- mechanisms drawn in the notes and again in worked solutions ---------- */
  const BOX = { lonePairs: true };
  const MECH = {
    // nucleophilic addition under basic conditions, cyanide as the nucleophile (L13 p8)
    base: [
      {
        scheme: { items: [{ smi: 'CC(=O)C', opts: { lonePairs: [2], rotate: 180 } }, { plus: true }, { smi: '[C-]#N', opts: { lonePairs: [0] } }, { arrow: '→' }, { smi: 'CC([O-])(C)C#N', opts: { lonePairs: [2] } }] },
        arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
        note: t('1 stadija: nukleofilas atakuoja karbonilo anglį, $π$ ryšio elektronai pereina deguoniui.', 'Stage 1: the nucleophile attacks the carbonyl carbon and the $π$ electrons move onto oxygen.')
      },
      {
        scheme: { items: [{ smi: 'CC([O-])(C)C#N', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'O', opts: { allH: true, lonePairs: true } }, { arrow: '→' }, { smi: 'CC(O)(C)C#N' }, { plus: true }, { smi: '[OH-]' }] },
        arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
        note: t('2 stadija: alkoksido jonas paima protoną iš vandens.', 'Stage 2: the alkoxide ion takes a proton from water.')
      }
    ],
    // acid-catalysed hydration of ethanal (L13 p13)
    hydration: [
      {
        scheme: { items: [{ smi: 'CC=O', opts: { lonePairs: [2] } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: 'CC=[OH+]' }] },
        arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 0 } }],
        note: t('Deguonis protonizuojamas: anglies $δ+$ padidėja.', 'Oxygen is protonated: the $δ+$ on carbon grows.')
      },
      {
        scheme: { items: [{ smi: 'CC=[OH+]' }, { plus: true }, { smi: 'O', opts: { allH: true, lonePairs: [0] } }, { arrow: '→' }, { smi: 'CC(O)[OH2+]' }] },
        arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
        note: t('Vanduo atakuoja protonizuotą karbonilą.', 'Water attacks the protonated carbonyl.')
      },
      {
        scheme: { items: [{ smi: 'CC(O)[OH2+]', opts: { allH: true, coords: [[0, 0], [0.87, 0.5], [1.73, 0], [0.87, 1.5]] } }, { arrow: '→' }, { smi: 'CC(O)O' }, { plus: true }, { smi: '[H+]' }] },
        arrows: [{ from: { m: 0, b: [3, 'H3'] }, to: { m: 0, a: 3 } }],
        note: t('Oksonio jonas netenka protono: susidaro hidratas.', 'The oxonium ion loses a proton: the hydrate forms.')
      }
    ],
    // hydride reduction (L13 p10)
    hydride: [
      {
        scheme: { items: [{ smi: 'CC(=O)C', opts: { lonePairs: [2] } }, { plus: true }, { smi: '[BH4-]', opts: { allH: true } }, { arrow: '→' }, { smi: 'CC(C)[O-]' }, { plus: true }, { smi: 'B' }] },
        arrows: [{ from: { m: 1, b: [0, 'H0'] }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
        note: t('1 stadija: hidrido jonas $H-$ atakuoja karbonilo anglį.', 'Stage 1: the hydride ion $H-$ attacks the carbonyl carbon.')
      },
      {
        scheme: { items: [{ smi: 'CC(C)[O-]' }, { plus: true }, { smi: 'O', opts: { allH: true, lonePairs: [0] } }, { arrow: '→' }, { smi: 'CC(C)O' }, { plus: true }, { smi: '[OH-]' }] },
        arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
        note: t('2 stadija: alkoksidas protonuojamas vandeniu: gaunamas antrinis alkoholis.', 'Stage 2: water protonates the alkoxide: a secondary alcohol results.')
      }
    ],
    // hemiacetal formation in acid (L13 p16)
    hemi: [
      {
        scheme: { items: [{ smi: 'CCC=O', opts: { lonePairs: [3] } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: 'CCC=[OH+]' }] },
        arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 0 } }],
        note: t('1 stadija: karbonilo deguonis protonizuojamas.', 'Stage 1: the carbonyl oxygen is protonated.')
      },
      {
        scheme: { items: [{ smi: 'CCC=[OH+]' }, { plus: true }, { smi: 'CO', opts: { lonePairs: [1] } }, { arrow: '→' }, { smi: 'CCC(O)[OH+]C' }] },
        arrows: [{ from: { m: 1, lp: 1 }, to: { m: 0, a: 2 } }, { from: { m: 0, b: [2, 3] }, to: { m: 0, a: 3 } }],
        note: t('2 stadija: alkoholio deguonies elektronų pora atakuoja anglį.', 'Stage 2: a lone pair of the alcohol oxygen attacks the carbon.')
      },
      {
        scheme: { items: [{ smi: 'CCC(O)[OH+]C', opts: { allH: true } }, { arrow: '→' }, { smi: 'CCC(O)OC' }, { plus: true }, { smi: '[H+]' }] },
        arrows: [{ from: { m: 0, b: [4, 'H4'] }, to: { m: 0, a: 4 } }],
        note: t('3 stadija: protonas atsiskiria: susidaro hemiacetalis.', 'Stage 3: a proton is lost: the hemiacetal forms.')
      }
    ],
    // acetal formation from the hemiacetal in acid (L13 p16)
    acetal: [
      {
        scheme: { items: [{ smi: 'CCC(O)OC', opts: { lonePairs: [3] } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: 'CCC([OH2+])OC' }] },
        arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 0 } }],
        note: t('1 stadija: hidroksigrupė protonizuojama, kad galėtų išeiti kaip vanduo.', 'Stage 1: the hydroxy group is protonated so that it can leave as water.')
      },
      {
        scheme: { items: [{ smi: 'CCC([OH2+])OC', opts: { lonePairs: [4] } }, { arrow: '→' }, { smi: 'CCC=[O+]C' }, { plus: true }, { smi: 'O' }] },
        arrows: [{ from: { m: 0, lp: 4 }, to: { m: 0, mid: [2, 4] } }, { from: { m: 0, b: [2, 3] }, to: { m: 0, a: 3 } }],
        note: t('2 stadija: atskyla vanduo; metoksigrupės deguonis stabilizuoja teigiamą krūvį.', 'Stage 2: water leaves; the methoxy oxygen stabilises the positive charge.')
      },
      {
        scheme: { items: [{ smi: 'CCC=[O+]C' }, { plus: true }, { smi: 'CO', opts: { lonePairs: [1] } }, { arrow: '→' }, { smi: 'CCC(OC)[OH+]C' }] },
        arrows: [{ from: { m: 1, lp: 1 }, to: { m: 0, a: 2 } }, { from: { m: 0, b: [2, 3] }, to: { m: 0, a: 3 } }],
        note: t('3 stadija: antra alkoholio molekulė atakuoja katijoną.', 'Stage 3: a second alcohol molecule attacks the cation.')
      },
      {
        scheme: { items: [{ smi: 'CCC(OC)[OH+]C', opts: { allH: true } }, { arrow: '→' }, { smi: 'CCC(OC)OC' }, { plus: true }, { smi: '[H+]' }] },
        arrows: [{ from: { m: 0, b: [5, 'H5'] }, to: { m: 0, a: 5 } }],
        note: t('4 stadija: protonas atsiskiria: susidaro acetalis.', 'Stage 4: a proton is lost: the acetal forms.')
      }
    ],
    // imine formation, simplified (L13 p25, p27)
    imine: [
      {
        scheme: { items: [{ smi: 'CC(=O)C', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CN', opts: { lonePairs: [1] } }, { arrow: '→' }, { smi: 'CC([O-])(C)[NH2+]C' }] },
        arrows: [{ from: { m: 1, lp: 1 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
        note: t('1 stadija (AN): azoto elektronų pora atakuoja karbonilo anglį; susidaro dipolinis jonas.', 'Stage 1 (AN): the nitrogen lone pair attacks the carbonyl carbon; a zwitterion forms.')
      },
      {
        scheme: { items: [{ smi: 'CC([O-])(C)[NH2+]C' }, { arrow: '→' }, { smi: 'CC(O)(C)NC' }] },
        arrows: [],
        note: t('2 stadija: protonų pernaša per tirpiklį: $O−$ prisijungia protoną, o $N+$ jo netenka; susidaro karbinolaminas.', 'Stage 2: proton transfer through the solvent: $O−$ gains a proton and $N+$ loses one; the carbinolamine forms.')
      },
      {
        scheme: { items: [{ smi: 'CC(O)(C)NC', opts: { lonePairs: [2, 4] } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: 'CC([OH2+])(C)NC', opts: { lonePairs: [4] } }] },
        arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 0 } }],
        note: t('3 stadija: rūgščioje terpėje hidroksigrupė protonizuojama.', 'Stage 3: in acid the hydroxy group is protonated.')
      },
      {
        scheme: { items: [{ smi: 'CC([OH2+])(C)NC', opts: { lonePairs: [4] } }, { arrow: '→' }, { smi: 'CC(C)=[NH+]C' }, { plus: true }, { smi: 'O' }] },
        arrows: [{ from: { m: 0, lp: 4 }, to: { m: 0, mid: [1, 4] } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
        note: t('4 stadija (E): atskyla vanduo, azotas sudaro $C=N$ ryšį.', 'Stage 4 (elimination, E): water leaves and nitrogen forms the $C=N$ bond.')
      },
      {
        scheme: { items: [{ smi: 'CC(C)=[NH+]C', opts: { allH: true, coords: [[-0.87, -0.5], [0, 0], [0.87, -0.5], [0, 1], [0, 2]] } }, { arrow: '→' }, { smi: 'CC(C)=NC' }, { plus: true }, { smi: '[H+]' }] },
        arrows: [{ from: { m: 0, b: [3, 'H3'] }, to: { m: 0, a: 3 } }],
        note: t('5 stadija: protonas atsiskiria: susidaro iminas.', 'Stage 5: a proton is lost: the imine forms.')
      }
    ],
    // Cannizzaro reaction of methanal (L13 p33-34)
    cann: [
      {
        scheme: { items: [{ smi: 'C=O', opts: { allH: true, lonePairs: [1] } }, { plus: true }, { smi: '[OH-]', opts: { lonePairs: [0] } }, { arrow: '→' }, { smi: '[O-]CO', opts: { allH: true } }] },
        arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 0 } }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 } }],
        note: t('1 stadija: hidroksidas prisijungia prie karbonilo anglies.', 'Stage 1: hydroxide adds to the carbonyl carbon.')
      },
      {
        scheme: { items: [{ smi: '[O-]CO', opts: { allH: true, lonePairs: [0] } }, { plus: true }, { smi: 'C=O', opts: { allH: true, lonePairs: [1] } }, { arrow: '→' }, { smi: 'O=CO', opts: { allH: true } }, { plus: true }, { smi: '[O-]C', opts: { allH: true } }] },
        arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, mid: [0, 1] } }, { from: { m: 0, b: [1, 'H1'] }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
        note: t('2 stadija: hidrido jonas pereina prie kitos aldehido molekulės: viena molekulė oksiduojasi, kita redukuojasi.', 'Stage 2: a hydride ion moves to a second aldehyde molecule: one molecule is oxidised, the other reduced.')
      },
      {
        scheme: { items: [{ smi: 'OC=O', opts: { allH: true } }, { plus: true }, { smi: '[O-]C', opts: { allH: true, lonePairs: [0] } }, { arrow: '→' }, { smi: '[O-]C=O', opts: { allH: true } }, { plus: true }, { smi: 'CO', opts: { allH: true } }] },
        arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H0' } }, { from: { m: 0, b: [0, 'H0'] }, to: { m: 0, a: 0 } }],
        note: t('3 stadija: rūgštis atiduoda protoną alkoksidui: susidaro karboksilatas ir alkoholis.', 'Stage 3: the acid gives its proton to the alkoxide: a carboxylate and an alcohol result.')
      }
    ],
    // aldol addition of propanal in dilute base (L13 p43, p46)
    aldol: [
      {
        scheme: { items: [{ smi: 'CCC=O', opts: { allH: true, lonePairs: [3] } }, { plus: true }, { smi: '[OH-]', opts: { lonePairs: [0] } }, { arrow: '→' }, { smi: 'CC=C[O-]' }, { plus: true }, { smi: 'O' }] },
        arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H1' } }, { from: { m: 0, b: [1, 'H1'] }, to: { m: 0, mid: [1, 2] } }, { from: { m: 0, b: [2, 3] }, to: { m: 0, a: 3 } }],
        note: t('1 stadija: bazė atplėšia $α$-protoną: susidaro enoliato jonas.', 'Stage 1: the base removes an $α$ proton: an enolate ion forms.')
      },
      {
        scheme: { items: [{ smi: 'CC=C[O-]', opts: { lonePairs: [3] } }, { plus: true }, { smi: 'CCC=O', opts: { lonePairs: [3] } }, { arrow: '→' }, { smi: 'CCC([O-])C(C)C=O' }] },
        arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 1, a: 2 } }, { from: { m: 1, b: [2, 3] }, to: { m: 1, a: 3 } }, { from: { m: 0, lp: 3 }, to: { m: 0, mid: [2, 3] } }],
        note: t('2 stadija: enoliatas (nukleofilas) atakuoja kitos molekulės karbonilo anglį.', 'Stage 2: the enolate (the nucleophile) attacks the carbonyl carbon of a second molecule.')
      },
      {
        scheme: { items: [{ smi: 'CCC([O-])C(C)C=O', opts: { lonePairs: [3], flip: 'x' } }, { plus: true }, { smi: 'O', opts: { allH: true, lonePairs: [0] } }, { arrow: '→' }, { smi: 'CCC(O)C(C)C=O' }, { plus: true }, { smi: '[OH-]' }] },
        arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
        note: t('3 stadija: alkoksidas paima protoną iš vandens: susidaro aldolis.', 'Stage 3: the alkoxide takes a proton from water: the aldol forms.')
      }
    ],
    // elimination of water from the aldol (L13 p46, part 2), shown with 3-hydroxybutanal
    cond: [
      {
        scheme: { items: [{ smi: 'CC(O)CC=O', opts: { allH: true } }, { plus: true }, { smi: '[OH-]', opts: { lonePairs: [0] } }, { arrow: '→' }, { smi: 'CC(O)C=C[O-]' }, { plus: true }, { smi: 'O' }] },
        arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H3' } }, { from: { m: 0, b: [3, 'H3'] }, to: { m: 0, mid: [3, 4] } }, { from: { m: 0, b: [4, 5] }, to: { m: 0, a: 5 } }],
        note: t('1 stadija: bazė atplėšia kitą $α$-protoną: vėl susidaro enoliatas (pavyzdys su 3-hidroksibutanaliu).', 'Stage 1: the base removes the other $α$ proton: an enolate forms again (example with 3-hydroxybutanal).')
      },
      {
        scheme: { items: [{ smi: 'CC(O)C=C[O-]', opts: { lonePairs: [5] } }, { arrow: '→' }, { smi: 'CC=CC=O' }, { plus: true }, { smi: '[OH-]' }] },
        arrows: [{ from: { m: 0, lp: 5 }, to: { m: 0, mid: [4, 5] } }, { from: { m: 0, b: [3, 4] }, to: { m: 0, mid: [1, 3] } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
        note: t('2 stadija: iš enoliato išeina hidroksido jonas: susidaro $α,β$-nesotusis aldehidas.', 'Stage 2: hydroxide leaves the enolate: the $α,β$-unsaturated aldehyde forms.')
      }
    ]
  };

  /* ---------- compound pools ---------- */
  // aldehydes with alpha hydrogens
  const ALD = ['CC=O', 'CCC=O', 'CCCC=O', 'CCCCC=O', 'CC(C)CC=O', 'CCCCCC=O', 'CC(C)C=O', 'CCC(C)C=O', 'O=CCc1ccccc1'];
  // aldehydes without alpha hydrogens (Cannizzaro, the electrophile of crossed aldol reactions)
  const NOA = ['C=O', 'O=Cc1ccccc1', 'O=Cc1ccc(C)cc1', 'O=Cc1ccc(Cl)cc1', 'O=Cc1ccc(OC)cc1', 'O=Cc1ccc(F)cc1', 'O=Cc1ccccc1Cl'];
  const KET = ['CC(C)=O', 'CCC(C)=O', 'CCC(=O)CC', 'CCCC(C)=O', 'O=C1CCCC1', 'O=C1CCCCC1', 'CC(=O)c1ccccc1', 'CC(C)CC(C)=O', 'CC(C)C(=O)C(C)C', 'CCCC(=O)CCC'];
  const ALCOHOLS = ['CO', 'CCO', 'CCCO', 'CC(C)O'];

  // hydrate of a carbonyl SMILES by string surgery (validated by the caller)
  function hydrateSmi(s) {
    if (s.includes('(=O)')) return s.replace('(=O)', '(O)(O)');
    if (s.endsWith('=O')) return s.slice(0, -2) + '(O)O';
    if (s.startsWith('O=C1')) return 'OC1(O)' + s.slice(4);
    if (s.startsWith('O=C')) return 'OC(O)' + s.slice(3);
    return null;
  }
  // one group a replaces the carbonyl oxygen (the carbon keeps an implicit H), or two groups a, b
  function sub1(s, a) {
    if (s.includes('(=O)')) return s.replace('(=O)', '(' + a + ')');
    if (s.endsWith('=O')) return s.slice(0, -2) + '(' + a + ')';
    if (s.startsWith('O=C1')) return 'C1(' + a + ')' + s.slice(4);
    if (s.startsWith('O=C')) return 'C(' + a + ')' + s.slice(3);
    return null;
  }
  function sub2(s, a, b) {
    if (s.includes('(=O)')) return s.replace('(=O)', '(' + a + ')(' + b + ')');
    if (s.endsWith('=O')) return s.slice(0, -2) + '(' + a + ')' + b;
    if (s.startsWith('O=C1')) return 'C1(' + a + ')(' + b + ')' + s.slice(4);
    if (s.startsWith('O=C')) return 'C(' + a + ')(' + b + ')' + s.slice(3);
    return null;
  }
  // 'name the product' steps for those compounds that the namer can name
  function nameSteps(ctx, smis) {
    return smis.map((smi) => {
      const lt = ctx.name.name(smi, { lang: 'lt' }), en = ctx.name.name(smi, { lang: 'en' });
      if (!lt || !en) return null;
      return {
        prompt: t('Pavadinkite pavaizduotą produktą.', 'Name the product shown.'),
        kind: 'name', mol: { smi }, answer: { smi },
        hint: t('Raskite pagrindinę grandinę ir funkcinę grupę, paskui sunumeruokite.', 'Find the parent chain and the functional group, then number.'),
        solution: t(lt.name, en.name)
      };
    }).filter((x) => x);
  }
  // the same chemical formula test through the engine
  function sameFormula(ctx, a, b) {
    return ctx.chem.formulaString(ctx.chem.parse(a)) === ctx.chem.formulaString(ctx.chem.parse(b));
  }

  ORG.unit({
    id: 'u13',
    notes: [
      /* ============ 1. the carbonyl group ============ */
      {
        id: 'carbonyl',
        title: t('Karbonilgrupė ir jos reaktingumas', 'The carbonyl group and its reactivity'),
        blocks: [
          { h: t('Aldehidai ir ketonai', 'Aldehydes and ketones') },
          {
            p: t('Abiejų klasių funkcinė grupė yra karbonilgrupė $C=O$. Aldehido karbonilo anglis turi bent vieną vandenilį, ketono – dvi anglies grandines. Aldehidų pavadinimų galūnė yra -alis, ketonų – -onas.',
              'Both classes share the carbonyl group $C=O$. The carbonyl carbon of an aldehyde carries at least one hydrogen, that of a ketone two carbon chains. Aldehyde names end in -al (LT -alis), ketone names in -one (LT -onas).'),
            src: 'L13 p2'
          },
          {
            mol: [
              { smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } },
              { smi: 'CC=O', name: t('etanalis', 'ethanal') },
              { smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') },
              { smi: 'CC(C)=O', name: t('propanonas', 'propanone') },
              { smi: 'O=C1CCCCC1', name: t('cikloheksanonas', 'cyclohexanone') }
            ],
            caption: t('Metanalio 37 % vandeninis tirpalas vadinamas formalinu.', 'A 37 % aqueous solution of methanal is called formalin.'),
            src: 'L13 p2'
          },
          { p: t('Aldehidų ir ketonų yra gamtoje: vanilinas, cinamono aldehidas, kamparas, progesteronas ir testosteronas turi karbonilgrupę.', 'Aldehydes and ketones occur in nature: vanillin, cinnamaldehyde, camphor, progesterone and testosterone contain a carbonyl group.'), src: 'L13 p3' },
          { h: t('Poliškumas ir trys reakcijų sritys', 'Polarity and the three reaction areas') },
          {
            p: t('Deguonis elektroneigiamesnis už anglį, todėl $π$ ryšys stipriai poliarizuotas: anglis tampa iš dalies teigiama ($δ+$), deguonis – iš dalies neigiamas ($δ−$). Todėl anglį atakuoja nukleofilai, o deguonį – elektrofilai, pavyzdžiui $H+$. Šalia esančios $α$ anglies vandenilis irgi tampa judrus.',
              'Oxygen is more electronegative than carbon, so the $π$ bond is strongly polarised: carbon carries a partial positive charge $δ+$, oxygen $δ−$. Nucleophiles therefore attack the carbon and electrophiles such as $H+$ attack the oxygen. The hydrogen on the neighbouring $α$ carbon also becomes mobile.'),
            src: 'L13 p4'
          },
          { mol: { smi: 'CCC=O', opts: { deltas: { 2: '+', 3: '-' }, numbers: { 1: 'α' } } }, caption: t('Propanalis: $δ+$ ant karbonilo anglies, $α$ anglis pažymėta.', 'Propanal: $δ+$ on the carbonyl carbon, the $α$ carbon is labelled.') },
          {
            list: [
              t('nukleofilinis prijungimas prie karbonilgrupės (AN);', 'nucleophilic addition to the carbonyl group (AN);'),
              t('virsmai $α$ padėtyje (enolizacija, aldolinės reakcijos, halogeninimas);', 'conversions at the $α$ carbon (enolisation, aldol reactions, halogenation);'),
              t('oksidacijos–redukcijos reakcijos.', 'oxidation–reduction reactions.')
            ],
            src: 'L13 p4'
          },
          { h: t('Kas lemia aktyvumą?', 'What decides the reactivity?') },
          {
            rule: t('Karbonilgrupės aktyvumas nukleofilų atžvilgiu didėja, kai didėja karbonilo anglies $δ+$ (elektronų akceptorinės grupės, $−I$), kai mažėja erdviniai trukdžiai ir kai terpė rūgštesnė. Eilė: $Cl3C-CHO > H-CHO > R-CHO > R-CO-R$.',
              'Reactivity towards nucleophiles grows with the $δ+$ on the carbonyl carbon (electron-withdrawing groups, $−I$), with less steric hindrance and with a more acidic medium. Order: $Cl3C-CHO > H-CHO > R-CHO > R-CO-R$.'),
            src: 'L13 p5, p6'
          },
          {
            mol: [
              { smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', '2,2,2-trichloroethanal') },
              { smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } },
              { smi: 'CCC=O', name: t('propanalis', 'propanal') },
              { smi: 'CCC(=O)CC', name: t('3-pentanonas', 'pentan-3-one') }
            ],
            caption: t('Iš kairės į dešinę $δ+$ ir reaktingumas mažėja.', 'From left to right the $δ+$ and the reactivity decrease.'),
            src: 'L13 p6'
          },
          { p: t('Alkilgrupė stumia elektronus ($+I$) ir yra didesnė už vandenilį. Ketonas turi du tokius pakaitus, aldehidas – tik vieną, todėl ketonai reaguoja lėčiau. Rūgščioje terpėje deguonis protonizuojamas ir anglies $δ+$ dar padidėja.', 'An alkyl group pushes electrons ($+I$) and is bulky; a ketone has two of them, an aldehyde only one, so ketones react more slowly. In acid the oxygen is protonated and the $δ+$ on carbon grows further.') },
          { resonance: [{ smi: 'CC(=[OH+])C' }, { smi: 'C[C+](O)C' }], caption: t('Protonuotas karbonilas: teigiamas krūvis daugiausia ant anglies.', 'Protonated carbonyl: the positive charge sits largely on carbon.'), src: 'L13 p6' },
          {
            pitfall: t('Ketonai mažiau reaktingi dėl dviejų priežasčių kartu: elektroninės ($+I$ mažina $δ+$) ir erdvinės. Norėdami palyginti du junginius, nagrinėkite abi.', 'Ketones are less reactive for two reasons at once: electronic ($+I$ lowers $δ+$) and steric. When you compare two compounds, look at both.')
          },
          {
            example: {
              q: [
                { p: t('Išdėstykite pagal reaktingumą su nukleofilais: chloretanalis, etanalis, propanonas.', 'Rank by reactivity towards nucleophiles: chloroethanal, ethanal, propanone.') },
                { mol: [{ smi: 'ClCC=O', name: t('chloretanalis', '2-chloroethanal') }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }] }
              ],
              steps: [
                [{ p: t('Chloras traukia elektronus ($−I$): chloretanalyje karbonilo anglies $δ+$ didžiausias.', 'Chlorine withdraws electrons ($−I$): the carbonyl carbon of chloroethanal has the largest $δ+$.') }],
                [{ p: t('Etanalis yra aldehidas: turi vieną alkilą ir mažą $H$, todėl yra reaktingesnis už ketoną.', 'Ethanal is an aldehyde: one alkyl group and a small $H$, so it is more reactive than a ketone.') }],
                [{ p: t('Propanonas turi du metilus: silpnesnis $δ+$ ir didesni trukdžiai. Eilė: chloretanalis > etanalis > propanonas.', 'Propanone has two methyl groups: a weaker $δ+$ and more hindrance. Order: chloroethanal > ethanal > propanone.') }]
              ]
            },
            claims: [
              { name: ['ClCC=O', t('chloretanalis', '2-chloroethanal')] },
              { name: ['CC=O', t('etanalis', 'ethanal')] },
              { name: ['CC(C)=O', t('propanonas', 'propanone')] }
            ]
          },
          { practice: 'u13.order' }
        ]
      },

      /* ============ 2. AN and hydrates ============ */
      {
        id: 'an',
        title: t('Nukleofilinis prijungimas ir hidratai', 'Nucleophilic addition and hydrates'),
        blocks: [
          { h: t('AN mechanizmas', 'The AN mechanism') },
          {
            p: t('Nukleofilas $Nu$ atakuoja karbonilo anglį, $π$ ryšio elektronai pereina deguoniui, o gautas alkoksido jonas prijungia elektrofilą (dažniausiai $H+$). Aldehidai šiose reakcijose reaktingesni už ketonus.',
              'The nucleophile $Nu$ attacks the carbonyl carbon, the $π$ electrons move onto oxygen, and the resulting alkoxide ion picks up an electrophile (usually $H+$). Aldehydes are more reactive than ketones in these reactions.'),
            src: 'L13 p7, p8'
          },
          { mech: MECH.base, caption: t('Bazinė terpė (nukleofilas $CN-$): pirma ataka, paskui protonizacija.', 'Basic medium (nucleophile $CN-$): first the attack, then protonation.'), src: 'L13 p8' },
          {
            rule: t('Bazinėje terpėje stiprus nukleofilas atakuoja neutralų karbonilą. Rūgštinėje terpėje pirmiausia protonizuojamas karbonilo deguonis, ir tik tada nukleofilas atakuoja.',
              'In a basic medium a strong nucleophile attacks the neutral carbonyl. In an acidic medium the carbonyl oxygen is protonated first, and only then does the nucleophile attack.'),
            src: 'L13 p8'
          },
          { h: t('Vandens prijungimas: hidratai', 'Addition of water: hydrates') },
          {
            p: t('Aldehidai ir ketonai grįžtamai prijungia vandenį ir sudaro hidratus (1,1-diolius). Daugumos hidratų išskirti negalima: pašalinus vandenį pusiausvyra grįžta į karbonilo junginį. Etanalio vandeniniame tirpale hidrato yra apie 58 %.',
              'Aldehydes and ketones add water reversibly and form hydrates (1,1-diols). Most hydrates cannot be isolated: when the water is removed, the equilibrium shifts back to the carbonyl compound. In an aqueous solution of ethanal about 58 % is the hydrate.'),
            src: 'L13 p12, p13'
          },
          { scheme: { items: [{ smi: 'CC=O', name: t('etanalis', 'ethanal') }, { plus: true }, { smi: 'O' }, { arrow: '⇌' }, { smi: 'CC(O)O' }] }, caption: t('Etanalis ir vanduo: hidratas.', 'Ethanal and water: the hydrate.'), src: 'L13 p12' },
          { mech: MECH.hydration, caption: t('Hidratacija rūgščioje terpėje.', 'Hydration in acid.'), src: 'L13 p13' },
          {
            rule: t('Stabilų hidratą duoda aldehidas, turintis šalia karbonilo elektronus traukiančią grupę ($α$ padėtyje): ji padidina $δ+$ ir pastumia pusiausvyrą į hidrato pusę.',
              'A stable hydrate is formed by an aldehyde with an electron-withdrawing group in the $α$ position: it increases the $δ+$ and shifts the equilibrium towards the hydrate.'),
            src: 'L13 p12'
          },
          {
            scheme: { items: [{ smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', 'trichloroethanal') }, { plus: true }, { smi: 'O' }, { arrow: '⇌' }, { smi: 'ClC(Cl)(Cl)C(O)O', name: t('2,2,2-trichlor-1,1-etandiolis', '2,2,2-trichloroethane-1,1-diol') }] },
            caption: t('Trichloretanalis (chloralis) ir vanduo. Chloralhidratas anksčiau buvo vartojamas kaip migdomieji vaistai.', 'Trichloroethanal (chloral) and water: chloral hydrate was once used as a sleeping drug.'),
            src: 'L13 p12'
          },
          {
            pitfall: t('Hidratas nėra „šlapias aldehidas“: tai atskiras junginys su dviem $OH$ prie vienos anglies. Ketonų hidratacijos pusiausvyra paprastai pasislinkusi į karbonilo pusę.', 'A hydrate is not a "wet aldehyde": it is a separate compound with two $OH$ groups on one carbon. For ketones the hydration equilibrium usually lies on the carbonyl side.')
          },
          {
            example: {
              q: [
                { p: t('Kuris sudaro patvaresnį hidratą vandenyje?', 'Which forms the more stable hydrate in water?') },
                { mol: [{ smi: 'ClC(Cl)(Cl)C(C)=O', name: t('1,1,1-trichlor-2-propanonas', '1,1,1-trichloropropan-2-one') }, { smi: 'CCC(C)=O', name: t('butanonas', 'butanone') }] }
              ],
              steps: [
                [{ p: t('Hidratacijos pusiausvyrą lemia karbonilo anglies $δ+$.', 'The hydration equilibrium depends on the $δ+$ of the carbonyl carbon.') }],
                [{ p: t('$CCl3$ stipriai traukia elektronus ($−I$), todėl $δ+$ didelis; etilas jį mažina.', '$CCl3$ withdraws electrons strongly ($−I$), so $δ+$ is large; an ethyl group lowers it.') }],
                [{ p: t('Patvaresnį hidratą duoda trichlorpropanonas.', 'The trichloropropanone gives the more stable hydrate.') }, { mol: { smi: 'ClC(Cl)(Cl)C(C)(O)O' } }]
              ]
            },
            claims: [{ formula: ['ClC(Cl)(Cl)C(C)(O)O', 'C3H5Cl3O2'] }, { name: ['ClC(Cl)(Cl)C(C)=O', t('1,1,1-trichlor-2-propanonas', '1,1,1-trichloropropan-2-one')] }]
          },
          { practice: 'u13.hydrate' }
        ]
      },

      /* ============ 3. hydride reduction ============ */
      {
        id: 'hydride',
        title: t('Redukcija hidridais', 'Reduction by hydrides'),
        blocks: [
          {
            p: t('Metalų hidridai $NaBH4$ ir $LiAlH4$ yra hidrido jono $H−$ šaltiniai. Hidridas, kaip nukleofilas, atakuoja karbonilo anglį. Aldehidai virsta pirminiais, ketonai – antriniais alkoholiais.',
              'The metal hydrides $NaBH4$ and $LiAlH4$ are sources of the hydride ion $H−$. As a nucleophile the hydride attacks the carbonyl carbon. Aldehydes give primary alcohols, ketones secondary alcohols.'),
            src: 'L13 p9'
          },
          {
            scheme: { items: [{ smi: 'CCCC=O', name: t('butanalis', 'butanal') }, { arrow: '→', above: t('1) LiAlH4  2) H2O', '1) LiAlH4  2) H2O') }, { smi: 'CCCCO', name: t('1-butanolis', 'butan-1-ol') }] },
            caption: t('Aldehidas: pirminis alkoholis.', 'An aldehyde: a primary alcohol.'),
            src: 'L13 p9'
          },
          {
            scheme: { items: [{ smi: 'O=C1CCCC1', name: t('ciklopentanonas', 'cyclopentanone') }, { arrow: '→', above: f('NaBH4'), below: t('$EtOH$, $MeOH$ arba $H2O$', '$EtOH$, $MeOH$ or $H2O$') }, { smi: 'OC1CCCC1', name: t('ciklopentanolis', 'cyclopentanol') }] },
            caption: t('Ketonas: antrinis alkoholis.', 'A ketone: a secondary alcohol.'),
            src: 'L13 p9'
          },
          { mech: MECH.hydride, caption: t('$NaBH4$ redukcija: nukleofilinė ataka, paskui protonizacija.', '$NaBH4$ reduction: nucleophilic attack, then protonation.'), src: 'L13 p10' },
          {
            rule: t('$NaBH4$ redukuoja tik aldehidų ir ketonų karbonilgrupę. Stipresnis $LiAlH4$ redukuoja ir esterius bei rūgštis. Izoliuoto $C=C$ jie neliečia. $H2$ ant $Pd$, priešingai, redukuoja $C=C$, o karbonilgrupę paprastai palieka nepakitusią.',
              '$NaBH4$ reduces only the carbonyl group of aldehydes and ketones. The stronger $LiAlH4$ also reduces esters and acids. Neither touches an isolated $C=C$, whereas $H2$ over $Pd$ reduces $C=C$ and usually leaves the carbonyl group alone.'),
            src: 'L13 p9, p19'
          },
          { p: t('Gyvuose organizmuose karbonilgrupę redukuoja hidrido donoras NADH.', 'In living organisms the hydride donor NADH reduces the carbonyl group.'), src: 'L13 p11' },
          {
            pitfall: t('$NaBH4$ ir $H2$/$Pd$ nėra tas pats: pirmasis tinka karbonilui, antrasis – $C=C$. Prieš renkantis reagentą nustatykite, kurią grupę norite redukuoti.', '$NaBH4$ and $H2$/$Pd$ are not interchangeable: the first suits a carbonyl group, the second $C=C$. Decide which group you want to reduce before choosing the reagent.')
          },
          {
            example: {
              q: [
                { p: t('Koks produktas, kai 2-heksanonas redukuojamas $NaBH4$?', 'What is the product when hexan-2-one is reduced with $NaBH4$?') },
                { mol: { smi: 'CCCCC(C)=O', name: t('2-heksanonas', 'hexan-2-one') } }
              ],
              steps: [
                [{ p: t('Hidridas atakuoja karbonilo anglį.', 'Hydride attacks the carbonyl carbon.') }],
                [{ p: t('Ketonas virsta antriniu alkoholiu.', 'A ketone becomes a secondary alcohol.') }, { mol: { smi: 'CCCCC(C)O', name: t('2-heksanolis', 'hexan-2-ol') } }]
              ]
            },
            claims: [{ react: ['co.nabh4', ['CCCCC(C)=O'], null, 'CCCCC(C)O'] }, { name: ['CCCCC(C)O', t('2-heksanolis', 'hexan-2-ol')] }, { name: ['CCCCC(C)=O', t('2-heksanonas', 'hexan-2-one')] }]
          },
          { practice: 'u13.nu' }
        ]
      },

      /* ============ 4. alcohols, thiols, acetals ============ */
      {
        id: 'acetals',
        title: t('Alkoholių ir tiolių prijungimas: acetaliai', 'Addition of alcohols and thiols: acetals'),
        blocks: [
          { h: t('Hemiacetaliai ir acetaliai', 'Hemiacetals and acetals') },
          {
            p: t('Aldehidas ar ketonas gali prijungti vieną alkoholio molekulę ir be katalizatoriaus, bet rūgštis šią reakciją pagreitina: susidaro hemiacetalis. Su antra alkoholio molekule ir rūgštimi hemiacetalis virsta acetaliu (ketonų atveju dar vadinamu ketaliu). Pirma stadija yra AN, antra – nukleofilinis pakeitimas.',
              'An aldehyde or ketone can add one alcohol molecule even without a catalyst, but acid speeds the addition up: a hemiacetal forms. With a second alcohol molecule and acid the hemiacetal becomes an acetal (for ketones also called a ketal). The first stage is AN, the second a nucleophilic substitution.'),
            src: 'L13 p14, p17'
          },
          {
            scheme: { items: [{ smi: 'CCCC=O', name: t('butanalis', 'butanal') }, { plus: true }, { smi: 'CCO', name: t('etanolis', 'ethanol') }, { arrow: '⇌', above: f('H+') }, { smi: 'CCCC(O)OCC', name: t('1-etoksi-1-butanolis', '1-ethoxybutan-1-ol') }, { arrow: '⇌', above: f('EtOH, H+'), below: f('−H2O') }, { smi: 'CCCC(OCC)OCC', name: t('1,1-dietoksibutanas', '1,1-diethoxybutane') }] },
            caption: t('Butanalis ir etanolis: hemiacetalis, po to acetalis.', 'Butanal and ethanol: the hemiacetal, then the acetal.'),
            src: 'L13 p14, p17'
          },
          { mech: MECH.hemi, caption: t('Hemiacetalio susidarymas rūgštyje.', 'Formation of the hemiacetal in acid.'), src: 'L13 p16' },
          { mech: MECH.acetal, caption: t('Hemiacetalis virsta acetaliu.', 'The hemiacetal becomes the acetal.'), src: 'L13 p16' },
          { p: t('Hemiacetalis susidaro ir neutralioje terpėje: alkoholio deguonis atakuoja karbonilą, o protonas persikelia nuo alkoholio prie alkoksido deguonies.', 'A hemiacetal also forms in a neutral medium: the alcohol oxygen attacks the carbonyl group and a proton moves from the alcohol to the alkoxide oxygen.'), src: 'L13 p15' },
          {
            rule: t('Hemiacetalis nepatvarus (patvarus tik ciklinis). Acetalis susidaro tik rūgščioje terpėje, reakcija grįžtamoji: vandeninėje rūgštyje acetalis hidrolizuojasi atgal į karbonilo junginį ir alkoholį. Šarminėje terpėje acetalis patvarus.',
              'A hemiacetal is unstable (only a cyclic one is stable). An acetal forms only in acid and the reaction is reversible: in aqueous acid the acetal hydrolyses back to the carbonyl compound and the alcohol. In base the acetal is stable.'),
            src: 'L13 p14, p18'
          },
          { h: t('Ciklinis acetalis: karbonilgrupės apsauga', 'Cyclic acetals: protecting the carbonyl group') },
          {
            p: t('Kai vietoje dviejų alkoholio molekulių naudojamas diolis, susidaro ciklinis acetalis. Jis naudojamas karbonilgrupei apsaugoti: kol reakcijoje dalyvauja kita grupė, acetalis jos nepaliečia, o paskui jis pašalinamas vandenine rūgštimi.',
              'When a diol replaces two alcohol molecules, a cyclic acetal forms. It protects the carbonyl group: while another group reacts, the acetal stays untouched, and it is removed afterwards with aqueous acid.'),
            src: 'L13 p18'
          },
          {
            scheme: { items: [{ smi: 'CCC(C)=O', name: t('butanonas', 'butanone') }, { plus: true }, { smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }, { arrow: '⇌', above: f('H+'), below: f('−H2O') }, { smi: 'CCC1(C)OCCO1' }] },
            caption: t('Butanonas ir 1,2-etandiolis: ciklinis acetalis.', 'Butanone and ethane-1,2-diol: a cyclic acetal.'),
            src: 'L13 p18'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)CCC(=O)OCC', name: t('etil-4-oksopentanoatas', 'ethyl 4-oxopentanoate') }, { arrow: '→', above: t('$HOCH2CH2OH$, $H+$', '$HOCH2CH2OH$, $H+$') }, { smi: 'CC1(CCC(=O)OCC)OCCO1' }] },
            caption: t('1 etapas: ketonas apsaugomas acetaliu.', 'Step 1: the ketone is protected as an acetal.'),
            src: 'L13 p19'
          },
          {
            scheme: { items: [{ smi: 'CC1(CCC(=O)OCC)OCCO1' }, { arrow: '→', above: t('1) $LiAlH4$  2) $H2O$', '1) $LiAlH4$  2) $H2O$') }, { smi: 'CC1(CCCO)OCCO1' }, { arrow: '→', above: t('$H3O+$', '$H3O+$') }, { smi: 'CC(=O)CCCO', name: t('5-hidroksi-2-pentanonas', '5-hydroxypentan-2-one') }] },
            caption: t('2 etapas: esteris redukuojamas, apsauga pašalinama.', 'Step 2: the ester is reduced and the protection removed.'),
            src: 'L13 p19'
          },
          { h: t('Ciklinis hemiacetalis', 'Cyclic hemiacetals') },
          {
            p: t('Jei hidroksi- ir karbonilgrupė yra vienoje molekulėje ir tarp jų tinka atstumas, vyksta intramolekulinė ciklizacija. Susidaro penkių ar šešių narių ciklas, ir toks hemiacetalis patvarus. Taip ciklizuojasi ir gliukozė. ',
              'If a hydroxy group and a carbonyl group are in one molecule at a suitable distance, intramolecular cyclisation occurs. A five- or six-membered ring forms, and such a hemiacetal is stable. Glucose cyclises in this way.'),
            src: 'L13 p20, p21'
          },
          { scheme: { items: [{ smi: 'OCCCCC=O', name: t('5-hidroksipentanalis', '5-hydroxypentanal') }, { arrow: '⇌', above: f('H+') }, { smi: 'OC1CCCCO1' }] }, caption: t('5-hidroksipentanalis: beveik vien ciklinė forma.', '5-hydroxypentanal: almost entirely the cyclic form.'), src: 'L13 p20' },
          { h: t('Tioacetaliai', 'Thioacetals') },
          {
            p: t('Tioliai reaguoja panašiai kaip alkoholiai: aldehidas ar ketonas su dviem tiolio ekvivalentais rūgščioje terpėje sudaro tioacetalį, o su ditioliu – ciklinį tioacetalį.',
              'Thiols react like alcohols: an aldehyde or ketone with two equivalents of a thiol in acid gives a thioacetal, and with a dithiol a cyclic thioacetal.'),
            src: 'S6.9'
          },
          {
            scheme: { items: [{ smi: 'O=C1CCCCC1', name: t('cikloheksanonas', 'cyclohexanone') }, { plus: true }, { smi: 'SCCCS' }, { arrow: '→', above: f('H+'), below: f('−H2O') }, { smi: 'C1CCC2(CC1)SCCCS2' }] },
            caption: t('Cikloheksanonas ir propano-1,3-ditiolis: ciklinis tioacetalis.', 'Cyclohexanone and propane-1,3-dithiol: a cyclic thioacetal.'),
            src: 'S6.9'
          },
          {
            pitfall: t('Acetalis ir hemiacetalis skiriasi: hemiacetalyje prie anglies yra $OH$ ir $OR$, acetalyje – dvi $OR$. Acetaliui reikia rūgšties ir perteklinio alkoholio (arba vieno diolio ekvivalento); šarmas jo nesudaro.',
              'A hemiacetal and an acetal differ: the hemiacetal carbon carries $OH$ and $OR$, the acetal carbon two $OR$. An acetal needs acid and excess alcohol (or one equivalent of a diol); a base does not form it.')
          },
          {
            example: {
              q: [
                { p: t('Kaip apsaugoti ciklopentanono karbonilgrupę 1,2-etandioliu?', 'How do you protect the carbonyl group of cyclopentanone with ethane-1,2-diol?') },
                { scheme: { items: [{ smi: 'O=C1CCCC1', name: t('ciklopentanonas', 'cyclopentanone') }, { plus: true }, { smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }, { arrow: '→' }] } }
              ],
              steps: [
                [{ p: t('Kuri vieta reaguoja? Diolio $OH$ grupės atakuoja karbonilo anglį, nes ji $δ+$.', 'Which site reacts? The $OH$ groups of the diol attack the carbonyl carbon because it is $δ+$.') }],
                [{ p: t('Reikia rūgšties katalizatoriaus. Abi $OH$ jungiasi prie tos pačios anglies, atsiskiria vanduo.', 'An acid catalyst is needed. Both $OH$ groups bond to the same carbon and water is lost.') }],
                [{ p: t('Gaunamas ciklinis acetalis (ketalis), penkių narių dioksolano žiedas.', 'A cyclic acetal (ketal) results, a five-membered dioxolane ring.') }, { mol: { smi: 'C1CCC2(C1)OCCO2' } }]
              ]
            },
            claims: [
              { react: ['co.acetal', ['O=C1CCCC1', 'OCCO'], null, 'C1CCC2(C1)OCCO2'] },
              { formula: ['C1CCC2(C1)OCCO2', 'C7H12O2'] }
            ]
          },
          { practice: 'u13.acetal' },
          { practice: 'u13.protect' },
          { practice: 'u13.thio' },
          { practice: 'u13.ring' }
        ]
      },

      /* ============ 5. HCN and N nucleophiles ============ */
      {
        id: 'nitrogen',
        title: t('HCN ir azoto nukleofilai', 'HCN and nitrogen nucleophiles'),
        blocks: [
          { h: t('Vandenilio cianidas', 'Hydrogen cyanide') },
          {
            p: t('Vandenilio cianidas jungiasi prie karbonilo ir sudaro hidroksinitrilą (cianhidriną). Nitrilo grupę vėliau galima hidrolizuoti į karboksigrupę (gaunama hidroksirūgštis) arba redukuoti į aminogrupę.',
              'Hydrogen cyanide adds to the carbonyl group and forms a hydroxynitrile (cyanohydrin). The nitrile group can later be hydrolysed to a carboxyl group (giving a hydroxy acid) or reduced to an amino group.'),
            src: 'L13 p23'
          },
          {
            scheme: { items: [{ smi: 'CC=O', name: t('etanalis', 'ethanal') }, { plus: true }, { smi: 'C#N' }, { arrow: '⇌' }, { smi: 'CC(O)C#N', name: t('2-hidroksipropannitrilas', '2-hydroxypropanenitrile') }, { arrow: '→', above: f('H2O, H+') }, { smi: 'CC(O)C(=O)O' }] },
            caption: t('Etanalis ir $HCN$, po to hidrolizė.', 'Ethanal and $HCN$, then hydrolysis.'),
            src: 'L13 p23'
          },
          { h: t('Azoto nukleofilai: AN ir eliminavimas', 'Nitrogen nucleophiles: AN and elimination') },
          {
            p: t('Azoto nukleofilai su $NH2$ grupe iš pradžių prisijungia kaip ir kiti nukleofilai: susidaro karbinolaminas. Jis netenka vandens, ir tarp anglies ir azoto lieka dvigubasis ryšys. Amoniakas ir pirminiai aminai duoda iminus (Šifo bazes), hidroksilaminas – oksimus, hidrazinas ir jo dariniai – hidrazonus.',
              'Nitrogen nucleophiles with an $NH2$ group first add like any other nucleophile and give a carbinolamine. It then loses water, leaving a double bond between carbon and nitrogen. Ammonia and primary amines give imines (Schiff bases), hydroxylamine gives oximes, hydrazine and its derivatives give hydrazones.'),
            src: 'L13 p25, p26'
          },
          { scheme: { items: [{ smi: 'CC(=O)C', name: t('propanonas', 'propanone') }, { plus: true }, { smi: 'CN', name: t('metanaminas', 'methylamine') }, { arrow: '→', below: f('−H2O') }, { smi: 'CC(C)=NC' }] }, caption: t('Iminas.', 'An imine.'), src: 'L13 p26' },
          { scheme: { items: [{ smi: 'CCC(C)=O', name: t('butanonas', 'butanone') }, { plus: true }, { smi: 'NO' }, { arrow: '→', below: f('−H2O') }, { smi: 'CCC(C)=NO' }] }, caption: t('Butanonas ir hidroksilaminas: oksimas.', 'Butanone and hydroxylamine: an oxime.'), src: 'L13 p29' },
          { scheme: { items: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { plus: true }, { smi: 'NNc1ccccc1' }, { arrow: '→', below: f('−H2O') }, { smi: 'CCC=NNc1ccccc1' }] }, caption: t('Propanalis ir fenilhidrazinas: fenilhidrazonas.', 'Propanal and phenylhydrazine: a phenylhydrazone.'), src: 'L13 p30' },
          { mech: MECH.imine, caption: t('Imino susidarymo mechanizmas.', 'Mechanism of imine formation.'), src: 'L13 p27' },
          {
            p: t('Laboratorijoje benzenkarbaldehidas su anilinu be tirpiklio sudaro kietą gelsvą Šifo bazę, kuri kristalinama iš etanolio.',
              'In the laboratory benzaldehyde and aniline react without solvent to a solid yellowish Schiff base, which is recrystallised from ethanol.'),
            src: 'LW6 p10'
          },
          { p: t('Gyvuose organizmuose iminai yra tarpiniai junginiai: aminorūgštys su piridoksalfosfatu sudaro iminą, o piruvatas su amoniaku ir redukcija virsta alaninu.', 'In living organisms imines are intermediates: amino acids form an imine with pyridoxal phosphate, and pyruvate with ammonia and a reduction becomes alanine.'), src: 'L13 p28, p32' },
          {
            rule: t('Azoto nukleofilas atakuoja $δ+$ karbonilo anglį, o vėliau atskyla vanduo ir lieka $C=N$: iminas ($R−NH2$), oksimas ($NH2OH$), hidrazonas (hidrazinas ir jo dariniai).', 'A nitrogen nucleophile attacks the $δ+$ carbonyl carbon, then water leaves and $C=N$ remains: an imine ($R−NH2$), an oxime ($NH2OH$), a hydrazone (hydrazine and its derivatives).'), src: 'L13 p25, p31' },
          {
            pitfall: t('Atskyla vanduo, todėl gaunamas $C=N$, o ne $C−N$. Nepamirškite eliminavimo stadijos: karbinolaminas yra tik tarpinis junginys.',
              'Water leaves, so the product has $C=N$, not $C−N$. Do not forget the elimination stage: the carbinolamine is only an intermediate.')
          },
          {
            example: {
              q: [
                { p: t('Iš kokio ketono ir kokio reagento galima gauti šį oksimą?', 'From which ketone and which reagent can this oxime be made?') },
                { mol: { smi: 'CC1CCC(=NO)CC1' } }
              ],
              steps: [
                [{ p: t('$C=N−OH$ grupė rodo hidroksilaminą $NH2OH$: jo azotas buvo nukleofilas.', 'The $C=N−OH$ group points to hydroxylamine $NH2OH$: its nitrogen was the nucleophile.') }],
                [{ p: t('Grupę $C=N$ pakeiskite grupe $C=O$: tai buvo karbonilo anglis. Žiedas ir metilas nesikeičia.', 'Replace $C=N$ by $C=O$: that was the carbonyl carbon. The ring and the methyl group stay as they are.') }],
                [{ p: t('Pradinis junginys: 4-metilcikloheksanonas, reagentas $NH2OH$.', 'The starting compound is 4-methylcyclohexanone, the reagent $NH2OH$.') }, { scheme: { items: [{ smi: 'CC1CCC(=O)CC1', name: t('4-metilcikloheksanonas', '4-methylcyclohexanone') }, { plus: true }, { smi: 'NO' }, { arrow: '→', below: f('−H2O') }, { smi: 'CC1CCC(=NO)CC1' }] } }]
              ]
            },
            claims: [{ react: ['co.oxime', ['CC1CCC(=O)CC1'], null, 'CC1CCC(=NO)CC1'] }]
          },
          { practice: 'u13.nu' }
        ]
      },

      /* ============ 6. redox: Cannizzaro, Tollens, Fehling ============ */
      {
        id: 'redox',
        title: t('Oksidacija ir redukcija: Kanicaro reakcija, Tolenso ir Felingo testai', 'Oxidation and reduction: Cannizzaro, Tollens and Fehling'),
        blocks: [
          { h: t('Kanicaro reakcija (dismutacija)', 'The Cannizzaro reaction (disproportionation)') },
          {
            p: t('Aldehidas be $α$ vandenilių koncentruotame šarme dismutuoja: viena molekulė oksiduojasi į rūgštį (šarmuose – druską), kita redukuojasi į alkoholį. Ketonai taip nereaguoja: jų karbonilo anglis neturi vandenilio, kurį galėtų atiduoti kaip hidridą.',
              'An aldehyde without $α$ hydrogens disproportionates in concentrated alkali: one molecule is oxidised to the acid (the salt in alkali), another is reduced to the alcohol. Ketones do not react this way: their carbonyl carbon has no hydrogen to hand over as a hydride.'),
            src: 'L13 p33'
          },
          { scheme: { items: [{ smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') }, { arrow: '→', above: t('1) konc. NaOH', '1) conc. NaOH'), below: f('2) H3O+') }, { smi: 'OCc1ccccc1' }, { plus: true }, { smi: 'OC(=O)c1ccccc1' }] }, caption: t('2 ekvivalentai benzenkarbaldehido: alkoholis ir rūgštis.', '2 equivalents of benzaldehyde: an alcohol and an acid.'), src: 'L13 p33, p34' },
          { mech: MECH.cann, caption: t('Mechanizmas (metanalis): hidridas pereina nuo vienos molekulės prie kitos.', 'Mechanism (methanal): a hydride moves from one molecule to the other.'), src: 'L13 p34' },
          {
            p: t('Dviejų aldehidogrupių junginiai gali dismutuoti viduje vienos molekulės. Metanalis mišrioje reakcijoje yra geresnis hidrido donoras, todėl oksiduojasi pats, o kitas aldehidas redukuojasi.',
              'A compound with two aldehyde groups can disproportionate within one molecule. In a crossed reaction methanal is the better hydride donor, so it is oxidised and the other aldehyde is reduced.')
          },
          {
            scheme: { items: [{ smi: 'O=CC=O', name: t('etandialis', 'ethanedial') }, { arrow: '→', above: t('1) konc. NaOH', '1) conc. NaOH'), below: f('2) H3O+') }, { smi: 'OCC(=O)O', name: t('hidroksietano rūgštis', 'hydroxyethanoic acid') }] },
            caption: t('Intramolekulinė Kanicaro reakcija: glioksalis virsta glikolio rūgštimi. Dar vienas pavyzdys – benzeno-1,2-dikarbaldehidas, kuris duoda hidroksimetilbenzenkarboksirūgštį; rūgštyje ji lengvai ciklizuojasi į laktoną.', 'Intramolecular Cannizzaro reaction: glyoxal becomes glycolic acid. Another example is benzene-1,2-dicarbaldehyde, which gives a hydroxymethylbenzoic acid; in acid it readily cyclises to a lactone.'),
            src: 'S6.11'
          },
          { h: t('Aldehidų atpažinimas', 'Recognising aldehydes') },
          {
            p: t('Aldehidai yra reduktoriai, o ketonai su silpnais oksidatoriais šarminėje terpėje nereaguoja. Tai naudojama aldehidams atpažinti.',
              'Aldehydes are reducing agents, whereas ketones do not react with weak oxidants in alkaline medium. This is used to recognise aldehydes.'),
            src: 'L13 p36, p38'
          },
          {
            scheme: { items: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { plus: true }, { smi: '[Ag+]' }, { arrow: '→', above: f('NH3'), below: f('H2O') }, { smi: 'CCC(=O)[O-].[NH4+]' }, { plus: true }, { smi: '[Ag]' }] },
            caption: t('Tolenso testas: sidabro veidrodis ant mėgintuvėlio sienelių.', 'Tollens test: a silver mirror on the walls of the tube.'),
            src: 'L13 p36'
          },
          {
            scheme: { items: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { arrow: '→', above: f('2 Cu2+, NaOH'), below: f('H2O') }, { smi: 'CCC(=O)[O-].[Na+]' }] },
            caption: t('Felingo testas: $Cu2+$ redukuojamas iki $Cu2O$ (raudonos nuosėdos).', 'Fehling test: $Cu2+$ is reduced to $Cu2O$ (a red precipitate).'),
            src: 'L13 p38'
          },
          { p: t('Aldehidus oksiduoja ir stiprūs oksidatoriai ($KMnO4$, $HNO3$), net oro deguonis. Tolenso ir Felingo reakcijų mechanizmuose metalo jonas aldehidui atima elektronus, ir šarminėje terpėje susidaro karboksilatas.', 'Aldehydes are also oxidised by strong oxidants ($KMnO4$, $HNO3$) and even by air oxygen. In the Tollens and Fehling mechanisms the metal ion takes electrons from the aldehyde and in alkali the carboxylate forms.'), src: 'T p84, L13 p37, p39' },
          {
            rule: t('Kanicaro reakcija: aldehidas be $α$-H + koncentruotas šarmas → alkoholis + rūgšties druska. Tolenso ir Felingo testai: aldehidas → karboksilatas, pasikeičia reagentas (sidabro veidrodis, raudonas $Cu2O$).', 'Cannizzaro reaction: an aldehyde without $α$-H + concentrated alkali → alcohol + salt of the acid. Tollens and Fehling tests: aldehyde → carboxylate while the reagent changes (silver mirror, red $Cu2O$).'), src: 'L13 p33, p36, p38' },
          {
            table: {
              head: [t('Testas', 'Test'), t('Reagentas', 'Reagent'), t('Aldehidas', 'Aldehyde'), t('Ketonas', 'Ketone')],
              rows: [
                [t('Tolenso', 'Tollens'), t('$Ag+$, $NH3$', '$Ag+$, $NH3$'), t('sidabro veidrodis', 'silver mirror'), t('nėra pokyčio', 'no change')],
                [t('Felingo', 'Fehling'), t('$Cu2+$, $NaOH$', '$Cu2+$, $NaOH$'), t('raudonos $Cu2O$ nuosėdos; metanalis – vario veidrodis', 'red $Cu2O$ precipitate; methanal gives a copper mirror'), t('nėra pokyčio', 'no change')],
                [t('Jodoformo', 'Iodoform'), t('$I2$, $NaOH$', '$I2$, $NaOH$'), t('tik etanalis', 'ethanal only'), t('metilketonas: geltonos $CHI3$ nuosėdos', 'a methyl ketone: yellow $CHI3$ precipitate')]
              ]
            },
            src: 'L13 p36, p38, p49; LW6 p3'
          },
          {
            pitfall: t('Kanicaro reakcijai reikia aldehido be $α$-H ir koncentruoto šarmo. Aldehidas su $α$-H praskiestame šarme dalyvauja aldolinėje reakcijoje. Tolenso ir Felingo reakcijos vyksta šarminėje terpėje, todėl gaunama karboksilato druska, ne rūgštis.',
              'The Cannizzaro reaction needs an aldehyde without $α$-H and concentrated alkali. An aldehyde with $α$-H does the aldol reaction in dilute alkali. The Tollens and Fehling reactions run in alkaline medium, so the product is the carboxylate salt, not the acid.')
          },
          {
            example: {
              q: [
                { p: t('Kokie produktai susidaro, kai glioksalis reaguoja su koncentruotu $NaOH$, o po to parūgštinama?', 'What forms when glyoxal reacts with concentrated $NaOH$ and the mixture is then acidified?') },
                { mol: { smi: 'O=CC=O', name: t('etandialis', 'ethanedial') } }
              ],
              steps: [
                [{ p: t('Aldehidogrupės neturi $α$-H, todėl galima Kanicaro reakcija.', 'The aldehyde groups have no $α$-H, so the Cannizzaro reaction is possible.') }],
                [{ p: t('Dvi aldehidogrupės yra toje pačioje molekulėje: viena redukuojama, kita oksiduojama, tad gaunama tik viena molekulė.', 'The two aldehyde groups are in the same molecule: one is reduced and the other oxidised, so only one compound forms.') }],
                [{ p: t('Po parūgštinimo: hidroksirūgštis.', 'After acidification: the hydroxy acid.') }, { mol: { smi: 'OCC(=O)O', name: t('hidroksietano rūgštis', 'hydroxyethanoic acid') } }]
              ]
            },
            claims: [{ react: ['co.cannizzaro', ['O=CC=O'], { workup: true }, 'OCC(=O)O'] }, { name: ['OCC(=O)O', t('hidroksietano rūgštis', 'hydroxyethanoic acid')] }]
          },
          { practice: 'u13.cann' },
          { practice: 'u13.id' },
          { practice: 'u13.test' }
        ]
      },

      /* ============ 7. alpha reactions ============ */
      {
        id: 'alpha',
        title: t('Reakcijos prie $α$ anglies', 'Reactions at the $α$ carbon'),
        blocks: [
          { h: t('Judrus $α$ vandenilis ir enolizacija', 'The mobile $α$ hydrogen and enolisation') },
          {
            p: t('Karbonilgrupė traukia elektronus ($−I$), todėl $α$ padėties $C−H$ ryšys poliarizuotas ir protonas atsiskiria palyginti lengvai (CH rūgštis). Bazė atplėšia protoną ir susidaro enoliato jonas, kurio neigiamas krūvis pasiskirsto tarp anglies ir deguonies.',
              'The carbonyl group withdraws electrons ($−I$), so the $α$ $C−H$ bond is polarised and the proton leaves fairly easily (a CH acid). A base removes it and an enolate ion forms, whose negative charge is shared between carbon and oxygen.'),
            src: 'L13 p40, p41'
          },
          { mol: { smi: 'CCCC=O', opts: { numbers: { 0: 'γ', 1: 'β', 2: 'α' } } }, caption: t('$α$, $β$, $γ$ – anglys, skaičiuojamos nuo karbonilo.', '$α$, $β$, $γ$ label the carbons counted from the carbonyl group.'), src: 'L13 p40' },
          { resonance: [{ smi: '[CH2-]C(C)=O' }, { smi: 'C=C(C)[O-]' }], caption: t('Enoliato jono rezonansinės formulės.', 'Resonance structures of the enolate ion.'), src: 'L13 p41' },
          {
            p: t('Jei enoliatas paima protoną ant deguonies, susidaro enolis (nesotusis alkoholis). Ketoninė forma ir enolinė forma yra tautomerai, o reiškinys vadinamas ketoenoline tautomerija. Paprastai ketoforma smarkiai vyrauja.',
              'If the enolate picks up a proton on oxygen, an enol (an unsaturated alcohol) forms. The keto and enol forms are tautomers and the phenomenon is keto–enol tautomerism. Usually the keto form strongly dominates.'),
            src: 'L13 p41'
          },
          {
            scheme: { items: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { arrow: '⇌', above: f('−H+'), below: f('+H+') }, { smi: 'CC(=C)[O-]' }, { arrow: '⇌', above: f('+H+'), below: f('−H+') }, { smi: 'CC(=C)O' }] },
            caption: t('Propanonas: ketoninė forma (> 99,9 %), enoliato jonas, enolis (< 0,1 %).', 'Propanone: keto form (> 99.9 %), enolate ion, enol (< 0.1 %).'),
            src: 'L13 p41'
          },
          {
            rule: t('Enolis tampa reikšmingas, kai jo $C=C$ konjuguotas su kita $π$ sistema arba jo $OH$ sudaro vidinį vandenilinį ryšį. Kai enolis gali susidaryti į dvi puses, daugiau susidaro to, kurio dvigubasis ryšys konjuguotas (ketoninė forma vis tiek vyrauja).',
              'The enol becomes significant when its $C=C$ is conjugated with another $π$ system or its $OH$ forms an internal hydrogen bond. When the enol can form on either side, more of the one with the conjugated double bond forms (the keto form still dominates overall).'),
            src: 'L13 p42'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)CC(C)=O' }, { arrow: '⇌' }, { smi: 'CC(=O)C=C(C)O' }] },
            caption: t('Pentano-2,4-dionas: enolis 70–90 % (konjugacija ir vandenilinis ryšys).', 'Pentane-2,4-dione: 70–90 % enol (conjugation and a hydrogen bond).'),
            src: 'L13 p42'
          },
          {
            mol: [{ smi: 'CCC(=Cc1ccccc1)O', caption: t('konjuguotas: šio enolio daugiau', 'conjugated: more of this enol') }, { smi: 'CC=C(Cc1ccccc1)O', caption: t('nekonjuguotas', 'not conjugated') }],
            caption: t('1-Fenilbutan-2-onas gali sudaryti du enolius.', '1-Phenylbutan-2-one can form two enols.'),
            src: 'S6.13'
          },
          { h: t('Aldolinis prisijungimas ir kondensacija', 'Aldol addition and condensation') },
          {
            p: t('Praskiestame šarme aldehidas su $α$ vandeniliu jungiasi su kita to paties junginio molekule. Enoliatas yra nukleofilas, o kitos molekulės karbonilo anglis – elektrofilas. Susidaro aldolis (3-hidroksialdehidas), todėl reakcija vadinama aldoliniu prisijungimu. Ketonai su $α$-H reaguoja panašiai, bet pusiausvyra produktui mažiau palanki.',
              'In dilute alkali an aldehyde with an $α$ hydrogen adds to a second molecule of itself. The enolate is the nucleophile and the carbonyl carbon of the other molecule the electrophile. An aldol (a 3-hydroxy aldehyde) forms, hence the name aldol addition. Ketones with $α$-H react similarly, but the equilibrium is less favourable to the product.'),
            src: 'L13 p43, p45'
          },
          { scheme: { items: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { plus: true }, { smi: 'CCC=O', name: t('propanalis', 'propanal') }, { arrow: '→', above: f('HO-, H2O') }, { smi: 'CCC(O)C(C)C=O', name: t('3-hidroksi-2-metilpentanalis', '3-hydroxy-2-methylpentanal') }] }, caption: t('Propanalio aldolinis prisijungimas.', 'Aldol addition of propanal.'), src: 'L13 p43' },
          { mech: MECH.aldol, caption: t('Aldolinio prisijungimo mechanizmas.', 'Mechanism of aldol addition.'), src: 'L13 p43, p46' },
          {
            p: t('Pakaitinus iš aldolio atskyla vandens molekulė ir susidaro $C=C$, konjuguotas su $C=O$ ($α,β$-nesotusis aldehidas). Tai aldolinė kondensacija. Antroje stadijoje bazė atplėšia antrą $α$-protoną, ir iš enoliato išeina hidroksidas.',
              'On heating, the aldol loses a molecule of water and a $C=C$ conjugated with the $C=O$ forms (an $α,β$-unsaturated aldehyde). This is the aldol condensation. In the second stage the base removes a second $α$ proton and hydroxide leaves from the enolate.'),
            src: 'L13 p44, p46'
          },
          { scheme: { items: [{ smi: 'CCC(O)C(C)C=O', name: t('3-hidroksi-2-metilpentanalis', '3-hydroxy-2-methylpentanal') }, { arrow: '→', above: f('t°'), below: f('−H2O') }, { smi: 'CCC=C(C)C=O', name: t('2-metil-2-pentenalis', '2-methylpent-2-enal') }] }, caption: t('Aldolis virsta nesočiuoju aldehidu.', 'The aldol becomes the unsaturated aldehyde.'), src: 'L13 p44' },
          { mech: MECH.cond, caption: t('Vandens eliminavimas: atplėšiamas antras $α$-protonas.', 'Elimination of water: a second $α$ proton is removed.'), src: 'L13 p46' },
          { h: t('Mišrus aldolinis prisijungimas', 'Crossed aldol reaction') },
          {
            p: t('Dviejų skirtingų aldehidų, kurie abu turi $α$-H, mišinys duoda keturis produktus. Reakcija naudinga, kai vienas aldehidas $α$-H neturi: jis gali būti tik elektrofilas.',
              'A mixture of two different aldehydes that both have $α$-H gives four products. The reaction is useful when one aldehyde has no $α$-H: it can then only be the electrophile.'),
            src: 'L13 p47, S6.14'
          },
          {
            scheme: { items: [{ smi: 'COc1ccc(C=O)cc1', name: t('4-metoksibenzenkarbaldehidas', '4-methoxybenzaldehyde') }, { plus: true }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { arrow: '→', above: f('HO-'), below: f('−H2O') }, { smi: 'COc1ccc(C=CC(C)=O)cc1', name: t('4-(4-metoksifenil)-3-buten-2-onas', '4-(4-methoxyphenyl)but-3-en-2-one') }] },
            caption: t('Mišri aldolinė kondensacija: aromatinis aldehidas su propanonu.', 'Crossed aldol condensation: an aromatic aldehyde with propanone.'),
            src: 'S6.14'
          },
          { h: t('Haloforminė reakcija', 'The haloform reaction') },
          {
            p: t('Su halogenais šarminėje terpėje metilketono (acetilgrupės) trys $α$ vandeniliai pakeičiami halogenu, o $CX3−C$ ryšys skyla: gaunamas haloformas ir karboksilatas. Su jodu susidaro geltonos $CHI3$ nuosėdos. Taip reaguoja ir alkoholiai, kurie oksiduojami į acetilgrupės junginius. Skilimo metu hidroksidas prisijungia prie karbonilo, o iš tetraedrinio anijono išeina $CX3−$, kurį stabilizuoja trys halogenai.',
              'With halogens in alkali the three $α$ hydrogens of a methyl ketone (an acetyl group) are replaced by halogen and the $CX3−C$ bond breaks: a haloform and a carboxylate result. With iodine yellow $CHI3$ precipitates. Alcohols that are oxidised to acetyl compounds react too. In the cleavage hydroxide adds to the carbonyl group and $CX3−$, stabilised by three halogens, leaves the tetrahedral anion.'),
            src: 'L13 p49'
          },
          {
            scheme: { items: [{ smi: 'CCC(C)=O', name: t('butanonas', 'butanone') }, { arrow: '→', above: f('3 I2, NaOH') }, { smi: 'C(I)(I)I' }, { plus: true }, { smi: 'CCC(=O)[O-].[Na+]' }] },
            caption: t('Butanonas: jodoformas ir propanoatas.', 'Butanone: iodoform and propanoate.'),
            src: 'L13 p49'
          },
          {
            pitfall: t('Šios dvi reakcijos nesutampa: prisijungimas duoda aldolį ($OH$ lieka), kondensacija – nesotųjį junginį (netenkama vandens). Aldolinėje reakcijoje nukleofilas yra enoliatas, ne hidroksidas.',
              'Aldol addition and aldol condensation are not the same: the first gives the aldol (the $OH$ stays), the second an unsaturated compound (water is lost). In the aldol reaction the nucleophile is the enolate, not hydroxide.')
          },
          {
            example: {
              q: [
                { p: t('Kaip sintetinti 2-etil-1-heksanolį naudojant aldolinę kondensaciją, $NaBH4$ ir $H2$/$Pd$ šia tvarka?', 'How do you make 2-ethylhexan-1-ol using aldol condensation, $NaBH4$ and $H2$/$Pd$ in that order?') },
                { mol: { smi: 'CCCCC(CC)CO' } }
              ],
              steps: [
                [{ p: t('Tikslas turi 8 anglis, o aldolinė kondensacija sujungia dvi vienodas molekules, todėl reikia $C4$ aldehido – butanalio.', 'The target has 8 carbons and aldol condensation joins two identical molecules, so a $C4$ aldehyde is needed: butanal.') }],
                [{ p: t('Aldolinė kondensacija: dvi butanalio molekulės netenka vandens.', 'Aldol condensation: two butanal molecules lose water.') }, { scheme: { items: [{ smi: 'CCCC=O', name: t('butanalis', 'butanal') }, { plus: true }, { smi: 'CCCC=O', name: t('butanalis', 'butanal') }, { arrow: '→', above: f('HO-, t°'), below: f('−H2O') }, { smi: 'CCCC=C(CC)C=O', name: t('2-etil-2-heksenalis', '2-ethylhex-2-enal') }] } }],
                [{ p: t('$NaBH4$ redukuoja tik karbonilgrupę: gaunamas nesotusis alkoholis.', '$NaBH4$ reduces only the carbonyl group: an unsaturated alcohol results.') }, { scheme: { items: [{ smi: 'CCCC=C(CC)C=O' }, { arrow: '→', above: f('NaBH4') }, { smi: 'CCCC=C(CC)CO' }] } }],
                [{ p: t('$H2$ ant $Pd$ redukuoja $C=C$: gaunamas sotusis alkoholis.', '$H2$ over $Pd$ reduces the $C=C$: the saturated alcohol results.') }, { scheme: { items: [{ smi: 'CCCC=C(CC)CO' }, { arrow: '→', above: f('H2, Pd') }, { smi: 'CCCCC(CC)CO' }] } }]
              ]
            },
            claims: [
              { react: ['co.aldolcond', ['CCCC=O'], null, 'CCCC=C(CC)C=O'] },
              { react: ['co.nabh4', ['CCCC=C(CC)C=O'], null, 'CCCC=C(CC)CO'] },
              { react: ['ae.h2', ['CCCC=C(CC)CO'], null, 'CCCCC(CC)CO'] },
              { formula: ['CCCCC(CC)CO', 'C8H18O'] }
            ],
            src: 'L13 p50'
          },
          { practice: 'u13.enol' },
          { practice: 'u13.aldol' },
          { practice: 'u13.cross' },
          { practice: 'u13.mech' }
        ]
      },

      /* ============ 8. several groups in one molecule ============ */
      {
        id: 'multi',
        title: t('Molekulė su keliomis funkcinėmis grupėmis', 'A molecule with several functional groups'),
        blocks: [
          {
            p: t('Realiose molekulėse yra ne viena grupė, todėl reikia žinoti, su kuria reaguoja reagentas. 4-oksocikloheksankarbaldehidas turi ir aldehido, ir ketono grupę.', 'Real molecules have more than one group, so you must know which one a reagent attacks. 4-oxocyclohexanecarbaldehyde has both an aldehyde and a ketone group.')
          },
          {
            mol: { smi: 'O=CC1CCC(=O)CC1', name: t('4-oksocikloheksankarbaldehidas', '4-oxocyclohexanecarbaldehyde') },
            caption: t('Aldehidas reaktingesnis už ketoną, todėl su vienu ekvivalentu reaguoja pirmas.', 'The aldehyde is more reactive than the ketone, so it reacts first with one equivalent.'),
            src: 'L13 p6, S6.12'
          },
          {
            table: {
              head: [t('Reagentas', 'Reagent'), t('Kas reaguoja', 'What reacts'), t('Produktas', 'Product')],
              rows: [
                [t('1) $NaBH4$ (perteklius)  2) $H2O$', '1) $NaBH4$ (excess)  2) $H2O$'), t('abi karbonilo grupės', 'both carbonyl groups'), { smi: 'OCC1CCC(O)CC1' }],
                [t('$NH2OH$ (1 ekv.)', '$NH2OH$ (1 equiv.)'), t('aldehidas (AN, paskui $−H2O$)', 'the aldehyde (AN, then $−H2O$)'), { smi: 'ON=CC1CCC(=O)CC1' }],
                [t('$HOCH2CH2OH$ (1 ekv.), $H+$', '$HOCH2CH2OH$ (1 equiv.), $H+$'), t('aldehidas (apsauga)', 'the aldehyde (protection)'), { smi: 'O=C1CCC(CC1)C1OCCO1' }],
                [t('$Ag+$, $NH3$', '$Ag+$, $NH3$'), t('tik aldehidas oksiduojamas', 'only the aldehyde is oxidised'), { smi: 'O=C1CCC(CC1)C(=O)[O-].[NH4+]' }]
              ]
            },
            src: 'L13 p6, p36, S6.12'
          },
          {
            pitfall: t('Reagentas, kuris reaguoja su viena grupe, nebūtinai reaguoja su kita: $NaBH4$ redukuoja ir aldehidą, ir ketoną, o Tolenso reagentas oksiduoja tik aldehidą. Pasirinkite reagentą pagal tai, ką norite pakeisti.', 'A reagent that reacts with one group need not react with another: $NaBH4$ reduces both aldehyde and ketone, whereas Tollens\' reagent oxidises only the aldehyde. Choose the reagent for what you want to change.')
          },
          {
            example: {
              q: [
                { p: t('Kaip redukuoti tik ketono grupę 4-oksopentanalyje?', 'How can only the ketone group of 4-oxopentanal be reduced?') },
                { mol: { smi: 'O=CCCC(C)=O', name: t('4-oksopentanalis', '4-oxopentanal') } }
              ],
              steps: [
                [{ p: t('$NaBH4$ redukuotų abi grupes, todėl aldehidą reikia uždengti.', '$NaBH4$ would reduce both groups, so the aldehyde must be covered.') }],
                [{ p: t('Aldehidas reaktingesnis, todėl su 1 ekv. diolio apsaugomas jis.', 'The aldehyde is more reactive, so with 1 equiv. of the diol it is the one protected.') }, { mol: { smi: 'CC(=O)CCC1OCCO1' } }],
                [{ p: t('Tada $NaBH4$ redukuoja ketoną, o $H3O+$ pašalina apsaugą.', 'Then $NaBH4$ reduces the ketone and $H3O+$ removes the protection.') }, { mol: { smi: 'CC(O)CCC=O' } }]
              ]
            },
            claims: [
              { react: ['co.acetal', ['CC(=O)CCC=O', 'OCCO'], null, 'CC(=O)CCC1OCCO1'] },
              { react: ['co.nabh4', ['CC(=O)CCC1OCCO1'], null, 'CC(O)CCC1OCCO1'] }
            ]
          },
          {
            rule: t('Prieš veikdami reagentu, nustatykite kiekvienos grupės reaktingumą: hidridai atakuoja $C=O$, $H2$/$Pd$ – $C=C$, aminai ir alkoholiai – $C=O$. Jei viena grupė trukdo, ją apsaugokite (aldehidą ar ketoną – acetaliu).',
              'Before you add a reagent, decide how each group reacts: hydrides attack $C=O$, $H2$/$Pd$ attacks $C=C$, amines and alcohols attack $C=O$. If one group is in the way, protect it (an aldehyde or ketone as an acetal).'),
            src: 'L13 p19, S6.12'
          },
          { practice: 'u13.multi' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        table: {
          head: [t('Reagentas', 'Reagent'), t('Produktas', 'Product'), t('Pastaba', 'Note')],
          rows: [
            [t('$NaBH4$; $LiAlH4$ + $H2O$', '$NaBH4$; $LiAlH4$ + $H2O$'), t('alkoholis (aldehidas → pirminis, ketonas → antrinis)', 'alcohol (aldehyde → primary, ketone → secondary)'), t('$H−$ nukleofilas; AN', '$H−$ is the nucleophile; AN')],
            [t('$H2O$, $H+$', '$H2O$, $H+$'), t('hidratas ($C(OH)2$)', 'hydrate ($C(OH)2$)'), t('išskiriamas tik su akceptorine grupe ($Cl3C−CHO$); metanalis vandenyje irgi daugiausia hidratas', 'isolable only with an acceptor group ($Cl3C−CHO$); methanal in water is also mostly hydrate')],
            [t('$ROH$, $H+$', '$ROH$, $H+$'), t('hemiacetalis, po to acetalis', 'hemiacetal, then acetal'), t('diolis: ciklinis acetalis, karbonilo apsauga; hidrolizė $H3O+$', 'a diol gives a cyclic acetal, protects the carbonyl; hydrolysis with $H3O+$')],
            [t('2 $RSH$, $H+$', '2 $RSH$, $H+$'), t('tioacetalis', 'thioacetal'), t('ditiolis: ciklinis', 'a dithiol gives a cyclic one')],
            [t('$HCN$', '$HCN$'), t('hidroksinitrilas (cianhidrinas)', 'hydroxynitrile (cyanohydrin)'), t('→ hidroksirūgštis', '→ hydroxy acid')],
            [t('$RNH2$; $NH2OH$; $PhNHNH2$', '$RNH2$; $NH2OH$; $PhNHNH2$'), t('iminas; oksimas; fenilhidrazonas', 'imine; oxime; phenylhydrazone'), t('AN, paskui $−H2O$; $C=N$', 'AN, then $−H2O$; $C=N$')],
            [t('konc. $NaOH$', 'conc. $NaOH$'), t('rūgšties druska + alkoholis', 'acid salt + alcohol'), t('Kanicaro: aldehidas be $α$-H', 'Cannizzaro: aldehyde without $α$-H')],
            [t('$Ag+$/$NH3$; $Cu2+$/$NaOH$', '$Ag+$/$NH3$; $Cu2+$/$NaOH$'), t('karboksilatas + $Ag$ arba $Cu2O$', 'carboxylate + $Ag$ or $Cu2O$'), t('tik aldehidai (Tolenso, Felingo)', 'aldehydes only (Tollens, Fehling)')],
            [t('$HO−$ (praskiestas)', '$HO−$ (dilute)'), t('aldolis; kaitinant – nesotusis aldehidas', 'aldol; on heating the unsaturated aldehyde'), t('reikia $α$-H; nukleofilas – enoliatas', 'needs $α$-H; the nucleophile is the enolate')],
            [t('$X2$, $NaOH$', '$X2$, $NaOH$'), t('haloformas + karboksilatas', 'haloform + carboxylate'), t('metilketonai; $I2$ → geltonas $CHI3$', 'methyl ketones; $I2$ gives yellow $CHI3$')]
          ]
        }
      },
      {
        list: [
          t('Reaktingumas: $Cl3C−CHO > H−CHO > R−CHO > R−CO−R$; ketonai lėtesni dėl $+I$ ir trukdžių.', 'Reactivity: $Cl3C−CHO > H−CHO > R−CHO > R−CO−R$; ketones are slower because of $+I$ and hindrance.'),
          t('Bazėje – nukleofilas atakuoja karbonilą; rūgštyje – pirma protonizuojamas $O$.', 'In base the nucleophile attacks the carbonyl; in acid the $O$ is protonated first.'),
          t('$N$ nukleofilai: AN ir eliminavimas, gaunamas $C=N$.', 'N nucleophiles: AN and elimination give $C=N$.'),
          t('Enolio dalį didina konjugacija ir vandenilinis ryšys; vyrauti enolis gali tik kai veikia abu (1,3-dikarbonilo junginiai, pvz., 2,4-pentandionas: 70–90 %). Paprastai ketoninė forma sudaro > 99,9 %.', 'Conjugation and a hydrogen bond raise the enol share; the enol can dominate only when both act (1,3-dicarbonyl compounds, e.g. pentane-2,4-dione: 70–90 %). Usually the keto form is > 99.9 %.'),
          t('Mišriam aldoliniam prisijungimui vienas aldehidas turi neturėti $α$-H.', 'For a crossed aldol reaction one aldehyde should have no $α$-H.')
        ]
      }
    ],
    types: [
      /* ================= 1. reactivity order (S6.1), bank ================= */
      {
        id: 'u13.order',
        title: t('Aktyvumas nukleofilinio prijungimo reakcijose', 'Reactivity in nucleophilic addition'),
        mirrors: ['S6.1'],
        bank: [
          {
            id: 'u13.order.1',
            q: [
              { p: t('Surikiuokite šiuos karbonilo junginius pagal aktyvumą nukleofilinio prijungimo reakcijose.', 'Rank these carbonyl compounds by their reactivity in nucleophilic addition.') },
              { mol: [{ smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } }, { smi: 'CCCCC=O', name: t('pentanalis', 'pentanal') }, { smi: 'CCC(C)=O', name: t('butanonas', 'butanone') }, { smi: 'CC(C)C(=O)C(C)C', name: t('2,4-dimetil-3-pentanonas', '2,4-dimethylpentan-3-one') }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite nuo reaktingiausio iki mažiausiai reaktingo.', 'Put them in order from the most to the least reactive.'),
                kind: 'order',
                options: [{ mol: { smi: 'C=O', opts: { allH: true } } }, { mol: { smi: 'CCCCC=O' } }, { mol: { smi: 'CCC(C)=O' } }, { mol: { smi: 'CC(C)C(=O)C(C)C' } }],
                hint: t('Aldehidas ar ketonas? Kiek ir kokių pakaitų yra prie karbonilo anglies?', 'Aldehyde or ketone? How many substituents, and how large, are on the carbonyl carbon?'),
                solution: t('Metanalis neturi alkilgrupių, todėl yra reaktingiausias. Pentanalis turi vieną alkilą, butanonas – du, o 2,4-dimetil-3-pentanonas – du šakotus izopropilus, kurie stipriausiai trukdo.', 'Methanal has no alkyl groups and is the most reactive. Pentanal has one alkyl group, butanone two, and 2,4-dimethylpentan-3-one two branched isopropyl groups that hinder most.')
              },
              {
                prompt: t('Kodėl pentanalis reaktingesnis už butanoną?', 'Why is pentanal more reactive than butanone?'),
                kind: 'choice',
                options: [
                  { text: t('Aldehido karbonilo anglis turi tik vieną alkilą: mažesnis $+I$ efektas ir mažesni erdviniai trukdžiai.', 'The aldehyde carbonyl carbon has only one alkyl group: a smaller $+I$ effect and less steric hindrance.') },
                  { text: t('Alkilgrupės traukia elektronus ($−I$), todėl ketone $δ+$ ant anglies yra mažesnis.', 'Alkyl groups withdraw electrons ($−I$), so the ketone has a smaller $δ+$ on carbon.') },
                  { text: t('Aldehidas turi daugiau vandenilių, todėl jis rūgštesnis ir geriau reaguoja su nukleofilais.', 'The aldehyde has more hydrogens, so it is more acidic and reacts better with nucleophiles.') },
                  { text: t('Ketono $C=O$ ryšys yra trumpesnis ir negali būti poliarizuotas.', 'The $C=O$ bond of a ketone is shorter and cannot be polarised.') }
                ],
                answer: 0,
                hint: t('Palyginkite, kiek alkilgrupių prie karbonilo anglies ir ką jos daro elektronams.', 'Compare how many alkyl groups are on the carbonyl carbon and what they do to electrons.'),
                solution: t('Alkilas stumia elektronus ($+I$), todėl mažina $δ+$, ir yra didesnis už $H$. Ketonas turi du alkilus, aldehidas – vieną.', 'An alkyl group pushes electrons ($+I$), which lowers $δ+$, and is larger than $H$. A ketone has two alkyl groups, an aldehyde one.')
              }
            ],
            why: t('Du veiksniai veikia kartu: elektroninis (karbonilo anglies $δ+$) ir erdvinis (prieinamumas nukleofilui). Kiekvienas alkilas $δ+$ mažina ir trukdo, todėl eilė yra metanalis > aldehidas > ketonas > šakotas ketonas.', 'Two factors act together: electronic (the $δ+$ of the carbonyl carbon) and steric (access for the nucleophile). Each alkyl group lowers $δ+$ and hinders, so the order is methanal > aldehyde > ketone > branched ketone.'),
            src: 'L13 p5, p6, S6.1'
          },
          {
            id: 'u13.order.2',
            q: [
              { p: t('Palyginkite chlorintus acetaldehido darinius.', 'Compare these chlorinated derivatives of acetaldehyde.') },
              { mol: [{ smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', 'trichloroethanal') }, { smi: 'ClC(Cl)C=O' }, { smi: 'ClCC=O', name: t('chloretanalis', '2-chloroethanal') }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite pagal aktyvumą su nukleofilais, pradėdami nuo reaktingiausio.', 'Order them by reactivity towards nucleophiles, starting with the most reactive.'),
                kind: 'order',
                options: [{ mol: { smi: 'ClC(Cl)(Cl)C=O' } }, { mol: { smi: 'ClC(Cl)C=O' } }, { mol: { smi: 'ClCC=O' } }, { mol: { smi: 'CC=O' } }],
                hint: t('Pažiūrėkite, kas vyksta su karbonilo anglies krūviu, kai šalia atsiranda daugiau halogenų.', 'Look at what happens to the charge of the carbonyl carbon as more halogens appear next to it.'),
                solution: t('Kiekvienas chloro atomas traukia elektronus ($−I$) ir didina $δ+$: trichloretanalis > dichloretanalis > chloretanalis > etanalis.', 'Each chlorine atom withdraws electrons ($−I$) and raises $δ+$: trichloroethanal > dichloroethanal > chloroethanal > ethanal.')
              },
              {
                prompt: t('Kuris efektas lemia šią eilę?', 'Which effect decides this order?'),
                kind: 'choice',
                options: [
                  { text: t('Chloras traukia elektronus per $σ$ ryšius ($−I$) ir didina karbonilo anglies $δ+$.', 'Chlorine withdraws electrons through $σ$ bonds ($−I$) and raises the $δ+$ of the carbonyl carbon.') },
                  { text: t('Chloras stumia elektronus ($+I$) ir mažina karbonilo anglies krūvį.', 'Chlorine pushes electrons ($+I$) and lowers the charge on the carbonyl carbon.') },
                  { text: t('Chloro atomai erdviškai užstoja karbonilo anglį.', 'The chlorine atoms shield the carbonyl carbon sterically.') },
                  { text: t('Chloras daro deguonį bazingesnį, todėl jis lengviau protonizuojamas.', 'Chlorine makes oxygen more basic, so it is protonated more easily.') }
                ],
                answer: 0,
                hint: t('Chloras elektroneigiamesnis už anglį. Ką tai daro per $σ$ ryšius?', 'Chlorine is more electronegative than carbon. What does that do through $σ$ bonds?'),
                solution: t('Tai indukcijos efektas $−I$: kuo daugiau chloro, tuo labiau nuskurdinta karbonilo anglis ir tuo lengviau ją atakuoja nukleofilas.', 'This is the inductive effect $−I$: the more chlorine, the more electron-poor the carbonyl carbon and the easier the attack of a nucleophile.')
              }
            ],
            why: t('Elektronų akceptorinė grupė $α$ padėtyje didina karbonilo anglies $δ+$ ir aktyvumą. Todėl chloralis yra reaktingesnis net už metanalį.', 'An electron-withdrawing group in the $α$ position raises the $δ+$ and the reactivity of the carbonyl carbon. That is why chloral is more reactive even than methanal.'),
            src: 'L13 p6',
            claims: [{ formula: ['ClC(Cl)(Cl)C=O', 'C2HCl3O'] }]
          },
          {
            id: 'u13.order.3',
            q: [
              { p: t('Palyginkite keturis ketonus, kurių karbonilas apsuptas vis didesnių grupių.', 'Compare four ketones whose carbonyl is surrounded by ever larger groups.') },
              { mol: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'CCC(=O)CC', name: t('3-pentanonas', 'pentan-3-one') }, { smi: 'CC(C)C(=O)C(C)C', name: t('2,4-dimetil-3-pentanonas', '2,4-dimethylpentan-3-one') }, { smi: 'CC(C)(C)C(=O)C(C)(C)C' }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite nuo reaktingiausio iki mažiausiai reaktingo.', 'Order them from the most to the least reactive.'),
                kind: 'order',
                options: [{ mol: { smi: 'CC(C)=O' } }, { mol: { smi: 'CCC(=O)CC' } }, { mol: { smi: 'CC(C)C(=O)C(C)C' } }, { mol: { smi: 'CC(C)(C)C(=O)C(C)(C)C' } }],
                hint: t('Visi keturi yra ketonai: nagrinėkite, kaip sunku nukleofilui prisiartinti prie karbonilo anglies.', 'All four are ketones: consider how hard it is for a nucleophile to get close to the carbonyl carbon.'),
                solution: t('Mažiausi pakaitai (propanonas) leidžia nukleofilui prisiartinti lengviausiai. Eilė: propanonas > 3-pentanonas > 2,4-dimetil-3-pentanonas > 2,2,4,4-tetrametil-3-pentanonas.', 'The smallest substituents (propanone) leave the nucleophile the easiest approach. Order: propanone > pentan-3-one > 2,4-dimethylpentan-3-one > 2,2,4,4-tetramethylpentan-3-one.')
              },
              {
                prompt: t('Kuris veiksnys čia svarbiausias?', 'Which factor matters most here?'),
                kind: 'choice',
                options: [
                  { text: t('Erdviniai trukdžiai: nukleofilui sunkiau prieiti prie karbonilo anglies.', 'Steric hindrance: the nucleophile finds it harder to reach the carbonyl carbon.') },
                  { text: t('Karbonilo anglies $δ+$ didėja, kai grandinė šakotesnė.', 'The $δ+$ of the carbonyl carbon grows as the chain becomes more branched.') },
                  { text: t('Šakotesni ketonai lengviau protonizuojami rūgštyje, todėl yra aktyvesni.', 'More branched ketones are protonated more easily in acid, so they are more active.') },
                  { text: t('Šakotesni ketonai neturi $α$-H.', 'More branched ketones have no $α$-H.') }
                ],
                answer: 0,
                hint: t('Elektroninis efektas visų keturių panašus. Kas keičiasi stipriausiai?', 'The electronic effect is similar in all four. What changes the most?'),
                solution: t('Didėjantys pakaitai blokuoja kelią nukleofilui: erdviniai trukdžiai didėja, o reaktingumas mažėja.', 'The growing substituents block the way of the nucleophile: steric hindrance increases and reactivity falls.')
              }
            ],
            why: t('Kai elektroniniai skirtumai maži, erdviniai trukdžiai nusprendžia. Nukleofilas atakuoja plokščiąją karbonilo grupę iš viršaus ar apačios, o šakoti pakaitai šį kelią užstoja.', 'When the electronic differences are small, steric hindrance decides. The nucleophile attacks the planar carbonyl group from above or below, and branched substituents block that path.'),
            src: 'L13 p5, p6'
          },
          {
            id: 'u13.order.4',
            q: [
              { p: t('Trys žiediniai karbonilo junginiai.', 'Three cyclic carbonyl compounds.') },
              { mol: [{ smi: 'O=CC1CCCCC1' }, { smi: 'O=C1CCCCC1', name: t('cikloheksanonas', 'cyclohexanone') }, { smi: 'CC1(C)CCCC(C)(C)C1=O' }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite pagal aktyvumą su nukleofilais nuo didžiausio.', 'Order them by reactivity towards nucleophiles, highest first.'),
                kind: 'order',
                options: [{ mol: { smi: 'O=CC1CCCCC1' } }, { mol: { smi: 'O=C1CCCCC1' } }, { mol: { smi: 'CC1(C)CCCC(C)(C)C1=O' } }],
                hint: t('Pirmiausia įvertinkite, kuris junginys aldehidas, o paskui – kiek trukdo gretimos grupės.', 'First decide which compound is an aldehyde, then how much the neighbouring groups hinder.'),
                solution: t('Aldehidas (cikloheksankarbaldehidas) reaktingesnis už ketoną. Iš ketonų lėčiausiai reaguoja 2,2,6,6-tetrametilcikloheksanonas: karbonilą užstoja dvi metilų poros.', 'The aldehyde (cyclohexanecarbaldehyde) is more reactive than a ketone. Among the ketones the 2,2,6,6-tetramethyl derivative is shielded by two pairs of methyl groups and is the slowest.')
              },
              {
                prompt: t('Į kurią karbonilo anglies pusę atakuoja nukleofilas?', 'From which side does the nucleophile attack the carbonyl carbon?'),
                kind: 'choice',
                options: [
                  { text: t('Iš viršaus arba apačios, statmenai $C=O$ plokštumai, nes ten yra $π$ elektronų debesis.', 'From above or below, perpendicular to the $C=O$ plane, because that is where the $π$ electron cloud is.') },
                  { text: t('Iš deguonies pusės.', 'From the side of the oxygen atom.') },
                  { text: t('Tik iš $α$ anglies pusės.', 'Only from the side of the $α$ carbon.') },
                  { text: t('Bet kuria kryptimi vienodai.', 'Equally from any direction.') }
                ],
                answer: 0,
                hint: t('Prisiminkite karbonilo anglies hibridizaciją ir $π$ ryšio padėtį.', 'Recall the hybridisation of the carbonyl carbon and the position of the $π$ bond.'),
                solution: t('Karbonilo anglis sp² hibridizuota: ji ir trys jos pakaitai yra vienoje plokštumoje, o $π$ orbitalė statmena jai, todėl nukleofilas artėja iš viršaus arba apačios. Dideli pakaitai šalia anglies tą kelią užstoja.', 'The carbonyl carbon is sp²: it and its three substituents lie in one plane and the $π$ orbital is perpendicular to it, so the nucleophile comes in from above or below. Large groups next to the carbon block that path.')
              }
            ],
            why: t('Aldehidas paprastai reaktingesnis už ketoną, o tarp ketonų dar svarbu, kiek erdviškai užstojama karbonilo anglis.', 'An aldehyde is usually more reactive than a ketone, and among ketones it matters how much the carbonyl carbon is shielded.'),
            src: 'L13 p6'
          },
          {
            id: 'u13.order.5',
            q: [
              { p: t('Į tris mėgintuvėlius įpilta tokių pačių kiekių vandenilio cianido. Kuris karbonilo junginys reaguos greičiausiai?', 'Equal amounts of hydrogen cyanide are added to three tubes. Which carbonyl compound reacts fastest?') },
              { mol: [{ smi: 'CCCC=O', name: t('butanalis', 'butanal') }, { smi: 'CCC(=O)CC', name: t('3-pentanonas', 'pentan-3-one') }, { smi: 'CC(C)C(=O)C(C)C', name: t('2,4-dimetil-3-pentanonas', '2,4-dimethylpentan-3-one') }] }
            ],
            steps: [
              {
                prompt: t('Pasirinkite greičiausiai reaguojantį junginį.', 'Choose the compound that reacts fastest.'),
                kind: 'choice',
                options: [{ mol: { smi: 'CCCC=O' } }, { mol: { smi: 'CCC(=O)CC' } }, { mol: { smi: 'CC(C)C(=O)C(C)C' } }],
                answer: 0,
                hint: t('Prie karbonilo anglies yra vienas ar du organiniai pakaitai?', 'Are there one or two organic substituents on the carbonyl carbon?'),
                solution: t('Butanalis yra aldehidas: karbonilo anglis turi mažiausiai pakaitų ir yra lengviausiai prieinama.', 'Butanal is an aldehyde: its carbonyl carbon carries the fewest substituents and is the most accessible.')
              },
              {
                prompt: t('Kodėl šis junginys reaguoja greičiausiai?', 'Why does this compound react fastest?'),
                kind: 'choice',
                options: [
                  { text: t('Aldehido karbonilo anglis turi didesnį $δ+$ ir mažiau erdvinių trukdžių.', 'The aldehyde carbonyl carbon has a larger $δ+$ and less steric hindrance.') },
                  { text: t('Aldehidas turi daugiau $α$ vandenilių.', 'The aldehyde has more $α$ hydrogens.') },
                  { text: t('Aldehidas turi laisvų elektronų poras, kurių ketonas neturi.', 'The aldehyde has lone pairs that the ketone lacks.') }
                ],
                answer: 0,
                hint: t('Prisiminkite abu veiksnius: krūvį ir prieinamumą.', 'Recall both factors: charge and accessibility.'),
                solution: t('Abu veiksniai rodo tą patį: mažiau alkilų – didesnis $δ+$ ir lengvesnė ataka.', 'Both factors point the same way: fewer alkyl groups mean a larger $δ+$ and an easier attack.')
              }
            ],
            why: t('HCN yra AN reagentas, todėl jam galioja ta pati eilė kaip ir kitiems nukleofilams: aldehidas > ketonas > šakotas ketonas.', 'HCN is an AN reagent, so the same order applies as for other nucleophiles: aldehyde > ketone > branched ketone.'),
            src: 'L13 p6, p23'
          },
          {
            id: 'u13.order.6',
            q: [
              { p: t('Silpnas nukleofilas (alkoholis) su acetonu reaguoja lėtai, bet pridėjus kelis lašus rūgšties reakcija pagreitėja.', 'A weak nucleophile (an alcohol) reacts slowly with acetone, but a few drops of acid speed the reaction up.') },
              { mol: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'CO', name: t('metanolis', 'methanol') }] }
            ],
            steps: [
              {
                prompt: t('Kuri dalelė kinta pirmoje stadijoje, kai pridedama $H+$?', 'Which species changes in the first stage when $H+$ is added?'),
                kind: 'choice',
                options: [
                  { text: t('Karbonilo deguonis protonizuojamas.', 'The carbonyl oxygen is protonated.') },
                  { text: t('Metanolio anglis protonizuojama.', 'The carbon of methanol is protonated.') },
                  { text: t('Acetono metilo anglis protonizuojama.', 'The methyl carbon of acetone is protonated.') },
                  { text: t('Vanduo atskyla iš karbonilo.', 'Water leaves the carbonyl group.') }
                ],
                answer: 0,
                hint: t('Kurioje karbonilo vietoje yra laisvos elektronų poros?', 'Where in the carbonyl group are there lone pairs?'),
                solution: t('Deguonis turi laisvas elektronų poras, todėl jis prisijungia $H+$.', 'Oxygen has lone pairs, so it bonds to $H+$.')
              },
              {
                prompt: t('Kodėl dėl to reakcija pagreitėja?', 'Why does that speed up the reaction?'),
                kind: 'choice',
                options: [
                  { text: t('Protonuotame karbonile teigiamas krūvis dar labiau nuskurdina anglį, todėl ji lengviau atakuojama.', 'In the protonated carbonyl the positive charge makes the carbon even more electron-poor, so it is attacked more easily.') },
                  { text: t('Protonas paverčia metanolį stipresniu nukleofilu.', 'The proton turns methanol into a stronger nucleophile.') },
                  { text: t('Protonas pašalina erdvinius trukdžius.', 'The proton removes the steric hindrance.') },
                  { text: t('Protonas sudaro aldolį.', 'The proton forms the aldol.') }
                ],
                answer: 0,
                hint: t('Palyginkite karbonilo anglies krūvį neutraliame ir protonizuotame karbonile.', 'Compare the charge on the carbonyl carbon in the neutral and the protonated carbonyl.'),
                solution: t('$C=O^+^−H$ stipriau traukia elektronus nei $C=O$, todėl $δ+$ ant anglies didesnis ir silpnam nukleofilui užtenka mažesnės energijos atakuoti.', '$C=O^+^−H$ withdraws electrons more strongly than $C=O$, so the $δ+$ on carbon is larger and a weak nucleophile can attack with less energy.')
              }
            ],
            why: t('Rūgštinė terpė didina karbonilgrupės aktyvumą. Silpni nukleofilai (alkoholiai, vanduo) su juo reaguoja daug greičiau (hidratas ir pusacetalis susidaro ir be rūgšties, o acetaliui susidaryti rūgšties būtina), o stiprūs nukleofilai (hidridas, cianidas) atakuoja ir neutralų karbonilą.', 'An acidic medium raises the reactivity of the carbonyl group. Weak nucleophiles (alcohols, water) react much faster with it (a hydrate and a hemiacetal also form without acid, but acetal formation requires it), while strong ones (hydride, cyanide) also attack the neutral carbonyl.'),
            src: 'L13 p6, p8'
          },
          {
            id: 'u13.order.7',
            q: [
              { p: t('Junginyje yra du karbonilai. Su vienu ekvivalentu nukleofilo reaguos tik vienas.', 'The compound has two carbonyl groups. With one equivalent of a nucleophile only one of them reacts.') },
              { mol: { smi: 'O=CCCC(C)=O', name: t('4-oksopentanalis', '4-oxopentanal') } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite anglį, kurią pirmiausia atakuos nukleofilas.', 'Tap the carbon that the nucleophile attacks first.'),
                kind: 'atoms',
                mol: { smi: 'O=CCCC(C)=O', opts: { numbers: 'all' } },
                answer: [1],
                hint: t('Kuri karbonilgrupė aldehidinė, o kuri ketoninė?', 'Which carbonyl group is the aldehyde and which the ketone?'),
                solution: t('Atomas Nr. 2 yra aldehido anglis: ji turi mažiau pakaitų ir didesnį $δ+$ nei ketono anglis (Nr. 5).', 'Carbon no. 2 is the aldehyde carbon: it has fewer substituents and a larger $δ+$ than the ketone carbon (no. 5).')
              },
              {
                prompt: t('Kokia ši reakcija pagal mechanizmą?', 'What is the mechanism symbol of this reaction?'),
                kind: 'choice',
                options: [{ text: t('AN', 'AN') }, { text: t('AE', 'AE') }, { text: t('SN1', 'SN1') }, { text: t('SR', 'SR') }],
                answer: 0,
                hint: t('Nukleofilas atakuoja $δ+$ atomą ir prisijungia.', 'A nucleophile attacks a $δ+$ atom and adds.'),
                solution: t('Nukleofilas atakuoja karbonilo anglį ir jungiasi prie jos: nukleofilinis prijungimas, AN.', 'A nucleophile attacks the carbonyl carbon and adds to it: nucleophilic addition, AN.')
              }
            ],
            why: t('Aldehidas reaktingesnis už ketoną, todėl pasirenkama aldehidogrupė. Taip galima selektyviai apsaugoti aldehidą, o ketoną palikti laisvą.', 'The aldehyde is more reactive than the ketone, so the aldehyde group is chosen. This allows the aldehyde to be protected selectively while the ketone stays free.'),
            src: 'L13 p6, p7'
          },
          {
            id: 'u13.order.8',
            q: [
              { p: t('Trys ketonai su skirtingu chloro kiekiu.', 'Three ketones with different amounts of chlorine.') },
              { mol: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'ClCC(C)=O' }, { smi: 'ClC(Cl)(Cl)C(C)=O', name: t('1,1,1-trichlor-2-propanonas', '1,1,1-trichloropropan-2-one') }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite pagal aktyvumą su nukleofilais nuo didžiausio.', 'Order them by reactivity towards nucleophiles, highest first.'),
                kind: 'order',
                options: [{ mol: { smi: 'ClC(Cl)(Cl)C(C)=O' } }, { mol: { smi: 'ClCC(C)=O' } }, { mol: { smi: 'CC(C)=O' } }],
                hint: t('Ar chloras prideda, ar atima elektronų iš karbonilo anglies?', 'Does chlorine add electrons to the carbonyl carbon or take them away?'),
                solution: t('Chloras traukia elektronus ($−I$), todėl $δ+$ didėja, kai chloro daugiau: trichlorpropanonas > chlorpropanonas > propanonas.', 'Chlorine withdraws electrons ($−I$), so $δ+$ grows with more chlorine: trichloropropanone > chloropropanone > propanone.')
              }
            ],
            why: t('Elektronų akceptorinės grupės veikia ir aldehidus, ir ketonus: kuo didesnis $δ+$, tuo greitesnė ataka ir tuo stabilesnis prijungimo produktas.', 'Electron-withdrawing groups act on both aldehydes and ketones: the larger the $δ+$, the faster the attack and the more stable the addition product.'),
            src: 'L13 p6, p12'
          }
        ]
      },

      /* ================= 2. hydrates (S6.2), bank ================= */
      {
        id: 'u13.hydrate',
        title: t('Hidratai ir chloralis', 'Hydrates and chloral'),
        mirrors: ['S6.2'],
        bank: [
          {
            id: 'u13.hydrate.1',
            q: [
              { p: t('Chloralis (trichloretanalis) vandenyje sudaro patvarų gem-diolį.', 'Dissolved in water, chloral (trichloroethanal) forms a stable hydrate.') },
              { scheme: { items: [{ smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', 'trichloroethanal') }, { plus: true }, { smi: 'O' }, { arrow: '→' }] } }
            ],
            steps: [
              {
                prompt: t('Kuri formulė yra chloralhidrato?', 'Which formula is chloral hydrate?'),
                kind: 'choice',
                options: [
                  { mol: { smi: 'ClC(Cl)(Cl)C(O)O' } },
                  { mol: { smi: 'ClC(Cl)(Cl)C(=O)O' } },
                  { mol: { smi: 'ClC(Cl)(Cl)CO' } },
                  { mol: { smi: 'ClC(Cl)C(O)O' } }
                ],
                answer: 0,
                hint: t('Kas prisijungia prie karbonilo anglies ir kas prie deguonies, kai prisijungia vanduo?', 'When water adds, what bonds to the carbonyl carbon and what to the oxygen?'),
                solution: t('Vanduo prijungiamas prie karbonilo: $OH$ jungiasi prie anglies, $H$ – prie deguonies. Ant tos pačios anglies atsiranda dvi $OH$ grupės.', 'Water adds across the carbonyl: $OH$ bonds to carbon and $H$ to oxygen. Two $OH$ groups end up on the same carbon.')
              },
              {
                prompt: t('Kodėl šis hidratas patvarus, o etanalio hidratas – ne?', 'Why is this hydrate stable while the hydrate of ethanal is not?'),
                kind: 'choice',
                options: [
                  { text: t('Trys chloro atomai traukia elektronus ($−I$), padidina $δ+$ ant karbonilo anglies ir pastumia pusiausvyrą į hidrato pusę.', 'Three chlorine atoms withdraw electrons ($−I$), raise the $δ+$ on the carbonyl carbon and shift the equilibrium towards the hydrate.') },
                  { text: t('Chloras stumia elektronus į karbonilą ir stabilizuoja hidratą.', 'Chlorine pushes electrons into the carbonyl group and stabilises the hydrate.') },
                  { text: t('Chloro atomai neleidžia hidratui netekti vandens dėl erdvinių trukdžių.', 'The chlorine atoms keep the hydrate from losing water because of steric hindrance.') },
                  { text: t('Chloralis rūgštesnis už etanalį ir su vandeniu sudaro druską.', 'Chloral is more acidic than ethanal and forms a salt with water.') }
                ],
                answer: 0,
                hint: t('Palyginkite karbonilo anglies krūvį abiejuose aldehiduose.', 'Compare the charge on the carbonyl carbon in the two aldehydes.'),
                solution: t('Chloralyje karbonilo anglis labai $δ+$, todėl pusiausvyra beveik visiškai pasislenka į hidrato pusę. Etanalyje pusiausvyra mažiau pasislinkusi ir hidratas egzistuoja tik tirpale.', 'In chloral the carbonyl carbon is strongly $δ+$, so the attack of water goes almost to completion. In ethanal the equilibrium lies less far over and the hydrate exists only in solution.')
              }
            ],
            why: t('Aldehido su elektronų akceptorine grupe $α$ padėtyje $δ+$ didelis, todėl hidratacijos pusiausvyra pasislenka į hidrato pusę ir hidratas tampa patvarus.', 'An aldehyde with an electron-withdrawing group in the $α$ position has a large $δ+$, so the hydration equilibrium shifts towards the hydrate and the hydrate becomes stable.'),
            src: 'L13 p12, S6.2',
            claims: [{ formula: ['ClC(Cl)(Cl)C(O)O', 'C2H3Cl3O2'] }, { name: ['ClC(Cl)(Cl)C(O)O', t('2,2,2-trichlor-1,1-etandiolis', '2,2,2-trichloroethane-1,1-diol')] }]
          },
          {
            id: 'u13.hydrate.2',
            q: [
              { p: t('Keturi karbonilo junginiai ištirpinti vandenyje.', 'Four carbonyl compounds are dissolved in water.') },
              { mol: [{ smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', 'trichloroethanal') }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') }] }
            ],
            steps: [
              {
                prompt: t('Kuris sudarys patvariausią hidratą?', 'Which forms the most stable hydrate?'),
                kind: 'choice',
                options: [{ mol: { smi: 'ClC(Cl)(Cl)C=O' } }, { mol: { smi: 'CC=O' } }, { mol: { smi: 'CC(C)=O' } }, { mol: { smi: 'O=Cc1ccccc1' } }],
                answer: 0,
                hint: t('Kurio karbonilo anglis labiausiai nuskurdinta elektronų?', 'Whose carbonyl carbon is the most electron-poor?'),
                solution: t('Trichloretanalis: trys chlorai traukia elektronus per $σ$ ryšį ir stipriai padidina $δ+$.', 'Trichloroethanal: three chlorines withdraw electrons through the $σ$ bond and raise $δ+$ strongly.')
              },
              {
                prompt: t('Kokia grupė $α$ padėtyje sukelia šį poveikį?', 'What kind of group in the $α$ position causes this effect?'),
                kind: 'choice',
                options: [
                  { text: t('Elektronų akceptorinė grupė ($−I$).', 'An electron-withdrawing group ($−I$).') },
                  { text: t('Elektronų donorinė alkilgrupė ($+I$).', 'An electron-donating alkyl group ($+I$).') },
                  { text: t('Aromatinis žiedas, kuris konjuguojasi su karbonilu.', 'An aromatic ring conjugated with the carbonyl group.') }
                ],
                answer: 0,
                hint: t('Hidratą stabilizuoja tai, kas didina $δ+$.', 'The hydrate is favoured by whatever raises $δ+$.'),
                solution: t('Akceptorinė grupė didina $δ+$. Alkilai ir aromatinis žiedas $δ+$ mažina, todėl ketonai ir didesni aldehidai hidrato sudaro mažai, o metanalis ir etanalis daugiausia yra hidrato pavidalo.', 'An acceptor group raises $δ+$. Alkyl groups and an aromatic ring lower it, so ketones and larger aldehydes form little hydrate, while methanal and ethanal are largely hydrated.')
              }
            ],
            why: t('Hidrato dalis tirpale atspindi karbonilo anglies elektrofiliškumą: ji didžiausia aldehiduose su stipriomis akceptorinėmis grupėmis ir mažiausia ketonuose.', 'The share of hydrate in solution reflects the electrophilicity of the carbonyl carbon: it is highest for aldehydes with strong acceptor groups and lowest for ketones.'),
            src: 'L13 p12'
          },
          {
            id: 'u13.hydrate.3',
            q: [
              { p: t('Keturi junginiai vandeniniame tirpale.', 'Four compounds in aqueous solution.') },
              { mol: [{ smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', 'trichloroethanal') }, { smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite pagal hidrato dalį pusiausvyroje, pradėdami nuo didžiausios.', 'Order them by the share of hydrate at equilibrium, starting with the largest.'),
                kind: 'order',
                options: [{ mol: { smi: 'ClC(Cl)(Cl)C=O' } }, { mol: { smi: 'C=O', opts: { allH: true } } }, { mol: { smi: 'CC=O' } }, { mol: { smi: 'CC(C)=O' } }],
                hint: t('Hidrato dalis kinta kartu su AN aktyvumu: kas aktyviausias, to hidrato daugiausia.', 'The hydrate share follows AN reactivity: the most reactive carbonyl gives the most hydrate.'),
                solution: t('Chloralis > metanalis > etanalis > propanonas, tokia pat eilė kaip ir aktyvumo.', 'Chloral > methanal > ethanal > propanone, the same order as the reactivity.')
              },
              {
                prompt: t('Kokia etanalio ir jo hidrato pusiausvyra vandenyje?', 'What is the equilibrium between ethanal and its hydrate in water?'),
                kind: 'choice',
                options: [
                  { text: t('Vandeniniame tirpale yra ir aldehido (apie 42 %), ir hidrato (apie 58 %).', 'In aqueous solution both aldehyde (about 42 %) and hydrate (about 58 %) are present.') },
                  { text: t('Etanalis vandenyje visiškai virsta hidratu.', 'Ethanal turns completely into the hydrate in water.') },
                  { text: t('Etanalis vandenyje nereaguoja.', 'Ethanal does not react in water.') }
                ],
                answer: 0,
                hint: t('AN reakcija su vandeniu grįžtamoji.', 'AN with water is reversible.'),
                solution: t('Pusiausvyra nusistovi su abiem formomis; hidrato yra šiek tiek daugiau nei aldehido, bet visas etanalis į hidratą nevirsta.', 'An equilibrium is reached with both forms; there is somewhat more of the ethanal hydrate, but not all of it.')
              }
            ],
            why: t('Hidratacija yra pusiausvyrinė AN reakcija. Aktyvesnis karbonilas duoda daugiau hidrato, o ketonų pusiausvyra daugiausia lieka karbonilo pusėje.', 'Hydration is an equilibrium AN reaction. A more reactive carbonyl gives more hydrate, while for ketones the equilibrium mostly stays on the carbonyl side.'),
            src: 'L13 p6, p12, p13'
          },
          {
            id: 'u13.hydrate.4',
            q: [
              { p: t('Rūgštyje etanalis prijungia vandenį. Sudėkite stadijas į tinkamą tvarką.', 'In acid, ethanal adds water. Put the stages in the right order.') },
              { scheme: { items: [{ smi: 'CC=O', name: t('etanalis', 'ethanal') }, { plus: true }, { smi: 'O' }, { arrow: '⇌', above: f('H+') }, { smi: 'CC(O)O' }] } }
            ],
            steps: [
              {
                prompt: t('Išdėstykite stadijas nuo pirmos iki paskutinės.', 'Order the stages from first to last.'),
                kind: 'order',
                options: [
                  { text: t('Karbonilo deguonis protonizuojamas.', 'The carbonyl oxygen is protonated.') },
                  { text: t('Vandens deguonis atakuoja karbonilo anglį.', 'The oxygen of water attacks the carbonyl carbon.') },
                  { text: t('Oksonio jonas netenka protono.', 'The oxonium ion loses a proton.') }
                ],
                hint: t('Rūgštyje pirmiausia aktyvinamas elektrofilas.', 'In acid the electrophile is activated first.'),
                solution: [
                  { p: t('Pirmiausia protonizuojamas karbonilas, tada jį atakuoja silpnas nukleofilas (vanduo), ir galiausiai netenkama protono.', 'First the carbonyl is protonated, then the weak nucleophile (water) attacks it, and finally a proton is lost.') },
                  { mech: MECH.hydration }
                ]
              },
              {
                prompt: t('Kodėl rūgštyje vanduo atakuoja greičiau?', 'Why does water attack faster in acid?'), kind: 'choice',
                options: [
                  { text: t('Protonizuotame karbonile anglies $δ+$ didesnis.', 'In the protonated carbonyl the $δ+$ on carbon is larger.') },
                  { text: t('Rūgštis paverčia vandenį stipresniu nukleofilu.', 'The acid turns water into a stronger nucleophile.') },
                  { text: t('Rūgštis pašalina erdvinius trukdžius.', 'The acid removes steric hindrance.') },
                  { text: t('Rūgštis sudaro aldolį.', 'The acid forms an aldol.') }
                ],
                answer: 0,
                hint: t('Palyginkite karbonilo anglies krūvį prieš protonizaciją ir po jos.', 'Compare the charge on the carbonyl carbon before and after protonation.'),
                solution: t('Teigiamas deguonis stipriau traukia $π$ elektronus, todėl anglies $δ+$ didesnis ir silpnas nukleofilas ją atakuoja lengviau.', 'The positive oxygen pulls the $π$ electrons harder, so the $δ+$ on carbon is larger and a weak nucleophile attacks it more easily.')
              }
            ],
            why: t('Rūgštyje nukleofilą (vandenį) atakuoti paruošia protonizuotas karbonilas. Tai tas pats principas kaip ir hemiacetalio, acetalio bei imino susidarymo.', 'In acid a protonated carbonyl prepares the attack of the nucleophile (water). It is the same pattern as in hemiacetal, acetal and imine formation.'),
            src: 'L13 p13'
          },
          {
            id: 'u13.hydrate.5',
            q: [
              { p: t('Formalinas yra 37 % metanalio vandeninis tirpalas. Metanalis yra labai reaktingas karbonilas.', 'Formalin is a 37 % aqueous solution of methanal. Methanal is a very reactive carbonyl compound.') },
              { mol: { smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } } }
            ],
            steps: [
              {
                prompt: t('Kuri forma vyrauja šiame vandeniniame tirpale?', 'Which form dominates in this aqueous solution?'),
                kind: 'choice',
                options: [{ mol: { smi: 'OCO', opts: { allH: true } } }, { mol: { smi: 'C=O', opts: { allH: true } } }, { mol: { smi: 'OC=O', opts: { allH: true } } }, { mol: { smi: 'CO', opts: { allH: true } } }],
                answer: 0,
                hint: t('Metanalis neturi alkilų: ką tai reiškia jo $δ+$ ir hidratacijos pusiausvyrai?', 'Methanal has no alkyl groups: what does that mean for its $δ+$ and for the hydration equilibrium?'),
                solution: t('Metanalyje karbonilo anglis labai $δ+$ ir lengvai prieinama, todėl vandenyje daugiausia yra hidrato (metandiolio). Rūgštis ir metanolis reikalautų oksidacijos ar redukcijos, kurios čia nėra.', 'In methanal the carbonyl carbon is very $δ+$ and easily accessible, so the solution contains mostly the hydrate (methanediol). The acid and methanol would need an oxidation or reduction that does not happen here.')
              }
            ],
            why: t('Kuo aktyvesnis karbonilas, tuo daugiau hidrato. Metanalis – reaktingiausias paprastas aldehidas, todėl vandenyje jo hidratas vyrauja.', 'The more reactive the carbonyl compound, the more hydrate. Methanal is the most reactive simple aldehyde, so its hydrate dominates in water.'),
            src: 'L13 p2, p6, p12',
            claims: [{ name: ['OCO', t('1,1-metandiolis', 'methane-1,1-diol')] }]
          },
          {
            id: 'u13.hydrate.6',
            q: [
              { p: t('Trichlorpropanonas yra ketonas, bet jo hidratas stabilesnis nei propanono.', 'Trichloropropanone is a ketone, but its hydrate is more stable than that of propanone.') },
              { mol: { smi: 'ClC(Cl)(Cl)C(C)=O', name: t('1,1,1-trichlor-2-propanonas', '1,1,1-trichloropropan-2-one') } }
            ],
            steps: [
              {
                prompt: t('Pasirinkite šio ketono hidrato formulę.', 'Choose the formula of the hydrate of this ketone.'),
                kind: 'choice',
                options: [{ mol: { smi: 'ClC(Cl)(Cl)C(C)(O)O' } }, { mol: { smi: 'ClC(Cl)(Cl)C(C)O' } }, { mol: { smi: 'ClC(Cl)(Cl)C(C)(O)Cl' } }, { mol: { smi: 'ClC(Cl)(O)C(C)(O)Cl' } }],
                answer: 0,
                hint: t('Hidrate ant buvusios karbonilo anglies sėdi dvi hidroksigrupės.', 'In a hydrate the former carbonyl carbon carries two hydroxy groups.'),
                solution: t('Vanduo prisijungia prie karbonilo anglies: $C(OH)2$. Chlorai ir metilas nesikeičia.', 'Water adds to the carbonyl carbon: $C(OH)2$. The chlorine atoms and the methyl group do not change.')
              }
            ],
            why: t('Ne tik aldehidai, bet ir ketonai su stipriomis akceptorinėmis grupėmis sudaro stabilius hidratus: lemia $δ+$, o ne klasė.', 'Not only aldehydes but also ketones with strong acceptor groups form stable hydrates: it is the $δ+$ that decides, not the class.'),
            src: 'L13 p12',
            claims: [{ formula: ['ClC(Cl)(Cl)C(C)(O)O', 'C3H5Cl3O2'] }]
          },
          {
            id: 'u13.hydrate.7',
            q: [
              { p: t('Kurie iš šių junginių sudaro patvarų hidratą, kurį galima išskirti?', 'Which of these form a stable hydrate that can be isolated?') },
              { mol: [{ smi: 'ClC(Cl)(Cl)C=O', name: t('trichloretanalis', 'trichloroethanal') }, { smi: 'FC(F)(F)C=O' }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }, { smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') }] }
            ],
            steps: [
              {
                prompt: t('Pažymėkite visus, kurie sudaro stabilų hidratą.', 'Pick every compound that forms a stable hydrate.'),
                kind: 'multi',
                options: [{ mol: { smi: 'ClC(Cl)(Cl)C=O' } }, { mol: { smi: 'FC(F)(F)C=O' } }, { mol: { smi: 'CC=O' } }, { mol: { smi: 'O=Cc1ccccc1' } }],
                answer: [0, 1],
                hint: t('Kuriuose junginiuose šalia karbonilo yra stipriai elektronus traukiančios grupės?', 'In which compounds are there strongly electron-withdrawing groups next to the carbonyl group?'),
                solution: t('$CCl3$ ir $CF3$ stipriai traukia elektronus ($−I$) ir stabilizuoja hidratą. Etanalyje yra alkilas, o benzenkarbaldehide fenilas nuskurdina karbonilą mažiau, todėl jų hidratai nestabilūs.', '$CCl3$ and $CF3$ withdraw electrons strongly ($−I$) and stabilise the hydrate. Ethanal carries an alkyl group and benzaldehyde a phenyl group, which do not make the carbonyl electron-poor enough, so their hydrates are not stable.')
              }
            ],
            why: t('Taisyklė paprasta: stabilų hidratą sudaro karbonilo junginys su stipriai elektronus traukiančia grupe $α$ padėtyje.', 'The rule is simple: a stable hydrate is formed by a carbonyl compound with a strongly electron-withdrawing group in the $α$ position.'),
            src: 'L13 p12; Klein'
          },
          {
            id: 'u13.hydrate.8',
            q: [
              { p: t('Gem-diolis ($C(OH)2$) iš etanalio ir gem-diolis iš chloralio sumaišyti su rūgštimi. Vienas lengvai grįžta į karbonilą.', 'Gem-diols ($C(OH)2$) from ethanal and from chloral are treated with acid. One returns to the carbonyl compound readily.') },
              { mol: [{ smi: 'CC(O)O' }, { smi: 'ClC(Cl)(Cl)C(O)O' }] }
            ],
            steps: [
              {
                prompt: t('Kuris hidratas lengvai praranda vandenį ir grįžta į aldehidą?', 'Which hydrate readily loses water and returns to the aldehyde?'),
                kind: 'choice',
                options: [{ mol: { smi: 'CC(O)O' } }, { mol: { smi: 'ClC(Cl)(Cl)C(O)O' } }],
                answer: 0,
                hint: t('Kurio hidrato pusiausvyra labiau pasislinkusi į hidrato pusę?', 'Whose equilibrium lies further on the hydrate side?'),
                solution: t('Etanalio hidratas nestabilus: pusiausvyra tarp aldehido ir hidrato nusistovi greitai. Chloralhidratas patvarus, nes $CCl3$ stabilizuoja hidratą.', 'The hydrate of ethanal is unstable: the equilibrium between aldehyde and hydrate is quickly established. Chloral hydrate is stable because $CCl3$ stabilises it.')
              }
            ],
            why: t('Hidratacija ir dehidratacija yra ta pati pusiausvyra. Stabilumą lemia karbonilo $δ+$: kuo jis didesnis, tuo hidratas patvaresnis.', 'Hydration and dehydration are the same equilibrium. The stability depends on the $δ+$ of the carbonyl group: the larger it is, the more stable the hydrate.'),
            src: 'L13 p12, p13'
          }
        ]
      },

      /* ================= 3. hemiacetals and acetals (S6.3), generator ================= */
      {
        id: 'u13.acetal',
        title: t('Hemiacetaliai ir acetaliai', 'Hemiacetals and acetals'),
        mirrors: ['S6.3'],
        gen(rng, ctx) {
          const { react, chem } = ctx;
          const POOL = ALD.slice(0, 6).concat(['O=Cc1ccccc1'], KET.slice(0, 8));
          const MONO = ['CO', 'CCO', 'CCCO', 'CCCCO'];
          let pick = null;
          for (let tries = 0; tries < 80 && !pick; tries++) {
            const smi = ctx.pick(POOL);
            const diol = ctx.int(0, 2) === 0;
            const nu = diol ? ctx.pick(['OCCCO', 'OCCO']) : ctx.pick(MONO);
            const hemi = majors(react.run('co.hemiacetal', [smi, nu]));
            const acet = majors(react.run('co.acetal', [smi, nu]));
            if (!hemi.length || acet.length !== 1) continue;
            const hs = hydrateSmi(smi);
            if (!hs) continue;
            try { if (chem.groups(chem.parse(hs)).some((g) => g.type === 'aldehyde' || g.type === 'ketone')) continue; } catch (e) { continue; }
            pick = { smi, nu, diol, hemi: hemi[0], acet: acet[0], hs };
          }
          if (!pick) throw new Error('u13.acetal: no usable pair');
          const { smi, nu, diol, hemi, acet, hs } = pick;
          const ether = diol ? null : nu + nu.slice(0, -1);
          const hydrolysis = {
            prompt: t('Kokiomis sąlygomis iš acetalio vėl gaunamas karbonilo junginys?', 'Under which conditions is the carbonyl compound regained from the acetal?'),
            kind: 'choice',
            options: [
              { text: t('$H3O+$ ($H2O$, $H+$)', '$H3O+$ ($H2O$, $H+$)') },
              { text: t('$NaOH$, $H2O$', '$NaOH$, $H2O$') },
              { text: t('$NaBH4$', '$NaBH4$') },
              { text: t('$H2$, $Pd$', '$H2$, $Pd$') }
            ],
            answer: 0,
            hint: t('Acetalio susidarymas grįžtamas: kokios terpės jis nepakenčia?', 'Acetal formation is reversible: in which medium is it not stable?'),
            solution: t('Acetalis hidrolizuojasi vandeninėje rūgštyje, o šarmuose, hidriduose ir $H2$/$Pd$ jis patvarus.', 'An acetal hydrolyses in aqueous acid, while it is stable towards alkali, hydrides and $H2$/$Pd$.')
          };
          const tap = {
            prompt: t('Bakstelėkite anglį, kurią atakuoja alkoholio deguonis.', 'Tap the carbon that the alcohol oxygen attacks.'),
            kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: [carbonylC(ctx, smi)],
            hint: t('Kuris atomas turi $δ+$ dėl $C=O$ poliarizacijos?', 'Which atom carries $δ+$ through the $C=O$ polarisation?'),
            solution: t('Karbonilo anglis yra $δ+$, todėl nukleofilas atakuoja ją.', 'The carbonyl carbon is $δ+$, so the nucleophile attacks it.')
          };
          const steps = [tap];
          if (!diol) {
            steps.push({
              prompt: t('Kas susidaro pirmiausia, kai santykis 1 : 1 ir yra rūgšties?', 'What forms first when the ratio is 1 : 1 and acid is present?'),
              kind: 'choice', options: optList(ctx, [hemi], [acet, hs], 3), answer: 0,
              hint: t('Pirma prisijungia viena alkoholio molekulė. Kiek $OR$ grupių yra prie anglies?', 'Only one alcohol molecule adds first. How many $OR$ groups are on the carbon?'),
              solution: [{ p: t('Pirmoji stadija (AN): prisijungia viena alkoholio molekulė, anglis turi $OH$ ir $OR$ – tai hemiacetalis.', 'The first stage (AN): one alcohol molecule adds and the carbon carries $OH$ and $OR$: a hemiacetal.') }, { mol: { smi: hemi } }]
            });
            steps.push({
              prompt: t('Koks produktas gaunamas su alkoholio pertekliumi ir rūgštimi?', 'What is the product with excess alcohol and acid?'),
              kind: 'choice', options: optList(ctx, [acet], [hemi, ether], 3), answer: 0,
              hint: t('Hemiacetalis prijungia dar vieną alkoholio molekulę ir netenka vandens.', 'The hemiacetal adds a second alcohol molecule and loses water.'),
              solution: [{ p: t('Hemiacetalio $OH$ rūgštyje išeina kaip vanduo, o jo vietą užima antra $OR$ grupė: susidaro acetalis.', 'In acid the hemiacetal $OH$ leaves as water and a second $OR$ group takes its place: the acetal forms.') }, { mol: { smi: acet } }]
            });
          } else {
            steps.push({
              prompt: t('Koks yra pagrindinis produktas rūgštyje su šiuo dioliu?', 'What is the main product in acid with this diol?'),
              kind: 'choice', options: optList(ctx, [acet], [hemi, hs], 3), answer: 0,
              hint: t('Diolis turi dvi $OH$ grupes: ar jos abi gali prisijungti prie tos pačios anglies?', 'The diol has two $OH$ groups: can both bond to the same carbon?'),
              solution: [{ p: t('Abi diolio $OH$ grupės jungiasi prie karbonilo anglies, atsiskiria vanduo ir susidaro ciklinis acetalis.', 'Both $OH$ groups of the diol bond to the carbonyl carbon, water is lost, and a cyclic acetal forms.') }, { mol: { smi: acet } }]
            });
            steps.push({
              prompt: t('Kiek diolio ekvivalentų reikia šiam acetaliui?', 'How many equivalents of the diol does this acetal need?'),
              kind: 'choice',
              options: [
                { text: t('Vieno: abi $OH$ grupės yra toje pačioje molekulėje.', 'One: both $OH$ groups are in the same molecule.') },
                { text: t('Dviejų, kaip ir su paprastu alkoholiu.', 'Two, as with a simple alcohol.') },
                { text: t('Pusės ekvivalento.', 'Half an equivalent.') }
              ],
              answer: 0,
              hint: t('Kiek $OR$ grupių turi turėti acetalis?', 'How many $OR$ groups must an acetal have?'),
              solution: t('Acetalis turi dvi $O$–$C$ jungtis, o diolis jas duoda abi, todėl pakanka vieno ekvivalento.', 'An acetal needs two $O$–$C$ bonds and the diol supplies both, so one equivalent is enough.')
            });
          }
          steps.push(hydrolysis);
          return {
            q: [
              { p: t('Karbonilo junginys reaguoja su alkoholiu rūgščioje terpėje.', 'A carbonyl compound reacts with an alcohol in an acidic medium.') },
              { scheme: { items: [{ smi }, { plus: true }, { smi: nu }, { arrow: '→', above: f('H+') }] } }
            ],
            steps,
            why: t('Rūgštyje karbonilas protonizuojamas, alkoholis jį atakuoja ir susidaro hemiacetalis. Antroji stadija (su pertekliumi alkoholio arba su dioliu) duoda acetalį. Visa tai grįžtama: vandeninėje rūgštyje acetalis hidrolizuojasi.', 'In acid the carbonyl is protonated, the alcohol attacks it and a hemiacetal forms. The second stage (with excess alcohol or with a diol) gives the acetal. All of it is reversible: in aqueous acid the acetal hydrolyses.'),
            src: 'L13 p14, p16, p17, S6.3'
          };
        }
      },

      /* ================= 4. protecting the carbonyl group (S6.10), generator ================= */
      {
        id: 'u13.protect',
        title: t('Karbonilo apsauga dioliu (ciklinis acetalis)', 'Protecting a carbonyl group with a diol (cyclic acetal)'),
        mirrors: ['S6.10'],
        gen(rng, ctx) {
          const { react } = ctx;
          const POOL = ['CC(C)=O', 'O=C1CCCCC1', 'CCC(C)=O', 'O=C1CCCC1', 'O=Cc1ccccc1', 'CCCC=O', 'CC(=O)c1ccccc1', 'CCC(=O)CC', 'CC(C)CC(C)=O', 'O=C1CCCCCC1', 'CCCCC=O', 'CCCC(C)=O'];
          let pick = null;
          for (let tries = 0; tries < 60 && !pick; tries++) {
            const smi = ctx.pick(POOL);
            const six = ctx.int(0, 3) === 0;
            const diol = six ? 'OCCCO' : 'OCCO';
            const other = six ? 'OCCO' : 'OCCCO';
            const acet = majors(react.run('co.acetal', [smi, diol]));
            const open = majors(react.run('co.hemiacetal', [smi, diol]));
            const wrongRing = majors(react.run('co.acetal', [smi, other]));
            const hs = hydrateSmi(smi);
            if (acet.length !== 1 || !open.length || !wrongRing.length || !hs) continue;
            pick = { smi, diol, acet: acet[0], open: open[0], wrongRing: wrongRing[0], hs, six };
          }
          if (!pick) throw new Error('u13.protect: no usable carbonyl');
          const { smi, diol, acet, open, wrongRing, hs, six } = pick;
          return {
            q: [
              { p: t('Karbonilgrupei apsaugoti ji paverčiama cikliniu acetaliu.', 'To protect a carbonyl group it is converted into a cyclic acetal.') },
              { scheme: { items: [{ smi }, { plus: true }, { smi: diol }, { arrow: '→', above: f('H+'), below: f('−H2O') }] } }
            ],
            steps: [
              {
                prompt: t('Koks produktas susidaro?', 'What is the product?'),
                kind: 'choice', options: optList(ctx, [acet], ctx.shuffle([open, wrongRing, hs]), 4), answer: 0,
                hint: t('Abi diolio $OH$ grupės jungiasi prie vienos anglies. Kokio dydžio žiedas susidaro?', 'Both $OH$ groups of the diol bond to one carbon. What size of ring forms?'),
                solution: [{ p: six ? t('Propano-1,3-diolis duoda šešių narių 1,3-dioksano žiedą (karbonilo anglis, du $O$ ir trys diolio anglys).', 'Propane-1,3-diol gives a six-membered 1,3-dioxane ring (the carbonyl carbon, two $O$ and three diol carbons).') : t('Etano-1,2-diolis duoda penkių narių 1,3-dioksolano žiedą (karbonilo anglis, du $O$ ir dvi diolio anglys).', 'Ethane-1,2-diol gives a five-membered 1,3-dioxolane ring (the carbonyl carbon, two $O$ and two diol carbons).') }, { mol: { smi: acet } }]
              },
              {
                prompt: t('Kuo veikiant acetalį vėl gaunamas karbonilo junginys?', 'What regenerates the carbonyl compound from the acetal?'),
                kind: 'choice',
                options: [{ text: t('$H3O+$', '$H3O+$') }, { text: t('$NaOH$, $H2O$', '$NaOH$, $H2O$') }, { text: t('1) $LiAlH4$  2) $H2O$', '1) $LiAlH4$  2) $H2O$') }, { text: t('$H2$, $Pd$', '$H2$, $Pd$') }],
                answer: 0,
                hint: t('Apsauginė grupė pašalinama ta pačia terpe, kurioje acetalis nestabilus.', 'The protecting group is removed in the medium where the acetal is not stable.'),
                solution: t('Acetalio susidarymas grįžtamas, todėl vandeninė rūgštis jį hidrolizuoja ir atkuria karbonilą bei diolį.', 'Acetal formation is reversible, so aqueous acid hydrolyses it and regenerates the carbonyl compound and the diol.')
              },
              {
                prompt: t('Kodėl apsauga naudinga, kai kitoje molekulės vietoje reikia redukuoti esterį $LiAlH4$?', 'Why is the protection useful when an ester elsewhere in the molecule must be reduced with $LiAlH4$?'),
                kind: 'choice',
                options: [
                  { text: t('Acetalis patvarus hidridams ir bazėms, todėl apsaugotas karbonilas nesiredukuoja.', 'An acetal is stable towards hydrides and bases, so the protected carbonyl is not reduced.') },
                  { text: t('Acetalis katalizuoja esterio redukciją.', 'The acetal catalyses the reduction of the ester.') },
                  { text: t('Acetalis reaktingesnis už karbonilą ir pirmas sureaguoja su $LiAlH4$.', 'The acetal is more reactive than the carbonyl and reacts first with $LiAlH4$.') },
                  { text: t('Acetalis nutraukia $LiAlH4$ reakciją.', 'The acetal stops the $LiAlH4$ reaction.') }
                ],
                answer: 0,
                hint: t('Kuo skiriasi acetalio ir karbonilo elgsena šarminėje, hidridų terpėje?', 'How do an acetal and a carbonyl group behave in an alkaline, hydride medium?'),
                solution: t('Acetaliuose nėra $C=O$ ir $δ+$ anglies, todėl hidridas jų neatakuoja; po redukcijos rūgštis grąžina karbonilą.', 'An acetal has no $C=O$ and no $δ+$ carbon, so hydride does not attack it; afterwards acid restores the carbonyl group.')
              }
            ],
            why: t('Acetalis yra „užmaskuota“ karbonilgrupė: jis neturi $π$ ryšio ir stabilus šarmuose bei hidridų terpėje, bet lengvai hidrolizuojasi rūgštyje. Todėl jį galima įvesti, atlikti kitą reakciją ir pašalinti.', 'An acetal is a "masked" carbonyl group: it has no $π$ bond and is stable in alkali and hydride media, but hydrolyses easily in acid. So it can be introduced, another reaction carried out, and the acetal removed again.'),
            src: 'L13 p18, p19, S6.10'
          };
        }
      },

      /* ================= 5. thioacetals (S6.9), generator ================= */
      {
        id: 'u13.thio',
        title: t('Tioacetaliai', 'Thioacetals'),
        mirrors: ['S6.9'],
        gen(rng, ctx) {
          const { react } = ctx;
          const POOL = ['O=C1CCCC1', 'O=C1CCCCC1', 'CC(C)=O', 'CCC(C)=O', 'CCCC=O', 'CCC=O', 'O=Cc1ccccc1', 'CC(=O)c1ccccc1', 'CCC(=O)CC', 'CCCCC=O', 'CC(C)CC(C)=O'];
          const MONO = ['CS', 'CCS', 'CCCS', 'CCCCS'];
          let pick = null;
          for (let tries = 0; tries < 60 && !pick; tries++) {
            const smi = ctx.pick(POOL);
            const di = ctx.int(0, 2) === 0;
            const nu = di ? ctx.pick(['SCCS', 'SCCCS']) : ctx.pick(MONO);
            const ox = nu.replace(/S/g, 'O');
            const th = majors(react.run('co.thioacetal', [smi, nu]));
            const ac = majors(react.run('co.acetal', [smi, ox]));
            if (th.length !== 1 || ac.length !== 1) continue;
            pick = { smi, nu, di, th: th[0], ac: ac[0] };
          }
          if (!pick) throw new Error('u13.thio: no usable pair');
          const { smi, nu, di, th, ac } = pick;
          const cls = (ltN, enN) => ({ text: t(ltN, enN) });
          return {
            q: [
              { p: t('Aldehidai ir ketonai su tioliais rūgščioje terpėje reaguoja panašiai kaip su alkoholiais.', 'Aldehydes and ketones react with thiols in acid in the same way as with alcohols.') },
              { scheme: { items: [{ smi }, { plus: true }, { smi: nu }, { arrow: '→', above: f('H+') }] } }
            ],
            steps: [
              {
                prompt: t('Kiek tiolio ekvivalentų reikia tioacetaliui gauti?', 'How many equivalents of the thiol are needed to make the thioacetal?'),
                kind: 'number', answer: { value: di ? 1 : 2, tol: 0 },
                hint: t('Kiek $S$ atomų turi turėti tioacetalis ir kiek jų duoda viena reagento molekulė?', 'How many $S$ atoms must a thioacetal have and how many does one reagent molecule supply?'),
                solution: di ? t('Ditiolis turi dvi $SH$ grupes, todėl pakanka vieno ekvivalento: susidaro ciklinis tioacetalis.', 'A dithiol has two $SH$ groups, so one equivalent is enough: a cyclic thioacetal forms.') : t('Kiekviena tiolio molekulė duoda vieną $S$, o tioacetalis turi dvi $S–C$ jungtis, todėl reikia dviejų ekvivalentų.', 'Each thiol molecule supplies one $S$ and a thioacetal needs two $S–C$ bonds, so two equivalents are needed.')
              },
              {
                prompt: t('Koks yra produktas?', 'What is the product?'),
                kind: 'choice', options: optList(ctx, [th], [ac, sub2(smi, 'O', di ? nu : nu.split('').reverse().join('')), di ? majors(react.run('co.thioacetal', [smi, nu === 'SCCS' ? 'SCCCS' : 'SCCS']))[0] : null].filter((x) => x), 4), answer: 0,
                hint: t('Kuris nukleofilo atomas turi laisvąsias poras ir jungiasi prie anglies? Kiek tokių ryšių reikia?', 'Which atom of the nucleophile has the lone pairs and bonds to the carbon? How many such bonds are needed?'),
                solution: [{ p: t('Siera, o ne deguonis, jungiasi prie karbonilo anglies; deguonis atskyla su vandeniu.', 'Sulfur, not oxygen, bonds to the carbonyl carbon; the oxygen leaves with water.') }, { mol: { smi: th } }]
              },
              {
                prompt: t('Kaip vadinasi susidaręs junginys?', 'What is the product called?'),
                kind: 'choice',
                options: [
                  cls('tioacetalis (ketonui – tioketalis)', 'thioacetal (for a ketone, a thioketal)'),
                  cls('acetalis', 'acetal'),
                  cls('hemiacetalis', 'hemiacetal'),
                  cls('sulfidas (tioeteris)', 'sulfide (thioether)')
                ],
                answer: 0,
                hint: t('Prisiminkite pavadinimą junginio, kuriame viena anglis turi dvi $OR$ grupes. Ką reiškia „tio-“?', 'Recall the name of a compound with two $OR$ groups on one carbon. What does the prefix "thio" tell you?'),
                solution: t('Prie anglies yra dvi $SR$ grupės, todėl tai tioacetalis (acetalio analogas, kuriame $O$ pakeistas $S$).', 'Two $SR$ groups are on the carbon, so it is a thioacetal (the analogue of an acetal in which $O$ is replaced by $S$).')
              }
            ],
            why: t('Tioliai yra puikūs nukleofilai. Mechanizmas toks pat kaip alkoholių (protonizacija, ataka, vandens atskilimas, antra ataka), tik gaunamas $S$ turintis acetalio analogas.', 'Thiols are excellent nucleophiles. The mechanism is the same as for alcohols (protonation, attack, loss of water, second attack), but the product is the sulfur analogue of an acetal.'),
            src: 'S6.9'
          };
        }
      },

      /* ================= 6. products of nucleophilic additions (S6.4), generator ================= */
      {
        id: 'u13.nu',
        title: t('Reagentai ir produktai: $NaBH4$, $HCN$, $NH2OH$, aminai', 'Reagents and products: $NaBH4$, $HCN$, $NH2OH$, amines'),
        mirrors: ['S6.4'],
        gen(rng, ctx) {
          const { react, chem } = ctx;
          const NUCS = [
            { id: 'nabh4', rule: 'co.nabh4', reag: null, label: f('1) NaBH4  2) H2O'), cls: t('alkoholis', 'alcohol'), sym: 0 },
            { id: 'hcn', rule: 'co.hcn', reag: 'C#N', label: null, cls: t('hidroksinitrilas (cianhidrinas)', 'hydroxynitrile (cyanohydrin)'), sym: 0 },
            { id: 'oxime', rule: 'co.oxime', reag: 'NO', label: null, cls: t('oksimas', 'oxime'), sym: 1 },
            { id: 'hydrazone', rule: 'co.phenylhydrazone', reag: 'NNc1ccccc1', label: null, cls: t('fenilhidrazonas', 'phenylhydrazone'), sym: 1 },
            { id: 'imine', rule: 'co.oxime', reag: 'CN', label: null, cls: t('iminas (Šifo bazė)', 'imine (Schiff base)'), sym: 1 }
          ];
          const POOL = ALD.slice(0, 7).concat(KET, ['O=Cc1ccccc1', 'O=Cc1ccc(C)cc1', 'C=O']);
          const product = (nuc, smi) => {
            const p = majors(react.run(nuc.rule, [smi]));
            if (p.length !== 1) return null;
            if (nuc.id === 'imine') { if (!p[0].includes('=NO')) return null; return p[0].replace('=NO', '=NC'); }
            return p[0];
          };
          let pick = null;
          for (let tries = 0; tries < 60 && !pick; tries++) {
            const smi = ctx.pick(POOL);
            const nuc = ctx.pick(NUCS);
            const prod = product(nuc, smi);
            if (!prod) continue;
            try { chem.parse(prod); } catch (e) { continue; }
            const isoSet = POOL.filter((x) => x !== smi && sameFormula(ctx, x, smi));
            let others = ctx.shuffle(isoSet).map((x) => product(nuc, x)).filter((x) => x);
            if (nuc.id === 'hcn') others = [sub1(smi, 'OC#N'), sub2(smi, 'O', '[N+]#[C-]')].concat(others).filter((x) => x);
            if (!others.length) continue;
            const carbinol = nuc.sym === 1 ? prod.replace('=N', '(O)N') : null;
            pick = { smi, nuc, prod, others, carbinol };
          }
          if (!pick) throw new Error('u13.nu: no usable pair');
          const { smi, nuc, prod, others, carbinol } = pick;
          if (nuc.sym === 1 && ctx.int(0, 2) === 0) {
            // the exam question the other way round (L13 p32): from the C=N compound to the carbonyl compound and the reagent
            const starts = [smi].concat(ctx.shuffle(POOL.filter((x) => x !== smi && sameFormula(ctx, x, smi))).slice(0, 2));
            const reagents = [
              { id: 'oxime', text: t('$NH2OH$', '$NH2OH$') }, { id: 'hydrazone', text: t('$C6H5NHNH2$', '$C6H5NHNH2$') },
              { id: 'imine', text: t('$CH3NH2$', '$CH3NH2$') }, { id: 'hcn', text: t('$HCN$', '$HCN$') }
            ];
            return {
              q: [
                { p: t('Šis junginys gautas iš aldehido ar ketono ir azoto nukleofilo.', 'This compound was made from an aldehyde or ketone and a nitrogen nucleophile.') },
                { mol: { smi: prod } }
              ],
              steps: [
                {
                  prompt: t('Iš kokio karbonilo junginio jis gautas?', 'Which carbonyl compound was it made from?'),
                  kind: 'choice', options: starts.map((x) => ({ mol: { smi: x } })), answer: 0,
                  hint: t('Grupę $C=N$ pakeiskite grupe $C=O$ ir patikrinkite visą anglies skeletą.', 'Replace $C=N$ by $C=O$ and check the whole carbon skeleton.'),
                  solution: [{ p: t('$C=N$ rodo, kur buvo karbonilo anglis; skeletas nesikeičia.', 'The $C=N$ shows where the carbonyl carbon was; the skeleton does not change.') }, { mol: { smi } }]
                },
                {
                  prompt: t('Su kokiu reagentu jis reagavo?', 'Which reagent did it react with?'),
                  kind: 'choice', options: [reagents.find((x) => x.id === nuc.id).text].concat(reagents.filter((x) => x.id !== nuc.id && x.id !== 'hcn').map((x) => x.text), [reagents[3].text]).map((x) => ({ text: x })), answer: 0,
                  hint: t('Pažiūrėkite, kokia grupė yra prie $C=N$ azoto.', 'Look at the group on the nitrogen of $C=N$.'),
                  solution: t('Grupė prie azoto rodo reagentą: $OH$ – hidroksilaminą, $NHC6H5$ – fenilhidraziną, alkilas – pirminį aminą.', 'The group on nitrogen shows the reagent: $OH$ means hydroxylamine, $NHC6H5$ phenylhydrazine, an alkyl group a primary amine.')
                }
              ],
              why: t('Grįžtant nuo $C=N$ junginio: $C=N$ virsta $C=O$, o grupė prie azoto nusako reagentą.', 'Working back from a $C=N$ compound: $C=N$ becomes $C=O$ and the group on nitrogen names the reagent.'),
              src: 'L13 p32, p29, p30'
            };
          }
          const items = [{ smi }];
          if (nuc.reag) items.push({ plus: true }, { smi: nuc.reag });
          items.push(nuc.label ? { arrow: '→', above: nuc.label } : { arrow: '→' });
          const wrong = (carbinol ? [carbinol] : []).concat(others);
          const clsOpts = [nuc].concat(ctx.shuffle(NUCS.filter((x) => x.id !== nuc.id)).slice(0, 3)).map((x) => ({ text: x.cls }));
          const symOpts = [
            { text: nuc.sym ? t('AN, po to eliminavimas (E)', 'AN, then elimination (E)') : t('AN', 'AN') },
            { text: nuc.sym ? t('AN', 'AN') : t('AN, po to eliminavimas (E)', 'AN, then elimination (E)') },
            { text: t('AE', 'AE') },
            { text: t('SN2', 'SN2') }
          ];
          return {
            q: [
              { p: t('Karbonilo junginys reaguoja su nurodytu reagentu.', 'A carbonyl compound reacts with the given reagent.') },
              { scheme: { items } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite anglį, kurią atakuoja nukleofilas.', 'Tap the carbon that the nucleophile attacks.'),
                kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: [carbonylC(ctx, smi)],
                hint: t('Kuri anglis yra $δ+$?', 'Which carbon is $δ+$?'),
                solution: t('Karbonilo anglis turi $δ+$, todėl ji yra elektrofilinis centras.', 'The carbonyl carbon has $δ+$ and is the electrophilic centre.')
              },
              {
                prompt: t('Koks yra galutinis produktas?', 'What is the final product?'),
                kind: 'choice', options: optList(ctx, [prod], wrong, 4), answer: 0,
                hint: nuc.sym
                  ? t('Pirmasis AN produktas dar turi vandenį, kurį gali prarasti. Kokia grupė gaunama azoto nukleofilui?', 'The first AN product still holds water that it can lose. Which group results from a nitrogen nucleophile?')
                  : t('Nukleofilas atakuoja karbonilo anglį, o deguonis tampa $OH$. Koks čia nukleofilas?', 'The nucleophile attacks the carbonyl carbon and oxygen becomes $OH$. What is the nucleophile here?'),
                solution: [{ p: nuc.sym ? t('Azoto nukleofilas atakuoja anglį, susidaro karbinolaminas, o iš jo atskyla vanduo: gaunama $C=N$ grupė.', 'The nitrogen nucleophile attacks the carbon, a carbinolamine forms and loses water: a $C=N$ group results.') : t('Nukleofilas prisijungia prie karbonilo anglies, deguonis gauna protoną ir virsta $OH$.', 'The nucleophile adds to the carbonyl carbon and the oxygen takes a proton and becomes $OH$.') }, { mol: { smi: prod } }]
              },
              {
                prompt: t('Kaip vadinamas šis produktas?', 'What is this product called?'),
                kind: 'choice', options: clsOpts, answer: 0,
                hint: t('Pagalvokite apie naują grupę, kuri atsirado vietoje $C=O$.', 'Think about the new group that replaced $C=O$.'),
                solution: t('Produkto klasę nusako nauja grupė prie buvusios karbonilo anglies.', 'The class of the product is given by the new group on the former carbonyl carbon.')
              },
              {
                prompt: t('Kuris aprašymas tinka reakcijos mechanizmui?', 'Which description fits the mechanism?'),
                kind: 'choice', options: symOpts, answer: 0,
                hint: nuc.sym ? t('Ar produkte lieka vanduo, kurį reikia atskirti?', 'Is water lost from the product?') : t('Ar produktas praranda vandenį?', 'Does the product lose water?'),
                solution: nuc.sym ? t('AN (azoto ataka) ir paskui eliminavimas: atskyla vanduo ir gaunamas $C=N$.', 'AN (attack by nitrogen) followed by elimination: water is lost and $C=N$ forms.') : t('Tai paprastas nukleofilinis prijungimas, AN: vanduo neatskyla.', 'This is a plain nucleophilic addition, AN: no water is lost.')
              }
            ],
            why: t('Visais atvejais nukleofilas atakuoja $δ+$ karbonilo anglį. $H−$ ir $CN−$ tik prisijungia (alkoholis, cianhidrinas), o amoniako dariniai po prijungimo praranda vandenį ir sudaro $C=N$.', 'In every case the nucleophile attacks the $δ+$ carbonyl carbon. $H−$ and $CN−$ only add (alcohol, cyanohydrin), while ammonia derivatives lose water after the addition and form $C=N$.'),
            src: 'L13 p9, p23, p25, p29, p30, p31, S6.4'
          };
        }
      },

      /* ================= 7. identifying aldehydes and methyl ketones (S6.4), generator ================= */
      {
        id: 'u13.id',
        title: t('Tolenso, Felingo ir jodoformo testai', 'Tollens, Fehling and iodoform tests'),
        mirrors: ['S6.4'],
        gen(rng, ctx) {
          const { react } = ctx;
          const POOL = ['CC=O', 'CCC=O', 'CCCC=O', 'CCCCC=O', 'O=Cc1ccccc1', 'C=O', 'CC(C)=O', 'CCC(C)=O', 'CCC(=O)CC', 'CCCC(C)=O', 'O=C1CCCCC1', 'CC(=O)c1ccccc1', 'CCO', 'CC(C)O', 'CCCO', 'CCC(C)O', 'CCCCO'];
          const TESTS = [
            {
              id: 'tollens', title: t('Tolenso reagentu ($Ag+$ amoniake)', 'Tollens\' reagent ($Ag+$ in ammonia)'), pool: POOL.filter((s) => s !== 'CCO' && s !== 'CC(C)O' && s !== 'CCCO' && s !== 'CCC(C)O' && s !== 'CCCCO'),
              pos: (s) => { const r = react.run('co.tollens', [s]); return !r.none && r.products.some((p) => p.by); },
              obs: t('Ant mėgintuvėlio sienelių nusėda sidabro veidrodis.', 'A silver mirror is deposited on the walls of the tube.'),
              wrong: [t('Susidaro raudonos nuosėdos.', 'A red precipitate forms.'), t('Susidaro geltonos nuosėdos.', 'A yellow precipitate forms.'), t('Tirpalas pasidaro mėlynas.', 'The solution turns blue.')]
            },
            {
              id: 'fehling', title: t('Felingo reagentu ($Cu2+$, $NaOH$, kaitinant)', 'Fehling\'s reagent ($Cu2+$, $NaOH$, heated)'), pool: POOL.filter((s) => s !== 'O=Cc1ccccc1' && s !== 'CCO' && s !== 'CC(C)O' && s !== 'CCCO' && s !== 'CCC(C)O' && s !== 'CCCCO'),
              pos: (s) => { const r = react.run('co.tollens', [s]); return !r.none && r.products.some((p) => p.by); },
              obs: t('Susidaro raudonos $Cu2O$ nuosėdos.', 'A red precipitate of $Cu2O$ forms.'),
              wrong: [t('Ant mėgintuvėlio sienelių nusėda sidabro veidrodis.', 'A silver mirror is deposited on the walls of the tube.'), t('Susidaro geltonos nuosėdos.', 'A yellow precipitate forms.'), t('Tirpalas lieka mėlynas.', 'The solution stays blue.')]
            },
            {
              id: 'iodoform', title: t('jodu ir $NaOH$ (jodoformo reakcija)', 'iodine and $NaOH$ (the iodoform reaction)'), pool: POOL,
              pos: (s) => { const r = react.run('co.iodoform', [s]); return !r.none && r.products.some((p) => p.smi.includes('I')); },
              obs: t('Susidaro geltonos $CHI3$ nuosėdos.', 'A yellow precipitate of $CHI3$ forms.'),
              wrong: [t('Ant mėgintuvėlio sienelių nusėda sidabro veidrodis.', 'A silver mirror is deposited on the walls of the tube.'), t('Susidaro raudonos nuosėdos.', 'A red precipitate forms.'), t('Tirpalas pasidaro mėlynas.', 'The solution turns blue.')]
            }
          ];
          let pick = null;
          for (let tries = 0; tries < 80 && !pick; tries++) {
            const test = ctx.pick(TESTS);
            const four = ctx.shuffle(test.pool).slice(0, 4);
            const flags = four.map(test.pos);
            const n = flags.filter((x) => x).length;
            if (n < 1 || n > 2) continue;
            pick = { test, four, flags };
          }
          if (!pick) throw new Error('u13.id: no usable set');
          const { test, four, flags } = pick;
          const right = four.map((s, i) => (flags[i] ? i : -1)).filter((i) => i >= 0);
          const steps = [
            {
              prompt: t('Pažymėkite visus junginius, kurie duos teigiamą rezultatą.', 'Pick every compound that gives a positive result.'),
              kind: 'multi', options: four.map((s) => ({ mol: M(s) })), answer: right,
              hint: test.id === 'iodoform'
                ? t('Kokia grupė turi būti: karbonilas ar alkoholis su tam tikra grupe prie $C=O$ ar $CHOH$?', 'Which group must be present: a carbonyl or an alcohol with a certain group next to $C=O$ or $CHOH$?')
                : t('Kuri funkcinė grupė yra reduktorius?', 'Which functional group is the reducing agent?'),
              solution: test.id === 'iodoform'
                ? t('Teigiamą rezultatą duoda junginiai su $CH3−C(=O)−$ arba $CH3−CH(OH)−$ grupe (alkoholis oksiduojamas į acetilgrupę).', 'Compounds with a $CH3−C(=O)−$ or $CH3−CH(OH)−$ group give a positive result (the alcohol is oxidised to an acetyl group).')
                : t('Šie reagentai oksiduoja tik aldehidus: ketonai ir alkoholiai nereaguoja.', 'These reagents oxidise aldehydes only: ketones and alcohols do not react.')
            },
            {
              prompt: t('Ką pamatysite teigiamame mėgintuvėlyje?', 'What do you observe in the positive tube?'),
              kind: 'choice', options: [{ text: test.obs }].concat(test.wrong.map((w) => ({ text: w }))), answer: 0,
              hint: t('Prisiminkite, koks tvirtas ar spalvotas junginys išsiskiria šiam reagentui.', 'Recall which solid or coloured compound forms with this reagent.'),
              solution: test.id === 'tollens'
                ? t('$Ag+$ redukuojamas iki metalinio sidabro, kuris dengia stiklą kaip veidrodis.', '$Ag+$ is reduced to metallic silver, which coats the glass like a mirror.')
                : test.id === 'fehling'
                  ? t('$Cu2+$ redukuojamas iki $Cu+$, ir susidaro raudonos $Cu2O$ nuosėdos.', '$Cu2+$ is reduced to $Cu+$ and a red precipitate of $Cu2O$ forms.')
                  : t('Trijodmetilketonas skyla šarme: išsiskiria geltonos jodoformo ($CHI3$) nuosėdos ir lieka karboksilatas.', 'The triiodomethyl ketone is cleaved by alkali: yellow iodoform ($CHI3$) precipitates and a carboxylate remains.')
            }
          ];
          const posList = four.filter((s, i) => flags[i]);
          if (test.id === 'fehling' && posList.length > 1 && posList.includes('C=O')) {
            steps.push({
              prompt: t('Kuris iš teigiamų junginių duoda be raudonų nuosėdų dar ir vario veidrodį?', 'Which of the positive compounds gives a copper mirror as well as the red precipitate?'),
              kind: 'choice', options: posList.map((s) => ({ mol: M(s) })), answer: posList.indexOf('C=O'),
              hint: t('Vienas iš aldehidų yra stipriausias reduktorius iš visų.', 'One of the aldehydes is the strongest reducing agent of all.'),
              solution: t('Metanalis varį redukuoja net iki metalo, o šis nusėda ant stiklo sienelių (vario veidrodis).', 'Methanal reduces copper even to the metal, which settles on the glass walls (a copper mirror).')
            });
          }
          return {
            q: [
              { p: t('Keturis junginius veikiame ' + test.title.lt + '.', 'Four compounds are treated with ' + test.title.en + '.') },
              { mol: four.map((s) => M(s)) }
            ],
            steps,
            why: t('Šie testai pagrįsti reduktoriaus savybe: aldehidai oksiduojami šarminėje terpėje silpnais oksidatoriais ($Ag+$, $Cu2+$), ketonai – ne. Jodoformo reakcijai reikia $CH3−CO−$ arba $CH3−CH(OH)−$ grupės.', 'These tests rest on the reducing power of aldehydes: they are oxidised in alkaline medium by weak oxidants ($Ag+$, $Cu2+$), ketones are not. The iodoform reaction needs a $CH3−CO−$ or $CH3−CH(OH)−$ group.'),
            src: 'L13 p36, p38, p49, LW6 p3'
          };
        }
      },

      /* ================= 8. Cannizzaro reactions (S6.5, S6.11), generator ================= */
      {
        id: 'u13.cann',
        title: t('Kanicaro reakcija', 'The Cannizzaro reaction'),
        mirrors: ['S6.5', 'S6.11'],
        gen(rng, ctx) {
          const { react } = ctx;
          const mode = ctx.pick(['single', 'single', 'crossed', 'intra', 'select']);
          const arrow = { arrow: '→', above: t('1) konc. NaOH', '1) conc. NaOH'), below: f('2) H3O+') };
          if (mode === 'select') {
            let four = null;
            for (let k = 0; k < 40 && !four; k++) {
              const a = ctx.shuffle(NOA).slice(0, 2);
              const b = ctx.shuffle(ALD).slice(0, 2);
              if (new Set(a.concat(b)).size === 4) four = a.concat(b);
            }
            const shuffled = ctx.shuffle(four);
            const right = shuffled.map((s, i) => (NOA.includes(s) ? i : -1)).filter((i) => i >= 0);
            return {
              q: [
                { p: t('Šie aldehidai veikiami koncentruotu $NaOH$ tirpalu.', 'These aldehydes are treated with a concentrated $NaOH$ solution.') },
                { mol: shuffled.map((s) => M(s)) }
              ],
              steps: [
                {
                  prompt: t('Pažymėkite aldehidus, kurie dalyvauja Kanicaro reakcijoje.', 'Pick the aldehydes that undergo the Cannizzaro reaction.'),
                  kind: 'multi', options: shuffled.map((s) => ({ mol: M(s) })), answer: right,
                  hint: t('Kokio atomo prie $α$ anglies reikia, kad vyktų kitokia reakcija?', 'Which atom on the $α$ carbon would make a different reaction possible?'),
                  solution: t('Kanicaro reakcijoje dalyvauja aldehidai, neturintys $α$-H: jie negali sudaryti enoliato ir tik dismutuoja. Likusieji turi $α$-H.', 'Aldehydes without $α$-H take part in the Cannizzaro reaction: they cannot form an enolate and only disproportionate. The others have $α$-H.')
                },
                {
                  prompt: t('Ką pirmiausia daro aldehidai su $α$-H praskiestame šarme?', 'What do aldehydes with $α$-H do first in dilute alkali?'),
                  kind: 'choice',
                  options: [
                    { text: t('Sudaro enoliatą ir jungiasi tarpusavyje (aldolinis prisijungimas).', 'They form an enolate and add to each other (aldol addition).') },
                    { text: t('Dismutuoja į alkoholį ir rūgštį.', 'They disproportionate into an alcohol and an acid.') },
                    { text: t('Sudaro stabilų hidratą.', 'They form a stable hydrate.') },
                    { text: t('Nereaguoja.', 'They do not react.') }
                  ],
                  answer: 0,
                  hint: t('Judrus $α$ vandenilis lengvai atsiskiria nuo bazės.', 'A mobile $α$ hydrogen is easily removed by a base.'),
                  solution: t('Enoliatas susidaro lengvai, o lėta hidrido pernaša (Kanicaro) su juo nekonkuruoja.', 'The enolate forms easily, and the slow hydride transfer (Cannizzaro) cannot compete.')
                }
              ],
              why: t('Aldehido ir šarmo reakciją lemia $α$ vandenilis: jį turintys aldehidai eina aldolinį kelią, neturintys – Kanicaro dismutaciją.', 'The $α$ hydrogen decides what an aldehyde does in alkali: those that have it follow the aldol path, those that lack it disproportionate (Cannizzaro).'),
              src: 'L13 p33, p43'
            };
          }
          if (mode === 'intra') {
            const POOL = [
              { smi: 'O=Cc1ccccc1C=O', diol: 'OCc1ccccc1CO', diacid: 'OC(=O)c1ccccc1C(=O)O' },
              { smi: 'O=CC=O', diol: 'OCCO', diacid: 'OC(=O)C(=O)O' }
            ];
            const d = ctx.pick(POOL);
            const res = majors(react.run('co.cannizzaro', [d.smi], { workup: true }));
            if (res.length !== 1) throw new Error('u13.cann: intramolecular product');
            return {
              q: [
                { p: t('Dialdehidas, neturintis $α$-H, veikiamas koncentruotu $NaOH$, o po to parūgštinamas.', 'A dialdehyde without $α$-H is treated with concentrated $NaOH$ and then acidified.') },
                { scheme: { items: [{ smi: d.smi }, arrow] } }
              ],
              steps: [
                {
                  prompt: t('Koks junginys susidaro?', 'Which compound forms?'),
                  kind: 'choice',
                  options: [{ mol: { smi: res[0] } }, { mol: { smi: d.diol } }, { mol: { smi: d.diacid } }, pairScheme([d.diol, d.diacid])],
                  answer: 0,
                  hint: t('Dvi aldehidogrupės yra vienoje molekulėje: viena redukuojama, kita oksiduojama. Kiek molekulių gaunama?', 'Two aldehyde groups are in one molecule: one is reduced and one oxidised. How many kinds of molecules result?'),
                  solution: [{ p: t('Hidridas pereina vienoje molekulėje iš vienos aldehidogrupės į kitą (intramolekulinė Kanicaro reakcija). Viena grupė virsta $CH2OH$, kita – $COOH$.', 'Hydride moves within one molecule from one aldehyde group to the other (an intramolecular Cannizzaro reaction). One group becomes $CH2OH$, the other $COOH$.') }, { mol: { smi: res[0] } }]
                },
                {
                  prompt: t('Kodėl nesusidaro dviejų skirtingų junginių mišinys?', 'Why is no mixture of two different compounds formed?'),
                  kind: 'choice',
                  options: [
                    { text: t('Abi grupės yra toje pačioje molekulėje, todėl viena molekulė viską padaro pati.', 'Both groups are in the same molecule, so one molecule does everything itself.') },
                    { text: t('Dialdehidas nedalyvauja Kanicaro reakcijoje.', 'A dialdehyde does not take part in the Cannizzaro reaction.') },
                    { text: t('Antroji aldehidogrupė nereaguoja su šarmu.', 'The second aldehyde group does not react with alkali.') }
                  ],
                  answer: 0,
                  hint: t('Pagalvokite, kuo skiriasi intramolekulinė ir tarpmolekulinė reakcija.', 'Think about the difference between an intramolecular and an intermolecular reaction.'),
                  solution: t('Tarpmolekulinėje reakcijoje viena molekulė būtų redukuota, kita oksiduota. Čia abi grupės jau yra kartu.', 'In an intermolecular reaction one molecule would be reduced and another oxidised. Here both groups are already together.')
                }
              ].concat(nameSteps(ctx, [res[0]])),
              why: t('Kanicaro reakcija yra dismutacija: aldehidas ir redukuojamas, ir oksiduojamas. Dialdehide abu procesai vyksta toje pačioje molekulėje.', 'The Cannizzaro reaction is a disproportionation: the aldehyde is both reduced and oxidised. In a dialdehyde both processes occur in the same molecule.'),
              src: 'L13 p33, S6.11'
            };
          }
          if (mode === 'crossed') {
            const smi = ctx.pick(NOA.filter((s) => s !== 'C=O'));
            const own = majors(react.run('co.cannizzaro', [smi], { workup: true }));
            const mixed = majors(react.run('co.cannizzaro', ['C=O', smi], { workup: true }));
            if (own.length !== 2 || mixed.length !== 2) throw new Error('u13.cann: crossed products');
            const alc = own.find((s) => !s.includes('=O')), acid = own.find((s) => s.includes('=O'));
            if (!alc || !acid) throw new Error('u13.cann: crossed alcohol and acid');
            const options = [
              pairScheme([alc, 'OC=O']),
              pairScheme([acid, 'CO']),
              pairScheme([alc, 'CO']),
              pairScheme([acid, 'OC=O'])
            ];
            return {
              q: [
                { p: t('Metanalis ir kitas aldehidas be $α$-H veikiami koncentruotu $NaOH$, o po to parūgštinami.', 'Methanal and another aldehyde without $α$-H are treated with concentrated $NaOH$ and then acidified.') },
                { scheme: { items: [{ smi: 'C=O', opts: { allH: true } }, { plus: true }, M(smi), arrow] } }
              ],
              steps: [
                {
                  prompt: t('Kuris aldehidas oksiduojasi?', 'Which aldehyde is oxidised?'),
                  kind: 'choice', options: [{ mol: { smi: 'C=O', opts: { allH: true } } }, { mol: { smi } }], answer: 0,
                  hint: t('Hidridą atiduoda tas aldehidas, kurio hidratas ir anijoninis tarpinis junginys susidaro lengviausiai.', 'The aldehyde that gives up the hydride is the one whose hydrate and anionic intermediate form most easily.'),
                  solution: t('Metanalis reaktingiausias, todėl pirmasis prijungia hidroksidą ir tampa hidrido donoru: oksiduojasi į skruzdžių rūgštį.', 'Methanal is the most reactive, so it adds hydroxide first and becomes the hydride donor: it is oxidised to formic acid.')
                },
                {
                  prompt: t('Kokie produktai susidaro?', 'Which products form?'),
                  kind: 'choice', options, answer: 0,
                  hint: t('Vienas aldehidas virsta rūgštimi, kitas – alkoholiu. Kuris kuo?', 'One aldehyde becomes an acid, the other an alcohol. Which becomes which?'),
                  solution: [{ p: t('Metanalis oksiduojasi, o kitas aldehidas redukuojasi: gaunama skruzdžių rūgštis (po parūgštinimo) ir atitinkamas alkoholis.', 'Methanal is oxidised and the other aldehyde is reduced: formic acid (after acidification) and the corresponding alcohol result.') }, pairScheme([alc, 'OC=O'])]
                }
              ],
              why: t('Mišrioje Kanicaro reakcijoje metanalis dažniausiai yra hidrido donoras, todėl oksiduojasi pats, o kitas aldehidas redukuojasi į alkoholį.', 'In a crossed Cannizzaro reaction methanal is usually the hydride donor, so it is oxidised itself and the other aldehyde is reduced to the alcohol.'),
              src: 'L13 p33, p34'
            };
          }
          const smi = ctx.pick(NOA);
          const res = majors(react.run('co.cannizzaro', [smi], { workup: true }));
          if (res.length !== 2) throw new Error('u13.cann: single products');
          const alc = res.find((s) => !s.includes('=O')), acid = res.find((s) => s.includes('=O'));
          if (!alc || !acid) throw new Error('u13.cann: alcohol and acid');
          return {
            q: [
              { p: t('Aldehidas veikiamas koncentruotu $NaOH$ tirpalu, po to parūgštinamas.', 'An aldehyde is treated with a concentrated $NaOH$ solution and then acidified.') },
              { scheme: { items: [M(smi), arrow] } }
            ],
            steps: [
              {
                prompt: t('Kodėl šis aldehidas dalyvauja Kanicaro, o ne aldolinėje reakcijoje?', 'Why does this aldehyde undergo the Cannizzaro rather than the aldol reaction?'),
                kind: 'choice',
                options: [
                  { text: t('Jis neturi $α$ vandenilių, todėl negali sudaryti enoliato.', 'It has no $α$ hydrogens, so it cannot form an enolate.') },
                  { text: t('Jis turi daug $α$ vandenilių.', 'It has many $α$ hydrogens.') },
                  { text: t('Jo karbonilo anglis per mažai $δ+$, kad būtų atakuota.', 'Its carbonyl carbon is not $δ+$ enough to be attacked.') },
                  { text: t('Koncentruotas šarmas neleidžia sudaryti enoliato.', 'Concentrated alkali prevents the enolate from forming.') }
                ],
                answer: 0,
                hint: t('Pažiūrėkite į atomus, esančius greta karbonilo anglies.', 'Look at the atoms next to the carbonyl carbon.'),
                solution: t('Prie karbonilo anglies nėra $α$ anglies su vandeniliu (metanalyje $α$ anglies apskritai nėra, aromatiniame aldehide ji priklauso žiedui), todėl enoliatas susidaryti negali ir vyksta Kanicaro dismutacija.', 'There is no $α$ carbon carrying hydrogen (methanal has no $α$ carbon at all; in an aromatic aldehyde it is part of the ring), so no enolate can form and the Cannizzaro disproportionation takes place.')
              },
              {
                prompt: t('Kokie produktai susidaro iš dviejų aldehido molekulių?', 'Which products form from two aldehyde molecules?'),
                kind: 'choice',
                options: [pairScheme([alc, acid]), pairScheme([alc, alc]), pairScheme([acid, acid])],
                answer: 0,
                hint: t('Viena molekulė gauna hidridą, kita jį atiduoda. Ką tai reiškia oksidacijos laipsniui?', 'One molecule receives a hydride and the other gives it up. What does that mean for the oxidation state?'),
                solution: [{ p: t('Viena aldehido molekulė redukuojasi į alkoholį, kita oksiduojasi į rūgštį (po parūgštinimo; šarme – druską).', 'One aldehyde molecule is reduced to the alcohol and the other oxidised to the acid (after acidification; in alkali, its salt).') }, pairScheme([alc, acid])]
              }
            ].concat(nameSteps(ctx, [alc, acid])),
            why: t('Dismutacija: viena aldehido molekulė atiduoda hidridą (oksiduojasi), kita jį priima (redukuojasi). Reikia koncentruoto šarmo ir aldehido be $α$-H; ketonai nereaguoja.', 'Disproportionation: one aldehyde molecule gives up a hydride (is oxidised) and another takes it (is reduced). Concentrated alkali and an aldehyde without $α$-H are needed; ketones do not react.'),
            src: 'L13 p33, p34, S6.5'
          };
        }
      },

      /* ================= 9. keto-enol tautomerism (S6.13), generator ================= */
      {
        id: 'u13.enol',
        title: t('Ketoenolinė tautomerija', 'Keto–enol tautomerism'),
        mirrors: ['S6.13'],
        gen(rng, ctx) {
          const { react } = ctx;
          const RS = ['C', 'CC', 'CCC', 'CC(C)', 'CCCC', 'CC(C)C'];
          const POOL = [];
          ['c1ccccc1', 'c1ccc(C)cc1', 'c1ccc(Cl)cc1', 'c1ccc(OC)cc1', 'c1ccc(F)cc1', 'c1ccc(Br)cc1'].forEach((ar) => RS.forEach((r) => POOL.push(r + 'C(=O)C' + ar)));
          let pick = null;
          for (let tries = 0; tries < 40 && !pick; tries++) {
            const smi = ctx.pick(POOL);
            const res = react.run('co.enols', [smi]);
            const maj = res.products.filter((p) => p.major).map((p) => p.smi);
            const min = res.products.filter((p) => !p.major).map((p) => p.smi);
            if (maj.length !== 1 || !min.length) continue;
            const alpha = alphaCs(ctx, smi);
            if (alpha.length < 2) continue;
            pick = { smi, maj: maj[0], min: min[0], alpha, ring: true };
          }
          if (!pick) throw new Error('u13.enol: no usable ketone');
          const { smi, maj, min, alpha, ring } = pick;
          const dik = false;
          /* R = CH3 (1-arylpropan-2-ones): the conjugated enol CH3-C(OH)=CH-Ar has a trisubstituted C=C, the other a 1,1-disubstituted one, so "more substituted" is true there and is not offered as a wrong option */
          const moreSubst = smi.indexOf('CC(=O)C') === 0;
          const flip = ctx.int(0, 1) === 1;
          return {
            q: [
              { p: t('Iš šio karbonilo junginio gali susidaryti dviejų rūšių enoliai.', 'This carbonyl compound can form two different enols.') },
              { mol: { smi } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite visus $α$ anglies atomus, turinčius vandenilį, kuris gali atsiskirti.', 'Tap every $α$ carbon that carries a hydrogen that can be lost.'),
                kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: alpha,
                hint: t('$α$ padėtis yra šalia karbonilo anglies.', 'The $α$ position is next to the carbonyl carbon.'),
                solution: t('Du ar daugiau $α$ anglies atomų turi $H$: iš kiekvieno gali susidaryti atskiras enolis.', 'Two or more $α$ carbons carry $H$: a separate enol can form from each.')
              },
              {
                prompt: t('Kurio enolio tirpale bus daugiau?', 'Which enol will be present in the larger concentration?'),
                kind: 'choice',
                options: flip ? [{ mol: { smi: min } }, { mol: { smi: maj } }, { text: t('Abiejų – vienodai.', 'Both equally.') }] : [{ mol: { smi: maj } }, { mol: { smi: min } }, { text: t('Abiejų – vienodai.', 'Both equally.') }],
                answer: flip ? 1 : 0,
                hint: t('Palyginkite, kuriame enolyje $C=C$ ryšys konjuguotas su kita $π$ sistema ar sudaro vandenilinį ryšį.', 'Compare which enol has its $C=C$ bond conjugated with another $π$ system or able to form a hydrogen bond.'),
                solution: [{ p: ring ? t('Vyrauja enolis, kurio $C=C$ konjuguotas su benzeno žiedu.', 'The enol whose $C=C$ is conjugated with the benzene ring dominates.') : t('Vyrauja enolis, kurio $C=C$ konjuguotas su antrąja karbonilgrupe ir kuris sudaro vandenilinį ryšį.', 'The enol whose $C=C$ is conjugated with the second carbonyl group and forms a hydrogen bond dominates.') }, { mol: { smi: maj } }]
              },
              {
                prompt: t('Kuo grindžiamas šis pasirinkimas?', 'What is this choice based on?'),
                kind: 'choice',
                options: [
                  { text: ring ? t('Konjugacija: $C=C$ ryšio $π$ elektronai sąveikauja su benzeno žiedu.', 'Conjugation: the $π$ electrons of the $C=C$ bond interact with the benzene ring.') : t('Konjugacija su $C=O$ ir vandenilinis ryšys tarp $OH$ ir kito karbonilo deguonies.', 'Conjugation with $C=O$ and a hydrogen bond between $OH$ and the oxygen of the other carbonyl group.') },
                  { text: t('Šis enolis turi daugiau $α$ vandenilių.', 'This enol has more $α$ hydrogens.') },
                  { text: t('Kitas enolis sudaro stipresnę rūgštį.', 'The other enol forms a stronger acid.') },
                  { text: t('Šio enolio dvigubasis ryšys labiau pakeistas.', 'This enol has the more substituted double bond.') }
                ].filter((o, i) => i < 3 || !moreSubst),
                answer: 0,
                hint: t('Enolinės formos dalį padidina konjugacija ir vandeniliniai ryšiai.', 'The share of the enol form is raised by conjugation and hydrogen bonds.'),
                solution: dik ? t('Dikarbonilo junginyje enolis dėl konjugacijos ir vandenilinio ryšio gali net vyrauti (2,4-pentandionas: 70–90 %).', 'In a dicarbonyl compound the enol can even dominate through conjugation and a hydrogen bond (pentane-2,4-dione: 70–90 %).') : t('Konjuguota sistema yra stabilesnė, todėl tokio enolio pusiausvyroje daugiau.', 'A conjugated system is more stable, so more of this enol is present at equilibrium.')
              }
            ],
            why: t('Dauguma karbonilo junginių beveik visiškai yra ketoninės formos (acetono > 99,9 %). Enolio dalis padidėja, kai jį stabilizuoja konjugacija arba vandenilinis ryšys; iš dviejų galimų enolių vyrauja konjuguotas.', 'Most carbonyl compounds are almost entirely in the keto form (> 99.9 % for acetone). The enol share grows when conjugation or a hydrogen bond stabilises it; of two possible enols the conjugated one dominates.'),
            src: 'L13 p41, p42, S6.13'
          };
        }
      },

      /* ================= 10. aldol reactions (S6.6), generator ================= */
      {
        id: 'u13.aldol',
        title: t('Aldolinis prisijungimas ir kondensacija', 'Aldol addition and condensation'),
        mirrors: ['S6.6'],
        gen(rng, ctx) {
          const { react, chem } = ctx;
          const ENOL = { 'CC=O': 'C=C[O-]', 'CCC=O': 'CC=C[O-]', 'CCCC=O': 'CCC=C[O-]', 'CCCCC=O': 'CCCC=C[O-]', 'CC(C)CC=O': 'CC(C)C=C[O-]', 'CCCCCC=O': 'CCCCC=C[O-]', 'CC(C)C=O': 'CC(C)=C[O-]', 'CCC(C)C=O': 'CCC(C)=C[O-]', 'O=CCc1ccccc1': '[O-]C=Cc1ccccc1' };
          const smi = ctx.pick(Object.keys(ENOL));
          const enolate = ENOL[smi];
          const base = ctx.pick(['NaOH', 'KOH']);
          const aldol = majors(react.run('co.aldol', [smi]));
          const enal = majors(react.run('co.aldolcond', [smi]));
          if (aldol.length !== 1) throw new Error('u13.aldol: no aldol for ' + smi);
          const WA = { 'CC=O': 'OCCCC=O', 'CCC=O': 'CCC(O)CCC=O', 'CCCC=O': 'CCCC(O)CCCC=O', 'CCCCC=O': 'CCCCC(O)CCCCC=O', 'CCCCCC=O': 'CCCCCC(O)CCCCCC=O', 'CC(C)C=O': 'CC(C)C(O)CC(C)C=O', 'CCC(C)C=O': 'CCC(C)C(O)CCC(C)C=O' };
          const WE = { 'CC=O': 'C=CCC=O', 'CCC=O': 'CC=CC(C)C=O', 'CCCC=O': 'CCC=CC(CC)C=O' };
          const okForm = (x, ref) => (x && ref && sameFormula(ctx, x, ref) ? x : null);
          const wrongAldol = okForm(WA[smi], aldol[0]);
          const wrongEnal = enal.length ? okForm(WE[smi], enal[0]) : null;
          const kind = ctx.pick(['add', 'cond', 'order']);
          const alcohol = majors(react.run('co.nabh4', [smi]))[0];
          const hs = hydrateSmi(smi);
          const anion = hs && hs.endsWith('O') && !hs.endsWith('1') ? hs.slice(0, -1) + '[O-]' : null;
          const enol = enolate.replace('[O-]', 'O');
          const aldolArrow = { arrow: '→', above: t('praskiestas ' + base, 'dilute ' + base) };
          const q0 = { p: t('Aldehidas praskiestame šarme.', 'An aldehyde in dilute alkali.') };
          if (kind === 'order') {
            return {
              q: [q0, { scheme: { items: [{ smi }, { plus: true }, { smi }, aldolArrow] } }],
              steps: [{
                prompt: t('Išdėstykite aldolinio prisijungimo stadijas pagal eilę.', 'Put the stages of the aldol addition in order.'),
                kind: 'order',
                options: [
                  { text: t('Bazė atplėšia $α$-protoną: susidaro enoliato jonas.', 'The base removes an $α$ proton: an enolate ion forms.') },
                  { text: t('Enoliatas atakuoja kitos molekulės karbonilo anglį.', 'The enolate attacks the carbonyl carbon of another molecule.') },
                  { text: t('Alkoksido jonas paima protoną iš vandens: susidaro aldolis.', 'The alkoxide ion takes a proton from water: the aldol forms.') }
                ],
                hint: t('Nukleofilas turi susidaryti, prieš atakuodamas karbonilą.', 'The nucleophile has to form before it can attack the carbonyl group.'),
                solution: [{ p: t('Pavyzdys su propanaliu: pirma enoliatas, paskui ataka, galiausiai protonizacija.', 'Example with propanal: first the enolate, then the attack, finally protonation.') }, { mech: MECH.aldol }]
              },
              {
                prompt: t('Kuris atomas yra nukleofilinis centras enoliate?', 'Which atom is the nucleophilic centre of the enolate?'),
                kind: 'atoms', mol: { smi: enolate, opts: { numbers: 'all' } }, answer: alphaCs(ctx, smi),
                hint: t('Enoliato krūvis pasiskirsto tarp dviejų atomų, bet jungiasi ne deguonis.', 'The charge of an enolate is shared between two atoms, but it is not the oxygen that bonds.'),
                solution: t('Reaguoja $α$ anglis: jos $π$ elektronų pora sudaro naują $C–C$ ryšį su karbonilo anglimi.', 'The $α$ carbon reacts: its $π$ electron pair forms the new $C–C$ bond with the carbonyl carbon.')
              }],
              why: t('Aldolinis prisijungimas turi tris stadijas: enoliato susidarymas, jo ataka prieš kitą karbonilą ir protonizacija. Nukleofilas yra enoliato $α$ anglis.', 'The aldol addition has three stages: formation of the enolate, its attack on another carbonyl group and protonation. The nucleophile is the $α$ carbon of the enolate.'),
              src: 'L13 p43, p46, S6.6'
            };
          }
          const steps = [
            {
              prompt: t('Bakstelėkite anglį, iš kurios bazė atplėšia protoną.', 'Tap the carbon from which the base removes a proton.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: alphaCs(ctx, smi),
              hint: t('Kuris vandenilis judrus dėl karbonilgrupės?', 'Which hydrogen is made mobile by the carbonyl group?'),
              solution: t('$α$ anglis: karbonilgrupė traukia elektronus, todėl $α$-$H$ yra judrus.', 'The $α$ carbon: the carbonyl group withdraws electrons, so the $α$-$H$ is mobile.')
            },
            {
              prompt: t('Kokia dalelė yra nukleofilas?', 'Which species is the nucleophile?'),
              kind: 'choice', options: optList(ctx, [enolate], [enol, anion], 3), answer: 0,
              hint: t('Bazė atplėšia protoną ir lieka neigiamas krūvis, pasiskirstęs per $C=C–O$.', 'The base removes a proton and a negative charge is left, spread over $C=C–O$.'),
              solution: [{ p: t('Enoliato jonas: neigiamas krūvis dalijamas tarp $α$ anglies ir deguonies.', 'The enolate ion: the negative charge is shared between the $α$ carbon and oxygen.') }, { mol: { smi: enolate } }]
            }
          ];
          if (kind === 'add') {
            steps.push({
              prompt: t('Koks yra aldolinio prisijungimo produktas (aldolis)?', 'What is the product of the aldol addition (the aldol)?'),
              kind: 'choice', options: optList(ctx, [aldol[0]], [wrongAldol, enal[0]].filter((x) => x), 3), answer: 0,
              hint: t('Nauja $C–C$ jungtis susidaro tarp $α$ anglies ir kitos molekulės karbonilo anglies. Ar $OH$ lieka?', 'The new $C–C$ bond forms between the $α$ carbon and the carbonyl carbon of the other molecule. Does the $OH$ stay?'),
              solution: [{ p: t('Susidaro 3-hidroksialdehidas: kartu likusi $OH$ ir aldehido grupė, todėl pavadinimas aldolis.', 'A 3-hydroxy aldehyde forms: both the $OH$ and the aldehyde group remain, hence the name aldol.') }, { mol: { smi: aldol[0] } }]
            });
          } else {
            steps.push({
              prompt: t('Kas susidaro aldolį pakaitinus?', 'What forms when the aldol is heated?'),
              kind: 'choice',
              options: enal.length
                ? optList(ctx, [enal[0]], [aldol[0], wrongEnal].filter((x) => x), 3)
                : [{ text: t('Kondensacija neįmanoma: aldolis neturi $α$-H.', 'Condensation is impossible: the aldol has no $α$-H.') }, { mol: { smi: aldol[0] } }, { mol: { smi: alcohol } }],
              answer: 0,
              hint: t('Kondensacijoje išsiskiria $H2O$: reikia $H$ prie $α$ anglies ir $OH$ prie $β$ anglies.', 'In a condensation $H2O$ is lost: it needs an $H$ on the $α$ carbon and the $OH$ on the $β$ carbon.'),
              solution: enal.length
                ? [{ p: t('Aldolis netenka vandens: atskyla $OH$ ir $α$-$H$, susidaro $C=C$ ryšys konjuguotas su $C=O$ ($α,β$-nesotusis aldehidas).', 'The aldol loses water: the $OH$ and the $α$-$H$ leave and a $C=C$ conjugated with $C=O$ forms (an $α,β$-unsaturated aldehyde).') }, { mol: { smi: enal[0] } }]
                : t('Aldolio $α$ anglis neturi vandenilio, todėl vanduo neatskyla: gaunamas tik aldolis.', 'The $α$ carbon of the aldol has no hydrogen, so water cannot be lost: only the aldol is obtained.')
            });
          }
          return {
            q: [q0, { scheme: { items: [{ smi }, { plus: true }, { smi }, kind === 'add' ? aldolArrow : { arrow: '→', above: t('praskiestas ' + base + ', po to $t°$', 'dilute ' + base + ', then $t°$') }] } }],
            steps,
            why: t('Aldehidas su $α$-H praskiestame šarme sudaro enoliatą, kuris atakuoja kitą aldehidą: gaunamas aldolis. Kaitinant aldolis netenka vandens ir virsta konjuguotu nesočiuoju aldehidu, jei $α$ anglis dar turi vandenilį.', 'An aldehyde with $α$-H forms an enolate in dilute alkali, which attacks another aldehyde: the aldol results. On heating the aldol loses water and becomes a conjugated unsaturated aldehyde, provided the $α$ carbon still has a hydrogen.'),
            src: 'L13 p43, p44, p46, S6.6'
          };
        }
      },

      /* ================= 11. crossed aldol condensation (S6.14), generator ================= */
      {
        id: 'u13.cross',
        title: t('Mišri aldolinė kondensacija', 'Crossed aldol condensation'),
        mirrors: ['S6.14'],
        gen(rng, ctx) {
          const { react, chem } = ctx;
          const AS = NOA.filter((s) => s !== 'C=O');
          const BS = ['CC=O', 'CCC=O', 'CCCC=O', 'CC(C)=O', 'CC(=O)c1ccccc1', 'O=C1CCCCC1', 'O=C1CCCC1'];
          let pick = null;
          for (let tries = 0; tries < 60 && !pick; tries++) {
            const A = ctx.pick(AS), B = ctx.pick(BS);
            const prod = majors(react.run('co.aldolcond', [A, B]));
            const add = majors(react.run('co.aldol', [A, B]));
            const selfB = majors(react.run('co.aldolcond', [B]));
            if (prod.length !== 1 || add.length !== 1 || !selfB.length) continue;
            const m = chem.parse(prod[0]);
            const cc = m.bonds.filter((b) => b.order === 2 && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C' && !m.atoms[b.a].aromatic && !m.atoms[b.b].aromatic);
            if (cc.length !== 1) continue;
            pick = { A, B, prod: prod[0], add: add[0], selfB: selfB[0], bond: [cc[0].a, cc[0].b] };
          }
          if (!pick) throw new Error('u13.cross: no usable pair');
          const { A, B, prod, add, selfB, bond } = pick;
          const arrow = { arrow: '→', above: f('HO-'), below: f('t°') };
          if (ctx.int(0, 2) === 0) {
            const other = ctx.pick(BS.filter((s) => s !== B));
            const other2 = ctx.pick(AS.filter((s) => s !== A));
            return {
              q: [
                { p: t('Mišrios aldolinės kondensacijos produktas nubraižytas. Iš kokių junginių jis gautas?', 'The product of a crossed aldol condensation is drawn. From which compounds was it made?') },
                { mol: { smi: prod } }
              ],
              steps: [
                {
                  prompt: t('Bakstelėkite $C=C$ ryšį, kuris susidarė kondensacijoje.', 'Tap the $C=C$ bond that formed in the condensation.'),
                  kind: 'atoms', bonds: true, mol: { smi: prod, opts: { numbers: 'all' } }, answer: [bond],
                  hint: t('Šis ryšys jungia buvusią karbonilo anglį ir $α$ anglį.', 'This bond joins a former carbonyl carbon and an $α$ carbon.'),
                  solution: t('Naujas dvigubasis ryšys atsirado tarp buvusios aldehido karbonilo anglies ir kito junginio $α$ anglies.', 'The new double bond joins the former carbonyl carbon of the aldehyde and the $α$ carbon of the other compound.')
                },
                {
                  prompt: t('Pasirinkite pradinių junginių porą.', 'Choose the pair of starting compounds.'),
                  kind: 'choice', options: (() => { const cs = [[A, B], [A, other], A === 'O=Cc1ccccc1' && B === 'CC=O' ? ['O=CCc1ccccc1', 'C=O'] : [other2, B], [A, BS.find((x) => x !== B && sameFormula(ctx, x, B)) || B], [other2, other], [B, B]]; const seen = new Set(); return cs.filter((c) => { const k = c.join('|'); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4).map((c) => pairScheme(c)); })(), answer: 0,
                  hint: t('Vienas junginys turi neturėti $α$-H, kitas turi.', 'One compound must have no $α$-H, the other must have it.'),
                  solution: [{ p: t('Aldehidas be $α$-H yra elektrofilas, o kitas junginys duoda enoliatą ir jo $α$ anglis sudaro naują ryšį.', 'The aldehyde without $α$-H is the electrophile; the other compound gives the enolate whose $α$ carbon forms the new bond.') }, pairScheme([A, B])]
                }
              ],
              why: t('Atpažinkite nesotųjį karbonilo junginį: dvigubasis ryšys $α,β$ padėtyje rodo, kur sujungti du fragmentai. Viena pusė – aldehidas be $α$-H, kita – enoliato šaltinis.', 'Spot the unsaturated carbonyl compound: the double bond in the $α,β$ position shows where the two fragments were joined. One side comes from an aldehyde without $α$-H, the other from the enolate source.'),
              src: 'L13 p47, S6.14'
            };
          }
          return {
            q: [
              { p: t('Du karbonilo junginiai kaitinami praskiestame šarme.', 'Two carbonyl compounds are heated in dilute alkali.') },
              { scheme: { items: [{ smi: A }, { plus: true }, { smi: B }, arrow] } }
            ],
            steps: [
              {
                prompt: t('Kuris junginys sudaro enoliatą?', 'Which compound forms the enolate?'),
                kind: 'choice', options: [{ mol: { smi: B } }, { mol: { smi: A } }], answer: 0,
                hint: t('Enoliatui reikia $α$ vandenilio.', 'An enolate needs an $α$ hydrogen.'),
                solution: t('Pirmasis junginys neturi $α$-H, todėl gali būti tik elektrofilas; enoliatą sudaro antrasis.', 'The first compound has no $α$-H and can only be the electrophile; the second one forms the enolate.')
              },
              {
                prompt: t('Bakstelėkite anglį (-is), kuri tampa enoliato nukleofiliniu centru.', 'Tap the carbon(s) that become the nucleophilic centre of the enolate.'),
                kind: 'atoms', mol: { smi: B, opts: { numbers: 'all' } }, answer: alphaCs(ctx, B),
                hint: t('Enoliatą sudaro anglis šalia karbonilo.', 'The enolate is formed by a carbon next to the carbonyl group.'),
                solution: t('Bazė atplėšia $α$-protoną; $α$ anglis atakuoja aldehido be $α$-H karbonilo anglį.', 'The base removes an $α$ proton; the $α$ carbon attacks the carbonyl carbon of the aldehyde without $α$-H.')
              },
              {
                prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
                kind: 'choice', options: optList(ctx, [prod], [selfB, add], 3), answer: 0,
                hint: t('Enoliatas atakuoja aldehidą be $α$-H, o kaitinant netenkama vandens.', 'The enolate attacks the aldehyde without $α$-H, and water is lost on heating.'),
                solution: [{ p: t('Susidaro $α,β$-nesotusis karbonilo junginys: naujas $C=C$ yra tarp buvusio aldehido karbonilo ir enoliato $α$ anglies.', 'An $α,β$-unsaturated carbonyl compound forms: the new $C=C$ lies between the former aldehyde carbonyl carbon and the $α$ carbon of the enolate.') }, { mol: { smi: prod } }]
              },
              {
                prompt: t('Kodėl pirmasis junginys nesikondensuoja pats su savimi?', 'Why does the first compound not condense with itself?'),
                kind: 'choice',
                options: [
                  { text: t('Jis neturi $α$ vandenilio, todėl negali sudaryti enoliato.', 'It has no $α$ hydrogen, so it cannot form an enolate.') },
                  { text: t('Jo karbonilo anglis per mažai $δ+$, kad būtų atakuota.', 'Its carbonyl carbon is not $δ+$ enough to be attacked.') },
                  { text: t('Šarmas jo neatakuoja.', 'The alkali does not attack it.') }
                ],
                answer: 0,
                hint: t('Kas reikalinga nukleofilui susidaryti?', 'What is needed for the nucleophile to form?'),
                solution: t('Be $α$-H nėra enoliato, todėl mišinyje gaunamas vienas pagrindinis produktas.', 'Without $α$-H there is no enolate, so the mixture gives one main product.')
              }
            ],
            why: t('Mišri aldolinė reakcija selektyvi, kai vienas partneris neturi $α$-H: jis yra tik elektrofilas, o kitas – tik nukleofilo šaltinis.', 'A crossed aldol reaction is selective when one partner has no $α$-H: it is only the electrophile and the other is only the source of the nucleophile.'),
            src: 'L13 p47, S6.14'
          };
        }
      },

      /* ================= 12. cyclic hemiacetals (lecture), generator ================= */
      {
        id: 'u13.ring',
        title: t('Ciklinis hemiacetalis', 'Cyclic hemiacetals'),
        mirrors: [],
        gen(rng, ctx) {
          const { react, chem } = ctx;
          const POOL = [];
          ['', 'C', 'CC'].forEach((pre) => [2, 3, 4, 5, 6].forEach((n) => ['', 'C', 'CC', 'CCC'].forEach((r) => POOL.push((pre ? pre + 'C(O)' : 'O') + 'C'.repeat(n - 1) + 'C(=O)' + r))));
          const smi = ctx.pick(POOL);
          const res = react.run('co.hemiacetal', [smi]);
          const cyc = !res.none ? majors(res) : [];
          const m = chem.parse(smi);
          const alc = chem.groups(m).find((g) => g.type === 'alcohol');
          const hs = hydrateSmi(smi);
          const size = cyc.length === 1 ? (() => { const rm = chem.parse(cyc[0]); return Math.min(...chem.rings(rm).map((r) => r.length)); })() : 0;
          const isAld = chem.groups(m).some((g) => g.type === 'aldehyde');
          // atoms on the shortest path from the hydroxy oxygen to the carbonyl carbon = ring size
          const cc = carbonylC(ctx, smi);
          const dist = { [alc.atoms[1]]: 1 };
          const queue = [alc.atoms[1]];
          while (queue.length) { const x = queue.shift(); m.nbr[x].forEach((y) => { if (!(y in dist)) { dist[y] = dist[x] + 1; queue.push(y); } }); }
          const n = dist[cc];
          if (cyc.length === 1 && ctx.int(0, 2) === 0) {
            // the exam question the other way round (L13 p22): from the cyclic hemiacetal to the open-chain compound
            const others = ctx.shuffle(POOL.filter((x) => x !== smi && sameFormula(ctx, x, smi))).slice(0, 2);
            if (others.length) {
              return {
                q: [{ p: t('Hidroksikarbonilo junginys rūgštyje virsta šiuo cikliniu hemiacetaliu.', 'A hydroxy carbonyl compound turns into this cyclic hemiacetal in acid.') }, { mol: { smi: cyc[0] } }],
                steps: [{
                  prompt: t('Koks buvo atviros grandinės junginys?', 'What was the open-chain compound?'),
                  kind: 'choice', options: [{ mol: { smi } }].concat(others.map((x) => ({ mol: { smi: x } }))), answer: 0,
                  hint: t('Nutraukite $C–O$ ryšį žiede prie anglies, turinčios $OH$ ir $OR$.', 'Break the ring $C–O$ bond at the carbon that carries $OH$ and $OR$.'),
                  solution: [{ p: t('Hemiacetalio anglis vėl tampa karbonilo anglimi, o žiedo deguonis – hidroksigrupe.', 'The hemiacetal carbon becomes the carbonyl carbon again and the ring oxygen becomes a hydroxy group.') }, { mol: { smi } }]
                }],
                why: t('Ciklinis hemiacetalis ir hidroksikarbonilo junginys yra ta pati pusiausvyra.', 'A cyclic hemiacetal and the hydroxy carbonyl compound are one equilibrium.'),
                src: 'L13 p20, p22'
              };
            }
          }
          const steps = [
            {
              prompt: t('Kiek atomų (kartu su deguonimi) turėtų ciklas, jei hidroksigrupė atakuotų karbonilo anglį?', 'How many atoms (the oxygen included) would the ring have if the hydroxy group attacked the carbonyl carbon?'),
              kind: 'number', answer: { value: n, tol: 0 },
              hint: t('Suskaičiuokite atomus nuo hidroksigrupės deguonies iki karbonilo anglies (imtinai).', 'Count the atoms from the hydroxy oxygen to the carbonyl carbon (inclusive).'),
              solution: t('Į ciklą įeina deguonis ir anglys iki karbonilo anglies: ' + n + ' atomai.', 'The ring would contain the oxygen and the carbons up to the carbonyl carbon: ' + n + ' atoms.')
            },
            {
              prompt: t('Koks ciklas susidaro?', 'What ring forms?'),
              kind: 'choice',
              options: [
                { text: t('Penkių narių ciklas.', 'A five-membered ring.') },
                { text: t('Šešių narių ciklas.', 'A six-membered ring.') },
                { text: t('Ciklas nesusidaro: jis būtų per mažas ar per didelis.', 'No ring forms: it would be too small or too large.') }
              ],
              answer: n === 5 ? 0 : n === 6 ? 1 : 2,
              hint: t('Kokių dydžių ciklai yra patvarūs?', 'Which ring sizes are stable?'),
              solution: size ? t('Į ciklą įeina deguonis ir anglys iki karbonilo anglies: ' + size + ' nariai. Penkių ir šešių narių ciklai patvarūs.', 'The ring contains the oxygen and the carbons up to the carbonyl carbon: ' + size + ' members. Five- and six-membered rings are stable.') : t('Ciklas būtų ne penkių ar šešių narių, todėl jis nepatvarus ir junginys lieka atviros grandinės.', 'The ring would not have five or six members, so it is not stable and the compound stays open-chain.')
            }
          ];
          if (cyc.length === 1 && hs) {
            steps.push({
              prompt: isAld ? t('Koks yra patvarus produktas?', 'What is the stable product?') : t('Kokia ciklinė forma susidaro rūgštyje (pusiausvyroje)?', 'Which cyclic form arises in acid (at equilibrium)?'),
              kind: 'choice', options: optList(ctx, [cyc[0]], [hs, smi], 3), answer: 0,
              hint: t('Hemiacetalyje prie vienos anglies yra $OH$ ir $OR$; šiuo atveju $OR$ yra to paties žiedo dalis.', 'A hemiacetal carbon carries $OH$ and $OR$; here the $OR$ is part of the same ring.'),
              solution: [{ p: t('Susidaro ciklinis hemiacetalis: žiedo deguonis jungiasi prie buvusios karbonilo anglies, kuri dabar turi ir $OH$.', 'A cyclic hemiacetal forms: the ring oxygen bonds to the former carbonyl carbon, which now also carries an $OH$.') }, { mol: { smi: cyc[0] } }]
            });
          }
          return {
            q: [
              { p: t('Molekulėje yra hidroksi- ir karbonilgrupė.', 'The molecule contains a hydroxy and a carbonyl group.') },
              { scheme: { items: [{ smi }, { arrow: '⇌', above: f('H+') }] } }
            ],
            steps,
            why: t('Intramolekulinė AN reakcija duoda ciklinį hemiacetalį, jei susidaro penkių ar šešių narių žiedas. Tokie hemiacetaliai patvarūs, kaip ir gliukozės piranozės forma.', 'An intramolecular AN reaction gives a cyclic hemiacetal if a five- or six-membered ring forms. Such hemiacetals are stable, like the pyranose form of glucose.'),
            src: 'L13 p20, p21'
          };
        }
      },

      /* ================= 13. several functional groups (S6.12), bank ================= */
      {
        id: 'u13.multi',
        title: t('Molekulės su keliomis grupėmis: karvonas ir kt.', 'Molecules with several groups: carvone and others'),
        mirrors: ['S6.12'],
        bank: [
          {
            id: 'u13.multi.1',
            q: [
              { p: t('Karvonas reaguoja su $H2$ ant $Pd$ (stereochemija nerodoma).', 'Carvone reacts with $H2$ over $Pd$ (stereochemistry not shown).') },
              { scheme: { items: [{ smi: 'CC1=CCC(CC1=O)C(C)=C' }, { arrow: '→', above: f('H2, Pd') }] } }
            ],
            steps: [{
              prompt: t('Koks produktas?', 'What is the product?'),
              kind: 'choice',
              options: [{ mol: { smi: 'CC(C)C1CCC(C)C(=O)C1' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(O)C1' } }, { mol: { smi: 'CC(C)C1CCC(C)C(O)C1' } }, { mol: { smi: 'CC(=C)C1CCC(C)C(=O)C1' } }],
              answer: 0,
              hint: t('Kurią iš grupių redukuoja $H2$ ant $Pd$: $C=C$ ar $C=O$? Kiek $C=C$ yra molekulėje?', 'Which group does $H2$ over $Pd$ reduce: $C=C$ or $C=O$? How many $C=C$ bonds are in the molecule?'),
              solution: [{ p: t('Abu $C=C$ ryšiai (žiede ir izopropenile) hidrinami, karbonilas lieka.', 'Both $C=C$ bonds (in the ring and in the isopropenyl group) are hydrogenated and the carbonyl stays.') }, { mol: { smi: 'CC(C)C1CCC(C)C(=O)C1' } }]
            }],
            why: t('Reagentas pasirenka grupę: $H2$/$Pd$ jungiasi prie $C=C$, hidridai – prie $C=O$.', 'The reagent chooses the group: $H2$/$Pd$ adds to $C=C$, hydrides add to $C=O$.'),
            src: 'S6.12',
            claims: [{ react: ['ae.h2', ['CC1=CCC(CC1=O)C(C)=C'], null, 'CC(C)C1CCC(C)C(=O)C1'] }]
          },
          {
            id: 'u13.multi.2',
            q: [
              { p: t('Karvonas reaguoja su metilaminu.', 'Carvone reacts with methylamine.') },
              { scheme: { items: [{ smi: 'CC1=CCC(CC1=O)C(C)=C' }, { plus: true }, { smi: 'CN', name: t('metanaminas', 'methylamine') }, { arrow: '→' }] } }
            ],
            steps: [{
              prompt: t('Koks galutinis produktas?', 'What is the final product?'),
              kind: 'choice',
              options: [{ mol: { smi: 'CC(=C)C1CC=C(C)C(=NC)C1' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(O)(NC)C1' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(NC)C1' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(=NO)C1' } }],
              answer: 0,
              hint: t('Pirminis aminas su karbonilu: AN ir paskui eliminavimas. Ar lieka $OH$?', 'A primary amine with a carbonyl compound: AN followed by elimination. Does an $OH$ remain?'),
              solution: [{ p: t('Azotas atakuoja karbonilo anglį, susidaro karbinolaminas, atskyla vanduo: gaunamas iminas. $C=C$ ryšiai nesikeičia.', 'Nitrogen attacks the carbonyl carbon, a carbinolamine forms and loses water: an imine results. The $C=C$ bonds do not change.') }, { mol: { smi: 'CC(=C)C1CC=C(C)C(=NC)C1' } }]
            }],
            why: t('Pirminis aminas reaguoja su $C=O$ ir sudaro $C=N$; alkenai čia nedalyvauja.', 'A primary amine reacts with $C=O$ and forms $C=N$; the alkenes are not involved.'),
            src: 'S6.12, L13 p25',
            claims: [{ formula: ['CC(=C)C1CC=C(C)C(=NC)C1', 'C11H17N'] }]
          },
          {
            id: 'u13.multi.3',
            q: [
              { p: t('Karvonas redukuojamas.', 'Carvone is reduced.') },
              { scheme: { items: [{ smi: 'CC1=CCC(CC1=O)C(C)=C' }, { arrow: '→', above: f('1) LiAlH4'), below: f('2) H3O+') }] } }
            ],
            steps: [{
              prompt: t('Koks produktas?', 'What is the product?'),
              kind: 'choice',
              options: [{ mol: { smi: 'CC(=C)C1CC=C(C)C(O)C1' } }, { mol: { smi: 'CC(C)C1CCC(C)C(O)C1' } }, { mol: { smi: 'CC(C)C1CCC(C)C(=O)C1' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(=O)C1' } }],
              answer: 0,
              hint: t('Hidridas yra nukleofilas: ką jis atakuoja?', 'Hydride is a nucleophile: what does it attack?'),
              solution: [{ p: t('$H−$ atakuoja tik $δ+$ karbonilo anglį; izoliuoti ir konjuguoti $C=C$ lieka. Susidaro antrinis alkoholis.', '$H−$ attacks only the $δ+$ carbonyl carbon; the $C=C$ bonds stay. A secondary alcohol forms.') }, { mol: { smi: 'CC(=C)C1CC=C(C)C(O)C1' } }]
            }],
            why: t('Metalų hidridai redukuoja $C=O$, bet ne $C=C$.', 'Metal hydrides reduce $C=O$ but not $C=C$.'),
            src: 'S6.12, L13 p9',
            // LiAlH4 gives the same product as NaBH4 here, so the co.nabh4 rule proves it
            claims: [{ react: ['co.nabh4', ['CC1=CCC(CC1=O)C(C)=C'], null, 'CC(=C)C1CC=C(C)C(O)C1'] }]
          },
          {
            id: 'u13.multi.4',
            q: [
              { p: t('Karvonas reaguoja su 1,2-etandioliu rūgštyje.', 'Carvone reacts with ethane-1,2-diol in acid.') },
              { scheme: { items: [{ smi: 'CC1=CCC(CC1=O)C(C)=C' }, { plus: true }, { smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }, { arrow: '→', above: f('H+') }] } }
            ],
            steps: [{
              prompt: t('Koks produktas?', 'What is the product?'),
              kind: 'choice',
              options: [{ mol: { smi: 'CC(=C)C1CC=C(C)C2(C1)OCCO2' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(O)(OCCO)C1' } }, { mol: { smi: 'CC(=C)C1CC=C(C)C(O)C1' } }],
              answer: 0,
              hint: t('Diolio abi $OH$ grupės jungiasi prie vienos anglies.', 'Both $OH$ groups of the diol bond to one carbon.'),
              solution: [{ p: t('Karbonilas virsta cikliniu acetaliu (ketaliu); alkenai nesikeičia.', 'The carbonyl becomes a cyclic acetal (ketal); the alkenes do not change.') }, { mol: { smi: 'CC(=C)C1CC=C(C)C2(C1)OCCO2' } }]
            }],
            why: t('Rūgštyje alkoholiai ir dioliai reaguoja su $C=O$; alkenai tokiomis sąlygomis nereaguoja.', 'In acid alcohols and diols react with $C=O$; alkenes do not react under these conditions.'),
            src: 'S6.12, L13 p18',
            claims: [{ react: ['co.acetal', ['CC1=CCC(CC1=O)C(C)=C', 'OCCO'], null, 'CC(=C)C1CC=C(C)C2(C1)OCCO2'] }]
          },
          {
            id: 'u13.multi.5',
            q: [
              { p: t('Iš etil-4-oksopentanoato (junginio su esterio ir ketono grupėmis) norima gauti 5-hidroksi-2-pentanoną. Vien $LiAlH4$ redukuotų abi grupes.', 'You need 5-hydroxypentan-2-one from ethyl 4-oxopentanoate. $LiAlH4$ alone would reduce both groups.') },
              { mol: { smi: 'CC(=O)CCC(=O)OCC', name: t('etil-4-oksopentanoatas', 'ethyl 4-oxopentanoate') } }
            ],
            steps: [{
              prompt: t('Išdėstykite veiksmus.', 'Order the steps.'),
              kind: 'order',
              options: [
                { text: t('Ketonas apsaugomas acetaliu ($HOCH2CH2OH$, $H+$).', 'The ketone is protected as an acetal ($HOCH2CH2OH$, $H+$).') },
                { text: t('Esteris redukuojamas ($LiAlH4$, po to $H2O$).', 'The ester is reduced ($LiAlH4$, then $H2O$).') },
                { text: t('Acetalis pašalinamas ($H3O+$).', 'The acetal is removed ($H3O+$).') }
              ],
              hint: t('Pirmiausia reikia uždengti tai, ko nenorite redukuoti.', 'First cover what you do not want to reduce.'),
              solution: [{ p: t('Apsauga, redukcija, atapsauga.', 'Protect, reduce, deprotect.') }, { scheme: { items: [{ smi: 'CC(=O)CCC(=O)OCC' }, { arrow: '→', above: t('$HOCH2CH2OH$, $H+$', '$HOCH2CH2OH$, $H+$') }, { smi: 'CC1(CCC(=O)OCC)OCCO1' }] } }, { scheme: { items: [{ smi: 'CC1(CCC(=O)OCC)OCCO1' }, { arrow: '→', above: t('1) $LiAlH4$  2) $H2O$', '1) $LiAlH4$  2) $H2O$') }, { smi: 'CC1(CCCO)OCCO1' }, { arrow: '→', above: t('$H3O+$', '$H3O+$') }, { smi: 'CC(=O)CCCO' }] } }]
            }],
            why: t('Kai dvi grupės reaguoja su tuo pačiu reagentu, vieną apsaugokite. Acetalis tinka ketonui, nes patvarus hidridams.', 'When two groups react with the same reagent, protect one. An acetal suits a ketone because it is stable to hydrides.'),
            src: 'L13 p19',
            claims: [{ react: ['co.acetal', ['CC(=O)CCC(=O)OCC', 'OCCO'], null, 'CC1(CCC(=O)OCC)OCCO1'] }]
          },
          {
            id: 'u13.multi.6',
            q: [
              { p: t('Cinamono aldehidas redukuojamas $NaBH4$.', 'Cinnamaldehyde is reduced with $NaBH4$.') },
              { scheme: { items: [{ smi: 'O=CC=Cc1ccccc1', name: t('3-fenilpropenalis', '3-phenylprop-2-enal') }, { arrow: '→', above: f('NaBH4') }] } }
            ],
            steps: [{
              prompt: t('Koks produktas?', 'What is the product?'),
              kind: 'choice',
              options: [{ mol: { smi: 'OCC=Cc1ccccc1' } }, { mol: { smi: 'OCCCc1ccccc1' } }, { mol: { smi: 'O=CCCc1ccccc1' } }, { mol: { smi: 'OC(=O)C=Cc1ccccc1' } }],
              answer: 0,
              hint: t('Kurią grupę redukuoja $NaBH4$?', 'Which group does $NaBH4$ reduce?'),
              solution: [{ p: t('Redukuojamas tik aldehidas, $C=C$ lieka.', 'Only the aldehyde is reduced; the $C=C$ stays.') }, { mol: { smi: 'OCC=Cc1ccccc1' } }]
            }],
            why: t('$NaBH4$ atakuoja karbonilo anglį, o ne $C=C$.', '$NaBH4$ attacks the carbonyl carbon, not the $C=C$.'),
            src: 'L13 p9',
            claims: [{ react: ['co.nabh4', ['O=CC=Cc1ccccc1'], null, 'OCC=Cc1ccccc1'] }]
          },
          {
            id: 'u13.multi.7',
            q: [
              { p: t('4-oksopentanalis turi aldehido ir ketono grupę. Reaguoja su vienu ekvivalentu 1,2-etandiolio rūgštyje.', '4-oxopentanal has an aldehyde and a ketone group. It reacts with one equivalent of ethane-1,2-diol in acid.') },
              { mol: { smi: 'O=CCCC(C)=O', name: t('4-oksopentanalis', '4-oxopentanal') } }
            ],
            steps: [
              {
                prompt: t('Kuri grupė apsaugoma?', 'Which group is protected?'),
                kind: 'choice',
                options: [{ mol: { smi: 'CC(=O)CCC1OCCO1' } }, { mol: { smi: 'CC1(CCC=O)OCCO1' } }, { mol: { smi: 'CC1(CCC2OCCO2)OCCO1' } }],
                answer: 0,
                hint: t('Aldehidas ar ketonas reaktingesnis AN reakcijose?', 'Which is more reactive in AN reactions, the aldehyde or the ketone?'),
                solution: t('Aldehidas reaktingesnis, todėl su vienu ekvivalentu apsaugoma jo grupė.', 'The aldehyde is more reactive, so with one equivalent its group is protected.')
              },
              {
                prompt: t('Kaip dabar redukuoti tik ketoną?', 'How can only the ketone now be reduced?'),
                kind: 'order',
                options: [
                  { text: t('Aldehidas apsaugomas acetaliu.', 'The aldehyde is protected as an acetal.') },
                  { text: t('Ketonas redukuojamas $NaBH4$.', 'The ketone is reduced with $NaBH4$.') },
                  { text: t('Acetalis hidrolizuojamas $H3O+$.', 'The acetal is hydrolysed with $H3O+$.') }
                ],
                hint: t('Kurią grupę reikia uždengti prieš $NaBH4$ ir kada dangtelį reikia nuimti?', 'Which group must be covered before $NaBH4$, and when is the cover removed?'),
                solution: t('Gaunamas 4-hidroksipentanalis; tirpale jis daugiausia egzistuoja kaip penkianaris ciklinis hemiacetalis.', 'This gives 4-hydroxypentanal, which in solution exists mostly as its five-membered cyclic hemiacetal.')
              }
            ],
            why: t('Aldehido reaktingumas didesnis, todėl jį galima apsaugoti pirmą, o ketoną modifikuoti.', 'The aldehyde is more reactive, so it can be protected first while the ketone is modified.'),
            src: 'L13 p6, p18',
            claims: [{ react: ['co.acetal', ['CC(=O)CCC=O', 'OCCO'], null, 'CC(=O)CCC1OCCO1'] }]
          },
          {
            id: 'u13.multi.8',
            q: [
              { p: t('Vanilinas veikiamas $NaBH4$.', 'Vanillin is treated with $NaBH4$.') },
              { scheme: { items: [{ smi: 'COc1cc(C=O)ccc1O', name: t('4-hidroksi-3-metoksibenzenkarbaldehidas', '4-hydroxy-3-methoxybenzaldehyde') }, { arrow: '→', above: f('NaBH4') }] } }
            ],
            steps: [{
              prompt: t('Koks produktas?', 'What is the product?'),
              kind: 'choice',
              options: [{ mol: { smi: 'COc1cc(CO)ccc1O' } }, { mol: { smi: 'COc1cc(C(=O)O)ccc1O' } }, { mol: { smi: 'COC1CC(CO)CCC1O' } }, { mol: { smi: 'COc1cc(C)ccc1O' } }],
              answer: 0,
              hint: t('Kuri grupė šioje molekulėje yra $δ+$ elektrofilas?', 'Which group in this molecule is the $δ+$ electrophile?'),
              solution: [{ p: t('Redukuojama tik aldehidogrupė. Fenolio $OH$, eteris ir benzeno žiedas nesikeičia.', 'Only the aldehyde group is reduced. The phenolic $OH$, the ether and the benzene ring do not change.') }, { mol: { smi: 'COc1cc(CO)ccc1O' } }]
            }],
            why: t('$NaBH4$ veikia tik aldehido ir ketono karbonilą.', '$NaBH4$ acts only on the carbonyl group of aldehydes and ketones.'),
            src: 'L13 p9, p3',
            claims: [{ react: ['co.nabh4', ['COc1cc(C=O)ccc1O'], null, 'COc1cc(CO)ccc1O'] }]
          }
        ]
      },

      /* ================= 14. mechanisms (S6.6 and lecture), bank ================= */
      {
        id: 'u13.mech',
        title: t('Mechanizmų stadijos', 'Stages of the mechanisms'),
        mirrors: ['S6.6'],
        bank: [
          {
            id: 'u13.mech.1',
            q: [{ p: t('$NaBH4$ redukuoja ketoną į alkoholį.', '$NaBH4$ reduces a ketone to an alcohol.') }, { scheme: { items: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { arrow: '→', above: f('NaBH4') }, { smi: 'CC(C)O' }] } }],
            steps: [
              {
                prompt: t('Išdėstykite stadijas.', 'Order the stages.'), kind: 'order',
                options: [{ text: t('Hidrido jonas atakuoja karbonilo anglį.', 'The hydride ion attacks the carbonyl carbon.') }, { text: t('Susidaro alkoksido jonas.', 'An alkoxide ion forms.') }, { text: t('Alkoksidas paima protoną iš vandens.', 'The alkoxide takes a proton from water.') }],
                hint: t('Kuri dalelė pirmiausia turi sudaryti naują ryšį su anglimi?', 'Which species must first form a new bond to the carbon?'),
                solution: [{ mech: MECH.hydride }]
              },
              {
                prompt: t('Kuri dalelė yra nukleofilas?', 'Which species is the nucleophile?'), kind: 'choice',
                options: [{ text: t('Hidrido jonas $H−$', 'The hydride ion $H−$') }, { text: t('Boro atomas', 'The boron atom') }, { text: t('Natrio katijonas', 'The sodium cation') }, { text: t('Vanduo', 'Water') }],
                answer: 0,
                hint: t('Nukleofilas atiduoda elektronų porą.', 'A nucleophile donates an electron pair.'),
                solution: t('$BH4−$ atiduoda hidrido joną su elektronų pora.', '$BH4−$ donates a hydride ion with its electron pair.')
              }
            ],
            why: t('Dviejų stadijų AN: nukleofilinė ataka ir protonizacija.', 'A two-stage AN: nucleophilic attack and protonation.'), src: 'L13 p10'
          },
          {
            id: 'u13.mech.2',
            q: [{ p: t('Propanalis rūgštyje reaguoja su metanoliu iki acetalio.', 'Propanal reacts with methanol in acid to give the acetal.') }, { scheme: { items: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { plus: true }, { smi: 'CO', name: t('metanolis', 'methanol') }, { arrow: '→', above: f('H+') }] } }],
            steps: [{
              prompt: t('Išdėstykite stadijas nuo karbonilo iki acetalio.', 'Order the stages from the carbonyl compound to the acetal.'), kind: 'order',
              options: [{ text: t('Karbonilo deguonis protonizuojamas.', 'The carbonyl oxygen is protonated.') }, { text: t('Metanolis atakuoja anglį: susidaro hemiacetalis.', 'Methanol attacks the carbon: the hemiacetal forms.') }, { text: t('Hidroksigrupė protonizuojama ir išeina kaip vanduo.', 'The hydroxy group is protonated and leaves as water.') }, { text: t('Antra metanolio molekulė prisijungia: susidaro acetalis.', 'A second methanol molecule adds: the acetal forms.') }],
              hint: t('Pirma hemiacetalis, po to jis aktyvinamas.', 'First the hemiacetal, then it is activated.'),
              solution: [{ mech: MECH.hemi }, { mech: MECH.acetal }]
            }],
            why: t('Du etapai: pirmasis (AN) duoda hemiacetalį, antrasis – nukleofilinis pakeitimas per katijoną – acetalį.', 'Two stages: the first (AN) gives the hemiacetal, the second, a nucleophilic substitution through a cation, gives the acetal.'), src: 'L13 p16'
          },
          {
            id: 'u13.mech.3',
            q: [{ p: t('Cianido jonas reaguoja su acetonu.', 'Cyanide ion reacts with acetone.') }, { scheme: { items: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { plus: true }, { smi: '[C-]#N' }, { arrow: '→' }] } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomą, kurį atakuoja cianidas.', 'Tap the atom that cyanide attacks.'), kind: 'atoms', mol: { smi: 'CC(C)=O', opts: { numbers: 'all' } }, answer: [1],
                hint: t('Kuris atomas yra $δ+$?', 'Which atom is $δ+$?'), solution: t('Atomas Nr. 2 yra karbonilo anglis.', 'Atom no. 2 is the carbonyl carbon.')
              },
              {
                prompt: t('Kas atsitinka su $π$ ryšio elektronais?', 'What happens to the $π$ electrons?'), kind: 'choice',
                options: [{ text: t('Pereina deguoniui: susidaro alkoksidas.', 'They move to oxygen: an alkoxide forms.') }, { text: t('Pereina cianidui.', 'They move to cyanide.') }, { text: t('Lieka tarp $C$ ir $O$.', 'They stay between $C$ and $O$.') }],
                answer: 0, hint: t('Elektronai juda link elektroneigiamesnio atomo.', 'Electrons move towards the more electronegative atom.'),
                solution: [{ mech: MECH.base }]
              }
            ],
            why: t('Stiprus nukleofilas atakuoja neutralų karbonilą, o $π$ elektronai pereina deguoniui.', 'A strong nucleophile attacks the neutral carbonyl and the $π$ electrons move to oxygen.'), src: 'L13 p8'
          },
          {
            id: 'u13.mech.4',
            q: [{ p: t('Propanalis praskiestame $NaOH$ sudaro aldolį.', 'Propanal gives the aldol in dilute $NaOH$.') }, { scheme: { items: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { plus: true }, { smi: 'CCC=O', name: t('propanalis', 'propanal') }, { arrow: '→', above: f('HO-') }, { smi: 'CCC(O)C(C)C=O', name: t('3-hidroksi-2-metilpentanalis', '3-hydroxy-2-methylpentanal') }] } }],
            steps: [{
              prompt: t('Išdėstykite stadijas.', 'Order the stages.'), kind: 'order',
              options: [{ text: t('Bazė atplėšia $α$-protoną.', 'The base removes an $α$ proton.') }, { text: t('Enoliatas atakuoja kito aldehido karbonilą.', 'The enolate attacks the carbonyl of another aldehyde.') }, { text: t('Alkoksidas protonuojamas vandeniu.', 'The alkoxide is protonated by water.') }],
              hint: t('Pirma susidaro nukleofilas.', 'The nucleophile forms first.'), solution: [{ mech: MECH.aldol }]
            }],
            why: t('Aldolinis prisijungimas: enoliatas yra nukleofilas, kitas aldehidas – elektrofilas.', 'Aldol addition: the enolate is the nucleophile and the other aldehyde the electrophile.'), src: 'L13 p43, p46'
          },
          {
            id: 'u13.mech.5',
            q: [{ p: t('Aldolis kaitinamas bazėje ir netenka vandens.', 'The aldol is heated in base and loses water.') }, { scheme: { items: [{ smi: 'CC(O)CC=O', name: t('3-hidroksibutanalis', '3-hydroxybutanal') }, { arrow: '→', above: f('HO-, t°') }, { smi: 'CC=CC=O', name: t('2-butenalis', 'but-2-enal') }] } }],
            steps: [
              {
                prompt: t('Išdėstykite stadijas.', 'Order the stages.'), kind: 'order',
                options: [{ text: t('Bazė atplėšia $α$-protoną: susidaro enoliatas.', 'The base removes the $α$ proton: an enolate forms.') }, { text: t('Enoliato elektronai išstumia hidroksido joną ir susidaro $C=C$.', 'The electrons of the enolate push out hydroxide and a $C=C$ forms.') }, { text: t('Gaunamas $α,β$-nesotusis aldehidas.', 'The $α,β$-unsaturated aldehyde results.') }],
                hint: t('Hidroksidas negali išeiti, kol nėra elektronų, kurie jį išstumtų.', 'Hydroxide cannot leave until electrons are available to push it out.'), solution: [{ mech: MECH.cond }]
              },
              {
                prompt: t('Kuris aprašymas teisingas?', 'Which description is correct?'), kind: 'choice',
                options: [
                  { text: t('Pirmiausia susidaro enoliatas, o jo elektronai išstumia $OH−$ (dvi stadijos, E1cB).', 'First the enolate forms, and its electrons push out $OH−$ (two stages, E1cB).') },
                  { text: t('Pirmiausia atskyla $OH−$ ir susidaro karbokatijonas.', 'First $OH−$ leaves and a carbocation forms.') },
                  { text: t('Hidroksidas atakuoja $β$ anglį ir ją pakeičia.', 'Hydroxide attacks the $β$ carbon and replaces the group.') },
                  { text: t('Bazė atplėšia $β$-protoną.', 'The base removes the $β$ proton.') }
                ],
                answer: 0, hint: t('Kuris protonas judrus ir ką jis palieka?', 'Which proton is mobile and what does it leave behind?'),
                solution: t('Bazė atplėšia $α$-protoną, ir enoliato $π$ elektronai išstumia $OH−$ (E1cB). Karbokatijonas čia nesusidaro, nes būtų nestabilus.', 'The base removes the $α$ proton and the $π$ electrons of the enolate expel $OH−$ (E1cB). No carbocation forms because it would be unstable.')
              },
              {
                prompt: t('Kodėl bazė gali atplėšti protoną nuo aldolio $α$ anglies?', 'Why can the base remove a proton from the $α$ carbon of the aldol?'), kind: 'choice',
                options: [{ text: t('Susidaro rezonansu stabilizuotas enoliatas.', 'A resonance-stabilised enolate forms.') }, { text: t('$α$ anglis turi dalinį neigiamą krūvį.', 'The $α$ carbon has a partial negative charge.') }, { text: t('Aldolis yra stipri rūgštis.', 'The aldol is a strong acid.') }],
                answer: 0, hint: t('Ką daro $C=O$ su gretimu anijonu?', 'What does $C=O$ do to a neighbouring anion?'),
                solution: t('Karbonilas delokalizuoja neigiamą krūvį į deguonį, todėl $α$-$H$ judrus.', 'The carbonyl delocalises the negative charge onto oxygen, so the $α$-$H$ is mobile.')
              }
            ],
            why: t('Aldolinėje kondensacijoje antroji dalis yra enoliato susidarymas ir hidroksido išstūmimas.', 'In the aldol condensation the second part is formation of an enolate and expulsion of hydroxide.'), src: 'L13 p46'
          },
          {
            id: 'u13.mech.6',
            q: [{ p: t('Metanalis koncentruotame $NaOH$.', 'Methanal in concentrated $NaOH$.') }, { scheme: { items: [{ smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } }, { plus: true }, { smi: 'C=O', name: t('metanalis', 'methanal'), opts: { allH: true } }, { arrow: '→', above: t('konc. $NaOH$', 'conc. $NaOH$') }] } }],
            steps: [
              {
                prompt: t('Išdėstykite stadijas.', 'Order the stages.'), kind: 'order',
                options: [{ text: t('Hidroksidas prisijungia prie karbonilo.', 'Hydroxide adds to the carbonyl group.') }, { text: t('Hidrido jonas pereina prie kitos molekulės.', 'A hydride ion moves to another molecule.') }, { text: t('Rūgštis atiduoda protoną alkoksidui.', 'The acid gives a proton to the alkoxide.') }],
                hint: t('Pirmiausia susidaro hidrido donoras.', 'The hydride donor forms first.'), solution: [{ mech: MECH.cann }]
              },
              {
                prompt: t('Kas nuo ko perduodama antroje stadijoje?', 'What is transferred, and from what, in the second stage?'), kind: 'choice',
                options: [{ text: t('Hidridas iš tetraedrinio anijono prie kitos aldehido molekulės.', 'A hydride from the tetrahedral anion to another aldehyde molecule.') }, { text: t('Protonas iš vandens.', 'A proton from water.') }, { text: t('Hidroksidas iš vienos molekulės į kitą.', 'Hydroxide from one molecule to another.') }],
                answer: 0, hint: t('Viena molekulė oksiduojasi, kita redukuojasi.', 'One molecule is oxidised and the other reduced.'),
                solution: t('Hidridas atiduodamas ir redukuoja antrą aldehidą, o donoras tampa rūgštimi.', 'The hydride is given up and reduces the second aldehyde while the donor becomes the acid.')
              }
            ],
            why: t('Hidrido pernaša daro Kanicaro reakciją dismutacija.', 'The hydride transfer makes the Cannizzaro reaction a disproportionation.'), src: 'L13 p34'
          },
          {
            id: 'u13.mech.7',
            q: [{ p: t('Acetonas rūgštyje reaguoja su metilaminu.', 'Acetone reacts with methylamine in acid.') }, { scheme: { items: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { plus: true }, { smi: 'CN', name: t('metanaminas', 'methylamine') }, { arrow: '→', above: f('H+') }, { smi: 'CC(C)=NC' }] } }],
            steps: [{
              prompt: t('Išdėstykite pagrindines stadijas.', 'Order the main stages.'), kind: 'order',
              options: [{ text: t('Azotas atakuoja karbonilo anglį.', 'Nitrogen attacks the carbonyl carbon.') }, { text: t('Susidaro karbinolaminas.', 'The carbinolamine forms.') }, { text: t('Hidroksigrupė protonizuojama ir atskyla vanduo.', 'The hydroxy group is protonated and water leaves.') }, { text: t('Protonas atsiskiria: susidaro iminas.', 'A proton is lost: the imine forms.') }],
              hint: t('AN ir paskui eliminavimas.', 'AN followed by elimination.'), solution: [{ mech: MECH.imine }]
            }],
            why: t('Azoto nukleofilų reakcija yra AN ir eliminavimas.', 'A nitrogen nucleophile gives AN followed by elimination.'), src: 'L13 p25, p27'
          },
          {
            id: 'u13.mech.9',
            q: [{ p: t('Studentas aprašė imino susidarymą iš acetono ir metilamino rūgščioje terpėje, bet viena frazė klaidinga.', 'A student described imine formation from acetone and methylamine in acid, but one statement is wrong.') }, { scheme: { items: [{ smi: 'CC(=O)C' }, { plus: true }, { smi: 'CN' }, { arrow: '→', above: f('H+') }, { smi: 'CC(C)=NC' }] } }],
            steps: [{
              prompt: t('Raskite klaidingą teiginį.', 'Find the wrong statement.'), kind: 'choice',
              options: [
                { text: t('Azoto elektronų pora atakuoja karbonilo anglį, susidaro karbinolaminas.', 'The nitrogen lone pair attacks the carbonyl carbon and a carbinolamine forms.') },
                { text: t('Karbinolamino hidroksigrupė išeina kaip $OH-$ be jokios protonizacijos, nes tai gera nueinančioji grupė.', 'The hydroxy group of the carbinolamine leaves as $OH-$ without any protonation because it is a good leaving group.') },
                { text: t('Hidroksigrupė protonizuojama ir išeina kaip vanduo.', 'The hydroxy group is protonated and leaves as water.') },
                { text: t('Galiausiai protonas atsiskiria nuo azoto ir susidaro $C=N$ iminas.', 'Finally a proton leaves the nitrogen and the $C=N$ imine results.') }
              ],
              answer: 1,
              hint: t('Palyginkite, kuri grupė gali išeiti lengviau: $OH-$ ar $H2O$.', 'Compare which leaving group is easier: $OH-$ or $H2O$.'),
              solution: [{ p: t('$OH-$ yra stipri bazė, todėl prasta nueinančioji grupė. Rūgštyje ji pirmiausia protonizuojama ir išeina kaip vanduo.', '$OH-$ is a strong base and therefore a poor leaving group. In acid it is protonated first and leaves as water.') }, { mech: MECH.imine }]
            }],
            why: t('Rūgštis atlieka du darbus: protonizuotas karbonilas lengviau atakuojamas, o protonizuota hidroksigrupė išeina kaip vanduo – gera nueinančioji grupė. Neutralus aminas karbonilą gali atakuoti ir be protonizacijos.', 'Acid does two jobs: a protonated carbonyl is attacked more easily, and a protonated hydroxy group leaves as water, a good leaving group. A neutral amine can attack the carbonyl even without protonation.'), src: 'L13 p27'
          },
          {
            id: 'u13.mech.8',
            q: [{ p: t('Keturi nukleofilai reaguoja su acetonu ar etanaliu.', 'Four nucleophiles react with acetone or ethanal.') }, { mol: [{ smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }] }],
            steps: [{
              prompt: t('Kuriam virsmui rūgšties katalizatorius būtinas?', 'Which conversion requires an acid catalyst?'), kind: 'choice',
              options: [{ text: t('$CH3OH$ → acetalis', '$CH3OH$ → acetal') }, { text: t('$H2O$ → hidratas', '$H2O$ → hydrate') }, { text: t('$CN−$ → cianhidrinas', '$CN−$ → cyanohydrin') }, { text: t('$NaBH4$ → alkoholis', '$NaBH4$ → alcohol') }],
              answer: 0,
              hint: t('Kurioje stadijoje hidroksigrupė turi išeiti kaip vanduo?', 'In which conversion must a hydroxy group leave as water?'),
              solution: t('Acetalis susidaro tik rūgštyje: hemiacetalio $OH$ turi būti protonizuota, kad išeitų kaip vanduo. Hidratas ir hemiacetalis susidaro ir neutralioje terpėje (rūgštis tik pagreitina), o anijonai $CN−$ ir $H−$ atakuoja neprotonizuotą karbonilą.', 'An acetal forms only in acid: the hemiacetal $OH$ must be protonated to leave as water. A hydrate and a hemiacetal also form in neutral medium (acid only speeds them up), and the anions $CN−$ and $H−$ attack the unprotonated carbonyl.')
            }],
            why: t('Terpė ir nukleofilo stiprumas nusprendžia mechanizmą: anijonai atakuoja tiesiogiai, silpnus nukleofilus rūgštis tik paspartina, o acetalio susidarymui jos reikia.', 'The medium and the strength of the nucleophile decide the mechanism: anions attack directly, acid only speeds up weak nucleophiles, and the acetal needs it.'), src: 'L13 p8, p12, p14, p15'
          }
        ]
      },

      /* ================= 15. observations (S6.4), bank ================= */
      {
        id: 'u13.test',
        title: t('Aldehidų atpažinimas: stebimi požymiai', 'Recognising aldehydes: what is observed'),
        mirrors: ['S6.4'],
        bank: [
          {
            id: 'u13.test.1',
            q: [{ p: t('Suderinkite bandymą su požymiu.', 'Match each test with its observation.') }],
            steps: [{
              prompt: t('Suporuokite.', 'Pair them.'), kind: 'match',
              answer: {
                left: [{ text: t('Tolenso testas', 'Tollens test') }, { text: t('Felingo testas', 'Fehling test') }, { text: t('Jodoformo reakcija', 'Iodoform reaction') }, { text: t('Benzenkarbaldehidas su anilinu', 'Benzaldehyde with aniline') }],
                right: [{ text: t('sidabro veidrodis', 'silver mirror') }, { text: t('raudonos $Cu2O$ nuosėdos', 'red $Cu2O$ precipitate') }, { text: t('geltonos $CHI3$ nuosėdos', 'yellow $CHI3$ precipitate') }, { text: t('geltoni kristalai (iminas)', 'yellow crystals (imine)') }],
                pairs: [0, 1, 2, 3]
              },
              hint: t('Kiekvienas bandymas turi savitą produktą.', 'Each test has its own characteristic product.'),
              solution: t('Tolenso: $Ag$; Felingo: $Cu2O$; jodoformo: $CHI3$; Šifo bazė: geltoni kristalai.', 'Tollens: $Ag$; Fehling: $Cu2O$; iodoform: $CHI3$; Schiff base: yellow crystals.')
            }],
            why: t('Požymis rodo susidariusį produktą, taigi ir funkcinę grupę.', 'The observation shows the product formed, and therefore the functional group.'), src: 'L13 p36, p38, p49, LW6 p3'
          },
          {
            id: 'u13.test.2',
            q: [{ p: t('Reikia nustatyti aldehidinę grupę fenilacetaldehide.', 'You must detect the aldehyde group in phenylethanal.') }, { mol: { smi: 'O=CCc1ccccc1', name: t('feniletanalis', '2-phenylethanal') } }],
            steps: [
              {
                prompt: t('Kuris reagentas tinka ir ką pamatysite?', 'Which reagent fits and what will you see?'), kind: 'choice',
                options: [{ text: t('$Ag+$, $NH3$: sidabro veidrodis.', '$Ag+$, $NH3$: a silver mirror.') }, { text: t('$I2$, $NaOH$: geltonos nuosėdos.', '$I2$, $NaOH$: a yellow precipitate.') }, { text: t('$H3O+$: geltonos nuosėdos.', '$H3O+$: a yellow precipitate.') }, { text: t('$NaOH$: raudonos nuosėdos.', '$NaOH$: a red precipitate.') }],
                answer: 0, hint: t('Aldehidai yra reduktoriai.', 'Aldehydes are reducing agents.'),
                solution: t('Aldehidas redukuoja $Ag+$ iki $Ag$, kuris dengia stiklą.', 'The aldehyde reduces $Ag+$ to $Ag$, which coats the glass.')
              },
              {
                prompt: t('Koks organinis produktas susidaro?', 'Which organic product forms?'), kind: 'choice',
                options: [{ mol: { smi: 'C(C(=O)[O-])c1ccccc1.[NH4+]' } }, { mol: { smi: 'OC(=O)Cc1ccccc1' } }, { mol: { smi: 'OCCc1ccccc1' } }, { mol: { smi: 'O=C(C)c1ccccc1' } }],
                answer: 0, hint: t('Aldehidas oksiduojamas, bet kokia čia terpė?', 'The aldehyde is oxidised, but what is the medium here?'),
                solution: t('Aldehidas oksiduojamas, bet terpė amoniakinė (šarminė), todėl susidaro amonio feniletanoatas; laisva rūgštis gaunama tik parūgštinus.', 'The aldehyde is oxidised, but the medium is ammoniacal (alkaline), so ammonium phenylethanoate forms; the free acid appears only after acidification.')
              }
            ],
            why: t('Aldehidas oksiduojamas į rūgštį, o metalo jonas redukuojamas.', 'The aldehyde is oxidised to the acid and the metal ion is reduced.'), src: 'L13 p36, S6.4',
            claims: [{ react: ['co.tollens', ['O=CCc1ccccc1'], null, 'C(C(=O)[O-])c1ccccc1.[NH4+]'] }]
          },
          {
            id: 'u13.test.3',
            q: [{ p: t('Į du mėgintuvėlius su propanaliu ir propanonu įpilama Tolenso reagento.', 'Tollens\' reagent is added to two tubes, one with propanal and one with propanone.') }, { mol: [{ smi: 'CCC=O', name: t('propanalis', 'propanal') }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }] }],
            steps: [{
              prompt: t('Kas stebima?', 'What is observed?'), kind: 'choice',
              options: [{ text: t('Veidrodis tik propanalio mėgintuvėlyje.', 'A mirror only in the propanal tube.') }, { text: t('Veidrodis tik propanono mėgintuvėlyje.', 'A mirror only in the propanone tube.') }, { text: t('Veidrodis abiejuose.', 'A mirror in both.') }, { text: t('Veidrodžio nėra nė viename.', 'No mirror in either.') }],
              answer: 0, hint: t('Ar ketonas gali būti reduktorius?', 'Can a ketone be a reducing agent?'),
              solution: t('Ketonas neturi aldehido $H$, todėl neoksiduojamas silpnų oksidatorių.', 'A ketone has no aldehyde $H$ and is not oxidised by weak oxidants.')
            }],
            why: t('Bandymas atskiria aldehidus nuo ketonų.', 'The test separates aldehydes from ketones.'), src: 'L13 p36'
          },
          {
            id: 'u13.test.4',
            q: [{ p: t('Metanalis kaitinamas su šviežiai gautu $Cu(OH)2$ šarme (6 laboratorinis darbas).', 'Methanal is heated with freshly prepared $Cu(OH)2$ in alkali (laboratory work 6).') }],
            steps: [{
              prompt: t('Išdėstykite stebimus pokyčius laiko eiga.', 'Order the changes seen in time.'), kind: 'order',
              options: [{ text: t('mėlynas $Cu(OH)2$', 'blue $Cu(OH)2$') }, { text: t('geltonas $CuOH$', 'yellow $CuOH$') }, { text: t('raudonas $Cu2O$', 'red $Cu2O$') }, { text: t('vario veidrodis ant sienelių', 'a copper mirror on the walls') }],
              hint: t('Varis redukuojamas laipsniškai.', 'Copper is reduced gradually.'),
              solution: t('$Cu(OH)2$ → $CuOH$ → $Cu2O$ → $Cu$ (su metanaliu).', '$Cu(OH)2$ → $CuOH$ → $Cu2O$ → $Cu$ (with methanal).')
            }],
            why: t('Metanalis yra stipriausias reduktorius iš aldehidų.', 'Methanal is the strongest reducing agent among the aldehydes.'), src: 'LW6 p3, L13 p38'
          },
          {
            id: 'u13.test.5',
            q: [{ p: t('Propanonas veikiamas $I2$ ir $NaOH$.', 'Propanone is treated with $I2$ and $NaOH$.') }, { mol: { smi: 'CC(C)=O', name: t('propanonas', 'propanone') } }],
            steps: [
              {
                prompt: t('Kokios yra geltonos nuosėdos?', 'What is the yellow precipitate?'), kind: 'choice', options: [{ text: t('$CHI3$ (jodoformas)', '$CHI3$ (iodoform)') }, { text: t('$CH3I$', '$CH3I$') }, { text: t('$CI4$', '$CI4$') }, { text: t('$I2$ kristalai', '$I2$ crystals') }], answer: 0,
                hint: t('Šarme metilketonas netenka trijų $α$ vandenilių ir $C–C$ ryšio.', 'In alkali a methyl ketone loses its three $α$ hydrogens and a $C–C$ bond.'), solution: t('Pakeitus tris $α$ vandenilius jodu, $CI3−C$ ryšys skyla: išsiskiria jodoformas $CHI3$.', 'After three $α$ hydrogens are replaced by iodine the $CI3−C$ bond breaks: iodoform $CHI3$ is released.')
              },
              {
                prompt: t('Kas lieka tirpale?', 'What stays in solution?'), kind: 'choice',
                options: [{ mol: { smi: 'CC(=O)[O-].[Na+]' } }, { mol: { smi: 'CC(C)O' } }, { mol: { smi: 'CC(=O)C' } }],
                answer: 0, hint: t('$C–C$ ryšys skyla šarme.', 'The $C–C$ bond is cleaved in alkali.'),
                solution: t('Lieka etanoato (acetato) druska.', 'The salt of ethanoate (acetate) remains.')
              }
            ],
            why: t('Metilketono grupė šarme su halogenu skyla į haloformą ir karboksilatą.', 'A methyl ketone group is cleaved by halogen in alkali into a haloform and a carboxylate.'), src: 'L13 p49',
            claims: [{ formula: ['C(I)(I)I', 'CHI3'] }, { react: ['co.iodoform', ['CC(C)=O'], null, 'CC(=O)[O-].[Na+]'] }]
          },
          {
            id: 'u13.test.6',
            q: [{ p: t('Tolenso ir Felingo reakcijos vyksta šarminėje terpėje.', 'The Tollens and Fehling reactions run in alkaline medium.') }],
            steps: [{
              prompt: t('Kuris teiginys teisingas?', 'Which statement is correct?'), kind: 'choice',
              options: [{ text: t('Aldehidai silpnais oksidatoriais virsta karboksilatais, o ketonai nereaguoja.', 'Aldehydes are oxidised by weak oxidants to carboxylates, whereas ketones do not react.') }, { text: t('Ketonai virsta karboksilatais, aldehidai – ne.', 'Ketones become carboxylates, aldehydes do not.') }, { text: t('Susidaro laisva karboksirūgštis.', 'The free carboxylic acid forms.') }, { text: t('Abu junginių tipai duoda tą patį rezultatą.', 'Both kinds give the same result.') }],
              answer: 0, hint: t('Kokia terpė, tokia ir rūgšties forma.', 'The medium decides the form of the acid.'),
              solution: t('Šarme rūgštis egzistuoja kaip druska; ketono neįmanoma oksiduoti nenutraukus $C–C$ ryšio.', 'In alkali the acid exists as its salt; a ketone cannot be oxidised without breaking a $C–C$ bond.')
            }],
            why: t('Tai selektyvi aldehidų reakcija.', 'This is a selective reaction of aldehydes.'), src: 'L13 p36, p38'
          },
          {
            id: 'u13.test.7',
            q: [{ p: t('Benzenkarbaldehidas ir anilinas sumaišomi be tirpiklio, paskui kristalinami iš etanolio.', 'Benzaldehyde and aniline are mixed without solvent and then recrystallised from ethanol.') }, { scheme: { items: [{ smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') }, { plus: true }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }, { arrow: '→', below: f('−H2O') }] } }],
            steps: [
              {
                prompt: t('Koks produktas?', 'What is the product?'), kind: 'choice',
                options: [{ mol: { smi: 'C(=Nc1ccccc1)c1ccccc1' } }, { mol: { smi: 'OC(Nc1ccccc1)c1ccccc1' } }, { mol: { smi: 'OCc1ccccc1' } }],
                answer: 0, hint: t('Pirminis aminas ir karbonilas.', 'A primary amine and a carbonyl compound.'),
                solution: t('AN ir eliminavimas duoda iminą $C=N$.', 'AN and elimination give the imine $C=N$.')
              },
              {
                prompt: t('Kaip vadinama ši junginių klasė?', 'What is this class of compounds called?'), kind: 'choice',
                options: [{ text: t('Iminai (Šifo bazės)', 'Imines (Schiff bases)') }, { text: t('Oksimai', 'Oximes') }, { text: t('Acetaliai', 'Acetals') }, { text: t('Hidrazonai', 'Hydrazones') }],
                answer: 0, hint: t('Grupė $C=N$, prie azoto – arilas.', 'A $C=N$ group with an aryl group on nitrogen.'), solution: t('Pirminis aminas duoda iminą.', 'A primary amine gives an imine.')
              }
            ],
            why: t('Pirminių aminų ir karbonilų reakcija duoda iminus.', 'Primary amines and carbonyl compounds give imines.'), src: 'LW6 p10, L13 p26',
            claims: [{ formula: ['C(=Nc1ccccc1)c1ccccc1', 'C13H11N'] }]
          },
          {
            id: 'u13.test.8',
            q: [{ p: t('Trys junginiai: etanalis, propanonas, butanonas. Į kiekvieną pilama Tolenso ir (atskirai) jodo su šarmu.', 'Three compounds: ethanal, propanone, butanone. Tollens\' reagent and (separately) iodine with alkali are added to each.') }, { mol: [{ smi: 'CC=O', name: t('etanalis', 'ethanal') }, { smi: 'CC(C)=O', name: t('propanonas', 'propanone') }, { smi: 'CCC(C)=O', name: t('butanonas', 'butanone') }] }],
            steps: [
              {
                prompt: t('Kurie duoda sidabro veidrodį?', 'Which give a silver mirror?'), kind: 'multi',
                options: [{ mol: { smi: 'CC=O' } }, { mol: { smi: 'CC(C)=O' } }, { mol: { smi: 'CCC(C)=O' } }], answer: [0],
                hint: t('Ketonai Tolenso reagento neredukuoja.', 'Ketones do not reduce Tollens\' reagent.'), solution: t('Tik etanalis yra aldehidas.', 'Only ethanal is an aldehyde.')
              },
              {
                prompt: t('Kurie duoda jodoformą?', 'Which give iodoform?'), kind: 'multi',
                options: [{ mol: { smi: 'CC=O' } }, { mol: { smi: 'CC(C)=O' } }, { mol: { smi: 'CCC(C)=O' } }], answer: [0, 1, 2],
                hint: t('Ieškokite $CH3−C=O$ grupės.', 'Look for a $CH3−C=O$ group.'), solution: t('Visi trys turi acetilgrupę $CH3−C(=O)−$.', 'All three contain the acetyl group $CH3−C(=O)−$.')
              }
            ],
            why: t('Du testai tikrina skirtingas grupes: aldehidą ir acetilgrupę.', 'The two tests check different groups: the aldehyde and the acetyl group.'), src: 'L13 p36, p49'
          }
        ]
      }
    ],
    coverage: {
      'S6.1': ['u13.order'],
      'S6.2': ['u13.hydrate'],
      'S6.3': ['u13.acetal'],
      'S6.4': ['u13.nu', 'u13.id', 'u13.test'],
      'S6.5': ['u13.cann'],
      'S6.6': ['u13.aldol', 'u13.mech'],
      'S6.9': ['u13.thio'],
      'S6.10': ['u13.protect'],
      'S6.11': ['u13.cann'],
      'S6.12': ['u13.multi'],
      'S6.13': ['u13.enol'],
      'S6.14': ['u13.cross']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
