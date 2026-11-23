'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load.js');

const ORG = load();
const D = ORG.draw;
const C = ORG.chem;
const P = load.plain;

const LINES = fs.readFileSync(path.join(__dirname, 'fixtures', 'molecules.txt'), 'utf8')
  .split(/\r?\n/).map((s) => s.trim()).filter((s) => s && s[0] !== '#');

// ---- helpers over the VNode tree --------------------------------------
function walk(v, fn) {
  if (!v || v.text !== undefined) return;
  fn(v);
  (v.c || []).forEach((k) => walk(k, fn));
}
function classes(v) { return String((v.a && v.a.class) || '').split(/\s+/).filter(Boolean); }
function find(drawing, cls, tag) {
  const out = [];
  walk(drawing.svg, (v) => { if (classes(v).includes(cls) && (!tag || v.t === tag)) out.push(v); });
  return out;
}
function textOf(v) {
  return (v.c || []).map((k) => (k.text !== undefined ? k.text : textOf(k))).join('');
}
function atomTexts(drawing) { return find(drawing, 'atom').map(textOf); }
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
function angleAt(a, b, c) { // angle at b in degrees
  const u = { x: a.x - b.x, y: a.y - b.y };
  const w = { x: c.x - b.x, y: c.y - b.y };
  const cos = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
const heavy = (smi) => C.parse(smi).atoms.length;

// ---- the whole fixture set ---------------------------------------------
test('the drawer is loaded', () => {
  assert.ok(D, 'ORG.draw exists');
  for (const f of ['molecule', 'layout', 'quality', 'condensed', 'toDom', 'toString', 'readStereo']) {
    assert.strictEqual(typeof D[f], 'function', f);
  }
  assert.ok(LINES.length >= 50);
});

for (const smi of LINES) {
  test('fixture draws cleanly: ' + smi, () => {
    const mol = C.parse(smi);
    const lay = D.layout(mol, {});
    assert.strictEqual(lay.pos.length >= mol.atoms.length, true);
    const q = D.quality(mol, lay.pos);
    assert.deepEqual(P(q), { overlaps: 0, crossings: 0, labelClashes: 0 }, JSON.stringify(P(q)));
    const d = D.molecule(smi, {});
    const s = D.toString(d.svg);
    assert.ok(!/NaN/.test(s), 'NaN in svg');
    assert.ok(!/undefined/.test(s), 'undefined in svg');
    assert.ok(!/style=/.test(s), 'style attribute in svg');
    assert.ok(d.width > 0 && d.height > 0);
    assert.ok(d.width <= 40 * (heavy(smi) + 2) + 1e-9, 'width ' + d.width);
    assert.ok(d.height <= 40 * (heavy(smi) + 2) + 1e-9, 'height ' + d.height);
    assert.strictEqual(d.bondLength, 40);
    assert.ok(d.atoms.length >= mol.atoms.length);
  });
}

test('the drawn quality equals the quality of the returned layout', () => {
  const d = D.molecule('CC(=O)Oc1ccccc1C(=O)O');
  assert.deepEqual(P(D.quality(C.parse('CC(=O)Oc1ccccc1C(=O)O'), d.atoms)), { overlaps: 0, crossings: 0, labelClashes: 0 });
});

// ---- geometry ----------------------------------------------------------
test('pentane zig-zags at 120 degrees', () => {
  const { pos } = D.layout(C.parse('CCCCC'), {});
  for (let i = 1; i < 4; i++) {
    const a = angleAt(pos[i - 1], pos[i], pos[i + 1]);
    assert.ok(Math.abs(a - 120) <= 1, 'angle at ' + i + ' = ' + a);
  }
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(dist(pos[i], pos[i + 1]) - 40) <= 0.5);
  // zig-zag: consecutive turns alternate
  const turn = (i) => {
    const u = { x: pos[i].x - pos[i - 1].x, y: pos[i].y - pos[i - 1].y };
    const w = { x: pos[i + 1].x - pos[i].x, y: pos[i + 1].y - pos[i].y };
    return Math.sign(u.x * w.y - u.y * w.x);
  };
  assert.strictEqual(turn(1), -turn(2));
  assert.strictEqual(turn(2), -turn(3));
});

