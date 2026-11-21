(function (ORG) {
  'use strict';

  // Reaction rules of the organic trainer. Every rule is a graph edit on molecules
  // parsed by ORG.chem; products are returned as canonical SMILES without stereo.
  //
  //   ORG.react.run(ruleId, [smiles...], opts) -> { products: [{smi, major, by?}], none?, note? }
  //
  // Conventions (see RULES[id].by for what each rule lists as by-products):
  //  - major: true marks the product(s) the course teaches as the result. Several
  //    products carry major: true when the course lists them as a mixture of
  //    comparable amounts (e.g. the o- and p-isomers, 1,2- and 1,4-addition).
  //  - by: true marks a by-product that the course treats as an observable result
  //    (N2, H2, silver mirror, NH4Cl ...). Such products have major: false, unless
  //    they are the only product.
  //  - none: true means the course says there is no reaction (or no useful one).
  //  - Salts are written with their counter ion in the same SMILES ("[O-]...[Na+]").
  //  - Other inorganic by-products (HX, H2O, NaX, SO2 ...) are left out.

  const chem = ORG.chem;
  if (!chem) throw new Error('react.js needs chem.js');

  const T = (lt, en) => ({ lt, en });
  const HAL = { F: 1, Cl: 1, Br: 1, I: 1 };

  // ------------------------------------------------------------------
  // Graph: a mutable molecule with Kekule bond orders and explicit H counts
  // ------------------------------------------------------------------

  class Graph {
    constructor() { this.A = []; this.N = []; this.B = {}; }

    static from(smi) {
      const m = chem.parse(smi);
      const g = new Graph();
      m.atoms.forEach((a) => g.add(a.el, a.charge, a.h, a.aromatic));
      m.bonds.forEach((b) => g.bond(b.a, b.b, b.kek));
      return g;
    }

    add(el, charge, h, ar) {
      this.A.push({ el, charge: charge || 0, h: h || 0, ar: !!ar });
      this.N.push([]);
      return this.A.length - 1;
    }

    static key(a, b) { return a < b ? a + '_' + b : b + '_' + a; }

    bond(a, b, o) {
      const k = Graph.key(a, b);
      if (!(k in this.B)) { this.N[a].push(b); this.N[b].push(a); }
      this.B[k] = o || 1;
    }

    unbond(a, b) {
      const k = Graph.key(a, b);
      if (!(k in this.B)) return;
      delete this.B[k];
      this.N[a] = this.N[a].filter((x) => x !== b);
      this.N[b] = this.N[b].filter((x) => x !== a);
    }

    ord(a, b) { return this.B[Graph.key(a, b)] || 0; }
    nbr(i) { return this.N[i]; }
    el(i) { return this.A[i].el; }
    n() { return this.A.length; }

    // carbon: make the H count fill the valence to four
    fillC(i) {
      const a = this.A[i];
      let s = 0;
      this.N[i].forEach((j) => { s += this.ord(i, j); });
      a.h = Math.max(0, 4 - s - Math.abs(a.charge));
    }

    clone() {
      const g = new Graph();
      g.A = this.A.map((a) => Object.assign({}, a));
      g.N = this.N.map((l) => l.slice());
      g.B = Object.assign({}, this.B);
      return g;
    }

    // append another graph; returns the index offset of its atoms
    merge(o) {
      const off = this.A.length;
      o.A.forEach((a) => { this.A.push(Object.assign({}, a)); this.N.push([]); });
      Object.keys(o.B).forEach((k) => {
        const p = k.split('_');
        this.bond(+p[0] + off, +p[1] + off, o.B[k]);
      });
      return off;
    }

    // a new graph without the listed atoms (indices are renumbered)
    without(list) {
      const drop = {};
      list.forEach((i) => { drop[i] = true; });
      const map = {};
      const g = new Graph();
      this.A.forEach((a, i) => { if (!drop[i]) map[i] = g.add(a.el, a.charge, a.h, a.ar); });
      Object.keys(this.B).forEach((k) => {
        const p = k.split('_').map(Number);
        if (!drop[p[0]] && !drop[p[1]]) g.bond(map[p[0]], map[p[1]], this.B[k]);
      });
      g.map = map;
      return g;
    }

    // connected components as separate graphs
    split() {
      const seen = {};
      const out = [];
      for (let s = 0; s < this.A.length; s++) {
        if (seen[s]) continue;
        const comp = [];
        const q = [s];
        seen[s] = true;
        while (q.length) {
          const v = q.pop();
          comp.push(v);
          this.N[v].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
        }
        const keep = {};
        comp.forEach((i) => { keep[i] = true; });
        const drop = [];
        for (let i = 0; i < this.A.length; i++) if (!keep[i]) drop.push(i);
        out.push(drop.length ? this.without(drop) : this.clone());
      }
      return out;
    }

    // shortest path of atoms from a to b (inclusive), or null
    path(a, b) {
      const prev = {};
      prev[a] = -1;
      const q = [a];
      for (let h = 0; h < q.length; h++) {
        const v = q[h];
        if (v === b) break;
        this.N[v].forEach((w) => { if (!(w in prev)) { prev[w] = v; q.push(w); } });
      }
      if (!(b in prev)) return null;
      const out = [];
      for (let v = b; v !== -1; v = prev[v]) out.push(v);
      return out.reverse();
    }

    smiles() {
      const n = this.A.length;
      const idx = new Array(n).fill(-1);
      let counter = 0;
      let digit = 0;
      const parts = [];
      const atomText = (i) => {
        const a = this.A[i];
        let s = '[' + a.el;
        if (a.h) s += 'H' + (a.h > 1 ? a.h : '');
        if (a.charge) s += (a.charge > 0 ? '+' : '-') + (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : '');
        return s + ']';
      };
      const sym = (o) => (o === 2 ? '=' : o === 3 ? '#' : '');
      for (let root = 0; root < n; root++) {
        if (idx[root] >= 0) continue;
        const parent = {};
        const kids = {};
        const open = {};
        const close = {};
        const dfs = (v, p) => {
          idx[v] = counter++;
          parent[v] = p;
          kids[v] = [];
          this.N[v].slice().sort((x, y) => x - y).forEach((w) => {
            if (w === p) return;
            if (idx[w] < 0) { kids[v].push(w); dfs(w, v); } else if (idx[w] < idx[v]) {
              digit++;
              (open[w] = open[w] || []).push({ d: digit, o: this.ord(v, w) });
              (close[v] = close[v] || []).push(digit);
            }
          });
        };
        dfs(root, -1);
        const emit = (v) => {
          let s = atomText(v);
          (open[v] || []).forEach((r) => { s += sym(r.o) + (r.d < 10 ? r.d : '%' + r.d); });
          (close[v] || []).forEach((d) => { s += d < 10 ? d : '%' + d; });
          const ks = kids[v];
          ks.forEach((w, k) => {
            const piece = sym(this.ord(v, w)) + emit(w);
            s += k < ks.length - 1 ? '(' + piece + ')' : piece;
          });
          return s;
        };
        parts.push(emit(root));
      }
      return parts.join('.');
    }
  }

  const canon = (smi) => chem.canonical(chem.parse(smi));

  // ------------------------------------------------------------------
  // Result collection
  // ------------------------------------------------------------------

  class Out {
    constructor() { this.list = []; this.at = {}; this.noteT = null; }

    // g: Graph (one or more components are kept in one SMILES); flags: {major, by}
    add(g, major, by) {
      const smi = canon(g.smiles());
      const hit = this.at[smi];
      if (hit) {
        if (major) hit.major = true;
        if (!by) hit.by = false;
        return this;
      }
      const p = { smi, major: !!major, by: !!by };
      this.at[smi] = p;
      this.list.push(p);
      return this;
    }

    // every component of g as its own product
    addSplit(g, major, by) {
      g.split().forEach((c) => this.add(c, major, by));
      return this;
    }

    note(t) { this.noteT = t; return this; }

    result() {
      if (!this.list.some((p) => p.major) && this.list.length) this.list.forEach((p) => { p.major = true; p.by = false; });
      const products = this.list.map((p) => {
        const o = { smi: p.smi, major: p.major };
        if (p.by) o.by = true;
        return o;
      });
      const r = { products };
      if (this.noteT) r.note = this.noteT;
      return r;
    }
  }

  function none(note) {
    const r = { products: [], none: true };
    if (note) r.note = note;
    return r;
  }

  // ------------------------------------------------------------------
  // Structure queries
  // ------------------------------------------------------------------

  const isC = (g, i) => g.A[i].el === 'C';
  const ar = (g, i) => g.A[i].ar;

  function sp3C(g, i) {
    if (!isC(g, i) || ar(g, i)) return false;
    return g.nbr(i).every((j) => g.ord(i, j) === 1);
  }

  function dbl(g, i, el) {
    for (const j of g.nbr(i)) if (g.ord(i, j) === 2 && g.el(j) === el) return j;
    return -1;
  }

  function cNbrs(g, i) { return g.nbr(i).filter((j) => isC(g, j)); }

  function findAlkenes(g) {
    const out = [];
    Object.keys(g.B).forEach((k) => {
      const p = k.split('_').map(Number);
      if (g.B[k] === 2 && isC(g, p[0]) && isC(g, p[1]) && !(ar(g, p[0]) && ar(g, p[1]))) out.push(p);
    });
    return out;
  }

  function findAlkynes(g) {
    const out = [];
    Object.keys(g.B).forEach((k) => {
      const p = k.split('_').map(Number);
      if (g.B[k] === 3 && isC(g, p[0]) && isC(g, p[1])) out.push(p);
    });
    return out;
  }

  // alcohol OH on an sp3 carbon (not a carbonyl, not a phenol)
  function findAlcohols(g) {
    const out = [];
    g.A.forEach((a, o) => {
      if (a.el !== 'O' || a.charge !== 0 || a.h !== 1 || g.nbr(o).length !== 1) return;
      const c = g.nbr(o)[0];
      if (sp3C(g, c)) out.push({ c, o });
    });
    return out;
  }

  function findPhenols(g) {
    const out = [];
    g.A.forEach((a, o) => {
      if (a.el !== 'O' || a.charge !== 0 || a.h !== 1 || g.nbr(o).length !== 1) return;
      const c = g.nbr(o)[0];
      if (isC(g, c) && ar(g, c)) out.push({ c, o });
    });
    return out;
  }

  function findThiols(g) {
    const out = [];
    g.A.forEach((a, s) => {
      if (a.el !== 'S' || a.charge !== 0 || a.h !== 1 || g.nbr(s).length !== 1) return;
      const c = g.nbr(s)[0];
      if (isC(g, c) && dbl(g, c, 'O') < 0) out.push({ c, s });
    });
    return out;
  }

  // alkyl halide: Cl, Br or I on an sp3 carbon
  function findHalides(g) {
    const out = [];
    g.A.forEach((a, x) => {
      if ((a.el !== 'Cl' && a.el !== 'Br' && a.el !== 'I') || g.nbr(x).length !== 1) return;
      const c = g.nbr(x)[0];
      if (sp3C(g, c)) out.push({ c, x });
    });
    return out;
  }

  // classify a carbonyl carbon
  function carbonyl(g, c) {
    if (!isC(g, c) || ar(g, c)) return null;
    const o = dbl(g, c, 'O');
    if (o < 0) return null;
    const others = g.nbr(c).filter((j) => j !== o);
    const hetero = others.filter((j) => g.el(j) !== 'C');
    const carbons = others.filter((j) => g.el(j) === 'C');
    const r = { c, o, type: null, x: -1, y: -1, r: carbons.length ? carbons[0] : -1 };
    if (hetero.length === 0) {
      if (carbons.length === 2 && g.A[c].h === 0) r.type = 'ketone';
      else if (carbons.length + g.A[c].h === 2 && g.A[c].h >= 1) r.type = 'aldehyde';
      return r.type ? r : null;
    }
    if (hetero.length !== 1 || carbons.length + g.A[c].h !== 1) return null;
    const x = hetero[0];
    if (g.ord(c, x) !== 1) return null;
    r.x = x;
    const ex = g.el(x);
    if (ex === 'O') {
      const rest = g.nbr(x).filter((j) => j !== c);
      if (g.A[x].h === 1 && rest.length === 0) r.type = 'acid';
      else if (g.A[x].charge === -1 && rest.length === 0) r.type = 'carboxylate';
      else if (rest.length === 1 && g.el(rest[0]) === 'C') {
        r.y = rest[0];
        r.type = dbl(g, rest[0], 'O') >= 0 ? 'anhydride' : 'ester';
      }
    } else if (HAL[ex]) r.type = 'acylhalide';
    else if (ex === 'N') r.type = 'amide';
    return r.type ? r : null;
  }

  function carbonyls(g, types) {
    const out = [];
    for (let c = 0; c < g.n(); c++) {
      const k = carbonyl(g, c);
      if (k && (!types || types.indexOf(k.type) >= 0)) out.push(k);
    }
    return out;
  }

  // is c allylic or benzylic (next to an aromatic atom or a C=C)?
  function isConj(g, c) {
    for (const w of g.nbr(c)) {
      if (!isC(g, w) || g.ord(c, w) !== 1) continue;
      if (ar(g, w)) return true;
      for (const u of g.nbr(w)) if (u !== c && isC(g, u) && g.ord(w, u) >= 2) return true;
    }
    return false;
  }

  // carbon substituent that withdraws electrons (carbonyl, nitrile, CX3, nitro)
  function ewgAt(g, c, except) {
    for (const w of g.nbr(c)) {
      if (w === except) continue;
      if (isC(g, w)) {
        if (dbl(g, w, 'O') >= 0 || g.nbr(w).some((u) => g.el(u) === 'N' && g.ord(w, u) === 3)) return true;
        if (g.nbr(w).filter((u) => HAL[g.el(u)]).length >= 3) return true;
      } else if (g.el(w) === 'N' && g.A[w].charge === 1) return true;
    }
    return false;
  }

  // stability class of a radical or cation at c: methyl 0, primary 1, secondary 2, tertiary 3,
  // allylic and benzylic one class higher
  function cls(g, c) {
    return Math.min(cNbrs(g, c).length, 3) + (isConj(g, c) ? 1 : 0);
  }

  // cation at c: as cls, a lone-pair donor on c helps a lot, an electron-withdrawing group on c rules it out
  function cation(g, c, except) {
    let r = cls(g, c);
    if (g.nbr(c).some((w) => (g.el(w) === 'O' || g.el(w) === 'N') && g.A[w].charge === 0 && g.ord(c, w) === 1)) r += 3;
    if (ewgAt(g, c, except)) r -= 10;
    return r;
  }

  // ------------------------------------------------------------------
  // Building blocks
  // ------------------------------------------------------------------

  // attach the group written as HG (a molecule whose first atom carries the H that is replaced)
  function graft(g, c, frag) {
    const f = Graph.from(frag);
    const off = g.merge(f);
    const root = off;
    if (g.A[root].h > 0) g.A[root].h -= 1;
    g.bond(c, root, 1);
    return root;
  }

  const FRAG = {
    Cl: 'Cl', Br: 'Br', I: 'I', F: 'F', OH: 'O', SH: 'S', NH2: 'N', CN: 'C#N', NO2: '[N+](=O)[O-]', SO3H: 'S(=O)(=O)O',
    CH3: 'C', 'C(C)(C)C': 'C(C)(C)C', 'C(C)=O': 'C(C)=O', OC: 'OC', OCC: 'OCC', SC: 'SC', 'C#CC': 'C#CC',
  };

  function ion(g, el, charge) { return g.add(el, charge, 0); }

  // ------------------------------------------------------------------
  // Registry
  // ------------------------------------------------------------------

  const RULES = {};
  const IMPL = {};

  function def(id, lt, en, mech, by, fn) {
    RULES[id] = { title: T(lt, en) };
    if (mech) RULES[id].mech = mech;
    if (by) RULES[id].by = by;
    IMPL[id] = fn;
  }

  // inorganic spectator ions that may travel with a reactant ("[Na+]", "[Cl-]") are dropped
  const SPECTATOR = { Na: 1, K: 1, Li: 1, Cl: 1, Br: 1, I: 1, F: 1, Ag: 1, Cu: 1, Hg: 1 };
  function reactant(smi) {
    const g = Graph.from(smi);
    const parts = g.split().filter((p) => !(p.n() === 1 && SPECTATOR[p.A[0].el] && p.A[0].charge !== 0));
    if (parts.length !== 1) throw new Error('react: each reactant must be one molecule: ' + smi);
    return parts[0];
  }

  function run(rule, reactants, opts) {
    const fn = IMPL[rule];
    if (!fn) throw new Error('react: unknown rule ' + rule);
    const rs = (reactants || []).map(reactant);
    return fn(rs, opts || {}, reactants);
  }

  function need(rs, n, rule) {
    if (rs.length < n) throw new Error('react: ' + rule + ' needs ' + n + ' reactant(s)');
  }

  // ------------------------------------------------------------------
  // Hydrocarbons: SR, AE, oxidation, dienes, alkynes, SEAr, side chains
  // ------------------------------------------------------------------

  const NOTE_NO_ALKENE = T('Molekulėje nėra C=C ryšio.', 'The molecule has no C=C bond.');

  def('sr.halogenate', 'Alkanų radikalinis halogeninimas', 'Free-radical halogenation of alkanes', 'SR', null, (rs, o) => {
    const X = o.X;
    if (X !== 'Cl' && X !== 'Br') throw new Error('react: sr.halogenate needs X = Cl or Br');
    const g = rs[0];
    const sites = [];
    for (let c = 0; c < g.n(); c++) if (sp3C(g, c) && g.A[c].h > 0) sites.push(c);
    if (!sites.length) return none(T('Nėra sp3 C–H ryšio.', 'There is no sp3 C-H bond.'));
    const best = Math.max.apply(null, sites.map((c) => cls(g, c)));
    const out = new Out();
    sites.forEach((c) => {
      const ng = g.clone();
      ng.A[c].h -= 1;
      ng.bond(c, ng.add(X, 0, 0), 1);
      // Cl: little selectivity, a mixture of all monochloro isomers; Br: the most substituted (or allylic/benzylic) C-H
      out.add(ng, X === 'Cl' || cls(g, c) === best);
    });
    return out.note(X === 'Cl'
      ? T('Chloras mažai selektyvus: gaunamas visų monochlorinių izomerų mišinys.', 'Chlorine is hardly selective: a mixture of all monochloro isomers forms.')
      : T('Bromas selektyvus: vyrauja produktas, susidaręs iš stabiliausio radikalo (3° > 2° > 1°).', 'Bromine is selective: the product from the most stable radical (3° > 2° > 1°) predominates.')).result();
  });

  // conjugated C=C-C=C systems as [a,b,c,d] (a=b-c=d)
  function conjQuads(g) {
    const seen = {};
    const out = [];
    findAlkenes(g).forEach((p) => {
      [[p[0], p[1]], [p[1], p[0]]].forEach((e) => {
        const a = e[0];
        const b = e[1];
        g.nbr(b).forEach((c) => {
          if (c === a || g.ord(b, c) !== 1 || !isC(g, c) || ar(g, c)) return;
          g.nbr(c).forEach((d) => {
            if (d === b || d === a || g.ord(c, d) !== 2 || !isC(g, d)) return;
            const key = a < d ? [a, b, c, d].join() : [d, c, b, a].join();
            if (!seen[key]) { seen[key] = true; out.push([a, b, c, d]); }
          });
        });
      });
    });
    return out;
  }

  // H-X (or X-X) to a conjugated diene: 1,2- and 1,4-addition
  function dieneAdd(g, kind, X) {
    const quads = conjQuads(g);
    if (quads.length > 1) throw new Error('react: more than one conjugated diene in a molecule is not supported');
    const [a, b, c, d] = quads[0];
    const out = new Out();
    const note = T('Konjuguotasis dienas jungia 1,2 ir 1,4: abu produktai susidaro.', 'A conjugated diene adds 1,2 and 1,4: both products form.');
    if (kind === 'x2') {
      const mk = (set) => {
        const ng = g.clone();
        set(ng);
        return ng;
      };
      const addX = (ng, i) => ng.bond(i, ng.add(X, 0, 0), 1);
      out.add(mk((ng) => { ng.bond(a, b, 1); addX(ng, a); addX(ng, b); }), true);
      out.add(mk((ng) => { ng.bond(c, d, 1); addX(ng, c); addX(ng, d); }), true);
      out.add(mk((ng) => { ng.bond(a, b, 1); ng.bond(b, c, 2); ng.bond(c, d, 1); addX(ng, a); addX(ng, d); }), true);
      return out.note(note).result();
    }
    // protonation at a or at d, whichever gives the better allylic cation
    const f1a = g.clone(); f1a.bond(a, b, 1); f1a.A[a].h += 1;
    const f2a = g.clone(); f2a.bond(a, b, 1); f2a.bond(b, c, 2); f2a.bond(c, d, 1); f2a.A[a].h += 1;
    const f1d = g.clone(); f1d.bond(c, d, 1); f1d.A[d].h += 1;
    const f2d = g.clone(); f2d.bond(c, d, 1); f2d.bond(b, c, 2); f2d.bond(a, b, 1); f2d.A[d].h += 1;
    const sa = cation(f1a, b) + cation(f2a, d);
    const sd = cation(f1d, c) + cation(f2d, a);
    const addX = (ng, i) => ng.bond(i, ng.add(X, 0, 0), 1);
    const p12a = f1a.clone(); addX(p12a, b);
    const p14a = f2a.clone(); addX(p14a, d);
    const p12d = f1d.clone(); addX(p12d, c);
    const p14d = f2d.clone(); addX(p14d, a);
    out.add(p12a, sa >= sd).add(p14a, sa >= sd).add(p12d, sd >= sa).add(p14d, sd >= sa);
    return out.note(note).result();
  }

  function attachGroup(ng, i, grp) {
    if (grp === 'OH') { const x = ng.add('O', 0, 1); ng.bond(i, x, 1); } else { ng.bond(i, ng.add(grp, 0, 0), 1); }
  }

  // Markovnikov addition of H-G to every C=C (anti-Markovnikov next to an electron-withdrawing group or with peroxides)
  function addHG(g, grp, peroxide) {
    const alk = findAlkenes(g);
    if (!alk.length) return none(NOTE_NO_ALKENE);
    const out = new Out();
    alk.forEach((p) => {
      const a = p[0];
      const b = p[1];
      const sa = cation(g, a, b);
      const sb = cation(g, b, a);
      [[a, b, sa, sb], [b, a, sb, sa]].forEach((e) => {
        const x = e[0];
        const y = e[1];
        const ng = g.clone();
        ng.bond(x, y, 1);
        ng.A[y].h += 1;
        attachGroup(ng, x, grp);
        out.add(ng, peroxide ? e[2] <= e[3] : e[2] >= e[3]);
      });
    });
    return out.note(peroxide
      ? T('Su peroksidais HBr jungiasi radikaliniu mechanizmu prieš Markovnikovo taisyklę.', 'With peroxides HBr adds by a radical mechanism, against Markovnikov\'s rule.')
      : T('Markovnikovo taisyklė: H jungiasi prie C su daugiau H; krypties neapibrėžia vien C=C ryšys, jei jis konjuguotas su elektronakceptoriniu pakaitu.', 'Markovnikov\'s rule: H goes to the carbon with more H (the more stable cation forms).')).result();
  }

  def('ae.hx', 'Vandenilio halogenido jungimasis prie alkeno', 'Addition of HX to an alkene', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: ae.hx needs X');
    const g = rs[0];
    if (conjQuads(g).length) return dieneAdd(g, 'hx', X);
    return addHG(g, X, !!o.peroxide && X === 'Br');
  });

  def('ae.h2o', 'Alkenų hidratacija (H3O+)', 'Hydration of alkenes (H3O+)', 'AE', null, (rs) => addHG(rs[0], 'OH', false));

  def('ae.x2', 'Halogeno jungimasis prie alkeno', 'Addition of a halogen to an alkene', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: ae.x2 needs X');
    const g = rs[0];
    if (conjQuads(g).length) return dieneAdd(g, 'x2', X);
    const alk = findAlkenes(g);
    if (!alk.length) return none(NOTE_NO_ALKENE);
    const out = new Out();
    alk.forEach((p) => {
      const ng = g.clone();
      ng.bond(p[0], p[1], 1);
      attachGroup(ng, p[0], X);
      attachGroup(ng, p[1], X);
      out.add(ng, true);
    });
    return out.note(T('Susidaro vicinalinis dihalogenidas; spalvotas bromo tirpalas išblunka (C=C atpažinimas).', 'A vicinal dihalide forms; the coloured bromine solution fades (test for C=C).')).result();
  });

  def('ae.h2', 'Alkenų ir alkinų hidrinimas (H2/Pd)', 'Hydrogenation of alkenes and alkynes (H2/Pd)', null, null, (rs) => {
    const g = rs[0].clone();
    const bonds = findAlkenes(g).concat(findAlkynes(g));
    if (!bonds.length) return none(NOTE_NO_ALKENE);
    bonds.forEach((p) => { g.bond(p[0], p[1], 1); });
    bonds.forEach((p) => { g.fillC(p[0]); g.fillC(p[1]); });
    return new Out().add(g, true).note(T('H2/Pd sotina C=C ir C≡C; benzeno žiedas, C=O ir kitos grupės nekinta.', 'H2/Pd saturates C=C and C≡C; the benzene ring, C=O and other groups stay.')).result();
  });

  def('ox.kmno4.mild', 'Alkeno oksidacija KMnO4 švelniomis sąlygomis (1,2-diolis)', 'Alkene oxidation with KMnO4, mild conditions (1,2-diol)', null, null, (rs) => {
    const g = rs[0].clone();
    const alk = findAlkenes(g);
    if (!alk.length) return none(NOTE_NO_ALKENE);
    alk.forEach((p) => {
      g.bond(p[0], p[1], 1);
      attachGroup(g, p[0], 'OH');
      attachGroup(g, p[1], 'OH');
    });
    return new Out().add(g, true).note(T('Šalta, šarminė ar neutrali terpė: violetinė spalva išnyksta, iškrenta rudos MnO2 nuosėdos.', 'Cold alkaline or neutral medium: the violet colour disappears and brown MnO2 precipitates.')).result();
  });

  def('ox.kmno4.harsh', 'Alkeno oksidacinis skilimas (KMnO4, rūgštinė terpė, t)', 'Oxidative cleavage of an alkene (KMnO4, acid, heat)', null,
    'CO2 (terminal =CH2 or ≡CH), listed with by: true', (rs) => {
      const g = rs[0].clone();
      const cuts = findAlkenes(g).concat(findAlkynes(g));
      if (!cuts.length) return none(NOTE_NO_ALKENE);
      const ends = {};
      cuts.forEach((p) => { g.unbond(p[0], p[1]); ends[p[0]] = true; ends[p[1]] = true; });
      Object.keys(ends).map(Number).forEach((e) => {
        const k = g.nbr(e).length;
        g.A[e].h = 0;
        const o1 = g.add('O', 0, 0);
        g.bond(e, o1, 2);
        if (k === 1) attachGroup(g, e, 'OH');
        else if (k === 0) g.bond(e, g.add('O', 0, 0), 2);
      });
      const out = new Out();
      g.split().forEach((c) => {
        const co2 = c.n() === 3 && c.A.filter((a) => a.el === 'O').length === 2;
        out.add(c, !co2, co2);
      });
      return out.note(T('Skyla C=C: =CH–R virsta rūgštimi, =CR2 – ketonu, =CH2 – CO2.', 'The C=C is cleaved: =CH-R gives an acid, =CR2 a ketone, =CH2 gives CO2.')).result();
    });

  def('diene.hx', 'HX jungimasis prie konjuguotojo diena (1,2 ir 1,4)', 'HX addition to a conjugated diene (1,2 and 1,4)', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: diene.hx needs X');
    if (!conjQuads(rs[0]).length) return none(T('Molekulėje nėra konjuguotojo diena.', 'The molecule has no conjugated diene.'));
    return dieneAdd(rs[0], 'hx', X);
  });

  // alkynes
  const NOTE_NO_ALKYNE = T('Molekulėje nėra C≡C ryšio.', 'The molecule has no C≡C bond.');

  def('yne.h2', 'Alkinų hidrinimas', 'Hydrogenation of alkynes', null, null, (rs, o) => {
    const g0 = rs[0];
    const yn = findAlkynes(g0);
    if (!yn.length) return none(NOTE_NO_ALKYNE);
    const eq = o.eq === 1 ? 1 : 2;
    const g = g0.clone();
    const half = eq === 1 && !!o.lindlar;
    yn.forEach((p) => { g.bond(p[0], p[1], half ? 2 : 1); });
    yn.forEach((p) => { g.fillC(p[0]); g.fillC(p[1]); });
    const out = new Out().add(g, true);
    if (eq === 1 && !half) out.note(T('Su paprastu Pd hidrinimas nesustoja ties alkenu: gaunamas alkanas. Alkenui reikia Lindlaro katalizatoriaus.', 'Over plain Pd hydrogenation does not stop at the alkene: the alkane forms. An alkene needs Lindlar\'s catalyst.'));
    if (half) out.note(T('Lindlaro katalizatorius sustabdo ties alkenu (cis).', 'Lindlar\'s catalyst stops at the alkene (cis).'));
    return out.result();
  });

  def('yne.x2', 'Halogeno jungimasis prie alkino', 'Addition of a halogen to an alkyne', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: yne.x2 needs X');
    const yn = findAlkynes(rs[0]);
    if (!yn.length) return none(NOTE_NO_ALKYNE);
    const eq = o.eq === 1 ? 1 : 2;
    const g = rs[0].clone();
    yn.forEach((p) => {
      g.bond(p[0], p[1], eq === 1 ? 2 : 1);
      attachGroup(g, p[0], X);
      attachGroup(g, p[1], X);
      if (eq === 2) { attachGroup(g, p[0], X); attachGroup(g, p[1], X); }
    });
    return new Out().add(g, true).result();
  });

  def('yne.hx', 'HX jungimasis prie alkino', 'Addition of HX to an alkyne', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: yne.hx needs X');
    const g = rs[0];
    const yn = findAlkynes(g);
    if (!yn.length) return none(NOTE_NO_ALKYNE);
    const eq = o.eq === 1 ? 1 : 2;
    const out = new Out();
    yn.forEach((p) => {
      const sa = cation(g, p[0], p[1]);
      const sb = cation(g, p[1], p[0]);
      [[p[0], p[1], sa, sb], [p[1], p[0], sb, sa]].forEach((e) => {
        const ng = g.clone();
        const x = e[0];
        const y = e[1];
        ng.bond(x, y, eq === 1 ? 2 : 1);
        ng.A[y].h += eq === 1 ? 1 : 2;
        attachGroup(ng, x, X);
        if (eq === 2) attachGroup(ng, x, X);
        out.add(ng, e[2] >= e[3]);
      });
    });
    return out.note(T('Markovnikovo taisyklė; antrasis HX jungiasi prie to paties C (geminalinis dihalogenidas).', 'Markovnikov\'s rule; the second HX adds to the same carbon (geminal dihalide).')).result();
  });

  def('yne.hydration', 'Alkinų hidratacija (H2O, H2SO4, HgSO4)', 'Hydration of alkynes (H2O, H2SO4, HgSO4)', 'AE', null, (rs) => {
    const g = rs[0];
    const yn = findAlkynes(g);
    if (!yn.length) return none(NOTE_NO_ALKYNE);
    const out = new Out();
    yn.forEach((p) => {
      const terminal = g.A[p[0]].h > 0 || g.A[p[1]].h > 0;
      [[p[0], p[1]], [p[1], p[0]]].forEach((e) => {
        const x = e[0]; // becomes C=O
        const y = e[1];
        // terminal alkyne: only the methyl ketone; HC≡CH: the aldehyde
        if (terminal && g.A[x].h > 0 && g.A[y].h === 0) return;
        const ng = g.clone();
        ng.bond(x, y, 1);
        ng.bond(x, ng.add('O', 0, 0), 2);
        ng.fillC(x);
        ng.fillC(y);
        out.add(ng, true);
      });
    });
    return out.note(T('Susidaro nepatvarus enolis, kuris virsta ketonu (etinas – aldehidu).', 'An unstable enol forms and turns into a ketone (ethyne gives the aldehyde).')).result();
  });

  def('yne.cu', 'Terminalinio alkino reakcija su CuCl/NH3 (vario acetilenidas)', 'Terminal alkyne with CuCl/NH3 (copper acetylide)', null, null, (rs) => {
    const g = rs[0].clone();
    let n = 0;
    findAlkynes(g).forEach((p) => {
      p.forEach((c) => {
        if (g.A[c].h > 0) { g.A[c].h = 0; g.bond(c, g.add('Cu', 0, 0), 1); n++; }
      });
    });
    if (!n) return none(T('Reaguoja tik terminalinis alkinas (≡C–H).', 'Only a terminal alkyne (≡C-H) reacts.'));
    return new Out().add(g, true).note(T('Rausvai rudos vario acetilenido nuosėdos: terminalinio alkino atpažinimas.', 'Pink-brown copper acetylide precipitates: the test for a terminal alkyne.')).result();
  });

  // ---- SEAr ----

  function aromRings(g) {
    const found = {};
    const out = [];
    const arAt = (i) => g.A[i].ar;
    for (let s = 0; s < g.n(); s++) {
      if (!arAt(s)) continue;
      const dfs = (path) => {
        const v = path[path.length - 1];
        g.nbr(v).forEach((w) => {
          if (!arAt(w)) return;
          if (w === path[0] && path.length >= 5) {
            const key = path.slice().sort((x, y) => x - y).join();
            if (!found[key]) { found[key] = true; out.push(path.slice()); }
          } else if (path.length < 6 && w > path[0] && path.indexOf(w) < 0) {
            dfs(path.concat([w]));
          }
        });
      };
      dfs([s]);
    }
    return out;
  }

  // directing effect of a ring substituent s (attached to ring atom q)
  function director(g, s, q, strongAcid) {
    const e = g.el(s);
    const a = g.A[s];
    const rest = g.nbr(s).filter((j) => j !== q);
    const carbonylC = (j) => isC(g, j) && (dbl(g, j, 'O') >= 0 || dbl(g, j, 'N') >= 0);
    if (e === 'N') {
      if (a.charge === 1) return { dir: 'm', st: -3 };
      if (rest.some(carbonylC)) return { dir: 'op', st: 2 }; // NHCOR
      return strongAcid ? { dir: 'm', st: -3, amine: true } : { dir: 'op', st: 4, amine: true };
    }
    if (e === 'O') {
      if (a.charge === -1) return { dir: 'op', st: 5 };
      if (a.h === 1) return { dir: 'op', st: 4 };
      if (rest.some(carbonylC)) return { dir: 'op', st: 2 };
      return { dir: 'op', st: 3 };
    }
    if (e === 'S') return dbl(g, s, 'O') >= 0 ? { dir: 'm', st: -3 } : { dir: 'op', st: 2 };
    if (HAL[e]) return { dir: 'op', st: -1 };
    if (e === 'C') {
      if (carbonylC(s) || g.nbr(s).some((j) => g.el(j) === 'N' && g.ord(s, j) === 3)) return { dir: 'm', st: -3 };
      if (g.nbr(s).filter((j) => HAL[g.el(j)]).length >= 3) return { dir: 'm', st: -3 };
      const bulky = sp3C(g, s) && rest.length === 3 && rest.every((j) => isC(g, j));
      return { dir: 'op', st: 1, bulky };
    }
    throw new Error('react: sear does not know the substituent ' + e);
  }

  def('sear', 'Elektrofilinis aromatinis pakeitimas', 'Electrophilic aromatic substitution', 'SEAr', null, (rs, o) => {
    const E = o.E;
    const known = ['Cl', 'Br', 'NO2', 'SO3H', 'CH3', 'C(C)(C)C', 'C(C)=O'];
    if (known.indexOf(E) < 0) throw new Error('react: sear needs E from ' + known.join(' '));
    const g = rs[0];
    const rings = aromRings(g);
    if (!rings.length) return none(T('Molekulėje nėra aromatinio žiedo.', 'The molecule has no aromatic ring.'));
    const fc = E === 'CH3' || E === 'C(C)(C)C' || E === 'C(C)=O';
    const strongAcid = E === 'NO2' || E === 'SO3H';
    const out = new Out();
    const sub = (p, major) => {
      const ng = g.clone();
      ng.A[p].h -= 1;
      graft(ng, p, FRAG[E]);
      out.add(ng, major);
    };
    const fused = rings.some((r, i) => rings.some((s, j) => j > i && r.some((x) => s.indexOf(x) >= 0)));
    if (fused) {
      const at = [];
      g.A.forEach((a, i) => { if (a.ar) at.push(i); });
      const plain = rings.length === 2 && at.length === 10 && at.every((i) => g.nbr(i).every((j) => g.A[j].ar));
      if (!plain) throw new Error('react: sear supports benzene rings and naphthalene only');
      at.forEach((i) => {
        if (g.A[i].h < 1) return;
        const alpha = g.nbr(i).some((j) => g.nbr(j).filter((k) => g.A[k].ar).length === 3);
        sub(i, alpha);
      });
      return out.note(T('Naftalenas pakeičiamas α padėtyje.', 'Naphthalene is substituted in the α position.')).result();
    }
    let blocked = 0;
    let done = 0;
    rings.forEach((ring) => {
      if (ring.length !== 6 || ring.some((i) => g.el(i) !== 'C')) throw new Error('react: sear supports benzene rings only');
      const free = ring.filter((i) => g.A[i].h > 0);
      if (!free.length) return;
      const subs = [];
      ring.forEach((q, iq) => {
        if (g.A[q].h > 0) return;
        const s = g.nbr(q).filter((j) => ring.indexOf(j) < 0)[0];
        if (s === undefined) return;
        subs.push(Object.assign({ iq, q, s }, director(g, s, q, strongAcid)));
      });
      if (fc && subs.some((d) => (d.dir === 'm' && d.st <= -3) || (d.amine && d.dir === 'op'))) { blocked++; return; }
      done++;
      const dist = (i, j) => { const k = Math.abs(i - j); return Math.min(k, 6 - k); };
      const ok = (d, ip) => (d.dir === 'op' ? dist(ip, d.iq) !== 2 : dist(ip, d.iq) === 2);
      const ops = subs.filter((d) => d.dir === 'op');
      const topSt = ops.length ? Math.max.apply(null, ops.map((d) => d.st)) : null;
      const ctl = ops.length ? ops.filter((d) => d.st === topSt) : subs;
      const rest = subs.filter((d) => ctl.indexOf(d) < 0);
      const positions = free.map((p) => ring.indexOf(p));
      let allowed = positions.filter((ip) => ctl.every((d) => ok(d, ip)));
      if (!allowed.length) allowed = positions.filter((ip) => ctl.some((d) => ok(d, ip)));
      const conflicts = (ip) => rest.filter((d) => !ok(d, ip)).length;
      let major = [];
      if (!subs.length) major = positions.slice();
      else {
        const minC = Math.min.apply(null, allowed.map(conflicts));
        major = allowed.filter((ip) => conflicts(ip) === minC);
        const bulkyE = E === 'C(C)(C)C';
        const hindered = (ip) => {
          const nb = [(ip + 1) % 6, (ip + 5) % 6].map((k) => subs.find((d) => d.iq === k)).filter(Boolean);
          return nb.length === 2 || ((bulkyE || nb.some((d) => d.bulky)) && nb.length >= 1);
        };
        const open = major.filter((ip) => !hindered(ip));
        if (open.length) major = open;
      }
      positions.forEach((ip) => sub(ring[ip], major.indexOf(ip) >= 0));
    });
    if (!done) {
      return none(blocked
        ? T('Friedelio ir Krafto reakcija nevyksta, kai žiede yra stiprus elektronakceptorinis pakaitas arba aminogrupė.', 'The Friedel-Crafts reaction does not take place when the ring has a strong electron-withdrawing group or an amino group.')
        : T('Žiede nėra laisvos C–H padėties.', 'The ring has no free C-H position.'));
    }
    return out.note(T('Orientantai: NH2, OH, OR, alkilas ir halogenai nukreipia į o- ir p-, NO2, CN, SO3H, C=O ir NR3+ – į m- padėtį; lemia stipresnis donoras.', 'Directing effects: NH2, OH, OR, alkyl and halogens direct o/p; NO2, CN, SO3H, C=O and NR3+ direct meta; the stronger donor decides.')).result();
  });

  // ---- side chains of arenes ----

  def('side.br', 'Šoninės grandinės bromavimas (Br2, hν)', 'Side-chain bromination (Br2, hv)', 'SR', null, (rs) => {
    const g = rs[0];
    const sites = [];
    for (let c = 0; c < g.n(); c++) {
      if (sp3C(g, c) && g.A[c].h > 0 && g.nbr(c).some((j) => ar(g, j))) sites.push(c);
    }
    if (!sites.length) return none(T('Nėra benzilinio C–H.', 'There is no benzylic C-H.'));
    const best = Math.max.apply(null, sites.map((c) => cNbrs(g, c).length));
    const out = new Out();
    sites.forEach((c) => {
      const ng = g.clone();
      ng.A[c].h -= 1;
      ng.bond(c, ng.add('Br', 0, 0), 1);
      out.add(ng, cNbrs(g, c).length === best);
    });
    return out.note(T('Bromas pakeičia benzilinį vandenilį (stabiliausias radikalas).', 'Bromine replaces a benzylic hydrogen (the most stable radical).')).result();
  });

  def('side.ox', 'Šoninės grandinės oksidacija (KMnO4 arba K2Cr2O7, t)', 'Side-chain oxidation (KMnO4 or K2Cr2O7, heat)', null,
    'the cleaved part of the chain (acid, ketone or CO2), with major: true', (rs) => {
      const g = rs[0].clone();
      let did = 0;
      for (let q = 0; q < g.n(); q++) {
        if (!ar(g, q)) continue;
        g.nbr(q).slice().forEach((s) => {
          if (!sp3C(g, s) || g.A[s].h < 1 || ar(g, s)) return;
          if (g.nbr(s).some((j) => j !== q && !isC(g, j))) return;
          did++;
          g.nbr(s).filter((j) => j !== q).forEach((x) => {
            g.unbond(s, x);
            const k = g.nbr(x).length;
            const hx = g.A[x].h;
            if (k === 0 && hx >= 3) { g.A[x].h = 0; g.bond(x, g.add('O', 0, 0), 2); g.bond(x, g.add('O', 0, 0), 2); }
            else if (k === 1 && hx === 2) { g.A[x].h = 0; g.bond(x, g.add('O', 0, 0), 2); attachGroup(g, x, 'OH'); }
            else if (k === 2 && hx === 1) { g.A[x].h = 0; g.bond(x, g.add('O', 0, 0), 2); }
            else if (k >= 1) { attachGroup(g, x, 'OH'); g.A[x].h = Math.max(0, g.A[x].h - 1); }
          });
          g.A[s].h = 0;
          g.bond(s, g.add('O', 0, 0), 2);
          attachGroup(g, s, 'OH');
        });
      }
      if (!did) return none(T('Reikia benzilinio C–H (pvz., terc-butilas neoksiduojasi).', 'A benzylic C-H is needed (tert-butyl, for example, is not oxidised).'));
      const out = new Out();
      g.split().forEach((c) => {
        const co2 = c.n() === 3 && c.A.filter((a) => a.el === 'O').length === 2;
        out.add(c, !co2, co2);
      });
      return out.note(T('Kiekviena alkilo grandinė su benziliniu H virsta COOH grupe.', 'Every alkyl chain with a benzylic H becomes a COOH group.')).result();
    });

  // ------------------------------------------------------------------
  // Would the carbocation of this substrate rearrange (1,2-H or 1,2-alkyl shift to a more stable cation)?
  // Generators avoid such substrates: the rules here do not rearrange.
  // ------------------------------------------------------------------

  function shiftGains(gc, a) {
    const old = cation(gc, a);
    for (const w of gc.nbr(a)) {
      if (!sp3C(gc, w) || ar(gc, w)) continue;
      const nC = cNbrs(gc, w).length;
      const conj = isConj(gc, w) ? 1 : 0;
      if (gc.A[w].h > 0 && cation(gc, w) > old) return true; // hydride shift
      if (gc.A[w].h === 0 && Math.min(nC - 1, 3) + conj > old) return true; // alkyl shift
    }
    return false;
  }

  function wouldRearrange(smi) {
    const g = reactant(smi);
    let hit = false;
    // alkenes: the cation that H+ makes on the preferred side
    findAlkenes(g).forEach((p) => {
      const sa = cation(g, p[0], p[1]);
      const sb = cation(g, p[1], p[0]);
      [[p[0], p[1], sa, sb], [p[1], p[0], sb, sa]].forEach((e) => {
        if (e[2] < e[3] || e[2] < -5) return;
        const gc = g.clone();
        gc.bond(e[0], e[1], 1);
        gc.A[e[1]].h += 1;
        if (shiftGains(gc, e[0])) hit = true;
      });
    });
    // alcohols and halides: the cation made by the leaving group (secondary, tertiary, neopentyl)
    findAlcohols(g).map((x) => [x.c, x.o]).concat(findHalides(g).map((x) => [x.c, x.x])).forEach((e) => {
      const gl = g.without([e[1]]);
      const c = gl.map[e[0]];
      const r = cation(gl, c);
      if (r >= 2) { if (shiftGains(gl, c)) hit = true; } else if (cNbrs(gl, c).some((w) => sp3C(gl, w) && cNbrs(gl, w).length === 4 && gl.A[w].h === 0)) hit = true;
    });
    return hit;
  }

  //@@RULES

  ORG.react = { run, RULES, wouldRearrange };
})(globalThis.ORG = globalThis.ORG || {});
