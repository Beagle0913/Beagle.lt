// Fixture: a small complete unit using every Block kind and every Step kind.
// Copy it to site/organic/units/u01.js in a working copy to look at it in the browser (never commit that copy).
(function (ORG) {
  const t = (lt, en) => ({ lt, en });
  const pent = { smi: 'CCCCC', name: t('pentanas', 'pentane'), caption: t('Pentanas', 'Pentane') };
  const acid = { smi: 'CC(=O)O', opts: { numbers: 'all' } };

  const bank = [
    {
      id: 'u01.bank.1',
      q: [{ p: t('Pentano savybės ir pavidalai.', 'Properties and forms of pentane.') }, { mol: pent }],
      steps: [
        {
          prompt: t('Kuris teiginys teisingas?', 'Which statement is right?'), kind: 'choice',
          options: [{ text: t('Pentanas turi 4 anglis', 'Pentane has 4 carbons') }, { text: t('Pentanas turi 5 anglis', 'Pentane has 5 carbons') }, { mol: { smi: 'CCCC' } }],
          answer: 1, hint: t('Suskaičiuokite grandinės atomus.', 'Count the chain atoms.'), solution: t('Grandinėje yra 5 anglys.', 'The chain has 5 carbons.')
        },
        {
          prompt: t('Pažymėkite visus alkanus.', 'Pick every alkane.'), kind: 'multi',
          options: [{ text: t('metanas', 'methane') }, { text: t('etenas', 'ethene') }, { text: t('propanas', 'propane') }],
          answer: [0, 2], hint: t('Tik viengubi ryšiai.', 'Single bonds only.'), solution: [{ p: t('Etenas turi $C=C$ ryšį.', 'Ethene has a $C=C$ bond.') }]
        },
        {
          prompt: t('Bakstelėkite karbonilo anglį.', 'Tap the carbonyl carbon.'), kind: 'atoms', mol: acid, answer: [1],
          hint: t('Ieškokite $C=O$.', 'Look for $C=O$.'), solution: t('Atomas 1 turi dvigubą ryšį su deguonimi.', 'Atom 1 has a double bond to oxygen.')
        },
        {
          prompt: t('Bakstelėkite $C=O$ ryšį.', 'Tap the $C=O$ bond.'), kind: 'atoms', bonds: true, mol: acid, answer: [[1, 2]],
          hint: t('Dvigubas ryšys.', 'The double bond.'), solution: t('Ryšys 1–2.', 'Bond 1–2.')
        },
        {
          prompt: t('Išdėstykite pagal anglių skaičių, nuo mažiausio.', 'Order by carbon count, smallest first.'), kind: 'order',
          options: [{ text: t('metanas', 'methane') }, { text: t('etanas', 'ethane') }, { text: t('propanas', 'propane') }],
          hint: t('Metanas turi vieną anglį.', 'Methane has one carbon.'), solution: t('1, 2, 3 anglys.', '1, 2, 3 carbons.')
        },
        {
          prompt: t('Kiek anglių turi pentanas?', 'How many carbons does pentane have?'), kind: 'number', answer: { value: 5, tol: 0 },
          hint: t('Pavadinimo šaknis „pent“.', 'The root is “pent”.'), solution: t('Penkios.', 'Five.')
        },
        {
          prompt: t('Įrašykite pavadinimą.', 'Type the name.'), kind: 'name', mol: pent, answer: { lt: ['pentanas'], en: ['pentane'] },
          hint: t('Penkios anglys, viengubi ryšiai.', 'Five carbons, single bonds.'), solution: t('Pentanas.', 'Pentane.')
        },
        {
          prompt: t('Įrašykite molekulinę formulę.', 'Type the molecular formula.'), kind: 'formula', mol: pent, answer: 'C5H12',
          hint: t('Alkanas: $CnH2n+2$.', 'Alkane: $CnH2n+2$.'), solution: t('$C5H12$', '$C5H12$')
        },
        {
          prompt: t('Sujunkite pavadinimus su formulėmis.', 'Match the names with the formulas.'), kind: 'match',
          answer: { left: [{ text: t('metanas', 'methane') }, { text: t('etanas', 'ethane') }], right: [{ text: t('$C2H6$', '$C2H6$') }, { text: t('$CH4$', '$CH4$') }], pairs: [1, 0] },
          hint: t('Metanas turi vieną anglį.', 'Methane has one carbon.'), solution: t('Metanas $CH4$, etanas $C2H6$.', 'Methane $CH4$, ethane $C2H6$.')
        }
      ],
      why: t('Alkano pavadinimas rodo anglių skaičių grandinėje.', 'An alkane name tells the number of carbons in the chain.')
    }
  ];

  ORG.unit({
    id: 'u01',
    lectureMissing: true,
    notes: [
      {
        id: 'intro', title: t('Įvadas', 'Introduction'),
        blocks: [
          { h: t('Alkanai', 'Alkanes') },
          { p: t('Alkanai yra sotieji angliavandeniliai, o $CH3CH2OH$ yra **etanolis**. *Kursyvas* ir jonas $SO4^2-^$.', 'Alkanes are saturated hydrocarbons; $CH3CH2OH$ is **ethanol**. *Italic* and the ion $SO4^2-^$.') },
          { list: [t('Pirmas punktas', 'First point'), t('Antras punktas', 'Second point')] },
          { list: [t('Pirmas žingsnis', 'First step'), t('Antras žingsnis', 'Second step')], ordered: true },
          { rule: t('Pavadinimas = šaknis + galūnė.', 'Name = stem + ending.') },
          { pitfall: t('Nesumaišykite šaknų.', 'Do not mix up the stems.') },
          { mol: pent, caption: t('Pentanas', 'Pentane') },
          { mol: [{ smi: 'C' }, { smi: 'CC' }, { smi: 'CCC' }], caption: t('Pirmieji trys', 'The first three') },
          { scheme: { items: [{ smi: 'CC' }, { plus: true }, { smi: 'ClCl' }, { arrow: '→', above: t('šviesa', 'light') }, { smi: 'CCCl' }] }, caption: t('Chlorinimas', 'Chlorination') },
          { mech: [{ scheme: { items: [{ smi: 'ClCl' }] }, arrows: [{ from: { m: 0, b: [0, 1] }, to: { m: 0, a: 1 }, half: true }], note: t('Homolizė', 'Homolysis') }], caption: t('Mechanizmas', 'Mechanism') },
          { resonance: [{ smi: 'C=CC=C' }, { smi: '[CH2+]CC=C' }], caption: t('Rezonansas', 'Resonance') },
          { fischer: { smi: 'OC(C=O)C(O)CO', top: 3, bottom: 7 } },
          { newman: { front: ['H', 'H', 'CH3'], back: ['H', 'H', 'CH3'], angle: 60 } },
          { chair: { subs: [{ pos: 1, ax: true, label: 'CH3' }] } },
          { table: { head: [t('Pavadinimas', 'Name'), t('Struktūra', 'Structure')], rows: [[t('metanas', 'methane'), { smi: 'C' }], [t('etanas', 'ethane'), { smi: 'CC' }]] } },
          { example: { q: [{ p: t('Pavadinkite $CH3CH2CH3$.', 'Name $CH3CH2CH3$.') }], steps: [[{ p: t('Trys anglys: prop-.', 'Three carbons: prop-.') }], [{ p: t('Viengubi ryšiai: -anas.', 'Single bonds: -ane.') }]] } },
          { practice: 'u01.bank' }
        ]
      },
      { id: 'more', title: t('Dar skyrius', 'Another section'), blocks: [{ p: t('Tekstas.', 'Text.') }] }
    ],
    summary: [{ h: t('Santrauka', 'Summary') }, { rule: t('Alkanai: $CnH2n+2$.', 'Alkanes: $CnH2n+2$.') }],
    types: [
      { id: 'u01.bank', title: t('Alkanų savybės', 'Alkane basics'), mirrors: ['S1.1'], bank },
      {
        id: 'u01.gen', title: t('Skaičiavimas', 'Counting'), mirrors: ['S1.2'],
        gen: function (rng, ctx) {
          const n = ctx.int(2, 9);
          return {
            q: [{ p: t('Skaičius ' + n + '.', 'The number is ' + n + '.') }],
            steps: [{ prompt: t('Kiek bus ' + n + ' + 1?', 'What is ' + n + ' + 1?'), kind: 'number', answer: { value: n + 1, tol: 0 }, hint: t('Pridėkite vienetą.', 'Add one.'), solution: t(String(n + 1), String(n + 1)) }],
            why: t('Paprasta sudėtis.', 'Plain addition.')
          };
        }
      }
    ],
    coverage: { 'S1.1': ['u01.bank'], 'S1.2': ['u01.gen'] }
  });
})(globalThis.ORG = globalThis.ORG || {});
