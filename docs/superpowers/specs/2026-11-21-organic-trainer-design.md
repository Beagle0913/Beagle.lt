# Organic chemistry trainer (beagle.lt/organic/)

Design, 2026-11-21. Status: written by the main session. The owner handed over the "how": "use subagents and all of your possible capabilities to fully craft a program that would help someone train and learn everything that is in the documents provided by the university."

## Intent

A second trainer on beagle.lt that teaches and drills the whole VU GMC first-year course **Organinė chemija** (autumn semester): its 16 lecture topics, its 7 seminar sheets and its 6 lab works. Someone who works through it should be able to do every kind of task the seminar sheets, the two midterms and the lab defences ask for: read and draw-by-choice structures, name compounds, judge bonding, electronic effects, acidity and isomerism, and predict products and mechanisms for each compound class.

The learner is a first-year GMC student (molecular biology, biotechnology, genetics), studying alone on a laptop or a phone, often the week before a test. Lithuanian first, English one click away.

Timing: the first midterm (topics 1–5) is over. The second midterm is on 21 December 2026 (topics 6–16, seminars 4–7). The session exam covers the whole course. Part II is therefore the part that matters most soon.

"Learn" matters as much as "train": every unit opens with notes that teach the topic, and every exercise explains why the answer is right.

## Source material

Folder `C:\Users\dziug\Desktop\UNI\Organine` (outside the repo; never copied into it, never published):

| File | What |
|---|---|
| `1.FORMULĖS_KLASIFIKAVIMAS_NOMENKLATŪRA.pdf` … `13.ALDEHIDAI IR KETONAI.pdf` | Lecture slides 1–13 |
| `1 SEMINARAS.pdf` … `7 SEMINARAS.pdf` | Seminar task sheets 1–7 |
| `1 laboratorinis darbas. Kristalinimas.pdf` … `6 laboratorinis darbas. Funkcinių grupių reakcijos.pdf` | Lab works 1–6 |
| `Funkcinių grupių reakcijos (bandymų paaiškinimai).pdf` | Explanations of the lab 6 tests |
| `Organine_chemija_aprasas_2026_LT.pdf` | Course description: topics, outcomes, grading |
| `ORGANINĖ CHEMIJA GMC STUDENTAMS.INFORMACIJA.pdf` | Lecture plan, schedule, grading rules |

Facts about the material that shape the build:

- **Lectures 14–16 are missing** from the folder: 14 carboxylic acids and their derivatives, 15 amines, 16 nitrogen heterocycles. Seminars 6 and 7 and the course description cover them. See "Units 14–16" below.
- **Structures are pictures.** `pdftotext` recovers the words but not the molecules. Content authors must look at the pages themselves: the Read tool shows PDF pages as images (`pages: "1-20"`, at most 20 pages per call).
- **The course's own naming rules** (lecture 1) follow the older IUPAC chain choice: the main chain carries (a) the most principal groups, then (b) the most double and triple bonds, then (c) is the longest, then (d) has the most prefix substituents. Lithuanian names put the locant before the parent (`2-metil-2-butenas`, `1-propanolis`, `2-pentanonas`, `4-metil-2-pentinas`, `etilbutanoatas`, `N-metiletanaminas`, `benzenkarboksirūgštis`, `pentano rūgštis`, `3-metil-5-heksin-2-olis`), and use prefixes `chlor-`, `brom-`, `jod-`, `fluor-`, `hidroksi-`, `okso-`, `formil-`, `amino-`, `nitro-`, `metoksi-`.
- **Mechanism symbols** used by the course: SR, AE, AN, SEAr, SN1, SN2, E1, E2.
- **Grading** (course description): midterm 1 = 10 written questions × 0.3 = 3 points; midterm 2 = 10 × 0.5 = 5 points (at least 1.7 needed); labs 2 points; seminar quizzes 2 questions each (seminars 2–6).

## Goals

