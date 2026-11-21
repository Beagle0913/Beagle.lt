// Fixture: a unit file that throws while loading (the loader must show a message, not break the page).
(function (ORG) {
  throw new Error('fixture unit that fails to load');
})(globalThis.ORG = globalThis.ORG || {});
