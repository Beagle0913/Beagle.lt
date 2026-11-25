'use strict';
// Regression tests for plan task G (u13, u14 fact-check fixes).
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const ORG = load();
const u13 = load.unit('site/organic/units/u13.js');
const u14 = load.unit('site/organic/units/u14.js');
const typeOf = (u, id) => u.types.find((t) => t.id === id);
const J = (x) => JSON.stringify(x);
const bankProblem = (u, tid, pid) => typeOf(u, tid).bank.find((p) => p.id === pid);
function walk(x, fn) {
  if (Array.isArray(x)) x.forEach((y) => walk(y, fn));
  else if (x && typeof x === 'object') { fn(x); Object.values(x).forEach((y) => walk(y, fn)); }
}

test('G1 u13.mech.5: E1cB is described as two stages, not one concerted stage', () => {
  const p = bankProblem(u13, 'u13.mech', 'u13.mech.5');
  const step = p.steps[1];
  const right = step.options[step.answer].text;
  assert.match(right.en, /two stages, E1cB/);
  assert.match(right.lt, /dvi stadijos, E1cB/);
  assert.doesNotMatch(J(right), /concerted|sinchroni/);
});

test('G2 u13.enol: "more substituted" distractor is never offered for 1-arylpropan-2-ones', () => {
  const ty = typeOf(u13, 'u13.enol');
  let methyl = 0, other = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const smi = p.q[1].mol.smi;
    const opts = p.steps[2].options;
    const has = opts.some((o) => /more substituted/.test(o.text.en));
    const isMethyl = smi.indexOf('CC(=O)C') === 0;
    if (isMethyl) { methyl++; assert.ok(!has, smi + ' offers a true statement as wrong'); } else { other++; assert.ok(has, smi); }
    assert.ok(opts.length >= 3 && p.steps[2].answer === 0 && /Conjugation/.test(opts[0].text.en));
  }
  assert.ok(methyl > 0 && other > 0);
});

test('G3 u13.hydrate.2: ethanal is said to be largely hydrated', () => {
  const s = bankProblem(u13, 'u13.hydrate', 'u13.hydrate.2').steps[1].solution;
  assert.match(s.en, /ketones and larger aldehydes form little hydrate/);
  assert.match(s.en, /methanal and ethanal are largely hydrated/);
  assert.doesNotMatch(s.en, /their aldehydes and ketones hardly/);
  assert.match(s.lt, /metanalis ir etanalis/);
});

test('G4 u13.order.6: acid is needed for acetals only', () => {
  const w = bankProblem(u13, 'u13.order', 'u13.order.6').why;
  assert.match(w.en, /also form without acid, but acetal formation requires it/);
  assert.doesNotMatch(w.en, /Weak nucleophiles \(alcohols, water\) need it/);
  assert.match(w.lt, /acetaliui susidaryti rūgšties būtina/);
  assert.doesNotMatch(w.lt, /tai būtina/);
});

test('G5 u13.hydrate.4: LT no longer says "two-stage"', () => {
  const w = bankProblem(u13, 'u13.hydrate', 'u13.hydrate.4').why;
  assert.doesNotMatch(w.lt, /dviejų stadijų/);
  assert.match(w.lt, /tas pats principas/);
});

test('G6 u14 Claisen stage 1: the C-H electrons go to the alpha carbon, as step 2 draws', () => {
  let found = null;
  walk(u14.notes, (o) => {
    if (Array.isArray(o.mech)) o.mech.forEach((s) => { if (s.note && /Methoxide removes an α-hydrogen/.test(s.note.en)) found = s; });
  });
  assert.ok(found, 'stage 1 not found');
  assert.strictEqual(found.arrows.length, 2);
  assert.deepStrictEqual(load.plain(found.arrows[1].to), { m: 1, a: 0 });
  assert.deepStrictEqual(load.plain(found.arrows[1].from), { m: 1, b: [0, 'H0'] });
  // the anion drawn in the next stage is the carbanion on atom 0
  const next = u14.notes;
  let step2 = null;
  walk(next, (o) => { if (Array.isArray(o.mech)) { const i = o.mech.indexOf(found); if (i >= 0) step2 = o.mech[i + 1]; } });
  assert.strictEqual(step2.scheme.items[0].smi, '[CH2-]C(=O)OC');
  assert.deepStrictEqual(load.plain(step2.arrows[0].from), { m: 0, a: 0 });
});

