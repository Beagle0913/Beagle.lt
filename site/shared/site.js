(function () {
  'use strict';

  const LANG_KEY = 'beagle-lang';

  const STR = {
    lt: {
      home_title: 'beagle.lt – treniruokliai',
      heading: 'Treniruokliai',
      lede: 'Universitetinio lygio uždaviniai, sprendžiami žingsnis po žingsnio. Uždaviniai kaskart generuojami iš naujo, o kiekvienas žingsnis patikrinamas iškart.',
      open: 'Atverti →',
      privacy: 'Niekas nerenkama ir niekur nesiunčiama. Pažanga saugoma tik jūsų naršyklėje.',
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
      privacy: 'Nothing is collected or sent anywhere. Your progress is kept only in your browser.',
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

  // Browser part goes below this line (added in a later task).
})();
