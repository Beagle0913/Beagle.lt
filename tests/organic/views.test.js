'use strict';
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const ORG = load(['chem.js', 'stereo.js', 'draw.js', 'views.js']);
const V = ORG.views;
const D = ORG.draw;
const C = ORG.chem;
const S = ORG.stereo;

function walk(v, fn) {
  if (!v || v.text !== undefined) return;
  fn(v);
  (v.c || []).forEach((k) => walk(k, fn));
}
function classes(v) { return String((v.a && v.a.class) || '').split(/\s+/).filter(Boolean); }
function find(d, cls, tag) {
  const out = [];
  walk(d.svg, (v) => { if (classes(v).includes(cls) && (!tag || v.t === tag)) out.push(v); });
  return out;
}
function textOf(v) { return (v.c || []).map((k) => (k.text !== undefined ? k.text : textOf(k))).join(''); }
function texts(d) { const o = []; walk(d.svg, (v) => { if (v.t === 'text') o.push({ v, s: textOf(v) }); }); return o; }
function clean(d) {
  const s = D.toString(d.svg);
  assert.ok(!/NaN|undefined|style=|Infinity/.test(s), 'bad output: ' + (s.match(/.{0,20}(NaN|undefined|style=|Infinity).{0,20}/) || [''])[0]);
  assert.ok(d.width > 0 && d.height > 0 && Number.isFinite(d.width) && Number.isFinite(d.height));
  return s;
}
const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// ---- Fischer ----------------------------------------------------------
test('D-glyceraldehyde: OH on the right; L-alanine: NH2 on the left', () => {
  const g = V.fischer({ smi: 'OC[C@@H](O)C=O', top: 4, bottom: 1 });
  clean(g);
  const t = texts(g);
  const mid = g.width / 2;
  const oh = t.find((x) => x.s === 'OH');
  assert.ok(oh && oh.v.a.x > mid, 'OH right');
  assert.ok(t.find((x) => x.s === 'H' && x.v.a.x < mid), 'H left');
  assert.ok(t.find((x) => x.s === 'CHO') && t.find((x) => x.s === 'CH2OH'));
  const a = V.fischer({ smi: 'C[C@H](N)C(=O)O', top: 3, bottom: 0 });
  const ta = texts(a);
  const nh = ta.find((x) => x.s === 'H2N');
  assert.ok(nh && nh.v.a.x < a.width / 2, 'NH2 left');
  assert.ok(ta.find((x) => x.s === 'COOH'));
});

test('tartaric acids: meso has both OH on one side, the others on opposite sides', () => {
  const side = (smi) => {
    const d = V.fischer({ smi, top: 1, bottom: 7 });
    clean(d);
    const mid = d.width / 2;
    return texts(d).filter((x) => x.s === 'OH' || x.s === 'HO').map((x) => (x.v.a.x > mid ? 'R' : 'L')).join('');
  };
  const meso = 'OC(=O)[C@H](O)[C@H](O)C(=O)O';
  const cips = [3, 5].map((i) => S.cip(C.parse(meso), i));
  assert.notStrictEqual(cips[0], cips[1], 'R,S is the meso form');
  const a = side(meso);
  assert.ok(a === 'LL' || a === 'RR', meso + ' ' + a);
  const b = side('OC(=O)[C@H](O)[C@@H](O)C(=O)O');
  assert.ok(b === 'LR' || b === 'RL', b);
  const c = side('OC(=O)[C@@H](O)[C@H](O)C(=O)O');
  assert.ok(c === 'LR' || c === 'RL', c);
});

