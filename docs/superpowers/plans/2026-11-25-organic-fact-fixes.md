# Organic trainer: fact-check fixes (plan)

Date 2026-11-25. Written by the main session. The owner asked for a fact check of the organic trainer, then: "fix all of these points".

## Background

Every unit (u01–u16, l1–l6) and the engine were reviewed against standard chemistry. The lecture slides were not available to the reviewers. The main session re-checked every finding before it was put in this plan. Each item below gives the file and line found in review; lines may have moved a little. The reviewers' detailed notes are in the main session's scratchpad (`findings/<unit>.md`, path given in your task). An ID such as "u15 E1" refers to an entry in that file. Read the entries for your units before you start.

## Policy for every task

1. **A graded answer must be right.** Change the key, the options or the problem. Do not just add a note while a wrong key stays.
2. **Where the course (lecture or lab sheet) and the literature disagree,** a graded answer must be right by both standards. Avoid the contested comparison in exercises, or ask only the part that both agree on. The notes give the course's version and the correction, in a short neutral sentence in both languages. The four cases and their exact decisions are in "Shared decisions" below.
3. **Generators:** fix the cause in the generator, so no seed can give the wrong problem. Do not just filter out the seeds that were reported.
4. **Smallest change that makes it right.** Do not restyle, reorganise or "improve" anything that is not listed. Debatable items in the findings files that are not listed here are out of scope.
5. **Language:** every changed text in Lithuanian and English, meaning the same. Use the course's Lithuanian terms; match the style of the surrounding text. LT is the default language, so check the LT text as carefully as the EN.
6. **Prove it:** add regression tests for your fixes in your own new test file `tests/organic/fixes-<task letter>.test.js`. Use `tests/organic/load.js`, `node:test` and `node:assert`; see `tests/organic/react.test.js` for the style. Test generator fixes over many seeds (e.g. 1–2000, fast). Where a notes block states a computable fact, add a `claims` entry (formula, name, same, ez, react …; see `tests/organic/content.test.js`). Keep each test file under about 5 s.
7. **Before you finish:** run `UNIT=<id> node --test tests/organic/content.test.js` for every unit you touched, your own test file, and `npm test`. The engine task also runs `node --test tests/organic/react.test.js tests/organic/name.test.js tests/organic/reference.test.js`. If `npm test` fails in a file you did not touch, say so in your report; do not edit files outside your task.
8. **Git:** other agents are editing other files in the same working tree at the same time. Do not run git commands that change state (no commit, add, stash, checkout, reset). Edit only the files listed in your task. The main session reviews and commits.

## Shared decisions (course vs. literature)

**S1. Carbocation order** (u03, u08, u10). The course order is benzylic > allylic > tertiary > secondary > primary > methyl (L7 p9). For the parent cations it is not right: the benzyl cation C6H5CH2+ lies between a secondary and a tertiary cation, and the allyl cation CH2=CH–CH2+ is about as stable as a secondary one. Tert-butyl bromide solvolyses far faster than benzyl or allyl bromide.
- Notes: keep the course order, labelled as the course's order, and add this sentence where the order is stated (adapt it to the place):
  EN: "The order shows how strongly resonance stabilises a cation, but measured data refine it: the parent benzyl cation lies between a secondary and a tertiary cation, and the parent allyl cation is about as stable as a secondary one. A tertiary allylic or benzylic cation is more stable than a plain tertiary one, and an allylic or benzylic cation is more stable than a plain alkyl cation of the same class."
  LT: "Ši eilė rodo, kaip stipriai rezonansas stabilizuoja katijoną, tačiau matavimai ją patikslina: paprasčiausias benzilo katijonas yra tarp antrinio ir tretinio, o paprasčiausias alilo katijonas maždaug toks pat stabilus kaip antrinis. Tretinis alilinis ar benzilinis katijonas stabilesnis už paprastą tretinį, o alilinis ar benzilinis katijonas stabilesnis už tos pačios klasės paprastą alkilo katijoną."
- Exercises (bank and generators): never ask to rank a parent (primary) allylic or benzylic cation or halide against a secondary or tertiary alkyl one. Allowed comparisons: within the alkyl series; an allylic or benzylic one against a plain alkyl one of the same class; a tertiary allylic or benzylic one (cumyl, (CH3)2C+–CH=CH2) against a plain tertiary one; and benzyl against allyl only when both have the same class.

**S2. Friedel–Crafts acylation** (engine, u09). The acyl group goes almost only para to an o/p director (toluene about 97 % para), because the acylium–AlCl3 electrophile is bulky. The engine marks para as the only major product for acylation (ortho minor, like tert-butylation). The notes scheme shows the para ketone as the product, with a caption saying that the ortho ketone forms only in small amounts (the lecture draws both). The u09.fc.5 and u09.fc.8 keys become para.

