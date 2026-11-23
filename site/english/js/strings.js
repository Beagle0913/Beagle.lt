/* Interface texts of the English trainer, in Lithuanian (default) and English. No DOM.
   {name} marks a value filled in by ENG.fmt. Lesson content is not here: it stays English (lesson.js). */
(function (ENG) {
  'use strict';

  ENG.STR = {
    lt: {
      title: 'Anglų kalba',
      brand: 'Anglų kalba',
      langLabel: 'Kalba',
      kicker: 'Žodyno pamoka',
      intro: 'Pasirinkite tinkamą žodį ir stebėkite, kaip pasikeičia paveikslas. Jei pasirinksite netinkamą, pamatysite, ką tas žodis iš tikrųjų reiškia.',
      start: 'Pradėti',
      wordList: 'Žodžių sąrašas',
      keysHint: 'Klavišai: 1–4 pasirinkti žodį, → toliau, ← atgal',
      sceneOf: 'Scena {n}/{m}',
      stepOf: 'Žingsnis {n} iš {m}',
      back: '← Atgal',
      next: 'Toliau →',
      finish: 'Baigti →',
      right: 'Teisingai!',
      tryAgain: 'Bandykite dar kartą.',
      tapHint: 'Bakstelėkite koloniją paveiksle.',
      blank: 'tuščia vieta',
      sceneAria: 'Paveikslas: {name}',
      endTitle: 'Jūs suklonavote ir nuskaitėte geną!',
      endScore: 'Iš pirmo karto teisingai: {n} / {t}',
      playAgain: 'Žaisti iš naujo',
      toStart: 'Į pradžią',
      wordsLead: 'Visi pamokos žodžiai su jų reikšmėmis.',
      noscript: 'Šiam treniruokliui reikia „JavaScript“.'
    },
    en: {
      title: 'English',
      brand: 'English',
      langLabel: 'Language',
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
    }
  };

  ENG.fmt = function (s, vars) {
    return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  };
})(globalThis.ENG = globalThis.ENG || {});
