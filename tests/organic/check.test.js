'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const JS = path.join(__dirname, '..', '..', 'site', 'organic', 'js');
const FIX = path.join(__dirname, 'fixtures');
const plain = x => JSON.parse(JSON.stringify(x));
// Own small loader (units.js, check.js, progress.js only), so these tests do not depend on the engine files.
function load() {
  const ctx = vm.createContext({});
  for (const f of ['units.js', 'check.js', 'progress.js']) vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
function loadWithFixture(name = 'unit-a.js') {
  const ctx = load();
  vm.runInContext(fs.readFileSync(path.join(FIX, name), 'utf8'), ctx, { filename: name });
  return ctx.ORG;
}
const ORG = loadWithFixture();
const C = ORG.check;
const unitA = ORG.units.u01;
// deep copy that keeps functions
const clone = o => Array.isArray(o) ? o.map(clone) : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, clone(v)])) : o;

test('markup: subscripts, bold, charges', () => {
  assert.deepEqual(plain(C.markup('$CH3CH2OH$ ir **svarbu**')), [
    { text: 'CH' }, { text: '3', sub: true }, { text: 'CH' }, { text: '2', sub: true }, { text: 'OH ir ' }, { text: 'svarbu', b: true }]);
  assert.deepEqual(plain(C.markup('$NO2+$')), [{ text: 'NO' }, { text: '2', sub: true }, { text: '+', sup: true }]);
  assert.deepEqual(plain(C.markup('$SO4^2-^$')), [{ text: 'SO' }, { text: '4', sub: true }, { text: '2−', sup: true }]);
  assert.deepEqual(plain(C.markup('$Ca^2+^$')), [{ text: 'Ca' }, { text: '2+', sup: true }]);
  assert.deepEqual(plain(C.markup('$[Fe(CN)6]3-$')), [{ text: '[Fe(CN)' }, { text: '6', sub: true }, { text: ']' }, { text: '3−', sup: true }]);
  assert.deepEqual(plain(C.markup('$CH3COO-$')), [{ text: 'CH' }, { text: '3', sub: true }, { text: 'COO' }, { text: '−', sup: true }]);
  assert.deepEqual(plain(C.markup('$CH3•$')), [{ text: 'CH' }, { text: '3', sub: true }, { text: '•', sup: true }]);
  assert.deepEqual(plain(C.markup('$(CH3)2CH$')), [{ text: '(CH' }, { text: '3', sub: true }, { text: ')' }, { text: '2', sub: true }, { text: 'CH' }]);
  assert.deepEqual(plain(C.markup('*kursyvas* ir **$H2O$**')), [{ text: 'kursyvas', i: true }, { text: ' ir ' }, { text: 'H', b: true }, { text: '2', b: true, sub: true }, { text: 'O', b: true }]);
});
test('markup: plain text, stray symbols and hostile input stay text', () => {
  assert.deepEqual(plain(C.markup('abc')), [{ text: 'abc' }]);
  assert.deepEqual(plain(C.markup('')), []);
  assert.deepEqual(plain(C.markup('2-metil 5 $ kaina')), [{ text: '2-metil 5 $ kaina' }]);
  assert.deepEqual(plain(C.markup('<b>x</b> $a<i>1$')).map(s => s.text).join(''), '<b>x</b> a<i>1');
  assert.deepEqual(plain(C.markup(null)), []);
});

test('normName: spaces, dashes, capitals and letters', () => {
  for (const s of ['2 metil 2 butenas', '2–metil–2–butenas', '2-Metil-2-Butenas', ' 2 - metil - 2 - butenas ', '2−metil−2−butenas'])
    assert.equal(C.normName(s).key, '2-metil-2-butenas', s);
  const a = C.normName('pentano rugstis'), b = C.normName('pentano rūgštis');
  assert.equal(a.folded, b.folded);
  assert.notEqual(a.key, b.key);
  assert.notEqual(C.normName('2,3-dimetilbutanas').key, C.normName('2,4-dimetilbutanas').key);
  assert.equal(C.normName('2, 3 dimetilbutanas').key, C.normName('2,3-dimetilbutanas').key);
  assert.equal(C.normName('2-(hidroksimetil)butanas').folded, C.normName('2-hidroksimetilbutanas').folded);
  assert.equal(C.normName('etil butanoatas').key, C.normName('Etilbutanoatas').key);
  assert.deepEqual(plain(C.normName(null)), { key: '', folded: '' });
});

