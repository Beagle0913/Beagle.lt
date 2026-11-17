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
    for (const lang of ['summary', 'note']) assert.ok(home.includes(t[lang].lt) && nf.includes(t[lang].lt), lang + ' static text ' + t.id);
    assert.ok(home.includes(`href="${t.path}"`) && home.includes(t.name.lt), 'home link ' + t.id);
    assert.ok(nf.includes(`href="/${t.path}"`) && nf.includes(t.name.lt), '404 link ' + t.id);
  }
  for (const [name, html] of [['home', home], ['404', nf]]) {
    const block = html.match(/<ol id="trainer-list">([^]*?)[<][/]ol>/);
    assert.ok(block, name + ' list block');
    assert.equal((block[1].match(/<li[ >]/g) || []).length, data.trainers.length, name + ' static rows');
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

test('every trainer page is listed in trainers.json', () => {
  const ids = data.trainers.map(t => t.id);
  for (const f of pages) {
    const m = read(f).match(/data-trainer="([^"]+)"/);
    if (m) assert.ok(ids.includes(m[1]), 'not listed: ' + f);
  }
});
