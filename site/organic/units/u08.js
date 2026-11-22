// site/organic/units/u08.js: unit 8, dienes, alkynes and small rings
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
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: true });
  const canonF = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });

  // Rewrites bonds of a SMILES string while the atom order stays the same (so atom numbers carry over).
  //   bonds: [[i, j, order]] (j is written directly after i); atoms: {idx: token}; add: {idx: [branch, ...]} appended after the atom.
  function rewrite(smi, bonds, atoms, add) {
    const sp = spans(smi);
    const edits = [];
    bonds.forEach(([i, j, order]) => {
      const later = Math.max(i, j), pos = sp[later].a - 1;
      const ch = smi[pos];
      if (ch === '=' || ch === '#' || ch === '-') edits.push({ from: pos, to: pos + 1, text: order === 2 ? '=' : order === 3 ? '#' : '' });
      else if (order > 1) edits.push({ from: sp[later].a, to: sp[later].a, text: order === 2 ? '=' : '#' });
    });
    Object.keys(atoms || {}).forEach(k => edits.push({ from: sp[k].a, to: sp[k].b, text: atoms[k] }));
    Object.keys(add || {}).forEach(k => edits.push({ from: sp[k].r, to: sp[k].r, text: add[k].join('') }));
    edits.sort((p, q) => q.from - p.from || q.to - p.to);
    let s = smi;
    edits.forEach(e => { s = s.slice(0, e.from) + e.text + s.slice(e.to); });
    return s;
  }

  // options: the right ones first, then wrong ones; duplicates (by structure) are dropped; at most `max`
  function molOptions(ctx, rights, wrongs, max) {
    const seen = new Set();
    const options = [];
    const right = [];
    rights.forEach(s => {
      const k = canon(ctx, s);
      if (!seen.has(k)) { seen.add(k); right.push(options.length); options.push({ mol: { smi: s } }); }
    });
    wrongs.forEach(s => {
      if (!s || options.length >= max) return;
      let k;
      try { k = canon(ctx, s); } catch (e) { return; }
      if (!seen.has(k)) { seen.add(k); options.push({ mol: { smi: s } }); }
    });
    return { options, right };
  }

  const CL_LT = ['', 'pirminis', 'antrinis', 'tretinis'];
  const CL_EN = ['', 'primary', 'secondary', 'tertiary'];
  const cN = (m, i) => m.nbr[i].filter(j => m.atoms[j].el === 'C').length;
  const clsT = (m, i) => { const n = Math.min(3, Math.max(1, cN(m, i))); return t(CL_LT[n], CL_EN[n]); };

  // a name step when the namer can name the structure in both languages
  const NAME_HINT = t('Raskite pagrindinę grandinę (ar žiedą) ir sunumeruokite ją taip, kad pakaitai ir daugybiniai ryšiai gautų kuo mažesnius numerius.',
    'Find the parent chain (or ring) and number it so that the substituents and the multiple bonds get the lowest numbers.');
  function nameStep(ctx, smi, prompt, hint) {
    const lt = ctx.name.name(smi, { lang: 'lt' });
    const en = ctx.name.name(smi, { lang: 'en' });
    if (!lt || !en) return null;
    return { prompt, kind: 'name', mol: { smi }, answer: { smi }, hint: hint || NAME_HINT, solution: t(lt.name, en.name) };
  }

  /* ---------- pools ---------- */

  // dienes by type (all stay within the namer's scope)
  const DI_CONJ = ['C=CC=C', 'CC=CC=C', 'CC=CC=CC', 'C=CC(C)=C', 'C=CC=CCC', 'CC=CC=CCC', 'CC(C)=CC=C', 'C1=CC=CCC1', 'CC=C(C)C=C',
    'CC=CC=CCCC', 'C=CC=CCCC', 'C=C(C)C(C)=C', 'C=CC(CC)=C', 'CC(C)=CC(C)=C', 'C=CC=C(C)CC', 'C1=CC=CC1', 'CC=CC=C(C)C', 'C=C(C)C=CC', 'CC1=CC=CCC1', 'C=CC=CC(C)C'];
  const DI_ISO = ['C=CCC=C', 'C=CCCC=C', 'CC=CCC=C', 'C=CC(C)C=C', 'C=CCCC=CC', 'C1=CCC=CC1', 'C=CCCCC=C', 'CC=CCC=CC', 'C=CC(C)(C)C=C',
    'C=CCC(C)C=C', 'C=CCCCCC=C', 'C=C(C)CCC=C', 'C=CC(CC)C=C', 'CC(C)=CCC=C', 'CC=CCCC=CC', 'C=CCC(C)=CC'];
  const DI_CUM = ['C=C=C', 'CC=C=C', 'CC=C=CC', 'C=C=CCC', 'CC(C)=C=C', 'C=C=CCCC', 'CC=C=CCC', 'C=C=CC(C)C', 'CC=C=C(C)C', 'C=C=CCCCC', 'CCC=C=CCC'];

  // conjugated dienes for HX addition. q = [a, b, c, d]: H+ adds to atom a, the allylic cation sits on b-c-d;
  // alt = the equivalent protonation site of a symmetric diene (every entry is checked against the engine when the problem is made)
  const DI_ADD = [
    { smi: 'C=CC=C', q: [0, 1, 2, 3], alt: 3 }, { smi: 'CC=CC=C', q: [4, 3, 2, 1] }, { smi: 'CC=CC=CC', q: [1, 2, 3, 4], alt: 4 },
    { smi: 'C=CC(C)=C', q: [4, 2, 1, 0] }, { smi: 'C=CC=CCC', q: [0, 1, 2, 3] }, { smi: 'CC(C)=CC=C', q: [5, 4, 3, 1] },
    { smi: 'C1=CC=CCC1', q: [0, 1, 2, 3], alt: 3 }, { smi: 'C=C(C)C(C)=C', q: [0, 1, 3, 5], alt: 5 }, { smi: 'CC(C)=CC(C)=C', q: [6, 4, 3, 1] },
    { smi: 'C=CC=C(C)CC', q: [0, 1, 2, 3] }, { smi: 'CC=CC=C(C)C', q: [1, 2, 3, 4] }, { smi: 'C=CC=CCCC', q: [0, 1, 2, 3] },
    { smi: 'C1=CC=CC1', q: [0, 1, 2, 3], alt: 3 }, { smi: 'CC1=CC=CCC1', q: [4, 3, 2, 1] }, { smi: 'C=CC=CC(C)C', q: [0, 1, 2, 3] },
    { smi: 'C=C(C)C=CC', q: [0, 1, 3, 4] }, { smi: 'C=CC=CCCCC', q: [0, 1, 2, 3] }
  ];

  // alkynes: terminal (the terminal carbon is the last atom), symmetric internal, unsymmetric internal
  const YN_T = ['CC#C', 'CCC#C', 'CCCC#C', 'CC(C)C#C', 'CC(C)CC#C', 'CCCCC#C', 'CC(C)(C)C#C', 'CCC(C)C#C', 'CC(C)CCC#C', 'CCCCCC#C',
    'CCC(C)CC#C', 'CCCC(C)C#C', 'CC(C)(C)CC#C', 'CCC(CC)C#C', 'CCCCCCC#C', 'CC(C)C(C)C#C', 'CCC(C)(C)C#C', 'CC(C)CC(C)C#C'];
  const YN_S = ['CC#CC', 'CCC#CCC', 'CCCC#CCCC', 'CC(C)C#CC(C)C', 'CC(C)(C)C#CC(C)(C)C'];
  const YN_U = ['CC#CCC', 'CC#CCCC', 'CCC#CCCC', 'CC#CC(C)C', 'CC(C)CC#CC', 'CC#CC(C)(C)C', 'CC#CCCCC', 'CCC(C)C#CC', 'CC#CC(C)CC', 'CC(C)CC#CCC', 'CCC#CC(C)C'];
  const YN_ALL = YN_T.concat(YN_S, YN_U);

  function alkyneInfo(ctx, smi) {
    const m = ctx.chem.parse(smi);
    const tb = m.bonds.find(x => x.order === 3);
    const a = Math.min(tb.a, tb.b), b = Math.max(tb.a, tb.b);
    const term = m.atoms[b].h > 0 ? b : m.atoms[a].h > 0 ? a : -1;
    return { m, a, b, term, inner: term < 0 ? -1 : term === a ? b : a, terminal: term >= 0 };
  }
  // the alkyne with X groups added to its sp carbons: order 2 or 1, na X on atom a, nb X on atom b
  function across(smi, inf, order, na, nb, X) {
    const add = {};
    if (na) add[inf.a] = new Array(na).fill('(' + X + ')');
    if (nb) add[inf.b] = new Array(nb).fill('(' + X + ')');
    return rewrite(smi, [[inf.a, inf.b, order]], null, add);
  }
  // the cis (or trans) alkene of an internal alkyne
  function stereoAlkene(smi, inf, cis) {
    const sp = spans(smi);
    const pos = sp[inf.b].a - 1;
    let s = smi.slice(0, sp[inf.a].a) + '/' + smi.slice(sp[inf.a].a, pos) + '=';
    s += smi.slice(sp[inf.b].a, sp[inf.b].r) + (cis ? '\\' : '/') + smi.slice(sp[inf.b].r);
    return s;
  }
  const engineMajors = (ctx, rule, smi, o) => ctx.react.run(rule, [smi], o).products.filter(p => p.major).map(p => p.smi);
  const sameSet = (ctx, A, B) => {
    const a = Array.from(new Set(A.map(s => canonF(ctx, s)))).sort();
    const b = Array.from(new Set(B.map(s => canonF(ctx, s)))).sort();
    return a.length === b.length && a.every((x, i) => x === b[i]);
  };

  /* ================================================================ generated types */

  // ---------- u08.dtype: kinds of dienes ----------
  function dieneKind(ctx, smi) {
    const m = ctx.chem.parse(smi);
    const dbs = m.bonds.filter(b => b.order === 2 && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C');
    if (dbs.length !== 2) return null;
    const [p, q] = dbs;
    if ([p.a, p.b].some(x => x === q.a || x === q.b)) return 'cum';
    return [p.a, p.b].some(x => m.nbr[x].some(y => y === q.a || y === q.b)) ? 'con' : 'iso';
  }

  const T_DTYPE = {
    id: 'u08.dtype',
    title: t('Dienų tipai ir pavadinimai', 'Kinds of dienes and their names'),
    mirrors: [],
    gen(rng, ctx) {
      const want = ctx.pick(['con', 'con', 'iso', 'iso', 'cum']);
      const smi = ctx.pick(want === 'con' ? DI_CONJ : want === 'iso' ? DI_ISO : DI_CUM);
      if (dieneKind(ctx, smi) !== want) throw new Error('u08.dtype: ' + smi + ' is not ' + want);
      const steps = [];
      steps.push({
        prompt: t('Kokio tipo yra šis dienas?', 'What kind of diene is this?'),
        kind: 'choice',
        options: [
          { text: t('Kumuliuotasis: abu dvigubieji ryšiai turi bendrą anglies atomą', 'Cumulated: the two double bonds share a carbon atom') },
          { text: t('Konjuguotasis: dvigubuosius ryšius skiria vienas vienaryšis ryšys', 'Conjugated: the double bonds are separated by one single bond') },
          { text: t('Izoliuotasis: dvigubuosius ryšius skiria bent vienas sp³ anglies atomas', 'Isolated: at least one sp³ carbon lies between the double bonds') }
        ],
        answer: { cum: 0, con: 1, iso: 2 }[want],
        hint: t('Suskaičiuokite, kiek vienaryšių ryšių yra tarp dviejų dvigubųjų ryšių (nė vieno, vienas ar daugiau).', 'Count how many single bonds lie between the two double bonds (none, one, or more).'),
        solution: want === 'con'
          ? t('Dvigubuosius ryšius skiria tik vienas vienaryšis ryšys, todėl keturi sp² atomai sudaro konjuguotąją sistemą: tai konjuguotasis dienas.', 'Only one single bond separates the double bonds, so four sp² atoms form a conjugated system: a conjugated diene.')
          : want === 'iso'
            ? t('Tarp dvigubųjų ryšių yra bent vienas sp³ anglies atomas, todėl jų π elektronai nesąveikauja: tai izoliuotasis dienas.', 'At least one sp³ carbon lies between the double bonds, so their π electrons do not interact: an isolated diene.')
            : t('Vienas anglies atomas priklauso abiem dvigubiesiems ryšiams ($C=C=C$): tai kumuliuotasis dienas.', 'One carbon belongs to both double bonds ($C=C=C$): a cumulated diene.')
      });
      if (want === 'cum') {
        steps.push({
          prompt: t('Bakstelėkite sp hibridizuotą anglies atomą.', 'Tap the sp hybridised carbon.'),
          kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, from: 'hyb:sp',
          hint: t('Ieškokite atomo, kuris priklauso abiem dvigubiesiems ryšiams.', 'Look for the atom that belongs to both double bonds.'),
          solution: t('Vidurinis atomas sudaro du dvigubuosius ryšius ir turi tik du kaimynus: jo hibridizacija sp, o ryšių kampas 180°.', 'The middle atom forms two double bonds and has only two neighbours: it is sp hybridised with a 180° bond angle.')
        });
      } else {
        const A = t('Per aliltipo katijoną gaunami du produktai: 1,2- ir 1,4-aduktas.', 'Two products form through an allylic cation: the 1,2 and the 1,4 adduct.');
        const B = t('Du dvigubieji ryšiai vienas kito neveikia: HBr prisijungia prie vieno iš jų pagal Markovnikovo taisyklę.', 'The two double bonds do not affect each other: HBr adds to one of them by Markovnikov’s rule.');
        const C = t('Abu dvigubieji ryšiai vienu metu prijungia po HBr, nors paimtas tik vienas reagento ekvivalentas.', 'Both double bonds add one HBr each at the same time, although only one equivalent of reagent was used.');
        const D = t('Reakcija nevyksta, nes dienai nėra nukleofilai.', 'No reaction takes place, because dienes are not nucleophiles.');
        const E = t('Susidaro vienas produktas: aliltipo katijonas simetriškas, todėl 1,2- ir 1,4-prijungimas duoda tą patį junginį.', 'A single product forms: the allylic cation is symmetric, so 1,2 and 1,4 addition give the same compound.');
        const nMaj = new Set(ctx.react.run('diene.hx', [smi], { X: 'Br' }).products.filter(p => p.major).map(p => canonF(ctx, p.smi))).size;
        steps.push({
          prompt: t('Kaip šis dienas reaguoja su vienu ekvivalentu HBr?', 'How does this diene react with one equivalent of HBr?'),
          kind: 'choice', options: [A, B, C, D, E].map(x => ({ text: x })), answer: want === 'con' ? (nMaj === 1 ? 4 : 0) : 1,
          hint: t('Ar po protono prisijungimo teigiamas krūvis gali pasidalyti su kitu dvigubuoju ryšiu?', 'After the proton adds, can the positive charge be shared with the other double bond?'),
          solution: want === 'con'
            ? t('Protonui prisijungus prie konjuguotosios sistemos galo, susidaro aliltipo katijonas: π sistema apima tris atomus, o teigiamas krūvis pasiskirsto tarp dviejų galinių. Bromidas gali prisijungti prie bet kurio iš jų (1,2- ir 1,4-prijungimas); jei katijonas simetriškas, abu produktai sutampa.', 'When the proton adds to an end of the conjugated system an allylic cation forms: the π system spans three carbons and the positive charge is shared by the two end ones. Bromide can bond to either (1,2 and 1,4 addition); if the cation is symmetric, the two products are the same compound.')
            : t('Dvigubuosius ryšius skiria sp³ atomas, todėl katijono krūvis negali pasiskirstyti per kitą dvigubąjį ryšį. Kiekvienas dvigubasis ryšys elgiasi kaip alkene (Markovnikovo taisyklė).', 'An sp³ carbon separates the double bonds, so the cation cannot share its charge with the other bond. Each double bond behaves as in an alkene (Markovnikov’s rule).')
        });
      }
      const ns = nameStep(ctx, smi, t('Pavadinkite dieną.', 'Name the diene.'),
        t('Raskite ilgiausią grandinę (ar žiedą), kurioje yra abu dvigubieji ryšiai, ir sunumeruokite ją taip, kad jie gautų mažiausius numerius; galūnė -dienas.', 'Find the longest chain (or ring) that contains both double bonds and number it so that they get the lowest numbers; the ending is -diene.'));
      if (ns) steps.push(ns);
      return {
        q: [{ p: t('Pažiūrėkite į šį dieną.', 'Look at this diene.') }, { mol: { smi, opts: { numbers: 'all' } } }],
        steps,
        why: t('Dieno tipą lemia dvigubųjų ryšių išsidėstymas: kumuliuotajame jie turi bendrą atomą, konjuguotajame juos skiria vienas vienaryšis ryšys, izoliuotajame – bent vienas sp³ atomas. Tik konjuguotojo dieno π elektronai pasidalija per keturis atomus, todėl jis stabilesnis ir reaguoja ypatingai: prijungia 1,2- ir 1,4-padėtyse.',
          'The kind of diene follows from where the double bonds are: in a cumulated diene they share an atom, in a conjugated one a single bond separates them, in an isolated one at least one sp³ atom does. Only in a conjugated diene are the π electrons shared over four atoms, which makes it more stable and gives it its special reactions: addition in the 1,2 and the 1,4 positions.'),
        src: 'L8 p2'
      };
    }
  };

  // ---------- u08.dadd: HX adds to a conjugated diene ----------
  const T_DADD = {
    id: 'u08.dadd',
    title: t('HX prijungimas prie konjuguotojo dieno', 'HX addition to a conjugated diene'),
    mirrors: ['S4.15'],
    gen(rng, ctx) {
      const { chem } = ctx;
      let pick = null;
      for (let tries = 0; tries < 40 && !pick; tries++) {
        const e = ctx.pick(DI_ADD);
        const X = ctx.pick(['Cl', 'Br', 'I']);
        const [a, b, c, d] = e.q;
        const m = chem.parse(e.smi);
        const h = (i) => m.atoms[i].h;
        const cat = (x, y, z, w) => rewrite(e.smi, [[x, y, 1]], { [x]: '[C' + hTok(h(x) + 1) + ']', [y]: '[C' + hTok(h(y)) + '+]' });
        const cat2 = (x, y, z, w) => rewrite(e.smi, [[x, y, 1], [y, z, 2], [z, w, 1]], { [x]: '[C' + hTok(h(x) + 1) + ']', [w]: '[C' + hTok(h(w)) + '+]' });
        const p12 = (x, y, z, w) => rewrite(e.smi, [[x, y, 1]], null, { [y]: ['(' + X + ')'] });
        const p14 = (x, y, z, w) => rewrite(e.smi, [[x, y, 1], [y, z, 2], [z, w, 1]], null, { [w]: ['(' + X + ')'] });
        const eng = engineMajors(ctx, 'diene.hx', e.smi, { X });
        if (!sameSet(ctx, eng, [p12(a, b, c, d), p14(a, b, c, d)])) continue;
        const loc1 = rewrite(e.smi, [[a, b, 1]], { [a]: '[C' + hTok(h(a)) + '+]', [b]: '[C' + hTok(h(b) + 1) + ']' });   // H+ on the inner carbon: a primary or secondary cation that is not allylic
        const loc2 = rewrite(e.smi, [[c, d, 1]], { [d]: '[C' + hTok(h(d)) + '+]', [c]: '[C' + hTok(h(c) + 1) + ']' });
        pick = {
          e, X, a, b, c, d, m,
          cat1: cat(a, b, c, d), cat2: cat2(a, b, c, d), p12: p12(a, b, c, d), p14: p14(a, b, c, d),
          altCat: cat(d, c, b, a), altP12: p12(d, c, b, a), altP14: p14(d, c, b, a),
          loc1, loc2,
          locP1: rewrite(e.smi, [[a, b, 1]], null, { [a]: ['(' + X + ')'] }),
          locP2: rewrite(e.smi, [[c, d, 1]], null, { [d]: ['(' + X + ')'] })
        };
      }
      if (!pick) throw new Error('u08.dadd: no usable diene');
      const { e, X, a, b, c, d, m } = pick;
      const sym = e.alt !== undefined;
      const two = canonF(ctx, pick.p12) !== canonF(ctx, pick.p14);
      const phr = (i, j) => cN(m, i) === cN(m, j)
        ? t('abu ' + ['', 'pirminiai', 'antriniai', 'tretiniai'][Math.min(3, cN(m, i))], 'both ' + CL_EN[Math.min(3, cN(m, i))])
        : t(clsT(m, i).lt + ' ir ' + clsT(m, j).lt, clsT(m, i).en + ' and ' + clsT(m, j).en);
      const mol = { smi: e.smi, opts: { numbers: 'all' } };

      // step 1: where does H+ add
      const s1sol = sym
        ? t('Dienas simetriškas: abu galai (atomai Nr. ' + (a + 1) + ' ir Nr. ' + (e.alt + 1) + ') lygiaverčiai. Protonui prisijungus, teigiamas krūvis pasiskirsto tarp atomų Nr. ' + (b + 1) + ' ir Nr. ' + (d + 1) + ' (' + phr(b, d).lt + ').',
          'The diene is symmetric: both ends (atoms no. ' + (a + 1) + ' and no. ' + (e.alt + 1) + ') are equivalent. After the proton adds, the positive charge is shared by atoms no. ' + (b + 1) + ' and no. ' + (d + 1) + ' (' + phr(b, d).en + ').')
        : t('Protonas jungiasi prie atomo Nr. ' + (a + 1) + '. Teigiamas krūvis tada pasiskirsto tarp atomų Nr. ' + (b + 1) + ' ir Nr. ' + (d + 1) + ' (' + phr(b, d).lt + '). Jungiantis prie kito galo, krūvis dalytųsi tarp atomų Nr. ' + (c + 1) + ' ir Nr. ' + (a + 1) + ' (' + phr(c, a).lt + '): toks aliltipo katijonas mažiau stabilus.',
          'The proton bonds to atom no. ' + (a + 1) + '. The positive charge is then shared by atoms no. ' + (b + 1) + ' and no. ' + (d + 1) + ' (' + phr(b, d).en + '). If it added to the other end, the charge would be shared by atoms no. ' + (c + 1) + ' and no. ' + (a + 1) + ' (' + phr(c, a).en + '): that allylic cation is less stable.');
      const steps = [{
        prompt: sym ? t('Bakstelėkite anglies atomus, kurie gali prisijungti protoną $H+$.', 'Tap the carbons that can receive the proton $H+$.')
          : t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
        kind: 'atoms', mol, answer: sym ? [a, e.alt].sort((x, y) => x - y) : [a],
        hint: t('Palyginkite aliltipo katijonus, kurie susidarytų protonui prisijungus prie vieno ar kito konjuguotosios sistemos galo.', 'Compare the allylic cations that would form if the proton added to one end of the conjugated system or the other.'),
        solution: [{ p: s1sol }, {
          mech: [{
            scheme: { items: [{ smi: e.smi }, { plus: true }, { smi: X, opts: { allH: true } }] },
            arrows: [{ from: { m: 0, b: [a, b] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
            note: t('I stadija (lėtoji): $π$ ryšio elektronai sudaro $C-H$ ryšį, $H-X$ elektronai pereina halogenui.', 'Stage I (slow): the $π$ electrons form the $C-H$ bond; the $H-X$ electrons go to the halogen.')
          }]
        }]
      }];

      // step 2: the intermediate
      const seen = new Set([canon(ctx, pick.cat1), canon(ctx, pick.cat2)]);
      const wrongCats = [pick.altCat, pick.loc1, pick.loc2].filter(s => !seen.has(canon(ctx, s)));
      const co = molOptions(ctx, [pick.cat1], wrongCats, 4);
      const catOpts = co.options.concat([{ text: t('Karbokatijonas nesusidaro: halogenido jonas prisijungia pirmas.', 'No carbocation forms: the halide ion adds first.') }]);
      steps.push({
        prompt: t('Kuris karbokatijonas susidaro pirmojoje stadijoje?', 'Which carbocation forms in the first stage?'),
        kind: 'choice', options: catOpts, answer: 0,
        hint: t('Kuris katijonas turi teigiamą krūvį šalia dvigubojo ryšio, kad galėtų juo pasidalyti?', 'Which cation has its positive charge next to a double bond, so that it can share it?'),
        solution: [
          { p: t('Teigiamas krūvis šalia dvigubojo ryšio dalijasi per konjugaciją: tai aliltipo katijonas, kurį vaizduoja dvi rezonansinės formulės. Katijonas, kuriame protonas prisijungė prie vidinio atomo, būtų nekonjuguotas ir mažiau stabilus.',
            'A positive charge next to a double bond is shared through conjugation: this is an allylic cation, drawn as two resonance structures. A cation from protonating an inner carbon would not be conjugated and is less stable.') },
          { resonance: [{ smi: pick.cat1 }, { smi: pick.cat2 }] }
        ]
      });

      // step 3: the products
      const rights = [pick.p12, pick.p14];
      const wr = molOptions(ctx, rights, [pick.altP12, pick.altP14, pick.locP1, pick.locP2], 5);
      const nr = wr.right.length;
      steps.push({
        prompt: nr === 2 ? t('Pažymėkite abu pagrindinius produktus (1,2- ir 1,4-prijungimo).', 'Pick both main products (1,2 and 1,4 addition).') : t('Koks produktas susidaro?', 'What is the product?'),
        kind: nr === 2 ? 'multi' : 'choice', options: wr.options, answer: nr === 2 ? wr.right : wr.right[0],
        hint: t('Halogenido jonas gali prisijungti prie kiekvieno atomo, kuris dalijasi teigiamu krūviu. Kiek tokių atomų yra ir ką duoda kiekvienas?', 'The halide ion can bond to each atom that shares the positive charge. How many such atoms are there and what does each give?'),
        solution: [
          { p: nr === 2
            ? t('Halogenido jonas jungiasi prie bet kurio teigiamo atomo (II stadija, greitoji): prie atomo Nr. ' + (b + 1) + ' arba prie atomo Nr. ' + (d + 1) + ' (tada dvigubasis ryšys persikelia į vidurį).',
              'The halide ion bonds to either positive carbon (stage II, fast): to atom no. ' + (b + 1) + ' or to atom no. ' + (d + 1) + ' (the double bond then moves to the middle).')
            : t('Abi rezonansinės formulės duoda tą patį junginį, todėl 1,2- ir 1,4-prijungimas čia sutampa ir susidaro vienas produktas.',
              'Both resonance structures give the same compound, so the 1,2 and 1,4 additions coincide and a single product forms.') },
          {
            mech: [{
              scheme: { items: [{ smi: pick.cat1 }, { plus: true }, { smi: '[' + X + '-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: b } }],
              note: t('Halogenido laisvoji pora sudaro ryšį su atomu Nr. ' + (b + 1) + '.', 'A lone pair of the halide bonds to atom no. ' + (b + 1) + '.')
            }, {
              scheme: { items: [{ smi: pick.cat2 }, { plus: true }, { smi: '[' + X + '-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: d } }],
              note: t('Kita rezonansinė formulė: ryšys su atomu Nr. ' + (d + 1) + '.', 'The other resonance structure: bonding to atom no. ' + (d + 1) + '.')
            }]
          }
        ].concat(wr.right.map(i => ({ mol: wr.options[i].mol })))
      });

      // step 4: which one is the 1,4 product
      if (two) {
        steps.push({
          prompt: t('Kuris iš šių dviejų produktų yra 1,4-prisijungimo produktas?', 'Which of these two products is the 1,4 addition product?'),
          kind: 'choice', options: [{ mol: { smi: pick.p14 } }, { mol: { smi: pick.p12 } }], answer: 0,
          hint: t('Keturių anglies atomų konjuguotosios sistemos galai yra 1 ir 4 padėtys. Kuriame produkte H ir X yra tuose galuose?', 'The ends of the four-carbon conjugated system are positions 1 and 4. In which product are H and X at those ends?'),
          solution: t('Prisijungimas prie atomo, gretimo protonui, yra 1,2-prijungimas, o prie tolimojo galo – 1,4-prijungimas. 1,4-produkte H ir X yra konjuguotosios sistemos galuose, o dvigubasis ryšys atsiduria sistemos viduryje (tarp 2 ir 3 padėties). 1,2-produkte H ir X yra gretimuose atomuose.',
            'Bonding to the carbon next to the proton is 1,2 addition, to the far end 1,4 addition. In the 1,4 product H and X sit at the two ends of the conjugated system and the double bond is in the middle (between positions 2 and 3). In the 1,2 product H and X are on adjacent carbons.')
        });
        const ns = nameStep(ctx, pick.p14, t('Pavadinkite 1,4-prisijungimo produktą.', 'Name the 1,4 addition product.'),
          t('Pavadinkite halogenalkeną: pagrindinė grandinė eina per dvigubąjį ryšį, o dvigubajam ryšiui suteikiamas mažesnis numeris nei halogenui.', 'Name the haloalkene: the main chain goes through the double bond, and the double bond gets the lower locant before the halogen is considered.'));
        if (ns) steps.push(ns);
      }
      return {
        q: [{ p: t('Konjuguotasis dienas reaguoja su vienu ekvivalentu vandenilio halogenido.', 'A conjugated diene reacts with one equivalent of a hydrogen halide.') },
          { scheme: { items: [{ smi: e.smi }, { plus: true }, { smi: X }, { arrow: '→' }] } }],
        steps,
        why: t('Pirmojoje stadijoje protonas prijungiamas prie konjuguotosios sistemos galo, nes taip susidaro stabilus aliltipo katijonas, kurio krūvis pasidalija per du atomus (rezonansinės formulės). Antrojoje stadijoje halogenido jonas gali prisijungti prie bet kurio iš jų, todėl gaunami du produktai: 1,2- ir 1,4-aduktas. Protonas renkasi galą, po kurio lieka stabilesnis (labiau pakeistas) aliltipo katijonas.',
          'In the first stage the proton adds to an end of the conjugated system, because that gives a stable allylic cation whose charge is shared by two atoms (resonance structures). In the second stage the halide ion can bond to either of them, so two products form: the 1,2 and the 1,4 adduct. The proton picks the end that leaves the more stable (more substituted) allylic cation.'),
        src: 'L8 p6'
      };
    }
  };

  // ---------- u08.name: alkynes, hybridisation and names ----------
  // written in IUPAC numbering order, so that the drawn labels equal the locants
  const YN_NAME = ['C#CC', 'C#CCC', 'C#CCCC', 'C#CC(C)C', 'C#CCC(C)C', 'C#CCCCC', 'C#CC(C)(C)C', 'C#CC(C)CC', 'C#CCCCCC', 'C#CCC(C)CC', 'C#CC(C)CCC', 'C#CCC(C)(C)C', 'C#CC(CC)CC', 'C#CCCCCCC', 'C#CC(C)C(C)C', 'C#CC(C)(C)CC', 'C#CC(C)CC(C)C',
    'CC#CC', 'CC#CCC', 'CC#CCCC', 'CCC#CCCC', 'CC#CC(C)C', 'CC#CCC(C)C', 'CC#CC(C)(C)C', 'CC#CCCCC', 'CC#CC(C)CC', 'CCC#CCC', 'CC(C)C#CC(C)C', 'CC(C)C#CCC', 'CCC#CCC(C)C',
    'C#CCCl', 'C#CC(C)Cl', 'ClCC#CC', 'C#CC(C)(C)Cl', 'OCC#C', 'OCC#CC', 'CC(O)C#C', 'CC(O)C#CC'];
  const T_NAME = {
    id: 'u08.name',
    title: t('Alkinų sandara ir pavadinimai', 'Structure and names of alkynes'),
    mirrors: [],
    gen(rng, ctx) {
      const smi = ctx.pick(YN_NAME);
      const inf = alkyneInfo(ctx, smi);
      const steps = [{
        prompt: t('Bakstelėkite sp hibridizuotus anglies atomus.', 'Tap the sp hybridised carbons.'),
        kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, from: 'hyb:sp',
        hint: t('sp atomas sudaro du σ ryšius ir du π ryšius.', 'An sp carbon forms two σ bonds and two π bonds.'),
        solution: t('Trigubąjį ryšį sudaro du sp atomai (Nr. ' + (inf.a + 1) + ' ir Nr. ' + (inf.b + 1) + '): vienas σ ir du π ryšiai, ryšių kampas 180°, todėl ši grandinės dalis tiesi.',
          'The triple bond joins two sp carbons (no. ' + (inf.a + 1) + ' and no. ' + (inf.b + 1) + '): one σ and two π bonds, bond angle 180°, so this part of the chain is straight.')
      }, {
        prompt: t('Ar tai terminalinis, ar internalinis alkinas?', 'Is this a terminal or an internal alkyne?'),
        kind: 'choice',
        options: [{ text: t('Terminalinis: trigubasis ryšys grandinės gale, yra ≡C–H', 'Terminal: the triple bond is at the end of the chain, there is a ≡C–H') },
          { text: t('Internalinis: trigubasis ryšys grandinės viduje, ≡C–H nėra', 'Internal: the triple bond is inside the chain, there is no ≡C–H') }],
        answer: inf.terminal ? 0 : 1,
        hint: t('Ar kuris nors iš sp atomų turi vandenilį?', 'Does either sp carbon carry a hydrogen?'),
        solution: inf.terminal
          ? t('Atomas Nr. ' + (inf.term + 1) + ' turi vandenilį: tai terminalinis alkinas, jis turi rūgštinį $≡C-H$ ryšį.', 'Carbon no. ' + (inf.term + 1) + ' carries a hydrogen: a terminal alkyne with an acidic $≡C-H$ bond.')
          : t('Abu sp atomai jungiasi tik su anglies atomais, vandenilio prie jų nėra: tai internalinis alkinas.', 'Both sp carbons are bonded only to carbons and carry no hydrogen: an internal alkyne.')
      }];
      const alc = smi.indexOf('O') >= 0;
      const ns = nameStep(ctx, smi, alc ? t('Pavadinkite junginį.', 'Name the compound.') : t('Pavadinkite alkiną.', 'Name the alkyne.'),
        alc ? t('Pagrindinė grandinė turi apimti trigubąjį ryšį ir C atomą su $OH$; numeruokite nuo galo, arčiau kurio yra $OH$; pavadinimas baigiasi -in-…-olis (pvz., 3-butin-2-olis).', 'The main chain must contain the triple bond and the carbon bearing $OH$; number from the end nearer to the $OH$; the name ends in -yn-…-ol (e.g. but-3-yn-2-ol).')
          : t('Pagrindinė grandinė turi apimti trigubąjį ryšį; numeruokite nuo to galo, kuris arčiau jo; galūnė -inas.', 'The main chain must contain the triple bond; number from the end nearer to it; the ending is -yne.'));
      if (!ns) throw new Error('u08.name: namer cannot name ' + smi);
      steps.push(ns);
      return {
        q: [{ p: alc ? t('Pažiūrėkite į šį junginį.', 'Look at this compound.') : t('Pažiūrėkite į šį alkiną.', 'Look at this alkyne.') }, { mol: { smi, opts: { numbers: 'all' } } }],
        steps,
        why: t('Alkino trigubąjį ryšį sudaro du sp atomai: vienas σ ir du π ryšiai, valentinis kampas 180°. Jei vienas iš jų turi vandenilį, alkinas terminalinis ir pasižymi rūgštinėmis savybėmis. Pavadinime nurodomas pirmojo trigubojo ryšio atomo numeris ir galūnė -inas.',
          'The triple bond of an alkyne joins two sp carbons: one σ and two π bonds, a bond angle of 180°. If one of them carries a hydrogen, the alkyne is terminal and acidic. The name gives the number of the first triple-bond carbon and the ending -yne.'),
        src: 'L8 p8'
      };
    }
  };

  // ---------- u08.yneadd: H2, X2 and HX add to an alkyne ----------
  const T_YADD = {
    id: 'u08.yneadd',
    title: t('Prijungimas prie alkino: $H2$, $X2$ ir $HX$', 'Addition to an alkyne: $H2$, $X2$ and $HX$'),
    mirrors: ['S4.7', 'S4.16'],
    gen(rng, ctx) {
      const { chem } = ctx;
      let pick = null;
      for (let tries = 0; tries < 80 && !pick; tries++) {
        const smi = ctx.pick(YN_ALL);
        const kind = ctx.pick(['hx1', 'hx1', 'hx2', 'hx2', 'x21', 'x22', 'h2full', 'h2full', 'h2lind']);
        const hx = kind.startsWith('hx');
        const X = ctx.pick(hx ? ['Cl', 'Br', 'I'] : ['Cl', 'Br']);
        const inf = alkyneInfo(ctx, smi);
        const sites = inf.terminal ? [inf.inner] : [inf.a, inf.b];       // the carbons that can carry X (Markovnikov)
        const gem = (x) => across(smi, inf, 1, x === inf.a ? 2 : 0, x === inf.b ? 2 : 0, X);
        const mono = (x) => across(smi, inf, 2, x === inf.a ? 1 : 0, x === inf.b ? 1 : 0, X);
        const vic = across(smi, inf, 1, 1, 1, X);
        const vicEne = across(smi, inf, 2, 1, 1, X);
        const dihalo = (trans) => { const sp0 = spans(smi); const rest = smi.slice(sp0[inf.b].r); return smi.slice(0, sp0[inf.a].a) + '/C(' + X + ')=C' + (rest ? '(' + (trans ? '\\' : '/') + X + ')' + rest : (trans ? '\\' : '/') + X); };
        const tetra = across(smi, inf, 1, 2, 2, X);
        const alkane = across(smi, inf, 1, 0, 0, X);
        const alkene = inf.terminal ? across(smi, inf, 2, 0, 0, X) : stereoAlkene(smi, inf, true);
        const trans = inf.terminal ? null : stereoAlkene(smi, inf, false);
        let rights, wrongs, eng, label;
        if (kind === 'hx1') {
          rights = sites.map(mono);
          wrongs = (inf.terminal ? [mono(inf.term)] : []).concat(sites.map(gem), [vicEne, alkane]);
          eng = engineMajors(ctx, 'yne.hx', smi, { X, eq: 1 });
          label = t('1 ekv. H' + X, '1 equiv. H' + X);
        } else if (kind === 'hx2') {
          rights = sites.map(gem);
          wrongs = (inf.terminal ? [gem(inf.term)] : []).concat([vic, mono(sites[0]), tetra]);
          eng = engineMajors(ctx, 'yne.hx', smi, { X, eq: 2 });
          label = t('2 ekv. H' + X, '2 equiv. H' + X);
        } else if (kind === 'x21') {
          rights = [dihalo(true)];
          wrongs = [dihalo(false), tetra, mono(sites[0])].concat(inf.terminal ? [across(smi, inf, 2, inf.a === inf.term ? 2 : 0, inf.b === inf.term ? 2 : 0, X)] : [vic]);
          eng = engineMajors(ctx, 'yne.x2', smi, { X, eq: 1 });
          label = t('1 ekv. ' + X + '2', '1 equiv. ' + X + '2');
        } else if (kind === 'x22') {
          rights = [tetra];
          wrongs = [vicEne, gem(sites[0]), vic];
          eng = engineMajors(ctx, 'yne.x2', smi, { X, eq: 2 });
          label = t('2 ekv. ' + X + '2', '2 equiv. ' + X + '2');
        } else if (kind === 'h2full') {
          rights = [alkane];
          wrongs = [alkene].concat(trans ? [trans] : []);
          eng = engineMajors(ctx, 'yne.h2', smi, { eq: 2 });
          label = t('2 ekv. H2, Pt', '2 equiv. H2, Pt');
        } else {
          rights = [alkene];
          wrongs = [alkane].concat(trans ? [trans] : []);
          eng = engineMajors(ctx, 'yne.h2', smi, { eq: 1, lindlar: true });
          label = t('1 ekv. H2, Lindlaro katalizatorius', '1 equiv. H2, Lindlar catalyst');
        }
        if (!sameSet(ctx, eng, rights)) continue;
        pick = { smi, kind, X, inf, sites, rights, wrongs, label, hx };
      }
      if (!pick) throw new Error('u08.yneadd: no usable alkyne');
      const { smi, kind, X, inf, sites, rights, wrongs, label, hx } = pick;
      const stereo = (kind === 'h2lind' && !inf.terminal) || kind === 'x21';
      const mo = molOptions(ctx, rights, wrongs, 5);
      const options = mo.options.slice();
      if (kind === 'h2full' || kind === 'h2lind' || kind === 'x22') {
        if (options.length < 4) options.push({ text: t('Reakcija nevyksta.', 'No reaction takes place.') });
      }
      const tie = mo.right.length > 1;
      const steps = [];
      if (hx) {
        steps.push({
          prompt: !inf.terminal ? t('Bakstelėkite anglies atomus, kurie gali prisijungti protoną $H+$.', 'Tap the carbons that can receive the proton $H+$.')
            : t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
          kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: !inf.terminal ? [inf.a, inf.b] : [inf.term],
          hint: t('Palyginkite, koks karbokatijonas (vinilo tipo) susidarytų protonui prisijungus prie vieno ar kito trigubojo ryšio atomo.', 'Compare the (vinylic) cation that would form if the proton added to one or the other triple-bond carbon.'),
          solution: !inf.terminal
            ? (tie ? t('Abu sp atomai (Nr. ' + (inf.a + 1) + ' ir Nr. ' + (inf.b + 1) + ') turi po vieną anglies kaimyną, todėl abu galimi katijonai vienodai stabilūs: protonas gali jungtis prie bet kurio ir susidaro du produktai.',
              'Both sp carbons (no. ' + (inf.a + 1) + ' and no. ' + (inf.b + 1) + ') have one carbon neighbour each, so both possible cations are equally stable: the proton can add to either and two products form.')
              : t('Abu sp atomai (Nr. ' + (inf.a + 1) + ' ir Nr. ' + (inf.b + 1) + ') lygiaverčiai, nes alkinas simetrinis: protonas gali jungtis prie bet kurio ir gaunamas tas pats produktas.',
              'Both sp carbons (no. ' + (inf.a + 1) + ' and no. ' + (inf.b + 1) + ') are equivalent because the alkyne is symmetric: the proton can add to either and the same product results.'))
            : t('Protonas jungiasi prie atomo Nr. ' + (inf.term + 1) + ' (≡C–H): teigiamas krūvis lieka ant atomo Nr. ' + (inf.inner + 1) + ', kurį stabilizuoja alkilgrupė. Jungiantis prie kito atomo, krūvis atsidurtų ant galinio atomo be alkilo pakaito.',
              'The proton bonds to carbon no. ' + (inf.term + 1) + ' (≡C–H): the positive charge stays on carbon no. ' + (inf.inner + 1) + ', which the alkyl group stabilises. If it added to the other carbon, the charge would end up on the terminal carbon, which has no alkyl group.')
        });
      }
      const prodHint = {
        hx1: t('Po vieno prijungimo lieka dvigubasis ryšys. Kur jungiasi halogenas: prie to paties atomo, prie kurio buvo protonas, ar prie kito?', 'After one addition a double bond remains. Does the halogen bond to the same carbon as the proton, or to the other one?'),
        hx2: t('Palyginkite, ar antroji HX molekulė jungiasi prie to paties atomo, ar prie kito, ir kiek halogenų atomų gauna kiekvienas buvęs trigubojo ryšio atomas.', 'Compare whether the second HX adds to the same carbon or to the other one, and how many halogens each former triple-bond carbon ends up with.'),
        x21: t('Kiek halogeno molekulių prisijungia ir kiek π ryšių išnyksta? Ar prijungiamas vandenilis?', 'How many halogen molecules add and how many π bonds are used? Is any hydrogen added?'),
        x22: t('Dvi halogeno molekulės sunaudoja abu π ryšius. Kiek halogeno atomų gauna kiekvienas buvęs trigubojo ryšio atomas?', 'Two halogen molecules use up both π bonds. How many halogen atoms does each former triple-bond carbon get?'),
        h2full: t('Du ekvivalentai vandenilio su platina: kiek π ryšių lieka po reakcijos?', 'Two equivalents of hydrogen over platinum: how many π bonds are left after the reaction?'),
        h2lind: t('Kuo Lindlaro katalizatorius skiriasi nuo paprastos platinos ar paladžio ir kokia susidariusio alkeno geometrija?', 'How does the Lindlar catalyst differ from plain platinum or palladium, and what is the geometry of the alkene?')
      }[kind];
      const sol = {
        hx1: t('Vienas ekvivalentas HX prijungiamas prie vieno π ryšio pagal Markovnikovo taisyklę: susidaro halogenalkenas.', 'One equivalent of HX adds to one π bond by Markovnikov’s rule: a haloalkene forms.'),
        hx2: t('Antrasis HX jungiasi prie to paties atomo, prie kurio jau yra halogenas (halogenas stabilizuoja katijoną): susidaro geminalinis dihalogenidas, ne vicinalinis.', 'The second HX adds to the carbon that already carries the halogen (the halogen helps to stabilise the cation): a geminal dihalide forms, not a vicinal one.'),
        x21: t('Vienas ekvivalentas halogeno sunaudoja vieną π ryšį: halogenas prisijungia prie abiejų atomų iš priešingų pusių (anti), todėl gaunamas E izomeras (vicinalinis dihalogenalkenas).', 'One equivalent of halogen uses one π bond: a halogen goes onto each carbon from opposite sides (anti), so the E isomer forms (a vicinal dihaloalkene).'),
        x22: t('Du ekvivalentai halogeno sunaudoja abu π ryšius: kiekvienas buvęs trigubojo ryšio atomas gauna po du halogenus (tetrahalogenalkanas).', 'Two equivalents of halogen use both π bonds: each former triple-bond carbon gets two halogens (a tetrahaloalkane).'),
        h2full: t('Su Pt hidrinimas nesustoja ties alkenu: sunaudojami abu π ryšiai ir susidaro alkanas.', 'Over Pt the hydrogenation does not stop at the alkene: both π bonds are used and the alkane forms.'),
        h2lind: inf.terminal
          ? t('Lindlaro katalizatorius yra „apnuodytas“, todėl sustoja ties alkenu: prijungiamas vienas H2.', 'The Lindlar catalyst is “poisoned”, so it stops at the alkene: one H2 is added.')
          : t('Lindlaro katalizatorius sustoja ties alkenu, o abu vandenilio atomai prisijungia iš tos pačios pusės: susidaro cis-alkenas.', 'The Lindlar catalyst stops at the alkene, and both hydrogens add from the same side: the cis alkene forms.')
      }[kind];
      steps.push({
        prompt: tie ? t('Pažymėkite visus pagrindinius produktus.', 'Pick every main product.') : t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: tie ? 'multi' : 'choice', options, answer: tie ? mo.right : mo.right[0],
        hint: prodHint,
        solution: [{ p: sol }].concat(mo.right.map(i => ({ mol: mo.options[i].mol })))
      });
      if (kind === 'h2lind') {
        steps.push({
          prompt: t('Kodėl su Lindlaro katalizatoriumi reakcija sustoja ties alkenu?', 'Why does the reaction stop at the alkene with the Lindlar catalyst?'),
          kind: 'choice',
          options: [
            { text: t('Katalizatorius „apnuodytas“ ir per silpnas, kad hidrintų jau susidariusį alkeną.', 'The catalyst is “poisoned” and too weak to hydrogenate the alkene that has formed.') },
            { text: t('Dvigubasis ryšys stipresnis už trigubąjį ir apskritai nereaguoja su $H2$.', 'A double bond is stronger than a triple bond and does not react with $H2$ at all.') },
            { text: t('Susidaręs alkenas yra nesotusis, todėl vandenilio nebejungia.', 'The alkene that forms is unsaturated, so it can no longer add hydrogen.') },
            { text: t('Lindlaro katalizatorius hidrina tik terminalinius alkinus.', 'The Lindlar catalyst hydrogenates only terminal alkynes.') }
          ],
          answer: 0,
          hint: t('Pagalvokite, ką reiškia „apnuodytas“ katalizatorius: jis aktyvesnis ar silpnesnis?', 'Think about what a “poisoned” catalyst means: is it more or less active?'),
          solution: t('Alkenas paprastai hidrinamas lengvai (Pd, Pt), bet apnuodytas Lindlaro katalizatorius yra per silpnas, todėl reakcija sustoja ties alkenu.', 'An alkene is normally hydrogenated easily (Pd, Pt), but the poisoned Lindlar catalyst is too weak, so the reaction stops at the alkene.')
        });
      }
      if (!tie && !stereo) {
        const ns = nameStep(ctx, rights[0], t('Pavadinkite produktą.', 'Name the product.'));
        if (ns) steps.push(ns);
      }
      if (X === 'Br' && (kind === 'x21' || kind === 'x22')) {
        steps.push({
          prompt: t('Alkinas pilamas į geltoną bromo vandenį. Ką pastebėsime?', 'The alkyne is added to yellow bromine water. What is observed?'),
          kind: 'choice',
          options: [
            { text: t('Geltona spalva išnyksta, nes bromas sunaudojamas.', 'The yellow colour disappears, because the bromine is used up.') },
            { text: t('Iškrenta rudos $MnO2$ nuosėdos.', 'Brown $MnO2$ precipitates.') },
            { text: t('Iškrenta rausvai rudos nuosėdos.', 'A red-brown precipitate forms.') },
            { text: t('Išsiskiria dujos, spalva nesikeičia.', 'A gas is evolved and the colour does not change.') }
          ],
          answer: 0,
          hint: t('Kas atsitinka su bromu, kai jis prisijungia prie π ryšio?', 'What happens to the bromine when it adds to a π bond?'),
          solution: t('Bromas prisijungia prie trigubojo ryšio, todėl spalvotas $Br2$ išnyksta. Tuo pačiu būdu atpažįstami dvigubieji ir trigubieji ryšiai (laboratorinis darbas).', 'The bromine adds across the triple bond, so the coloured $Br2$ is consumed. Double and triple bonds are detected in the same way (laboratory work).')
        });
      }
      return {
        q: [{ p: t('Alkinas reaguoja su nurodytu reagentu.', 'The alkyne reacts with the reagent shown.') },
          { scheme: { items: [{ smi }, { arrow: '→', above: label }] } }],
        steps,
        why: t('Alkinas turi du π ryšius, todėl su halogenu ar vandenilio halogenidu gali reaguoti du kartus. Pirmojo ekvivalento produktas yra alkenas (halogenalkenas), antrojo – sotusis junginys. Halogenovandenilis jungiasi pagal Markovnikovo taisyklę (antrasis HX – prie to paties atomo), halogenas – prie abiejų atomų. Vandenilis su Pt virsta alkanu, o su Lindlaro katalizatoriumi sustoja ties alkenu.',
          'An alkyne has two π bonds, so it can react twice with a halogen or a hydrogen halide. The product of the first equivalent is an alkene (a haloalkene), that of the second a saturated compound. A hydrogen halide adds by Markovnikov’s rule (the second HX to the same carbon), a halogen goes onto both carbons. Hydrogen over Pt gives the alkane, over the Lindlar catalyst it stops at the alkene.'),
        src: 'L8 p9, p14, p18'
      };
    }
  };

  // ---------- u08.hydr: hydration of alkynes (HgSO4) ----------
  const T_HYDR = {
    id: 'u08.hydr',
    title: t('Alkinų hidratacija: enolis ir karbonilinis junginys', 'Hydration of alkynes: the enol and the carbonyl compound'),
    mirrors: ['S4.7', 'S4.16'],
    gen(rng, ctx) {
      const smi = ctx.pick(YN_ALL.concat(['C#C']));
      const inf = alkyneInfo(ctx, smi);
      const ethyne = smi === 'C#C';
      const sites = inf.terminal ? [inf.inner] : [inf.a, inf.b];
      const ketone = (x) => rewrite(smi, [[inf.a, inf.b, 1]], null, { [x]: ['(=O)'] });
      const enol = (x) => rewrite(smi, [[inf.a, inf.b, 2]], null, { [x]: ['(O)'] });
      const alcohol = rewrite(smi, [[inf.a, inf.b, 1]], null, { [sites[0]]: ['(O)'] });
      const rightsK = sites.map(ketone);
      const eng = engineMajors(ctx, 'yne.hydration', smi, {});
      if (!sameSet(ctx, eng, rightsK)) throw new Error('u08.hydr: engine disagrees for ' + smi);
      const tie = rightsK.length > 1 && canonF(ctx, rightsK[0]) !== canonF(ctx, rightsK[1]);
      const rightsE = tie ? sites.map(enol) : [enol(sites[0])];
      const steps = [];

      // 1: the first product
      const e1 = molOptions(ctx, rightsE, (inf.terminal && !ethyne ? [enol(inf.term)] : []).concat([ketone(sites[0]), alcohol, ethyne ? 'C1CO1' : null]), 5);
      steps.push({
        prompt: tie ? t('Kokie nepatvarūs junginiai (enoliai) susidaro pirmojoje stadijoje? Pažymėkite visus.', 'Which unstable compounds (enols) form in the first stage? Pick them all.') : t('Koks nepatvarus junginys (enolis) susidaro pirmojoje stadijoje?', 'Which unstable compound (the enol) forms in the first stage?'),
        kind: tie ? 'multi' : 'choice', options: e1.options, answer: tie ? e1.right : e1.right[0],
        hint: t('Vanduo prisijungia prie trigubojo ryšio: lieka dvigubasis ryšys, o viename atome atsiranda $OH$.', 'Water adds across the triple bond: a double bond remains and one carbon gets an $OH$ group.'),
        solution: [{ p: inf.terminal && !ethyne
          ? t('Pagal Markovnikovo taisyklę $OH$ jungiasi prie vidinio atomo (Nr. ' + (inf.inner + 1) + '), o vandenilis – prie galinio. Enolyje $OH$ yra prie dvigubojo ryšio atomo.', 'By Markovnikov’s rule the $OH$ goes to the inner carbon (no. ' + (inf.inner + 1) + ') and the hydrogen to the terminal one. In an enol the $OH$ sits on a double-bond carbon.')
          : t('Vandens $OH$ jungiasi prie vieno trigubojo ryšio atomo, $H$ – prie kito; gaunamas alkenolis (enolis), kuriame $OH$ yra prie dvigubojo ryšio atomo.', 'The $OH$ of water bonds to one triple-bond carbon and the $H$ to the other; an alkenol (enol) results, with the $OH$ on a double-bond carbon.') }]
          .concat(e1.right.map(i => ({ mol: e1.options[i].mol })))
      });

      // 2: the final product
      const k2 = molOptions(ctx, rightsK, (inf.terminal && !ethyne ? [ketone(inf.term)] : []).concat([enol(sites[0]), alcohol, ethyne ? 'CC(=O)O' : null, ethyne ? 'CCO' : null]), 5);
      const nk = k2.right.length;
      steps.push({
        prompt: tie ? t('Pažymėkite visus galutinius produktus (enolis izomerizuojasi).', 'Pick all final products (the enol isomerises).') : t('Koks yra galutinis produktas?', 'What is the final product?'),
        kind: tie ? 'multi' : 'choice', options: k2.options, answer: tie ? k2.right : k2.right[0],
        hint: t('Enolis (OH prie dvigubojo ryšio atomo) nepatvarus ir izomerizuojasi: vandenilis pereina nuo deguonies, o C=C virsta C=O.', 'The enol (OH on a double-bond carbon) is unstable and isomerises: the hydrogen leaves oxygen and the C=C becomes C=O.'),
        solution: [{ p: ethyne
          ? t('Etinas vienintelis duoda aldehidą: enolis izomerizuojasi į etanalį.', 'Ethyne is the only alkyne that gives an aldehyde: the enol isomerises to ethanal.')
          : inf.terminal
            ? t('Enolis izomerizuojasi: $C=O$ susidaro prie atomo, turėjusio $OH$, todėl gaunamas ketonas (metilketonas), ne aldehidas.', 'The enol isomerises: the $C=O$ forms at the carbon that carried the $OH$, so a ketone (a methyl ketone) results, not an aldehyde.')
            : tie
              ? t('Abu enoliai izomerizuojasi į ketonus. Kadangi trigubojo ryšio atomus supa skirtingi pakaitai, susidaro du ketonai, panašiais kiekiais.', 'Both enols isomerise to ketones. Because the triple-bond carbons carry different substituents, two ketones form in similar amounts.')
              : t('Enolis izomerizuojasi į ketoną. Alkinas simetrinis, todėl susidaro vienas ketonas.', 'The enol isomerises to a ketone. The alkyne is symmetric, so one ketone forms.') }]
          .concat(k2.right.map(i => ({ mol: k2.options[i].mol })))
      });
      if (!tie) {
        const ns = nameStep(ctx, rightsK[0], t('Pavadinkite produktą.', 'Name the product.'));
        if (ns) steps.push(ns);
      }
      return {
        q: [{ p: t('Alkinas hidratuojamas gyvsidabrio druskų ir sieros rūgšties tirpale.', 'The alkyne is hydrated with mercury salts in sulfuric acid.') },
          { scheme: { items: [{ smi, opts: { numbers: 'all' } }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H2SO4, HgSO4') }] } }],
        steps,
        why: t('Vanduo prie alkino jungiasi tik esant gyvsidabrio druskų. Pirmiausia susidaro enolis (OH prie dvigubojo ryšio atomo), bet jis nepatvarus ir izomerizuojasi į karbonilinį junginį. Pakeisti alkinai duoda ketonus, aldehidą duoda tik etinas. Nesimetrinis internalinis alkinas duoda dviejų ketonų mišinį.',
          'Water adds to an alkyne only with mercury salts. An enol (OH on a double-bond carbon) forms first, but it is unstable and isomerises to a carbonyl compound. Substituted alkynes give ketones, and only ethyne gives an aldehyde. An unsymmetrical internal alkyne gives a mixture of two ketones.'),
        src: 'L8 p10, p11'
      };
    }
  };

  // ---------- u08.yneox: KMnO4 cleavage of alkynes ----------
  const T_YOX = {
    id: 'u08.yneox',
    title: t('Alkinų oksidavimas $KMnO4$', 'Oxidation of alkynes with $KMnO4$'),
    mirrors: [],
    gen(rng, ctx) {
      const { react } = ctx;
      const smi = ctx.pick(YN_ALL);
      const inf = alkyneInfo(ctx, smi);
      const res = react.run('ox.kmno4.harsh', [smi], {});
      const acids = res.products.filter(p => !p.by).map(p => p.smi);
      const co2 = res.products.some(p => p.by);
      if (!acids.length || (inf.terminal && !co2)) throw new Error('u08.yneox: unexpected engine result for ' + smi);
      const prods = acids.concat(co2 ? ['O=C=O'] : []);
      const setOpt = (list) => (list.length === 1 ? { mol: { smi: list[0] } }
        : { scheme: { items: list.reduce((acc, s, i) => acc.concat(i ? [{ plus: true }] : [], [{ smi: s }]), []) } });
      const ald = (s) => (/\(O\)=O$/.test(s) ? s.replace(/\(O\)=O$/, '=O') : null);
      const alds = acids.map(ald);
      const diketo = rewrite(smi, [[inf.a, inf.b, 1]], null, { [inf.a]: ['(=O)'], [inf.b]: ['(=O)'] });
      const hydr = engineMajors(ctx, 'yne.hydration', smi, {})[0];
      const cand = [];
      if (alds.every(Boolean)) cand.push(alds.concat(co2 ? ['C=O'] : []));
      cand.push([diketo]);
      if (co2) cand.push(acids.concat(['OC=O']));
      else if (acids.length > 1) cand.push([acids[0]]);
      cand.push([hydr]);
      const seen = new Set([prods.map(s => canonF(ctx, s)).sort().join('|')]);
      const options = [setOpt(prods)];
      cand.forEach(s => {
        const k = s.map(x => canonF(ctx, x)).sort().join('|');
        if (!seen.has(k) && options.length < 5) { seen.add(k); options.push(setOpt(s)); }
      });
      const steps = [{
        prompt: acids.length === 1 && !co2 ? t('Kokie produktai susidaro kaitinant su šarminiu $KMnO4$ tirpalu ir parūgštinus? (Vienodi fragmentai pavaizduoti vieną kartą.)', 'Which products form with hot alkaline $KMnO4$ (after acidification)? (Identical fragments are drawn once.)') : t('Kokie produktai susidaro kaitinant su šarminiu $KMnO4$ tirpalu ir parūgštinus?', 'Which products form with hot alkaline $KMnO4$ (after acidification)?'),
        kind: 'choice', options, answer: 0,
        hint: t('Stiprus oksidatorius nutraukia ryšį tarp abiejų trigubojo ryšio atomų. Kuo virsta kiekvienas iš jų?', 'A strong oxidant cleaves the bond between the two triple-bond carbons. What does each of them become?'),
        solution: [{ p: inf.terminal
          ? t('Grandinė nutrūksta ties trigubuoju ryšiu: pakeistas atomas virsta karboksirūgštimi, o galinis $≡C-H$ atomas oksiduojamas iki $CO2$.', 'The chain is cut at the triple bond: the substituted carbon becomes a carboxylic acid and the terminal $≡C-H$ carbon is oxidised to $CO2$.')
          : acids.length === 1
            ? t('Grandinė nutrūksta ties trigubuoju ryšiu: abu atomai virsta rūgšties grupėmis. Alkinas simetrinis, todėl iš jo susidaro dvi tos pačios rūgšties molekulės (2 ×).', 'The chain is cut at the triple bond: both carbons become acid groups. The alkyne is symmetric, so two molecules of the same acid form (2 ×).')
            : t('Grandinė nutrūksta ties trigubuoju ryšiu: abu atomai virsta karboksirūgščių grupėmis ir susidaro dvi skirtingos rūgštys.', 'The chain is cut at the triple bond: both carbons become carboxylic acid groups, giving two different acids.') },
          { scheme: { items: [{ smi }, { arrow: '→', above: f('KMnO4, OH-, t°; H3O+') }].concat(prods.reduce((acc, s, i) => acc.concat(i ? [{ plus: true }] : [], [{ smi: s }]), [])), maxWidth: 560 } }]
      }];
      const bigAcid = acids.slice().sort((p, q) => q.length - p.length)[0];
      const ns = nameStep(ctx, bigAcid, t('Pavadinkite didesnę susidariusią rūgštį.', 'Name the larger acid that forms.'),
        t('Rūgštis pavadinama pagal grandinę su $COOH$ grupe: numeravimas prasideda nuo jos anglies; galūnė -o rūgštis.', 'The acid is named after the chain that includes the $COOH$ group: numbering starts at its carbon; the ending is -oic acid.'));
      if (ns) steps.push(ns);
      return {
        q: [{ p: t('Alkinas oksiduojamas stipriu oksidatoriumi.', 'The alkyne is oxidised with a strong oxidant.') },
          { scheme: { items: [{ smi }, { arrow: '→', above: f('KMnO4, OH-, t°; H3O+') }] } }],
        steps,
        why: t('Šarminis $KMnO4$ nutraukia alkino trigubąjį ryšį: kiekvienas buvęs ryšio atomas virsta karboksirūgšties grupe. Jei trigubasis ryšys grandinės gale, galinis atomas tampa $CO2$. Alkenai skyla taip pat, todėl šiuo bandymu dvigubojo ryšio nuo trigubojo neatskirsite.',
          'Alkaline $KMnO4$ cleaves the triple bond of an alkyne: each former triple-bond carbon becomes a carboxylic acid group. If the triple bond is at the end of the chain, the terminal carbon becomes $CO2$. Alkenes are cleaved in the same way, so this test cannot tell a double bond from a triple bond.'),
        src: 'L8 p15'
      };
    }
  };

  // ---------- u08.acid: terminal alkynes are acidic ----------
  const ENES = ['C=CC', 'CC=CC', 'C=CCC', 'CC=CCC', 'CC(C)=CC', 'C=CCCC', 'C1=CCCCC1', 'CC=C(C)C', 'C=CC(C)C', 'CCC=CCC', 'CCC=CC', 'C=CCCCC'];
  const ANES = ['CCCC', 'CCCCC', 'CC(C)C', 'C1CCCCC1', 'CCCCCC', 'CC(C)CC'];
  const T_ACID = {
    id: 'u08.acid',
    title: t('Terminalinių alkinų rūgštingumas: $NaNH2$ ir $CuCl/NH3$', 'The acidity of terminal alkynes: $NaNH2$ and $CuCl/NH3$'),
    mirrors: ['S4.7', 'S4.16'],
    gen(rng, ctx) {
      const na = ctx.pick([true, false]);
      const nT = ctx.pick([1, 1, 2]);
      const terms = ctx.shuffle(YN_T).slice(0, nT);
      const ints = ctx.shuffle(YN_S.concat(YN_U)).slice(0, 1);
      const enes = ctx.shuffle(ENES).slice(0, 1);
      const anes = ctx.pick([0, 1]) ? ctx.shuffle(ANES).slice(0, 1) : [];
      const all = terms.concat(ints, enes, anes);
      const order = ctx.shuffle(all);
      const answer = order.map((s, i) => (terms.indexOf(s) >= 0 ? i : -1)).filter(i => i >= 0);
      const first = order.find(s => terms.indexOf(s) >= 0);
      const inf = alkyneInfo(ctx, first);
      const reag = na ? t('$NaNH2$ skystame amoniake', '$NaNH2$ in liquid ammonia') : t('$CuCl$ ir $NH3$ tirpalas', 'a solution of $CuCl$ and $NH3$');
      const steps = [{
        prompt: t('Kurie junginiai reaguoja? Pažymėkite visus.', 'Which compounds react? Pick them all.'),
        kind: 'multi', options: order.map(s => ({ mol: { smi: s } })), answer,
        hint: t('Pagalvokite, kuriame iš šių junginių yra pakankamai rūgštus $C-H$ ryšys (sp hibridizuoto atomo).', 'Think about which of these has a sufficiently acidic $C-H$ bond (on an sp carbon).'),
        solution: t('Reaguoja tik terminaliniai alkinai: sp atomas elektroneigiamesnis už sp² ir sp³, todėl ≡C–H vandenilis rūgštus (pKa apie 25). Alkenų (pKa apie 44), alkanų (apie 50) ir internalinių alkinų (nėra ≡C–H) šis reagentas neveikia.',
          'Only terminal alkynes react: an sp carbon is more electronegative than sp² or sp³, so the ≡C–H hydrogen is acidic (pKa about 25). Alkenes (pKa about 44), alkanes (about 50) and internal alkynes (no ≡C–H) are not affected by this reagent.')
      }];
      // the product of the first terminal alkyne
      const right = na ? rewrite(first, [], { [inf.term]: '[C-]' }) + '.[Na+]' : rewrite(first, [], null, { [inf.term]: ['[Cu]'] });
      const wrongs = na
        ? [rewrite(first, [[inf.a, inf.b, 2]], null, { [inf.inner]: ['([Na])'] }), rewrite(first, [], { 0: '[CH2-]' }) + '.[Na+]', rewrite(first, [[inf.a, inf.b, 2]], null, { [inf.inner]: ['(N)'] })]
        : [rewrite(first, [[inf.a, inf.b, 2]], null, { [inf.inner]: ['([Cu])'] }), '[Cu]' + first, rewrite(first, [[inf.a, inf.b, 2]], null, { [inf.inner]: ['(Cl)'] })];
      const po = molOptions(ctx, [right], wrongs, 4);
      steps.push({
        mol: { smi: first },
        prompt: t('Kokį organinį produktą duoda šis alkinas?', 'What organic product does this alkyne give?'),
        kind: 'choice', options: po.options, answer: 0,
        hint: na ? t('Stipri bazė atplėšia protoną. Nuo kurio atomo ir kas lieka kaip organinė dalelė?', 'A strong base removes a proton. From which atom, and what organic species is left?')
          : t('Metalas pakeičia rūgštinį vandenilį. Kuris tai vandenilis?', 'The metal replaces the acidic hydrogen. Which hydrogen is that?'),
        solution: [{ p: na ? t('Amido jonas $NH2-$ atplėšia protoną nuo ≡C–H: susidaro acetilenido anijonas (natrio acetilenidas) ir amoniakas.', 'The amide ion $NH2-$ removes the proton from ≡C–H: an acetylide anion (sodium acetylide) and ammonia form.')
          : t('Jonas $Cu+$ pakeičia ≡C–H vandenilį: susidaro vario acetilenidas, o kartu – amonio chloridas.', 'A $Cu+$ ion replaces the ≡C–H hydrogen: copper acetylide forms, together with ammonium chloride.') },
          { mol: { smi: right } }]
      });
      if (na) {
        steps.push({
          prompt: t('Kuris junginys susidaro kartu su acetilenidu?', 'Which compound forms together with the acetylide?'),
          kind: 'choice', options: [{ mol: { smi: 'N' } }, { mol: { smi: '[H][H]' } }, { mol: { smi: '[Na+].[OH-]' } }, { mol: { smi: '[Na+].[H-]' } }], answer: 0,
          hint: t('Amido jonas atplėšia protoną: kas iš jo tampa?', 'The amide ion removes a proton: what does it turn into?'),
          solution: t('$NH2-$ + $H+$ → $NH3$: amoniakas yra konjuguotoji rūgštis. Reakcija vyksta, nes $NH3$ (pKa apie 35) daug silpnesnė rūgštis už alkiną (pKa apie 25).', '$NH2-$ + $H+$ → $NH3$: ammonia is the conjugate acid. The reaction goes because $NH3$ (pKa about 35) is a much weaker acid than the alkyne (pKa about 25).')
        });
      } else {
        steps.push({
          prompt: t('Ką pastebėsime mėgintuvėlyje?', 'What is observed in the test tube?'),
          kind: 'choice',
          options: [
            { text: t('Iškrenta rausvai rudos vario acetilenido nuosėdos.', 'Red-brown copper acetylide precipitates.') },
            { text: t('Violetinė spalva išnyksta ir iškrenta rudos nuosėdos.', 'The violet colour disappears and a brown precipitate forms.') },
            { text: t('Geltonas tirpalas išblunka.', 'A yellow solution loses its colour.') },
            { text: t('Susidaro balti kristalai.', 'White crystals form.') }
          ],
          answer: 0,
          hint: t('Šis bandymas skiria terminalinius alkinus nuo kitų junginių su $C≡C$ ar $C=C$. Kokį požymį duoda tik jis?', 'This test separates terminal alkynes from other compounds with $C≡C$ or $C=C$. What sign does only it give?'),
          solution: t('Vario acetilenidas netirpsta ir iškrenta kaip rausvai rudos nuosėdos: tai terminalinių alkinų atpažinimo reakcija. Bromo vanduo ir $KMnO4$ išblunka nuo bet kurio nesotaus junginio, todėl jie ≡C–H neatskiria.', 'Copper acetylide is insoluble and precipitates as red-brown solid: this is the test for terminal alkynes. Bromine water and $KMnO4$ are decolourised by any unsaturated compound, so they cannot recognise ≡C–H.')
        });
      }
      return {
        q: [{ p: t('Kiekvienas iš šių junginių atskirai veikiamas reagentu: ' + reag.lt + '.', 'Each of these compounds is treated separately with ' + reag.en + '.') }],
        steps,
        why: t('Sp hibridizuotas anglies atomas yra elektroneigiamesnis už sp² ir sp³, todėl terminalinio alkino ≡C–H ryšys yra rūgštus (pKa apie 25, alkeno apie 44, alkano apie 50). Stipri bazė $NaNH2$ atplėšia protoną ir susidaro acetilenido anijonas, o su $Cu+$ iškrenta vario acetilenidas. Internaliniai alkinai ir alkenai šių reakcijų neduoda.',
          'An sp hybridised carbon is more electronegative than sp² or sp³, so the ≡C–H bond of a terminal alkyne is acidic (pKa about 25, alkene about 44, alkane about 50). The strong base $NaNH2$ removes the proton and an acetylide anion forms, and with $Cu+$ copper acetylide precipitates. Internal alkynes and alkenes do not react.'),
        src: 'L8 p12'
      };
    }
  };

  // ---------- u08.alk: building an internal alkyne by alkylating an acetylide ----------
  //   pre: written before the sp carbon; suf: written after it (the attached atom first); ok: a methyl or primary carbon, where SN2 works
  const ALKYL = [
    { pre: 'C', suf: 'C', ok: true }, { pre: 'CC', suf: 'CC', ok: true }, { pre: 'CCC', suf: 'CCC', ok: true }, { pre: 'CCCC', suf: 'CCCC', ok: true },
    { pre: 'CC(C)C', suf: 'CC(C)C', ok: true }, { pre: 'CC(C)', suf: 'C(C)C', ok: false }, { pre: 'CCC(C)', suf: 'C(C)CC', ok: false }, { pre: 'CC(C)(C)', suf: 'C(C)(C)C', ok: false }
  ];
  const T_ALK = {
    id: 'u08.alk',
    title: t('Acetilenidų alkilinimas: alkino sintezė', 'Alkylation of acetylides: building an alkyne'),
    mirrors: [],
    gen(rng, ctx) {
      const { chem } = ctx;
      let R1, R2;
      for (let k = 0; k < 40; k++) {
        R1 = ctx.pick(ALKYL); R2 = ctx.pick(ALKYL);
        if (R1.ok || R2.ok) break;
      }
      if (!R1.ok && !R2.ok) throw new Error('u08.alk: no pair');
      const X = ctx.pick(['Br', 'I', 'Cl']);
      const target = R1.pre + 'C#C' + R2.suf;
      const routeA = [R1.pre + 'C#C', X + R2.suf];          // alkyne R1, halide R2
      const routeB = [R2.pre + 'C#C', X + R1.suf];          // alkyne R2, halide R1
      const wrongAlkene = [R1.pre + 'C=C', X + R2.suf];
      let wrongInt = [R1.pre + 'C#CC', X + R2.suf];
      if (canon(ctx, R1.pre + 'C#CC' + R2.suf) === canon(ctx, target) || canon(ctx, wrongInt[0]) === canon(ctx, routeA[0])) wrongInt = [R1.pre + 'C#C', X + (R2.ok ? 'CC(C)C' : R2.suf)];
      const scheme = (pair) => ({ scheme: { items: [{ smi: pair[0] }, { plus: true }, { smi: pair[1] }], maxWidth: 420 } });
      const key = (pair) => pair.map(s => canon(ctx, s)).sort().join('|');
      const cands = [{ pair: routeA, good: R2.ok }, { pair: routeB, good: R1.ok }, { pair: wrongAlkene, good: false }, { pair: wrongInt, good: false }];
      const seen = new Set();
      const opts = [];
      cands.forEach(c => { const k = key(c.pair); if (!seen.has(k)) { seen.add(k); opts.push(c); } });
      opts.sort((p, q) => (q.good ? 1 : 0) - (p.good ? 1 : 0));            // right ones first
      const answer = opts.map((c, i) => (c.good ? i : -1)).filter(i => i >= 0);
      const multi = answer.length > 1;
      const steps = [{
        prompt: multi ? t('Kaip pagaminti šį alkiną? Pažymėkite visus tinkamus būdus (alkinas veikiamas $NaNH2$, po to – halogenalkanu).', 'How can this alkyne be made? Pick every suitable route (the alkyne is treated with $NaNH2$, then with the haloalkane).')
          : t('Kaip pagaminti šį alkiną? Pasirinkite tinkamą būdą (alkinas veikiamas $NaNH2$, po to – halogenalkanu).', 'How can this alkyne be made? Pick the suitable route (the alkyne is treated with $NaNH2$, then with the haloalkane).'),
        kind: multi ? 'multi' : 'choice', options: opts.map(c => scheme(c.pair)), answer: multi ? answer : answer[0],
        hint: t('Reikia terminalinio alkino (kad turėtų rūgštų ≡C–H) ir halogenalkano. Acetilenido anijonas yra nukleofilas: kokį halogenalkaną jis gali pakeisti?', 'You need a terminal alkyne (so that it has an acidic ≡C–H) and a haloalkane. The acetylide anion is a nucleophile: which haloalkane can it substitute?'),
        solution: t('Acetilenido anijonas pakeičia halogeną SN2 mechanizmu, todėl tinka metilo ir pirminiai halogenalkanai. Alkenas neturi rūgštaus vandenilio, o internalinis alkinas neturi ≡C–H, todėl šie variantai netinka.',
          'The acetylide anion replaces the halogen by SN2, so methyl and primary haloalkanes work. An alkene has no acidic hydrogen and an internal alkyne has no ≡C–H, so those routes fail.')
      }];
      if (!(R1.ok && R2.ok)) {
        steps.push({
          prompt: t('Kodėl netinka būdas su antriniu arba tretiniu halogenalkanu?', 'Why does the route with the secondary or tertiary haloalkane fail?'),
          kind: 'choice',
          options: [
            { text: t('Acetilenido anijonas yra ir stipri bazė: su šakotu halogenalkanu vyksta eliminavimas (alkenas), o ne pakeitimas.', 'The acetylide anion is also a strong base: with a branched haloalkane elimination (an alkene) wins over substitution.') },
            { text: t('Antriniai ir tretiniai halogenalkanai neturi nueinančios grupės.', 'Secondary and tertiary haloalkanes have no leaving group.') },
            { text: t('Šakotas alkinas nėra pakankamai rūgštus, kad prarastų protoną.', 'A branched alkyne is not acidic enough to lose a proton.') },
            { text: t('Natrio acetilenidas su jokiais halogenalkanais nereaguoja.', 'Sodium acetylide does not react with any haloalkane.') }
          ],
          answer: 0,
          hint: t('Acetilenido anijonas yra ne tik nukleofilas, bet ir bazė. Ką stipri bazė daro su sunkiai prieinama C–X vieta?', 'The acetylide anion is a base as well as a nucleophile. What does a strong base do with a hindered C–X carbon?'),
          solution: t('Prie šakoto atomo nukleofilui sunku prieiti, o bazė lengvai atplėšia gretimą protoną: vyksta eliminavimas (E2). Todėl šakotas fragmentas imamas kaip alkinas, o halogenalkanas parenkamas pirminis arba metilo.', 'A nucleophile cannot easily reach a branched carbon, but a base easily removes a neighbouring proton: elimination (E2) takes over. So the branched part is taken as the alkyne, and the haloalkane is methyl or primary.')
        });
      }
      const ns = nameStep(ctx, target, t('Pavadinkite sintezuojamą alkiną.', 'Name the alkyne that is made.'));
      if (ns) steps.push(ns);
      return {
        q: [{ p: t('Reikia pagaminti šį internalinį alkiną iš mažesnių dalių.', 'This internal alkyne is to be built from smaller pieces.') }, { mol: { smi: target } }],
        steps,
        why: t('Terminalinis alkinas su $NaNH2$ virsta acetilenidu, kuris yra stiprus nukleofilas ir SN2 mechanizmu pakeičia halogenalkano halogeną: prailgėja anglies grandinė. Taip iš terminalinio alkino gaunamas internalinis. Kadangi acetilenidas ir bazė, halogenalkanas turi būti metilo arba pirminis.',
          'A terminal alkyne with $NaNH2$ becomes an acetylide, a strong nucleophile that replaces the halogen of a haloalkane by SN2, lengthening the carbon chain. This turns a terminal alkyne into an internal one. Because the acetylide is also a base, the haloalkane must be methyl or primary.'),
        src: 'L8 p13'
      };
    }
  };

  /* ================================================================ notes */
  const NOTES = [
    /* ---------------------------------------------------------- 1 */
    {
      id: 'dienes',
      title: t('Dienai: trys tipai', 'Dienes: three kinds'),
      blocks: [
        { h: t('Kaip išsidėsto du dvigubieji ryšiai?', 'Where do the two double bonds sit?') },
        {
          p: t('Dienai yra angliavandeniliai su dviem dvigubaisiais ryšiais (jų yra, pvz., imbiero aliejuje – zingiberenas). Jų savybes lemia ir tai, kaip ryšiai išsidėstę vienas kito atžvilgiu.',
            'Dienes are hydrocarbons with two double bonds (zingiberene in ginger oil is one). Their properties depend on where the bonds sit relative to each other.'),
          src: 'L8 p2'
        },
        {
          mol: [
            { smi: 'C=C=C', name: t('propadienas', 'propa-1,2-diene'), caption: t('kumuliuotasis', 'cumulated') },
            { smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene'), caption: t('konjuguotasis', 'conjugated') },
            { smi: 'C=CCC=C', name: t('1,4-pentadienas', 'penta-1,4-diene'), caption: t('izoliuotasis', 'isolated') }
          ],
          src: 'L8 p2'
        },
        {
          table: {
            head: [t('Tipas', 'Kind'), t('Dvigubieji ryšiai', 'Double bonds'), t('Elgesys', 'Behaviour')],
            rows: [
              [t('Kumuliuotasis', 'Cumulated'), t('turi bendrą C atomą', 'share a carbon atom'), t('sutinkamas retai', 'rare')],
              [t('Konjuguotasis', 'Conjugated'), t('juos skiria vienas vienaryšis ryšys', 'separated by one single bond'), t('stabiliausias, ypatingos reakcijos', 'most stable, special reactions')],
              [t('Izoliuotasis', 'Isolated'), t('juos skiria bent vienas sp³ atomas', 'separated by at least one sp³ carbon'), t('abu ryšiai reaguoja nepriklausomai', 'the two bonds react independently')]
            ]
          },
          src: 'L8 p2; T p58'
        },
        {
          rule: t('Konjuguotasis dienas: dvigubuosius ryšius skiria lygiai vienas vienaryšis ryšys. Keturių sp² atomų p orbitalės persikloja per visą sistemą, todėl π elektronai pasiskirsto per keturis atomus ir toks dienas yra stabilesnis už kitus.',
            'Conjugated diene: exactly one single bond separates the double bonds. The p orbitals of four sp² carbons overlap along the whole system, so the π electrons are shared by four atoms and the diene is more stable than the other kinds.'),
          src: 'L8 p2; T p58'
        },
        {
          mol: { smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene'), opts: { highlight: { atoms: [0, 1, 2, 3], tone: 1 } }, caption: t('keturi sp² atomai', 'four sp² atoms') },
          src: 'T p58'
        },
        {
          pitfall: t('Du dvigubieji ryšiai dar nereiškia konjugacijos: 1,4-pentadiene tarp jų yra sp³ atomas, todėl jis izoliuotasis.',
            'Two double bonds do not mean conjugation: in penta-1,4-diene an sp³ carbon lies between them, so it is isolated.')
        },
        {
          example: {
            q: [{ p: t('Kuris iš šių heksadienų yra konjuguotasis?', 'Which of these hexadienes is conjugated?') },
              { mol: [{ smi: 'CC=CC=CC', name: t('2,4-heksadienas', 'hexa-2,4-diene') }, { smi: 'C=CCC=CC', name: t('1,4-heksadienas', 'hexa-1,4-diene') }, { smi: 'CC=C=CCC', name: t('2,3-heksadienas', 'hexa-2,3-diene') }] }],
            steps: [
              [{ p: t('Tarp dvigubųjų ryšių: 2,4-heksadiene – vienas vienaryšis ryšys; 1,4-heksadiene – sp³ atomas (CH₂); 2,3-heksadiene – bendras atomas.', 'Between the double bonds: hexa-2,4-diene has one single bond; hexa-1,4-diene an sp³ carbon (CH₂); hexa-2,3-diene a shared atom.') }],
              [{ p: t('Konjuguotasis yra tik 2,4-heksadienas; 1,4- yra izoliuotasis, 2,3- kumuliuotasis.', 'Only hexa-2,4-diene is conjugated; the 1,4 isomer is isolated and the 2,3 isomer is cumulated.') }]
            ]
          },
          claims: [{ name: ['CC=CC=CC', t('2,4-heksadienas', 'hexa-2,4-diene')] }, { name: ['C=CCC=CC', t('1,4-heksadienas', 'hexa-1,4-diene')] }, { name: ['CC=C=CCC', t('2,3-heksadienas', 'hexa-2,3-diene')] }]
        },
        { practice: 'u08.dtype' }
      ]
    },
    /* ---------------------------------------------------------- 2 */
    {
      id: 'dadd',
      title: t('Konjuguotųjų dienų prijungimas: 1,2 ir 1,4', 'Addition to conjugated dienes: 1,2 and 1,4'),
      blocks: [
        { h: t('Du produktai iš vieno reagento', 'Two products from one reagent') },
        {
          p: t('Su ekvivalentu halogeno ar vandenilio halogenido konjuguotasis dienas paprastai duoda du produktus. 1,2-produkte abi reagento dalys yra gretimuose atomuose, o 1,4-produkte – konjuguotosios sistemos galuose, ir dvigubasis ryšys persikelia į vidurį.',
            'With one equivalent of a halogen or a hydrogen halide a conjugated diene usually gives two products. In the 1,2 product both parts of the reagent sit on adjacent carbons; in the 1,4 product they sit at the ends of the conjugated system and the double bond moves to the middle.'),
          src: 'L8 p5'
        },
        {
          scheme: { items: [{ smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene') }, { plus: true }, { smi: 'Br' }, { arrow: '→' },
            { smi: 'CC(Br)C=C', name: t('3-brom-1-butenas', '3-bromobut-1-ene'), caption: t('1,2-produktas', '1,2 product') }, { plus: true },
            { smi: 'CC=CCBr', name: t('1-brom-2-butenas', '1-bromobut-2-ene'), caption: t('1,4-produktas', '1,4 product') }], maxWidth: 640 },
          src: 'L8 p5'
        },
        {
          scheme: { items: [{ smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene') }, { plus: true }, { smi: 'ClCl' }, { arrow: '→' },
            { smi: 'C=CC(Cl)CCl', name: t('3,4-dichlor-1-butenas', '3,4-dichlorobut-1-ene'), caption: t('1,2-produktas', '1,2 product') }, { plus: true },
            { smi: 'ClCC=CCCl', name: t('1,4-dichlor-2-butenas', '1,4-dichlorobut-2-ene'), caption: t('1,4-produktas', '1,4 product') }], maxWidth: 640 },
          src: 'L8 p5'
        },
        {
          rule: t('Konjuguotasis dienas su vienu ekvivalentu $HX$ ar $X2$ duoda 1,2- ir 1,4-prijungimo produktų mišinį; jų santykis priklauso nuo sąlygų. Jei aliltipo katijonas simetriškas, abu produktai sutampa (žr. 1,3-pentadieno pavyzdį).',
            'A conjugated diene with one equivalent of $HX$ or $X2$ gives a mixture of 1,2 and 1,4 addition products; their ratio depends on the conditions. If the allylic cation is symmetric, the two products are the same compound (see the penta-1,3-diene example).'),
          src: 'L8 p5; T p58'
        },
        {
          p: t('Antras ekvivalentas prisijungia prie likusio dvigubojo ryšio.', 'A second equivalent adds to the remaining double bond.'),
        },
        {
          scheme: { items: [{ smi: 'ClCC=CCCl', name: t('1,4-dichlor-2-butenas', '1,4-dichlorobut-2-ene') }, { plus: true }, { smi: 'ClCl' }, { arrow: '→' },
            { smi: 'ClCC(Cl)C(Cl)CCl', name: t('1,2,3,4-tetrachlorbutanas', '1,2,3,4-tetrachlorobutane') }], maxWidth: 640 }
        },
        {
          p: t('Žemoje temperatūroje dažniau vyrauja greičiau susidarantis 1,2-produktas, aukštesnėje – stabilesnis 1,4-produktas.',
            'At low temperature the faster-forming 1,2 product often predominates; at higher temperature the more stable 1,4 product wins.'),
          src: 'Klein'
        },
        {
          pitfall: t('„1,4“ – tai padėtys keturių anglies atomų konjuguotojoje sistemoje, o ne keturi prisijungę atomai.',
            '“1,4” are positions in the four-carbon conjugated system, not four added atoms.')
        },
        { practice: 'u08.dmech' }
      ]
    },
    /* ---------------------------------------------------------- 3 */
    {
      id: 'allyl',
      title: t('Alilkatijonas: iš kur 1,4-produktas', 'The allyl cation: where the 1,4 product comes from'),
      blocks: [
        { h: t('Tarpinis katijonas', 'The intermediate cation') },
        {
          p: t('Abu produktai susidaro iš tos pačios tarpinės dalelės. Pirmojoje (lėtojoje) stadijoje protonas jungiasi prie dieno galo, ir susidaro aliltipo katijonas: teigiamas krūvis yra šalia dvigubojo ryšio. Antrojoje (greitojoje) stadijoje bromidas jungiasi prie vieno iš dviejų teigiamų atomų.',
            'Both products come from the same intermediate particle. In the first (slow) stage the proton adds to an end of the diene and an allylic cation forms: the positive charge sits next to a double bond. In the second (fast) stage bromide bonds to one of two positive carbons.'),
          src: 'L8 p6'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene') }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('I stadija: π elektronai sudaro $C-H$ ryšį su galiniu atomu; susidaro aliltipo katijonas ir $Br-$.', 'Stage I: the π electrons form the $C-H$ bond at the terminal carbon; the allyl cation and $Br-$ result.')
            },
            {
              scheme: { items: [{ smi: 'C[CH+]C=C' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
              note: t('II stadija, 1,2-jungimasis: bromidas jungiasi prie atomo, esančio greta CH₃ grupės.', 'Stage II, 1,2 addition: bromide bonds to the carbon next to the CH₃ group.')
            },
            {
              scheme: { items: [{ smi: 'CC=C[CH2+]' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 3 } }],
              note: t('II stadija, 1,4-jungimasis: bromidas jungiasi prie tolimojo CH₂ galo (kita rezonansinė formulė).', 'Stage II, 1,4 addition: bromide bonds to the far CH₂ end (the other resonance structure).')
            }
          ],
          src: 'L8 p6'
        },
        {
          resonance: [{ smi: 'C[CH+]C=C' }, { smi: 'CC=C[CH2+]' }],
          caption: t('Alilkatijono dvi rezonansinės formulės. Tikrovėje teigiamas krūvis pasiskirsto tarp abiejų galinių atomų (rezonansinis hibridas).', 'The two resonance structures of the allyl cation. In reality the positive charge is shared by the two terminal carbons (the resonance hybrid).'),
          src: 'L8 p7'
        },
        {
          rule: t('Alilkatijonas stabilesnis už alkilo katijoną su lokalizuotu krūviu, nes krūvis pasidalija per du atomus. Katijonų stabilumas: benzilkatijonas > alilkatijonas > tretinis > antrinis > pirminis > metilkatijonas.',
            'An allyl cation is more stable than an alkyl cation with a localised charge, because the charge is shared by two carbons. Cation stability: benzyl > allyl > tertiary > secondary > primary > methyl.'),
          src: 'L8 p7; L7 p9'
        },
        {
          mol: { smi: 'C=CC[CH2+]', name: t('pirminis katijonas', 'primary cation'), caption: t('Protonas prie vidinio atomo: nekonjuguotas pirminis katijonas, nesusidaro.', 'Proton on an inner carbon: a non-conjugated primary cation, it does not form.') },
          src: 'L8 p6'
        },
        {
          pitfall: t('Protonas jungiasi prie dieno galo, o ne prie vidinio atomo: vidinio atomo protonizavimas duotų nekonjuguotą pirminį ar antrinį katijoną, mažai stabilų.',
            'The proton goes to an end of the diene, not to an inner carbon: protonating an inner carbon would give a non-conjugated primary or secondary cation of low stability.')
        },
        {
          example: {
            q: [{ p: t('1,3-pentadienas reaguoja su vienu ekvivalentu HBr. Kokie produktai susidaro?', 'Penta-1,3-diene reacts with one equivalent of HBr. What are the products?') },
              { mol: { smi: 'C=CC=CC', name: t('1,3-pentadienas', 'penta-1,3-diene'), opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Protonas jungiasi prie atomo Nr. 1 (galinis CH₂): teigiamas krūvis pasiskirsto tarp atomų Nr. 2 ir Nr. 4, abu antriniai.', 'The proton bonds to carbon no. 1 (the terminal CH₂): the positive charge is shared by carbons no. 2 and no. 4, both secondary.') },
                { resonance: [{ smi: 'CC=C[CH+]C' }, { smi: 'C[CH+]C=CC' }] }],
              [{ p: t('Jungiantis prie atomo Nr. 4 (kito konjuguotosios sistemos galo), krūvis dalytųsi tarp atomų Nr. 3 (antrinis) ir Nr. 1 (pirminis): toks katijonas mažiau stabilus.', 'Adding to carbon no. 4 (the other end of the conjugated system) would share the charge between carbons no. 3 (secondary) and no. 1 (primary): a less stable cation.') }],
              [{ p: t('Bromidas gali jungtis prie atomo Nr. 2 arba Nr. 4, bet abiem atvejais gaunamas tas pats junginys, nes katijonas simetriškas. Produktas vienas.', 'Bromide may bond to carbon no. 2 or no. 4, but both give the same compound, because the cation is symmetric. There is a single product.') },
                { mol: { smi: 'CC(Br)C=CC', name: t('4-brom-2-pentenas', '4-bromopent-2-ene') } }]
            ]
          },
          claims: [{ react: ['diene.hx', ['C=CC=CC'], { X: 'Br' }, 'CC(Br)C=CC'] }, { name: ['CC(Br)C=CC', t('4-brom-2-pentenas', '4-bromopent-2-ene')] }, { formula: ['C[CH+]C=CC', 'C5H9+'] }]
        },
        { practice: 'u08.dadd' }
      ]
    },
    /* ---------------------------------------------------------- 4 */
    {
      id: 'alkynes',
      title: t('Alkinai: sandara ir pavadinimai', 'Alkynes: structure and names'),
      blocks: [
        { h: t('Trigubasis ryšys', 'The triple bond') },
        {
          p: t('Alkinuose yra trigubasis ryšys: vienas σ ir du π ryšiai tarp dviejų sp hibridizuotų anglies atomų. Ryšių kampas 180°, todėl ši grandinės dalis tiesi (trigubasis ryšys yra ir vaistuose, pvz., selegiline). Alkinai gali būti terminaliniai (trigubasis ryšys gale, yra ≡C–H) arba internaliniai.',
            'Alkynes contain a triple bond: one σ and two π bonds between two sp hybridised carbons. The bond angle is 180°, so this part of the chain is straight (a triple bond occurs in drugs too, e.g. selegiline). Alkynes are terminal (triple bond at the end, with a ≡C–H) or internal.'),
          src: 'L8 p8'
        },
        {
          mol: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne'), caption: t('terminalinis', 'terminal') }, { smi: 'CC#CC', name: t('2-butinas', 'but-2-yne'), caption: t('internalinis', 'internal') },
            { smi: 'C#CCC(C)C', name: t('4-metil-1-pentinas', '4-methylpent-1-yne'), caption: t('terminalinis', 'terminal') }],
          src: 'L8 p8'
        },
        {
          rule: t('Pavadinimas: pagrindinė grandinė turi apimti trigubąjį ryšį, numeruojama nuo galo, arčiau kurio jis yra, o galūnė yra -inas.', 'Name: the main chain must contain the triple bond, is numbered from the end nearer to it, and the ending is -yne.'),
          src: 'L8 p8'
        },
        {
          table: {
            head: [t('Junginys', 'Compound'), t('Hibridizacija', 'Hybridisation'), t('Kampas', 'Angle'), t('s pobūdis', 's character')],
            rows: [
              [t('etanas', 'ethane'), t('sp³', 'sp³'), t('109,5°', '109.5°'), t('25 %', '25 %')],
              [t('etenas', 'ethene'), t('sp²', 'sp²'), t('120°', '120°'), t('33 %', '33 %')],
              [t('etinas', 'ethyne'), t('sp', 'sp'), t('180°', '180°'), t('50 %', '50 %')]
            ]
          },
          src: 'T p59; Klein'
        },
        {
          p: t('Elektrofilai alkinus atakuoja lėčiau nei alkenus. Priežastis – sp atomo elektroneigiamumas: 50 % s pobūdžio orbitalės laiko π elektronus arčiau branduolių, todėl elektrofilui jie mažiau prieinami. Tas pats elektroneigiamumas paaiškina ir terminalinio alkino ≡C–H rūgštingumą.',
            'Electrophiles attack alkynes more slowly than alkenes. The reason is the electronegativity of the sp carbon: its orbitals, 50 % s, keep the π electrons closer to the nuclei, so they are less available to an electrophile. The same electronegativity explains why the ≡C–H of a terminal alkyne is acidic.'),
          src: 'L8 p9; T p60'
        },
        {
          example: {
            q: [{ p: t('Pavadinkite alkiną ir nurodykite sp atomus.', 'Name the alkyne and point out the sp carbons.') }, { mol: { smi: 'C#CCC(C)C', name: t('4-metil-1-pentinas', '4-methylpent-1-yne'), opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Penkių anglių grandinė, numeruojama nuo trigubojo ryšio galo: sp atomai yra Nr. 1 ir Nr. 2, todėl 1-pentinas; metilas prie atomo Nr. 4.', 'A five-carbon chain numbered from the triple-bond end: the sp carbons are no. 1 and no. 2, so a pent-1-yne; the methyl is on carbon no. 4.') }],
              [{ p: t('Atomas Nr. 1 turi vandenilį: alkinas terminalinis, todėl rūgštus.', 'Carbon no. 1 carries a hydrogen: the alkyne is terminal, hence acidic.') }]
            ]
          },
          claims: [{ name: ['C#CCC(C)C', t('4-metil-1-pentinas', '4-methylpent-1-yne')] }, { hyb: ['C#CCC(C)C', 0, 'sp'] }, { hyb: ['C#CCC(C)C', 1, 'sp'] }]
        },
        {
          pitfall: t('Alkinas nėra tiesiog „alkenas su dar vienu ryšiu“: AE reakcijose jis lėtesnis už alkeną, nors π ryšių turi daugiau.', 'An alkyne is not just “an alkene with one more bond”: in AE it is slower than an alkene, although it has more π bonds.')
        },
        { practice: 'u08.name' }
      ]
    },
    /* ---------------------------------------------------------- 5 */
    {
      id: 'yadd',
      title: t('Alkinų prijungimo reakcijos', 'Addition reactions of alkynes'),
      blocks: [
        { h: t('Vienas ar du ekvivalentai', 'One or two equivalents') },
        {
          p: t('Alkinas turi du π ryšius, todėl reagento kiekis lemia, ar reakcija sustos po pirmojo prijungimo, ar vyks dar kartą (halogenu arba vandenilio halogenidu). Po pirmojo prijungimo lieka dvigubasis ryšys.',
            'An alkyne has two π bonds, so the amount of reagent decides whether the reaction stops after the first addition or goes on (with a halogen or a hydrogen halide). After the first addition a double bond remains.'),
          src: 'L8 p9, p18'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: t('1 ekv. $Br2$', '1 equiv. $Br2$') },
            { smi: 'CCC(Br)=CBr', name: t('1,2-dibrom-1-butenas', '1,2-dibromobut-1-ene') }], maxWidth: 680 },
          caption: t('Bromas jungiasi iš priešingų pusių (anti), todėl gaunamas E izomeras.', 'Bromine adds from opposite sides (anti), so the E isomer forms.'),
          src: 'L8 p18'
        },
        {
          scheme: { items: [{ smi: 'CCC(Br)=CBr', name: t('1,2-dibrom-1-butenas', '1,2-dibromobut-1-ene') }, { arrow: '→', above: t('dar 1 ekv. $Br2$', 'another 1 equiv. $Br2$') },
            { smi: 'CCC(Br)(Br)C(Br)Br', name: t('1,1,2,2-tetrabrombutanas', '1,1,2,2-tetrabromobutane') }], maxWidth: 680 },
          caption: t('Halogenas prisijungia prie abiejų atomų (vicinalinis produktas).', 'The halogen goes onto both carbons (a vicinal product).'),
          src: 'L8 p18'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: t('1 ekv. HCl', '1 equiv. HCl') },
            { smi: 'CCC(Cl)=C', name: t('2-chlor-1-butenas', '2-chlorobut-1-ene') }], maxWidth: 680 },
          src: 'L8 p9, p18'
        },
        {
          scheme: { items: [{ smi: 'CCC(Cl)=C', name: t('2-chlor-1-butenas', '2-chlorobut-1-ene') }, { arrow: '→', above: t('dar 1 ekv. HCl', 'another 1 equiv. HCl') },
            { smi: 'CCC(C)(Cl)Cl', name: t('2,2-dichlorbutanas', '2,2-dichlorobutane') }], maxWidth: 680 },
          caption: t('Abu HCl molekulės jungiasi pagal Markovnikovo taisyklę, antroji – prie to paties atomo (geminalinis produktas).', 'Both HCl molecules add by Markovnikov’s rule, the second to the same carbon (a geminal product).'),
          src: 'L8 p9, p18'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [2, 3] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('I stadija: π elektronai jungiasi su protonu; teigiamas krūvis lieka ant vidinio atomo (vinilo katijonas).', 'Stage I: the π electrons bond to the proton; the positive charge stays on the inner carbon (a vinylic cation).')
            },
            {
              scheme: { items: [{ smi: 'CC[C+]=C' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 2 } }],
              note: t('II stadija: bromidas jungiasi prie teigiamo atomo; gaunamas 2-brom-1-butenas.', 'Stage II: bromide bonds to the positive carbon; 2-bromobut-1-ene forms.')
            }
          ],
          src: 'L8 p9; T p59'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: t('2 ekv. H2, Pt', '2 equiv. H2, Pt') }, { smi: 'CCCC', name: t('butanas', 'butane') }], maxWidth: 560 },
          caption: t('Su Pt (ar Pd, Ni) tirpiklyje ir slėgyje hidrinimas nesustoja ties alkenu.', 'Over Pt (or Pd, Ni) in a solvent under pressure the hydrogenation does not stop at the alkene.'),
          src: 'L8 p14, p18'
        },
        {
          scheme: { items: [{ smi: 'CCC#CCC', name: t('3-heksinas', 'hex-3-yne') }, { arrow: '→', above: t('1 ekv. H2, Lindlaro katalizatorius', '1 equiv. H2, Lindlar catalyst') }, { smi: 'CC/C=C\\CC', name: t('(Z)-3-heksenas', '(Z)-hex-3-ene') }], maxWidth: 640 },
          caption: t('Apnuodytas Lindlaro katalizatorius sustabdo hidrinimą ties cis-alkenu.', 'The poisoned Lindlar catalyst stops the hydrogenation at the cis alkene.'),
          src: 'Klein'
        },
        {
          rule: t('HX jungiasi pagal Markovnikovo taisyklę, antrasis HX – prie to paties atomo (geminalinis dihalogenidas); $X2$ jungiasi prie abiejų atomų (vicinalinis). 2 ekv. $H2$ su Pt duoda alkaną, 1 ekv. su Lindlaro katalizatoriumi – alkeną.',
            'HX adds by Markovnikov’s rule, the second HX to the same carbon (a geminal dihalide); $X2$ goes onto both carbons (vicinal). Two equivalents of $H2$ over Pt give the alkane, one equivalent over the Lindlar catalyst gives the alkene.'),
          src: 'L8 p9, p18'
        },
        {
          pitfall: t('Nesumaišykite geminalinio ir vicinalinio produkto: iš alkino ir 2 HCl gaunamas 2,2-dichloralkanas (abu chlorai prie vieno atomo), o ne 1,2-dichloralkanas.', 'Do not mix up geminal and vicinal: an alkyne and 2 HCl give a 2,2-dichloroalkane (both chlorines on one carbon), not a 1,2-dichloroalkane.')
        },
        {
          example: {
            q: [{ p: t('3-metil-1-butinas reaguoja su dviem ekvivalentais HCl. Koks produktas?', '3-methylbut-1-yne reacts with two equivalents of HCl. What is the product?') },
              { mol: { smi: 'C#CC(C)C', name: t('3-metil-1-butinas', '3-methylbut-1-yne') } }],
            steps: [
              [{ p: t('Pirmasis HCl: protonas jungiasi prie galinio ≡C–H atomo, chloras – prie vidinio (Markovnikovas).', 'First HCl: the proton goes to the terminal ≡C–H carbon, chlorine to the inner one (Markovnikov).') },
                { mol: { smi: 'CC(C)C(Cl)=C', name: t('2-chlor-3-metil-1-butenas', '2-chloro-3-methylbut-1-ene') } }],
              [{ p: t('Antrasis HCl: protonas prisijungia prie CH₂, chloras – prie to paties atomo, prie kurio jau yra chloras.', 'Second HCl: the proton goes to the CH₂ carbon, chlorine to the carbon that already carries chlorine.') },
                { mol: { smi: 'CC(C)C(C)(Cl)Cl', name: t('2,2-dichlor-3-metilbutanas', '2,2-dichloro-3-methylbutane') } }]
            ]
          },
          claims: [{ react: ['yne.hx', ['C#CC(C)C'], { X: 'Cl', eq: 1 }, 'CC(C)C(Cl)=C'] }, { react: ['yne.hx', ['C#CC(C)C'], { X: 'Cl', eq: 2 }, 'CC(C)C(C)(Cl)Cl'] },
            { name: ['CC(C)C(Cl)=C', t('2-chlor-3-metil-1-butenas', '2-chloro-3-methylbut-1-ene')] }, { name: ['CC(C)C(C)(Cl)Cl', t('2,2-dichlor-3-metilbutanas', '2,2-dichloro-3-methylbutane')] }]
        },
        { practice: 'u08.yneadd' }
      ]
    },
    /* ---------------------------------------------------------- 6 */
    {
      id: 'hydr',
      title: t('Hidratacija ir oksidavimas', 'Hydration and oxidation'),
      blocks: [
        { h: t('Vanduo ir gyvsidabrio druskos', 'Water and mercury salts') },
        {
          p: t('Be katalizatoriaus vanduo prie trigubojo ryšio nesijungia; reakciją katalizuoja Hg²⁺ druskos ($HgSO4$ sieros rūgšties tirpale). Iš pradžių gaunamas enolis: jo $OH$ grupė yra prie dvigubojo ryšio atomo. Enolis virsta ketonu (iš etino – aldehidu).',
            'Without a catalyst water does not add to a triple bond; Hg²⁺ salts ($HgSO4$ in sulfuric acid) catalyse it. An enol forms first: its $OH$ group sits on a double-bond carbon. The enol becomes a ketone (an aldehyde from ethyne).'),
          src: 'L8 p10'
        },
        {
          scheme: { items: [{ smi: 'CC#C', name: t('propinas', 'propyne') }, { plus: true }, { smi: 'O' }, { arrow: '→', above: f('H2SO4, HgSO4') },
            { smi: 'CC(O)=C', name: t('1-propen-2-olis', 'prop-1-en-2-ol'), caption: t('enolis', 'enol') }], maxWidth: 700 },
          src: 'L8 p10'
        },
        {
          scheme: { items: [{ smi: 'CC(O)=C', name: t('1-propen-2-olis', 'prop-1-en-2-ol'), caption: t('enolis', 'enol') }, { arrow: '→', above: t('izomerizacija', 'isomerisation') },
            { smi: 'CC(C)=O', name: t('propanonas', 'propan-2-one'), caption: t('ketonas', 'ketone') }], maxWidth: 700 },
          src: 'L8 p10'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C=C(C)O' }, { plus: true }, { smi: '[OH3+]', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('Enolio π elektronai prijungia protoną prie CH₂ atomo; susidaro protonizuotas ketonas.', 'The π electrons of the enol take a proton at the CH₂ carbon; a protonated ketone forms.')
            },
            {
              scheme: { items: [{ smi: 'CC(=[OH+])C', opts: { allH: true } }, { plus: true }, { smi: 'O', opts: { lonePairs: true } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 'H2' } }, { from: { m: 0, b: [2, 'H2'] }, to: { m: 0, a: 2 } }],
              note: t('Vanduo atplėšia protoną nuo deguonies; susidaro $C=O$ ir regeneruojamas katalizatorius.', 'Water removes the proton from oxygen; $C=O$ forms and the catalyst is regenerated.')
            }
          ],
          caption: t('Enolio ir ketono izomerizacija rūgštinėje terpėje.', 'Isomerisation of the enol to the ketone in acid.'),
          src: 'L8 p10; Klein'
        },
        {
          p: t('Gyvsidabrio jonas Hg²⁺ prisijungia prie trigubojo ryšio ir sudaro trinarį tiltelinį katijoną. Vanduo jį atakuoja ties labiau pakeistu atomu, oksonio jonas netenka protono, ir susidaro gyvsidabrio enolis. Jis izomerizuojasi į gyvsidabrio ketoną. Tada karbonilo deguonis prisijungia protoną, $C-Hg$ ryšys nutrūksta, Hg²⁺ atskyla ir vėl susidaro enolis, kuris izomerizuojasi į ketoną. Hg²⁺ grįžta į tirpalą: jis yra katalizatorius.',
            'The mercury ion Hg²⁺ adds to the triple bond and forms a three-membered bridged cation. Water attacks it at the more substituted carbon, the oxonium ion loses a proton, and a mercuric enol forms. This isomerises to a mercuric ketone. The carbonyl oxygen then takes a proton, the $C-Hg$ bond breaks, Hg²⁺ leaves and an enol forms again, which isomerises to the ketone. Hg²⁺ is regenerated: it is the catalyst.'),
          src: 'L8 p11'
        },
        {
          scheme: { items: [{ smi: 'CC#C', name: t('propinas', 'propyne') }, { arrow: '→', above: f('Hg^2+^, H2O'), below: f('−H+') },
            { smi: 'CC(O)=C[Hg+]', name: t('gyvsidabrio enolis', 'mercuric enol') }, { arrow: '→', above: t('izomerizacija', 'isomerisation') },
            { smi: 'CC(=O)C[Hg+]', name: t('gyvsidabrio ketonas', 'mercuric ketone') }], maxWidth: 700 },
          src: 'L8 p11'
        },
        {
          scheme: { items: [{ smi: 'CC(=O)C[Hg+]', name: t('gyvsidabrio ketonas', 'mercuric ketone') }, { arrow: '→', above: f('H3O+'), below: f('−Hg^2+^') },
            { smi: 'CC(O)=C', name: t('1-propen-2-olis', 'prop-1-en-2-ol'), caption: t('enolis', 'enol') }, { arrow: '→', above: t('izomerizacija', 'isomerisation') },
            { smi: 'CC(C)=O', name: t('propanonas', 'propan-2-one') }], maxWidth: 700 },
          caption: t('Antroji dalis: Hg²⁺ atsiskiria ir enolis izomerizuojasi į ketoną.', 'Second part: Hg²⁺ leaves and the enol isomerises to the ketone.'),
          src: 'L8 p11'
        },
        {
          rule: t('Pakeisti alkinai hidratuojami į ketonus (terminaliniai – į metilketonus pagal Markovnikovo taisyklę); aldehidas susidaro tik iš etino. Nesimetrinis internalinis alkinas duoda dviejų ketonų mišinį.',
            'Substituted alkynes are hydrated to ketones (terminal ones to methyl ketones, by Markovnikov’s rule); an aldehyde forms only from ethyne. An unsymmetrical internal alkyne gives a mixture of two ketones.'),
          src: 'L8 p10'
        },
        {
          p: t('Stiprūs oksidatoriai (šarminis $KMnO4$) alkinus skaido per trigubąjį ryšį į karboksirūgštis; galinis ≡C–H atomas virsta $CO2$.',
            'Strong oxidants (alkaline $KMnO4$) cleave alkynes at the triple bond into carboxylic acids; a terminal ≡C–H carbon becomes $CO2$.'),
          src: 'L8 p15'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: f('KMnO4, OH-, H2O') },
            { smi: 'CCC(O)=O', name: t('propano rūgštis', 'propanoic acid') }, { plus: true }, { smi: 'O=C=O', name: t('anglies dioksidas', 'carbon dioxide') }], maxWidth: 640 },
          src: 'L8 p15'
        },
        {
          example: {
            q: [{ p: t('2-heptinas hidratuojamas ($H2SO4$, $HgSO4$). Kokie produktai?', 'Hept-2-yne is hydrated ($H2SO4$, $HgSO4$). What are the products?') },
              { mol: { smi: 'CC#CCCCC', name: t('2-heptinas', 'hept-2-yne') } }],
            steps: [
              [{ p: t('Trigubąjį ryšį supa skirtingi pakaitai (metilas ir butilas), todėl $OH$ gali jungtis prie bet kurio sp atomo: du enoliai.', 'Different substituents (methyl and butyl) flank the triple bond, so $OH$ can go to either sp carbon: two enols.') }],
              [{ p: t('Kiekvienas enolis izomerizuojasi į ketoną: iš vieno – 2-heptanonas, iš kito – 3-heptanonas.', 'Each enol isomerises to a ketone: heptan-2-one from one, heptan-3-one from the other.') },
                { mol: [{ smi: 'CCCCCC(C)=O', name: t('2-heptanonas', 'heptan-2-one') }, { smi: 'CCCCC(=O)CC', name: t('3-heptanonas', 'heptan-3-one') }] }]
            ]
          },
          claims: [{ react: ['yne.hydration', ['CC#CCCCC'], null, 'CCCCCC(C)=O'] }, { react: ['yne.hydration', ['CC#CCCCC'], null, 'CCCCC(=O)CC'] },
            { name: ['CCCCCC(C)=O', t('2-heptanonas', 'heptan-2-one')] }, { name: ['CCCCC(=O)CC', t('3-heptanonas', 'heptan-3-one')] }, { name: ['CC#CCCCC', t('2-heptinas', 'hept-2-yne')] }]
        },
        { practice: 'u08.hydr' }
      ]
    },
    /* ---------------------------------------------------------- 7 */
    {
      id: 'acidity',
      title: t('Terminalinių alkinų rūgštingumas', 'Acidity of terminal alkynes'),
      blocks: [
        { h: t('Rūgštus ≡C–H vandenilis', 'The acidic ≡C–H hydrogen') },
        {
          p: t('Alkino sp atomas elektroneigiamesnis už sp² ir sp³ atomus (50 % s pobūdžio), todėl jo konjuguotoji bazė, acetilenido anijonas, yra stabilesnė. Dėl to terminalinio alkino vandenilis gali būti pakeistas metalu.',
            'An alkyne sp carbon is more electronegative than sp² and sp³ carbons (50 % s character), so its conjugate base, the acetylide anion, is more stable. That is why the hydrogen of a terminal alkyne can be replaced by a metal.'),
          src: 'L8 p12; T p60'
        },
        {
          table: {
            head: [t('Junginys', 'Compound'), t('pKa', 'pKa')],
            rows: [[{ smi: 'C#C', name: t('etinas', 'ethyne') }, t('25', '25')], [{ smi: 'C=C', name: t('etenas', 'ethene') }, t('44', '44')], [{ smi: 'CC', name: t('etanas', 'ethane') }, t('50', '50')]]
          },
          src: 'L8 p12'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: f('NaNH2'), below: t('skystas NH3', 'liquid NH3') },
            { smi: 'CCC#[C-].[Na+]', name: t('natrio acetilenidas', 'sodium acetylide') }], maxWidth: 640 },
          src: 'L8 p12'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: f('CuCl, NH3') }, { smi: 'CCC#C[Cu]', name: t('vario acetilenidas', 'copper acetylide') }], maxWidth: 640 },
          caption: t('Rausvai rudos nuosėdos: terminalinių alkinų atpažinimas. Alkenai ir internaliniai alkinai nereaguoja.', 'Red-brown precipitate: the test for terminal alkynes. Alkenes and internal alkynes do not react.'),
          src: 'L8 p12, p18'
        },
        {
          p: t('Etinas turi du ≡C–H: su 2 $CuCl$ ir 2 $NH3$ gaunamas $Cu-C≡C-Cu$ ir 2 $NH4Cl$. Panašiai reaguoja ir sidabro amoniakinis tirpalas; sausi acetilenidai gali sprogti.', 'Ethyne has two ≡C–H: with 2 $CuCl$ and 2 $NH3$ it gives $Cu-C≡C-Cu$ and 2 $NH4Cl$. Ammoniacal silver reacts in the same way; dry acetylides can explode.'),
          src: 'Klein'
        },
        { h: t('Acetilenidų alkilinimas', 'Alkylation of acetylides') },
        {
          p: t('Acetilidas (acetilenido anijonas) yra stiprus nukleofilas: su metilo ar pirminiu halogenalkanu jis SN2 mechanizmu pakeičia halogeną. Iš etino taip gaunamas terminalinis, o antrą kartą alkilinus – internalinis alkinas.',
            'The acetylide anion is a strong nucleophile: with a methyl or primary haloalkane it replaces the halogen by SN2. Alkylating ethyne gives a terminal alkyne, a second alkylation an internal one.'),
          src: 'L8 p13'
        },
        {
          scheme: { items: [{ smi: 'CCC#C', name: t('1-butinas', 'but-1-yne') }, { arrow: '→', above: t('1. $NaNH2$, $NH3$', '1. $NaNH2$, $NH3$'), below: f('2. CH3I') }, { smi: 'CCC#CC', name: t('2-pentinas', 'pent-2-yne') }], maxWidth: 640 },
          src: 'L8 p13'
        },
        {
          rule: t('Alkilinimui tinka metilo ir pirminiai halogenalkanai. Su antriniu ar tretiniu acetilenidas, būdamas bazė, sukelia eliminavimą (alkenas).', 'Methyl and primary haloalkanes work for alkylation. With secondary or tertiary ones the acetylide, being a base, causes elimination (an alkene).'),
          src: 'L8 p13; Klein'
        },
        {
          p: t('„Click“ reakcijoje terminalinis alkinas su azidu ($Cu+$ katalizatorius) duoda triazolą (Nobelio premija, 2022 m.).', 'In the “click” reaction a terminal alkyne and an azide ($Cu+$ catalyst) give a triazole (Nobel Prize, 2022).'),
          src: 'L8 p16'
        },
        {
          scheme: { items: [{ smi: 'C#Cc1ccccc1', name: t('feniletinas', 'phenylethyne') }, { plus: true }, { smi: 'CN=[N+]=[N-]' }, { arrow: '→', above: t('$Cu+$ katalizatorius', '$Cu+$ catalyst') }, { smi: 'Cn1cc(-c2ccccc2)nn1' }], maxWidth: 700 },
          src: 'L8 p16'
        },
        {
          pitfall: t('Tik terminalinis alkinas turi rūgštų ≡C–H: 2-butinas su $NaNH2$ ar $CuCl$ nereaguoja.',
            'Only a terminal alkyne has an acidic ≡C–H: but-2-yne does not react with $NaNH2$ or $CuCl$.')
        },
        {
          example: {
            q: [{ p: t('Kuris iš šių junginių su $CuCl$ ir $NH3$ duos nuosėdų: 1-butinas, 2-butinas, 1-butenas?', 'Which of these gives a precipitate with $CuCl$ and $NH3$: but-1-yne, but-2-yne, but-1-ene?') }],
            steps: [
              [{ p: t('Ieškome ≡C–H grupės. 1-butinas ją turi, 2-butinas – ne (internalinis), 1-butenas turi tik =C–H, kuris nerūgštus.', 'We look for a ≡C–H group. But-1-yne has one, but-2-yne does not (internal), but-1-ene has only =C–H, which is not acidic.') }],
              [{ p: t('Nuosėdų duos tik 1-butinas: vario acetilenidas.', 'Only but-1-yne gives a precipitate: copper acetylide.') }, { mol: { smi: 'CCC#C[Cu]', name: t('vario acetilenidas', 'copper acetylide') } }]
            ]
          },
          claims: [{ react: ['yne.cu', ['CCC#C'], null, 'CCC#C[Cu]'] }, { formula: ['CCC#C[Cu]', 'C4H5Cu'] }]
        },
        { practice: 'u08.acid' },
        { practice: 'u08.alk' }
      ]
    },
    /* ---------------------------------------------------------- 8 */
    {
      id: 'rings',
      title: t('Mažieji ciklai', 'Small rings'),
      blocks: [
        { h: t('Įtempti žiedai elgiasi kaip nesotieji junginiai', 'Strained rings behave like unsaturated compounds') },
        {
          p: t('Ciklopropano valentiniai kampai yra 60°, o sp³ atomui įprasta 109,5°. Nuokrypis (kampinė, Bajerio įtemptis) siekia 49,5°, o ciklopropano C–C ryšiai yra išlenkti ir silpni. Todėl ciklopropanas, kaip ir alkenas, reaguoja su elektrofilais, tik atsiveria žiedas.',
            'The bond angles of cyclopropane are 60°, whereas an sp³ carbon prefers 109.5°. The deviation (angle or Baeyer strain) is 49.5°, and the C–C bonds of cyclopropane are bent and weak. So cyclopropane, like an alkene, reacts with electrophiles, only the ring opens.'),
          src: 'L8 p17; T p48, p60'
        },
        {
          scheme: { items: [{ smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { plus: true }, { smi: 'I' }, { arrow: '→' }, { smi: 'CCCI', name: t('1-jodpropanas', '1-iodopropane') }], maxWidth: 640 },
          src: 'L8 p17'
        },
        {
          scheme: { items: [{ smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: 'BrCCCBr', name: t('1,3-dibrompropanas', '1,3-dibromopropane') }], maxWidth: 640 },
          src: 'L8 p17'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { plus: true }, { smi: 'I', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('Supaprastintai: protonas atakuoja įtemptą $C-C$ ryšį.', 'Simplified: the proton attacks a strained $C-C$ bond.')
            }
          ],
          src: 'L8 p17; Klein'
        },
        {
          scheme: { items: [{ smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { plus: true }, { smi: 'I' }, { arrow: '→' }, { smi: 'CCCI', name: t('1-jodpropanas', '1-iodopropane') }], maxWidth: 640 },
          caption: t('Jodidas iš karto atakuoja kitą to ryšio anglies atomą, ir žiedas atsiveria. Laisvas pirminis karbokatijonas nesusidaro: jis persigrupuotų į antrinį ir susidarytų 2-jodpropanas, o gaunamas 1-jodpropanas.',
            'Iodide attacks the other carbon of that bond at once and the ring opens. No free primary carbocation forms: it would rearrange to a secondary one and give 2-iodopropane, whereas 1-iodopropane is what forms.'),
          src: 'L8 p17; L7 p9'
        },
        {
          table: {
            head: [t('Ciklas', 'Ring'), t('Plokščio ciklo kampas', 'Angle of a planar ring'), t('Nuokrypis nuo 109,5°', 'Deviation from 109.5°')],
            rows: [[t('ciklopropanas', 'cyclopropane'), t('60°', '60°'), t('49,5°', '49.5°')], [t('ciklobutanas', 'cyclobutane'), t('90°', '90°'), t('19,5°', '19.5°')],
              [t('ciklopentanas', 'cyclopentane'), t('108°', '108°'), t('1,5°', '1.5°')]]
          },
          caption: t('Realūs ciklai išsilenkia ir įtempties turi mažiau.', 'Real rings pucker and carry less strain.'),
          src: 'T p48'
        },
        {
          rule: t('Ciklopropanas žemoje temperatūroje reaguoja su $HX$ ir $X2$ atsiverdamas: $HX$ duoda 1-halogenpropaną, $X2$ – 1,3-dihalogenpropaną. Ciklobutano žiedas irgi gali atsiverti, bet tik griežtesnėmis sąlygomis (pvz., hidrinant su Ni ir kaitinant); su bromu ar HX kambario temperatūroje jis beveik nereaguoja.',
            'Cyclopropane reacts with $HX$ and $X2$ at low temperature with ring opening: $HX$ gives a 1-halopropane, $X2$ a 1,3-dihalopropane. The cyclobutane ring can open too, but only under harsher conditions (for example hydrogenation over Ni with heating); with bromine or HX at room temperature it hardly reacts.'),
          src: 'L8 p17; T p60'
        },
        {
          pitfall: t('Tai ne radikalinis pakeitimas ($SR$, reikia šviesos): žiedas atsiveria, o bromciklopropanas nesusidaro.',
            'This is not radical substitution ($SR$, which needs light): the ring opens and no bromocyclopropane forms.')
        },
        {
          example: {
            q: [{ p: t('Ciklopropanas reaguoja su HBr. Koks produktas ir kodėl reakcija vyksta?', 'Cyclopropane reacts with HBr. What is the product and why does the reaction go?') }, { mol: { smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') } }],
            steps: [
              [{ p: t('$H+$ jungiasi prie vieno žiedo anglies, ryšys nutrūksta, bromidas prisijungia prie kito atomo.', '$H+$ bonds to one ring carbon, the bond breaks and bromide bonds to the other carbon.') },
                { mol: { smi: 'CCCBr', name: t('1-brompropanas', '1-bromopropane') } }]
            ]
          },
          claims: [{ formula: ['C1CC1', 'C3H6'] }, { formula: ['CCCBr', 'C3H7Br'] }, { name: ['CCCBr', t('1-brompropanas', '1-bromopropane')] }]
        },
        { practice: 'u08.ring' }
      ]
    },
    /* ---------------------------------------------------------- 9 */
    {
      id: 'tests',
      title: t('Nesotumo atpažinimas', 'Recognising unsaturation'),
      blocks: [
        { h: t('Trys bandymai', 'Three tests') },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), t('Alkanas', 'Alkane'), t('Alkenas, internalinis alkinas', 'Alkene, internal alkyne'), t('Terminalinis alkinas', 'Terminal alkyne')],
            rows: [
              [t('Bromo vanduo', 'Bromine water'), t('nesikeičia', 'no change'), t('išblunka', 'decolourised'), t('išblunka', 'decolourised')],
              [t('$KMnO4$ tirpalas', '$KMnO4$ solution'), t('nesikeičia', 'no change'), t('violetinė spalva išnyksta', 'violet colour fades'), t('violetinė spalva išnyksta', 'violet colour fades')],
              [t('$CuCl$, $NH3$', '$CuCl$, $NH3$'), t('nesikeičia', 'no change'), t('nesikeičia', 'no change'), t('rausvai rudos nuosėdos', 'red-brown precipitate')]
            ]
          },
          src: 'LW6 p1; L8 p12'
        },
        {
          rule: t('Bromo vanduo ir $KMnO4$ rodo bet kokį π ryšį (dvigubąjį ar trigubąjį); tik $CuCl$/$NH3$ rodo terminalinį ≡C–H.', 'Bromine water and $KMnO4$ show any π bond (double or triple); only $CuCl$/$NH3$ shows a terminal ≡C–H.'),
          src: 'LW6 p1'
        },
        {
          example: {
            q: [{ p: t('C₅H₈ junginys nuspalvina bromo vandenį ir duoda nuosėdas su $CuCl$/$NH3$. Kaitinant su šarminiu $KMnO4$ susidaro butano rūgštis ir $CO2$. Kas tai?', 'A C₅H₈ compound decolourises bromine water and gives a precipitate with $CuCl$/$NH3$. With hot alkaline $KMnO4$ it gives butanoic acid and $CO2$. What is it?') }],
            steps: [
              [{ p: t('Nuosėdos su $CuCl$/$NH3$ ir $CO2$ rodo terminalinį alkiną.', 'A precipitate with $CuCl$/$NH3$ and $CO2$ point to a terminal alkyne.') }],
              [{ p: t('Butano rūgštis yra likusi 4 anglių grandinė, taigi tai 1-pentinas.', 'Butanoic acid is the remaining four-carbon chain, so the compound is pent-1-yne.') }, { mol: { smi: 'CCCC#C', name: t('1-pentinas', 'pent-1-yne') } }]
            ]
          },
          claims: [{ formula: ['CCCC#C', 'C5H8'] }, { react: ['yne.cu', ['CCCC#C'], null, 'CCCC#C[Cu]'] }, { react: ['ox.kmno4.harsh', ['CCCC#C'], null, 'CCCC(O)=O'] }, { name: ['CCCC(O)=O', t('butano rūgštis', 'butanoic acid')] }]
        },
        {
          pitfall: t('Išblukęs bromo vanduo ar $KMnO4$ dar nereiškia alkino: taip elgiasi ir alkenai.', 'A decolourised bromine water or $KMnO4$ does not prove an alkyne: alkenes do the same.')
        },
        { practice: 'u08.test' }
      ]
    }
  ];

  const SUMMARY = [
    { h: t('Santrauka', 'Summary') },
    {
      table: {
        head: [t('Reakcija', 'Reaction'), t('Reagentas', 'Reagent'), t('Produktas', 'Product')],
        rows: [
          [t('Konjuguotasis dienas + HX / $X2$', 'Conjugated diene + HX / $X2$'), t('1 ekv.', '1 equiv.'), t('1,2- ir 1,4-aduktai (aliltipo katijonas)', '1,2 and 1,4 adducts (allylic cation)')],
          [t('Alkinas + HX', 'Alkyne + HX'), t('1 ekv. / 2 ekv.', '1 equiv. / 2 equiv.'), t('halogenalkenas / geminalinis dihalogenidas', 'haloalkene / geminal dihalide')],
          [t('Alkinas + $X2$', 'Alkyne + $X2$'), t('1 ekv. / 2 ekv.', '1 equiv. / 2 equiv.'), t('dihalogenalkenas / tetrahalogenalkanas', 'dihaloalkene / tetrahaloalkane')],
          [t('Alkinas + $H2$', 'Alkyne + $H2$'), t('2 ekv., Pt, Pd ar Ni / 1 ekv., Lindlaro katalizatorius', '2 equiv., Pt, Pd or Ni / 1 equiv., Lindlar catalyst'), t('alkanas / cis-alkenas', 'alkane / cis alkene')],
          [t('Hidratacija', 'Hydration'), f('H2O, H2SO4, HgSO4'), t('enolis → ketonas (aldehidas tik iš etino)', 'enol → ketone (aldehyde only from ethyne)')],
          [t('Oksidavimas', 'Oxidation'), f('KMnO4, OH-, H2O'), t('dvi rūgštys ($CO2$ iš ≡C–H)', 'two acids ($CO2$ from ≡C–H)')],
          [t('Terminalinis alkinas', 'Terminal alkyne'), f('NaNH2 / CuCl, NH3'), t('acetilenidas / vario acetilenidas (nuosėdos)', 'acetylide / copper acetylide (precipitate)')],
          [t('Acetilenidas + RCH₂Br', 'Acetylide + RCH₂Br'), t('SN2', 'SN2'), t('ilgesnės grandinės alkinas', 'alkyne with a longer chain')],
          [t('Ciklopropanas + HX / $X2$', 'Cyclopropane + HX / $X2$'), t('HX / $X2$, žema temperatūra', 'HX / $X2$, low temperature'), t('1-halogenpropanas / 1,3-dihalogenpropanas', '1-halopropane / 1,3-dihalopropane')]
        ]
      }
    }
  ];

  /* ================================================================ bank types */
  const mols = (list) => list.map(s => ({ mol: { smi: s } }));
  const molChoice = (prompt, right, wrongs, hint, solution) => ({ prompt, kind: 'choice', options: mols([right].concat(wrongs)), answer: 0, hint, solution });
  const txtChoice = (prompt, opts, answer, hint, solution) => ({ prompt, kind: 'choice', options: opts.map(x => ({ text: x })), answer, hint, solution });
  const row = (list) => ({ mol: list.map(([smi, name]) => ({ smi, name })) });

  // ---------- u08.dmech: dienes, reasoning and mechanism ----------
  const T_DMECH = {
    id: 'u08.dmech',
    title: t('Dienų reakcijos: mechanizmas ir priežastys', 'Reactions of dienes: mechanism and reasons'),
    mirrors: ['S4.15'],
    bank: [
      {
        id: 'u08.dmech.1',
        q: [{ p: t('1,3-butadienas reaguoja su HBr.', 'Buta-1,3-diene reacts with HBr.') }, { scheme: { items: [{ smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene') }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
        steps: [{
          prompt: t('Išdėstykite reakcijos etapus eilės tvarka.', 'Put the stages of the reaction in order.'),
          kind: 'order',
          options: [{ text: t('π elektronai atakuoja HBr protoną (lėtoji I stadija).', 'The π electrons attack the proton of HBr (slow stage I).') },
            { text: t('Susidaro aliltipo katijonas, kurio krūvis pasidalija tarp dviejų atomų.', 'An allyl cation forms, its charge shared by two carbons.') },
            { text: t('Bromidas jungiasi prie vieno iš teigiamų atomų (greitoji II stadija).', 'Bromide bonds to one of the positive carbons (fast stage II).') },
            { text: t('Gaunamas 1,2- ir 1,4-produktų mišinys.', 'A mixture of 1,2 and 1,4 products results.') }],
          hint: t('Pirmiausia reaguoja dieno π elektronai, o produktai susidaro paskutiniai.', 'The π electrons of the diene react first; the products form last.'),
          solution: t('AE: pirmiausia elektrofilas atakuoja π ryšį ir susidaro katijonas, tada nukleofilas jungiasi prie jo; kadangi katijonas turi du teigiamus galus, gaunami du produktai.', 'AE: the electrophile attacks the π bond first and a cation forms, then the nucleophile bonds to it; because the cation has two positive ends, two products result.')
        }, txtChoice(t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
          [t('AE', 'AE'), t('AN', 'AN'), t('SR', 'SR'), t('SN1', 'SN1')], 0,
          t('Dvigubąjį ryšį atakuoja elektrofilas, o reagentas prisijungia.', 'An electrophile attacks the double bond and the reagent adds.'),
          t('AE: elektrofilas $H+$ atakuoja π ryšį (I stadija), o nukleofilas $Br-$ prisijungia prie katijono (II stadija).', 'AE: the electrophile $H+$ attacks the π bond (stage I) and the nucleophile $Br-$ bonds to the cation (stage II).'))],
        why: t('Dienas yra nukleofilas: jo π elektronai atakuoja HBr protoną ir susidaro aliltipo katijonas. Šio katijono teigiamas krūvis pasidalija tarp dviejų atomų, todėl bromidas gali prisijungti prie kiekvieno iš jų. Taip iš vieno tarpinio katijono gaunami du produktai.', 'The diene is a nucleophile: its π electrons attack the proton of HBr and an allylic cation forms. The positive charge of this cation is shared by two carbons, so bromide can bond to either of them. Thus one intermediate cation gives two products.'),
        src: 'L8 p6', claims: [{ react: ['diene.hx', ['C=CC=C'], { X: 'Br' }, 'CC(Br)C=C'] }, { react: ['diene.hx', ['C=CC=C'], { X: 'Br' }, 'CC=CCBr'] }]
      },
      {
        id: 'u08.dmech.2',
        q: [{ p: t('Protonas gali jungtis prie galinio arba prie vidinio 1,3-butadieno atomo.', 'The proton may add to a terminal or to an inner carbon of buta-1,3-diene.') },
          { mol: [{ smi: 'C[CH+]C=C', caption: t('A: prie galinio atomo', 'A: to a terminal carbon') }, { smi: 'C=CC[CH2+]', caption: t('B: prie vidinio atomo', 'B: to an inner carbon') }] }],
        steps: [txtChoice(t('Kodėl nesusidaro katijonas B?', 'Why does cation B not form?'),
          [t('B būtų pirminis nekonjuguotas katijonas, o A yra alilkatijonas su pasidalijusiu krūviu.', 'B would be a primary non-conjugated cation, whereas A is an allyl cation with a shared charge.'),
            t('Vidinis atomas neturi vandenilio, todėl protonas negali prisijungti.', 'The inner carbon has no hydrogen, so a proton cannot add.'),
            t('Vidiniame atome nėra π elektronų.', 'There are no π electrons on the inner carbon.'),
            t('B duotų 1,4-produktą, kuris nestabilus.', 'B would give a 1,4 product, which is unstable.')], 0,
          t('Palyginkite, kur yra teigiamas krūvis kiekviename katijone ir ar šalia jo yra dvigubasis ryšys.', 'Compare where the positive charge is in each cation and whether a double bond is next to it.'),
          t('A krūvis yra šalia dvigubojo ryšio ir dalijasi per konjugaciją; B krūvis lokalizuotas ant pirminio atomo. Todėl A daug stabilesnis.', 'In A the charge is next to a double bond and is shared through conjugation; in B it is localised on a primary carbon. So A is much more stable.'))],
        why: t('Protonas renkasi tą dieno atomą, po kurio lieka stabiliausias katijonas. Prisijungęs prie galinio atomo, jis palieka teigiamą krūvį šalia kito dvigubojo ryšio, todėl krūvis per konjugaciją pasiskirsto tarp dviejų atomų. Prisijungęs prie vidinio atomo, jis paliktų pirminį katijoną be jokio stabilizavimo.', 'The proton picks the diene carbon that leaves the most stable cation. On a terminal carbon it leaves the positive charge next to the other double bond, so conjugation shares it between two carbons. On an inner carbon it would leave a primary cation with no such help.'), src: 'L8 p6',
        claims: [{ formula: ['C[CH+]C=C', 'C4H7+'] }, { formula: ['C=CC[CH2+]', 'C4H7+'] }]
      },
      {
        id: 'u08.dmech.3',
        q: [{ p: t('Pažiūrėkite į alilkatijoną.', 'Look at the allyl cation.') }, { mol: { smi: '[CH2+]C=C', name: t('alilkatijonas', 'allyl cation'), opts: { numbers: 'all' } } }],
        steps: [{
          prompt: t('Bakstelėkite atomus, tarp kurių pasiskirsto teigiamas krūvis.', 'Tap the carbons that share the positive charge.'),
          kind: 'atoms', mol: { smi: '[CH2+]C=C', opts: { numbers: 'all' } }, answer: [0, 2],
          hint: t('Nupieškite antrąją rezonansinę formulę: kur dabar dvigubasis ryšys ir kur krūvis?', 'Draw the second resonance structure: where are the double bond and the charge now?'),
          solution: [{ p: t('Dvigubasis ryšys gali būti tarp atomų Nr. 2 ir 3 arba Nr. 1 ir 2; teigiamas krūvis atitinkamai ant atomo Nr. 1 arba Nr. 3.', 'The double bond can be between carbons no. 2 and 3 or no. 1 and 2; the positive charge is then on carbon no. 1 or no. 3.') },
            { resonance: [{ smi: '[CH2+]C=C' }, { smi: 'C=C[CH2+]' }] }]
        }, {
          prompt: t('Kiek skirtingų produktų susidaro, kai prie šio katijono prisijungia $Br-$?', 'How many different products form when $Br-$ adds to this cation?'),
          kind: 'number', answer: { value: 1, tol: 0 },
          hint: t('Prijunkite bromidą prie kiekvieno teigiamo atomo ir palyginkite gautus junginius.', 'Add bromide to each positive carbon and compare the compounds you get.'),
          solution: t('Abu katijono galai lygiaverčiai, todėl abiem atvejais gaunamas 3-brompropenas.', 'Both ends of the cation are equivalent, so both give 3-bromopropene.')
        }],
        why: t('Rezonansinės formulės skiriasi tik elektronų, o ne atomų padėtimi. Teigiamas krūvis pasiskirsto tarp abiejų galinių atomų, todėl abu jie gali priimti nukleofilą, o katijonas stabilesnis už turintį lokalizuotą krūvį.', 'Resonance structures differ only in the position of electrons, not of atoms. The positive charge is shared by both terminal carbons, so either can accept a nucleophile, and the cation is more stable than one with a localised charge.'),
        src: 'L8 p7', claims: [{ formula: ['[CH2+]C=C', 'C3H5+'] }]
      },
      {
        id: 'u08.dmech.4',
        q: [{ p: t('1,3-butadienas reaguoja su chloru.', 'Buta-1,3-diene reacts with chlorine.') }, { scheme: { items: [{ smi: 'C=CC=C', name: t('1,3-butadienas', 'buta-1,3-diene') }, { plus: true }, { smi: 'ClCl' }, { arrow: '→', above: t('1 ekv.', '1 equiv.') }] } }],
        steps: [{
          prompt: t('Pažymėkite abu pagrindinius produktus.', 'Pick both main products.'),
          kind: 'multi', options: mols(['C=CC(Cl)CCl', 'ClCC=CCCl', 'CC(Cl)(Cl)C=C', 'C=C(Cl)CCCl', 'ClCC(Cl)C(Cl)CCl']), answer: [0, 1],
          hint: t('Vienas $Cl2$ prisijungia 1,2- ir 1,4-padėtyse; kiek chloro atomų yra produkte?', 'One $Cl2$ adds in the 1,2 and 1,4 positions; how many chlorine atoms does the product have?'),
          solution: t('1,2-produktas: chloras gretimuose atomuose (3,4-dichlor-1-butenas); 1,4-produktas: chloras galuose, dvigubasis ryšys viduryje (1,4-dichlor-2-butenas).', '1,2 product: chlorine on adjacent carbons (3,4-dichlorobut-1-ene); 1,4 product: chlorine at the ends, double bond in the middle (1,4-dichlorobut-2-ene).')
        }, molChoice(t('Koks produktas susidaro su 2 ekv. chloro?', 'What is the product with 2 equivalents of chlorine?'), 'ClCC(Cl)C(Cl)CCl', ['ClCC=CCCl', 'CC(Cl)(Cl)C(Cl)(Cl)C'],
          t('Antras ekvivalentas jungiasi prie likusio dvigubojo ryšio.', 'The second equivalent adds to the remaining double bond.'),
          t('Antrasis $Cl2$ prisijungia prie dvigubojo ryšio, likusio po pirmojo prijungimo: 1,2,3,4-tetrachlorbutanas.', 'The second $Cl2$ adds across the double bond left after the first addition: 1,2,3,4-tetrachlorobutane.'))],
        why: t('Halogenas su konjuguotuoju dienu elgiasi taip pat kaip vandenilio halogenidas: pirmasis ekvivalentas jungiasi 1,2- ir 1,4-padėtyse. Antrasis ekvivalentas prisotina likusį dvigubąjį ryšį, todėl gaunamas tetrachloridas.', 'A halogen behaves with a conjugated diene as a hydrogen halide does: the first equivalent adds in the 1,2 and 1,4 positions. The second equivalent saturates the remaining double bond, giving a tetrachloride.'),
        src: 'L8 p5',
        claims: [{ react: ['ae.x2', ['C=CC=C'], { X: 'Cl' }, 'C=CC(Cl)CCl'] }, { react: ['ae.x2', ['C=CC=C'], { X: 'Cl' }, 'ClCC=CCCl'] }, { formula: ['ClCC(Cl)C(Cl)CCl', 'C4H6Cl4'] }]
      },
      {
        id: 'u08.dmech.5',
        q: [{ p: t('1,3-butadienas reaguoja su HBr ir gaunami 1,2- ir 1,4-produktai.', 'Buta-1,3-diene reacts with HBr and gives 1,2 and 1,4 products.') }],
        steps: [{
          prompt: t('Pažymėkite teisingus teiginius.', 'Pick the correct statements.'),
          kind: 'multi',
          options: [{ text: t('Abu produktai susidaro iš to paties alilkatijono.', 'Both products form from the same allyl cation.') },
            { text: t('Žemoje temperatūroje dažniau vyrauja greičiau susidarantis 1,2-produktas.', 'At low temperature the faster-forming 1,2 product often predominates.') },
            { text: t('Aukštesnėje temperatūroje vyrauja stabilesnis 1,4-produktas.', 'At higher temperature the more stable 1,4 product predominates.') },
            { text: t('Aukštoje temperatūroje susidaro kitas tarpinis katijonas.', 'At high temperature a different intermediate cation forms.') },
            { text: t('Produktų santykis visada 1 : 1.', 'The product ratio is always 1 : 1.') }],
          answer: [0, 1, 2],
          hint: t('Produktų santykis priklauso nuo sąlygų, bet tarpinė dalelė ta pati.', 'The ratio depends on the conditions, but the intermediate is the same.'),
          solution: t('Katijonas vienas, todėl keičiasi tik produktų santykis: greičiau susidaro 1,2-aduktas, o stabilesnis (labiau pakeistas dvigubasis ryšys) yra 1,4-aduktas.', 'The cation is the same, so only the ratio changes: the 1,2 adduct forms faster, while the 1,4 adduct is more stable (a more substituted double bond).')
        }],
        why: t('Abu produktai susidaro iš to paties alilkatijono, todėl sąlygos keičia tik jų santykį, o ne mechanizmą. Greičiau susidaro 1,2-aduktas, o stabilesnis (labiau pakeistas dvigubasis ryšys) yra 1,4-aduktas; kuris vyrauja, priklauso nuo to, ar reakcija sustoja anksti, ar pasiekia pusiausvyrą.', 'Both products form from the same allyl cation, so the conditions change only their ratio, not the mechanism. The 1,2 adduct forms faster, while the 1,4 adduct is more stable (a more substituted double bond); which one predominates depends on whether the reaction stops early or reaches equilibrium.'), src: 'T p58; Klein'
      },
      {
        id: 'u08.dmech.6',
        q: [{ p: t('1,4-pentadienas reaguoja su vienu ekvivalentu HBr.', 'Penta-1,4-diene reacts with one equivalent of HBr.') }, { scheme: { items: [{ smi: 'C=CCC=C', name: t('1,4-pentadienas', 'penta-1,4-diene') }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
        steps: [molChoice(t('Koks yra pagrindinis produktas?', 'What is the main product?'), 'CC(Br)CC=C', ['BrCCCC=C', 'CC=CCCBr', 'CC=CC(C)Br'],
          t('Dvigubieji ryšiai atskirti; kaip reaguoja vienas iš jų?', 'The double bonds are separated; how does one of them react?'),
          t('Izoliuotasis ryšys reaguoja kaip paprastas alkenas: H jungiasi prie CH₂, Br – prie antrinio atomo (Markovnikovas). 1,4-produkto nėra.', 'An isolated bond reacts like a plain alkene: H goes to CH₂, Br to the secondary carbon (Markovnikov). There is no 1,4 product.')),
        txtChoice(t('Kodėl čia nėra 1,4-produkto?', 'Why is there no 1,4 product here?'),
          [t('Katijonas, susidaręs po protonizavimo, nėra alilinis: sp³ atomas neleidžia krūviui dalytis su kitu ryšiu.', 'The cation formed by protonation is not allylic: the sp³ carbon stops the charge from being shared with the other bond.'),
            t('1,4-produktas stabilesnis ir todėl nesusidaro.', 'The 1,4 product is more stable and therefore does not form.'),
            t('Pentadienas turi tik vieną dvigubąjį ryšį.', 'Pentadiene has only one double bond.'),
            t('HBr su dienais reaguoja tik radikaliniu būdu.', 'HBr reacts with dienes only by a radical path.')], 0,
          t('Ar šalia teigiamo atomo yra dvigubasis ryšys?', 'Is there a double bond next to the positive carbon?'),
          t('Teigiamas atomas atskirtas nuo kito dvigubojo ryšio sp³ atomu, todėl konjugacijos nėra ir krūvis lieka lokalizuotas.', 'The positive carbon is separated from the other double bond by an sp³ carbon, so there is no conjugation and the charge stays localised.'))],
        why: t('1,4-prijungimui reikia aliltipo katijono, o jis susidaro tik tada, kai teigiamas atomas yra greta kito dvigubojo ryšio. Izoliuotajame diene juos skiria sp³ atomas, todėl dvigubieji ryšiai reaguoja nepriklausomai, kaip atskiri alkenai (Markovnikovo taisyklė).', '1,4 addition needs an allylic cation, which forms only when the positive carbon sits next to the other double bond. In an isolated diene an sp³ carbon separates them, so each double bond reacts as a separate alkene, by Markovnikov’s rule.'), src: 'L8 p2',
        claims: [{ react: ['ae.hx', ['C=CCC=C'], { X: 'Br' }, 'CC(Br)CC=C'] }, { formula: ['BrCCCC=C', 'C5H9Br'] }]
      },
      {
        id: 'u08.dmech.7',
        q: [{ p: t('Palyginkite trijų pentadienų stabilumą.', 'Compare the stability of three pentadienes.') }, row([['CC=CC=C', t('1,3-pentadienas', 'penta-1,3-diene')], ['C=CCC=C', t('1,4-pentadienas', 'penta-1,4-diene')], ['C=C=CCC', t('1,2-pentadienas', 'penta-1,2-diene')]])],
        steps: [{
          prompt: t('Išdėstykite nuo stabiliausio iki mažiausiai stabilaus.', 'Order from the most to the least stable.'),
          kind: 'order',
          options: [{ text: t('1,3-pentadienas (konjuguotasis)', 'penta-1,3-diene (conjugated)') }, { text: t('1,4-pentadienas (izoliuotasis)', 'penta-1,4-diene (isolated)') }, { text: t('1,2-pentadienas (kumuliuotasis)', 'penta-1,2-diene (cumulated)') }],
          hint: t('Kuriame diene π elektronai gali pasiskirstyti per daugiausia atomų?', 'In which diene can the π electrons spread over the most atoms?'),
          solution: t('Konjuguotasis stabiliausias; kumuliuotasis, kurio centrinis sp atomas išdėsto du π ryšius statmenose plokštumose, mažiausiai stabilus.', 'The conjugated diene is the most stable; the cumulated one, whose central sp carbon puts its two π bonds in perpendicular planes, is the least stable.')
        }, txtChoice(t('Kodėl konjuguotasis dienas stabilesnis?', 'Why is the conjugated diene more stable?'),
          [t('π elektronai pasiskirsto per keturis atomus (konjugacija).', 'The π electrons are shared by four atoms (conjugation).'), t('Jame yra daugiau vandenilio atomų.', 'It contains more hydrogen atoms.'),
            t('Dvigubieji ryšiai jame stipresni už alkeno.', 'Its double bonds are stronger than those of an alkene.'), t('Jis turi sp³ atomą tarp ryšių.', 'It has an sp³ carbon between the bonds.')], 0,
          t('Pagalvokite, kur gali būti π elektronai.', 'Think about where the π electrons can be.'),
          t('Persiklojančios p orbitalės leidžia π elektronams pasidalyti per visą sistemą, o tai mažina energiją.', 'Overlapping p orbitals let the π electrons spread over the whole system, which lowers the energy.'))],
        why: t('Konjuguotajame diene keturių sp² atomų p orbitalės persikloja, todėl π elektronai delokalizuoti ir molekulės energija mažesnė. Izoliuotajame diene du π ryšiai nesąveikauja, o kumuliuotajame jų plokštumos statmenos, todėl jis mažiausiai stabilus.', 'In a conjugated diene the p orbitals of four sp² carbons overlap, so the π electrons are delocalised and the energy is lower. In an isolated diene the two π bonds do not interact, and in a cumulated one their planes are perpendicular, which makes it the least stable.'), src: 'L8 p2; Klein',
        claims: [{ name: ['CC=CC=C', t('1,3-pentadienas', 'penta-1,3-diene')] }, { name: ['C=CCC=C', t('1,4-pentadienas', 'penta-1,4-diene')] }, { name: ['C=C=CCC', t('1,2-pentadienas', 'penta-1,2-diene')] }]
      },
      {
        id: 'u08.dmech.8',
        q: [{ p: t('1,3-cikloheksadienas reaguoja su HBr (1 ekv.).', 'Cyclohexa-1,3-diene reacts with HBr (1 equiv.).') }, { scheme: { items: [{ smi: 'C1=CC=CCC1', name: t('1,3-cikloheksadienas', 'cyclohexa-1,3-diene') }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
        steps: [{
          prompt: t('Kiek skirtingų produktų susidaro?', 'How many different products form?'),
          kind: 'number', answer: { value: 1, tol: 0 },
          hint: t('Nupieškite alilkatijoną ir paklauskite, ar jo du galai vienodi.', 'Draw the allyl cation and ask whether its two ends are alike.'),
          solution: t('Žiedas simetriškas: katijono galai lygiaverčiai, todėl 1,2- ir 1,4-prijungimas duoda tą patį junginį.', 'The ring is symmetric: the two ends of the cation are equivalent, so 1,2 and 1,4 addition give the same compound.')
        }, molChoice(t('Koks tai produktas?', 'What is the product?'), 'BrC1C=CCCC1', ['BrC1CC=CCC1', 'BrC1=CCCCC1'],
          t('Nupieškite abi alilkatijono rezonansines formules ir prijunkite bromidą prie kiekvieno teigiamo atomo.', 'Draw both resonance structures of the allyl cation and add bromide to each positive carbon.'),
          t('Bromas atsiduria alilo padėtyje: 3-bromcikloheksenas.', 'Bromine ends up in the allylic position: 3-bromocyclohexene.'))],
        why: t('Simetriškame žiede abu alilkatijono galai lygiaverčiai, todėl 1,2- ir 1,4-prijungimas duoda tą patį junginį – 3-bromcikloheksenas. Du galimi keliai nebūtinai reiškia du skirtingus produktus.', 'In a symmetric ring the two ends of the allyl cation are equivalent, so 1,2 and 1,4 addition give the same compound, 3-bromocyclohexene. Two possible paths do not necessarily mean two different products.'),
        src: 'L8 p6', claims: [{ react: ['diene.hx', ['C1=CC=CCC1'], { X: 'Br' }, 'BrC1C=CCCC1'] }, { name: ['BrC1C=CCCC1', t('3-bromcikloheksenas', '3-bromocyclohex-1-ene')] }]
      },
      {
        id: 'u08.dmech.9',
        q: [{ p: t('Palyginkite karbokatijonų stabilumą.', 'Compare the stability of the carbocations.') }, row([['C=C[CH2+]', t('alilkatijonas', 'allyl cation')], ['C[C+](C)C', t('tretinis katijonas', 'tertiary cation')], ['C[CH+]C', t('antrinis katijonas', 'secondary cation')], ['C[CH2+]', t('pirminis katijonas', 'primary cation')]])],
        steps: [{
          prompt: t('Išdėstykite nuo stabiliausio.', 'Order from the most stable.'),
          kind: 'order',
          options: [{ text: t('alilkatijonas', 'allyl cation') }, { text: t('tretinis', 'tertiary') }, { text: t('antrinis', 'secondary') }, { text: t('pirminis', 'primary') }],
          hint: t('Kuris katijonas krūvį gali pasidalyti per konjugaciją, o kuriuos stabilizuoja tik alkilo grupės?', 'Which cation can share its charge by conjugation, and which are stabilised by alkyl groups only?'),
          solution: t('alilkatijonas > tretinis > antrinis > pirminis: alilkatijoną stabilizuoja rezonansas, alkilo katijonus – hiperkonjugacija ir +I efektas.', 'allyl > tertiary > secondary > primary: the allyl cation is stabilised by resonance, alkyl cations by hyperconjugation and the +I effect.')
        }],
        why: t('Alilkatijono krūvį dalija du atomai (rezonansas), o alkilo katijonus stabilizuoja tik hiperkonjugacija ir +I efektas, kurie veikia silpniau. Todėl eilė yra alilkatijonas > tretinis > antrinis > pirminis.', 'The charge of an allyl cation is shared by two carbons (resonance), whereas alkyl cations are stabilised only by hyperconjugation and the +I effect, which act more weakly. Hence the order allyl > tertiary > secondary > primary.'), src: 'L8 p7; L7 p9',
        claims: [{ formula: ['C=C[CH2+]', 'C3H5+'] }, { formula: ['C[C+](C)C', 'C4H9+'] }, { formula: ['C[CH+]C', 'C3H7+'] }, { formula: ['C[CH2+]', 'C2H5+'] }]
      }
    ]
  };

  // ---------- u08.yreason: alkynes, reasoning ----------
  const T_YREASON = {
    id: 'u08.yreason',
    title: t('Alkinai: priežastys ir mechanizmai', 'Alkynes: reasons and mechanisms'),
    mirrors: ['S4.7', 'S4.16'],
    bank: [
      {
        id: 'u08.yreason.1',
        q: [{ p: t('Etenas ir etinas reaguoja su HBr.', 'Ethene and ethyne react with HBr.') }, row([['C=C', t('etenas', 'ethene')], ['C#C', t('etinas', 'ethyne')]])],
        steps: [txtChoice(t('Kodėl etinas elektrofilinio prijungimo reakcijose aktyvumu nusileidžia etenui?', 'Why is ethyne less reactive than ethene in electrophilic addition?'),
          [t('sp atomas elektroneigiamesnis, todėl π elektronai laikomi stipriau ir mažiau prieinami elektrofilui.', 'An sp carbon is more electronegative, so the π electrons are held tighter and are less available to an electrophile.'),
            t('Etinas turi mažiau π ryšių.', 'Ethyne has fewer π bonds.'), t('Trigubasis ryšys nepoliarizuojamas, nes jis ilgesnis.', 'A triple bond cannot be polarised because it is longer.'),
            t('Trigubasis ryšys per stiprus, todėl etinas su HBr nereaguoja.', 'The triple bond is too strong, so ethyne does not react with HBr.')], 0,
          t('Palyginkite, kaip stipriai kiekvienas atomas laiko savo elektronus.', 'Compare how strongly each carbon holds its electrons.'),
          t('Didesnis sp atomo elektroneigiamumas (50 % s pobūdžio) reiškia, kad π elektronai tvirčiau pririšti prie branduolių, todėl reakcija su elektrofilu lėtesnė.', 'The higher electronegativity of an sp carbon (50 % s character) means the π electrons are bound more tightly to the nuclei, so the reaction with an electrophile is slower.'))],
        why: t('Reaktingumą elektrofilų atžvilgiu lemia, kaip lengvai π elektronai atiduodami. sp atomas elektroneigiamesnis už sp², todėl alkino π elektronai laikomi tvirčiau ir alkinas AE reakcijose reaguoja lėčiau nei alkenas.', 'Reactivity towards electrophiles depends on how readily the π electrons are given up. An sp carbon is more electronegative than an sp² carbon, so the π electrons of an alkyne are held tighter and the alkyne reacts more slowly than an alkene in AE.'), src: 'L8 p9; T p60'
      },
      {
        id: 'u08.yreason.2',
        q: [{ p: t('Alkinų hidratacija vyksta per kelias stadijas.', 'The hydration of alkynes goes through several stages.') }, { scheme: { items: [{ smi: 'CC#C', name: t('propinas', 'propyne') }, { arrow: '→', above: f('H2O, H2SO4, HgSO4') }] } }],
        steps: [{
          prompt: t('Išdėstykite stadijas.', 'Put the stages in order.'), kind: 'order',
          options: [{ text: t('Hg²⁺ prisijungia prie trigubojo ryšio: susidaro tiltelinis katijonas.', 'Hg²⁺ adds to the triple bond: a bridged cation forms.') },
            { text: t('Vanduo atakuoja katijoną, prarandamas protonas: susidaro gyvsidabrio enolis.', 'Water attacks the cation and a proton is lost: a mercuric enol forms.') },
            { text: t('Gyvsidabrio enolis izomerizuojasi į gyvsidabrio ketoną.', 'The mercuric enol isomerises to a mercuric ketone.') },
            { text: t('Karbonilo deguonis prisijungia protoną, Hg²⁺ atskyla: susidaro enolis.', 'The carbonyl oxygen takes a proton and Hg²⁺ leaves: an enol forms.') },
            { text: t('Enolis izomerizuojasi į ketoną (propanoną).', 'The enol isomerises to the ketone (propanone).') }],
          hint: t('Pirmiausia reaguoja pats katalizatorius, o ketonas pasirodo tik paskutinėje stadijoje.', 'The catalyst reacts first, and the ketone appears only in the last stage.'),
          solution: t('Hg²⁺ aktyvina alkiną, vanduo yra nukleofilas; kol yra gyvsidabrio, enolis izomerizuojasi į gyvsidabrio ketoną, protonas atskiria metalą, o likęs enolis tampa stabiliu ketonu.', 'Hg²⁺ activates the alkyne and water is the nucleophile; while mercury is attached the enol isomerises to the mercuric ketone, a proton frees the metal, and the remaining enol becomes the stable ketone.')
        }],
        why: t('Gyvsidabrio jonas padaro silpnai reaktingą alkiną prieinamą vandeniui: jis sudaro tiltelinį katijoną, kurį vanduo atakuoja be laisvo vinilo katijono. Metalas lieka prisijungęs, kol enolis izomerizuojasi, ir galiausiai grįžta į tirpalą kaip katalizatorius, o galutinis produktas yra stabilesnė karbonilinė forma.', 'The mercury ion makes the weakly reactive alkyne accessible to water: it forms a bridged cation that water attacks without a free vinylic cation. The metal stays attached while the enol isomerises and finally returns to the solution as a catalyst, and the end product is the more stable carbonyl form.'), src: 'L8 p11'
      },
      {
        id: 'u08.yreason.3',
        q: [{ p: t('Etinas ir propinas hidratuojami ($HgSO4$, $H2SO4$).', 'Ethyne and propyne are hydrated ($HgSO4$, $H2SO4$).') }, row([['C#C', t('etinas', 'ethyne')], ['CC#C', t('propinas', 'propyne')]])],
        steps: [{
          prompt: t('Priskirkite produktą kiekvienam alkinui.', 'Match each alkyne with its product.'), kind: 'match',
          answer: { left: [{ mol: { smi: 'C#C' } }, { mol: { smi: 'CC#C' } }], right: [{ mol: { smi: 'CC=O' } }, { mol: { smi: 'CC(C)=O' } }], pairs: [0, 1] },
          hint: t('$OH$ jungiasi prie vidinio atomo; ar etine toks yra?', 'The $OH$ goes to the inner carbon; does ethyne have one?'),
          solution: t('Propinas duoda ketoną (propanoną), nes $OH$ patenka į vidinį atomą. Etinas neturi vidinio atomo su pakaitu, todėl gaunamas aldehidas – etanalis.', 'Propyne gives a ketone (propanone) because the $OH$ goes to the inner carbon. Ethyne has no substituted inner carbon, so the aldehyde, ethanal, forms.')
        }],
        why: t('Hidratacija vyksta pagal Markovnikovo taisyklę: $OH$ patenka į pakeistą trigubojo ryšio atomą, todėl karbonilo grupė atsiduria grandinės viduje ir gaunamas ketonas. Tik etine abu atomai nepakeisti, todėl $C=O$ lieka grandinės gale ir susidaro aldehidas, etanalis.', 'Hydration follows Markovnikov’s rule: the $OH$ goes to the substituted triple-bond carbon, so the carbonyl ends up inside the chain and a ketone forms. Only in ethyne are both carbons unsubstituted, so the $C=O$ stays at the end of the chain and an aldehyde, ethanal, forms.'), src: 'L8 p10',
        claims: [{ react: ['yne.hydration', ['C#C'], null, 'CC=O'] }, { react: ['yne.hydration', ['CC#C'], null, 'CC(C)=O'] }]
      },
      {
        id: 'u08.yreason.4',
        q: [{ p: t('Palyginkite trijų angliavandenilių $C-H$ ryšio rūgštingumą.', 'Compare the acidity of the $C-H$ bond in three hydrocarbons.') }, row([['C#C', t('etinas', 'ethyne')], ['C=C', t('etenas', 'ethene')], ['CC', t('etanas', 'ethane')]])],
        steps: [{
          prompt: t('Išdėstykite nuo stipriausios rūgšties.', 'Order from the strongest acid.'), kind: 'order',
          options: [{ text: t('etinas', 'ethyne') }, { text: t('etenas', 'ethene') }, { text: t('etanas', 'ethane') }],
          hint: t('Palyginkite, kokioje hibridinėje orbitalėje lieka kiekvieno anijono laisvoji pora.', 'Compare which hybrid orbital holds the lone pair of each anion.'),
          solution: t('etinas (pKa 25) > etenas (pKa 44) > etanas (pKa 50).', 'ethyne (pKa 25) > ethene (pKa 44) > ethane (pKa 50).')
        }, txtChoice(t('Kodėl?', 'Why?'),
          [t('Anijono neigiamas krūvis yra sp orbitalėje (50 % s), arčiau branduolio, todėl anijonas stabilesnis.', 'The negative charge of the anion sits in an sp orbital (50 % s), closer to the nucleus, so the anion is more stable.'),
            t('Etinas turi daugiau vandenilių.', 'Ethyne has more hydrogens.'), t('Trigubasis ryšys neutralizuoja krūvį rezonansu.', 'The triple bond neutralises the charge by resonance.'), t('Etinas yra mažiausia molekulė.', 'Ethyne is the smallest molecule.')], 0,
          t('Palyginkite orbitalių s pobūdį trijuose anijonuose.', 'Compare the s character of the orbitals in the three anions.'),
          t('Kuo didesnis s pobūdis (sp 50 %, sp² 33 %, sp³ 25 %), tuo arčiau branduolio yra elektronų pora ir tuo stabilesnė konjuguotoji bazė.', 'The higher the s character (sp 50 %, sp² 33 %, sp³ 25 %), the closer the electrons are to the nucleus and the more stable the conjugate base.'))],
        why: t('Rūgštingumą nusako konjuguotosios bazės stabilumas. Acetilenido anijono laisvoji pora yra sp orbitalėje (50 % s), arti branduolio, todėl neigiamas krūvis laikomas stipriai ir anijonas stabilus. sp² ir sp³ anijonuose pora toliau nuo branduolio, todėl jie mažiau stabilūs.', 'Acidity is set by the stability of the conjugate base. The lone pair of an acetylide sits in an sp orbital (50 % s), close to the nucleus, so the negative charge is held tightly and the anion is stable. In sp² and sp³ anions the pair is further out and less stabilised.'), src: 'L8 p12'
      },
      {
        id: 'u08.yreason.5',
        q: [{ p: t('Terminalinio alkino pKa apie 25. Konjuguotųjų rūgščių pKa: $H2O$ 15,7; $NH3$ 35.', 'The pKa of a terminal alkyne is about 25. The conjugate acids have pKa: $H2O$ 15.7; $NH3$ 35.') }, row([['CCC#C', t('1-butinas', 'but-1-yne')]])],
        steps: [txtChoice(t('Kuri bazė visiškai deprotonuoja alkiną?', 'Which base deprotonates the alkyne completely?'),
          [t('$NaNH2$ ($NH2-$)', '$NaNH2$ ($NH2-$)'), t('$NaOH$ ($OH-$)', '$NaOH$ ($OH-$)'), t('$CH3ONa$ ($CH3O-$)', '$CH3ONa$ ($CH3O-$)'), t('$NaHCO3$ ($HCO3-$)', '$NaHCO3$ ($HCO3-$)')], 0,
          t('Pusiausvyra pasislenka į silpnesnę rūgštį: konjuguotosios bazės rūgštis turi būti silpnesnė už alkiną.', 'The equilibrium favours the weaker acid: the conjugate acid of the base must be weaker than the alkyne.'),
          t('$NH3$ (pKa 35) daug silpnesnė rūgštis už alkiną (25), todėl $NH2-$ atplėšia protoną. $H2O$ (15,7) stipresnė rūgštis, todėl $OH-$ alkino beveik nedeprotonuoja.', '$NH3$ (pKa 35) is a much weaker acid than the alkyne (25), so $NH2-$ removes the proton. $H2O$ (15.7) is a stronger acid, so $OH-$ hardly deprotonates the alkyne.'))],
        why: t('Rūgšties ir bazės pusiausvyra pasislenka silpnesnės rūgšties pusėn. $NH2-$ yra amoniako (pKa apie 35) konjuguotoji bazė, todėl alkino (pKa 25) protoną atplėšia beveik visiškai. $OH-$ tam per silpnas: vandens pKa (15,7) mažesnė už alkino, todėl vanduo yra stipresnė rūgštis.', 'An acid–base equilibrium lies on the side of the weaker acid. $NH2-$ is the conjugate base of ammonia (pKa about 35), so it removes the alkyne proton (pKa 25) almost completely. $OH-$ is too weak, because water (pKa 15.7) is a stronger acid than the alkyne.'), src: 'L8 p12; Klein'
      },
      {
        id: 'u08.yreason.6',
        q: [{ p: t('Pažiūrėkite į propiną.', 'Look at propyne.') }, { mol: { smi: 'C#CC', name: t('propinas', 'propyne'), opts: { numbers: 'all' } } }],
        steps: [{
          prompt: t('Bakstelėkite sp atomus.', 'Tap the sp carbons.'), kind: 'atoms', mol: { smi: 'C#CC', opts: { numbers: 'all' } }, from: 'hyb:sp',
          hint: t('Kiekvienas sp atomas turi tik du kaimynus.', 'Each sp carbon has only two neighbours.'), solution: t('Atomai Nr. 1 ir Nr. 2 sudaro trigubąjį ryšį; Nr. 3 yra sp³.', 'Carbons no. 1 and no. 2 form the triple bond; no. 3 is sp³.')
        }, {
          prompt: t('Kiek σ ryšių yra molekulėje?', 'How many σ bonds does the molecule have?'), kind: 'number', answer: { value: 6, tol: 0 },
          hint: t('Skaičiuokite kiekvieną vienaryšį ryšį ir po vieną σ iš dvigubojo ar trigubojo.', 'Count each single bond and one σ from every double or triple bond.'),
          solution: t('$C≡C$ (1), $C-C$ (1) ir 4 $C-H$: iš viso 6 σ ryšiai.', '$C≡C$ (1), $C-C$ (1) and 4 $C-H$ bonds: 6 σ bonds in all.')
        }, {
          prompt: t('Kiek π ryšių?', 'How many π bonds?'), kind: 'number', answer: { value: 2, tol: 0 },
          hint: t('Kiek jų yra trigubajame ryšyje?', 'How many are in a triple bond?'), solution: t('Trigubasis ryšys: vienas σ ir du π.', 'A triple bond: one σ and two π.')
        }],
        why: t('Trigubąjį ryšį sudaro vienas σ ir du π ryšiai, o kiekvienas sp atomas turi du σ ryšius ir du π ryšius. Todėl propine yra 6 σ ir 2 π ryšiai.', 'A triple bond consists of one σ and two π bonds, and each sp carbon has two σ bonds and two π bonds. So propyne has 6 σ and 2 π bonds.'), src: 'L8 p8',
        claims: [{ sigmaPi: ['C#CC', 6, 2] }, { hyb: ['C#CC', 0, 'sp'] }, { hyb: ['C#CC', 1, 'sp'] }]
      },
      {
        id: 'u08.yreason.7',
        q: [{ p: t('Alkenai su praskiesta $H2SO4$ prijungia vandenį, o alkinams reikia dar ir $HgSO4$.', 'Alkenes add water in dilute $H2SO4$, but alkynes need $HgSO4$ as well.') }],
        steps: [txtChoice(t('Kodėl alkinui reikia gyvsidabrio katalizatoriaus?', 'Why does an alkyne need the mercury catalyst?'),
          [t('Alkinas elektrofilų atžvilgiu mažiau aktyvus, o protonizavimas duotų nepatvarų vinilo katijoną.', 'An alkyne is less reactive towards electrophiles, and protonation would give an unstable vinylic cation.'),
            t('Alkinas netirpsta rūgštyje.', 'An alkyne does not dissolve in acid.'), t('Hg²⁺ yra reduktorius.', 'Hg²⁺ is a reducing agent.'), t('Be jo susidarytų aldehidas.', 'Without it an aldehyde would form.')], 0,
          t('Pagalvokite, kaip lengvai alkinas protonizuojamas.', 'Think about how easily an alkyne is protonated.'),
          t('Alkino π elektronai prieinami blogiau, o vinilo katijonas nestabilus. Hg²⁺ sudaro tiltelinį katijoną ir apeina šią kliūtį.', 'The π electrons of an alkyne are less available and the vinylic cation is unstable. Hg²⁺ forms a bridged cation and bypasses this obstacle.'))],
        why: t('Alkino π elektronai laikomi stipriau, o protonizavus susidarytų nestabilus vinilo katijonas, todėl rūgštis viena vandens neprijungia. Hg²⁺ jungiasi prie trigubojo ryšio ir sudaro tiltelinį katijoną, kurį vanduo atakuoja be laisvo vinilo katijono: tai lengvesnis kelias.', 'The π electrons of an alkyne are held more tightly, and protonation would give an unstable vinylic cation, so acid alone does not add water. Hg²⁺ binds to the triple bond and forms a bridged cation that water attacks without a free vinylic cation: an easier path.'), src: 'L8 p10, p11; Klein'
      },
      {
        id: 'u08.yreason.8',
        q: [{ p: t('Etanalis susidaro hidratuojant etiną.', 'Ethanal forms when ethyne is hydrated.') }],
        steps: [molChoice(t('Koks nepatvarus tarpinis junginys?', 'What is the unstable intermediate?'), 'C=CO', ['CC=O', 'C1CO1', 'OCCO'],
          t('Tarpinis junginys turi $C=C$ ir $OH$ prie to paties dvigubojo ryšio atomo.', 'The intermediate has a $C=C$ and an $OH$ on a carbon of that double bond.'),
          t('Etenolis (vinilo alkoholis) yra enolis: jis izomerizuojasi į etanalį, kai vandenilis pereina nuo deguonies prie anglies.', 'Ethenol (vinyl alcohol) is an enol: it isomerises to ethanal when the hydrogen moves from oxygen to carbon.')),
        txtChoice(t('Kaip vadinama ši enolio ir karbonilinio junginio pusiausvyra?', 'What is this enol–carbonyl equilibrium called?'),
          [t('izomerizacija (tautomerija)', 'isomerisation (tautomerism)'), t('oksidacija', 'oxidation'), t('hidrinimas', 'hydrogenation'), t('eliminavimas', 'elimination')], 0,
          t('Keičiasi tik vandenilio ir dvigubojo ryšio padėtis.', 'Only the positions of the hydrogen and the double bond change.'),
          t('Enolis izomerizuojasi į stabilesnį karbonilinį junginį; tai izomerų, besiskiriančių vandenilio padėtimi, virsmas.', 'The enol isomerises to the more stable carbonyl compound; it is a conversion between isomers that differ in the position of a hydrogen.'))],
        why: t('Enolis ir karbonilinis junginys yra izomerai, besiskiriantys vandenilio padėtimi. Karbonilinė forma stabilesnė, todėl pusiausvyra pasislenka į ją ir enolis ilgai neišlieka.', 'An enol and a carbonyl compound are isomers that differ in the position of a hydrogen. The carbonyl form is more stable, so the equilibrium lies on its side and the enol does not last.'), src: 'L8 p10',
        claims: [{ formula: ['C=CO', 'C2H4O'] }, { formula: ['CC=O', 'C2H4O'] }]
      }
    ]
  };

  // ---------- u08.chain: multi-step schemes ----------
  const T_CHAIN = {
    id: 'u08.chain',
    title: t('Kelių stadijų schemos: A, B, C', 'Multi-step schemes: A, B, C'),
    mirrors: ['S4.7', 'S4.16'],
    bank: [
      {
        id: 'u08.chain.1',
        q: [{ p: t('1-pentinas apdorojamas $NaNH2$ skystame $NH3$ (gaunamas A), tada $CH3CH2Br$ (B), tada $H2$ su Lindlaro katalizatoriumi (C).', 'Pent-1-yne is treated with $NaNH2$ in liquid $NH3$ (giving A), then with $CH3CH2Br$ (B), then with $H2$ over the Lindlar catalyst (C).') },
          { mol: { smi: 'CCCC#C', name: t('1-pentinas', 'pent-1-yne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CCCC#[C-].[Na+]', ['CCCC([Na])=C', '[CH2-]CCC#C.[Na+]', 'CCCC(N)=C'],
          t('Stipri bazė atplėšia rūgščiausią protoną.', 'A strong base removes the most acidic proton.'), t('$NH2-$ atplėšia protoną nuo ≡C–H: susidaro natrio acetilenidas.', '$NH2-$ removes the proton from ≡C–H: sodium acetylide forms.')),
        molChoice(t('Kas yra B?', 'What is B?'), 'CCCC#CCC', ['CCCC(=C)CC', 'CCCC#C', 'CCCC=CCC'],
          t('Acetilenidas yra nukleofilas, kuris pakeičia halogeną.', 'The acetylide is a nucleophile that replaces the halogen.'), t('SN2: acetilenidas pakeičia bromą, grandinė pailgėja: 3-heptinas.', 'SN2: the acetylide replaces bromine and the chain grows: hept-3-yne.')),
        molChoice(t('Kas yra C?', 'What is C?'), 'CCC/C=C\\CC', ['CCCCCCC', 'CCC/C=C/CC', 'CCCC(=O)CC'],
          t('Lindlaro katalizatorius sustabdo hidrinimą ties alkenu.', 'The Lindlar catalyst stops the hydrogenation at the alkene.'), t('Prijungiamas vienas $H2$ iš vienos pusės: cis-3-heptenas.', 'One $H2$ adds from the same side: (Z)-hept-3-ene.'))],
        why: t('Kiekviena stadija naudoja skirtingą savybę: ≡C–H rūgštingumą (acetilenidas), anijono nukleofiliškumą (alkilinimas SN2) ir Lindlaro katalizatoriaus selektyvumą (cis-alkenas). Taip iš terminalinio alkino pereinama į internalinį, o po to į alkeną.', 'Each stage uses a different property: the acidity of ≡C–H (the acetylide), the nucleophilicity of the anion (SN2 alkylation) and the selectivity of the Lindlar catalyst (the cis alkene). So a terminal alkyne is turned into an internal one and then into an alkene.'), src: 'L8 p13, p19',
        claims: [{ name: ['CCCC#CCC', t('3-heptinas', 'hept-3-yne')] }, { ez: ['CCC/C=C\\CC', 3, 4, 'Z'] }]
      },
      {
        id: 'u08.chain.2',
        q: [{ p: t('Propinas veikiamas $NaNH2$ ($NH3$), tada 1-bromopropanu (A), tada $H2O$, $H2SO4$, $HgSO4$ (B ir C).', 'Propyne is treated with $NaNH2$ ($NH3$), then with 1-bromopropane (A), then with $H2O$, $H2SO4$, $HgSO4$ (B and C).') },
          { mol: { smi: 'CC#C', name: t('propinas', 'propyne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CC#CCCC', ['CCC#CCC', 'CC(=C)CCC', 'CC#CC'],
          t('Acetilenidas yra nukleofilas: prie kurio 1-brompropano atomo jis jungiasi?', 'The acetylide is a nucleophile: which carbon of 1-bromopropane does it attack?'), t('Propino acetilenidas (nukleofilas) SN2 mechanizmu išstumia bromidą iš 1-brompropano: susidaro 2-heksinas.', 'The propyne acetylide (a nucleophile) displaces bromide from 1-bromopropane by SN2: hex-2-yne forms.')),
        { prompt: t('Pažymėkite abu hidratacijos produktus (B ir C).', 'Pick both hydration products (B and C).'), kind: 'multi', options: mols(['CCCCC(C)=O', 'CCCC(=O)CC', 'CCCCCC=O', 'CC(O)CCCC']), answer: [0, 1],
          hint: t('Trigubąjį ryšį supa skirtingi pakaitai.', 'Different substituents flank the triple bond.'),
          solution: t('$OH$ gali jungtis prie bet kurio sp atomo, todėl susidaro du ketonai: 2-heksanonas ir 3-heksanonas.', 'The $OH$ may go to either sp carbon, so two ketones form: hexan-2-one and hexan-3-one.') }],
        why: t('Nesimetriniame internaliniame alkine trigubojo ryšio atomus supa skirtingi pakaitai, todėl $OH$ gali jungtis prie bet kurio jų. Todėl gaunami du ketonai, o ne vienas.', 'In an unsymmetrical internal alkyne different substituents flank the triple bond, so the $OH$ can go to either carbon. Therefore two ketones form, not one.'), src: 'L8 p19',
        claims: [{ react: ['yne.hydration', ['CC#CCCC'], null, 'CCCCC(C)=O'] }, { react: ['yne.hydration', ['CC#CCCC'], null, 'CCCC(=O)CC'] }, { name: ['CC#CCCC', t('2-heksinas', 'hex-2-yne')] }]
      },
      {
        id: 'u08.chain.3',
        q: [{ p: t('Iš etino gaminamas pentanas: (1) $NaNH2$, $CH3CH2Br$ (A); (2) $NaNH2$, $CH3I$ (B); (3) 2 ekv. $H2$, Pt (C).', 'Pentane is made from ethyne: (1) $NaNH2$, $CH3CH2Br$ (A); (2) $NaNH2$, $CH3I$ (B); (3) 2 equiv. $H2$, Pt (C).') },
          { mol: { smi: 'C#C', name: t('etinas', 'ethyne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CCC#C', ['CC#CC', 'CC=C', 'CCC=C'], t('Alkilinimas vyksta prie vieno atomo.', 'Alkylation takes place at one carbon.'), t('Vienas etino vandenilis pakeičiamas etilu: acetilenidas išstumia bromidą iš bromoetano ir gaunamas 1-butinas.', 'One hydrogen of ethyne is replaced by an ethyl group: the acetylide displaces bromide from bromoethane and but-1-yne results.')),
        molChoice(t('Kas yra B?', 'What is B?'), 'CC#CCC', ['CCC#C', 'CCC(C)=C', 'CC#CCCC'], t('Dar vienas alkilinimas.', 'One more alkylation.'), t('1-butinas vėl deprotonuojamas, ir metilas prisijungia prie galinio ≡C atomo: 2-pentinas.', 'But-1-yne is deprotonated again and the methyl joins the terminal ≡C carbon: pent-2-yne.')),
        molChoice(t('Kas yra C?', 'What is C?'), 'CCCCC', ['CC/C=C\\C', 'CCCC=C', 'CCC(=O)CC'], t('Kiek π ryšių sunaudoja du $H2$ ekvivalentai?', 'How many π bonds do two equivalents of $H2$ use up?'), t('Abu π ryšiai prisotinami: pentanas.', 'Both π bonds are saturated: pentane.'))],
        why: t('Etiną alkilinant du kartus, per trigubąjį ryšį sujungiamos dvi alkilo grupės, o hidrinant gaunamas norimas alkanas.', 'Alkylating ethyne twice joins two alkyl groups through the triple bond, and hydrogenation then gives the alkane wanted.'), src: 'L8 p13',
        claims: [{ name: ['CCC#C', t('1-butinas', 'but-1-yne')] }, { name: ['CC#CCC', t('2-pentinas', 'pent-2-yne')] }, { formula: ['CCCCC', 'C5H12'] }]
      },
      {
        id: 'u08.chain.4',
        q: [{ p: t('3-metil-1-butinas veikiamas 1 ekv. $HBr$ (A), po to dar 1 ekv. $HBr$ (B).', '3-methylbut-1-yne is treated with 1 equiv. $HBr$ (A), then with another 1 equiv. $HBr$ (B).') },
          { mol: { smi: 'C#CC(C)C', name: t('3-metil-1-butinas', '3-methylbut-1-yne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CC(C)C(Br)=C', ['CC(C)C=CBr', 'CC(C)C(Br)(Br)C', 'CC(C)CC(Br)Br'], t('Kuris trigubojo ryšio atomas, gavęs protoną, paliktų stabilesnį katijoną?', 'Which triple-bond carbon, on taking the proton, leaves the more stable cation?'), t('Bromas patenka į vidinį atomą: 2-brom-3-metil-1-butenas.', 'Bromine goes to the inner carbon: 2-bromo-3-methylbut-1-ene.')),
        molChoice(t('Kas yra B?', 'What is B?'), 'CC(C)C(C)(Br)Br', ['CC(C)C(Br)CBr', 'CC(C)CC(Br)Br', 'CC(C)C(Br)=C'], t('Kur antrojo prijungimo metu katijonas stabilesnis: ant atomo, kuris jau turi halogeną, ar ant kito?', 'Where is the cation more stable in the second addition: on the carbon that already carries the halogen, or on the other one?'), t('Antrasis bromas patenka ten, kur jau yra bromas: geminalinis dibromidas, 2,2-dibrom-3-metilbutanas.', 'The second bromine goes to the carbon that already carries bromine: a geminal dibromide, 2,2-dibromo-3-methylbutane.'))],
        why: t('Abu HBr ekvivalentai jungiasi pagal Markovnikovo taisyklę: pirmasis duoda halogenalkeną, antrasis – geminalinį dihalogenidą, nes halogenas stabilizuoja gretimą teigiamą krūvį.', 'Both HBr equivalents add by Markovnikov’s rule: the first gives a haloalkene, the second a geminal dihalide, because the halogen helps to stabilise the neighbouring positive charge.'), src: 'L8 p9',
        claims: [{ react: ['yne.hx', ['C#CC(C)C'], { X: 'Br', eq: 1 }, 'CC(C)C(Br)=C'] }, { react: ['yne.hx', ['C#CC(C)C'], { X: 'Br', eq: 2 }, 'CC(C)C(C)(Br)Br'] }, { name: ['CC(C)C(C)(Br)Br', t('2,2-dibrom-3-metilbutanas', '2,2-dibromo-3-methylbutane')] }]
      },
      {
        id: 'u08.chain.5',
        q: [{ p: t('2-butinas reaguoja su bromu (1 ekv., A), po to su dar vienu ekvivalentu (B).', 'But-2-yne reacts with bromine (1 equiv., A), then with another equivalent (B).') }, { mol: { smi: 'CC#CC', name: t('2-butinas', 'but-2-yne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CC(Br)=C(C)Br', ['CC(Br)(Br)CC', 'CC(Br)C(C)Br', 'CC=C(C)Br'], t('Halogenas jungiasi prie abiejų atomų, lieka dvigubasis ryšys.', 'The halogen goes onto both carbons and a double bond remains.'), t('Halogenas jungiasi prie abiejų atomų, o likęs π ryšys išlieka: 2,3-dibrom-2-butenas.', 'The halogen goes onto both carbons and one π bond remains: 2,3-dibromobut-2-ene.')),
        molChoice(t('Kas yra B?', 'What is B?'), 'CC(Br)(Br)C(C)(Br)Br', ['CC(Br)C(C)Br', 'CC(Br)=C(C)Br', 'CC(Br)(Br)CC'], t('Antrasis $Br2$ prisijungia prie likusio dvigubojo ryšio.', 'The second $Br2$ adds to the remaining double bond.'), t('Antrasis $Br2$ sunaudoja likusį π ryšį, ir kiekvienas atomas gauna po du bromus: 2,2,3,3-tetrabrombutanas.', 'The second $Br2$ uses up the remaining π bond and each carbon gets two bromines: 2,2,3,3-tetrabromobutane.'))],
        why: t('Alkinas turi du π ryšius, todėl halogeną prijungia du kartus. Kiekviena $Br2$ molekulė jungiasi prie abiejų buvusių trigubojo ryšio atomų, todėl po dviejų ekvivalentų kiekvienas jų turi po du bromo atomus.', 'An alkyne has two π bonds, so it adds halogen twice. Each $Br2$ goes onto both former triple-bond carbons, so after two equivalents each of them carries two bromines.'), src: 'L8 p18',
        claims: [{ react: ['yne.x2', ['CC#CC'], { X: 'Br', eq: 1 }, 'CC(Br)=C(C)Br'] }, { react: ['yne.x2', ['CC#CC'], { X: 'Br', eq: 2 }, 'CC(Br)(Br)C(C)(Br)Br'] }, { name: ['CC(Br)(Br)C(C)(Br)Br', t('2,2,3,3-tetrabrombutanas', '2,2,3,3-tetrabromobutane')] }]
      },
      {
        id: 'u08.chain.6',
        q: [{ p: t('Etinas reaguoja su HCl (1 ekv., A), po to su dar vienu ekvivalentu HCl (B).', 'Ethyne reacts with HCl (1 equiv., A), then with another equivalent of HCl (B).') }, { mol: { smi: 'C#C', name: t('etinas', 'ethyne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'C=CCl', ['ClCCCl', 'CCCl', 'ClC=CCl'], t('Po vieno prijungimo lieka dvigubasis ryšys.', 'After one addition a double bond remains.'), t('Vienas π ryšys prisotinamas, kitas lieka: chloretenas (vinilo chloridas).', 'One π bond is used and one remains: chloroethene (vinyl chloride).')),
        molChoice(t('Kas yra B?', 'What is B?'), 'CC(Cl)Cl', ['ClCCCl', 'C=CCl', 'CCCl'], t('Kur antrojo prijungimo metu katijonas stabilesnis: ant atomo, kuris jau turi halogeną, ar ant kito?', 'Where is the cation more stable in the second addition: on the carbon that already carries the halogen, or on the other one?'), t('Geminalinis 1,1-dichloretanas, o ne 1,2-.', 'Geminal 1,1-dichloroethane, not the 1,2 isomer.'))],
        why: t('Chloras stabilizuoja gretimą teigiamą krūvį, todėl antrasis HCl jungiasi prie to paties atomo ir gaunamas 1,1-dichloretanas, o ne 1,2-izomeras.', 'Chlorine helps to stabilise a neighbouring positive charge, so the second HCl adds to the same carbon and 1,1-dichloroethane forms, not the 1,2 isomer.'), src: 'L8 p9',
        claims: [{ react: ['yne.hx', ['C#C'], { X: 'Cl', eq: 1 }, 'C=CCl'] }, { react: ['yne.hx', ['C#C'], { X: 'Cl', eq: 2 }, 'CC(Cl)Cl'] }, { name: ['CC(Cl)Cl', t('1,1-dichloretanas', '1,1-dichloroethane')] }]
      },
      {
        id: 'u08.chain.7',
        q: [{ p: t('Propinas: (1) $NaNH2$, $CH3I$ (A); (2) $H2$, Lindlaro katalizatorius (B); (3) $HBr$ (C).', 'Propyne: (1) $NaNH2$, $CH3I$ (A); (2) $H2$, Lindlar catalyst (B); (3) $HBr$ (C).') }, { mol: { smi: 'CC#C', name: t('propinas', 'propyne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CC#CC', ['CCC#C', 'CC=CC', 'CC=C'], t('Alkilinimas metilu.', 'Alkylation with methyl.'), t('Acetilenidas SN2 mechanizmu išstumia jodidą iš $CH3I$: 2-butinas.', 'The acetylide displaces iodide from $CH3I$ by SN2: but-2-yne.')),
        molChoice(t('Kas yra B?', 'What is B?'), 'C/C=C\\C', ['C/C=C/C', 'CCCC', 'CCC=C'], t('Iš kurios pusės abu vandenilio atomai prisijungia katalizatoriaus paviršiuje?', 'From which side do both hydrogens add on the catalyst surface?'), t('Lindlaro katalizatoriaus paviršiuje abu H atomai prisijungia iš tos pačios pusės, todėl iš 2-butino gaunamas cis-2-butenas.', 'On the Lindlar catalyst surface both H atoms add from the same side, so but-2-yne gives (Z)-but-2-ene.')),
        molChoice(t('Kas yra C?', 'What is C?'), 'CCC(C)Br', ['CC(C)CBr', 'CCCCBr', 'CC(Br)C(C)Br'], t('Alkeno ir HBr reakcija (AE).', 'Alkene plus HBr (AE).'), t('Alkeno ir HBr AE reakcija (Markovnikovo taisyklė negalioja, nes alkenas simetriškas): 2-brombutanas.', 'AE of HBr to the alkene (the alkene is symmetric, so there is one product): 2-bromobutane.'))],
        why: t('Trys skirtingos reakcijos: acetilenido alkilinimas, hidrinimas ant Lindlaro katalizatoriaus (cis-alkenas) ir elektrofilinis HBr prijungimas prie alkeno (AE).', 'Three different reactions: alkylation of an acetylide, hydrogenation over the Lindlar catalyst (the cis alkene) and electrophilic addition of HBr to the alkene (AE).'), src: 'L8 p13, p18',
        claims: [{ ez: ['C/C=C\\C', 1, 2, 'Z'] }, { react: ['ae.hx', ['CC=CC'], { X: 'Br' }, 'CCC(C)Br'] }, { name: ['CCC(C)Br', t('2-brombutanas', '2-bromobutane')] }]
      },
      {
        id: 'u08.chain.8',
        q: [{ p: t('3-metil-1-butinas veikiamas $NaNH2$, po to 1-brombutanu (A), tada karštu šarminiu $KMnO4$ (B ir C).', '3-methylbut-1-yne is treated with $NaNH2$, then with 1-bromobutane (A), then with hot alkaline $KMnO4$ (B and C).') },
          { mol: { smi: 'C#CC(C)C', name: t('3-metil-1-butinas', '3-methylbut-1-yne') } }],
        steps: [molChoice(t('Kas yra A?', 'What is A?'), 'CC(C)C#CCCCC', ['CC(C)C(=C)CCCC', 'CC(C)C#C', 'CCCCC#CC'], t('Šakotas alkinas imamas kaip nukleofilas, o pirminis bromidas – kaip elektrofilas.', 'The branched alkyne serves as the nucleophile and the primary bromide as the electrophile.'), t('Šakotas alkinas virsta acetilenidu ir SN2 mechanizmu išstumia bromidą iš 1-brombutano: 2-metil-3-oktinas.', 'The branched alkyne becomes an acetylide and displaces bromide from 1-bromobutane by SN2: 2-methyloct-3-yne.')),
        { prompt: t('Pažymėkite abi rūgštis.', 'Pick both acids.'), kind: 'multi', options: mols(['CC(C)C(O)=O', 'CCCCC(O)=O', 'CCCC(O)=O', 'CC(C)CC(O)=O', 'O=C=O']), answer: [0, 1],
          hint: t('Grandinė nutrūksta ties trigubuoju ryšiu.', 'The chain is cut at the triple bond.'),
          solution: t('Iš kairės pusės – 2-metilpropano rūgštis, iš dešinės – pentano rūgštis; $CO2$ nesusidaro, nes alkinas internalinis.', 'The left side gives 2-methylpropanoic acid, the right side pentanoic acid; no $CO2$ forms, because the alkyne is internal.') }],
        why: t('Kaitinant su šarminiu $KMnO4$, alkinas skyla ties trigubuoju ryšiu ir iš kiekvienos pusės gaunama karboksirūgštis. Todėl rūgštys parodo, kokios grandinės buvo abipus trigubojo ryšio.', 'On heating with alkaline $KMnO4$ an alkyne is cleaved at the triple bond and each side gives a carboxylic acid. So the acids show which chains were on either side of the triple bond.'), src: 'L8 p13, p15',
        claims: [{ react: ['ox.kmno4.harsh', ['CC(C)C#CCCCC'], null, 'CC(C)C(O)=O'] }, { react: ['ox.kmno4.harsh', ['CC(C)C#CCCCC'], null, 'CCCCC(O)=O'] }, { name: ['CC(C)C#CCCCC', t('2-metil-3-oktinas', '2-methyloct-3-yne')] }, { name: ['CCCCC(O)=O', t('pentano rūgštis', 'pentanoic acid')] }]
      }
    ]
  };

  // ---------- u08.test: telling compounds apart ----------
  const T_TEST = {
    id: 'u08.test',
    title: t('Alkinų ir kitų junginių atpažinimas', 'Telling alkynes and other compounds apart'),
    mirrors: ['S4.7', 'S4.16'],
    bank: [
      {
        id: 'u08.test.1',
        q: [{ p: t('Trijuose mėgintuvėliuose yra pentanas, 1-pentenas ir 1-pentinas.', 'Three test tubes contain pentane, pent-1-ene and pent-1-yne.') }, row([['CCCCC', t('pentanas', 'pentane')], ['CCCC=C', t('1-pentenas', 'pent-1-ene')], ['CCCC#C', t('1-pentinas', 'pent-1-yne')]])],
        steps: [{
          prompt: t('Kurie junginiai nuspalvina bromo vandenį? Pažymėkite visus.', 'Which compounds decolourise bromine water? Pick them all.'),
          kind: 'multi', options: mols(['CCCCC', 'CCCC=C', 'CCCC#C']), answer: [1, 2],
          hint: t('Bromas jungiasi prie π ryšių.', 'Bromine adds to π bonds.'),
          solution: t('Pentanas nereaguoja; alkenas ir alkinas prijungia bromą ir tirpalas pasidaro bespalvis.', 'Pentane does not react; the alkene and the alkyne add bromine and the solution turns colourless.')
        }],
        why: t('Bromas jungiasi prie bet kurio π ryšio, todėl alkenas ir alkinas jį nuspalvina, o sotusis pentanas – ne. Bromo vanduo parodo nesotumą, bet neatskiria dvigubojo ryšio nuo trigubojo.', 'Bromine adds to any π bond, so the alkene and the alkyne decolourise it while saturated pentane does not. Bromine water shows unsaturation but does not tell a double bond from a triple bond.'), src: 'LW6 p1'
      },
      {
        id: 'u08.test.2',
        q: [{ p: t('Du mėgintuvėliai: 1-butinas ir 2-butinas. Abu nuspalvina bromo vandenį.', 'Two tubes: but-1-yne and but-2-yne. Both decolourise bromine water.') }, row([['CCC#C', t('1-butinas', 'but-1-yne')], ['CC#CC', t('2-butinas', 'but-2-yne')]])],
        steps: [txtChoice(t('Kuris reagentas juos atskirs?', 'Which reagent will tell them apart?'),
          [t('$CuCl$ ir $NH3$', '$CuCl$ and $NH3$'), t('$KMnO4$ tirpalas', '$KMnO4$ solution'), t('bromo vanduo, didesnis kiekis', 'more bromine water'), t('$H2$, Pt', '$H2$, Pt')], 0,
          t('Kuo skiriasi du alkinai: ar vienas iš jų turi rūgštų vandenilį?', 'How do the two alkynes differ: does one have an acidic hydrogen?'),
          t('Tik 1-butinas turi ≡C–H: su $CuCl$/$NH3$ iškrenta rausvai rudos nuosėdos. Visi kiti reagentai veikia abu.', 'Only but-1-yne has a ≡C–H: with $CuCl$/$NH3$ a red-brown precipitate forms. All the other reagents act on both.'))],
        why: t('Bendri bandymai ($Br2$, $KMnO4$, $H2$) veikia ir terminalinį, ir internalinį alkiną. Tik rūgštus ≡C–H duoda vario acetilenidą, todėl šis bandymas skiria 1-butiną nuo 2-butino.', 'General tests ($Br2$, $KMnO4$, $H2$) act on terminal and internal alkynes alike. Only an acidic ≡C–H gives copper acetylide, so this test separates but-1-yne from but-2-yne.'), src: 'L8 p12', claims: [{ react: ['yne.cu', ['CCC#C'], null, 'CCC#C[Cu]'] }]
      },
      {
        id: 'u08.test.3',
        q: [{ p: t('Žinomi trys bandymai.', 'Three tests are known.') }],
        steps: [{
          prompt: t('Kiekvienam reagentui priskirkite, ką jis parodo.', 'Match each reagent with what it shows.'), kind: 'match',
          answer: { left: [{ text: t('bromo vanduo', 'bromine water') }, { text: t('$KMnO4$ tirpalas', '$KMnO4$ solution') }, { text: t('$CuCl$, $NH3$', '$CuCl$, $NH3$') }],
            right: [{ text: t('π ryšys: tirpalas išblunka', 'a π bond: the solution is decolourised') }, { text: t('π ryšys: violetinė spalva išnyksta, iškrenta rudos nuosėdos', 'a π bond: violet colour fades, brown precipitate forms') }, { text: t('galinis ≡C–H: rausvai rudos nuosėdos', 'a terminal ≡C–H: red-brown precipitate') }], pairs: [0, 1, 2] },
          hint: t('Du reagentai bendri, vienas specifinis.', 'Two reagents are general, one is specific.'),
          solution: t('Bromo vanduo ir $KMnO4$ rodo dvigubąjį ar trigubąjį ryšį; $CuCl$/$NH3$ – tik terminalinį alkiną.', 'Bromine water and $KMnO4$ show a double or triple bond; $CuCl$/$NH3$ only a terminal alkyne.')
        }],
        why: t('Bendri bandymai (bromo vanduo, $KMnO4$) rodo bet kokį π ryšį, o specifinis ($CuCl$/$NH3$) – rūgštų ≡C–H. Derinant juos gaunama daugiau informacijos nei vienu.', 'The general tests (bromine water, $KMnO4$) show any π bond, whereas the specific one ($CuCl$/$NH3$) shows an acidic ≡C–H. Used together they tell more than any one alone.'), src: 'LW6 p1; L8 p12'
      },
      {
        id: 'u08.test.4',
        q: [{ p: t('Pateikti heksanas, 1-heksenas ir 1-heksinas.', 'Hexane, hex-1-ene and hex-1-yne are given.') }],
        steps: [txtChoice(t('Kokia seka atpažins visus tris?', 'Which sequence identifies all three?'),
          [t('Bromo vanduo (heksanas nepakinta), po to $CuCl$/$NH3$ likusiems dviem.', 'Bromine water (hexane is unchanged), then $CuCl$/$NH3$ on the other two.'),
            t('Tik bromo vanduo.', 'Bromine water alone.'), t('Tik $KMnO4$.', '$KMnO4$ alone.'), t('Tik $CuCl$/$NH3$.', '$CuCl$/$NH3$ alone.')], 0,
          t('Reikia bendro ir specifinio bandymo.', 'A general and a specific test are needed.'),
          t('Bromas atskiria heksaną; iš likusių tik heksinas duoda nuosėdų su $CuCl$/$NH3$.', 'Bromine separates hexane; of the others only the alkyne gives a precipitate with $CuCl$/$NH3$.'))],
        why: t('Pirmiausia bendru bandymu (bromo vandeniu) atskiriamas sotusis junginys: heksanas spalvos nekeičia. Likusius du nesočiuosius junginius skiria tik specifinis bandymas: rūgštų ≡C–H turintis 1-heksinas su $CuCl$/$NH3$ duoda rausvai rudų nuosėdų, o 1-heksenas – ne.', 'A general test (bromine water) first separates the saturated compound: hexane does not change the colour. Only a specific test tells the two unsaturated ones apart: hex-1-yne, with its acidic ≡C–H, gives a red-brown precipitate with $CuCl$/$NH3$, and hex-1-ene does not.'), src: 'LW6 p1; L8 p12'
      },
      {
        id: 'u08.test.5',
        q: [{ p: t('C₅H₈ junginys nuspalvina bromo vandenį ir su $CuCl$/$NH3$ duoda nuosėdų. Karštas šarminis $KMnO4$ jį skaido į 2-metilpropano rūgštį ir $CO2$.', 'A C₅H₈ compound decolourises bromine water and gives a precipitate with $CuCl$/$NH3$. Hot alkaline $KMnO4$ cleaves it to 2-methylpropanoic acid and $CO2$.') }],
        steps: [molChoice(t('Kuris tai junginys?', 'Which compound is it?'), 'CC(C)C#C', ['CCCC#C', 'CC#CCC', 'C=CC(C)=C'], t('Kokia grandinė lieka po oksidavimo?', 'Which chain remains after oxidation?'), t('Nuosėdos su $CuCl$/$NH3$ rodo terminalinį alkiną, o $CO2$ – galinį ≡C–H atomą. 2-metilpropano rūgštis yra likusi šakota keturių anglių dalis, todėl tai 3-metil-1-butinas.', 'The precipitate shows a terminal alkyne and $CO2$ the terminal ≡C–H carbon. 2-Methylpropanoic acid is the remaining branched four-carbon part, so the compound is 3-methylbut-1-yne.'))],
        why: t('Nuosėdos su $CuCl$/$NH3$ parodo terminalinį alkiną, o oksidavimo produktai – grandinės sandarą: $CO2$ susidaro iš ≡C–H atomo, rūgštis – iš likusios grandinės. Taip galima atkurti struktūrą.', 'The precipitate with $CuCl$/$NH3$ shows a terminal alkyne and the oxidation products show the structure of the chain: $CO2$ comes from the ≡C–H carbon and the acid from the rest of the chain. This lets you rebuild the structure.'), src: 'L8 p12, p15',
        claims: [{ formula: ['CC(C)C#C', 'C5H8'] }, { react: ['ox.kmno4.harsh', ['CC(C)C#C'], null, 'CC(C)C(O)=O'] }, { react: ['yne.cu', ['CC(C)C#C'], null, 'CC(C)C#C[Cu]'] }, { name: ['CC(C)C#C', t('3-metil-1-butinas', '3-methylbut-1-yne')] }, { formula: ['C=CC(C)=C', 'C5H8'] }]
      },
      {
        id: 'u08.test.6',
        q: [{ p: t('C₆H₁₀ junginys nereaguoja su $CuCl$/$NH3$. Hidratuojant ($HgSO4$) susidaro vienintelis ketonas.', 'A C₆H₁₀ compound does not react with $CuCl$/$NH3$. Hydration ($HgSO4$) gives a single ketone.') }],
        steps: [molChoice(t('Kuris tai junginys?', 'Which compound is it?'), 'CCC#CCC', ['CC#CCCC', 'CCCCC#C', 'C1=CCCCC1'], t('Nėra ≡C–H, o ketonas vienas: kokia simetrija?', 'There is no ≡C–H and one ketone only: what symmetry does that suggest?'), t('Nuosėdų nėra, todėl alkinas internalinis; vienas ketonas reiškia simetrinį alkiną: 3-heksinas duoda 3-heksanoną.', 'No precipitate means an internal alkyne; one ketone means a symmetric alkyne: hex-3-yne gives hexan-3-one.'))],
        why: t('Simetriškas internalinis alkinas neturi ≡C–H, todėl nereaguoja su $CuCl$/$NH3$, o hidratuojamas duoda vieną ketoną, nes abi trigubojo ryšio pusės vienodos.', 'A symmetric internal alkyne has no ≡C–H, so it does not react with $CuCl$/$NH3$, and on hydration it gives one ketone because both sides of the triple bond are alike.'), src: 'L8 p10',
        claims: [{ formula: ['CCC#CCC', 'C6H10'] }, { react: ['yne.hydration', ['CCC#CCC'], null, 'CCCC(CC)=O'] }, { formula: ['C1=CCCCC1', 'C6H10'] }]
      },
      {
        id: 'u08.test.7',
        q: [{ p: t('Pateikti keli teiginiai apie alkinų atpažinimą.', 'Several statements are made about recognising alkynes.') }],
        steps: [{
          prompt: t('Pažymėkite teisingus teiginius.', 'Pick the correct statements.'), kind: 'multi',
          options: [{ text: t('Vario acetilenidas iškrenta tik iš terminalinio alkino.', 'Copper acetylide forms only from a terminal alkyne.') },
            { text: t('Bromo vanduo išblunka ir nuo alkeno, ir nuo alkino.', 'Bromine water is decolourised by an alkene and by an alkyne.') },
            { text: t('Sausi sidabro ir vario acetilenidai gali sprogti.', 'Dry silver and copper acetylides can explode.') },
            { text: t('Bromo vanduo skiria alkeną nuo alkino.', 'Bromine water tells an alkene from an alkyne.') },
            { text: t('2-butinas su $CuCl$/$NH3$ duoda nuosėdų.', 'But-2-yne gives a precipitate with $CuCl$/$NH3$.') }], answer: [0, 1, 2],
          hint: t('Ar bromas ar $CuCl$ skiria alkeną nuo alkino?', 'Which of bromine or $CuCl$ separates an alkene from an alkyne?'),
          solution: t('Bromas reaguoja su bet kuriuo π ryšiu. Nuosėdos – tik su ≡C–H. Sausi acetilenidai pavojingi.', 'Bromine reacts with any π bond. A precipitate needs a ≡C–H. Dry acetylides are dangerous.')
        }],
        why: t('Bromas ir $KMnO4$ reaguoja su bet kokiu π ryšiu, todėl neskiria alkeno nuo alkino. Nuosėdas duoda tik rūgštus ≡C–H, o sausi acetilenidai yra sprogūs.', 'Bromine and $KMnO4$ react with any π bond, so they do not tell an alkene from an alkyne. Only an acidic ≡C–H gives a precipitate, and dry acetylides are explosive.'), src: 'L8 p12; Klein'
      },
      {
        id: 'u08.test.8',
        q: [{ p: t('Pro violetinį $KMnO4$ tirpalą leidžiamos dujos.', 'A gas is passed through violet $KMnO4$ solution.') }],
        steps: [txtChoice(t('Tirpalas nuspalvinamas, iškrenta rudos nuosėdos. Ką galima teigti?', 'The solution is decolourised and brown solid precipitates. What can be concluded?'),
          [t('Dujos turi dvigubąjį ar trigubąjį ryšį (nesotusis junginys).', 'The gas has a double or a triple bond (an unsaturated compound).'), t('Dujos yra tikrai alkinas.', 'The gas is certainly an alkyne.'),
            t('Dujos yra alkanas.', 'The gas is an alkane.'), t('Dujos turi terminalinį ≡C–H.', 'The gas has a terminal ≡C–H.')], 0,
          t('Ar $KMnO4$ skiria dvigubąjį ryšį nuo trigubojo?', 'Does $KMnO4$ distinguish a double bond from a triple bond?'),
          t('Rudos $MnO2$ nuosėdos ir išblukęs tirpalas rodo oksidavimą, bet tą daro ir alkenai, ir alkinai; tipas lieka nežinomas.', 'The brown $MnO2$ and the faded solution show oxidation, but alkenes and alkynes both do this; the kind stays unknown.'))],
        why: t('Praskiestas $KMnO4$ oksiduoja π ryšį, tirpalas išblunka ir iškrenta rudos $MnO2$ nuosėdos. Tą patį daro ir alkenai, ir alkinai, todėl bandymas rodo nesotumą, bet ne ryšio tipą.', 'Dilute $KMnO4$ oxidises a π bond, the solution fades and brown $MnO2$ precipitates. Alkenes and alkynes both do this, so the test shows unsaturation but not the kind of bond.'), src: 'LW6 p1'
      }
    ]
  };

  // ---------- u08.ring: small rings ----------
  const T_RING = {
    id: 'u08.ring',
    title: t('Mažieji ciklai', 'Small rings'),
    mirrors: [],
    bank: [
      {
        id: 'u08.ring.1',
        q: [{ p: t('Ciklopropanas reaguoja su HI.', 'Cyclopropane reacts with HI.') }, { scheme: { items: [{ smi: 'C1CC1', name: t('ciklopropanas', 'cyclopropane') }, { plus: true }, { smi: 'I' }, { arrow: '→' }] } }],
        steps: [molChoice(t('Koks yra produktas?', 'What is the product?'), 'CCCI', ['IC1CC1', 'CC(C)I', 'C=CC'], t('Žiedas atsiveria ar lieka?', 'Does the ring open or stay?'),
          t('Žiedas atsiveria: $H$ ir $I$ prisijungia prie dviejų žiedo atomų, gaunamas 1-jodpropanas.', 'The ring opens: $H$ and $I$ add to two ring carbons, giving 1-iodopropane.'))],
        why: t('Ciklopropano žiedas įtemptas, todėl jo C–C ryšys elgiasi panašiai kaip π ryšys ir HI jį atveria. Gaunamas atviros grandinės 1-jodpropanas, o ne pakeistas ciklas.', 'The cyclopropane ring is strained, so its C–C bond behaves somewhat like a π bond and HI opens it. The product is open-chain 1-iodopropane, not a substituted ring.'), src: 'L8 p17', claims: [{ name: ['CCCI', t('1-jodpropanas', '1-iodopropane')] }, { formula: ['CCCI', 'C3H7I'] }]
      },
      {
        id: 'u08.ring.2',
        q: [{ p: t('Ciklopropanas reaguoja su bromu žemoje temperatūroje, be šviesos.', 'Cyclopropane reacts with bromine at low temperature in the dark.') }],
        steps: [molChoice(t('Koks yra produktas?', 'What is the product?'), 'BrCCCBr', ['BrC1CC1', 'CC(Br)CBr', 'BrC1(Br)CC1'], t('Radikalinis pakeitimas reikalauja šviesos.', 'Radical substitution needs light.'),
          t('Be šviesos radikalinis pakeitimas nevyksta; žiedas atsiveria ir gaunamas 1,3-dibrompropanas.', 'Without light radical substitution does not occur; the ring opens to 1,3-dibromopropane.'))],
        why: t('Be šviesos radikalinis pakeitimas nevyksta, bet įtemptas žiedas su bromu reaguoja ir žemoje temperatūroje. Žiedas atsiveria, o abu bromo atomai atsiduria grandinės galuose.', 'Without light radical substitution does not occur, but the strained ring reacts with bromine even at low temperature. The ring opens and both bromine atoms end up at the ends of the chain.'), src: 'L8 p17', claims: [{ name: ['BrCCCBr', t('1,3-dibrompropanas', '1,3-dibromopropane')] }]
      },
      {
        id: 'u08.ring.3',
        q: [{ p: t('Ciklopropano C–C–C kampai yra 60°.', 'The C–C–C angles of cyclopropane are 60°.') }],
        steps: [{ prompt: t('Kiek laipsnių nukrypsta nuo tetraedrinio kampo 109,5°?', 'By how many degrees does it deviate from the tetrahedral angle of 109.5°?'), kind: 'number', answer: { value: 49.5, tol: 0.1 },
          hint: t('Atimkite.', 'Subtract.'), solution: t('109,5° − 60° = 49,5°.', '109.5° − 60° = 49.5°.') },
        txtChoice(t('Ką tai lemia?', 'What does this cause?'), [t('Kampinę (Bajerio) įtemptį ir didelį reaktingumą.', 'Angle (Baeyer) strain and high reactivity.'), t('Didesnį stabilumą.', 'Greater stability.'), t('Laisvą sukimąsi apie $C-C$.', 'Free rotation about $C-C$.'), t('Aromatiškumą.', 'Aromaticity.')], 0,
          t('Nuokrypis kainuoja energiją.', 'A deviation costs energy.'), t('Didelis nuokrypis reiškia didelę įtemptį ir silpnus ryšius, todėl žiedas lengvai atsiveria.', 'A large deviation means strain and weak bonds, so the ring opens easily.'))],
        why: t('Kuo labiau valentiniai kampai nukrypsta nuo 109,5°, tuo silpniau persikloja orbitalės ir tuo didesnė kampinė įtemptis. Atsivėrus ciklopropano žiedui ši energija išsiskiria, todėl jis reaguoja panašiai kaip alkenas; ciklopentanas ir cikloheksanas beveik neįtempti ir taip nereaguoja.', 'The more the bond angles deviate from 109.5°, the poorer the orbital overlap and the larger the angle strain. Opening the cyclopropane ring releases this energy, so it reacts much like an alkene; cyclopentane and cyclohexane are almost strain-free and do not react this way.'), src: 'T p48'
      },
      {
        id: 'u08.ring.4',
        q: [{ p: t('Plokščio ciklobutano kampai 90°.', 'The angles of planar cyclobutane are 90°.') }],
        steps: [txtChoice(t('Kurio plokščio žiedo kampai mažiausiai nukrypsta nuo 109,5°?', 'Which planar ring has angles that deviate least from 109.5°?'), [t('ciklopentanas (108°)', 'cyclopentane (108°)'), t('ciklobutanas (90°)', 'cyclobutane (90°)'), t('ciklopropanas (60°)', 'cyclopropane (60°)')], 0,
          t('Palyginkite kiekvieno žiedo kampą su tetraedriniu.', 'Compare the angle of each ring with the tetrahedral one.'), t('Nuokrypiai: ciklopentanas 1,5°, ciklobutanas 19,5° (109,5° − 90°), ciklopropanas 49,5°.', 'Deviations: cyclopentane 1.5°, cyclobutane 19.5° (109.5° − 90°), cyclopropane 49.5°.')),
        { prompt: t('Išdėstykite ciklus nuo reaktingiausio.', 'Order the rings from the most reactive.'), kind: 'order',
          options: [{ text: t('ciklopropanas', 'cyclopropane') }, { text: t('ciklobutanas', 'cyclobutane') }, { text: t('ciklopentanas', 'cyclopentane') }, { text: t('cikloheksanas', 'cyclohexane') }],
          hint: t('Palyginkite, kiek kiekvieno plokščio žiedo kampas nukrypsta nuo 109,5°.', 'Compare how far the angle of each planar ring deviates from 109.5°.'), solution: t('Įtemptis mažėja didėjant žiedui; cikloheksanas beveik be įtempties.', 'Strain falls as the ring grows; cyclohexane has almost none.') }],
        why: t('Kampinė įtemptis mažėja, kai žiedo kampai artėja prie 109,5°, todėl mažėja ir reaktingumas: ciklopropanas > ciklobutanas > ciklopentanas > cikloheksanas. Ciklobutano žiedas irgi gali atsiverti, bet tik griežtesnėmis sąlygomis.', 'Angle strain falls as the ring angles approach 109.5°, and so does the reactivity: cyclopropane > cyclobutane > cyclopentane > cyclohexane. The cyclobutane ring can open too, but only under harsher conditions.'), src: 'T p48, p60'
      },
      {
        id: 'u08.ring.5',
        q: [{ p: t('Trys ciklai veikiami bromu kambario temperatūroje, tamsoje.', 'Three rings are treated with bromine at room temperature in the dark.') }, row([['C1CC1', t('ciklopropanas', 'cyclopropane')], ['C1CCCCC1', t('cikloheksanas', 'cyclohexane')], ['C1CCCC1', t('ciklopentanas', 'cyclopentane')]])],
        steps: [txtChoice(t('Kuris reaguoja lengvai atsiverdamas?', 'Which one reacts readily by ring opening?'), [t('ciklopropanas', 'cyclopropane'), t('cikloheksanas', 'cyclohexane'), t('ciklopentanas', 'cyclopentane'), t('nė vienas', 'none')], 0,
          t('Kuris turi didžiausią kampinę įtemptį?', 'Which has the largest angle strain?'), t('Tik ciklopropanas, kurio kampai 60°; kiti ciklai beveik be įtempties.', 'Only cyclopropane, with its 60° angles; the other rings have almost no strain.'))],
        why: t('Kuo labiau valentiniai kampai nukrypsta nuo 109,5°, tuo silpniau persikloja orbitalės ir tuo didesnė kampinė įtemptis. Atsivėrus ciklopropano žiedui ši energija išsiskiria, todėl jis reaguoja panašiai kaip alkenas; ciklopentanas ir cikloheksanas beveik neįtempti ir taip nereaguoja.', 'The more the bond angles deviate from 109.5°, the poorer the orbital overlap and the larger the angle strain. Opening the cyclopropane ring releases this energy, so it reacts much like an alkene; cyclopentane and cyclohexane are almost strain-free and do not react this way.'), src: 'L8 p17'
      },
      {
        id: 'u08.ring.6',
        q: [{ p: t('Propenas ir ciklopropanas turi tą pačią formulę.', 'Propene and cyclopropane have the same formula.') }, row([['C=CC', t('propenas', 'propene')], ['C1CC1', t('ciklopropanas', 'cyclopropane')]])],
        steps: [txtChoice(t('Kuris iš jų išblukina praskiestą $KMnO4$ tirpalą?', 'Which of them decolourises dilute $KMnO4$ solution?'), [t('propenas', 'propene'), t('ciklopropanas', 'cyclopropane'), t('abu', 'both'), t('nė vienas', 'neither')], 0,
            t('Ar ciklopropanas turi π ryšį, kurį galėtų oksiduoti $KMnO4$?', 'Does cyclopropane have a π bond that $KMnO4$ could oxidise?'), t('Propeno π ryšys oksiduojamas, o ciklopropanas oksidavimui atsparus; tai atskiria juos.', 'The π bond of propene is oxidised, whereas cyclopropane resists oxidation; this separates them.'))],
        why: t('Propeno π ryšys oksiduojamas, o ciklopropano C–C ryšiai – ne, nors su HX ir $X2$ abu reaguoja. Todėl $KMnO4$ skiria alkeną nuo ciklopropano.', 'The π bond of propene is oxidised but the C–C bonds of cyclopropane are not, although both react with HX and $X2$. So $KMnO4$ tells the alkene from cyclopropane.'), src: 'L8 p17; Klein',
        claims: [{ formula: ['C=CC', 'C3H6'] }, { formula: ['C1CC1', 'C3H6'] }]
      },
      {
        id: 'u08.ring.7',
        q: [{ p: t('Ciklopropano molekulė plokščia, visi H užstoti.', 'The cyclopropane molecule is planar, with all H eclipsed.') }],
        steps: [txtChoice(t('Kuris teiginys teisingas?', 'Which statement is correct?'), [t('Ciklopropanas neturi konformerų: žiedas standus.', 'Cyclopropane has no conformers: the ring is rigid.'), t('Jis gali virsti kėdės forma.', 'It can flip into a chair.'), t('Jo C–C ryšiai ilgesni už alkanų.', 'Its C–C bonds are longer than in alkanes.'), t('Jame yra sp² atomai.', 'It contains sp² carbons.')], 0,
          t('Ar trinaris žiedas gali išsilenkti taip, kaip cikloheksanas?', 'Can a three-membered ring pucker the way cyclohexane does?'), t('Trinaris žiedas negali išsilenkti ar persisukti: jo atomai visada vienoje plokštumoje, todėl skirtingų erdvinių formų (konformerų) nėra.', 'A three-membered ring cannot pucker or twist: its atoms always lie in one plane, so it has no different shapes (conformers).'))],
        why: t('Trys atomai visada guli vienoje plokštumoje, todėl standaus žiedo išlenkti negalima ir jo H atomai yra užstoti. Užstota konformacija ir 60° kampai sukuria didelę įtemptį.', 'Three atoms always lie in one plane, so the rigid ring cannot pucker and its H atoms are eclipsed. The eclipsed conformation and the 60° angles create large strain.'), src: 'T p48'
      },
      {
        id: 'u08.ring.8',
        q: [{ p: t('Ciklopropanas reaguoja su HBr.', 'Cyclopropane reacts with HBr.') }],
        steps: [molChoice(t('Koks yra produktas?', 'What is the product?'), 'CCCBr', ['CC(C)Br', 'BrC1CC1', 'C=CC'], t('Žiedas atsiveria ar lieka?', 'Does the ring open or stay?'), t('Įtemptas žiedas atsiveria: $H$ ir $Br$ prisijungia prie dviejų žiedo atomų, o 2-bromo izomero nėra, nes laisvas katijonas nesusidaro.', 'The strained ring opens: $H$ and $Br$ add to two ring carbons, and the 2-bromo isomer does not form because no free cation is formed.')),
          { prompt: t('Pavadinkite produktą.', 'Name the product.'), kind: 'name', mol: { smi: 'CCCBr' }, answer: { smi: 'CCCBr' }, hint: NAME_HINT, solution: t('1-brompropanas', '1-bromopropane') }],
        why: t('Reakcija vyksta atsiveriant žiedui, todėl halogenas atsiduria grandinės gale (1-brompropanas), o ne ant žiedo. Tai skiria ją nuo radikalinio ar kitokio pakeitimo.', 'The reaction opens the ring, so the halogen ends up at the end of the chain (1-bromopropane) and not on a ring. This separates it from radical or other substitution.'), src: 'L8 p17', claims: [{ name: ['CCCBr', t('1-brompropanas', '1-bromopropane')] }]
      }
    ]
  };

  ORG.unit({
    id: 'u08',
    notes: NOTES,
    summary: SUMMARY,
    types: [T_DTYPE, T_DADD, T_DMECH, T_NAME, T_YADD, T_HYDR, T_YOX, T_ACID, T_ALK, T_YREASON, T_CHAIN, T_TEST, T_RING],
    coverage: {
      'S4.7': ['u08.yneadd', 'u08.hydr', 'u08.acid', 'u08.test', 'u08.yreason', 'u08.chain'],
      'S4.15': ['u08.dadd', 'u08.dmech'],
      'S4.16': ['u08.yneadd', 'u08.hydr', 'u08.acid', 'u08.test', 'u08.yreason', 'u08.chain']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