**S3. Sulfonation of pyrrole with SO3·pyridine** (u16). Older books say C-2, but Mizuno et al. (Tetrahedron Lett. 2000, 41, 6605) showed that the product is pyrrole-3-sulfonic acid. Graded questions about the position of electrophilic attack on pyrrole use nitration (acetyl nitrate), bromination or acylation (all C-2), not sulfonation. If the notes mention sulfonation, they state the 3-product and that this is an exception, in one sentence.

**S4. Maleic acid melting point** (l5). The lab sheet (LW5 p2) gives 140–142 °C; handbooks give about 135 °C, between 131 and 140 depending on the source. Keep 140–142 as the lab sheet's value and add "(handbooks give about 135 °C)" where it is first stated. Generated "impure" maleic acid ranges must be clearly low and wide (end at 130 °C or below), so that no generated case is ambiguous. Fumaric acid: "sublimes around 300 °C" becomes "sublimes before it melts (from about 200 °C)". The m.p. 299–300 °C may stay (sealed capillary).

---

## Task A: engine and u09

Files: `site/organic/js/react.js`, `site/organic/js/name.js`, `site/organic/units/u09.js`, `tests/organic/content.test.js` (one lint line only), new `tests/organic/fixes-a.test.js`; existing engine tests may be updated where a rule's correct output changes. Findings: `engine.md`, `u09.md`, `u12.md` (E3).

- **A1 (u12 E3).** `name.js:~1270` builds the mercapto names by text replacement and does not re-sort the prefixes, so `3-mercapto-3-methylbutan-1-ol` (right) is rejected and `3-methyl-3-mercaptobutan-1-ol` is accepted. Make the mercapto (and the `…thio` for `(…sulfanyl)`) alternative names come out with the prefixes in alphabetical order, the way the main name is built. Keep accepting the misordered form only if the namer already accepts other misorders; otherwise do not. Test: `checkStep` accepts `3-mercapto-3-methylbutan-1-ol` for `SC(C)(C)CCO`, and a few more thiols with methyl, ethyl and chloro substituents.
- **A2 (S2, engine E1).** `react.js:~951`, rule `sear`: acylation gives para as the only major product when an o/p director is present (ortho stays a minor product). Check every unit's `react` claims and the u09 generators with the content test.
- **A3 (engine E2, I3).** A tertiary halide with I⁻, HS⁻ or RS⁻: `sn2` (`:~1248`) must not give the E2 alkene as an "SN2" result. It returns no reaction for tertiary substrates, as for other nucleophiles. `sn1` accepts these weakly basic nucleophiles and gives the substitution product. `thiol.alkyl` (`:~1678`) must not label an elimination as SN2: tertiary halide + HS⁻/RS⁻ goes SN1 to the thiol or sulfide, matching u10.pick.8.
- **A4 (engine E3).** `sr.halogenate` (`:~511`): cyclobutane and larger rings undergo ordinary radical substitution (the same file says so at `:~608`). Only cyclopropane may stay refused or ring-opened, whichever the unit text teaches (u06, u08); keep the engine consistent with them.
- **A5 (engine E4).** `co.tollens` (`:~1856`): α-hydroxy ketones (hydroxyacetone, fructose) give a positive Tollens test, and Fehling's too if that rule exists. Check that no unit generator then shows something wrong (u13 tests generator, l6).
- **A6 (engine E5).** `elim` with acid on a vicinal diol must not give enols. Return no reaction ("pinacol rearrangement, not covered") unless a unit teaches it.
- **A7 (engine I1).** `side.ox` on phenols and anilines: return no reaction (the ring is oxidised), with a short reason if the rule supports one.
- **A8 (engine I2).** `sear` nitration of aniline (free NH2) in nitrating acid: return no reaction with the reason "protonated / oxidised; protect as acetanilide" (or the meta-containing mixture, if the rule can mark it). Treat it the same way as N,N-dialkylaniline.
- **A9 (engine, debatable).** `wouldRearrange` misses the two-shift case, 4-methyl-2-pentanol (`CC(C)CC(C)O` and its halides and cations). Make it return true there, so u11.react4 and u11.hx stop picking it, as u11.elim already does by hand.
- **A10.** `tests/organic/content.test.js` `textCheck`: add `\bnull\b` to the "undefined / NaN / [object" lint, so a `$null$` in learner text fails. Check that no current unit trips it except the u01 bug (Task B fixes that; until then, report the failure rather than suppress it).
- For every engine change: grep `site/organic/units/*.js` for the rule, run the content test for each unit that uses it, and list in your report any unit whose generated problems changed. Do not edit unit files other than u09; tell the main session instead.

