'use strict';
// Regression tests for the fact-check fixes D1-D12 (units u05, u06, u07).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load.js');

const u05 = load.unit('site/organic/units/u05.js');
const u06 = load.unit('site/organic/units/u06.js');
const u07 = load.unit('site/organic/units/u07.js');
const ORG = load(['chem.js', 'stereo.js', 'draw.js', 'views.js', 'name.js', 'react.js', 'units.js', 'check.js']);
const type = (u, id) => u.types.find((x) => x.id === id);
const make = (u, id, seed) => ORG.check.makeProblem(type(u, id), seed);
const src = (f) => fs.readFileSync(path.join(__dirname, '..', '..', 'site', 'organic', 'units', f), 'utf8');
const json = (x) => JSON.stringify(x);

test('D1: CIP table says COOH is the highest of the carbon groups in this table', () => {
  const s = src('u05.js');
  assert.ok(s.includes("'highest of the carbon groups in this table'"));
  assert.ok(s.includes('aukščiausia iš lentelės anglies grupių'));
  assert.ok(!s.includes("'carbon groups: highest'"));
});

test('D2: u05.chiral step 2 has no "top left" in LT', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const p = make(u05, 'u05.chiral', seed);
    const pr = p.steps[1].prompt;
    assert.ok(!/viršuje kairėje/.test(pr.lt), 'seed ' + seed);
    assert.ok(/skaitant iš kairės į dešinę/.test(pr.lt));
    assert.ok(/reading left to right/.test(pr.en));
  }
});

test('D3: u06.count words aromatic cases as side-chain hydrogens, with the key matching', () => {
  let arom = 0, plain = 0, hit = 0;
  const want = { 'CCc1ccccc1': 2, 'CC(C)c1ccccc1': 2, 'CCCc1ccccc1': 3, 'CCC(C)c1ccccc1': 4 };
  for (const seed of [1, 2, 3, 4, 5, 6, 36, 43, 182]) {
    const p = make(u06, 'u06.count', seed);
    const smi = p.q.find((b) => b.scheme).scheme.items[0].smi;
    const s = json([p.steps[0].hint, p.steps[0].solution]);
    const n = p.steps[0].answer.value;
    if (want[smi] !== undefined) { assert.strictEqual(n, want[smi], smi); hit++; }
    if (/c/.test(smi)) {
      arom++;
      assert.ok(/side-chain/.test(s) && /šoninės grandinės/.test(s), 'seed ' + seed + ' ' + smi);
      assert.ok(/ring hydrogens are not replaced/.test(s) && /žiedo vandeniliai/.test(s));
      // the solution's number is the key
      const sol = json(p.steps[0].solution);
      assert.ok(n === 1 ? /one group of equivalent side-chain/.test(sol) : new RegExp('There are ' + n + ' groups of equivalent side-chain').test(sol), 'seed ' + seed);
      // the key itself: side-chain (sp3) carbons only, never the ring
      const m = ORG.chem.parse(smi);
      const classes = new Set();
      m.atoms.forEach((a, i) => { if (a.el === 'C' && !a.aromatic && ORG.chem.hybridization(m, i) === 'sp3') classes.add(i); });
      assert.ok(n <= classes.size, 'seed ' + seed);
    } else {
      plain++;
      assert.ok(!/side-chain/.test(s), 'seed ' + seed + ' ' + smi);
    }
  }
  assert.ok(arom >= 3 && plain > 0, 'seeds 4, 36, 43, 182 are alkylbenzenes');
  assert.ok(hit > 0);
});

test('D4: u06.ox.4 has no balanced distractor that also gives CO', () => {
  const b = type(u06, 'u06.ox').bank.find((x) => x.id === 'u06.ox.4');
  const opts = b.steps[0].options.map((o) => o.text.lt || o.text);
  const balance = (eq) => {
    const [l, r] = eq.replace(/\$/g, '').split('→').map((x) => x.trim());
    const count = (side) => {
      const c = {};
      side.split('+').forEach((term) => {
        const m = /^(\d*)\s*(.+)$/.exec(term.trim());
        const k = m[1] ? +m[1] : 1;
        (m[2].match(/[A-Z][a-z]?\d*/g) || []).forEach((a) => { const e = /^[A-Z][a-z]?/.exec(a)[0]; const n = +(a.slice(e.length) || 1); c[e] = (c[e] || 0) + k * n; });
      });
      return c;
    };
    return JSON.stringify(Object.entries(count(l)).sort()) === JSON.stringify(Object.entries(count(r)).sort());
  };
  const co = opts.filter((o) => /→ .*\bCO\b/.test(o.replace(/\$/g, '').replace(/CO2/g, 'X')));
  const balancedCo = co.filter(balance);
  assert.strictEqual(balancedCo.length, 1, 'only the key balances and gives CO: ' + json(opts));
  assert.ok(balance(opts[b.steps[0].answer]) && /2 CO/.test(opts[b.steps[0].answer]));
  assert.ok(!/H2 \+ H2O/.test(json(b)));
});

