'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../site/shared/site.js');

const ROOT = 'https://beagle.lt/';
const math = { id: 'math', path: 'math/', name: { lt: 'Matematika', en: 'Mathematics' } };
const physics = { id: 'physics', path: 'physics/', name: { lt: 'Fizika', en: 'Physics' } };
const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };

test('normLang accepts only lt and en, defaulting to lt', () => {
  assert.equal(core.normLang('en'), 'en');
  for (const v of ['lt', 'de', '', 'EN', null, undefined, 5, {}]) assert.equal(core.normLang(v), 'lt');
});

test('language survives a round trip through storage under beagle-lang', () => {
  const s = mem();
  assert.equal(core.LANG_KEY, 'beagle-lang');
  assert.equal(core.readLang(s), 'lt');
  core.writeLang(s, 'en');
  assert.equal(s.getItem('beagle-lang'), 'en');
  assert.equal(core.readLang(s), 'en');
  core.writeLang(s, 'de');
  assert.equal(s.getItem('beagle-lang'), 'lt');
});

test('blocked or missing storage never throws and reads as lt', () => {
  assert.equal(core.readLang(throwing), 'lt');
  assert.equal(core.readLang(null), 'lt');
  assert.doesNotThrow(() => core.writeLang(throwing, 'en'));
  assert.doesNotThrow(() => core.writeLang(undefined, 'en'));
});

test('pick returns the asked language, then the other, then empty', () => {
  assert.equal(core.pick({ lt: 'A', en: 'B' }, 'en'), 'B');
  assert.equal(core.pick({ lt: 'A' }, 'en'), 'A');
  assert.equal(core.pick({ en: 'B' }, 'lt'), 'B');
  assert.equal(core.pick('plain', 'en'), 'plain');
  for (const v of [null, undefined, {}, { lt: 5 }, 7]) assert.equal(core.pick(v, 'lt'), '');
});

test('validTrainer needs a safe id, a path and a name in both languages', () => {
  assert.equal(core.validTrainer(math), true);
  for (const bad of [null, 'math', {}, { ...math, id: 'Math' }, { ...math, id: 'a b' }, { ...math, id: '' },
    { ...math, path: '' }, { ...math, path: 3 }, { ...math, name: 'Matematika' }, { ...math, name: { lt: 'Matematika' } }, { ...math, name: { lt: '', en: 'x' } }])
    assert.equal(core.validTrainer(bad), false);
});

test('trainerUrl stays under the site root', () => {
  assert.equal(core.trainerUrl(math, ROOT), 'https://beagle.lt/math/');
  assert.equal(core.trainerUrl(math, 'http://localhost:8000/'), 'http://localhost:8000/math/');
  for (const p of ['https://evil.example/', '//evil.example/x', 'javascript:alert(1)', 'http://beagle.lt/math/'])
    assert.equal(core.trainerUrl({ ...math, path: p }, ROOT), ROOT, p);
  const sub = 'https://example.org/site/';
  for (const p of ['../other/', '/other/']) assert.equal(core.trainerUrl({ ...math, path: p }, sub), sub, p);
});

test('cleanTrainers drops bad and repeated entries and survives garbage', () => {
  assert.deepEqual(core.cleanTrainers({ trainers: [math, { id: 'X' }, physics, { ...math, path: 'other/' }] }), [math, physics]);
  for (const junk of [null, undefined, 'x', [], {}, { trainers: 'math' }, { trainers: null }]) assert.deepEqual(core.cleanTrainers(junk), []);
});

test('barModel always has the home link and lists trainers only when there are two or more', () => {
  assert.deepEqual(core.barModel([], 'math', 'lt', ROOT), { homeHref: ROOT, label: 'Treniruokliai', choose: 'Pasirinkite treniruoklį', options: [] });
  assert.deepEqual(core.barModel([math], 'math', 'en', ROOT).options, []);
  assert.deepEqual(core.barModel([math, physics], 'math', 'en', ROOT), {
    homeHref: ROOT, label: 'Trainers', choose: 'Choose a trainer',
    options: [{ href: 'https://beagle.lt/math/', text: 'Mathematics', current: true }, { href: 'https://beagle.lt/physics/', text: 'Physics', current: false }]
  });
});

test('every interface text exists in both languages', () => {
  assert.deepEqual(Object.keys(core.STR.lt).sort(), Object.keys(core.STR.en).sort());
  for (const lang of ['lt', 'en']) for (const [k, v] of Object.entries(core.STR[lang])) assert.ok(typeof v === 'string' && v.length > 0, lang + '.' + k);
  assert.equal(core.STR.lt.heading, 'Treniruokliai');
  assert.equal(core.STR.en.heading, 'Trainers');
});
