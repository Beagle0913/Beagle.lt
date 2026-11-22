# Organic chemistry trainer

Practice for the VU GMC Organic Chemistry course, in Lithuanian (default) and English. Plain HTML, CSS and JavaScript; no build step, no dependencies. Progress is kept in the browser only, under `beagle-organic-v1`.

## What it covers now

Release 1 (Part II, units 6 to 13): alkanes and SR reactions; alkenes and AE reactions; dienes, alkynes and small rings; arenes and SEAr reactions; haloalkanes (SN1, SN2, E1, E2); alcohols; polyhydric alcohols, phenols, thiols and ethers; aldehydes and ketones. Each unit has notes, worked examples, generated practice problems with step-by-step checking, and mechanism and scheme drawings. Units not yet written are not listed.

## Layout

```
index.html        the page
trainer.css       styles
js/               engine: chem, stereo, draw, views, name, react, check, progress, ui, units (the unit list)
units/            one file per unit (u06.js ...), each calls ORG.unit(...)
```

## Writing units

Units are written by the rules in `tools/organic/AUTHORING.md` (in the source repository). A unit is marked ready in `js/units.js`.

## Tests

From the repository root: `npm test` runs every organic test (`tests/organic/`) together with the site and maths tests. The unit content check uses 40 seeds per generator locally and 300 on CI; set `SEEDS=300` for full depth, or `UNIT=u07` to check one unit:

```
SEEDS=300 UNIT=u07 node --test tests/organic/content.test.js
```
