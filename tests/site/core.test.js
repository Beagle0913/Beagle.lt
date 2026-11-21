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

// ---- the switcher disclosure, built on a tiny stand-in for the DOM ----
function fakeDoc() {
  const listeners = {};
  const make = tag => {
    const n = { tag, children: [], attrs: {}, hidden: false, className: '', textContent: '', handlers: {}, focused: 0 };
    n.setAttribute = (k, v) => { n.attrs[k] = String(v); };
    n.getAttribute = k => (k in n.attrs ? n.attrs[k] : null);
    n.append = (...c) => { for (const x of c) { if (typeof x !== 'string') x.parent = n; n.children.push(x); } };
    n.addEventListener = (t, f) => { (n.handlers[t] = n.handlers[t] || []).push(f); };
    n.fire = (t, e) => { for (const f of n.handlers[t] || []) f(e || {}); };
    n.contains = x => { for (let c = x; c; c = c.parent) if (c === n) return true; return false; };
    n.focus = () => { n.focused++; };
    n.remove = () => {};
    return n;
  };
  return {
    createElement: make,
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener: (t, f) => { listeners[t] = (listeners[t] || []).filter(x => x !== f); },
    fire: (t, e) => { for (const f of listeners[t] || []) f(e || {}); },
    count: t => (listeners[t] || []).length
  };
}
const find = (n, tag, out = []) => { if (n.tag === tag) out.push(n); for (const c of n.children) if (typeof c !== 'string') find(c, tag, out); return out; };
const twoModel = () => core.barModel([math, physics], 'math', 'en', ROOT);

test('with two trainers the bar offers a disclosure button and a hidden list of links, never a select', () => {
  const doc = fakeDoc();
  const sw = core.createSwitcher(doc, twoModel());
  assert.equal(find(sw.root, 'select').length, 0);
  const button = find(sw.root, 'button')[0];
  assert.equal(button, sw.button);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.ok(button.getAttribute('aria-controls'));
  assert.equal(sw.list.id, button.getAttribute('aria-controls'));
  assert.equal(sw.list.hidden, true);
  const links = find(sw.list, 'a');
  assert.deepEqual(links.map(a => a.href), ['https://beagle.lt/physics/']);
  assert.deepEqual(links.map(a => a.textContent), ['Physics']);
  assert.ok(find(sw.root, 'button').every(b => b === button));
  assert.ok(button.children.some(c => c.textContent === 'Mathematics') || button.textContent.includes('Mathematics'));
});

test('the current trainer is on the button and not in the list; links come from the model only', () => {
  const m = core.barModel([math, physics, { ...math, id: 'evil', path: 'https://evil.example/', name: { lt: 'X', en: 'Evil' } }], 'physics', 'en', ROOT);
  const sw = core.createSwitcher(fakeDoc(), m);
  const hrefs = find(sw.list, 'a').map(a => a.href);
  assert.deepEqual(hrefs, ['https://beagle.lt/math/', ROOT]);
  assert.ok(!find(sw.list, 'a').some(a => a.textContent === 'Physics'));
  assert.ok(hrefs.every(h => h.startsWith(ROOT)));
});

test('with one trainer there is no switcher', () => {
  assert.equal(core.createSwitcher(fakeDoc(), core.barModel([math], 'math', 'en', ROOT)), null);
  assert.equal(core.createSwitcher(fakeDoc(), core.barModel([], 'math', 'en', ROOT)), null);
});

test('the button toggles the list; Escape closes it and returns focus to the button; a click outside closes it', () => {
  const doc = fakeDoc();
  const sw = core.createSwitcher(doc, twoModel());
  sw.button.fire('click');
  assert.equal(sw.button.getAttribute('aria-expanded'), 'true');
  assert.equal(sw.list.hidden, false);
  sw.button.fire('click');
  assert.equal(sw.button.getAttribute('aria-expanded'), 'false');
  assert.equal(sw.list.hidden, true);

  sw.button.fire('click');
  let prevented = 0;
  const before = sw.button.focused;
  sw.root.fire('keydown', { key: 'Escape', preventDefault() { prevented++; } });
  assert.equal(sw.list.hidden, true);
  assert.equal(sw.button.getAttribute('aria-expanded'), 'false');
  assert.equal(sw.button.focused, before + 1);

  sw.button.fire('click');
  doc.fire('click', { target: sw.button });
  assert.equal(sw.list.hidden, false, 'a click inside stays open');
  doc.fire('click', { target: doc.createElement('p') });
  assert.equal(sw.list.hidden, true);
});

test('stepping through the list does not navigate; only activating a link does', () => {
  const sw = core.createSwitcher(fakeDoc(), twoModel());
  sw.button.fire('click');
  // no handler on the list or links turns focus or arrow keys into navigation
  for (const n of [sw.root, sw.list, sw.button, ...find(sw.list, 'a')]) {
    assert.equal((n.handlers.change || []).length, 0);
    assert.equal((n.handlers.focus || []).length, 0);
  }
  assert.equal(find(sw.list, 'a')[0].href, 'https://beagle.lt/physics/');
});

test('destroy removes the document listener', () => {
  const doc = fakeDoc();
  const sw = core.createSwitcher(doc, twoModel());
  assert.equal(doc.count('click'), 1);
  sw.destroy();
  assert.equal(doc.count('click'), 0);
});
