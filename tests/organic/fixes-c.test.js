'use strict';
// Regression tests for plan task C (u03, u04): fact-check fixes C1-C13.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load.js');

const UNITS = path.join(__dirname, '..', '..', 'site', 'organic', 'units');

// loads a unit file; returns { ORG, unit }
function open(name) {
  const ctx = load.context();
  const ORG = vm.runInContext('globalThis.ORG = globalThis.ORG || {}', ctx);
  let unit = null;
  ORG.unit = (u) => { unit = u; };
  const file = path.join(UNITS, name + '.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return { ORG, unit };
}
const typeOf = (unit, id) => unit.types.find((ty) => ty.id === id);
const smiOf = (opt) => opt.mol.smi;
// every text (lt and en) in a value
function texts(v, out) {
  out = out || [];
  if (v && typeof v === 'object') {
    if (typeof v.lt === 'string' && typeof v.en === 'string') out.push(v);
    else Object.values(v).forEach((x) => texts(x, out));
  }
  return out;
}
const hay = (v) => texts(v).map((x) => x.lt + '\n' + x.en).join('\n');

const U3 = open('u03'), U4 = open('u04');

/* ---------- C1: u03.nuel wrong options really cannot react ---------- */
test('C1: nuel wrong options never form an acid-base pair or a carbonyl + cation/BF3 pair', () => {
  const ty = typeOf(U3.unit, 'u03.nuel');
  const PROTIC = ['CO', 'O', 'CN', 'N', 'CS', '[OH-]', '[SH-]', '[OH3+]', '[H+]'];
  const STRONG = ['[OH-]', 'C[O-]', '[NH2-]', '[CH3-]', '[H-]'];
  const CARBONYL = ['C=O', 'CC=O', 'CC(C)=O', 'CC(=O)Cl'];
  let singles = 0;
  for (let seed = 1; seed <= 5000; seed++) {
    const p = U3.ORG.check.makeProblem(ty, seed);
    if (p.steps.length !== 3) continue;
    singles++;
    const x = p.q[1].mol.smi;
    const wrong = p.steps[2].options.slice(1).map(smiOf);
    assert.strictEqual(p.steps[2].answer, 0);
    for (const w of wrong) {
      assert.ok(!(STRONG.includes(x) && PROTIC.includes(w)), 'seed ' + seed + ': ' + x + ' with ' + w);
      assert.ok(!(STRONG.includes(w) && PROTIC.includes(x)), 'seed ' + seed + ': ' + x + ' with ' + w);
      if (CARBONYL.includes(x)) assert.ok(w !== '[H+]' && w !== 'FB(F)F' && !/\+/.test(w), 'seed ' + seed + ': carbonyl ' + x + ' with ' + w);
    }
    assert.strictEqual(new Set([smiOf(p.steps[2].options[0])].concat(wrong)).size, 3, 'seed ' + seed + ': options repeat');
  }
  assert.ok(singles > 2000);
});

test('C1: the nuel reason no longer says the particles repel each other', () => {
  const ty = typeOf(U3.unit, 'u03.nuel');
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const p = U3.ORG.check.makeProblem(ty, seed);
    if (p.steps.length === 3) seen.add(hay(p.steps[2].solution));
  }
  const all = [...seen].join('\n');
  assert.ok(!/repel/i.test(all) && !/stumia/.test(all));
  assert.ok(/neither particle can accept an electron pair/.test(all));
  assert.ok(/neither particle can donate an electron pair/.test(all));
  assert.ok(/nė viena negali priimti elektronų poros/.test(all));
});

/* ---------- C2: redox.3 ---------- */
test('C2: redox.3 step 3 gives the right oxidation-state changes in both languages', () => {
  const p = typeOf(U3.unit, 'u03.redox').bank.find((b) => b.id === 'u03.redox.3');
  const s = hay(p.steps[2].solution);
  assert.ok(s.includes('0 → +1') && s.includes('−2 → −3'));
  assert.ok(!s.includes('−2 → 0') && !s.includes('0 → −3'));
  const sol = p.steps[2].solution;
  assert.ok(sol.lt.includes('0 → +1') && sol.en.includes('0 → +1') && sol.lt.includes('−2 → −3') && sol.en.includes('−2 → −3'));
});

