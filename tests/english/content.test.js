'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load');

const ENG = load();
const L = ENG.lesson;
const steps = L.scenes.flatMap((s) => s.steps);
const entry = (w) => L.glossary.find((e) => e.term === w || e.forms.includes(w));

test('six scenes with 4,4,4,3,5,5 steps (25 total)', () => {
  assert.deepEqual(load.plain(L.scenes.map((s) => s.id)), ['cut', 'carrier', 'join', 'bacteria', 'plate', 'sequence']);
  assert.deepEqual(load.plain(L.scenes.map((s) => s.steps.length)), [4, 4, 4, 3, 5, 5]);
  assert.equal(steps.length, 25);
});

test('every choice step has exactly one blank and 4 distinct words', () => {
  for (const s of steps.filter((x) => x.type === 'choice')) {
    assert.equal(s.text.split('___').length, 2, s.text);
    assert.equal(s.distractors.length, 3, s.text);
    assert.equal(new Set([s.answer, ...s.distractors]).size, 4, s.text);
  }
});

test('every word used resolves to a word-list entry', () => {
  for (const s of steps) {
    const words = s.type === 'choice' ? [s.answer, ...s.distractors] : [s.term];
    for (const w of words) assert.ok(entry(w), 'no entry for ' + w);
  }
});

test('word list has 31 entries, each used at least once', () => {
  assert.equal(L.glossary.length, 31);
  assert.equal(new Set(L.glossary.map((e) => e.term)).size, 31);
  const used = new Set();
  for (const s of steps) {
    for (const w of s.type === 'choice' ? [s.answer, ...s.distractors] : [s.term]) used.add(entry(w).term);
  }
  for (const e of L.glossary) {
    assert.ok(e.def && e.def.length > 10, e.term);
    assert.ok(['8.3', '8.4', '8.7'].includes(e.section), e.term);
    assert.ok(used.has(e.term), 'unused: ' + e.term);
  }
});

test('step 20 is the tap step for blue-white screening', () => {
  const plate = L.scenes.find((s) => s.id === 'plate');
  assert.equal(plate.steps[4].type, 'tap');
  assert.equal(plate.steps[4].term, 'blue-white screening');
  assert.equal(steps.filter((s) => s.type === 'tap').length, 1);
});

test('content is verbatim from the spec', () => {
  assert.equal(steps[2].text, "GAATTC reads the same 5'→3' on both strands, so it is a ___.");
  assert.equal(steps[21].text, "The reaction also contains nucleotides that lack the 3'-OH, so the chain stops when one is added: ___.");
  assert.equal(steps[18].text, 'The agar also contains a colourless compound that turns blue when β-galactosidase cleaves it: ___.');
  assert.equal(entry('palindrome').def, "a sequence that reads the same 5'→3' on both strands, e.g. GAATTC.");
  assert.equal(entry('ddNTPs').def, "dideoxynucleotides; they lack the 3'-OH, so the chain stops when one is added (chain terminators).");
});

test('scene titles are plain English strings', () => {
  for (const s of L.scenes) assert.equal(typeof s.title, 'string', s.id);
  assert.equal(L.scenes[0].title, 'Cut');
  assert.equal(L.scenes[5].title, 'Read the sequence');
});

test('ui strings are one English table with no lt key, all non-empty', () => {
  assert.equal(ENG.STR.lt, undefined);
  assert.equal(ENG.STR.en, undefined);
  for (const [k, v] of Object.entries(ENG.STR)) assert.ok(typeof v === 'string' && v.trim(), k);
  assert.equal(ENG.STR.start, 'Start');
  assert.equal(ENG.fmt('Scene {n}/{m}', { n: 2, m: 6 }), 'Scene 2/6');
});

test('the tap step carries its two feedback lines and the sections are named', () => {
  const tap = steps[19];
  assert.ok(tap.right && tap.wrong);
  assert.deepEqual(Object.keys(L.sections), ['8.3', '8.4', '8.7']);
});
