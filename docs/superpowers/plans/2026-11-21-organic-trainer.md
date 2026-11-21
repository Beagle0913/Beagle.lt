# Organic chemistry trainer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `https://beagle.lt/organic/`, a bilingual trainer that teaches and drills the whole VU GMC Organinė chemija course: 16 lecture units and 6 lab units, each with notes and checked exercises.

**Architecture:** Plain scripts under `site/organic/js/` attach to one global namespace `ORG`: a molecule engine, a drawer that outputs a virtual SVG tree, a namer, reaction rules, DOM-free checking and progress logic, and a DOM interface. Content lives in one file per unit (`site/organic/units/*.js`) as data plus generator functions; every text field carries both languages. Node tests load the same files into a `vm` context.

**Tech Stack:** HTML, CSS, JavaScript (ES2020, no modules, no dependencies). Node ≥ 20 for tests (`node --test`). Python `http.server` for local preview.

**Spec:** `docs/superpowers/specs/2026-11-21-organic-trainer-design.md` — read it before your task.

## Global Constraints

- Plain HTML, CSS and JavaScript: no build step, no dependencies, no third-party scripts, no analytics.
- Every page carries exactly the CSP meta tag of `site/index.html`: `default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'`, and `<meta name="referrer" content="no-referrer">`.
- No inline scripts, no inline event handlers, no `style="…"` attributes and no `setAttribute('style', …)`. Use classes, SVG presentation attributes, or `el.style.prop = …`.
- DOM is built with `createElement` / `createElementNS` / `textContent`. No `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` anywhere in `site/organic/`.
- Every piece of interface and content text exists in Lithuanian and English; Lithuanian is the default.
- Storage keys: `beagle-lang` (`lt` | `en`) and `beagle-organic-v1`.
- Trainer id `organic`, folder `site/organic/`, names "Organinė chemija" / "Organic chemistry".
- Course naming rules: main chain = most principal groups, then most C=C/C≡C, then longest, then most prefix substituents; Lithuanian locant-before-parent style (`2-metil-2-butenas`, `1-propanolis`, `pentano rūgštis`, `etilbutanoatas`, `N-metiletanaminas`); prefixes `chlor- brom- jod- fluor- hidroksi- okso- formil- amino- nitro- metoksi-`.
- Mechanism symbols: SR, AE, AN, SEAr, SN1, SN2, E1, E2.
- Content is written in our own words: nothing copied from the slides, seminar sheets or lab texts; no staff names; no images from the PDFs. Sources are in `C:\Users\dziug\Desktop\UNI\Organine` (read-only, never copied into the repo).
- `npm test` passes before every commit touching `site/` or `tests/`; total run under about 60 s.
- Work on branch `organic-trainer`. Do not commit to `main`. Do not push unless the task says so.
- Commit only the files your task owns (`git add <paths>`, never `git add -A`); other agents may be working in the same checkout. If `git commit` reports `index.lock`, wait a few seconds and retry.
- End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A name typed without Lithuanian letters, with other dash characters, extra spaces or different capitals (`2 metil 2 butenas`, `2–metil–2–butenas`, `Pentano rugstis`) — accepted, with the correct spelling shown. Test in Task 8 (`check.test.js`).
2. Old, corrupt or foreign data under `beagle-organic-v1` (not JSON, wrong shape, unknown type ids, huge numbers) — ignored field by field; the page still works. Test in Task 8 (`progress.test.js`).
3. A large molecule (estradiol, lithocholic acid, LSD, enalapril) on a 360 px wide screen — scales to fit the column, tap targets stay at least 40 px apart or the step offers a zoomed view. Test in Task 3 (`draw.test.js`: every layout reports width/height; Task 8's UI scales by width) and the browser check in Task 15.
4. Switching language in the middle of a problem — the same problem, the same step, the same choices made so far. Test in Task 8 (`ui` state kept outside text; `check.test.js` renders both languages of one problem with identical answers).
5. A unit file that fails to load (offline, missing, throws) — a message in the unit's place, the rest of the trainer works. Test in Task 8 (`ui` loader error path, covered by a fixture that throws) and Task 15 browser check.

---

## File map

```
site/organic/index.html          page shell (Task 8)
site/organic/trainer.css         styles (Task 8; molecule classes from Task 3)
site/organic/js/chem.js          engine core (Task 1)
site/organic/js/stereo.js        stereochemistry, isomers (Task 2)
site/organic/js/draw.js          layout + molecule SVG (Task 3)
site/organic/js/views.js         Fischer, Newman, chair, schemes, mechanisms (Task 4)
site/organic/js/name.js          namer (Task 5)
site/organic/js/react.js         reaction rules (Task 6)
site/organic/js/units.js         unit list (Task 8)
site/organic/js/check.js         text markup, answer checking, problem validation (Task 8)
site/organic/js/progress.js      mastery, review queue, exam scoring (Task 8)
site/organic/js/ui.js            DOM interface (Task 8)
site/organic/units/u01.js … u16.js, l1.js … l6.js   content (Tasks 11–13)
site/organic/README.md           how the trainer works (Task 14)
site/trainers.json, site/index.html, site/404.html, site/shared/site.js, site/shared/site.css   (Task 9)
tests/organic/load.js            loads site/organic/js into a vm context (Task 1)
tests/organic/*.test.js          one per js file, plus content.test.js
tests/organic/fixtures/          fixture units for UI and validator tests
tools/organic/atoms.js           print atom numbers of a SMILES (Task 1)
tools/organic/playground.html, playground.js   render a unit's molecules and problems for authors and reviewers (Task 10)
tools/organic/AUTHORING.md       the author guide (Task 10)
.claude/launch.json              add a "repo" server on port 8001 serving the repo root (Task 10)
package.json                     test script (Task 9)
```

Load order everywhere: `chem.js, stereo.js, draw.js, views.js, name.js, react.js, units.js, check.js, progress.js, ui.js`. Each file is wrapped as `(function (ORG) { … })(globalThis.ORG = globalThis.ORG || {});`. No file reads `window` or `document` at load time except `ui.js`.

## Shared interfaces (all tasks)

**Text.** `T = { lt: string, en: string }`. Inline markup inside T strings, parsed by `ORG.check.markup(str) → [Span]` where `Span = {text, b?, i?, sub?, sup?}`: `**bold**`, `*italic*`, `$…$` for a formula (inside it a digit run following a letter or `)` becomes subscript; a trailing `+`, `-`, `2+`, `2-`, `•` becomes superscript; `^…^` forces superscript). `−` (U+2212) is used for minus in text.

**Molecule reference.** `Mol = { smi: string, name?: T, caption?: T, opts?: DrawOpts }`. `DrawOpts = { rotate?: number (degrees), flip?: 'x'|'y', numbers?: 'all' | number[] | {[atomIdx]: string}, lonePairs?: boolean | number[], allH?: boolean, condensed?: boolean, highlight?: {atoms?: number[], bonds?: [number,number][], tone?: 1|2|3|4}, deltas?: {[atomIdx]: '+'|'-'}, circle?: boolean, coords?: [number,number][], maxWidth?: number }`. Atom numbers are 0-based positions in the SMILES string, hydrogens not counted.

**Engine (`ORG.chem`)** — Task 1 produces:
- `parse(smi: string) → Mol` (throws `Error` with the position on bad input). `Mol = { atoms: Atom[], bonds: Bond[], nbr: number[][] (neighbour atom indices), bondAt(a,b) → Bond|null }`; `Atom = { el: string, charge: number, h: number (total attached H), aromatic: boolean, chiral: null|'@'|'@@', comp: number (dot-separated component) }`; `Bond = { a: number, b: number, order: 1|2|3|1.5, dir: null|'/'|'\\' }`.
- `formula(mol) → {[el]: count}`, `formulaString(mol) → string` (Hill order: C, H, then alphabetical; charge appended as `+`/`−`), `unsaturation(mol) → number`, `carbonClass(mol, i) → 0|1|2|3|4`, `hybridization(mol, i) → 'sp3'|'sp2'|'sp'|null`, `bondCounts(mol) → {sigma, pi}` (H bonds included), `lonePairs(mol, i) → number`, `rings(mol) → number[][]` (SSSR), `isAromaticRing(mol, ring) → boolean`, `aromaticAtoms(mol) → number[]`, `conjugated(mol) → number[][]` (atom sets of each conjugated system, p-orbitals of lone-pair heteroatoms and charged centres included), `canonical(mol, {stereo: boolean}) → string`, `same(a: Mol|string, b: Mol|string, {stereo}) → boolean`, `groups(mol) → [{type: string, atoms: number[]}]` (types: `alkene alkyne arene halide alcohol phenol thiol ether sulfide aldehyde ketone acid carboxylate ester acylhalide anhydride amide nitrile amine1 amine2 amine3 ammonium nitro sulfonic`), `compoundClass(mol) → string` (the senior group's class).

**Stereo (`ORG.stereo`)** — Task 2 produces: `stereocentres(mol) → number[]`, `cip(mol, i) → 'R'|'S'|null`, `ez(mol, a, b) → 'E'|'Z'|null`, `cisTrans(mol, a, b) → 'cis'|'trans'|null`, `stereoBonds(mol) → [number,number][]`, `stereoisomers(mol) → string[]` (canonical SMILES of every distinct stereoisomer, meso counted once), `isMeso(mol) → boolean`, `isChiral(mol) → boolean`, `isomers(formula: string, {filter?: groupType|'any', rings?: boolean}) → string[]` (distinct constitutional isomers as canonical SMILES; up to 7 heavy atoms), `withConfig(mol, {[atomIdx]: 'R'|'S'}) → string` (SMILES with those configurations).

**Drawer (`ORG.draw`)** — Task 3 produces:
- `molecule(mol: Mol|string, opts?: DrawOpts) → Drawing`, `Drawing = { svg: VNode, width: number, height: number, atoms: {x,y}[] (drawing coordinates), bondLength: 40 }`.
- `VNode = { t: string, a?: {[attr]: string|number}, c?: (VNode|{text: string})[] }`. Atom tap targets are `{t:'circle', a:{class:'hit', 'data-atom': i, …}}`; bond targets `{t:'line', a:{class:'hit', 'data-bond': 'a-b', …}}`, emitted only when `opts.targets` is `'atoms'` or `'bonds'`.
- `toDom(vnode, doc) → Element` (uses `createElementNS`), `toString(vnode) → string` (for tests and tools).
- `layout(mol, opts) → { pos: {x,y}[] }`, `quality(mol, pos) → { overlaps: number, crossings: number, labelClashes: number }`.
- `condensed(mol) → string` (acyclic only, else null).
- CSS classes used in SVG: `mol, bond, atom, el-O, el-N, el-S, el-F, el-Cl, el-Br, el-I, el-P, charge, lp, num, delta, hl1…hl4, hit, sel, ok, bad, arrow, harrow, wedge, hash`.

**Views (`ORG.views`)** — Task 4 produces: `fischer(spec) → Drawing` with `spec = {smi, top: atomIdx, bottom: atomIdx}` or `{rows: [{left: T|string, right: T|string}], top, bottom}`; `newman(spec) → Drawing` with `spec = {front: [string,string,string], back: [string,string,string], angle: number}`; `chair(spec) → Drawing` with `spec = {subs: [{pos: 1..6, ax: boolean, label: string}], flip?: boolean}`; `scheme(spec: Scheme) → Drawing`; `mechanism(step: MechStep) → Drawing`; `resonance(mols: Mol[]) → Drawing`.
- `Scheme = { items: (Mol | {plus: true} | {arrow: '→'|'⇌'|'↔', above?: T|string, below?: T|string})[] }`. `MechStep = { scheme: Scheme, arrows: [{from: Ref, to: Ref, half?: boolean}], note?: T }`; `Ref = {m: k, a: i}` (atom; k = index among the scheme's Mol items) | `{m: k, lp: i}` (a lone pair on atom i) | `{m: k, b: [i, j]}` (the bond i–j) | `{m: k, mid: [i, j]}` (point between two atoms, for a bond being formed).
- Text arguments of type T are resolved by the caller: views take a `lang` in `spec.lang` (default `lt`).

**Namer (`ORG.name`)** — Task 5 produces: `name(mol: Mol|string, {lang: 'lt'|'en', stereo?: boolean}) → { name: string, alts: string[] } | null` (null = outside scope); `inScope(mol) → boolean`; `trivial(mol) → {lt: string, en: string} | null`.

**Reactions (`ORG.react`)** — Task 6 produces: `run(rule: string, reactants: string[], opts?: object) → { products: [{smi: string, major: boolean}], none?: boolean, note?: T }` and `RULES: {[id]: {title: T, mech?: string}}`. Rule ids: listed in Task 6.

**Content (`ORG.unit`, `ORG.UNITS`)** — Task 8 produces the loader; Tasks 11–13 write the files.
- `ORG.UNITS = [{ id: 'u01', n: '1', part: 1|2|3, file: 'units/u01.js', title: T, exams: ('mt1'|'mt2'|'exam')[], sources: string[] }]` (part 3 = labs; labs have `exams: []`).
- A unit file calls `ORG.unit(Unit)` once. `Unit = { id, lectureMissing?: boolean, notes: Section[], summary: Block[], types: ExType[], coverage: {[taskId]: typeId[]} }`, `Section = { id: string, title: T, blocks: Block[] }`.
- `Block` (exactly one of these keys): `{h: T}`, `{p: T}`, `{list: T[], ordered?: boolean}`, `{rule: T}`, `{pitfall: T}`, `{mol: Mol | Mol[], caption?: T}`, `{scheme: Scheme, caption?: T}`, `{mech: MechStep[], caption?: T}`, `{resonance: Mol[], caption?: T}`, `{fischer: …}`, `{newman: …}`, `{chair: …}`, `{table: {head: T[], rows: (T|Mol)[][]}}`, `{example: {q: Block[], steps: Block[][]}}`, `{practice: typeId}`. Blocks may add `src: string`.
- `ExType = { id: 'u07.hx', title: T, mirrors: string[], gen?: (rng: () => number, ctx: Ctx) => Problem, bank?: Problem[] }`. `Ctx = { chem, stereo, name, react, draw, pick(arr), shuffle(arr), int(lo, hi) }`.
- `Problem = { id?: string (required and unique in banks, e.g. 'u07.hx.3'), q: Block[], steps: Step[], why: T | Block[], src?: string, claims?: Claim[] }`.
- `Step = { prompt: T, kind: 'choice'|'multi'|'atoms'|'order'|'number'|'name'|'formula'|'match', options?: Option[], answer?: any, mol?: Mol, bonds?: boolean, from?: string, hint: T, solution: T | Block[] }`. Answers by kind: `choice` index; `multi` index array; `atoms` atom-index array (or `[i,j]` pairs with `bonds: true`), optional `from: 'stereocentres' | 'carbon:1'…'carbon:4' | 'hyb:sp'|'hyb:sp2'|'hyb:sp3' | 'conjugated' | 'aromatic'` to have the validator recompute it; `order` none (options are listed in the right order); `number` `{value, tol}`; `name` `{lt: string[], en: string[]}` (first is shown) or `{smi}` (the namer supplies the names); `formula` string like `'C5H12'`; `match` `{left: Option[], right: Option[], pairs: number[]}`.
- `Option = { text: T } | { mol: Mol } | { scheme: Scheme }`.
- `Claim` (checked by `content.test.js`): `{formula: [smi, 'C5H12']}`, `{name: [smi, T]}`, `{cip: [smi, i, 'R'|'S']}`, `{ez: [smi, i, j, 'E'|'Z']}`, `{centres: [smi, number[]]}`, `{stereoisomers: [smi, n]}`, `{isomers: [formula, n, filter?]}`, `{hyb: [smi, i, 'sp2']}`, `{carbon: [smi, i, 1..4]}`, `{sigmaPi: [smi, s, p]}`, `{aromatic: [smi, true|false]}`, `{react: [ruleId, [smi…], opts|null, majorSmi]}`, `{same: [smi, smi]}`, `{chiral: [smi, true|false]}`.
- Task ids for coverage: seminar tasks `S1.1`…`S1.15`, `S2.1`…`S2.23`, `S3.1`…`S3.21`, `S4.1`…`S4.22`, `S5.1`…`S5.20`, `S6.1`…`S6.23`, `S7.1`…`S7.16`; lab items `LW1.1`… (one per experiment or question in the lab text, numbered by the lab unit's author).

**Check (`ORG.check`)** — Task 8 produces: `markup(str) → Span[]`, `normName(str) → {key: string, folded: string}`, `checkStep(step, input, lang) → {ok: boolean, note?: T}`, `validateUnit(unit) → string[]` (structural errors), `rng(seed) → () => number` (mulberry32), `makeProblem(type, seed) → Problem`.

**Progress (`ORG.progress`)** — Task 8 produces: `load(raw: string|null) → State`, `save(state) → string`, `record(state, typeId, {firstTry: boolean, hinted: boolean, problemRef})`, `stars(state, typeId) → 0..3`, `mastered(state, typeId) → boolean`, `unitShare(state, unit) → number`, `reviewQueue(state) → ProblemRef[]`, `examScore(results, exam: 'mt1'|'mt2'|'exam') → {score, max, pass: boolean|null}`. Weights: `mt1` 0.3 × 10 = 3; `mt2` 0.5 × 10 = 5 (pass needs ≥ 1.7); `exam` 0.8 × 10 = 8.

---

## Phase 1 — foundations

### Task 1: Engine core (`chem.js`)

**Files:** Create `site/organic/js/chem.js`, `tests/organic/load.js`, `tests/organic/chem.test.js`, `tools/organic/atoms.js`.

**Interfaces:** Produces `ORG.chem` (above) and `tests/organic/load.js` exporting `load(files?: string[]) → ORG` (reads `site/organic/js/<file>` in the load order, runs them in one `vm` context whose `globalThis` has no `window`/`document`, returns its `ORG`; `load.unit(path)` also runs a unit file).

- [ ] **Step 1: Write failing tests** in `tests/organic/chem.test.js` (`node:test` + `node:assert`):
  - parse errors: `'C(C'`, `'C1CC'`, `'[Xx]'`, `'C==C'` throw.
  - formulas: `CC(C)(C)CC(CC)CC` (4-etil-2,2-dimetilheksanas) → `C10H22`; `CC(=O)Oc1ccccc1C(=O)O` → `C9H8O4`; `CC(=O)Nc1ccc(O)cc1` → `C8H9NO2`; `NC(CS)C(=O)O` → `C3H7NO2S`; `CC(=O)[O-].[Na+]` → `C2H3NaO2`; `[NH4+]` → `H4N+`.
  - `unsaturation`: benzene 4, `C=CC#N` 4, cyclohexane 1.
  - `carbonClass` on `CC(C)(C)CC(CC)CC`: atoms 0 → 1, 1 → 4, 4 → 2, 5 → 3.
  - `hybridization`: `C=CC#N` atoms 0,1 sp2; 2,3 sp; `CC(=O)O` atom 1 sp2.
  - `bondCounts`: `C=C` → {5,1}; `C#C` → {3,2}; `C=CC=C` → {9,2}; `CC#N` → {5,2}.
  - `lonePairs`: O of water-like `CO` → 2; N of `CN` → 1; Cl of `CCl` → 3.
  - aromaticity: aromatic → benzene, naphthalene, pyrrole `c1cc[nH]c1`, furan, thiophene, pyridine, pyrimidine, imidazole `c1c[nH]cn1`, indole, purine `c1ncc2[nH]cnc2n1`, `[cH-]1cccc1`, `[cH+]1cccccc1`; not aromatic → `C1=CC=CC=CC=C1`, `C1=CCC=C1`. Kekulé input `C1=CC=CC=C1` is perceived aromatic.
  - `conjugated`: `C=CC=O` one system of 4 atoms; `C=CCC=C` two systems of 2; `CC(=O)Oc1ccccc1` ester O lone pair joins the ring? — no: assert only that the ring's 6 atoms are one system and `C=O` with its O is in a system.
  - `canonical` / `same`: `OCC` = `CCO`; `C(C)(C)C` = `CC(C)C`; `c1ccccc1O` = `Oc1ccccc1` = `OC1=CC=CC=C1`; `C/C=C/C` ≠ `C/C=C\C` with stereo, = without.
  - `groups`/`compoundClass`: `CC(=O)OCC` → ester; `CC(=O)N` → amide; `CCN(C)C` → amine3; `CC(O)C=O` → aldehyde class with alcohol group present; `Oc1ccccc1` → phenol; `CC(=O)OC(C)=O` → anhydride.
- [ ] **Step 2: Run** `node --test tests/organic/chem.test.js` — expected: FAIL (`ORG.chem` undefined).
- [ ] **Step 3: Implement `chem.js`.** Implicit H for the organic subset from default valences (B 3; C 4; N 3, 5; O 2; P 3, 5; S 2, 4, 6; halogens 1); aromatic lower-case atoms take Kekulé assignment for valence and H count. SSSR by a standard algorithm. Hückel 4n+2 on rings and fused ring systems whose atoms are all sp2/with a lone pair in the ring. Canonical form: Morgan-style refinement with tie-breaking, output as SMILES; aromatic bonds normalised (Kekulé input and aromatic input give one canonical string).
- [ ] **Step 4: Write `tools/organic/atoms.js`**: `node tools/organic/atoms.js "<smiles>"` prints one line per atom: index, element, H count, neighbours, hybridisation, carbon class.
- [ ] **Step 5: Run** `node --test tests/organic/chem.test.js` and `npm test` — expected: PASS.
- [ ] **Step 6: Commit** `site/organic/js/chem.js tests/organic/load.js tests/organic/chem.test.js tools/organic/atoms.js` — "Organic trainer: molecule engine core".

### Task 2: Stereochemistry and isomers (`stereo.js`)

**Files:** Create `site/organic/js/stereo.js`, `tests/organic/stereo.test.js`.
**Interfaces:** Consumes `ORG.chem`. Produces `ORG.stereo` (above).

- [ ] **Step 1: Failing tests:**
  - CIP: L-alanine `C[C@@H](N)C(=O)O` → S at atom 1; L-serine `OC[C@@H](N)C(=O)O` → atom 2 S; L-cysteine `SC[C@@H](N)C(=O)O` → atom 2 R; (R)-glyceraldehyde `OC[C@@H](O)C=O` → atom 2 R; (R)-carvone `CC1=CC[C@@H](CC1=O)C(C)=C` → atom 4 R; (S)-carvone its mirror → S; (R)-2-butanol `C[C@@H](O)CC` → atom 1 R; a centre with duplicated-atom rule `C=C[C@H](C)C(C)C` (vinyl > isopropyl) — compute and assert by hand-derived value in the test comment.
  - E/Z: `C/C=C/C` E; `C/C=C\C` Z; `Cl/C=C/Br`… `F/C(Cl)=C/Br` — derive and assert; `CC(C)=CC` → null (not stereogenic).
  - stereocentres: 2-butanol → [1]; `CC(Cl)CCCl`(1,3-dichlorobutane) chiral; `CCC(CC)CC` (3-ethylpentane) none; 1,2-dibromopropane chiral; 1,5-dichloropentane achiral.
  - stereoisomer counts: tartaric acid `OC(C(O)C(=O)O)C(=O)O` → 3 with one meso; 2,3-dibromobutane → 3; 2-bromo-3-chlorobutane → 4; ephedrine skeleton `CNC(C)C(O)c1ccccc1` → 4; menthol `CC(C)C1CCC(C)CC1O` → 8; 2-butene → 2 (E/Z); `C=CC` → 1.
  - `isMeso`: `O[C@H](C(=O)O)[C@@H](O)C(=O)O` → true (verify configuration in the test by computing both centres' CIP: R,S).
  - `isomers`: `C5H12` 3; `C6H14` 5; `C4H9Cl` 4; `C2H7N` 2; `C2H6O` 2; `C3H8O` 3; `C3H6O2` with filter `ester` 2; `C4H7N` filter `nitrile` 2 (acyclic only); `C4H8` with rings 5 (constitutional: 1-butene, 2-butene, isobutene, cyclobutane, methylcyclopropane).
- [ ] **Step 2: Run** `node --test tests/organic/stereo.test.js` — FAIL.
- [ ] **Step 3: Implement.** CIP by hierarchical digraph with duplicate atoms for multiple bonds and ring closures, explored breadth-first (rules 1a/1b by atomic number then duplicates; no isotopes needed; rule 4/5 not needed — if a centre cannot be ranked, return null). Chirality from the SMILES `@`/`@@` neighbour order (implicit H placed as in OpenSMILES). Stereoisomer enumeration: assign every combination to stereocentres and stereo bonds, canonicalise with stereo, deduplicate (meso and symmetric cases collapse). Constitutional isomer enumeration: grow graphs atom by atom with canonical deduplication, valence-limited, then filter.
- [ ] **Step 4: Run** the test and `npm test` — PASS; the whole file under 5 s.
- [ ] **Step 5: Commit** — "Organic trainer: stereochemistry and isomers".

### Task 2b: RDKit reference answers

**Files:** Create `tools/organic/reference.py`, `tools/organic/reference-molecules.txt`, `tests/organic/fixtures/reference.json`, `tests/organic/reference.test.js`.
**Interfaces:** Consumes `ORG.chem`, `ORG.stereo` (Task 2; the stereo parts of the test switch on once `stereo.js` exists — skip them with `t.skip` while it does not). Produces `reference.json`: `[{smi, formula, aromaticAtoms: number[], centres: number[], cip: {[atomIdx]: 'R'|'S'}, ez: [[a, b, 'E'|'Z']], canonical: string}]`, and `reference.py --check <file>` for later tasks (content molecules).

- [ ] **Step 1:** `python -m pip install --user rdkit` (owner approved, 2026-11-21). Record the RDKit version in `reference.py`'s header comment.
- [ ] **Step 2:** `reference-molecules.txt`: at least 300 SMILES — every molecule in Tasks 1–6's test lists, the drawer's hard set, and a broad sample of the course's compound classes (each principal group, substituted benzenes, heterocycles, amino acids, sugars in open-chain form, every stereo case of the stereo tests, 50 random stereocentres made by `withConfig` once Task 2 exists).
- [ ] **Step 3:** `reference.py` (run with `python -I tools/organic/reference.py`) writes `reference.json`: molecular formula (Hill), aromatic atoms (RDKit default model — record where it legitimately differs from the course's Hückel teaching, e.g. exocyclic C=O rings, as `"aromaticNote"`), stereocentres (`FindMolChiralCenters(includeUnassigned=True, useLegacyImplementation=False)`), CIP labels from the new labeler (`rdCIPLabeler.AssignCIPLabels`), E/Z labels, and RDKit canonical SMILES. Atom indices are SMILES order, same as ours.
- [ ] **Step 4:** `reference.test.js`: for every entry, our formula equals RDKit's; our stereocentres and CIP labels equal RDKit's; our E/Z equal RDKit's; two entries are `same()` in our engine exactly when their RDKit canonical SMILES are equal (check all pairs with the same formula); aromatic atoms equal unless the entry has an `aromaticNote`. Every disagreement is either a bug to report (do not change `chem.js`/`stereo.js` yourself — list it in your report with the molecule and both answers) or a documented model difference in `aromaticNote`.
- [ ] **Step 5:** Run `node --test tests/organic/reference.test.js` and `npm test`; commit the four files — "Organic trainer: RDKit reference answers for the engine".

### Task 3: Molecule drawer (`draw.js`)

**Files:** Create `site/organic/js/draw.js`, `tests/organic/draw.test.js`, `tests/organic/fixtures/molecules.txt` (one SMILES per line: every molecule named in the spec's tests plus the hard set below).
**Interfaces:** Consumes `ORG.chem`. Produces `ORG.draw` (above).

Hard set (must all pass `quality` with zeros, without `coords`): 4-etil-2,2-dimetilheksanas, aspirin, paracetamol, propofol `CC(C)c1cccc(C(C)C)c1O`, cysteine, tryptophan `NC(Cc1c[nH]c2ccccc12)C(=O)O`, thymine, guanine `Nc1nc2[nH]cnc2c(=O)[nH]1`, atenolol `CC(C)NCC(O)COc1ccc(CC(N)=O)cc1`, geraniol, eugenol, vanillin, cinnamaldehyde, citric acid, menthol, limonene, carvone, nootkatone `CC1CC(=O)C=C2CCC(CC12C)C(C)=C`, estradiol `C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O`, lithocholic acid, nicotine, caffeine, LSD, enalapril, chloramphenicol, ephedrine, phenobarbital, vitamin C, glucose (open chain), naphthalene, biphenyl, cyclopropane, cyclohexanone, THF, 1,3-dichlorocyclohexane, ions `CC(=O)[O-].[Na+]`, `C[N+](C)(C)C.[Cl-]`.

- [ ] **Step 1: Failing tests:**
  - every line of `molecules.txt`: `layout` succeeds; `quality` returns `{overlaps: 0, crossings: 0, labelClashes: 0}`; `toString(molecule(s).svg)` contains no `NaN`, no `undefined`, no `style=`.
  - geometry: in `CCCCC` consecutive bond angles are 120° ± 1°; benzene ring atoms are a regular hexagon (all bonds 40 ± 0.5, angles 120° ± 0.5); in `CC#CC` the four atoms are collinear ± 0.5; bond lengths everywhere 40 ± 2 except to labels.
  - labels: `CCO` draws `OH`; `NCC` draws `H2N` on the left end when the N is the leftmost atom and `NH2` otherwise; `C[N+](C)(C)C` draws a `+`; `opts.lonePairs: true` on `CCO` draws 2 `lp` elements on O.
  - wedges: for `C[C@@H](O)CC` the drawing has one `wedge` or `hash` bond at atom 1, and `ORG.draw.readStereo(drawing)` (export a helper that re-derives `@`/`@@` from 2D positions + wedge type) gives the same CIP as `ORG.stereo.cip` — run over every stereocentre in `molecules.txt`. (Requires Task 2; if Task 2 is not merged yet, mark this test `todo` and switch it on in Task 4.)
  - `allH: true` on `CCO` draws 6 H labels; `condensed('CC(O)CC=O')` → `'CH3CH(OH)CH2CHO'` (with subscripts as Unicode or markup per your choice, documented); `condensed('c1ccccc1')` → null.
  - targets: `opts.targets: 'atoms'` on `CCO` yields 3 `hit` circles with `data-atom` 0, 1, 2; `'bonds'` yields 2 `hit` lines.
  - `width`/`height` positive and ≤ 40 × (heavy atoms + 2).
- [ ] **Step 2: Run** `node --test tests/organic/draw.test.js` — FAIL.
- [ ] **Step 3: Implement.** Bond length 40. Ring systems first (regular polygons; fused rings by sharing an edge; for bridged systems fall back to a force-directed relaxation and require `coords` in content if it fails), then chains depth-first with 120° zig-zag, substituents spread evenly, triple and cumulated bonds straight. Resolve clashes by flipping branches about single bonds and rotating subtrees; choose the arrangement with the lowest `quality` score; finally rotate so the longest axis is horizontal (opts `rotate`/`flip` applied after). Double bonds in rings drawn inside the ring; elsewhere centred or offset to the side with more atoms. Labels: heteroatoms and carbons with charge or `allH`; H counts attached to the label on the side away from bonds. Wedges: pick one non-ring bond per stereocentre (prefer a bond to H or a terminal atom) and choose wedge/hash so the 2D configuration matches the SMILES parity.
- [ ] **Step 4: Run** the test and `npm test` — PASS.
- [ ] **Step 5: Commit** — "Organic trainer: molecule layout and drawing".

### Task 4: Special views (`views.js`)

**Files:** Create `site/organic/js/views.js`, `tests/organic/views.test.js`.
**Interfaces:** Consumes `ORG.chem`, `ORG.stereo`, `ORG.draw`. Produces `ORG.views` (above).

- [ ] **Step 1: Failing tests:**
  - Fischer from SMILES: D-glyceraldehyde `OC[C@@H](O)C=O` with `top` = the CHO carbon, `bottom` = CH2OH carbon: OH on the right. L-alanine with COOH on top: NH2 on the left. Tartaric acids: meso form shows both OH on the same side. `ORG.views.readFischer(spec)` returns the configuration of each centre and it matches `ORG.stereo.cip` for these and for 20 random centres built by `ORG.stereo.withConfig`.
  - Newman: `{front: ['CH3','H','H'], back: ['CH3','H','H'], angle: 180}` draws a circle, 3 front bonds meeting at the centre, 3 back bonds starting at the circle; labels present.
  - chair: 6 ring bonds; a substituent `{pos: 1, ax: true}` is drawn vertical; `{ax: false}` roughly parallel to ring bonds.
  - scheme: `[{smi:'C=C'}, {plus:true}, {smi:'Br'}, {arrow:'→', above:'CCl4'}, {smi:'BrCCBr'}]` returns one Drawing whose width ≈ sum of parts; when `maxWidth` < natural width, the items wrap into rows.
  - mechanism: an arrow `{from: {m:1, lp: 0}, to: {m:0, a:1}}` produces one `arrow` path with a marker-free arrowhead (drawn as a path); `half: true` produces `harrow`.
  - no `NaN`, `undefined` or `style=` in any output.
- [ ] **Step 2: Run** `node --test tests/organic/views.test.js` — FAIL.
- [ ] **Step 3: Implement.** Arrowheads are small filled paths (no `<marker>` ids, so many drawings can share a page). Curved arrows: quadratic Bézier bulging away from the molecule's centre; start at the lone pair dots or bond midpoint, end 6 units short of the target. Also switch on the wedge re-read test from Task 3 if it was `todo`.
- [ ] **Step 4: Run** `node --test tests/organic/draw.test.js tests/organic/views.test.js` and `npm test` — PASS.
- [ ] **Step 5: Commit** — "Organic trainer: Fischer, Newman, chair, schemes and mechanisms".

### Task 5: Namer (`name.js`)

**Files:** Create `site/organic/js/name.js`, `tests/organic/name.test.js`, `tests/organic/fixtures/names.tsv` (SMILES, Lithuanian name, English name, source).
**Interfaces:** Consumes `ORG.chem` (and `ORG.stereo` for descriptors). Produces `ORG.name` (above).

- [ ] **Step 1: Read lecture 1** (`1.FORMULĖS_KLASIFIKAVIMAS_NOMENKLATŪRA.pdf`, all pages, as images with the Read tool) and seminar 1. Write `names.tsv` with at least 150 rows: every in-scope named example of lecture 1 and seminar 1 (e.g. `2-metilbutanas`, `1,3-dimetilciklopentanas`, `2-metil-2-butenas`, `3-metilcikloheksenas`, `4-metil-2-pentinas`, `1-etil-3-metilbenzenas`, `2-jodpropanas`, `1-propanolis`, `fenilmetanolis`, `3,4-dimetilfenolis`, `1-propantiolis`, `benzentiolis`, `2-metoksipropanas`, `metiltioetanas`, `etanaminas`, `N-metiletanaminas`, `N,N-dimetiletanaminas`, `propanalis`, `3-metilbenzenkarbaldehidas`, `2-pentanonas`, `ciklopentanonas`, `etano rūgštis`, `benzenkarboksirūgštis`, `natrio propanoatas`, `kalio cikloheksankarboksilatas`, `etilbutanoatas`, `etanamidas`, `cikloheksankarboksamidas`, `etannitrilas`, `etanoilchloridas`, `1-chlor-2,4-dimetil-3-nitropentanas`, `2-chlormetil-4-metil-3-nitro-1-pentenas`, `4-formilbenzenkarbonitrilas`, `3-metil-5-heksin-2-olis`, `6-chlor-5-metil-2,4-heptadienas`, `2-amino-4,4-dimetilpentano rūgštis`, `3,3-dimetilbutanamidas`, `3-fenilpropano rūgštis`, `4-brom-3-metil-2-cikloheksenkarboksirūgštis`, `etil-3-oksobutanoatas`, `3-metilpentannitrilas`, `N-metilpropanamidas`, `4-metil-3-cikloheksenonas`), the seminar 1 task 15 names, and enough generated-style cases to cover every principal group, multiple bonds, rings, benzene derivatives and multiplying prefixes. English column: IUPAC 2013 style (`2-methylbut-2-ene`, `propan-1-ol`, `pentanoic acid`, `ethyl butanoate`) — the namer also returns the older style (`2-methyl-2-butene`, `1-propanol`) in `alts`. Mark rows the namer must return `null` for (heterocycles, fused rings) with `null` in the name columns.
- [ ] **Step 2: Failing test:** for every row, `name(smi, {lang})` equals the given name (or is null), both languages; `alts` never contains the main name; every name is ≤ 80 characters; `inScope` agrees with null-ness. Plus E/Z and R/S: `name('C/C=C/C', {lang:'lt', stereo:true}).name === '(E)-2-butenas'`, `name('C[C@@H](O)CC', {lang:'en', stereo:true}).name === '(R)-butan-2-ol'`.
- [ ] **Step 3: Run** `node --test tests/organic/name.test.js` — FAIL.
- [ ] **Step 4: Implement** the course's rules exactly as lecture 1 states them (seniority list from the slides; chain criteria a–d; lowest locants for the principal group, then multiple bonds, then prefixes; alphabetical prefixes ignoring `di/tri`; Lithuanian endings `-anas -enas -inas -olis -alis -onas -o rūgštis -amidas -nitrilas -oatas -tiolis -aminas`, `-karboksirūgštis`, `-karbaldehidas`, `-karbonitrilas` for rings; English per IUPAC 2013). Trivial names from the slides go into `trivial()`, not into `name()`.
- [ ] **Step 5: Run** the test and `npm test` — PASS.
- [ ] **Step 6: Commit** — "Organic trainer: IUPAC namer, course rules, LT and EN".

### Task 6: Reaction rules (`react.js`)

**Files:** Create `site/organic/js/react.js`, `tests/organic/react.test.js`.
**Interfaces:** Consumes `ORG.chem`, `ORG.stereo`. Produces `ORG.react` (above).

Rule ids (each returns every product, the major one(s) marked; `none: true` when the course says no reaction): `sr.halogenate {X:'Cl'|'Br'}`, `ae.hx {X}`, `ae.h2o`, `ae.x2 {X}`, `ae.h2`, `ox.kmno4.mild`, `ox.kmno4.harsh`, `diene.hx`, `yne.h2 {eq:1|2, lindlar?}`, `yne.x2 {eq}`, `yne.hx {eq}`, `yne.hydration`, `yne.cu`, `sear {E:'Cl'|'Br'|'NO2'|'SO3H'|'CH3'|'C(C)(C)C'|'C(C)=O'}`, `side.br`, `side.ox`, `sn2 {nu:'OH'|'SH'|'CN'|'OC'|'C#CC'|'NH3'|'I'|'OCC'|'SC'}`, `sn1 {nu}`, `elim {base?:'strong'|'heat-acid'}`, `alc.hx {X}`, `alc.ox {reagent:'PCC'|'chromic'}`, `alc.na`, `williamson`, `ether.hi {eq:1|2}`, `phenol.base`, `phenol.alkyl`, `phenol.acyl`, `phenol.br2`, `thiol.base`, `thiol.alkyl`, `thiol.disulfide`, `co.nabh4`, `co.hcn`, `co.hemiacetal`, `co.acetal`, `co.thioacetal`, `co.oxime`, `co.phenylhydrazone`, `co.tollens`, `co.cannizzaro`, `co.aldol`, `co.aldolcond`, `co.enols`, `co.iodoform`, `acid.ester`, `acid.salt`, `acid.socl2`, `acyl.nu {nu:'water'|'alcohol'|'amine'|'ammonia'}`, `ester.hydrolysis {medium:'acid'|'base'}`, `claisen`, `lactone`, `amine.protonate`, `amine.alkyl`, `amine.acyl`, `amine.hno2`, `diazo.sub {with:'CuCl'|'CuBr'|'CuCN'|'H2O'|'KI'}`, `nitro.reduce`.

- [ ] **Step 1: Failing tests** — one or more known course cases per rule, e.g.: butane + Cl₂ → 1- and 2-chlorobutane (2-chloro chiral), Br₂ major 2-bromobutane; 2-methyl-2-butene + HBr → major 2-bromo-2-methylbutane; propenoic acid + H₂O/H⁺ → 3-hydroxypropanoic acid; 2-methyl-2-butene + KMnO₄ harsh → acetone + acetic acid; 2,4-hexadiene + HCl → 4-chloro-2-hexene and 2-chloro-3-hexene; 4-methyl-1-pentyne + H₂O/HgSO₄ → 4-methyl-2-pentanone; toluene + Cl₂/FeCl₃ → o- and p-chlorotoluene major, m minor; nitrobenzene + Br₂ → m-bromonitrobenzene; toluene + KMnO₄ → benzoic acid; 1-bromopropane + NaCN → butanenitrile; 2-bromo-2-methylbutane E2 → major 2-methyl-2-butene; 3-methyl-3-pentanol dehydration → major 3-methyl-2-pentene; 1-propanol + PCC → propanal, + chromic → propanoic acid; 2-methyl-2-propanol + chromic → none; Williamson for 2-methoxypropane prefers isopropoxide + CH₃I; methyl tert-butyl ether + HI → methanol/iodomethane + tert-butyl iodide/alcohol per the course's mechanism (SN1 at tertiary side); phenol + Br₂/H₂O → 2,4,6-tribromophenol; phenylethanal + Tollens → phenylacetic acid (as carboxylate, document); benzaldehyde Cannizzaro → benzyl alcohol + benzoate; propanal aldol → 3-hydroxy-2-methylpentanal, condensation → 2-methyl-2-pentenal; propanal + 2 EtOH → 1,1-diethoxypropane; ethyl butanoate Claisen → ethyl 2-ethyl-3-oxohexanoate; benzoic acid + EtOH/H⁺ → ethyl benzoate; acetyl chloride + 2 NH₃ → acetamide (+ NH₄Cl); 5-hydroxypentanoic acid → δ-valerolactone; 3-methylbenzoic acid + SOCl₂ then diethylamine → DEET; 4-aminophenol + acetic anhydride → paracetamol; aniline + NaNO₂/HCl 0–5 °C → benzenediazonium chloride, + CuCN → benzonitrile; nitrobenzene + Fe/H₃O⁺ → aniline; N-methyl-2-propanamine + HCl → ammonium salt, + C₂H₅Br → tertiary amine (salt).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** as graph edits on `ORG.chem` molecules; compare products with `ORG.chem.same`. Carbocation stability order: 3° > 2° > 1° > methyl, allylic and benzylic count as one class higher; generators avoid substrates where a 1,2-shift gives a more stable cation (export `react.wouldRearrange(smi) → boolean`). SEAr directing table: o/p activating `NH2 NHR NR2 OH OR NHCOR R Ar`; o/p deactivating `F Cl Br I`; m deactivating `NO2 CN SO3H CHO COR COOH COOR NR3+ CF3`. N,N-dimethylaniline in strong acid behaves as `NHMe2+` (meta).
- [ ] **Step 4: Run** the test and `npm test` — PASS.
- [ ] **Step 5: Commit** — "Organic trainer: reaction rules".

### Task 7: Top bar switcher and pull-request tests

(Independent of Tasks 1–6 and 8. Touches no file under `site/organic/`.)

**Files:** Modify `site/shared/site.js` (switcher block near lines 147–175), `site/shared/site.css`, `tests/site/core.test.js`, `.github/workflows/deploy.yml`.

- [ ] **Step 1: Failing tests** in `tests/site/core.test.js`: with a two-trainer list, the bar yields a disclosure: a `button` with `aria-expanded="false"` and `aria-controls`, a hidden list of `a` elements whose `href`s are the other trainers' paths (same-site only, as today); no `select` element is created; activating a link is the only way to navigate. With one trainer, no switcher (as today).
- [ ] **Step 2: Run** `npm test` — FAIL.
- [ ] **Step 3: Implement** the disclosure: Enter/Space on the button toggles; Escape closes and returns focus to the button; a click outside closes; the current trainer's name is on the button and is not in the list; the back/forward-cache handling stays correct. Styles in `site.css`, light and dark, touch targets ≥ 44 px.
- [ ] **Step 4: Workflow:** add `pull_request: {branches: [main]}` to `on:`; give the `publish` job `if: github.event_name != 'pull_request'`.
- [ ] **Step 5: Run** `npm test` — PASS. Preview (`.claude/launch.json` "site"), open `http://localhost:8000/math/` with `site/trainers.json` temporarily listing a second entry **only in your working copy** (do not commit that change) and check with the keyboard that stepping through the list never navigates and Escape works.
- [ ] **Step 6: Commit** `site/shared/site.js site/shared/site.css tests/site/core.test.js .github/workflows/deploy.yml` — "Site: trainer switcher as a disclosure menu; run tests on pull requests".

### Task 8: Trainer interface (`units.js`, `check.js`, `progress.js`, `ui.js`, `index.html`, `trainer.css`)

**Files:** Create `site/organic/js/units.js`, `check.js`, `progress.js`, `ui.js`, `site/organic/trainer.css`, `site/organic/index.html`; create `tests/organic/check.test.js`, `tests/organic/progress.test.js`, `tests/organic/fixtures/unit-a.js` (a small complete unit using every Block kind and every Step kind), `tests/organic/fixtures/unit-throws.js`. Modify `site/trainers.json`, `site/index.html`, `site/404.html`, `tests/site/pages.test.js` (listing the trainer).
**Interfaces:** Consumes `ORG.draw`, `ORG.views` (to render; until they exist, render a SMILES text placeholder behind a feature check, and remove the placeholder once Tasks 3–4 are in). Produces `ORG.UNITS`, `ORG.unit`, `ORG.check`, `ORG.progress` (above).

- [ ] **Step 1: Failing tests** (`check.test.js`):
  - `markup('$CH3CH2OH$ ir **svarbu**')` → spans with subscripts `3`, `2` and a bold span; `markup('$NO2+$')` → subscript 2, superscript +; `markup('$SO4^2-^$')`.
  - `normName`: `'2 metil 2 butenas'`, `'2–metil–2–butenas'`, `'2-Metil-2-Butenas'` all equal `'2-metil-2-butenas'`; `'pentano rugstis'` has the same `folded` as `'pentano rūgštis'` but a different `key`; `'2,3-dimetilbutanas'` ≠ `'2,4-dimetilbutanas'`.
  - `checkStep`: `name` with a folded match → `{ok: true, note}` (the note shows the proper spelling); `formula` `'C5H12'` vs `'H12C5'` and `'C₅H₁₂'` ok, `'C5H10'` not; `number` within tol; `multi` exact set; `atoms` exact set; `order` exact sequence; `match` all pairs.
  - `validateUnit(fixture unit-a)` → `[]`; a copy with a missing `en`, a duplicate bank id, an answer index out of range, an `order` step with fewer than 3 options → one error each.
  - `makeProblem(type, seed)` deterministic for a seed; both languages of one problem have identical `answer` values (answers live outside T).
- [ ] **Step 2: Failing tests** (`progress.test.js`): `load(null)`, `load('not json')`, `load('{"v":9}')`, `load('{"v":1,"types":{"x":{"streak":1e99}}}')` → a clean state with numbers capped; three first-try un-hinted answers → `mastered`; a hinted answer resets the streak; wrong answers enter `reviewQueue` and leave after a first-try right answer; `examScore` for ten results each full → 3 / 5 / 8, `mt2` with 3 full results → score 1.5, `pass: false`.
- [ ] **Step 2b: Failing tests** (`tests/site/pages.test.js`): `trainers.json` has `organic` with path `organic/` and the spec's names, summary and note; `index.html` and `404.html` each have a static row for it, written the way their `math` rows are; `site/organic/index.html` carries the CSP and referrer tags, `<body data-trainer="organic">`, `<div id="sitebar">` as the first element of the body, `<html lang="lt">`, and loads `../shared/site.css`, `../shared/site.js` and the scripts in the load order.
- [ ] **Step 3: Run** `node --test tests/organic/check.test.js tests/organic/progress.test.js` and `npm test` — FAIL.
- [ ] **Step 4: Implement `units.js`** with the 22 units of the spec's table (titles LT and EN, `part`, `exams`, `sources` like `['L7','S4']`). **`check.js`** and **`progress.js`** to pass the tests.
- [ ] **Step 5: Implement `ui.js`, `index.html`, `trainer.css`** per the spec's Pages section: hash routes `#/` (home), `#/u07` (unit, Learn tab), `#/u07/practice`, `#/u07/t/u07.hx` (a type), `#/exam/mt2`, `#/review`; header with LT | EN and "Ištrinti pažangą" (two-click confirm as in the maths trainer); unit loading by adding `<script src="units/<id>.js">` once, with an error message in place on failure; notes rendering for every Block kind; exercise player with steps, hint, solution, why, "another one", "next type"; answer widgets for all 8 kinds (atoms: SVG hit targets made focusable `tabindex=0`, `role="button"`, `aria-pressed`, Enter/Space toggle; order: up/down buttons; match: `<select>`s); language switch re-renders the same problem and keeps entered answers; exam mode (10 problems, ≤ 2 per unit, no hints until the end, score with the course's passing note); review mode. Typefaces and themes as `site/math/trainer.css` (IBM Plex Sans, STIX Two Text, `prefers-color-scheme`); molecules scale to the column width; tap targets ≥ 40 px on phones.
- [ ] **Step 6: Run** `npm test` — PASS. Preview with `.claude/launch.json` "site" and check every route at 1280 px and 375 px, light and dark, keyboard only; no console errors, no CSP violations. (Units do not exist yet: every unit shows the "not available" message; load `tests/organic/fixtures/unit-a.js` through the Task 10 playground once it exists.)
- [ ] **Step 7: Commit** — "Organic trainer: interface, checking and progress".

## Phase 2 — author tooling and the pilot unit

### Task 9: Content validator (`content.test.js`)

**Files:** Create `tests/organic/content.test.js`, `tests/organic/fixtures/seminar-tasks.json` (`{"S1": 15, "S2": 23, "S3": 21, "S4": 22, "S5": 20, "S6": 23, "S7": 16}`).
**Interfaces:** Consumes everything in Phase 1 and the unit files.

- [ ] **Step 1: Write** `content.test.js`. For every unit file present (all, or only `UNIT=u07 node --test …`): `validateUnit` is empty; every T has non-empty `lt` and `en` and they differ unless both are formulas or names; every SMILES parses; every Mol lays out with `quality` zeros (or has `opts.coords`); every `{mol: {name}}` and `name` step is checked against `ORG.name` when in scope (out-of-scope count is printed); every claim holds; `atoms` steps with `from` match the engine; every generator over 300 seeds gives problems that pass `validateUnit`, have distinct options (by canonical SMILES for molecules, by text for text) and no `undefined`/`NaN` in any text; no text contains `<` followed by a letter; `coverage` keys are known task ids and every listed type exists; the guide minimums (types per unit, bank size, generator distinct-problem count ≥ 30) hold; notes word counts per language are within the guide. When all 22 unit files exist (the test checks `ORG.UNITS`), every seminar task id from `seminar-tasks.json` is covered by some unit and every lab unit lists at least 4 `LW` items.
- [ ] **Step 2: Run** with the fixture unit only (`UNIT_DIR=tests/organic/fixtures`) — PASS; with a broken copy — FAIL with readable messages naming unit, type, problem id and step.
- [ ] **Step 3: Wire the organic tests into `npm test`:** `package.json` `test` becomes `node --test tests/site/core.test.js tests/site/pages.test.js "tests/organic/*.test.js" && node tests/math/test.js 2000` (Node 26 expands the quoted glob itself, so it works under cmd.exe too). Until then, agents run their own `tests/organic/<file>.test.js` plus `npm test`.
- [ ] **Step 4: Run** `npm test` — PASS; note the run time (budget: about 60 s).
- [ ] **Step 5: Commit** `tests/organic/content.test.js tests/organic/fixtures/seminar-tasks.json package.json` — "Organic trainer: content validator; organic tests in npm test".

### Task 10: Author tools and guide

**Files:** Create `tools/organic/playground.html`, `tools/organic/playground.js`, `tools/organic/AUTHORING.md`; modify `.claude/launch.json` (add `{"name": "repo", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8001"], "port": 8001}`).

- [ ] **Step 1:** `playground.html?unit=u07` (served from the repo root on port 8001, loading `../../site/organic/js/*.js`, the unit file and `../../site/organic/trainer.css`) shows: every molecule of the unit with atom numbers and its quality numbers; every bank problem and 5 seeds of every generator, rendered with the trainer's own renderer, answers revealed; a list of validator errors at the top. `?unit=fixture` loads `tests/organic/fixtures/unit-a.js`.
- [ ] **Step 2:** `AUTHORING.md`: the content format (copy the interfaces from this plan), the content rules from the spec, how to read the PDFs (Read tool, `pages`, ≤ 20 pages per call), the seminar-task → unit assignment (below), how to run `UNIT=u07 node --test tests/organic/content.test.js`, how to use `atoms.js` and the playground, the style of a good problem (a real decision, plausible wrong options, a "why" that teaches), Lithuanian terminology notes from lecture 1, and three complete example problems (one generated, one bank, one mechanism).
- [ ] **Step 3: Check** the playground in the browser with the fixture unit; commit — "Organic trainer: author tools and guide".

Seminar task assignment (also in `AUTHORING.md`): S1 all → u01. S2.1–6, 9 → u02; S2.7, 8, 10–15 → u03; S2.16–23 → u04. S3 all → u05. S4.1, 2, 10, 11 → u06; S4.3–6, 12–14 → u07; S4.7, 15, 16 → u08; S4.8, 9, 17–22 → u09. S5.1, 2, 8, 9, 11 → u10; S5.3, 4, 7, 12, 15, 16 → u11; S5.5, 6, 10, 13, 14, 17–20 → u12. S6.1–6, 9–14 → u13; S6.7, 8, 15–23 → u14. S7.1–12 → u15; S7.13–16 → u16.

### Task 11: Pilot unit u07 (Alkenai ir AE reakcijos)

**Files:** Create `site/organic/units/u07.js`.
- [ ] **Step 1:** Read lecture 7 (all pages, as images), seminar 4 (tasks for u07 and their neighbours), `AUTHORING.md`.
- [ ] **Step 2:** Write the notes (structure and nomenclature recap, cis/trans, AE mechanism with carbocation and curved arrows, Markovnikov's rule and its reason, the EWG exception of S4.13, X₂, H₂O/H⁺, H₂, KMnO₄ mild/harsh, tests for C=C (Br₂ water, KMnO₄), polymerisation if the lecture has it, summary) and at least 10 exercise types covering S4.3–6, 12–14, with generators for HX / H₂O / X₂ / KMnO₄ products and a mechanism type (tap the carbon protonated → choose the cation → choose the product → name the mechanism symbol).
- [ ] **Step 3: Run** `UNIT=u07 node --test tests/organic/content.test.js` and `npm test` — PASS. Look at it in the playground and in the trainer.
- [ ] **Step 4: Commit** — "Organic trainer: unit 7, alkenes (pilot)".

**Checkpoint (main session):** independent review of u07 (chemistry, both languages, drawing, problem quality); fix; update `AUTHORING.md` with what the pilot taught. Only then start Phase 3.

## Phase 3 — content

### Task 12: Lecture units

Order: groups E, F, G first (Part II), then A, B, C, D (Part I), then H and I (units 13–16; u14–u16 use their slides if they are in the folder by then, otherwise `lectureMissing: true`), then Task 13 (labs). One agent per group, groups of one wave in parallel, each following `AUTHORING.md` and the pilot u07 as the model. Each agent: reads its lectures (as images) and seminar sheets; writes notes and exercise types; covers its assigned seminar tasks; runs `UNIT=<id> node --test tests/organic/content.test.js` for each of its units and `npm test`; commits each unit separately ("Organic trainer: unit N, <title>").

| Group | Units | Sources |
|---|---|---|
| A | u01 | L1, S1 (naming generators use `ORG.name`; formula, class, carbon-class generators) |
| B | u02, u03 | L2, L3, S2 |
| C | u04 | L4, S2 (pKa table as data with sources) |
| D | u05 | L5, S3 (generators from `ORG.stereo`; Fischer, Newman, chair views) |
| E | u06, u08 | L6, L8, S4 |
| F | u09, u10 | L9, L10, S4, S5 |
| G | u11, u12 | L11, L12, S5 |
| H | u13, u14 | L13, S6, course description (u14 `lectureMissing: true`) |
| I | u15, u16 | S7, course description (`lectureMissing: true`) |

### Task 13: Lab units

| Group | Units | Sources |
|---|---|---|
| J | l1, l2, l3 | lab texts 1–3 |
| K | l4, l5, l6 | lab texts 4–6, lab 6 explanations |

Lab units: notes on the method (purpose, principle, apparatus, procedure in order, what each step is for, observations and what they mean, safety), the lab's reactions drawn, and exercise types: order the steps, why this step, what you would observe, which observation proves what, calculations (yield %, Rf, melting-point purity) with generators, apparatus identification by description, and the defence questions found in the lab text. Coverage lists every experiment and every question in the lab text as `LW<n>.<k>`.

## Phase 4 — review and finish

### Task 14: Reviews and fixes

- [ ] For each group A–K: a fresh reviewer (not the author) reads the sources and the unit files, renders them in the playground, and reports findings in four classes: wrong chemistry, wrong or unnatural Lithuanian, wrong or unnatural English, weak problems (no real decision, implausible options, "why" that does not teach), plus any copied text and any uncovered task. A Sonnet agent fixes every finding; the reviewer re-checks.
- [ ] Write `site/organic/README.md` (what the trainer covers, files, how a unit is written — pointing to `tools/organic/AUTHORING.md` — and the test command).
- [ ] Commit fixes per unit.

### Releases (owner's decision, 2026-11-21)

- **Release 1 (before 21 Dec):** Phases 1–2, units u06–u13, and u14–u16 whose slides are in the folder; labs and u01–u05 are `ready: false`. Task 15 runs for this release first.
- **Follow-ups:** each of u14–u16 that missed release 1, as its own pull request when its slides arrive.
- **Release 2:** u01–u05 and l1–l6; Task 15 again.

`units.js` keeps all 22 units with a `ready` flag; only ready units are shown, and `content.test.js` requires a unit file for every ready unit and `ready: true` for every unit file present.

### Task 15: Integration check and pull request

- [ ] `npm test` passes; record the run time.
- [ ] Browser check (main session) at 1280 px and 375 px, light and dark: home lists 22 units in 3 groups; one unit from each group: notes render, every answer kind works by mouse and keyboard, language switch mid-problem keeps the problem, progress survives a reload, exam mt2 scores and shows the pass note, review mode works; a unit file renamed to fail shows the error message; no console errors, no CSP violations. Root home page and 404 list the trainer; the switcher navigates only on activation.
- [ ] Push `organic-trainer` and open a pull request to `main` with a summary, the test result and screenshots. Do not merge: the owner decides.
