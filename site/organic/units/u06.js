// site/organic/units/u06.js: unit 6, alkanes and free-radical substitution (SR)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // labels that are only formulas or symbols
  const fm = (s) => ({ lt: '$' + s + '$', en: '$' + s + '$' });   // the same as a formula in running text (subscripts)

  /* ---------- helpers shared by the generators ---------- */

  // Atom token spans of a SMILES string, in atom order (a..b the atom, r the end including ring-closure digits).
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
  // the halide: X put on atom idx as a branch (atom numbers of the alkane stay valid)
  function withX(smi, idx, X) {
    const sp = spans(smi);
    return smi.slice(0, sp[idx].b) + '(' + X + ')' + smi.slice(sp[idx].b);
  }
  // the alkyl radical: atom idx loses one hydrogen (atom numbers stay valid; only plain C atoms are used)
  function radicalOf(chem, smi, idx) {
    const m = chem.parse(smi);
    const sp = spans(smi);
    return smi.slice(0, sp[idx].a) + '[C' + hTok(m.atoms[idx].h - 1) + ']' + smi.slice(sp[idx].b);
  }
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const nameOf = (ctx, smi, lang) => { const r = ctx.name.name(smi, { lang }); return r && r.name ? r.name : null; };

  // Sets of equivalent C-H sites of an alkane (topological symmetry: refine atom colours by their neighbours).
  // Result: the classes in order of their first atom: {sites, nH, rep, rad, prod}, rad = radical rank
  // (5 benzylic, 3 tertiary, 2 secondary, 1 primary, 0 methyl), prod = the monohalide for X (set later).
  function siteClasses(chem, smi) {
    const m = chem.parse(smi);
    const n = m.atoms.length;
    const ordOf = {};
    m.bonds.forEach(b => { ordOf[b.a + '-' + b.b] = b.order; ordOf[b.b + '-' + b.a] = b.order; });
    let col = m.atoms.map(a => a.el + (a.aromatic ? 'a' : '') + a.h);
    let k = new Set(col).size;
    for (let it = 0; it < n; it++) {
      const keys = col.map((c, i) => c + '|' + m.nbr[i].map(j => ordOf[i + '-' + j] + col[j]).sort().join(','));
      const uniq = Array.from(new Set(keys)).sort();
      col = keys.map(s => 'k' + uniq.indexOf(s));
      if (uniq.length === k) break;
      k = uniq.length;
    }
    const classes = [];
    const at = {};
    for (let i = 0; i < n; i++) {
      const a = m.atoms[i];
      if (a.el !== 'C' || a.aromatic || a.h === 0) continue;
      if (m.nbr[i].some(j => ordOf[i + '-' + j] !== 1)) continue;
      if (at[col[i]] === undefined) {
        const cn = m.nbr[i].filter(j => m.atoms[j].el === 'C');
        const rad = m.nbr[i].some(j => m.atoms[j].aromatic) ? 5 : cn.length;
        at[col[i]] = classes.length;
        classes.push({ sites: [], nH: 0, rep: i, rad });
      }
      const c = classes[at[col[i]]];
      c.sites.push(i);
      c.nH += a.h;
    }
    return classes;
  }

  // Everything a generator needs about the radical halogenation of one alkane, checked against the engine, or null.
  function analyse(ctx, smi, X) {
    const { chem, react } = ctx;
    const cl = siteClasses(chem, smi);
    if (!cl.length) return null;
    const res = react.run('sr.halogenate', [smi], { X });
    if (res.products.length !== cl.length) return null;
    const eng = {};
    res.products.forEach(p => { eng[canon(ctx, p.smi)] = p; });
    const best = Math.max.apply(null, cl.map(c => c.rad));
    for (const c of cl) {
      c.prod = withX(smi, c.rep, X);
      const p = eng[canon(ctx, c.prod)];
      if (!p) return null;                                  // the hand-built halide must be one of the engine's products
      c.major = X === 'Cl' ? true : c.rad === best;
      if (c.major !== p.major) return null;                 // and the engine must agree which ones are the main products
    }
    return { classes: cl, best, X };
  }
  // the carbon-class word of a radical rank
  const RAD = {
    5: t('benziltipo (arba aliltipo) radikalas', 'benzylic (or allylic) radical'),
    3: t('tretinis radikalas', 'tertiary radical'),
    2: t('antrinis radikalas', 'secondary radical'),
    1: t('pirminis radikalas', 'primary radical'),
    0: t('metilradikalas', 'methyl radical')
  };
  const RADC = {   // accusative, after "stabiliausią (...) radikalą"
    5: t('benziltipo', 'benzylic'), 3: t('tretinį', 'tertiary'), 2: t('antrinį', 'secondary'), 1: t('pirminį', 'primary'), 0: t('metil-', 'methyl')
  };
  const RADH = {   // for "... vandeniliai"
    5: t('benziltipo', 'benzylic'), 3: t('tretiniai', 'tertiary'), 2: t('antriniai', 'secondary'), 1: t('pirminiai', 'primary'), 0: t('metilo', 'methyl')
  };

  // the alkanes (and alkylbenzenes for the benzylic case) the generators draw from
  const POOL = [
    'CCCC', 'CC(C)C',
    'CCCCC', 'CC(C)CC', 'CC(C)(C)C',
    'CCCCCC', 'CC(C)CCC', 'CCC(C)CC', 'CC(C)(C)CC', 'CC(C)C(C)C',
    'CCCCCCC', 'CC(C)CCCC', 'CCC(C)CCC', 'CC(C)C(C)CC', 'CC(C)CC(C)C', 'CCC(CC)CC', 'CC(C)(C)CCC', 'CC(C)(C)C(C)C', 'CCC(C)(C)CC',
    'CC(C)CC(C)(C)C', 'CC(C)C(C)C(C)C', 'CC(C)CCC(C)C', 'CC(C)(C)C(C)(C)C',
    'CCCCCCCC', 'CC(C)CCCCC', 'CCC(C)(C)CCC', 'CC(C)(C)CC(C)(C)C', 'CC(C)CCC(C)(C)C',
    'C1CCCC1', 'C1CCCCC1', 'C1CCCCCC1', 'C1CCCCCCC1',
    'CC1CCCC1', 'CC1CCCCC1', 'CCC1CCCC1', 'CCC1CCCCC1', 'CC(C)C1CCCCC1', 'CC1CCC(C)CC1', 'CC1CCCC(C)C1', 'CC1(C)CCCCC1',
    'CC1CCC(C)(C)CC1', 'CC(C)C1CCCC1', 'CC1CCCC1C', 'CC1CCCCCC1', 'CCC1CCCCCC1',
    'CCc1ccccc1', 'CC(C)c1ccccc1', 'CCCc1ccccc1', 'CCC(C)c1ccccc1'
  ];
  // radicals for the ordering type: one exemplar group per class
  const RADS = {
    benzyl: ['[CH2]c1ccccc1', 'C[CH]c1ccccc1', 'C[C](C)c1ccccc1'],
    allyl: ['C=C[CH2]', 'C=C[CH]C', 'C=C[CH]CC'],
    tert: ['C[C](C)C', 'CC[C](C)C', 'C[C]1CCCC1', 'C[C]1CCCCC1'],
    sec: ['C[CH]C', 'CC[CH]C', '[CH]1CCCCC1', 'CC[CH]CC'],
    prim: ['C[CH2]', 'CC[CH2]', 'CCC[CH2]', 'CC(C)[CH2]'],
    methyl: ['[CH3]']
  };

  const hv = (X) => ({ arrow: '→', above: f(X + '2, hν') });
  const sitesText = (c) => c.sites.map(i => i + 1).join(', ');
  const formulaOf = (ctx, s) => ctx.chem.formulaString(ctx.chem.parse(s));
  // isomeric hydrocarbons of the pool (same molecular formula, other skeleton)
  function partners(ctx, smi) {
    const F = formulaOf(ctx, smi);
    return POOL.filter(s => s !== smi && formulaOf(ctx, s) === F);
  }
  // per-engine caches for genSingle: the same substrate is analysed again and again across seeds
  const SINGLE_CACHE = new WeakMap();
  function cacheFor(ctx) {
    let c = SINGLE_CACHE.get(ctx.chem);
    if (!c) { c = { analyse: new Map(), partners: new Map() }; SINGLE_CACHE.set(ctx.chem, c); }
    return c;
  }
  function analyseCached(ctx, smi, X) {
    const m = cacheFor(ctx).analyse, k = X + '|' + smi;
    if (!m.has(k)) m.set(k, analyse(ctx, smi, X));
    return m.get(k);
  }
  function partnersCached(ctx, smi) {
    const m = cacheFor(ctx).partners;
    if (!m.has(smi)) m.set(smi, partners(ctx, smi));
    return m.get(smi);
  }
  function pickAnalysed(ctx, X, ok) {
    for (let k = 0; k < 150; k++) {
      const smi = ctx.pick(POOL);
      const a = analyse(ctx, smi, X);
      if (a && ok(a, smi)) return { smi, a };
    }
    return null;
  }
  const sp = (smi, opts) => (opts ? { smi, opts } : (/^(CC?|C(Cl|Br)|C\[CH2\])$/.test(smi) ? { smi, opts: { condensed: true } } : { smi }));
  // is the chirality of the products well defined? (substrate without stereoisomers; no product with an achiral stereoisomer)
  function chiralityClear(ctx, smi, a) {
    const { stereo } = ctx;
    if (stereo.stereoisomers(smi).length > 1) return false;
    return !a.classes.some(c => stereo.isChiral(c.prod) && stereo.stereoisomers(c.prod).some(s => !stereo.isChiral(s)));
  }
  const RATES = { Cl: { 1: 1, 2: 4, 3: 5 }, Br: { 1: 1, 2: 80, 3: 1600 } };
  const rateNote = (X) => {
    const r = RATES[X];
    return t('santykinis vieno vandenilio atomo reaktingumas: pirminis ' + r[1] + ', antrinis ' + r[2] + ', tretinis ' + r[3] + ', supaprastintas modelis',
      'relative reactivity of one hydrogen: primary ' + r[1] + ', secondary ' + r[2] + ', tertiary ' + r[3] + ', a simplified model');
  };

  /* ---------- generator: classify an elementary step of the chain ---------- */
  // RH alkane, R its radical, r the radical atom, RX the halide, RR the dimer, h the atom whose hydrogen is drawn
  const CHAINS = [
    { RH: 'C', R: '[CH3]', r: 0, RX: (X) => 'C' + X, RR: 'CC', h: 0, draw: true },
    { RH: 'CC', R: 'C[CH2]', r: 1, RX: (X) => 'CC' + X, RR: 'CCCC', h: 1, draw: true },
    { RH: 'CCC', R: 'C[CH]C', r: 1, RX: (X) => 'CC(C)' + X, RR: 'CC(C)C(C)C', draw: false },
    { RH: 'CC(C)C', R: 'C[C](C)C', r: 1, RX: (X) => 'CC(C)(C)' + X, RR: 'CC(C)(C)C(C)(C)C', draw: false },
    { RH: 'CCCC', R: 'CC[CH]C', r: 2, RX: (X) => 'CCC(C)' + X, RR: 'CCC(C)C(C)CC', draw: false },
    { RH: 'C1CCCCC1', R: '[CH]1CCCCC1', r: 0, RX: (X) => X + 'C1CCCCC1', RR: 'C1CCC(CC1)C1CCCCC1', draw: false },
    { RH: 'CC1CCCC1', R: 'C[C]1CCCC1', r: 1, RX: (X) => 'CC1(' + X + ')CCCC1', RR: 'CC1(CCCC1)C1(C)CCCC1', draw: false }
  ];
  const STEPKIND = ['init', 'term1', 'prop1', 'prop2', 'term2', 'term3', 'prop1', 'prop2', 'term2', 'term3'];

  function genStep(rng, ctx) {
    const { chem } = ctx;
    const X = ctx.pick(['Cl', 'Br']);
    const ch = ctx.pick(CHAINS);
    const kind = ctx.pick(STEPKIND);
    const XX = X + X, Xr = '[' + X + ']', HX = X, RX = ch.RX(X);
    const nR = chem.parse(ch.R).atoms.length;
    let items, mech = null, phase;
    if (kind === 'init') {
      items = [sp(XX), { arrow: '→', above: f('hν') }, sp(Xr), { plus: true }, sp(Xr)];
      phase = 0;
      mech = [{
        scheme: { items }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }],
        note: t('Šviesa suskaido $' + X + '-' + X + '$ ryšį: kiekvienas atomas pasiima po vieną elektroną.', 'Light splits the $' + X + '-' + X + '$ bond: each atom takes one electron.')
      }];
    } else if (kind === 'term1') {
      items = [sp(Xr + '.' + Xr), { arrow: '→' }, sp(XX)];
      phase = 2;
      mech = [{
        scheme: { items }, arrows: [{ from: { m: 0, a: 0 }, to: { m: 0, mid: [0, 1] }, half: true }, { from: { m: 0, a: 1 }, to: { m: 0, mid: [0, 1] }, half: true }],
        note: t('Du radikalai sudaro $' + X + '-' + X + '$ ryšį.', 'Two radicals form the $' + X + '-' + X + '$ bond.')
      }];
    } else if (kind === 'prop1') {
      items = [sp(Xr), { plus: true }, sp(ch.RH), { arrow: '→' }, sp(HX), { plus: true }, sp(ch.R)];
      phase = 1;
      if (ch.draw) {
        const its = items.slice(); its[2] = sp(ch.RH, { allH: true });
        const hb = { m: 1, b: [ch.h, 'H' + ch.h] };
        mech = [{
          scheme: { items: its }, arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 'H' + ch.h }, half: true }, { from: hb, to: { m: 1, a: 'H' + ch.h }, half: true }, { from: hb, to: { m: 1, a: ch.h }, half: true }],
          note: t('Halogeno radikalo elektronas ir vienas $C-H$ elektronas sudaro $H-' + X + '$ ryšį, o antras $C-H$ elektronas lieka anglies atomui.', 'The electron of the halogen radical and one $C-H$ electron form the $H-' + X + '$ bond, and the other $C-H$ electron stays on carbon.')
        }];
      }
    } else if (kind === 'prop2') {
      items = [sp(ch.R), { plus: true }, sp(XX), { arrow: '→' }, sp(RX), { plus: true }, sp(Xr)];
      phase = 1;
      mech = [{
        scheme: { items }, arrows: [{ from: { m: 0, a: ch.r }, to: { m: 1, a: 0 }, half: true }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 }, half: true }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 }, half: true }],
        note: t('Radikalo elektronas ir vienas $' + X + '-' + X + '$ elektronas sudaro naują $C-' + X + '$ ryšį, o kitas $' + X + '-' + X + '$ elektronas lieka išeinančiam halogeno atomui.', 'The radical electron and one $' + X + '-' + X + '$ electron form the new $C-' + X + '$ bond, and the other $' + X + '-' + X + '$ electron stays on the leaving halogen atom.')
      }];
    } else if (kind === 'term2') {
      items = [sp(ch.R + '.' + Xr), { arrow: '→' }, sp(RX)];
      phase = 2;
      mech = [{
        scheme: { items }, arrows: [{ from: { m: 0, a: ch.r }, to: { m: 0, mid: [ch.r, nR] }, half: true }, { from: { m: 0, a: nR }, to: { m: 0, mid: [ch.r, nR] }, half: true }],
        note: t('Alkilradikalas ir halogeno radikalas sudaro $C-' + X + '$ ryšį.', 'An alkyl radical and a halogen radical form a $C-' + X + '$ bond.')
      }];
    } else {
      items = [sp(ch.R + '.' + ch.R), { arrow: '→' }, sp(ch.RR)];
      phase = 2;
      mech = [{
        scheme: { items }, arrows: [{ from: { m: 0, a: ch.r }, to: { m: 0, mid: [ch.r, nR + ch.r] }, half: true }, { from: { m: 0, a: nR + ch.r }, to: { m: 0, mid: [ch.r, nR + ch.r] }, half: true }],
        note: t('Du alkilradikalai sudaro $C-C$ ryšį.', 'Two alkyl radicals form a $C-C$ bond.')
      }];
    }
    // a condensed drawing hides atoms the arrows point at: draw the molecules of a mechanism in full
    if (mech) mech[0].scheme.items = mech[0].scheme.items.map(it => {
      if (!it.opts || !it.opts.condensed) return it;
      const o = Object.assign({}, it.opts); delete o.condensed;
      return Object.assign({}, it, { opts: o });
    });
    const PH = [t('iniciacija (grandinės pradžia)', 'initiation (start of the chain)'), t('grandinės augimas', 'propagation (chain growth)'), t('grandinės nutrūkimas', 'termination (end of the chain)')];
    const solutionStep1 = [{
      p: t('Suskaičiuokite radikalus abiejose rodyklės pusėse: iniciacijoje jų atsiranda, augimo reakcijoje jų skaičius nesikeičia (vienas sunaudojamas, kitas susidaro), nutrūkimo reakcijoje radikalų nelieka.',
        'Count the radicals on both sides of the arrow: in initiation they appear, in a propagation step their number stays the same (one is used up, another forms), in termination none is left.')
    }].concat(mech ? [{ mech }] : []);
    const steps = [{
      prompt: t('Kuriai grandininės reakcijos stadijai priklauso ši elementarioji reakcija?', 'Which stage of the chain reaction does this elementary step belong to?'),
      kind: 'choice', options: PH.map(x => ({ text: x })), answer: phase,
      hint: t('Palyginkite radikalų skaičių prieš rodyklę ir už jos.', 'Compare the number of radicals before and after the arrow.'),
      solution: solutionStep1
    }];
    if (phase < 2) {
      const nextRH = [sp(Xr), { plus: true }, sp(ch.RH), { arrow: '→' }, sp(HX), { plus: true }, sp(ch.R)];
      const nextRX = [sp(ch.R), { plus: true }, sp(XX), { arrow: '→' }, sp(RX), { plus: true }, sp(Xr)];
      const wrong = [
        [sp(ch.R), { plus: true }, sp(HX), { arrow: '→' }, sp(ch.RH), { plus: true }, sp(Xr)],
        [sp(ch.R), { plus: true }, sp(ch.R), { arrow: '→' }, sp(ch.RR)],
        [sp(Xr), { plus: true }, sp(ch.RH), { plus: true }, sp(XX), { arrow: '→' }, sp(RX), { plus: true }, sp(HX)]
      ];
      steps.push({
        prompt: t('Kuri elementarioji reakcija vyks po šios, tęsiant grandinę?', 'Which elementary step follows this one when the chain goes on?'),
        kind: 'choice', options: [kind === 'prop1' ? nextRX : nextRH].concat(wrong).map(its => ({ scheme: { items: its } })), answer: 0,
        hint: t('Augimo reakcijos eina viena po kitos: ką tik atsiradęs radikalas reaguoja su kita molekule ir sukuria naują radikalą.', 'Propagation steps follow one another: the radical that has just appeared reacts with another molecule and makes a new radical.'),
        solution: t('Augimo reakcijos sudaro ciklą. ' + (kind === 'prop1' ? 'Alkilradikalas atplėšia halogeno atomą nuo $' + X + '2$ ir atsinaujina $' + X + '•$.' : 'Halogeno radikalas atplėšia vandenilį nuo alkano ir susidaro alkilradikalas.') + ' Atvirkštinė reakcija, radikalų susijungimas ar bendroji lygtis (ji nėra elementarioji reakcija) čia netinka.',
          'The propagation steps form a cycle. ' + (kind === 'prop1' ? 'The alkyl radical takes a halogen atom from $' + X + '2$ and $' + X + '•$ is regenerated.' : 'The halogen radical removes a hydrogen from the alkane and an alkyl radical forms.') + ' The reverse step, a combination of radicals or the overall equation (not an elementary step) does not fit.')
      });
    } else {
      steps.push({
        prompt: t('Kodėl po šios reakcijos grandinė nutrūksta?', 'Why does the chain stop after this step?'),
        kind: 'choice',
        options: [
          { text: t('Radikalai sunaudojami: neliko dalelės, kuri galėtų atplėšti vandenilį.', 'The radicals are used up: no species is left that could remove a hydrogen.') },
          { text: t('Išseko šviesa, todėl iniciacija nebevyksta.', 'The light has run out, so initiation no longer takes place.') },
          { text: t('Susidarė produktas, kuris nereaguoja su halogenu.', 'A product formed that does not react with the halogen.') },
          { text: t('Radikalų skaičius padidėjo ir reakcija sustojo.', 'The number of radicals grew and the reaction stopped.') }
        ],
        answer: 0,
        hint: t('Pagalvokite, kokių dalelių reikia kitai augimo reakcijai.', 'Think about which species the next propagation step needs.'),
        solution: t('Du radikalai susijungė į molekulę, o be radikalų augimo reakcijos negali vykti. Šviesa tik pradeda grandinę.', 'Two radicals combined into a molecule, and without radicals the propagation steps cannot run. Light only starts the chain.')
      });
    }
    return {
      q: [{ p: t('Pateikta viena alkano halogeninimo grandininės reakcijos elementarioji reakcija.', 'One elementary step of the chain halogenation of an alkane is given.') }, { scheme: { items } }],
      steps,
      why: t('Grandininę reakciją sudaro trys stadijos. Radikalų skaičius parodo, kuri iš jų vyksta: iniciacijoje jų daugėja, augime jų skaičius nesikeičia (radikalas „perduodamas“), o nutrūkime jų mažėja.',
        'A chain reaction has three stages. The number of radicals shows which one is running: it grows in initiation, stays the same in propagation (the radical is passed on) and falls in termination.'),
      src: 'L6 p7'
    };
  }

  /* ---------- generator: how many monochloro isomers; equivalent hydrogens; how many are chiral ---------- */
  function genCount(rng, ctx) {
    const { stereo } = ctx;
    const pk = pickAnalysed(ctx, 'Cl', () => true);
    if (!pk) throw new Error('u06.count: no usable hydrocarbon');
    const { smi, a } = pk;
    const cl = a.classes;
    const n = cl.length;
    const big = cl.slice().sort((x, y) => y.sites.length - x.sites.length)[0];
    const chiral = cl.filter(c => stereo.isChiral(c.prod));
    const steps = [{
      prompt: t('Kiek skirtingų (konstitucijos izomerų) monochlorintų produktų gali susidaryti?', 'How many constitutionally different monochloro products can form?'),
      kind: 'number', answer: { value: n, tol: 0 }, mol: { smi },
      hint: t('Sugrupuokite vandenilius pagal simetriją: kiekviena ekvivalentinių vandenilių grupė duoda vieną produktą.', 'Group the hydrogens by symmetry: each group of equivalent hydrogens gives one product.'),
      solution: [{ p: n === 1 ? t('Yra viena ekvivalentinių vandenilių grupė, todėl susidaro vienas izomeras:', 'There is one group of equivalent hydrogens, so one isomer forms:')
        : t('Yra ' + n + ' ekvivalentinių vandenilių grupės, todėl susidaro ' + n + ' izomerai:', 'There are ' + n + ' groups of equivalent hydrogens, so ' + n + ' isomers form:') },
        { mol: cl.map(c => ({ smi: c.prod })) }]
    }];
    if (big.sites.length >= 2) {
      steps.push({
        prompt: t('Bakstelėkite visus anglies atomus, kurių vandeniliai ekvivalentiški atomo Nr. ' + (big.rep + 1) + ' vandeniliams.', 'Tap every carbon whose hydrogens are equivalent to those of carbon no. ' + (big.rep + 1) + '.'),
        kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: big.sites,
        hint: t('Ekvivalentiški vandeniliai susikeičia vietomis, kai molekulė pasukama arba atspindima.', 'Equivalent hydrogens swap places when the molecule is rotated or reflected.'),
        solution: t('Atomai Nr. ' + sitesText(big) + ' yra simetriškai ekvivalentiški, todėl jų pakeitimas duoda tą patį produktą.', 'Carbons no. ' + sitesText(big) + ' are equivalent by symmetry, so replacing their hydrogens gives the same product.')
      });
    }
    if (chiralityClear(ctx, smi, a)) {
      steps.push({
        prompt: t('Kiek iš šių monochlorintų izomerų yra chiralinių?', 'How many of these monochloro isomers are chiral?'),
        kind: 'number', answer: { value: chiral.length, tol: 0 },
        hint: t('Patikrinkite kiekvieną produkto anglies atomą, ne tik tą, prie kurio prisijungė chloras: ar kuris nors turi keturis skirtingus pakaitus?', 'Check every carbon of each product, not only the one that took the chlorine: does any of them carry four different groups?'),
        solution: chiral.length
          ? [{ p: t('Chiralinį centrą turi šie produktai (jis gali būti ir ne prie chloro):', 'These products have a chiral centre (it need not be at the chlorine):') }, { mol: chiral.map(c => ({ smi: c.prod })) }]
          : t('Nė viename produkte nėra anglies atomo su keturiais skirtingais pakaitais.', 'No product has a carbon with four different substituents.')
      });
    }
    return {
      q: [{ p: t('Angliavandenilis monochlorinamas radikaliniu būdu.', 'A hydrocarbon undergoes radical monochlorination.') },
        { scheme: { items: [sp(smi), hv('Cl')] } }],
      steps,
      why: t('Produktų skaičių lemia ekvivalentinių vandenilių grupių skaičius: chloras beveik nesirenka, todėl kiekviena grupė duoda savo izomerą. Chiralinį centrą turi produktas, kuriame yra anglies atomas su keturiais skirtingais pakaitais.',
        'The number of products is set by the number of groups of equivalent hydrogens: chlorine hardly chooses, so every group gives its own isomer. A product is chiral when it has a carbon with four different groups.'),
      src: 'S4.1'
    };
  }

  /* ---------- generator: chlorination products: which radical, which is the largest, which are chiral ---------- */
  function genChlor(rng, ctx) {
    const { stereo } = ctx;
    const pk = pickAnalysed(ctx, 'Cl', (a) => a.classes.length >= 2 && a.classes.length <= 5 && new Set(a.classes.map(c => c.rad)).size >= 2);
    if (!pk) throw new Error('u06.chlor: no usable hydrocarbon');
    const { smi, a } = pk;
    const cl = a.classes;
    const types = Array.from(new Set(cl.map(c => c.rad))).sort((x, y) => y - x);
    const steps = [{
      prompt: t('Kiekvieną monochlorintą produktą priskirkite radikalui, iš kurio jis susidaro.', 'Match each monochloro product with the radical it comes from.'),
      kind: 'match',
      answer: { left: cl.map(c => ({ mol: { smi: c.prod } })), right: types.map(r => ({ text: RAD[r] })), pairs: cl.map(c => types.indexOf(c.rad)) },
      hint: t('Produkte raskite anglies atomą su chloru: kiek jis turi anglies kaimynų ir ar jis prijungtas prie benzeno žiedo?', 'In each product find the carbon bearing chlorine: how many carbon neighbours does it have, and is it attached to a benzene ring?'),
      solution: t('Chloras jungiasi ten, kur buvo radikalas. Radikalo tipą nusako anglies kaimynų skaičius: vienas – pirminis, du – antrinis, trys – tretinis. Jei šis atomas prijungtas prie benzeno žiedo, radikalas yra benziltipo.', 'Chlorine bonds where the radical was. The type of the radical is given by the number of carbon neighbours: one is primary, two secondary, three tertiary. If this carbon is attached to a benzene ring, the radical is benzylic.')
    }];
    if (cl.every(c => c.rad >= 1 && c.rad <= 3)) {
      const w = cl.map(c => c.nH * RATES.Cl[c.rad]);
      const mx = Math.max.apply(null, w);
      if (w.filter(x => x === mx).length === 1) {
        const k = w.indexOf(mx);
        steps.push({
          prompt: t('Kurio monochlorido susidaro daugiausia (' + rateNote('Cl').lt + ')?', 'Which monochloride forms in the largest amount (' + rateNote('Cl').en + ')?'),
          kind: 'choice', options: cl.map(c => ({ mol: { smi: c.prod } })), answer: k,
          hint: t('Produkto kiekis proporcingas vandenilių skaičiui, padaugintam iš vieno vandenilio reaktingumo.', 'The amount of a product is proportional to the number of hydrogens times the reactivity of one hydrogen.'),
          solution: [{ p: t('Skaičiuojame vandenilių skaičių × reaktingumas kiekvienai grupei:', 'For each group we compute number of hydrogens × reactivity:') },
            { list: cl.map((c, i) => t(RADH[c.rad].lt + ' vandeniliai: ' + c.nH + ' × ' + RATES.Cl[c.rad] + ' = ' + w[i], c.nH + ' × ' + RATES.Cl[c.rad] + ' = ' + w[i] + ' (' + RADH[c.rad].en + ' hydrogens)')) }]
        });
      }
    }
    if (chiralityClear(ctx, smi, a)) {
      const chiral = cl.map((c, i) => (stereo.isChiral(c.prod) ? i : -1)).filter(i => i >= 0);
      if (chiral.length) {
        steps.push({
          prompt: t('Kurie iš šių produktų yra chiralinės molekulės?', 'Which of these products are chiral molecules?'),
          kind: 'multi', options: cl.map(c => ({ mol: { smi: c.prod } })), answer: chiral,
          hint: t('Patikrinkite kiekvieną produkto anglies atomą, ne tik tą, prie kurio prisijungė chloras.', 'Check every carbon of each product, not only the one that took the chlorine.'),
          solution: t('Chiralinis produktas turi bent vieną anglies atomą su keturiais skirtingais pakaitais. Tai gali būti pats pakeistas atomas (2-chlorbutanas) arba kitas atomas, kurio pakaitai po chlorinimo tapo skirtingi (pavyzdžiui, 1-chlor-2-metilbutane). Tarpinis radikalas plokščias, todėl naujas chiralinis centras susidaro kaip racematas.',
            'A chiral product has at least one carbon with four different groups. It can be the substituted carbon itself (2-chlorobutane) or another carbon whose groups became different after chlorination (for example in 1-chloro-2-methylbutane). The intermediate radical is planar, so a new chiral centre forms as a racemate.')
        });
      }
    }
    return {
      q: [{ p: t('Angliavandenilis reaguoja su chloru apšvietus.', 'A hydrocarbon reacts with chlorine in light.') }, { scheme: { items: [sp(smi), hv('Cl')] } }],
      steps,
      why: t('Chlorinant gaunamas visų monochlorintų izomerų mišinys, nes chloro radikalas beveik nesirenka. Kiekvienas produktas atitinka vieną radikalą, o jo kiekis priklauso ir nuo vandenilių skaičiaus, ir nuo radikalo tipo.',
        'Chlorination gives a mixture of all monochloro isomers, because the chlorine radical hardly chooses. Each product corresponds to one radical, and its amount depends on both the number of hydrogens and the type of radical.'),
      src: 'S4.1'
    };
  }

  /* ---------- generator: Br2, hv: the site, the radical, the main product ---------- */
  function genBrom(rng, ctx) {
    const pk = pickAnalysed(ctx, 'Br', (a) => a.classes.length >= 2 && a.classes.some(c => !c.major));
    if (!pk) throw new Error('u06.brom: no usable hydrocarbon');
    const { smi, a } = pk;
    const majors = a.classes.filter(c => c.major), others = a.classes.filter(c => !c.major);
    const tie = majors.length > 1;
    const best = a.best;
    const take = ctx.shuffle(others).slice(0, Math.max(1, 4 - majors.length));
    const radOpts = majors.concat(take).map(c => ({ mol: { smi: radicalOf(ctx.chem, smi, c.rep) } }));
    const prodOpts = majors.concat(take).map(c => ({ mol: { smi: c.prod } }));
    const allSites = [].concat.apply([], majors.map(c => c.sites)).sort((x, y) => x - y);
    const many = allSites.length > 1;
    const lab = allSites.map(i => i + 1).join(', ');
    const idx = majors.map((c, i) => i);
    const steps = [{
      prompt: many ? t('Bakstelėkite visus anglies atomus, kurių vandenilį $Br•$ atplėšia greičiausiai (ir simetriškai ekvivalentiškus).', 'Tap every carbon whose hydrogen $Br•$ abstracts fastest (equivalent carbons too).')
        : t('Bakstelėkite anglies atomą, kurio vandenilį $Br•$ atplėšia greičiausiai.', 'Tap the carbon whose hydrogen $Br•$ abstracts fastest.'),
      kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: allSites,
      hint: t('Palyginkite, koks alkilradikalas susidarytų atplėšus vandenilį nuo kiekvieno atomo.', 'Compare the alkyl radical that would form when the hydrogen is removed from each carbon.'),
      solution: many
        ? t('Vandenilis greičiausiai atplėšiamas nuo atomų Nr. ' + lab + ': visi jie duoda stabiliausio tipo radikalą – ' + RADC[best].lt + ' radikalą.', 'The hydrogen is removed fastest from carbons no. ' + lab + ': each gives a radical of the most stable type, a ' + RAD[best].en + '.')
        : t('Vandenilis greičiausiai atplėšiamas nuo atomo Nr. ' + lab + ': susidaro stabiliausias radikalas – ' + RAD[best].lt + '.', 'The hydrogen is removed fastest from carbon no. ' + lab + ': the most stable radical forms, a ' + RAD[best].en + '.')
    }, {
      prompt: tie ? t('Pažymėkite radikalus, kurie susidaro greičiausiai.', 'Pick the radicals that form fastest.') : t('Kuris alkilradikalas susidaro greičiausiai?', 'Which alkyl radical forms fastest?'),
      kind: tie ? 'multi' : 'choice', options: radOpts, answer: tie ? idx : 0,
      hint: t('Prisiminkite radikalų stabilumo eilę: benzil- = alil- > tretinis > antrinis > pirminis > metil-.', 'Recall the stability order of radicals: benzyl = allyl > tertiary > secondary > primary > methyl.'),
      solution: t('Kuo stabilesnis radikalas, tuo greičiau jis susidaro. Čia tai ' + RAD[best].lt + '.', 'The more stable the radical, the faster it forms. Here it is the ' + RAD[best].en + '.')
    }, {
      prompt: tie ? t('Pažymėkite pagrindinius produktus.', 'Pick the main products.') : t('Koks yra pagrindinis produktas?', 'What is the main product?'),
      kind: tie ? 'multi' : 'choice', options: prodOpts, answer: tie ? idx : 0,
      hint: t('Bromo radikalas jungiasi prie to atomo, kuris tapo radikalu. Visi variantai yra monobromidai, skiriasi tik bromo vieta.', 'The bromine bonds to the carbon that became the radical. All options are monobromides: only the position of bromine differs.'),
      solution: [{ p: t('Alkilradikalas reaguoja su $Br2$: susidaro $C-Br$ ryšys, o $Br•$ atsinaujina.', 'The alkyl radical reacts with $Br2$: a $C-Br$ bond forms and $Br•$ is regenerated.') }].concat(majors.map(c => ({ mol: { smi: c.prod } })))
    }];
    const nm = !tie && nameOf(ctx, majors[0].prod, 'lt') && nameOf(ctx, majors[0].prod, 'en');
    if (nm) {
      steps.push({
        prompt: t('Pavadinkite pagrindinį produktą.', 'Name the main product.'),
        kind: 'name', mol: { smi: majors[0].prod }, answer: { smi: majors[0].prod },
        hint: t('Raskite pagrindinę grandinę ar žiedą ir sunumeruokite taip, kad pakaitai gautų mažiausius numerius.', 'Find the parent chain or ring and number it so the substituents get the lowest numbers.'),
        solution: t(nameOf(ctx, majors[0].prod, 'lt'), nameOf(ctx, majors[0].prod, 'en'))
      });
    }
    return {
      q: [{ p: t('Angliavandenilis brominamas radikaliniu būdu.', 'A hydrocarbon is brominated by the radical route.') }, { scheme: { items: [sp(smi), hv('Br')] } }],
      steps,
      why: t('Bromo radikalas mažai aktyvus ir labai selektyvus: jis atplėšia tą vandenilį, kurį pašalinus susidaro stabiliausias radikalas, o toks produktas ir vyrauja. Chloras taip nesirenka.',
        'The bromine radical is weakly reactive and very selective: it removes the hydrogen whose loss gives the most stable radical, and that product predominates. Chlorine does not choose like this.'),
      src: 'L6 p12'
    };
  }

  /* ---------- generator: product shares from relative rates ---------- */
  function genPct(rng, ctx) {
    const X = ctx.pick(['Cl', 'Br']);
    const pk = pickAnalysed(ctx, X, (a) => a.classes.length >= 2 && a.classes.length <= 3 && a.classes.every(c => c.rad >= 1 && c.rad <= 3));
    if (!pk) throw new Error('u06.pct: no usable hydrocarbon');
    const { smi, a } = pk;
    const w = a.classes.map(c => c.nH * RATES[X][c.rad]);
    const total = w.reduce((s, x) => s + x, 0);
    const k = ctx.int(0, a.classes.length - 1);
    const c = a.classes[k];
    const share = Math.round(1000 * w[k] / total) / 10;
    const lines = a.classes.map((cc, i) => t(RADH[cc.rad].lt + ' vandeniliai: ' + cc.nH + ' × ' + RATES[X][cc.rad] + ' = ' + w[i], RADH[cc.rad].en + ' hydrogens: ' + cc.nH + ' × ' + RATES[X][cc.rad] + ' = ' + w[i]));
    const rt = RATES[X];
    const one = c.sites.length === 1;
    return {
      q: [{
        p: t('Angliavandenilio radikalinio halogeninimo metu vieno vandenilio atomo santykinis reaktingumas yra: pirminis ' + rt[1] + ', antrinis ' + rt[2] + ', tretinis ' + rt[3] + ' (supaprastintas modelis, $' + X + '2$, hν).',
          'In the radical halogenation of a hydrocarbon the relative reactivity of one hydrogen is: primary ' + rt[1] + ', secondary ' + rt[2] + ', tertiary ' + rt[3] + ' (a simplified model, $' + X + '2$, hν).')
      }, { scheme: { items: [sp(smi), hv(X)] } }, { p: t('Apskaičiuokite, kokią dalį visų monohalogeninių produktų sudaro šis junginys:', 'Calculate what share of all monohalogen products this compound makes up:') }, { mol: { smi: c.prod } }],
      steps: [{
        prompt: t('Kiek vandenilio atomų gali duoti šį produktą?', 'How many hydrogen atoms can give this product?'),
        kind: 'number', answer: { value: c.nH, tol: 0 }, mol: { smi, opts: { numbers: 'all' } },
        hint: t('Suskaičiuokite visus vandenilius, kurie su pakeistu vandeniliu ekvivalentūs pagal simetriją.', 'Count all hydrogens that are equivalent to the replaced one by symmetry.'),
        solution: c.nH === 1 ? t('Produktą duoda vienas vandenilis, esantis prie atomo Nr. ' + sitesText(c) + '.', 'One hydrogen gives this product, on carbon no. ' + sitesText(c) + '.')
          : t('Produktą duoda ' + c.nH + (c.nH >= 10 ? ' ekvivalentiškų vandenilių, esančių prie ' : ' ekvivalentiški vandeniliai, esantys prie ') + (one ? 'atomo' : 'atomų') + ' Nr. ' + sitesText(c) + '.', c.nH + ' equivalent hydrogens give this product, on ' + (one ? 'carbon' : 'carbons') + ' no. ' + sitesText(c) + '.')
      }, {
        prompt: t('Kokią dalį (procentais) šis produktas sudaro?', 'What share (in per cent) does this product make up?'),
        kind: 'number', answer: { value: share, tol: Math.max(0.2, Math.round(share * 3) / 100) }, mol: { smi: c.prod },
        hint: t('Produkto kiekis proporcingas vandenilių skaičiui, padaugintam iš vieno vandenilio reaktingumo.', 'The amount of a product is proportional to the number of hydrogens times the reactivity of one hydrogen.'),
        solution: [{ p: t('Kiekvienai grupei: vandenilių skaičius × reaktingumas. Šios grupės dalis = jos skaičius / suma.', 'For each group: number of hydrogens × reactivity. The share of this group is its value divided by the sum.') },
          { list: lines }, { p: t('Dalis = ' + w[k] + ' / ' + total + ' = ' + String(share).replace('.', ',') + ' %.', 'Share = ' + w[k] + ' / ' + total + ' = ' + share + ' %.') }]
      }],
      why: t('Produktų santykį lemia du dalykai: kiek vandenilių duoda kiekvieną produktą ir kaip greitai jie pakeičiami. Chloro atveju skirtumas tarp pirminių ir tretinių vandenilių nedidelis, todėl svarbus ir vandenilių skaičius. Bromo atveju vienas tretinis vandenilis pranoksta daugybę pirminių.',
        'Two things set the product ratio: how many hydrogens give each product and how fast they are replaced. With chlorine the difference between primary and tertiary hydrogens is small, so the number of hydrogens matters too. With bromine a single tertiary hydrogen outweighs many primary ones.'),
      src: 'L6 p13'
    };
  }

  /* ---------- generator: order radicals by stability ---------- */
  const WRONG_STAB = [
    t('Radikalas turi teigiamą krūvį, kurį stabilizuoja kaimyninės grupės.', 'The radical carries a positive charge that the neighbouring groups stabilise.'),
    t('Kuo mažiau alkilgrupių prie radikalo centro, tuo mažiau erdvinių trukdžių ir tuo radikalas stabilesnis.', 'The fewer alkyl groups at the radical centre, the less steric hindrance and the more stable the radical.'),
    t('Stabilumą lemia tik C–H ryšių skaičius visoje molekulėje.', 'Stability depends only on the number of C–H bonds in the whole molecule.'),
    t('Radikalas stabilesnis, kai jo anglies atomas yra sp³ hibridizuotas ir piramidinis.', 'A radical is more stable when its carbon is sp³ hybridised and pyramidal.')
  ];
  function genRank(rng, ctx) {
    const cats = ['top', 'tert', 'sec', 'prim', 'methyl'];
    const drop = ctx.int(0, 5);                               // 5 = keep all five
    const use = drop === 5 ? cats : cats.filter((c, i) => i !== drop);
    const topKind = ctx.pick(['benzyl', 'allyl']);
    const list = use.map(c => ctx.pick(RADS[c === 'top' ? topKind : c]));
    const topCat = use[0];
    const reasons = {
      top: topKind === 'benzyl'
        ? t('Nesuporuotas elektronas delokalizuojamas per benzeno žiedą (konjugacija).', 'The unpaired electron is delocalised over the benzene ring (conjugation).')
        : t('Nesuporuotas elektronas delokalizuojamas per $C=C$ ryšį (konjugacija).', 'The unpaired electron is delocalised over the $C=C$ bond (conjugation).'),
      tert: t('Radikalo centras turi tris alkilgrupes: hiperkonjugacija ir erdviniai trukdžiai jį stabilizuoja labiausiai.', 'The radical centre carries three alkyl groups: hyperconjugation and steric hindrance stabilise it the most.'),
      sec: t('Radikalo centras turi dvi alkilgrupes, todėl hiperkonjugacija stipresnė nei pirminio radikalo ar metilradikalo.', 'The radical centre carries two alkyl groups, so hyperconjugation is stronger than in a primary or methyl radical.'),
      prim: t('Radikalo centras turi vieną alkilgrupę ir gauna hiperkonjugacijos stabilizaciją, kurios metilradikalas neturi.', 'The radical centre has one alkyl group and gets hyperconjugation that the methyl radical lacks.')
    };
    const opts = [reasons[topCat]].concat(ctx.shuffle(WRONG_STAB).slice(0, 3)).map(x => ({ text: x }));
    return {
      q: [{ p: t('Radikalai susidaro angliavandenilių halogeninimo metu kaip tarpinės dalelės.', 'Radicals form as intermediates in the halogenation of hydrocarbons.') }],
      steps: [{
        prompt: t('Išdėstykite radikalus nuo stabiliausio iki mažiausiai stabilaus.', 'Put the radicals in order from the most stable to the least stable.'),
        kind: 'order', options: list.map(s => ({ mol: sp(s) })),
        hint: t('Prisiminkite eilę: benzil- = alil- > tretinis > antrinis > pirminis > metil-. Pirmiausia nustatykite, kiek alkilgrupių turi radikalo atomas.', 'Recall the order: benzyl = allyl > tertiary > secondary > primary > methyl. First find how many alkyl groups the radical atom carries.'),
        solution: t('Stabilumas didėja didėjant radikalo centro pakeistumui, o konjuguoti radikalai stabiliausi.', 'Stability grows with the substitution of the radical centre, and conjugated radicals are the most stable.')
      }, {
        prompt: t('Kodėl stabiliausias iš šių radikalų yra pats stabiliausias?', 'Why is the most stable of these radicals the most stable?'),
        kind: 'choice', options: opts, answer: 0,
        hint: t('Nupieškite radikalą ir paklauskite, su kuo gali sąveikauti jo nesuporuotas elektronas.', 'Draw the radical and ask what its unpaired electron can interact with.'),
        solution: reasons[topCat]
      }],
      why: t('Radikalą stabilizuoja konjugacija (aliltipo ir benziltipo), hiperkonjugacija su gretimų alkilgrupių C–H ryšiais ir erdviniai trukdžiai. Todėl eilė: benzil- = alil- > tretinis > antrinis > pirminis > metil-.',
        'A radical is stabilised by conjugation (allylic and benzylic), by hyperconjugation with the C–H bonds of neighbouring alkyl groups and by steric hindrance. The order is therefore benzyl = allyl > tertiary > secondary > primary > methyl.'),
      src: 'L6 p16'
    };
  }

  /* ---------- generator: which hydrocarbon gives one product / which haloalkane is made cleanly ---------- */
  function genSingle(rng, ctx) {
    const mode = ctx.pick(['A', 'B', 'B']);
    const X = mode === 'A' ? 'Cl' : ctx.pick(['Cl', 'Br']);
    let pick = null;
    for (let k = 0; k < 200 && !pick; k++) {
      const smi = ctx.pick(POOL);
      const a = analyseCached(ctx, smi, X);
      if (!a) continue;
      const majors = a.classes.filter(c => c.major);
      if (X === 'Cl' ? a.classes.length !== 1 : majors.length !== 1) continue;
      if (X === 'Br' && a.classes.length < 2) continue;
      const wrongs = [];
      const wrongHalides = [];
      partnersCached(ctx, smi).forEach(p => {
        const b = analyseCached(ctx, p, X);
        if (!b) return;
        if (mode === 'A') { if (b.classes.length > 1) wrongs.push(p); return; }
        const cand = b.classes.filter(c => (X === 'Cl' ? b.classes.length > 1 : !c.major));
        if (cand.length) wrongHalides.push(ctx.pick(cand).prod);
      });
      const pool = mode === 'A' ? wrongs : wrongHalides;
      if (pool.length < 2) continue;
      pick = { smi, a, target: majors[0].prod, pool };
    }
    if (!pick) throw new Error('u06.single: no usable hydrocarbon');
    const selective = pick.a.classes.length > 1;
    const wrongPick = ctx.shuffle(pick.pool).slice(0, ctx.int(2, Math.min(3, pick.pool.length)));
    const options = [mode === 'A' ? pick.smi : pick.target].concat(wrongPick).map(s => ({ mol: { smi: s } }));
    const bestTxt = RADC[pick.a.best];
    const right = selective
      ? t('Bromas selektyvus: stabiliausią radikalą duoda tik viena ekvivalentinių vandenilių grupė, todėl vyrauja vienas produktas.', 'Bromine is selective: only one group of equivalent hydrogens gives the most stable radical, so one product predominates.')
      : t('Visi vandenilio atomai ekvivalentiški, todėl galimas tik vienas monohalogeninis produktas.', 'All hydrogens are equivalent, so only one monohalogen product is possible.');
    const wrongs = selective
      ? [t('Visi vandenilio atomai ekvivalentiški.', 'All hydrogens are equivalent.'),
        t('Bromas reaguoja tik su pirminiais C–H ryšiais.', 'Bromine reacts only with primary C–H bonds.'),
        t('Šis produktas susidaro iš pirminio radikalo, kuris susidaro greičiausiai.', 'This product comes from a primary radical, which forms fastest.')]
      : [t('Chloras reaguoja tik su pirminiais C–H ryšiais.', 'Chlorine reacts only with primary C–H bonds.'),
        t('Šiame angliavandenilyje yra tretinis atomas, kurio radikalas stabiliausias.', 'This hydrocarbon has a tertiary carbon whose radical is the most stable.'),
        t('Chloras pigesnis už bromą, todėl vyksta tik viena reakcija.', 'Chlorine is cheaper than bromine, so only one reaction takes place.')];
    const q = mode === 'A'
      ? [{ p: t('Kuris iš šių izomerinių angliavandenilių, chloruojamas radikaliniu būdu, duoda tik vieną monochlorintą produktą?', 'Which of these isomeric hydrocarbons gives only one monochloro product on radical chlorination?') }]
      : [{ p: t('Kurį iš šių halogenalkanų galima gauti radikaliniu halogeninimu ($' + X + '2$, hν) kaip vienintelį pagrindinį produktą?', 'Which of these haloalkanes can be made by radical halogenation ($' + X + '2$, hν) as the only main product?') }];
    return {
      q,
      steps: [{
        prompt: mode === 'A' ? t('Pasirinkite angliavandenilį.', 'Choose the hydrocarbon.') : t('Pasirinkite halogenalkaną.', 'Choose the haloalkane.'),
        kind: 'choice', options, answer: 0,
        hint: mode === 'A' ? t('Suskaičiuokite ekvivalentinių vandenilių grupes kiekviename angliavandenilyje.', 'Count the groups of equivalent hydrogens in each hydrocarbon.')
          : t('Pagalvokite, iš kokio angliavandenilio kiekvienas halogenalkanas gaunamas ir kaip jis ten susidaro: vienintelis ar vienas iš kelių produktų?', 'Think from which hydrocarbon each haloalkane comes and how it forms there: as the only product or as one of several?'),
        solution: t((mode === 'A' ? 'Tinkamas angliavandenilis turi ' : 'Tinkamas halogenalkanas gaunamas iš angliavandenilio, kuris turi ') + (selective ? 'vienintelę ekvivalentinių vandenilių grupę, duodančią stabiliausią (' + bestTxt.lt + ') radikalą' : 'vienintelę ekvivalentinių vandenilių grupę') + '. Kitų izomerų produktų mišiniai sunkiai išskiriami.',
          (mode === 'A' ? 'The suitable hydrocarbon has ' : 'The right haloalkane comes from a hydrocarbon that has ') + (selective ? 'a single group of equivalent hydrogens that gives the most stable (' + bestTxt.en + ') radical' : 'a single group of equivalent hydrogens') + '. The other isomers give mixtures that are hard to separate.')
      }, {
        prompt: t('Kodėl šis variantas tinka?', 'Why does this option work?'),
        kind: 'choice', options: [right].concat(wrongs).map(x => ({ text: x })), answer: 0,
        hint: t('Mąstykite apie tai, kiek skirtingų produktų galėtų susidaryti.', 'Think about how many different products could form.'),
        solution: right
      }],
      why: t('Radikalinis halogeninimas duoda vieną produktą tik tada, kai visi vandeniliai ekvivalentiški, arba kai bromas pasirenka vienintelę vandenilių grupę, duodančią stabiliausią radikalą. Kitu atveju gaunamas sunkiai skiriamas izomerų mišinys.',
        'Radical halogenation gives one product only when all hydrogens are equivalent, or when bromine picks the single group of hydrogens that gives the most stable radical. Otherwise a mixture of isomers forms that is hard to separate.'),
      src: 'S4.11'
    };
  }

  /* ---------- notes ---------- */
  const NOTES = [
    {
      id: 'alkanai',
      title: t('Alkanai ir kodėl jie reaguoja radikalais', 'Alkanes and why they react through radicals'),
      blocks: [
        {
          p: t('Alkanai – sotieji angliavandeniliai, kurių anglies atomai sudaro atvirą grandinę ir yra sujungti vien σ ryšiais; bendroji formulė CₙH₂ₙ₊₂. Cikloalkanuose grandinė uždara, jų formulė CₙH₂ₙ. Pažiūrėkime, kokios reakcijos jiems būdingos ir kodėl.',
            'Alkanes are saturated hydrocarbons whose carbons form an open chain joined by σ bonds only; general formula CₙH₂ₙ₊₂. Cycloalkanes have a closed ring and the formula CₙH₂ₙ. Let us see which reactions they undergo, and why.'),
          src: 'L6 p2'
        },
        {
          mol: [
            { smi: 'C', name: t('metanas', 'methane') }, { smi: 'CC', opts: { condensed: true }, name: t('etanas', 'ethane') },
            { smi: 'CCC', name: t('propanas', 'propane') }, { smi: 'CCCC', name: t('butanas', 'butane') }
          ]
        },
        {
          mol: [
            { smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { smi: 'C1CCC1', name: t('ciklobutanas', 'cyclobutane') },
            { smi: 'C1CCCC1', name: t('ciklopentanas', 'cyclopentane') }, { smi: 'C1CCCCC1', name: t('cikloheksanas', 'cyclohexane') }
          ],
          src: 'L6 p3'
        },
        {
          rule: t('Alkanuose yra tik sp³ hibridizuoti anglies atomai. Ryšiai $C-C$ nepoliniai, o $C-H$ beveik nepoliniai, todėl molekulėje nėra nei teigiamo, nei neigiamo centro, kurį pultų nukleofilas ar elektrofilas. Alkanai inertiški heterolizinėms reakcijoms, o jiems būdingos radikalinės reakcijos.',
            'Alkanes contain only sp³ carbons. The $C-C$ bonds are non-polar and the $C-H$ bonds almost non-polar, so the molecule has no positive or negative centre for a nucleophile or electrophile to attack. Alkanes are inert in heterolytic reactions; their typical reactions are radical reactions.'),
          src: 'L6 p5'
        },
        {
          p: t('Taip pat elgiasi ir neįtempti cikloalkanai, pavyzdžiui, ciklopentanas ir cikloheksanas. Alkanų konformacijos ir žiedų geometrija aptariamos izomerijos skyriuje.',
            'Unstrained cycloalkanes such as cyclopentane and cyclohexane behave the same way. Conformations of alkanes and the geometry of rings are covered in the isomerism unit.'),
          src: 'T p52'
        },
        {
          p: t('Įtempti trinariai ir keturnariai žiedai elgiasi kitaip: ciklopropanas su halogenais reaguoja atsiverdamas žiedui, todėl radikalinio pakeitimo uždaviniuose jų nėra.',
            'Strained three- and four-membered rings behave differently: cyclopropane reacts with halogens by ring opening, so they do not appear in the radical substitution problems.'),
          src: 'T p60'
        },
        {
          scheme: { items: [{ smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { arrow: '→', above: f('Br2') }, { smi: 'BrCCCBr', name: t('1,3-dibrompropanas', '1,3-dibromopropane') }] },
          claims: [{ react: ['ae.x2', ['C1CC1'], { X: 'Br' }, 'BrCCCBr'] }],
          src: 'T p60'
        },
        { h: t('Alkanai gamtoje', 'Alkanes in nature') },
        {
          p: t('Daug gyvūnų bendrauja cheminėmis medžiagomis – feromonais. Tarp jų yra ir alkanų: undekanas yra tarakonų agregacijos feromonas, o 2-metilheptadekanas – tigrinių drugių lytinis feromonas.',
            'Many animals communicate through chemicals called pheromones, and some of them are alkanes: undecane is an aggregation pheromone of cockroaches, and 2-methylheptadecane is a sex pheromone of tiger moths.'),
          src: 'L6 p4'
        },
        { mol: [{ smi: 'CCCCCCCCCCC', name: t('undekanas', 'undecane') }, { smi: 'CC(C)CCCCCCCCCCCCCCC', name: t('2-metilheptadekanas', '2-methylheptadecane') }] },
        {
          pitfall: t('„Inertiški“ nereiškia „nereaguoja“. Alkanai dega, halogeninasi ir oksiduojasi, tik visos šios reakcijos radikalinės, o ne joninės.',
            '“Inert” does not mean “does not react”. Alkanes burn, halogenate and oxidise, but all these reactions are radical, not ionic.')
        },
        { practice: 'u06.why' }
      ]
    },
    {
      id: 'radikalai',
      title: t('Radikalai: kaip susidaro ir kodėl tokie reaktingi', 'Radicals: how they form and why they are so reactive'),
      blocks: [
        {
          p: t('Radikalas yra dalelė su nesuporuotu elektronu. Jis neturi pilno okteto, todėl labai reaktingas ir siekia įgyti trūkstamą elektroną. Radikalai susidaro, kai kovalentinis ryšys suskyla homolizės būdu: kiekvienam atomui atitenka po vieną ryšio elektroną.',
            'A radical is a species with an unpaired electron. It lacks a full octet, so it is very reactive and tries to gain the missing electron. Radicals form when a covalent bond breaks by homolysis: each atom keeps one electron of the bond.')
        },
        {
          mech: [{
            scheme: { items: [{ smi: 'ClCl' }, { arrow: '→', above: f('hν') }, { smi: '[Cl]' }, { plus: true }, { smi: '[Cl]' }] },
            arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }],
            note: t('Homolizė: kiekvienas atomas pasiima po vieną elektroną. Radikalo nesuporuotas elektronas piešiamas tašku.', 'Homolysis: each atom takes one electron. The unpaired electron of a radical is drawn as a dot.')
          }],
          src: 'L6 p7'
        },
        {
          rule: t('Viengalė (puslankė) strėlė rodo vieno elektrono judėjimą, o įprasta lenkta strėlė – elektronų poros judėjimą. Radikalinėms reakcijoms piešiamos viengalės strėlės.',
            'A half-headed (fish-hook) arrow shows the movement of one electron; the usual full curved arrow shows the movement of an electron pair. Radical reactions use half-headed arrows.')
        },
        {
          p: t('Radikalus galima generuoti trimis būdais:', 'Radicals can be generated in three ways:'),
          src: 'L6 p6'
        },
        {
          list: [
            t('terminis ryšio suardymas (termolizė, t > 500 °C);', 'breaking the bond with heat (thermolysis, t > 500 °C);'),
            t('šviesa, matoma ar UV (fotolizė);', 'light, visible or UV (photolysis);'),
            t('oksidacijos ir redukcijos procesai.', 'oxidation–reduction processes.')
          ],
          src: 'L6 p6'
        },
        { h: t('Metilradikalas', 'The methyl radical') },
        {
          p: t('Paprasčiausias organinis radikalas yra $CH3•$. Jis plokščias, jo anglis sp² hibridizuota, o nesuporuotas elektronas užima atskirą, nehibridizuotą 2p orbitalę, statmeną molekulės plokštumai.',
            'The simplest organic radical is $CH3•$. It is planar, its carbon is sp² hybridised, and the unpaired electron sits in an unhybridised 2p orbital perpendicular to the molecular plane.'),
          src: 'L6 p9'
        },
        { mol: { smi: '[CH3]', caption: t('metilradikalas', 'methyl radical') }, claims: [{ hyb: ['[CH3]', 0, 'sp2'] }] },
        {
          pitfall: t('Radikalinių reakcijų nevaizduokite įprastomis lenktomis strėlėmis: tokia strėlė perkelia du elektronus, o radikalinėje reakcijoje juda pavieniai elektronai.',
            'Do not draw radical steps with full arrows. A full arrow moves two electrons, so it is wrong for radical reactions.')
        },
        { practice: 'u06.step' }
      ]
    },
    {
      id: 'grandine',
      title: t('Grandininė reakcija: SR halogeninimas', 'The chain reaction: SR halogenation'),
      blocks: [
        {
          p: t('Alkano vandenilis pakeičiamas halogenu radikalinio pakeitimo mechanizmu, žymimu SR. Tai grandininė reakcija, kurią sudaro trys stadijos: grandinės pradžia (iniciacija), grandinės augimas ir grandinės nutrūkimas. Pavyzdys – metano chlorinimas.',
            'A hydrogen of an alkane is replaced by a halogen through the radical substitution mechanism, written SR. It is a chain reaction with three stages: initiation (start of the chain), propagation (growth) and termination. The example is the chlorination of methane.'),
          src: 'L6 p7'
        },
        {
          scheme: { items: [{ smi: 'C', opts: { condensed: true } }, { plus: true }, { smi: 'ClCl' }, { arrow: '→', above: f('hν') }, { smi: 'CCl', opts: { condensed: true } }, { plus: true }, { smi: 'Cl' }] },
          caption: t('Bendroji lygtis: vienas vandenilis pakeistas chloru.', 'Overall equation: one hydrogen is replaced by chlorine.')
        },
        { h: t('1. Grandinės pradžia (iniciacija)', '1. Initiation') },
        {
          mech: [{
            scheme: { items: [{ smi: 'ClCl' }, { arrow: '→', above: f('hν') }, { smi: '[Cl]' }, { plus: true }, { smi: '[Cl]' }] },
            arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 0 }, half: true }, { from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }]
          }],
          caption: t('Šviesos energija suskaido $Cl-Cl$ ryšį: atsiranda du chloro radikalai.', 'Light energy splits the $Cl-Cl$ bond into two chlorine radicals.'),
          src: 'L6 p7'
        },
        { h: t('2. Grandinės augimas', '2. Propagation') },
        {
          mech: [
            {
              scheme: { items: [{ smi: '[Cl]' }, { plus: true }, { smi: 'C', opts: { allH: true } }, { arrow: '→' }, { smi: 'Cl' }, { plus: true }, { smi: '[CH3]' }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 'H0' }, half: true }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 'H0' }, half: true }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 }, half: true }],
              note: t('Chloro radikalo elektronas ir vienas $C-H$ elektronas sudaro $H-Cl$ ryšį, o kitas $C-H$ elektronas lieka anglies atomui: susidaro $HCl$ ir metilradikalas.', 'The electron of the chlorine radical and one $C-H$ electron form the $H-Cl$ bond, and the other $C-H$ electron stays on carbon: $HCl$ and a methyl radical form.')
            },
            {
              scheme: { items: [{ smi: '[CH3]' }, { plus: true }, { smi: 'ClCl' }, { arrow: '→' }, { smi: 'CCl', opts: { condensed: true } }, { plus: true }, { smi: '[Cl]' }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 0 }, half: true }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 }, half: true }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 }, half: true }],
              note: t('Metilradikalo elektronas ir vienas $Cl-Cl$ elektronas sudaro $C-Cl$ ryšį, o kitas $Cl-Cl$ elektronas lieka išeinančiam atomui: susidaro $CH3Cl$ ir naujas chloro radikalas.', 'The electron of the methyl radical and one $Cl-Cl$ electron form the $C-Cl$ bond, and the other $Cl-Cl$ electron stays on the leaving atom: $CH3Cl$ and a new chlorine radical form.')
            }
          ],
          src: 'L6 p7'
        },
        { h: t('3. Grandinės nutrūkimas', '3. Termination') },
        {
          mech: [
            {
              scheme: { items: [{ smi: '[Cl].[Cl]' }, { arrow: '→' }, { smi: 'ClCl' }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 0, mid: [0, 1] }, half: true }, { from: { m: 0, a: 1 }, to: { m: 0, mid: [0, 1] }, half: true }]
            },
            {
              scheme: { items: [{ smi: '[CH3].[CH3]' }, { arrow: '→' }, { smi: 'CC', opts: { condensed: true } }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 0, mid: [0, 1] }, half: true }, { from: { m: 0, a: 1 }, to: { m: 0, mid: [0, 1] }, half: true }]
            },
            {
              scheme: { items: [{ smi: '[CH3].[Cl]' }, { arrow: '→' }, { smi: 'CCl', opts: { condensed: true } }] },
              arrows: [{ from: { m: 0, a: 0 }, to: { m: 0, mid: [0, 1] }, half: true }, { from: { m: 0, a: 1 }, to: { m: 0, mid: [0, 1] }, half: true }]
            }
          ],
          caption: t('Kai du radikalai susijungia, nesuporuoti elektronai sudaro ryšį ir radikalų nebelieka.', 'When two radicals combine, the unpaired electrons form a bond and no radical is left.'),
          src: 'L6 p7'
        },
        {
          rule: t('Augimo stadijoje radikalas sunaudojamas ir iš karto susidaro kitas, todėl chloro radikalas atsinaujina ir vienas šviesos kvantas gali sukelti tūkstančius ciklų. Nutrūkimo stadijoje du radikalai susijungia ir radikalų nelieka.',
            'In propagation one radical is used up and another forms at once, so the chlorine radical is regenerated and a single photon can drive thousands of cycles. In termination two radicals combine and none is left.'),
          src: 'L6 p7'
        },
        {
          pitfall: t('Iniciaciją, augimą ir nutrūkimą atskirkite skaičiuodami radikalus: iniciacijoje jų atsiranda (0 → 2), augime skaičius nesikeičia (1 → 1), nutrūkime jų nebelieka (2 → 0).',
            'Tell initiation, propagation and termination apart by counting radicals: in initiation they appear (0 → 2), in propagation the number stays the same (1 → 1), in termination none is left (2 → 0).')
        },
        { h: t('Daugiau chloro: di-, tri- ir tetrachlorinimas', 'More chlorine: di-, tri- and tetrachlorination') },
        {
          p: t('Chloro pertekliaus atveju chlormetanas pats toliau chloruojamas tuo pačiu mechanizmu. Tokiu būdu susidaro dichlormetanas, trichlormetanas ir tetrachlormetanas.',
            'With an excess of chlorine, chloromethane is chlorinated further by the same mechanism, giving dichloromethane, trichloromethane and tetrachloromethane.'),
          src: 'L6 p8'
        },
        {
          scheme: {
            items: [{ smi: 'C', opts: { condensed: true } }, { arrow: '→', above: f('Cl2') }, { smi: 'CCl', opts: { condensed: true }, name: t('chlormetanas', 'chloromethane') }, { arrow: '→', above: f('Cl2') }, { smi: 'ClCCl', opts: { condensed: true }, name: t('dichlormetanas', 'dichloromethane') },
              { arrow: '→', above: f('Cl2') }, { smi: 'ClC(Cl)Cl', opts: { condensed: true }, name: t('trichlormetanas', 'trichloromethane') }, { arrow: '→', above: f('Cl2') }, { smi: 'ClC(Cl)(Cl)Cl', opts: { condensed: true }, name: t('tetrachlormetanas', 'tetrachloromethane') }]
          },
          src: 'L6 p8'
        },
        {
          p: t('Norint sustoti ties monohalogeninimu, alkanas imamas pertekliumi. Halogenų aktyvumas reakcijoje su alkanais mažėja taip: $F2 > Cl2 > Br2 > I2$.',
            'To stop at monohalogenation, the alkane is used in excess. The reactivity of the halogens towards alkanes falls in the order $F2 > Cl2 > Br2 > I2$.'),
          src: 'L6 p10'
        },
        {
          example: {
            q: [
              { p: t('Parašykite grandinės augimo reakcijas, kai etanas brominamas šviesoje.', 'Write the propagation steps when ethane is brominated in light.') }
            ],
            steps: [
              [{ p: t('Pirmoje augimo reakcijoje bromo radikalas atplėšia vandenilį nuo etano. Susidaro $HBr$ ir etilradikalas.', 'In the first propagation step a bromine radical removes a hydrogen from ethane. $HBr$ and an ethyl radical form.') },
                { scheme: { items: [{ smi: '[Br]' }, { plus: true }, { smi: 'CC', opts: { condensed: true } }, { arrow: '→' }, { smi: 'Br' }, { plus: true }, { smi: 'C[CH2]', opts: { condensed: true } }] } }],
              [{ p: t('Antroje augimo reakcijoje etilradikalas atplėšia bromo atomą nuo $Br2$. Susidaro bromoetanas ir vėl bromo radikalas.', 'In the second propagation step the ethyl radical takes a bromine atom from $Br2$. Bromoethane and a bromine radical form again.') },
                { scheme: { items: [{ smi: 'C[CH2]', opts: { condensed: true } }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'CCBr', name: t('brometanas', 'bromoethane') }, { plus: true }, { smi: '[Br]' }] } }],
              [{ p: t('Radikalas $Br•$ atsinaujino, todėl ciklas kartojasi. Sudėję abi augimo reakcijas gauname $CH3CH3 + Br2 → CH3CH2Br + HBr$.', 'The radical $Br•$ is regenerated, so the cycle repeats. Adding both steps gives $CH3CH3 + Br2 → CH3CH2Br + HBr$.') }]
            ]
          },
          claims: [{ react: ['sr.halogenate', ['CC'], { X: 'Br' }, 'CCBr'] }, { name: ['CCBr', { lt: 'brometanas', en: 'bromoethane' }] }, { formula: ['C[CH2]', 'C2H5'] }, { formula: ['Br', 'BrH'] }, { formula: ['BrBr', 'Br2'] }]
        },
        { practice: 'u06.chain' }
      ]
    },
    {
      id: 'stabilumas',
      title: t('Alkilradikalų stabilumas', 'Stability of alkyl radicals'),
      blocks: [
        {
          p: t('Kai alkane yra neekvivalentinių vandenilių, halogeno radikalas gali atplėšti bet kurį iš jų. Susidaro skirtingi alkilradikalai, kurie yra reakcijos tarpinės dalelės. Stabilesnis radikalas susidaro lengviau ir greičiau, todėl C–H ryšio aktyvumas didėja taip: pirminis < antrinis < tretinis.',
            'When an alkane has non-equivalent hydrogens, the halogen radical can remove any of them. Different alkyl radicals form as reaction intermediates. A more stable radical forms more easily and quickly, so the reactivity of a C–H bond grows in the order primary < secondary < tertiary.'),
          src: 'L6 p10–11'
        },
        {
          mol: [
            { smi: '[CH3]', caption: t('metilradikalas', 'methyl radical') }, { smi: 'C[CH2]', opts: { condensed: true }, caption: t('etilradikalas (pirminis)', 'ethyl radical (primary)') },
            { smi: 'C[CH]C', opts: { condensed: true }, caption: t('izopropilradikalas (antrinis)', 'isopropyl radical (secondary)') }, { smi: 'C[C](C)C', opts: { condensed: true }, caption: t('tret-butilradikalas (tretinis)', 'tert-butyl radical (tertiary)') }
          ],
          caption: t('Stabilumas didėja iš kairės į dešinę.', 'Stability increases from left to right.'),
          src: 'L6 p11'
        },
        {
          rule: t('Radikalų stabilumas: benzil- = alil- > tretinis > antrinis > pirminis > metil-. Kuo stabilesnis radikalas, tuo greičiau susidaro.',
            'Radical stability: benzyl = allyl > tertiary > secondary > primary > methyl. The more stable the radical, the faster it forms.'),
          src: 'L6 p16'
        },
        { h: t('Kas stabilizuoja radikalą', 'What stabilises a radical') },
        {
          list: [
            t('Erdviniai trukdžiai: kuo sunkiau pasiekiamas radikalo centras, tuo radikalas mažiau reaktingas.', 'Steric hindrance: the harder the radical centre is to reach, the less reactive the radical.'),
            t('Konjugacija: aliltipo ir benziltipo radikalų nesuporuotas elektronas delokalizuotas per $π$ sistemą.', 'Conjugation: in allylic and benzylic radicals the unpaired electron is delocalised over a $π$ system.'),
            t('Hiperkonjugacija: nesuporuotas elektronas sąveikauja su gretimų $C-H$ ryšių σ orbitalėmis.', 'Hyperconjugation: the unpaired electron interacts with the σ orbitals of adjacent $C-H$ bonds.')
          ],
          src: 'L6 p16'
        },
        {
          resonance: [{ smi: 'C=C[CH2]' }, { smi: '[CH2]C=C' }],
          caption: t('Alilradikalo rezonansinės formulės: elektronas pasiskirsto tarp dviejų galinių atomų.', 'Resonance structures of the allyl radical: the electron is shared by the two terminal carbons.')
        },
        {
          resonance: [{ smi: '[CH2]c1ccccc1' }, { smi: 'C=C1C=CC=C[CH]1' }, { smi: 'C=C1C=C[CH]C=C1' }],
          caption: t('Benzilradikalo atveju elektronas pasiskirsto per žiedą (orto ir para padėtyse).', 'In the benzyl radical the electron spreads over the ring (ortho and para positions).')
        },
        {
          p: t('Hiperkonjugacija stipresnė, kai radikalo atomas turi daugiau alkilgrupių: pirminis radikalas turi vieną alkilgrupę, antrinis – dvi, tretinis – tris, ir tiek pat kartų daugiau galimų sąveikų su gretimais $C-H$ ryšiais.',
            'Hyperconjugation is stronger when the radical carbon has more alkyl groups: a primary radical has one, a secondary two and a tertiary three, with correspondingly more possible interactions with the neighbouring $C-H$ bonds.'),
          src: 'L6 p17'
        },
        {
          table: {
            head: [t('Radikalas', 'Radical'), t('Alkilgrupių prie radikalo atomo', 'Alkyl groups on the radical carbon'), t('Hiperkonjugacija', 'Hyperconjugation')],
            rows: [
              [{ smi: 'C[CH2]', opts: { condensed: true } }, t('1', '1'), t('silpniausia', 'weakest')],
              [{ smi: 'C[CH]C', opts: { condensed: true } }, t('2', '2'), t('vidutinė', 'medium')],
              [{ smi: 'C[C](C)C', opts: { condensed: true } }, t('3', '3'), t('stipriausia', 'strongest')]
            ]
          }
        },
        {
          pitfall: t('Radikalų eilė panaši į karbokatijonų, bet radikalas krūvio neturi. Todėl jo stabilumą aiškinkite delokalizuotu nesuporuotu elektronu, o ne krūvio pasiskirstymu.',
            'The radical order resembles that of carbocations, but a radical carries no charge. Explain its stability by a delocalised unpaired electron, not by spreading a charge.')
        },
        {
          example: {
            q: [
              { p: t('2-metilbutanas reaguoja su $Br•$. Nuo kurio atomo bromo radikalas atplėš vandenilį greičiausiai?', '2-Methylbutane reacts with $Br•$. From which carbon will the bromine radical remove a hydrogen fastest?') },
              { mol: { smi: 'CC(C)CC', name: t('2-metilbutanas', '2-methylbutane') } }
            ],
            steps: [
              [{ p: t('Parašykite radikalus, kurie susidarytų atplėšus vandenilį nuo kiekvieno skirtingo atomo.', 'Write the radicals that would form when a hydrogen is removed from each different carbon.') },
                { mol: [{ smi: 'CC(C)C[CH2]', caption: t('pirminis', 'primary') }, { smi: 'C[C](C)CC', caption: t('tretinis', 'tertiary') }, { smi: 'CC(C)[CH]C', caption: t('antrinis', 'secondary') }, { smi: '[CH2]C(C)CC', caption: t('pirminis', 'primary') }] }],
              [{ p: t('Stabiliausias yra tretinis radikalas, todėl greičiausiai atplėšiamas vienintelis tretinio atomo vandenilis.', 'The tertiary radical is the most stable, so the single hydrogen of the tertiary carbon is removed fastest.') }],
              [{ p: t('Tretinis radikalas su $Br2$ duoda pagrindinį produktą:', 'The tertiary radical with $Br2$ gives the main product:') },
                { mol: { smi: 'CCC(C)(C)Br', name: t('2-brom-2-metilbutanas', '2-bromo-2-methylbutane') } }]
            ]
          },
          claims: [{ formula: ['C[C](C)CC', 'C5H11'] }, { react: ['sr.halogenate', ['CC(C)CC'], { X: 'Br' }, 'CCC(C)(C)Br'] }, { carbon: ['CC(C)CC', 1, 3] }, { name: ['CCC(C)(C)Br', { lt: '2-brom-2-metilbutanas', en: '2-bromo-2-methylbutane' }] }]
        },
        { practice: 'u06.rank' }
      ]
    },
    {
      id: 'selekt',
      title: t('Chloras ir bromas: neselektyvus ir selektyvus', 'Chlorine and bromine: unselective and selective'),
      blocks: [
        {
          rule: t('Bromas yra mažiau aktyvus, bet labai selektyvus: jis pakeičia tą vandenilį, kurį atplėšus susidaro stabiliausias radikalas (dažniausiai tretinio ar benziltipo atomo). Chloras aktyvesnis ir beveik neselektyvus: pirminius, antrinius ir tretinius vandenilius jis pakeičia beveik vienodu greičiu, todėl susidaro visų galimų izomerų mišinys.',
            'Bromine is less reactive but very selective: it replaces the hydrogen whose removal gives the most stable radical (most often on a tertiary or benzylic carbon). Chlorine is more reactive and almost unselective: it replaces primary, secondary and tertiary hydrogens at nearly equal rates, so a mixture of all possible isomers forms.'),
          src: 'L6 p12, p15; T p53'
        },
        {
          p: t('Reakcija vadinama regioselektyvia, kai reagentas pasirenka tik vieną iš kelių galimų reaktingų molekulės vietų. Brominimas toks ir yra.',
            'A reaction is called regioselective when the reagent bonds to just one of several possible reactive sites of the molecule. Bromination is regioselective.'),
          src: 'L6 p12'
        },
        { h: t('Butanas: du radikalai', 'Butane: two radicals') },
        {
          scheme: { items: [{ smi: '[Cl]' }, { plus: true }, { smi: 'CCCC' }, { arrow: '→' }, { smi: 'Cl' }, { plus: true }, { smi: 'CC[CH]C' }] },
          caption: t('Atplėšiamas antrinis vandenilis: susidaro antrinis radikalas ir paskui 2-chlorbutanas.', 'A secondary hydrogen is removed: a secondary radical forms, and then 2-chlorobutane.'),
          src: 'L6 p13'
        },
        {
          scheme: { items: [{ smi: '[Cl]' }, { plus: true }, { smi: 'CCCC' }, { arrow: '→' }, { smi: 'Cl' }, { plus: true }, { smi: 'CCC[CH2]' }] },
          caption: t('Atplėšiamas pirminis vandenilis: susidaro pirminis radikalas ir paskui 1-chlorbutanas.', 'A primary hydrogen is removed: a primary radical forms, and then 1-chlorobutane.'),
          src: 'L6 p13'
        },
        {
          p: t('Chlorinant susidaro abu chlorbutanai, o brominant vyrauja 2-brombutanas.', 'Chlorination gives both chlorobutanes, while bromination gives mainly 2-bromobutane.')
        },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), { lt: '1-halogenbutanas', en: '1-halobutane' }, t('dalis', 'share'), { lt: '2-halogenbutanas', en: '2-halobutane' }, t('dalis', 'share')],
            rows: [
              [fm('Cl2, hν'), { smi: 'CCCCCl' }, t('susidaro', 'forms'), { smi: 'CCC(C)Cl' }, t('susidaro (daugiau)', 'forms (more)')],
              [fm('Br2, hν'), { smi: 'CCCCBr' }, f('2 %'), { smi: 'CCC(C)Br' }, f('98 %')]
            ]
          },
          src: 'L6 p13'
        },
        { h: t('2-metilpropanas', '2-Methylpropane') },
        {
          table: {
            head: [t('Sąlygos', 'Conditions'), t('tretinis halogenidas', 'tertiary halide'), t('dalis', 'share'), t('pirminis halogenidas', 'primary halide'), t('dalis', 'share')],
            rows: [
              [fm('Br2, hν, 127 °C'), { smi: 'CC(C)(C)Br' }, f('> 99 %'), { smi: 'CC(C)CBr' }, t('pėdsakai', 'traces')],
              [fm('Cl2, hν, 25 °C'), { smi: 'CC(C)(C)Cl' }, f('37 %'), { smi: 'CC(C)CCl' }, f('63 %')]
            ]
          },
          src: 'L6 p14'
        },
        {
          p: t('Chloro atveju pirminis produktas vyrauja tik todėl, kad 2-metilpropane yra devyni pirminiai vandeniliai ir tik vienas tretinis. Greičiai skiriasi nedaug: vienam vandeniliui skaičiuojant, tretinis vandenilis chlorinamas tik maždaug penkis kartus greičiau už pirminį (37 / 1 prieš 63 / 9), o brominamas tūkstančius kartų greičiau.',
            'With chlorine the primary product predominates only because 2-methylpropane has nine primary hydrogens and only one tertiary hydrogen. The rates differ little: per hydrogen, the tertiary one is chlorinated only about five times faster than the primary one (37 / 1 against 63 / 9), and brominated thousands of times faster.'),
          src: 'L6 p14; Klein; T p53'
        },
        {
          p: t('Kodėl taip? Chloro radikalas labai aktyvus ir atplėšia vandenilį beveik bet kur, todėl radikalo stabilumas mažai svarbus. Mažiau aktyvus bromo radikalas „renkasi“: pereinamoji būsena primena susidarantį radikalą, todėl stabilumo skirtumas labai paveikia greitį.',
            'Why? The chlorine radical is very reactive and removes a hydrogen almost anywhere, so the stability of the radical matters little. The less reactive bromine radical is choosy: its transition state resembles the radical that forms, so a difference in radical stability greatly affects the rate.'),
          src: 'L6 p15; Klein'
        },
        {
          pitfall: t('Chloras pirminius, antrinius ir tretinius vandenilius keičia beveik vienodu greičiu, todėl gaunami mišiniai; vis dėlto tretinis vandenilis keičiamas šiek tiek greičiau, o produktų santykis priklauso ir nuo vandenilių skaičiaus. Žemoje temperatūroje chloras truputį selektyvesnis nei aukštoje.',
            'Chlorine replaces primary, secondary and tertiary hydrogens at nearly equal rates, so mixtures form; a tertiary hydrogen is still replaced slightly faster, and the product ratio also depends on the number of hydrogens. At low temperature chlorine is somewhat more selective than at high temperature.'),
          src: 'L6 p12; T p53'
        },
        {
          example: {
            q: [
              { p: t('Kokį pagrindinį produktą duoda 3-metilpentanas su $Br2$, hν, ir kiek monochlorintų izomerų su $Cl2$, hν?', 'What is the main product of 3-methylpentane with $Br2$, hν, and how many monochloro isomers form with $Cl2$, hν?') },
              { mol: { smi: 'CCC(C)CC', name: t('3-metilpentanas', '3-methylpentane') } }
            ],
            steps: [
              [{ p: t('Skirtingų vandenilių yra keturios rūšys: grandinės galų metilo grupių, $CH2$ grupių, tretinio $CH$ atomo ir metilo pakaito.', 'There are four kinds of hydrogen: those of the end methyls of the chain, of the $CH2$ groups, of the tertiary $CH$ and of the methyl substituent.') }],
              [{ p: t('Chloras beveik nesirenka, todėl susidaro keturi monochlorinti izomerai.', 'Chlorine hardly chooses, so four monochloro isomers form.') },
                { mol: [{ smi: 'ClCCC(C)CC', name: t('1-chlor-3-metilpentanas', '1-chloro-3-methylpentane') }, { smi: 'CC(Cl)C(C)CC', name: t('2-chlor-3-metilpentanas', '2-chloro-3-methylpentane') }, { smi: 'CCC(C)(Cl)CC', name: t('3-chlor-3-metilpentanas', '3-chloro-3-methylpentane') }, { smi: 'CCC(CC)CCl', name: t('3-chlormetilpentanas', '3-(chloromethyl)pentane') }] }],
              [{ p: t('Bromas pasirenka stabiliausią radikalą, tretinį, todėl vyrauja:', 'Bromine picks the most stable radical, the tertiary one, so the main product is:') },
                { mol: { smi: 'CCC(C)(Br)CC', name: t('3-brom-3-metilpentanas', '3-bromo-3-methylpentane') } }]
            ]
          },
          claims: [{ react: ['sr.halogenate', ['CCC(C)CC'], { X: 'Br' }, 'CCC(C)(Br)CC'] }, { name: ['CCC(C)(Br)CC', { lt: '3-brom-3-metilpentanas', en: '3-bromo-3-methylpentane' }] }]
        },
        { practice: 'u06.brom' },
        { practice: 'u06.pct' }
      ]
    },
    {
      id: 'produktai',
      title: t('Produktų nuspėjimas: kiek, kurie, kokie', 'Predicting products: how many, which, what kind'),
      blocks: [
        {
          p: t('Alkano halogeninimo produktus nuspėkite pagal tokį planą:', 'Predict the products of the halogenation of an alkane with this plan:')
        },
        {
          list: [
            t('Suraskite ekvivalentinių vandenilių grupes (pagal simetriją). Kiekviena grupė duoda vieną monohalogenidą.', 'Find the groups of equivalent hydrogens (by symmetry). Each group gives one monohalide.'),
            t('Chloruojant skaičiuokite visus izomerus. Brominant palikite tik tą, kuris susidaro iš stabiliausio radikalo.', 'For chlorination count all the isomers. For bromination keep only the one that comes from the most stable radical.'),
            t('Pažiūrėkite, ar produkte atsirado chiralinis centras.', 'Check whether the product has a chiral centre.')
          ],
          ordered: true
        },
        {
          example: {
            q: [
              { p: t('Etilciklopentanas chloruojamas ir brominamas šviesoje. Kiek monochlorintų izomerų gali susidaryti ir koks yra pagrindinis bromidas?', 'Ethylcyclopentane is chlorinated and brominated in light. How many monochloro isomers can form, and what is the main bromide?') },
              { mol: { smi: 'CCC1CCCC1', name: t('etilciklopentanas', 'ethylcyclopentane') } }
            ],
            steps: [
              [{ p: t('Skirtingų vandenilių yra penkios grupės: metilo, $CH2$ grupės, žiedo tretinio atomo, dviejų gretimų žiedo atomų ir dviejų tolimesnių žiedo atomų vandeniliai. Todėl chlorinant susidaro penki izomerai.', 'There are five groups of different hydrogens: the methyl, the $CH2$ group, the tertiary ring carbon, the two neighbouring ring carbons and the two remote ring carbons. So chlorination gives five isomers.') },
                { mol: [{ smi: 'ClCCC1CCCC1', name: t('(2-chloretil)ciklopentanas', '(2-chloroethyl)cyclopentane') }, { smi: 'CC(Cl)C1CCCC1', name: t('(1-chloretil)ciklopentanas', '(1-chloroethyl)cyclopentane') }, { smi: 'CCC1(Cl)CCCC1', name: t('1-chlor-1-etilciklopentanas', '1-chloro-1-ethylcyclopentane') }, { smi: 'CCC1CCCC1Cl', name: t('1-chlor-2-etilciklopentanas', '1-chloro-2-ethylcyclopentane') }, { smi: 'CCC1CCC(Cl)C1', name: t('1-chlor-3-etilciklopentanas', '1-chloro-3-ethylcyclopentane') }] }],
              [{ p: t('Brominant vyrauja produktas iš tretinio radikalo:', 'In bromination the product from the tertiary radical predominates:') },
                { mol: { smi: 'CCC1(Br)CCCC1', name: t('1-brom-1-etilciklopentanas', '1-bromo-1-ethylcyclopentane') } }]
            ]
          },
          claims: [{ react: ['sr.halogenate', ['CCC1CCCC1'], { X: 'Br' }, 'CCC1(Br)CCCC1'] }, { name: ['CCC1(Br)CCCC1', { lt: '1-brom-1-etilciklopentanas', en: '1-bromo-1-ethylcyclopentane' }] }]
        },
        { h: t('Chiralumas', 'Chirality') },
        {
          p: t('Alkilradikalas plokščias, todėl halogenas gali prisijungti iš abiejų pusių vienodai tikėtinai. Jei halogenuotas atomas gauna keturis skirtingus pakaitus, susidaro racematas (abiejų enantiomerų mišinys). Taip yra 2-chlorbutano ir 2-brombutano atveju, o 1-halogenbutanai chiralinio centro neturi.',
            'An alkyl radical is planar, so the halogen can bond from either side with equal probability. If the halogenated carbon ends up with four different groups, a racemate (a mixture of both enantiomers) forms. This is the case for 2-chlorobutane and 2-bromobutane, while the 1-halobutanes have no chiral centre.'),
          src: 'S4.1'
        },
        {
          mol: [{ smi: 'CC[C@H](C)Cl', caption: t('(S)-2-chlorbutanas', '(S)-2-chlorobutane') }, { smi: 'CC[C@@H](C)Cl', caption: t('(R)-2-chlorbutanas', '(R)-2-chlorobutane') }],
          claims: [{ cip: ['CC[C@H](C)Cl', 2, 'S'] }, { cip: ['CC[C@@H](C)Cl', 2, 'R'] }, { chiral: ['CC[C@H](C)Cl', true] }]
        },
        { h: t('Kada gaunamas vienas produktas', 'When one product is obtained') },
        {
          rule: t('Radikaliniu chlorinimu vienas monohalogenidas gaunamas tik tada, kai visi alkano vandeniliai ekvivalentiški. Brominant vienas pagrindinis produktas gaunamas ir tada, kai stabiliausią radikalą duoda tik viena ekvivalentinių vandenilių grupė (pvz., vienintelis tretinis atomas).',
            'Radical chlorination gives a single monohalide only when all the hydrogens of the alkane are equivalent. Bromination also gives one main product when only one group of equivalent hydrogens gives the most stable radical (for example, a single tertiary carbon).'),
          src: 'S4.11'
        },
        {
          mol: [
            { smi: 'C', name: t('metanas', 'methane') }, { smi: 'CC', opts: { condensed: true }, name: t('etanas', 'ethane') }, { smi: 'CC(C)(C)C', name: t('2,2-dimetilpropanas', '2,2-dimethylpropane') },
            { smi: 'C1CCCC1', name: t('ciklopentanas', 'cyclopentane') }, { smi: 'C1CCCCC1', name: t('cikloheksanas', 'cyclohexane') }
          ],
          caption: t('Kiekvienas duoda tik vieną monohalogenidą.', 'Each gives only one monohalide.')
        },
        {
          p: t('Pentanas duotų tris chlorpentanus: 1-, 2- ir 3-chlorpentaną. Tai sunkiai išskiriami izomerai, o 1-chlorpentano dalis nedidelė, todėl šis būdas jam gauti netinka. 2,2-dimetilpropanas, priešingai, duoda tik 1-chlor-2,2-dimetilpropaną.',
            'Pentane would give three chloropentanes: 1-, 2- and 3-chloropentane. They are hard to separate, and the share of 1-chloropentane is small, so this route is unsuitable for it. 2,2-Dimethylpropane, by contrast, gives only 1-chloro-2,2-dimethylpropane.'),
          src: 'S4.11'
        },
        {
          pitfall: t('Radikalinis halogeninimas netinka vienam konkrečiam izomerui iš alkano su skirtingais vandenilių tipais gauti. Pirminį halogenidą iš tokio alkano geriau gauti kitais būdais, kuriuos aptarsime vėliau.',
            'Radical halogenation is a poor way to make one specific isomer from an alkane with different kinds of hydrogen. A primary halide is better made by other routes, discussed later.')
        },
        { practice: 'u06.count' },
        { practice: 'u06.chlor' },
        { practice: 'u06.single' },
        { practice: 'u06.task' }
      ]
    },
    {
      id: 'oksid',
      title: t('Alkanų oksidacija ir antioksidantai', 'Oxidation of alkanes and antioxidants'),
      blocks: [
        {
          p: t('Oksiduojant alkanus, anglis pereina per vis aukštesnius oksidacijos laipsnius. Pirminis atomas (grupė $R-CH3$) virsta alkoholiu, aldehidu ir galiausiai karboksirūgštimi. Antrinis atomas (grupė $R-CH2-R$) virsta antriniu alkoholiu ir ketonu.',
            'When alkanes are oxidised, carbon passes through higher and higher oxidation states. A primary carbon (an $R-CH3$ group) becomes an alcohol, an aldehyde and finally a carboxylic acid. A secondary carbon (an $R-CH2-R$ group) becomes a secondary alcohol and a ketone.'),
          src: 'L6 p18'
        },
        {
          scheme: { items: [{ smi: 'CC', opts: { condensed: true } }, { arrow: '→', above: f('[O]') }, { smi: 'CCO' }, { arrow: '→', above: f('[O]') }, { smi: 'CC=O' }, { arrow: '→', above: f('[O]') }, { smi: 'CC(=O)O' }] },
          caption: t('Pirminis atomas: alkanas → alkoholis → aldehidas → rūgštis.', 'Primary carbon: alkane → alcohol → aldehyde → acid.'),
          src: 'L6 p18'
        },
        {
          scheme: { items: [{ smi: 'CCC' }, { arrow: '→', above: f('[O]') }, { smi: 'CC(C)O' }, { arrow: '→', above: f('[O]') }, { smi: 'CC(C)=O' }] },
          caption: t('Antrinis atomas: alkanas → antrinis alkoholis → ketonas.', 'Secondary carbon: alkane → secondary alcohol → ketone.'),
          src: 'L6 p18'
        },
        { h: t('Degimas', 'Combustion') },
        {
          p: t('Degimas – tai alkano suoksidavimas iki $CO2$ ir $H2O$, kai išsiskiria šilumos kiekis $Q$. Trūkstant deguonies, gali susidaryti $CO$.',
            'Combustion is the oxidation of an alkane all the way to $CO2$ and $H2O$, with the release of heat $Q$. With too little oxygen, $CO$ can form.'),
          src: 'L6 p18'
        },
        {
          table: {
            head: [t('Sąlygos', 'Conditions'), t('Lygtis', 'Equation'), t('Santykis $CH4 : O2$', 'Ratio $CH4 : O2$')],
            rows: [
              [t('pakanka $O2$', 'enough $O2$'), fm('CH4 + 2 O2 → CO2 + 2 H2O'), f('1 : 2')],
              [t('trūksta $O2$', 'too little $O2$'), fm('2 CH4 + 3 O2 → 2 CO + 4 H2O'), f('2 : 3')]
            ]
          },
          src: 'L6 p18'
        },
        { h: t('Autooksidacija: SR reakcija su $O2$', 'Autoxidation: an SR reaction with $O2$') },
        {
          p: t('Deguonies molekulė yra biradikalas •O–O•. Kai alkanas kaitinamas su oru (150–200 °C, 30–90 atm), deguonis atplėšia vandenilį: susidaro alkilradikalas, kuris su $•OOH$ duoda hidroperoksidą. Šis skyla, nutrūkstant $C-C$ ryšiui, ir susidaro alkoholis bei aldehidas, kurie toliau oksiduojami į rūgštį. Taip iš butano pramonėje gaunama etano rūgštis (acto rūgštis).',
            'The oxygen molecule is a biradical •O–O•. When an alkane is heated with air (150–200 °C, 30–90 atm), oxygen removes a hydrogen: an alkyl radical forms and combines with $•OOH$ to give a hydroperoxide. It cleaves with breaking of a $C-C$ bond into an alcohol and an aldehyde, which are oxidised further to the acid. This is how ethanoic (acetic) acid is made from butane.'),
          src: 'L6 p19'
        },
        {
          scheme: {
            items: [{ smi: 'CCCC' }, { arrow: '→', above: f('O2') }, { smi: 'CC[CH]C' }, { arrow: '→', above: f('•OOH') }, { smi: 'CCC(C)OO', name: t('hidroperoksidas', 'hydroperoxide') }]
          },
          src: 'L6 p19'
        },
        {
          scheme: {
            items: [{ smi: 'CCC(C)OO' }, { arrow: '→', above: f('t°') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }, { plus: true }, { smi: 'CC=O', name: t('acetaldehidas', 'acetaldehyde') },
              { arrow: '→', above: f('O2') }, { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid'), caption: t('2 molekulės', '2 molecules') }]
          },
          src: 'L6 p19'
        },
        { h: t('Antioksidantai', 'Antioxidants') },
        {
          p: t('Nesočiųjų riebalų rūgščių liekanos oksiduojasi lengviau, nes alilo padėties $C-H$ ryšys duoda stabilų alilradikalą. Antioksidantai (vitaminas C, vitaminas E, sintetiniai BHA ir BHT) nutraukia šią grandinę: fenolio (vitamino C – enolio) $O-H$ atiduoda vandenilį radikalui, o susidaręs fenoksilo radikalas stabilus (delokalizuotas žiede), todėl grandinė nebesitęsia.',
            'Unsaturated fatty acid residues oxidise more readily because an allylic $C-H$ bond gives a stable allyl radical. Antioxidants (vitamin C, vitamin E, the synthetic BHA and BHT) interrupt this chain: the phenolic (in vitamin C, enolic) $O-H$ gives its hydrogen to a radical, and the phenoxyl radical formed is stable (delocalised in the ring), so the chain does not go on.'),
          src: 'L6 p20–21'
        },
        {
          scheme: { items: [{ smi: 'CCC=CCC' }, { arrow: '→', above: f('O2') }, { smi: 'CCC(OO)C=CC' }] },
          caption: t('Alilinė oksidacija: hidroperoksidas atsiranda alilo padėtyje, dvigubasis ryšys pasislenka.', 'Allylic oxidation: the hydroperoxide appears in the allylic position and the double bond shifts.'),
          src: 'L6 p20'
        },
        {
          scheme: {
            items: [{ smi: 'Cc1cc(C(C)(C)C)c(O)c(C(C)(C)C)c1' }, { plus: true }, { smi: '[CH3]' }, { arrow: '→' }, { smi: 'Cc1cc(C(C)(C)C)c([O])c(C(C)(C)C)c1' }, { plus: true }, { smi: 'C', opts: { condensed: true } }]
          },
          caption: t('Antioksidantas atiduoda vandenilį radikalui ($R•$ pavaizduotas $CH3•$).', 'The antioxidant gives a hydrogen to a radical ($R•$ is shown as $CH3•$).'),
          src: 'L6 p20'
        },
        {
          pitfall: t('Alkanų oksidacija oru nėra švelnus procesas: reikia aukštos temperatūros ir slėgio, o produktai – alkoholių, aldehidų ir rūgščių mišinys su nutrūkusiomis $C-C$ jungtimis. Kontroliuojamai oksidacijai į ketoną ar alkoholį šis būdas netinka, nes ji sunkiai valdoma.',
            'Oxidation of alkanes by air is not a gentle process: it needs high temperature and pressure, and the products are a mixture of alcohols, aldehydes and acids with broken $C-C$ bonds. This way a controlled oxidation to a ketone or an alcohol is hard to achieve.')
        },
        { practice: 'u06.ox' }
      ]
    }
  ];

  /* ---------- banks ---------- */
  const rx = (items) => ({ scheme: { items } });
  const CLR = { smi: '[Cl]' }, BRR = { smi: '[Br]' };
  const plus = { plus: true };
  const arr = { arrow: '→' };

  const CHAIN = [
    {
      id: 'u06.chain.1',
      q: [{ p: t('Metanas chloruojamas šviesoje. Žemiau pateiktos keturios elementariosios reakcijos, sumaišytos.', 'Methane is chlorinated in light. Four elementary steps are given below, in mixed order.') }],
      steps: [{
        prompt: t('Išdėstykite jas tokia tvarka, kokia vyksta grandininė reakcija: nuo pradžios iki nutrūkimo.', 'Put them in the order in which the chain reaction runs, from start to termination.'),
        kind: 'order',
        options: [
          rx([{ smi: 'ClCl' }, { arrow: '→', above: f('hν') }, CLR, plus, CLR]),
          rx([CLR, plus, { smi: 'C', opts: { condensed: true } }, arr, { smi: 'Cl' }, plus, { smi: '[CH3]' }]),
          rx([{ smi: '[CH3]' }, plus, { smi: 'ClCl' }, arr, { smi: 'CCl', opts: { condensed: true } }, plus, CLR]),
          rx([{ smi: '[CH3]' }, plus, CLR, arr, { smi: 'CCl', opts: { condensed: true } }])
        ].map(s => ({ scheme: s.scheme })),
        hint: t('Pirmiausia turi atsirasti radikalų. Nutrūkimas eina paskutinis, nes jame radikalai sunaudojami.', 'Radicals must appear first. Termination comes last, because it uses radicals up.'),
        solution: t('Pirma iniciacija ($Cl2$ skyla šviesoje), po to dvi augimo reakcijos: chloro radikalas atplėšia vandenilį, o metilradikalas atplėšia chloro atomą. Paskutinė – nutrūkimas, kai du radikalai susijungia.',
          'First comes initiation ($Cl2$ splits in light), then the two propagation steps: a chlorine radical removes a hydrogen and the methyl radical takes a chlorine atom. Termination, where two radicals combine, comes last.')
      }],
      why: t('Reakcija prasideda nuo radikalų atsiradimo, tęsiasi dviem ciklą sudarančiomis augimo reakcijomis ir baigiasi, kai du radikalai susijungia.', 'The reaction starts when radicals appear, continues through the two steps of the propagation cycle and ends when two radicals combine.'),
      src: 'L6 p7'
    },
    {
      id: 'u06.chain.2',
      q: [{ p: t('Etanas reaguoja su bromu šviesoje.', 'Ethane reacts with bromine in light.') }, { scheme: { items: [{ smi: 'CC', opts: { condensed: true } }, { plus: true }, { smi: 'BrBr' }, { arrow: '→', above: f('hν') }] } }],
      steps: [{
        prompt: t('Pažymėkite abi grandinės augimo reakcijas.', 'Pick both propagation steps.'),
        kind: 'multi',
        options: [
          rx([BRR, plus, { smi: 'CC', opts: { condensed: true } }, arr, { smi: 'Br' }, plus, { smi: 'C[CH2]', opts: { condensed: true } }]),
          rx([{ smi: 'C[CH2]', opts: { condensed: true } }, plus, { smi: 'BrBr' }, arr, { smi: 'CCBr' }, plus, BRR]),
          rx([{ smi: 'BrBr' }, { arrow: '→', above: f('hν') }, BRR, plus, BRR]),
          rx([{ smi: 'C[CH2]', opts: { condensed: true } }, plus, BRR, arr, { smi: 'CCBr' }]),
          rx([{ smi: 'C[CH2]', opts: { condensed: true } }, plus, { smi: 'C[CH2]', opts: { condensed: true } }, arr, { smi: 'CCCC' }])
        ].map(s => ({ scheme: s.scheme })),
        answer: [0, 1],
        hint: t('Augimo reakcijoje radikalas sunaudojamas, bet kitas radikalas atsiranda: radikalų skaičius nesikeičia.', 'In a propagation step one radical is used up and another appears: the number of radicals stays the same.'),
        solution: t('Augimas: $Br•$ atplėšia vandenilį ir susidaro etilradikalas, o šis atplėšia bromo atomą ir atsinaujina $Br•$. Reakcija, kurioje $Br2$ skyla nuo šviesos, yra iniciacija, o radikalų jungimasis tarpusavyje ar su $Br•$ – nutrūkimas.', 'Propagation: $Br•$ removes a hydrogen and an ethyl radical forms, which takes a bromine atom and regenerates $Br•$. The step in which $Br2$ splits in light is initiation, and the steps in which radicals combine with each other or with $Br•$ are termination.')
      }],
      why: t('Augimo reakcijos sudaro ciklą: radikalas reaguoja su molekule ir sukuria naują radikalą, todėl grandinė gali tęstis.', 'The propagation steps form a cycle: a radical reacts with a molecule and makes a new radical, so the chain can go on.'),
      src: 'L6 p7'
    },
    {
      id: 'u06.chain.3',
      q: [{ p: t('Pakanka trumpo apšvietimo, kad reaguotų tūkstančiai $Cl2$ ir metano molekulių porų.', 'A short flash of light is enough for thousands of pairs of $Cl2$ and methane molecules to react.') }],
      steps: [{
        prompt: t('Kuo tai paaiškinama?', 'What explains this?'),
        kind: 'choice',
        options: [
          { text: t('Augimo stadijoje chloro radikalas atsinaujina, todėl viena iniciacija pradeda daug ciklų.', 'In propagation the chlorine radical is regenerated, so one initiation starts many cycles.') },
          { text: t('Šviesa tiesiogiai suardo kiekvieną $C-H$ ryšį metane.', 'Light breaks every $C-H$ bond of methane directly.') },
          { text: t('Kiekvienai susidariusio produkto molekulei reikia po vieną šviesos kvantą.', 'Every molecule of product needs one photon.') },
          { text: t('Šviesa poliarizuoja $C-H$ ryšį, todėl chlorido jonas jį atakuoja.', 'Light polarises the $C-H$ bond so a chloride ion attacks it.') }
        ],
        answer: 0,
        hint: t('Pažiūrėkite, kas atsitinka su chloro radikalu antroje augimo reakcijoje.', 'Look at what happens to the chlorine radical in the second propagation step.'),
        solution: t('Chloro radikalas sunaudojamas pirmoje augimo reakcijoje ir sukuriamas antroje, todėl veikia panašiai kaip katalizatorius. Šviesos reikia tik pradžiai.', 'The chlorine radical is used in the first propagation step and made again in the second, so it acts much like a catalyst. Light is needed only to start.')
      }],
      why: t('Grandininės reakcijos pranašumas: radikalas atsinaujina, todėl reaguoja daug molekulių vienam pradiniam radikalui.', 'The point of a chain reaction is that the radical is regenerated, so many molecules react per starting radical.'),
      src: 'L6 p7'
    },
    {
      id: 'u06.chain.4',
      q: [{ p: t('Tarp metano chlorinimo produktų aptikta nedaug etano.', 'A small amount of ethane is found among the products of methane chlorination.') }],
      steps: [{
        prompt: t('Kuri elementarioji reakcija paaiškina etano atsiradimą?', 'Which elementary step explains the ethane?'),
        kind: 'choice',
        options: [
          rx([{ smi: '[CH3]' }, plus, { smi: '[CH3]' }, arr, { smi: 'CC', opts: { condensed: true } }]),
          rx([{ smi: '[CH3]' }, plus, { smi: 'ClCl' }, arr, { smi: 'CCl', opts: { condensed: true } }, plus, CLR]),
          rx([CLR, plus, { smi: 'C', opts: { condensed: true } }, arr, { smi: 'Cl' }, plus, { smi: '[CH3]' }]),
          rx([CLR, plus, CLR, arr, { smi: 'ClCl' }])
        ].map(s => ({ scheme: s.scheme })),
        answer: 0,
        hint: t('Etanas turi du anglies atomus: reikia reakcijos, kurioje susijungia du anglies fragmentai.', 'Ethane has two carbons: you need a step in which two carbon fragments combine.'),
        solution: t('Du metilradikalai susijungia ir sudaro $C-C$ ryšį. Tokia reakcija palieka pėdsakus etano tarp produktų.', 'Two methyl radicals combine to form a $C-C$ bond. Such a step leaves traces of ethane among the products.')
      }, {
        prompt: t('Kuriai stadijai ji priklauso?', 'Which stage is this?'),
        kind: 'choice',
        options: [{ text: t('Iniciacija', 'Initiation') }, { text: t('Grandinės augimas', 'Propagation') }, { text: t('Grandinės nutrūkimas', 'Termination') }],
        answer: 2,
        hint: t('Ar radikalų po reakcijos lieka?', 'Is any radical left after the step?'),
        solution: t('Du radikalai virto viena molekule, radikalų nebelieka: tai nutrūkimas.', 'Two radicals became one molecule, none is left: this is termination.')
      }],
      why: t('Etano pėdsakai yra radikalinio mechanizmo įrodymas: jie atsiranda tik kai susijungia du metilradikalai.', 'Traces of ethane are evidence for the radical mechanism: they appear only when two methyl radicals combine.'),
      src: 'L6 p7'
    },
    {
      id: 'u06.chain.5',
      q: [{ p: t('Metano ir chloro mišinys tamsoje kambario temperatūroje nereaguoja.', 'A mixture of methane and chlorine does not react in the dark at room temperature.') }],
      steps: [{
        prompt: t('Kodėl?', 'Why not?'),
        kind: 'choice',
        options: [
          { text: t('Nesusidaro chloro radikalų, todėl negali prasidėti grandinė.', 'No chlorine radicals form, so the chain cannot start.') },
          { text: t('Metanas neturi $C-H$ ryšių, kuriuos būtų galima suardyti.', 'Methane has no $C-H$ bonds that could be broken.') },
          { text: t('Reakcijai būtinas Lewiso rūgšties katalizatorius, pvz. $AlCl3$.', 'The reaction needs a Lewis acid catalyst such as $AlCl3$.') },
          { text: t('Chloras tamsoje virsta chlorido jonais.', 'In the dark chlorine turns into chloride ions.') }
        ],
        answer: 0,
        hint: t('Kas yra grandinės pradžia ir kam jos reikia?', 'What starts the chain, and what does it need?'),
        solution: t('Be šviesos ar šilumos $Cl-Cl$ ryšys nesuyra homolizės būdu, radikalų nėra ir augimo stadijos neprasideda.', 'Without light or heat the $Cl-Cl$ bond is not cleaved homolytically, there are no radicals, and propagation cannot start.')
      }, {
        prompt: t('Kurie būdai gali sukelti radikalų susidarymą?', 'Which methods can generate radicals?'),
        kind: 'multi',
        options: [
          { text: t('stiprus kaitinimas (termolizė, virš 500 °C)', 'strong heating (thermolysis, above 500 °C)') },
          { text: t('UV spinduliuotė (fotolizė)', 'UV radiation (photolysis)') },
          { text: t('oksidacijos ir redukcijos procesai', 'oxidation–reduction processes') },
          { text: t('pridėta Lewiso rūgšties katalizatoriaus', 'adding a Lewis acid catalyst') },
          { text: t('pridėtas nukleofilas, pvz. $OH-$', 'adding a nucleophile such as $OH-$') }
        ],
        answer: [0, 1, 2],
        hint: t('Radikalą sukuria homolizė, kuriai reikia energijos arba elektronų pernašos.', 'A radical comes from homolysis, which needs energy or electron transfer.'),
        solution: t('Radikalai susidaro termolizės, fotolizės ir redokso procesų metu. Lewiso rūgštis ir nukleofilas sukelia heterolizę, o ne homolizę.', 'Radicals form in thermolysis, photolysis and redox processes. A Lewis acid and a nucleophile cause heterolysis, not homolysis.')
      }],
      why: t('Radikalinė grandinė pradedama tik tada, kai tiekiama energija ar vyksta redokso procesas, nes ryšį reikia suardyti homolizės būdu.', 'A radical chain starts only when energy is supplied or a redox process runs, because the bond has to be cleaved homolytically.'),
      src: 'L6 p6'
    },
    {
      id: 'u06.chain.6',
      q: [{ p: t('Chloro pertekliumi chloruojamas metanas. Chloro radikalas atakuoja jau susidariusį chlormetaną.', 'Methane is chlorinated with an excess of chlorine. A chlorine radical now attacks the chloromethane that has formed.') }, { scheme: { items: [CLR, { plus: true }, { smi: 'CCl', opts: { condensed: true } }, { arrow: '→' }] } }],
      steps: [{
        prompt: t('Kuri augimo reakcija yra teisinga?', 'Which propagation step is correct?'),
        kind: 'choice',
        options: [
          rx([CLR, plus, { smi: 'CCl', opts: { condensed: true } }, arr, { smi: 'Cl' }, plus, { smi: '[CH2]Cl' }]),
          rx([CLR, plus, { smi: 'CCl', opts: { condensed: true } }, arr, { smi: 'ClCl' }, plus, { smi: '[CH3]' }]),
          rx([CLR, plus, { smi: 'CCl', opts: { condensed: true } }, arr, { smi: 'ClCCl', opts: { condensed: true } }, plus, { smi: '[H]' }])
        ].map(s => ({ scheme: s.scheme })),
        answer: 0,
        hint: t('Palyginkite abu galimus kelius: kokia nauja jungtis susidarytų – $H-Cl$ ar $Cl-Cl$? Kuri iš jų tvirtesnė?', 'Compare the two possible paths: which new bond would form, $H-Cl$ or $Cl-Cl$? Which of them is stronger?'),
        solution: t('Ir šiuo atveju atplėšiamas vandenilis: susidaro $HCl$ ir $•CH2Cl$, kuris su $Cl2$ duoda dichlormetaną. Vandenilis atplėšiamas, nes susidaro tvirtas $H-Cl$ ryšys; $Cl-Cl$ ryšys silpnas, todėl chloro atomo atplėšimas nenaudingas.', 'Here again a hydrogen is removed: $HCl$ and $•CH2Cl$ form, and the radical gives dichloromethane with $Cl2$. The hydrogen is removed because a strong $H-Cl$ bond forms; the $Cl-Cl$ bond is weak, so removing a chlorine atom does not pay.')
      }, {
        prompt: t('Ką daryti, norint gauti daugiausia chlormetano?', 'What should be done to obtain mainly chloromethane?'),
        kind: 'choice',
        options: [
          { text: t('Imti didelį metano perteklių.', 'Use a large excess of methane.') },
          { text: t('Imti didelį chloro perteklių.', 'Use a large excess of chlorine.') },
          { text: t('Padidinti temperatūrą iki virš 500 °C.', 'Raise the temperature above 500 °C.') },
          { text: t('Pridėti daugiau šviesos.', 'Add more light.') }
        ],
        answer: 0,
        hint: t('Kam chloro radikalas dažniau susidurs: metano ar jau chlorinto metano molekulėms?', 'Which will a chlorine radical meet more often: methane or already chlorinated methane?'),
        solution: t('Esant metano pertekliui chloro radikalas dažniausiai susiduria su metanu, todėl chlormetanas toliau nechloruojamas.', 'With excess methane a chlorine radical mostly meets methane, so chloromethane is not chlorinated further.')
      }],
      why: t('Halogeninimas tęsiasi, kol yra C–H ryšių: chlormetanas turi tokių pat, kaip metanas. Polichlorintų produktų kiekį lemia reagentų santykis.', 'Halogenation goes on as long as C–H bonds remain: chloromethane has them just like methane. The ratio of reagents sets the amount of polychlorinated products.'),
      src: 'L6 p8'
    },
    {
      id: 'u06.chain.7',
      q: [{ p: t('Žemiau parodytos trys viengalės strėlės, vaizduojančios elementariąją reakciją $CH3• + Cl2 → CH3Cl + Cl•$.', 'Three half-headed arrows are drawn for the step $CH3• + Cl2 → CH3Cl + Cl•$.') },
        { mech: [{ scheme: { items: [{ smi: '[CH3]' }, { plus: true }, { smi: 'ClCl' }, { arrow: '→' }, { smi: 'CCl', opts: { condensed: true } }, { plus: true }, { smi: '[Cl]' }] }, arrows: [{ from: { m: 0, a: 0 }, to: { m: 1, a: 0 }, half: true }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 0 }, half: true }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 }, half: true }] }] }],
      steps: [{
        prompt: t('Ką rodo šios viengalės strėlės?', 'What do these half-headed arrows show?'),
        kind: 'choice',
        options: [
          { text: t('Kiekviena judina po vieną elektroną: metilradikalo elektronas ir vienas $Cl-Cl$ elektronas sudaro naują $C-Cl$ ryšį, o kitas $Cl-Cl$ elektronas lieka išeinančiam chloro atomui.', 'Each moves one electron: the electron of the methyl radical and one $Cl-Cl$ electron form the new $C-Cl$ bond, and the other $Cl-Cl$ electron stays on the departing chlorine atom.') },
          { text: t('Kiekviena judina elektronų porą: metilo anglis jungiasi su chloru savo laisva elektronų pora.', 'Each moves an electron pair: the methyl carbon bonds to chlorine with a lone pair.') },
          { text: t('Viena strėlė rodo elektronų porą, kita – vieną elektroną.', 'One arrow shows an electron pair, the other a single electron.') },
          { text: t('Strėlės rodo, kad $Cl2$ yra nukleofilas, o metilradikalas – elektrofilas.', 'The arrows show that $Cl2$ is the nucleophile and the methyl radical the electrophile.') }
        ],
        answer: 0,
        hint: t('Viengalė strėlė – vienas elektronas.', 'A half-headed arrow is one electron.'),
        solution: t('Visos trys strėlės viengalės: radikalinėje reakcijoje judinami pavieniai elektronai, ne poros. Elektronai suporuojami naujame $C-Cl$ ryšyje, o antras $Cl-Cl$ elektronas lieka naujajam chloro radikalui.', 'All three arrows are half-headed: a radical reaction moves single electrons, not pairs. The electrons pair up in the new $C-Cl$ bond, and the second $Cl-Cl$ electron stays on the new chlorine radical.')
      }],
      why: t('Radikalų reakcijas vaizduojame viengalėmis strėlėmis, nes ryšys sudaromas ar nutraukiamas vienu elektronu iš kiekvienos pusės.', 'Radical reactions are drawn with half-headed arrows, because a bond is made or broken with one electron from each side.'),
      src: 'L6 p7'
    },
    {
      id: 'u06.chain.8',
      q: [{ p: t('Sudėkite abi augimo reakcijas metano chlorinimui ir sutrumpinkite tai, kas atsinaujina.', 'Add the two propagation steps of methane chlorination and cancel whatever is regenerated.') },
        { scheme: { items: [CLR, { plus: true }, { smi: 'C', opts: { condensed: true } }, { arrow: '→' }, { smi: 'Cl' }, { plus: true }, { smi: '[CH3]' }] } },
        { scheme: { items: [{ smi: '[CH3]' }, { plus: true }, { smi: 'ClCl' }, { arrow: '→' }, { smi: 'CCl', opts: { condensed: true } }, { plus: true }, CLR] } }],
      steps: [{
        prompt: t('Kokia yra bendroji lygtis?', 'What is the overall equation?'),
        kind: 'choice',
        options: [
          rx([{ smi: 'C', opts: { condensed: true } }, plus, { smi: 'ClCl' }, arr, { smi: 'CCl', opts: { condensed: true } }, plus, { smi: 'Cl' }]),
          rx([{ smi: 'C', opts: { condensed: true } }, plus, { smi: 'ClCl' }, arr, { smi: 'ClCCl', opts: { condensed: true } }, plus, { smi: '[HH]' }]),
          rx([{ smi: 'C', opts: { condensed: true } }, plus, { smi: 'ClCl' }, arr, { smi: '[CH3]' }, plus, { smi: 'Cl' }, plus, CLR])
        ].map(s => ({ scheme: s.scheme })),
        answer: 0,
        hint: t('Chloro radikalas ir metilradikalas kartu atsiranda ir sunaudojami: jie išbraukiami.', 'The chlorine and methyl radicals appear and are used up: they cancel.'),
        solution: t('Radikalai $Cl•$ ir $CH3•$ išbraukiami, lieka $CH4 + Cl2 → CH3Cl + HCl$.', 'The radicals $Cl•$ and $CH3•$ cancel, leaving $CH4 + Cl2 → CH3Cl + HCl$.')
      }],
      why: t('Tarpinės dalelės (radikalai) bendroje lygtyje nerašomos: jos susidaro ir sunaudojamos.', 'Intermediates (the radicals) do not appear in the overall equation: they form and are consumed.'),
      src: 'L6 p7'
    },
    {
      id: 'u06.chain.9',
      q: [{ p: t('Etanas chloruojamas šviesoje. Be pagrindinio produkto, susidaro ir pėdsakų kitų junginių.', 'Ethane is chlorinated in light. Besides the main product, traces of other compounds form.') }],
      steps: [{
        prompt: t('Kurie iš šių junginių susidaro grandinės nutrūkimo reakcijose?', 'Which of these compounds form in termination steps?'),
        kind: 'multi',
        options: [{ mol: { smi: 'CCCl' } }, { mol: { smi: 'CCCC' } }, { mol: { smi: 'ClCl' } }, { mol: { smi: 'Cl' } }],
        answer: [0, 1, 2],
        hint: t('Kokie radikalai yra reakcijos mišinyje ir ką gauname, kai susijungia du iš jų?', 'Which radicals are present, and what forms when two of them combine?'),
        solution: t('Butanas (du etilai), chloretanas (etilas su chloru) ir $Cl2$ (du chloro radikalai) susidaro nutrūkimo metu. $HCl$ gaunamas augimo reakcijoje, kai chloro radikalas atplėšia vandenilį.', 'Butane (two ethyls), chloroethane (ethyl with chlorine) and $Cl2$ (two chlorine radicals) form in termination. $HCl$ forms in propagation, when a chlorine radical removes a hydrogen.')
      }],
      why: t('Nutrūkimo produktai kyla iš dviejų radikalų susijungimo, todėl tarp jų yra ir naujų $C-C$ ryšių, ir atsinaujinusio reagento.', 'Termination products come from two radicals combining, so they include new $C-C$ bonds and regenerated reagent.'),
      src: 'L6 p7'
    }
  ];

  const OX = [
    {
      id: 'u06.ox.1',
      q: [{ p: t('Etanas oksiduojamas laipsniškai, pirmiausia metilo grupės anglis.', 'Ethane is oxidised step by step, starting with a methyl carbon.') }],
      steps: [{
        prompt: t('Išdėstykite junginius oksidacijos tvarka: nuo etano iki galutinio produkto.', 'Put the compounds in the order of oxidation, from ethane to the final product.'),
        kind: 'order',
        options: [{ mol: { smi: 'CC', opts: { condensed: true } } }, { mol: { smi: 'CCO' } }, { mol: { smi: 'CC=O' } }, { mol: { smi: 'CC(=O)O' } }],
        hint: t('Kiekvienoje stadijoje anglis jungiasi su vis daugiau deguonies.', 'At every stage the carbon is bonded to more oxygen.'),
        solution: t('Alkanas → alkoholis → aldehidas → karboksirūgštis. Aldehidas oksiduojamas dar lengviau nei alkoholis, todėl procesas sustoja tik ties rūgštimi.', 'Alkane → alcohol → aldehyde → carboxylic acid. An aldehyde is oxidised even more readily than the alcohol, so the process stops only at the acid.')
      }],
      why: t('Pirminės anglies oksidacija vyksta per alkoholį ir aldehidą iki rūgšties, o antrinės – per alkoholį iki ketono.', 'A primary carbon is oxidised through the alcohol and the aldehyde to the acid, a secondary one through the alcohol to the ketone.'),
      src: 'L6 p18'
    },
    {
      id: 'u06.ox.2',
      q: [{ p: t('Pentanas oksiduojamas laipsniškai iki ketono.', 'Pentane is oxidised step by step to a ketone.') },
        { mol: { smi: 'CCCCC', name: t('pentanas', 'pentane') } }],
      steps: [{
        prompt: t('Kurie ketonai gali susidaryti oksiduojant pentano $CH2$ grupes?', 'Which ketones can form when the $CH2$ groups of pentane are oxidised?'),
        kind: 'multi',
        options: [{ mol: { smi: 'CCC(=O)CC', name: t('3-pentanonas', 'pentan-3-one') } }, { mol: { smi: 'CCCC(C)=O', name: t('2-pentanonas', 'pentan-2-one') } }, { mol: { smi: 'CCCCC=O', name: t('pentanalis', 'pentanal') } }, { mol: { smi: 'CCC(C)C=O', name: t('2-metilbutanalis', '2-methylbutanal') } }],
        answer: [0, 1],
        hint: t('Ketonas atsiranda iš antrinio anglies atomo, aldehidas – tik iš grandinės galo.', 'A ketone comes from a secondary carbon; an aldehyde only from the end of a chain.'),
        solution: t('Abu antrinių $CH2$ grupių tipai (pentano 2 ir 3 padėtyse) gali virsti ketonu: gaunamas pentan-2-onas ir pentan-3-onas. Pentanalis reikalautų oksiduoti grandinės galą, o 2-metilbutanalis – kitos anglies grandinės.', 'Both kinds of secondary $CH2$ group (in positions 2 and 3 of pentane) can become a ketone: pentan-2-one and pentan-3-one form. Pentanal would need the chain end to be oxidised, and 2-methylbutanal a different carbon skeleton.')
      }],
      why: t('Antrinės anglies oksidacija sustoja ties ketonu, nes toliau oksiduoti reikėtų suardyti $C-C$ ryšį.', 'Oxidation of a secondary carbon stops at the ketone, because going further would require breaking a $C-C$ bond.'),
      src: 'L6 p18',
      claims: [{ formula: ['CCC(=O)CC', 'C5H10O'] }, { formula: ['CCCC(C)=O', 'C5H10O'] }]
    },
    {
      id: 'u06.ox.3',
      q: [{ p: t('Etanas deginamas. Pilnos oksidacijos lygtis: $2 C2H6 + ? O2 → 4 CO2 + 6 H2O$.', 'Ethane is burned. The equation of complete oxidation: $2 C2H6 + ? O2 → 4 CO2 + 6 H2O$.') }],
      steps: [{
        prompt: t('Kiek $O2$ molekulių reikia dviem etano molekulėms visiškai sudeginti?', 'How many $O2$ molecules are needed to burn two ethane molecules completely?'),
        kind: 'number', answer: { value: 7, tol: 0 },
        hint: t('Suskaičiuokite deguonies atomus dešinėje: $CO2$ ir $H2O$.', 'Count the oxygen atoms on the right: in $CO2$ and $H2O$.'),
        solution: t('Dešinėje yra $4 × 2 + 6 = 14$ deguonies atomų, todėl reikia $7$ $O2$ molekulių.', 'On the right there are $4 × 2 + 6 = 14$ oxygen atoms, so $7$ $O2$ molecules are needed.')
      }, {
        prompt: t('Kiek $O2$ molekulių reikėtų, jei dvi etano molekulės virstų $CO$ ($2 C2H6 + ? O2 → 4 CO + 6 H2O$)?', 'How many $O2$ would be needed if two ethane molecules became $CO$ ($2 C2H6 + ? O2 → 4 CO + 6 H2O$)?'),
        kind: 'number', answer: { value: 5, tol: 0 },
        hint: t('Vėl suskaičiuokite deguonies atomus dešinėje.', 'Count the oxygen atoms on the right again.'),
        solution: t('Dešinėje yra $4 + 6 = 10$ deguonies atomų, todėl reikia $5$ $O2$ molekulių.', 'On the right there are $4 + 6 = 10$ oxygen atoms, so $5$ $O2$ molecules are needed.')
      }],
      why: t('Visiškai sudegus susidaro $CO2$, o trūkstant deguonies – $CO$, todėl reikia mažiau deguonies. Abu atvejai – oksidacija, tik skirtingo laipsnio.', 'Complete combustion gives $CO2$, and with too little oxygen $CO$ forms, which needs less oxygen. Both are oxidation, to different degrees.'),
      src: 'L6 p18'
    },
    {
      id: 'u06.ox.4',
      q: [{ p: t('Metano degimo trūkstant deguonies lygtys.', 'Equations for burning methane with too little oxygen.') }],
      steps: [{
        prompt: t('Kuri lygtis rodo nepilną metano oksidaciją iki $CO$?', 'Which equation shows incomplete oxidation of methane to $CO$?'),
        kind: 'choice',
        options: [
          { text: fm('2 CH4 + 3 O2 → 2 CO + 4 H2O') },
          { text: fm('CH4 + 2 O2 → CO2 + 2 H2O') },
          { text: fm('CH4 + O2 → CO + H2 + H2O') }
        ],
        answer: 0,
        hint: t('Anglis turi virsti $CO$, o visas vandenilis – vandeniu.', 'Carbon must become $CO$ and all hydrogen must become water.'),
        solution: t('Lygtis su $2 CH4 + 3 O2$ subalansuota ir vandenilis tampa vandeniu, santykis $CH4 : O2 = 2 : 3$. Lygtis su $CO2$ – visiškas degimas, lygtis su $H2$ vandenilį palieka laisvą, o kurso lygtyse vandenilis virsta vandeniu.', 'The equation with $2 CH4 + 3 O2$ is balanced, with all hydrogen going to water, and the ratio $CH4 : O2$ is $2 : 3$. The one giving $CO2$ is complete combustion, the one giving $H2$ leaves free hydrogen, while in the course equations hydrogen goes to water.')
      }],
      why: t('Nepilnoje oksidacijoje deguonies mažiau: $2 : 3$ vietoj $1 : 2$, o anglis virsta $CO$.', 'In incomplete oxidation there is less oxygen: $2 : 3$ instead of $1 : 2$, and carbon becomes $CO$.'),
      src: 'L6 p18'
    },
    {
      id: 'u06.ox.5',
      q: [{ p: t('Butanas oksiduojamas oro deguonimi aukštoje temperatūroje. Pirmiausia deguonis atplėšia vandenilį.', 'Butane is oxidised by the oxygen of air at high temperature. First oxygen removes a hydrogen.') },
        { mol: { smi: 'CCCC', name: t('butanas', 'butane'), opts: { numbers: 'all' } } }],
      steps: [{
        prompt: t('Kuris hidroperoksidas susidaro daugiausia?', 'Which hydroperoxide forms mainly?'),
        kind: 'choice',
        options: [{ mol: { smi: 'CCC(C)OO' } }, { mol: { smi: 'CCCCOO' } }],
        answer: 0,
        hint: t('Kuris radikalas susidaro greičiau: pirminis ar antrinis?', 'Which radical forms faster: the primary or the secondary one?'),
        solution: t('Greičiau susidaro antrinis radikalas, todėl $OOH$ jungiasi prie antrinio atomo: butan-2-ilo hidroperoksidas.', 'The secondary radical forms faster, so $OOH$ ends up on the secondary carbon: the butan-2-yl hydroperoxide.')
      }, {
        prompt: t('Šildomas hidroperoksidas skyla. Kokie du produktai susidaro?', 'The hydroperoxide cleaves on heating. Which two products form?'),
        kind: 'choice',
        options: [
          rx([{ smi: 'CCO' }, plus, { smi: 'CC=O' }]),
          rx([{ smi: 'CO' }, plus, { smi: 'CCC=O' }]),
          rx([{ smi: 'CCCO' }, plus, { smi: 'C=O' }])
        ].map(s => ({ scheme: s.scheme })),
        answer: 0,
        hint: t('$C-C$ ryšys nutrūksta prie atomo su $OOH$ grupe, o abu fragmentai gauna deguonies.', 'The $C-C$ bond breaks at the carbon carrying $OOH$, and both fragments pick up oxygen.'),
        solution: t('Nutrūksta ryšys tarp atomų Nr. 2 ir 3: susidaro etanolis ir acetaldehidas. Abu toliau oksiduojami iki etano (acto) rūgšties.', 'The bond between carbons no. 2 and no. 3 breaks, giving ethanol and acetaldehyde. Both are oxidised further to ethanoic (acetic) acid.')
      }],
      why: t('Autooksidacija yra SR reakcija: radikalas gaunamas atplėšus vandenilį, o hidroperoksidas skyla į alkoholį ir aldehidą. Galutinis produktas – etano rūgštis.', 'Autoxidation is an SR reaction: a radical forms by hydrogen abstraction, and the hydroperoxide cleaves into an alcohol and an aldehyde. The final product is ethanoic acid.'),
      src: 'L6 p19',
      claims: [{ formula: ['CCC(C)OO', 'C4H10O2'] }]
    },
    {
      id: 'u06.ox.6',
      q: [{ p: t('Butanas pramonėje paverčiamas etano rūgštimi oksiduojant oru.', 'In industry butane is converted to ethanoic acid by oxidation with air.') }],
      steps: [{
        prompt: t('Kokios sąlygos reikalingos?', 'Which conditions are needed?'),
        kind: 'multi',
        options: [
          { text: t('oro deguonis ir 150–200 °C', 'air oxygen and 150–200 °C') },
          { text: t('padidintas slėgis (30–90 atm)', 'raised pressure (30–90 atm)') },
          { text: t('chloras ir UV šviesa', 'chlorine and UV light') },
          { text: t('kambario temperatūra ir atmosferos slėgis', 'room temperature and atmospheric pressure') }
        ],
        answer: [0, 1],
        hint: t('Alkano oksidacija oru yra radikalinė ir reikalauja griežtų sąlygų.', 'Oxidation of an alkane by air is a radical process and needs harsh conditions.'),
        solution: t('Reikia oro deguonies, 150–200 °C ir 30–90 atm slėgio. Chloras ir UV šviesa lemtų halogeninimą, o švelnios sąlygos – jokios reakcijos.', 'Air oxygen, 150–200 °C and 30–90 atm are needed. Chlorine and UV light would lead to halogenation, and mild conditions to no reaction.')
      }],
      why: t('$O2$ yra biradikalas, bet alkano $C-H$ ryšiai tvirti, todėl radikalinę grandinę pradėti reikia šilumos ir slėgio.', '$O2$ is a biradical, but the $C-H$ bonds of alkanes are strong, so heat and pressure are needed to start the radical chain.'),
      src: 'L6 p19'
    },
    {
      id: 'u06.ox.7',
      q: [{ p: t('Maisto riebalų oksidacijos metu radikalus sulaiko antioksidantas BHT.', 'During the oxidation of fats the antioxidant BHT traps radicals.') },
        { mol: { smi: 'Cc1cc(C(C)(C)C)c(O)c(C(C)(C)C)c1', opts: { numbers: 'all' } } }],
      steps: [{
        prompt: t('Bakstelėkite atomą, kuris atiduoda vandenilį radikalui.', 'Tap the atom that gives its hydrogen to a radical.'),
        kind: 'atoms', mol: { smi: 'Cc1cc(C(C)(C)C)c(O)c(C(C)(C)C)c1', opts: { numbers: 'all' } }, answer: [9],
        hint: t('Kurio atomo radikalą stabilizuotų žiedas?', 'Whose radical would the ring stabilise?'),
        solution: t('Vandenilį atiduoda fenolio deguonis (atomas Nr. 10), nes $O-H$ ryšys silpnas, o susidariusį radikalą stabilizuoja žiedas.', 'The phenolic oxygen (atom no. 10) gives the hydrogen, because the $O-H$ bond is weak and the ring stabilises the resulting radical.')
      }, {
        prompt: t('Kodėl šis junginys nutraukia oksidacijos grandinę?', 'Why does this compound stop the oxidation chain?'),
        kind: 'choice',
        options: [
          { text: t('Jis atiduoda vandenilį radikalui, o susidaręs fenoksilo radikalas per stabilus, kad tęstų grandinę.', 'It gives a hydrogen to a radical, and the phenoxyl radical formed is too stable to continue the chain.') },
          { text: t('Jis reaguoja su deguonimi greičiau už riebalų rūgštis ir pašalina $O2$.', 'It reacts with oxygen faster than the fatty acids and removes $O2$.') },
          { text: t('Jis suriša vandenį ir neleidžia riebalams hidrolizuotis.', 'It binds water and prevents the fats from hydrolysing.') },
          { text: t('Jis duoda daugiau radikalų, kurie sunaikina vienas kitą.', 'It makes more radicals, which destroy each other.') }
        ],
        answer: 0,
        hint: t('Pagalvokite apie tai, kas atsitinka su radikalu $R•$, kai paima vandenilį.', 'Think about what happens to the radical $R•$ when it takes a hydrogen.'),
        solution: t('$R• + ArOH → RH + ArO•$: aktyvų radikalą pakeičia mažai aktyvus fenoksilo radikalas, kurio elektronas delokalizuotas žiede, o dideli $tret$-butilai jį dar apsaugo.', '$R• + ArOH → RH + ArO•$: a reactive radical is replaced by an unreactive phenoxyl radical whose electron is delocalised in the ring and further shielded by the bulky tert-butyl groups.')
      }],
      why: t('Antioksidantas nutraukia grandinę, nes paverčia reaktingą radikalą stabiliu, kuris nebegali atplėšti vandenilio iš kitų molekulių.', 'An antioxidant breaks the chain because it turns a reactive radical into a stable one that can no longer remove hydrogen from other molecules.'),
      src: 'L6 p20–21',
      claims: [{ formula: ['Cc1cc(C(C)(C)C)c(O)c(C(C)(C)C)c1', 'C15H24O'] }]
    },
    {
      id: 'u06.ox.8',
      q: [{ p: t('Maisto priedų antioksidantai skirstomi į natūralius ir sintetinius.', 'Antioxidants used in food are divided into natural and synthetic ones.') }],
      steps: [{
        prompt: t('Sugrupuokite antioksidantus.', 'Group the antioxidants.'),
        kind: 'match',
        answer: {
          left: [{ text: t('vitaminas C (askorbo rūgštis)', 'vitamin C (ascorbic acid)') }, { text: t('vitaminas E (α-tokoferolis)', 'vitamin E (α-tocopherol)') }, { text: f('BHA') }, { text: f('BHT') }],
          right: [{ text: t('natūralus', 'natural') }, { text: t('sintetinis', 'synthetic') }],
          pairs: [0, 0, 1, 1]
        },
        hint: t('BHA ir BHT pavadinimų raidės rodo iš tolueno ir anizolo pagamintus junginius.', 'The letters of BHA and BHT stand for compounds made from anisole and toluene.'),
        solution: t('Vitaminai C ir E yra natūralūs, o BHA (butilhidroksianizolas) ir BHT (butilhidroksitoluenas) – sintetiniai.', 'Vitamins C and E are natural; BHA (butylated hydroxyanisole) and BHT (butylated hydroxytoluene) are synthetic.')
      }],
      why: t('Visų šių antioksidantų veikimas panašus: jie atiduoda vandenilį radikalui ir nutraukia oksidacijos grandinę.', 'All these antioxidants act in a similar way: they give a hydrogen to a radical and interrupt the oxidation chain.'),
      src: 'L6 p21'
    },
    {
      id: 'u06.ox.9',
      q: [{ p: t('Nesotiosios riebalų rūgštys oksiduojasi lengviau nei sotiosios. Pavaizduota rūgštis su viena $C=C$ jungtimi.', 'Unsaturated fatty acids oxidise more easily than saturated ones. An acid with one $C=C$ bond is shown.') },
        { mol: { smi: 'CCCCC=CCCCC(=O)O', opts: { numbers: 'all' } } }],
      steps: [{
        prompt: t('Bakstelėkite anglies atomus, kurių vandenilį radikalas atplėšia lengviausiai.', 'Tap the carbons whose hydrogen a radical removes most easily.'),
        kind: 'atoms', mol: { smi: 'CCCCC=CCCCC(=O)O', opts: { numbers: 'all' } }, answer: [3, 6],
        hint: t('Kuris radikalas būtų stabilesnis dėl konjugacijos su $C=C$ ryšiu?', 'Which radical would be more stable through conjugation with the $C=C$ bond?'),
        solution: t('Atomai Nr. 4 ir 7 yra šalia dvigubojo ryšio. Atplėšus vandenilį susidaro alilradikalas, kurio elektronas delokalizuotas.', 'Carbons no. 4 and 7 are next to the double bond. Removing a hydrogen there gives an allyl radical with a delocalised electron.')
      }],
      why: t('Alilo padėties $C-H$ ryšys silpnesnis, nes alilradikalas stabilus (konjugacija). Todėl nesotieji riebalai aplink dvigubąjį ryšį oksiduojasi greičiau.', 'An allylic $C-H$ bond is weaker, because the allyl radical is stable (conjugation). Unsaturated fats therefore oxidise faster next to the double bond.'),
      src: 'L6 p20'
    }
  ];

  const WHY = [
    {
      id: 'u06.why.1',
      q: [{ p: t('Alkanas nereaguoja su $NaOH$ tirpalu ar su $HBr$ kambario temperatūroje, bet dega ir halogeninasi šviesoje.', 'An alkane does not react with $NaOH$ solution or with $HBr$ at room temperature, yet it burns and halogenates in light.') }],
      steps: [{
        prompt: t('Kuo tai paaiškinama?', 'What explains this?'),
        kind: 'choice',
        options: [
          { text: t('Ryšiai $C-C$ ir $C-H$ beveik nepoliniai ir tvirti, todėl heterolizei nėra centro, bet radikalinės reakcijos įmanomos.', 'The $C-C$ and $C-H$ bonds are almost non-polar and strong, so there is no site for heterolysis, but radical reactions are possible.') },
          { text: t('Alkanai turi laisvų elektronų porų, kurios neleidžia reaguoti su rūgštimis.', 'Alkanes have lone pairs that prevent reaction with acids.') },
          { text: t('Alkanų anglies atomai sp² hibridizuoti, todėl jie nepoliniai.', 'The carbons of alkanes are sp² hybridised, so they are non-polar.') },
          { text: t('Alkanų $C-H$ ryšiai poliniai, todėl juos atakuoja tik radikalai.', 'The $C-H$ bonds of alkanes are polar, so only radicals attack them.') }
        ],
        answer: 0,
        hint: t('Ką atakuoja nukleofilas ar elektrofilas?', 'What does a nucleophile or electrophile attack?'),
        solution: t('Nukleofilui ar elektrofilui reikia poliaus (δ+ ar δ−) arba $π$ ryšio. Alkanuose jų nėra, o radikalas gali atplėšti net nepolinį vandenilį.', 'A nucleophile or electrophile needs a pole (δ+ or δ−) or a $π$ bond. Alkanes have neither, but a radical can remove even a non-polar hydrogen.')
      }],
      why: t('Alkanai sudaryti iš sp³ anglies ir nepolinių σ ryšių, todėl inertiški heterolizinėms reakcijoms ir reaguoja radikaliniu būdu.', 'Alkanes consist of sp³ carbons and non-polar σ bonds, so they are inert in heterolytic reactions and react by the radical route.'),
      src: 'L6 p5',
      claims: [{ hyb: ['CC', 0, 'sp3'] }]
    },
    {
      id: 'u06.why.2',
      q: [{ p: t('Chlorinant 2-metilpropaną gaunama 37 % tretinio ir 63 % pirminio chloralkano, nors tretinis radikalas stabilesnis.', 'Chlorinating 2-methylpropane gives 37 % of the tertiary and 63 % of the primary chloroalkane, although the tertiary radical is more stable.') },
        { mol: [{ smi: 'CC(C)C', name: t('2-metilpropanas', '2-methylpropane') }, { smi: 'CC(C)(C)Cl', name: t('2-chlor-2-metilpropanas', '2-chloro-2-methylpropane'), caption: f('37 %') }, { smi: 'CC(C)CCl', name: t('1-chlor-2-metilpropanas', '1-chloro-2-methylpropane'), caption: f('63 %') }] }],
      steps: [{
        prompt: t('Kodėl pirminio produkto daugiau?', 'Why is there more of the primary product?'),
        kind: 'choice',
        options: [
          { text: t('Yra devyni pirminiai vandeniliai ir tik vienas tretinis, o chloras mažai selektyvus.', 'There are nine primary hydrogens and only one tertiary hydrogen, and chlorine is hardly selective.') },
          { text: t('Pirminis radikalas stabilesnis už tretinį.', 'The primary radical is more stable than the tertiary one.') },
          { text: t('Tretinis vandenilis chloro radikalui nepasiekiamas dėl erdvinių trukdžių.', 'The tertiary hydrogen is inaccessible to the chlorine radical for steric reasons.') },
          { text: t('Chloras reaguoja tik su $CH3$ grupėmis.', 'Chlorine reacts only with $CH3$ groups.') }
        ],
        answer: 0,
        hint: t('Palyginkite, kiek vandenilių duoda kiekvieną produktą.', 'Compare how many hydrogens give each product.'),
        solution: t('Produkto kiekis priklauso nuo vandenilių skaičiaus ir nuo to, kaip greitai jie pakeičiami. Chloro atveju greičių skirtumas nedidelis, todėl nulemia vandenilių skaičius (9 prieš 1).', 'The amount of a product depends on the number of hydrogens and on how fast they are replaced. For chlorine the difference in rate is small, so the number of hydrogens (9 against 1) decides.')
      }, {
        prompt: t('Kiek kartų greičiau chloruojamas vienas tretinis vandenilis nei vienas pirminis? Apskaičiuokite iš procentų (vienas skaitmuo po kablelio).', 'How many times faster is one tertiary hydrogen chlorinated than one primary hydrogen? Work it out from the percentages (one decimal).'),
        kind: 'number', answer: { value: 5.3, tol: 0.3 },
        hint: t('Padalykite kiekvieną procentą iš vandenilių skaičiaus ir palyginkite.', 'Divide each percentage by the number of hydrogens and compare.'),
        solution: t('Tretinis: 37 / 1 = 37. Pirminis: 63 / 9 = 7. Santykis 37 / 7 ≈ 5,3.', 'Tertiary: 37 / 1 = 37. Primary: 63 / 9 = 7. Ratio 37 / 7 ≈ 5.3.')
      }],
      why: t('Produktų santykis yra vandenilių skaičiaus ir jų reaktingumo sandauga. Chloras aktyvus ir mažai selektyvus, todėl vandenilių skaičius gali nugalėti stabilesnį radikalą.', 'The product ratio is the number of hydrogens times their reactivity. Chlorine is reactive and hardly selective, so the number of hydrogens can outweigh a more stable radical.'),
      src: 'L6 p14',
      claims: [{ react: ['sr.halogenate', ['CC(C)C'], { X: 'Cl' }, 'CC(C)(C)Cl'] }, { react: ['sr.halogenate', ['CC(C)C'], { X: 'Br' }, 'CC(C)(C)Br'] }]
    },
    {
      id: 'u06.why.3',
      q: [{ p: t('Butanas brominamas šviesoje. Pagrindinis produktas 2-brombutanas turi chiralinį centrą, tačiau gautas mišinys optiškai neaktyvus.', 'Butane is brominated in light. The main product 2-bromobutane has a chiral centre, yet the mixture obtained is optically inactive.') },
        { mol: { smi: 'CCC(C)Br', name: t('2-brombutanas', '2-bromobutane') } }],
      steps: [{
        prompt: t('Kokios formos yra tarpinis antrinis radikalas?', 'What shape does the intermediate secondary radical have?'),
        kind: 'choice',
        options: [
          { text: t('Plokščias, anglis sp² hibridizuota.', 'Planar, the carbon is sp² hybridised.') },
          { text: t('Piramidinis, anglis sp³ hibridizuota.', 'Pyramidal, the carbon is sp³ hybridised.') },
          { text: t('Tiesinis, anglis sp hibridizuota.', 'Linear, the carbon is sp hybridised.') }
        ],
        answer: 0,
        hint: t('Prisiminkite metilradikalo sandarą: kokioje orbitalėje yra nesuporuotas elektronas?', 'Recall the structure of the methyl radical: in which orbital is the unpaired electron?'),
        solution: t('Radikalo anglis turi tris σ ryšius vienoje plokštumoje, o nesuporuotas elektronas yra statmenoje $p$ orbitalėje.', 'The radical carbon has three σ bonds in one plane, and the unpaired electron sits in a perpendicular $p$ orbital.')
      }, {
        prompt: t('Kokį enantiomerų santykį duoda bromo prisijungimas prie šio radikalo?', 'What ratio of enantiomers results from bromine bonding to this radical?'),
        kind: 'choice',
        options: [{ text: t('1 : 1 (racematas)', '1 : 1 (racemate)') }, { text: t('Vyrauja $R$ enantiomeras', 'The $R$ enantiomer predominates') }, { text: t('Vyrauja $S$ enantiomeras', 'The $S$ enantiomer predominates') }, { text: t('Susidaro tik mezoforma', 'Only a meso form results') }],
        answer: 0,
        hint: t('Iš kurių pusių $Br2$ gali pulti plokščią radikalą?', 'From which sides can $Br2$ attack a planar radical?'),
        solution: t('Abi plokščio radikalo pusės vienodos, todėl susidaro abu enantiomerai po lygiai – racematas. Jis optiškai neaktyvus.', 'Both faces of the planar radical are alike, so both enantiomers form in equal amounts: a racemate, which is optically inactive.')
      }],
      why: t('Plokščias radikalas atakuojamas iš abiejų pusių vienodai, todėl, kai naujas chiralinis centras atsiranda, susidaro racematas.', 'A planar radical is attacked from both faces equally, so when a new chiral centre appears a racemate forms.'),
      src: 'S4.1; L6 p9'
    },
    {
      id: 'u06.why.4',
      q: [{ p: t('Pentanas chloruojamas ir brominamas šviesoje. Chlorinant susidaro trijų izomerų mišinys, o brominant daugiausia du.', 'Pentane is chlorinated and brominated in light. Chlorination gives a mixture of three isomers, bromination mainly two.') }],
      steps: [{
        prompt: t('Kuo skiriasi bromo ir chloro radikalai?', 'How do bromine and chlorine radicals differ?'),
        kind: 'choice',
        options: [
          { text: t('Chloro radikalas aktyvesnis ir mažiau selektyvus, bromo – mažiau aktyvus ir selektyvesnis.', 'The chlorine radical is more reactive and less selective; the bromine radical is less reactive and more selective.') },
          { text: t('Bromo radikalas aktyvesnis, todėl greičiau suranda tretinį vandenilį.', 'The bromine radical is more reactive, so it finds the tertiary hydrogen faster.') },
          { text: t('Chloro radikalas stabilesnis, todėl nepasirenka vandenilio.', 'The chlorine radical is more stable, so it does not choose a hydrogen.') },
          { text: t('Skirtumas atsiranda tik dėl skirtingos temperatūros.', 'The difference arises only because of different temperatures.') }
        ],
        answer: 0,
        hint: t('Halogenų aktyvumo eilė: $F2 > Cl2 > Br2 > I2$.', 'The reactivity order of the halogens: $F2 > Cl2 > Br2 > I2$.'),
        solution: t('Aktyvesnis radikalas atplėšia vandenilį „be pasirinkimo“, mažiau aktyvus pasirenka tą, kuris duoda stabiliausią radikalą.', 'A more reactive radical removes a hydrogen without choosing; a less reactive one picks the hydrogen that gives the most stable radical.')
      }],
      why: t('Reaktingumas ir selektyvumas skiriasi priešingai: kuo aktyvesnis halogeno radikalas, tuo mažiau jis selektyvus.', 'Reactivity and selectivity run opposite ways: the more reactive the halogen radical, the less selective it is.'),
      src: 'L6 p15'
    },
    {
      id: 'u06.why.5',
      q: [{ p: t('Pentanas radikaliniu chlorinimu duoda 1-, 2- ir 3-chlorpentano mišinį. 2,2-dimetilpropanas duoda vienintelį monochlorintą produktą.', 'Radical chlorination of pentane gives a mixture of 1-, 2- and 3-chloropentane. 2,2-Dimethylpropane gives a single monochloro product.') },
        { mol: [{ smi: 'CCCCC', name: t('pentanas', 'pentane') }, { smi: 'CC(C)(C)C', name: t('2,2-dimetilpropanas', '2,2-dimethylpropane') }] }],
      steps: [{
        prompt: t('Kodėl 2,2-dimetilpropanas duoda vieną produktą?', 'Why does 2,2-dimethylpropane give one product?'),
        kind: 'choice',
        options: [
          { text: t('Visi 12 vandenilių ekvivalentiški.', 'All 12 hydrogens are equivalent.') },
          { text: t('Jis turi tretinį anglies atomą, kurio radikalas stabiliausias.', 'It has a tertiary carbon whose radical is the most stable.') },
          { text: t('Jis turi tik pirminius vandenilius, o chloras reaguoja tik su jais.', 'It has only primary hydrogens, and chlorine reacts only with them.') },
          { text: t('Pentanas turi daugiau anglies atomų, todėl reaguoja greičiau.', 'Pentane has more carbons, so it reacts faster.') }
        ],
        answer: 0,
        hint: t('Suskaičiuokite ekvivalentinių vandenilių grupes kiekviename alkane.', 'Count the groups of equivalent hydrogens in each alkane.'),
        solution: t('2,2-Dimetilpropano visos keturios metilo grupės ekvivalentiškos, todėl vandenilių grupė viena. Pentano grupių yra trys.', 'In 2,2-dimethylpropane all four methyl groups are equivalent, so there is one group of hydrogens. Pentane has three groups.')
      }],
      why: t('Vienas produktas gaunamas tik tada, kai visi vandeniliai ekvivalentiški. Tada nesvarbu, kad chloras mažai selektyvus.', 'One product is obtained only when all hydrogens are equivalent. It then does not matter that chlorine is hardly selective.'),
      src: 'S4.11'
    },
    {
      id: 'u06.why.6',
      q: [{ p: t('Izopropilbenzenas (kumenas) brominamas šviesoje ir duoda beveik vien 2-brom-2-fenilpropaną.', 'Isopropylbenzene (cumene) is brominated in light and gives almost only 2-bromo-2-phenylpropane.') },
        { mol: { smi: 'CC(C)c1ccccc1', name: t('izopropilbenzenas', 'isopropylbenzene'), opts: { numbers: 'all' } } }],
      steps: [{
        prompt: t('Bakstelėkite anglies atomą, kurio vandenilį bromo radikalas atplėšia.', 'Tap the carbon whose hydrogen the bromine radical removes.'),
        kind: 'atoms', mol: { smi: 'CC(C)c1ccccc1', opts: { numbers: 'all' } }, answer: [1],
        hint: t('Kuris radikalas galėtų pasidalyti nesuporuotą elektroną su žiedu?', 'Which radical could share its unpaired electron with the ring?'),
        solution: t('Atomas Nr. 2 yra benzilo padėtyje ir turi vandenilį. Čia susidaro benziltipo tretinis radikalas.', 'Carbon no. 2 is in the benzylic position and carries a hydrogen. A tertiary radical of benzylic type forms there.')
      }, {
        prompt: t('Kodėl šis radikalas toks stabilus?', 'Why is this radical so stable?'),
        kind: 'choice',
        options: [
          { text: t('Jo elektronas delokalizuotas per benzeno žiedą (konjugacija) ir jis tretinis.', 'Its electron is delocalised over the benzene ring (conjugation) and it is tertiary.') },
          { text: t('Jis turi teigiamą krūvį, kurį stabilizuoja žiedas.', 'It has a positive charge that the ring stabilises.') },
          { text: t('Benzeno žiedas didina erdvinius trukdžius ir neleidžia reaguoti.', 'The benzene ring increases steric hindrance and prevents reaction.') },
          { text: t('Žiedas padaro $C-H$ ryšį stipresnį.', 'The ring makes the $C-H$ bond stronger.') }
        ],
        answer: 0,
        hint: t('Nupieškite rezonansines formules radikalo, esančio šalia žiedo.', 'Draw the resonance structures of a radical next to a ring.'),
        solution: t('Benziltipo radikalai yra stabiliausi (benzil- = alil-), o tretinis stabilesnis už antrinį ir pirminį.', 'Benzylic radicals are the most stable (benzyl = allyl), and a tertiary one is more stable than a secondary or primary one.')
      }],
      why: t('Konjugacija su žiedu stabilizuoja radikalą stipriau nei alkilgrupės, todėl benzilo padėties vandenilis keičiamas pirmas.', 'Conjugation with the ring stabilises a radical more than alkyl groups do, so the benzylic hydrogen is replaced first.'),
      src: 'L6 p16',
      claims: [{ react: ['sr.halogenate', ['CC(C)c1ccccc1'], { X: 'Br' }, 'CC(C)(c1ccccc1)Br'] }]
    },
    {
      id: 'u06.why.7',
      q: [{ p: t('Alkanas chloruojamas dviejose temperatūrose: 25 °C ir aukštesnėje.', 'An alkane is chlorinated at two temperatures: 25 °C and a higher one.') }],
      steps: [{
        prompt: t('Kaip kinta selektyvumas aukštesnėje temperatūroje?', 'How does the selectivity change at the higher temperature?'),
        kind: 'choice',
        options: [
          { text: t('Mažėja: pirminiai, antriniai ir tretiniai vandeniliai keičiami beveik vienodu greičiu.', 'It falls: primary, secondary and tertiary hydrogens are replaced at almost the same rate.') },
          { text: t('Didėja: vyrauja tretinis produktas.', 'It rises: the tertiary product predominates.') },
          { text: t('Nesikeičia, nes selektyvumą lemia tik halogeno rūšis.', 'It does not change, because only the halogen sets selectivity.') },
          { text: t('Chloras ima keisti tik pirminius vandenilius.', 'Chlorine starts to replace only primary hydrogens.') }
        ],
        answer: 0,
        hint: t('Kaip temperatūra keičia greitų ir lėtų reakcijų greičių santykį?', 'How does temperature change the ratio between the rates of fast and slow reactions?'),
        solution: t('Aukštoje temperatūroje chloro radikalas dar mažiau renkasi: gaunamas beveik statistinis visų galimų izomerų mišinys.', 'At high temperature the chlorine radical chooses even less: an almost statistical mixture of all possible isomers forms.')
      }],
      why: t('Aukštesnė temperatūra mažina skirtumus tarp greičių, todėl chlorinant selektyvumas dar sumažėja.', 'A higher temperature reduces the differences between rates, so the selectivity of chlorination falls further.'),
      src: 'L6 p12'
    },
    {
      id: 'u06.why.8',
      q: [{ p: t('Tret-butilradikalas ($CH3)3C•$ yra stabilesnis už etilradikalą $CH3CH2•$.', 'The tert-butyl radical $(CH3)3C•$ is more stable than the ethyl radical $CH3CH2•$.') }],
      steps: [{
        prompt: t('Kuris paaiškinimas teisingas?', 'Which explanation is correct?'),
        kind: 'choice',
        options: [
          { text: t('Hiperkonjugacija: tretinį radikalą stabilizuoja daugiau gretimų alkilgrupių ($C-H$ ryšių), be to, jis erdviškai užstotas.', 'Hyperconjugation: the tertiary radical is stabilised by more neighbouring alkyl groups ($C-H$ bonds), and it is sterically shielded.') },
          { text: t('Tretinis radikalas turi daugiau nesuporuotų elektronų.', 'The tertiary radical has more unpaired electrons.') },
          { text: t('Tretinis radikalas plokščias, o etilradikalas – piramidinis, todėl pirmasis stabilesnis.', 'The tertiary radical is planar and the ethyl radical pyramidal, so the first is more stable.') },
          { text: t('Tretinis radikalas gali sudaryti rezonansines formules su $π$ ryšiu.', 'The tertiary radical can form resonance structures with a $π$ bond.') }
        ],
        answer: 0,
        hint: t('Palyginkite, kiek alkilgrupių prijungta prie radikalo atomo.', 'Compare how many alkyl groups are attached to the radical carbon.'),
        solution: t('Nesuporuotas elektronas sąveikauja su gretimų $C-H$ ryšių orbitalėmis: tretinis radikalas turi tris tokias grupes, pirminis – vieną. Hiperkonjugacija kartu su erdviniais trukdžiais didina stabilumą.', 'The unpaired electron interacts with the orbitals of neighbouring $C-H$ bonds: a tertiary radical has three such groups, a primary one has one. Hyperconjugation together with steric hindrance raises the stability.')
      }],
      why: t('Alkilgrupių skaičius prie radikalo atomo lemia hiperkonjugaciją, todėl stabilumas didėja nuo metilo link tretinio.', 'The number of alkyl groups on the radical carbon sets hyperconjugation, so stability rises from methyl to tertiary.'),
      src: 'L6 p17'
    },
    {
      id: 'u06.why.9',
      q: [{ p: t('Halogenai su alkanais reaguoja skirtingu greičiu.', 'Halogens react with alkanes at different rates.') }],
      steps: [{
        prompt: t('Išdėstykite halogenus nuo aktyviausio iki mažiausiai aktyvaus.', 'Put the halogens in order from the most reactive to the least reactive.'),
        kind: 'order',
        options: [{ text: f('F2') }, { text: f('Cl2') }, { text: f('Br2') }, { text: f('I2') }],
        hint: t('Aktyvumas mažėja žemyn halogenų grupėje.', 'Reactivity falls down the halogen group.'),
        solution: t('$F2 > Cl2 > Br2 > I2$. Aktyvesnis halogenas mažiau selektyvus, todėl bromas tinkamesnis vienam produktui gauti.', '$F2 > Cl2 > Br2 > I2$. The more reactive halogen is less selective, so bromine is the better choice for one product.')
      }],
      why: t('Halogeno radikalo aktyvumas mažėja nuo fluoro iki jodo, o selektyvumas didėja.', 'The reactivity of the halogen radical falls from fluorine to iodine, while selectivity rises.'),
      src: 'L6 p10'
    }
  ];

  const BR = (s) => ({ mol: { smi: s } });
  const TASK = [
    {
      id: 'u06.task.1',
      q: [{ p: t('Butanas chloruojamas šviesoje ir susidaro dviejų monochlorintų produktų mišinys.', 'Butane is chlorinated in light and a mixture of two monochloro products forms.') },
        { scheme: { items: [{ smi: 'CCCC' }, { arrow: '→', above: f('Cl2, hν') }] } }],
      steps: [{
        prompt: t('Pažymėkite abu produktus.', 'Pick both products.'),
        kind: 'multi', options: [BR('CCCCCl'), BR('CCC(C)Cl'), BR('CC(C)CCl')], answer: [0, 1],
        hint: t('Butano grandinė nekinta; skiriasi tik vieta, kur atsiranda chloras.', 'The butane chain does not change; only the position of the chlorine differs.'),
        solution: t('Butane yra dvi ekvivalentinių vandenilių grupės (galų $CH3$ ir vidurinių $CH2$), todėl susidaro 1-chlorbutanas ir 2-chlorbutanas. 1-Chlor-2-metilpropanas turi kitokį skeletą.', 'Butane has two groups of equivalent hydrogens (the end $CH3$ and the middle $CH2$), so 1-chlorobutane and 2-chlorobutane form. 1-Chloro-2-methylpropane has a different skeleton.')
      }, {
        prompt: t('Kuris produktas yra chiralinis?', 'Which product is chiral?'),
        kind: 'choice', options: [BR('CCCCCl'), BR('CCC(C)Cl'), BR('CC(C)CCl')], answer: 1,
        hint: t('Ieškokite anglies atomo su keturiais skirtingais pakaitais.', 'Look for a carbon with four different substituents.'),
        solution: t('2-Chlorbutano antrasis anglies atomas turi $H$, $Cl$, $CH3$ ir $C2H5$. Susidaro racematas, nes radikalas plokščias.', 'Carbon 2 of 2-chlorobutane has $H$, $Cl$, $CH3$ and $C2H5$. A racemate forms because the radical is planar.')
      }, {
        prompt: t('Koks pagrindinis produktas susidaro, kai butanas brominamas $Br2$, hν?', 'What is the main product when butane is brominated with $Br2$, hν?'),
        kind: 'choice', options: [BR('CCC(C)Br'), BR('CCCCBr'), BR('CC(C)CBr')], answer: 0,
        hint: t('Bromas renkasi vandenilį, kurį atplėšus susidaro stabilesnis radikalas.', 'Bromine picks the hydrogen whose removal gives the more stable radical.'),
        solution: t('Antrinis radikalas stabilesnis už pirminį, todėl vyrauja 2-brombutanas (98 %, racematas); 1-brombutanas sudaro apie 2 %.', 'The secondary radical is more stable than the primary one, so 2-bromobutane predominates (98 %, racemate); 1-bromobutane is about 2 %.')
      }],
      why: t('Chloras mažai selektyvus ir duoda abu izomerus; bromas renkasi antrinį vandenilį. Naujas chiralinis centras atsiranda racemato pavidalu.', 'Chlorine is hardly selective and gives both isomers; bromine picks the secondary hydrogen. A new chiral centre appears as a racemate.'),
      src: 'S4.1',
      claims: [{ chiral: ['CCC(C)Cl', true] }, { chiral: ['CCCCCl', false] }, { react: ['sr.halogenate', ['CCCC'], { X: 'Br' }, 'CCC(C)Br'] }]
    },
    {
      id: 'u06.task.2',
      q: [{ p: t('Koks yra pagrindinis radikalinio brominimo produktas? Paaiškinkite, kaip nustatėte.', 'What is the main product of radical bromination? Explain how you decided.') },
        { scheme: { items: [{ smi: 'CC(C)CC(C)(C)C', name: t('2,2,4-trimetilpentanas', '2,2,4-trimethylpentane') }, { arrow: '→', above: f('Br2, hν') }] } }],
      steps: [{
        prompt: t('Bakstelėkite atomą, kurio vandenilį atplėšia bromo radikalas.', 'Tap the carbon whose hydrogen the bromine radical removes.'),
        kind: 'atoms', mol: { smi: 'CC(C)CC(C)(C)C', opts: { numbers: 'all' } }, answer: [1],
        hint: t('Raskite atomą, kuris po vandenilio netekimo duotų stabiliausią radikalą.', 'Find the carbon that would give the most stable radical after losing its hydrogen.'),
        solution: t('Atomas Nr. 2 yra vienintelis tretinis atomas su vandeniliu; ketvirtinis atomas Nr. 5 vandenilių neturi.', 'Carbon no. 2 is the only tertiary carbon with a hydrogen; the quaternary carbon no. 5 has none.')
      }, {
        prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: 'choice', options: [BR('CC(C)(Br)CC(C)(C)C'), BR('CC(C)C(Br)C(C)(C)C'), BR('CC(C)CC(C)(C)CBr'), BR('CC(CBr)CC(C)(C)C')], answer: 0,
        hint: t('Bromas jungiasi ten, kur buvo radikalas.', 'Bromine bonds where the radical was.'),
        solution: t('Brominimas yra regioselektyvus: tretinis radikalas, todėl vyrauja tretinis bromidas.', 'Bromination is regioselective: the radical is tertiary, so the tertiary bromide predominates.')
      }, {
        prompt: t('Pavadinkite produktą.', 'Name the product.'),
        kind: 'name', mol: { smi: 'CC(C)(Br)CC(C)(C)C' }, answer: { smi: 'CC(C)(Br)CC(C)(C)C' },
        hint: t('Raskite ilgiausią grandinę ir sunumeruokite taip, kad pakaitai gautų mažiausius numerius.', 'Find the longest chain and number it so the substituents get the lowest numbers.'),
        solution: t('2-brom-2,4,4-trimetilpentanas', '2-bromo-2,4,4-trimethylpentane')
      }],
      why: t('Bromas pasirenka tretinį vandenilį, nes tretinis radikalas stabiliausias; likę vandeniliai duoda tik pėdsakus kitų izomerų.', 'Bromine picks the tertiary hydrogen because the tertiary radical is the most stable; the other hydrogens give only traces of other isomers.'),
      src: 'S4.2',
      claims: [{ react: ['sr.halogenate', ['CC(C)CC(C)(C)C'], { X: 'Br' }, 'CC(C)(Br)CC(C)(C)C'] }, { name: ['CC(C)CC(C)(C)C', { lt: '2,2,4-trimetilpentanas', en: '2,2,4-trimethylpentane' }] }]
    },
    {
      id: 'u06.task.3',
      q: [{ p: t('Koks yra pagrindinis radikalinio brominimo produktas?', 'What is the main product of radical bromination?') },
        { scheme: { items: [{ smi: 'CC1CCC(C)(C)CC1', name: t('1,1,4-trimetilcikloheksanas', '1,1,4-trimethylcyclohexane') }, { arrow: '→', above: f('Br2, hν') }] } }],
      steps: [{
        prompt: t('Bakstelėkite atomą, kurio vandenilį atplėšia bromo radikalas.', 'Tap the carbon whose hydrogen the bromine radical removes.'),
        kind: 'atoms', mol: { smi: 'CC1CCC(C)(C)CC1', opts: { numbers: 'all' } }, answer: [1],
        hint: t('Kuris atomas po vandenilio netekimo duotų radikalą su daugiausia alkilgrupių?', 'Which carbon, after losing a hydrogen, would give the radical with the most alkyl groups?'),
        solution: t('Atomas Nr. 2 turi tris anglies kaimynus ir vieną vandenilį: tretinis atomas. Atomas Nr. 5 vandenilių neturi.', 'Carbon no. 2 has three carbon neighbours and one hydrogen: a tertiary carbon. Carbon no. 5 has no hydrogen.')
      }, {
        prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: 'choice', options: [BR('CC1(Br)CCC(C)(C)CC1'), BR('CC1CCC(C)(C)C(Br)C1'), BR('CC1CCC(C)(C)CC1Br'), BR('BrCC1CCC(C)(C)CC1')], answer: 0,
        hint: t('Visų variantų formulė ta pati, skiriasi tik bromo vieta.', 'All options have the same formula; only the position of bromine differs.'),
        solution: t('Bromas patenka į tretinį žiedo atomą: susidaro 1-brom-1,4,4-trimetilcikloheksanas.', 'Bromine goes to the tertiary ring carbon, giving 1-bromo-1,4,4-trimethylcyclohexane.')
      }],
      why: t('Žiedas elgiasi kaip alkanas: tretinis atomas duoda stabiliausią radikalą, todėl bromas keičia jo vandenilį.', 'The ring behaves like an alkane: the tertiary carbon gives the most stable radical, so bromine replaces its hydrogen.'),
      src: 'S4.2',
      claims: [{ react: ['sr.halogenate', ['CC1CCC(C)(C)CC1'], { X: 'Br' }, 'CC1(Br)CCC(C)(C)CC1'] }]
    },
    {
      id: 'u06.task.4',
      q: [{ p: t('Koks yra pagrindinis radikalinio brominimo produktas?', 'What is the main product of radical bromination?') },
        { scheme: { items: [{ smi: 'CC(C)CCCC', name: t('2-metilheksanas', '2-methylhexane') }, { arrow: '→', above: f('Br2, hν') }] } }],
      steps: [{
        prompt: t('Bakstelėkite atomą, kurio vandenilį atplėšia bromo radikalas.', 'Tap the carbon whose hydrogen the bromine radical removes.'),
        kind: 'atoms', mol: { smi: 'CC(C)CCCC', opts: { numbers: 'all' } }, answer: [1],
        hint: t('Palyginkite pirminius, antrinius ir tretinį atomus.', 'Compare the primary, secondary and tertiary carbons.'),
        solution: t('Atomas Nr. 2 – vienintelis tretinis. Tretinis radikalas stabilesnis už antrinius (atomai Nr. 4, 5, 6) ir pirminius.', 'Carbon no. 2 is the only tertiary one. The tertiary radical is more stable than the secondary ones (carbons no. 4, 5, 6) and the primary ones.')
      }, {
        prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: 'choice', options: [BR('CC(C)(Br)CCCC'), BR('CC(C)C(Br)CCC'), BR('CC(C)CC(Br)CC'), BR('CC(C)CCCCBr')], answer: 0,
        hint: t('Bromas jungiasi ten, kur buvo radikalas.', 'Bromine bonds where the radical was.'),
        solution: t('Pagrindinis produktas – 2-brom-2-metilheksanas. Likę izomerai, tarp jų antriniai bromidai, sudaro tik nedidelę dalį.', 'The main product is 2-bromo-2-methylhexane. The other isomers, including the secondary bromides, form only a small part.')
      }],
      why: t('Net kai grandinė ilga ir yra daug antrinių vandenilių, bromas renkasi vienintelį tretinį.', 'Even when the chain is long and there are many secondary hydrogens, bromine picks the single tertiary one.'),
      src: 'S4.2',
      claims: [{ react: ['sr.halogenate', ['CC(C)CCCC'], { X: 'Br' }, 'CC(C)(Br)CCCC'] }, { name: ['CC(C)(Br)CCCC', { lt: '2-brom-2-metilheksanas', en: '2-bromo-2-methylhexane' }] }]
    },
    {
      id: 'u06.task.5',
      q: [{ p: t('Koks yra pagrindinis radikalinio brominimo produktas?', 'What is the main product of radical bromination?') },
        { scheme: { items: [{ smi: 'CC(C)(C)C(C)C(C)(C)C(C)(C)C' }, { arrow: '→', above: f('Br2, hν') }] } }],
      steps: [{
        prompt: t('Bakstelėkite atomą, kurio vandenilį atplėšia bromo radikalas.', 'Tap the carbon whose hydrogen the bromine radical removes.'),
        kind: 'atoms', mol: { smi: 'CC(C)(C)C(C)C(C)(C)C(C)(C)C', opts: { numbers: 'all' } }, answer: [4],
        hint: t('Kuris atomas turi tris anglies kaimynus ir vandenilį?', 'Which carbon has three carbon neighbours and a hydrogen?'),
        solution: t('Atomas Nr. 5 yra vienintelis tretinis atomas su vandeniliu; visi kiti atomai arba ketvirtiniai, arba $CH3$ grupės.', 'Carbon no. 5 is the only tertiary carbon with a hydrogen; all the others are either quaternary or $CH3$ groups.')
      }, {
        prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: 'choice', options: [BR('CC(C)(C)C(C)(Br)C(C)(C)C(C)(C)C'), BR('CC(C)(C)C(C)C(C)(C)C(C)(C)CBr'), BR('CC(C)(C)C(CBr)C(C)(C)C(C)(C)C')], answer: 0,
        hint: t('Likę pirminiai vandeniliai duoda mažiau stabilų radikalą.', 'The remaining primary hydrogens give a less stable radical.'),
        solution: t('Bromas pakeičia vienintelio tretinio atomo vandenilį. Pirminiai vandeniliai (visose metilo grupėse) duotų daug mažiau stabilius radikalus.', 'Bromine replaces the hydrogen of the single tertiary carbon. The primary hydrogens (in all the methyl groups) would give much less stable radicals.')
      }],
      why: t('Pagrindinį produktą lemia stabiliausias galimas radikalas, o ne vandenilių skaičius: čia yra tik vienas tretinis vandenilis ir daugybė pirminių.', 'The most stable possible radical sets the main product, not the number of hydrogens: here there is just one tertiary hydrogen and very many primary ones.'),
      src: 'S4.2',
      claims: [{ react: ['sr.halogenate', ['CC(C)(C)C(C)C(C)(C)C(C)(C)C'], { X: 'Br' }, 'CC(C)(C)C(C)(Br)C(C)(C)C(C)(C)C'] }]
    },
    {
      id: 'u06.task.6',
      q: [{ p: t('Metilciklopentanas reaguoja radikaliniu būdu. Kokius monochlorintus produktus galima gauti, kuris yra pagrindinis brominant ir koks mechanizmas?', 'Methylcyclopentane reacts by the radical route. Which monochloro products are possible, which is the main one on bromination, and what is the mechanism?') },
        { mol: { smi: 'CC1CCCC1', name: t('metilciklopentanas', 'methylcyclopentane') } }],
      steps: [{
        prompt: t('Kiek skirtingų monochlorintų izomerų gali susidaryti (be stereoizomerų)?', 'How many different monochloro isomers can form (not counting stereoisomers)?'),
        kind: 'number', answer: { value: 4, tol: 0 },
        hint: t('Suskaičiuokite ekvivalentinių vandenilių grupes: metilas, tretinis žiedo atomas ir kiti žiedo atomai.', 'Count the groups of equivalent hydrogens: the methyl, the tertiary ring carbon and the other ring carbons.'),
        solution: [{ p: t('Yra keturios grupės: metilo, tretinio žiedo atomo, dviejų gretimų ir dviejų tolimesnių žiedo atomų vandeniliai.', 'There are four groups: the methyl, the tertiary ring carbon, the two neighbouring ring carbons and the two remote ring carbons.') },
          { mol: [{ smi: 'ClCC1CCCC1' }, { smi: 'CC1(Cl)CCCC1' }, { smi: 'CC1CCCC1Cl' }, { smi: 'CC1CCC(Cl)C1' }] }]
      }, {
        prompt: t('Kuris radikalas susidaro greičiausiai brominant?', 'Which radical forms fastest on bromination?'),
        kind: 'choice', options: [BR('C[C]1CCCC1'), BR('[CH2]C1CCCC1'), BR('CC1[CH]CCC1'), BR('CC1C[CH]CC1')], answer: 0,
        hint: t('Palyginkite, kiek anglies kaimynų turi radikalo atomas.', 'Compare how many carbon neighbours the radical carbon has.'),
        solution: t('Tretinis radikalas (atomas su trimis anglies kaimynais) stabiliausias.', 'The tertiary radical (a carbon with three carbon neighbours) is the most stable.')
      }, {
        prompt: t('Koks yra pagrindinis brominimo produktas?', 'What is the main product of bromination?'),
        kind: 'choice', options: [BR('CC1(Br)CCCC1'), BR('BrCC1CCCC1'), BR('CC1CCCC1Br'), BR('CC1CCC(Br)C1')], answer: 0,
        hint: t('Bromas jungiasi ten, kur buvo radikalas.', 'Bromine bonds where the radical was.'),
        solution: t('Susidaro 1-brom-1-metilciklopentanas.', '1-Bromo-1-methylcyclopentane forms.')
      }, {
        prompt: t('Koks šios reakcijos mechanizmo simbolis?', 'What is the symbol of this reaction mechanism?'),
        kind: 'choice', options: [{ text: f('SR') }, { text: f('SN1') }, { text: f('AE') }, { text: f('SEAr') }], answer: 0,
        hint: t('Kokios dalelės veda grandinę ir kas atsitinka su vandeniliu?', 'Which species carry the chain, and what happens to the hydrogen?'),
        solution: t('Tai SR mechanizmas: grandininė reakcija su iniciacija, augimu ir nutrūkimu.', 'This is the SR mechanism: a chain reaction with initiation, propagation and termination.')
      }, {
        prompt: t('Ką reiškia raidės S ir R simbolyje SR?', 'What do the letters S and R in SR stand for?'),
        kind: 'choice',
        options: [{ text: t('S – pakeitimas (substitution), R – radikalinis', 'S – substitution, R – radical') }, { text: t('S – sinchroninis, R – reversinis', 'S – synchronous, R – reversible') }, { text: t('S – stereoselektyvus, R – racematas', 'S – stereoselective, R – racemate') }, { text: t('S – sotusis, R – redukcija', 'S – saturated, R – reduction') }],
        answer: 0,
        hint: t('Mechanizmo simbolis nusako, kas vyksta su vandeniliu ir kokios dalelės dalyvauja.', 'The mechanism symbol says what happens to the hydrogen and which species take part.'),
        solution: t('S – pakeitimas (vandenilis pakeičiamas halogenu), R – radikalinis mechanizmas.', 'S – substitution (hydrogen is replaced by halogen), R – the radical mechanism.')
      }],
      why: t('Visos grupės vandenilių gali būti pakeistos chloru, o bromas renkasi tretinį atomą. Mechanizmas – SR.', 'Hydrogens of every group can be replaced by chlorine, while bromine picks the tertiary carbon. The mechanism is SR.'),
      src: 'S4.10',
      claims: [{ react: ['sr.halogenate', ['CC1CCCC1'], { X: 'Br' }, 'CC1(Br)CCCC1'] }, { name: ['CC1(Br)CCCC1', { lt: '1-brom-1-metilciklopentanas', en: '1-bromo-1-methylcyclopentane' }] }]
    },
    {
      id: 'u06.task.7',
      q: [{ p: t('Metilcikloheksanas brominamas radikaliniu būdu.', 'Methylcyclohexane is brominated by the radical route.') },
        { mol: { smi: 'CC1CCCCC1', name: t('metilcikloheksanas', 'methylcyclohexane') } }],
      steps: [{
        prompt: t('Bakstelėkite atomą, kurio vandenilį atplėšia bromo radikalas.', 'Tap the carbon whose hydrogen the bromine radical removes.'),
        kind: 'atoms', mol: { smi: 'CC1CCCCC1', opts: { numbers: 'all' } }, answer: [1],
        hint: t('Antrinių atomų yra tik žiede. Kurį radikalą stabilizuotų daugiausia alkilgrupių?', 'The secondary carbons are in the ring. Which radical would be stabilised by the most alkyl groups?'),
        solution: t('Atomas Nr. 2 turi tris anglies kaimynus ir vandenilį: tretinis atomas.', 'Carbon no. 2 has three carbon neighbours and a hydrogen: a tertiary carbon.')
      }, {
        prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: 'choice', options: [BR('CC1(Br)CCCCC1'), BR('BrCC1CCCCC1'), BR('CC1CCCCC1Br'), BR('CC1CCCC(Br)C1')], answer: 0,
        hint: t('Bromas pakeičia vandenilį, kurį atplėšus gaunamas stabiliausias radikalas.', 'Bromine replaces the hydrogen whose removal gives the most stable radical.'),
        solution: t('Susidaro 1-brom-1-metilcikloheksanas. Pirminis ir antriniai bromidai būtų tik šalutiniai.', '1-Bromo-1-methylcyclohexane forms. The primary and secondary bromides would be only minor products.')
      }],
      why: t('Pakaitas prie žiedo sukuria tretinį atomą; jo vandenilis keičiamas selektyviausiai.', 'A substituent on the ring creates a tertiary carbon; its hydrogen is replaced most selectively.'),
      src: 'S4.2',
      claims: [{ react: ['sr.halogenate', ['CC1CCCCC1'], { X: 'Br' }, 'CC1(Br)CCCCC1'] }, { name: ['CC1(Br)CCCCC1', { lt: '1-brom-1-metilcikloheksanas', en: '1-bromo-1-methylcyclohexane' }] }]
    },
    {
      id: 'u06.task.8',
      q: [{ p: t('Radikaliniu chlorinimu reikia gauti vieną $C5H11Cl$ izomerą. Palyginkite pentaną ir 2,2-dimetilpropaną.', 'One isomer of $C5H11Cl$ has to be made by radical chlorination. Compare pentane and 2,2-dimethylpropane.') },
        { mol: [{ smi: 'CCCCC', name: t('pentanas', 'pentane') }, { smi: 'CC(C)(C)C', name: t('2,2-dimetilpropanas', '2,2-dimethylpropane') }] }],
      steps: [{
        prompt: t('Kiek monochlorintų izomerų gali duoti pentanas?', 'How many monochloro isomers can pentane give?'),
        kind: 'number', answer: { value: 3, tol: 0 }, mol: { smi: 'CCCCC' },
        hint: t('Kurie pentano atomai susikeičia vietomis, kai molekulę apverčiate?', 'Which carbons of pentane swap places when you turn the molecule round?'),
        solution: t('Trys grupės: $C1/C5$, $C2/C4$ ir $C3$, todėl 1-, 2- ir 3-chlorpentanas.', 'Three groups: $C1/C5$, $C2/C4$ and $C3$, so 1-, 2- and 3-chloropentane.')
      }, {
        prompt: t('Kurį $C5H11Cl$ izomerą galima gauti kaip vienintelį produktą?', 'Which $C5H11Cl$ isomer can be obtained as the only product?'),
        kind: 'choice', options: [BR('CC(C)(C)CCl'), BR('CCCCCCl'), BR('CCC(C)(C)Cl'), BR('CC(C)C(C)Cl')], answer: 0,
        hint: t('Reikia alkano, kurio visi vandeniliai ekvivalentiški.', 'You need an alkane whose hydrogens are all equivalent.'),
        solution: t('Tik 2,2-dimetilpropanas turi vieną vandenilių grupę, todėl 1-chlor-2,2-dimetilpropanas yra vienintelis produktas. 1-Chlorpentanas iš pentano būtų tik viena iš trijų dalių.', 'Only 2,2-dimethylpropane has a single group of hydrogens, so 1-chloro-2,2-dimethylpropane is the only product. 1-Chloropentane from pentane would be only one of three.')
      }],
      why: t('Radikalinis chlorinimas tinka vienam produktui gauti tik iš alkano su ekvivalentiniais vandeniliais, pavyzdžiui, iš 2,2-dimetilpropano.', 'Radical chlorination gives a single product only from an alkane with equivalent hydrogens, for example from 2,2-dimethylpropane.'),
      src: 'S4.11',
      claims: [{ react: ['sr.halogenate', ['CC(C)(C)C'], { X: 'Cl' }, 'CC(C)(C)CCl'] }]
    },
    {
      id: 'u06.task.9',
      q: [{ p: t('Pentano radikalinio chlorinimo mišinys atskirtas į tris frakcijas, kurių virimo temperatūros skiriasi. Žemiausiai verdančią frakciją specialiais būdais galima išskirti į du junginius, turinčius tą pačią virimo temperatūrą.', 'The mixture from radical chlorination of pentane is separated into three fractions with different boiling points. The lowest-boiling fraction can be split by special methods into two compounds with the same boiling point.') }],
      steps: [{
        prompt: t('Kuris iš trijų konstitucijos izomerų yra chiralinis ir todėl sudarytas iš dviejų enantiomerų?', 'Which of the three constitutional isomers is chiral and therefore consists of two enantiomers?'),
        kind: 'choice', options: [{ mol: { smi: 'CCCCCCl', name: t('1-chlorpentanas', '1-chloropentane') } }, { mol: { smi: 'CCCC(C)Cl', name: t('2-chlorpentanas', '2-chloropentane') } }, { mol: { smi: 'CCC(CC)Cl', name: t('3-chlorpentanas', '3-chloropentane') } }], answer: 1,
        hint: t('Du junginiai su ta pačia virimo temperatūra yra enantiomerai. Ieškokite anglies atomo su keturiais skirtingais pakaitais.', 'Two compounds with the same boiling point are enantiomers. Look for a carbon with four different substituents.'),
        solution: t('Tai 2-chlorpentanas: jo antrasis anglies atomas turi $H$, $Cl$, $CH3$ ir $C3H7$, todėl yra $R$ ir $S$ enantiomerai su vienoda virimo temperatūra.', 'It is 2-chloropentane: its carbon 2 has $H$, $Cl$, $CH3$ and $C3H7$, so there are $R$ and $S$ enantiomers with the same boiling point.')
      }, {
        prompt: t('Pažymėkite visus keturis junginius, esančius mišinyje.', 'Pick all four compounds in the mixture.'),
        kind: 'multi',
        options: [BR('CCCCCCl'), BR('CCC[C@H](C)Cl'), BR('CCC[C@@H](C)Cl'), BR('CCC(CC)Cl'), BR('CCC(C)(C)Cl')],
        answer: [0, 1, 2, 3],
        hint: t('Pentanas duoda tris konstitucijos izomerus; vienas iš jų chiralinis, todėl turi du enantiomerus.', 'Pentane gives three constitutional isomers; one of them is chiral, so it has two enantiomers.'),
        solution: t('1-Chlorpentanas, 3-chlorpentanas ir abu 2-chlorpentano enantiomerai. 2-Chlor-2-metilbutanas turi kitokį skeletą.', '1-Chloropentane, 3-chloropentane and both enantiomers of 2-chloropentane. 2-Chloro-2-methylbutane has a different skeleton.')
      }],
      why: t('Chlorinant pentaną susidaro trys konstitucijos izomerai, o vienas iš jų, 2-chlorpentanas, dar yra racematas iš dviejų enantiomerų. Iš viso – keturi junginiai.', 'Chlorinating pentane gives three constitutional isomers, and one of them, 2-chloropentane, is a racemate of two enantiomers. In all, there are four compounds.'),
      src: 'L6 p22',
      claims: [{ cip: ['CCC[C@H](C)Cl', 3, 'S'] }, { cip: ['CCC[C@@H](C)Cl', 3, 'R'] }, { chiral: ['CCCC(C)Cl', true] }, { name: ['CCCC(C)Cl', { lt: '2-chlorpentanas', en: '2-chloropentane' }] }]
    }
  ];

  /* ---------- summary ---------- */
  const SUMMARY = [
    { h: t('Santrauka: alkanai ir SR reakcijos', 'Summary: alkanes and SR reactions') },
    {
      table: {
        head: [t('Tema', 'Topic'), t('Svarbiausia', 'Key point')],
        rows: [
          [t('Alkanai', 'Alkanes'), t('sp³ C, nepoliniai σ ryšiai, inertiški heterolizei; būdingos radikalinės reakcijos', 'sp³ carbons, non-polar σ bonds, inert in heterolysis; radical reactions are typical')],
          [t('Radikalų generavimas', 'Generating radicals'), t('termolizė (> 500 °C), fotolizė (hν), redokso procesai; viengalė strėlė = vienas elektronas', 'thermolysis (> 500 °C), photolysis (hν), redox processes; half-headed arrow = one electron')],
          [t('SR grandinė', 'The SR chain'), t('iniciacija $X2 → 2 X•$; augimas $X• + RH → HX + R•$, $R• + X2 → RX + X•$; nutrūkimas: du radikalai susijungia', 'initiation $X2 → 2 X•$; propagation $X• + RH → HX + R•$, $R• + X2 → RX + X•$; termination: two radicals combine')],
          [t('Radikalų stabilumas', 'Radical stability'), t('benzil- = alil- > tretinis > antrinis > pirminis > metil- (konjugacija, hiperkonjugacija, erdviniai trukdžiai)', 'benzyl = allyl > tertiary > secondary > primary > methyl (conjugation, hyperconjugation, steric hindrance)')],
          [fm('Cl2, hν'), t('aktyvus, mažai selektyvus: visų monochlorintų izomerų mišinys; skaičius = ekvivalentinių vandenilių grupių skaičius', 'reactive, hardly selective: a mixture of all monochloro isomers; their number = the number of groups of equivalent hydrogens')],
          [fm('Br2, hν'), t('mažiau aktyvus, selektyvus: vyrauja produktas iš stabiliausio radikalo (tretinis, benziltipo)', 'less reactive, selective: the product from the most stable radical predominates (tertiary, benzylic)')],
          [t('Chiralumas', 'Chirality'), t('plokščias radikalas → naujas chiralinis centras susidaro kaip racematas', 'planar radical → a new chiral centre forms as a racemate')],
          [t('Vienas produktas', 'One product'), t('$Cl2$: tik kai visi vandeniliai ekvivalentiški (metanas, etanas, 2,2-dimetilpropanas, cikloheksanas); $Br2$: ir kai stabiliausią radikalą duoda viena vandenilių grupė', '$Cl2$: only when all hydrogens are equivalent (methane, ethane, 2,2-dimethylpropane, cyclohexane); $Br2$: also when one group of hydrogens gives the most stable radical')],
          [t('Oksidacija', 'Oxidation'), t('$RCH3 → RCH2OH → RCHO → RCOOH$; $R2CH2 → R2CHOH → R2C=O$; degimas iki $CO2$; autooksidacija per hidroperoksidą (150–200 °C, 30–90 atm)', '$RCH3 → RCH2OH → RCHO → RCOOH$; $R2CH2 → R2CHOH → R2C=O$; combustion to $CO2$; autoxidation through a hydroperoxide (150–200 °C, 30–90 atm)')],
          [t('Antioksidantai', 'Antioxidants'), t('fenolio $O-H$ atiduoda $H•$ radikalui, susidaro stabilus fenoksilo radikalas', 'a phenolic $O-H$ gives $H•$ to a radical, a stable phenoxyl radical forms')]
        ]
      }
    },
    {
      list: [
        t('Aktyvumas: $F2 > Cl2 > Br2 > I2$; C–H ryšio aktyvumas: pirminis < antrinis < tretinis.', 'Reactivity: $F2 > Cl2 > Br2 > I2$; C–H bond reactivity: primary < secondary < tertiary.'),
        t('Pertekliniu halogenu gaunami di-, tri- ir tetrahalogenidai; pertekliniu alkanu – monohalogenidas.', 'Excess halogen gives di-, tri- and tetrahalides; excess alkane gives the monohalide.'),
        t('Mechanizmo simbolis: SR (radikalinis pakeitimas).', 'Mechanism symbol: SR (radical substitution).')
      ]
    }
  ];

  /* ---------- types ---------- */
  const TYPES = [
    { id: 'u06.step', title: t('Grandininės reakcijos stadijos', 'Stages of the chain reaction'), mirrors: ['S4.1', 'S4.10'], gen: genStep },
    { id: 'u06.chain', title: t('SR mechanizmas: stadijų tvarka ir prasmė', 'The SR mechanism: order and meaning of the stages'), mirrors: ['S4.1', 'S4.10'], bank: CHAIN },
    { id: 'u06.rank', title: t('Radikalų stabilumo eilė', 'Order of radical stability'), mirrors: ['S4.2', 'S4.10'], gen: genRank },
    { id: 'u06.count', title: t('Kiek monohalogeninių produktų?', 'How many monohalogen products?'), mirrors: ['S4.1', 'S4.10'], gen: genCount },
    { id: 'u06.chlor', title: t('Chlorinimo produktų mišinys', 'The mixture from chlorination'), mirrors: ['S4.1', 'S4.10'], gen: genChlor },
    { id: 'u06.brom', title: t('Brominimas: pagrindinis produktas', 'Bromination: the main product'), mirrors: ['S4.2', 'S4.10'], gen: genBrom },
    { id: 'u06.pct', title: t('Produktų pasiskirstymas procentais', 'Product distribution in per cent'), mirrors: ['S4.2', 'S4.10'], gen: genPct },
    { id: 'u06.single', title: t('Vienas produktas: kurį angliavandenilį ar halogenalkaną rinktis?', 'One product: which hydrocarbon or haloalkane?'), mirrors: ['S4.11'], gen: genSingle },
    { id: 'u06.task', title: t('Seminaro tipo uždaviniai', 'Seminar-style problems'), mirrors: ['S4.1', 'S4.2', 'S4.10', 'S4.11'], bank: TASK },
    { id: 'u06.why', title: t('Kodėl? Radikalinių reakcijų paaiškinimai', 'Why? Explaining radical reactions'), mirrors: ['S4.1', 'S4.2', 'S4.11'], bank: WHY },
    { id: 'u06.ox', title: t('Alkanų oksidacija ir antioksidantai', 'Oxidation of alkanes and antioxidants'), mirrors: [], bank: OX }
  ];

  ORG.unit({
    id: 'u06',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S4.1': ['u06.step', 'u06.chain', 'u06.count', 'u06.chlor', 'u06.task', 'u06.why'],
      'S4.2': ['u06.rank', 'u06.brom', 'u06.pct', 'u06.task', 'u06.why'],
      'S4.10': ['u06.step', 'u06.chain', 'u06.rank', 'u06.count', 'u06.chlor', 'u06.brom', 'u06.pct', 'u06.task'],
      'S4.11': ['u06.single', 'u06.task', 'u06.why']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
