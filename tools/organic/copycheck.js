'use strict';
// Copy check: compares every Lithuanian text of a unit file with the text layers of the course slides,
// seminar sheets and lab texts (not in the repo), by word 8-gram overlap after lowercasing and stripping punctuation.
//
//   node tools/organic/copycheck.js site/organic/units/u07.js [--src <folder with .txt files>] [--n 8]
//   env COPYCHECK_SRC=<folder> works too.
//
// Prints each overlap with the source file and line; exit code 1 when any 8-gram matches, 2 on a usage error.
const fs = require('node:fs');
const path = require('node:path');
const load = require('../../tests/organic/load.js');

const DEFAULT_SRC = 'C:\\Users\\dziug\\AppData\\Local\\Temp\\claude\\2e72c334fbad91a1\\44a07bdd-622e-4787-a8b6-fa8ed9f03882\\scratchpad\\organine';

function parseArgs(argv) {
  const o = { file: null, src: process.env.COPYCHECK_SRC || DEFAULT_SRC, n: 8 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src') o.src = argv[++i];
    else if (argv[i] === '--n') o.n = parseInt(argv[++i], 10) || 8;
    else if (!o.file) o.file = argv[i];
  }
  return o;
}

// words of a text: lower case, markup and punctuation removed
const words = (s) => s.toLowerCase().replace(/\*\*?|\$|\^/g, ' ').split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function sourceIndex(dir, n) {
  const idx = new Map(); // 8-gram -> [{file, line}]
  const files = fs.readdirSync(dir).filter((f) => /\.txt$/i.test(f)).sort();
  for (const f of files) {
    const w = [], lineOf = [];
    fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/).forEach((line, li) => words(line).forEach((x) => { w.push(x); lineOf.push(li + 1); }));
    for (let i = 0; i + n <= w.length; i++) {
      const k = w.slice(i, i + n).join(' ');
      if (!idx.has(k)) idx.set(k, []);
      const l = idx.get(k);
      if (l.length < 3) l.push({ file: f, line: lineOf[i] });
    }
  }
  return { idx, files };
}

// every Lithuanian string of the unit, with where it is
function ltTexts(unit) {
  const out = [];
  (function walk(node, where) {
    if (Array.isArray(node)) return node.forEach((x, i) => walk(x, where + '[' + i + ']'));
    if (!node || typeof node !== 'object') return;
    if (typeof node.lt === 'string' && typeof node.en === 'string') return out.push({ where, text: node.lt });
    for (const k of Object.keys(node)) {
      if (typeof node[k] === 'function') continue;
      walk(node[k], where ? where + '.' + k : k);
    }
  })(unit, '');
  // generated problems are not run here: only written text is compared
  return out;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.file) { console.error('usage: node tools/organic/copycheck.js <unit file> [--src <folder>] [--n 8]'); return 2; }
  if (!fs.existsSync(o.src)) { console.error('source folder not found: ' + o.src + ' (use --src or COPYCHECK_SRC)'); return 2; }
  const unit = load.unit(path.resolve(o.file));
  const { idx, files } = sourceIndex(o.src, o.n);
  let hits = 0;
  for (const t of ltTexts(unit)) {
    const w = words(t.text);
    let run = null;
    const flush = () => {
      if (!run) return;
      hits++;
      const text = w.slice(run.start, run.end + o.n).join(' ');
      console.log(unit.id + ' ' + t.where + '\n  copied ' + (run.end - run.start + o.n) + ' words: "' + text + '"\n  source: ' + run.src.map((s) => s.file + ' line ' + s.line).join('; '));
      run = null;
    };
    for (let i = 0; i + o.n <= w.length; i++) {
      const src = idx.get(w.slice(i, i + o.n).join(' '));
      if (src) { if (run && i <= run.end + 1) { run.end = i; } else { flush(); run = { start: i, end: i, src }; } }
    }
    flush();
  }
  console.log(hits ? hits + ' overlapping passage(s) of ' + o.n + '+ words with ' + files.length + ' source files in ' + unit.id : 'no ' + o.n + '-gram overlap in ' + unit.id + ' (' + files.length + ' source files)');
  return hits ? 1 : 0;
}

process.exitCode = main();
