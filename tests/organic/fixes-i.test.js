'use strict';
// Regression tests for the fact-check fixes in the lab units l1-l6 (plan Task I).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load = require('./load.js');

const ROOT = path.join(__dirname, '..', '..');
const ctxv = load.context();
const ORG = vm.runInContext('globalThis.ORG = globalThis.ORG || {}', ctxv);
const { chem, draw } = ORG;

// loads one lab unit into the shared engine context and returns the Unit
function unitOf(id) {
  let found = null;
  ORG.unit = (u) => { found = u; };
  const file = path.join(ROOT, 'site', 'organic', 'units', id + '.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctxv, { filename: file });
  return found;
}
const U = {};
['l1', 'l2', 'l3', 'l4', 'l5', 'l6'].forEach((id) => { U[id] = unitOf(id); });

const typeOf = (id, typeId) => U[id].types.find((t) => t.id === typeId);
const problem = (id, typeId, seed) => ORG.check.makeProblem(typeOf(id, typeId), seed);
const en = (p) => p.q.map((b) => (b.p ? b.p.en : '')).join(' ');
const num = (s) => Number(String(s).replace(',', '.'));

// every generated problem of a type for seeds 1..n, as { seed, p, text }
function each(id, typeId, n, fn) {
  for (let seed = 1; seed <= n; seed++) {
    const p = problem(id, typeId, seed);
    fn({ seed, p, text: en(p) });
  }
}

const NUM = '(\\d+(?:\\.\\d+)?)';

/* ---------- I2: TLC generators keep every spot below the front ---------- */

test('I2 l3 rf: both spots below the front, 0 < Rf < 1 (10000 seeds)', () => {
  const re = new RegExp('front travelled ' + NUM + ' mm from the start line, the first spot ' + NUM + ' mm and the second ' + NUM + ' mm');
  let seen = 0;
  each('l3', 'l3.calc', 10000, ({ seed, text }) => {
    const m = re.exec(text);
    if (!m) return;
    seen++;
    const [front, s1, s2] = [num(m[1]), num(m[2]), num(m[3])];
    assert.ok(s1 > 0 && s1 < s2 && s2 <= front - 5, 'seed ' + seed + ': ' + text);
  });
  assert.ok(seen > 500, 'rf variant was drawn ' + seen + ' times');
});

test('I2 l4 rf: both spots below the front (10000 seeds)', () => {
  const re = new RegExp('front moved ' + NUM + ' mm\\. The product spot moved ' + NUM + ' mm and the salicylic acid reference spot ' + NUM + ' mm');
  let seen = 0;
  each('l4', 'l4.calc', 10000, ({ seed, text }) => {
    const m = re.exec(text);
    if (!m) return;
    seen++;
    const [front, b, a] = [num(m[1]), num(m[2]), num(m[3])];
    assert.ok(a > 0 && b > 0 && a <= front - 5 && b <= front - 5, 'seed ' + seed + ': ' + text);
  });
  assert.ok(seen > 500, 'rf variant was drawn ' + seen + ' times');
});

test('I2 l5 rf: both spots below the front (10000 seeds)', () => {
  const re = new RegExp('front moved ' + NUM + ' mm; the first spot is at ' + NUM + ' mm and the second at ' + NUM + ' mm');
  let seen = 0;
  each('l5', 'l5.calc', 10000, ({ seed, text }) => {
    const m = re.exec(text);
    if (!m) return;
    seen++;
    const [front, s1, s2] = [num(m[1]), num(m[2]), num(m[3])];
    assert.ok(s1 > 0 && s1 < s2 && s2 <= front - 5, 'seed ' + seed + ': ' + text);
  });
  assert.ok(seen > 500, 'rf variant was drawn ' + seen + ' times');
});

/* ---------- I5 and I6: impure melting ranges end below the pure value ---------- */

// pure ranges are 0.5-1 deg (l1) or 1-2 deg wide; impure ones are at least 3 deg wide
function mpScan(id, typeId, re, check, minWidth) {
  let impure = 0;
  let pure = 0;
  each(id, typeId, 2000, ({ seed, text }) => {
    const m = re.exec(text);
    if (!m) return;
    const lo = num(m[1]);
    const hi = num(m[2]);
    if (hi - lo >= minWidth) { impure++; check(lo, hi, m, 'seed ' + seed + ': ' + text); } else pure++;
  });
  assert.ok(impure > 100 && pure > 100, 'impure ' + impure + ', pure ' + pure);
}

test('I5 l1 mp: an impure benzoic acid range ends below 122 degC (2000 seeds)', () => {
  mpScan('l1', 'l1.mp', new RegExp('melts from ' + NUM + ' to ' + NUM + ' .C\\. The literature value'),
    (lo, hi, m, msg) => assert.ok(hi < 122 && lo < hi, msg), 3);
});

test('I5 l3 mp: an impure caffeine range ends below 236 degC (2000 seeds)', () => {
  mpScan('l3', 'l3.calc', new RegExp('measured as ' + NUM + '.' + NUM + ' .C\\. The literature range is about 236'),
    (lo, hi, m, msg) => assert.ok(hi <= 235, msg), 3);
});

test('I5 l4 mp: an impure aspirin range ends below 135 degC (2000 seeds)', () => {
  mpScan('l4', 'l4.calc', new RegExp('melts at ' + NUM + '.' + NUM + ' .C; the literature melting point is about 135'),
    (lo, hi, m, msg) => assert.ok(hi <= 134, msg), 3);
});

test('I5 + I6 l5 mp: an impure maleic acid range is clearly low and ends at 130 degC or below (2000 seeds)', () => {
  mpScan('l5', 'l5.calc', new RegExp('measured as ' + NUM + '.' + NUM + ' .C\\. The literature range for maleic acid'),
    (lo, hi, m, msg) => assert.ok(hi <= 130, msg), 3);
});

test('I5 l6 mp: an impure range ends below the literature melting point (2000 seeds)', () => {
  mpScan('l6', 'l6.calc', new RegExp('melts at ' + NUM + '.' + NUM + ' .C; the literature melting point is ' + NUM + ' .C'),
    (lo, hi, m, msg) => assert.ok(hi < num(m[3]), msg), 3);
});

/* ---------- plain text scans ---------- */

const textOfUnit = (id) => JSON.stringify(U[id]);
const all = (id, re) => (textOfUnit(id).match(re) || []);

test('I6 l5: maleic acid keeps the lab sheet value and names the handbook value; fumaric acid sublimes before it melts', () => {
  const s = textOfUnit('l5');
  assert.match(s, /handbooks give about 135 °C/);
  assert.match(s, /lyd\. t\. 140–142 °C pagal darbo aprašą; žinynuose apie 135 °C/);
  assert.doesNotMatch(s, /sublim\w* (around|about) 300|apie 300 °C/i);
  assert.match(s, /sublimes before it melts/);
  assert.match(s, /sublimuojasi anksčiau, nei/);
  assert.match(s, /from about 200 °C/);
  assert.match(s, /nuo apie 200 °C/);
});

test('I1 l2: no text says that water lowers the refractive index of acetone; the rule says n cannot give the water content', () => {
  const s = textOfUnit('l2');
  assert.doesNotMatch(s, /water lowers|Water lowers|lowers the refractive|vanduo rodiklį mažina|Vanduo mažina lūžio|Vandens priemaiša rodiklį mažina/);
  assert.doesNotMatch(s, /the closer to 1\.3588, the less water|kuo arčiau 1,3588, tuo mažiau vandens/);
  assert.doesNotMatch(s, /1\.362|1,362/, 'the exact maximum is not quoted');
  assert.match(s, /acetone with a little water has a slightly higher index than pure acetone/);
  assert.match(s, /acetonas su nedideliu vandens kiekiu turi truputį didesnį rodiklį/);
});

test('I1 l2 nclass: the question compares the measured index with the table value, within 0.0005 (2000 seeds)', () => {
  const re = new RegExp('distillate \\$n_D\\^20\\$ is ' + NUM + '\\. The table value for pure acetone is 1\\.3588');
  const seen = { same: 0, differs: 0 };
  each('l2', 'l2.calc', 2000, ({ seed, p, text }) => {
    const m = re.exec(text);
    if (!m) return;
    const x = Math.round(num(m[1]) * 10000);
    const diff = Math.abs(x - 13588);
    const step = p.steps[0];
    assert.strictEqual(step.options.length, 2, 'seed ' + seed);
    const want = diff <= 5 ? 0 : 1;
    assert.strictEqual(step.answer, want, 'seed ' + seed + ': ' + text);
    // no value in the grey zone between "equal" and "different"
    assert.ok(diff <= 5 || diff >= 8, 'seed ' + seed + ': ' + text);
    seen[want === 0 ? 'same' : 'differs']++;
    // no straight-line water estimate in the answer texts
    const words = JSON.stringify(step);
    assert.doesNotMatch(words, /less water|mažiau vandens|noticeable amount of water|mostly water/);
  });
  assert.ok(seen.same > 50 && seen.differs > 50, JSON.stringify(seen));
});

test('I7 l2.observe.8: absolute ethanol is not said to need chemical binding "only"', () => {
  const b = typeOf('l2', 'l2.observe');
  const p = b.bank.find((x) => x.id === 'l2.observe.8');
  const why = JSON.stringify(p.why);
  assert.doesNotMatch(why, /only|tik vandenį/);
  assert.match(why, /azeotropic distillation/);
  assert.match(why, /molecular sieves/);
  assert.match(why, /azeotropinė distiliacija/);
  assert.match(why, /molekuliniai sietai/);
});

/* ---------- I8: order problems with independent steps ---------- */

test('I8 l1.order.8 and l3.order.7 do not force an order on independent steps', () => {
  const o1 = typeOf('l1', 'l1.order').bank.find((x) => x.id === 'l1.order.8');
  const items1 = o1.steps[0].options.map((i) => i.text.en);
  assert.strictEqual(items1.filter((s) => /calculate the yield|determine the melting point/.test(s)).length, 1, 'yield and melting point are one item');
  assert.match(items1.join('|'), /calculate the yield and determine the melting point/);
  const o3 = typeOf('l3', 'l3.order').bank.find((x) => x.id === 'l3.order.7');
  const items3 = o3.steps[0].options.map((i) => i.text.en);
  assert.strictEqual(items3.filter((s) => /^measure the distance /.test(s)).length, 0, 'no single-distance step remains');
  assert.strictEqual(items3.filter((s) => /measure the distances/.test(s)).length, 1);
});

/* ---------- I9: LT and EN say the same ---------- */

test('I9 l3: yield WHY, apparatus.8 distractor and observe.4 are the same in both languages', () => {
  const s = textOfUnit('l3');
  // the yield WHY is written by the generator
  let yields = 0;
  each('l3', 'l3.calc', 300, ({ p }) => {
    if (!/Išeiga lygina/.test(p.why.lt)) return;
    yields++;
    assert.match(p.why.lt, /lieka vandenyje ir arbatos lapeliuose/);
    assert.match(p.why.en, /stays in the water and in the tea leaves/);
    assert.doesNotMatch(p.why.lt, /sorbent/);
  });
  assert.ok(yields > 0);
  assert.doesNotMatch(s, /mėgintuvėlis su atsaka/);
  assert.match(s, /Bunzeno kolba \(kolba su atšaka\)[^}]*filter flask with a side arm/);
  assert.doesNotMatch(s, /ir slysta prie sienelės/);
  assert.match(s, /lipdosi į gumulus ir limpa prie sienelės/);
});

