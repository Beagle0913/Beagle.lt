'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SITE = path.join(__dirname, '..', '..', 'site');
const DIR = path.join(SITE, 'english');
const read = (f) => fs.readFileSync(f, 'utf8');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

test('the English trainer is listed and its page follows the contract', () => {
  const data = JSON.parse(read(path.join(SITE, 'trainers.json')));
  const t = data.trainers.find((x) => x.id === 'english');
  assert.ok(t, 'listed');
  assert.equal(t.path, 'english/');
  assert.deepEqual(t.name, { lt: 'Anglų kalba', en: 'English' });
  assert.equal(t.summary.en, 'Molecular biology vocabulary in English: cutting and joining DNA, molecular cloning, DNA sequencing.');
  assert.equal(t.note.en, 'Based on L. A. Allison, Fundamental Molecular Biology, Ch 8 · LT / EN');
  for (const [file, prefix] of [['index.html', ''], ['404.html', '/']]) {
    const html = read(path.join(SITE, file));
    assert.ok(html.includes(`<a class="row" href="${prefix}english/">`), file);
    assert.ok(html.includes(`<p class="sum">${t.summary.lt}</p>`) && html.includes(`<p class="note">${t.note.lt}</p>`), file);
  }
  const page = read(path.join(DIR, 'index.html'));
  assert.ok(page.includes('<html lang="lt">'));
  assert.ok(page.includes('<body data-trainer="english">'));
  assert.match(page, /<body[^>]*>\s*<div id="sitebar"><\/div>/);
  const scripts = [...page.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts.filter((s) => s.startsWith('js/')), ['js/lesson.js', 'js/strings.js', 'js/engine.js', 'js/scenes.js', 'js/ui.js']);
  assert.ok(scripts.includes('../shared/site.js'));
  assert.ok(page.includes('href="../shared/site.css"') && page.includes('href="trainer.css"'));
  assert.equal(/\sstyle\s*=/i.test(page), false, 'no style attributes');
  assert.ok(page.includes('data-lang="lt"') && page.includes('data-lang="en"'));
});

test('the English trainer source never builds HTML from strings and never styles by attribute', () => {
  for (const f of walk(DIR).filter((x) => /\.(js|html)$/.test(x))) {
    const src = read(f);
    assert.equal(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src), false, 'html from strings: ' + f);
    assert.equal(/setAttribute\(\s*['"]style['"]/.test(src), false, 'style attribute: ' + f);
    assert.equal(/\beval\s*\(|new Function\s*\(/.test(src), false, 'eval: ' + f);
    assert.equal(/localStorage\.(set|get)Item\(\s*['"](?!beagle-lang)/.test(src), false, 'storage key: ' + f);
  }
});

test('the stylesheet has no remote imports and respects reduced motion', () => {
  const css = read(path.join(DIR, 'trainer.css'));
  assert.equal(/@import|url\(\s*['"]?https?:/.test(css), false);
  assert.ok(css.includes('prefers-reduced-motion: reduce'));
});
