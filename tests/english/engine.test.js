'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load');

const ENG = load();
const L = ENG.lesson;

// a tiny seeded generator (mulberry32)
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const def = (g, i) => L.scenes[g.steps[i].scene].steps[g.steps[i].step];

test('shuffle gives a permutation, does not mutate, and is deterministic with a seed', () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const a = ENG.shuffle(src, seeded(7)), b = ENG.shuffle(src, seeded(7));
  assert.deepEqual(load.plain(src), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(load.plain(a).slice().sort(), src);
  assert.deepEqual(load.plain(a), load.plain(b));
});

test('entryFor finds terms and other forms', () => {
  assert.equal(ENG.entryFor('colonies').term, 'colony');
  assert.equal(ENG.entryFor('ddNTP').term, 'ddNTPs');
  assert.equal(ENG.entryFor('palindrome').term, 'palindrome');
  assert.equal(ENG.entryFor('nonsense'), null);
});

test('a new game has 25 steps, choices are shuffled but complete', () => {
  const g = ENG.newGame(L, seeded(1));
  assert.equal(g.steps.length, 25);
  assert.equal(ENG.current(g), 0);
  for (let i = 0; i < 25; i++) {
    const d = def(g, i);
    if (d.type === 'tap') { assert.equal(g.steps[i].choices.length, 0); continue; }
    assert.deepEqual(load.plain(g.steps[i].choices).slice().sort(), [d.answer, ...d.distractors].sort());
  }
  const other = ENG.newGame(L, seeded(2));
  assert.notDeepEqual(load.plain(g.steps.map((s) => s.choices)), load.plain(other.steps.map((s) => s.choices)));
});

test('wrong then right: not first try, solved; right first time: first try', () => {
  const g = ENG.newGame(L, seeded(3));
  const w = ENG.answer(g, 'DNA ligase');
  assert.equal(w.correct, false);
  assert.equal(g.steps[0].solved, false);
  assert.equal(ENG.answer(g, 'restriction endonuclease').correct, true);
  assert.equal(g.steps[0].solved, true);
  assert.equal(g.steps[0].firstTry, false);
  ENG.goto(g, 1);
  assert.equal(ENG.answer(g, 'restriction site').correct, true);
  assert.equal(g.steps[1].firstTry, true);
  assert.deepEqual(load.plain(ENG.score(g)), { firstTry: 1, total: 25 });
});

test('answering a solved step again changes nothing', () => {
  const g = ENG.newGame(L, seeded(4));
  ENG.answer(g, 'restriction endonuclease');
  const again = ENG.answer(g, 'restriction endonuclease');
  assert.equal(again.already, true);
  assert.equal(again.correct, true);
  const wrong = ENG.answer(g, 'phosphatase');
  assert.equal(wrong.already, true);
  assert.equal(g.steps[0].firstTry, true);
  assert.equal(ENG.score(g).firstTry, 1);
});

test('goto clamps to the step range', () => {
  const g = ENG.newGame(L, seeded(5));
  assert.equal(ENG.goto(g, -1), 0);
  assert.equal(ENG.goto(g, 99), 24);
  assert.equal(ENG.current(g), 24);
  assert.equal(g.pos.scene, 5);
  assert.equal(g.pos.step, 4);
});

test('tap step: blue is wrong, white is right', () => {
  const g = ENG.newGame(L, seeded(6));
  ENG.goto(g, 19);
  const b = ENG.answer(g, 'blue');
  assert.equal(b.correct, false);
  assert.equal(b.entry.term, 'blue-white screening');
  assert.equal(g.steps[19].solved, false);
  const w = ENG.answer(g, 'white');
  assert.equal(w.correct, true);
  assert.equal(w.entry.term, 'blue-white screening');
  assert.equal(g.steps[19].firstTry, false);
});

test('all 25 right first time scores 25 / 25', () => {
  const g = ENG.newGame(L, seeded(8));
  for (let i = 0; i < 25; i++) {
    ENG.goto(g, i);
    const d = def(g, i);
    assert.equal(ENG.answer(g, d.type === 'tap' ? 'white' : d.answer).correct, true);
  }
  assert.deepEqual(load.plain(ENG.score(g)), { firstTry: 25, total: 25 });
  assert.equal(ENG.solvedCount(g, 4), 5);
});

test("a wrong answer's entry is the chosen word's definition", () => {
  const g = ENG.newGame(L, seeded(9));
  const r = ENG.answer(g, 'phosphatase');
  assert.equal(r.correct, false);
  assert.equal(r.entry.def, ENG.entryFor('phosphatase').def);
  assert.ok(r.entry.def.includes('5\'-phosphate'));
});
