/* Pictures of the English trainer: one SVG scene per part of the lesson.
   ENG.drawScene(svg, sceneId, n, animate) clears svg and draws the scene as it looks after n of its steps
   are done. With animate true, what the newest step (number n) changed gets a CSS animation.
   Colours and motion live in trainer.css (classes only); nothing here sets a style attribute.
   Labels in the pictures are lesson words, so they stay English in both interface languages. */
(function (ENG) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const W = 800, H = 400;
  const f = (v) => Math.round(v * 10) / 10;
  let ANIM = false, N = 0;

  const vis = (k) => N > k;                 // step k (0-based) is done
  const fresh = (k) => ANIM && N === k + 1; // step k is the one just done, so it animates

  function node(parent, tag, attrs, cls) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    if (cls) e.setAttribute('class', cls);
    parent.appendChild(e);
    return e;
  }
  function text(parent, s, x, y, cls, anchor) {
    const t = node(parent, 'text', { x, y, 'text-anchor': anchor || 'middle' }, cls || 'lbl');
    t.textContent = s;
    return t;
  }
  // animate element e with effect `name` if step k is the one just done
  function F(k, e, name, delay, dur) {
    if (!fresh(k)) return e;
    e.setAttribute('class', ((e.getAttribute('class') || '') + ' fx fx-' + name).trim());
    if (delay) e.style.animationDelay = delay + 's';
    if (dur) e.style.animationDuration = dur + 's';
    return e;
  }
  const line = (p, x1, y1, x2, y2, cls) => node(p, 'line', { x1, y1, x2, y2 }, cls);
  const rad = (d) => d * Math.PI / 180;
  const pt = (cx, cy, r, a) => [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))];
  function arc(cx, cy, r, a0, a1) {
    const p0 = pt(cx, cy, r, a0), p1 = pt(cx, cy, r, a1);
    return 'M' + f(p0[0]) + ' ' + f(p0[1]) + ' A' + r + ' ' + r + ' 0 ' + (Math.abs(a1 - a0) > 180 ? 1 : 0) + ' 1 ' + f(p1[0]) + ' ' + f(p1[1]);
  }
  const ring = (p, cx, cy, r, cls) => node(p, 'circle', { cx, cy, r }, cls);
  function arrow(p, x1, x2, y, cls) {
    const g = node(p, 'g', null, cls);
    const d = x2 > x1 ? 1 : -1;
    line(g, x1, y, x2 - d * 4, y, 'arrow');
    node(g, 'polygon', { points: [x2, y, x2 - d * 16, y - 9, x2 - d * 16, y + 9].join(' ') }, 'arrowhead');
    return g;
  }
  function bracket(p, x0, x1, y, dir) { // dir 1: ends point down, -1: up
    return node(p, 'path', { d: 'M' + x0 + ' ' + y + ' V' + (y + 9 * dir) + ' H' + x1 + ' V' + y }, 'bracket');
  }
  const DYE = { A: 'dyeA', C: 'dyeC', G: 'dyeG', T: 'dyeT' };

  /* ---------- 1. Cut ---------- */
  function cut(g) {
    const X0 = 190, Wd = 42, YT = 170, YB = 230, TOP = 'CTGAATTCAG', BOT = 'GACTTAAGTC';
    const cx = (i) => X0 + Wd * i + Wd / 2;
    const split = vis(3);
    if (vis(1) && !split) F(1, node(g, 'rect', { x: cx(2) - Wd / 2 - 6, y: 126, width: 6 * Wd + 12, height: 148, rx: 12 }, 'hlbox'), 'fade');

    // one piece of the DNA: index ranges on the top and bottom strand, and the pairs joined by hydrogen bonds
    function piece(parent, top, bot, ticks) {
      if (top) {
        line(parent, cx(top[0]) - Wd / 2, YT - 26, cx(top[1]) + Wd / 2, YT - 26, 'backbone');
        for (let i = top[0]; i <= top[1]; i++) text(parent, TOP[i], cx(i), YT + 11, 'nuc' + (split && i >= 3 && i <= 6 ? ' tail' : ''));
        if (top[0] === 0) text(parent, "5'", X0 - 12, YT + 9, 'end', 'end');
        if (top[1] === 9) text(parent, "3'", cx(9) + Wd / 2 + 12, YT + 9, 'end', 'start');
      }
      if (bot) {
        line(parent, cx(bot[0]) - Wd / 2, YB + 26, cx(bot[1]) + Wd / 2, YB + 26, 'backbone');
        for (let i = bot[0]; i <= bot[1]; i++) text(parent, BOT[i], cx(i), YB + 11, 'nuc' + (split && i >= 3 && i <= 6 ? ' tail' : ''));
        if (bot[0] === 0) text(parent, "3'", X0 - 12, YB + 9, 'end', 'end');
        if (bot[1] === 9) text(parent, "5'", cx(9) + Wd / 2 + 12, YB + 9, 'end', 'start');
      }
      for (const i of ticks) line(parent, cx(i), YT + 18, cx(i), YB - 18, 'tick');
    }

    if (!split) {
      piece(g, [0, 9], [0, 9], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    } else {
      const left = F(3, node(g, 'g', null, 'apartL'), 'apartL');
      piece(left, [0, 2], [0, 6], [0, 1, 2]);
      const lx0 = cx(3) - Wd / 2, lx1 = cx(6) + Wd / 2;
      const lb = node(left, 'g', null, 'tail-note');
      bracket(lb, lx0, lx1, YB + 46, -1);
      text(lb, 'sticky end', (lx0 + lx1) / 2, YB + 80, 'lbl sm');
      F(3, lb, 'fade', 0.7);
      const right = F(3, node(g, 'g', null, 'apartR'), 'apartR');
      piece(right, [3, 9], [7, 9], [7, 8, 9]);
      const rb = node(right, 'g', null, 'tail-note');
      bracket(rb, lx0, lx1, YT - 46, 1);
      text(rb, 'sticky end', (lx0 + lx1) / 2, YT - 62, 'lbl sm');
      F(3, rb, 'fade', 0.7);
      if (fresh(3)) { // the two snips, shown for a moment where the cuts are made
        F(3, line(g, cx(3) - Wd / 2, 136, cx(3) - Wd / 2, 196, 'snip'), 'fadeOut', 0, 1.1);
        F(3, line(g, cx(7) - Wd / 2, 204, cx(7) - Wd / 2, 264, 'snip'), 'fadeOut', 0, 1.1);
      }
      return;
    }

    if (vis(1)) {
      const sg = node(g, 'g');
      bracket(sg, cx(2) - Wd / 2, cx(7) + Wd / 2, 40, 1);
      text(sg, 'restriction site', 400, 28, 'lbl');
      F(1, sg, 'fade');
    }
    if (vis(2)) {
      const a1 = arrow(g, cx(2) - Wd / 2 + 4, cx(7) + Wd / 2 - 4, 82, 'arrow-top');
      F(2, a1, 'growL');
      const t1 = text(g, "5'→3'", cx(2) - Wd / 2 - 10, 89, 'lbl sm', 'end');
      F(2, t1, 'fade', 0.5);
      const a2 = arrow(g, cx(7) + Wd / 2 - 4, cx(2) - Wd / 2 + 4, 306, 'arrow-bottom');
      F(2, a2, 'growR', 0.5);
      const t2 = text(g, "5'→3'", cx(7) + Wd / 2 + 10, 313, 'lbl sm', 'start');
      F(2, t2, 'fade', 1);
    }
    if (vis(0)) {
      const en = node(g, 'g', null, 'enzyme');
      node(en, 'rect', { x: cx(2) - Wd / 2 - 12, y: 120, width: 6 * Wd + 24, height: 160, rx: 22 }, 'enzyme-body');
      text(en, 'enzyme', 400, 110, 'lbl enz-lbl');
      F(0, en, 'slideL');
    }
  }

  /* ---------- 2. Choose a carrier ---------- */
  function carrier(g) {
    const cx = 290, cy = 215, r = 118;
    const open = vis(3);
    const gap = 14;
    // backbone ring (open at the cloning site once the cut vector is shown)
    const rg = node(g, 'g');
    node(rg, 'path', { d: open ? arc(cx, cy, r, gap, 360 - gap) : arc(cx, cy, r, 0, 359.9) }, 'plasmid-ring');
    // amp gene (bottom) and lacZ (top)
    node(rg, 'path', { d: arc(cx, cy, r, 105, 235) }, 'seg seg-amp');
    if (open) {
      node(rg, 'path', { d: arc(cx, cy, r, -72, -gap) }, 'seg seg-lacz');
      node(rg, 'path', { d: arc(cx, cy, r, gap, 72) }, 'seg seg-lacz');
    } else {
      node(rg, 'path', { d: arc(cx, cy, r, -72, 72) }, 'seg seg-lacz');
    }
    const pa = pt(cx, cy, r + 34, 170);
    const amp = text(rg, 'amp', pa[0], pa[1] + 6, 'lbl sm lbl-amp');
    const sup = node(amp, 'tspan', { dy: -9, 'font-size': 15 });
    sup.textContent = 'r';
    const pl = pt(cx, cy, r + 30, -52);
    text(rg, 'lacZ', pl[0], pl[1] + 4, 'lbl sm lbl-lacz', 'end');
    F(0, rg, 'pop');
    // centre labels
    if (vis(0)) F(0, text(g, 'vector', cx, cy - 18, 'lbl big'), 'fade', 0.3);
    if (vis(1)) {
      F(1, text(g, 'plasmid', cx, cy + 20, 'lbl big'), 'pop');
      F(1, text(g, 'pUC18', cx, cy + 50, 'lbl sm'), 'fade', 0.3);
    }
    // cloning site: a faint mark, lit at step 3, then the ring opens
    if (!open) {
      if (vis(2)) {
        const lit = node(g, 'path', { d: arc(cx, cy, r, -9, 9) }, 'mcs-lit');
        F(2, lit, 'flash');
        const lg = node(g, 'g');
        text(lg, 'multiple cloning site', cx, 44, 'lbl');
        line(lg, cx, 52, cx, cy - r - 14, 'leader');
        F(2, lg, 'fade', 0.2);
      } else {
        const a = pt(cx, cy, r + 8, 0), b = pt(cx, cy, r + 24, 0);
        line(g, a[0], a[1], b[0], b[1], 'mcs-mark');
      }
    } else {
      for (const s of [-1, 1]) { // single-stranded tails at the cut ends
        F(3, node(g, 'path', { d: arc(cx, cy, r - 14, s > 0 ? gap : -gap - 12, s > 0 ? gap + 12 : -gap) }, 'tail-stub'), 'fade', 0.4);
      }
      const ins = node(g, 'g', null, 'insert');
      node(ins, 'rect', { x: 536, y: 198, width: 150, height: 18, rx: 4 }, 'ins-bar');
      node(ins, 'rect', { x: 522, y: 216, width: 16, height: 8, rx: 2 }, 'tail-stub');
      node(ins, 'rect', { x: 684, y: 190, width: 16, height: 8, rx: 2 }, 'tail-stub');
      text(ins, 'insert', 611, 172, 'lbl');
      F(3, ins, 'slideR');
    }
  }

  /* ---------- 3. Join ---------- */
  function join(g) {
    const cx = 290, cy = 225, r = 110, gap = 22;
    const gl = pt(cx, cy, r, -gap), gr = pt(cx, cy, r, gap);
    const joined = vis(1);
    if (vis(3)) F(3, ring(g, cx, cy, r, 'glow'), 'pulse');
    node(g, 'path', { d: arc(cx, cy, r, gap, 360 - gap) }, 'plasmid-ring');
    // the insert: waiting at the right, then in the gap
    const ins = node(g, 'g', joined ? null : { transform: 'translate(300 110)' }, 'insert');
    node(ins, 'line', { x1: gl[0], y1: gl[1], x2: gr[0], y2: gr[1] }, 'ins-bar-line');
    F(1, ins, 'insIn', 0, 1.3);
    const lab = text(g, 'insert', joined ? cx : gl[0] + 300 + (gr[0] - gl[0]) / 2, joined ? gl[1] + 44 : gl[1] + 110 + 40, 'lbl sm');
    F(1, lab, 'fade', 1);
    // 5'-phosphates on the vector's ends
    if (!vis(0)) {
      for (const p of [gl, gr]) pmark(g, p[0] + (p === gl ? -20 : 20), p[1] - 24, null);
      text(g, "P = 5'-phosphate", 24, 44, 'lbl sm', 'start');
    } else if (fresh(0)) {
      for (const p of [gl, gr]) pmark(g, p[0] + (p === gl ? -20 : 20), p[1] - 24, 'fadeOut');
      F(0, text(g, "P = 5'-phosphate", 24, 44, 'lbl sm', 'start'), 'fadeOut');
    }
    if (joined) { // hydrogen bonds between the matching tails, drawn as dashes
      for (const p of [gl, gr]) F(1, line(g, p[0], p[1] - 22, p[0], p[1] + 22, 'hbond'), 'fade', 1.2);
    }
    if (vis(1) && !vis(2)) { // backbone gaps still open
      for (const p of [gl, gr]) line(g, p[0], p[1] - 9, p[0], p[1] + 9, 'nick');
    }
    if (fresh(2)) {
      for (const p of [gl, gr]) F(2, line(g, p[0], p[1] - 9, p[0], p[1] + 9, 'nick'), 'fadeOut', 0, 0.9);
      F(2, text(g, 'DNA ligase', cx, 50, 'lbl'), 'fadeOutLate');
    }
    // centre label
    if (vis(3)) {
      F(3, text(g, 'recombinant', cx, cy - 4, 'lbl big'), 'fade', 0.3);
      F(3, text(g, 'DNA', cx, cy + 34, 'lbl big'), 'fade', 0.5);
    } else {
      text(g, 'vector', cx, cy + 10, 'lbl big');
    }
  }
  function pmark(g, x, y, fx) {
    const m = node(g, 'g', null, 'pmark');
    node(m, 'circle', { cx: x, cy: y, r: 15 }, 'pdisc');
    text(m, 'P', x, y + 7, 'lbl sm pl');
    if (fx) F(0, m, fx);
    return m;
  }

  /* ---------- 4. Into bacteria ---------- */
  function bacteria(g) {
    function cell(x, leaky, fxStep) {
      const c = node(g, 'g');
      const m = node(c, 'rect', { x, y: 200, width: 230, height: 110, rx: 55 }, 'membrane' + (leaky ? ' leaky' : ''));
      if (leaky && fxStep != null) F(fxStep, m, 'flash');
      const sx = x + 50, sy = 255;
      node(c, 'path', { d: 'M' + sx + ' ' + sy + ' q 14 -22 28 0 t 28 0 t 28 0 t 28 0' }, 'chromosome');
      return c;
    }
    const aLeaky = vis(0), bLeaky = vis(2);
    cell(70, aLeaky, 0);
    cell(500, bLeaky, 2);
    if (aLeaky) {
      const ions = node(g, 'g', null, 'ions');
      [[60, 190], [120, 176], [190, 182], [250, 192], [300, 205], [58, 250], [64, 300], [306, 262], [120, 326], [250, 328]].forEach((p, i) => {
        text(ions, '+', p[0], p[1], 'ion');
      });
      F(0, ions, 'fade', 0.2);
      F(0, text(g, 'calcium', 185, 168, 'lbl sm'), 'fade', 0.4);
      F(0, text(g, 'competent cells', 185, 360, 'lbl'), 'fade', 0.6);
    }
    // plasmid 1: calcium route
    const enterA = vis(1);
    const p1 = node(g, 'g', enterA ? null : { transform: 'translate(-78 -148)' }, 'plasmid-mini');
    ring(p1, 268, 258, 20, 'mini');
    F(1, p1, 'enterA', 0, 1.3);
    if (!enterA) text(g, 'plasmid', 190, 76, 'lbl sm');
    // plasmid 2: electric pulse
    const enterB = vis(2);
    const p2 = node(g, 'g', enterB ? null : { transform: 'translate(-50 -148)' }, 'plasmid-mini');
    ring(p2, 700, 258, 20, 'mini');
    F(2, p2, 'enterB', 0.5, 1.3);
    if (!enterB) text(g, 'plasmid', 650, 76, 'lbl sm');
    if (fresh(2)) {
      F(2, node(g, 'polygon', { points: '640,40 596,128 626,128 590,196 668,100 636,100' }, 'bolt'), 'bolt');
    }
    if (vis(2)) F(2, text(g, 'electric pulse', 615, 360, 'lbl sm'), 'fade', 0.8);
  }

  /* ---------- 5. Grow and pick ---------- */
  const CELLS = [];
  for (let i = 0; i < 26; i++) {
    const rr = 150 * Math.sqrt((i + 0.6) / 26.6), a = i * 2.39996;
    CELLS.push([f(430 + rr * Math.cos(a)), f(200 + rr * Math.sin(a))]);
  }
  const CARRIERS = [2, 5, 8, 11, 14, 17, 20, 23];
  const WHITE = [5, 14, 20];

  function plate(g) {
    node(g, 'circle', { cx: 430, cy: 200, r: 176 }, 'dish');
    node(g, 'circle', { cx: 430, cy: 200, r: 164 }, 'agar');
    const taps = [];
    const grown = vis(1), stained = vis(3);
    for (let i = 0; i < CELLS.length; i++) {
      const carries = CARRIERS.indexOf(i) !== -1;
      const x = CELLS[i][0], y = CELLS[i][1];
      if (!carries) {
        if (!vis(0)) node(g, 'circle', { cx: x, cy: y, r: 8 }, 'cellDot');
        else if (fresh(0)) F(0, node(g, 'circle', { cx: x, cy: y, r: 8 }, 'cellDot'), 'fadeOut', 0.2, 1.3);
        continue;
      }
      const white = WHITE.indexOf(i) !== -1;
      const c = node(g, 'g', null, 'carrier');
      if (!grown) {
        node(c, 'circle', { cx: x, cy: y, r: 8 }, 'cellDot');
        node(c, 'circle', { cx: x, cy: y, r: 3.5 }, 'plasmid-dot');
      } else {
        const body = node(c, 'circle', { cx: x, cy: y, r: 16 }, 'colony' + (stained ? (white ? ' white' : ' blue') : ''));
        if (stained && !white) F(3, body, 'tint', 0.2 + (i % 5) * 0.12, 1.2);
        F(1, c, 'growCol', (i % 4) * 0.15, 1.2);
        if (vis(4) && white) F(4, node(c, 'circle', { cx: x, cy: y, r: 23 }, 'pick'), 'pop');
        if (vis(3) && !vis(4)) { // tap step: hit area, button role
          node(c, 'circle', { cx: x, cy: y, r: 27 }, 'hit');
          c.setAttribute('role', 'button');
          c.setAttribute('tabindex', '0');
          c.setAttribute('aria-label', white ? 'white colony' : 'blue colony');
          c.setAttribute('class', 'carrier tappable');
          taps.push({ el: c, kind: white ? 'white' : 'blue' });
        }
      }
    }
    // legend / labels on the left and right
    if (!vis(1)) {
      const lg = node(g, 'g');
      ring(lg, 36, 62, 8, 'cellDot');
      ring(lg, 36, 62, 3.5, 'plasmid-dot');
      text(lg, 'cell with pUC18', 54, 69, 'lbl sm', 'start');
      ring(lg, 36, 104, 8, 'cellDot');
      text(lg, 'cell without', 54, 111, 'lbl sm', 'start');
      text(lg, 'plasmid', 54, 136, 'lbl sm', 'start');
      text(g, 'agar + ampicillin', 24, 364, 'lbl sm', 'start');
    }
    if (vis(1)) {
      const k = CARRIERS[1];
      const ptx = CELLS[k];
      const lb = node(g, 'g');
      text(lb, 'colony', 700, 328, 'lbl', 'middle');
      line(lb, 676, 316, f(ptx[0] + 18), f(ptx[1] + 12), 'leader');
      F(1, lb, 'fade', 1);
    }
    if (vis(2)) { // clone: a close-up of the cells in one colony
      const mg = node(g, 'g', null, 'magnifier');
      node(mg, 'circle', { cx: 700, cy: 130, r: 56 }, 'lens');
      [[-18, -12], [8, -22], [22, 4], [-4, 6], [-24, 16], [10, 24]].forEach((o) => node(mg, 'circle', { cx: 700 + o[0], cy: 130 + o[1], r: 9 }, 'cellDot'));
      text(mg, 'clone', 700, 218, 'lbl');
      const k2 = CELLS[CARRIERS[6]];
      line(mg, 658, 150, f(k2[0] + 16), f(k2[1] - 6), 'leader');
      F(2, mg, 'pop');
    }
    if (vis(3)) F(3, text(g, 'agar + X-gal', 690, 372, 'lbl sm'), 'fade');
    return taps;
  }

  /* ---------- 6. Read the sequence ---------- */
  const SEQ = 'ATCGAATTCCGA';
  const PEAKS = [120, 78, 96, 64, 112, 84, 100, 70, 92, 116, 66, 102];
  function peak(p, x, base, h, cls, sw) {
    const d = 'M' + (x - 22) + ' ' + base + ' C' + (x - 8) + ' ' + base + ',' + (x - 10) + ' ' + (base - h) + ',' + x + ' ' + (base - h) +
      ' C' + (x + 10) + ' ' + (base - h) + ',' + (x + 8) + ' ' + base + ',' + (x + 22) + ' ' + base;
    return node(p, 'path', { d, 'stroke-width': sw || 4 }, 'peak ' + cls);
  }
  function trace(p, seq, base, sw) {
    for (let j = 0; j < seq.length; j++) peak(p, 90 + j * 55, base, PEAKS[j], DYE[seq[j]], sw);
    line(p, 50, base, 750, base, 'axis');
  }

  function sequence(g) {
    if (N >= 5) { // many reads at once
      let t = 0;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
          const k = row * 6 + col;
          const tile = node(g, 'g', { transform: 'translate(' + (28 + col * 126) + ' ' + (30 + row * 84) + ')' });
          const inner = node(tile, 'g', { transform: 'scale(0.155)' });
          const rot = SEQ.slice(k % 5) + SEQ.slice(0, k % 5);
          trace(inner, rot, 400, 14);
          F(4, tile, 'pop', t);
          t += 0.045;
        }
      }
      F(4, text(g, 'many fragments at once', 400, 388, 'lbl'), 'fade', 1.2);
      return;
    }
    if (N === 4) { // electropherogram and the read
      const base = 300;
      const tg = node(g, 'g');
      trace(tg, SEQ, base, 5);
      node(tg, 'rect', { x: 90 + 3 * 55 - 27, y: 52, width: 6 * 55, height: 62, rx: 10 }, 'hlbox');
      for (let j = 0; j < SEQ.length; j++) {
        const t = text(g, SEQ[j], 90 + j * 55, 100, 'base ' + DYE[SEQ[j]]);
        F(3, t, 'fade', 0.2 + j * 0.12);
      }
      bracket(g, 90 + 3 * 55 - 22, 90 + 8 * 55 + 22, 42, 1);
      text(g, 'GAATTC', 90 + 5.5 * 55, 30, 'lbl');
      text(g, 'electropherogram', 400, 350, 'lbl');
      // the peaks rise one after another
      const kids = tg.childNodes || tg.children;
      if (fresh(3)) {
        for (let j = 0; j < SEQ.length; j++) {
          const pk = kids[j];
          if (pk) F(3, pk, 'rise', 0.15 + j * 0.12);
        }
      }
      return;
    }
    // before the peaks: template, primer, chains and the capillary
    if (N === 3) { // capillary: fragments race, the shortest first
      node(g, 'rect', { x: 60, y: 168, width: 680, height: 44, rx: 22 }, 'capillary');
      node(g, 'rect', { x: 684, y: 160, width: 44, height: 60, rx: 8 }, 'window');
      line(g, 706, 96, 706, 160, 'laser');
      node(g, 'rect', { x: 680, y: 70, width: 52, height: 28, rx: 6 }, 'laser-box');
      text(g, 'laser', 706, 62, 'lbl sm');
      text(g, 'capillary', 330, 250, 'lbl');
      for (let j = 0; j < SEQ.length; j++) {
        const d = node(g, 'circle', { cx: 664 - j * 48, cy: 190, r: 12 }, 'frag ' + DYE[SEQ[j]]);
        F(2, d, 'race', 0, 1.6 + j * 0.22);
      }
      return;
    }
    // template + primer (+ ladder of chains)
    const tg = node(g, 'g');
    node(tg, 'rect', { x: 60, y: 82, width: 680, height: 14, rx: 7 }, 'template');
    text(tg, "3'", 36, 96, 'lbl sm', 'middle');
    text(tg, "5'", 764, 96, 'lbl sm', 'middle');
    text(tg, 'template', 400, 62, 'lbl');
    if (vis(0)) {
      const pr = node(g, 'g');
      node(pr, 'rect', { x: 100, y: 112, width: 90, height: 14, rx: 7 }, 'primer');
      for (let x = 110; x <= 180; x += 14) line(pr, x, 98, x, 110, 'hbond');
      if (!vis(1)) text(pr, 'primer', 145, 150, 'lbl sm');
      F(0, pr, 'riseIn');
    }
    if (vis(1)) {
      const lg = node(g, 'g');
      for (let j = 0; j < SEQ.length; j++) {
        const y = 140 + j * 21, len = 40 * (j + 1), dur = 0.5 + j * 0.1;
        const ch = node(lg, 'g');
        node(ch, 'rect', { x: 100, y, width: 90 + len, height: 12, rx: 6 }, 'chain');
        node(ch, 'circle', { cx: 190 + len + 6, cy: y + 6, r: 9 }, 'term ' + DYE[SEQ[j]]);
        F(1, ch, 'growL', 0, dur);
      }
      const lgd = node(g, 'g');
      ['A', 'C', 'G', 'T'].forEach((b, i) => {
        ring(lgd, 560 + i * 54, 152, 11, 'term ' + DYE[b]);
        text(lgd, b, 560 + i * 54, 188, 'lbl sm');
      });
      F(1, lgd, 'fade', 0.8);
    }
  }

  /* ---------- entry point ---------- */
  const SCENES = { cut, carrier, join, bacteria, plate, sequence };

  ENG.drawScene = function (svg, sceneId, n, animate) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    N = Math.max(0, n | 0);
    ANIM = !!animate;
    const g = node(svg, 'g', null, 'scene-' + sceneId);
    const fn = SCENES[sceneId];
    const taps = fn ? fn(g) : null;
    return { taps: taps || [] };
  };
})(globalThis.ENG = globalThis.ENG || {});