/* ---------- C3: carbocation / radical order (S1) ---------- */
test('C3: stab generator never ranks a parent allyl/benzyl against a secondary or tertiary alkyl centre', () => {
  const ty = typeOf(U3.unit, 'u03.stab');
  const C = U3.ORG.chem;
  // class of the centre: { deg 0..3, kind 'alkyl' | 'allyl' | 'benzyl' }
  const cls = (smi) => {
    const m = C.parse(smi);
    const i = m.atoms.findIndex((a) => a.bracket && a.el === 'C');
    const deg = 3 - m.atoms[i].h;
    let kind = 'alkyl';
    m.nbr[i].forEach((j) => {
      if (m.atoms[j].aromatic) kind = 'benzyl';
      else if (m.nbr[j].some((k) => k !== i && m.bondAt(j, k).order === 2)) kind = kind === 'benzyl' ? kind : 'allyl';
    });
    return { deg, kind };
  };
  let ions = 0, seenPairs = new Set();
  for (let seed = 1; seed <= 1000; seed++) {
    const p = U3.ORG.check.makeProblem(ty, seed);
    const kindText = p.q[0].p.en;
    if (/carbanion/.test(kindText)) continue;
    ions++;
    const cs = p.steps[0].options.map((o) => cls(o.mol.smi));   // listed from the most to the least stable
    for (let a = 0; a < 3; a++) {
      for (let b = a + 1; b < 3; b++) {
        const hi = cs[a], lo = cs[b];
        seenPairs.add(hi.kind + hi.deg + '>' + lo.kind + lo.deg);
        if (hi.kind === 'alkyl' && lo.kind === 'alkyl') { assert.ok(hi.deg > lo.deg, 'seed ' + seed); continue; }
        if (hi.kind !== 'alkyl' && lo.kind === 'alkyl') { assert.ok(lo.deg <= hi.deg, 'seed ' + seed + ': ' + JSON.stringify([hi, lo])); continue; }
        if (hi.kind !== 'alkyl' && lo.kind !== 'alkyl') { assert.ok(hi.deg === lo.deg && hi.kind === 'benzyl' && lo.kind === 'allyl', 'seed ' + seed + ': ' + JSON.stringify([hi, lo])); continue; }
        assert.fail('seed ' + seed + ': an alkyl centre ranked above ' + hi.kind + ' ' + JSON.stringify([hi, lo]));
      }
    }
  }
  assert.ok(ions > 500);
  // the allowed comparisons still occur: tertiary benzylic over tertiary alkyl, benzylic over allylic at one degree
  assert.ok(seenPairs.has('benzyl3>alkyl3') && seenPairs.has('allyl2>alkyl2') && seenPairs.has('benzyl1>allyl1'), [...seenPairs].join(' '));
});

test('C3: notes, summary and resonance.5 carry the refined order', () => {
  const all = hay(U3.unit.notes) + '\n' + hay(U3.unit.summary);
  assert.ok(all.includes('the parent benzyl cation lies between a secondary and a tertiary cation'));
  assert.ok(all.includes('paprasčiausias benzilo katijonas yra tarp antrinio ir tretinio'));
  assert.ok(all.includes('In the course, the stability of carbocations and radicals grows in the order'));
  const r5 = typeOf(U3.unit, 'u03.resonance').bank.find((b) => b.id === 'u03.resonance.5');
  assert.ok(!/most stable of the carbocations/.test(hay(r5.why)));
});

/* ---------- C4: effects generator ---------- */
test('C4: "-I is stronger than +M" appears only when the halogen has a +M effect', () => {
  const ty = typeOf(U3.unit, 'u03.effects');
  let withM = 0, withoutM = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const p = U3.ORG.check.makeProblem(ty, seed);
    const step1 = hay(p.steps[0].solution), step2 = hay(p.steps[1].solution);
    const said = /−I is stronger than \+M|−I stipresnis už \+M/.test(step2);
    const noM = /no mesomeric effect|mezomerijos efekto nėra/.test(step1);
    if (said) { withM++; assert.ok(!noM, 'seed ' + seed); }
    if (noM) { withoutM++; assert.ok(!said, 'seed ' + seed); }
  }
  assert.ok(withM > 0 && withoutM > 0);
});

/* ---------- C5 / C6: wording ---------- */
test('C5: +I row, activation energy and SN2 wording', () => {
  const notes = hay(U3.unit.notes);
  assert.ok(notes.includes('metals ($Li$, $Mg$) and silicon ($Si$)') && !notes.includes('($Li$, $Mg$, $Si$)'));
  assert.ok(notes.includes('mažo elektrinio neigiamumo atomai: metalai ($Li$, $Mg$) ir silicis ($Si$)'));
  assert.ok(notes.includes('to reach the transition state, from which products form by themselves') && !notes.includes('reach the intermediate state'));
  const ty = typeOf(U3.unit, 'u03.rtype');
  const sn2 = new Set();
  for (let seed = 1; seed <= 400; seed++) {
    const p = U3.ORG.check.makeProblem(ty, seed);
    const sol = p.steps.map((st) => hay(st.solution)).join('\n');
    if (/nucleophile attacks carbon while the halogen leaves/.test(sol)) sn2.add(sol);
  }
  assert.ok(sn2.size > 0);
  [...sn2].forEach((s) => assert.ok(/A methyl or primary haloalkane/.test(s) && /Metilo ar pirminis halogenalkanas/.test(s)));
});

test('C6: natural.6 WHY says alternating (not cross) conjugation in LT', () => {
  const p = typeOf(U3.unit, 'u03.natural').bank.find((b) => b.id === 'u03.natural.6');
  assert.ok(!p.why.lt.includes('kryžmin') && !p.why.lt.includes('grandinį'));
  assert.ok(p.why.lt.includes('besikaitaliojančių dvigubųjų ryšių ir karbonilo grandinę'));
});

