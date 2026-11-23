# English trainer: "Clone a gene" vocabulary lesson (design)

Date: 2026-11-23. Branch: `english-trainer` (from `main`).

## Why

The user's team (Team 5, *English for Academic Purposes*, Molecular Biology subgroup) leads a vocabulary exercise in class **today** (T 11/23) on Allison, *Fundamental Molecular Biology*, Ch 8: **8.3 Cutting and joining DNA, 8.4 Molecular cloning (pp. 195–200), 8.7 DNA sequencing**. Other teams already used Kahoot, crosswords, matching pairs and connect-the-dots. This exercise should do what those can't: the words *act*. Choosing the right term makes the DNA, plate or gel on screen do that thing.

Use: the team runs it from a laptop at the projector (about 20 minutes) while the room calls out answers. Classmates may open the same link on their phones and play it themselves.

## Goals

- A new trainer `site/english/` ("English" / "Anglų kalba") with one lesson: **Clone a gene** (Ch 8).
- The lesson is one lab story in 6 scenes: **Cut → Choose a carrier → Join → Into bacteria → Grow and pick → Read the sequence**. It has 25 steps in total, plus a word list at the end.
- Each step shows an English sentence with a blank and 4 word buttons. The right word triggers a short animation on the scene picture. A wrong word shakes, stays marked, and shows **what that word actually means** (its definition). Wrong answers teach too. The player tries again.
- Easy to read on a projector (large type, high contrast). Also works on a phone.
- The answer buttons are shuffled on every play.

## Non-goals

- No live class leaderboard, no server, no accounts (the site has no server side).
- No saved progress. The only storage is `beagle-lang`, handled by the shared bar.
- No other lessons yet. The data format allows more later. Only the existing lesson is listed.

## Anti-goals

- It must not be a plain quiz with a picture glued on. Every correct answer changes the picture.
- No wrong biology. All content below is checked against the book. The builder must not add or reword facts.
- Nothing hard to read from the back of a classroom: no tiny text, no low-contrast colours.

## Constraints (from CLAUDE.md / README)

- Plain HTML/CSS/JS, no dependencies, no build step. The page follows the trainer contract in README.md (sitebar, shared css/js, `data-trainer="english"`, the exact CSP + referrer meta tags, `<html lang>` follows the LT/EN buttons).
- CSP: no inline scripts, no inline handlers, **no `style="…"` attributes** (setting `el.style.x` from a script file is allowed). SVG presentation attributes (`fill`, `x`, `transform`) are fine. Build SVG with `createElementNS` and put text in with `textContent`.
- **Interface text** exists in LT and EN, LT default: buttons, scene titles, instructions, feedback labels, the end screen. **Lesson content** stays English in both modes: step sentences, word buttons, definitions. It is an English vocabulary class. (My call; noted for the user.)
- Add to `trainers.json`, plus the static rows in `site/index.html` and `site/404.html`. Tests go under `tests/english/` and into `npm test`.

## Approaches considered

- **A. "Clone a gene" story (chosen by the user).** One lab task in scenes. The words drive the animations. Works at the projector and can be replayed on phones.
- B. Toolbox sandbox: drag word cards onto objects. Fun to poke at, but there's no path for the team to lead the room through.
- C. Palindrome hunt + quiz: quickest, but too close to what the other teams did.

## Screens

1. **Start**: lesson title "Clone a gene", "Ch 8 · 8.3, 8.4, 8.7", one line of what to do (LT/EN), a big **Start** button, a **Word list** button.
2. **Scene**: top shows the scene name, "Scene n/6" and step dots. Middle shows the scene picture (SVG, large). Below it the sentence with a blank, then 4 word buttons (2×2 grid; 1 column on a narrow phone). After a correct answer, the blank fills with the word, the animation plays, and **Next →** appears. Presenter keys: `1`–`4` pick a word, `→`/`Enter` next, `←` back. Back and Next are always available, so the team can skip a step.
3. **End**: "You cloned and sequenced the gene!" (LT/EN), first-try score "n / 25", then the **word list**: every term with its definition, grouped by section (8.3, 8.4, 8.7). **Play again** reshuffles.