u09 (findings `u09.md`):
- **A11 (u09 E2).** `u09.js:~39-40, 114-115`: CF3 and CCl3 use the 'acc' text "withdraws electrons (−I, −M)". Give these two their own reason, "−I only (no lone pair, no π bond): deactivates, meta director", or make the 'acc' text depend on the group.
- **A12 (S2).** Notes scheme `u09.js:~420` (toluene acylation), fc.5, fc.8 and the `u09.sear` generator: para only, per S2. The fc.8 WHY calls OCH3 a "strong" donor; the unit's table says "moderately activating", so make it match.
- **A13 (u09 I1).** `u09.side`: tert-butylbenzene + hot KMnO4. The keyed option and the solution use the radical-bromination text ("no benzylic radical … bromine in light"). Give the KMnO4 case its own reason: no benzylic H, so no oxidation.
- **A14 (u09 I2).** `u09.pos`: it ranks OCH3 above NHCOCH3, but the unit's table puts them in the same row. Remove the OCH3/NHCOCH3 head-to-head pairs, or rank them so the table supports it. In fact 4-methoxyacetanilide nitrates ortho to NHCOCH3; if you keep the pair, NHCOCH3 must win and the table must say why.

## Task B: u01, u02

Files: `site/organic/units/u01.js`, `site/organic/units/u02.js`, new `tests/organic/fixes-b.test.js`. Findings: `u01.md`, `u02.md`.

- **B1 (u01 E1).** `u01.formulas` v=1 (`~1022-1033`): ring and arene compounds get "condensed formula: $null$". Pick only compounds that have a condensed formula (the same guard as the other branch). Test: no generated text contains "null" over 2000 seeds.
- **B2 (u01 E2).** `u01.formulas` "What type of formula is this?" (`~967-989`): cyclic compounds asked as "condensed" are drawn skeletal. Use only acyclic compounds for the condensed case.
- **B3 (u01 I1).** Option labels "amine ($–NH2$)" and "amide ($–CONH2$)" (`~28, ~35`) are keyed for secondary and tertiary amines and amides. Make the label generic: "amine ($–NH2$, $–NHR$, $–NR2$)" and "amide ($–CONH2$, $–CONHR$, $–CONR2$)", or whatever fits the option layout.
- **B4 (u01 I2, L1).** `u01.classify` (`~1146-1148`): the gloss "aromatic = conjugated π system in the ring" also fits cyclohexa-1,3-diene, and the hint counts π electrons from double bonds only. Say: a planar ring, fully conjugated (every ring atom has a p orbital), with 4n+2 π electrons; a heteroatom's lone pair can count. The LT hint must not say "six-membered".
- **B5 (u01 I3).** The radicals table (`~439`) says methyl comes from a primary carbon, but the mistake box (`~425`) says a carbon with no carbon neighbours is not primary. Make the table match the box.
- **B6 (u01 I4).** Add "in neutral molecules" (or the like) to "a halogen is never a bridge" (`~913`) and "sulfur never has an odd number of bonds" (`~923`).
- **B7 (u02 E1).** `u02.bondtype` (`~1081`): `sym` ignores the bond order when both atoms are the same element, so a C=C or C≡C bond is labelled "C–C". Use the bond order in every case.
- **B8 (u02 I1).** The sodium acetylide caption (`~461`) says "ΔEN large, ionic", but the section's default C = 2.5 gives ΔEN = 1.6, which is polar covalent by the course rule. State the sp-carbon value used (3.1, ΔEN = 2.2), or replace the example with a clearly ionic one (e.g. sodium methoxide, CH3O⁻ Na⁺).

## Task C: u03, u04

Files: `site/organic/units/u03.js`, `site/organic/units/u04.js`, new `tests/organic/fixes-c.test.js`. Findings: `u03.md`, `u04.md`.