test('D5: chlorine is not called almost unselective or nearly equal in u06', () => {
  const s = src('u06.js');
  assert.ok(!/nearly equal rates/.test(s) && !/almost the same rate/.test(s) && !/almost unselective/.test(s));
  assert.ok(!/beveik vienodu greičiu/.test(s) && !/beveik neselektyvus/.test(s));
  assert.ok(!/slightly faster/.test(s) && !/šiek tiek greičiau/.test(s));
  assert.ok(/1 : 4 : 5/.test(s));
  // the rule box, mistake box and why.7 carry the 1 : 4 : 5 numbers or the "closer together" wording
  const w7 = json(type(u06, 'u06.why').bank.find((x) => x.id === 'u06.why.7'));
  assert.ok(/move closer together/.test(w7) && /priartėja/.test(w7));
});

test('D6: 3-hexene + HBr scheme shows 3-bromohexane, with claims', () => {
  const blk = JSON.parse(json(u07.notes)).flatMap((sec) => sec.blocks || sec.body || []).find((b) => b.scheme && b.scheme.items[0].smi === 'CCC=CCC');
  assert.ok(blk, 'scheme present');
  assert.strictEqual(blk.scheme.items[4].smi, 'CCC(Br)CCC');
  assert.ok(Array.isArray(blk.claims) && blk.claims.some((c) => c.formula));
  const m = ORG.chem.parse('CCC(Br)CCC');
  assert.strictEqual(ORG.chem.formulaString(m), 'C6H13Br');
});

test('D7: u07.hydr and u07.radical solutions never say "more hydrogens" as the sole rule', () => {
  let arylHydr = 0, arylRad = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const ph = make(u07, 'u07.hydr', seed);
    const sh = json(ph);
    assert.ok(!/goes to the carbon with more hydrogens, \$OH\$ to the other/.test(sh), 'hydr seed ' + seed);
    assert.ok(!/patenka prie atomo su daugiau vandenilių, \$OH\$ – prie kitos/.test(sh));
    if (/c1ccccc1/.test(sh)) arylHydr++;
    const pr = make(u07, 'u07.radical', seed);
    const sr = json(pr);
    assert.ok(!/ends up on the carbon with more hydrogens/.test(sr), 'radical seed ' + seed);
    if (/benzylic > tertiary/.test(sr)) arylRad++;
  }
  assert.ok(arylHydr > 0);
  assert.ok(arylRad > 0);
});

test('D8: u07.back hint is built from the actual fragments', () => {
  const seen = new Set();
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 104, 108]) {
    const p = make(u07, 'u07.back', seed);
    const h = p.steps.find((x) => x.kind === 'choice').hint;
    const prods = p.steps[0].mol.smi.split('.');
    const hasAcid = prods.some((x) => /C\(O\)=O|OC\(=O\)/.test(x));
    const hasCo2 = prods.includes('O=C=O');
    const hasKet = prods.some((x) => x !== 'O=C=O' && !/C\(O\)=O|OC\(=O\)/.test(x));
    if (/Join two \$C=O\$ carbons from the different products/.test(h.en)) {
      assert.strictEqual(/the acid|acids/.test(h.en), hasAcid, 'seed ' + seed + ' ' + h.en + ' ' + prods);
      assert.strictEqual(/CO2/.test(h.en), hasCo2, 'seed ' + seed);
      assert.strictEqual(/ketone/.test(h.en), hasKet, 'seed ' + seed);
      assert.strictEqual(/rūgšt|rūgšč/.test(h.lt), hasAcid, 'seed ' + seed + ' ' + h.lt);
      assert.strictEqual(/CO2/.test(h.lt), hasCo2);
      assert.strictEqual(/keton/.test(h.lt), hasKet);
      seen.add(h.en);
    }
  }
  assert.ok(seen.size >= 2, 'several different hints: ' + [...seen].join(' | '));
});

test('D9: hot alkaline KMnO4: CO2 shown, and the text says carbonate in base, CO2 after acidification', () => {
  const s = src('u07.js');
  assert.ok(s.includes('the scheme shows $CO2$, which is released on acidification'));
  assert.ok(s.includes('the schemes write $CO2$, which is released on acidification'));
  let seenNote = 0;
  for (let seed = 1; seed <= 400; seed++) {
    const p = make(u07, 'u07.kmno4', seed);
    const sol = json(p.steps[1].solution);
    const alk = /OH-/.test(json(p.q));
    if (alk && /O=C=O/.test(sol)) { assert.ok(/as carbonate in base/.test(sol) && /bazinėje terpėje – karbonatas/.test(sol), 'seed ' + seed); seenNote++; }
  }
  assert.ok(seenNote > 0);
});

test('D10: single product means symmetrical or cyclic alkene (summary and notes)', () => {
  const s = json(u07.notes) + json(u07.summary);
  assert.ok(/a single product means a symmetrical alkene \(join two molecules of it\) or a cyclic one/.test(s));
  assert.ok(/the alkene is symmetrical \(join two molecules of it\) or cyclic/.test(s));
  assert.ok(/arba žiedinis/.test(s));
  assert.ok(!/a single product means a symmetrical alkene\./.test(s));
});

test('D11: summary covers CF3 for electron-withdrawing groups', () => {
  const s = json(u07.summary);
  assert.ok(/with \$CF3\$, \$H\+\$ adds to the carbon next to the group/.test(s));
  assert.ok(/esant \$CF3\$/.test(s));
});

test('D12: u07.deduce.5 WHY names hydrogenation in both languages', () => {
  const b = type(u07, 'u07.deduce').bank.find((x) => x.id === 'u07.deduce.5');
  assert.ok(/Hidrinimas žiedo neatveria/.test(b.why.lt));
  assert.ok(/Hydrogenation does not open the ring/.test(b.why.en));
});