test('G7 u14: 18O hint asks which C-O bond breaks; notes name the labelled oxygen', () => {
  const p = bankProblem(u14, 'u14.mech', 'u14.mech.4');
  const h = p.steps[0].hint;
  assert.match(h.en, /C–OH bond of the acid or the C–O bond of the alcohol/);
  assert.match(h.lt, /rūgšties C–OH ar alkoholio C–O/);
  assert.doesNotMatch(J(p), /O–H of the alcohol|alkoholio O–H/);
  const all = J(u14.notes);
  assert.match(all, /When the alcohol oxygen is labelled/);
  assert.match(all, /Kai žymėtas alkoholio deguonis/);
  assert.doesNotMatch(all, /Labelled \$18O\$ stayed|Žymėtasis \$18O\$ liko/);
});

test('G8 u14.nu: anhydride + water never offers a single acid as a wrong product', () => {
  const ty = typeOf(u14, 'u14.nu');
  let n = 0;
  for (let seed = 1; seed <= 250; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const items = p.q[0].scheme && p.q[0].scheme.items;
    if (!items || items.length !== 4 || items[2].smi !== 'O') continue;
    const anh = items[0].smi;
    if ((anh.match(/O=|=O/g) || []).length !== 2) continue;
    const step = p.steps[p.steps.length - 1];
    if (!step.options || !step.options[0].scheme) continue;
    n++;
    step.options.forEach((o, i) => {
      const mols = o.scheme.items.filter((x) => x.smi);
      assert.ok(mols.length >= 2, 'seed ' + seed + ': single-molecule option ' + J(o));
    });
    assert.strictEqual(step.options.length, 4, 'seed ' + seed);
  }
  assert.ok(n > 8, 'too few anhydride + water problems: ' + n);
});

test('G9 u14.drugs.4: N vs O reason is electronegativity, not delocalisation', () => {
  const p = bankProblem(u14, 'u14.drugs', 'u14.drugs.4');
  const s = p.steps[0].solution;
  assert.match(s.en, /N is less electronegative than O/);
  assert.match(s.lt, /N mažiau elektroneigiamas už O/);
  assert.doesNotMatch(s.en, /delocalised/);
  assert.doesNotMatch(s.lt, /delokalizuota/);
});

test('G10 u14.nu: the step-1 hint fits nitriles', () => {
  const ty = typeOf(u14, 'u14.nu');
  let nit = 0, other = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const reag = p.q[0].scheme.items[0].smi;
    const hint = p.steps[0].hint;
    if (/#/.test(reag)) {
      nit++;
      assert.doesNotMatch(hint.en, /two electronegative/);
      assert.match(hint.en, /C≡N/);
      assert.match(hint.lt, /C≡N/);
    } else {
      other++;
      assert.match(hint.en, /two electronegative atoms/);
    }
  }
  assert.ok(nit > 2 && other > 10);
});

test('G11 u14 acid notes: only 4-chlorobutanoic acid is close to butanoic acid (EN agrees with LT)', () => {
  const all = J(u14.notes);
  assert.match(all, /the 4-chloro acid is already close to butanoic acid \(4\.82\)/);
  assert.match(all, /4-chlorbutano rūgštis jau artima butano rūgščiai/);
  assert.doesNotMatch(all, /4\.52\) acids, which are close/);
  // numbers against the table of the same unit
  assert.match(all, /4\.05/); assert.match(all, /4\.52/); assert.match(all, /4\.82/);
});