- **C1 (u03 E1).** `u03.nuel` (`~2683-2715`): about 9 % of problems mark a partner that does react as "cannot react": a strong-base anion with a protic species (NH2⁻ + H2O or CH3SH, CH3⁻ + NH3), or a carbonyl with H⁺ or BF3. The reason given, "two nucleophiles repel each other", is false. Draw the wrong options only from partners that really do not react (e.g. a nucleophile with another nucleophile that has no acidic H, and is not an acid; an electrophile with an electrophile that has no lone pair or π bond). Rewrite the reason as "neither particle can accept (or donate) an electron pair". Test: over 5000 seeds, no wrong option is an acid (has an O–H, N–H or S–H, or is H⁺ / H3O⁺) paired with a strong-base anion, and no carbonyl is paired with H⁺ or BF3 as a wrong option.
- **C2 (u03 E2).** `u03.redox.3` LT solution (`~3938`): it should say that one carbon (the CH2) is reduced (−2 → −3) and the other (the central C) is oxidised (0 → +1), and the sum does not change. Put the numbers in EN too.
- **C3 (S1).** Carbocation order in the u03 notes, the summary, the `stab` generator and resonance.5. Apply S1, including the generator's pool: no parent allyl or benzyl cation against a tertiary one (e.g. seed 24).
- **C4 (u03 I1).** `effects` generator (`~1284`): add "for a halogen −I is stronger than +M" only when the halogen is on an sp2 / aromatic carbon (the case with an M effect).
- **C5 (u03 I2–I4).** The +I table (`~119`): Si is not a metal (say "metals and Si", or move it). The EN activation-energy definition (`~367`): "intermediate state" → "transition state". The rtype SN2 explanation (`~3211`): CH3X is "methyl", not "primary".
- **C6 (u03 L1).** natural.6 WHY (`~1777`): LT "kryžminį" (cross-conjugated) → the LT word for linear, alternating conjugation, matching EN.
- **C7 (u04 E1).** `u04.conj` (`~120-178`): the "tap the most acidic atom" step must accept every symmetry-equivalent atom (cyclohexanone α-C, ethyne C, H2SO4 OH oxygens, propane CH3 carbons), and the solution must say "atom(s) …" and not claim that the others are less acidic. Use the engine's symmetry classes if available; otherwise list the equivalent atoms in PAIRS. Test over 400 seeds.
- **C8 (u04 I1).** Worked example (`~951`): water + NH3. Correct the reasoning: NH4+ (pKa 9.26) is a stronger acid than water (15.7), so the equilibrium lies to the left. Water still acts as the acid (proton donor) towards NH3, but only a little NH4+ and OH⁻ forms.
- **C9 (u04 I2).** Summary (`~1785`): "FCH2COOH is the strongest of the haloacetic acids" → "of the monohaloacetic acids XCH2COOH".
- **C10 (u04 I3).** Methane pKa 40 (`~735`) → about 50 (the usual value is 48–50), so the sp3 < sp2 < sp order in the same section holds. Check every place that uses this number, generator tables included.
- **C11 (u04 I4).** π-bases (`~782, ~786`): "no new σ bond forms" contradicts u07 (strong acids protonate alkenes to carbocations). Say that weak acids give only π complexes, while strong acids add H⁺ and form a carbocation (a σ bond).
- **C12 (u04 L1).** pKa WHY LT (`~241`): "Ka rodo, kokia dalis rūgšties disocijuoja" is false. Say what the EN says (Ka is the equilibrium constant of dissociation; a larger Ka means a stronger acid).
- **C13 (u04 debatable, LT name).** LT "Bute-3-en-1-amine" typo, if present: fix the spelling.

## Task D: u05, u06, u07

Files: `site/organic/units/u05.js`, `u06.js`, `u07.js`, new `tests/organic/fixes-d.test.js`. Findings: `u05.md`, `u06.md`, `u07.md`.