1. Every topic of the lecture plan has a unit, and so does every lab work: 16 lecture units and 6 lab units.
2. Every unit has **Learn** (notes that teach it) and **Practice** (exercise types). Every task on the seminar sheets has a matching exercise type, recorded in the unit file.
3. Molecules, reaction schemes and mechanisms are drawn on the page, clean and readable on a phone, in light and dark themes.
4. Every answer is checked at once, with a hint, a worked solution and a short "why".
5. Exam practice: midterm 1 (units 1–5), midterm 2 (units 6–16) and the full exam (1–16), ten problems each, scored the way the course scores them.
6. Progress is kept in the browser. "Review my mistakes" brings back what went wrong.
7. The chemistry is right. Every fact a program can compute is checked by the tests against an independent engine computation. Everything else is checked by an independent reviewer against the source PDFs.

## Non-goals

- A free-hand molecule editor (drawing structures atom by atom). Drawing tasks become choose-the-structure, tap-on-the-structure and step-by-step build tasks. A real editor is a later design.
- 3D models, spectroscopy, anything the course does not teach.
- Pulling shared machinery out of the maths trainer. The two trainers stay separate.
- Accounts, a server, progress that follows a visitor between devices.

## Anti-goals

These would make the project a failure even if it technically works:

- **Wrong chemistry shown as right.** Worse than a missing topic.
- Third-party scripts or libraries, a build step, or a looser Content-Security-Policy.
- Reproducing the university's slides, seminar sheets or lab texts on a public site, or naming the teaching staff.
- Lithuanian or English that reads machine-translated, or Lithuanian terms that differ from the course's own.
- A fact quiz. Tasks must make the learner reason the way the seminars do (why this product, why this order, which atom and why).
- Molecules that are drawn badly: overlapping atoms, crossed bonds, labels on top of bonds, rings that are not regular.

## Constraints

- Every rule in `CLAUDE.md`: plain HTML/CSS/JS, no dependencies, CSP meta tag unchanged, no inline scripts / handlers / styles, text from storage on the page only as text, LT and EN for every piece of interface text with LT the default, storage keys `beagle-lang` and `beagle-organic-v1`, `npm test` passes before every commit, work on a branch and open a pull request.
- The CSP has no `'unsafe-inline'` for styles: no `style="…"` attributes in markup and no `setAttribute('style', …)`. Use classes, SVG presentation attributes (`fill`, `stroke`, `x`, `y`, …), or `element.style.prop = …` from script. `img-src` is `data:` only. Scripts load only from this site; adding `<script src>` tags at run time for this site's own files is allowed.
- DOM is built with `createElement` / `createElementNS` and `textContent`. `innerHTML` is not used for anything that contains content text. (The content is our own, but this keeps the rule simple and checkable.)
- All repo development is done by Sonnet agents. The main session writes this design and the plan, reviews, checks in the browser, and commits reviewed work.
- `npm test` stays under about a minute.

## Approaches considered

1. **Own molecule engine and drawer, plus a bilingual bank of exercises with random generators wherever a program can compute the answer. Chosen.** It keeps the site's rules (no libraries, strict CSP), allows tap-on-atom tasks and endless generated practice, and lets the tests check the chemistry. Cost: the engine and the drawer are the largest single pieces of work, and the drawer's quality decides how the whole trainer looks.
2. **Ship an open-source chemistry library** (SmilesDrawer, or RDKit compiled to WebAssembly). Rejected: the repo's rule is no dependencies; RDKit needs a CSP change (`'wasm-unsafe-eval'`) and several megabytes; neither gives us the Lithuanian namer or the course's rules.
3. **Pre-drawn pictures** of every molecule. Rejected: no tapping on atoms, no generated problems, hundreds of files to keep in step with the text, and the tests could not check what a picture shows.
4. **Text-only quiz** (names and formulas as text). Rejected: organic chemistry is read from structures; it would fail most seminar tasks.

## Design

