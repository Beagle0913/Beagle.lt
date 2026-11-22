(function (ORG) {
  'use strict';

  // ====================================================================
  // Molecule drawer: 2D layout and SVG for skeletal and full structural
  // formulas. Everything is drawn from a SMILES string (ORG.chem.parse).
  //
  //   molecule(mol, opts) -> { svg, width, height, atoms, bondLength }
  //   layout(mol, opts)   -> { pos, relaxed }       positions in pixels, bond = 40
  //   quality(mol, pos, opts?) -> { overlaps, crossings, labelClashes }
  //   condensed(mol)      -> 'CH3CH(OH)CH2CHO' (plain ASCII: digits are meant to be
  //                          written as subscripts, wrap it in $...$ for check.markup)
  //   readStereo(drawing) -> { atomIdx: '@' | '@@' } re-read from the drawn wedges
  //   readCisTrans(drawing) -> [{u, v, a, b, drawn, wanted}] for marked double bonds
  //   toDom(vnode, doc), toString(vnode)
  //
  // pos / drawing.atoms hold the heavy atoms first (index = position in the SMILES)
  // and then, when hydrogens are drawn as atoms of their own (allH, or the H on a
  // ring stereocentre), one extra entry per such H: { x, y, h: index of its atom }.
  //
  // opts.numbers: atom numbers are shown 1-based (index + 1), like the tap targets.
  // opts.coords: [[x, y], ...] in units of one bond length (1 = 40 px), y downward.
  // ====================================================================

  const L = 40;
  const PI = Math.PI;
  const TAU = Math.PI * 2;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const FONT = 17;
  const SUBFONT = 12;
  const PAD = 14;
  const GAP = 5.6; // distance between the lines of a multiple bond

  const num = (x) => {
    const r = Math.round((Number.isFinite(x) ? x : 0) * 100) / 100;
    return r === 0 ? 0 : r;
  };
  const wrap = (a) => {
    while (a <= -PI) a += TAU;
    while (a > PI) a -= TAU;
    return a;
  };
  const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

  function getChem() {
    if (!ORG.chem) throw new Error('ORG.chem is not loaded');
    return ORG.chem;
  }

  function asMol(m) {
    const chem = getChem();
    if (typeof m === 'string') return chem.parse(m);
    if (m && typeof m.smi === 'string' && !m.atoms) return chem.parse(m.smi);
    return m;
  }

  // ------------------------------------------------------------------
  // Text metrics (approximate, em widths of the interface font)
  // ------------------------------------------------------------------

  const EM = {
    C: 0.67, N: 0.72, O: 0.78, S: 0.62, P: 0.64, F: 0.57, H: 0.74, B: 0.66, I: 0.3, K: 0.68, L: 0.5, M: 0.9, A: 0.7, Z: 0.62,
    l: 0.27, r: 0.38, a: 0.57, e: 0.58, g: 0.62, i: 0.27, n: 0.6, o: 0.6, t: 0.36, u: 0.6, s: 0.5, b: 0.6, d: 0.6, c: 0.52, h: 0.6, f: 0.36,
    m: 0.9, p: 0.6, k: 0.55, x: 0.52, y: 0.55, z: 0.5, v: 0.52, w: 0.78, j: 0.27, q: 0.6,
  };
  const symW = (s) => {
    let w = 0;
    for (const ch of s) w += (EM[ch] || 0.65) * FONT;
    return w;
  };
  const subW = (s) => String(s).length * 0.58 * SUBFONT;

  // ------------------------------------------------------------------
  // The drawing graph: heavy atoms plus the hydrogens drawn as atoms
  // ------------------------------------------------------------------

  const NORMAL_VALENCE = { C: 4, N: 3, O: 2, S: 2, P: 3, B: 3, F: 1, Cl: 1, Br: 1, I: 1 };
  // unpaired electrons of an uncharged bracket atom that has fewer bonds + H than its valence
  function radicalCount(mol, i) {
    const a = mol.atoms[i];
    if (!a.bracket || a.charge !== 0 || !NORMAL_VALENCE[a.el]) return 0;
    let sum = a.h;
    mol.nbr[i].forEach((w) => { sum += mol.bondAt(i, w).kek; });
    return Math.max(0, NORMAL_VALENCE[a.el] - sum);
  }

  function validCentre(a) {
    return !!a.chiral && a.ord && a.ord.length === 4 && new Set(a.ord).size === 4;
  }

  function buildGraph(mol, opts, extraParents) {
    const chem = getChem();
    const n = mol.atoms.length;
    const rings = chem.rings(mol);
    const ringBonds = {};
    rings.forEach((r, k) => r.forEach((a, i) => {
      const b = mol.bondAt(a, r[(i + 1) % r.length]);
      (ringBonds[b.i] = ringBonds[b.i] || []).push(k);
    }));
    const G = {
      mol, n, N: n, rings, ringBonds, el: [], parent: [], adj: [], bonds: [], bm: {}, opts, inRing: new Array(n).fill(false),
    };
    mol.atoms.forEach((a, i) => { G.el.push(a.el); G.parent.push(-1); G.adj.push(mol.nbr[i].slice()); });
    rings.forEach((r) => r.forEach((a) => { G.inRing[a] = true; }));
    const addBond = (a, b, order, ring, bi, extra) => {
      const o = { a, b, order, ring, bi, extra };
      G.bonds.push(o);
      G.bm[a < b ? a + '_' + b : b + '_' + a] = o;
      return o;
    };
    mol.bonds.forEach((b) => addBond(b.a, b.b, b.kek, !!ringBonds[b.i], b.i, false));
    const addH = (p) => {
      const k = G.N++;
      G.el.push('H');
      G.parent.push(p);
      G.adj.push([p]);
      G.adj[p].push(k);
      addBond(p, k, 1, false, -1, true);
    };
    if (extraParents) {
      extraParents.forEach(addH);
    } else if (opts.allH) {
      mol.atoms.forEach((a, i) => { for (let j = 0; j < a.h; j++) addH(i); });
    } else {
      // a stereocentre whose bonds to heavy atoms all lie in rings shows its H as an atom
      mol.atoms.forEach((a, i) => {
        if (!validCentre(a) || a.ord.indexOf(-1) < 0) return;
        if (mol.nbr[i].every((w) => G.bm[i < w ? i + '_' + w : w + '_' + i].ring)) addH(i);
      });
    }
    G.bond = (a, b) => G.bm[a < b ? a + '_' + b : b + '_' + a] || null;
    // ring systems
    const uf = [];
    for (let i = 0; i < G.N; i++) uf.push(i);
    const find = (x) => { while (uf[x] !== x) { uf[x] = uf[uf[x]]; x = uf[x]; } return x; };
    rings.forEach((r) => r.forEach((a) => { uf[find(a)] = find(r[0]); }));
    const byRoot = {};
    G.systems = [];
    G.sysOf = new Array(G.N).fill(-1);
    rings.forEach((r) => {
      const root = find(r[0]);
      if (byRoot[root] === undefined) { byRoot[root] = G.systems.length; G.systems.push({ rings: [], atoms: [] }); }
      const s = G.systems[byRoot[root]];
      s.rings.push(r);
      r.forEach((a) => { if (s.atoms.indexOf(a) < 0) { s.atoms.push(a); G.sysOf[a] = byRoot[root]; } });
    });
    return G;
  }

  function components(G) {
    const seen = new Array(G.N).fill(false);
    const out = [];
    for (let s = 0; s < G.N; s++) {
      if (seen[s]) continue;
      const comp = [];
      const q = [s];
      seen[s] = true;
      while (q.length) {
        const v = q.pop();
        comp.push(v);
        G.adj[v].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      }
      comp.sort((a, b) => a - b);
      out.push(comp);
    }
    return out;
  }

  // atoms on the other side of the bond (a, b), starting at b; null if a is reachable (a ring bond)
  function sideOf(G, a, b) {
    const seen = {};
    seen[b] = true;
    const q = [b];
    const out = [];
    while (q.length) {
      const v = q.pop();
      out.push(v);
      for (const w of G.adj[v]) {
        if (v === b && w === a) continue;
        if (w === a) return null;
        if (!seen[w]) { seen[w] = true; q.push(w); }
      }
    }
    return out;
  }

  // ------------------------------------------------------------------
  // Ring systems: regular polygons, fused by sharing an edge
  // ------------------------------------------------------------------

  const polyR = (n) => L / (2 * Math.sin(PI / n));
  const polyApo = (n) => L / (2 * Math.tan(PI / n));

  function layoutSystem(rings) {
    const p = {};
    const rc = [];
    const done = rings.map(() => false);
    let first = 0;
    const score = (r) => (r.length === 6 ? 100 : r.length);
    rings.forEach((r, i) => { if (score(r) > score(rings[first])) first = i; });
    const centroid = (r) => {
      let x = 0;
      let y = 0;
      r.forEach((a) => { x += p[a].x; y += p[a].y; });
      return { x: x / r.length, y: y / r.length };
    };
    const place0 = (r) => {
      const n = r.length;
      const R = polyR(n);
      const off = n % 4 === 0 ? PI / n : 0;
      r.forEach((a, k) => {
        const th = -PI / 2 + off + (TAU * k) / n;
        p[a] = { x: R * Math.cos(th), y: R * Math.sin(th) };
      });
    };
    const polygon = (r, i0, centre, dirSign) => {
      const n = r.length;
      const A = p[r[i0]];
      const th0 = Math.atan2(A.y - centre.y, A.x - centre.x);
      const R = polyR(n);
      const out = {};
      for (let k = 0; k < n; k++) {
        const th = th0 + dirSign * (TAU * k) / n;
        out[r[(i0 + k) % n]] = { x: centre.x + R * Math.cos(th), y: centre.y + R * Math.sin(th) };
      }
      return out;
    };
    const edgePoly = (r, i) => {
      const n = r.length;
      const j = (i + 1) % n;
      const A = p[r[i]];
      const B = p[r[j]];
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const ex = (B.x - A.x) / L;
      const ey = (B.y - A.y) / L;
      let nx = -ey;
      let ny = ex;
      let side = 0;
      r.forEach((a) => {
        if (p[a] && a !== r[i] && a !== r[j]) side += nx * (p[a].x - mid.x) + ny * (p[a].y - mid.y);
      });
      if (side === 0) {
        for (let k = 0; k < rings.length; k++) {
          if (!done[k] || rings[k] === r || !rc[k]) continue;
          if (rings[k].indexOf(r[i]) >= 0 && rings[k].indexOf(r[j]) >= 0) {
            side = -(nx * (rc[k].x - mid.x) + ny * (rc[k].y - mid.y));
            break;
          }
        }
      }
      if (side < 0) { nx = -nx; ny = -ny; }
      const apo = polyApo(n);
      const centre = { x: mid.x + nx * apo, y: mid.y + ny * apo };
      const th0 = Math.atan2(A.y - centre.y, A.x - centre.x);
      const th1 = Math.atan2(B.y - centre.y, B.x - centre.x);
      const dirSign = sgn(wrap(th1 - th0)) || 1;
      const out = polygon(r, i, centre, dirSign);
      for (const a of r) if (p[a] && Math.hypot(p[a].x - out[a].x, p[a].y - out[a].y) > 3) return null;
      return out;
    };
    const spiro = (r, i0) => {
      const n = r.length;
      const A = p[r[i0]];
      let sx = 0;
      let sy = 0;
      let cnt = 0;
      Object.keys(p).forEach((k) => {
        const a = +k;
        if (a === r[i0]) return;
        const d = Math.hypot(p[a].x - A.x, p[a].y - A.y);
        if (d < L * 1.05) { sx += (p[a].x - A.x) / d; sy += (p[a].y - A.y) / d; cnt++; }
      });
      let len = Math.hypot(sx, sy);
      let dx;
      let dy;
      if (len < 0.1) { dx = 1; dy = 0; } else { dx = -sx / len; dy = -sy / len; }
      len = polyR(n);
      const centre = { x: A.x + dx * len, y: A.y + dy * len };
      const out = polygon(r, i0, centre, 1);
      r.forEach((a) => { if (!p[a]) p[a] = out[a]; });
      return cnt >= 0;
    };
    const arcFill = (r) => {
      const n = r.length;
      let cx = 0;
      let cy = 0;
      let cn = 0;
      Object.keys(p).forEach((k) => { cx += p[k].x; cy += p[k].y; cn++; });
      cx /= cn;
      cy /= cn;
      let i = 0;
      // start at a placed atom followed by an unplaced one
      for (let k = 0; k < n; k++) if (p[r[k]] && !p[r[(k + 1) % n]]) { i = k; break; }
      let k = 1;
      while (k < n) {
        if (p[r[(i + k) % n]]) { k++; continue; }
        let e = k;
        while (e < n && !p[r[(i + e) % n]]) e++;
        const A = p[r[(i + k - 1) % n]];
        const B = p[r[(i + e) % n]];
        const cnt = e - k;
        const D = Math.hypot(B.x - A.x, B.y - A.y);
        const h = 0.5 * Math.sqrt(Math.max(0, ((cnt + 1) * L) ** 2 - D * D)) * 0.9;
        let nx = -(B.y - A.y) / (D || 1);
        let ny = (B.x - A.x) / (D || 1);
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2;
        if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }
        for (let j = 1; j <= cnt; j++) {
          const t = j / (cnt + 1);
          const bulge = h * Math.sin(PI * t);
          p[r[(i + k + j - 1) % n]] = { x: A.x + (B.x - A.x) * t + nx * bulge, y: A.y + (B.y - A.y) * t + ny * bulge };
        }
        k = e + 1;
      }
    };
    const relax = () => {
      const cons = [];
      const seen = {};
      rings.forEach((r) => {
        const n = r.length;
        for (let a = 0; a < n; a++) {
          for (let b = a + 1; b < n; b++) {
            const kk = Math.min(b - a, n - (b - a));
            const key = Math.min(r[a], r[b]) + '_' + Math.max(r[a], r[b]);
            if (seen[key]) continue;
            seen[key] = true;
            cons.push([r[a], r[b], (L * Math.sin((kk * PI) / n)) / Math.sin(PI / n)]);
          }
        }
      });
      const ids = Object.keys(p).map(Number);
      for (let it = 0; it < 600; it++) {
        for (const [a, b, d0] of cons) {
          const dx = p[b].x - p[a].x;
          const dy = p[b].y - p[a].y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const f = ((d - d0) / d) * 0.25;
          p[a].x += dx * f; p[a].y += dy * f;
          p[b].x -= dx * f; p[b].y -= dy * f;
        }
        for (let a = 0; a < ids.length; a++) {
          for (let b = a + 1; b < ids.length; b++) {
            const pa = p[ids[a]];
            const pb = p[ids[b]];
            if (seen[Math.min(ids[a], ids[b]) + '_' + Math.max(ids[a], ids[b])]) continue;
            const dx = pb.x - pa.x;
            const dy = pb.y - pa.y;
            const d = Math.hypot(dx, dy) || 1e-6;
            if (d < 0.7 * L) {
              const f = ((0.7 * L - d) / d) * 0.25;
              pa.x -= dx * f; pa.y -= dy * f;
              pb.x += dx * f; pb.y += dy * f;
            }
          }
        }
      }
    };

    done[first] = true;
    place0(rings[first]);
    rc[first] = centroid(rings[first]);
    let relaxed = false;
    for (let count = 1; count < rings.length; count++) {
      let best = -1;
      let bs = 0;
      rings.forEach((r, i) => {
        if (done[i]) return;
        const s = r.filter((a) => p[a]).length;
        if (s > bs) { bs = s; best = i; }
      });
      if (best < 0) break;
      const r = rings[best];
      done[best] = true;
      const pl = [];
      r.forEach((a, i) => { if (p[a]) pl.push(i); });
      let ok = false;
      if (pl.length === 1) {
        spiro(r, pl[0]);
        ok = true;
      } else {
        for (let i = 0; i < r.length && !ok; i++) {
          const j = (i + 1) % r.length;
          if (p[r[i]] && p[r[j]]) {
            const out = edgePoly(r, i);
            if (out) { r.forEach((a) => { if (!p[a]) p[a] = out[a]; }); ok = true; }
          }
        }
        if (!ok) arcFill(r);
      }
      if (!ok) relaxed = true;
      rc[best] = centroid(r);
    }
    if (relaxed) {
      relax();
      rings.forEach((r, i) => { rc[i] = centroid(r); });
    }
    return { p, relaxed };
  }

  // direction (local angle) in which a substituent leaves atom u of a laid-out ring system
  function exteriorAngle(sys, lay, u, G) {
    const P = lay.p;
    const ang = [];
    G.adj[u].forEach((w) => { if (P[w]) ang.push(Math.atan2(P[w].y - P[u].y, P[w].x - P[u].x)); });
    if (!ang.length) return 0;
    if (ang.length === 1) return ang[0] + PI;
    ang.sort((a, b) => a - b);
    const inside = (x, y, r) => {
      let c = false;
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const pi = P[r[i]];
        const pj = P[r[j]];
        if ((pi.y > y) !== (pj.y > y) && x < ((pj.x - pi.x) * (y - pi.y)) / (pj.y - pi.y) + pi.x) c = !c;
      }
      return c;
    };
    let best = null;
    for (let i = 0; i < ang.length; i++) {
      const a0 = ang[i];
      const a1 = i + 1 < ang.length ? ang[i + 1] : ang[0] + TAU;
      const gap = a1 - a0;
      const mid = a0 + gap / 2;
      const px = P[u].x + 8 * Math.cos(mid);
      const py = P[u].y + 8 * Math.sin(mid);
      const isIn = sys.rings.some((r) => inside(px, py, r));
      const key = (isIn ? 0 : 1000) + gap;
      if (!best || key > best.key) best = { key, mid };
    }
    return best.mid;
  }

  // ------------------------------------------------------------------
  // Labels and boxes
  // ------------------------------------------------------------------

  function isLabelled(G, i, opts) {
    const a = G.mol.atoms[i];
    if (i >= G.n) return true; // a drawn hydrogen
    if (a.el !== 'C') return true;
    if (a.charge !== 0) return true;
    if (opts.allH) return true;
    if (G.adj[i].length === 0) return true;
    return false;
  }

  function chargeText(q) {
    const m = Math.abs(q);
    return (m > 1 ? String(m) : '') + (q > 0 ? '+' : '−');
  }

  // geometry of the label of node i: boxes (main, H part), where the H part goes, charge box
  function makeLabel(G, i, pos, opts, present, forced) {
    const p = pos[i];
    const sym = G.el[i];
    const a = i < G.n ? G.mol.atoms[i] : null;
    const hN = a && !opts.allH ? a.h : 0;
    const mainW = symW(sym);
    let sx = 0;
    let cnt = 0;
    G.adj[i].forEach((w) => {
      if (!present(w)) return;
      const d = Math.hypot(pos[w].x - p.x, pos[w].y - p.y) || 1;
      sx += (pos[w].x - p.x) / d;
      cnt++;
    });
    const hFirst = cnt === 0 && ['O', 'S', 'F', 'Cl', 'Br', 'I'].indexOf(sym) >= 0; // HCl, H2O
    const side = forced || (hN > 0 && (hFirst || (cnt > 0 && sx > 0.3)) ? 'left' : 'right');
    const lab = {
      node: i, sym, hN, side, mainW, x: p.x, y: p.y, boxes: [], cls: 'atom el-' + sym,
    };
    const hh = 9.5;
    lab.boxes.push({ x0: p.x - mainW / 2 - 1, x1: p.x + mainW / 2 + 1, y0: p.y - hh, y1: p.y + hh });
    if (hN > 0) {
      const hw = symW('H') + (hN > 1 ? subW(hN) : 0);
      if (side === 'right') lab.boxes.push({ x0: p.x + mainW / 2 + 1, x1: p.x + mainW / 2 + 1 + hw, y0: p.y - hh, y1: p.y + hh + 2 });
      else lab.boxes.push({ x0: p.x - mainW / 2 - 1 - hw, x1: p.x - mainW / 2 - 1, y0: p.y - hh, y1: p.y + hh + 2 });
    }
    lab.hw = hN > 0 ? symW('H') + (hN > 1 ? subW(hN) : 0) : 0;
    let x0 = Infinity;
    let x1 = -Infinity;
    lab.boxes.forEach((b) => { x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); });
    lab.ux0 = x0;
    lab.ux1 = x1;
    if (a && a.charge !== 0) {
      const t = chargeText(a.charge);
      const cw = t.length * 8.5 + 1;
      // candidate corners: upper right, upper left, lower right, lower left
      const cands = [
        { x: x1 + 0.5, y: p.y - 6, ang: -PI / 4 },
        { x: x0 - cw - 0.5, y: p.y - 6, ang: (-3 * PI) / 4 },
        { x: x1 + 0.5, y: p.y + 14, ang: PI / 4 },
        { x: x0 - cw - 0.5, y: p.y + 14, ang: (3 * PI) / 4 },
      ];
      let pick = null;
      cands.forEach((c) => {
        let clear = PI;
        G.adj[i].forEach((w) => {
          if (!present(w)) return;
          const bd = Math.atan2(pos[w].y - p.y, pos[w].x - p.x);
          clear = Math.min(clear, Math.abs(wrap(bd - c.ang)));
        });
        if (!pick || clear > pick.clear + 0.35) pick = Object.assign({ clear }, c);
      });
      lab.charge = { text: t, x: pick.x, y: pick.y, w: cw, box: { x0: pick.x, x1: pick.x + cw, y0: pick.y - 10, y1: pick.y + 2 } };
    }
    return lab;
  }

  function clipLen(lab, dx, dy) {
    if (!lab) return 0;
    const pad = 2.2;
    const inside = (x, y) => lab.boxes.some((b) => x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad);
    let t = 0;
    while (t < 26 && inside(lab.x + dx * t, lab.y + dy * t)) t += 0.5;
    return t;
  }

  // ------------------------------------------------------------------
  // Analysis: labels, bond segments, quality
  // ------------------------------------------------------------------

  function analyse(G, pos, opts, nodes, withTexts) {
    const present = (w) => !!pos[w] && nodeSet[w] === true;
    const nodeSet = {};
    nodes.forEach((i) => { if (pos[i]) nodeSet[i] = true; });
    const lab = {};
    nodes.forEach((i) => {
      if (pos[i] && isLabelled(G, i, opts)) lab[i] = makeLabel(G, i, pos, opts, present);
    });
    // the H of a label faces the other way when it would run into another label
    const runsInto = (l) => {
      const mine = l.boxes.concat(l.charge ? [l.charge.box] : []);
      return Object.keys(lab).some((k) => {
        if (+k === l.node) return false;
        const o = lab[k];
        return mine.some((b) => o.boxes.concat(o.charge ? [o.charge.box] : []).some((c) => b.x0 < c.x1 && c.x0 < b.x1 && b.y0 < c.y1 && c.y0 < b.y1));
      });
    };
    Object.keys(lab).forEach((k) => {
      const l = lab[k];
      if (l.hN > 0 && runsInto(l)) {
        const alt = makeLabel(G, +k, pos, opts, present, l.side === 'left' ? 'right' : 'left');
        if (!runsInto(alt)) lab[k] = alt;
      }
    });
    const segs = [];
    G.bonds.forEach((b) => {
      if (!present(b.a) || !present(b.b)) return;
      const A = pos[b.a];
      const B = pos[b.b];
      const len = Math.hypot(B.x - A.x, B.y - A.y) || 1e-6;
      const ux = (B.x - A.x) / len;
      const uy = (B.y - A.y) / len;
      const s = clipLen(lab[b.a], ux, uy);
      const e = clipLen(lab[b.b], -ux, -uy);
      segs.push({ b, ux, uy, len, s, e, x1: A.x + ux * s, y1: A.y + uy * s, x2: B.x - ux * e, y2: B.y - uy * e });
    });
    // counts
    let overlaps = 0;
    const list = nodes.filter((i) => pos[i]);
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        if (Math.hypot(pos[list[a]].x - pos[list[b]].x, pos[list[a]].y - pos[list[b]].y) < L * 0.5) overlaps++;
      }
    }
    let crossings = 0;
    const orient = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    for (let i = 0; i < segs.length; i++) {
      const si = segs[i].b;
      const Ai = pos[si.a];
      const Bi = pos[si.b];
      for (let j = i + 1; j < segs.length; j++) {
        const sj = segs[j].b;
        const Aj = pos[sj.a];
        const Bj = pos[sj.b];
        const shared = si.a === sj.a || si.a === sj.b || si.b === sj.a || si.b === sj.b;
        if (shared) {
          const common = si.a === sj.a || si.a === sj.b ? si.a : si.b;
          const o1 = si.a === common ? si.b : si.a;
          const o2 = sj.a === common ? sj.b : sj.a;
          const a1 = Math.atan2(pos[o1].y - pos[common].y, pos[o1].x - pos[common].x);
          const a2 = Math.atan2(pos[o2].y - pos[common].y, pos[o2].x - pos[common].x);
          if (Math.abs(wrap(a1 - a2)) < 0.26) crossings++;
          continue;
        }
        const d1 = orient(Ai.x, Ai.y, Bi.x, Bi.y, Aj.x, Aj.y);
        const d2 = orient(Ai.x, Ai.y, Bi.x, Bi.y, Bj.x, Bj.y);
        const d3 = orient(Aj.x, Aj.y, Bj.x, Bj.y, Ai.x, Ai.y);
        const d4 = orient(Aj.x, Aj.y, Bj.x, Bj.y, Bi.x, Bi.y);
        if (d1 * d2 < 0 && d3 * d4 < 0) crossings++;
      }
      // an atom lying on a bond that is not its own
      for (const k of list) {
        if (k === si.a || k === si.b) continue;
        const vx = Bi.x - Ai.x;
        const vy = Bi.y - Ai.y;
        const l2 = vx * vx + vy * vy || 1e-6;
        let t = ((pos[k].x - Ai.x) * vx + (pos[k].y - Ai.y) * vy) / l2;
        t = Math.max(0, Math.min(1, t));
        if (Math.hypot(Ai.x + vx * t - pos[k].x, Ai.y + vy * t - pos[k].y) < 8) crossings++;
      }
    }
    // labels
    let labelClashes = 0;
    const boxes = [];
    Object.keys(lab).forEach((k) => {
      lab[k].boxes.forEach((bx) => boxes.push({ node: +k, bx }));
      if (lab[k].charge) boxes.push({ node: +k, bx: lab[k].charge.box, charge: true });
    });
    const hit = (p, q, pad) => p.x0 - pad < q.x1 && q.x0 - pad < p.x1 && p.y0 - pad < q.y1 && q.y0 - pad < p.y1;
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        if (boxes[a].node === boxes[b].node) continue;
        if (hit(boxes[a].bx, boxes[b].bx, 0.5)) labelClashes++;
      }
    }
    const segHitsBox = (s, bx, pad) => {
      // slab test of the clipped segment against the padded box
      let t0 = 0;
      let t1 = 1;
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const chk = (p, q0, q1, o) => {
        if (Math.abs(p) < 1e-9) return o >= q0 && o <= q1;
        let a = (q0 - o) / p;
        let b = (q1 - o) / p;
        if (a > b) { const tmp = a; a = b; b = tmp; }
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, b);
        return t0 <= t1;
      };
      return chk(dx, bx.x0 - pad, bx.x1 + pad, s.x1) && chk(dy, bx.y0 - pad, bx.y1 + pad, s.y1);
    };
    for (const s of segs) {
      for (const bo of boxes) {
        if (bo.node === s.b.a || bo.node === s.b.b) continue;
        if (segHitsBox(s, bo.bx, 0.5)) labelClashes++;
      }
    }
    for (const bo of boxes) {
      for (const k of list) {
        if (k === bo.node || lab[k]) continue;
        if (pos[k].x > bo.bx.x0 - 1 && pos[k].x < bo.bx.x1 + 1 && pos[k].y > bo.bx.y0 - 1 && pos[k].y < bo.bx.y1 + 1) labelClashes++;
      }
    }
    if (withTexts && (opts.numbers || opts.deltas)) labelClashes += placeTexts(G, pos, opts, { lab, segs }, []).clashes;
    // a soft measure of crowding, for the search only
    let soft = 0;
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const d = Math.hypot(pos[list[a]].x - pos[list[b]].x, pos[list[a]].y - pos[list[b]].y);
        if (d < 34 && !G.bond(list[a], list[b])) soft += ((34 - d) * (34 - d)) / 20;
      }
    }
    return { lab, segs, q: { overlaps, crossings, labelClashes }, soft };
  }

  function quality(mol, pos, opts) {
    mol = asMol(mol);
    opts = opts || {};
    const n = mol.atoms.length;
    const extra = [];
    for (let i = n; i < pos.length; i++) extra.push(pos[i].h);
    const G = buildGraph(mol, opts, extra);
    const nodes = [];
    for (let i = 0; i < Math.min(G.N, pos.length); i++) nodes.push(i);
    return analyse(G, pos, opts, nodes, true).q;
  }

  // ------------------------------------------------------------------
  // Double bond geometry wanted by the SMILES
  // ------------------------------------------------------------------

  function above(mol, x, y) { // is y drawn above x, along the marked bond x-y
    const b = mol.bondAt(x, y);
    return b.a === x ? b.dir === '/' : b.dir === '\\';
  }

  function doubleConstraints(mol) {
    const chem = getChem();
    const inRing = {};
    chem.rings(mol).forEach((r) => r.forEach((a, i) => { inRing[mol.bondAt(a, r[(i + 1) % r.length]).i] = true; }));
    const out = [];
    mol.bonds.forEach((b) => {
      if (b.kek !== 2 || inRing[b.i]) return;
      const refU = mol.nbr[b.a].find((w) => w !== b.b && mol.bondAt(b.a, w).dir);
      const refV = mol.nbr[b.b].find((w) => w !== b.a && mol.bondAt(b.b, w).dir);
      if (refU === undefined || refV === undefined) return;
      out.push({ u: b.a, v: b.b, a: refU, b: refV, cis: above(mol, b.a, refU) === above(mol, b.b, refV) });
    });
    return out;
  }

  function consOK(c, pos) {
    if (!pos[c.u] || !pos[c.v] || !pos[c.a] || !pos[c.b]) return true;
    const ax = pos[c.v].x - pos[c.u].x;
    const ay = pos[c.v].y - pos[c.u].y;
    const sa = ax * (pos[c.a].y - pos[c.u].y) - ay * (pos[c.a].x - pos[c.u].x);
    const sb = ax * (pos[c.b].y - pos[c.v].y) - ay * (pos[c.b].x - pos[c.v].x);
    if (Math.abs(sa) < 1e-6 || Math.abs(sb) < 1e-6) return true;
    return (sa * sb > 0) === c.cis;
  }

  // ------------------------------------------------------------------
  // Layout of one connected component
  // ------------------------------------------------------------------

  function layoutComponent(G, comp, pos, opts, cons, fixed) {
    const placed = G.placed;
    const turn = G.turn;
    const ortho = !!opts.allH;
    const sizeCache = {};
    const branchSize = (u, v) => {
      const key = u + ',' + v;
      if (sizeCache[key] !== undefined) return sizeCache[key];
      const seen = { [v]: true, [u]: true };
      const q = [u];
      let c = 0;
      while (q.length) {
        const x = q.pop();
        c++;
        G.adj[x].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      }
      sizeCache[key] = c;
      return c;
    };
    const sysLocal = (sys) => {
      if (!sys.lay) sys.lay = layoutSystem(sys.rings);
      return sys.lay;
    };
    const isLinear = (v, total) => {
      if (total !== 2 || G.inRing[v]) return false;
      let dbl = 0;
      let trip = 0;
      G.adj[v].forEach((w) => { const o = G.bond(v, w).order; if (o === 3) trip++; if (o === 2) dbl++; });
      return trip > 0 || dbl > 1;
    };
    const clearOf = (q, v) => {
      let m = 1e9;
      comp.forEach((x) => { if (placed[x] && x !== v) m = Math.min(m, Math.hypot(pos[x].x - q.x, pos[x].y - q.y)); });
      return m;
    };
    const putAt = (u, v, a) => {
      pos[u] = { x: pos[v].x + L * Math.cos(a), y: pos[v].y + L * Math.sin(a) };
      if (u >= G.n) pos[u].h = G.parent[u];
      placed[u] = true;
    };
    let expand;
    const placeSystemAt = (u, v, a) => {
      const sys = G.systems[G.sysOf[u]];
      const lay = sysLocal(sys);
      const lu = lay.p[u];
      const beta = exteriorAngle(sys, lay, u, G);
      const phi = a + PI - beta;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const tx = pos[v].x + L * Math.cos(a);
      const ty = pos[v].y + L * Math.sin(a);
      sys.atoms.forEach((x) => {
        const q = lay.p[x];
        const dx = q.x - lu.x;
        const dy = q.y - lu.y;
        pos[x] = { x: tx + dx * c - dy * s, y: ty + dx * s + dy * c };
        placed[x] = true;
      });
      if (lay.relaxed) G.relaxedFlag = true;
      return sys;
    };
    expand = (v) => {
      const P = [];
      const U = [];
      G.adj[v].forEach((w) => (placed[w] ? P : U).push(w));
      if (!U.length) return;
      const pa = P.map((w) => Math.atan2(pos[w].y - pos[v].y, pos[w].x - pos[v].x));
      const sz = {};
      U.forEach((w) => { sz[w] = branchSize(w, v); });
      U.sort((x, y) => sz[y] - sz[x] || x - y);
      const k = U.length;
      const total = P.length + k;
      const linear = isLinear(v, total);
      const tv = turn[v] || 1;
      let slots;
      if (P.length === 0) {
        if (k === 1) slots = [0];
        else if (k === 2) slots = linear ? [0, PI] : [-PI / 3, PI / 3];
        else if (k === 3) slots = [0, (2 * PI) / 3, (-2 * PI) / 3];
        else if (k === 4) slots = [0, PI / 2, PI, -PI / 2];
        else slots = U.map((_, j) => (TAU * j) / k);
        U.forEach((w, j) => { turn[w] = -tv; if (slots[j] === undefined) slots[j] = 0; });
      } else if (linear && P.length === 1 && k === 1) {
        slots = [pa[0] + PI];
        turn[U[0]] = -tv;
      } else if (P.length === 1 && k === 1) {
        const inA = pa[0] + PI;
        const step = ortho && !G.inRing[v] ? PI / 2 : PI / 3;
        const pref = -tv;
        const cand = [pref, -pref].map((s) => {
          const a = inA + s * step;
          return { s, a, clear: clearOf({ x: pos[v].x + L * Math.cos(a), y: pos[v].y + L * Math.sin(a) }, v) };
        });
        const pick = cand[1].clear > cand[0].clear + 6 ? cand[1] : cand[0];
        slots = [pick.a];
        turn[U[0]] = pick.s;
      } else if (P.length === 1 && ortho && !G.inRing[v] && k === 2) {
        const inA = pa[0] + PI;
        const s = -tv;
        slots = [inA, inA + s * (PI / 2)];
        turn[U[0]] = -tv;
        turn[U[1]] = tv;
      } else {
        const sorted = pa.slice().sort((x, y) => x - y);
        let bestGap = -1;
        let start = 0;
        for (let i = 0; i < sorted.length; i++) {
          const a0 = sorted[i];
          const a1 = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + TAU;
          if (a1 - a0 > bestGap + 1e-9) { bestGap = a1 - a0; start = a0; }
        }
        slots = [];
        if (P.length >= 2 && k === 2 && bestGap > 3.3 && !ortho) {
          // two substituents on a ring atom: 60 degrees apart, either side of the outward direction
          slots.push(start + bestGap / 2 - PI / 6, start + bestGap / 2 + PI / 6);
        } else {
          for (let j = 0; j < k; j++) slots.push(start + (bestGap * (j + 1)) / (k + 1));
        }
        if (P.length === 1) {
          const inA = pa[0] + PI;
          slots.sort((x, y) => Math.abs(wrap(x - inA)) - Math.abs(wrap(y - inA)) || (sgn(wrap(y - inA)) === -tv ? 1 : -1));
        }
        const inA = (P.length === 1 ? pa[0] + PI : start + bestGap / 2);
        U.forEach((w, j) => { turn[w] = sgn(Math.sin(slots[j] - inA)) || -tv; });
      }
      U.forEach((w, j) => {
        if (G.sysOf[w] >= 0 && !placed[w]) placeSystemAt(w, v, slots[j]);
        else putAt(w, v, slots[j]);
      });
      U.forEach((w) => {
        if (G.sysOf[w] >= 0) {
          const sys = G.systems[G.sysOf[w]];
          if (!sys.expanded) {
            sys.expanded = true;
            sys.atoms.forEach((x) => expand(x));
          }
        } else {
          expand(w);
        }
      });
    };

    // ---- placement
    const sysIds = {};
    comp.forEach((x) => { if (G.sysOf[x] >= 0) sysIds[G.sysOf[x]] = true; });
    const sysList = Object.keys(sysIds).map(Number);
    if (fixed) {
      comp.forEach((x) => { placed[x] = x < G.n; });
      comp.filter((x) => x < G.n).forEach((x) => expand(x));
      return;
    }
    if (sysList.length) {
      let root = sysList[0];
      sysList.forEach((s) => { if (G.systems[s].atoms.length > G.systems[root].atoms.length) root = s; });
      const sys = G.systems[root];
      const lay = sysLocal(sys);
      sys.atoms.forEach((x) => { pos[x] = { x: lay.p[x].x, y: lay.p[x].y }; placed[x] = true; turn[x] = 1; });
      if (lay.relaxed) G.relaxedFlag = true;
      sys.expanded = true;
      sys.atoms.forEach((x) => expand(x));
    } else {
      // an end of the longest chain
      const bfs = (s) => {
        const dist = {};
        dist[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) G.adj[q[h]].forEach((w) => { if (dist[w] === undefined) { dist[w] = dist[q[h]] + 1; q.push(w); } });
        return dist;
      };
      const farthest = (dist) => {
        let best = -1;
        Object.keys(dist).map(Number).sort((a, b) => a - b).forEach((x) => { if (best < 0 || dist[x] > dist[best]) best = x; });
        return best;
      };
      const f1 = farthest(bfs(comp[0]));
      const f2 = farthest(bfs(f1));
      const root = Math.min(f1, f2) === f1 || f1 < f2 ? Math.min(f1, f2) : f2;
      pos[root] = { x: 0, y: 0 };
      if (root >= G.n) pos[root].h = G.parent[root];
      placed[root] = true;
      turn[root] = 1;
      expand(root);
    }
  }

  // ------------------------------------------------------------------
  // Improving a component: stereo of double bonds, flips and rotations of branches
  // ------------------------------------------------------------------

  function transform(pos, nodes, fn) {
    nodes.forEach((x) => { const r = fn(pos[x]); pos[x].x = r.x; pos[x].y = r.y; });
  }
  function mirrorAbout(A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    return (q) => {
      const rx = q.x - A.x;
      const ry = q.y - A.y;
      const d = rx * ux + ry * uy;
      return { x: A.x + 2 * d * ux - rx, y: A.y + 2 * d * uy - ry };
    };
  }
  function rotateAbout(A, th) {
    const c = Math.cos(th);
    const s = Math.sin(th);
    return (q) => ({ x: A.x + (q.x - A.x) * c - (q.y - A.y) * s, y: A.y + (q.x - A.x) * s + (q.y - A.y) * c });
  }

  function improve(G, comp, pos, opts, cons) {
    const nodes = comp.filter((x) => pos[x]);
    const evalPos = () => analyse(G, pos, opts, nodes);
    const total = (r) => (r.q.overlaps + r.q.crossings + r.q.labelClashes) * 1000 + r.soft;
    const consAll = () => cons.every((c) => consOK(c, pos));
    // acyclic bonds and the smaller side of each
    const bridges = [];
    G.bonds.forEach((b) => {
      if (b.ring) return;
      if (!pos[b.a] || !pos[b.b] || nodes.indexOf(b.a) < 0) return;
      const s1 = sideOf(G, b.a, b.b);
      if (!s1) return;
      const s2 = sideOf(G, b.b, b.a);
      if (s1.length <= s2.length) bridges.push({ b, u: b.a, v: b.b, T: s1 });
      else bridges.push({ b, u: b.b, v: b.a, T: s2 });
    });
    bridges.sort((x, y) => x.T.length - y.T.length);
    // double bonds with a wanted geometry that the placement did not give: mirror one side
    cons.forEach((c) => {
      if (consOK(c, pos)) return;
      const br = bridges.find((x) => (x.b.a === c.u && x.b.b === c.v) || (x.b.a === c.v && x.b.b === c.u));
      if (br) transform(pos, br.T, mirrorAbout(pos[br.u], pos[br.v]));
    });
    let cur = evalPos();
    let curT = total(cur);
    if (curT === 0) return cur;
    let evals = 0;
    const MAX = 3500;
    // moves, cheapest first: the cost keeps the drawing on its angle lattice unless a clash needs more
    const moveList = (br, small) => {
      const mv = [];
      if (br.b.order <= 2) mv.push({ fn: mirrorAbout(pos[br.u], pos[br.v]), pen: 0.2 });
      const angs = opts.allH
        ? [[PI / 2, 0.4], [-PI / 2, 0.4], [PI, 0.6]]
        : (small ? [[PI / 3, 0.4], [-PI / 3, 0.4], [PI, 0.6]]
          : [[PI / 3, 0.4], [-PI / 3, 0.4], [(2 * PI) / 3, 0.5], [(-2 * PI) / 3, 0.5], [PI, 0.6], [PI / 2, 3], [-PI / 2, 3], [PI / 6, 3], [-PI / 6, 3]]);
      angs.forEach(([a, pen]) => mv.push({ fn: rotateAbout(pos[br.u], a), pen }));
      return mv;
    };
    const tryMove = (br, fn) => {
      const saved = br.T.map((x) => ({ x: pos[x].x, y: pos[x].y }));
      transform(pos, br.T, fn);
      let s = Infinity;
      if (consAll()) { evals++; s = total(evalPos()); }
      br.T.forEach((x, i) => { pos[x].x = saved[i].x; pos[x].y = saved[i].y; });
      return s;
    };
    const apply = (br, fn) => transform(pos, br.T, fn);
    for (let pass = 0; pass < 6 && curT > 0 && evals < MAX; pass++) {
      let improved = false;
      for (const br of bridges) {
        if (evals >= MAX) break;
        let best = null;
        for (const mv of moveList(br, false)) {
          const s = tryMove(br, mv.fn);
          if (s + mv.pen < curT - 1e-6 && (!best || s + mv.pen < best.k)) best = { s, k: s + mv.pen, fn: mv.fn };
        }
        if (best) { apply(br, best.fn); curT = best.s; improved = true; if (curT === 0) break; }
      }
      if (!improved) break;
    }
    // pairs of moves, when a clash is left
    if (curT >= 1000 && evals < MAX) {
      let done = false;
      for (let i = 0; i < bridges.length && !done && evals < MAX * 1.6; i++) {
        for (let j = i + 1; j < bridges.length && !done && evals < MAX * 1.6; j++) {
          for (const m1 of moveList(bridges[i], true)) {
            const saved = bridges[i].T.map((x) => ({ x: pos[x].x, y: pos[x].y }));
            apply(bridges[i], m1.fn);
            for (const m2 of moveList(bridges[j], true)) {
              const s = tryMove(bridges[j], m2.fn);
              if (s < curT - 1e-6) { apply(bridges[j], m2.fn); curT = s; done = true; break; }
            }
            if (done) break;
            bridges[i].T.forEach((x, k) => { pos[x].x = saved[k].x; pos[x].y = saved[k].y; });
          }
        }
      }
    }
    return evalPos();
  }

  // ------------------------------------------------------------------
  // The whole layout
  // ------------------------------------------------------------------

  function orientComp(G, comp, pos, opts) {
    const hv = comp.filter((x) => x < G.n && pos[x]);
    if (hv.length < 2) return;
    let cx = 0;
    let cy = 0;
    hv.forEach((x) => { cx += pos[x].x; cy += pos[x].y; });
    cx /= hv.length;
    cy /= hv.length;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    hv.forEach((x) => {
      const dx = pos[x].x - cx;
      const dy = pos[x].y - cy;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    });
    const tr = sxx + syy;
    const det = sxx * syy - sxy * sxy;
    const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const l1 = tr / 2 + disc;
    const l2 = tr / 2 - disc;
    let alpha = 0;
    if (l1 > 1.25 * Math.max(l2, 1e-9)) {
      const phi = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      const step = opts.allH ? PI / 2 : PI / 6;
      alpha = -Math.round(phi / step) * step;
    }
    const rot = rotateAbout({ x: cx, y: cy }, alpha);
    comp.forEach((x) => { if (pos[x]) { const r = rot(pos[x]); pos[x].x = r.x; pos[x].y = r.y; } });
    const first = hv[0];
    if (hv.length > 1 && pos[first].x > cx + 1e-6) {
      const r180 = rotateAbout({ x: cx, y: cy }, PI);
      comp.forEach((x) => { if (pos[x]) { const r = r180(pos[x]); pos[x].x = r.x; pos[x].y = r.y; } });
    }
  }

  function layoutAll(G, opts) {
    const pos = new Array(G.N).fill(null);
    G.placed = new Array(G.N).fill(false);
    G.turn = new Array(G.N).fill(0);
    G.relaxedFlag = false;
    const cons = doubleConstraints(G.mol);
    const comps = components(G);
    if (Array.isArray(opts.coords) && opts.coords.length >= G.n) {
      for (let i = 0; i < G.n; i++) pos[i] = { x: opts.coords[i][0] * L, y: opts.coords[i][1] * L };
      comps.forEach((comp) => {
        comp.forEach((x) => { G.placed[x] = x < G.n; });
        layoutComponent(G, comp, pos, opts, cons, true);
      });
    } else {
      const boxes = [];
      comps.forEach((comp) => {
        layoutComponent(G, comp, pos, opts, cons, false);
        improve(G, comp, pos, opts, cons.filter((c) => comp.indexOf(c.u) >= 0));
        orientComp(G, comp, pos, opts);
        // bounding box of the component with room for labels
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;
        comp.forEach((x) => {
          if (!pos[x]) return;
          x0 = Math.min(x0, pos[x].x - 14); x1 = Math.max(x1, pos[x].x + 14);
          y0 = Math.min(y0, pos[x].y - 12); y1 = Math.max(y1, pos[x].y + 12);
        });
        boxes.push({ comp, x0, x1, y0, y1 });
      });
      // side by side, centred vertically
      let cursor = 0;
      boxes.forEach((b, k) => {
        const dx = (k === 0 ? 0 : cursor + 36) - b.x0;
        const dy = -(b.y0 + b.y1) / 2;
        b.comp.forEach((x) => { if (pos[x]) { pos[x].x += dx; pos[x].y += dy; } });
        cursor = b.x1 + dx;
      });
    }
    return { pos, relaxed: G.relaxedFlag };
  }

  function applyView(pos, opts) {
    const rot = Number(opts.rotate) || 0;
    pos.forEach((p) => {
      if (!p) return;
      if (rot) {
        const th = (rot * PI) / 180;
        const c = Math.cos(th);
        const s = Math.sin(th);
        const x = p.x * c - p.y * s;
        const y = p.x * s + p.y * c;
        p.x = x; p.y = y;
      }
      if (opts.flip === 'x') p.x = -p.x;
      if (opts.flip === 'y') p.y = -p.y;
    });
  }

  function layout(mol, opts) {
    mol = asMol(mol);
    opts = opts || {};
    const G = buildGraph(mol, opts);
    const res = layoutAll(G, opts);
    applyView(res.pos, opts);
    res.pos.forEach((p) => { p.x = num(p.x); p.y = num(p.y); });
    return { pos: res.pos, relaxed: res.relaxed };
  }

  // ------------------------------------------------------------------
  // Stereo: wedges and hashes from the SMILES parity
  // ------------------------------------------------------------------

  const ZK = 25;

  // sign of the signed volume of the four neighbour vectors, in the SMILES order of the atom:
  // negative = '@' (anticlockwise from the first), positive = '@@'
  function chiralVolume(vs) {
    const a = [vs[1][0] - vs[0][0], vs[1][1] - vs[0][1], vs[1][2] - vs[0][2]];
    const b = [vs[2][0] - vs[0][0], vs[2][1] - vs[0][1], vs[2][2] - vs[0][2]];
    const c = [vs[3][0] - vs[0][0], vs[3][1] - vs[0][1], vs[3][2] - vs[0][2]];
    return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }

  // vecs: for each entry of atom.ord, [dx, dy(screen), z] or null for an implicit hydrogen
  function volumeOf(vecs) {
    const v = vecs.map((x) => (x ? [x[0], -x[1], x[2]] : null));
    const hi = v.indexOf(null);
    if (hi >= 0) {
      let sx = 0;
      let sy = 0;
      let sz = 0;
      v.forEach((x) => { if (x) { sx += x[0]; sy += x[1]; sz += x[2]; } });
      let hx = -sx;
      let hy = -sy;
      let hz = -sz;
      const l = Math.hypot(hx, hy, hz);
      if (l < 1e-6) { hx = 0; hy = 0; hz = -1; } else { hx = (hx / l) * ZK; hy = (hy / l) * ZK; hz = (hz / l) * ZK; }
      v[hi] = [hx, hy, hz];
    }
    return chiralVolume(v);
  }

  function assignStereo(G, pos, opts) {
    const mol = G.mol;
    const wedges = {}; // 'from_to' -> { from, to, type }
    const usedBond = {};
    const hExtra = {};
    for (let i = G.n; i < G.N; i++) if (hExtra[G.parent[i]] === undefined) hExtra[G.parent[i]] = i;
    const centres = [];
    mol.atoms.forEach((a, i) => { if (validCentre(a)) centres.push(i); });
    const isCentre = {};
    centres.forEach((c) => { isCentre[c] = true; });
    const order = centres.slice().sort((x, y) => x - y);
    order.forEach((c) => {
      const a = mol.atoms[c];
      const ids = a.ord.map((x) => (x === -1 ? (hExtra[c] !== undefined ? hExtra[c] : null) : x));
      const want = a.chiral === '@' ? -1 : 1;
      const cands = [];
      ids.forEach((x, k) => {
        if (x === null) return;
        const b = G.bond(c, x);
        const isH = x >= G.n;
        const nb = isH ? 0 : branchSizeOf(G, x, c);
        cands.push({ x, k, key: [isH ? 0 : 1, b.ring ? 1 : 0, isCentre[x] ? 1 : 0, usedBond[Math.min(c, x) + '_' + Math.max(c, x)] ? 1 : 0, nb, x] });
      });
      cands.sort((p, q) => {
        for (let i = 0; i < p.key.length; i++) if (p.key[i] !== q.key[i]) return p.key[i] - q.key[i];
        return 0;
      });
      const base = ids.map((x) => (x === null ? null : [pos[x].x - pos[c].x, pos[x].y - pos[c].y, 0]));
      const test = (zs) => {
        const vecs = base.map((v) => (v ? v.slice() : null));
        zs.forEach(([k, z]) => { vecs[k][2] = z; });
        const vol = volumeOf(vecs);
        return Math.sign(vol) === want && Math.abs(vol) > 800;
      };
      const free = cands.filter((cd) => !usedBond[Math.min(c, cd.x) + '_' + Math.max(c, cd.x)]);
      const pool = free.length ? free : cands;
      const hasH = ids.some((x) => x === null || (x !== undefined && x >= G.n));
      let chosen = null;
      const singles = () => {
        for (const cd of pool) {
          for (const z of [ZK, -ZK]) if (test([[cd.k, z]])) return [[cd, z]];
        }
        return null;
      };
      const nonRing = pool.filter((cd) => !G.bond(c, cd.x).ring);
      const pairs = (from) => {
        for (let i = 0; i < from.length; i++) {
          for (let j = i + 1; j < from.length; j++) {
            for (const z of [ZK, -ZK]) if (test([[from[i].k, z], [from[j].k, -z]])) return [[from[i], z], [from[j], -z]];
          }
        }
        return null;
      };
      // a wedge and a hash on two bonds of a chain centre; one wedge on the substituent of a ring centre
      chosen = hasH ? (singles() || pairs(pool)) : (nonRing.length >= 2 ? (pairs(nonRing) || singles() || pairs(pool)) : (singles() || pairs(pool)));
      if (!chosen) return;
      chosen.forEach(([cd, z]) => {
        wedges[c + '_' + cd.x] = { from: c, to: cd.x, type: z > 0 ? 'wedge' : 'hash' };
        usedBond[Math.min(c, cd.x) + '_' + Math.max(c, cd.x)] = true;
      });
    });
    return wedges;
  }

  function branchSizeOf(G, u, v) {
    const seen = { [v]: true, [u]: true };
    const q = [u];
    let c = 0;
    while (q.length) {
      const x = q.pop();
      c++;
      G.adj[x].forEach((w) => { if (!seen[w]) { seen[w] = true; q.push(w); } });
      if (c > 200) break;
    }
    return c;
  }

  function stereoOf(mol, atoms, svg) {
    const z = {};
    const walkV = (v) => {
      if (!v || v.text !== undefined) return;
      const cls = String((v.a && v.a.class) || '').split(/\s+/);
      if (cls.indexOf('wedge') >= 0 || cls.indexOf('hash') >= 0) {
        z[v.a['data-from'] + '_' + v.a['data-to']] = cls.indexOf('wedge') >= 0 ? ZK : -ZK;
      }
      (v.c || []).forEach(walkV);
    };
    walkV(svg);
    const hOf = {};
    for (let i = mol.atoms.length; i < atoms.length; i++) if (atoms[i].h !== undefined && hOf[atoms[i].h] === undefined) hOf[atoms[i].h] = i;
    const out = {};
    mol.atoms.forEach((a, c) => {
      if (!validCentre(a)) return;
      const vecs = a.ord.map((x) => {
        const id = x === -1 ? hOf[c] : x;
        if (id === undefined) return null;
        return [atoms[id].x - atoms[c].x, atoms[id].y - atoms[c].y, z[c + '_' + id] || 0];
      });
      const vol = volumeOf(vecs);
      if (Math.abs(vol) < 100) return;
      out[c] = vol < 0 ? '@' : '@@';
    });
    return out;
  }

  function readStereo(drawing) {
    return stereoOf(drawing.mol, drawing.atoms, drawing.svg);
  }

  function readCisTrans(drawing) {
    const mol = drawing.mol;
    const pos = drawing.atoms;
    return doubleConstraints(mol).map((c) => {
      const ax = pos[c.v].x - pos[c.u].x;
      const ay = pos[c.v].y - pos[c.u].y;
      const sa = ax * (pos[c.a].y - pos[c.u].y) - ay * (pos[c.a].x - pos[c.u].x);
      const sb = ax * (pos[c.b].y - pos[c.v].y) - ay * (pos[c.b].x - pos[c.v].x);
      return { u: c.u, v: c.v, a: c.a, b: c.b, drawn: sa * sb > 0 ? 'cis' : 'trans', wanted: c.cis ? 'cis' : 'trans' };
    });
  }

  // ------------------------------------------------------------------
  // Condensed formula
  // ------------------------------------------------------------------

  function condensedOf(mol) {
    const chem = getChem();
    if (mol.atoms.some((a) => a.comp !== 0)) return null;
    if (chem.rings(mol).length) return null;
    const A = mol.atoms;
    const nb = mol.nbr;
    const hStr = (h) => (h > 0 ? 'H' + (h > 1 ? h : '') : '');
    const chg = (a) => (a.charge === 0 ? '' : (a.charge > 0 ? '+' : '-').repeat(1) + (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : ''));
    if (A.length === 1) {
      const a = A[0];
      if (a.h > 0 && (a.el === 'O' || a.el === 'S')) return 'H' + (a.h > 1 ? a.h : '') + a.el + chg(a);
      if (a.h > 0 && ['F', 'Cl', 'Br', 'I'].indexOf(a.el) >= 0) return 'H' + a.el + chg(a);
      return a.el + hStr(a.h) + chg(a);
    }
    const terminal = (i) => A[i].el !== 'C' && nb[i].length === 1;
    const inIn = A.map((a, i) => !terminal(i));
    const inNb = (i) => nb[i].filter((w) => inIn[w]);
    const keep = A.map((_, i) => i).filter((i) => inIn[i]);
    if (!keep.length) return null;
    // longest path of the chain atoms, from the lowest-numbered end
    const bfs = (s) => {
      const dist = { [s]: 0 };
      const q = [s];
      for (let h = 0; h < q.length; h++) inNb(q[h]).forEach((w) => { if (dist[w] === undefined) { dist[w] = dist[q[h]] + 1; q.push(w); } });
      return dist;
    };
    let best = null;
    keep.forEach((s) => {
      if (inNb(s).length > 1) return;
      const dist = bfs(s);
      const far = Object.keys(dist).map(Number).sort((x, y) => dist[y] - dist[x] || x - y)[0];
      if (!best || dist[far] > best.d) best = { s, d: dist[far] };
    });
    if (!best) best = { s: keep[0], d: 0 };
    const depthMemo = {};
    const depth = (v, p) => {
      const key = v + ',' + p;
      if (depthMemo[key] !== undefined) return depthMemo[key];
      let d = 0;
      inNb(v).forEach((w) => { if (w !== p) d = Math.max(d, 1 + depth(w, v)); });
      depthMemo[key] = d;
      return d;
    };
    const bsym = (o) => (o === 2 ? '=' : o === 3 ? '≡' : '');
    const subStr = (w) => A[w].el + hStr(A[w].h) + chg(A[w]);
    function chain(v, p) {
      const a = A[v];
      const kids = inNb(v).filter((w) => w !== p);
      let inline = '';
      const parts = [];
      nb[v].filter((w) => w !== p && terminal(w)).forEach((w) => {
        const o = mol.bondAt(v, w).order;
        if (a.el === 'C' && ((o === 2 && (A[w].el === 'O' || A[w].el === 'S')) || (o === 3 && A[w].el === 'N'))) inline += A[w].el;
        else parts.push(subStr(w));
      });
      let main = null;
      if (kids.length) {
        const ks = kids.slice().sort((x, y) => depth(y, v) - depth(x, v) || x - y);
        main = ks[0];
        ks.slice(1).forEach((w) => parts.push(bsym(mol.bondAt(v, w).order) + chain(w, v)));
      }
      // identical groups are merged: (CH3)2, F3
      const groups = [];
      parts.forEach((s) => {
        const g = groups.find((x) => x.s === s);
        if (g) g.n++; else groups.push({ s, n: 1 });
      });
      let txt = a.el + hStr(a.h) + inline + chg(a);
      groups.forEach((g, gi) => {
        const bare = /^[A-Z][a-z]?$/.test(g.s);
        const last = gi === groups.length - 1;
        if (bare && g.n > 1) txt += g.s + g.n;
        else if (main === null && last && g.n === 1) txt += g.s;
        else txt += '(' + g.s + ')' + (g.n > 1 ? g.n : '');
      });
      if (main !== null) txt += bsym(mol.bondAt(v, main).order) + chain(main, v);
      return txt;
    }
    return chain(best.s, -1);
  }

  function condensed(mol) {
    return condensedOf(asMol(mol));
  }

  // ------------------------------------------------------------------
  // SVG
  // ------------------------------------------------------------------

  const node = (t, a, c) => {
    const o = { t };
    if (a) o.a = a;
    if (c) o.c = c;
    return o;
  };

  function labelNode(lab, ox, oy) {
    const x = lab.x + ox;
    const y = lab.y + oy;
    const kids = [];
    let anchor = 'middle';
    let ax = x;
    if (lab.hN > 0) {
      const sub = (n) => node('tspan', { dy: 4, 'font-size': SUBFONT }, [{ text: String(n) }]);
      if (lab.side === 'right') {
        anchor = 'start';
        ax = x - lab.mainW / 2;
        kids.push({ text: lab.sym }, { text: 'H' });
        if (lab.hN > 1) kids.push(sub(lab.hN));
      } else {
        anchor = 'end';
        ax = x + lab.mainW / 2;
        kids.push({ text: 'H' });
        if (lab.hN > 1) kids.push(sub(lab.hN));
        kids.push(node('tspan', { dy: lab.hN > 1 ? -4 : 0 }, [{ text: lab.sym }]));
      }
    } else {
      kids.push({ text: lab.sym });
    }
    return node('text', { class: lab.cls, x: num(ax), y: num(y + 6), 'text-anchor': anchor }, kids);
  }

  // ------------------------------------------------------------------
  // Atom numbers and delta labels: the freest spot around each atom
  // ------------------------------------------------------------------

  function labelReach(l, th) {
    if (!l) return 3;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    let t = 0;
    while (t < 30 && l.boxes.some((b) => l.x + dx * t > b.x0 && l.x + dx * t < b.x1 && l.y + dy * t > b.y0 && l.y + dy * t < b.y1)) t += 0.5;
    return t;
  }

  function textRequests(G, opts) {
    const mol = G.mol;
    const out = [];
    const nm = opts.numbers;
    if (nm === 'all') mol.atoms.forEach((_, i) => out.push({ i, text: String(i + 1), cls: 'num' }));
    else if (Array.isArray(nm)) nm.forEach((i) => { if (mol.atoms[i]) out.push({ i, text: String(i + 1), cls: 'num' }); });
    else if (nm && typeof nm === 'object') Object.keys(nm).forEach((k) => { if (mol.atoms[+k]) out.push({ i: +k, text: String(nm[k]), cls: 'num' }); });
    if (opts.deltas) {
      Object.keys(opts.deltas).forEach((k) => {
        if (mol.atoms[+k]) out.push({ i: +k, text: 'δ' + (opts.deltas[k] === '+' ? '+' : '−'), cls: 'delta' });
      });
    }
    return out;
  }

  // Each label goes where it has the most room from bonds (double-bond lines included), labels,
  // atoms and extra points (lone pair dots); closer to its atom when the room is the same.
  function placeTexts(G, pos, opts, an, extraPts) {
    const items = [];
    let clashes = 0;
    const boxes = [];
    Object.keys(an.lab).forEach((k) => {
      an.lab[k].boxes.forEach((b) => boxes.push(b));
      if (an.lab[k].charge) boxes.push(an.lab[k].charge.box);
    });
    const pts = [];
    for (let i = 0; i < G.N; i++) if (pos[i]) pts.push(pos[i]);
    (extraPts || []).forEach((p) => pts.push(p));
    const samples = [];
    an.segs.forEach((sg) => {
      const len = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1);
      const n = Math.max(1, Math.ceil(len / 3));
      const pad = 2.5 + (sg.b.order > 1 ? GAP * (sg.b.order - 1) / 2 + 1 : 0);
      for (let k = 0; k <= n; k++) samples.push({ x: sg.x1 + ((sg.x2 - sg.x1) * k) / n, y: sg.y1 + ((sg.y2 - sg.y1) * k) / n, pad });
    });
    const rectPoint = (b, x, y) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1));
    const clearance = (b) => {
      let m = 1e9;
      samples.forEach((q) => { m = Math.min(m, rectPoint(b, q.x, q.y) - q.pad); });
      pts.forEach((q) => { m = Math.min(m, rectPoint(b, q.x, q.y) - 2); });
      boxes.forEach((c) => {
        m = Math.min(m, Math.hypot(Math.max(0, c.x0 - b.x1, b.x0 - c.x1), Math.max(0, c.y0 - b.y1, b.y0 - c.y1)));
      });
      return m;
    };
    textRequests(G, opts).forEach((rq) => {
      const w = Math.max(7, rq.text.length * 7.2);
      const h = 10;
      let best = null;
      for (let a = 0; a < 24; a++) {
        const th = -PI / 2 + (TAU * a) / 24 + PI / 24;
        const half = Math.abs(Math.cos(th)) * w / 2 + Math.abs(Math.sin(th)) * h / 2;
        const base = labelReach(an.lab[rq.i], th) + half;
        for (const extra of [2, 5, 8, 11, 14, 17]) {
          const r = base + extra;
          const cx = pos[rq.i].x + Math.cos(th) * r;
          const cy = pos[rq.i].y + Math.sin(th) * r;
          const box = { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
          const clear = clearance(box);
          const score = Math.min(clear, 12) * 10 - extra * 0.8;
          if (!best || score > best.score) best = { score, cx, cy, box, clear };
        }
      }
      if (best.clear < 3) clashes++;
      boxes.push(best.box);
      items.push({ i: rq.i, text: rq.text, cls: rq.cls, x: best.cx, y: best.cy, w, box: best.box });
    });
    return { items, clashes };
  }

  function buildSvg(G, pos, wedges, opts, view) {
    const mol = G.mol;
    const nodes = [];
    for (let i = 0; i < G.N; i++) nodes.push(i);
    const an = analyse(G, pos, opts, nodes);
    const lab = an.lab;
    const segOf = {};
    an.segs.forEach((s) => { segOf[s.b.a + '_' + s.b.b] = s; });

    // aromatic rings drawn as circles
    const circleRing = [];
    if (opts.circle) {
      G.rings.forEach((r, k) => {
        if (r.length === 6 && getChem().isAromaticRing(mol, r)) circleRing[k] = true;
      });
    }
    const inCircle = (b) => (G.ringBonds[b.bi] || []).some((k) => circleRing[k]);

    // items are collected in layout coordinates; the offset is applied at the end
    const items = { hl: [], bonds: [], atoms: [], charges: [], lps: [], nums: [], hits: [] };
    const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const grow = (x0, y0, x1, y1) => {
      box.x0 = Math.min(box.x0, x0); box.y0 = Math.min(box.y0, y0);
      box.x1 = Math.max(box.x1, x1); box.y1 = Math.max(box.y1, y1);
    };
    const pts = []; // coordinate-bearing builders: fn(ox, oy) -> VNode
    const emit = (list, fn) => list.push(fn);

    // bonds
    const ringCentre = (k) => {
      const r = G.rings[k];
      let x = 0;
      let y = 0;
      r.forEach((a) => { x += pos[a].x; y += pos[a].y; });
      return { x: x / r.length, y: y / r.length };
    };
    const dblCount = (k) => G.rings[k].filter((a, i) => G.bond(a, G.rings[k][(i + 1) % G.rings[k].length]).order === 2).length;
    G.bonds.forEach((b) => {
      const s = segOf[Math.min(b.a, b.b) + '_' + Math.max(b.a, b.b)];
      if (!s) return;
      const A = pos[b.a];
      const B = pos[b.b];
      const nx = -s.uy;
      const ny = s.ux;
      const wd = wedges[b.a + '_' + b.b] || wedges[b.b + '_' + b.a];
      const line = (ox, oy, sh1, sh2) => {
        const x1 = s.x1 + s.ux * sh1 + nx * ox;
        const y1 = s.y1 + s.uy * sh1 + ny * ox;
        const x2 = s.x2 - s.ux * sh2 + nx * ox;
        const y2 = s.y2 - s.uy * sh2 + ny * ox;
        grow(Math.min(x1, x2) - 1, Math.min(y1, y2) - 1, Math.max(x1, x2) + 1, Math.max(y1, y2) + 1);
        emit(items.bonds, (dx, dy) => node('line', { class: 'bond', x1: num(x1 + dx), y1: num(y1 + dy), x2: num(x2 + dx), y2: num(y2 + dy) }));
      };
      if (wd) {
        const from = wd.from;
        const sx1 = from === b.a ? s.x1 : s.x2;
        const sy1 = from === b.a ? s.y1 : s.y2;
        const ex = from === b.a ? s.x2 : s.x1;
        const ey = from === b.a ? s.y2 : s.y1;
        const dlen = Math.hypot(ex - sx1, ey - sy1) || 1;
        const ux = (ex - sx1) / dlen;
        const uy = (ey - sy1) / dlen;
        const mx = -uy;
        const my = ux;
        grow(Math.min(sx1, ex) - 4, Math.min(sy1, ey) - 4, Math.max(sx1, ex) + 4, Math.max(sy1, ey) + 4);
        if (wd.type === 'wedge') {
          emit(items.bonds, (dx, dy) => node('path', {
            class: 'wedge',
            d: 'M' + num(sx1 + dx) + ' ' + num(sy1 + dy) + 'L' + num(ex + mx * 3.8 + dx) + ' ' + num(ey + my * 3.8 + dy) + 'L' + num(ex - mx * 3.8 + dx) + ' ' + num(ey - my * 3.8 + dy) + 'Z',
            'data-from': wd.from,
            'data-to': wd.to,
          }));
        } else {
          emit(items.bonds, (dx, dy) => {
            let d = '';
            const cnt = 7;
            for (let k = 1; k <= cnt; k++) {
              const t = k / (cnt + 0.6);
              const w = 0.7 + 3.3 * t;
              const cx = sx1 + (ex - sx1) * t;
              const cy = sy1 + (ey - sy1) * t;
              d += 'M' + num(cx - mx * w + dx) + ' ' + num(cy - my * w + dy) + 'L' + num(cx + mx * w + dx) + ' ' + num(cy + my * w + dy);
            }
            return node('path', { class: 'hash', d, 'data-from': wd.from, 'data-to': wd.to });
          });
        }
        return;
      }
      let order = b.order;
      if (order === 2 && inCircle(b)) order = 1;
      if (order === 1 || order === 1.5) { line(0, 0, 0, 0); return; }
      if (order === 3) {
        line(-GAP, 0, 0, 0); line(0, 0, 0, 0); line(GAP, 0, 0, 0);
        return;
      }
      // double bond
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      let side = 0; // +1: second line towards +normal, -1: towards -normal, 0: centred
      let shrink = 0;
      if (b.ring) {
        const rs = (G.ringBonds[b.bi] || []).slice().sort((p, q) => {
          const ap = circleRing[p] ? 0 : 1;
          const aq = circleRing[q] ? 0 : 1;
          return (G.rings[p].length === 6 ? 0 : 1) - (G.rings[q].length === 6 ? 0 : 1) || ap - aq || dblCount(q) - dblCount(p) || G.rings[p].length - G.rings[q].length;
        });
        const c = ringCentre(rs[0]);
        side = sgn(nx * (c.x - mid.x) + ny * (c.y - mid.y)) || 1;
        shrink = 3.6;
      } else {
        const others = G.adj[b.a].filter((w) => w !== b.b).concat(G.adj[b.b].filter((w) => w !== b.a));
        const otherDouble = (x, y) => G.adj[x].some((w) => w !== y && G.bond(x, w).order >= 2);
        const cumulated = otherDouble(b.a, b.b) || otherDouble(b.b, b.a);
        const terminal = G.adj[b.a].length === 1 || G.adj[b.b].length === 1;
        if (!terminal && !cumulated) {
          let left = 0;
          let right = 0;
          others.forEach((w) => { const d = nx * (pos[w].x - mid.x) + ny * (pos[w].y - mid.y); if (d > 0) left++; else right++; });
          side = left > right ? 1 : right > left ? -1 : 0;
        }
        shrink = 3.6;
      }
      if (side === 0) { line(-GAP / 2, 0, 0, 0); line(GAP / 2, 0, 0, 0); } else { line(0, 0, 0, 0); line(side * GAP, 0, shrink, shrink); }
    });
    // aromatic circles
    G.rings.forEach((r, k) => {
      if (!circleRing[k]) return;
      const c = ringCentre(k);
      const rad = polyApo(r.length) - 7;
      grow(c.x - rad - 1, c.y - rad - 1, c.x + rad + 1, c.y + rad + 1);
      emit(items.bonds, (dx, dy) => node('circle', { class: 'bond', cx: num(c.x + dx), cy: num(c.y + dy), r: num(rad) }));
    });

    // atoms
    Object.keys(lab).forEach((k) => {
      const l = lab[k];
      l.boxes.forEach((bx) => grow(bx.x0, bx.y0, bx.x1, bx.y1));
      emit(items.atoms, (dx, dy) => labelNode(l, dx, dy));
      if (l.charge) {
        const ch = l.charge;
        grow(ch.box.x0, ch.box.y0, ch.box.x1, ch.box.y1);
        emit(items.charges, (dx, dy) => node('text', { class: 'charge', x: num(ch.x + dx), y: num(ch.y + dy), 'text-anchor': 'start' }, [{ text: ch.text }]));
      }
    });
    nodes.forEach((i) => { grow(pos[i].x - 2, pos[i].y - 2, pos[i].x + 2, pos[i].y + 2); });

    // free directions around an atom (angles away from its bonds and label)
    const blocked = (i) => {
      const out = [];
      G.adj[i].forEach((w) => out.push(Math.atan2(pos[w].y - pos[i].y, pos[w].x - pos[i].x)));
      if (lab[i] && lab[i].hN > 0) out.push(lab[i].side === 'right' ? 0 : PI);
      if (lab[i] && lab[i].charge) {
        const cb = lab[i].charge.box;
        out.push(Math.atan2((cb.y0 + cb.y1) / 2 - pos[i].y, (cb.x0 + cb.x1) / 2 - pos[i].x));
      }
      return out;
    };
    // lone pairs: the angles with the most room from bonds, the charge and each other
    const lpPts = [];
    const lpList = opts.lonePairs === true ? mol.atoms.map((_, i) => i) : (Array.isArray(opts.lonePairs) ? opts.lonePairs : []);
    lpList.forEach((i) => {
      if (!mol.atoms[i]) return;
      const cnt = getChem().lonePairs(mol, i);
      if (!cnt) return;
      const obst = blocked(i);
      if (lab[i] && lab[i].hN > 0) {
        const hs = lab[i].side === 'right' ? 0 : PI;
        obst.push(hs - 0.45, hs + 0.45);
      }
      const grid = [];
      for (let a = 0; a < 24; a++) grid.push(-PI / 2 + (TAU * a) / 24);
      let bestSet = null;
      const rec = (start, chosen) => {
        if (chosen.length === cnt) {
          let m = PI;
          chosen.forEach((c, x) => {
            obst.forEach((o) => { m = Math.min(m, Math.abs(wrap(o - c))); });
            chosen.forEach((d, y) => { if (y > x) m = Math.min(m, Math.abs(wrap(d - c))); });
          });
          if (!bestSet || m > bestSet.m + 1e-9) bestSet = { m, set: chosen.slice() };
          return;
        }
        for (let g = start; g < grid.length; g++) { chosen.push(grid[g]); rec(g + 1, chosen); chosen.pop(); }
      };
      rec(0, []);
      bestSet.set.forEach((th) => {
        const r = labelReach(lab[i], th) + 5.5;
        const cx = pos[i].x + Math.cos(th) * r;
        const cy = pos[i].y + Math.sin(th) * r;
        const px = -Math.sin(th) * 2.6;
        const py = Math.cos(th) * 2.6;
        lpPts.push({ x: cx + px, y: cy + py }, { x: cx - px, y: cy - py });
        grow(cx - 5, cy - 5, cx + 5, cy + 5);
        emit(items.lps, (dx, dy) => node('g', { class: 'lp' }, [
          node('circle', { cx: num(cx + px + dx), cy: num(cy + py + dy), r: 1.7 }),
          node('circle', { cx: num(cx - px + dx), cy: num(cy - py + dy), r: 1.7 }),
        ]));
      });
    });

    // radicals: one dot per unpaired electron, in the freest direction
    mol.atoms.forEach((a, i) => {
      const cnt = radicalCount(mol, i);
      if (!cnt) return;
      const obst = blocked(i);
      if (lab[i] && lab[i].hN > 0) {
        const hs = lab[i].side === 'right' ? 0 : PI;
        obst.push(hs - 0.45, hs + 0.45);
      }
      const grid = [];
      for (let k = 0; k < 24; k++) grid.push(-PI / 2 + (TAU * k) / 24);
      let best = null;
      const rec = (start, chosen) => {
        if (chosen.length === cnt) {
          let m = PI;
          chosen.forEach((c, x) => {
            obst.forEach((o) => { m = Math.min(m, Math.abs(wrap(o - c))); });
            chosen.forEach((d, y) => { if (y > x) m = Math.min(m, Math.abs(wrap(d - c))); });
          });
          if (!best || m > best.m + 1e-9) best = { m, set: chosen.slice() };
          return;
        }
        for (let g = start; g < grid.length; g++) { chosen.push(grid[g]); rec(g + 1, chosen); chosen.pop(); }
      };
      rec(0, []);
      best.set.forEach((th) => {
        const r = labelReach(lab[i], th) + 5;
        const cx = pos[i].x + Math.cos(th) * r;
        const cy = pos[i].y + Math.sin(th) * r;
        lpPts.push({ x: cx, y: cy });
        grow(cx - 3, cy - 3, cx + 3, cy + 3);
        emit(items.lps, (dx, dy) => node('circle', { class: 'rad', fill: 'currentColor', cx: num(cx + dx), cy: num(cy + dy), r: 2.1 }));
      });
    });

    // numbers and delta labels
    placeTexts(G, pos, opts, an, lpPts).items.forEach((t) => {
      grow(t.box.x0, t.box.y0, t.box.x1, t.box.y1);
      emit(items.nums, (dx, dy) => node('text', { class: t.cls, x: num(t.x + dx), y: num(t.y + 4.5 + dy), 'text-anchor': 'middle' }, [{ text: t.text }]));
    });

    // highlights
    const hl = opts.highlight;
    if (hl) {
      const tone = [1, 2, 3, 4].indexOf(hl.tone) >= 0 ? hl.tone : 1;
      (hl.atoms || []).forEach((i) => {
        if (!pos[i]) return;
        grow(pos[i].x - 17, pos[i].y - 17, pos[i].x + 17, pos[i].y + 17);
        emit(items.hl, (dx, dy) => node('circle', { class: 'hl' + tone, cx: num(pos[i].x + dx), cy: num(pos[i].y + dy), r: 16 }));
      });
      (hl.bonds || []).forEach((bb) => {
        const A = pos[bb[0]];
        const B = pos[bb[1]];
        if (!A || !B) return;
        const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
        const nx = (-(B.y - A.y) / len) * 7;
        const ny = ((B.x - A.x) / len) * 7;
        grow(Math.min(A.x, B.x) - 8, Math.min(A.y, B.y) - 8, Math.max(A.x, B.x) + 8, Math.max(A.y, B.y) + 8);
        emit(items.hl, (dx, dy) => node('polygon', {
          class: 'hl' + tone,
          points: [[A.x + nx, A.y + ny], [B.x + nx, B.y + ny], [B.x - nx, B.y - ny], [A.x - nx, A.y - ny]].map((p) => num(p[0] + dx) + ',' + num(p[1] + dy)).join(' '),
        }));
      });
    }

    // tap targets
    if (opts.targets === 'atoms') {
      mol.atoms.forEach((a, i) => {
        grow(pos[i].x - 21, pos[i].y - 21, pos[i].x + 21, pos[i].y + 21);
        emit(items.hits, (dx, dy) => node('circle', {
          class: 'hit', cx: num(pos[i].x + dx), cy: num(pos[i].y + dy), r: 20, 'data-atom': i, tabindex: 0, role: 'button', 'aria-label': a.el + (i + 1),
        }));
      });
    } else if (opts.targets === 'bonds') {
      mol.bonds.forEach((b) => {
        const A = pos[b.a];
        const B = pos[b.b];
        const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
        const ux = (B.x - A.x) / len;
        const uy = (B.y - A.y) / len;
        const sh = Math.min(7, len / 4);
        grow(Math.min(A.x, B.x) - 12, Math.min(A.y, B.y) - 12, Math.max(A.x, B.x) + 12, Math.max(A.y, B.y) + 12);
        emit(items.hits, (dx, dy) => node('line', {
          class: 'hit', x1: num(A.x + ux * sh + dx), y1: num(A.y + uy * sh + dy), x2: num(B.x - ux * sh + dx), y2: num(B.y - uy * sh + dy),
          'data-bond': Math.min(b.a, b.b) + '-' + Math.max(b.a, b.b), tabindex: 0, role: 'button',
          'aria-label': mol.atoms[b.a].el + (b.a + 1) + '–' + mol.atoms[b.b].el + (b.b + 1),
        }));
      });
    }
    return { items, box };
  }

  function finishSvg(parts, w, h, ox, oy, scale) {
    const kids = [];
    const group = (cls, list) => {
      if (list.length) kids.push(node('g', { class: cls }, list.map((fn) => fn(ox, oy))));
    };
    group('hls', parts.hl);
    group('bonds', parts.bonds);
    group('atoms', parts.atoms);
    group('charges', parts.charges);
    group('lps', parts.lps);
    group('nums', parts.nums);
    group('hits', parts.hits);
    const W = num(w * scale);
    const H = num(h * scale);
    return node('svg', { xmlns: SVGNS, class: 'mol', viewBox: '0 0 ' + num(w) + ' ' + num(h), width: W, height: H }, kids);
  }

  function condensedDrawing(text, opts) {
    const kids = [];
    let wsum = 0;
    const re = /([A-Za-z()=≡]+|\d+|[+\-]+)/g;
    let m;
    let prev = '';
    while ((m = re.exec(text))) {
      const tok = m[1];
      if (/^\d+$/.test(tok) && /[A-Za-z)]$/.test(prev)) {
        kids.push(node('tspan', { dy: 4, 'font-size': SUBFONT }, [{ text: tok }]));
        kids.push(node('tspan', { dy: -4 }, [{ text: '' }]));
        wsum += subW(tok);
      } else if (/^[+-]+$/.test(tok) && prev) {
        kids.push(node('tspan', { dy: -6, 'font-size': SUBFONT }, [{ text: tok.replace(/-/g, '−') }]));
        kids.push(node('tspan', { dy: 6 }, [{ text: '' }]));
        wsum += subW(tok);
      } else {
        kids.push({ text: tok });
        wsum += symW(tok);
      }
      prev = tok;
    }
    const w = Math.ceil(wsum + 2 * PAD);
    const h = 40;
    const svg = node('svg', { xmlns: SVGNS, class: 'mol', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h }, [
      node('text', { class: 'atom', x: PAD, y: 26, 'text-anchor': 'start' }, kids),
    ]);
    return { svg, width: w, height: h, atoms: [], bondLength: L };
  }

  function molecule(input, opts) {
    let mol;
    let o = Object.assign({}, opts || {});
    if (input && typeof input === 'object' && typeof input.smi === 'string' && !input.atoms) {
      o = Object.assign({}, input.opts || {}, o);
      mol = getChem().parse(input.smi);
    } else {
      mol = asMol(input);
    }
    if (o.condensed) {
      const t = condensedOf(mol);
      if (t !== null) {
        const d = condensedDrawing(t, o);
        Object.defineProperty(d, 'mol', { value: mol, enumerable: false });
        return d;
      }
    }
    const G = buildGraph(mol, o);
    const res = layoutAll(G, o);
    const pos = res.pos;
    applyView(pos, o);
    const wedges = assignStereo(G, pos, o);
    const built = buildSvg(G, pos, wedges, o, null);
    const box = built.box;
    const pad = o.targets ? 6 : PAD;
    let w = Math.max(36, box.x1 - box.x0 + 2 * pad);
    let h = Math.max(36, box.y1 - box.y0 + 2 * pad);
    const ox = pad - box.x0 + (w - (box.x1 - box.x0 + 2 * pad)) / 2;
    const oy = pad - box.y0 + (h - (box.y1 - box.y0 + 2 * pad)) / 2;
    let scale = 1;
    if (o.maxWidth > 0 && w > o.maxWidth) scale = o.maxWidth / w;
    const svg = finishSvg(built.items, w, h, ox, oy, scale);
    const atoms = pos.map((p, i) => {
      const r = { x: num(p.x + ox), y: num(p.y + oy) };
      if (i >= G.n) r.h = G.parent[i];
      else if (radicalCount(mol, i)) r.radical = radicalCount(mol, i);
      return r;
    });
    w = num(w * scale);
    h = num(h * scale);
    const d = { svg, width: w, height: h, atoms, bondLength: L };
    if (scale !== 1) d.scale = scale;
    Object.defineProperty(d, 'mol', { value: mol, enumerable: false });
    d.relaxed = res.relaxed;
    return d;
  }

  // ------------------------------------------------------------------
  // VNode -> DOM / string
  // ------------------------------------------------------------------

  function toDom(v, doc) {
    if (v.text !== undefined) return doc.createTextNode(v.text);
    const el = doc.createElementNS(SVGNS, v.t);
    if (v.a) Object.keys(v.a).forEach((k) => { if (k !== 'xmlns') el.setAttribute(k, String(v.a[k])); });
    (v.c || []).forEach((k) => el.appendChild(toDom(k, doc)));
    return el;
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function toString(v) {
    if (v.text !== undefined) return esc(v.text).replace(/&quot;/g, '"');
    let s = '<' + v.t;
    if (v.a) Object.keys(v.a).forEach((k) => { s += ' ' + k + '="' + esc(v.a[k]) + '"'; });
    if (!v.c || !v.c.length) return s + (v.t === 'text' || v.t === 'tspan' ? '></' + v.t + '>' : '/>');
    return s + '>' + v.c.map(toString).join('') + '</' + v.t + '>';
  }

  ORG.draw = {
    molecule, layout, quality, condensed, toDom, toString, readStereo, readCisTrans,
  };
})(globalThis.ORG = globalThis.ORG || {});