test('I12 l4 and l5: same vessel and "same compound" in both languages', () => {
  assert.match(textOfUnit('l4'), /leidžia manyti, kad tai tas pats junginys/);
  const s5 = textOfUnit('l5');
  assert.doesNotMatch(s5, /mėgintuvėlio su atšaka|mėgintuvėlis su atšaka/);
  assert.match(s5, /Bunzeno kolbos su atšaka/);
  assert.match(s5, /Bunzeno kolba \(kolba su atšaka filtravimui\)[^}]*filter flask with a side arm/);
});

/* ---------- I3: copper(II) glycerolate ---------- */

test('I3 l6 CUGLY: the drawn complex is Cu(C3H7O3)2 = C6H14CuO6, neutral, and draws cleanly', () => {
  const scheme = JSON.stringify(U.l6.notes);
  const smi = /OCC1CO\[Cu-2\]2\(\[OH\+\]1\)OCC\(CO\)\[OH\+\]2/;
  assert.match(scheme, smi);
  const s = 'OCC1CO[Cu-2]2([OH+]1)OCC(CO)[OH+]2';
  const mol = chem.parse(s);
  assert.strictEqual(chem.formulaString(mol), 'C6H14CuO6');
  assert.strictEqual(mol.atoms.reduce((a, x) => a + x.charge, 0), 0);
  // every glycerol residue: one covalent O-Cu and one OH donor on Cu
  const cu = mol.atoms.findIndex((a) => a.el === 'Cu');
  const nb = mol.bonds.filter((b) => b.a === cu || b.b === cu).map((b) => (b.a === cu ? b.b : b.a)).map((i) => mol.atoms[i]);
  assert.strictEqual(nb.length, 4);
  assert.strictEqual(nb.filter((a) => a.charge === 1).length, 2, 'two donor OH groups');
  assert.strictEqual(nb.filter((a) => a.charge === 0).length, 2, 'two covalent O');
  const lay = draw.layout(mol, {});
  const q = load.plain(draw.quality(mol, lay.pos));
  assert.deepStrictEqual(q, { overlaps: 0, crossings: 0, labelClashes: 0 });
  const d = draw.molecule(s, {});
  const svg = draw.toString(d.svg);
  assert.ok(!/NaN|undefined/.test(svg));
});

