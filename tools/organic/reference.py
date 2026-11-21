# RDKit reference answers for the organic trainer's engine (site/organic/js/chem.js, stereo.js).
#
# The trainer itself does not use RDKit and never ships it. This script only
# produces answers from an independent implementation and freezes them in
# tests/organic/fixtures/reference.json, so tests/organic/reference.test.js can
# compare our engine with RDKit without Python in the test run.
#
# RDKit version used for the committed fixture: 2026.09.2
# Install (owner approved 2026-11-21): python -m pip install --user rdkit
#
# Usage (from the repo root):
#   python -I tools/organic/reference.py                  rewrite the fixture
#   python -I tools/organic/reference.py --check FILE     check molecules for later tasks
#
# FILE for --check has one SMILES per line, optionally followed by a TAB and the
# molecular formula the author claims (Hill order, no charge sign needed). The
# script prints RDKit's formula, canonical SMILES, stereocentres with CIP labels
# and E/Z bonds, and exits 1 if a SMILES does not parse or a claimed formula is wrong.
#
# `-I` (isolated mode) ignores the per-user site folder where `pip install --user`
# puts RDKit, so the folder is added to sys.path explicitly below.
import json
import os
import site
import sys

sys.path.append(site.getusersitepackages())

from rdkit import Chem, RDLogger, __version__ as RDKIT_VERSION  # noqa: E402
from rdkit.Chem import rdCIPLabeler  # noqa: E402

RDLogger.DisableLog('rdApp.*')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
MOLECULES = os.path.join(HERE, 'reference-molecules.txt')
FIXTURE = os.path.join(ROOT, 'tests', 'organic', 'fixtures', 'reference.json')


def hill(mol):
    """Hill formula without a charge sign (the test compares the charge separately)."""
    counts = {}
    for a in Chem.AddHs(mol).GetAtoms():
        counts[a.GetSymbol()] = counts.get(a.GetSymbol(), 0) + 1
    # Hill order: C, H, then alphabetical; with no carbon everything is alphabetical (HCl is ClH).
    # RDKit's own CalcMolFormula puts H first even without carbon, so the string is built here.
    keys = sorted(counts)
    if 'C' in counts:
        keys = ['C'] + (['H'] if 'H' in counts else []) + [k for k in keys if k not in ('C', 'H')]
    return ''.join(k + (str(counts[k]) if counts[k] > 1 else '') for k in keys)


# Engine bugs found by comparing with RDKit (see the report of task 2b). An entry carrying one is
# left out of the property tests and reported as todo by reference.test.js. Variants of the
# molecule inherit it. Keyed by the SMILES written in reference-molecules.txt.
_TMCH = 'canonical()/same() differ between spellings of one 1,3,5-trimethylcyclohexane stereoisomer'
_PSEUDO = ('stereocentres: r/s (pseudoasymmetric) centres missed and centres with two identical homochiral '
           'branches added, and the answer changes with the way the SMILES is written')
