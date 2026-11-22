# Author guide: organic chemistry trainer units

You write one unit file (`site/organic/units/uNN.js` or `lN.js`) for the trainer at beagle.lt/organic/. This guide is everything you need. Read sections 1 to 5 fully before you start; use 6 to 12 as reference. The three complete examples are in section 11.

A good unit teaches (notes), drills (exercise types with generators or banks) and explains (hint, worked solution, "why"). The chemistry must be right: wrong chemistry shown as right is worse than a missing topic.

## 1. Workflow

1. Read your sources (section 3): lecture slide images, the seminar sheet, the textbook pages.
2. Write notes and exercise types (sections 4 to 9). Keep every SMILES and fact that a program can compute in the form the tests check (section 6).
3. Look at your work in the playground (section 2) after every few additions. Fix every message in its error list and look at every drawing.
4. Run the validator for your unit only: `UNIT=u07 node --test tests/organic/content.test.js` (from the repo root). It must pass with no errors. Guide minimums (words, types, bank size, distinct generator problems) are errors in real unit files.
5. Run `npm test`. The organic engine tests are run with `node --test tests/organic/` (not yet part of `npm test`). Never run the full `content.test.js` without `UNIT=`: before integration it fails by design with "unit file exists but is not marked ready".
6. Do not mark the unit ready and do not touch `site/organic/js/units.js`: the main session flips `ready` in its integration step after the unit is reviewed. Until then the unit is not shown on the site (the playground and the validator still load it).
7. Commit only your own files: `git add site/organic/units/u07.js`, never `git add -A` (other agents work in the same checkout). The commit message ends with the `Co-Authored-By` line your task gives. Work on branch `organic-trainer`; do not push.

Edit nothing else. If the engine, namer or a reaction rule is wrong or missing, say so in your report (with the SMILES and the expected result) and write around it; do not edit `site/organic/js/*.js` .

## 2. Tools

**Atom numbers.** `node tools/organic/atoms.js "CC(=O)O"` prints one line per atom: index, element, H count, neighbours, hybridisation, carbon class, then the formula. Atom numbers in the unit file are the 0-based positions of atoms in the SMILES string (hydrogens are not counted): in `CC(=O)O` the atoms are 0 C, 1 C, 2 O (=O), 3 O. The drawer's own labels (`opts.numbers`, tap-target names such as "C2") count from 1: the label 3 is index 2. When a problem text says "atom no. 3" it means the label, so write `index + 1` in the text and `index` in `answer`. Never read atom numbers from a canonical SMILES (`chem.canonical` starts elsewhere); always use the SMILES you wrote.

**Playground.** Start the server once (the preview tool, configuration `repo`, or `python -m http.server 8001` from the repo root) and open

    http://localhost:8001/tools/organic/playground.html?unit=u07

Options: `&lang=en` (English), `&seeds=5` (generator seeds shown, default 5, up to 40), `&theme=dark`. `?unit=fixture` shows the sample unit in `tests/organic/fixtures/unit-a.js`. The page shows, top to bottom: (1) problems found: validator errors, stored answers that do not check as right, duplicate options, SMILES that do not parse, drawings that are not clean; (2) every molecule of the unit twice, once with SMILES indices (from 0, for your `answer` lists) and once with the learner's numbers (from 1), with the drawer's quality numbers, formula, class, groups, stereocentres, the namer's LT and EN names (or "outside the namer's scope"), and an atom table; (3) every notes section drawn by the trainer's own code, worked examples fully open; (4) every bank problem and the chosen number of seeds of every generator with answers revealed (right options marked, hint and solution open). Open it in light and dark theme and at a narrow width. Look at the pictures: a molecule that looks wrong is wrong even when the tests pass.

**Validator.** `UNIT=u07 node --test tests/organic/content.test.js`. It checks structure, both languages everywhere, every claim (section 6), molecule drawing quality, names against the namer, atom answers against the engine, generators over 300 seeds (no throw, valid, deterministic, at least 30 distinct problems, fast), coverage of every task your types mirror, and the guide minimums. `UNIT_DIR=<folder> node --test tests/organic/content.test.js` checks `unit-a.js`, `unit-b.js` ... in a folder instead (the examples in section 11 pass this way).

## 3. Sources

Everything is in `C:\Users\dziug\Desktop\UNI\Organine` (read-only; never copy files, text or images into the repo). Pictures of every page, 96 dpi, are in

    C:\Users\dziug\AppData\Local\Temp\claude\2e72c334fbad91a1\44a07bdd-622e-4787-a8b6-fa8ed9f03882\scratchpad\pages\<PDF name without .pdf>\p001.png, p002.png, ...

Open them with the Read tool (the Read tool cannot render the PDFs themselves). Structures, schemes and the seminar task drawings are only in the pictures, so look at them. Folder names: `1.FORMULĖS_KLASIFIKAVIMAS_NOMENKLATŪRA`, `2.ATOMO SANDARA IR CHEMINIS RYŠYS`, `3.ATOMŲ TARPUSAVIO SĄVEIKA_ORGANINĖS REAKCIJOS IR REAGENTAI`, `4.RUGŠTYS IR BAZĖS`, `5.IZOMERIJA`, `6.ALKANAI`, `7.ALKENAI`, `8.DIENAI_ALKINAI`, `9.ARENAI`, `10.ANGLIAVANDENILIŲ HALOGENDARINIAI`, `11.ALKOHOLIAI`, `12.POLIHIDROKSILIAI ALKOHOLIAI_FENOLIAI_TIOLIAI_ETERIAI`, `13.ALDEHIDAI IR KETONAI`; seminars `1 SEMINARAS` ... `7 SEMINARAS` (2 to 3 pages each); labs `1 laboratorinis darbas. Kristalinimas`, `2 ... Distiliavimas`, `3 ... Kofeinas`, `4 ... Aspirinas`, `5 ... Maleino rugšties izomerizacija`, `6 ... Funkcinių grupių reakcijos`, and `Funkcinių grupių reakcijos (bandymų paaiškinimai)`; also `ORGANINĖ CHEMIJA GMC STUDENTAMS.INFORMACIJA` and `Organine_chemija_aprasas_2026_LT` (course description: topic list). Slide text can also be extracted with `pdftotext`, but its Lithuanian letters are damaged: use the pictures for spelling.

Read one page image per call (several calls in parallel are fine). A lecture is 20 to 70 slides: read them all.

**Lectures to textbook.** V. Jakubkienė, *Organinė chemija* (2009), PDF `C:\Users\dziug\AppData\Local\Temp\claude\2e72c334fbad91a1\44a07bdd-622e-4787-a8b6-fa8ed9f03882\scratchpad\textbook\jakubkiene-organine-chemija-2009.pdf`, text layer `...\scratchpad\textbook\jakubkiene.txt`. Reference only: never quote at length. Pages: L1 6-19, L2 19-26, L3 26-32, L4 32-38, L5 38-51, L6 51-54, L7 54-58, L8 58-61, L9 61-66, L10 66-71, L11 71-74, L12 75-80, L13 80-87, L14 87-96, L15 96-103, L16 139-146 (as `T p63`). English facts follow Klein, *Organic Chemistry* (cite `Klein`).

**Lectures 14 to 16** are missing from the folder until the owner adds them. If the slides are there, use them like any lecture. If not, write the unit from seminar sheets 6 and 7, the course description's topic list and Klein, at the level and style of the lectures that exist, and set `lectureMissing: true` in the unit.