const step = (kind, extra) => Object.assign({ prompt: { lt: 'a', en: 'a' }, kind, hint: { lt: 'h', en: 'h' }, solution: { lt: 's', en: 's' } }, extra);

test('checkStep: choice, multi, order', () => {
  const ch = step('choice', { options: [{}, {}, {}], answer: 1 });
  assert.equal(C.checkStep(ch, 1, 'lt').ok, true);
  assert.equal(C.checkStep(ch, 2, 'lt').ok, false);
  assert.equal(C.checkStep(ch, null, 'lt').ok, false);
  const mu = step('multi', { options: [{}, {}, {}, {}], answer: [0, 2] });
  assert.equal(C.checkStep(mu, [2, 0], 'lt').ok, true);
  assert.equal(C.checkStep(mu, [0], 'lt').ok, false);
  assert.equal(C.checkStep(mu, [0, 1, 2], 'lt').ok, false);
  const or = step('order', { options: [{}, {}, {}] });
  assert.equal(C.checkStep(or, [0, 1, 2], 'lt').ok, true);
  assert.equal(C.checkStep(or, [1, 0, 2], 'lt').ok, false);
  assert.equal(C.checkStep(or, [0, 1], 'lt').ok, false);
});

test('checkStep: atoms and bonds are exact sets, in any order', () => {
  const at = step('atoms', { mol: { smi: 'CC(=O)O' }, answer: [1, 3] });
  assert.equal(C.checkStep(at, [3, 1], 'lt').ok, true);
  assert.equal(C.checkStep(at, [1], 'lt').ok, false);
  assert.equal(C.checkStep(at, [1, 3, 0], 'lt').ok, false);
  assert.equal(C.checkStep(at, [], 'lt').ok, false);
  const bo = step('atoms', { bonds: true, mol: { smi: 'CC(=O)O' }, answer: [[1, 2], [1, 3]] });
  assert.equal(C.checkStep(bo, [[3, 1], [2, 1]], 'lt').ok, true);
  assert.equal(C.checkStep(bo, [[1, 2]], 'lt').ok, false);
});

test('checkStep: number within the tolerance', () => {
  const nu = step('number', { answer: { value: 2.5, tol: 0.05 } });
  assert.equal(C.checkStep(nu, 2.52, 'lt').ok, true);
  assert.equal(C.checkStep(nu, '2,5', 'lt').ok, true);
  assert.equal(C.checkStep(nu, ' 2.46 ', 'lt').ok, true);
  assert.equal(C.checkStep(nu, '−2.5', 'lt').ok, false);
  assert.equal(C.checkStep(nu, 2.6, 'lt').ok, false);
  assert.equal(C.checkStep(nu, 'abc', 'lt').ok, false);
  assert.equal(C.checkStep(nu, '', 'lt').ok, false);
  const neg = step('number', { answer: { value: -3, tol: 0 } });
  assert.equal(C.checkStep(neg, '−3', 'en').ok, true);
  assert.equal(C.checkStep(neg, '-3', 'en').ok, true);
});

test('checkStep: formula in any order, with subscripts, and not another formula', () => {
  const fo = step('formula', { answer: 'C5H12' });
  for (const s of ['C5H12', 'H12C5', 'C₅H₁₂', ' C5 H12 ']) assert.equal(C.checkStep(fo, s, 'lt').ok, true, s);
  for (const s of ['C5H10', 'C5H12O', '', 'c5h12', 'C5', 'xyz']) assert.equal(C.checkStep(fo, s, 'lt').ok, false, s);
  assert.equal(C.checkStep(step('formula', { answer: 'C2H6O' }), 'CH3CH2OH', 'lt').ok, true); // element counts are what is compared
  assert.equal(C.checkStep(step('formula', { answer: 'C4H10O' }), 'C2H4O', 'lt').ok, false);
  assert.equal(C.checkStep(step('formula', { answer: 'C2H4O2' }), 'C2H4O2', 'lt').ok, true);
  assert.equal(C.checkStep(step('formula', { answer: 'Ca(OH)2' }), 'CaO2H2', 'lt').ok, true);
});

