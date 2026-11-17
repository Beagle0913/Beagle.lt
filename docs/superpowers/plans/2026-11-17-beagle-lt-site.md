# beagle.lt Site and Maths Trainer Move Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a trainer home page on https://beagle.lt/, move the maths trainer to https://beagle.lt/math/ unchanged, and redirect its old address.

**Architecture:** A plain static site in `site/`, published to GitHub Pages by a workflow that runs the tests first. `site/shared/site.js` draws the home-page trainer list and a top bar on trainer pages from `site/trainers.json`. Each trainer is a self-contained folder under `site/`.

**Tech Stack:** HTML, CSS and browser JavaScript with no build step and no dependencies. Node 26 built-ins (`node:test`, `node:assert`) for tests. GitHub Actions, GitHub Pages, the `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-11-17-beagle-lt-site-design.md`. Read it before starting any task.

## Global Constraints

- Implementers are Sonnet agents. The controller (main session) dispatches, reviews, and runs the gates below.
- Repo folder: `C:\Users\dziug\Desktop\Silly\ChemBOT`. GitHub repo: `Beagle0913/beagle.lt`, public, branch `main`.
- `SRC` is a clone of `https://github.com/Beagle0913/Beagle0913.github.io.git` at commit `7cf4815`, cloned with `core.autocrlf=false`. The controller gives you its path. Treat it as read-only in Tasks 1 to 4.
- No build step, no framework, no npm dependencies. `package.json` holds scripts only.
- No analytics, trackers or third-party scripts. The only outside hosts are `fonts.googleapis.com` (styles) and `fonts.gstatic.com` (fonts).
- Every `.html` file under `site/` carries exactly this tag, plus `<meta name="referrer" content="no-referrer">`:
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'">`
- No inline `<script>`, no inline event handlers.
- Text from `trainers.json` or browser storage reaches the page through `textContent` only. Links built from `trainers.json` must stay under the site root.
- Browser storage keys: `beagle-lang` (`lt` or `en`) for the site language, `beagle-<trainer id>-v1` for a trainer's progress. All storage access is wrapped so a blocked store never throws.
- Lithuanian is the default language. Every interface string exists in `lt` and `en`.
- Only trainers that exist are listed. No "coming soon" rows.
- `site/math/` differs from `SRC/math-trainer/` only in the four ways Task 1 lists.
- Line endings are LF.
- Commits use this repo-local identity (never `--global`): name `Beagle0913`, email `132080045+Beagle0913@users.noreply.github.com`. End commit messages with the co-author line your own session instructions give you.
- If `node`, `npm` or `gh` is "not found" in Git Bash, run `export PATH="/c/Program Files/nodejs:/c/Program Files/GitHub CLI:$PATH"` first.
- Nothing is pushed, no GitHub repo is created and no Pages setting is changed outside Task 4. Nobody but the controller merges the old-site pull request.
- If a step's expected result does not appear, stop and report what you saw. Do not work around it.

## Review Focus

1. Browser storage blocked or throwing (private window, site data blocked): the home page, the bar and the language buttons still work for that page view, in Lithuanian by default. Pinned in Task 2 ("blocked or missing storage never throws").
2. `trainers.json` fails to load or is malformed (offline, a bad edit): the home and 404 pages still show a working link to every trainer, and a trainer page still gets its bar with the home link. Pinned in Task 2 (`cleanTrainers`, `barModel([])`) and Task 3 ("home and 404 pages work without the list loading").
3. The stored language is something unexpected (`de`, empty, a leftover value): the site opens in Lithuanian. Pinned in Task 2 (`normLang`).
4. Phone-width screens, 320 to 375 px: no sideways scrolling on the home page, the 404 page or the bar, and long names wrap. Pinned in Gate A, check 7.
5. A shared link without the trailing slash (`beagle.lt/math`): it lands on the trainer. Pinned in Task 4, Step 9.

## File Structure

```
.gitattributes, .gitignore        LF line endings; ignore OS junk
package.json                      scripts only: test, preview
.claude/launch.json               local preview server for the controller's browser checks
CLAUDE.md                         working rules for agents
README.md                         what the repo is, layout, how to add a trainer
.github/workflows/deploy.yml      tests, then publish site/
site/index.html                   home page
site/404.html                     not-found page
site/trainers.json                the list of trainers
site/shared/site.js               pure helpers (exported for tests) + the browser part
site/shared/site.css              top bar + home/404 page styles
site/math/                        the maths trainer, moved
tests/math/test.js                the trainer's test suite, moved
tests/site/core.test.js           tests for site.js helpers
tests/site/pages.test.js          checks on the published pages and trainers.json
```

---

### Task 1: Repo setup and maths trainer move

