'use strict';
// Regression tests for plan task H (u15, u16 fact-check fixes).
const test = require('node:test');
const assert = require('node:assert');
const load = require('./load.js');

const ORG = load();
const u15 = load.unit('site/organic/units/u15.js');
const u16 = load.unit('site/organic/units/u16.js');
const typeOf = (u, id) => u.types.find((t) => t.id === id);
const J = (x) => JSON.stringify(x);
const bankProblem = (u, tid, pid) => typeOf(u, tid).bank.find((p) => p.id === pid);
function walk(x, fn) {
  if (Array.isArray(x)) x.forEach((y) => walk(y, fn));
  else if (x && typeof x === 'object') { fn(x); Object.values(x).forEach((y) => walk(y, fn)); }
}
const texts = (u) => { const out = []; walk(u, (o) => { if (typeof o.lt === 'string' && typeof o.en === 'string') out.push(o); }); return out; };
const schemes = (u) => { const out = []; walk(u, (o) => { if (o.scheme && o.scheme.items) out.push(o.scheme.items); }); return out; };
const hasLt = (u, re) => texts(u).some((o) => re.test(o.lt));
const hasEn = (u, re) => texts(u).some((o) => re.test(o.en));

test('H1 u15.cys.8: SH is somewhat more acidic than NH3+; no "depends on the pH"', () => {
  const p = bankProblem(u15, 'u15.cys', 'u15.cys.8');
  const sol = p.steps[0].solution;
  assert.doesNotMatch(J(sol), /depends on the pH|priklauso nuo pH/);
  assert.match(sol.en, /SH.* is somewhat more acidic than .*NH3\+.*much weaker acids than .*COOH/);
  assert.match(sol.lt, /šiek tiek rūgštesnė už .*NH3\+.*silpnesnės rūgštys už .*COOH/);
  assert.match(sol.en, /8\.2/); assert.match(sol.en, /10\.3/);
  assert.ok(!hasEn(u15, /their order depends on the pH/));
});

test('H2 u15.drug.6: ephedrine (one N) is not described as having several nitrogen atoms', () => {
  const p = bankProblem(u15, 'u15.drug', 'u15.drug.6');
  const s = J(p.q) + J(p.steps.map((x) => x.prompt));
  assert.doesNotMatch(s, /several nitrogen|keli azoto|other nitrogen|kiti azoto/);
  assert.match(p.q[0].p.en, /one nitrogen/);
  assert.match(p.steps[1].prompt.en, /aliphatic amine/);
  // the others keep the shared text
  const p1 = bankProblem(u15, 'u15.drug', 'u15.drug.1');
  assert.match(p1.q[0].p.en, /several nitrogen/);
  assert.match(p1.steps[1].prompt.en, /other nitrogen/);
  const m = ORG.chem.parse('CNC(C)C(O)c1ccccc1');
  assert.equal(m.atoms.filter((a) => a.el === 'N').length, 1);
});

test('H3 u15 nitrosamines: two separate schemes, no "+" joining the reactions', () => {
  const all = schemes(u15);
  const dm = all.filter((it) => it.some((x) => x.smi === 'CN(C)N=O'));
  const ma = all.filter((it) => it.some((x) => x.smi === 'CN(N=O)c1ccccc1'));
  assert.equal(dm.length, 1); assert.equal(ma.length, 1);
  assert.notStrictEqual(dm[0], ma[0]);
  for (const it of [dm[0], ma[0]]) {
    assert.ok(!it.some((x) => x.plus), 'no plus');
    assert.equal(it.filter((x) => x.arrow).length, 1);
  }
  assert.ok(!dm[0].some((x) => x.smi === 'CNc1ccccc1'));
});

test('H4 u15.nuc.3: the cation has no N-H proton (not "no lone pair left")', () => {
  const p = bankProblem(u15, 'u15.nuc', 'u15.nuc.3');
  const s = J(p.steps);
  assert.doesNotMatch(s, /no lone pair left|laisvos poros nebelieka/);
  assert.match(s, /cation has no \$N-H\$ proton for the base to remove/);
  assert.match(s, /katijonas neturi \$N-H\$ protono/);
});

