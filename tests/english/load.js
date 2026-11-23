'use strict';
// Loads the English trainer's DOM-free files into one vm context and returns ENG.
// Objects made inside the context belong to another realm: compare with load.plain(x)
// (a JSON round trip) or use assert.deepEqual.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const JS = path.join(__dirname, '..', '..', 'site', 'english', 'js');
// scenes.js and ui.js need a DOM and are never loaded here.
const ORDER = ['lesson.js', 'strings.js', 'engine.js'];

function load(files) {
  const names = files || ORDER.filter((f) => fs.existsSync(path.join(JS, f)));
  const ctx = vm.createContext({ console });
  for (const f of names) {
    const file = path.join(JS, f);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return vm.runInContext('globalThis.ENG = globalThis.ENG || {}', ctx);
}
load.plain = (x) => JSON.parse(JSON.stringify(x));
module.exports = load;
