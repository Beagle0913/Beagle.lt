/* Interface of the English trainer: start screen, scenes, end screen and word list.
   Everything on the page is built with createElement / textContent: no HTML from strings. */
(function (ENG) {
  'use strict';
  const doc = document;
  const LKEY = 'beagle-lang';
  const app = doc.getElementById('app');
  const L = ENG.lesson;
  const fmt = ENG.fmt;

  let lang = 'lt';
  try { if (localStorage.getItem(LKEY) === 'en') lang = 'en'; } catch (e) { /* storage unavailable: Lithuanian */ }
  let S = ENG.STR[lang];

  let game = null;
  let view = 'start';     // 'start' | 'scene' | 'end' | 'words'
  let wordsFrom = 'start'; // where the word list returns to

  const el = (tag, cls, txt) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); return n; };
  const reduced = () => {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };
  const focusSoon = (node) => { if (node && node.focus) { try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); } } };
  const total = () => game ? game.steps.length : 25;

  /* ---------- header: language ---------- */
  function applyLang() {
    S = ENG.STR[lang];
    doc.documentElement.lang = lang;
    doc.title = S.title;
    const brand = doc.getElementById('brand');
    if (brand) brand.textContent = S.brand;
    const langs = doc.getElementById('langs');
    if (langs) langs.setAttribute('aria-label', S.langLabel);
    doc.querySelectorAll('#langs button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
  }
  doc.querySelectorAll('#langs button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang === 'en' ? 'en' : 'lt';
    try { localStorage.setItem(LKEY, lang); } catch (e) { /* ignore */ }
    applyLang();
    render({ keepFocus: true });
  }));

  /* ---------- screens ---------- */
  function renderStart() {
    const box = el('section', 'hero');
    box.append(el('p', 'kicker', S.kicker));
    const h = el('h1', '', L.title);
    h.tabIndex = -1;
    box.append(h, el('p', 'chapter', L.chapter), el('p', 'intro', S.intro));
    const acts = el('div', 'actions');
    const go = el('button', 'btn primary big', S.start);
    go.type = 'button';
    go.addEventListener('click', startGame);
    const wl = el('button', 'btn big', S.wordList);
    wl.type = 'button';
    wl.addEventListener('click', () => { wordsFrom = 'start'; view = 'words'; render(); });
    acts.append(go, wl);
    box.append(acts, el('p', 'keys', S.keysHint));
    app.append(box);
    return go;
  }

  function startGame() {
    game = ENG.newGame(L);
    ENG.goto(game, 0);
    view = 'scene';
    render();
  }

  function wordListInto(parent) {
    const list = el('div', 'wordlist');
    for (const sec of ['8.3', '8.4', '8.7']) {
      list.append(el('h2', '', sec + ' ' + L.sections[sec]));
      for (const e of L.glossary.filter((x) => x.section === sec)) {
        const row = el('p', 'entry');
        row.append(el('span', 'term', e.term), doc.createTextNode(': ' + e.def));
        list.append(row);
      }
    }
    parent.append(list);
  }

  function renderWords() {
    const head = el('h1', 'pagehead', S.wordList);
    head.tabIndex = -1;
    app.append(head, el('p', 'lead', S.wordsLead));
    const back = el('button', 'btn', S.back);
    back.type = 'button';
    back.addEventListener('click', () => { view = wordsFrom; render(); });
    app.append(back);
    wordListInto(app);
    return head;
  }

  function renderEnd() {
    const sc = ENG.score(game);
    const box = el('section', 'hero');
    const h = el('h1', '', S.endTitle);
    h.tabIndex = -1;
    box.append(h, el('p', 'score', fmt(S.endScore, { n: sc.firstTry, t: sc.total })));
    const acts = el('div', 'actions');
    const again = el('button', 'btn primary big', S.playAgain);
    again.type = 'button';
    again.addEventListener('click', startGame);
    const start = el('button', 'btn big', S.toStart);
    start.type = 'button';
    start.addEventListener('click', () => { view = 'start'; render(); });
    const back = el('button', 'btn big', S.back);
    back.type = 'button';
    back.addEventListener('click', () => { view = 'scene'; render(); });
    acts.append(again, start, back);
    box.append(acts);
    app.append(box);
    wordListInto(app);
    return h;
  }

  /* ---------- the scene screen ---------- */
  function renderScene(opts) {
    opts = opts || {};
    const i = ENG.current(game);
    const st = game.steps[i];
    const sc = L.scenes[st.scene];
    const def = sc.steps[st.step];
    const tap = def.type === 'tap';

    // heading: scene name, number, step dots
    const head = el('div', 'scenehead');
    head.append(el('span', 'num', fmt(S.sceneOf, { n: st.scene + 1, m: L.scenes.length })), el('span', 'name', sc.title[lang]));
    const dots = el('div', 'dots');
    dots.setAttribute('role', 'img');
    dots.setAttribute('aria-label', fmt(S.stepOf, { n: st.step + 1, m: sc.steps.length }));
    sc.steps.forEach((_, j) => {
      const flat = game.steps.findIndex((s) => s.scene === st.scene && s.step === j);
      dots.append(el('span', 'dot' + (game.steps[flat].solved ? ' done' : '') + (j === st.step ? ' cur' : '')));
    });
    head.append(dots);
    app.append(head);

    // picture: the state after this step if it is solved, otherwise after the steps before it
    const stage = el('div', 'stage');
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', fmt(S.sceneAria, { name: sc.title[lang] }));
    stage.append(svg);
    app.append(stage);
    const n = st.solved ? st.step + 1 : st.step;
    const drawn = ENG.drawScene(svg, sc.id, n, !!opts.animate && !reduced());

    // the sentence with its blank
    const sen = el('p', 'sentence');
    sen.setAttribute('aria-live', 'polite');
    if (tap) {
      sen.textContent = def.text;
    } else {
      const parts = def.text.split('___');
      const blank = el('span', 'blank' + (st.solved ? ' filled' : ''), st.solved ? def.answer : '');
      if (!st.solved) blank.setAttribute('aria-label', S.blank);
      sen.append(doc.createTextNode(parts[0]), blank, doc.createTextNode(parts[1]));
    }
    app.append(sen);

    // word buttons (or the tap hint)
    let firstOpen = null;
    const choiceBtns = [];
    if (tap) {
      app.append(el('p', 'taphint', S.tapHint));
      (drawn.taps || []).forEach((t) => {
        const act = () => pick(t.kind);
        t.el.addEventListener('click', act);
        t.el.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); act(); }
        });
        if (opts.shakeKind && t.kind === opts.shakeKind && st.tried.indexOf(t.kind) !== -1) {
          t.el.setAttribute('class', t.el.getAttribute('class') + ' shake');
        }
      });
    } else {
      const grid = el('div', 'choices');
      st.choices.forEach((w, k) => {
        const b = el('button', 'choice');
        b.type = 'button';
        b.append(el('span', 'key', String(k + 1)), el('span', 'word', w));
        const wrongBefore = st.tried.indexOf(w) !== -1;
        if (st.solved) {
          b.disabled = true;
          if (w === def.answer) b.classList.add('right');
          else if (wrongBefore) b.classList.add('wrong');
        } else if (wrongBefore) {
          b.disabled = true;
          b.classList.add('wrong');
          if (opts.shake === w) b.classList.add('shake');
        } else {
          b.addEventListener('click', () => pick(w));
          if (!firstOpen) firstOpen = b;
        }
        choiceBtns.push(b);
        grid.append(b);
      });
      app.append(grid);
    }

    // feedback: what the right word means, or what the wrong word really means
    const fb = el('div', 'feedback');
    fb.setAttribute('aria-live', 'polite');
    if (st.solved) {
      fb.append(el('span', 'tick', '✓ '));
      const term = tap ? def.term : def.answer;
      const e = ENG.entryFor(term, L);
      if (tap) fb.append(doc.createTextNode(def.right + ' '));
      fb.append(el('span', 'term', term), doc.createTextNode(': ' + e.def));
    } else if (st.last) {
      fb.classList.add('bad');
      if (tap) {
        fb.append(doc.createTextNode(def.wrong + ' ' + S.tryAgain));
      } else {
        const e = ENG.entryFor(st.last, L);
        fb.append(el('span', 'term', st.last), doc.createTextNode(': ' + (e ? e.def : '') + ' ' + S.tryAgain));
      }
    }
    app.append(fb);

    // back / next: always available, so a step can be skipped
    const nav = el('div', 'nav');
    const back = el('button', 'btn', S.back);
    back.type = 'button';
    back.disabled = i === 0;
    back.addEventListener('click', goBack);
    const last = i === total() - 1;
    const next = el('button', 'btn' + (st.solved ? ' primary' : ''), last ? S.finish : S.next);
    next.type = 'button';
    next.addEventListener('click', goNext);
    nav.append(back, next);
    app.append(nav);

    if (opts.focusNext) focusSoon(next);
    else if (opts.focusChoice) focusSoon(firstOpen);
    return null;
  }

  /* ---------- actions ---------- */
  function pick(word) {
    if (view !== 'scene' || !game) return;
    const i = ENG.current(game);
    const st = game.steps[i];
    const def = L.scenes[st.scene].steps[st.step];
    const r = ENG.answer(game, word);
    if (r.already) return;
    if (r.correct) {
      st.last = null;
      render({ animate: true, focusNext: true });
    } else {
      st.last = word;
      render(def.type === 'tap' ? { shakeKind: word } : { shake: word, focusChoice: true });
    }
  }
  function goNext() {
    if (view !== 'scene' || !game) return;
    const i = ENG.current(game);
    if (i >= total() - 1) { view = 'end'; render(); return; }
    ENG.goto(game, i + 1);
    render();
  }
  function goBack() {
    if (!game) return;
    if (view === 'end') { view = 'scene'; render(); return; }
    if (view !== 'scene') return;
    const i = ENG.current(game);
    if (i > 0) { ENG.goto(game, i - 1); render(); }
  }

  /* ---------- keyboard for the presenter ---------- */
  doc.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const t = ev.target;
    if (t && t.closest && t.closest('#langs, #sitebar')) return;
    const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const onControl = tag === 'button' || tag === 'a' || (t && t.getAttribute && t.getAttribute('role') === 'button');
    if (view === 'scene' && game) {
      if (ev.key >= '1' && ev.key <= '4') {
        const i = ENG.current(game), st = game.steps[i];
        const w = st.choices[Number(ev.key) - 1];
        if (w && !st.solved && st.tried.indexOf(w) === -1) { ev.preventDefault(); pick(w); }
      } else if (ev.key === 'ArrowRight' || (ev.key === 'Enter' && !onControl)) {
        ev.preventDefault();
        goNext();
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        goBack();
      }
    } else if (view === 'end' && ev.key === 'ArrowLeft') {
      ev.preventDefault();
      goBack();
    }
  });

  /* ---------- render ---------- */
  function render(opts) {
    clear(app);
    let target = null;
    if (view === 'scene' && !game) view = 'start';
    if (view === 'end' && !game) view = 'start';
    if (view === 'start') target = renderStart();
    else if (view === 'words') target = renderWords();
    else if (view === 'end') target = renderEnd();
    else target = renderScene(opts);
    if (target && !(opts && opts.keepFocus)) focusSoon(target);
    if (!(opts && (opts.keepFocus || opts.animate || opts.shake || opts.shakeKind))) {
      try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    }
  }

  applyLang();
  render();
})(globalThis.ENG = globalThis.ENG || {});