**Seminar tasks to units.** Every task of your seminar sheet listed for your unit must be covered by at least one exercise type that lists it in `mirrors`, and by `coverage`:

| Unit | Seminar tasks |
|---|---|
| u01 | S1 all |
| u02 | S2.1-6, 9 |
| u03 | S2.7, 8, 10-15 |
| u04 | S2.16-23 |
| u05 | S3 all |
| u06 | S4.1, 2, 10, 11 |
| u07 | S4.3-6, 12-14 |
| u08 | S4.7, 15, 16 |
| u09 | S4.8, 9, 17-22 |
| u10 | S5.1, 2, 8, 9, 11 |
| u11 | S5.3, 4, 7, 12, 15, 16 |
| u12 | S5.5, 6, 10, 13, 14, 17-20 |
| u13 | S6.1-6, 9-14 |
| u14 | S6.7, 8, 15-23 |
| u15 | S7.1-12 |
| u16 | S7.13-16 |
| l1 to l6 | every experiment or question of the lab text, numbered by you as `LW1.1`, `LW1.2`, ... (at least 4 per lab unit) |

Task ids that exist: `S1.1-15`, `S2.1-23`, `S3.1-21`, `S4.1-22`, `S5.1-20`, `S6.1-23`, `S7.1-16`, `LWn.k`. Lecture sources of units: u01 to u13 = lectures 1 to 13 (folder names above); u14 to u16 see above; l1 to l6 = lab texts.

## 4. Content rules

- **Own words.** Same compounds and reactions, but no sentence, task text or table copied from slides, seminar sheets, lab texts or the textbook. Rephrase every task; change the compounds or numbers when you can. No images from the PDFs. Chemistry facts are free.
- **No staff names**, anywhere.
- **Sources.** Every claim that the tests cannot check carries `src` (on the block, or on the problem): `'L7 p9'` (lecture 7, slide 9), `'S4.3'` (seminar 4, task 3), `'LW3 p2'` (lab 3, page 2), `'T p63'` (textbook page 63), `'Klein'`. A reviewer opens that page to check you.
- **Check what a program can check** (section 6) and write it as a claim, an engine-computed answer (`from`), a namer-supplied name (`answer: {smi}`), or a generator computed with `ORG.react`.
- **Two languages, always.** Every text is `{lt, en}`. Lithuanian is the default. Language never changes an answer. The two texts must be real translations, not the same words twice (an identical LT and EN text with two or more words is rejected; write formulas and proper names such as named reactions inside `$...$`, or give each language its own form).
- **Course Lithuanian terms** (section 9); English as in Klein.
- **Teach reasoning,** not recall (section 8): the learner decides something in every problem.
- **Length.** Notes: 800 to 2000 words per language for a lecture unit, 400 to 1000 for a lab unit. At least 8 exercise types per lecture unit (5 per lab unit); a bank type has at least 8 problems; a generator must give at least 30 distinct problems in 300 seeds. The validator enforces these.
- **No HTML** in any text: markup is only what section 5 lists. A `<` followed by a letter is rejected.
- Never put a real name, address, account or tracking in the file. The file is public.

## 5. File format

A unit file calls `ORG.unit(Unit)` once, inside the wrapper of the example (section 11.1). Plain JavaScript, no imports.

**Text `T`** = `{lt: string, en: string}`. Markup inside a string: `**bold**`, `*italic*`, `$formula$`. In a formula, a digit run after a letter or `)` becomes a subscript (`$CH3CH2OH$`, `$Ca(OH)2$`); a trailing `+`, `-`, `2+`, `2-` or `•` becomes a superscript (`$H+$`, `$OH-$`, `$NH4+$`, `$CH3•$`); `^...^` forces a superscript, and is required for a charge after a digit: `$Ca^2+^$`, `$SO4^2-^$`. Use the real minus `−` in plain text. Greek letters and symbols are typed directly (`σ`, `π`, `δ+`, `→`, `⇌`). `$` alone and `<` are plain text.

