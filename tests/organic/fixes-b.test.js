'use strict';
// Regression tests for the fact-check fixes B1-B8 (units u01 and u02).
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const u01 = load.unit('site/organic/units/u01.js');
const u02 = load.unit('site/organic/units/u02.js');
const type = (u, id) => u.types.find((x) => x.id === id);

// load.unit runs the engine in its own context; ORG.check is reached through a second load
const ORG = load(['chem.js', 'stereo.js', 'draw.js', 'views.js', 'name.js', 'react.js', 'units.js', 'check.js']);
const texts = (p) => JSON.stringify(p);
const make = (u, id, seed) => ORG.check.makeProblem(type(u, id), seed);

test('B1/B2: u01.formulas never shows null and never marks a skeletal drawing as condensed', () => {
  const ty = type(u01, 'u01.formulas');
  // seeds the reviewers reported (the draw layout is slow, so not all 2000), plus a run of the first ones
  const seeds = [24, 32, 99, 115, 163, 178, 212, 215, 240, 256, 271, 296, 319, 325, 347, 363, 370, 384, 389];
  for (let i = 1; i <= 120; i++) seeds.push(i);
  for (const seed of seeds) {
    const p = ORG.check.makeProblem(ty, seed);
    const s = texts(p);
    assert.ok(!/null|undefined/.test(s), 'seed ' + seed + ' shows null');
    const cond = (p.q || []).find((b) => b.mol && b.mol.opts && b.mol.opts.condensed);
    if (cond) assert.notStrictEqual(ORG.draw.condensed(ORG.chem.parse(cond.mol.smi)), null, 'seed ' + seed + ': ' + cond.mol.smi + ' has no condensed formula');
  }
});

test('B3: amine and amide labels name the secondary and tertiary forms too', () => {
  const s = fs_read('site/organic/units/u01.js');
  assert.ok(s.includes("sym: '–NH2, –NHR, –NR2'"));
  assert.ok(s.includes("sym: '–CONH2, –CONHR, –CONR2'"));
});

test('B4: classify hint, option and solution do not call aromaticity six-membered or double bonds only', () => {
  const ty = type(u01, 'u01.classify');
  let seen = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const s = texts(ORG.check.makeProblem(ty, seed));
    seen++;
    assert.ok(!/šešių narių/.test(s), 'LT hint still says six-membered');
    assert.ok(/4n\+2/.test(s));
    assert.ok(!/conjugated \$π\$ system in the ring/.test(s));
  }
  assert.ok(seen);
});

test('B5/B6: radicals table and valence texts', () => {
  const s = fs_read('site/organic/units/u01.js');
  assert.ok(!s.includes("t('metilas, etilas', 'methyl, ethyl')"));
  assert.ok(s.includes("'from methane (a methyl carbon)'"));
  assert.ok(s.includes('In neutral molecules a halogen forms one bond'));
  assert.ok(s.includes('Neutraliose molekulėse halogenas'));
  assert.ok(s.includes('in neutral compounds sulfur does not have an odd number of bonds'));
  assert.ok(s.includes('neutraliuose junginiuose siera'));
});

test('B7: u02.bondtype labels C=C and C≡C with their bond order', () => {
  const ty = type(u02, 'u02.bondtype');
  const seen = new Set();
  for (let seed = 1; seed <= 2000; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const intro = p.q[0].p.en;
    const m = /bond is \$([A-Za-z]+)([–=≡])([A-Za-z]+)\$/.exec(intro);
    if (!m) continue;
    const mol = ORG.chem.parse(p.q[2].mol.smi);
    const hl = p.q[2].mol.opts.highlight.bonds[0];
    const bond = mol.bonds.find((b) => (b.a === hl[0] && b.b === hl[1]) || (b.a === hl[1] && b.b === hl[0]));
    const want = bond.order === 2 ? '=' : bond.order === 3 ? '≡' : '–';
    assert.strictEqual(m[2], want, 'seed ' + seed + ': ' + intro);
    assert.strictEqual(p.q[0].p.lt.includes('$' + m[1] + m[2] + m[3] + '$'), true);
    seen.add(m[1] + m[2] + m[3]);
  }
  assert.ok(seen.has('C=C') && seen.has('C≡C'), 'double and triple C bonds are generated: ' + [...seen]);
});

test('B8: sodium acetylide caption gives the sp-carbon numbers, and they add up', () => {
  const s = fs_read('site/organic/units/u02.js');
  assert.ok(s.includes('ΔEN = 3.1 ($sp$ C) − 0.9 = 2.2, ionic'));
  assert.ok(s.includes('ΔEN = 3,1 ($sp$ C) − 0,9 = 2,2, joninis'));
  assert.ok(!s.includes('ΔEN large, ionic'));
});

function fs_read(f) { return require('node:fs').readFileSync(require('node:path').join(__dirname, '..', '..', f), 'utf8'); }
