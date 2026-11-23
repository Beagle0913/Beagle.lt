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

test('the organic chemistry trainer is listed and its page follows the contract', () => {
  const t = data.trainers.find(x => x.id === 'organic');
  assert.ok(t, 'organic is in trainers.json');
  assert.equal(t.path, 'organic/');
  assert.deepEqual(t.name, { lt: 'Organinė chemija', en: 'Organic chemistry' });
  assert.equal(t.summary.lt, 'Visas kursas: nomenklatūra, cheminis ryšys, rūgštys ir bazės, izomerija, angliavandeniliai, halogendariniai, alkoholiai, fenoliai, eteriai, karbonilo junginiai, karboksirūgštys, aminai, heterociklai ir laboratoriniai darbai.');
  assert.equal(t.summary.en, 'The whole course: nomenclature, bonding, acids and bases, isomerism, hydrocarbons, haloalkanes, alcohols, phenols, ethers, carbonyl compounds, carboxylic acids, amines, heterocycles and the lab works.');
  assert.deepEqual(t.note, { lt: 'Pagal VU GMC Organinės chemijos kursą · LT / EN', en: 'Based on the VU GMC Organic Chemistry course · LT / EN' });
  const row = (html, prefix) => {
    const m = html.match(new RegExp(`<li>\\s*<a class="row" href="${prefix}organic/">[^]*?</li>`));
    assert.ok(m, 'static row with href ' + prefix + 'organic/');
    return m[0];
  };
  for (const [name, html, prefix] of [['home', read(path.join(SITE, 'index.html')), ''], ['404', read(path.join(SITE, '404.html')), '/']]) {
    const r = row(html, prefix);
    assert.match(r, /<span class="no">02<\/span>/, name);
    assert.ok(r.includes('<h2 class="name">Organinė chemija</h2>'), name);
    assert.ok(r.includes('<span class="open" data-i18n="open">Atverti →</span>'), name);
    assert.ok(r.includes(`<p class="sum">${t.summary.lt}</p>`) && r.includes(`<p class="note">${t.note.lt}</p>`), name);
    assert.ok(html.indexOf(`href="${prefix}math/"`) < html.indexOf(`href="${prefix}organic/"`), name + ' order');
  }
  const page = read(path.join(SITE, 'organic', 'index.html'));
  assert.ok(page.includes('<html lang="lt">'));
  assert.ok(page.includes('<body data-trainer="organic">'));
  assert.match(page, /<body[^>]*>\s*<div id="sitebar"><\/div>/, 'the bar is the first element of the body');
  const links = [...page.matchAll(/<(?:link|script)[^>]*?(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  assert.ok(links.includes('../shared/site.css') && links.includes('../shared/site.js'));
  const order = ['chem', 'stereo', 'draw', 'views', 'name', 'react', 'units', 'check', 'progress', 'ui'].map(n => `js/${n}.js`);
  assert.deepEqual(links.filter(l => l.startsWith('js/')), order, 'scripts in the load order');
  assert.ok(links.includes('trainer.css'));
  assert.equal(/\sstyle\s*=/i.test(page), false, 'no style attributes');
});

test('the organic trainer source never builds HTML from strings and never styles by attribute', () => {
  const dir = path.join(SITE, 'organic');
  for (const f of walk(dir).filter(f => /\.(js|html)$/.test(f))) {
    const src = read(f);
    assert.equal(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src), false, 'html from strings: ' + f);
    assert.equal(/setAttribute\(\s*['"]style['"]/.test(src), false, 'style attribute: ' + f);
    assert.equal(/\beval\s*\(|new Function\s*\(/.test(src), false, 'eval: ' + f);
  }
});