```
 Scene 1/6 · Cut                        ● ● ○ ○
 ┌──────────────────────────────────────────────┐
 │  5'─ C T G A A T T C A G ─3'                 │
 │  3'─ G A C T T A A G T C ─5'   (✂ enzyme)    │
 └──────────────────────────────────────────────┘
 GAATTC reads the same 5'→3' on both strands, so it is a ____.
 [ palindrome ]  [ plasmid ]
 [ primer     ]  [ clone   ]
```

## Scenes and pictures (what each correct answer does)

The builder chooses the visual details. These are the required beats:

1. **Cut**: a short double strand with `GAATTC`/`CTTAAG` in it. (1) enzyme shape slides along and stops at the site; (2) site highlights; (3) arrows show both strands read the same 5'→3'; (4) staggered cut between G and A on each strand, so the ends show single-stranded `AATT` tails.
2. **Choose a carrier**: a circular plasmid (pUC18) with an amp^r gene, a lacZ segment, and a multiple cloning site marked on it. (5) the circle appears/labels "vector"; (6) labels "plasmid"; (7) MCS lights up; (8) a gene fragment with matching sticky ends appears beside the opened circle, labelled "insert".
3. **Join**: (9) the cut plasmid ends get their 5'-phosphates removed (small "P" marks fade), so it can't close on itself; (10) the insert slides in and the tails pair up (dashed H-bond lines); (11) gaps in the backbone seal (dashes → solid); (12) the circle glows: recombinant DNA.
4. **Into bacteria**: (13) E. coli cells, membranes go dotted/leaky (calcium); (14) the plasmid enters a cell; (15) a lightning pulse pushes DNA into another cell.
5. **Grow and pick**: an agar plate. (16) cells without plasmid fade (ampicillin), the rest survive; (17) one cell grows into a colony; (18) the colony is labelled clone; (19) colonies turn blue or stay white; (20) **tap step**: the player taps a colony. White is correct ("insert in lacZ, so no blue"). Blue gives feedback ("blue: lacZ intact, so no insert"), try again.
6. **Read the sequence**: (21) a primer binds to the template; (22) chains grow and stop at different lengths (a ladder); (23) fragments race through a capillary, short ones first; (24) coloured peaks appear (A green, C blue, G black, T red, the usual dye colours) and the read sequence is printed. It contains `GAATTC` at the insert junction, tying back to scene 1; (25) the view zooms out to many reads running at once.

## Steps (content, verbatim; `___` is the blank)

Answer first, then the 3 distractors. Every word used must be in the word list below.