**Files:**
- Create: `.gitattributes`, `.gitignore`, `package.json`, `.claude/launch.json`
- Create by copy from `SRC/math-trainer/`: `site/math/index.html`, `site/math/trainer.css`, `site/math/README.md`, `site/math/js/*.js` (nine files)
- Create by move: `tests/math/test.js` (from `SRC/math-trainer/tools/test.js`)
- Already present, commit as they are: `docs/superpowers/specs/…`, `docs/superpowers/plans/…`

**Interfaces:**
- Consumes: `SRC` path from the controller.
- Produces: `npm test` (runs the maths suite); `site/math/index.html` expecting `../shared/site.css`, `../shared/site.js`, `<body data-trainer="math">` and `<div id="sitebar"></div>`, which Tasks 2 and 3 supply.

- [ ] **Step 1: Initialise the repo**

```bash
cd "C:/Users/dziug/Desktop/Silly/ChemBOT"
git init -b main
git config core.autocrlf false
git config user.name "Beagle0913"
git config user.email "132080045+Beagle0913@users.noreply.github.com"
```

- [ ] **Step 2: Write the four small files**

`.gitattributes`: one line, `* text=auto eol=lf`.

`.gitignore`: `node_modules/`, `.DS_Store`, `Thumbs.db`, `*.log`.

`package.json`:

```json
{
  "name": "beagle.lt",
  "private": true,
  "description": "Trainer site served at https://beagle.lt/",
  "scripts": {
    "test": "node tests/math/test.js 2000",
    "preview": "python -m http.server 8000 --directory site"
  }
}
```

`.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "site", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8000", "--directory", "site"], "port": 8000 }
  ]
}
```

- [ ] **Step 3: Copy the trainer and move its test out**

```bash
mkdir -p site tests/math
cp -r "$SRC/math-trainer" site/math
mv site/math/tools/test.js tests/math/test.js
rmdir site/math/tools
```

- [ ] **Step 4: Run the moved test to see it fail**

Run: `node tests/math/test.js 50`
Expected: an `ENOENT` error naming `core.js`, because the scripts are no longer at `../js`.

- [ ] **Step 5: Point the test at the new script folder**

In `tests/math/test.js`, replace line 14 (`const dir = fs.existsSync(…)`) with:

```js
const dir = path.join(__dirname, '..', '..', 'site', 'math', 'js');
```

and change the header comment's run line to `Run:  node tests/math/test.js [problems per type, default 400]`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `node tests/math/test.js 2000`
Expected: last line `ALL PASS`, exit code 0.

- [ ] **Step 7: Make the speed check warn, not fail, inside the workflow**

In `tests/math/test.js`, replace the line `if (slow.length) fail('slow generators (µs per problem)', …);` with:

```js
const slowMsg = slow.map(x => x.id + ':' + x.us.toFixed(0)).join(' ');
if (slow.length) { if (process.env.CI) console.log('WARN slow generators (µs per problem)', slowMsg); else fail('slow generators (µs per problem)', slowMsg); }
```

Prove both branches once: temporarily change the threshold `1500` to `0`, then
- `node tests/math/test.js 50` → prints `FAIL slow generators`, ends `FAILS: 1`, exit code 1;
- `CI=true node tests/math/test.js 50` → prints `WARN slow generators`, ends `ALL PASS`, exit code 0.

Restore `1500` and re-run Step 6.

- [ ] **Step 8: Rename the trainer's storage keys**

`site/math/js/ui.js` line 27 becomes:

```js
  const KEY = 'beagle-math-v1', LKEY = 'beagle-lang';
```

- [ ] **Step 9: Point the trainer page at the new bar**

In `site/math/index.html`, change exactly these four lines (15, 16, 18, 19):

```html
<link rel="stylesheet" href="../shared/site.css">
<script src="../shared/site.js" defer></script>
<body data-trainer="math">
<div id="sitebar"></div>
```

- [ ] **Step 10: Update the trainer's README**

In `site/math/README.md`: remove the `tools/test.js` line from the Files block, add one sentence saying the tests live in `tests/math/test.js` at the repo root, and change the test command to `node tests/math/test.js 2000` (run from the repo root). Change nothing else.

- [ ] **Step 11: Check the move changed nothing else**

Run: `git diff --no-index --stat "$SRC/math-trainer" site/math` (exit code 1 is normal when files differ)
Expected: exactly three changed files, `README.md`, `index.html` (4 lines changed) and `js/ui.js` (1 line changed), plus `tools/test.js` listed as removed.

Run: `git diff --no-index "$SRC/math-trainer/tools/test.js" tests/math/test.js`
Expected: only the header run line, line 14, and the speed-check line differ.

- [ ] **Step 12: Run the whole suite through npm**