- **D1 (u05 I1).** CIP table (`~467`): COOH is "the highest of the carbon groups in this table", not the highest in general (CH2SH > COOH; L-cysteine = R).
- **D2 (u05 L1).** `u05.chiral` step 2 (`~1104`): LT "(viršuje kairėje)" → the same as EN ("the first chiral molecule", in reading order).
- **D3 (u06 E1).** `u06.count` (`~317-320, ~344`) for alkylbenzenes: the hint and solution count "groups of equivalent hydrogens" as if the ring H counted. Say that under radical conditions (Cl2, hν) only the side-chain (sp3) hydrogens are replaced, so the count is of equivalent side-chain H groups. Test the solution numbers against the key.
- **D4 (u06 E2).** `u06.ox.4` (`~1372-1381`): "CH4 + O2 → CO + H2 + H2O" is balanced and is a real partial oxidation. Replace that distractor with one that is unbalanced or does not give CO, or put the condition (all H ends as H2O) into the question.
- **D5 (u06 I1).** "nearly equal rates" / "almost the same rate" for chlorine (`~884-885, ~940, ~1635`): chlorine is far less selective than bromine, but 3° : 2° : 1° per H is about 5 : 4 : 1, so mixtures form. Fix the rule box, the mistake box and the why.7 option.
- **D6 (u07 E1).** Notes `u07.js:~372`: the product of 3-hexene + HBr `CCC(Br)CC` → `CCC(Br)CCC`. Add a `claims` formula check.
- **D7 (u07 I1, I2).** `u07.hydr` solution (`~1091`) and the `u07.radical` EN peroxide solution (`~1457`): "H goes to / Br ends up on the carbon with more hydrogens" is false for 1-arylpropenes (both C have one H). Phrase it by the cation (or radical) stability that decides, or use the H-count phrase only when the counts differ.
- **D8 (u07 I3).** The `u07.back` hint (`~1383`) always says "those of the ketone and the acid". Build it from the actual fragments (ketone, acid, CO2).
- **D9 (u07 I4).** Hot alkaline KMnO4 (reagentList `hotalk` `~90-91`, `u07.kmno4`): the notes say a terminal =CH2 ends as carbonate, but the answers show CO2. Make them consistent: either show CO2 and say "(as carbonate in base; CO2 after acidification)", or follow the notes everywhere.
- **D10 (u07 I5).** Summary (`~774`) and notes (`~677`): "a single product means a symmetrical alkene". Add "or a cyclic alkene (the ring opens to one product)".
- **D11 (u07 I6).** Summary (`~772`): "with an electron-withdrawing group the heteroatom is protonated" does not fit CF3. Rephrase to cover CF3 (the cation forms away from the group).
- **D12 (u07 L1).** deduce.5 WHY (`~1890`): LT "Prijungimas" → the LT for hydrogenation, matching EN.

## Task E: u08, u10

Files: `site/organic/units/u08.js`, `u10.js`, new `tests/organic/fixes-e.test.js`. Findings: `u08.md`, `u10.md`.

- **E1 (u08 E1).** Notes `u08.js:~1052-1057`: the but-1-yne + 1 equiv. Br2 product must be drawn E (anti). Write the stereo into the SMILES (`CC/C(Br)=C\Br` or whatever the engine reads as E), and add an `ez` claim. Do the same for the `u08.chain.5` answer A (`~1756`, `CC(Br)=C(C)Br` → the E isomer). Check that the drawing shows the two Br trans.
- **E2 (u08 E2).** `u08.dadd` WHY (`~328-331`) always says "two products form". When the allylic cation is symmetric and gives one product (cyclopentadiene, cyclohexa-1,3-diene, penta-1,3-diene, 2,4-dimethylpenta-1,3-diene …), it must say so. Build the WHY from the same product count the key uses.
- **E3 (S1).** u08 notes (`~958-959`) and `u08.dmech.9` (`~1562-1571`): apply S1. dmech.9 must not require the parent allyl cation above tert-butyl.
- **E4 (u08 I2).** `u08.name`: 7 of 38 SMILES (`CC(C)C#CC(C)C`, `CC(C)C#CCC`, `ClCC#CC`, `OCC#C`, `OCC#CC`, `CC(O)C#C`, `CC(O)C#CC`) number the drawn atoms differently from the IUPAC locants, and the solutions quote the drawn numbers. Rewrite those SMILES in IUPAC order (the main chain first, from C1, and substituents as branches), so that the drawn labels equal the locants, as the code comment at `~338` intends. Test: for every pool entry, the atom numbers the solution quotes equal the locants in the name.
- **E5 (u08 I3).** Zingiberene (`~809-810`) is not "a diene": it has three C=C bonds and contains a conjugated diene unit.
- **E6 (u10 E1, S1).** `u10.rank.5` (`~1694-1712`) ranks benzyl bromide > allyl bromide > tert-butyl bromide for SN1, and step 2 asks why benzyl+ beats tertiary. Replace it with a set that S1 allows (e.g. cumyl bromide > tert-butyl bromide > isopropyl bromide > ethyl bromide, or a tertiary allylic halide against tert-butyl bromide), and rewrite step 2 to match.
- **E7 (u10 I1, S1).** Notes caveat (`~663`), the summary list (`~789`), the allyl.2 / allyl.7 WHY texts: apply the S1 wording. No text may imply that the parent benzyl or allyl cation is more stable than a tertiary one.
- **E8 (u10 I2).** `u10.draw.2` (`~1180`): the correct option says the tertiary carbocation is "unstable". Say "high-energy" (a reactive intermediate), so it does not contradict the rest of the unit.

## Task F: u11, u12

Files: `site/organic/units/u11.js`, `u12.js`, new `tests/organic/fixes-f.test.js`. Findings: `u11.md`, `u12.md`.