| # | Scene | Sentence | Answer | Distractors |
|---|---|---|---|---|
| 1 | Cut | We need an enzyme that recognises a short DNA sequence and cuts it there: a ___. | restriction endonuclease | DNA ligase · phosphatase · DNA polymerase |
| 2 | Cut | The short sequence it recognises, GAATTC, is called its ___. | restriction site | primer · insert · multiple cloning site |
| 3 | Cut | GAATTC reads the same 5'→3' on both strands, so it is a ___. | palindrome | plasmid · primer · clone |
| 4 | Cut | EcoRI cuts between G and A on each strand, leaving short single-stranded tails: ___. | sticky ends | blunt ends · primers · inserts |
| 5 | Carrier | To copy our gene we need a carrier DNA molecule that replicates on its own inside the host cell: a ___. | vector | insert · primer · colony |
| 6 | Carrier | Our vector, pUC18, is a small circular DNA molecule outside the bacterial chromosome: a ___. | plasmid | clone · palindrome · electropherogram |
| 7 | Carrier | pUC18 has a region with many unique restriction sites where the gene can go: the ___. | multiple cloning site | restriction site · selectable marker · primer |
| 8 | Carrier | The foreign DNA we put into the vector is called the ___. | insert | vector · primer · clone |
| 9 | Join | The cut vector could simply close on itself. To prevent this, we remove its 5'-phosphates with ___. | phosphatase | DNA ligase · restriction endonuclease · X-gal |
| 10 | Join | The matching sticky ends of vector and insert pair up by hydrogen bonds. This is called ___. | annealing | ligation · transformation · electroporation |
| 11 | Join | Gaps remain in the sugar-phosphate backbone. The enzyme that seals them with phosphodiester bonds is ___. | DNA ligase | restriction endonuclease · phosphatase · DNA polymerase |
| 12 | Join | A molecule made by joining DNA from two different sources is ___. | recombinant DNA | plasmid DNA · primer · clone |
| 13 | Bacteria | E. coli cells treated with a calcium salt solution have leaky membranes and can take up DNA. They are ___. | competent cells | clones · colonies · vectors |
| 14 | Bacteria | Introducing the plasmid into the bacterial cells is called ___. | transformation | ligation · annealing · blue-white screening |
| 15 | Bacteria | Instead of calcium, a strong electric current can drive DNA into cells. This is ___. | electroporation | capillary electrophoresis · annealing · ligation |
| 16 | Plate | The agar contains ampicillin. Only cells carrying pUC18 survive, because its ampicillin resistance gene is a ___. | selectable marker | multiple cloning site · restriction site · primer |
| 17 | Plate | A single cell divides again and again into a visible spot on the agar: a ___. | colony | plasmid · insert · vector |
| 18 | Plate | All the cells in it come from one parent cell, so they form a ___. | clone | vector · insert · palindrome |
| 19 | Plate | The agar also contains a colourless compound that turns blue when β-galactosidase cleaves it: ___. | X-gal | ampicillin · phosphatase · ddNTPs |
| 20 | Plate | *(tap step)* Tap a colony that carries our gene. | white colony → term revealed: **blue-white screening** | (blue colonies) |
| 21 | Sequence | Sanger sequencing starts from a short piece of DNA that provides the 3'-OH for DNA polymerase: a ___. | primer | insert · ddNTP · plasmid |
| 22 | Sequence | The reaction also contains nucleotides that lack the 3'-OH, so the chain stops when one is added: ___. | ddNTPs | dNTPs · primers · phosphatase |
| 23 | Sequence | In automated sequencers, the fragments are separated by size in arrays of thin tubes: ___. | capillary electrophoresis | electroporation · transformation · annealing |
| 24 | Sequence | A laser makes each fluorescent label glow. The computer plot of fluorescence peaks is an ___. | electropherogram | colony · palindrome · restriction site |
| 25 | Sequence | Newer machines sequence a huge number of DNA fragments at the same time: ___. | next-generation sequencing | capillary electrophoresis · blue-white screening · transformation |

Plural/singular forms (inserts, primers, clones, colonies, vectors, ddNTP) map to their word-list entry for the definition shown.

## Word list (term — definition — section), verbatim

8.3 Cutting and joining DNA
- **restriction endonuclease**: an enzyme that recognises a specific short DNA sequence and cuts both strands of the DNA there. (8.3)
- **restriction site**: the short DNA sequence that a restriction endonuclease recognises and cuts. (8.3)
- **palindrome**: a sequence that reads the same 5'→3' on both strands, e.g. GAATTC. (8.3)
- **sticky ends**: also called cohesive ends; short single-stranded tails left by a staggered cut, which can base-pair with matching tails. (8.3)
- **blunt ends**: ends with no unpaired nucleotides, made when both strands are cut at the same position (e.g. by SmaI). (8.3)
- **DNA ligase**: an enzyme that joins pieces of DNA by forming phosphodiester bonds; it needs ATP. (8.3)
- **ligation**: joining linear DNA fragments together with covalent bonds. (8.3)
- **annealing**: the pairing of complementary single-stranded DNA by hydrogen bonds, e.g. of matching sticky ends. (8.3)
- **recombinant DNA**: a DNA molecule made by joining DNA from different sources. (8.3)

