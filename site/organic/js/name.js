(function (ORG) {
  'use strict';

  // IUPAC namer for the organic trainer. Lithuanian follows the course rules
  // (lecture 1: seniority list, chain criteria a-d, locant-before-parent style);
  // English follows IUPAC 2013 style with older-style variants in `alts`.
  // The main chain is chosen once, by the course criteria, so both languages
  // describe the same numbering. Anything outside the rules returns null.

  const chem = ORG.chem;

  // ------------------------------------------------------------------
  // Tables
  // ------------------------------------------------------------------

  const STEM = {
    lt: [null, 'met', 'et', 'prop', 'but', 'pent', 'heks', 'hept', 'okt', 'non', 'dek', 'undek', 'dodek', 'tridek',
      'tetradek', 'pentadek', 'heksadek', 'heptadek', 'oktadek', 'nonadek', 'eikoz'],
    en: [null, 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec',
      'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'icos'],
  };
  const MULT = {
    lt: ['', '', 'di', 'tri', 'tetra', 'penta', 'heksa', 'hepta', 'okta', 'nona', 'deka'],
    en: ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'],
  };
  const BIS = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis', 'heptakis', 'octakis', 'nonakis', 'decakis'];
  const HAL = {
    F: { lt: 'fluor', en: 'fluoro', ltAn: 'fluoridas', enAn: 'fluoride' },
    Cl: { lt: 'chlor', en: 'chloro', ltAn: 'chloridas', enAn: 'chloride' },
    Br: { lt: 'brom', en: 'bromo', ltAn: 'bromidas', enAn: 'bromide' },
    I: { lt: 'jod', en: 'iodo', ltAn: 'jodidas', enAn: 'iodide' },
  };
  const CATION = { Li: ['ličio', 'lithium'], Na: ['natrio', 'sodium'], K: ['kalio', 'potassium'] };
  // seniority list of the course (lecture 1): COOH > SO3H > COOM > anhydride > COOR > COX > CONH2 > CN > CHO > CO >
  // OH > ArOH > SH > NH2 > C=C > C#C
  const SENIORITY = ['acid', 'sulfonic', 'carboxylate', 'anhydride', 'ester', 'acylhalide', 'amide', 'nitrile',
    'aldehyde', 'ketone', 'alcohol', 'phenol', 'thiol', 'amine', 'alkene', 'alkyne'];
  const TERMINAL = { acid: 1, anhydride: 1, carboxylate: 1, ester: 1, acylhalide: 1, amide: 1, nitrile: 1, aldehyde: 1 };
  const SINGLE_ONLY = { carboxylate: 1, ester: 1, anhydride: 1 };

  // flags of the current naming pass; extra passes with other flags give spelling variants for `alts`
  const VAR0 = { deriv: false, stemK: false, sec: false, sys: false, triv: false };
  let VAR = VAR0;

  class OutOfScope extends Error {}
  function out(msg) { throw new OutOfScope(msg || 'out of scope'); }

  function cmpArr(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    return a.length - b.length;
  }
  function cmpDesc(a, b) { // larger first
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i] ? -1 : 1;
    return 0;
  }
  const sortNum = (a) => a.slice().sort((x, y) => x - y);
  const stemOf = (n, lang) => { if (!STEM[lang][n]) out('chain too long'); return STEM[lang][n]; };
  const mult = (n, lang) => { if (n > 10) out('multiplier'); return MULT[lang][n]; };
  const hasDigit = (s) => /[0-9]/.test(s);
  const em = (m, w) => (m && /a$/.test(m) && /^[aeiou]/.test(w) ? m.slice(0, -1) + w : m + w); // tetra + ol = tetrol

  // substituent object: lt, en names; cx: composed name (parentheses in English)
  function S(lt, en, cx) { return { lt, en, cx: !!cx }; }
  const alphaKey = (name) => name.toLowerCase().replace(/^(tret|sec|tert|antr)-/, '').replace(/[^a-z]/g, '');
  // enclosing marks: ( ) then [ ( ) ] then { [ ( ) ] }
  const enclose = (nm) => (/\[/.test(nm) ? '{' + nm + '}' : /\(/.test(nm) ? '[' + nm + ']' : '(' + nm + ')');

  // ------------------------------------------------------------------
  // Model of the molecule
  // ------------------------------------------------------------------

  function makeModel(mol) {
    let A = mol.atoms;
    const n = A.length;
    let nbr = mol.nbr;
    if (n > 60) out('too large');
    const M = { mol, n, A, nbr, skip: new Array(n).fill(false), cation: null };
    M.el = (i) => A[i].el;
    M.ko = (i, j) => mol.bondAt(i, j).kek;
    M.arBond = (i, j) => mol.bondAt(i, j).order === 1.5;

    // components: one component, or an acid anion with one alkali cation
    // a covalently written salt (CCC(=O)O[Na]) is treated like the ionic form
    A.forEach((a, i) => {
      if (CATION[a.el] && nbr[i].length === 1 && A[nbr[i][0]].el === 'O' && A[nbr[i][0]].h === 0 && a.charge === 0) {
        M.skip[i] = true;
        M.cation = a.el;
        const o = nbr[i][0];
        nbr = nbr.map((l) => l.filter((j) => j !== i));
        A = A.map((x, k) => (k === o ? Object.assign({}, x, { charge: -1 }) : x));
        M.nbr = nbr;
        M.A = A;
      }
    });
    const comps = {};
    A.forEach((a, i) => { (comps[a.comp] = comps[a.comp] || []).push(i); });
    const ck = Object.keys(comps);
    if (ck.length === 2) {
      const single = ck.map((k) => comps[k]).find((l) => l.length === 1 && CATION[A[l[0]].el] && A[l[0]].charge === 1);
      if (!single) out('components');
      M.cation = A[single[0]].el;
      M.skip[single[0]] = true;
    } else if (ck.length !== 1) out('components');

    A.forEach((a, i) => {
      if (M.skip[i]) return;
      if (!/^(C|N|O|S|F|Cl|Br|I)$/.test(a.el)) out('element');
      if (a.el === 'C' && a.charge !== 0) out('charge');
    });

    // rings
    const rings = chem.rings(mol);
    M.rings = rings;
    M.ringOf = new Array(n).fill(-1);
    rings.forEach((r, k) => {
      r.forEach((i) => {
        if (M.ringOf[i] >= 0) out('fused or spiro ring');
        M.ringOf[i] = k;
        if (A[i].el !== 'C') out('heterocycle');
      });
    });
    M.ringArom = rings.map((r) => {
      const ar = chem.isAromaticRing(mol, r);
      if (ar && r.length !== 6) out('aromatic ring');
      if (!ar && r.some((i) => A[i].aromatic)) out('aromatic ring');
      return ar;
    });
    M.inRing = (i) => M.ringOf[i] >= 0;
    M.carbons = [];
    A.forEach((a, i) => { if (a.el === 'C') M.carbons.push(i); });
    if (!M.carbons.length) out('no carbon');
    M.ac = M.carbons.filter((i) => !M.inRing(i));
    return M;
  }

  // functional groups ------------------------------------------------

  function findGroups(M) {
    const { A, nbr } = M;
    const el = M.el;
    const ko = M.ko;
    const G = [];
    M.gc = {}; // group of a carbonyl-type carbon, by carbon atom
    const used = new Array(M.n).fill(false);
    const dblO = (c) => nbr[c].find((j) => el(j) === 'O' && ko(c, j) === 2 && nbr[j].length === 1);

    for (const c of M.carbons) {
      if (used[c]) continue;
      const o = dblO(c);
      const cn = nbr[c].filter((j) => el(j) === 'C');
      const hn = nbr[c].filter((j) => el(j) !== 'C' && j !== o);
      if (o !== undefined) {
        if (hn.length === 0) {
          if (cn.length === 2 && A[c].h === 0) G.push({ type: 'ketone', c, atoms: [o] });
          else if ((cn.length === 1 && A[c].h === 1) || (cn.length === 0 && A[c].h === 2)) {
            G.push({ type: 'aldehyde', c, cn: cn[0] === undefined ? null : cn[0], atoms: [o] });
          } else out('carbonyl');
        } else if (hn.length === 1 && cn.length + A[c].h === 1 && ko(c, hn[0]) === 1) {
          const x = hn[0];
          const base = { c, cn: cn[0] === undefined ? null : cn[0] };
          if (el(x) === 'O') {
            const rest = nbr[x].filter((j) => j !== c);
            if (rest.length === 0 && A[x].charge === 0 && A[x].h === 1) G.push(Object.assign(base, { type: 'acid', atoms: [o, x] }));
            else if (rest.length === 0 && A[x].charge === -1) {
              if (!M.cation) out('carboxylate without cation');
              G.push(Object.assign(base, { type: 'carboxylate', atoms: [o, x] }));
            } else if (rest.length === 1 && el(rest[0]) === 'C') {
              const y = rest[0];
              const oy = dblO(y);
              if (oy !== undefined) {
                // anhydride: both halves must be the same
                const cy = nbr[y].filter((j) => el(j) === 'C' && j !== x);
                if (cy.length > 1 || (cy.length === 0 && A[y].h !== 1)) out('anhydride');
                if (y < c) { used[y] = true; continue; }
                if (sig(M, c, x) !== sig(M, y, x)) out('mixed anhydride');
                G.push(Object.assign(base, { type: 'anhydride', atoms: [o, x, y, oy], other: y }));
                used[y] = true;
                M.gc[y] = G[G.length - 1];
              } else G.push(Object.assign(base, { type: 'ester', atoms: [o, x], oAtom: x, r: y }));
            } else out('carboxyl derivative');
          } else if (HAL[el(x)] && nbr[x].length === 1) {
            G.push(Object.assign(base, { type: 'acylhalide', atoms: [o, x], hal: el(x) }));
          } else if (el(x) === 'N') {
            if (A[x].charge !== 0 || A[x].h + nbr[x].length !== 3) out('amide N');
            const subs = nbr[x].filter((j) => j !== c);
            if (!subs.every((j) => el(j) === 'C' && !dblO(j) && ko(x, j) === 1)) out('amide N substituent');
            G.push(Object.assign(base, { type: 'amide', atoms: [o, x], nAtom: x, nsub: subs }));
            used[x] = true;
          } else out('carbonyl');
        } else out('carbonyl');
        M.gc[c] = M.gc[c] || G[G.length - 1];
        G[G.length - 1].atoms.forEach((i) => { used[i] = true; });
        continue;
      }
      // nitrile
      const tn = nbr[c].find((j) => el(j) === 'N' && ko(c, j) === 3);
      if (tn !== undefined) {
        if (nbr[tn].length !== 1 || cn.length !== 1 || nbr[c].length !== 2) out('nitrile');
        G.push({ type: 'nitrile', c, cn: cn[0], atoms: [tn] });
        M.gc[c] = G[G.length - 1];
        used[tn] = true;
      }
    }
    // groups on carbons: OH, SH, SO3H, amines (N not used by an amide)
    for (const c of M.carbons) {
      for (const x of nbr[c]) {
        if (used[x]) continue;
        const e = el(x);
        if (e === 'O') {
          if (nbr[x].length === 1 && ko(c, x) === 1 && A[x].charge === 0 && A[x].h === 1) {
            if (M.gc[c] && M.gc[c].type !== 'ketone') out('geminal group on carbonyl derivative');
            G.push({ type: A[c].aromatic ? 'phenol' : 'alcohol', att: c, atoms: [x] });
            used[x] = true;
          }
        } else if (e === 'S') {
          if (nbr[x].length === 1 && A[x].h === 1 && A[x].charge === 0) {
            G.push({ type: 'thiol', att: c, atoms: [x] });
            used[x] = true;
          } else if (nbr[x].length === 4) {
            const os = nbr[x].filter((j) => j !== c);
            const dbl = os.filter((j) => el(j) === 'O' && ko(x, j) === 2 && nbr[j].length === 1);
            const oh = os.filter((j) => el(j) === 'O' && ko(x, j) === 1 && nbr[j].length === 1 && A[j].h === 1);
            if (dbl.length === 2 && oh.length === 1) {
              G.push({ type: 'sulfonic', att: c, atoms: [x, dbl[0], dbl[1], oh[0]] });
              os.forEach((j) => { used[j] = true; });
              used[x] = true;
            }
          }
        } else if (e === 'N') {
          if (isNitro(M, x)) continue;
          if (A[x].charge !== 0) out('charged nitrogen');
          if (nbr[x].some((j) => el(j) !== 'C')) out('nitrogen function');
          if (nbr[x].some((j) => ko(x, j) !== 1)) out('imine');
          if (A[x].h + nbr[x].length !== 3 || nbr[x].length < 1) out('amine');
          if (nbr[x].some((j) => M.gc[j] && M.gc[j].c === j && M.gc[j].type !== 'ketone' && M.gc[j].nAtom !== x)) out('N on carbonyl');
          if (!G.some((g) => g.type === 'amine' && g.nAtom === x)) {
            G.push({ type: 'amine', nAtom: x, carbons: nbr[x].slice(), atoms: [x] });
          }
          used[x] = true;
        }
      }
    }
    M.G = G;
    // every charged atom must belong to a recognised group
    M.A.forEach((a, i) => {
      if (M.skip[i] || a.charge === 0) return;
      if (a.el === 'O' && a.charge === -1 && G.some((g) => g.atoms.indexOf(i) >= 0)) return;
      if (isNitroAtom(M, i)) return;
      out('charge');
    });
    return G;
  }

  function isNitro(M, x) {
    const { nbr, A } = M;
    if (M.el(x) !== 'N' || nbr[x].length !== 3) return false;
    const os = nbr[x].filter((j) => M.el(j) === 'O' && nbr[j].length === 1);
    const cs = nbr[x].filter((j) => M.el(j) === 'C');
    if (os.length !== 2 || cs.length !== 1) return false;
    const ords = os.map((j) => M.ko(x, j) + (A[j].charge === -1 ? 10 : 0)).sort((p, q) => p - q);
    const okCharged = A[x].charge === 1 && ords[0] === 2 && ords[1] === 11;
    const okUncharged = A[x].charge === 0 && ords[0] === 2 && ords[1] === 2;
    return okCharged || okUncharged;
  }
  function isNitroAtom(M, i) {
    if (M.el(i) === 'N') return isNitro(M, i);
    if (M.el(i) === 'O') return M.nbr[i].length === 1 && isNitro(M, M.nbr[i][0]);
    return false;
  }

  // signature of the part of the molecule hanging from `a` away from `from`
  function sig(M, a, from) {
    const atoms = [];
    const seen = new Set([from, a]);
    const queue = [a];
    while (queue.length) {
      const x = queue.shift();
      atoms.push(x);
      M.nbr[x].forEach((y) => { if (!seen.has(y)) { seen.add(y); queue.push(y); } });
    }
    const inSet = new Set(atoms);
    let lab = {};
    atoms.forEach((x) => { lab[x] = M.A[x].el + M.A[x].h + M.A[x].charge; });
    for (let r = 0; r < 4; r++) {
      const next = {};
      atoms.forEach((x) => {
        const around = M.nbr[x].filter((y) => inSet.has(y) || y === from).map((y) => M.ko(x, y) + (y === from ? '*' : lab[y])).sort();
        next[x] = lab[x] + '(' + around.join(',') + ')';
      });
      lab = next;
    }
    return atoms.map((x) => lab[x]).sort().join('|') + '#' + lab[a];
  }

  // ------------------------------------------------------------------
  // Substituents
  // ------------------------------------------------------------------

  function combineNames(list, lang) {
    // names of the groups on one atom (for amino): metil, dimetil, etil(metil)
    const byName = {};
    list.forEach((s) => { (byName[s[lang]] = byName[s[lang]] || { s, n: 0 }).n++; });
    const items = Object.keys(byName).map((k) => byName[k]).sort((p, q) => (alphaKey(p.s[lang]) < alphaKey(q.s[lang]) ? -1 : 1));
    return items.map((it, idx) => {
      const nm = it.s[lang];
      const complex = hasDigit(nm) || it.s.cx || /[()]/.test(nm);
      const wrap = it.n > 1 ? complex : (hasDigit(nm) || (lang === 'en' && it.s.cx));
      const m = it.n > 1 ? (complex ? BIS[it.n] : mult(it.n, lang)) : '';
      const t = m + (wrap ? enclose(nm) : nm);
      return idx === 0 ? t : '(' + t + ')';
    }).join('');
  }

  const RETAINED = {
    lt: { '1-metiletil': 'izopropil', '1-metilpropil': 'antr-butil', '2-metilpropil': 'izobutil', '1,1-dimetiletil': 'tret-butil', fenilmetil: 'benzil', etanoil: 'acetil', fenilmetanoil: 'benzoil', metanoil: 'formil', metiletenil: 'izopropenil' },
    en: { '1-methylethyl': 'isopropyl', '1-methylpropyl': 'sec-butyl', '2-methylpropyl': 'isobutyl', '1,1-dimethylethyl': 'tert-butyl', phenylmethyl: 'benzyl', ethanoyl: 'acetyl', phenylmethanoyl: 'benzoyl', methanoyl: 'formyl', '1-methylethenyl': 'isopropenyl' },
  };

  function alkoxy(R) {
    const lt = R.lt.replace(/il$/, '') + 'oksi';
    let en;
    if (R.acyl) en = R.en + 'oxy';
    else if (/(methyl|ethyl|propyl|butyl|phenyl)$/.test(R.en)) en = R.en.replace(/yl$/, 'oxy');
    else if (/[0-9]-yl$/.test(R.en)) en = '(' + R.en + ')oxy';
    else en = R.en + 'oxy';
    return S(R.acyl ? R.lt + 'oksi' : lt, en, !/^(methyl|ethyl|propyl|butyl|phenyl|isopropyl|isobutyl|sec-butyl|tert-butyl)$/.test(R.en));
  }

  function subst(M, x, from) {
    const e = M.el(x);
    const nb = M.nbr[x];
    if (HAL[e]) {
      if (nb.length !== 1) out('halogen');
      return S(HAL[e].lt, HAL[e].en, false);
    }
    if (e === 'O') {
      if (nb.length === 1) {
        if (M.ko(x, from) === 2) return S('okso', 'oxo', false);
        if (M.A[x].charge === 0 && M.A[x].h === 1) return S('hidroksi', 'hydroxy', false);
        out('oxygen');
      }
      if (nb.length === 2) {
        const y = nb.find((j) => j !== from);
        if (M.el(y) !== 'C' || M.ko(x, y) !== 1 || M.ko(x, from) !== 1) out('oxygen');
        return alkoxy(subst(M, y, x));
      }
      out('oxygen');
    }
    if (e === 'S') {
      if (nb.length === 1) {
        if (M.A[x].h === 1 && M.ko(x, from) === 1) return S('merkapto', 'sulfanyl', false);
        out('sulfur');
      }
      if (nb.length === 2) {
        const y = nb.find((j) => j !== from);
        if (M.el(y) !== 'C') out('sulfur');
        const R = subst(M, y, x);
        return S(R.lt + 'tio', R.en + 'sulfanyl', true);
      }
      if (nb.length === 4) {
        const os = nb.filter((j) => j !== from);
        const dbl = os.filter((j) => M.el(j) === 'O' && M.ko(x, j) === 2).length;
        const oh = os.filter((j) => M.el(j) === 'O' && M.ko(x, j) === 1 && M.A[j].h === 1).length;
        if (dbl === 2 && oh === 1) return S('sulfo', 'sulfo', false);
      }
      out('sulfur');
    }
    if (e === 'N') {
      if (isNitro(M, x)) return S('nitro', 'nitro', false);
      if (M.A[x].charge !== 0) out('charged nitrogen');
      const others = nb.filter((j) => j !== from);
      if (others.some((j) => M.el(j) !== 'C' || M.ko(x, j) !== 1) || M.ko(x, from) !== 1) out('nitrogen');
      if (others.length + M.A[x].h !== 2) out('nitrogen');
      if (!others.length) return S('amino', 'amino', false);
      const list = others.map((j) => subst(M, j, x));
      return S(combineNames(list, 'lt') + 'amino', combineNames(list, 'en') + 'amino', true);
    }
    if (e === 'C') {
      const bo = M.ko(x, from);
      if (bo === 1) return carbonSub(M, x, from);
      // a carbon joined by a double bond: alkylidene (izopropilidencikloheksanas)
      if (bo !== 2 || M.gc[x]) out('multiple bond to a substituent');
      const R = carbonSub(M, x, from);
      if (!/il$/.test(R.lt) || !/yl$/.test(R.en)) out('alkylidene');
      return S(R.lt.replace(/il$/, 'iliden'), R.en.replace(/yl$/, 'ylidene'), R.cx);
    }
    return out('element');
  }

  function carbonSub(M, x, from) {
    const g = M.gc[x];
    if (g && M.el(from) !== 'C' && g.type !== 'acid' && g.type !== 'carboxylate') return chainRadical(M, x, from, true);
    if (g && g.type !== 'ketone') {
      switch (g.type) {
        case 'acid': return S('karboksi', 'carboxy', false);
        case 'aldehyde': return S('formil', 'formyl', false);
        case 'nitrile': return S('cian', 'cyano', false);
        case 'acylhalide': return S(HAL[g.hal].lt + 'formil', HAL[g.hal].en + 'carbonyl', true);
        case 'ester': {
          const R = alkoxy(subst(M, g.r, g.oAtom));
          return S(R.lt + 'karbonil', R.en + 'carbonyl', true);
        }
        case 'amide': {
          const lst = g.nsub.map((j) => subst(M, j, g.nAtom));
          if (!lst.length) return S('karbamoil', 'carbamoyl', false);
          const txt = (lang) => nPrefix(lst, lang);
          return S(txt('lt') + 'karbamoil', txt('en') + 'carbamoyl', true);
        }
        default: out('derivative as substituent');
      }
    }
    if (M.inRing(x)) return ringRadical(M, x, from);
    if (g && g.type === 'ketone') return chainRadical(M, x, from, true);
    return chainRadical(M, x, from, false);
  }

  function nPrefix(lst, lang) {
    // N-substituents of a carbamoyl: N-metil, N,N-dimetil
    const byName = {};
    lst.forEach((s) => { (byName[s[lang]] = byName[s[lang]] || { s, n: 0 }).n++; });
    const items = Object.keys(byName).map((k) => byName[k]).sort((p, q) => (alphaKey(p.s[lang]) < alphaKey(q.s[lang]) ? -1 : 1));
    return items.map((it) => {
      const nm = it.s[lang];
      const complex = hasDigit(nm) || it.s.cx || /[()]/.test(nm);
      const wrap = it.n > 1 ? complex : (hasDigit(nm) || (lang === 'en' && it.s.cx));
      const m = it.n > 1 ? (complex ? BIS[it.n] : mult(it.n, lang)) : '';
      return Array(it.n).fill('N').join(',') + '-' + m + (wrap ? enclose(nm) : nm);
    }).join('-');
  }

  // prefix text: groups of {loc, S}; omit locants when `show` is false
  function prefixText(items, lang, show, nobare) {
    const groups = {};
    items.forEach((it) => {
      const k = it.S[lang];
      (groups[k] = groups[k] || { S: it.S, locs: [] }).locs.push(it.loc);
    });
    const list = Object.keys(groups).map((k) => groups[k]).sort((p, q) => {
      const a = alphaKey(p.S[lang]);
      const b = alphaKey(q.S[lang]);
      return a < b ? -1 : a > b ? 1 : 0;
    });
    const bare = !show && !nobare && list.length > 1 && !items.some((it) => typeof it.loc === 'string');
    const texts = list.map((gr, gi) => {
      const nm = gr.S[lang];
      const cnt = gr.locs.length;
      const complex = hasDigit(nm) || /[()]|^N[-,]/.test(nm) || (cnt > 1 ? gr.S.cx : (lang === 'en' && gr.S.cx));
      const locs = gr.locs.slice().sort((p, q) => {
        const pn = typeof p === 'string';
        const qn = typeof q === 'string';
        if (pn !== qn) return pn ? -1 : 1;
        if (pn) return p < q ? -1 : p > q ? 1 : 0;
        return p - q;
      });
      const m = cnt > 1 ? (complex ? BIS[cnt] : mult(cnt, lang)) : '';
      const body = m + (complex ? enclose(nm) : nm);
      const hasN = locs.some((l) => typeof l === 'string');
      if (bare) return body.charAt(0) === '(' || (gi !== 1 && !complex) ? body : '(' + body + ')';
      return (show || hasN ? locs.join(',') + '-' : '') + body;
    });
    return texts.join(bare ? '' : '-');
  }

  // generic numbered skeleton (chain from x, or a ring through x) used for radicals ----

  function radicalAssemble(lang, items, enLocs, inLocs, n, ring, arom, ending) {
    // returns the name of a substituent from its pieces
    const pref = prefixText(items, lang, n > 1 || ring);
    let core;
    const parts = [];
    if (enLocs.length) parts.push({ k: 'en', locs: enLocs });
    if (inLocs.length) parts.push({ k: lang === 'lt' ? 'in' : 'yn', locs: inLocs });
    if (arom) {
      core = lang === 'lt' ? 'fenil' : 'phenyl';
    } else if (lang === 'lt') {
      const stem = (ring ? 'ciklo' : '') + ltStem(n, parts.length ? (parts[0].locs.length === 1 ? parts[0].k : 'a') : 'i');
      if (!parts.length) core = stem + 'il';
      else {
        const showLocs = ring || n !== 2;
        const first = parts[0];
        let w = (showLocs ? first.locs.join(',') + '-' : '') + stem + (first.locs.length > 1 ? 'a' : '') + mult(first.locs.length, 'lt') + first.k;
        for (let i = 1; i < parts.length; i++) w += '-' + parts[i].locs.join(',') + '-' + mult(parts[i].locs.length, 'lt') + parts[i].k;
        core = w + 'il';
      }
    } else {
      const stem = (ring ? 'cyclo' : '') + stemOf(n, 'en');
      if (!parts.length) core = stem + 'yl';
      else if (!ring && n === 2) core = stem + parts.map((p) => mult(p.locs.length, 'en') + p.k).join('') + 'yl';
      else {
        let w = stem + (parts[0].locs.length > 1 ? 'a' : '');
        parts.forEach((p) => { w += '-' + p.locs.join(',') + '-' + mult(p.locs.length, 'en') + p.k; });
        core = w + '-1-yl';
      }
    }
    // ending override (acyl)
    if (ending) {
      const sat = !parts.length && !arom;
      core = core.replace(lang === 'lt' ? /il$/ : /yl$/, (sat ? 'an' : '') + ending[lang]);
    }
    let name = pref ? (/^[0-9(]/.test(core) ? pref + '-' + core : pref + core) : core;
    return retained(lang, name);
  }

  function retained(lang, name) {
    const map = RETAINED[lang];
    const keep = { fenilmetil: 1, etanoil: 1, fenilmetanoil: 1, metanoil: 1, phenylmethyl: 1, ethanoyl: 1, phenylmethanoyl: 1, methanoyl: 1 };
    if (VAR.sys && !keep[name]) {
      const sys = { en: { '1-methylethyl': 'propan-2-yl', '1-methylpropyl': 'butan-2-yl', '1,1-dimethylethyl': '2-methylpropan-2-yl' } };
      return (sys[lang] || {})[name] || name;
    }
    if (VAR.sec && name === '1-metilpropil') return 'sec-butil';
    if (VAR.triv) {
      const tv = { lt: { etenil: 'vinil', '2-propenil': 'alil' }, en: { ethenyl: 'vinyl', 'prop-2-en-1-yl': 'allyl' } };
      if (tv[lang][name]) return tv[lang][name];
    }
    return map[name] || name;
  }

  // chain radical, attached at x (position 1), `from` is the attaching atom
  function chainRadical(M, x, from, acyl) {
    const { nbr } = M;
    const blocked = (j) => {
      if (M.el(j) !== 'C' || M.inRing(j)) return true;
      const g = M.gc[j];
      return !!(g && g.type !== 'ketone');
    };
    const paths = [];
    function dfs(path) {
      paths.push(path.slice());
      const last = path[path.length - 1];
      for (const j of nbr[last]) {
        if (path.indexOf(j) >= 0 || j === from || blocked(j)) continue;
        path.push(j);
        dfs(path);
        path.pop();
      }
    }
    dfs([x]);
    const mbCount = (p) => {
      let k = 0;
      for (let i = 0; i + 1 < p.length; i++) { const o = M.ko(p[i], p[i + 1]); if (o >= 2) k++; }
      return k;
    };
    const subsOf = (p) => {
      const res = [];
      p.forEach((a, i) => {
        nbr[a].forEach((z) => {
          if (p.indexOf(z) >= 0 || (i === 0 && z === from)) return;
          if (acyl && i === 0 && M.el(z) === 'O' && M.ko(a, z) === 2) return;
          res.push({ a, z, loc: i + 1 });
        });
      });
      return res;
    };
    let best = null;
    for (const p of paths) {
      const sc = [mbCount(p), p.length, subsOf(p).length];
      if (!best || cmpDesc(sc, best.sc) < 0) best = { sc, list: [p] };
      else if (cmpDesc(sc, best.sc) === 0) best.list.push(p);
    }
    let bestName = null;
    for (const p of best.list) {
      const items = subsOf(p).map((s) => ({ loc: s.loc, S: subst(M, s.z, s.a) }));
      const en = [];
      const inn = [];
      for (let i = 0; i + 1 < p.length; i++) {
        const o = M.ko(p[i], p[i + 1]);
        if (o === 2) en.push(i + 1);
        if (o === 3) inn.push(i + 1);
      }
      const ending = acyl ? { lt: 'oil', en: 'oyl' } : null;
      const ltName = radicalAssemble('lt', items, en, inn, p.length, false, false, ending);
      const enName = radicalAssemble('en', items, en, inn, p.length, false, false, ending);
      const cand = { lt: ltName, en: enName, key: sortNum(items.map((it) => it.loc)) };
      if (!bestName || cmpArr(cand.key, bestName.key) < 0 || (cmpArr(cand.key, bestName.key) === 0 && cand.lt < bestName.lt)) bestName = cand;
    }
    const simple = !hasDigit(bestName.lt) && /^(methyl|ethyl|propyl|butyl|pentyl|hexyl|heptyl|octyl|nonyl|decyl|isopropyl|isobutyl|sec-butyl|tert-butyl|ethenyl|ethynyl|acetyl|isopropenyl|vinyl|allyl)$/.test(bestName.en);
    const r = S(bestName.lt, bestName.en, !simple && !/^(benzyl)$/.test(bestName.en));
    if (acyl) r.acyl = true;
    return r;
  }

  // ring radical (phenyl, cyclohexyl ...) attached at ring atom x
  function ringRadical(M, x, from) {
    const ring = M.rings[M.ringOf[x]];
    const arom = M.ringArom[M.ringOf[x]];
    const m = ring.length;
    const start = ring.indexOf(x);
    const subs = [];
    ring.forEach((a) => {
      M.nbr[a].forEach((z) => {
        if (M.ringOf[z] === M.ringOf[x] || (a === x && z === from)) return;
        subs.push({ a, z });
      });
    });
    const named = subs.map((s) => ({ a: s.a, S: subst(M, s.z, s.a) }));
    let best = null;
    for (const dir of [1, -1]) {
      const loc = {};
      for (let i = 0; i < m; i++) loc[ring[(start + dir * i + m * 2) % m]] = i + 1;
      const en = [];
      const inn = [];
      for (let i = 0; i < m; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % m];
        if (M.arBond(a, b)) continue;
        const o = M.ko(a, b);
        if (o < 2) continue;
        const la = loc[a];
        const lb = loc[b];
        const l = Math.abs(la - lb) === 1 ? Math.min(la, lb) : m;
        (o === 2 ? en : inn).push(l);
      }
      const items = named.map((nm) => ({ loc: loc[nm.a], S: nm.S }));
      const key = [sortNum(en.concat(inn)), sortNum(items.map((it) => it.loc)), alphaVec(items)];
      if (!best || cmpKey(key, best.key) < 0) best = { key, items, en: sortNum(en), inn: sortNum(inn) };
    }
    const lt = radicalAssemble('lt', best.items, best.en, best.inn, m, true, arom, null);
    const en = radicalAssemble('en', best.items, best.en, best.inn, m, true, arom, null);
    return S(lt, en, !/^(phenyl|cyclo[a-z]+yl)$/.test(en));
  }

  function alphaVec(items, lang) {
    lang = lang || 'lt';
    return items.slice().sort((p, q) => {
      const a = alphaKey(p.S[lang]);
      const b = alphaKey(q.S[lang]);
      return a < b ? -1 : a > b ? 1 : p.loc - q.loc;
    }).map((it) => it.loc);
  }
  function cmpKey(a, b) {
    for (let i = 0; i < a.length; i++) {
      const c = cmpArr(a[i], b[i]);
      if (c) return c;
    }
    return 0;
  }

  // ------------------------------------------------------------------
  // Parent candidates
  // ------------------------------------------------------------------

  // carbons that are not chain atoms: nitrile carbons (cyano) and, as the course writes them, the carbons of
  // lower acid derivatives (karbamoil, chlorformil, alkoksikarbonil); T-group carbons when the suffix is carboxylic acid
  function chains(M, exo) {
    const T = M.T;
    const skip = (i) => {
      const g = M.gc[i];
      if (!g) return false;
      if (g.type === T) return !!exo && TERMINAL[T] === 1 && g.type !== 'anhydride';
      if (g.type === 'nitrile') return true;
      return !VAR.deriv && (g.type === 'amide' || g.type === 'acylhalide' || g.type === 'ester');
    };
    const acSet = new Set(M.ac.filter((i) => !skip(i)));
    const res = [];
    function dfs(path) {
      const last = path[path.length - 1];
      if (path[0] <= last) res.push(path.slice());
      for (const j of M.nbr[last]) {
        if (!acSet.has(j) || path.indexOf(j) >= 0) continue;
        path.push(j);
        dfs(path);
        path.pop();
      }
    }
    acSet.forEach((u) => dfs([u]));
    return res.map((atoms) => ({ kind: 'chain', atoms, set: new Set(atoms), arom: false, exoMode: !!exo }));
  }

  function candidates(M) {
    const c = chains(M, false);
    const many = M.T && TERMINAL[M.T] && M.T !== 'anhydride' && M.G.filter((g) => g.type === M.T).length >= 2;
    if (many) chains(M, true).forEach((x) => c.push(x));
    M.rings.forEach((r, k) => c.push({ kind: 'ring', atoms: r, set: new Set(r), arom: M.ringArom[k] }));
    return c;
  }

  // the atom of P that carries group g (or null when g does not belong to P)
  function anchorOf(M, g, P) {
    switch (g.type) {
      case 'ketone': return P.set.has(g.c) ? g.c : null;
      case 'alcohol': case 'phenol': case 'thiol': case 'sulfonic': return P.set.has(g.att) ? g.att : null;
      case 'amine': {
        const k = g.carbons.filter((j) => P.set.has(j));
        return k.length === 1 ? k[0] : null;
      }
      default:
        if (P.kind === 'chain' && !P.exoMode) return P.set.has(g.c) ? g.c : null;
        return (g.cn !== null && g.cn !== undefined && P.set.has(g.cn) && !P.set.has(g.c)) ? g.cn : null;
    }
  }

  function multiBonds(M, P) {
    const res = [];
    const a = P.atoms;
    const m = a.length;
    const lim = P.kind === 'ring' ? m : m - 1;
    for (let i = 0; i < lim; i++) {
      const p = a[i];
      const q = a[(i + 1) % m];
      if (p === q) continue;
      if (M.arBond(p, q)) continue;
      const o = M.ko(p, q);
      if (o >= 2) res.push({ a: p, b: q, o });
    }
    return res;
  }

  function evaluate(M, P) {
    const T = M.T;
    const mb = multiBonds(M, P);
    P.mb = mb;
    P.counted = [];
    if (T === 'alkene' || T === 'alkyne') {
      P.cnt = mb.length; // the course counts double and triple bonds together (criterion b)
    } else if (T) {
      M.G.forEach((g) => {
        if (g.type !== T) return;
        const anchor = anchorOf(M, g, P);
        if (anchor !== null) P.counted.push({ g, anchor });
      });
      P.cnt = P.counted.length;
    } else P.cnt = 0;
    P.consumed = new Set();
    P.counted.forEach(({ g }) => {
      g.atoms.forEach((i) => P.consumed.add(i));
      if ((P.kind === 'ring' || P.exoMode) && TERMINAL[g.type]) P.consumed.add(g.c);
    });
    let nsub = 0;
    P.atoms.forEach((a) => {
      M.nbr[a].forEach((z) => { if (!P.set.has(z) && !P.consumed.has(z)) nsub++; });
    });
    P.nsub = nsub;
    P.score = [P.cnt, mb.length, P.exoMode ? 0 : 1, P.kind === 'ring' ? 1 : 0, P.arom ? 1 : 0, P.atoms.length, mb.filter((b) => b.o === 2).length, nsub];
  }

  // numbering ------------------------------------------------------------

  function numberings(P) {
    const a = P.atoms;
    const m = a.length;
    const res = [];
    if (P.kind === 'chain') {
      const f = {};
      const r = {};
      a.forEach((x, i) => { f[x] = i + 1; r[x] = m - i; });
      res.push(f);
      if (m > 1) res.push(r);
    } else {
      for (let s = 0; s < m; s++) {
        for (const dir of [1, -1]) {
          const loc = {};
          for (let i = 0; i < m; i++) loc[a[(s + dir * i + m * 2) % m]] = i + 1;
          res.push(loc);
        }
      }
    }
    return res;
  }

  function substsOf(M, P) {
    const items = [];
    P.atoms.forEach((a) => {
      M.nbr[a].forEach((z) => {
        if (P.set.has(z) || P.consumed.has(z)) return;
        items.push({ a, z, S: subst(M, z, a) });
      });
    });
    return items;
  }

  function bondLoc(P, loc, b) {
    const la = loc[b.a];
    const lb = loc[b.b];
    if (Math.abs(la - lb) === 1) return Math.min(la, lb);
    return P.kind === 'ring' ? P.atoms.length : Math.min(la, lb);
  }

  // N-substituents of an amine or amide group (everything on N except the carbon in the parent)
  function nSubsOf(M, g, anchor) {
    if (g.type === 'amide') return g.nsub.map((j) => subst(M, j, g.nAtom));
    if (g.type === 'amine') return g.carbons.filter((j) => j !== anchor).map((j) => subst(M, j, g.nAtom));
    return [];
  }

  // The numbering is the same in both languages up to the alphabetical tie-break, which each language
  // makes with its own names. N, N' labels count before that tie-break.
  function bestNumbering(M, P, lang) {
    const subs = P.subs || (P.subs = substsOf(M, P));
    if (!P.nS) P.nS = P.counted.map((c) => nSubsOf(M, c.g, c.anchor));
    let best = null;
    numberings(P).forEach((loc) => {
      const suf = sortNum(P.counted.map((c) => loc[c.anchor]));
      const en = sortNum(P.mb.filter((b) => b.o === 2).map((b) => bondLoc(P, loc, b)));
      const inn = sortNum(P.mb.filter((b) => b.o === 3).map((b) => bondLoc(P, loc, b)));
      const all = sortNum(en.concat(inn));
      const pref = sortNum(subs.map((s) => loc[s.a]));
      const items = subs.map((s) => ({ loc: loc[s.a], S: s.S }));
      // which N carries the substituents: N before N'
      const order = P.counted.map((c, i) => i).sort((x, y) => loc[P.counted[x].anchor] - loc[P.counted[y].anchor]);
      const labels = [];
      const ntext = [];
      order.forEach((ci, idx) => P.nS[ci].forEach((sb) => { labels.push(idx); ntext.push(idx + ':' + alphaKey(sb[lang])); }));
      const key = [suf, all, en, pref, labels.sort((x, y) => x - y), alphaVec(items, lang), ntext.sort()];
      if (!best || cmpKey(key, best.key) < 0) best = { loc, key, suf, en, inn, items };
    });
    return best;
  }

  // ------------------------------------------------------------------
  // Intermediate description and rendering
  // ------------------------------------------------------------------

  function describe(M, P, num) {
    const T = M.T;
    const ir = {
      kind: P.kind, n: P.atoms.length, arom: P.arom, T, count: P.counted.length,
      suf: num.suf, en: num.en, inn: num.inn, prefix: num.items.map((it) => ({ loc: it.loc, S: it.S })),
      cation: M.cation, hal: null, esterR: null, P, num,
    };
    ir.exo = !!((P.kind === 'ring' || P.exoMode) && T && TERMINAL[T]);
    // N-substituents of amines and amides, with N, N' labels in the order of the locants
    const ord = P.counted.slice().sort((a, b) => num.loc[a.anchor] - num.loc[b.anchor]);
    const primes = ['N', "N'", "N''", "N'''"];
    ord.forEach(({ g, anchor }, idx) => {
      const lab = ord.length > 1 ? primes[idx] : 'N';
      if (g.type === 'amide' || g.type === 'amine') {
        nSubsOf(M, g, anchor).forEach((sb) => ir.prefix.push({ loc: lab, S: sb }));
      } else if (g.type === 'ester') {
        ir.esterR = subst(M, g.r, g.oAtom);
      } else if (g.type === 'acylhalide') ir.hal = g.hal;
    });
    return ir;
  }

  function numPrefixOcc(ir) { return ir.prefix.filter((p) => typeof p.loc === 'number').length; }

  // which locants are written
  function showsBase(ir, mode) {
    const n = ir.n;
    const T = ir.T;
    const unsatCount = ir.en.length + ir.inn.length;
    const hasT = T && T !== 'alkene' && T !== 'alkyne';
    const term = !!(hasT && TERMINAL[T] && ir.kind === 'chain' && !ir.exo);
    const occ = numPrefixOcc(ir);
    const f = { suf: false, en: false, pref: false };
    if (mode === 'explicit') {
      const g = showsBase(ir, 'lt');
      if (ir.kind === 'chain' && n >= 3) {
        g.suf = !!(hasT && !term);
        g.en = unsatCount > 0;
        g.pref = true;
      }
      return g;
    }
    if (mode === 'lt') {
      if (hasT && !term) {
        if (ir.kind === 'chain') f.suf = !(ir.count === 1 && (n <= 2 || (T === 'ketone' && n <= 4 && ir.suf[0] === 2 && !ir.prefix.length && !unsatCount)));
        else f.suf = ir.count > 1;
      } else if (hasT && ir.exo) f.suf = ir.count > 1;
      if (ir.kind === 'chain') {
        f.en = !(n === 2 || (n === 3 && (!hasT || term)));
        f.pref = !(n === 1 || (n === 2 && term) || (n === 2 && !hasT && occ === 1));
      } else {
        f.en = !(!hasT && unsatCount === 1);
        f.pref = hasT ? true : !(occ === 1 && unsatCount === 0);
      }
      return f;
    }
    // iupac (English main)
    if (hasT && !term) {
      if (ir.kind === 'chain') f.suf = !(ir.count === 1 && (n <= 1 || (n === 2 && occ === 0 && !unsatCount)));
      else f.suf = ir.count > 1 || unsatCount > 0 || occ > 0;
    } else if (hasT && ir.exo) f.suf = ir.count > 1 || unsatCount > 0 || occ > 0;
    if (ir.kind === 'chain') {
      f.en = !(n === 2 || (n === 3 && !hasT && unsatCount === 1 && !ir.prefix.length));
      f.pref = !(n === 1 || (n === 2 && !hasT && occ === 1));
    } else {
      f.en = !(!hasT && unsatCount === 1 && occ === 0);
      f.pref = !(!hasT && occ === 1 && unsatCount === 0);
    }
    return f;
  }

  // mode: 'lt' | 'iupac' | 'explicit' | { base, set } (a base mode with some flags forced)
  function shows(ir, mode) {
    const f = showsBase(ir, typeof mode === 'object' ? mode.base : mode);
    // with an N locant the carbon locant is written too: 2-chlor-N-metiletanamidas
    if (ir.prefix.some((p) => typeof p.loc === 'string')) f.pref = true;
    if (typeof mode === 'object') Object.assign(f, mode.set);
    return f;
  }

  function ltStem(n, next) {
    const s = stemOf(n, 'lt');
    // the course writes dec- before e and i (decinas, oktadeceno rūgštis) and dek- before a
    if (n >= 10 && /k$/.test(s) && !VAR.stemK && /^[ei]/.test(next)) return s.slice(0, -1) + 'c';
    return s;
  }

  const BENZENE_EN = { acid: 'benzoic acid', aldehyde: 'benzaldehyde', amide: 'benzamide', nitrile: 'benzonitrile', phenol: 'phenol', amine: 'aniline', ester: 'benzoate', carboxylate: 'benzoate' };

  // the suffix word for the principal group; null for the Lithuanian acid on a chain (written "o rūgštis")
  function suffixWord(T, lang, exo, m, hal) {
    if (lang === 'lt') {
      switch (T) {
        case 'acid': return exo ? m + 'karboksirūgštis' : null;
        case 'carboxylate': case 'ester': return exo ? 'karboksilatas' : 'oatas';
        case 'acylhalide': return (exo ? m + 'karbonil' : m + 'oil') + m + hal.ltAn;
        case 'amide': return m + (exo ? 'karboksamidas' : 'amidas');
        case 'nitrile': return m + (exo ? 'karbonitrilas' : 'nitrilas');
        case 'aldehyde': return m + (exo ? 'karbaldehidas' : 'alis');
        case 'ketone': return m + 'onas';
        case 'alcohol': case 'phenol': return m + 'olis';
        case 'thiol': return m + 'tiolis';
        case 'amine': return m + 'aminas';
        case 'sulfonic': return m + 'sulfonrūgštis';
        default: return out('suffix');
      }
    }
    switch (T) {
      case 'acid': return exo ? m + 'carboxylic acid' : em(m, 'oic acid');
      case 'carboxylate': case 'ester': return exo ? 'carboxylate' : 'oate';
      case 'acylhalide': return (exo ? m + 'carbonyl ' : m + 'oyl ') + m + hal.enAn;
      case 'amide': return exo ? m + 'carboxamide' : em(m, 'amide');
      case 'nitrile': return m + (exo ? 'carbonitrile' : 'nitrile');
      case 'aldehyde': return exo ? m + 'carbaldehyde' : em(m, 'al');
      case 'ketone': return em(m, 'one');
      case 'alcohol': case 'phenol': return em(m, 'ol');
      case 'thiol': return m + 'thiol';
      case 'amine': return em(m, 'amine');
      case 'sulfonic': return m + 'sulfonic acid';
      default: return out('suffix');
    }
  }

  // the unsaturated core of a parent word: stem + (a) + en/in endings, or stem + an
  function unsatCore(ir, lang, sh, locFirst) {
    const en = lang === 'en';
    const parts = [];
    if (!ir.arom && ir.en.length) parts.push({ k: 'en', locs: ir.en });
    if (!ir.arom && ir.inn.length) parts.push({ k: en ? 'yn' : 'in', locs: ir.inn });
    const ringPart = ir.kind === 'ring' ? (en ? 'cyclo' : 'ciklo') : '';
    const next = parts.length ? (parts[0].locs.length === 1 ? parts[0].k : 'a') : 'a';
    const stem0 = ir.arom ? 'benzen' : ringPart + (en ? stemOf(ir.n, 'en') : ltStem(ir.n, next));
    let core;
    if (parts.length) {
      const first = parts[0];
      core = stem0 + (first.locs.length > 1 ? 'a' : '');
      parts.forEach((p, i) => {
        const loc = sh.en ? p.locs.join(',') : '';
        if (locFirst && i === 0) core = (loc ? loc + '-' : '') + core + mult(p.locs.length, lang) + p.k;
        else core += (loc ? '-' + loc + '-' : '') + mult(p.locs.length, lang) + p.k;
      });
    } else core = ir.arom ? stem0 : stem0 + 'an';
    return { core, hasUnsat: parts.length > 0 };
  }

  // the parent word, Lithuanian (and English in the older locant-first style)
  function parentFront(ir, lang, sh) {
    const T = ir.T;
    const hasT = T && T !== 'alkene' && T !== 'alkyne';
    const en = lang === 'en';
    const cnt = ir.count;
    const hal = ir.hal ? HAL[ir.hal] : null;
    if (en && ir.arom && cnt === 1 && T) {
      if (BENZENE_EN[T]) return BENZENE_EN[T];
      if (T === 'acylhalide') return 'benzoyl ' + hal.enAn;
    }
    const { core, hasUnsat } = unsatCore(ir, lang, sh, true);
    if (!hasT) return en ? core + 'e' : core + 'as';
    const m = cnt > 1 ? mult(cnt, lang) : '';
    const exo = ir.exo;
    const locsTxt = ir.suf.join(',');
    const word = suffixWord(T, lang, exo, m, hal);
    if (!en) {
      if (word === null) return core + 'o ' + m + 'rūgštis';
      if (ir.arom && cnt === 1 && T === 'phenol') return 'fenolis';
    }
    // English: the final e of the stem ending stays before a consonant
    let base = core;
    if (en && !/[aeiou]/.test(word.charAt(0))) base += 'e';
    // locants of the unsaturation came first; those of the suffix follow it, or lead when there is none
    if (sh.suf && (!TERMINAL[T] || exo)) {
      return hasUnsat ? base + '-' + locsTxt + '-' + word : locsTxt + '-' + base + word;
    }
    return base + word;
  }

  // English, IUPAC 2013 style
  function parentNew(ir, sh) {
    const T = ir.T;
    const hasT = T && T !== 'alkene' && T !== 'alkyne';
    const { core } = unsatCore(ir, 'en', sh, false);
    if (!hasT) return core + 'e';
    const cnt = ir.count;
    const m = cnt > 1 ? mult(cnt, 'en') : '';
    const hal = ir.hal ? HAL[ir.hal] : null;
    const word = suffixWord(T, 'en', ir.exo, m, hal);
    if (ir.arom && cnt === 1) {
      if (BENZENE_EN[T]) return BENZENE_EN[T];
      if (T === 'acylhalide') return 'benzoyl ' + hal.enAn;
    }
    const b = /[aeiou]/.test(word.charAt(0)) ? core : core + 'e';
    if (sh.suf && (!TERMINAL[T] || ir.exo)) return b + '-' + ir.suf.join(',') + '-' + word;
    return b + word;
  }

  function joinPrefix(pref, parent) {
    if (!pref) return parent;
    return /^[0-9N(]/.test(parent) ? pref + '-' + parent : pref + parent;
  }

  function render(ir, lang, style, mode) {
    // style: 'lt' | 'new' | 'old'
    if (ir.T === 'anhydride') {
      const full = render(Object.assign({}, ir, { T: 'acid' }), lang, style, mode);
      return lang === 'lt' ? full.replace(/rūgštis$/, 'rūgšties anhidridas') : full.replace(/acid$/, 'anhydride');
    }
    const sh = shows(ir, mode);
    const pref = prefixText(ir.prefix, lang, sh.pref, sh.nobare);
    const parent = style === 'new' ? parentNew(ir, sh) : parentFront(ir, lang, sh);
    let name = joinPrefix(pref, parent);
    if (ir.T === 'ester') {
      const r = ir.esterR[lang];
      if (lang === 'lt') name = (/^[0-9]/.test(name) ? r + '-' : r) + name;
      else name = r + ' ' + name;
    }
    if (ir.T === 'carboxylate') {
      const cat = CATION[ir.cation];
      name = (lang === 'lt' ? cat[0] : cat[1]) + ' ' + name;
    }
    return name;
  }

  // ------------------------------------------------------------------
  // Naming a molecule
  // ------------------------------------------------------------------

  function pickParent(M) {
    const cands = candidates(M);
    cands.forEach((P) => evaluate(M, P));
    let best = [];
    cands.forEach((P) => {
      if (!best.length) { best = [P]; return; }
      const c = cmpDesc(P.score, best[0].score);
      if (c < 0) best = [P];
      else if (c === 0) best.push(P);
    });
    if (!best.length) out('no parent');
    // ties: lowest locants, then the name
    let pick = null;
    best.forEach((P) => {
      const num = bestNumbering(M, P, 'lt');
      const ir = describe(M, P, num);
      const nm = render(ir, 'lt', 'lt', 'lt');
      const cand = { P, num, ir, nm };
      if (!pick || cmpKey(num.key, pick.num.key) < 0 || (cmpKey(num.key, pick.num.key) === 0 && nm < pick.nm)) pick = cand;
    });
    return pick;
  }

  function determineT(M) {
    let best = -1;
    M.G.forEach((g) => {
      const k = SENIORITY.indexOf(g.type);
      if (best < 0 || k < best) best = k;
    });
    if (best >= 0) return SENIORITY[best];
    let dbl = false;
    let tri = false;
    M.mol.bonds.forEach((b) => {
      if (M.skip[b.a] || b.order === 1.5) return;
      if (b.kek === 2 && M.A[b.a].el === 'C' && M.A[b.b].el === 'C') dbl = true;
      if (b.kek === 3 && M.A[b.a].el === 'C' && M.A[b.b].el === 'C') tri = true;
    });
    return dbl ? 'alkene' : tri ? 'alkyne' : null;
  }

  function validate(M) {
    // double bonds to hetero atoms, other than the recognised groups, are not covered
    M.mol.bonds.forEach((b) => {
      if (M.skip[b.a] || M.skip[b.b]) return;
      const ea = M.A[b.a].el;
      const eb = M.A[b.b].el;
      if (b.kek >= 2 && (ea !== 'C' || eb !== 'C')) {
        const ok = M.G.some((g) => g.atoms.indexOf(b.a) >= 0 || g.atoms.indexOf(b.b) >= 0) || isNitroAtom(M, b.a) || isNitroAtom(M, b.b);
        if (!ok) out('hetero multiple bond');
      }
    });
    // groups of one type that can occur once only
    const cnt = {};
    M.G.forEach((g) => { cnt[g.type] = (cnt[g.type] || 0) + 1; });
    SENIORITY.forEach((t) => { if (SINGLE_ONLY[t] && cnt[t] > 1) out('repeated ' + t); });
  }

  function descriptorsFor(M, P, num, mol) {
    const st = ORG.stereo;
    if (!st) return null;
    const list = [];
    const inP = (i) => P.set.has(i);
    st.stereocentres(mol).forEach((i) => {
      const d = st.cip(mol, i);
      if (!d) return;
      if (!inP(i)) out('stereo outside the parent');
      list.push({ loc: num.loc[i], d });
    });
    st.stereoBonds(mol).forEach((pr) => {
      const d = st.ez(mol, pr[0], pr[1]);
      if (!d) return;
      if (!inP(pr[0]) || !inP(pr[1]) || P.kind === 'ring') out('stereo outside the parent');
      list.push({ loc: Math.min(num.loc[pr[0]], num.loc[pr[1]]), d });
    });
    list.sort((a, b) => a.loc - b.loc);
    list.total = st.stereocentres(mol).length + st.stereoBonds(mol).length;
    return list;
  }

  function stereoPrefix(list) {
    if (!list || !list.length) return '';
    if (list.length === 1 && list.total <= 1) return '(' + list[0].d + ')-';
    return '(' + list.map((x) => x.loc + x.d).join(',') + ')-';
  }

  function toluene(ir, lang) {
    // alternative names with toluene as the parent (course examples: 2-bromtoluenas)
    if (!ir.arom || ir.T || ir.kind !== 'ring') return null;
    const P = ir.P;
    const items = P.subs.map((s) => ({ a: s.a, S: s.S }));
    const methyls = items.filter((it) => it.S.lt === 'metil');
    if (!methyls.length) return null;
    let best = null;
    methyls.forEach((me) => {
      const m = P.atoms.length;
      const start = P.atoms.indexOf(me.a);
      for (const dir of [1, -1]) {
        const loc = {};
        for (let i = 0; i < m; i++) loc[P.atoms[(start + dir * i + m * 2) % m]] = i + 1;
        const others = items.filter((it) => it !== me).map((it) => ({ loc: loc[it.a], S: it.S }));
        const key = [sortNum(others.map((o) => o.loc)), alphaVec(others, lang)];
        if (!best || cmpKey(key, best.key) < 0) best = { key, others };
      }
    });
    const o = best.others;
    const word = lang === 'lt' ? 'toluenas' : 'toluene';
    if (!o.length) return word;
    return joinPrefix(prefixText(o, lang, true), word);
  }

  // o-, m-, p- names of a disubstituted benzene (the course writes p-chlorbenzenkarboksirūgštis, p-dibrombenzenas,
  // and p-bromtoluenas, p-bromanilinas); only forms that read cleanly are produced
  function orthoMetaPara(ir, lang) {
    if (!ir.arom || ir.kind !== 'ring' || ir.T === 'ester' || ir.T === 'carboxylate') return [];
    const pre = ir.prefix.filter((p) => typeof p.loc === 'number');
    if (ir.prefix.some((p) => typeof p.loc === 'string')) return [];
    const locs = ir.suf.concat(pre.map((p) => p.loc));
    if (locs.length !== 2) return [];
    const d = Math.abs(locs[0] - locs[1]);
    const rel = d === 1 || d === 5 ? 0 : d === 2 || d === 4 ? 1 : 2;
    const word = lang === 'lt' ? ['o-', 'm-', 'p-'][rel] : ['ortho-', 'meta-', 'para-'][rel];
    const res = [];
    const same = pre.length === 2 && pre[0].S[lang] === pre[1].S[lang];
    if (ir.suf.length === 1 || same) {
      const text = lang === 'lt' ? render(ir, 'lt', 'lt', { base: 'lt', set: { pref: false, suf: false, nobare: true } })
        : render(ir, 'en', 'new', { base: 'iupac', set: { pref: false, suf: false, nobare: true } });
      res.push(word + text);
    }
    // toluene and aniline parents
    const one = pre.length === 1 ? pre[0] : null;
    if (pre.length === 2 && !ir.T) {
      const me = pre.find((p) => p.S.lt === 'metil');
      const other = pre.find((p) => p !== me);
      if (me && other) res.push(word + prefixText([{ loc: 1, S: other.S }], lang, false) + (lang === 'lt' ? 'toluenas' : 'toluene'));
    }
    if (one && ir.T === 'amine' && ir.count === 1 && lang === 'lt') res.push(word + prefixText([{ loc: 1, S: one.S }], lang, false) + 'anilinas');
    return res;
  }

  // names such as izopropilmetileteris, izopropiljodidas, fenilmetilketonas; null when the molecule is not of that kind
  function functionalNames(M) {
    const nonC = [];
    M.A.forEach((a, i) => { if (!M.skip[i] && a.el !== 'C') nonC.push(i); });
    if (nonC.length !== 1) return null;
    const x = nonC[0];
    const radical = (c, from) => {
      const r = subst(M, c, from);
      if (hasDigit(r.lt) || r.acyl || r.cx) return null;
      if (r.lt === 'etenil') return S('vinil', 'vinyl', false);
      return r;
    };
    const join = (rs, lang, word, sep) => {
      const by = rs.slice().sort((p, q) => (alphaKey(p[lang]) < alphaKey(q[lang]) ? -1 : alphaKey(p[lang]) > alphaKey(q[lang]) ? 1 : 0));
      if (by[0][lang] === by[1][lang]) return mult(2, lang) + by[0][lang] + sep + word;
      return by[0][lang] + sep + by[1][lang] + sep + word;
    };
    const el = M.el(x);
    if (el === 'O' && M.G.length === 0 && M.nbr[x].length === 2) {
      const rs = M.nbr[x].map((c) => radical(c, x));
      if (rs.some((r) => !r)) return null;
      const r = { lt: join(rs, 'lt', 'eteris', ''), en: join(rs, 'en', 'ether', ' ') };
      // the course also writes the radicals the other way round (metilfenileteris)
      if (rs[0].lt !== rs[1].lt) r.ltAlso = rs.slice().sort((p, q) => (alphaKey(p.lt) < alphaKey(q.lt) ? 1 : -1)).map((x) => x.lt).join('') + 'eteris';
      return r;
    }
    if (HAL[el] && M.G.length === 0) {
      const r = radical(M.nbr[x][0], x);
      if (!r) return null;
      return { lt: r.lt + HAL[el].ltAn, en: r.en + ' ' + HAL[el].enAn };
    }
    if (el === 'O' && M.G.length === 1 && M.G[0].type === 'ketone') {
      const c = M.G[0].c;
      const rs = M.nbr[c].filter((j) => j !== x).map((j) => radical(j, c));
      if (rs.length !== 2 || rs.some((r) => !r)) return null;
      return { lt: join(rs, 'lt', 'ketonas', ''), en: join(rs, 'en', 'ketone', ' ') };
    }
    return null;
  }

  // the main naming pass; `full` also builds the alternative spellings
  function coreNames(M, stereo, full) {
    findGroups(M);
    validate(M);
    M.T = determineT(M);
    const pick = pickParent(M);
    const { P, num, ir } = pick;
    if (P.kind === 'chain' && M.T && TERMINAL[M.T] && P.counted.length < M.G.filter((g) => g.type === M.T).length) out('group left as a prefix');
    if (P.kind === 'ring' && P.arom) {
      // two aromatic rings joined directly (biphenyl type) are not covered
      P.atoms.forEach((a) => M.nbr[a].forEach((z) => { if (M.ringOf[z] >= 0 && M.ringOf[z] !== M.ringOf[a] && M.ringArom[M.ringOf[z]]) out('ring assembly'); }));
    }
    const irLt = ir;
    const numEn = bestNumbering(M, P, 'en');
    const irEn = describe(M, P, numEn);
    const mol = M.mol;
    const pre = { lt: '', en: '' };
    if (stereo && ORG.stereo) {
      if (ir.T === 'ester' || ir.T === 'carboxylate' || ir.T === 'anhydride') {
        const d = descriptorsFor(M, P, num, mol);
        if (d && d.length) out('stereo of esters');
      } else {
        pre.lt = stereoPrefix(descriptorsFor(M, P, num, mol));
        pre.en = stereoPrefix(descriptorsFor(M, P, numEn, mol));
      }
    }
    const mainLt = render(irLt, 'lt', 'lt', 'lt');
    const mainEn = render(irEn, 'en', 'new', 'iupac');
    const res = { lt: { name: pre.lt + mainLt, alts: [] }, en: { name: pre.en + mainEn, alts: [] } };
    if (!full) return res;

    const A = { lt: [], en: [] };
    A.lt.push(render(irLt, 'lt', 'lt', 'explicit'));
    A.en.push(render(irEn, 'en', 'old', 'lt'), render(irEn, 'en', 'new', 'lt'), render(irEn, 'en', 'old', 'explicit'),
      render(irEn, 'en', 'new', 'explicit'), render(irEn, 'en', 'old', 'iupac'));
    const hasT = irLt.T && irLt.T !== 'alkene' && irLt.T !== 'alkyne';
    const unsat = irLt.en.length + irLt.inn.length;
    const termT = hasT && TERMINAL[irLt.T] && irLt.kind === 'chain' && !irLt.exo;
    // course-attested alternatives
    const tl = toluene(irLt, 'lt');
    if (tl) { A.lt.push(tl); A.en.push(toluene(irEn, 'en')); }
    A.lt.push(...orthoMetaPara(irLt, 'lt'));
    A.en.push(...orthoMetaPara(irEn, 'en'));
    if (irLt.T === 'amine' && irLt.arom && irLt.count === 1) {
      A.lt.push(mainLt.replace(/benzenaminas$/, 'anilinas'), mainLt.replace(/benzenaminas$/, 'fenilaminas'));
      A.en.push(mainEn.replace(/aniline$/, 'benzenamine'));
    }
    A.en.push(mainEn.replace(/(chloro|bromo|iodo|fluoro)carbonyl/, '$1formyl'));
    if (irLt.T === 'acylhalide') A.lt.push(mainLt.replace('etanoil', 'acetil').replace('benzenkarbonil', 'benzoil'));
    [mainEn].concat(A.en.slice()).forEach((x) => {
      if (/sulfanyl/.test(x)) A.en.push(x.replace(/\(([a-z]+)sulfanyl\)/g, '$1thio').replace(/sulfanyl/g, 'mercapto'));
    });
    [mainLt, mainEn].forEach((x, i) => {
      const r = i === 0 ? x.replace(/acetiloksi/g, 'acetoksi') : x.replace(/\(acetyloxy\)/g, 'acetoxy');
      (i === 0 ? A.lt : A.en).push(r);
    });
    ['ethanoic acid', 'ethanamide', 'ethanenitrile', 'ethanoyl chloride', 'ethanoate'].forEach((w, i) => {
      const to = ['acetic acid', 'acetamide', 'acetonitrile', 'acetyl chloride', 'acetate'][i];
      A.en.push(mainEn.replace(new RegExp('(^|[^a-z])' + w + '$'), '$1' + to));
    });
    if (termT && irLt.count === 2 && irLt.n === 4 && !irLt.prefix.length && unsat === 1) A.lt.push(render(irLt, 'lt', 'lt', { base: 'lt', set: { en: false } }));
    if (hasT && !termT && irLt.kind === 'chain' && irLt.count === 1 && unsat && irLt.suf[0] === 1) A.lt.push(render(irLt, 'lt', 'lt', { base: 'lt', set: { suf: false } }));
    if (hasT && !termT && irLt.count === 1 && unsat && irLt.kind === 'ring') A.lt.push(render(irLt, 'lt', 'lt', { base: 'lt', set: { suf: true } }));
    if (hasT && !termT && irLt.kind === 'chain' && irLt.count === 1 && irLt.n === 2 && irLt.prefix.length) A.lt.push(render(irLt, 'lt', 'lt', { base: 'lt', set: { suf: true } }));
    if (hasT && irLt.n === 1 && irLt.kind === 'chain') {
      if (/^N,N-di[a-z]+(metanamidas|metanaminas)$/.test(mainLt)) A.lt.push(mainLt.replace(/^N,N-/, ''));
      if (/^N,N-di[a-z]+(methanamide|methanamine)$/.test(mainEn)) A.en.push(mainEn.replace(/^N,N-/, ''));
    }
    if (irLt.T === 'amine' && M.G.length === 1) {
      // functional (radical) names that the course also writes: etilmetilaminas, difenilaminas
      const nAtom = M.G[0].nAtom;
      const radicals = M.G[0].carbons.map((c) => subst(M, c, nAtom));
      if (radicals.every((r) => !hasDigit(r.lt) && !r.acyl && !r.cx)) {
        const group = (lang) => {
          const by = {};
          radicals.forEach((r) => { by[r[lang]] = (by[r[lang]] || 0) + 1; });
          const keys = Object.keys(by);
          // Lithuanian: sorted as written (dimetiletilaminas); English: alphabetical ignoring di/tri
          if (lang === 'en') keys.sort((p, q) => (alphaKey(p) < alphaKey(q) ? -1 : 1));
          const txt = keys.map((k) => (by[k] > 1 ? mult(by[k], lang) : '') + k);
          return (lang === 'lt' ? txt.sort() : txt).join('');
        };
        A.lt.push(group('lt') + 'aminas');
        A.en.push(group('en') + 'amine');
        if (radicals.length === 2 && radicals.every((r) => r.lt === 'fenil')) A.lt.push('N,N-difenilaminas');
      }
    }
    const fn = functionalNames(M);
    if (fn) { A.lt.push(fn.lt, fn.ltAlso); A.en.push(fn.en); }
    const fin = (list, main, lang) => {
      const seen = new Set([main]);
      const outList = [];
      list.forEach((x) => {
        if (!x) return;
        const y = pre[lang] + x;
        if (!seen.has(y) && y.length <= MAXLEN) { seen.add(y); outList.push(y); }
      });
      return outList;
    };
    res.lt.alts = fin(A.lt, res.lt.name, 'lt');
    res.en.alts = fin(A.en, res.en.name, 'en');
    return res;
  }

  // naming with other spellings of substituents, stems or chains: their names go to `alts`
  const PASSES = [{ deriv: true }, { stemK: true }, { sec: true }, { sys: true }, { triv: true }];

  function nameMol(mol, stereo) {
    VAR = VAR0;
    const base = coreNames(makeModel(mol), stereo, true);
    PASSES.forEach((flags) => {
      VAR = Object.assign({}, VAR0, flags);
      try {
        const r = coreNames(makeModel(mol), stereo, false);
        ['lt', 'en'].forEach((lang) => {
          if (r[lang].name !== base[lang].name && r[lang].name.length <= MAXLEN && base[lang].alts.indexOf(r[lang].name) < 0) base[lang].alts.push(r[lang].name);
        });
      } catch (e) {
        if (!(e instanceof OutOfScope)) { VAR = VAR0; throw e; }
      }
    });
    VAR = VAR0;
    // acid derivatives: the English main name follows IUPAC (the derivative carbon stays in the chain); the
    // course-style carbamoyl/methoxycarbonyl form goes to alts
    VAR = Object.assign({}, VAR0, { deriv: true });
    try {
      const d = coreNames(makeModel(mol), stereo, false);
      if (d.en.name !== base.en.name && d.en.name.length <= MAXLEN && base.en.name.length <= MAXLEN) {
        const old = base.en.name;
        base.en.alts = base.en.alts.filter((x) => x !== d.en.name);
        base.en.alts.unshift(old);
        base.en.name = d.en.name;
      }
    } catch (e) {
      if (!(e instanceof OutOfScope)) { VAR = VAR0; throw e; }
    }
    VAR = VAR0;
    return base;
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  const MAXLEN = 80;
  const cache = new Map();

  function name(mol, opts) {
    opts = opts || {};
    const lang = opts.lang === 'en' ? 'en' : 'lt';
    let key = null;
    if (typeof mol === 'string') key = mol + '|' + (opts.stereo ? 1 : 0);
    else if (mol && mol.atoms && mol.bonds) { try { key = 'mol:' + chem.canonical(mol, { stereo: true }) + '|' + (opts.stereo ? 1 : 0); } catch (e) { key = null; } }
    let both = key ? cache.get(key) : undefined;
    if (both === undefined) {
      const m = typeof mol === 'string' ? chem.parse(mol) : mol; // bad SMILES throws here
      try {
        both = nameMol(m, !!opts.stereo);
      } catch (e) {
        VAR = VAR0;
        if (e instanceof OutOfScope) both = null;
        else throw e; // real bugs are not hidden
      }
      if (both && (both.lt.name.length > MAXLEN || both.en.name.length > MAXLEN)) both = null;
      if (key) { if (cache.size > 2000) cache.clear(); cache.set(key, both); }
    }
    if (!both) return null;
    const r = both[lang];
    return { name: r.name, alts: r.alts.slice() };
  }

  // in scope when both languages can name it
  function inScope(mol) { return name(mol, { lang: 'lt' }) !== null && name(mol, { lang: 'en' }) !== null; }

  // trivial names used in the course -----------------------------------

  // trivial names that the course uses (lecture and seminar sheets); name() never returns these
  const TRIVIAL = [
    ['C=O', 'formaldehidas', 'formaldehyde'], ['CC=O', 'acetaldehidas', 'acetaldehyde'],
    ['CC(C)=O', 'acetonas', 'acetone'], ['OC=O', 'skruzdžių rūgštis', 'formic acid'],
    ['CC(O)=O', 'acto rūgštis', 'acetic acid'], ['OC(=O)C(O)=O', 'oksalo rūgštis', 'oxalic acid'],
    ['OC(=O)CC(O)=O', 'malono rūgštis', 'malonic acid'], ['OC(=O)CCC(O)=O', 'gintaro rūgštis', 'succinic acid'],
    ['OC(=O)CCCC(O)=O', 'glutaro rūgštis', 'glutaric acid'], ['CC(O)C(O)=O', 'pieno rūgštis', 'lactic acid'],
    ['OC(=O)CC(O)C(O)=O', 'obuolių rūgštis', 'malic acid'], ['OC(=O)C(O)C(O)C(O)=O', 'vyno rūgštis', 'tartaric acid'],
    ['OC(=O)CC(O)(CC(O)=O)C(O)=O', 'citrinų rūgštis', 'citric acid'], ['CC(=O)C(O)=O', 'piruvo rūgštis', 'pyruvic acid'],
    ['CC(=O)CC(O)=O', 'acetilacto rūgštis', 'acetoacetic acid'], ['OC(=O)CC(=O)C(O)=O', 'oksalilacto rūgštis', 'oxaloacetic acid'],
    ['OC(=O)CCC(=O)C(O)=O', 'α-ketoglutaro rūgštis', 'alpha-ketoglutaric acid'],
    ['OCC(O)CO', 'glicerolis', 'glycerol'], ['C#C', 'acetilenas', 'acetylene'], ['C=CC(C)=C', 'izoprenas', 'isoprene'],
    ['C=CC=O', 'akroleinas', 'acrolein'], ['C=CCl', 'vinilchloridas', 'vinyl chloride'],
    ['Cc1ccccc1', 'toluenas', 'toluene'], ['Nc1ccccc1', 'anilinas', 'aniline'], ['Oc1ccccc1', 'fenolis', 'phenol'],
    ['Oc1ccc(O)cc1', 'hidrochinonas', 'hydroquinone'], ['O=C1C=CC(=O)C=C1', 'benzchinonas', 'benzoquinone'],
    ['OCc1ccccc1', 'benzilo alkoholis', 'benzyl alcohol'],
    ['ClC(Cl)Cl', 'chloroformas', 'chloroform'], ['ClC(Cl)(Cl)Cl', 'anglies tetrachloridas', 'carbon tetrachloride'],
    ['CCOCC', 'dietileteris', 'diethyl ether'], ['CC(C)O', 'izopropanolis', 'isopropanol'],
    ['CC(C)(C)O', 'tret-butanolis', 'tert-butanol'], ['CCOC(C)=O', 'etilacetatas', 'ethyl acetate'],
    ['CN(C)C=O', 'dimetilformamidas', 'dimethylformamide'], ['CC(=O)OC(C)=O', 'acetanhidridas', 'acetic anhydride'],
    ['CC(=O)Cl', 'acetilchloridas', 'acetyl chloride'], ['O=C(Cl)c1ccccc1', 'benzoilchloridas', 'benzoyl chloride'],
    ['NC(N)=O', 'karbamidas', 'urea'], ['OC(=O)c1ccccc1O', 'salicilo rūgštis', 'salicylic acid'],
    ['CC(=O)Oc1ccccc1C(O)=O', 'acetilsalicilo rūgštis (aspirinas)', 'acetylsalicylic acid (aspirin)'],
    ['CC(=O)Nc1ccc(O)cc1', 'paracetamolis', 'paracetamol'],
    ['C=C', 'etilenas', 'ethylene'], ['OC(=O)C=Cc1ccccc1', 'cinamono rūgštis', 'cinnamic acid'],
    ['ClCc1ccccc1', 'benzilchloridas', 'benzyl chloride'], ['CC(=O)c1ccccc1', 'acetofenonas', 'acetophenone'],
    ['Oc1ccccc1O', 'pirokatecholis', 'catechol'], ['Sc1ccccc1', 'tiofenolis', 'thiophenol'],
    ['C=Cc1ccccc1', 'stirenas', 'styrene'],
  ];
  let trivialMap = null;
  function trivial(mol) {
    if (!trivialMap) {
      trivialMap = {};
      TRIVIAL.forEach((t) => {
        const k = chem.canonical(chem.parse(t[0]), { stereo: false });
        if (!trivialMap[k]) trivialMap[k] = { lt: t[1], en: t[2] };
      });
    }
    const m = typeof mol === 'string' ? chem.parse(mol) : mol;
    const r = trivialMap[chem.canonical(m, { stereo: false })];
    return r ? { lt: r.lt, en: r.en } : null;
  }

  ORG.name = { name, inScope, trivial };
})(globalThis.ORG = globalThis.ORG || {});