_RINGCIP = 'cip: ring stereocentres whose ligands differ only through the ring come out null; RDKit gives R/S'
KNOWN_BUGS = {
    'C[C@@H]1C[C@H](C)C[C@@H](C)C1': _TMCH,
    'C[C@H]1C[C@H](C)C[C@H](C)C1': _TMCH,
    'C[C@H]1C[C@@H](C)C[C@H](C)C1': _TMCH,
    'C[S@](=O)c1ccccc1': 'sulfoxide stereocentre: @ and @@ are treated as the same molecule',
    'C[S@@](=O)c1ccccc1': 'sulfoxide stereocentre: @ and @@ are treated as the same molecule',
    'C[P@](CC)c1ccccc1': 'phosphine stereocentre: @ and @@ are treated as the same molecule',
    'C[P@@](CC)c1ccccc1': 'phosphine stereocentre: @ and @@ are treated as the same molecule',
    'C[C@H]([13CH3])CC': 'isotopes: canonical(stereo:false) keeps the label, CIP ignores isotope mass',
    'CC(O)C(O)C(C)O': _PSEUDO,
    'C[C@H](O)[C@H](O)[C@@H](C)O': _PSEUDO,
    'OC(=O)[C@H](O)[C@H](O)[C@@H](O)C(=O)O': _PSEUDO,
    'C[C@H]([C@H](C)Cl)[C@H](C)Cl': _PSEUDO,
    'C[C@H](Cl)[C@H](C)[C@@H](C)Cl': _PSEUDO,
    'C[C@H](O)[C@H](O)[C@H](C)O': _PSEUDO,
    'OC(=O)[C@H](O)[C@H](O)[C@H](O)C(=O)O': _PSEUDO,
    'OC(=O)[C@H](O)[C@@H](O)[C@H](O)C(=O)O': _PSEUDO,
    'OC[C@H](O)[C@@H](O)[C@H](O)CO': _PSEUDO,
    'C[C@@H](Cl)[C@H](C)[C@@H](C)Cl': _PSEUDO,
    'O[C@H]1[C@H](O)[C@H](O)[C@H](O)[C@H](O)[C@H]1O': _RINGCIP,
    'O[C@H]1[C@@H](O)[C@H](O)[C@@H](O)[C@H](O)[C@@H]1O': _RINGCIP,
    'C[C@@H]1[C@H](C)[C@H](C)[C@H](C)[C@H](C)[C@H]1C': _RINGCIP,
    'C[C@H]1[C@H](C)[C@H](C)[C@H](C)[C@H](C)[C@H]1C': _RINGCIP,
    'C[C@@H]1[C@H](C)C[C@@H](C)C[C@H]1C': _RINGCIP,
    'C/C=C/[C@@H](C)/C=C\\C': 'centre whose two branches differ only by E/Z geometry is missed (RDKit: centre, R/S)',
}

# RDKit flags these as possible stereocentres, the engine does not, and the engine is right:
# cage bridgeheads whose three ring ligands are equivalent by symmetry, and a tetrahedral AlH4-.
# An entry with a note skips the stereocentre and CIP comparison only.
STEREO_NOTES = {
    'C12C3C4C1C5C2C3C45': 'cubane: no stereoisomers; RDKit flags every vertex',
    'C1C2CC3CC1CC(C2)C3': 'adamantane: bridgeheads have three equivalent ligands; RDKit flags them',
    'C1CC2CCC1CC2': 'bicyclo[2.2.2]octane: bridgeheads have three equivalent ligands; RDKit flags them',
    '[AlH4-].[Li+]': 'AlH4- is tetrahedral but not a carbon stereocentre of the course; RDKit flags the Al',
}

# Model differences between RDKit and the course (Hueckel on the ring's own pi system), keyed like
# KNOWN_BUGS. An entry with a note skips only the aromatic-atom comparison. None are needed so far:
# our engine and RDKit agree on every ring in the list, including the exocyclic C=O ones.
AROMATIC_NOTES = {}