8.4 Molecular cloning
- **vector**: a carrier DNA molecule that replicates independently in a host cell and carries the foreign DNA. (8.4)
- **plasmid**: a circular, double-stranded DNA molecule outside the chromosome that replicates on its own in bacteria. (8.4)
- **plasmid DNA**: DNA of a plasmid alone, without anything joined into it. (8.4)
- **insert**: the foreign DNA fragment joined into a vector. (8.4)
- **multiple cloning site**: a region of a vector with several unique restriction sites, each present only once. (8.4)
- **phosphatase**: an enzyme that removes the terminal 5'-phosphate, so a cut vector cannot be re-joined to itself by ligase. (8.4)
- **transformation**: introducing DNA into bacterial cells. (8.4)
- **competent cells**: cells made permeable (e.g. with a calcium salt solution) so they can take up DNA. (8.4)
- **electroporation**: driving DNA into cells with a strong electric current. (8.4)
- **selectable marker**: a gene, usually for antibiotic resistance, that lets only cells carrying the vector grow. (8.4)
- **ampicillin**: an antibiotic that blocks bacterial cell wall synthesis and kills dividing cells that lack the resistance gene. (8.4)
- **colony**: a visible group of millions of identical cells grown from one cell on an agar plate. (8.4)
- **clone**: a population of identical cells (or DNA copies) descended from a single parent cell. (8.4)
- **X-gal**: a colourless compound that β-galactosidase cleaves into a blue product. (8.4)
- **blue-white screening**: telling recombinant from non-recombinant colonies on X-gal: an insert in lacZ leaves the colony white, an intact lacZ makes it blue. (8.4)

8.7 DNA sequencing
- **primer**: a short single-stranded piece of DNA that provides the 3'-OH where DNA polymerase starts synthesis. (8.7)
- **DNA polymerase**: the enzyme that synthesises a new DNA strand from nucleotides. (8.7)
- **dNTPs**: normal deoxynucleotides (dATP, dCTP, dGTP, dTTP), the building blocks of DNA; they have a 3'-OH. (8.7)
- **ddNTPs**: dideoxynucleotides; they lack the 3'-OH, so the chain stops when one is added (chain terminators). (8.7)
- **capillary electrophoresis**: separating DNA fragments by size in thin capillary tubes, as in automated sequencers. (8.7)
- **electropherogram**: the computer plot of fluorescence intensity over time, read as the DNA sequence. (8.7)
- **next-generation sequencing**: newer methods that sequence a huge number of DNA fragments in parallel. (8.7)

## trainers.json entry

- id `english`, path `english/`
- name: lt "Anglų kalba", en "English"
- summary: lt "Molekulinės biologijos žodynas anglų kalba: DNR kirpimas ir jungimas, molekulinis klonavimas, DNR sekoskaita.", en "Molecular biology vocabulary in English: cutting and joining DNA, molecular cloning, DNA sequencing."
- note: lt "Pagal L. A. Allison „Fundamental Molecular Biology“, 8 skyrių · LT / EN", en "Based on L. A. Allison, Fundamental Molecular Biology, Ch 8 · LT / EN"

## Left to the builder

The visual style (it should sit with the site's look: fonts already loaded by the site, clean SVG), the exact animations, the file split inside `site/english/`, and the interface wording in LT/EN (short, natural Lithuanian).

## Change 2026-11-23: English only

At the user's request, the English trainer drops Lithuanian entirely. This replaces the "Interface text exists in LT and EN" constraint above for this trainer only (CLAUDE.md records the exception).
- The page is `<html lang="en">` with no LT/EN buttons. Every interface string, scene title and the no-JS note is English only. The trainer neither reads nor writes `beagle-lang`. The shared top bar follows `lang="en"`.
- `trainers.json`: the `lt` values of name, summary and note equal the `en` values (the shared code needs both keys). The static rows in `site/index.html` and `site/404.html` show the English text.
