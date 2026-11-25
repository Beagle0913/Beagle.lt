'use strict';
// Regression tests for plan task E (u08, u10 fact-check fixes).
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const ORG = load();
const u08 = load.unit('site/organic/units/u08.js');
const u10 = load.unit('site/organic/units/u10.js');
const typeOf = (u, id) => u.types.find((t) => t.id === id);
const J = (x) => JSON.stringify(x);
const bankProblem = (u, tid, pid) => { let f = null; walk(u.types, (o) => { if (o.id === pid) f = o; }); assert.ok(f, pid + ' not found'); return f; };
function walk(x, fn) {
  if (Array.isArray(x)) x.forEach((y) => walk(y, fn));
  else if (x && typeof x === 'object') { fn(x); Object.values(x).forEach((y) => walk(y, fn)); }
}
const S1_EN = /parent benzyl cation lies between a secondary and a tertiary cation/;
const S1_LT = /paprasčiausias benzilo katijonas yra tarp antrinio ir tretinio/;

// side of the line a-b on which point p lies
function side(pos, a, b, p) {
  return Math.sign((pos[b].x - pos[a].x) * (pos[p].y - pos[a].y) - (pos[b].y - pos[a].y) * (pos[p].x - pos[a].x));
}

test('E1 anti addition of Br2 to an alkyne is written and drawn as the E alkene', () => {
  const cases = [['CC/C(Br)=C\\Br', 2, 4, 3, 5], ['C/C(Br)=C(\\Br)C', 1, 3, 2, 4]];
  for (const [smi, a, b, x, y] of cases) {
    const m = ORG.chem.parse(smi);
    assert.strictEqual(ORG.stereo.ez(m, a, b), 'E', smi);
    const pos = ORG.draw.layout(m, {}).pos;
    assert.strictEqual(m.atoms[x].el, 'Br');
    assert.strictEqual(m.atoms[y].el, 'Br');
    assert.strictEqual(side(pos, a, b, x) * side(pos, a, b, y), -1, smi + ': the two Br are not on opposite sides');
  }
  // the notes and chain.5 use the E SMILES, and no stereo-less dibromoalkene is left
  const txt = J(u08);
  assert.ok(txt.includes('CC/C(Br)=C\\\\Br'));
  assert.ok(!txt.includes('"CCC(Br)=CBr"'));
  assert.ok(!txt.includes('"CC(Br)=C(C)Br"'));
  const p = bankProblem(u08, null, 'u08.chain.5');
  assert.strictEqual(p.steps[0].options[p.steps[0].answer].mol.smi, 'C/C(Br)=C(\\Br)C');
  assert.match(J(p.steps[0].solution), /\(E\)-2,3-dibromobut-2-ene/);
  assert.match(J(p.steps[0].solution), /\(E\)-2,3-dibrom-2-butenas/);
});

test('E2 u08.dadd WHY says one product exactly when the key has one product', () => {
  const ty = typeOf(u08, 'u08.dadd');
  let one = 0, two = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const single = /single product forms/.test(J(p.steps.map((s) => s.solution)));
    const w = p.why;
    if (single) {
      one++;
      assert.match(w.en, /a single product forms/, 'seed ' + seed);
      assert.doesNotMatch(w.en, /two products form/, 'seed ' + seed);
      assert.match(w.lt, /vienas produktas/, 'seed ' + seed);
      assert.doesNotMatch(w.lt, /gaunami du produktai/, 'seed ' + seed);
    } else {
      two++;
      assert.match(w.en, /two products form/, 'seed ' + seed);
      assert.match(w.lt, /gaunami du produktai/, 'seed ' + seed);
      assert.doesNotMatch(w.en, /single product/, 'seed ' + seed);
    }
  }
  assert.ok(one > 0 && two > 0);
});

test('E3 u08: the cation-order rule carries the S1 sentence, and dmech.9 does not rank the parent allyl cation', () => {
  let rule;
  walk(u08.notes, (o) => { if (o.rule && /Cation stability|katijonų stabilumas/.test(J(o.rule))) rule = o.rule; });
  assert.ok(rule, 'rule not found');
  assert.match(rule.en, S1_EN);
  assert.match(rule.lt, S1_LT);
  assert.match(rule.en, /course’s order/);
  assert.doesNotMatch(rule.en, /more stable than an alkyl cation with a localised charge/);
  const p = bankProblem(u08, 'u08.dmech', 'u08.dmech.9');
  const smis = [];
  walk(p.q, (o) => { if (o.smi) smis.push(o.smi); });
  assert.ok(!smis.includes('C=C[CH2+]'), 'the parent allyl cation is still compared');
  assert.ok(smis.includes('C=C[C+](C)C'));
  assert.doesNotMatch(J(p), /allyl > tertiary > secondary|alilkatijonas > tretinis > antrinis/);
  const opt = p.steps[0].options.map((o) => o.text.en);
  assert.deepStrictEqual(load.plain(opt), ['tertiary allyl cation', 'tertiary alkyl cation', 'secondary', 'primary']);
});

