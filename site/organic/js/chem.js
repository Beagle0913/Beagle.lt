(function (ORG) {
  'use strict';

  // ------------------------------------------------------------------
  // Tables
  // ------------------------------------------------------------------

  const ORGANIC = { B: 1, C: 1, N: 1, O: 1, P: 1, S: 1, F: 1, Cl: 1, Br: 1, I: 1 };
  const AROM_SYM = { b: 'B', c: 'C', n: 'N', o: 'O', p: 'P', s: 'S', se: 'Se', as: 'As' };
  const KNOWN = {};
  ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
    'Rb Sr Ag Cd Sn Sb Te I Xe Cs Ba Pt Au Hg Pb Bi').split(' ').forEach((s) => { KNOWN[s] = true; });
  const VALENCE_E = {
    H: 1, Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7,
    K: 1, Ca: 2, Ga: 3, Ge: 4, As: 5, Se: 6, Br: 7, Rb: 1, Sr: 2, Sn: 4, Sb: 5, Te: 6, I: 7, Cs: 1, Ba: 2,
  };
  const DEFAULT_VALENCE = {
    B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1],
  };
  const HALOGEN = { F: 1, Cl: 1, Br: 1, I: 1 };
  const ALKALI = { Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1 };
  const HYBRID_EL = { B: 1, C: 1, N: 1, O: 1, P: 1, S: 1, Si: 1, Se: 1, As: 1 };

  // Valence an atom has when its p orbital holds one pi electron (used to pair up aromatic double bonds).
  function aromaticTarget(el, q) {
    const base = { B: 3, C: 4, N: 3, O: 2, S: 2, P: 3, Se: 2, As: 3 }[el];
    if (base === undefined) return null;
    if (el === 'B') return base - q;
    if (el === 'C') return base - Math.abs(q);
    return base + q;
  }

  function fillH(el, sum) {
    const vals = DEFAULT_VALENCE[el];
    if (!vals) return 0;
    for (let k = 0; k < vals.length; k++) if (vals[k] >= sum) return vals[k] - sum;
    return 0;
  }

  // ------------------------------------------------------------------
  // SMILES parser
  // ------------------------------------------------------------------

  function fail(smi, pos, msg) {
    throw new Error('SMILES: ' + msg + ' at position ' + pos + ' in "' + smi + '"');
  }

  function parseRaw(smi) {
    if (typeof smi !== 'string' || smi.length === 0) throw new Error('SMILES: empty input');
    const atoms = [];
    const bonds = [];
    const seen = {};
    const stack = [];
    const open = {};
    let prev = -1;
    let pend = null;
    let comp = 0;
    let afterDot = false;
    let i = 0;
    const n = smi.length;

    function bondKey(a, b) { return a < b ? a + '_' + b : b + '_' + a; }

    function mkBond(a, b, sym) {
      const key = bondKey(a, b);
      if (seen[key]) fail(smi, i, 'duplicate bond');
      seen[key] = true;
      const o = { a, b, order: 1, dir: null, spec: false, arom: false };
      if (sym === '-') { o.spec = true; } else if (sym === '=') { o.order = 2; o.spec = true; } else if (sym === '#') { o.order = 3; o.spec = true; } else if (sym === ':') { o.order = 1.5; o.spec = true; o.arom = true; } else if (sym === '/' || sym === '\\') { o.dir = sym; o.spec = true; } else if (atoms[a].arom && atoms[b].arom) { o.arom = true; o.order = 1.5; }
      bonds.push(o);
      return o;
    }

    function newAtom(a) {
      a.comp = comp;
      a.ord = [];
      const idx = atoms.length;
      atoms.push(a);
      if (prev >= 0) {
        atoms[prev].ord.push(idx);
        a.ord.push(prev);
        mkBond(prev, idx, pend ? pend.sym : null);
      } else if (pend) {
        fail(smi, pend.pos, 'bond without a preceding atom');
      }
      pend = null;
      if (a.bracket && a.hStated === 1) a.ord.push(-1);
      afterDot = false;
      prev = idx;
    }

    while (i < n) {
      const ch = smi[i];
      if (ch === '(') {
        if (prev < 0) fail(smi, i, 'branch without an atom');
        if (pend) fail(smi, i, 'bond symbol before "("');
        stack.push({ atom: prev, count: atoms.length });
        i++;
      } else if (ch === ')') {
        if (!stack.length) fail(smi, i, 'unmatched ")"');
        if (pend) fail(smi, i, 'bond symbol before ")"');
        const top = stack.pop();
        if (atoms.length === top.count) fail(smi, i, 'empty branch');
        prev = top.atom;
        i++;
      } else if (ch === '.') {
        if (pend) fail(smi, i, 'bond symbol before "."');
        if (prev < 0 || afterDot) fail(smi, i, 'misplaced "."');
        if (stack.length) fail(smi, i, '"." inside a branch');
        prev = -1;
        comp++;
        afterDot = true;
        i++;
      } else if (ch === '-' || ch === '=' || ch === '#' || ch === ':' || ch === '/' || ch === '\\') {
        if (pend) fail(smi, i, 'two bond symbols in a row');
        if (prev < 0) fail(smi, i, 'bond symbol without a preceding atom');
        pend = { sym: ch, pos: i };
        i++;
      } else if ((ch >= '0' && ch <= '9') || ch === '%') {
        let digit;
        if (ch === '%') {
          const t = smi.substr(i + 1, 2);
          if (!/^\d\d$/.test(t)) fail(smi, i, 'bad ring number after "%"');
          digit = t;
          i += 3;
        } else {
          digit = ch;
          i++;
        }
        if (prev < 0) fail(smi, i - 1, 'ring number without an atom');
        const o = open[digit];
        if (o === undefined) {
          const ph = { to: -2 };
          open[digit] = { atom: prev, sym: pend ? pend.sym : null, ph, pos: i };
          atoms[prev].ord.push(ph);
        } else {
          if (o.atom === prev) fail(smi, i - 1, 'ring bond from an atom to itself');
          let sym = o.sym;
          let here = pend ? pend.sym : null;
          if (here === '/') here = '\\'; else if (here === '\\') here = '/'; // written at the closing end
          if (sym && here && sym !== here) fail(smi, i - 1, 'ring closure bond symbols disagree');
          sym = sym || here;
          const b = mkBond(o.atom, prev, sym);
          b.ring = true;
          o.ph.to = prev;
          atoms[prev].ord.push(o.atom);
          delete open[digit];
        }
        pend = null;
      } else if (ch === '[') {
        const end = smi.indexOf(']', i);
        if (end < 0) fail(smi, i, 'unclosed "["');
        const body = smi.slice(i + 1, end);
        const mt = /^(\d+)?([A-Za-z][a-z]?)(@@?)?(?:H(\d*))?(\+\+|--|[+-]\d*)?(?::(\d+))?$/.exec(body);
        if (!mt) fail(smi, i, 'cannot read bracket atom "[' + body + ']"');
        const symbol = mt[2];
        let el;
        let arom = false;
        if (AROM_SYM[symbol]) { el = AROM_SYM[symbol]; arom = true; } else if (KNOWN[symbol]) { el = symbol; } else fail(smi, i, 'unknown element "' + symbol + '"');
        let charge = 0;
        if (mt[5]) {
          const c = mt[5];
          const sign = c[0] === '+' ? 1 : -1;
          if (c === '++' || c === '--') charge = 2 * sign;
          else charge = c.length === 1 ? sign : sign * parseInt(c.slice(1), 10);
        }
        const hStated = mt[4] === undefined ? 0 : (mt[4] === '' ? 1 : parseInt(mt[4], 10));
        newAtom({
          el, charge, hStated, arom, bracket: true, chiral: mt[3] || null, iso: mt[1] ? parseInt(mt[1], 10) : null,
        });
        i = end + 1;
      } else {
        let sym = null;
        const two = smi.substr(i, 2);
        if (two === 'Cl' || two === 'Br') sym = two;
        else if ('BCNOPSFI'.indexOf(ch) >= 0) sym = ch;
        if (sym) {
          newAtom({ el: sym, charge: 0, hStated: 0, arom: false, bracket: false, chiral: null, iso: null });
          i += sym.length;
        } else if ('bcnops'.indexOf(ch) >= 0) {
          newAtom({ el: AROM_SYM[ch], charge: 0, hStated: 0, arom: true, bracket: false, chiral: null, iso: null });
          i++;
        } else {
          fail(smi, i, 'unexpected character "' + ch + '"');
        }
      }
    }
    if (pend) fail(smi, pend.pos, 'dangling bond symbol');
    if (stack.length) fail(smi, n, 'unclosed branch');
    const left = Object.keys(open);
    if (left.length) fail(smi, open[left[0]].pos, 'unclosed ring ' + left[0]);
    if (afterDot) fail(smi, n, 'trailing "."');
    if (!atoms.length) fail(smi, 0, 'no atoms');
    atoms.forEach((a) => { a.ord = a.ord.map((x) => (typeof x === 'object' ? x.to : x)); });
    return { atoms, bonds };
  }

  // ------------------------------------------------------------------
  // Building the molecule: kekulisation, hydrogens, aromaticity
  // ------------------------------------------------------------------

  function adjacency(n, bonds) {
    const nbr = [];
    for (let i = 0; i < n; i++) nbr.push([]);
    bonds.forEach((b) => { nbr[b.a].push(b.b); nbr[b.b].push(b.a); });
    nbr.forEach((l) => l.sort((x, y) => x - y));
    return nbr;
  }

  function connected(n, nbr, skipA, skipB, from, to) {
    const seen = new Array(n).fill(false);
    const q = [from];
    seen[from] = true;
    while (q.length) {
      const v = q.pop();
      if (v === to) return true;
      for (const w of nbr[v]) {
        if ((v === skipA && w === skipB) || (v === skipB && w === skipA)) continue;
        if (!seen[w]) { seen[w] = true; q.push(w); }
      }
    }
    return false;
  }

  function kekulise(smi, atoms, bonds, nbr) {
    const arom = bonds.filter((b) => b.arom);
    // an aromatic bond that is not in a ring is a plain single bond (biphenyl link)
    arom.forEach((b) => {
      if (!connected(atoms.length, nbr, b.a, b.b, b.a, b.b)) { b.arom = false; b.order = 1; }
    });
    const edges = bonds.filter((b) => b.arom);
    const touched = {};
    edges.forEach((b) => { touched[b.a] = true; touched[b.b] = true; });
    atoms.forEach((a, i) => {
      if (a.arom && !touched[i]) throw new Error('SMILES: aromatic atom ' + i + ' is not in an aromatic ring in "' + smi + '"');
    });
    const A = {};
    edges.forEach((b) => {
      (A[b.a] = A[b.a] || []).push({ j: b.b, bond: b });
      (A[b.b] = A[b.b] || []).push({ j: b.a, bond: b });
    });
    const need = {};
    Object.keys(A).forEach((k) => {
      const i = +k;
      const a = atoms[i];
      let sum = 0;
      nbr[i].forEach((j) => {
        const b = bondBetween(bonds, i, j);
        sum += b.arom ? 1 : b.order;
      });
      const target = aromaticTarget(a.el, a.charge);
      if (target === null) throw new Error('SMILES: element ' + a.el + ' cannot be aromatic in "' + smi + '"');
      const left = target - sum - (a.bracket ? a.hStated : 0);
      if (left >= 1) need[i] = true;
    });
    const matched = {};
    function solve() {
      let best = -1;
      let bestC = 1e9;
      let bestList = null;
      const ids = Object.keys(need);
      for (let k = 0; k < ids.length; k++) {
        const i = +ids[k];
        if (matched[i] !== undefined) continue;
        const cand = A[i].filter((e) => need[e.j] && matched[e.j] === undefined);
        if (cand.length === 0) return false;
        if (cand.length < bestC) { best = i; bestC = cand.length; bestList = cand; }
      }
      if (best < 0) return true;
      for (let k = 0; k < bestList.length; k++) {
        const e = bestList[k];
        matched[best] = e.j;
        matched[e.j] = best;
        if (solve()) return true;
        delete matched[best];
        delete matched[e.j];
      }
      return false;
    }
    if (!solve()) throw new Error('SMILES: cannot kekulise the aromatic system in "' + smi + '"');
    edges.forEach((b) => { b.order = matched[b.a] === b.b ? 2 : 1; });
  }

  const bondIndex = new WeakMap();
  function bondBetween(bonds, a, b) {
    let map = bondIndex.get(bonds);
    if (!map) {
      map = {};
      bonds.forEach((x) => { map[x.a < x.b ? x.a + '_' + x.b : x.b + '_' + x.a] = x; });
      bondIndex.set(bonds, map);
    }
    return map[a < b ? a + '_' + b : b + '_' + a];
  }

  function parse(smi) {
    const raw = parseRaw(smi);
    let atoms = raw.atoms;
    let bonds = raw.bonds;
    let nbr = adjacency(atoms.length, bonds);
    kekulise(smi, atoms, bonds, nbr);
    bonds.forEach((b) => { b.kek = b.order; });

    // hydrogens
    atoms.forEach((a, i) => {
      if (a.bracket) { a.h = a.hStated; return; }
      let sum = 0;
      nbr[i].forEach((j) => { sum += bondBetween(bonds, i, j).kek; });
      a.h = fillH(a.el, sum);
    });

    // valence safety net: reaction rules build SMILES at run time
    atoms.forEach((a, i) => {
      let sum = 0;
      nbr[i].forEach((j) => { sum += bondBetween(bonds, i, j).kek; });
      const vals = DEFAULT_VALENCE[a.el];
      const bad = (!a.bracket && vals && sum > vals[vals.length - 1]) || (a.el === 'C' && a.charge === 0 && sum + a.h > 4);
      if (bad) throw new Error('SMILES: too many bonds on ' + a.el + ' (atom ' + i + ') in "' + smi + '"');
    });

    // neutral N with two =O: the nitro group: [N+](=O)[O-]
    atoms.forEach((a, i) => {
      if (a.el !== 'N' || a.charge !== 0 || a.arom || a.h !== 0 || nbr[i].length !== 3) return;
      const os = nbr[i].filter((j) => atoms[j].el === 'O' && atoms[j].charge === 0 && nbr[j].length === 1 && atoms[j].h === 0 &&
        bondBetween(bonds, i, j).kek === 2);
      if (os.length !== 2) return;
      const b = bondBetween(bonds, i, os[1]);
      b.order = 1;
      b.kek = 1;
      atoms[os[1]].charge = -1;
      atoms[os[1]].bracket = true;
      a.charge = 1;
      a.bracket = true;
    });

    // fold terminal [H] atoms into the H count of their neighbour
    const fold = {};
    atoms.forEach((a, i) => {
      if (a.el === 'H' && a.charge === 0 && a.iso === null && nbr[i].length === 1 && atoms[nbr[i][0]].el !== 'H' &&
        bondBetween(bonds, i, nbr[i][0]).kek === 1) fold[i] = true;
    });
    if (Object.keys(fold).length) {
      const map = {};
      const kept = [];
      atoms.forEach((a, i) => { if (!fold[i]) { map[i] = kept.length; kept.push(a); } });
      kept.forEach((a) => {
        a.ord = a.ord.map((x) => (x >= 0 && fold[x] ? -1 : (x >= 0 ? map[x] : x)));
      });
      atoms.forEach((a, i) => { if (fold[i]) atoms[nbr[i][0]].h += 1; });
      bonds = bonds.filter((b) => !fold[b.a] && !fold[b.b]).map((b) => { b.a = map[b.a]; b.b = map[b.b]; return b; });
      atoms = kept;
      nbr = adjacency(atoms.length, bonds);
    }

    bonds.forEach((b, k) => { b.i = k; });
    const bmap = {};
    const mol = {
      atoms: atoms.map((a) => ({
        el: a.el, charge: a.charge, h: a.h, aromatic: false, chiral: a.chiral, comp: a.comp, iso: a.iso, bracket: a.bracket, ord: a.ord,
      })),
      bonds: bonds.map((b) => ({ a: b.a, b: b.b, order: b.kek, dir: b.dir, kek: b.kek, i: b.i })),
      nbr,
      bondAt(a, b) { return bmap[a < b ? a + '_' + b : b + '_' + a] || null; },
    };
    mol.bonds.forEach((b) => { bmap[b.a < b.b ? b.a + '_' + b.b : b.b + '_' + b.a] = b; });
    perceive(mol);
    return mol;
  }

  // ------------------------------------------------------------------
  // Rings (smallest set of smallest rings) and aromaticity
  // ------------------------------------------------------------------

  function sssr(mol) {
    if (mol._rings) return mol._rings;
    const n = mol.atoms.length;
    const nb = mol.bonds.length;
    // number of independent rings
    const seen = new Array(n).fill(false);
    let comps = 0;
    for (let s = 0; s < n; s++) {
      if (seen[s]) continue;
      comps++;
      const q = [s];
      seen[s] = true;
      while (q.length) {
        const v = q.pop();
        mol.nbr[v].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      }
    }
    const want = nb - n + comps;
    if (want <= 0) { mol._rings = []; return mol._rings; }
    // Horton candidates: shortest-path trees from every atom
    const cands = {};
    for (let r = 0; r < n; r++) {
      const dist = new Array(n).fill(-1);
      const par = new Array(n).fill(-1);
      const branch = new Array(n).fill(-1);
      dist[r] = 0;
      const q = [r];
      for (let h = 0; h < q.length; h++) {
        const v = q[h];
        mol.nbr[v].forEach((w) => {
          if (dist[w] < 0) {
            dist[w] = dist[v] + 1;
            par[w] = v;
            branch[w] = v === r ? w : branch[v];
            q.push(w);
          }
        });
      }
      mol.bonds.forEach((b) => {
        const x = b.a;
        const y = b.b;
        if (dist[x] < 0 || dist[y] < 0) return;
        if (par[x] === y || par[y] === x) return;
        if (x !== r && y !== r && branch[x] === branch[y]) return;
        const px = [];
        for (let v = x; v !== -1; v = par[v]) px.push(v);
        const py = [];
        for (let v = y; v !== -1; v = par[v]) py.push(v);
        px.reverse(); // r ... x
        py.pop(); // drop r
        const cyc = px.concat(py); // r ... x, y ... (child of r)
        const ids = [];
        for (let k = 0; k < cyc.length; k++) {
          const e = mol.bondAt(cyc[k], cyc[(k + 1) % cyc.length]);
          ids.push(e.i);
        }
        ids.sort((p, q2) => p - q2);
        const key = ids.join(',');
        if (!cands[key]) cands[key] = { atoms: cyc, ids };
      });
    }
    const list = Object.keys(cands).map((k) => cands[k]);
    list.sort((p, q2) => (p.atoms.length - q2.atoms.length) || (p.ids.join(',') < q2.ids.join(',') ? -1 : 1));
    const basis = [];
    const out = [];
    for (let k = 0; k < list.length && out.length < want; k++) {
      let v = 0n;
      list[k].ids.forEach((id) => { v |= (1n << BigInt(id)); });
      for (let t = 0; t < basis.length; t++) if ((v & basis[t].pivot) !== 0n) v ^= basis[t].vec;
      if (v !== 0n) {
        basis.push({ vec: v, pivot: v & -v });
        out.push(normaliseRing(list[k].atoms));
      }
    }
    out.sort((p, q2) => (p.length - q2.length) || (Math.min.apply(null, p) - Math.min.apply(null, q2)) || (p.join() < q2.join() ? -1 : 1));
    mol._rings = out;
    return out;
  }

  function normaliseRing(cyc) {
    let start = 0;
    for (let k = 1; k < cyc.length; k++) if (cyc[k] < cyc[start]) start = k;
    const len = cyc.length;
    const fwd = cyc[(start + 1) % len];
    const bwd = cyc[(start + len - 1) % len];
    const dir = fwd <= bwd ? 1 : -1;
    const res = [];
    for (let k = 0; k < len; k++) res.push(cyc[(start + dir * k + len * 2) % len]);
    return res;
  }

  // pi electrons an atom gives to a ring (null: it cannot be part of an aromatic ring)
  function piElectrons(mol, i, inRing) {
    const a = mol.atoms[i];
    let doubles = 0;
    let partner = -1;
    for (const j of mol.nbr[i]) {
      const k = mol.bondAt(i, j).kek;
      if (k === 2) { doubles++; partner = j; } else if (k >= 3) return null;
    }
    if (doubles > 1) return null;
    if (doubles === 1) {
      if (inRing[partner]) return 1;
      const e = mol.atoms[partner].el;
      return (e === 'O' || e === 'S' || e === 'N') ? 0 : null;
    }
    const sigma = mol.nbr[i].length + a.h;
    switch (a.el) {
      case 'C':
        if (sigma === 3 && a.charge === -1) return 2;
        if (sigma === 3 && a.charge === 1) return 0;
        return null;
      case 'B': return sigma === 3 && a.charge === 0 ? 0 : null;
      case 'N': return ((sigma === 3 && a.charge === 0) || (sigma === 2 && a.charge === -1)) ? 2 : null;
      case 'P': return sigma === 3 && a.charge === 0 ? 2 : null;
      case 'O': case 'S': case 'Se': return sigma === 2 && a.charge === 0 ? 2 : null;
      default: return null;
    }
  }

  function perceive(mol) {
    const rings = sssr(mol);
    const n = mol.atoms.length;
    const inRing = new Array(n).fill(false);
    rings.forEach((r) => r.forEach((i) => { inRing[i] = true; }));
    const pe = [];
    for (let i = 0; i < n; i++) pe.push(inRing[i] ? piElectrons(mol, i, inRing) : null);
    const total = (list) => {
      let s = 0;
      for (const i of list) { if (pe[i] === null) return null; s += pe[i]; }
      return s;
    };
    const okRing = rings.map((r) => { const t = total(r); return t !== null && t % 4 === 2; });
    const flagged = {};
    function mark(r) {
      for (let k = 0; k < r.length; k++) flagged[mol.bondAt(r[k], r[(k + 1) % r.length]).i] = true;
    }
    rings.forEach((r, k) => { if (okRing[k]) mark(r); });
    // two fused rings that are aromatic only together (azulene)
    for (let k = 0; k < rings.length; k++) {
      for (let l = k + 1; l < rings.length; l++) {
        if (okRing[k] && okRing[l]) continue;
        const rk = rings[k];
        const rl = rings[l];
        if (rk.length < 5 || rk.length > 7 || rl.length < 5 || rl.length > 7) continue;
        const shared = rk.filter((x) => rl.indexOf(x) >= 0);
        if (shared.length < 2) continue;
        let fused = false;
        for (let s = 0; s < shared.length && !fused; s++) {
          for (let t = s + 1; t < shared.length; t++) if (mol.bondAt(shared[s], shared[t])) { fused = true; break; }
        }
        if (!fused) continue;
        const union = rk.concat(rl.filter((x) => rk.indexOf(x) < 0));
        const t = total(union);
        if (t !== null && t % 4 === 2) { mark(rk); mark(rl); }
      }
    }
    mol.bonds.forEach((b) => {
      if (flagged[b.i]) {
        b.order = 1.5;
        mol.atoms[b.a].aromatic = true;
        mol.atoms[b.b].aromatic = true;
      }
    });
  }

  // ------------------------------------------------------------------
  // Small helpers
  // ------------------------------------------------------------------

  function M(x) { return typeof x === 'string' ? parse(x) : x; }

  function kekSum(mol, i) {
    let s = 0;
    mol.nbr[i].forEach((j) => { s += mol.bondAt(i, j).kek; });
    return s;
  }

  function rings(mol) { return sssr(M(mol)).map((r) => r.slice()); }

  function isAromaticRing(mol, ring) {
    mol = M(mol);
    for (let k = 0; k < ring.length; k++) {
      const b = mol.bondAt(ring[k], ring[(k + 1) % ring.length]);
      if (!b || b.order !== 1.5) return false;
    }
    return ring.length > 2;
  }

  function aromaticAtoms(mol) {
    mol = M(mol);
    const out = [];
    mol.atoms.forEach((a, i) => { if (a.aromatic) out.push(i); });
    return out;
  }

  // ------------------------------------------------------------------
  // Formula and counts
  // ------------------------------------------------------------------

  function formula(mol) {
    mol = M(mol);
    const f = {};
    mol.atoms.forEach((a) => {
      f[a.el] = (f[a.el] || 0) + 1;
      if (a.h) f.H = (f.H || 0) + a.h;
    });
    return f;
  }

  function formulaString(mol) {
    mol = M(mol);
    const f = formula(mol);
    const syms = Object.keys(f);
    let order;
    if (f.C) {
      order = ['C'];
      if (f.H) order.push('H');
      order = order.concat(syms.filter((s) => s !== 'C' && s !== 'H').sort());
    } else {
      order = syms.sort();
    }
    let s = order.map((e) => e + (f[e] > 1 ? f[e] : '')).join('');
    let q = 0;
    mol.atoms.forEach((a) => { q += a.charge; });
    if (q) s += (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−');
    return s;
  }

  // Degrees of unsaturation from the formula. null for ions and radicals (not taught with the formula).
  function unsaturation(mol) {
    mol = M(mol);
    const net = {};
    mol.atoms.forEach((a, i) => {
      net[a.comp] = (net[a.comp] || 0) + a.charge * 10 + unpaired(mol, i);
    });
    if (Object.keys(net).some((k) => net[k] !== 0)) return null;
    const f = formula(mol);
    let x = 0;
    Object.keys(f).forEach((e) => { if (HALOGEN[e] || ALKALI[e]) x += f[e]; });
    return (2 * (f.C || 0) + 2 + (f.N || 0) + (f.P || 0) - (f.H || 0) - x) / 2;
  }

  function carbonClass(mol, i) {
    mol = M(mol);
    if (mol.atoms[i].el !== 'C') return 0;
    let c = 0;
    mol.nbr[i].forEach((j) => { if (mol.atoms[j].el === 'C') c++; });
    return Math.min(c, 4);
  }

  // an atom with a multiple bond or in an aromatic ring (sulfonyl S and phosphoryl P do not count)
  function isPiAtom(mol, i) {
    const a = mol.atoms[i];
    if ((a.el === 'S' || a.el === 'P') && mol.nbr[i].length + a.h >= 4) return false;
    if (a.aromatic) return true;
    return mol.nbr[i].some((j) => mol.bondAt(i, j).kek >= 2);
  }

  // unpaired electrons on an atom (0 or 1), from valence electrons
  function unpaired(mol, i) {
    const a = mol.atoms[i];
    const ve = VALENCE_E[a.el];
    if (ve === undefined) return 0;
    const e = ve - a.charge - kekSum(mol, i) - a.h;
    return e > 0 ? e % 2 : 0;
  }

  // Steric number = sigma partners + lone pairs (4 sp3, 3 sp2, 2 sp). A lone pair on N, O, S or a
  // carbanion that sits next to a pi system is in a p orbital, so that atom is sp2.
  function hybridization(mol, i) {
    mol = M(mol);
    const a = mol.atoms[i];
    if (!HYBRID_EL[a.el]) return null;
    const sigma = mol.nbr[i].length + a.h;
    const lp = lonePairs(mol, i);
    const sn = sigma + lp;
    if (sn >= 4) {
      const donor = lp > 0 && sigma <= 3 && (a.el === 'N' || a.el === 'O' || a.el === 'S' || (a.el === 'C' && a.charge < 0));
      if (donor && !mol.nbr[i].some((j) => mol.bondAt(i, j).kek >= 2) && mol.nbr[i].some((j) => isPiAtom(mol, j))) return 'sp2';
      return 'sp3';
    }
    if (sn === 3) return 'sp2';
    if (sn === 2) return 'sp';
    return null;
  }

  function bondCounts(mol) {
    mol = M(mol);
    let sigma = mol.bonds.length;
    let pi = 0;
    mol.atoms.forEach((a) => { sigma += a.h; });
    mol.bonds.forEach((b) => { pi += b.kek - 1; });
    return { sigma, pi };
  }

  function lonePairs(mol, i) {
    mol = M(mol);
    const a = mol.atoms[i];
    const ve = VALENCE_E[a.el];
    if (ve === undefined) return 0;
    const e = ve - a.charge - kekSum(mol, i) - a.h;
    return Math.max(0, Math.floor(e / 2));
  }

  // ------------------------------------------------------------------
  // Conjugation
  // ------------------------------------------------------------------

  // Conjugated systems are built from pi bonds (aromatic bonds count as pi bonds). Two pi bonds join
  // when they share an atom, when a sigma bond links them, or when a donor (lone pair, charge or
  // radical) sits next to both. Two pi bonds of one cumulated atom (allene, CO2) are orthogonal.
  function conjugated(mol) {
    mol = M(mol);
    const n = mol.atoms.length;
    const hyper = (i) => (mol.atoms[i].el === 'S' || mol.atoms[i].el === 'P') && mol.nbr[i].length + mol.atoms[i].h >= 4;
    const nodes = [];
    const nodesAt = [];
    for (let i = 0; i < n; i++) nodesAt.push([]);
    const doubles = new Array(n).fill(0);
    mol.bonds.forEach((b) => {
      if (b.order >= 2) { doubles[b.a]++; doubles[b.b]++; }
      if ((b.order === 1.5 || b.kek >= 2) && !hyper(b.a) && !hyper(b.b)) {
        nodesAt[b.a].push(nodes.length);
        nodesAt[b.b].push(nodes.length);
        nodes.push([b.a, b.b]);
      }
    });
    const donors = [];
    for (let i = 0; i < n; i++) {
      if (nodesAt[i].length) continue;
      const a = mol.atoms[i];
      const sigma = mol.nbr[i].length + a.h;
      let d = false;
      if (lonePairs(mol, i) > 0 && (a.el === 'N' || a.el === 'O' || a.el === 'S' || a.el === 'P' || a.el === 'Se' || HALOGEN[a.el] || (a.el === 'C' && a.charge < 0))) d = true;
      if (a.el === 'C' && a.charge > 0 && sigma === 3) d = true;
      if (a.el === 'B' && a.charge === 0 && sigma === 3) d = true;
      if ((a.el === 'C' || a.el === 'N' || a.el === 'O') && unpaired(mol, i)) d = true;
      if (d) donors.push(i);
    }
    const total = nodes.length + donors.length;
    const parent = [];
    for (let i = 0; i < total; i++) parent.push(i);
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const join = (x, y) => { parent[find(x)] = find(y); };
    for (let i = 0; i < n; i++) {
      if (doubles[i] >= 2) continue;
      for (let k = 1; k < nodesAt[i].length; k++) join(nodesAt[i][0], nodesAt[i][k]);
    }
    mol.bonds.forEach((b) => {
      if (b.order !== 1) return;
      if (nodesAt[b.a].length && nodesAt[b.b].length) join(nodesAt[b.a][0], nodesAt[b.b][0]);
    });
    donors.forEach((d, k) => {
      mol.nbr[d].forEach((j) => nodesAt[j].forEach((id) => join(nodes.length + k, id)));
    });
    const sets = {};
    nodes.forEach((nd, id) => {
      const r = find(id);
      sets[r] = sets[r] || new Set();
      nd.forEach((x) => sets[r].add(x));
    });
    donors.forEach((d, k) => {
      const r = find(nodes.length + k);
      if (sets[r]) sets[r].add(d);
    });
    return Object.keys(sets).map((k) => Array.from(sets[k]).sort((p, q) => p - q))
      .sort((p, q) => {
        for (let k = 0; k < Math.min(p.length, q.length); k++) if (p[k] !== q[k]) return p[k] - q[k];
        return p.length - q.length;
      });
  }

  // ------------------------------------------------------------------
  // Canonical SMILES
  // ------------------------------------------------------------------

  const LEAF_LIMIT = 4000;

  function pad(x) { return ('0000' + x).slice(-5); }

  function components(mol) {
    const n = mol.atoms.length;
    const seen = new Array(n).fill(false);
    const out = [];
    for (let s = 0; s < n; s++) {
      if (seen[s]) continue;
      const comp = [];
      const q = [s];
      seen[s] = true;
      while (q.length) {
        const v = q.pop();
        comp.push(v);
        mol.nbr[v].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      }
      comp.sort((a, b) => a - b);
      out.push(comp);
    }
    return out;
  }

  function dense(comp, cls) {
    const vals = [];
    comp.forEach((v) => vals.push(cls[v]));
    const uniq = Array.from(new Set(vals)).sort((a, b) => a - b);
    const idx = new Map();
    uniq.forEach((x, k) => idx.set(x, k));
    const out = {};
    comp.forEach((v) => { out[v] = idx.get(cls[v]); });
    return { cls: out, count: uniq.length };
  }

  function bcode(mol, a, b) { return Math.round(mol.bondAt(a, b).order * 2); }

  function refine(mol, comp, cls0) {
    let d = dense(comp, cls0);
    for (;;) {
      const keys = {};
      comp.forEach((v) => {
        const parts = mol.nbr[v].map((w) => bcode(mol, v, w) + ':' + pad(d.cls[w])).sort();
        keys[v] = pad(d.cls[v]) + '|' + parts.join(',');
      });
      const uniq = Array.from(new Set(comp.map((v) => keys[v]))).sort();
      const idx = new Map();
      uniq.forEach((x, k) => idx.set(x, k));
      const next = {};
      comp.forEach((v) => { next[v] = idx.get(keys[v]); });
      if (uniq.length === d.count) return { cls: next, count: uniq.length };
      d = { cls: next, count: uniq.length };
    }
  }

  function atomInvariant(mol, v) {
    const a = mol.atoms[v];
    // carbon first, then fewer neighbours and more H first, so the string starts at a methyl group when there is one
    return (a.el === 'C' ? '0  ' : '1' + (a.el + ' ').slice(0, 2)) + '|' + mol.nbr[v].length + '|' + (9 - a.h) + '|' + (a.aromatic ? 1 : 0) + '|' + (a.charge + 10) + '|' + (a.iso || 0);
  }

  function initialClasses(mol, comp) {
    const keys = {};
    comp.forEach((v) => { keys[v] = atomInvariant(mol, v); });
    const uniq = Array.from(new Set(comp.map((v) => keys[v]))).sort();
    const idx = new Map();
    uniq.forEach((x, k) => idx.set(x, k));
    const out = {};
    comp.forEach((v) => { out[v] = idx.get(keys[v]); });
    return out;
  }

  function permParity(from, to) {
    // parity (0 even, 1 odd) of the permutation taking list `from` to list `to`
    const pos = from.map((x) => to.indexOf(x));
    if (pos.some((p) => p < 0)) return null;
    let inv = 0;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) if (pos[i] > pos[j]) inv++;
    return inv % 2;
  }

  function validCentre(a) {
    if (!a.chiral || a.ord.length !== 4) return false;
    let hCount = 0;
    a.ord.forEach((x) => { if (x === -1) hCount++; });
    return hCount <= 1 && new Set(a.ord).size === 4 && a.h === hCount;
  }

  // sides of the substituents of a double bond, from the / and \ marks
  function doubleBondInfo(mol, cls) {
    const out = [];
    const rs = sssr(mol);
    mol.bonds.forEach((b) => {
      if (b.order !== 2) return;
      const ends = [b.a, b.b];
      if (rs.some((r) => r.length < 8 && r.indexOf(b.a) >= 0 && r.indexOf(b.b) >= 0)) return;
      const entries = [];
      for (let k = 0; k < 2; k++) {
        const e = ends[k];
        const other = ends[1 - k];
        const subs = mol.nbr[e].filter((w) => w !== other);
        if (subs.length === 0 || subs.length > 2) return;
        if (subs.some((w) => mol.bondAt(e, w).kek !== 1 || mol.bondAt(e, w).order !== 1)) return;
        if (subs.length === 2 && cls[subs[0]] === cls[subs[1]]) return;
        const side = {};
        subs.forEach((w) => {
          const sb = mol.bondAt(e, w);
          if (!sb.dir) return;
          const eFirst = sb.a === e;
          side[w] = eFirst ? (sb.dir === '/' ? 1 : -1) : (sb.dir === '/' ? -1 : 1);
        });
        const known = Object.keys(side).map((x) => +x);
        if (!known.length) return;
        if (subs.length === 2) {
          if (known.length === 1) side[subs[0] === known[0] ? subs[1] : subs[0]] = -side[known[0]];
          else if (side[subs[0]] === side[subs[1]]) return;
        }
        subs.forEach((w) => entries.push({ e, n: w, s: side[w], bond: mol.bondAt(e, w).i }));
      }
      out.push({ bond: b.i, a: b.a, b: b.b, entries });
    });
    return out;
  }

  function writeSmiles(mol, comp, rank, tags, dbs) {
    const A = mol.atoms;
    const byRank = (x, y) => rank[x] - rank[y];
    let root = comp[0];
    comp.forEach((v) => { if (rank[v] < rank[root]) root = v; });
    const visit = {};
    const parent = {};
    const kids = {};
    const order = [];
    const closures = [];
    const closeSeen = {};
    (function dfs(v, p) {
      visit[v] = order.length;
      order.push(v);
      parent[v] = p;
      kids[v] = [];
      mol.nbr[v].slice().sort(byRank).forEach((w) => {
        if (w === p) return;
        if (visit[w] === undefined) { kids[v].push(w); dfs(w, v); } else {
          const key = mol.bondAt(v, w).i;
          if (!closeSeen[key]) { closeSeen[key] = true; closures.push({ open: w, close: v }); }
        }
      });
    })(root, -1);
    const closersAt = {};
    const openersAt = {};
    closures.forEach((c) => {
      (closersAt[c.close] = closersAt[c.close] || []).push(c);
      (openersAt[c.open] = openersAt[c.open] || []).push(c);
    });
    Object.keys(openersAt).forEach((k) => openersAt[k].sort((x, y) => rank[x.close] - rank[y.close]));

    // bond marks for stereo double bonds
    const dirMark = {};
    if (dbs && dbs.length) {
      const sorted = dbs.slice().sort((x, y) => Math.min(visit[x.a], visit[x.b]) - Math.min(visit[y.a], visit[y.b]));
      sorted.forEach((d) => {
        const base = d.entries.map((en) => {
          const eFirst = visit[en.e] < visit[en.n];
          return ((en.s === 1) === eFirst) ? '/' : '\\';
        });
        // the frame (which side counts as up) is free: use a mark already placed, else make the first bond '/'
        let first = 0;
        const textPos = (en) => Math.min(visit[en.e], visit[en.n]) * 1000 + Math.max(visit[en.e], visit[en.n]);
        d.entries.forEach((en, k) => { if (textPos(en) < textPos(d.entries[first])) first = k; });
        let flip = base[first] !== '/';
        for (let k = 0; k < d.entries.length; k++) {
          const have = dirMark[d.entries[k].bond];
          if (have) { flip = have !== base[k]; break; }
        }
        d.entries.forEach((en, k) => {
          const c = flip ? (base[k] === '/' ? '\\' : '/') : base[k];
          if (!dirMark[en.bond]) dirMark[en.bond] = c;
        });
      });
    }

    const digitOf = {};
    const used = {};
    function allocDigit() {
      let d = 1;
      while (used[d]) d++;
      used[d] = true;
      return d;
    }
    const digitText = (d) => (d < 10 ? String(d) : '%' + d);

    function bondText(x, y) {
      const b = mol.bondAt(x, y);
      const mark = dirMark[b.i];
      if (mark) return mark;
      if (b.order === 2) return '=';
      if (b.order === 3) return '#';
      if (b.order === 1.5) return '';
      if (A[x].aromatic && A[y].aromatic) return '-';
      return '';
    }

    function atomText(v, outOrder) {
      const a = A[v];
      let tag = null;
      if (tags && tags[v]) {
        const par = permParity(a.ord, outOrder);
        if (par !== null) tag = par ? (tags[v] === '@' ? '@@' : '@') : tags[v];
      }
      const sym = a.aromatic ? a.el.toLowerCase() : a.el;
      let plain = false;
      if (ORGANIC[a.el] && a.charge === 0 && !a.iso && !tag) {
        const sum = kekSum(mol, v);
        if (a.h === fillH(a.el, sum)) {
          if (!a.aromatic) plain = true;
          else {
            const target = aromaticTarget(a.el, 0);
            let nonArom = 0;
            let arC = 0;
            let ringDouble = false;
            mol.nbr[v].forEach((w) => {
              const b = mol.bondAt(v, w);
              if (b.order === 1.5) { arC++; if (b.kek === 2) ringDouble = true; } else nonArom += b.order;
            });
            plain = target !== null && (target - (nonArom + arC) >= 1) === ringDouble;
          }
        }
      }
      if (plain) return sym;
      let s = '[' + (a.iso ? a.iso : '') + sym + (tag || '');
      if (a.h) s += 'H' + (a.h > 1 ? a.h : '');
      if (a.charge) s += (a.charge > 0 ? '+' : '-') + (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : '');
      return s + ']';
    }

    function emit(v) {
      const closers = (closersAt[v] || []).slice().sort((x, y) => digitOf[mol.bondAt(x.open, x.close).i] - digitOf[mol.bondAt(y.open, y.close).i]);
      const openers = openersAt[v] || [];
      openers.forEach((c) => { digitOf[mol.bondAt(c.open, c.close).i] = allocDigit(); });
      const outOrder = [];
      if (parent[v] >= 0) outOrder.push(parent[v]);
      if (A[v].h === 1) outOrder.push(-1);
      closers.forEach((c) => outOrder.push(c.open));
      openers.forEach((c) => outOrder.push(c.close));
      kids[v].forEach((w) => outOrder.push(w));
      let s = atomText(v, outOrder);
      closers.forEach((c) => {
        const id = mol.bondAt(c.open, c.close).i;
        s += digitText(digitOf[id]);
      });
      openers.forEach((c) => {
        const id = mol.bondAt(c.open, c.close).i;
        s += bondText(c.open, c.close) + digitText(digitOf[id]);
      });
      closers.forEach((c) => { delete used[digitOf[mol.bondAt(c.open, c.close).i]]; });
      const ks = kids[v];
      ks.forEach((w, k) => {
        const piece = bondText(v, w) + emit(w);
        s += k < ks.length - 1 ? '(' + piece + ')' : piece;
      });
      return s;
    }
    return emit(root);
  }

  function canonicalComponent(mol, comp, stereo, tags, dbs) {
    const base = refine(mol, comp, initialClasses(mol, comp));
    let best = null;
    let leaves = 0;
    function isTwin(u, v) {
      if (mol.nbr[u].length !== 1 || mol.nbr[v].length !== 1) return false;
      return mol.nbr[u][0] === mol.nbr[v][0] && bcode(mol, u, mol.nbr[u][0]) === bcode(mol, v, mol.nbr[v][0]);
    }
    function search(start) {
      const r = refine(mol, comp, start);
      if (r.count === comp.length) {
        leaves++;
        const s = writeSmiles(mol, comp, r.cls, tags, dbs);
        if (best === null || s < best) best = s;
        return;
      }
      const sizes = {};
      comp.forEach((v) => { sizes[r.cls[v]] = (sizes[r.cls[v]] || 0) + 1; });
      let target = -1;
      for (let k = 0; k < r.count; k++) if (sizes[k] > 1) { target = k; break; }
      const members = comp.filter((v) => r.cls[v] === target);
      const tried = [];
      for (const v of members) {
        if (leaves >= LEAF_LIMIT && best !== null) return;
        if (!stereo && tried.some((u) => isTwin(u, v))) continue;
        tried.push(v);
        const next = {};
        comp.forEach((u) => { next[u] = r.cls[u] * 2 + (u === v ? 0 : 1); });
        search(next);
      }
    }
    search(base.cls);
    return { string: best, base: base.cls };
  }

  function canonical(mol, opts) {
    mol = M(mol);
    const stereo = !!(opts && opts.stereo);
    const parts = components(mol).map((comp) => {
      if (!stereo) return canonicalComponent(mol, comp, false, null, null).string;
      const first = canonicalComponent(mol, comp, true, null, null);
      let tags = {};
      const tied = [];
      comp.forEach((v) => {
        const a = mol.atoms[v];
        if (!validCentre(a)) return;
        tags[v] = a.chiral;
        const cl = a.ord.filter((x) => x >= 0).map((x) => first.base[x]);
        if (new Set(cl).size < cl.length) tied.push(v);
      });
      const dbs = doubleBondInfo(mol, first.base).filter((d) => comp.indexOf(d.a) >= 0);
      let res = canonicalComponent(mol, comp, true, tags, dbs).string;
      // Decide every drop against the full tag set, never one after another (a partly specified ring can
      // be chiral although the molecule is not). A centre is non-stereogenic if flipping its tag gives the
      // same molecule and either its tied branches are separate (pentane-2,3,4-triol: the branches are
      // identical, so the middle centre is not a centre) or, when they are joined through a ring, nothing
      // else in the ring system carries a tag or a stereo double bond (methylcyclohexane).
      const marked = {};
      dbs.forEach((d) => { marked[d.a] = true; marked[d.b] = true; });
      const mayDrop = (v) => {
        const a = mol.atoms[v];
        const cl = a.ord.filter((x) => x >= 0).map((x) => first.base[x]);
        const tiedNbrs = a.ord.filter((x) => x >= 0 && cl.filter((c) => c === first.base[x]).length > 1);
        const seen = { [v]: true, [tiedNbrs[0]]: true };
        const q = [tiedNbrs[0]];
        let others = false;
        while (q.length) {
          const x = q.pop();
          if ((tags[x] && x !== v) || marked[x]) others = true;
          mol.nbr[x].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
        }
        const joined = tiedNbrs.slice(1).some((x) => seen[x]);
        return !joined || !others;
      };
      const drop = tied.filter((v) => {
        if (!mayDrop(v)) return false;
        const flipped = Object.assign({}, tags);
        flipped[v] = tags[v] === '@' ? '@@' : '@';
        return canonicalComponent(mol, comp, true, flipped, dbs).string === res;
      });
      if (drop.length) {
        tags = Object.assign({}, tags);
        drop.forEach((v) => { delete tags[v]; });
        res = canonicalComponent(mol, comp, true, tags, dbs).string;
      }
      return res;
    });
    return parts.sort().join('.');
  }

  function same(a, b, opts) {
    return canonical(M(a), opts) === canonical(M(b), opts);
  }

  // ------------------------------------------------------------------
  // Functional groups
  // ------------------------------------------------------------------

  const SENIORITY = ['acid', 'carboxylate', 'sulfonic', 'anhydride', 'ester', 'acylhalide', 'amide', 'nitrile',
    'aldehyde', 'ketone', 'phenol', 'alcohol', 'thiol', 'amine1', 'amine2', 'amine3', 'ammonium', 'nitro',
    'halide', 'ether', 'sulfide', 'alkene', 'alkyne', 'arene'];

  function groups(mol) {
    mol = M(mol);
    const out = [];
    const A = mol.atoms;
    const N = mol.nbr;
    const el = (i) => A[i].el;
    const ord = (i, j) => mol.bondAt(i, j).kek;
    const add = (type, atoms) => out.push({ type, atoms });
    const dblO = (c) => { for (const j of N[c]) if (el(j) === 'O' && ord(c, j) === 2) return j; return -1; };
    const isCarbonyl = (c) => el(c) === 'C' && dblO(c) >= 0;
    const isCarbonOrH = (i) => el(i) === 'C';

    for (let c = 0; c < A.length; c++) {
      if (el(c) !== 'C') continue;
      const o = dblO(c);
      if (o < 0) continue;
      const X = N[c].filter((j) => j !== o);
      const sigma = N[c].length + A[c].h;
      if (sigma !== 3) continue;
      const hetero = X.filter((j) => el(j) !== 'C');
      const carbons = X.filter((j) => el(j) === 'C');
      if (hetero.length === 0) {
        if (A[c].h >= 1 && carbons.length + A[c].h === 2) add('aldehyde', [c, o]);
        else if (carbons.length === 2) add('ketone', [c, o]);
        continue;
      }
      if (hetero.length !== 1 || carbons.length + A[c].h !== 1) continue;
      const x = hetero[0];
      if (ord(c, x) !== 1) continue;
      if (el(x) === 'O') {
        const rest = N[x].filter((j) => j !== c);
        if (A[x].h >= 1 && rest.length === 0) add('acid', [c, o, x]);
        else if (A[x].charge === -1 && rest.length === 0) add('carboxylate', [c, o, x]);
        else if (rest.length === 1 && el(rest[0]) === 'C') {
          if (isCarbonyl(rest[0])) { if (c < rest[0]) add('anhydride', [c, o, x, rest[0], dblO(rest[0])]); } else add('ester', [c, o, x, rest[0]]);
        }
      } else if (HALOGEN[el(x)]) {
        add('acylhalide', [c, o, x]);
      } else if (el(x) === 'N' && A[x].charge === 0) {
        add('amide', [c, o, x]);
      }
    }

    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      const e = a.el;
      if (e === 'C') {
        N[i].forEach((j) => {
          if (j < i) return;
          if (el(j) !== 'C') return;
          const b = mol.bondAt(i, j);
          if (b.order === 2) add('alkene', [i, j]);
          else if (b.order === 3) add('alkyne', [i, j]);
        });
        N[i].forEach((j) => {
          if (el(j) === 'N' && ord(i, j) === 3) add('nitrile', [i, j]);
        });
      } else if (HALOGEN[e]) {
        if (N[i].length === 1 && el(N[i][0]) === 'C' && !isCarbonyl(N[i][0])) add('halide', [N[i][0], i]);
      } else if (e === 'O' && !a.aromatic && a.charge === 0) {
        if (a.h >= 1 && N[i].length === 1 && el(N[i][0]) === 'C') {
          const c = N[i][0];
          if (isCarbonyl(c)) { /* part of an acid */ } else if (A[c].aromatic) add('phenol', [c, i]);
          else if (hybridization(mol, c) === 'sp3') add('alcohol', [c, i]);
        } else if (a.h === 0 && N[i].length === 2 && N[i].every((j) => isCarbonOrH(j) && ord(i, j) === 1 && !isCarbonyl(j))) {
          add('ether', [N[i][0], i, N[i][1]]);
        }
      } else if (e === 'S' && !a.aromatic && a.charge === 0) {
        if (a.h >= 1 && N[i].length === 1 && el(N[i][0]) === 'C' && !isCarbonyl(N[i][0])) add('thiol', [N[i][0], i]);
        else if (a.h === 0 && N[i].length === 2 && N[i].every((j) => isCarbonOrH(j) && ord(i, j) === 1 && !isCarbonyl(j))) add('sulfide', [N[i][0], i, N[i][1]]);
        else if (a.h === 0 && N[i].length === 4) {
          const dbl = N[i].filter((j) => el(j) === 'O' && ord(i, j) === 2);
          const oh = N[i].filter((j) => el(j) === 'O' && ord(i, j) === 1 && (A[j].h >= 1 || A[j].charge === -1) && N[j].length === 1);
          const cs = N[i].filter((j) => el(j) === 'C');
          if (dbl.length === 2 && oh.length === 1 && cs.length === 1) add('sulfonic', [i, dbl[0], dbl[1], oh[0]]);
        }
      } else if (e === 'N' && !a.aromatic) {
        const heavy = N[i];
        const allC = heavy.every((j) => el(j) === 'C');
        const single = heavy.every((j) => ord(i, j) === 1);
        if (a.charge === 0 && single && allC && heavy.length >= 1 && heavy.length + a.h === 3 &&
          !heavy.some((j) => isCarbonyl(j) || N[j].some((k) => k !== i && el(k) === 'N' && mol.bondAt(j, k).order >= 2))) {
          add('amine' + heavy.length, [i]);
        } else if (a.charge === 1 && single && allC && heavy.length + a.h === 4) {
          add('ammonium', [i]);
        } else if (a.charge === 1) {
          const os = heavy.filter((j) => el(j) === 'O');
          if (os.length === 2) {
            const dbl = os.filter((j) => ord(i, j) === 2);
            const neg = os.filter((j) => ord(i, j) === 1 && A[j].charge === -1);
            if (dbl.length === 1 && neg.length === 1) add('nitro', [i, os[0], os[1]]);
          }
        }
      }
    }
    // aromatic rings
    sssr(mol).forEach((r) => { if (isAromaticRing(mol, r)) add('arene', r.slice().sort((x, y) => x - y)); });

    out.sort((p, q) => (p.atoms[0] - q.atoms[0]) || (p.type < q.type ? -1 : p.type > q.type ? 1 : 0));
    return out;
  }

  function compoundClass(mol) {
    mol = M(mol);
    const g = groups(mol);
    let best = -1;
    g.forEach((x) => {
      const k = SENIORITY.indexOf(x.type);
      if (k >= 0 && (best < 0 || k < best)) best = k;
    });
    if (best >= 0) return SENIORITY[best];
    return mol.atoms.every((a) => a.el === 'C') ? 'alkane' : 'other';
  }

  ORG.chem = {
    parse, formula, formulaString, unsaturation, carbonClass, hybridization, bondCounts, lonePairs,
    rings, isAromaticRing, aromaticAtoms, conjugated, canonical, same, groups, compoundClass,
  };
})(globalThis.ORG = globalThis.ORG || {});
