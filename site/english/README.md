# English trainer

A vocabulary lesson in English for molecular biology students, with the whole interface in English only (no Lithuanian). Plain HTML, CSS and JavaScript; no build step, no dependencies. The trainer stores nothing in the browser and does not use the site language setting.

## What it covers now

One lesson, **Clone a gene** (Allison, *Fundamental Molecular Biology*, Ch 8: 8.3 cutting and joining DNA, 8.4 molecular cloning, 8.7 DNA sequencing). It is one lab story in 6 scenes and 25 steps: cut, choose a carrier, join, into bacteria, grow and pick, read the sequence. Each step is a sentence with a blank and four words. The right word makes the picture do what the word means; a wrong word shows what it really means, and the player tries again. One step is a tap on a colony. The end screen shows the first-try score and the word list.

Keys for the presenter: `1`-`4` pick a word, `→` or `Enter` next, `←` back.

## Layout

```
index.html        the page
trainer.css       styles, picture colours and animations
js/lesson.js      the lesson: scenes, steps, word list (the content)
js/strings.js     interface texts (English)
js/engine.js      game state, answer checking, score (no DOM)
js/scenes.js      the SVG pictures, one per scene, drawn for any state
js/ui.js          screens, keyboard
```

## Tests

From the repository root, `npm test` runs `tests/english/`: the lesson content, the engine, every picture in every state and the whole interface, the last two against a small fake DOM (`tests/english/fakedom.js`).
