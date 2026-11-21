(function (ORG) {
  'use strict';

  // Stereochemistry and isomer enumeration, built on ORG.chem.
  // A molecule here is the object ORG.chem.parse returns. Chirality is read from
  // atom.chiral ('@' / '@@') and atom.ord (neighbour order of the SMILES, -1 for
  // the hydrogen of a bracket atom); double bond geometry from bond.dir.

  const chem = ORG.chem;

  const Z = {
    H: 1, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17,
    K: 19, Ca: 20, Ga: 31, Ge: 32, As: 33, Se: 34, Br: 35, Rb: 37, Sr: 38, Sn: 50, Sb: 51, Te: 52, I: 53, Cs: 55, Ba: 56,
  };
  const zOf = (el) => Z[el] || 0;

  function M(x) { return typeof x === 'string' ? chem.parse(x) : x; }

  // ------------------------------------------------------------------
  // Helpers on molecules
  // ------------------------------------------------------------------

  function cloneMol(mol) {
    const out = Object.assign({}, mol);
    out.atoms = mol.atoms.map((a) => Object.assign({}, a, { ord: a.ord ? a.ord.slice() : [] }));
    out.bonds = mol.bonds.map((b) => Object.assign({}, b));
    out.nbr = mol.nbr.map((l) => l.slice());
    const map = {};
    out.bonds.forEach((b) => { map[b.a < b.b ? b.a + '_' + b.b : b.b + '_' + b.a] = b; });
    out.bondAt = (a, b) => map[a < b ? a + '_' + b : b + '_' + a] || null;
    return out;
  }

  // The neighbour list of a tetrahedral atom is usable when it names four distinct
  // neighbours (an implicit hydrogen is -1) and agrees with the hydrogen count.
  function goodOrd(a, mol, i) {
    const o = a.ord;
    if (!o || o.length !== 4 || new Set(o).size !== 4) return false;
    let h = 0;
    for (const x of o) {
      if (x === -1) h++;
      else if (mol.nbr[i].indexOf(x) < 0) return false;
    }
    return h <= 1 && a.h === h;
  }

  function hasTag(mol, i) {
    const a = mol.atoms[i];
    return !!a.chiral && goodOrd(a, mol, i);
  }

  function permParity(from, to) {
    const pos = from.map((x) => to.indexOf(x));
    let inv = 0;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) if (pos[i] > pos[j]) inv++;
    return inv % 2;
  }

  // Constitutional symmetry classes (stereo ignored): atoms with the same class are equivalent.
  function symClasses(mol) {
    const n = mol.atoms.length;
    const aromBond = {};
    chem.rings(mol).forEach((r) => {
      if (!chem.isAromaticRing(mol, r)) return;
      for (let k = 0; k < r.length; k++) {
        const a = r[k];
        const b = r[(k + 1) % r.length];
        aromBond[a < b ? a + '_' + b : b + '_' + a] = true;
      }
    });
    const code = (a, b) => (aromBond[a < b ? a + '_' + b : b + '_' + a] ? 'a' : String(mol.bondAt(a, b).kek));
    let cls = mol.atoms.map((a) => a.el + '|' + a.h + '|' + a.charge + '|' + (a.iso || 0));
    const rank = (keys) => {
      const uniq = Array.from(new Set(keys)).sort();
      return keys.map((k) => uniq.indexOf(k));
    };
    let cur = rank(cls);
    let count = new Set(cur).size;
    for (;;) {
      const keys = [];
      for (let v = 0; v < n; v++) {
        keys.push(cur[v] + '[' + mol.nbr[v].map((w) => code(v, w) + ':' + cur[w]).sort().join(',') + ']');
      }
      const next = rank(keys);
      const c = new Set(next).size;
      cur = next;
      if (c === count) break;
      count = c;
    }
    return cur;
  }

  // ------------------------------------------------------------------
  // CIP: hierarchical digraph
  // ------------------------------------------------------------------

  const DEPTH = 16;

  function mkNode(atom, z, parent, path, dup) {
    return { atom, z, parent, path, dup, kids: null, sorted: null };
  }

  function hNode() { return mkNode(-1, 1, -1, [], true); }

  function kidsOf(mol, n) {
    if (n.kids) return n.kids;
    const out = [];
    if (!n.dup) {
      const v = n.atom;
      const p = n.parent;
      const A = mol.atoms;
      mol.nbr[v].forEach((w) => {
        if (w === p) return;
        const order = mol.bondAt(v, w).kek;
        if (n.path.indexOf(w) >= 0) out.push(mkNode(w, zOf(A[w].el), v, null, true));
        else out.push(mkNode(w, zOf(A[w].el), v, n.path.concat([w]), false));
        for (let k = 1; k < order; k++) out.push(mkNode(w, zOf(A[w].el), v, null, true));
      });
      if (p >= 0) {
        const order = mol.bondAt(v, p).kek;
        for (let k = 1; k < order; k++) out.push(mkNode(p, zOf(A[p].el), v, null, true));
      }
      for (let k = 0; k < A[v].h; k++) out.push(hNode());
    }
    n.kids = out;
    return out;
  }

  function sortedKids(mol, n) {
    if (n.sorted) return n.sorted;
    const list = kidsOf(mol, n).slice();
    list.sort((x, y) => cmp(mol, y, x));
    n.sorted = list;
    return list;
  }

  // 1 if branch a outranks branch b, -1 if lower, 0 if the digraphs cannot be told apart (rules 1a only, plus duplicates)
  function cmp(mol, a, b) {
    if (a.z !== b.z) return a.z > b.z ? 1 : -1;
    let la = [a];
    let lb = [b];
    for (let d = 0; d < DEPTH; d++) {
      const ga = la.map((n) => sortedKids(mol, n));
      const gb = lb.map((n) => sortedKids(mol, n));
      let any = false;
      for (let i = 0; i < ga.length; i++) {
        const x = ga[i];
        const y = gb[i];
        const len = Math.max(x.length, y.length);
        for (let k = 0; k < len; k++) {
          const zx = k < x.length ? x[k].z : 0;
          const zy = k < y.length ? y[k].z : 0;
          if (zx !== zy) return zx > zy ? 1 : -1;
        }
        if (len) any = true;
      }
      if (!any) return 0;
      la = [].concat(...ga);
      lb = [].concat(...gb);
    }
    return 0;
  }

  // priorities 1 (highest) .. n for a list of branches, or null when two cannot be ranked apart
  function priorities(mol, nodes) {
    const out = [];
    for (let k = 0; k < nodes.length; k++) {
      let higher = 0;
      for (let j = 0; j < nodes.length; j++) {
        if (j === k) continue;
        const c = cmp(mol, nodes[j], nodes[k]);
        if (c === 0) return null;
        if (c > 0) higher++;
      }
      out.push(higher + 1);
    }
    return out;
  }

  function ligandNodes(mol, centre, atoms) {
    return atoms.map((x) => (x === -1 ? hNode() : mkNode(x, zOf(mol.atoms[x].el), centre, [centre, x], false)));
  }

  function cip(mol, i) {
    mol = M(mol);
    if (!hasTag(mol, i)) return null;
    const a = mol.atoms[i];
    if (a.el !== 'C' && a.el !== 'N' && a.el !== 'P' && a.el !== 'Si') return null;
    const pri = priorities(mol, ligandNodes(mol, i, a.ord));
    if (!pri) return null;
    // looking from the lowest priority, the other three in order 1,2,3 run anticlockwise for '@' (so clockwise seen from the other side: R)
    const par = permParity(pri, [4, 1, 2, 3]);
    const tag = par ? (a.chiral === '@' ? '@@' : '@') : a.chiral;
    return tag === '@' ? 'R' : 'S';
  }

  // ------------------------------------------------------------------
  // Stereocentres and stereogenic double bonds
  // ------------------------------------------------------------------

  // Reference neighbour order of a tetrahedral atom: the implicit hydrogen first, then the neighbours by index.
  function refOrd(mol, c) { return (mol.atoms[c].h === 1 ? [-1] : []).concat(mol.nbr[c]); }

  // All symmetry operations of the constitution (atom permutations keeping elements, hydrogens, charges and bonds).
  // Equivalent terminal atoms on one neighbour (the methyls of a tert-butyl group) are not permuted: they never carry stereochemistry.
  function automorphisms(mol) {
    const n = mol.atoms.length;
    const cls = symClasses(mol);
    const code = (a, b) => { const x = mol.bondAt(a, b); return x ? x.kek + (x.order === 1.5 ? 'a' : '') : ''; };
    const order = [];
    const seen = new Array(n).fill(false);
    for (let s0 = 0; s0 < n; s0++) {
      if (seen[s0]) continue;
      seen[s0] = true;
      const q = [s0];
      for (let h = 0; h < q.length; h++) {
        order.push(q[h]);
        mol.nbr[q[h]].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      }
    }
    const twins = order.map((v) => (mol.nbr[v].length === 1 ? mol.nbr[mol.nbr[v][0]].filter((u) => u !== v && mol.nbr[u].length === 1 && cls[u] === cls[v]) : []));
    const sig = new Array(n).fill(-1);
    const used = new Array(n).fill(false);
    const out = [];
    (function go(k) {
      if (out.length >= 5000) return;
      if (k === n) { out.push(sig.slice()); return; }
      const v = order[k];
      for (let w = 0; w < n; w++) {
        if (used[w] || cls[w] !== cls[v]) continue;
        let ok = true;
        for (let j = 0; j < k && ok; j++) {
          const u = order[j];
          if (code(v, u) !== code(w, sig[u])) ok = false;
        }
        if (!ok) continue;
        for (const t of twins[k]) if (sig[t] >= 0 && (t < v) !== (sig[t] < w)) { ok = false; break; }
        if (!ok) continue;
        sig[v] = w;
        used[w] = true;
        go(k + 1);
        used[w] = false;
        sig[v] = -1;
      }
    })(0);
    return out;
  }

  // How the symmetry operations act on an assignment (0/1 per stereocentre, then per stereogenic double bond).
  // Centre: 0 is '@' with the neighbours in refOrd order. Double bond: 0 is cis (the lowest-numbered substituents on one side).
  function symmetry(mol, cent, dbs) {
    const ci = new Map(cent.map((c, k) => [c, k]));
    const di = new Map(dbs.map((d, k) => [d[0] + '_' + d[1], k]));
    const R = cent.map((c) => refOrd(mol, c));
    const refSub = (e, other) => Math.min.apply(null, mol.nbr[e].filter((w) => w !== other));
    const ops = [];
    const nc = cent.length;
    outer: for (const sg of automorphisms(mol)) {
      const map = new Array(nc + dbs.length);
      const flip = new Array(nc + dbs.length).fill(0);
      for (let k = 0; k < nc; k++) {
        const k2 = ci.get(sg[cent[k]]);
        if (k2 === undefined) continue outer;
        map[k] = k2;
        flip[k] = permParity(R[k].map((x) => (x < 0 ? x : sg[x])), R[k2]);
      }
      for (let k = 0; k < dbs.length; k++) {
        const x = dbs[k][0];
        const y = dbs[k][1];
        const x2 = sg[x];
        const y2 = sg[y];
        const k2 = di.get(Math.min(x2, y2) + '_' + Math.max(x2, y2));
        if (k2 === undefined) continue outer;
        map[nc + k] = nc + k2;
        flip[nc + k] = (sg[refSub(x, y)] !== refSub(x2, y2) ? 1 : 0) ^ (sg[refSub(y, x)] !== refSub(y2, x2) ? 1 : 0);
      }
      ops.push({ map, flip });
    }
    return ops;
  }

  function keyOf(ops, v) {
    let best = null;
    for (const op of ops) {
      const w = new Array(v.length);
      for (let k = 0; k < v.length; k++) w[op.map[k]] = v[k] ^ op.flip[k];
      const s = w.join('');
      if (best === null || s < best) best = s;
    }
    return best;
  }

  function tetraCandidates(mol) {
    const cls = symClasses(mol);
    const sure = [];
    const tied = [];
    mol.atoms.forEach((a, i) => {
      if (a.el !== 'C' || a.charge !== 0 || a.aromatic) return;
      if (mol.nbr[i].length + a.h !== 4 || a.h > 1) return;
      if (mol.nbr[i].some((w) => mol.bondAt(i, w).kek !== 1)) return;
      const keys = mol.nbr[i].map((w) => cls[w]);
      if (new Set(keys).size === keys.length) sure.push(i);
      else if (keys.length - new Set(keys).size === 1) {
        // two equivalent ligands: stereogenic only if they are not identical terminal atoms
        const twin = mol.nbr[i].filter((w) => keys.filter((k) => k === cls[w]).length === 2);
        if (!twin.every((w) => mol.nbr[w].length === 1)) tied.push(i);
      }
    });
    return { sure, tied };
  }

  function stereocentres(mol) {
    mol = M(mol);
    const { sure, tied } = tetraCandidates(mol);
    const found = new Set(sure);
    if (tied.length) {
      const all = sure.concat(tied).sort((x, y) => x - y);
      const ops = symmetry(mol, all, []);
      [0, 1].forEach((pattern) => {
        const v = all.map((c, k) => (pattern === 1 ? k % 2 : 0));
        const base = keyOf(ops, v);
        tied.forEach((c) => {
          const w = v.slice();
          w[all.indexOf(c)] ^= 1;
          if (keyOf(ops, w) !== base) found.add(c);
        });
      });
    }
    return Array.from(found).sort((x, y) => x - y);
  }

  function inSmallRing(mol, a, b, rs) {
    return rs.some((r) => r.length < 8 && r.indexOf(a) >= 0 && r.indexOf(b) >= 0);
  }

  function stereoBonds(mol) {
    mol = M(mol);
    const cls = symClasses(mol);
    const rs = chem.rings(mol);
    const out = [];
    mol.bonds.forEach((b) => {
      if (b.order !== 2) return;
      if (inSmallRing(mol, b.a, b.b, rs)) return;
      const ends = [b.a, b.b];
      for (let k = 0; k < 2; k++) {
        const e = ends[k];
        const a = mol.atoms[e];
        const subs = mol.nbr[e].filter((w) => w !== ends[1 - k]);
        if (a.charge !== 0) return;
        if (a.el !== 'C' && a.el !== 'N') return;
        if (subs.some((w) => mol.bondAt(e, w).kek !== 1)) return;
        if (a.el === 'N') { if (subs.length !== 1 || a.h !== 0) return; } else if (subs.length === 2) {
          if (a.h !== 0 || cls[subs[0]] === cls[subs[1]]) return;
        } else if (!(subs.length === 1 && a.h === 1)) return;
      }
      out.push([Math.min(b.a, b.b), Math.max(b.a, b.b)]);
    });
    return out;
  }

  // ------------------------------------------------------------------
  // Double bond geometry
  // ------------------------------------------------------------------

  // +1: substituent w lies "above" e as drawn with the bond marks; -1: below
  function sideOf(mol, e, w) {
    const b = mol.bondAt(e, w);
    if (!b.dir) return 0;
    return b.a === e ? (b.dir === '/' ? 1 : -1) : (b.dir === '/' ? -1 : 1);
  }

  function endSides(mol, e, other) {
    const subs = mol.nbr[e].filter((w) => w !== other);
    const side = {};
    subs.forEach((w) => { const s = sideOf(mol, e, w); if (s) side[w] = s; });
    if (subs.length === 2) {
      if (side[subs[0]] && !side[subs[1]]) side[subs[1]] = -side[subs[0]];
      else if (side[subs[1]] && !side[subs[0]]) side[subs[0]] = -side[subs[1]];
    }
    return { subs, side };
  }

  function isStereoBond(mol, a, b) {
    const bond = mol.bondAt(a, b);
    if (!bond || bond.order !== 2) return false;
    return stereoBonds(mol).some((p) => p[0] === Math.min(a, b) && p[1] === Math.max(a, b));
  }

  function topSub(mol, e, subs) {
    if (subs.length === 1) return subs[0];
    const nodes = subs.map((w) => mkNode(w, zOf(mol.atoms[w].el), e, [e, w], false));
    const pri = priorities(mol, nodes);
    if (!pri) return null;
    return subs[pri.indexOf(1)];
  }

  function ez(mol, a, b) {
    mol = M(mol);
    if (!isStereoBond(mol, a, b)) return null;
    const ea = endSides(mol, a, b);
    const eb = endSides(mol, b, a);
    if (!Object.keys(ea.side).length || !Object.keys(eb.side).length) return null;
    const ha = topSub(mol, a, ea.subs);
    const hb = topSub(mol, b, eb.subs);
    if (ha === null || hb === null) return null;
    return ea.side[ha] === eb.side[hb] ? 'Z' : 'E';
  }

  // ring face of the exocyclic substituent of ring atom v: the ring is walked in the order of `ring`
  function ringFace(mol, ring, v) {
    const k = ring.indexOf(v);
    const prev = ring[(k + ring.length - 1) % ring.length];
    const next = ring[(k + 1) % ring.length];
    const a = mol.atoms[v];
    if (!hasTag(mol, v)) return null;
    const rest = a.ord.filter((x) => x !== prev && x !== next);
    if (rest.length !== 2) return null;
    // the heavy substituent is the "up" or "down" one; if both are heavy the position is not a simple cis/trans site
    const heavy = rest.filter((x) => x !== -1);
    if (heavy.length !== 1) return null;
    const target = [prev, next, heavy[0], rest.find((x) => x !== heavy[0])];
    const par = permParity(a.ord, target);
    const tag = par ? (a.chiral === '@' ? '@@' : '@') : a.chiral;
    return tag;
  }

  function cisTrans(mol, a, b) {
    mol = M(mol);
    const bond = mol.bondAt(a, b);
    if (bond && bond.order === 2) {
      if (!isStereoBond(mol, a, b)) return null;
      const ea = endSides(mol, a, b);
      const eb = endSides(mol, b, a);
      if (ea.subs.length !== 1 || eb.subs.length !== 1) return null;
      const sa = ea.side[ea.subs[0]];
      const sb = eb.side[eb.subs[0]];
      if (!sa || !sb) return null;
      return sa === sb ? 'cis' : 'trans';
    }
    // two ring atoms, each with one substituent
    if (a === b) return null;
    const rings = chem.rings(mol).filter((r) => r.indexOf(a) >= 0 && r.indexOf(b) >= 0).sort((x, y) => x.length - y.length);
    if (!rings.length) return null;
    const fa = ringFace(mol, rings[0], a);
    const fb = ringFace(mol, rings[0], b);
    if (!fa || !fb) return null;
    return fa === fb ? 'cis' : 'trans';
  }

  // ------------------------------------------------------------------
  // Enumerating stereoisomers
  // ------------------------------------------------------------------

  // Writes the double bond geometry of an assignment into a copy of the molecule (bond marks / and \).
  // Marks on a bond shared by two double bonds are placed once; another substituent is tried if they conflict.
  function writeBonds(m, dbs, states) {
    const side = (e, w) => sideOf(m, e, w);
    const write = (e, w, s) => {
      const b = m.bondAt(e, w);
      b.dir = b.a === e ? (s === 1 ? '/' : '\\') : (s === 1 ? '\\' : '/');
    };
    for (let k = 0; k < dbs.length; k++) {
      const x = dbs[k][0];
      const y = dbs[k][1];
      const sx = m.nbr[x].filter((w) => w !== y).sort((p, q) => p - q);
      const sy = m.nbr[y].filter((w) => w !== x).sort((p, q) => p - q);
      let done = false;
      const markedFirst = (e) => (p, q) => (side(e, q) ? 1 : 0) - (side(e, p) ? 1 : 0);
      for (const cx of sx.slice().sort(markedFirst(x))) {
        for (const cy of sy.slice().sort(markedFirst(y))) {
          const cis = (states[k] === 0) !== ((cx !== sx[0]) !== (cy !== sy[0]));
          let px = side(x, cx);
          const py = side(y, cy);
          if (px && py) { if ((px === py) === cis) { done = true; break; } continue; }
          if (!px && !py) { px = 1; write(x, cx, 1); write(y, cy, cis ? 1 : -1); done = true; break; }
          if (px) write(y, cy, cis ? px : -px); else write(x, cx, cis ? py : -py);
          done = true;
          break;
        }
        if (done) break;
      }
      if (!done) return false;
    }
    return true;
  }

  function realise(mol, cent, dbs, v) {
    const m = cloneMol(mol);
    m.atoms.forEach((a) => { a.chiral = null; });
    m.bonds.forEach((b) => { b.dir = null; });
    cent.forEach((c, k) => {
      m.atoms[c].ord = refOrd(m, c);
      m.atoms[c].chiral = v[k] ? '@@' : '@';
    });
    if (!writeBonds(m, dbs, v.slice(cent.length))) return null;
    return chem.canonical(m, { stereo: true });
  }

  // Reads the configuration the SMILES already states: 0/1 where specified, null where not.
  function readSpec(mol, cent, dbs) {
    const v = [];
    cent.forEach((c) => {
      v.push(hasTag(mol, c) ? ((mol.atoms[c].chiral === '@@' ? 1 : 0) ^ permParity(mol.atoms[c].ord, refOrd(mol, c))) : null);
    });
    dbs.forEach((d) => {
      const ex = endSides(mol, d[0], d[1]);
      const ey = endSides(mol, d[1], d[0]);
      const rx = Math.min.apply(null, ex.subs);
      const ry = Math.min.apply(null, ey.subs);
      v.push(ex.side[rx] && ey.side[ry] ? (ex.side[rx] === ey.side[ry] ? 0 : 1) : null);
    });
    return v;
  }

  // Every distinct stereoisomer (up to symmetry), consistent with the marks already in the SMILES when useSpec is true.
  function enumerate(mol, useSpec) {
    const cent = stereocentres(mol);
    const dbs = stereoBonds(mol);
    const n = cent.length + dbs.length;
    const ops = symmetry(mol, cent, dbs);
    const spec = useSpec ? readSpec(mol, cent, dbs) : new Array(n).fill(null);
    const free = [];
    spec.forEach((x, k) => { if (x === null) free.push(k); });
    const seen = new Map();
    for (let mask = 0; mask < (1 << free.length); mask++) {
      const v = spec.slice();
      free.forEach((k, j) => { v[k] = (mask >> j) & 1; });
      const key = keyOf(ops, v);
      if (seen.has(key)) continue;
      const mirror = v.map((x, k) => (k < cent.length ? x ^ 1 : x));
      const chiral = cent.length > 0 && keyOf(ops, mirror) !== key;
      seen.set(key, { v, chiral, meso: cent.length >= 2 && !chiral });
    }
    return { cent, dbs, list: Array.from(seen.values()) };
  }

  function stereoisomers(mol) {
    mol = M(mol);
    const e = enumerate(mol, false);
    const out = [];
    e.list.forEach((r) => {
      const s = realise(mol, e.cent, e.dbs, r.v);
      if (s !== null && out.indexOf(s) < 0) out.push(s);
    });
    return out;
  }

  function isChiral(mol) {
    mol = M(mol);
    return enumerate(mol, true).list.some((r) => r.chiral);
  }

  function isMeso(mol) {
    mol = M(mol);
    return enumerate(mol, true).list.some((r) => r.meso);
  }

  function withConfig(mol, cfg) {
    const m = cloneMol(M(mol));
    Object.keys(cfg).forEach((key) => {
      const i = +key;
      const a = m.atoms[i];
      if (!goodOrd(a, m, i)) a.ord = (a.h === 1 ? [-1] : []).concat(m.nbr[i]);
      if (!goodOrd(a, m, i)) throw new Error('withConfig: atom ' + i + ' is not a tetrahedral centre');
      a.chiral = '@';
      const got = cip(m, i);
      if (got === null) throw new Error('withConfig: atom ' + i + ' cannot be ranked');
      if (got !== cfg[key]) a.chiral = '@@';
    });
    return chem.canonical(m, { stereo: true });
  }

  // ------------------------------------------------------------------
  // Constitutional isomers
  // ------------------------------------------------------------------

  const VALENCE = { C: 4, N: 3, O: 2, S: 2, P: 3, B: 3, F: 1, Cl: 1, Br: 1, I: 1 };

  function parseFormula(f) {
    const counts = {};
    const re = /([A-Z][a-z]?)(\d*)/g;
    let m;
    let used = 0;
    while ((m = re.exec(f)) !== null) {
      used += m[0].length;
      counts[m[1]] = (counts[m[1]] || 0) + (m[2] === '' ? 1 : parseInt(m[2], 10));
    }
    if (used !== f.length || !used) throw new Error('isomers: cannot read the formula "' + f + '"');
    return counts;
  }

  // canonical key of a small labelled multigraph: refine, then try every order inside tied cells
  function graphKey(el, bo) {
    const n = el.length;
    const rank = (keys) => { const u = Array.from(new Set(keys)).sort(); return keys.map((k) => u.indexOf(k)); };
    let cur = rank(el.map((e, v) => e + bo[v].reduce((s, x) => s + x, 0) + ':' + bo[v].filter((x) => x).length));
    let count = new Set(cur).size;
    for (;;) {
      const keys = [];
      for (let v = 0; v < n; v++) {
        const parts = [];
        for (let w = 0; w < n; w++) if (bo[v][w]) parts.push(bo[v][w] + ':' + cur[w]);
        keys.push(cur[v] + '[' + parts.sort().join(',') + ']');
      }
      const next = rank(keys);
      const c = new Set(next).size;
      cur = next;
      if (c === count) break;
      count = c;
    }
    const cells = [];
    for (let k = 0; k < count; k++) cells.push([]);
    for (let v = 0; v < n; v++) cells[cur[v]].push(v);
    let best = null;
    const order = [];
    function perms(ci) {
      if (ci === cells.length) {
        let s = '';
        for (let x = 0; x < n; x++) s += el[order[x]] + ',';
        for (let x = 0; x < n; x++) for (let y = x + 1; y < n; y++) s += bo[order[x]][order[y]];
        if (best === null || s < best) best = s;
        return;
      }
      const cell = cells[ci];
      const used = new Array(cell.length).fill(false);
      (function pick(d) {
        if (d === cell.length) { perms(ci + 1); return; }
        for (let k = 0; k < cell.length; k++) {
          if (used[k]) continue;
          used[k] = true;
          order.push(cell[k]);
          pick(d + 1);
          order.pop();
          used[k] = false;
        }
      })(0);
    }
    perms(0);
    return best;
  }

  function graphSmiles(el, bo) {
    const n = el.length;
    const pre = new Array(n).fill(-1);
    const parent = new Array(n).fill(-1);
    const kids = [];
    for (let v = 0; v < n; v++) kids.push([]);
    const closures = [];
    let counter = 0;
    (function dfs(v) {
      pre[v] = counter++;
      for (let w = 0; w < n; w++) {
        if (!bo[v][w] || w === parent[v]) continue;
        if (pre[w] < 0) { parent[w] = v; kids[v].push(w); dfs(w); } else if (pre[w] < pre[v]) closures.push({ open: w, close: v, order: bo[v][w] });
      }
    })(0);
    const at = {};
    closures.forEach((c, k) => {
      const d = k + 1;
      (at[c.open] = at[c.open] || []).push({ d, sym: c.order === 2 ? '=' : c.order === 3 ? '#' : '' });
      (at[c.close] = at[c.close] || []).push({ d, sym: '' });
    });
    function emit(v) {
      let s = el[v];
      (at[v] || []).forEach((c) => { s += c.sym + c.d; });
      const ks = kids[v];
      ks.forEach((w, k) => {
        const sym = bo[v][w] === 2 ? '=' : bo[v][w] === 3 ? '#' : '';
        const piece = sym + emit(w);
        s += k < ks.length - 1 ? '(' + piece + ')' : piece;
      });
      return s;
    }
    return emit(0);
  }

  function isomers(formula, opts) {
    opts = opts || {};
    const filter = opts.filter || 'any';
    const rings = !!opts.rings;
    const counts = parseFormula(formula);
    const hTotal = counts.H || 0;
    const els = [];
    Object.keys(counts).sort().forEach((e) => {
      if (e === 'H') return;
      if (!VALENCE[e]) throw new Error('isomers: element ' + e + ' is not supported');
      for (let k = 0; k < counts[e]; k++) els.push(e);
    });
    const n = els.length;
    if (n === 0 || n > 8) throw new Error('isomers: 1 to 8 heavy atoms supported');
    const valSum = els.reduce((s, e) => s + VALENCE[e], 0);
    const bondTotal = (valSum - hTotal) / 2;
    if (!Number.isInteger(bondTotal) || bondTotal < n - 1 || hTotal < 0) return [];
    const kinds = Object.keys(counts).filter((e) => e !== 'H').sort();

    // states: graphs on k atoms; each atom is added with bonds to atoms already there
    let level = new Map();
    kinds.forEach((e) => {
      const el = [e];
      const bo = [[0]];
      level.set(graphKey(el, bo), { el, bo, used: { [e]: 1 }, bonds: 0 });
    });
    for (let k = 1; k < n; k++) {
      const next = new Map();
      level.forEach((st) => {
        kinds.forEach((e) => {
          if ((st.used[e] || 0) >= counts[e]) return;
          const left = n - (k + 1); // atoms still to come after this one, each needs a bond
          const room = bondTotal - st.bonds - left; // bond orders this atom may bring
          if (room < 1) return;
          const last = left === 0;
          const free = st.el.map((x, v) => VALENCE[x] - st.bo[v].reduce((s, y) => s + y, 0));
          const sel = [];
          const emit = (tot) => {
            if (last && tot !== room) return;
            const el = st.el.concat([e]);
            const bo = st.bo.map((row) => row.concat([0]));
            bo.push(new Array(k + 1).fill(0));
            sel.forEach(([v, o]) => { bo[v][k] = o; bo[k][v] = o; });
            const key = graphKey(el, bo);
            if (!next.has(key)) next.set(key, { el, bo, used: Object.assign({}, st.used, { [e]: (st.used[e] || 0) + 1 }), bonds: st.bonds + tot });
          };
          if (!rings) {
            for (let v = 0; v < k; v++) {
              for (let o = 1; o <= 3; o++) {
                if (o > free[v] || o > VALENCE[e] || o > room) break;
                sel.push([v, o]);
                emit(o);
                sel.pop();
              }
            }
          } else {
            (function rec(v, tot) {
              if (v === k) { if (tot >= 1) emit(tot); return; }
              rec(v + 1, tot);
              for (let o = 1; o <= 3; o++) {
                if (o > free[v] || tot + o > VALENCE[e] || tot + o > room) break;
                sel.push([v, o]);
                rec(v + 1, tot + o);
                sel.pop();
              }
            })(0, 0);
          }
        });
      });
      level = next;
    }

    const out = new Map();
    level.forEach((st) => {
      if (st.bonds !== bondTotal) return;
      const mol = chem.parse(graphSmiles(st.el, st.bo));
      if (mol.atoms.some((a) => a.h < 0)) return;
      const key = chem.canonical(mol);
      if (out.has(key)) return;
      if (filter !== 'any' && !chem.groups(mol).some((g) => g.type === filter)) return;
      out.set(key, true);
    });
    return Array.from(out.keys()).sort();
  }

  ORG.stereo = { stereocentres, cip, ez, cisTrans, stereoBonds, stereoisomers, isMeso, isChiral, isomers, withConfig };
})(globalThis.ORG = globalThis.ORG || {});
