/* Mastery, the review queue and exam scoring. No DOM here. State lives under the browser-storage key beagle-organic-v1. */
(function (ORG) {
  'use strict';
  const CAP = 1e6, MAX_MISSED = 200, MAX_SECTIONS = 80;
  const ID = /^[A-Za-z0-9][A-Za-z0-9._#-]{0,59}$/;
  const EXAMS = { mt1: { weight: 0.3, pass: null }, mt2: { weight: 0.5, pass: 1.7 }, exam: { weight: 0.8, pass: null } };

  const count = v => (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.min(Math.floor(v), CAP) : 0;
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const cleanRef = r => (isObj(r) && typeof r.type === 'string' && ID.test(r.type) && typeof r.seed === 'number' && isFinite(r.seed) && r.seed >= 0 && r.seed <= 2147483647)
    ? { type: r.type, seed: Math.floor(r.seed) } : null;
  const sameRef = (a, b) => a.type === b.type && a.seed === b.seed;
  const fresh = () => ({ v: 1, types: {}, missed: [], sections: {}, totals: {} });

  // load(raw) never throws; every field is checked on its own and bad ones are dropped.
  function load(raw) {
    const s = fresh();
    let d = null;
    try { d = typeof raw === 'string' && raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!isObj(d) || d.v !== 1) return s;
    if (isObj(d.types)) for (const id of Object.keys(d.types)) {
      const t = d.types[id];
      if (!ID.test(id) || !isObj(t)) continue;
      s.types[id] = { attempts: count(t.attempts), first: count(t.first), streak: count(t.streak) };
    }
    if (Array.isArray(d.missed)) for (const r of d.missed) {
      const c = cleanRef(r);
      if (c && !s.missed.some(m => sameRef(m, c)) && s.missed.length < MAX_MISSED) s.missed.push(c);
    }
    if (isObj(d.sections)) for (const u of Object.keys(d.sections)) {
      if (!ID.test(u) || !Array.isArray(d.sections[u])) continue;
      const list = Array.from(new Set(d.sections[u].filter(x => typeof x === 'string' && ID.test(x)))).slice(0, MAX_SECTIONS);
      if (list.length) s.sections[u] = list;
    }
    if (isObj(d.totals)) for (const u of Object.keys(d.totals)) {
      const n = count(d.totals[u]);
      if (ID.test(u) && n > 0 && n <= 200) s.totals[u] = n;
    }
    return s;
  }
  const save = s => JSON.stringify(s);

  const entry = (s, id) => s.types[id] || (s.types[id] = { attempts: 0, first: 0, streak: 0 });

  // One finished problem. firstTry: every step right at the first check and no solution shown. hinted: a hint was opened.
  function record(s, typeId, o) {
    const t = entry(s, typeId);
    const firstTry = !!(o && o.firstTry), hinted = !!(o && o.hinted);
    t.attempts = Math.min(t.attempts + 1, CAP);
    if (firstTry && !hinted) { t.first = Math.min(t.first + 1, CAP); t.streak = Math.min(t.streak + 1, CAP); } else t.streak = 0;
    const ref = cleanRef(o && o.problemRef);
    if (ref) {
      if (firstTry) s.missed = s.missed.filter(m => !sameRef(m, ref));
      else if (!s.missed.some(m => sameRef(m, ref))) { s.missed.push(ref); if (s.missed.length > MAX_MISSED) s.missed.shift(); }
    }
    return s;
  }
  const forget = (s, ref) => { s.missed = s.missed.filter(m => !sameRef(m, ref)); return s; };
  const stars = (s, id) => s.types[id] ? Math.min(3, s.types[id].streak) : 0;
  const mastered = (s, id) => stars(s, id) >= 3;
  const reviewQueue = s => s.missed.map(r => ({ type: r.type, seed: r.seed }));

  function rememberTotal(s, unitId, n) { if (ID.test(unitId) && n > 0 && n <= 200) s.totals[unitId] = Math.floor(n); return s; }
  // unit: {id, types?}. A unit that is not loaded uses the total remembered from the last time it was.
  function unitCounts(s, unit) {
    const ids = unit && Array.isArray(unit.types) ? unit.types.map(t => t.id) : null;
    if (ids) return { done: ids.filter(id => mastered(s, id)).length, total: ids.length };
    const total = unit && s.totals[unit.id] || 0;
    const prefix = unit ? unit.id + '.' : '';
    return { done: total ? Object.keys(s.types).filter(id => id.startsWith(prefix) && mastered(s, id)).length : 0, total };
  }
  function unitShare(s, unit) { const c = unitCounts(s, unit); return c.total ? Math.min(1, c.done / c.total) : 0; }
  function openSection(s, unitId, sectionId) {
    if (!ID.test(unitId) || !ID.test(sectionId)) return false;
    const list = s.sections[unitId] || (s.sections[unitId] = []);
    if (list.includes(sectionId) || list.length >= MAX_SECTIONS) return false;
    list.push(sectionId);
    return true;
  }

  // results: one per problem, {share} (0..1) or {right, steps}. Each problem is worth the exam's weight; ten problems fill the maximum.
  function examScore(results, exam) {
    const e = EXAMS[exam];
    if (!e) throw new Error('unknown exam: ' + exam);
    const share = r => {
      if (!isObj(r)) return 0;
      let x = typeof r.share === 'number' ? r.share : (r.steps > 0 ? r.right / r.steps : 0);
      if (!isFinite(x)) x = 0;
      return Math.min(1, Math.max(0, x));
    };
    const raw = (Array.isArray(results) ? results : []).slice(0, 10).reduce((a, r) => a + share(r) * e.weight, 0);
    const score = Math.round(raw * 100) / 100;
    return { score, max: Math.round(e.weight * 10 * 100) / 100, pass: e.pass === null ? null : score >= e.pass };
  }

  ORG.progress = { EXAMS, load, save, record, forget, stars, mastered, unitShare, unitCounts, rememberTotal, openSection, reviewQueue, examScore };
})(globalThis.ORG = globalThis.ORG || {});