test('checkStep: name, with the proper spelling shown when letters were missing', () => {
  const na = step('name', { answer: { lt: ['2-metil-2-butenas'], en: ['2-methylbut-2-ene', '2-methyl-2-butene'] } });
  assert.deepEqual(plain(C.checkStep(na, '2-metil-2-butenas', 'lt')), { ok: true });
  for (const s of ['2 metil 2 butenas', '2–metil–2–butenas', '2-Metil-2-Butenas']) {
    const r = C.checkStep(na, s, 'lt');
    assert.equal(r.ok, true, s);
  }
  assert.equal(C.checkStep(na, '2-metil-2-butenas', 'lt').note, undefined);
  assert.equal(C.checkStep(na, '2-methyl-2-butene', 'en').ok, true);
  assert.equal(C.checkStep(na, 'but-2-ene, 2-methyl', 'en').ok, false);
  assert.equal(C.checkStep(na, '3-metil-2-butenas', 'lt').ok, false);
  const ac = step('name', { answer: { lt: ['pentano rūgštis'], en: ['pentanoic acid'] } });
  const r = C.checkStep(ac, 'pentano rugstis', 'lt');
  assert.equal(r.ok, true);
  assert.ok(r.note && r.note.lt.includes('pentano rūgštis') && r.note.en.includes('pentano rūgštis'), 'the note shows the proper spelling');
  assert.equal(C.checkStep(ac, '', 'lt').ok, false);
  assert.equal(C.checkStep(ac, 'pentanoic acid', 'lt').ok, false, 'a Lithuanian step does not take the English name');
  assert.equal(C.checkStep(na, '2,3-dimetilbutanas', 'lt').ok, false);
  const dm = step('name', { answer: { lt: ['2,3-dimetilbutanas'], en: ['2,3-dimethylbutane'] } });
  assert.equal(C.checkStep(dm, '2,4-dimetilbutanas', 'lt').ok, false);
  assert.equal(C.checkStep(dm, '2, 3-dimetilbutanas', 'lt').ok, true);
});

test('checkStep: name by SMILES asks the namer when it is there', () => {
  const na = step('name', { answer: { smi: 'CCO' } });
  assert.equal(C.checkStep(na, 'etanolis', 'lt').ok, false, 'no namer: nothing can match');
  ORG.name = { name: (smi, o) => ({ name: o.lang === 'lt' ? 'etanolis' : 'ethanol', alts: o.lang === 'lt' ? [] : ['ethyl alcohol'] }) };
  try {
    assert.equal(C.checkStep(na, 'Etanolis', 'lt').ok, true);
    assert.equal(C.checkStep(na, 'ethyl alcohol', 'en').ok, true);
    assert.equal(C.checkStep(na, 'metanolis', 'lt').ok, false);
  } finally { delete ORG.name; }
});

test('checkStep: match needs every pair', () => {
  const ma = step('match', { answer: { left: [{}, {}, {}], right: [{}, {}, {}], pairs: [2, 0, 1] } });
  assert.equal(C.checkStep(ma, [2, 0, 1], 'lt').ok, true);
  const bad = C.checkStep(ma, [2, 1, 0], 'lt');
  assert.equal(bad.ok, false);
  assert.deepEqual(plain(bad.bad), [1, 2]);
  assert.equal(C.checkStep(ma, [2, 0], 'lt').ok, false);
  assert.equal(C.checkStep(ma, [2, 0, null], 'lt').ok, false);
});

