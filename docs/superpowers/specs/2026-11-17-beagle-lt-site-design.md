# beagle.lt: trainer site and maths trainer move

Design, 2026-11-17. Status: checked by a reviewer against the existing code, awaiting the owner's approval.

## Intent

beagle.lt is one link the owner can share with people who want to train their skills. It hosts a set of university-level trainers. The maths trainer exists already and moves in first. A physics-chemistry trainer follows, then others.

This project sets up the site and moves the maths trainer. It does not build a new trainer.

## What exists today

- **Maths trainer.** Lives in the `math-trainer/` folder of the public repo `Beagle0913/Beagle0913.github.io` (source commit `7cf4815`), served at `https://beagle0913.github.io/math-trainer/`. Plain HTML, CSS and JavaScript, no build step. Lithuanian by default with an LT / EN switch. Progress is kept in the visitor's browser. It has a test suite, `tools/test.js`, run with Node.
- **Its ties to the old site.** Two lines in `math-trainer/index.html` load the old site's project bar (`../hub/hub.css`, `../hub/hub.js`), plus `<body data-project="math-trainer">` and `<div id="hubbar"></div>`. Nothing else points outside the folder.
- **The old site** also holds `moto-routes/`, a home page that lists projects from `projects.json`, and a `404.html`. Its bar code only links to addresses on its own site.
- **The domain.** `beagle.lt` and `www.beagle.lt` already resolve to GitHub Pages (nameservers at dns-parking.com). No repo claims the name, so the address currently shows GitHub's "there isn't a site here" page. Until a repo claims it, any GitHub account could attach the name to its own site.
- **This machine.** Windows 11. Git 2.55 with a saved GitHub login. Python 3.11. No GitHub CLI and no Node.
- **Working folder.** `C:\Users\dziug\Desktop\Silly\ChemBOT`, empty, not yet a git repo. It becomes the local copy of the new repo.

## Goals

1. `https://beagle.lt/` shows a home page that lists the trainers.
2. `https://beagle.lt/math/` runs the maths trainer, behaving exactly as it does today.
3. The old address `https://beagle0913.github.io/math-trainer/` sends visitors to the new one.
4. Adding the next trainer means adding a folder, one entry in a list, and one static row on the home and 404 pages (so they work without JavaScript), without touching the list or bar code.
5. A change that breaks the trainer's tests cannot reach visitors.

## Non-goals

- Building the physics-chemistry trainer, or any new exercise.
- Pulling a shared "engine" out of the maths trainer. That waits until the second trainer shows what must be shared.
- Changing the maths trainer's content, wording, look or behaviour.
- Accounts, sign-in, or progress that follows a visitor between devices.
- Touching the moto routes.

## Anti-goals

These would make the project a failure even if it technically works:

- A build step or framework. The site stays plain files that open as they are.
- Anything that collects or sends visitor data: analytics, trackers, third-party scripts.
- A broken old link.
- "Coming soon" rows for trainers that do not exist yet.
- A looser Content-Security-Policy than the pages carry today.

## Constraints