test('the long axis of pentane is horizontal and its first atom is on the left', () => {
  const { pos } = D.layout(C.parse('CCCCC'), {});
  const xs = pos.map((p) => p.x);
  const ys = pos.map((p) => p.y);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3 * (Math.max(...ys) - Math.min(...ys)));
  assert.ok(pos[0].x < pos[4].x);
});

test('benzene is a regular hexagon', () => {
  const { pos } = D.layout(C.parse('c1ccccc1'), {});
  for (let i = 0; i < 6; i++) {
    const a = pos[i];
    const b = pos[(i + 1) % 6];
    const c = pos[(i + 2) % 6];
    assert.ok(Math.abs(dist(a, b) - 40) <= 0.5, 'bond ' + dist(a, b));
    assert.ok(Math.abs(angleAt(a, b, c) - 120) <= 0.5, 'angle ' + angleAt(a, b, c));
  }
});

test('regular polygons for small and large rings, fused rings share an edge', () => {
  for (const [smi, n] of [['C1CC1', 3], ['C1CCC1', 4], ['C1CCCC1', 5], ['C1CCCCCCC1', 8]]) {
    const { pos } = D.layout(C.parse(smi), {});
    for (let i = 0; i < n; i++) {
      assert.ok(Math.abs(dist(pos[i], pos[(i + 1) % n]) - 40) <= 0.5, smi);
      const exp = 180 - 360 / n;
      assert.ok(Math.abs(angleAt(pos[i], pos[(i + 1) % n], pos[(i + 2) % n]) - exp) <= 0.5, smi);
    }
  }
  const mol = C.parse('c1ccc2ccccc2c1');
  const { pos } = D.layout(mol, {});
  mol.bonds.forEach((b) => assert.ok(Math.abs(dist(pos[b.a], pos[b.b]) - 40) <= 0.5));
  for (const r of C.rings(mol)) {
    for (let i = 0; i < r.length; i++) {
      assert.ok(Math.abs(angleAt(pos[r[i]], pos[r[(i + 1) % 6]], pos[r[(i + 2) % 6]]) - 120) <= 0.5);
    }
  }
});

test('2-butyne is straight', () => {
  const { pos } = D.layout(C.parse('CC#CC'), {});
  const [a, d] = [pos[0], pos[3]];
  for (const k of [1, 2]) {
    const cross = (d.x - a.x) * (pos[k].y - a.y) - (d.y - a.y) * (pos[k].x - a.x);
    assert.ok(Math.abs(cross) / dist(a, d) <= 0.5);
  }
  assert.ok(Math.abs(dist(a, d) - 120) <= 1);
});

test('bond lengths are 40 outside strained fused systems', () => {
  const skip = new Set(['CCN(CC)C(=O)[C@H]1CN(C)[C@@H]2Cc3c[nH]c4cccc(C2=C1)c34']);
  for (const smi of LINES) {
    if (skip.has(smi)) continue;
    const mol = C.parse(smi);
    const { pos } = D.layout(mol, {});
    mol.bonds.forEach((b) => {
      const dd = dist(pos[b.a], pos[b.b]);
      assert.ok(Math.abs(dd - 40) <= 2, smi + ' bond ' + b.a + '-' + b.b + ' = ' + dd);
    });
  }
});

test('a double bond has the geometry its SMILES asks for', () => {
  let checked = 0;
  for (const smi of LINES) {
    const d = D.molecule(smi, {});
    const res = D.readCisTrans(d);
    const mol = C.parse(smi);
    for (const r of res) {
      const bu = mol.bonds.filter((b) => b.dir && (b.a === r.u || b.b === r.u || b.a === r.v || b.b === r.v));
      assert.ok(bu.length >= 2, smi);
      assert.strictEqual(r.drawn, r.wanted, smi + ' bond ' + r.u + '=' + r.v);
      checked++;
    }
  }
  assert.ok(checked >= 2, 'geraniol and cinnamaldehyde carry E double bonds');
  const e = D.readCisTrans(D.molecule('F/C=C\\F', {}));
  assert.strictEqual(e.length, 1);
  assert.strictEqual(e[0].drawn, 'cis');
  assert.strictEqual(D.readCisTrans(D.molecule('F/C=C/F', {}))[0].drawn, 'trans');
  assert.strictEqual(D.readCisTrans(D.molecule('C/C=C(/C)C(C)C', {}))[0].drawn, D.readCisTrans(D.molecule('C/C=C(/C)C(C)C', {}))[0].wanted);
});