test('checkStep: bad input never throws', () => {
  for (const kind of ['choice', 'multi', 'atoms', 'order', 'number', 'name', 'formula', 'match'])
    for (const v of [undefined, null, {}, 'x', [], [[]], NaN, 5])
      assert.doesNotThrow(() => C.checkStep(step(kind, { options: [{}, {}, {}], answer: kind === 'number' ? { value: 1, tol: 0 } : kind === 'match' ? { left: [{}], right: [{}], pairs: [0] } : kind === 'name' ? { lt: ['a'], en: ['a'] } : kind === 'formula' ? 'CH4' : [0] }), v, 'lt'), kind);
  assert.equal(C.checkStep(step('unknown-kind', {}), 1, 'lt').ok, false);
});

test('answerEntry gives the entry that checks as right', () => {
  for (const s of unitA.types[0].bank[0].steps) {
    const entry = C.answerEntry(s, 'lt');
    assert.equal(C.checkStep(s, entry, 'lt').ok, true, s.kind);
    assert.equal(C.checkStep(s, C.answerEntry(s, 'en'), 'en').ok, true, s.kind + ' en');
  }
});

test('validateUnit: the fixture unit is clean', () => {
  assert.deepEqual(plain(C.validateUnit(unitA)), []);
});
test('validateUnit: one error for each fault', () => {
  const mutate = f => { const u = clone(unitA); f(u); return C.validateUnit(u); };
  const stepsOf = u => u.types[0].bank[0].steps;
  let e = mutate(u => { delete u.types[0].title.en; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { delete stepsOf(u)[0].hint.en; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { u.types[0].bank.push(clone(u.types[0].bank[0])); });
  assert.equal(e.length, 1, e.join('|'));
  assert.match(e[0], /u01\.bank\.1/);
  e = mutate(u => { stepsOf(u)[0].answer = 7; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { stepsOf(u)[1].answer = [0, 5]; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { stepsOf(u)[4].options = stepsOf(u)[4].options.slice(0, 2); });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { stepsOf(u)[8].answer.pairs = [0]; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { stepsOf(u)[5].answer = { value: 'x', tol: 0 }; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { stepsOf(u)[2].kind = 'tap'; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { u.notes[0].blocks.push({ p: { lt: 'a', en: 'b' }, h: { lt: 'a', en: 'b' } }); });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { u.notes[0].blocks.push({ practice: 'u01.nope' }); });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { u.coverage['S1.9'] = ['u01.nope']; });
  assert.equal(e.length, 1, e.join('|'));
  e = mutate(u => { delete u.types[1].gen; });
  assert.equal(e.length, 1, e.join('|'));
  assert.ok(C.validateUnit(null).length >= 1);
  assert.ok(C.validateUnit({}).length >= 1);
});

test('rng is deterministic and uniform enough', () => {
  const a = C.rng(7), b = C.rng(7), c = C.rng(8);
  const xs = Array.from({ length: 5 }, () => a()), ys = Array.from({ length: 5 }, () => b());
  assert.deepEqual(xs, ys);
  assert.notDeepEqual(xs, Array.from({ length: 5 }, () => c()));
  for (const x of xs) assert.ok(x >= 0 && x < 1);
});

test('makeProblem: same seed gives the same problem; both languages share the answers', () => {
  const gen = unitA.types[1], bank = unitA.types[0];
  assert.deepEqual(plain(C.makeProblem(gen, 12)), plain(C.makeProblem(gen, 12)));
  const seen = new Set();
  for (let s = 1; s <= 40; s++) seen.add(JSON.stringify(plain(C.makeProblem(gen, s).steps[0].answer)));
  assert.ok(seen.size > 3, 'seeds vary the problem');
  assert.equal(C.makeProblem(bank, 0).id, 'u01.bank.1');
  assert.equal(C.makeProblem(bank, 5).id, 'u01.bank.1');
  // every T in a problem holds both languages; answers sit outside T, so the language cannot change them
  const texts = [];
  (function walk(v, inAnswer) {
    if (Array.isArray(v)) return v.forEach(x => walk(x, inAnswer));
    if (v && typeof v === 'object') {
      if (typeof v.lt === 'string' && typeof v.en === 'string' && Object.keys(v).length === 2) { texts.push(v); return; }
      for (const [k, x] of Object.entries(v)) walk(x, inAnswer || k === 'answer');
    }
  })(C.makeProblem(gen, 3));
  assert.ok(texts.length >= 4);
  for (const t of texts) assert.ok(t.lt && t.en);
  const p = C.makeProblem(gen, 3);
  assert.equal(C.checkStep(p.steps[0], C.answerEntry(p.steps[0], 'lt'), 'lt').ok, true);
  assert.equal(C.checkStep(p.steps[0], C.answerEntry(p.steps[0], 'en'), 'en').ok, true);
  assert.equal(p.typeId, 'u01.gen');
  assert.equal(p.seed, 3);
});
test('makeProblem: ctx helpers are deterministic', () => {
  let got;
  const type = { id: 'x.t', gen: (rng, ctx) => { got = [ctx.int(1, 6), ctx.pick(['a', 'b', 'c']), ctx.shuffle([1, 2, 3, 4, 5]).join('')]; return { q: [], steps: [], why: { lt: 'a', en: 'a' } }; } };
  C.makeProblem(type, 99); const first = got;
  C.makeProblem(type, 99);
  assert.deepEqual(got, first);
  assert.ok(first[0] >= 1 && first[0] <= 6);
});

test('unit loader: loads a unit once, and a unit that throws is reported', async () => {
  const ctx = load();
  const run = name => vm.runInContext(fs.readFileSync(path.join(FIX, name), 'utf8'), ctx, { filename: name });
  let injected = 0;
  const inject = file => (src, done) => { injected++; try { run(file); } catch (e) { /* a script that throws still fires "load" */ } done(); };
  const O = ctx.ORG;
  const u = await O.loadUnit('u01', inject('unit-a.js'));
  assert.equal(u.id, 'u01');
  await O.loadUnit('u01', inject('unit-a.js'));
  assert.equal(injected, 1, 'a loaded unit is not loaded again');
  await assert.rejects(O.loadUnit('u02', inject('unit-throws.js')), /not available|not load/i);
  assert.equal(O.units.u02, undefined);
  await assert.rejects(O.loadUnit('u03', (src, done) => done(new Error('offline'))), /offline|not available/i);
  await assert.rejects(O.loadUnit('u04', (src, done) => done()), /not available/i);
  await assert.rejects(O.loadUnit('nope', inject('unit-a.js')), /unknown/i);
  // a unit file for a different id, or a broken one, is refused
  await assert.rejects(O.loadUnit('u05', inject('unit-a.js')), /not available|id/i);
  // retry after a failure works
  const again = await O.loadUnit('u02', (src, done) => { vm.runInContext(fs.readFileSync(path.join(FIX, 'unit-a.js'), 'utf8').replace("id: 'u01'", "id: 'u02'").replace(/'u01\./g, "'u02."), ctx); done(); });
  assert.equal(again.id, 'u02');
});

test('units list: 22 units in three parts', () => {
  const L = ORG.UNITS;
  assert.equal(L.length, 22);
  assert.deepEqual(plain(L.map(u => u.id)), [...Array.from({ length: 16 }, (_, i) => 'u' + String(i + 1).padStart(2, '0')), 'l1', 'l2', 'l3', 'l4', 'l5', 'l6']);
  assert.deepEqual(plain(L.slice(0, 5).map(u => u.part)), [1, 1, 1, 1, 1]);
  assert.ok(L.slice(5, 16).every(u => u.part === 2));
  assert.ok(L.slice(16).every(u => u.part === 3 && u.exams.length === 0));
  assert.ok(L.slice(0, 5).every(u => u.exams.includes('mt1') && u.exams.includes('exam') && !u.exams.includes('mt2')));
  assert.ok(L.slice(5, 16).every(u => u.exams.includes('mt2') && u.exams.includes('exam') && !u.exams.includes('mt1')));
  assert.equal(L[7].title.lt, 'Dienai, alkinai ir mažieji ciklai');
  for (const u of L) {
    assert.equal(u.file, `units/${u.id}.js`);
    assert.ok(u.title.lt && u.title.en, u.id);
    assert.ok(Array.isArray(u.sources) && u.sources.length > 0, u.id);
  }
  assert.equal(new Set(L.map(u => u.title.lt)).size, 22);
});
