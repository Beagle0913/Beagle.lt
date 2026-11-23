/* The list of units, the unit registry and the unit loader. No DOM here: the page passes in how to add a script. */
(function (ORG) {
  'use strict';
  const T = (lt, en) => ({ lt, en });
  const MT1 = ['mt1', 'exam'], MT2 = ['mt2', 'exam'];
  const row = (n, part, lt, en, exams, sources, ready) => ({ id: 'u' + String(n).padStart(2, '0'), n: String(n), part, file: 'units/u' + String(n).padStart(2, '0') + '.js', title: T(lt, en), exams, sources, ready: ready === true });
  const lab = (n, lt, en, ready) => ({ id: 'l' + n, n: 'L' + n, part: 3, file: 'units/l' + n + '.js', title: T(lt, en), exams: [], sources: ['LW' + n], ready: ready === true });

  ORG.UNITS = [
    row(1, 1, 'Formulės, klasifikavimas ir nomenklatūra', 'Formulas, classification and nomenclature', MT1, ['L1', 'S1'], true),
    row(2, 1, 'Atomo sandara ir cheminis ryšys', 'Atomic structure and chemical bonding', MT1, ['L2', 'S2'], true),
    row(3, 1, 'Atomų tarpusavio sąveika; reakcijos ir reagentai', 'Interactions between atoms; reactions and reagents', MT1, ['L3', 'S2'], true),
    row(4, 1, 'Rūgštys ir bazės', 'Acids and bases', MT1, ['L4', 'S2'], true),
    row(5, 1, 'Izomerija', 'Isomerism', MT1, ['L5', 'S3'], true),
    row(6, 2, 'Alkanai ir SR reakcijos', 'Alkanes and SR reactions', MT2, ['L6', 'S4'], true),
    row(7, 2, 'Alkenai ir AE reakcijos', 'Alkenes and AE reactions', MT2, ['L7', 'S4'], true),
    row(8, 2, 'Dienai, alkinai ir mažieji ciklai', 'Dienes, alkynes and small rings', MT2, ['L8', 'S4'], true),
    row(9, 2, 'Arenai ir SEAr reakcijos', 'Arenes and SEAr reactions', MT2, ['L9', 'S4'], true),
    row(10, 2, 'Halogendariniai: SN1, SN2, E1, E2', 'Halogen compounds: SN1, SN2, E1, E2', MT2, ['L10', 'S5'], true),
    row(11, 2, 'Alkoholiai', 'Alcohols', MT2, ['L11', 'S5'], true),
    row(12, 2, 'Polihidroksiliai alkoholiai, fenoliai, tioliai, eteriai', 'Polyhydric alcohols, phenols, thiols, ethers', MT2, ['L12', 'S5'], true),
    row(13, 2, 'Aldehidai ir ketonai', 'Aldehydes and ketones', MT2, ['L13', 'S6'], true),
    row(14, 2, 'Karboksirūgštys ir jų dariniai', 'Carboxylic acids and their derivatives', MT2, ['S6', 'CD'], true),
    row(15, 2, 'Aminai', 'Amines', MT2, ['S7', 'CD'], true),
    row(16, 2, 'Azoto heterocikliniai junginiai', 'Nitrogen heterocycles', MT2, ['S7', 'CD'], true),
    lab(1, 'Kristalinimas ir lydymosi temperatūra', 'Crystallisation and melting point', true),
    lab(2, 'Distiliavimas ir lūžio rodiklis', 'Distillation and refractive index', true),
    lab(3, 'Kofeino išskyrimas, ekstrakcija, plonasluoksnė chromatografija', 'Isolating caffeine, extraction, thin-layer chromatography', true),
    lab(4, 'Acetilsalicilo rūgšties (aspirino) sintezė', 'Synthesis of acetylsalicylic acid (aspirin)', true),
    lab(5, 'Maleino rūgšties izomerizacija', 'Isomerisation of maleic acid', true),
    lab(6, 'Funkcinių grupių reakcijos', 'Reactions of functional groups', true)
  ];

  // The trainer is released in stages: only units marked ready are shown anywhere (a content task flips its own unit to true).
  ORG.readyUnits = () => ORG.UNITS.filter(u => u.ready === true);
  ORG.readyUnit = id => ORG.UNITS.find(u => u.id === id && u.ready === true) || null;
  ORG.readyParts = () => ORG.PARTS.filter(pt => ORG.readyUnits().some(u => u.part === pt.part));
  ORG.examUnits = kind => ORG.readyUnits().filter(u => u.exams.includes(kind));
  // The whole-course exam is offered only once a Part I unit is ready too (otherwise it would just repeat midterm 2).
  ORG.examAvailable = kind => ORG.examUnits(kind).length > 0 && (kind !== 'exam' || ORG.examUnits('mt1').length > 0);
  const squash = ns => { const out = []; for (let i = 0; i < ns.length; i++) { let j = i; while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++; out.push(j > i ? ns[i] + '–' + ns[j] : String(ns[i])); i = j; } return out.join(', '); };
  // What an exam really draws from: span = ready unit numbers, missing = unit numbers of this exam that are not released yet.
  ORG.examInfo = kind => {
    const ready = ORG.examUnits(kind).map(u => Number(u.n));
    const missing = ORG.UNITS.filter(u => u.exams.includes(kind) && u.ready !== true).map(u => Number(u.n));
    return { span: squash(ready), missing: squash(missing), partial: missing.length > 0 };
  };

  // Exam parts and their titles (the home page lists the units in these groups).
  ORG.PARTS = [
    { part: 1, title: T('I dalis · 1 tarpinis egzaminas', 'Part I · midterm 1'), exam: 'mt1' },
    { part: 2, title: T('II dalis · 2 tarpinis egzaminas', 'Part II · midterm 2'), exam: 'mt2' },
    { part: 3, title: T('Laboratoriniai darbai', 'Laboratory work'), exam: null }
  ];

  // A unit file calls ORG.unit(Unit) once.
  ORG.units = ORG.units || {};
  ORG.unit = function (unit) {
    if (!unit || typeof unit !== 'object' || typeof unit.id !== 'string' || !unit.id) throw new Error('ORG.unit: a unit needs an id');
    ORG.units[unit.id] = unit;
    return unit;
  };

  // loadUnit(id, inject) -> Promise<Unit>. inject(src, done) adds the script and calls done(err?) when it has loaded or failed.
  // A script that throws still counts as loaded by the browser, so success is judged by the unit having registered itself.
  const pending = {};
  ORG.loadUnit = function (id, inject) {
    const meta = ORG.UNITS.find(u => u.id === id);
    if (!meta) return Promise.reject(new Error('unknown unit: ' + id));
    if (ORG.units[id]) return Promise.resolve(ORG.units[id]);
    if (pending[id]) return pending[id];
    const p = new Promise((resolve, reject) => {
      let finished = false;
      const done = err => {
        if (finished) return;
        finished = true;
        const unit = ORG.units[id];
        if (err) return reject(new Error('not available: ' + (err.message || err)));
        if (!unit) return reject(new Error('not available: the unit file did not register unit ' + id));
        const errors = ORG.check && ORG.check.validateUnit ? ORG.check.validateUnit(unit) : [];
        if (errors.length) { delete ORG.units[id]; return reject(new Error('not available: invalid unit (' + errors[0] + ')')); }
        resolve(unit);
      };
      try { inject(meta.file, done); } catch (e) { done(e); }
    });
    pending[id] = p;
    const clear = () => { delete pending[id]; };
    p.then(clear, clear);
    return p;
  };
})(globalThis.ORG = globalThis.ORG || {});