### Address, files, names

- Address `https://beagle.lt/organic/`. Trainer id `organic`. Progress key `beagle-organic-v1`.
- Name: **Organinė chemija** / **Organic chemistry**. Summary (both languages, builder may polish): "Nomenklatūra, cheminis ryšys, rūgštys ir bazės, izomerija, angliavandeniliai, halogenalkanai, alkoholiai, karbonilo junginiai, aminai, heterociklai ir laboratoriniai darbai." Note: "Pagal VU GMC Organinės chemijos kursą · LT / EN" / "Based on the VU GMC Organic Chemistry course · LT / EN".

```
site/organic/
  index.html            the page (site contract: sitebar, data-trainer="organic", CSP + referrer meta)
  trainer.css           styles, light and dark
  js/chem.js            molecule engine
  js/draw.js            layout and SVG drawing
  js/name.js            IUPAC namer, course rules, LT and EN
  js/react.js           reaction rules used by generators and tests
  js/ui.js              page, navigation, notes, exercise widgets, checking, progress, exam modes, interface texts
  js/units.js           the list of units
  units/u01.js … u16.js, l1.js … l6.js   one file per unit: notes, exercise types, bank, generators
  README.md             how the trainer works and how to add content
tests/organic/          the trainer's tests (Node, no dependencies)
tools/organic/          author helpers run with Node, never published (e.g. print the atom numbers of a SMILES)
```

The page loads the engine, drawer, namer, reaction rules, UI and unit list at once, and loads a unit's file the first time that unit is opened. The tests load everything.

### Units

| Unit | Title (LT) | Sources | Exam |
|---|---|---|---|
| u01 | Formulės, klasifikavimas ir nomenklatūra | lecture 1, seminar 1 | MT1 |
| u02 | Atomo sandara ir cheminis ryšys | lecture 2, seminar 2 | MT1 |
| u03 | Atomų tarpusavio sąveika; reakcijos ir reagentai | lecture 3, seminar 2 | MT1 |
| u04 | Rūgštys ir bazės | lecture 4, seminar 2 | MT1 |
| u05 | Izomerija | lecture 5, seminar 3 | MT1 |
| u06 | Alkanai ir SR reakcijos | lecture 6, seminar 4 | MT2 |
| u07 | Alkenai ir AE reakcijos | lecture 7, seminar 4 | MT2 |
| u08 | Dienai, alkinai ir mažieji ciklai | lecture 8, seminar 4 | MT2 |
| u09 | Arenai ir SEAr reakcijos | lecture 9, seminar 4 | MT2 |
| u10 | Halogendariniai: SN1, SN2, E1, E2 | lecture 10, seminar 5 | MT2 |
| u11 | Alkoholiai | lecture 11, seminar 5 | MT2 |
| u12 | Polihidroksiliai alkoholiai, fenoliai, tioliai, eteriai | lecture 12, seminar 5 | MT2 |
| u13 | Aldehidai ir ketonai | lecture 13, seminar 6 (tasks 1–14) | MT2 |
| u14 | Karboksirūgštys ir jų dariniai | seminar 6 (tasks 7, 8, 15–23), course description | MT2 |
| u15 | Aminai | seminar 7 (tasks 1–12), course description | MT2 |
| u16 | Azoto heterocikliniai junginiai | seminar 7 (tasks 13–16), course description | MT2 |
| l1 | Kristalinimas ir lydymosi temperatūra | lab 1 | lab defence |
| l2 | Distiliavimas ir lūžio rodiklis | lab 2 | lab defence |
| l3 | Kofeino išskyrimas, ekstrakcija, plonasluoksnė chromatografija | lab 3 | lab defence |
| l4 | Acetilsalicilo rūgšties (aspirino) sintezė | lab 4 | lab defence |
| l5 | Maleino rūgšties izomerizacija | lab 5 | lab defence |
| l6 | Funkcinių grupių reakcijos | lab 6, its explanations | lab defence |

