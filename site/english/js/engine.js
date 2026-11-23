/* Engine of the English trainer: shuffling, game state, answer checking and score. No DOM. */
(function (ENG) {
  'use strict';

  // Fisher-Yates on a copy; rand() returns a number in [0, 1).
  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // The word-list entry for a word (its term or one of its other forms), or null.
  function entryFor(word, lesson) {
    const L = lesson || ENG.lesson;
    for (const e of L.glossary) if (e.term === word || e.forms.indexOf(word) !== -1) return e;
    return null;
  }

  function newGame(lesson, rand) {
    const L = lesson || ENG.lesson;
    const steps = [];
    L.scenes.forEach((sc, si) => {
      sc.steps.forEach((st, k) => {
        steps.push({
          scene: si, step: k,
          choices: st.type === 'choice' ? shuffle([st.answer].concat(st.distractors), rand) : [],
          solved: false, firstTry: null, tried: []
        });
      });
    });
    return { lesson: L, pos: { scene: 0, step: 0 }, steps };
  }

  const flatOf = (game, scene, step) => game.steps.findIndex((s) => s.scene === scene && s.step === step);
  const current = (game) => flatOf(game, game.pos.scene, game.pos.step);
  const stepDef = (game, i) => game.lesson.scenes[game.steps[i].scene].steps[game.steps[i].step];

  function goto(game, i) {
    const n = Math.max(0, Math.min(game.steps.length - 1, Math.floor(Number(i)) || 0));
    game.pos = { scene: game.steps[n].scene, step: game.steps[n].step };
    return n;
  }

  // Check a word (or 'white' / 'blue' on the tap step) for the current step.
  function answer(game, word) {
    const i = current(game);
    const st = game.steps[i], def = stepDef(game, i);
    const tap = def.type === 'tap';
    const right = tap ? def.term : def.answer;
    // a wrong tap shows the blue-white screening entry; a wrong word shows its own definition
    const entry = entryFor(tap ? def.term : word, game.lesson);
    if (st.solved) return { correct: true, entry: entryFor(right, game.lesson), already: true };
    const correct = tap ? word === 'white' : word === def.answer;
    if (st.firstTry === null) st.firstTry = correct;
    if (correct) { st.solved = true; return { correct: true, entry: entryFor(right, game.lesson) }; }
    if (st.tried.indexOf(word) === -1) st.tried.push(word);
    return { correct: false, entry };
  }

  function score(game) {
    return { firstTry: game.steps.filter((s) => s.firstTry === true).length, total: game.steps.length };
  }

  // How many steps of scene index `scene` are solved (for drawing the picture).
  function solvedCount(game, scene) {
    return game.steps.filter((s) => s.scene === scene && s.solved).length;
  }

  ENG.shuffle = shuffle;
  ENG.entryFor = entryFor;
  ENG.newGame = newGame;
  ENG.current = current;
  ENG.goto = goto;
  ENG.answer = answer;
  ENG.score = score;
  ENG.solvedCount = solvedCount;
})(globalThis.ENG = globalThis.ENG || {});