- **F1 (u11 E1).** `u11.react4` (`~1544-1565`): the wrong options for H2SO4/heat include an alkene that the engine also marks major (3-hexanol, 3-methyl-3-hexanol, 1-ethylcyclopentanol). Never put a major product among the wrong options, and either accept the alternatives or skip alcohols with more than one major alkene (as u11.elim does). For 1-ethylcyclopentanol the ring alkene (1-ethylcyclopentene) is the real main product: if it stays in the pool, the key must be the ring alkene. Test over 2000 seeds: no wrong option is a major product of the rule.
- **F2 (u11 E2).** Cheat sheet (`~795`), plus `~342-343` and `~368-369`: split the mechanisms by reagent. HX: primary SN2, secondary and tertiary SN1 (carbocation, can rearrange). PBr3 and SOCl2: primary and secondary SN2 (no rearrangement, inversion); not used for tertiary alcohols.
- **F3 (u11 I1).** Rule box (`~368-369`), "always a haloalkane with the same skeleton": add that in SN1 the carbocation can rearrange (e.g. 3-methyl-2-butanol + HBr → 2-bromo-2-methylbutane).
- **F4 (u11 I2).** `~504-505`: in the citric acid cycle fumarase hydrates fumarate to malate. Use a true dehydration example (e.g. aconitase: citrate → cis-aconitate), or reword: "fumarase interconverts malate and fumarate (in the cycle it adds water to fumarate)".
- **F5 (u11 I3).** `~649`: acidic permanganate is reduced to almost colourless Mn²⁺. Brown MnO2 forms in neutral or alkaline solution, as in the lab 6 Baeyer test. Match the unit's own lab table (`~761`).
- **F6 (u12 E1).** `u12.ring` water mode (`~1271-1277`): the hint and solution say "a polybromophenol forms, it does not stop at the monobromide" even when only one o/p position is free. Build the text from the number of free activated positions (one: "the only free activated position is brominated"; two or more: "all free activated positions are brominated").
- **F7 (u12 E2).** `u12.will` ETHERS entry `CCOc1ccc(cc1)[N+](=O)[O-]` (`~1448`): the claim that "ethoxide + 4-nitrohalobenzene fails" is false (SNAr). Remove that entry.
- **F8 (u12 I1).** Mistake box (`~367-368`) and the `fe` mode (seed 22): "Br2/FeBr3 gives only a monobromide of 4-nitrophenol because the ring is less activated." 4-Nitrophenol dibrominates readily (bromine water gives the 2,6-dibromo product in seed 5). Make the two modes consistent: with excess Br2 both give 2,6-dibromo-4-nitrophenol; one equivalent gives mainly the mono product. Fix the key or the stated amount of bromine so the answer follows from the question.
- **F9 (u12 I2).** Cheat-sheet epoxide row: "Nu on the less hindered C" → "… under basic or neutral conditions".
- **F10 (u12 I3).** Acidity solutions "pKa: A (7.2) > B (12.4)": write "acidity: A (pKa 7.2) > B (pKa 12.4)".
- **F11 (u12 I4).** The mech.12 hint ("the most acidic group") points at COOH, not the phenol. Fix the hint so it leads to the keyed answer.
- **F12 (u12 I5).** The Williamson step-2 hint is about base strength, which does not fit the aryl and "both work" cases. Make it fit every case (the SN2 substrate must be methyl or primary; an aryl halide does not do SN2).
- **F13 (u12 L1).** The mech.12 LT wrong option is cut off ("Chloro atomas chlorace."). Write it out in full, matching EN.

## Task G: u13, u14

Files: `site/organic/units/u13.js`, `u14.js`, new `tests/organic/fixes-g.test.js`. Findings: `u13.md`, `u14.md`.

