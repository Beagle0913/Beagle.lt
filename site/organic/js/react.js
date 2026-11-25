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

    // atoms reachable from i
    reach(i) {
      const seen = {};
      seen[i] = true;
      const q = [i];
      for (let h = 0; h < q.length; h++) this.N[q[h]].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      return seen;
    }

    // [part containing atom i, the rest] as two graphs (the rest may be empty)
    parts(i) {
      const seen = this.reach(i);
      const out = [];
      for (let k = 0; k < this.A.length; k++) if (!seen[k]) out.push(k);
      const inn = [];
      for (let k = 0; k < this.A.length; k++) if (seen[k]) inn.push(k);
      return [this.without(out), out.length ? this.without(inn) : null];
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

    // the mechanism of this result, when it differs from RULES[id].mech
    mech(m) { this.mechV = m; return this; }

    result() {
      if (!this.list.some((p) => p.major) && this.list.length) this.list.forEach((p) => { p.major = true; p.by = false; });
      const products = this.list.map((p) => {
        const o = { smi: p.smi, major: p.major };
        if (p.by) o.by = true;
        return o;
      });
      const r = { products };
      if (this.noteT) r.note = this.noteT;
      if (this.mechV) r.mech = this.mechV;
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
  // 2 = benzylic, 1 = allylic, 0 = neither
  function conjKind(g, c) {
    let kind = 0;
    for (const w of g.nbr(c)) {
      if (!isC(g, w) || g.ord(c, w) !== 1) continue;
      if (ar(g, w)) return 2;
      for (const u of g.nbr(w)) if (u !== c && isC(g, u) && g.ord(w, u) >= 2) kind = 1;
    }
    return kind;
  }
  function isConj(g, c) { return conjKind(g, c) > 0; }

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

  // stability of a radical or cation at c, the course order (L7 p9, L6 p16):
  // benzyl > allyl > tertiary > secondary > primary > methyl. Any conjugated site beats any
  // non-conjugated one, benzylic beats allylic, and within a kind it is the substitution (0..3).
  function cls(g, c, radical) {
    const k = conjKind(g, c);
    return (radical && k ? 10 : k * 10) + Math.min(cNbrs(g, c).length, 3);
  }

  // cation at c: as cls; a lone-pair donor (O, N) on c helps a lot, a halogen a little (it keeps the
  // geminal product of CH2=CHCl + HBr, L8 p9), an electron-withdrawing group on c rules it out
  function cation(g, c, except) {
    let r = cls(g, c);
    if (g.nbr(c).some((w) => (g.el(w) === 'O' || g.el(w) === 'N') && g.A[w].charge === 0 && g.ord(c, w) === 1)) r += 50;
    else if (g.nbr(c).some((w) => HAL[g.el(w)] && g.ord(c, w) === 1)) r += 1.5;
    if (ewgAt(g, c, except)) r -= 100;
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
    const res = fn(rs, opts || {}, reactants);
    // every result carries its mechanism: the per-result value where a rule computes one, else the rule's default.
    // Rules with no mechanism symbol in the course (RULES[id].mech absent) carry none: ae.h2, ox.kmno4.mild, ox.kmno4.harsh,
    // yne.h2, yne.cu, side.ox, alc.ox, alc.na, phenol.base, phenol.acyl, thiol.base, thiol.disulfide, co.tollens, co.cannizzaro,
    // co.enols, co.iodoform, acid.salt, amine.protonate, amine.hno2, diazo.sub, nitro.reduce.
    if (!res.mech && RULES[rule].mech) res.mech = RULES[rule].mech;
    return res;
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
    if (smallRingBonds(g).some((b) => b[2] === 3)) {
      return none(T('Ciklopropano žiedas reaguoja kaip nesotieji junginiai: halogenas atveria žiedą (ciklopropanas su Br2 duoda 1,3-dibrompropaną), todėl įprastas radikalinis pakeitimas nenumatomas. Ciklobutanas ir didesni žiedai reaguoja kaip alkanai.', 'The cyclopropane ring behaves like an unsaturated compound: the halogen opens the ring (cyclopropane with Br2 gives 1,3-dibromopropane), so ordinary radical substitution is not predicted. Cyclobutane and larger rings react like alkanes.'));
    }
    const best = Math.max.apply(null, sites.map((c) => cls(g, c, true))); // radicals: benzyl = allyl (L6 p16)
    const out = new Out();
    sites.forEach((c) => {
      const ng = g.clone();
      ng.A[c].h -= 1;
      ng.bond(c, ng.add(X, 0, 0), 1);
      // Cl: little selectivity, a mixture of all monochloro isomers; Br: the most substituted (or allylic/benzylic) C-H
      out.add(ng, X === 'Cl' || cls(g, c, true) === best);
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
    const note = T('Konjuguotasis dienas prijungia HX (X2) 1,2- ir 1,4-padėtyse: susidaro abu produktai.', 'A conjugated diene adds 1,2 and 1,4: both products form.');
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

  // bonds of three- and four-membered carbocycles: [[a, b, ringSize], ...]
  function smallRingBonds(g) {
    const out = [];
    Object.keys(g.B).forEach((k) => {
      const p = k.split('_').map(Number);
      if (g.B[k] !== 1 || !isC(g, p[0]) || !isC(g, p[1]) || ar(g, p[0]) || ar(g, p[1])) return;
      g.unbond(p[0], p[1]);
      const path = g.path(p[0], p[1]);
      g.bond(p[0], p[1], 1);
      if (path && path.length <= 4 && path.every((i) => isC(g, i))) out.push([p[0], p[1], path.length]);
    });
    return out;
  }

  // Three-membered rings behave like unsaturated compounds (T p60): X2 and HX open cyclopropane to the 1,3-product.
  // Only cyclopropane is opened; cyclobutane is not predicted (none with a note).
  function ringOpening(g, kind, X) {
    const rb = smallRingBonds(g);
    if (!rb.length) return null;
    const three = rb.filter((b) => b[2] === 3);
    if (!three.length) return none(T('Ciklobutano žiedo atsivėrimas čia nenagrinėjamas; ciklobutanas reaguoja kaip alkanas.', 'Opening of a cyclobutane ring is not predicted here; cyclobutane behaves like an alkane.'));
    const out = new Out();
    const scored = three.map((b) => {
      const ng = g.clone();
      ng.unbond(b[0], b[1]);
      if (kind === 'x2') {
        attachGroup(ng, b[0], X);
        attachGroup(ng, b[1], X);
        return { g: ng, s: 0 };
      }
      const sa = cation(g, b[0]);
      const sb = cation(g, b[1]);
      const x = sa >= sb ? b[0] : b[1];
      const y = x === b[0] ? b[1] : b[0];
      ng.A[y].h += 1;
      attachGroup(ng, x, X);
      return { g: ng, s: Math.max(sa, sb) };
    });
    const top = Math.max.apply(null, scored.map((e) => e.s));
    scored.forEach((e) => out.add(e.g, e.s === top));
    return out.note(T('Trijų narių žiedas reaguoja kaip nesotusis junginys: halogenas ar HX atveria ciklopropano žiedą (vadovėlis, p. 60).', 'A three-membered ring behaves like an unsaturated compound: a halogen or HX opens the cyclopropane ring (textbook, p. 60).')).result();
  }

  // Markovnikov addition of H-G to every C=C (anti-Markovnikov next to an electron-withdrawing group or with peroxides)
  function addHG(g, grp, peroxide) {
    const alk = findAlkenes(g);
    if (!alk.length) return none(NOTE_NO_ALKENE);
    const out = new Out();
    let ewg = false;
    alk.forEach((p) => {
      const a = p[0];
      const b = p[1];
      // the radical stability (peroxide, AR) or the cation stability decides where X goes
      const sa = peroxide ? cls(g, a, true) : cation(g, a, b);
      const sb = peroxide ? cls(g, b, true) : cation(g, b, a);
      if (ewgAt(g, a, b) !== ewgAt(g, b, a)) ewg = true;
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
    if (peroxide) out.mech('AR');
    if (peroxide) return out.note(T('Esant peroksidų, HBr prisijungia radikaliniu mechanizmu (AR) prieš Markovnikovo taisyklę.', 'With peroxides HBr adds by a radical mechanism (AR), against the Markovnikov rule.')).result();
    if (ewg) return out.note(T('Prie C=C yra elektronakceptorinis pakaitas (C=O, CN, CF3): prisijungimas vyksta prieš Markovnikovo taisyklę – nukleofilas jungiasi prie C, esančio toliau nuo pakaito.', 'An electron-withdrawing group (C=O, CN, CF3) on the C=C: addition goes against the Markovnikov rule, the nucleophile ends up on the carbon away from the group.')).result();
    return out.note(T('Markovnikovo taisyklė: H jungiasi prie C su daugiau H, nukleofilas – prie C, sudarančio stabilesnį karbokatijoną.', 'The Markovnikov rule: H goes to the carbon with more H, the nucleophile to the carbon that gives the more stable carbocation.')).result();
  }

  def('ae.hx', 'Vandenilio halogenido jungimasis prie alkeno', 'Addition of HX to an alkene', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: ae.hx needs X');
    const g = rs[0];
    if (conjQuads(g).length) return dieneAdd(g, 'hx', X);
    if (!findAlkenes(g).length) { const ro = ringOpening(g, 'hx', X); if (ro) return ro; }
    return addHG(g, X, !!o.peroxide && X === 'Br');
  });

  def('ae.h2o', 'Alkenų hidratacija (H3O+)', 'Hydration of alkenes (H3O+)', 'AE', null, (rs) => addHG(rs[0], 'OH', false));

  def('ae.x2', 'Halogeno jungimasis prie alkeno', 'Addition of a halogen to an alkene', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: ae.x2 needs X');
    const g = rs[0];
    if (conjQuads(g).length) return dieneAdd(g, 'x2', X);
    const alk = findAlkenes(g);
    if (!alk.length) { const ro = ringOpening(g, 'x2', X); if (ro) return ro; }
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
      return out.note(T('C=C ryšys skyla: =CH–R virsta rūgštimi, =CR2 – ketonu, =CH2 – CO2.', 'The C=C is cleaved: =CH-R gives an acid, =CR2 a ketone, =CH2 gives CO2.')).result();
    });

  def('diene.hx', 'HX jungimasis prie konjuguotojo dieno (1,2 ir 1,4)', 'HX addition to a conjugated diene (1,2 and 1,4)', 'AE', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: diene.hx needs X');
    if (!conjQuads(rs[0]).length) return none(T('Molekulėje nėra konjuguotojo dieno.', 'The molecule has no conjugated diene.'));
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
    if (eq === 1 && !half) out.note(T('Ant paprasto Pd hidrinimas nesustoja ties alkenu: gaunamas alkanas. Alkenui reikia Lindlaro katalizatoriaus.', 'Over plain Pd hydrogenation does not stop at the alkene: the alkane forms. An alkene needs Lindlar\'s catalyst.'));
    if (half) out.note(T('Lindlaro katalizatorius sustabdo hidrinimą ties alkenu (cis).', 'Lindlar\'s catalyst stops at the alkene (cis).'));
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
      // only an N,N-dialkylarylamine is turned into the ammonium ion in the nitrating acid (S4.22): meta
      return strongAcid && a.h === 0 ? { dir: 'm', st: -3, amine: true } : { dir: 'op', st: 4, amine: true };
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
    const strongAcid = E === 'NO2';
    const out = new Out();
    const sub = (p, major) => {
      const ng = g.clone();
      ng.A[p].h -= 1;
      graft(ng, p, FRAG[E]);
      out.add(ng, major);
    };
    if (rings.length > 1 && !rings.some((r, i) => rings.some((s, j) => j > i && r.some((x) => s.indexOf(x) >= 0)))) {
      return none(T('Molekulėje yra keli benzeno žiedai: reakcijos vieta nenustatoma vienareikšmiškai.', 'The molecule has more than one benzene ring: the site of reaction is not unambiguous.'));
    }
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
        const bulkyE = E === 'C(C)(C)C' || E === 'C(C)=O' || (E === 'SO3H' && subs.some((d) => d.amine)); // tert-butyl groups, acylation (bulky acylium-AlCl3) and the sulfonation of amines go para
        const hindered = (ip) => {
          const nb = [(ip + 1) % 6, (ip + 5) % 6].map((k) => subs.find((d) => d.iq === k)).filter(Boolean);
          return nb.length === 2 || ((bulkyE || nb.some((d) => d.bulky)) && nb.length >= 1);
        };
        const crowd = (ip) => [(ip + 1) % 6, (ip + 5) % 6].filter((k) => subs.some((d) => d.iq === k)).length;
        const open = major.filter((ip) => !hindered(ip));
        // if every candidate is hindered, never keep a position between two substituents
        if (open.length) major = open;
        else if (major.some((ip) => crowd(ip) < 2)) major = major.filter((ip) => crowd(ip) < 2);
        // a bulky electrophile goes para to the controlling group when it can
        if (bulkyE) {
          const para = major.filter((ip) => ctl.some((d) => dist(ip, d.iq) === 3));
          if (para.length) major = para;
        }
      }
      positions.forEach((ip) => sub(ring[ip], major.indexOf(ip) >= 0));
    });
    if (!done) {
      return none(blocked
        ? T('Friedelio ir Krafto reakcija nevyksta, kai žiede yra stiprus elektronakceptorinis pakaitas arba aminogrupė.', 'The Friedel-Crafts reaction does not take place when the ring has a strong electron-withdrawing group or an amino group.')
        : T('Žiede nėra laisvos C–H padėties.', 'The ring has no free C-H position.'));
    }
    if (E === 'NO2' && rings.some((r) => r.some((i) => g.A[i].h === 0 && g.nbr(i).some((j) => g.el(j) === 'N' && g.A[j].charge === 0 && g.A[j].h >= 1 && !g.nbr(j).some((k) => dbl(g, k, 'O') >= 0))))) {
      return none(T('Laisvas ArNH2 ar ArNHR nitrinamoje rūgščių mišinyje protonuojamas (NH3+ yra m- orientantas) ir oksiduojamas: gaunamas sudėtingas mišinys. Aminas pirma apsaugomas (acetanilidas).', 'A free ArNH2 or ArNHR is protonated in nitrating acid (NH3+ is a meta director) and oxidised, so a mixture forms. Protect the amine as the acetanilide first.'));
    }
    return out.note(T('Orientantai: NH2, OH, OR, alkilas ir halogenai nukreipia į o- ir p-, NO2, CN, SO3H, C=O ir NR3+ – į m- padėtį; lemia stipresnis donoras.', 'Directing effects: NH2, OH, OR, alkyl and halogens direct o/p; NO2, CN, SO3H, C=O and NR3+ direct meta; the stronger donor decides.')).result();
  });

  // ---- side chains of arenes ----

  def('side.br', 'Šoninės grandinės brominimas (Br2, hν)', 'Side-chain bromination (Br2, hv)', 'SR', null, (rs) => {
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
    'the cleaved part of the chain (acid, ketone or CO2), with major: true; CO2 with by: true', (rs) => {
      const g = rs[0].clone();
      const drops = [];
      let did = 0;
      let noH = 0;
      let unsupported = false;
      if (!g.A.some((x) => x.ar)) return none(T('Molekulėje nėra aromatinio žiedo.', 'The molecule has no aromatic ring.'));
      // a free OH or amino group on the ring: the hot oxidant attacks the electron-rich ring first (quinones, tar)
      const ringDonor = g.A.some((x, i) => ar(g, i) && g.nbr(i).some((j) => (g.el(j) === 'O' && !ar(g, j) && (g.A[j].h === 1 || g.A[j].charge === -1)) || (g.el(j) === 'N' && !ar(g, j) && g.A[j].charge === 0 && g.A[j].h >= 1 && !g.nbr(j).some((k) => isC(g, k) && (dbl(g, k, 'O') >= 0 || dbl(g, k, 'N') >= 0)))));
      if (ringDonor) {
        return none(T('Fenoliai ir aromatiniai aminai su KMnO4 / K2Cr2O7 oksiduojami žiede (chinonai, dervos), o ne šoninėje grandinėje; OH ar NH2 pirma apsaugomi.', 'Phenols and aromatic amines are oxidised in the ring (quinones, tar) by hot KMnO4 / K2Cr2O7, not in the side chain; the OH or NH2 group has to be protected first.'));
      }
      // a carbon x that has been cut loose from the chain: CO2, acid, ketone
      const oxFrag = (x) => {
        g.nbr(x).slice().forEach((j) => { // OH, halogen or O of the fragment are lost with the oxidation
          if (!isC(g, j) && g.ord(x, j) === 1 && g.nbr(j).length === 1) { g.unbond(x, j); drops.push(j); }
        });
        const dO = dbl(g, x, 'O') >= 0;
        const k = g.nbr(x).filter((j) => isC(g, j)).length;
        if (k === 0) { // CO2
          g.nbr(x).slice().forEach((j) => { g.unbond(x, j); drops.push(j); });
          g.A[x].h = 0;
          g.bond(x, g.add('O', 0, 0), 2);
          g.bond(x, g.add('O', 0, 0), 2);
        } else if (k === 1 && !dO) { g.A[x].h = 0; g.bond(x, g.add('O', 0, 0), 2); attachGroup(g, x, 'OH'); }
        else if (k === 2 && !dO && g.A[x].h === 1) { g.A[x].h = 0; g.bond(x, g.add('O', 0, 0), 2); }
        else g.fillC(x);
      };
      // 1. every C=C and C≡C of the side chains is cleaved first (hot KMnO4)
      const cuts = findAlkenes(g).concat(findAlkynes(g));
      const ends = {};
      cuts.forEach((p) => { g.unbond(p[0], p[1]); ends[p[0]] = true; ends[p[1]] = true; });
      Object.keys(ends).map(Number).forEach((e) => {
        const k = g.nbr(e).length;
        g.A[e].h = 0;
        g.bond(e, g.add('O', 0, 0), 2);
        if (k === 1) attachGroup(g, e, 'OH');
        else if (k === 0) g.bond(e, g.add('O', 0, 0), 2);
      });
      if (cuts.length) did++;
      const cyclicTo = (s, x) => {
        const seen = {};
        seen[s] = true;
        const q = [x];
        seen[x] = true;
        for (let h = 0; h < q.length; h++) {
          if (ar(g, q[h])) return true;
          g.nbr(q[h]).forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
        }
        return false;
      };
      // 2. the carbon next to the ring becomes COOH, the rest of the chain is cleaved off
      for (let q = 0; q < g.n(); q++) {
        if (!ar(g, q)) continue;
        g.nbr(q).slice().forEach((s) => {
          if (ar(g, s) || !isC(g, s)) return;
          const others = g.nbr(s).filter((j) => j !== q);
          if (others.some((j) => ar(g, j) || (isC(g, j) && cyclicTo(s, j)))) { unsupported = true; return; }
          const cO = dbl(g, s, 'O') >= 0;
          const acyl = others.filter((j) => !isC(g, j) && g.ord(s, j) === 1);
          if (cO && acyl.length) return; // already an acid, ester or amide: left as it is
          if (cO) { // aldehyde or ketone next to the ring
            did++;
            others.filter((j) => isC(g, j)).forEach((x) => { g.unbond(s, x); oxFrag(x); });
            g.A[s].h = 0;
            attachGroup(g, s, 'OH');
            return;
          }
          if (!sp3C(g, s)) return;
          if (g.A[s].h < 1) { noH++; return; }
          const hetero = others.filter((j) => !isC(g, j));
          if (hetero.some((j) => g.el(j) !== 'O' || g.nbr(j).length !== 1)) return;
          did++;
          hetero.forEach((j) => { g.unbond(s, j); drops.push(j); }); // benzyl alcohol: CH2OH is oxidised to COOH
          others.filter((j) => isC(g, j)).forEach((x) => { g.unbond(s, x); oxFrag(x); });
          g.A[s].h = 0;
          g.bond(s, g.add('O', 0, 0), 2);
          attachGroup(g, s, 'OH');
        });
      }
      if (unsupported) return none(T('Ciklinės šoninės grandinės (tetralinas, indanas) ir diarilmetanai čia nenagrinėjami.', 'Cyclic side chains (tetralin, indane) and diarylmethanes are not handled here.'));
      if (!did) {
        return none(noH
          ? T('Reikia benzilinio C–H: tretinis alkilas (pvz., terc-butilas) neoksiduojasi.', 'A benzylic C-H is needed: a tertiary alkyl group (tert-butyl, for example) is not oxidised.')
          : T('Nėra oksiduojamos šoninės grandinės.', 'There is no oxidisable side chain.'));
      }
      const out = new Out();
      (drops.length ? g.without(drops) : g).split().forEach((c) => {
        const co2 = c.n() === 3 && c.A.filter((x) => x.el === 'O').length === 2;
        // oxalic, glyoxylic and pyruvic type pieces (a C=O carbon bonded to another C=O carbon) are oxidised on to CO2
        const oxo = !c.A.some((x) => x.ar) && c.A.some((x, i) => x.el === 'C' && dbl(c, i, 'O') >= 0 && c.nbr(i).some((j) => isC(c, j) && dbl(c, j, 'O') >= 0));
        if (oxo) {
          const gas = new Graph();
          const c0 = gas.add('C', 0, 0);
          gas.bond(c0, gas.add('O', 0, 0), 2);
          gas.bond(c0, gas.add('O', 0, 0), 2);
          out.add(gas, false, true);
          return;
        }
        out.add(c, !co2, co2);
      });
      return out.note(T('Kiekviena šoninė grandinė su benziliniu H (ar benzilo alkoholis, aldehidas, vinilas) virsta COOH grupe.', 'Every side chain with a benzylic H (or a benzyl alcohol, aldehyde or vinyl group) becomes a COOH group.')).result();
    });

  // ------------------------------------------------------------------
  // Would the carbocation of this substrate rearrange (1,2-H or 1,2-alkyl shift to a more stable cation)?
  // Generators avoid such substrates: the rules here do not rearrange.
  // ------------------------------------------------------------------

  function shiftGains(gc, a, from) {
    const old = cation(gc, a);
    for (const w of gc.nbr(a)) {
      if (w === from || !sp3C(gc, w) || ar(gc, w)) continue;
      const nC = cNbrs(gc, w).length;
      if (gc.A[w].h > 0 && cation(gc, w) > old) return true; // hydride shift
      if (gc.A[w].h === 0 && conjKind(gc, w) * 10 + Math.min(nC - 1, 3) > old) return true; // alkyl shift
    }
    // two hydride shifts in a row: a first shift to an equally stable cation, then a second one that gains
    // (4-methylpentan-2-yl: secondary, secondary, tertiary)
    if (from === undefined) {
      for (const w of gc.nbr(a)) {
        if (!sp3C(gc, w) || ar(gc, w) || gc.A[w].h < 1 || cation(gc, w) !== old) continue;
        if (shiftGains(gc, w, a)) return true;
      }
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
        if (e[2] < e[3] || e[2] < -50) return;
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

  // ------------------------------------------------------------------
  // Alkyl halides and alcohols: SN2, SN1, E, HX, oxidation, alkoxides, Williamson, ether cleavage
  // ------------------------------------------------------------------

  const NU_BASIC = { OH: 1, OC: 1, OCC: 1, 'C#CC': 1 };
  const NU_ALL = ['OH', 'SH', 'CN', 'OC', 'C#CC', 'NH3', 'I', 'OCC', 'SC'];

  // new graph: the leaving group L of carbon c replaced by the nucleophile; returns the new graph
  function substitute(g, c, L, nu) {
    const lel = g.el(L);
    const ng = g.without([L]);
    const cc = ng.map[c];
    if (nu === 'NH3') {
      const n = ng.add('N', 1, 3);
      ng.bond(cc, n, 1);
      ng.add(lel, -1, 0);
    } else {
      graft(ng, cc, FRAG[nu]);
    }
    return ng;
  }

  // allylic transposition: the nucleophile (or X) at the other end of the C=C next to c; L is the leaving group
  function transpose(g, c, L, nu, xel) {
    const out = [];
    const base = g.without([L]);
    const cc = base.map[c];
    base.nbr(cc).forEach((w) => {
      if (!isC(base, w) || base.ord(cc, w) !== 1 || ar(base, w)) return;
      base.nbr(w).forEach((u) => {
        if (u === cc || !isC(base, u) || base.ord(w, u) !== 2 || ar(base, u)) return;
        const ng = base.clone();
        ng.bond(cc, w, 2);
        ng.bond(w, u, 1);
        ng.fillC(cc);
        ng.fillC(w);
        if (nu === 'NH3') {
          ng.bond(u, ng.add('N', 1, 3), 1);
          ng.add(xel, -1, 0);
        } else if (nu === 'X') {
          ng.bond(u, ng.add(xel, 0, 0), 1);
        } else {
          graft(ng, u, FRAG[nu]);
        }
        out.push(ng);
      });
    });
    return out;
  }

  // all alkenes that a leaving group on c can give (Zaitsev scored)
  function eliminations(g, c, L) {
    const gl = g.without([L]);
    const cc = gl.map[c];
    const res = [];
    gl.nbr(cc).forEach((b) => {
      if (!sp3C(gl, b) || gl.A[b].h < 1) return;
      const ng = gl.clone();
      ng.bond(cc, b, 2);
      ng.fillC(cc);
      ng.fillC(b);
      const arylBonus = (x) => ng.nbr(x).filter((j) => ar(ng, j)).length * 0.5;
      const score = cNbrs(ng, cc).filter((j) => j !== b).length + cNbrs(ng, b).filter((j) => j !== cc).length + arylBonus(cc) + arylBonus(b);
      res.push({ g: ng, score });
    });
    return res;
  }

  function addElim(out, g, c, L, forceMinor) {
    const es = eliminations(g, c, L);
    if (!es.length) return false;
    const top = Math.max.apply(null, es.map((e) => e.score));
    es.forEach((e) => out.add(e.g, !forceMinor && e.score === top));
    return true;
  }

  const LG = { I: 3, Br: 2, Cl: 1, F: 0 };
  const NU_SN1 = { OH: 1, OC: 1, OCC: 1 }; // solvolysis: water, methanol, ethanol
  const NU_WEAKB = { I: 1, SH: 1, SC: 1 }; // good nucleophiles that are weak bases: a tertiary halide gives SN1, not E2

  function snRule(mode) {
    return (rs, o) => {
      const nu = o.nu;
      if (NU_ALL.indexOf(nu) < 0) throw new Error('react: ' + mode + ' needs nu from ' + NU_ALL.join(' '));
      if (mode === 'sn1' && !NU_SN1[nu] && !NU_WEAKB[nu]) {
        return none(T('SN1 vyksta su silpnu nukleofilu (vanduo, metanolis, etanolis, solvolizė); su stipriu ar baziniu nukleofilu vyksta SN2 arba eliminavimas.', 'SN1 needs a weak nucleophile (water, methanol, ethanol: solvolysis); with a strong or basic nucleophile SN2 or elimination takes place.'));
      }
      const g = rs[0];
      const hs = findHalides(g);
      if (!hs.length) return none(T('Halogenarenai ir halogenalkenai nepakeičiami SN reakcijomis (be griežtų sąlygų).', 'Aryl and vinyl halides do not undergo SN reactions (without harsh conditions).'));
      const out = new Out();
      const bestLG = Math.max.apply(null, hs.map((h) => LG[g.el(h.x)]));
      let eMajor = false;
      let neo = 0;
      let tertWeak = 0;
      hs.forEach((h) => {
        const k = cNbrs(g, h.c).length;
        const conj = isConj(g, h.c);
        const lg = LG[g.el(h.x)] === bestLG; // the better leaving group reacts (RI > RBr > RCl, L10 p10)
        if (mode === 'sn2') {
          if (k <= 1 && cNbrs(g, h.c).some((w) => sp3C(g, w) && g.nbr(w).length === 4 && g.A[w].h === 0)) { neo++; return; } // neopentyl
          if (k <= 1 || (k === 2 && !NU_BASIC[nu])) {
            out.add(substitute(g, h.c, h.x, nu), lg);
            if (k === 2) addElim(out, g, h.c, h.x, true);
          } else if (k === 2) {
            out.add(substitute(g, h.c, h.x, nu), false);
            addElim(out, g, h.c, h.x, !lg);
            if (lg) eMajor = true;
          } else if (NU_WEAKB[nu] && !conj) {
            tertWeak++; // SN2 is impossible and the weak base does not eliminate: SN1
          } else {
            addElim(out, g, h.c, h.x, !lg);
            if (lg) eMajor = true;
          }
        } else if (k >= 3 || conj) {
          out.add(substitute(g, h.c, h.x, nu), lg);
          if (conj && !ar(g, h.c)) transpose(g, h.c, h.x, nu, g.el(h.x)).forEach((t) => out.add(t, lg));
          addElim(out, g, h.c, h.x, true);
        }
      });
      if (!out.list.length) {
        if (tertWeak) return none(T('Tretinis halogenalkanas SN2 būdu nereaguoja, o I⁻, HS⁻ ir RS⁻ yra silpnos bazės ir eliminavimo nesukelia: vyksta SN1 (poliniame tirpiklyje).', 'A tertiary halide does not react by SN2, and I⁻, HS⁻ and RS⁻ are weak bases that do not eliminate: the reaction is SN1 (in a polar solvent).'));
        if (neo) return none(T('Neopentilo tipo halogenalkanai SN2 būdu praktiškai nereaguoja (β-anglis be H, didelė erdvinė kliūtis), o SN1 per pirminį katijoną nevyksta.', 'Neopentyl-type halides practically do not react by SN2 (a quaternary β-carbon blocks the backside) and SN1 through a primary cation does not occur.'));
        return none(T('SN1 vyksta per stabilų karbokatijoną (tretinį, alilo ar benzilo); šis halogenalkanas reaguoja SN2 būdu.', 'SN1 needs a stable carbocation (tertiary, allylic or benzylic); this halide reacts by SN2.'));
      }
      if (mode === 'sn2' && eMajor) out.mech('E2');
      return out.note(mode === 'sn2'
        ? T('Pirminiai halogenalkanai: SN2; antriniai su stipria baze – daugiausia E2; tretiniai – tik eliminavimas.', 'Primary halides: SN2; secondary with a strong base mostly E2; tertiary only elimination.')
        : T('SN1 su silpnu nukleofilu (vanduo, alkoholis): vyrauja pakeitimas, mažiau alkeno (E1).', 'SN1 with a weak nucleophile (water, alcohol): substitution predominates, a little alkene (E1) forms.')).result();
    };
  }
  def('sn2', 'Nukleofilinis pakeitimas (SN2)', 'Nucleophilic substitution (SN2)', 'SN2', null, snRule('sn2'));
  def('sn1', 'Nukleofilinis pakeitimas (SN1)', 'Nucleophilic substitution (SN1)', 'SN1', null, snRule('sn1'));

  def('elim', 'Eliminavimas: halogenalkanų dehidrohalogeninimas, alkoholių dehidratacija', 'Elimination: dehydrohalogenation of halides, dehydration of alcohols', 'E2', null, (rs, o) => {
    const g = rs[0];
    const hs = findHalides(g).map((x) => [x.c, x.x]);
    const as = findAlcohols(g).map((x) => [x.c, x.o]);
    let sites;
    if (o.base === 'strong') sites = hs;
    else if (o.base === 'heat-acid') sites = as;
    else sites = hs.length ? hs : as;
    if (!sites.length) return none(T('Nėra halogeno ar OH grupės prie sp3 anglies.', 'There is no halogen or OH group on an sp3 carbon.'));
    if (sites === as && as.some((x, i) => as.some((y, j) => j > i && g.ord(x[0], y[0]) === 1))) {
      return none(T('Vicinalinių diolių rūgštinė dehidratacija duoda enolius (tautomerizuojasi į karbonilinius junginius) arba pinakolinį pertvarkymą; tai čia nenagrinėjama.', 'Acid treatment of a vicinal diol gives enols (which tautomerise to carbonyl compounds) or the pinacol rearrangement; this is not covered here.'));
    }
    const out = new Out();
    sites.forEach((s) => addElim(out, g, s[0], s[1], false));
    if (!out.list.length) return none(T('Nėra β-vandenilio.', 'There is no β-hydrogen.'));
    // acid dehydration of secondary and tertiary alcohols is E1 (L11 p12, p27); a base on a haloalkane is E2
    const alcSite = sites === as;
    if (alcSite) out.mech(sites.every((s) => cNbrs(g, s[0]).length >= 2) ? 'E1' : 'E2');
    else out.mech(sites.some((s) => cNbrs(g, s[0]).length >= 3) && o.base !== 'strong' ? 'E1' : 'E2');
    return out.note(T('Zaicevo taisyklė: vyrauja daugiausia pakeistas alkenas (H atskyla nuo mažiausiai H turinčio kaimyninio C).', 'Zaitsev\'s rule: the most substituted alkene predominates (H leaves from the neighbouring carbon with fewest H).')).result();
  });

  def('alc.hx', 'Alkoholio virtimas halogenalkanu (HX)', 'Alcohol to alkyl halide (HX)', 'SN1/SN2', null, (rs, o) => {
    const X = o.X;
    if (!HAL[X]) throw new Error('react: alc.hx needs X');
    const g = rs[0];
    const al = findAlcohols(g);
    if (!al.length) return none(T('Nėra alkoholio OH grupės.', 'There is no alcohol OH group.'));
    const out = new Out();
    al.forEach((a) => {
      const ng = g.without([a.o]);
      attachGroup(ng, ng.map[a.c], X);
      out.add(ng, true);
      out.mech(al.every((x) => cls(g, x.c) < 2) ? 'SN2' : 'SN1'); // primary alcohols SN2, secondary and tertiary SN1
      const k = cNbrs(g, a.c).length;
      if (isConj(g, a.c) && k >= 1) transpose(g, a.c, a.o, 'X', X).forEach((t) => out.add(t, true)); // allylic cation: both ends
    });
    return out.note(T('Pirminiai alkoholiai reaguoja SN2, antriniai ir tretiniai – SN1 (galimas persigrupavimas).', 'Primary alcohols react by SN2, secondary and tertiary by SN1 (rearrangement is possible).')).result();
  });

  def('alc.ox', 'Alkoholių oksidacija (PCC arba chromo rūgštis)', 'Oxidation of alcohols (PCC or chromic acid)', null, null, (rs, o) => {
    const reagent = o.reagent;
    if (reagent !== 'PCC' && reagent !== 'chromic') throw new Error('react: alc.ox needs reagent PCC or chromic');
    const g = rs[0].clone();
    let did = 0;
    findAlcohols(g).forEach((a) => {
      const h = g.A[a.c].h;
      if (h === 0) return; // tertiary
      did++;
      g.bond(a.c, a.o, 2);
      g.A[a.o].h = 0;
      if (h >= 2 && reagent === 'chromic') attachGroup(g, a.c, 'OH');
      g.fillC(a.c);
    });
    if (!did) {
      return none(findAlcohols(g).length
        ? T('Tretiniai alkoholiai įprastomis sąlygomis neoksiduojasi.', 'Tertiary alcohols are not oxidised under the usual conditions.')
        : T('Nėra alkoholio OH grupės (fenoliai oksiduojasi kitaip – į chinonus).', 'There is no alcohol OH group (phenols are oxidised differently, to quinones).'));
    }
    return new Out().add(g, true).note(T('PCC: pirminis alkoholis → aldehidas; chromo rūgštis: pirminis → karboksirūgštis; antriniai visada → ketonas.', 'PCC: primary alcohol → aldehyde; chromic acid: primary → carboxylic acid; secondary always → ketone.')).result();
  });

  def('alc.na', 'Alkoholio reakcija su Na (alkoksidas)', 'Alcohol with sodium (alkoxide)', null, 'H2 (gas evolution), by: true', (rs, o) => {
    const metal = o.metal === 'K' ? 'K' : 'Na';
    const g = rs[0];
    const al = findAlcohols(g);
    const th = o.excess ? findThiols(g) : []; // an excess of Na also deprotonates SH (L12 p32 Q2a)
    if (!al.length && !th.length) return none(T('Nėra alkoholio OH grupės.', 'There is no alcohol OH group.'));
    const out = new Out();
    const mk = (list) => {
      const ng = g.clone();
      list.forEach((a) => { ng.A[a.o].h = 0; ng.A[a.o].charge = -1; ng.add(metal, 1, 0); });
      th.forEach((x) => { ng.A[x.s].h = 0; ng.A[x.s].charge = -1; ng.add(metal, 1, 0); });
      return ng;
    };
    if (o.excess) out.add(mk(al), true);
    else al.forEach((a) => out.add(mk([a]), true));
    const h2 = new Graph();
    h2.bond(h2.add('H', 0, 0), h2.add('H', 0, 0), 1);
    out.add(h2, false, true);
    return out.note(T('Išsiskiria vandenilio dujos (požymis); alkoholiai su šarmais nereaguoja.', 'Hydrogen gas is evolved (the sign); alcohols do not react with alkalis.')).result();
  });

  // ---- ethers ----

  function findEthers(g) {
    const out = [];
    g.A.forEach((a, o) => {
      if (a.el !== 'O' || a.charge !== 0 || a.h !== 0 || g.nbr(o).length !== 2) return;
      const [c1, c2] = g.nbr(o);
      if (!isC(g, c1) || !isC(g, c2)) return;
      if (g.ord(o, c1) !== 1 || g.ord(o, c2) !== 1) return;
      if (dbl(g, c1, 'O') >= 0 || dbl(g, c2, 'O') >= 0) return;
      out.push({ o, c1, c2 });
    });
    return out;
  }

  // retrosynthesis of an ether: [{alk: carbon of the alkoxide side, hal: carbon of the halide side, quality}]
  function williamsonRoutes(g, e) {
    const quality = (c) => {
      if (ar(g, c) || !sp3C(g, c)) return -1;
      const k = cNbrs(g, c).length;
      return k <= 1 ? 2 : (k === 2 ? 0 : -1);
    };
    return [{ alk: e.c2, hal: e.c1 }, { alk: e.c1, hal: e.c2 }].map((r) => Object.assign(r, { q: quality(r.hal) }));
  }

  function nucSites(g) {
    const out = [];
    g.A.forEach((a, o) => {
      if (a.el !== 'O' || g.nbr(o).length !== 1) return;
      const c = g.nbr(o)[0];
      if (!isC(g, c) || dbl(g, c, 'O') >= 0) return;
      if ((a.h === 1 && a.charge === 0) || (a.h === 0 && a.charge === -1)) out.push({ o, c });
    });
    return out;
  }

  def('williamson', 'Viljamsono eterių sintezė', 'Williamson ether synthesis', 'SN2', null, (rs, o) => {
    const g = rs[0];
    if (rs.length === 1) {
      const eth = findEthers(g);
      const hs = findHalides(g);
      const ns = nucSites(g);
      if (hs.length && ns.length) {
        // intramolecular: a halo-alcohol closes a ring
        const out = new Out();
        hs.forEach((h) => ns.forEach((n) => {
          const p = g.path(n.c, h.c);
          if (!p || p.length + 1 < 3 || p.length + 1 > 6 || cNbrs(g, h.c).length > 1) return;
          const ng = g.without([h.x]);
          const o2 = ng.map[n.o];
          if (ng.A[o2].charge === -1) ng.A[o2].charge = 0; else ng.A[o2].h = 0;
          ng.bond(o2, ng.map[h.c], 1);
          out.add(ng, true);
        }));
        if (!out.list.length) return none(T('Žiedas nesidaro (tinka 3–6 narių žiedai).', 'No ring forms (3- to 6-membered rings work).'));
        return out.note(T('Vidumolekulinė SN2: alkoksidas atakuoja anglį su halogenu.', 'Intramolecular SN2: the alkoxide attacks the carbon bearing the halogen.')).result();
      }
      if (!eth.length) return none(T('Reikia eterio.', 'An ether is needed.'));
      const out = new Out();
      let any = false;
      eth.forEach((e) => {
        const routes = williamsonRoutes(g, e);
        const best = Math.max(routes[0].q, routes[1].q);
        if (best < 1) return;
        routes.forEach((r) => {
          if (r.q < 0) return;
          const ng = g.clone();
          ng.unbond(e.o, r.hal);
          ng.A[e.o].charge = -1;
          ng.bond(r.hal, ng.add('I', 0, 0), 1);
          const parts = ng.split();
          parts.forEach((p) => {
            // the alkoxide gets its counter ion
            if (p.A.some((a) => a.charge === -1)) p.add('Na', 1, 0);
            out.add(p, r.q === best);
          });
          any = true;
        });
      });
      if (!any) return none(T('Nėra tinkamo varianto: šio eterio negalima gauti Viljamsono sintezės būdu (reikia pirminio halogenalkano).', 'No good route: the ether cannot be made by the Williamson synthesis (a primary halide is needed).'));
      return out.note(T('Viljamsono sintezė: alkoksidas + metilo ar pirminis halogenalkanas (SN2). Antrinis ir tretinis halogenalkanai eliminuojasi (E2), arilhalogenidai nereaguoja; todėl šakotesnė dalis imama kaip alkoksidas.', 'Williamson synthesis: alkoxide + methyl or primary halide (SN2). Secondary and tertiary halides eliminate (E2) and aryl halides do not react, so the more hindered part is used as the alkoxide.')).result();
    }
    // forward: nucleophile + halide
    const ns = nucSites(g);
    const hs = findHalides(rs[1]);
    if (!ns.length) return none(T('Pirmasis reagentas turi būti alkoholis, fenolis ar alkoksidas.', 'The first reactant must be an alcohol, phenol or alkoxide.'));
    if (!hs.length) return none(T('Arilhalogenidai ir vinilhalogenidai SN2 nereaguoja.', 'Aryl and vinyl halides do not react by SN2.'));
    const out = new Out();
    if (o && o.all) {
      // every O- and S- (or OH, SH) of the first reactant is alkylated by the primary halide: the second step of S5.14b
      if (cNbrs(rs[1], hs[0].c).length > 1) return none(T('Reikia metilo ar pirminio halogenalkano (SN2).', 'A methyl or primary alkyl halide is needed (SN2).'));
      let gg = g;
      let done = 0;
      for (let i = 0; i < 12; i++) {
        // only the anions (O-, S-) are alkylated, not neutral OH or SH
        const site = nucSites(gg).filter((x) => gg.A[x.o].charge === -1).map((x) => x.o).concat(thiolS(gg).filter((x) => gg.A[x.s].charge === -1).map((x) => x.s))[0];
        if (site === undefined) break;
        gg = alkylateAt(gg, site, rs[1], hs[0]);
        done++;
      }
      if (!done) return none(T('Pirmiausia reikia gauti alkoksidą ar tioliatą (veikiant Na arba NaH); neutralios OH ir SH grupės nealkilinamos.', 'First form the alkoxide or thiolate (with Na or NaH); neutral OH and SH groups are not alkylated.'));
      return out.add(gg, true).note(T('Alkilinami visi alkoksidų ir tioliatų centrai (SN2).', 'Every alkoxide and thiolate centre is alkylated (SN2).')).result();
    }
    ns.forEach((n) => hs.forEach((h) => {
      const k = cNbrs(rs[1], h.c).length;
      const ng = g.clone();
      const off = ng.merge(rs[1]);
      const hc = h.c + off;
      const hx = h.x + off;
      if (ng.A[n.o].charge === -1) ng.A[n.o].charge = 0; else ng.A[n.o].h = 0;
      ng.bond(n.o, hc, 1);
      const eth = ng.without([hx]);
      if (k <= 1) out.add(eth, true);
      else {
        if (k === 2) out.add(eth, false);
        addElim(out, rs[1], h.c, h.x, false);
      }
    }));
    return out.note(T('Antriniai ir tretiniai halogenalkanai su alkoksidu daugiausia eliminuojasi (E2).', 'Secondary and tertiary halides with an alkoxide mostly eliminate (E2).')).result();
  });

  def('ether.hi', 'Eterio skaldymas HI (ar HBr)', 'Ether cleavage with HI (or HBr)', 'SN1/SN2', null, (rs, o) => {
    const eq = o.eq === 2 ? 2 : 1;
    const X = o.acid === 'HBr' ? 'Br' : 'I'; // L12 p35, p37: HI or HBr
    const g = rs[0];
    const eth = findEthers(g);
    if (!eth.length) return none(T('Reikia eterio.', 'An ether is needed.'));
    const out = new Out();
    let any = false;
    let mechV = 'SN2';
    eth.forEach((e) => {
      const cand = [e.c1, e.c2].filter((c) => !ar(g, c) && sp3C(g, c));
      if (!cand.length) return;
      const sn1 = (c) => cls(g, c) >= 3;
      const hind = (c) => cNbrs(g, c).length;
      const score = (c) => (sn1(c) ? 100 + cls(g, c) : -hind(c));
      const best = Math.max.apply(null, cand.map(score));
      mechV = best >= 100 ? 'SN1' : 'SN2';
      cand.forEach((hal) => {
        const alc = hal === e.c1 ? e.c2 : e.c1;
        const ng = g.clone();
        ng.unbond(e.o, hal);
        ng.A[e.o].h = 1;
        ng.bond(hal, ng.add(X, 0, 0), 1);
        let res = ng;
        if (eq === 2 && !ar(g, alc) && sp3C(g, alc)) {
          const k = ng.without([e.o]);
          k.bond(k.map[alc], k.add(X, 0, 0), 1);
          res = k;
        }
        res.split().forEach((p) => out.add(p, score(hal) === best));
        any = true;
      });
    });
    if (!any) return none(T('Diarileteriai su HI ar HBr neskyla.', 'Diaryl ethers are not cleaved by HI or HBr.'));
    out.mech(mechV);
    return out.note(T('Jei gali susidaryti stabilus karbokatijonas (tretinis, alilo, benzilo) – SN1: halogenidas prie šios dalies; kitaip SN2: halogenidas prie mažiau užstoto C. Arilo C–O ryšys neskyla (gaunamas fenolis).', 'If a stable cation can form (tertiary, allylic, benzylic) the cleavage is SN1 and the halide ends up on that part; otherwise SN2 and the halide ends up on the less hindered carbon. An aryl C-O bond is not cleaved (a phenol results).')).result();
  });

  // ------------------------------------------------------------------
  // Shared steps: alkylation and acylation of a nucleophilic atom
  // ------------------------------------------------------------------

  function deprotonate(g, i) {
    if (g.A[i].charge < 0) g.A[i].charge += 1; else g.A[i].h -= 1;
  }

  // nucleophile atom of gNu bonded to the first alkyl-halide carbon of gHal (SN2); returns a new graph
  function alkylateAt(gNu, nu, gHal, hs) {
    const ng = gNu.clone();
    const off = ng.merge(gHal);
    deprotonate(ng, nu);
    ng.bond(nu, hs.c + off, 1);
    return ng.without([hs.x + off]);
  }

  // acyl donors (acyl chloride or anhydride) of a graph: one entry per acyl group
  function acylDonors(g) { return carbonyls(g, ['acylhalide', 'anhydride']); }

  // acylate atom nu of gNu with the acyl group k of gAc: {main, by} (by = the acid of an anhydride)
  function acylate(gNu, nu, gAc, k) {
    const g = gNu.clone();
    const off = g.merge(gAc);
    const c = k.c + off;
    const x = k.x + off;
    deprotonate(g, nu);
    g.bond(nu, c, 1);
    if (k.type === 'acylhalide') return { main: g.without([x]), by: null };
    g.unbond(c, x);
    g.A[x].h = 1;
    const p = g.parts(nu);
    return { main: p[0], by: p[1] };
  }

  // ------------------------------------------------------------------
  // Phenols and thiols
  // ------------------------------------------------------------------

  function phenolO(g) {
    const out = [];
    g.A.forEach((a, o) => {
      if (a.el !== 'O' || g.nbr(o).length !== 1 || !((a.h === 1 && a.charge === 0) || (a.h === 0 && a.charge === -1))) return;
      const c = g.nbr(o)[0];
      if (isC(g, c) && ar(g, c)) out.push({ c, o });
    });
    return out;
  }

  const NOTE_NO_PHENOL = T('Nėra fenolio OH grupės.', 'There is no phenolic OH group.');
  const NOTE_NO_THIOL = T('Nėra tiolio SH grupės.', 'There is no thiol SH group.');

  def('phenol.base', 'Fenolio reakcija su šarmu (fenolatas)', 'Phenol with a base (phenoxide)', null, null, (rs, o) => {
    const metal = o.metal === 'K' ? 'K' : 'Na';
    const g = rs[0].clone();
    const ph = findPhenols(g);
    if (!ph.length) return none(NOTE_NO_PHENOL);
    ph.forEach((p) => { g.A[p.o].h = 0; g.A[p.o].charge = -1; g.add(metal, 1, 0); });
    return new Out().add(g, true).note(T('Fenoliai, skirtingai nei alkoholiai, reaguoja su šarmais.', 'Phenols, unlike alcohols, react with alkalis.')).result();
  });

  def('phenol.alkyl', 'Fenolato alkilinimas (aril-alkileteris)', 'Alkylation of a phenoxide (aryl alkyl ether)', 'SN2', null, (rs) => {
    need(rs, 2, 'phenol.alkyl');
    const ph = phenolO(rs[0]);
    if (!ph.length) return none(NOTE_NO_PHENOL);
    const hs = findHalides(rs[1]);
    if (!hs.length || cNbrs(rs[1], hs[0].c).length > 1) return none(T('Reikia metilo ar pirminio halogenalkano (SN2).', 'A methyl or primary alkyl halide is needed (SN2).'));
    let g = rs[0];
    for (let i = 0; i < ph.length; i++) {
      const site = phenolO(g)[0];
      if (!site) break;
      g = alkylateAt(g, site.o, rs[1], hs[0]);
    }
    return new Out().add(g, true).note(T('Fenolatas + halogenalkanas → aril-alkileteris (alkoholio OH nereaguoja su NaOH).', 'Phenoxide + alkyl halide → aryl alkyl ether (an alcohol OH does not react with NaOH).')).result();
  });

  def('phenol.acyl', 'Fenolio acilinimas (fenolio esteris)', 'Acylation of a phenol (phenyl ester)', null, 'the acid released from an anhydride, by: true', (rs) => {
    need(rs, 2, 'phenol.acyl');
    if (!phenolO(rs[0]).length) return none(NOTE_NO_PHENOL);
    const ks = acylDonors(rs[1]);
    if (!ks.length) return none(T('Reikia rūgšties chlorido ar anhidrido.', 'An acyl chloride or anhydride is needed.'));
    if (amineN(rs[0]).some((a) => a.k <= 2)) return none(T('Laisvas amino azotas yra stipresnis nukleofilas už deguonį: pirmiau acilinama amino grupė, o ne OH.', 'A free amino N is a better nucleophile than O: the amino group is acylated first, not the OH.'));
    const out = new Out();
    ks.forEach((k) => {
      let g = rs[0];
      let by = null;
      const n = phenolO(g).length;
      for (let i = 0; i < n; i++) {
        const site = phenolO(g)[0];
        if (!site) break;
        const r = acylate(g, site.o, rs[1], k);
        g = r.main;
        by = r.by;
      }
      out.add(g, true);
      if (by) out.add(by, false, true);
    });
    return out.note(T('Fenolis (ar fenolatas) su acilchloridu ar anhidridu duoda esterį (pvz., aspirino sintezė).', 'A phenol (or phenoxide) with an acyl chloride or anhydride gives an ester (aspirin synthesis, for example).')).result();
  });

  def('phenol.br2', 'Fenolio brominimas bromo vandeniu', 'Bromination of phenol with bromine water', 'SEAr', null, (rs) => {
    const g = rs[0].clone();
    const ph = findPhenols(g);
    if (!ph.length) return none(NOTE_NO_PHENOL);
    const rings = aromRings(g);
    let did = 0;
    ph.forEach((p) => {
      const ring = rings.find((r) => r.indexOf(p.c) >= 0);
      if (!ring || ring.length !== 6) return;
      const i = ring.indexOf(p.c);
      [1, 3, 5].forEach((d) => {
        const a = ring[(i + d) % 6];
        if (g.A[a].h > 0) { g.A[a].h -= 1; graft(g, a, FRAG.Br); did++; }
      });
    });
    if (!did) return none(T('Visos o- ir p- padėtys užimtos.', 'All ortho and para positions are taken.'));
    return new Out().add(g, true).note(T('Aktyvuotas žiedas brominasi be katalizatoriaus visose o- ir p- padėtyse: baltos 2,4,6-tribromfenolio nuosėdos.', 'The activated ring is brominated without a catalyst in all o and p positions: white 2,4,6-tribromophenol precipitates.')).result();
  });

  function thiolS(g) {
    const out = [];
    g.A.forEach((a, s) => {
      if (a.el !== 'S' || g.nbr(s).length !== 1 || !((a.h === 1 && a.charge === 0) || (a.h === 0 && a.charge === -1))) return;
      const c = g.nbr(s)[0];
      if (isC(g, c) && dbl(g, c, 'O') < 0) out.push({ c, s });
    });
    return out;
  }

  def('thiol.base', 'Tiolio rūgštinės savybės (tioliatas, merkaptidas)', 'Acidic properties of a thiol (thiolate, mercaptide)', null, null, (rs, o) => {
    const metal = o.metal || 'Na';
    const g0 = rs[0];
    const th = findThiols(g0);
    if (!th.length) return none(NOTE_NO_THIOL);
    const out = new Out();
    if (metal === 'Na' || metal === 'K') {
      const g = g0.clone();
      th.forEach((t) => { g.A[t.s].h = 0; g.A[t.s].charge = -1; g.add(metal, 1, 0); });
      return out.add(g, true).note(T('Tioliai – stipresnės rūgštys už alkoholius – reaguoja su šarmais.', 'Thiols, stronger acids than alcohols, react with alkalis.')).result();
    }
    if (metal !== 'Hg' && metal !== 'Pb') throw new Error('react: thiol.base metal must be Na, K, Hg or Pb');
    if (th.length === 1) {
      const g = g0.clone();
      const m = g.add(metal, 0, 0);
      const off = g.merge(g0);
      g.A[th[0].s].h = 0;
      g.A[th[0].s + off].h = 0;
      g.bond(th[0].s, m, 1);
      g.bond(th[0].s + off, m, 1);
      return out.add(g, true).note(T('Susidaro sunkiųjų metalų (Hg, Pb) tioliatai (tai tiolių nuodai).', 'Heavy-metal (Hg, Pb) mercaptides: the "thiol poisons".')).result();
    }
    if (th.length === 2) {
      const g = g0.clone();
      const m = g.add(metal, 0, 0);
      th.forEach((t) => { g.A[t.s].h = 0; g.bond(t.s, m, 1); });
      return out.add(g, true).note(T('Ditiolis sudaro chelatą su sunkiuoju metalu.', 'A dithiol forms a chelate with the heavy metal.')).result();
    }
    throw new Error('react: thiol.base with Hg or Pb supports one or two SH groups');
  });

  def('thiol.alkyl', 'Tioliato alkilinimas (sulfidas)', 'Alkylation of a thiolate (sulfide)', 'SN2', null, (rs) => {
    need(rs, 2, 'thiol.alkyl');
    const th = thiolS(rs[0]);
    if (!th.length) return none(NOTE_NO_THIOL);
    const hs = findHalides(rs[1]);
    if (!hs.length) return none(T('Arilhalogenidai ir vinilhalogenidai SN2 nereaguoja.', 'Aryl and vinyl halides do not react by SN2.'));
    const k = cNbrs(rs[1], hs[0].c).length;
    const out = new Out();
    let g = rs[0];
    for (let i = 0; i < th.length; i++) {
      const site = thiolS(g)[0];
      if (!site) break;
      g = alkylateAt(g, site.s, rs[1], hs[0]);
    }
    if (k >= 3) {
      // SN2 is impossible; the thiolate is a weak base, so the tertiary halide reacts by SN1 (a little E1 alkene)
      out.add(g, true);
      addElim(out, rs[1], hs[0].c, hs[0].x, true);
      return out.mech('SN1').note(T('Tretinis halogenalkanas su tioliatu (silpna baze) reaguoja SN1 būdu: vyrauja sulfidas, šiek tiek alkeno (E1).', 'A tertiary halide with a thiolate (a weak base) reacts by SN1: the sulfide predominates, with a little alkene (E1).')).result();
    }
    return out.add(g, true).note(T('Tioliatas yra puikus nukleofilas ir silpna bazė: SN2 duoda sulfidą.', 'A thiolate is an excellent nucleophile and a weak base: SN2 gives the sulfide.')).result();
  });

  def('thiol.disulfide', 'Tiolių oksidacija (disulfidas)', 'Oxidation of thiols (disulfide)', null, null, (rs) => {
    const g0 = rs[0];
    const th = findThiols(g0);
    if (!th.length) return none(NOTE_NO_THIOL);
    if (th.length === 1) {
      const g = g0.clone();
      const off = g.merge(g0);
      g.A[th[0].s].h = 0;
      g.A[th[0].s + off].h = 0;
      g.bond(th[0].s, th[0].s + off, 1);
      return new Out().add(g, true).note(T('2 RSH → R–S–S–R (I2/NaOH, Br2, FeCl3, H2O2); Zn/CH3COOH atkuria tiolį.', '2 RSH → R-S-S-R (I2/NaOH, Br2, FeCl3, H2O2); Zn/CH3COOH regenerates the thiol.')).result();
    }
    if (th.length === 2) {
      const p = g0.path(th[0].s, th[1].s);
      if (p && p.length >= 5 && p.length <= 6) {
        const g = g0.clone();
        g.A[th[0].s].h = 0;
        g.A[th[1].s].h = 0;
        g.bond(th[0].s, th[1].s, 1);
        return new Out().add(g, true).note(T('Ditiolis (S…S per 3–4 C atomus) sudaro ciklinį disulfidą.', 'A dithiol (S…S across 3-4 carbons) forms a cyclic disulfide.')).result();
      }
    }
    return none(T('Gaunamas polimerinis disulfidas.', 'A polymeric disulfide forms.'));
  });

  // ------------------------------------------------------------------
  // Aldehydes and ketones
  // ------------------------------------------------------------------

  const aldKet = (g) => carbonyls(g, ['aldehyde', 'ketone']);
  const NOTE_NO_CO = T('Nėra aldehido ar ketono karbonilo.', 'There is no aldehyde or ketone carbonyl.');

  // alpha carbons of carbonyl k: sp3 carbons with H
  function alphas(g, k) {
    return g.nbr(k.c).filter((a) => isC(g, a) && sp3C(g, a) && g.A[a].h > 0);
  }

  def('co.nabh4', 'Karbonilo redukcija NaBH4 (alkoholis)', 'Reduction of a carbonyl with NaBH4 (alcohol)', 'AN', null, (rs) => {
    const g = rs[0].clone();
    const ks = aldKet(g);
    if (!ks.length) return none(T('NaBH4 redukuoja tik aldehidus ir ketonus (ne rūgštis, esterius, amidus).', 'NaBH4 reduces only aldehydes and ketones (not acids, esters, amides).'));
    ks.forEach((k) => { g.bond(k.c, k.o, 1); g.A[k.o].h = 1; g.fillC(k.c); });
    return new Out().add(g, true).note(T('Aldehidas → pirminis, ketonas → antrinis alkoholis.', 'Aldehyde → primary, ketone → secondary alcohol.')).result();
  });

  def('co.hcn', 'HCN jungimasis prie karbonilo (cianhidrinas)', 'Addition of HCN to a carbonyl (cyanohydrin)', 'AN', null, (rs) => {
    const g = rs[0];
    const ks = aldKet(g);
    if (!ks.length) return none(NOTE_NO_CO);
    const hasAld = ks.some((k) => k.type === 'aldehyde');
    const out = new Out();
    ks.forEach((k) => {
      const ng = g.clone();
      ng.bond(k.c, k.o, 1);
      ng.A[k.o].h = 1;
      graft(ng, k.c, 'C#N');
      ng.fillC(k.c);
      out.add(ng, !hasAld || k.type === 'aldehyde');
    });
    return out.note(T('Susidaro hidroksinitrilas (cianhidrinas); aldehidai reaktingesni už ketonus.', 'A hydroxynitrile (cyanohydrin) forms; aldehydes are more reactive than ketones.')).result();
  });

  // hemiacetal, acetal, thioacetal
  function acetalRule(kind) {
    return (rs) => {
      const g = rs[0];
      const ks = aldKet(g);
      if (!ks.length) return none(NOTE_NO_CO);
      const hasAld = ks.some((k) => k.type === 'aldehyde');
      const out = new Out();
      const sitesOf = (h) => (kind === 'thio' ? thiolS(h).map((x) => ({ n: x.s, c: x.c })) : nucSites(h).filter((x) => h.A[x.o].h === 1 && !ar(h, x.c)).map((x) => ({ n: x.o, c: x.c })));
      if (rs.length === 1) {
        if (kind !== 'hemi') return none(T('Reikia dviejų reagentų: karbonilo junginio ir alkoholio.', 'Two reactants are needed: a carbonyl compound and an alcohol.'));
        const cand = [];
        ks.forEach((k) => sitesOf(g).forEach((s) => {
          const p = g.path(k.c, s.c);
          if (!p || p.length + 1 < 5 || p.length + 1 > 6) return;
          const ng = g.clone();
          ng.bond(k.c, k.o, 1);
          ng.A[k.o].h = 1;
          ng.A[s.n].h = 0;
          ng.bond(k.c, s.n, 1);
          ng.fillC(k.c);
          cand.push({ g: ng, size: p.length + 1 });
        }));
        // the six-membered (pyranose) ring is the major form of a hydroxy aldehyde such as glucose (L13 p21)
        const six = cand.some((c) => c.size === 6);
        cand.forEach((c) => out.add(c.g, !six || c.size === 6));
        if (!out.list.length) return none(T('Ciklinis hemiacetalis nesidaro (reikia 5–6 narių žiedo).', 'No cyclic hemiacetal forms (a 5- or 6-membered ring is needed).'));
        return out.note(T('Hidroksialdehidas ciklizuojasi į ciklinį hemiacetalį.', 'A hydroxy aldehyde cyclises to a cyclic hemiacetal.')).result();
      }
      const nu = rs[1];
      const ns = sitesOf(nu);
      if (!ns.length) return none(kind === 'thio' ? NOTE_NO_THIOL : T('Antrasis reagentas turi būti alkoholis.', 'The second reactant must be an alcohol.'));
      ks.forEach((k) => {
        const major = !hasAld || k.type === 'aldehyde';
        if (kind === 'hemi') {
          ns.forEach((s) => {
            const ng = g.clone();
            const off = ng.merge(nu);
            ng.bond(k.c, k.o, 1);
            ng.A[k.o].h = 1;
            ng.A[s.n + off].h = 0;
            ng.bond(k.c, s.n + off, 1);
            ng.fillC(k.c);
            out.add(ng, major);
          });
          return;
        }
        let cyc = false;
        if (ns.length === 2) {
          const p = nu.path(ns[0].c, ns[1].c);
          if (p && p.length + 3 >= 5 && p.length + 3 <= 6) cyc = true;
          else throw new Error('react: ' + (kind === 'thio' ? 'co.thioacetal' : 'co.acetal') + ' needs a mono-ol or a 1,2- or 1,3-diol (dithiol)');
        } else if (ns.length > 2) throw new Error('react: too many OH/SH groups in the second reactant');
        const ng = g.clone();
        let off = ng.merge(nu);
        const picks = [ns[0].n + off];
        if (cyc) picks.push(ns[1].n + off);
        else { off = ng.merge(nu); picks.push(ns[0].n + off); }
        picks.forEach((n) => { ng.A[n].h = 0; ng.bond(k.c, n, 1); });
        const fin = ng.without([k.o]);
        fin.fillC(fin.map[k.c]);
        out.add(fin, major);
      });
      return out.note(kind === 'hemi'
        ? T('Hemiacetalis (nestabilus, išskyrus ciklinius); rūgštinėje terpėje su pertekliumi alkoholio – acetalis.', 'A hemiacetal (unstable unless cyclic); with excess alcohol in acid it goes on to the acetal.')
        : T('Acetalis susidaro rūgštinėje terpėje (grįžtamoji reakcija: hidrolizė rūgštyje); su diolu – ciklinis acetalis (karbonilo apsauga).', 'The acetal forms in acid (reversible: acid hydrolysis); with a diol a cyclic acetal forms (protecting the carbonyl).')).result();
    };
  }
  def('co.hemiacetal', 'Aldehido ar ketono reakcija su alkoholiu (hemiacetalis)', 'Aldehyde or ketone with an alcohol (hemiacetal)', 'AN', null, acetalRule('hemi'));
  def('co.acetal', 'Aldehido ar ketono reakcija su alkoholiu rūgštinėje terpėje (acetalis)', 'Aldehyde or ketone with an alcohol in acid (acetal)', 'AN/SN1', null, acetalRule('acetal'));
  def('co.thioacetal', 'Aldehido ar ketono reakcija su tioliu (tioacetalis)', 'Aldehyde or ketone with a thiol (thioacetal)', 'AN', null, acetalRule('thio'));

  function condensation(rule, el, nuAtom) {
    return (rs) => {
      const g = rs[0].clone();
      const ks = aldKet(g);
      if (!ks.length) return none(NOTE_NO_CO);
      ks.forEach((k) => {
        g.A[k.o].el = 'N';
        g.A[k.o].h = 0;
        graft(g, k.o, nuAtom);
      });
      return new Out().add(g, true).note(T('Karbonilas virsta C=N grupe, atskyla vanduo.', 'The carbonyl becomes a C=N group with loss of water.')).result();
    };
  }
  def('co.oxime', 'Karbonilo reakcija su hidroksilaminu (oksimas)', 'Carbonyl with hydroxylamine (oxime)', 'AN-E', null, condensation('co.oxime', 'O', 'O'));
  def('co.phenylhydrazone', 'Karbonilo reakcija su fenilhidrazinu (fenilhidrazonas)', 'Carbonyl with phenylhydrazine (phenylhydrazone)', 'AN-E', null, condensation('co.phenylhydrazone', 'N', 'Nc1ccccc1'));

  def('co.tollens', 'Aldehido oksidacija Tolenso reagentu (sidabro veidrodis)', 'Oxidation of an aldehyde with Tollens\' reagent (silver mirror)', null,
    'silver [Ag] (the mirror), by: true', (rs) => {
      const g = rs[0].clone();
      const ks = carbonyls(g, ['aldehyde']);
      const formic = carbonyls(g, ['acid']).filter((k) => g.A[k.c].h === 1 && k.r < 0);
      if (!ks.length && formic.length) {
        // formic acid also reduces Tollens' reagent (it is an aldehyde as well): it is oxidised to CO2
        const co2 = new Graph();
        const c0 = co2.add('C', 0, 0);
        co2.bond(c0, co2.add('O', 0, 0), 2);
        co2.bond(c0, co2.add('O', 0, 0), 2);
        const ag0 = new Graph();
        ag0.add('Ag', 0, 0);
        return new Out().add(co2, true).add(ag0, false, true).note(T('Skruzdžių rūgštis, turinti aldehido grupę, taip pat redukuoja Tolenso reagentą (oksiduojasi iki CO2); išsiskiria sidabras.', 'Formic acid, which also contains an aldehyde group, reduces Tollens\' reagent too (it is oxidised to CO2); silver is deposited.')).result();
      }
      // alpha-hydroxy ketones (hydroxyacetone, fructose) tautomerise through an enediol and reduce Tollens' reagent
      const ahk = carbonyls(g, ['ketone']).filter((k) => g.nbr(k.c).some((j) => isC(g, j) && g.A[j].h > 0 && g.nbr(j).some((o2) => g.el(o2) === 'O' && g.ord(j, o2) === 1 && g.A[o2].h === 1)));
      if (!ks.length && ahk.length) {
        const ag1 = new Graph();
        ag1.add('Ag', 0, 0);
        return new Out().add(ag1, true, true).note(T('α-Hidroksiketonai (pvz., fruktozė) per enodiolį redukuoja Tolenso reagentą: sidabro veidrodis (teigiamas mėginys); ketonas oksiduojamas sudėtingai.', 'α-Hydroxy ketones (e.g. fructose) reduce Tollens\' reagent through an enediol: a silver mirror forms (positive test); the ketone is oxidised to a mixture of products.')).result();
      }
      if (!ks.length) {
        return none(carbonyls(g, ['ketone']).length
          ? T('Ketonai Tolenso reagento neredukuoja.', 'Ketones do not reduce Tollens\' reagent.')
          : T('Tolenso reagentą redukuoja tik aldehidai (ir skruzdžių rūgštis); šis junginys jo neredukuoja.', 'Only aldehydes (and formic acid) reduce Tollens\' reagent; this compound does not.'));
      }
      ks.forEach((k) => {
        g.A[k.c].h = 0;
        g.bond(k.c, g.add('O', -1, 0), 1);
        g.add('N', 1, 4);
        g.fillC(k.c);
      });
      const out = new Out().add(g, true);
      const ag = new Graph();
      ag.add('Ag', 0, 0);
      out.add(ag, false, true);
      return out.note(T('Aldehidas virsta karboksirūgšties amonio druska (karboksilatu); išsiskiria sidabras (veidrodis).', 'The aldehyde becomes the ammonium salt of the acid (the carboxylate); silver is deposited (the mirror).')).result();
    });

  def('co.cannizzaro', 'Kanicaro reakcija (aldehidas be α-H, konc. NaOH)', 'Cannizzaro reaction (aldehyde without α-H, conc. NaOH)', null, null, (rs, o) => {
    const reduce = (ng, k) => { ng.bond(k.c, k.o, 1); ng.A[k.o].h = 1; ng.fillC(k.c); };
    const oxidise = (ng, k) => {
      ng.A[k.c].h = 0;
      if (o.workup) attachGroup(ng, k.c, 'OH'); else { ng.bond(k.c, ng.add('O', -1, 0), 1); ng.add('Na', 1, 0); }
      ng.fillC(k.c);
    };
    const out = new Out();
    for (const g of rs) {
      if (!carbonyls(g, ['aldehyde']).length) return none(T('Kanicaro reakcijoje dalyvauja tik aldehidai.', 'Only aldehydes take part in the Cannizzaro reaction.'));
      if (aldKet(g).some((k) => alphas(g, k).length)) return none(T('Aldehidas turi α-H: vyksta aldolinė reakcija, o ne Kanicaro.', 'The aldehyde has α-H: the aldol reaction competes, not Cannizzaro.'));
    }
    if (rs.length === 2) {
      // crossed Cannizzaro: formaldehyde is the better hydride donor and is oxidised (to formate), the other aldehyde is reduced
      const isForm = (g) => g.n() === 2 && carbonyls(g, ['aldehyde']).length === 1;
      const f = rs.findIndex(isForm);
      const pairs = [];
      if (f >= 0 && !isForm(rs[1 - f])) pairs.push([1 - f, f]);
      else rs.forEach((x, i) => rs.forEach((y, j) => pairs.push([i, j])));
      pairs.forEach((pr) => {
        const gr = rs[pr[0]];
        const go = rs[pr[1]];
        if (carbonyls(gr, ['aldehyde']).length !== 1 || carbonyls(go, ['aldehyde']).length !== 1) return;
        const a1 = gr.clone(); reduce(a1, carbonyls(a1, ['aldehyde'])[0]); out.add(a1, true);
        const b1 = go.clone(); oxidise(b1, carbonyls(b1, ['aldehyde'])[0]); out.add(b1, true);
      });
      if (!out.list.length) return none(T('Mišriai Kanicaro reakcijai reikia dviejų aldehidų su viena CHO grupe.', 'A crossed Cannizzaro reaction needs two aldehydes with one CHO group each.'));
      return out.note(f >= 0 && !isForm(rs[1 - f])
        ? T('Mišri Kanicaro reakcija: skruzdžių aldehidas (metanalis) oksiduojasi į formiatą, kitas aldehidas redukuojasi į alkoholį.', 'Crossed Cannizzaro reaction: formaldehyde is oxidised to formate, the other aldehyde is reduced to the alcohol.')
        : T('Mišri Kanicaro reakcija be metanalio: gaunamas visų keturių produktų mišinys.', 'Crossed Cannizzaro reaction without formaldehyde: a mixture of all four products forms.')).result();
    }
    const g = rs[0];
    const ks = carbonyls(g, ['aldehyde']);
    if (ks.length > 2) throw new Error('react: co.cannizzaro supports one or two CHO groups');
    if (ks.length === 1) {
      const a1 = g.clone(); reduce(a1, ks[0]); out.add(a1, true);
      const b1 = g.clone(); oxidise(b1, ks[0]); out.add(b1, true);
    } else {
      [[0, 1], [1, 0]].forEach((pr) => {
        const ng = g.clone();
        reduce(ng, ks[pr[0]]);
        oxidise(ng, ks[pr[1]]);
        out.add(ng, true);
      });
    }
    return out.note(T('Dismutacija: viena aldehido molekulė redukuojasi į alkoholį, kita oksiduojasi į rūgštį (druską).', 'Disproportionation: one aldehyde molecule is reduced to the alcohol, another oxidised to the acid (its salt).')).result();
  });

  // aldol addition (and condensation) of aldehydes and ketones
  function aldolProducts(rs, condense) {
    const items = rs.length === 1 ? [rs[0], rs[0]] : [rs[0], rs[1]];
    const enolizable = items.map((g) => aldKet(g).some((k) => alphas(g, k).length > 0));
    const pool = rs.length === 1 ? [0] : [0, 1];
    const res = [];
    // two reactants, one of which cannot enolise: its carbonyl is the electrophile and that crossed product is the selective one
    const fixed = rs.length === 2 && enolizable[0] !== enolizable[1] ? (enolizable[0] ? 1 : 0) : -1;
    pool.forEach((i) => {
      const gd = items[i];
      aldKet(gd).forEach((kd) => alphas(gd, kd).forEach((a) => {
        pool.forEach((j) => {
          const ge = items[j];
          const eks = aldKet(ge);
          const alds = eks.filter((k) => k.type === 'aldehyde');
          (alds.length ? alds : eks).forEach((ke) => {
            const ng = gd.clone();
            const off = ng.merge(ge);
            const ec = ke.c + off;
            const eo = ke.o + off;
            ng.A[a].h -= 1;
            ng.bond(a, ec, 1);
            let out;
            if (condense) {
              if (ng.A[a].h < 1) return;
              out = ng.without([eo]);
              out.bond(out.map[a], out.map[ec], 2);
              out.fillC(out.map[a]);
              out.fillC(out.map[ec]);
            } else {
              ng.bond(ec, eo, 1);
              ng.A[eo].h = 1;
              ng.fillC(ec);
              out = ng;
            }
            res.push({ g: out, major: fixed < 0 || j === fixed });
          });
        });
      }));
    });
    return res;
  }

  function aldolRule(condense) {
    return (rs) => {
      const res = aldolProducts(rs, condense);
      if (!res.length) {
        return none(condense
          ? T('Kondensacija negalima: aldolis neturi H prie α-C arba nėra enolizuojamo junginio.', 'No condensation: the aldol has no H on the α-carbon, or nothing can enolise.')
          : T('Nėra α-vandenilio: aldolinė reakcija nevyksta.', 'There is no α-hydrogen: the aldol reaction cannot take place.'));
      }
      const out = new Out();
      res.forEach((r) => out.add(r.g, r.major));
      return out.note(condense
        ? T('Kaitinant aldolis netenka vandens: gaunamas α,β-nesotusis karbonilo junginys.', 'On heating the aldol loses water: an α,β-unsaturated carbonyl compound forms.')
        : T('Aldolinis jungimasis: enolatas atakuoja kito karbonilo anglį; susidaro β-hidroksikarbonilo junginys.', 'Aldol addition: the enolate attacks the carbonyl carbon of another molecule: a β-hydroxy carbonyl compound.')).result();
    };
  }
  def('co.aldol', 'Aldolinis prisijungimas', 'Aldol addition', 'AN', null, aldolRule(false));
  def('co.aldolcond', 'Aldolinė kondensacija', 'Aldol condensation', 'AN-E', null, aldolRule(true));

  def('co.enols', 'Keto-enolinė tautomerija (enoliai)', 'Keto-enol tautomerism (enols)', null, null, (rs) => {
    const g = rs[0];
    const ks = aldKet(g);
    if (!ks.length) return none(NOTE_NO_CO);
    const out = new Out();
    const list = [];
    ks.forEach((k) => alphas(g, k).forEach((a) => {
      const ng = g.clone();
      ng.bond(k.c, a, 2);
      ng.bond(k.c, k.o, 1);
      ng.A[k.o].h = 1;
      ng.fillC(k.c);
      ng.fillC(a);
      const conj = g.nbr(a).some((w) => w !== k.c && (ar(g, w) || g.nbr(w).some((u) => u !== a && g.ord(w, u) >= 2 && (g.el(u) === 'O' || isC(g, u)))));
      list.push({ g: ng, score: (conj ? 2 : 0) + cNbrs(g, a).filter((w) => w !== k.c).length });
    }));
    if (!list.length) return none(T('Nėra α-vandenilio, enolis nesidaro.', 'There is no α-hydrogen, no enol forms.'));
    const top = Math.max.apply(null, list.map((e) => e.score));
    list.forEach((e) => out.add(e.g, e.score === top));
    return out.note(T('Ketoforma vyrauja (> 99,9 %); enolis stabilesnis, kai konjuguotas arba esant 1,3-dikarbonilo junginiui.', 'The keto form dominates (> 99.9 %); the enol is more stable when conjugated or in a 1,3-dicarbonyl compound.')).result();
  });

  def('co.iodoform', 'Haloformo reakcija (I2, NaOH): jodoformas', 'Haloform reaction (I2, NaOH): iodoform', null, 'iodoform CHI3 (yellow precipitate) is listed with the carboxylate, both major', (rs) => {
    const g = rs[0].clone();
    const isMe = (m, c) => isC(g, m) && sp3C(g, m) && g.nbr(m).length === 1 && g.A[m].h === 3 && g.nbr(m)[0] === c;
    let site = null;
    aldKet(g).forEach((k) => {
      if (site) return;
      const m = g.nbr(k.c).find((w) => isMe(w, k.c));
      if (m !== undefined) site = { c: k.c, m, o: k.o, alcohol: false };
    });
    if (!site) {
      findAlcohols(g).forEach((a) => {
        if (site || g.A[a.c].h < 1) return;
        const m = g.nbr(a.c).find((w) => isMe(w, a.c));
        if (m !== undefined) site = { c: a.c, m, o: a.o, alcohol: true };
      });
    }
    if (!site) return none(T('Reikia CH3–C(=O)– ar CH3–CH(OH)– grupės.', 'A CH3-C(=O)- or CH3-CH(OH)- group is needed.'));
    g.unbond(site.c, site.m);
    if (site.alcohol) { g.bond(site.c, site.o, 2); g.A[site.o].h = 0; }
    g.bond(site.c, g.add('O', -1, 0), 1);
    g.add('Na', 1, 0);
    g.fillC(site.c);
    const parts = g.without([site.m]);
    const out = new Out().add(parts, true);
    const chi3 = new Graph();
    const cc = chi3.add('C', 0, 1);
    for (let i = 0; i < 3; i++) chi3.bond(cc, chi3.add('I', 0, 0), 1);
    out.add(chi3, true);
    return out.note(T('Geltonos jodoformo nuosėdos (CHI3) – metilketonų ir CH3CH(OH)– alkoholių atpažinimas; lieka karboksilatas.', 'Yellow iodoform (CHI3) precipitates: the test for methyl ketones and CH3CH(OH)- alcohols; the carboxylate remains.')).result();
  });

  // ------------------------------------------------------------------
  // Carboxylic acids and their derivatives
  // ------------------------------------------------------------------

  // give every carboxylate / alkoxide-type anion of a component its counter ion
  function withCounterIons(c, metal) {
    const neg = c.A.filter((a) => a.charge === -1 && a.el !== 'Cl' && a.el !== 'Br' && a.el !== 'I').length;
    for (let i = 0; i < neg; i++) c.add(metal, 1, 0);
    return c;
  }

  const NOTE_NO_ACID = T('Nėra karboksirūgšties grupės.', 'There is no carboxylic acid group.');
  const NOTE_ONLY_ACYL = T('Su šiuo reagentu reaguoja tik rūgščių chloridai ir anhidridai (esteriai ir amidai – hidrolizės reakcija).', 'Only acyl chlorides and anhydrides react like this (esters and amides are hydrolysed instead).');

  def('acid.ester', 'Esterinimas (rūgštis + alkoholis, H+)', 'Esterification (acid + alcohol, H+)', 'AN-E', null, (rs) => {
    need(rs, 2, 'acid.ester');
    const g = rs[0];
    const ks = carbonyls(g, ['acid']);
    if (!ks.length) return none(NOTE_NO_ACID);
    const ns = nucSites(rs[1]).filter((s) => rs[1].A[s.o].h === 1 && !ar(rs[1], s.c));
    if (!ns.length) return none(T('Antrasis reagentas turi būti alkoholis.', 'The second reactant must be an alcohol.'));
    const out = new Out();
    ns.forEach((s) => {
      const ng = g.clone();
      const drops = [];
      ks.forEach((k) => {
        const off = ng.merge(rs[1]);
        ng.A[s.o + off].h = 0;
        ng.bond(k.c, s.o + off, 1);
        drops.push(k.x);
      });
      out.add(ng.without(drops), true);
    });
    return out.note(T('Grįžtamoji, rūgšties katalizuojama reakcija; vanduo atsiskiria iš rūgšties OH ir alkoholio H.', 'A reversible reaction catalysed by acid; water leaves from the acid OH and the alcohol H.')).result();
  });

  def('acid.salt', 'Karboksirūgšties reakcija su baze (druska)', 'Carboxylic acid with a base (salt)', null, null, (rs, o) => {
    const metal = (o.metal || o.M) === 'K' ? 'K' : 'Na'; // M is an alias of metal
    const g = rs[0].clone();
    const ks = carbonyls(g, ['acid']);
    if (!ks.length) return none(NOTE_NO_ACID);
    ks.forEach((k) => { g.A[k.x].h = 0; g.A[k.x].charge = -1; g.add(metal, 1, 0); });
    return new Out().add(g, true).note(T('Rūgšties ir bazės reakcija: karboksilato druska.', 'Acid-base reaction: the carboxylate salt.')).result();
  });

  def('acid.socl2', 'Rūgšties chloridų sintezė (SOCl2)', 'Making acyl chlorides (SOCl2)', 'AN-E', null, (rs) => {
    const g = rs[0];
    const ks = carbonyls(g, ['acid']);
    if (!ks.length) return none(NOTE_NO_ACID);
    const ng = g.clone();
    ks.forEach((k) => { ng.A[k.x].el = 'Cl'; ng.A[k.x].h = 0; });
    return new Out().add(ng, true).note(T('Rūgšties OH pakeičiamas Cl (SO2 ir HCl išsiskiria).', 'The acid OH is replaced by Cl (SO2 and HCl are released).')).result();
  });

  // amines for acylation, alkylation and HNO2: neutral N with only C neighbours (not amide, not aromatic ring N)
  function amineN(g) {
    const out = [];
    g.A.forEach((a, n) => {
      if (a.el !== 'N' || a.charge !== 0 || a.ar) return;
      const nb = g.nbr(n);
      if (!nb.every((j) => isC(g, j) && g.ord(n, j) === 1)) return;
      if (nb.some((j) => dbl(g, j, 'O') >= 0 || dbl(g, j, 'N') >= 0 || g.nbr(j).some((u) => g.el(u) === 'N' && g.ord(j, u) === 3))) return;
      if (nb.length + a.h !== 3) return;
      out.push({ n, k: nb.length, aromatic: nb.some((j) => ar(g, j)) });
    });
    return out;
  }

  // acylation of an amine or ammonia, or of water or an alcohol
  function acylRule(nuKind, swap, salt) {
    return (rs) => {
      let acyl = rs[0];
      let nu = rs[1];
      if (swap && rs.length > 1 && !acylDonors(rs[0]).length) { acyl = rs[1]; nu = rs[0]; }
      if (nuKind !== 'water' && nuKind !== 'ammonia') need(rs, 2, 'acyl.nu');
      const ks = acylDonors(acyl);
      if (!ks.length) return none(NOTE_ONLY_ACYL);
      const out = new Out();
      ks.forEach((k) => {
        if (nuKind === 'water') {
          const ng = acyl.clone();
          if (k.type === 'acylhalide') { ng.A[k.x].el = 'O'; ng.A[k.x].h = 1; } else {
            ng.unbond(k.c, k.x);
            ng.A[k.x].h = 1;
            attachGroup(ng, k.c, 'OH');
          }
          ng.split().forEach((c) => out.add(c, true));
          return;
        }
        let sites;
        let gn = nu;
        if (nuKind === 'ammonia') {
          gn = new Graph();
          gn.add('N', 0, 3);
          sites = [{ n: 0 }];
        } else if (nuKind === 'alcohol') {
          if (amineN(nu).some((a) => a.k <= 2)) return;
          sites = nucSites(nu).filter((s) => nu.A[s.o].h === 1 && !ar(nu, s.c)).map((s) => ({ n: s.o }));
        } else {
          const am = amineN(nu).filter((a) => a.k <= 2);
          const aliph = am.filter((a) => !a.aromatic);
          sites = (aliph.length ? aliph : am).map((a) => ({ n: a.n }));
        }
        if (!sites.length) return;
        sites.forEach((s) => {
          const r = acylate(gn, s.n, acyl, k);
          out.add(r.main, true);
          if (r.by) out.add(r.by, false, true);
          if (salt && k.type === 'acylhalide' && (nuKind === 'amine' || nuKind === 'ammonia')) {
            // the second equivalent of the amine takes up the HCl
            const sg = gn.clone();
            sg.A[s.n].charge = 1;
            sg.A[s.n].h += 1;
            sg.add(acyl.el(k.x), -1, 0);
            out.add(sg, false, true);
          }
        });
      });
      if (!out.list.length && nuKind === 'alcohol' && amineN(nu).some((a) => a.k <= 2)) return none(T('Laisvas amino azotas yra stipresnis nukleofilas už deguonį: pirmiau acilinama amino grupė, o ne OH.', 'A free amino N is a better nucleophile than O: the amino group is acylated first, not the OH.'));
      if (!out.list.length) {
        return none(nuKind === 'amine'
          ? T('Tretiniai aminai neturi N–H: amidas nesusidaro.', 'Tertiary amines have no N-H: no amide forms.')
          : T('Nėra tinkamo nukleofilo.', 'There is no suitable nucleophile.'));
      }
      return out.note(T('Nukleofilinis acilo pakeitimas: nukleofilas pakeičia Cl (ar karboksilatą); NH3 ir aminų reikia 2 ekv. (antras suriša HCl).', 'Nucleophilic acyl substitution: the nucleophile replaces Cl (or the carboxylate); NH3 and amines are needed in 2 equivalents (the second takes up HCl).')).result();
    };
  }

  def('acyl.nu', 'Nukleofilinis acilo pakeitimas (rūgščių chloridai, anhidridai)', 'Nucleophilic acyl substitution (acyl chlorides, anhydrides)', 'AN-E',
    'amine hydrochloride or NH4Cl (acyl chloride), or the acid (anhydride), by: true', (rs, o, raw) => {
      const nu = o.nu;
      if (['water', 'alcohol', 'amine', 'ammonia'].indexOf(nu) < 0) throw new Error('react: acyl.nu needs nu water, alcohol, amine or ammonia');
      return acylRule(nu, false, true)(rs, o, raw);
    });

  def('amine.acyl', 'Amino acilinimas (amidas)', 'Acylation of an amine (amide)', 'AN-E', 'the acid released from an anhydride, by: true', (rs, o, raw) => {
    need(rs, 2, 'amine.acyl');
    return acylRule('amine', true, false)(rs, o, raw);
  });

  def('ester.hydrolysis', 'Esterių hidrolizė', 'Hydrolysis of esters', 'AN-E', null, (rs, o) => {
    const medium = o.medium;
    if (medium !== 'acid' && medium !== 'base') throw new Error('react: ester.hydrolysis needs medium acid or base');
    const g = rs[0].clone();
    const ks = carbonyls(g, ['ester']);
    if (!ks.length) return none(T('Nėra esterio grupės.', 'There is no ester group.'));
    ks.forEach((k) => {
      g.unbond(k.c, k.x);
      g.A[k.x].h += 1;
      if (medium === 'acid') attachGroup(g, k.c, 'OH'); else g.bond(k.c, g.add('O', -1, 0), 1);
    });
    const out = new Out();
    g.split().forEach((c) => {
      if (medium === 'base') {
        // in excess alkali acids and phenols are present as their sodium salts
        carbonyls(c, ['acid']).forEach((k) => { c.A[k.x].h = 0; c.A[k.x].charge = -1; });
        phenolO(c).forEach((p) => { if (c.A[p.o].h === 1) { c.A[p.o].h = 0; c.A[p.o].charge = -1; } });
        withCounterIons(c, 'Na');
      }
      out.add(c, true);
    });
    return out.note(medium === 'acid'
      ? T('Rūgštinė hidrolizė: grįžtamoji, gaunama karboksirūgštis ir alkoholis.', 'Acid hydrolysis: reversible, gives the carboxylic acid and the alcohol.')
      : T('Šarminė hidrolizė (muilinimas): negrįžtama, gaunamas karboksilatas ir alkoholis.', 'Base hydrolysis (saponification): irreversible, gives the carboxylate and the alcohol.')).result();
  });

  def('claisen', 'Klaizeno kondensacija (β-ketoesteris)', 'Claisen condensation (β-keto ester)', 'AN-E', null, (rs) => {
    const items = rs.length === 1 ? [rs[0], rs[0]] : [rs[0], rs[1]];
    const pool = rs.length === 1 ? [0] : [0, 1];
    const out = new Out();
    pool.forEach((i) => {
      const gd = items[i];
      carbonyls(gd, ['ester']).forEach((kd) => {
        const a = kd.r;
        if (a < 0 || !sp3C(gd, a) || gd.A[a].h < 2) return; // the product needs an acidic H left on the alpha carbon
        if (ewgAt(gd, a, kd.c)) return; // already a doubly activated CH2 (malonate type): alkylation chemistry, not Claisen
        pool.forEach((j) => {
          carbonyls(items[j], ['ester']).forEach((ke) => {
            const ng = gd.clone();
            const off = ng.merge(items[j]);
            ng.A[a].h -= 1;
            ng.bond(a, ke.c + off, 1);
            ng.unbond(ke.c + off, ke.x + off);
            if (ng.reach(a)[ke.x + off]) ng.A[ke.x + off].h = 1; // ring-opening of a lactone: the alkoxide end becomes OH
            out.add(ng.parts(a)[0], true);
          });
        });
      });
    });
    if (!out.list.length) {
      const oneH = items.some((g) => carbonyls(g, ['ester']).some((k) => k.r >= 0 && sp3C(g, k.r) && g.A[k.r].h === 1));
      if (oneH) {
        return none(T('Kad vyktų Klaizeno kondensacija, esteris turi turėti bent du α-vandenilio atomus: su vienu α-H susidaręs β-ketoesteris neturėtų rūgštaus α-H, negalėtų būti deprotonuotas ir pusiausvyra nepasislinktų produkto link.', 'For a Claisen condensation the ester needs at least two α-hydrogens: with only one, the β-keto ester would have no acidic α-H left, could not be deprotonated, and the equilibrium would not be driven to the product.'));
      }
      return none(T('Reikia esterio su bent dviem H prie α-C.', 'An ester with at least two H on the α-carbon is needed.'));
    }
    return out.note(T('Dviejų esterių kondensacija: vienas (enolatas) atakuoja kito karbonilą, atsiskiria alkoholis; kai abu esteriai gali enolizuotis, gaunamas mišinys.', 'Condensation of two esters: one (as enolate) attacks the carbonyl of the other, an alcohol is lost; a mixture when both can enolise.')).result();
  });

  def('lactone', 'Hidroksirūgšties ciklizacija (laktonas)', 'Cyclisation of a hydroxy acid (lactone)', 'AN-E', null, (rs) => {
    const g = rs[0];
    const ks = carbonyls(g, ['acid']);
    if (!ks.length) return none(NOTE_NO_ACID);
    const al = findAlcohols(g);
    const out = new Out();
    const cand = [];
    ks.forEach((k) => al.forEach((a) => {
      const p = g.path(k.c, a.c);
      if (!p || p.length + 1 < 5 || p.length + 1 > 6) return;
      const ng = g.clone();
      ng.A[a.o].h = 0;
      ng.bond(k.c, a.o, 1);
      cand.push({ g: ng.without([k.x]), size: p.length + 1 });
    }));
    const best = cand.length ? Math.min.apply(null, cand.map((c) => c.size)) : 0;
    cand.forEach((c) => out.add(c.g, c.size === best)); // the five-membered γ-lactone forms in preference to the δ-lactone
    if (!out.list.length) return none(T('Laktonas nesidaro (stabilūs γ- ir δ-laktonai, t. y. 5–6 narių žiedas).', 'No lactone forms (γ- and δ-lactones, 5- or 6-membered rings, are the stable ones).'));
    return out.note(T('Vidumolekulinis esterinimas rūgštinėje terpėje.', 'Intramolecular esterification in acid.')).result();
  });

  // ------------------------------------------------------------------
  // Amines, diazonium salts, nitro compounds
  // ------------------------------------------------------------------

  def('amine.protonate', 'Amino reakcija su rūgštimi (amonio druska)', 'Amine with an acid (ammonium salt)', null, null, (rs, o) => {
    const X = o.X && HAL[o.X] ? o.X : 'Cl';
    const g = rs[0];
    const sites = [];
    amineN(g).forEach((a) => sites.push({ n: a.n, rank: a.aromatic ? 2 : 3 }));
    g.A.forEach((a, n) => { if (a.el === 'N' && a.ar && a.h === 0 && a.charge === 0 && g.nbr(n).length === 2) sites.push({ n, rank: 2.5 }); });
    if (!sites.length) return none(T('Nėra bazinio azoto atomo.', 'There is no basic nitrogen atom.'));
    sites.sort((x, y) => (y.rank - x.rank) || (x.n - y.n));
    const eq = o.eq === 'all' ? sites.length : Math.max(1, Math.min(o.eq || 1, sites.length));
    const out = new Out();
    const protonate = (list) => {
      const ng = g.clone();
      list.forEach((s) => { ng.A[s.n].charge = 1; ng.A[s.n].h += 1; ng.add(X, -1, 0); });
      return ng;
    };
    if (eq === 1) sites.filter((s) => s.rank === sites[0].rank).forEach((s) => out.add(protonate([s]), true));
    else out.add(protonate(sites.slice(0, eq)), true);
    return out.note(T('Bazingiausias N protonuojamas: alifatinis aminas > aromatinis aminas ≈ piridino N; amidai nebazingi.', 'The most basic N is protonated: aliphatic amine > aromatic amine ≈ pyridine N; amides are not basic.')).result();
  });

  def('amine.alkyl', 'Amino alkilinimas (SN2)', 'Alkylation of an amine (SN2)', 'SN2', null, (rs, o) => {
    need(rs, 2, 'amine.alkyl');
    const am = amineN(rs[0]);
    if (!am.length) return none(T('Pirmasis reagentas turi būti aminas.', 'The first reactant must be an amine.'));
    const hs = findHalides(rs[1]);
    if (!hs.length || cNbrs(rs[1], hs[0].c).length > 1) return none(T('Reikia metilo ar pirminio halogenalkano (SN2).', 'A methyl or primary alkyl halide is needed (SN2).'));
    const aliph = am.filter((a) => !a.aromatic);
    const sites = aliph.length ? aliph : am;
    const out = new Out();
    sites.forEach((s) => {
      const g = rs[0].clone();
      const times = o.excess ? g.A[s.n].h + 1 : 1;
      let xel = null;
      for (let i = 0; i < times; i++) {
        const off = g.merge(rs[1]);
        g.bond(s.n, hs[0].c + off, 1);
        xel = g.el(hs[0].x + off);
        g.A[hs[0].x + off].el = '_drop';
      }
      const drops = [];
      g.A.forEach((a, i) => { if (a.el === '_drop') drops.push(i); });
      g.A[s.n].charge = 1;
      if (o.excess) g.A[s.n].h = 0;
      const fin = g.without(drops);
      fin.add(xel, -1, 0);
      out.add(fin, true);
    });
    return out.note(o.excess
      ? T('Su halogenalkano pertekliumi alkilinama iki ketvirtinės amonio druskos.', 'With excess alkyl halide the amine is alkylated all the way to the quaternary ammonium salt.')
      : T('Aminas – nukleofilas: gaunama amonio druska (toliau alkilinasi, mišinys).', 'The amine acts as a nucleophile: the ammonium salt forms (it can be alkylated further).')).result();
  });

  def('amine.hno2', 'Aminų reakcija su HNO2 (NaNO2/HCl)', 'Amines with HNO2 (NaNO2/HCl)', null, 'N2 (primary aliphatic amines), by: true', (rs) => {
    const g = rs[0];
    const am = amineN(g);
    if (!am.length) return none(T('Nėra amino grupės.', 'There is no amino group.'));
    const out = new Out();
    am.forEach((a) => {
      const ng = g.clone();
      if (a.k === 1 && !a.aromatic) {
        ng.A[a.n].el = 'O';
        ng.A[a.n].h = 1;
        out.add(ng, true);
        const n2 = new Graph();
        n2.bond(n2.add('N', 0, 0), n2.add('N', 0, 0), 3);
        out.add(n2, false, true);
      } else if (a.k === 1) {
        ng.A[a.n].charge = 1;
        ng.A[a.n].h = 0;
        ng.bond(a.n, ng.add('N', 0, 0), 3);
        ng.add('Cl', -1, 0);
        out.add(ng, true);
      } else if (a.k === 2) {
        ng.A[a.n].h = 0;
        const n2 = ng.add('N', 0, 0);
        ng.bond(a.n, n2, 1);
        ng.bond(n2, ng.add('O', 0, 0), 2);
        out.add(ng, true);
      } else if (a.aromatic) {
        const ipso = g.nbr(a.n).find((j) => ar(g, j));
        const ring = aromRings(g).find((r) => r.indexOf(ipso) >= 0);
        if (!ring || ring.length !== 6) return;
        const i = ring.indexOf(ipso);
        const p = ring[(i + 3) % 6]; // para only; if it is blocked there is no reaction
        if (g.A[p].h < 1) return;
        ng.A[p].h -= 1;
        graft(ng, p, 'N=O');
        out.add(ng, true);
      }
    });
    if (!out.list.length) return none(T('Tretiniai alifatiniai aminai su HNO2 tik sudaro druską (nitrozinimo produkto nėra); tretinis aromatinis aminas nitrozinamas tik p-padėtyje.', 'Tertiary aliphatic amines only form a salt with HNO2 (no nitrosation product); a tertiary aromatic amine is nitrosated only para.'));
    return out.note(T('Pirminis alifatinis: alkoholis + N2; pirminis aromatinis (0–5 °C): diazonio druska; antrinis: N-nitrozoaminas; tretinis aromatinis: p-nitrozo darinys; tretinis alifatinis: nereaguoja.', 'Primary aliphatic: alcohol + N2; primary aromatic (0-5 °C): diazonium salt; secondary: N-nitrosamine; tertiary aromatic: p-nitroso compound; tertiary aliphatic: no reaction.')).result();
  });

  def('diazo.sub', 'Diazonio druskos pakeitimas (Zandmeierio ir kt.)', 'Replacement of the diazonium group (Sandmeyer and others)', null, 'N2 (always evolved), by: true', (rs, o) => {
    const map = { CuCl: 'Cl', CuBr: 'Br', CuCN: 'CN', H2O: 'OH', KI: 'I' };
    const w = o.with;
    if (!map[w]) throw new Error('react: diazo.sub needs with = CuCl, CuBr, CuCN, H2O or KI');
    const g = rs[0];
    const dz = [];
    g.A.forEach((a, n) => {
      if (a.el !== 'N' || a.charge !== 1) return;
      const t = g.nbr(n).find((j) => g.el(j) === 'N' && g.ord(n, j) === 3);
      const c = g.nbr(n).find((j) => isC(g, j) && ar(g, j));
      if (t !== undefined && c !== undefined) dz.push({ n, t, c });
    });
    if (!dz.length) return none(T('Nėra diazonio grupės.', 'There is no diazonium group.'));
    const ng = g.without(dz.reduce((l, d) => l.concat([d.n, d.t]), []));
    dz.forEach((d) => graft(ng, ng.map[d.c], FRAG[map[w]]));
    const out = new Out().add(ng, true);
    const n2 = new Graph();
    n2.bond(n2.add('N', 0, 0), n2.add('N', 0, 0), 3);
    out.add(n2, false, true);
    return out.note(T('Diazonio grupė pakeičiama Cl, Br, CN (Cu(I)), OH (H2O, šildant) arba I (KI); išsiskiria N2.', 'The diazonium group is replaced by Cl, Br, CN (Cu(I)), OH (H2O, heat) or I (KI); N2 is evolved.')).result();
  });

  def('nitro.reduce', 'Nitrogrupės redukcija (Fe/H3O+)', 'Reduction of a nitro group (Fe/H3O+)', null, null, (rs) => {
    const g = rs[0];
    const ns = [];
    g.A.forEach((a, n) => {
      if (a.el !== 'N') return;
      const os = g.nbr(n).filter((j) => g.el(j) === 'O');
      if (os.length === 2 && g.nbr(n).length === 3) ns.push({ n, os });
    });
    if (!ns.length) return none(T('Nėra nitrogrupės.', 'There is no nitro group.'));
    const ng = g.clone();
    const drops = [];
    ns.forEach((x) => {
      x.os.forEach((o) => { ng.unbond(x.n, o); drops.push(o); });
      ng.A[x.n].charge = 0;
      ng.A[x.n].h = 2;
    });
    return new Out().add(ng.without(drops), true).note(T('Fe, Sn arba H2/Pd redukuoja ArNO2 į ArNH2 (rūgštyje – amonio druska, po šarmo – laisvas aminas).', 'Fe, Sn or H2/Pd reduce ArNO2 to ArNH2 (an ammonium salt in acid, the free amine after alkali).')).result();
  });

  // not in the plan's list: the course needs it after the Sandmeyer cyanation and for cyanohydrins (L13 p24, S7.8, S7.11)
  def('nitrile.hydrolysis', 'Nitrilų hidrolizė (H2O, H+, t)', 'Hydrolysis of nitriles (H2O, H+, heat)', 'AN-E', null, (rs, o) => {
    const g = rs[0].clone();
    const amide = o.stage === 'amide'; // partial hydrolysis stops at the amide (S7.10)
    let did = 0;
    for (let c = 0; c < g.n(); c++) {
      if (!isC(g, c)) continue;
      const n = g.nbr(c).find((j) => g.el(j) === 'N' && g.ord(c, j) === 3);
      if (n === undefined) continue;
      did++;
      if (amide) {
        g.A[n].h = 2;
        g.bond(c, n, 1);
        g.bond(c, g.add('O', 0, 0), 2);
      } else {
        g.A[n].el = 'O';
        g.A[n].h = 0;
        g.bond(c, n, 2);
        attachGroup(g, c, 'OH');
      }
      g.fillC(c);
    }
    if (!did) return none(T('Nėra nitrilo grupės.', 'There is no nitrile group.'));
    return new Out().add(g, true).note(amide
      ? T('Dalinė hidrolizė sustoja ties amidu.', 'Partial hydrolysis stops at the amide.')
      : T('Nitrilas hidrolizuojasi rūgštyje iki karboksirūgšties (ir NH4+).', 'A nitrile is hydrolysed in acid to the carboxylic acid (and NH4+).')).result();
  });

  //@@RULES

  ORG.react = { run, RULES, wouldRearrange };
})(globalThis.ORG = globalThis.ORG || {});
