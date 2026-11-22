(function (ORG) {
  'use strict';

  // ====================================================================
  // Special views: Fischer and Newman projections, cyclohexane chairs,
  // reaction schemes, mechanisms with curved arrows and resonance structures.
  //
  //   fischer(spec)    spec = {smi, top, bottom} | {rows: [{left, right}], top, bottom}
  //   readFischer(spec) -> { atomIdx: 'R' | 'S' | null }  read back from the layout
  //   newman(spec)     spec = {front: [a, b, c], back: [a, b, c], angle}
  //   chair(spec)      spec = {subs: [{pos: 1..6, ax, label}], flip?}
  //   scheme(spec)     spec = {items, maxWidth?}
  //   mechanism(step)  step = {scheme, arrows: [{from, to, half?}]}
  //   resonance(mols)  mols joined by double-headed arrows
  //
  // Every view returns a Drawing { svg, width, height, atoms, bondLength }
  // (svg is a VNode, see ORG.draw.toDom). Text arguments of type T are
  // resolved by spec.lang (default 'lt'). No <marker>: arrowheads are paths.
  // Colours come from CSS classes (bond, atom, arrow, harrow, lp ...) of the
  // trainer; the few other shapes use var(--ink) / var(--pen) with a fallback.
  // ====================================================================

  const L = 40;
  const PI = Math.PI;
  const PAD = 14;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const INK = 'var(--ink, currentColor)';
  const PEN = 'var(--pen, #d21a6f)';

  const num = (x) => {
    const r = Math.round((Number.isFinite(x) ? x : 0) * 100) / 100;
    return r === 0 ? 0 : r;
  };
  const node = (t, a, c) => {
    const o = { t };
    if (a) o.a = a;
    if (c) o.c = c;
    return o;
  };
  const rad = (d) => (d * PI) / 180;

  function chemOf() {
    if (!ORG.chem) throw new Error('ORG.chem is not loaded');
    return ORG.chem;
  }
  function drawOf() {
    if (!ORG.draw) throw new Error('ORG.draw is not loaded');
    return ORG.draw;
  }

  // text of type T (string or {lt, en})
  function tx(v, lang) {
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
      const l = lang === 'en' ? 'en' : 'lt';
      const o = l === 'en' ? 'lt' : 'en';
      if (typeof v[l] === 'string') return v[l];
      if (typeof v[o] === 'string') return v[o];
    }
    return '';
  }

  // ------------------------------------------------------------------
  // Labels: parts = [{s, sub?, sup?}] rendered as tspans inside a <text>
  // ------------------------------------------------------------------

  const isLetter = (c) => /[A-Za-z]/.test(c);

  function parseLabel(str) {
    const s = String(str === undefined || str === null ? '' : str).replace(/\$/g, '');
    const parts = [];
    const push = (txt, kind) => {
      if (!txt) return;
      const last = parts[parts.length - 1];
      if (last && (last.sub ? 'sub' : last.sup ? 'sup' : '') === (kind || '')) { last.s += txt; return; }
      const p = { s: txt };
      if (kind === 'sub') p.sub = true;
      if (kind === 'sup') p.sup = true;
      parts.push(p);
    };
    let supMode = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      const prev = i > 0 ? s[i - 1] : '';
      const next = i + 1 < s.length ? s[i + 1] : '';
      if (c === '^') { supMode = !supMode; continue; }
      if (supMode) { push(c === '-' ? '−' : c, 'sup'); continue; }
      if (/[0-9]/.test(c) && (isLetter(prev) || prev === ')' || (parts.length && parts[parts.length - 1].sub && /[0-9]/.test(prev)))) { push(c, 'sub'); continue; }
      if ((c === '+' || c === '−' || c === '-') && (isLetter(prev) || /[0-9)]/.test(prev)) && (next === '' || /[\s,;)]/.test(next))) { push(c === '-' ? '−' : c, 'sup'); continue; }
      push(c, '');
    }
    return parts;
  }

  function partsWidth(parts, fs) {
    let w = 0;
    parts.forEach((p) => {
      for (const ch of p.s) {
        const base = p.sub || p.sup ? 0.42 : /[A-Z]/.test(ch) ? 0.64 : /[ilIjt.,;:()'!|]/.test(ch) ? 0.3 : /[mw]/.test(ch) ? 0.85 : ch === ' ' ? 0.3 : /[=+−\-≡]/.test(ch) ? 0.6 : 0.56;
        w += base * fs;
      }
    });
    return w;
  }

  function partsKids(parts, fs) {
    const kids = [];
    const sub = Math.round(fs * 0.7);
    parts.forEach((p) => {
      if (p.sub) {
        kids.push(node('tspan', { dy: num(fs * 0.24), 'font-size': sub }, [{ text: p.s }]));
        kids.push(node('tspan', { dy: num(-fs * 0.24) }, [{ text: '' }]));
      } else if (p.sup) {
        kids.push(node('tspan', { dy: num(-fs * 0.36), 'font-size': sub }, [{ text: p.s }]));
        kids.push(node('tspan', { dy: num(fs * 0.36) }, [{ text: '' }]));
      } else kids.push({ text: p.s });
    });
    return kids;
  }

  // a label drawn as <text class="atom"> (the trainer's bold ink text)
  function atomText(parts, x, y, anchor) {
    return node('text', { class: 'atom', x: num(x), y: num(y), 'text-anchor': anchor || 'middle' }, partsKids(parts, 17));
  }
  const LABEL_W = (parts) => partsWidth(parts, 17) + 1;

  // ------------------------------------------------------------------
  // Substituent labels from a molecule: tokens -> parts, either orientation
  // ------------------------------------------------------------------

  function ringAtomSet(mol) {
    const set = {};
    chemOf().rings(mol).forEach((r) => r.forEach((i) => { set[i] = r; }));
    return set;
  }

  function chargeText(c) {
    if (!c) return '';
    return (Math.abs(c) > 1 ? String(Math.abs(c)) : '') + (c > 0 ? '+' : '−');
  }

  function subtreeSize(mol, x, parent, ringSet, depth) {
    if (ringSet[x] || depth > 8) return 1;
    let n = 1;
    mol.nbr[x].forEach((k) => { if (k !== parent) n += subtreeSize(mol, k, x, ringSet, depth + 1); });
    return n;
  }

  function tokensOf(mol, x, parent, ringSet, depth) {
    const a = mol.atoms[x];
    if (ringSet[x]) {
      const ring = ringSet[x];
      const benzene = ring.length === 6 && ring.every((i) => mol.atoms[i].el === 'C' && mol.atoms[i].aromatic);
      return [{ el: benzene ? 'Ph' : 'R', h: 0, ch: 0 }];
    }
    if (depth > 6) return [{ el: 'R', h: 0, ch: 0 }];
    const out = [{ el: a.el, h: a.h, ch: a.charge }];
    const kids = mol.nbr[x].filter((k) => k !== parent).map((k) => ({
      k, order: mol.bondAt(x, k).order, size: subtreeSize(mol, k, x, ringSet, depth + 1),
    }));
    kids.sort((p, q) => (q.order > 1 ? 1 : 0) - (p.order > 1 ? 1 : 0) || p.size - q.size);
    const multi = kids.filter((k) => k.order > 1);
    const single = kids.filter((k) => k.order <= 1);
    multi.forEach((k) => {
      if (k.size > 1) out.push({ s: k.order === 3 ? '≡' : '=' });
      tokensOf(mol, k.k, x, ringSet, depth + 1).forEach((t) => out.push(t));
    });
    single.forEach((k, idx) => {
      const paren = idx < single.length - 1;
      if (paren) out.push({ s: '(' });
      tokensOf(mol, k.k, x, ringSet, depth + 1).forEach((t) => out.push(t));
      if (paren) out.push({ s: ')' });
    });
    return out;
  }

  function tokensToParts(tokens, side) {
    const toks = side === 'left' ? tokens.slice().reverse() : tokens;
    const parts = [];
    const add = (s, kind) => {
      const p = { s };
      if (kind === 'sub') p.sub = true;
      if (kind === 'sup') p.sup = true;
      const last = parts[parts.length - 1];
      if (last && !!last.sub === !!p.sub && !!last.sup === !!p.sup) last.s += s;
      else parts.push(p);
    };
    toks.forEach((t) => {
      if (t.s !== undefined) {
        add(side === 'left' && t.s === '(' ? ')' : side === 'left' && t.s === ')' ? '(' : t.s);
        return;
      }
      const hs = t.h > 0 && t.el !== 'Ph' && t.el !== 'R';
      const hpart = () => { if (hs) { add('H'); if (t.h > 1) add(String(t.h), 'sub'); } };
      if (side === 'left') hpart();
      add(t.el);
      if (t.ch) add(chargeText(t.ch), 'sup');
      if (side !== 'left') hpart();
    });
    return parts;
  }

  // ------------------------------------------------------------------
  // Fischer projection
  // ------------------------------------------------------------------

  const FDIR = { up: [0, 1, -1], down: [0, -1, -1], left: [-1, 0, 1], right: [1, 0, 1] };

  function det3(a, b, c) { // 3x3 determinant of the rows a, b, c
    return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  // '@' (counter-clockwise from the first neighbour) when negative
  function handedness(vs) {
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    return det3(sub(vs[1], vs[0]), sub(vs[2], vs[0]), sub(vs[3], vs[0]));
  }
  function tagFor(ord, place) { // place: {id -> vector}; ord has -1 for H (at most once for a centre)
    const vs = ord.map((id) => place[id]);
    return handedness(vs) < 0 ? '@' : '@@';
  }

  function pathBetween(mol, from, to) {
    const prev = {};
    prev[from] = -2;
    const q = [from];
    while (q.length) {
      const x = q.shift();
      if (x === to) break;
      mol.nbr[x].forEach((k) => { if (prev[k] === undefined) { prev[k] = x; q.push(k); } });
    }
    if (prev[to] === undefined) throw new Error('fischer: top and bottom are not connected');
    const out = [];
    for (let x = to; x !== -2; x = prev[x]) out.push(x);
    return out.reverse();
  }

  // The rows of a Fischer projection: for each interior atom its left and right
  // substituents (atom index or -1 for H), plus the labels.
  function fischerPlan(spec) {
    const lang = spec.lang;
    if (Array.isArray(spec.rows)) {
      return {
        rows: spec.rows.map((r) => ({ left: parseLabel(tx(r.left, lang)), right: parseLabel(tx(r.right, lang)) })),
        top: parseLabel(tx(spec.top, lang)),
        bottom: parseLabel(tx(spec.bottom, lang)),
        centres: [],
      };
    }
    const chem = chemOf();
    const mol = typeof spec.smi === 'string' ? chem.parse(spec.smi) : spec.mol;
    const path = pathBetween(mol, spec.top, spec.bottom);
    const rings = ringAtomSet(mol);
    const rows = [];
    const centres = [];
    for (let k = 1; k < path.length - 1; k++) {
      const c = path[k];
      const a = mol.atoms[c];
      const up = path[k - 1];
      const down = path[k + 1];
      let others = mol.nbr[c].filter((n) => n !== up && n !== down);
      for (let h = 0; h < a.h; h++) others.push(-1);
      others = others.slice(0, 2);
      let right = others[0];
      let left = others[1];
      const known = a.chiral && a.ord && a.ord.length === 4 && new Set(a.ord).size === 4 && others.length === 2 && left !== right;
      if (known) {
        const place = { [up]: FDIR.up, [down]: FDIR.down, [right]: FDIR.right, [left]: FDIR.left };
        if (a.ord.every((id) => place[id])) {
          if (tagFor(a.ord, place) !== a.chiral) { const t = right; right = left; left = t; }
        }
      }
      const dbl = others.length === 1 && right >= 0 && mol.bondAt(c, right).order >= 2;
      const parts = (id, side) => (id === undefined ? [] : id === -1 ? [{ s: 'H' }] : tokensToParts(tokensOf(mol, id, c, rings, 0), side));
      rows.push({ left: parts(left, 'left'), right: parts(right, 'right'), double: dbl });
      centres.push({ atom: c, up, down, left, right, ord: a.ord, chiral: a.chiral });
    }
    return {
      rows,
      top: tokensToParts(tokensOf(mol, path[0], path[1], rings, 0), 'right'),
      bottom: tokensToParts(tokensOf(mol, path[path.length - 1], path[path.length - 2], rings, 0), 'right'),
      centres,
      mol,
    };
  }

  function fischer(spec) {
    const plan = fischerPlan(spec);
    const S = 54;
    const A = 28;
    const GAPX = 5;
    const n = plan.rows.length + 2;
    const kids = [];
    let half = Math.max(A + 8, LABEL_W(plan.top) / 2, LABEL_W(plan.bottom) / 2);
    plan.rows.forEach((r) => {
      half = Math.max(half, A + GAPX + LABEL_W(r.left), A + GAPX + LABEL_W(r.right));
    });
    const W = Math.ceil(2 * half + 2 * PAD);
    const TOPR = 20;
    const H = Math.ceil((n - 1) * S + 2 * TOPR + 2 * PAD - 8);
    const cx = W / 2;
    const y0 = PAD + TOPR;
    const yN = y0 + (n - 1) * S;
    kids.push(node('line', { class: 'bond', x1: num(cx), y1: num(y0 - 2), x2: num(cx), y2: num(yN + 2) }));
    kids.push(atomText(plan.top, cx, y0 - 8, 'middle'));
    kids.push(atomText(plan.bottom, cx, yN + 21, 'middle'));
    plan.rows.forEach((r, i) => {
      const y = y0 + (i + 1) * S;
      const hasL = r.left.length > 0;
      const hasR = r.right.length > 0;
      if (hasL || hasR) {
        const x1 = hasL ? cx - A : cx;
        const x2 = hasR ? cx + A : cx;
        if (r.double) {
          kids.push(node('line', { class: 'bond', x1: num(x1), y1: num(y - 2.6), x2: num(x2), y2: num(y - 2.6) }));
          kids.push(node('line', { class: 'bond', x1: num(x1), y1: num(y + 2.6), x2: num(x2), y2: num(y + 2.6) }));
        } else kids.push(node('line', { class: 'bond', x1: num(x1), y1: num(y), x2: num(x2), y2: num(y) }));
      }
      if (hasL) kids.push(atomText(r.left, cx - A - GAPX, y + 6, 'end'));
      if (hasR) kids.push(atomText(r.right, cx + A + GAPX, y + 6, 'start'));
    });
    const svg = node('svg', { xmlns: SVGNS, class: 'mol fischer', viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, kids);
    return { svg, width: W, height: H, atoms: [], bondLength: L };
  }

  // Configuration of every Fischer centre as it is drawn (not as the SMILES says).
  function readFischer(spec) {
    const plan = fischerPlan(spec);
    const out = {};
    if (!plan.mol) return out;
    const chem = chemOf();
    plan.centres.forEach((c) => {
      const m = chem.parse(spec.smi);
      const place = { [c.up]: FDIR.up, [c.down]: FDIR.down, [c.right]: FDIR.right, [c.left]: FDIR.left };
      const ord = [c.up, c.down, c.left, c.right];
      if (new Set(ord).size !== 4 || !ord.every((id) => place[id])) { out[c.atom] = null; return; }
      const at = m.atoms[c.atom];
      at.ord = ord;
      at.chiral = tagFor(ord, place);
      let r = null;
      try { r = ORG.stereo ? ORG.stereo.cip(m, c.atom) : null; } catch (e) { r = null; }
      out[c.atom] = r;
    });
    return out;
  }

  // ------------------------------------------------------------------
  // Newman projection
  // ------------------------------------------------------------------

  function newman(spec) {
    const lang = spec.lang;
    const R = 28;
    const LEN = 28;
    const front = (spec.front || ['', '', '']).map((s) => parseLabel(tx(s, lang)));
    const back = (spec.back || ['', '', '']).map((s) => parseLabel(tx(s, lang)));
    const angle = Number.isFinite(+spec.angle) ? +spec.angle : 0;
    // clockwise from the top, y down
    const fa = [-90, 30, 150];
    const norm = (d) => ((d % 360) + 540) % 360 - 180;
    const ba = [0, 1, 2].map((i) => {
      let d = fa[i] + angle;
      // an eclipsed group is drawn a little to the side so that it stays visible
      let near = null;
      fa.forEach((f) => { if (Math.abs(norm(d - f)) < 12) near = f; });
      if (near !== null) { d = near + 12; }
      return d;
    });
    let lw = 0;
    front.concat(back).forEach((p) => { lw = Math.max(lw, LABEL_W(p)); });
    const out = R + LEN;
    const half = out + 8 + lw;
    const W = Math.ceil(2 * half + 2 * 6);
    const H = Math.ceil(2 * (out + 24) + 2 * 6);
    const cx = W / 2;
    const cy = H / 2;
    const kids = [];
    const labelAt = (parts, deg, dist) => {
      const c = Math.cos(rad(deg));
      const s = Math.sin(rad(deg));
      const x = cx + c * (dist + 4);
      let y = cy + s * (dist + 4);
      const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
      y += s > 0.3 ? 12 : s < -0.3 ? -4 : 6;
      return atomText(parts, x + (anchor === 'start' ? 2 : anchor === 'end' ? -2 : 0), y, anchor);
    };
    // back bonds first (behind), then circle, then front bonds
    ba.forEach((d) => {
      const c = Math.cos(rad(d));
      const s = Math.sin(rad(d));
      kids.push(node('line', { class: 'bond back', x1: num(cx + c * R), y1: num(cy + s * R), x2: num(cx + c * out), y2: num(cy + s * out) }));
    });
    kids.push(node('circle', { class: 'bond newman-circle', cx: num(cx), cy: num(cy), r: R }));
    fa.forEach((d) => {
      const c = Math.cos(rad(d));
      const s = Math.sin(rad(d));
      kids.push(node('line', { class: 'bond front', x1: num(cx), y1: num(cy), x2: num(cx + c * out), y2: num(cy + s * out) }));
    });
    fa.forEach((d, i) => kids.push(labelAt(front[i], d, out)));
    ba.forEach((d, i) => kids.push(labelAt(back[i], d, out)));
    const svg = node('svg', { xmlns: SVGNS, class: 'mol newman', viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, kids);
    return { svg, width: W, height: H, atoms: [], bondLength: L };
  }

  // ------------------------------------------------------------------
  // Cyclohexane chair
  // ------------------------------------------------------------------

  function chair(spec) {
    const lang = spec.lang;
    const SC = 34;
    const RR = 1.45;
    const ZZ = 0.25;
    const ELEV = rad(14);
    const TURN = rad(8);
    const flip = !!spec.flip;
    const ring3 = [];
    for (let k = 0; k < 6; k++) {
      const th = TURN - rad(60 * k);
      const z = (k % 2 === 0 ? 1 : -1) * ZZ * (flip ? -1 : 1);
      ring3.push({ th, x: RR * Math.cos(th), y: RR * Math.sin(th), z });
    }
    const proj = (x, y, z) => ({ x: x * SC, y: -(z * Math.cos(ELEV) + y * Math.sin(ELEV)) * SC });
    const P = ring3.map((a) => proj(a.x, a.y, a.z));
    const lines = [];
    const texts = [];
    const pts = P.map((p) => [p.x, p.y]);
    for (let k = 0; k < 6; k++) {
      const a = P[k];
      const b = P[(k + 1) % 6];
      lines.push(node('line', { class: 'bond ring', x1: num(a.x), y1: num(a.y), x2: num(b.x), y2: num(b.y) }));
    }
    const boxes = [];
    (spec.subs || []).forEach((s) => {
      const k = Math.round(+s.pos) - 1;
      if (!(k >= 0 && k < 6)) return;
      const a = ring3[k];
      const up = a.z > 0 ? 1 : -1;
      const ax = flip ? !s.ax : !!s.ax;
      const LEN = 1.15;
      let d;
      if (ax) d = [0, 0, up * LEN];
      else d = [Math.cos(a.th) * 0.943 * LEN, Math.sin(a.th) * 0.943 * LEN, -up * 0.333 * LEN];
      const e = proj(a.x + d[0], a.y + d[1], a.z + d[2]);
      lines.push(node('line', { class: ax ? 'bond sub ax' : 'bond sub eq', x1: num(P[k].x), y1: num(P[k].y), x2: num(e.x), y2: num(e.y) }));
      pts.push([e.x, e.y]);
      const parts = parseLabel(tx(s.label, lang));
      if (!parts.length) return;
      const w = LABEL_W(parts);
      const dx = e.x - P[k].x;
      let anchor = 'middle';
      let x = e.x;
      let y;
      if (ax) y = up > 0 ? e.y - 6 : e.y + 18;
      else {
        anchor = dx >= 0 ? 'start' : 'end';
        x = e.x + (dx >= 0 ? 4 : -4);
        y = e.y + (e.y > P[k].y ? 14 : e.y < P[k].y - 3 ? -2 : 6);
      }
      texts.push({ parts, x, y, anchor });
      const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x : x - w;
      boxes.push([x0, y - 14, x0 + w, y + 5]);
    });
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    pts.forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    boxes.forEach((b) => { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); });
    const W = Math.ceil(x1 - x0 + 2 * PAD);
    const H = Math.ceil(y1 - y0 + 2 * PAD);
    const ox = PAD - x0;
    const oy = PAD - y0;
    const shift = (v) => {
      if (v.t === 'line') return node('line', { class: v.a.class, x1: num(v.a.x1 + ox), y1: num(v.a.y1 + oy), x2: num(v.a.x2 + ox), y2: num(v.a.y2 + oy) });
      return v;
    };
    const kids = lines.map(shift).concat(texts.map((t) => atomText(t.parts, t.x + ox, t.y + oy, t.anchor)));
    const svg = node('svg', { xmlns: SVGNS, class: 'mol chair', viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, kids);
    const atoms = P.map((p) => ({ x: num(p.x + ox), y: num(p.y + oy) }));
    return { svg, width: W, height: H, atoms, bondLength: L };
  }

  // ------------------------------------------------------------------
  // Schemes
  // ------------------------------------------------------------------

  const PLUS_W = 30;
  const ARROW_MIN = 58;
  const LABFS = 14;

  function lines(v, lang) {
    const t = tx(v, lang);
    return t ? t.split('\n') : [];
  }

  function connectorBox(it, lang) {
    if (it.plus) return { kind: 'plus', w: PLUS_W, up: 8, down: 8 };
    const above = lines(it.above, lang).map(parseLabel);
    const below = lines(it.below, lang).map(parseLabel);
    let lw = 0;
    above.concat(below).forEach((p) => { lw = Math.max(lw, partsWidth(p, LABFS)); });
    const w = Math.max(it.arrow === '↔' ? 48 : ARROW_MIN, Math.ceil(lw + 18));
    const eq = it.arrow === '⇌';
    return {
      kind: 'arrow', type: it.arrow || '→', w, above, below,
      up: above.length ? 14 + 16 * above.length + (eq ? 4 : 0) : eq ? 10 : 8,
      down: below.length ? 14 + 16 * below.length + (eq ? 4 : 0) : eq ? 10 : 8,
    };
  }

  function connectorNodes(b, x, cy) {
    const out = [];
    if (b.kind === 'plus') {
      const cx = x + b.w / 2;
      out.push(node('path', { class: 'plus', d: 'M' + num(cx - 6) + ' ' + num(cy) + 'H' + num(cx + 6) + 'M' + num(cx) + ' ' + num(cy - 6) + 'V' + num(cy + 6), fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }));
      return out;
    }
    const x0 = x + 5;
    const x1 = x + b.w - 5;
    const stroke = { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' };
    const headR = (tx_, ty, dir, side) => { // filled head: tip at tx_, pointing dir (+1 right, -1 left); side: 0 both, +1 below, -1 above
      const bx = tx_ - dir * 10;
      const pts = side === 0
        ? 'M' + num(tx_) + ' ' + num(ty) + 'L' + num(bx) + ' ' + num(ty - 4.6) + 'L' + num(bx) + ' ' + num(ty + 4.6) + 'Z'
        : 'M' + num(tx_) + ' ' + num(ty) + 'L' + num(bx) + ' ' + num(ty + side * 5.2) + 'L' + num(bx) + ' ' + num(ty) + 'Z';
      return node('path', { class: 'rhead', d: pts, fill: INK, stroke: INK, 'stroke-width': 0.8, 'stroke-linejoin': 'round' });
    };
    if (b.type === '⇌') {
      out.push(node('line', Object.assign({ class: 'rline', x1: num(x0), y1: num(cy - 3.6), x2: num(x1), y2: num(cy - 3.6) }, stroke)));
      out.push(node('line', Object.assign({ class: 'rline', x1: num(x0), y1: num(cy + 3.6), x2: num(x1), y2: num(cy + 3.6) }, stroke)));
      out.push(headR(x1 + 1, cy - 3.6, 1, -1));
      out.push(headR(x0 - 1, cy + 3.6, -1, 1));
    } else if (b.type === '↔') {
      out.push(node('line', Object.assign({ class: 'rline', x1: num(x0 + 6), y1: num(cy), x2: num(x1 - 6), y2: num(cy) }, stroke)));
      out.push(headR(x1, cy, 1, 0));
      out.push(headR(x0, cy, -1, 0));
    } else {
      out.push(node('line', Object.assign({ class: 'rline', x1: num(x0), y1: num(cy), x2: num(x1 - 6), y2: num(cy) }, stroke)));
      out.push(headR(x1, cy, 1, 0));
    }
    const eq = b.type === '⇌';
    const lab = (parts, y) => node('text', { class: 'lab', x: num(x + b.w / 2), y: num(y), 'text-anchor': 'middle', 'font-size': LABFS, fill: INK }, partsKids(parts, LABFS));
    b.above.forEach((p, j) => out.push(lab(p, cy - 10 - (eq ? 4 : 0) - (b.above.length - 1 - j) * 16)));
    b.below.forEach((p, j) => out.push(lab(p, cy + 22 + (eq ? 4 : 0) + j * 16)));
    return out;
  }

  function normItem(it) {
    if (typeof it === 'string') return { smi: it };
    return it || {};
  }

  // Lays the items out in rows. extraLp: {molIndex: [atoms]} lone pairs to draw.
  function layoutScheme(spec, extraLp) {
    const lang = spec.lang;
    const D = drawOf();
    const items = (spec.items || []).map(normItem);
    let molIdx = 0;
    const boxes = items.map((it) => {
      if (it.smi !== undefined) {
        const idx = molIdx++;
        const opts = Object.assign({}, it.opts || {});
        delete opts.maxWidth;
        const extra = extraLp && extraLp[idx];
        if (extra && extra.length && opts.lonePairs !== true) {
          opts.lonePairs = (Array.isArray(opts.lonePairs) ? opts.lonePairs : []).concat(extra.filter((a) => !(Array.isArray(opts.lonePairs) && opts.lonePairs.indexOf(a) >= 0)));
        }
        const d = D.molecule(it.smi, opts);
        return { kind: 'mol', d, w: d.width, up: d.height / 2, down: d.height / 2, idx };
      }
      return connectorBox(it, lang);
    });
    // groups: a molecule with the connectors that follow it (a row breaks before a molecule)
    const groups = [];
    boxes.forEach((b) => {
      if (b.kind === 'mol' || !groups.length) groups.push([b]);
      else groups[groups.length - 1].push(b);
    });
    const maxW = +spec.maxWidth > 0 ? +spec.maxWidth : Infinity;
    const rows = [];
    let cur = [];
    let curW = 0;
    groups.forEach((g) => {
      const gw = g.reduce((s, b) => s + b.w, 0);
      if (cur.length && curW + gw > maxW) { rows.push(cur); cur = []; curW = 0; }
      cur = cur.concat(g);
      curW += gw;
    });
    if (cur.length) rows.push(cur);
    const ROWGAP = 12;
    const kids = [];
    const mols = [];
    let y = 0;
    let width = 0;
    rows.forEach((row) => {
      const up = Math.max.apply(null, row.map((b) => b.up).concat([6]));
      const down = Math.max.apply(null, row.map((b) => b.down).concat([6]));
      const cy = y + up;
      let x = 0;
      row.forEach((b) => {
        if (b.kind === 'mol') {
          const ox = x;
          const oy = cy - b.d.height / 2;
          kids.push(node('g', { class: 'mol-item', transform: 'translate(' + num(ox) + ' ' + num(oy) + ')' }, b.d.svg.c || []));
          mols[b.idx] = { x: ox, y: oy, d: b.d };
        } else connectorNodes(b, x, cy).forEach((k) => kids.push(k));
        x += b.w;
      });
      width = Math.max(width, x);
      y += up + down + ROWGAP;
    });
    const height = Math.max(0, y - ROWGAP);
    return { kids, mols, width, height };
  }

  function wrapSvg(kids, W, H, cls, tx0, ty0) {
    const w = Math.ceil(W);
    const h = Math.ceil(H);
    const inner = tx0 || ty0 ? [node('g', { transform: 'translate(' + num(tx0) + ' ' + num(ty0) + ')' }, kids)] : kids;
    return node('svg', { xmlns: SVGNS, class: 'mol ' + cls, viewBox: '0 0 ' + w + ' ' + h, width: w, height: h }, inner);
  }

  function scheme(spec) {
    spec = spec || {};
    const r = layoutScheme(spec);
    const W = Math.max(1, r.width);
    const H = Math.max(1, r.height);
    const d = { svg: wrapSvg(r.kids, W, H, 'scheme', 0, 0), width: Math.ceil(W), height: Math.ceil(H), atoms: [], bondLength: L };
    Object.defineProperty(d, 'mols', { value: r.mols, enumerable: false });
    return d;
  }

  // ------------------------------------------------------------------
  // Mechanisms: curved arrows over a scheme
  // ------------------------------------------------------------------

  function lpDots(svg) {
    const out = [];
    const walk = (v) => {
      if (!v || v.text !== undefined) return;
      const cls = String((v.a && v.a.class) || '').split(/\s+/);
      if (v.t === 'g' && cls.indexOf('lp') >= 0) {
        const cs = (v.c || []).filter((k) => k.t === 'circle');
        if (cs.length) {
          out.push({
            x: cs.reduce((s, k) => s + +k.a.cx, 0) / cs.length,
            y: cs.reduce((s, k) => s + +k.a.cy, 0) / cs.length,
          });
        }
        return;
      }
      (v.c || []).forEach(walk);
    };
    walk(svg);
    return out;
  }

  function mechanism(step) {
    step = step || {};
    const sch = step.scheme || { items: [] };
    const spec = Object.assign({}, sch, { lang: step.lang || sch.lang });
    const arrows = step.arrows || [];
    // lone pairs to draw: any atom named by an lp reference
    const extra = {};
    arrows.forEach((ar) => [ar.from, ar.to].forEach((ref) => {
      if (ref && ref.lp !== undefined) (extra[ref.m] = extra[ref.m] || []).push(ref.lp);
    }));
    const r = layoutScheme(spec, extra);
    const dots = r.mols.map((m) => (m ? lpDots(m.d.svg) : []));
    // an atom of the drawing: a SMILES index, an index of a drawn H (n, n+1 ... with allH),
    // or 'H<i>' / 'H<i>.<k>' for the (k-th) hydrogen drawn on atom i
    const heavy = (m, v) => {
      if (typeof v === 'string') {
        const mt = /^H(\d+)(?:\.(\d+))?$/.exec(v);
        if (!mt) return null;
        const hs = m.d.atoms.filter((a) => a.h === +mt[1]);
        return hs[mt[2] ? +mt[2] : 0] || null;
      }
      return m.d.atoms[v] || null;
    };

    const atomPt = (ref) => {
      const m = r.mols[ref.m];
      if (!m) throw new Error('mechanism: no molecule ' + ref.m);
      return m;
    };
    const centreOf = (ks) => {
      let sx = 0; let sy = 0; let n = 0;
      ks.forEach((k) => {
        const m = r.mols[k];
        if (!m) return;
        m.d.atoms.forEach((a) => { if (!a.h) { sx += a.x + m.x; sy += a.y + m.y; n++; } });
      });
      return n ? { x: sx / n, y: sy / n } : { x: 0, y: 0 };
    };
    // the point a reference stands for, seen from `toward`
    const point = (ref, toward) => {
      const m = atomPt(ref);
      if (ref.a !== undefined) {
        const a = heavy(m, ref.a);
        if (!a) throw new Error('mechanism: no atom ' + ref.a);
        const lab = m.d.mol && typeof ref.a === 'number' && !a.h ? m.d.mol.atoms[ref.a] : null;
        const labelled = lab ? (lab.el !== 'C' || lab.charge !== 0) : true;
        return { x: a.x + m.x, y: a.y + m.y, kind: 'a', labelled };
      }
      if (ref.lp !== undefined) {
        const a = heavy(m, ref.lp);
        if (!a) throw new Error('mechanism: no atom ' + ref.lp);
        const ax = a.x + m.x;
        const ay = a.y + m.y;
        let best = null;
        dots[ref.m].forEach((dd) => {
          const dx = dd.x + m.x;
          const dy = dd.y + m.y;
          if (Math.hypot(dx - ax, dy - ay) > 26) return;
          const score = toward ? Math.hypot(dx - toward.x, dy - toward.y) : 0;
          if (!best || score < best.score) best = { x: dx, y: dy, score };
        });
        if (!best) return { x: ax, y: ay, kind: 'a', labelled: true };
        const ux = best.x - ax;
        const uy = best.y - ay;
        const ul = Math.hypot(ux, uy) || 1;
        return { x: best.x + (ux / ul) * 4, y: best.y + (uy / ul) * 4, kind: 'lp', labelled: false, ox: ux / ul, oy: uy / ul };
      }
      const pair = ref.b || ref.mid;
      if (pair) {
        const a = heavy(m, pair[0]);
        const b = heavy(m, pair[1]);
        if (!a || !b) throw new Error('mechanism: no bond ' + pair.join('-'));
        return { x: (a.x + b.x) / 2 + m.x, y: (a.y + b.y) / 2 + m.y, kind: 'b', labelled: false };
      }
      throw new Error('mechanism: bad reference');
    };

    const out = [];
    const bb = { x0: 0, y0: 0, x1: r.width, y1: r.height };
    const grow = (x, y) => { bb.x0 = Math.min(bb.x0, x); bb.y0 = Math.min(bb.y0, y); bb.x1 = Math.max(bb.x1, x); bb.y1 = Math.max(bb.y1, y); };
    arrows.forEach((ar) => {
      const half = !!ar.half;
      // first pass for the direction, second for the lone pair choice
      const rough1 = point(ar.to, null);
      const p0 = point(ar.from, rough1);
      const p1 = point(ar.to, p0);
      const involved = ar.from.m === ar.to.m ? [ar.from.m] : [ar.from.m, ar.to.m];
      const ctr = centreOf(involved);
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len;
      let ny = dx / len;
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const side = nx * (mx - ctr.x) + ny * (my - ctr.y);
      if (Math.abs(side) < 3) { if (ny > 0) { nx = -nx; ny = -ny; } } else if (side < 0) { nx = -nx; ny = -ny; }
      const peak = Math.max(12, Math.min(34, 0.3 * len));
      if (p0.ox !== undefined) {
        // leave the lone pair away from its atom's label: the first segment must point outwards
        const lead = (sg) => ((mx + sg * nx * 2 * peak - p0.x) * p0.ox + (my + sg * ny * 2 * peak - p0.y) * p0.oy);
        const cur = lead(1);
        const alt = lead(-1);
        if (alt > cur) { nx = -nx; ny = -ny; }
      }
      const cx = mx + nx * 2 * peak;
      const cy = my + ny * 2 * peak;
      const gap = p1.labelled ? 9 : 6;
      let tdx = p1.x - cx;
      let tdy = p1.y - cy;
      const tl = Math.hypot(tdx, tdy) || 1;
      tdx /= tl; tdy /= tl;
      const ex = p1.x - tdx * gap;
      const ey = p1.y - tdy * gap;
      // tangent at the shortened end
      let hx = ex - cx;
      let hy = ey - cy;
      const hl = Math.hypot(hx, hy) || 1;
      hx /= hl; hy /= hl;
      const L1 = 8;
      const rot = (vx, vy, a) => [vx * Math.cos(a) - vy * Math.sin(a), vx * Math.sin(a) + vy * Math.cos(a)];
      const bx = -hx;
      const by = -hy;
      let head;
      if (!half) {
        const l = rot(bx, by, rad(26));
        const rr = rot(bx, by, rad(-26));
        head = 'M' + num(ex) + ' ' + num(ey) + 'L' + num(ex + l[0] * L1) + ' ' + num(ey + l[1] * L1) + 'L' + num(ex + rr[0] * L1) + ' ' + num(ey + rr[1] * L1) + 'Z';
      } else {
        let l = rot(bx, by, rad(28));
        if (l[0] * nx + l[1] * ny < 0) l = rot(bx, by, rad(-28));
        const c = Math.cos(rad(28)) * L1;
        head = 'M' + num(ex) + ' ' + num(ey) + 'L' + num(ex + l[0] * L1) + ' ' + num(ey + l[1] * L1) + 'L' + num(ex + bx * c) + ' ' + num(ey + by * c) + 'Z';
      }
      const sx = ex - hx * 4; // the line ends inside the head
      const sy = ey - hy * 4;
      const d = 'M' + num(p0.x) + ' ' + num(p0.y) + 'Q' + num(cx) + ' ' + num(cy) + ' ' + num(sx) + ' ' + num(sy);
      out.push(node('path', { class: half ? 'harrow' : 'arrow', d, fill: 'none', 'data-from': refKey(ar.from), 'data-to': refKey(ar.to) }));
      out.push(node('path', { class: 'ahead', d: head, fill: PEN, stroke: PEN, 'stroke-width': 0.6, 'stroke-linejoin': 'round' }));
      grow(p0.x, p0.y); grow(ex, ey);
      grow(0.25 * p0.x + 0.5 * cx + 0.25 * sx, 0.25 * p0.y + 0.5 * cy + 0.25 * sy);
      grow(ex + (bx * L1), ey + (by * L1));
    });
    const pad = 4;
    const tx0 = bb.x0 < 0 ? -bb.x0 + pad : 0;
    const ty0 = bb.y0 < 0 ? -bb.y0 + pad : 0;
    const W = bb.x1 + tx0 + (bb.x1 > r.width ? pad : 0);
    const H = bb.y1 + ty0 + (bb.y1 > r.height ? pad : 0);
    const d = {
      svg: wrapSvg(r.kids.concat(out), Math.max(1, W), Math.max(1, H), 'mech', tx0, ty0),
      width: Math.ceil(Math.max(1, W)), height: Math.ceil(Math.max(1, H)), atoms: [], bondLength: L,
    };
    Object.defineProperty(d, 'mols', { value: r.mols, enumerable: false });
    return d;
  }

  function refKey(ref) {
    const k = ref.a !== undefined ? 'a' + ref.a : ref.lp !== undefined ? 'lp' + ref.lp : ref.b ? 'b' + ref.b.join('-') : 'm' + (ref.mid || []).join('-');
    return ref.m + ':' + k;
  }

  // ------------------------------------------------------------------
  // Resonance structures
  // ------------------------------------------------------------------

  function resonance(mols) {
    let list = mols;
    let lang;
    if (mols && !Array.isArray(mols)) { list = mols.mols || mols.items || []; lang = mols.lang; }
    const items = [];
    (list || []).forEach((m, i) => {
      if (i > 0) items.push({ arrow: '↔' });
      items.push(normItem(m));
    });
    return scheme({ items, lang });
  }

  ORG.views = { fischer, readFischer, newman, chair, scheme, mechanism, resonance };
})(globalThis.ORG = globalThis.ORG || {});
