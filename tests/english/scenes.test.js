'use strict';
// Draws every picture in every state against a fake DOM: no throwing, nothing styled by attribute,
// and the tap step offers the colonies (and only then).
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, findAll, walk } = require('./fakedom');

const JS = ['lesson.js', 'strings.js', 'engine.js', 'scenes.js'];
const VIEWS = { cut: '108 0 580 330', carrier: '112 12 604 358', join: '12 24 590 340', bacteria: '44 30 700 344', plate: '12 14 760 372', sequence: '20 6 760 392' };
const COUNTS = { cut: 4, carrier: 4, join: 4, bacteria: 3, plate: 5, sequence: 5 };

test('every scene draws in every state, animated or not', () => {
  const { doc, ENG } = boot(JS);
  for (const id of Object.keys(COUNTS)) {
    for (let n = 0; n <= COUNTS[id]; n++) {
      for (const animate of [false, true]) {
        const svg = doc.createElementNS('', 'svg');
        ENG.drawScene(svg, id, n, animate);
        const count = findAll(svg, () => true).length;
        assert.ok(count > 5, `${id} n=${n} animate=${animate} drew ${count}`);
        assert.equal(svg.getAttribute('viewBox'), VIEWS[id], 'one viewBox for every state of ' + id);
        // redrawing clears the previous picture
        ENG.drawScene(svg, id, n, animate);
        assert.equal(findAll(svg, (e) => e.localName === 'g' && /^scene-/.test(e.className)).length, 1);
      }
    }
  }
  assert.equal(doc.styleWrites.filter((w) => w[1] === 'style-attribute').length, 0);
});

test('every scene is a different picture at each step', () => {
  const { doc, ENG } = boot(JS);
  const shape = (id, n) => {
    const svg = doc.createElementNS('', 'svg');
    ENG.drawScene(svg, id, n, false);
    const parts = [];
    walk(svg, (e) => { if (e.nodeType === 1) parts.push(e.localName + e.className + JSON.stringify(e.attrs) + e.textContent); });
    return parts.join('|');
  };
  for (const id of Object.keys(COUNTS)) {
    const seen = new Set();
    for (let n = 0; n <= COUNTS[id]; n++) seen.add(shape(id, n));
    assert.equal(seen.size, COUNTS[id] + 1, id + ' has a distinct picture for every state');
  }
});

test('the plate offers colonies to tap only on the tap step', () => {
  const { doc, ENG } = boot(JS);
  const taps = (n) => {
    const svg = doc.createElementNS('', 'svg');
    return ENG.drawScene(svg, 'plate', n, false).taps;
  };
  for (const n of [0, 1, 2, 3, 5]) assert.equal(taps(n).length, 0, 'n=' + n);
  const t = taps(4);
  assert.equal(t.length, 8);
  assert.equal(t.filter((x) => x.kind === 'white').length, 3);
  assert.equal(t.filter((x) => x.kind === 'blue').length, 5);
  for (const x of t) {
    assert.equal(x.el.getAttribute('role'), 'button');
    assert.equal(x.el.getAttribute('tabindex'), '0');
    assert.ok(x.el.getAttribute('aria-label'));
  }
});

test('animations come from classes and delays set through the style object', () => {
  const { doc, ENG } = boot(JS);
  const svg = doc.createElementNS('', 'svg');
  ENG.drawScene(svg, 'sequence', 2, true);
  const animated = findAll(svg, (e) => / fx /.test(' ' + e.className + ' '));
  assert.ok(animated.length > 5);
  assert.equal(doc.styleWrites.filter((w) => w[1] === 'style-attribute').length, 0);
});

test('no animated element carries an SVG transform attribute (the CSS animation would override it)', () => {
  const { doc, ENG } = boot(JS);
  for (const id of Object.keys(COUNTS)) {
    for (let n = 0; n <= COUNTS[id]; n++) {
      const svg = doc.createElementNS('', 'svg');
      ENG.drawScene(svg, id, n, true);
      const bad = findAll(svg, (e) => e.nodeType === 1 && /\bfx\b|\bfx-/.test(e.className) && e.getAttribute('transform') !== null);
      assert.equal(bad.length, 0, `${id} n=${n}: ${bad.length} animated element(s) with a transform attribute`);
    }
  }
});
