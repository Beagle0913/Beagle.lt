# beagle.lt

The source of https://beagle.lt/, a small static site that hosts trainers: interactive practice pages for university-level problems, one folder per trainer. Lithuanian is the default language, English is one click away. It is plain HTML, CSS and JavaScript served by GitHub Pages, with no build step and no dependencies. The site has no accounts, cookies or trackers, and progress stays in the visitor's browser; the only requests to other hosts are for fonts from Google Fonts.

## Layout

```
site/                       everything served at beagle.lt, and nothing else
  index.html                home page
  404.html
  trainers.json             the list of trainers; the home page and the bar read it
  shared/site.css           home page and top-bar styles
  shared/site.js            draws the trainer list and the top bar
  math/                     the maths trainer
    index.html  trainer.css  js/…  README.md
  organic/                  the organic chemistry trainer
    index.html  trainer.css  js/…  units/…  README.md
tests/
  organic/                  the organic trainer's tests (engine, units, content checks)
  math/test.js              the trainer's test suite, moved out of the served folder
  site/                     tests for the shared script and the pages
.github/workflows/deploy.yml   run the tests, then publish site/
docs/superpowers/specs/     designs
docs/superpowers/plans/     build plans
tools/organic/              authoring rules (AUTHORING.md) and tools for the organic units
CLAUDE.md                   working rules for agents
README.md                   this file
```

Only `site/` is published, so plans, tests and working rules never become web pages.

## Add a trainer

1. Create `site/<id>/` with a short lower-case folder name (letters, digits, hyphens). The page is `site/<id>/index.html`.
2. The trainer page follows this contract:
   - `<link rel="stylesheet" href="../shared/site.css">`
   - `<script src="../shared/site.js" defer></script>`
   - `<body data-trainer="ID">` with `<div id="sitebar"></div>` as the first element of the body
   - the same `Content-Security-Policy` and `referrer` meta tags as `site/index.html`
   - the trainer keeps `<html lang>` equal to `lt` or `en` and updates it when its own language buttons are pressed; the bar follows that attribute
3. Add an entry to `site/trainers.json`:
   `{ "id": "ID", "path": "ID/", "name": {lt, en}, "summary": {lt, en}, "note": {lt, en} }`.
   Also add the matching static row to `site/index.html` and `site/404.html`, so the pages work without JavaScript.
4. Storage: the site language is `beagle-lang` (`lt` or `en`), shared by every page. The trainer's own progress uses `beagle-<id>-v1`.
5. Put the trainer's tests under `tests/<id>/` and add them to the `npm test` script in `package.json`.

The home and 404 pages follow this contract: `<body class="home" data-title="KEY">`, `<ol id="trainer-list">`, a `<div id="langs">` holding two `<button type="button" data-lang="lt|en">`, and `data-i18n="KEY"` on every visible text. Every key exists in `lt` and `en` in `site/shared/site.js`.

## Preview

`npm run preview`, then open http://localhost:8000.

## Test

`npm test`. It runs the tests for the shared script and the pages, the organic trainer's tests, then the maths trainer's suite. The organic content check uses 40 seeds per generator locally and 300 on CI (`CI=true`); `SEEDS=300 UNIT=u07 node --test tests/organic/content.test.js` checks one unit at full depth.

## Safety rules

- Hosting is GitHub Pages: no server side. The repo is public.
- Every page carries the same strict `Content-Security-Policy` meta tag: scripts and data from this site only, styles from this site and Google Fonts, fonts from Google Fonts, nothing else. No inline scripts, handlers or styles.
- Text read from data files or browser storage is put on the page as plain text, never as HTML. Links built from data files must stay on this site.
- No analytics, trackers or third-party scripts.
- Only trainers that exist are listed.
