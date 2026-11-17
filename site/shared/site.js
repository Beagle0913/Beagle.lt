(function () {
  'use strict';

  const LANG_KEY = 'beagle-lang';

  const STR = {
    lt: {
      home_title: 'beagle.lt – treniruokliai',
      heading: 'Treniruokliai',
      lede: 'Universitetinio lygio uždaviniai, sprendžiami žingsnis po žingsnio. Uždaviniai kaskart generuojami iš naujo, o kiekvienas žingsnis patikrinamas iškart.',
      open: 'Atverti →',
      privacy: 'Svetainėje nėra paskyrų, slapukų ar sekimo priemonių. Jūsų atsakymai ir pažanga saugomi tik jūsų naršyklėje. Šriftai įkeliami iš „Google Fonts“.',
      source: 'Pirminis kodas',
      lang_label: 'Kalba',
      bar_label: 'Treniruokliai',
      choose: 'Pasirinkite treniruoklį',
      nf_title: 'Puslapis nerastas',
      nf_heading: 'Tokio puslapio nėra',
      nf_lede: 'Adresas gali būti pasenęs arba įvestas su klaida. Šios svetainės treniruokliai:',
      nf_home: 'Į pradžią'
    },
    en: {
      home_title: 'beagle.lt – trainers',
      heading: 'Trainers',
      lede: 'University-level problems, solved one step at a time. Problems are generated fresh every time, and each step is checked as soon as you enter it.',
      open: 'Open →',
      privacy: 'This site has no accounts, cookies or trackers. Your answers and progress are kept only in your browser. Fonts are loaded from Google Fonts.',
      source: 'Source code',
      lang_label: 'Language',
      bar_label: 'Trainers',
      choose: 'Choose a trainer',
      nf_title: 'Page not found',
      nf_heading: 'This page does not exist',
      nf_lede: 'The address may be old or mistyped. These are the trainers on this site:',
      nf_home: 'Home'
    }
  };

  // Lithuanian is the default; only the exact value 'en' selects English.
  const normLang = value => (value === 'en' ? 'en' : 'lt');

  function readLang(storage) {
    try { return normLang(storage.getItem(LANG_KEY)); } catch (e) { return 'lt'; }
  }

  function writeLang(storage, lang) {
    try { storage.setItem(LANG_KEY, normLang(lang)); } catch (e) { /* blocked storage: ignore */ }
  }

  const isText = v => typeof v === 'string' && v.length > 0;

  // Asked language first, then the other one, then empty.
  function pick(text, lang) {
    if (typeof text === 'string') return text;
    if (!text || typeof text !== 'object') return '';
    const l = normLang(lang);
    const other = l === 'lt' ? 'en' : 'lt';
    if (isText(text[l])) return text[l];
    if (isText(text[other])) return text[other];
    return '';
  }

  function validTrainer(entry) {
    return !!entry && typeof entry === 'object' &&
      typeof entry.id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(entry.id) &&
      isText(entry.path) &&
      !!entry.name && typeof entry.name === 'object' &&
      isText(entry.name.lt) && isText(entry.name.en);
  }

  // Links built from trainer data must stay under the site root; anything
  // else (other origin, parent folder, bad syntax) falls back to the home page.
  function trainerUrl(entry, rootHref) {
    try {
      const root = new URL(rootHref);
      const url = new URL(entry.path, root);
      return url.origin === root.origin && url.href.startsWith(root.href) ? url.href : rootHref;
    } catch (e) {
      return rootHref;
    }
  }

  function cleanTrainers(data) {
    const list = data && Array.isArray(data.trainers) ? data.trainers : [];
    const seen = new Set();
    const out = [];
    for (const entry of list) {
      if (!validTrainer(entry) || seen.has(entry.id)) continue;
      seen.add(entry.id);
      out.push(entry);
    }
    return out;
  }

  // The trainer list is offered only when there is something to switch between.
  function barModel(trainers, currentId, lang, rootHref) {
    const s = STR[normLang(lang)];
    return {
      homeHref: rootHref,
      label: s.bar_label,
      choose: s.choose,
      options: trainers.length < 2 ? [] : trainers.map(t => ({
        href: trainerUrl(t, rootHref),
        text: pick(t.name, lang),
        current: t.id === currentId
      }))
    };
  }

  const core = { LANG_KEY, STR, normLang, readLang, writeLang, pick, validTrainer, trainerUrl, cleanTrainers, barModel };

  if (typeof module === 'object' && module.exports) { module.exports = core; return; }

  // ---- Browser part ----
  // document.currentScript only exists while the script first runs, so read it now.
  const ROOT = new URL('../', document.currentScript.src).href;
  const byId = id => document.getElementById(id);
  let trainers = [];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // Reading window.localStorage itself can throw, so it is reached inside try.
  function store() { try { return window.localStorage; } catch (e) { return null; } }

  function loadTrainers() {
    return fetch(new URL('trainers.json', ROOT).href)
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(data => { trainers = cleanTrainers(data); return trainers; })
      .catch(() => []);
  }

  /* ---------- trainer page: the top bar ---------- */
  function startBar(id) {
    const home = el('a', 'sb-home');
    const arrow = el('span', '', '←');
    arrow.setAttribute('aria-hidden', 'true');
    home.append(arrow, ' beagle.lt');
    const nav = el('nav', 'sitebar');
    nav.append(home);
    const slot = byId('sitebar');
    if (slot) slot.replaceWith(nav); else document.body.prepend(nav);
    let select = null;

    function draw() {
      const lang = normLang(document.documentElement.lang);
      const m = barModel(trainers, id, lang, ROOT);
      nav.setAttribute('aria-label', m.label);
      home.href = m.homeHref;
      if (select) { select.remove(); select = null; }
      if (!m.options.length) return;
      select = el('select');
      select.setAttribute('aria-label', m.choose);
      for (const o of m.options) {
        const opt = el('option', '', o.text);
        opt.value = o.href;
        opt.selected = o.current;
        select.append(opt);
      }
      select.addEventListener('change', () => { location.href = select.value; });
      nav.append(select);
    }

    draw();
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    // Coming back from the back/forward cache must not leave another trainer selected.
    window.addEventListener('pageshow', draw);
    loadTrainers().then(draw);
  }

  /* ---------- home and 404 pages ---------- */
  function drawList(lang) {
    const list = byId('trainer-list');
    if (!list || !trainers.length) return; // keep the static rows
    const s = STR[lang];
    list.replaceChildren(...trainers.map((t, i) => {
      const a = el('a', 'row');
      a.href = trainerUrl(t, ROOT);
      a.append(el('span', 'no', String(i + 1).padStart(2, '0')), el('h2', 'name', pick(t.name, lang)),
        el('span', 'open', s.open), el('p', 'sum', pick(t.summary, lang)), el('p', 'note', pick(t.note, lang)));
      const li = el('li');
      li.append(a);
      return li;
    }));
  }

  function applyLang(lang) {
    const s = STR[lang];
    document.documentElement.lang = lang;
    if (s[document.body.dataset.title]) document.title = s[document.body.dataset.title];
    for (const n of document.querySelectorAll('[data-i18n]')) {
      if (s[n.dataset.i18n]) n.textContent = s[n.dataset.i18n];
    }
    const langs = byId('langs');
    if (langs) langs.setAttribute('aria-label', s.lang_label);
    for (const b of document.querySelectorAll('#langs button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    drawList(lang);
  }

  function startHome() {
    applyLang(readLang(store()));
    for (const b of document.querySelectorAll('#langs button')) {
      b.addEventListener('click', () => { writeLang(store(), b.dataset.lang); applyLang(normLang(b.dataset.lang)); });
    }
    loadTrainers().then(() => applyLang(normLang(document.documentElement.lang)));
  }

  if (document.body.dataset.trainer) startBar(document.body.dataset.trainer);
  else if (document.body.classList.contains('home')) startHome();
})();