test('I3 l6: the scheme is balanced (2 glycerol + Cu(OH)2 -> complex + 2 H2O)', () => {
  const block = U.l6.notes.flatMap((n) => n.blocks).find((b) => b.scheme && b.scheme.items.some((i) => i.smi && i.smi.includes('Cu-2')));
  const items = block.scheme.items.filter((i) => i.smi);
  const idx = items.findIndex((i) => i.smi.includes('Cu-2'));
  const tally = (list) => {
    const t = {};
    list.forEach((i) => { const f = chem.formula(chem.parse(i.smi)); Object.keys(f).forEach((k) => { t[k] = (t[k] || 0) + f[k]; }); });
    return t;
  };
  assert.deepStrictEqual(tally(items.slice(0, idx)), tally(items.slice(idx)));
});

/* ---------- I4 and I11: l6 texts ---------- */

test('I4 l6: alpha-amino acids are not listed among compounds with hydroxyl groups on neighbouring carbons', () => {
  const s = textOfUnit('l6');
  assert.doesNotMatch(s, /hydroxyl groups on neighbouring carbons: polyhydric alcohols, carbohydrates, hydroxy acids and α-amino acids/);
  assert.doesNotMatch(s, /hidroksigrupes prie gretimų anglies atomų: polihidroksiliai alkoholiai, angliavandeniai, hidroksirūgštys ir α-aminorūgštys/);
  assert.match(s, /α-amino acids \(\$NH2\$ and \$COO-\$\)/);
  assert.match(s, /bind through \$NH2\$ and \$COO-\$/);
  assert.match(s, /per \$NH2\$ ir \$COO-\$/);
  assert.doesNotMatch(s, /also carbohydrates and α-amino acids\./);
});