test('H5 u15 LT/EN fixes and pKaH table cells', () => {
  assert.ok(hasLt(u15, /prie azoto prijungtų anglies atomų skaičius/) && !hasLt(u15, /azoto kaimynų skaičius/));
  assert.ok(hasLt(u15, /net su vienu bromo ekvivalentu reakcija nesustoja ties monopakeitimu/) && !hasLt(u15, /vienos bromo molekulės neužtenka/));
  const p = bankProblem(u15, 'u15.scheme', 'u15.scheme.6');
  assert.match(p.q[0].p.en, /First consider direct bromination/);
  assert.doesNotMatch(p.q[0].p.en, /Start with/);
  // the pKaH table: no Lithuanian words or decimal commas on the English side
  let table = null;
  walk(u15, (o) => { if (o.table && o.table.rows && J(o.table.rows).includes('N,N-diethylethanamine') && J(o.table.rows).includes('about')) table = o.table; });
  assert.ok(table, 'pKaH table found');
  const cells = table.rows.map((r) => r[2]);
  cells.forEach((c) => {
    assert.match(c.en, /^(about )?−?\d+\.\d+$/, J(c));
    assert.match(c.lt, /^(apie )?−?\d+,\d+$/, J(c));
  });
  assert.deepStrictEqual(load.plain(cells[cells.length - 1]), { lt: 'apie −0,5', en: 'about −0.5' });
});

test('H6 u16.sextet: step 2 asks about ring N only; no basic side-chain N gets "very weak base"', () => {
  const ty = typeOf(u16, 'u16.sextet');
  let ringQ = 0, weak = 0, histamine = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const smi = p.q[1].mol.smi;
    const m = ORG.chem.parse(smi);
    const st = p.steps[1];
    if (st.kind === 'atoms') {
      ringQ++;
      assert.match(st.prompt.en, /ring nitrogen atoms/); assert.match(st.prompt.lt, /žiedo azoto atomus/);
      st.answer.forEach((i) => assert.ok(m.atoms[i].aromatic && m.atoms[i].el === 'N', smi));
      if (smi === 'NCCc1cnc[nH]1') histamine++;
    } else {
      weak++;
      assert.match(st.prompt.en, /very weak base/);
      // nothing in the molecule apart from the ring may carry a basic nitrogen
      m.atoms.forEach((a) => assert.ok(!(a.el === 'N' && !a.aromatic), smi + ' has a non-ring N but asks why it is a weak base'));
    }
  }
  assert.ok(ringQ > 0 && weak > 0 && histamine > 0);
  assert.ok(!J(typeOf(u16, 'u16.sextet').gen.toString()).includes('NCCc1c[nH]c2ccccc12'));
});

test('H7 u16.sextet: O and S reasons mention the second, in-plane lone pair', () => {
  const ty = typeOf(u16, 'u16.sextet');
  let os = 0, nOnly = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const st = p.steps[1];
    if (st.kind !== 'choice') continue;
    const smi = p.q[1].mol.smi;
    const sol = J(st.solution);
    if (/[os]/.test(smi.replace(/\[nH\]/g, ''))) {
      os++;
      assert.match(st.solution.en, /second lone pair in the ring plane/, smi);
      assert.match(st.solution.en, /destroys the aromaticity/);
      assert.match(st.solution.lt, /žiedo plokštumoje/); assert.match(st.solution.lt, /sunaikina aromatiškumą/);
    } else { nOnly++; assert.doesNotMatch(sol, /second lone pair/, smi); }
  }
  assert.ok(os > 0 && nOnly > 0);
});

