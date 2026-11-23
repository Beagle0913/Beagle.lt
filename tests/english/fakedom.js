'use strict';
// A very small fake DOM, just enough to run the English trainer's scenes.js and ui.js in node.
// It is not a browser: it only records what the scripts build, so tests can look at it.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeText {
  constructor(t) { this.nodeType = 3; this.textContent = String(t); this.parentNode = null; }
}

class FakeEl {
  constructor(tag, doc) {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.localName = String(tag);
    this.ownerDocument = doc;
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.style = new Proxy({ setProperty(k, v) { this[k] = v; } }, { set: (o, k, v) => { o[k] = v; doc.styleWrites.push([this, k]); return true; } });
    this.listeners = {};
    this.dataset = {};
    this.disabled = false;
    this.type = '';
    this.tabIndex = 0;
    const self = this;
    this.classList = {
      add(c) { const s = new Set((self.attrs['class'] || '').split(/\s+/).filter(Boolean)); s.add(c); self.attrs['class'] = [...s].join(' '); },
      remove(c) { const s = new Set((self.attrs['class'] || '').split(/\s+/).filter(Boolean)); s.delete(c); self.attrs['class'] = [...s].join(' '); },
      contains(c) { return (self.attrs['class'] || '').split(/\s+/).includes(c); }
    };
  }
  get className() { return this.attrs['class'] || ''; }
  set className(v) { this.attrs['class'] = v; }
  get childNodes() { return this.children; }
  get firstChild() { return this.children[0] || null; }
  get textContent() { return this.children.map((c) => c.textContent).join('') + (this._text || ''); }
  set textContent(v) { this.children.forEach((c) => { c.parentNode = null; }); this.children = []; this._text = String(v); }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k.startsWith('data-')) this.dataset[k.slice(5)] = String(v);
    if (k === 'style') this.ownerDocument.styleWrites.push([this, 'style-attribute']);
  }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  appendChild(n) { n.parentNode = this; this.children.push(n); return n; }
  append(...ns) { for (const n of ns) this.appendChild(typeof n === 'string' ? new FakeText(n) : n); }
  removeChild(n) { this.children = this.children.filter((c) => c !== n); n.parentNode = null; return n; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  focus() { this.ownerDocument.active = this; }
  closest(sel) {
    for (let n = this; n && n.nodeType === 1; n = n.parentNode) if (sel.split(',').some((s) => n.matches(s.trim()))) return n;
    return null;
  }
  matches(sel) {
    if (sel[0] === '#') return this.attrs.id === sel.slice(1);
    if (sel[0] === '.') return this.classList.contains(sel.slice(1));
    return this.localName === sel;
  }
  querySelectorAll(sel) {
    const parts = sel.trim().split(/\s+/);
    const out = [];
    const walk = (n, depthOk) => {
      for (const c of n.children) {
        if (c.nodeType !== 1) continue;
        if (parts.length === 1 ? c.matches(parts[0]) : (c.matches(parts[1]) && c.closest(parts[0]) && c.closest(parts[0]) !== c)) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
  click() { this.fire('click', {}); }
  fire(type, ev) {
    if (this.disabled && type === 'click') return;
    const e = Object.assign({ type, target: this, key: '', preventDefault() {}, stopPropagation() {} }, ev);
    for (const fn of this.listeners[type] || []) fn(e);
  }
}

function makeDocument() {
  const doc = {
    styleWrites: [],
    active: null,
    title: '',
    listeners: {},
    ids: {},
    createElement(t) { return new FakeEl(t, doc); },
    createElementNS(ns, t) { return new FakeEl(t, doc); },
    createTextNode(t) { return new FakeText(t); },
    getElementById(id) { return doc.ids[id] || null; },
    addEventListener(t, fn) { (doc.listeners[t] = doc.listeners[t] || []).push(fn); },
    querySelectorAll(sel) { return doc.body.querySelectorAll(sel); },
    key(key, target) {
      const ev = { type: 'keydown', key, target: target || doc.body, preventDefault() {}, ctrlKey: false, altKey: false, metaKey: false };
      for (const fn of doc.listeners.keydown || []) fn(ev);
    }
  };
  doc.documentElement = new FakeEl('html', doc);
  doc.documentElement.lang = 'lt';
  doc.body = new FakeEl('body', doc);
  return doc;
}

// Build a page like index.html (header with language buttons, #app), run the given site/english/js files.
function boot(files, opts) {
  opts = opts || {};
  const doc = makeDocument();
  const mk = (tag, id) => { const e = doc.createElement(tag); if (id) { e.setAttribute('id', id); doc.ids[id] = e; } return e; };
  const sitebar = mk('div', 'sitebar');
  const brand = mk('p', 'brand');
  const langs = mk('div', 'langs');
  for (const l of ['lt', 'en']) { const b = doc.createElement('button'); b.setAttribute('data-lang', l); langs.appendChild(b); }
  const app = mk('main', 'app');
  doc.body.append(sitebar, brand, langs, app);
  const store = {};
  const ctx = vm.createContext({
    console, document: doc,
    window: { matchMedia: () => ({ matches: !!opts.reduced }), scrollTo() {} },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }
  });
  ctx.window.document = doc;
  const dir = path.join(__dirname, '..', '..', 'site', 'english', 'js');
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  return { doc, app, ctx, store, ENG: vm.runInContext('globalThis.ENG', ctx) };
}

function walk(n, fn) { fn(n); for (const c of n.children || []) walk(c, fn); }
function findAll(root, pred) { const out = []; walk(root, (n) => { if (n.nodeType === 1 && pred(n)) out.push(n); }); return out; }

module.exports = { boot, findAll, walk, FakeEl };
