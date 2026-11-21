'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const JS = path.join(__dirname, '..', '..', 'site', 'organic', 'js');
const plain = x => JSON.parse(JSON.stringify(x));
const ctx = vm.createContext({});
for (const f of ['units.js', 'check.js', 'progress.js']) vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), ctx, { filename: f });
const P = ctx.ORG.progress;

const good = (s, id, ref) => P.record(s, id, { firstTry: true, hinted: false, problemRef: ref });

test('load: nothing, rubbish, foreign versions and huge numbers give a clean state', () => {
  const clean = plain(P.load(null));
  assert.deepEqual(clean.types, {});
  assert.deepEqual(clean.missed, []);
  for (const raw of ['not json', '', '[]', '123', 'null', '"x"', '{"v":9}', '{"v":1}', '{"v":1,"types":[]}', '{"v":1,"types":5,"missed":"x","sections":7}'])
    assert.deepEqual(plain(P.load(raw)), clean, raw);
  const big = P.load('{"v":1,"types":{"x":{"streak":1e99,"attempts":-4,"first":"a"}}}');
  const x = big.types.x || { streak: 0, attempts: 0, first: 0 };
  for (const k of ['streak', 'attempts', 'first']) assert.ok(Number.isInteger(x[k]) && x[k] >= 0 && x[k] <= 1e6, k);
  assert.equal(x.attempts, 0);
  assert.equal(x.first, 0);
});

test('load: fields are ignored one by one', () => {
  const raw = JSON.stringify({
    v: 1,
    types: { 'u01.a': { attempts: 5, first: 3, streak: 2 }, '<script>': { streak: 3 }, 'u02.b': 'bad', 'u03.c': { streak: 2.7, attempts: 'x' } },
    missed: [{ type: 'u01.a', seed: 4 }, { type: 7, seed: 1 }, { type: 'u01.a', seed: 4 }, { type: 'u01.a', seed: 1e99 }, 'x', null, { type: '../../x', seed: 1 }],
    sections: { u01: ['intro', 3, 'more', '<b>'], 'bad id': ['a'], u02: 'x' }
  });
  const s = P.load(raw);
  assert.deepEqual(plain(s.types['u01.a']), { attempts: 5, first: 3, streak: 2 });
  assert.equal(s.types['<script>'], undefined);
  assert.equal(s.types['u02.b'], undefined);
  assert.equal(s.types['u03.c'].streak, 2);
  assert.equal(s.types['u03.c'].attempts, 0);
  assert.deepEqual(plain(P.reviewQueue(s)), [{ type: 'u01.a', seed: 4 }]);
  assert.deepEqual(plain(s.sections), { u01: ['intro', 'more'] });
});

test('save and load round-trip', () => {
  const s = P.load(null);
  good(s, 'u01.a', { type: 'u01.a', seed: 1 });
  P.record(s, 'u01.b', { firstTry: false, hinted: false, problemRef: { type: 'u01.b', seed: 9 } });
  P.openSection(s, 'u01', 'intro');
  const raw = P.save(s);
  assert.equal(typeof raw, 'string');
  assert.deepEqual(plain(P.load(raw)), plain(s));
});

test('mastered after three first-try answers in a row without hints', () => {
  const s = P.load(null);
  assert.equal(P.mastered(s, 't.a'), false);
  assert.equal(P.stars(s, 't.a'), 0);
  good(s, 't.a'); good(s, 't.a');
  assert.equal(P.stars(s, 't.a'), 2);
  assert.equal(P.mastered(s, 't.a'), false);
  good(s, 't.a');
  assert.equal(P.stars(s, 't.a'), 3);
  assert.equal(P.mastered(s, 't.a'), true);
  good(s, 't.a');
  assert.equal(P.stars(s, 't.a'), 3, 'stars stop at three');
  assert.equal(P.mastered(s, 'never.seen'), false);
});

test('a hinted answer or a miss resets the streak', () => {
  const s = P.load(null);
  good(s, 't.a'); good(s, 't.a');
  P.record(s, 't.a', { firstTry: true, hinted: true, problemRef: { type: 't.a', seed: 1 } });
  assert.equal(P.stars(s, 't.a'), 0);
  good(s, 't.a'); good(s, 't.a'); good(s, 't.a');
  assert.equal(P.mastered(s, 't.a'), true);
  P.record(s, 't.a', { firstTry: false, hinted: false, problemRef: { type: 't.a', seed: 2 } });
  assert.equal(P.mastered(s, 't.a'), false);
  assert.equal(s.types['t.a'].attempts, 7);
  assert.equal(s.types['t.a'].first, 5);
});

