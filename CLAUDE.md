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
- The site collects nothing from visitors: no accounts, cookies, analytics or trackers. The only requests to other hosts are for fonts from Google Fonts.
