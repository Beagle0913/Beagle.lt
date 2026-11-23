# English trainer ("Clone a gene") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `site/english/`, a vocabulary trainer with one lesson, "Clone a gene" (Allison Ch 8: 8.3, 8.4, 8.7): 6 animated scenes, 25 steps and a word list, for use at a projector and on phones.

**Architecture:** Same shape as `site/organic/`: plain scripts in a fixed order that build one global namespace, `globalThis.ENG`. Data (`lesson.js`) and logic (`engine.js`) are DOM-free, so they load in node through `vm` the way `tests/organic/load.js` does. `scenes.js` draws the SVG pictures. `ui.js` owns the DOM, the LT/EN strings and the keyboard.

**Tech Stack:** Plain HTML/CSS/JS, `node:test` for tests. No dependencies.

**Spec:** `docs/superpowers/specs/2026-11-23-english-trainer-design.md`. Read it first. Its step table and word list are the content, **copied verbatim**.

## Global Constraints

- Follow `CLAUDE.md` and the "Add a trainer" contract in `README.md`. The exact CSP + referrer meta tags are copied from `site/index.html`.
- CSP: no inline scripts/handlers and no `style="…"` attributes (assigning `el.style.prop` from a script file is fine). Build SVG with `document.createElementNS`; all text goes in through `textContent`.
- Interface strings in `lt` and `en` (LT default). Lesson content (sentences, words, definitions) is English in both languages.
- `<html lang>` follows the trainer's LT/EN buttons and `beagle-lang`; copy how `site/organic/js/ui.js` does it. No other storage.
- Animations respect `prefers-reduced-motion: reduce`: no motion, final states still shown.
- `npm test` passes before every commit. Work on branch `english-trainer`; do not push, do not touch `main`.

## Review Focus

1. **Projector at 1366×768**: the scene picture, the sentence and all 4 buttons are visible without scrolling; body text ≥ 22px, buttons ≥ 24px.
2. **Phone at 375px**: buttons stack in one column, the SVG scales to width, no horizontal scroll.
3. **Clicks during an animation**, or Next pressed before it ends: state stays consistent; a second click on the correct button doesn't score twice.
4. **Back to a solved step**: shows the filled blank and the picture in its "after" state. It is not re-scored and has no buttons to answer again.
5. **Switching LT↔EN mid-lesson** keeps the current scene and step.

Items 1–2 and 5 are checked in the browser by the reviewer. Items 3–4 are pinned by engine tests (Task 2).

---

### Task 1: Lesson data + content tests

**Files:**
- Create: `site/english/js/lesson.js`, `tests/english/load.js`, `tests/english/content.test.js`
- Modify: `package.json` (add `"tests/english/*.test.js"` to the `node --test` list)

**Interfaces:**
- Produces `ENG.lesson = { id: 'ch8-cloning', title: 'Clone a gene', chapter: 'Ch 8 · 8.3, 8.4, 8.7', scenes: Scene[], glossary: Entry[] }`
  - `Scene = { id: 'cut'|'carrier'|'join'|'bacteria'|'plate'|'sequence', title: {lt, en}, steps: Step[] }`
  - `Step = { type: 'choice', text, answer, distractors: [3 strings] }` or `{ type: 'tap', text: 'Tap a colony that carries our gene.', term: 'blue-white screening' }`
  - `Entry = { term, def, section: '8.3'|'8.4'|'8.7', forms: [] }`. `forms` holds the other spellings used in steps (`inserts`, `primers`, `clones`, `colonies`, `vectors`, `ddNTP`).
- Produces `tests/english/load.js` → `load()` returns `ENG` from a vm context (model it on `tests/organic/load.js`, files `['lesson.js','engine.js']`, skipping missing ones).
- Scene titles: cut "Kirpimas"/"Cut", carrier "Nešiklis"/"Choose a carrier", join "Jungimas"/"Join", bacteria "Į bakterijas"/"Into bacteria", plate "Auginimas ir atranka"/"Grow and pick", sequence "Sekos skaitymas"/"Read the sequence".