test('readFischer matches ORG.stereo.cip', () => {
  const cases = [
    ['OC[C@@H](O)C=O', 4, 1], ['OC[C@H](O)C=O', 4, 1], ['C[C@H](N)C(=O)O', 3, 0],
    ['OC(=O)[C@H](O)[C@@H](O)C(=O)O', 1, 7], ['O=C[C@H](O)[C@@H](O)[C@H](O)[C@H](O)CO', 1, 10],
  ];
  for (const [smi, top, bottom] of cases) {
    const got = load.plain(V.readFischer({ smi, top, bottom }));
    const mol = C.parse(smi);
    const keys = Object.keys(got);
    assert.ok(keys.length > 0, smi);
    keys.forEach((k) => assert.strictEqual(got[k], S.cip(mol, +k), smi + ' atom ' + k));
  }
  // random centres built with withConfig on an open-chain pentose/hexose skeleton
  const r = rng(7);
  let n = 0;
  const mol0 = C.parse('O=CC(O)C(O)C(O)C(O)CO');
  for (let t = 0; t < 8; t++) {
    const cfg = {};
    [2, 4, 6, 8].forEach((i) => { cfg[i] = r() < 0.5 ? 'R' : 'S'; });
    const smi = S.withConfig(mol0, cfg);
    const m = C.parse(smi);
    const ends = (cond) => m.atoms.findIndex((a, i) => a.el === 'C' && cond(a, i));
    const top = ends((a, i) => a.h === 1 && m.nbr[i].some((j) => m.atoms[j].el === 'O' && m.bondAt(i, j).order === 2));
    const bottom = ends((a) => a.h === 2);
    const got = load.plain(V.readFischer({ smi, top, bottom }));
    Object.keys(got).forEach((k) => { assert.strictEqual(got[k], S.cip(m, +k), smi + ' atom ' + k); n++; });
  }
  assert.ok(n >= 20, 'centres compared ' + n);
});

test('fischer from rows draws the given labels', () => {
  const d = V.fischer({ rows: [{ left: 'H', right: 'OH' }, { left: { lt: 'HO', en: 'HO' }, right: 'H' }], top: 'CHO', bottom: 'CH2OH' });
  clean(d);
  assert.deepStrictEqual(texts(d).map((x) => x.s).sort(), ['CH2OH', 'CHO', 'H', 'H', 'HO', 'OH'].sort());
});

// ---- Newman -----------------------------------------------------------
test('Newman: circle, 3 front bonds from the centre, 3 back bonds from the circle, labels', () => {
  const d = V.newman({ front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 180 });
  clean(d);
  const circles = [];
  walk(d.svg, (v) => { if (v.t === 'circle') circles.push(v); });
  assert.strictEqual(circles.length, 1);
  const c = circles[0].a;
  const lns = [];
  walk(d.svg, (v) => { if (v.t === 'line') lns.push(v.a); });
  assert.strictEqual(lns.length, 6);
  const dist = (l) => Math.hypot(l.x1 - c.cx, l.y1 - c.cy);
  assert.strictEqual(lns.filter((l) => dist(l) < 0.5).length, 3);
  assert.strictEqual(lns.filter((l) => Math.abs(dist(l) - c.r) < 0.5).length, 3);
  assert.deepStrictEqual(texts(d).map((x) => x.s).sort(), ['CH3', 'CH3', 'H', 'H', 'H', 'H']);
  // anti: the back CH3 is on the opposite side of the front CH3
  const t = texts(d).filter((x) => x.s === 'CH3');
  assert.ok(t[0].v.a.y !== t[1].v.a.y);
});

test('Newman: eclipsed groups are not drawn on top of each other', () => {
  const d = V.newman({ front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], angle: 0 });
  clean(d);
  const ts = texts(d).map((x) => x.v.a.x + ',' + x.v.a.y);
  assert.strictEqual(new Set(ts).size, 6);
});

// ---- chair --------------------------------------------------------------
test('chair: 6 ring bonds; axial vertical, equatorial parallel to a ring bond', () => {
  const d = V.chair({ subs: [{ pos: 1, ax: true, label: 'CH3' }, { pos: 3, ax: false, label: 'OH' }, { pos: 4, ax: true, label: 'Cl' }] });
  clean(d);
  assert.strictEqual(find(d, 'ring', 'line').length, 6);
  const ax = find(d, 'ax', 'line');
  const eq = find(d, 'eq', 'line');
  assert.strictEqual(ax.length, 2);
  ax.forEach((l) => assert.ok(Math.abs(l.a.x1 - l.a.x2) < 0.01));
  const ring = find(d, 'ring', 'line').map((l) => Math.atan2(l.a.y2 - l.a.y1, l.a.x2 - l.a.x1));
  const e = eq[0].a;
  const ang = Math.atan2(e.y2 - e.y1, e.x2 - e.x1);
  const diff = ring.map((a) => { const x = Math.abs(a - ang) % Math.PI; return Math.min(x, Math.PI - x); });
  assert.ok(Math.min.apply(null, diff) < 0.12, 'eq parallel: ' + Math.min.apply(null, diff));
  assert.deepStrictEqual(texts(d).map((x) => x.s).sort(), ['CH3', 'Cl', 'OH']);
  const f = V.chair({ subs: [{ pos: 1, ax: true, label: 'CH3' }], flip: true });
  assert.strictEqual(find(f, 'eq', 'line').length, 1);
});