test('E4 u08.name: the numbers drawn on the triple bond equal its IUPAC locant', () => {
  const ty = typeOf(u08, 'u08.name');
  const seen = new Set();
  for (let seed = 1; seed <= 600; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const smi = p.q[1].mol.smi;
    seen.add(smi);
    const m = ORG.chem.parse(smi);
    const tb = m.bonds.find((b) => b.order === 3);
    const lo = Math.min(tb.a, tb.b) + 1;
    const nm = ORG.name.name(smi, { lang: 'en' }).name;
    const loc = /-(\d+)-yn/.exec(nm);
    assert.ok(loc || nm === 'propyne', smi + ' -> ' + nm);
    assert.strictEqual(loc ? +loc[1] : 1, lo, smi + ' is named ' + nm + ' but its triple bond is drawn at no. ' + lo);
    assert.ok(J(p.steps[0].solution).includes('no. ' + lo), smi);
  }
  for (const s of ['CC(C#CC(C)C)C', 'CC(C#CCC)C', 'C(C#CC)Cl', 'C(C#C)O', 'C(C#CC)O', 'CC(C#C)O', 'CC(C#CC)O']) assert.ok(seen.has(s), s + ' never drawn');
});

test('E5 u08: zingiberene is not called a diene', () => {
  let found = 0;
  walk(u08.notes, (o) => {
    if (o.p && /zingiberen/.test(J(o.p))) { found++; assert.match(o.p.en, /zingiberene in ginger oil, for example, contains a conjugated diene unit/); assert.match(o.p.lt, /zingiberenas turi konjuguotąjį dieno fragmentą/); }
  });
  assert.strictEqual(found, 1);
});

test('E6 u10.rank.5 ranks only comparisons that S1 allows', () => {
  const p = bankProblem(u10, 'u10.rank', 'u10.rank.5');
  const smis = [];
  walk(p.q, (o) => { if (o.smi) smis.push(o.smi); });
  assert.deepStrictEqual(load.plain(smis), ['CC(C)(Br)c1ccccc1', 'CC(C)(C)Br', 'CC(C)Br', 'CCBr']);
  // the first rows of the key are really more reactive: tertiary benzylic > tertiary > secondary > primary
  const c = (s) => ORG.chem.parse(s);
  assert.strictEqual(ORG.chem.formulaString(c(smis[0])), 'C9H11Br');
  assert.doesNotMatch(J(p), /benzyl bromide|allyl bromide|BrCc1ccccc1|C=CCBr/);
  assert.match(J(p.steps[0].options.map((o) => o.text.en)), /cumyl.*tertiary.*secondary.*primary/);
  assert.match(p.steps[1].prompt.en, /cumyl cation more stable than the tert-butyl/);
  assert.doesNotMatch(J(p), /more stable than a tertiary alkyl cation|even tertiary|ionise more easily even than tertiary/);
});

test('E7 u10: the S1 wording is in the notes and the summary; no text puts a parent benzyl/allyl cation above a tertiary one', () => {
  const hits = [];
  walk(u10.notes, (o) => { if (o.p && /benzylic > allylic > tertiary/.test(J(o.p))) hits.push(o.p); });
  assert.strictEqual(hits.length, 1);
  assert.match(hits[0].en, S1_EN);
  assert.match(hits[0].lt, S1_LT);
  assert.doesNotMatch(hits[0].en, /This order compares cations/);
  const sum = [];
  walk(u10.summary, (o) => { if (o && o.en && /benzylic > allylic > tertiary/.test(o.en)) sum.push(o); });
  assert.strictEqual(sum.length, 1);
  assert.match(sum[0].en, S1_EN);
  assert.match(sum[0].lt, S1_LT);
  const all = J(u10);
  assert.doesNotMatch(all, /even tertiary|net tretinius|more easily even than tertiary/);
  // allyl.7 compares secondary benzylic/allylic with plain secondary/primary only
  const p = bankProblem(u10, 'u10.allyl', 'u10.allyl.7');
  const smis = [];
  walk(p.q, (o) => { if (o.smi) smis.push(o.smi); });
  assert.deepStrictEqual(load.plain(smis), ['CC(Br)c1ccccc1', 'CC(C)Br', 'C=CC(C)Br', 'CCCBr']);
  const a = p.steps[0].answer;
  assert.deepStrictEqual(load.plain(a), [0, 2]);
  assert.match(p.why.en, /plain alkyl cation of the same class/);
  assert.match(J(bankProblem(u10, 'u10.allyl', 'u10.allyl.2').why), /plain primary alkyl cation/);
});

test('E8 u10.draw.2: the correct option calls the tertiary cation high-energy, not unstable', () => {
  const p = bankProblem(u10, 'u10.draw', 'u10.draw.2');
  const step = p.steps[0];
  const right = step.options[step.answer].text;
  assert.match(right.en, /high-energy intermediate/);
  assert.match(right.lt, /didelės energijos tarpinę dalelę/);
  assert.doesNotMatch(J(right), /unstable|nestabil/);
});