- [ ] **Step 1: Write `content.test.js`** with these tests:
  - `six scenes with 4,4,4,3,5,5 steps (25 total)`: in the scene order above.
  - `every choice step has exactly one blank and 4 distinct words`: `text.split('___').length === 2`, and `new Set([answer, ...distractors]).size === 4`.
  - `every word used resolves to a word-list entry`: every answer, distractor and tap term matches some entry's `term` or `forms`.
  - `word list has 31 entries, each used at least once`: unique terms, non-empty `def`, valid `section`.
  - `step 20 is the tap step for blue-white screening` (scene `plate`, index 4).
  - `content is verbatim from the spec`: assert the exact text of step 3 (`GAATTC reads the same 5'→3' on both strands, so it is a ___.`), step 22, and the `palindrome` and `ddNTPs` definitions, with the spec's exact characters (`→`, `'`, `β`).
  - `scene titles exist in lt and en`.
- [ ] **Step 2:** `node --test tests/english/content.test.js` → FAIL (no lesson.js).
- [ ] **Step 3:** Write `lesson.js` from the spec's step table and word list, verbatim.
- [ ] **Step 4:** `npm test` → all PASS.
- [ ] **Step 5:** Commit `English trainer: lesson data and content tests`.

### Task 2: Engine + tests

**Files:** Create `site/english/js/engine.js` and `tests/english/engine.test.js`.

**Interfaces (all on `ENG`, no DOM):**
- `shuffle(arr, rand = Math.random) → new array` (Fisher–Yates; does not mutate).
- `entryFor(word, lesson) → Entry | null` (matches `term` or `forms`).
- `newGame(lesson, rand) → Game`, where `Game = { pos: {scene, step}, steps: [{scene, step, choices: string[] (shuffled, 4 for choice / [] for tap), solved: false, firstTry: null}] }` (a flat list of 25).
- `current(game) → flat index`; `goto(game, flatIndex)` clamps to 0..24.
- `answer(game, word) → { correct, entry }`. `word` is a word or, for the tap step, `'white'`/`'blue'`. On a solved step it returns `{correct: true, entry, already: true}` and changes nothing. The first answer sets `firstTry`. A wrong answer leaves `solved` false. For the tap step a wrong pick returns `entry` = the blue-white screening entry.
- `score(game) → { firstTry: n, total: 25 }`.

- [ ] **Step 1: Write the tests**: shuffle gives a permutation and is deterministic with a seeded rand (write a tiny seeded rand in the test); `entryFor('colonies')` → colony, `entryFor('ddNTP')` → ddNTPs, `entryFor('nonsense')` → null; wrong-then-right gives `firstTry === false` and solved; right first time gives `firstTry === true`; answering a solved step again doesn't change the score (`already: true`); `goto(-1)` → 0 and `goto(99)` → 24; tap step: `'blue'` is wrong, `'white'` is right; after all 25 answered right first time, `score` → `{firstTry: 25, total: 25}`; a wrong answer's `entry.def` is the chosen word's definition.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `English trainer: engine`.

### Task 3: Page, scenes, UI, listing

**Files:**
- Create: `site/english/index.html`, `site/english/trainer.css`, `site/english/js/scenes.js`, `site/english/js/ui.js`, `site/english/README.md` (short, like `site/organic/README.md`)
- Modify: `site/trainers.json` (entry verbatim from the spec), `site/index.html` and `site/404.html` (static rows, copied from the existing rows), `README.md` (layout block lists `english/` and `tests/english/`)

**Interfaces:**
- `ENG.drawScene(svg, sceneId, solvedCount, animate)` clears `svg` and draws the scene in the state after `solvedCount` of its steps are solved. With `animate` true, the newest change gets a CSS animation class. Required beats per step: spec section "Scenes and pictures". One `viewBox` per scene (e.g. `0 0 800 360`) with `preserveAspectRatio` so it scales.
- Plate tap step: colonies are `<g>` elements with `data-colony="white"|"blue"`, `role="button"`, `tabindex="0"`, and an `aria-label`. `ui.js` sends clicks/Enter on them to `ENG.answer(game, 'white'|'blue')`.
- `ui.js` holds `STR = {lt:{…}, en:{…}}` with the same keys. It renders Start → Scene → End as in the spec "Screens" section, the word list grouped by section, a feedback box (correct: "✓"; wrong: the chosen word in bold + its definition), and Back/Next. Keys: `1`–`4` pick, `→`/`Enter` next, `←` back. Ignore keys while focus is in the language buttons.
- Script order in `index.html`: `lesson.js, engine.js, scenes.js, ui.js`. Fonts link as in `site/organic/index.html`. Add the `nojs` fallback paragraph.

- [ ] **Step 1:** Add a test to `content.test.js`: `ui strings have the same keys in lt and en, all non-empty`. Load `ui.js` text with `fs` and pull the `STR` object out (or put `STR` in a separate DOM-free `strings.js`; if you do, load it in `load.js`). Run → FAIL.
- [ ] **Step 2:** Build page, CSS, scenes, UI. Style: the site's fonts (IBM Plex Sans), white/ink with one accent, dark mode through `prefers-color-scheme` like the organic trainer. Projector sizes per Review Focus 1.
- [ ] **Step 3:** Update `trainers.json`, `index.html`, `404.html`, `README.md`.
- [ ] **Step 4:** `npm test` → PASS (including `tests/site/pages.test.js`, which checks the CSP and the listing).
- [ ] **Step 5:** Open the page through a local server (`npm run preview`, http://localhost:8000/english/). Play all 25 steps once. Check that the console has no errors (CSP violations included).
- [ ] **Step 6:** Commit `English trainer: page, scenes and listing`.
