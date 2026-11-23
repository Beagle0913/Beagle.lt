'use strict';
// Prints one line per atom of a SMILES: index, element, H count, neighbours,
// hybridisation and carbon class. Atom numbers are the 0-based positions in
// the SMILES string, hydrogens not counted (the numbers the trainer uses).
//   node tools/organic/atoms.js "CC(=O)O"
const path = require('node:path');
require(path.join(__dirname, '..', '..', 'site', 'organic', 'js', 'chem.js'));
const chem = globalThis.ORG.chem;

const smi = process.argv[2];
if (!smi) {
  console.error('usage: node tools/organic/atoms.js "<smiles>"');
  process.exit(2);
}
let mol;
try {
  mol = chem.parse(smi);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
console.log('idx el  H  neighbours        hyb   class');
mol.atoms.forEach((a, i) => {
  const hyb = chem.hybridization(mol, i);
  const cls = a.el === 'C' ? String(chem.carbonClass(mol, i)) : '-';
  const el = a.el + (a.aromatic ? ' (ar)' : '') + (a.charge ? (a.charge > 0 ? '+' : '-') + (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : '') : '');
  console.log(
    String(i).padEnd(3), el.padEnd(8), String(a.h).padEnd(2), mol.nbr[i].join(',').padEnd(16), String(hyb || '-').padEnd(5), cls,
  );
});
console.log(chem.formulaString(mol));