- **G1 (u13 E1).** `u13.mech.5` step 2 correct option (`~2486`): "(one concerted stage)" → "(two stages, E1cB)" (LT "dvi stadijos, E1cB").
- **G2 (u13 E2).** `u13.enol` (`~1915`, `~1960`): for R = CH3 (1-arylpropan-2-ones) the distractor "this enol has the more substituted double bond" is true. Drop that distractor when it is true for the picked ketone (compare the substitution of the two enol C=C), or remove 'C' from RS.
- **G3 (u13 I1).** `u13.hydrate.2` solution (`~1177`): "aldehydes with alkyl groups hardly form hydrate" contradicts the 58 % for ethanal. Say ketones and larger aldehydes form little hydrate, while methanal and ethanal are largely hydrated.
- **G4 (u13 I2).** `u13.order.6` WHY (`~1057`): acid catalyses hydrate and hemiacetal formation, but they also form without it. Acetal formation needs acid.
- **G5 (u13 L1).** `u13.hydrate.4` WHY (`~1247`): LT "dviejų stadijų" must agree with step 1 of the same problem (three stages) and with EN.
- **G6 (u14 E1).** Claisen mechanism, stage 1 (`~789`): the second arrow (C–H bond) must go to the α-carbon (atom 0), giving the carbanion that the next step draws, or else add the C=O → O arrow and draw the enolate. It must be consistent with step 2.
- **G7 (u14 I1, I2).** `mech.4` hint (`~1460`): ask which C–O bond breaks: the acid's C–OH or the alcohol's C–O. The 18O notes (`~672-673`) must say that the label was in the alcohol oxygen and ended up in the ester.
- **G8 (u14 I3).** `genNu`, anhydride + water (`~168`): a single acid molecule is the right product, just without the stoichiometry. Drop `[acid]` from `wrongSets`.
- **G9 (u14 I4).** `drugs.4` solution (`~2128`): N is more nucleophilic than O because N is less electronegative (as the step's hint says). Delocalisation into the ring affects both, so it is not the reason.
- **G10 (u14 I5).** `genNu` step-1 hint (`~224`): "carbon bonded to two electronegative atoms" does not fit nitriles. Make the hint fit every substrate the generator draws.
- **G11 (u14 L1).** `~439-440`: EN says both 3- and 4-chlorobutanoic acid are close to butanoic acid. Follow the LT: 4-chloro (pKa about 4.5) is close to butanoic acid (4.82), while 3-chloro (4.05) is noticeably stronger. Check the numbers against the unit's table.

## Task H: u15, u16

Files: `site/organic/units/u15.js`, `u16.js`, new `tests/organic/fixes-h.test.js`. Findings: `u15.md`, `u16.md`.

- **H1 (u15 E1).** `u15.cys.8` solution (`~2175`): "their order depends on the pH" is false. Say that SH (pKa about 8.2) is somewhat more acidic than NH3+ (about 10.3); both are much weaker acids than COOH.
- **H2 (u15 I1).** `u15.drug.6` (ephedrine, one N) uses the shared text "contains several nitrogen atoms … why are the other N less basic?". Use texts that fit one N, or replace ephedrine with a drug that has several N.
- **H3 (u15 I2).** Nitrous acid notes scheme (`~387`): two reactions are joined by "+". Split it into two schemes (or two rows).
- **H4 (u15 I3).** `u15.nuc.3` (`~1040`): alkali cannot free a tertiary amine from a quaternary salt because there is no N–H proton to remove, not because "there is no lone pair left".
- **H5 (u15 L1–L4).** LT mistake box (`~42`): "number of carbons on nitrogen", matching EN. LT tribromoaniline caption (`~527`): match EN (even one equivalent does not stop at one substitution). EN `scheme.6` (`~1898`): "Start with direct bromination" → "First consider direct bromination", matching LT. pKa table (`~151`): the cell `f('−0,5 (apie)')` must be `t('apie −0,5', 'about −0.5')`; check the other cells of that table.
- **H6 (u16 E1).** `u16.sextet` (`~670`): histamine (`NCCc1cnc[nH]1`), and any other pool entry with a basic side-chain N or exocyclic NH2: the "tap the N that can take a proton without destroying aromaticity" step must accept every such N, or ask only about ring nitrogen atoms ("ring nitrogen atoms"). Choose one rule and apply it to the whole pool. Tryptamine (`NCCc1c[nH]c2ccccc12`) must not get "Why is this heterocycle only a very weak base?". Remove it, or ask about the ring N only.
- **H7 (u16 I2).** Sextet reason for furan and thiophene: mention that O and S have a second, in-plane lone pair, and that the ring is still a very weak base because protonating it destroys aromaticity.
- **H8 (S3).** Pyrrole sulfonation (notes, worked example, summary, nuc.5, nuc.6, the `sear` generator): apply S3.
- **H9 (u16 I4).** Vitamin B12 (`~574`): built on a corrin ring (a porphyrin-like macrocycle) with Co, not on porphine.
- **H10 (u16 I5, I6).** `protonate` generator reason: do not call the imidazole ring "electron-poor" (imidazole is electron-rich; its sp2 N is less basic than an alkylamine because of its sp2 lone pair). Do not write "(N–H)" for 1-methylimidazole.
- **H11 (u16 I7).** `pairing.7`: "the donor is N–H, the acceptor is C=O" is incomplete; ring N atoms (adenine N1, cytosine N3) are acceptors too. Make the correct option say so, consistent with pairing.2 and pairing.3.
- **H12 (u16 L1–L3).** pairing.3 LT "kietesnė" vs EN "more stable" (G–C-rich DNA is more stable: it melts at a higher temperature); pyridine.4 LT "attacks carbon, not nitrogen" vs EN "ends up on carbon" (follow EN); LT spelling "pyridin-3-sulfonrūgštis" → "piridin-3-sulfonrūgštis".

## Task I: labs l1–l6

Files: `site/organic/units/l1.js` … `l6.js`, new `tests/organic/fixes-i.test.js`. Findings: `l1.md` … `l6.md`.

- **I1 (l2 E1).** `l2.js:~175-176, ~237, ~925-938`: acetone–water mixtures have a refractive-index maximum above pure acetone (about 1.362 at about 70 wt % acetone, 25 °C; Thermochim. Acta 2006, doi 10.1016/j.tca.2006.01.008). So a small amount of water raises the index, and one value can mean two compositions. Do not quote the exact maximum on the site: say only that acetone with a little water has a slightly higher index than pure acetone. Rewrite the rule: the refractive index shows whether a liquid is pure (it matches the table value) but cannot by itself tell how much water is in acetone. Rework the `nclass` generator so its question is answerable and true: e.g. compare the measured value with the table value (equal within ±0.0005 = consistent with pure; otherwise not pure), with no straight-line water estimate. Also fix any other text that says water lowers acetone's index.
- **I2 (l3 E1, l4 E1, l5 E1).** TLC generators (`l3.js:~782-794`, `l4.js:~620-625`, `l5.js:~754-755`): every spot must lie below the solvent front, so 0 < Rf < 1 (keep a margin, e.g. spot ≤ front − 5 mm). Test: 10000 seeds per generator, every Rf < 1.
- **I3 (l6 E1).** `CUGLY` (`l6.js:~26`, shown `~185-188`): draw the copper(II) glycerolate as in the caption and equation, Cu(C3H7O3)2 = C6H14CuO6. Each glycerol binds through one O⁻ (covalent) and one OH (donor, H kept). Use a SMILES the engine parses with that formula (the findings file `l6.md` proposes two), and add a formula claim. Check that it draws cleanly.
- **I4 (l6 I1).** Rule box (`~191-192`) and `l6.defence.6` (`~1538`): α-amino acids are not "compounds with hydroxyl groups on neighbouring carbons". Remove them from that list. If they stay elsewhere, say that they bind Cu²⁺ through NH2 and COO⁻.
- **I5 (melting ranges, l1 I*, l3, l4 I1, l5 I1, l6 I2).** Generated "impure" melting ranges must end below the pure compound's literature melting point. Impurities lower and widen the range, never raise its top. Apply this to every melting-point generator in l1, l3, l4, l5 and l6. Test 2000 seeds each.
- **I6 (S4).** l5: maleic and fumaric acid values per S4 (`~114-123`, `~177`, `~457-470`, and the generator).
- **I7 (l2 I1).** `l2.observe.8`: absolute ethanol is obtained not "only" by binding water chemically. Azeotropic distillation with a third component and molecular sieves are also used.
- **I8 (l1 order.8, l3 order.7).** Order problems that force an order between two independent steps: rewrite them so every step has one place, or merge the independent steps into one item.
- **I9 (l3 L1–L3).** Yield WHY: LT "sorbent" vs EN "leaves" (make both say what the procedure means); `apparatus.8` distractor: LT test tube vs EN filter flask (choose one); `observe.4`: LT "slysta" (slides) vs EN "cling" (follow the meaning the key needs).
- **I10 (l6 L1, L2).** Ester calculation LT: it says the amounts are equal 1 : 1, then that the acid is in excess. Make it say the reaction ratio is 1 : 1 and the acid is in excess, as in EN. `~563` LT "pražyla" → the LT for "becomes colourless" ("nusispalvina"); `~443` "nelaisto" → the right word for "insoluble" ("netirpus" / "netirpsta", whichever fits the sentence).
- **I11 (l6, debatable but listed).** The summary row and `l6.defence.3` present anhydrous CuSO4 as giving absolute ethanol. Follow the notes: it dries ethanol (and detects water), but does not give absolute ethanol.
- **I12 (l1, l3, l4, l5, l6 other Inaccurate/LT items in the findings files).** Fix every other entry under "Errors", "Inaccurate" and "LT/EN" in `l1.md` … `l6.md` that is not covered above.

---

## Review (main session)

- Read every diff against this plan, item by item. Check that the chemistry is right in both languages.
- Run `npm test` (must pass), plus `SEEDS=300 node --test tests/organic/content.test.js`.
- Render the changed molecules (the u08 E isomers, the u07 product, the l6 complex) and look at them.
- Commit by task, on the branch `claude/peaceful-cori-eqgd1n`. Open one pull request.
