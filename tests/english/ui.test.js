'use strict';
// Plays the whole lesson through the real ui.js against a fake DOM.
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, findAll } = require('./fakedom');

const JS = ['lesson.js', 'strings.js', 'engine.js', 'scenes.js', 'ui.js'];
const btn = (app, text) => findAll(app, (e) => e.localName === 'button' && e.textContent === text)[0];
const choices = (app) => findAll(app, (e) => e.localName === 'button' && e.classList.contains('choice'));
const word = (b) => b.children[1].textContent;
const feedback = (app) => findAll(app, (e) => e.classList.contains('feedback'))[0];
const filled = (app) => findAll(app, (e) => e.classList.contains('blank') && e.classList.contains('filled'));

function start(opts) {
  const t = boot(JS, opts);
  btn(t.app, 'Start').click();
  return t;
}
const stepDef = (t, i) => {
  let k = i;
  for (const s of t.ENG.lesson.scenes) { if (k < s.steps.length) return s.steps[k]; k -= s.steps.length; }
  return null;
};

test('starts in English with Start and Word list, then plays the first scene', () => {
  const t = boot(JS);
  assert.equal(t.doc.documentElement.lang, 'en');
  assert.ok(btn(t.app, 'Start') && btn(t.app, 'Word list'));
  btn(t.app, 'Start').click();
  assert.equal(choices(t.app).length, 4);
  assert.deepEqual(choices(t.app).map((b) => b.children[0].textContent), ['1', '2', '3', '4']);
  assert.ok(t.app.textContent.includes('Cut'));
  assert.ok(t.app.textContent.includes('Scene 1/6'));
});

test('wrong word: stays marked, shows its definition, cannot be picked again; right word fills the blank', () => {
  const t = start();
  choices(t.app).find((b) => word(b) === 'DNA ligase').click();
  assert.ok(feedback(t.app).textContent.includes('an enzyme that joins pieces of DNA by forming phosphodiester bonds'));
  const again = choices(t.app).find((b) => word(b) === 'DNA ligase');
  assert.equal(again.disabled, true);
  assert.ok(again.classList.contains('wrong'));
  choices(t.app).find((b) => word(b) === 'restriction endonuclease').click();
  assert.equal(filled(t.app)[0].textContent, 'restriction endonuclease');
  assert.ok(feedback(t.app).textContent.startsWith('✓'));
  assert.ok(choices(t.app).every((b) => b.disabled));
  // a click on the right word again is ignored (the button is disabled)
  choices(t.app).find((b) => word(b) === 'restriction endonuclease').click();
  assert.equal(filled(t.app).length, 1);
});

test('all 25 steps can be played; the end screen shows the first-try score and the word list', () => {
  const t = start();
  for (let i = 0; i < 25; i++) {
    const d = stepDef(t, i);
    if (d.type === 'tap') {
      const colonies = findAll(t.app, (e) => /colony/.test(e.getAttribute('aria-label') || ''));
      assert.equal(colonies.length, 8, 'tap step shows the colonies');
      colonies.find((c) => c.getAttribute('aria-label') === 'blue colony').click();
      assert.ok(feedback(t.app).textContent.includes('Blue: lacZ is intact, so there is no insert.'));
      findAll(t.app, (e) => e.getAttribute('aria-label') === 'white colony')[0].click();
      assert.ok(feedback(t.app).textContent.includes('White: the insert is in lacZ, so no blue.'));
      assert.ok(feedback(t.app).textContent.includes('blue-white screening'));
    } else {
      const b = choices(t.app).find((x) => word(x) === d.answer);
      assert.ok(b, 'answer button for step ' + (i + 1));
      b.click();
    }
    btn(t.app, i === 24 ? 'Finish →' : 'Next →').click();
  }
  assert.ok(t.app.textContent.includes('You cloned and sequenced the gene!'));
  assert.ok(t.app.textContent.includes('Right on the first try: 24 / 25'));
  assert.ok(t.app.textContent.includes('8.7 DNA sequencing'));
  assert.ok(t.app.textContent.includes("palindrome: a sequence that reads the same 5'→3' on both strands, e.g. GAATTC."));
  btn(t.app, 'Play again').click();
  assert.ok(t.app.textContent.includes('Scene 1/6'));
});

test('back to a solved step shows the filled blank and no live buttons', () => {
  const t = start();
  choices(t.app).find((b) => word(b) === 'restriction endonuclease').click();
  btn(t.app, 'Next →').click();
  assert.equal(filled(t.app).length, 0);
  btn(t.app, '← Back').click();
  assert.equal(filled(t.app).length, 1);
  assert.ok(choices(t.app).every((b) => b.disabled));
  assert.equal(t.doc.documentElement.lang, 'en');
  assert.equal(Object.keys(t.store).length, 0, 'nothing stored');
  assert.equal(filled(t.app).length, 1);
});

test('keyboard: 1-4 pick, arrows and Enter move', () => {
  const t = start();
  const k = choices(t.app).findIndex((b) => word(b) === 'restriction endonuclease');
  t.doc.key(String(k + 1));
  assert.equal(filled(t.app).length, 1);
  t.doc.key('ArrowRight');
  assert.equal(filled(t.app).length, 0);
  assert.ok(t.app.textContent.includes('GAATTC'));
  t.doc.key('ArrowLeft');
  assert.equal(filled(t.app).length, 1);
  t.doc.key('Enter');
  assert.equal(filled(t.app).length, 0);
});

test('the word list opens from the start screen and returns', () => {
  const t = boot(JS);
  btn(t.app, 'Word list').click();
  assert.ok(t.app.textContent.includes('8.3 Cutting and joining DNA'));
  assert.ok(t.app.textContent.includes('X-gal: a colourless compound that β-galactosidase cleaves into a blue product.'));
  btn(t.app, '← Back').click();
  assert.ok(btn(t.app, 'Start'));
});

test('with reduced motion no picture is animated', () => {
  const t = start({ reduced: true });
  choices(t.app).find((b) => word(b) === 'restriction endonuclease').click();
  const animated = findAll(t.app, (e) => / fx /.test(' ' + e.className + ' '));
  assert.equal(animated.length, 0);
});

test('a correct answer animates the picture, and nothing sets a style attribute', () => {
  const t = start();
  choices(t.app).find((b) => word(b) === 'restriction endonuclease').click();
  assert.ok(findAll(t.app, (e) => / fx /.test(' ' + e.className + ' ')).length > 0);
  assert.equal(t.doc.styleWrites.filter((w) => w[1] === 'style-attribute').length, 0);
});