// ---- scheme -------------------------------------------------------------
test('scheme: one drawing, width of the parts, wraps under maxWidth', () => {
  const items = [{ smi: 'C=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→', above: 'CCl4' }, { smi: 'BrCCBr' }];
  const d = V.scheme({ items });
  const s = clean(d);
  const widths = items.filter((i) => i.smi).map((i) => D.molecule(i.smi).width);
  const sum = widths.reduce((a, b) => a + b, 0);
  assert.ok(d.width >= sum && d.width < sum + 160, d.width + ' vs ' + sum);
  assert.ok(s.indexOf('CCl') > 0);
  const natural = d.height;
  const w = V.scheme({ items, maxWidth: 200 });
  clean(w);
  assert.ok(w.width <= 260 && w.height > natural, 'wrapped ' + w.width + 'x' + w.height + ' vs ' + natural);
  let groups = 0;
  walk(w.svg, (v) => { if (v.t === 'g' && v.a && v.a.transform) groups++; });
  assert.strictEqual(groups, 3);
});

test('scheme connectors: equilibrium and resonance arrows draw without markers', () => {
  const d = V.scheme({ items: [{ smi: 'CC(=O)O' }, { arrow: '⇌', above: { lt: 'H+', en: 'H+' }, below: 'CH3OH' }, { smi: 'CC(=O)OC' }] });
  const s = clean(d);
  assert.ok(!/marker/i.test(s));
  const r = V.resonance([{ smi: 'CC(=O)[O-]' }, { smi: 'CC([O-])=O' }]);
  clean(r);
  assert.strictEqual(find(r, 'rhead').length, 2);
});

// ---- mechanism ----------------------------------------------------------
test('mechanism: curved arrow from a lone pair to an atom; half arrow is harrow', () => {
  const step = {
    scheme: { items: [{ smi: 'C[CH2+]' }, { plus: true }, { smi: '[Br-]' }] },
    arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }],
  };
  const d = V.mechanism(step);
  clean(d);
  assert.strictEqual(find(d, 'arrow', 'path').length, 1);
  assert.strictEqual(find(d, 'harrow').length, 0);
  assert.strictEqual(find(d, 'ahead', 'path').length, 1);
  assert.ok(find(d, 'lp').length >= 1);
  const h = V.mechanism({ scheme: { items: [{ smi: 'CC' }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }] });
  clean(h);
  assert.strictEqual(find(h, 'harrow', 'path').length, 1);
  assert.strictEqual(find(h, 'arrow').length, 0);
});

test('mechanism: two arrows, drawn inside the box; unknown molecule throws', () => {
  const step = {
    scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
    arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
  };
  const d = V.mechanism(step);
  clean(d);
  assert.strictEqual(find(d, 'arrow', 'path').length, 2);
  assert.throws(() => V.mechanism({ scheme: { items: [{ smi: 'CC' }] }, arrows: [{ from: { m: 3, a: 0 }, to: { m: 0, a: 1 } }] }));
});

test('every view is free of NaN, undefined and style=', () => {
  [
    V.fischer({ rows: [{ left: 'H', right: 'OH' }], top: 'CHO', bottom: 'CH2OH' }),
    V.newman({ front: ['CH3', 'H', 'H'], back: ['H', 'H', 'CH3'], angle: 60 }),
    V.newman({ front: ['Cl', 'H', 'H'], back: ['Cl', 'H', 'H'], angle: 60 }),
    V.chair({ subs: [] }),
    V.scheme({ items: [] }),
    V.resonance([{ smi: 'c1ccccc1' }, { smi: 'c1ccccc1' }]),
  ].forEach(clean);
});