test('H8 pyrrole sulfonation (S3): C-3 stated as an exception; C-2 examples use nitration/acylation', () => {
  const T = J(u16);
  assert.ok(!/pyrrole-2-sulfonic|pirolo-2-sulfonrūgštis/.test(T));
  assert.ok(!hasEn(u16, /SO3\$·pyridine, acetic anhydride/));
  // notes scheme: sulfonation product is the 3-isomer, with the exception caption
  const sc = [];
  walk(u16, (o) => { if (o.scheme && J(o.scheme).includes('SO3, C5H5N') && J(o.scheme).includes('OS(=O)')) sc.push(o); });
  assert.equal(sc.length, 1);
  assert.ok(sc[0].scheme.items.some((x) => x.smi === 'OS(=O)(=O)c1c[nH]cc1'));
  assert.ok(ORG.chem.same(ORG.chem.parse('OS(=O)(=O)c1c[nH]cc1'), ORG.chem.parse('OS(=O)(=O)c1cc[nH]c1')));
  assert.match(sc[0].caption.en, /exception.*pyrrole-3-sulfonic acid/);
  assert.match(sc[0].caption.lt, /Išimtis.*pirolo-3-sulfonrūgštis/);
  // worked example, nuc.5 and nuc.6 no longer ask about pyrrole sulfonation
  const nuc5 = J(bankProblem(u16, 'u16.nuc', 'u16.nuc.5'));
  const nuc6 = J(bankProblem(u16, 'u16.nuc', 'u16.nuc.6'));
  assert.ok(!/SO3/.test(nuc5) && !/SO3|sulfon/.test(nuc6));
  assert.match(nuc6, /2-nitropyrrole/);
  // the generator: pyrrole and N-methylpyrrole are never sulfonated; furan still is
  const ty = typeOf(u16, 'u16.sear');
  let furanSulfo = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const p = ORG.check.makeProblem(ty, seed);
    const right = p.steps[1].options[p.steps[1].answer].mol.smi;
    const sulfo = /S\(=O\)\(=O\)O/.test(right);
    const ring = ORG.chem.parse(right).atoms.find((a, i) => a.aromatic && a.el !== 'C');
    if (sulfo) { assert.equal(ring.el, 'O', right); furanSulfo++; }
  }
  assert.ok(furanSulfo > 0);
});

test('H9 u16 notes: vitamin B12 is built on corrin, not porphine', () => {
  assert.ok(hasEn(u16, /corrin, a related macrocycle, forms the core of vitamin B12 with \$Co\$/));
  assert.ok(hasLt(u16, /korinas su \$Co\$ sudaro vitamino B12/));
  assert.ok(!hasEn(u16, /of vitamin B12 with \$Co\$\.$/) || !hasEn(u16, /Porphine[^.]*vitamin B12/));
  assert.ok(!hasEn(u16, /Porphine[^;]*vitamin B12/));
});

test('H10 u16.protonate reasons: imidazole is not "electron-poor"; N-R is allowed in the pyrrole-type reason', () => {
  const ty = typeOf(u16, 'u16.protonate');
  let alk = 0, pyr = 0;
  for (let seed = 1; seed <= 600; seed++) {
    let p;
    try { p = ORG.check.makeProblem(ty, seed); } catch (e) { continue; }
    const r = J(p.steps[1]);
    assert.doesNotMatch(r, /electron-poor|deficitin/, 'seed ' + seed);
    if (/aliphatic amine is free/.test(r)) alk++;
    if (/pyrrole-type nitrogen/.test(r)) { pyr++; assert.match(r, /\$N-H\$ or \$N-R\$/); assert.match(r, /\$N-H\$ arba \$N-R\$/); }
  }
  assert.ok(alk > 0 && pyr > 0);
});

test('H11 u16.pairing.7: acceptors include ring nitrogens', () => {
  const p = bankProblem(u16, 'u16.pairing', 'u16.pairing.7');
  const st = p.steps[0];
  assert.ok(st.answer.includes(3));
  assert.match(st.options[3].text.en, /acceptors are .*C=O.* oxygens and ring nitrogens/);
  assert.match(st.options[3].text.lt, /akceptoriai – .*C=O.* deguonys ir žiedo azotai/);
  assert.match(J(st.solution), /ring nitrogens/);
  assert.doesNotMatch(J(p), /the acceptor is \$C=O\$|akceptorius – \$C=O\$/);
});

test('H12 u16 LT/EN fixes: pairing.3, pyridine.4, spelling', () => {
  const p3 = bankProblem(u16, 'u16.pairing', 'u16.pairing.3');
  assert.match(p3.why.lt, /DNR, kurioje daug G–C porų, stabilesnė/);
  assert.doesNotMatch(p3.why.lt, /kietesnė/);
  const p4 = bankProblem(u16, 'u16.pyridine', 'u16.pyridine.4');
  assert.match(p4.why.lt, /galiausiai atsiduria ant anglies, ne ant azoto/);
  assert.doesNotMatch(p4.why.lt, /atakuoja anglį/);
  assert.match(J(p4.steps), /piridin-3-sulfonrūgštis/);
  assert.ok(!hasLt(u16, /pyridin-/));
});