test('wrong answers enter the review queue and leave after a first-try right answer', () => {
  const s = P.load(null);
  const ref = { type: 't.a', seed: 11 };
  P.record(s, 't.a', { firstTry: false, hinted: false, problemRef: ref });
  P.record(s, 't.a', { firstTry: false, hinted: true, problemRef: ref });
  assert.deepEqual(plain(P.reviewQueue(s)), [ref], 'once, not twice');
  P.record(s, 't.a', { firstTry: false, hinted: false, problemRef: { type: 't.b', seed: 3 } });
  assert.equal(P.reviewQueue(s).length, 2);
  good(s, 't.a', { type: 't.a', seed: 12 });
  assert.equal(P.reviewQueue(s).length, 2, 'another problem does not clear it');
  good(s, 't.a', ref);
  assert.deepEqual(plain(P.reviewQueue(s)), [{ type: 't.b', seed: 3 }]);
  P.forget(s, { type: 't.b', seed: 3 });
  assert.deepEqual(plain(P.reviewQueue(s)), []);
  // a queue cannot grow without bound
  for (let i = 0; i < 500; i++) P.record(s, 't.a', { firstTry: false, hinted: false, problemRef: { type: 't.a', seed: i } });
  assert.ok(P.reviewQueue(s).length <= 200);
  // record without a reference still works
  assert.doesNotThrow(() => P.record(s, 't.z', { firstTry: false, hinted: false }));
});

test('unit share counts mastered types', () => {
  const s = P.load(null);
  const unit = { id: 'u01', types: [{ id: 'u01.a' }, { id: 'u01.b' }, { id: 'u01.c' }, { id: 'u01.d' }] };
  assert.equal(P.unitShare(s, unit), 0);
  for (let i = 0; i < 3; i++) { good(s, 'u01.a'); good(s, 'u01.b'); }
  good(s, 'u01.c');
  assert.equal(P.unitShare(s, unit), 0.5);
  assert.deepEqual(plain(P.unitCounts(s, unit)), { done: 2, total: 4 });
  P.rememberTotal(s, 'u01', 4);
  assert.deepEqual(plain(P.unitCounts(s, { id: 'u01' })), { done: 2, total: 4 }, 'a unit not loaded uses the remembered total');
  assert.deepEqual(plain(P.unitCounts(s, { id: 'u02' })), { done: 0, total: 0 });
  assert.equal(P.unitShare(s, { id: 'u02', types: [] }), 0);
});

test('examScore: weights 0.3, 0.5 and 0.8 over ten problems', () => {
  const full = n => Array.from({ length: n }, () => ({ right: 2, steps: 2 }));
  assert.deepEqual(plain(P.examScore(full(10), 'mt1')), { score: 3, max: 3, pass: null });
  assert.deepEqual(plain(P.examScore(full(10), 'mt2')), { score: 5, max: 5, pass: true });
  assert.deepEqual(plain(P.examScore(full(10), 'exam')), { score: 8, max: 8, pass: null });
  const three = P.examScore(full(3), 'mt2');
  assert.equal(three.score, 1.5);
  assert.equal(three.max, 5);
  assert.equal(three.pass, false);
  assert.equal(P.examScore([{ share: 1 }, { share: 1 }, { share: 1 }, { share: 0.4 }], 'mt2').score, 1.7);
  assert.equal(P.examScore([{ share: 1 }, { share: 1 }, { share: 1 }, { share: 0.4 }], 'mt2').pass, true);
  assert.equal(P.examScore([{ right: 1, steps: 3 }], 'exam').score, 0.27);
  assert.equal(P.examScore([], 'mt2').score, 0);
  assert.equal(P.examScore([{ right: 5, steps: 0 }, { share: 7 }, { share: -2 }, null], 'mt1').score, 0.3);
  assert.throws(() => P.examScore([], 'nope'));
});

test('the exam weights are exposed', () => {
  assert.deepEqual(plain(P.EXAMS), { mt1: { weight: 0.3, pass: null }, mt2: { weight: 0.5, pass: 1.7 }, exam: { weight: 0.8, pass: null } });
});