Run: `npm test`
Expected: `ALL PASS`, exit code 0.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Add the maths trainer, moved from Beagle0913/Beagle0913.github.io@7cf4815" -m "Differences from the source: bar links and hooks in index.html, storage keys in ui.js, the test moved to tests/math/ with its path and speed check adjusted, README paths."
```

---

### Task 2: Site helpers (`site.js` core)

**Files:**
- Create: `site/shared/site.js`
- Test: `tests/site/core.test.js`
- Modify: `package.json` (test script)

**Interfaces:**
- Consumes: nothing.
- Produces: under Node, `require('site/shared/site.js')` returns this object. Task 3's browser code and both test files use these names.
  - `LANG_KEY`: `'beagle-lang'`
  - `normLang(value: any): 'lt' | 'en'`, `'en'` only for exactly `'en'`
  - `readLang(storage): 'lt' | 'en'`, never throws
  - `writeLang(storage, lang): void`, never throws, stores `normLang(lang)`
  - `pick(text, lang): string`, for `{lt, en}` text objects
  - `validTrainer(entry: any): boolean`
  - `trainerUrl(entry, rootHref: string): string`
  - `cleanTrainers(data: any): entry[]`
  - `barModel(trainers: entry[], currentId: string, lang, rootHref): { homeHref, label, choose, options: { href, text, current }[] }`
  - `STR: { lt: {…}, en: {…} }`, the interface texts below

- [ ] **Step 1: Write the failing tests**

`tests/site/core.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../site/shared/site.js');

const ROOT = 'https://beagle.lt/';
const math = { id: 'math', path: 'math/', name: { lt: 'Matematika', en: 'Mathematics' } };
const physics = { id: 'physics', path: 'physics/', name: { lt: 'Fizika', en: 'Physics' } };
const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };

test('normLang accepts only lt and en, defaulting to lt', () => {
  assert.equal(core.normLang('en'), 'en');
  for (const v of ['lt', 'de', '', 'EN', null, undefined, 5, {}]) assert.equal(core.normLang(v), 'lt');
});

test('language survives a round trip through storage under beagle-lang', () => {
  const s = mem();
  assert.equal(core.LANG_KEY, 'beagle-lang');
  assert.equal(core.readLang(s), 'lt');
  core.writeLang(s, 'en');
  assert.equal(s.getItem('beagle-lang'), 'en');
  assert.equal(core.readLang(s), 'en');
  core.writeLang(s, 'de');
  assert.equal(s.getItem('beagle-lang'), 'lt');
});

test('blocked or missing storage never throws and reads as lt', () => {
  assert.equal(core.readLang(throwing), 'lt');
  assert.equal(core.readLang(null), 'lt');
  assert.doesNotThrow(() => core.writeLang(throwing, 'en'));
  assert.doesNotThrow(() => core.writeLang(undefined, 'en'));
});

test('pick returns the asked language, then the other, then empty', () => {
  assert.equal(core.pick({ lt: 'A', en: 'B' }, 'en'), 'B');
  assert.equal(core.pick({ lt: 'A' }, 'en'), 'A');
  assert.equal(core.pick({ en: 'B' }, 'lt'), 'B');
  assert.equal(core.pick('plain', 'en'), 'plain');
  for (const v of [null, undefined, {}, { lt: 5 }, 7]) assert.equal(core.pick(v, 'lt'), '');
});

test('validTrainer needs a safe id, a path and a name in both languages', () => {
  assert.equal(core.validTrainer(math), true);
  for (const bad of [null, 'math', {}, { ...math, id: 'Math' }, { ...math, id: 'a b' }, { ...math, id: '' },
    { ...math, path: '' }, { ...math, path: 3 }, { ...math, name: 'Matematika' }, { ...math, name: { lt: 'Matematika' } }, { ...math, name: { lt: '', en: 'x' } }])
    assert.equal(core.validTrainer(bad), false);
});

test('trainerUrl stays under the site root', () => {
  assert.equal(core.trainerUrl(math, ROOT), 'https://beagle.lt/math/');
  assert.equal(core.trainerUrl(math, 'http://localhost:8000/'), 'http://localhost:8000/math/');
  for (const p of ['https://evil.example/', '//evil.example/x', 'javascript:alert(1)', 'http://beagle.lt/math/'])
    assert.equal(core.trainerUrl({ ...math, path: p }, ROOT), ROOT, p);
  const sub = 'https://example.org/site/';
  for (const p of ['../other/', '/other/']) assert.equal(core.trainerUrl({ ...math, path: p }, sub), sub, p);
});

test('cleanTrainers drops bad and repeated entries and survives garbage', () => {
  assert.deepEqual(core.cleanTrainers({ trainers: [math, { id: 'X' }, physics, { ...math, path: 'other/' }] }), [math, physics]);
  for (const junk of [null, undefined, 'x', [], {}, { trainers: 'math' }, { trainers: null }]) assert.deepEqual(core.cleanTrainers(junk), []);
});