- Hosting is GitHub Pages. No server side.
- The repo is public (free Pages needs that; the old site's repo is public too).
- Every page carries the same strict `Content-Security-Policy` meta tag the old pages use: scripts and data from this site only, styles from this site and Google Fonts, fonts from Google Fonts, nothing else.
- Text read from data files is put on the page as plain text, never as HTML. Links built from data files must stay on this site.
- No DNS change is needed to go live. The records are already right.
- All repo development is done by Sonnet agents. The main session writes the design and the plan, reviews, and verifies.

## Approaches considered

1. **One repo, one folder per trainer, maths trainer moved as it is. Chosen.** A home page lists trainers from a data file; each trainer keeps its own folder, styles and scripts. Shared machinery is extracted later. Fast, and almost no risk to a working trainer.
2. **One repo, shared engine first.** Split the maths trainer into engine and content before moving it. Rejected for now: it reshapes working code before anyone knows what physics and chemistry need (units, formulas, significant figures), and it delays go-live.
3. **One repo per trainer under beagle.lt**, by putting the domain on the account site. Rejected: the moto routes would appear under beagle.lt, and the shared look would have to be copied between repos.
4. **Framework rewrite.** Rejected: no build step exists today and the trainer passes its tests; a rewrite buys nothing.

The owner handed the "how" to the planner; option 1 is the planner's pick.

## Design

### Addresses

| Address | Shows |
|---|---|
| `https://beagle.lt/` | Home page: the list of trainers |
| `https://beagle.lt/math/` | Maths trainer |
| any unknown address on beagle.lt | 404 page with the trainer list and a way home |
| `https://www.beagle.lt/…`, `http://…` | Redirect to `https://beagle.lt/…` (GitHub does this once the domain is set) |
| `https://beagle0913.github.io/math-trainer/` | Redirect to `https://beagle.lt/math/` |

Future trainers take a short lower-case folder name the same way (`/physics-chemistry/` or similar, decided when that trainer is designed).

### Repo

Name: `Beagle0913/beagle.lt`, public, default branch `main`. Local copy: `C:\Users\dziug\Desktop\Silly\ChemBOT`.

```
site/                       everything served at beagle.lt, and nothing else
  index.html                home page
  404.html
  trainers.json             the list of trainers; the home page and the bar read it
  shared/site.css           home page and top-bar styles
  shared/site.js            draws the trainer list and the top bar
  math/                     the maths trainer
    index.html  trainer.css  js/…  README.md
tests/
  math/test.js              the trainer's test suite, moved out of the served folder
.github/workflows/deploy.yml   run the tests, then publish site/
docs/superpowers/specs/     designs (this file)
docs/superpowers/plans/     build plans
CLAUDE.md                   working rules for agents
README.md                   what the repo is, layout, how to add a trainer, how to preview
```

Only `site/` is published, so plans, tests and working rules never become web pages.

### Home page

Lithuanian by default, English one click away. Same typefaces as the trainer (IBM Plex Sans for text, STIX Two Text for headings where it suits), light and dark themes following the visitor's system setting, readable on a phone.

```
 beagle.lt                                              LT | EN

 Treniruokliai
 Universitetinio lygio uždaviniai, sprendžiami žingsnis po
 žingsnio. Uždaviniai kaskart generuojami iš naujo, kiekvienas
 žingsnis patikrinamas iškart.
 ─────────────────────────────────────────────────────────────
 01   Matematika                                     Atverti →
      Koordinatės, vektoriai, matricos, determinantai,
      kompleksiniai skaičiai, tikrinės reikšmės, ribos.
      Pagal VU GMC pratybas · LT / EN
 ─────────────────────────────────────────────────────────────
 Svetainėje nėra paskyrų, slapukų ar sekimo priemonių. Jūsų
 atsakymai ir pažanga saugomi tik jūsų naršyklėje. Šriftai
 įkeliami iš „Google Fonts“.                    Pirminis kodas
```

- The rows come from `trainers.json`. Each entry has an id, a folder path, and a name, summary and short note in both languages. Only trainers that exist are listed.
- With JavaScript off, the page still shows a plain link to each trainer.
- The page says plainly what the site does not have (accounts, cookies, trackers), that answers and progress stay in the browser, and that fonts are loaded from Google Fonts. It must not claim that nothing is sent anywhere: loading the fonts sends each visitor's IP address to Google.
- The wording above is a starting point; the builder may polish it, in both languages.

### Top bar on trainer pages

A thin bar at the top of every trainer page, drawn by `shared/site.js` where the page has `<div id="sitebar"></div>` and `<body data-trainer="ID">`:

```
 ← beagle.lt                                  [ Matematika ▾ ]
```

- The left link goes home.
- The switcher lists the other trainers. With only one trainer it is hidden, leaving just the home link.
- The bar's text follows the site language. On a trainer page it also follows the trainer's own LT / EN buttons straight away, by watching the page's language attribute (`<html lang>`), which the trainer already updates. This needs no change inside the trainer.
- The bar and home-page code are adapted from the old site's `hub/hub.js` and `hub/hub.css`, which already do this safely. Drop the previous / next arrows and the "1/2" counter.

### Language and saved progress

All trainers share one address, so their saved data must not collide.

- Site language: one browser-storage key, `beagle-lang` (`lt` or `en`), read and written by the home page, the bar and every trainer. Choosing English on the home page opens the trainer in English, and the reverse.
- Trainer progress: one key per trainer, named `beagle-<trainer id>-v1`. The maths trainer uses `beagle-math-v1`.
- Nothing is carried over from the old address. Browsers keep storage per address, so progress saved at beagle0913.github.io cannot be read at beagle.lt. This is accepted.

### Moving the maths trainer

Copy `math-trainer/` from source commit `7cf4815` into `site/math/`. The allowed differences from the source are exactly these:

1. `index.html`: the two old bar lines point at `../shared/site.css` and `../shared/site.js`; `data-project="math-trainer"` becomes `data-trainer="math"`; `<div id="hubbar">` becomes `<div id="sitebar">`.
2. `js/ui.js`: the two storage key names change as described above. The trainer's own LT / EN buttons keep working and now write the shared language key.
3. `tools/test.js` moves to `tests/math/test.js`, with its one path line changed to find the scripts in `site/math/js/`. Its speed check (a generator averaging over 1500 µs per problem fails the run) keeps failing the run locally, but inside the workflow it only prints a warning, because shared build machines are slower and uneven and a slow machine must not block publishing.
4. `README.md`: paths and the test command updated.

Everything else is byte-for-byte the same. The first commit that adds the trainer names the source repo and commit in its message. Git history is not carried across; it stays in the old repo.

### Publishing

A GitHub Actions workflow runs on every push to `main`:

1. Run `node tests/math/test.js 2000`. Stop if it fails.
2. Publish the `site/` folder to GitHub Pages.

Pages is set to publish from the workflow rather than from a branch.

### Domain and HTTPS

- Before setting the domain, check live that `beagle.lt` and `www.beagle.lt` still resolve to GitHub Pages and that no site answers there (true on 2026-11-17).
- Set the repo's Pages custom domain to `beagle.lt`.
- Turn on "Enforce HTTPS" once GitHub has issued the certificate (minutes to about an hour after the domain is set).
- Recommended, the owner's step: verify `beagle.lt` for the GitHub account (GitHub settings, Pages, "Verified domains"), which needs one TXT record added at the DNS provider. This stops anyone else claiming the name if the site is ever taken down. Not required for go-live.

### Old address

A change to `Beagle0913/Beagle0913.github.io`, made on a branch and opened as a pull request:

- Replace the contents of `math-trainer/` with a single `index.html` that redirects to `https://beagle.lt/math/`, in the same style as the repo's existing redirect pages (`routes/asveja-loop/index.html`), with a visible link for browsers that do not follow it.
- Remove the maths trainer from `projects.json` and from the no-JavaScript fallback links in `index.html`.
- Update that repo's `README.md`.

The pull request is merged only after `https://beagle.lt/math/` has been checked live.

### Working rules file

`CLAUDE.md` at the repo root records, for every future session:

- Development in this repo is done by Sonnet agents; the main session plans and reviews.
- The layout above and how to add a trainer.
- The safety rules under Constraints.
- Run the tests before pushing; a change to a generator is made in both languages.
- Storage key naming.

## Who does what

| Who | What |
|---|---|
| Owner | Approves this design. Approves installing GitHub CLI and Node. Signs in to GitHub once in a terminal (`gh auth login`). Optionally adds the domain-verification TXT record. |
| Main session | Writes the build plan. Reviews each agent's work. Checks the live site in a browser. Merges the old-site pull request after that check. |
| Sonnet agents | Everything in the repos: files, commits, pushes, creating the GitHub repo, Pages settings, the old-site pull request. |

## Order of work

1. Tools: install GitHub CLI and Node LTS with winget; the owner signs in.
2. Build the site locally in the working folder; tests pass; preview locally with `python -m http.server` from `site/`.
3. Create the GitHub repo and push.
4. Turn on Pages from the workflow, set the domain, wait for the certificate, enforce HTTPS.
5. Check the live site.
6. Open the old-site pull request; merge it after step 5 passes.
7. Final check of both sites.

## Done when

1. `node tests/math/test.js 2000` passes locally and in the workflow.
2. `https://beagle.lt/` loads over HTTPS and lists the maths trainer in Lithuanian; the EN button switches it to English.
3. `https://beagle.lt/math/` generates a problem, accepts a correct step, rejects a wrong one, and keeps progress after a reload.
4. A language chosen on the home page is the language the trainer opens in, and the reverse.
5. `http://beagle.lt/` and `https://www.beagle.lt/` end at `https://beagle.lt/`.
6. An unknown address on beagle.lt shows the 404 page with a working way home.
7. Home page, trainer and 404 page show no console errors and no Content-Security-Policy violations.
8. `site/math/` differs from the source only in the four ways listed under "Moving the maths trainer".
9. `https://beagle0913.github.io/math-trainer/` lands on `https://beagle.lt/math/`, and the old home page lists the moto routes with no dead links.
10. Nothing under `docs/`, `tests/` or `CLAUDE.md` is reachable at beagle.lt.

## Decided by the owner

- beagle.lt is a shareable site of trainers; maths first, physics-chemistry next.
- The maths trainer is moved, not copied.
- A new GitHub repo, with `C:\Users\dziug\Desktop\Silly\ChemBOT` as its local folder.
- Sonnet models do all repo development; the main session plans.

## The planner's calls

Each of these is a proposal the owner can overrule.

- Repo name `Beagle0913/beagle.lt`, public.
- The trainer's address is `/math/`.
- Only `site/` is published, through a workflow that runs the tests first.
- Lithuanian first with an English switch on the home page, and one language choice shared across the site.
- The trainer keeps its current name and "GMC" wording; the home page lists it as "Matematika" with a note that it follows the VU GMC pratybos.
- No "coming soon" rows.
- The old address redirects; the trainer leaves the old site's project list.
- The main session merges the old-site pull request after checking the new site.
- Tests live outside the published folder.
- Git history is not carried across.
- The trainer's speed check warns instead of failing when run in the workflow.
- The top bar follows the trainer's language buttons by watching the page, so the trainer's code is not touched for it.

## Left to the builder

- Exact wording of the home page, bar and 404 page, in both languages.
- The home page's visual detail, within the trainer's existing typefaces and light / dark themes.
- The exact shape of `trainers.json`.
- The page icon for the home page.
- How the workflow file is written.

## Later, as separate designs

- The physics-chemistry trainer, and with it the question of which parts of the maths trainer become shared machinery.
- Renaming or re-wording the maths trainer for a wider audience than the GMC course.
- Hosting the two font families on the site itself, so that no request leaves beagle.lt at all. This is the owner's decision: it changes the policy's style and font sources and touches the trainer page.
- Before a second trainer is listed: the trainer switcher in the top bar must not change page when a keyboard user steps through its options with the arrow keys.

## Changes after the pre-publish review (2026-11-17)

An independent review of the built site, before publishing, led to these changes to this document:

- The privacy sentence was reworded. The first wording ("nothing is collected or sent anywhere") was not true while fonts load from Google Fonts, and its Lithuanian was ungrammatical.
- Goal 4 now mentions the static rows on the home and 404 pages.
- The English note for the maths trainer reads "Based on the VU GMC course exercises".