test('I11 l6: anhydrous CuSO4 dries ethanol but is not given as the way to absolute ethanol', () => {
  const d3 = typeOf('l6', 'l6.defence').bank.find((x) => x.id === 'l6.defence.3');
  const step = d3.steps.find((st) => /absolute ethanol/.test(JSON.stringify(st.prompt)));
  assert.ok(step, 'the absolute ethanol question is there');
  const right = step.options[step.answer].text;
  assert.doesNotMatch(JSON.stringify(right), /CuSO4/);
  assert.match(right.en, /CaO/);
  assert.match(step.solution.en, /does not give absolute ethanol/);
  assert.match(step.solution.lt, /absoliutaus etanolio juo negauname/);
  const s = textOfUnit('l6');
  assert.doesNotMatch(s, /water bound, ethanol anhydrous|vanduo surištas, etanolis bevandenis/);
  assert.doesNotMatch(s, /for example by \$CuSO4\$|pavyzdžiui, \$CuSO4\$/);
});

/* ---------- I10: Lithuanian wording ---------- */

test('I10 l6: ester ratio, "colourless" and "insoluble" in Lithuanian', () => {
  const s = textOfUnit('l6');
  assert.doesNotMatch(s, /pražyla|nelaisto|abiejų reagentų kiekiai lygūs/);
  assert.match(s, /išblunka \(tampa bespalvis\)/);
  assert.match(s, /vandenyje netirpų produktą/);
  // the generated ester problem says 1 : 1 as a reaction ratio in both languages
  let seen = 0;
  each('l6', 'l6.calc', 300, ({ p }) => {
    const t = p.q[0].p;
    if (!/izopentanol/.test(t.lt)) return;
    seen++;
    assert.match(t.lt, /reagentai reaguoja santykiu 1 : 1/);
    assert.doesNotMatch(t.lt, /kiekiai lygūs/);
    assert.match(t.lt, /rūgšties pertekliuje/);
  });
  assert.ok(seen > 0);
});

test('I12 l6: arrow labels read "conc." in English', () => {
  const s = JSON.stringify(U.l6);
  assert.match(s, /"lt":"konc\. H2SO4","en":"conc\. H2SO4"/);
  assert.match(s, /"lt":"konc\. H2SO4, t°","en":"conc\. H2SO4, t°"/);
  assert.doesNotMatch(s, /"en":"konc\./);
});