test('barModel always has the home link and lists trainers only when there are two or more', () => {
  assert.deepEqual(core.barModel([], 'math', 'lt', ROOT), { homeHref: ROOT, label: 'Treniruokliai', choose: 'Pasirinkite treniruoklį', options: [] });
  assert.deepEqual(core.barModel([math], 'math', 'en', ROOT).options, []);
  assert.deepEqual(core.barModel([math, physics], 'math', 'en', ROOT), {
    homeHref: ROOT, label: 'Trainers', choose: 'Choose a trainer',
    options: [{ href: 'https://beagle.lt/math/', text: 'Mathematics', current: true }, { href: 'https://beagle.lt/physics/', text: 'Physics', current: false }]
  });
});

test('every interface text exists in both languages', () => {
  assert.deepEqual(Object.keys(core.STR.lt).sort(), Object.keys(core.STR.en).sort());
  for (const lang of ['lt', 'en']) for (const [k, v] of Object.entries(core.STR[lang])) assert.ok(typeof v === 'string' && v.length > 0, lang + '.' + k);
  assert.equal(core.STR.lt.heading, 'Treniruokliai');
  assert.equal(core.STR.en.heading, 'Trainers');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/site/core.test.js`
Expected: FAIL with "Cannot find module" for `site/shared/site.js`.

- [ ] **Step 3: Implement the helpers in `site/shared/site.js`**

One file, one wrapper function. The helpers come first; then this line hands them to Node and stops, so the browser part Task 3 adds below it never runs under Node:

```js
if (typeof module === 'object' && module.exports) { module.exports = core; return; }
```

Modern syntax as in `site/math/js/ui.js` is fine. `STR` holds exactly these texts:

| key | lt | en |
|---|---|---|
| `home_title` | `beagle.lt – treniruokliai` | `beagle.lt – trainers` |
| `heading` | `Treniruokliai` | `Trainers` |
| `lede` | `Universitetinio lygio uždaviniai, sprendžiami žingsnis po žingsnio. Uždaviniai kaskart generuojami iš naujo, o kiekvienas žingsnis patikrinamas iškart.` | `University-level problems, solved one step at a time. Problems are generated fresh every time, and each step is checked as soon as you enter it.` |
| `open` | `Atverti →` | `Open →` |
| `privacy` | `Niekas nerenkama ir niekur nesiunčiama. Pažanga saugoma tik jūsų naršyklėje.` | `Nothing is collected or sent anywhere. Your progress is kept only in your browser.` |
| `source` | `Pirminis kodas` | `Source code` |
| `lang_label` | `Kalba` | `Language` |
| `bar_label` | `Treniruokliai` | `Trainers` |
| `choose` | `Pasirinkite treniruoklį` | `Choose a trainer` |
| `nf_title` | `Puslapis nerastas` | `Page not found` |
| `nf_heading` | `Tokio puslapio nėra` | `This page does not exist` |
| `nf_lede` | `Adresas gali būti pasenęs arba įvestas su klaida. Šios svetainės treniruokliai:` | `The address may be old or mistyped. These are the trainers on this site:` |
| `nf_home` | `Į pradžią` | `Home` |

`trainerUrl` resolves `entry.path` against `rootHref` and returns the result only when it has the root's origin and starts with `rootHref`; otherwise, or on any error, it returns `rootHref`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/site/core.test.js`
Expected: 9 tests pass, 0 fail.

- [ ] **Step 5: Add the tests to `npm test` and commit**

`package.json` test script becomes `node --test tests/site/core.test.js && node tests/math/test.js 2000`.

Run: `npm test` → all pass.

```bash
git add site/shared/site.js tests/site/core.test.js package.json
git commit -m "Add site helpers: language, trainer list checks, bar model"
```

---

### Task 3: Home page, 404 page, top bar and working rules

**Files:**
- Create: `site/trainers.json`, `site/index.html`, `site/404.html`, `site/shared/site.css`, `README.md`, `CLAUDE.md`
- Modify: `site/shared/site.js` (add the browser part below the Node line), `package.json`
- Test: `tests/site/pages.test.js`

**Interfaces:**
- Consumes: every helper from Task 2, by the names in its Interfaces block.
- Produces, the page contract (README documents it; future trainers follow it):
  - Trainer page: `<link rel="stylesheet" href="../shared/site.css">`, `<script src="../shared/site.js" defer></script>`, `<body data-trainer="ID">`, and `<div id="sitebar"></div>` as the first element of the body.
  - Home and 404 pages: `<body class="home" data-title="KEY">`; `<ol id="trainer-list">`; `<div id="langs">` holding `<button type="button" data-lang="lt">LT</button>` and `<button type="button" data-lang="en">EN</button>`; any element with `data-i18n="KEY"` gets `STR[lang][KEY]` as its text.
  - `site/trainers.json`: `{ "trainers": [ { id, path, name: {lt, en}, summary: {lt, en}, note: {lt, en} } ] }`.

- [ ] **Step 1: Write the failing tests**

`tests/site/pages.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../../site/shared/site.js');

const SITE = path.join(__dirname, '..', '..', 'site');
const CSP = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'";
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const read = f => fs.readFileSync(f, 'utf8');
const pages = walk(SITE).filter(f => f.endsWith('.html'));
const data = JSON.parse(read(path.join(SITE, 'trainers.json')));

test('every page carries the strict policy and no inline script', () => {
  assert.ok(pages.length >= 3);
  for (const f of pages) {
    const html = read(f);
    assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`), 'policy: ' + f);
    assert.ok(html.includes('<meta name="referrer" content="no-referrer">'), 'referrer: ' + f);
    assert.equal(/<script(?![^>]*\bsrc=)/i.test(html), false, 'inline script: ' + f);
    assert.equal(/\son[a-z]+\s*=/i.test(html), false, 'inline handler: ' + f);
  }
});

