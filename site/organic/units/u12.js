// site/organic/units/u12.js: unit 12, polyhydric alcohols, phenols, thiols and ethers
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });                       // labels that are only formulas or symbols
  const ion = (s) => s;                                      // reads better where a SMILES is an ion pair

  /* ---------- helpers shared by the generators ---------- */

  const key = (ctx, smi) => ctx.chem.canonical(ctx.chem.parse(smi), { stereo: false });
  const same = (ctx, a, b) => key(ctx, a) === key(ctx, b);
  // a name in both languages (nominative) or null when the namer cannot say
  function nm(ctx, smi) {
    let a = null, b = null;
    try { a = ctx.name.name(smi, { lang: 'lt' }); b = ctx.name.name(smi, { lang: 'en' }); } catch (e) { return null; }
    return a && b && a.name && b.name ? t(a.name, b.name) : null;
  }
  // options from structures: the right ones first, wrong ones after, no duplicates, at most `max` options
  function molOptions(ctx, right, wrong, max) {
    const seen = new Set();
    const out = [];
    right.concat(wrong).forEach((smi, i) => {
      const k = key(ctx, smi);
      if (seen.has(k)) { if (i < right.length) throw new Error('u12: right option repeated'); return; }
      if (out.length >= max) return;
      seen.add(k);
      out.push({ mol: { smi } });
    });
    return out;
  }
  const pk = (x) => t(String(x).replace('.', ','), String(x));  // pKa number for both languages
  // a reaction scheme: reactant(s) + reactant(s) -> arrow label
  const arrowTo = (label) => (label ? { arrow: '→', above: label } : { arrow: '→' });
  const molOf = (s) => (typeof s === 'string' ? { smi: s } : s);
  // [reactants] --label--> [products] as scheme items
  function sch(reactants, label, products) {
    const items = [];
    reactants.forEach((r, i) => { if (i) items.push({ plus: true }); items.push(molOf(r)); });
    items.push(arrowTo(label));
    products.forEach((r, i) => { if (i) items.push({ plus: true }); items.push(molOf(r)); });
    return { items };
  }

  // a one-step "what is the product" bank problem; options[0] is the right one
  const mp = (o) => ({
    id: o.id,
    q: [{ p: o.p }, { scheme: { items: [o.name ? { smi: o.sub, name: o.name } : { smi: o.sub }, { arrow: '→', above: o.label }] } }],
    steps: [{
      prompt: o.prompt || t('Koks yra galutinis organinis produktas?', 'What is the final organic product?'),
      kind: 'choice', options: o.options.map((s) => ({ mol: { smi: s } })), answer: 0,
      hint: o.hint, solution: o.sol
    }],
    why: o.why, src: o.src, claims: o.claims || []
  });

  function chainOnce(rng, ctx) {
          const { react } = ctx;
          const ALKYNES = ['C#C', 'CC#C', 'CCC#C', 'CCCC#C', 'CCCCC#C', 'CC(C)C#C', 'CC(C)CC#C', 'CC(C)(C)C#C', 'C1CCCCC1C#C', 'CCCCCC#C'];
          const RXS = [['CI', 'CH3I'], ['CCBr', 'CH3CH2Br'], ['CCCBr', 'CH3CH2CH2Br'], ['CCI', 'CH3CH2I']];
          const yn = ctx.pick(ALKYNES);
          const [rx, rxLab] = ctx.pick(RXS);
          const acid = ctx.pick(['HI', 'HBr']);
          const get = (rule, rs, o) => {
            const r = react.run(rule, rs, o);
            const m = (r.products || []).filter((p) => p.major && !p.by);
            if (r.none || m.length !== 1) throw new Error('u12.chain: ' + rule);
            return m[0].smi;
          };
          const A = get('yne.hydration', [yn]);
          const B = get('co.nabh4', [A]);
          const Cm = get('alc.na', [B]);
          const D = get('williamson', [Cm, rx]);
          const cl = react.run('ether.hi', [D], { acid });
          const E = (cl.products || []).filter((p) => p.major).map((p) => p.smi);
          if (E.length !== 2) throw new Error('u12.chain: cleavage');
          const terminal = yn !== 'C#C';
          const Awrong = terminal ? [yn.replace(/C#C$/, 'CC=O'), yn.replace(/C#C$/, 'C(O)=C')] : ['C=CO', 'CCO'];
          const Bwrong = terminal ? [yn.replace(/C#C$/, 'CCO'), A] : ['CC(=O)O', 'C=CO', A];
          const otherRx = RXS.find((r) => r[0] !== rx && r[0][r[0].length - 1] === rx[rx.length - 1]) || RXS.find((r) => r[0] !== rx);
          const Dalt = get('williamson', [Cm, otherRx[0]]);
          const Aopts = molOptions(ctx, [A], Awrong, 4);
          const Bopts = molOptions(ctx, [B], Bwrong, 4);
          const Dopts = molOptions(ctx, [D], [Dalt, B].filter((x) => !same(ctx, x, D)), 4);
          const Ealt = (react.run('ether.hi', [D], { acid, eq: 2 }).products || []).filter((p) => p.major).map((p) => p.smi);
          const Eminor = (cl.products || []).filter((p) => !p.major).map((p) => p.smi);
          const toOpt = (l) => ({ scheme: { items: l.reduce((acc, s, i) => acc.concat(i ? [{ plus: true }, { smi: s }] : [{ smi: s }]), []) } });
          const lists = [E];
          [Eminor, Ealt].forEach((l) => { if (l.length && !lists.some((x) => x.length === l.length && x.every((s) => l.some((y) => same(ctx, s, y))))) lists.push(l); });
          const X = acid === 'HI' ? 'I' : 'Br';
          const Eh = E.find((s) => s.indexOf(X) >= 0);
          const Bh = Eminor.find((s) => s.indexOf(X) >= 0);
          const Eother = Eh ? Eh.replace(X, X === 'I' ? 'Br' : 'I') : null;
          const Eopts = Eh ? molOptions(ctx, [Eh], [Bh, Eother].filter(Boolean), 4) : [];
          if (Aopts.length < 2 || Bopts.length < 3 || Dopts.length < 2 || Eopts.length < 3) throw new Error('u12.chain: options');
          const nA = nm(ctx, A), nB = nm(ctx, B), nD = nm(ctx, D);
          const steps = [
            { prompt: t('Kas yra A (alkino hidratacija)?', 'What is A (hydration of the alkyne)?'), kind: 'choice', options: Aopts, answer: 0,
              hint: t('Pirmiausia susidaro nestabilus enolis. Į ką jis izomerizuojasi?', 'An unstable enol forms first. What does it isomerise to?'),
              solution: t('$H2O$ prisijungia pagal Markovnikovo taisyklę, enolis izomerizuojasi į karbonilinį junginį: ' + (terminal ? 'metilketoną' : 'etanalį (acetaldehidą)') + '.', '$H2O$ adds by Markovnikov’s rule and the enol isomerises to a carbonyl compound: ' + (terminal ? 'a methyl ketone' : 'ethanal (acetaldehyde)') + '.') },
            { prompt: t('Kas yra B ($NaBH4$, po to $H3O+$)?', 'What is B ($NaBH4$, then $H3O+$)?'), kind: 'choice', options: Bopts, answer: 0,
              hint: t('Boro hidridas redukuoja karbonilgrupę.', 'Borohydride reduces the carbonyl group.'),
              solution: t('Karbonilgrupė redukuojama iki alkoholio: ' + (terminal ? 'ketonas virsta antriniu alkoholiu.' : 'aldehidas virsta pirminiu alkoholiu.'), 'The carbonyl group is reduced to an alcohol: ' + (terminal ? 'the ketone gives a secondary alcohol.' : 'the aldehyde gives a primary alcohol.')) },
            { prompt: t('Kas yra D (alkoholis + Na, po to ' + rxLab + ')?', 'What is D (alcohol + Na, then ' + rxLab + ')?'), kind: 'choice', options: Dopts, answer: 0,
              hint: t('Na paverčia alkoholį alkoksidu; alkoksidas atakuoja halogenalkaną.', 'Na turns the alcohol into an alkoxide, which attacks the alkyl halide.'),
              solution: t('Susidaręs alkoksidas atakuoja halogenalkaną (SN2): gaunamas eteris' + (nD ? ' ' + nD.lt : '') + '.', 'The alkoxide formed attacks the halide (SN2): an ether results' + (nD ? ': ' + nD.en : '') + '.') },
            { prompt: t('Kuris halogenalkanas E susidaro (B – vėl gaunamas alkoholis)?', 'Which haloalkane E forms (B is the alcohol regenerated)?'), kind: 'choice', options: Eopts, answer: 0,
              hint: t('Stabilaus karbokatijono nėra. Kurią $C-O$ jungtį atakuoja halogenidas?', 'No stable carbocation is possible. Which $C-O$ bond does the halide attack?'),
              solution: t('SN2: halogenidas atakuoja mažiau užstotą anglį, todėl alkoholis B atsikuria, o E yra halogenalkanas.', 'SN2: the halide attacks the less hindered carbon, so alcohol B is regenerated and E is a haloalkane.') }
          ];
          if (nD) steps.splice(3, 0, { prompt: t('Pavadinkite junginį D.', 'Name compound D.'), kind: 'name', mol: { smi: D }, answer: { smi: D },
            hint: t('Eterį vadinkite alkoksi- dariniu: pagrindinė grandinė su pakaitu $RO-$.', 'Name the ether as an alkoxy derivative: the main chain carrying an $RO-$ substituent.'),
            solution: t(nD.lt, nD.en) });
          return {
            q: [
              { p: t('Įrašykite junginių A, B, D ir E formules grandinėje.', 'Give the formulas of A, B, D and E in the chain.') },
              { list: [t('Alkinas + $H2O$, $HgSO4$, $H2SO4$ → A', 'Alkyne + $H2O$, $HgSO4$, $H2SO4$ → A'), t('A, veikiamas $NaBH4$ ir paskui $H3O+$ → B', 'A + $NaBH4$, then $H3O+$ → B'), t('B + Na → C', 'B + Na → C'), t('C + ' + rxLab + ' → D', 'C + ' + rxLab + ' → D'), t('D + 1 ekv. ' + acid + ', t → E + B', 'D + 1 equiv. ' + acid + ', heat → E + B')], ordered: true },
              { mol: nm(ctx, yn) ? { smi: yn, name: nm(ctx, yn) } : { smi: yn } }
            ],
            steps,
            why: t('Kiekvienas žingsnis keičia funkcinę grupę: alkinas → karbonilas → alkoholis → alkoholiatas → eteris, o rūgštis eterį vėl skaido. Išsiaiškinkite, kuri grupė reaguoja ir kuris reagentas ją paveikia.', 'Each step changes the functional group: alkyne → carbonyl → alcohol → alkoxide → ether, and the acid then cleaves the ether again. Work out which group reacts and which reagent acts on it.'),
            src: 'S5.20'
          };
  }

  ORG.unit({
    id: 'u12',
    notes: [
      /* ------------------------------------------------------------ 1 polyols */
      {
        id: 'polyol',
        title: t('Daugiahidroksiliai alkoholiai', 'Polyhydric alcohols'),
        blocks: [
          { h: t('Dvi ar daugiau OH grupių', 'Two or more OH groups') },
          {
            p: t('Daugiahidroksiliai alkoholiai, arba polioliai, turi dvi ar daugiau hidroksigrupių alifatinėje grandinėje. Dažniausi iš jų – 1,2-etandiolis (etilenglikolis) ir glicerolis.',
              'Polyhydric alcohols, or polyols, carry two or more hydroxy groups on an aliphatic chain. The most common are ethane-1,2-diol (ethylene glycol) and glycerol.'),
            src: 'L12 p2'
          },
          { mol: [{ smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }, { smi: 'OCC(O)CO', name: t('1,2,3-propantriolis', 'propane-1,2,3-triol') }] },
          {
            p: t('Daugelyje reakcijų polioliai elgiasi kaip paprasti alkoholiai: su natriu sudaro alkoholiatus, su rūgštimis – esterius. Su vienu ekvivalentu Na pakeičiamas vienas vandenilis, o kaitinant iki 150 °C su pertekliumi Na – abu.',
              'In most reactions polyols behave like ordinary alcohols: with sodium they give alkoxides and with acids esters. One equivalent of Na replaces one hydrogen; with excess Na at 150 °C both are replaced.'),
            src: 'L12 p2'
          },
          {
            scheme: {
              items: [{ smi: 'OCCO' }, { arrow: '→', above: f('Na') }, { smi: 'OCC[O-].[Na+]' }, { arrow: '→', above: f('Na, 150 °C') }, { smi: '[O-]CC[O-].[Na+].[Na+]' }]
            },
            caption: t('Natrio etandioliatai: rūgštusis (vienas Na) ir neutralusis (du Na).', 'Sodium ethanediolates: the acidic one (one Na) and the neutral one (two Na).'),
            src: 'L12 p2'
          },
          {
            rule: t('Polioliai yra stipresnės rūgštys už vienhidroksilius alkoholius: kaimyninė OH grupė traukia elektronus (−I) ir stabilizuoja alkoholiato anijoną. Todėl jie reaguoja su šarmais, taip pat su sunkiųjų metalų hidroksidais, kurie vandenyje nesitirpsta.',
              'Polyols are stronger acids than monohydric alcohols: the neighbouring OH group withdraws electrons (−I) and stabilises the alkoxide anion. So they also react with alkalis and with insoluble heavy-metal hydroxides.'),
            src: 'L12 p3'
          },
          { h: t('Vario hidroksido bandymas', 'The copper hydroxide test') },
          {
            p: t('Vario sulfatas su NaOH duoda šviesiai mėlynas $Cu(OH)2$ nuosėdas. Pridėjus poliolio, nuosėdos ištirpsta ir susidaro intensyviai mėlynas tirpalas: dviejų gretimų deguonies atomų poros sudaro su variu kompleksą, kuriame yra du penkianariai chelatiniai žiedai.',
              'Copper sulfate with NaOH gives a pale-blue $Cu(OH)2$ precipitate. Add a polyol and the precipitate dissolves to an intense blue solution: the lone pairs of two adjacent oxygens bind the copper in a complex with two five-membered chelate rings.'),
            src: 'L12 p3; LW6 p2'
          },
          {
            scheme: { items: [{ smi: 'OCCO' }, { plus: true }, { smi: 'OCCO' }, { plus: true }, { smi: 'O[Cu]O' }, { arrow: '→' }, { smi: 'C1C[OH+][Cu-2]2(O1)[OH+]CCO2' }, { plus: true }, { smi: 'O' }, { plus: true }, { smi: 'O' }] },
            caption: t('Du etandiolio likučiai: vienas O–Cu ryšys ir viena donorinė O→Cu pora kiekviename. Formalieji krūviai (Cu²⁻, O⁺) kyla iš dviejų donorinių O→Cu ryšių; varis lieka dvivalentis.', 'Two ethanediol units: one O–Cu bond and one donor O→Cu pair in each. The formal charges (Cu²⁻, O⁺) come from the two donor O→Cu bonds; copper stays divalent.'),
            src: 'L12 p3'
          },
          {
            rule: t('Vario hidroksido tirpinimas rodo hidroksigrupes prie gretimų anglies atomų (glicerolis, etandiolis, cukrūs). Vienhidroksiliai alkoholiai ir 1,3-dioliai šio mėlynojo tirpalo nesudaro. Analogišką mėlyną kompleksą sudaro ir α-aminorūgštys.',
              'Dissolving copper hydroxide shows hydroxy groups on adjacent carbons (glycerol, ethanediol, sugars). Monohydric alcohols and 1,3-diols do not give the blue solution. α-Amino acids give an analogous blue complex.'),
            src: 'L12 p3; LW6 p2'
          },
          {
            pitfall: t('Pats $Cu(OH)2$ jau yra mėlynos nuosėdos. Teigiamas rezultatas – ne mėlyna spalva, o nuosėdų išnykimas ir tamsiai mėlynas skaidrus tirpalas.',
              'The $Cu(OH)2$ itself is already a blue precipitate. A positive result is not the blue colour but the disappearance of the precipitate and a clear deep-blue solution.')
          },
          {
            example: {
              q: [{ p: t('Kuris iš dviejų junginių, 1,2-propandiolis ar 1,3-propandiolis, ištirpins šviežiai nusodintą $Cu(OH)2$?', 'Which of the two, propane-1,2-diol or propane-1,3-diol, dissolves freshly precipitated $Cu(OH)2$?') },
                { mol: [{ smi: 'CC(O)CO', name: t('1,2-propandiolis', 'propane-1,2-diol') }, { smi: 'OCCCO', name: t('1,3-propandiolis', 'propane-1,3-diol') }] }],
              steps: [
                [{ p: t('1,2-propandiolyje abi OH grupės yra prie gretimų atomų, todėl deguonies atomai gali apkabinti varį ir sudaryti penkianarį žiedą.', 'In propane-1,2-diol both OH groups sit on adjacent carbons, so the oxygens can clasp the copper in a five-membered ring.') }],
                [{ p: t('1,3-propandiolio OH grupes skiria trys anglies atomai, todėl šio komplekso jis nesudaro. Ištirps tik 1,2-propandiolis.', 'The OH groups of propane-1,3-diol are separated by three carbons, so it does not form this complex. Only propane-1,2-diol dissolves the precipitate.') }]
              ]
            },
            claims: [{ name: ['CC(O)CO', { lt: '1,2-propandiolis', en: 'propane-1,2-diol' }] }, { name: ['OCCCO', { lt: '1,3-propandiolis', en: 'propane-1,3-diol' }] }]
          },
          { h: t('Glicerolis', 'Glycerol') },
          {
            p: t('Riebalai ir aliejai yra glicerolio esteriai, todėl juos hidrolizuojant rūgštyje išsiskiria glicerolis. Glicerolis su $HNO3$ duoda trinitratą (nitrogliceriną), o su $H3PO4$ – glicerolfosfatus, fosfolipidų struktūrinius vienetus. Etandiolis ir propandiolis naudojami kaip antifrizai, nes žemina vandens užšalimo temperatūrą.',
              'Fats and oils are glycerol esters, so hydrolysing them in acid releases glycerol. Glycerol gives the trinitrate (nitroglycerin) with $HNO3$ and glycerol phosphates, units of phospholipids, with $H3PO4$. Ethanediol and propanediol are used as antifreeze because they lower the freezing point of water.'),
            src: 'L12 p4–6'
          },
          {
            scheme: sch(['CCCC(=O)OCC(OC(=O)CCC)COC(=O)CCC', 'O', 'O', 'O'], f('H2O, H+'), ['OCC(O)CO', 'CCCC(=O)O', 'CCCC(=O)O', 'CCCC(=O)O']),
            caption: t('Modelis: gliceroltributanoatas. Tikri riebalai turi ilgų grandinių rūgščių likučius.', 'Model: glycerol tributanoate. Real fats carry long-chain acid residues.'),
            src: 'L12 p4'
          },
          { scheme: sch(['OCC(O)CO', 'O[N+](=O)[O-]', 'O[N+](=O)[O-]', 'O[N+](=O)[O-]'], f('H2SO4'), ['[O-][N+](=O)OCC(O[N+](=O)[O-])CO[N+](=O)[O-]', 'O', 'O', 'O']), src: 'L12 p5' },
          {
            mol: [{ smi: 'OCC(O)COP(=O)(O)O', name: t('α-glicerolfosfatas', 'α-glycerophosphate') }, { smi: 'OCC(CO)OP(=O)(O)O', name: t('β-glicerolfosfatas', 'β-glycerophosphate') }],
            caption: t('Fosfatas prie pirminio (α) arba antrinio (β) deguonies.', 'The phosphate on the primary (α) or secondary (β) oxygen.'), src: 'L12 p5'
          },
          { practice: 'u12.polyol' }
        ]
      },

      /* ------------------------------------------------------------ 2 phenol acidity */
      {
        id: 'phenol',
        title: t('Fenoliai ir jų rūgštingumas', 'Phenols and their acidity'),
        blocks: [
          { h: t('Hidroksigrupė prie aromatinio žiedo', 'A hydroxy group on an aromatic ring') },
          {
            p: t('Fenolio OH grupė yra ant aromatinio žiedo anglies atomo, kurio hibridizacija $sp2$. Deguonies laisvoji elektronų pora yra konjuguota su žiedo π sistema, todėl fenolių savybės skiriasi nuo alkoholių.',
              'In phenols the OH group sits on an $sp2$ carbon of an aromatic ring. An oxygen lone pair is conjugated with the ring π system, so phenols differ from alcohols.'),
            src: 'L12 p8; T p76'
          },
          { mol: [{ smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }, { smi: 'Cc1ccc(O)cc1', name: t('4-metilfenolis', '4-methylphenol') }, { smi: 'Oc1ccccc1O', name: t('1,2-benzendiolis', 'benzene-1,2-diol') }] },
          {
            rule: t('Fenoliai (pKa ≈ 10) yra stipresnės rūgštys už alkoholius (pKa ≈ 16), nes fenoliato anijono neigiamas krūvis pasiskirsto per žiedą. Dėl tos pačios priežasties fenoliatas yra silpnesnė bazė už alkoholiatą.',
              'Phenols (pKa ≈ 10) are stronger acids than alcohols (pKa ≈ 16), because the negative charge of the phenoxide anion is spread over the ring. For the same reason phenoxide is a weaker base than an alkoxide.'),
            src: 'L12 p8'
          },
          {
            resonance: [{ smi: '[O-]c1ccccc1' }, { smi: 'O=C1C=CC=C[CH-]1' }, { smi: 'O=C1C=C[CH-]C=C1' }, { smi: 'O=C1[CH-]C=CC=C1' }],
            caption: t('Fenoliato rezonansinės formulės: krūvis būna ant deguonies ir ant o- bei p- žiedo anglies atomų.', 'Resonance structures of phenoxide: the charge sits on oxygen and on the ortho and para ring carbons.')
          },
          { h: t('Pakaitų įtaka', 'Effect of substituents') },
          {
            p: t('Rūgštingumą nusako konjuguotosios bazės stabilumas. Elektronus traukiantys pakaitai (−I, −M) išskleidžia fenoliato krūvį ir didina rūgštingumą, o elektronus stumiantys (+I, +M) jį mažina. Nitrogrupė o- ar p- padėtyje krūvį pasiima tiesiogiai.',
              'Acidity follows the stability of the conjugate base. Electron-withdrawing substituents (−I, −M) spread the phenoxide charge and raise the acidity; electron-donating ones (+I, +M) lower it. A nitro group in the ortho or para position takes the charge directly.'),
            src: 'L12 p18, p21'
          },
          { resonance: [{ smi: '[O-]c1ccc(cc1)[N+](=O)[O-]' }, { smi: 'O=C1C=CC(C=C1)=[N+]([O-])[O-]' }], caption: t('4-nitrofenoliatas: krūvis pasiekia nitrogrupės deguonį.', '4-Nitrophenoxide: the charge reaches the oxygens of the nitro group.') },
          {
            table: {
              head: [t('Junginys', 'Compound'), t('Apytikslė pKa', 'Approximate pKa')],
              rows: [
                [{ smi: 'OC1CCCCC1', name: t('cikloheksanolis', 'cyclohexanol') }, t('≈ 16', '≈ 16')],
                [{ smi: 'Oc1ccc(cc1)N', name: t('4-aminofenolis', '4-aminophenol') }, t('10,3', '10.3')],
                [{ smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }, t('10,0', '10.0')],
                [{ smi: 'Oc1ccc(cc1)[N+](=O)[O-]', name: t('4-nitrofenolis', '4-nitrophenol') }, t('7,2', '7.2')],
                [{ smi: 'Oc1c(Br)cc(Br)cc1Br', name: t('2,4,6-tribromfenolis', '2,4,6-tribromophenol') }, t('≈ 6', '≈ 6')],
                [{ smi: 'Oc1c([N+](=O)[O-])cc([N+](=O)[O-])cc1[N+](=O)[O-]', name: t('2,4,6-trinitrofenolis', '2,4,6-trinitrophenol') }, t('0,4', '0.4')]
              ]
            },
            src: 'L12 p8, p18; Klein'
          },
          {
            pitfall: t('Rūgštingumą vertinkite pagal anijoną, o ne pagal neutralią molekulę. Klausimas „kuris anijonas stabilesnis?“ iškart parodo, kodėl NO2 rūgštingumą didina, o NH2 ir CH3 – mažina.',
              'Judge acidity by the anion, not the neutral molecule. The question “which anion is more stable?” at once shows why NO2 raises the acidity while NH2 and CH3 lower it.')
          },
          {
            example: {
              q: [{ p: t('Kuris junginys yra stipresnė rūgštis: 4-nitrofenolis ar 4-metilfenolis?', 'Which is the stronger acid: 4-nitrophenol or 4-methylphenol?') },
                { mol: [{ smi: 'Oc1ccc(cc1)[N+](=O)[O-]', name: t('4-nitrofenolis', '4-nitrophenol') }, { smi: 'Cc1ccc(O)cc1', name: t('4-metilfenolis', '4-methylphenol') }] }],
              steps: [
                [{ p: t('Abu junginiai yra fenoliai, todėl lyginame jų fenoliatus.', 'Both are phenols, so compare their phenoxides.') }],
                [{ p: t('Nitrogrupė traukia elektronus ($-I$, $-M$) ir pasiima krūvį nuo žiedo, todėl 4-nitrofenoliatas stabilus.', 'The nitro group withdraws electrons ($-I$, $-M$) and takes charge from the ring, so 4-nitrophenoxide is stable.') }],
                [{ p: t('Metilgrupė stumia elektronus ($+I$), todėl 4-metilfenoliatas mažiau stabilus ir 4-nitrofenolis yra stipresnė rūgštis.', 'The methyl group pushes electrons ($+I$), so 4-methylphenoxide is less stable and 4-nitrophenol is the stronger acid.') }],
              ]
            },
            claims: [{ name: ['Oc1ccc(cc1)[N+](=O)[O-]', { lt: '4-nitrofenolis', en: '4-nitrophenol' }] }, { name: ['Cc1ccc(O)cc1', { lt: '4-metilfenolis', en: '4-methylphenol' }] }]
          },
          { practice: 'u12.acid' }
        ]
      },

      /* ------------------------------------------------------------ 3 phenol reactions */
      {
        id: 'phenolrx',
        title: t('Fenolių reakcijos', 'Reactions of phenols'),
        blocks: [
          { h: t('Du reakcijos centrai', 'Two reaction centres') },
          {
            p: t('Per $O-H$ ryšį vyksta rūgščių ir bazių reakcijos, eterių ir esterių sintezė, oksidacija. Per aromatinį žiedą vyksta elektrofilinis pakeitimas SEAr, kurį hidroksigrupė labai paspartina.',
              'Phenol reacts at two sites. Through the $O-H$ bond it takes part in acid-base reactions, ether and ester formation and oxidation. Through the aromatic ring it undergoes electrophilic substitution, SEAr, which the hydroxy group speeds up greatly.'),
            src: 'L12 p20'
          },
          { h: t('Fenoliatas, eteriai ir esteriai', 'Phenoxide, ethers and esters') },
          {
            p: t('Šarmo vandeniniame tirpale fenolis virsta fenoliatu. Fenoliatas yra nukleofilas: su halogenalkanu (SN2) duoda arilalkileterį, su rūgšties chloridu ar anhidridu – esterį.',
              'In aqueous alkali a phenol becomes a phenoxide. The phenoxide is a nucleophile: with an alkyl halide (SN2) it gives an aryl alkyl ether, with an acyl chloride or anhydride an ester.'),
            src: 'L12 p11–12'
          },
          {
            scheme: sch(['Oc1ccccc1'], f('NaOH'), ['[O-]c1ccccc1.[Na+]', 'O']),
            src: 'L12 p11'
          },
          {
            scheme: sch(['[O-]c1ccccc1.[Na+]', 'CI'], null, [{ smi: 'COc1ccccc1', name: t('metoksibenzenas', 'methoxybenzene') }, '[Na+].[I-]']),
            caption: t('O-alkilinimas: tai Viljamsono sintezė su fenoliatu.', 'O-alkylation: a Williamson synthesis with a phenoxide.'),
            src: 'L12 p11'
          },
          {
            p: t('Toks pat procesas duoda 2,4,5-T (herbicidą): 2,4,5-trichlorfenoliatas SN2 reakcija atakuoja chloracto rūgšties (šarminiame tirpale) CH₂ anglį ir išstumia chloridą.', 'The herbicide 2,4,5-T is made in the same way: 2,4,5-trichlorophenoxide attacks the CH₂ carbon of chloroacetic acid (in alkali) by SN2 and displaces chloride.'),
            src: 'L12 p21'
          },
          {
            mech: [{
              scheme: { items: [{ smi: '[O-]c1cc(Cl)c(Cl)cc1Cl', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'ClCC(=O)[O-]' }, { arrow: '→' }, { smi: '[O-]C(=O)COc1cc(Cl)c(Cl)cc1Cl' }, { plus: true }, { smi: '[Cl-]' }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 } }],
              note: t('SN2: fenoliato deguonis atakuoja $CH2$ anglį iš nugaros, chloridas išeina; rūgštinant gaunama 2,4,5-T.', 'SN2: the phenoxide oxygen attacks the $CH2$ carbon from the back and chloride leaves; acidification gives 2,4,5-T.')
            }],
            src: 'L12 p21'
          },
          {
            scheme: sch(['[O-]c1ccccc1.[Na+]', 'CC(=O)Cl'], null, [{ smi: 'CC(=O)Oc1ccccc1', name: t('feniletanoatas', 'phenyl ethanoate') }, '[Na+].[Cl-]']),
            caption: t('O-acilinimas: fenoliatas atakuoja rūgšties chlorido karbonilo anglį.', 'O-acylation: the phenoxide attacks the carbonyl carbon of the acyl chloride.'),
            src: 'L12 p12'
          },
          {
            pitfall: t('NaOH deprotonuoja fenolį, bet ne alkoholio OH. Molekulėje su abiem grupėmis „NaOH, po to $CH3I$“ metilina tik fenolio deguonį; alkoholio deguoniui reikia stipresnės bazės (Na, NaH).',
              'NaOH deprotonates a phenol but not an alcohol OH. In a molecule with both groups, “NaOH, then $CH3I$” methylates only the phenol oxygen; the alcohol oxygen needs a stronger base (Na, NaH).'),
            src: 'S5.13; S5.17'
          },
          {
            p: t('Aspirino sintezė yra fenolio O-acilinimas anhidridu rūgščioje terpėje: sieros rūgštis protonizuoja anhidrido karbonilgrupę ir padaro ją elektrofiline.',
              'Aspirin synthesis is O-acylation of a phenol by an anhydride in acid: sulfuric acid protonates the carbonyl group of the anhydride and makes it more electrophilic.'),
            src: 'L12 p12–13'
          },
          { scheme: sch(['OC(=O)c1ccccc1O', 'CC(=O)OC(C)=O'], f('H2SO4'), [{ smi: 'CC(=O)Oc1ccccc1C(=O)O', name: t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid') }, 'CC(=O)O']), src: 'L12 p12' },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'OC(=O)c1ccccc1O', opts: { lonePairs: [9] } }, { plus: true }, { smi: 'CC(=O)OC(C)=[OH+]' }, { arrow: '→' }, { smi: 'OC(=O)c1ccccc1[OH+]C(C)(O)OC(C)=O' }] },
                arrows: [{ from: { m: 0, lp: 9 }, to: { m: 1, a: 4 } }, { from: { m: 1, b: [4, 6] }, to: { m: 1, a: 6 } }],
                note: t('1 stadija: fenolio deguonies pora atakuoja aktyvuotą karbonilo anglį; $C=O$ π elektronai pereina deguoniui.', 'Stage 1: an oxygen lone pair of the phenol attacks the activated carbonyl carbon; the $C=O$ π electrons go to oxygen.')
              },
              {
                scheme: { items: [{ smi: 'OC(=O)c1ccccc1OC(C)(O)[OH+]C(C)=O', opts: { lonePairs: [12] } }, { arrow: '→' }, { smi: 'OC(=O)c1ccccc1OC(C)=[OH+]' }, { plus: true }, { smi: 'CC(=O)O' }] },
                arrows: [{ from: { m: 0, lp: 12 }, to: { m: 0, b: [10, 12] } }, { from: { m: 0, b: [10, 13] }, to: { m: 0, a: 13 } }],
                note: t('2 stadija: po protono perkėlimo (HSO₄⁻) $OH$ pora atkuria $C=O$ ir išeina acto rūgštis; vėl netenkama protono.', 'Stage 2: after proton transfers (HSO₄⁻) an $OH$ lone pair restores $C=O$ and acetic acid leaves; a last proton is lost.')
              }
            ],
            src: 'L12 p13'
          },
          { h: t('Oksidacija', 'Oxidation') },
          {
            p: t('Rūgščioje terpėje fenolis oksiduojasi į chinoną; hidrochinonas oksiduojasi dar lengviau. p-Chinonas susidaro tik tada, kai p padėtis OH atžvilgiu laisva. Chinonai ir hidrochinonai sudaro grįžtamąją redokso porą, kuria remiasi ubichinonų darbas mitochondrijose.',
              'In acid a phenol is oxidised to a quinone, and hydroquinone is oxidised even more easily. A p-quinone forms only when the position para to OH is free. Quinones and hydroquinones form a reversible redox pair, which is how ubiquinones work in mitochondria.'),
            src: 'L12 p14–16'
          },
          { scheme: sch(['Oc1ccccc1'], f('CrO3, CH3COOH, H2O, 0 °C'), [{ smi: 'O=C1C=CC(=O)C=C1' }]), src: 'L12 p14' },
          { scheme: sch(['Oc1ccc(O)cc1', 'OO'], f('100 °C'), ['O=C1C=CC(=O)C=C1', 'O', 'O']), caption: t('Brachinus genties vabalai šaudo karštu benzchinono tirpalu.', 'Bombardier beetles (Brachinus) spray a hot benzoquinone solution.'), src: 'L12 p15' },
          { h: t('Žiedo pakeitimas ir atpažinimas', 'Ring substitution and identification') },
          {
            p: t('OH grupė yra stipri o-/p- orientantė ir aktyvuoja žiedą, todėl fenolis brominasi kambario temperatūroje be katalizatoriaus: bromo vanduo iš karto duoda baltas 2,4,6-tribromfenolio nuosėdas. Praskiesta $HNO3$ duoda o- ir p-nitrofenolių mišinį, koncentruota – pikrino rūgštį.',
              'The OH group is a strong ortho/para director and activates the ring, so phenol is brominated at room temperature without a catalyst: bromine water at once gives a white precipitate of 2,4,6-tribromophenol. Dilute $HNO3$ gives a mixture of o- and p-nitrophenol, concentrated acid gives picric acid.'),
            src: 'L12 p17–18'
          },
          { scheme: sch(['Oc1ccccc1'], f('3 Br2 (H2O)'), [{ smi: 'Oc1c(Br)cc(Br)cc1Br', name: t('2,4,6-tribromfenolis', '2,4,6-tribromophenol') }]), caption: t('Šią reakciją galima atpažinti fenolį.', 'This reaction can be used to identify a phenol.'), src: 'L12 p17; LW6 p3' },
          {
            scheme: {
              items: [{ smi: 'Oc1ccccc1' }, { arrow: '→', above: t('praskiesta HNO3', 'dilute HNO3') }, { smi: 'Oc1ccccc1[N+](=O)[O-]' }, { plus: true }, { smi: 'Oc1ccc(cc1)[N+](=O)[O-]' }]
            },
            src: 'L12 p18'
          },
          { scheme: sch(['Oc1ccccc1'], t('konc. HNO3', 'conc. HNO3'), [{ smi: 'Oc1c(cc(cc1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]', name: t('2,4,6-trinitrofenolis', '2,4,6-trinitrophenol') }]), src: 'L12 p18' },
          {
            p: t('Su $FeCl3$ tirpalu fenoliai sudaro intensyviai violetinius kompleksus: $6 C6H5OH + FeCl3 → [Fe(OC6H5)6]^3-^ + 3 HCl + 3 H+$. Tai kokybinė fenolio reakcija; alkoholiai tokios spalvos neduoda.',
              'With a solution of $FeCl3$ phenols form intensely violet complexes: $6 C6H5OH + FeCl3 → [Fe(OC6H5)6]^3-^ + 3 HCl + 3 H+$. This is the qualitative test for a phenol; alcohols do not give the colour.'),
            src: 'L12 p10; T p76'
          },
          {
            pitfall: t('Brominimui bromo vandeniu FeBr₃ nereikia, o rezultatas yra trigubas pakeitimas, ne monobromidas. Jei $p$ padėtis užimta, bromas užima abi o- padėtis. Jei žiede yra stiprus akceptorius ($NO2$), žiedas aktyvuotas mažiau: su $Br2$/$FeBr3$ bromas įvedamas į padėtį orto OH atžvilgiu, ir susidaro monobromidas.',
              'Bromination with bromine water needs no FeBr₃, and the result is triple substitution, not a monobromide. If the para position is taken, bromine takes both ortho positions. If the ring carries a strong acceptor ($NO2$), it is less activated: $Br2$/$FeBr3$ puts one bromine ortho to OH and a monobromide forms.'),
            src: 'L12 p17'
          },
          {
            example: {
              q: [{ p: t('4-nitrofenolis tirpinamas NaOH, po to veikiamas etilbromidu. Kokį produktą gausime ir pagal kokį mechanizmą?', '4-Nitrophenol is dissolved in NaOH and then treated with ethyl bromide. What is the product and by which mechanism?') },
                { mol: { smi: 'Oc1ccc(cc1)[N+](=O)[O-]', name: t('4-nitrofenolis', '4-nitrophenol') } }],
              steps: [
                [{ p: t('NaOH atplėšia protoną nuo fenolio hidroksigrupės: susidaro 4-nitrofenoliatas.', 'NaOH removes the proton of the phenolic hydroxy group: 4-nitrophenoxide forms.') }],
                [{ p: t('Fenoliato deguonis nukleofiliškai atakuoja pirminio halogenalkano anglį (SN2) ir išstumia bromidą.', 'The phenoxide oxygen attacks the carbon of the primary halide (SN2) and displaces bromide.') }],
                [{ p: t('Produktas – arilalkileteris.', 'The product is an aryl alkyl ether.') }, { mol: { smi: 'CCOc1ccc(cc1)[N+](=O)[O-]', name: t('1-etoksi-4-nitrobenzenas', '1-ethoxy-4-nitrobenzene') } }]
              ]
            },
            claims: [{ react: ['phenol.alkyl', ['Oc1ccc(cc1)[N+](=O)[O-]', 'CCBr'], null, 'CCOc1ccc(cc1)[N+](=O)[O-]'] }, { name: ['CCOc1ccc(cc1)[N+](=O)[O-]', { lt: '1-etoksi-4-nitrobenzenas', en: '1-ethoxy-4-nitrobenzene' }] }]
          },
          { practice: 'u12.phenol' },
          { practice: 'u12.ring' }
        ]
      },

      /* ------------------------------------------------------------ 4 thiols */
      {
        id: 'thiol',
        title: t('Tioliai', 'Thiols'),
        blocks: [
          { h: t('Alkoholių sieros analogai', 'Sulfur analogues of alcohols') },
          {
            p: t('Tioliuose (merkaptanuose) yra merkapto grupė $-SH$. Jei molekulėje yra ir OH grupė, pavadinimas baigiamas -olis, o $SH$ vadinama priešdėliu merkapto-. Daugelis tiolių labai nemaloniai kvepia, pavyzdžiui, skunkų sekretas.',
              'Thiols (mercaptans) contain the mercapto group $-SH$. If the molecule also has an OH group, the name ends in -ol and $SH$ is the prefix mercapto-. Many thiols smell very unpleasant, for example the secretion of skunks.'),
            src: 'L12 p22'
          },
          { mol: [{ smi: 'CC(C)CCS', name: t('3-metil-1-butantiolis', '3-methylbutane-1-thiol') }, { smi: 'SC(C)(C)CCO' }] },
          {
            rule: t('Tioliai (pKa ≈ 10,5) yra stipresnės rūgštys už alkoholius (≈ 16): sieros atomas didesnis, todėl neigiamas krūvis alkilsulfido anijone pasiskirsto didesniame tūryje ir $RS-$ yra stabilesnis už $RO-$. Tioliatas yra silpna bazė, bet geras nukleofilas.',
              'Thiols (pKa ≈ 10.5) are stronger acids than alcohols (≈ 16): the sulfur atom is larger, so the negative charge of the alkyl sulfide anion is spread over a larger volume and $RS-$ is more stable than $RO-$. A thiolate is a weak base but a good nucleophile.'),
            src: 'L12 p22; T p79'
          },
          {
            scheme: sch(['CCS'], f('NaOH'), [{ smi: 'CC[S-].[Na+]', name: t('natrio etantioliatas', 'sodium ethanethiolate') }, 'O']),
            src: 'L12 p24'
          },
          {
            p: t('Tioliai reaguoja su sunkiųjų metalų oksidais ir druskomis: Hg, Pb, Cd druskos „nunuodija“ fermentus, nes jų SH grupes paverčia tioliatais. Priešnuodis yra ditiolis, sudarantis chelatą su metalu; britų BAL buvo sukurtas prieš arseno karo nuodą liuizitą.',
              'Thiols react with heavy-metal oxides and salts: Hg, Pb and Cd salts “poison” enzymes by turning their SH groups into thiolates. The antidote is a dithiol, which chelates the metal; the British BAL was made against the arsenic war gas lewisite.'),
            src: 'L12 p24–25'
          },
          { scheme: sch(['CCS', 'CCS', 'O=[Hg]'], null, ['CCS[Hg]SCC', 'O']), src: 'L12 p24' },
          { scheme: sch(['SCC(S)CO', 'Cl[Hg]Cl'], null, ['OCC1CS[Hg]S1', 'Cl', 'Cl']), caption: t('Ditiolis suriša gyvsidabrį į penkianarį chelatinį žiedą.', 'The dithiol ties up mercury in a five-membered chelate ring.'), src: 'L12 p25, p32' },
          { h: t('Alkilinimas', 'Alkylation') },
          {
            p: t('Tioliatas atakuoja halogenalkanus kaip nukleofilas (SN2) ir duoda sulfidą.',
              'A thiolate attacks alkyl halides as a nucleophile (SN2) and gives a sulfide.')
          },
          { scheme: sch(['CC[S-].[Na+]', 'CCBr'], null, ['CCSCC', '[Na+].[Br-]']), caption: t('Dietilsulfidas.', 'Diethyl sulfide.') },
          { h: t('Oksidacija iki disulfido', 'Oxidation to a disulfide') },
          {
            p: t('Silpni oksidatoriai (jodas šarminėje terpėje, bromas, $FeCl3$, $H2O2$) du tiolius sujungia į disulfidą $R-S-S-R$. Cinkas acto rūgštyje disulfidą vėl redukuoja iki tiolių. Mechanizmas: tioliatas atakuoja bromo molekulę, o gautas $R-S-Br$ atakuojamas antrojo tioliato.',
              'Weak oxidants (iodine in alkali, bromine, $FeCl3$, $H2O2$) join two thiols into a disulfide $R-S-S-R$. Zinc in acetic acid reduces the disulfide back to the thiols. Mechanism: a thiolate attacks the bromine molecule, then the $R-S-Br$ formed is attacked by a second thiolate.'),
            src: 'L12 p26'
          },
          { scheme: { items: [{ smi: 'CCS' }, { plus: true }, { smi: 'CCS' }, { arrow: '⇌', above: f('I2, NaOH, H2O'), below: f('Zn, CH3COOH') }, { smi: 'CCSSCC' }] }, src: 'L12 p26' },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'CC[S-]', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'CCSBr' }, { plus: true }, { smi: '[Br-]' }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
                note: t('1 stadija: tioliatas atakuoja $Br-Br$, bromidas išeina.', 'Stage 1: the thiolate attacks $Br-Br$ and bromide leaves.')
              },
              {
                scheme: { items: [{ smi: 'CC[S-]', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CCSBr' }, { arrow: '→' }, { smi: 'CCSSCC' }, { plus: true }, { smi: '[Br-]' }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 2 } }, { from: { m: 1, b: [2, 3] }, to: { m: 1, a: 3 } }],
                note: t('2 stadija: antrasis tioliatas atakuoja sierą ir išstumia bromidą; susidaro $S-S$ ryšys.', 'Stage 2: a second thiolate attacks sulfur and displaces bromide; the $S-S$ bond forms.')
              }
            ],
            src: 'L12 p26'
          },
          {
            p: t('Gyvuosiuose organizmuose tai yra cisteino ir cistino pora: disulfidiniai tilteliai palaiko baltymų tretinę struktūrą, o glutationas apsaugo ląsteles nuo oksidacijos. Plaukų sušukavimas remiasi tuo pačiu: tiltelius redukuoja, plaukams suteikia formą ir vėl oksiduoja.',
              'In living organisms this is the cysteine and cystine pair: disulfide bridges hold the tertiary structure of proteins, and glutathione protects cells from oxidation. A hair perm uses the same chemistry: the bridges are reduced, the hair is shaped and the bridges are oxidised again.'),
            src: 'L12 p27–30'
          },
          { scheme: { items: [{ smi: 'NC(CS)C(=O)O' }, { plus: true }, { smi: 'NC(CS)C(=O)O' }, { arrow: '⇌', above: f('[O]'), below: f('[H]') }, { smi: 'NC(CSSCC(N)C(=O)O)C(=O)O' }] }, src: 'L12 p27' },
          {
            pitfall: t('Tiolis rūgštesnis už alkoholį ne dėl elektroneigiamumo: siera už deguonį mažiau elektroneigiama. Lemia sieros atomo dydis.',
              'A thiol is more acidic than an alcohol not because of electronegativity: sulfur is less electronegative than oxygen. The size of the sulfur atom decides.')
          },
          {
            example: {
              q: [{ p: t('2-merkaptoetanolis veikiamas NaOH, po to $CH3I$. Kuri grupė reaguoja ir koks produktas?', '2-Mercaptoethanol is treated with NaOH, then $CH3I$. Which group reacts and what is the product?') },
                { mol: { smi: 'OCCS', name: t('2-merkaptoetanolis', '2-sulfanylethan-1-ol') } }],
              steps: [
                [{ p: t('Tiolis rūgštesnis (pKa ≈ 10,5) už alkoholį (≈ 16), todėl NaOH deprotonuoja tik $SH$ grupę.', 'The thiol is more acidic (pKa ≈ 10.5) than the alcohol (≈ 16), so NaOH deprotonates only the $SH$ group.') }],
                [{ p: t('Tioliato siera atakuoja metilo anglį (SN2) ir išstumia jodidą. OH grupė nepasikeičia.', 'The thiolate sulfur attacks the methyl carbon (SN2) and displaces iodide. The OH group is untouched.') }, { mol: { smi: 'OCCSC' } }]
              ]
            },
            claims: [{ react: ['thiol.alkyl', ['OCCS', 'CI'], null, 'OCCSC'] }, { formula: ['OCCSC', 'C3H8OS'] }]
          },
          { practice: 'u12.thiol' },
          { practice: 'u12.multi' }
        ]
      },

      /* ------------------------------------------------------------ 5 ethers */
      {
        id: 'ether',
        title: t('Eteriai ir jų sintezė', 'Ethers and how to make them'),
        blocks: [
          { h: t('Eteriai $R-O-R′$', 'Ethers $R-O-R′$') },
          {
            p: t('Eteriuose deguonis jungia du angliavandenilių radikalus. Jų pavadinimas sudaromas kaip alkoksi- darinys (metoksimetanas) arba iš abiejų radikalų pavadinimų (dimetileteris). Eteriai mažai reaktingi, todėl naudojami kaip tirpikliai; dietileteris buvo inhaliacinis anestetikas.',
              'In ethers an oxygen links two hydrocarbon radicals. The name is formed as an alkoxy derivative (methoxymethane) or from both radicals (dimethyl ether). Ethers are unreactive, so they serve as solvents; diethyl ether was an inhalation anaesthetic.'),
            src: 'L12 p33; T p78'
          },
          { mol: [{ smi: 'CCOCC', name: t('etoksietanas', 'ethoxyethane') }, { smi: 'CCOc1ccccc1', name: t('etoksibenzenas', 'ethoxybenzene') }, { smi: 'c1ccccc1Oc1ccccc1', name: t('fenoksibenzenas', 'phenoxybenzene') }] },
          { h: t('Viljamsono sintezė', 'Williamson synthesis') },
          {
            p: t('Alkoksido jonas yra nukleofilas ir bazė. Su metilo ar pirminiu halogenalkanu jis keičia halogeną (SN2) ir susidaro eteris.',
              'An alkoxide ion is a nucleophile and a base. With a methyl or primary alkyl halide it replaces the halogen (SN2) and an ether forms.'),
            src: 'S5.5'
          },
          {
            mech: [{
              scheme: { items: [{ smi: '[O-]C1CCCC1', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'COC1CCCC1' }, { plus: true }, { smi: '[I-]' }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
              note: t('Vienos stadijos SN2: alkoksido pora užpuola metilo anglį iš priešingos nuo $I$ pusės.', 'One-stage SN2: the alkoxide lone pair attacks the methyl carbon from the side opposite $I$.')
            }],
            src: 'S5.5; S5.8'
          },
          {
            rule: t('Eterio sintezei imkite tą variantą, kuriame halogenalkanas yra metilo ar pirminis: šakotesnė eterio dalis turi būti alkoksidas. Antriniai ir tretiniai halogenalkanai su alkoksidu eliminuojasi (E2), o arilhalogenidai SN2 nereaguoja.',
              'To make an ether choose the version in which the halide is methyl or primary: the more branched part of the ether must be the alkoxide. Secondary and tertiary halides eliminate (E2) with an alkoxide, and aryl halides do not react by SN2.'),
            src: 'S5.5; S5.6'
          },
          {
            scheme: sch(['CC(C)[O-].[Na+]', 'CI'], null, [{ smi: 'COC(C)C', name: t('2-metoksipropanas', '2-methoxypropane') }, '[Na+].[I-]']),
            caption: t('Tinkamas variantas: metilo halogenidas.', 'The good version: a methyl halide.')
          },
          {
            scheme: sch(['C[O-].[Na+]', 'CC(C)I'], null, ['CC=C', 'CO', '[Na+].[I-]']),
            caption: t('Blogas variantas: antrinis halogenalkanas eliminuojasi ir duoda alkeną.', 'The bad version: the secondary halide eliminates and gives the alkene.')
          },
          {
            pitfall: t('Fenilo halogenidas nėra SN2 substratas. Etoksibenzeną gauname iš fenoliato ir etilhalogenido, o ne iš etoksido ir brombenzeno.',
              'An aryl halide is not an SN2 substrate. Ethoxybenzene is made from phenoxide and an ethyl halide, not from ethoxide and bromobenzene.'),
            src: 'S5.6'
          },
          {
            example: {
              q: [{ p: t('Kokius reagentus parinkti etoksiciklopentanui gauti?', 'Which reagents should be chosen to make ethoxycyclopentane?') },
                { mol: { smi: 'CCOC1CCCC1', name: t('etoksiciklopentanas', 'ethoxycyclopentane') } }],
              steps: [
                [{ p: t('Eteris turi dvi $C-O$ jungtis, todėl galimi du variantai: ciklopentoksidas + etilhalogenidas arba etoksidas + ciklopentilhalogenidas.', 'The ether has two $C-O$ bonds, so there are two versions: cyclopentoxide + ethyl halide, or ethoxide + cyclopentyl halide.') }],
                [{ p: t('Etilo halogenidas yra pirminis, ciklopentilo – antrinis. Antrinis halogenidas su stipria baze eliminuotųsi.', 'The ethyl halide is primary, the cyclopentyl halide secondary. A secondary halide would eliminate with a strong base.') }],
                [{ p: t('Tinka ciklopentoksidas ir jodetanas, o mechanizmas – SN2.', 'Cyclopentoxide and iodoethane are the right pair; the mechanism is SN2.') }, { scheme: sch(['[O-]C1CCCC1.[Na+]', 'CCI'], null, ['CCOC1CCCC1', '[Na+].[I-]']) }]
              ]
            },
            claims: [{ react: ['williamson', ['CCOC1CCCC1'], null, 'CCI'] }, { name: ['CCOC1CCCC1', { lt: 'etoksiciklopentanas', en: 'ethoxycyclopentane' }] }]
          },
          { h: t('Eteriai iš alkoholių', 'Ethers from alcohols') },
          {
            p: t('Pirminį alkoholį kaitinant su sieros rūgštimi apie 140 °C, susidaro eteris, o apie 180 °C – alkenas. Eterio susidarymas yra SN2: protonizuotas alkoholis yra elektrofilas, antroji alkoholio molekulė – nukleofilas.',
              'Heating a primary alcohol with sulfuric acid at about 140 °C gives an ether, at about 180 °C an alkene. Ether formation is SN2: the protonated alcohol is the electrophile and a second alcohol molecule the nucleophile.'),
            src: 'T p73; S5.10'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'CCO', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CC[OH2+]' }, { arrow: '→' }, { smi: 'CC[OH+]CC' }, { plus: true }, { smi: 'O' }] },
              arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
              note: t('SN2: alkoholio deguonis atakuoja protonizuoto alkoholio anglį; išeina vanduo. Gautas oksonio jonas netenka protono ir virsta eteriu.', 'SN2: the alcohol oxygen attacks the carbon of the protonated alcohol and water leaves. The oxonium ion formed loses a proton and becomes the ether.')
            }],
            src: 'S5.10'
          },
          { practice: 'u12.will' },
          { practice: 'u12.mech' }
        ]
      },

      /* ------------------------------------------------------------ 6 ether cleavage */
      {
        id: 'cleave',
        title: t('Eterių skilimas rūgštyse', 'Cleavage of ethers by acids'),
        blocks: [
          { h: t('Kodėl eteris skyla tik stipriose rūgštyse', 'Why an ether is cleaved only by strong acids') },
          {
            p: t('Stipri rūgštis (HI, HBr) protonizuoja deguonį: susidaro oksonio jonas, o išeinanti molekulė jau yra alkoholis. Susidaro halogenalkanas ir alkoholis.',
              'A strong acid (HI, HBr) protonates the oxygen: an oxonium ion forms and the leaving molecule is now an alcohol. A haloalkane and an alcohol result.'),
            src: 'L12 p35'
          },
          {
            rule: t('Kuri jungtis nutrūksta, lemia mechanizmas. Jei gali susidaryti stabilus karbokatijonas (tretinis, alilo, benzilo), eteris skyla pagal SN1 ir halogenas jungiasi prie šios dalies. Priešingu atveju vyksta SN2: halogenidas atakuoja mažiau užstotą anglį, o alkoholis lieka iš šakotesnės dalies.',
              'The mechanism decides which bond breaks. If a stable carbocation can form (tertiary, allylic, benzylic) the ether is cleaved by SN1 and the halogen ends up on that part. Otherwise SN2 operates: the halide attacks the less hindered carbon and the alcohol comes from the more branched part.'),
            src: 'L12 p35–37; T p78'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'COC(C)C', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'I', opts: { allH: true } }, { arrow: '→' }, { smi: 'C[OH+]C(C)C' }, { plus: true }, { smi: '[I-]' }] },
                arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
                note: t('1 stadija: deguonies pora paima protoną iš HI.', 'Stage 1: an oxygen lone pair takes the proton from HI.')
              },
              {
                scheme: { items: [{ smi: '[I-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C[OH+]C(C)C' }, { arrow: '→' }, { smi: 'CI' }, { plus: true }, { smi: 'OC(C)C' }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
                note: t('2 stadija (SN2): jodidas atakuoja mažiau užstotą metilo anglį.', 'Stage 2 (SN2): iodide attacks the less hindered methyl carbon.')
              }
            ],
            caption: t('2-metoksipropanas ir HI: metilo halogenidas ir antrinis alkoholis.', '2-Methoxypropane and HI: the methyl halide and the secondary alcohol.'),
            src: 'L12 p36'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'COC(C)(C)C', opts: { lonePairs: [1] } }, { plus: true }, { smi: 'Br', opts: { allH: true } }, { arrow: '→' }, { smi: 'C[OH+]C(C)(C)C' }, { plus: true }, { smi: '[Br-]' }] },
                arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
                note: t('1 stadija: protonizacija.', 'Stage 1: protonation.')
              },
              {
                scheme: { items: [{ smi: 'C[OH+]C(C)(C)C', opts: { coords: [[0, 0.6], [0.9, 0], [2.4, 0], [2.4, -1.1], [3.3, 0.5], [3.3, -0.55]] } }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: 'C[C+](C)C' }] },
                arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 0, a: 1 } }],
                note: t('2 stadija (lėta): atskyla metanolis ir susidaro tretinis karbokatijonas.', 'Stage 2 (slow): methanol leaves and a tertiary carbocation forms.')
              },
              {
                scheme: { items: [{ smi: 'C[C+](C)C' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CC(C)(C)Br' }] },
                arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
                note: t('3 stadija (greita): bromidas jungiasi prie katijono.', 'Stage 3 (fast): bromide bonds to the cation.')
              }
            ],
            caption: t('2-metoksi-2-metilpropanas ir HBr: SN1, halogenas prie tretinio atomo.', '2-Methoxy-2-methylpropane and HBr: SN1, the halogen on the tertiary carbon.'),
            src: 'L12 p37'
          },
          {
            p: t('Jei rūgšties daugiau nei ekvivalentas, susidaręs alkoholis taip pat virsta halogenalkanu, todėl gaunami du halogenalkanai. Aril–$O$ jungtis neskyla: arilalkileteris duoda fenolį ir halogenalkaną.',
              'If more than one equivalent of acid is present, the alcohol formed is also converted to a haloalkane, so two haloalkanes result. An aryl–$O$ bond does not break: an aryl alkyl ether gives a phenol and a haloalkane.'),
            src: 'L12 p35'
          },
          { scheme: sch(['CCOCC', 'I', 'I'], t('perteklius, t', 'excess, heat'), ['CCI', 'CCI', 'O']), src: 'L12 p35' },
          { scheme: sch(['COc1ccccc1', 'I'], t('1 ekv., t', '1 equiv., heat'), ['Oc1ccccc1', 'CI']), caption: t('Fenolis lieka, nes jo $C-O$ jungtis nutrūkti negali.', 'The phenol remains, because its $C-O$ bond cannot break.'), src: 'Klein' },
          {
            pitfall: t('Nepriskirkite halogeno antriniam atomui, jei yra metilo ar pirminis. SN2 reakcijoje halogenidas eina prie mažiausiai užstoto anglies atomo, o ne prie tos pusės, kurioje yra daugiau pakaitų.',
              'Do not put the halogen on the secondary carbon when a methyl or primary carbon is available. In SN2 the halide goes to the least hindered carbon, not to the side with more substituents.')
          },
          {
            example: {
              q: [{ p: t('Kokie produktai susidaro benzilmetileterį veikiant 1 ekv. HBr?', 'What products form when benzyl methyl ether reacts with 1 equiv. of HBr?') },
                { mol: { smi: 'COCc1ccccc1', name: t('metoksimetilbenzenas', '(methoxymethyl)benzene') } }],
              steps: [
                [{ p: t('Pirmiausia deguonis protonizuojamas. Tada klausiame, ar gali susidaryti stabilus karbokatijonas.', 'First the oxygen is protonated. Then we ask whether a stable carbocation can form.') }],
                [{ p: t('Benzilo pusė duoda benzilkatijoną, stabilizuotą žiedo, todėl reakcija vyksta pagal SN1; metanolis yra nueinančioji grupė.', 'The benzyl side gives a benzyl cation stabilised by the ring, so the reaction is SN1; methanol is the leaving group.') }],
                [{ p: t('Bromidas jungiasi prie benzilkatijono.', 'Bromide bonds to the benzyl cation.') }, { scheme: sch(['COCc1ccccc1', 'Br'], null, ['BrCc1ccccc1', 'CO']) }]
              ]
            },
            claims: [{ react: ['ether.hi', ['COCc1ccccc1'], { acid: 'HBr' }, 'BrCc1ccccc1'] }, { react: ['ether.hi', ['COCc1ccccc1'], { acid: 'HBr' }, 'CO'] }, { name: ['COCc1ccccc1', { lt: 'metoksimetilbenzenas', en: '(methoxymethyl)benzene' }] }]
          },
          { practice: 'u12.cleave' }
        ]
      },

      /* ------------------------------------------------------------ 7 cyclic ethers */
      {
        id: 'cyclic',
        title: t('Cikliniai eteriai', 'Cyclic ethers'),
        blocks: [
          { h: t('Tetrahidrofuranas ir dioksanas', 'Tetrahydrofuran and dioxane') },
          {
            p: t('Penkianariai ir šešianariai cikliniai eteriai yra inertiški kaip acikliniai ir naudojami kaip tirpikliai. THF gaunamas iš 1,4-butandiolio ($H2SO4$) arba iš 4-chlorbutanolio (NaH) vidumolekuline SN2 reakcija.',
              'Five- and six-membered cyclic ethers are inert like acyclic ones and are used as solvents. THF is made from butane-1,4-diol ($H2SO4$) or from 4-chlorobutanol (NaH) by an intramolecular SN2.'),
            src: 'L12 p7, p38'
          },
          { mol: [{ smi: 'C1CCOC1', name: t('tetrahidrofuranas', 'tetrahydrofuran') }, { smi: 'C1COCCO1', name: t('dioksanas', 'dioxane') }] },
          { scheme: sch(['OCCCCO'], f('H2SO4'), ['C1CCOC1', 'O']), src: 'L12 p7' },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'OCCCCO', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'OS(=O)(=O)O', opts: { allH: true } }, { arrow: '→' }, { smi: '[OH2+]CCCCO' }, { plus: true }, { smi: 'OS(=O)(=O)[O-]' }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
                note: t('1 stadija: viena OH grupė protonizuojama.', 'Stage 1: one OH group is protonated.')
              },
              {
                scheme: { items: [{ smi: '[OH2+]CCCCO', opts: { lonePairs: [5] } }, { arrow: '→' }, { smi: 'C1CCC[OH+]1' }, { plus: true }, { smi: 'O' }] },
                arrows: [{ from: { m: 0, lp: 5 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 } }],
                note: t('2 stadija (vidumolekulinė SN2): kita OH grupė atakuoja anglį, vanduo išeina. 3 stadija: oksonio jonas netenka protono ir susidaro THF.', 'Stage 2 (intramolecular SN2): the other OH group attacks the carbon and water leaves. Stage 3: the oxonium ion loses a proton and THF forms.')
              }
            ],
            src: 'L12 p7'
          },
          {
            mech: [{
              scheme: { items: [{ smi: '[O-]CCCCCl', opts: { lonePairs: [0] } }, { arrow: '→' }, { smi: 'C1CCOC1' }, { plus: true }, { smi: '[Cl-]' }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, a: 4 } }, { from: { m: 0, b: [4, 5] }, to: { m: 0, a: 5 } }],
              note: t('NaH atplėšia protoną ir susidaro alkoksidas; šis atakuoja anglį su chloru (SN2), ir užsidaro žiedas.', 'NaH removes the proton to give the alkoxide; this attacks the carbon bearing chlorine (SN2) and the ring closes.')
            }],
            caption: t('4-chlor-1-butanolis ir NaH: žiedas užsidaro per vidumolekulinį Viljamsono procesą.', '4-Chlorobutan-1-ol and NaH: the ring closes by an intramolecular Williamson process.'),
            src: 'L12 p7'
          },
          { h: t('Epoksidai', 'Epoxides') },
          {
            p: t('Trinariai cikliniai eteriai, epoksidai (oksiranai), turi įtemptą žiedą, todėl yra labai reaktingi: nukleofilai jau švelniomis sąlygomis atveria žiedą ir susidaro prijungimo produktas. Bazinėje ar neutralioje terpėje nukleofilas atakuoja mažiau užstotą anglį.',
              'Three-membered cyclic ethers, epoxides (oxiranes), have a strained ring and are very reactive: nucleophiles open the ring under mild conditions and an addition product results. Under basic or neutral conditions the nucleophile attacks the less hindered carbon.'),
            src: 'L12 p38–39'
          },
          {
            mol: [{ smi: 'C1CO1', name: t('oksiranas (etilenoksidas)', 'oxirane (ethylene oxide)') }, { smi: 'CC1CO1', name: t('metiloksiranas', 'methyloxirane') }]
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'CC1CO1' }, { plus: true }, { smi: 'CN', opts: { lonePairs: [1] } }, { arrow: '→' }, { smi: 'CC([O-])C[NH2+]C' }] },
              arrows: [{ from: { m: 1, lp: 1 }, to: { m: 0, a: 2 } }, { from: { m: 0, b: [2, 3] }, to: { m: 0, a: 3 } }],
              note: t('Aminas atakuoja $CH2$ anglį, $C-O$ ryšys nutrūksta ir deguonis tampa alkoksidu.', 'The amine attacks the $CH2$ carbon, the $C-O$ bond breaks and oxygen becomes an alkoxide.')
            }],
            src: 'L12 p39, p43'
          },
          { scheme: sch(['CC([O-])C[NH2+]C'], null, ['CC(O)CNC']), caption: t('Protono perkėlimas duoda amino alkoholį.', 'A proton transfer gives the amino alcohol.'), src: 'L12 p39' },
          {
            p: t('Dėl šios savybės policikliniai aromatiniai angliavandeniliai kancerogeniški: citochromas P450 juos paverčia epoksidais, kuriuos atveria DNR aminogrupės.',
              'This explains why polycyclic aromatic hydrocarbons are carcinogenic: cytochrome P450 converts them into epoxides, which DNA amino groups open.'),
            src: 'L12 p40–42'
          },
          { scheme: sch(['c1ccccc1'], f('P450, O2'), ['C1=CC2OC2C=C1']), src: 'L12 p40' },
          { h: t('Krauneteriai', 'Crown ethers') },
          {
            p: t('Deguonies atomų laisvosios elektronų poros koordinuoja katijoną, telpantį į ertmę: Li⁺ – 12-kraun-4, Na⁺ – 15-kraun-5, K⁺ – 18-kraun-6 (pirmas skaičius – atomų skaičius žiede, antras – deguonių skaičius). Tokie „svečio–šeimininko“ kompleksai tirpsta organiniuose tirpikliuose. Toks kompleksas tirpsta organiniuose tirpikliuose, o nesolvatuotas anijonas tampa stipresniu nukleofilu.',
              'The oxygen lone pairs coordinate a cation that fits the cavity: Li⁺ with 12-crown-4, Na⁺ with 15-crown-5, K⁺ with 18-crown-6 (the first number is the ring size, the second the number of oxygens). Such host–guest complexes dissolve in organic solvents. The complex dissolves in organic solvents, and the unsolvated anion becomes a stronger nucleophile.'),
            src: 'L12 p44–45'
          },
          {
            table: {
              head: [t('Kraunas', 'Crown ether'), t('Suriša', 'Binds')],
              rows: [
                [{ smi: 'C1COCCOCCOCCO1', name: t('12-kraun-4', '12-crown-4') }, f('Li+')],
                [{ smi: 'C1COCCOCCOCCOCCO1', name: t('15-kraun-5', '15-crown-5') }, f('Na+')],
                [{ smi: 'C1COCCOCCOCCOCCOCCO1', name: t('18-kraun-6', '18-crown-6') }, f('K+')]
              ]
            },
            src: 'L12 p44–45'
          },
          { practice: 'u12.mech' }
        ]
      }
    ],

    summary: [
      { h: t('Santrauka', 'Cheat sheet') },
      {
        table: {
          head: [t('Junginys', 'Compound'), t('Reagentas', 'Reagent'), t('Rezultatas', 'Result')],
          rows: [
            [t('Poliolis', 'Polyol'), f('$Cu(OH)2$'), t('tamsiai mėlynas skaidrus tirpalas (OH prie gretimų C)', 'clear deep-blue solution (OH on adjacent carbons)')],
            [t('Poliolis', 'Polyol'), f('Na; Na, 150 °C'), t('monoalkoholiatas; dialkoholiatas', 'monoalkoxide; dialkoxide')],
            [t('Fenolis', 'Phenol'), f('NaOH'), t('fenoliatas (alkoholis su NaOH nereaguoja)', 'phenoxide (an alcohol does not react with NaOH)')],
            [t('Fenoliatas', 'Phenoxide'), f('RX; RCOCl'), t('arilalkileteris (SN2); arilesteris', 'aryl alkyl ether (SN2); aryl ester')],
            [t('Fenolis', 'Phenol'), f('FeCl3'), t('violetinis kompleksas', 'violet complex')],
            [t('Fenolis', 'Phenol'), f('3 Br2, H2O'), t('2,4,6-tribromfenolis, baltos nuosėdos', '2,4,6-tribromophenol, white precipitate')],
            [t('Fenolis', 'Phenol'), t('HNO3 praskiesta; konc.', 'HNO3 dilute; conc.'), t('o- ir p-nitrofenolis; pikrino rūgštis', 'o- and p-nitrophenol; picric acid')],
            [t('Fenolis', 'Phenol'), f('CrO3, H+'), t('1,4-benzchinonas', '1,4-benzoquinone')],
            [t('Tiolis', 'Thiol'), t('NaOH; Hg, Pb druskos', 'NaOH; Hg, Pb salts'), t('tioliatas; metalų tioliatai (Hg, Pb, Cd druskos – „tiolių nuodai“)', 'thiolate; metal thiolates (Hg, Pb, Cd salts are “thiol poisons”)')],
            [t('Tioliatas', 'Thiolate'), f('RX'), t('sulfidas (SN2)', 'sulfide (SN2)')],
            [t('Tiolis', 'Thiol'), f('I2, NaOH'), t('disulfidas $R-S-S-R$; $Zn$, $CH3COOH$ grąžina tiolį', 'disulfide $R-S-S-R$; $Zn$, $CH3COOH$ gives the thiol back')],
            [t('Alkoksidas', 'Alkoxide'), f('CH3X, RCH2X'), t('eteris (Viljamsonas, SN2); šakotesnė dalis – alkoksidas', 'ether (Williamson, SN2); the more branched part is the alkoxide')],
            [t('Etanolis', 'Ethanol'), f('H2SO4, 140 °C; 180 °C'), t('dietileteris (SN2); etenas', 'diethyl ether (SN2); ethene')],
            [t('Eteris', 'Ether'), t('HI, HBr (1 ekv.)', 'HI, HBr (1 equiv.)'), t('RX + R′OH; SN1 (tretinis, alilo, benzilo) arba SN2 (mažiau užstotas C)', 'RX + R′OH; SN1 (tertiary, allylic, benzylic) or SN2 (less hindered C)')],
            [t('Eteris', 'Ether'), t('HX perteklius', 'excess HX'), t('du halogenalkanai + $H2O$; ArOR duoda ArOH', 'two haloalkanes + $H2O$; ArOR gives ArOH')],
            [t('Epoksidas', 'Epoxide'), t('nukleofilas', 'nucleophile'), t('žiedas atsiveria, Nu prie mažiau užstoto C', 'ring opens, Nu on the less hindered C')]
          ]
        }
      },
      {
        list: [
          t('Rūgštingumas: fenoliai ≈ tioliai (pKa ≈ 10) > polioliai (≈ 14) > alkoholiai (≈ 16). Priežastis visada ta pati – konjuguotosios bazės stabilumas.', 'Acidity: phenols ≈ thiols (pKa ≈ 10) > polyols (≈ 14) > alcohols (≈ 16). The reason is always the same: the stability of the conjugate base.'),
          t('NO2 (−I, −M) rūgštingumą didina, NH2 ir CH3 (+M, +I) mažina.', 'NO2 (−I, −M) raises acidity, NH2 and CH3 (+M, +I) lower it.'),
          t('Viljamsonas: halogenalkanas metilo ar pirminis. Arilhalogenidas SN2 nereaguoja.', 'Williamson: the halide must be methyl or primary. An aryl halide does not react by SN2.'),
          t('Eterio skilimas: ar gali susidaryti stabilus karbokatijonas? Taip – SN1, ne – SN2.', 'Ether cleavage: can a stable carbocation form? Yes – SN1, no – SN2.')
        ]
      }
    ],

    types: [
      /* ------------------------------------------------------------ polyols (bank) */
      {
        id: 'u12.polyol',
        title: t('Polioliai ir vario hidroksido bandymas', 'Polyols and the copper hydroxide test'),
        mirrors: [],
        bank: [
          {
            id: 'u12.polyol.1',
            q: [
              { p: t('Į šviežiai nusodintą $Cu(OH)2$ pilamas vienas iš šių junginių.', 'One of these compounds is added to freshly precipitated $Cu(OH)2$.') },
              { mol: [{ smi: 'CCO' }, { smi: 'OCCO' }, { smi: 'OCCCO' }, { smi: 'OCC(O)CO' }, { smi: 'CC(C)O' }] }
            ],
            steps: [{
              prompt: t('Su kuriais junginiais nuosėdos ištirpsta ir susidaro mėlynas tirpalas?', 'With which compounds does the precipitate dissolve to a blue solution?'),
              kind: 'multi',
              options: [{ mol: { smi: 'CCO' } }, { mol: { smi: 'OCCO' } }, { mol: { smi: 'OCCCO' } }, { mol: { smi: 'OCC(O)CO' } }, { mol: { smi: 'CC(C)O' } }],
              answer: [1, 3],
              hint: t('Atsiminkite, kaip kompleksą sudaro deguonies atomai: kur turi būti OH grupės viena kitos atžvilgiu?', 'Remember how the oxygens bind the copper: where must the OH groups be relative to each other?'),
              solution: t('Tirpsta etandiolis ir glicerolis: jų OH grupės prie gretimų anglies atomų sudaro penkianarį chelatinį žiedą su variu. 1,3-propandiolio OH grupes skiria trys anglies atomai, o vienhidroksiliai alkoholiai chelato nesudaro.',
                'Ethanediol and glycerol dissolve: their OH groups on adjacent carbons form a five-membered chelate ring with copper. The OH groups of propane-1,3-diol are three carbons apart, and monohydric alcohols cannot chelate.')
            }],
            why: t('Vario joną sugriebia du gretimi deguonies atomai. Todėl bandymas rodo ne bet kurį poliolį, o hidroksigrupes prie gretimų anglies atomų.', 'Two adjacent oxygens grip the copper ion. So the test shows not just any polyol but hydroxy groups on adjacent carbons.'),
            src: 'L12 p3; LW6 p2'
          },
          {
            id: 'u12.polyol.2',
            q: [
              { p: t('Tas pats bandymas atliekamas su penkiais butano dariniais.', 'The same test is carried out with five butane derivatives.') },
              { mol: [{ smi: 'CCC(O)CO' }, { smi: 'OCCCCO' }, { smi: 'CC(O)CCO' }, { smi: 'OCC(O)C(O)CO' }, { smi: 'CCC(C)O' }] }
            ],
            steps: [{
              prompt: t('Kurie junginiai duos mėlyną tirpalą?', 'Which compounds give the blue solution?'),
              kind: 'multi',
              options: [{ mol: { smi: 'CCC(O)CO' } }, { mol: { smi: 'OCCCCO' } }, { mol: { smi: 'CC(O)CCO' } }, { mol: { smi: 'OCC(O)C(O)CO' } }, { mol: { smi: 'CCC(C)O' } }],
              answer: [0, 3],
              hint: t('Ieškokite OH grupių poros, kurias skiria tik vienas ryšys tarp anglies atomų.', 'Look for a pair of OH groups on carbons joined directly.'),
              solution: t('Tinka 1,2-butandiolis ir butantetrolis (jame yra gretimų OH grupių). 1,3- ir 1,4-dioliuose OH grupės per toli, o 2-butanolis turi tik vieną OH.', 'Butane-1,2-diol and the tetrol qualify (they have adjacent OH groups). In the 1,3- and 1,4-diols the OH groups are too far apart, and butan-2-ol has only one OH.')
            }],
            why: t('Svarbu ne OH grupių skaičius, o jų padėtis: reikia dviejų OH prie gretimų anglies atomų.', 'What matters is not the number of OH groups but their position: two OH groups on adjacent carbons are needed.'),
            src: 'L12 p3; LW6 p2'
          },
          {
            id: 'u12.polyol.3',
            q: [
              { p: t('Palyginkite trijų junginių rūgštingumą.', 'Compare the acidity of three compounds.') },
              { mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }, { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite nuo stipriausios iki silpniausios rūgšties.', 'Put them in order from the strongest to the weakest acid.'),
                kind: 'order',
                options: [{ text: t('fenolis', 'phenol') }, { text: t('1,2-etandiolis', 'ethane-1,2-diol') }, { text: t('etanolis', 'ethanol') }],
                hint: t('Palyginkite anijonus, kurie lieka praradus protoną.', 'Compare the anions that remain after the proton is lost.'),
                solution: t('Fenolis (pKa ≈ 10) > etandiolis (≈ 14) > etanolis (≈ 16).', 'Phenol (pKa ≈ 10) > ethanediol (≈ 14) > ethanol (≈ 16).')
              },
              {
                prompt: t('Kodėl etandiolis rūgštesnis už etanolį?', 'Why is ethanediol more acidic than ethanol?'),
                kind: 'choice',
                options: [
                  { text: t('Antroji OH grupė traukia elektronus (−I) ir stabilizuoja alkoholiato anijoną.', 'The second OH group withdraws electrons (−I) and stabilises the alkoxide anion.') },
                  { text: t('Antroji OH grupė turi dar vieną protoną, todėl rūgštis „stipresnė“.', 'The second OH group carries one more proton, so the acid is “stronger”.') },
                  { text: t('Antroji OH grupė stumia elektronus (+I) ir silpnina $O-H$ ryšį.', 'The second OH group pushes electrons (+I) and weakens the $O-H$ bond.') },
                  { text: t('Etandiolio anijonas turi rezonansines formules, o etoksido – ne.', 'The ethanediolate anion has resonance structures, ethoxide does not.') }
                ],
                answer: 0,
                hint: t('Pagalvokite apie anijono krūvį: ar kaimyninė grupė jį padeda išlaikyti?', 'Think about the charge of the anion: does the neighbouring group help to hold it?'),
                solution: t('Rūgštingumą lemia anijono stabilumas. Kaimyninė elektroneigiama OH grupė per indukcijos efektą ($-I$) sumažina krūvio tankį ant deguonies. Rezonansinių formulių čia nėra, o OH grupių skaičius pats savaime rūgštingumo nedidina.',
                  'Acidity follows the stability of the anion. The neighbouring electronegative OH group reduces the charge density on oxygen by the inductive effect ($-I$). There are no resonance structures here, and the number of OH groups does not raise acidity by itself.')
              }
            ],
            why: t('Rūgštis stipresnė, kai jos konjuguotoji bazė stabilesnė. Fenoliate krūvį išskleidžia žiedas, etandioliate – kaimyninė OH grupė, etoksidate krūvis lieka vienas.', 'An acid is stronger when its conjugate base is more stable. In phenoxide the ring spreads the charge, in ethanediolate the neighbouring OH group helps, in ethoxide the charge is on its own.'),
            src: 'L12 p3, p8'
          },
          {
            id: 'u12.polyol.4',
            q: [{ p: t('Mėgintuvėlyje $CuSO4$ tirpalas sumaišomas su NaOH, o po to įlašinama glicerolio ir sukratoma.', 'In a test tube $CuSO4$ solution is mixed with NaOH, then glycerol is added and the tube is shaken.') }],
            steps: [
              {
                prompt: t('Ką stebėsite?', 'What will you observe?'),
                kind: 'choice',
                options: [
                  { text: t('Pirmiausia susidaro mėlynos nuosėdos, kurios pridėjus glicerolio ištirpsta ir tirpalas tampa tamsiai mėlynas.', 'First a blue precipitate forms; on adding glycerol it dissolves and the solution turns deep blue.') },
                  { text: t('Mėlynos nuosėdos pridėjus glicerolio pasidaro raudonai rudos.', 'The blue precipitate turns red-brown on adding glycerol.') },
                  { text: t('Nuosėdos nesikeičia, nes glicerolis su $Cu(OH)2$ nereaguoja.', 'The precipitate is unchanged because glycerol does not react with $Cu(OH)2$.') },
                  { text: t('Išsiskiria dujos, nes glicerolis reaguoja kaip su natriu.', 'A gas is evolved because glycerol reacts as it does with sodium.') }
                ],
                answer: 0,
                hint: t('Pagalvokite, kas atsitinka su nuosėdomis, kai susidaro tirpus kompleksas.', 'Think what happens to a precipitate when a soluble complex forms.'),
                solution: t('Šviežias $Cu(OH)2$ yra nuosėdos. Glicerolis sudaro su juo tirpų mėlyną kompleksą, todėl nuosėdos išnyksta. Raudonai rudas $Cu2O$ susidaro aldehidų, o ne poliolių bandyme.', 'Fresh $Cu(OH)2$ is a precipitate. Glycerol forms a soluble blue complex with it, so the precipitate disappears. Red-brown $Cu2O$ appears in the aldehyde test, not in the polyol test.')
              },
              {
                prompt: t('Ar šiuo bandymu galima atpažinti bet kurį poliolį?', 'Can this test identify any polyol?'),
                kind: 'choice',
                options: [
                  { text: t('Ne, tik tuos, kurių OH grupės yra prie gretimų anglies atomų.', 'No, only those whose OH groups are on adjacent carbons.') },
                  { text: t('Taip, mėlynas tirpalas rodo bet kurią poliolio OH grupių porą.', 'Yes, the blue solution shows any pair of OH groups of a polyol.') },
                  { text: t('Ne, tik trihidroksilį glicerolį.', 'No, only the trihydric glycerol.') },
                  { text: t('Taip, taip pat atpažįstami ir vienhidroksiliai alkoholiai.', 'Yes, monohydric alcohols are identified too.') }
                ],
                answer: 0,
                hint: t('Kokia chelato žiedo struktūra reikalinga?', 'Which chelate ring structure is needed?'),
                solution: t('1,3- ir 1,4-dioliai šio komplekso nesudaro. Tinka etandiolis, glicerolis, cukrūs, kai kurios hidroksirūgštys.', '1,3- and 1,4-diols do not form this complex. Ethanediol, glycerol, sugars and some hydroxy acids do.')
              }
            ],
            why: t('Bandymas rodo struktūrinį motyvą, o ne junginių šeimą: dvi hidroksigrupes prie gretimų anglies atomų.', 'The test shows a structural motif, not a family of compounds: two hydroxy groups on adjacent carbons.'),
            src: 'LW6 p2; LW6 expl. p6'
          },
          {
            id: 'u12.polyol.5',
            q: [{ p: t('1,2-etandiolis reaguoja su natriu: a) su vienu ekvivalentu, b) su pertekliumi, kaitinant iki 150 °C.', 'Ethane-1,2-diol reacts with sodium: a) with one equivalent, b) with excess on heating to 150 °C.') }, { mol: { smi: 'OCCO' } }],
            steps: [
              {
                prompt: t('Koks yra a) produktas?', 'What is the product in a)?'),
                kind: 'choice',
                options: [{ mol: { smi: 'OCC[O-].[Na+]' } }, { mol: { smi: '[O-]CC[O-].[Na+].[Na+]' } }, { mol: { smi: '[Na]CCO' } }],
                answer: 0,
                hint: t('Kiek vandenilių pakeičia vienas ekvivalentas natrio?', 'How many hydrogens does one equivalent of sodium replace?'),
                solution: t('Natris pakeičia vieną OH vandenilį (išsiskiria $H2$): gaunamas monoalkoholiatas. Natris neprisijungia prie anglies.', 'Sodium replaces the hydrogen of one OH group ($H2$ escapes): the monoalkoxide forms. Sodium does not bond to carbon.')
              },
              {
                prompt: t('Koks yra b) produktas?', 'What is the product in b)?'),
                kind: 'choice',
                options: [{ mol: { smi: 'OCC[O-].[Na+]' } }, { mol: { smi: '[O-]CC[O-].[Na+].[Na+]' } }, { mol: { smi: '[Na]CCO' } }],
                answer: 1,
                hint: t('Pertekliui natrio kaitinant gali reaguoti abi hidroksigrupės.', 'With excess sodium and heat both hydroxy groups can react.'),
                solution: t('Pertekliui natrio abi OH grupės virsta alkoholiatais: gaunamas neutralusis dinatrio etandioliatas.', 'With excess sodium both OH groups become alkoxides: neutral disodium ethanediolate results.')
              }
            ],
            why: t('Kiekviena OH grupė gali atiduoti protoną. Kiek natrio ekvivalentų, tiek hidroksigrupių paprastai pakeičiama.', 'Each OH group can give up a proton. Roughly as many OH groups are replaced as there are equivalents of sodium.'),
            src: 'L12 p2'
          },
          {
            id: 'u12.polyol.6',
            q: [{ scheme: { items: [{ smi: 'OCC(O)CO' }, { plus: true }, { smi: 'O[N+](=O)[O-]' }, { plus: true }, { smi: 'O[N+](=O)[O-]' }, { plus: true }, { smi: 'O[N+](=O)[O-]' }, { arrow: '→', above: f('H2SO4') }] } }],
            steps: [
              {
                prompt: t('Koks produktas susidaro?', 'What is the product?'),
                kind: 'choice',
                options: [
                  { mol: { smi: '[O-][N+](=O)OCC(O[N+](=O)[O-])CO[N+](=O)[O-]' } },
                  { mol: { smi: '[O-][N+](=O)CC([N+](=O)[O-])C[N+](=O)[O-]' } },
                  { mol: { smi: '[O-][N+](=O)OCC(O)CO' } },
                  { mol: { smi: 'O=NOCC(ON=O)CON=O' } }
                ],
                answer: 0,
                hint: t('Azoto rūgštis čia reaguoja kaip rūgštis su alkoholiu: koks tai reakcijos tipas?', 'Here nitric acid reacts as an acid with an alcohol: what type of reaction is that?'),
                solution: t('Alkoholis ir rūgštis sudaro esterį. Tris OH grupes pakeitus nitratais gaunamas glicerolio trinitratas ($O-NO2$ ryšiai), o ne nitrojunginys su $C-N$ ryšiu.', 'An alcohol and an acid form an ester. Replacing three OH groups with nitrate gives glycerol trinitrate ($O-NO2$ bonds), not a nitro compound with $C-N$ bonds.')
              },
              {
                prompt: t('Kodėl tai esteris, o ne nitrojunginys?', 'Why is this an ester and not a nitro compound?'),
                kind: 'choice',
                options: [{ text: t('Alkoholio deguonis lieka molekulėje ir jungiasi su azotu: susidaro $C-O-N$ (esterio) ryšiai, o ne $C-N$.', 'The alcohol oxygen stays in the molecule and bonds to nitrogen: $C-O-N$ (ester) bonds form, not $C-N$.') },
                  { text: t('Azoto rūgštis pakeičia $C-H$ vandenilį nitrogrupe.', 'Nitric acid replaces a $C-H$ hydrogen with a nitro group.') },
                  { text: t('Esteriai susidaro tik su karboksirūgštimis.', 'Esters form only with carboxylic acids.') },
                  { text: t('Glicerolis yra bazė ir su rūgštimi sudaro druską.', 'Glycerol is a base and forms a salt with the acid.') }],
                answer: 0,
                hint: t('Kuris atomas iš glicerolio jungiasi su azotu: anglis ar deguonis?', 'Which atom of glycerol bonds to nitrogen: carbon or oxygen?'),
                solution: t('Reakcija vyksta ties OH grupėmis, nuo kurių atskyla vandenilis, todėl azotas jungiasi su deguonimi. Iš viso išsiskiria 3 $H2O$ molekulės.', 'The reaction takes place at the OH groups, which lose hydrogen, so nitrogen bonds to oxygen. Three $H2O$ molecules are released in all.')
              }
            ],
            why: t('Poliolių OH grupės reaguoja kaip alkoholių: su rūgštimis sudaro esterius, o vandens išsiskiria tiek, kiek susidaro esterio ryšių.', 'The OH groups of polyols react like those of alcohols: with acids they form esters, with one water released per ester bond.'),
            src: 'L12 p5',
            claims: [{ formula: ['[O-][N+](=O)OCC(O[N+](=O)[O-])CO[N+](=O)[O-]', 'C3H5N3O9'] }]
          },
          {
            id: 'u12.polyol.7',
            q: [{ p: t('Gliceroltributanoatas (modelinis riebalas) kaitinamas su praskiesta rūgštimi.', 'Glycerol tributanoate (a model fat) is heated with dilute acid.') }, { mol: { smi: 'CCCC(=O)OCC(OC(=O)CCC)COC(=O)CCC' } }],
            steps: [{
              prompt: t('Kurie produktai susidaro visiškai hidrolizei pasibaigus?', 'Which products form when the hydrolysis is complete?'),
              kind: 'choice',
              options: [
                { scheme: { items: [{ smi: 'OCC(O)CO' }, { plus: true }, { smi: 'CCCC(=O)O' }] } },
                { scheme: { items: [{ smi: 'OCC(O)CO' }, { plus: true }, { smi: 'CCCCO' }] } },
                { scheme: { items: [{ smi: 'OCC(O)CO' }, { plus: true }, { smi: 'CCCC=O' }] } },
                { scheme: { items: [{ smi: 'CCCC(=O)OCC(O)CO' }, { plus: true }, { smi: 'CCCC(=O)O' }] } }
              ],
              answer: 0,
              hint: t('Esterio hidrolizė yra esterinimo atvirkštinė reakcija: kuri pusė gauna OH?', 'Ester hydrolysis is the reverse of esterification: which side receives the OH?'),
              solution: t('Esterio $C(=O)-O$ ryšys skyla, vandens $OH$ atitenka acilo daliai: gaunama rūgštis, o deguonis lieka prie glicerolio, kuris tampa alkoholiu. Visiškai hidrolizei reikia 3 $H2O$, tada nelieka glicerolio monoesterio.',
                'The $C(=O)-O$ bond of the ester breaks and the $OH$ of water goes to the acyl part: an acid forms, and the oxygen stays on glycerol, which becomes an alcohol. Full hydrolysis takes 3 $H2O$, so no glycerol monoester remains.')
            }],
            why: t('Riebalai yra glicerolio ir karboksirūgščių esteriai. Rūgštinė hidrolizė (grįžtama) grąžina glicerolį ir rūgštis.', 'Fats are esters of glycerol and carboxylic acids. Acid hydrolysis (reversible) returns glycerol and the acids.'),
            src: 'L12 p4',
            claims: [{ react: ['ester.hydrolysis', ['CCCC(=O)OCC(OC(=O)CCC)COC(=O)CCC'], { medium: 'acid' }, 'OCC(O)CO'] }]
          },
          {
            id: 'u12.polyol.8',
            q: [{ p: t('Etandiolis lyginamas su etanoliu. Su kuriais reagentais etandiolis reaguoja, o etanolis pagal kursą – ne?', 'Ethanediol is compared with ethanol. With which reagents does ethanediol react but ethanol, in the course view, does not?') }],
            steps: [{
              prompt: t('Pažymėkite visus tinkamus reagentus.', 'Pick every suitable reagent.'),
              kind: 'multi',
              options: [
                { text: t('Metalinis natris', 'Metallic sodium') },
                { text: t('Vandeninis NaOH tirpalas', 'Aqueous NaOH solution') },
                { text: t('Šviežiai nusodintas $Cu(OH)2$', 'Freshly precipitated $Cu(OH)2$') },
                { text: t('Azoto rūgštis su $H2SO4$ (esterinimas)', 'Nitric acid with $H2SO4$ (esterification)') }
              ],
              answer: [1, 2],
              hint: t('Kuris reagentas reikalauja stipresnės rūgšties nei paprastas alkoholis?', 'Which reagent needs a stronger acid than an ordinary alcohol?'),
              solution: t('Natris reaguoja su abiem (alkoholiatai), azoto rūgštis esterina abu. Šarmą ir netirpų sunkiojo metalo hidroksidą neutralizuoja tik stipresnė rūgštis – poliolis.', 'Sodium reacts with both (alkoxides), and nitric acid esterifies both. Only the stronger acid, the polyol, neutralises an alkali and an insoluble heavy-metal hydroxide.')
            }],
            why: t('Poliolis yra stipresnė rūgštis dėl kaimyninės OH grupės. Todėl jis reaguoja su silpnesne baze (šarmu) ir su $Cu(OH)2$, o paprastas alkoholis – ne.', 'A polyol is the stronger acid because of the neighbouring OH group. So it reacts with the weaker base (alkali) and with $Cu(OH)2$, while a simple alcohol does not.'),
            src: 'L12 p2–3'
          }
        ]
      },

      /* ------------------------------------------------------------ acidity ranking (generator) */
      {
        id: 'u12.acid',
        title: t('Rūgštingumo eilė ir priežastis', 'Order of acidity and the reason'),
        mirrors: [],
        gen(rng, ctx) {
          // cls: al alcohol, alE alcohol with an electron-withdrawing group, polyol, ph phenol, phD phenol with a donor, phE phenol with an acceptor, th thiol
          const POOL = [
            { smi: 'CO', pka: 15.5, cls: 'al' }, { smi: 'CCO', pka: 15.9, cls: 'al' }, { smi: 'CC(C)O', pka: 17, cls: 'al' },
            { smi: 'CC(C)(C)O', pka: 18, cls: 'al' }, { smi: 'OCC(F)(F)F', pka: 12.4, cls: 'alE' }, { smi: 'OCCO', pka: 14.2, cls: 'polyol' },
            { smi: 'Oc1ccccc1', pka: 10, cls: 'ph' }, { smi: 'Cc1ccc(O)cc1', pka: 10.3, cls: 'phD' }, { smi: 'Nc1ccc(O)cc1', pka: 10.3, cls: 'phD' },
            { smi: 'Oc1ccc(Cl)cc1', pka: 9.4, cls: 'phE' }, { smi: 'Oc1ccc(cc1)[N+](=O)[O-]', pka: 7.2, cls: 'phE' },
            { smi: 'Oc1ccc(cc1[N+](=O)[O-])[N+](=O)[O-]', pka: 4.1, cls: 'phE' }, { smi: 'Oc1c(cc(cc1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]', pka: 0.4, cls: 'phE' },
            { smi: 'Oc1c(Br)cc(Br)cc1Br', pka: 6, cls: 'phE' }, { smi: 'CCS', pka: 10.6, cls: 'th' }, { smi: 'CCCCS', pka: 10.5, cls: 'th' }
          ];
          const REASON = {
            ring: {
              right: t('Fenoliato anijono krūvis delokalizuojamas žiede (rezonansinės formulės), o alkoholiato krūvis lieka ant deguonies.', 'The phenoxide charge is delocalised in the ring (resonance structures), while the alkoxide charge stays on oxygen.'),
              wrong: [t('Fenolio molekulėje daugiau anglies atomų, todėl $O-H$ ryšys silpnesnis.', 'The phenol molecule has more carbon atoms, so its $O-H$ bond is weaker.'),
                t('Alkilgrupė traukia elektronus ir stabilizuoja alkoholiato anijoną.', 'The alkyl group withdraws electrons and stabilises the alkoxide anion.'),
                t('Fenoliato anijonas turi mažiau rezonansinių formulių nei alkoholiato.', 'The phenoxide anion has fewer resonance structures than the alkoxide.')]
            },
            S: {
              right: t('Sieros atomas didesnis, todėl neigiamas krūvis alkilsulfido anijone pasiskirsto didesniame tūryje ir anijonas stabilesnis.', 'The sulfur atom is larger, so the negative charge of the alkyl sulfide anion is spread over a larger volume and the anion is more stable.'),
              wrong: [t('Siera elektroneigiamesnė už deguonį ir stipriau išlaiko neigiamą krūvį.', 'Sulfur is more electronegative than oxygen and holds the negative charge more strongly.'),
                t('Tiolio molekulės sudaro stipresnius vandenilinius ryšius, todėl jos lengviau praranda protoną.', 'Thiol molecules form stronger hydrogen bonds, so they lose the proton more easily.'),
                t('Alkilsulfido anijonas turi daugiau rezonansinių formulių nei alkoksidas.', 'The alkyl sulfide anion has more resonance structures than the alkoxide.')]
            },
            ewg: {
              right: t('Elektronus traukiantys pakaitai (−I ir (ar) −M) išskleidžia fenoliato neigiamą krūvį, todėl anijonas stabilesnis.', 'Electron-withdrawing substituents (−I and/or −M) spread the negative charge of the phenoxide, so the anion is more stable.'),
              wrong: [t('Elektronus traukiantys pakaitai stabilizuoja neutralią molekulę labiau nei anijoną.', 'Electron-withdrawing substituents stabilise the neutral molecule more than the anion.'),
                t('Tokie pakaitai didina elektronų tankį žiede ir padeda atplėšti protoną.', 'Such substituents raise the electron density of the ring and help to remove the proton.'),
                t('Pakaitai stipriau suriša protoną su deguonimi.', 'The substituents bind the proton to oxygen more strongly.')]
            },
            edg: {
              right: t('Elektronus stumiantis pakaitas (+I, +M) didina elektronų tankį ant deguonies ir destabilizuoja fenoliato anijoną.', 'An electron-donating substituent (+I, +M) raises the electron density on oxygen and destabilises the phenoxide anion.'),
              wrong: [t('Elektronus stumiantis pakaitas išskleidžia fenoliato krūvį ir jį stabilizuoja.', 'An electron-donating substituent spreads the phenoxide charge and stabilises it.'),
                t('Pakaitas didina molekulės masę ir silpnina $O-H$ ryšį.', 'The substituent raises the molecular mass and weakens the $O-H$ bond.'),
                t('Toks pakaitas keičia žiedo aromatiškumą ir mažina jo rezonansą su deguonimi.', 'Such a substituent changes the aromaticity of the ring and reduces its resonance with oxygen.')]
            },
            I: {
              right: t('Elektroneigiama gretima grupė (OH ar $CF3$) savo −I efektu stabilizuoja alkoholiato anijoną.', 'The electronegative neighbouring group (OH or $CF3$) stabilises the alkoxide anion through its −I effect.'),
              wrong: [t('Gretima grupė stumia elektronus (+I) ir stabilizuoja anijoną.', 'The neighbouring group pushes electrons (+I) and stabilises the anion.'),
                t('Gretima grupė turi daugiau protonų, todėl tirpalas rūgštesnis.', 'The neighbouring group carries more protons, so the solution is more acidic.'),
                t('Didesnė molekulė visada yra stipresnė rūgštis.', 'A larger molecule is always the stronger acid.')]
            },
            alkyl: {
              right: t('Alkilgrupės stumia elektronus (+I): kuo jų daugiau, tuo labiau destabilizuojamas alkoholiato anijonas.', 'Alkyl groups push electrons (+I): the more of them, the less stable the alkoxide anion.'),
              wrong: [t('Alkilgrupės traukia elektronus ir stabilizuoja alkoholiato anijoną.', 'Alkyl groups withdraw electrons and stabilise the alkoxide anion.'),
                t('Šakotas alkoholis yra didesnis ir geriau tirpsta vandenyje, todėl rūgštesnis.', 'A branched alcohol is larger and dissolves better in water, so it is more acidic.'),
                t('Tretinis alkoholio $O-H$ ryšys yra poliškesnis ir lengvai skyla.', 'The $O-H$ bond of a tertiary alcohol is more polar and breaks easily.')]
            }
          };
          const reasonKey = (a, b) => {
            const phen = (c) => c === 'ph' || c === 'phD' || c === 'phE';
            const alc = (c) => c === 'al' || c === 'polyol' || c === 'alE';
            if (a.cls === 'th' && alc(b.cls)) return 'S';
            if (phen(a.cls) && alc(b.cls)) return 'ring';
            if (a.cls === 'phE' && (b.cls === 'ph' || b.cls === 'phD' || b.cls === 'phE')) return 'ewg';
            if (a.cls === 'ph' && b.cls === 'phD') return 'edg';
            if ((a.cls === 'polyol' || a.cls === 'alE') && b.cls === 'al') return 'I';
            if (a.cls === 'al' && b.cls === 'al') return 'alkyl';
            return null;
          };
          const fmt = (x, lang) => (lang === 'lt' ? String(x).replace('.', ',') : String(x));
          for (let tries = 0; tries < 200; tries++) {
            const n = ctx.pick([3, 3, 4]);
            const chosen = ctx.shuffle(POOL).slice(0, n).sort((p, q) => p.pka - q.pka);
            if (chosen.some((c, i) => i && c.pka - chosen[i - 1].pka < 0.25)) continue;
            const isPh = (c) => c.cls === 'ph' || c.cls === 'phD' || c.cls === 'phE';
            if (chosen.some((a) => isPh(a) && chosen.some((b) => b.cls === 'th' && Math.abs(a.pka - b.pka) < 1.5))) continue;
            if (chosen.some((a) => a.smi === 'Oc1c(Br)cc(Br)cc1Br') && chosen.some((b) => b.smi === 'Oc1ccc(cc1)[N+](=O)[O-]')) continue;
            const names = chosen.map((c) => nm(ctx, c.smi));
            if (names.some((x) => !x)) continue;
            const pairs = [];
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const k = reasonKey(chosen[i], chosen[j]); if (k) pairs.push({ i, j, k }); }
            if (!pairs.length) continue;
            const pr = ctx.pick(pairs);
            const R = REASON[pr.k];
            const reasonOpts = [{ text: R.right }].concat(R.wrong.map((w) => ({ text: w })));
            const lt = chosen.map((c, i) => names[i].lt + ' (' + fmt(c.pka, 'lt') + ')').join(' > ');
            const en = chosen.map((c, i) => names[i].en + ' (' + fmt(c.pka, 'en') + ')').join(' > ');
            // order options must be written in the right order: strongest acid first
            const ordered = chosen.map((c, i) => ({ text: names[i] }));
            return {
              q: [
                { p: t('Palyginkite šių junginių rūgštingumą.', 'Compare the acidity of these compounds.') },
                { mol: ctx.shuffle(chosen.map((c, i) => ({ smi: c.smi, name: names[i] }))) }
              ],
              steps: [
                {
                  prompt: t('Išdėstykite junginius nuo stipriausios iki silpniausios rūgšties.', 'Put the compounds in order from the strongest to the weakest acid.'),
                  kind: 'order', options: ordered,
                  hint: t('Palyginkite anijonus, kurie lieka praradus protoną: kuo jis stabilesnis, tuo rūgštis stipresnė.', 'Compare the anions left after the proton is lost: the more stable it is, the stronger the acid.'),
                  solution: t('pKa: ' + lt, 'pKa: ' + en)
                },
                {
                  prompt: t('Kodėl šioje eilėje ' + names[pr.i].lt + ' yra stipresnė rūgštis už ' + names[pr.j].lt + '?', 'Why is ' + names[pr.i].en + ' a stronger acid than ' + names[pr.j].en + ' in this order?'),
                  kind: 'choice', options: reasonOpts, answer: 0,
                  hint: t('Nupieškite abu anijonus ir pažiūrėkite, kuris geriau išlaiko neigiamą krūvį.', 'Draw both anions and see which holds the negative charge better.'),
                  solution: R.right
                }
              ],
              why: t('Rūgštis stipresnė, kai jos konjuguotoji bazė stabilesnė. Stabilumą didina krūvio delokalizacija, didesnis atomas ir elektronus traukiantys pakaitai; mažina elektronus stumiantys pakaitai. ' + R.right.lt,
                'An acid is stronger when its conjugate base is more stable. Stability rises with charge delocalisation, a larger atom and electron-withdrawing substituents, and falls with electron-donating substituents. ' + R.right.en),
              src: 'L12 p8, p18, p21, p22'
            };
          }
          throw new Error('u12.acid: no usable trio');
        }
      },

      /* ------------------------------------------------------------ phenol OH reactions (generator) */
      {
        id: 'u12.phenol',
        title: t('Fenolio OH grupės reakcijos: fenoliatai, eteriai, esteriai', 'Reactions of the phenolic OH group: phenoxides, ethers, esters'),
        mirrors: ['S5.13', 'S5.17'],
        gen(rng, ctx) {
          const { chem, react } = ctx;
          const MONO = ['Oc1ccccc1', 'Oc1ccc(cc1)[N+](=O)[O-]', 'Oc1ccc(cc1)[N+](=O)[O-]', 'Oc1ccc(cc1)[N+](=O)[O-]', 'Oc1ccc(Cl)cc1', 'Oc1ccc(Br)cc1', 'Cc1ccc(O)cc1', 'Cc1cccc(O)c1', 'Cc1ccccc1O',
            'CCc1ccc(O)cc1', 'CC(C)(C)c1ccc(O)cc1', 'Oc1ccccc1Cl', 'Oc1ccccc1[N+](=O)[O-]', 'Oc1cccc(c1)[N+](=O)[O-]', 'Oc1ccc(F)cc1', 'Cc1ccc(Cl)cc1O'];
          const BI = ['{P}c1ccc(C{A})cc1', '{P}c1ccc(CC{A})cc1', '{P}c1ccc(CCC{A})cc1', '{P}c1ccc(C(C){A})cc1', '{P}c1ccccc1C{A}', '{P}c1cccc(C{A})c1',
            '{P}c1ccc(cc1)CC(C){A}', '{P}c1ccc(cc1)C(C)(C){A}'];
          const RX = [['CI', 'C', 'CH3I'], ['CCBr', 'CC', 'CH3CH2Br'], ['CCCBr', 'CCC', 'CH3CH2CH2Br'], ['CCCCBr', 'CCCC', 'CH3CH2CH2CH2Br'], ['CCI', 'CC', 'CH3CH2I'], ['CCCI', 'CCC', 'CH3CH2CH2I']];
          const fill = (tpl, p, a) => tpl.replace('{P}', p).replace('{A}', a);
                              const mode = ctx.pick(['mono', 'mono', 'bi', 'bi', 'bi']);

          if (mode === 'mono') {
            for (let tries = 0; tries < 60; tries++) {
              const sub = ctx.pick(MONO);
              const kind = ctx.pick(['me', 'me', 'ac', 'anh']);
              const cfg = {
                me: { rule: 'phenol.alkyl', hal: 'CI', E: 'CH3', label: f('1. NaOH  2. CH3I') },
                ac: { rule: 'phenol.acyl', hal: 'CC(=O)Cl', E: 'C(C)=O', label: f('1. NaOH  2. CH3COCl') },
                anh: { rule: 'phenol.acyl', hal: 'CC(=O)OC(C)=O', E: 'C(C)=O', label: f('(CH3CO)2O, H2SO4') }
              }[kind];
              const res = react.run(cfg.rule, [sub, cfg.hal]);
              const main = (res.products || []).filter((p) => p.major && !p.by);
              if (res.none || main.length !== 1) continue;
              const right = main[0].smi;
              const wrong = [];
              const ring = react.run('sear', [sub], { E: cfg.E });
              (ring.products || []).filter((p) => !p.by).forEach((p) => { if (!same(ctx, p.smi, right)) wrong.push(p.smi); });
              if (!wrong.length) {
                // a deactivated ring takes no Friedel-Crafts group: use the ring-substituted isomer of 4-nitrophenol
                const iso = { 'Oc1ccc(cc1)[N+](=O)[O-]': { 'CH3': 'Cc1cc(ccc1O)[N+](=O)[O-]', 'C(C)=O': 'CC(=O)c1cc(ccc1O)[N+](=O)[O-]' } }[sub];
                if (!iso) continue;
                wrong.push(iso[cfg.E]);
              }
              const salt = react.run('phenol.base', [sub], { metal: 'Na' }).products[0].smi;
              wrong.push(salt);
              const opts = molOptions(ctx, [right], wrong.slice(0, 2).concat(wrong.slice(-1)), 4);
              if (opts.length < 3) continue;
              const nmP = nm(ctx, right);
              const acyl = cfg.rule === 'phenol.acyl';
              const steps = [{
                prompt: t('Koks yra galutinis organinis produktas?', 'What is the final organic product?'),
                kind: 'choice', options: opts, answer: 0,
                hint: acyl
                  ? (kind === 'anh' ? t('Kuris atomas atakuoja protonizuotą anhidrido karbonilo anglį: žiedo anglis ar fenolio deguonis?', 'Which atom attacks the protonated carbonyl carbon of the anhydride: a ring carbon or the phenol oxygen?') : t('Pirmiausia pagalvokite, ką daro bazė, ir kuris atomas po to atakuoja karbonilo anglį.', 'First think what the base does, and which atom then attacks the carbonyl carbon.'))
                  : t('Pirmiausia pagalvokite, ką daro bazė, ir kuris atomas po to atakuoja halogenalkaną.', 'First think what the base does, and which atom then attacks the alkyl halide.'),
                solution: acyl
                  ? t('Fenolis (arba fenoliatas) atakuoja rūgšties darinio karbonilo anglį deguonimi: susidaro arilesteris. Acilinimas žiede (Friedel–Craftso) reikalautų Lewiso rūgšties, o ne fenoliato.',
                    'The phenol (or phenoxide) attacks the carbonyl carbon of the acid derivative with its oxygen: an aryl ester forms. Acylation on the ring (Friedel–Crafts) would need a Lewis acid, not a phenoxide.')
                  : t('NaOH paverčia fenolį fenoliatu; fenoliato deguonis atakuoja halogenalkano anglį (SN2) ir išstumia halogenidą. Susidaro arilalkileteris, o ne žiedo alkilinimo produktas.',
                    'NaOH turns the phenol into the phenoxide; the phenoxide oxygen attacks the carbon of the alkyl halide (SN2) and displaces the halide. An aryl alkyl ether forms, not a ring-alkylated product.')
              }];
              if (nmP) {
                steps.push({
                  prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: right }, answer: { smi: right },
                  hint: t('Pirmiausia raskite pagrindinę grandinę ar žiedą, tada išvardykite pakaitus abėcėlės tvarka.', 'First find the parent chain or ring, then list the substituents in alphabetical order.'),
                  solution: t(nmP.lt, nmP.en)
                });
              }
              if (!acyl) {
                steps.push({
                  prompt: t('Kuriuo mechanizmu fenoliatas reaguoja su halogenalkanu?', 'By which mechanism does the phenoxide react with the alkyl halide?'),
                  kind: 'choice', options: [{ text: f('SN2') }, { text: f('SN1') }, { text: f('E2') }, { text: f('SEAr') }], answer: 0,
                  hint: t('Ar gali susidaryti stabilus karbokatijonas? Kiek stadijų turi reakcija?', 'Could a stable carbocation form? How many stages does the reaction have?'),
                  solution: t('Metilo ar pirminį halogenalkaną stiprus nukleofilas atakuoja iš nugaros, vienoje stadijoje: SN2.', 'A strong nucleophile attacks the methyl or primary halide from the back in one stage: SN2.')
                });
              }
              return {
                q: [{ scheme: { items: [{ smi: sub }, { arrow: '→', above: cfg.label }] } }],
                steps,
                why: acyl
                  ? t('Fenoliatas (ar fenolis rūgščioje terpėje su anhidridu) yra deguonies nukleofilas. Jis atakuoja rūgšties darinio karbonilo anglį ir išstumia chloridą ar acetatą, todėl gaunamas esteris.',
                    'A phenoxide (or a phenol in acid with an anhydride) is an oxygen nucleophile. It attacks the carbonyl carbon of the acid derivative and displaces chloride or acetate, giving an ester.')
                  : t('Fenolis rūgštesnis už alkoholius, todėl NaOH jį paverčia nukleofilišku fenoliatu. Su metilo ar pirminiu halogenalkanu vyksta SN2 ir susidaro arilalkileteris (Viljamsono sintezė).',
                    'A phenol is more acidic than alcohols, so NaOH converts it to a nucleophilic phenoxide. With a methyl or primary halide SN2 follows and an aryl alkyl ether forms (Williamson synthesis).'),
                src: 'L12 p11–12, p20; S5.13'
              };
            }
            throw new Error('u12.phenol: no mono case');
          }

          // bifunctional substrates: a phenol OH and an alcohol OH
          for (let tries = 0; tries < 60; tries++) {
            const tpl = ctx.pick(BI);
            const [halide, R, hlab] = ctx.pick(RX);
            const regime = ctx.pick(['one', 'one', 'both']);
            const sub = fill(tpl, 'O', 'O');
            const m = chem.parse(sub);
            const phO = [], alO = [];
            m.atoms.forEach((a, i) => {
              if (a.el !== 'O' || m.nbr[i].length !== 1) return;
              (m.atoms[m.nbr[i][0]].aromatic ? phO : alO).push(i);
            });
            if (phO.length !== 1 || alO.length !== 1) continue;
            const phOnly = fill(tpl, R + 'O', 'O');
            const right = regime === 'one' ? phOnly : fill(tpl, R + 'O', 'O' + R);
            const eng = react.run('phenol.alkyl', [sub, halide]);
            const mj = (eng.products || []).filter((p) => p.major);
            if (mj.length !== 1 || !same(ctx, mj[0].smi, phOnly)) continue;
            if (chem.parse(right).atoms.some((a, i, arr) => a.el === 'O' && a.h > 0 && regime === 'both')) continue;
            const swap = fill(tpl, 'O', 'O' + R);
            const both = fill(tpl, R + 'O', 'O' + R);
            const salt = fill(tpl, '[O-]', 'O') + '.[Na+]';
            const wrong = regime === 'one' ? [swap, both, salt] : [phOnly, swap, salt];
            const opts = molOptions(ctx, [right], wrong, 4);
            const answerAtoms = regime === 'one' ? phO : phO.concat(alO);
            const reagent = regime === 'one' ? f('1. NaOH  2. ' + hlab) : t('1. NaH (perteklius)  2. ' + hlab + ' (perteklius)', '1. NaH (excess)  2. ' + hlab + ' (excess)');
            const steps = [
              {
                prompt: regime === 'one' ? t('Bakstelėkite deguonį, kurį deprotonuoja NaOH.', 'Tap the oxygen that NaOH deprotonates.') : t('Bakstelėkite deguonis, kuriuos deprotonuoja perteklinis NaH.', 'Tap the oxygens that excess NaH deprotonates.'),
                kind: 'atoms', mol: { smi: sub, opts: { numbers: 'all' } }, answer: answerAtoms.slice().sort((x, y) => x - y),
                hint: regime === 'one' ? t('Kuri OH grupė rūgštesnė ir ar NaOH pakanka jai deprotonuoti?', 'Which OH group is more acidic, and is NaOH enough to deprotonate it?') : t('Hidrido jonas yra labai stipri bazė: ką ji gali deprotonuoti?', 'The hydride ion is a very strong base: what can it deprotonate?'),
                solution: regime === 'one'
                  ? t('Fenolio deguonis (Nr. ' + (phO[0] + 1) + ') yra rūgštesnis (pKa ≈ 10), todėl NaOH jį deprotonuoja. Alkoholio OH (pKa ≈ 16) su NaOH nereaguoja.', 'The phenol oxygen (no. ' + (phO[0] + 1) + ') is more acidic (pKa ≈ 10), so NaOH deprotonates it. The alcohol OH (pKa ≈ 16) does not react with NaOH.')
                  : t('NaH pertekliumi deprotonuoja abi grupes: fenolio (Nr. ' + (phO[0] + 1) + ') ir alkoholio (Nr. ' + (alO[0] + 1) + ') deguonis.', 'Excess NaH deprotonates both groups: the phenol oxygen (no. ' + (phO[0] + 1) + ') and the alcohol oxygen (no. ' + (alO[0] + 1) + ').')
              },
              {
                prompt: t('Koks yra galutinis produktas?', 'What is the final product?'),
                kind: 'choice', options: opts, answer: 0,
                hint: t('Halogenalkanas atakuojamas anijoninių deguonies atomų: kiek jų susidarė?', 'The alkyl halide is attacked by the anionic oxygens: how many formed?'),
                solution: regime === 'one'
                  ? t('Susidaręs fenoliatas atakuoja halogenalkaną (SN2), todėl alkilinamas tik fenolio deguonis. Alkoholio OH lieka nepakitusi.', 'The phenoxide formed attacks the alkyl halide (SN2), so only the phenol oxygen is alkylated. The alcohol OH stays as it was.')
                  : t('Abu deguonys virto anijonais ir abu alkilinami pertekliumi halogenalkano: gaunamas dialkileteris.', 'Both oxygens became anions and both are alkylated by the excess halide: the diether results.')
              },
              {
                prompt: t('Kuriuo mechanizmu vyksta alkilinimas?', 'By which mechanism does the alkylation proceed?'),
                kind: 'choice', options: [{ text: f('SN2') }, { text: f('SN1') }, { text: f('E2') }, { text: f('AN') }], answer: 0,
                hint: t('Ar gali susidaryti stabilus karbokatijonas? Kiek stadijų turi reakcija?', 'Could a stable carbocation form? How many stages does the reaction have?'),
                solution: t('Anijonas atakuoja pirminį anglies atomą iš nugaros ir išstumia halogenidą vienoje stadijoje: SN2.', 'The anion attacks the primary carbon from the back and displaces the halide in one stage: SN2.')
              }
            ];
            return {
              q: [{ p: t('Molekulėje yra ir fenolio, ir alkoholio OH grupė.', 'The molecule has both a phenol and an alcohol OH group.') }, { scheme: { items: [{ smi: sub }, { arrow: '→', above: reagent }] } }],
              steps,
              why: t('Fenolis (pKa ≈ 10) rūgštesnis už alkoholį (pKa ≈ 16). Hidroksidas (jo konjuguotoji rūgštis vanduo, pKa ≈ 15,7) fenolį deprotonuoja beveik visiškai, o alkoholio – ne; alkoholio OH deprotonuoti reikia už hidroksidą stipresnės bazės (NaH, Na). Reakcijos vietą nulemia tai, kuris deguonis tampa anijonu.',
                'A phenol (pKa ≈ 10) is more acidic than an alcohol (pKa ≈ 16). Hydroxide (its conjugate acid, water, has pKa ≈ 15.7) deprotonates the phenol almost completely but not the alcohol; the alcohol OH needs a base stronger than hydroxide (NaH, Na). The reaction site is the oxygen that becomes the anion.'),
              src: 'L12 p11, p20; S5.13; S5.17'
            };
          }
          throw new Error('u12.phenol: no bifunctional case');
        }
      },

      /* ------------------------------------------------------------ SEAr of phenols (generator) */
      {
        id: 'u12.ring',
        title: t('Fenolio žiedo pakeitimas: brominimas ir nitrinimas', 'Ring substitution of phenols: bromination and nitration'),
        mirrors: ['S5.13', 'S5.17'],
        gen(rng, ctx) {
          const { chem, react } = ctx;
          const ALL = ['Oc1ccccc1', 'Cc1ccc(O)cc1', 'Cc1cccc(O)c1', 'Cc1ccccc1O', 'Oc1ccc(Cl)cc1', 'Oc1ccccc1Cl', 'CCc1ccc(O)cc1', 'CC(C)(C)c1ccc(O)cc1',
            'Oc1ccc(Br)cc1', 'Cc1cc(C)ccc1O', 'Oc1cccc(Cl)c1'];
          const NITRO = ['Oc1ccc(cc1)[N+](=O)[O-]', 'Oc1ccccc1[N+](=O)[O-]', 'Cc1cc(ccc1O)[N+](=O)[O-]', 'Oc1ccc(cc1Cl)[N+](=O)[O-]'];
          const brCount = (smi) => (chem.formula(chem.parse(smi)).Br || 0);
          // ring distances (1 ortho, 2 meta, 3 para) from the carbon of the phenol OH
          const ringInfo = (smi) => {
            const m = chem.parse(smi);
            const o = m.atoms.findIndex((a, i) => a.el === 'O' && m.nbr[i].length === 1 && m.atoms[m.nbr[i][0]].aromatic);
            if (o < 0) return null;
            const c0 = m.nbr[o][0];
            const d = {};
            d[c0] = 0;
            const q = [c0];
            while (q.length) { const x = q.shift(); m.nbr[x].forEach((y) => { if (m.atoms[y].aromatic && d[y] === undefined) { d[y] = d[x] + 1; q.push(y); } }); }
            return { m, d };
          };
          const subst = (smi, el) => {
            const r = ringInfo(smi);
            if (!r) return null;
            const out = [];
            Object.keys(r.d).forEach((k) => { if (r.m.nbr[+k].some((y) => !r.m.atoms[y].aromatic && r.m.atoms[y].el === el)) out.push(r.d[k]); });
            return out.sort();
          };
          const added = (p, s, el) => {
            const a = subst(p, el), b = subst(s, el);
            if (!a || !b) return null;
            b.forEach((x) => { const i = a.indexOf(x); if (i >= 0) a.splice(i, 1); });
            return a.length === 1 ? a[0] : null;
          };
          const mode = ctx.pick(['fe', 'fe', 'water']);

          if (mode === 'water') {
            for (let tries = 0; tries < 60; tries++) {
              const sub = ctx.pick(ALL.concat(NITRO));
              const res = react.run('phenol.br2', [sub]);
              const main = (res.products || []).filter((p) => p.major);
              if (res.none || main.length !== 1) continue;
              const right = main[0].smi;
              const nBr = brCount(right) - brCount(sub);
              if (nBr < 1) continue;
              const info = ringInfo(sub);
              const free = Object.keys(info.d).map(Number).filter((i) => info.m.atoms[i].h > 0 && (info.d[i] === 1 || info.d[i] === 3)).sort((x, y) => x - y);
              if (free.length !== nBr) continue;
              const mono = react.run('sear', [sub], { E: 'Br' }).products.filter((p) => !p.by);
              const wrong = mono.map((p) => p.smi).filter((s) => !same(ctx, s, right));
              if (wrong.length < 2) continue;
              const opts = molOptions(ctx, [right], wrong, 4);
              const nums = free.map((i) => i + 1).join(', ');
              return {
                q: [{ scheme: { items: [{ smi: sub }, { arrow: '→', above: t('Br2 (vandens tirpalas, perteklius)', 'Br2 (aqueous, excess)') }] } }],
                steps: [
                  {
                    prompt: t('Bakstelėkite žiedo anglis, prie kurių prisijungs bromas.', 'Tap the ring carbons that bromine bonds to.'),
                    kind: 'atoms', mol: { smi: sub, opts: { numbers: 'all' } }, answer: free,
                    hint: t('Kurios žiedo padėtys OH grupės atžvilgiu aktyvuotos ir dar laisvos?', 'Which ring positions are activated by the OH group and still free?'),
                    solution: t('Aktyvuotos laisvos o- ir p- padėtys: Nr. ' + nums + '. Visos jos brominamos, nes žiedas labai aktyvuotas.', 'The activated free ortho and para positions are no. ' + nums + '. All of them are brominated, because the ring is strongly activated.')
                  },
                  {
                    prompt: t('Koks yra produktas?', 'What is the product?'),
                    kind: 'choice', options: opts, answer: 0,
                    hint: t('Ar po pirmojo pakeitimo žiedas lieka aktyvus?', 'Does the ring stay activated after the first substitution?'),
                    solution: t('Susidaro polibromfenolis, kurį lengva atpažinti: iškrinta baltos nuosėdos. Reakcija nesustoja ties monobromidu, nes ir po pirmojo pakeitimo žiedas lieka pakankamai aktyvus.', 'A polybromophenol forms, which is easy to recognise: a white precipitate falls. The reaction does not stop at the monobromide, because the ring stays active enough after the first substitution.')
                  }
                ],
                why: t('OH grupė stipriai aktyvuoja žiedą (+M) ir nukreipia elektrofilą į o- ir p- padėtis, todėl bromo vanduo be katalizatoriaus pakeičia visus tuos vandenilius. Dėl to fenolis atpažįstamas pagal baltas nuosėdas.', 'The OH group strongly activates the ring (+M) and directs the electrophile to the ortho and para positions, so bromine water replaces all of those hydrogens without a catalyst. This is why a phenol is identified by a white precipitate.'),
                src: 'L12 p17, p20; LW6 p3'
              };
            }
            throw new Error('u12.ring: no water case');
          }

          for (let tries = 0; tries < 80; tries++) {
            const E = ctx.pick(['Br', 'Cl', 'NO2']);
            const sub = ctx.pick(E === 'NO2' ? ALL.concat(NITRO) : NITRO);
            const label = { Br: f('Br2, FeBr3'), Cl: f('Cl2, FeCl3'), NO2: t('praskiesta HNO3', 'dilute HNO3') }[E];
            const el = E === 'NO2' ? 'N' : E;
            const res = react.run('sear', [sub], { E });
            const prods = (res.products || []).filter((p) => !p.by);
            const rights = prods.filter((p) => p.major).map((p) => p.smi);
            const minors = prods.filter((p) => !p.major).map((p) => p.smi);
            if (res.none || !rights.length || rights.length > 2 || !minors.length) continue;
            // every main product ortho or para to OH, every minor one meta to OH; otherwise the case cannot be decided from the course rules
            if (rights.some((p) => { const d = added(p, sub, el); return d !== 1 && d !== 3; })) continue;
            if (minors.some((p) => added(p, sub, el) !== 2)) continue;
            const second = react.run('sear', [rights[0]], { E }).products.filter((p) => p.major && !p.by).map((p) => p.smi);
            const extra = second.filter((s) => !rights.some((r) => same(ctx, r, s)));
            const opts = molOptions(ctx, rights, minors.concat(extra.slice(0, 1)), 4);
            if (opts.length < 3) continue;
            const tie = rights.length === 2;
            const no2 = /\[N\+\]\(=O\)\[O-\]/.test(sub);
            const rightReason = no2
              ? t('OH (+M) aktyvuoja žiedą ir nukreipia elektrofilą į o- ir p- padėtis savo atžvilgiu; NO2 (−M) nukreipia į meta padėtis savo atžvilgiu. Tai tos pačios padėtys, todėl abi grupės veikia kartu.',
                'OH (+M) activates the ring and directs the electrophile ortho and para to itself; NO2 (−M) directs meta to itself. These are the same positions, so the two groups reinforce each other.')
              : t('OH grupė (+M) aktyvuoja žiedą ir nukreipia elektrofilą į o- ir p- padėtis.', 'The OH group (+M) activates the ring and directs the electrophile to the ortho and para positions.');
            const reasons = [
              { text: rightReason },
              { text: t('OH grupė deaktyvuoja žiedą ir nukreipia elektrofilą į meta padėtį.', 'The OH group deactivates the ring and directs the electrophile to the meta position.') },
              { text: t('Elektrofilas jungiasi ten, kur daugiausia vandenilių, nepriklausomai nuo pakaitų.', 'The electrophile bonds where there are most hydrogens, whatever the substituents.') },
              { text: no2 ? t('NO2 yra stipresnis orientantas ir nukreipia elektrofilą į o- ir p- savo atžvilgiu.', 'NO2 is the stronger director and sends the electrophile ortho and para to itself.') : t('Padėtį nulemia reagento tirpiklis, o pakaitų elektroniniai efektai nesvarbūs.', 'The position is set by the solvent of the reagent; the electronic effects of the substituents do not matter.') }
            ];
            return {
              q: [{ scheme: { items: [{ smi: sub }, { arrow: '→', above: label }] } }],
              steps: [
                {
                  prompt: tie ? t('Pažymėkite produktus, kurie susidaro pagrindiniais kiekiais.', 'Pick the products that form in main amounts.') : t('Koks yra pagrindinis produktas?', 'What is the main product?'),
                  kind: tie ? 'multi' : 'choice', options: opts, answer: tie ? rights.map((_, i) => i) : 0,
                  hint: t('Raskite stipriausią donorinę grupę ir žiedo padėtis, į kurias ji nukreipia.', 'Find the strongest donor group and the ring positions it directs to.'),
                  solution: tie ? t('Fenolyje o- ir p- padėtys duoda panašaus tipo tarpinį katijoną, todėl susidaro abu izomerai.', 'In the phenol the ortho and para positions give a similar intermediate, so both isomers form.')
                    : t('Susidaro vienas pagrindinis produktas: pakaitas patenka į padėtį, kurią nukreipia stipriausias donoras.', 'One main product forms: the substituent enters the position directed by the strongest donor.')
                },
                {
                  prompt: t('Kodėl elektrofilas patenka būtent ten?', 'Why does the electrophile enter exactly there?'),
                  kind: 'choice', options: reasons, answer: 0,
                  hint: t('Pažiūrėkite, kurios grupės žiedą aktyvuoja, o kurios deaktyvuoja.', 'Look at which groups activate the ring and which deactivate it.'),
                  solution: rightReason
                }
              ],
              why: t('Kryptį nulemia stipriausia donorinė grupė, o hidroksigrupė yra stiprus o-/p- orientantas. Elektrofilas patenka į o- ir p- padėtis ir sudaro stabiliausią tarpinį katijoną.', 'The strongest donor group decides the direction, and the hydroxy group is a strong ortho/para director. The electrophile enters the ortho and para positions, which give the most stable intermediate cation.'),
              src: 'L12 p17–18, p20; S5.13'
            };
          }
          throw new Error('u12.ring: no case');
        }
      },

      /* ------------------------------------------------------------ thiols (generator) */
      {
        id: 'u12.thiol',
        title: t('Tiolių reakcijos', 'Reactions of thiols'),
        mirrors: ['S5.14'],
        gen(rng, ctx) {
          const { chem, react } = ctx;
          const MONO_T = ['CC{S}', 'CCC{S}', 'CC(C){S}', 'CCCC{S}', 'CC(C)C{S}', 'CCC(C){S}', 'c1ccccc1C{S}'];
          const BI = ['C({A})C{S}', 'C({A})CC{S}', 'CC({A})CC(C){S}', 'C({A})CC(C){S}', 'CC({A})C{S}', 'C({A})C(C){S}', 'CC({A})C(C){S}', 'C({A})CCC{S}'];
          const RX = [['CI', 'C', 'CH3I'], ['CCBr', 'CC', 'CH3CH2Br'], ['CCCBr', 'CCC', 'CH3CH2CH2Br'], ['CCI', 'CC', 'CH3CH2I'], ['CCCCBr', 'CCCC', 'CH3CH2CH2CH2Br']];
          const fill = (tpl, a, s) => tpl.replace('{A}', a).replace('{S}', s);
          const regime = ctx.pick(['base', 'alkyl', 'alkyl', 'disulf', 'lead', 'both', 'both']);
          const bi = regime === 'base' || regime === 'both' ? true : ctx.pick([true, false]);
          const tpl = bi ? ctx.pick(BI) : ctx.pick(MONO_T);
          const [halide, R, hlab] = ctx.pick(RX);
          const A = bi ? 'O' : '';
          const sub = fill(tpl, 'O', 'S');
          const m = chem.parse(sub);
          const sIdx = [], oIdx = [];
          m.atoms.forEach((a, i) => { if (a.el === 'S' && m.nbr[i].length === 1) sIdx.push(i); if (a.el === 'O' && m.nbr[i].length === 1) oIdx.push(i); });
          if (sIdx.length !== 1 || (bi && oIdx.length !== 1)) throw new Error('u12.thiol: template');
          const na = '.[Na+]';
          let right, wrong, label, mechStep = false, why1, sol, hintP;
          if (regime === 'base') {
            right = fill(tpl, 'O', '[S-]') + na;
            wrong = [fill(tpl, '[O-]', 'S') + na, fill(tpl, '[O-]', '[S-]') + na + na, sub];
            label = f('NaOH');
            sol = t('Tiolis rūgštesnis (pKa ≈ 10,5) už alkoholį (≈ 16), todėl NaOH deprotonuoja tik $SH$ grupę ir susidaro tioliatas.', 'The thiol is more acidic (pKa ≈ 10.5) than the alcohol (≈ 16), so NaOH deprotonates only the $SH$ group and a thiolate forms.');
            hintP = t('Kuri grupė rūgštesnė: $SH$ ar $OH$?', 'Which group is more acidic: $SH$ or $OH$?');
          } else if (regime === 'alkyl') {
            const rs = react.run('thiol.alkyl', [sub, halide]);
            const mj = (rs.products || []).filter((p) => p.major);
            right = fill(tpl, A, 'S' + R);
            if (mj.length !== 1 || !same(ctx, mj[0].smi, right)) throw new Error('u12.thiol: engine disagrees');
            wrong = bi ? [fill(tpl, 'O' + R, 'S'), fill(tpl, 'O' + R, 'S' + R), fill(tpl, 'O', '[S-]') + na] : [fill(tpl, '', '[S-]') + na, react.run('thiol.disulfide', [sub]).products[0].smi];
            label = t('1. NaOH  2. ' + hlab, '1. NaOH  2. ' + hlab);
            mechStep = true;
            sol = t('NaOH deprotonuoja $SH$ grupę, o tioliatas atakuoja halogenalkano anglį (SN2) ir išstumia halogenidą: gaunamas sulfidas.', 'NaOH deprotonates the $SH$ group and the thiolate attacks the carbon of the alkyl halide (SN2), displacing the halide: a sulfide results.');
            hintP = t('Koks atomas po deprotonacijos tampa nukleofilu?', 'Which atom becomes the nucleophile after deprotonation?');
          } else if (regime === 'disulf') {
            const rs = react.run('thiol.disulfide', [sub]);
            if (rs.none) throw new Error('u12.thiol: disulfide');
            right = rs.products[0].smi;
            wrong = [fill(tpl, A, 'S(=O)(=O)O'), fill(tpl, '', '[S-]') + na, fill(tpl, A, 'S' + R)];
            if (bi) wrong[1] = fill(tpl, 'O', '[S-]') + na;
            label = f('I2, NaOH, H2O');
            sol = t('Silpnas oksidatorius (jodas šarmuose) du tiolius sujungia $S-S$ ryšiu: gaunamas disulfidas. Sulfonrūgštis susidarytų tik stipriai oksiduojant.', 'A weak oxidant (iodine in alkali) joins two thiols by an $S-S$ bond: a disulfide results. A sulfonic acid would need strong oxidation.');
            hintP = t('Kuris atomas oksiduojamas ir kiek tiolio molekulių reikia produktui?', 'Which atom is oxidised, and how many thiol molecules does the product need?');
          } else if (regime === 'lead') {
            const rs = react.run('thiol.base', [sub], { metal: 'Pb' });
            if (rs.none) throw new Error('u12.thiol: lead');
            right = rs.products[0].smi;
            wrong = [fill(tpl, A, 'SC(C)=O'), fill(tpl, A, 'S[Pb]OC(C)=O'), bi ? fill(tpl, 'O[Pb]OC(C)=O', 'S') : fill(tpl, '', 'S' + R)];
            label = f('$Pb(OCOCH3)2$');
            sol = t('Tiolis rūgštus, o švino acetatas – druska su silpna rūgštimi: $SH$ vandenilis pakeičiamas švinu, išsiskiria acto rūgštis. Susidaro švino tioliatas (tiolių nuodas).', 'The thiol is acidic and lead acetate is a salt of a weak acid: the $SH$ hydrogen is replaced by lead and acetic acid is released. Lead thiolate forms (a “thiol poison”).');
            hintP = t('Metalas pakeičia rūgštaus vandenilio atomą; kokia rūgštis išsiskiria?', 'The metal replaces an acidic hydrogen; which acid is released?');
          } else {
            right = fill(tpl, 'O' + R, 'S' + R);
            wrong = [fill(tpl, 'O', 'S' + R), fill(tpl, 'O' + R, 'S'), fill(tpl, 'O' + R, '[S-]') + na];
            label = t('1. Na (perteklius)  2. ' + hlab + ' (perteklius)', '1. Na (excess)  2. ' + hlab + ' (excess)');
            mechStep = true;
            sol = t('Natrio perteklius deprotonuoja ir $SH$, ir $OH$ grupes, o halogenalkano perteklius alkilina abu anijonus (SN2): gaunamas eteris ir sulfidas.', 'Excess sodium deprotonates both the $SH$ and the $OH$ group, and excess halide alkylates both anions (SN2): an ether and a sulfide result.');
            hintP = t('Aktyvusis metalas (Na) gali deprotonuoti abi grupes. Kiek anijonų susidaro?', 'An active metal (Na) can deprotonate both groups. How many anions form?');
          }
          const opts = molOptions(ctx, [right], wrong, 4);
          if (opts.length < 3) throw new Error('u12.thiol: options');
          const tapBoth = regime === 'both';
          const ans = tapBoth ? sIdx.concat(oIdx).sort((x, y) => x - y) : sIdx;
          const steps = [
            {
              prompt: tapBoth ? t('Bakstelėkite heteroatomus, kuriuos deprotonuoja natrio perteklius.', 'Tap the heteroatoms that excess sodium deprotonates.') : t('Bakstelėkite atomą, kuris reaguoja su baze ar metalu.', 'Tap the atom that reacts with the base or the metal.'),
              kind: 'atoms', mol: { smi: sub, opts: { numbers: 'all' } }, answer: ans,
              hint: hintP,
              solution: tapBoth ? t('Su Na reaguoja ir siera (Nr. ' + (sIdx[0] + 1) + '), ir deguonis (Nr. ' + (oIdx[0] + 1) + ').', 'Both sulfur (no. ' + (sIdx[0] + 1) + ') and oxygen (no. ' + (oIdx[0] + 1) + ') react with Na.')
                : t('Reaguoja sieros atomas (Nr. ' + (sIdx[0] + 1) + '): tiolio $S-H$ yra rūgštesnis nei alkoholio $O-H$.', 'The sulfur atom (no. ' + (sIdx[0] + 1) + ') reacts: the thiol $S-H$ is more acidic than the alcohol $O-H$.')
            },
            { prompt: t('Koks yra produktas?', 'What is the product?'), kind: 'choice', options: opts, answer: 0, hint: hintP, solution: sol }
          ];
          if (!bi) steps.shift();
          if (mechStep) {
            steps.push({
              prompt: t('Kuriuo mechanizmu vyksta alkilinimas?', 'By which mechanism does the alkylation proceed?'),
              kind: 'choice', options: [{ text: f('SN2') }, { text: f('SN1') }, { text: f('E2') }, { text: f('AE') }], answer: 0,
              hint: t('Ar gali susidaryti stabilus karbokatijonas? Kiek stadijų turi reakcija?', 'Could a stable carbocation form? How many stages does the reaction have?'),
              solution: t('Nukleofilas atakuoja anglį iš nugaros vienoje stadijoje: SN2.', 'The nucleophile attacks the carbon from the back in one stage: SN2.')
            });
          }
          return {
            q: [{ scheme: { items: [{ smi: sub }, { arrow: '→', above: label }] } }],
            steps,
            why: t('Tiolis yra stipresnė rūgštis už alkoholį, todėl tioliatas susidaro lengviau už alkoholiatą. Tioliatas – puikus nukleofilas, silpna bazė, o silpni oksidatoriai jungia du tiolius į disulfidą.', 'A thiol is a stronger acid than an alcohol, so a thiolate forms more readily than an alkoxide. A thiolate is an excellent nucleophile and a weak base, and weak oxidants join two thiols into a disulfide.'),
            src: 'L12 p22, p24, p26; S5.14'
          };
        }
      },

      /* ------------------------------------------------------------ Williamson (generator) */
      {
        id: 'u12.will',
        title: t('Viljamsono sintezė: kokius reagentus parinkti', 'Williamson synthesis: which reagents to choose'),
        mirrors: ['S5.5', 'S5.6'],
        gen(rng, ctx) {
          const { react } = ctx;
          // wh / wa: the halide and alkoxide of the rejected version when the engine does not list it
          const ETHERS = [
            { e: 'COC1CCCCC1' }, { e: 'COC(C)C' }, { e: 'CCCOC' }, { e: 'CCOc1ccccc1', wh: 'Ic1ccccc1', wa: 'CC[O-]' },
            { e: 'CCOC(C)(C)C', wh: 'CC(C)(C)I', wa: 'CC[O-]' }, { e: 'CCOC1CCCC1' }, { e: 'COc1ccccc1', wh: 'Ic1ccccc1', wa: 'C[O-]' },
            { e: 'CCOc1ccc(cc1)[N+](=O)[O-]', wh: 'Ic1ccc(cc1)[N+](=O)[O-]', wa: 'CC[O-]' }, { e: 'COC(C)CC' }, { e: 'CCC(CC)OC' },
            { e: 'COCc1ccccc1' }, { e: 'CCOCC(C)C' }, { e: 'CCCOc1ccccc1', wh: 'Ic1ccccc1', wa: 'CCC[O-]' }, { e: 'COC(C)(C)C', wh: 'CC(C)(C)I', wa: 'C[O-]' },
            { e: 'CCOC1CCCCC1' }, { e: 'COc1ccc(C)cc1', wh: 'Ic1ccc(C)cc1', wa: 'C[O-]' }, { e: 'CCCCOCC' }, { e: 'COC(C)C(C)C' }, { e: 'CCC(C)OCC' }
          ];
          const X = ctx.pick(['Cl', 'Br', 'I']);
          const hal = (s) => s.replace('I', X);
          const strip = (s) => s.replace('.[Na+]', '').replace('[Na+].', '');
          const neutral = (s) => strip(s).replace('[O-]', 'O');
          for (let tries = 0; tries < 40; tries++) {
            const ent = ctx.pick(ETHERS);
            const res = react.run('williamson', [ent.e]);
            const ps = res.products || [];
            if (res.none || ps.length % 2) continue;
            const routes = [];
            for (let i = 0; i < ps.length; i += 2) {
              const pair = [ps[i], ps[i + 1]];
              const h = pair.find((p) => !/\[O-\]/.test(p.smi)), a = pair.find((p) => /\[O-\]/.test(p.smi));
              if (!h || !a) continue;
              routes.push({ h: hal(h.smi), a: strip(a.smi), major: !!h.major });
            }
            const good = routes.filter((r) => r.major);
            if (!good.length || good.length > 2) continue;
            let bad = routes.filter((r) => !r.major);
            if (!bad.length && ent.wh) bad = [{ h: hal(ent.wh), a: ent.wa }];
            const tie = good.length === 2;
            if (!bad.length && !tie) continue;
            const route = (r) => ({ scheme: { items: [{ smi: r.a }, { plus: true }, { smi: r.h }] } });
            const neutralRoute = (r) => ({ scheme: { items: [{ smi: neutral(r.a) }, { plus: true }, { smi: r.h }] } });
            const opts = tie ? good.map(route).concat(good.map(neutralRoute)) : good.map(route).concat([route(bad[0]), neutralRoute(good[0])]);
            // the rejected halide decides the reason
            let kind = 'sec';
            if (!tie) {
              const mol = ctx.chem.parse(bad[0].h);
              const hc = mol.atoms.findIndex((a) => a.el === X);
              const carbon = mol.nbr[hc][0];
              kind = mol.atoms[carbon].aromatic ? 'aryl' : (mol.nbr[carbon].filter((j) => mol.atoms[j].el === 'C').length >= 3 ? 'tert' : 'sec');
            }
            const REASON = {
              aryl: t('Arilhalogenidas SN2 nereaguoja: nukleofilas negali atakuoti $sp2$ anglies iš nugaros.', 'An aryl halide does not react by SN2: the nucleophile cannot attack an $sp2$ carbon from the back.'),
              tert: t('Tretinis halogenalkanas su stipria baze (alkoksidu) eliminuojasi (E2), o ne pakeičiamas.', 'A tertiary halide eliminates (E2) with a strong base such as an alkoxide instead of being substituted.'),
              sec: t('Antrinis halogenalkanas su alkoksidu daugiausia eliminuojasi (E2) ir duoda alkeną.', 'A secondary halide mostly eliminates (E2) with an alkoxide and gives an alkene.')
            };
            const reasonOpts = tie
              ? [{ text: t('Abu halogenalkanai yra metilo ar pirminiai, todėl tinka abi kombinacijos (SN2).', 'Both halides are methyl or primary, so both combinations work (SN2).') },
                { text: t('Tinka tik šakotesnė dalis kaip halogenalkanas.', 'Only the more branched part works as the halide.') },
                { text: t('Tinka tik šakotesnė dalis kaip alkoksidas, nes pirminis halogenalkanas eliminuojasi.', 'Only the more branched part works as the alkoxide, because the primary halide eliminates.') },
                { text: t('Abi kombinacijos netinka: eteris iš alkoksido nesusidaro.', 'Neither works: an ether does not form from an alkoxide.') }]
              : [{ text: REASON[kind] },
                { text: t('Metilo ar pirminis halogenalkanas su alkoksidu eliminuojasi, todėl jis netinka.', 'A methyl or primary halide eliminates with an alkoxide, so it is unsuitable.') },
                { text: t('Alkoksidas yra silpnas nukleofilas, todėl reikia šakotesnio halogenalkano.', 'An alkoxide is a weak nucleophile, so a more branched halide is needed.') },
                { text: t('Reakcijos kryptis nepriklauso nuo halogenalkano struktūros.', 'The outcome does not depend on the structure of the halide.') }];
            return {
              q: [{ p: t('Eteris gaunamas Viljamsono sintezės būdu.', 'The ether is to be made by the Williamson synthesis.') }, { mol: nm(ctx, ent.e) ? { smi: ent.e, name: nm(ctx, ent.e) } : { smi: ent.e } }],
              steps: [
                {
                  prompt: tie ? t('Pažymėkite visas tinkamas alkoksido ir halogenalkano poras.', 'Pick every workable alkoxide and alkyl halide pair.') : t('Kuri alkoksido ir halogenalkano pora tinkamiausia?', 'Which alkoxide and halide pair is best?'),
                  kind: tie ? 'multi' : 'choice', options: opts, answer: tie ? [0, 1] : 0,
                  hint: t('Eteris turi dvi $C-O$ jungtis: pažiūrėkite, kuri halogenalkano anglis būtų metilo ar pirminė.', 'The ether has two $C-O$ bonds: see which halide carbon would be methyl or primary.'),
                  solution: tie ? t('Abi dalys yra metilo ar pirminės, todėl galimos abi kombinacijos.', 'Both parts are methyl or primary, so both combinations are possible.')
                    : t('Halogenalkanas turi būti metilo ar pirminis. Šakotesnė dalis imama kaip alkoksidas. Pats alkoholis (be bazės) su halogenalkanu nereaguoja.', 'The halide must be methyl or primary, so the more branched part is taken as the alkoxide. The alcohol itself (without a base) does not react with the halide.')
                },
                {
                  prompt: tie ? t('Kodėl tinka abi kombinacijos?', 'Why do both combinations work?') : t('Kodėl kita kombinacija netinka?', 'Why does the other combination fail?'),
                  kind: 'choice', options: reasonOpts, answer: 0,
                  hint: t('Alkoksidas yra ne tik nukleofilas, bet ir stipri bazė.', 'An alkoxide is not only a nucleophile but also a strong base.'),
                  solution: tie ? reasonOpts[0].text : REASON[kind]
                },
                {
                  prompt: t('Kuriuo mechanizmu vyksta sintezė?', 'By which mechanism does the synthesis proceed?'),
                  kind: 'choice', options: [{ text: f('SN2') }, { text: f('SN1') }, { text: f('E2') }, { text: f('SEAr') }], answer: 0,
                  hint: t('Ar gali susidaryti stabilus karbokatijonas? Kiek stadijų turi reakcija?', 'Could a stable carbocation form? How many stages does the reaction have?'),
                  solution: t('Alkoksidas atakuoja halogenalkano anglį iš nugaros: SN2.', 'The alkoxide attacks the carbon of the halide from the back: SN2.')
                }
              ],
              why: t('Alkoksidas – ir nukleofilas, ir stipri bazė. SN2 vyksta tik prie metilo ar pirminio anglies atomo; antriniuose ir tretiniuose dominuoja E2, o arilhalogenidai SN2 nereaguoja. Todėl šakotesnė eterio dalis visada imama kaip alkoksidas.',
                'An alkoxide is both a nucleophile and a strong base. SN2 works only at a methyl or primary carbon; secondary and tertiary halides mostly give E2, and aryl halides do not react by SN2. So the more branched part of the ether is always taken as the alkoxide.'),
              src: 'S5.5; S5.6'
            };
          }
          throw new Error('u12.will: no case');
        }
      },

      /* ------------------------------------------------------------ ether cleavage (generator) */
      {
        id: 'u12.cleave',
        title: t('Eterių skilimas HI ir HBr', 'Cleavage of ethers by HI and HBr'),
        mirrors: ['S5.18', 'S5.19'],
        gen(rng, ctx) {
          const { react } = ctx;
          const POOL = [
            { e: 'CC(C)(C)OCCC' }, { e: 'CCC(C)OCCC' }, { e: 'COC(C)(C)C' }, { e: 'CCOC(C)(C)C' }, { e: 'COC(C)C' }, { e: 'CCOC(C)C' }, { e: 'CCOCC' },
            { e: 'COC(C)CC' }, { e: 'COC1CCCCC1' }, { e: 'CCOC1CCCCC1' }, { e: 'CC(C)(C)OC1CCCCC1' }, { e: 'COCc1ccccc1' }, { e: 'CCOCc1ccccc1' },
            { e: 'C1CCOC1', ring: true }, { e: 'C1CCCOC1', ring: true },
            { e: 'COc1ccccc1', aryl: (X) => [X + 'c1ccccc1', 'CO'] }, { e: 'CCOc1ccccc1', aryl: (X) => [X + 'c1ccccc1', 'CCO'] },
            { e: 'COc1ccc(C)cc1', aryl: (X) => [X + 'c1ccc(C)cc1', 'CO'] }, { e: 'CCCOCCC' }, { e: 'CC(C)OC(C)C' }, { e: 'CCCOCc1ccccc1' }, { e: 'COC(C)(C)CC' },
            { e: 'CCOC(C)CC' }, { e: 'CCCCOC(C)(C)C' }, { e: 'CCCCOCCCC' }
          ];
          const uniq = (list) => { const seen = []; return list.filter((s) => { if (seen.some((x) => same(ctx, x, s))) return false; seen.push(s); return true; }); };
          // two equivalents of acid: both ends become C-X; identical fragments are listed twice (2 x) and water is included
          const eq2list = (list, ring) => (list.length === 1 && !ring ? [list[0], list[0]] : list).concat(['O']);
          const flat = (l) => l.map((s) => key(ctx, s)).sort().join('|');
          for (let tries = 0; tries < 80; tries++) {
            const ent = ctx.pick(POOL);
            const acid = ctx.pick(['HI', 'HBr']);
            const X = acid === 'HI' ? 'I' : 'Br';
            const eq = ent.aryl ? 1 : ctx.pick([1, 1, 2]);
            const r1 = react.run('ether.hi', [ent.e], { acid, eq: 1 });
            if (r1.none) continue;
            const mech = r1.mech;
            if (mech !== 'SN1' && mech !== 'SN2') continue;
            const majors1 = uniq((r1.products || []).filter((p) => p.major).map((p) => p.smi));
            const minors1 = uniq((r1.products || []).filter((p) => !p.major).map((p) => p.smi));
            if (!majors1.length || majors1.length > 2) continue;
            const hasX = (s) => new RegExp(X).test(s);
            const majors2 = ent.aryl ? [] : eq2list(uniq(react.run('ether.hi', [ent.e], { acid, eq: 2 }).products.filter((p) => p.major).map((p) => p.smi)), ent.ring);
            const rights = eq === 1 ? majors1 : majors2;
            if (!rights.length) continue;
            const wrongs = [];
            if (eq === 1) {
              if (minors1.length && flat(minors1) !== flat(majors1)) wrongs.push(minors1);
              if (majors2.length) wrongs.push(majors2);
            } else {
              wrongs.push(majors1);
              if (minors1.length && flat(minors1) !== flat(majors1)) wrongs.push(minors1);
            }
            if (ent.aryl) wrongs.push(ent.aryl(X));
            // hydrolysis instead of cleavage: the ether splits into alcohols, no halide
            if (!ent.ring) {
              const alc = uniq(minors1.concat(majors1).filter((s) => !hasX(s)));
              if (ent.aryl) { const ph = alc[0]; wrongs.push([ph, ent.aryl(X)[1]]); }
              else if (alc.length) wrongs.push(alc.length === 1 ? [alc[0], alc[0]] : alc);
            } else if (ent.e === 'C1CCOC1') wrongs.push(['OCCCCO']);
            const seenKeys = new Set([flat(rights)]);
            const optLists = [rights];
            wrongs.filter((w) => w.length).forEach((w) => { const k = flat(w); if (!seenKeys.has(k)) { seenKeys.add(k); optLists.push(w); } });
            if (optLists.length < 3) continue;
            const toOpt = (l) => ({ scheme: { items: l.reduce((acc, s, i) => acc.concat(i ? [{ plus: true }, { smi: s }] : [{ smi: s }]), []) } });
            const halide = rights.find((s) => hasX(s) && s !== 'O');
            const nmH = halide ? nm(ctx, halide) : null;
            const sn1 = mech === 'SN1';
            const label = t(eq + ' ekv. ' + acid + ', t', eq + ' equiv. ' + acid + ', heat');
            const mechOpts = [{ text: f('SN1') }, { text: f('SN2') }, { text: f('E1') }, { text: f('AE') }];
            const steps = [
              {
                prompt: t('Kuriuo mechanizmu skyla $C-O$ ryšys?', 'By which mechanism does the $C-O$ bond break?'),
                kind: 'choice', options: mechOpts, answer: sn1 ? 0 : 1,
                hint: t('Ar viena iš alkilgrupių gali sudaryti stabilų karbokatijoną (tretinį, alilo, benzilo)?', 'Can one of the alkyl groups form a stable carbocation (tertiary, allylic, benzylic)?'),
                solution: sn1 ? t('Viena dalis sudaro stabilų karbokatijoną, todėl vyksta SN1 ir halogenas jungiasi prie šios dalies.', 'One part forms a stable carbocation, so the cleavage is SN1 and the halogen goes to that part.')
                  : t('Stabilaus karbokatijono nėra, todėl vyksta SN2: halogenidas atakuoja mažiausiai užstotą anglį.', 'No stable carbocation is possible, so the cleavage is SN2: the halide attacks the least hindered carbon.')
              },
              {
                prompt: eq === 2 ? t('Kokie produktai susidaro su rūgšties pertekliumi?', 'Which products form with excess acid?') : t('Kokie produktai susidaro?', 'Which products form?'),
                kind: 'choice', options: optLists.slice(0, 4).map(toOpt), answer: 0,
                hint: t('Pirmiausia nuspręskite, prie kurios anglies jungiasi halogenas; tada pagalvokite, kas lieka iš kitos pusės.', 'First decide which carbon receives the halogen, then what is left on the other side.'),
                solution: eq === 2 ? (ent.ring ? t('Pirmiausia susidaręs alkoholis su rūgšties pertekliumi virsta halogenalkanu: abu grandinės galai virsta $C-X$ ir gaunamas dihalogenalkanas.', 'The alcohol formed first is converted into a haloalkane by the excess acid: both ends of the chain become $C-X$ and a dihaloalkane forms.')
                  : t('Pirmiausia susidaręs alkoholis su rūgšties pertekliumi virsta halogenalkanu: gaunami du halogenalkanai ir vanduo.', 'The alcohol formed first is converted into a haloalkane by the excess acid: two haloalkanes and water result.'))
                  : ent.aryl ? t('Aril–$O$ jungtis neskyla, nes $sp2$ anglyje SN nevyksta: gaunamas fenolis ir halogenalkanas.', 'The aryl–$O$ bond does not break, because substitution does not occur at an $sp2$ carbon: a phenol and a haloalkane result.')
                    : t('Skyla viena $C-O$ jungtis: halogenas lieka prie vienos dalies, o kita dalis tampa alkoholiu.', 'One $C-O$ bond breaks: the halogen goes to one part and the other part becomes the alcohol.')
              }
            ];
            if (nmH) {
              steps.push({
                prompt: t('Pavadinkite halogenalkaną.', 'Name the haloalkane.'), kind: 'name', mol: { smi: halide }, answer: { smi: halide },
                hint: t('Raskite pagrindinę grandinę ar žiedą ir sunumeruokite taip, kad pakaitas gautų mažiausią numerį.', 'Find the parent chain or ring and number it to give the substituent the lowest number.'),
                solution: t(nmH.lt, nmH.en)
              });
            }
            return {
              q: [{ p: t('Eteris kaitinamas su stipria rūgštimi.', 'The ether is heated with a strong acid.') }, { scheme: { items: [{ smi: ent.e }, { arrow: '→', above: label }] } }],
              steps,
              why: t('Rūgštis protonizuoja eterio deguonį ir $C-O$ ryšys skyla. Jei gali susidaryti stabilus karbokatijonas (tretinis, alilo, benzilo), vyksta SN1; kitaip halogenidas SN2 būdu atakuoja mažiausiai užstotą anglį. Rūgšties perteklius paverčia ir alkoholį halogenalkanu.',
                'The acid protonates the ether oxygen and the $C-O$ bond breaks. If a stable carbocation can form (tertiary, allylic, benzylic) the cleavage is SN1; otherwise the halide attacks the least hindered carbon by SN2. Excess acid also converts the alcohol into a haloalkane.'),
              src: 'L12 p35–37; S5.18; S5.19'
            };
          }
          throw new Error('u12.cleave: no case');
        }
      },

      /* ------------------------------------------------------------ multi-step chain (generator) */
      {
        id: 'u12.chain',
        title: t('Reakcijų grandinė: alkinas, alkoholis, eteris', 'Reaction chain: alkyne, alcohol, ether'),
        mirrors: ['S5.20'],
        gen(rng, ctx) {
          for (let k = 0; k < 40; k++) {
            try { return chainOnce(rng, ctx); } catch (e) { if (!/^u12.chain/.test(e.message)) throw e; }
          }
          throw new Error('u12.chain: no case');
        }
      },

      /* ------------------------------------------------------------ polyfunctional molecules (bank) */
      {
        id: 'u12.multi',
        title: t('Kelios funkcinės grupės: estradiolis, merkaptopentanolis, ditioliai', 'Several functional groups: estradiol, mercaptopentanol, dithiols'),
        mirrors: ['S5.14', 'S5.17'],
        bank: (function () {
          const E = 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2O';
          const En = t('estradiolis (stereochemija nenurodyta)', 'estradiol (stereochemistry omitted)');
          const M = 'CC(O)CC(C)S';
          const Mn = t('4-merkapto-2-pentanolis', '4-sulfanylpentan-2-ol');
          const D = 'SCC(O)CS';
          const Dn = null;
          const kin = t('Fenolio OH rūgštesnė už alkoholio OH, todėl hidroksidas deprotonuoja tik fenolį: reaguoja tas deguonis, kuris tampa anijonu.', 'The phenol OH is more acidic than the alcohol OH, so hydroxide deprotonates only the phenol: the oxygen that becomes the anion is the one that reacts.');
          return [
            mp({ id: 'u12.multi.1', p: t('Estradiolis (moteriškasis hormonas) turi fenolio ir antrinio alkoholio OH grupes.', 'Estradiol (a female hormone) has a phenol and a secondary alcohol OH group.'), sub: E, name: En,
              label: t('1. NaH (perteklius)  2. $CH3I$ (perteklius)', '1. NaH (excess)  2. $CH3I$ (excess)'),
              options: ['CC12CCC3C(CCc4cc(OC)ccc34)C1CCC2OC', 'CC12CCC3C(CCc4cc(OC)ccc34)C1CCC2O', 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2OC', 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2=O'],
              hint: t('Hidrido jonas yra labai stipri bazė. Kurias OH grupes jis deprotonuoja?', 'The hydride ion is a very strong base. Which OH groups does it deprotonate?'),
              sol: t('NaH pertekliumi deprotonuoja abi grupes, o $CH3I$ perteklius metilina alkoksidą ir fenoliatą (SN2): gaunamas dimetileteris.', 'Excess NaH deprotonates both groups, and excess $CH3I$ methylates the alkoxide and the phenoxide (SN2): the dimethyl ether results.'),
              why: t('Stipri bazė (NaH) deprotonuoja ir fenolį, ir alkoholį, todėl alkilinamos abi vietos.', 'A strong base (NaH) deprotonates both phenol and alcohol, so both sites are alkylated.'), src: 'S5.17a',
              claims: [{ formula: [E, 'C18H24O2'] }, { formula: ['CC12CCC3C(CCc4cc(OC)ccc34)C1CCC2OC', 'C20H28O2'] }] }),
            mp({ id: 'u12.multi.2', p: t('Estradiolis reaguoja su bromo vandeniu.', 'Estradiol reacts with bromine water.'), sub: E, name: En, label: f('Br2, H2O'),
              options: ['CC12CCC3C(CCc4c3cc(c(c4Br)O)Br)C1CCC2O', 'CC12CCC3C(CCc4c3cc(Br)c(O)c4)C1CCC2O', 'CC12CCC3C(CCc4c3ccc(O)c4Br)C1CCC2O', 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2Br'],
              hint: t('Raskite fenolio žiedo laisvas o- ir p- padėtis OH grupės atžvilgiu.', 'Find the free ortho and para positions of the phenol ring relative to OH.'),
              sol: t('Padėtį $p$ OH atžvilgiu užima žiedų sujungimo anglis, todėl bromas patenka į abi o- padėtis. Alkoholio OH nesikeičia.', 'The para position relative to OH is occupied by a ring-fusion carbon, so bromine enters both ortho positions. The alcohol OH is unchanged.'),
              why: t('Bromo vanduo brominia aktyvuotą fenolio žiedą visose laisvose o- ir p- padėtyse; alifatinė dalis nereaguoja.', 'Bromine water brominates the activated phenol ring at every free ortho and para position; the aliphatic part does not react.'), src: 'S5.17b',
              claims: [{ react: ['phenol.br2', [E], null, 'CC12CCC3C(CCc4c3cc(c(c4Br)O)Br)C1CCC2O'] }] }),
            mp({ id: 'u12.multi.3', p: t('Estradiolis tirpinamas NaOH, po to veikiamas metilo jodidu.', 'Estradiol is dissolved in NaOH and then treated with methyl iodide.'), sub: E, name: En, label: f('1. NaOH  2. CH3I'),
              options: ['CC12CCC3C(CCc4cc(OC)ccc34)C1CCC2O', 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2OC', 'CC12CCC3C(CCc4cc(OC)ccc34)C1CCC2OC', 'CC12CCC3C(CCc4cc([O-])ccc34)C1CCC2O.[Na+]'],
              hint: t('Ar NaOH pakankamai stipri bazė alkoholio OH deprotonuoti?', 'Is NaOH a strong enough base to deprotonate an alcohol OH?'),
              sol: t('NaOH deprotonuoja tik fenolį (pKa ≈ 10), alkoholio OH (≈ 16) – ne. Todėl metilinamas vien fenolio deguonis.', 'NaOH deprotonates only the phenol (pKa ≈ 10), not the alcohol OH (≈ 16). So only the phenol oxygen is methylated.'),
              why: kin, src: 'S5.17c',
              claims: [{ react: ['phenol.alkyl', [E, 'CI'], null, 'CC12CCC3C(CCc4cc(OC)ccc34)C1CCC2O'] }] }),
            {
              id: 'u12.multi.4',
              q: [{ p: t('Estradiolis oksiduojamas $K2Cr2O7$ vandeniniame tirpale.', 'Estradiol is oxidised with $K2Cr2O7$ in aqueous solution.') }, { scheme: { items: [{ smi: E, name: En }, { arrow: '→', above: f('K2Cr2O7, H2O') }] } }],
              steps: [{
                prompt: t('Kas atsitinka?', 'What happens?'),
                kind: 'choice',
                options: [
                  { text: t('Antrinis alkoholis oksiduojamas į ketoną.', 'The secondary alcohol is oxidised to a ketone.') },
                  { text: t('Fenolis oksiduojamas į chinoną, o alkoholio OH lieka.', 'The phenol is oxidised to a quinone and the alcohol OH stays.') },
                  { text: t('Abi OH grupės oksiduojamos ir susidaro dvi karbonilgrupės.', 'Both OH groups are oxidised and two carbonyl groups form.') },
                  { text: t('Alkoholis oksiduojamas į karboksirūgštį su grandinės nutrūkimu.', 'The alcohol is oxidised to a carboxylic acid with chain cleavage.') }
                ],
                answer: 0,
                hint: t('Kiek vandenilių turi anglis, prie kurios yra alkoholio OH, ir ar chinonas čia įmanomas?', 'How many hydrogens does the carbon of the alcohol OH carry, and is a quinone possible here?'),
                solution: [{ p: t('Antrinis alkoholis oksiduojasi į ketoną (estronas). Fenolis čia chinono nesudarytų: $p$ padėtį užima anglies pakaitas.', 'The secondary alcohol is oxidised to a ketone (estrone). The phenol cannot form a quinone here: the para position carries a carbon substituent.') },
                  { mol: { smi: 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2=O' } }]
              }],
              why: t('$CrO3$ ar $K2Cr2O7$ oksiduoja antrinį alkoholį į ketoną. Chinonui reikia, kad fenolio p padėtis būtų laisva, o čia jos nėra.', '$CrO3$ or $K2Cr2O7$ oxidises a secondary alcohol to a ketone. A quinone needs the para position of the phenol to be free, which is not so here.'),
              src: 'S5.17d', claims: [{ react: ['alc.ox', [E], { reagent: 'chromic' }, 'CC12CCC3C(CCc4cc(O)ccc34)C1CCC2=O'] }]
            },
            mp({ id: 'u12.multi.5', p: t('4-merkapto-2-pentanolis reaguoja su KOH, po to su etilbromidu.', '4-Sulfanylpentan-2-ol reacts with KOH and then with ethyl bromide.'), sub: M, name: Mn, label: f('1. KOH  2. CH3CH2Br'),
              options: ['CC(O)CC(C)SCC', 'CC(OCC)CC(C)S', 'CC(OCC)CC(C)SCC', 'CC(O)CC(C)[S-].[K+]'],
              hint: t('Kuri grupė rūgštesnė: $SH$ ar $OH$? Ką deprotonuoja KOH?', 'Which group is more acidic: $SH$ or $OH$? What does KOH deprotonate?'),
              sol: t('KOH deprotonuoja tik tiolį (pKa ≈ 10,5). Tioliatas atakuoja etilbromidą (SN2) ir duoda sulfidą; alkoholio OH nesikeičia.', 'KOH deprotonates only the thiol (pKa ≈ 10.5). The thiolate attacks ethyl bromide (SN2) and gives a sulfide; the alcohol OH is unchanged.'),
              why: t('Dėl rūgštingumo skirtumo šarmas (KOH) deprotonuoja tik tiolį, todėl alkilinama tik siera.', 'Because of the difference in acidity the alkali (KOH) deprotonates only the thiol, so only sulfur is alkylated.'), src: 'S5.14a',
              claims: [{ react: ['thiol.alkyl', [M, 'CCBr'], null, 'CC(O)CC(C)SCC'] }] }),
            mp({ id: 'u12.multi.6', p: t('Tas pats junginys veikiamas natrio pertekliumi, po to etilbromido pertekliumi.', 'The same compound is treated with excess sodium and then with excess ethyl bromide.'), sub: M, name: Mn, label: t('1. Na (perteklius)  2. CH3CH2Br (perteklius)', '1. Na (excess)  2. CH3CH2Br (excess)'),
              options: ['CC(OCC)CC(C)SCC', 'CC(O)CC(C)SCC', 'CC(OCC)CC(C)S', 'CC(O)CC(C)S'],
              hint: t('Kiek heteroatomų gali netekti protonų, kai natrio perteklius?', 'How many heteroatoms can lose a proton when sodium is in excess?'),
              sol: t('Natrio perteklius deprotonuoja ir $SH$, ir $OH$; abu anijonai atakuoja etilbromidą (SN2): gaunamas eterio ir sulfido produktas.', 'Excess sodium deprotonates both $SH$ and $OH$; both anions attack ethyl bromide (SN2): the ether-sulfide product forms.'),
              why: t('Stipria baze ar metalu deprotonuojamos abi grupės, todėl alkilinami abu centrai.', 'A strong base or metal deprotonates both groups, so both centres are alkylated.'), src: 'S5.14b',
              claims: [{ formula: ['CC(OCC)CC(C)SCC', 'C9H20OS'] }] }),
            mp({ id: 'u12.multi.7', p: t('Tas pats junginys veikiamas jodu šarminiame vandeniniame tirpale.', 'The same compound is treated with iodine in aqueous alkali.'), sub: M, name: Mn, label: f('I2, NaOH, H2O'),
              options: ['CC(O)CC(C)SSC(C)CC(C)O', 'CC(O)CC(C)S(=O)(=O)O', 'CC(=O)CC(C)S', 'CC(O)CC(C)[S-].[Na+]'],
              hint: t('Kuri grupė oksiduojasi lengviausiai: $SH$ ar $CH-OH$?', 'Which group is oxidised most easily: $SH$ or $CH-OH$?'),
              sol: t('Dvi tiolio molekulės jungiasi $S-S$ ryšiu: gaunamas disulfidas. Tiolio grupė oksiduojasi daug lengviau nei alkoholis, todėl esant nedideliam jodo kiekiui reaguoja tik $SH$. (Jodo perteklius šarme $CH3-CH(OH)-$ grupę paverstų jodoformu – tai 13 temos reakcija.)', 'Two thiol molecules join through an $S-S$ bond: a disulfide forms. The thiol group is oxidised far more easily than the alcohol, so with a limited amount of iodine only $SH$ reacts. (Excess iodine in alkali would turn the $CH3-CH(OH)-$ group into iodoform, a reaction of unit 13.)'),
              why: t('Tioliai silpnais oksidatoriais lengvai virsta disulfidais; alkoholiai tokiomis sąlygomis oksiduojasi daug lėčiau (jiems paprastai reikia $CrO3$, $K2Cr2O7$ ar PCC).', 'Thiols are easily turned into disulfides by weak oxidants; alcohols react much more slowly under these conditions (they normally need $CrO3$, $K2Cr2O7$ or PCC).'), src: 'S5.14c',
              claims: [{ react: ['thiol.disulfide', [M], null, 'CC(O)CC(C)SSC(C)CC(C)O'] }] }),
            mp({ id: 'u12.multi.8', p: t('Tas pats junginys veikiamas švino acetatu.', 'The same compound is treated with lead acetate.'), sub: M, name: Mn, label: f('$Pb(OCOCH3)2$'),
              options: ['CC(O)CC(C)S[Pb]SC(C)CC(C)O', 'CC(O)CC(C)SC(C)=O', 'CC(CC(C)S)O[Pb]OC(C)CC(C)S', 'CC(O)CC(C)S[Pb]OC(C)=O'],
              hint: t('Kuris vandenilis pakeičiamas švinu ir kokia rūgštis išsiskiria?', 'Which hydrogen is replaced by lead, and which acid is released?'),
              sol: t('Švinas keičia tiolio $SH$ vandenilį; išsiskiria acto rūgštis. Dvi tiolio molekulės jungiasi prie vieno švino: susidaro švino tioliatas.', 'Lead replaces the $SH$ hydrogen and acetic acid is released. Two thiol molecules bind one lead: lead thiolate forms.'),
              why: t('Tioliai sudaro sunkiųjų metalų tioliatus, todėl šių metalų druskos yra „tiolių nuodai“.', 'Thiols form heavy-metal thiolates, which is why salts of these metals are “thiol poisons”.'), src: 'S5.14d',
              claims: [{ react: ['thiol.base', [M], { metal: 'Pb' }, 'CC(O)CC(C)S[Pb]SC(C)CC(C)O'] }] }),
            mp({ id: 'u12.multi.9', p: t('Ditiolis veikiamas natrio pertekliumi.', 'A dithiol is treated with excess sodium.'), sub: D, name: Dn, label: t('Na (perteklius)', 'Na (excess)'),
              options: ['[S-]CC([O-])C[S-].[Na+].[Na+].[Na+]', '[S-]CC(O)C[S-].[Na+].[Na+]', 'SCC([O-])CS.[Na+]', 'S([Na])CC(O)CS'],
              hint: t('Kurios OH ar SH grupės praranda protonus, kai Na perteklius?', 'Which OH and SH groups lose protons when Na is in excess?'),
              sol: t('Natrio perteklius deprotonuoja visas tris grupes: gaunamas trinatrio darinys ($H2$ išsiskiria).', 'Excess sodium deprotonates all three groups: the trisodium derivative forms ($H2$ escapes).'),
              why: t('Metalas pakeičia kiekvieno rūgštaus $O-H$ ir $S-H$ vandenilį.', 'The metal replaces the hydrogen of every acidic $O-H$ and $S-H$ bond.'), src: 'L12 p32',
              claims: [{ react: ['alc.na', [D], { excess: true }, '[S-]CC([O-])C[S-].[Na+].[Na+].[Na+]'] }] }),
            mp({ id: 'u12.multi.10', p: t('Tas pats ditiolis veikiamas jodu šarminiame vandeniniame tirpale.', 'The same dithiol is treated with iodine in aqueous alkali.'), sub: D, name: Dn, label: f('I2, NaOH, H2O'),
              options: ['OC1CSSC1', 'OC(CS)CSSCC(O)CS', 'OC(CS(=O)(=O)O)CS', '[S-]CC(O)C[S-].[Na+].[Na+]'],
              hint: t('Dvi $SH$ grupės yra toje pačioje molekulėje. Koks žiedas susidarytų, jas sujungus?', 'The two $SH$ groups are in the same molecule. What ring would form if they joined?'),
              sol: t('Vidumolekulinis $S-S$ ryšys sujungia du sieros atomus per tris anglies atomus: užsidaro penkianaris žiedas.', 'An intramolecular $S-S$ bond joins the two sulfur atoms across three carbons: a five-membered ring closes.'),
              why: t('Kai du tioliai yra vienoje molekulėje, oksidacija dažniausiai duoda ciklinį disulfidą, o ne polimerą.', 'When two thiols are in one molecule, oxidation usually gives a cyclic disulfide rather than a polymer.'), src: 'L12 p32',
              claims: [{ react: ['thiol.disulfide', [D], null, 'OC1CSSC1'] }] })
          ];
        })()
      },

      /* ------------------------------------------------------------ ether mechanisms (bank) */
      {
        id: 'u12.mech',
        title: t('Eterių mechanizmai: dehidratacija, skilimas, žiedų užsidarymas', 'Ether mechanisms: dehydration, cleavage, ring closure'),
        mirrors: ['S5.5', 'S5.10', 'S5.18', 'S5.19'],
        bank: (function () {
          // protonation of an ether by HX (arrow from an oxygen lone pair to H, then H-X onto X)
          const prot = (ether, oIdx, X, protonated, note) => ({
            scheme: { items: [{ smi: ether, opts: { lonePairs: [oIdx] } }, { plus: true }, { smi: X, opts: { allH: true } }, { arrow: '→' }, { smi: protonated }, { plus: true }, { smi: '[' + X + '-]' }] },
            arrows: [{ from: { m: 0, lp: oIdx }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
            note
          });
          const pair = (a, b) => ({ scheme: { items: [{ smi: a }, { plus: true }, { smi: b }] } });
          const SNs = [{ text: f('SN1') }, { text: f('SN2') }, { text: f('E2') }, { text: f('AE') }];
          return [
            {
              id: 'u12.mech.1',
              q: [{ p: t('Dietileteris (eteris, vartojamas kaip tirpiklis) gaunamas, etanolį kaitinant su koncentruota $H2SO4$ apie 140 °C.', 'Diethyl ether, a common solvent, is made by heating ethanol with concentrated $H2SO4$ at about 140 °C.') },
                { scheme: { items: [{ smi: 'CCO' }, { plus: true }, { smi: 'CCO' }, { arrow: '→', above: f('H2SO4, 140 °C') }] } }],
              steps: [
                {
                  prompt: t('Pavadinkite susidarantį eterį (IUPAC pavadinimu).', 'Name the ether that forms (IUPAC name).'), kind: 'name', mol: { smi: 'CCOCC' }, answer: { smi: 'CCOCC' },
                  hint: t('Eterį vadinkite alkoksi- dariniu: pagrindinė grandinė su pakaitu $RO-$.', 'Name the ether as an alkoxy derivative: the main chain carrying an $RO-$ substituent.'),
                  solution: t('etoksietanas (dietileteris)', 'ethoxyethane (diethyl ether)')
                },
                {
                  prompt: t('Kuriuo mechanizmu vyksta ši reakcija?', 'By which mechanism does this reaction proceed?'), kind: 'choice', options: SNs, answer: 1,
                  hint: t('Pirminis alkoholis, o nukleofilas – kita alkoholio molekulė. Ar susidaro stabilus karbokatijonas?', 'A primary alcohol, and the nucleophile is another alcohol molecule. Does a stable carbocation form?'),
                  solution: t('Pirminis karbokatijonas nestabilus, todėl nukleofilas atakuoja protonizuotą alkoholį iš nugaros: SN2.', 'A primary carbocation is unstable, so the nucleophile attacks the protonated alcohol from the back: SN2.')
                },
                {
                  prompt: t('Išdėstykite stadijas teisinga tvarka.', 'Put the stages in the right order.'), kind: 'order',
                  options: [{ text: t('Vienos alkoholio molekulės deguonis protonizuojamas.', 'The oxygen of one alcohol molecule is protonated.') },
                    { text: t('Antrosios molekulės deguonis atakuoja anglį, išeina vanduo (SN2).', 'The oxygen of a second molecule attacks the carbon and water leaves (SN2).') },
                    { text: t('Oksonio jonas netenka protono ir susidaro eteris.', 'The oxonium ion loses a proton and the ether forms.') }],
                  hint: t('Vanduo yra gera nueinančioji grupė tik protonizuotas.', 'Water is a good leaving group only when the oxygen is protonated.'),
                  solution: [{ p: t('Pirmiausia deguonis protonizuojamas, nes $OH-$ yra bloga nueinančioji grupė. Tada vyksta SN2, o galiausiai netenkama protono.', 'The oxygen is protonated first, because $OH-$ is a poor leaving group. Then SN2 follows, and a proton is lost at the end.') },
                    { mech: [{
                      scheme: { items: [{ smi: 'CCO', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CC[OH2+]' }, { arrow: '→' }, { smi: 'CC[OH+]CC' }, { plus: true }, { smi: 'O' }] },
                      arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
                      note: t('SN2: alkoholio pora atakuoja protonizuoto alkoholio anglį.', 'SN2: the lone pair of the alcohol attacks the carbon of the protonated alcohol.')
                    }] }]
                }
              ],
              why: t('Eteris susidaro tarp dviejų alkoholio molekulių: viena tampa elektrofilu (protonizuojama), kita – nukleofilu. Aukštesnėje temperatūroje (apie 180 °C) vietoj to eliminuojamas vanduo ir susidaro alkenas.', 'The ether forms between two alcohol molecules: one becomes the electrophile (protonated), the other the nucleophile. At a higher temperature (about 180 °C) water is eliminated instead and the alkene forms.'),
              src: 'S5.10; T p73', claims: [{ name: ['CCOCC', { lt: 'etoksietanas', en: 'ethoxyethane' }] }]
            },
            {
              id: 'u12.mech.2',
              q: [{ p: t('Etanolis kaitinamas su koncentruota $H2SO4$ dviem skirtingomis temperatūromis.', 'Ethanol is heated with concentrated $H2SO4$ at two different temperatures.') }],
              steps: [{
                prompt: t('Kuris produktas susidaro žemesnėje, o kuris aukštesnėje temperatūroje?', 'Which product forms at the lower and which at the higher temperature?'), kind: 'choice',
                options: [
                  { text: t('Apie 140 °C – dietileteris (SN2), apie 180 °C – etenas (eliminavimas).', 'About 140 °C: diethyl ether (SN2); about 180 °C: ethene (elimination).') },
                  { text: t('Apie 140 °C – etenas, apie 180 °C – dietileteris.', 'About 140 °C: ethene; about 180 °C: diethyl ether.') },
                  { text: t('Abiem atvejais susidaro tik dietileteris, skiriasi tik greitis.', 'Both give only diethyl ether, only the rate differs.') },
                  { text: t('Apie 140 °C – acetaldehidas (oksidacija), apie 180 °C – etenas.', 'About 140 °C: acetaldehyde (oxidation); about 180 °C: ethene.') }
                ],
                answer: 0,
                hint: t('Kuri reakcija sujungia dvi molekules, o kuri vienoje molekulėje išskiria vandenį?', 'Which reaction joins two molecules, and which removes water from a single molecule?'),
                solution: t('Žemesnėje temperatūroje alkoholio perteklius sudaro eterį (tarpmolekulinė dehidratacija, SN2). Aukštesnėje vyksta vidumolekulinė dehidratacija ir susidaro alkenas.', 'At the lower temperature excess alcohol gives the ether (intermolecular dehydration, SN2). At the higher one intramolecular dehydration gives the alkene.')
              }],
              why: t('Dehidratacija gali būti tarpmolekulinė (eteris) arba vidumolekulinė (alkenas); jas skiria temperatūra ir alkoholio perteklius.', 'Dehydration can be intermolecular (ether) or intramolecular (alkene); temperature and excess alcohol decide between them.'),
              src: 'T p73; S5.10'
            },
            {
              id: 'u12.mech.3',
              q: [{ p: t('Eteris veikiamas 1 ekv. HBr ir kaitinamas.', 'The ether is heated with 1 equiv. of HBr.') }, { scheme: { items: [{ smi: 'CC(C)(C)OCCCC', name: t('tret-butilbutileteris', 'tert-butyl butyl ether'), opts: { numbers: 'all' } }, { arrow: '→', above: t('1 ekv. HBr, t', '1 equiv. HBr, heat') }] } }],
              steps: [
                {
                  prompt: t('Bakstelėkite $C-O$ ryšį, kuris nutrūksta.', 'Tap the $C-O$ bond that breaks.'), kind: 'atoms', bonds: true, mol: { smi: 'CC(C)(C)OCCCC', opts: { numbers: 'all' } }, answer: [[1, 4]],
                  hint: t('Kuri alkilgrupė gali sudaryti stabilų karbokatijoną?', 'Which alkyl group can form a stable carbocation?'),
                  solution: t('Skyla ryšys tarp deguonies (Nr. 5) ir tretinio anglies atomo (Nr. 2).', 'The bond between oxygen (no. 5) and the tertiary carbon (no. 2) breaks.')
                },
                {
                  prompt: t('Kuriuo mechanizmu?', 'By which mechanism?'), kind: 'choice', options: SNs, answer: 0,
                  hint: t('Ar susidaro karbokatijonas kaip tarpinis junginys?', 'Does a carbocation form as an intermediate?'),
                  solution: t('Iš tretinės dalies išeina stabilus tretinis katijonas, todėl SN1.', 'A stable tertiary cation leaves the tertiary part, so SN1.')
                },
                {
                  prompt: t('Kokie produktai susidaro?', 'Which products form?'), kind: 'choice',
                  options: [{ scheme: pair('CC(C)(C)Br', 'CCCCO').scheme }, { scheme: pair('CC(C)(C)O', 'CCCCBr').scheme }, { scheme: pair('CC(C)(C)Br', 'CCCCBr').scheme }, { scheme: pair('CC(C)=C', 'CCCCBr').scheme }], answer: 0,
                  hint: t('Halogenas jungiasi prie katijono.', 'The halogen bonds to the cation.'),
                  solution: [{ p: t('Protonizacija, atskilimas ir bromido prisijungimas:', 'Protonation, loss of the alcohol and bonding of bromide:') },
                    { mech: [prot('CC(C)(C)OCCCC', 4, 'Br', 'CC(C)(C)[OH+]CCCC', t('1 stadija: protonizacija.', 'Stage 1: protonation.')),
                      { scheme: { items: [{ smi: 'CC(C)(C)[OH+]CCCC' }, { arrow: '→' }, { smi: 'OCCCC' }, { plus: true }, { smi: 'C[C+](C)C' }] }, arrows: [{ from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }], note: t('2 stadija: atskyla butanolis, lieka tretinis katijonas.', 'Stage 2: butanol leaves and a tertiary cation remains.') },
                      { scheme: { items: [{ smi: 'C[C+](C)C' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CC(C)(C)Br' }] }, arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }], note: t('3 stadija: bromidas jungiasi prie katijono.', 'Stage 3: bromide bonds to the cation.') }] }]
                }
              ],
              why: t('Kai viena eterio pusė tretinė, protonizuotas eteris skyla pagal SN1 ir halogenas patenka ant tretinio atomo, o alkoholis lieka iš pirminės dalies.', 'When one side of the ether is tertiary, the protonated ether cleaves by SN1 and the halogen ends up on the tertiary carbon, while the alcohol comes from the primary part.'),
              src: 'S5.18a; L12 p37', claims: [{ react: ['ether.hi', ['CC(C)(C)OCCCC'], { acid: 'HBr' }, 'CC(C)(C)Br'] }, { react: ['ether.hi', ['CC(C)(C)OCCCC'], { acid: 'HBr' }, 'CCCCO'] }, { name: ['CC(C)(C)OCCCC', { lt: 'tret-butilbutileteris', en: 'tert-butyl butyl ether' }] }]
            },
            {
              id: 'u12.mech.4',
              q: [{ p: t('Eteris veikiamas 1 ekv. HI ir kaitinamas.', 'The ether is heated with 1 equiv. of HI.') }, { scheme: { items: [{ smi: 'CCC(C)OCC', name: t('2-etoksibutanas', '2-ethoxybutane') }, { arrow: '→', above: t('1 ekv. HI, t', '1 equiv. HI, heat') }] } }],
              steps: [
                {
                  prompt: t('Bakstelėkite $C-O$ ryšį, kuris nutrūksta.', 'Tap the $C-O$ bond that breaks.'), kind: 'atoms', bonds: true, mol: { smi: 'CCC(C)OCC', opts: { numbers: 'all' } }, answer: [[4, 5]],
                  hint: t('Stabilaus karbokatijono nėra. Kurią anglį lengviau atakuoti iš nugaros?', 'No stable carbocation is possible. Which carbon is easier to attack from the back?'),
                  solution: t('Skyla ryšys tarp deguonies (Nr. 5) ir etilo anglies (Nr. 6): jodidas atakuoja mažiau užstotą atomą.', 'The bond between oxygen (no. 5) and the ethyl carbon (no. 6) breaks: iodide attacks the less hindered carbon.')
                },
                {
                  prompt: t('Kuriuo mechanizmu?', 'By which mechanism?'), kind: 'choice', options: SNs, answer: 1,
                  hint: t('Viena alkilgrupė pirminė, kita – antrinė.', 'One alkyl group is primary, the other secondary.'),
                  solution: t('Nei viena grupė nesudaro stabilaus katijono, todėl vyksta SN2.', 'Neither group forms a stable cation, so SN2 operates.')
                },
                {
                  prompt: t('Kokie produktai susidaro?', 'Which products form?'), kind: 'choice',
                  options: [{ scheme: pair('CCI', 'CCC(C)O').scheme }, { scheme: pair('CCC(C)I', 'CCO').scheme }, { scheme: pair('CCI', 'CCC(C)I').scheme }, { scheme: pair('CCC(C)O', 'CCO').scheme }], answer: 0,
                  hint: t('Halogenas patenka ant mažiau užstoto atomo; šakotesnė dalis lieka alkoholiu.', 'The halogen goes to the less hindered carbon; the more branched part stays as the alcohol.'),
                  solution: [{ p: t('Po protonizacijos jodidas atakuoja etilo anglį:', 'After protonation iodide attacks the ethyl carbon:') },
                    { mech: [prot('CCC(C)OCC', 4, 'I', 'CCC(C)[OH+]CC', t('1 stadija: protonizacija.', 'Stage 1: protonation.')),
                      { scheme: { items: [{ smi: '[I-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CCC(C)[OH+]CC' }, { arrow: '→' }, { smi: 'CCI' }, { plus: true }, { smi: 'CCC(C)O' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 5 } }, { from: { m: 1, b: [4, 5] }, to: { m: 1, a: 4 } }], note: t('2 stadija (SN2): jodidas atakuoja pirminę anglį.', 'Stage 2 (SN2): iodide attacks the primary carbon.') }] }]
                }
              ],
              why: t('Kai karbokatijonas negalimas, SN2 atakuoja mažiausiai užstotą anglį. Antrinė dalis lieka alkoholiu, pirminė tampa halogenalkanu.', 'When no carbocation is possible, SN2 attacks the least hindered carbon. The secondary part stays as the alcohol and the primary part becomes the haloalkane.'),
              src: 'S5.18b; L12 p36', claims: [{ react: ['ether.hi', ['CCC(C)OCC'], null, 'CCI'] }, { react: ['ether.hi', ['CCC(C)OCC'], null, 'CCC(C)O'] }, { name: ['CCC(C)OCC', { lt: '2-etoksibutanas', en: '2-ethoxybutane' }] }]
            },
            {
              id: 'u12.mech.5',
              q: [{ p: t('Ciklinis eteris tetrahidrofuranas veikiamas 1 ekv. HI.', 'The cyclic ether tetrahydrofuran is treated with 1 equiv. of HI.') }, { scheme: { items: [{ smi: 'C1CCOC1', name: t('tetrahidrofuranas', 'tetrahydrofuran') }, { arrow: '→', above: t('1 ekv. HI', '1 equiv. HI') }] } }],
              steps: [
                {
                  prompt: t('Koks yra produktas?', 'What is the product?'), kind: 'choice',
                  options: [{ mol: { smi: 'OCCCCI' } }, { mol: { smi: 'ICCCCI' } }, { mol: { smi: 'OCCCCO' } }, { mol: { smi: 'CCCCI' } }], answer: 0,
                  hint: t('Kiek $C-O$ ryšių nutrūksta, kai rūgšties yra tik vienas ekvivalentas?', 'How many $C-O$ bonds break when there is only one equivalent of acid?'),
                  solution: t('Nutrūksta viena $C-O$ jungtis ir žiedas atsiveria: gaunamas jodalkoholis.', 'One $C-O$ bond breaks and the ring opens: an iodo alcohol results.')
                },
                {
                  prompt: t('Kodėl pirmiausia vyksta deguonies protonizacija?', 'Why does protonation of oxygen come first?'), kind: 'choice',
                  options: [{ text: t('Po protonizacijos išeinanti grupė yra neutralus alkoholis, o ne blogas alkoksido anijonas.', 'After protonation the leaving group is a neutral alcohol, not the poor alkoxide anion.') }, { text: t('Protonas atakuoja anglį ir ją aktyvuoja.', 'The proton attacks carbon and activates it.') }, { text: t('Jodidas negali atakuoti, kol nėra protono.', 'Iodide cannot attack until a proton is present.') }, { text: t('Protonizacija nutraukia $C-C$ ryšį.', 'Protonation breaks the $C-C$ bond.') }], answer: 0,
                  hint: t('Pirma turi atsirasti gera nueinančioji grupė.', 'A good leaving group must form first.'),
                  solution: [{ p: t('Neprotonizuoto eterio nueinančioji grupė būtų alkoksido anijonas – labai bloga; protonizavus išeina neutralus alkoholis.', 'Without protonation the leaving group would be an alkoxide anion, a very poor one; after protonation a neutral alcohol leaves.') },
                    { mech: [{ scheme: { items: [{ smi: '[I-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'C1CC[OH+]C1' }, { arrow: '→' }, { smi: 'OCCCCI' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 2 } }, { from: { m: 1, b: [2, 3] }, to: { m: 1, a: 3 } }], note: t('SN2: jodidas atakuoja pirminę anglį, žiedas atsiveria.', 'SN2: iodide attacks a primary carbon and the ring opens.') }] }]
                }
              ],
              why: t('Ciklinis eteris skyla kaip aciklinis: po protonizacijos SN2 atveria žiedą. Su 1 ekv. rūgšties lieka OH grupė.', 'A cyclic ether cleaves like an acyclic one: after protonation SN2 opens the ring. With 1 equivalent of acid the OH group remains.'),
              src: 'S5.19a', claims: [{ react: ['ether.hi', ['C1CCOC1'], null, 'OCCCCI'] }, { name: ['OCCCCI', { lt: '4-jod-1-butanolis', en: '4-iodobutan-1-ol' }] }]
            },
            {
              id: 'u12.mech.6',
              q: [{ p: t('Tetrahidrofuranas veikiamas 2 ekv. HI.', 'Tetrahydrofuran is treated with 2 equiv. of HI.') }, { scheme: { items: [{ smi: 'C1CCOC1', name: t('tetrahidrofuranas', 'tetrahydrofuran') }, { arrow: '→', above: t('2 ekv. HI, t', '2 equiv. HI, heat') }] } }],
              steps: [
                {
                  prompt: t('Koks yra galutinis produktas?', 'What is the final product?'), kind: 'choice',
                  options: [{ mol: { smi: 'ICCCCI', name: t('1,4-dijodbutanas', '1,4-diiodobutane') } }, { mol: { smi: 'OCCCCI' } }, { mol: { smi: 'OCCCCO' } }, { mol: { smi: 'IC(C)CCI' } }], answer: 0,
                  hint: t('Pirmasis produktas turi OH grupę. Ar ji gali reaguoti su rūgšties pertekliumi?', 'The first product carries an OH group. Can it react with excess acid?'),
                  solution: t('Pirmiausia susidaro jodalkoholis, o antrasis ekvivalentas pirminį alkoholį paverčia jodalkanu: 1,4-dijodbutanas.', 'The iodo alcohol forms first, then the second equivalent converts the primary alcohol into the iodoalkane: 1,4-diiodobutane.')
                },
                {
                  prompt: t('Kodėl alkoholis toliau reaguoja?', 'Why does the alcohol react further?'), kind: 'choice',
                  options: [{ text: t('Rūgštis jį protonizuoja ir vanduo išeina SN2 būdu.', 'The acid protonates it and water leaves by SN2.') },
                    { text: t('Alkoholis savaime suyra į alkeną ir vandenį.', 'The alcohol decomposes by itself to an alkene and water.') },
                    { text: t('Eteris vėl užsidaro į žiedą.', 'The ether closes again to a ring.') },
                    { text: t('Alkoholio OH grupė yra gera nueinančioji grupė ir be rūgšties.', 'The OH group of an alcohol is a good leaving group even without acid.') }], answer: 0,
                  hint: t('Kodėl $OH-$ be rūgšties neišeina?', 'Why does $OH-$ not leave without an acid?'),
                  solution: [{ p: t('Protonizuotas alkoholis turi gerą nueinančiąją grupę ($H2O$):', 'The protonated alcohol has a good leaving group ($H2O$):') },
                    { mech: [{ scheme: { items: [{ smi: '[I-]', opts: { lonePairs: true } }, { plus: true }, { smi: '[OH2+]CCCCI' }, { arrow: '→' }, { smi: 'ICCCCI' }, { plus: true }, { smi: 'O' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 } }] }] }]
                }
              ],
              why: t('Su pertekliumi rūgšties baigiasi abu $C-O$ ryšiai: iš eterio gaunami du halogenalkano galai ir vanduo.', 'With excess acid both $C-O$ bonds go: the ether gives a haloalkane at each end and water.'),
              src: 'S5.19b; L12 p35', claims: [{ react: ['ether.hi', ['C1CCOC1'], { eq: 2 }, 'ICCCCI'] }, { name: ['ICCCCI', { lt: '1,4-dijodbutanas', en: '1,4-diiodobutane' }] }]
            },
            {
              id: 'u12.mech.7',
              q: [{ p: t('Eteris veikiamas 1 ekv. HI.', 'The ether is treated with 1 equiv. of HI.') }, { scheme: { items: [{ smi: 'COC(C)(C)CC', name: t('2-metil-2-metoksibutanas', '2-methoxy-2-methylbutane') }, { arrow: '→', above: t('1 ekv. HI, t', '1 equiv. HI, heat') }] } }],
              steps: [
                {
                  prompt: t('Kokie produktai susidaro?', 'Which products form?'), kind: 'choice',
                  options: [{ scheme: pair('CCC(C)(C)I', 'CO').scheme }, { scheme: pair('CI', 'CCC(C)(C)O').scheme }, { scheme: pair('CCC(C)(C)I', 'CI').scheme }, { scheme: pair('CC=C(C)C', 'CI').scheme }], answer: 0,
                  hint: t('Viena pusė tretinė. Ar iš jos gali atskilti stabilus katijonas?', 'One side is tertiary. Can a stable cation split off from it?'),
                  solution: [{ p: t('SN1: tretinis katijonas atskyla, o jodidas jungiasi prie jo. Metilo dalis lieka metanoliu.', 'SN1: the tertiary cation splits off and iodide bonds to it. The methyl part stays as methanol.') },
                    { mech: [prot('COC(C)(C)CC', 1, 'I', 'C[OH+]C(C)(C)CC', t('1 stadija: protonizacija.', 'Stage 1: protonation.')),
                      { scheme: { items: [{ smi: 'C[OH+]C(C)(C)CC' }, { arrow: '→' }, { smi: 'CO' }, { plus: true }, { smi: 'CC[C+](C)C' }] }, arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 0, a: 1 } }], note: t('2 stadija: atskyla metanolis, lieka tretinis katijonas.', 'Stage 2: methanol leaves and a tertiary cation remains.') },
                      { scheme: { items: [{ smi: 'CC[C+](C)C' }, { plus: true }, { smi: '[I-]', opts: { lonePairs: true } }, { arrow: '→' }, { smi: 'CCC(C)(C)I' }] }, arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 2 } }], note: t('3 stadija: jodidas jungiasi prie katijono.', 'Stage 3: iodide bonds to the cation.') }] }]
                },
                {
                  prompt: t('Ką atakuotų jodidas, jei vyktų SN2?', 'What would iodide attack if SN2 operated?'), kind: 'choice',
                  options: [{ text: t('Metilo anglį, nes ji mažiau užstota.', 'The methyl carbon, because it is less hindered.') }, { text: t('Tretinį anglį, nes ji labiau pakeista.', 'The tertiary carbon, because it is more substituted.') }, { text: t('Etilo grupės anglį, nes jų daugiausia.', 'The ethyl carbon, because it is the longest chain.') }, { text: t('Deguonį.', 'The oxygen.') }], answer: 0,
                  hint: t('SN2 reikia priėjimo iš nugaros.', 'SN2 needs access from the back.'),
                  solution: t('Tretinė anglis užstota, todėl SN2 būtų prie metilo. Tačiau tretinis katijonas toks stabilus, kad SN1 greitesnis.', 'The tertiary carbon is crowded, so SN2 would go to the methyl carbon. But the tertiary cation is so stable that SN1 is faster.')
                }
              ],
              why: t('Mechanizmą nulemia karbokatijono stabilumas: tretinė, alilo ar benzilo dalis skyla SN1, kitaip SN2.', 'The mechanism follows the stability of the carbocation: a tertiary, allylic or benzylic part cleaves by SN1, otherwise SN2.'),
              src: 'L12 p48a; L12 p37', claims: [{ react: ['ether.hi', ['COC(C)(C)CC'], null, 'CCC(C)(C)I'] }, { react: ['ether.hi', ['COC(C)(C)CC'], null, 'CO'] }, { name: ['COC(C)(C)CC', { lt: '2-metil-2-metoksibutanas', en: '2-methoxy-2-methylbutane' }] }]
            },
            {
              id: 'u12.mech.8',
              q: [{ p: t('Eteris veikiamas 1 ekv. HBr.', 'The ether is treated with 1 equiv. of HBr.') }, { scheme: { items: [{ smi: 'CCOC1CCCCC1', name: t('etoksicikloheksanas', 'ethoxycyclohexane'), opts: { numbers: 'all' } }, { arrow: '→', above: t('1 ekv. HBr, t', '1 equiv. HBr, heat') }] } }],
              steps: [
                {
                  prompt: t('Bakstelėkite $C-O$ ryšį, kuris nutrūksta.', 'Tap the $C-O$ bond that breaks.'), kind: 'atoms', bonds: true, mol: { smi: 'CCOC1CCCCC1', opts: { numbers: 'all' } }, answer: [[1, 2]],
                  hint: t('Antrinis katijonas nepakankamai stabilus. Kur lengviau atakuoti iš nugaros?', 'A secondary cation is not stable enough. Where is back-side attack easier?'),
                  solution: t('Skyla ryšys tarp etilo anglies (Nr. 2) ir deguonies (Nr. 3): bromidas atakuoja etilą.', 'The bond between the ethyl carbon (no. 2) and oxygen (no. 3) breaks: bromide attacks the ethyl group.')
                },
                {
                  prompt: t('Kokie produktai susidaro?', 'Which products form?'), kind: 'choice',
                  options: [{ scheme: pair('CCBr', 'OC1CCCCC1').scheme }, { scheme: pair('CCO', 'BrC1CCCCC1').scheme }, { scheme: pair('CCBr', 'BrC1CCCCC1').scheme }, { scheme: pair('CCO', 'C1=CCCCC1').scheme }], answer: 0,
                  hint: t('SN2: halogenidas pasirenka mažiau užstotą anglį.', 'SN2: the halide picks the less hindered carbon.'),
                  solution: [{ p: t('SN2: bromidas atakuoja etilo anglį, todėl gaunamas brometanas ir cikloheksanolis.', 'SN2: bromide attacks the ethyl carbon, so bromoethane and cyclohexanol form.') },
                    { mech: [prot('CCOC1CCCCC1', 2, 'Br', 'CC[OH+]C1CCCCC1', t('1 stadija: protonizacija.', 'Stage 1: protonation.')),
                      { scheme: { items: [{ smi: '[Br-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC[OH+]C1CCCCC1' }, { arrow: '→' }, { smi: 'CCBr' }, { plus: true }, { smi: 'OC1CCCCC1' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }], note: t('2 stadija (SN2): bromidas atakuoja etilo anglį.', 'Stage 2 (SN2): bromide attacks the ethyl carbon.') }] }]
                }
              ],
              why: t('Etilo grupė mažiausiai užstota, o antrinis cikloheksilo katijonas nestabilus, todėl SN2 vyksta prie etilo.', 'The ethyl group is the least hindered and the secondary cyclohexyl cation is not stable, so SN2 occurs at the ethyl carbon.'),
              src: 'L12 p48b; L12 p36', claims: [{ react: ['ether.hi', ['CCOC1CCCCC1'], { acid: 'HBr' }, 'CCBr'] }, { react: ['ether.hi', ['CCOC1CCCCC1'], { acid: 'HBr' }, 'OC1CCCCC1'] }, { name: ['CCOC1CCCCC1', { lt: 'etoksicikloheksanas', en: 'ethoxycyclohexane' }] }]
            },
            {
              id: 'u12.mech.9',
              q: [{ p: t('Metoksiciklopentanas gaunamas Viljamsono sintezės būdu.', 'Methoxycyclopentane is to be made by the Williamson synthesis.') }, { mol: { smi: 'COC1CCCC1', name: t('metoksiciklopentanas', 'methoxycyclopentane') } }],
              steps: [
                {
                  prompt: t('Kuris variantas tinka šiam eteriui gauti?', 'Which route gives this ether?'), kind: 'choice',
                  options: [{ scheme: { items: [{ smi: '[O-]C1CCCC1' }, { plus: true }, { smi: 'CI' }] } }, { scheme: { items: [{ smi: 'C[O-]' }, { plus: true }, { smi: 'IC1CCCC1' }] } }, { scheme: { items: [{ smi: 'OC1CCCC1' }, { plus: true }, { smi: 'CI' }] } }, { scheme: { items: [{ smi: 'C[O-]' }, { plus: true }, { smi: 'OC1CCCC1' }] } }], answer: 0,
                  hint: t('Kuri halogenalkano anglis būtų metilo ar pirminė, ir ar reikia stiprios bazės?', 'Which halide carbon would be methyl or primary, and is a strong base needed?'),
                  solution: t('Halogenalkanas turi būti metilo, o šakotesnė (ciklopentilo) dalis imama kaip alkoksidas. Antrinis halogenidas eliminuotųsi, o alkoholis be bazės nereaguoja.', 'The halide must be methyl, so the more branched (cyclopentyl) part is the alkoxide. A secondary halide would eliminate, and an alcohol without a base does not react.')
                },
                {
                  prompt: t('Kuriuo mechanizmu vyksta reakcija?', 'By which mechanism does the reaction proceed?'), kind: 'choice', options: SNs, answer: 1,
                  hint: t('Ar gali susidaryti stabilus karbokatijonas? Kiek stadijų turi reakcija?', 'Could a stable carbocation form? How many stages does the reaction have?'),
                  solution: [{ p: t('Alkoksido pora atakuoja metilo anglį iš priešingos nuo jodo pusės:', 'The alkoxide lone pair attacks the methyl carbon from the side opposite iodine:') },
                    { mech: [{ scheme: { items: [{ smi: '[O-]C1CCCC1', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'CI' }, { arrow: '→' }, { smi: 'COC1CCCC1' }, { plus: true }, { smi: '[I-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }] }] }]
                }
              ],
              why: t('Viljamsono sintezė yra SN2: alkoksidas atakuoja metilo ar pirminį halogenalkaną ir išstumia halogenidą.', 'The Williamson synthesis is SN2: an alkoxide attacks a methyl or primary haloalkane and displaces the halide.'),
              src: 'S5.5', claims: [{ react: ['williamson', ['COC1CCCC1'], null, 'CI'] }, { name: ['COC1CCCC1', { lt: 'metoksiciklopentanas', en: 'methoxycyclopentane' }] }]
            },
            {
              id: 'u12.mech.10',
              q: [{ p: t('Epoksidas reaguoja su etilaminu.', 'An epoxide reacts with ethylamine.') }, { scheme: { items: [{ smi: 'CCC1CO1', name: t('etiloksiranas', 'ethyloxirane'), opts: { numbers: 'all' } }, { plus: true }, { smi: 'CCN' }, { arrow: '→' }] } }],
              steps: [
                {
                  prompt: t('Bakstelėkite anglį, kurią atakuoja aminas.', 'Tap the carbon the amine attacks.'), kind: 'atoms', mol: { smi: 'CCC1CO1', opts: { numbers: 'all' } }, answer: [3],
                  hint: t('Nukleofilas pasirenka mažiau užstotą anglį.', 'The nucleophile chooses the less hindered carbon.'),
                  solution: t('Atakuojamas žiedo $CH2$ (Nr. 4), nes prie $CH$ (Nr. 3) yra etilo grupė.', 'The ring $CH2$ (no. 4) is attacked, because the $CH$ (no. 3) carries an ethyl group.')
                },
                {
                  prompt: t('Koks yra produktas?', 'What is the product?'), kind: 'choice',
                  options: [{ mol: { smi: 'CCC(O)CNCC' } }, { mol: { smi: 'CCC(NCC)CO' } }, { mol: { smi: 'CCC(O)CC' } }, { mol: { smi: 'CCC(=O)CNCC' } }], answer: 0,
                  hint: t('Kur lieka deguonis po žiedo atsivėrimo?', 'Where does oxygen end up after ring opening?'),
                  solution: [{ p: t('Aminas jungiasi prie $CH2$, o deguonis lieka ant $CH$ ir po protono perkėlimo tampa OH:', 'The amine bonds to the $CH2$, and oxygen stays on the $CH$ and becomes OH after proton transfer:') },
                    { mech: [{ scheme: { items: [{ smi: 'CCC1CO1' }, { plus: true }, { smi: 'CCN', opts: { lonePairs: [2] } }, { arrow: '→' }, { smi: 'CCC([O-])C[NH2+]CC' }] }, arrows: [{ from: { m: 1, lp: 2 }, to: { m: 0, a: 3 } }, { from: { m: 0, b: [3, 4] }, to: { m: 0, a: 4 } }] }] }]
                }
              ],
              why: t('Įtemptas trinaris žiedas atsiveria švelniomis sąlygomis: nukleofilas atakuoja mažiau užstotą anglį, o deguonis tampa alkoholiu.', 'The strained three-membered ring opens under mild conditions: the nucleophile attacks the less hindered carbon and oxygen becomes an alcohol.'),
              src: 'L12 p39, p43', claims: [{ formula: ['CCC(O)CNCC', 'C6H15NO'] }, { name: ['CCC1CO1', { lt: 'etiloksiranas', en: 'ethyloxirane' }] }]
            },
            {
              id: 'u12.mech.11',
              q: [{ p: t('4-chlor-1-butanolis veikiamas natrio hidridu. Gaunamas tetrahidrofuranas.', '4-Chlorobutan-1-ol is treated with sodium hydride. Tetrahydrofuran forms.') }, { scheme: { items: [{ smi: 'ClCCCCO', name: t('4-chlor-1-butanolis', '4-chlorobutan-1-ol') }, { arrow: '→', above: f('NaH') }, { smi: 'C1CCOC1' }, { plus: true }, { smi: '[H][H]' }, { plus: true }, { smi: '[Na+].[Cl-]' }] } }],
              steps: [
                {
                  prompt: t('Ką daro hidrido jonas pirmoje stadijoje?', 'What does the hydride ion do in the first stage?'), kind: 'choice',
                  options: [{ text: t('Atplėšia protoną nuo OH ir išsiskiria $H2$.', 'It removes the proton of OH and $H2$ escapes.') }, { text: t('Pakeičia chloro atomą (SN2).', 'It replaces the chlorine atom (SN2).') }, { text: t('Prisijungia prie anglies kaip nukleofilas ir duoda butanolį.', 'It bonds to carbon as a nucleophile and gives butanol.') }, { text: t('Redukuoja alkoholį į alkaną.', 'It reduces the alcohol to an alkane.') }], answer: 0,
                  hint: t('Hidrido jonas čia veikia kaip bazė.', 'Here the hydride ion acts as a base.'),
                  solution: t('$H-$ yra stipri bazė: ji deprotonuoja OH ir duoda alkoksidą bei $H2$.', '$H-$ is a strong base: it deprotonates OH and gives the alkoxide and $H2$.')
                },
                {
                  prompt: t('Kaip užsidaro žiedas?', 'How does the ring close?'), kind: 'choice',
                  options: [{ text: t('Alkoksidas atakuoja anglį su chloru (vidumolekulinė SN2).', 'The alkoxide attacks the carbon bearing chlorine (intramolecular SN2).') }, { text: t('Chloras pats atplyšta ir susidaro katijonas (SN1).', 'Chlorine leaves by itself and a cation forms (SN1).') }, { text: t('Alkoksidas atakuoja gretimą anglį, esančią prie O.', 'The alkoxide attacks the carbon next to O.') }, { text: t('Žiedas užsidaro per eliminavimą (E2).', 'The ring closes by elimination (E2).') }], answer: 0,
                  hint: t('Kuris atomas nukleofilas ir kuris anglies atomas turi nueinančiąją grupę?', 'Which atom is the nucleophile and which carbon carries the leaving group?'),
                  solution: [{ p: t('Alkoksido deguonies pora atakuoja galinę anglį iš nugaros ir išstumia chloridą:', 'The lone pair of the alkoxide oxygen attacks the terminal carbon from the back and displaces chloride:') },
                    { mech: [{ scheme: { items: [{ smi: '[O-]CCCCCl', opts: { lonePairs: [0] } }, { arrow: '→' }, { smi: 'C1CCOC1' }, { plus: true }, { smi: '[Cl-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, a: 4 } }, { from: { m: 0, b: [4, 5] }, to: { m: 0, a: 5 } }] }] }]
                }
              ],
              why: t('Vidumolekulinis Viljamsono procesas: ta pati molekulė turi ir nukleofilą (alkoksidą), ir nueinančiąją grupę (chlorą). Penkianaris žiedas susidaro lengvai.', 'An intramolecular Williamson process: the same molecule carries both the nucleophile (alkoxide) and the leaving group (chlorine). A five-membered ring forms easily.'),
              src: 'L12 p7', claims: [{ react: ['williamson', ['ClCCCCO'], null, 'C1CCOC1'] }]
            },
            {
              id: 'u12.mech.12',
              q: [{ p: t('Herbicidui 2,4,5-T gauti 2,4,5-trichlorfenolis šarminiame tirpale kaitinamas su chloracto rūgštimi.', 'The herbicide 2,4,5-T is made by heating 2,4,5-trichlorophenol and chloroacetic acid with NaOH.') },
                { scheme: { items: [{ smi: 'Oc1cc(Cl)c(Cl)cc1Cl', name: t('2,4,5-trichlorfenolis', '2,4,5-trichlorophenol') }, { plus: true }, { smi: 'ClCC(=O)O' }, { arrow: '→', above: f('NaOH, t') }, { smi: 'OC(=O)COc1cc(Cl)c(Cl)cc1Cl' }] } }],
              steps: [
                {
                  prompt: t('Kuris atomas yra nukleofilas?', 'Which atom is the nucleophile?'), kind: 'choice',
                  options: [{ text: t('Fenoliato deguonis, susidaręs NaOH atplėšus protoną.', 'The phenoxide oxygen formed when NaOH removes the proton.') }, { text: t('Žiedo anglis, nes žiedas turi π elektronų.', 'A ring carbon, because the ring has π electrons.') }, { text: t('Chloro atomas chlorace.', 'The chlorine atom of the chloroacetic acid.') }, { text: t('Karbonilo deguonis.', 'The carbonyl oxygen.') }], answer: 0,
                  hint: t('Šarmas pirmiausia deprotonuoja rūgščiausią grupę. Kuri tai?', 'The alkali first deprotonates the most acidic group. Which is it?'),
                  solution: t('Rūgštinė $COOH$ grupė taip pat deprotonuojama, bet nukleofilu tampa fenoliato deguonis: jis atakuoja elektrofilinį $CH2$ anglį.', 'The $COOH$ group is deprotonated too, but the phenoxide oxygen becomes the nucleophile: it attacks the electrophilic $CH2$ carbon.')
                },
                {
                  prompt: t('Kuriuo mechanizmu vyksta ryšio $C-O$ susidarymas?', 'By which mechanism does the $C-O$ bond form?'), kind: 'choice', options: SNs, answer: 1,
                  hint: t('Ar gali susidaryti stabilus karbokatijonas? Kiek stadijų turi reakcija?', 'Could a stable carbocation form? How many stages does the reaction have?'),
                  solution: [{ p: t('Fenoliato deguonis atakuoja pirminę anglį iš nugaros ir išstumia chloridą (SN2):', 'The phenoxide oxygen attacks the primary carbon from the back and displaces chloride (SN2):') },
                    { mech: [{ scheme: { items: [{ smi: '[O-]c1cc(Cl)c(Cl)cc1Cl', opts: { lonePairs: [0] } }, { plus: true }, { smi: 'ClCC(=O)[O-]' }, { arrow: '→' }, { smi: '[O-]C(=O)COc1cc(Cl)c(Cl)cc1Cl' }, { plus: true }, { smi: '[Cl-]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 } }] }] }]
                },
                {
                  prompt: t('Pavadinkite produktą (rūgštinus tirpalą).', 'Name the product (after acidification).'), kind: 'name', mol: { smi: 'OC(=O)COc1cc(Cl)c(Cl)cc1Cl' }, answer: { smi: 'OC(=O)COc1cc(Cl)c(Cl)cc1Cl', extra: { lt: ['2,4,5-trichlorfenoksiacto rūgštis'], en: ['2,4,5-trichlorophenoxyacetic acid'], src: 'L12 p21' } },
                  hint: t('Pagrindinė grupė yra karboksirūgštis, o fenoksigrupė – pakaitas.', 'The principal group is the carboxylic acid and the phenoxy group is a substituent.'),
                  solution: t('Fenoksiacto rūgšties darinys su trimis chloro atomais (2,4,5-T)', '2,4,5-trichlorophenoxyacetic acid (2,4,5-T)')
                }
              ],
              why: t('Tai fenoliato O-alkilinimas (Viljamsono tipo SN2): fenoliatas yra deguonies nukleofilas, o chloracetatas – pirminis halogenalkanas.', 'This is O-alkylation of a phenoxide (Williamson-type SN2): the phenoxide is an oxygen nucleophile and the chloroacetate a primary haloalkane.'),
              src: 'L12 p21', claims: [{ formula: ['OC(=O)COc1cc(Cl)c(Cl)cc1Cl', 'C8H5Cl3O3'] }, { react: ['phenol.alkyl', ['Oc1cc(Cl)c(Cl)cc1Cl', 'ClCC(=O)O'], null, 'OC(=O)COc1cc(Cl)c(Cl)cc1Cl'] }]
            },
            {
              id: 'u12.mech.13',
              q: [{ p: t('Tetrahidrofuranas gaunamas 1,4-butandiolį kaitinant su sieros rūgštimi.', 'Tetrahydrofuran is made by heating butane-1,4-diol with sulfuric acid.') },
                { scheme: { items: [{ smi: 'OCCCCO', name: t('1,4-butandiolis', 'butane-1,4-diol') }, { arrow: '→', above: f('H2SO4') }, { smi: 'C1CCOC1', name: t('tetrahidrofuranas', 'tetrahydrofuran') }, { plus: true }, { smi: 'O' }] } }],
              steps: [
                {
                  prompt: t('Kodėl pirmiausia protonizuojama viena OH grupė?', 'Why is one OH group protonated first?'), kind: 'choice',
                  options: [{ text: t('Protonizuota grupė išeina kaip neutralus vanduo, o $OH-$ būtų bloga nueinančioji grupė.', 'The protonated group leaves as neutral water, whereas $OH-$ would be a poor leaving group.') }, { text: t('Protonas atakuoja anglį ir ją aktyvuoja.', 'The proton attacks carbon and activates it.') }, { text: t('Protonizacija nutraukia $C-C$ ryšį.', 'Protonation breaks the $C-C$ bond.') }, { text: t('Rūgštis sujungia dvi OH grupes tiesiogiai.', 'The acid joins the two OH groups directly.') }], answer: 0,
                  hint: t('Kuri nueinančioji grupė geresnė: $OH-$ ar $H2O$?', 'Which leaving group is better: $OH-$ or $H2O$?'),
                  solution: t('Vanduo yra gera nueinančioji grupė, o hidroksido anijonas – bloga, todėl OH pirmiausia protonizuojama.', 'Water is a good leaving group and hydroxide a poor one, so the OH is protonated first.')
                },
                {
                  prompt: t('Išdėstykite stadijas teisinga tvarka.', 'Put the stages in the right order.'), kind: 'order',
                  options: [{ text: t('Viena OH grupė protonizuojama.', 'One OH group is protonated.') }, { text: t('Kita OH grupė atakuoja anglį (vidumolekulinė SN2), išeina vanduo.', 'The other OH group attacks the carbon (intramolecular SN2) and water leaves.') }, { text: t('Oksonio jonas netenka protono ir susidaro THF.', 'The oxonium ion loses a proton and THF forms.') }],
                  hint: t('Pirma turi atsirasti gera nueinančioji grupė.', 'A good leaving group must form first.'),
                  solution: [{ p: t('Žiedas užsidaro per penkianarį pereinamąjį būvį:', 'The ring closes through a five-membered transition state:') },
                    { mech: [{ scheme: { items: [{ smi: '[OH2+]CCCCO', opts: { lonePairs: [5] } }, { arrow: '→' }, { smi: 'C1CCC[OH+]1' }, { plus: true }, { smi: 'O' }] }, arrows: [{ from: { m: 0, lp: 5 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 } }] }] }]
                }
              ],
              why: t('Tai vidumolekulinė SN2: ta pati molekulė turi ir nukleofilą (OH), ir protonizuotą nueinančiąją grupę, todėl lengvai užsidaro penkianaris žiedas.', 'This is an intramolecular SN2: the same molecule carries both the nucleophile (OH) and the protonated leaving group, so a five-membered ring closes easily.'),
              src: 'L12 p7'
            }

          ];
        })()
      },

      /* ------------------------------------------------------------ qualitative tests (bank) */
      {
        id: 'u12.tests',
        title: t('Kokybinės reakcijos: kaip atskirti junginius', 'Qualitative tests: how to tell compounds apart'),
        mirrors: [],
        bank: (function () {
          const ch = (txts) => txts.map((x) => ({ text: x }));
          return [
            {
              id: 'u12.tests.1',
              q: [{ p: t('Du bespalviai skysčiai: etanolis ir 1,2-etandiolis.', 'Two colourless liquids: ethanol and ethane-1,2-diol.') }, { mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'OCCO', name: t('1,2-etandiolis', 'ethane-1,2-diol') }] }],
              steps: [{
                prompt: t('Kuris reagentas juos atskirs?', 'Which reagent tells them apart?'), kind: 'choice',
                options: ch([t('Šviežiai nusodintas $Cu(OH)2$ (ištirpsta tik etandiolyje)', 'Freshly precipitated $Cu(OH)2$ (dissolves only in the ethanediol)'), t('Metalinis natris (dujos tik su etandioliu)', 'Metallic sodium (gas only with ethanediol)'), t('Bromo vanduo (išblunka tik su etandioliu)', 'Bromine water (decolourised only by ethanediol)'), t('$FeCl3$ tirpalas (violetinė spalva su etandioliu)', '$FeCl3$ solution (violet with ethanediol)')]), answer: 0,
                hint: t('Kuris reagentas reaguoja pagal hidroksigrupių padėtį?', 'Which reagent reacts according to the position of the hydroxy groups?'),
                solution: t('Natris reaguoja su abiem (abu išskiria $H2$), bromo vandens ir $FeCl3$ nė vienas neveikia. Tik etandiolis su $Cu(OH)2$ sudaro tamsiai mėlyną tirpalą.', 'Sodium reacts with both (both release $H2$), and neither affects bromine water or $FeCl3$. Only ethanediol dissolves $Cu(OH)2$ to a deep-blue solution.')
              }],
              why: t('Vario hidroksido bandymas parodo OH grupes prie gretimų anglies atomų, o ne bet kokį alkoholį.', 'The copper hydroxide test shows OH groups on adjacent carbons, not just any alcohol.'), src: 'L12 p3; LW6 p2'
            },
            {
              id: 'u12.tests.2',
              q: [{ p: t('Reikia atskirti fenolį nuo cikloheksanolio.', 'A phenol must be distinguished from cyclohexanol.') }, { mol: [{ smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') }, { smi: 'OC1CCCCC1', name: t('cikloheksanolis', 'cyclohexanol') }] }],
              steps: [{
                prompt: t('Kurie reagentai duoda skirtingus rezultatus?', 'Which reagents give different results?'), kind: 'multi',
                options: ch([t('$FeCl3$ tirpalas', '$FeCl3$ solution'), t('Bromo vanduo', 'Bromine water'), t('Šviežiai nusodintas $Cu(OH)2$', 'Freshly precipitated $Cu(OH)2$'), t('Metalinis natris', 'Metallic sodium')]), answer: [0, 1],
                hint: t('Kuris reagentas reikalauja aromatinio žiedo ir OH grupės kartu?', 'Which reagent needs an aromatic ring and an OH group together?'),
                solution: t('Fenolis su $FeCl3$ duoda violetinį kompleksą, su bromo vandeniu – baltas tribromfenolio nuosėdas. Cikloheksanolis nereaguoja nei su vienu. Su natriu reaguoja abu, o $Cu(OH)2$ neveikia nė vieno.', 'Phenol gives a violet complex with $FeCl3$ and a white tribromophenol precipitate with bromine water. Cyclohexanol does neither. Both react with sodium, and neither dissolves $Cu(OH)2$.')
              }],
              why: t('Fenolio testus lemia aromatinis žiedas su OH: kompleksas su $FeCl3$ ir aktyvuotas elektrofilinis pakeitimas.', 'The phenol tests depend on the aromatic ring with OH: a complex with $FeCl3$ and activated electrophilic substitution.'), src: 'L12 p10, p17; LW6 p3'
            },
            {
              id: 'u12.tests.3',
              q: [{ p: t('Į fenolio tirpalą lašinamas bromo vanduo.', 'Bromine water is added dropwise to a phenol solution.') }],
              steps: [
                {
                  prompt: t('Ką stebėsite?', 'What will you observe?'), kind: 'choice',
                  options: ch([t('Bromo vandens spalva išnyksta ir iškrenta baltos nuosėdos.', 'The colour of the bromine water disappears and a white precipitate falls.'), t('Tirpalas pasidaro violetinis.', 'The solution turns violet.'), t('Spalva išlieka rudai oranžinė, nuosėdų nėra.', 'The brown-orange colour stays and there is no precipitate.'), t('Išsiskiria dujos.', 'A gas is evolved.')]), answer: 0,
                  hint: t('Pagalvokite, kas atsitinka su bromu ir koks produktas netirpus vandenyje.', 'Think what happens to the bromine and which product is insoluble in water.'),
                  solution: t('Bromas sunaudojamas ir susidaro netirpus 2,4,6-tribromfenolis – baltos nuosėdos. Violetinė spalva būdinga $FeCl3$ bandymui.', 'The bromine is used up and insoluble 2,4,6-tribromophenol forms: a white precipitate. The violet colour belongs to the $FeCl3$ test.')
                },
                {
                  prompt: t('Kodėl fenolis brominasi be katalizatoriaus?', 'Why does phenol brominate without a catalyst?'), kind: 'choice',
                  options: ch([t('OH grupė (+M) didina elektronų tankį žiede ir aktyvuoja jį elektrofilui.', 'The OH group (+M) raises the electron density of the ring and activates it toward the electrophile.'), t('OH grupė traukia elektronus ir didina bromo elektrofiliškumą.', 'The OH group withdraws electrons and makes bromine more electrophilic.'), t('Bromo vanduo yra stiprus oksidatorius, todėl žiedas oksiduojasi.', 'Bromine water is a strong oxidant, so the ring is oxidised.'), t('Fenolis rūgštus ir protonizuoja bromą.', 'Phenol is acidic and protonates the bromine.')]), answer: 0,
                  hint: t('Kokį poveikį žiedui turi donorinė grupė?', 'What effect does a donor group have on the ring?'),
                  solution: t('Aktyvuotas žiedas reaguoja su silpnu elektrofilu; polinis tirpiklis dar padidina solvatuotos OH grupės donorinį efektą.', 'An activated ring reacts with a weak electrophile; the polar solvent further enhances the donor effect of the solvated OH group.')
                }
              ],
              why: t('Fenolio OH grupė stipriai aktyvuoja žiedą, todėl pakanka bromo vandens ir gaunamas trigubas pakeitimas.', 'The OH group of phenol activates the ring strongly, so bromine water suffices and triple substitution results.'), src: 'LW6 p3; L12 p17'
            },
            {
              id: 'u12.tests.4',
              q: [{ p: t('Į etanolį įmetamas gabalėlis natrio, o po reakcijos į mišinį įpilama vandens ir lašinama fenolftaleino.', 'A piece of sodium is dropped into ethanol; after the reaction water is added and phenolphthalein is dropped in.') }],
              steps: [
                {
                  prompt: t('Kas vyksta su natriu?', 'What happens with the sodium?'), kind: 'choice',
                  options: ch([t('Išsiskiria $H2$ ir susidaro natrio etoksidas.', '$H2$ is released and sodium ethoxide forms.'), t('Natris ištirpsta ir susidaro etenas.', 'Sodium dissolves and ethene forms.'), t('Natris redukuoja etanolį iki etano.', 'Sodium reduces ethanol to ethane.'), t('Nieko nevyksta, nes etanolis nėra rūgštis.', 'Nothing happens because ethanol is not an acid.')]), answer: 0,
                  hint: t('Alkoholis atiduoda protoną metalui.', 'The alcohol gives a proton to the metal.'),
                  solution: t('Natris pakeičia OH vandenilį: gaunamas natrio etoksidas ir vandenilio dujos.', 'Sodium replaces the OH hydrogen: sodium ethoxide and hydrogen gas form.')
                },
                {
                  prompt: t('Kodėl fenolftaleinas pasidaro raudonai violetinis?', 'Why does the phenolphthalein turn red-violet?'), kind: 'choice',
                  options: ch([t('Alkoksidas su vandeniu hidrolizuojasi ir susidaro šarmas ($NaOH$).', 'The alkoxide is hydrolysed by water and alkali ($NaOH$) forms.'), t('Vandenyje likęs natris reaguoja su fenolftaleinu.', 'Leftover sodium reacts with the phenolphthalein.'), t('Etanolis rūgštus ir paraudonuoja indikatorių.', 'Ethanol is acidic and turns the indicator red.'), t('Išsiskiria $H2$, kuris spalvina indikatorių.', 'The $H2$ released colours the indicator.')]), answer: 0,
                  hint: t('Alkoksidas yra stipri bazė. Ką jis daro su vandeniu?', 'An alkoxide is a strong base. What does it do with water?'),
                  solution: t('$C2H5ONa + H2O → C2H5OH + NaOH$: alkoksidas atplėšia protoną nuo vandens, o šarminėje terpėje fenolftaleinas raudonai violetinis.', '$C2H5ONa + H2O → C2H5OH + NaOH$: the alkoxide takes a proton from water, and in alkaline medium phenolphthalein is red-violet.')
                }
              ],
              why: t('Alkoksidas yra stipri bazė (alkoholis – labai silpna rūgštis), todėl vandenyje jis visiškai atkuria šarmą.', 'An alkoxide is a strong base (an alcohol is a very weak acid), so in water it regenerates the alkali.'), src: 'LW6 p2; LW6 expl. p5'
            },
            {
              id: 'u12.tests.5',
              q: [{ p: t('Penkis junginius veikiame vandeniniu NaOH tirpalu.', 'Five compounds are treated with aqueous NaOH.') }, { mol: [{ smi: 'Oc1ccccc1' }, { smi: 'Oc1ccc(cc1)[N+](=O)[O-]' }, { smi: 'OC1CCCCC1' }, { smi: 'CCS' }, { smi: 'CCOCC' }] }],
              steps: [{
                prompt: t('Kurie junginiai reaguoja ir tirpsta kaip druskos?', 'Which compounds react and dissolve as salts?'), kind: 'multi',
                options: [{ mol: { smi: 'Oc1ccccc1' } }, { mol: { smi: 'Oc1ccc(cc1)[N+](=O)[O-]' } }, { mol: { smi: 'OC1CCCCC1' } }, { mol: { smi: 'CCS' } }, { mol: { smi: 'CCOCC' } }], answer: [0, 1, 3],
                hint: t('Reaguoja tik pakankamai rūgštūs junginiai (pKa iki maždaug 10–11; alkoholiai ir polioliai – tik iš dalies).', 'Only compounds acidic enough react (pKa up to roughly 10–11; alcohols and polyols only partly).'),
                solution: t('Fenolis, nitrofenolis (pKa 7–10) ir tiolis (≈ 10,5) virsta anijonais. Cikloheksanolis (≈ 16) ir eteris (ne rūgštis) nereaguoja.', 'Phenol, nitrophenol (pKa 7–10) and the thiol (≈ 10.5) become anions. Cyclohexanol (≈ 16) and the ether (not an acid) do not react.')
              }],
              why: t('Šarmas deprotonuoja tik pakankamai rūgščius junginius: fenolius ir tiolius, bet ne alkoholius ar eterius.', 'Alkali deprotonates only sufficiently acidic compounds: phenols and thiols, but not alcohols or ethers.'), src: 'L12 p8, p22, p24'
            },
            {
              id: 'u12.tests.6',
              q: [{ p: t('Keturi nepažymėti mėgintuvėliai: etanolis, glicerolis, fenolis, dietileteris.', 'Four unlabelled tubes: ethanol, glycerol, phenol, diethyl ether.') }],
              steps: [
                { prompt: t('Kuris reagentas iškart atpažins fenolį?', 'Which reagent identifies the phenol at once?'), kind: 'choice',
                  options: ch([t('$FeCl3$ (violetinė spalva)', '$FeCl3$ (violet colour)'), t('$Cu(OH)2$ (mėlynas tirpalas)', '$Cu(OH)2$ (blue solution)'), t('Natris (dujos)', 'Sodium (gas)'), t('$K2Cr2O7$ (žalia spalva)', '$K2Cr2O7$ (green colour)')]), answer: 0,
                  hint: t('Kuris reagentas reikalauja aromatinio žiedo su OH?', 'Which reagent needs an aromatic ring with OH?'),
                  solution: t('Tik fenolis su $FeCl3$ duoda violetinį kompleksą.', 'Only the phenol gives a violet complex with $FeCl3$.') },
                { prompt: t('Kuris reagentas atpažins glicerolį likusiuose trijuose?', 'Which reagent identifies the glycerol among the remaining three?'), kind: 'choice',
                  options: ch([t('$Cu(OH)2$ (nuosėdos ištirpsta, mėlynas tirpalas)', '$Cu(OH)2$ (the precipitate dissolves, blue solution)'), t('$FeCl3$ (violetinė spalva)', '$FeCl3$ (violet colour)'), t('Bromo vanduo (baltos nuosėdos)', 'Bromine water (white precipitate)'), t('Vandeninis NaOH (tirpsta)', 'Aqueous NaOH (dissolves)')]), answer: 0,
                  hint: t('Kuris junginys turi OH grupes prie gretimų atomų?', 'Which compound has OH groups on adjacent atoms?'),
                  solution: t('Glicerolio OH grupės prie gretimų anglies atomų sudaro mėlyną kompleksą.', 'The OH groups of glycerol on adjacent carbons form the blue complex.') },
                { prompt: t('Kaip atskirti etanolį nuo eterio?', 'How is ethanol told from the ether?'), kind: 'choice',
                  options: ch([t('Natris išskiria $H2$ tik su etanoliu.', 'Sodium releases $H2$ only with ethanol.'), t('$Cu(OH)2$ ištirpsta tik etanolyje.', '$Cu(OH)2$ dissolves only in ethanol.'), t('Bromo vanduo balina tik eterį.', 'Bromine water is decolourised only by the ether.'), t('$FeCl3$ spalvina tik eterį.', '$FeCl3$ colours only the ether.')]), answer: 0,
                  hint: t('Kuriame junginyje yra rūgštus vandenilis?', 'Which compound has an acidic hydrogen?'),
                  solution: t('Eteris neturi $O-H$ ryšio, todėl su natriu nereaguoja; etanolis išskiria vandenilio dujas.', 'The ether has no $O-H$ bond, so it does not react with sodium; ethanol releases hydrogen gas.') }
              ],
              why: t('Kiekvienas testas ieško savo struktūrinio požymio: fenolio žiedo, gretimų OH grupių, rūgštaus $O-H$ vandenilio.', 'Each test looks for its own structural feature: a phenol ring, adjacent OH groups, an acidic $O-H$ hydrogen.'), src: 'L12 p3, p10; LW6 p2–3'
            },
            {
              id: 'u12.tests.7',
              q: [{ p: t('Apsinuodijus gyvsidabriu reikia priešnuodžio.', 'Mercury poisoning needs an antidote.') }],
              steps: [{
                prompt: t('Kuris junginys tinkamiausias priešnuodis?', 'Which compound is the best antidote?'), kind: 'choice',
                options: [{ mol: { smi: 'SCC(S)CO' } }, { mol: { smi: 'OCC(O)CO' } }, { mol: { smi: 'OCCO' } }, { mol: { smi: 'CCCS' } }], answer: 0,
                hint: t('Metalas jungiasi prie sieros. Kokia grupių jungtis sudaro chelatą?', 'The metal binds to sulfur. Which arrangement of groups forms a chelate?'),
                solution: t('Dvi $SH$ grupės vienoje molekulėje chelatuoja metalą. Glicerolis ir etandiolis turi deguonį, kuris su Hg jungiasi silpnai, o monotiolis chelato nesudaro.', 'Two $SH$ groups in one molecule chelate the metal. Glycerol and ethanediol have oxygen, which binds Hg weakly, and a monothiol cannot chelate.')
              }],
              why: t('Sunkiųjų metalų nuodus suriša ditioliai, nes siera stipriai jungiasi su Hg, Pb, As ir dvi $SH$ grupės sudaro stabilų žiedą.', 'Dithiols bind heavy-metal poisons because sulfur bonds strongly to Hg, Pb and As, and two $SH$ groups form a stable ring.'), src: 'L12 p24–25, p32',
              claims: [{ formula: ['SCC(S)CO', 'C3H8OS2'] }]
            },
            {
              id: 'u12.tests.8',
              q: [{ p: t('Baltymo cisteino liekanos oksiduojamos, kad susidarytų disulfidiniai tilteliai (kaip plaukų sušukavime).', 'Cysteine residues of a protein are oxidised to form disulfide bridges (as in a hair perm).') }, { scheme: { items: [{ smi: 'NC(CS)C(=O)O' }, { plus: true }, { smi: 'NC(CS)C(=O)O' }, { arrow: '⇌', above: f('[O]'), below: f('[H]') }, { smi: 'NC(CSSCC(N)C(=O)O)C(=O)O' }] } }],
              steps: [
                { prompt: t('Kuris atomas oksiduojamas ir kuo jis tampa?', 'Which atom is oxidised and what does it become?'), kind: 'choice',
                  options: ch([t('Siera: $S-H$ virsta $S-S$ ryšiu.', 'Sulfur: $S-H$ becomes an $S-S$ bond.'), t('Anglis: $CH2$ virsta karbonilu.', 'Carbon: $CH2$ becomes a carbonyl.'), t('Azotas: $NH2$ virsta nitrogrupe.', 'Nitrogen: $NH2$ becomes a nitro group.'), t('Deguonis: $COOH$ virsta peroksidu.', 'Oxygen: $COOH$ becomes a peroxide.')]), answer: 0,
                  hint: t('Kuri grupė šioje molekulėje lengviausiai oksiduojasi silpnais oksidatoriais?', 'Which group in this molecule is most easily oxidised by weak oxidants?'),
                  solution: t('Silpni oksidatoriai oksiduoja tiolį: $2 R-SH → R-S-S-R$.', 'Weak oxidants oxidise the thiol: $2 R-SH → R-S-S-R$.') },
                { prompt: t('Ką reikia daryti, norint tiltelius vėl atverti?', 'What must be done to open the bridges again?'), kind: 'choice',
                  options: ch([t('Redukuoti disulfidą (pavyzdžiui, $Zn$, $CH3COOH$).', 'Reduce the disulfide (for example $Zn$, $CH3COOH$).'), t('Oksiduoti dar stipriau.', 'Oxidise even more strongly.'), t('Pridėti šarmo ir kaitinti.', 'Add alkali and heat.'), t('Pridėti $FeCl3$.', 'Add $FeCl3$.')]), answer: 0,
                  hint: t('Atvirkštinė oksidacijos reakcija yra redukcija.', 'The reverse of oxidation is reduction.'),
                  solution: t('Disulfidas redukuojamas atgal į du tiolius; $FeCl3$ dar labiau jungtų tiolius.', 'The disulfide is reduced back to two thiols; $FeCl3$ would join thiols further.') }
              ],
              why: t('Tiolių ir disulfidų pora yra grįžtama redokso sistema: oksidacija sudaro $S-S$ tiltelį, redukcija jį nutraukia.', 'Thiol and disulfide form a reversible redox pair: oxidation makes the $S-S$ bridge, reduction breaks it.'), src: 'L12 p26–30'
            }
          ];
        })()
      },

      /* ------------------------------------------------------------ naming (generator) */
      {
        id: 'u12.name',
        title: t('Poliolių, fenolių, tiolių ir eterių pavadinimai', 'Names of polyols, phenols, thiols and ethers'),
        mirrors: [],
        gen(rng, ctx) {
          const POOL = [
            ['OCCO', 'polyol'], ['OCC(O)CO', 'polyol'], ['CC(O)CO', 'polyol'], ['OCCCO', 'polyol'], ['OCCCCO', 'polyol'], ['CC(O)C(C)O', 'polyol'], ['OCC(O)CCO', 'polyol'], ['OCC(O)C(O)CO', 'polyol'],
            ['Oc1ccccc1', 'phenol'], ['Cc1ccc(O)cc1', 'phenol'], ['Cc1ccccc1O', 'phenol'], ['Cc1cccc(O)c1', 'phenol'], ['Oc1ccc(Cl)cc1', 'phenol'], ['Oc1ccc(Cl)cc1Cl', 'phenol'],
            ['Oc1ccc(cc1)[N+](=O)[O-]', 'phenol'], ['Oc1c(Br)cc(Br)cc1Br', 'phenol'], ['Oc1ccccc1O', 'phenol'], ['Oc1ccc(O)cc1', 'phenol'], ['CCc1ccc(O)cc1', 'phenol'],
            ['CCS', 'thiol'], ['CCCS', 'thiol'], ['CC(C)S', 'thiol'], ['CCCCS', 'thiol'], ['CC(C)CCS', 'thiol'], ['OCCS', 'thiol'], ['SC(C)(C)CCO', 'thiol'], ['CC(O)CC(C)S', 'thiol'], ['SCC(S)CO', 'thiol'], ['CCC(C)S', 'thiol'],
            ['COC', 'ether'], ['CCOCC', 'ether'], ['COCC', 'ether'], ['COC(C)C', 'ether'], ['CCCOC', 'ether'], ['COC1CCCCC1', 'ether'], ['CCOc1ccccc1', 'ether'], ['COc1ccccc1', 'ether'],
            ['c1ccccc1Oc1ccccc1', 'ether'], ['CC(C)OC(C)C', 'ether'], ['CCOC(C)(C)C', 'ether'], ['CCCOCCC', 'ether'], ['COCC(C)C', 'ether']
          ];
          const KIND = {
            polyol: t('daugiahidroksilis alkoholis (poliolis)', 'polyhydric alcohol (polyol)'),
            phenol: t('fenolis', 'phenol'), thiol: t('tiolis', 'thiol'), ether: t('eteris', 'ether')
          };
          for (let tries = 0; tries < 40; tries++) {
            const [smi, kind] = ctx.pick(POOL);
            const nameT = nm(ctx, smi);
            if (!nameT) continue;
            const order = ['polyol', 'phenol', 'thiol', 'ether'];
            return {
              q: [{ mol: kind === 'ether' ? { smi } : { smi, opts: { numbers: 'all' } } }],
              steps: [
                {
                  prompt: t('Kuriai junginių klasei priklauso šis junginys?', 'Which class of compounds does this one belong to?'),
                  kind: 'choice', options: order.map((k) => ({ text: KIND[k] })), answer: order.indexOf(kind),
                  hint: t('Raskite funkcinę grupę ir pažiūrėkite, prie kokio atomo ji prisijungusi.', 'Find the functional group and see which atom it is bonded to.'),
                  solution: t('Funkcinė grupė rodo klasę: ' + KIND[kind].lt + '.', 'The functional group shows the class: ' + KIND[kind].en + '.')
                },
                {
                  prompt: t('Pavadinkite junginį (IUPAC).', 'Name the compound (IUPAC).'), kind: 'name', mol: { smi }, answer: { smi },
                  hint: kind === 'ether' ? t('Eterį vadinkite alkoksi- dariniu: pagrindinė grandinė su pakaitu $RO-$.', 'Name the ether as an alkoxy derivative: the main chain carrying an $RO-$ substituent.')
                    : t('Pagrindinė grupė ($OH$ arba $SH$) nusako galūnę (-olis, -tiolis); jei yra ir OH, ir SH, $SH$ tampa priešdėliu merkapto-.', 'The principal group ($OH$ or $SH$) sets the ending (-ol, -thiol); with both OH and SH present, $SH$ becomes the prefix mercapto-.'),
                  solution: t(nameT.lt, nameT.en)
                }
              ],
              why: t('Pavadinimą sudaro pagrindinė grandinė su pagrindine grupe (-olis, -tiolis), o likusios grupės tampa priešdėliais (hidroksi-, merkapto-, alkoksi-).', 'The name consists of the main chain with the principal group (-ol, -thiol), while the remaining groups become prefixes (hydroxy-, mercapto-, alkoxy-).'),
              src: 'L12 p2, p22, p33'
            };
          }
          throw new Error('u12.name: no case');
        }
      }
    ],
    coverage: {
      'S5.5': ['u12.will', 'u12.mech'],
      'S5.6': ['u12.will'],
      'S5.10': ['u12.mech'],
      'S5.13': ['u12.phenol', 'u12.ring'],
      'S5.14': ['u12.thiol', 'u12.multi'],
      'S5.17': ['u12.phenol', 'u12.ring', 'u12.multi'],
      'S5.18': ['u12.cleave', 'u12.mech'],
      'S5.19': ['u12.cleave', 'u12.mech'],
      'S5.20': ['u12.chain']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