**Molecule** `Mol = {smi, name?: T, caption?: T, opts?: DrawOpts}`. `smi` is SMILES: organic subset B C N O P S F Cl Br I, aromatic `c n o s`, brackets with H count and charge (`[NH4+]`, `[O-]`, `[CH3+]`, `[Br-]`, `[Cl]` for a radical), bonds `- = # :`, branches, ring closures (`%10` too), stereo `@ @@ / \`, ions separated by a dot (`CC(=O)[O-].[Na+]`). `name`, when given, is checked against the namer (systematic name, its alternatives or the course trivial name; names outside the namer's scope are not checked). `DrawOpts`:

| option | meaning |
|---|---|
| `rotate` (degrees), `flip` `'x'`/`'y'` | turn the picture to avoid clashes |
| `numbers` | `'all'`, `[idx...]` or `{idx: 'text'}`: atom labels (the labels of `'all'` and of an index list show index + 1) |
| `lonePairs` | `true` or `[idx...]`: lone pair dots |
| `allH` | draw every H (needed for an arrow into a reagent's H) |
| `condensed` | condensed formula style (`ctx.draw.condensed(mol)` in a generator returns plain ASCII such as `CH3CH(OH)CH2CHO`: wrap it in `$...$` before putting it in a text) |
| `highlight` | `{atoms: [idx], bonds: [[i,j]], tone: 1..4}` |
| `deltas` | `{idx: '+' or '-'}` draws δ+ / δ− |
| `circle` | benzene drawn with a circle |
| `coords` | `[[x,y], ...]` in bond-length units, y down: required for bridged and cage systems (norbornane, camphor, adamantane), whose automatic layout overlaps |
| `maxWidth` | pixel limit |

Drawing quality is tested (no overlaps, crossings, label clashes); the playground shows the numbers. Fix a bad drawing with `rotate`, `flip`, `allH`, `condensed` or `coords`. Common reagents are drawn with conventional labels: `Br` is HBr, `O` is H2O, `N` is NH3, `[Br-]` bromide; radicals show a dot.

**Block** (exactly one content key; may add `src`, and `caption` where it makes sense):

| key | value |
|---|---|
| `{h: T}` | sub-heading |
| `{p: T}` | paragraph |
| `{list: T[], ordered?: boolean}` | list |
| `{rule: T}` | boxed key rule |
| `{pitfall: T}` | boxed common mistake |
| `{mol: Mol \| Mol[], caption?: T}` | one or several molecules in a row (a molecule's `name` or `caption` prints under it) |
| `{scheme: Scheme, caption?: T}` | reaction scheme |
| `{mech: MechStep[], caption?: T}` | mechanism steps with curved arrows |
| `{resonance: Mol[], caption?: T}` | resonance structures joined by ↔ |
| `{fischer: spec}` | `{smi, top: atomIdx, bottom: atomIdx}` (acyclic chains only) or `{rows: [{left, right}], top, bottom}` (with `rows`, `top` and `bottom` are labels, T or string, for the end groups, not atom indices) |
| `{newman: spec}` | `{front: [s,s,s], back: [s,s,s], angle}` |
| `{chair: spec}` | `{subs: [{pos: 1..6, ax: boolean, label}], flip?}` |
| `{table: {head: T[], rows: (T \| Mol)[][]}}` | table; every row as long as `head` |
| `{example: {q: Block[], steps: Block[][]}}` | worked example: the question, then steps revealed one at a time |
| `{practice: typeId}` | button "practise this type"; the id must exist in this unit |

**Scheme** `{items: (Mol | {plus: true} | {arrow: '→'|'⇌'|'↔', above?: T|string, below?: T|string})[], maxWidth?}`. Reagents and conditions go in `above` / `below` of the arrow. Schemes wrap on a phone.

**MechStep** `{scheme, arrows: [{from: Ref, to: Ref, half?: true}], note?: T}`. `Ref` = `{m: k, a: i}` (atom i of the k-th molecule of the scheme; `m` counts molecules only, not plus signs or arrows) | `{m: k, lp: i}` (a lone pair on atom i) | `{m: k, b: [i, j]}` (the bond i-j) | `{m: k, mid: [i, j]}` (a point between two atoms, for a bond being formed). To end an arrow on a reagent's hydrogen, give that molecule `opts: {allH: true}` and use `a: 'H0'` (first H drawn on atom 0) and bonds like `b: [0, 'H0']`. `half: true` draws a single-electron (fish-hook) arrow, for SR. Lone pairs need `opts: {lonePairs: true}` on that molecule.

**Unit**

    { id: 'u07',
      lectureMissing?: true,            // only for u14-u16 without slides
      notes: Section[],                 // Section = {id, title: T, blocks: Block[]}, ids unique
      summary: Block[],                 // the cheat sheet, one screen
      types: ExType[],
      coverage: { 'S4.3': ['u07.hx'], ... } }   // every task of your unit -> the types that cover it

**ExType** `{id: 'u07.hx', title: T, mirrors: ['S4.3', ...], gen?: function, bank?: Problem[]}`. The id starts with the unit id and a dot. A type has `gen`, `bank` or both. **Every task in `mirrors` must exist (section 3 list) and must appear in `coverage` with this type**; the validator checks both. The reverse is not checked, so keep `coverage` honest yourself: list a type under a task only when it really trains that task.

**Problem** `{id?, q: Block[], steps: Step[], why: T | Block[], src?, claims?: Claim[]}`. Bank problems need an `id` that starts with the type id and a dot and is unique (`u07.mech.3`). Generated problems need none.

**Step** `{prompt: T, kind, options?, answer?, mol?, bonds?, from?, hint: T, solution: T | Block[]}`:

| kind | learner does | `answer` (and other fields) |
|---|---|---|
| `choice` | picks one option | the option's index in `options` (2 to 12 options) |
| `multi` | picks every right option | array of right indices |
| `atoms` | taps atoms on `mol` | array of atom indices; with `bonds: true` an array of `[i, j]` pairs; or leave out `answer` and set `from` to `'stereocentres'`, `'carbon:1'` ... `'carbon:4'`, `'hyb:sp'`, `'hyb:sp2'`, `'hyb:sp3'`, `'conjugated'`, `'aromatic'` and the engine computes it |
| `order` | sorts 3 to 6 items | no `answer`: **write `options` in the right order**; the trainer shuffles them |
| `number` | types a number (comma or dot) | `{value, tol}` |
| `name` | types a name | `{lt: [..], en: [..]}` (first is shown) or `{smi}` (the namer supplies every name; the molecule must be in its scope); `mol` shows the structure |
| `formula` | types a formula | string `'C5H12'`; **always give `mol`** (the validator checks the formula against it; without `mol` it can check only when the statement has exactly one molecule) |
| `match` | pairs left items with right items | `{left: Option[], right: Option[], pairs: number[]}`: `pairs[i]` is the right index for left item `i` |

`Option` = `{text: T}` | `{mol: Mol}` | `{scheme: Scheme}`. In `choice`, `multi` and `match` the options are shuffled when shown, so write the right one anywhere and give its index. `solution` is a T or a Block list (use blocks to show a worked mechanism or a drawn product). Names in a `name` step: `answer.lt` / `answer.en` (or `answer: {smi}`) hold only names the namer can produce (its main name, alternatives, the course trivial name). A correct course spelling the namer does not produce goes **only** in `answer.extra: {lt: [..], en: [..], src: 'L1 p40'}`, with a `src`; extras are accepted from the learner and are listed for review. It works with both answer forms:

    answer: { smi: 'CC(=O)O', extra: { lt: ['acetilo rūgštis'], en: [], src: 'L1 p40' } }
    answer: { lt: ['etanolis'], en: ['ethanol'], extra: { lt: ['etilo alkoholis'], en: ['ethyl alcohol'], src: 'L11 p3' } }

Names are compared without case, spaces, dashes or brackets, and without Lithuanian letters (accepted with the correct spelling shown): `N-metiletanaminas` equals `N metil etanaminas`; commas and locants still matter.

**Claim** (checked by the validator; put them on the problem, `claims: [...]`): `{formula: [smi, 'C5H12']}`, `{name: [smi, T]}`, `{cip: [smi, i, 'R'|'S']}`, `{ez: [smi, i, j, 'E'|'Z']}`, `{centres: [smi, [i...]]}`, `{stereoisomers: [smi, n]}`, `{isomers: [formula, n, filter?]}`, `{hyb: [smi, i, 'sp2']}`, `{carbon: [smi, i, 1..4]}`, `{sigmaPi: [smi, sigma, pi]}`, `{aromatic: [smi, true|false]}`, `{react: [ruleId, [smi...], opts|null, majorSmi]}`, `{same: [smi, smi]}`, `{chiral: [smi, true|false]}`.

**Generator** `gen(rng, ctx) -> Problem`, called with a seed: the same seed must always give the same problem. Use only `rng()` and `ctx` for randomness (`ctx.pick(arr)`, `ctx.shuffle(arr)`, `ctx.int(lo, hi)`), never `Math.random`. `ctx` also holds the engines: `chem, stereo, name, react, draw`. See section 11.2.

## 6. What the tests check, and how to use the engine

Write every computable fact so that a program checks it:

- Formula, name (within the namer's scope), chirality, R/S, E/Z, number of stereoisomers or isomers, product of a rule-covered reaction, hybridisation, carbon class, aromaticity: write a claim, or compute it in a generator, or use `from` / `answer: {smi}`.
- Molecule `name` fields and `claims.name` are compared with `ORG.name.name` in both languages. Use the systematic name there (`etano rūgštis` / `ethanoic acid`); the course trivial name (`acto rūgštis` / `acetic acid`) is accepted too.

Facts about the engine (verified in reviews):

- **Stereo SMILES.** Always check a stereo SMILES with a `cip` claim before using it. Correct ones: L-alanine `C[C@H](N)C(=O)O` (S); L-serine `OC[C@H](N)C(=O)O` (S); L-cysteine `SC[C@H](N)C(=O)O` (R); (R)-carvone `CC1=CC[C@H](CC1=O)C(C)=C`; D-glyceraldehyde `OC[C@@H](O)C=O` (R). Ephedrine `CNC(C)C(O)c1ccccc1` has centres at atoms 2 and 4; menthol `CC(C)C1CCC(C)CC1O` at 3, 6, 9.
- **Chiral centre** (chiralinis centras) = an atom with four constitutionally different substituents (`ORG.stereo.stereocentres`). 1,4-disubstituted cyclohexanes have none (cis/trans still exist). Do not write R/S claims for inositol-type ring carbons or pseudoasymmetric centres (`cip` returns null).
- `isMeso` means achiral with at least 2 chiral centres. Do not call cis-1,4-dimethylcyclohexane meso.
- **Isomer counts:** only with a group filter (`alcohol`, `ether`, `amine1`, `ester`, `acid`, `aldehyde`, `ketone`, `alkene`, ...), never `any` for formulas with N or O. `isomers` drops enols, peroxides, gem-diols, hemiacetals, hemiaminals, imidic acids and aminals. `ORG.stereo.isomers` counts acyclic isomers by default (C4H8 gives 3 alkenes); with `{rings: true}` rings count too (C4H8 gives 5). The `isomers` claim takes an optional 4th element for this: `{isomers: ['C4H8', 5, null, {rings: true}]}`. State in the question whether rings count, and make the claim match. Up to 8 heavy atoms.
- **Carbon class** (primary ... quaternary) is meant for sp3 carbons; the carbon of methanol or a methyl halide is class 0 ("metilo").
- **Hybridisation.** A lone-pair atom next to a π system is sp2 (amide N, aniline N, phenol O, ester alkoxy O). Ask hybridisation mainly about C atoms, and about heteroatoms only when the course states the answer.
- **Aromaticity.** Do not write claims or questions about 2-pyridone, uracil, coumarin, tropone (model dependent). Do for benzene, naphthalene, pyrrole, furan, thiophene, pyridine, pyrimidine, imidazole, indole, purine, the cyclopentadienyl anion, the tropylium cation.
- **Unsaturation** is null for ions and radicals.
- **Cation and radical stability** (course order, L7 p9, L6 p16): benzyl > allyl > tertiary > secondary > primary > methyl.
- **Reactions.** `ORG.react.run(rule, [smi...], opts)` returns `{products: [{smi, major, by?}], none?, note?, mech?}`. `major: true` marks the course's main product(s); `by: true` marks an observable by-product (N2, H2, Ag, NH4Cl ...); `none: true` means no reaction. Mixtures that the course treats as comparable (o/p, 1,2/1,4) mark every member major: **a generator that needs one answer must require exactly one major product**. Use the result's `mech` for the mechanism symbol (E1/E2, AE/AR, SN1/SN2), not the rule's default. Generators skip substrates where `ORG.react.wouldRearrange(smi)` is true (a hydride or alkyl shift would change the textbook product). The options a rule takes are in the rule's definition in `site/organic/js/react.js` (`X: 'Cl'|'Br'|'I'`, `eq`, `base`, `reagent: 'PCC'|'chromic'`, `metal`, `excess`, `medium`, `stage`, `nu`, ...); read it. Rule ids: `sr.halogenate ae.hx ae.h2o ae.x2 ae.h2 ox.kmno4.mild ox.kmno4.harsh diene.hx yne.h2 yne.x2 yne.hx yne.hydration yne.cu sear side.br side.ox sn2 sn1 elim alc.hx alc.ox alc.na williamson ether.hi phenol.base phenol.alkyl phenol.acyl phenol.br2 thiol.base thiol.alkyl thiol.disulfide co.nabh4 co.hcn co.hemiacetal co.acetal co.thioacetal co.oxime co.phenylhydrazone co.tollens co.cannizzaro co.aldol co.aldolcond co.enols co.iodoform acid.ester acid.salt acid.socl2 acyl.nu amine.acyl ester.hydrolysis claisen lactone amine.protonate amine.alkyl amine.hno2 diazo.sub nitro.reduce nitrile.hydrolysis`. `ORG.react.RULES[id].title` and `.mech` describe each.
- **Names in generated text.** Lithuanian inflects names ("2-metil-2-butenui"), and no program can do that. Show the molecule drawn, or name it only in the nominative (a label, a list). Do not splice namer output into a sentence that needs another case. Neutral splices (atom numbers, "tretinis", "antrinis") are fine.
- **Atom labels.** `opts.numbers` labels are 1-based. A problem text that says "C3" or "atom no. 3" refers to the label: SMILES index 2.
- Views: Fischer from SMILES works for acyclic chains only (otherwise `rows`); `Ref.m` counts molecule items only.

## 7. Notes

Notes teach the topic to a first-year GMC student reading alone, often the week before a test. Structure each lecture unit as 5 to 9 sections (`id` short and unique, title in both languages). In each section:

1. a `{h}` or the section title, then a short paragraph that says why the topic matters or what question it answers;
2. the rule or definition in a `{rule}` box;
3. **every reaction or structure you state, drawn** (`{scheme}`, `{mol}`, `{mech}`, `{resonance}`); a section that states a reaction without drawing it is incomplete;
4. a `{pitfall}` box where learners usually go wrong;
5. a `{example}` (worked example: question, then 3 to 6 steps that show the reasoning, each step a short list of blocks);
6. a `{practice: typeId}` button at the end of the section that leads into the matching exercise type.

End the notes with `summary`: the cheat sheet of the unit on one screen (a table of reactions or rules, a `{list}`). Put reagents and conditions above or below the arrow. Cite `src` on blocks that state course-specific rules, values or conventions. Prefer short paragraphs (2 to 4 sentences), tables for comparisons (acidity, reactivity series, directing effects), and one idea per block. Teach the mechanism and the reason (stability of the intermediate, polarity, sterics), not only the result. Cover everything the lecture covers and everything your seminar tasks need; add Klein's standard explanation where the slides are terse. Lab units: aim, principle, apparatus and procedure steps, what is observed and why, safety, calculations (yield, Rf), typical mistakes.

Length: 800 to 2000 words per language (400 to 1000 for a lab unit), counted over all notes text. Write both languages as you go; do not translate mechanically (section 9).

## 8. What makes a good problem

The problem makes the learner **decide** something a student must be able to decide on the exam: which atom, which product, which order, which reason. A fact lookup ("What is the formula of ethanol?") is not a problem; "Which of these products forms and why?" is.

- **Wrong options are plausible mistakes**, never filler. Build them from the typical errors: the anti-Markovnikov product; the wrong numbering direction; the wrong main chain; the over-oxidised product (acid instead of aldehyde, ketone cleaved); the product of a different reagent (X2 instead of HX, H2 instead of HX); the wrong ring position (ortho/para vs meta); the other enantiomer or the wrong E/Z isomer; the rearranged or unrearranged cation; the reverse order of acidity or reactivity; an elimination instead of a substitution. Two or more of these per `choice` of 4 options. Options must be distinct (the validator rejects duplicates, including two spellings of the same structure).
- **Several steps** when the reasoning has stages: tap the atom, pick the intermediate, pick the product, name the mechanism symbol. Each step a separate decision; never reveal the answer of a later step in an earlier prompt or hint.
- **The `why`** teaches the idea in 2 to 5 sentences: the principle and its reason, not a restatement of the answer. It is shown after the last step.
- **Hints nudge, they do not give the answer.** A hint names the concept or the question to ask ("which carbon carries more hydrogens?", "draw the anion and count resonance structures"), never the answer.
- **Worked solutions show the reasoning**, step by step: what you look at, what rule applies, what follows. Use a Block list with a drawn product or a mechanism when it helps. Never write only "Answer: b".
- A step shows its molecule via `mol` or the statement; do not make the learner count unlabelled atoms: use `opts.numbers: 'all'` on atom-tapping steps.
- Put the right option anywhere (it is shuffled), but remember `order` options are written in the right order.
- Variety within a type: different compounds, substituents, ring sizes, halogens, reagents; a generator must produce at least 30 distinct problems.
- Cover every task of your seminar sheet; a type mirrors the tasks it is modelled on (`mirrors`), and `coverage` lists, for every task, the types that cover it.
- Where a program can compute the answer, write a **generator** (products of rule-covered reactions, classification, counting, atom tapping with `from`, names with `{smi}`). Where it cannot (mechanism reasoning, comparisons with reasons, reagent choice, multi-step schemes, tests for groups), write a **bank** of at least 8 hand-written problems. Typical split: u01 to u05 generated classification, counting, naming; bank for reasons. u06 to u16 generators for products of reactions; banks for mechanisms, reagent choice, comparisons, multi-step schemes ("fill in A to E"), tests for functional groups. Labs: banks (method, apparatus, observations, why each step, safety) and small generators (yield %, Rf, melting-point judgements as `number` steps).
- A generator checks its own assumptions and `continue`s to the next candidate (or throws an Error after many failures) instead of returning a doubtful problem. 300 seeds are run on every build, in a fixed time limit (10 s per type).

## 9. Lithuanian and English

Write natural academic Lithuanian, as a lecturer would: full sentences, correct cases, no word-for-word English. Read each text aloud in your head. Prefer the course's own term over a "better" one. Where the course uses two terms, both are acceptable; task prompts follow the wording of the seminar sheets. Terms the course uses (spelling from the slides; check a slide when unsure):

| Lithuanian (course, slide) | English (Klein) |
|---|---|
| pakaitas (L3 p2); nukleofilinio pakeitimo reakcijos (L10 p14) | substituent; substitution |
| funkcinė grupė (L1 p23) | functional group |
| karbokatijonas, tarpinis karbokatijonas; benzil-, alil-, tretinis, antrinis, pirminis, metil- (L7 p9) | carbocation, intermediate; benzylic, allylic, tertiary, secondary, primary, methyl |
| nukleofilas, nukleofilinis; elektrofilas, elektrofilinis; heterolizinių reakcijų reagentai (L3 p23) | nucleophile; electrophile; reagents of heterolytic reactions |
| radikalas, radikalinis (L6 p5) | radical |
| jungimasis, jungimosi reakcijos (L7 p4); H prijungimas (L7 p20); prijungimas, vandens prijungimas (L7 p19); prijungimo reakcija (S4.5); nukleofilinis prijungimas (L13 p4, S6.1); aldolinis prisijungimas (S6.6) | addition (S6.7 is "nukleofilinio acilpakeitimo": substitution) |
| eliminavimas, eliminavimo produktai (L10 p14); *atskilimas* only for loss of H+ from the arenium ion (L9 p10) | elimination |
| nueinančioji grupė (L10 p3) | leaving group |
| tirpiklis; poliniai protoniniai / aprotoniniai tirpikliai (L10 p10) | solvent; polar protic / aprotic |
| reagentas (L3 p23); reakcijos mechanizmas (L3) | reagent; mechanism |
| indukcijos efektas, +I, -I (L3 p3); mezomerijos efektas, +M, -M (L3 p10) | inductive effect; resonance (mesomeric) effect |
| konjugacija (L3 p6); hiperkonjugacija (L7 p9); rezonansinės formulės (L4 p17) | conjugation; hyperconjugation; resonance structures |
| rūgštingumas, bazingumas, Brionstedo rūgštys ir bazės (L4 p2); konjuguotoji bazė / rūgštis (L4 p6); pKa (L4 p9) | acidity, basicity, Brønsted acids and bases; conjugate base / acid; pKa |
| chiralinis centras (L5 p33; S3.3, S3.4, S3.11, S3.12) / chiralinis atomas (L5 p17, prochirality slide); chiralinė molekulė (L5 p17); enantiomerai, racematas (L5 p19); diastereomerai (L5 p33) | chiral centre (stereocentre), chiral molecule; enantiomers, racemate; diastereomers |
| Markovnikovo taisyklė (L7 p13); Zaicevo taisyklė (L10 p20) | Markovnikov's rule; Zaitsev's rule |
| orientantai (L9 p24); aktyvuojantys ir deaktyvuojantys aromatinių žiedų pakaitai (L9 p28) | directing groups; activating and deactivating substituents |
| oksidacija, redukcija (L3 p40); oksidavimas (L8 p15), oksidavimasis (L12 p27); hidrinimas (L7 p20); halogeninimas (L6 p7); hidratacija (L7 p19); dehidratacija (L11 p11) | oxidation, reduction; hydrogenation; halogenation; hydration; dehydration |

*Oksidacija* is the concept, *oksidavimas* the process; both are fine. In task prompts use *chiralinis centras*, the wording students see on the seminar sheets, and the seminar wording for addition (*prijungimo reakcija*, *nukleofilinio prijungimo*). Where the slides and textbook differ, use the slides. Check a page image when you use a term not in this table.

Mechanism symbols are written exactly: **SR, AE, AN, SEAr, SN1, SN2, E1, E2** (same in both languages). Prefixes in names: chlor-, brom-, jod-, fluor-, hidroksi-, okso-, formil-, amino-, nitro-, metoksi-. Lithuanian name style: locant before the parent: `2-metil-2-butenas`, `1-propanolis`, `pentano rūgštis`, `etilbutanoatas`, `N-metiletanaminas`, `benzenkarboksirūgštis`, `3-metil-5-heksin-2-olis`. Chain choice in the course: most principal groups, then most C=C and C≡C, then longest, then most prefix substituents. English: standard IUPAC as in Klein (`2-methylbut-2-ene`; the older `2-methyl-2-butene` is accepted by the namer).

Both texts of a pair say the same thing. A text that differs only by a formula or proper name may be identical, otherwise the validator rejects it.

## 10. Common mistakes (what reviewers find)

- A stereo SMILES with the wrong configuration (check with a `cip` claim).
- `answer` index lists written with the learner's labels (1-based) instead of SMILES indices (0-based), or the other way in the text.
- A generator that returns two valid answers (several `major` products) or a rearranged cation.
- A hint that gives the answer; a `why` that repeats the answer; a solution of one word.
- Wrong options that are random compounds instead of typical mistakes.
- Untranslated or machine-sounding Lithuanian; terms the course does not use.
- A reaction stated in the notes without a drawing; text copied from the slides.
- A coverage map that lists a type that does not mirror the task, or a mirrored task missing from `coverage`.
- Editing `units.js` or setting `ready`; editing files that are not yours; `git add -A`.

## 11. Three complete worked examples

Each passes `UNIT_DIR=<folder> node --test tests/organic/content.test.js` (guide minimums show only as warnings there, since an example has one problem, not eight). Task ids in the examples are placeholders: use the real tasks of your sheet. To validate a type snippet of your own the same way: paste it into the `types` array of a minimal unit (the wrapper of 11.1 is enough), give that unit a matching `coverage` for every task the type mirrors, save it as `unit-b.js` (`unit-a.js`, `unit-c.js` also work) in a scratch folder outside the repo, and run `UNIT_DIR=<that folder> node --test tests/organic/content.test.js`.

### 11.1 The minimal unit file

The whole file shape: wrapper, one note section using the common block kinds, summary, one bank type, coverage.

```js
// site/organic/units/u07.js: the smallest complete unit file (a real unit has much more of everything)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });

  ORG.unit({
    id: 'u07',
    notes: [
      {
        id: 'markovnikov',
        title: t('Markovnikovo taisyklė', "Markovnikov's rule"),
        blocks: [
          { h: t('Kur jungiasi vandenilis?', 'Where does the hydrogen go?') },
          {
            p: t('Kai vandenilio halogenidas HX jungiasi prie nesimetrinio alkeno, vyksta du etapai. Pirmiausia protonas prisijungia prie vieno dvigubo ryšio anglies atomo ir susidaro karbokatijonas. Po to halogenido anijonas prisijungia prie teigiamo atomo.',
              'When a hydrogen halide HX adds to an unsymmetrical alkene, it happens in two steps. First a proton bonds to one carbon of the double bond and a carbocation forms. Then the halide anion bonds to the positive carbon.')
          },
          {
            scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }, { smi: 'CC(C)Br' }] },
            caption: t('Propenas ir HBr: pagrindinis produktas yra 2-brompropanas.', 'Propene and HBr: the main product is 2-bromopropane.'),
            src: 'L7 p9'
          },
          {
            rule: t('Markovnikovo taisyklė: vandenilis jungiasi prie dvigubo ryšio atomo, turinčio daugiau vandenilių, o halogenas – prie labiau pakeisto atomo, nes taip susidaro stabilesnis karbokatijonas.',
              "Markovnikov's rule: hydrogen goes to the double-bond carbon that has more hydrogens and the halogen to the more substituted carbon, because that gives the more stable carbocation."),
            src: 'L7 p9'
          },
          {
            example: {
              q: [{ p: t('Koks produktas susidaro 2-metilpropenui reaguojant su HCl?', 'What is the product of 2-methylpropene with HCl?') }, { mol: { smi: 'CC(C)=C' } }],
              steps: [
                [{ p: t('Vienas dvigubo ryšio atomas (CH₂) turi du vandenilius, kitas – nė vieno. Protonas jungiasi prie CH₂.', 'One double-bond carbon (CH₂) has two hydrogens, the other has none. The proton bonds to CH₂.') }],
                [{ p: t('Teigiamas krūvis lieka ant atomo su dviem metilais: susidaro tretinis karbokatijonas.', 'The positive charge stays on the carbon with two methyls: a tertiary carbocation forms.') }],
                [{ p: t('Chloridas prisijungia prie šio atomo.', 'Chloride bonds to that carbon.') }, { mol: { smi: 'CC(C)(C)Cl', name: t('2-chlor-2-metilpropanas', '2-chloro-2-methylpropane') } }]
              ]
            }
          },
          {
            pitfall: t('Nesumaišykite krypties: halogenas patenka ten, kur teigiamą krūvį geriau išlaiko aplinkiniai atomai, o ne ten, kur jau yra daugiausia vandenilių.',
              'Do not swap the direction: the halogen goes where the surrounding atoms support a positive charge best, not where most hydrogens already are.')
          },
          { practice: 'u07.mini' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      { list: [t('HX prijungimas vyksta per karbokatijoną.', 'HX addition goes through a carbocation.'), t('Stabilumas: tretinis > antrinis > pirminis.', 'Stability: tertiary > secondary > primary.')] }
    ],
    types: [
      {
        id: 'u07.mini',
        title: t('Kur prisijungia protonas?', 'Where does the proton go?'),
        mirrors: ['S4.3'],
        bank: [
          {
            id: 'u07.mini.1',
            q: [{ scheme: { items: [{ smi: 'CC=C' }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }],
            steps: [
              {
                prompt: t('Bakstelėkite atomą, kuris prisijungia $H+$.', 'Tap the carbon that receives $H+$.'),
                kind: 'atoms', mol: { smi: 'CC=C', opts: { numbers: 'all' } }, answer: [2],
                hint: t('Kuris dvigubo ryšio atomas turi daugiau vandenilių?', 'Which double-bond carbon has more hydrogens?'),
                solution: t('Atomas Nr. 3 (CH₂) turi du vandenilius, todėl jis gauna $H+$.', 'Carbon no. 3 (CH₂) has two hydrogens, so it receives $H+$.')
              },
              {
                prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
                kind: 'choice',
                options: [{ mol: { smi: 'CC(C)Br' } }, { mol: { smi: 'CCCBr' } }],
                answer: 0,
                hint: t('Bromas jungiasi prie teigiamo atomo.', 'Bromine bonds to the positive carbon.'),
                solution: t('Antrinis karbokatijonas stabilesnis už pirminį, todėl susidaro 2-brompropanas.', 'The secondary carbocation is more stable than the primary one, so 2-bromopropane forms.')
              }
            ],
            why: t('Protonas pasirenka atomą, po kurio lieka stabilesnis katijonas.', 'The proton picks the carbon that leaves the more stable cation.'),
            src: 'S4.3'
          }
        ]
      }
    ],
    coverage: { 'S4.3': ['u07.mini'] }
  });
})(globalThis.ORG = globalThis.ORG || {});
```

### 11.2 A generator: HX addition (type `u07.hx`)

A generator picks a substrate, asks the engine for the result, builds plausible wrong options, and returns a problem with three steps (tap, choose, name). Notes on what it does: it skips substrates that would rearrange; it skips substrates where the two double-bond carbons are alike (nothing to decide); it requires exactly one major product; the wrong options are the anti-Markovnikov product first, then X2 addition and hydrogenation; the right option is written first (the trainer shuffles); the name step is added only when the namer can name the product; texts contain atom numbers (index + 1) and class words, never inflected names. A type like this goes into the `types` array of a unit; with 13 substrates and 3 halogens it gives well over 30 distinct problems.

```js
{
  id: 'u07.hx',
  title: t('HX prijungimas: pagrindinis produktas', 'HX addition: the main product'),
  mirrors: ['S4.3', 'S4.4'],
  gen(rng, ctx) {
    const { chem, react, name } = ctx;
    const SUBSTRATES = ['CC=C', 'CC(C)=C', 'CCC=C', 'CCCC=C', 'CC(C)=CC', 'CCC(C)=C', 'CCC(C)=CC', 'CCC=C(C)C',
      'CCCC(C)=C', 'CC(C)CC=C', 'CC1=CCCCC1', 'CC1=CCCC1', 'CC(C)C=C'];
    const WORDS = { lt: ['pirminis', 'antrinis', 'tretinis'], en: ['primary', 'secondary', 'tertiary'] };

    // 1. choose a substrate the course rule handles with one clear answer
    let pick = null;
    for (let tries = 0; tries < 60 && !pick; tries++) {
      const smi = ctx.pick(SUBSTRATES);
      if (react.wouldRearrange(smi)) continue;                // a hydride shift would change the textbook product
      const mol = chem.parse(smi);
      const dbl = mol.bonds.find(b => b.order === 2);
      const cN = i => mol.nbr[i].filter(j => mol.atoms[j].el === 'C').length;
      if (cN(dbl.a) === cN(dbl.b)) continue;                  // both carbons alike: nothing to decide
      const [hC, xC] = cN(dbl.a) < cN(dbl.b) ? [dbl.a, dbl.b] : [dbl.b, dbl.a];
      const X = ctx.pick(['Cl', 'Br', 'I']);
      const res = react.run('ae.hx', [smi], { X });
      const majors = res.products.filter(p => p.major);
      if (majors.length !== 1) continue;                      // exactly one right answer
      pick = { smi, hC, xC, X, cls: cN(xC), major: majors[0].smi, minor: res.products.filter(p => !p.major).map(p => p.smi) };
    }
    if (!pick) throw new Error('u07.hx: no usable substrate');

    // 2. wrong options: the anti-Markovnikov product first, then the products of other additions
    const canon = s => chem.canonical(chem.parse(s), { stereo: false });
    const dihalide = react.run('ae.x2', [pick.smi], { X: pick.X }).products.find(p => p.major);
    const alkane = react.run('ae.h2', [pick.smi]).products.find(p => p.major);
    const seen = new Set([canon(pick.major)]);
    const options = [{ mol: { smi: pick.major } }];           // the right option is written first; the trainer shuffles
    for (const smi of pick.minor.concat(dihalide ? [dihalide.smi] : [], alkane ? [alkane.smi] : [])) {
      if (!seen.has(canon(smi)) && options.length < 4) { seen.add(canon(smi)); options.push({ mol: { smi } }); }
    }

    const steps = [
      {
        prompt: t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
        kind: 'atoms', mol: { smi: pick.smi, opts: { numbers: 'all' } }, answer: [pick.hC],
        hint: t('$H+$ jungiasi prie to dvigubo ryšio atomo, kuris turi daugiau vandenilių. Ant kito atomo lieka teigiamas krūvis.',
          '$H+$ bonds to the double-bond carbon that already carries more hydrogens. The other carbon is left with the positive charge.'),
        solution: t('Atomas Nr. ' + (pick.hC + 1) + ' turi daugiau vandenilių, todėl jis gauna $H+$. Teigiamas krūvis lieka ant atomo Nr. ' + (pick.xC + 1) + '.',
          'Carbon no. ' + (pick.hC + 1) + ' has more hydrogens, so it receives $H+$. The positive charge stays on carbon no. ' + (pick.xC + 1) + '.')
      },
      {
        prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
        kind: 'choice', options, answer: 0,
        hint: t('Pirmiausia išmeskite variantus, kuriuose prisijungė ne vienas HX arba halogenas yra ne ten, kur susidaro stabilesnis karbokatijonas.',
          'First rule out the options that are not a single HX addition, or have the halogen where the less stable cation would form.'),
        solution: [
          {
            p: t('Susidaro ' + WORDS.lt[pick.cls - 1] + ' karbokatijonas, ir halogenas jungiasi būtent prie jo.',
              'A ' + WORDS.en[pick.cls - 1] + ' carbocation forms, and the halogen bonds to exactly that carbon.')
          },
          { mol: { smi: pick.major } }
        ]
      }
    ];
    const lt = name.name(pick.major, { lang: 'lt' }), en = name.name(pick.major, { lang: 'en' });
    if (lt && en) {                                           // a name step only where the namer can supply the names
      steps.push({
        prompt: t('Pavadinkite produktą.', 'Name the product.'),
        kind: 'name', mol: { smi: pick.major }, answer: { smi: pick.major },
        hint: t('Raskite ilgiausią grandinę ir sunumeruokite ją taip, kad pakaitų numeriai būtų kuo mažesni.',
          'Find the longest chain and number it so the substituents get the lowest numbers.'),
        solution: t(lt.name, en.name)
      });
    }

    return {
      q: [{ scheme: { items: [{ smi: pick.smi }, { plus: true }, { smi: pick.X }, { arrow: '→' }] } }],
      steps,
      why: t('HX prijungimas vyksta per karbokatijoną. Protonas pasirenka tą dvigubo ryšio atomą, po kurio lieka stabilesnis katijonas (tretinis > antrinis > pirminis), o halogenas jungiasi prie teigiamo atomo. Todėl pagrindinis produktas yra Markovnikovo, o ne atvirkštinis.',
        'HX addition goes through a carbocation. The proton picks the double-bond carbon that leaves the more stable cation (tertiary > secondary > primary), and the halogen bonds to the positive carbon. That is why the main product follows Markovnikov’s rule and not the reverse.'),
      src: 'L7 p9'
    };
  }
}
```

### 11.3 A bank problem: ranking acidity with reasons (type `u04.rank`)

An `order` step (options written in the right order), then a `choice` that asks for the reason. The wrong reasons are the typical ones (size, wrong effect direction). `name` on a molecule is checked by the namer; `claims` are checked by the validator; `src` points to the slide. A real bank has at least 8 such problems with different compounds (carboxylic acids, phenols, alcohols, thiols, amines, CH acids, substituent effects).

```js
{
  id: 'u04.rank',
  title: t('Rūgštingumo palyginimas ir priežastis', 'Ranking acidity, with the reason'),
  mirrors: ['S2.17'],
  bank: [
    {
      id: 'u04.rank.1',
      q: [
        { p: t('Palyginkite trijų junginių su $O-H$ ryšiu rūgštingumą.', 'Compare the acidity of three compounds that contain an $O-H$ bond.') },
        {
          mol: [
            { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') },
            { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol') },
            { smi: 'CCO', name: t('etanolis', 'ethanol') }
          ]
        }
      ],
      steps: [
        {
          prompt: t('Išdėstykite junginius nuo stipriausios iki silpniausios rūgšties.', 'Put the compounds in order from the strongest acid to the weakest.'),
          kind: 'order',                                      // the options are written in the RIGHT order; the trainer shuffles them
          options: [{ text: t('etano rūgštis', 'ethanoic acid') }, { text: t('fenolis', 'phenol') }, { text: t('etanolis', 'ethanol') }],
          hint: t('Rūgštį nusako jos anijono stabilumas. Palyginkite, kiek kiekvienas anijonas gali pasidalyti neigiamą krūvį.',
            'The acid is judged by its anion. Compare how far each anion can spread its negative charge.'),
          solution: t('Etano rūgštis (pKa 4,75) > fenolis (pKa apie 10) > etanolis (pKa apie 16).', 'Ethanoic acid (pKa 4.75) > phenol (pKa about 10) > ethanol (pKa about 16).')
        },
        {
          prompt: t('Kodėl fenolis yra stipresnė rūgštis už etanolį?', 'Why is phenol a stronger acid than ethanol?'),
          kind: 'choice',
          options: [
            { text: t('Fenoksido anijono neigiamas krūvis pasiskirsto per benzeno žiedą, o etoksido krūvis lieka ant deguonies.', 'The negative charge of the phenoxide anion is spread over the benzene ring, while the ethoxide charge stays on oxygen.') },
            { text: t('Fenolio molekulėje yra daugiau anglies atomų.', 'The phenol molecule has more carbon atoms.') },
            { text: t('Benzeno žiedas stabilizuoja neutralią molekulę labiau už anijoną.', 'The benzene ring stabilises the neutral molecule more than the anion.') },
            { text: t('Etilo grupė turi neigiamą indukcijos efektą ir stabilizuoja anijoną.', 'The ethyl group has a negative inductive effect and stabilises the anion.') }
          ],
          answer: 0,
          hint: t('Nupieškite anijoną ir pažiūrėkite, ar jam galima parašyti daugiau rezonansinių formulių.', 'Draw the anion and see whether it has more than one resonance structure.'),
          solution: t('Fenoksido anijono neigiamas krūvis per $p,π$-konjugaciją pasiskirsto žiede, todėl anijonas stabilesnis. Etoksido anijono krūvis lieka ant vieno deguonies, o etilo grupė dar ir didina elektronų tankį (+I).',
            'In the phenoxide anion the negative charge is delocalised into the ring by $p,π$ conjugation, so the anion is more stable. The ethoxide charge stays on one oxygen, and the ethyl group even adds electron density (+I).')
        }
      ],
      why: t('Rūgšties stiprumą nusako konjuguotosios bazės stabilumas: kuo labiau anijono krūvis išsklaidytas, tuo stipresnė rūgštis. Acetato krūvis dalijasi tarp dviejų deguonies atomų, fenoksido krūvis pasiskirsto per žiedą, o etoksido krūvis lieka vienas.',
        'The strength of an acid is set by the stability of its conjugate base: the more the charge of the anion is spread out, the stronger the acid. In acetate the charge is shared by two oxygens, in phenoxide it spreads over the ring, and in ethoxide it stays alone.'),
      src: 'L4 p16',
      claims: [{ formula: ['CC(=O)O', 'C2H4O2'] }]
    }
  ]
}
```

### 11.4 A mechanism problem: HBr addition (type `u07.mech`)

Tap the atom that gets H+, choose the carbocation (the third option is a typical wrong idea in words), choose the product, name the mechanism symbol. The solutions of steps 2 and 3 contain `{mech}` blocks with curved arrows: step 2 (the pair of the π bond attacks H, the H-Br bond breaks onto Br), step 3 (a lone pair of bromide attacks the cation). Notice `opts: {allH: true}` and the `'H0'` references for the arrows into H, and `opts: {lonePairs: true}` for the bromide. Claims check the product, its name and the cation's formula.

```js
{
  id: 'u07.mech',
  title: t('HBr prijungimo mechanizmas', 'Mechanism of HBr addition'),
  mirrors: ['S4.5'],
  bank: [
    {
      id: 'u07.mech.1',
      q: [
        { p: t('2-metil-2-butenas reaguoja su HBr.', '2-Methyl-2-butene reacts with HBr.') },
        { scheme: { items: [{ smi: 'CC(C)=CC', name: t('2-metil-2-butenas', '2-methyl-2-butene') }, { plus: true }, { smi: 'Br' }, { arrow: '→' }] } }
      ],
      steps: [
        {
          prompt: t('Bakstelėkite anglies atomą, kuris prisijungia protoną $H+$.', 'Tap the carbon that receives the proton $H+$.'),
          kind: 'atoms', mol: { smi: 'CC(C)=CC', opts: { numbers: 'all' } }, answer: [3],
          hint: t('Kuris dvigubo ryšio atomas turi daugiau vandenilių?', 'Which double-bond carbon has more hydrogens?'),
          solution: t('Atomas Nr. 4 turi vieną vandenilį, o atomas Nr. 2 – nė vieno. $π$ ryšio elektronai atakuoja protoną ties atomu Nr. 4.',
            'Carbon no. 4 has one hydrogen and carbon no. 2 has none. The $π$ electrons attack the proton at carbon no. 4.')
        },
        {
          prompt: t('Kuris karbokatijonas susidaro?', 'Which carbocation forms?'),
          kind: 'choice',
          options: [
            { mol: { smi: 'CC[C+](C)C' } },
            { mol: { smi: 'CC(C)[CH+]C' } },
            { text: t('Karbokatijonas nesusidaro: bromidas prisijungia pirmas.', 'No carbocation forms: the bromide adds first.') }
          ],
          answer: 0,
          hint: t('Palyginkite pakeistų atomų skaičių prie teigiamo atomo: tretinis > antrinis > pirminis.', 'Count the carbons attached to the positive carbon: tertiary > secondary > primary.'),
          solution: [
            { p: t('Protonas prisijungia prie atomo Nr. 4, todėl teigiamas krūvis lieka ant atomo Nr. 2. Tai tretinis karbokatijonas, stabilesnis už antrinį.', 'The proton bonds to carbon no. 4, so the positive charge stays on carbon no. 2. This is a tertiary carbocation, more stable than the secondary one.') },
            {
              mech: [{
                scheme: { items: [{ smi: 'CC(C)=CC' }, { plus: true }, { smi: 'Br', opts: { allH: true } }] },
                arrows: [{ from: { m: 0, b: [1, 3] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
                note: t('$π$ ryšio elektronų pora sudaro $C-H$ ryšį; $H-Br$ elektronai pereina bromui.', 'The $π$ pair forms the $C-H$ bond; the $H-Br$ electrons go to bromine.')
              }]
            }
          ]
        },
        {
          prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
          kind: 'choice',
          options: [
            { mol: { smi: 'CCC(C)(C)Br' } },
            { mol: { smi: 'CC(C)C(C)Br' } },
            { mol: { smi: 'CC(C)(Br)C(C)Br' } },
            { mol: { smi: 'CCC(C)C' } }
          ],
          answer: 0,
          hint: t('Bromidas jungiasi prie teigiamo atomo.', 'The bromide bonds to the positive carbon.'),
          solution: [
            { p: t('Bromido anijono laisva elektronų pora sudaro ryšį su tretinio karbokatijono atomu.', 'A lone pair of the bromide anion forms a bond to the tertiary carbocation.') },
            {
              mech: [{
                scheme: { items: [{ smi: 'CC[C+](C)C' }, { plus: true }, { smi: '[Br-]', opts: { lonePairs: true } }] },
                arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 2 } }]
              }]
            }
          ]
        },
        {
          prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
          kind: 'choice',
          options: [{ text: t('AE', 'AE') }, { text: t('AN', 'AN') }, { text: t('SR', 'SR') }, { text: t('SN1', 'SN1') }],
          answer: 0,
          hint: t('Dvigubą ryšį atakuoja elektrofilas, ir vyksta prijungimas.', 'An electrophile attacks the double bond, and the molecule adds up.'),
          solution: t('AE: elektrofilinis prijungimas. Elektrofilas $H+$ atakuoja $π$ ryšį, po to nukleofilas $Br-$ prisijungia prie karbokatijono.',
            'AE: electrophilic addition. The electrophile $H+$ attacks the $π$ bond, then the nucleophile $Br-$ bonds to the carbocation.')
        }
      ],
      why: t('Alkenas yra nukleofilas: jo $π$ elektronai atakuoja $H+$. Protonas jungiasi taip, kad susidarytų stabilesnis tretinis katijonas, o bromidas tada prisijungia prie jo. Šie du žingsniai ir yra elektrofilinis prijungimas (AE).',
        'An alkene is a nucleophile: its $π$ electrons attack $H+$. The proton bonds so that the more stable tertiary cation forms, and bromide then bonds to it. These two steps are electrophilic addition (AE).'),
      src: 'L7 p9',
      claims: [
        { react: ['ae.hx', ['CC(C)=CC'], { X: 'Br' }, 'CCC(C)(C)Br'] },
        { name: ['CCC(C)(C)Br', { lt: '2-brom-2-metilbutanas', en: '2-bromo-2-methylbutane' }] },
        { formula: ['CC[C+](C)C', 'C5H11+'] }
      ]
    }
  ]
}
```

## 12. Before you report

1. Playground: no problems found; every molecule looks right; every note drawn; LT and EN both read well; dark theme looks right.
2. `UNIT=<id> node --test tests/organic/content.test.js` passes; `npm test` passes.
3. Every task of your sheet is in `coverage` and in some type's `mirrors`.
4. Every `src` points to a page you opened.
5. `git add` of your unit file only (never `units.js`, never `ready`); committed on `organic-trainer`.
6. Your report lists: files, number of types / bank sizes / generators, anything you could not cover and why, engine or namer problems you found (SMILES, expected and actual result), and anything in the sources you could not read.
