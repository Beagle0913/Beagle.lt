// site/organic/units/u04.js: unit 4, acidity and basicity (Brønsted–Lowry, pKa, substituent effects, Lewis)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // labels that are only formulas or symbols
  const tx = (lt, en) => ({ text: t(lt, en) });
  // tiny molecules are drawn with their hydrogens (HCN, ethyne, ethene, ethane would otherwise be bare lines)
  const SMALL = new Set(['C#N', 'C#C', 'C=C', 'CC']);
  const M = (smi, opts) => (opts ? { smi, opts } : SMALL.has(smi) ? { smi, opts: { allH: true } } : { smi });
  const mo = (smi, opts) => ({ mol: M(smi, opts) });
  const cho = (prompt, options, answer, hint, solution) => ({ prompt, kind: 'choice', options, answer, hint, solution });
  const atomsStep = (prompt, smi, answer, hint, solution, opts) => ({ prompt, kind: 'atoms', mol: { smi, opts: Object.assign({ numbers: 'all' }, opts || {}) }, answer, hint, solution });
  const ns = (x) => (x < 0 ? '−' : '') + (x === 5 ? '5.0' : x === 9 ? '9.0' : String(Math.abs(x)));   // a pKa as text, real minus sign; 5.0 and 9.0 as the slides print them
  const nt = (x) => t(ns(x).replace('.', ','), ns(x));                  // the same number in Lithuanian (comma) and English (point)

  /* ---------- SMILES string surgery: move a proton on one atom ---------- */
  function spans(smi) {
    const out = [];
    let i = 0;
    while (i < smi.length) {
      const c = smi[i];
      if (c === '[') { const j = smi.indexOf(']', i); out.push({ a: i, b: j + 1 }); i = j + 1; }
      else if ((c === 'C' && smi[i + 1] === 'l') || (c === 'B' && smi[i + 1] === 'r')) { out.push({ a: i, b: i + 2 }); i += 2; }
      else if (/[BCNOPSFIcnops]/.test(c)) { out.push({ a: i, b: i + 1 }); i++; }
      else i++;
    }
    return out;
  }
  // dH: change of the H count on atom k, dQ: change of its charge (H+ lost: dH -1, dQ -1; an H atom lost: dH -1, dQ 0)
  function change(ctx, smi, k, dH, dQ) {
    const a = ctx.chem.parse(smi).atoms[k];
    const h = a.h + dH, q = a.charge + dQ;
    if (h < 0 || Math.abs(q) > 1) return null;
    const sym = a.aromatic ? a.el.toLowerCase() : a.el;
    const sp = spans(smi)[k];
    const tryText = (text) => { const o = smi.slice(0, sp.a) + text + smi.slice(sp.b); try { const m = ctx.chem.parse(o); return { o, m }; } catch (e) { return null; } };
    const text = '[' + sym + (h > 0 ? 'H' + (h > 1 ? h : '') : '') + (q > 0 ? '+' : q < 0 ? '-' : '') + ']';
    let r = tryText(text);                                        // keep only valid structures
    if (!r) return null;
    if (q === 0 && dQ !== 0) { const plain = tryText(sym); if (plain && plain.m.atoms[k].h === h) r = plain; }   // a neutral atom needs no brackets
    return r.o;
  }
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  // the right molecule first, then the distinct wrong ones (at most n options)
  function molOptions(ctx, right, wrongs, n) {
    const seen = new Set([canon(ctx, right)]);
    const out = [mo(right)];
    wrongs.forEach((s) => {
      if (!s || out.length >= n) return;
      let c;
      try { c = canon(ctx, s); } catch (e) { return; }
      if (!seen.has(c)) { seen.add(c); out.push(mo(s)); }
    });
    return out;
  }
  // a nominative name of a neutral molecule, or its formula when the namer does not cover it
  function nameT(ctx, smi) {
    try {
      if (ctx.name.inScope(smi)) {
        const lt = ctx.name.name(smi, { lang: 'lt' }), en = ctx.name.name(smi, { lang: 'en' });
        if (lt && en) return t(lt.name, en.name);
      }
    } catch (e) { /* fall through */ }
    return f('$' + ctx.chem.formulaString(ctx.chem.parse(smi)) + '$');
  }

  /* ---------- the pKa values the course gives (src = slide, seminar task or textbook page) ---------- */
  // a: the acid, k: the atom that loses the proton, pka: the value, nm: its name (nominative only)
  const PK = [
    { id: 'hcl', a: 'Cl', k: 0, pka: -7, src: 'L4 p10', nm: t('vandenilio chloridas', 'hydrogen chloride') },
    { id: 'h2so4', a: 'OS(=O)(=O)O', k: 0, pka: -9, src: 'L4 p10', nm: t('sieros rūgštis', 'sulfuric acid') },
    { id: 'hno3', a: 'O[N+](=O)[O-]', k: 0, pka: -1.4, src: 'L4 p10', nm: t('azoto rūgštis', 'nitric acid') },
    { id: 'phso3h', a: 'OS(=O)(=O)c1ccccc1', k: 0, pka: -6.5, src: 'L4 p10', nm: t('benzensulfonrūgštis', 'benzenesulfonic acid') },
    { id: 'tfa', a: 'OC(=O)C(F)(F)F', k: 0, pka: 0.18, src: 'L4 p10', nm: t('trifluoracto rūgštis', 'trifluoroacetic acid') },
    { id: 'h3o', a: '[OH3+]', k: 0, pka: -1.74, src: 'L4 p11', nm: t('oksonio jonas', 'hydronium ion') },
    { id: 'hcooh', a: 'C(=O)O', k: 2, pka: 3.7, src: 'L4 p20', nm: t('skruzdžių rūgštis', 'formic acid') },
    { id: 'ch3cooh', a: 'CC(=O)O', k: 3, pka: 4.75, src: 'L4 p9', nm: t('acto rūgštis', 'acetic acid') },
    { id: 'piv', a: 'CC(C)(C)C(=O)O', k: 6, pka: 5.0, src: 'L4 p20', nm: t('2,2-dimetilpropano rūgštis', '2,2-dimethylpropanoic acid') },
    { id: 'clac', a: 'OC(=O)CCl', k: 0, pka: 2.81, src: 'L4 p22', nm: t('chloracto rūgštis', 'chloroacetic acid') },
    { id: 'brac', a: 'OC(=O)CBr', k: 0, pka: 2.86, src: 'L4 p22', nm: t('bromacto rūgštis', 'bromoacetic acid') },
    { id: 'iac', a: 'OC(=O)CI', k: 0, pka: 3.15, src: 'L4 p22', nm: t('jodacto rūgštis', 'iodoacetic acid') },
    { id: 'fac', a: 'OC(=O)CF', k: 0, pka: 2.66, src: 'L4 p22', nm: t('fluoracto rūgštis', 'fluoroacetic acid') },
    { id: 'benz', a: 'OC(=O)c1ccccc1', k: 0, pka: 4.2, src: 'T p35', nm: t('benzenkarboksirūgštis', 'benzoic acid') },
    { id: 'h2co3', a: 'OC(=O)O', k: 0, pka: 6.4, src: 'S2.23', nm: t('anglies rūgštis', 'carbonic acid') },
    { id: 'nh4', a: '[NH4+]', k: 0, pka: 9.26, src: 'L4 p30', nm: t('amonio jonas', 'ammonium ion') },
    { id: 'ch3nh3', a: 'C[NH3+]', k: 1, pka: 10.62, src: 'L4 p28', nm: t('metilamonio jonas', 'methylammonium ion') },
    { id: 'anil', a: '[NH3+]c1ccccc1', k: 0, pka: 4.6, src: 'L4 p30', nm: t('anilinio jonas', 'anilinium ion') },
    { id: 'hcn', a: 'C#N', k: 0, pka: 9.31, src: 'L4 p38', nm: t('vandenilio cianidas', 'hydrogen cyanide') },
    { id: 'phenol', a: 'Oc1ccccc1', k: 0, pka: 9.9, src: 'L4 p11', nm: t('fenolis', 'phenol') },
    { id: 'acac', a: 'CC(=O)CC(C)=O', k: 3, pka: 9.0, src: 'L4 p11', nm: t('pentan-2,4-dionas', 'pentane-2,4-dione') },
    { id: 'water', a: 'O', k: 0, pka: 15.7, src: 'L4 p11', nm: t('vanduo', 'water') },
    { id: 'meoh', a: 'CO', k: 1, pka: 15.6, src: 'S2.23', nm: t('metanolis', 'methanol') },
    { id: 'etoh', a: 'CCO', k: 2, pka: 16, src: 'L4 p11', nm: t('etanolis', 'ethanol') },
    { id: 'tbuoh', a: 'CC(C)(C)O', k: 4, pka: 18, src: 'L4 p11', nm: t('tret-butanolis', 'tert-butyl alcohol') },
    { id: 'acetone', a: 'CC(C)=O', k: 0, pka: 19.3, src: 'S2.23, L4 p11', nm: t('acetonas', 'acetone') },
    { id: 'ethyne', a: 'C#C', k: 0, pka: 25, src: 'L4 p11', nm: t('etinas', 'ethyne') },
    { id: 'nh3', a: 'N', k: 0, pka: 38, src: 'L4 p11', nm: t('amoniakas', 'ammonia') },
    { id: 'ethene', a: 'C=C', k: 0, pka: 44, src: 'L4 p11', nm: t('etenas', 'ethene') },
    { id: 'ethane', a: 'CC', k: 0, pka: 50, src: 'L4 p11', nm: t('etanas', 'ethane') }
  ];
  const PKID = {};
  PK.forEach((p) => { PKID[p.id] = p; });
  // the bases the course names with a salt (S2.23, L4 p36-38); pk = the acid they are the conjugate base of
  const SALTS = [
    { pk: 'water', salt: '$NaOH$', nm: t('natrio hidroksidas', 'sodium hydroxide') },
    { pk: 'meoh', salt: '$NaOCH3$', nm: t('natrio metoksidas', 'sodium methoxide') },
    { pk: 'etoh', salt: '$NaOCH2CH3$', nm: t('natrio etoksidas', 'sodium ethoxide') },
    { pk: 'tbuoh', salt: '$KOC(CH3)3$', nm: t('kalio tret-butoksidas', 'potassium tert-butoxide') },
    { pk: 'nh3', salt: '$NaNH2$', nm: t('natrio amidas', 'sodium amide') },
    { pk: 'ethyne', salt: '$NaC≡CH$', nm: t('natrio acetilenidas', 'sodium acetylide') },
    { pk: 'h2co3', salt: '$NaHCO3$', nm: t('natrio hidrokarbonatas', 'sodium hydrogen carbonate') },
    { pk: 'hcn', salt: '$NaCN$', nm: t('natrio cianidas', 'sodium cyanide') },
    { pk: 'ch3cooh', salt: '$CH3COONa$', nm: t('natrio acetatas', 'sodium acetate') },
    { pk: 'phenol', salt: '$C6H5ONa$', nm: t('natrio fenoksidas', 'sodium phenoxide') },
    { pk: 'hcl', salt: '$NaCl$', nm: t('natrio chloridas', 'sodium chloride') }
  ];

  // acid forms of the conjugate pairs (S2.18, S2.19, L4 p3-7); k = the atom that holds the proton; tapB false when protonation sites are equivalent by resonance;
  // baseOnly: the pair is asked from the base side only; xb / xa: extra wrong conjugate bases / acids

  const PAIRS = [
    { a: 'CCO', k: 2 }, { a: '[NH4+]', k: 0 }, { a: 'N', k: 0 }, { a: '[OH3+]', k: 0 }, { a: 'CC(=O)O', k: 3, tapB: false },
    { a: 'CC(C)NC(C)C', k: 3 }, { a: 'O=C1CCCCC1', k: 2, tapB: false }, { a: 'O', k: 0 }, { a: 'CC(C)O', k: 3 },
    { a: 'CCC[NH3+]', k: 3 }, { a: 'CC(=[OH+])C', k: 2, baseOnly: true, xa: ['CC([OH2+])=C'] }, { a: 'CCC', k: 0 }, { a: 'C#C', k: 0 }, { a: 'Oc1ccccc1', k: 0 },
    { a: '[NH3+]c1ccccc1', k: 0 }, { a: 'CCS', k: 2 }, { a: 'C#N', k: 0 }, { a: 'OS(=O)(=O)O', k: 0, tapB: false }, { a: 'Cl', k: 0 },
    { a: 'CC(C)(C)O', k: 4 }, { a: 'CC(=O)CC(C)=O', k: 3, tapB: false }, { a: 'C[NH3+]', k: 1 }, { a: 'OC(=O)C(F)(F)F', k: 0, tapB: false },
    { a: 'CC(C)[NH2+]C(C)C', k: 3 }, { a: 'CC(=[OH+])O', k: 2, baseOnly: true, xa: ['CC(=O)[OH2+]'] }, { a: 'CC[OH2+]', k: 2 }, { a: 'CCCC(=O)O', k: 5, tapB: false },
    { a: 'CCCO', k: 3 }, { a: 'CC#C', k: 2 }, { a: 'CNC', k: 1 }, { a: 'OC(=O)CCl', k: 0, tapB: false }, { a: 'CC(C)[NH3+]', k: 3 }
  ];

  const SC = (items) => ({ scheme: { items } });
  const PLUS = { plus: true };
  const EQ = { arrow: '⇌' };
  const FW = { arrow: '→' };

  /* ---------- generator: conjugate acid-base pairs (S2.18, S2.19) ---------- */
  function genConj(rng, ctx) {
    const pr = ctx.pick(PAIRS);
    let asAcid = ctx.int(0, 1) === 0 && !pr.baseOnly;
    const A = pr.a, k = pr.k;
    const B = change(ctx, A, k, -1, -1);
    if (!B) throw new Error('u04.conj: no conjugate base for ' + A);
    const pa = ctx.chem.parse(A), pb = ctx.chem.parse(B);
    const aA = pa.atoms[k], aB = pb.atoms[k];
    // wrong conjugate bases of the acid A, and wrong conjugate acids of the base B (typical slips; every one a valid structure)
    const wrongBases = (lax) => {
      const w = [];
      if (aA.charge === 0 && /^(N|O|S|Cl)$/.test(aA.el)) w.push(change(ctx, A, k, 1, 1));            // H+ added instead of removed
      let others = 0;
      pa.atoms.forEach((a, j) => { if (j !== k && a.h >= 1 && !a.aromatic && /^(C|N|O|S)$/.test(a.el) && others < 2) { const x = change(ctx, A, j, -1, -1); if (x && canon(ctx, x) !== canon(ctx, B)) { w.push(x); others++; } } });   // the proton taken from another atom
      if (aA.h >= 2) w.push(change(ctx, A, k, -2, -2));                                                // two protons removed
      w.push(change(ctx, A, k, -1, 1));                                                                // a hydride removed
      if (lax) w.push(change(ctx, A, k, -1, 0));                                                       // an H atom removed, not H+ (only when too few other options exist)
      return w.concat(pr.xb || []);
    };
    const wrongAcids = (lax) => {
      const w = [];
      if (aB.h >= 1) w.push(change(ctx, B, k, -1, -1));                                                // H+ removed instead of added
      if (/^(N|O|S)$/.test(aB.el)) w.push(change(ctx, B, k, 2, 2));                                   // two protons added
      w.push(change(ctx, B, k, 0, 2));                                                                 // the charge simply flipped
      if (lax) w.push(change(ctx, B, k, 1, 0));                                                        // H added but the charge forgotten (only when too few other options exist)
      return w.concat(pr.xa || []);
    };
    const attempt = (acid, lax) => molOptions(ctx, acid ? B : A, (acid ? wrongBases(lax) : wrongAcids(lax)).filter(Boolean), 4);
    let options = attempt(asAcid, false);
    if (options.length < 3) options = attempt(asAcid, true);
    if (options.length < 3) { asAcid = !asAcid; options = attempt(asAcid, false); if (options.length < 3) options = attempt(asAcid, true); }
    const given = asAcid ? A : B, answer = asAcid ? B : A;
    if (options.length < 3) throw new Error('u04.conj: too few options for ' + A + ' (' + options.length + ')');
    const many = (asAcid ? pa : pb).atoms.length > 1 && (asAcid || pr.tapB !== false);
    const ho = SMALL.has(given) ? { allH: true } : undefined;
    const steps = [];
    if (asAcid) {
      if (many) {
        steps.push(atomsStep(t('Bakstelėkite atomą, kuris atiduoda protoną $H+$ (rūgščiausia vieta).', 'Tap the atom that gives up the proton $H+$ (the most acidic site).'),
          given, [k],
          t('Prisiminkite eilę SH > OH > NH > CH; greta esanti C=O grupė labai padidina gretimo C–H rūgštingumą.', 'Recall the order SH > OH > NH > CH; a neighbouring C=O group raises the acidity of the C–H next to it a great deal.'),
          t('Protoną atiduoda atomas Nr. ' + (k + 1) + ': kitų vandenilių rūgštingumas mažesnis.', 'The proton is given up by atom no. ' + (k + 1) + ': the other hydrogens are less acidic.'), ho));
      }
      steps.push({
        prompt: many ? t('Kokia yra šios rūgšties konjuguotoji bazė (protoną atiduoda rūgščiausia vieta)?', 'What is the conjugate base of this acid (the proton comes from the most acidic site)?') : t('Kokia yra šios rūgšties konjuguotoji bazė?', 'What is the conjugate base of this acid?'), kind: 'choice', options, answer: 0,
        hint: t('Rūgštis atiduoda $H+$. Kaip dėl to pasikeičia vandenilių skaičius ir krūvis?', 'The acid gives away $H+$. How do the number of hydrogens and the charge change?'),
        solution: [{ p: t('Atėmus $H+$, vandenilių lieka vienu mažiau, o krūvis sumažėja vienu vienetu:', 'Removing $H+$ leaves one hydrogen fewer and lowers the charge by one unit:') }, mo(answer)]
      });
    } else {
      if (many) {
        steps.push(atomsStep(t('Bakstelėkite atomą, kuris prisijungia protoną $H+$ (bazinis centras).', 'Tap the atom that takes up the proton $H+$ (the basic centre).'),
          given, [k],
          t('Protoną suriša laisvoji elektronų pora arba neigiamas krūvis. Kuris atomas jų turi?', 'The proton is bound by a lone pair or a negative charge. Which atom has one?'),
          t('Protoną prisijungia atomas Nr. ' + (k + 1) + ': jo elektronų pora sudaro naują ryšį su $H+$.', 'Atom no. ' + (k + 1) + ' takes up the proton: its electron pair forms the new bond to $H+$.'), ho));
      }
      steps.push({
        prompt: many ? t('Kokia yra šios bazės konjuguotoji rūgštis (protoną prisijungia bazingiausias centras)?', 'What is the conjugate acid of this base (the proton goes to the most basic centre)?') : t('Kokia yra šios bazės konjuguotoji rūgštis?', 'What is the conjugate acid of this base?'), kind: 'choice', options, answer: 0,
        hint: t('Bazė prisijungia $H+$. Kaip dėl to pasikeičia vandenilių skaičius ir krūvis?', 'The base takes up $H+$. How do the number of hydrogens and the charge change?'),
        solution: [{ p: t('Prisijungus $H+$, vandenilių tampa vienu daugiau, o krūvis padidėja vienu vienetu:', 'Taking up $H+$ gives one hydrogen more and raises the charge by one unit:') }, mo(answer)]
      });
    }
    return {
      q: [{ p: asAcid ? t('Parodyta Brionstedo rūgštis. Raskite jos konjuguotąją bazę.', 'A Brønsted acid is shown. Find its conjugate base.') : t('Parodyta Brionstedo bazė. Raskite jos konjuguotąją rūgštį.', 'A Brønsted base is shown. Find its conjugate acid.') }, mo(given, ho)],
      steps,
      why: t('Konjuguotosios rūgšties ir bazės porą skiria vienas protonas $H+$: rūgštis jį atiduoda ir tampa konjuguotąja baze, bazė jį prisijungia ir tampa konjuguotąja rūgštimi. Kuo stipresnė rūgštis, tuo silpnesnė jos konjuguotoji bazė.',
        'A conjugate pair differs by exactly one proton $H+$: the acid gives it away and becomes its conjugate base, the base takes it up and becomes its conjugate acid. The stronger the acid, the weaker its conjugate base.'),
      src: 'L4 p6, S2.18, S2.19'
    };
  }

  /* ---------- generator: pKa arithmetic and strength classes (L4 p9, p10) ---------- */
  const CATS = [
    tx('Labai stipri rūgštis (pKa < 1)', 'Very strong acid (pKa < 1)'),
    tx('Vidutinio stiprumo rūgštis (pKa 1–5)', 'Acid of medium strength (pKa 1–5)'),
    tx('Silpna rūgštis (pKa 5–15)', 'Weak acid (pKa 5–15)'),
    tx('Labai silpna rūgštis (pKa > 15)', 'Very weak acid (pKa > 15)')
  ];
  const catOf = (x) => (x < 1 ? 0 : x < 5 ? 1 : x < 15 ? 2 : 3);
  function genPka(rng, ctx) {
    if (ctx.int(0, 1) === 0) {
      const c = ctx.pick([1.0, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 3.2, 4.0, 4.5, 5.0, 6.0, 7.0, 8.5]);
      const n = ctx.int(2, 12);
      const pA = Math.round((n - Math.log10(c)) * 100) / 100;
      let pB;
      do { pB = Math.round((pA + ctx.pick([-3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3])) * 10) / 10; } while (pB < 0 || Math.abs(pB - pA) < 0.8);
      const cT = t(c.toFixed(1).replace('.', ','), c.toFixed(1));
      const kaT = t('$Ka = ' + cT.lt + '·10^−' + n + '^$', '$Ka = ' + cT.en + '·10^−' + n + '^$');
      const stronger = pA < pB ? 0 : 1;
      return {
        q: [{ p: t('Rūgšties A rūgštingumo konstanta vandenyje: ' + kaT.lt + '. Rūgšties B pKa = ' + nt(pB).lt + '.', 'The acidity constant of acid A in water: ' + kaT.en + '. Acid B has pKa = ' + nt(pB).en + '.') }],
        steps: [
          {
            prompt: t('Apskaičiuokite rūgšties A pKa (du skaitmenys po kablelio).', 'Calculate the pKa of acid A (two decimals).'), kind: 'number', answer: { value: pA, tol: 0.03 },
            hint: t('pKa = −lg Ka. Skaičiaus $10^−n^$ dešimtainis logaritmas yra −n.', 'pKa = −lg Ka. The decimal logarithm of $10^−n^$ is −n.'),
            solution: t('pKa = −lg(' + cT.lt + '·10^−' + n + ') = ' + n + ' − lg ' + cT.lt + ' = ' + nt(pA).lt + '.', 'pKa = −lg(' + cT.en + '·10^−' + n + ') = ' + n + ' − lg ' + cT.en + ' = ' + nt(pA).en + '.')
          },
          cho(t('Kuri rūgštis stipresnė?', 'Which acid is stronger?'), [tx('Rūgštis A', 'Acid A'), tx('Rūgštis B', 'Acid B')], stronger,
            t('Palyginkite abiejų rūgščių pKa; rūgštingumo konstantos Ka ir pKa kinta priešingomis kryptimis.', 'Compare the two pKa values; Ka and pKa change in opposite directions.'),
            t('Rūgšties ' + (stronger === 0 ? 'A' : 'B') + ' pKa mažesnė (' + nt(Math.min(pA, pB)).lt + ' < ' + nt(Math.max(pA, pB)).lt + '), todėl ji stipresnė.', 'Acid ' + (stronger === 0 ? 'A' : 'B') + ' has the smaller pKa (' + nt(Math.min(pA, pB)).en + ' < ' + nt(Math.max(pA, pB)).en + '), so it is stronger.')),
          cho(t('Kurios rūgšties konjuguotoji bazė stipresnė?', 'Whose conjugate base is the stronger base?'), [tx('Rūgšties A', "Acid A's"), tx('Rūgšties B', "Acid B's")], 1 - stronger,
            t('Rūgščių ir bazių poroje stipresnę rūgštį atitinka silpnesnė bazė.', 'In a conjugate pair, a stronger acid goes with a weaker base.'),
            t('Stipresnė yra rūgštis ' + (stronger === 0 ? 'A' : 'B') + ', todėl jos konjuguotoji bazė silpnesnė; stipresnė bazė yra silpnesniosios rūgšties (' + (stronger === 0 ? 'B' : 'A') + ') konjuguotoji bazė.',
              'Acid ' + (stronger === 0 ? 'A' : 'B') + ' is stronger, so its conjugate base is weaker; the stronger base is the conjugate base of the weaker acid (' + (stronger === 0 ? 'B' : 'A') + ').'))
        ],
        why: t('Ka rodo, kokia dalis rūgšties disocijuoja, o pKa = −lg Ka: didesnė Ka reiškia mažesnę pKa. Kuo mažesnė pKa, tuo stipresnė rūgštis ir tuo silpnesnė jos konjuguotoji bazė.',
          'Ka tells how far an acid dissociates, and pKa = −lg Ka: a larger Ka means a smaller pKa. The smaller the pKa, the stronger the acid and the weaker its conjugate base.'),
        src: 'L4 p9, T p33'
      };
    }
    const pool = PK.filter((p) => p.id !== 'piv' && p.id !== 'ch3cooh' && p.id !== 'anil');
    const p = ctx.pick(pool);
    const cat = catOf(p.pka);
    const weaker = p.pka < 4.75;
    const B = change(ctx, p.a, p.k, -1, -1);
    return {
      q: [{ p: t('Parodytos rūgšties pKa vandenyje yra ' + nt(p.pka).lt + '.', 'The pKa of the acid shown, in water, is ' + nt(p.pka).en + '.') }, mo(p.a)],
      steps: [
        cho(t('Kokia šios rūgšties stiprumo grupė?', 'Which strength class does this acid belong to?'), CATS.slice(), cat,
          t('Palyginkite pKa su ribomis 1, 5 ir 15.', 'Compare the pKa with the limits 1, 5 and 15.'),
          t('pKa = ' + nt(p.pka).lt + ' patenka į grupę: ' + CATS[cat].text.lt + '.', 'pKa = ' + nt(p.pka).en + ' falls into the class: ' + CATS[cat].text.en + '.')),
        cho(t('Kaip šios rūgšties konjuguotoji bazė lyginasi su acetato jonu (jo konjuguotoji rūgštis, acto rūgštis, turi pKa 4,75)?', 'How does the conjugate base of this acid compare with the acetate ion (acetic acid has pKa = 4.75)?'),
          [tx('Stipresnė bazė nei acetato jonas', 'A stronger base than acetate'), tx('Silpnesnė bazė nei acetato jonas', 'A weaker base than acetate')], weaker ? 1 : 0,
          t('Konjuguotosios bazės stiprumas kinta priešingai nei rūgšties.', 'The strength of the conjugate base changes opposite to that of the acid.'),
          [{ p: weaker ? t('Rūgštis stipresnė už acto rūgštį (mažesnė pKa), todėl jos konjuguotoji bazė silpnesnė už acetatą:', 'The acid is stronger than acetic acid (smaller pKa), so its conjugate base is weaker than acetate:') : t('Rūgštis silpnesnė už acto rūgštį (didesnė pKa), todėl jos konjuguotoji bazė stipresnė už acetatą:', 'The acid is weaker than acetic acid (larger pKa), so its conjugate base is stronger than acetate:') }, mo(B)])
      ],
      why: t('Rūgštys pagal pKa skirstomos: < 1 labai stiprios, 1–5 vidutinio stiprumo, 5–15 silpnos, > 15 labai silpnos. Konjuguotoji bazė visada kinta priešingai nei jos rūgštis.', 'By pKa, acids are very strong (< 1), of medium strength (1–5), weak (5–15) or very weak (> 15). The conjugate base always changes opposite to its acid.'),
      src: 'L4 p10, ' + p.src
    };
  }

  /* ---------- generator: direction of an acid-base equilibrium (S2.22, L4 p36-38) ---------- */
  function genDir(rng, ctx) {
    let A = null, Bp = null;
    for (let i = 0; i < 80 && !A; i++) {
      const x = ctx.pick(PK), y = ctx.pick(PK);
      if (x !== y && Math.abs(x.pka - y.pka) >= 1.5) {
        const four = [x.a, change(ctx, y.a, y.k, -1, -1), change(ctx, x.a, x.k, -1, -1), y.a];   // the four species of the equation must be distinct (the role step)
        if (four.every((m) => m) && new Set(four.map((m) => canon(ctx, m))).size === 4) { A = x; Bp = y; }
      }
    }
    if (!A) throw new Error('u04.dir: no pair');
    const AB = change(ctx, A.a, A.k, -1, -1), BB = change(ctx, Bp.a, Bp.k, -1, -1);
    const rightFav = Bp.pka > A.pka;                 // the acid on the right (HB) is the weaker one
    const strongerLeft = A.pka < Bp.pka;             // the acid on the left (HA) is the stronger one
    const stepWeak = t('Pusiausvyra pasislenka į silpnesnės rūgšties ir silpnesnės bazės pusę: ši pora stabilesnė.', 'The equilibrium shifts to the side of the weaker acid and weaker base: that pair is more stable.');
    return {
      q: [
        { p: t('Nustatykite rūgštis ir bazes šioje reakcijoje ir kryptį, kuria pasislinkusi pusiausvyra. Rūgščių pKa pateiktos lentelėje.', 'Identify the acids and bases in this reaction and the direction in which the equilibrium lies. The pKa values of the acids are in the table.') },
        SC([M(A.a), PLUS, M(BB), EQ, M(AB), PLUS, M(Bp.a)]),
        { table: { head: [t('Rūgštis', 'Acid'), f('pKa')], rows: [[M(A.a), nt(A.pka)], [M(Bp.a), nt(Bp.pka)]] } }
      ],
      steps: [
        matchRoles(t('Priskirkite kiekvienai dalelei jos vaidmenį reakcijoje iš kairės į dešinę.', 'Assign each species its role in the reaction read from left to right.'), [A.a, BB, AB, Bp.a], [0, 1, 2, 3],
          t('Rūgštis atiduoda protoną ir tampa konjuguotąja baze; bazė jį prisijungia ir tampa konjuguotąja rūgštimi.', 'The acid gives away a proton and becomes its conjugate base; the base takes it up and becomes its conjugate acid.'),
          t('Kairėje esanti $HA$ – rūgštis, jos konjuguotoji bazė yra dešinėje pirmoji dalelė; kairėje esanti bazė paima protoną ir tampa konjuguotąja rūgštimi (dešinėje antroji).', 'The left-hand $HA$ is the acid and its conjugate base is the first species on the right; the base on the left takes the proton and becomes the conjugate acid (the second species on the right).')),
        cho(t('Kuri rūgštis stipresnė: reakcijos kairėje ar dešinėje pusėje?', 'Which acid is stronger: the one on the left or the one on the right of the equation?'),
          [mo(A.a), mo(Bp.a)], strongerLeft ? 0 : 1,
          t('Kuo mažesnė pKa, tuo stipresnė rūgštis.', 'The smaller the pKa, the stronger the acid.'),
          t('Mažesnę pKa turi ' + (strongerLeft ? 'kairėje esanti rūgštis (' + nt(A.pka).lt + ' < ' + nt(Bp.pka).lt + ').' : 'dešinėje esanti rūgštis (' + nt(Bp.pka).lt + ' < ' + nt(A.pka).lt + ').'),
            'The smaller pKa belongs to the acid on the ' + (strongerLeft ? 'left (' + nt(A.pka).en + ' < ' + nt(Bp.pka).en + ').' : 'right (' + nt(Bp.pka).en + ' < ' + nt(A.pka).en + ').'))),
        cho(t('Į kurią pusę pasislinkusi pusiausvyra?', 'Which way does the equilibrium lie?'),
          [tx('Į dešinę: vyrauja produktai', 'To the right: the products predominate'), tx('Į kairę: vyrauja reagentai', 'To the left: the reactants predominate'),
            tx('Reagentų ir produktų yra maždaug po lygiai', 'Reactants and products are present in about equal amounts')], rightFav ? 0 : 1,
          t('Reakcija pasislenka link silpnesnės rūgšties ir silpnesnės bazės.', 'The reaction goes toward the weaker acid and the weaker base.'),
          rightFav ? t('Stipresnė rūgštis yra kairėje, todėl ji reaguoja: gaunama silpnesnė bazė ir silpnesnė rūgštis. Pusiausvyra pasislinkusi į dešinę, pKa skiriasi ' + nt(Math.round((Bp.pka - A.pka) * 100) / 100).lt + ' vieneto.', 'The stronger acid is on the left, so it reacts: a weaker acid and a weaker base form. The equilibrium lies to the right; the pKa values differ by ' + nt(Math.round((Bp.pka - A.pka) * 100) / 100).en + ' units.')
            : t('Stipresnė rūgštis yra dešinėje, todėl jos susidarymas nepalankus: pusiausvyra pasislinkusi į kairę, pKa skiriasi ' + nt(Math.round((A.pka - Bp.pka) * 100) / 100).lt + ' vieneto.', 'The stronger acid is on the right, so its formation is unfavourable: the equilibrium lies to the left; the pKa values differ by ' + nt(Math.round((A.pka - Bp.pka) * 100) / 100).en + ' units.')),
        cho(t('Kodėl pusiausvyra pasislinkusi būtent taip?', 'Why does the equilibrium lie that way?'),
          [{ text: stepWeak }].concat(ctx.shuffle([
            tx('Pusiausvyra pasislenka į stipresnės rūgšties ir stipresnės bazės pusę, nes šios dalelės energingesnės.', 'The equilibrium shifts to the side of the stronger acid and stronger base because these species are richer in energy.'),
            tx('Pusiausvyra visada pasislenka į dešinę, nes bazė atima protoną iš rūgšties.', 'The equilibrium always lies to the right because the base takes the proton from the acid.'),
            tx('Pusiausvyra pasislenka į pusę, kurioje yra rūgštis su mažesne pKa reikšme.', 'The equilibrium shifts to the side that holds the acid with the smaller pKa.'),
            tx('Pusiausvyra pasislenka į pusę, kurioje yra daugiau atomų, nes tada produktai stabilesni.', 'The equilibrium shifts to the side with more atoms because the products are then more stable.'),
            tx('Kryptį lemia tik tai, kuri dalelė sudaryta iš daugiau elementų, o ne pKa.', 'The direction depends only on which species has more elements, not on pKa.')]).slice(0, 3)), 0,
          t('Rūgščių ir bazių reakcijas valdo termodinamika: produktai turi būti stabilesni.', 'Acid-base reactions are under thermodynamic control: the products must be more stable.'),
          t('Mažesnę potencinę energiją turi silpnesnė bazė su silpnesne rūgštimi, todėl jų pusė vyrauja.', 'A weaker acid and a weaker base have lower potential energy, so their side predominates.'))
      ],
      why: t('Rūgščių ir bazių reakcijos kontroliuojamos termodinamiškai: pusiausvyra pasislenka į silpnesnės rūgšties ir silpnesnės bazės pusę. Vadinasi, reikia palyginti dviejų rūgščių pKa: didesnė pKa reiškia silpnesnę rūgštį.', 'Acid-base reactions are under thermodynamic control: the equilibrium lies on the side of the weaker acid and weaker base. So compare the pKa values of the two acids: the larger pKa belongs to the weaker acid.'),
      src: 'L4 p36, ' + A.src + ', ' + Bp.src
    };
  }

  /* ---------- generator: which bases can deprotonate an acid (S2.23) ---------- */
  const TARGETS = ['acetone', 'etoh', 'phenol', 'ethyne', 'ch3cooh', 'hcn', 'tbuoh', 'water', 'meoh', 'h2co3', 'acac'];
  function genDeprot(rng, ctx) {
    let T = null, chosen = null;
    for (let i = 0; i < 80 && !chosen; i++) {
      const tg = PKID[ctx.pick(TARGETS)];
      const cands = SALTS.filter((s) => s.pk !== tg.id && Math.abs(PKID[s.pk].pka - tg.pka) >= 1.5);
      const rights = ctx.shuffle(cands.filter((s) => PKID[s.pk].pka > tg.pka));
      const wrongs = ctx.shuffle(cands.filter((s) => PKID[s.pk].pka < tg.pka));
      if (!rights.length || !wrongs.length) continue;
      const r = ctx.int(1, Math.min(2, rights.length));
      const pick = rights.slice(0, r).concat(wrongs.slice(0, 4 - r));
      if (pick.length < 3) continue;
      T = tg; chosen = ctx.shuffle(pick);
    }
    if (!chosen) throw new Error('u04.deprot: no set');
    const ok = chosen.map((s) => PKID[s.pk].pka > T.pka);
    const opt = chosen.map((s) => ({ text: t(s.nm.lt + ' ' + s.salt, s.nm.en + ' ' + s.salt) }));
    let best = 0;
    chosen.forEach((s, i) => { if (PKID[s.pk].pka > PKID[chosen[best].pk].pka) best = i; });
    const lines = chosen.map((s, i) => t(s.nm.lt + ' ' + s.salt + ': ' + nt(PKID[s.pk].pka).lt + (ok[i] ? ' > ' : ' < ') + nt(T.pka).lt + (ok[i] ? ' – deprotonizuoja' : ' – nedeprotonizuoja'),
      s.nm.en + ' ' + s.salt + ': ' + nt(PKID[s.pk].pka).en + (ok[i] ? ' > ' : ' < ') + nt(T.pka).en + (ok[i] ? ' – deprotonates' : ' – does not deprotonate')));
    const prod = change(ctx, T.a, T.k, -1, -1);
    return {
      q: [
        { p: t('Rūgšties (parodyta) pKa = ' + nt(T.pka).lt + '. Lentelėje – bazės ir jų konjuguotųjų rūgščių pKa.', 'The acid shown has pKa = ' + nt(T.pka).en + '. The table lists the bases and the pKa of their conjugate acids.') },
        mo(T.a),
        { table: { head: [t('Bazė', 'Base'), t('Konjuguotoji rūgštis', 'Conjugate acid'), f('pKa')], rows: chosen.map((s) => [t(s.nm.lt + ' ' + s.salt, s.nm.en + ' ' + s.salt), M(PKID[s.pk].a), nt(PKID[s.pk].pka)]) } }
      ],
      steps: [
        {
          prompt: t('Kurios bazės pakankamai stiprios, kad deprotonizuotų šią rūgštį?', 'Which bases are strong enough to deprotonate this acid?'), kind: 'multi', options: opt, answer: ok.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
          hint: t('Palyginkite kiekvienos bazės konjuguotosios rūgšties pKa su rūgšties pKa: reakcija vyksta į silpnesnės rūgšties pusę.', 'Compare the pKa of each base’s conjugate acid with the pKa of the acid: the reaction goes toward the weaker acid.'),
          solution: [{ list: lines }, { p: t('Jei bazės konjuguotoji rūgštis silpnesnė už deprotonizuojamą rūgštį (didesnė pKa), pusiausvyra pasislinkusi į deprotonizuoto produkto pusę. Pavyzdžiui, produktas:', 'If the conjugate acid of the base is weaker than the acid to be deprotonated (larger pKa), the equilibrium lies on the side of the deprotonated product. For example, the product:') }, mo(prod)]
        },
        cho(t('Kuri iš šių bazių stipriausia?', 'Which of these bases is the strongest?'), opt, best,
          t('Bazės stiprumą rodo jos konjuguotosios rūgšties pKa: kuo didesnė, tuo stipresnė bazė.', 'The strength of a base is shown by the pKa of its conjugate acid: the larger it is, the stronger the base.'),
          t('Stipriausia yra bazė, kurios konjuguotoji rūgštis turi didžiausią pKa (' + nt(PKID[chosen[best].pk].pka).lt + ').', 'The strongest base is the one whose conjugate acid has the largest pKa (' + nt(PKID[chosen[best].pk].pka).en + ').'))
      ],
      why: t('Bazė deprotonizuoja rūgštį tik tada, kai jos konjuguotoji rūgštis silpnesnė už deprotonizuojamą rūgštį, t. y. kai jos konjuguotosios rūgšties pKa didesnė už rūgšties pKa. Skirtumas bent kelių vienetų užtikrina, kad pusiausvyra aiškiai pasislinkusi.', 'A base deprotonates an acid only when its own conjugate acid is weaker than the acid being deprotonated, that is, when the pKa of the conjugate acid is larger than the pKa of the acid. A difference of several units makes the equilibrium lie clearly on the product side.'),
      src: 'S2.23, L4 p36-38, ' + T.src
    };
  }

  /* ---------- generators: ranking acids (S2.20) and bases (S2.21) ---------- */
  const fromPK = (ids) => ids.map((id) => ({ smi: PKID[id].a, key: PKID[id].pka, pka: PKID[id].pka }));
  // course names of the anilines (S2.21)
  const ANN = {
    'Nc1ccc(cc1)[N+](=O)[O-]': t('4-nitroanilinas', '4-nitroaniline'), 'Nc1ccc(Cl)cc1': t('4-chloranilinas', '4-chloroaniline'), 'Nc1ccccc1': t('anilinas', 'aniline'),
    'Nc1ccc(C)cc1': t('4-metilanilinas', '4-methylaniline'), 'CCc1ccc(N)cc1': t('4-etilanilinas', '4-ethylaniline'),
    'COc1ccc(N)cc1': t('4-metoksianilinas', '4-methoxyaniline'), 'CCOc1ccc(N)cc1': t('4-etoksianilinas', '4-ethoxyaniline')
  };
  const ACID_FAMS = [
    {
      id: 'halo', gap: 0.25, src: 'L4 p20, p22',
      members: () => fromPK(['hcooh', 'ch3cooh', 'piv', 'clac', 'brac', 'iac', 'fac', 'tfa']),
      right: t('Halogenai ir grupė $CF3$ yra elektronų akceptoriai (−I): jie stabilizuoja karboksilato anijoną ir didina rūgštingumą, tuo labiau, kuo didesnis elektrinis neigiamumas. Alkilgrupės yra donorai (+I) ir rūgštingumą mažina.',
        'Halogens and the $CF3$ group are electron acceptors (−I): they stabilise the carboxylate anion and raise the acidity, the more so the higher the electronegativity. Alkyl groups are donors (+I) and lower the acidity.'),
      wrong: [
        t('Kuo didesnis halogeno atomas, tuo jis labiau poliarizuojasi ir tuo stipresnė rūgštis (kaip eilėje HF < HCl < HBr < HI).', 'The larger the halogen atom, the more polarisable it is and the stronger the acid (as in the series HF < HCl < HBr < HI).'),
        t('Alkilgrupės yra elektronų akceptoriai ir stabilizuoja karboksilato anijoną, todėl ilgesnis alkilas rūgštį stiprina.', 'Alkyl groups are electron acceptors and stabilise the carboxylate anion, so a longer alkyl group makes the acid stronger.'),
        t('Rūgštingumą lemia tik molekulės masė: sunkesnė molekulė yra stipresnė rūgštis.', 'Acidity depends only on molar mass: a heavier molecule is a stronger acid.')
      ]
    },
    {
      id: 'pos', gap: 0.1, src: 'L4 p22',
      members: () => [
        { smi: 'CCCC(Br)C(=O)O', key: 2.97, pka: 2.97 }, { smi: 'CCC(Br)CC(=O)O', key: 4.01, pka: 4.01 }, { smi: 'CC(Br)CCC(=O)O', key: 4.59, pka: 4.59 },
        { smi: 'BrCCCCC(=O)O', key: 4.71, pka: 4.71 }, { smi: 'CCCCC(=O)O', key: 4.82, pka: 4.82 }],
      right: t('Bromas yra elektronų akceptorius (−I), bet šis efektas per ryšių grandinę silpnėja: kuo bromas arčiau karboksilo grupės, tuo labiau stabilizuojamas anijonas ir tuo stipresnė rūgštis.',
        'Bromine is an electron acceptor (−I), but the effect fades along the chain of bonds: the closer bromine is to the carboxyl group, the more the anion is stabilised and the stronger the acid.'),
      wrong: [
        t('Bromas stipriau veikia iš toli, nes jo laisvosios elektronų poros pasiekia karboksilo grupę per visą grandinę.', 'Bromine acts more strongly from far away because its lone pairs reach the carboxyl group through the whole chain.'),
        t('Visose padėtyse bromo poveikis vienodas, nes indukcijos efektas nepriklauso nuo atstumo.', 'Bromine has the same effect in every position because the inductive effect does not depend on distance.'),
        t('Bromas didina rūgštingumą tik tada, kai yra grandinės gale.', 'Bromine raises the acidity only when it sits at the end of the chain.')
      ]
    },
    {
      id: 'type', gap: 0.5, src: 'L4 p19, T p34',
      members: (ctx) => {
        const R = ctx.pick([['C', 'CN', 'CO', 'CS', 'CC(=O)O'], ['CC', 'CCN', 'CCO', 'CCS', 'CCC(=O)O'], ['CCC', 'CCCN', 'CCCO', 'CCCS', 'CCCC(=O)O']]);
        return R.map((smi, i) => ({ smi, key: R.length - i }));   // smaller key = stronger acid: COOH 1 ... CH 5
      },
      right: t('Rūgštį lemia anijono stabilumas. Neigiamą krūvį geriau išlaiko elektroneigiamesnis atomas (O > N > C) ir didesnis, labiau poliarizuojamas atomas (S > O); karboksilato krūvis dar ir pasiskirsto tarp dviejų O atomų.',
        'The acid is set by the stability of the anion. A negative charge is held better by a more electronegative atom (O > N > C) and by a larger, more polarisable atom (S > O); the carboxylate charge is also shared by two O atoms.'),
      wrong: [
        t('Kuo elektroneigiamesnis atomas, tuo stipriau jis laiko vandenilį, todėl rūgštis silpnesnė.', 'The more electronegative the atom, the more tightly it holds the hydrogen, so the acid is weaker.'),
        t('S–H ryšys stipresnis už O–H, todėl tioliai yra silpnesnės rūgštys už alkoholius.', 'The S–H bond is stronger than the O–H bond, so thiols are weaker acids than alcohols.'),
        t('Rūgštingumą lemia tik vandenilių skaičius molekulėje.', 'Acidity depends only on the number of hydrogens in the molecule.')
      ]
    },
    {
      id: 'hyb', gap: 0.5, src: 'L4 p18, p11',
      members: (ctx) => {
        const V = ctx.pick([['CC', 'C=C', 'C#C', true], ['CCC', 'CC=C', 'CC#C'], ['CCCC', 'CCC=C', 'CCC#C'], ['CCCCC', 'CCCC=C', 'CCCC#C']]);
        return [{ smi: V[0], key: 3, pka: V[3] ? 50 : undefined }, { smi: V[1], key: 2, pka: V[3] ? 44 : undefined }, { smi: V[2], key: 1, pka: V[3] ? 25 : undefined }];
      },
      right: t('Lyginama $C–H$ prie sp, sp2 ir sp3 anglies. Kuo didesnė anglies atomo s charakterio dalis (sp > sp2 > sp3), tuo didesnis jo elektrinis neigiamumas ir tuo stabilesnis karbanijonas, todėl alkino C–H rūgštingiausias.',
        'Compare the $C–H$ on the sp, sp2 and sp3 carbon. The larger the s character of the carbon atom (sp > sp2 > sp3), the higher its electronegativity and the more stable the carbanion, so the alkyne C–H is the most acidic.'),
      wrong: [
        t('Elektrinis neigiamumas mažėja didėjant s charakteriui, todėl alkanas yra stipriausia rūgštis.', 'Electronegativity falls as the s character grows, so the alkane is the strongest acid.'),
        t('Rūgštingumą lemia tik vandenilių skaičius prie anglies: daugiau vandenilių – stipresnė rūgštis.', 'Acidity depends only on the number of hydrogens on carbon: more hydrogens, a stronger acid.'),
        t('Dvigubas ir trigubas ryšiai yra elektronų donorai (+I) ir stabilizuoja anijoną.', 'Double and triple bonds are electron donors (+I) and stabilise the anion.')
      ]
    },
    {
      id: 'res', gap: 0.3, src: 'L4 p11, p17',
      members: () => fromPK(['tbuoh', 'etoh', 'water', 'phenol', 'ch3cooh', 'acetone', 'acac']),
      right: t('Rūgšties stiprumą lemia anijono stabilumas. Karboksilato, fenoksido ir diketono anijonuose neigiamas krūvis delokalizuotas (rezonansas), o alkoksido krūvis lieka ant vieno O atomo; alkilgrupių +I efektas ir silpnesnė solvatacija anijoną dar mažiau stabilizuoja. Acetonas yra $C–H$ rūgštis: nors enolatas stabilizuotas rezonansu, vienos $C=O$ grupės nepakanka, kad jis pralenktų alkoksidą ant elektroneigiamo $O$.',
        'The strength of an acid is set by the stability of its anion. In carboxylate, phenoxide and diketone anions the negative charge is delocalised (resonance), whereas the alkoxide charge stays on one O atom; the +I effect of alkyl groups and weaker solvation stabilise it even less. Acetone is a $C–H$ acid: although its enolate is resonance stabilised, a single $C=O$ group does not beat an alkoxide whose charge sits on the more electronegative $O$.'),
      wrong: [
        t('Alkoksido anijoną stabilizuoja alkilgrupės, nes jos sklaido neigiamą krūvį, todėl tret-butanolis rūgštesnis už metanolį ir etanolį.', 'Alkyl groups stabilise the alkoxide anion because they spread the negative charge, so tert-butanol is more acidic than methanol and ethanol.'),
        t('Rūgštingumą lemia tik tai, ar molekulėje yra O–H ryšys, o ne anijono krūvio padėtis ir delokalizacija.', 'Acidity depends only on whether the molecule has an O–H bond, not on where the anion charge sits or how far it is delocalised.'),
        t('Kuo ilgesnė anglies grandinė, tuo stipresnė rūgštis.', 'The longer the carbon chain, the stronger the acid.')
      ]
    }
  ];
  const BASE_FAMS = [
    {
      id: 'aniline',
      members: (ctx) => [
        { smi: 'Nc1ccc(cc1)[N+](=O)[O-]', key: 1 }, { smi: 'Nc1ccc(Cl)cc1', key: 2 }, { smi: 'Nc1ccccc1', key: 3 },
        { smi: ctx.pick(['Nc1ccc(C)cc1', 'CCc1ccc(N)cc1']), key: 4 }, { smi: ctx.pick(['COc1ccc(N)cc1', 'CCOc1ccc(N)cc1']), key: 5 }, { smi: 'CCN', key: 6 }],
      gap: 0.5, src: 'L4 p30, p32, S2.21',
      right: t('Elektronų donoriniai pakaitai (alkilas +I, alkoksigrupė +M) didina elektronų tankį ant azoto ir bazingumą; akceptoriniai (nitrogrupė −M ir −I, chloras −I) jį mažina. Palyginant du donorus: $p$-padėtyje alkoksigrupė savo deguonies laisvąja pora perduoda elektronų tankį per žiedą tiesiai azotui ($+M$, jis viršija jos $−I$), o alkilgrupė stumia elektronus tik silpnai ($+I$), todėl 4-metoksianilinas bazingesnis už 4-metilaniliną. Alifatinio azoto pora nedelokalizuota žiede, todėl etanaminas bazingesnis už visus anilinus.',
        'Electron-donating substituents (alkyl +I, alkoxy +M) raise the electron density on nitrogen and the basicity; acceptors (nitro −M and −I, chlorine −I) lower it. Comparing two donors: in the $p$ position an alkoxy group pushes an oxygen lone pair through the ring straight to nitrogen ($+M$, which outweighs its $−I$), whereas an alkyl group pushes electrons only weakly ($+I$), so 4-methoxyaniline is a stronger base than 4-methylaniline. The lone pair of an aliphatic amine is not delocalised into a ring, so ethanamine is a stronger base than any aniline.'),
      wrong: [
        t('Nitrogrupė didina bazingumą, nes stabilizuoja konjuguotąją rūgštį – anilinio katijoną, o ne ištraukia elektronų tankį iš azoto.', 'The nitro group raises the basicity because it stabilises the conjugate acid, the anilinium cation, rather than pulling electron density away from nitrogen.'),
        t('Pakaitas veikia tik savo dydžiu: kuo jis didesnis, tuo labiau užstoja azotą ir tuo bazė stipresnė.', 'A substituent acts only through its size: the bigger it is, the more it shields nitrogen and the stronger the base.'),
        t('Visi pakaitai prie benzeno žiedo bazingumą vienodai mažina, nes žiedas pats yra akceptorius, o pakaito pobūdis nieko nekeičia.', 'Every substituent on the benzene ring lowers the basicity equally because the ring is itself an acceptor, and the nature of the substituent changes nothing.')
      ]
    },
    {
      id: 'amine',
      members: () => [{ smi: 'CN', key: 10.62, pka: 10.62 }, { smi: 'N', key: 9.26, pka: 9.26 }, { smi: 'Nc1ccccc1', key: 4.6, pka: 4.6 },
        { smi: 'c1ccccc1Nc1ccccc1', key: 0.9, pka: 0.9 }, { smi: 'c1ccc(cc1)N(c1ccccc1)c1ccccc1', key: -1, pkaT: '< 0' }],
      gap: 1, src: 'L4 p28, p30',
      right: t('Alkilgrupė (+I) didina elektronų tankį ant azoto, o fenilgrupė yra akceptorius: azoto laisvoji elektronų pora delokalizuojasi žiede ir sunkiau jungia protoną. Kuo daugiau fenilgrupių, tuo silpnesnė bazė.',
        'An alkyl group (+I) raises the electron density on nitrogen, whereas a phenyl group is an acceptor: the nitrogen lone pair is delocalised into the ring and binds a proton less readily. The more phenyl groups, the weaker the base.'),
      wrong: [
        t('Fenilgrupės yra donorinės ir didina azoto elektronų tankį, todėl trifenilaminas yra stipriausia bazė.', 'Phenyl groups are donors and raise the electron density on nitrogen, so triphenylamine is the strongest base.'),
        t('Bazingumą lemia tik azoto atomų skaičius molekulėje, o jis visur vienodas.', 'Basicity depends only on the number of nitrogen atoms in the molecule, which is the same everywhere.'),
        t('Amoniakas yra silpniausia bazė, nes neturi pakaitų, kurie užstotų azoto atomą.', 'Ammonia is the weakest base because it has no substituents that shield the nitrogen atom.')
      ]
    }
  ];

  function rankProblem(rng, ctx, fams, isAcid) {
    const fam = ctx.pick(fams);
    const all = fam.members(ctx);
    let sub = null;
    for (let i = 0; i < 60 && !sub; i++) {
      const n = ctx.int(3, Math.min(4, all.length));
      const cand = ctx.shuffle(all).slice(0, n);
      const sorted = cand.slice().sort((a, b) => a.key - b.key);
      if (sorted.every((m, j) => j === 0 || m.key - sorted[j - 1].key >= fam.gap)) sub = cand;
    }
    if (!sub) throw new Error('u04: no usable subset in ' + fam.id);
    const strongFirst = ctx.int(0, 1) === 0;
    // for acids a smaller key is a stronger acid, for bases a larger key is a stronger base
    const sorted = sub.slice().sort((a, b) => (isAcid ? a.key - b.key : b.key - a.key));
    const order = strongFirst ? sorted : sorted.slice().reverse();
    const show = (m) => {
      const nm = ANN[m.smi] || nameT(ctx, m.smi);
      const v = m.pka !== undefined ? ' (pKa ' + ns(m.pka) + ')' : m.pkaT ? ' (pKa ' + m.pkaT + ')' : '';
      return t(nm.lt + v.replace('.', ','), nm.en + v);
    };
    const reasonOpts = [{ text: fam.right }].concat(fam.wrong.map((w) => ({ text: w })));
    const what = isAcid
      ? (strongFirst ? t('Išdėstykite junginius nuo stipriausios iki silpniausios rūgšties.', 'Put the compounds in order from the strongest to the weakest acid.') : t('Išdėstykite junginius rūgštingumo didėjimo eile (nuo silpniausios iki stipriausios rūgšties).', 'Put the compounds in order of increasing acidity (from the weakest to the strongest acid).'))
      : (strongFirst ? t('Išdėstykite junginius nuo stipriausios iki silpniausios bazės.', 'Put the compounds in order from the strongest to the weakest base.') : t('Išdėstykite junginius bazinių savybių stiprėjimo eile (nuo silpniausios iki stipriausios bazės).', 'Put the compounds in order of increasing basicity (from the weakest to the strongest base).'));
    const withVals = order.some((m) => m.pka !== undefined || m.pkaT);
    return {
      q: [{ p: t('Palyginkite parodytus junginius.', 'Compare the compounds shown.') }, { mol: ctx.shuffle(sub).map((m) => M(m.smi)) }],
      steps: [
        {
          prompt: what, kind: 'order', options: order.map((m) => ({ mol: M(m.smi) })),
          hint: isAcid ? t('Rūgštį nusako konjuguotosios bazės stabilumas: palyginkite, kiek kiekvienas anijonas gali išlaikyti ar išskleisti neigiamą krūvį.', 'An acid is judged by its conjugate base: compare how well each anion can hold or spread the negative charge.')
            : t('Bazę nusako gebėjimas jungti protoną: palyginkite, kiek elektronų tankio turi ar kokiame žiede delokalizuoja bazinis centras.', 'A base is judged by how readily it binds a proton: compare the electron density at the basic centre and whether it is delocalised.'),
          solution: [{ p: strongFirst ? t('Nuo stipriausios iki silpniausios:', 'From the strongest to the weakest:') : t('Nuo silpniausios iki stipriausios:', 'From the weakest to the strongest:') }, { list: order.map(show) }]
            .concat(withVals ? [{ p: isAcid ? t('Skliaustuose – kurso pateiktos pKa: mažesnė reikšmė reiškia stipresnę rūgštį.', 'In brackets: the pKa values the course gives; a smaller value means a stronger acid.') : t('Skliaustuose – konjuguotųjų rūgščių pKa: didesnė reikšmė reiškia stipresnę bazę.', 'In brackets: the pKa of the conjugate acids; a larger value means a stronger base.') }] : [])
        },
        {
          prompt: t('Kuo paaiškinama ši eilė?', 'What explains this order?'), kind: 'choice', options: reasonOpts, answer: 0,
          hint: isAcid ? t('Pagalvokite apie anijono krūvį: kur jis yra ir kaip jį veikia gretimos grupės.', 'Think about the charge of the anion: where it sits and how neighbouring groups act on it.')
            : t('Pagalvokite apie azoto laisvąją elektronų porą: ar pakaitai ją „suteikia“, ar „atima“?', 'Think about the nitrogen lone pair: do the substituents push electron density onto it or pull it away?'),
          solution: fam.right
        }
      ],
      why: fam.right,
      src: fam.src
    };
  }
  const genOrder = (rng, ctx) => rankProblem(rng, ctx, ACID_FAMS, true);
  const genBasic = (rng, ctx) => rankProblem(rng, ctx, BASE_FAMS, false);

  /* =====================================================================================================
     NOTES
     ===================================================================================================== */
  const NOTES = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'bronsted',
      title: t('Brionstedo rūgštys ir bazės', 'Brønsted acids and bases'),
      blocks: [
        { h: t('Protono pernešimas', 'Transfer of a proton') },
        {
          p: t('Organinių junginių reakcijas lemia tai, kaip jie elgiasi rūgščių ir bazių atžvilgiu. Naudojamos dvi teorijos: Brionstedo–Laurio (protonų perdavimas) ir Luiso (elektronų porų perdavimas; apie ją kalbama paskutiniame skyriuje).',
            'The reactivity of organic compounds is closely tied to their acidic and basic properties. Two theories are used: Brønsted–Lowry (transfer of protons) and Lewis (transfer of electron pairs; the last section deals with it).'),
          src: 'L4 p2, T p32'
        },
        {
          rule: t('Brionstedo rūgštis – neutrali molekulė arba jonas, galintis atiduoti protoną (protonų donoras). Brionstedo bazė – molekulė ar jonas, galintis prisijungti protoną (protonų akceptorius). Rūgštingumas ir bazingumas nėra absoliutūs: rūgštis pasireiškia tik kartu su baze, o bazė – tik kartu su rūgštimi.',
            'A Brønsted acid is a neutral molecule or ion that can give up a proton (a proton donor). A Brønsted base is a molecule or ion that can take up a proton (a proton acceptor). Acidity and basicity are relative properties: an acid shows its acidity only in the presence of a base, and a base its basicity only in the presence of an acid.'),
          src: 'L4 p2, T p32-33'
        },
        {
          p: t('Pavyzdys: acto rūgštis atiduoda protoną hidroksido jonui. Lenktoji rodyklė rodo elektronų judėjimą: hidroksido laisvoji elektronų pora sudaro ryšį su vandeniliu, o $O–H$ ryšio elektronų pora lieka deguoniui.',
            'Example: acetic acid gives a proton to the hydroxide ion. The curved arrow shows the movement of electrons: a lone pair of hydroxide forms a bond to hydrogen, and the electron pair of the $O–H$ bond stays on oxygen.'),
          src: 'L4 p4'
        },
        {
          mech: [{
            scheme: { items: [M('CC(=O)O', { allH: true }), PLUS, M('[OH-]', { lonePairs: true })] },
            arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H3' } }, { from: { m: 0, b: [3, 'H3'] }, to: { m: 0, a: 3 } }],
            note: t('Bazė ($OH-$) atima protoną; $O–H$ elektronai lieka deguoniui.', 'The base ($OH-$) takes the proton; the $O–H$ electrons stay on oxygen.')
          }],
          src: 'L4 p4'
        },
        { scheme: { items: [M('CC(=O)O'), PLUS, M('[OH-]'), EQ, M('CC(=O)[O-]'), PLUS, M('O')] }, caption: t('Rūgštis + bazė ⇌ konjuguotoji bazė + konjuguotoji rūgštis (vanduo).', 'Acid + base ⇌ conjugate base + conjugate acid (water).'), src: 'L4 p4, p6' },
        {
          p: t('Reakcija grįžtamoji, todėl abi pusės turi rūgštį ir bazę. Rūgštis $A–H$, atidavusi protoną, virsta konjuguotąja baze $A-$; bazė $:B$, prisijungusi protoną, virsta konjuguotąja rūgštimi $B+–H$. Taip susidaro rūgščių ir bazių poros.',
            'The reaction is reversible, so both sides contain an acid and a base. The acid $A–H$ turns into its conjugate base $A-$ by giving up a proton; the base $:B$ turns into its conjugate acid $B+–H$ by taking one up. These are the acid-base pairs.'),
          src: 'L4 p6, T p33'
        },
        {
          table: {
            head: [t('Rūgštis', 'Acid'), t('Konjuguotoji bazė', 'Conjugate base')],
            rows: [[M('Cl'), M('[Cl-]')], [M('[OH3+]'), M('O')], [M('O'), M('[OH-]')], [M('[NH4+]'), M('N')], [M('CC(=O)O'), M('CC(=O)[O-]')], [M('CCO'), M('CC[O-]')]]
          },
          caption: t('Rūgščių ir bazių poros. Vanduo gali būti ir rūgštis, ir bazė.', 'Acid-base pairs. Water can be both an acid and a base.'), src: 'L4 p3'
        },
        {
          rule: t('Kuo stipresnė rūgštis, tuo silpnesnė jos konjuguotoji bazė, ir atvirkščiai. Pavyzdžiui, $HCl$ yra stipresnė rūgštis nei $HCN$, todėl $CN-$ yra stipresnė bazė nei $Cl-$.',
            'The stronger the acid, the weaker its conjugate base, and the other way round. For example, $HCl$ is a stronger acid than $HCN$, so $CN-$ is a stronger base than $Cl-$.'),
          src: 'L4 p6'
        },
        {
          p: t('Ta pati medžiaga gali elgtis ir kaip rūgštis, ir kaip bazė. Acto rūgštis su stipria rūgštimi (oksonio jonu) elgiasi kaip bazė: protoną ji prisijungia prie karbonilo deguonies.',
            'The same substance can act as an acid or as a base. Acetic acid acts as a base toward a strong acid (the hydronium (oxonium) ion): it takes the proton on the carbonyl oxygen.'),
          src: 'L4 p4'
        },
        { scheme: { items: [M('CC(=O)O'), PLUS, M('[OH3+]'), EQ, M('CC(=[OH+])O'), PLUS, M('O')] }, caption: t('Acto rūgštis kaip bazė.', 'Acetic acid acting as a base.'), src: 'L4 p4' },
        {
          pitfall: t('Konjuguotoji rūgštis ar bazė skiriasi nuo pradinės dalelės lygiai vienu protonu. Ne kiekvienas reakcijos produktas yra konjuguotasis: reakcijoje $CH3COOH + NH3$ acto rūgšties konjuguotoji bazė yra acetatas, o ne amonio jonas ($NH4+$ yra amoniako konjuguotoji rūgštis). Lenktoji rodyklė prasideda nuo elektronų (laisvosios poros ar ryšio), o ne nuo atomo.',
            'A conjugate acid or base differs from the starting species by exactly one proton. Not every product is a conjugate: in $CH3COOH + NH3$ the conjugate base of acetic acid is acetate, not the ammonium ion ($NH4+$ is the conjugate acid of ammonia). A curved arrow starts from electrons (a lone pair or a bond), never from an atom.')
        },
        {
          example: {
            q: [
              { p: t('Šioje reakcijoje pažymėkite rūgštį ir bazę bei jų poras: konjuguotąją bazę ir konjuguotąją rūgštį.', 'Identify the acid, the base, the conjugate acid and the conjugate base in this reaction.') },
              SC([M('OS(=O)(=O)O'), PLUS, M('O'), EQ, M('OS(=O)(=O)[O-]'), PLUS, M('[OH3+]')])
            ],
            steps: [
              [{ p: t('Sieros rūgštis atiduoda protoną vandeniui, todėl sieros rūgštis yra rūgštis, o vanduo – bazė (jis prisijungia protoną).', 'Sulfuric acid gives a proton to water, so sulfuric acid is the acid and water is the base (it takes up the proton).') }],
              [{ p: t('Sieros rūgštis, netekusi protono, virsta hidrosulfatu – tai konjuguotoji bazė.', 'Sulfuric acid, having lost the proton, becomes hydrogensulfate: the conjugate base.') }, { mol: M('OS(=O)(=O)[O-]') }],
              [{ p: t('Vanduo, prisijungęs protoną, virsta oksonio jonu – tai konjuguotoji rūgštis.', 'Water, having taken up the proton, becomes the hydronium ion: the conjugate acid.') }, { mol: M('[OH3+]') }]
            ]
          },
          claims: [{ formula: ['OS(=O)(=O)[O-]', 'HSO4-'] }, { formula: ['[OH3+]', 'H3O+'] }, { formula: ['OS(=O)(=O)O', 'H2SO4'] }],
          src: 'L4 p7'
        },
        { practice: 'u04.conj' },
        { practice: 'u04.role' }
      ]
    },

    /* ------------------------------------------------------------ 2 */
    {
      id: 'pka',
      title: t('Rūgščių stiprumas: Ka ir pKa', 'Acid strength: Ka and pKa'),
      blocks: [
        { h: t('Kiek rūgštis disocijuoja vandenyje', 'How far an acid dissociates in water') },
        {
          p: t('Rūgštį paprastai matuojame vandenyje: vanduo čia yra bazė, o rūgšties stiprumą išreiškia pusiausvyros konstanta. Vandens koncentracija beveik nekinta (jo daug), todėl ją įtraukiame į konstantą ir gauname rūgštingumo konstantą $Ka$.',
            'Acidity is usually measured with water as the base and expressed by an equilibrium constant. The concentration of water hardly changes (it is in large excess), so it is folded into the constant, which gives the acidity constant $Ka$.'),
          src: 'L4 p8-9, T p33'
        },
        { scheme: { items: [M('CC(=O)O'), PLUS, M('O'), EQ, M('CC(=O)[O-]'), PLUS, M('[OH3+]')] }, caption: t('Acto rūgštis vandenyje: acetato ir oksonio jonai.', 'Acetic acid in water: acetate and hydronium ions.'), src: 'L4 p8' },
        {
          p: t('$Ka = [CH3COO^-^][H3O^+^] / [CH3COOH]$. Acto rūgščiai $1,75·10^−5^$ ($Ka$): Ka maža: acto rūgštis vandenyje disocijuoja tik nežymiai (skaidrė pateikia tik iliustraciją: maždaug dvi iš šimto tūkstančių molekulių). Patogiau naudoti neigiamą logaritmą, $pKa = −lg Ka$; acto rūgšties $pKa$ yra 4,75.',
            '$Ka = [CH3COO^-^][H3O^+^] / [CH3COOH]$. For acetic acid $Ka = 1.75·10^−5^$: Ka is small: acetic acid dissociates only slightly in water (the slide gives only an illustration: roughly two molecules in a hundred thousand). It is more convenient to use the negative logarithm: $pKa = −lg Ka$, for acetic acid $pKa = 4.75$.'),
          src: 'L4 p9, T p33'
        },
        {
          rule: t('Rūgštis tuo stipresnė, kuo mažesnė jos pKa. Pagal pKa rūgštys skirstomos: labai stiprios (pKa < 1), vidutinio stiprumo (1–5), silpnos (5–15) ir labai silpnos (> 15).',
            'The smaller the pKa, the stronger the acid. By pKa, acids are very strong (pKa < 1), of medium strength (1–5), weak (5–15) or very weak (> 15).'),
          src: 'L4 p9-10'
        },
        {
          table: {
            head: [t('Rūgštis', 'Acid'), f('pKa'), t('Konjuguotoji bazė', 'Conjugate base')],
            rows: [
              [M('OS(=O)(=O)O'), nt(-9), M('OS(=O)(=O)[O-]')], [M('Cl'), nt(-7), M('[Cl-]')], [M('[OH3+]'), nt(-1.74), M('O')],
              [M('CC(=O)O'), nt(4.75), M('CC(=O)[O-]')], [M('CC(=O)CC(C)=O'), nt(9.0), M('CC(=O)[CH-]C(C)=O')], [M('Oc1ccccc1'), nt(9.9), M('[O-]c1ccccc1')],
              [M('O'), nt(15.7), M('[OH-]')], [M('CCO'), nt(16), M('CC[O-]')], [M('CC(C)(C)O'), nt(18), M('CC(C)(C)[O-]')], [M('CC(C)=O'), nt(19.3), M('CC(=O)[CH2-]')],
              [M('C#C'), nt(25), M('C#[C-]')], [M('N'), nt(38), M('[NH2-]')], [M('C=C'), nt(44), M('C=[CH-]')], [M('CC'), nt(50), M('C[CH2-]')]
            ]
          },
          caption: t('Įvairių junginių rūgštingumas (vandenyje): stipriausia rūgštis viršuje.', 'The acidity of various compounds (in water): the strongest acid is at the top.'),
          src: 'L4 p11'
        },
        {
          p: t('Šaltiniai pKa apvalina skirtingai (pvz., acetonas: 19,2 skaidrėje, 19,3 seminare); skyriuje naudojama viena reikšmė.', 'Sources round pKa values differently (acetone: 19.2 on the slide, 19.3 in the seminar); this unit uses one value per compound.'),
          src: 'L4 p11, S2.23'
        },
        {
          p: t('Kitos kurso nurodytos stiprios rūgštys: $HNO3$ ($pKa = −1,4$), benzensulfonrūgštis ($−6,5$), trifluoracto rūgštis ($0,18$).', 'Other strong acids the course gives: $HNO3$ ($pKa = −1.4$), benzenesulfonic acid ($−6.5$), trifluoroacetic acid ($0.18$).'),
          src: 'L4 p10'
        },
        { h: t('Keturi Brionstedo rūgščių tipai', 'The four types of Brønsted acids') },
        {
          p: t('Rūgštys skirstomos pagal atomą, prie kurio prisijungęs rūgštusis protonas: $O–H$ (alkoholiai, fenoliai, karboksirūgštys), $S–H$ (tioliai), $N–H$ (amidai, aminai); ketvirtoji grupė – angliavandeniliai ir jų dariniai, kuriuose protonas sujungtas su anglimi ($C–H$).',
            'According to the element that carries the proton, there are O–H acids (carboxylic acids, phenols, alcohols), S–H acids (thiols), N–H acids (amines, amides) and C–H acids (hydrocarbons and their derivatives).'),
          src: 'L4 p14, T p33-34'
        },
        { mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'CCS', name: t('etantiolis', 'ethanethiol') }, { smi: 'CCN', name: t('etanaminas', 'ethanamine') }, { smi: 'CC', name: t('etanas', 'ethane') }], caption: t('O–H, S–H, N–H ir C–H rūgštys.', 'An O–H, an S–H, an N–H and a C–H acid.') },
        {
          pitfall: t('pH ir pKa – skirtingi dydžiai. pH (neigiamas vandenilio jonų koncentracijos logaritmas) rodo tirpalo rūgštingumą ir priklauso nuo rūgšties koncentracijos: skiedžiant pH didėja. Rūgšties stiprumą apibūdina tik jos pKa.',
            'pH and pKa are different quantities. pH (the negative logarithm of the hydrogen ion concentration) describes how acidic a solution is and depends on the concentration of the acid: diluting raises the pH. Only the pKa describes the strength of an acid.'),
          src: 'L4 p12'
        },
        {
          example: {
            q: [{ p: t('Rūgšties $Ka = 2·10^−9^$. Apskaičiuokite pKa ir nustatykite, į kokią grupę rūgštis patenka.', 'An acid has $Ka = 2·10^−9^$. Calculate its pKa and say which strength class it belongs to.') }],
            steps: [
              [{ p: t('$pKa = −lg Ka = −lg(2·10^−9^) = 9 − lg 2$.', '$pKa = −lg Ka = −lg(2·10^−9^) = 9 − lg 2$.') }],
              [{ p: t('$lg 2 ≈ 0,30$, todėl $pKa ≈ 8,7$.', '$lg 2 ≈ 0.30$, so $pKa ≈ 8.7$.') }],
              [{ p: t('$pKa$ patenka į intervalą 5–15, todėl tai silpna rūgštis. Palyginti su acto rūgštimi (4,75) ji silpnesnė, o jos konjuguotoji bazė – stipresnė už acetatą.', 'The pKa lies in the interval 5–15, so this is a weak acid. Compared with acetic acid (4.75) it is weaker, and its conjugate base is stronger than acetate.') }]
            ]
          }
        },
        { practice: 'u04.pka' }
      ]
    },

    /* ------------------------------------------------------------ 3 */
    {
      id: 'factors',
      title: t('Kas lemia rūgšties stiprumą', 'What decides the strength of an acid'),
      blocks: [
        { h: t('Anijono stabilumas', 'Stability of the anion') },
        {
          rule: t('Rūgštis tuo stipresnė, kuo stabilesnė jos konjuguotoji bazė (anijonas). Stabilumą nulemia keli veiksniai: kiek išsklaidytas neigiamas krūvis (delokalizacija), kokio atomo yra rūgštinis centras (jo elektrinis neigiamumas ir poliarizuojamumas), koks pakaitas prie jo prijungtas (alifatinis ar aromatinis, kokius elektroninius efektus sukelia) ir koks tirpiklis.',
            'The strength of an acid is set by the stability of its conjugate base (the anion): the more stable the anion, the stronger the acid. The stability of the anion depends on how far the negative charge is delocalised, on the atom of the acidic centre (electronegativity and polarisability), on the substituent attached to it (aliphatic or aromatic, electronic effects) and on the solvent.'),
          src: 'L4 p15-16, T p34'
        },
        { h: t('1. Neigiamo krūvio delokalizacija (konjugacija)', '1. Delocalisation of the negative charge (conjugation)') },
        {
          p: t('Karboksilato jone $p,π$ konjugacija išlygina krūvį: jis lygiai pasidalija dviem deguonies atomams, todėl abiejų $C–O$ ryšių ilgis vienodas. Kuo daugiau rezonansinių formulių galime užrašyti, tuo labiau krūvis išsklaidytas ir tuo stabilesnis anijonas.',
            'In the carboxylate anion, $p,π$ conjugation shares the negative charge equally between two oxygen atoms, and both $C–O$ bonds have the same length. The more resonance structures can be drawn, the more the charge is delocalised and the more stable the anion.'),
          src: 'L4 p17, T p34'
        },
        { resonance: [{ smi: 'CC(=O)[O-]' }, { smi: 'CC([O-])=O' }], caption: t('Acetato anijonas: dvi lygiavertės rezonansinės formulės.', 'The acetate anion: two equivalent resonance structures.'), src: 'L4 p17' },
        {
          p: t('Tas pats su fenoksidu: krūvis pasiskirsto žiede ($pKa$ 9,9), o alkoksido krūvis lieka ant vieno deguonies (etanolis 16). Pentan-2,4-dione ($pKa$ 9,0) anijono krūvis delokalizuotas per dvi $C=O$ grupes, todėl šis $C–H$ junginys rūgštesnis už fenolį, o acetonas, turintis vieną $C=O$ grupę, yra daug silpnesnė rūgštis (19,3).',
            'The same holds for phenoxide: the charge is spread over the ring ($pKa$ 9.9), while the alkoxide charge stays on one oxygen (ethanol 16). In pentane-2,4-dione ($pKa$ 9.0) the anion charge is delocalised over two $C=O$ groups, so this $C–H$ compound is more acidic than phenol, whereas acetone with a single $C=O$ group is a much weaker acid (19.3).'),
          src: 'L4 p11'
        },
        { resonance: [{ smi: '[O-]c1ccccc1' }, { smi: 'O=C1C=CC=C[CH-]1' }, { smi: 'O=C1C=C[CH-]C=C1' }], caption: t('Fenoksido anijonas: krūvis pasiekia o- ir p- padėtis.', 'The phenoxide anion: the charge reaches the ortho and para positions.'), src: 'L4 p11' },
        { resonance: [{ smi: 'CC(=O)[CH-]C(C)=O' }, { smi: 'CC([O-])=CC(C)=O' }], caption: t('Pentan-2,4-diono anijonas: krūvis dalijasi tarp anglies ir deguonies.', 'The pentane-2,4-dione anion: the charge is shared between carbon and oxygen.'), src: 'L4 p11' },
        { h: t('2. Rūgštinio centro atomas: elektrinis neigiamumas ir dydis', '2. The atom of the acidic centre: electronegativity and size') },
        {
          p: t('Didėjant atomo elektriniam neigiamumui, didėja gebėjimas išlaikyti neigiamą krūvį, todėl O–H rūgštys stipresnės už N–H rūgštis, o šios – už C–H rūgštis. Nesočiuosiuose junginiuose C–H rūgštingumas dėl hibridizacijos didesnis: anglies elektrinis neigiamumas yra apie 2,5 ($sp^3^$), 2,8 ($sp^2^$) ir 3,1 ($sp$). Todėl acetilenas ir jo dariniai jau yra rūgštys.',
            'As the electronegativity of the atom rises, so does its ability to hold a negative charge, so O–H acids are stronger than N–H acids and these are stronger than C–H acids. In unsaturated compounds the C–H acidity is raised by hybridisation: the electronegativity of carbon is about 2.5 ($sp^3^$), 2.8 ($sp^2^$) and 3.1 ($sp$). That is why acetylene and its derivatives already behave as acids.'),
          src: 'L4 p18, T p34'
        },
        { scheme: { items: [M('CC#C'), PLUS, M('[NH2-]'), EQ, M('CC#[C-]'), PLUS, M('N')] }, caption: t('Propinas su amido jonu ($NaNH2$): $pKa$ 25 < 38, pusiausvyra pasislinkusi į dešinę.', 'Propyne with the amide ion ($NaNH2$): $pKa$ 25 < 38, so the equilibrium lies to the right.'), src: 'L4 p18, p11' },
        {
          p: t('Atomui didėjant, jo elektrinis neigiamumas silpnėja, tačiau poliarizuojamumas auga, o didesnis atomas neigiamą krūvį išskleidžia platesnėje erdvėje. Dėl to $RSH$ rūgštingesni už alkoholius $ROH$, o $RS-$ stabilesnis už $RO-$.',
            'As atoms get larger their electronegativity falls but their polarisability rises: the negative charge is spread over a larger volume. Therefore thiols ($RSH$) are stronger acids than alcohols, and $RS-$ is more stable than $RO-$.'),
          src: 'L4 p19, T p34'
        },
        {
          rule: t('Rūgštingumas didėja eilėje: C–H rūgštys < N–H rūgštys < O–H rūgštys < S–H rūgštys (didėja anijonų stabilumas).',
            'Acidity rises in the series: C–H acids < N–H acids < O–H acids < S–H acids (the stability of the anions rises).'),
          src: 'L4 p19'
        },
        { h: t('3. Pakaito prigimtis', '3. The nature of the substituent') },
        {
          p: t('Alkilgrupė – elektronų donoras (+I): didėjant alkilo ilgiui ir šakotumui, rūgštingumas mažėja (dar ir dėl silpnesnės anijoną stabilizuojančios solvatacijos). Elektronų akceptoriniai pakaitai (−I) išskleidžia neigiamą krūvį, anijonas tampa stabilesnis, o rūgštis stipresnė; donoriniai pakaitai veikia priešingai.',
            'An alkyl group is an electron donor (+I): as the alkyl group gets longer and more branched, the acidity falls (also because solvation, which stabilises the anion, becomes weaker). Electron-acceptor substituents (−I) draw away the negative charge, stabilise the anion and raise the acidity; donors lower it.'),
          src: 'L4 p20-21, T p35'
        },
        {
          table: {
            head: [t('Rūgštis', 'Acid'), f('pKa'), t('Rūgštis', 'Acid'), f('pKa')],
            rows: [[M('C(=O)O'), nt(3.7), M('OC(=O)CF'), nt(2.66)], [M('CC(=O)O'), nt(4.75), M('OC(=O)CCl'), nt(2.81)], [M('CC(C)(C)C(=O)O'), nt(5.0), M('OC(=O)CBr'), nt(2.86)], [M('OC(=O)c1ccccc1'), nt(4.2), M('OC(=O)CI'), nt(3.15)]]
          },
          caption: t('Kairėje: alkilo ir fenilo įtaka; dešinėje: halogeno įtaka acto rūgščiai.', 'Left: the effect of alkyl and phenyl; right: the effect of a halogen on acetic acid.'), src: 'L4 p20, p22; T p35'
        },
        {
          p: t('Halogenų poveikį lemia jų elektrinis neigiamumas (−I efektas), o ne dydis: fluoracto rūgštis stipriausia. Efektas silpnėja tolstant nuo karboksilo grupės.',
            'The effect of the halogens comes from their electronegativity (the −I effect), not from their size: fluoroacetic acid is the strongest. The effect fades with distance from the carboxyl group.'),
          src: 'L4 p21-22'
        },
        {
          table: {
            head: [t('Rūgštis', 'Acid'), f('pKa')],
            rows: [[M('CCCC(Br)C(=O)O'), nt(2.97)], [M('CCC(Br)CC(=O)O'), nt(4.01)], [M('CC(Br)CCC(=O)O'), nt(4.59)], [M('BrCCCCC(=O)O'), nt(4.71)], [M('CCCCC(=O)O'), nt(4.82)]]
          },
          caption: t('Bromo padėtis pentano rūgštyje: kuo toliau nuo karboksilo grupės, tuo silpnesnis poveikis.', 'The position of bromine in pentanoic acid: the farther from the carboxyl group, the weaker the effect.'),
          src: 'L4 p22'
        },
        {
          table: {
            head: [t('Rūgštis', 'Acid'), f('pKa'), t('Rūgštis', 'Acid'), f('pKa')],
            rows: [[M('C'), nt(40), M('C(Cl)(Cl)Cl'), nt(15.7)]]
          },
          caption: t('Chloras (−I) padaro C–H rūgštį daug stipresnę: metanas ir chloroformas. Skaidrės reikšmės apytikslės: tikrasis chloroformo pKa didesnis, tačiau kryptis ($−I$ didina rūgštingumą) ta pati.', 'Chlorine (−I) makes a C–H acid much stronger: methane and chloroform. The slide values are approximate; the real pKa of chloroform is higher, but the trend ($−I$ raises acidity) is the same.'),
          src: 'L4 p21, T p35'
        },
        {
          p: t('Aromatinė karboksirūgštis (benzenkarboksirūgštis, 4,2) šiek tiek stipresnė už alifatinę (4,75): neigiamas krūvis gali delokalizuotis žiede. Tai pat galioja pakaitams žiedo $p$-padėtyje: akceptoriniai (nitro, chloras) rūgštingumą didina, donoriniai (alkilas, alkoksi) mažina.',
            'An aromatic carboxylic acid (benzoic acid, 4.2) is slightly stronger than an aliphatic one (4.75): the negative charge can be delocalised into the ring. The same direction holds for substituents in the $p$ position of the ring: acceptors (nitro, chlorine) raise the acidity, donors (alkyl, alkoxy) lower it.'),
          src: 'T p35, L4 p21, p23'
        },
        { h: t('4. Tirpiklis', '4. The solvent') },
        {
          p: t('Anijonus stabilizuoja solvatacija – tirpiklio gebėjimas apgaubti jonus. Todėl rūgščių stiprumas skirtinguose tirpikliuose gali skirtis; visos šiame skyriuje pateiktos $pKa$ reikšmės yra vandens tirpalui.',
            'Anions are stabilised by solvation, the ability of the solvent to surround ions. The strength of acids can therefore differ between solvents; every $pKa$ value in this unit is for aqueous solution.'),
          src: 'L4 p16, T p35'
        },
        {
          pitfall: t('Halogeno dydis ir elektrinis neigiamumas veikia skirtingai. Eilėje $HF < HCl < HBr < HI$ rūgštingumą didina atomo dydis, o pakaitų acto rūgštyje – elektrinis neigiamumas (−I), todėl $FCH2COOH$ stipresnė už $ICH2COOH$. Taip pat nelyginkite O–H karboksirūgšties su tioliu pagal eilę O–H < S–H: ta eilė taikoma panašioms struktūroms (alkoholiai ir tioliai), o karboksilato rezonansas rūgštį labai sustiprina.',
            'Size and electronegativity of a halogen act differently. In the series $HF < HCl < HBr < HI$ the atom size raises the acidity, but for substituents in acetic acid electronegativity (−I) decides, so $FCH2COOH$ is stronger than $ICH2COOH$. Also do not compare an O–H carboxylic acid with a thiol using the series O–H < S–H: that series applies to similar structures (alcohols and thiols), and the resonance of carboxylate strengthens the acid a great deal.')
        },
        {
          example: {
            q: [{ p: t('Išdėstykite rūgštingumo mažėjimo eile: tret-butanolį, etanolį, fenolį ir acto rūgštį. Paaiškinkite.', 'Arrange in order of decreasing acidity: tert-butyl alcohol, ethanol, phenol and acetic acid. Explain.') },
              { mol: [{ smi: 'CC(C)(C)O' }, { smi: 'CCO' }, { smi: 'Oc1ccccc1' }, { smi: 'CC(=O)O' }] }],
            steps: [
              [{ p: t('Visos keturios yra O–H rūgštys, todėl lemia konjuguotosios bazės stabilumas. Nubraižykime anijonus.', 'All four are O–H acids, so the stability of the conjugate base decides. Draw the anions.') }],
              [{ p: t('Acetatas turi dvi rezonansines formules (krūvis dviejuose O), fenoksido krūvis pasiskirsto žiede, o alkoksidų krūvis lieka ant vieno deguonies.', 'Acetate has two resonance structures (charge on two O atoms), phenoxide spreads the charge over the ring, while the alkoxide charge stays on one oxygen.') }],
              [{ p: t('Tarp alkoholių tret-butoksidą labiausiai destabilizuoja trys metilgrupės (+I, sunkesnė solvatacija), todėl tret-butanolis – silpniausia rūgštis.', 'Among the alcohols, tert-butoxide is destabilised most by three methyl groups (+I, harder solvation), so tert-butyl alcohol is the weakest acid.') }],
              [{ p: t('Eilė: acto rūgštis (4,75) > fenolis (9,9) > etanolis (16) > tret-butanolis (18).', 'Order: acetic acid (4.75) > phenol (9.9) > ethanol (16) > tert-butyl alcohol (18).') }]
            ]
          },
          claims: [{ name: ['CC(C)(C)O', t('2-metil-2-propanolis', '2-methylpropan-2-ol')] }, { name: ['CCO', t('etanolis', 'ethanol')] }, { name: ['Oc1ccccc1', t('fenolis', 'phenol')] }, { name: ['CC(=O)O', t('etano rūgštis', 'ethanoic acid')] }],
          src: 'L4 p11, p16-17'
        },
        { practice: 'u04.order' },
        { practice: 'u04.rank' },
        { practice: 'u04.proton' }
      ]
    },

    /* ------------------------------------------------------------ 4 */
    {
      id: 'bases',
      title: t('Brionstedo bazės ir bazingumas', 'Brønsted bases and basicity'),
      blocks: [
        { h: t('Kas gali būti Brionstedo bazė', 'What can be a Brønsted base') },
        {
          p: t('Kad prisijungtų protoną, bazei reikia elektronų poros. Tai gali būti $π$ ryšio elektronai arba heteroatomo (daugiausia O, N, S ar halogeno) laisvoji pora. Alkenų, dienų ir arenų baziniai centrai yra $π$ elektronai; jie sudaro labai silpnas bazes, nes protoną jungianti pora nėra laisva, ir susidaro tik trumpalaikiai $π$-kompleksai.',
            'To form a covalent bond with a proton, a base must have either $π$ electrons or a lone pair (most often on the heteroatoms O, N, S or on halogens). In alkenes, dienes and arenes the basic centre is the $π$ electrons: these are very weak bases because the electron pair that binds the proton is not free; only short-lived $π$ complexes form.'),
          src: 'L4 p25, T p35'
        },
        { scheme: { items: [M('C=C'), PLUS, M('[H+]'), { arrow: '⇌', above: t('π-kompleksas', 'π complex') }, M('C=C.[H+]')] }, caption: t('Etenas ir protonas: $π$-kompleksas, naujas $σ$ ryšys nesusidaro.', 'Ethene and a proton: a $π$ complex, no new $σ$ bond forms.'), src: 'L4 p25' },
        { scheme: { items: [M('c1ccccc1'), PLUS, M('[H+]'), { arrow: '⇌', above: t('π-kompleksas', 'π complex') }, M('c1ccccc1.[H+]')] }, caption: t('Benzenas elgiasi panašiai.', 'Benzene behaves in a similar way.'), src: 'L4 p25' },
        {
          p: t('Bazės su laisvąja elektronų pora skirstomos pagal bazinio centro atomą: amonio ($:N$), oksonio ($:O$) ir sulfonio ($:S$).',
            'Bases with a lone pair are grouped by the atom of the basic centre: ammonium type ($:N$), oxonium type ($:O$) and sulfonium type ($:S$).'),
          src: 'L4 p26-27, T p35-36'
        },
        {
          table: {
            head: [t('Bazinis centras', 'Basic centre'), t('Junginiai', 'Compounds')],
            rows: [
              [t('amonio ($:N$)', 'ammonium type ($:N$)'), t('aminai $RNH2$ (pirminiai), $R2NH$ (antriniai) ir $R3N$ (tretiniai), tiek alifatiniai, tiek aromatiniai; nitrilai $RCN$; heterociklai su azotu', 'primary, secondary and tertiary amines $RNH2$, $R2NH$, $R3N$, aliphatic and aromatic; nitriles $RCN$; nitrogen heterocycles')],
              [t('oksonio ($:O$)', 'oxonium type ($:O$)'), t('aldehidai ir ketonai, alkoholiai $ROH$, eteriai $ROR$, rūgščių dariniai $RCOX$ ($X$ = OR, $NH2$, Hal)', 'alcohols $ROH$, ethers $ROR$, aldehydes, ketones, acid derivatives $RCOX$ ($X$ = OR, $NH2$, Hal)')],
              [t('sulfonio ($:S$)', 'sulfonium type ($:S$)'), t('tioliai $RSH$, sulfidai $RSR$', 'thiols $RSH$, sulfides $RSR$')]
            ]
          },
          src: 'L4 p26-27'
        },
        { mol: [{ smi: 'CN', name: t('metanaminas', 'methanamine'), opts: { lonePairs: [1] } }, { smi: 'CCO', name: t('etanolis', 'ethanol'), opts: { lonePairs: [2] } }, { smi: 'CCS', name: t('etantiolis', 'ethanethiol'), opts: { lonePairs: [2] } }], caption: t('Bazinis centras – heteroatomo laisvoji elektronų pora.', 'The basic centre is a lone pair on the heteroatom.') },
        { h: t('Bazingumo matas', 'The measure of basicity') },
        {
          p: t('Bazės $B$ stiprumui apibūdinti naudojama pKa jos konjuguotosios rūgšties $B+–H$. Metilamino bazingumo matas – metilamonio jono $pKa = 10,62$.',
            'The strength of a base $B$ is described by the pKa of its conjugate acid $B+–H$. The measure of the basicity of methylamine is the $pKa = 10.62$ of the methylammonium ion.'),
          src: 'L4 p28, T p36'
        },
        { scheme: { items: [M('CN'), PLUS, M('O'), EQ, M('C[NH3+]'), PLUS, M('[OH-]')] }, caption: t('Metilaminas vandenyje; konjuguotosios rūgšties $pKa = 10,62$.', 'Methylamine in water; the conjugate acid has $pKa = 10.62$.'), src: 'L4 p28' },
        {
          rule: t('Bazė tuo stipresnė, kuo didesnė jos konjuguotosios rūgšties pKa.', 'The larger the pKa of the conjugate acid, the stronger the base.'),
          src: 'L4 p28, T p36'
        },
        { h: t('Kas lemia bazės stiprumą', 'What decides the strength of a base') },
        {
          p: t('Bazės stiprumą lemia bazinio atomo elektrinis neigiamumas: elektroneigiamesnis atomas tvirčiau laiko savo laisvąją porą, todėl ją atiduoda nenoriai ir bazė silpnesnė. Taigi $:O$ bazės silpnesnės už $:N$ bazes. Siera dar silpnesnė: jos atomas didesnis ir labiau poliarizuojamas, laisvoji pora pasklidusi didesniame tūryje (mažesnis tankis), todėl protoną ji jungia sunkiau.',
            'The higher the electronegativity of the atom of the basic centre, the more tightly it holds the lone pair and the weaker the base. So oxonium-type bases are weaker than ammonium-type bases. Sulfonium-type bases are weaker than oxonium-type ones because the greater polarisability of the S atom spreads the lone pair out (a lower density in space), so it binds a proton less readily.'),
          src: 'L4 p29, T p36'
        },
        { rule: t('Bazingumas mažėja eilėje: $:N$ > $:O$ > $:S$.', 'Basicity falls in the series: $:N$ > $:O$ > $:S$.'), src: 'L4 p29' },
        { h: t('Pakaitų įtaka: aminai ir anilinai', 'The effect of substituents: amines and anilines') },
        {
          p: t('Bazingumą didina elektronų donorai, o akceptoriai jį mažina. Fenilgrupė yra akceptorius: azoto laisvoji elektronų pora delokalizuojasi benzeno žiede, todėl anilinas daug silpnesnė bazė už amoniaką, o kiekviena papildoma fenilgrupė bazingumą dar sumažina.',
            'Electron-donor substituents raise the basicity, acceptors lower it. A phenyl group is an acceptor: the lone pair of nitrogen is delocalised into the benzene ring, so aniline is a much weaker base than ammonia, and each further phenyl group lowers the basicity again.'),
          src: 'L4 p30, T p36'
        },
        {
          table: {
            head: [t('Bazė', 'Base'), t('Konjuguotosios rūgšties pKa', 'pKa of the conjugate acid')],
            rows: [[M('CN'), nt(10.62)], [M('N'), nt(9.26)], [M('Nc1ccccc1'), nt(4.6)], [M('c1ccccc1Nc1ccccc1'), nt(0.9)], [M('c1ccc(cc1)N(c1ccccc1)c1ccccc1'), t('< 0', '< 0')]]
          },
          src: 'L4 p28, p30'
        },
        { resonance: [{ smi: 'Nc1ccccc1' }, { smi: '[NH2+]=C1C=CC=C[CH-]1' }], caption: t('Anilino azoto laisvoji pora konjuguoja su žiedu: dalis elektronų tankio pereina žiedui.', 'The nitrogen lone pair of aniline is conjugated with the ring: part of the electron density moves into the ring.'), src: 'L4 p30' },
        {
          p: t('Pakaitai benzeno žiede veikia panašiai. Nitrogrupė ištraukia elektronų tankį ($−M$ ir $−I$), chloras mažina jį ($−I$), alkilgrupė ($+I$) ir alkoksigrupė ($+M$) elektronų tankį didina. Bazingumas didėja eilėje: 4-nitroanilinas < anilinas < 4-metilanilinas < 4-metoksianilinas. Palyginant du donorus: $p$-padėtyje alkoksigrupė savo deguonies laisvąja pora perduoda elektronų tankį per žiedą tiesiai azotui ($+M$, jis viršija jos $−I$), o alkilgrupė stumia elektronus tik silpnai ($+I$), todėl 4-metoksianilinas bazingesnis už 4-metilaniliną. Alifatinio azoto pora nedelokalizuota žiede, todėl etanaminas bazingesnis už visus anilinus.',
            'Substituents on the benzene ring act in the same way. The nitro group draws electron density away ($−M$ and $−I$), chlorine reduces it ($−I$), the alkyl group ($+I$) and the alkoxy group ($+M$) increase it. In order of increasing basicity: 4-nitroaniline < aniline < 4-methylaniline < 4-methoxyaniline. Comparing two donors: in the $p$ position an alkoxy group pushes an oxygen lone pair through the ring straight to nitrogen ($+M$, which outweighs its $−I$), whereas an alkyl group pushes electrons only weakly ($+I$), so 4-methoxyaniline is a stronger base than 4-methylaniline. The lone pair of an aliphatic amine is not delocalised into a ring, so ethanamine is a stronger base than any aniline.'),
          src: 'L4 p30, S2.21'
        },
        { resonance: [{ smi: 'Nc1ccc(cc1)[N+](=O)[O-]' }, { smi: '[NH2+]=C1C=CC(=[N+]([O-])[O-])C=C1' }], caption: t('4-nitroanilinas: laisvoji pora delokalizuojasi iki nitrogrupės (−M), todėl bazingumas dar mažesnis.', '4-nitroaniline: the lone pair is delocalised as far as the nitro group (−M), so the basicity is lower still.'), src: 'S2.21, L3 p10' },
        {
          p: t('Tos pačios taisyklės galioja anijonams, bet anijonai paprastai yra stipresnės bazės už atitinkamas neutralias molekules: $NH2-$ > $NH3$, $RO-$ > $ROH$, $RS-$ > $RSH$, $HO-$ > $H2O$.',
            'All the regularities for neutral bases also hold for anions, but anions are usually stronger bases than neutral molecules: $NH2-$ > $NH3$, $RO-$ > $ROH$, $RS-$ > $RSH$, $HO-$ > $H2O$.'),
          src: 'L4 p31, T p36-37'
        },
        {
          pitfall: t('Bazės „pKa“ visada reiškia jos konjuguotosios rūgšties pKa. Skaičius „4,6 anilinui“ – tai anilinio jono rūgštingumas, o ne paties anilino. Didelė šios reikšmės vertė reiškia stiprią bazę, o mažos pKa rūgštis – stiprią rūgštį: nesupainiokite krypčių.',
            'The “pKa” of a base always means the pKa of its conjugate acid. The number “4.6 for aniline” is the acidity of the anilinium ion, not of aniline itself. A large value means a strong base, whereas a small pKa means a strong acid: do not mix up the directions.')
        },
        {
          example: {
            q: [{ p: t('Kuri bazė stipresnė: etanaminas ar anilinas? Paaiškinkite.', 'Which is the stronger base: ethanamine or aniline? Explain.') },
              { mol: [{ smi: 'CCN' }, { smi: 'Nc1ccccc1' }] }],
            steps: [
              [{ p: t('Abi yra amonio tipo bazės (bazinis centras $:N$), todėl lemia azoto elektronų tankis.', 'Both are ammonium-type bases (basic centre $:N$), so the electron density on nitrogen decides.') }],
              [{ p: t('Etilgrupė donorinė (+I), ji didina elektronų tankį ant azoto, panašiai kaip metilamine (konjuguotosios rūgšties pKa 10,62).', 'The ethyl group is a donor (+I) and raises the electron density on nitrogen, as in methylamine (conjugate acid pKa 10.62).') }],
              [{ p: t('Anilino azoto pora delokalizuota žiede ($pKa$ 4,6), todėl jis daug silpnesnė bazė. Stipresnė bazė – etanaminas.', 'The nitrogen pair of aniline is delocalised into the ring ($pKa$ 4.6), so it is a much weaker base. The stronger base is ethanamine.') }]
            ]
          },
          claims: [{ name: ['CCN', t('etanaminas', 'ethanamine')] }],
          src: 'L4 p28, p30'
        },
        { practice: 'u04.basic' },
        { practice: 'u04.basecentre' }
      ]
    },

    /* ------------------------------------------------------------ 5 */
    {
      id: 'amphoteric',
      title: t('Amfoteriniai junginiai', 'Amphoteric compounds'),
      blocks: [
        { h: t('Rūgštis ir bazė viename junginyje', 'Acid and base in one compound') },
        {
          p: t('Amfoteriniais vadinami junginiai, kuriuose yra ir rūgštinis, ir bazinis centras. Pavyzdžiui, vanduo ir alkoholiai gali būti silpnos rūgštys (atiduoda $O–H$ protoną) ir silpnos bazės (deguonies pora jungia protoną). Kokį vaidmenį jie atliks, lemia partneris.',
            'Some compounds show both acidic and basic properties; they are amphoteric. Water and alcohols can react both as weak acids (they give up the $O–H$ proton) and as weak bases (the lone pair on oxygen binds a proton). Which role they take depends on the partner.'),
          src: 'L4 p33, S2.16'
        },
        {
          mech: [{
            scheme: { items: [M('CO', { lonePairs: [1] }), PLUS, M('Cl', { allH: true })] },
            arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
            note: t('Su stipria rūgštimi $HCl$ metanolis yra bazė: deguonies pora prisijungia protoną.', 'With the strong acid $HCl$ methanol is a base: the oxygen lone pair takes up the proton.')
          }],
          src: 'S2.16'
        },
        { scheme: { items: [M('CO'), PLUS, M('Cl'), EQ, M('C[OH2+]'), PLUS, M('[Cl-]')] }, caption: t('Metanolis kaip bazė: susidaro metiloksonio jonas.', 'Methanol as a base: the methyloxonium ion forms.'), src: 'S2.16' },
        {
          mech: [{
            scheme: { items: [M('CO', { allH: true }), PLUS, M('[NH2-]', { lonePairs: true })] },
            arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H1' } }, { from: { m: 0, b: [1, 'H1'] }, to: { m: 0, a: 1 } }],
            note: t('Su stipria baze $NaNH2$ metanolis yra rūgštis: atiduoda $O–H$ protoną.', 'With the strong base $NaNH2$ methanol is an acid: it gives up the $O–H$ proton.')
          }],
          src: 'S2.16'
        },
        { scheme: { items: [M('CO'), PLUS, M('[NH2-]'), EQ, M('C[O-]'), PLUS, M('N')] }, caption: t('Metanolis kaip rūgštis: susidaro metoksidas (pKa 15,6 < 38).', 'Methanol as an acid: methoxide forms (pKa 15.6 < 38).'), src: 'S2.16, S2.23, L4 p11' },
        {
          p: t('Aminorūgštyse yra ir rūgštinis (karboksilo), ir bazinis (amino) centras, todėl jos egzistuoja vidinių druskų – dvigubųjų jonų – pavidalu.',
            'Amino acids have both an acidic (carboxyl) and a basic (amino) centre, so they exist as internal salts, the zwitterions.'),
          src: 'L4 p33, T p37'
        },
        { scheme: { items: [M('CC(N)C(=O)O'), EQ, M('CC([NH3+])C(=O)[O-]')] }, caption: t('Alaninas: $COOH$ – rūgštinis centras, $NH2$ – bazinis centras; dešinėje – vidinė druska.', 'Alanine: $COOH$ is the acidic centre, $NH2$ the basic centre; on the right the internal salt.'), src: 'L4 p33' },
        {
          p: t('Net stiprios rūgštys gali būti bazėmis dar stipresnės rūgšties atžvilgiu. Sieros rūgštis atiduoda protoną azoto rūgščiai: azoto rūgštis čia yra bazė. Gauta protonuota azoto rūgštis praranda vandenį ir susidaro nitronio jonas $NO2+$ – aromatinio nitrinimo elektrofilas.',
            'Even strong acids can be bases toward a still stronger acid. Sulfuric acid gives a proton to nitric acid: nitric acid is the base here. The protonated nitric acid loses water, and the nitronium ion $NO2+$ forms, the electrophile of aromatic nitration.'),
          src: 'L4 p5'
        },
        {
          mech: [
            {
              scheme: { items: [M('O[N+](=O)[O-]', { lonePairs: [0] }), PLUS, M('OS(=O)(=O)O', { allH: true })] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 stadija: protonavimas. Azoto rūgštis – bazė, sieros rūgštis – rūgštis.', 'Stage 1: protonation. Nitric acid is the base, sulfuric acid the acid.')
            },
            {
              scheme: { items: [M('[O-][N+](=O)[OH2+]', { lonePairs: [0] })] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, mid: [0, 1] } }, { from: { m: 0, b: [1, 3] }, to: { m: 0, a: 3 } }],
              note: t('2 stadija: išeina vanduo, susidaro $N=O$ ryšys.', 'Stage 2: water leaves and an $N=O$ bond forms.')
            }
          ],
          src: 'L4 p5'
        },
        { scheme: { items: [M('[O-][N+](=O)[OH2+]'), { arrow: '→' }, M('O=[N+]=O'), PLUS, M('O')] }, caption: t('Nitronio jonas ir vanduo.', 'The nitronium ion and water.'), src: 'L4 p5' },
        { p: t('Sieros rūgštis gali protonuoti ir kitą sieros rūgšties molekulę: viena molekulė yra bazė, kita – rūgštis; gautas $H3SO4+$ praranda vandenį ir susidaro $HSO3+$.', 'Sulfuric acid can also protonate another molecule of sulfuric acid: one molecule is the base, the other the acid; the $H3SO4+$ formed loses water and $HSO3+$ forms.'), src: 'L4 p5' },
        {
          mech: [
            {
              scheme: { items: [M('OS(=O)(=O)O', { lonePairs: [0] }), PLUS, M('OS(=O)(=O)O', { allH: true })] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 stadija: protonavimas. Viena sieros rūgšties molekulė – bazė, kita – rūgštis.', 'Stage 1: protonation. One sulfuric acid molecule is the base, the other the acid.')
            },
            {
              scheme: { items: [M('OS(=O)(=O)[OH2+]', { lonePairs: [0] })] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, mid: [0, 1] } }, { from: { m: 0, b: [1, 4] }, to: { m: 0, a: 4 } }],
              note: t('2 stadija: išeina vanduo, susidaro $HSO3+$.', 'Stage 2: water leaves and $HSO3+$ forms.')
            }
          ],
          src: 'L4 p5'
        },
        { scheme: { items: [M('OS(=O)(=O)[OH2+]'), { arrow: '→' }, M('O[S+](=O)=O'), PLUS, M('O')] }, caption: t('$HSO3+$ ir vanduo.', '$HSO3+$ and water.'), src: 'L4 p5' },
        {
          pitfall: t('„Amfoterinis“ nereiškia „neutralus“. Junginio vaidmenį kiekvienoje reakcijoje lemia partneris: su stipresne rūgštimi jis bazė, su stipresne baze – rūgštis. Palyginkite pKa, o ne „įsimink“ vaidmenį.',
            '“Amphoteric” does not mean “neutral”. The role of the compound in each reaction is set by its partner: with a stronger acid it is a base, with a stronger base it is an acid. Compare the pKa values instead of memorising a role.')
        },
        {
          example: {
            q: [{ p: t('Kokį vaidmenį vaidina vanduo reakcijoje su $NH3$ ir kokį reakcijoje su $HCl$?', 'What role does water play in the reaction with $NH3$ and what role in the reaction with $HCl$?') }],
            steps: [
              [{ p: t('Su amoniaku ($NH4+$ pKa 9,26): vandens pKa 15,7 didesnė, todėl vanduo – rūgštis, atiduodanti protoną amoniakui. Susidaro $NH4+$ ir $OH-$.', 'With ammonia ($NH4+$ pKa 9.26): the pKa of water, 15.7, is larger, so water is the acid and gives a proton to ammonia. $NH4+$ and $OH-$ form.') }],
              [{ p: t('Su $HCl$ (pKa −7): $HCl$ daug stipresnė rūgštis, todėl vanduo – bazė ir prisijungia protoną. Susidaro $H3O+$ ir $Cl-$.', 'With $HCl$ (pKa −7): $HCl$ is a far stronger acid, so water is the base and takes up the proton. $H3O+$ and $Cl-$ form.') }]
            ]
          },
          claims: [{ formula: ['[NH4+]', 'NH4+'] }, { formula: ['[OH3+]', 'H3O+'] }],
          src: 'L4 p3, p11'
        },
        { practice: 'u04.amph' }
      ]
    },

    /* ------------------------------------------------------------ 6 */
    {
      id: 'direction',
      title: t('Rūgščių ir bazių reakcijos: pusiausvyros kryptis', 'Acid-base reactions: the direction of the equilibrium'),
      blocks: [
        { h: t('Reakcija vyksta į silpnesnės rūgšties pusę', 'The reaction goes to the side of the weaker acid') },
        {
          p: t('Šias reakcijas valdo termodinamika: pusiausvyra pasislenka ten, kur produktai stabilesni, t. y. turi mažesnę potencinę energiją. Mažiau energijos turi silpnesnė rūgštis su silpnesne baze, o stipresnė pora yra energingesnė.',
            'Acid-base reactions are under thermodynamic control: they proceed so that more stable products (of lower potential energy) form. A weaker acid and a weaker base are more stable than a stronger acid and a stronger base.'),
          src: 'L4 p36, T p37'
        },
        {
          rule: t('Kryptis: į silpnesnės rūgšties ir silpnesnės bazės pusę. Praktiškai lyginamos dviejų rūgščių pKa: pusiausvyra pasislinkusi į rūgšties su didesne pKa pusę.',
            'An acid-base reaction goes toward a weaker acid and a weaker base. In practice, compare the pKa of the two acids: the equilibrium lies on the side of the acid with the larger pKa.'),
          src: 'L4 p36'
        },
        { scheme: { items: [M('CC(=O)O'), PLUS, M('[OH-]'), { arrow: '→' }, M('CC(=O)[O-]'), PLUS, M('O')] }, caption: t('Karboksirūgštis (pKa 3–5) ir hidroksidas: susidaro daug silpnesnė rūgštis vanduo (15,7), reakcija vyksta iki galo.', 'A carboxylic acid (pKa 3–5) and hydroxide: a much weaker acid, water (15.7), forms and the reaction goes to completion.'), src: 'L4 p36, T p37' },
        { scheme: { items: [M('CC(=O)O'), PLUS, M('N'), EQ, M('CC(=O)[O-]'), PLUS, M('[NH4+]')] }, caption: t('Acto rūgštis (4,75) ir amoniakas: dešinėje silpnesnė rūgštis $NH4+$ (9,26), pusiausvyra – į dešinę.', 'Acetic acid (4.75) and ammonia: the weaker acid $NH4+$ (9.26) is on the right, so the equilibrium lies to the right.'), src: 'L4 p37' },
        { scheme: { items: [M('CCO'), PLUS, M('CN'), EQ, M('CC[O-]'), PLUS, M('C[NH3+]')] }, caption: t('Etanolis (16) ir metilaminas: dešinėje stipresnė rūgštis $CH3NH3+$ (10,62), pusiausvyra – į kairę.', 'Ethanol (16) and methylamine: the stronger acid $CH3NH3+$ (10.62) is on the right, so the equilibrium lies to the left.'), src: 'L4 p37 (the slide rounds to 4,8; 9,4; 15,9; 10,7)' },
        {
          p: t('Papildomai (Klein): pusiausvyros konstanta apytiksliai lygi $10^Δ^$, kur $Δ$ – dviejų rūgščių pKa skirtumas. Skirtumas 3–4 vienetai jau reiškia, kad reakcija praktiškai vyksta iki galo.',
            'Extra (Klein): the equilibrium constant is roughly $10^Δ^$, where $Δ$ is the difference between the pKa values of the two acids. A difference of 3–4 units means the reaction practically goes to completion.'),
          src: 'Klein'
        },
        { h: t('Kuri bazė deprotonizuos rūgštį?', 'Which base will deprotonate an acid?') },
        {
          p: t('Bazė deprotonizuoja rūgštį tik tada, kai jos konjuguotoji rūgštis yra silpnesnė už deprotonizuojamą rūgštį. Acetonas ($pKa$ 19,3) su $NaOH$ (vandens pKa 15,7) beveik nereaguoja, o su $NaNH2$ (amoniako pKa 38) reaguoja visiškai.',
            'A base deprotonates an acid only when its own conjugate acid is weaker than the acid being deprotonated. Acetone ($pKa$ 19.3) hardly reacts with $NaOH$ (pKa of water 15.7), but reacts completely with $NaNH2$ (pKa of ammonia 38).'),
          src: 'S2.23, L4 p11'
        },
        {
          mech: [{
            scheme: { items: [M('CC(=O)C', { allH: true, flip: 'y' }), PLUS, M('[NH2-]', { lonePairs: true })] },
            arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H0' } }, { from: { m: 0, b: [0, 'H0'] }, to: { m: 0, a: 0 } }],
            note: t('Amido jonas atima protoną nuo $α$-anglies; $C–H$ elektronai lieka anglies atomui.', 'The amide ion takes a proton from the $α$ carbon; the $C–H$ electrons stay on the carbon atom.')
          }],
          src: 'S2.23, L4 p11'
        },
        { resonance: [{ smi: 'CC(=O)[CH2-]' }, { smi: 'CC([O-])=C' }], caption: t('Gautas anijonas (enolatas) stabilizuotas rezonansu.', 'The anion formed (an enolate) is stabilised by resonance.'), src: 'L4 p11, p17' },
        {
          pitfall: t('Lyginkite dviejų rūgščių pKa: reakcijoje esančios rūgšties ir produkte susidarančios rūgšties. Dažna klaida – lyginti bazės „pKa“ su rūgšties pKa, nors bazės mastas yra jos konjuguotosios rūgšties pKa. Taip pat nesumaišykite krypčių: stipresnė rūgštis reaguoja, silpnesnė lieka.',
            'Compare the pKa of two acids: the acid in the reactants and the acid that forms in the products. A common mistake is to compare the “pKa” of the base with the pKa of the acid, although the measure of a base is the pKa of its conjugate acid. Do not swap the directions either: the stronger acid reacts, the weaker one remains.')
        },
        {
          example: {
            q: [{ p: t('Ar etanolis reaguoja su natrio cianidu pagal šią schemą? Etanolio pKa 16,0, vandenilio cianido 9,31.', 'Does ethanol react with sodium cyanide according to this scheme? The pKa of ethanol is 16.0, that of hydrogen cyanide 9.31.') },
              SC([M('CCO'), PLUS, M('[C-]#N'), { arrow: '→' }, M('CC[O-]'), PLUS, M('C#N')])],
            steps: [
              [{ p: t('Reagentuose rūgštis yra etanolis (16,0), produktuose – $HCN$ (9,31).', 'The acid in the reactants is ethanol (16.0), in the products it is $HCN$ (9.31).') }],
              [{ p: t('$HCN$ stipresnė rūgštis (mažesnė pKa), todėl pusiausvyra pasislinkusi į kairę: reakcija pagal šią schemą praktiškai nevyksta.', '$HCN$ is the stronger acid (smaller pKa), so the equilibrium lies to the left: the reaction as written practically does not take place.') }],
              [{ p: t('Cianidas yra silpnesnė bazė už etoksidą (jo konjuguotoji rūgštis $HCN$ stipresnė už etanolį), todėl cianidas negali deprotonizuoti etanolio.', 'Cyanide is a weaker base than ethoxide (its conjugate acid $HCN$ is stronger than ethanol), so cyanide cannot deprotonate ethanol.') }]
            ]
          },
          src: 'L4 p38'
        },
        { practice: 'u04.dir' },
        { practice: 'u04.deprot' }
      ]
    },

    /* ------------------------------------------------------------ 7 */
    {
      id: 'lewis',
      title: t('Luiso rūgštys ir bazės', 'Lewis acids and bases'),
      blocks: [
        { h: t('Elektronų poros akceptorius ir donoras', 'Electron-pair acceptor and donor') },
        {
          p: t('Luiso teorija bendresnė: rūgštingumą ir bazingumą lemia gebėjimas priimti arba atiduoti elektronų porą, sudarant ryšį. Brionstedo teorija apima tik protonines rūgštis, o Luiso rūgštimi gali būti bet kuris junginys su laisva orbitale.',
            'The Lewis theory is more general: acidity and basicity are set by the ability to accept or give an electron pair when a bond forms. The Brønsted theory applies only to protic acids, whereas a Lewis acid can be any compound that has a vacant orbital.'),
          src: 'L4 p34, T p37'
        },
        {
          rule: t('Elektronų poros akceptorius, turintis laisvą orbitalę (atomas, molekulė ar katijonas), yra Luiso rūgštis (elektrofilas); tokios yra $BF3$, $FeCl3$, $FeBr3$, $AlCl3$, $ZnCl2$, metalų katijonai ir protonas. O dalelė, atiduodanti elektronų porą, yra Luiso bazė (nukleofilas): jai reikia bent vienos valentinių elektronų poros. Luiso bazės sutampa su Brionstedo bazėmis.',
            'A Lewis acid is an electron-pair acceptor (an electrophile): an atom, molecule or cation with a vacant orbital, such as $BF3$, $AlCl3$, $FeCl3$, $FeBr3$, $ZnCl2$, metal cations and the proton. A Lewis base is an electron-pair donor (a nucleophile): it has at least one valence electron pair. Lewis bases are the same as Brønsted bases.'),
          src: 'L4 p34, T p37'
        },
        {
          mech: [{
            scheme: { items: [M('O', { lonePairs: true }), PLUS, M('FB(F)F')] },
            arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }],
            note: t('Vandens deguonies pora sudaro ryšį su boru: susidaro adduktas, nėra nueinančios grupės.', 'A lone pair of the oxygen of water bonds to boron: an adduct forms, there is no leaving group.')
          }],
          src: 'L4 p35'
        },
        { scheme: { items: [M('O'), PLUS, M('FB(F)F'), EQ, M('[OH2+][B-](F)(F)F')] }, caption: t('Vanduo (Luiso bazė) ir boro trifluoridas (Luiso rūgštis).', 'Water (a Lewis base) and boron trifluoride (a Lewis acid).'), src: 'L4 p35' },
        {
          mech: [{
            scheme: { items: [M('[Cl-]', { lonePairs: true }), PLUS, M('Cl[Al](Cl)Cl')] },
            arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }],
            note: t('Chlorido pora užpildo laisvąją aliuminio orbitalę.', 'A lone pair of chloride fills the vacant orbital of aluminium.')
          }],
          src: 'L4 p34'
        },
        { scheme: { items: [M('[Cl-]'), PLUS, M('Cl[Al](Cl)Cl'), { arrow: '→' }, M('Cl[Al-](Cl)(Cl)Cl')] }, caption: t('Tetrachloraliuminatas: $AlCl3$ elgiasi kaip Luiso rūgštis.', 'Tetrachloroaluminate: $AlCl3$ acts as a Lewis acid.'), src: 'L4 p34' },
        {
          p: t('Protonas pats yra Luiso rūgštis, todėl kiekviena Brionstedo rūgščių ir bazių reakcija yra ir Luiso reakcija: vanduo atiduoda elektronų porą protonui ($H+$ iš $HCl$). Priešingai nei Brionstedo, Luiso rūgštis neprivalo turėti protono: $BF3$ jo neturi.',
            'The proton itself is a Lewis acid, so every Brønsted acid-base reaction is also a Lewis reaction: water donates an electron pair to $H+$ (from $HCl$). Unlike a Brønsted acid, a Lewis acid does not need to have a proton: $BF3$ has none.'),
          src: 'L4 p35'
        },
        { scheme: { items: [M('O'), PLUS, M('Cl'), { arrow: '→' }, M('[OH3+]'), PLUS, M('[Cl-]')] }, caption: t('Brionstedo reakcija: protonų pernešimas.', 'A Brønsted reaction: proton transfer.'), src: 'L4 p35' },
        {
          pitfall: t('Luiso rūgštis nebūtinai yra Brionstedo rūgštis ($BF3$, $AlCl3$ neturi protono). Rodyklė rodo elektronų poros judėjimą nuo bazės prie rūgšties; Luiso rūgščių ir bazių reakcija baigiasi adduktu, o Brionstedo – protono perdavimu.',
            'A Lewis acid is not necessarily a Brønsted acid ($BF3$ and $AlCl3$ have no proton). The arrow shows the electron pair moving from the base to the acid; a Lewis acid-base reaction ends with an adduct, a Brønsted one with the transfer of a proton.')
        },
        {
          example: {
            q: [{ p: t('Nustatykite Luiso rūgštį ir bazę reakcijoje tarp amoniako ir boro trifluorido.', 'Identify the Lewis acid and the Lewis base in the reaction between ammonia and boron trifluoride.') },
              SC([M('N'), PLUS, M('FB(F)F'), { arrow: '→' }, M('[NH3+][B-](F)(F)F')])],
            steps: [
              [{ p: t('Azotas turi laisvąją elektronų porą, todėl amoniakas yra Luiso bazė (ir Brionstedo bazė).', 'Nitrogen has a lone pair, so ammonia is a Lewis base (and a Brønsted base).') }],
              [{ p: t('Boras $BF3$ turi tuščią orbitalę (sekstetas), todėl yra Luiso rūgštis – elektronų poros akceptorius.', 'Boron in $BF3$ has a vacant orbital (a sextet), so it is a Lewis acid, an electron-pair acceptor.') }],
              [{ p: t('Azoto pora sudaro $N–B$ ryšį; susidaro adduktas, kuriame azotas teigiamas, boras neigiamas.', 'The nitrogen pair forms an $N–B$ bond; an adduct forms in which nitrogen is positive and boron negative.') }]
            ]
          },
          claims: [{ formula: ['[NH3+][B-](F)(F)F', 'BF3H3N'] }],
          src: 'L4 p34-35'
        },
        { practice: 'u04.lewis' }
      ]
    }
  ];

  /* =====================================================================================================
     BANKS
     ===================================================================================================== */
  const HINT_ARROW = t('Lenktoji rodyklė prasideda nuo elektronų (laisvosios poros arba ryšio) ir baigiasi ten, kur elektronų reikia.', 'A curved arrow starts at electrons (a lone pair or a bond) and ends where electrons are needed.');
  const ROLES4 = [tx('rūgštis', 'acid'), tx('bazė', 'base'), tx('konjuguotoji bazė', 'conjugate base'), tx('konjuguotoji rūgštis', 'conjugate acid')];
  const matchRoles = (prompt, mols, roleIdx, hint, solution) => ({
    prompt, kind: 'match', answer: { left: mols.map((s) => mo(s)), right: ROLES4.slice(), pairs: roleIdx }, hint, solution
  });

  /* ---------- u04.role: who gives and who takes the proton, curved arrows (S2.17) ---------- */
  const ROLE = [
    {
      id: 'u04.role.1',
      q: [{ p: t('Piridinas (organinė bazė) reaguoja su acto rūgštimi. Kokie produktai susidaro?', 'Pyridine (an organic base) reacts with acetic acid. What are the products?') }, SC([M('c1ccncc1'), PLUS, M('CC(=O)O'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite piridino atomą, kuris prisijungia protoną.', 'Tap the atom of pyridine that takes up the proton.'), 'c1ccncc1', [3],
          t('Kurio atomo laisvoji elektronų pora nėra įtraukta į aromatinę $π$ sistemą?', 'Which atom has a lone pair that is not part of the aromatic $π$ system?'),
          t('Azoto atomo (Nr. 4) pora yra žiedo plokštumoje ir $π$ sistemoje nedalyvauja, todėl ji laisva sudaryti ryšį su protonu.', 'The pair on nitrogen (atom no. 4) lies in the plane of the ring and is not part of the $π$ system, so it is free to bond to a proton.')),
        cho(t('Kaip nukreiptos lenktosios rodyklės?', 'How do the curved arrows run?'), [
          tx('Viena – nuo azoto laisvosios poros prie $O–H$ vandenilio, kita – nuo $O–H$ ryšio prie deguonies.', 'One from the lone pair on nitrogen to the $O–H$ hydrogen, the other from the $O–H$ bond to oxygen.'),
          tx('Viena – nuo $O–H$ vandenilio prie azoto, kita – nuo azoto prie deguonies.', 'One from the $O–H$ hydrogen to nitrogen, the other from nitrogen to oxygen.'),
          tx('Viena – nuo karbonilo $π$ ryšio prie azoto, kita – nuo $O–H$ prie anglies.', 'One from the carbonyl $π$ bond to nitrogen, the other from $O–H$ to carbon.'),
          tx('Rodyklių nereikia, nes protonas juda kaip atomas.', 'No arrows are needed because the proton moves as an atom.')], 0, HINT_ARROW,
          [{ p: t('Bazė (azoto pora) puola protoną, o $O–H$ ryšio elektronai lieka deguoniui:', 'The base (the nitrogen pair) attacks the proton and the electrons of the $O–H$ bond stay on oxygen:') },
            { mech: [{ scheme: { items: [M('c1ccncc1', { lonePairs: [3] }), PLUS, M('CC(=O)O', { allH: true })] }, arrows: [{ from: { m: 0, lp: 3 }, to: { m: 1, a: 'H3' } }, { from: { m: 1, b: [3, 'H3'] }, to: { m: 1, a: 3 } }] }] }]),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('c1cc[nH+]cc1.CC(=O)[O-]'), mo('CC(=O)[n+]1ccccc1.[OH-]'), mo('c1ccncc1.CC(=[OH+])O'), tx('Reakcija nevyksta: bazė ir rūgštis nesąveikauja.', 'There is no reaction: base and acid do not interact.')], 0,
          t('Protoną perduoda rūgštis, o jį priima bazė; kokie jonai atsiranda?', 'The acid passes on the proton and the base takes it up; which ions appear?'),
          [{ p: t('Susidaro piridinio acetatas – druska:', 'Pyridinium acetate, a salt, forms:') }, mo('c1cc[nH+]cc1.CC(=O)[O-]')]),
        cho(t('Kuri dalelė yra acto rūgšties konjuguotoji bazė?', 'Which species is the conjugate base of acetic acid?'), [mo('CC(=O)[O-]'), mo('c1cc[nH+]cc1'), mo('c1ccncc1'), mo('CC(=[OH+])O')], 0,
          t('Ieškokite dalelės, kuri nuo acto rūgšties skiriasi vienu protonu.', 'Look for the species that differs from acetic acid by one proton.'),
          t('Acetatas gaunamas iš acto rūgšties atėmus $H+$; piridinio jonas – piridino konjuguotoji rūgštis.', 'Acetate comes from acetic acid by removing $H+$; the pyridinium ion is the conjugate acid of pyridine.'))
      ],
      why: t('Piridinas yra bazė (azoto laisvoji pora žiedo plokštumoje), acto rūgštis – rūgštis. Protonas pereina rūgšties $O–H$ ryšiu prie azoto, susidaro druska. Atkreipkite dėmesį į poras: acto rūgštis ↔ acetatas ir piridinas ↔ piridinio jonas.',
        'Pyridine is the base (the lone pair on nitrogen lies in the plane of the ring) and acetic acid is the acid. The proton moves from the $O–H$ bond to nitrogen and a salt forms. Note the pairs: acetic acid ↔ acetate and pyridine ↔ pyridinium ion.'),
      src: 'S2.17, L4 p4-6',
      claims: [{ formula: ['c1cc[nH+]cc1', 'C5H6N+'] }, { formula: ['CC(=O)[O-]', 'C2H3O2-'] }]
    },
    {
      id: 'u04.role.2',
      q: [{ p: t('Metilaminas reaguoja su druskos rūgštimi.', 'Methylamine reacts with hydrochloric acid.') }, SC([M('CN'), PLUS, M('Cl'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris prisijungia protoną.', 'Tap the atom that takes up the proton.'), 'CN', [1],
          t('Kurio atomo viduje yra laisvoji elektronų pora?', 'Which atom has a lone pair?'), t('Azoto atomas (Nr. 2) turi laisvąją porą ir yra bazinis centras.', 'The nitrogen atom (no. 2) has a lone pair and is the basic centre.')),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('C[NH3+].[Cl-]'), mo('CCl.N'), tx('Reakcija nevyksta, nes abi medžiagos neutralios.', 'No reaction, because both substances are neutral.')], 0,
          t('Aminas yra bazė, $HCl$ – stipri rūgštis. Ar vyks protono perdavimas, ar chlorido puolimas anglies?', 'The amine is a base and $HCl$ a strong acid. Does a proton move, or does chloride attack the carbon?'),
          [{ p: t('Laisvoji azoto pora prisijungia protoną, o $H–Cl$ elektronai lieka chlorui:', 'The lone pair on nitrogen takes the proton and the $H–Cl$ electrons stay on chlorine:') },
            { mech: [{ scheme: { items: [M('CN', { lonePairs: [1] }), PLUS, M('Cl', { allH: true })] }, arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }] }, mo('C[NH3+].[Cl-]')]),
        cho(t('Kuri dalelė yra $HCl$ konjuguotoji bazė?', 'Which species is the conjugate base of $HCl$?'), [mo('[Cl-]'), mo('C[NH3+]'), mo('CN'), mo('Cl')], 0,
          t('Konjuguotąją bazę gauname atėmę protoną.', 'The conjugate base is obtained by removing the proton.'), t('$Cl-$: $HCl$ atidavė $H+$. $CH3NH3+$ yra metilamino konjuguotoji rūgštis.', '$Cl-$: $HCl$ gave away $H+$. $CH3NH3+$ is the conjugate acid of methylamine.'))
      ],
      why: t('Su stipria rūgštimi aminas elgiasi kaip bazė: laisvoji azoto pora prisijungia protoną ir susidaro amonio druska. Susidaro dvi poros: $HCl$ / $Cl-$ ir $CH3NH2$ / $CH3NH3+$.', 'Toward a strong acid an amine acts as a base: the lone pair on nitrogen takes up the proton and an ammonium salt forms. Two pairs appear: $HCl$ / $Cl-$ and $CH3NH2$ / $CH3NH3+$.'),
      src: 'S2.17, L4 p6, p26', claims: [{ formula: ['C[NH3+]', 'CH6N+'] }]
    },
    {
      id: 'u04.role.3',
      q: [{ p: t('Acto rūgštis reaguoja su amoniaku (pKa: $CH3COOH$ 4,75; $NH4+$ 9,26).', 'Acetic acid reacts with ammonia (pKa: $CH3COOH$ 4.75; $NH4+$ 9.26).') }, SC([M('CC(=O)O'), PLUS, M('N'), EQ, M('CC(=O)[O-]'), PLUS, M('[NH4+]')])],
      steps: [
        matchRoles(t('Priskirkite kiekvienai dalelei jos vaidmenį reakcijoje iš kairės į dešinę.', 'Assign each species its role in the reaction read from left to right.'), ['CC(=O)O', 'N', 'CC(=O)[O-]', '[NH4+]'], [0, 1, 2, 3],
          t('Rūgštis atiduoda protoną ir virsta konjuguotąja baze.', 'The acid gives away a proton and becomes its conjugate base.'), t('Acto rūgštis – rūgštis, amoniakas – bazė; acetatas – acto rūgšties konjuguotoji bazė, $NH4+$ – amoniako konjuguotoji rūgštis.', 'Acetic acid is the acid, ammonia the base; acetate is the conjugate base of acetic acid, $NH4+$ the conjugate acid of ammonia.')),
        cho(t('Kuria kryptimi pasislinkusi pusiausvyra?', 'Which way does the equilibrium lie?'), [tx('Į dešinę', 'To the right'), tx('Į kairę', 'To the left')], 0,
          t('Palyginkite kairėje ir dešinėje esančių rūgščių pKa.', 'Compare the pKa of the acids on the left and on the right.'),
          t('Kairėje rūgštis (4,75) stipresnė nei dešinėje esantis $NH4+$ (9,26), todėl gaunama silpnesnė bazė ir silpnesnė rūgštis: pusiausvyra – į dešinę.', 'The acid on the left (4.75) is stronger than $NH4+$ on the right (9.26), so a weaker acid and a weaker base form: the equilibrium lies to the right.'))
      ],
      why: t('Reakcija vyksta į silpnesnės rūgšties ir silpnesnės bazės pusę. Rūgštis ir jos konjuguotoji bazė – viena pora, bazė ir jos konjuguotoji rūgštis – kita.', 'The reaction goes toward the weaker acid and the weaker base. An acid and its conjugate base form one pair, a base and its conjugate acid another.'),
      src: 'L4 p37, p6'
    },
    {
      id: 'u04.role.4',
      q: [{ p: t('Metoksido jonas reaguoja su vandeniu.', 'The methoxide ion reacts with water.') }, SC([M('C[O-]'), PLUS, M('O'), EQ, M('CO'), PLUS, M('[OH-]')])],
      steps: [
        matchRoles(t('Priskirkite dalelėms jų vaidmenis.', 'Assign the species their roles.'), ['C[O-]', 'O', 'CO', '[OH-]'], [1, 0, 3, 2],
          t('Bazė prisijungia protoną ir tampa konjuguotąja rūgštimi.', 'The base takes up a proton and becomes its conjugate acid.'), t('Vanduo – rūgštis (atiduoda protoną), metoksidas – bazė; metanolis – metoksido konjuguotoji rūgštis, hidroksidas – vandens konjuguotoji bazė.', 'Water is the acid (it gives up a proton), methoxide the base; methanol is the conjugate acid of methoxide, hydroxide the conjugate base of water.')),
        cho(t('Kaip nukreiptos lenktosios rodyklės?', 'How do the curved arrows run?'), [
          tx('Nuo metoksido laisvosios poros prie vandens vandenilio ir nuo $O–H$ ryšio prie deguonies.', 'From a lone pair of methoxide to a hydrogen of water, and from the $O–H$ bond to oxygen.'),
          tx('Nuo vandens deguonies prie metoksido anglies.', 'From the oxygen of water to the carbon of methoxide.'),
          tx('Nuo $C–O$ ryšio prie vandens vandenilio.', 'From the $C–O$ bond to a hydrogen of water.')], 0, HINT_ARROW,
          [{ p: t('Bazė $CH3O-$ puola vandens vandenilį:', 'The base $CH3O-$ attacks a hydrogen of water:') },
            { mech: [{ scheme: { items: [M('C[O-]', { lonePairs: [1] }), PLUS, M('O', { allH: true })] }, arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }] }])
      ],
      why: t('Metoksidas yra bazė: jo deguonies laisvoji pora sudaro ryšį su vandens vandeniliu, o $O–H$ elektronai lieka deguoniui. Vanduo atiduoda protoną, todėl yra rūgštis.', 'Methoxide is the base: a lone pair on its oxygen bonds to a hydrogen of water, while the $O–H$ electrons stay on oxygen. Water gives up the proton, so it is the acid.'),
      src: 'L4 p7', claims: [{ formula: ['C[O-]', 'CH3O-'] }]
    },
    {
      id: 'u04.role.5',
      q: [{ p: t('Sieros rūgštis reaguoja su vandeniu.', 'Sulfuric acid reacts with water.') }, SC([M('OS(=O)(=O)O'), PLUS, M('O'), EQ, M('OS(=O)(=O)[O-]'), PLUS, M('[OH3+]')])],
      steps: [
        matchRoles(t('Priskirkite dalelėms jų vaidmenis.', 'Assign the species their roles.'), ['OS(=O)(=O)O', 'O', 'OS(=O)(=O)[O-]', '[OH3+]'], [0, 1, 2, 3],
          t('Rūgštis ir konjuguotoji bazė skiriasi protonu.', 'An acid and its conjugate base differ by a proton.'), t('$H2SO4$ – rūgštis, $H2O$ – bazė, $HSO4-$ – konjuguotoji bazė, $H3O+$ – konjuguotoji rūgštis.', '$H2SO4$ is the acid, $H2O$ the base, $HSO4-$ the conjugate base, $H3O+$ the conjugate acid.')),
        cho(t('Kuri rūgštis stipresnė: $H2SO4$ (pKa −9) ar $H3O+$ (pKa −1,74), ir kur pasislinkusi pusiausvyra?', 'Which acid is stronger, $H2SO4$ (pKa −9) or $H3O+$ (pKa −1.74), and which way does the equilibrium lie?'),
          [tx('$H2SO4$ stipresnė; pusiausvyra – į dešinę', '$H2SO4$ is stronger; the equilibrium lies to the right'), tx('$H3O+$ stipresnė; pusiausvyra – į dešinę', '$H3O+$ is stronger; the equilibrium lies to the right'), tx('$H2SO4$ stipresnė; pusiausvyra – į kairę', '$H2SO4$ is stronger; the equilibrium lies to the left')], 0,
          t('Mažesnė pKa – stipresnė rūgštis; reakcija vyksta, susidarant silpnesnei rūgščiai.', 'The smaller pKa is the stronger acid; the reaction goes toward the weaker acid.'),
          t('Sieros rūgšties pKa mažesnė, todėl ji stipresnė ir beveik visiškai perduoda protoną vandeniui; susidaro silpnesnė rūgštis $H3O+$.', 'Sulfuric acid has the smaller pKa, so it is stronger and passes its proton to water almost completely; the weaker acid $H3O+$ forms.'))
      ],
      why: t('Kai rūgštis atiduoda protoną vandeniui, vanduo yra bazė, o susidariusi dalelė – oksonio jonas. Pusiausvyra pasislenka į silpnesnių dalelių pusę.', 'When an acid gives a proton to water, water is the base and the species formed is the hydronium ion. The equilibrium shifts to the side of the weaker species.'),
      src: 'L4 p7, p10-11'
    },
    {
      id: 'u04.role.6',
      q: [{ p: t('Fenolis reaguoja su hidroksido jonu.', 'Phenol reacts with hydroxide ion.') }, SC([M('Oc1ccccc1'), PLUS, M('[OH-]'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris atiduoda protoną.', 'Tap the atom that gives up the proton.'), 'Oc1ccccc1', [0],
          t('Palyginkite $O–H$ ir $C–H$ rūgštingumą.', 'Compare the acidity of $O–H$ and $C–H$.'), t('Deguonies atomas (Nr. 1) elektroneigiamesnis už anglį, o fenoksido anijono krūvis dar delokalizuojamas žiede.', 'The oxygen atom (no. 1) is more electronegative than carbon, and the charge of the phenoxide anion is also delocalised in the ring.')),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('[O-]c1ccccc1.O'), mo('Oc1ccc[c-]c1.O'), tx('Reakcija nevyksta.', 'No reaction.')], 0,
          t('Hidroksidas atima protoną nuo rūgščiausios vietos.', 'Hydroxide takes the proton from the most acidic site.'),
          [{ p: t('Susidaro fenoksidas ir vanduo:', 'Phenoxide and water form:') }, mo('[O-]c1ccccc1.O')]),
        cho(t('Kuria kryptimi pasislinkusi pusiausvyra (fenolio pKa 9,9; vandens 15,7)?', 'Which way does the equilibrium lie (pKa of phenol 9.9; of water 15.7)?'),
          [tx('Į dešinę: susidaro silpnesnė rūgštis – vanduo', 'To the right: the weaker acid, water, forms'), tx('Į kairę: fenolis per silpna rūgštis', 'To the left: phenol is too weak an acid')], 0,
          t('Palyginkite fenolio ir vandens pKa.', 'Compare the pKa of phenol and of water.'), t('Fenolis (9,9) stipresnė rūgštis už vandenį (15,7), todėl reakcija vyksta į dešinę.', 'Phenol (9.9) is a stronger acid than water (15.7), so the reaction goes to the right.'))
      ],
      why: t('Fenolis yra O–H rūgštis, kurios anijono krūvis pasiskirsto žiede, todėl jis stipresnis už vandenį ir reaguoja su šarmu. Alkoholiai (pKa apie 16) su hidroksidu beveik nereaguoja.', 'Phenol is an O–H acid whose anion spreads its charge over the ring, so it is stronger than water and reacts with an alkali. Alcohols (pKa about 16) hardly react with hydroxide.'),
      src: 'L4 p11, p36', claims: [{ formula: ['[O-]c1ccccc1', 'C6H5O-'] }]
    },
    {
      id: 'u04.role.7',
      q: [{ p: t('Dimetilaminas reaguoja su acto rūgštimi.', 'Dimethylamine reacts with acetic acid.') }, SC([M('CNC'), PLUS, M('CC(=O)O'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris prisijungia protoną.', 'Tap the atom that takes up the proton.'), 'CNC', [1],
          t('Kurio atomo viduje yra laisvoji elektronų pora?', 'Which atom has a lone pair?'), t('Azotas (Nr. 2): jo laisvoji pora yra bazinis centras.', 'Nitrogen (no. 2): its lone pair is the basic centre.')),
        cho(t('Kokie yra pagrindiniai produktai paprastai kambario temperatūroje?', 'What are the main products at room temperature?'), [mo('C[NH2+]C.CC(=O)[O-]'), mo('CC(=O)N(C)C.O'), mo('CNC.CC(=[OH+])O')], 0,
          t('Greičiausiai vyksta protono perdavimas, o ne ryšio tarp $C$ ir $N$ sudarymas.', 'Proton transfer is by far the fastest process, not formation of a $C–N$ bond.'),
          [{ p: t('Aminas yra stipresnė bazė už acetatą, todėl susidaro dimetilamonio acetatas:', 'The amine is a stronger base than acetate, so dimethylammonium acetate forms:') }, mo('C[NH2+]C.CC(=O)[O-]')]),
        cho(t('Kuri dalelė yra dimetilamino konjuguotoji rūgštis?', 'Which species is the conjugate acid of dimethylamine?'), [mo('C[NH2+]C'), mo('C[N-]C'), mo('CC(=O)[O-]'), mo('CC(=O)O')], 0,
          t('Bazė, prisijungusi protoną, virsta konjuguotąja rūgštimi.', 'A base that takes up a proton becomes its conjugate acid.'), t('Dimetilamonio jonas gaunamas pridėjus $H+$ prie azoto.', 'The dimethylammonium ion is obtained by adding $H+$ to nitrogen.'))
      ],
      why: t('Rūgštis ir amino bazė reaguoja protono perdavimu, nes tai labai greita ir grįžtama. Amido susidarymas (rūgšties darinio reakcija) reikalauja kitų sąlygų ir tarp tikrų produktų nesiskaičiuoja.', 'An acid and an amine react by proton transfer, which is very fast and reversible. Formation of an amide (a reaction of acid derivatives) needs other conditions and is not among the real products.'),
      src: 'S2.17, L4 p6, p26', claims: [{ formula: ['C[NH2+]C', 'C2H8N+'] }]
    },
    {
      id: 'u04.role.8',
      q: [{ p: t('Acto rūgštis reaguoja su hidroksido jonu.', 'Acetic acid reacts with hydroxide ion.') }, SC([M('CC(=O)O'), PLUS, M('[OH-]'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris atiduoda protoną.', 'Tap the atom that gives up the proton.'), 'CC(=O)O', [3],
          t('Kurio atomo vandenilis rūgščiausias: $C–H$ ar $O–H$?', 'Which hydrogen is the most acidic: $C–H$ or $O–H$?'), t('Atiduoda deguonies atomas Nr. 4 (hidroksilo grupė): $O–H$ protonas rūgštus, nes karboksilato anijonas stabilizuotas rezonansu.', 'Oxygen atom no. 4 (the hydroxyl group) gives it up: the $O–H$ proton is acidic because the carboxylate anion is stabilised by resonance.')),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('CC(=O)[O-].O'), mo('[CH2-]C(=O)O.O'), mo('CC(O)(O)[O-]')], 0,
          t('Hidroksidas čia yra bazė, o ne nukleofilas, atakuojantis karbonilo anglį.', 'Here hydroxide acts as a base, not as a nucleophile attacking the carbonyl carbon.'),
          [{ p: t('Protonas pereina hidroksidui; susidaro acetatas ir vanduo:', 'The proton passes to hydroxide; acetate and water form:') }, mo('CC(=O)[O-].O')]),
        cho(t('Kodėl reakcija vyksta iki galo?', 'Why does the reaction go to completion?'), [tx('Susidaro daug silpnesnė rūgštis – vanduo (15,7 prieš 3–5).', 'A much weaker acid, water (15.7 against 3–5), forms.'), tx('Hidroksidas yra silpnesnė bazė už acetatą.', 'Hydroxide is a weaker base than acetate.'), tx('Acto rūgštis yra silpnesnė už vandenį.', 'Acetic acid is a weaker acid than water.')], 0,
          t('Palyginkite pKa reagentuose ir produktuose esančių rūgščių.', 'Compare the pKa of the acids among reactants and products.'), t('Reakcija vyksta į silpnesnės rūgšties pusę: $H2O$ (15,7) yra daug silpnesnė už $CH3COOH$ (4,75).', 'The reaction goes toward the weaker acid: $H2O$ (15.7) is much weaker than $CH3COOH$ (4.75).'))
      ],
      why: t('Karboksirūgštis su šarmu virsta druska ir vandeniu: protoną perduoda rūgšties $O–H$ grupė, o hidroksidas čia yra bazė.', 'A carboxylic acid and an alkali give a salt and water: the $O–H$ group of the acid passes on the proton and hydroxide acts as the base.'),
      src: 'L4 p4, p36', claims: [{ formula: ['CC(=O)[O-]', 'C2H3O2-'] }]
    }
  ];

  /* ---------- u04.amph: amphoteric alcohols, water, amino acids (S2.16) ---------- */
  const AMPH = [
    {
      id: 'u04.amph.1',
      q: [{ p: t('Metanolis veikiamas stipria rūgštimi $HCl$.', 'Methanol reacts with the strong acid $HCl$.') }, SC([M('CO'), PLUS, M('Cl'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris prisijungia protoną.', 'Tap the atom that takes up the proton.'), 'CO', [1],
          t('Kurio atomo viduje yra laisvoji elektronų pora?', 'Which atom has a lone pair?'), t('Deguonies atomas Nr. 2 turi dvi laisvąsias poras; viena jų sudaro ryšį su protonu.', 'Oxygen atom no. 2 has two lone pairs; one of them forms the bond to the proton.')),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('C[OH2+].[Cl-]'), mo('CCl.O'), mo('C[O-].[ClH2+]')], 0,
          t('Stipri rūgštis perduoda protoną; kas jį priima?', 'A strong acid passes on its proton; who takes it?'),
          [{ p: t('Metanolio deguonies pora prisijungia protoną:', 'The oxygen pair of methanol takes the proton:') },
            { mech: [{ scheme: { items: [M('CO', { lonePairs: [1] }), PLUS, M('Cl', { allH: true })] }, arrows: [{ from: { m: 0, lp: 1 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }] }] }, mo('C[OH2+].[Cl-]')]),
        cho(t('Kokį vaidmenį vaidina metanolis šioje reakcijoje?', 'What role does methanol play in this reaction?'), [tx('Bazė', 'Base'), tx('Rūgštis', 'Acid'), tx('Nei rūgštis, nei bazė', 'Neither acid nor base')], 0,
          t('Jis priima protoną ar jį atiduoda?', 'Does it accept the proton or give it away?'), t('Metanolis prisijungia protoną, todėl yra bazė; jo konjuguotoji rūgštis – metiloksonio jonas.', 'Methanol takes up a proton, so it is a base; its conjugate acid is the methyloxonium ion.'))
      ],
      why: t('Alkoholiai amfoteriniai: su stipria rūgštimi deguonies laisvoji pora prisijungia protoną (alkoholis – silpna bazė), o su stipria baze alkoholis atiduoda $O–H$ protoną.', 'Alcohols are amphoteric: with a strong acid the lone pair on oxygen takes a proton (the alcohol is a weak base), and with a strong base the alcohol gives up its $O–H$ proton.'),
      src: 'S2.16, L4 p33', claims: [{ formula: ['C[OH2+]', 'CH5O+'] }]
    },
    {
      id: 'u04.amph.2',
      q: [{ p: t('Metanolis reaguoja su stipria baze – natrio amidu (parodytas $NH2-$ anijonas).', 'Methanol reacts with the strong base sodium amide (the $NH2-$ anion is shown).') }, SC([M('CO'), PLUS, M('[NH2-]'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris atiduoda protoną.', 'Tap the atom that gives up the proton.'), 'CO', [1],
          t('Kurio atomo vandenilis rūgščiausias?', 'Which hydrogen is the most acidic?'), t('Deguonies atomas Nr. 2: $O–H$ rūgštingesnis už $C–H$, nes deguonis elektroneigiamesnis.', 'Oxygen atom no. 2: $O–H$ is more acidic than $C–H$ because oxygen is more electronegative.')),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('C[O-].N'), mo('[CH2-]O.N'), mo('CN.[OH-]')], 0,
          t('Amido jonas yra bazė; ką jis atima?', 'The amide ion is a base; what does it take?'),
          [{ p: t('Amido jono pora sudaro ryšį su $O–H$ protonu:', 'The pair of the amide ion bonds to the $O–H$ proton:') },
            { mech: [{ scheme: { items: [M('CO', { allH: true }), PLUS, M('[NH2-]', { lonePairs: true })] }, arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H1' } }, { from: { m: 0, b: [1, 'H1'] }, to: { m: 0, a: 1 } }] }] }, mo('C[O-].N')]),
        cho(t('Metanolio pKa 15,6, amoniako – 38. Kur pasislinkusi pusiausvyra?', 'The pKa of methanol is 15.6, that of ammonia 38. Where does the equilibrium lie?'), [tx('Stipriai į dešinę', 'Far to the right'), tx('Stipriai į kairę', 'Far to the left')], 0,
          t('Susidaro silpnesnė rūgštis ar stipresnė?', 'Does the weaker or the stronger acid form?'), t('Dešinėje yra $NH3$ (38) – daug silpnesnė rūgštis už metanolį (15,6), todėl pusiausvyra stipriai pasislinkusi į dešinę.', 'On the right is $NH3$ (38), a much weaker acid than methanol (15.6), so the equilibrium lies far to the right.'))
      ],
      why: t('Su stipria baze metanolis elgiasi kaip rūgštis ir virsta metoksidu. Tas pats junginys su stipria rūgštimi buvo bazė, todėl alkoholiai yra amfoteriniai.', 'With a strong base methanol acts as an acid and becomes methoxide. The same compound was a base toward a strong acid, which is why alcohols are amphoteric.'),
      src: 'S2.16, L4 p11, S2.23', claims: [{ formula: ['C[O-]', 'CH3O-'] }]
    },
    {
      id: 'u04.amph.3',
      q: [{ p: t('Vanduo reaguoja trimis būdais:', 'Water reacts in three ways:') },
        SC([M('O'), PLUS, M('Cl'), FW, M('[OH3+]'), PLUS, M('[Cl-]')]),
        SC([M('O'), PLUS, M('[NH2-]'), FW, M('[OH-]'), PLUS, M('N')]),
        SC([M('O'), PLUS, M('CC(=O)O'), EQ, M('[OH3+]'), PLUS, M('CC(=O)[O-]')])],
      steps: [
        {
          prompt: t('Kuriose reakcijose (iš viršaus į apačią: a, b, c) vanduo yra rūgštis?', 'In which reactions (from top to bottom: a, b, c) is water the acid?'), kind: 'multi',
          options: [tx('(a) su $HCl$', '(a) with $HCl$'), tx('(b) su $NH2-$', '(b) with $NH2-$'), tx('(c) su acto rūgštimi', '(c) with acetic acid')], answer: [1],
          hint: t('Rūgštis atiduoda protoną: kuriuo atveju vanduo virsta $OH-$?', 'An acid gives up a proton: in which case does water turn into $OH-$?'),
          solution: t('Tik (b): vanduo atiduoda protoną ir virsta $OH-$. Reakcijose (a) ir (c) vanduo prisijungia protoną ir virsta $H3O+$, todėl yra bazė.', 'Only (b): water gives up a proton and becomes $OH-$. In (a) and (c) water takes up a proton and becomes $H3O+$, so it is a base.')
        },
        cho(t('Kodėl vanduo gali elgtis ir kaip rūgštis, ir kaip bazė?', 'Why can water act both as an acid and as a base?'),
          [tx('Turi $O–H$ protoną ir deguonies laisvąją elektronų porą.', 'It has an $O–H$ proton and a lone pair on oxygen.'), tx('Yra neutrali molekulė.', 'It is a neutral molecule.'), tx('Yra labai poliarus tirpiklis.', 'It is a very polar solvent.')], 0,
          t('Reikalingi du dalykai: ką atiduoti ir kuo prisijungti.', 'Two things are needed: something to give and something to take with.'), t('Rūgštinį centrą sudaro $O–H$ protonas, bazinį – laisvoji deguonies pora; kuris vaidmuo, priklauso nuo partnerio.', 'The acidic centre is the $O–H$ proton, the basic centre the lone pair on oxygen; which role is taken depends on the partner.'))
      ],
      why: t('Vandens vaidmenį lemia partneris: su stipresne rūgštimi vanduo – bazė, su stipresne baze – rūgštis. Pagal tą patį principą alkoholiai taip pat amfoteriniai.', 'The role of water is set by its partner: toward a stronger acid water is a base, toward a stronger base it is an acid. By the same principle, alcohols are also amphoteric.'),
      src: 'L4 p3, p33, S2.16'
    },
    {
      id: 'u04.amph.4',
      q: [{ p: t('Acto rūgštis reaguoja su stipria rūgštimi (oksonio jonu). Kur prisijungia protonas?', 'Acetic acid reacts with a strong acid (the hydronium ion). Where does the proton go?') }, SC([M('CC(=O)O'), PLUS, M('[OH3+]'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris prisijungia protoną.', 'Tap the atom that takes up the proton.'), 'CC(=O)O', [2],
          t('Palyginkite dviejų deguonies atomų laisvąsias poras: kurią protonavus katijonas stabilesnis?', 'Compare the lone pairs of the two oxygen atoms: protonation of which gives the more stable cation?'),
          t('Protonuojamas karbonilo deguonis (Nr. 3): susidaro katijonas, kurio krūvis delokalizuotas per abu deguonis.', 'The carbonyl oxygen (no. 3) is protonated: the cation formed has its charge delocalised over both oxygens.')),
        cho(t('Koks katijonas susidaro?', 'Which cation forms?'), [mo('CC(=[OH+])O'), mo('CC(=O)[OH2+]'), tx('Acto rūgštis su rūgštimi nereaguoja.', 'Acetic acid does not react with an acid.')], 0,
          t('Nubraižykite abu galimus katijonus ir ieškokite to, kurio krūvį galima užrašyti keliomis rezonansinėmis formulėmis.', 'Draw both possible cations and look for the one whose charge can be written in several resonance structures.'),
          [{ p: t('Protonavus karbonilo deguonį, teigiamas krūvis pasidalija tarp dviejų deguonies atomų:', 'After protonation of the carbonyl oxygen, the positive charge is shared between the two oxygen atoms:') }, { resonance: [{ smi: 'CC(=[OH+])O' }, { smi: 'C[C+](O)O' }, { smi: 'CC(O)=[OH+]' }] }]),
        cho(t('Kokį vaidmenį vaidina acto rūgštis šioje reakcijoje?', 'What role does acetic acid play in this reaction?'), [tx('Bazė', 'Base'), tx('Rūgštis', 'Acid')], 0,
          t('Ar ji priima, ar atiduoda protoną?', 'Does it accept or give up a proton?'), t('Acto rūgštis priima protoną, todėl su stipria rūgštimi yra bazė.', 'Acetic acid accepts the proton, so toward a strong acid it is a base.'))
      ],
      why: t('Karboksirūgštys amfoterinės: su baze jos atiduoda $O–H$ protoną, o su stipria rūgštimi prisijungia protoną prie karbonilo deguonies, nes susidaręs katijonas stabilizuotas rezonansu.', 'Carboxylic acids are amphoteric: with a base they give up the $O–H$ proton, and with a strong acid they take a proton on the carbonyl oxygen because the cation formed is stabilised by resonance.'),
      src: 'L4 p4, p17', claims: [{ formula: ['CC(=[OH+])O', 'C2H5O2+'] }]
    },
    {
      id: 'u04.amph.5',
      q: [{ p: t('Acetonas reaguoja su koncentruota sieros rūgštimi (pKa −9). Protonuoto acetono pKa yra −7,3.', 'Acetone reacts with concentrated sulfuric acid (pKa −9). Protonated acetone has pKa −7.3.') }, SC([M('CC(C)=O'), PLUS, M('OS(=O)(=O)O'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris prisijungia protoną.', 'Tap the atom that takes up the proton.'), 'CC(C)=O', [3],
          t('Kuris atomas turi laisvąsias elektronų poras?', 'Which atom has lone pairs?'), t('Karbonilo deguonis (Nr. 4) turi dvi laisvąsias poras, todėl yra bazinis centras.', 'The carbonyl oxygen (no. 4) has two lone pairs and is the basic centre.')),
        cho(t('Kokie produktai susidaro?', 'What are the products?'), [mo('CC(C)=[OH+].OS(=O)(=O)[O-]'), mo('CC(C)(O)OS(=O)(=O)O'), tx('Reakcija nevyksta.', 'No reaction.')], 0,
          t('Sieros rūgštis stipresnė už protonuotą acetoną (−9 < −7,3): protonas pereina acetonui.', 'Sulfuric acid is stronger than protonated acetone (−9 < −7.3): the proton goes to acetone.'),
          [{ p: t('Protonuojamas deguonis, o ne anglis:', 'Oxygen is protonated, not carbon:') }, mo('CC(C)=[OH+].OS(=O)(=O)[O-]')]),
        cho(t('Kokį vaidmenį vaidina acetonas?', 'What role does acetone play?'), [tx('Bazė', 'Base'), tx('Rūgštis', 'Acid')], 0,
          t('Jo konjuguotosios rūgšties pKa lyginama su sieros rūgšties pKa.', 'The pKa of its conjugate acid is compared with that of sulfuric acid.'), t('Acetonas prisijungia protoną, todėl yra bazė (silpna: konjuguotosios rūgšties pKa −7,3).', 'Acetone takes up a proton, so it is a base (a weak one: its conjugate acid has pKa −7.3).'))
      ],
      why: t('Aldehidai ir ketonai yra oksonio tipo bazės: protonuojamas karbonilo deguonis. Bazės stiprumą rodo konjuguotosios rūgšties pKa; protonuotas acetonas stipri rūgštis (−7,3), todėl acetonas – labai silpna bazė.', 'Aldehydes and ketones are oxonium-type bases: the carbonyl oxygen is protonated. The strength of a base is shown by the pKa of its conjugate acid; protonated acetone is a strong acid (−7.3), so acetone is a very weak base.'),
      src: 'L4 p11, p27, S2.22', claims: [{ formula: ['CC(C)=[OH+]', 'C3H7O+'] }]
    },
    {
      id: 'u04.amph.6',
      q: [{ p: t('Aminorūgštis alaninas turi ir rūgštinį, ir baziną centrą.', 'The amino acid alanine has both an acidic and a basic centre.') }, { mol: M('CC(N)C(=O)O', { numbers: 'all' }) }],
      steps: [
        atomsStep(t('Bakstelėkite rūgštinio centro atomą (atiduoda protoną).', 'Tap the atom of the acidic centre (it gives up the proton).'), 'CC(N)C(=O)O', [5],
          t('Karboksilo grupės $O–H$ yra rūgštus.', 'The $O–H$ of the carboxyl group is the acidic one.'), t('Atomas Nr. 6 – karboksilo grupės $OH$ deguonis.', 'Atom no. 6 is the $OH$ oxygen of the carboxyl group.')),
        atomsStep(t('Bakstelėkite bazinio centro atomą (prisijungia protoną).', 'Tap the atom of the basic centre (it takes up a proton).'), 'CC(N)C(=O)O', [2],
          t('Kurio atomo laisvoji elektronų pora yra bazingesnė?', 'Which atom has a lone pair and is the more basic one?'), t('Atomas Nr. 3 – amino grupės azotas, kurio laisvoji pora jungia protoną.', 'Atom no. 3 is the nitrogen of the amino group; its lone pair binds a proton.')),
        cho(t('Kokia forma vyrauja vandenyje?', 'Which form predominates in water?'), [mo('CC([NH3+])C(=O)[O-]'), mo('CC(N)C(=O)O'), mo('CC([NH3+])C(=O)O'), mo('CC(N)C(=O)[O-]')], 0,
          t('Rūgštinis centras atiduoda protoną bazinio centro naudai tos pačios molekulės viduje.', 'The acidic centre gives its proton to the basic centre within the same molecule.'),
          [{ p: t('Susidaro vidinė druska (dvigubasis jonas) su $NH3+$ ir $COO-$:', 'An internal salt (a zwitterion) with $NH3+$ and $COO-$ forms:') }, mo('CC([NH3+])C(=O)[O-]')])
      ],
      why: t('Kai junginyje yra ir rūgštinis ($COOH$), ir bazinis ($NH2$) centras, jis amfoterinis. Protonas gali pereiti iš vieno centro į kitą ir susidaro vidinė druska, bendras krūvis lieka nulis.', 'When a compound has both an acidic ($COOH$) and a basic ($NH2$) centre it is amphoteric. The proton can move from one centre to the other, giving an internal salt whose total charge is zero.'),
      src: 'L4 p33, T p37',
      claims: [{ formula: ['CC([NH3+])C(=O)[O-]', 'C3H7NO2'] }, { name: ['CC(N)C(=O)O', t('2-aminopropano rūgštis', '2-aminopropanoic acid')] }]
    },
    {
      id: 'u04.amph.7',
      q: [{ p: t('Maišant azoto ir sieros rūgštis susidaro nitronio jonas. Parodyta pirmoji stadija.', 'Mixing nitric and sulfuric acids gives the nitronium ion. The first stage is shown.') }, SC([M('O[N+](=O)[O-]'), PLUS, M('OS(=O)(=O)O'), EQ])],
      steps: [
        cho(t('Kuri rūgštis čia elgiasi kaip bazė?', 'Which acid acts as the base here?'), [mo('O[N+](=O)[O-]'), mo('OS(=O)(=O)O')], 0,
          t('Palyginkite pKa: azoto rūgšties −1,4, sieros rūgšties −9.', 'Compare the pKa values: nitric acid −1.4, sulfuric acid −9.'), t('Sieros rūgštis stipresnė (−9), todėl ji atiduoda protoną, o silpnesnė azoto rūgštis (−1,4) jį priima.', 'Sulfuric acid is stronger (−9), so it gives up the proton, and the weaker nitric acid (−1.4) takes it.')),
        atomsStep(t('Bakstelėkite azoto rūgšties atomą, kuris prisijungia protoną.', 'Tap the atom of nitric acid that takes up the proton.'), 'O[N+](=O)[O-]', [0],
          t('Protonuojama vieta, iš kurios vėliau gali išeiti vanduo.', 'The protonation site is the one from which water can leave later.'), t('Protonuojamas $OH$ deguonis (Nr. 1): susidaręs $–OH2+$ yra gera nueinanti grupė.', 'The $OH$ oxygen (no. 1) is protonated: the resulting $–OH2+$ is a good leaving group.')),
        cho(t('Kas susidaro po vandens atskilimo?', 'What forms after water leaves?'), [mo('O=[N+]=O.O'), mo('[O-][N+](=O)[OH2+]'), tx('Nitrato jonas ir oksonio jonas.', 'The nitrate ion and the hydronium ion.')], 0,
          t('Vandens atskilimui padeda neigiamo deguonies laisvoji pora.', 'A lone pair of the negative oxygen helps water to leave.'),
          [{ p: t('Neigiamo deguonies pora sudaro $N=O$ ryšį, o $N–OH2+$ ryšio elektronai pereina vandeniui:', 'The pair of the negative oxygen forms an $N=O$ bond and the electrons of the $N–OH2+$ bond move to water:') },
            { mech: [{ scheme: { items: [M('[O-][N+](=O)[OH2+]', { lonePairs: [0] })] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 0, mid: [0, 1] } }, { from: { m: 0, b: [1, 3] }, to: { m: 0, a: 3 } }] }] }, mo('O=[N+]=O.O')])
      ],
      why: t('Net rūgštis gali būti bazė, jei ji lyginama su dar stipresne rūgštimi. Protonuota azoto rūgštis praranda vandenį ir susidaro nitronio jonas $NO2+$ – elektrofilas aromatiniame nitrinime.', 'Even an acid can be a base when compared with a still stronger acid. Protonated nitric acid loses water and the nitronium ion $NO2+$ forms, the electrophile of aromatic nitration.'),
      src: 'L4 p5', claims: [{ formula: ['O=[N+]=O', 'NO2+'] }]
    },
    {
      id: 'u04.amph.8',
      q: [{ p: t('Nustatykite, kurie iš šių junginių yra amfoteriniai (turi ir rūgštinį, ir baziną centrą).', 'Decide which of these compounds are amphoteric (they have both an acidic and a basic centre).') }],
      steps: [
        {
          prompt: t('Pažymėkite visus amfoterinius junginius.', 'Pick every amphoteric compound.'), kind: 'multi',
          options: [mo('CCO'), mo('CCOCC'), mo('NCC(=O)O'), mo('CCC'), mo('CC(=O)O')], answer: [0, 2, 4],
          hint: t('Ieškokite junginių, kuriuose yra ir protonas, kurį galima atiduoti, ir laisvoji elektronų pora.', 'Look for compounds that have both a proton that can be given away and a lone pair.'),
          solution: t('Etanolis ($O–H$ ir deguonies pora), glicinas ($COOH$ ir $NH2$) ir acto rūgštis ($O–H$ ir karbonilo deguonies poros) yra amfoteriniai. Dietileteris neturi rūgštaus protono (tik bazė), propanas neturi laisvosios poros (praktiškai nei rūgštis, nei bazė).', 'Ethanol ($O–H$ and an oxygen pair), glycine ($COOH$ and $NH2$) and acetic acid ($O–H$ and the lone pairs of the carbonyl oxygen) are amphoteric. Diethyl ether has no acidic proton (a base only), propane has no lone pair (practically neither acid nor base).')
        },
        cho(t('Kuris teiginys teisingas?', 'Which statement is correct?'),
          [tx('Amfoterinio junginio vaidmenį lemia partneris.', 'The role of an amphoteric compound is set by its partner.'), tx('Amfoterinis junginys visada yra neutralus tirpale.', 'An amphoteric compound is always neutral in solution.'), tx('Amfoteriniai junginiai nereaguoja nei su rūgštimis, nei su bazėmis.', 'Amphoteric compounds react neither with acids nor with bases.')], 0,
          t('Palyginkite junginio pKa su partnerio pKa.', 'Compare the pKa of the compound with that of its partner.'), t('Su stipresne rūgštimi amfoterinis junginys – bazė, su stipresne baze – rūgštis.', 'Toward a stronger acid an amphoteric compound is a base, toward a stronger base it is an acid.'))
      ],
      why: t('Amfoterinis junginys turi ir rūgštinį centrą (protoną), ir baziną centrą (laisvąją porą). Eteriai ir alkanai tokie nėra: pirmieji tik bazės, antrieji praktiškai neutralūs.', 'An amphoteric compound has both an acidic centre (a proton) and a basic centre (a lone pair). Ethers and alkanes are not: the former are bases only, the latter practically neutral.'),
      src: 'L4 p33, S2.16', claims: [{ formula: ['NCC(=O)O', 'C2H5NO2'] }]
    }
  ];

  /* ---------- u04.rank: ranking acids with the reason (S2.20) ---------- */
  const reasonStep = (right, wrong, hint, solution, prompt) => ({
    prompt: prompt || t('Kuo paaiškinama ši eilė?', 'What explains this order?'), kind: 'choice',
    options: [{ text: right }].concat(wrong.map((w) => ({ text: w }))), answer: 0, hint, solution: solution || right
  });
  const orderStep = (smis, hint, solution, prompt) => ({
    prompt: prompt || t('Išdėstykite junginius nuo stipriausios iki silpniausios rūgšties.', 'Put the compounds in order from the strongest to the weakest acid.'),
    kind: 'order', options: smis.map((s) => mo(s)), hint, solution
  });
  const HINT_ANION = t('Rūgštį nusako konjuguotosios bazės stabilumas: nubraižykite anijonus ir palyginkite, kaip jie išlaiko neigiamą krūvį.', 'An acid is judged by its conjugate base: draw the anions and compare how they hold the negative charge.');
  const RANK = [
    {
      id: 'u04.rank.1',
      q: [{ p: t('Palyginkite trijų junginių su $O–H$ grupe rūgštingumą.', 'Compare the acidity of three compounds that contain an $O–H$ group.') }, { mol: [M('OC1CCCCC1'), M('Oc1ccccc1'), M('CC(=O)O')] }],
      steps: [
        orderStep(['CC(=O)O', 'Oc1ccccc1', 'OC1CCCCC1'], HINT_ANION, t('Acto rūgštis (4,75) > fenolis (9,9) > cikloheksanolis (alkoholis, apie 16).', 'Acetic acid (4.75) > phenol (9.9) > cyclohexanol (an alcohol, about 16).')),
        reasonStep(t('Acetato krūvis pasidalija tarp dviejų deguonies atomų, fenoksido krūvis delokalizuojamas žiede, o alkoksido krūvis lieka ant vieno deguonies.', 'The acetate charge is shared by two oxygen atoms, the phenoxide charge is delocalised in the ring, and the alkoxide charge stays on one oxygen.'), [
          t('Cikloheksilo žiedas stabilizuoja alkoksidą labiau nei benzeno žiedas fenoksidą.', 'The cyclohexyl ring stabilises the alkoxide more than the benzene ring stabilises phenoxide.'),
          t('Visų trijų anijonai vienodai stabilūs; skiriasi tik $O–H$ ryšio stiprumas.', 'The anions of all three are equally stable; only the strength of the $O–H$ bond differs.'),
          t('Daugiausia anglies atomų turintis junginys yra stipriausia rūgštis.', 'The compound with most carbon atoms is the strongest acid.')], HINT_ANION),
        { prompt: t('Kiek lygiaverčių rezonansinių formulių galima nubraižyti acetato anijonui?', 'How many equivalent resonance structures can be drawn for the acetate anion?'), kind: 'number', answer: { value: 2, tol: 0 },
          hint: t('Kiek deguonies atomų gali turėti neigiamą krūvį?', 'How many oxygen atoms can carry the negative charge?'), solution: [{ p: t('Dvi: krūvis pasikeičia tarp dviejų deguonies atomų.', 'Two: the charge swaps between the two oxygen atoms.') }, { resonance: [{ smi: 'CC(=O)[O-]' }, { smi: 'CC([O-])=O' }] }] }
      ],
      why: t('Kuo daugiau rezonansinių formulių, tuo labiau neigiamas krūvis išsklaidytas ir tuo stabilesnis anijonas. Karboksilatas stabilus dėl dviejų lygiaverčių formulių, fenoksidas – dėl delokalizacijos žiede.', 'The more resonance structures, the more the negative charge is spread out and the more stable the anion. Carboxylate is stable thanks to two equivalent structures, phenoxide thanks to delocalisation in the ring.'),
      src: 'L4 p11, p17, S2.20', claims: [{ name: ['OC1CCCCC1', t('cikloheksanolis', 'cyclohexanol')] }]
    },
    {
      id: 'u04.rank.2',
      q: [{ p: t('Palyginkite etanolio ir etantiolio rūgštingumą.', 'Compare the acidity of ethanol and ethanethiol.') }, { mol: [M('CCO'), M('CCS')] }],
      steps: [
        cho(t('Kuris junginys stipresnė rūgštis?', 'Which compound is the stronger acid?'), [mo('CCS'), mo('CCO')], 0, HINT_ANION,
          t('Tiolis stipresnė rūgštis nei alkoholis: $RS-$ stabilesnis už $RO-$.', 'The thiol is the stronger acid: $RS-$ is more stable than $RO-$.')),
        reasonStep(t('Siera didesnė ir labiau poliarizuojama: krūvis išsklaidomas didesniame tūryje, todėl $RS-$ stabilesnis.', 'Sulfur is larger and more polarisable: the negative charge is spread over a larger volume, so $RS-$ is more stable.'), [
          t('Deguonis elektroneigiamesnis, todėl $RO-$ stabilesnis ir alkoholis stipresnė rūgštis.', 'Oxygen is more electronegative, so $RO-$ is more stable and the alcohol is the stronger acid.'),
          t('$S–H$ ryšys stipresnis už $O–H$, todėl tiolis atiduoda protoną sunkiau.', 'The $S–H$ bond is stronger than the $O–H$ bond, so the thiol gives up its proton less readily.'),
          t('Siera turi daugiau elektronų, todėl stipriau laiko protoną.', 'Sulfur has more electrons, so it holds the proton more tightly.')], HINT_ANION)
      ],
      why: t('Leidžiantis grupe žemyn, elektrinis neigiamumas mažėja, o poliarizuojamumas auga, ir būtent poliarizuojamumas stabilizuoja anijoną. Todėl tioliai stipresnės rūgštys už alkoholius.', 'Down a group electronegativity falls but polarisability rises, and it is polarisability that stabilises the anion. So thiols are stronger acids than alcohols.'),
      src: 'L4 p19, T p34', claims: [{ name: ['CCS', t('etantiolis', 'ethanethiol')] }]
    },
    {
      id: 'u04.rank.3',
      q: [{ p: t('Palyginkite keturių karboksirūgščių rūgštingumą.', 'Compare the acidity of four carboxylic acids.') }, { mol: [M('CC(C)(C)C(=O)O'), M('OC(=O)CF'), M('CC(=O)O'), M('OC(=O)CI')] }],
      steps: [
        orderStep(['OC(=O)CF', 'OC(=O)CI', 'CC(=O)O', 'CC(C)(C)C(=O)O'], HINT_ANION, t('Fluoracto (2,66) > jodacto (3,15) > acto (4,75) > 2,2-dimetilpropano (5,0).', 'Fluoroacetic (2.66) > iodoacetic (3.15) > acetic (4.75) > 2,2-dimethylpropanoic (5.0).')),
        reasonStep(t('Halogenai yra elektronų akceptoriai (−I) ir stabilizuoja anijoną; poveikis stipresnis, kai elektrinis neigiamumas didesnis. Alkilgrupės yra donorai (+I) ir rūgštingumą mažina.', 'Halogens are electron acceptors (−I) and stabilise the anion; the effect is stronger the higher the electronegativity. Alkyl groups are donors (+I) and lower the acidity.'), [
          t('Didesnis halogeno atomas labiau poliarizuojasi, todėl jodas didina rūgštingumą labiausiai.', 'A larger halogen atom is more polarisable, so iodine raises the acidity most.'),
          t('Alkilgrupės yra akceptorinės: kuo šakotesnė, tuo stipresnė rūgštis.', 'Alkyl groups are acceptors: the more branched, the stronger the acid.'),
          t('Visi halogenai veikia vienodai, nes visi turi laisvąsias poras.', 'All halogens act the same because all have lone pairs.')], t('Palyginkite pakaito elektrinį neigiamumą ir alkilgrupės poveikį.', 'Compare the electronegativity of the substituent and the effect of the alkyl group.'))
      ],
      why: t('Halogeno poveikį acto rūgščiai lemia elektrinis neigiamumas (−I), o ne atomo dydis, kuris svarbus tik O–H, S–H tipo palyginimuose. Alkilgrupė (+I) rūgštingumą mažina.', 'The effect of a halogen on acetic acid comes from its electronegativity (−I), not from atom size, which matters only in comparisons of the O–H versus S–H kind. An alkyl group (+I) lowers acidity.'),
      src: 'L4 p20-22, S2.20'
    },
    {
      id: 'u04.rank.4',
      q: [{ p: t('Palyginkite keturių dalelių rūgštingumą.', 'Compare the acidity of four species.') }, { mol: [M('N'), M('[OH3+]'), M('O'), M('[NH4+]')] }],
      steps: [
        orderStep(['[OH3+]', '[NH4+]', 'O', 'N'], HINT_ANION, t('$H3O+$ (−1,74) > $NH4+$ (9,26) > $H2O$ (15,7) > $NH3$ (38).', '$H3O+$ (−1.74) > $NH4+$ (9.26) > $H2O$ (15.7) > $NH3$ (38).')),
        reasonStep(t('Teigiamo krūvio rūgštis atiduoda protoną lengviau (konjuguotoji bazė neutrali); kai krūvis vienodas, O–H stipresnė rūgštis už N–H, nes deguonis elektroneigiamesnis.', 'An acid with a positive charge gives up its proton more easily (the conjugate base is neutral); at the same charge an O–H acid is stronger than an N–H acid because oxygen is more electronegative.'), [
          t('Teigiamas krūvis stipriau laiko protoną, todėl katijonai yra silpnesnės rūgštys už neutralias molekules.', 'A positive charge holds the proton more strongly, so cations are weaker acids than neutral molecules.'),
          t('$N–H$ ryšys poliškesnis už $O–H$, todėl amoniakas stipresnė rūgštis už vandenį.', 'The $N–H$ bond is more polar than $O–H$, so ammonia is a stronger acid than water.'),
          t('Rūgštingumą lemia tik vandenilių skaičius molekulėje.', 'Acidity depends only on the number of hydrogens in the molecule.')], t('Palyginkite, kokio krūvio dalelė lieka atidavus protoną.', 'Compare the charge of the species that is left after the proton goes.'))
      ],
      why: t('Katijonas, atiduodamas $H+$, virsta neutralia baze, o neutrali molekulė – anijonu, todėl katijonų konjuguotosios bazės stabilesnės. Lygindami to paties krūvio daleles, žiūrėkite į rūgštinio centro atomą (O > N).', 'A cation that loses $H+$ becomes a neutral base, whereas a neutral molecule becomes an anion, so the conjugate bases of cations are more stable. Compare species of the same charge by the atom of the acidic centre (O > N).'),
      src: 'L4 p11, p18, p30', claims: [{ formula: ['[NH4+]', 'NH4+'] }]
    },
    {
      id: 'u04.rank.5',
      q: [{ p: t('Palyginkite trijų karboksirūgščių rūgštingumą.', 'Compare the acidity of three carboxylic acids.') }, { mol: [M('CC(=O)O'), M('C(=O)O'), M('OC(=O)c1ccccc1')] }],
      steps: [
        orderStep(['C(=O)O', 'OC(=O)c1ccccc1', 'CC(=O)O'], HINT_ANION, t('Skruzdžių rūgštis (3,7) > benzenkarboksirūgštis (4,2) > acto rūgštis (4,75).', 'Formic acid (3.7) > benzoic acid (4.2) > acetic acid (4.75).')),
        reasonStep(t('Metilgrupė yra donoras (+I) ir destabilizuoja karboksilatą; fenilas neturi tokio poveikio ir krūvis gali delokalizuotis žiede; skruzdžių rūgštyje donoro nėra.', 'The methyl group is a donor (+I) and destabilises the carboxylate; phenyl lacks this effect and the charge can be delocalised in the ring; formic acid has no donor at all.'), [
          t('Fenilas yra stipresnis donoras už metilą, todėl benzenkarboksirūgštis stipresnė.', 'Phenyl is a stronger donor than methyl, so benzoic acid is stronger.'),
          t('Rūgštingumą lemia tik anglies atomų skaičius: daugiau – stipresnė.', 'Acidity depends only on the number of carbon atoms: more means stronger.'),
          t('Skruzdžių rūgštis silpniausia, nes neturi alkilgrupės, kuri stabilizuotų anijoną.', 'Formic acid is the weakest because it has no alkyl group to stabilise the anion.')], t('Palyginkite, kokie pakaitai yra prie karboksilo grupės: donorai ar ne.', 'Compare the groups attached to the carboxyl group: are they donors?'))
      ],
      why: t('Alkilgrupės (+I) mažina rūgštingumą (3,7 / 4,75 / 5,0 eilėje HCOOH, CH3COOH, (CH3)3CCOOH), o nepakeista aromatinė karboksirūgštis šiek tiek stipresnė už alifatinę, nes krūvis gali delokalizuotis žiede.', 'Alkyl groups (+I) lower acidity (3.7 / 4.75 / 5.0 in the series HCOOH, CH3COOH, (CH3)3CCOOH), and an unsubstituted aromatic carboxylic acid is slightly stronger than the aliphatic one because the charge can be delocalised into the ring.'),
      src: 'L4 p20, T p35'
    },
    {
      id: 'u04.rank.6',
      q: [{ p: t('Palyginkite penkių aromatinių rūgščių rūgštingumą.', 'Compare the acidity of five aromatic acids.') }, { mol: [M('CCc1ccc(cc1)C(=O)O'), M('OS(=O)(=O)c1ccccc1'), M('OC(=O)c1ccc(cc1)[N+](=O)[O-]'), M('OC(=O)c1ccc(Cl)cc1'), M('OC(=O)c1ccccc1')] }],
      steps: [
        orderStep(['OS(=O)(=O)c1ccccc1', 'OC(=O)c1ccc(cc1)[N+](=O)[O-]', 'OC(=O)c1ccc(Cl)cc1', 'OC(=O)c1ccccc1', 'CCc1ccc(cc1)C(=O)O'], HINT_ANION,
          t('Benzensulfonrūgštis (−6,5) > 4-nitrobenzenkarboksirūgštis > 4-chlorbenzenkarboksirūgštis > benzenkarboksirūgštis (4,2) > 4-etilbenzenkarboksirūgštis.', 'Benzenesulfonic acid (−6.5) > 4-nitrobenzoic acid > 4-chlorobenzoic acid > benzoic acid (4.2) > 4-ethylbenzoic acid.')),
        reasonStep(t('Sulfonato krūvis pasidalija tarp trijų deguonies atomų; nitrogrupė yra akceptorius (−M, −I) ir stabilizuoja anijoną, o etilgrupė – donoras (+I) ir jį destabilizuoja.', 'The sulfonate charge is shared by three oxygen atoms; the nitro group is an acceptor (−M, −I) and stabilises the anion, whereas the ethyl group is a donor (+I) and destabilises it.'), [
          t('Nitrogrupė yra donoras, todėl didina elektronų tankį ir rūgštingumą.', 'The nitro group is a donor, so it raises the electron density and the acidity.'),
          t('Etilgrupė stabilizuoja anijoną, nes sklaido neigiamą krūvį.', 'The ethyl group stabilises the anion because it spreads the negative charge.'),
          t('Pakaitas prie $p$-padėties neturi įtakos, nes yra toli nuo karboksilo grupės.', 'A substituent in the $p$ position has no effect because it is far from the carboxyl group.')], t('Kuris pakaitas atima elektronų tankį, o kuris jo suteikia?', 'Which substituent withdraws electron density and which donates it?'))
      ],
      why: t('Elektronų akceptoriai anijoną stabilizuoja, todėl rūgštingumas didėja, o donorai veikia priešingai. Sulfonrūgštis dar stipresnė, nes anijono krūvis delokalizuotas tarp trijų deguonies atomų (pKa −6,5).', 'Electron-acceptor substituents stabilise the anion and raise the acidity, donors lower it. A sulfonic acid is stronger still because the anion charge is delocalised over three oxygen atoms (pKa −6.5).'),
      src: 'L4 p10, p21, p23, S2.20',
      claims: [{ name: ['OC(=O)c1ccc(cc1)[N+](=O)[O-]', t('4-nitrobenzenkarboksirūgštis', '4-nitrobenzoic acid')] }, { name: ['OC(=O)c1ccc(Cl)cc1', t('4-chlorbenzenkarboksirūgštis', '4-chlorobenzoic acid')] }, { name: ['CCc1ccc(cc1)C(=O)O', t('4-etilbenzenkarboksirūgštis', '4-ethylbenzoic acid')] }]
    },
    {
      id: 'u04.rank.7',
      q: [{ p: t('Pagal kurso pKa palyginkite keturių C–H ir N–H rūgščių rūgštingumą.', 'Rank four C–H and N–H acids by the pKa values the course gives.') }, { mol: [M('CC'), M('C#C'), M('N'), M('C=C')] }],
      steps: [
        orderStep(['C#C', 'N', 'C=C', 'CC'], HINT_ANION, t('Etinas (25) > amoniakas (38) > etenas (44) > etanas (50).', 'Ethyne (25) > ammonia (38) > ethene (44) > ethane (50).')),
        reasonStep(t('Anijono stabilumą lemia atomo elektrinis neigiamumas ir hibridizacija: kuo didesnė s charakterio dalis (sp > sp2 > sp3), tuo geriau anglis laiko krūvį; azotas geriau laiko jį už sp2 ir sp3 anglį.', 'The stability of the anion depends on the electronegativity and the hybridisation of the atom: the larger the s character (sp > sp2 > sp3), the better carbon holds the charge; nitrogen holds it better than sp2 and sp3 carbon.'), [
          t('Alkanai rūgštesni už alkinus, nes turi daugiau C–H ryšių.', 'Alkanes are more acidic than alkynes because they have more C–H bonds.'),
          t('Rūgštingumas didėja mažėjant s charakteriui, todėl etanas – stipriausia rūgštis.', 'Acidity rises as the s character falls, so ethane is the strongest acid.'),
          t('Visų keturių junginių vandenilių rūgštingumas vienodas, nes jie visi silpnos rūgštys.', 'The hydrogens of all four are equally acidic because they are all weak acids.')], HINT_ANION),
        { prompt: t('Amido jonas $NH2-$ yra amoniako ($pKa$ 38) konjuguotoji bazė. Kuriuos iš šių junginių jis deprotonizuoja?', 'The amide ion $NH2-$ is the conjugate base of ammonia ($pKa$ 38). Which of these compounds does it deprotonate?'), kind: 'multi',
          options: [mo('C#C'), mo('C=C'), mo('CC')], answer: [0],
          hint: t('Bazė deprotonizuoja rūgštį, kurios pKa mažesnė už jos konjuguotosios rūgšties pKa.', 'A base deprotonates an acid whose pKa is smaller than that of its own conjugate acid.'),
          solution: t('Tik etiną (pKa 25 < 38): susidaro silpnesnė rūgštis $NH3$. Etenas (44) ir etanas (50) yra silpnesnės rūgštys už amoniaką.', 'Only ethyne (pKa 25 < 38): the weaker acid $NH3$ forms. Ethene (44) and ethane (50) are weaker acids than ammonia.') }
      ],
      why: t('Anijono stabilumas priklauso nuo atomo, kuriame yra krūvis: elektroneigiamesnis ir didesnio s charakterio atomas stabilizuoja anijoną. Todėl acetilenas deprotonizuojamas amidu, o alkenai ir alkanai – ne.', 'The stability of an anion depends on the atom that carries the charge: a more electronegative atom with more s character stabilises the anion. So acetylene is deprotonated by amide, whereas alkenes and alkanes are not.'),
      src: 'L4 p11, p18, S2.20'
    },
    {
      id: 'u04.rank.9',
      q: [{ p: t('Palyginkite trijų karboksirūgščių rūgštingumą.', 'Compare the acidity of three carboxylic acids.') }, { mol: [M('CCC(=O)O'), M('OC(=O)CBr'), M('OC(=O)CF')] }],
      steps: [
        orderStep(['OC(=O)CF', 'OC(=O)CBr', 'CCC(=O)O'], HINT_ANION, t('Fluoracto rūgštis (2,66) > bromacto rūgštis (2,86) > propano rūgštis (apie 4,9).', 'Fluoroacetic acid (2.66) > bromoacetic acid (2.86) > propanoic acid (about 4.9).')),
        reasonStep(t('Halogenai yra elektronų akceptoriai (−I): jie stabilizuoja karboksilato anijoną, tuo labiau, kuo elektroneigiamesnis halogenas; etilgrupė yra donoras (+I) ir anijoną destabilizuoja.', 'Halogens are electron acceptors (−I): they stabilise the carboxylate anion, the more so the more electronegative the halogen; the ethyl group is a donor (+I) and destabilises the anion.'), [
          t('Bromas didesnis už fluorą ir labiau poliarizuojamas, todėl bromacto rūgštis stipresnė už fluoracto.', 'Bromine is larger than fluorine and more polarisable, so bromoacetic acid is stronger than fluoroacetic acid.'),
          t('Etilgrupė yra elektronų akceptorius, todėl propano rūgštis stipriausia.', 'The ethyl group is an electron acceptor, so propanoic acid is the strongest.'),
          t('Rūgštingumą lemia tik anglies atomų skaičius grandinėje: daugiau – stipresnė.', 'Acidity depends only on the number of carbon atoms in the chain: more means stronger.')], HINT_ANION)
      ],
      why: t('Elektronų akceptoriai (halogenai, −I) stabilizuoja karboksilato anijoną ir didina rūgštingumą, o alkilgrupės (+I) jį mažina; poveikis stipresnis, kuo didesnis elektrinis neigiamumas.', 'Electron-acceptor substituents (halogens, −I) stabilise the carboxylate anion and raise the acidity, whereas alkyl groups (+I) lower it; the effect is stronger the higher the electronegativity.'),
      src: 'L4 p20, p22, S2.20',
      claims: [{ name: ['OC(=O)CF', t('fluoretano rūgštis', 'fluoroethanoic acid')] }, { name: ['OC(=O)CBr', t('brometano rūgštis', 'bromoethanoic acid')] }]
    },
    {
      id: 'u04.rank.8',
      q: [{ p: t('Palyginkite keturių junginių rūgštingumą (visi turi tik vieną rūgščiausią vandenilį).', 'Compare the acidity of four compounds (each has one most acidic hydrogen).') }, { mol: [M('CC(C)=O'), M('CCO'), M('CC(=O)CC(C)=O'), M('Oc1ccccc1')] }],
      steps: [
        orderStep(['CC(=O)CC(C)=O', 'Oc1ccccc1', 'CCO', 'CC(C)=O'], HINT_ANION, t('Pentan-2,4-dionas (9,0) > fenolis (9,9) > etanolis (16) > acetonas (19,3).', 'Pentane-2,4-dione (9.0) > phenol (9.9) > ethanol (16) > acetone (19.3).')),
        atomsStep(t('Bakstelėkite pentan-2,4-diono atomą, kuris atiduoda protoną.', 'Tap the atom of pentane-2,4-dione that gives up the proton.'), 'CC(=O)CC(C)=O', [3],
          t('Kurio vandenilio praradimas leidžia anijono krūviui pasiskirstyti per abi $C=O$ grupes?', 'Loss of which hydrogen lets the charge of the anion spread over both $C=O$ groups?'), t('Atomas Nr. 4 (CH₂ tarp dviejų karbonilų): anijono krūvis delokalizuojamas per abu deguonies atomus.', 'Atom no. 4 (the CH₂ between the two carbonyls): the anion charge is delocalised over both oxygen atoms.')),
        reasonStep(t('Diketono anijono krūvis delokalizuotas per dvi $C=O$ grupes; acetone yra tik viena grupė, o alkoksido krūvis lieka vienas.', 'The charge of the diketone anion is delocalised over two $C=O$ groups; acetone has only one such group, and the alkoxide charge stays alone.'), [
          t('C–H rūgštys visada silpnesnės už O–H rūgštis, todėl diketonas negali būti stipresnis už fenolį.', 'C–H acids are always weaker than O–H acids, so the diketone cannot be stronger than phenol.'),
          t('$C=O$ grupė mažina rūgštingumą, nes ištraukia elektronus iš $C–H$ ryšio, todėl acetonas silpniausia.', 'The $C=O$ group lowers acidity because it pulls electrons out of the $C–H$ bond, so acetone is the weakest.'),
          t('Rūgštingumą lemia tik vandenilio poliškumas: $O–H$ visada poliškesnis už $C–H$.', 'Acidity depends only on the polarity of the hydrogen: $O–H$ is always more polar than $C–H$.')], HINT_ANION)
      ],
      why: t('Diketono anijonas stabilizuotas dviejų $C=O$ grupių rezonansu, todėl net C–H junginys (9,0) pralenkia fenolį ir alkoholius. Vienos $C=O$ grupės pakanka, kad acetonas (19,3) būtų rūgštingesnis už alkaną, bet ne už alkoholį.', 'The diketone anion is stabilised by resonance with two $C=O$ groups, so even a C–H compound (9.0) overtakes phenol and the alcohols. A single $C=O$ group is enough to make acetone (19.3) more acidic than an alkane but not than an alcohol.'),
      src: 'L4 p11, p17, S2.20'
    }
  ];

  /* ---------- u04.proton: which of two marked hydrogens is more acidic (L4 p24, S2.20) ---------- */
  const protonProblem = (n, smi, i, j, ans, right, wrong, hint, sol, why, src, claims) => ({
    id: 'u04.proton.' + n,
    q: [{ p: t('Palyginkite protonus, susijusius su atomais Nr. ' + (i + 1) + ' ir Nr. ' + (j + 1) + '.', 'Compare the protons on atoms no. ' + (i + 1) + ' and no. ' + (j + 1) + '.') }, { mol: M(smi, { numbers: 'all' }) }],
    steps: [
      atomsStep(t('Bakstelėkite atomą, kurio protonas rūgštingesnis.', 'Tap the atom whose proton is more acidic.'), smi, [ans], hint, sol),
      reasonStep(right, wrong, t('Nubraižykite abu galimus anijonus: kuris stabilesnis ir kodėl?', 'Draw the two possible anions: which one is more stable, and why?'), right, t('Kodėl šis protonas rūgštingesnis?', 'Why is this proton more acidic?'))
    ],
    why, src, claims
  });
  const PROTON = [
    protonProblem(1, 'CC(C)O', 1, 3, 3,
      t('Deguonis elektroneigiamesnis už anglį, todėl alkoksido krūvis ant $O$ stabilesnis nei karbanijono krūvis ant $C$.', 'Oxygen is more electronegative than carbon, so the alkoxide charge on $O$ is more stable than a carbanion charge on $C$.'),
      [t('$C–H$ ryšys poliškesnis už $O–H$.', 'The $C–H$ bond is more polar than $O–H$.'), t('Antrinis anglies atomas stabilizuoja anijoną stipriau už deguonį (+I).', 'A secondary carbon stabilises an anion more than oxygen does (+I).'), t('Deguonis turi daugiau elektronų, todėl protoną atiduoda sunkiau.', 'Oxygen has more electrons, so it gives up its proton less readily.')],
      t('Palyginkite atomų elektrinį neigiamumą: $O$, $N$ ar $C$?', 'Compare the electronegativity of the atoms: $O$, $N$ or $C$?'), t('Atomas Nr. 4 ($O–H$) rūgštesnis už $C–H$ (Nr. 2): taip $O–H$ > $N–H$ > $C–H$.', 'Atom no. 4 ($O–H$) is more acidic than the $C–H$ (no. 2): so $O–H$ > $N–H$ > $C–H$.'),
      t('Rūgštingumą lemia atomo, atiduodančio protoną, elektrinis neigiamumas: $O–H$ > $N–H$ > $C–H$.', 'Acidity depends on the electronegativity of the atom that gives up the proton: $O–H$ > $N–H$ > $C–H$.'), 'L4 p18, p24'),
    protonProblem(2, 'SCCCO', 0, 4, 0,
      t('Siera didesnė ir labiau poliarizuojama, todėl $RS-$ stabilesnis už $RO-$ ir $S–H$ rūgštesnis už $O–H$.', 'Sulfur is larger and more polarisable, so $RS-$ is more stable than $RO-$ and $S–H$ is more acidic than $O–H$.'),
      [t('Deguonis elektroneigiamesnis, todėl $O–H$ visada rūgštesnis už $S–H$.', 'Oxygen is more electronegative, so $O–H$ is always more acidic than $S–H$.'), t('Alkoholio grupė turi daugiau laisvųjų elektronų porų.', 'The alcohol group has more lone pairs.'), t('Abu protonai vienodai rūgštūs, nes molekulė simetriška.', 'Both protons are equally acidic because the molecule is symmetric.')],
      t('Žemyn grupėje elektrinis neigiamumas mažėja, o poliarizuojamumas didėja: kas svarbiau anijono stabilumui?', 'Down a group electronegativity falls and polarisability rises: which matters more for anion stability?'), t('Atomas Nr. 1 ($S–H$) rūgštesnis už $O–H$ (Nr. 5).', 'Atom no. 1 ($S–H$) is more acidic than the $O–H$ (no. 5).'),
      t('Tioliai yra stipresnės rūgštys už alkoholius dėl didesnio poliarizuojamumo: eilė $C–H$ < $N–H$ < $O–H$ < $S–H$.', 'Thiols are stronger acids than alcohols because of greater polarisability: the series is $C–H$ < $N–H$ < $O–H$ < $S–H$.'), 'L4 p19, p24'),
    protonProblem(3, 'NCCO', 0, 3, 3,
      t('Deguonis elektroneigiamesnis už azotą, todėl alkoksido anijonas stabilesnis už amido anijoną.', 'Oxygen is more electronegative than nitrogen, so the alkoxide anion is more stable than the amide anion.'),
      [t('Azotas turi daugiau vandenilių, todėl $N–H$ stipresnė rūgštis.', 'Nitrogen carries more hydrogens, so $N–H$ is the stronger acid.'), t('Amino grupė yra bazė, todėl neatiduoda protono, o hidroksilo grupė – atiduoda.', 'An amino group is a base so it never gives up a proton, while a hydroxyl group does.'), t('Protonų rūgštingumas vienodas, nes jie abu prie heteroatomų.', 'The acidity of the protons is the same because both sit on heteroatoms.')],
      t('Palyginkite $O$ ir $N$ elektrinį neigiamumą.', 'Compare the electronegativity of $O$ and $N$.'), t('Atomas Nr. 4 ($O–H$) rūgštesnis už $N–H$ (Nr. 1).', 'Atom no. 4 ($O–H$) is more acidic than the $N–H$ (no. 1).'),
      t('$O–H$ rūgštys stipresnės už $N–H$ rūgštis, nes deguonis elektroneigiamesnis.', '$O–H$ acids are stronger than $N–H$ acids because oxygen is more electronegative.'), 'L4 p18, p24'),
    protonProblem(4, 'CCC=C', 1, 0, 1,
      t('Alilo anijono krūvis delokalizuojamas per dvigubą ryšį (rezonansas), o metilo anijono krūvis lieka ant vieno atomo.', 'The charge of an allyl anion is delocalised through the double bond (resonance), whereas the charge of the methyl-type anion stays on one atom.'),
      [t('Metilgrupė turi daugiau vandenilių, todėl ji rūgštesnė.', 'The methyl group has more hydrogens, so it is more acidic.'), t('Dvigubas ryšys yra elektronų donoras, todėl jis stabilizuoja anijoną.', 'A double bond is an electron donor, so it stabilises the anion.'), t('Abu protonai prie $sp^3^$ anglies, todėl jų rūgštingumas vienodas.', 'Both protons are on $sp^3^$ carbon, so their acidity is the same.')],
      t('Kuris anijonas gretimas $π$ sistemai ir galėtų turėti rezonansinių formulių?', 'Which anion is next to a $π$ system and could have resonance structures?'), t('Atomas Nr. 2 yra alilo padėtyje: jo anijonas konjuguoja su dvigubu ryšiu.', 'Atom no. 2 is in the allylic position: its anion is conjugated with the double bond.'),
      t('Neigiamo krūvio delokalizacija stabilizuoja anijoną: alilo $C–H$ rūgštesnis už paprastą alkilo $C–H$.', 'Delocalisation of the negative charge stabilises an anion: an allylic $C–H$ is more acidic than a simple alkyl $C–H$.'), 'L4 p17, p24'),
    protonProblem(5, 'NCc1ccc(N)cc1', 0, 6, 6,
      t('Aromatinio amino anijono krūvis gali delokalizuotis benzeno žiede, o alifatinio amino krūvis lieka ant azoto.', 'The charge of an aromatic amine anion can be delocalised into the benzene ring, whereas that of an aliphatic amine stays on nitrogen.'),
      [t('Alifatinis aminas turi $CH2$ grupę, kuri didina rūgštingumą (+I).', 'The aliphatic amine has a $CH2$ group, which raises acidity (+I).'), t('Aromatinis aminas yra stipresnė bazė, todėl protoną atiduoda sunkiau.', 'An aromatic amine is the stronger base, so it gives up a proton less readily.'), t('Abu azoto atomai vienodi, nes abu yra $NH2$ grupės.', 'Both nitrogen atoms are the same because both are $NH2$ groups.')],
      t('Kuris iš dviejų azotų susijęs su žiedu?', 'Which of the two nitrogens is attached to the ring?'), t('Atomas Nr. 7 (prie žiedo) rūgštesnis už alifatinį $N–H$ (Nr. 1).', 'Atom no. 7 (on the ring) is more acidic than the aliphatic $N–H$ (no. 1).'),
      t('Aromatinis radikalas yra elektronų akceptorius, todėl anijonas stabilesnis, o rūgštingumas didesnis; pats azotas tampa ir silpnesne baze.', 'An aromatic radical is an electron acceptor, so it stabilises the anion and raises acidity; nitrogen also becomes a weaker base.'), 'L4 p24, p30'),
    protonProblem(6, 'C1C=CC=C1', 0, 1, 0,
      t('Deprotonavus $CH2$ susidaro ciklopentadienido anijonas: aromatinė sistema su šešiais $π$ elektronais, krūvis pasidalija per visą žiedą.', 'Deprotonating the $CH2$ gives the cyclopentadienide anion: an aromatic system with six $π$ electrons whose charge is spread over the whole ring.'),
      [t('$sp^2^$ anglis elektroneigiamesnė už $sp^3^$, todėl vinilo $C–H$ visada rūgštesnis.', 'An $sp^2^$ carbon is more electronegative than $sp^3^$, so a vinylic $C–H$ is always more acidic.'), t('$CH2$ turi du vandenilius, todėl jo rūgštingumas didesnis.', '$CH2$ has two hydrogens, so its acidity is higher.'), t('Abu protonai tokie patys, nes molekulė žiedinė.', 'Both protons are the same because the molecule is cyclic.')],
      t('Nubraižykite anijoną po $CH2$ deprotonavimo: kiek $π$ elektronų turi žiedas?', 'Draw the anion after deprotonation of $CH2$: how many $π$ electrons does the ring have?'), t('Atomas Nr. 1 ($CH2$) rūgštesnis: jo anijonas aromatinis.', 'Atom no. 1 ($CH2$) is more acidic: its anion is aromatic.'),
      t('Anijono stabilumą didina delokalizacija, ypač aromatinė: ciklopentadienas yra neįprastai rūgšti $C–H$ rūgštis.', 'Delocalisation stabilises an anion, aromatic delocalisation most of all: cyclopentadiene is an unusually acidic C–H acid.'), 'L4 p24'),
    protonProblem(7, 'CC(=O)CCC', 3, 4, 3,
      t('$α$ anglies anijonas (enolatas) konjuguotas su $C=O$ grupe: krūvis dalijasi su deguonimi.', 'The anion of the $α$ carbon (an enolate) is conjugated with the $C=O$ group: the charge is shared with oxygen.'),
      [t('$β$ anglis toliau nuo $C=O$, todėl labiau apsaugota ir rūgštesnė.', 'The $β$ carbon is farther from $C=O$, so it is better shielded and more acidic.'), t('$C=O$ grupė yra donorė ir mažina gretimo $C–H$ rūgštingumą.', 'The $C=O$ group is a donor and lowers the acidity of the neighbouring $C–H$.'), t('Visi sotieji $C–H$ ryšiai tokio pat rūgštingumo.', 'All saturated $C–H$ bonds are equally acidic.')],
      t('Kurio anijono krūvis gali pasiekti deguonį?', 'The charge of which anion can reach oxygen?'), t('Atomas Nr. 4 ($α$ padėtyje) rūgštesnis už $β$ atomą (Nr. 5).', 'Atom no. 4 (the $α$ position) is more acidic than the $β$ atom (no. 5).'),
      t('Karbonilo grupė padidina greta esančio $C–H$ rūgštingumą, nes anijonas stabilizuojamas rezonansu (acetono pKa 19,3).', 'A carbonyl group raises the acidity of the adjacent $C–H$ because the anion is stabilised by resonance (acetone pKa 19.3).'), 'L4 p11, p24'),
    protonProblem(8, 'CC(=O)CCC(=O)O', 3, 7, 7,
      t('Karboksilato krūvis pasidalija tarp dviejų lygiaverčių deguonies atomų, o $α$-anglies anijonas (enolatas) turi tik vieną $C=O$ grupę ir anglies centrą: $O–H$ pKa 3–5, o $C–H$ prie $C=O$ – apie 19.', 'The carboxylate charge is shared by two equivalent oxygen atoms, whereas the enolate of an $α$ $C–H$ has only one $C=O$ and a carbon centre: the $O–H$ has pKa 3–5, a $C–H$ next to $C=O$ about 19.'),
      [t('Metileno grupė tarp dviejų karbonilų visada rūgščiausia vieta molekulėje.', 'A methylene group between two carbonyls is always the most acidic site in a molecule.'), t('Karboksilo grupė turi mažiau vandenilių, todėl rūgštis silpnesnė.', 'The carboxyl group has fewer hydrogens, so it is a weaker acid.'), t('Abu protonai vienodai rūgštūs, nes abu šalia $C=O$.', 'Both protons are equally acidic because both are next to $C=O$.')],
      t('Palyginkite $O–H$ rūgštį (pKa 3–5) su $C–H$ rūgštimi šalia $C=O$ (pKa apie 19).', 'Compare an $O–H$ acid (pKa 3–5) with a $C–H$ acid next to $C=O$ (pKa about 19).'), t('Atomas Nr. 8 ($O–H$) rūgštesnis už $α$ $CH2$ (Nr. 4).', 'Atom no. 8 ($O–H$) is more acidic than the $α$ $CH2$ (no. 4).'),
      t('Karboksirūgšties $O–H$ (pKa 3–5) paprastai rūgštesnis už net aktyvuotą $C–H$ (pKa apie 19).', 'The $O–H$ of a carboxylic acid (pKa 3–5) is normally more acidic than even an activated $C–H$ (pKa about 19).'), 'L4 p24, p36'),
    protonProblem(9, 'Cc1ccc(O)cc1', 0, 5, 5,
      t('Fenoksido krūvis delokalizuotas žiede ir ant elektroneigiamo deguonies, o benzilo anijonas turi krūvį ant anglies.', 'The phenoxide charge is delocalised in the ring and held on electronegative oxygen, whereas a benzyl anion has the charge on carbon.'),
      [t('Metilo grupė yra donorė ir mažina elektronų tankį, todėl jos $C–H$ rūgštesnis.', 'The methyl group is a donor and lowers electron density, so its $C–H$ is more acidic.'), t('Benzilo $C–H$ rūgštesnis, nes yra šalia benzeno žiedo.', 'A benzylic $C–H$ is more acidic because it is next to the benzene ring.'), t('Abu protonai tokie patys, nes abu susiję su žiedu.', 'Both protons are the same because both are linked to the ring.')],
      t('Palyginkite, kuris anijonas turi krūvį ant elektroneigiamesnio atomo.', 'Compare which anion has the charge on the more electronegative atom.'), t('Atomas Nr. 6 ($O–H$) rūgštesnis už metilo $C–H$ (Nr. 1).', 'Atom no. 6 ($O–H$) is more acidic than the methyl $C–H$ (no. 1).'),
      t('Fenolis yra O–H rūgštis, kurios anijonas stabilizuotas rezonansu (pKa 9,9); tai kur kas stipresnė rūgštis nei benzilo $C–H$.', 'Phenol is an O–H acid whose anion is stabilised by resonance (pKa 9.9); it is a far stronger acid than a benzylic $C–H$.'), 'L4 p11, p24')
  ];

  /* ---------- u04.basecentre: basic centre and strength of bases (L4 p25-31) ---------- */
  const HINT_BASE = t('Bazę nusako gebėjimas jungti protoną: ieškokite laisvosios elektronų poros ir klauskite, ar ji lengvai prieinama.', 'A base is judged by its ability to bind a proton: look for a lone pair and ask how readily available it is.');
  const baseCentre = (n, smi, ans, prompt, hint, sol, right, wrong, why, src) => ({
    id: 'u04.basecentre.' + n,
    q: [{ p: prompt }, { mol: M(smi, { numbers: 'all' }) }],
    steps: [
      atomsStep(t('Bakstelėkite atomą, kuris pirmiausia prisijungs protoną.', 'Tap the atom that will take up the proton first.'), smi, [ans], hint, sol),
      reasonStep(right, wrong, HINT_BASE, right, t('Kodėl būtent šis atomas?', 'Why this atom?'))
    ],
    why, src
  });
  const BASEC = [
    baseCentre(1, 'NCCO', 0, t('2-aminoetanolyje yra du galimi baziniai centrai.', '2-Aminoethanol has two possible basic centres.'),
      t('Palyginkite $N$ ir $O$ elektrinį neigiamumą: kuris silpniau laiko laisvąją porą?', 'Compare the electronegativity of $N$ and $O$: which holds its lone pair less tightly?'), t('Azoto atomas (Nr. 1) yra bazingesnis už deguonį (Nr. 4).', 'The nitrogen atom (no. 1) is more basic than oxygen (no. 4).'),
      t('Azotas mažiau elektroneigiamas už deguonį, todėl silpniau laiko laisvąją porą ir lengviau ją suteikia protonui ($:N$ > $:O$).', 'Nitrogen is less electronegative than oxygen, so it holds its lone pair less tightly and gives it more readily to a proton ($:N$ > $:O$).'),
      [t('Deguonis turi dvi laisvąsias poras, todėl yra stipresnė bazė.', 'Oxygen has two lone pairs, so it is the stronger base.'), t('Hidroksilo grupė didina azoto elektronų tankį, todėl bazingesnis yra deguonis.', 'The hydroxyl group raises the electron density, so oxygen is the more basic.'), t('Azotas turi daugiau vandenilių.', 'Nitrogen has more hydrogens.')],
      t('Bazė silpnesnė, kai jos baziniame centre yra elektroneigiamesnis atomas, nes jis tvirčiau laiko laisvąją porą: aminai stipresni už alkoholius.', 'The higher the electronegativity of the atom of the basic centre, the more tightly it holds the lone pair and the weaker the base: amines are stronger than alcohols.'), 'L4 p29, T p36'),
    baseCentre(2, 'CSCCO', 4, t('2-(metiltio)etanolyje yra ir sulfonio, ir oksonio tipo centras.', '2-(Methylsulfanyl)ethanol has both a sulfonium-type and an oxonium-type centre.'),
      t('Prisiminkite eilę $:N$ > $:O$ > $:S$.', 'Recall the series $:N$ > $:O$ > $:S$.'), t('Deguonis (Nr. 5) bazingesnis už sierą (Nr. 2).', 'Oxygen (no. 5) is more basic than sulfur (no. 2).'),
      t('Sieros atomas didesnis ir labiau poliarizuojamas: laisvoji pora išsklaidyta didesniame tūryje ir sunkiau jungia protoną, todėl $:S$ yra silpnesnė bazė už $:O$.', 'The sulfur atom is larger and more polarisable: its lone pair is spread over a larger volume and binds a proton less readily, so $:S$ is a weaker base than $:O$.'),
      [t('Siera mažiau elektroneigiama už deguonį, todėl jos laisvoji pora labiau tinka protonui.', 'Sulfur is less electronegative than oxygen, so its lone pair suits a proton better.'), t('Eteriai bazingesni už alkoholius, nes neturi $O–H$ ryšio.', 'Ethers are more basic than alcohols because they have no $O–H$ bond.'), t('Siera turi daugiau elektronų, todėl protoną sudaro stipresnį ryšį.', 'Sulfur has more electrons, so it forms a stronger bond to the proton.')],
      t('Didėjant atomo matmenims, laisvoji pora labiau išsklaidoma ir bazė silpnėja: $:S$ < $:O$ < $:N$.', 'As atoms get larger the lone pair is spread out more and the base gets weaker: $:S$ < $:O$ < $:N$.'), 'L4 p29, T p36'),
    baseCentre(3, 'C=CCCN', 4, t('Bute-3-en-1-amine yra ir $π$ ryšys, ir laisvoji azoto pora.', 'But-3-en-1-amine has both a $π$ bond and the lone pair of nitrogen.'),
      t('Palyginkite, kuris centras – $π$ elektronai ar laisvoji pora – lengviau prieinamas protonui.', 'Compare which centre, $π$ electrons or the lone pair, is more available to a proton.'), t('Azoto atomas (Nr. 5) yra bazinis centras; $π$ ryšys – labai silpnas.', 'The nitrogen atom (no. 5) is the basic centre; the $π$ bond is a very weak one.'),
      t('Laisvoji azoto pora nedalyvauja jokiame ryšyje ir lengvai sudaro ryšį su protonu, o $π$ ryšio elektronai jau yra ryšyje: $π$ bazės labai silpnos.', 'The lone pair on nitrogen is in no bond and readily bonds to a proton, whereas the $π$ electrons are already in a bond: $π$ bases are very weak.'),
      [t('$π$ elektronai labiau išsikišę, todėl dvigubasis ryšys stipresnė bazė.', 'The $π$ electrons stick out more, so a double bond is the stronger base.'), t('Azotas negali prisijungti protono, nes jau susijęs su trimis atomais.', 'Nitrogen cannot take a proton because it is already linked to three atoms.'), t('Abu centrai vienodai bazingi.', 'Both centres are equally basic.')],
      t('Bazei reikia arba $π$ elektronų, arba laisvosios poros; $π$ bazės (alkenai, arenai) labai silpnos, nes protoną prisijungianti pora nėra laisva.', 'A base needs either $π$ electrons or a lone pair; $π$ bases (alkenes, arenes) are very weak because the pair that takes up the proton is not free.'), 'L4 p25, T p35'),
    baseCentre(4, 'NCc1ccc(N)cc1', 0, t('4-aminobenzilaminas turi alifatinį ir aromatinį amino azotą.', '4-Aminobenzylamine has an aliphatic and an aromatic amino nitrogen.'),
      t('Kuriam azotui laisvoji pora konjuguoja su žiedu?', 'Whose lone pair is conjugated with the ring?'), t('Alifatinis azotas (Nr. 1) bazingesnis už aromatinį (Nr. 7).', 'The aliphatic nitrogen (no. 1) is more basic than the aromatic one (no. 7).'),
      t('Aromatinio azoto laisvoji pora delokalizuota benzeno žiede (žiedas – akceptorius), todėl ji sunkiau jungia protoną; alifatinio azoto pora laisva.', 'The lone pair of the aromatic nitrogen is delocalised in the benzene ring (the ring is an acceptor), so it binds a proton less readily; the aliphatic nitrogen pair is free.'),
      [t('Aromatinis azotas turi daugiau elektronų tankio, nes žiedas yra donoras.', 'The aromatic nitrogen has more electron density because the ring is a donor.'), t('Alifatinis azotas silpnesnė bazė, nes šalia yra benzeno žiedas.', 'The aliphatic nitrogen is the weaker base because the benzene ring is nearby.'), t('Abu azotai $NH2$ grupės, todėl jų bazingumas vienodas.', 'Both nitrogens are $NH2$ groups so their basicity is the same.')],
      t('Aromatiniai radikalai yra elektronų akceptoriai ir mažina bazingumą: anilinas (4,6) daug silpnesnė bazė už amoniaką (9,26) ar alifatinį aminą (10,62).', 'Aromatic groups are electron acceptors and lower basicity: aniline (4.6) is a much weaker base than ammonia (9.26) or an aliphatic amine (10.62).'), 'L4 p30'),
    baseCentre(5, 'CC(=O)N', 2, t('Etanamide yra ir azotas, ir karbonilo deguonis. Kur prisijungia protonas?', 'Ethanamide has both a nitrogen and a carbonyl oxygen. Where does the proton go?'),
      t('Kuriam atomui laisvoji pora nedalyvauja konjugacijoje su $C=O$?', 'Whose lone pair is not tied up in conjugation with the $C=O$ group?'), t('Protonuojamas karbonilo deguonis (Nr. 3).', 'The carbonyl oxygen (no. 3) is protonated.'),
      t('Azoto laisvoji pora konjuguoja su $C=O$ grupe, todėl azotas nebazingas; rūgščių dariniai yra oksonio tipo bazės ir protonuojami ties karbonilo deguonimi.', 'The lone pair of nitrogen is conjugated with the $C=O$ group, so nitrogen is not basic; acid derivatives are oxonium-type bases and are protonated on the carbonyl oxygen.'),
      [t('Azotas visada bazingesnis už deguonį, todėl protonuojamas azotas.', 'Nitrogen is always more basic than oxygen, so nitrogen is protonated.'), t('Protonuojama anglis, nes ji elektrofilinė.', 'Carbon is protonated because it is electrophilic.'), t('Amidas protono neprijungia.', 'An amide does not take up a proton.')],
      t('Rūgščių dariniai $RCOX$ ($X$ = OR, $NH2$, Hal) yra oksonio tipo bazės: bazinis centras – karbonilo deguonis.', 'Acid derivatives $RCOX$ ($X$ = OR, $NH2$, Hal) are oxonium-type bases: the basic centre is the carbonyl oxygen.'), 'L4 p27, T p36'),
    {
      id: 'u04.basecentre.6',
      q: [{ p: t('Palyginkite keturių bazių stiprumą. Konjuguotųjų rūgščių pKa: $NH3$ 38, $H2O$ 15,7, $NH4+$ 9,26, $H3O+$ −1,74.', 'Compare the strength of four bases. pKa of the conjugate acids: $NH3$ 38, $H2O$ 15.7, $NH4+$ 9.26, $H3O+$ −1.74.') }],
      steps: [
        {
          prompt: t('Išdėstykite bazes nuo stipriausios iki silpniausios.', 'Put the bases in order from the strongest to the weakest.'), kind: 'order',
          options: [{ text: f('$NH2-$') }, { text: f('$OH-$') }, { text: f('$NH3$') }, { text: f('$H2O$') }],
          hint: t('Bazės stiprumą rodo jos konjuguotosios rūgšties pKa: kuo didesnė, tuo bazė stipresnė.', 'The strength of a base is shown by the pKa of its conjugate acid: the larger, the stronger the base.'),
          solution: t('$NH2-$ (38) > $OH-$ (15,7) > $NH3$ (9,26) > $H2O$ (−1,74).', '$NH2-$ (38) > $OH-$ (15.7) > $NH3$ (9.26) > $H2O$ (−1.74).')
        },
        reasonStep(t('Anijonai yra stipresnės bazės už neutralias molekules, o bazės stiprumą rodo konjuguotosios rūgšties pKa: kuo ji didesnė, tuo bazė stipresnė.', 'Anions are stronger bases than neutral molecules, and the strength of a base is shown by the pKa of its conjugate acid: the larger it is, the stronger the base.'), [
          t('Neutralios molekulės stipresnės bazės už anijonus, nes neturi krūvio.', 'Neutral molecules are stronger bases than anions because they carry no charge.'),
          t('Kuo mažesnė konjuguotosios rūgšties pKa, tuo bazė stipresnė.', 'The smaller the pKa of the conjugate acid, the stronger the base.'),
          t('Bazės stiprumą lemia tik atomų skaičius formulėje.', 'The strength of a base depends only on the number of atoms in the formula.')], t('Palyginkite dalelės krūvį ir jos konjuguotosios rūgšties stiprumą.', 'Compare the charge of the species and the strength of its conjugate acid.'))
      ],
      why: t('Neutralioms bazėms taikomos taisyklės tinka ir anijonams, bet anijonai paprastai stipresni už neutralias daleles ($NH2-$ > $NH3$, $HO-$ > $H2O$). Bazės matas – jos konjuguotosios rūgšties pKa.', 'All regularities seen with neutral bases also hold for anions, but anions are usually stronger than neutral species ($NH2-$ > $NH3$, $HO-$ > $H2O$). The measure of a base is the pKa of its conjugate acid.'),
      src: 'L4 p11, p28, p31'
    },
    {
      id: 'u04.basecentre.7',
      q: [{ p: t('Palyginkite etoksido ir etiltiolato anijonų bazingumą.', 'Compare the basicity of the ethoxide and ethanethiolate anions.') }, { mol: [M('CC[O-]'), M('CC[S-]')] }],
      steps: [
        cho(t('Kuris anijonas stipresnė bazė?', 'Which anion is the stronger base?'), [mo('CC[O-]'), mo('CC[S-]')], 0,
          t('Prisiminkite, kuri rūgštis stipresnė – alkoholis ar tiolis; tada konjuguotoji bazė bus priešinga.', 'Recall which acid is stronger, the alcohol or the thiol; then the conjugate base is the opposite.'),
          t('Tiolis yra stipresnė rūgštis už alkoholį, todėl $RS-$ yra silpnesnė bazė, o $RO-$ – stipresnė.', 'The thiol is a stronger acid than the alcohol, so $RS-$ is the weaker base and $RO-$ the stronger.')),
        reasonStep(t('Sieros atomas didesnis ir labiau poliarizuojamas, todėl neigiamas krūvis išsklaidytas ir $RS-$ stabilesnis: stabilesnis anijonas yra silpnesnė bazė.', 'The sulfur atom is larger and more polarisable, so the negative charge is spread out and $RS-$ is more stable: the more stable anion is the weaker base.'), [
          t('Siera mažiau elektroneigiama, todėl jos anijonas stipriau jungia protoną.', 'Sulfur is less electronegative, so its anion binds a proton more strongly.'), t('Deguonies anijonas didesnis, todėl labiau poliarizuojamas.', 'The oxygen anion is larger and therefore more polarisable.'), t('Abu anijonai yra vienodai stabilūs, nes jų krūviai vienodi.', 'Both anions are equally stable because their charges are the same.')], t('Palyginkite, kuris anijonas stabilesnis, ir prisiminkite, kaip anijono stabilumas susijęs su bazės stiprumu.', 'Compare which anion is more stable and recall how anion stability relates to base strength.'))
      ],
      why: t('Stabilesnis anijonas yra silpnesnė bazė, nes mažiau linkęs jungti protoną. Dėl didesnio poliarizuojamumo $RS-$ stabilesnis už $RO-$, o jų konjuguotosios rūgštys – tiolis (stipresnė) ir alkoholis (silpnesnė).', 'A more stable anion is a weaker base because it is less eager to bind a proton. Owing to its higher polarisability $RS-$ is more stable than $RO-$, and their conjugate acids are the thiol (the stronger) and the alcohol (the weaker).'),
      src: 'L4 p19, p29, p31'
    },
    {
      id: 'u04.basecentre.8',
      q: [{ p: t('Pagal bazinį centrą skirstykite bazes.', 'Sort the bases by their basic centre.') }],
      steps: [
        {
          prompt: t('Sujunkite kiekvieną junginį su jo bazės tipu.', 'Match each compound with its type of base.'), kind: 'match',
          answer: { left: [mo('CCN'), mo('CCOCC'), mo('CCSCC'), mo('C=C')], right: [tx('amonio bazė ($:N$)', 'ammonium-type base ($:N$)'), tx('oksonio bazė ($:O$)', 'oxonium-type base ($:O$)'), tx('sulfonio bazė ($:S$)', 'sulfonium-type base ($:S$)'), tx('$π$ bazė', '$π$ base')], pairs: [0, 1, 2, 3] },
          hint: t('Pažiūrėkite, kuris atomas turi laisvąją porą, o jei nė vieno – kokie elektronai sudaro baziną centrą.', 'See which atom has the lone pair, and if there is none, which electrons form the basic centre.'),
          solution: t('Aminas – amonio, eteris – oksonio, sulfidas – sulfonio tipo bazė, o etenas turi tik $π$ ryšio elektronus.', 'The amine is an ammonium-type, the ether an oxonium-type, the sulfide a sulfonium-type base, and ethene has only the electrons of its $π$ bond.')
        },
        {
          prompt: t('Išdėstykite tuos pačius junginius nuo stipriausios iki silpniausios bazės.', 'Put the same compounds in order from the strongest to the weakest base.'), kind: 'order',
          options: [mo('CCN'), mo('CCOCC'), mo('CCSCC'), mo('C=C')],
          hint: t('Eilė $:N$ > $:O$ > $:S$ ir $π$ bazės – labai silpnos.', 'The series is $:N$ > $:O$ > $:S$, and $π$ bases are very weak.'),
          solution: t('Aminas > eteris > sulfidas > alkenas: elektrinis neigiamumas mažėja, o poliarizuojamumas didėja, $π$ pora nelaisva.', 'Amine > ether > sulfide > alkene: electronegativity falls and polarisability rises, and the $π$ pair is not free.')
        }
      ],
      why: t('Baziniu centru gali būti heteroatomo laisvoji pora (amonio, oksonio, sulfonio bazės) arba $π$ elektronai. Stiprumas mažėja eilėje $:N$ > $:O$ > $:S$, o $π$ bazės – silpniausios.', 'A basic centre can be a lone pair on a heteroatom (ammonium-, oxonium- and sulfonium-type bases) or $π$ electrons. Strength falls in the series $:N$ > $:O$ > $:S$, and $π$ bases are the weakest.'),
      src: 'L4 p25-29, T p35-36'
    }
  ];

  /* ---------- u04.lewis ---------- */
  const lewisOpts = (arr) => arr.map((s) => ({ text: f(s) }));
  const LEWIS = [
    {
      id: 'u04.lewis.1',
      q: [{ p: t('Luiso rūgštys yra elektronų poros akceptoriai.', 'Lewis acids are electron-pair acceptors.') }],
      steps: [
        { prompt: t('Pažymėkite visas Luiso rūgštis.', 'Pick every Lewis acid.'), kind: 'multi', options: lewisOpts(['$BF3$', '$NH3$', '$AlCl3$', '$CH3OH$', '$FeBr3$', '$ZnCl2$']), answer: [0, 2, 4, 5],
          hint: t('Ieškokite junginių, kurių centrinis atomas turi tuščią orbitalę (neužpildytą oktetą arba metalo katijoną).', 'Look for compounds whose central atom has a vacant orbital (an incomplete octet or a metal cation).'),
          solution: t('$BF3$, $AlCl3$, $FeBr3$ ir $ZnCl2$ turi tuščią orbitalę; $NH3$ ir $CH3OH$ turi laisvąsias poras, todėl yra Luiso bazės.', '$BF3$, $AlCl3$, $FeBr3$ and $ZnCl2$ have a vacant orbital; $NH3$ and $CH3OH$ have lone pairs and are therefore Lewis bases.') },
        reasonStep(t('Visos turi laisvą orbitalę, į kurią gali patekti elektronų pora ir susidaryti kovalentinis ryšys.', 'All have a vacant orbital that can accept an electron pair when a covalent bond forms.'), [
          t('Visos turi protoną, kurį gali atiduoti.', 'All have a proton they can give away.'), t('Visos turi elektronų porą, kurią galėtų perduoti.', 'All have a lone pair that they can give away.'), t('Visos yra anijonai.', 'All are anions.')], t('Kokio požymio reikia elektronų poros akceptoriui?', 'What does an electron-pair acceptor need?'), undefined, t('Ką bendro turi šios rūgštys?', 'What do these acids have in common?'))
      ],
      why: t('Luiso rūgštis – elektronų poros akceptorius (elektrofilas), todėl jai reikia tuščios orbitalės. Protono ji neturi būti: $BF3$ ir $AlCl3$ jo neturi.', 'A Lewis acid is an electron-pair acceptor (an electrophile), so it needs a vacant orbital. It does not need a proton: $BF3$ and $AlCl3$ have none.'),
      src: 'L4 p34, T p37'
    },
    {
      id: 'u04.lewis.2',
      q: [{ p: t('Luiso bazės yra elektronų poros donorai.', 'Lewis bases are electron-pair donors.') }],
      steps: [
        { prompt: t('Pažymėkite visas Luiso bazes.', 'Pick every Lewis base.'), kind: 'multi', options: lewisOpts(['$H2O$', '$BF3$', '$Cl-$', '$CH3SCH3$', '$H+$', '$AlCl3$']), answer: [0, 2, 3],
          hint: t('Ieškokite dalelių su bent viena valentinių elektronų pora, kurią galėtų atiduoti.', 'Look for species with at least one valence electron pair they can give away.'),
          solution: t('$H2O$, $Cl-$ ir dimetilsulfidas turi laisvąsias poras. $BF3$, $AlCl3$ ir $H+$ turi tuščią orbitalę – tai Luiso rūgštys.', '$H2O$, $Cl-$ and dimethyl sulfide have lone pairs. $BF3$, $AlCl3$ and $H+$ have a vacant orbital: they are Lewis acids.') },
        cho(t('Kaip dar vadinamos Luiso bazės?', 'What else are Lewis bases called?'), [tx('Nukleofilai', 'Nucleophiles'), tx('Elektrofilai', 'Electrophiles'), tx('Protonų donorai', 'Proton donors'), tx('Radikalai', 'Radicals')], 0,
          t('Jos atiduoda elektronų porą atomui, kuriam reikia elektronų.', 'They donate an electron pair to an atom that needs electrons.'), t('Nukleofilai yra Luiso bazės, o elektrofilai – Luiso rūgštys; Brionstedo bazės taip pat yra Luiso bazės.', 'Lewis bases are nucleophiles, Lewis acids are electrophiles; Lewis bases coincide with Brønsted bases.'))
      ],
      why: t('Elektronų poros donoras ir nukleofilas yra Luiso bazė. Visos Brionstedo bazės yra Luiso bazės, nes protoną jungia elektronų pora.', 'A Lewis base is an electron-pair donor and a nucleophile. Every Brønsted base is a Lewis base because a pair of electrons binds the proton.'),
      src: 'L4 p34, T p37'
    },
    {
      id: 'u04.lewis.3',
      q: [{ p: t('Vanduo reaguoja su boro trifluoridu.', 'Water reacts with boron trifluoride.') }, SC([M('O'), PLUS, M('FB(F)F'), FW])],
      steps: [
        atomsStep(t('Bakstelėkite atomą, kuris priima elektronų porą.', 'Tap the atom that accepts the electron pair.'), 'FB(F)F', [1],
          t('Kuris atomas neturi pilno okteto?', 'Which atom has no complete octet?'), t('Boras (Nr. 2) turi tik šešis valentinius elektronus ir tuščią orbitalę.', 'Boron (no. 2) has only six valence electrons and a vacant orbital.')),
        cho(t('Koks produktas susidaro?', 'What is the product?'), [mo('[OH2+][B-](F)(F)F'), mo('OB(F)F.F'), mo('FB(F)F.O')], 0,
          t('Vandens deguonies pora sudaro ryšį su boru; kas gali išeiti?', 'The lone pair on the oxygen of water bonds to boron; what could leave?'),
          [{ p: t('Susidaro adduktas: deguonis teigiamas, boras neigiamas.', 'An adduct forms: oxygen is positive, boron negative.') },
            { mech: [{ scheme: { items: [M('O', { lonePairs: true }), PLUS, M('FB(F)F')] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }] }] }, mo('[OH2+][B-](F)(F)F')]),
        atomsStep(t('Produkte bakstelėkite atomą, turintį neigiamą formalųjį krūvį.', 'In the product, tap the atom with a negative formal charge.'), '[OH2+][B-](F)(F)F', [1],
          t('Kuris atomas priėmė elektronų porą ir turi keturis ryšius?', 'Which atom accepted the pair and now has four bonds?'), t('Boras (Nr. 2) turi keturis ryšius ir neigiamą krūvį.', 'Boron (no. 2) has four bonds and a negative charge.'))
      ],
      why: t('Vanduo atiduoda elektronų porą (Luiso bazė), o $BF3$ ją priima (Luiso rūgštis). Reakcija baigiasi adduktu, o nueinančios grupės nėra.', 'Water is the Lewis base (electron-pair donor) and $BF3$ the Lewis acid (acceptor). The reaction ends with an adduct and there is no leaving group.'),
      src: 'L4 p35', claims: [{ formula: ['[OH2+][B-](F)(F)F', 'BF3H2O'] }]
    },
    {
      id: 'u04.lewis.4',
      q: [{ p: t('Chlorido jonas reaguoja su aliuminio trichloridu.', 'The chloride ion reacts with aluminium trichloride.') }, SC([M('[Cl-]'), PLUS, M('Cl[Al](Cl)Cl'), FW])],
      steps: [
        cho(t('Koks produktas susidaro?', 'What is the product?'), [mo('Cl[Al-](Cl)(Cl)Cl'), mo('Cl[Al](Cl)Cl.[Cl-]'), tx('$Cl2$ ir $AlCl2-$', '$Cl2$ and $AlCl2-$')], 0,
          t('Chlorido pora užpildo laisvąją aliuminio orbitalę; nueinančios grupės nėra.', 'The chloride pair fills the vacant orbital on aluminium; there is no leaving group.'),
          [{ p: t('Susidaro tetrachloraliuminato anijonas:', 'The tetrachloroaluminate anion forms:') }, mo('Cl[Al-](Cl)(Cl)Cl')]),
        cho(t('Kaip nukreipta lenktoji rodyklė?', 'How does the curved arrow run?'), [tx('Nuo $Cl-$ laisvosios poros prie $Al$.', 'From the lone pair of $Cl-$ to $Al$.'), tx('Nuo $Al–Cl$ ryšio prie $Cl-$.', 'From an $Al–Cl$ bond to $Cl-$.'), tx('Nuo $Al$ atomo prie $Cl-$.', 'From the $Al$ atom to $Cl-$.')], 0, HINT_ARROW,
          [{ p: t('Elektronų pora keliauja nuo bazės prie rūgšties:', 'The electron pair travels from the base to the acid:') }, { mech: [{ scheme: { items: [M('[Cl-]', { lonePairs: true }), PLUS, M('Cl[Al](Cl)Cl')] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 1 } }] }] }])
      ],
      why: t('$AlCl3$ turi tuščią orbitalę ir yra Luiso rūgštis, $Cl-$ – elektronų poros donoras. Šis kompleksas svarbus aromatiniuose pakeitimuose, kuriuose $AlCl3$ ir $FeBr3$ aktyvina reagentą.', '$AlCl3$ has a vacant orbital and is a Lewis acid, $Cl-$ is the electron-pair donor. This kind of complex matters in aromatic substitution, where $AlCl3$ and $FeBr3$ activate the reagent.'),
      src: 'L4 p34', claims: [{ formula: ['Cl[Al-](Cl)(Cl)Cl', 'AlCl4-'] }]
    },
    {
      id: 'u04.lewis.5',
      q: [{ p: t('Pateiktos dvi reakcijos: vanduo su $HCl$ (protono pernešimas) ir vanduo su $BF3$ (ryšio sudarymas be protono).', 'Two reactions are given: water with $HCl$ (proton transfer) and water with $BF3$ (bond formation without a proton).') },
        SC([M('O'), PLUS, M('Cl'), EQ, M('[OH3+]'), PLUS, M('[Cl-]')]), SC([M('O'), PLUS, M('FB(F)F'), EQ, M('[OH2+][B-](F)(F)F')])],
      steps: [
        {
          prompt: t('Sujunkite kiekvieną dalelę su jos apibūdinimu.', 'Match each species with its description.'), kind: 'match',
          answer: {
            left: [tx('Vanduo reakcijoje su $HCl$ (priima protoną)', 'Water in the reaction with $HCl$ (takes the proton)'), tx('$HCl$ reakcijoje su vandeniu', '$HCl$ in the reaction with water'), tx('Vanduo reakcijoje su $BF3$ (atiduoda elektronų porą)', 'Water in the reaction with $BF3$ (donates an electron pair)'), tx('$BF3$ reakcijoje su vandeniu', '$BF3$ in the reaction with water')],
            right: [tx('Brionstedo bazė', 'Brønsted base'), tx('Brionstedo rūgštis', 'Brønsted acid'), tx('Luiso bazė', 'Lewis base'), tx('Luiso rūgštis', 'Lewis acid')], pairs: [0, 1, 2, 3]
          },
          hint: t('Protono pernešimas aprašomas Brionstedo, elektronų poros priėmimas be protono – Luiso teorija.', 'Proton transfer is described by the Brønsted theory, acceptance of an electron pair without a proton by the Lewis theory.'),
          solution: t('$HCl$ atiduoda protoną (Brionstedo rūgštis), vanduo jį priima (Brionstedo bazė). $BF3$ priima elektronų porą (Luiso rūgštis), o vanduo ją atiduoda (Luiso bazė).', '$HCl$ gives up a proton (a Brønsted acid) and water takes it (a Brønsted base). $BF3$ accepts an electron pair (a Lewis acid) and water donates it (a Lewis base).')
        }
      ],
      why: t('Vanduo yra ir Brionstedo, ir Luiso bazė, nes visos Brionstedo bazės yra elektronų porų donorai. Tačiau $BF3$ yra tik Luiso rūgštis: jis neturi protono.', 'Water is both a Brønsted and a Lewis base because every Brønsted base is an electron-pair donor. $BF3$, however, is only a Lewis acid: it has no proton.'),
      src: 'L4 p35'
    },
    {
      id: 'u04.lewis.6',
      q: [{ p: t('Lyginamos Brionstedo ir Luiso teorijos.', 'The Brønsted and Lewis theories are compared.') }],
      steps: [
        cho(t('Kuris teiginys teisingas?', 'Which statement is correct?'), [
          tx('Kiekviena Brionstedo bazė yra Luiso bazė.', 'Every Brønsted base is a Lewis base.'), tx('Kiekviena Luiso rūgštis yra Brionstedo rūgštis.', 'Every Lewis acid is a Brønsted acid.'),
          tx('$BF3$ yra Brionstedo rūgštis, nes yra elektrofilas.', '$BF3$ is a Brønsted acid because it is an electrophile.'), tx('Luiso bazės yra elektrofilai.', 'Lewis bases are electrophiles.')], 0,
          t('Prisiminkite: Brionstedo bazė jungia protoną savo elektronų pora.', 'Recall: a Brønsted base binds the proton with its own electron pair.'),
          t('Protoną jungia bazės elektronų pora, todėl ji yra Luiso bazė. Priešingai: $BF3$ ir $AlCl3$ yra Luiso rūgštys be protono, o Luiso bazės yra nukleofilai.', 'The proton is bound by an electron pair of the base, so it is a Lewis base. The reverse is false: $BF3$ and $AlCl3$ are Lewis acids without a proton, and Lewis bases are nucleophiles.'))
      ],
      why: t('Luiso teorija platesnė už Brionstedo: Brionstedo rūgštis – protonų donoras, Luiso – elektronų poros akceptorius. Todėl Luiso rūgščių sąrašas ilgesnis, o bazės abiejose teorijose tos pačios.', 'The Lewis theory is broader than the Brønsted theory: a Brønsted acid is a proton donor, a Lewis acid an electron-pair acceptor. So the list of Lewis acids is longer, while the bases are the same in both theories.'),
      src: 'L4 p34, T p37'
    },
    {
      id: 'u04.lewis.7',
      q: [{ p: t('Susiekite sąvokas.', 'Link the concepts.') }],
      steps: [
        {
          prompt: t('Sujunkite kiekvieną apibūdinimą su atitinkančia dalele.', 'Match each description with the matching kind of species.'), kind: 'match',
          answer: {
            left: [tx('elektronų poros donoras', 'electron-pair donor'), tx('elektronų poros akceptorius', 'electron-pair acceptor'), tx('protonų akceptorius', 'proton acceptor'), tx('protonų donoras', 'proton donor')],
            right: [tx('Luiso bazė (nukleofilas)', 'Lewis base (nucleophile)'), tx('Luiso rūgštis (elektrofilas)', 'Lewis acid (electrophile)'), tx('Brionstedo bazė', 'Brønsted base'), tx('Brionstedo rūgštis', 'Brønsted acid')], pairs: [0, 1, 2, 3]
          },
          hint: t('Luiso teorija kalba apie elektronų poras, Brionstedo – apie protonus.', 'The Lewis theory speaks of electron pairs, the Brønsted theory of protons.'),
          solution: t('Donoras – Luiso bazė ir nukleofilas, akceptorius – Luiso rūgštis ir elektrofilas; protonų akceptorius – Brionstedo bazė, donoras – Brionstedo rūgštis.', 'A donor is a Lewis base and a nucleophile, an acceptor a Lewis acid and an electrophile; a proton acceptor is a Brønsted base, a proton donor a Brønsted acid.')
        }
      ],
      why: t('Elektronų poros donoras ir akceptorius – Luiso terminai, protonų donoras ir akceptorius – Brionstedo. Luiso rūgštys yra elektrofilai, bazės – nukleofilai.', 'Donor and acceptor of an electron pair are Lewis terms, donor and acceptor of protons are Brønsted terms. Lewis acids are electrophiles, bases are nucleophiles.'),
      src: 'L4 p2, p34'
    },
    {
      id: 'u04.lewis.8',
      q: [{ p: t('Amoniakas reaguoja su boro trifluoridu.', 'Ammonia reacts with boron trifluoride.') }, SC([M('N'), PLUS, M('FB(F)F'), FW])],
      steps: [
        cho(t('Koks produktas susidaro?', 'What is the product?'), [mo('[NH3+][B-](F)(F)F'), mo('NB(F)F.F'), tx('Reakcija nevyksta, nes abi molekulės neutralios.', 'No reaction, because both molecules are neutral.')], 0,
          t('Azoto pora užpildo tuščią boro orbitalę; ar kas nors išeina?', 'The nitrogen pair fills the vacant orbital of boron; does anything leave?'),
          [{ p: t('Susidaro adduktas $H3N→BF3$ su $N–B$ ryšiu:', 'The adduct $H3N→BF3$ forms, with an $N–B$ bond:') }, mo('[NH3+][B-](F)(F)F')]),
        cho(t('Kuri medžiaga yra Luiso rūgštis ir kuri – Luiso bazė?', 'Which substance is the Lewis acid and which the Lewis base?'), [tx('$BF3$ – rūgštis, $NH3$ – bazė', '$BF3$ is the acid, $NH3$ the base'), tx('$NH3$ – rūgštis, $BF3$ – bazė', '$NH3$ is the acid, $BF3$ the base'), tx('Abi yra Luiso rūgštys', 'Both are Lewis acids')], 0,
          t('Kuris reagentas turi laisvąją porą, o kuris – tuščią orbitalę?', 'Which reagent has a lone pair and which has a vacant orbital?'), t('Amoniakas turi laisvąją porą (donoras = bazė), boras – tuščią orbitalę (akceptorius = rūgštis).', 'Ammonia has a lone pair (donor = base), boron a vacant orbital (acceptor = acid).'))
      ],
      why: t('Luiso rūgšties ir bazės reakcija – tai donoro ir akceptoriaus ryšio sudarymas. Dėl to $NH3$ elgiasi ir kaip Brionstedo, ir kaip Luiso bazė, bet $BF3$ yra tik Luiso rūgštis.', 'A Lewis acid-base reaction is the formation of a bond between a donor and an acceptor. So $NH3$ acts both as a Brønsted and as a Lewis base, but $BF3$ is only a Lewis acid.'),
      src: 'L4 p34-35, T p37', claims: [{ formula: ['[NH3+][B-](F)(F)F', 'BF3H3N'] }]
    }
  ];

  /* ---------- summary ---------- */
  const SUMMARY = [
    { h: t('Santrauka: rūgštys ir bazės', 'Summary: acids and bases') },
    {
      table: {
        head: [t('Tema', 'Topic'), t('Svarbiausia taisyklė', 'Key rule')],
        rows: [
          [t('Brionstedo teorija', 'Brønsted theory'), t('Rūgštis – protonų donoras, bazė – akceptorius. Konjuguotoji pora skiriasi vienu $H+$; stipresnė rūgštis ↔ silpnesnė konjuguotoji bazė.', 'An acid is a proton donor, a base an acceptor. A conjugate pair differs by one $H+$; a stronger acid goes with a weaker conjugate base.')],
          [t('pKa', 'pKa'), t('$pKa = −lg Ka$; mažesnė pKa – stipresnė rūgštis. Ribos: < 1, 1–5, 5–15, > 15. pH ≠ pKa.', '$pKa = −lg Ka$; a smaller pKa means a stronger acid. Limits: < 1, 1–5, 5–15, > 15. pH ≠ pKa.')],
          [t('Anijono stabilumas', 'Stability of the anion'), t('Lemia delokalizacija (rezonansas), atomas (O > N > C; S > O dėl poliarizuojamumo), hibridizacija (sp > sp2 > sp3), pakaitas (−I stiprina, +I silpnina; poveikis mažėja su atstumu), tirpiklis.', 'Decided by delocalisation (resonance), the atom (O > N > C; S > O by polarisability), hybridisation (sp > sp2 > sp3), the substituent (−I strengthens, +I weakens; the effect fades with distance) and the solvent.')],
          [t('Rūgščių eilė', 'Order of acids'), t('C–H < N–H < O–H < S–H; $RCOOH$ (3–5) > fenolis (9,9) > alkoholis (≈16); $HCOOH$ > $CH3COOH$ > $(CH3)3CCOOH$; $FCH2COOH$ stipriausia iš halogenacto rūgščių.', 'C–H < N–H < O–H < S–H; $RCOOH$ (3–5) > phenol (9.9) > alcohol (≈16); $HCOOH$ > $CH3COOH$ > $(CH3)3CCOOH$; $FCH2COOH$ is the strongest of the haloacetic acids.')],
          [t('Bazės', 'Bases'), t('Reikia $π$ elektronų arba laisvosios poros. $:N$ > $:O$ > $:S$; $π$ bazės labai silpnos. Matas – konjuguotosios rūgšties pKa (didesnė – stipresnė bazė). Anijonas > neutrali molekulė.', 'A base needs $π$ electrons or a lone pair. $:N$ > $:O$ > $:S$; $π$ bases are very weak. The measure is the pKa of the conjugate acid (larger means a stronger base). An anion is stronger than the neutral molecule.')],
          [t('Aminai ir anilinai', 'Amines and anilines'), t('Donorai didina, akceptoriai mažina bazingumą: $CH3NH2$ (10,62) > $NH3$ (9,26) > anilinas (4,6) > difenilaminas (0,9) > trifenilaminas (< 0); 4-nitro < H < alkilas < alkoksi.', 'Donors raise and acceptors lower basicity: $CH3NH2$ (10.62) > $NH3$ (9.26) > aniline (4.6) > diphenylamine (0.9) > triphenylamine (< 0); 4-nitro < H < alkyl < alkoxy.')],
          [t('Amfoteriniai junginiai', 'Amphoteric compounds'), t('Turi ir rūgštinį, ir baziną centrą (vanduo, alkoholiai, karboksirūgštys, aminorūgštys). Vaidmenį lemia partneris.', 'They have both an acidic and a basic centre (water, alcohols, carboxylic acids, amino acids). The partner decides the role.')],
          [t('Pusiausvyros kryptis', 'Direction of the equilibrium'), t('Į silpnesnės rūgšties ir silpnesnės bazės pusę. Bazė deprotonizuoja rūgštį, jei jos konjuguotosios rūgšties pKa didesnė už rūgšties pKa.', 'Toward the weaker acid and the weaker base. A base deprotonates an acid if the pKa of its conjugate acid is larger than the pKa of the acid.')],
          [t('Luiso teorija', 'Lewis theory'), t('Rūgštis – elektronų poros akceptorius (elektrofilas: $BF3$, $AlCl3$, $FeBr3$, $ZnCl2$, $H+$), bazė – donoras (nukleofilas); Luiso bazės = Brionstedo bazės.', 'An acid is an electron-pair acceptor (an electrophile: $BF3$, $AlCl3$, $FeBr3$, $ZnCl2$, $H+$), a base a donor (a nucleophile); Lewis bases = Brønsted bases.')]
        ]
      }
    },
    {
      list: [
        t('Svarbiausios pKa: $H2SO4$ −9; $HCl$ −7; $H3O+$ −1,74; $CH3COOH$ 4,75; fenolis 9,9; $H2O$ 15,7; etanolis 16; acetonas 19,3; etinas 25; $NH3$ 38; etenas 44; etanas 50.', 'Key pKa values: $H2SO4$ −9; $HCl$ −7; $H3O+$ −1.74; $CH3COOH$ 4.75; phenol 9.9; $H2O$ 15.7; ethanol 16; acetone 19.3; ethyne 25; $NH3$ 38; ethene 44; ethane 50.'),
        t('Lenktoji rodyklė prasideda nuo elektronų (laisvosios poros ar ryšio): bazės pora → $H$, $H–A$ ryšys → $A$.', 'A curved arrow starts at electrons (a lone pair or a bond): the base pair → $H$, the $H–A$ bond → $A$.')
      ],
      src: 'L4'
    }
  ];

  const TYPES = [
    {
      id: 'u04.conj', title: t('Konjuguotosios rūgštys ir bazės', 'Conjugate acids and bases'), mirrors: ['S2.18', 'S2.19'], gen: genConj
    },
    { id: 'u04.role', title: t('Rūgštis, bazė ir lenktosios rodyklės', 'Acid, base and curved arrows'), mirrors: ['S2.17'], bank: ROLE },
    { id: 'u04.amph', title: t('Amfoteriniai junginiai: alkoholiai, vanduo, aminorūgštys', 'Amphoteric compounds: alcohols, water, amino acids'), mirrors: ['S2.16'], bank: AMPH },
    { id: 'u04.pka', title: t('pKa skaičiavimas ir rūgščių stiprumo grupės', 'Calculating pKa and strength classes'), mirrors: [], gen: genPka },
    { id: 'u04.order', title: t('Rūgštingumo eilė', 'Order of acidity'), mirrors: ['S2.20'], gen: genOrder },
    { id: 'u04.rank', title: t('Rūgštingumo palyginimas ir priežastis', 'Ranking acidity, with the reason'), mirrors: ['S2.20'], bank: RANK },
    { id: 'u04.proton', title: t('Kuris protonas rūgštingesnis?', 'Which proton is more acidic?'), mirrors: ['S2.20'], bank: PROTON },
    { id: 'u04.basic', title: t('Aminų ir anilinų bazingumas', 'Basicity of amines and anilines'), mirrors: ['S2.21'], gen: genBasic },
    { id: 'u04.basecentre', title: t('Bazinis centras ir bazių stiprumas', 'The basic centre and the strength of bases'), mirrors: [], bank: BASEC },
    { id: 'u04.dir', title: t('Pusiausvyros kryptis pagal pKa', 'Direction of equilibrium from pKa'), mirrors: ['S2.22'], gen: genDir },
    { id: 'u04.deprot', title: t('Kuri bazė deprotonizuos rūgštį?', 'Which base deprotonates the acid?'), mirrors: ['S2.23'], gen: genDeprot },
    { id: 'u04.lewis', title: t('Luiso rūgštys ir bazės', 'Lewis acids and bases'), mirrors: [], bank: LEWIS }
  ];

  ORG.unit({
    id: 'u04',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S2.16': ['u04.amph'],
      'S2.17': ['u04.role'],
      'S2.18': ['u04.conj'],
      'S2.19': ['u04.conj'],
      'S2.20': ['u04.order', 'u04.rank', 'u04.proton'],
      'S2.21': ['u04.basic'],
      'S2.22': ['u04.dir'],
      'S2.23': ['u04.deprot']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