// ---- labels ------------------------------------------------------------
test('labels: ethanol OH, amine H2N or NH2 by side, charge, lone pairs', () => {
  const t = atomTexts(D.molecule('CCO', {}));
  assert.deepEqual(t, ['OH']);
  const d = D.molecule('NCC', {});
  const lbl = atomTexts(d);
  assert.strictEqual(lbl.length, 1);
  assert.strictEqual(lbl[0], d.atoms[0].x < d.atoms[1].x ? 'H2N' : 'NH2');
  assert.strictEqual(lbl[0], 'H2N', 'the first atom is drawn on the left');
  const mid = atomTexts(D.molecule('CC(N)C', {}));
  assert.deepEqual(mid, ['NH2'], 'NH2 away from the left end');
  const amm = D.molecule('C[N+](C)(C)C', {});
  assert.ok(find(amm, 'charge').some((n) => /\+/.test(textOf(n))), 'a plus is drawn');
  assert.ok(atomTexts(amm).includes('N'));
  const lp = D.molecule('CCO', { lonePairs: true });
  assert.strictEqual(find(lp, 'lp').length, 2);
  const lp1 = D.molecule('CCO', { lonePairs: [2] });
  assert.strictEqual(find(lp1, 'lp').length, 2);
  assert.strictEqual(find(D.molecule('CCO', { lonePairs: [0] }), 'lp').length, 0);
  assert.strictEqual(find(D.molecule('CC(=O)[O-]', {}), 'charge').length, 1);
  assert.strictEqual(atomTexts(D.molecule('C', {}))[0], 'CH4');
  assert.deepEqual(atomTexts(D.molecule('CC(=O)O', {})).sort(), ['O', 'OH']);
});

test('label classes follow the element', () => {
  const d = D.molecule('NC(=O)CCl', {});
  const have = new Set();
  walk(d.svg, (v) => classes(v).forEach((c) => have.add(c)));
  for (const c of ['mol', 'bond', 'atom', 'el-O', 'el-N', 'el-Cl']) assert.ok(have.has(c), c);
});

test('no label or atom sits on a bond that is not its own (hard drawings)', () => {
  for (const smi of ['CC(=O)Nc1ccc(O)cc1', 'CCOC(=O)[C@H](CCc1ccccc1)N[C@@H](C)C(=O)N1CCC[C@H]1C(=O)O']) {
    const mol = C.parse(smi);
    const { pos } = D.layout(mol, {});
    assert.deepEqual(P(D.quality(mol, pos)), { overlaps: 0, crossings: 0, labelClashes: 0 });
  }
});

// ---- wedges and stereo --------------------------------------------------
test('2-butanol has one wedge or hash at atom 1', () => {
  const d = D.molecule('C[C@@H](O)CC', {});
  const w = find(d, 'wedge').concat(find(d, 'hash'));
  assert.strictEqual(w.length, 1);
  assert.strictEqual(Number(w[0].a['data-from']), 1);
});

test('readStereo reads a Fischer drawing of L-alanine as @@ (independent check of the maths)', () => {
  const mol = C.parse('N[C@@H](C)C(=O)O');
  // C1 centre; N left and an explicit H right come toward the viewer; CH3 down, COOH up stay in the plane
  const pos = [{ x: -40, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 40 }, { x: 0, y: -40 }, { x: 20, y: -80 }, { x: -20, y: -80 }, { x: 40, y: 0, h: 1 }];
  const wedge = (to) => ({ t: 'path', a: { class: 'wedge', 'data-from': 1, 'data-to': to } });
  const fake = { mol, atoms: pos, svg: { t: 'svg', c: [wedge(0), wedge(6)] } };
  assert.deepEqual(P(D.readStereo(fake)), { 1: '@@' });
  const flipped = { mol, atoms: pos, svg: { t: 'svg', c: [{ t: 'path', a: { class: 'hash', 'data-from': 1, 'data-to': 0 } }, { t: 'path', a: { class: 'hash', 'data-from': 1, 'data-to': 6 } }] } };
  assert.deepEqual(P(D.readStereo(flipped)), { 1: '@' });
});

test('the drawn wedges re-read to the SMILES configuration, for every stereocentre of the fixtures', () => {
  let centres = 0;
  for (const smi of LINES) {
    const mol = C.parse(smi);
    const d = D.molecule(smi, {});
    const got = P(D.readStereo(d));
    mol.atoms.forEach((a, i) => {
      if (a.chiral && a.ord.length === 4) {
        centres++;
        assert.strictEqual(got[i], a.chiral, smi + ' atom ' + i);
      }
    });
  }
  assert.ok(centres > 30, 'centres checked: ' + centres);
});