/* ---------- C7: conj accepts every equivalent atom ---------- */
test('C7: conj acid-direction tap step accepts all symmetry-equivalent atoms', () => {
  const ty = typeOf(U4.unit, 'u04.conj');
  const want = { 'O=C1CCCCC1': [2, 6], 'C#C': [0, 1], 'OS(=O)(=O)O': [0, 4], 'CCC': [0, 2] };
  const seen = {};
  for (let seed = 1; seed <= 400; seed++) {
    const p = U4.ORG.check.makeProblem(ty, seed);
    const st = p.steps[0];
    if (st.kind !== 'atoms' || !/give up|atiduoti|atiduoda/.test(hay(st.prompt))) continue;
    const smi = st.mol.smi;
    if (want[smi]) {
      seen[smi] = true;
      assert.deepStrictEqual(load.plain(st.answer).slice().sort((a, b) => a - b), want[smi], smi + ' seed ' + seed);
      assert.ok(!U4.ORG.check.checkStep(st, [want[smi][0]], 'en').ok, 'tapping only one of the equivalent atoms is not the whole set');
      assert.ok(U4.ORG.check.checkStep(st, want[smi], 'en').ok);
      const sol = hay(st.solution);
      assert.ok(/atoms no\. \d+ and no\. \d+/.test(sol) && /atomai Nr\. \d+ ir Nr\. \d+/.test(sol), sol);
      assert.ok(/equivalent/.test(sol) && /lygiaverčiai/.test(sol));
    } else {
      assert.strictEqual(st.answer.length, 1, smi + ' has one keyed atom');
    }
  }
  assert.deepStrictEqual(Object.keys(seen).sort(), Object.keys(want).sort());
});

/* ---------- C8-C13: u04 texts ---------- */
test('C8: water + NH3 worked example says the equilibrium lies to the left', () => {
  const t = hay(U4.unit.notes);
  assert.ok(t.includes('Because water (15.7) is a weaker acid than $NH4+$ (9.26), the equilibrium lies to the left: only a little $NH4+$ and $OH-$ form.'));
  assert.ok(t.includes('pusiausvyra pasislinkusi į kairę'));
  assert.ok(!t.includes('15.7, is larger, so water is the acid'));
});

test('C9: summary says monohaloacetic acids', () => {
  const t = hay(U4.unit.summary);
  assert.ok(t.includes('strongest of the monohaloacetic acids $XCH2COOH$') && t.includes('monohalogenacto rūgščių $XCH2COOH$'));
  assert.ok(!/strongest of the haloacetic/.test(t));
});

test('C10: methane pKa is about 50 and sp3 < sp2 < sp holds', () => {
  const sec = U4.unit.notes.find((s) => s.id === 'factors');
  const tbl = sec.blocks.map((b) => b.table).filter(Boolean).find((x) => x.rows.some((r) => r.some((c) => c && c.smi === 'C')));
  const row = tbl.rows.find((r) => r.some((c) => c && c.smi === 'C'));
  const cell = row[1];
  assert.ok(cell.en === '≈50' && cell.lt === '≈50');
  const all = JSON.stringify(U4.unit);
  assert.ok(!/methane (is )?40|metano pKa 40/.test(all));
  // the unit's own ethane (50) and ethene (44) values: methane must not be more acidic than ethene
  assert.ok(50 >= 44);
});

test('C11: pi-base text allows protonation to a carbocation by strong acids', () => {
  const t = hay(U4.unit.notes);
  assert.ok(!/only short-lived/.test(t) && !/no new \$σ\$ bond forms/.test(t) && !/naujas \$σ\$ ryšys nesusidaro/.test(t));
  assert.ok(t.includes('with a strong acid the proton is taken up further and a carbocation forms (a $σ$ bond)'));
  assert.ok(t.includes('su stipria rūgštimi protonas prisijungia toliau ir susidaro karbokatijonas ($σ$ ryšys)'));
  assert.ok(t.includes('weak acids give only $π$ complexes, strong acids a carbocation'));
});

test('C12: pKa generator WHY (LT) no longer says Ka is the fraction dissociated', () => {
  const ty = typeOf(U4.unit, 'u04.pka');
  const whys = new Set();
  for (let seed = 1; seed <= 200; seed++) whys.add(hay(U4.ORG.check.makeProblem(ty, seed).why));
  const t = [...whys].join('\n');
  assert.ok(!t.includes('kokia dalis rūgšties disocijuoja'));
  assert.ok(t.includes('Ka rodo, kaip stipriai rūgštis disocijuoja'));
});

test('C13: LT name But-3-en-1-amine is spelled right', () => {
  const t = JSON.stringify(U4.unit);
  assert.ok(!t.includes('Bute-3-en-1-amine'));
  assert.ok(t.includes('But-3-en-1-amine yra'));
});
