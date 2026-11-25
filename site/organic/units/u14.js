// site/organic/units/u14.js: unit 14, carboxylic acids and their derivatives
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // arrow labels that are only formulas or symbols

  /* ---------- shared helpers ---------- */
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const formulaOf = (ctx, s) => ctx.chem.formulaString(ctx.chem.parse(s));
  const heavy = (ctx, s) => ctx.chem.parse(s).atoms.length;

  // options: the right molecules first, then wrong ones (distinct by structure); at most n options in total
  function molOptions(ctx, rights, wrongs, n) {
    const seen = new Set(rights.map((s) => canon(ctx, s)));
    const out = rights.map((smi) => ({ mol: { smi } }));
    wrongs.forEach((s) => {
      if (!s || out.length >= n) return;
      let k;
      try { k = canon(ctx, s); } catch (e) { return; }
      if (!seen.has(k)) { seen.add(k); out.push({ mol: { smi: s } }); }
    });
    return out;
  }
  // wrong options with the same formula as the right one: isomers with the given group (small molecules only)
  function isoWrongs(ctx, right, filter) {
    if (heavy(ctx, right) > 8) return [];
    try { return ctx.shuffle(ctx.stereo.isomers(formulaOf(ctx, right), { filter })); } catch (e) { return []; }
  }

  /* ---------- builders for hand-written problems ---------- */
  const tx = (lt, en) => ({ text: t(lt, en) });
  const mo = (smi, opts) => ({ mol: opts ? { smi, opts } : { smi } });
  const sc = (...items) => ({ scheme: { items } });          // a scheme as an option
  const P = { plus: true };
  const AR = (label) => (label ? { arrow: '→', above: f(label) } : { arrow: '→' });
  const cho = (prompt, options, answer, hint, solution) => ({ prompt, kind: 'choice', options, answer, hint, solution });
  const mul = (prompt, options, answer, hint, solution) => ({ prompt, kind: 'multi', options, answer, hint, solution });
  const ord = (prompt, options, hint, solution) => ({ prompt, kind: 'order', options, hint, solution });
  const tap = (prompt, mol, answer, hint, solution) => ({ prompt, kind: 'atoms', mol, answer, hint, solution });
  // a product step: right molecule first (answer 0), then wrong molecules
  const prod = (prompt, right, wrongs, hint, solution) => ({ prompt, kind: 'choice', options: [mo(right)].concat(wrongs.map((w) => mo(w))), answer: 0, hint, solution });

  /* ---------- generators ---------- */
  const nm = (ctx, smi) => {
    const lt = ctx.name.name(smi, { lang: 'lt' }), en = ctx.name.name(smi, { lang: 'en' });
    return lt && en ? t(lt.name, en.name) : null;
  };
  const sig = (ctx, list) => list.map((s) => canon(ctx, s)).sort().join('|');
  const schemeOf = (list) => {
    const items = [];
    list.forEach((s, i) => { if (i) items.push({ plus: true }); items.push({ smi: s }); });
    return { scheme: { items } };
  };
  // carbonyl carbons (C=O) or nitrile carbons of a SMILES
  function acylCarbons(ctx, smi) {
    const m = ctx.chem.parse(smi);
    const out = [];
    m.atoms.forEach((a, i) => {
      if (a.el !== 'C' || a.aromatic) return;
      if (m.nbr[i].some((j) => (m.atoms[j].el === 'O' || m.atoms[j].el === 'N') && m.bondAt(i, j).order >= 2)) out.push(i);
    });
    return out;
  }
  const lastIndex = (ctx, smi) => ctx.chem.parse(smi).atoms.length - 1;

  // acyl groups (rs: written from the carbon that bears C=O) and alkyl groups of alcohols (qs: from the carbon that bears O; qe: ending at it)
  const RACYL = [{ rs: 'C' }, { rs: 'CC' }, { rs: 'CCC' }, { rs: 'C(C)C' }, { rs: 'CCCC' }, { rs: 'c1ccccc1' }, { rs: 'CCCCC' }];
  const QS = [{ qs: 'C', qe: 'C' }, { qs: 'CC', qe: 'CC' }, { qs: 'CCC', qe: 'CCC' }, { qs: 'C(C)C', qe: 'CC(C)' }, { qs: 'CCCC', qe: 'CCCC' }];
  const AMINES = ['CN', 'CCN', 'CNC', 'CCNCC', 'CCCN'];
  const QOX = { C: t('natrio metoksidas', 'sodium methoxide'), CC: t('natrio etoksidas', 'sodium ethoxide'), CCC: t('natrio propoksidas', 'sodium propoxide'), 'C(C)C': t('natrio izopropoksidas', 'sodium isopropoxide'), CCCC: t('natrio butoksidas', 'sodium butoxide') };
  const QOXF = { C: 'NaOCH3', CC: 'NaOC2H5', CCC: 'NaOC3H7', 'C(C)C': 'NaOCH(CH3)2', CCCC: 'NaOC4H9' };

  const LEAVE = [tx('chloridas $Cl-$', 'chloride $Cl-$'), tx('alkoksidas $RO-$', 'alkoxide $RO-$'), tx('karboksilatas $RCOO-$', 'carboxylate $RCOO-$'), tx('amido anijonas $NH2-$', 'amide ion $NH2-$')];
  const LEAVE_IDX = { Cl: 0, RO: 1, RCOO: 2 };

  /* acid + alkali: the salt (S6.15) */
  const SALT_R = ['', 'C', 'CC', 'CCC', 'CC(C)', 'CCCC', 'CC(C)(C)', 'CCCCCC', 'c1ccccc1', 'Cc1ccc(cc1)', 'Clc1ccc(cc1)', 'ClC', 'CC(Cl)', 'C=C', 'c1ccccc1C', 'CC(O)', 'Oc1ccccc1'];
  function genSalt(rng, ctx) {
    const { chem, react } = ctx;
    const r = ctx.pick(SALT_R);
    const M = ctx.pick(['Na', 'K']);
    const acid = r + 'C(=O)O';
    const res = react.run('acid.salt', [acid], { metal: M });
    const maj = res.products.filter((p) => p.major);
    if (maj.length !== 1) throw new Error('u14.salt: expected one salt');
    const salt = maj[0].smi;
    const O = lastIndex(ctx, acid);
    const alkoxide = (r + 'C[O-].[' + M + '+]');
    const extra = r === 'Oc1ccccc1' ? 'OC(=O)c1ccccc1[O-].[' + M + '+]' : r === 'CC(O)' ? 'CC([O-])C(=O)O.[' + M + '+]' : null;
    const alkane = r === '' ? null : r;
    const wrongs = [alkoxide, extra, alkane].filter(Boolean);
    const opts = molOptions(ctx, [salt], wrongs, 3);
    opts.push(tx('Reakcija nevyksta: rūgštis su šarmu nereaguoja.', 'No reaction: an acid does not react with an alkali.'));
    const base = M === 'Na' ? 'NaOH' : 'KOH';
    const equiv = r === 'Oc1ccccc1' || r === 'CC(O)';
    const halo = r === 'ClC' || r === 'CC(Cl)';
    const lt = name_(ctx, salt);
    const mechIdx = 'H' + O;
    const steps = [
      tap(t('Bakstelėkite deguonies atomą, kuris praranda protoną reaguodamas su šarmu.', 'Tap the oxygen atom that loses its proton when the alkali reacts.'),
        { smi: acid, opts: { numbers: 'all' } }, [O],
        t('Kuri O–H jungtis duoda stabiliausią anijoną, kurio krūvis pasiskirsto per kelis atomus?', 'Which O–H bond gives the most stable anion, one whose charge is spread over several atoms?'),
        t('Rūgštinė yra karboksigrupės O–H jungtis: atsiradęs karboksilato anijonas turi dvi rezonansines formules, o alkoholio ar fenolio O–H tokio stabilumo neduoda.', 'The acidic bond is the O–H of the carboxyl group: the carboxylate anion that results has two resonance structures, which an alcohol or phenol O–H cannot match.')),
      {
        prompt: t('Koks yra organinis produktas?', 'What is the organic product?'),
        kind: 'choice', options: opts, answer: 0,
        hint: t('Palyginkite, kas lieka, kai rūgštis atiduoda protoną, ir kas yra produkto krūvio nešėjas.', 'Compare what is left when the acid has given up its proton, and what carries the charge in the product.'),
        solution: [
          { p: t('$' + base + '$ yra bazė: hidroksidas atplėšia rūgšties protoną, ir susidaro karboksilato druska bei vanduo.', '$' + base + '$ is a base: hydroxide removes the proton of the acid, and a carboxylate salt and water form.') },
          ...(r === 'CC(C)' || r === 'CC(C)(C)' ? [] : [{
            mech: [{
              scheme: { items: [{ smi: acid, opts: { allH: true } }, { plus: true }, { smi: '[OH-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: mechIdx } }, { from: { m: 0, b: [O, mechIdx] }, to: { m: 0, a: O } }]
            }]
          }]),
          { mol: { smi: salt } }
        ]
      }
    ];
    if (lt) {
      steps.push({
        prompt: t('Pavadinkite druską.', 'Name the salt.'), kind: 'name', mol: { smi: salt }, answer: { smi: salt },
        hint: t('Pirmiausia metalas, po to rūgšties anijono pavadinimas su galūne -atas.', 'The metal first, then the name of the acid anion ending in -oate (-atas).'),
        solution: lt
      });
    }
    return {
      q: [{ scheme: { items: [{ smi: acid }, { plus: true }, { smi: M === 'Na' ? '[OH-].[Na+]' : '[OH-].[K+]' }, equiv ? { arrow: '→', above: t('1 ekv.', '1 equiv.') } : { arrow: '→' }] } }],
      steps,
      why: t('Karboksirūgštis yra pakankamai stipri rūgštis, kad hidroksidas ją visiškai neutralizuotų: anijono krūvis pasiskirsto tarp dviejų deguonų, o susidaro druska ir vanduo. Redukcija ar dekarboksilinimas vyksta kitomis sąlygomis.' + (halo ? ' (Šaltame tirpale halogenas nesikeičia; kaitinant pakeičiamas OH.)' : ''),
        'A carboxylic acid is acidic enough for hydroxide to neutralise it completely: the charge of the anion is shared by two oxygens, and a salt and water form. Reduction or decarboxylation need different conditions.' + (halo ? ' (In the cold the halogen stays; on heating it is replaced by OH.)' : '')),
      src: 'S6.15'
    };
  }
  function name_(ctx, smi) { return nm(ctx, smi) ? t(nm(ctx, smi).lt, nm(ctx, smi).en) : null; }

  /* nucleophilic acyl substitution: products (S6.7, S6.16, S6.20, S6.22) */
  function genNu(rng, ctx) {
    const { chem, react } = ctx;
    const X = ctx.pick(RACYL), Q = ctx.pick(QS), A = ctx.pick(AMINES);
    const fam = ctx.pick(['cl-alc', 'cl-nh3', 'cl-am', 'anh-w', 'anh-nh3', 'anh-alc', 'ac-alc', 'es-base', 'es-acid', 'ac-socl2', 'nitrile']);
    const acid = 'OC(=O)' + X.rs, chlor = 'ClC(=O)' + X.rs, anh = 'O=C(' + X.rs + ')OC(=O)' + X.rs;
    const ester = Q.qe + 'OC(=O)' + X.rs, alc = 'O' + Q.qs, amide = 'NC(=O)' + X.rs, nitr = 'N#C' + X.rs;
    const salt = '[O-]C(=O)' + X.rs + '.[Na+]';
    const alkoxide = Q.qe + '[O-].[Na+]';
    let F;
    const swapped = 'O=C(' + Q.qs + ')O' + X.rs;          // the ester with the two alkyl groups swapped
    const isoEster = () => [swapped];
    switch (fam) {
      case 'cl-alc':
        F = { reag: [chlor, alc], run: ['acyl.nu', [chlor, alc], { nu: 'alcohol' }], tap: chlor, leave: 'Cl', rights: [ester], wrongs: isoEster().concat([acid, Q.qe + 'Cl', anh]) };
        F.why = t('Rūgšties chloridas yra reaktingiausias darinys: alkoholis puola karbonilo anglį, iš tetraedrinio tarpinio junginio išeina chloridas, ir gaunamas esteris. Rūgštinės katalizės nereikia.', 'An acyl chloride is the most reactive derivative: the alcohol attacks the carbonyl carbon, chloride leaves the tetrahedral intermediate, and an ester forms. No acid catalyst is needed.');
        break;
      case 'cl-nh3':
        F = { reag: [chlor, 'N'], arrow: t('2 ekv.', '2 equiv.'), run: ['acyl.nu', [chlor, 'N'], { nu: 'ammonia' }], tap: chlor, leave: 'Cl', rights: [amide], wrongs: ['[O-]C(=O)' + X.rs + '.[NH4+]', acid, nitr].concat(isoWrongs(ctx, amide, 'amide').slice(0, 1)) };
        F.why = t('Amoniakas puola chlorido karbonilo anglį, išeina $Cl-$. Antras amoniako ekvivalentas suriša išsiskyrusį HCl, todėl gaunamas amidas ir amonio chloridas, o ne rūgštis ar jos druska.', 'Ammonia attacks the carbonyl carbon of the chloride and $Cl-$ leaves. A second equivalent of ammonia takes up the HCl, so an amide and ammonium chloride result, not an acid or its salt.');
        break;
      case 'cl-am': {
        F = { reag: [chlor, A], arrow: t('2 ekv.', '2 equiv.'), run: ['acyl.nu', [chlor, A], { nu: 'amine' }], tap: chlor, leave: 'Cl', rights: null, wrongs: [acid, amide] };
        const maj = react.run('acyl.nu', [chlor, A], { nu: 'amine' }).products.filter((p) => p.major);
        if (maj.length !== 1) throw new Error('u14.nu: amide');
        F.rights = [maj[0].smi];
        F.wrongs = isoWrongs(ctx, F.rights[0], 'amide').slice(0, 1).concat(F.wrongs);
        F.why = t('Aminas yra nukleofilas: jo azotas puola chlorido karbonilo anglį, išeina $Cl-$, ir N–H pakeičiamas acilgrupe. Dėl to pirminis aminas duoda antrinį, o antrinis – tretinį amidą; antras amino ekvivalentas suriša HCl.', 'The amine is the nucleophile: its nitrogen attacks the carbonyl carbon of the chloride, $Cl-$ leaves, and an N–H is replaced by the acyl group. So a primary amine gives a secondary amide and a secondary amine a tertiary amide; a second equivalent of the amine takes up the HCl.');
        break;
      }
      case 'anh-w':
        F = { reag: [anh, 'O'], run: ['acyl.nu', [anh], { nu: 'water' }], tap: anh, leave: 'RCOO', two: true, rights: [acid, acid], wrongSets: [[acid, 'OC' + X.rs], [acid, 'O=C' + X.rs], ['[O-]C(=O)' + X.rs + '.[Na+]', acid]], skipCheck: true };
        F.why = t('Vanduo puola anhidrido karbonilo anglį; išeina karboksilatas, kuris tampa kita rūgšties molekule. Iš vienos anhidrido molekulės gaunamos dvi rūgšties molekulės.', 'Water attacks a carbonyl carbon of the anhydride; a carboxylate leaves and becomes a second acid molecule. One anhydride molecule gives two molecules of the acid.');
        break;
      case 'anh-nh3':
        F = { reag: [anh, 'N'], run: ['acyl.nu', [anh, 'N'], { nu: 'ammonia' }], tap: anh, leave: 'RCOO', two: true, rights: [amide, acid], wrongSets: [[amide, amide], [acid, acid], [nitr, acid]] };
        F.why = t('Amoniakas puola vieną anhidrido karbonilo anglį. Viena acilo dalis lieka amide, kita išeina kaip karboksilatas ir virsta rūgštimi. Su amoniako pertekliumi rūgštis lieka amonio druska.', 'Ammonia attacks one carbonyl carbon of the anhydride. One acyl part stays in the amide and the other leaves as a carboxylate and becomes the acid. With an excess of ammonia the acid is present as its ammonium salt.');
        break;
      case 'anh-alc':
        F = { reag: [anh, alc], run: ['acyl.nu', [anh, alc], { nu: 'alcohol' }], tap: anh, leave: 'RCOO', two: true, rights: [ester, acid], wrongSets: [[ester, ester], [acid, acid], [Q.qe + 'O' + Q.qe, acid]] };
        F.why = t('Alkoholis puola vieną karbonilo anglį: viena acilo dalis lieka esteryje, kita išeina kaip karboksilatas ir tampa rūgštimi.', 'The alcohol attacks one carbonyl carbon: one acyl part stays in the ester and the other leaves as a carboxylate and becomes the acid.');
        break;
      case 'ac-alc':
        F = { reag: [acid, alc], arrow: f('H+'), run: ['acid.ester', [acid, alc], null], tap: acid, leave: null, rights: [ester], wrongs: isoEster().concat([anh, Q.qe + 'O' + Q.qe, chlor]) };
        F.why = t('Rūgštis ir alkoholis, esant H+, sudaro esterį ir vandenį: protonuota karbonilo grupė yra pakankamai elektrofilinė silpnam nukleofilui, o iš tetraedrinio tarpinio junginio išeina vanduo. Reakcija grįžtamoji.', 'An acid and an alcohol with H+ give an ester and water: the protonated carbonyl is electrophilic enough for a weak nucleophile, and water leaves the tetrahedral intermediate. The reaction is reversible.');
        break;
      case 'es-base':
        F = { reag: [ester, '[OH-].[Na+]'], arrow: f('H2O'), run: ['ester.hydrolysis', [ester], { medium: 'base' }], tap: ester, leave: 'RO', two: true, rights: [salt, alc], wrongSets: [[acid, alc], [acid, alkoxide], [salt, Q.qe + 'OC(=O)' + X.rs]] };
        F.why = t('Hidroksidas puola esterio karbonilo anglį, išeina alkoksidas. Šarminėje terpėje rūgštis iš karto netenka protono, todėl gaunama druska ir alkoholis; šarmas sunaudojamas, o reakcija negrįžtama.', 'Hydroxide attacks the carbonyl carbon of the ester and an alkoxide leaves. In alkali the acid at once loses its proton, so a salt and an alcohol form; the alkali is consumed and the reaction is irreversible.');
        break;
      case 'es-acid':
        F = { reag: [ester, 'O'], arrow: f('H+'), run: ['ester.hydrolysis', [ester], { medium: 'acid' }], tap: ester, leave: null, two: true, rights: [acid, alc], wrongSets: [[salt, alc], [acid, Q.qe + 'O' + Q.qe], [acid]] };
        F.why = t('Rūgštinė hidrolizė yra esterinimo priešingybė: protonuotą karbonilą puola vanduo, ir gaunama rūgštis bei alkoholis. Reakcija grįžtamoji, todėl vandens reikia pertekliaus; druskos rūgštyje nesusidaro.', 'Acid hydrolysis is the reverse of esterification: water attacks the protonated carbonyl and the acid and the alcohol form. The reaction is reversible, so an excess of water is used; no salt forms in acid.');
        break;
      case 'ac-socl2':
        F = { reag: [acid, 'ClS(Cl)=O'], run: ['acid.socl2', [acid], null], tap: acid, leave: null, rights: [chlor], wrongs: [anh, 'Cl' + X.rs, 'O=S(Cl)OC(=O)' + X.rs] };
        F.why = t('Tionilchloridas pakeičia rūgšties OH grupę chloru (išsiskiria $SO2$ ir HCl): gaunamas aktyvintas darinys – rūgšties chloridas. Jis vėliau su alkoholiu ar aminu duoda esterį ar amidą.', 'Thionyl chloride replaces the OH of the acid by chlorine ($SO2$ and HCl are released) and gives an activated derivative, the acyl chloride, which later gives an ester or amide with an alcohol or amine.');
        break;
      default:
        F = { reag: [nitr, 'O'], arrow: t('H2O, H+, t° (ilgai)', 'H2O, H+, t° (prolonged)'), run: ['nitrile.hydrolysis', [nitr], null], tap: nitr, leave: null, rights: [acid], wrongs: [amide, '[O-]C(=O)' + X.rs + '.[NH4+]', 'NC' + X.rs] };
        F.why = t('Nitrilas hidrolizuojamas rūgštyje per amidą iki karboksirūgšties (ir $NH4+$). Hidrolizės produktas yra rūgštis, todėl nitrilai priskiriami rūgščių dariniams. Amidas yra tik tarpinis junginys; kaitinant rūgštyje hidrolizė eina iki rūgšties.', 'A nitrile is hydrolysed in acid through the amide to the carboxylic acid (and $NH4+$). The product of hydrolysis is the acid, which is why nitriles count as acid derivatives. The amide is only an intermediate; on heating in acid hydrolysis goes on to the acid.');
    }
    // the engine must agree with the intended product
    if (!F.skipCheck && F.run) {
      const res = react.run(F.run[0], F.run[1], F.run[2] || {});
      const have = new Set(res.products.map((p) => canon(ctx, p.smi)));
      if (!F.rights.every((s) => have.has(canon(ctx, s)))) throw new Error('u14.nu: engine disagrees for ' + fam);
      if (!F.two && res.products.filter((p) => p.major).length !== 1) throw new Error('u14.nu: several major products');
    }
    const carbons = acylCarbons(ctx, F.tap);
    if (!carbons.length) throw new Error('u14.nu: no carbonyl carbon');
    let options;
    if (F.two) {
      options = [schemeOf(F.rights)];
      const seen = new Set([sig(ctx, F.rights)]);
      F.wrongSets.forEach((w) => { const k = sig(ctx, w); if (!seen.has(k) && options.length < 4) { seen.add(k); options.push(schemeOf(w)); } });
    } else {
      options = molOptions(ctx, [F.rights[0]], F.wrongs, 4);
    }
    if (options.length < 3) throw new Error('u14.nu: too few options');
    const reagItems = [];
    F.reag.forEach((s, i) => { if (i) reagItems.push({ plus: true }); reagItems.push({ smi: s }); });
    const arrowSym = fam === 'ac-alc' || fam === 'es-acid' ? '⇌' : '→';
    reagItems.push(F.arrow ? { arrow: arrowSym, above: F.arrow } : { arrow: arrowSym });
    const steps = [
      tap(carbons.length > 1 ? t('Bakstelėkite anglies atomus, kuriuos gali pulti nukleofilas.', 'Tap the carbon atoms that a nucleophile can attack.') : t('Bakstelėkite anglies atomą, kurį puola nukleofilas.', 'Tap the carbon atom that the nucleophile attacks.'),
        { smi: F.tap, opts: { numbers: 'all' } }, carbons,
        fam === 'nitrile' ? t('Ieškokite $C≡N$ grupės anglies: elektroneigiamas azotas daro ją δ+.', 'Look for the carbon of the $C≡N$ group: the electronegative nitrogen makes it δ+.') : t('Ieškokite anglies, kuri sujungta su dviem elektroneigiamais atomais ir todėl yra stipriai δ+.', 'Look for the carbon bonded to two electronegative atoms, which makes it strongly δ+.'),
        t('Šis karbonilo (ar nitrilo) anglies atomas yra elektrofilas: jį puola nukleofilas ir susidaro tetraedrinis tarpinis junginys (nitrilo atveju – po prijungimo vandens).', 'This carbonyl (or nitrile) carbon is the electrophile: the nucleophile attacks it and a tetrahedral intermediate forms (for a nitrile, after water has added).'))
    ];
    if (F.leave) {
      steps.push(cho(t('Kuri grupė išeina iš tetraedrinio tarpinio junginio?', 'Which group leaves the tetrahedral intermediate?'), LEAVE.slice(0, 4), LEAVE_IDX[F.leave],
        t('Išeina grupė, kuri geriausiai išlaiko neigiamą krūvį, t. y. yra silpniausia bazė.', 'The group that leaves is the one that holds a negative charge best, i.e. the weakest base.'),
        t('Išeina geriausia nueinančioji grupė – silpniausia bazė. Eilė: $Cl-$ > $RCOO-$ > $RO-$ > $NH2-$.', 'The best leaving group goes: the weakest base. The order is $Cl-$ > $RCOO-$ > $RO-$ > $NH2-$.')));
    }
    steps.push({
      prompt: F.two ? t('Kurie produktai susidaro?', 'Which products form?') : t('Koks yra pagrindinis organinis produktas?', 'What is the main organic product?'),
      kind: 'choice', options, answer: 0,
      hint: t('Nustatykite, kas yra nukleofilas, kas – nueinančioji grupė, ir kuri acilo dalis lieka.', 'Decide which species is the nucleophile, which is the leaving group, and which acyl part is kept.'),
      solution: [{ p: F.why }].concat(F.rights.map((s, i) => ({ mol: { smi: s } })))
    });
    const rname = !F.two ? nm(ctx, F.rights[0]) : null;
    if (rname) {
      steps.push({
        prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: F.rights[0] }, answer: { smi: F.rights[0] },
        hint: t('Raskite karbonilo grupę ir pagal ją pasirinkite galūnę: -oatas, -amidas, -oilchloridas ar rūgštis.', 'Find the carbonyl group and choose the ending from it: -oate, -amide, -oyl chloride or acid.'),
        solution: rname
      });
    }
    return { q: [{ scheme: { items: reagItems } }], steps, why: F.why, src: 'S6.7' };
  }

  /* Claisen condensation of one ester (S6.8) */
  const CL_R = [{ r: '', rs: '' }, { r: 'C', rs: 'C' }, { r: 'CC', rs: 'CC' }, { r: 'CCC', rs: 'CCC' }, { r: 'CC(C)', rs: 'C(C)C' }, { r: 'c1ccccc1', rs: 'c1ccccc1' }, { r: 'CCCC', rs: 'CCCC' }];
  function genClaisen(rng, ctx) {
    const { chem, react } = ctx;
    const R = ctx.pick(CL_R), Q = ctx.pick(QS);
    const ester = R.r + 'CC(=O)O' + Q.qs;
    const alpha = R.rs ? 'C(' + R.rs + ')' : 'C';
    const left = R.r + 'C';                                   // R-CH2 (ends at the CH2)
    const product = left + 'C(=O)' + alpha + 'C(=O)O' + Q.qs;
    const res = react.run('claisen', [ester]);
    const maj = res.products.filter((p) => p.major);
    if (maj.length !== 1 || canon(ctx, maj[0].smi) !== canon(ctx, product)) throw new Error('u14.claisen: engine disagrees');
    const tetra = left + 'C(O)(O' + Q.qs + ')' + alpha + 'C(=O)O' + Q.qs;
    const keto = left + 'C(=O)' + alpha + 'C(=O)O';
    const ketone = left + 'C(=O)C' + R.rs;
    const carb = acylCarbons(ctx, ester)[0];
    const m = chem.parse(ester);
    const a = m.nbr[carb].find((j) => m.atoms[j].el === 'C');
    const other = Q.qs === 'C' ? 'CC' : 'C';
    const baseOpts = [
      tx(QOX[Q.qs].lt + ' ($' + QOXF[Q.qs] + '$)', QOX[Q.qs].en + ' ($' + QOXF[Q.qs] + '$)'),
      tx('natrio hidroksidas ($NaOH$)', 'sodium hydroxide ($NaOH$)'),
      tx('natrio ' + (Q.qs === 'C' ? 'etoksidas ($NaOC2H5$)' : 'metoksidas ($NaOCH3$)'), 'sodium ' + (Q.qs === 'C' ? 'ethoxide ($NaOC2H5$)' : 'methoxide ($NaOCH3$)')),
      tx('vandenilio chloridas ($HCl$)', 'hydrogen chloride ($HCl$)')
    ];
    const opts = molOptions(ctx, [product], [tetra, keto, ketone], 4);
    const nmP = nm(ctx, product);
    const steps = [
      tap(t('Bakstelėkite anglies atomą, nuo kurio bazė atplėšia protoną.', 'Tap the carbon atom from which the base removes a proton.'),
        { smi: ester, opts: { numbers: 'all' } }, [a],
        t('Kuris anglies atomas yra greta karbonilo ir turi vandenilių (α-padėtis)?', 'Which carbon is next to the carbonyl and carries hydrogens (the α-position)?'),
        t('α-Vandenilis rūgštus, nes susidaręs anijonas (enolatas) rezonansu pasidalija krūvį su karbonilo deguonimi.', 'The α-hydrogen is acidic because the anion that forms (the enolate) shares its charge with the carbonyl oxygen by resonance.')),
      cho(t('Kokia bazė tinka šiai kondensacijai?', 'Which base suits this condensation?'), baseOpts, 0,
        t('Bazė neturi nei muilinti esterio, nei keisti jo alkoksigrupės.', 'The base must neither saponify the ester nor exchange its alkoxy group.'),
        t('Naudojamas to paties alkoholio alkoksidas: kitas alkoksidas pakeistų esterio alkoksigrupę, $NaOH$ – hidrolizuotų (muilintų), $HCl$ nėra bazė.', 'The alkoxide of the same alcohol is used: a different alkoxide would exchange the ester\'s alkoxy group, $NaOH$ would hydrolyse (saponify) it, and $HCl$ is not a base.')),
      {
        prompt: t('Koks yra kondensacijos produktas (po parūgštinimo)?', 'What is the product of the condensation (after acidification)?'),
        kind: 'choice', options: opts, answer: 0,
        hint: t('Naujas C–C ryšys jungia vienos molekulės α-anglį su kitos karbonilo anglimi; alkoksidas išeina.', 'The new C–C bond joins the α-carbon of one molecule to the carbonyl carbon of the other; the alkoxide leaves.'),
        solution: [
          { p: t('Anijonas puola kitos esterio molekulės karbonilo anglį; iš tetraedrinio junginio išeina alkoksidas, todėl atsiranda $C=O$. Susidaro β-ketoesteris.', 'The anion attacks the carbonyl carbon of a second ester molecule; the alkoxide leaves the tetrahedral intermediate, so a $C=O$ appears. A β-keto ester forms.') },
          { mol: { smi: product } }
        ]
      }
    ];
    if (nmP) {
      steps.push({
        prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: product }, answer: { smi: product },
        hint: t('Pagrindinė grandinė – esterio; oksogrupė ir alkilas yra pakaitai.', 'The main chain is the ester\'s; the oxo group and the alkyl group are substituents.'),
        solution: nmP
      });
    }
    return {
      q: [{ scheme: { items: [{ smi: ester }, { plus: true }, { smi: ester }, { arrow: '→', above: f('$' + QOXF[Q.qs] + '$') }] } }],
      steps,
      why: t('Klaizeno kondensacijoje vienos esterio molekulės enolatas puola kitos karbonilo anglį (prijungimas), o iš tetraedrinio junginio išeina alkoksidas (eliminavimas). Kadangi β-ketoesteris dar turi rūgštų vandenilį tarp dviejų karbonilų, bazė jį atplėšia ir pastumia pusiausvyrą į produktą.',
        'In the Claisen condensation the enolate of one ester molecule attacks the carbonyl carbon of another (addition) and an alkoxide leaves the tetrahedral intermediate (elimination). Because the β-keto ester still has an acidic hydrogen between its two carbonyls, the base removes it and pulls the equilibrium to the product.'),
      src: 'S6.8'
    };
  }

  /* hydroxy acids: lactones (S6.18) */
  const HY_R = ['', 'C', 'CC', 'CCC', 'c1ccccc1', 'C(C)C'];
  function genHydroxy(rng, ctx) {
    const { chem, react } = ctx;
    if (rng() < 0.65) {
      const rs = ctx.pick(HY_R), delta = rng() < 0.5, s1 = rng() < 0.5, s2 = rng() < 0.5;
      const Rb = rs ? '(' + rs + ')' : '';
      const mid = delta ? 'C' : '';
      const ha = 'OC' + Rb + mid + 'C' + (s2 ? '(C)' : '') + 'C' + (s1 ? '(C)' : '') + 'C(=O)O';
      const res = react.run('lactone', [ha]);
      const maj = res.products.filter((p) => p.major);
      if (maj.length !== 1) throw new Error('u14.hydroxy: lactone');
      const lactone = maj[0].smi;
      const ene = 'C' + Rb + '=C' + (delta ? 'C' : '') + (s2 ? '(C)' : '') + 'C' + (s1 ? '(C)' : '') + 'C(=O)O';
      const eneFix = delta ? 'C' + Rb + '=C' + 'C' + (s2 ? '(C)' : '') + 'C' + (s1 ? '(C)' : '') + 'C(=O)O' : 'C' + Rb + '=C' + (s2 ? '(C)' : '') + 'C' + (s1 ? '(C)' : '') + 'C(=O)O';
      const oxo = 'O=C' + Rb + mid + 'C' + (s2 ? '(C)' : '') + 'C' + (s1 ? '(C)' : '') + 'C(=O)O';
      const opts = molOptions(ctx, [lactone], [eneFix, oxo], 3);
      opts.push(tx('Žiedas nesusidaro: rūgštis ir alkoholis neveikia vienas kito toje pačioje molekulėje.', 'No ring forms: the acid and alcohol cannot react with each other within one molecule.'));
      const size = delta ? 6 : 5;
      const mm = chem.parse(ha);
      const Oi = mm.atoms.findIndex((a, i) => a.el === 'O' && a.h === 1 && mm.nbr[i].length === 1 && mm.atoms[mm.nbr[i][0]].el === 'C' && !acylCarbons(ctx, ha).includes(mm.nbr[i][0]));
      const Ci = acylCarbons(ctx, ha)[0];
      return {
        q: [{ p: t('Hidroksirūgštis šildoma rūgščioje terpėje.', 'The hydroxy acid is warmed in acidic solution.') }, { scheme: { items: [{ smi: ha }, { arrow: '→', above: f('H+, t°') }] } }],
        steps: [
          tap(t('Bakstelėkite du atomus, tarp kurių susidaro naujas ryšys žiedui uždaryti.', 'Tap the two atoms between which the new bond forms to close the ring.'),
            { smi: ha, opts: { numbers: 'all' } }, [Oi, Ci],
            t('Tai vidumolekulinis esterinimas: kuris atomas yra nukleofilas, kuris – elektrofilas?', 'This is an intramolecular esterification: which atom is the nucleophile and which the electrophile?'),
            t('Hidroksigrupės deguonis puola karboksigrupės anglį; atsiskiria $H2O$, ir susidaro esterio jungtis.', 'The oxygen of the hydroxy group attacks the carbon of the carboxyl group; $H2O$ is lost and the ester linkage forms.')),
          { prompt: t('Koks yra produktas?', 'What is the product?'), kind: 'choice', options: opts, answer: 0,
            hint: t('Vidumolekulinis esterinimas duoda ciklinį esterį; dehidratacija kitaip duotų alkeną.', 'Intramolecular esterification gives a cyclic ester; a different dehydration would give an alkene instead.'),
            solution: [{ p: t('Rūgštis ir OH vienoje molekulėje esterinasi vidumolekuliškai: susidaro ciklinis esteris – laktonas.', 'The acid and the OH in one molecule esterify intramolecularly: a cyclic ester, a lactone, forms.') }, { mol: { smi: lactone } }] },
          { prompt: t('Kiek atomų yra žiede (skaičiuojant ir deguonį)?', 'How many atoms are in the ring (counting the oxygen)?'), kind: 'number', answer: { value: size, tol: 0 },
            hint: t('Į žiedą įeina ir esterio deguonis, ir karbonilo anglis.', 'The ring contains the ester oxygen and the carbonyl carbon.'),
            solution: t('Žiede yra ' + size + ' atomai: esterio deguonis ir ' + (size - 1) + ' anglies atomai. Stabilūs tik 5 ir 6 narių žiedai.', 'The ring has ' + size + ' atoms: the ester oxygen and ' + (size - 1) + ' carbons. Only 5- and 6-membered rings are stable.') }
        ],
        why: t('γ- ir δ-hidroksirūgštys vidumolekuliškai esterinasi, nes grupės yra tinkamu atstumu ir susidaro stabilūs penkių ar šešių narių žiedai (laktonai). Tai ta pati esterinimo reakcija, tik ji vyksta vienoje molekulėje.',
          'γ- and δ-hydroxy acids esterify intramolecularly because the groups are at the right distance and a stable five- or six-membered ring (a lactone) forms. It is the same esterification, only within a single molecule.'),
        src: 'S6.18'
      };
    }
    // which hydroxy acids form stable lactones: pick four OH positions on a chain of L carbons
    const L = ctx.pick([5, 6, 7, 8]);
    const positions = ctx.shuffle([2, 3, 4, 5, 6].filter((p) => p <= L)).slice(0, 4);
    if (!positions.some((p) => p === 4 || p === 5)) throw new Error('u14.hydroxy: no lactone in set');
    const mk = (p) => { let s = ''; for (let k = L; k >= 2; k--) s += 'C' + (k === p ? '(O)' : ''); return s + 'C(=O)O'; };
    positions.sort((x, y) => x - y);
    const options = positions.map((p) => ({ mol: { smi: mk(p) } }));
    const answer = positions.map((p, i) => (p === 4 || p === 5 ? i : -1)).filter((i) => i >= 0);
    const GREEK = { 2: 'α', 3: 'β', 4: 'γ', 5: 'δ', 6: 'ε' };
    return {
      q: [{ p: t('Čia pavaizduotos keturios hidroksirūgštys su ' + L + ' anglies atomų grandine. Jos šildomos rūgščioje terpėje.', 'Four hydroxy acids with a chain of ' + L + ' carbons are shown. They are warmed in acidic solution.') }],
      steps: [{
        prompt: t('Pažymėkite rūgštis, iš kurių lengvai susidaro stabilus laktonas.', 'Pick the acids that readily form a stable lactone.'),
        kind: 'multi', options, answer,
        hint: t('Suskaičiuokite žiedo narius, kurie susidarytų uždarant žiedą, įskaitant deguonį. Stabilūs tik 5 ir 6 narių žiedai.', 'Count the ring members that would result from closing the ring, including the oxygen. Only 5- and 6-membered rings are stable.'),
        solution: t('Laktonas stabilus, kai OH yra γ (4-) ar δ (5-) padėtyje: žiedas turi 5 ar 6 narius. Šio rinkinio padėtys: ' + positions.map((p) => p + ' (' + GREEK[p] + ')').join(', ') + '. α ir β rūgštys duotų 3 ir 4 narių žiedus, o ε – 7 narių.',
          'A lactone is stable when the OH is in the γ (4-) or δ (5-) position: the ring has 5 or 6 members. Positions in this set: ' + positions.map((p) => p + ' (' + GREEK[p] + ')').join(', ') + '. α and β acids would give 3- and 4-membered rings, an ε acid a 7-membered ring.')
      }],
      why: t('Laktono žiedas stabilus tik su 5 ar 6 nariais. Todėl γ- ir δ-hidroksirūgštys ciklizuojasi, α-hidroksirūgštys sudaro laktidus (dviejų molekulių ciklinį diesterį), o β-hidroksirūgštys dehidratuojasi iki nesočiųjų rūgščių.',
        'A lactone ring is stable only with 5 or 6 members. So γ- and δ-hydroxy acids cyclise, α-hydroxy acids form lactides (a cyclic diester of two molecules) and β-hydroxy acids dehydrate to unsaturated acids.'),
      src: 'T p93, p94'
    };
  }



  // lithocholic acid skeleton: E is the side-chain end (carbon 24 and its groups), A the group at C3 (ring A)
  const ster = (E, A) => 'CC(CC' + E + ')C1CCC2C1(C)CCC1C2CCC2C' + A + 'CCC12C';

  ORG.unit({
    id: 'u14',
    lectureMissing: true,
    notes: [
      /* ------------------------------------------------------------ 1 */
      {
        id: 'acid',
        title: t('Karboksirūgštys ir jų rūgštingumas', 'Carboxylic acids and their acidity'),
        blocks: [
          { h: t('Karboksigrupė', 'The carboxyl group') },
          {
            p: t('Karboksigrupė –COOH turi savų savybių, kurių neturi atskirai paimti $C=O$ ir –OH: karbonilo anglis (δ+) traukia hidroksigrupės elektronus, todėl O–H ryšys susilpnėja ir vandenilis atsiskiria kaip protonas.',
              'The carboxyl group –COOH has properties that a separate $C=O$ and –OH do not have: the carbonyl carbon (δ+) pulls on the hydroxyl electrons, so the O–H bond weakens and the hydrogen leaves as a proton.'),
            src: 'T p87'
          },
          {
            mol: [
              { smi: 'OC=O', name: t('metano rūgštis', 'methanoic acid'), caption: t('skruzdžių rūgštis', 'formic acid') },
              { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid'), caption: t('acto rūgštis', 'acetic acid') },
              { smi: 'OC(=O)c1ccccc1', name: t('benzenkarboksirūgštis', 'benzoic acid') }
            ]
          },
          { h: t('Kodėl stipresnės už alkoholius?', 'Why stronger than alcohols?') },
          {
            p: t('Kai protonas atsiskiria, lieka karboksilato anijonas: jo krūvį dalijasi du deguonies atomai, ir tai užrašoma dviem rezonansinėmis formulėmis. Alkoksido krūvis lieka ant vieno atomo, todėl alkoholiai daug silpnesni.',
              'When the proton leaves, a carboxylate anion remains: two oxygens share its charge, which is written with two resonance structures. The charge of an alkoxide stays on one atom, so alcohols are much weaker acids.'),
            src: 'T p87'
          },
          {
            resonance: [{ smi: 'CC(=O)[O-]' }, { smi: 'CC([O-])=O' }],
            caption: t('Etanoato anijonas: abi C–O jungtys vienodos, krūvis pasiskirstęs per dvi O.', 'The ethanoate anion: both C–O bonds are equal and the charge is spread over two oxygens.'),
            src: 'T p87'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)O' }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }, { smi: 'CC(=O)[O-]' }, { plus: true }, { smi: 'O' }] },
            caption: t('Rūgštis + šarmas: susidaro karboksilato druska ir vanduo.', 'Acid + alkali: a carboxylate salt and water form.'),
            src: 'S6.15'
          },
          {
            rule: t('Karboksirūgšties stiprumą nusako jos konjuguotosios bazės stabilumas: kuo labiau karboksilato krūvis išsklaidytas ar sumažintas, tuo stipresnė rūgštis. Pakaitai, traukiantys elektronus (−I), rūgštį stiprina; elektronus stumiantys (+I) – silpnina.',
              'The strength of a carboxylic acid is set by the stability of its conjugate base: the more the charge of the carboxylate is spread out or reduced, the stronger the acid. Electron-withdrawing substituents (−I) strengthen the acid; electron-donating ones (+I) weaken it.'),
            src: 'Klein'
          },
          { h: t('Pakaitų įtaka', 'Effect of substituents') },
          {
            table: {
              head: [t('Rūgštis', 'Acid'), t('pKa', 'pKa'), t('Priežastis', 'Reason')],
              rows: [
                [{ smi: 'OC=O' }, t('3,75', '3.75'), t('nėra +I alkilo', 'no +I alkyl group')],
                [{ smi: 'CC(=O)O' }, t('4,76', '4.76'), t('metilas +I', 'methyl is +I')],
                [{ smi: 'ClCC(=O)O' }, t('2,86', '2.86'), t('Cl −I', 'Cl is −I')],
                [{ smi: 'ClC(Cl)C(=O)O' }, t('1,29', '1.29'), t('du Cl', 'two Cl atoms')],
                [{ smi: 'ClC(Cl)(Cl)C(=O)O' }, t('0,65', '0.65'), t('trys Cl', 'three Cl atoms')],
                [{ smi: 'OC(=O)c1ccccc1' }, t('4,20', '4.20'), t('sp² C labiau elektroneigiama už sp³', 'an sp² carbon is more electron-withdrawing than sp³')]
              ]
            },
            src: 'Klein'
          },
          {
            p: t('−I efektas silpnėja tolstant nuo karboksigrupės: 2-chlorbutano rūgštis (pKa 2,86) stipresnė už 3- (4,05) ir 4-chlorbutano (4,52); 4-chlorbutano rūgštis jau artima butano rūgščiai (4,82). α-Hidroksirūgštys – stipriausios iš hidroksirūgščių.',
              'The −I effect fades with distance from the carboxyl group: 2-chlorobutanoic acid (pKa 2.86) is stronger than the 3- (4.05) and 4-chloro (4.52) acids; the 4-chloro acid is already close to butanoic acid (4.82). α-Hydroxy acids are the strongest of the hydroxy acids.'),
            src: 'Klein; T p93'
          },
          {
            p: t('Žiede nitrogrupė ($−I$, $−M$) rūgštį stiprina, o metilas ($+I$) silpnina: 4-nitrobenzenkarboksirūgštis stipresnė, o 4-metilbenzenkarboksirūgštis silpnesnė už benzenkarboksirūgštį.',
              'On the ring a nitro group ($−I$, $−M$) strengthens the acid and methyl ($+I$) weakens it: 4-nitrobenzoic acid is stronger and 4-methylbenzoic acid weaker than benzoic acid.'),
            src: 'Klein'
          },
          {
            pitfall: t('Rūgštį vertinkite pagal anijoną ir skaičiuokite atstumą: vienas Cl prie α-anglies stiprina rūgštį labiau nei Cl už trijų anglies atomų.',
              'Judge the acid by its anion and count the distance: one Cl on the α-carbon strengthens an acid more than a Cl three carbons away.'),
            src: 'Klein'
          },
          {
            example: {
              q: [
                { p: t('Išdėstykite rūgštis nuo stipriausios iki silpniausios: propano, 2-chlorpropano ir 3-chlorpropano rūgštis.', 'Order the acids from strongest to weakest: propanoic, 2-chloropropanoic and 3-chloropropanoic acid.') },
                { mol: [{ smi: 'CCC(=O)O' }, { smi: 'CC(Cl)C(=O)O' }, { smi: 'ClCCC(=O)O' }] }
              ],
              steps: [
                [{ p: t('Cl traukia elektronus (−I) ir stabilizuoja anijoną; propano rūgštyje tokio pakaito nėra.', 'Cl withdraws electrons (−I) and stabilises the anion; propanoic acid has no such substituent.') }],
                [{ p: t('Abu chlorintieji dariniai stipresni; kuris labiau, lemia atstumas: Cl prie α-anglies arčiausiai karboksigrupės.', 'Both chloro acids are stronger; distance decides which more: Cl on the α-carbon is closest to the carboxyl group.') }],
                [{ p: t('Eilė: 2-chlorpropano > 3-chlorpropano > propano rūgštis.', 'Order: 2-chloropropanoic > 3-chloropropanoic > propanoic acid.') }]
              ]
            },
            claims: [
              { name: ['CCC(=O)O', t('propano rūgštis', 'propanoic acid')] },
              { name: ['CC(Cl)C(=O)O', t('2-chlorpropano rūgštis', '2-chloropropanoic acid')] },
              { name: ['ClCCC(=O)O', t('3-chlorpropano rūgštis', '3-chloropropanoic acid')] }
            ]
          },
          { practice: 'u14.acidity' },
          { practice: 'u14.salt' }
        ]
      },
      /* ------------------------------------------------------------ 2 */
      {
        id: 'derivs',
        title: t('Karboksirūgščių dariniai ir jų reaktingumas', 'Carboxylic acid derivatives and their reactivity'),
        blocks: [
          { h: t('Šeši dariniai', 'Six derivatives') },
          {
            p: t('Darinių formulė R–CO–X: karboksigrupės OH pakeistas grupe X. Visų jų hidrolizės produktas yra karboksirūgštis, todėl prie darinių priskiriami ir nitrilai R–C≡N.',
              'Derivatives have the formula R–CO–X: the OH of the carboxyl group is replaced by a group X. Hydrolysis of all of them gives the carboxylic acid, so nitriles R–C≡N count as derivatives too.'),
            src: 'T p87'
          },
          {
            table: {
              head: [t('Darinys', 'Derivative'), t('Pavyzdys', 'Example'), t('X', 'X')],
              rows: [
                [t('druska', 'salt'), { smi: 'CC(=O)[O-].[Na+]', name: t('natrio etanoatas', 'sodium ethanoate') }, f('O−  M+')],
                [t('esteris', 'ester'), { smi: 'CC(=O)OCC', name: t('etiletanoatas', 'ethyl ethanoate') }, f('OR')],
                [t('amidas', 'amide'), { smi: 'CC(=O)N', name: t('etanamidas', 'ethanamide') }, f('NH2')],
                [t('rūgšties chloridas', 'acyl chloride'), { smi: 'CC(=O)Cl', name: t('etanoilchloridas', 'ethanoyl chloride') }, f('Cl')],
                [t('anhidridas', 'anhydride'), { smi: 'CC(=O)OC(C)=O', name: t('etano rūgšties anhidridas', 'ethanoic anhydride') }, f('O–CO–R')],
                [t('nitrilas', 'nitrile'), { smi: 'CC#N', name: t('etannitrilas', 'ethanenitrile') }, f('C≡N')]
              ]
            },
            src: 'T p87'
          },
          { h: t('Reaktingumo eilė', 'The reactivity order') },
          {
            p: t('Karbonilo anglis yra elektrofilas. Jos δ+ didėja, kai pakaitas X stipriau traukia elektronus (−I), ir mažėja, kai stipriau juos duoda π sistemai (+M). Chloro −I stipriausias, +M silpnas; karboksilato krūvis δ+ beveik panaikina.',
              'The carbonyl carbon is an electrophile. Its δ+ grows as X withdraws electrons more strongly (−I) and falls as X donates them more strongly into the π system (+M). Chlorine has the strongest −I and a weak +M; the charge of a carboxylate nearly cancels δ+.'),
            src: 'T p88'
          },
          {
            mol: [
              { smi: 'CC(=O)[O-]', caption: t('karboksilatas', 'carboxylate') },
              { smi: 'CC(=O)N', caption: t('amidas', 'amide') },
              { smi: 'CC(=O)OC', caption: t('esteris', 'ester') },
              { smi: 'CC(=O)OC(C)=O', caption: t('anhidridas', 'anhydride') },
              { smi: 'CC(=O)Cl', caption: t('chloridas', 'chloride') }
            ],
            caption: t('Reaktingumas auga iš kairės į dešinę: karboksilatas < amidas < esteris < anhidridas < chloridas.', 'Reactivity rises from left to right: carboxylate < amide < ester < anhydride < chloride.'),
            src: 'T p88'
          },
          {
            rule: t('Reaktingesnis darinys virsta mažiau reaktingu, atvirkščiai tiesiogiai – ne. Chloridas ir anhidridas yra „aktyvintos“ rūgštys.',
              'A more reactive derivative turns into a less reactive one, not the other way round in one step. Acyl chlorides and anhydrides are "activated" acids.'),
            src: 'T p88, p89'
          },
          {
            pitfall: t('Iš esterio ar amido rūgšties chlorido vienu žingsniu negausite: hidrolizuokite iki rūgšties, o ją paverskite chloridu su $SOCl2$ (ar $PCl5$).',
              'An ester or amide does not give an acyl chloride in one step: hydrolyse to the acid, then convert it with $SOCl2$ (or $PCl5$).'),
            src: 'T p89'
          },
          {
            p: t('Rūgščioje terpėje karbonilo deguonis protonuojamas, ir net silpnas nukleofilas (alkoholis) gali pulti anglį: tai rūgštinė katalizė.',
              'In acid the carbonyl oxygen is protonated and even a weak nucleophile (an alcohol) can attack the carbon: acid catalysis.'),
            src: 'T p88'
          },
          {
            example: {
              q: [
                { p: t('Ar etanamidą galima vienu virsmu paversti etanoilchloridu? Kaip tai padaryti?', 'Can ethanamide be turned into ethanoyl chloride in one conversion? How can it be done?') },
                { scheme: { items: [{ smi: 'CC(=O)N', name: t('etanamidas', 'ethanamide') }, { arrow: '→' }, { smi: 'CC(=O)Cl', name: t('etanoilchloridas', 'ethanoyl chloride') }] } }
              ],
              steps: [
                [{ p: t('Amidas yra mažiau reaktingas už chloridą, o iš mažiau reaktingo darinio į reaktingesnį tiesiogiai nepereinama.', 'The amide is less reactive than the chloride, and a less reactive derivative does not convert directly into a more reactive one.') }],
                [{ p: t('Amidas hidrolizuojamas iki rūgšties ($H2O$, $H+$, $t°$).', 'The amide is hydrolysed to the acid ($H2O$, $H+$, $t°$).') }, { mol: { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') } }],
                [{ p: t('Rūgštis su $SOCl2$ virsta chloridu.', 'The acid becomes the chloride with $SOCl2$.') }, { mol: { smi: 'CC(=O)Cl', name: t('etanoilchloridas', 'ethanoyl chloride') } }]
              ]
            },
            claims: [
              { react: ['acid.socl2', ['CC(=O)O'], null, 'CC(=O)Cl'] },
              { name: ['CC(=O)N', t('etanamidas', 'ethanamide')] },
              { name: ['CC(=O)O', t('etano rūgštis', 'ethanoic acid')] },
              { name: ['CC(=O)Cl', t('etanoilchloridas', 'ethanoyl chloride')] }
            ]
          },
          { practice: 'u14.reactivity' }
        ]
      },
      /* ------------------------------------------------------------ 3 */
      {
        id: 'acylsub',
        title: t('Nukleofilinis acilpakeitimas', 'Nucleophilic acyl substitution'),
        blocks: [
          { h: t('Prijungimas ir eliminavimas', 'Addition and elimination') },
          {
            p: t('Nukleofilas Nu puola karbonilo anglį (prijungimas), susidaro nestabilus tetraedrinis tarpinis junginys su neigiamu deguonimi, o po to išeina nueinančioji grupė X (eliminavimas). Iš viso X pakeičiamas į Nu.',
              'A nucleophile Nu attacks the carbonyl carbon (addition), an unstable tetrahedral intermediate with a negative oxygen forms, and then the leaving group X departs (elimination). Overall X is replaced by Nu.'),
            src: 'T p88; S6.7'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(=O)Cl' }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
                note: t('I st.: azoto pora puola karbonilo anglį, $π$ elektronai pereina deguoniui.', 'Stage I: the nitrogen lone pair attacks the carbonyl carbon and the $π$ electrons move to oxygen.')
              },
              {
                scheme: { items: [{ smi: 'CC([O-])([NH3+])Cl', opts: { lonePairs: [2] } }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, mid: [1, 2] } }, { from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }],
                note: t('II st.: deguonies pora atkuria $C=O$, o $C-Cl$ elektronai pereina chloridui.', 'Stage II: an oxygen lone pair restores $C=O$ and the $C-Cl$ electrons go to chloride.')
              }
            ],
            caption: t('Etanoilchloridas ir amoniakas. Galutinė stadija: antras $NH3$ atplėšia protoną nuo $N$.', 'Ethanoyl chloride and ammonia. Last stage: a second $NH3$ removes a proton from $N$.'),
            src: 'T p88'
          },
          {
            rule: t('Išeina geriausia nueinančioji grupė, t. y. silpniausia bazė: $Cl-$ > $RCOO-$ > $RO-$ > $NH2-$.',
              'The best leaving group goes, i.e. the weakest base: $Cl-$ > $RCOO-$ > $RO-$ > $NH2-$.'),
            src: 'T p88'
          },
          { h: t('Chloridai ir anhidridai', 'Acyl chlorides and anhydrides') },
          {
            scheme: { items: [{ smi: 'CC(=O)O' }, { arrow: '→', above: f('SOCl2') }, { smi: 'CC(=O)Cl' }, { plus: true }, { smi: 'OCC' }, { arrow: '→' }, { smi: 'CC(=O)OCC' }, { plus: true }, { smi: 'Cl' }] },
            caption: t('Rūgštis → chloridas ($SO2$ ir HCl išsiskiria) → esteris.', 'Acid → chloride ($SO2$ and HCl are released) → ester.'),
            src: 'T p89; S6.22'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)Cl' }, { plus: true }, { smi: 'N' }, { arrow: '→', above: t('2 ekv.', '2 equiv.') }, { smi: 'CC(=O)N' }, { plus: true }, { smi: '[NH4+].[Cl-]' }] },
            caption: t('Antras $NH3$ ekvivalentas suriša HCl.', 'The second equivalent of $NH3$ takes up HCl.'),
            src: 'S6.7'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OC(C)=O' }, { plus: true }, { smi: 'O' }, { arrow: '→' }, { smi: 'CC(=O)O' }, { plus: true }, { smi: 'CC(=O)O' }] },
            caption: t('Anhidridas + vanduo: dvi rūgšties molekulės.', 'Anhydride + water: two acid molecules.'),
            src: 'S6.7'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OC(C)=O' }, { plus: true }, { smi: 'N' }, { arrow: '→' }, { smi: 'CC(=O)N' }, { plus: true }, { smi: 'CC(=O)O' }] },
            caption: t('Anhidridas + amoniakas: amidas ir rūgštis.', 'Anhydride + ammonia: an amide and an acid.'),
            src: 'T p89'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)O' }, { plus: true }, { smi: 'CC(=O)O' }, { arrow: '→', above: f('P2O5, t°') }, { smi: 'CC(=O)OC(C)=O' }, { plus: true }, { smi: 'O' }] },
            caption: t('Anhidridas gaunamas atskeliant vandenį.', 'The anhydride forms by removing water.'),
            src: 'T p89; S6.17'
          },
          {
            p: t('Chloridas su karboksilato druska duoda anhidridą, ir pagal tą pačią taisyklę (reaktingesnis → mažiau reaktingas) susidaro visi kiti virsmai; rūgštis su amoniaku sudaro tik druską, o ją kaitinant gaunamas amidas.',
              'A chloride with a carboxylate gives the anhydride, and every other conversion follows the same rule (more reactive → less reactive); an acid with ammonia only forms a salt, which on heating gives the amide.'),
            src: 'T p89'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)Cl' }, { plus: true }, { smi: 'CC(=O)[O-].[Na+]' }, { arrow: '→' }, { smi: 'CC(=O)OC(C)=O' }, { plus: true }, { smi: '[Na+].[Cl-]' }] },
            caption: t('Chloridas + karboksilatas: anhidridas.', 'Chloride + carboxylate: the anhydride.'),
            src: 'T p89; S6.16'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OC(C)=O' }, { plus: true }, { smi: 'CCO' }, { arrow: '→' }, { smi: 'CC(=O)OCC' }, { plus: true }, { smi: 'CC(=O)O' }] },
            caption: t('Anhidridas + alkoholis: esteris ir rūgštis.', 'Anhydride + alcohol: an ester and an acid.'),
            src: 'T p89'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OC' }, { plus: true }, { smi: 'N' }, { arrow: '→' }, { smi: 'CC(=O)N' }, { plus: true }, { smi: 'CO' }] },
            caption: t('Esteris + amoniakas: amidas ir alkoholis.', 'Ester + ammonia: an amide and an alcohol.'),
            src: 'T p89'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)O' }, { plus: true }, { smi: 'N' }, { arrow: '→', above: t('kambario temperatūra', 'room temperature') }, { smi: 'CC(=O)[O-].[NH4+]' }, { arrow: '→', above: f('t°') }, { smi: 'CC(=O)N' }, { plus: true }, { smi: 'O' }] },
            caption: t('Rūgštis + amoniakas: pirmiausia druska, kaitinant – amidas.', 'Acid + ammonia: first the salt, on heating the amide.'),
            src: 'T p89'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)[O-].[Na+]' }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'CC(=O)O' }, { plus: true }, { smi: '[Na+].[Cl-]' }] },
            caption: t('Druska + HCl: laisva rūgštis (reikalinga po muilinimo).', 'Salt + HCl: the free acid (needed in the work-up after saponification).'),
            src: 'T p89'
          },
          {
            example: {
              q: [
                { p: t('Propanoilchloridas reaguoja su dimetilaminu (2 ekv.). Kokie produktai ir kodėl 2 ekvivalentai?', 'Propanoyl chloride reacts with dimethylamine (2 equiv.). Which products form, and why two equivalents?') },
                { scheme: { items: [{ smi: 'CCC(=O)Cl', name: t('propanoilchloridas', 'propanoyl chloride') }, { plus: true }, { smi: 'CNC', name: t('N-metilmetanaminas', 'N-methylmethanamine') }, { arrow: '→' }] } }
              ],
              steps: [
                [{ p: t('Aminas – nukleofilas, chloridas – reaktingiausias darinys: išeina $Cl-$.', 'The amine is the nucleophile, the chloride the most reactive derivative: $Cl-$ leaves.') }],
                [{ p: t('Azotas netenka vieno H: tretinis amidas.', 'Nitrogen loses one H: a tertiary amide.') }, { mol: { smi: 'CCC(=O)N(C)C', name: t('N,N-dimetilpropanamidas', 'N,N-dimethylpropanamide') } }],
                [{ p: t('HCl protonuoja antrą aminą, todėl jo reikia dviejų ekvivalentų.', 'HCl protonates a second amine, hence two equivalents.') }, { mol: { smi: 'C[NH2+]C.[Cl-]' } }]
              ]
            },
            claims: [
              { react: ['acyl.nu', ['CCC(=O)Cl', 'CNC'], { nu: 'amine' }, 'CCC(N(C)C)=O'] },
              { name: ['CCC(=O)Cl', t('propanoilchloridas', 'propanoyl chloride')] },
              { name: ['CNC', t('N-metilmetanaminas', 'N-methylmethanamine')] },
              { name: ['CCC(=O)N(C)C', t('N,N-dimetilpropanamidas', 'N,N-dimethylpropanamide')] },
              { formula: ['C[NH2+]C.[Cl-]', 'C2H8ClN'] }
            ]
          },
          { practice: 'u14.nu' }
        ]
      },
      /* ------------------------------------------------------------ 4 */
      {
        id: 'ester',
        title: t('Esterinimas ir esterių hidrolizė', 'Esterification and hydrolysis of esters'),
        blocks: [
          { h: t('Esterinimas: rūgštis + alkoholis', 'Esterification: acid + alcohol') },
          {
            p: t('Rūgštis ir alkoholis, esant H+, sudaro esterį ir vandenį. Reakcija grįžtamoji: alkoholio perteklius ar vandens šalinimas pastumia pusiausvyrą į esterį. Kai žymėtas alkoholio deguonis ($R–^{18}OH$), $18O$ lieka esteryje, todėl nutrūksta rūgšties C–OH, o ne alkoholio C–O ryšys.',
              'An acid and an alcohol with H+ give an ester and water. The reaction is reversible: an excess of alcohol or removal of water pushes the equilibrium to the ester. When the alcohol oxygen is labelled ($R–^{18}OH$), the $18O$ stays in the ester, so the acid C–OH bond breaks, not the C–O bond of the alcohol.'),
            src: 'T p89'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)O' }, { plus: true }, { smi: 'OC' }, { arrow: '⇌', above: f('H+') }, { smi: 'CC(=O)OC' }, { plus: true }, { smi: 'O' }] },
            src: 'T p89'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'CC(=O)O', opts: { lonePairs: [2] } }, { plus: true }, { smi: '[H+]' }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 0 } }],
                note: t('1. Karbonilo deguonis protonuojamas: anglis tampa elektrofiliškesnė.', '1. The carbonyl oxygen is protonated: the carbon becomes more electrophilic.')
              },
              {
                scheme: { items: [{ smi: 'CC(O)=[OH+]' }, { plus: true }, { smi: 'OC', opts: { lonePairs: [0] } }] },
                arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 3] }, to: { m: 0, a: 3 } }],
                note: t('2. Alkoholio deguonis puola karbonilo anglį.', '2. The alcohol oxygen attacks the carbonyl carbon.')
              },
              {
                scheme: { items: [{ smi: 'CC(O)(OC)[OH2+]', opts: { lonePairs: [2] } }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, mid: [1, 2] } }, { from: { m: 0, b: [1, 5] }, to: { m: 0, a: 5 } }],
                note: t('3. Po protono persikėlimo išeina $H2O$ ir atkuriamas $C=O$; paskutinė stadija – deprotonavimas.', '3. After a proton shift $H2O$ leaves and $C=O$ is restored; the last stage is deprotonation.')
              }
            ],
            caption: t('Etano rūgštis ir metanolis.', 'Ethanoic acid and methanol.'),
            src: 'T p90'
          },
          { h: t('Hidrolizė', 'Hydrolysis') },
          {
            p: t('Rūgštinė hidrolizė yra esterinimo priešingybė (grįžtamoji). Šarminėje terpėje hidroksidas puola esterį ir susidaro karboksilatas bei alkoholis. Reakcija negrįžtama: karboksilato alkoholis nebepuola.',
              'Acid hydrolysis is the reverse of esterification (reversible). In alkali, hydroxide attacks the ester and a carboxylate and an alcohol form. The reaction is irreversible: the alcohol does not attack a carboxylate.'),
            src: 'T p95; S6.7'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(=O)OC' }] },
                arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
                note: t('I st.: $OH-$ puola karbonilo anglį.', 'Stage I: $OH-$ attacks the carbonyl carbon.')
              },
              {
                scheme: { items: [{ smi: 'CC([O-])(O)OC', opts: { lonePairs: [2] } }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, mid: [1, 2] } }, { from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }],
                note: t('II st.: išeina metoksidas.', 'Stage II: methoxide leaves.')
              },
              {
                scheme: { items: [{ smi: 'CC(=O)O', opts: { allH: true } }, { plus: true }, { smi: 'C[O-]', opts: { lonePairs: [1] } }] },
                arrows: [{ from: { m: 1, lp: 1 }, to: { m: 0, a: 'H3' } }, { from: { m: 0, b: [3, 'H3'] }, to: { m: 0, a: 3 } }],
                note: t('III st.: rūgštis atiduoda protoną alkoksidui; ši negrįžtama stadija pastumia reakciją į produktą.', 'Stage III: the acid gives its proton to the alkoxide; this irreversible stage drives the reaction to the products.')
              }
            ],
            caption: t('Metiletanoato šarminė hidrolizė (muilinimas).', 'Alkaline hydrolysis (saponification) of methyl ethanoate.'),
            src: 'T p95; S6.7'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OC' }, { plus: true }, { smi: '[OH-].[Na+]' }, { arrow: '→', above: f('H2O') }, { smi: 'CC(=O)[O-].[Na+]' }, { plus: true }, { smi: 'CO' }] },
            caption: t('Šarmas sunaudojamas: tai reagentas, o ne katalizatorius.', 'The alkali is consumed: it is a reagent, not a catalyst.'),
            src: 'S6.7'
          },
          {
            p: t('Šarmu skaidomi ir riebalai (glicerolio esteriai): iš jų gaunamas glicerolis ir natrio druskos, vadinamos muilais. Amidai hidrolizuojasi sunkiai (kaitinant su $H2O/H+$), nitrilas – per amidą iki rūgšties; amidą su $P2O5$ galima dehidratuoti iki nitrilo.',
              'Fats (esters of glycerol) are saponified the same way: glycerol and the salts of fatty acids, soaps, form. Amides hydrolyse with difficulty (heating with $H2O/H+$), a nitrile goes through the amide to the acid; an amide can be dehydrated to the nitrile with $P2O5$.'),
            src: 'T p89, p95'
          },
          {
            scheme: { items: [{ smi: 'CCCC(=O)OCC(OC(=O)CCC)COC(=O)CCC' }, { arrow: '→', above: f('NaOH, H2O') }, { smi: 'OCC(O)CO', caption: t('glicerolis', 'glycerol') }, { plus: true }, { smi: 'CCCC(=O)[O-].[Na+]' }] },
            caption: t('Trigliceridas (modelis) → glicerolis + 3 ×  druska.', 'A triglyceride (model) → glycerol + 3 × salt.'),
            src: 'T p95'
          },
          {
            scheme: { items: [{ smi: 'CCC#N' }, { arrow: '→', above: f('H2O, H+') }, { smi: 'CCC(N)=O' }, { arrow: '→', above: f('H2O, H+, t°') }, { smi: 'CCC(=O)O' }, { plus: true }, { smi: '[NH4+]' }] },
            src: 'T p89'
          },
          {
            pitfall: t('Hidrolizėje skyla acilo C–O ryšys, o ne O–alkilas. Šarminėje terpėje gaunama druska, o ne laisva rūgštis.',
              'In hydrolysis the acyl C–O bond breaks, not the O–alkyl bond. In alkali the product is the salt, not the free acid.'),
            src: 'T p89, p95'
          },
          {
            example: {
              q: [
                { p: t('Etilpropanoatas kaitinamas su vandeniniu NaOH. Kokie produktai?', 'Ethyl propanoate is heated with aqueous NaOH. Which products form?') },
                { mol: { smi: 'CCC(=O)OCC', name: t('etilpropanoatas', 'ethyl propanoate') } }
              ],
              steps: [
                [{ p: t('$OH-$ puola karbonilo anglį; iš tetraedrinio junginio išeina etoksidas, tampantis etanoliu.', '$OH-$ attacks the carbonyl carbon; ethoxide leaves the tetrahedral intermediate and ends up as ethanol.') }, { mol: { smi: 'CCO', name: t('etanolis', 'ethanol') } }],
                [{ p: t('Rūgštis iš karto atiduoda protoną bazei: gaunama druska.', 'The acid at once gives its proton to the base: a salt results.') }, { mol: { smi: 'CCC(=O)[O-].[Na+]', name: t('natrio propanoatas', 'sodium propanoate') } }]
              ]
            },
            claims: [
              { react: ['ester.hydrolysis', ['CCC(=O)OCC'], { medium: 'base' }, 'CCC(=O)[O-].[Na+]'] },
              { react: ['ester.hydrolysis', ['CCC(=O)OCC'], { medium: 'base' }, 'CCO'] },
              { name: ['CCC(=O)OCC', t('etilpropanoatas', 'ethyl propanoate')] },
              { name: ['CCO', t('etanolis', 'ethanol')] },
              { name: ['CCC(=O)[O-].[Na+]', t('natrio propanoatas', 'sodium propanoate')] }
            ]
          },
          { practice: 'u14.mech' }
        ]
      },
      /* ------------------------------------------------------------ 5 */
      {
        id: 'claisen',
        title: t('Klaizeno kondensacija', 'The Claisen condensation'),
        blocks: [
          { h: t('Esteris kaip nukleofilas ir elektrofilas', 'The ester as nucleophile and electrophile') },
          {
            p: t('Esterio α-vandenilis judrus: stipri bazė jį atplėšia, o anijonas puola kito esterio karbonilo anglį. Tai Klaizeno kondensacija, jos produktas – β-ketoesteris (oksoesteris).',
              'The α-hydrogen of an ester is mobile: a strong base removes it and the anion attacks the carbonyl carbon of a second ester. This is the Claisen condensation, giving a β-keto ester (oxo ester).'),
            src: 'T p91; S6.8'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'C[O-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(=O)OC', opts: { allH: true } }] },
                arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
                note: t('1. Metoksidas atplėšia α-vandenilį: enolatas.', '1. Methoxide removes an α-hydrogen: the enolate.')
              },
              {
                scheme: { items: [{ smi: '[CH2-]C(=O)OC' }, { plus: true }, { smi: 'CC(=O)OC' }] },
                arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
                note: t('2. Anijonas puola kito esterio karbonilo anglį.', '2. The anion attacks the carbonyl carbon of a second ester.')
              },
              {
                scheme: { items: [{ smi: 'CC([O-])(OC)CC(=O)OC', opts: { lonePairs: [2] } }] },
                arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, mid: [1, 2] } }, { from: { m: 0, b: [1, 3] }, to: { m: 0, a: 3 } }],
                note: t('3. Išeina metoksidas: metil-3-oksobutanoatas.', '3. Methoxide leaves: methyl 3-oxobutanoate.')
              }
            ],
            caption: t('Dviejų metiletanoato molekulių kondensacija.', 'Condensation of two molecules of methyl ethanoate.'),
            src: 'T p91'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OCC' }, { plus: true }, { smi: 'CC(=O)OCC' }, { arrow: '→', above: f('1. NaOC2H5'), below: f('2. H3O+') }, { smi: 'CCOC(=O)CC(C)=O', name: t('etil-3-oksobutanoatas', 'ethyl 3-oxobutanoate') }, { plus: true }, { smi: 'CCO' }] },
            src: 'T p91'
          },
          {
            rule: t('Esteris turi turėti bent du α-vandenilius. Bazė – to paties alkoholio alkoksidas ($NaOC2H5$ etilo esteriui): $NaOH$ muilintų, kitas alkoksidas pakeistų alkoksigrupę.',
              'The ester needs at least two α-hydrogens. The base is the alkoxide of the same alcohol ($NaOC2H5$ for an ethyl ester): $NaOH$ would saponify, a different alkoxide would exchange the alkoxy group.'),
            src: 'Klein; T p91'
          },
          {
            p: t('Du α-H reikia todėl, kad β-ketoesteris dar turi rūgštų H tarp dviejų karbonilų (pKa apie 11): alkoksidas jį atplėšia, ir ši beveik negrįžtama stadija pastumia pusiausvyrą į produktą.',
              'Two α-H are needed because the β-keto ester still has an acidic H between its carbonyls (pKa about 11): the alkoxide removes it and this nearly irreversible stage pulls the equilibrium to the product.'),
            src: 'Klein'
          },
          { h: t('Mišri kondensacija', 'The mixed condensation') },
          {
            p: t('Kai vienas esteris neturi α-H (etilbenzenkarboksilatas), enolizuojasi tik kitas ir puola abu esterius: gaunamas mišinys.',
              'When one ester has no α-H (ethyl benzoate), only the other enolises and attacks both esters: a mixture results.'),
            src: 'S6.19'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OCC' }, { plus: true }, { smi: 'CCOC(=O)c1ccccc1' }, { arrow: '→', above: f('1. NaOC2H5'), below: f('2. H3O+') }, { smi: 'CCOC(=O)CC(=O)c1ccccc1' }, { plus: true }, { smi: 'CCOC(=O)CC(C)=O' }] },
            src: 'S6.19'
          },
          {
            pitfall: t('Klaizeno produktas – β-ketoesteris, o ne aldolis: tetraedrinis junginys praranda alkoksidą, ir atsiranda $C=O$, o ne OH.',
              'The Claisen product is a β-keto ester, not an aldol: the tetrahedral intermediate loses an alkoxide and a $C=O$ appears, not an OH.'),
            src: 'T p91'
          },
          {
            example: {
              q: [
                { p: t('Kas susidaro etilpropanoatą apdorojus $NaOC2H5$, o po to rūgštimi?', 'What forms when ethyl propanoate is treated with $NaOC2H5$ and then acid?') },
                { mol: { smi: 'CCC(=O)OCC', name: t('etilpropanoatas', 'ethyl propanoate') } }
              ],
              steps: [
                [{ p: t('Esteris turi du α-H, todėl kondensacija galima.', 'The ester has two α-H, so condensation is possible.') }],
                [{ p: t('Naujas C–C ryšys jungia vienos molekulės α-anglį su kitos karbonilo anglimi; išeina etoksidas.', 'The new C–C bond joins the α-carbon of one molecule to the carbonyl carbon of the other; ethoxide leaves.') }, { mol: { smi: 'CCC(=O)C(C)C(=O)OCC', name: t('etil-2-metil-3-oksopentanoatas', 'ethyl 2-methyl-3-oxopentanoate') } }]
              ]
            },
            claims: [
              { react: ['claisen', ['CCC(=O)OCC'], null, 'CCC(=O)C(C)C(=O)OCC'] },
              { name: ['CCC(=O)OCC', t('etilpropanoatas', 'ethyl propanoate')] },
              { name: ['CCC(=O)C(C)C(=O)OCC', t('etil-2-metil-3-oksopentanoatas', 'ethyl 2-methyl-3-oxopentanoate')] }
            ]
          },
          { practice: 'u14.claisen' }
        ]
      },
      /* ------------------------------------------------------------ 6 */
      {
        id: 'other',
        title: t('Kitos rūgščių reakcijos', 'Other reactions of acids'),
        blocks: [
          { h: t('Redukcija ir dekarboksilinimas', 'Reduction and decarboxylation') },
          {
            p: t('$LiAlH4$ redukuoja rūgštį iki pirminio alkoholio, o esterį – iki dviejų alkoholių. Kaitinamos rūgštys dekarboksilinasi: $RCOOH → RH + CO2$. Paprastos rūgštys dekarboksilinasi sunkiai: dažniausiai kaitinamos jų druskos su $NaOH$.',
              '$LiAlH4$ reduces an acid to a primary alcohol and an ester to two alcohols. Heated acids decarboxylate: $RCOOH → RH + CO2$. Simple acids decarboxylate with difficulty: usually their salts are heated with $NaOH$.'),
            src: 'T p90; S6.21'
          },
          {
            scheme: { items: [{ smi: 'CC(C)(C)C(=O)O' }, { arrow: '→', above: f('1. LiAlH4'), below: f('2. H3O+') }, { smi: 'CC(C)(C)CO' }] },
            src: 'T p90'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)OCCC' }, { arrow: '→', above: f('1. LiAlH4'), below: f('2. H3O+') }, { smi: 'CCO' }, { plus: true }, { smi: 'CCCO' }] },
            src: 'T p90'
          },
          { h: t('α-Halogeninimas ir nesočiosios rūgštys', 'α-Halogenation and unsaturated acids') },
          {
            p: t('Su $Br2$ ar $Cl2$ ir fosforu (Helio–Volhardo–Zelinskio reakcija) rūgštys halogeninamos tik α-padėtyje; α-halogenrūgštys duoda α-hidroksi- ir α-aminorūgštis. Su $Br2$ pertekliumi halogeninimas gali pasikartoti: α-anglis gali gauti du ar tris halogenus; $α$-bromrūgštis su $K2CO3/H2O$ (100 °C) virsta $α$-hidroksirūgštimi. Propeno (akrilo) rūgšties $C=C$ konjuguotas su karbonilu, todėl HX prisijungia prieš Markovnikovo taisyklę.',
              'With $Br2$ or $Cl2$ and phosphorus (Hell–Volhard–Zelinsky) acids are halogenated only at the α-position; α-halo acids give α-hydroxy and α-amino acids. With excess $Br2$ the halogenation can repeat: the α-carbon can take two or three halogens; an $α$-bromo acid gives the $α$-hydroxy acid with $K2CO3/H2O$ (100 °C). In propenoic (acrylic) acid the $C=C$ is conjugated with the carbonyl, so HX adds against Markovnikov\'s rule.'),
            src: 'T p90, p91, p92'
          },
          {
            scheme: { items: [{ smi: 'CCCC(=O)O' }, { arrow: '→', above: f('Br2, P') }, { smi: 'CCC(Br)C(=O)O', name: t('2-brombutano rūgštis', '2-bromobutanoic acid') }, { arrow: '→', above: t('$NH3$ (2 ekv.)', '$NH3$ (2 equiv.)') }, { smi: 'CCC(N)C(=O)O' }] },
            src: 'T p91'
          },
          {
            scheme: { items: [{ smi: 'C=CC(=O)O' }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'ClCCC(=O)O', name: t('3-chlorpropano rūgštis', '3-chloropropanoic acid') }] },
            caption: t('H eina prie α-anglies, X – prie β.', 'H goes to the α-carbon, X to the β-carbon.'),
            src: 'T p92'
          },
          {
            example: {
              q: [
                { p: t('Kaip iš butano rūgšties gauti 2-hidroksibutano rūgštį?', 'How is 2-hydroxybutanoic acid made from butanoic acid?') },
                { mol: { smi: 'CCCC(=O)O', name: t('butano rūgštis', 'butanoic acid') } }
              ],
              steps: [
                [{ p: t('OH reikia α-padėtyje, o α-anglį galima halogeninti: $Br2$, $P$ (HVZ).', 'The OH is needed at the α-position, and the α-carbon can be halogenated: $Br2$, $P$ (HVZ).') }, { mol: { smi: 'CCC(Br)C(=O)O', name: t('2-brombutano rūgštis', '2-bromobutanoic acid') } }],
                [{ p: t('Bromas pakeičiamas hidroksigrupe: $K2CO3$, $H2O$, 100 °C, po to $H3O+$.', 'The bromine is replaced by a hydroxy group: $K2CO3$, $H2O$, 100 °C, then $H3O+$.') }, { mol: { smi: 'CCC(O)C(=O)O', name: t('2-hidroksibutano rūgštis', '2-hydroxybutanoic acid') } }]
              ]
            },
            claims: [
              { name: ['CCCC(=O)O', t('butano rūgštis', 'butanoic acid')] },
              { name: ['CCC(Br)C(=O)O', t('2-brombutano rūgštis', '2-bromobutanoic acid')] },
              { name: ['CCC(O)C(=O)O', t('2-hidroksibutano rūgštis', '2-hydroxybutanoic acid')] },
              { formula: ['CCC(O)C(=O)O', 'C4H8O3'] }
            ]
          },
          { practice: 'u14.reagents' }
        ]
      },
      /* ------------------------------------------------------------ 7 */
      {
        id: 'hydroxy',
        title: t('Hidroksi- ir oksorūgštys, riebalai', 'Hydroxy and oxo acids, fats'),
        blocks: [
          { h: t('Ką daro šildymas', 'What heating does') },
          {
            p: t('Hidroksirūgštys turi –COOH ir –OH; pagal OH padėtį jos yra α- (2-), β- (3-), γ- (4-) ar δ- (5-). Šildomos elgiasi skirtingai, ir tai lemia grupių atstumas.',
              'Hydroxy acids contain –COOH and –OH; by the position of OH they are α- (2-), β- (3-), γ- (4-) or δ- (5-). Heating gives different results, decided by the distance between the groups.'),
            src: 'T p92, p93'
          },
          {
            table: {
              head: [t('Rūgštis', 'Acid'), t('Šildant', 'On heating'), t('Produktas', 'Product')],
              rows: [
                [{ smi: 'CC(O)C(=O)O', name: t('2-hidroksipropano rūgštis', '2-hydroxypropanoic acid') }, t('dvi molekulės (−2 H₂O)', 'two molecules (−2 H₂O)'), { smi: 'CC1OC(=O)C(C)OC1=O', caption: t('laktidas', 'lactide') }],
                [{ smi: 'OCCC(=O)O', name: t('3-hidroksipropano rūgštis', '3-hydroxypropanoic acid') }, t('dehidratacija (−H₂O)', 'dehydration (−H₂O)'), { smi: 'C=CC(=O)O' }],
                [{ smi: 'OCCCC(=O)O', name: t('4-hidroksibutano rūgštis', '4-hydroxybutanoic acid') }, t('vidinis esterinimas (−H₂O)', 'internal esterification (−H₂O)'), { smi: 'O=C1CCCO1', caption: t('laktonas', 'lactone') }]
              ]
            },
            src: 'T p93, p94'
          },
          {
            rule: t('Laktonas – ciklinis esteris, gaunamas vidumolekuliniu esterinimu. Stabilūs tik 5 ir 6 narių žiedai, todėl laktonai lengvai susidaro iš γ- ir δ-hidroksirūgščių.',
              'A lactone is a cyclic ester made by intramolecular esterification. Only 5- and 6-membered rings are stable, so lactones form readily from γ- and δ-hydroxy acids.'),
            src: 'T p93, p94; S6.18'
          },
          {
            scheme: { items: [{ smi: 'OCCCCC(=O)O', name: t('5-hidroksipentano rūgštis', '5-hydroxypentanoic acid') }, { arrow: '→', above: f('H+'), below: f('−H2O') }, { smi: 'O=C1CCCCO1', caption: t('δ-valerolaktonas', 'δ-valerolactone') }] },
            src: 'S6.18'
          },
          {
            pitfall: t('Žiedo narius skaičiuokite su esterio deguonimi: 4-hidroksibutano rūgštis duoda 5 narių žiedą (4 C + O).',
              'Count the ring members including the ester oxygen: 4-hydroxybutanoic acid gives a 5-membered ring (4 C + O).'),
            src: 'T p94'
          },
          {
            p: t('Jei $OH$ ir $COOH$ atskirtos daugiau nei trimis anglies atomais, kiekviena grupė elgiasi savarankiškai: $OH$ kaip alkoholio (oksiduojasi, esterinasi, keičiama halogenu), $COOH$ kaip rūgšties.',
              'If $OH$ and $COOH$ are separated by more than three carbons, each group behaves independently: the $OH$ like an alcohol (oxidised, esterified, replaced by halogen), the $COOH$ like an acid.'),
            src: 'T p93'
          },
          {
            example: {
              q: [
                { p: t('5-hidroksipentano rūgštis šildoma su $H+$. Kas susidaro?', '5-hydroxypentanoic acid is heated with $H+$. What forms?') },
                { mol: { smi: 'OCCCCC(=O)O', name: t('5-hidroksipentano rūgštis', '5-hydroxypentanoic acid') } }
              ],
              steps: [
                [{ p: t('Hidroksigrupės deguonis puola savo paties molekulės karboksigrupės anglį: vidumolekulinis esterinimas.', 'The oxygen of the hydroxy group attacks the carbon of the carboxyl group of the same molecule: intramolecular esterification.') }],
                [{ p: t('Žiede būtų penkios anglys ir esterio deguonis: 6 nariai, o tai stabilu.', 'The ring would contain five carbons and the ester oxygen: 6 members, which is stable.') }],
                [{ p: t('Atsiskiria $H2O$, susidaro laktonas.', '$H2O$ is lost and a lactone forms.') }, { mol: { smi: 'O=C1CCCCO1', caption: t('δ-valerolaktonas', 'δ-valerolactone') } }]
              ]
            },
            claims: [
              { react: ['lactone', ['OCCCCC(=O)O'], null, 'O=C1CCCCO1'] },
              { name: ['OCCCCC(=O)O', t('5-hidroksipentano rūgštis', '5-hydroxypentanoic acid')] },
              { formula: ['O=C1CCCCO1', 'C5H8O2'] }
            ]
          },
          { h: t('Oksorūgštys ir biologiškai svarbios rūgštys', 'Oxo acids and biologically important acids') },
          {
            mol: [
              { smi: 'CC(O)C(=O)O', name: t('2-hidroksipropano rūgštis', '2-hydroxypropanoic acid'), caption: t('pieno', 'lactic') },
              { smi: 'OC(=O)CC(O)C(=O)O', name: t('2-hidroksibutano dirūgštis', '2-hydroxybutanedioic acid'), caption: t('obuolių', 'malic') },
              { smi: 'OC(=O)C(O)C(O)C(=O)O', name: t('2,3-dihidroksibutano dirūgštis', '2,3-dihydroxybutanedioic acid'), caption: t('vyno', 'tartaric') },
              { smi: 'OC(=O)CC(O)(CC(=O)O)C(=O)O', caption: t('citrinų', 'citric') }
            ],
            caption: t('Gamtinės hidroksirūgštys; citrinų rūgštis – Krebso ciklo narė.', 'Natural hydroxy acids; citric acid belongs to the Krebs cycle.'),
            src: 'T p92, p94; Klein'
          },
          {
            p: t('Piruvo (2-oksopropano) rūgštis stipresnė už acto, turi ketoninę–enolinę tautomeriją; jos enolio esteris su fosforo rūgštimi (fosfoenolpiruvatas) perduoda fosfatą. β-Oksorūgštys, pvz., acetoacto, lengvai dekarboksilinasi pro 6 narių ciklinę pereinamąją būseną.',
              'Pyruvic (2-oxopropanoic) acid is stronger than acetic acid and shows keto–enol tautomerism; its enol ester with phosphoric acid (phosphoenolpyruvate) transfers phosphate. β-Oxo acids such as acetoacetic acid decarboxylate readily through a six-membered cyclic transition state.'),
            src: 'T p94; Klein'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)C(=O)O', name: t('2-oksopropano rūgštis', '2-oxopropanoic acid') }, { arrow: '⇌' }, { smi: 'C=C(O)C(=O)O' }] },
            caption: t('Piruvo rūgšties ketoninė ir enolinė formos.', 'The keto and enol forms of pyruvic acid.'),
            src: 'T p94'
          },
          {
            p: t('Vienu metu per šešių narių žiedą: karboksilo O–H vandenilis pereina ketono deguoniui, nutrūksta $C-C$ ryšys, išsiskiria $CO2$ ir lieka enolis.',
              'All at once through a six-membered ring: the carboxyl O–H hydrogen moves to the ketone oxygen, the $C-C$ bond breaks, $CO2$ is released and an enol remains.'),
            src: 'Klein'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)CC(=O)O' }, { arrow: '→', above: f('t°') }, { smi: 'C=C(C)O' }, { plus: true }, { smi: 'O=C=O' }, { arrow: '⇌' }, { smi: 'CC(C)=O' }] },
            caption: t('Acetoacto rūgštis → enolis + $CO2$; enolis tautomerizuojasi į propanoną.', 'Acetoacetic acid → enol + $CO2$; the enol tautomerises to propanone.'),
            src: 'Klein'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)CC(=O)O', name: t('3-oksobutano rūgštis', '3-oxobutanoic acid') }, { arrow: '→', above: f('t°') }, { smi: 'CC(C)=O' }, { plus: true }, { smi: 'O=C=O' }] },
            src: 'Klein'
          },
          { h: t('Riebalai ir aliejai', 'Fats and oils') },
          {
            p: t('Riebalai ir aliejai – glicerolio esteriai su riebalų rūgštimis (nešakotomis, lyginio C skaičiaus). Sočiosios rūgštys duoda kietus riebalus, nesočiosios su $cis$ ryšiais – skystus aliejus, nes lenkta grandinė neleidžia tankiai susipakuoti. Hidrinant ($H2$, Ni) aliejai tampa riebalais: taip gaminamas margarinas.',
              'Fats and oils are esters of glycerol with fatty acids (unbranched, even number of carbons). Saturated acids give solid fats, unsaturated ones with $cis$ bonds give liquid oils because the bent chain cannot pack tightly. Hydrogenation ($H2$, Ni) turns oils into fats: this is how margarine is made.'),
            src: 'T p95, p96'
          },
          {
            mol: [{ smi: 'CCCCCCCCCCCCCCCCCC(=O)O', caption: t('stearino', 'stearic') }, { smi: 'CCCCCCCC/C=C\\CCCCCCCC(=O)O', caption: t('oleino (cis)', 'oleic (cis)') }],
            src: 'T p95'
          },
          { practice: 'u14.hydroxy' }
        ]
      },
      /* ------------------------------------------------------------ 8 */
      {
        id: 'drugs',
        title: t('Vaistai: aspirinas, paracetamolis, DEET', 'Drugs: aspirin, paracetamol, DEET'),
        blocks: [
          { h: t('Trys pavyzdžiai su vienu principu', 'Three examples, one principle') },
          {
            p: t('Visi trys gaunami nukleofiliniu acilpakeitimu. Reikia nustatyti, kas yra nukleofilas ir kas acilo donoras: azotas nukleofiliškesnis už deguonį, o chloridas ir anhidridas reaktingesni už rūgštį.',
              'All three are made by nucleophilic acyl substitution. One must decide which group is the nucleophile and which the acyl donor: nitrogen is more nucleophilic than oxygen, and chlorides and anhydrides are more reactive than the acid.'),
            src: 'S6.20, S6.22, S6.23'
          },
          {
            scheme: { items: [{ smi: 'Oc1ccccc1C(=O)O', name: t('2-hidroksibenzenkarboksirūgštis', '2-hydroxybenzoic acid'), caption: t('salicilo rūgštis', 'salicylic acid') }, { plus: true }, { smi: 'CC(=O)OC(C)=O' }, { arrow: '→', above: f('H+') }, { smi: 'CC(=O)Oc1ccccc1C(=O)O', caption: t('aspirinas', 'aspirin') }, { plus: true }, { smi: 'CC(=O)O' }] },
            caption: t('Anhidridas acilina fenolio OH.', 'The anhydride acylates the phenolic OH.'),
            src: 'S6.20'
          },
          {
            scheme: { items: [{ smi: 'Oc1ccccc1C(=O)O' }, { plus: true }, { smi: 'OCC' }, { arrow: '⇌', above: f('H+') }, { smi: 'CCOC(=O)c1ccccc1O', name: t('etil-2-hidroksibenzenkarboksilatas', 'ethyl 2-hydroxybenzoate') }, { plus: true }, { smi: 'O' }] },
            caption: t('Su etanoliu reaguoja karboksigrupė, ne fenolis.', 'With ethanol the carboxyl group reacts, not the phenol.'),
            src: 'S6.20'
          },
          {
            scheme: { items: [{ smi: 'Nc1ccc(O)cc1', name: t('4-aminofenolis', '4-aminophenol') }, { plus: true }, { smi: 'CC(=O)OC(C)=O' }, { arrow: '→' }, { smi: 'CC(=O)Nc1ccc(O)cc1', name: t('N-(4-hidroksifenil)etanamidas', 'N-(4-hydroxyphenyl)ethanamide'), caption: t('paracetamolis', 'paracetamol') }, { plus: true }, { smi: 'CC(=O)O' }] },
            caption: t('Acilinamas $NH2$, ne OH.', 'The $NH2$ is acylated, not the OH.'),
            src: 'S6.23'
          },
          {
            scheme: { items: [{ smi: 'Cc1cccc(c1)C(=O)O' }, { arrow: '→', above: f('SOCl2') }, { smi: 'Cc1cccc(c1)C(Cl)=O' }, { plus: true }, { smi: 'CCNCC', name: t('N-etiletanaminas', 'N-ethylethanamine') }, { arrow: '→', above: t('2 ekv.', '2 equiv.') }, { smi: 'CCN(CC)C(=O)c1cccc(C)c1', name: t('N,N-dietil-3-metilbenzenkarboksamidas', 'N,N-diethyl-3-methylbenzamide'), caption: t('DEET', 'DEET') }] },
            caption: t('DEET: rūgštis → chloridas → amidas.', 'DEET: acid → chloride → amide.'),
            src: 'S6.22'
          },
          {
            example: {
              q: [
                { p: t('Kaip iš 3-metilbenzenkarboksirūgšties ir dietilamino gauti DEET? Kodėl nepakanka jų sumaišyti?', 'How is DEET made from 3-methylbenzoic acid and diethylamine? Why is mixing them not enough?') },
                { mol: { smi: 'Cc1cccc(c1)C(=O)O', name: t('3-metilbenzenkarboksirūgštis', '3-methylbenzoic acid') } }
              ],
              steps: [
                [{ p: t('Rūgštis ir aminas sudaro tik druską: OH – bloga nueinančioji grupė.', 'The acid and the amine only form a salt: OH is a poor leaving group.') }],
                [{ p: t('$SOCl2$ pakeičia OH chloru.', '$SOCl2$ replaces OH with Cl.') }, { mol: { smi: 'Cc1cccc(c1)C(Cl)=O', name: t('3-metilbenzoilchloridas', '3-methylbenzoyl chloride') } }],
                [{ p: t('Chloridas reaguoja su 2 ekv. dietilamino: vienas acilinamas, antras suriša HCl.', 'The chloride reacts with 2 equiv. of diethylamine: one is acylated, the second takes up HCl.') }, { mol: { smi: 'CCN(CC)C(=O)c1cccc(C)c1', name: t('N,N-dietil-3-metilbenzenkarboksamidas', 'N,N-diethyl-3-methylbenzamide') } }]
              ]
            },
            claims: [
              { react: ['acid.socl2', ['Cc1cccc(c1)C(=O)O'], null, 'Cc1cccc(c1)C(Cl)=O'] },
              { react: ['acyl.nu', ['Cc1cccc(c1)C(Cl)=O', 'CCNCC'], { nu: 'amine' }, 'CCN(CC)C(=O)c1cccc(C)c1'] },
              { name: ['Cc1cccc(c1)C(=O)O', t('3-metilbenzenkarboksirūgštis', '3-methylbenzoic acid')] },
              { name: ['CCN(CC)C(=O)c1cccc(C)c1', t('N,N-dietil-3-metilbenzenkarboksamidas', 'N,N-diethyl-3-methylbenzamide')] },
              { formula: ['CCN(CC)C(=O)c1cccc(C)c1', 'C12H17NO'] }
            ]
          },
          { practice: 'u14.drugs' },
          { practice: 'u14.chain' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        table: {
          head: [t('Reakcija', 'Reaction'), t('Reagentai', 'Reagents'), t('Produktas', 'Product')],
          rows: [
            [t('rūgštis → druska', 'acid → salt'), f('NaOH, KOH'), t('karboksilatas + $H2O$', 'carboxylate + $H2O$')],
            [t('rūgštis → rūgšties chloridas', 'acid → acyl chloride'), f('SOCl2, PCl5'), t('$RCOCl$', '$RCOCl$')],
            [t('rūgštis → esteris', 'acid → ester'), f('R′OH, H+'), t('$RCOOR′$ + $H2O$ (grįžtamoji)', '$RCOOR′$ + $H2O$ (reversible)')],
            [t('chloridas → esteris / amidas', 'chloride → ester / amide'), f('R′OH ;  2 NH3, 2 RNH2'), t('esteris ar amidas + HCl (suriša antras ekv.)', 'ester or amide + HCl (taken up by the second equiv.)')],
            [t('anhidridas → esteris / amidas / rūgštis', 'anhydride → ester / amide / acid'), f('R′OH ;  NH3 ;  H2O'), t('darinys + rūgštis', 'derivative + acid')],
            [t('chloridas + karboksilatas', 'chloride + carboxylate'), t('nėra', 'none'), t('anhidridas + chloridas', 'anhydride + chloride')],
            [t('anhidridas / esteris → esteris / amidas', 'anhydride / ester → ester / amide'), f('R′OH ;  NH3'), t('esteris + rūgštis ;  amidas + alkoholis', 'ester + acid ;  amide + alcohol')],
            [t('rūgštis → amidas', 'acid → amide'), t('$NH3$, tada $t°$', '$NH3$, then $t°$'), t('amonio druska → amidas + $H2O$', 'ammonium salt → amide + $H2O$')],
            [t('druska → rūgštis', 'salt → acid'), f('HCl'), t('laisva rūgštis + druska', 'free acid + salt')],
            [t('esteris → rūgštis', 'ester → acid'), f('H2O, H+  ;  NaOH, H2O'), t('rūgštis + alkoholis ;  druska + alkoholis', 'acid + alcohol ;  salt + alcohol')],
            [t('amidas → rūgštis', 'amide → acid'), f('H2O, H+, t°'), t('rūgštis + $NH4+$', 'acid + $NH4+$')],
            [t('nitrilas ⇄ amidas', 'nitrile ⇄ amide'), f('H2O, H+  ;  P2O5, t°'), t('amidas ; nitrilas', 'amide ; nitrile')],
            [t('esteris + esteris', 'ester + ester'), t('NaOR, tada $H3O+$', 'NaOR, then $H3O+$'), t('β-ketoesteris + $ROH$ (Klaizenas)', 'β-keto ester + $ROH$ (Claisen)')],
            [t('rūgštis / esteris → alkoholis', 'acid / ester → alcohol'), f('1. LiAlH4  2. H3O+'), t('pirminis alkoholis ; du alkoholiai', 'primary alcohol ; two alcohols')],
            [t('γ-, δ-hidroksirūgštis', 'γ-, δ-hydroxy acid'), f('H+, t°'), t('laktonas (5–6 narių žiedas)', 'lactone (5- or 6-membered ring)')],
            [t('β-oksorūgštis', 'β-oxo acid'), f('t°'), t('ketonas + $CO2$', 'ketone + $CO2$')]
          ]
        }
      },
      {
        list: [
          t('Rūgštingumas: stabilesnis karboksilatas → stipresnė rūgštis; −I pakaitai ir artumas prie $COOH$ didina, +I mažina.', 'Acidity: a more stable carboxylate means a stronger acid; −I substituents and closeness to $COOH$ raise it, +I lowers it.'),
          t('Reaktingumas: chloridas > anhidridas > esteris > amidas > karboksilatas; atgal „į viršų“ – tik per rūgštį ir $SOCl2$.', 'Reactivity: chloride > anhydride > ester > amide > carboxylate; going back "up" only through the acid and $SOCl2$.'),
          t('Mechanizmas: prijungimas (tetraedrinis tarpinis junginys) ir eliminavimas; išeina silpniausia bazė.', 'Mechanism: addition (tetrahedral intermediate) then elimination; the weakest base leaves.'),
          t('Klaizenas: du α-H, to paties alkoholio alkoksidas, produktas – β-ketoesteris.', 'Claisen: two α-H, the alkoxide of the same alcohol, the product is a β-keto ester.'),
          t('Šildymas: α → laktidas, β → nesočioji rūgštis, γ/δ → laktonas; β-oksorūgštys praranda $CO2$.', 'Heating: α → lactide, β → unsaturated acid, γ/δ → lactone; β-oxo acids lose $CO2$.')
        ]
      }
    ],
    types: [
      /* ============================================================ acidity */
      {
        id: 'u14.acidity',
        title: t('Rūgštingumo palyginimas ir priežastis', 'Comparing acidity, with the reason'),
        mirrors: [],
        bank: [
          {
            id: 'u14.acidity.1',
            q: [{ p: t('Palyginkite trijų rūgščių stiprumą.', 'Compare the strength of three acids.') }, { mol: [{ smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }, { smi: 'ClCC(=O)O', name: t('chloretano rūgštis', '2-chloroethanoic acid') }, { smi: 'ClC(Cl)C(=O)O', name: t('dichloretano rūgštis', '2,2-dichloroethanoic acid') }] }],
            steps: [
              ord(t('Išdėstykite nuo stipriausios iki silpniausios.', 'Put them in order from strongest to weakest.'),
                [tx('dichloretano rūgštis', '2,2-dichloroethanoic acid'), tx('chloretano rūgštis', '2-chloroethanoic acid'), tx('etano rūgštis', 'ethanoic acid')],
                t('Palyginkite, kiek elektronų traukiančių atomų yra prie α-anglies.', 'Compare how many electron-withdrawing atoms sit on the α-carbon.'),
                t('Eilė: dichloretano (pKa 1,29) > chloretano (2,86) > etano rūgštis (4,76).', 'Order: 2,2-dichloroethanoic (pKa 1.29) > 2-chloroethanoic (2.86) > ethanoic acid (4.76).')),
              cho(t('Kodėl chloras didina rūgštingumą?', 'Why does chlorine increase the acidity?'), [
                tx('Cl traukia elektronus (−I) ir stabilizuoja karboksilato anijoną.', 'Cl withdraws electrons (−I) and stabilises the carboxylate anion.'),
                tx('Cl stumia elektronus (+I) ir susilpnina O–H ryšį.', 'Cl donates electrons (+I) and weakens the O–H bond.'),
                tx('Cl didelis, todėl O–H ryšys ilgesnis ir lengviau nutrūksta.', 'Cl is large, so the O–H bond is longer and breaks more easily.'),
                tx('Cl pakeičia karboksigrupę stipresne rūgštine grupe.', 'Cl replaces the carboxyl group with a stronger acidic group.')
              ], 0,
              t('Rūgštį nusako jos anijonas: kas jį stabilizuoja?', 'The acid is judged by its anion: what stabilises it?'),
              t('Elektronegatyvus chloras traukia elektronus per $σ$ ryšius (−I), todėl neigiamas krūvis karboksilate mažiau sutelktas ir anijonas stabilesnis. Kuo daugiau Cl, tuo stipresnis poveikis.', 'Electronegative chlorine pulls electrons through the $σ$ bonds (−I), so the negative charge of the carboxylate is less concentrated and the anion is more stable. The more Cl, the stronger the effect.'))
            ],
            why: t('Rūgšties stiprumas priklauso nuo konjuguotosios bazės stabilumo. Kiekvienas −I pakaitas prie α-anglies išsklaido anijono krūvį ir stiprina rūgštį.', 'The strength of an acid depends on the stability of its conjugate base. Each −I substituent on the α-carbon spreads the anion\'s charge and strengthens the acid.'),
            src: 'Klein', claims: [{ formula: ['ClC(Cl)C(=O)O', 'C2H2Cl2O2'] }]
          },
          {
            id: 'u14.acidity.2',
            q: [{ p: t('Palyginkite tris rūgštis, kurios skiriasi grupe prie karboksigrupės.', 'Compare three acids that differ in the group on the carboxyl carbon.') }, { mol: [{ smi: 'OC=O', name: t('metano rūgštis', 'methanoic acid') }, { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }, { smi: 'CC(C)(C)C(=O)O', name: t('2,2-dimetilpropano rūgštis', '2,2-dimethylpropanoic acid') }] }],
            steps: [
              ord(t('Išdėstykite nuo stipriausios iki silpniausios.', 'Put them in order from strongest to weakest.'),
                [tx('metano rūgštis', 'methanoic acid'), tx('etano rūgštis', 'ethanoic acid'), tx('2,2-dimetilpropano rūgštis', '2,2-dimethylpropanoic acid')],
                t('Alkilgrupės stumia elektronus. Kuri rūgštis jų neturi, o kuri turi daugiausia?', 'Alkyl groups donate electrons. Which acid has none and which has the most?'),
                t('Metano (pKa 3,75) > etano (4,76) > 2,2-dimetilpropano rūgštis (5,0).', 'Methanoic (pKa 3.75) > ethanoic (4.76) > 2,2-dimethylpropanoic acid (5.0).')),
              cho(t('Kuris paaiškinimas teisingas?', 'Which explanation is correct?'), [
                tx('Alkilgrupės stumia elektronus (+I) ir mažiau stabilizuoja anijoną, todėl rūgštis silpnesnė.', 'Alkyl groups donate electrons (+I) and stabilise the anion less, so the acid is weaker.'),
                tx('Alkilgrupės traukia elektronus ir stabilizuoja anijoną.', 'Alkyl groups withdraw electrons and stabilise the anion.'),
                tx('Daugiau C atomų reiškia daugiau H, kurie gali atsiskirti kaip protonai.', 'More carbons mean more hydrogens that can leave as protons.'),
                tx('Šakotas alkilas silpnina C=O ryšį, todėl jis tampa mažiau polinis.', 'A branched alkyl group weakens the C=O bond so it becomes less polar.')
              ], 0,
              t('Alkilas lyginamas su vandeniliu: kuris duoda elektronus lengviau?', 'Compare an alkyl group with hydrogen: which donates electrons more readily?'),
              t('Neigiamas karboksilato krūvis tuo mažiau stabilus, kuo daugiau elektronų jam perduoda pakaitai. Alkilas yra +I donoras, vandenilis – ne.', 'The negative charge of the carboxylate is the less stable the more electrons the substituents give it. An alkyl group is a +I donor, hydrogen is not.'))
            ],
            why: t('+I pakaitai didina elektronų tankį karboksilate ir silpnina rūgštį; todėl skruzdžių rūgštis stipresnė už acto, o ši – už pivalo rūgštį.', '+I substituents raise the electron density in the carboxylate and weaken the acid; so formic acid is stronger than acetic and acetic stronger than pivalic acid.'),
            src: 'Klein', claims: [{ name: ['OC=O', t('metano rūgštis', 'methanoic acid')] }]
          },
          {
            id: 'u14.acidity.3',
            q: [{ p: t('Chloras yra skirtingose butano rūgšties padėtyse.', 'Chlorine sits in different positions of butanoic acid.') }, { mol: [{ smi: 'CCC(Cl)C(=O)O', name: t('2-chlorbutano rūgštis', '2-chlorobutanoic acid') }, { smi: 'CC(Cl)CC(=O)O', name: t('3-chlorbutano rūgštis', '3-chlorobutanoic acid') }, { smi: 'ClCCCC(=O)O', name: t('4-chlorbutano rūgštis', '4-chlorobutanoic acid') }] }],
            steps: [
              ord(t('Išdėstykite nuo stipriausios iki silpniausios.', 'Put them in order from strongest to weakest.'),
                [tx('2-chlorbutano rūgštis', '2-chlorobutanoic acid'), tx('3-chlorbutano rūgštis', '3-chlorobutanoic acid'), tx('4-chlorbutano rūgštis', '4-chlorobutanoic acid')],
                t('Visos turi tą patį pakaitą, tad skiriasi tik vienas dalykas.', 'All three have the same substituent, so only one thing differs.'),
                t('2- (pKa 2,86) > 3- (4,05) > 4-chlorbutano rūgštis (4,52).', '2- (pKa 2.86) > 3- (4.05) > 4-chlorobutanoic acid (4.52).')),
              cho(t('Kodėl rūgštingumo skirtumas mažėja tolstant chlorui?', 'Why does the effect fade as chlorine moves away?'), [
                tx('−I efektas silpnėja per kiekvieną $σ$ ryšį.', 'The −I effect weakens with each $σ$ bond it must pass.'),
                tx('Toliau esantis Cl virsta +M donoru.', 'A more distant Cl turns into a +M donor.'),
                tx('Toliau esantis chloras užima daugiau vietos ir užstoja karboksigrupę.', 'A distant chlorine takes more space and shields the carboxyl group.'),
                tx('Toliau esantis Cl keičia rūgšties formulę.', 'A distant Cl changes the formula of the acid.')
              ], 0,
              t('Per ką Cl veikia karboksigrupę?', 'Through what does Cl act on the carboxyl group?'),
              t('Pakaito poveikis eina per $σ$ ryšius ir su kiekvienu jų blėsta, todėl svarbiausias α-pakaitas.', 'The inductive effect is passed along a chain of $σ$ bonds and weakens with every bond; the α-substituent matters most.'))
            ],
            why: t('Indukcijos efektas silpnėja didėjant atstumui, todėl rūgštį stipriausiai keičia pakaitas α-padėtyje.', 'The inductive effect fades with distance, so a substituent in the α-position changes the acidity most.'),
            src: 'Klein', claims: [{ name: ['CCC(Cl)C(=O)O', t('2-chlorbutano rūgštis', '2-chlorobutanoic acid')] }]
          },
          {
            id: 'u14.acidity.4',
            q: [{ p: t('Trys benzenkarboksirūgštys su skirtingais pakaitais 4-oje padėtyje.', 'Three benzoic acids with different substituents in the 4-position.') }, { mol: [{ smi: 'OC(=O)c1ccc(cc1)[N+](=O)[O-]', name: t('4-nitrobenzenkarboksirūgštis', '4-nitrobenzoic acid') }, { smi: 'OC(=O)c1ccccc1', name: t('benzenkarboksirūgštis', 'benzoic acid') }, { smi: 'Cc1ccc(cc1)C(=O)O', name: t('4-metilbenzenkarboksirūgštis', '4-methylbenzoic acid') }] }],
            steps: [
              ord(t('Išdėstykite nuo stipriausios iki silpniausios.', 'Put them in order from strongest to weakest.'),
                [tx('4-nitrobenzenkarboksirūgštis', '4-nitrobenzoic acid'), tx('benzenkarboksirūgštis', 'benzoic acid'), tx('4-metilbenzenkarboksirūgštis', '4-methylbenzoic acid')],
                t('Vienas pakaitas traukia elektronus, kitas juos stumia, o trečias nieko neturi.', 'One substituent withdraws electrons, one donates them, and one is just hydrogen.'),
                t('4-nitro (pKa 3,44) > benzenkarboksirūgštis (4,20) > 4-metil (4,38).', '4-nitro (pKa 3.44) > benzoic acid (4.20) > 4-methyl (4.38).')),
              cho(t('Kuris pakaitas stabilizuoja anijoną?', 'Which substituent stabilises the anion?'), [
                tx('$NO2$ traukia elektronus ir iš žiedo, ir per jį, todėl anijono krūvis stabilesnis.', '$NO2$ withdraws electrons from and through the ring, so the anion\'s charge is more stable.'),
                tx('$CH3$ traukia elektronus ir stabilizuoja anijoną.', '$CH3$ withdraws electrons and stabilises the anion.'),
                tx('$NO2$ stumia elektronus į žiedą.', '$NO2$ pushes electrons into the ring.'),
                tx('Abu pakaitai veikia vienodai, nes yra tolimoje padėtyje.', 'Both substituents act alike because they are far away.')
              ], 0,
              t('Kuris pakaitas yra deaktyvuojantis, kuris – aktyvuojantis aromatiniam žiedui?', 'Which substituent is deactivating and which activating for the ring?'),
              t('Nitrogrupė yra stiprus elektronų akceptorius (−I, −M) ir stabilizuoja neigiamą krūvį, metilas – donoras (+I).', 'The nitro group is a strong electron acceptor (−I, −M) and stabilises negative charge; methyl is a donor (+I).'))
            ],
            why: t('Elektronų akceptoriai žiede stiprina benzenkarboksirūgštį, donorai silpnina; stabilizuojamas tas pats anijonas.', 'Electron acceptors on the ring strengthen benzoic acid and donors weaken it; in each case it is the same anion that is stabilised or destabilised.'),
            src: 'Klein', claims: [{ name: ['OC(=O)c1ccc(cc1)[N+](=O)[O-]', t('4-nitrobenzenkarboksirūgštis', '4-nitrobenzoic acid')] }]
          },
          {
            id: 'u14.acidity.5',
            q: [{ p: t('Kuri iš šių rūgščių yra stipriausia?', 'Which of these acids is the strongest?') }],
            steps: [
              cho(t('Pasirinkite stipriausią rūgštį.', 'Choose the strongest acid.'), [mo('OC(=O)C(F)(F)F'), mo('CC(=O)O'), mo('CCC(=O)O'), mo('CC(C)(C)C(=O)O')], 0,
                t('Kurie pakaitai prie α-anglies traukia elektronus ir kuris – stipriausiai?', 'Which substituents on the α-carbon withdraw electrons, and which does so most strongly?'),
                t('Trifluoretano rūgštis (pKa apie 0,5): trys F stipriai traukia elektronus ir stabilizuoja anijoną. Alkilai (CH₃, C₂H₅, t-Bu) elektronus stumia.', 'Trifluoroethanoic acid (pKa about 0.5): three F atoms withdraw electrons strongly and stabilise the anion. Alkyl groups (CH₃, C₂H₅, t-Bu) donate electrons.')),
              cho(t('Kodėl fluoras čia veikia stipriai?', 'Why is fluorine so effective here?'), [
                tx('Fluoras yra elektroneigiamiausias elementas, jo −I efektas stipriausias.', 'Fluorine is the most electronegative element and has the strongest −I effect.'),
                tx('Fluoras yra geras +M donoras.', 'Fluorine is a good +M donor.'),
                tx('Fluoras yra didesnis už chlorą.', 'Fluorine is larger than chlorine.'),
                tx('Fluoras protonuoja karbonilo deguonį.', 'Fluorine protonates the carbonyl oxygen.')
              ], 0, t('Kuris halogenas labiausiai traukia elektronus?', 'Which halogen attracts electrons most?'), t('Rūgšties stiprumas priklauso nuo −I efekto, o jį lemia elektroneigiamumas.', 'Acid strength follows the −I effect, and that follows electronegativity.'))
            ],
            why: t('Kuo stipriau pakaitai traukia elektronus per $σ$ ryšius, tuo stabilesnis karboksilatas ir stipresnė rūgštis.', 'The more strongly substituents withdraw electrons through the $σ$ bonds, the more stable the carboxylate and the stronger the acid.'),
            src: 'Klein', claims: [{ name: ['OC(=O)C(F)(F)F', t('trifluoretano rūgštis', '2,2,2-trifluoroethanoic acid')] }]
          },
          {
            id: 'u14.acidity.6',
            q: [{ p: t('Etano rūgšties rūgštingumo konstanta $Ka$ maždaug 11 eilių didesnė už etanolio.', 'Ethanoic acid is about eleven orders of magnitude more acidic than ethanol.') }, { mol: [{ smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }] }],
            steps: [
              cho(t('Kuri priežastis svarbiausia?', 'Which reason matters most?'), [
                tx('Karboksilato krūvis pasiskirsto tarp dviejų deguonų (rezonansas), o etoksido krūvis lieka vienam deguoniui.', 'The carboxylate charge is shared by two oxygens (resonance), while the ethoxide charge stays on one oxygen.'),
                tx('Etanolio O–H ryšys yra stipresnis dėl daugiau C–H ryšių.', 'The O–H bond of ethanol is stronger because of more C–H bonds.'),
                tx('Rūgšties deguonis yra elektroneigiamesnis už alkoholio.', 'The oxygen of the acid is more electronegative than that of the alcohol.'),
                tx('Etano rūgštis turi mažesnę molekulinę masę.', 'Ethanoic acid has a lower molar mass.')
              ], 0,
              t('Nupieškite abu anijonus ir suskaičiuokite rezonansines formules.', 'Draw both anions and count the resonance structures.'),
              t('Karboksilato anijonas turi dvi vienodas rezonansines formules, todėl krūvis išsklaidytas ir anijonas stabilus. Alkoksido neigiamas krūvis negali delokalizuotis.', 'The carboxylate anion has two equivalent resonance structures, so the charge is delocalised and the anion is stable. The negative charge of an alkoxide cannot delocalise.'))
            ],
            why: t('Rūgštingumą lemia konjuguotosios bazės stabilumas; rezonansas karboksilate, o ne atskiras O–H ryšio stiprumas, paaiškina skirtumą.', 'Acidity is set by the stability of the conjugate base; resonance in the carboxylate, not the strength of the O–H bond alone, explains the difference.'),
            src: 'T p87'
          },
          {
            id: 'u14.acidity.7',
            q: [{ p: t('Trys junginiai bandomi vandeniniu natrio hidrokarbonatu $NaHCO3$ (anglies rūgšties pKa apie 6,4).', 'Three compounds are tested with aqueous sodium hydrogencarbonate $NaHCO3$ (carbonic acid pKa about 6.4).') }],
            steps: [
              mul(t('Kuris (-ie) tirpsta ir išskiria $CO2$?', 'Which dissolve(s) with release of $CO2$?'), [mo('OC(=O)c1ccccc1'), mo('Oc1ccccc1'), mo('CCO')], [0],
                t('Rūgštis išstumia anglies rūgštį tik tada, kai pati stipresnė už ją. Palyginkite pKa.', 'An acid releases carbonic acid only if it is itself stronger. Compare pKa values.'),
                t('Benzenkarboksirūgštis (pKa 4,2) stipresnė už anglies rūgštį (6,4), todėl išstumia $CO2$. Fenolis (apie 10) ir etanolis (apie 16) – silpnesni, todėl nereaguoja.', 'Benzoic acid (pKa 4.2) is stronger than carbonic acid (6.4), so it releases $CO2$. Phenol (about 10) and ethanol (about 16) are weaker and do not react.'))
            ],
            why: t('Karboksirūgštis yra pakankamai stipri, kad ištirptų vandeniniame hidrokarbonate ir išskirtų $CO2$; fenoliai ir alkoholiai – ne. Tai paprastas karboksirūgščių atpažinimo bandymas.', 'A carboxylic acid is strong enough to dissolve in aqueous hydrogencarbonate with release of $CO2$; phenols and alcohols are not. It is a simple test for carboxylic acids.'),
            src: 'Klein'
          },
          {
            id: 'u14.acidity.8',
            q: [{ p: t('Trys rūgštys su OH grupe skirtingu atstumu nuo $COOH$.', 'Three acids with an OH group at different distances from $COOH$.') }, { mol: [{ smi: 'OCC(=O)O', name: t('hidroksietano rūgštis', '2-hydroxyethanoic acid') }, { smi: 'OCCC(=O)O', name: t('3-hidroksipropano rūgštis', '3-hydroxypropanoic acid') }, { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }] }],
            steps: [
              ord(t('Išdėstykite nuo stipriausios iki silpniausios.', 'Put them in order from strongest to weakest.'),
                [tx('hidroksietano rūgštis', '2-hydroxyethanoic acid'), tx('3-hidroksipropano rūgštis', '3-hydroxypropanoic acid'), tx('etano rūgštis', 'ethanoic acid')],
                t('Hidroksigrupė traukia elektronus. Svarbu, kiek ji nutolusi.', 'The hydroxy group withdraws electrons. What matters is how far away it is.'),
                t('Hidroksietano rūgštis (pKa 3,8) > 3-hidroksipropano (apie 4,5) > etano rūgštis (4,76).', '2-Hydroxyethanoic acid (pKa 3.8) > 3-hydroxypropanoic (about 4.5) > ethanoic acid (4.76).'))
            ],
            why: t('α-Hidroksigrupė arti karboksigrupės stipriai traukia elektronus (−I), todėl α-hidroksirūgštys yra stipriausios iš hidroksirūgščių; β-padėtyje poveikis jau mažas.', 'An α-hydroxy group close to the carboxyl group withdraws electrons strongly (−I), so α-hydroxy acids are the strongest of the hydroxy acids; in the β-position the effect is already small.'),
            src: 'T p93; Klein'
          }
        ]
      },
      /* ============================================================ salt */
      {
        id: 'u14.salt',
        title: t('Rūgštis ir šarmas: kas susidaro', 'Acid and alkali: what forms'),
        mirrors: ['S6.15'],
        gen: genSalt
      },
      /* ============================================================ reactivity */
      {
        id: 'u14.reactivity',
        title: t('Darinių reaktingumas ir virsmai', 'Reactivity and interconversion of derivatives'),
        mirrors: [],
        bank: [
          {
            id: 'u14.reactivity.1',
            q: [{ p: t('Penki etano rūgšties dariniai.', 'Five derivatives of ethanoic acid.') }, { mol: [{ smi: 'CC(=O)Cl', name: t('etanoilchloridas', 'ethanoyl chloride') }, { smi: 'CC(=O)OC(C)=O', name: t('etano rūgšties anhidridas', 'ethanoic anhydride') }, { smi: 'CC(=O)OC', name: t('metiletanoatas', 'methyl ethanoate') }, { smi: 'CC(=O)N', name: t('etanamidas', 'ethanamide') }, { smi: 'CC(=O)[O-].[Na+]', name: t('natrio etanoatas', 'sodium ethanoate') }] }],
            steps: [
              ord(t('Išdėstykite nuo reaktingiausio iki mažiausiai reaktingo nukleofilų atžvilgiu.', 'Put them in order from the most to the least reactive towards nucleophiles.'),
                [tx('etanoilchloridas', 'ethanoyl chloride'), tx('anhidridas', 'anhydride'), tx('esteris', 'ester'), tx('amidas', 'amide'), tx('karboksilatas', 'carboxylate')],
                t('Kuo geresnė nueinančioji grupė ir kuo stipresnis −I, tuo reaktingesnis darinys.', 'The better the leaving group and the stronger the −I effect, the more reactive the derivative.'),
                t('Chloridas > anhidridas > esteris > amidas > karboksilatas (kurso eilė).', 'Chloride > anhydride > ester > amide > carboxylate (the usual order).')),
              cho(t('Kodėl amidas mažiau reaktingas nei esteris?', 'Why is the amide less reactive than the ester?'), [
                tx('Azotas stipriau duoda elektronų porą karbonilui (+M), todėl C atomo $δ+$ mažesnis, o $NH2-$ yra labai bloga nueinančioji grupė.', 'Nitrogen donates its lone pair to the carbonyl more strongly (+M), so the carbon\'s $δ+$ is smaller, and $NH2-$ is a very poor leaving group.'),
                tx('Azotas elektroneigiamesnis už deguonį ir stipriau traukia elektronus (−I).', 'Nitrogen is more electronegative than oxygen and withdraws electrons more strongly (−I).'),
                tx('Amidas neturi karbonilo grupės.', 'An amide has no carbonyl group.'),
                tx('Amidai visada būna kietos medžiagos.', 'Amides are always solids.')
              ], 0,
              t('Palyginkite N ir O: kuris stipriau dalijasi laisva elektronų pora?', 'Compare N and O: which shares its lone pair more strongly?'),
              t('Mažiau elektroneigiamas N lengviau duoda elektronų porą (+M) ir tuo sumažina karbonilo anglies elektrofiliškumą.', 'The less electronegative N donates its lone pair more readily (+M) and so lowers the electrophilicity of the carbonyl carbon.'))
            ],
            why: t('Reaktingumą lemia pakaito X −I ir +M efektai bei nueinančiosios grupės kokybė: chloras stipriausiai traukia, bet blogiausiai duoda elektronus; amido azotas – atvirkščiai.', 'Reactivity follows the −I and +M effects of the substituent X and the quality of the leaving group: chlorine withdraws most and donates worst, the amide nitrogen the other way round.'),
            src: 'T p88'
          },
          {
            id: 'u14.reactivity.2',
            q: [{ p: t('Trys junginiai vienodomis sąlygomis liečiasi su šaltu vandeniu.', 'Three compounds are brought into contact with cold water under the same conditions.') }],
            steps: [
              cho(t('Kuris iš jų beveik nereaguoja?', 'Which of them hardly reacts?'), [mo('CC(=O)N'), mo('CC(=O)Cl'), mo('CC(=O)OC(C)=O')], 0,
                t('Raskite darinį su blogiausia nueinančiąja grupe.', 'Find the derivative with the worst leaving group.'),
                t('Chloridas ir anhidridas hidrolizuojasi greitai (išeina $Cl-$ ar $RCOO-$). Amidas išlieka: $NH2-$ labai bloga nueinančioji grupė, o N dar stipriai dalijasi elektronų pora.', 'The chloride and the anhydride hydrolyse fast ($Cl-$ or $RCOO-$ leaves). The amide survives: $NH2-$ is a very poor leaving group and N shares its lone pair strongly.'))
            ],
            why: t('Amidų hidrolizei reikia rūgšties ar šarmo ir kaitinimo, o chloridai ir anhidridai reaguoja su vandeniu jau kambario temperatūroje.', 'Hydrolysis of amides needs acid or alkali and heat, while chlorides and anhydrides react with water already at room temperature.'),
            src: 'T p88, p89'
          },
          {
            id: 'u14.reactivity.3',
            q: [{ p: t('Kiekviena rodyklė rodo vieną nukleofilinio acilpakeitimo virsmą, reagentas nenurodytas.', 'Each arrow shows a single nucleophilic acyl substitution conversion; the reagent is not stated.') }],
            steps: [
              mul(t('Pažymėkite virsmus, kuriuos tiesiogiai galima atlikti nukleofilu (reaktingesnis → mažiau reaktingas).', 'Pick the conversions that can be done directly with a nucleophile (more reactive → less reactive).'), [
                sc({ smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC(=O)OC' }),
                sc({ smi: 'CC(=O)OC' }, { arrow: '→' }, { smi: 'CC(=O)Cl' }),
                sc({ smi: 'CC(=O)N' }, { arrow: '→' }, { smi: 'CC(=O)OC(C)=O' }),
                sc({ smi: 'CC(=O)OC(C)=O' }, { arrow: '→' }, { smi: 'CC(=O)N' }),
                sc({ smi: 'CC(=O)OC' }, { arrow: '→' }, { smi: 'CC(=O)N' })
              ], [0, 3, 4],
              t('Pagal rodyklės kryptį palyginkite darinio reaktingumą prieš ir po.', 'Compare the reactivity of the derivative before and after along the arrow.'),
              t('Galimi: chloridas → esteris (alkoholis), anhidridas → amidas ($NH3$), esteris → amidas ($NH3$). Neįmanomi virsmai „į viršų“: esteris → chloridas, amidas → anhidridas.', 'Possible: chloride → ester (alcohol), anhydride → amide ($NH3$), ester → amide ($NH3$). Conversions "uphill" are impossible: ester → chloride, amide → anhydride.'))
            ],
            why: t('Nukleofilas pakeičia nueinančiąją grupę tik tada, kai ji yra geresnė už nukleofilą. Atgal „į viršų“ reikia pereiti per rūgštį ir ją aktyvinti $SOCl2$.', 'A nucleophile replaces the leaving group only when that group is better than the nucleophile. Going back "uphill" requires the acid and activation with $SOCl2$.'),
            src: 'T p89'
          },
          {
            id: 'u14.reactivity.4',
            q: [{ p: t('Reikia gauti amidą iš rūgšties ir amino.', 'An amide must be made from an acid and an amine.') }, { scheme: { items: [{ smi: 'CCC(=O)O' }, { plus: true }, { smi: 'CCN' }, { arrow: '→' }, { smi: 'CCC(=O)NCC' }] } }],
            steps: [
              cho(t('Koks būdas praktiškas?', 'Which route is practical?'), [
                tx('Rūgštį paverskite chloridu su $SOCl2$, tada pridėkite 2 ekv. amino.', 'Convert the acid to the chloride with $SOCl2$, then add 2 equiv. of the amine.'),
                tx('Rūgštį ir aminą tiesiog sumaišykite kambario temperatūroje.', 'Simply mix the acid and the amine at room temperature.'),
                tx('Rūgštį pirma redukuokite $LiAlH4$, tada pridėkite amino.', 'Reduce the acid first with $LiAlH4$, then add the amine.'),
                tx('Aminą pirma acilinkite natrio hidroksidu.', 'Acylate the amine first with sodium hydroxide.')
              ], 0,
              t('Ką sudaro rūgštis su aminu, kai nėra aktyvinimo?', 'What do an acid and an amine form when there is no activation?'),
              t('Be aktyvinimo rūgštis ir aminas tik sudaro druską (amonio karboksilatą). Chloridas yra aktyvintas darinys, kuris su aminu duoda amidą.', 'Without activation the acid and amine only form a salt (an ammonium carboxylate). The chloride is an activated derivative that gives the amide with the amine.'))
            ],
            why: t('Rūgšties OH yra bloga nueinančioji grupė, o aminas ją tik protonuoja. Pakeitus OH į Cl, reakcija vyksta lengvai: tai DEET sintezės principas.', 'The OH of the acid is a poor leaving group and the amine merely protonates it. After replacing OH with Cl the reaction goes easily: this is the principle of the DEET synthesis.'),
            src: 'S6.22'
          },
          {
            id: 'u14.reactivity.5',
            q: [{ p: t('Esterį galima gauti iš etano rūgšties ir iš etanoilchlorido, bet sąlygos skiriasi.', 'An ester can be made from ethanoic acid or from ethanoyl chloride, but the conditions differ.') }, { scheme: { items: [{ smi: 'CC(=O)O' }, { arrow: '⇌', above: f('C2H5OH, H+') }, { smi: 'CC(=O)OCC' }] } }, { scheme: { items: [{ smi: 'CC(=O)Cl' }, { arrow: '→', above: f('C2H5OH') }, { smi: 'CC(=O)OCC' }] } }],
            steps: [
              cho(t('Kodėl rūgščiai reikia rūgštinės katalizės, o chloridui ne?', 'Why does the acid need acid catalysis while the chloride does not?'), [
                tx('Rūgšties karbonilo C yra mažiau elektrofilinis, o OH – bloga nueinančioji grupė; chloridas – stipriai elektrofilinis, o $Cl-$ lengvai išeina.', 'The carbonyl carbon of the acid is less electrophilic and OH is a poor leaving group; the chloride is strongly electrophilic and $Cl-$ leaves easily.'),
                tx('Chloridas reaguoja su alkoholiu kaip bazė, o rūgštis – kaip nukleofilas.', 'The chloride reacts with the alcohol as a base and the acid as a nucleophile.'),
                tx('Rūgštis nereaguoja be $H+$, nes $H+$ yra reagentas, kuris sunaudojamas.', 'The acid does not react without $H+$ because $H+$ is a reagent that is consumed.'),
                tx('Chloridas nesudaro tetraedrinio tarpinio junginio.', 'The chloride does not form a tetrahedral intermediate.')
              ], 0,
              t('Palyginkite karbonilo anglies elektrofiliškumą ir nueinančiąją grupę abiem atvejais.', 'Compare the electrophilicity of the carbonyl carbon and the leaving group in both cases.'),
              t('H+ protonuoja karbonilą ir didina rūgšties C elektrofiliškumą; chlorido karbonilas yra pakankamai elektrofilinis ir be katalizės. H+ katalizatorius nesunaudojamas.', 'H+ protonates the carbonyl and raises the electrophilicity of the acid carbon; the chloride carbonyl is electrophilic enough without catalysis. H+ is a catalyst and is not consumed.'))
            ],
            why: t('Rūgštinė katalizė naudojama, kai karbonilo anglies elektrofiliškumo nepakanka nukleofilinei atakai: protonavimas padaro ją daug elektrofilinesnę.', 'Acid catalysis is used when the electrophilicity of the carbonyl carbon is not enough for nucleophilic attack: protonation makes it far more electrophilic.'),
            src: 'T p88'
          },
          {
            id: 'u14.reactivity.6',
            q: [{ p: t('Molekulėje yra du acilo dariniai. Ją veikia amoniakas (2 ekv.).', 'The molecule contains two acyl derivatives. It is treated with ammonia (2 equiv.).') }, { mol: { smi: 'COC(=O)CCC(=O)Cl', opts: { numbers: 'all' } } }],
            steps: [
              tap(t('Bakstelėkite karbonilo anglį, kurią amoniakas pirmiausia atakuos.', 'Tap the carbonyl carbon that ammonia attacks first.'), { smi: 'COC(=O)CCC(=O)Cl', opts: { numbers: 'all' } }, [6],
                t('Palyginkite abu karbonilus: prie kurio prisijungusi geresnė nueinančioji grupė?', 'Compare the two carbonyls: which one carries the better leaving group?'),
                t('Atakuojama chlorido karbonilo anglis (Nr. 7): $Cl-$ yra daug geresnė nueinančioji grupė už $CH3O-$.', 'The carbonyl carbon of the chloride (no. 7) is attacked: $Cl-$ is a far better leaving group than $CH3O-$.')),
              prod(t('Koks produktas?', 'What is the product?'), 'COC(=O)CCC(N)=O', ['NC(=O)CCC(N)=O', 'NC(=O)CCC(=O)Cl', 'COC(=O)CCC(=O)O'],
                t('Reaguoja tik reaktingesnis darinys.', 'Only the more reactive derivative reacts.'),
                t('Chloridas virsta amidu, esteris lieka. (Amoniako imama 2 ekv.: antras suriša HCl.)', 'The chloride becomes an amide and the ester stays. (Two equivalents of ammonia are used: the second takes up the HCl.)'))
            ],
            why: t('Kai molekulėje yra du acilo dariniai, pirmiau reaguoja reaktingesnis; tai leidžia selektyviai modifikuoti vieną grupę.', 'When a molecule has two acyl derivatives the more reactive one reacts first; this lets one group be modified selectively.'),
            src: 'T p88',
            claims: [{ react: ['acyl.nu', ['COC(=O)CCC(=O)Cl', 'N'], { nu: 'ammonia' }, 'COC(=O)CCC(N)=O'] }]
          },
          {
            id: 'u14.reactivity.7',
            q: [{ p: t('Molekulė su amidu ir esteriu kaitinama su vandeniniu NaOH tik trumpai.', 'A molecule with an amide and an ester is warmed briefly with aqueous NaOH.') }, { mol: { smi: 'CC(=O)NCCC(=O)OC', name: t('metil-3-acetilaminopropanoatas', 'methyl 3-(acetylamino)propanoate') } }],
            steps: [
              cho(t('Koks organinis produktas pagrindinis?', 'What is the main organic product?'), [mo('CC(=O)NCCC(=O)[O-].[Na+]'), mo('COC(=O)CCN'), mo('NCCC(=O)[O-].[Na+]'), mo('CC(=O)NCCC(=O)O')], 0,
                t('Kuris darinys reaktingesnis, ir kokia forma yra rūgštis šarmuose?', 'Which derivative is more reactive, and in what form does an acid exist in alkali?'),
                t('Esteris hidrolizuojasi greičiau už amidą. Šarminėje terpėje rūgštis yra druska, o amidas lieka. Metanolis išsiskiria kaip antras produktas.', 'The ester hydrolyses faster than the amide. In alkali the acid is present as the salt and the amide remains. Methanol is released as the second product.'))
            ],
            why: t('Esteris reaktingesnis už amidą, todėl švelnia hidrolize skyla pirmiausia jis; šarminėje terpėje gaunama karboksilato druska.', 'The ester is more reactive than the amide, so it is the one cleaved by mild hydrolysis; in alkali the carboxylate salt is obtained.'),
            src: 'T p88, p95',
            claims: [{ react: ['ester.hydrolysis', ['CC(=O)NCCC(=O)OC'], { medium: 'base' }, 'CC(=O)NCCC(=O)[O-].[Na+]'] }, { name: ['CC(=O)NCCC(=O)OC', t('metil-3-acetilaminopropanoatas', 'methyl 3-(acetylamino)propanoate')] }]
          },
          {
            id: 'u14.reactivity.8',
            q: [{ p: t('Sudėkite darinių klases su jų pavyzdžiais.', 'Match the classes of derivatives with their examples.') }],
            steps: [{
              prompt: t('Sudėkite poras.', 'Make the pairs.'), kind: 'match',
              answer: {
                left: [tx('rūgšties chloridas', 'acyl chloride'), tx('anhidridas', 'anhydride'), tx('esteris', 'ester'), tx('amidas', 'amide'), tx('nitrilas', 'nitrile')],
                right: [mo('CCC(=O)Cl'), mo('CCC(=O)OC(=O)CC'), mo('CCC(=O)OC'), mo('CCC(N)=O'), mo('CCC#N')],
                pairs: [0, 1, 2, 3, 4]
              },
              hint: t('Pažiūrėkite, kokie atomai prijungti prie karbonilo anglies.', 'Look at which atoms are bonded to the carbonyl carbon.'),
              solution: t('Chloridas turi $C-Cl$, anhidridas – $C-O-C=O$, esteris – $C-O-R$, amidas – $C-N$ su karbonilu, nitrilas – $C≡N$.', 'The chloride has $C-Cl$, the anhydride $C-O-C=O$, the ester $C-O-R$, the amide a $C-N$ bond with the carbonyl, the nitrile $C≡N$.')
            }],
            why: t('Visi šie junginiai hidrolizuojami iki tos pačios rūgšties, todėl jie vadinami karboksirūgščių dariniais.', 'All of these compounds hydrolyse to the same acid, which is why they are called derivatives of carboxylic acids.'),
            src: 'T p87'
          }
        ]
      },
      /* ============================================================ nu */
      {
        id: 'u14.nu',
        title: t('Nukleofilinis acilpakeitimas: produktai', 'Nucleophilic acyl substitution: the products'),
        mirrors: ['S6.7', 'S6.16'],
        gen: genNu
      },
      /* ============================================================ mech */
      {
        id: 'u14.mech',
        title: t('Esterinimo ir hidrolizės mechanizmas', 'Mechanism of esterification and hydrolysis'),
        mirrors: ['S6.7', 'S6.20'],
        bank: [
          {
            id: 'u14.mech.1',
            q: [{ p: t('Rūgštimi katalizuojamas etano rūgšties ir metanolio esterinimas.', 'Acid-catalysed esterification of ethanoic acid with methanol.') }, { scheme: { items: [{ smi: 'CC(=O)O' }, { plus: true }, { smi: 'CO' }, { arrow: '⇌', above: f('H+') }, { smi: 'CC(=O)OC' }, { plus: true }, { smi: 'O' }] } }],
            steps: [
              ord(t('Išdėstykite mechanizmo stadijas.', 'Put the mechanism steps in order.'), [
                tx('Karbonilo deguonis prisijungia protoną.', 'The carbonyl oxygen picks up a proton.'),
                tx('Alkoholio deguonis puola karbonilo anglį.', 'The alcohol oxygen attacks the carbonyl carbon.'),
                tx('Protonas pereina nuo vieno deguonies prie kito.', 'A proton shifts from one oxygen to another.'),
                tx('Išeina vanduo ir atskyla protonas: susidaro esteris.', 'Water leaves and a proton is lost: the ester forms.')
              ],
              t('Pirmiausia reikia padaryti karbonilo anglį reaktingesnę.', 'First the carbonyl carbon has to be made more reactive.'),
              t('Pirma protonuojamas karbonilas (didėja C elektrofiliškumas), po to atakuoja alkoholis, protonas pereina, kad OH taptų $H2O$ (gera nueinančioji grupė), ir galiausiai išeina vanduo.', 'The carbonyl is protonated first (raising the electrophilicity of C), then the alcohol attacks, a proton shifts so that OH becomes $H2O$ (a good leaving group), and finally water leaves.'))
            ],
            why: t('Rūgštimi katalizuojamas esterinimas yra nukleofilinis acilpakeitimas: protonavimas aktyvina karbonilą, o tetraedrinis tarpinis junginys praranda vandenį.', 'Acid-catalysed esterification is nucleophilic acyl substitution: protonation activates the carbonyl, and the tetrahedral intermediate loses water.'),
            src: 'T p90'
          },
          {
            id: 'u14.mech.2',
            q: [{ p: t('Pirmoji ir antroji esterinimo stadijos.', 'The first and second stages of esterification.') }, { mol: { smi: 'CC(=O)O', opts: { numbers: 'all' } } }],
            steps: [
              tap(t('Bakstelėkite atomą, kurį protonuoja $H+$.', 'Tap the atom that $H+$ protonates.'), { smi: 'CC(=O)O', opts: { numbers: 'all' } }, [2],
                t('Kuris deguonis susidarius katijonui geriau išlaiko krūvį per rezonansą?', 'Which oxygen holds the charge better by resonance once the cation forms?'),
                t('Protonuojamas karbonilo deguonis (Nr. 3): teigiamas krūvis dalijasi su OH deguonimi, o anglis tampa elektrofiliškesnė.', 'The carbonyl oxygen (no. 3) is protonated: the positive charge is shared with the OH oxygen and the carbon becomes more electrophilic.')),
              tap(t('Bakstelėkite atomą, kurį atakuoja alkoholis.', 'Tap the atom that the alcohol attacks.'), { smi: 'CC(=O)O', opts: { numbers: 'all' } }, [1],
                t('Kuris atomas protonuotame katijone turi didžiausią $δ+$?', 'Which atom of the protonated cation carries the largest $δ+$?'),
                t('Alkoholio deguonis puola karbonilo anglį (Nr. 2), nes ji turi didžiausią dalinį teigiamą krūvį.', 'The alcohol oxygen attacks the carbonyl carbon (no. 2) because it carries the largest partial positive charge.'))
            ],
            why: t('Protonas jungiasi prie karbonilo deguonies, o nukleofilas – prie karbonilo anglies: taip tvarkoma visų acilo darinių reakcijų elektronų eiga.', 'The proton goes to the carbonyl oxygen and the nucleophile to the carbonyl carbon: this is the electron flow in all reactions of acyl derivatives.'),
            src: 'T p90'
          },
          {
            id: 'u14.mech.3',
            q: [{ p: t('Esterinimas vyksta tik su $H2SO4$ ar kitu rūgštiniu katalizatoriumi.', 'Esterification works only with $H2SO4$ or another acid catalyst.') }],
            steps: [
              cho(t('Ką daro rūgštis?', 'What does the acid do?'), [
                tx('Protonuoja karbonilo deguonį ir tuo padidina C atomo elektrofiliškumą, kad jį galėtų pulti silpnas nukleofilas (alkoholis).', 'It protonates the carbonyl oxygen and so raises the electrophilicity of C, so that a weak nucleophile (the alcohol) can attack it.'),
                tx('Paverčia alkoholį stipresniu nukleofilu, nes atplėšia jo protoną.', 'It turns the alcohol into a stronger nucleophile by removing its proton.'),
                tx('Sunaudojama kaip reagentas ir sudaro ryšį su esterio anglimi.', 'It is consumed as a reagent and forms a bond to the ester carbon.'),
                tx('Paverčia rūgštį rūgšties chloridu.', 'It turns the acid into an acyl chloride.')
              ], 0,
              t('H+ yra katalizatorius: jis pasikeičia, bet galiausiai atsikuria.', 'H+ is a catalyst: it takes part, but is regenerated in the end.'),
              t('Rūgštinė katalizė: C=O protonuojamas, C tampa labai elektrofilinis. Alkoholis lieka silpnu nukleofilu, o H+ gaunamas atgal paskutinėje stadijoje. Tas pats pasakytina apie fenolio acilinimą anhidridu (aspirino sintezė).', 'Acid catalysis: C=O is protonated and C becomes very electrophilic. The alcohol stays a weak nucleophile and H+ is regained in the last stage. The same holds for acylating a phenol with an anhydride (aspirin synthesis).'))
            ],
            why: t('Kai nukleofilas silpnas, o acilo darinys nepakankamai reaktingas, naudojama rūgštinė katalizė: ji aktyvina elektrofilą, o ne nukleofilą.', 'When the nucleophile is weak and the acyl derivative not reactive enough, acid catalysis is used: it activates the electrophile, not the nucleophile.'),
            src: 'T p88, p90; S6.20'
          },
          {
            id: 'u14.mech.4',
            q: [{ p: t('Benzenkarboksirūgštis reaguoja su metanoliu, kuriame deguonis yra žymėtas izotopu $18O$.', 'Benzoic acid reacts with methanol in which the oxygen is labelled with the isotope $18O$.') }, { scheme: { items: [{ smi: 'OC(=O)c1ccccc1' }, { plus: true }, { smi: 'CO' }, { arrow: '⇌', above: f('H+') }] } }],
            steps: [
              cho(t('Kur randamas $18O$?', 'Where is the $18O$ found?'), [
                tx('Tik esteryje.', 'Only in the ester.'),
                tx('Tik vandenyje.', 'Only in the water.'),
                tx('Pusiau esteryje, pusiau vandenyje.', 'Half in the ester and half in the water.'),
                tx('Nei esteryje, nei vandenyje: jis išsiskiria kaip dujos.', 'Neither in the ester nor in the water: it leaves as a gas.')
              ], 0,
              t('Kuri jungtis nutrūksta: rūgšties C–OH ar alkoholio C–O?', 'Which bond breaks: the C–OH bond of the acid or the C–O bond of the alcohol?'),
              t('Vanduo gaunamas iš rūgšties OH ir alkoholio H, todėl alkoholio deguonis lieka esteryje.', 'The water comes from the acid OH and the alcohol H, so the alcohol oxygen stays in the ester.')),
              {
                prompt: t('Bakstelėkite rūgšties jungtį, kuri nutrūksta.', 'Tap the bond of the acid that breaks.'), kind: 'atoms', bonds: true,
                mol: { smi: 'OC(=O)c1ccccc1', opts: { numbers: 'all' } }, answer: [[0, 1]],
                hint: t('Kuri OH grupė išeina kaip vanduo?', 'Which OH group leaves as water?'),
                solution: t('Nutrūksta karboksigrupės C–OH jungtis (atomai Nr. 1 ir 2): OH atskyla nuo rūgšties, o ne alkoholio deguonis.', 'The C–OH bond of the carboxyl group breaks (atoms no. 1 and 2): the OH leaves from the acid, not the alcohol oxygen.')
              }
            ],
            why: t('Žymėtojo deguonies eksperimentas parodė, kad rūgšties C–OH ryšys nutrūksta, o alkoholio deguonis lieka esteryje; tai atitinka nukleofilinio acilpakeitimo mechanizmą.', 'The labelled-oxygen experiment showed that the C–OH bond of the acid breaks and the alcohol oxygen stays in the ester; this fits the mechanism of nucleophilic acyl substitution.'),
            src: 'T p89'
          },
          {
            id: 'u14.mech.5',
            q: [{ p: t('Etiletanoatas reaguoja su hidroksidu.', 'Ethyl ethanoate reacts with hydroxide.') }, { scheme: { items: [{ smi: 'CC(=O)OCC' }, { plus: true }, { smi: '[OH-]' }, { arrow: '→' }] } }],
            steps: [
              cho(t('Koks yra tetraedrinis tarpinis junginys?', 'What is the tetrahedral intermediate?'), [mo('CC([O-])(O)OCC'), mo('CC(=O)O.CC[O-]'), mo('CC(O)(O)OCC'), mo('CCOC(=O)[O-]')], 0,
                t('Hidroksidas prisijungia prie karbonilo anglies, o $π$ elektronai pereina deguoniui.', 'Hydroxide adds to the carbonyl carbon and the $π$ electrons move to oxygen.'),
                [{ p: t('$OH-$ puola karbonilo anglį, ir susidaro anijonas su keturiais pakaitais ant anglies (tarpinis prijungimo produktas).', '$OH-$ attacks the carbonyl carbon and an anion with four substituents on carbon forms (the addition intermediate).') }, {
                  mech: [{ scheme: { items: [{ smi: '[OH-]', opts: { lonePairs: true } }, { plus: true }, { smi: 'CC(=O)OCC' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }] }]
                }])
            ],
            why: t('Prijungimas prie $C=O$ visada duoda tetraedrinį junginį su neigiamu deguonimi; antroje stadijoje jis išstumia alkoksidą ir atkuria $C=O$.', 'Addition to $C=O$ always gives a tetrahedral compound with a negative oxygen; in the second stage it expels the alkoxide and restores $C=O$.'),
            src: 'T p88; S6.7',
            claims: [{ formula: ['CC([O-])(O)OCC', 'C4H9O3-'] }]
          },
          {
            id: 'u14.mech.6',
            q: [{ p: t('Esterių šarminė hidrolizė (muilinimas) yra negrįžtama, o rūgštinė – grįžtamoji.', 'Alkaline hydrolysis of esters (saponification) is irreversible, while the acid one is reversible.') }],
            steps: [
              cho(t('Kodėl šarminė hidrolizė negrįžtama?', 'Why is the alkaline hydrolysis irreversible?'), [
                tx('Susidariusi rūgštis iš karto atiduoda protoną bazei; karboksilato anijoną alkoholis nebepuola.', 'The acid formed at once gives its proton to the base; the carboxylate anion is no longer attacked by the alcohol.'),
                tx('Alkoholis išgaruoja iš mišinio.', 'The alcohol evaporates from the mixture.'),
                tx('Šarmas veikia kaip katalizatorius ir greitina tik tiesioginę reakciją.', 'The alkali acts as a catalyst and speeds up only the forward reaction.'),
                tx('Vanduo sunaudojamas visas.', 'All of the water is consumed.')
              ], 0,
              t('Kas atsitinka su rūgštimi šarminėje terpėje?', 'What happens to the acid in an alkaline medium?'),
              t('Paskutinė stadija – rūgšties deprotonavimas – praktiškai negrįžtama, o karboksilatas nėra elektrofilas, todėl atgal nereaguoja. Šarmas – reagentas, jo sunaudojama po vieną ekvivalentą.', 'The last stage, deprotonation of the acid, is practically irreversible and the carboxylate is not an electrophile, so it does not react back. The alkali is a reagent: one equivalent is consumed.'))
            ],
            why: t('Rūgštinėje terpėje esteris ir rūgštis yra pusiausvyroje, o šarmuose pusiausvyrą į produktą pastumia karboksilato susidarymas.', 'In acid the ester and acid are in equilibrium, whereas in alkali the formation of the carboxylate pulls the equilibrium to the products.'),
            src: 'T p95'
          },
          {
            id: 'u14.mech.7',
            q: [{ p: t('Etiletanoatas hidrolizuojamas.', 'Ethyl ethanoate is hydrolysed.') }, { mol: { smi: 'CC(=O)OCC', opts: { numbers: 'all' } } }],
            steps: [
              {
                prompt: t('Bakstelėkite ryšį, kuris hidrolizės metu nutrūksta.', 'Tap the bond that breaks in hydrolysis.'), kind: 'atoms', bonds: true,
                mol: { smi: 'CC(=O)OCC', opts: { numbers: 'all' } }, answer: [[1, 3]],
                hint: t('Nutrūksta jungtis tarp karbonilo anglies ir vieno deguonies.', 'The bond that breaks is between the carbonyl carbon and one oxygen.'),
                solution: t('Skyla acilo C–O jungtis (atomai Nr. 2 ir 4), o ne O–C jungtis alkilo pusėje: alkoholis lieka etanoliu.', 'The acyl C–O bond breaks (atoms no. 2 and 4), not the O–C bond on the alkyl side: the alcohol remains ethanol.')
              },
              cho(t('Koks produktas gaunamas rūgštinėje terpėje?', 'Which product pair forms in acid?'), [sc({ smi: 'CC(=O)O' }, { plus: true }, { smi: 'CCO' }), sc({ smi: 'CC(=O)[O-].[Na+]' }, { plus: true }, { smi: 'CCO' }), sc({ smi: 'CCC(=O)O' }, { plus: true }, { smi: 'CO' })], 0,
                t('Rūgštyje nėra bazės, kuri atplėštų protoną.', 'There is no base in acid to remove the proton.'),
                t('Rūgštyje gaunama laisva rūgštis ir alkoholis. Druska atsirastų tik šarminėje terpėje.', 'In acid the free acid and the alcohol form. A salt would appear only in alkali.'))
            ],
            why: t('Esterio hidrolizėje skyla acilo C–O ryšys; alkoholio dalis išlieka nepakitusi.', 'In ester hydrolysis the acyl C–O bond breaks; the alcohol part is unchanged.'),
            src: 'T p89, p95',
            claims: [{ react: ['ester.hydrolysis', ['CC(=O)OCC'], { medium: 'acid' }, 'CC(=O)O'] }]
          },
          {
            id: 'u14.mech.8',
            q: [{ p: t('Esterinimas yra pusiausvyros reakcija.', 'Esterification is an equilibrium reaction.') }, { scheme: { items: [{ smi: 'CCC(=O)O' }, { plus: true }, { smi: 'CCO' }, { arrow: '⇌', above: f('H+') }, { smi: 'CCC(=O)OCC' }, { plus: true }, { smi: 'O' }] } }],
            steps: [
              mul(t('Kuri(-ie) veiksmai didina esterio išeigą?', 'Which action(s) raise the yield of the ester?'), [
                tx('Imti alkoholio perteklių.', 'Use an excess of the alcohol.'),
                tx('Nuolat šalinti susidarantį vandenį.', 'Remove the water as it forms.'),
                tx('Pridėti vandens perteklių.', 'Add an excess of water.'),
                tx('Pridėti daugiau rūgšties katalizatoriaus.', 'Add more acid catalyst.')
              ], [0, 1],
              t('Kaip pasikeičia pusiausvyra, kai pašalinamas produktas ar padidinamas reagento kiekis? Ar katalizatorius ją keičia?', 'How does an equilibrium respond when a product is removed or a reagent is added in excess? Does a catalyst change it?'),
              t('Alkoholio perteklius ir vandens šalinimas stumia pusiausvyrą į esterį. Daugiau vandens – į rūgštį. Katalizatorius tik greitina pusiausvyros pasiekimą.', 'An excess of alcohol and removal of water push the equilibrium to the ester. More water pushes it back to the acid. The catalyst only speeds up the approach to equilibrium.'))
            ],
            why: t('Pusiausvyra priklauso nuo reagentų ir produktų kiekių, ne nuo katalizatoriaus; todėl esterinant reikia pertekliaus alkoholio ar vandens šalinimo.', 'The equilibrium depends on the amounts of reagents and products, not on the catalyst; so esterification needs an excess of alcohol or removal of water.'),
            src: 'T p89'
          }
        ]
      },
      /* ============================================================ claisen */
      {
        id: 'u14.claisen',
        title: t('Klaizeno kondensacija', 'The Claisen condensation'),
        mirrors: ['S6.8', 'S6.19'],
        gen: genClaisen,
        bank: [
          {
            id: 'u14.claisen.1',
            q: [{ p: t('Klaizeno kondensacija: du etiletanoato molekulės su $NaOC2H5$.', 'Claisen condensation: two molecules of ethyl ethanoate with $NaOC2H5$.') }, { scheme: { items: [{ smi: 'CC(=O)OCC' }, { plus: true }, { smi: 'CC(=O)OCC' }, { arrow: '→', above: f('NaOC2H5') }, { smi: 'CCOC(=O)CC(C)=O' }, { plus: true }, { smi: 'CCO' }] } }],
            steps: [
              ord(t('Išdėstykite mechanizmo stadijas.', 'Put the mechanism steps in order.'), [
                tx('Alkoksidas atplėšia α-vandenilį: susidaro enolatas.', 'Alkoxide removes an α-hydrogen: the enolate forms.'),
                tx('Enolatas puola kitos molekulės karbonilo anglį: susidaro tetraedrinis tarpinis junginys.', 'The enolate attacks the carbonyl carbon of a second molecule: a tetrahedral intermediate forms.'),
                tx('Iš tarpinio junginio išeina alkoksidas: susidaro β-ketoesteris.', 'An alkoxide leaves the intermediate: the β-keto ester forms.'),
                tx('Bazė atplėšia rūgštų $CH2$ vandenilį tarp dviejų karbonilų.', 'The base removes the acidic $CH2$ hydrogen between the two carbonyls.'),
                tx('Parūgštinus gaunamas neutralus β-ketoesteris.', 'Acidification gives the neutral β-keto ester.')
              ],
              t('Pirma reikia sukurti nukleofilą, po to jis puola, o paskutinės stadijos – pusiausvyros pastūmimas ir apdorojimas.', 'First the nucleophile must be made, then it attacks, and the last stages are driving the equilibrium and work-up.'),
              t('Deprotonavimas → prijungimas → eliminavimas → produkto deprotonavimas (pastumia pusiausvyrą) → parūgštinimas.', 'Deprotonation → addition → elimination → deprotonation of the product (drives the equilibrium) → acidification.'))
            ],
            why: t('Klaizeno kondensacija yra nukleofilinis acilpakeitimas, kur nukleofilas yra enolatas; prijungimo ir eliminavimo stadijas pastumia į priekį produkto deprotonavimas.', 'The Claisen condensation is nucleophilic acyl substitution in which the nucleophile is an enolate; deprotonation of the product drives the addition and elimination stages forward.'),
            src: 'T p91; Klein',
            claims: [{ react: ['claisen', ['CC(=O)OCC'], null, 'CCOC(=O)CC(C)=O'] }]
          },
          {
            id: 'u14.claisen.2',
            q: [{ p: t('Etiletanoato ir etilbenzenkarboksilato mišinys apdorojamas $NaOC2H5$, po to rūgštimi.', 'A mixture of ethyl ethanoate and ethyl benzoate is treated with $NaOC2H5$ and then with acid.') }, { mol: [{ smi: 'CC(=O)OCC', name: t('etiletanoatas', 'ethyl ethanoate') }, { smi: 'CCOC(=O)c1ccccc1', name: t('etilbenzenkarboksilatas', 'ethyl benzoate') }] }],
            steps: [
              mul(t('Pažymėkite abu produktus, kurie susidaro.', 'Pick both products that form.'), [mo('CCOC(=O)CC(C)=O'), mo('CCOC(=O)CC(=O)c1ccccc1'), mo('O=C(CC(=O)c1ccccc1)c1ccccc1'), mo('CCOC(=O)C(C(C)=O)c1ccccc1')], [0, 1],
                t('Kuris esteris gali tapti enolatu? Tas enolatas puola abu esterius.', 'Which ester can become an enolate? That enolate attacks both esters.'),
                [{ p: t('Tik etiletanoatas turi α-vandenilių, todėl tik jis tampa enolatu. Šis enolatas puola ir etiletanoatą (savikondensacija), ir etilbenzenkarboksilatą (mišri kondensacija).', 'Only ethyl ethanoate has α-hydrogens, so only it becomes an enolate. This enolate attacks both ethyl ethanoate (self-condensation) and ethyl benzoate (the mixed condensation).') }, { scheme: { items: [{ smi: 'CCOC(=O)CC(C)=O' }, { plus: true }, { smi: 'CCOC(=O)CC(=O)c1ccccc1' }] } }])
            ],
            why: t('Esteris be α-vandenilių negali būti nukleofilu, bet gali būti elektrofilu; todėl mišri kondensacija duoda ir savikondensacijos, ir kryžminį produktą.', 'An ester without α-hydrogens cannot be a nucleophile but can be an electrophile; so the mixed condensation gives both the self-condensation and the crossed product.'),
            src: 'S6.19',
            claims: [
              { react: ['claisen', ['CC(=O)OCC', 'CCOC(=O)c1ccccc1'], null, 'CCOC(=O)CC(C)=O'] },
              { name: ['CCOC(=O)CC(=O)c1ccccc1', t('etil-3-fenil-3-oksopropanoatas', 'ethyl 3-oxo-3-phenylpropanoate')] }
            ]
          },
          {
            id: 'u14.claisen.3',
            q: [{ p: t('Keturi esteriai bandomi su $NaOC2H5$.', 'Four esters are tested with $NaOC2H5$.') }],
            steps: [
              mul(t('Pažymėkite esterius, kurie negali duoti Klaizeno savikondensacijos.', 'Pick the esters that cannot undergo Claisen self-condensation.'), [mo('CCOC(=O)c1ccccc1'), mo('CCOC(=O)C(C)(C)C'), mo('CCOC(=O)C(C)C'), mo('CCCC(=O)OCC')], [0, 1, 2],
                t('Suskaičiuokite α-vandenilius kiekvienam esteriui: kiek jų reikia?', 'Count the α-hydrogens of each ester: how many are needed?'),
                t('Etilbenzenkarboksilatas ir 2,2-dimetilpropanoatas neturi α-H. Etil-2-metilpropanoatas turi tik vieną: produktas neturėtų rūgštaus vandenilio, kuris pastumtų pusiausvyrą. Tinka tik etilbutanoatas (du α-H).', 'Ethyl benzoate and ethyl 2,2-dimethylpropanoate have no α-H. Ethyl 2-methylpropanoate has just one: its product would have no acidic hydrogen to pull the equilibrium. Only ethyl butanoate (two α-H) works.'))
            ],
            why: t('Savikondensacijai reikia bent dviejų α-vandenilių: vienas atplėšiamas pirmoje stadijoje, o antras – produkte, kad pastumtų pusiausvyrą.', 'Self-condensation needs at least two α-hydrogens: one is removed in the first stage and the second in the product to drive the equilibrium.'),
            src: 'Klein; T p91',
            claims: [{ react: ['claisen', ['CCCC(=O)OCC'], null, 'CCCC(=O)C(CC)C(=O)OCC'] }]
          },
          {
            id: 'u14.claisen.4',
            q: [{ p: t('Etiletanoatas apdorojamas natrio metoksidu vietoje natrio etoksido.', 'Ethyl ethanoate is treated with sodium methoxide instead of sodium ethoxide.') }],
            steps: [
              cho(t('Kas atsitinka?', 'What happens?'), [
                tx('Dalis esterio virsta metilo esteriu (alkoksigrupių mainai), todėl gaunamas produktų mišinys.', 'Part of the ester becomes the methyl ester (exchange of the alkoxy group), so a mixture of products results.'),
                tx('Reakcija nevyksta, nes metoksidas per silpna bazė.', 'Nothing happens because methoxide is too weak a base.'),
                tx('Esteris hidrolizuojasi iki rūgšties.', 'The ester is hydrolysed to the acid.'),
                tx('Susidaro tik vienas produktas, nes alkoksidas nedalyvauja.', 'Only one product forms because the alkoxide takes no part.')
              ], 0,
              t('Alkoksidas yra ir bazė, ir nukleofilas.', 'An alkoxide is both a base and a nucleophile.'),
              t('Metoksidas puola esterio karbonilą ir išstumia etoksidą (transesterinimas). Todėl bazė turi būti to paties alkoholio alkoksidas.', 'Methoxide attacks the carbonyl of the ester and displaces ethoxide (transesterification). That is why the base must be the alkoxide of the same alcohol.'))
            ],
            why: t('Alkoksidas gali veikti kaip nukleofilas, todėl su kito alkoholio alkoksidu vyksta acilpakeitimas alkoksigrupės pakeitimu.', 'An alkoxide can act as a nucleophile, so with the alkoxide of a different alcohol acyl substitution exchanges the alkoxy group.'),
            src: 'Klein'
          },
          {
            id: 'u14.claisen.5',
            q: [{ p: t('Klaizeno kondensacijoje naudojamas bent vienas ekvivalentas bazės, o ne katalitinis kiekis.', 'A Claisen condensation uses at least one equivalent of base, not a catalytic amount.') }],
            steps: [
              cho(t('Kodėl?', 'Why?'), [
                tx('Produktas (β-ketoesteris) yra rūgštus ir sunaudoja bazę; šis deprotonavimas pastumia pusiausvyrą į produktą.', 'The product (the β-keto ester) is acidic and consumes base; this deprotonation pulls the equilibrium to the product.'),
                tx('Bazė sunaudojama pirmoje stadijoje ir negrįžta.', 'The base is consumed in the first stage and never returns.'),
                tx('Bazė reaguoja su vandeniu, kurį išskiria reakcija.', 'The base reacts with the water that the reaction releases.'),
                tx('Bazė jungiasi prie esterio karbonilo ir lieka produkte.', 'The base bonds to the ester carbonyl and stays in the product.')
              ], 0,
              t('Palyginkite produkto CH₂ rūgštingumą (tarp dviejų karbonilų) su alkoholio rūgštingumu.', 'Compare the acidity of the product\'s CH₂ (between two carbonyls) with that of the alcohol.'),
              t('Pati kondensacijos pusiausvyra mažai palanki, bet β-ketoesterio CH₂ (pKa apie 11) rūgštesnis už etanolį (apie 16), todėl alkoksidas jį deprotonuoja ir produktas pasišalina iš pusiausvyros.', 'The condensation equilibrium itself is unfavourable, but the CH₂ of the β-keto ester (pKa about 11) is more acidic than ethanol (about 16), so the alkoxide deprotonates it and the product is removed from the equilibrium.'))
            ],
            why: t('Pusiausvyros pastūmimas deprotonuojant produktą paaiškina ir bazės kiekį, ir reikalavimą turėti du α-vandenilius.', 'Driving the equilibrium by deprotonating the product explains both the amount of base and the requirement for two α-hydrogens.'),
            src: 'Klein'
          },
          {
            id: 'u14.claisen.6',
            q: [{ p: t('Etil-3-oksobutanoatas (acetoacto esteris).', 'Ethyl 3-oxobutanoate (acetoacetic ester).') }, { mol: { smi: 'CCOC(=O)CC(C)=O', opts: { numbers: 'all' }, name: t('etil-3-oksobutanoatas', 'ethyl 3-oxobutanoate') } }],
            steps: [
              tap(t('Bakstelėkite anglies atomą, kurio vandenilis yra rūgščiausias.', 'Tap the carbon whose hydrogen is the most acidic.'), { smi: 'CCOC(=O)CC(C)=O', opts: { numbers: 'all' } }, [5],
                t('Raskite $CH2$ grupę, kurią supa du karbonilai.', 'Find the $CH2$ group that is flanked by two carbonyls.'),
                t('Atomas Nr. 6 yra tarp esterio ir ketono karbonilų: anijono krūvis pasiskirsto per abu karbonilus.', 'Carbon no. 6 sits between the ester and ketone carbonyls: the anion\'s charge is delocalised over both.')),
              cho(t('Kodėl šis vandenilis toks rūgštus?', 'Why is this hydrogen so acidic?'), [
                tx('Susidaręs anijonas delokalizuojasi per du karbonilus (rezonansas).', 'The anion that forms is delocalised over two carbonyls (resonance).'),
                tx('Šalia yra dvi alkilgrupės, kurios stumia elektronus.', 'Two alkyl groups next to it donate electrons.'),
                tx('Vandenilis sudaro vandenilinį ryšį su esterio deguonimi.', 'The hydrogen forms a hydrogen bond with the ester oxygen.'),
                tx('$CH2$ yra pirminė anglis.', 'The $CH2$ is a primary carbon.')
              ], 0, t('Nupieškite anijoną ir suskaičiuokite rezonansines formules.', 'Draw the anion and count the resonance structures.'),
              t('Krūvis dalijasi tarp dviejų karbonilo deguonų; tai ir yra β-ketoesterio rūgštingumo (pKa apie 11) priežastis.', 'The charge is shared between two carbonyl oxygens; this is the reason for the acidity of the β-keto ester (pKa about 11).'))
            ],
            why: t('Klaizeno produktas yra rūgštesnis už alkoholį, todėl reakcijos pabaigoje bazė jį deprotonuoja.', 'The Claisen product is more acidic than an alcohol, so at the end of the reaction the base deprotonates it.'),
            src: 'Klein',
            claims: [{ name: ['CCOC(=O)CC(C)=O', t('etil-3-oksobutanoatas', 'ethyl 3-oxobutanoate')] }]
          },
          {
            id: 'u14.claisen.7',
            q: [{ p: t('Klaizeno kondensacija ir aldolinė kondensacija atrodo panašios.', 'The Claisen and the aldol condensations look alike.') }],
            steps: [
              cho(t('Kuris teiginys teisingas?', 'Which statement is correct?'), [
                tx('Abiem atvejais enolatas puola karbonilo anglį; Klaizeno atveju tetraedrinis junginys išstumia alkoksidą ir atsiranda $C=O$, o aldoliniame – alkoksidas protonuojamas ir lieka OH.', 'In both an enolate attacks a carbonyl carbon; in the Claisen case the tetrahedral intermediate expels an alkoxide and a $C=O$ appears, in the aldol the alkoxide is protonated and stays an OH.'),
                tx('Klaizeno atveju lieka OH grupė, aldoliniame – $C=O$.', 'In the Claisen case an OH group remains, in the aldol a $C=O$.'),
                tx('Abi reakcijos vyksta tik su aldehidais.', 'Both reactions occur only with aldehydes.'),
                tx('Klaizeno reakcijoje enolatas puola alkilo anglį (SN2).', 'In the Claisen reaction the enolate attacks an alkyl carbon (SN2).')
              ], 0,
              t('Palyginkite, ar prie atakuojamos anglies yra nueinančioji grupė.', 'Compare whether the attacked carbon carries a leaving group.'),
              t('Esteris turi nueinančiąją grupę (OR), todėl po prijungimo seka eliminavimas ir susidaro β-ketoesteris. Aldehidas jos neturi, todėl lieka β-hidroksialdehidas.', 'An ester has a leaving group (OR), so addition is followed by elimination and a β-keto ester forms. An aldehyde has none, so a β-hydroxy aldehyde remains.'))
            ],
            why: t('Esterio karbonilas turi nueinančiąją grupę, todėl enolato atakos rezultatas yra pakeitimas, o ne vien prijungimas.', 'The ester carbonyl carries a leaving group, so attack by an enolate results in substitution, not just addition.'),
            src: 'S6.6; T p91'
          },
          {
            id: 'u14.claisen.8',
            q: [{ p: t('Etilbutanoatas apdorojamas natrio etoksidu, po to rūgštimi.', 'Ethyl butanoate is treated with sodium ethoxide and then with acid.') }, { scheme: { items: [{ smi: 'CCCC(=O)OCC', name: t('etilbutanoatas', 'ethyl butanoate') }, { arrow: '→', above: f('1. NaOC2H5'), below: f('2. H3O+') }] } }],
            steps: [
              prod(t('Koks yra kondensacijos produktas?', 'What is the product of the condensation?'), 'CCCC(=O)C(CC)C(=O)OCC', ['CCCC(O)(OCC)C(CC)C(=O)OCC', 'CCCC(=O)C(CC)C(=O)O', 'CCCC(=O)CCC'],
                t('Naujas ryšys jungia α-anglį su kitos molekulės karbonilu.', 'The new bond joins the α-carbon to the carbonyl of the other molecule.'),
                t('Susidaro β-ketoesteris; neišlieka nei tetraedrinis tarpinis junginys, nei hidrolizės produktai.', 'A β-keto ester forms; neither the tetrahedral intermediate nor hydrolysis products remain.')),
              {
                prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: 'CCCC(=O)C(CC)C(=O)OCC' }, answer: { smi: 'CCCC(=O)C(CC)C(=O)OCC' },
                hint: t('Pagrindinė grandinė baigiasi esterio karbonilu; oksogrupė ir etilas yra pakaitai.', 'The main chain ends at the ester carbonyl; the oxo group and the ethyl group are substituents.'),
                solution: t('etil-2-etil-3-oksoheksanoatas', 'ethyl 2-ethyl-3-oxohexanoate')
              }
            ],
            why: t('Kondensuojasi dvi esterio molekulės: viena duoda α-anglį, kita – karbonilą; alkoholis išsiskiria.', 'Two ester molecules condense: one supplies the α-carbon, the other the carbonyl; the alcohol is lost.'),
            src: 'S6.8',
            claims: [{ react: ['claisen', ['CCCC(=O)OCC'], null, 'CCCC(=O)C(CC)C(=O)OCC'] }, { name: ['CCCC(=O)OCC', t('etilbutanoatas', 'ethyl butanoate')] }]
          }
        ]
      },
      /* ============================================================ hydroxy */
      {
        id: 'u14.hydroxy',
        title: t('Hidroksi- ir oksorūgštys', 'Hydroxy and oxo acids'),
        mirrors: ['S6.18'],
        gen: genHydroxy,
        bank: [
          {
            id: 'u14.hydroxy.1',
            q: [{ p: t('Pieno rūgštis stipriai kaitinama.', 'Lactic acid is heated strongly.') }, { mol: { smi: 'CC(O)C(=O)O', name: t('2-hidroksipropano rūgštis', '2-hydroxypropanoic acid') } }],
            steps: [
              cho(t('Kas susidaro?', 'What forms?'), [mo('CC1OC(=O)C(C)OC1=O'), mo('CC1OC1=O'), mo('C=CC(=O)O'), mo('CC(O)C(=O)OC(C)C(=O)O')], 0,
                t('Hidroksirūgšties OH ir COOH yra per arti vienoje molekulėje. Kas gali įvykti tarp dviejų molekulių?', 'The OH and COOH of this acid are too close together within one molecule. What can happen between two molecules?'),
                t('Dvi molekulės reaguoja viena su kita: kiekviena OH esterinasi su kitos COOH, atsiskiria 2 $H2O$ ir susidaro šešių narių ciklinis diesteris – laktidas.', 'Two molecules react with each other: each OH esterifies the other\'s COOH, 2 $H2O$ are lost and a six-membered cyclic diester, the lactide, forms.'))
            ],
            why: t('α-Hidroksirūgšties vidumolekulinis esterinimas duotų trijų narių žiedą, kuris neegzistuoja, todėl reaguoja dvi molekulės ir gaunamas laktidas.', 'Intramolecular esterification of an α-hydroxy acid would give a three-membered ring, which does not form, so two molecules react and a lactide results.'),
            src: 'T p93',
            claims: [{ formula: ['CC1OC(=O)C(C)OC1=O', 'C6H8O4'] }]
          },
          {
            id: 'u14.hydroxy.2',
            q: [{ p: t('3-hidroksibutano rūgštis kaitinama.', '3-hydroxybutanoic acid is heated.') }, { mol: { smi: 'CC(O)CC(=O)O', name: t('3-hidroksibutano rūgštis', '3-hydroxybutanoic acid') } }],
            steps: [
              cho(t('Koks produktas?', 'What is the product?'), [mo('CC=CC(=O)O'), mo('C=CCC(=O)O'), mo('CC1CC(=O)O1'), mo('CC(=O)CC(=O)O')], 0,
                t('Vyksta vidumolekulinė dehidratacija: koks junginys susidaro netekus vandens iš β-hidroksirūgšties?', 'Intramolecular dehydration takes place: what forms when a β-hydroxy acid loses water?'),
                t('β-Hidroksirūgštys dehidratuojasi į α,β-nesočiąsias rūgštis: OH išeina, o vandenilis atsiskiria nuo α-anglies, ir dvigubasis ryšys konjuguojasi su karbonilu.', 'β-Hydroxy acids dehydrate to α,β-unsaturated acids: OH leaves and a hydrogen is lost from the α-carbon, and the double bond conjugates with the carbonyl.'))
            ],
            why: t('β-Hidroksirūgštys ciklinio esterio nesudaro (keturių narių žiedas įtemptas), todėl dehidratuojasi į nesočiąją rūgštį; tai atvirkštinė β-oksidacijos hidratacijos stadija.', 'β-Hydroxy acids do not form a cyclic ester (a four-membered ring is strained), so they dehydrate to the unsaturated acid; this is the reverse of the hydration stage of β-oxidation.'),
            src: 'T p92, p93',
            claims: [{ formula: ['CC=CC(=O)O', 'C4H6O2'] }]
          },
          {
            id: 'u14.hydroxy.3',
            q: [{ p: t('Keturios hidroksirūgštys rūgščioje terpėje.', 'Four hydroxy acids in acidic solution.') }],
            steps: [
              cho(t('Kuri iš jų lengviausiai sudaro laktoną?', 'Which one forms a lactone most readily?'), [mo('OCCCC(=O)O'), mo('OCC(=O)O'), mo('OCCC(=O)O'), mo('OCCCCCCC(=O)O')], 0,
                t('Suskaičiuokite žiedo narius, įskaitant esterio deguonį.', 'Count the ring members, including the ester oxygen.'),
                t('4-Hidroksibutano rūgštis duoda penkių narių laktoną. 2- ir 3-hidroksi rūgštys duotų 3 ir 4 narių, o 7-hidroksi – 8 narių žiedus.', '4-Hydroxybutanoic acid gives a five-membered lactone. The 2- and 3-hydroxy acids would give 3- and 4-membered rings, the 7-hydroxy acid an 8-membered ring.')),
              { prompt: t('Kiek narių turi žiedas?', 'How many members does the ring have?'), kind: 'number', answer: { value: 5, tol: 0 },
                hint: t('Į žiedą įeina ir deguonis.', 'The oxygen is part of the ring.'),
                solution: t('Du CH₂ ir CH₂O, karbonilo anglis ir esterio deguonis: iš viso 5 žiedo atomai.', 'Three CH₂-type carbons plus the carbonyl carbon and the ester oxygen: five ring atoms in all.') }
            ],
            why: t('Stabilūs tik penkių ir šešių narių žiedai, todėl laktonas lengvai susidaro iš γ- ir δ-hidroksirūgščių.', 'Only five- and six-membered rings are stable, so a lactone forms easily from γ- and δ-hydroxy acids.'),
            src: 'T p93, p94; S6.18',
            claims: [{ react: ['lactone', ['OCCCC(=O)O'], null, 'C1CC(=O)OC1'] }]
          },
          {
            id: 'u14.hydroxy.4',
            q: [{ p: t('Acetoacto (3-oksobutano) rūgštis nestabili ir kaitinama pamažu skyla.', 'Acetoacetic (3-oxobutanoic) acid is unstable and decomposes on gentle heating.') }, { mol: { smi: 'CC(=O)CC(=O)O', opts: { numbers: 'all' }, name: t('3-oksobutano rūgštis', '3-oxobutanoic acid') } }],
            steps: [
              tap(t('Bakstelėkite anglį, kuri išsiskiria kaip $CO2$.', 'Tap the carbon that is lost as $CO2$.'), { smi: 'CC(=O)CC(=O)O', opts: { numbers: 'all' } }, [4],
                t('Karboksigrupės anglis išeina kartu su abiem deguonimis.', 'The carbon of the carboxyl group leaves together with both oxygens.'),
                t('Išsiskiria karboksigrupės anglis (Nr. 5), nes jos C–C ryšio elektronai gali pereiti prie ketono deguonies.', 'The carbon of the carboxyl group (no. 5) is lost, because the electrons of its C–C bond can flow to the ketone oxygen.')),
              cho(t('Koks stabilus galutinis produktas?', 'What is the stable final product?'), [mo('CC(C)=O'), mo('CCC(=O)O'), mo('CC(=O)C(=O)O'), mo('CC=O')], 0,
                t('Pirmiausia susidaro enolis, kuris tautomerizuojasi.', 'An enol forms first and then tautomerises.'),
                t('Dekarboksilinimas duoda enolį $CH2=C(OH)CH3$, kuris tautomerizuojasi į propanoną (acetoną).', 'Decarboxylation gives the enol $CH2=C(OH)CH3$, which tautomerises to propanone (acetone).'))
            ],
            why: t('β-Oksorūgštys dekarboksilinasi lengvai, nes ketono deguonis priima elektronus per šešių narių ciklinę pereinamąją būseną; paprastos rūgštys tai daro tik stipriai kaitinamos.', 'β-Oxo acids decarboxylate readily because the ketone oxygen accepts electrons through a six-membered cyclic transition state; simple acids do so only on strong heating.'),
            src: 'Klein; T p90',
            claims: [{ name: ['CC(=O)CC(=O)O', t('3-oksobutano rūgštis', '3-oxobutanoic acid')] }]
          },
          {
            id: 'u14.hydroxy.5',
            q: [{ p: t('Piruvo rūgštis yra ketoninė ir enolinė forma pusiausvyroje.', 'Pyruvic acid exists as keto and enol forms in equilibrium.') }, { mol: { smi: 'CC(=O)C(=O)O', name: t('2-oksopropano rūgštis', '2-oxopropanoic acid') } }],
            steps: [
              cho(t('Kuri struktūra yra enolinė forma?', 'Which structure is the enol form?'), [mo('C=C(O)C(=O)O'), mo('CC(O)C(=O)O'), mo('OC(=O)CC=O'), mo('OC(=O)C=CO')], 0,
                t('Enolis yra tas pats junginys, kurio H persikėlė: $C=C$ su OH toje pačioje anglyje, kuri buvo karbonilo.', 'An enol is the same compound with an H moved: a $C=C$ with the OH on the carbon that used to be the carbonyl.'),
                t('Ketonas $CH3-CO-COOH$ virsta enoliu $CH2=C(OH)-COOH$, kai vandenilis pasislenka nuo metilo prie karbonilo deguonies.', 'The ketone $CH3-CO-COOH$ becomes the enol $CH2=C(OH)-COOH$ when a hydrogen moves from the methyl group to the carbonyl oxygen.'))
            ],
            why: t('Ketoninė ir enolinė formos yra tautomerai: skiriasi vandenilio ir dvigubojo ryšio vieta. Fosfoenolpiruvatas yra enolio esteris su fosforo rūgštimi.', 'The keto and enol forms are tautomers: they differ in the position of a hydrogen and a double bond. Phosphoenolpyruvate is the ester of the enol with phosphoric acid.'),
            src: 'T p94',
            claims: [{ formula: ['C=C(O)C(=O)O', 'C3H4O3'] }]
          },
          {
            id: 'u14.hydroxy.6',
            q: [{ p: t('Citrinų rūgštis (Krebso ciklo narė) apdorojama $CrO3/H3O+$.', 'Citric acid (a member of the Krebs cycle) is treated with $CrO3/H3O+$.') }, { mol: { smi: 'OC(=O)CC(O)(CC(=O)O)C(=O)O' } }],
            steps: [
              cho(t('Ar oksiduojasi hidroksigrupė?', 'Is the hydroxy group oxidised?'), [
                tx('Ne: tai tretinis alkoholis, jo karbinolinė anglis neturi H.', 'No: it is a tertiary alcohol and its carbinol carbon has no H.'),
                tx('Taip, susidaro ketonas.', 'Yes, a ketone forms.'),
                tx('Taip, susidaro aldehidas.', 'Yes, an aldehyde forms.'),
                tx('Taip, hidroksigrupė virsta karboksigrupe.', 'Yes, the hydroxy group becomes a carboxyl group.')
              ], 0,
              t('Kiek vandenilių turi anglis, prie kurios prisijungusi OH?', 'How many hydrogens does the carbon bearing the OH have?'),
              t('Alkoholio oksidacija reikalauja H prie C–OH anglies. Tretiniame alkoholyje jo nėra, todėl $CrO3$ jo neoksiduoja.', 'Oxidising an alcohol requires an H on the C–OH carbon. A tertiary alcohol has none, so $CrO3$ does not oxidise it.'))
            ],
            why: t('Oksidacijos galimybė priklauso nuo alkoholio klasės: pirminis ir antrinis oksiduojasi, tretinis – ne. Citrinų rūgštis turi tretinį alkoholį.', 'Whether oxidation occurs depends on the class of the alcohol: primary and secondary alcohols oxidise, tertiary ones do not. Citric acid has a tertiary alcohol.'),
            src: 'Klein; L11',
            claims: [{ carbon: ['OC(=O)CC(O)(CC(=O)O)C(=O)O', 4, 3] }]
          },
          {
            id: 'u14.hydroxy.7',
            q: [{ p: t('Obuolių ir vyno rūgštys.', 'Malic and tartaric acids.') }, { mol: [{ smi: 'OC(=O)CC(O)C(=O)O', opts: { numbers: 'all' }, name: t('2-hidroksibutano dirūgštis', '2-hydroxybutanedioic acid') }, { smi: 'OC(=O)C(O)C(O)C(=O)O', name: t('2,3-dihidroksibutano dirūgštis', '2,3-dihydroxybutanedioic acid') }] }],
            steps: [
              { prompt: t('Bakstelėkite obuolių rūgšties chiralinį centrą.', 'Tap the chiral centre of malic acid.'), kind: 'atoms', mol: { smi: 'OC(=O)CC(O)C(=O)O', opts: { numbers: 'all' } }, from: 'stereocentres',
                hint: t('Ieškokite atomo su keturiais skirtingais pakaitais.', 'Look for the atom with four different substituents.'),
                solution: t('Chiralinis centras yra anglis su OH: ji turi H, OH, CH₂COOH ir COOH.', 'The chiral centre is the carbon with the OH: it bears H, OH, CH₂COOH and COOH.') },
              { prompt: t('Kiek stereoizomerų turi vyno rūgštis?', 'How many stereoisomers does tartaric acid have?'), kind: 'number', answer: { value: 3, tol: 0 },
                hint: t('Du vienodai pakeisti chiraliniai centrai: viena iš kombinacijų yra mezoforma.', 'Two identically substituted chiral centres: one combination is a meso form.'),
                solution: t('Du enantiomerai (R,R ir S,S) ir mezo (R,S) forma: iš viso 3.', 'Two enantiomers (R,R and S,S) and the meso (R,S) form: 3 in all.') }
            ],
            why: t('Daugelis biologiškai svarbių hidroksirūgščių yra chiralinės. Vyno rūgšties du centrai vienodi, todėl yra mezoforma ir stereoizomerų mažiau nei 4.', 'Many biologically important hydroxy acids are chiral. The two centres of tartaric acid are identical, so a meso form exists and there are fewer than 4 stereoisomers.'),
            src: 'T p92; L5',
            claims: [{ stereoisomers: ['OC(=O)C(O)C(O)C(=O)O', 3] }, { centres: ['OC(=O)CC(O)C(=O)O', [4]] }]
          },
          {
            id: 'u14.hydroxy.8',
            q: [{ p: t('Sudėkite rūgščių pavadinimus su jų struktūromis.', 'Match the names of the acids with their structures.') }],
            steps: [{
              prompt: t('Sudėkite poras.', 'Make the pairs.'), kind: 'match',
              answer: {
                left: [tx('pieno rūgštis', 'lactic acid'), tx('obuolių rūgštis', 'malic acid'), tx('piruvo rūgštis', 'pyruvic acid'), tx('acetoacto rūgštis', 'acetoacetic acid'), tx('citrinų rūgštis', 'citric acid')],
                right: [mo('CC(O)C(=O)O'), mo('OC(=O)CC(O)C(=O)O'), mo('CC(=O)C(=O)O'), mo('CC(=O)CC(=O)O'), mo('OC(=O)CC(O)(CC(=O)O)C(=O)O')],
                pairs: [0, 1, 2, 3, 4]
              },
              hint: t('Atskirkite hidroksirūgštis (OH) nuo oksorūgščių ($C=O$) ir suskaičiuokite COOH grupes.', 'Separate the hydroxy acids (OH) from the oxo acids ($C=O$) and count the COOH groups.'),
              solution: t('Pieno ir obuolių rūgštys yra hidroksirūgštys (obuolių – dirūgštis), piruvo ir acetoacto – oksorūgštys (α ir β), citrinų – hidroksitrikarboksirūgštis.', 'Lactic and malic acids are hydroxy acids (malic is a diacid), pyruvic and acetoacetic are oxo acids (α and β), citric acid is a hydroxy tricarboxylic acid.')
            }],
            why: t('Pavadinimas rodo funkcines grupes: hidroksi- (OH), okso- ($C=O$) ir rūgšties grupių skaičių.', 'The name tells the functional groups: hydroxy- (OH), oxo- ($C=O$) and the number of acid groups.'),
            src: 'T p92, p94'
          }
        ]
      },
      /* ============================================================ chain */
      {
        id: 'u14.chain',
        title: t('Reakcijų schemos: užpildykite A–E', 'Reaction schemes: fill in A to E'),
        mirrors: ['S6.16', 'S6.17'],
        bank: [
          {
            id: 'u14.chain.1',
            q: [{ p: t('Pabaikite reakciją, pavadinkite produktą ir nurodykite jo klasę.', 'Complete the reaction, name the product and give its class.') }, { scheme: { items: [{ smi: 'CCCC(=O)Cl', name: t('butanoilchloridas', 'butanoyl chloride') }, { plus: true }, { smi: 'CCCC(=O)[O-].[Na+]', name: t('natrio butanoatas', 'sodium butanoate') }, { arrow: '→' }] } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'CCCC(=O)OC(=O)CCC', ['CCCC(=O)OCCC', 'CCCC(=O)O', 'CCCC(=O)CCC'],
                t('Karboksilatas yra nukleofilas, o chloridas – acilo donoras.', 'The carboxylate is the nucleophile and the chloride is the acyl donor.'),
                t('Karboksilatas puola chlorido karbonilą, išeina $Cl-$: susidaro anhidridas (natrio chloridas – šalutinis produktas).', 'The carboxylate attacks the chloride carbonyl and $Cl-$ leaves: the anhydride forms (sodium chloride is the by-product).')),
              cho(t('Kokiai klasei priklauso produktas?', 'Which class does the product belong to?'), [tx('anhidridas', 'anhydride'), tx('esteris', 'ester'), tx('amidas', 'amide'), tx('rūgšties chloridas', 'acyl chloride')], 0,
                t('Pažiūrėkite, kas sujungia dvi acilo grupes.', 'Look at what links the two acyl groups.'), t('Du acilai, sujungti vienu deguonimi ($RCO-O-COR$), yra anhidridas.', 'Two acyl groups joined by one oxygen ($RCO-O-COR$) make an anhydride.')),
              { prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: 'CCCC(=O)OC(=O)CCC' }, answer: { smi: 'CCCC(=O)OC(=O)CCC' }, hint: t('Simetrinis anhidridas vadinamas pagal rūgštį.', 'A symmetrical anhydride is named after the acid.'), solution: t('butano rūgšties anhidridas', 'butanoic anhydride') }
            ],
            why: t('Chloridas yra aktyvintas darinys, todėl net silpnas nukleofilas – karboksilatas – jį pakeičia, ir susidaro anhidridas.', 'The chloride is an activated derivative, so even a weak nucleophile, a carboxylate, replaces the chlorine and an anhydride results.'),
            src: 'S6.16; T p89',
            claims: [{ name: ['CCCC(=O)OC(=O)CCC', t('butano rūgšties anhidridas', 'butanoic anhydride')] }, { formula: ['CCCC(=O)OC(=O)CCC', 'C8H14O3'] }]
          },
          {
            id: 'u14.chain.2',
            q: [{ p: t('Pabaikite reakciją, pavadinkite produktą ir nurodykite jo klasę.', 'Complete the reaction, name the product and give its class.') }, { scheme: { items: [{ smi: 'CCC(=O)O', name: t('propano rūgštis', 'propanoic acid') }, { arrow: '⇌', above: f('CH3OH, H+') }] } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'CCC(=O)OC', ['CC(=O)OCC', 'CCC(=O)OC(=O)CC', 'COCCC'],
                t('Kas išeina kaip vanduo?', 'What leaves as water?'),
                t('Esterinimas: OH atsiskiria nuo rūgšties, o H – nuo alkoholio; susidaro metilpropanoatas ir vanduo.', 'Esterification: OH leaves the acid and H leaves the alcohol; methyl propanoate and water form.')),
              cho(t('Kokiai klasei priklauso produktas?', 'Which class does the product belong to?'), [tx('esteris', 'ester'), tx('anhidridas', 'anhydride'), tx('eteris', 'ether'), tx('amidas', 'amide')], 0,
                t('Pažiūrėkite į grupę prie karbonilo anglies.', 'Look at the group on the carbonyl carbon.'), t('$R-CO-OR′$ yra esteris; eteris neturėtų karbonilo.', '$R-CO-OR′$ is an ester; an ether would have no carbonyl.')),
              { prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: 'CCC(=O)OC' }, answer: { smi: 'CCC(=O)OC' }, hint: t('Pirma alkilo grupė, po to rūgšties dalis su galūne -oatas.', 'First the alkyl group, then the acid part ending in -oate.'), solution: t('metilpropanoatas', 'methyl propanoate') }
            ],
            why: t('Rūgštinės katalizės sąlygomis rūgštis ir alkoholis sudaro esterį; reakcija grįžtamoji, todėl rodoma dviguba rodyklė.', 'Under acid catalysis an acid and an alcohol form an ester; the reaction is reversible, which is why a double arrow is drawn.'),
            src: 'S6.16; T p89',
            claims: [{ react: ['acid.ester', ['CCC(=O)O', 'CO'], null, 'CCC(=O)OC'] }]
          },
          {
            id: 'u14.chain.3',
            q: [{ p: t('Pabaikite reakciją, pavadinkite organinį produktą ir nurodykite jo klasę.', 'Complete the reaction, name the organic product and give its class.') }, { scheme: { items: [{ smi: 'CCCCC(N)=O', name: t('pentanamidas', 'pentanamide') }, { arrow: '→', above: f('H2O, H+, t°') }] } }],
            steps: [
              prod(t('Koks organinis produktas?', 'What is the organic product?'), 'CCCCC(=O)O', ['CCCCC#N', 'CCCCCN', 'CCCCC(=O)Cl'],
                t('Kuri grupė pakeičia NH₂ rūgštinėje hidrolizėje?', 'Which group replaces the NH₂ in acid hydrolysis?'),
                t('Amido NH₂ pakeičiamas OH; azotas išsiskiria kaip $NH4+$. Amidai hidrolizuojami iki rūgšties.', 'The NH₂ of the amide is replaced by OH; nitrogen is released as $NH4+$. Amides hydrolyse to the acid.')),
              cho(t('Kokiai klasei priklauso produktas?', 'Which class does the product belong to?'), [tx('karboksirūgštis', 'carboxylic acid'), tx('esteris', 'ester'), tx('aminas', 'amine'), tx('nitrilas', 'nitrile')], 0,
                t('Pažiūrėkite, kokia grupė prisijungusi prie karbonilo.', 'See which group is bonded to the carbonyl.'), t('$-COOH$ grupė reiškia karboksirūgštį.', 'A $-COOH$ group means a carboxylic acid.')),
              { prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: 'CCCCC(=O)O' }, answer: { smi: 'CCCCC(=O)O' }, hint: t('Penkių anglies atomų grandinė su karboksigrupe.', 'A five-carbon chain with a carboxyl group.'), solution: t('pentano rūgštis', 'pentanoic acid') }
            ],
            why: t('Visų acilo darinių, taip pat amidų, hidrolizės produktas yra karboksirūgštis; amidams hidrolizuoti reikia kaitinimo.', 'The hydrolysis product of every acyl derivative, amides included, is the carboxylic acid; amides need heating to hydrolyse.'),
            src: 'S6.16; T p87, p89',
            claims: [{ name: ['CCCCC(N)=O', t('pentanamidas', 'pentanamide')] }]
          },
          {
            id: 'u14.chain.4',
            q: [{ p: t('Pabaikite reakciją ir pavadinkite organinį produktą.', 'Complete the reaction and name the organic product.') }, { scheme: { items: [{ smi: 'CCC(C)C(Cl)=O', name: t('2-metilbutanoilchloridas', '2-methylbutanoyl chloride') }, { plus: true }, { smi: 'N' }, { arrow: '→', above: t('2 ekv.', '2 equiv.') }] } }],
            steps: [
              prod(t('Koks organinis produktas?', 'What is the organic product?'), 'CCC(C)C(N)=O', ['CCC(C)C(=O)[O-].[NH4+]', 'CCC(C)C(=O)O', 'CCC(C)C#N'],
                t('Kas pakeičia chlorą?', 'What replaces the chlorine?'),
                t('Amoniakas pakeičia $Cl-$ ir susidaro amidas.', 'Ammonia replaces $Cl-$ and an amide forms.')),
              cho(t('Kodėl reikia dviejų ekvivalentų amoniako?', 'Why are two equivalents of ammonia needed?'), [
                tx('Antras ekvivalentas suriša išsiskyrusį HCl.', 'The second equivalent binds the HCl that is released.'),
                tx('Antras ekvivalentas prisijungia prie karbonilo ir sudaro dvigubą amidą.', 'The second equivalent adds to the carbonyl and gives a double amide.'),
                tx('Antras ekvivalentas veikia kaip rūgštinis katalizatorius.', 'The second equivalent acts as an acid catalyst.'),
                tx('Pirmas ekvivalentas visiškai sunaudojamas hidrolizei.', 'The first equivalent is used up completely in hydrolysis.')
              ], 0, t('Kas išsiskiria kartu su amidu?', 'What is released together with the amide?'), t('HCl protonuotų amoniaką; todėl pusė jo virsta $NH4+$ ir negali reaguoti.', 'HCl would protonate ammonia; half of it turns into $NH4+$ and cannot react.'))
            ],
            why: t('Rūgšties chlorido ir amoniako (ar amino) reakcijoje išsiskiria HCl, kurį suriša antras bazės ekvivalentas.', 'In the reaction of an acyl chloride with ammonia (or an amine) HCl is released and is taken up by a second equivalent of the base.'),
            src: 'S6.16; S6.7',
            claims: [{ react: ['acyl.nu', ['CCC(C)C(Cl)=O', 'N'], { nu: 'ammonia' }, 'CCC(C)C(N)=O'] }]
          },
          {
            id: 'u14.chain.5',
            q: [{ p: t('2-butanolis (A) reaguoja pagal schemą: A → B (konc. $H2SO4$, t°) → C ($CrO3$, $H3O+$, t°) → D ($P2O5$, t°) → E + C ($NH3$). Užpildykite junginius B–E.', 'Butan-2-ol (A) reacts according to the scheme: A → B (conc. $H2SO4$, t°) → C ($CrO3$, $H3O+$, t°) → D ($P2O5$, t°) → E + C ($NH3$). Identify the compounds B to E.') }, { mol: { smi: 'CCC(C)O', name: t('2-butanolis', 'butan-2-ol') } }],
            steps: [
              prod(t('B yra:', 'B is:'), 'CC=CC', ['C=CCC', 'CC(=O)CC', 'CCCC'],
                t('Koncentruota $H2SO4$ ir kaitinimas dehidratuoja alkoholį; kurį alkeną pirmenybę teikia Zaicevo taisyklė?', 'Concentrated $H2SO4$ and heat dehydrate the alcohol; which alkene does Zaitsev\'s rule favour?'),
                t('Dehidratacija duoda labiau pakeistą alkeną: 2-butenas (Zaicevo taisyklė), o ne 1-butenas.', 'Dehydration gives the more substituted alkene: but-2-ene (Zaitsev\'s rule), not but-1-ene.')),
              prod(t('C yra:', 'C is:'), 'CC(=O)O', ['CCC(=O)O', 'CC(=O)CC', 'CC=O'],
                t('Pažiūrėkite, kas vėliau vyksta su C: $P2O5$ ir $NH3$ ima tik rūgšties darinius.', 'Look at what later happens to C: $P2O5$ and $NH3$ act on acid derivatives only.'),
                t('Iš tolesnių stadijų matyti, kad C yra karboksirūgštis ($P2O5$ atskiria vandenį nuo dviejų rūgšties molekulių, o $D + NH3$ duoda $E + C$). Taigi šioje seminaro schemoje C laikoma etano rūgštimi (2-buteno oksidacinis skilimas): kiekviena dvigubojo ryšio anglis virsta karboksigrupe ir iš simetriško 2-buteno gaunamos dvi etano rūgšties molekulės. ($C=C$ ryšį įprastai skaldo $KMnO4$ ar $O3$; tai ne bendra $CrO3$ savybė, čia reikia priimti schemos sąlygą.)', 'The later stages show that C is a carboxylic acid ($P2O5$ removes water from two acid molecules, and $D + NH3$ gives $E + C$). So in this seminar scheme C is taken to be ethanoic acid (oxidative cleavage of but-2-ene): each double-bond carbon becomes a carboxyl group and the symmetric but-2-ene gives two molecules of ethanoic acid. (Cleavage of $C=C$ is normally done with $KMnO4$ or $O3$; it is not a general property of $CrO3$, so the scheme\'s conditions have to be accepted here.)')),
              prod(t('D (C, $P2O5$, t°) yra:', 'D (C, $P2O5$, t°) is:'), 'CC(=O)OC(C)=O', ['CC(=O)Cl', 'CC(=O)OCC', 'CC(=O)N'],
                t('$P2O5$ atskiria vandenį nuo dviejų rūgšties molekulių.', '$P2O5$ removes water from two acid molecules.'),
                t('Dvi etano rūgšties molekulės netenka vandens: susidaro etano rūgšties anhidridas.', 'Two molecules of ethanoic acid lose water: ethanoic anhydride forms.')),
              cho(t('E ir C (D + $NH3$) yra:', 'E and C (D + $NH3$) are:'), [sc({ smi: 'CC(=O)N' }, { plus: true }, { smi: 'CC(=O)O' }), sc({ smi: 'CC(=O)N' }, { plus: true }, { smi: 'CC(=O)N' }), sc({ smi: 'CC(=O)O' }, { plus: true }, { smi: 'CC(=O)O' }), sc({ smi: 'CC#N' }, { plus: true }, { smi: 'CC(=O)O' })], 0,
                t('Amoniakas puola vieną anhidrido karbonilą, kita pusė išeina.', 'Ammonia attacks one carbonyl of the anhydride; the other half leaves.'),
                t('Anhidridas + $NH3$ → amidas (etanamidas, E) ir rūgštis (etano rūgštis, C).', 'Anhydride + $NH3$ → an amide (ethanamide, E) and an acid (ethanoic acid, C).'))
            ],
            why: t('Schema: alkoholis → alkenas (dehidratacija) → dvi rūgšties molekulės (oksidacinis skilimas, kaip priimta šioje seminaro schemoje) → anhidridas → amidas + rūgštis. Rūgštis C susidaro ir kaip tarpinis, ir kaip galutinis produktas.', 'The scheme: alcohol → alkene (dehydration) → two acid molecules (oxidative cleavage, as taken in this seminar scheme) → anhydride → amide + acid. Acid C is both an intermediate and a final product.'),
            src: 'S6.17; T p89',
            claims: [{ name: ['CC=CC', t('2-butenas', 'but-2-ene')] }, { name: ['CC(=O)OC(C)=O', t('etano rūgšties anhidridas', 'ethanoic anhydride')] }, { react: ['acyl.nu', ['CC(=O)OC(C)=O', 'N'], { nu: 'ammonia' }, 'CC(N)=O'] }]
          },
          {
            id: 'u14.chain.6',
            q: [{ p: t('1-butanolis (A) reaguoja pagal schemą: A → B ($CrO3$, $H3O+$, t°) → C ($SOCl2$) → D ($NH3$, 2 ekv.) → E ($P2O5$, t°). Užpildykite junginius B–E.', 'Butan-1-ol (A) reacts according to the scheme: A → B ($CrO3$, $H3O+$, t°) → C ($SOCl2$) → D ($NH3$, 2 equiv.) → E ($P2O5$, t°). Identify the compounds B to E.') }, { mol: { smi: 'CCCCO', name: t('1-butanolis', 'butan-1-ol') } }],
            steps: [
              prod(t('B yra:', 'B is:'), 'CCCC(=O)O', ['CCCC=O', 'CCC(=O)CC', 'CCCC(=O)OC'],
                t('Pirminis alkoholis su stipriu oksidatoriumi oksiduojasi iki pat galo.', 'A primary alcohol with a strong oxidant is oxidised all the way.'),
                t('Pirminis alkoholis oksiduojamas $CrO3/H3O+$ per aldehidą iki karboksirūgšties: butano rūgštis.', 'A primary alcohol is oxidised by $CrO3/H3O+$ through the aldehyde to the carboxylic acid: butanoic acid.')),
              prod(t('C yra:', 'C is:'), 'CCCC(=O)Cl', ['CCCCCl', 'CCCC(=O)OC(=O)CCC', 'CCC(Cl)C(=O)O'],
                t('$SOCl2$ pakeičia kurią grupę?', 'Which group does $SOCl2$ replace?'), t('$SOCl2$ pakeičia karboksigrupės OH chloru: butanoilchloridas.', '$SOCl2$ replaces the OH of the carboxyl group with chlorine: butanoyl chloride.')),
              prod(t('D yra:', 'D is:'), 'CCCC(N)=O', ['CCCC(=O)[O-].[NH4+]', 'CCCC#N', 'CCCCN'],
                t('Chloridas + 2 ekv. $NH3$ → amidas.', 'Chloride + 2 equiv. $NH3$ → an amide.'), t('Chlorido ir amoniako reakcija duoda butanamidą (NH₄Cl – šalutinis produktas).', 'The reaction of the chloride with ammonia gives butanamide ($NH4Cl$ is the by-product).')),
              prod(t('E yra:', 'E is:'), 'CCCC#N', ['CCCC(=O)O', 'CCCCN', 'CCCC=N'],
                t('$P2O5$ šildant atskiria vandenį nuo amido.', '$P2O5$ on heating removes water from the amide.'), t('Amidas dehidratuojamas iki nitrilo: butannitrilas. Nitrilą su $H2O/H+$ vėl galima hidrolizuoti iki butano rūgšties.', 'The amide is dehydrated to the nitrile: butanenitrile. The nitrile can be hydrolysed again with $H2O/H+$ to butanoic acid.'))
            ],
            why: t('Ši schema atkartoja darinių virsmų ratą: alkoholis → rūgštis → chloridas → amidas → nitrilas, o nitrilą hidrolizuojant vėl gaunama rūgštis.', 'The scheme retraces the cycle of derivatives: alcohol → acid → chloride → amide → nitrile, and hydrolysing the nitrile returns the acid.'),
            src: 'T p89; S6.17',
            claims: [{ react: ['acid.socl2', ['CCCC(=O)O'], null, 'CCCC(Cl)=O'] }, { react: ['acyl.nu', ['CCCC(Cl)=O', 'N'], { nu: 'ammonia' }, 'CCCC(N)=O'] }, { name: ['CCCC#N', t('butannitrilas', 'butanenitrile')] }]
          },
          {
            id: 'u14.chain.7',
            q: [{ p: t('Propannitrilas (A) reaguoja pagal schemą: A → B ($H2O$, $H+$, t°) → C ($SOCl2$) → D ($CH3OH$) → E ($NaOH$, $H2O$). Užpildykite junginius B–E.', 'Propanenitrile (A) reacts according to the scheme: A → B ($H2O$, $H+$, t°) → C ($SOCl2$) → D ($CH3OH$) → E ($NaOH$, $H2O$). Identify the compounds B to E.') }, { mol: { smi: 'CCC#N', name: t('propannitrilas', 'propanenitrile') } }],
            steps: [
              prod(t('B yra:', 'B is:'), 'CCC(=O)O', ['CCC(N)=O', 'CCCN', 'CCC=O'],
                t('Visų darinių hidrolizės produktas yra ta pati rūgštis.', 'The hydrolysis product of every derivative is the same acid.'), t('Nitrilas hidrolizuojamas rūgštyje iki propano rūgšties ($NH4+$ išsiskiria).', 'The nitrile is hydrolysed in acid to propanoic acid ($NH4+$ is released).')),
              prod(t('C yra:', 'C is:'), 'CCC(=O)Cl', ['CCCCl', 'CCC(=O)OC(=O)CC', 'CC(Cl)C(=O)O'],
                t('Rūgštis + $SOCl2$ → aktyvintas darinys.', 'Acid + $SOCl2$ → an activated derivative.'), t('Gaunamas propanoilchloridas.', 'Propanoyl chloride forms.')),
              prod(t('D yra:', 'D is:'), 'CCC(=O)OC', ['CCC(=O)O', 'CCC(=O)CC', 'CC(=O)OCC'],
                t('Chloridas + alkoholis.', 'Chloride + alcohol.'), t('Alkoholis pakeičia $Cl-$: metilpropanoatas.', 'The alcohol replaces $Cl-$: methyl propanoate.')),
              cho(t('E yra:', 'E is:'), [sc({ smi: 'CCC(=O)[O-].[Na+]' }, { plus: true }, { smi: 'CO' }), sc({ smi: 'CCC(=O)O' }, { plus: true }, { smi: 'CO' }), sc({ smi: 'CCC(=O)O' }, { plus: true }, { smi: 'CC[O-]' }), sc({ smi: 'CCC(=O)[O-].[Na+]' }, { plus: true }, { smi: 'CCO' })], 0,
                t('Šarminėje terpėje rūgštis egzistuoja kaip druska; alkoholis atitinka esterio alkoksigrupę.', 'In alkali the acid exists as its salt; the alcohol corresponds to the alkoxy group of the ester.'),
                t('Šarminė hidrolizė duoda natrio propanoatą ir metanolį.', 'Alkaline hydrolysis gives sodium propanoate and methanol.'))
            ],
            why: t('Čia pereinama nuo nitrilo „aukštyn“ iki aktyvinto darinio, o paskui „žemyn“ į esterį ir druską: kiekvienas žingsnis pasirenkamas pagal reaktingumo eilę.', 'Here the route goes "up" from the nitrile to an activated derivative and then "down" to the ester and the salt: each step is chosen by the reactivity order.'),
            src: 'T p89; S6.16',
            claims: [{ react: ['nitrile.hydrolysis', ['CCC#N'], null, 'CCC(=O)O'] }, { react: ['acyl.nu', ['CCC(=O)Cl', 'CO'], { nu: 'alcohol' }, 'CCC(=O)OC'] }, { react: ['ester.hydrolysis', ['CCC(=O)OC'], { medium: 'base' }, 'CCC(=O)[O-].[Na+]'] }]
          },
          {
            id: 'u14.chain.8',
            q: [{ p: t('Butano rūgštis (A) reaguoja pagal schemą: A → B ($NaOH$) → C ($CH3CH2CH2COCl$) → D + E ($NH3$). Užpildykite junginius B–E.', 'Butanoic acid (A) reacts according to the scheme: A → B ($NaOH$) → C ($CH3CH2CH2COCl$) → D + E ($NH3$). Identify the compounds B to E.') }, { mol: { smi: 'CCCC(=O)O', name: t('butano rūgštis', 'butanoic acid') } }],
            steps: [
              prod(t('B yra:', 'B is:'), 'CCCC(=O)[O-].[Na+]', ['CCC[CH2-].[Na+]', 'CCCC[O-].[Na+]', 'CCCC(=O)Cl'],
                t('Rūgštis + šarmas.', 'Acid + alkali.'), t('Rūgštis neutralizuojama: susidaro natrio butanoatas.', 'The acid is neutralised: sodium butanoate forms.')),
              prod(t('C yra:', 'C is:'), 'CCCC(=O)OC(=O)CCC', ['CCCC(=O)OCCC', 'CCCC(=O)O', 'CCCC(=O)CCC'],
                t('Karboksilatas puola chloridą.', 'The carboxylate attacks the chloride.'), t('Karboksilatas pakeičia $Cl-$: susidaro butano rūgšties anhidridas.', 'The carboxylate replaces $Cl-$ and butanoic anhydride forms.')),
              cho(t('D ir E yra:', 'D and E are:'), [sc({ smi: 'CCCC(N)=O' }, { plus: true }, { smi: 'CCCC(=O)O' }), sc({ smi: 'CCCC(N)=O' }, { plus: true }, { smi: 'CCCC(N)=O' }), sc({ smi: 'CCCC(=O)O' }, { plus: true }, { smi: 'CCCC(=O)O' }), sc({ smi: 'CCCC#N' }, { plus: true }, { smi: 'CCCC(=O)O' })], 0,
                t('Viena anhidrido pusė lieka amide, kita išeina.', 'One half of the anhydride stays in the amide and the other half leaves.'),
                t('Amoniakas pakeičia vieną acilo dalį: susidaro butanamidas ir butano rūgštis.', 'Ammonia replaces one acyl part: butanamide and butanoic acid form.'))
            ],
            why: t('Anhidridas yra reaktingas darinys: su amoniaku jis duoda amidą ir rūgštį, o iš vienos molekulės „dingsta“ pusė acilo.', 'An anhydride is a reactive derivative: with ammonia it gives an amide and an acid, and half of the acyl units end up as the leaving group.'),
            src: 'T p89; S6.16',
            claims: [{ react: ['acid.salt', ['CCCC(=O)O'], { metal: 'Na' }, 'CCCC(=O)[O-].[Na+]'] }, { react: ['acyl.nu', ['CCCC(=O)OC(=O)CCC', 'N'], { nu: 'ammonia' }, 'CCCC(N)=O'] }]
          }
        ]
      },
      /* ============================================================ reagents */
      {
        id: 'u14.reagents',
        title: t('Reagentai su keliomis funkcinėmis grupėmis', 'Reagents and molecules with several groups'),
        mirrors: ['S6.21'],
        bank: [
          {
            id: 'u14.reagents.1',
            q: [{ p: t('Šis junginys yra litocholio rūgšties modelis: antrinis alkoholis žiede ir karboksirūgštis šoninėje grandinėje. Jį veikia $LiAlH4$, po to $H3O+$.', 'This compound is a model of lithocholic acid: a secondary alcohol in a ring and a carboxylic acid in a side chain. It is treated with $LiAlH4$ and then $H3O+$.') }, { mol: { smi: 'OC1CCC(CC1)CCC(=O)O', name: t('3-(4-hidroksicikloheksil)propano rūgštis', '3-(4-hydroxycyclohexyl)propanoic acid') } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'OC1CCC(CC1)CCCO', ['OC1CCC(CC1)CCC=O', 'O=C1CCC(CC1)CCC(=O)O', 'OC1CCC(CC1)CCC(=O)OC'],
                t('$LiAlH4$ redukuoja karboksigrupę. Kuri grupė lieka nepaliesta?', '$LiAlH4$ reduces the carboxyl group. Which group is left alone?'),
                t('Karboksigrupė redukuojama iki pirminio alkoholio ($-CH2OH$); žiedo $OH$ lieka. Aldehido neišskiriame, nes jis redukuojasi toliau.', 'The carboxyl group is reduced to a primary alcohol ($-CH2OH$); the ring $OH$ stays. The aldehyde is not isolated because it is reduced further.'))
            ],
            why: t('Ličio aliuminio hidridas redukuoja karboksirūgštis iki pirminių alkoholių, todėl gaunamas diolis.', 'Lithium aluminium hydride reduces carboxylic acids to primary alcohols, so a diol results.'),
            src: 'T p90; S6.21',
            claims: [{ name: ['OC1CCC(CC1)CCC(=O)O', t('3-(4-hidroksicikloheksil)propano rūgštis', '3-(4-hydroxycyclohexyl)propanoic acid')] }]
          },
          {
            id: 'u14.reagents.2',
            q: [{ p: t('Tas pats junginys kaitinamas su metanoliu ir $H2SO4$.', 'The same compound is heated with methanol and $H2SO4$.') }, { mol: { smi: 'OC1CCC(CC1)CCC(=O)O' } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'COC(=O)CCC1CCC(O)CC1', ['COC1CCC(CC1)CCC(=O)O', 'COC(=O)CCC1CCC(=O)CC1', 'OC1CCC(CC1)CCCO'],
                t('Esterinama karboksigrupė, o ne antrinis alkoholis.', 'The carboxyl group is esterified, not the secondary alcohol.'),
                t('Rūgštinėje terpėje su metanoliu esterinama karboksigrupė: susidaro metilo esteris. Žiedo OH, kaip ir bet kuris alkoholis, esterio nesudaro, nes nėra acilo donoro.', 'In acid with methanol the carboxyl group is esterified: the methyl ester forms. The ring OH has no acyl donor to react with, so it stays.'))
            ],
            why: t('Esterinant rūgštį alkoholiu, acilo grupę duoda rūgštis, todėl kitas molekulės alkoholis lieka nepakitęs.', 'In esterifying an acid with an alcohol, the acid supplies the acyl group, so the other alcohol group of the molecule is unchanged.'),
            src: 'T p89; S6.21',
            claims: [{ react: ['acid.ester', ['OC1CCC(CC1)CCC(=O)O', 'CO'], null, 'COC(=O)CCC1CCC(O)CC1'] }]
          },
          {
            id: 'u14.reagents.3',
            q: [{ p: t('Tas pats junginys apdorojamas vienu ekvivalentu $NaOH$.', 'The same compound is treated with one equivalent of $NaOH$.') }, { mol: { smi: 'OC1CCC(CC1)CCC(=O)O' } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'OC1CCC(CC1)CCC(=O)[O-].[Na+]', ['[O-]C1CCC(CC1)CCC(=O)O.[Na+]', '[O-]C1CCC(CC1)CCC(=O)[O-].[Na+].[Na+]', 'OC1CCC(CC1)CC'],
                t('Palyginkite rūgštingumą: kuris O–H protonas atsiskiria su hidroksidu?', 'Compare the acidity: which O–H proton does hydroxide remove?'),
                t('Karboksilo O–H (pKa apie 4,8) yra daug rūgštesnis už alkoholio (apie 16); hidroksidas deprotonuoja tik jį.', 'The O–H of the carboxyl group (pKa about 4.8) is far more acidic than that of the alcohol (about 16); hydroxide deprotonates only it.'))
            ],
            why: t('Šarmas pirmiausia deprotonuoja stipriausią rūgštį: karboksilo OH. Alkoholis lieka OH.', 'An alkali first deprotonates the strongest acid group, the carboxyl OH. The alcohol stays as OH.'),
            src: 'T p87; S6.21',
            claims: [{ react: ['acid.salt', ['OC1CCC(CC1)CCC(=O)O'], { metal: 'Na' }, 'OC1CCC(CC1)CCC(=O)[O-].[Na+]'] }]
          },
          {
            id: 'u14.reagents.4',
            q: [{ p: t('Tas pats junginys oksiduojamas $CrO3/H3O+$.', 'The same compound is oxidised with $CrO3/H3O+$.') }, { mol: { smi: 'OC1CCC(CC1)CCC(=O)O' } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'O=C1CCC(CC1)CCC(=O)O', ['O=C1CCC(CC1)CCC(=O)OC', 'OC1CCC(CC1)CC(=O)O', 'O=C1CCC(CC1)CCCO'],
                t('Kuri grupė gali būti oksiduota, o kuri jau yra aukščiausios oksidacijos būsenos?', 'Which group can be oxidised, and which is already at its highest oxidation level?'),
                t('Antrinis alkoholis oksiduojamas iki ketono, o karboksigrupė jau oksiduota ir lieka.', 'The secondary alcohol is oxidised to the ketone, while the carboxyl group is already oxidised and stays.'))
            ],
            why: t('$CrO3$ oksiduoja antrinį alkoholį iki ketono; karboksirūgštis oksiduojama toliau tik skylant anglies grandinei.', '$CrO3$ oxidises a secondary alcohol to a ketone; a carboxylic acid is not oxidised further except by cleavage of the carbon chain.'),
            src: 'S6.21; L11',
            claims: [{ formula: ['O=C1CCC(CC1)CCC(=O)O', 'C9H14O3'] }]
          },
          {
            id: 'u14.reagents.5',
            q: [{ p: t('Junginys su vienu ekvivalentu $NaOH$.', 'The compound with one equivalent of $NaOH$.') }, { mol: { smi: 'OC1CCC(CC1)CCC(=O)O', opts: { numbers: 'all' } } }],
            steps: [
              tap(t('Bakstelėkite deguonį, kuris praranda protoną.', 'Tap the oxygen that loses its proton.'), { smi: 'OC1CCC(CC1)CCC(=O)O', opts: { numbers: 'all' } }, [11],
                t('Kuri OH grupė duoda stabilesnį anijoną?', 'Which OH group gives the more stable anion?'),
                t('Karboksilo OH deguonis (Nr. 12): jo anijonas yra rezonansu stabilizuotas karboksilatas.', 'The oxygen of the carboxyl OH (no. 12): its anion is a resonance-stabilised carboxylate.')),
              cho(t('Kodėl alkoholio OH nereaguoja?', 'Why does the alcohol OH not react?'), [
                tx('Alkoksido anijonas nestabilizuotas rezonansu, todėl alkoholis daug silpnesnė rūgštis.', 'An alkoxide is not stabilised by resonance, so the alcohol is a much weaker acid.'),
                tx('Žiede OH negali atsiskirti dėl erdvinių kliūčių.', 'The OH in a ring cannot leave for steric reasons.'),
                tx('Alkoholio deguonis neturi laisvos elektronų poros.', 'The oxygen of the alcohol has no lone pair.'),
                tx('Šarmas reaguoja tik su ketonais.', 'Alkali reacts only with ketones.')
              ], 0, t('Palyginkite abu anijonus.', 'Compare the two anions.'), t('Rūgštingumą lemia anijono stabilumas: karboksilatas (rezonansas) ≫ alkoksidas.', 'Acidity follows the stability of the anion: carboxylate (resonance) ≫ alkoxide.'))
            ],
            why: t('Su bazės ekvivalentu reaguoja stipriausia rūgštinė grupė.', 'With one equivalent of base the strongest acidic group reacts.'),
            src: 'S6.21; T p87'
          },
          {
            id: 'u14.reagents.6',
            q: [{ p: t('Esteris redukuojamas $LiAlH4$, po to $H3O+$.', 'An ester is reduced with $LiAlH4$ and then $H3O+$.') }, { scheme: { items: [{ smi: 'CCCC(=O)OCC', name: t('etilbutanoatas', 'ethyl butanoate') }, { arrow: '→', above: f('1. LiAlH4'), below: f('2. H3O+') }] } }],
            steps: [
              cho(t('Kokie produktai susidaro?', 'Which products form?'), [sc({ smi: 'CCCCO' }, { plus: true }, { smi: 'CCO' }), sc({ smi: 'CCCC=O' }, { plus: true }, { smi: 'CCO' }), sc({ smi: 'CCCC(=O)O' }, { plus: true }, { smi: 'CCO' }), sc({ smi: 'CCCCO' }, { plus: true }, { smi: 'CC=O' })], 0,
                t('Esteris turi dvi dalis: acilo ir alkoksi.', 'The ester has two parts: the acyl part and the alkoxy part.'),
                t('Acilo dalis redukuojama iki pirminio alkoholio (1-butanolio), o alkoksigrupė išlieka kaip alkoholis (etanolis): iš viso du alkoholiai.', 'The acyl part is reduced to a primary alcohol (butan-1-ol) and the alkoxy group is released as an alcohol (ethanol): two alcohols in all.'))
            ],
            why: t('Esterio redukcija $LiAlH4$ visada duoda du alkoholius.', 'Reduction of an ester with $LiAlH4$ always gives two alcohols.'),
            src: 'T p90',
            claims: [{ name: ['CCCC(=O)OCC', t('etilbutanoatas', 'ethyl butanoate')] }]
          },
          {
            id: 'u14.reagents.7',
            q: [{ p: t('Norima gauti keto rūgštį, nepaveikiant karboksigrupės.', 'The aim is the keto acid, without touching the carboxyl group.') }, { scheme: { items: [{ smi: 'OC1CCC(CC1)CCC(=O)O' }, { arrow: '→', above: f('?') }, { smi: 'O=C1CCC(CC1)CCC(=O)O' }] } }],
            steps: [
              cho(t('Kuris reagentas tinka?', 'Which reagent works?'), [tx('$CrO3$, $H3O+$', '$CrO3$, $H3O+$'), tx('1. $LiAlH4$ 2. $H3O+$', '1. $LiAlH4$ 2. $H3O+$'), tx('$NaBH4$', '$NaBH4$'), tx('$H2$, $Pd$', '$H2$, $Pd$'), tx('$CH3OH$, $H+$', '$CH3OH$, $H+$')], 0,
                t('Kokia redokso kryptimi keičiasi alkoholio anglis?', 'In which redox direction does the alcohol carbon change?'), t('Tik $CrO3$ yra oksidatorius: jis OH paverčia $C=O$. $LiAlH4$, $NaBH4$ ir $H2/Pd$ yra reduktoriai, $CH3OH/H+$ esterina.', 'Only $CrO3$ is an oxidant: it turns OH into $C=O$. $LiAlH4$, $NaBH4$ and $H2/Pd$ are reductants, and $CH3OH/H+$ esterifies.'))
            ],
            why: t('Reagentą parenka transformacijos tipas: oksidacija – $CrO3$, redukcija – hidridas, esterinimas – alkoholis su H+, neutralizacija – šarmas.', 'The type of change picks the reagent: oxidation with $CrO3$, reduction with a hydride, esterification with an alcohol and H+, neutralisation with an alkali.'),
            src: 'S6.21'
          },
          {
            id: 'u14.reagents.8',
            q: [{ p: t('Heksano dirūgštis kaitinama su dideliu metanolio pertekliumi ir $H2SO4$.', 'Hexanedioic acid is heated with a large excess of methanol and $H2SO4$.') }, { mol: { smi: 'OC(=O)CCCCC(=O)O', name: t('heksano dirūgštis', 'hexanedioic acid') } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'COC(=O)CCCCC(=O)OC', ['COC(=O)CCCCC(=O)O', 'OCCCCCCO', 'COCCCCCCOC'],
                t('Abi karboksigrupės esterinamos; pertekliaus alkoholio pakanka.', 'Both carboxyl groups can be esterified; the excess of alcohol allows it.'),
                t('Kiekviena karboksigrupė esterinama atskirai, o alkoholio perteklius pastumia pusiausvyrą: susidaro dimetilo diesteris.', 'Each carboxyl group esterifies independently, and the excess of alcohol drives the equilibrium: the dimethyl diester forms.'))
            ],
            why: t('Esterinimo pusiausvyrą į produktą stumia alkoholio perteklius; abi karboksigrupės reaguoja nepriklausomai.', 'An excess of alcohol drives esterification to the products; both carboxyl groups react independently.'),
            src: 'T p89',
            claims: [{ react: ['acid.ester', ['OC(=O)CCCCC(=O)O', 'CO'], null, 'COC(=O)CCCCC(=O)OC'] }, { name: ['OC(=O)CCCCC(=O)O', t('heksano dirūgštis', 'hexanedioic acid')] }]
          },
          {
            id: 'u14.reagents.9',
            q: [{ p: t('Litocholio rūgštis yra tulžies rūgštis: ji turi antrinį alkoholį žiede (3-oje padėtyje) ir karboksirūgštį šoninėje grandinėje. Ją veikia keturi reagentai, kiekvienas atskirai.', 'Lithocholic acid is a bile acid with a secondary alcohol in the ring (position 3) and a carboxylic acid in the side chain. It is treated with four reagents, each separately.') }, { mol: { smi: ster('C(=O)O', 'C(O)') } }],
            steps: [
              prod(t('Su $LiAlH4$, po to $H3O+$, gaunama:', 'With $LiAlH4$ and then $H3O+$ the product is:'), ster('CO', 'C(O)'), [ster('C=O', 'C(O)'), ster('CO', 'C(=O)'), ster('C(=O)OC', 'C(O)')],
                t('Kuri grupė redukuojama, o kuri jau yra alkoholis?', 'Which group is reduced, and which is already an alcohol?'),
                t('Karboksigrupė redukuojama iki pirminio alkoholio ($-CH2OH$), o antrinis $OH$ lieka: gaunamas diolis.', 'The carboxyl group is reduced to a primary alcohol ($-CH2OH$) and the secondary $OH$ stays: a diol results.')),
              prod(t('Su $CH3OH$, $H+$ gaunama:', 'With $CH3OH$, $H+$ the product is:'), ster('C(=O)OC', 'C(O)'), [ster('C(=O)O', 'C(OC)'), ster('C(=O)OC', 'C(=O)'), ster('CO', 'C(O)')],
                t('Kuri grupė yra acilo donoras?', 'Which group is the acyl donor?'),
                t('Esterinama karboksigrupė: susidaro metilo esteris, o 3-OH lieka.', 'The carboxyl group is esterified: the methyl ester forms and the 3-OH stays.')),
              prod(t('Su $NaOH$ gaunama:', 'With $NaOH$ the product is:'), ster('C(=O)[O-]', 'C(O)') + '.[Na+]', [ster('C(=O)[O-]', 'C([O-])') + '.[Na+].[Na+]', ster('C(=O)O', 'C([O-])') + '.[Na+]', ster('C(=O)OC', 'C(O)')],
                t('Kuris O–H protonas rūgštesnis?', 'Which O–H proton is more acidic?'),
                t('Hidroksidas deprotonuoja tik karboksigrupę: susidaro natrio karboksilatas, o alkoholio OH lieka.', 'Hydroxide deprotonates only the carboxyl group: the sodium carboxylate forms and the alcohol OH stays.')),
              prod(t('Su $CrO3$, $H3O+$ gaunama:', 'With $CrO3$, $H3O+$ the product is:'), ster('C(=O)O', 'C(=O)'), [ster('C(=O)O', 'C(O)'), ster('CO', 'C(=O)'), ster('C=O', 'C(=O)')],
                t('Kuri grupė gali būti oksiduota, o kuri jau yra aukščiausios oksidacijos būsenos?', 'Which group can be oxidised, and which is already at its highest oxidation level?'),
                t('Antrinis alkoholis oksiduojamas iki ketono, o karboksigrupė lieka.', 'The secondary alcohol is oxidised to the ketone and the carboxyl group stays.'))
            ],
            why: t('Kiekvienas reagentas pasirenka vieną iš dviejų grupių: hidridas redukuoja karboksigrupę, alkoholis ir $H+$ ją esterina, šarmas ją neutralizuoja, o $CrO3$ oksiduoja alkoholį.', 'Each reagent picks one of the two groups: the hydride reduces the carboxyl group, an alcohol with $H+$ esterifies it, alkali neutralises it and $CrO3$ oxidises the alcohol.'),
            src: 'S6.21; T p90, p93',
            claims: [{ formula: [ster('C(=O)O', 'C(O)'), 'C24H40O3'] }, { formula: [ster('CO', 'C(O)'), 'C24H42O2'] }, { formula: [ster('C(=O)OC', 'C(O)'), 'C25H42O3'] }, { formula: [ster('C(=O)O', 'C(=O)'), 'C24H38O3'] }]
          }
        ]
      },
      /* ============================================================ drugs */
      {
        id: 'u14.drugs',
        title: t('Aspirinas, paracetamolis, DEET', 'Aspirin, paracetamol, DEET'),
        mirrors: ['S6.20', 'S6.22', 'S6.23'],
        bank: [
          {
            id: 'u14.drugs.1',
            q: [{ p: t('DEET sintezės pirmoji stadija: 3-metilbenzenkarboksirūgštis veikiama $SOCl2$.', 'First stage of the DEET synthesis: 3-methylbenzoic acid is treated with $SOCl2$.') }, { scheme: { items: [{ smi: 'Cc1cccc(c1)C(=O)O', name: t('3-metilbenzenkarboksirūgštis', '3-methylbenzoic acid') }, { arrow: '→', above: f('SOCl2') }] } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'Cc1cccc(c1)C(Cl)=O', ['Cc1ccc(cc1)C(Cl)=O', 'Cc1cccc(c1)C(=O)OC(=O)c1cccc(C)c1', 'ClCc1cccc(c1)C(=O)O'],
                t('Reagentas pakeičia vieną grupę; žiedas ir metilo padėtis nesikeičia.', 'The reagent replaces one group; the ring and the position of the methyl group do not change.'),
                t('$SOCl2$ pakeičia karboksigrupės OH chloru: susidaro 3-metilbenzoilchloridas; metilas lieka 3-oje padėtyje.', '$SOCl2$ replaces the OH of the carboxyl group with chlorine: 3-methylbenzoyl chloride forms; the methyl group stays in position 3.'))
            ],
            why: t('Rūgštis paverčiama aktyvintu dariniu, kad ją galėtų atakuoti aminas.', 'The acid is converted into an activated derivative so that the amine can attack it.'),
            src: 'S6.22',
            claims: [{ react: ['acid.socl2', ['Cc1cccc(c1)C(=O)O'], null, 'Cc1cccc(c1)C(Cl)=O'] }]
          },
          {
            id: 'u14.drugs.2',
            q: [{ p: t('Antra stadija: gautas chloridas reaguoja su dietilaminu.', 'Second stage: the resulting chloride reacts with diethylamine.') }, { scheme: { items: [{ smi: 'Cc1cccc(c1)C(Cl)=O' }, { plus: true }, { smi: 'CCNCC', name: t('N-etiletanaminas', 'N-ethylethanamine') }, { arrow: '→', above: t('2 ekv.', '2 equiv.') }] } }],
            steps: [
              prod(t('Koks yra organinis produktas?', 'What is the organic product?'), 'CCN(CC)C(=O)c1cccc(C)c1', ['Cc1cccc(c1)C(=O)[O-].CC[NH2+]CC', 'CCNC(=O)c1cccc(C)c1', 'CCOC(=O)c1cccc(C)c1'],
                t('Azotas turi du etilus ir vieną H. Kuris iš jų pakeičiamas?', 'Nitrogen has two ethyl groups and one H. Which is replaced?'),
                t('Aminas yra nukleofilas: N–H pakeičiamas acilu, susidaro tretinis amidas DEET.', 'The amine is the nucleophile: N–H is replaced by the acyl group and the tertiary amide DEET forms.')),
              cho(t('Kodėl naudojami du ekvivalentai?', 'Why are two equivalents used?'), [
                tx('Antras ekvivalentas suriša išsiskiriantį HCl.', 'The second equivalent binds the released HCl.'),
                tx('Antras ekvivalentas veikia kaip rūgštinis katalizatorius.', 'The second equivalent acts as an acid catalyst.'),
                tx('Antras ekvivalentas acilina pirmąjį.', 'The second equivalent acylates the first.'),
                tx('Reakcija vyksta tik su dviem N atomais.', 'The reaction requires two nitrogen atoms.')
              ], 0, t('Kas išsiskiria kartu su amidu?', 'What is released together with the amide?'), t('HCl protonuotų aminą ir pašalintų jį iš reakcijos.', 'HCl would protonate the amine and remove it from the reaction.'))
            ],
            why: t('Rūgšties chlorido ir amino reakcija yra nukleofilinis acilpakeitimas; naudojamas amino perteklius arba kita bazė, kuri suriša HCl.', 'The reaction of an acyl chloride with an amine is nucleophilic acyl substitution; an excess of the amine or another base is used to bind the HCl.'),
            src: 'S6.22',
            claims: [{ react: ['acyl.nu', ['Cc1cccc(c1)C(Cl)=O', 'CCNCC'], { nu: 'amine' }, 'CCN(CC)C(=O)c1cccc(C)c1'] }, { name: ['CCNCC', t('N-etiletanaminas', 'N-ethylethanamine')] }]
          },
          {
            id: 'u14.drugs.3',
            q: [{ p: t('DEET (dietiltoluamidas) – repelentas.', 'DEET (diethyltoluamide) is an insect repellent.') }, { mol: { smi: 'CCN(CC)C(=O)c1cccc(C)c1' } }],
            steps: [
              { prompt: t('Parašykite molekulinę formulę.', 'Write the molecular formula.'), kind: 'formula', mol: { smi: 'CCN(CC)C(=O)c1cccc(C)c1' }, answer: 'C12H17NO',
                hint: t('Suskaičiuokite C atomus: žiedas, karbonilas, metilas, du etilai.', 'Count the carbons: ring, carbonyl, methyl and two ethyl groups.'),
                solution: t('Žiede 6 C, karbonile 1, metile 1 ir dviejuose etiluose 4: iš viso 12 C; $C12H17NO$.', 'The ring has 6 C, the carbonyl 1, the methyl 1 and the two ethyl groups 4: 12 C in all; $C12H17NO$.') },
              { prompt: t('Pavadinkite pagal IUPAC.', 'Give the IUPAC name.'), kind: 'name', mol: { smi: 'CCN(CC)C(=O)c1cccc(C)c1' }, answer: { smi: 'CCN(CC)C(=O)c1cccc(C)c1' },
                hint: t('Tai benzenkarboksirūgšties amidas, o du etilai prisijungę prie azoto.', 'It is the amide of a benzenecarboxylic acid with two ethyl groups on the nitrogen.'),
                solution: t('N,N-dietil-3-metilbenzenkarboksamidas', 'N,N-diethyl-3-methylbenzamide') }
            ],
            why: t('N pakaitai žymimi raide N; metilas žiede turi locantą, skaičiuojamą nuo karbonilo turinčios anglies.', 'Substituents on nitrogen are marked with the letter N; the methyl group on the ring has a locant counted from the carbon carrying the carbonyl group.'),
            src: 'S6.22',
            claims: [{ formula: ['CCN(CC)C(=O)c1cccc(C)c1', 'C12H17NO'] }]
          },
          {
            id: 'u14.drugs.4',
            q: [{ p: t('Paracetamolis gaunamas acilinant 4-aminofenolį etano rūgšties anhidridu. Molekulėje yra du nukleofilai.', 'Paracetamol is made by acylating 4-aminophenol with ethanoic anhydride. The molecule has two nucleophilic sites.') }, { mol: { smi: 'Nc1ccc(O)cc1', opts: { numbers: 'all' }, name: t('4-aminofenolis', '4-aminophenol') } }],
            steps: [
              tap(t('Bakstelėkite heteroatomą, kuris acilinamas.', 'Tap the heteroatom that is acylated.'), { smi: 'Nc1ccc(O)cc1', opts: { numbers: 'all' } }, [0],
                t('Palyginkite N ir O kaip nukleofilus: kuris lengviau dalijasi laisva elektronų pora?', 'Compare N and O as nucleophiles: which shares its lone pair more readily?'),
                t('Aminogrupės azotas (Nr. 1) yra stipresnis nukleofilas už fenolio deguonį: N mažiau elektroneigiamas už O ir lengviau atiduoda laisvą elektronų porą.', 'The nitrogen of the amino group (no. 1) is a stronger nucleophile than the phenolic oxygen: N is less electronegative than O and gives up its lone pair more readily.')),
              cho(t('Kokio tipo darinys susidaro?', 'What type of derivative forms?'), [tx('amidas', 'amide'), tx('esteris', 'ester'), tx('anhidridas', 'anhydride'), tx('rūgšties chloridas', 'acyl chloride')], 0,
                t('Acilinamas azotas.', 'Nitrogen is acylated.'), t('N prijungia acilą: susidaro amidas.', 'N takes up the acyl group: an amide forms.'))
            ],
            why: t('Azotas yra nukleofiliškesnis už deguonį, todėl aminofenolyje acilinama aminogrupė, o ne OH.', 'Nitrogen is more nucleophilic than oxygen, so in the aminophenol the amino group is acylated, not the OH.'),
            src: 'S6.23'
          },
          {
            id: 'u14.drugs.5',
            q: [{ p: t('4-aminofenolis reaguoja su etano rūgšties anhidridu.', '4-Aminophenol reacts with ethanoic anhydride.') }, { scheme: { items: [{ smi: 'Nc1ccc(O)cc1' }, { plus: true }, { smi: 'CC(=O)OC(C)=O' }, { arrow: '→' }] } }],
            steps: [
              prod(t('Koks yra pagrindinis organinis produktas?', 'What is the main organic product?'), 'CC(=O)Nc1ccc(O)cc1', ['CC(=O)Oc1ccc(N)cc1', 'CC(=O)Nc1ccc(OC(C)=O)cc1', 'CC(=O)c1ccc(N)c(O)c1'],
                t('Pasirinkite, kuri grupė gauna acilą, ir kiek acilų.', 'Decide which group gets the acyl group, and how many.'),
                t('Vienas ekvivalentas anhidrido acilina aminogrupę ir susidaro amidas; antra anhidrido pusė virsta etano rūgštimi.', 'One equivalent of anhydride acylates the amino group to give the amide; the other half of the anhydride becomes ethanoic acid.')),
              { prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: 'CC(=O)Nc1ccc(O)cc1' }, answer: { smi: 'CC(=O)Nc1ccc(O)cc1' },
                hint: t('Etanamidas su 4-hidroksifenilu prie azoto.', 'An ethanamide with a 4-hydroxyphenyl group on the nitrogen.'), solution: t('N-(4-hidroksifenil)etanamidas (paracetamolis)', 'N-(4-hydroxyphenyl)ethanamide (paracetamol)') }
            ],
            why: t('Paracetamolis yra N-arilo amidas; etano rūgštis yra šalutinis produktas.', 'Paracetamol is an N-aryl amide; ethanoic acid is the by-product.'),
            src: 'S6.23',
            claims: [{ react: ['amine.acyl', ['Nc1ccc(O)cc1', 'CC(=O)OC(C)=O'], null, 'CC(Nc1ccc(cc1)O)=O'] }, { name: ['CC(=O)Nc1ccc(O)cc1', t('N-(4-hidroksifenil)etanamidas', 'N-(4-hydroxyphenyl)ethanamide')] }]
          },
          {
            id: 'u14.drugs.6',
            q: [{ p: t('Salicilo rūgštis kaitinama su etanoliu ir $H+$.', 'Salicylic acid is heated with ethanol and $H+$.') }, { scheme: { items: [{ smi: 'Oc1ccccc1C(=O)O', name: t('2-hidroksibenzenkarboksirūgštis', '2-hydroxybenzoic acid') }, { plus: true }, { smi: 'CCO' }, { arrow: '⇌', above: f('H+') }] } }],
            steps: [
              prod(t('Koks produktas?', 'What is the product?'), 'CCOC(=O)c1ccccc1O', ['CCOc1ccccc1C(=O)O', 'CCOC(=O)c1ccccc1OCC', 'CC(=O)Oc1ccccc1C(=O)O'],
                t('Esterinimas reikalauja acilo donoro ir alkoholio. Kuri grupė yra acilo donoras?', 'Esterification needs an acyl donor and an alcohol. Which group is the acyl donor?'),
                t('Karboksigrupė yra acilo donoras, etanolis – nukleofilas: susidaro etilo salicilatas. Fenolio OH nesikeičia, nes nėra acilo donoro, o eteris neturi susidaryti.', 'The carboxyl group is the acyl donor and ethanol is the nucleophile: ethyl salicylate forms. The phenolic OH does not change because there is no acyl donor for it, and no ether forms.')),
              cho(t('Kodėl reikalinga rūgštinė katalizė?', 'Why is acid catalysis needed?'), [
                tx('Rūgštis ir alkoholis yra silpni, todėl $H+$ aktyvina karbonilą (protonuoja deguonį).', 'The acid and the alcohol are weak, so $H+$ activates the carbonyl (protonates oxygen).'),
                tx('$H+$ paverčia alkoholį alkoksidu.', '$H+$ turns the alcohol into an alkoxide.'),
                tx('$H+$ pašalina fenolio OH.', '$H+$ removes the phenolic OH.'),
                tx('Be $H+$ salicilo rūgštis dekarboksilinasi.', 'Without $H+$ salicylic acid decarboxylates.')
              ], 0, t('Kokios atakos silpnasis nukleofilas?', 'What does the weak nucleophile attack?'), t('Rūgštinė katalizė padaro karbonilą pakankamai elektrofilišką silpnam nukleofilui – alkoholiui.', 'Acid catalysis makes the carbonyl electrophilic enough for a weak nucleophile, the alcohol.'))
            ],
            why: t('Su alkoholiu reaguoja karboksigrupė (acilo dalis), o fenolio OH – ne: jis galėtų būti tik nukleofilas, o čia nukleofilu yra etanolis.', 'The carboxyl group (the acyl part) reacts with the alcohol; the phenolic OH does not, because it could only be a nucleophile and here ethanol plays that role.'),
            src: 'S6.20',
            claims: [{ react: ['acid.ester', ['Oc1ccccc1C(=O)O', 'CCO'], null, 'CCOC(=O)c1ccccc1O'] }, { name: ['CCOC(=O)c1ccccc1O', t('etil-2-hidroksibenzenkarboksilatas', 'ethyl 2-hydroxybenzoate')] }]
          },
          {
            id: 'u14.drugs.7',
            q: [{ p: t('Salicilo rūgštis reaguoja su etano rūgšties anhidridu, esant $H+$.', 'Salicylic acid reacts with ethanoic anhydride in the presence of $H+$.') }, { scheme: { items: [{ smi: 'Oc1ccccc1C(=O)O' }, { plus: true }, { smi: 'CC(=O)OC(C)=O' }, { arrow: '→', above: f('H+') }] } }],
            steps: [
              prod(t('Koks yra produktas?', 'What is the product?'), 'CC(=O)Oc1ccccc1C(=O)O', ['CC(=O)OC(=O)c1ccccc1O', 'CC(=O)c1ccccc1C(=O)O', 'CC(=O)Oc1ccccc1C(=O)OC(C)=O'],
                t('Anhidridas yra acilo donoras. Kuri salicilo rūgšties grupė yra nukleofilas?', 'The anhydride is the acyl donor. Which group of salicylic acid is the nucleophile?'),
                t('Fenolio OH yra nukleofilas, anhidridas duoda acilą: gaunamas fenilo esteris – aspirinas. Karboksigrupė nesikeičia.', 'The phenolic OH is the nucleophile and the anhydride supplies the acyl group: a phenyl ester, aspirin, forms. The carboxyl group is unchanged.')),
              { prompt: t('Pavadinkite aspiriną pagal IUPAC.', 'Name aspirin by IUPAC rules.'), kind: 'name', mol: { smi: 'CC(=O)Oc1ccccc1C(=O)O' }, answer: { smi: 'CC(=O)Oc1ccccc1C(=O)O' },
                hint: t('Pagrindinė grupė yra karboksigrupė; acetilo esteris yra pakaitas.', 'The principal group is the carboxyl group; the acetyl ester is a substituent.'), solution: t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid') },
              cho(t('Kodėl šiai reakcijai reikalinga rūgštinė katalizė?', 'Why does this reaction need acid catalysis?'), [
                tx('Fenolis yra silpnas nukleofilas, o $H+$ aktyvina anhidrido karbonilą.', 'Phenol is a weak nucleophile and $H+$ activates the anhydride carbonyl.'),
                tx('$H+$ paverčia fenolį fenoksidu.', '$H+$ turns phenol into phenoxide.'),
                tx('$H+$ pašalina karboksigrupę.', '$H+$ removes the carboxyl group.'),
                tx('Anhidridas be $H+$ nereaguoja su jokiu nukleofilu.', 'An anhydride does not react with any nucleophile without $H+$.')
              ], 0, t('Palyginkite fenolį su alifatiniu alkoholiu kaip nukleofilą.', 'Compare phenol with an aliphatic alcohol as a nucleophile.'), t('Fenolio deguonies pora dalinai delokalizuota žiede, todėl nukleofiliškumas mažas; protonuotas anhidridas yra daug elektrofilinesnis.', 'The oxygen lone pair of phenol is partly delocalised into the ring, so its nucleophilicity is low; a protonated anhydride is far more electrophilic.'))
            ],
            why: t('Abiem seminaro atvejais nukleofilas yra silpnas (alkoholis ar fenolis), todėl rūgštinė katalizė aktyvina elektrofilą – karbonilo grupę.', 'In both seminar cases the nucleophile is weak (an alcohol or a phenol), so acid catalysis activates the electrophile, the carbonyl group.'),
            src: 'S6.20',
            claims: [{ react: ['phenol.acyl', ['Oc1ccccc1C(=O)O', 'CC(=O)OC(C)=O'], null, 'CC(=O)Oc1ccccc1C(=O)O'] }, { name: ['CC(=O)Oc1ccccc1C(=O)O', t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid')] }]
          },
          {
            id: 'u14.drugs.8',
            q: [{ p: t('Aspirinas kaitinamas su dideliu pertekliumi vandeninio $NaOH$.', 'Aspirin is heated with a large excess of aqueous $NaOH$.') }, { mol: { smi: 'CC(=O)Oc1ccccc1C(=O)O' } }],
            steps: [
              cho(t('Kokie produktai susidaro?', 'Which products form?'), [
                sc({ smi: 'CC(=O)[O-].[Na+]' }, { plus: true }, { smi: '[Na+].[Na+].c1ccc(c(c1)C(=O)[O-])[O-]' }),
                sc({ smi: 'CC(=O)O' }, { plus: true }, { smi: 'Oc1ccccc1C(=O)O' }),
                sc({ smi: 'CC(=O)[O-].[Na+]' }, { plus: true }, { smi: 'Oc1ccccc1C(=O)O' }),
                sc({ smi: 'CC(=O)Oc1ccccc1C(=O)[O-].[Na+]' }, { plus: true }, { smi: 'O' })
              ], 0,
              t('Aspirinas turi ir fenilo esterį, ir karboksirūgštį. Ką daro šarmas su kiekviena grupe?', 'Aspirin has both a phenyl ester and a carboxylic acid. What does alkali do to each?'),
              t('Šarmas hidrolizuoja esterį (muilinimas) ir neutralizuoja abu rūgštinius protonus: susidaro natrio acetatas ir fenoksidas-karboksilatas (dinatrio salicilatas).', 'Alkali hydrolyses the ester (saponification) and neutralises both acidic protons: sodium ethanoate and the phenoxide-carboxylate (disodium salicylate) form.'))
            ],
            why: t('Fenilo esteris yra reaktingas, o hidrolizės produktai šarmuose yra druskos: aspirinas sparčiai skyla šarminėje terpėje.', 'A phenyl ester is reactive and the hydrolysis products in alkali are salts: aspirin decomposes quickly in an alkaline medium.'),
            src: 'T p95; S6.20',
            claims: [{ react: ['ester.hydrolysis', ['CC(=O)Oc1ccccc1C(=O)O'], { medium: 'base' }, 'CC(=O)[O-].[Na+]'] }]
          }
        ]
      }
    ],
    coverage: {
      'S6.7': ['u14.nu', 'u14.mech'],
      'S6.8': ['u14.claisen'],
      'S6.15': ['u14.salt'],
      'S6.16': ['u14.nu', 'u14.chain'],
      'S6.17': ['u14.chain'],
      'S6.18': ['u14.hydroxy'],
      'S6.19': ['u14.claisen'],
      'S6.20': ['u14.mech', 'u14.drugs'],
      'S6.21': ['u14.reagents'],
      'S6.22': ['u14.drugs'],
      'S6.23': ['u14.drugs']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