test('trainers.json lists only valid trainers that exist, wired to the bar', () => {
  assert.ok(Array.isArray(data.trainers) && data.trainers.length >= 1);
  assert.deepEqual(core.cleanTrainers(data), data.trainers);
  for (const t of data.trainers) {
    assert.match(t.path, /^[a-z0-9-]+\/$/);
    const html = read(path.join(SITE, t.path, 'index.html'));
    assert.ok(html.includes(`data-trainer="${t.id}"`), t.id);
    assert.ok(html.includes('<div id="sitebar"></div>'), t.id);
    assert.ok(html.includes('href="../shared/site.css"') && html.includes('src="../shared/site.js"'), t.id);
    for (const lang of ['lt', 'en']) assert.ok(t.summary && t.summary[lang] && t.note && t.note[lang], t.id + ' texts ' + lang);
  }
});

test('home and 404 pages work without the list loading', () => {
  const home = read(path.join(SITE, 'index.html')), nf = read(path.join(SITE, '404.html'));
  for (const t of data.trainers) {
    assert.ok(home.includes(`href="${t.path}"`) && home.includes(t.name.lt), 'home link ' + t.id);
    assert.ok(nf.includes(`href="/${t.path}"`) && nf.includes(t.name.lt), '404 link ' + t.id);
  }
  assert.ok(nf.includes('href="/shared/site.css"') && nf.includes('src="/shared/site.js"'));
});

test('every text key used on the pages exists in both languages', () => {
  for (const f of ['index.html', '404.html']) {
    const keys = [...read(path.join(SITE, f)).matchAll(/data-(?:i18n|title)="([^"]+)"/g)].map(m => m[1]);
    assert.ok(keys.length > 0, f);
    for (const k of keys) assert.ok(core.STR.lt[k] && core.STR.en[k], f + ' ' + k);
  }
});

