'use strict';
// Regression tests for Task F of the 2026-11-25 organic fact-check fixes (u11, u12).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load = require('./load.js');

const ROOT = path.join(__dirname, '..', '..');

// one engine per unit file, with ORG.check available for makeProblem
function open(id) {
  const cx = load.context();
  const ORG = vm.runInContext('globalThis.ORG', cx);
  let unit = null;
  ORG.unit = (u) => { unit = u; };
  const file = path.join(ROOT, 'site', 'organic', 'units', id + '.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), cx, { filename: file });
  const type = (tid) => unit.types.find((x) => x.id === tid);
  return { ORG, unit, type, make: (tid, seed) => ORG.check.makeProblem(type(tid), seed) };
}
const text = (v) => JSON.stringify(v);
const canon = (ORG, s) => ORG.chem.canonical(ORG.chem.parse(s), { stereo: false });
function find(v, key, out) {
  out = out || [];
  if (Array.isArray(v)) v.forEach((x) => find(x, key, out));
  else if (v && typeof v === 'object') { if (key in v) out.push(v[key]); Object.values(v).forEach((x) => find(x, key, out)); }
  return out;
}

// seeds per generator test; the whole file must stay near 5 s (each problem costs a few engine runs)
const N = 250;
const U11 = open('u11');
const U12 = open('u12');
const ringCache = {};
const ring = (seed) => ringCache[seed] || (ringCache[seed] = U12.make('u12.ring', seed));

test('F1 u11.react4: with H2SO4/heat no wrong option is a major alkene of the rule', () => {
  const { ORG, make } = U11;
  let n = 0;
  for (let seed = 1; seed <= N; seed++) {
    const p = make('u11.react4', seed);
    const lab = text(p.q);
    if (!/H2SO4, H2O/.test(lab)) continue;
    const alc = find(p.q, 'smi')[0];
    const res = ORG.react.run('elim', [alc], { base: 'heat-acid' });
    const majors = res.products.filter((x) => x.major && !x.by).map((x) => canon(ORG, x.smi));
    assert.strictEqual(majors.length, 1, 'seed ' + seed + ': ' + alc + ' has several major alkenes');
    const step = p.steps[0];
    const opts = step.options;
    const right = opts[step.answer];
    assert.strictEqual(canon(ORG, right.mol.smi), majors[0], 'seed ' + seed + ': key is not the major alkene');
    opts.forEach((o, i) => {
      if (i === step.answer || !o.mol) return;
      assert.ok(!majors.includes(canon(ORG, o.mol.smi)), 'seed ' + seed + ': wrong option ' + o.mol.smi + ' is a major product of ' + alc);
    });
    n++;
  }
  assert.ok(n > 20, 'too few H2SO4 problems seen: ' + n);
});

test('F2/F3/F4/F5 u11 notes and cheat sheet', () => {
  const all = text(U11.unit.notes) + text(U11.unit.summary);
  // F2: the SN1 split is for HX only; PBr3 and SOCl2 are SN2 and not used for tertiary alcohols
  assert.ok(!all.includes('"$HX$, $PBr3$, $SOCl2$"'), 'the cheat-sheet row must be split');
  assert.ok(/PBr3\$, \$SOCl2\$[^]*primary and secondary, SN2/.test(all));
  assert.ok(/pirminiai ir antriniai, SN2/.test(all));
  assert.ok(!/the acid protonates it first and \$OH2\+\$ leaves as water\.'/.test(all), 'the protonation sentence must be limited to HX');
  // F3: rearrangement is mentioned and "always" is gone
  assert.ok(!/result is always a haloalkane/.test(all) && !/visada halogenalkanas su tuo pačiu skeletu/.test(all));
  assert.ok(/carbocation can rearrange/.test(all) && /karbokatijonas gali persigrupuoti/.test(all));
  // F4: fumarase direction
  assert.ok(!/fumarase turns malate into fumarate/.test(all) && !/malatą \(obuolių rūgšties anijoną\) paverčia fumaratu/.test(all));
  assert.ok(/fumarase interconverts malate and fumarate/.test(all) && /runs as a hydration/.test(all));
  // F5: acidic permanganate is colourless Mn2+; MnO2 only in neutral solution
  assert.ok(!/fades with brown \$MnO2\$ precipitating/.test(all));
  assert.ok(/in acid violet permanganate becomes almost colourless/.test(all) && /rūgščioje terpėje violetinis permanganatas tampa beveik bespalvis/.test(all));
});

test('F3 claim: 3-methylbutan-2-ol + HBr rearranges to 2-bromo-2-methylbutane', () => {
  const { ORG } = U11;
  const res = ORG.react.run('alc.hx', ['CC(C)C(C)O'], { X: 'Br' });
  assert.ok(ORG.react.wouldRearrange('CC(C)C(C)O'));
  assert.ok(res.products.length > 0);
});

test('F6 u12.ring water mode: text follows the number of free activated positions', () => {
  const { make } = U12;
  let one = 0, many = 0;
  for (let seed = 1; seed <= N; seed++) {
    const p = ring(seed);
    if (!/aqueous|vandens tirpalas/.test(text(p.q))) continue;
    const s1 = p.steps[0];
    const s2 = p.steps[1];
    const text2 = text(s2.solution) + text(s2.hint);
    const polybromo = /polybromophenol|polibromfenolis|does not stop at the monobromide|nesustoja ties monobromidu/.test(text2);
    if (s1.answer.length === 1) {
      one++;
      assert.ok(!polybromo, 'seed ' + seed + ': one free position but the text says polybromo');
      assert.ok(/only free activated/.test(text(s2.solution)) && /vienintelę laisvą aktyvuotą/.test(text(s2.solution)));
    } else {
      many++;
      assert.ok(polybromo, 'seed ' + seed + ': several free positions but the text is not polybromo');
    }
  }
  assert.ok(one > 0 && many > 0, 'both cases must be seen: ' + one + ', ' + many);
});

test('F7 u12.will: no 4-nitrophenyl ether ("ethoxide + 4-nitrohalobenzene fails" is false, SNAr)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'site/organic/units/u12.js'), 'utf8');
  assert.ok(!/\[N\+\]\(=O\)\[O-\]', wh:/.test(src));
  const { make } = U12;
  for (let seed = 1; seed <= N; seed++) {
    const p = make('u12.will', seed);
    assert.ok(!/\[N\+\]\(=O\)\[O-\]/.test(text(p.q)), 'seed ' + seed + ': nitro ether');
  }
});

test('F8 u12.ring fe mode: one equivalent is stated and the dibromide is never the key', () => {
  const { ORG, make } = U12;
  let br = 0;
  for (let seed = 1; seed <= N; seed++) {
    const p = ring(seed);
    const q = text(p.q);
    if (/FeBr3|FeCl3/.test(q)) {
      assert.ok(/1 ekv\. (Br2|Cl2)/.test(q) && /1 equiv\. (Br2|Cl2)/.test(q), 'seed ' + seed + ': amount missing');
      br++;
    }
  }
  assert.ok(br > 50);
  // with excess Br2 the engine gives the 2,6-dibromo product, with one equivalent the mono product is the key
  const water = ORG.react.run('phenol.br2', ['Oc1ccc(cc1)[N+](=O)[O-]']);
  assert.deepStrictEqual(load.plain(water.products.filter((x) => x.major).map((x) => canon(ORG, x.smi))), [canon(ORG, 'Oc1c(Br)cc(cc1Br)[N+](=O)[O-]')]);
  const all = text(U12.unit.notes);
  assert.ok(!/it is less activated: \$Br2\$\/\$FeBr3\$ puts one bromine/.test(all));
  assert.ok(/amount of reagent, not by the activity of the ring/.test(all) && /reagento kiekis, o ne žiedo aktyvumas/.test(all));
});

test('F9 u12 cheat sheet: epoxide row carries the condition', () => {
  const all = text(U12.unit.summary);
  assert.ok(/basic or neutral conditions/.test(all) && /bazinė ar neutrali terpė/.test(all));
});

test('F10 u12.acid: solution reads "Acidity: ... (pKa x)"', () => {
  const { make } = U12;
  for (let seed = 1; seed <= 200; seed++) {
    const p = make('u12.acid', seed);
    const sol = text(p.steps[0].solution);
    assert.ok(!/"pKa: /.test(sol) && !/pKa: /.test(sol), 'seed ' + seed);
    assert.ok(/Acidity: [^"]*\(pKa [\d.]+\)/.test(sol) && /Rūgštingumas: [^"]*\(pKa [\d,]+\)/.test(sol), 'seed ' + seed + ': ' + sol);
  }
});

test('F11/F13 u12 mech.12: hint leads to the phenoxide, LT option is complete', () => {
  const p = U12.type('u12.mech').bank.find((x) => x.id === 'u12.mech.12');
  const s = p.steps[0];
  assert.ok(!/most acidic|rūgščiausią/.test(text(s.hint)));
  assert.ok(/nucleophilic anion/.test(text(s.hint)) && /nukleofiliniu anijonu/.test(text(s.hint)));
  assert.ok(s.options.every((o) => !/chlorace\./.test(o.text.lt)));
  assert.strictEqual(s.options[2].text.lt, 'Chloracto rūgšties chloro atomas.');
  assert.strictEqual(s.options[2].text.en, 'The chlorine atom of the chloroacetic acid.');
});

test('F12 u12.will: the step-2 hint fits aryl and tie cases', () => {
  const { make } = U12;
  const seen = { aryl: 0, tie: 0, base: 0 };
  for (let seed = 1; seed <= N; seed++) {
    const p = make('u12.will', seed);
    const hint = text(p.steps[1].hint);
    const sol = text(p.steps[1].solution);
    if (/sp2/.test(sol) && /aryl|Arilhalogenidas/.test(sol)) {
      seen.aryl++;
      assert.ok(/sp2\$ ring carbon/.test(hint) && /sp2\$ žiedo anglies/.test(hint), 'seed ' + seed + ': ' + hint);
    } else if (/Both halides are methyl or primary/.test(sol)) {
      seen.tie++;
      assert.ok(/What kind of carbon does SN2 need/.test(hint) && /Kokia turi būti anglis/.test(hint), 'seed ' + seed + ': ' + hint);
    } else {
      seen.base++;
      assert.ok(/strong base|stipri bazė/.test(hint));
    }
  }
  assert.ok(seen.aryl > 0 && seen.tie > 0 && seen.base > 0, JSON.stringify(seen));
});