test('the drawn wedges give the same CIP descriptor as ORG.stereo', { todo: typeof ORG.stereo === 'undefined' }, () => {
  let centres = 0;
  for (const smi of LINES) {
    const mol = C.parse(smi);
    const d = D.molecule(smi, {});
    const got = P(D.readStereo(d));
    const again = C.parse(smi);
    Object.keys(got).forEach((k) => { again.atoms[k].chiral = got[k]; });
    mol.atoms.forEach((a, i) => {
      if (a.chiral && a.ord.length === 4) {
        centres++;
        assert.strictEqual(ORG.stereo.cip(again, i), ORG.stereo.cip(mol, i), smi + ' atom ' + i);
      }
    });
  }
  assert.ok(centres > 30);
});

test('every stereocentre carries exactly one wedge or hash (two for four heavy neighbours)', () => {
  for (const smi of ['C[C@@H](O)CC', 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O', 'C[C@](F)(Cl)CC']) {
    const d = D.molecule(smi, {});
    const mol = C.parse(smi);
    const from = {};
    find(d, 'wedge').concat(find(d, 'hash')).forEach((n) => { from[n.a['data-from']] = (from[n.a['data-from']] || 0) + 1; });
    mol.atoms.forEach((a, i) => {
      if (a.chiral) assert.ok(from[i] >= 1 && from[i] <= 2, smi + ' atom ' + i + ' wedges ' + from[i]);
    });
  }
});

test('flipping or rotating keeps the configuration right', () => {
  const smi = 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O';
  const mol = C.parse(smi);
  for (const o of [{ flip: 'x' }, { flip: 'y' }, { rotate: 90 }, { rotate: 33, flip: 'x' }]) {
    const d = D.molecule(smi, o);
    const got = P(D.readStereo(d));
    mol.atoms.forEach((a, i) => { if (a.chiral) assert.strictEqual(got[i], a.chiral, JSON.stringify(o)); });
  }
});

// ---- other options ------------------------------------------------------
test('allH draws every hydrogen', () => {
  const d = D.molecule('CCO', { allH: true });
  assert.strictEqual(atomTexts(d).filter((x) => x === 'H').length, 6);
  assert.deepEqual(atomTexts(d).filter((x) => x !== 'H').sort(), ['C', 'C', 'O']);
  const q = D.quality(C.parse('CCO'), D.layout(C.parse('CCO'), { allH: true }).pos, { allH: true });
  assert.deepEqual(P(q), { overlaps: 0, crossings: 0, labelClashes: 0 });
  for (const smi of ['C', 'C=C', 'CC(=O)O', 'c1ccccc1', 'CC(C)O', 'C#C', 'NCC(=O)O']) {
    const mol = C.parse(smi);
    const lay = D.layout(mol, { allH: true });
    assert.deepEqual(P(D.quality(mol, lay.pos, { allH: true })), { overlaps: 0, crossings: 0, labelClashes: 0 }, smi);
  }
});

test('condensed formulas', () => {
  const cases = {
    'CC(O)CC=O': 'CH3CH(OH)CH2CHO',
    CCO: 'CH3CH2OH',
    'CC(=O)O': 'CH3COOH',
    'CC(=O)OC': 'CH3COOCH3',
    'C=CC': 'CH2=CHCH3',
    'CC#N': 'CH3CN',
    'CC(C)C': 'CH3CH(CH3)CH3',
    'CC(C)=O': 'CH3COCH3',
    'CC(=O)N': 'CH3CONH2',
    CCCl: 'CH3CH2Cl',
    'CC(=O)[O-]': 'CH3COO-',
    CCCC: 'CH3CH2CH2CH3',
  };
  for (const [s, e] of Object.entries(cases)) assert.strictEqual(D.condensed(s), e, s);
  assert.strictEqual(D.condensed('c1ccccc1'), null);
  assert.strictEqual(D.condensed(C.parse('CC(O)CC=O')), 'CH3CH(OH)CH2CHO');
  assert.strictEqual(D.condensed('C1CC1'), null);
});

test('condensed option draws the formula as text', () => {
  const d = D.molecule('CC(O)CC=O', { condensed: true });
  assert.ok(d.width > 0 && d.height > 0);
  assert.strictEqual(find(d, 'atom').map(textOf).join(''), 'CH3CH(OH)CH2CHO');
  assert.ok(find(d, 'bond').length === 0);
  const ring = D.molecule('c1ccccc1', { condensed: true });
  assert.ok(find(ring, 'bond').length >= 6, 'rings fall back to the skeletal drawing');
});

test('tap targets', () => {
  const a = D.molecule('CCO', { targets: 'atoms' });
  const hits = find(a, 'hit');
  assert.strictEqual(hits.length, 3);
  assert.ok(hits.every((h) => h.t === 'circle'));
  assert.deepEqual(hits.map((h) => Number(h.a['data-atom'])).sort(), [0, 1, 2]);
  assert.ok(hits.every((h) => Number(h.a.r) >= 20));
  assert.ok(hits.every((h) => /^[A-Z][a-z]?\d+$/.test(h.a['aria-label'])));
  const b = D.molecule('CCO', { targets: 'bonds' });
  const bh = find(b, 'hit');
  assert.strictEqual(bh.length, 2);
  assert.ok(bh.every((h) => h.t === 'line'));
  assert.deepEqual(bh.map((h) => h.a['data-bond']).sort(), ['0-1', '1-2']);
  assert.strictEqual(find(D.molecule('CCO', {}), 'hit').length, 0);
  // targets of a large molecule are not clipped by the viewBox
  const big = D.molecule('C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O', { targets: 'atoms' });
  big.atoms.slice(0, 18).forEach((p) => { assert.ok(p.x >= 20 && p.y >= 20 && p.x <= big.width - 20 && p.y <= big.height - 20); });
});

test('numbers, deltas, highlights, circle, rotate, flip, coords, maxWidth', () => {
  const n = D.molecule('CCCO', { numbers: 'all' });
  assert.deepEqual(find(n, 'num').map(textOf).sort(), ['1', '2', '3', '4']);
  assert.deepEqual(find(D.molecule('CCCO', { numbers: [0, 3] }), 'num').map(textOf).sort(), ['1', '4']);
  assert.deepEqual(find(D.molecule('CCCO', { numbers: { 1: 'a', 2: 'b' } }), 'num').map(textOf).sort(), ['a', 'b']);
  const dl = D.molecule('CCl', { deltas: { 0: '+', 1: '-' } });
  assert.deepEqual(find(dl, 'delta').map(textOf).sort(), ['δ+', 'δ−']);
  const h = D.molecule('CC(=O)O', { highlight: { atoms: [1], bonds: [[1, 2]], tone: 2 } });
  assert.strictEqual(find(h, 'hl2').length, 2);
  assert.strictEqual(find(D.molecule('CC(=O)O', { highlight: { atoms: [0] } }), 'hl1').length, 1);
  const ring = D.molecule('c1ccccc1', { circle: true });
  assert.ok(find(ring, 'bond').some((x) => x.t === 'circle'));
  const plain = D.molecule('c1ccccc1', {});
  assert.ok(!find(plain, 'bond').some((x) => x.t === 'circle'));
  const base = D.layout(C.parse('CCCCC'), {});
  const rot = D.layout(C.parse('CCCCC'), { rotate: 90 });
  const bx = Math.max(...base.pos.map((p) => p.x)) - Math.min(...base.pos.map((p) => p.x));
  const ry = Math.max(...rot.pos.map((p) => p.y)) - Math.min(...rot.pos.map((p) => p.y));
  assert.ok(Math.abs(bx - ry) < 1);
  const fx = D.layout(C.parse('CCO'), { flip: 'x' });
  assert.ok(fx.pos[0].x > fx.pos[2].x, 'flip x puts the first atom on the right');
  const co = D.molecule('CCO', { coords: [[0, 0], [1, 0], [1, 1]] });
  assert.ok(Math.abs(co.atoms[1].x - co.atoms[0].x - 40) < 0.01 && Math.abs(co.atoms[2].y - co.atoms[1].y - 40) < 0.01);
  const mw = D.molecule('C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O', { maxWidth: 200 });
  assert.ok(mw.width <= 200 + 1e-9 && mw.height > 0);
});

test('ions are drawn side by side', () => {
  const d = D.molecule('CC(=O)[O-].[Na+]', {});
  const na = d.atoms[4];
  for (let i = 0; i < 4; i++) assert.ok(na.x > d.atoms[i].x + 20);
  assert.ok(atomTexts(d).includes('Na'));
});

test('the layout is deterministic and drawing all fixtures is fast', () => {
  const t0 = Date.now();
  for (const smi of LINES) {
    const a = D.toString(D.molecule(smi, {}).svg);
    const b = D.toString(D.molecule(smi, {}).svg);
    assert.strictEqual(a, b, smi);
  }
  assert.ok(Date.now() - t0 < 20000, 'took ' + (Date.now() - t0) + ' ms');
});

test('bad input throws a readable error; content refs are accepted', () => {
  assert.throws(() => D.molecule('C(C', {}), (e) => /SMILES/.test(e.message));
  const d = D.molecule({ smi: 'CCO', opts: { allH: true } });
  assert.strictEqual(atomTexts(d).filter((x) => x === 'H').length, 6);
});

// ---- DOM output ---------------------------------------------------------
test('toDom builds namespaced elements and text without innerHTML', () => {
  const log = [];
  const doc = {
    createElementNS(ns, tag) {
      const el = { ns, tag, attrs: {}, kids: [], setAttribute(k, v) { this.attrs[k] = String(v); }, append(k) { this.kids.push(k); }, appendChild(k) { this.kids.push(k); } };
      log.push(el);
      return el;
    },
    createTextNode(t) { return { text: t }; },
  };
  const d = D.molecule('CCO', { targets: 'atoms' });
  const root = D.toDom(d.svg, doc);
  assert.strictEqual(root.tag, 'svg');
  assert.strictEqual(root.ns, 'http://www.w3.org/2000/svg');
  assert.ok(log.length > 8);
  assert.ok(log.every((e) => e.ns === 'http://www.w3.org/2000/svg'));
  assert.ok(root.attrs.viewBox);
  assert.ok(!('style' in root.attrs));
});

test('toString escapes text and attributes', () => {
  const s = D.toString({ t: 'text', a: { title: 'a"b<c' }, c: [{ text: 'x<y&z' }] });
  assert.strictEqual(s, '<text title="a&quot;b&lt;c">x&lt;y&amp;z</text>');
});

// ---- atom numbers keep clear of the structure -----------------------------
function segDist(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(a.x + vx * t - p.x, a.y + vy * t - p.y);
}

test('numbers: every fixture drawn with numbers all still has quality zero', () => {
  for (const smi of LINES) {
    const mol = C.parse(smi);
    const o = { numbers: 'all' };
    const d = D.molecule(smi, o);
    assert.deepEqual(P(D.quality(mol, d.atoms, o)), { overlaps: 0, crossings: 0, labelClashes: 0 }, smi);
  }
});

test('numbers: labels keep 0.35 bond lengths from every bond (phenol, acetic acid, branched, rings)', () => {
  for (const smi of ['Oc1ccccc1', 'CC(=O)O', 'CCC(C)C', 'CC(C)(C)CC(CC)CC', 'CC1=CCCCC1', 'CCc1cccc(C)c1']) {
    const mol = C.parse(smi);
    const d = D.molecule(smi, { numbers: 'all' });
    const nums = find(d, 'num');
    assert.strictEqual(nums.length, mol.atoms.length);
    nums.forEach((n) => {
      const c = { x: Number(n.a.x), y: Number(n.a.y) - 4.5 };
      mol.bonds.forEach((b) => {
        const dd = segDist(c, d.atoms[b.a], d.atoms[b.b]);
        assert.ok(dd >= 14, smi + ' number ' + textOf(n) + ' is ' + dd.toFixed(1) + ' from bond ' + b.a + '-' + b.b);
      });
    });
  }
});

test('lone pairs and a charge on one atom do not share a direction', () => {
  const d = D.molecule('CC(=O)[O-]', { lonePairs: true });
  assert.deepEqual(P(D.quality(C.parse('CC(=O)[O-]'), d.atoms, { lonePairs: true })), { overlaps: 0, crossings: 0, labelClashes: 0 });
  const o = d.atoms[3];
  const ch = find(d, 'charge')[0];
  const ca = Math.atan2(Number(ch.a.y) - o.y, Number(ch.a.x) - o.x);
  find(d, 'lp').forEach((g) => {
    const cx = (Number(g.c[0].a.cx) + Number(g.c[1].a.cx)) / 2;
    const cy = (Number(g.c[0].a.cy) + Number(g.c[1].a.cy)) / 2;
    let da = Math.abs(Math.atan2(cy - o.y, cx - o.x) - ca);
    if (da > Math.PI) da = 2 * Math.PI - da;
    assert.ok(da > 0.7, 'lone pair ' + da.toFixed(2) + ' rad from the charge');
  });
});

// ---- radicals and small inorganic molecules ---------------------------------
test('radicals show one dot per unpaired electron', () => {
  const dots = (smi) => find(D.molecule(smi, {}), 'rad').length;
  assert.strictEqual(dots('[Cl]'), 1);
  assert.strictEqual(dots('[CH3]'), 1);
  assert.strictEqual(dots('[CH2]C=C'), 1);
  assert.strictEqual(dots('C[CH]C'), 1);
  assert.strictEqual(dots('[O]C'), 1);
  assert.strictEqual(dots('CCC'), 0);
  assert.strictEqual(dots('[NH4+]'), 0);
  assert.strictEqual(dots('C[N+](C)(C)C'), 0);
  assert.strictEqual(dots('c1cc[nH]c1'), 0);
  assert.strictEqual(dots('C[C@H](N)O'), 0);
  assert.strictEqual(D.molecule('[CH2]C=C', {}).atoms[0].radical, 1);
  assert.strictEqual(D.molecule('CCC', {}).atoms[0].radical, undefined);
  for (const smi of ['[CH2]C=C', 'C[CH]C', '[O]C', '[Cl]']) {
    const d = D.molecule(smi, {});
    assert.deepEqual(P(D.quality(C.parse(smi), d.atoms)), { overlaps: 0, crossings: 0, labelClashes: 0 }, smi);
  }
});

test('small inorganic molecules read the conventional way', () => {
  const t = (smi) => atomTexts(D.molecule(smi, {})).join('');
  assert.strictEqual(t('Br'), 'HBr');
  assert.strictEqual(t('Cl'), 'HCl');
  assert.strictEqual(t('I'), 'HI');
  assert.strictEqual(t('F'), 'HF');
  assert.strictEqual(t('O'), 'H2O');
  assert.strictEqual(t('S'), 'H2S');
  assert.strictEqual(t('N'), 'NH3');
  assert.strictEqual(t('C'), 'CH4');
  assert.strictEqual(t('[NH4+]'), 'NH4');
  assert.strictEqual(t('CCO'), 'OH');
});

test('a charge is a superscript after the whole label', () => {
  for (const smi of ['[CH2+]C', 'C[OH+]C', 'C[OH2+]', '[OH3+]', 'C[N+](C)(C)C', 'CC(=O)[O-]', 'C[NH3+]', '[CH3-]']) {
    const d = D.molecule(smi, {});
    const ch = find(d, 'charge');
    assert.strictEqual(ch.length, 1, smi);
    const lbl = find(d, 'atom').find((n) => Number(n.a.y) - 6 === d.atoms.find((p, i) => i === Number(ch[0].a['data-n'] || -1))?.y) || find(d, 'atom').filter((n) => Math.abs(Number(n.a.y) - Number(ch[0].a.y)) < 30).sort((a, b) => Math.abs(Number(a.a.x) - Number(ch[0].a.x)) - Math.abs(Number(b.a.x) - Number(ch[0].a.x)))[0];
    assert.ok(lbl, smi);
    assert.ok(Number(ch[0].a.y) <= Number(lbl.a.y) - 6, smi + ': sign baseline ' + ch[0].a.y + ' label baseline ' + lbl.a.y);
    const q = D.quality(C.parse(smi), d.atoms);
    assert.deepEqual(P(q), { overlaps: 0, crossings: 0, labelClashes: 0 }, smi);
  }
});

test('allH on ethene draws H2C=CH2 cleanly', () => {
  const d = D.molecule('C=C', { allH: true });
  assert.strictEqual(atomTexts(d).filter((x) => x === 'H').length, 4);
  assert.strictEqual(atomTexts(d).filter((x) => x === 'C').length, 2);
  assert.deepEqual(P(D.quality(C.parse('C=C'), D.layout(C.parse('C=C'), { allH: true }).pos, { allH: true })), { overlaps: 0, crossings: 0, labelClashes: 0 });
  assert.ok(find(D.molecule('C=C', { allH: true }), 'bond').length >= 6);
});