The trainer's home groups them as **I dalis** (u01–u05, "1 tarpinis egzaminas"), **II dalis** (u06–u16, "2 tarpinis egzaminas") and **Laboratoriniai darbai** (l1–l6).

### Units 14–16

Their lecture slides are not in the folder yet. The lecture plan says slides are posted on the Friday before each Monday lecture: lecture 14 on 30 Nov, 15 on 7 Dec, 16 on 14 Dec, so the slides should appear around 27 Nov, 4 Dec and 11 Dec. These units are built last. If the slides are in the folder by then, they are the source like any other lecture. If not, the units are written from seminar sheets 6 and 7, the course description's topic list (nucleophilic acyl substitution and esterification mechanism, Claisen condensation, hydroxy- and oxo-acids; amine basicity, SN reactions, diazonium salts; aromaticity, acidity and basicity of N-heterocycles, their reactions with electrophiles and nucleophiles) and standard textbook chemistry (Klein, the course's English textbook), kept to the level and style of the lectures that exist. Each of these unit files records that its lecture was not available. When the owner adds the slides, a reviewer aligns the unit with them (a later, small task).

### What a unit holds

**Learn.** Notes in the trainer's own words, organised as sections. Block kinds: heading, paragraph, list, key rule (boxed), common mistake (boxed), molecule(s) with captions, reaction scheme, mechanism (steps with curved arrows), table, worked example (question, then solution steps revealed one at a time), and a "practise this" link to an exercise type. Each unit ends with a summary: the key reactions or rules of the unit on one screen (the "cheat sheet"). Guide length: 800–2000 words per language per lecture unit, 400–1000 per lab unit. Every section that states a reaction shows it drawn.

**Practice.** Exercise types. Each type has an id, a title, the seminar tasks it mirrors (for example `S4.3`), a generator or a bank of hand-written problems, and the hint, worked solution and "why" for each problem. Guide amounts: at least 8 exercise types per lecture unit, at least 5 per lab unit; a bank type has at least 8 problems; a generator must be able to produce at least 30 distinct problems.

**Coverage map.** Every task of every seminar sheet and every question in every lab text is listed in the unit file with the exercise type(s) that cover it. The tests check that no task is unmapped.

### Problems, steps and answer kinds

A problem is a statement (text, molecules, schemes) and one or more steps, solved in order as in the maths trainer. Each step has a prompt, an answer kind, the right answer, a hint and a worked solution. After the last step the problem shows its "why": two to five sentences on the idea behind it.

Answer kinds:

| Kind | What the learner does | Checking |
|---|---|---|
| `choice` | picks one option; options are text, molecules or schemes | the right option |
| `multi` | picks every right option | exactly the right set |
| `atoms` | taps atoms (or bonds) on a drawn molecule | exactly the right set of atom (bond) numbers |
| `order` | puts 3–6 items in order with up / down buttons | the right order |
| `number` | types a number | within a stated tolerance |
| `name` | types a compound name | against the accepted names, after normalisation |
| `formula` | types a molecular formula | element counts equal (any order, `C5H12` or `C₅H₁₂`) |
| `match` | pairs each left item with a right item from a menu | every pair right |

Name normalisation: case, spaces, every dash and minus variant, commas with or without spaces, and brackets are ignored. A name typed without Lithuanian letters (`rugstis` for `rūgštis`) is accepted, and the correct spelling is shown with a note. English accepts both `2-butene` and `but-2-ene` styles, and the Lithuanian course style is the one shown first in Lithuanian.

Options in `choice`, `multi` and `order` are shuffled. Wrong options are plausible mistakes, not filler: the anti-Markovnikov product, the wrong numbering direction, the wrong chain, the over-oxidised product, the wrong ring position, the enantiomer.

### Generated and written problems

Where a program can compute the answer, problems are generated at random (with a seed, so a problem can be shown again and tested). Where it cannot, problems are written by hand into a bank. Guide, per unit:

