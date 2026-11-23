// site/organic/units/u16.js: unit 16, nitrogen heterocycles (pyrrole, pyridine, imidazole, pyrimidine, purine, nucleobases)
// The lecture 16 slides are not available: the sources are the course book (T p139-150) and seminar 7 (S7.13-16).
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // labels that are only formulas
  const tx = (lt, en) => ({ text: t(lt, en) });
  const mo = (smi, opts) => ({ mol: opts ? { smi, opts } : { smi } });

  // rings used in the notes (SMILES written in IUPAC numbering order, so the drawn label equals the locant)
  const PYRROLE = '[nH]1cccc1';
  const PYRIDINE = 'n1ccccc1';
  const IMIDAZOLE = '[nH]1cncc1';
  const PYRIMIDINE = 'n1cnccc1';
  const PURINE = 'n1cnc2c(c1)nc[nH]2';
  // nucleobases, lactam forms (drawn like the book, T p149); the locants are given as labels
  const URACIL = 'N1C(=O)NC(=O)C=C1';
  const URACIL_NUM = { 0: '1', 1: '2', 3: '3', 4: '4', 6: '5', 7: '6' };
  const THYMINE = 'N1C(=O)NC(=O)C(C)=C1';
  const CYTOSINE = 'N1C(=O)N=C(N)C=C1';
  const ADENINE = 'Nc1ncnc2[nH]cnc12';
  const GUANINE = 'O=C1NC(N)=NC2=C1N=CN2';
  const URACIL_LACTIM = 'N1=C(O)N=C(O)C=C1';
  const NITROURACIL = 'N1C(=O)NC(=O)C([N+](=O)[O-])=C1';

  ORG.unit({
    id: 'u16',
    lectureMissing: true,
    notes: [
      /* ---------------------------------------------------------------- 1 */
      {
        id: 'rings',
        title: t('Azoto heterociklai: žiedai ir numeracija', 'Nitrogen heterocycles: rings and numbering'),
        blocks: [
          { h: t('Kas yra heterociklas?', 'What is a heterocycle?') },
          {
            p: t('Heterociklo žiede be anglies dalyvauja ir kitų elementų atomai – heteroatomai (dažniausiai $N$, $O$, $S$). Patvariausi yra penkianariai ir šešianariai žiedai, o svarbiausi – aromatiniai azoto heterociklai.',
              'A heterocycle is a cyclic compound whose ring contains atoms of other elements besides carbon, called heteroatoms (mostly $N$, $O$, $S$). Five- and six-membered rings are the most stable, and the aromatic nitrogen heterocycles are the most important.'),
            src: 'T p141'
          },
          {
            mol: [
              { smi: PYRROLE, name: t('pirolas', 'pyrrole') },
              { smi: 'c1ccoc1', name: t('furanas', 'furan') },
              { smi: 'c1ccsc1', name: t('tiofenas', 'thiophene') },
              { smi: IMIDAZOLE, name: t('imidazolas', 'imidazole') },
              { smi: PYRIDINE, name: t('piridinas', 'pyridine') },
              { smi: PYRIMIDINE, name: t('pirimidinas', 'pyrimidine') },
              { smi: 'c1ccc2[nH]ccc2c1', name: t('indolas', 'indole') },
              { smi: PURINE, name: t('purinas', 'purine') }
            ],
            caption: t('Aromatiniai heterociklai, kurių reikia šiame skyriuje.', 'The aromatic heterocycles of this unit.'),
            src: 'T p141-147'
          },
          {
            p: t('Žiedo atomai numeruojami nuo heteroatomo, kuris yra 1 padėtyje. Imidazole ir pirimidine antrasis azotas yra 3 padėtyje. Purinas yra išimtis: jo devynių atomų numeracija nustatyta iš anksto, azotai yra 1, 3, 7 ir 9 padėtyse.',
              'The ring atoms are numbered starting from the heteroatom, which is position 1. In imidazole and pyrimidine the second nitrogen is at position 3. Purine is an exception: its nine atoms have a fixed numbering, with nitrogens at positions 1, 3, 7 and 9.'),
            src: 'T p143, p145, p147'
          },
          {
            mol: [
              { smi: PYRROLE, name: t('pirolas', 'pyrrole'), opts: { numbers: 'all' } },
              { smi: PYRIDINE, name: t('piridinas', 'pyridine'), opts: { numbers: 'all' } },
              { smi: PYRIMIDINE, name: t('pirimidinas', 'pyrimidine'), opts: { numbers: 'all' } },
              { smi: PURINE, name: t('purinas', 'purine'), opts: { numbers: 'all' } }
            ],
            src: 'T p141, p145, p147'
          },
          {
            mol: [
              { smi: 'C1CCNC1', name: t('pirolidinas', 'pyrrolidine') },
              { smi: 'C1CCNCC1', name: t('piperidinas', 'piperidine') }
            ],
            src: 'T p141'
          },
          {
            rule: t('Sotieji azoto heterociklai (pirolidinas, piperidinas) elgiasi kaip paprasti antriniai aminai. Aromatinių heterociklų savybes lemia tai, ar azoto laisvoji pora priklauso aromatinei sistemai.',
              'Saturated nitrogen heterocycles (pyrrolidine, piperidine) behave like ordinary secondary amines. The properties of aromatic heterocycles depend on whether the nitrogen lone pair belongs to the aromatic system.'),
            src: 'T p141'
          },
          { practice: 'u16.arom' }
        ]
      },
      /* ---------------------------------------------------------------- 2 */
      {
        id: 'sextet',
        title: t('Aromatiškumas: kur yra laisvoji pora', 'Aromaticity: where the lone pair sits'),
        blocks: [
          { h: t('Hiukelio taisyklė heterociklams', 'Hückel’s rule for heterocycles') },
          {
            p: t('Žiedas aromatinis, kai jis plokščias, konjuguotas ir turi $4n+2$ $π$ elektronų. Kiekvienas žiedo atomas turi $p$ orbitalę: anglis ir azotas su dvigubuoju ryšiu duoda po vieną elektroną, o heteroatomas be dvigubojo ryšio – visą laisvąją porą.',
              'A ring is aromatic when it is planar, conjugated and has $4n+2$ $π$ electrons. Every ring atom has a $p$ orbital: a carbon, or a nitrogen with a double bond, gives one electron; a heteroatom without a double bond gives its whole lone pair.'),
            src: 'T p141'
          },
          {
            rule: t('Du azoto tipai. Pirolo tipo azotas ($N-H$ arba $N-R$, taip pat $O$ ir $S$ furane bei tiofene): jo laisvoji pora yra $p$ orbitalėje ir įeina į $π$ sekstetą, todėl nebegali jungti protono. Piridino tipo azotas ($N=$): $π$ sistemai duoda vieną elektroną, o jo laisvoji pora guli žiedo plokštumoje, ant $sp^2^$ orbitalės, ir yra laisva.',
              'Two types of nitrogen. A pyrrole-type nitrogen ($N-H$ or $N-R$, and likewise $O$ and $S$ in furan and thiophene): its lone pair is in a $p$ orbital and is part of the $π$ sextet, so it cannot bind a proton. A pyridine-type nitrogen ($N=$): it gives one electron to the $π$ system, and its lone pair lies in the ring plane in an $sp^2^$ orbital and is free.'),
            src: 'T p141, p143'
          },
          {
            mol: [
              { smi: PYRROLE, opts: { lonePairs: [0], numbers: 'all' }, caption: t('Pirolas: pora yra $π$ sekstete (6 $π$ elektronai: 4 + 2).', 'Pyrrole: the pair is in the $π$ sextet (6 $π$ electrons: 4 + 2).') },
              { smi: PYRIDINE, opts: { lonePairs: [0], numbers: 'all' }, caption: t('Piridinas: pora žiedo plokštumoje, laisva (6 $π$ elektronai: po vieną iš kiekvieno atomo).', 'Pyridine: the pair is in the ring plane and free (6 $π$ electrons: one from each atom).') }
            ],
            src: 'T p141, p143'
          },
          {
            p: t('Pirolo azoto pora pasislenka į žiedą ($+M$): žiedo anglys, ypač $C-2$, įgyja dalinį neigiamą krūvį.',
              'The pyrrole nitrogen pair is pushed into the ring ($+M$): the ring carbons, especially $C-2$, acquire a partial negative charge.'),
            src: 'T p141'
          },
          {
            resonance: [
              { smi: '[NH]1C=CC=C1' },
              { smi: '[NH+]1=CC=C[CH-]1' },
              { smi: '[NH+]1=C[CH-]C=C1' }
            ],
            caption: t('Trys iš penkių pirolo rezonansinių formulių: neutrali ir dvi su neigiamu krūviu ant anglies.', 'Three of the five resonance structures of pyrrole: the neutral one and two with the negative charge on carbon.'),
            src: 'T p141'
          },
          {
            table: {
              head: [t('Junginys', 'Compound'), t('Heteroatomas', 'Heteroatom'), t('Laisvoji pora sekstete', 'Lone pair in the sextet'), t('$π$ elektronai', '$π$ electrons')],
              rows: [
                [{ smi: '[nH]1cccc1' }, t('N–H (pirolo tipo)', 'N–H (pyrrole type)'), t('taip', 'yes'), f('6')],
                [{ smi: 'o1cccc1' }, f('O'), t('viena pora taip, kita žiedo plokštumoje', 'one pair yes, the other in the plane'), f('6')],
                [{ smi: 's1cccc1' }, f('S'), t('viena pora taip, kita žiedo plokštumoje', 'one pair yes, the other in the plane'), f('6')],
                [{ smi: PYRIDINE }, t('N= (piridino tipo)', 'N= (pyridine type)'), t('ne, pora laisva', 'no, the pair is free'), f('6')],
                [{ smi: IMIDAZOLE }, t('N-1 pirolo tipo, N-3 piridino tipo', 'N-1 pyrrole type, N-3 pyridine type'), t('tik N-1', 'N-1 only'), f('6')],
                [{ smi: PYRIMIDINE }, t('abu N piridino tipo', 'both N pyridine type'), t('ne', 'no'), f('6')],
                [{ smi: '[nH]1ccc2ccccc12' }, t('N-1 pirolo tipo', 'N-1 pyrrole type'), t('taip', 'yes'), f('10')],
                [{ smi: PURINE }, t('N-9 pirolo tipo; N-1, N-3, N-7 piridino tipo', 'N-9 pyrrole type; N-1, N-3, N-7 pyridine type'), t('tik N-9', 'N-9 only'), f('10')]
              ]
            },
            src: 'T p141-147'
          },
          {
            pitfall: t('Pirolas turi $N-H$ grupę, bet ne antrinio amino savybes: jo azoto pora yra sekstete, todėl jis beveik nebazinis.',
              'Pyrrole has an $N-H$ group but not the properties of a secondary amine: its nitrogen pair is in the sextet, so it is hardly basic.'),
            src: 'T p141'
          },
          {
            example: {
              q: [
                { p: t('Imidazolas turi du azoto atomus. Kurio iš jų laisvoji pora įeina į aromatinį sekstetą ir kuris gali prijungti protoną? Numeriai atitinka žiedo numeraciją.', 'Imidazole has two nitrogen atoms. Whose lone pair is part of the aromatic sextet, and which one can bind a proton? The numbers follow the ring numbering.') },
                { mol: { smi: IMIDAZOLE, opts: { numbers: 'all' } } }
              ],
              steps: [
                [{ p: t('Atomas Nr. 1 turi vandenilį ir neturi dvigubojo ryšio: jo pora turi būti $p$ orbitalėje, kad žiede būtų 6 $π$ elektronai (4 iš keturių atomų su dvigubuoju ryšiu ir 2 iš N-1).', 'Atom no. 1 carries a hydrogen and has no double bond: its pair must sit in a $p$ orbital so that the ring has 6 $π$ electrons (4 from the four atoms with a double bond and 2 from N-1).') }],
                [{ p: t('Atomas Nr. 3 turi dvigubąjį ryšį: duoda vieną $π$ elektroną, o jo pora yra žiedo plokštumoje ir gali jungti protoną.', 'Atom no. 3 has a double bond: it gives one $π$ electron, and its pair lies in the ring plane and can bind a proton.') }]
              ]
            },
            claims: [{ aromatic: [IMIDAZOLE, true] }, { formula: [IMIDAZOLE, 'C3H4N2'] }],
            src: 'T p143'
          },
          { practice: 'u16.sextet' }
        ]
      },
      /* ---------------------------------------------------------------- 3 */
      {
        id: 'basicity',
        title: t('Bazingumas ir rūgštingumas', 'Basicity and acidity'),
        blocks: [
          { h: t('Kas lemia, ar azotas prijungia protoną?', 'What decides whether nitrogen takes a proton?') },
          {
            p: t('Bazingumą lemia tai, ar azoto laisvoji pora laisva, ar įtraukta į aromatinį sekstetą. Imidazolas turi abu azoto tipus, todėl jis ir bazė, ir silpna rūgštis.',
              'Basicity depends on whether the nitrogen lone pair is free or tied up in the aromatic sextet. Imidazole has both types of nitrogen, so it is both a base and a weak acid.'),
            src: 'T p141, p143'
          },
          {
            table: {
              head: [t('Bazė', 'Base'), t('Konjuguotosios rūgšties pKa (apytiksliai)', 'Conjugate acid pKa (approx.)'), t('Kodėl', 'Why')],
              rows: [
                [{ smi: 'C1CCNCC1' }, f('11'), t('laisva $sp^3^$ pora, alkilo grupių $+I$', 'free $sp^3^$ pair, $+I$ of the alkyl groups')],
                [{ smi: IMIDAZOLE }, f('7'), t('N-3 pora laisva, o protonuotas katijonas stabilizuotas rezonansu: krūvį dalija abu azotai', 'the N-3 pair is free, and the cation is stabilised by resonance: both nitrogens share the charge')],
                [{ smi: PYRIDINE }, f('5'), t('pora laisva, bet ant $sp^2^$ orbitalės (arčiau branduolio)', 'the pair is free, but in an $sp^2^$ orbital (held closer to the nucleus)')],
                [{ smi: PYRROLE }, f('−4'), t('pora sekstete; protonas jungtųsi prie anglies, ne prie azoto', 'the pair is in the sextet; a proton would go to carbon, not nitrogen')]
              ]
            },
            caption: t('Bazingumas mažėja iš viršaus į apačią. Orientacinės reikšmės (vadovėlyje jų nėra).', 'Basicity decreases from top to bottom. Approximate values (not given in the course book).'),
            src: 'Klein, T p141, p143'
          },
          {
            scheme: { items: [{ smi: PYRIDINE }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'c1cc[nH+]cc1.[Cl-]' }] },
            caption: t('Piridinas su $HCl$ sudaro piridinio chloridą.', 'Pyridine with $HCl$ gives pyridinium chloride.'),
            src: 'T p143'
          },
          {
            p: t('Pirolo $N-H$ protoną gali pakeisti metalas (pvz., kalis ar $NaNH2$). Pirolido anijonas išlaiko sekstetą, nes pora lieka $p$ orbitalėje. Pirolo $N-H$ (pKa ≈ 17) rūgštesnis už sotaus amino (≈ 35), o imidazolo (≈ 14) – dar rūgštesnis, nes krūvį dalija du azotai.',
              'The $N-H$ proton of pyrrole can be replaced by a metal (for example potassium or $NaNH2$). The pyrrolide anion keeps the sextet, because the pair stays in the $p$ orbital. The pyrrole $N-H$ (pKa ≈ 17) is more acidic than that of a saturated amine (≈ 35), and imidazole (≈ 14) more acidic still, because two nitrogens share the charge.'),
            src: 'T p141, p143, Klein'
          },
          {
            scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('K') }, { smi: 'c1cc[n-]c1.[K+]' }] },
            caption: t('Pirolo $N-H$ vandenilio pakeitimas metalu.', 'Replacing the $N-H$ hydrogen of pyrrole by a metal.'),
            src: 'T p141'
          },
          {
            rule: t('Bazingumo eilė: sotus aminas > imidazolas > piridinas ≫ pirolas. $N-H$ rūgštingumo eilė: imidazolas > pirolas ≫ sotus aminas.',
              'Basicity order: saturated amine > imidazole > pyridine ≫ pyrrole. $N-H$ acidity order: imidazole > pyrrole ≫ saturated amine.'),
            src: 'T p141, p143, Klein'
          },
          {
            example: {
              q: [
                { p: t('Du azoto atomus turintis alkaloidas su vienu ekvivalentu $HCl$ duoda druską $C10H15N2Cl$, su dviem – druską $C10H16N2Cl2$. Kuris azotas protonuojamas pirmas? Azotai pažymėti raidėmis.', 'Nicotine has two nitrogen atoms. After taking up one equivalent of $HCl$ it gives the salt $C10H15N2Cl$, after two the salt $C10H16N2Cl2$. Which nitrogen is protonated first? The nitrogens are marked with letters.') },
                { mol: { smi: 'CN1CCCC1c1cccnc1', opts: { numbers: { 1: 'a', 10: 'b' } } } }
              ],
              steps: [
                [{ p: t('N-a yra tretinis aminas: laisva $sp^3^$ pora, praturtinta alkilo grupių ($+I$). N-b yra piridino tipo azotas: pora ant $sp^2^$ orbitalės, žiedas elektronų deficitinis.', 'N-a is a tertiary amine: a free $sp^3^$ pair enriched by alkyl groups ($+I$). N-b is a pyridine-type nitrogen: the pair is in an $sp^2^$ orbital on an electron-poor ring.') }],
                [{ p: t('Bazingesnis yra N-a, todėl pirmasis ekvivalentas protonuoja jį.', 'N-a is the stronger base, so the first equivalent protonates it.') }, { mol: { smi: 'C[NH+]1CCCC1c1cccnc1.[Cl-]' } }],
                [{ p: t('Antrasis ekvivalentas protonuoja ir piridino azotą: susidaro dvigubo katijono dichloridas.', 'The second equivalent protonates the pyridine nitrogen as well: the dication dichloride forms.') }, { mol: { smi: 'C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]' } }]
              ]
            },
            claims: [
              { formula: ['C[NH+]1CCCC1c1cccnc1.[Cl-]', 'C10H15N2Cl'] },
              { formula: ['C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]', 'C10H16N2Cl2'] },
              { react: ['amine.protonate', ['CN1CCCC1c1cccnc1'], { X: 'Cl' }, 'C[NH+]1CCCC1c1cccnc1.[Cl-]'] },
              { react: ['amine.protonate', ['CN1CCCC1c1cccnc1'], { X: 'Cl', eq: 2 }, 'C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]'] }
            ],
            src: 'S7.13'
          },
          { practice: 'u16.protonate' },
          { practice: 'u16.basicity' }
        ]
      },
      /* ---------------------------------------------------------------- 4 */
      {
        id: 'sear',
        title: t('Elektrofilinis aromatinis pakeitimas: pirolas ir piridinas', 'Electrophilic aromatic substitution: pyrrole and pyridine'),
        blocks: [
          { h: t('Elektronų perteklius ir deficitas', 'Electron excess and electron deficiency') },
          {
            rule: t('Pirolas (ir furanas, tiofenas) yra elektronų perteklinis: 6 elektronai tenka 5 atomams, todėl SEAr vyksta lengvai, su švelniais reagentais, ties $C-2$. Piridinas yra elektronų deficitinis (elektronų tankis pasislinkęs prie $N$): reikia daug griežtesnių sąlygų, pakaitas patenka į $C-3$, išeiga maža.',
              'Pyrrole (and furan, thiophene) is electron-rich: 6 electrons on 5 atoms, so SEAr is easy, with mild reagents, at $C-2$. Pyridine is electron-poor (the density is pulled towards $N$): much harsher conditions are needed, the substituent enters at $C-3$, and the yield is low.'),
            src: 'T p141-144'
          },
          {
            scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('CH3COONO2'), below: t('nitrinimas', 'nitration') }, { smi: 'O=[N+]([O-])c1ccc[nH]1' }] },
            src: 'T p142'
          },
          {
            scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('SO3, C5H5N'), below: t('sulfoninimas', 'sulfonation') }, { smi: 'OS(=O)(=O)c1ccc[nH]1' }] },
            src: 'T p142'
          },
          {
            scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('(CH3CO)2O'), below: t('acilinimas', 'acylation') }, { smi: 'CC(=O)c1ccc[nH]1' }] },
            src: 'T p142'
          },
          {
            p: t('Pirolas halogeninamas be katalizatoriaus: su jodu pakeičiami visi keturi $C-H$ vandeniliai ir susidaro tetrajodpirolas (jodolas, antiseptikas). Stiprios rūgštys suardo pirolą, todėl jis nitrinamas acetilnitratu, o sulfoninamas kompleksu $SO3$·piridinas.',
              'Pyrrole is halogenated without a catalyst: with iodine all four $C-H$ hydrogens are replaced to give tetraiodopyrrole (iodol, an antiseptic). Strong acids destroy pyrrole, so it is nitrated with acetyl nitrate and sulfonated with $SO3$·pyridine.'),
            src: 'T p142, Klein'
          },
          {
            scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('I2') }, { smi: 'Ic1[nH]c(I)c(I)c1I' }] },
            caption: t('Tetrajodpirolas: pakeisti visi keturi $C-H$ vandeniliai.', 'Tetraiodopyrrole: all four $C-H$ hydrogens are replaced.'),
            src: 'T p142'
          },
          { h: t('Kodėl $C-2$?', 'Why $C-2$?') },
          {
            p: t('SEAr turi dvi stadijas: elektrofilas atakuoja žiedą (susidaro tarpinis katijonas), po to atskyla protonas. Greitį lemia katijono stabilumas.',
              'SEAr has two stages: the electrophile attacks the ring (an intermediate cation forms), then a proton is lost. The rate is set by the stability of the cation.'),
            src: 'L9 p10'
          },
          {
            mech: [
              {
                scheme: { items: [{ smi: 'N1C=CC=C1' }, { plus: true }, { smi: 'O=[N+]=O' }] },
                arrows: [{ from: { m: 0, b: [1, 2] }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
                note: t('1 stadija (lėtoji): $π$ ryšio elektronai atakuoja elektrofilą ties $C-2$.', 'Stage 1 (slow): the $π$ electrons attack the electrophile at $C-2$.')
              },
              {
                scheme: { items: [{ smi: '[O-][N+](=O)C1[CH+]C=CN1', opts: { allH: true } }, { arrow: '→' }, { smi: 'O=[N+]([O-])c1ccc[nH]1' }, { plus: true }, { smi: '[H+]' }] },
                arrows: [{ from: { m: 0, b: [3, 'H3'] }, to: { m: 0, mid: [3, 4] } }],
                note: t('2 stadija (greitoji): atskyla protonas ir atsistato aromatinė sistema.', 'Stage 2 (fast): a proton is lost and the aromatic system is restored.')
              }
            ],
            caption: t('Pirolo nitrinimas ($NO2+$ žymi elektrofilą, praktiškai gaunamą iš acetilnitrato).', 'Nitration of pyrrole ($NO2+$ stands for the electrophile, in practice from acetyl nitrate).'),
            src: 'L9 p10, T p142'
          },
          {
            p: t('Atakuojant $C-2$, katijoną galima užrašyti trimis rezonansinėmis formulėmis (padeda azoto pora), o atakuojant $C-3$ – tik dviem. Stabilesnis katijonas susidaro greičiau, todėl ataka ties $C-2$ greitesnė.',
              'When $C-2$ is attacked, the cation has three resonance structures (the nitrogen pair helps); for $C-3$ only two. The more stable cation forms faster, so attack at $C-2$ is faster.'),
            src: 'T p141, Klein'
          },
          {
            resonance: [
              { smi: '[O-][N+](=O)C1[CH+]C=CN1' },
              { smi: '[O-][N+](=O)C1C=C[CH+]N1' },
              { smi: '[O-][N+](=O)C1C=CC=[NH+]1' }
            ],
            caption: t('Ataka ties $C-2$: tarpinio katijono trys rezonansinės formulės.', 'Attack at $C-2$: three resonance structures of the intermediate cation.')
          },
          {
            resonance: [
              { smi: '[NH]1[CH+]C([N+](=O)[O-])C=C1' },
              { smi: '[NH+]1=CC([N+](=O)[O-])C=C1' }
            ],
            caption: t('Ataka ties $C-3$: tik dvi formulės.', 'Attack at $C-3$: only two structures.')
          },
          { h: t('Piridinas: kodėl $C-3$ ir kodėl taip sunku?', 'Pyridine: why $C-3$, and why so slow?') },
          {
            p: t('Elektroneigiamas azotas suteikia $C-2$ ir $C-4$ dalinį teigiamą krūvį. Rūgščioje terpėje azotas dar ir protonuojamas, o piridinio katijonas elektrofilą atstumia dar labiau. Pakaitas patenka į $C-3$, kur elektronų tankis santykinai didesnis.',
              'The electronegative nitrogen gives $C-2$ and $C-4$ a partial positive charge. In acid the nitrogen is also protonated, and the pyridinium cation repels electrophiles even more. The substituent enters at $C-3$, where the electron density is relatively higher.'),
            src: 'T p143-144'
          },
          {
            scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('KNO3, H2SO4, > 300 °C'), below: f('5–15 %') }, { smi: '[O-][N+](=O)c1cccnc1' }] },
            src: 'T p144'
          },
          {
            p: t('Atakuojant $C-3$, krūvis pasiskirsto tik tarp anglies atomų. Atakuojant $C-2$ ar $C-4$, viena formulė turėtų teigiamą krūvį ant azoto su šešiais elektronais – labai nepalanku.',
              'Attack at $C-3$ keeps the charge on carbon atoms. Attack at $C-2$ or $C-4$ would give a structure with the charge on a nitrogen with only six electrons, which is very unfavourable.'),
            src: 'Klein'
          },
          {
            resonance: [
              { smi: 'N1=CC([N+](=O)[O-])[CH+]C=C1' },
              { smi: 'N1=CC([N+](=O)[O-])C=C[CH+]1' },
              { smi: '[CH+]1C([N+](=O)[O-])C=CC=N1' }
            ],
            caption: t('Pakaitas ties $C-3$: krūvis tik ant anglies atomų.', 'Substituent at $C-3$: the charge stays on carbon atoms only.')
          },
          {
            pitfall: t('Nesumaišykite: pirolui – $C-2$ ir švelnūs reagentai, piridinui – $C-3$ ir griežtos sąlygos. Piridinas neacilinamas ir Friedelio ir Craftso reakcija: elektrofilas jungiasi prie azoto.',
              'Do not mix them up: pyrrole means $C-2$ and mild reagents, pyridine $C-3$ and harsh conditions. Pyridine is not acylated by Friedel–Crafts either: the electrophile bonds to nitrogen.'),
            src: 'T p141-144, Klein'
          },
          {
            example: {
              q: [
                { p: t('Pirolas reaguoja su kompleksu $SO3$·piridinas. Kokia produkto struktūra ir kodėl būtent ši padėtis?', 'Pyrrole reacts with the $SO3$·pyridine complex. What is the structure of the product, and why that position?') },
                { mol: { smi: PYRROLE, opts: { numbers: 'all' } } }
              ],
              steps: [
                [{ p: t('Pirolas yra elektronų perteklinis: jam tinka švelnus elektrofilas $SO3$ (koncentruota sieros rūgštis sunaikintų žiedą).', 'Pyrrole is electron-rich: the mild electrophile $SO3$ will do (strong acid would destroy the ring).') }],
                [{ p: t('Elektrofilas atakuoja $C-2$ (atomas Nr. 2), nes katijonas turi tris rezonansines formules.', 'The electrophile attacks $C-2$ (atom no. 2), since the cation has three resonance structures.') }],
                [{ p: t('Atskyla protonas, susidaro pirolo-2-sulfonrūgštis.', 'A proton is lost and pyrrole-2-sulfonic acid forms.') }, { mol: { smi: 'OS(=O)(=O)c1ccc[nH]1' } }]
              ]
            },
            claims: [{ formula: ['OS(=O)(=O)c1ccc[nH]1', 'C4H5NO3S'] }, { aromatic: ['OS(=O)(=O)c1ccc[nH]1', true] }],
            src: 'T p142'
          },
          { practice: 'u16.sear' },
          { practice: 'u16.pyridine' }
        ]
      },
      /* ---------------------------------------------------------------- 5 */
      {
        id: 'nuc',
        title: t('Piridino azotas kaip nukleofilas', 'The pyridine nitrogen as a nucleophile'),
        blocks: [
          { h: t('Piridinas elgiasi kaip tretinis aminas', 'Pyridine behaves like a tertiary amine') },
          {
            p: t('Piridino azoto pora nepriklauso sekstetui, todėl piridinas elgiasi kaip tretinis aminas – nukleofilas. Pirolo azotas nukleofilu neveikia (pora sekstete): pirolas reaguoja per anglį (SEAr), piridinas – per azotą.',
              'The pyridine nitrogen pair is not part of the sextet, so pyridine behaves like a tertiary amine, a nucleophile. The pyrrole nitrogen is not a nucleophile (its pair is in the sextet): pyrrole reacts through carbon (SEAr), pyridine through nitrogen.'),
            src: 'T p144'
          },
          {
            mech: [{
              scheme: { items: [{ smi: PYRIDINE, opts: { lonePairs: [0] } }, { plus: true }, { smi: 'CI', opts: { lonePairs: [1] } }] },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }, { from: { m: 1, b: [0, 1] }, to: { m: 1, a: 1 } }],
              note: t('SN2: azoto pora atakuoja metilo anglį iš nugaros, jodidas pasišalina.', 'SN2: the nitrogen pair attacks the methyl carbon from the back, iodide leaves.')
            }],
            src: 'T p144'
          },
          {
            scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('CH3I') }, { smi: 'C[n+]1ccccc1.[I-]', name: t('N-metilpiridinio jodidas', 'N-methylpyridinium iodide') }] },
            caption: t('Alkilinimas ties azotu duoda ketvirtinę alkilpiridinio druską.', 'Alkylation at nitrogen gives a quaternary alkylpyridinium salt.'),
            src: 'T p144'
          },
          {
            p: t('Taip pat reaguoja acilo halogenidai: susidaro aktyvūs $N$-acilpiridinio jonai, todėl piridinas naudojamas kaip bazė ir katalizatorius acilinant.',
              'Acyl halides react in the same way: active $N$-acylpyridinium ions form, which is why pyridine is used as a base and catalyst in acylations.'),
            src: 'Klein'
          },
          {
            scheme: { items: [{ smi: PYRIDINE }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC(=O)[n+]1ccccc1.[Cl-]' }] },
            caption: t('Piridinas su acetilchloridu: $N$-acetilpiridinio chloridas.', 'Pyridine with acetyl chloride: $N$-acetylpyridinium chloride.'),
            src: 'Klein, S7.14'
          },
          {
            scheme: { items: [{ smi: PYRROLE }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }, { smi: 'CC(=O)c1ccc[nH]1' }] },
            caption: t('Pirolas: acilinimas ties $C-2$ (SEAr), azotas nepakeistas.', 'Pyrrole: acylation at $C-2$ (SEAr), the nitrogen unchanged.'),
            src: 'T p142, S7.14'
          },
          { h: t('Piridinio katijonas ir hidrido jonas', 'The pyridinium cation and the hydride ion') },
          {
            p: t('Ketvirtinės druskos žiede elektronų tankio dar mažiau, todėl nukleofilai atakuoja jį lengviau. Hidridas jungiasi ties $C-4$ ir susidaro nestabilus 1,4-dihidropiridinas (aromatiškumas suardytas), kuris lengvai oksiduojasi atgal.',
              'In the quaternary salt the ring has even less electron density, so nucleophiles attack it more easily. A hydride adds at $C-4$ to give an unstable 1,4-dihydropyridine (aromaticity lost), which is readily oxidised back.'),
            src: 'T p144'
          },
          {
            scheme: { items: [{ smi: 'C[n+]1ccccc1' }, { arrow: '⇌', above: f('[H-]'), below: f('[O]') }, { smi: 'CN1C=CCC=C1' }] },
            caption: t('Hidrido prisijungimas prie $N$-metilpiridinio katijono ir oksidacija atgal.', 'Hydride addition to the $N$-methylpyridinium cation, and oxidation back.'),
            src: 'T p144'
          },
          {
            p: t('Šia reakcija pagrįstas kofermentų $NAD+$ ir $NADP+$ veikimas: jų piridinio jonas grįžtamai prijungia hidridą ir virsta $NADH$ ar $NADPH$. Nikotinamidas ir nikotino rūgštis priskiriami vitaminui PP, o piridoksalis yra B6 vitaminas.',
              'The coenzymes $NAD+$ and $NADP+$ work through this reaction: their pyridinium ion reversibly accepts hydride and becomes $NADH$ or $NADPH$. Nicotinamide and nicotinic acid are classed as vitamin PP, and pyridoxal is vitamin B6.'),
            src: 'T p144'
          },
          {
            table: {
              head: [t('Reagentas', 'Reagent'), t('Pirolas', 'Pyrrole'), t('Piridinas', 'Pyridine')],
              rows: [
                [f('CH3COONO2'), { smi: 'O=[N+]([O-])c1ccc[nH]1' }, t('sunkiai reaguoja (reikia griežtų sąlygų)', 'reacts only with difficulty (harsh conditions needed)')],
                [f('CH3I'), t('N nėra nukleofilas, reakcija nevyksta', 'N is not nucleophilic, no reaction'), { smi: 'C[n+]1ccccc1.[I-]' }],
                [f('CH3COCl'), { smi: 'CC(=O)c1ccc[nH]1' }, { smi: 'CC(=O)[n+]1ccccc1.[Cl-]' }]
              ]
            },
            caption: t('Pirolas reaguoja ties $C-2$, piridinas – ties azotu.', 'Pyrrole reacts at $C-2$, pyridine at nitrogen.')
          },
          {
            pitfall: t('Nepieškite $N$-acetilpirolo kaip pagrindinio pirolo acilinimo produkto: azoto pora yra sekstete, todėl acilinama anglis.',
              'Do not draw $N$-acetylpyrrole as the main product of acylating pyrrole: the nitrogen pair is in the sextet, so carbon is acylated.'),
            src: 'T p141-142, S7.14'
          },
          {
            example: {
              q: [
                { p: t('Su acetanhidridu pirolas ir piridinas elgiasi skirtingai. Per kurį atomą reaguoja kiekvienas ir koks tai mechanizmas?', 'Pyrrole and pyridine behave differently towards acetic anhydride. Through which atom does each react, and by what mechanism?') }
              ],
              steps: [
                [{ p: t('Pirolo azotas neturi laisvos poros (ji sekstete). Elektronų perteklinis žiedas atakuoja acilo elektrofilą ties $C-2$: SEAr.', 'The pyrrole nitrogen pair is in the sextet, so the electron-rich ring attacks the acyl electrophile at $C-2$: SEAr.') }, { mol: { smi: 'CC(=O)c1ccc[nH]1' } }],
                [{ p: t('Piridino azoto pora laisva, o žiedas elektronų deficitinis: acilo grupę prisijungia azotas (nukleofilas) ir susidaro $N$-acetilpiridinio acetatas.', 'The pyridine nitrogen pair is free and the ring is electron-poor: nitrogen (the nucleophile) takes the acyl group, giving $N$-acetylpyridinium acetate.') }, { mol: { smi: 'CC(=O)[n+]1ccccc1.CC(=O)[O-]' } }]
              ]
            },
            claims: [{ formula: ['CC(=O)c1ccc[nH]1', 'C6H7NO'] }, { formula: ['CC(=O)[n+]1ccccc1.CC(=O)[O-]', 'C9H11NO3'] }],
            src: 'S7.14'
          },
          { practice: 'u16.nuc' }
        ]
      },
      /* ---------------------------------------------------------------- 6 */
      {
        id: 'bases',
        title: t('Pirimidinas, purinas ir nukleorūgščių bazės', 'Pyrimidine, purine and the nucleic acid bases'),
        blocks: [
          { h: t('Penkios pagrindinės bazės', 'The five main bases') },
          {
            p: t('Pagrindinės nukleorūgščių bazės: pirimidinai – uracilas, timinas, citozinas, purinai – adeninas ir guaninas. DNR turi A, T, G, C, o RNR vietoj timino – uracilą.',
              'The main bases of nucleic acids: the pyrimidines uracil, thymine, cytosine and the purines adenine and guanine. DNA has A, T, G, C, and RNA has uracil instead of thymine.'),
            src: 'T p145, p147, p148'
          },
          {
            mol: [
              { smi: URACIL, name: t('uracilas', 'uracil'), opts: { numbers: URACIL_NUM } },
              { smi: THYMINE, name: t('timinas', 'thymine') },
              { smi: CYTOSINE, name: t('citozinas', 'cytosine') },
              { smi: ADENINE, name: t('adeninas', 'adenine') },
              { smi: GUANINE, name: t('guaninas', 'guanine') }
            ],
            caption: t('Bazės laktamo formomis (adeninas – enamino), kuriomis jos yra nukleorūgštyse.', 'The bases in the lactam forms (adenine: enamine) found in nucleic acids.'),
            src: 'T p145, p149'
          },
          {
            p: t('Bazė jungiasi su ribozės ar 2-deoksiribozės $C-1\'$ per pirimidino $N-1$ arba purino $N-9$ atomą: susidaro $N$-glikozidas, nukleozidas (citidinas, adenozinas ir kt.).',
              'The base bonds to the $C-1\'$ of ribose or 2-deoxyribose through the $N-1$ atom of a pyrimidine or the $N-9$ atom of a purine: an $N$-glycoside, a nucleoside (cytidine, adenosine, etc.).'),
            src: 'T p150'
          },
          { h: t('Laktamo–laktimo tautomerija', 'Lactam–lactim tautomerism') },
          {
            p: t('Hidroksipirimidinai ir hidroksipurinai egzistuoja dviem tautomerinėmis formomis. Laktamo forma turi amido tipo grupę $N-H$ ir $C=O$, laktimo – $N=C$ ir $C-OH$. Nukleorūgščių bazės yra laktamo formos, adeninas – enamino (amino), ne ketimino.',
              'Hydroxypyrimidines and hydroxypurines exist in two tautomeric forms. The lactam form has an amide-type group $N-H$ and $C=O$, the lactim form $N=C$ and $C-OH$. The bases of nucleic acids are in the lactam form, adenine in the enamine (amino) form, not the ketimine one.'),
            src: 'T p148-149'
          },
          {
            scheme: { items: [{ smi: URACIL, opts: { numbers: URACIL_NUM } }, { arrow: '⇌' }, { smi: URACIL_LACTIM, opts: { numbers: URACIL_NUM } }] },
            caption: t('Uracilas: laktamo (dioksoforma) ir laktimo (dihidroksi) formos; tarp jų yra dvi mišrios laktimo–laktamo formos.', 'Uracil: the lactam (dioxo) and lactim (dihydroxy) forms; between them are two mixed lactim–lactam forms.'),
            src: 'T p149'
          },
          {
            scheme: { items: [{ smi: 'N1=C(O)N=C(O)C(C)=C1' }, { arrow: '⇌' }, { smi: THYMINE }] },
            caption: t('Timino laktimo ⇌ laktamo tautomerija.', 'Lactim ⇌ lactam tautomerism of thymine.'),
            src: 'T p149'
          },
          {
            scheme: { items: [{ smi: 'N1=C(O)N=C(N)C=C1' }, { arrow: '⇌' }, { smi: CYTOSINE }] },
            caption: t('Citozino laktimo ⇌ laktamo tautomerija.', 'Lactim ⇌ lactam tautomerism of cytosine.'),
            src: 'T p149'
          },
          {
            scheme: { items: [{ smi: 'Oc1nc(N)nc2[nH]cnc12' }, { arrow: '⇌' }, { smi: GUANINE }] },
            caption: t('Guaninas: laktimo ⇌ laktamo.', 'Guanine: lactim ⇌ lactam.'),
            src: 'T p149'
          },
          {
            scheme: { items: [{ smi: 'N=C1NC=NC2=C1N=CN2' }, { arrow: '⇌' }, { smi: ADENINE }] },
            caption: t('Adeninas: ketimino ⇌ enamino (pusiausvyra pasislinkusi į enamino pusę).', 'Adenine: ketimine ⇌ enamine (the equilibrium lies on the enamine side).'),
            src: 'T p149'
          },
          {
            rule: t('Laktamo forma stabilesnė, nes turi amido grupę su $p,π$ konjugacija, todėl bazės nukleorūgštyse yra laktamo formų. SEAr reakcijose dalyvauja laktimo forma – aromatinis hidroksipirimidinas.',
              'The lactam form is more stable, because it has an amide group with $p,π$ conjugation, so the bases in nucleic acids are in lactam forms. In SEAr the lactim form takes part: the aromatic hydroxypyrimidine.'),
            src: 'T p148-149, S7.16'
          },
          { h: t('Vandeniliniai ryšiai tarp bazių', 'Hydrogen bonds between bases') },
          {
            p: t('Laktamo formos bazės turi $N-H$ donorų ir $C=O$ akceptorių, todėl tarp jų susidaro vandeniliniai ryšiai. Dvi uracilo molekulės sudaro ciklinį dimerą: vienos $N-H$ jungiasi su kitos $C=O$. Pora A–T (A–U) turi du, o G–C – tris vandenilinius ryšius.',
              'Lactam-form bases have $N-H$ donors and $C=O$ acceptors, so hydrogen bonds form between them. Two uracil molecules form a cyclic dimer: the $N-H$ of one binds to the $C=O$ of the other. The A–T (A–U) pair has two hydrogen bonds and the G–C pair three.'),
            src: 'T p145, S7.16, Klein'
          },
          {
            mol: [
              { smi: 'O=C1C=CNC(=O)N1.O=C1C=CNC(=O)N1', opts: { highlight: { atoms: [6, 7, 14, 15], tone: 2 } }, caption: t('Uracilo dimeras: pažymėti dalyvaujantys atomai ($N-3-H$ ir $C-2=O$).', 'Uracil dimer: the atoms that take part are marked ($N-3-H$ and $C-2=O$).') },
              { smi: ADENINE, opts: { highlight: { atoms: [0, 2], tone: 2 } }, caption: t('Adeninas: aminogrupė ir N-1 jungiasi su timinu.', 'Adenine: the amino group and N-1 bond to thymine.') },
              { smi: THYMINE, opts: { highlight: { atoms: [3, 5], tone: 2 } }, caption: t('Timinas: $N-3-H$ ir $C-4=O$ jungiasi su adeninu.', 'Thymine: $N-3-H$ and $C-4=O$ bond to adenine.') }
            ],
            src: 'S7.16, Klein'
          },
          { h: t('Uracilo nitrinimas', 'Nitration of uracil') },
          {
            p: t('Elektrofilinio pakeitimo reakcijose dalyvauja uracilo laktimo forma, nes ji yra aromatinis dihidroksipirimidinas. Dvi $OH$ grupės ($+M$, kaip fenolyje) aktyvuoja $C-5$: jis orto $C-4$ hidroksilui ir para $C-2$ hidroksilui. Nitrinant gaunamas 5-nitrouracilas.',
              'In electrophilic substitution the lactim form of uracil takes part, because it is an aromatic dihydroxypyrimidine. The two $OH$ groups ($+M$, as in phenol) activate $C-5$: it is ortho to the $C-4$ hydroxyl and para to the $C-2$ hydroxyl. Nitration gives 5-nitrouracil.'),
            src: 'S7.16'
          },
          {
            scheme: { items: [{ smi: URACIL_LACTIM, opts: { numbers: URACIL_NUM } }, { arrow: '→', above: f('HNO3') }, { smi: 'N1=C(O)N=C(O)C([N+](=O)[O-])=C1' }] },
            caption: t('Uracilas (laktimo forma) → 5-nitrouracilas (laktimo forma), kuris vėl virsta laktamo forma.', 'Uracil (lactim form) → 5-nitrouracil (lactim form), which returns to the lactam form.'),
            src: 'S7.16'
          },
          {
            scheme: { items: [{ smi: 'N1=C(O)N=C(O)C([N+](=O)[O-])=C1' }, { arrow: '⇌' }, { smi: NITROURACIL }] },
            src: 'S7.16'
          },
          {
            pitfall: t('Nerašykite nitro grupės ant azoto ar $C-6$: nitrinama $C-5$. Timine ši padėtis jau užimta metilo.',
              'Do not put the nitro group on nitrogen or on $C-6$: $C-5$ is nitrated. In thymine this position is already occupied by a methyl group.'),
            src: 'S7.16'
          },
          {
            example: {
              q: [
                { p: t('a) Parašykite uracilo laktimo formą. b) Kurioje formoje uracilas nitrinamas ir kur patenka $NO2$? Atomų numeriai – žiedo numeracija.', 'a) Write the lactim form of uracil. b) In which form is uracil nitrated, and where does $NO2$ go? The atom numbers are ring numbers.') },
                { mol: { smi: URACIL, opts: { numbers: URACIL_NUM } } }
              ],
              steps: [
                [{ p: t('Vandenilis pereina nuo $N-3$ prie deguonies, o dvigubasis ryšys pasislenka į $N-3=C-4$; taip pat tautomerizuojasi $N-1-H$ ir $C-2=O$.', 'The hydrogen moves from $N-3$ to oxygen and the double bond shifts to $N-3=C-4$; the pair $N-1-H$ and $C-2=O$ does the same.') }, { mol: { smi: URACIL_LACTIM, opts: { numbers: URACIL_NUM } } }],
                [{ p: t('SEAr reikia aromatinio žiedo: dalyvauja dihidroksipirimidinas (laktimo forma). Atomas Nr. 5 yra orto vienam hidroksilui ir para kitam, todėl elektrofilas $NO2+$ jungiasi prie jo.', 'SEAr needs an aromatic ring: the dihydroxypyrimidine (the lactim form) takes part. Atom no. 5 is ortho to one hydroxyl and para to the other, so the electrophile $NO2+$ bonds to it.') }],
                [{ p: t('Produktas yra 5-nitrouracilas, kuris vėl įgyja stabilesnę laktamo formą.', 'The product is 5-nitrouracil, again in the lactam form.') }, { mol: { smi: NITROURACIL } }]
              ]
            },
            claims: [{ formula: [URACIL, 'C4H4N2O2'] }, { formula: [URACIL_LACTIM, 'C4H4N2O2'] }, { formula: [NITROURACIL, 'C4H3N3O4'] }, { same: [URACIL_LACTIM, 'Oc1ccnc(O)n1'] }],
            src: 'S7.16, T p149'
          },
          { practice: 'u16.nucleobase' },
          { practice: 'u16.tautomer' },
          { practice: 'u16.pairing' },
          { practice: 'u16.nitro' }
        ]
      },
      /* ---------------------------------------------------------------- 7 */
      {
        id: 'bio',
        title: t('Kiti biologiškai svarbūs heterociklai', 'Other biologically important heterocycles'),
        blocks: [
          {
            p: t('Heterociklai yra daugelio vitaminų, alkaloidų ir kofermentų pagrindas. Čia pateikti pavyzdžiai iš vadovėlio.',
              'Heterocycles are the core of many vitamins, alkaloids and coenzymes. The examples below are from the course book.'),
            src: 'T p142-148'
          },
          {
            mol: [
              { smi: 'OC(=O)c1cccnc1', caption: t('nikotino rūgštis (vitaminas PP)', 'nicotinic acid (vitamin PP)') },
              { smi: 'NC(=O)c1cccnc1', caption: t('nikotinamidas (vitaminas PP)', 'nicotinamide (vitamin PP)') },
              { smi: 'CN1CCCC1c1cccnc1', caption: t('nikotinas', 'nicotine') },
              { smi: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', caption: t('kofeinas', 'caffeine') }
            ],
            src: 'T p144, p145, p148'
          },
          {
            p: t('Porfinas (keturi pirolo žiedai, 26 $π$ elektronai) su $Fe$ sudaro hemoglobino, su $Mg$ – chlorofilo, su $Co$ – vitamino B12 pagrindą. Tiaminas (vitaminas B1) turi pirimidino ir tiazolo žiedus; kofeinas, teofilinas ir teobrominas yra $N$-metilinti ksantinai (purino dariniai), šlapimo rūgštis – galutinis purinų apykaitos produktas.',
              'Porphine (four pyrrole rings, 26 $π$ electrons) forms the core of haemoglobin with $Fe$, of chlorophyll with $Mg$ and of vitamin B12 with $Co$. Thiamine (vitamin B1) contains pyrimidine and thiazole rings; caffeine, theophylline and theobromine are $N$-methylated xanthines (purine derivatives), and uric acid is the end product of purine metabolism.'),
            src: 'T p142-148'
          }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka: azoto heterociklai', 'Summary: nitrogen heterocycles') },
      {
        table: {
          head: [t('Savybė', 'Property'), t('Pirolas', 'Pyrrole'), t('Imidazolas', 'Imidazole'), t('Piridinas', 'Pyridine')],
          rows: [
            [t('Azoto pora', 'Nitrogen pair'), t('sekstete (N–H)', 'in the sextet (N–H)'), t('N-1 sekstete, N-3 laisva', 'N-1 in the sextet, N-3 free'), t('laisva, žiedo plokštumoje', 'free, in the ring plane')],
            [t('Bazingumas', 'Basicity'), t('beveik nėra', 'almost none'), t('vidutinis (pKa ≈ 7)', 'moderate (pKa ≈ 7)'), t('silpna bazė (pKa ≈ 5)', 'weak base (pKa ≈ 5)')],
            [t('Rūgštingumas', 'Acidity'), t('$N-H$, pKa ≈ 17', '$N-H$, pKa ≈ 17'), t('$N-H$, pKa ≈ 14 (amfoterinis)', '$N-H$, pKa ≈ 14 (amphoteric)'), t('nėra', 'none')],
            [t('SEAr', 'SEAr'), t('lengvai, $C-2$, švelnūs reagentai', 'easy, $C-2$, mild reagents'), t('nemokoma (kurse nenagrinėjama)', 'not covered in the course'), t('sunkiai, $C-3$, > 300 °C', 'hard, $C-3$, > 300 °C')],
            [t('N kaip nukleofilas', 'N as nucleophile'), t('ne (reaguoja $C-2$)', 'no (reacts at $C-2$)'), t('taip (N-3)', 'yes (N-3)'), t('taip: $CH3I$ → $N$-metilpiridinio jodidas', 'yes: $CH3I$ → $N$-methylpyridinium iodide')]
          ]
        },
        src: 'T p141-144'
      },
      {
        list: [
          t('$π$ sekstetas: pirolo tipo heteroatomas (N–H, N–R, O, S) duoda porą, piridino tipo azotas (N=) – vieną elektroną.', '$π$ sextet: a pyrrole-type heteroatom (N–H, N–R, O, S) gives its pair, a pyridine-type nitrogen (N=) gives one electron.'),
          t('Bazė: laisva pora ne sekstete. Sotus aminas > imidazolas > piridinas ≫ pirolas. Nikotine pirmas protonuojamas pirolidino N.', 'Base: a free pair outside the sextet. Saturated amine > imidazole > pyridine ≫ pyrrole. In nicotine the pyrrolidine N is protonated first.'),
          t('Pirolas: SEAr ties $C-2$ su acetilnitratu, $SO3$·piridinu, acetanhidridu; halogenai pakeičia visus keturis $C-H$.', 'Pyrrole: SEAr at $C-2$ with acetyl nitrate, $SO3$·pyridine, acetic anhydride; halogens replace all four $C-H$.'),
          t('Piridinas: SEAr tik griežtomis sąlygomis ir ties $C-3$; su $CH3I$ ar $RCOCl$ reaguoja azotas. Piridinio jonas prijungia $H-$ ties $C-4$ ($NAD+$ ⇌ $NADH$).', 'Pyridine: SEAr only under harsh conditions and at $C-3$; with $CH3I$ or $RCOCl$ nitrogen reacts. The pyridinium ion accepts $H-$ at $C-4$ ($NAD+$ ⇌ $NADH$).'),
          t('Bazės: U, T, C (pirimidinai), A, G (purinai). DNR: A, T, G, C; RNR: A, U, G, C. Glikozidinis ryšys per $N-1$ (pirimidinai) arba $N-9$ (purinai).', 'Bases: U, T, C (pyrimidines), A, G (purines). DNA: A, T, G, C; RNA: A, U, G, C. The glycosidic bond is through $N-1$ (pyrimidines) or $N-9$ (purines).'),
          t('Laktamo ⇌ laktimo tautomerija: nukleorūgštyse laktamo forma (adeninas – enamino); SEAr (uracilo nitrinimas ties $C-5$) vyksta per laktimo formą.', 'Lactam ⇌ lactim tautomerism: the lactam form (adenine: enamine) in nucleic acids; SEAr (nitration of uracil at $C-5$) goes through the lactim form.'),
          t('Vandeniliniai ryšiai: A–T (A–U) – 2, G–C – 3; uracilo laktamo dimeras per $N-H$···$O=C$.', 'Hydrogen bonds: A–T (A–U) 2, G–C 3; the uracil lactam dimer through $N-H$···$O=C$.')
        ]
      }
    ],
    types: [
      /* ============================================================ generators */
      {
        id: 'u16.arom',
        title: t('Aromatinės atomų grupės ir $π$ elektronai', 'Aromatic atoms and $π$ electrons'),
        mirrors: [],
        gen(rng, ctx) {
          const { chem } = ctx;
          const POOL = ['CN1CCCC1c1cccnc1', 'C1CCNC(C1)c1cccnc1', 'NC(=O)c1cccnc1', 'OC(=O)c1cccnc1', 'Cc1ncc(CO)c(CO)c1O', 'Cc1ncc(CO)c(C=O)c1O',
            'C1CCN(CC1)c1ccccn1', 'OCc1ccco1', 'C1CCC(O1)c1ccc[nH]1', 'NC(Cc1c[nH]c2ccccc12)C(=O)O', 'NC(Cc1cnc[nH]1)C(=O)O', 'NCCc1c[nH]c2ccc(O)cc12',
            'C1CCc2ccccc2NC1', 'C1Cc2ccccc2N1', 'C1Cc2ccccc2CN1', 'Cn1cccc1', 'NCCc1cnc[nH]1', 'Cc1ccccn1', 'Cc1cccnc1', 'Cc1ccncc1', 'Nc1ccncc1',
            'c1ccc2ncccc2c1', 'c1ccc2cnccc2c1', 'Cc1cncnc1', 'Nc1ncccn1', 'Nc1ncnc2[nH]cnc12', 'C1CCNC1c1ccco1', 'CC(=O)c1cccs1', 'C1CCN(CC1)c1nccs1',
            'C1CCN(C1)c1cccnc1', 'C1CCSC1c1ccccn1', 'C1COCCN1c1ccccn1', 'C1CNC(C1)c1cccnc1', 'Cn1ccnc1', 'Cc1c[nH]c2ccccc12', 'OCc1cccnc1', 'CCCc1ccco1',
            'Cc1ccc[nH]1', 'c1ccc2[nH]cnc2c1', 'C1CCC(CC1)c1ccsc1'];
          const smi = ctx.pick(POOL);
          const m = chem.parse(smi);
          const ar = [];
          m.atoms.forEach((a, i) => { if (a.aromatic) ar.push(i); });
          if (!ar.length) throw new Error('u16.arom: no aromatic atoms in ' + smi);
          // the aromatic atoms must form one connected system
          const seen = new Set([ar[0]]);
          const stack = [ar[0]];
          while (stack.length) { const x = stack.pop(); m.nbr[x].forEach((y) => { if (m.atoms[y].aromatic && !seen.has(y)) { seen.add(y); stack.push(y); } }); }
          if (seen.size !== ar.length) throw new Error('u16.arom: two aromatic systems in ' + smi);
          let pi = 0;
          ar.forEach((i) => {
            const a = m.atoms[i];
            const lp = a.el === 'O' || a.el === 'S' || (a.el === 'N' && (a.h > 0 || m.nbr[i].length === 3));
            pi += lp ? 2 : 1;
          });
          const lpAtoms = ar.filter((i) => { const a = m.atoms[i]; return a.el === 'O' || a.el === 'S' || (a.el === 'N' && (a.h > 0 || m.nbr[i].length === 3)); });
          return {
            q: [{ p: t('Molekulėje yra aromatinė sistema ir (arba) sotūs žiedai.', 'The molecule contains an aromatic system and (or) saturated rings.') }, { mol: { smi } }],
            steps: [
              {
                prompt: t('Bakstelėkite visus aromatinės sistemos atomus.', 'Tap all the atoms of the aromatic system.'),
                kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, from: 'aromatic',
                hint: t('Aromatinis žiedas yra plokščias, konjuguotas ir turi $4n+2$ $π$ elektronų. Sotūs žiedai (be dvigubųjų ryšių) tokie nėra.', 'An aromatic ring is planar, conjugated and has $4n+2$ $π$ electrons. Saturated rings (without double bonds) are not.'),
                solution: t('Aromatinę sistemą sudaro ' + ar.length + ' atomų (Nr. ' + ar.map((i) => i + 1).join(', ') + '); sotūs žiedai ir šoninės grupės į ją neįeina.', 'The aromatic system has ' + ar.length + ' atoms (no. ' + ar.map((i) => i + 1).join(', ') + '); saturated rings and side groups are not part of it.')
              },
              {
                prompt: t('Kiek $π$ elektronų turi ši aromatinė sistema?', 'How many $π$ electrons does this aromatic system have?'),
                kind: 'number', answer: { value: pi, tol: 0 }, mol: { smi, opts: { numbers: 'all' } },
                hint: t('Kiekvienas atomas su dvigubuoju ryšiu duoda vieną elektroną. Heteroatomas be dvigubojo ryšio (N–H, N–R, O, S) duoda visą laisvąją porą.', 'Every atom with a double bond gives one electron. A heteroatom without a double bond (N–H, N–R, O, S) gives its whole lone pair.'),
                solution: lpAtoms.length
                  ? t('Atomai, duodantys po 1 elektroną: ' + (ar.length - lpAtoms.length) + '; heteroatomas Nr. ' + lpAtoms.map((i) => i + 1).join(', ') + ' duoda po 2. Iš viso ' + pi + ' $π$ elektronų.', 'Atoms giving 1 electron each: ' + (ar.length - lpAtoms.length) + '; the heteroatom no. ' + lpAtoms.map((i) => i + 1).join(', ') + ' gives 2. In total ' + pi + ' $π$ electrons.')
                  : t('Visi ' + ar.length + ' atomai (anglys ir piridino tipo azotas) duoda po 1 elektroną: ' + pi + ' $π$ elektronų.', 'All ' + ar.length + ' atoms (carbons and pyridine-type nitrogen) give 1 electron each: ' + pi + ' $π$ electrons.')
              }
            ],
            why: t('Pirmiausia surandama konjuguota plokščia sistema; sotūs žiedai į ją neįeina. Elektronai skaičiuojami po vieną iš kiekvieno atomo su $π$ ryšiu ir po du iš pirolo tipo heteroatomo. Rezultatas $4n+2$ (6 arba 10) patvirtina aromatiškumą.',
              'First find the conjugated planar system; saturated rings are not part of it. Count one electron from every atom with a $π$ bond and two from a pyrrole-type heteroatom. A result of $4n+2$ (6 or 10) confirms aromaticity.'),
            src: 'T p141'
          };
        }
      },
      {
        id: 'u16.sextet',
        title: t('Kurio heteroatomo pora yra sekstete?', 'Whose lone pair is in the sextet?'),
        mirrors: [],
        gen(rng, ctx) {
          const { chem } = ctx;
          const POOL = ['c1cc[nH]c1', 'Cn1cccc1', 'Cc1ccc[nH]1', 'Cc1cc[nH]c1', 'c1ccoc1', 'Cc1ccco1', 'O=Cc1ccco1', 'c1ccsc1', 'Cc1cccs1', 'Cc1ccsc1', 'Brc1cccs1',
            'c1c[nH]cn1', 'Cn1ccnc1', 'Cc1ncc[nH]1', 'Cc1cnc[nH]1', 'Cc1nccn1C', 'NCCc1cnc[nH]1', 'c1cc[nH]n1', 'Cn1cccn1', 'Cc1cc[nH]n1', 'c1cocn1', 'c1cscn1', 'c1cnoc1',
            'c1nc[nH]n1', 'c1ccc2[nH]ccc2c1', 'Cc1c[nH]c2ccccc12', 'NCCc1c[nH]c2ccccc12', 'Cn1ccc2ccccc12', 'c1ccc2[nH]cnc2c1', 'c1ccc2occc2c1', 'c1ccc2sccc2c1',
            'c1ncc2nc[nH]c2n1', 'Nc1ncnc2[nH]cnc12', 'c1cnc2[nH]ccc2c1', 'Nc1nccs1', 'Cc1nccs1', 'Cc1ncco1', 'c1ccc2scnc2c1', 'c1ccc2ocnc2c1', 'c1ccc(cc1)-c1ccc[nH]1',
            'c1ccc(cc1)-c1cnc[nH]1', 'Cc1ccc(C)[nH]1'];
          const smi = ctx.pick(POOL);
          const m = chem.parse(smi);
          const lp = [], py = [];
          m.atoms.forEach((a, i) => {
            if (!a.aromatic || a.el === 'C' || a.charge !== 0) return;
            const deg = m.nbr[i].length;
            if (a.el === 'O' || a.el === 'S' || (a.el === 'N' && (a.h > 0 || deg === 3))) lp.push(i);
            else if (a.el === 'N' && deg === 2 && a.h === 0) py.push(i);
          });
          if (!lp.length) throw new Error('u16.sextet: no pyrrole-type atom in ' + smi);
          const nm = (i) => m.atoms[i].el;
          const lab = (l) => l.map((i) => i + 1).join(', ');
          const steps = [{
            prompt: t('Bakstelėkite heteroatomus, kurių laisvoji elektronų pora įeina į aromatinį $π$ sekstetą.', 'Tap the heteroatoms whose lone pair is part of the aromatic $π$ sextet.'),
            kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: lp,
            hint: t('Pagalvokite, kurie žiedo atomai gali duoti tik po vieną elektroną (turi dvigubąjį ryšį), o kuris turi duoti visą porą, kad žiede būtų 6 $π$ elektronai.', 'Think which ring atoms can give only one electron each (they have a double bond), and which atom must give a whole pair to reach 6 $π$ electrons.'),
            solution: t('Heteroatomas Nr. ' + lab(lp) + ' neturi dvigubojo ryšio žiede (arba yra $O$, $S$), todėl jo laisvoji pora yra $p$ orbitalėje ir įeina į sekstetą.', 'Heteroatom no. ' + lab(lp) + ' has no double bond in the ring (or is $O$, $S$), so its lone pair sits in a $p$ orbital and belongs to the sextet.')
          }];
          if (py.length) {
            steps.push({
              prompt: t('Bakstelėkite azoto atomus, kurie gali prijungti protoną nesunaikindami aromatiškumo.', 'Tap the nitrogen atoms that can bind a proton without destroying the aromaticity.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: py,
              hint: t('Ieškokite azoto, kurio laisvoji pora guli žiedo plokštumoje, ne $π$ sekstete.', 'Look for a nitrogen whose lone pair lies in the ring plane, not in the $π$ sextet.'),
              solution: t('Azotas Nr. ' + lab(py) + ' turi dvigubąjį ryšį: jo laisvoji pora yra žiedo plokštumoje ir laisva, todėl jis bazinis.', 'Nitrogen no. ' + lab(py) + ' has a double bond: its lone pair is in the ring plane and free, so it is basic.')
            });
          } else {
            steps.push({
              prompt: t('Kodėl šis heterociklas yra labai silpna bazė?', 'Why is this heterocycle only a very weak base?'),
              kind: 'choice',
              options: [
                tx('Heteroatomo laisvoji pora yra aromatiniame sekstete; protonavimas sunaikintų aromatiškumą.', 'The lone pair of the heteroatom is in the aromatic sextet; protonation would destroy the aromaticity.'),
                tx('Heteroatomas neturi laisvosios elektronų poros.', 'The heteroatom has no lone pair.'),
                tx('Laisvoji pora yra $sp^3^$ orbitalėje už žiedo ribų ir per toli nuo protono.', 'The lone pair is in an $sp^3^$ orbital outside the ring, too far from a proton.'),
                tx('Aromatinė sistema yra neutrali, o neutralios sistemos protono niekada neprijungia.', 'An aromatic system is neutral, and a neutral system never takes up a proton.')
              ],
              answer: 0,
              hint: t('Palyginkite su piridinu: kuo skiriasi jo azoto poros padėtis?', 'Compare with pyridine: how does the position of its nitrogen pair differ?'),
              solution: t('Heteroatomo pora reikalinga 6 $π$ elektronų sekstetui, todėl jos negalima atiduoti protonui nepraradus aromatiškumo.', 'The heteroatom pair is needed for the 6 $π$-electron sextet, so it cannot be given to a proton without losing aromaticity.')
            });
          }
          return {
            q: [{ p: t('Šis heterociklas yra aromatinis.', 'This heterocycle is aromatic.') }, { mol: { smi } }],
            steps,
            why: t('Aromatiniame sekstete kiekvienas atomas duoda vieną elektroną, išskyrus pirolo tipo heteroatomą ($N-H$, $N-R$, $O$, $S$), kuris duoda visą porą. Piridino tipo azotas ($N=$) duoda vieną elektroną, o jo laisvoji pora lieka žiedo plokštumoje ir yra bazinė.',
              'In an aromatic sextet every atom gives one electron, except a pyrrole-type heteroatom ($N-H$, $N-R$, $O$, $S$), which gives its whole pair. A pyridine-type nitrogen ($N=$) gives one electron, and its lone pair stays in the ring plane and is basic.'),
            src: 'T p141, p143'
          };
        }
      },
      {
        id: 'u16.protonate',
        title: t('Kuris azotas protonuojamas pirmas?', 'Which nitrogen is protonated first?'),
        mirrors: ['S7.13', 'S7.15'],
        gen(rng, ctx) {
          const { chem, react } = ctx;
          const POOL = ['CN1CCCC1c1cccnc1', 'C1CCNC(C1)c1cccnc1', 'NCc1cccnc1', 'NCCc1cnc[nH]1', 'CN(C)Cc1cccnc1', 'C1CCN(C1)Cc1cccnc1', 'NCCc1cccnc1', 'NCc1cnc[nH]1',
            'CCN(CC)CCc1cccnc1', 'C1CNC(C1)c1cccnc1', 'CN(C)c1ccncc1', 'Nc1ccncc1', 'Nc1ccccn1', 'CN(C)c1ccccn1', 'C1CCN(CC1)c1ccncc1', 'NC(=O)c1cccnc1', 'NC(=O)c1ccncc1',
            'c1c[nH]cn1', 'Cn1ccnc1', 'c1ccc2[nH]cnc2c1', 'Cc1ncc[nH]1',
            'CN1CCCC1c1ccncc1', 'CN(C)CCc1ccncc1', 'NCCc1ccncc1', 'CNC(=O)c1cccnc1', 'CC(=O)Nc1ccncc1', 'CCN(CC)c1ccncc1'];
          const smi = ctx.pick(POOL);
          const X = ctx.pick(['Cl', 'Br', 'I']);
          const m = chem.parse(smi);
          // basic sites by the course order: aliphatic amine (3) > pyridine-type N (2.5) > aryl-amine N (2); amide and pyrrole-type N are not basic
          const sites = [];
          const others = [];
          m.atoms.forEach((a, i) => {
            if (a.el !== 'N' || a.charge !== 0) return;
            if (a.aromatic) {
              if (a.h === 0 && m.nbr[i].length === 2) sites.push({ i, rank: 2.5, kind: 'ring' });
              else others.push({ i, kind: 'pyrrole' });
              return;
            }
            const nb = m.nbr[i];
            const amide = nb.some((j) => m.nbr[j].some((k) => m.atoms[k].el === 'O' && m.bondAt(j, k).order === 2));
            if (amide) { others.push({ i, kind: 'amide' }); return; }
            sites.push({ i, rank: nb.some((j) => m.atoms[j].aromatic) ? 2 : 3, kind: nb.some((j) => m.atoms[j].aromatic) ? 'aryl' : 'alk' });
          });
          sites.sort((p, q) => q.rank - p.rank || p.i - q.i);
          if (!sites.length || (sites.length > 1 && sites[0].rank === sites[1].rank)) throw new Error('u16.protonate: no clear first site in ' + smi);
          const top = sites[0];
          let cat;
          if (top.kind === 'alk' && sites.some((s) => s.kind === 'ring')) cat = 'alk';
          else if (top.kind === 'ring' && sites.some((s) => s.kind === 'aryl')) cat = 'aryl';
          else if (top.kind === 'ring' && others.some((o) => o.kind === 'amide')) cat = 'amide';
          else if (top.kind === 'ring' && others.some((o) => o.kind === 'pyrrole')) cat = 'pyrrole';
          else throw new Error('u16.protonate: unsupported pattern in ' + smi);
          // the protonated SMILES, by changing the token of nitrogen i
          const spans = [];
          for (let p = 0; p < smi.length;) {
            const c = smi[p];
            if (c === '[') { const j = smi.indexOf(']', p); spans.push([p, j + 1]); p = j + 1; }
            else if ((c === 'C' && smi[p + 1] === 'l') || (c === 'B' && smi[p + 1] === 'r')) { spans.push([p, p + 2]); p += 2; }
            else if (/[BCNOPSFIcnops]/.test(c)) { spans.push([p, p + 1]); p++; }
            else p++;
          }
          const protonate = (idx) => {
            let s = smi;
            idx.slice().sort((p, q) => q - p).forEach((i) => {
              const a = m.atoms[i];
              const tok = (a.aromatic ? '[nH' : '[NH') + (a.h + 1 > 1 ? String(a.h + 1) : '') + '+]';
              const fix = a.aromatic && a.h > 0 ? '[nH' + (a.h + 1) + '+]' : tok;
              s = s.slice(0, spans[i][0]) + fix + s.slice(spans[i][1]);
            });
            return s + '.[' + X + '-]';
          };
          const two = cat === 'alk' && ctx.pick([false, true]);
          const eq = two ? 2 : 1;
          const mine = protonate(two ? [sites[0].i, sites[1].i] : [top.i]);
          const res = react.run('amine.protonate', [smi], two ? { X, eq: 2 } : { X });
          const maj = res.products.filter((p) => p.major);
          if (maj.length !== 1 || !chem.same(maj[0].smi, two ? protonate([sites[0].i, sites[1].i]).replace('.[' + X + '-]', '.[' + X + '-].[' + X + '-]') : mine, { stereo: false })) throw new Error('u16.protonate: engine disagrees for ' + smi);
          const first = protonate([top.i]);
          const REASON = {
            alk: [t('Alifatinio amino azoto $sp^3^$ pora laisva ir praturtinta alkilo grupių, o žiedo azoto pora yra ant $sp^2^$ orbitalės elektronų deficitiniame žiede.', 'The $sp^3^$ pair of the aliphatic amine is free and enriched by alkyl groups, while the ring nitrogen pair is in an $sp^2^$ orbital on an electron-poor ring.'),
              t('Žiedo azotas neturi laisvosios elektronų poros.', 'The ring nitrogen has no lone pair.'),
              t('Aromatinis azotas visada bazingesnis dėl rezonanso.', 'An aromatic nitrogen is always the stronger base because of resonance.'),
              t('Pirmas protonuojamas azotas, esantis arčiau žiedo.', 'The nitrogen closer to the ring is protonated first.')],
            aryl: [t('Protonuojant žiedo azotą, katijoną papildomai stabilizuoja aminogrupės pora (rezonansas), o aminogrupės pora jau yra konjuguota su žiedu.', 'When the ring nitrogen is protonated, the cation is further stabilised by the pair of the amino group (resonance), and the amino pair is already conjugated with the ring.'),
              t('Aminogrupės azotas yra $sp^3^$, todėl bazingesnis už piridino azotą.', 'The amino nitrogen is $sp^3^$, so it is more basic than the pyridine nitrogen.'),
              t('Piridino azoto pora yra aromatiniame sekstete.', 'The pyridine nitrogen pair is in the aromatic sextet.'),
              t('Protonas visada jungiasi prie pakaito, o ne prie žiedo.', 'A proton always bonds to the substituent, never to the ring.')],
            amide: [t('Amido azoto pora delokalizuota į $C=O$ grupę, todėl nebazinė; piridino tipo azoto pora laisva.', 'The amide nitrogen pair is delocalised into the $C=O$ group and is not basic; the pyridine-type nitrogen pair is free.'),
              t('Amido azotas yra $sp^3^$ ir stipresnė bazė už piridino azotą.', 'The amide nitrogen is $sp^3^$ and a stronger base than the pyridine nitrogen.'),
              t('Piridino azoto pora yra aromatiniame sekstete.', 'The pyridine nitrogen pair is in the aromatic sextet.'),
              t('Amidai yra stipresnės bazės už aminus.', 'Amides are stronger bases than amines.')],
            pyrrole: [t('Pirolo tipo azoto ($N-H$) pora yra aromatiniame sekstete, o piridino tipo azoto pora guli žiedo plokštumoje ir laisva.', 'The pair of the pyrrole-type nitrogen ($N-H$) is in the aromatic sextet, while the pyridine-type pair lies in the ring plane and is free.'),
              t('Azotas su vandeniliu visada bazingesnis už azotą be vandenilio.', 'A nitrogen carrying hydrogen is always more basic than one without hydrogen.'),
              t('Abiejų azotų poros vienodai laisvos, todėl protonuojamas bet kuris.', 'Both nitrogen pairs are equally free, so either can be protonated.'),
              t('Piridino tipo azotas neturi laisvosios poros.', 'The pyridine-type nitrogen has no lone pair.')]
          }[cat];
          const opt = (s) => ({ mol: { smi: s } });
          const wrong = [];
          sites.concat(others).forEach((s) => { if (s.i !== top.i) { try { const w = protonate([s.i]); chem.parse(w); wrong.push(w); } catch (e) { /* skip */ } } });
          const allN = sites.concat(others).map((x) => x.i);
          if (wrong.length < 2 && allN.length >= 2) {
            // a common slip: every nitrogen protonated by one equivalent of acid
            const d = protonate(allN) + ('.[' + X + '-]').repeat(allN.length - 1);
            try { chem.parse(d); wrong.push(d); } catch (e) { /* skip */ }
          }
          const steps = [
            {
              prompt: t('Bakstelėkite azoto atomą, kuris protonuojamas pirmas (su 1 ekv. $H' + X + '$).', 'Tap the nitrogen atom that is protonated first (with 1 equiv. of $H' + X + '$).'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: [top.i],
              hint: t('Palyginkite azotų laisvąsias poras: kuri pora laisva ir kuri įtraukta į kitą sistemą?', 'Compare the lone pairs of the nitrogens: which pair is free and which is tied up in another system?'),
              solution: t('Pirmą ekvivalentą prijungia azotas Nr. ' + (top.i + 1) + ' – bazingiausias iš visų.', 'The first equivalent is taken by nitrogen no. ' + (top.i + 1) + ', the most basic one.')
            },
            {
              prompt: t('Kodėl pirmas protonuojamas būtent šis azotas?', 'Why is exactly this nitrogen protonated first?'),
              kind: 'choice', options: REASON.map((x) => ({ text: x })), answer: 0,
              hint: t('Pagalvokite, kokioje sistemoje yra kiekvieno azoto laisvoji pora ir ar ji prieinama protonui.', 'Think about the system each nitrogen pair belongs to and whether a proton can reach it.'),
              solution: REASON[0]
            },
            {
              prompt: t('Kokia druska susidaro su 1 ekv. $H' + X + '$?', 'Which salt forms with 1 equiv. of $H' + X + '$?'),
              kind: 'choice', options: [opt(first)].concat(wrong.slice(0, 3).map(opt)), answer: 0,
              hint: t('Visi variantai yra to paties junginio druskos, skiriasi tik protonuotas atomas.', 'All options are salts of the same compound; only the protonated atom differs.'),
              solution: [{ p: t('Protonuotas bazingiausias azotas; kiti variantai protonuoja azotą, kurio pora sekstete, amido grupėje ar mažiau bazinį.', 'The most basic nitrogen is protonated; the other options protonate a nitrogen whose pair is in the sextet, in an amide group or less basic.') }, { mol: { smi: first } }]
            }
          ];
          if (two) {
            const dsalt = protonate([sites[0].i, sites[1].i]).replace('.[' + X + '-]', '.[' + X + '-].[' + X + '-]');
            const fm = chem.formulaString(chem.parse(dsalt));
            steps.push({
              prompt: t('Į tirpalą įpylus dar vieną ekvivalentą $H' + X + '$, susidaro dvigubo katijono druska. Kokia jos molekulinė formulė?', 'A second equivalent of $H' + X + '$ gives the salt of the dication. What is its molecular formula?'),
              kind: 'formula', mol: { smi: dsalt }, answer: fm,
              hint: t('Pridėkite dar vieną $H' + X + '$ prie pirmosios druskos formulės.', 'Add another $H' + X + '$ to the formula of the first salt.'),
              solution: [{ p: t('Antrasis ekvivalentas protonuoja kitą bazinį azotą; formulė ' + fm + '.', 'The second equivalent protonates the other basic nitrogen; the formula is ' + fm + '.') }, { mol: { smi: dsalt } }]
            });
          }
          return {
            q: [{ p: two ? t('Junginys reaguoja su $H' + X + '$: pirmiausia su 1 ekv., po to su pertekliumi.', 'The compound reacts with $H' + X + '$: first with 1 equiv., then with an excess.') : t('Junginys reaguoja su 1 ekv. $H' + X + '$.', 'The compound reacts with 1 equiv. of $H' + X + '$.') }, { mol: { smi } }],
            steps,
            why: t('Protonas jungiasi prie azoto, kurio laisvoji pora prieinamiausia: sotus aminas > piridino tipo azotas > arilamino azotas. Pirolo tipo azoto ir amido azoto poros delokalizuotos ir nebazinės.',
              'A proton bonds to the nitrogen whose lone pair is most available: saturated amine > pyridine-type nitrogen > arylamine nitrogen. The pairs of a pyrrole-type nitrogen and of an amide nitrogen are delocalised and not basic.'),
            src: 'S7.13, T p143'
          };
        }
      },
      {
        id: 'u16.sear',
        title: t('Pirolas, furanas, tiofenas: kur prisijungia elektrofilas?', 'Pyrrole, furan, thiophene: where does the electrophile go?'),
        mirrors: ['S7.14', 'S7.15'],
        gen(rng, ctx) {
          const { chem } = ctx;
          const HEADS = [
            { id: 'pyr', head: '[nH]1', name: t('pirolas', 'pyrrole'), nh: true },
            { id: 'nme', head: 'n1(C)', name: t('$N$-metilpirolas', '$N$-methylpyrrole'), nh: false },
            { id: 'fur', head: 'o1', name: t('furanas', 'furan'), nh: false },
            { id: 'thi', head: 's1', name: t('tiofenas', 'thiophene'), nh: false }
          ];
          const SUBS = [
            { r: 'C', lt: '2-metil', en: '2-methyl', nlt: '1,2-dimetilpirolas', nen: '1,2-dimethylpyrrole' },
            { r: 'CC', lt: '2-etil', en: '2-ethyl', nlt: '2-etil-1-metilpirolas', nen: '2-ethyl-1-methylpyrrole' },
            { r: 'CCC', lt: '2-propil', en: '2-propyl', nlt: '1-metil-2-propilpirolas', nen: '1-methyl-2-propylpyrrole' },
            { r: 'CCCC', lt: '2-butil', en: '2-butyl', nlt: '2-butil-1-metilpirolas', nen: '2-butyl-1-methylpyrrole' }
          ];
          const ES = [
            { frag: '[N+](=O)[O-]', reagent: 'CH3COONO2', lt: 'nitrinimas', en: 'nitration', plt: 'nitro', pen: 'nitro' },
            { frag: 'S(=O)(=O)O', reagent: 'SO3, C5H5N', lt: 'sulfoninimas', en: 'sulfonation', plt: 'sulfo', pen: 'sulfo' },
            { frag: 'C(C)=O', reagent: '(CH3CO)2O', lt: 'acilinimas', en: 'acylation', plt: 'acetil', pen: 'acetyl' }
          ];
          let h, s, e;
          // Ac2O acylates only pyrrole-type rings and SO3-pyridine sulfonation is not used for thiophene (T p142)
          do { h = ctx.pick(HEADS); s = ctx.pick(SUBS); e = ctx.pick(ES); }
          while ((!['pyr', 'nme'].includes(h.id) && e.frag === 'C(C)=O') || (h.id === 'thi' && e.frag === 'S(=O)(=O)O'));
          const sub = h.head + 'c' + (s.r ? '(' + s.r + ')' : '') + 'ccc1';
          const m = chem.parse(sub);
          const hetero = m.atoms.findIndex((a, i) => a.aromatic && a.el !== 'C');
          const alphas = m.nbr[hetero].filter((j) => m.atoms[j].aromatic && m.atoms[j].h > 0);
          if (!alphas.length) throw new Error('u16.sear: no free alpha carbon in ' + sub);
          const E = e.frag;
          const right = sub + E;
          const wrong = [];
          wrong.push(h.head + 'c' + (s.r ? '(' + s.r + ')' : '') + 'c(' + E + ')cc1');              // E on C-4 (or C-3 when C-2 is free)
          if (s.r) wrong.push(h.head + 'c(' + s.r + ')cc(' + E + ')c1', h.head + 'c(' + s.r + E + ')ccc1');
          else wrong.push(h.head + 'cc(' + E + ')cc1');
          if (h.nh) wrong.push(s.r ? 'n1(' + E + ')c(' + s.r + ')ccc1' : 'n1(' + E + ')cccc1');
          const canon = (x) => chem.canonical(chem.parse(x), { stereo: false });
          const seen = new Set([canon(right)]);
          const opts = [{ mol: { smi: right } }];
          wrong.forEach((w) => { let k; try { k = canon(w); } catch (err) { return; } if (!seen.has(k) && opts.length < 4) { seen.add(k); opts.push({ mol: { smi: w } }); } });
          if (opts.length < 2) throw new Error('u16.sear: too few options for ' + sub);
          const lab = alphas.map((i) => i + 1).join(' ir ');
          const labEn = alphas.map((i) => i + 1).join(' and ');
          const steps = [
            {
              prompt: t('Bakstelėkite anglies atomą (-us), prie kurio (-ių) greičiausiai jungiasi elektrofilas. Simetriškai ekvivalentiškos padėtys skaičiuojamos kartu.', 'Tap the carbon atom(s) to which the electrophile bonds fastest. Positions equivalent by symmetry count together.'),
              kind: 'atoms', mol: { smi: sub, opts: { numbers: 'all' } }, answer: alphas,
              hint: t('Palyginkite, kiek rezonansinių formulių turi tarpinis katijonas, kai ataka vyksta ties kiekviena padėtimi.', 'Compare how many resonance structures the intermediate cation has for attack at each position.'),
              solution: t('Elektrofilas jungiasi prie $C-2$ tipo padėties greta heteroatomo: atomas Nr. ' + lab + '. Čia katijonas turi tris rezonansines formules.', 'The electrophile bonds to a $C-2$-type position next to the heteroatom: atom no. ' + labEn + '. There the cation has three resonance structures.')
            },
            {
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options: opts, answer: 0,
              hint: t('Visi variantai turi tą pačią formulę, todėl lemia tik pakaito vieta.', 'All options have the same formula, so only the position of the substituent matters.'),
              solution: [{ p: t('Pakaitas patenka į laisvą padėtį greta heteroatomo; azotas ir šoninė grandinė nereaguoja.', 'The substituent enters the free position next to the heteroatom; nitrogen and the side chain do not react.') }, { mol: { smi: right } }]
            },
            {
              prompt: t('Kodėl pirmenybė teikiama padėčiai šalia heteroatomo?', 'Why is the position next to the heteroatom preferred?'),
              kind: 'choice',
              options: [
                tx('Ataka ties $C-2$ duoda katijoną su trimis rezonansinėmis formulėmis, ties $C-3$ – tik su dviem; stabilesnis katijonas susidaro greičiau.', 'Attack at $C-2$ gives a cation with three resonance structures, at $C-3$ only two; the more stable cation forms faster.'),
                tx('Ataka ties $C-3$ padėtų teigiamą krūvį ant heteroatomo, kuris to nepakelia.', 'Attack at $C-3$ would put the positive charge on the heteroatom, which cannot bear it.'),
                tx('Heteroatomas veikia kaip $m$-orientantas ir deaktyvuoja kitas padėtis.', 'The heteroatom acts as a $m$ director and deactivates the other positions.'),
                tx('Tik $C-2$ turi vandenilį, kurį galima pakeisti.', 'Only $C-2$ carries a hydrogen that can be replaced.')
              ],
              answer: 0,
              hint: t('Nupieškite abu tarpinius katijonus ir suskaičiuokite jų rezonansines formules.', 'Draw both intermediate cations and count their resonance structures.'),
              solution: t('Atakuojant $C-2$, krūvį gali paskirstyti ir azoto (ar $O$, $S$) laisvoji pora: susidaro trys formulės. Atakuojant $C-3$ krūvis gali pasiskirstyti tik dviejose padėtyse.', 'When $C-2$ is attacked, the lone pair of nitrogen (or $O$, $S$) can also carry the charge: three structures result. For attack at $C-3$ the charge can be spread over only two positions.')
            }
          ];
          return {
            q: [
              { p: t('Heterociklas ' + (h.id === 'nme' ? s.nlt : s.lt + h.name.lt) + ' reaguoja su reagentu ($' + e.reagent + '$): ' + e.lt + '.', 'The heterocycle ' + (h.id === 'nme' ? s.nen : s.en + h.name.en) + ' reacts with the reagent ($' + e.reagent + '$): ' + e.en + '.') },
              { scheme: { items: [{ smi: sub }, { arrow: '→', above: f(e.reagent) }] } }
            ],
            steps,
            why: t('Pirolas, furanas ir tiofenas yra elektronų pertekliniai, todėl SEAr vyksta lengvai ir ties $C-2$ (greta heteroatomo), nes tarpinis katijonas turi daugiausia rezonansinių formulių. Jei viena iš dviejų $C-2$ padėčių užimta, pakaitas patenka į kitą. Azotas, kurio pora sekstete, nereaguoja.',
              'Pyrrole, furan and thiophene are electron-rich, so SEAr is easy and takes place at $C-2$ (next to the heteroatom), because the intermediate cation has the most resonance structures. If one of the two $C-2$ positions is taken, the substituent goes to the other. A nitrogen whose pair is in the sextet does not react.'),
            src: 'T p142, S7.14'
          };
        }
      },
      /* ============================================================ banks: basicity, pyridine, nucleophile */
      {
        id: 'u16.basicity',
        title: t('Bazingumas ir rūgštingumas: palyginimai su priežastimis', 'Basicity and acidity: comparisons with reasons'),
        mirrors: ['S7.13', 'S7.15'],
        bank: [
          {
            id: 'u16.basicity.1',
            q: [
              { p: t('Palyginkite keturių azoto junginių bazingumą.', 'Compare the basicity of four nitrogen compounds.') },
              { mol: [{ smi: 'C1CCNCC1' }, { smi: IMIDAZOLE }, { smi: PYRIDINE }, { smi: PYRROLE }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Put them in order from the strongest base to the weakest.'),
                kind: 'order',
                options: [tx('piperidinas', 'piperidine'), tx('imidazolas', 'imidazole'), tx('piridinas', 'pyridine'), tx('pirolas', 'pyrrole')],
                hint: t('Pirmiausia nuspręskite, kurios azoto poros yra laisvos, o kuri – aromatiniame sekstete. Tada palyginkite laisvų porų prieinamumą.', 'First decide which nitrogen pairs are free and which is in the aromatic sextet. Then compare how available the free pairs are.'),
                solution: t('Piperidinas (konjuguotosios rūgšties pKa ≈ 11) > imidazolas (≈ 7) > piridinas (≈ 5) > pirolas (≈ −4).', 'Piperidine (conjugate acid pKa ≈ 11) > imidazole (≈ 7) > pyridine (≈ 5) > pyrrole (≈ −4).')
              },
              {
                prompt: t('Kodėl pirolas yra pati silpniausia bazė?', 'Why is pyrrole the weakest base of the four?'),
                kind: 'choice',
                options: [
                  tx('Jo azoto pora yra aromatiniame sekstete; protonavimas ant azoto sunaikintų aromatiškumą.', 'Its nitrogen pair is in the aromatic sextet; protonation on nitrogen would destroy the aromaticity.'),
                  tx('Pirolo azotas neturi laisvosios poros.', 'The pyrrole nitrogen has no lone pair.'),
                  tx('Pirolo azotas yra $sp^3^$ hibridizacijos, kaip piperidino, bet turi daugiau pakaitų.', 'The pyrrole nitrogen is $sp^3^$ like that of piperidine but has more substituents.'),
                  tx('Pirolo žiedas yra elektronų deficitinis.', 'The pyrrole ring is electron-poor.')
                ],
                answer: 0,
                hint: t('Pagalvokite, kiek $π$ elektronų turi pirolo žiedas ir iš kur jie atsiranda.', 'Think about how many $π$ electrons the pyrrole ring has and where they come from.'),
                solution: t('Šeši $π$ elektronai: keturi iš dviejų $C=C$ ir du iš azoto poros. Atidavus porą protonui, sekstetas subyrėtų.', 'There are six $π$ electrons: four from two $C=C$ bonds and two from the nitrogen pair. If the pair were given to a proton, the sextet would fall apart.')
              }
            ],
            why: t('Bazingumą lemia azoto poros prieinamumas ir susidarančio katijono stabilumas. Sotus aminas turi laisvą $sp^3^$ porą; imidazolo ir piridino azoto pora laisva ant $sp^2^$ orbitalės, bet imidazolio katijoną stabilizuoja rezonansas (krūvį dalija du azotai), todėl imidazolas bazingesnis už piridiną; pirolo pora yra aromatiniame sekstete.',
              'Basicity depends on how available the nitrogen pair is and how stable the cation is. A saturated amine has a free $sp^3^$ pair; the imidazole and pyridine pairs are free in $sp^2^$ orbitals, but the imidazolium cation is stabilised by resonance (two nitrogens share the charge), so imidazole is a stronger base than pyridine; the pyrrole pair is in the aromatic sextet.'),
            src: 'T p141, p143, Klein',
            claims: [{ aromatic: [PYRROLE, true] }, { aromatic: [PYRIDINE, true] }]
          },
          {
            id: 'u16.basicity.2',
            q: [
              { p: t('Abu junginiai turi $N-H$ grupę.', 'Both compounds contain an $N-H$ group.') },
              { mol: [{ smi: 'C1CCNC1' }, { smi: PYRROLE }] }
            ],
            steps: [
              {
                prompt: t('Kuris iš jų yra stipresnė bazė?', 'Which is the stronger base?'),
                kind: 'choice', options: [tx('pirolidinas', 'pyrrolidine'), tx('pirolas', 'pyrrole'), tx('abu vienodai', 'both equally')], answer: 0,
                hint: t('Ar abiejų azoto poros prieinamos protonui?', 'Are both nitrogen pairs available to a proton?'),
                solution: t('Pirolidinas yra sotus antrinis aminas: laisva pora, pKa (konjuguotosios rūgšties) ≈ 11. Pirolas beveik nebazinis.', 'Pyrrolidine is a saturated secondary amine: a free pair, conjugate acid pKa ≈ 11. Pyrrole is hardly basic.')
              },
              {
                prompt: t('Kuris iš jų yra stipresnė rūgštis (prarandantis $N-H$ protoną)?', 'Which is the stronger acid (losing the $N-H$ proton)?'),
                kind: 'choice', options: [tx('pirolas', 'pyrrole'), tx('pirolidinas', 'pyrrolidine'), tx('abu vienodai', 'both equally')], answer: 0,
                hint: t('Palyginkite anijonus: kuriame krūvis gali pasiskirstyti?', 'Compare the anions: in which can the charge be spread out?'),
                solution: t('Pirolido anijono krūvis pasiskirsto per aromatinį žiedą (pKa ≈ 17). Pirolidido anijono krūvis lieka ant azoto (pKa ≈ 35).', 'The charge of the pyrrolide anion is delocalised over the aromatic ring (pKa ≈ 17). The pyrrolidide charge stays on nitrogen (pKa ≈ 35).')
              }
            ],
            why: t('Šie du junginiai rodo priešingas tendencijas. Pirolo azoto pora sekstete daro jį nebaziniu, bet silpnai rūgštišku, o sotus aminas yra bazė ir beveik jokia rūgštis.', 'The two compounds show opposite trends. The pyrrole nitrogen pair in the sextet makes it non-basic but weakly acidic, while the saturated amine is a base and hardly an acid at all.'),
            src: 'T p141, Klein'
          },
          {
            id: 'u16.basicity.3',
            q: [{ p: t('Imidazolas gali reaguoti ir su rūgštimi, ir su metalu.', 'Imidazole can react with both an acid and a metal.') }],
            steps: [
              {
                prompt: t('Bakstelėkite azotą, kuris prijungia protoną.', 'Tap the nitrogen that binds a proton.'),
                kind: 'atoms', mol: { smi: IMIDAZOLE, opts: { numbers: 'all' } }, answer: [2],
                hint: t('Kuris azotas turi dvigubąjį ryšį ir laisvą porą žiedo plokštumoje?', 'Which nitrogen has a double bond and a free pair in the ring plane?'),
                solution: t('Atomas Nr. 3 (piridino tipo) turi laisvą porą. Atomo Nr. 1 pora yra sekstete.', 'Atom no. 3 (pyridine type) has a free pair. The pair of atom no. 1 is in the sextet.')
              },
              {
                prompt: t('Bakstelėkite azotą, kurio vandenilį pakeičia metalas.', 'Tap the nitrogen whose hydrogen is replaced by a metal.'),
                kind: 'atoms', mol: { smi: IMIDAZOLE, opts: { numbers: 'all' } }, answer: [0],
                hint: t('Kuris azotas turi vandenilį?', 'Which nitrogen carries a hydrogen?'),
                solution: t('Atomo Nr. 1 $N-H$ vandenilis rūgštus: susidaręs anijonas išlaiko aromatinį sekstetą.', 'The $N-H$ hydrogen of atom no. 1 is acidic: the anion that forms keeps the aromatic sextet.')
              }
            ],
            why: t('Imidazolas yra amfoterinis: vienas azotas (N-3) jungia protoną, kitas (N-1) per $N-H$ gali atiduoti protoną. Todėl imidazolo žiedas fermentų aktyviuosiuose centruose veikia ir kaip rūgštis, ir kaip bazė.', 'Imidazole is amphoteric: one nitrogen (N-3) binds a proton, the other (N-1) can give up a proton through $N-H$. That is why the imidazole ring acts as both acid and base in enzyme active sites.'),
            src: 'T p143'
          },
          {
            id: 'u16.basicity.4',
            q: [
              { p: t('Palyginkite tris bazes.', 'Compare three bases.') },
              { mol: [{ smi: 'CN(C)C' }, { smi: PYRIDINE }, { smi: 'Nc1ccccc1' }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Put them in order from the strongest base to the weakest.'),
                kind: 'order',
                options: [tx('trimetilaminas', 'trimethylamine'), tx('piridinas', 'pyridine'), tx('anilinas', 'aniline')],
                hint: t('Palyginkite poros orbitalę ir ar pora konjuguota su aromatiniu žiedu.', 'Compare the orbital of the pair and whether the pair is conjugated with an aromatic ring.'),
                solution: t('Trimetilaminas (pKa ≈ 9,8) > piridinas (≈ 5,2) > anilinas (≈ 4,6).', 'Trimethylamine (pKa ≈ 9.8) > pyridine (≈ 5.2) > aniline (≈ 4.6).')
              },
              {
                prompt: t('Kodėl piridinas silpnesnė bazė už trimetilaminą, nors jo pora laisva?', 'Why is pyridine a weaker base than trimethylamine although its pair is free?'),
                kind: 'choice',
                options: [
                  tx('Piridino pora yra ant $sp^2^$ orbitalės, kurioje daugiau $s$ charakterio, todėl laikoma arčiau branduolio; trimetilamino pora – $sp^3^$.', 'The pyridine pair is in an $sp^2^$ orbital with more $s$ character, so it is held closer to the nucleus; the trimethylamine pair is $sp^3^$.'),
                  tx('Piridino pora yra aromatiniame sekstete.', 'The pyridine pair is in the aromatic sextet.'),
                  tx('Piridinas turi daugiau anglies atomų.', 'Pyridine has more carbon atoms.'),
                  tx('Piridino azotas turi teigiamą krūvį.', 'The pyridine nitrogen carries a positive charge.')
                ],
                answer: 0,
                hint: t('Palyginkite, kokioje orbitalėje yra kiekvienos bazės laisvoji pora.', 'Compare the orbital that holds the lone pair of each base.'),
                solution: t('Kuo daugiau $s$ charakterio, tuo pora arčiau branduolio ir tuo mažiau linkusi jungti protoną. Be to, trimetilamino metilo grupės teikia elektronus ($+I$).', 'The more $s$ character, the closer the pair is to the nucleus and the less ready it is to bind a proton. In addition, the methyl groups of trimethylamine donate electrons ($+I$).')
              }
            ],
            why: t('Trys bazės: laisva $sp^3^$ pora (stipriausia), laisva $sp^2^$ pora ir pora, konjuguota su žiedu (anilinas). Piridino pora nepriklauso sekstetui, todėl bazė yra, bet silpnesnė už alifatinį aminą.', 'Three bases: a free $sp^3^$ pair (strongest), a free $sp^2^$ pair, and a pair conjugated with a ring (aniline). The pyridine pair is not part of the sextet, so it is a base, but weaker than an aliphatic amine.'),
            src: 'T p143, Klein'
          },
          {
            id: 'u16.basicity.5',
            q: [{ p: t('Imidazolo savybės.', 'Properties of imidazole.') }, { mol: { smi: IMIDAZOLE, opts: { numbers: 'all' } } }],
            steps: [{
              prompt: t('Pažymėkite visus teisingus teiginius.', 'Pick every correct statement.'),
              kind: 'multi',
              options: [
                tx('Atomo Nr. 1 laisvoji pora yra aromatiniame sekstete.', 'The lone pair of atom no. 1 is in the aromatic sextet.'),
                tx('Atomas Nr. 3 gali prijungti protoną.', 'Atom no. 3 can bind a proton.'),
                tx('Abu azotai yra vienodai bazingi.', 'Both nitrogens are equally basic.'),
                tx('$N-H$ vandenilį galima pakeisti metalu.', 'The $N-H$ hydrogen can be replaced by a metal.'),
                tx('Imidazolas yra stipresnė bazė už piperidiną.', 'Imidazole is a stronger base than piperidine.')
              ],
              answer: [0, 1, 3],
              hint: t('Atskirkite pirolo ir piridino tipo azotus.', 'Tell the pyrrole-type and pyridine-type nitrogens apart.'),
              solution: t('Teisingi teiginiai apie sekstetą, apie protono prijungimą prie azoto Nr. 3 ir apie $N-H$ vandenilio pakeitimą metalu. Azotai nevienodi (Nr. 1 – pirolo tipo, Nr. 3 – piridino tipo), o piperidinas (pKa ≈ 11) bazingesnis už imidazolą (≈ 7), todėl du kiti teiginiai klaidingi.', 'The statements about the sextet, about a proton binding to nitrogen no. 3 and about replacing the $N-H$ hydrogen by a metal are correct. The nitrogens differ (no. 1 pyrrole type, no. 3 pyridine type), and piperidine (pKa ≈ 11) is more basic than imidazole (≈ 7), so the other two statements are wrong.')
            }],
            why: t('Du skirtingi azoto tipai viename žiede daro imidazolą amfoterinį: N-3 yra bazinis centras, N-1–H – rūgštinis.', 'Two different nitrogen types in one ring make imidazole amphoteric: N-3 is the basic centre and N-1–H the acidic one.'),
            src: 'T p143',
            claims: [{ aromatic: [IMIDAZOLE, true] }]
          },
          {
            id: 'u16.basicity.6',
            q: [
              { p: t('Palyginkite trijų junginių $N-H$ rūgštingumą.', 'Compare the $N-H$ acidity of three compounds.') },
              { mol: [{ smi: IMIDAZOLE }, { smi: PYRROLE }, { smi: 'C1CCNC1' }] }
            ],
            steps: [
              {
                prompt: t('Išdėstykite nuo rūgščiausio iki mažiausiai rūgštaus.', 'Put them in order from the most acidic to the least acidic.'),
                kind: 'order',
                options: [tx('imidazolas', 'imidazole'), tx('pirolas', 'pyrrole'), tx('pirolidinas', 'pyrrolidine')],
                hint: t('Palyginkite susidarančių anijonų stabilumą: kiek azotų ir kiek atomų dalijasi krūvį?', 'Compare the stability of the anions: how many nitrogens and ring atoms share the charge?'),
                solution: t('Imidazolas (pKa ≈ 14) > pirolas (≈ 17) > pirolidinas (≈ 35).', 'Imidazole (pKa ≈ 14) > pyrrole (≈ 17) > pyrrolidine (≈ 35).')
              },
              {
                prompt: t('Kuo imidazolo anijonas stabilesnis už pirolido?', 'Why is the imidazolide anion more stable than the pyrrolide?'),
                kind: 'choice',
                options: [
                  tx('Neigiamą krūvį dalija du azoto atomai.', 'Two nitrogen atoms share the negative charge.'),
                  tx('Imidazolo anijonas turi daugiau vandenilių.', 'The imidazolide anion has more hydrogens.'),
                  tx('Imidazolas yra stipresnė bazė.', 'Imidazole is the stronger base.'),
                  tx('Imidazolo žiedas nėra aromatinis.', 'The imidazole ring is not aromatic.')
                ],
                answer: 0,
                hint: t('Nupieškite anijoną ir ieškokite elektroneigiamų atomų, galinčių priimti krūvį.', 'Draw the anion and look for electronegative atoms that can take the charge.'),
                solution: t('Anijone neigiamas krūvis dalijasi tarp abiejų azotų ir elektroneigiamas $N$ stabilizuoja jį geriau nei anglis.', 'In the anion the negative charge is shared by both nitrogens, and an electronegative $N$ stabilises it better than carbon.')
              }
            ],
            why: t('Rūgšties stiprumą nusako anijono stabilumas. Sotaus amino anijonas lieka su krūviu ant vieno azoto, pirolide jį dalija aromatinis žiedas, imidazolide – dar ir antras azotas.', 'The strength of an acid is set by the stability of its anion. The anion of a saturated amine keeps its charge on one nitrogen, in pyrrolide the aromatic ring shares it, in imidazolide a second nitrogen shares it as well.'),
            src: 'T p141, p143, Klein'
          },
          {
            id: 'u16.basicity.7',
            q: [{ p: t('Pirolo $N-H$ protoną (pKa ≈ 17) reikia nuimti beveik visiškai.', 'The $N-H$ proton of pyrrole (pKa ≈ 17) must be removed almost completely.') }, { mol: { smi: PYRROLE } }],
            steps: [{
              prompt: t('Kuris reagentas tam tinka?', 'Which reagent will do this?'),
              kind: 'choice',
              options: [
                tx('$NaNH2$ (konjuguotoji rūgštis $NH3$, pKa ≈ 35)', '$NaNH2$ (conjugate acid $NH3$, pKa ≈ 35)'),
                tx('$NaHCO3$ tirpalas (konjuguotoji rūgštis $H2CO3$, pKa ≈ 6)', '$NaHCO3$ solution (conjugate acid $H2CO3$, pKa ≈ 6)'),
                tx('$CH3COONa$ (konjuguotoji rūgštis $CH3COOH$, pKa ≈ 5)', '$CH3COONa$ (conjugate acid $CH3COOH$, pKa ≈ 5)'),
                tx('$HCl$ (stipri rūgštis)', '$HCl$ (a strong acid)')
              ],
              answer: 0,
              hint: t('Bazės konjuguotosios rūgšties pKa turi būti gerokai didesnė už pirolo pKa.', 'The pKa of the conjugate acid of the base must be well above the pKa of pyrrole.'),
              solution: t('Tik $NH2-$ (konjuguotoji rūgštis pKa ≈ 35) yra daug stipresnė bazė už pirolidą (≈ 17); bikarbonatas ir acetatas per silpni, $HCl$ yra rūgštis.', 'Only $NH2-$ (conjugate acid pKa ≈ 35) is a much stronger base than pyrrolide (≈ 17); bicarbonate and acetate are too weak, and $HCl$ is an acid.')
            }],
            why: t('Pusiausvyra pasislenka prie silpnesnės rūgšties: bazė tinka, jei jos konjuguotoji rūgštis yra gerokai silpnesnė už pirolą. Pirolas silpna rūgštis, bet stipresnė už sotų aminą.', 'The equilibrium lies on the side of the weaker acid: a base works if its conjugate acid is much weaker than pyrrole. Pyrrole is a weak acid, but stronger than a saturated amine.'),
            src: 'T p141, Klein'
          },
          {
            id: 'u16.basicity.8',
            q: [
              { p: t('Nikotiną apdorojus 1 ekv. $HCl$, gaunama kristalinė druska $C10H15N2Cl$; panaudojus 2 ekv. $HCl$, susidaro kitokia druska, $C10H16N2Cl2$.', 'Nicotine gives a crystalline salt of molecular formula $C10H15N2Cl$ with 1 equiv. of $HCl$. With 2 equiv. another salt, $C10H16N2Cl2$, forms.') },
              { mol: { smi: 'CN1CCCC1c1cccnc1', opts: { numbers: { 1: 'a', 10: 'b' } } } }
            ],
            steps: [
              {
                prompt: t('Kuris azotas (a ar b) protonuojamas pirmas? Bakstelėkite jį.', 'Which nitrogen (a or b) is protonated first? Tap it.'),
                kind: 'atoms', mol: { smi: 'CN1CCCC1c1cccnc1', opts: { numbers: { 1: 'a', 10: 'b' } } }, answer: [1],
                hint: t('Palyginkite azoto hibridizaciją ir poros aplinką.', 'Compare the hybridisation of the nitrogens and the surroundings of the pair.'),
                solution: t('Azotas a yra tretinis alifatinis aminas su laisva $sp^3^$ pora; azotas b yra piridino žiede.', 'Nitrogen a is a tertiary aliphatic amine with a free $sp^3^$ pair; nitrogen b is in the pyridine ring.')
              },
              {
                prompt: t('Kokia pirmosios druskos struktūra?', 'What is the structure of the first salt?'),
                kind: 'choice',
                options: [mo('C[NH+]1CCCC1c1cccnc1.[Cl-]'), mo('CN1CCCC1c1ccc[nH+]c1.[Cl-]'), mo('C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]')],
                answer: 0,
                hint: t('Pirmoji druska turi vieną $HCl$ ir vieną teigiamą krūvį.', 'The first salt contains one $HCl$ and one positive charge.'),
                solution: t('Protonuotas pirolidino azotas, chloridas kaip priešjonis: $C10H15N2Cl$.', 'The pyrrolidine nitrogen is protonated, chloride is the counter-ion: $C10H15N2Cl$.')
              },
              {
                prompt: t('Kokia druskos, gaunamos su 2 ekv. $HCl$, struktūra?', 'What is the structure of the salt obtained with 2 equiv. of $HCl$?'),
                kind: 'choice',
                options: [mo('C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]'), mo('C[NH+]1CCCC1c1cccnc1.[Cl-]'), mo('C[N+]1(C)CCCC1c1cccnc1.[Cl-]')],
                answer: 0,
                hint: t('Antrasis ekvivalentas protonuoja ir antrą azotą.', 'The second equivalent protonates the other nitrogen as well.'),
                solution: t('Abu azotai protonuoti: dvigubas katijonas su dviem chlorido jonais, $C10H16N2Cl2$.', 'Both nitrogens are protonated: a dication with two chloride ions, $C10H16N2Cl2$.')
              }
            ],
            why: t('Pirmą protoną gauna bazingesnis alifatinis azotas, antrąjį – piridino azotas. Su abiem ekvivalentais susidaro dichloridas.', 'The more basic aliphatic nitrogen takes the first proton, and the pyridine nitrogen the second. With both equivalents the dichloride forms.'),
            src: 'S7.13',
            claims: [
              { formula: ['C[NH+]1CCCC1c1cccnc1.[Cl-]', 'C10H15N2Cl'] },
              { formula: ['C[NH+]1CCCC1c1ccc[nH+]c1.[Cl-].[Cl-]', 'C10H16N2Cl2'] }
            ]
          },
          {
            id: 'u16.basicity.9',
            q: [
              { p: t('Palyginkite piridiną ir 4-(dimetilamino)piridiną.', 'Compare pyridine and 4-(dimethylamino)pyridine.') },
              { mol: [{ smi: PYRIDINE }, { smi: 'CN(C)c1ccncc1' }] }
            ],
            steps: [
              {
                prompt: t('Kuris yra stipresnė bazė?', 'Which is the stronger base?'),
                kind: 'choice', options: [tx('4-(dimetilamino)piridinas', '4-(dimethylamino)pyridine'), tx('piridinas', 'pyridine'), tx('vienodai', 'equal')], answer: 0,
                hint: t('Ką padaro aminogrupės pora, kai žiedo azotas prijungia protoną?', 'What does the pair of the amino group do when the ring nitrogen takes a proton?'),
                solution: t('Aminogrupė stabilizuoja katijoną, nes jos laisvoji pora gali pereiti į žiedą (+M). 4-dimetilaminopiridino konjuguotosios rūgšties pKa ≈ 9,6, piridino – 5,2.', 'The amino group stabilises the cation, because its lone pair can move into the ring (+M). The conjugate acid pKa of 4-dimethylaminopyridine is about 9.6, that of pyridine 5.2.')
              },
              {
                prompt: t('Kuris azotas 4-(dimetilamino)piridine protonuojamas?', 'Which nitrogen of 4-(dimethylamino)pyridine is protonated?'),
                kind: 'atoms', mol: { smi: 'CN(C)c1ccncc1', opts: { numbers: 'all' } }, answer: [6],
                hint: t('Aminogrupės pora jau konjuguota su žiedu.', 'The pair of the amino group is already conjugated with the ring.'),
                solution: t('Protonuojamas žiedo azotas (atomas Nr. 7): kationo krūvį dalija žiedo azotas ir aminogrupė.', 'The ring nitrogen (atom no. 7) is protonated: the charge of the cation is shared by the ring nitrogen and the amino group.')
              }
            ],
            why: t('Elektronus teikiantis pakaitas ($+M$) 4 padėtyje didina žiedo azoto bazingumą, nes katijonas turi papildomą rezonansinę formulę. Aminogrupės azotas lieka nebaziniu, nes jo pora dalyvauja konjugacijoje.', 'An electron-donating substituent ($+M$) at position 4 increases the basicity of the ring nitrogen, because the cation gains an extra resonance structure. The amino nitrogen stays non-basic, because its pair takes part in the conjugation.'),
            src: 'Klein'
          }
        ]
      },
      {
        id: 'u16.pyridine',
        title: t('Piridinas: SEAr, nukleofilai ir hidrido jonas', 'Pyridine: SEAr, nucleophiles and the hydride ion'),
        mirrors: ['S7.15'],
        bank: [
          {
            id: 'u16.pyridine.1',
            q: [{ p: t('Palyginkite tris aromatinius junginius reakcijoje su elektrofilu (pvz., nitrinant).', 'Compare three aromatic compounds in a reaction with an electrophile (for example nitration).') }, { mol: [{ smi: PYRROLE }, { smi: 'c1ccccc1' }, { smi: PYRIDINE }] }],
            steps: [
              {
                prompt: t('Išdėstykite nuo aktyviausio iki mažiausiai aktyvaus SEAr atžvilgiu.', 'Put them in order from the most reactive to the least reactive towards SEAr.'),
                kind: 'order', options: [tx('pirolas', 'pyrrole'), tx('benzenas', 'benzene'), tx('piridinas', 'pyridine')],
                hint: t('Palyginkite, kiek elektronų tenka vienam žiedo atomui.', 'Compare how many electrons there are per ring atom.'),
                solution: t('Pirolas (6 elektronai 5 atomams) > benzenas (6 elektronai 6 atomams) > piridinas (elektronų tankis pasislinkęs prie $N$).', 'Pyrrole (6 electrons on 5 atoms) > benzene (6 electrons on 6 atoms) > pyridine (the electron density is pulled towards $N$).')
              },
              {
                prompt: t('Kodėl piridinas už benzeną mažiau aktyvus?', 'Why is pyridine less reactive than benzene?'),
                kind: 'choice',
                options: [
                  tx('Elektroneigiamas azotas atitraukia elektronų tankį, o rūgštyje jis dar ir protonuojamas.', 'The electronegative nitrogen withdraws electron density, and in acid it is also protonated.'),
                  tx('Piridinas nėra aromatinis.', 'Pyridine is not aromatic.'),
                  tx('Azoto laisvoji pora padidina elektronų tankį žiede.', 'The nitrogen lone pair increases the electron density in the ring.'),
                  tx('Piridino žiede yra daugiau $π$ elektronų nei benzeno.', 'The pyridine ring has more $π$ electrons than benzene.')
                ],
                answer: 0,
                hint: t('Prisiminkite, kurioje orbitalėje yra piridino azoto laisvoji pora ir ką daro elektroneigiamas atomas žiede.', 'Recall which orbital holds the pyridine nitrogen pair and what an electronegative atom does in a ring.'),
                solution: t('Azoto pora žiedo plokštumoje $π$ sistemos nepapildo. Azotas atitraukia elektronus, o piridinio katijonas elektrofilą atstumia dar labiau.', 'The nitrogen pair in the ring plane does not add to the $π$ system. Nitrogen withdraws electrons, and the pyridinium cation repels the electrophile even more.')
              }
            ],
            why: t('Pirolas yra elektronų perteklinis, piridinas – elektronų deficitinis. Todėl SEAr eilė: pirolas > benzenas > piridinas.', 'Pyrrole is electron-rich and pyridine electron-poor. So the SEAr order is pyrrole > benzene > pyridine.'),
            src: 'T p141, p143'
          },
          {
            id: 'u16.pyridine.2',
            q: [{ p: t('Piridinas kaitinamas su $KNO3$ ir $H2SO4$ virš 300 °C.', 'Pyridine is heated with $KNO3$ and $H2SO4$ above 300 °C.') }, { scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('KNO3, H2SO4, > 300 °C') }] } }],
            steps: [
              {
                prompt: t('Bakstelėkite žiedo anglį, į kurią patenka $NO2$.', 'Tap the ring carbon that receives $NO2$.'),
                kind: 'atoms', mol: { smi: PYRIDINE, opts: { numbers: 'all' } }, answer: [2],
                hint: t('Atsiminkite, kurios padėtys turi dalinį teigiamą krūvį ir kur elektronų tankis šiek tiek didesnis.', 'Remember which positions carry a partial positive charge and where the electron density is somewhat higher.'),
                solution: t('$C-3$ (atomas Nr. 3): $C-2$ ir $C-4$ turi $δ+$.', '$C-3$ (atom no. 3): $C-2$ and $C-4$ carry $δ+$.')
              },
              {
                prompt: t('Koks yra produktas?', 'What is the product?'),
                kind: 'choice',
                options: [mo('[O-][N+](=O)c1cccnc1'), mo('[O-][N+](=O)c1ccccn1'), mo('[O-][N+](=O)c1ccncc1')],
                answer: 0,
                hint: t('Pakaitas patenka į padėtį, kur elektronų tankis didesnis.', 'The substituent goes to the position of higher electron density.'),
                solution: [{ p: t('Gaunamas 3-nitropiridinas (išeiga tik 5–15 %).', '3-Nitropyridine is obtained (in only 5–15 % yield).') }, { mol: { smi: '[O-][N+](=O)c1cccnc1' } }]
              }
            ],
            why: t('Piridino SEAr vyksta labai sunkiai ir duoda 3-pakeistą produktą, kuriame elektrofilas išvengia padėčių su $δ+$ ($C-2$, $C-4$).', 'SEAr of pyridine is very difficult and gives the 3-substituted product, in which the electrophile avoids the positions with $δ+$ ($C-2$, $C-4$).'),
            src: 'T p144',
            claims: [{ formula: ['[O-][N+](=O)c1cccnc1', 'C5H4N2O2'] }]
          },
          {
            id: 'u16.pyridine.3',
            q: [{ p: t('Elektrofilas atakuoja piridiną ir sudaro tarpinį katijoną.', 'An electrophile attacks pyridine and forms an intermediate cation.') }],
            steps: [{
              prompt: t('Kodėl pakaitas patenka į $C-3$, o ne į $C-2$ ar $C-4$?', 'Why does the substituent enter $C-3$ and not $C-2$ or $C-4$?'),
              kind: 'choice',
              options: [
                tx('Atakuojant $C-2$ ar $C-4$, viena rezonansinė formulė turi teigiamą krūvį ant azoto su šešiais elektronais – labai nepalanku; ties $C-3$ krūvis lieka ant anglies.', 'For attack at $C-2$ or $C-4$ one resonance structure puts the positive charge on a nitrogen with six electrons, which is very unfavourable; at $C-3$ the charge stays on carbon.'),
                tx('Tik $C-3$ turi vandenilį.', 'Only $C-3$ carries a hydrogen.'),
                tx('Azoto laisvoji pora blokuoja $C-2$ ir $C-4$ erdviškai.', 'The nitrogen lone pair blocks $C-2$ and $C-4$ sterically.'),
                tx('Ataka ties $C-3$ duoda daugiau rezonansinių formulių nei ties $C-2$.', 'Attack at $C-3$ gives more resonance structures than attack at $C-2$.')
              ],
              answer: 0,
              hint: t('Nupieškite katijono rezonansines formules ir pažiūrėkite, ar kuri nors uždeda krūvį ant azoto.', 'Draw the resonance structures of the cation and check whether any puts the charge on nitrogen.'),
              solution: t('Visais atvejais katijonas turi tris rezonansines formules, bet ties $C-2$ ir $C-4$ viena iš jų turi elektronų deficitinį azotą (sekstetas). Ties $C-3$ tokios formulės nėra.', 'In every case the cation has three resonance structures, but for $C-2$ and $C-4$ one of them has an electron-deficient nitrogen (a sextet). For $C-3$ there is no such structure.')
            }],
            why: t('Orientaciją lemia tarpinio katijono stabilumas. Katijonas, kurio krūvis ant elektroneigiamo azoto su sekstetu, nestabilus; todėl piridinas pakeičiamas $C-3$.', 'The orientation is set by the stability of the intermediate cation. A cation with its charge on an electronegative nitrogen with a sextet is unstable; so pyridine is substituted at $C-3$.'),
            src: 'T p143-144, Klein'
          },
          {
            id: 'u16.pyridine.4',
            q: [{ p: t('Piridinas kaitinamas su koncentruota $H2SO4$.', 'Pyridine is heated with concentrated $H2SO4$.') }, { scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('H2SO4 (konc.), t°') }] } }],
            steps: [{
              prompt: t('Kuris yra sulfoninimo produktas?', 'Which is the sulfonation product?'),
              kind: 'choice',
              options: [mo('OS(=O)(=O)c1cccnc1'), mo('OS(=O)(=O)c1ccccn1'), mo('OS(=O)(=O)c1ccncc1'), mo('[O-]S(=O)(=O)[n+]1ccccc1')],
              answer: 0,
              hint: t('Ar sulfoninimo produktas turi turėti ryšį su azotu, ar su žiedo anglimi? Kurią žiedo padėtį pasirenka SEAr piridine?', 'Should the sulfonation product have a bond to nitrogen or to a ring carbon? Which ring position does SEAr choose in pyridine?'),
              solution: [{ p: t('SEAr vyksta ties $C-3$ ir sieros rūgšties ryšys su anglimi tvirtas: pyridin-3-sulfonrūgštis.', 'SEAr takes place at $C-3$ and gives a stable carbon–sulfur bond: pyridine-3-sulfonic acid.') }, { mol: { smi: 'OS(=O)(=O)c1cccnc1' } }]
            }],
            why: t('Kaip ir nitrinimas, sulfoninimas piridine vyksta tik griežtomis sąlygomis ir duoda 3-pakeistą produktą. Šiuo atveju elektrofilas atakuoja anglį, ne azotą, nes $N-SO3$ adduktas grįžtamas.', 'Like nitration, sulfonation of pyridine takes place only under harsh conditions and gives the 3-substituted product. The electrophile ends up on carbon, not nitrogen, because the $N-SO3$ adduct is reversible.'),
            src: 'T p143-144, S7.15',
            claims: [{ formula: ['OS(=O)(=O)c1cccnc1', 'C5H5NO3S'] }, { formula: ['[O-]S(=O)(=O)[n+]1ccccc1', 'C5H5NO3S'] }]
          },
          {
            id: 'u16.pyridine.5',
            q: [{ p: t('Piridinas SEAr reakcijose reaguoja labai sunkiai.', 'Pyridine reacts very reluctantly in SEAr.') }],
            steps: [{
              prompt: t('Pažymėkite visas teisingas priežastis.', 'Pick every correct reason.'),
              kind: 'multi',
              options: [
                tx('Elektroneigiamas azotas atitraukia elektronų tankį iš žiedo.', 'The electronegative nitrogen withdraws electron density from the ring.'),
                tx('Rūgščioje terpėje azotas protonuojamas ir susidaro piridinio katijonas.', 'In acid the nitrogen is protonated to give the pyridinium cation.'),
                tx('Azoto laisvoji pora yra aromatiniame sekstete.', 'The nitrogen lone pair is in the aromatic sextet.'),
                tx('Žiedo anglys, ypač $C-2$ ir $C-4$, turi dalinį teigiamą krūvį.', 'The ring carbons, especially $C-2$ and $C-4$, carry a partial positive charge.'),
                tx('Piridino žiede yra daugiau elektronų nei benzeno.', 'The pyridine ring has more electrons than benzene.')
              ],
              answer: [0, 1, 3],
              hint: t('Atskirkite, ar piridino azoto pora yra sekstete, ar žiedo plokštumoje.', 'Decide whether the pyridine nitrogen pair is in the sextet or in the ring plane.'),
              solution: t('Teisingos priežastys: elektroneigiamas azotas traukia elektronus, rūgštyje susidaro piridinio katijonas, o žiedo anglys (ypač C-2 ir C-4) turi dalinį teigiamą krūvį. Piridino azoto pora yra ne sekstete, o žiedo plokštumoje, ir elektronų skaičius toks pat kaip benzeno (6).', 'The correct reasons are the electron withdrawal by the electronegative nitrogen, the pyridinium cation formed in acid, and the partial positive charge on the ring carbons (especially C-2 and C-4). The pyridine nitrogen pair is not in the sextet but in the ring plane, and the electron count equals that of benzene (6).')
            }],
            why: t('Piridinas yra elektronų deficitinis dėl elektroneigiamo azoto ir dažnai protonuojamas reakcijos terpėje. Todėl jam reikia daug griežtesnių sąlygų nei benzenui.', 'Pyridine is electron-poor because of the electronegative nitrogen and is often protonated in the reaction medium. It therefore needs much harsher conditions than benzene.'),
            src: 'T p143-144'
          },
          {
            id: 'u16.pyridine.6',
            q: [
              { p: t('$N$-metilpiridinio katijonas reaguoja su hidrido jonu ($H-$).', 'The $N$-methylpyridinium cation reacts with a hydride ion ($H-$).') },
              { mol: { smi: '[n+]1(C)ccccc1', opts: { numbers: { 0: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' } } } }
            ],
            steps: [
              {
                prompt: t('Bakstelėkite anglį, prie kurios prisijungia hidridas (pagal vadovėlį).', 'Tap the carbon at which the hydride adds (as in the course book).'),
                kind: 'atoms', mol: { smi: '[n+]1(C)ccccc1', opts: { numbers: { 0: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' } } }, answer: [4],
                hint: t('Hidridas yra nukleofilas: kuriose žiedo padėtyse elektronų deficitas didžiausias?', 'Hydride is a nucleophile: at which ring positions is the electron deficiency greatest?'),
                solution: t('Hidridas jungiasi prie $C-4$ (žiedo numeracija; atomas Nr. 4 brėžinyje): susidaro 1,4-dihidropiridinas.', 'Hydride bonds to $C-4$ (ring numbering; label 4 in the drawing): a 1,4-dihydropyridine forms.')
              },
              {
                prompt: t('Koks yra produktas?', 'What is the product?'),
                kind: 'choice',
                options: [mo('CN1C=CCC=C1'), mo('CN1CC=CC=C1'), mo('CN1CC=CCC1')],
                answer: 0,
                hint: t('Hidridas prisijungia vienoje padėtyje; žiedas praranda aromatiškumą, bet kiti du dvigubieji ryšiai lieka.', 'Hydride adds at one position; the ring loses its aromaticity but two double bonds remain.'),
                solution: [{ p: t('Produktas – $N$-metil-1,4-dihidropiridinas: $sp^3^$ anglis yra $C-4$, du dvigubieji ryšiai $C-2=C-3$ ir $C-5=C-6$.', '$N$-Methyl-1,4-dihydropyridine forms: the $sp^3^$ carbon is $C-4$, and the two double bonds are $C-2=C-3$ and $C-5=C-6$.') }, { mol: { smi: 'CN1C=CCC=C1' } }]
              }
            ],
            why: t('Kvartarinės druskos žiedas turi dar mažiau elektronų tankio, todėl nukleofilas lengvai atakuoja $C-4$ (ir $C-2$). Produkte aromatiškumas suardytas.', 'In the quaternary salt the ring has even less electron density, so a nucleophile easily attacks $C-4$ (and $C-2$). The product has lost its aromaticity.'),
            src: 'T p144',
            claims: [{ formula: ['CN1C=CCC=C1', 'C6H9N'] }, { formula: ['[n+]1(C)ccccc1', 'C6H8N+'] }]
          },
          {
            id: 'u16.pyridine.7',
            q: [{ p: t('Kofermentai $NAD+$ ir $NADH$ turi nikotinamido fragmentą su piridinio žiedu.', 'The coenzymes $NAD+$ and $NADH$ have a nicotinamide part with a pyridinium ring.') }],
            steps: [
              {
                prompt: t('Kuri forma yra oksiduotoji, kuri redukuotoji?', 'Which form is the oxidised one and which the reduced one?'),
                kind: 'choice',
                options: [
                  tx('$NAD+$ – oksiduotoji (aromatinė), $NADH$ – redukuotoji (dihidropiridinas).', '$NAD+$ is the oxidised form (aromatic), $NADH$ the reduced one (dihydropyridine).'),
                  tx('$NAD+$ – redukuotoji, $NADH$ – oksiduotoji.', '$NAD+$ is the reduced form, $NADH$ the oxidised one.'),
                  tx('Abi formos yra oksiduotos.', 'Both forms are oxidised.')
                ],
                answer: 0,
                hint: t('Kuri forma yra prijungusi hidrido joną?', 'Which form has accepted a hydride ion?'),
                solution: t('$NAD+$ prijungia $H-$ ir virsta $NADH$: prijungus elektronus, tai redukcija.', '$NAD+$ accepts $H-$ and becomes $NADH$: gaining electrons is a reduction.')
              },
              {
                prompt: t('Kodėl dihidropiridinas lengvai oksiduojasi atgal?', 'Why is the dihydropyridine readily oxidised back?'),
                kind: 'choice',
                options: [
                  tx('Jame suardytas aromatiškumas, todėl oksidavimasis atstato stabilesnę aromatinę sistemą.', 'Its aromaticity is lost, so oxidation restores the more stable aromatic system.'),
                  tx('Jis turi daugiau vandenilių nei bet kuris kitas junginys.', 'It has more hydrogens than any other compound.'),
                  tx('Jo azotas neturi laisvosios poros.', 'Its nitrogen has no lone pair.'),
                  tx('Jis yra stiprus oksidatorius.', 'It is a strong oxidising agent.')
                ],
                answer: 0,
                hint: t('Palyginkite dihidropiridiną ir piridinio katijoną aromatiškumo požiūriu.', 'Compare the dihydropyridine and the pyridinium cation from the point of view of aromaticity.'),
                solution: t('Dihidropiridinas nearomatinis, todėl linkęs atiduoti $H-$ ir atgauti aromatinę sistemą: tai redukuojanti $NADH$ savybė.', 'The dihydropyridine is not aromatic, so it tends to give away $H-$ and regain the aromatic system: that is the reducing property of $NADH$.')
              }
            ],
            why: t('Kofermentų veikimas pagrįstas grįžtamu hidrido prijungimu prie piridinio jono ir jo atidavimu. Varomoji jėga – aromatiškumo atsistatymas.', 'The action of the coenzymes is based on reversible addition and release of a hydride ion by the pyridinium ion. The driving force is the restoration of aromaticity.'),
            src: 'T p144'
          },
          {
            id: 'u16.pyridine.8',
            q: [{ p: t('Palyginkite, kaip lengvai nukleofilas atakuoja tris žiedus.', 'Compare how easily a nucleophile attacks three rings.') }, { mol: [{ smi: 'c1ccccc1' }, { smi: PYRIDINE }, { smi: 'C[n+]1ccccc1' }] }],
            steps: [{
              prompt: t('Išdėstykite nuo lengviausiai iki sunkiausiai atakuojamo nukleofilo.', 'Put them in order from the most easily to the least easily attacked by a nucleophile.'),
              kind: 'order', options: [tx('$N$-metilpiridinio katijonas', '$N$-methylpyridinium cation'), tx('piridinas', 'pyridine'), tx('benzenas', 'benzene')],
              hint: t('Kuo mažiau elektronų tankio žiede, tuo lengviau jį atakuoja nukleofilas.', 'The less electron density in the ring, the more easily a nucleophile attacks it.'),
              solution: t('Katijonas (teigiamas krūvis ant $N$) > piridinas ($δ+$ ant $C-2$, $C-4$) > benzenas (elektronų turtingas).', 'The cation (positive charge on $N$) > pyridine ($δ+$ on $C-2$, $C-4$) > benzene (electron-rich).')
            }],
            why: t('Su nukleofilais reaktyvumo eilė priešinga SEAr eilei: ją lemia elektronų deficitas. Kvartarinė druska – labiausiai deficitinė.', 'With nucleophiles the reactivity order is the reverse of the SEAr order: it is set by electron deficiency. The quaternary salt is the most electron-poor.'),
            src: 'T p143-144'
          },
          {
            id: 'u16.pyridine.9',
            q: [{ p: t('Piridino žiedo elektronų tankis pasiskirstęs nevienodai.', 'The electron density in the pyridine ring is not uniform.') }],
            steps: [
              {
                prompt: t('Bakstelėkite anglis, turinčias dalinį teigiamą krūvį ($δ+$).', 'Tap the carbons that carry a partial positive charge ($δ+$).'),
                kind: 'atoms', mol: { smi: PYRIDINE, opts: { numbers: 'all' } }, answer: [1, 3, 5],
                hint: t('Elektroneigiamas azotas labiausiai paveikia gretimas ir priešingą padėtis.', 'The electronegative nitrogen mostly affects the neighbouring and the opposite positions.'),
                solution: t('$δ+$ turi $C-2$, $C-4$ ir $C-6$ (atomai Nr. 2, 4 ir 6): per $-M$ ir $-I$ poveikį.', '$C-2$, $C-4$ and $C-6$ (atoms no. 2, 4 and 6) carry $δ+$: through the $-M$ and $-I$ effects.')
              },
              {
                prompt: t('Bakstelėkite anglis, kuriose elektronų tankis didesnis ir kuriose vyksta SEAr.', 'Tap the carbons with the higher electron density, where SEAr takes place.'),
                kind: 'atoms', mol: { smi: PYRIDINE, opts: { numbers: 'all' } }, answer: [2, 4],
                hint: t('Tai likusios padėtys.', 'These are the remaining positions.'),
                solution: t('$C-3$ ir $C-5$ (atomai Nr. 3 ir 5) yra ekvivalentiškos, joms atitenka elektrofilas.', '$C-3$ and $C-5$ (atoms no. 3 and 5) are equivalent, and the electrophile goes there.')
              }
            ],
            why: t('Dalinis teigiamas krūvis ant $C-2$, $C-4$ (ir $C-6$) padaro šias vietas nukleofilų taikiniais ir „išstumia“ elektrofilus į $C-3$.', 'A partial positive charge on $C-2$, $C-4$ (and $C-6$) makes these positions targets for nucleophiles and "pushes" electrophiles to $C-3$.'),
            src: 'T p143-144'
          }
        ]
      },
      {
        id: 'u16.nuc',
        title: t('Pirolo ir piridino reakcijos: kas reaguoja, azotas ar anglis?', 'Reactions of pyrrole and pyridine: nitrogen or carbon?'),
        mirrors: ['S7.14', 'S7.15'],
        bank: [
          {
            id: 'u16.nuc.1',
            q: [
              { p: t('Su acetanhidridu pirolas ir piridinas elgiasi skirtingai: vienas reaguoja per žiedo anglį, kitas per azotą.', 'Pyrrole and pyridine behave differently towards acetic anhydride: one reacts through a ring carbon, the other through nitrogen.') },
              { mol: [{ smi: PYRROLE }, { smi: PYRIDINE }] }
            ],
            steps: [
              {
                prompt: t('Kuris produktas susidaro iš pirolo?', 'Which product forms from pyrrole?'),
                kind: 'choice', options: [mo('CC(=O)c1ccc[nH]1'), mo('CC(=O)n1cccc1'), mo('CC(=O)c1cc[nH]c1')], answer: 0,
                hint: t('Ar pirolo azoto pora gali užpulti acilo anglį?', 'Can the pyrrole nitrogen pair attack the acyl carbon?'),
                solution: [{ p: t('Azoto pora sekstete, todėl reaguoja žiedas: SEAr ties $C-2$.', 'The nitrogen pair is in the sextet, so the ring reacts: SEAr at $C-2$.') }, { mol: { smi: 'CC(=O)c1ccc[nH]1' } }]
              },
              {
                prompt: t('Kuris produktas susidaro iš piridino?', 'Which product forms from pyridine?'),
                kind: 'choice', options: [mo('CC(=O)[n+]1ccccc1.CC(=O)[O-]'), mo('CC(=O)c1cccnc1.CC(=O)O'), mo('CC(=O)c1ccncc1.CC(=O)O')], answer: 0,
                hint: t('Piridino azoto pora laisva, o žiedas elektronų deficitinis.', 'The pyridine nitrogen pair is free and the ring is electron-poor.'),
                solution: [{ p: t('Azotas yra nukleofilas: $N$-acetilpiridinio acetatas.', 'Nitrogen is the nucleophile: $N$-acetylpyridinium acetate.') }, { mol: { smi: 'CC(=O)[n+]1ccccc1.CC(=O)[O-]' } }]
              }
            ],
            why: t('Du heterociklai elgiasi priešingai: pirolas yra elektronų perteklinis (reaguoja anglis), piridinas turi laisvą azoto porą (reaguoja azotas).', 'The two heterocycles behave oppositely: pyrrole is electron-rich (carbon reacts), pyridine has a free nitrogen pair (nitrogen reacts).'),
            src: 'S7.14, T p142, p144',
            claims: [{ formula: ['CC(=O)c1ccc[nH]1', 'C6H7NO'] }, { formula: ['CC(=O)[n+]1ccccc1.CC(=O)[O-]', 'C9H11NO3'] }, { formula: ['CC(=O)c1cccnc1.CC(=O)O', 'C9H11NO3'] }]
          },
          {
            id: 'u16.nuc.2',
            q: [{ p: t('Pirolas reaguoja su acetilchloridu.', 'Pyrrole reacts with acetyl chloride.') }, { scheme: { items: [{ smi: PYRROLE }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→' }] } }],
            steps: [{
              prompt: t('Koks yra produktas?', 'What is the product?'),
              kind: 'choice', options: [mo('CC(=O)c1ccc[nH]1'), mo('CC(=O)n1cccc1'), mo('CC(=O)c1cc[nH]c1')], answer: 0,
              hint: t('Pirolo reakcijų su elektrofilais vieta – ne azotas.', 'The place of pyrrole reactions with electrophiles is not nitrogen.'),
              solution: [{ p: t('Acilo grupė patenka ties $C-2$ (SEAr); azotas lieka su $N-H$.', 'The acyl group enters at $C-2$ (SEAr); nitrogen keeps its $N-H$.') }, { mol: { smi: 'CC(=O)c1ccc[nH]1', name: t('1-(1H-pirol-2-il)etanonas', '1-(1H-pyrrol-2-yl)ethanone') } }]
            }],
            why: t('Pirolo azoto pora sekstete, todėl nukleofilu elgiasi žiedas, o ne azotas. Acilas patenka į $C-2$, kur katijonas stabiliausias.', 'The pyrrole nitrogen pair is in the sextet, so the ring and not the nitrogen acts as the nucleophile. The acyl group enters $C-2$, where the cation is most stable.'),
            src: 'S7.15, T p142'
          },
          {
            id: 'u16.nuc.3',
            q: [{ p: t('Piridinas reaguoja su jodmetanu.', 'Pyridine reacts with iodomethane.') }, { scheme: { items: [{ smi: PYRIDINE }, { plus: true }, { smi: 'CI' }, { arrow: '→' }] } }],
            steps: [
              {
                prompt: t('Koks yra produktas?', 'What is the product?'),
                kind: 'choice', options: [mo('C[n+]1ccccc1.[I-]'), mo('Cc1ccccn1.I'), mo('Cc1cccnc1.I')], answer: 0,
                hint: t('Ar piridinas čia veikia kaip nukleofilas, ar kaip aromatinis žiedas?', 'Does pyridine act here as a nucleophile or as an aromatic ring?'),
                solution: [{ p: t('Azotas atakuoja metilo anglį (SN2): $N$-metilpiridinio jodidas, ketvirtinė druska.', 'Nitrogen attacks the methyl carbon (SN2): $N$-methylpyridinium iodide, a quaternary salt.') }, { mol: { smi: 'C[n+]1ccccc1.[I-]', name: t('N-metilpiridinio jodidas', 'N-methylpyridinium iodide') } }]
              },
              {
                prompt: t('Kuriuo simboliu žymimas šios reakcijos mechanizmas?', 'Which symbol names the mechanism of this reaction?'),
                kind: 'choice', options: [tx('SN2', 'SN2'), tx('SEAr', 'SEAr'), tx('AE', 'AE'), tx('SR', 'SR')], answer: 0,
                hint: t('Nukleofilas pakeičia jodidą prie metilo anglies.', 'A nucleophile replaces iodide at a methyl carbon.'),
                solution: t('SN2: azoto pora atakuoja metilo anglį iš nugaros, jodidas pasišalina vienoje stadijoje.', 'SN2: the nitrogen pair attacks the methyl carbon from the back, and iodide leaves in a single step.')
              }
            ],
            why: t('Piridinas yra tretinio amino analogas: laisva azoto pora alkilinama metilo jodidu. Susidaro piridinio druska, dar labiau elektronų deficitinė už pačią bazę.', 'Pyridine is an analogue of a tertiary amine: the free nitrogen pair is alkylated by methyl iodide. The pyridinium salt that forms is even more electron-poor than the base itself.'),
            src: 'S7.15, T p144',
            claims: [{ formula: ['C[n+]1ccccc1.[I-]', 'C6H8IN'] }, { formula: ['Cc1ccccn1.I', 'C6H8IN'] }]
          },
          {
            id: 'u16.nuc.4',
            q: [
              { p: t('Kokie produktai gaunami, kai pirolas ir piridinas reaguoja su toliau nurodytais reagentais?', 'What products form when pyrrole and pyridine react with the reagents below?') }
            ],
            steps: [{
              prompt: t('Suporuokite kiekvieną reakciją su produktu.', 'Match each reaction with its product.'),
              kind: 'match',
              answer: {
                left: [
                  { scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('CH3COCl') }] } },
                  { scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('CH3COONO2') }] } },
                  { scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('CH3I') }] } },
                  { scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('H2SO4 (konc.), t°') }] } }
                ],
                right: [mo('CC(=O)c1ccc[nH]1'), mo('O=[N+]([O-])c1ccc[nH]1'), mo('C[n+]1ccccc1.[I-]'), mo('OS(=O)(=O)c1cccnc1')],
                pairs: [0, 1, 2, 3]
              },
              hint: t('Prieš kiekvieną reakciją paklauskite: ar elektrofilas jungiasi prie žiedo anglies, ar azotas veikia kaip nukleofilas?', 'Before each reaction ask: does the electrophile bond to a ring carbon, or does the nitrogen act as the nucleophile?'),
              solution: t('Pirolas reaguoja per $C-2$ (acilinimas, nitrinimas). Piridinas su alkilo halogenidu – per azotą (ketvirtinė druska), su koncentruota $H2SO4$ karštyje – per $C-3$ (sulfoninimas).', 'Pyrrole reacts at $C-2$ (acylation, nitration). Pyridine reacts through nitrogen with an alkyl halide (a quaternary salt), and at $C-3$ with hot concentrated $H2SO4$ (sulfonation).')
            }],
            why: t('Keturios reakcijos rodo du heterociklų elgesio modelius: elektronų perteklinis pirolas – SEAr ties $C-2$ su švelniais reagentais; piridinas – nukleofilas per azotą arba SEAr ties $C-3$ griežtomis sąlygomis.', 'The four reactions show the two behaviour patterns: electron-rich pyrrole undergoes SEAr at $C-2$ with mild reagents; pyridine is a nucleophile through nitrogen, or undergoes SEAr at $C-3$ under harsh conditions.'),
            src: 'S7.15, T p142-144',
            claims: [{ formula: ['O=[N+]([O-])c1ccc[nH]1', 'C4H4N2O2'] }]
          },
          {
            id: 'u16.nuc.5',
            q: [{ p: t('Keturios reakcijos.', 'Four reactions.') }],
            steps: [{
              prompt: t('Kuriose iš jų azotas veikia kaip nukleofilas?', 'In which of them does nitrogen act as a nucleophile?'),
              kind: 'multi',
              options: [
                { scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('CH3I') }] } },
                { scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('(CH3CO)2O') }] } },
                { scheme: { items: [{ smi: PYRIDINE }, { arrow: '→', above: f('CH3COCl') }] } },
                { scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('SO3, C5H5N') }] } }
              ],
              answer: [0, 2],
              hint: t('Pirolo azoto pora yra sekstete.', 'The pyrrole nitrogen pair is in the sextet.'),
              solution: t('Piridino azotas reaguoja su $CH3I$ (alkilinimas) ir su $CH3COCl$ (acilinimas). Pirolas abiem atvejais reaguoja ties anglimi (SEAr).', 'The pyridine nitrogen reacts with $CH3I$ (alkylation) and with $CH3COCl$ (acylation). Pyrrole reacts at carbon (SEAr) in both of its reactions.')
            }],
            why: t('Azotas gali būti nukleofilas tik tada, kai jo pora laisva: piridine taip, pirole – ne.', 'Nitrogen can be a nucleophile only if its pair is free: in pyridine yes, in pyrrole no.'),
            src: 'S7.14, S7.15'
          },
          {
            id: 'u16.nuc.6',
            q: [{ p: t('Pirolas sulfoninamas kompleksu $SO3$·piridinas, o ne koncentruota $H2SO4$.', 'Pyrrole is sulfonated with the $SO3$·pyridine complex, not with concentrated $H2SO4$.') }],
            steps: [{
              prompt: t('Kodėl tinka būtent šis švelnus reagentas?', 'Why is this mild reagent the right one?'),
              kind: 'choice',
              options: [
                tx('Pirolas elektronų perteklinis ir jautrus stipriai rūgščiai terpei, todėl reikia silpnesnio elektrofilo.', 'Pyrrole is electron-rich and sensitive to a strongly acidic medium, so a weaker electrophile is needed.'),
                tx('Piridinas yra katalizatorius, nes pirolui trūksta bazės.', 'Pyridine is a catalyst because pyrrole lacks a base.'),
                tx('Pirolas nesisulfonina jokiomis kitomis sąlygomis, nes jo žiedas elektronų deficitinis.', 'Pyrrole cannot be sulfonated under any other conditions because its ring is electron-poor.'),
                tx('Kompleksas duoda sulfonrūgštį ties azotu.', 'The complex gives the sulfonic acid at nitrogen.')
              ],
              answer: 0,
              hint: t('Ar elektronų perteklinis žiedas turi būti atakuojamas stipriausiu reagentu?', 'Does an electron-rich ring need the strongest reagent?'),
              solution: t('Dėl didelio elektronų tankio pirolas lengvai dalyvauja SEAr, o stipri rūgštis jį pažeistų (protonuotų ir suardytų). Todėl paimamas švelnus $SO3$ kompleksas; produktas – pirolo-2-sulfonrūgštis.', 'Thanks to its high electron density pyrrole readily takes part in SEAr, whereas a strong acid would damage it (protonation and decomposition). A mild $SO3$ complex is used; the product is pyrrole-2-sulfonic acid.')
            }],
            why: t('Reagento stiprumas turi atitikti substrato aktyvumą: pirolui – švelnūs elektrofilai (acetilnitratas, $SO3$·piridinas), piridinui – griežtos sąlygos.', 'The strength of the reagent should match the reactivity of the substrate: mild electrophiles (acetyl nitrate, $SO3$·pyridine) for pyrrole, harsh conditions for pyridine.'),
            src: 'T p142, Klein'
          },
          {
            id: 'u16.nuc.7',
            q: [{ p: t('Pirolas reaguoja su jodu ir pakeičiami visi keturi vandeniliai prie anglies.', 'Pyrrole reacts with iodine and all four hydrogens on carbon are replaced.') }, { scheme: { items: [{ smi: PYRROLE }, { arrow: '→', above: f('I2') }, { smi: 'Ic1[nH]c(I)c(I)c1I' }] } }],
            steps: [
              {
                prompt: t('Kokia produkto molekulinė formulė?', 'What is the molecular formula of the product?'),
                kind: 'formula', mol: { smi: 'Ic1[nH]c(I)c(I)c1I' }, answer: 'C4HI4N',
                hint: t('Iš pirolo ($C4H5N$) pakeičiami keturi anglies vandeniliai; $N-H$ lieka.', 'Four carbon hydrogens of pyrrole ($C4H5N$) are replaced; the $N-H$ stays.'),
                solution: t('$C4H5N$ netenka 4 H ir gauna 4 I: $C4HI4N$ (tetrajodpirolas, jodolas).', '$C4H5N$ loses 4 H and gains 4 I: $C4HI4N$ (tetraiodopyrrole, iodol).')
              },
              {
                prompt: t('Kodėl pirolui nereikia Lewiso rūgšties katalizatoriaus?', 'Why does pyrrole not need a Lewis acid catalyst?'),
                kind: 'choice',
                options: [
                  tx('Pirolas yra elektronų perteklinis ir pakankamai nukleofilus, kad pats atakuotų halogeną.', 'Pyrrole is electron-rich and nucleophilic enough to attack the halogen itself.'),
                  tx('Jodas yra stipresnis elektrofilas už chlorą.', 'Iodine is a stronger electrophile than chlorine.'),
                  tx('Pirolo azotas aktyvuoja jodą.', 'The pyrrole nitrogen activates the iodine.'),
                  tx('Katalizatorius sunaikintų $N-H$ ryšį.', 'A catalyst would destroy the $N-H$ bond.')
                ],
                answer: 0,
                hint: t('Prisiminkite, kam benzenui reikia katalizatoriaus.', 'Recall why benzene needs a catalyst.'),
                solution: t('Benzenui katalizatorius padaro halogeną stipresniu elektrofilu. Pirolo žiedas toks aktyvus, kad to nereikia.', 'For benzene the catalyst makes the halogen a stronger electrophile. The pyrrole ring is so reactive that this is not needed.')
              }
            ],
            why: t('Elektronų perteklinis žiedas halogeninamas lengvai ir iki galo: pakeičiamos visos laisvos anglies padėtys.', 'An electron-rich ring is halogenated easily and completely: all free carbon positions are replaced.'),
            src: 'T p142',
            claims: [{ formula: ['Ic1[nH]c(I)c(I)c1I', 'C4HI4N'] }]
          },
          {
            id: 'u16.nuc.8',
            q: [{ p: t('Nikotinas reaguoja su 1 ekv. jodmetano.', 'Nicotine reacts with 1 equiv. of iodomethane.') }, { mol: { smi: 'CN1CCCC1c1cccnc1', opts: { numbers: { 1: 'a', 10: 'b' } } } }],
            steps: [
              {
                prompt: t('Kuris azotas (a ar b) alkilinamas? Bakstelėkite jį.', 'Which nitrogen (a or b) is alkylated? Tap it.'),
                kind: 'atoms', mol: { smi: 'CN1CCCC1c1cccnc1', opts: { numbers: { 1: 'a', 10: 'b' } } }, answer: [1],
                hint: t('Nukleofiliškiausias yra azotas su labiausiai prieinama ir praturtinta pora.', 'The most nucleophilic nitrogen is the one with the most available and electron-rich pair.'),
                solution: t('Azotas a (tretinis alifatinis aminas) yra nukleofiliškesnis už piridino azotą b.', 'Nitrogen a (a tertiary aliphatic amine) is more nucleophilic than the pyridine nitrogen b.')
              },
              {
                prompt: t('Koks yra produktas?', 'What is the product?'),
                kind: 'choice', options: [mo('C[N+]1(C)CCCC1c1cccnc1.[I-]'), mo('CN1CCCC1c1ccc[n+](C)c1.[I-]'), mo('CN1CCCC1c1cc(C)cnc1.I')], answer: 0,
                hint: t('Ketvirtinė druska susidaro ant nukleofiliškesnio azoto.', 'The quaternary salt forms on the more nucleophilic nitrogen.'),
                solution: t('Susidaro ketvirtinė amonio druska pirolidino žiede.', 'A quaternary ammonium salt forms in the pyrrolidine ring.')
              }
            ],
            why: t('Kaip ir protonuojant, alkilinimo vietą lemia azoto poros prieinamumas: sotus aminas nukleofiliškesnis už piridino azotą.', 'As in protonation, the site of alkylation is decided by the availability of the nitrogen pair: a saturated amine is more nucleophilic than the pyridine nitrogen.'),
            src: 'S7.13, T p144',
            claims: [{ formula: ['C[N+]1(C)CCCC1c1cccnc1.[I-]', 'C11H17IN2'] }, { formula: ['CN1CCCC1c1ccc[n+](C)c1.[I-]', 'C11H17IN2'] }]
          }
        ]
      },
      /* ============================================================ banks: nucleobases */
      {
        id: 'u16.nucleobase',
        title: t('Nukleorūgščių bazės: struktūros, formulės ir nukleozidai', 'Nucleic acid bases: structures, formulas and nucleosides'),
        mirrors: [],
        bank: [
          {
            id: 'u16.nucleobase.1',
            q: [{ p: t('Nukleorūgščių bazės pavaizduotos laktamo (adeninas – enamino) formomis.', 'The nucleic acid bases are drawn in their lactam forms (adenine: enamine form).') }],
            steps: [{
              prompt: t('Suporuokite struktūras su pavadinimais.', 'Match the structures with the names.'),
              kind: 'match',
              answer: {
                left: [mo(URACIL), mo(THYMINE), mo(CYTOSINE), mo(ADENINE), mo(GUANINE)],
                right: [tx('uracilas', 'uracil'), tx('timinas', 'thymine'), tx('citozinas', 'cytosine'), tx('adeninas', 'adenine'), tx('guaninas', 'guanine')],
                pairs: [0, 1, 2, 3, 4]
              },
              hint: t('Pirmiausia atskirkite vieno žiedo (pirimidino) ir dviejų žiedų (purino) bazes. Tada ieškokite metilo ir aminogrupių.', 'First tell the one-ring (pyrimidine) and two-ring (purine) bases apart. Then look for a methyl group and amino groups.'),
              solution: t('Pirimidinai: uracilas (du $C=O$), timinas (du $C=O$ ir $CH3$), citozinas ($C=O$ ir $NH2$). Purinai: adeninas ($NH2$), guaninas ($C=O$ ir $NH2$).', 'Pyrimidines: uracil (two $C=O$), thymine (two $C=O$ and $CH3$), cytosine ($C=O$ and $NH2$). Purines: adenine ($NH2$), guanine ($C=O$ and $NH2$).')
            }],
            why: t('Penkios pagrindinės bazės skiriasi pakaitais ant pirimidino ar purino pagrindo. Timinas yra 5-metiluracilas.', 'The five main bases differ by the substituents on a pyrimidine or purine core. Thymine is 5-methyluracil.'),
            src: 'T p145, p147, p149'
          },
          {
            id: 'u16.nucleobase.2',
            q: [{ p: t('Timinas skiriasi nuo uracilo vienu pakaitu.', 'Thymine differs from uracil by a single substituent.') }],
            steps: [
              {
                prompt: t('Bakstelėkite uracilo atomą, prie kurio timine prijungta metilo grupė.', 'Tap the atom of uracil to which the methyl group is attached in thymine.'),
                kind: 'atoms', mol: { smi: URACIL, opts: { numbers: URACIL_NUM } }, answer: [6],
                hint: t('Timinas yra 5-metiluracilas.', 'Thymine is 5-methyluracil.'),
                solution: t('Metilas yra ties $C-5$ (brėžinyje Nr. 5).', 'The methyl group is on $C-5$ (label 5 in the drawing).')
              },
              {
                prompt: t('Kurioje nukleorūgštyje yra timino?', 'Which nucleic acid contains thymine?'),
                kind: 'choice', options: [tx('DNR (RNR turi uracilą)', 'DNA (RNA has uracil instead)'), tx('RNR (DNR turi uracilą)', 'RNA (DNA has uracil instead)'), tx('abiejose', 'both')], answer: 0,
                hint: t('Prisiminkite, kuri bazė keičia timiną RNR.', 'Recall which base replaces thymine in RNA.'),
                solution: t('DNR turi A, T, G, C; RNR vietoj T turi U.', 'DNA has A, T, G, C; RNA has U in place of T.')
              }
            ],
            why: t('Timinas ir uracilas – tos pačios pirimidino bazės be ir su metilu ties $C-5$. DNR turi timiną, RNR – uracilą.', 'Thymine and uracil are the same pyrimidine base with and without a methyl group at $C-5$. DNA has thymine, RNA has uracil.'),
            src: 'T p148-149',
            claims: [{ formula: [URACIL, 'C4H4N2O2'] }, { formula: [THYMINE, 'C5H6N2O2'] }]
          },
          {
            id: 'u16.nucleobase.3',
            q: [{ p: t('Penkios bazės.', 'Five bases.') }, { mol: [{ smi: ADENINE }, { smi: URACIL }, { smi: GUANINE }, { smi: CYTOSINE }, { smi: THYMINE }] }],
            steps: [{
              prompt: t('Kurios iš jų yra purino bazės?', 'Which of them are purine bases?'),
              kind: 'multi',
              options: [mo(ADENINE), mo(URACIL), mo(GUANINE), mo(CYTOSINE), mo(THYMINE)],
              answer: [0, 2],
              hint: t('Purinas yra pirimidino ir imidazolo žiedų kondensatas.', 'Purine is a pyrimidine ring fused with an imidazole ring.'),
              solution: t('Purinai turi du kondensuotus žiedus: adeninas ir guaninas. Uracilas, citozinas ir timinas turi tik vieną (pirimidino) žiedą.', 'Purines have two fused rings: adenine and guanine. Uracil, cytosine and thymine have only one (pyrimidine) ring.')
            }],
            why: t('Dvi purino bazės (A, G) ir trys pirimidino (C, T, U) sudaro nukleorūgščių abėcėlę.', 'Two purine bases (A, G) and three pyrimidine bases (C, T, U) make up the alphabet of nucleic acids.'),
            src: 'T p147, p148'
          },
          {
            id: 'u16.nucleobase.4',
            q: [{ p: t('Bazė su cukrumi sudaro $N$-glikozidą (nukleozidą): ribozės ar deoksiribozės $C-1\'$ jungiasi su bazės azotu.', 'A base and a sugar form an $N$-glycoside (a nucleoside): the $C-1\'$ of ribose or deoxyribose bonds to a nitrogen of the base.') }],
            steps: [
              {
                prompt: t('Bakstelėkite citozino azotą, kuris jungiasi su cukrumi.', 'Tap the nitrogen of cytosine that bonds to the sugar.'),
                kind: 'atoms', mol: { smi: CYTOSINE, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'N4', 6: 'C5', 7: 'C6' } } }, answer: [0],
                hint: t('Pirimidino bazėse cukrus jungiasi su azotu, esančiu 1 padėtyje.', 'In pyrimidine bases the sugar bonds to the nitrogen at position 1.'),
                solution: t('Pirimidino bazės $N-1$ atomas (laktamo formos $N-H$).', 'The $N-1$ atom of the pyrimidine base (the $N-H$ of the lactam form).')
              },
              {
                prompt: t('Bakstelėkite adenino azotą, kuris jungiasi su cukrumi.', 'Tap the nitrogen of adenine that bonds to the sugar.'),
                kind: 'atoms', mol: { smi: ADENINE, opts: { numbers: { 0: 'N6', 1: 'C6', 2: 'N1', 3: 'C2', 4: 'N3', 5: 'C4', 6: 'N9', 7: 'C8', 8: 'N7', 9: 'C5' } } }, answer: [6],
                hint: t('Purino bazėse cukrus jungiasi su azotu, esančiu 9 padėtyje.', 'In purine bases the sugar bonds to the nitrogen at position 9.'),
                solution: t('Purino bazės $N-9$ atomas, kuris turi $N-H$ (pirolo tipo azotas).', 'The $N-9$ atom of the purine base, which carries the $N-H$ (a pyrrole-type nitrogen).')
              }
            ],
            why: t('Cukrus prisijungia prie $N-1$ (pirimidinai) arba $N-9$ (purinai); šie azotai turi $N-H$ ir poravime nedalyvauja.', 'The sugar bonds at $N-1$ (pyrimidines) or $N-9$ (purines); these nitrogens carry an $N-H$ and take no part in pairing.'),
            src: 'T p150'
          },
          {
            id: 'u16.nucleobase.5',
            q: [{ p: t('Parašykite bazių molekulines formules.', 'Write the molecular formulas of the bases.') }],
            steps: [
              {
                prompt: t('Timino formulė?', 'Formula of thymine?'),
                kind: 'formula', mol: { smi: THYMINE }, answer: 'C5H6N2O2',
                hint: t('Suskaičiuokite atomus brėžinyje; nepamirškite $N-H$ ir $CH3$ vandenilių.', 'Count the atoms in the drawing; do not forget the hydrogens of $N-H$ and $CH3$.'),
                solution: t('5 C, 6 H (2 × $N-H$, $CH3$, $C-H$), 2 N, 2 O: $C5H6N2O2$.', '5 C, 6 H (2 × $N-H$, $CH3$, $C-H$), 2 N, 2 O: $C5H6N2O2$.')
              },
              {
                prompt: t('Guanino formulė?', 'Formula of guanine?'),
                kind: 'formula', mol: { smi: GUANINE }, answer: 'C5H5N5O',
                hint: t('Pridėkite aminogrupės ir žiedo $N-H$ vandenilius.', 'Add the hydrogens of the amino group and of the ring $N-H$ groups.'),
                solution: t('5 C, 5 H, 5 N, 1 O: $C5H5N5O$.', '5 C, 5 H, 5 N, 1 O: $C5H5N5O$.')
              }
            ],
            why: t('Formulė nepriklauso nuo tautomerinės formos: laktamo ir laktimo tautomerai yra izomerai.', 'The formula does not depend on the tautomeric form: lactam and lactim tautomers are isomers.'),
            src: 'T p149',
            claims: [{ formula: [THYMINE, 'C5H6N2O2'] }, { formula: [GUANINE, 'C5H5N5O'] }, { formula: [CYTOSINE, 'C4H5N3O'] }, { formula: [ADENINE, 'C5H5N5'] }]
          },
          {
            id: 'u16.nucleobase.6',
            q: [{ p: t('Nukleozidų pavadinimai sudaromi iš bazės pavadinimo: pirimidino nukleozidams pridedama priesaga -idinas, purino – -ozinas.', 'Nucleoside names are formed from the name of the base: the suffix -idine is added for pyrimidine nucleosides, -osine for purine ones.') }],
            steps: [
              {
                prompt: t('Kaip vadinasi adenino ir ribozės nukleozidas?', 'What is the nucleoside of adenine and ribose called?'),
                kind: 'choice', options: [tx('adenozinas', 'adenosine'), tx('adenidinas', 'adenidine'), tx('deoksiadenozinas', 'deoxyadenosine'), tx('adeninozidas', 'adeninoside')], answer: 0,
                hint: t('Adeninas yra purino bazė; ribozė, ne deoksiribozė.', 'Adenine is a purine base; the sugar is ribose, not deoxyribose.'),
                solution: t('Purino bazė + ribozė → -ozinas: adenozinas (A).', 'Purine base + ribose gives the -osine ending: adenosine (A).')
              },
              {
                prompt: t('Kaip vadinasi citozino ir 2-deoksiribozės nukleozidas?', 'What is the nucleoside of cytosine and 2-deoxyribose called?'),
                kind: 'choice', options: [tx('deoksicitidinas', 'deoxycytidine'), tx('citidinas', 'cytidine'), tx('deoksicitozinas', 'deoxycytosine'), tx('deoksicitozidas', 'deoxycytoside')], answer: 0,
                hint: t('Citozinas – pirimidino bazė, o cukrus be deguonies ties $C-2\'$.', 'Cytosine is a pyrimidine base, and the sugar lacks oxygen at $C-2\'$.'),
                solution: t('Pirimidino bazė + deoksiribozė → deoksi- + -idinas: deoksicitidinas (dC).', 'Pyrimidine base + deoxyribose gives deoxy- + -idine: deoxycytidine (dC).')
              }
            ],
            why: t('Pavadinimą nusako bazės tipas (-idinas pirimidinui, -ozinas purinui) ir cukrus (priešdėlis deoksi- DNR nukleozidams).', 'The name reflects the type of base (-idine for pyrimidine, -osine for purine) and the sugar (the prefix deoxy- for DNA nucleosides).'),
            src: 'T p150'
          },
          {
            id: 'u16.nucleobase.7',
            q: [{ p: t('Penkios bazės pasiskirsto tarp DNR ir RNR.', 'The five bases are shared between DNA and RNA.') }],
            steps: [
              {
                prompt: t('Kurias bazes turi RNR?', 'Which bases does RNA contain?'),
                kind: 'multi',
                options: [tx('adeninas', 'adenine'), tx('timinas', 'thymine'), tx('uracilas', 'uracil'), tx('guaninas', 'guanine'), tx('citozinas', 'cytosine')],
                answer: [0, 2, 3, 4],
                hint: t('RNR neturi vienos DNR bazės, bet turi kitą.', 'RNA lacks one DNA base but has another one.'),
                solution: t('RNR: A, U, G, C (timino nėra, jį pakeičia uracilas).', 'RNA: A, U, G, C (there is no thymine; uracil replaces it).')
              },
              {
                prompt: t('Kurias bazes turi DNR?', 'Which bases does DNA contain?'),
                kind: 'multi',
                options: [tx('adeninas', 'adenine'), tx('timinas', 'thymine'), tx('uracilas', 'uracil'), tx('guaninas', 'guanine'), tx('citozinas', 'cytosine')],
                answer: [0, 1, 3, 4],
                hint: t('Palyginkite su ankstesniu atsakymu.', 'Compare with the previous answer.'),
                solution: t('DNR: A, T, G, C (uracilo nėra).', 'DNA: A, T, G, C (there is no uracil).')
              }
            ],
            why: t('Penkios bazės: trys bendros (A, G, C), timinas būdingas DNR, uracilas – RNR.', 'Five bases: three are common (A, G, C), thymine is typical of DNA and uracil of RNA.'),
            src: 'T p148'
          },
          {
            id: 'u16.nucleobase.8',
            q: [{ p: t('Organizme skylant nukleorūgštims, purinai oksiduojami iki šlapimo rūgšties.', 'When nucleic acids break down in the body, purines are oxidised to uric acid.') }, { mol: [{ smi: 'O=c1[nH]cnc2[nH]cnc12' }, { smi: 'O=c1[nH]c(=O)c2[nH]cnc2[nH]1' }, { smi: 'O=c1[nH]c(=O)c2[nH]c(=O)[nH]c2[nH]1' }] }],
            steps: [{
              prompt: t('Išdėstykite junginius pagal oksidacijos laipsnį: nuo mažiausiai iki labiausiai oksiduoto (daugiausia $C=O$ grupių).', 'Put the compounds in order of oxidation, from the least to the most oxidised (the most $C=O$ groups).'),
              kind: 'order',
              options: [tx('hipoksantinas (1 $C=O$)', 'hypoxanthine (1 $C=O$)'), tx('ksantinas (2 $C=O$)', 'xanthine (2 $C=O$)'), tx('šlapimo rūgštis (3 $C=O$)', 'uric acid (3 $C=O$)')],
              hint: t('Suskaičiuokite deguonies atomus brėžiniuose.', 'Count the oxygen atoms in the drawings.'),
              solution: t('Hipoksantinas → ksantinas → šlapimo rūgštis: kiekviename etape pridedama po vieną deguonį.', 'Hypoxanthine → xanthine → uric acid: one oxygen is added at each stage.')
            }],
            why: t('Šlapimo rūgštis yra galutinis purino darinių apykaitos produktas; ji išsiskiria su šlapimu urato druskų pavidalu.', 'Uric acid is the end product of the metabolism of purine derivatives; it is excreted in urine as urate salts.'),
            src: 'T p147'
          }
        ]
      },
      {
        id: 'u16.tautomer',
        title: t('Laktamo–laktimo tautomerija', 'Lactam–lactim tautomerism'),
        mirrors: ['S7.16'],
        bank: [
          {
            id: 'u16.tautomer.1',
            q: [{ p: t('Uracilas gali egzistuoti keturiomis tautomerinėmis formomis.', 'Uracil can exist in four tautomeric forms.') }, { mol: { smi: URACIL } }],
            steps: [
              {
                prompt: t('Kuri struktūra yra uracilo laktimo (dihidroksi) forma?', 'Which structure is the lactim (dihydroxy) form of uracil?'),
                kind: 'choice', options: [mo(URACIL_LACTIM), mo('N1=C(O)NC(=O)C=C1'), mo('N1C(=O)N=C(O)C=C1'), mo('N1C(=O)NC(=O)C=C1')], answer: 0,
                hint: t('Laktimo forma neturi $C=O$ grupių, o turi $C-OH$ ir $C=N$.', 'The lactim form has no $C=O$ groups, only $C-OH$ and $C=N$.'),
                solution: t('Abi karbonilo grupės virtusios hidroksilu: $N-C(OH)=N$ abiejose padėtyse. Dvi struktūros su vienu $C=O$ yra mišrios laktimo–laktamo formos, o struktūra su abiem $C=O$ – laktamo.', 'Both carbonyl groups have become hydroxyl: $N-C(OH)=N$ at both positions. The two structures with one $C=O$ are the mixed lactim–lactam forms, and the structure with both $C=O$ groups is the lactam.')
              },
              {
                prompt: t('Kuri forma yra nukleorūgščių sudėtyje?', 'Which form is found in nucleic acids?'),
                kind: 'choice', options: [tx('laktamo (dioksoforma)', 'lactam (dioxo form)'), tx('laktimo (dihidroksi)', 'lactim (dihydroxy)'), tx('mišri laktimo–laktamo', 'mixed lactim–lactam')], answer: 0,
                hint: t('Kuri forma turi amido tipo grupes?', 'Which form has amide-type groups?'),
                solution: t('Laktamo forma, stabilesnė dėl amido grupių konjugacijos. Laktimo forma yra labai maža pusiausvyros mišinio dalis.', 'The lactam form, more stable thanks to the conjugation of the amide groups. The lactim form is a very small part of the equilibrium mixture.')
              }
            ],
            why: t('Tautomerai yra izomerai, kurie greitai tarpusavyje virsta perkeliant vandenilį ir dvigubąjį ryšį. Uracilo atveju pusiausvyra labai pasislinkusi į laktamo formą.', 'Tautomers are isomers that interconvert quickly by moving a hydrogen and a double bond. For uracil the equilibrium lies far on the lactam side.'),
            src: 'T p148-149, S7.16',
            claims: [{ formula: [URACIL_LACTIM, 'C4H4N2O2'] }, { formula: ['N1=C(O)NC(=O)C=C1', 'C4H4N2O2'] }]
          },
          {
            id: 'u16.tautomer.2',
            q: [{ p: t('Laktamo forma virsta laktimo forma ties $C-4$ karbonilo grupe.', 'The lactam form turns into the lactim form at the $C-4$ carbonyl group.') }],
            steps: [{
              prompt: t('Bakstelėkite tris atomus, kurių ryšiai pasikeičia šioje tautomerizacijoje ($N-3$, $C-4$ ir karbonilo deguonis).', 'Tap the three atoms whose bonding changes in this tautomerisation ($N-3$, $C-4$ and the carbonyl oxygen).'),
              kind: 'atoms', mol: { smi: URACIL, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'O4', 6: 'C5', 7: 'C6' } } }, answer: [3, 4, 5],
              hint: t('Vandenilis pereina nuo azoto prie deguonies, o $C=O$ virsta $C-O$, o $C-N$ – $C=N$.', 'The hydrogen moves from nitrogen to oxygen, $C=O$ becomes $C-O$, and $C-N$ becomes $C=N$.'),
              solution: [{ p: t('$N-3-H$ netenka vandenilio, tarp $N-3$ ir $C-4$ atsiranda dvigubasis ryšys, o deguonis gauna vandenilį ir tampa $OH$.', '$N-3-H$ loses its hydrogen, a double bond appears between $N-3$ and $C-4$, and the oxygen gains the hydrogen and becomes $OH$.') },
                { scheme: { items: [{ smi: URACIL }, { arrow: '⇌' }, { smi: 'N1C(=O)N=C(O)C=C1' }] } }]
            }],
            why: t('Tautomerizacijoje nesikeičia nei formulė, nei anglies karkasas: vandenilis keičia vietą, o dvigubasis ryšys pasislenka.', 'In tautomerisation neither the formula nor the carbon skeleton changes: a hydrogen changes place and the double bond shifts.'),
            src: 'T p149, S7.16',
            claims: [{ formula: ['N1C(=O)N=C(O)C=C1', 'C4H4N2O2'] }]
          },
          {
            id: 'u16.tautomer.3',
            q: [{ p: t('Timino laktamo forma.', 'The lactam form of thymine.') }, { mol: { smi: THYMINE } }],
            steps: [{
              prompt: t('Kuri struktūra yra timino laktimo (dihidroksi) forma?', 'Which structure is the lactim (dihydroxy) form of thymine?'),
              kind: 'choice', options: [mo('N1=C(O)N=C(O)C(C)=C1'), mo('N1=C(O)NC(=O)C(C)=C1'), mo('N1C(=O)NC(=O)C(C)=C1'), mo('N1=C(O)N=C(O)C(CO)=C1')], answer: 0,
              hint: t('Laktimo formoje abi $C=O$ grupės pakeistos $C-OH$, o metilas lieka metilu.', 'In the lactim form both $C=O$ groups are replaced by $C-OH$, and the methyl group stays a methyl group.'),
              solution: [{ p: t('Abi karbonilo grupės virsta hidroksilu, metilas nesikeičia: 5-metil-2,4-dihidroksipirimidinas.', 'Both carbonyl groups become hydroxyl, the methyl group does not change: 5-methyl-2,4-dihydroxypyrimidine.') }, { mol: { smi: 'N1=C(O)N=C(O)C(C)=C1' } }]
            }],
            why: t('Tautomerizacija liečia tik $N-H$ ir $C=O$ poras. Pakaitai ant anglies (metilas) nesikeičia, ir formulė lieka ta pati.', 'Tautomerisation involves only the $N-H$ and $C=O$ pairs. Substituents on carbon (the methyl group) do not change, and the formula stays the same.'),
            src: 'T p149',
            claims: [{ formula: ['N1=C(O)N=C(O)C(C)=C1', 'C5H6N2O2'] }, { formula: [THYMINE, 'C5H6N2O2'] }]
          },
          {
            id: 'u16.tautomer.4',
            q: [{ p: t('Citozinas turi karbonilo ir aminogrupę.', 'Cytosine has a carbonyl and an amino group.') }, { mol: { smi: CYTOSINE } }],
            steps: [{
              prompt: t('Kuri tautomerinė forma nukleorūgštyse yra citozino laktamo forma?', 'Which tautomeric form is the lactam form of cytosine found in nucleic acids?'),
              kind: 'choice', options: [mo(CYTOSINE), mo('N1=C(O)N=C(N)C=C1'), mo('N1C(=O)NC(=N)C=C1')], answer: 0,
              hint: t('Laktamo forma turi ciklinę amido grupę ($N-C=O$) ir aminogrupę.', 'The lactam form has a cyclic amide group ($N-C=O$) and an amino group.'),
              solution: [{ p: t('Teisinga struktūra turi $C-2=O$ ir $NH2$ prie $C-4$. Struktūra su $C-OH$ yra laktimo forma, o su $C=NH$ grupe – iminoforma, kurios nukleorūgštyse nėra.', 'The correct structure has $C-2=O$ and $NH2$ on $C-4$. The structure with $C-OH$ is the lactim form, and the one with a $C=NH$ group is an imino form, which is not the one in nucleic acids.') }, { mol: { smi: CYTOSINE } }]
            }],
            why: t('Citozinas nukleorūgštyse turi laktamo formą su laisva aminogrupe; tai lemia jo vandenilinių ryšių rinkinį poravime su guaninu.', 'Cytosine in nucleic acids has the lactam form with a free amino group; this fixes its set of hydrogen bonds in pairing with guanine.'),
            src: 'T p149',
            claims: [{ formula: ['N1C(=O)NC(=N)C=C1', 'C4H5N3O'] }, { formula: ['N1=C(O)N=C(N)C=C1', 'C4H5N3O'] }]
          },
          {
            id: 'u16.tautomer.5',
            q: [{ p: t('Guanino laktamo forma.', 'The lactam form of guanine.') }],
            steps: [
              {
                prompt: t('Bakstelėkite deguonį, kuris laktimo formoje tampa hidroksilu.', 'Tap the oxygen that becomes a hydroxyl in the lactim form.'),
                kind: 'atoms', mol: { smi: GUANINE, opts: { numbers: { 0: 'O6', 1: 'C6', 2: 'N1', 3: 'C2', 4: 'N2', 5: 'N3', 6: 'C4', 7: 'C5', 8: 'N7', 9: 'C8', 10: 'N9' } } }, answer: [0],
                hint: t('Guanine yra vienintelis deguonies atomas.', 'Guanine has only one oxygen atom.'),
                solution: t('Deguonis ties $C-6$ gauna vandenilį iš $N-1$.', 'The oxygen on $C-6$ takes the hydrogen from $N-1$.')
              },
              {
                prompt: t('Kokia laktimo formos molekulinė formulė?', 'What is the molecular formula of the lactim form?'),
                kind: 'formula', mol: { smi: 'Oc1nc(N)nc2[nH]cnc12' }, answer: 'C5H5N5O',
                hint: t('Tautomerai yra izomerai.', 'Tautomers are isomers.'),
                solution: t('Laktimo ir laktamo formų formulės vienodos: $C5H5N5O$.', 'The lactim and lactam forms have the same formula: $C5H5N5O$.')
              }
            ],
            why: t('Guaninas turi laktamo formą (ties $C-6$) ir laktimo formą su $C-OH$; jos skiriasi tik vandenilio padėtimi.', 'Guanine has a lactam form (at $C-6$) and a lactim form with $C-OH$; they differ only in the position of the hydrogen.'),
            src: 'T p149',
            claims: [{ formula: ['Oc1nc(N)nc2[nH]cnc12', 'C5H5N5O'] }]
          },
          {
            id: 'u16.tautomer.6',
            q: [{ p: t('Adeninas neturi karbonilo grupės, bet jam taip pat būdinga tautomerija.', 'Adenine has no carbonyl group, but it too shows tautomerism.') }, { mol: [{ smi: ADENINE }, { smi: 'N=C1NC=NC2=C1N=CN2' }] }],
            steps: [
              {
                prompt: t('Kuri forma yra tokia, kokią adeninas turi nukleorūgštyse?', 'Which form is the one adenine has in nucleic acids?'),
                kind: 'choice', options: [tx('enamino (aminoforma, pirmoji struktūra)', 'enamine (amino form, the first structure)'), tx('ketimino (iminoforma, antroji struktūra)', 'ketimine (imino form, the second structure)')], answer: 0,
                hint: t('Pažiūrėkite, kuriame variante abu žiedai išlieka aromatiniai.', 'See in which structure both rings remain aromatic.'),
                solution: t('Enamino forma, kurioje abu žiedai aromatiniai; ketimino forma šio aromatiškumo neturi.', 'The enamine form, in which both rings are aromatic; the ketimine form lacks this aromaticity.')
              },
              {
                prompt: t('Kuo skiriasi šios dvi formos?', 'How do the two forms differ?'),
                kind: 'choice', options: [tx('Vandenilio padėtimi ($NH2$ ⇌ $=NH$ ir $N-H$ žiede) ir dvigubojo ryšio padėtimi.', 'The position of a hydrogen ($NH2$ ⇌ $=NH$ and the ring $N-H$) and of a double bond.'), tx('Anglies karkasu.', 'The carbon skeleton.'), tx('Elementų sudėtimi.', 'The elemental composition.')], answer: 0,
                hint: t('Tautomerai yra izomerai.', 'Tautomers are isomers.'),
                solution: t('Tai tautomerai: formulė ir karkasas tie patys, pasislenka tik vandenilis ir dvigubasis ryšys.', 'They are tautomers: the formula and skeleton are the same, only a hydrogen and a double bond move.')
              }
            ],
            why: t('Adeninas nukleorūgštyse yra aromatinės enamino formos; kitų bazių laktamo formos atitinka ją savo stabilumu.', 'Adenine in nucleic acids is in the aromatic enamine form; the lactam forms of the other bases match it in stability.'),
            src: 'T p148-149',
            claims: [{ formula: [ADENINE, 'C5H5N5'] }, { formula: ['N=C1NC=NC2=C1N=CN2', 'C5H5N5'] }]
          },
          {
            id: 'u16.tautomer.7',
            q: [{ p: t('Nukleorūgščių bazės yra laktamo formų.', 'The nucleic acid bases are in lactam forms.') }],
            steps: [
              {
                prompt: t('Kokia funkcinė grupė yra laktame?', 'Which functional group does a lactam contain?'),
                kind: 'choice', options: [tx('ciklinė amido grupė ($N-C=O$)', 'a cyclic amide group ($N-C=O$)'), tx('ciklinis esteris ($O-C=O$)', 'a cyclic ester ($O-C=O$)'), tx('enolis ($C=C-OH$)', 'an enol ($C=C-OH$)')], answer: 0,
                hint: t('Žodis laktamas reiškia ciklinį amidą.', 'The word lactam means a cyclic amide.'),
                solution: t('Laktamas – ciklinis amidas, laktimas – jo iminolio (imidinis) tautomeras.', 'A lactam is a cyclic amide, and a lactim is its imidic acid (iminol) tautomer.')
              },
              {
                prompt: t('Kodėl pusiausvyra pasislinkusi į laktamo pusę?', 'Why does the equilibrium lie on the lactam side?'),
                kind: 'choice', options: [tx('Amido grupės azoto pora konjuguota su $C=O$ ($p,π$ konjugacija), todėl laktamas stabilesnis.', 'The nitrogen pair of the amide group is conjugated with $C=O$ ($p,π$ conjugation), so the lactam is more stable.'), tx('$O-H$ ryšys stipresnis už $N-H$.', 'The $O-H$ bond is stronger than $N-H$.'), tx('Laktimo formoje nėra dvigubųjų ryšių.', 'The lactim form has no double bonds.')], answer: 0,
                hint: t('Palyginkite amido grupės ir iminolio grupės stabilumą.', 'Compare the stability of an amide group and an iminol group.'),
                solution: t('Amido rezonansas stabilizuoja laktamą. Laktimas turi $C=N$ ir $O-H$, o tai silpnesnė sistema.', 'Amide resonance stabilises the lactam. The lactim has $C=N$ and $O-H$, which is a weaker arrangement.')
              }
            ],
            why: t('Kaip ir paprastuose amiduose, ciklinio amido forma yra stabilesnė už iminolio. Todėl bazės yra laktamo formų.', 'As in simple amides, the cyclic amide form is more stable than the iminol. That is why the bases are in lactam forms.'),
            src: 'T p148-149'
          },
          {
            id: 'u16.tautomer.8',
            q: [{ p: t('Keturios tautomerinės formos.', 'Four tautomeric forms.') }],
            steps: [{
              prompt: t('Suporuokite struktūras su formų pavadinimais.', 'Match the structures with the names of the forms.'),
              kind: 'match',
              answer: {
                left: [mo(URACIL), mo(URACIL_LACTIM), mo(ADENINE), mo('N=C1NC=NC2=C1N=CN2')],
                right: [tx('laktamo forma', 'lactam form'), tx('laktimo forma', 'lactim form'), tx('enamino forma', 'enamine form'), tx('ketimino forma', 'ketimine form')],
                pairs: [0, 1, 2, 3]
              },
              hint: t('Raskite $C=O$, $C-OH$, $C-NH2$ ir $C=NH$ grupes.', 'Look for the $C=O$, $C-OH$, $C-NH2$ and $C=NH$ groups.'),
              solution: t('Uracilas turi $C=O$ ir $N-H$ (laktamas), jo dihidroksi forma – $C-OH$ ir $C=N$ (laktimas). Adeninas su $NH2$ yra enaminas, su $=NH$ ir žiedo $N-H$ – ketiminas.', 'Uracil has $C=O$ and $N-H$ (lactam), its dihydroxy form has $C-OH$ and $C=N$ (lactim). Adenine with $NH2$ is the enamine, with $=NH$ and a ring $N-H$ the ketimine.')
            }],
            why: t('Pavadinimas nusako, kuri grupė yra molekulėje: amidas (laktamas), iminolis (laktimas), aminas (enaminas) ar iminas (ketiminas).', 'The name says which group the molecule contains: amide (lactam), iminol (lactim), amine (enamine) or imine (ketimine).'),
            src: 'T p149'
          }
        ]
      },
      {
        id: 'u16.pairing',
        title: t('Vandeniliniai ryšiai tarp bazių', 'Hydrogen bonds between bases'),
        mirrors: ['S7.16'],
        bank: [
          {
            id: 'u16.pairing.1',
            q: [{ p: t('Dvi uracilo laktamo molekulės sudaro dimerą per tarpmolekulinius vandenilinius ryšius.', 'Two uracil lactam molecules form a dimer through intermolecular hydrogen bonds.') }],
            steps: [
              {
                prompt: t('Bakstelėkite vandenilinio ryšio donorus ($N-H$ azotus).', 'Tap the hydrogen-bond donors (the $N-H$ nitrogens).'),
                kind: 'atoms', mol: { smi: URACIL, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'O4', 6: 'C5', 7: 'C6' } } }, answer: [0, 3],
                hint: t('Donoras turi vandenilį, prijungtą prie elektroneigiamo atomo.', 'A donor carries a hydrogen bonded to an electronegative atom.'),
                solution: t('Laktamo formoje vandenilį turi $N-1$ ir $N-3$.', 'In the lactam form $N-1$ and $N-3$ carry hydrogens.')
              },
              {
                prompt: t('Bakstelėkite akceptorius ($C=O$ deguonis).', 'Tap the acceptors (the $C=O$ oxygens).'),
                kind: 'atoms', mol: { smi: URACIL, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'O4', 6: 'C5', 7: 'C6' } } }, answer: [2, 5],
                hint: t('Akceptorius turi laisvų elektronų poras ir nėra susijęs su vandeniliu.', 'An acceptor has lone pairs and is not bonded to a hydrogen.'),
                solution: t('Karbonilo deguonys O-2 ir O-4 turi laisvas poras.', 'The carbonyl oxygens O-2 and O-4 have lone pairs.')
              },
              {
                prompt: t('Kiek vandenilinių ryšių turi ciklinis dimeras, kuriame kiekvienos molekulės $N-3-H$ jungiasi su kitos molekulės $C-2=O$?', 'How many hydrogen bonds does the cyclic dimer have in which the $N-3-H$ of each molecule bonds to the $C-2=O$ of the other?'),
                kind: 'number', answer: { value: 2, tol: 0 },
                hint: t('Kiekviena molekulė vienu metu yra ir donoras, ir akceptorius.', 'Each molecule is at the same time a donor and an acceptor.'),
                solution: t('Du ryšiai: $N-3-H···O-2$ vienoje pusėje ir $O-2···H-N-3$ kitoje.', 'Two bonds: $N-3-H···O-2$ on one side and $O-2···H-N-3$ on the other.')
              }
            ],
            why: t('Vandenilinį ryšį sudaro donoras ($N-H$) ir akceptorius ($C=O$). Laktamo formoje abu yra molekulėje, todėl atsiranda poros ir dimerai.', 'A hydrogen bond forms between a donor ($N-H$) and an acceptor ($C=O$). In the lactam form both are in the molecule, so pairs and dimers form.'),
            src: 'T p145, S7.16'
          },
          {
            id: 'u16.pairing.2',
            q: [{ p: t('Pora A–T turi du vandenilinius ryšius.', 'The A–T pair has two hydrogen bonds.') }],
            steps: [
              {
                prompt: t('Bakstelėkite du adenino atomus, kurie dalyvauja vandeniliniuose ryšiuose su timinu.', 'Tap the two atoms of adenine that take part in the hydrogen bonds with thymine.'),
                kind: 'atoms', mol: { smi: ADENINE, opts: { numbers: { 0: 'N6', 1: 'C6', 2: 'N1', 3: 'C2', 4: 'N3', 5: 'C4', 6: 'N9', 7: 'C8', 8: 'N7', 9: 'C5' } } }, answer: [0, 2],
                hint: t('Poravime dalyvauja viena ($NH2$) donoro grupė ir kaimyninis akceptorius toje pačioje žiedo pusėje.', 'One donor group ($NH2$) and the neighbouring acceptor on the same side of the ring take part in pairing.'),
                solution: t('$N-6$ ($NH2$) atiduoda vandenilį timino $C-4=O$, o $N-1$ priima vandenilį iš timino $N-3-H$.', '$N-6$ ($NH2$) donates a hydrogen to the $C-4=O$ of thymine, and $N-1$ accepts a hydrogen from the $N-3-H$ of thymine.')
              },
              {
                prompt: t('Bakstelėkite du timino atomus, kurie jungiasi su adeninu.', 'Tap the two atoms of thymine that bond to adenine.'),
                kind: 'atoms', mol: { smi: THYMINE, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'O4', 6: 'C5', 8: 'C6' } } }, answer: [3, 5],
                hint: t('$N-1$ ir $C-2=O$ yra toje žiedo pusėje, prie kurios jungiasi cukrus.', '$N-1$ and $C-2=O$ are on the side of the sugar.'),
                solution: t('$N-3-H$ ir $C-4=O$: tai ta pusė, kuri žiede priešinga cukrui.', '$N-3-H$ and $C-4=O$: this is the side of the ring away from the sugar.')
              }
            ],
            why: t('A–T pora: du ryšiai, $N-H···O$ ir $N···H-N$. Cukrus ($N-1$ prie timino) lieka už poravimo pusės, todėl poravimosi pusėje lieka tik $N-3-H$ ir $C-4=O$.', 'The A–T pair has two bonds, $N-H···O$ and $N···H-N$. The sugar ($N-1$ of thymine) stays on the outer side of the pairing face, so only $N-3-H$ and $C-4=O$ are left on the pairing face.'),
            src: 'S7.16, Klein'
          },
          {
            id: 'u16.pairing.3',
            q: [{ p: t('Pora G–C turi tris vandenilinius ryšius.', 'The G–C pair has three hydrogen bonds.') }],
            steps: [
              {
                prompt: t('Bakstelėkite tris guanino atomus, kurie dalyvauja vandeniliniuose ryšiuose su citozinu.', 'Tap the three atoms of guanine that take part in the hydrogen bonds with cytosine.'),
                kind: 'atoms', mol: { smi: GUANINE, opts: { numbers: { 0: 'O6', 1: 'C6', 2: 'N1', 3: 'C2', 4: 'N2', 5: 'N3', 6: 'C4', 7: 'C5', 8: 'N7', 9: 'C8', 10: 'N9' } } }, answer: [0, 2, 4],
                hint: t('Ieškokite triadą iš eilės: akceptorius, donoras, donoras toje pačioje pusėje.', 'Look for a run of three on one side: an acceptor, a donor and a donor.'),
                solution: t('$O-6$ priima vandenilį iš citozino $N-4-H$, $N-1-H$ atiduoda $N-3$, $N-2-H$ atiduoda citozino $C-2=O$.', '$O-6$ accepts a hydrogen from the $N-4-H$ of cytosine, $N-1-H$ donates to $N-3$, and $N-2-H$ donates to the $C-2=O$ of cytosine.')
              },
              {
                prompt: t('Bakstelėkite tris citozino atomus, kurie jungiasi su guaninu.', 'Tap the three atoms of cytosine that bond to guanine.'),
                kind: 'atoms', mol: { smi: CYTOSINE, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'N4', 6: 'C5', 7: 'C6' } } }, answer: [2, 3, 5],
                hint: t('Vėl akceptorius, akceptorius, donoras; $N-1$ prisijungęs prie cukraus.', 'Again acceptor, acceptor, donor; $N-1$ is bonded to the sugar.'),
                solution: t('$O-2$ ir $N-3$ yra akceptoriai, $N-4-H$ ($NH2$) – donoras.', '$O-2$ and $N-3$ are acceptors, $N-4-H$ ($NH2$) is the donor.')
              }
            ],
            why: t('G–C pora turi tris vandenilinius ryšius, A–T – du. Todėl G–C turinti DNR kietesnė ir lydosi aukštesnėje temperatūroje.', 'The G–C pair has three hydrogen bonds, A–T two. A DNA rich in G–C is therefore more stable and melts at a higher temperature.'),
            src: 'S7.16, Klein'
          },
          {
            id: 'u16.pairing.4',
            q: [{ p: t('Du DNR fragmentai, kurių vieno bazių poros 70 % G–C, kito – 30 % G–C.', 'Two DNA fragments: one has 70 % G–C base pairs, the other 30 %.') }],
            steps: [
              {
                prompt: t('Kiek vandenilinių ryšių turi viena G–C pora?', 'How many hydrogen bonds does one G–C pair have?'),
                kind: 'number', answer: { value: 3, tol: 0 },
                hint: t('Prisiminkite guanino ir citozino donorų bei akceptorių rinkinį.', 'Recall the set of donors and acceptors of guanine and cytosine.'),
                solution: t('Trys: $O-6···H-N-4$, $N-1-H···N-3$, $N-2-H···O-2$.', 'Three: $O-6···H-N-4$, $N-1-H···N-3$, $N-2-H···O-2$.')
              },
              {
                prompt: t('Kuris fragmentas lydosi aukštesnėje temperatūroje?', 'Which fragment melts at the higher temperature?'),
                kind: 'choice', options: [tx('70 % G–C (daugiau vandenilinių ryšių)', '70 % G–C (more hydrogen bonds)'), tx('30 % G–C', '30 % G–C'), tx('vienodai', 'the same')], answer: 0,
                hint: t('Daugiau ryšių reikia daugiau energijos jiems nutraukti.', 'More bonds need more energy to break.'),
                solution: t('G–C pora turi 3 ryšius, A–T – 2, todėl daugiau G–C reiškia stabilesnį dvigrandį fragmentą.', 'A G–C pair has 3 bonds, A–T has 2, so more G–C means a more stable double-stranded fragment.')
              }
            ],
            why: t('Vandenilinių ryšių skaičius lemia poros stabilumą: G–C (3) stabilesnė už A–T (2).', 'The number of hydrogen bonds decides the stability of the pair: G–C (3) is more stable than A–T (2).'),
            src: 'S7.16, Klein'
          },
          {
            id: 'u16.pairing.5',
            q: [{ p: t('RNR vietoj timino turi uracilą. Poroje A–U dalyvauja tie patys uracilo atomai kaip timine.', 'RNA has uracil in place of thymine. In the A–U pair the same uracil atoms take part as in thymine.') }],
            steps: [{
              prompt: t('Bakstelėkite uracilo atomus, jungiamus su adeninu.', 'Tap the atoms of uracil that bond to adenine.'),
              kind: 'atoms', mol: { smi: URACIL, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'O4', 6: 'C5', 7: 'C6' } } }, answer: [3, 5],
              hint: t('Palyginkite su timino atvejų: metilas poravime nedalyvauja.', 'Compare with thymine: the methyl group takes no part in pairing.'),
              solution: t('$N-3-H$ ir $C-4=O$; metilas timine tik skiria $T$ nuo $U$.', '$N-3-H$ and $C-4=O$; the methyl group of thymine only tells $T$ from $U$.')
            }],
            why: t('Uracilas ir timinas poravime elgiasi vienodai: A–U ir A–T abi turi du vandenilinius ryšius.', 'Uracil and thymine behave in the same way in pairing: A–U and A–T both have two hydrogen bonds.'),
            src: 'S7.16, T p148'
          },
          {
            id: 'u16.pairing.6',
            q: [{ p: t('Poravimas priklauso nuo donorų ir akceptorių išdėstymo.', 'Pairing depends on the arrangement of donors and acceptors.') }],
            steps: [{
              prompt: t('Kodėl bazės poruojasi būtent laktamo formomis?', 'Why do the bases pair in their lactam forms?'),
              kind: 'choice',
              options: [
                tx('Laktamo formos donorų ir akceptorių ($N-H$, $C=O$) rinkinys atitinka partnerio bazę; laktimo forma ($O-H$, $N=$) jį pakeistų.', 'The set of donors and acceptors ($N-H$, $C=O$) of the lactam form fits the partner base; the lactim form ($O-H$, $N=$) would change it.'),
                tx('Laktimo forma neturi heteroatomų.', 'The lactim form has no heteroatoms.'),
                tx('Laktamo formoje nėra vandenilio.', 'The lactam form has no hydrogen.'),
                tx('Poravimas vyksta kovalentiniais ryšiais.', 'Pairing takes place through covalent bonds.')
              ],
              answer: 0,
              hint: t('Palyginkite, kas yra donoras ir kas akceptorius abiejose formose.', 'Compare what is a donor and what is an acceptor in both forms.'),
              solution: t('Laktamo forma: donoras $N-H$, akceptorius $C=O$. Laktimo forma: donoras $O-H$, akceptorius $N=$. Pasikeitus rinkiniui, poravimo partneris būtų kitas (pvz., retas timino laktimas poruotųsi su guaninu).', 'Lactam form: donor $N-H$, acceptor $C=O$. Lactim form: donor $O-H$, acceptor $N=$. With a changed set the partner would be different (for example a rare thymine lactim would pair with guanine).')
            }],
            why: t('Poravimo taisyklė (A–T/U, G–C) yra donorų ir akceptorių rinkinių atitikimas. Todėl tautomerinė forma lemia, ar poravimas teisingas.', 'The pairing rule (A–T/U, G–C) is a match of sets of donors and acceptors. The tautomeric form therefore decides whether the pairing is correct.'),
            src: 'T p148-149, S7.16, Klein'
          },
          {
            id: 'u16.pairing.7',
            q: [{ p: t('Vandeniliniai ryšiai tarp bazių.', 'Hydrogen bonds between bases.') }],
            steps: [{
              prompt: t('Pažymėkite visus teisingus teiginius.', 'Pick every correct statement.'),
              kind: 'multi',
              options: [
                tx('Vandenilinis ryšys yra silpnesnis už kovalentinį.', 'A hydrogen bond is weaker than a covalent bond.'),
                tx('Poroje A–T yra du vandeniliniai ryšiai.', 'The A–T pair has two hydrogen bonds.'),
                tx('Poroje G–C yra du vandeniliniai ryšiai.', 'The G–C pair has two hydrogen bonds.'),
                tx('Donoras yra $N-H$, akceptorius – $C=O$.', 'The donor is $N-H$, the acceptor is $C=O$.'),
                tx('Poroje A–T abi bazės yra purinai.', 'In the A–T pair both bases are purines.')
              ],
              answer: [0, 1, 3],
              hint: t('Prisiminkite, kiek ryšių turi G–C.', 'Recall how many bonds G–C has.'),
              solution: t('Teisingi teiginiai: vandenilinis ryšys silpnesnis už kovalentinį, A–T pora turi du ryšius, o donoras yra $N-H$, akceptorius – $C=O$. G–C turi tris ryšius, o DNR poroje visada poruojasi purinas su pirimidinu (A–T, G–C).', 'The correct statements are that a hydrogen bond is weaker than a covalent one, that the A–T pair has two bonds, and that the donor is $N-H$ and the acceptor $C=O$. G–C has three bonds, and in a DNA base pair a purine always pairs with a pyrimidine (A–T, G–C).')
            }],
            why: t('Vandeniliniai ryšiai silpni, bet jų gausa stabilizuoja dvigubą spiralę.', 'Hydrogen bonds are weak, but their large number stabilises the double helix.'),
            src: 'T p145, Klein'
          },
          {
            id: 'u16.pairing.8',
            q: [{ p: t('Brūkšniai tarp bazių brėžiniuose vaizduoja vandenilinius ryšius.', 'The dotted lines between bases in drawings represent hydrogen bonds.') }],
            steps: [{
              prompt: t('Kuris teiginys apie uracilo dimerą yra teisingas?', 'Which statement about the uracil dimer is correct?'),
              kind: 'choice',
              options: [
                tx('Du uracilo laktamo molekulės sujungtos $N-H···O=C$ vandeniliniais ryšiais.', 'Two uracil lactam molecules are joined by $N-H···O=C$ hydrogen bonds.'),
                tx('Dimeras susidaro iš laktimo formų per $O-H···O-H$.', 'The dimer forms from lactim forms through $O-H···O-H$.'),
                tx('Dimerą laiko kovalentinis $N-N$ ryšys.', 'A covalent $N-N$ bond holds the dimer together.'),
                tx('Dimere dalyvauja tik uracilo metilas.', 'Only the methyl group of uracil takes part in the dimer.')
              ],
              answer: 0,
              hint: t('Kokias grupes turi laktamo forma?', 'Which groups does the lactam form have?'),
              solution: t('Laktamo forma turi $N-H$ donorus ir $C=O$ akceptorius, todėl dimeras laikosi vandeniliniais ryšiais.', 'The lactam form has $N-H$ donors and $C=O$ acceptors, so the dimer is held by hydrogen bonds.')
            }],
            why: t('Dimeras yra tarpmolekulinė asociacija, o ne nauja medžiaga: ryšiai nutrūksta kaitinant ar keičiant tirpiklį.', 'The dimer is an intermolecular association, not a new compound: the bonds break on heating or when the solvent is changed.'),
            src: 'T p145, S7.16'
          }
        ]
      },
      {
        id: 'u16.nitro',
        title: t('Uracilo ir kitų pirimidinų elektrofilinis pakeitimas', 'Electrophilic substitution of uracil and other pyrimidines'),
        mirrors: ['S7.16'],
        bank: [
          {
            id: 'u16.nitro.1',
            q: [{ p: t('Uracilas nitrinamas azoto rūgštimi.', 'Uracil is nitrated with nitric acid.') }, { scheme: { items: [{ smi: URACIL }, { arrow: '→', above: f('HNO3') }] } }],
            steps: [
              {
                prompt: t('Kuri uracilo tautomerinė forma dalyvauja SEAr?', 'Which tautomeric form of uracil takes part in SEAr?'),
                kind: 'choice', options: [tx('laktimo (dihidroksipirimidinas)', 'lactim (dihydroxypyrimidine)'), tx('laktamo (dioksoforma)', 'lactam (dioxo form)')], answer: 0,
                hint: t('SEAr reikia aromatinio žiedo su aktyvuojančiais pakaitais.', 'SEAr needs an aromatic ring with activating substituents.'),
                solution: t('Laktimo forma yra aromatinis pirimidinas su dviem $OH$ (kaip fenolis).', 'The lactim form is an aromatic pyrimidine with two $OH$ groups (like a phenol).')
              },
              {
                prompt: t('Bakstelėkite žiedo anglį, į kurią patenka $NO2$.', 'Tap the ring carbon that receives $NO2$.'),
                kind: 'atoms', mol: { smi: URACIL_LACTIM, opts: { numbers: URACIL_NUM } }, answer: [6],
                hint: t('Ieškokite padėties, kuri yra orto vienam hidroksilui ir para kitam.', 'Look for the position that is ortho to one hydroxyl and para to the other.'),
                solution: t('$C-5$ (brėžinyje Nr. 5): orto $C-4$ hidroksilui, para $C-2$ hidroksilui.', '$C-5$ (label 5 in the drawing): ortho to the $C-4$ hydroxyl, para to the $C-2$ hydroxyl.')
              },
              {
                prompt: t('Koks yra produktas laktamo formoje?', 'What is the product in the lactam form?'),
                kind: 'choice', options: [mo(NITROURACIL), mo('N1C(=O)NC(=O)C=C1[N+](=O)[O-]'), mo('N1([N+](=O)[O-])C(=O)NC(=O)C=C1'), mo('N1C(=O)N([N+](=O)[O-])C(=O)C=C1')], answer: 0,
                hint: t('Nitro grupė jungiasi prie anglies, kurią nustatėte ankstesniame žingsnyje.', 'The nitro group bonds to the carbon you chose in the previous step.'),
                solution: [{ p: t('5-nitrouracilas: nitro grupė ties $C-5$, po SEAr produktas vėl įgyja laktamo formą.', '5-Nitrouracil: the nitro group at $C-5$; after SEAr the product returns to the lactam form.') }, { mol: { smi: NITROURACIL } }]
              }
            ],
            why: t('Uracilo elektrofilinis pakeitimas vyksta per laktimo formą, nes ji aromatinė ir turi aktyvuojančius $OH$. Dvi hidroksilo grupės nukreipia $NO2$ į $C-5$.', 'Electrophilic substitution of uracil goes through the lactim form, because it is aromatic and has activating $OH$ groups. The two hydroxyl groups direct $NO2$ to $C-5$.'),
            src: 'S7.16',
            claims: [{ formula: [NITROURACIL, 'C4H3N3O4'] }, { formula: ['N1C(=O)NC(=O)C=C1[N+](=O)[O-]', 'C4H3N3O4'] }]
          },
          {
            id: 'u16.nitro.2',
            q: [{ p: t('Pats pirimidinas reaguoja su elektrofilais sunkiai (du elektroneigiami azotai), bet uracilas nitrinamas.', 'Pyrimidine itself reacts with electrophiles reluctantly (two electronegative nitrogens), but uracil can be nitrated.') }],
            steps: [{
              prompt: t('Kas padaro uracilą reaktyvesnį už pirimidiną?', 'What makes uracil more reactive than pyrimidine?'),
              kind: 'choice',
              options: [
                tx('Dvi $OH$ grupės (laktimo forma) teikia elektronus ($+M$) ir kompensuoja azotų poveikį.', 'The two $OH$ groups (lactim form) donate electrons ($+M$) and compensate for the effect of the nitrogens.'),
                tx('Uracilas turi daugiau azoto atomų.', 'Uracil has more nitrogen atoms.'),
                tx('Uracilo žiedas nėra plokščias.', 'The uracil ring is not planar.'),
                tx('Uracilas turi metilo grupę.', 'Uracil has a methyl group.')
              ],
              answer: 0,
              hint: t('Prisiminkite, ką $OH$ grupė daro benzeno žiedui fenole.', 'Recall what an $OH$ group does to the benzene ring in phenol.'),
              solution: t('Hidroksilo deguonies pora patenka į žiedą ($+M$), kaip fenolyje, ir didina elektronų tankį ties $C-5$.', 'The oxygen pair of the hydroxyl enters the ring ($+M$), as in phenol, and increases the electron density at $C-5$.')
            }],
            why: t('Pakaitai keičia heterociklo reaktyvumą taip pat kaip benzeno: elektronus teikiantys aktyvuoja, o žiedo azotai deaktyvuoja.', 'Substituents change the reactivity of a heterocycle just as they do for benzene: electron donors activate, and the ring nitrogens deactivate.'),
            src: 'S7.16, Klein'
          },
          {
            id: 'u16.nitro.3',
            q: [{ p: t('Uracilas ir timinas reaguoja su nitrinimo reagentu.', 'Uracil and thymine react with a nitrating reagent.') }, { mol: [{ smi: URACIL }, { smi: THYMINE }] }],
            steps: [
              {
                prompt: t('Kuris iš jų gali duoti 5-nitro darinį?', 'Which of them can give a 5-nitro derivative?'),
                kind: 'choice', options: [tx('uracilas', 'uracil'), tx('timinas', 'thymine'), tx('abu', 'both')], answer: 0,
                hint: t('Pažiūrėkite, ar $C-5$ turi vandenilį.', 'See whether $C-5$ carries a hydrogen.'),
                solution: t('Uracilas turi $C-5-H$. Timine $C-5$ jau turi metilo grupę.', 'Uracil has $C-5-H$. In thymine $C-5$ already carries a methyl group.')
              },
              {
                prompt: t('Bakstelėkite padėtį, kuri timine užblokuota.', 'Tap the position that is blocked in thymine.'),
                kind: 'atoms', mol: { smi: THYMINE, opts: { numbers: { 0: 'N1', 1: 'C2', 2: 'O2', 3: 'N3', 4: 'C4', 5: 'O4', 6: 'C5', 8: 'C6' } } }, answer: [6],
                hint: t('Ieškokite anglies su pakaitu, ne su vandeniliu.', 'Look for the carbon carrying a substituent rather than a hydrogen.'),
                solution: t('$C-5$ turi $CH3$, todėl elektrofilas čia nepakeičia vandenilio.', '$C-5$ carries $CH3$, so the electrophile cannot replace a hydrogen here.')
              }
            ],
            why: t('Elektrofilinis pakeitimas pakeičia aromatinio žiedo vandenilį. Jei pageidaujama padėtis užimta, reakcija nevyksta ten pat.', 'Electrophilic substitution replaces a hydrogen of the aromatic ring. If the preferred position is occupied, the reaction cannot take place there.'),
            src: 'S7.16'
          },
          {
            id: 'u16.nitro.4',
            q: [{ p: t('Nitrinimo reagentas yra nitronio jonas $NO2+$.', 'The nitrating reagent is the nitronium ion $NO2+$.') }],
            steps: [
              {
                prompt: t('Kaip jis gaunamas?', 'How is it formed?'),
                kind: 'choice', options: [tx('$HNO3$ + $H2SO4$ → $NO2+$ + $HSO4-$ + $H2O$', '$HNO3$ + $H2SO4$ → $NO2+$ + $HSO4-$ + $H2O$'), tx('$HNO3$ + $NaOH$ → $NO2+$ + $NaNO3$', '$HNO3$ + $NaOH$ → $NO2+$ + $NaNO3$'), tx('$HNO3$ + $H2O$ → $NO2+$ + $OH-$', '$HNO3$ + $H2O$ → $NO2+$ + $OH-$')], answer: 0,
                hint: t('Elektrofilui reikia stiprios rūgšties, kuri protonuotų $HNO3$ ir atskeltų vandenį.', 'The electrophile needs a strong acid that protonates $HNO3$ and removes water.'),
                solution: t('Stipri rūgštis protonuoja $HNO3$, o nuo protonuotos molekulės atskyla $H2O$ ir lieka $NO2+$.', 'A strong acid protonates $HNO3$, and $H2O$ splits from the protonated molecule, leaving $NO2+$.')
              },
              {
                prompt: t('Kurį iš ryšių atakuoja elektrofilas uracilo laktimo formoje?', 'Which bond of the lactim form of uracil does the electrophile attack?'),
                kind: 'choice', options: [tx('$C-5=C-6$ ryšį (ties $C-5$)', 'the $C-5=C-6$ bond (at $C-5$)'), tx('$C-2=N-1$ ryšį', 'the $C-2=N-1$ bond'), tx('$C-4-O$ ryšį', 'the $C-4-O$ bond')], answer: 0,
                hint: t('Kuris ryšys elektronų turtingiausias ir kodėl?', 'Which bond is the most electron-rich, and why?'),
                solution: [{ p: t('$C-5=C-6$ $π$ ryšys yra elektronų turtingiausias (aktyvuotas $OH$ grupėmis), todėl atakuojamas ties $C-5$.', 'The $C-5=C-6$ $π$ bond is the most electron-rich (activated by the $OH$ groups), so it is attacked at $C-5$.') },
                  { mech: [{ scheme: { items: [{ smi: URACIL_LACTIM }, { plus: true }, { smi: 'O=[N+]=O' }] }, arrows: [{ from: { m: 0, b: [6, 7] }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }], note: t('1 stadija: $π$ elektronai atakuoja $NO2+$.', 'Stage 1: the $π$ electrons attack $NO2+$.') }] }]
              }
            ],
            why: t('Nitrinimo reagentą sudaro stipri rūgštis; po to vyksta dviejų stadijų SEAr: ataka ir protono atskilimas.', 'A strong acid generates the nitrating reagent; then comes the two-stage SEAr: attack and loss of a proton.'),
            src: 'L9 p10, S7.16'
          },
          {
            id: 'u16.nitro.5',
            q: [{ p: t('Citozinas nitrinamas laktimo forma.', 'Cytosine is nitrated through its lactim form.') }, { mol: { smi: 'N1=C(O)N=C(N)C=C1', opts: { numbers: { 0: '1', 1: '2', 3: '3', 4: '4', 6: '5', 7: '6' } } } }],
            steps: [
              {
                prompt: t('Bakstelėkite žiedo anglį, į kurią patenka $NO2$.', 'Tap the ring carbon that receives $NO2$.'),
                kind: 'atoms', mol: { smi: 'N1=C(O)N=C(N)C=C1', opts: { numbers: { 0: '1', 1: '2', 3: '3', 4: '4', 6: '5', 7: '6' } } }, answer: [6],
                hint: t('Aminogrupė ir hidroksilas abu teikia elektronus: kur jų poveikis sutampa?', 'The amino group and the hydroxyl both donate electrons: where do their effects coincide?'),
                solution: t('$C-5$ yra orto aminogrupei ir para hidroksilui, todėl čia elektronų tankis didžiausias.', '$C-5$ is ortho to the amino group and para to the hydroxyl, so the electron density is highest here.')
              },
              {
                prompt: t('Koks yra produktas (laktamo forma)?', 'What is the product (lactam form)?'),
                kind: 'choice', options: [mo('N1C(=O)N=C(N)C([N+](=O)[O-])=C1'), mo('N1C(=O)N=C(N)C=C1[N+](=O)[O-]'), mo('N1C(=O)N=C(N[N+](=O)[O-])C=C1')], answer: 0,
                hint: t('Nitro grupė jungiasi prie anglies, ne prie azoto.', 'The nitro group bonds to carbon, not to nitrogen.'),
                solution: [{ p: t('5-nitrocitozinas.', '5-Nitrocytosine.') }, { mol: { smi: 'N1C(=O)N=C(N)C([N+](=O)[O-])=C1' } }]
              }
            ],
            why: t('Citozinas elgiasi kaip uracilas: $C-5$ yra aktyviausia padėtis, nes ją stiprina elektronus teikiantys pakaitai ties $C-2$ ir $C-4$.', 'Cytosine behaves like uracil: $C-5$ is the most active position, because the electron-donating substituents at $C-2$ and $C-4$ reinforce it.'),
            src: 'S7.16, Klein',
            claims: [{ formula: ['N1C(=O)N=C(N)C([N+](=O)[O-])=C1', 'C4H4N4O3'] }]
          },
          {
            id: 'u16.nitro.6',
            q: [{ p: t('Uracilas reaguoja su bromu ($Br2$).', 'Uracil reacts with bromine ($Br2$).') }, { scheme: { items: [{ smi: URACIL }, { arrow: '→', above: f('Br2') }] } }],
            steps: [{
              prompt: t('Koks yra pagrindinis produktas?', 'What is the main product?'),
              kind: 'choice', options: [mo('N1C(=O)NC(=O)C(Br)=C1'), mo('N1C(=O)NC(=O)C=C1Br'), mo('N1(Br)C(=O)NC(=O)C=C1')], answer: 0,
              hint: t('Halogeninimas yra SEAr, kaip nitrinimas: ta pati padėtis.', 'Halogenation is SEAr like nitration: the same position.'),
              solution: [{ p: t('5-bromuracilas: bromas patenka ten, kur patenka ir $NO2$ ($C-5$).', '5-Bromouracil: bromine goes where $NO2$ also goes ($C-5$).') }, { mol: { smi: 'N1C(=O)NC(=O)C(Br)=C1' } }]
            }],
            why: t('Visos SEAr reakcijos uracile vyksta ties $C-5$ – orientaciją lemia ta pati dviejų $OH$ grupių aktyvacija.', 'All SEAr reactions of uracil take place at $C-5$; the same activation by two $OH$ groups sets the orientation.'),
            src: 'S7.16, Klein',
            claims: [{ formula: ['N1C(=O)NC(=O)C(Br)=C1', 'C4H3BrN2O2'] }]
          },
          {
            id: 'u16.nitro.7',
            q: [{ p: t('5-nitrouracilas redukuojamas $Fe$ / $H3O+$.', '5-Nitrouracil is reduced with $Fe$ / $H3O+$.') }, { scheme: { items: [{ smi: NITROURACIL }, { arrow: '→', above: f('Fe, H3O+') }] } }],
            steps: [
              {
                prompt: t('Koks yra produktas?', 'What is the product?'),
                kind: 'choice', options: [mo('N1C(=O)NC(=O)C(N)=C1'), mo('N1C(=O)NC(=O)C(NO)=C1'), mo('N1C(=O)NC(=O)C([N+](=O)[O-])=C1')], answer: 0,
                hint: t('Nitro grupė metalu rūgštyje redukuojama iki amino.', 'A nitro group is reduced to an amino group by a metal in acid.'),
                solution: [{ p: t('$NO2$ virsta $NH2$: 5-aminouracilas.', '$NO2$ becomes $NH2$: 5-aminouracil.') }, { mol: { smi: 'N1C(=O)NC(=O)C(N)=C1' } }]
              },
              {
                prompt: t('Kokia produkto molekulinė formulė?', 'What is the molecular formula of the product?'),
                kind: 'formula', mol: { smi: 'N1C(=O)NC(=O)C(N)=C1' }, answer: 'C4H5N3O2',
                hint: t('Nitro grupė ($NO2$) pakeičiama aminogrupe ($NH2$).', 'The nitro group ($NO2$) is replaced by an amino group ($NH2$).'),
                solution: t('$C4H3N3O4$ netenka 2 O ir gauna 2 H: $C4H5N3O2$.', '$C4H3N3O4$ loses 2 O and gains 2 H: $C4H5N3O2$.')
              }
            ],
            why: t('Dviejų stadijų seka: SEAr (nitrinimas) ir nitro grupės redukcija – tai standartinis kelias iš heterociklo gauti amino darinį.', 'A two-stage sequence: SEAr (nitration) followed by reduction of the nitro group is the standard way from a heterocycle to an amino derivative.'),
            src: 'S7.16, S7.10',
            claims: [{ react: ['nitro.reduce', [NITROURACIL], null, 'N1C(=O)NC(=O)C(N)=C1'] }, { formula: ['N1C(=O)NC(=O)C(N)=C1', 'C4H5N3O2'] }]
          },
          {
            id: 'u16.nitro.8',
            q: [{ p: t('Uracilas nitrinamas ir gaunamas produktas.', 'Uracil is nitrated and a product is obtained.') }],
            steps: [{
              prompt: t('Pažymėkite visus teisingus teiginius apie šią reakciją.', 'Pick every correct statement about this reaction.'),
              kind: 'multi',
              options: [
                tx('Reakcija yra SEAr.', 'The reaction is SEAr.'),
                tx('Dalyvauja laktimo tautomeras.', 'The lactim tautomer takes part.'),
                tx('Nitro grupė patenka ant azoto.', 'The nitro group goes onto nitrogen.'),
                tx('Nitro grupė patenka ties $C-5$.', 'The nitro group goes to $C-5$.'),
                tx('Produktas yra 6-nitrouracilas.', 'The product is 6-nitrouracil.')
              ],
              answer: [0, 1, 3],
              hint: t('Prisiminkite, kuri forma aromatinė ir kuri padėtis aktyviausia.', 'Recall which form is aromatic and which position is the most active.'),
              solution: t('Teisingi teiginiai: reakcija yra SEAr, joje dalyvauja laktimo tautomeras, o nitrogrupė patenka į $C-5$ – produktas yra 5-nitrouracilas, ne 6-nitro darinys, ir ne ant azoto.', 'The correct statements are that the reaction is SEAr, that the lactim tautomer takes part, and that the nitro group goes to $C-5$: the product is 5-nitrouracil, not the 6-nitro compound, and not on nitrogen.')
            }],
            why: t('Uracilo nitrinimas sujungia du dalykus: tautomeriją (laktimo forma yra aromatinė) ir orientaciją (aktyvuoja $OH$ grupės).', 'The nitration of uracil combines two ideas: tautomerism (the lactim form is aromatic) and orientation (activated by the $OH$ groups).'),
            src: 'S7.16'
          }
        ]
      }
    ],
    coverage: {
      'S7.13': ['u16.protonate', 'u16.basicity'],
      'S7.14': ['u16.sear', 'u16.nuc'],
      'S7.15': ['u16.protonate', 'u16.basicity', 'u16.sear', 'u16.pyridine', 'u16.nuc'],
      'S7.16': ['u16.tautomer', 'u16.pairing', 'u16.nitro']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
