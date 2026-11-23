/* Interface texts of the English trainer, in English. No DOM.
   {name} marks a value filled in by ENG.fmt. Lesson content is not here: it stays English (lesson.js). */
(function (ENG) {
  'use strict';

  ENG.STR = {
    title: 'English',
    brand: 'English',
    kicker: 'Vocabulary lesson',
    intro: 'Pick the right word and watch the picture change. If you pick a wrong word, you see what it really means.',
    start: 'Start',
    wordList: 'Word list',
    keysHint: 'Keys: 1–4 pick a word, → next, ← back',
    sceneOf: 'Scene {n}/{m}',
    stepOf: 'Step {n} of {m}',
    back: '← Back',
    next: 'Next →',
    finish: 'Finish →',
    right: 'Correct!',
    tryAgain: 'Try again.',
    tapHint: 'Tap a colony in the picture.',
    blank: 'blank',
    sceneAria: 'Picture: {name}',
    endTitle: 'You cloned and sequenced the gene!',
    endScore: 'Right on the first try: {n} / {t}',
    playAgain: 'Play again',
    toStart: 'To the start',
    wordsLead: 'Every word from the lesson, with its meaning.',
    noscript: 'This trainer needs JavaScript.'
  };

  ENG.fmt = function (s, vars) {
    return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  };
})(globalThis.ENG = globalThis.ENG || {});