test('nothing in site/ still points at the old site', () => {
  for (const f of walk(SITE).filter(f => /\.(html|js|css|json)$/.test(f)))
    assert.equal(/hub\/hub|hubbar|data-project|beagle0913\.github\.io|gmc-math-trainer/i.test(read(f)), false, f);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/site/pages.test.js`
Expected: FAIL with `ENOENT` for `site/trainers.json`.

- [ ] **Step 3: Write `site/trainers.json`**

```json
{
  "trainers": [
    {
      "id": "math",
      "path": "math/",
      "name": { "lt": "Matematika", "en": "Mathematics" },
      "summary": {
        "lt": "Koordinatės, vektoriai, matricos, determinantai ir tiesinių lygčių sistemos, kompleksiniai skaičiai, tikrinės reikšmės, ribos.",
        "en": "Coordinates, vectors, matrices, determinants and linear systems, complex numbers, eigenvalues, limits."
      },
      "note": {
        "lt": "Pagal VU GMC pratybas · LT / EN",
        "en": "Follows the VU GMC pratybos · LT / EN"
      }
    }
  ]
}
```

- [ ] **Step 4: Write `site/index.html` and `site/404.html`**

Both follow the layout sketched in the spec ("Home page"). Requirements the sketch does not show:

- `<html lang="lt">`, the policy and referrer tags from Global Constraints, a viewport tag, a data-URI SVG page icon.
- Fonts: `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=STIX+Two+Text:wght@400;600&display=swap`, with the two `preconnect` links the trainer page uses.
- Every visible text is the Lithuanian `STR` text, on an element carrying the matching `data-i18n` key, so the page reads correctly before and without JavaScript.
- `#trainer-list` ships with the finished Lithuanian row for each trainer as static HTML (number, name, summary, note, "Atverti →", the whole row one link). The script re-draws it; if the script or the list fails, these rows stay and work.
- Home page: `data-title="home_title"`, links relative (`shared/site.css`, `shared/site.js`, `math/`). Footer: the `privacy` text and a `source` link to `https://github.com/Beagle0913/beagle.lt`.
- 404 page: `data-title="nf_title"`, heading `nf_heading`, lede `nf_lede`, an `nf_home` link to `/`, and absolute links throughout (`/shared/site.css`, `/shared/site.js`, `/math/`) because it is served at any depth.

- [ ] **Step 5: Add the browser part to `site/shared/site.js`**

Below the Node line. Behaviour:

- Site root: `new URL('../', document.currentScript.src).href`.
- **On a trainer page** (`document.body.dataset.trainer` is set): the language is `normLang(document.documentElement.lang)`. Replace `#sitebar` at once with `<nav class="sitebar">` holding the home link, whose text is `← beagle.lt` in both languages, so the bar exists even if the list never loads. When the list arrives, draw the switcher from `barModel(...)`: a `<select>` whose `change` goes to the chosen address; nothing when `options` is empty. Watch `<html lang>` with a `MutationObserver` and re-apply the labels and option texts when it changes. On `pageshow`, set the `<select>` back to the current trainer.
- **On the home and 404 pages** (`body.home`): the language is `readLang(localStorage)`. Applying a language sets `<html lang>`, `document.title` from `data-title`, every `data-i18n` text, `aria-pressed` on the two language buttons, the `#langs` group's `aria-label`, and re-draws the list. A language button writes the choice with `writeLang` and applies it.
- Fetch `trainers.json` from the site root, pass the result through `cleanTrainers`, build every link with `trainerUrl`. If the fetch or the JSON fails, leave the static rows alone and show no error.
- `localStorage` itself can throw when read as a property; reach it inside `try`.

- [ ] **Step 6: Write `site/shared/site.css`**

Two parts, as in `SRC/hub/hub.css`: the bar (`.sitebar`), which carries its own colours so it looks the same on any trainer, and the home/404 page (`body.home`), whose colour tokens are set on `body.home` so they never leak into a trainer.

- Take the colours from `site/math/trainer.css` (`--paper`, `--sheet`, `--ink`, `--ink2`, `--line`, `--accent`, light and dark values) so the home page and the trainer read as one site. Dark theme follows the system setting with the same `:root:not([data-theme="light"])` guard `trainer.css` uses.
- IBM Plex Sans for text; STIX Two Text for the page heading and trainer names.
- One column, about 720 px wide at most; trainers as ruled rows, not cards.
- No sideways scrolling from 320 px up; long names and summaries wrap.
- Visible keyboard focus on links, buttons and the switcher.

- [ ] **Step 7: Run the tests to verify they pass**

`package.json` test script becomes `node --test tests/site/core.test.js tests/site/pages.test.js && node tests/math/test.js 2000`.

Run: `npm test`
Expected: 14 `node:test` tests pass, then `ALL PASS`.

- [ ] **Step 8: Check the pages are served**

Run `npm run preview` in the background, then:

```bash
for p in / /math/ /404.html /trainers.json /shared/site.js /shared/site.css; do curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:8000$p"; done
```

Expected: six lines starting `200`. Stop the server.

- [ ] **Step 9: Write `README.md` and `CLAUDE.md`**

`README.md`: what the site is (one paragraph), the layout tree from this plan's File Structure, "Add a trainer" (the page contract above, a `trainers.json` entry, the storage key rule, tests under `tests/<id>/` added to the `npm test` script), "Preview" (`npm run preview`, then http://localhost:8000), "Test" (`npm test`), and the safety rules from the spec's Constraints.

`CLAUDE.md`, exactly:

```markdown
# beagle.lt

Trainer site served at https://beagle.lt/. Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Who does what

- Development in this repo is done by Sonnet agents. The main session writes designs (`docs/superpowers/specs/`) and build plans (`docs/superpowers/plans/`), reviews, and checks the result.
- If you are the main session, do not write site code yourself. Dispatch a Sonnet agent.

## Layout

- `site/` is the only folder that is published. Everything in it is public at beagle.lt.
- `site/trainers.json` lists the trainers. `site/shared/site.js` and `site.css` draw the home page list and the top bar from it.
- One folder per trainer under `site/` (`site/math/`). A trainer keeps its own styles and scripts.
- `tests/` holds the tests: one folder per trainer, plus `tests/site/`.
- `README.md` explains how to add a trainer.

## Rules

- Run `npm test` before every commit that touches `site/` or `tests/`. It must pass.
- `main` publishes. Once the site is live, work on a branch and open a pull request. Do not commit to `main` directly.
- Every page carries the Content-Security-Policy meta tag used by `site/index.html`. Do not loosen it. No inline scripts, no inline event handlers, no third-party scripts, no analytics.
- Text that comes from `trainers.json` or from browser storage goes on the page with `textContent`, never as HTML. Links built from `trainers.json` must stay on this site.
- Every piece of interface text exists in Lithuanian and English. Lithuanian is the default.
- A change to a maths generator is made in both languages (`gen*.js` and `lt*.js`).
- Browser storage keys: `beagle-lang` for the site language, `beagle-<trainer id>-v1` for a trainer's progress.
- List only trainers that exist. No "coming soon" entries.
- Nothing is collected from visitors or sent anywhere.
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Add the home page, 404 page, top bar and working rules"
```

---

### Gate A (controller): local browser check

Start the `site` preview (`.claude/launch.json`) and check in the browser:

1. Home page opens in Lithuanian and lists Matematika. EN switches every text; a reload keeps English.
2. Opening the trainer from the English home page opens it in English. The bar shows `← beagle.lt` and no switcher.
3. Pressing LT inside the trainer changes the bar's `aria-label` to `Treniruokliai` without a reload; going home shows Lithuanian.
4. The trainer generates a problem, accepts a correct step, rejects a wrong one, and keeps its tally after a reload.
5. `/404.html` lists the trainer; its home link works.
6. No console errors and no Content-Security-Policy violations on the three pages.
7. At 375 px and 320 px wide: no sideways scrolling on home, 404 and the trainer's bar.
8. Dark system theme: home page and bar are readable.

Send failures back to the Task 3 implementer. Do not start Task 4 until all eight pass.

---

### Task 4: Publish

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: a clean `main` with Tasks 1 to 3 committed; `npm test`.
- Produces: `https://beagle.lt/` live over HTTPS.

**Preconditions. If any fails, stop and report BLOCKED with the output:**
- `gh api user --jq .login` prints `Beagle0913`.
- `git status --short` prints nothing, and `npm test` passes.

- [ ] **Step 1: Check the domain is still free and pointed at GitHub**

```bash
nslookup beagle.lt 1.1.1.1; nslookup www.beagle.lt 1.1.1.1
curl -s -o /dev/null -w "%{http_code}\n" https://beagle.lt/
```

Expected: `beagle.lt` resolves to `185.199.108.153` to `185.199.111.153`; `www.beagle.lt` is an alias of `beagle0913.github.io`; the status is `404` (GitHub's "no site here" page). Anything else: stop and report.

- [ ] **Step 2: Create the GitHub repo and push**

```bash
gh repo create Beagle0913/beagle.lt --public --source . --remote origin --description "Trainer site served at https://beagle.lt/"
git push -u origin main
```

Expected: `main` set up to track `origin/main`. If the push is refused, stop and report the message. Do not change any credential setting.

- [ ] **Step 3: Turn on Pages, published by a workflow**

Run: `gh api -X POST repos/Beagle0913/beagle.lt/pages -f build_type=workflow`
Expected: JSON containing `"build_type":"workflow"`. If it answers that Pages already exists, use `-X PUT` with the same field.

- [ ] **Step 4: Write the workflow**

`.github/workflows/deploy.yml`. For each action, look up the current major version (`gh api repos/actions/checkout/releases/latest --jq .tag_name`, and likewise `setup-node`, `upload-pages-artifact`, `deploy-pages`) and use that major in place of the ones shown:

```yaml
name: Test and publish
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: npm test
  publish:
    needs: test
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Commit, push, and watch the run**

```bash
git add .github/workflows/deploy.yml
git commit -m "Publish site/ to GitHub Pages after the tests pass"
git push
gh run watch --exit-status "$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Expected: both jobs succeed. If the push is refused for a missing `workflow` permission, stop and report BLOCKED with the message.

- [ ] **Step 6: Attach the domain**

```bash
gh api -X PUT repos/Beagle0913/beagle.lt/pages -f cname=beagle.lt
gh repo edit Beagle0913/beagle.lt --homepage https://beagle.lt
```

Then: `curl -s -o /dev/null -w "%{http_code}\n" http://beagle.lt/`
Expected: `200` within five minutes. If it is still `404` after five minutes, run `gh workflow run deploy.yml --ref main`, watch it as in Step 5, and check again.

- [ ] **Step 7: Wait for the certificate, then enforce HTTPS**

Poll once a minute, for at most 20 minutes:
`gh api repos/Beagle0913/beagle.lt/pages --jq '.https_certificate.state'`

When it prints `approved`: `gh api -X PUT repos/Beagle0913/beagle.lt/pages -F https_enforced=true`

If it is not `approved` after 20 minutes, stop waiting and report DONE_WITH_CONCERNS with the last state; the controller finishes Steps 7 to 9 later.

- [ ] **Step 8: Check the live site**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://beagle.lt/                                            # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://beagle.lt/                            # 301 https://beagle.lt/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.beagle.lt/                       # 301 https://beagle.lt/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://beagle0913.github.io/beagle.lt/      # 301 https://beagle.lt/
curl -s https://beagle.lt/math/ | grep -c 'data-trainer="math"'                                        # 1
curl -s -o /dev/null -w "%{http_code}\n" https://beagle.lt/no-such-page                               # 404
curl -s https://beagle.lt/no-such-page | grep -c 'data-i18n="nf_heading"'                              # 1
for p in CLAUDE.md README.md package.json tests/math/test.js docs/superpowers/specs/2026-11-17-beagle-lt-site-design.md; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://beagle.lt/$p"; done                             # five lines starting 404
```

- [ ] **Step 9: Check the link without a trailing slash**

Run: `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://beagle.lt/math`
Expected: `301 https://beagle.lt/math/`.

- [ ] **Step 10: Report**

Report the repo address, the workflow run address, and the output of Steps 8 and 9 line by line.

---

### Gate B (controller): live browser check

Repeat Gate A checks 1 to 7 at `https://beagle.lt/`, using a real unknown address for check 5. Do not start Task 5 until they pass.

---

### Task 5: Redirect the old address

Work in the `SRC` clone, which is a different repo (`Beagle0913/Beagle0913.github.io`). Its pages are live; nothing here is pushed to its `main`.

**Files (in `SRC`):**
- Delete: everything under `math-trainer/`
- Create: `math-trainer/index.html`
- Modify: `projects.json`, `index.html`, `README.md`

**Interfaces:**
- Consumes: `https://beagle.lt/math/` live (Gate B passed).
- Produces: an open pull request from branch `claude/math-trainer-moved`.

- [ ] **Step 1: Check the source has not moved, and branch**

```bash
cd "$SRC"
git checkout main && git pull --ff-only
git diff --stat 7cf4815 HEAD -- math-trainer
```

Expected: the diff prints nothing. If it prints anything, the trainer changed after it was copied: stop and report.

```bash
git config user.name "Beagle0913"
git config user.email "132080045+Beagle0913@users.noreply.github.com"
git checkout -b claude/math-trainer-moved
```

- [ ] **Step 2: Replace the trainer with a redirect page**

`git rm -r -q math-trainer`, then create `math-trainer/index.html`:

```html
<!doctype html>
<html lang="lt"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'">
<title>GMC matematikos treniruoklis</title>
<meta http-equiv="refresh" content="0; url=https://beagle.lt/math/">
<link rel="canonical" href="https://beagle.lt/math/">
</head><body><p>Treniruoklis persikėlė į <a href="https://beagle.lt/math/">beagle.lt/math</a>. The trainer has moved to <a href="https://beagle.lt/math/">beagle.lt/math</a>.</p></body></html>
```

- [ ] **Step 3: Take the trainer out of the old site's lists**

- `projects.json`: remove the whole `math-trainer` entry; the file stays valid JSON with one project.
- `index.html`: in the `<noscript>` block, remove the `GMC Math Trainer` link and its comma.
- `README.md`: the layout line for `math-trainer/` becomes "Redirect to https://beagle.lt/math/, where the maths trainer now lives."; in the safety rules, drop the sentence about the trainer's progress.

- [ ] **Step 4: Check locally**

Run `python -m http.server 8001` in the background from `SRC`, then:

```bash
curl -s http://localhost:8001/math-trainer/ | grep -c 'url=https://beagle.lt/math/'        # 1
curl -s http://localhost:8001/projects.json | python -I -c "import sys,json; print([p['id'] for p in json.load(sys.stdin)['projects']])"   # ['moto-routes']
grep -rln "math-trainer" --include=*.html --include=*.json --include=*.js --include=*.css .   # nothing
```

`grep` printing nothing means no page, script or list still links to the old trainer (the redirect page itself does not contain the folder name). Stop the server.

- [ ] **Step 5: Commit, push the branch, open the pull request**

```bash
git add -A
git commit -m "Maths trainer moved to beagle.lt: leave a redirect"
git push -u origin claude/math-trainer-moved
gh pr create --repo Beagle0913/Beagle0913.github.io --base main --head claude/math-trainer-moved \
  --title "Maths trainer moved to beagle.lt: leave a redirect" \
  --body "The maths trainer now lives at https://beagle.lt/math/ (repo Beagle0913/beagle.lt). This replaces math-trainer/ with a redirect page and takes the trainer out of the project list. Moto routes are untouched."
```

End the pull request body with the generated-by line your session instructions give you. Do not merge. Report the pull request address.

---

### Gate C (controller): merge and final check

1. Read the pull request diff: only the files Task 5 names.
2. Merge it (`gh pr merge --merge`), wait for the old site to rebuild.
3. `https://beagle0913.github.io/math-trainer/` lands on `https://beagle.lt/math/`; `https://beagle0913.github.io/` lists the moto routes only, with no dead links.
4. Re-run Task 4 Step 8.
5. Tell the owner the optional step: verify `beagle.lt` under GitHub settings, Pages, "Verified domains", by adding the TXT record GitHub shows.
