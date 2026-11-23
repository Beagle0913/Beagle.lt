'use strict';
// Loads the organic trainer's engine files into one vm context that has no
// window and no document, and returns the ORG object they build.
// Arrays and objects made inside the context belong to another realm, so
// assert.deepStrictEqual on them fails on prototypes: compare with
// load.plain(x) (a JSON round trip) or use assert.deepEqual.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const JS = path.join(ROOT, 'site', 'organic', 'js');
// ui.js needs a DOM and is never loaded here.
const ORDER = ['chem.js', 'stereo.js', 'draw.js', 'views.js', 'name.js', 'react.js',
  'units.js', 'check.js', 'progress.js'];

function context(files) {
  const names = files || ORDER.filter((f) => fs.existsSync(path.join(JS, f)));
  const ctx = vm.createContext({ console });
  for (const f of names) {
    if (f === 'ui.js') throw new Error('ui.js needs a DOM and cannot be loaded here');
    const file = path.join(JS, f);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return ctx;
}

function load(files) {
  const ctx = context(files);
  return vm.runInContext('globalThis.ORG = globalThis.ORG || {}', ctx);
}

// Runs one unit file (site/organic/units/uNN.js) against a fresh engine and
// returns the Unit it passes to ORG.unit.
load.unit = function (file) {
  const ctx = context();
  const ORG = vm.runInContext('globalThis.ORG = globalThis.ORG || {}', ctx);
  let found = null;
  let calls = 0;
  ORG.unit = (u) => { calls++; found = u; };
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  vm.runInContext(fs.readFileSync(abs, 'utf8'), ctx, { filename: abs });
  if (calls !== 1) throw new Error(file + ' must call ORG.unit exactly once (called ' + calls + ')');
  return found;
};

// the vm context itself, for tests that inspect what the engine can see
load.context = context;

load.plain = (x) => JSON.parse(JSON.stringify(x));

module.exports = load;