def describe(smi, base=None):
    mol = Chem.MolFromSmiles(smi)
    if mol is None:
        return None
    centres = Chem.FindMolChiralCenters(mol, includeUnassigned=True, useLegacyImplementation=False)
    rdCIPLabeler.AssignCIPLabels(mol)
    cip, pseudo = {}, {}
    for a in mol.GetAtoms():
        if a.HasProp('_CIPCode'):
            c = a.GetProp('_CIPCode')
            if c in ('R', 'S'):
                cip[str(a.GetIdx())] = c
            elif c in ('r', 's'):
                pseudo[str(a.GetIdx())] = c
    ez = []
    for b in mol.GetBonds():
        if b.HasProp('_CIPCode') and b.GetProp('_CIPCode') in ('E', 'Z'):
            i, j = sorted((b.GetBeginAtomIdx(), b.GetEndAtomIdx()))
            ez.append([i, j, b.GetProp('_CIPCode')])
    ez.sort()
    flat = Chem.MolToSmiles(mol, isomericSmiles=False)
    entry = {
        'smi': smi,
        'formula': hill(mol),
        'charge': Chem.GetFormalCharge(mol),
        'aromaticAtoms': [a.GetIdx() for a in mol.GetAtoms() if a.GetIsAromatic()],
        'centres': sorted(i for i, _ in centres),
        'cip': cip,
        'pseudo': pseudo,
        'ez': ez,
        'canonical': Chem.MolToSmiles(mol),
        'flat': flat,
    }
    if base is not None:
        entry['variantOf'] = base
    bug = KNOWN_BUGS.get(base or smi)
    if bug:
        entry['knownBug'] = bug
    note = AROMATIC_NOTES.get(base or smi)
    if note:
        entry['aromaticNote'] = note
    note = STEREO_NOTES.get(base or smi)
    if note:
        entry['stereoNote'] = note
    return entry


def variants(smi, seed):
    """Equivalent spellings of one molecule: a random atom order and a Kekule form."""
    mol = Chem.MolFromSmiles(smi)
    out = []
    try:
        r = Chem.MolToRandomSmilesVect(mol, 1, randomSeed=seed)[0]
        out.append(r)
    except Exception:
        pass
    try:
        k = Chem.Mol(mol)
        Chem.Kekulize(k, clearAromaticFlags=True)
        out.append(Chem.MolToSmiles(k, kekuleSmiles=True))
    except Exception:
        pass
    good = []
    for v in out:
        if v != smi and v not in good:
            m2 = Chem.MolFromSmiles(v)
            if m2 is not None and Chem.MolToSmiles(m2) == Chem.MolToSmiles(mol):
                good.append(v)
    return good


def read_lines(path):
    with open(path, encoding='utf-8') as f:
        return [ln.strip() for ln in f if ln.strip() and not ln.lstrip().startswith('#')]


def check(path):
    bad = 0
    for ln in read_lines(path):
        parts = ln.split('\t')
        smi = parts[0].strip()
        claim = parts[1].strip() if len(parts) > 1 else None
        d = describe(smi)
        if d is None:
            print('INVALID  ', smi)
            bad += 1
            continue
        status = 'ok'
        if claim is not None and claim.replace('+', '').replace('-', '').replace('−', '') != d['formula']:
            status = 'FORMULA ' + claim + ' != ' + d['formula']
            bad += 1
        print('%-9s %s  %s  canonical=%s  centres=%s cip=%s ez=%s' % (
            status if status != 'ok' else 'ok', smi, d['formula'], d['canonical'], d['centres'], d['cip'], d['ez']))
    return 1 if bad else 0


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == '--check':
        sys.exit(check(sys.argv[2]))
    smis = []
    for s in read_lines(MOLECULES):
        if s not in smis:
            smis.append(s)
    entries, seen, skipped, bases = [], set(), [], []
    for s in smis:
        d = describe(s)
        if d is None:
            skipped.append(s)
            continue
        entries.append(d)
        seen.add(s)
        bases.append(s)
    for n, s in enumerate(bases):
        for v in variants(s, 1000 + n):
            if v in seen:
                continue
            dv = describe(v, base=s)
            if dv is not None:
                seen.add(v)
                entries.append(dv)
    for s in skipped:
        print('RDKit cannot parse, skipped:', s, file=sys.stderr)
    out = entries
    os.makedirs(os.path.dirname(FIXTURE), exist_ok=True)
    with open(FIXTURE, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, indent=0, ensure_ascii=True)
        f.write('\n')
    print('RDKit', RDKIT_VERSION, '-', len(entries), 'entries (', len(smis) - len(skipped), 'molecules ) written to', FIXTURE)


if __name__ == '__main__':
    main()