| Unit | Generated (examples) | Written (examples) |
|---|---|---|
| u01 | classify C atoms; name alkanes and compounds with one principal group; name → structure; molecular formula; functional groups and class | names of drugs and natural compounds; trivial names |
| u02 | hybridisation of a tapped atom; σ and π bond counts; bond polarity and δ+ / δ−; ionic or covalent; lone pairs | H-bonding, bond properties |
| u03 | conjugated system atoms; reaction type of an equation | +I/−I, +M/−M with reasons; electrophile or nucleophile; curved arrows (choose the arrows / the product) |
| u04 | which base can deprotonate (from pKa); direction of an equilibrium | ranking acidity / basicity with the reason; conjugate acid / base; Lewis acids and bases |
| u05 | constitutional isomers of small formulas; chiral centres; number of stereoisomers; R / S from wedges or Fischer; E / Z | meso compounds; Newman and chair conformations; D / L |
| u06–u16 | products of rule-covered reactions (radical halogenation, HX / X₂ / H₂O addition, dehydration and E2 with Zaitsev, SN2 with a nucleophile list, Williamson choice, alcohol oxidation, SEAr directing effects, ester and amide formation, hydrolysis) | mechanisms, reagent → product, tests for functional groups, multi-step schemes ("fill in A–E"), comparisons with reasons |
| l1–l6 | yield %, Rf, melting-point purity judgements | method, apparatus, observations, why each step is done, safety |

Language never changes the answers: every text field holds both languages, so switching language redraws the same problem.

### Molecules

**Input.** Every molecule is written as a SMILES string (the subset: organic-subset atoms B C N O P S F Cl Br I, aromatic `c n o s`, bracket atoms with H count, charge and isotope-free element, bonds `- = # :`, branches, ring closures including `%nn`, stereo `@ @@ / \`, dot-separated ions such as `CC(=O)[O-].[Na+]`). A molecule in the content may add drawing options: rotate, flip, which atoms to number, show lone pairs, show all H, highlight atoms or bonds, label atoms, and, as a last resort, fixed 2D coordinates.

**Atom numbers** in content are positions in the SMILES string (0, 1, 2 … in order of appearance). `tools/organic/atoms.js` prints them for any SMILES.

**Engine (`chem.js`).** Parses the subset and builds the molecular graph with implicit hydrogens. Computes: molecular formula; degree of unsaturation; carbon class (primary … quaternary); hybridisation; σ and π bond counts; lone pairs; formal charges; ring perception; aromaticity (Hückel rule on planar rings, including pyrrole, furan, thiophene, pyridine, pyrimidine, imidazole, indole, purine and ions such as the cyclopentadienyl anion); conjugated systems; functional groups and the compound class; canonical SMILES (with and without stereo) to tell when two structures are the same; stereocentres; R / S by the CIP rules (with duplicate atoms for multiple bonds); E / Z; meso detection and the number of stereoisomers; enumeration of constitutional isomers for small formulas (up to about 7 heavy atoms).

**Drawer (`draw.js`).** Lays out and draws SVG in textbook style:
- skeletal formula by default: 120° zig-zag chains, regular-polygon rings, fused rings sharing an edge, linear triple bonds and cumulated bonds, double bonds offset into rings, benzene in Kekulé form (an option draws the circle);
- full structural formula (every atom and every H drawn) for small molecules, for the "brūkšninė formulė" tasks;
- condensed formula as text (`CH3CH(OH)CH2CHO`, with subscripts) for acyclic molecules;
- heteroatom labels with their H (`OH`, `NH2`, `H2N` facing left), charges, lone pairs as dot pairs, wedge and hash bonds for stereocentres (chosen so the drawn configuration matches the SMILES), atom numbers (locants), δ+ / δ− labels, highlights;
- tap targets on atoms (and bonds when asked) that are keyboard-focusable buttons with labels such as "C3", at least 40 px on a phone;
- special views: Fischer projection (vertical chain, from the SMILES stereo), Newman projection (two atoms, dihedral angle, labelled groups), cyclohexane chair (positions 1–6, axial or equatorial groups), resonance structures with ↔;
- reaction schemes: molecules, `+`, `→`, `⇌`, reagents and conditions above and below the arrow, wrapping to a column on a narrow screen;
- curved arrows for mechanisms: from a lone pair, a bond or a negative charge to an atom or a bond, within one molecule or between molecules of one step; full arrowheads (electron pairs) and half-headed arrows (single electrons, for SR).

Colours: carbon skeleton in the text colour; O, N, S, halogens in colours that read in both themes, set through CSS classes. Fonts as in the maths trainer.

Quality is tested: for every molecule in the content, no two atoms closer than half a bond length, no crossing bonds, no label overlapping another label. A molecule that fails gets drawing options or fixed coordinates in the content.

**Namer (`name.js`).** Names compounds by the course's rules, in Lithuanian and English, and is the oracle the tests use to check names written in the content. Scope: acyclic chains; cycloalkanes and cycloalkenes; benzene and its derivatives; principal groups carboxylic acid and its salts, ester, acyl halide, anhydride (symmetric), amide (with N-substituents), nitrile, aldehyde, ketone, alcohol and phenol, thiol, amine (primary, secondary, tertiary, as N-substituted), with C=C and C≡C, and prefix-only groups halo, nitro, alkoxy, alkylthio; several of the same principal group (`-diolis`, `-dirūgštis`); E / Z and R / S descriptors when asked. It also knows the trivial names the course uses (acetonas, formaldehidas, acto rūgštis, benzenkarbaldehidas = benzaldehidas, fenolis, anilinas, toluenas, glicerolis, …). Outside its scope (heterocycles, fused rings, complex drugs), names are hand-written and checked by the reviewer.

**Reaction rules (`react.js`).** Graph transformations that return every product with the major one marked: radical halogenation (all monohalo products; Br₂ selective for the most substituted C–H); addition of HX, H₂O / H⁺, X₂, H₂ to C=C and C≡C (Markovnikov via the more stable cation; generators avoid substrates that would rearrange); KMnO₄ mild and harsh oxidation; 1,2- and 1,4-addition to conjugated dienes; alkyne hydration to the ketone; SEAr on a monosubstituted benzene (o/p or m by the substituent); side-chain bromination and oxidation; SN2 with a list of nucleophiles; E1 / E2 / dehydration with Zaitsev's rule; alcohol oxidation (PCC, chromic acid; tertiary does not react); Williamson ether synthesis; ether cleavage by HI; acetal and imine-type products; NaBH₄ reduction; aldol addition and condensation; esterification, hydrolysis, saponification, acyl chloride → ester / amide; diazotisation and Sandmeyer replacements. Each rule is tested on known cases from the course.

### Pages

Trainer home:

```
 ← beagle.lt                                       [ Organinė chemija ▾ ]
 Organinė chemija                     LT | EN        Ištrinti pažangą
 ┌ Egzamino praktika ─────────────────────────────────────────────┐
 │ 1 tarpinis (1–5)   2 tarpinis (6–16)   Visas kursas   Klaidos (7) │
 └─────────────────────────────────────────────────────────────────┘
 I dalis · 1 tarpinis egzaminas
  01 Formulės, klasifikavimas ir nomenklatūra        ████░░  4/9
  …
 II dalis · 2 tarpinis egzaminas
  06 Alkanai ir SR reakcijos                         ░░░░░░  0/8
  …
 Laboratoriniai darbai
  L1 Kristalinimas ir lydymosi temperatūra           ██░░░░  2/5
```

A unit:

```
 ← Visi skyriai     07 Alkenai ir AE reakcijos
 [ Mokytis ]  [ Treniruotis ]
 Mokytis: notes, section by section, with drawn molecules and schemes,
          a table of contents at the top, "Treniruotis šį tipą →" links.
 Treniruotis: list of exercise types with stars;  [ Maišyti visus ]
```

A problem (as in the maths trainer: statement, steps, check each step, hint, solution, then "why"):

```
 HBr prijungimas prie 2-metil-2-buteno
 [drawn alkene]  +  HBr  ──→  ?
 1. Kuris C atomas gauna H⁺? Bakstelėkite jį.     [tap on structure]   ✓
 2. Kuris karbokatijonas susidaro?                (a) [drawn]  (b) [drawn]
 3. Pagrindinis produktas:                        (a) (b) (c) (d) [drawn]
 [Užuomina]  [Rodyti sprendimą]
 Kodėl: tretinis karbokatijonas stabilesnis už antrinį …
```

Readable at 360 px wide. Keyboard usable throughout. The bar's trainer switcher (see below) lists Matematika and Organinė chemija.

### Progress and exam modes

- Stored under `beagle-organic-v1`: per exercise type, attempts, first-try correct answers and a streak; per unit, which note sections were opened; the list of missed problems (bank id, or generator id and seed). Corrupt or old data is ignored, never fatal.
- An exercise type is **mastered** after three first-try correct answers in a row without hints. Stars: 0–3 by streak. A unit's bar: mastered types / all types.
- **Klaidos** (review): replays missed problems; a problem leaves the list after it is answered right first try.
- **Exam practice**: ten problems drawn across the units of the exam, at most two per unit, no hints until the end; each problem scores its weight (0.3 for midterm 1, 0.5 for midterm 2 and the exam's share, 0.8 per question for the full 8-point exam) times the share of its steps right first try. The result shows the score out of 3, 5 or 8, the course's passing rules (midterm 2 needs at least 1.7), and which problems to review. The lab units are not in the exams.

### Top bar change

The earlier site design says: before a second trainer is listed, the trainer switcher must not change page while a keyboard user steps through its options with the arrow keys. Today it is a `<select>` that navigates on `change`. It becomes a button that opens a short list of links (a disclosure menu): Enter / Space opens it, Escape closes it, focus moves sensibly, links are ordinary links. This is a change to `site/shared/site.js` and `site.css`, with its tests.

### Content rules for the authors

- Read the lecture pages (as images), the seminar sheet and the lab text for the unit before writing.
- Write in your own words. The same compounds and examples may be used, since chemistry facts are free, but no sentence or task text is copied from the slides, sheets or lab texts. No staff names. No images from the PDFs.
- Use the course's Lithuanian terms; in English use the standard terms (as in Klein, *Organic Chemistry*).
- Every molecule is a SMILES string. Every computable claim (formula, name within the namer's scope, chirality, R / S, E / Z, number of isomers or stereoisomers, product of a rule-covered reaction, hybridisation, carbon class) is written so the tests check it.
- Every other claim carries its source (`src: 'L7 p12'` for lecture 7 page 12, `'S4.3'` for seminar 4 task 3, `'LW3 p2'` for lab 3 page 2, `'Klein'` for the textbook) so the reviewer can check it.
- Every problem's "why" explains the idea, not just restates the answer.

### Review

Each unit is reviewed by a fresh agent that did not write it, with the source PDFs open. It checks the chemistry, the Lithuanian, the English, that every seminar or lab task is covered, that nothing is copied, and that the drawn molecules look right (it renders a sample in the browser preview). Its findings are fixed by a Sonnet agent and re-checked. The main session reviews a sample of every unit in the browser before the pull request.

### Tests (`npm test`)

- Engine: parser; formulas; ring perception and aromaticity on a fixed list (benzene, naphthalene, pyrrole, furan, pyridine, pyrimidine, imidazole, indole, purine, cyclopentadienyl anion, tropylium cation; cyclooctatetraene and cyclopentadiene not aromatic); canonical SMILES; CIP on known cases (L-alanine S, L-serine S, L-cysteine R, (R)-glyceraldehyde, (R)- and (S)-carvone, the tartaric acids with meso); E / Z; isomer counts (C5H12 3, C4H9Cl 4, C2H7N 2, C2H6O 2, C6H14 5, C4H8 alkenes and cyclo …).
- Drawer: every molecule in the content lays out with no overlaps or crossings; Fischer and wedge drawings re-read to the same R / S; SVG output has no `style` attributes and no `NaN`.
- Namer: at least 150 known names, both languages, including every name example in lecture 1 and seminar 1 that is within scope.
- Reactions: each rule on known course cases.
- Content: every unit file loads; every text field has `lt` and `en`; ids unique; every computable claim agrees with the engine, namer or reaction rules; every generator, run with 300 seeds, gives problems that pass their own checking, have distinct options, no `undefined` / `NaN`; every seminar and lab task is mapped; no `style=` or `innerHTML` with content.
- Pages: the trainer page carries the CSP and referrer meta tags and the site contract; `trainers.json`, `index.html` and `404.html` list it.
- The deploy workflow already runs `npm test` on pushes to `main`. It also gains a `pull_request` trigger that runs the tests only (no publishing), so the pull request shows a test result before merging.

### Publishing

All work happens on the branch `organic-trainer`. When the build is reviewed and the browser check passes, the main session opens a pull request. Merging it publishes the trainer; the owner decides when.

## Done when

1. `npm test` passes, locally and in the workflow.
2. `/organic/` lists 22 units in three groups; every unit has notes and at least the guide number of exercise types; every seminar and lab task is mapped.
3. In the browser (desktop and 375 px phone, light and dark): notes render with drawn molecules, schemes and mechanisms; every answer kind works with mouse, touch and keyboard; problems check, hint, solve and explain; language switches without losing the problem; progress survives a reload; exam modes score correctly; no console errors and no CSP violations.
4. A reviewer has signed off every unit; the main session has looked at a sample of every unit.
5. The home page, the 404 page and the top bar list the trainer; the switcher passes its keyboard test.
6. A pull request is open from `organic-trainer` to `main`.

## Decided by the owner

- A trainer on beagle.lt for this course.
- It should teach and train everything in the provided documents.
- Build it with subagents, using every capability available.

## The planner's calls

Each of these is a proposal the owner can overrule.

- Address `/organic/`, id `organic`, names "Organinė chemija" / "Organic chemistry".
- One unit per lecture topic plus one per lab, grouped by midterm.
- Units 14–16 are built without their lecture slides, from the seminar sheets, the course description and the textbook.
- Our own engine, drawer and namer instead of a library.
- No free-hand molecule editor in this version.
- Names follow the course's (older IUPAC) chain rules; English accepts both name styles.
- Names typed without Lithuanian letters are accepted with a note.
- Exam practice scores like the course; labs are not in the exams.
- The trainer switcher becomes a disclosure menu of links.
- The deploy workflow also runs the tests on pull requests.
- Build order: foundations, then Part II units, then Part I units, then units 14–16 (so their slides have the best chance of being in the folder), then the labs (labs 1–5 are already defended; they serve the exam's understanding, not a date).
- The full-exam practice scores 10 × 0.8 = 8 points. The course papers do not say how many questions the session exam has; this is a constant that is easy to change.
- Content authors and reviewers are separate agents; reviewers read the PDFs as images.

## Left to the builder

- Internal data structures, file splitting within `site/organic/js/`, function names.
- Exact interface wording in both languages, within the terms above.
- Visual detail within the maths trainer's typefaces and themes.
- The mastery and review details beyond what is stated.
- Which extra drawing options a molecule needs.

## Later, as separate designs

- A molecule editor for "draw the product" answers.
- Aligning units 14–16 with their lecture slides once they are available.
- Sharing code between the trainers.
