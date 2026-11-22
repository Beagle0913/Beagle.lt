// site/organic/units/u15.js: unit 15, amines (classes, basicity, alkylation, acylation, HNO2, diazonium salts) and cysteine
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });   // labels that are only formulas or symbols

  /* ====================================================================== */
  /* NOTES                                                                  */
  /* ====================================================================== */

  const NOTES = [
    /* ---------- 1. classes, names, hydrogen bonding ---------- */
    {
      id: 'klas',
      title: t('Aminų klasės, pavadinimai ir vandenilinis ryšys', 'Classes, names and hydrogen bonding of amines'),
      blocks: [
        { h: t('Kas yra aminas?', 'What is an amine?') },
        {
          p: t('Aminuose organiniai radikalai užima vieno, dviejų ar trijų amoniako vandenilių vietą. Funkcinė grupė yra azoto atomas su laisva elektronų pora. Nuo šios poros priklauso beveik visos aminų savybės: bazingumas, nukleofiliškumas ir reakcijos su nitrito rūgštimi.',
            'In amines organic groups take the place of one, two or three hydrogens of ammonia. The functional group is a nitrogen atom with a lone pair. Almost every property of amines comes from this pair: basicity, nucleophilicity and the reactions with nitrous acid.'),
          src: 'T p96'
        },
        {
          rule: t('Aminas yra pirminis, antrinis arba tretinis pagal tai, kiek anglies atomų tiesiogiai prijungta prie azoto: vienas, du arba trys. Ketvirtinė amonio druska $R4N+ X-$ turi keturis radikalus ir teigiamą azotą be laisvos poros.',
            'An amine is primary, secondary or tertiary according to how many carbon atoms are bonded directly to nitrogen: one, two or three. A quaternary ammonium salt $R4N+ X-$ has four groups and a positive nitrogen without a lone pair.'),
          src: 'T p96'
        },
        {
          mol: [
            { smi: 'CCN', name: t('etanaminas', 'ethanamine') },
            { smi: 'CNC', name: t('N-metilmetanaminas', 'N-methylmethanamine') },
            { smi: 'CN(C)C', name: t('N,N-dimetilmetanaminas', 'N,N-dimethylmethanamine') },
            { smi: 'C[N+](C)(C)C.[Cl-]', name: t('tetrametilamonio chloridas', 'tetramethylammonium chloride') }
          ],
          caption: t('Pirminis, antrinis, tretinis aminas ir ketvirtinė amonio druska.', 'A primary, a secondary and a tertiary amine, and a quaternary ammonium salt.')
        },
        {
          pitfall: t('Klasę lemia azoto kaimynų skaičius, o ne anglies atomo klasė. Tret-butilaminas yra pirminis aminas, nors su azotu sujungta anglis yra tretinė.',
            'The class is set by the number of carbons on nitrogen, not by the class of the carbon. tert-Butylamine is a primary amine even though the carbon on nitrogen is tertiary.')
        },
        { mol: { smi: 'CC(C)(C)N', name: t('2-metil-2-propanaminas', '2-methylpropan-2-amine') } },
        { h: t('Pagal radikalo pobūdį', 'By the type of the group') },
        {
          p: t('Pagal tai, kaip sujungta anglies dalis, aminai būna alifatinio, aliciklinio, aromatinio arba heterociklinio tipo. Aromatiniame amine azotas sujungtas tiesiogiai su benzeno žiedu; heterociklinio amino azotas yra paties žiedo narys.',
            'By the group, amines are aliphatic, alicyclic, aromatic or heterocyclic. In an aromatic amine the nitrogen is bonded directly to a benzene ring; in a heterocyclic amine the nitrogen is a member of the ring itself.'),
          src: 'T p96'
        },
        {
          mol: [
            { smi: 'CCNC', name: t('N-metiletanaminas', 'N-methylethanamine') },
            { smi: 'NC1CCCCC1', name: t('cikloheksanaminas', 'cyclohexanamine') },
            { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') },
            { smi: 'C1COCCN1', name: t('morfolinas', 'morpholine') }
          ],
          caption: t('Alifatinis, aliciklinis, aromatinis ir heterociklinis aminas.', 'An aliphatic, an alicyclic, an aromatic and a heterocyclic amine.')
        },
        {
          pitfall: t('Benzilaminas nėra aromatinis aminas: tarp žiedo ir azoto yra $CH2$ grupė, todėl azoto elektronų pora su žiedu nekonjuguota ir aminas elgiasi kaip alifatinis.',
            'Benzylamine is not an aromatic amine: a $CH2$ group separates the ring from nitrogen, so the lone pair is not conjugated with the ring and the amine behaves as an aliphatic one.')
        },
        { mol: { smi: 'NCc1ccccc1', name: t('fenilmetanaminas', 'phenylmethanamine') } },
        { h: t('Vandenilinis ryšys ir virimo temperatūra', 'Hydrogen bonding and boiling point') },
        {
          p: t('Ryšys $N-H$ yra polinis, todėl pirminių ir antrinių aminų molekulės sudaro tarpmolekulinius vandenilinius ryšius ir verda aukščiau už panašios masės angliavandenilius ir eterius. Alkoholiai verda dar aukščiau, nes deguonis elektroneigiamesnis ir $O-H···O$ ryšys stipresnis už $N-H···N$.',
            'The $N-H$ bond is polar, so molecules of primary and secondary amines form intermolecular hydrogen bonds and boil higher than hydrocarbons and ethers of similar mass. Alcohols boil higher still, because oxygen is more electronegative and $O-H···O$ is stronger than $N-H···N$.'),
          src: 'T p96'
        },
        {
          table: {
            head: [t('Junginys', 'Compound'), t('Pavadinimas', 'Name'), t('Klasė', 'Class'), t('Virimo temperatūra, apie °C', 'Boiling point, about °C')],
            rows: [
              [{ smi: 'CCCCN', name: t('1-butanaminas', 'butan-1-amine') }, t('1-butanaminas', 'butan-1-amine'), t('pirminis aminas', 'primary amine'), f('78')],
              [{ smi: 'CCNCC', name: t('N-etiletanaminas', 'N-ethylethanamine') }, t('N-etiletanaminas', 'N-ethylethanamine'), t('antrinis aminas', 'secondary amine'), f('56')],
              [{ smi: 'CCN(C)C', name: t('N,N-dimetiletanaminas', 'N,N-dimethylethanamine') }, t('N,N-dimetiletanaminas', 'N,N-dimethylethanamine'), t('tretinis aminas', 'tertiary amine'), f('37')],
              [{ smi: 'CCCCO', name: t('1-butanolis', 'butan-1-ol') }, t('1-butanolis', 'butan-1-ol'), t('alkoholis', 'alcohol'), f('118')]
            ]
          },
          caption: t('Junginiai su keturiais C atomais: virimo temperatūra mažėja, kai mažėja N–H ryšių skaičius.', 'Compounds with four carbons: the boiling point falls as the number of N-H bonds falls.'),
          src: 'T p96'
        },
        {
          rule: t('Panašios masės izomerų virimo temperatūra mažėja eilėje: pirminis aminas > antrinis > tretinis, nes mažėja $N-H$ ryšių skaičius. Tretinis aminas neturi $N-H$, todėl savo tarpe vandenilinių ryšių nesudaro.',
            'For isomers of similar mass the boiling point falls in the order primary amine > secondary > tertiary, because the number of $N-H$ bonds falls. A tertiary amine has no $N-H$, so it forms no hydrogen bonds with itself.'),
          src: 'S7.1'
        },
        {
          pitfall: t('Tretinis aminas savo tarpe nesudaro vandenilinių ryšių, bet su vandeniu sudaro: azoto laisva pora priima vandenilį iš vandens. Todėl mažos molekulės aminai tirpsta vandenyje, nors verda žemai.',
            'A tertiary amine forms no hydrogen bonds with itself, but it does with water: the nitrogen lone pair accepts a hydrogen from water. This is why small amines dissolve in water although they boil low.')
        },
        {
          example: {
            q: [
              { p: t('Priskirkite šiuos izomerus klasėms ir išdėstykite juos virimo temperatūros didėjimo tvarka.', 'Assign these isomers to classes and arrange them in order of increasing boiling point.') },
              {
                mol: [
                  { smi: 'CCCCCN', name: t('1-pentanaminas', 'pentan-1-amine') },
                  { smi: 'CCCCNC', name: t('N-metil-1-butanaminas', 'N-methylbutan-1-amine') },
                  { smi: 'CCCN(C)C', name: t('N,N-dimetil-1-propanaminas', 'N,N-dimethylpropan-1-amine') }
                ]
              }
            ],
            steps: [
              [{ p: t('Visi trys turi formulę $C5H13N$, tad molekulinė masė ta pati ir lemia tik vandenilinių ryšių galimybė.', 'All three have the formula $C5H13N$, so the molar mass is the same and only the ability to hydrogen-bond matters.') }],
              [{ p: t('Pirmasis azotas turi vieną anglies kaimyną: pirminis aminas ($NH2$). Antrasis turi du kaimynus ir vieną H: antrinis. Trečiasis turi tris kaimynus ir nė vieno H: tretinis.', 'The first nitrogen has one carbon neighbour: a primary amine ($NH2$). The second has two neighbours and one H: secondary. The third has three neighbours and no H: tertiary.') }],
              [{ p: t('Vandenilinių ryšių galimybė mažėja nuo pirminio iki tretinio. Virimo temperatūros didėjimo tvarka: tretinis (apie 65 °C) < antrinis (apie 91 °C) < pirminis (apie 104 °C).', 'The ability to hydrogen-bond falls from primary to tertiary. Boiling points rise in the order tertiary (about 65 °C) < secondary (about 91 °C) < primary (about 104 °C).') }]
            ]
          },
          claims: [
            { formula: ['CCCCCN', 'C5H13N'] }, { formula: ['CCCCNC', 'C5H13N'] }, { formula: ['CCCN(C)C', 'C5H13N'] },
            { name: ['CCCCCN', t('1-pentanaminas', 'pentan-1-amine')] },
            { name: ['CCCCNC', t('N-metil-1-butanaminas', 'N-methylbutan-1-amine')] },
            { name: ['CCCN(C)C', t('N,N-dimetil-1-propanaminas', 'N,N-dimethylpropan-1-amine')] }
          ]
        },
        { practice: 'u15.class' },
        { practice: 'u15.bp' }
      ]
    },

    /* ---------- 2. basicity ---------- */
    {
      id: 'baz',
      title: t('Bazingumas', 'Basicity'),
      blocks: [
        { h: t('Aminas kaip bazė', 'The amine as a base') },
        {
          p: t('Azoto laisva elektronų pora gali sudaryti ryšį su protonu, todėl aminai yra Brionstedo bazės. Bazės stiprumą nusako jos konjuguotosios rūgšties (amonio jono) pKa, žymimas pKaH: kuo jis didesnis, tuo bazė stipresnė. Su rūgštimis aminai sudaro amonio druskas.',
            'The nitrogen lone pair can bond to a proton, so amines are Brønsted bases. The strength of a base is given by the pKa of its conjugate acid (the ammonium ion), written pKaH: the larger it is, the stronger the base. With acids, amines form ammonium salts.'),
          src: 'T p97'
        },
        {
          scheme: { items: [{ smi: 'CCN' }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'CC[NH3+].[Cl-]' }] },
          caption: t('Etanaminas ir $HCl$: etilamonio chloridas.', 'Ethanamine and $HCl$: ethylammonium chloride.'),
          src: 'T p97'
        },
        {
          table: {
            head: [t('Bazė', 'Base'), t('Pavadinimas', 'Name'), t('pKaH (konjuguotosios rūgšties)', 'pKaH (conjugate acid)')],
            rows: [
              [{ smi: 'CCN(CC)CC', name: t('N,N-dietiletanaminas', 'N,N-diethylethanamine') }, t('N,N-dietiletanaminas', 'N,N-diethylethanamine'), f('10,75')],
              [{ smi: 'CN', name: t('metanaminas', 'methanamine') }, t('metanaminas', 'methanamine'), f('10,6')],
              [{ smi: 'N', name: t('amoniakas', 'ammonia') }, t('amoniakas', 'ammonia'), f('9,25')],
              [{ smi: 'c1ccncc1', name: t('piridinas', 'pyridine') }, t('piridinas', 'pyridine'), f('5,2')],
              [{ smi: 'Cc1ccc(N)cc1', name: t('4-metilbenzenaminas', '4-methylaniline') }, t('4-metilbenzenaminas', '4-methylaniline'), f('5,1')],
              [{ smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }, t('benzenaminas', 'aniline'), f('4,6')],
              [{ smi: 'Nc1ccc([N+](=O)[O-])cc1', name: t('4-nitrobenzenaminas', '4-nitroaniline') }, t('4-nitrobenzenaminas', '4-nitroaniline'), f('1,0')],
              [{ smi: 'CC(N)=O', name: t('etanamidas', 'ethanamide') }, t('etanamidas', 'ethanamide'), f('−0,5 (apie)')]
            ]
          },
          caption: t('Apytikslės pKaH vertės: kuo didesnė, tuo stipresnė bazė.', 'Approximate pKaH values: the larger, the stronger the base.'),
          src: 'Klein'
        },
        {
          rule: t('Bazingumas auga didėjant elektronų tankiui ant azoto: alifatiniai aminai (pKaH 10–11) > amoniakas (9,25) > aromatiniai aminai (apie 4–5). Amidai praktiškai nebazingi.',
            'Basicity grows with the electron density on nitrogen: aliphatic amines (pKaH 10-11) > ammonia (9.25) > aromatic amines (about 4-5). Amides are practically not basic.'),
          src: 'T p97'
        },
        { h: t('Kodėl anilinas silpnesnė bazė', 'Why aniline is a weaker base') },
        {
          p: t('Anilino azoto laisva pora konjuguota su benzeno žiedu ($p,π$-konjugacija): žiedas yra elektronų akceptorius, ir elektronų tankis ant azoto sumažėja. Todėl sugebėjimas prijungti protoną susilpnėja. Alkilo grupės, priešingai, elektronų tankį didina (+I).',
            'The aniline nitrogen lone pair is conjugated with the benzene ring ($p,π$ conjugation): the ring is an electron acceptor, so the electron density on nitrogen drops and the ability to take a proton weakens. Alkyl groups, in contrast, add electron density (+I).'),
          src: 'T p97'
        },
        {
          resonance: [{ smi: 'Nc1ccccc1' }, { smi: '[NH2+]=C1[CH-]C=CC=C1' }, { smi: '[NH2+]=C1C=C[CH-]C=C1' }],
          caption: t('Anilino rezonansinės formulės: elektronų pora iš azoto pasislenka į žiedą.', 'Resonance structures of aniline: the lone pair moves from nitrogen into the ring.')
        },
        {
          p: t('Pakaitai žiede keičia bazingumą. Elektronų donorai ($CH3$, $OCH3$) padidina elektronų tankį ir bazingumą, elektronų akceptoriai ($NO2$, halogenai) jį sumažina. Stiprus akceptorius $NO2$ para padėtyje per žiedą ištraukia azoto porą ir bazingumas krinta apie tūkstantį kartų.',
            'Ring substituents change the basicity. Electron donors ($CH3$, $OCH3$) raise the electron density and the basicity; acceptors ($NO2$, halogens) lower it. A strong acceptor such as $NO2$ in the para position pulls the nitrogen pair through the ring and the basicity drops by a factor of about a thousand.'),
          src: 'Klein'
        },
        { h: t('Amidai nėra bazės', 'Amides are not bases') },
        {
          resonance: [{ smi: 'CC(=O)N' }, { smi: 'CC([O-])=[NH2+]' }],
          caption: t('Amide azoto pora delokalizuota į karbonilo grupę.', 'In an amide the nitrogen pair is delocalised into the carbonyl group.')
        },
        {
          pitfall: t('Amido azotas, nors ir turi laisvą porą, nėra bazinis: pora dalyvauja $p,π$-konjugacijoje su $C=O$. Taip pat nebazinis sulfonamido azotas ir indolo bei pirolo $NH$ azotas, kurio pora yra aromatinio sekstetas dalis.',
            'An amide nitrogen is not basic even though it has a lone pair: the pair takes part in $p,π$ conjugation with $C=O$. The same holds for a sulfonamide nitrogen and for the $NH$ of indole and pyrrole, whose pair is part of the aromatic sextet.'),
          src: 'Klein'
        },
        {
          rule: t('Kuris azotas molekulėje bazingiausias? Seka: alifatinis amino azotas (sp3, pKaH 9–11) > piridino tipo azotas (apie 5) ≈ aromatinis amino azotas (4–5) > amidų, sulfonamidų ir indolo azotas (nebazinis).',
            'Which nitrogen in a molecule is the most basic? The order: aliphatic amine nitrogen (sp3, pKaH 9-11) > pyridine-type nitrogen (about 5) ≈ aromatic amine nitrogen (4-5) > amide, sulfonamide and indole nitrogen (not basic).'),
          src: 'S7.2'
        },
        {
          example: {
            q: [
              { p: t('Prokainas turi du azoto atomus. Kuris iš jų bazingesnis ir kuris protonuojamas veikiant vienu ekvivalentu $HCl$? Atomų numeriai nurodyti paveikslėlyje.', 'Procaine has two nitrogen atoms. Which is more basic, and which is protonated by one equivalent of $HCl$? The atom numbers are shown in the drawing.') },
              { mol: { smi: 'CCN(CC)CCOC(=O)c1ccc(N)cc1', opts: { numbers: [2, 14] } } }
            ],
            steps: [
              [{ p: t('Atomas Nr. 3 yra tretinio amino azotas: trys sp3 anglies kaimynai, laisva pora nekonjuguota.', 'Atom no. 3 is the nitrogen of a tertiary amine: three sp3 carbon neighbours, and the lone pair is not conjugated.') }],
              [{ p: t('Atomas Nr. 15 yra aromatinio amino azotas: jis sujungtas su benzeno žiedu, kurio $p$-padėtyje yra elektronų akceptorius (esterio grupė). Pora konjuguota, todėl bazingumas mažas.', 'Atom no. 15 is an aromatic amine nitrogen: it is bonded to the benzene ring, which carries an electron-accepting ester group in the para position. The pair is conjugated, so the basicity is low.') }],
              [{ p: t('Bazingesnis yra atomas Nr. 3 (pKaH apie 9), o ne Nr. 15 (apie 2). Vienas ekvivalentas $HCl$ protonuoja atomą Nr. 3.', 'Atom no. 3 is the more basic one (pKaH about 9) rather than no. 15 (about 2). One equivalent of $HCl$ protonates atom no. 3.') }]
            ]
          },
          claims: [{ formula: ['CCN(CC)CCOC(=O)c1ccc(N)cc1', 'C13H20N2O2'] }, { react: ['amine.protonate', ['CCN(CC)CCOC(=O)c1ccc(N)cc1'], { X: 'Cl' }, 'CC[NH+](CC)CCOC(=O)c1ccc(N)cc1.[Cl-]'] }]
        },
        { h: t('Rūgščių ir bazių reakcijos kryptis', 'The direction of an acid-base reaction') },
        {
          rule: t('Pusiausvyra pasislinkusi į silpnesnės rūgšties ir silpnesnės bazės pusę. Palyginkite dviejų amonio jonų pKaH: reakcija vyksta nuo rūgštesnio amonio jono (mažesnis pKaH) prie stipresnės bazės (didesnis pKaH).',
            'The equilibrium lies on the side of the weaker acid and the weaker base. Compare the pKaH of the two ammonium ions: the reaction proceeds from the more acidic ammonium ion (smaller pKaH) to the stronger base (larger pKaH).'),
          src: 'S7.3'
        },
        {
          example: {
            q: [
              { p: t('Ar vyksta ši reakcija nurodyta kryptimi? Trietilamonio jono pKa 10,75; anilinio jono pKa 4,6.', 'Does this reaction proceed in the direction shown? The pKa of the triethylammonium ion is 10.75; that of the anilinium ion is 4.6.') },
              { scheme: { items: [{ smi: 'CC[NH+](CC)CC' }, { plus: true }, { smi: 'Nc1ccccc1' }, { arrow: '→' }, { smi: 'CCN(CC)CC' }, { plus: true }, { smi: 'c1ccccc1[NH3+]' }] } }
            ],
            steps: [
              [{ p: t('Kairėje yra rūgštis $Et3NH+$ (pKa 10,75), dešinėje – rūgštis $PhNH3+$ (pKa 4,6).', 'On the left is the acid $Et3NH+$ (pKa 10.75), on the right the acid $PhNH3+$ (pKa 4.6).') }],
              [{ p: t('Silpnesnė rūgštis yra trietilamonio jonas (didesnis pKa), todėl pusiausvyra pasislinkusi į kairę pusę: stipresnė bazė yra trietilaminas.', 'The weaker acid is the triethylammonium ion (larger pKa), so the equilibrium lies on the left: the stronger base is triethylamine.') }],
              [{ p: t('Ši kryptimi reakcija nevyksta (skirtumas apie 6 pKa vienetus, pusiausvyros konstanta apie $10-6$). Vyksta atvirkštinė: anilinio jonas atiduoda protoną trietilaminui.', 'The reaction does not proceed in this direction (a difference of about 6 pKa units, an equilibrium constant of about $10-6$). The reverse reaction occurs: the anilinium ion gives its proton to triethylamine.') }]
            ]
          },
          claims: [{ formula: ['CCN(CC)CC', 'C6H15N'] }, { formula: ['Nc1ccccc1', 'C6H7N'] }]
        },
        { practice: 'u15.basic' },
        { practice: 'u15.drug' },
        { practice: 'u15.acidbase' }
      ]
    },

    /* ---------- 3. nucleophile: alkylation, acylation ---------- */
    {
      id: 'nuk',
      title: t('Aminas kaip nukleofilas: alkilinimas ir acilinimas', 'The amine as a nucleophile: alkylation and acylation'),
      blocks: [
        { h: t('Ta pati laisva pora: bazė ar nukleofilas?', 'The same lone pair: base or nucleophile?') },
        {
          p: t('Laisva azoto pora gali atakuoti protoną arba anglies atomą. Su rūgštimi ($HCl$) aminas elgiasi kaip bazė: prijungia protoną ir susidaro amonio druska. Su halogenalkanu ar acilo chloridu jis elgiasi kaip nukleofilas: sudaro $C-N$ ryšį. Stebimas elgesys priklauso nuo partnerio, o ne nuo to, ar aminas „geras“.',
            'The nitrogen lone pair can attack a proton or a carbon atom. With an acid ($HCl$) the amine acts as a base: it takes a proton and an ammonium salt forms. With an alkyl halide or an acyl chloride it acts as a nucleophile: it forms a $C-N$ bond. The behaviour depends on the partner.'),
          src: 'T p97'
        },
        {
          mech: [{
            scheme: { items: [{ smi: 'CCNC(C)C', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'Cl', opts: { allH: true } }] },
            arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
            note: t('Bazinis elgesys: laisva pora atakuoja protoną, $H-Cl$ elektronai pereina chlorui.', 'Basic behaviour: the lone pair attacks the proton and the $H-Cl$ electrons go to chlorine.')
          }],
          caption: t('N-etil-2-propanaminas su $HCl$.', 'N-ethylpropan-2-amine with $HCl$.')
        },
        { scheme: { items: [{ smi: 'CCNC(C)C' }, { plus: true }, { smi: 'Cl' }, { arrow: '→' }, { smi: 'CC[NH2+]C(C)C.[Cl-]' }] } },
        {
          mech: [{
            scheme: { items: [{ smi: 'CCNC(C)C', opts: { lonePairs: [2] } }, { plus: true }, { smi: 'CCBr', opts: { lonePairs: [2] } }] },
            arrows: [{ from: { m: 0, lp: 2 }, to: { m: 1, a: 1 } }, { from: { m: 1, b: [1, 2] }, to: { m: 1, a: 2 } }],
            note: t('Nukleofilinis elgesys ($SN2$): laisva pora atakuoja anglį, o $C-Br$ elektronai pereina bromui.', 'Nucleophilic behaviour ($SN2$): the lone pair attacks carbon and the $C-Br$ electrons go to bromine.')
          }],
          caption: t('Tas pats aminas su bromoetanu.', 'The same amine with bromoethane.')
        },
        { scheme: { items: [{ smi: 'CCNC(C)C' }, { plus: true }, { smi: 'CCBr' }, { arrow: '→' }, { smi: 'CC[NH+](CC)C(C)C.[Br-]' }] } },
        { h: t('Alkilinimas', 'Alkylation') },
        {
          p: t('Aminai reaguoja su halogenalkanais nukleofilinio pakeitimo ($SN2$) būdu ir sudaro amonio druskas, iš kurių šarmas ($NaOH$) išlaisvina aminą. Gautas aminas yra toks pat nukleofilas kaip pradinis, todėl reakcija nesustoja ties vienu žingsniu ir gaunamas aminų mišinys, kol susidaro ketvirtinė amonio druska.',
            'Amines react with alkyl halides by nucleophilic substitution ($SN2$) to give ammonium salts, from which alkali ($NaOH$) frees the amine. The new amine is as good a nucleophile as the old one, so the reaction does not stop after one step: a mixture of amines results, up to the quaternary ammonium salt.'),
          src: 'T p97'
        },
        {
          scheme: { items: [{ smi: 'CN' }, { plus: true }, { smi: 'CCBr' }, { arrow: '→' }, { smi: 'CC[NH2+]C.[Br-]' }, { arrow: '→', above: f('NaOH'), below: t('− $H2O$, − $NaBr$', '− $H2O$, − $NaBr$') }, { smi: 'CNCC' }] },
          caption: t('Metanaminas ir bromoetanas: amonio druska, po to laisvas antrinis aminas.', 'Methanamine and bromoethane: the ammonium salt, then the free secondary amine.')
        },
        {
          scheme: { items: [{ smi: 'N' }, { arrow: '→', above: f('CH3I') }, { smi: 'CN' }, { arrow: '→', above: f('CH3I') }, { smi: 'CNC' }, { arrow: '→', above: f('CH3I') }, { smi: 'CN(C)C' }, { arrow: '→', above: f('CH3I') }, { smi: 'C[N+](C)(C)C.[I-]' }] },
          caption: t('Nuosekliai alkilinant gaunami pirminis, antrinis, tretinis aminas ir ketvirtinė amonio druska.', 'Repeated alkylation gives the primary, secondary and tertiary amine and the quaternary ammonium salt.')
        },
        {
          pitfall: t('Aminų alkilinimas yra prastas būdas gauti vieną amino rūšį: reakcijos produktas nukleofiliškesnis už pradinį aminą. Norint gauti tik ketvirtinę druską, halogenalkano ima pertekliumi.',
            'Alkylation is a poor way to make one single amine: the product is a better nucleophile than the starting amine. To obtain only the quaternary salt, an excess of the alkyl halide is used.'),
          src: 'T p97'
        },
        { h: t('Acilinimas', 'Acylation') },
        {
          p: t('Pirminiai ir antriniai aminai su rūgščių chloridais ir anhidridais sudaro amidus (aukštesnėje temperatūroje reaguoja ir rūgštys bei esteriai). Reaktingumas mažėja eilėje: acilo chloridas > anhidridas > esteris. Reakcijoje išsiskiria $HCl$, todėl naudojamas dvigubas aminų kiekis arba bazė, pavyzdžiui, piridinas.',
            'Primary and secondary amines react with acyl chlorides and anhydrides to give amides (at higher temperature acids and esters also react). Reactivity falls in the order acyl chloride > anhydride > ester. $HCl$ is released, so a double amount of amine or a base such as pyridine is used.'),
          src: 'T p98'
        },
        {
          scheme: { items: [{ smi: 'Nc1ccccc1' }, { plus: true }, { smi: 'CC(=O)Cl' }, { arrow: '→', above: f('pyridine'), below: t('− $HCl$', '− $HCl$') }, { smi: 'CC(=O)Nc1ccccc1' }] },
          caption: t('Anilinas ir acetilchloridas: N-feniletanamidas (acetanilidas).', 'Aniline and acetyl chloride: N-phenylethanamide (acetanilide).'),
          src: 'T p98'
        },
        {
          scheme: { items: [{ smi: 'CNC' }, { plus: true }, { smi: 'CC(=O)OC(C)=O' }, { arrow: '→', below: t('− $CH3COOH$', '− $CH3COOH$') }, { smi: 'CC(=O)N(C)C' }] },
          caption: t('Dimetilaminas ir acto rūgšties anhidridas: N,N-dimetilacetamidas.', 'Dimethylamine and acetic anhydride: N,N-dimethylacetamide.'),
          src: 'T p98'
        },
        {
          p: t('Acilinimas yra nukleofilinis pakeitimas prie karbonilo anglies, vykstantis dviem stadijomis (prijungimas, po to eliminavimas). Pirma azoto pora atakuoja $C=O$ anglį, po to $C=O$ atsistato ir išeina $Cl-$.',
            'Acylation is nucleophilic substitution at the carbonyl carbon and runs in two stages (addition, then elimination). First the nitrogen pair attacks the $C=O$ carbon; then the $C=O$ is restored and $Cl-$ leaves.')
        },
        {
          mech: [{
            scheme: { items: [{ smi: 'CC(=O)Cl' }, { plus: true }, { smi: 'CN', opts: { lonePairs: [1] } }] },
            arrows: [{ from: { m: 1, lp: 1 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
            note: t('I st.: azoto pora atakuoja karbonilo anglį, $π$ ryšys pereina deguoniui.', 'Stage I: the nitrogen pair attacks the carbonyl carbon and the $π$ bond goes to oxygen.')
          }, {
            scheme: { items: [{ smi: 'CC([O-])([NH2+]C)Cl', opts: { lonePairs: [2] } }] },
            arrows: [{ from: { m: 0, lp: 2 }, to: { m: 0, mid: [1, 2] } }, { from: { m: 0, b: [1, 5] }, to: { m: 0, a: 5 } }],
            note: t('II st.: deguonies pora atkuria $C=O$, išeina chloridas.', 'Stage II: an oxygen pair restores $C=O$ and chloride leaves.')
          }],
          caption: t('Acilinimo mechanizmas (po to $H+$ nusiskiria nuo azoto).', 'The acylation mechanism ($H+$ is then lost from nitrogen).')
        },
        {
          rule: t('Amidas susidaro tik iš pirminio ar antrinio amino: acilinant prarandamas $N-H$ vandenilis. Tretinis aminas acilinimo produkto nesudaro. Amidas nebazinis, todėl acilinimas sustoja ties vienu žingsniu.',
            'An amide forms only from a primary or secondary amine: acylation removes an $N-H$ hydrogen. A tertiary amine gives no acylation product. The amide is not basic, so acylation stops after one step.'),
          src: 'T p98'
        },
        {
          example: {
            q: [{ p: t('Kokie produktai susidaro dimetilaminui reaguojant su propanoilchloridu, ir ar ta pati reakcija vyksta su trimetilaminu?', 'What forms when dimethylamine reacts with propanoyl chloride, and does the same reaction occur with trimethylamine?') }],
            steps: [
              [{ p: t('Dimetilaminas yra antrinis aminas ir turi vieną $N-H$. Azotas atakuoja karbonilo anglį, išeina $Cl-$, o $H+$ nusiskiria nuo azoto.', 'Dimethylamine is a secondary amine with one $N-H$. Nitrogen attacks the carbonyl carbon, $Cl-$ leaves and $H+$ is lost from nitrogen.') }],
              [{ scheme: { items: [{ smi: 'CNC' }, { plus: true }, { smi: 'CCC(=O)Cl' }, { arrow: '→', below: t('− $HCl$', '− $HCl$') }, { smi: 'CCC(=O)N(C)C', name: t('N,N-dimetilpropanamidas', 'N,N-dimethylpropanamide') }] } }],
              [{ p: t('Trimetilaminas yra tretinis: ant azoto nėra $H$, kurį galėtų prarasti, todėl stabilaus amido nesusidaro.', 'Trimethylamine is tertiary: there is no $H$ on nitrogen to lose, so no stable amide forms.') }]
            ]
          },
          claims: [{ react: ['amine.acyl', ['CNC', 'CCC(=O)Cl'], null, 'CCC(=O)N(C)C'] }, { name: ['CCC(=O)N(C)C', t('N,N-dimetilpropanamidas', 'N,N-dimethylpropanamide')] }]
        },
        { practice: 'u15.nuc' },
        { practice: 'u15.alkacyl' }
      ]
    },

    /* ---------- 4. HNO2 ---------- */
    {
      id: 'hno2',
      title: t('Aminų reakcijos su nitrito rūgštimi', 'Reactions of amines with nitrous acid'),
      blocks: [
        { h: t('Nitrito rūgštis ir nitrozilkatijonas', 'Nitrous acid and the nitrosyl cation') },
        {
          p: t('Nitrito rūgštis $HNO2$ nestabili, todėl ji gaminama reakcijos mišinyje iš natrio nitrito ir stiprios rūgšties ($NaNO2$, $HCl$). Rūgštyje iš jos susidaro nitrozilkatijonas $NO+$ – elektrofilas, dalyvaujantis visose šiose reakcijose.',
            'Nitrous acid $HNO2$ is unstable, so it is generated in the reaction mixture from sodium nitrite and a strong acid ($NaNO2$, $HCl$). In acid it gives the nitrosyl cation $NO+$, the electrophile of all these reactions.'),
          src: 'T p98'
        },
        {
          scheme: { items: [{ smi: 'ON=O' }, { arrow: '→', above: f('H+'), below: t('− $H2O$', '− $H2O$') }, { smi: '[O+]#N' }] },
          caption: t('Nitrito rūgštis virsta nitrozilkatijonu.', 'Nitrous acid becomes the nitrosyl cation.'),
          src: 'T p98'
        },
        {
          rule: t('Rezultatas priklauso nuo amino klasės. Pirminis alifatinis: išsiskiria $N2$. Pirminis aromatinis (0–5 °C): diazonio druska. Antrinis: N-nitrozoaminas. Tretinis aromatinis: $p$-nitrozo darinys. Tretinis alifatinis: tik druska.',
            'The result depends on the class of the amine. Primary aliphatic: $N2$ is evolved. Primary aromatic (0-5 °C): a diazonium salt. Secondary: an N-nitrosamine. Tertiary aromatic: a $p$-nitroso compound. Tertiary aliphatic: only a salt.'),
          src: 'T p98'
        },
        { h: t('Pirminiai aminai', 'Primary amines') },
        {
          p: t('Pirminis alifatinis aminas duoda alifatinę diazonio druską, kuri nestabili net šaltyje: iš karto skyla į $N2$ ir karbokatijoną. Katijonas virsta halogenalkano, alkoholio ir alkeno mišiniu, todėl sintezei reakcija netinka, bet išsiskiriantis $N2$ yra kiekybinis ir naudojamas analizėje.',
            'A primary aliphatic amine gives an aliphatic diazonium salt that is unstable even in the cold: it loses $N2$ at once and leaves a carbocation. The cation becomes a mixture of alkyl halide, alcohol and alkene, so the reaction is useless for synthesis, but the $N2$ evolved is quantitative and is used in analysis.'),
          src: 'T p99'
        },
        {
          scheme: { items: [{ smi: 'CC(C)N' }, { arrow: '→', above: f('NaNO2, HCl'), below: t('− $H2O$', '− $H2O$') }, { smi: 'CC(C)[N+]#N' }, { arrow: '→', below: t('− $N2$', '− $N2$') }, { smi: 'C[CH+]C' }] },
          caption: t('Izopropilaminas: diazonio druska ir karbokatijonas.', 'Isopropylamine: the diazonium salt and the carbocation.'),
          src: 'T p99'
        },
        {
          scheme: { items: [{ smi: 'C[CH+]C' }, { arrow: '→', above: f('H2O, −H+') }, { smi: 'CC(C)O' }, { plus: true }, { smi: 'CC(C)Cl' }, { plus: true }, { smi: 'CC=C' }] },
          caption: t('Karbokatijonas virsta alkoholiu, halogenalkanu ir alkenu mišiniu.', 'The carbocation gives a mixture of alcohol, alkyl halide and alkene.'),
          src: 'T p99'
        },
        {
          p: t('Pirminis aromatinis aminas su $HNO2$ 0–5 °C temperatūroje sudaro arildiazonio druską. Ji žymiai stabilesnė už alifatinę ir tirpale išsilaiko, kol šalta; šildant skyla ir išsiskiria $N2$. Diazonio druskos – svarbiausi tarpiniai junginiai aromatinių junginių sintezėje.',
            'A primary aromatic amine gives an aryldiazonium salt with $HNO2$ at 0-5 °C. It is much more stable than the aliphatic kind and survives in solution while cold; on warming it decomposes with loss of $N2$. Diazonium salts are the key intermediates of aromatic synthesis.'),
          src: 'T p99'
        },
        {
          scheme: { items: [{ smi: 'Nc1ccccc1' }, { arrow: '→', above: f('NaNO2, HCl, 0–5 °C'), below: t('− $H2O$', '− $H2O$') }, { smi: 'c1ccccc1[N+]#N.[Cl-]', name: t('benzendiazonio chloridas', 'benzenediazonium chloride') }] },
          caption: t('Diazotinimas: anilinas virsta benzendiazonio chloridu.', 'Diazotisation: aniline becomes benzenediazonium chloride.'),
          src: 'T p99'
        },
        { h: t('Antriniai ir tretiniai aminai', 'Secondary and tertiary amines') },
        {
          p: t('Visi antriniai aminai, ir alifatiniai, ir aromatiniai, duoda N-nitrozoaminus. Jie stipriai kancerogeniški: skrandyje nitritai gali reaguoti su antriniais aminais, esančiais maiste ar vaistuose.',
            'Secondary amines, aliphatic and aromatic, give N-nitrosamines. These are strong carcinogens: in the stomach, nitrite can react with secondary amines present in food or drugs.'),
          src: 'T p100'
        },
        {
          scheme: { items: [{ smi: 'CNC' }, { arrow: '→', above: f('NaNO2, HCl') }, { smi: 'CN(C)N=O' }, { plus: true }, { smi: 'CNc1ccccc1' }, { arrow: '→', above: f('NaNO2, HCl') }, { smi: 'CN(N=O)c1ccccc1' }] },
          caption: t('Dimetilaminas ir N-metilanilinas virsta N-nitrozoaminais.', 'Dimethylamine and N-methylaniline give N-nitrosamines.'),
          src: 'T p100'
        },
        {
          p: t('Tretinis aromatinis aminas turi aktyvuotą žiedą: nitrozilkatijonas atakuoja žiedą ($SE$ reakcija) ir nitrozo grupė patenka tik į $p$-padėtį. Tretinis alifatinis aminas tik sudaro druską, nes neturi $N-H$ ir stabilaus nitrozo darinio negauna.',
            'A tertiary aromatic amine has an activated ring: the nitrosyl cation attacks the ring (an $SE$ reaction) and the nitroso group enters only the para position. A tertiary aliphatic amine just forms a salt, since it has no $N-H$ and gives no stable nitroso product.'),
          src: 'T p101'
        },
        {
          scheme: { items: [{ smi: 'CN(C)c1ccccc1' }, { arrow: '→', above: f('NaNO2, HCl, 8 °C') }, { smi: 'CN(C)c1ccc(cc1)N=O' }] },
          caption: t('N,N-dimetilanilinas virsta N,N-dimetil-4-nitrozoanilinu.', 'N,N-dimethylaniline gives N,N-dimethyl-4-nitrosoaniline.'),
          src: 'T p101'
        },
        {
          pitfall: t('Anilinas su $HNO2$ šaltyje neišskiria $N2$ – susidaro diazonio druska. Dujos išsiskiria iš pirminių alifatinių aminų arba kai arildiazonio tirpalas sušildomas. Todėl klausimas „kuris aminas išskiria $N2$ žemoje temperatūroje“ turi vieną atsakymą: pirminį alifatinį.',
            'Aniline does not evolve $N2$ with $HNO2$ in the cold: a diazonium salt forms. Gas comes from primary aliphatic amines, or when an aryldiazonium solution is warmed. So "which amine evolves $N2$ at low temperature" has one answer: the primary aliphatic one.')
        },
        {
          table: {
            head: [t('Aminas', 'Amine'), t('Su $NaNO2$ / $HCl$', 'With $NaNO2$ / $HCl$')],
            rows: [
              [t('pirminis alifatinis', 'primary aliphatic'), t('$N2$ + alkoholių, halogenalkanų, alkenų mišinys', '$N2$ + a mixture of alcohol, alkyl halide, alkene')],
              [t('pirminis aromatinis', 'primary aromatic'), t('diazonio druska (0–5 °C), $N2$ neišsiskiria', 'a diazonium salt (0-5 °C), no $N2$')],
              [t('antrinis', 'secondary'), t('N-nitrozoaminas', 'an N-nitrosamine')],
              [t('tretinis aromatinis', 'tertiary aromatic'), t('$p$-nitrozo darinys', 'the $p$-nitroso compound')],
              [t('tretinis alifatinis', 'tertiary aliphatic'), t('tik amonio druska', 'only the ammonium salt')]
            ]
          },
          src: 'T p98'
        },
        {
          example: {
            q: [
              { p: t('Kokie produktai susidaro iš 4-metoksianilino ir iš N-metil-4-metoksianilino su $NaNO2$ / $HCl$ 0–5 °C temperatūroje?', 'What forms from 4-methoxyaniline and from N-methyl-4-methoxyaniline with $NaNO2$ / $HCl$ at 0-5 °C?') },
              { mol: [{ smi: 'COc1ccc(N)cc1', name: t('4-metoksibenzenaminas', '4-methoxyaniline') }, { smi: 'COc1ccc(NC)cc1', name: t('N-metil-4-metoksibenzenaminas', '4-methoxy-N-methylaniline') }] }
            ],
            steps: [
              [{ p: t('Pirmasis yra pirminis aromatinis aminas ($NH2$ prie žiedo): šaltyje susidaro diazonio druska.', 'The first is a primary aromatic amine ($NH2$ on the ring): in the cold a diazonium salt forms.') }, { mol: { smi: 'COc1ccc(cc1)[N+]#N.[Cl-]' } }],
              [{ p: t('Antrasis yra antrinis aminas (vienas $N-H$): susidaro N-nitrozoaminas, žiedas nesikeičia.', 'The second is a secondary amine (one $N-H$): an N-nitrosamine forms and the ring is unchanged.') }, { mol: { smi: 'COc1ccc(cc1)N(C)N=O' } }]
            ]
          },
          claims: [
            { react: ['amine.hno2', ['COc1ccc(N)cc1'], null, 'COc1ccc(cc1)[N+]#N.[Cl-]'] },
            { react: ['amine.hno2', ['COc1ccc(NC)cc1'], null, 'COc1ccc(cc1)N(C)N=O'] }
          ]
        },
        { practice: 'u15.hno2' },
        { practice: 'u15.n2' }
      ]
    },

    /* ---------- 5. diazonium chemistry ---------- */
    {
      id: 'diazo',
      title: t('Diazonio druskų pakeitimas ir daugiapakopės schemos', 'Replacement of the diazonium group and multi-step schemes'),
      blocks: [
        { h: t('Diazonio grupė kaip nueinančioji grupė', 'The diazonium group as a leaving group') },
        {
          p: t('Arildiazonio jonas $ArN2+$ turi puikią nueinančią grupę: azoto molekulę $N2$. Todėl diazonio grupę galima pakeisti daugeliu kitų grupių, tokių, kurių tiesiogiai į žiedą įvesti sunku (cianogrupė, jodas, fluoras, hidroksilas). Reakcijos vyksta šaltame tirpale, išsiskiria $N2$.',
            'The aryldiazonium ion $ArN2+$ has an excellent leaving group: the nitrogen molecule $N2$. The diazonium group can therefore be replaced by many others, some of which are hard to put on a ring directly (cyano, iodo, fluoro, hydroxyl). The reactions run in cold solution and $N2$ is evolved.'),
          src: 'T p99'
        },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), t('Produktas iš 4-metilbenzendiazonio druskos', 'Product from the 4-methylbenzenediazonium salt')],
            rows: [
              [f('$CuCl$'), { smi: 'Cc1ccc(cc1)Cl', name: t('1-chlor-4-metilbenzenas', '1-chloro-4-methylbenzene') }],
              [f('$CuBr$'), { smi: 'Cc1ccc(cc1)Br', name: t('1-brom-4-metilbenzenas', '1-bromo-4-methylbenzene') }],
              [f('$CuCN$'), { smi: 'Cc1ccc(cc1)C#N', name: t('4-metilbenzenkarbonitrilas', '4-methylbenzonitrile') }],
              [f('$KI$'), { smi: 'Cc1ccc(cc1)I', name: t('1-jod-4-metilbenzenas', '1-iodo-4-methylbenzene') }],
              [f('$H2O$, t°  ($Cu2O$, $Cu2+$)'), { smi: 'Cc1ccc(cc1)O', name: t('4-metilfenolis', '4-methylphenol') }],
              [f('$H3PO2$, $H2O$'), { smi: 'Cc1ccccc1', name: t('metilbenzenas', 'methylbenzene') }],
              [f('1) $HBF4$  2) t°'), { smi: 'Cc1ccc(F)cc1', name: t('1-fluor-4-metilbenzenas', '1-fluoro-4-methylbenzene') }]
            ]
          },
          caption: t('Diazonio druskos virsmai: $Cu(I)$ druskos (Zandmeierio reakcijos) ir kiti reagentai.', 'Transformations of the diazonium salt: $Cu(I)$ salts (Sandmeyer reactions) and other reagents.'),
          src: 'T p100'
        },
        {
          rule: t('$CuCl$, $CuBr$ ir $CuCN$ įveda $Cl$, $Br$ ir $CN$; $KI$ – jodą (vario nereikia); $H2O$ ir šildymas – $OH$ (fenolis); $H3PO2$ pakeičia $N2+$ vandeniliu; $HBF4$, po to šildymas – fluoru.',
            '$CuCl$, $CuBr$ and $CuCN$ introduce $Cl$, $Br$ and $CN$; $KI$ gives iodine (no copper needed); $H2O$ with heating gives $OH$ (a phenol); $H3PO2$ replaces $N2+$ by hydrogen; $HBF4$ followed by heating gives fluorine.'),
          src: 'T p100'
        },
        {
          pitfall: t('Hidrolizei reikia šildyti, o diazotinimui – šaldyti. Jei diazonio tirpalas ilgai stovi šiltas, susidaro fenolis ir išsiskiria $N2$ dar prieš pridedant reagentą.',
            'Hydrolysis needs heating, diazotisation needs cooling. If the diazonium solution stands warm, it gives the phenol and $N2$ before the reagent is added.')
        },
        { h: t('Nitrogrupė kaip būdas gauti aminą', 'The nitro group as a route to the amine') },
        {
          p: t('Aromatinius aminus patogu gauti iš nitrodarinių: žiedą nitrina, po to nitrogrupę redukuoja metalu rūgštyje ($Fe$, $H3O+$). Taip derinamos $SE$ reakcija (nitrinimas), redukcija ir diazonio chemija.',
            'Aromatic amines are conveniently made from nitro compounds: the ring is nitrated, then the nitro group is reduced by a metal in acid ($Fe$, $H3O+$). This joins an $SE$ reaction (nitration), a reduction and diazonium chemistry.'),
          src: 'Klein'
        },
        {
          scheme: { items: [{ smi: 'c1ccccc1' }, { arrow: '→', above: f('HNO3, H2SO4') }, { smi: '[O-][N+](=O)c1ccccc1' }, { arrow: '→', above: f('Fe, H3O+') }, { smi: 'Nc1ccccc1' }, { arrow: '→', above: f('NaNO2, HCl, 0–5 °C') }, { smi: 'c1ccccc1[N+]#N.[Cl-]' }] },
          caption: t('Benzenas, nitrobenzenas, anilinas, diazonio druska.', 'Benzene, nitrobenzene, aniline, the diazonium salt.'),
          src: 'Klein'
        },
        {
          rule: t('Daugiapakopėse schemose žiūrėkite į kiekvieną žingsnį atskirai: koks reagentas, kuri grupė keičiasi, kur nukreipia esami pakaitai. Pakaitų nukreipimas (o,p arba m) sprendžia, kokioje eilėje atlikti žingsnius.',
            'In multi-step schemes look at each step on its own: which reagent, which group changes, where the existing substituents direct. The directing effects (o,p or m) decide the order of the steps.'),
          src: 'S7.8'
        },
        {
          example: {
            q: [
              { p: t('4-chloranilinas apdorojamas: 1) $NaNO2$ / $HCl$, 0–5 °C, tada $CuCN$; 2) $H2O$ / $H+$, šildant; 3) $Br2$ / $FeBr3$. Kokie junginiai A, B ir C susidaro?', '4-Chloroaniline is treated with: 1) $NaNO2$ / $HCl$, 0-5 °C, then $CuCN$; 2) $H2O$ / $H+$, heat; 3) $Br2$ / $FeBr3$. What are the compounds A, B and C?') },
              { mol: { smi: 'Nc1ccc(Cl)cc1', name: t('4-chlorbenzenaminas', '4-chloroaniline') } }
            ],
            steps: [
              [{ p: t('Diazotinimas ir Zandmeierio reakcija pakeičia $NH2$ grupę $CN$ grupe. A yra 4-chlorbenzonitrilas.', 'Diazotisation and the Sandmeyer reaction replace $NH2$ by $CN$. A is 4-chlorobenzonitrile.') }, { mol: { smi: 'N#Cc1ccc(Cl)cc1', name: t('4-chlorbenzenkarbonitrilas', '4-chlorobenzonitrile') } }],
              [{ p: t('Nitrilas rūgštyje hidrolizuojasi iki karboksirūgšties. B yra 4-chlorbenzenkarboksirūgštis.', 'A nitrile is hydrolysed in acid to the carboxylic acid. B is 4-chlorobenzoic acid.') }, { mol: { smi: 'OC(=O)c1ccc(Cl)cc1', name: t('4-chlorbenzenkarboksirūgštis', '4-chlorobenzoic acid') } }],
              [{ p: t('$COOH$ yra $m$-orientantas, $Cl$ – $o,p$-orientantas. Padėtis, esanti $o$ chlorui, yra $m$ karboksilo grupei: abu pakaitai nukreipia bromą į tą pačią vietą. C yra 3-brom-4-chlorbenzenkarboksirūgštis.', '$COOH$ is a $m$-director and $Cl$ an $o,p$-director. The position ortho to chlorine is meta to the carboxyl group, so both substituents direct bromine to the same place. C is 3-bromo-4-chlorobenzoic acid.') }, { mol: { smi: 'OC(=O)c1ccc(Cl)c(Br)c1', name: t('3-brom-4-chlorbenzenkarboksirūgštis', '3-bromo-4-chlorobenzoic acid') } }]
            ]
          },
          claims: [
            { react: ['diazo.sub', ['Clc1ccc(cc1)[N+]#N.[Cl-]'], { with: 'CuCN' }, 'N#Cc1ccc(Cl)cc1'] },
            { react: ['nitrile.hydrolysis', ['N#Cc1ccc(Cl)cc1'], null, 'OC(=O)c1ccc(Cl)cc1'] },
            { react: ['sear', ['OC(=O)c1ccc(Cl)cc1'], { E: 'Br' }, 'OC(=O)c1ccc(Cl)c(Br)c1'] }
          ]
        },
        { practice: 'u15.diazo' },
        { practice: 'u15.scheme' }
      ]
    },

    /* ---------- 6. ring reactions ---------- */
    {
      id: 'ring',
      title: t('Aromatinių aminų žiedo reakcijos', 'Ring reactions of aromatic amines'),
      blocks: [
        { h: t('Aktyvuotas žiedas', 'An activated ring') },
        {
          p: t('Amino grupė yra stiprus elektronų donoras ($+M$), $o,p$-orientantas ir aktyvuojantis pakaitas. Aromatiniai aminai lengvai dalyvauja $SE$ reakcijose (halogeninime, nitrinime, sulfoninime) ir duoda $o$- ir $p$-izomerus.',
            'The amino group is a strong electron donor ($+M$), an $o,p$-director and an activating substituent. Aromatic amines enter $SE$ reactions (halogenation, nitration, sulfonation) readily and give $o$- and $p$-isomers.'),
          src: 'T p101'
        },
        {
          scheme: { items: [{ smi: 'Nc1ccccc1' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→', above: f('H2O') }, { smi: 'Nc1c(Br)cc(Br)cc1Br' }] },
          caption: t('Anilinas bromuojasi be katalizatoriaus iki 2,4,6-tribromanilino: vienos bromo molekulės neužtenka.', 'Aniline brominates without a catalyst all the way to 2,4,6-tribromoaniline: one equivalent of bromine does not stop at one substitution.')
        },
        {
          scheme: { items: [{ smi: 'Nc1ccccc1' }, { plus: true }, { smi: 'OS(=O)(=O)O' }, { arrow: '→' }, { smi: 'Nc1ccc(cc1)S(=O)(=O)O', name: t('4-aminobenzensulfonrūgštis', '4-aminobenzene-1-sulfonic acid') }, { plus: true }, { smi: 'O' }] },
          caption: t('Sulfoninimas: 4-aminobenzensulfonrūgštis.', 'Sulfonation: 4-aminobenzenesulfonic acid.'),
          src: 'T p101'
        },
        { h: t('Amino grupės apsauga acilinant', 'Protecting the amino group by acylation') },
        {
          p: t('Norint gauti monopakeistą darinį, amino grupė paverčiama amidu. Amidas vis dar $o,p$-orientantas, bet silpnesnis aktyvatorius, nes azoto pora dalijasi su karbonilu. Po reakcijos amidas hidrolizuojamas atgal į aminą.',
            'To obtain a mono-substituted product, the amino group is turned into an amide. The amide is still an $o,p$-director but a weaker activator, because the nitrogen pair is shared with the carbonyl. Afterwards the amide is hydrolysed back to the amine.'),
          src: 'Klein'
        },
        {
          scheme: { items: [{ smi: 'Nc1ccccc1' }, { arrow: '→', above: f('CH3COCl') }, { smi: 'CC(=O)Nc1ccccc1' }, { arrow: '→', above: f('Br2') }, { smi: 'CC(=O)Nc1ccc(Br)cc1' }, { arrow: '→', above: f('H3O+') }, { smi: 'Nc1ccc(Br)cc1' }] },
          caption: t('Apsauga, bromuojimas, apsaugos nuėmimas: 4-bromanilinas.', 'Protection, bromination, deprotection: 4-bromoaniline.')
        },
        {
          pitfall: t('Stiprioje rūgštyje aminas protonuojamas ir $-NH3+$ yra $m$-orientantas ir deaktyvuojantis pakaitas: nukreipimas pasikeičia. Todėl nitrinant anilino tiesiogiai rūgštyje atsiranda $m$-izomero, o sulfoninimas duoda $p$-produktą.',
            'In strong acid the amine is protonated and $-NH3+$ is a $m$-director and a deactivating substituent: the directing effect changes. This is why direct nitration of aniline in acid gives some $m$-isomer.'),
          src: 'T p101'
        },
        { h: t('Oksidacija', 'Oxidation') },
        {
          p: t('Aromatiniai aminai lėtai oksiduojasi net ore ir virsta chinonais, todėl anilinas stovėdamas patamsėja.',
            'Aromatic amines are slowly oxidised even by air to quinones, which is why aniline darkens on standing.'),
          src: 'T p101'
        },
        { scheme: { items: [{ smi: 'Nc1ccccc1' }, { arrow: '→', above: f('[O]'), below: t('− $NH3$', '− $NH3$') }, { smi: 'O=C1C=CC(=O)C=C1', name: t('benzchinonas', 'benzoquinone') }] }, src: 'T p101' },
        { practice: 'u15.scheme' }
      ]
    },

    /* ---------- 7. biological amines, cysteine ---------- */
    {
      id: 'bio',
      title: t('Biologiškai svarbūs aminai ir cisteinas', 'Biologically important amines and cysteine'),
      blocks: [
        { h: t('Aminai organizme', 'Amines in the body') },
        {
          p: t('Daug vaistų ir neuromediatorių turi aminogrupę. Neuromediatorius (adrenaliną, dopaminą, serotoniną) vienija struktūrinis motyvas $Ar-C-C-N$: aromatinis žiedas, du anglies atomai ir aminas. Toks pat motyvas yra amfetamine. Amfetaminas sintetinamas redukciniu aminimu: ketonas su $NH3$ sudaro iminą, kuris redukuojamas.',
            'Many drugs and neurotransmitters contain an amino group. The neurotransmitters (adrenaline, dopamine, serotonin) share the motif $Ar-C-C-N$: an aromatic ring, two carbons and an amine. Amphetamine contains the same motif. It is made by reductive amination: a ketone and $NH3$ give an imine, which is reduced.'),
          src: 'T p102'
        },
        {
          mol: [
            { smi: 'NCCc1ccc(O)c(O)c1', caption: t('dopaminas', 'dopamine') },
            { smi: 'CNCC(O)c1ccc(O)c(O)c1', caption: t('adrenalinas', 'adrenaline') },
            { smi: 'CC(N)Cc1ccccc1', name: t('1-fenil-2-propanaminas', '1-phenylpropan-2-amine') }
          ],
          caption: t('Dopaminas, adrenalinas ir amfetaminas: visuose yra motyvas $Ar-C-C-N$.', 'Dopamine, adrenaline and amphetamine: all contain the motif $Ar-C-C-N$.')
        },
        {
          scheme: { items: [{ smi: 'CC(=O)Cc1ccccc1' }, { plus: true }, { smi: 'N' }, { arrow: '→', below: t('$AN$, − $H2O$', '$AN$, − $H2O$') }, { smi: 'CC(=N)Cc1ccccc1' }, { arrow: '→', above: f('H2, Ni') }, { smi: 'CC(N)Cc1ccccc1' }] },
          caption: t('Fenilpropanonas, iminas, amfetaminas.', 'Phenylpropanone, the imine, amphetamine.'),
          src: 'T p102'
        },
        { h: t('Cisteinas: amino, karboksi ir merkaptogrupė', 'Cysteine: amino, carboxyl and thiol groups') },
        {
          p: t('Cisteinas yra $α$-aminorūgštis, kurios radikale yra $SH$ grupė. Jis daugiafunkcis: gali reaguoti kaip rūgštis, bazė ir tiolis. Tiolių rūgštingumas didesnis už alkoholių, todėl jie reaguoja su šarmais ir sunkiųjų metalų junginiais.',
            'Cysteine is an $α$-amino acid whose side chain carries an $SH$ group. It is polyfunctional and can react as an acid, a base and a thiol. Thiols are more acidic than alcohols, so they react with alkalis and with heavy-metal compounds.'),
          src: 'S7.12'
        },
        { mol: { smi: 'NC(CS)C(=O)O', caption: t('cisteinas', 'cysteine') } },
        {
          table: {
            head: [t('Reagentas', 'Reagent'), t('Kuri grupė reaguoja', 'Which group reacts'), t('Produktas', 'Product')],
            rows: [
              [t('$NaOH$ (perteklius)', '$NaOH$ (excess)'), t('$COOH$ ir $SH$', '$COOH$ and $SH$'), { smi: 'NC(C[S-])C(=O)[O-].[Na+].[Na+]' }],
              [f('$HCl$'), t('$NH2$', '$NH2$'), { smi: '[NH3+]C(CS)C(=O)O.[Cl-]' }],
              [f('$CH3OH$, $H+$'), t('$COOH$', '$COOH$'), { smi: '[NH3+]C(CS)C(=O)OC.[Cl-]' }],
              [f('$HgO$'), t('$SH$', '$SH$'), { smi: 'NC(CS[Hg]SCC(N)C(=O)O)C(=O)O' }],
              [f('$I2$, $NaOH$, $H2O$'), t('$SH$ (oksidacija)', '$SH$ (oxidation)'), { smi: 'NC(CSSCC(N)C(=O)O)C(=O)O' }]
            ]
          },
          caption: t('Cisteino reakcijos: produktai yra druska, hidrochloridas, esteris, merkaptidas ir disulfidas (cistinas).', 'Reactions of cysteine: the products are the salt, the hydrochloride, the ester, the mercaptide and the disulfide (cystine).'),
          src: 'S7.12'
        },
        { h: t('Disulfidiniai tilteliai ir baltymų struktūra', 'Disulfide bridges and protein structure') },
        {
          scheme: { items: [{ smi: 'NC(CS)C(=O)O' }, { plus: true }, { smi: 'NC(CS)C(=O)O' }, { arrow: '⇌', above: f('[O]'), below: f('[H]') }, { smi: 'NC(CSSCC(N)C(=O)O)C(=O)O' }] },
          caption: t('Du cisteino liekanos oksiduojasi į cistiną; redukcija atkuria du tiolius.', 'Two cysteines are oxidised to cystine; reduction regenerates the two thiols.'),
          src: 'S7.12'
        },
        {
          rule: t('Disulfidinis tiltelis $R-S-S-R$ jungia dvi cisteino liekanas, esančias toli viena nuo kitos grandinėje, ir „susiuva“ baltymo grandinę. Taip stabilizuojama baltymo tretinė struktūra. Oksidacija (tioliai → disulfidas) ir redukcija (disulfidas → tioliai) yra grįžtamos.',
            'A disulfide bridge $R-S-S-R$ links two cysteine residues that lie far apart in the chain and "stitches" the protein chain together. This stabilises the tertiary structure of the protein. Oxidation (thiols to disulfide) and reduction (disulfide to thiols) are reversible.'),
          src: 'S7.12'
        },
        {
          pitfall: t('Disulfidinis tiltelis susidaro oksiduojant, ne nukleofiliškai pakeičiant, ir neturi nieko bendra su peptidiniu ryšiu: peptidinis ryšys yra pagrindinės grandinės amidas ($NH-CO$), o disulfidas jungia šonines grandines.',
            'A disulfide bridge forms by oxidation, not by nucleophilic substitution, and has nothing to do with the peptide bond: the peptide bond is the amide ($NH-CO$) of the main chain, while the disulfide links side chains.')
        },
        { practice: 'u15.cys' }
      ]
    }
  ];

  /* ====================================================================== */
  /* SUMMARY                                                                */
  /* ====================================================================== */

  const SUMMARY = [
    { h: t('Santrauka: aminai', 'Summary: amines') },
    {
      table: {
        head: [t('Tema', 'Topic'), t('Taisyklė', 'Rule')],
        rows: [
          [t('klasė', 'class'), t('pagal C atomų skaičių ant $N$: 1, 2, 3; 4 = amonio druska', 'by the number of carbons on $N$: 1, 2, 3; 4 = ammonium salt')],
          [t('virimo temperatūra', 'boiling point'), t('pirminis > antrinis > tretinis (mažėja $N-H$ skaičius)', 'primary > secondary > tertiary (fewer $N-H$)')],
          [t('bazingumas', 'basicity'), t('alifatinis (10–11) > $NH3$ (9,25) > aromatinis (4–5) > amidas (nebazinis)', 'aliphatic (10-11) > $NH3$ (9.25) > aromatic (4-5) > amide (not basic)')],
          [t('pakaitai anilinuose', 'substituents in anilines'), t('donorai ($CH3$, $OCH3$) didina, akceptoriai ($NO2$, $Cl$) mažina', 'donors ($CH3$, $OCH3$) raise, acceptors ($NO2$, $Cl$) lower')],
          [t('rūgščių ir bazių kryptis', 'acid-base direction'), t('į silpnesnės rūgšties pusę (didesnis pKa)', 'toward the weaker acid (larger pKa)')],
          [t('su $H+$ / su $RX$', 'with $H+$ / with $RX$'), t('bazė: amonio druska / nukleofilas: $SN2$, amonio druska', 'base: ammonium salt / nucleophile: $SN2$, ammonium salt')],
          [t('alkilinimas', 'alkylation'), t('mišinys iki $R4N+$; perteklius halogenalkano duoda ketvirtinę druską', 'mixture up to $R4N+$; excess halide gives the quaternary salt')],
          [t('acilinimas', 'acylation'), t('tik pirminis ir antrinis; $RCOCl$ > anhidridas > esteris; amidas', 'only primary and secondary; $RCOCl$ > anhydride > ester; gives an amide')]
        ]
      }
    },
    {
      table: {
        head: [t('Su $NaNO2$ / $HCl$', 'With $NaNO2$ / $HCl$'), t('Produktas', 'Product')],
        rows: [
          [t('pirminis alifatinis', 'primary aliphatic'), t('$N2$ ir mišinys $ROH$, $RCl$, alkenas', '$N2$ and a mixture of $ROH$, $RCl$, alkene')],
          [t('pirminis aromatinis, 0–5 °C', 'primary aromatic, 0-5 °C'), t('$ArN2+ Cl-$', '$ArN2+ Cl-$')],
          [t('antrinis', 'secondary'), t('$R2N-N=O$ (kancerogenas)', '$R2N-N=O$ (carcinogen)')],
          [t('tretinis aromatinis', 'tertiary aromatic'), t('$p$-$ON-C6H4-NR2$', '$p$-$ON-C6H4-NR2$')],
          [t('tretinis alifatinis', 'tertiary aliphatic'), t('tik druska', 'only a salt')]
        ]
      }
    },
    {
      list: [
        t('Diazonio druska: $CuCl$, $CuBr$, $CuCN$, $KI$ (įveda $Cl$, $Br$, $CN$, $I$); $H2O$ ir šildymas (fenolis); $H3PO2$ ($H$).', 'Diazonium salt: $CuCl$, $CuBr$, $CuCN$, $KI$ (introduce $Cl$, $Br$, $CN$, $I$); $H2O$ and heat (phenol); $H3PO2$ ($H$).'),
        t('Nitrogrupė redukuojama į aminą: $Fe$, $H3O+$. Nitrilas hidrolizuojamas į rūgštį (arba į amidą, jei dalinė hidrolizė).', 'A nitro group is reduced to the amine: $Fe$, $H3O+$. A nitrile hydrolyses to the acid (or to the amide on partial hydrolysis).'),
        t('Žiedas: $NH2$ yra stiprus $o,p$-orientantas; acilinimas jį apsaugo ir sušvelnina.', 'Ring: $NH2$ is a strong $o,p$-director; acylation protects and moderates it.'),
        t('Cisteinas: $NaOH$ – druska ($COO-$, $S-$), $HCl$ – $NH3+$, $CH3OH$/$H+$ – esteris, $HgO$ – merkaptidas, $I2$/$NaOH$ – disulfidas (cistinas); disulfidiniai tilteliai stabilizuoja tretinę struktūrą.', 'Cysteine: $NaOH$ gives the salt ($COO-$, $S-$), $HCl$ gives $NH3+$, $CH3OH$/$H+$ the ester, $HgO$ the mercaptide, $I2$/$NaOH$ the disulfide (cystine); disulfide bridges stabilise the tertiary structure.')
      ]
    }
  ];

  /* ====================================================================== */
  /* HELPERS                                                                */
  /* ====================================================================== */

  const nl = (x) => String(x).replace('.', ',');            // Lithuanian decimal comma
  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const mol = (smi, opts) => (opts ? { mol: { smi, opts } } : { mol: { smi } });

  // atom token spans of a SMILES string, in atom order (a..b the atom, r the end including ring-closure digits)
  function spans(smi) {
    const out = [];
    let i = 0;
    while (i < smi.length) {
      const c = smi[i];
      if (c === '[') { const j = smi.indexOf(']', i); out.push({ a: i, b: j + 1, r: j + 1 }); i = j + 1; }
      else if ((c === 'C' && smi[i + 1] === 'l') || (c === 'B' && smi[i + 1] === 'r')) { out.push({ a: i, b: i + 2, r: i + 2 }); i += 2; }
      else if (/[BCNOPSFIcnops]/.test(c)) { out.push({ a: i, b: i + 1, r: i + 1 }); i++; }
      else if (c === '%') { if (out.length) out[out.length - 1].r = i + 3; i += 3; }
      else if (/[0-9]/.test(c)) { if (out.length) out[out.length - 1].r = i + 1; i++; }
      else i++;
    }
    return out;
  }
  // a branch added to atom idx (atom numbers stay valid)
  function addBranch(smi, idx, branch) {
    const sp = spans(smi);
    const at = sp[idx].r;
    return smi.slice(0, at) + '(' + branch + ')' + smi.slice(at);
  }
  // the token of atom idx replaced by another one
  function setAtom(smi, idx, token) {
    const sp = spans(smi);
    return smi.slice(0, sp[idx].a) + token + smi.slice(sp[idx].b);
  }

  // the amine nitrogen of a SMILES and its class: prim, sec, tert, quat or amide (null when there is none)
  function classify(ctx, smi) {
    const m = ctx.chem.parse(smi);
    for (let i = 0; i < m.atoms.length; i++) {
      const a = m.atoms[i];
      if (a.el !== 'N' || a.aromatic) continue;
      const cn = m.nbr[i].filter(j => m.atoms[j].el === 'C');
      if (cn.length !== m.nbr[i].length) continue;
      if (a.charge === 1 && cn.length === 4) return { n: i, cls: 'quat' };
      if (a.charge !== 0) continue;
      const amide = cn.some(j => m.nbr[j].some(k => m.atoms[k].el === 'O' && m.bondAt(j, k).order === 2));
      if (amide) return { n: i, cls: 'amide' };
      if (cn.length < 1 || cn.length > 3) continue;
      return { n: i, cls: ['prim', 'sec', 'tert'][cn.length - 1], aromatic: cn.some(j => m.atoms[j].aromatic) };
    }
    return null;
  }
  // 'N' when the molecule has N-N=O, 'C' when it has an aromatic C-N=O, otherwise null
  function nitrosoKind(ctx, smi) {
    const m = ctx.chem.parse(smi);
    for (let i = 0; i < m.atoms.length; i++) {
      if (m.atoms[i].el !== 'O') continue;
      const n = m.nbr[i].find(j => m.atoms[j].el === 'N' && m.atoms[j].charge === 0 && m.bondAt(i, j).order === 2);
      if (n === undefined) continue;
      if (m.nbr[n].some(j => m.atoms[j].el === 'N')) return 'N';
      if (m.nbr[n].some(j => m.atoms[j].aromatic)) return 'C';
    }
    return null;
  }
  const firstMajor = (res) => { const m = res.products.filter(p => p.major); return m.length === 1 ? m[0].smi : null; };
  // free amine form of an ammonium salt SMILES (cation part with the counter ion dropped)
  const freeAmine = (s) => s.split('.')[0].replace(/\[NH[123]?\+\]/g, 'N');
  const distinctOpts = (ctx, list) => {
    const seen = new Set(); const out = [];
    list.forEach(o => { const k = canon(ctx, o.mol.smi); if (!seen.has(k)) { seen.add(k); out.push(o); } });
    return out;
  };

  /* ====================================================================== */
  /* EXERCISE TYPES                                                         */
  /* ====================================================================== */

  const TYPES = [];

  /* ---------- u15.class: classification and naming (generator) ---------- */
  const CLASS_POOL = [
    ['CCN', 'ali'], ['CCCN', 'ali'], ['CC(C)N', 'ali'], ['CCCCN', 'ali'], ['CC(C)(C)N', 'ali'], ['CC(C)CN', 'ali'], ['CCC(C)N', 'ali'],
    ['CNC', 'ali'], ['CCNC', 'ali'], ['CCNCC', 'ali'], ['CCCNC', 'ali'], ['CC(C)NC', 'ali'], ['CCCNCCC', 'ali'], ['CC(C)NC(C)C', 'ali'], ['CCC(C)NC', 'ali'],
    ['CN(C)C', 'ali'], ['CCN(C)C', 'ali'], ['CCN(CC)CC', 'ali'], ['CCN(C)CC', 'ali'], ['CCCN(C)C', 'ali'], ['CCCCN(C)C', 'ali'], ['CC(C)N(C)C', 'ali'],
    ['NCc1ccccc1', 'ali'], ['CNCc1ccccc1', 'ali'], ['CN(C)Cc1ccccc1', 'ali'], ['CC(N)Cc1ccccc1', 'ali'],
    ['NC1CCCCC1', 'alic'], ['NC1CCCC1', 'alic'], ['CNC1CCCC1', 'alic'], ['CNC1CCCCC1', 'alic'], ['CN(C)C1CCCCC1', 'alic'],
    ['Nc1ccccc1', 'ar'], ['Cc1ccc(N)cc1', 'ar'], ['CNc1ccccc1', 'ar'], ['CN(C)c1ccccc1', 'ar'], ['CCNc1ccccc1', 'ar'], ['Nc1ccc(Br)cc1', 'ar'], ['COc1ccc(N)cc1', 'ar'], ['Nc1ccc([N+](=O)[O-])cc1', 'ar'], ['c1ccccc1Nc1ccccc1', 'ar'], ['CCN(CC)c1ccccc1', 'ar'],
    ['C1CCNCC1', 'het'], ['C1CCNC1', 'het'], ['CN1CCCC1', 'het'], ['CCN1CCCC1', 'het'], ['C1COCCN1', 'het'], ['CN1CCCCC1', 'het'], ['CC1CCCCN1', 'het'],
    ['C[N+](C)(C)C.[I-]', 'quat'], ['CC[N+](C)(C)C.[Br-]', 'quat'], ['CCCC[N+](CC)(CC)CC.[Br-]', 'quat'], ['C[N+](C)(C)Cc1ccccc1.[Cl-]', 'quat'],
    ['CC(=O)NC', 'amide'], ['CC(=O)N(C)C', 'amide'], ['CC(=O)Nc1ccccc1', 'amide'], ['CCC(=O)N', 'amide']
  ];
  const CLS_T = {
    prim: t('pirminis aminas', 'primary amine'), sec: t('antrinis aminas', 'secondary amine'), tert: t('tretinis aminas', 'tertiary amine'),
    quat: t('ketvirtinė amonio druska', 'quaternary ammonium salt'), amide: t('amidas (ne aminas)', 'amide (not an amine)')
  };
  const CLS_ORDER = ['prim', 'sec', 'tert', 'quat', 'amide'];
  const KIND_T = {
    ali: t('alifatinis aminas', 'aliphatic amine'), alic: t('aliciklinis aminas', 'alicyclic amine'),
    ar: t('aromatinis aminas', 'aromatic amine'), het: t('heterociklinis aminas', 'heterocyclic amine')
  };
  const KIND_ORDER = ['ali', 'alic', 'ar', 'het'];

  TYPES.push({
    id: 'u15.class',
    title: t('Aminų klasė, rūšis ir pavadinimas', 'Class, type and name of an amine'),
    mirrors: ['S7.1'],
    gen(rng, ctx) {
      const [smi, kind] = ctx.pick(CLASS_POOL);
      const c = classify(ctx, smi);
      if (!c) throw new Error('u15.class: no nitrogen in ' + smi);
      const steps = [{
        prompt: t('Kuriai klasei priklauso šis junginys?', 'Which class does this compound belong to?'),
        kind: 'choice', options: CLS_ORDER.map(k => ({ text: CLS_T[k] })), answer: CLS_ORDER.indexOf(c.cls),
        hint: t('Suskaičiuokite, kiek anglies atomų yra tiesiogiai prijungta prie azoto, ir patikrinkite, ar azotas nepriklauso amidui ar jonui.', 'Count the carbon atoms bonded directly to nitrogen, and check whether the nitrogen belongs to an amide or an ion.'),
        solution: c.cls === 'amide'
          ? t('Azotas sujungtas su karbonilo grupe ($N-C=O$): tai amidas. Jo azoto pora konjuguota su $C=O$, todėl jis nėra aminas.', 'The nitrogen is bonded to a carbonyl group ($N-C=O$): this is an amide. Its nitrogen pair is conjugated with $C=O$, so it is not an amine.')
          : c.cls === 'quat'
            ? t('Azotas turi keturis anglies kaimynus ir teigiamą krūvį: ketvirtinė amonio druska.', 'The nitrogen has four carbon neighbours and a positive charge: a quaternary ammonium salt.')
            : t('Prie azoto prijungti ' + ({ prim: 'vienas', sec: 'du', tert: 'trys' })[c.cls] + ' anglies atomai(-as): ' + CLS_T[c.cls].lt + '.', 'The nitrogen carries ' + ({ prim: 'one', sec: 'two', tert: 'three' })[c.cls] + ' carbon atom(s): a ' + CLS_T[c.cls].en + '.')
      }];
      if (c.cls === 'prim' || c.cls === 'sec' || c.cls === 'tert') {
        steps.push({
          prompt: t('Kokia šio amino rūšis pagal radikalą?', 'What type of amine is it, by its group?'),
          kind: 'choice', options: KIND_ORDER.map(k => ({ text: KIND_T[k] })), answer: KIND_ORDER.indexOf(kind),
          hint: t('Pažiūrėkite, su kuo sujungtas azotas: su nearomatine grandine, su nearomatiniu žiedu, tiesiogiai su benzeno žiedu, ar jis pats yra žiedo narys.', 'Look at what the nitrogen is bonded to: a non-aromatic chain, a non-aromatic ring, a benzene ring directly, or is it itself a member of a ring.'),
          solution: ({
            ali: t('Azotas sujungtas tik su alifatinėmis anglimis (net jei kita grandinės dalis turi benzeno žiedą): alifatinis aminas.', 'The nitrogen is bonded only to aliphatic carbons (even if another part of the chain carries a benzene ring): an aliphatic amine.'),
            alic: t('Azotas sujungtas su nearomatinio žiedo anglimi: aliciklinis aminas.', 'The nitrogen is bonded to a carbon of a non-aromatic ring: an alicyclic amine.'),
            ar: t('Azotas sujungtas tiesiogiai su benzeno žiedu: aromatinis aminas.', 'The nitrogen is bonded directly to a benzene ring: an aromatic amine.'),
            het: t('Azotas yra paties žiedo narys: heterociklinis aminas.', 'The nitrogen is itself a member of the ring: a heterocyclic amine.')
          })[kind]
        });
        const lt = ctx.name.name(smi, { lang: 'lt' }), en = ctx.name.name(smi, { lang: 'en' });
        if (lt && en) {
          steps.push({
            prompt: t('Pavadinkite junginį.', 'Name the compound.'),
            kind: 'name', mol: { smi }, answer: { smi },
            hint: t('Pavadinimas sudaromas iš anglies grandinės pavadinimo su galūne -aminas; pakaitai ant azoto žymimi $N$.', 'The name is made from the chain name with the ending -amine; substituents on nitrogen are marked $N$.'),
            solution: t(lt.name, en.name)
          });
        }
      }
      return {
        q: [{ p: t('Nustatykite junginio klasę ir rūšį.', 'Determine the class and the type of the compound.') }, { mol: { smi } }],
        steps,
        why: t('Aminų klasę lemia anglies atomų skaičius ant azoto (1, 2, 3; keturi – amonio druska). Amidas nėra aminas, nes azoto pora dalyvauja konjugacijoje su $C=O$. Rūšis priklauso nuo to, su kuo azotas sujungtas: grandine, nearomatiniu žiedu ar benzeno žiedu, arba azotas yra žiedo narys.',
          'The class of an amine is set by the number of carbons on nitrogen (1, 2, 3; four make an ammonium salt). An amide is not an amine, because its nitrogen pair is conjugated with $C=O$. The type depends on what the nitrogen is bonded to: a chain, a non-aromatic ring or a benzene ring, or the nitrogen is a ring member.'),
        src: 'T p96'
      };
    }
  });

  /* ---------- u15.bp: boiling points (bank, S7.1) ---------- */
  const bpProblem = (n, mols, orderNames, bps, reasonOpts, why, claims) => ({
    id: 'u15.bp.' + n,
    q: [{ p: t('Išdėstykite šiuos junginius virimo temperatūros didėjimo tvarka ir paaiškinkite atsakymą.', 'Arrange these compounds in order of increasing boiling point and explain the answer.') }, { mol: mols }],
    steps: [
      {
        prompt: t('Išdėstykite nuo žemiausios iki aukščiausios virimo temperatūros.', 'Arrange from the lowest to the highest boiling point.'),
        kind: 'order', options: orderNames.map(x => ({ text: x })),
        hint: t('Pagalvokite, kiek tarpmolekulinių vandenilinių ryšių gali sudaryti kiekviena molekulė ir kokie tai ryšiai.', 'Think about how many intermolecular hydrogen bonds each molecule can form and of what kind.'),
        solution: t('Virimo temperatūros (apie): ' + bps.join(' < ') + ' °C.', 'Boiling points (about): ' + bps.join(' < ') + ' °C.')
      },
      {
        prompt: t('Kuris paaiškinimas teisingas?', 'Which explanation is correct?'),
        kind: 'choice', options: reasonOpts.opts, answer: reasonOpts.answer,
        hint: t('Žiūrėkite, kuriose molekulėse yra $N-H$ ar $O-H$ ryšys ir kiek jų.', 'See which molecules contain an $N-H$ or $O-H$ bond, and how many.'),
        solution: reasonOpts.solution
      }
    ],
    why,
    src: 'S7.1',
    claims
  });
  const REASON_SET = (opts, answer, solution) => ({ opts: opts.map(o => ({ text: o })), answer, solution });
  const R_NH = t('Vandenilinių ryšių skaičius mažėja nuo pirminio iki tretinio amino, nes mažėja $N-H$ ryšių.', 'The number of hydrogen bonds falls from primary to tertiary amines because the number of $N-H$ bonds falls.');
  TYPES.push({
    id: 'u15.bp',
    title: t('Virimo temperatūra ir vandenilinis ryšys', 'Boiling point and hydrogen bonding'),
    mirrors: ['S7.1'],
    bank: [
      bpProblem(1,
        [{ smi: 'CCCN', name: t('1-propanaminas', 'propan-1-amine') }, { smi: 'CCNC', name: t('N-metiletanaminas', 'N-methylethanamine') }, { smi: 'CN(C)C', name: t('N,N-dimetilmetanaminas', 'N,N-dimethylmethanamine') }],
        [t('N,N-dimetilmetanaminas (tretinis)', 'N,N-dimethylmethanamine (tertiary)'), t('N-metiletanaminas (antrinis)', 'N-methylethanamine (secondary)'), t('1-propanaminas (pirminis)', 'propan-1-amine (primary)')], ['3', '37', '48'],
        REASON_SET([R_NH, t('Tretinis aminas turi daugiausia vandenilinių ryšių, nes jo azotas turi daugiausia radikalų.', 'The tertiary amine forms the most hydrogen bonds, because its nitrogen carries the most groups.'), t('Virimo temperatūrą lemia tik anglies atomų skaičius, o jis visiems vienodas.', 'The boiling point depends only on the number of carbons, which is the same for all.'), t('Pirminis aminas verda žemiausiai, nes jo molekulė mažiausiai šakota.', 'The primary amine boils lowest, because its molecule is the least branched.')], 0,
          t('Visų trijų formulė $C3H9N$. Pirminis aminas turi du $N-H$, antrinis – vieną, tretinis – nė vieno, todėl tretinis tarpusavyje vandenilinių ryšių nesudaro.', 'All three are $C3H9N$. The primary amine has two $N-H$, the secondary one, the tertiary none, so the tertiary amine forms no hydrogen bonds with itself.')),
        t('Izomerų su ta pačia formule virimo temperatūrą lemia vandenilinių ryšių galimybė: pirminis > antrinis > tretinis.', 'For isomers of the same formula the boiling point follows the ability to hydrogen-bond: primary > secondary > tertiary.'),
        [{ formula: ['CCCN', 'C3H9N'] }, { formula: ['CN(C)C', 'C3H9N'] }]),
      bpProblem(2,
        [{ smi: 'CCCCCCN', name: t('1-heksanaminas', 'hexan-1-amine') }, { smi: 'CCCNCCC', name: t('N-propil-1-propanaminas', 'N-propylpropan-1-amine') }, { smi: 'CCN(CC)CC', name: t('N,N-dietiletanaminas', 'N,N-diethylethanamine') }],
        [t('N,N-dietiletanaminas (tretinis)', 'N,N-diethylethanamine (tertiary)'), t('N-propil-1-propanaminas (antrinis)', 'N-propylpropan-1-amine (secondary)'), t('1-heksanaminas (pirminis)', 'hexan-1-amine (primary)')], ['89', '109', '132'],
        REASON_SET([t('Visi trys yra izomerai, todėl virimo temperatūrą lemia $N-H$ ryšių skaičius: du, vienas, nė vieno.', 'All three are isomers, so the boiling point is set by the number of $N-H$ bonds: two, one, none.'), t('Tretinis aminas turi daugiausia šakų, todėl daugiausia vandenilinių ryšių.', 'The tertiary amine has the most branches and therefore the most hydrogen bonds.'), t('Antrinis aminas turi du $N-H$, todėl verda aukščiausiai.', 'The secondary amine has two $N-H$ bonds and therefore boils highest.'), t('Virimo temperatūrą lemia tik azoto bazingumas.', 'The boiling point depends only on the basicity of nitrogen.')], 0,
          t('Visų formulė $C6H15N$. Pirminis aminas turi $NH2$ (du $N-H$), antrinis – vieną, tretinis – nė vieno; tretinis aminas verda žemiausiai.', 'All are $C6H15N$. The primary amine has $NH2$ (two $N-H$), the secondary one, the tertiary none; the tertiary amine boils lowest.')),
        t('Tos pačios molekulinės masės aminuose daugiausia vandenilinių ryšių sudaro pirminis, todėl jis verda aukščiausiai.', 'Among amines of the same molar mass the primary one forms the most hydrogen bonds, so it boils highest.'),
        [{ formula: ['CCCCCCN', 'C6H15N'] }, { formula: ['CCCNCCC', 'C6H15N'] }, { formula: ['CCN(CC)CC', 'C6H15N'] }]),
      bpProblem(3,
        [{ smi: 'CCCCO', name: t('1-butanolis', 'butan-1-ol') }, { smi: 'CCCCN', name: t('1-butanaminas', 'butan-1-amine') }, { smi: 'CCCCC', name: t('pentanas', 'pentane') }],
        [t('pentanas', 'pentane'), t('1-butanaminas', 'butan-1-amine'), t('1-butanolis', 'butan-1-ol')], ['36', '78', '118'],
        REASON_SET([t('Pentanas vandenilinių ryšių nesudaro; aminas sudaro $N-H···N$, alkoholis – stipresnius $O-H···O$, nes deguonis elektroneigiamesnis.', 'Pentane forms no hydrogen bonds; the amine forms $N-H···N$, the alcohol forms the stronger $O-H···O$ because oxygen is more electronegative.'), t('Alkoholis verda žemiau už aminą, nes deguonis mažesnis už azotą.', 'The alcohol boils lower than the amine because oxygen is smaller than nitrogen.'), t('Pentanas verda aukščiausiai, nes turi daugiausia vandenilio atomų.', 'Pentane boils highest because it has the most hydrogen atoms.'), t('Visų trijų molekulių masė beveik vienoda, todėl virimo temperatūros turi sutapti.', 'The molar masses are almost equal, so the boiling points must coincide.')], 0,
          t('Ryšys $O-H$ poliškesnis už $N-H$, todėl alkoholių vandeniliniai ryšiai stipresni. Alkanas turi tik silpnas van der Valso jėgas.', 'The $O-H$ bond is more polar than $N-H$, so alcohol hydrogen bonds are stronger. The alkane has only weak van der Waals forces.')),
        t('Vandeniliniai ryšiai kelia virimo temperatūrą; kuo poliškesnis $X-H$ ryšys, tuo stipresnis vandenilinis ryšys: alkanas < aminas < alkoholis.', 'Hydrogen bonds raise the boiling point; the more polar the $X-H$ bond, the stronger the hydrogen bond: alkane < amine < alcohol.'),
        [{ formula: ['CCCCN', 'C4H11N'] }]),
      bpProblem(4,
        [{ smi: 'CCCCN', name: t('1-butanaminas', 'butan-1-amine') }, { smi: 'CCNCC', name: t('N-etiletanaminas', 'N-ethylethanamine') }, { smi: 'CCN(C)C', name: t('N,N-dimetiletanaminas', 'N,N-dimethylethanamine') }],
        [t('N,N-dimetiletanaminas', 'N,N-dimethylethanamine'), t('N-etiletanaminas', 'N-ethylethanamine'), t('1-butanaminas', 'butan-1-amine')], ['37', '56', '78'],
        REASON_SET([R_NH, t('Tretinis aminas turi daugiausia $N-H$ ryšių.', 'The tertiary amine has the most $N-H$ bonds.'), t('Virimo temperatūrą lemia tik izomero šakotumas, o ne vandeniliniai ryšiai.', 'The boiling point depends only on the branching of the isomer, not on hydrogen bonds.'), t('Aminai su tuo pačiu anglies skaičiumi verda vienodai.', 'Amines with the same number of carbons boil equally.')], 0,
          t('Visų formulė $C4H11N$. Du $N-H$ (pirminis), vienas (antrinis), nė vieno (tretinis): virimo temperatūra mažėja ta pačia tvarka.', 'All are $C4H11N$. Two $N-H$ (primary), one (secondary), none (tertiary): the boiling point falls in the same order.')),
        t('Izomerų virimo temperatūra rodo, kiek vandenilinių ryšių molekulė gali sudaryti.', 'The boiling points of isomers show how many hydrogen bonds a molecule can form.'),
        [{ formula: ['CCCCN', 'C4H11N'] }, { formula: ['CCNCC', 'C4H11N'] }, { formula: ['CCN(C)C', 'C4H11N'] }]),
      bpProblem(5,
        [{ smi: 'NC1CCCCC1', name: t('cikloheksanaminas', 'cyclohexanamine') }, { smi: 'CN1CCCCC1', name: t('1-metilpiperidinas', '1-methylpiperidine') }, { smi: 'C1CCCCC1', name: t('cikloheksanas', 'cyclohexane') }],
        [t('cikloheksanas', 'cyclohexane'), t('1-metilpiperidinas (tretinis)', '1-methylpiperidine (tertiary)'), t('cikloheksanaminas (pirminis)', 'cyclohexanamine (primary)')], ['81', '107', '134'],
        REASON_SET([t('Cikloheksanaminas turi du $N-H$ ir sudaro vandenilinius ryšius, tretinis aminas jų nesudaro, o angliavandenilyje nėra polinio ryšio. Todėl: angliavandenilis < tretinis < pirminis.', 'Cyclohexanamine has two $N-H$ for hydrogen bonding, the tertiary amine none, and the hydrocarbon no polar bond. Hence hydrocarbon < tertiary < primary.'), t('Tretinis aminas verda aukščiau už pirminį, nes turi daugiau anglies atomų.', 'The tertiary amine boils above the primary one because it has more carbons.'), t('Cikloheksanas verda aukščiausiai, nes yra simetriškas.', 'Cyclohexane boils highest because it is symmetrical.'), t('Visi trys verda vienodai, nes visi turi šešių narių žiedą.', 'All three boil alike because all have a six-membered ring.')], 0,
          t('Pirminis aminas sudaro tarpmolekulinius vandenilinius ryšius; tretinis aminas – tik dipolinę sąveiką; cikloheksanas – tik silpnas van der Valso jėgas.', 'The primary amine forms intermolecular hydrogen bonds; the tertiary amine only dipole interactions; cyclohexane only weak van der Waals forces.')),
        t('Net kai molekulinė masė panaši, pirminis aminas verda aukščiausiai, nes sudaro daugiausia vandenilinių ryšių.', 'Even when the molar mass is similar, the primary amine boils highest because it forms the most hydrogen bonds.'),
        [{ formula: ['NC1CCCCC1', 'C6H13N'] }, { formula: ['CN1CCCCC1', 'C6H13N'] }]),
      bpProblem(6,
        [{ smi: 'CCCN', name: t('1-propanaminas', 'propan-1-amine') }, { smi: 'CCCO', name: t('1-propanolis', 'propan-1-ol') }, { smi: 'CCOC', name: t('metoksietanas', 'methoxyethane') }],
        [t('metoksietanas (eteris)', 'methoxyethane (ether)'), t('1-propanaminas', 'propan-1-amine'), t('1-propanolis', 'propan-1-ol')], ['8', '48', '97'],
        REASON_SET([t('Eteris neturi $X-H$ ryšio ir vandenilinių ryšių tarpusavyje nesudaro; alkoholis sudaro stipresnius vandenilinius ryšius nei aminas.', 'The ether has no $X-H$ bond and forms no hydrogen bonds with itself; the alcohol forms stronger hydrogen bonds than the amine.'), t('Eteris turi deguonį, todėl sudaro stipriausius vandenilinius ryšius.', 'The ether contains oxygen and therefore forms the strongest hydrogen bonds.'), t('Aminas verda aukščiausiai, nes azotas yra bazinis.', 'The amine boils highest because nitrogen is basic.'), t('Alkoholis verda žemiausiai, nes jis lengviausias.', 'The alcohol boils lowest because it is the lightest.')], 0,
          t('Alkoholio ir eterio izomerai skiriasi tuo, kad eteris neturi $O-H$. Aminas yra tarp jų: jo $N-H···N$ ryšiai silpnesni už $O-H···O$.', 'The ether and the alcohol differ in that the ether has no $O-H$. The amine lies between: its $N-H···N$ bonds are weaker than $O-H···O$.')),
        t('Verda aukščiau tai, kas sudaro daugiau ir stipresnių vandenilinių ryšių.', 'The compound that forms more and stronger hydrogen bonds boils higher.'),
        [{ formula: ['CCCN', 'C3H9N'] }, { formula: ['CCOC', 'C3H8O'] }]),
      bpProblem(7,
        [{ smi: 'CCCCCN', name: t('1-pentanaminas', 'pentan-1-amine') }, { smi: 'CC(C)(C)CN', name: t('2,2-dimetil-1-propanaminas', '2,2-dimethylpropan-1-amine') }, { smi: 'CCN(CC)C', name: t('N-etil-N-metiletanaminas', 'N-ethyl-N-methylethanamine') }],
        [t('N-etil-N-metiletanaminas (tretinis)', 'N-ethyl-N-methylethanamine (tertiary)'), t('2,2-dimetil-1-propanaminas (pirminis, šakotas)', '2,2-dimethylpropan-1-amine (primary, branched)'), t('1-pentanaminas (pirminis, nešakotas)', 'pentan-1-amine (primary, unbranched)')], ['65', '82', '104'],
        REASON_SET([t('Tretinis aminas neturi $N-H$ ir verda žemiausiai. Iš dviejų pirminių aminų šakotas turi mažesnį sąlyčio paviršių, todėl van der Valso jėgos silpnesnės ir jis verda žemiau.', 'The tertiary amine has no $N-H$ and boils lowest. Of the two primary amines, the branched one has a smaller contact surface, so the van der Waals forces are weaker and it boils lower.'), t('Šakotas aminas verda aukščiau, nes yra kompaktiškesnis.', 'The branched amine boils higher because it is more compact.'), t('Abu pirminiai aminai verda vienodai, nes turi tą patį $N-H$ skaičių.', 'Both primary amines boil alike, because they have the same number of $N-H$.'), t('Tretinis aminas verda aukščiausiai, nes turi daugiausia šakų.', 'The tertiary amine boils highest because it has the most branches.')], 0,
          t('Visų formulė $C5H13N$. Pirmiausia lemia $N-H$ ryšių skaičius, po to – šakotumas: šakotų izomerų virimo temperatūra žemesnė.', 'All are $C5H13N$. The number of $N-H$ bonds decides first, then branching: branched isomers boil lower.')),
        t('Pirmiausia žiūrėkite į vandenilinių ryšių galimybę, po to – į molekulės formą: šakotos molekulės verda žemiau.', 'Look first at the ability to hydrogen-bond, then at the shape: branched molecules boil lower.'),
        [{ formula: ['CCCCCN', 'C5H13N'] }, { formula: ['CC(C)(C)CN', 'C5H13N'] }, { formula: ['CCN(CC)C', 'C5H13N'] }]),
      bpProblem(8,
        [{ smi: 'NCCN', name: t('1,2-etandiaminas', 'ethane-1,2-diamine') }, { smi: 'CCN', name: t('etanaminas', 'ethanamine') }, { smi: 'CCCCCC', name: t('heksanas', 'hexane') }],
        [t('etanaminas', 'ethanamine'), t('heksanas', 'hexane'), t('1,2-etandiaminas', 'ethane-1,2-diamine')], ['17', '69', '117'],
        REASON_SET([t('Diaminas turi du $NH2$ ir sudaro daugiausia vandenilinių ryšių. Etanaminas sudaro vandenilinius ryšius, bet yra labai lengvas, o heksanas turi didelį paviršių ir van der Valso jėgas.', 'The diamine has two $NH2$ groups and forms the most hydrogen bonds. Ethanamine forms hydrogen bonds but is very light, while hexane has a large surface and van der Waals forces.'), t('Heksanas verda aukščiausiai, nes jame daugiausia anglies atomų.', 'Hexane boils highest because it has the most carbons.'), t('Etanaminas verda aukščiau už heksaną, nes turi azoto.', 'Ethanamine boils above hexane because it contains nitrogen.'), t('Diaminas verda žemiausiai, nes jame yra du bazinio azoto atomai.', 'The diamine boils lowest because it has two basic nitrogens.')], 0,
          t('Vandeniliniai ryšiai nėra vienintelis veiksnys: labai lengva molekulė (etanaminas) gali virti žemiau už sunkų angliavandenilį. Diaminas sudaro daugiausia vandenilinių ryšių ir verda aukščiausiai.', 'Hydrogen bonds are not the only factor: a very light molecule (ethanamine) can boil below a heavy hydrocarbon. The diamine forms the most hydrogen bonds and boils highest.')),
        t('Palyginkite vandenilinius ryšius ir molekulės dydį kartu: nedidelė molekulė su $NH2$ gali virti žemiau už didelį alkaną.', 'Weigh hydrogen bonds and molecule size together: a small molecule with $NH2$ can boil below a large alkane.'),
        [{ formula: ['NCCN', 'C2H8N2'] }, { formula: ['CCCCCC', 'C6H14'] }])
    ]
  });

  /* ---------- u15.acidbase: direction of an acid-base reaction (generator, S7.3) ---------- */
  // bases (neutral), their conjugate acids and the pKa of that acid (pKaH); the amide is protonated on oxygen
  const BASES = [
    { s: 'N', h: '[NH4+]', pka: 9.25 }, { s: 'CN', h: 'C[NH3+]', pka: 10.6 }, { s: 'CCNCC', h: 'CC[NH2+]CC', pka: 11.0 },
    { s: 'CCN(CC)CC', h: 'CC[NH+](CC)CC', pka: 10.75 }, { s: 'C1CCNCC1', h: 'C1CC[NH2+]CC1', pka: 11.1 },
    { s: 'Nc1ccccc1', h: 'c1ccccc1[NH3+]', pka: 4.6 }, { s: 'Cc1ccc(N)cc1', h: 'Cc1ccc([NH3+])cc1', pka: 5.1 },
    { s: 'Nc1ccc([N+](=O)[O-])cc1', h: '[O-][N+](=O)c1ccc([NH3+])cc1', pka: 1.0 },
    { s: 'c1ccncc1', h: 'c1cc[nH+]cc1', pka: 5.2 }, { s: 'CC(N)=O', h: 'CC(N)=[OH+]', pka: -0.5 }
  ];
  const ACIDS_EXTRA = [
    { h: 'CC(=O)O', s: 'CC(=O)[O-]', pka: 4.76 }, { h: 'OC(=O)c1ccccc1', s: '[O-]C(=O)c1ccccc1', pka: 4.2 }, { h: 'Oc1ccccc1', s: '[O-]c1ccccc1', pka: 10.0 }
  ];
  TYPES.push({
    id: 'u15.acidbase',
    title: t('Rūgščių ir bazių reakcijos kryptis', 'Direction of an acid-base reaction'),
    mirrors: ['S7.3'],
    gen(rng, ctx) {
      const acids = BASES.map(b => ({ h: b.h, s: b.s, pka: b.pka })).concat(ACIDS_EXTRA);
      let acid = null, base = null;
      for (let k = 0; k < 80 && !base; k++) {
        const a = ctx.pick(acids), b = ctx.pick(BASES);
        if (a.s === b.s || Math.abs(a.pka - b.pka) < 2) continue;
        acid = a; base = b;
      }
      if (!base) throw new Error('u15.acidbase: no pair');
      const right = base.pka > acid.pka;                         // B takes the proton from HA when BH+ is the weaker acid
      const weakerAcid = right ? acid.pka : base.pka;
      const diff = Math.abs(base.pka - acid.pka);
      const kLT = nl(diff.toFixed(1)), kEN = diff.toFixed(1);
      const strongBase = right ? base.s : acid.s;
      const opts = [{ mol: { smi: right ? base.s : acid.s } }, { mol: { smi: right ? acid.s : base.s } }];
      return {
        q: [
          { p: t('Ar reakcija vyksta nurodyta kryptimi?', 'Does the reaction proceed in the direction shown?') },
          { scheme: { items: [{ smi: acid.h }, { plus: true }, { smi: base.s }, { arrow: '→' }, { smi: acid.s }, { plus: true }, { smi: base.h }] } },
          { p: t('Konjuguotųjų rūgščių pKa: pradinė rūgštis ' + nl(acid.pka) + ', susidarančios ' + nl(base.pka) + '.', 'The pKa values of the acids: the starting acid ' + acid.pka + ', the acid formed ' + base.pka + '.') }
        ],
        steps: [
          {
            prompt: t('Kuri iš dviejų bazių stipresnė?', 'Which of the two bases is stronger?'),
            kind: 'choice', options: opts, answer: 0,
            hint: t('Bazė stipri, kai jos konjuguotoji rūgštis silpna, t. y. kai jos pKa didelis.', 'A base is strong when its conjugate acid is weak, that is, when its pKa is large.'),
            solution: t('Konjuguotosios rūgšties pKa ' + nl(Math.max(acid.pka, base.pka)) + ' yra didesnis už ' + nl(Math.min(acid.pka, base.pka)) + ', todėl stipresnė bazė yra ta, kuri su šia rūgštimi susijusi.', 'The conjugate acid with pKa ' + Math.max(acid.pka, base.pka) + ' is weaker than the one with ' + Math.min(acid.pka, base.pka) + ', so the stronger base is the one that belongs to it.')
          },
          {
            prompt: t('Kur pasislinkusi pusiausvyra?', 'Where does the equilibrium lie?'),
            kind: 'choice',
            options: [
              { text: t('Į dešinę: reakcija vyksta nurodyta kryptimi.', 'To the right: the reaction proceeds as drawn.') },
              { text: t('Į kairę: nurodyta kryptimi reakcija nevyksta.', 'To the left: the reaction does not proceed as drawn.') },
              { text: t('Pusiausvyroje yra apie pusę reagentų ir produktų.', 'About half of the reagents and products are present at equilibrium.') }
            ],
            answer: right ? 0 : 1,
            hint: t('Pusiausvyra pasislinkusi į silpnesnės rūgšties pusę.', 'The equilibrium lies on the side of the weaker acid.'),
            solution: t('Silpnesnė rūgštis yra ta, kurios pKa didesnis (' + nl(Math.max(acid.pka, base.pka)) + '). Ji ' + (right ? 'yra dešinėje' : 'yra kairėje') + '. pKa skirtumas ' + kLT + ' vienetų, todėl pusiausvyra labai pasislinkusi ' + (right ? 'į dešinę.' : 'į kairę.'),
              'The weaker acid is the one with the larger pKa (' + Math.max(acid.pka, base.pka) + '). It is on the ' + (right ? 'right' : 'left') + '. The pKa difference is ' + kEN + ' units, so the equilibrium lies far to the ' + (right ? 'right.' : 'left.'))
          }
        ],
        why: t('Pusiausvyra pasislinkusi į silpnesnės rūgšties ir silpnesnės bazės pusę. Todėl palyginamas dviejų rūgščių pKa: protoną prisiima stipresnė bazė, t. y. ta, kurios konjuguotoji rūgštis turi didesnį pKa.',
          'The equilibrium lies on the side of the weaker acid and the weaker base. So the pKa values of the two acids are compared: the proton goes to the stronger base, the one whose conjugate acid has the larger pKa.'),
        src: 'S7.3'
      };
    }
  });

  /* ---------- u15.nuc: base or nucleophile (bank, S7.4) ---------- */
  // mechanism blocks for the solutions: n = index of the amine nitrogen
  const mechBase = (smi, n, hx) => ({
    mech: [{
      scheme: { items: [{ smi, opts: { lonePairs: [n] } }, { plus: true }, { smi: hx, opts: { allH: true } }] },
      arrows: [{ from: { m: 0, lp: n }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }]
    }]
  });
  const mechSN2 = (smi, n, rx) => {
    const k = spans(rx).length - 1;                          // the halogen is the last atom, its carbon the one before
    return {
      mech: [{
        scheme: { items: [{ smi, opts: { lonePairs: [n] } }, { plus: true }, { smi: rx }] },
        arrows: [{ from: { m: 0, lp: n }, to: { m: 1, a: k - 1 } }, { from: { m: 1, b: [k - 1, k] }, to: { m: 1, a: k } }]
      }]
    };
  };
  const roleOpts = () => [
    { text: t('Su $HX$ aminas elgiasi kaip bazė, su halogenalkanu – kaip nukleofilas.', 'With $HX$ the amine acts as a base, with the alkyl halide as a nucleophile.') },
    { text: t('Su $HX$ aminas elgiasi kaip nukleofilas, su halogenalkanu – kaip bazė.', 'With $HX$ the amine acts as a nucleophile, with the alkyl halide as a base.') },
    { text: t('Abiem atvejais aminas elgiasi kaip bazė, nes jis turi laisvą porą.', 'In both cases the amine acts as a base, because it has a lone pair.') },
    { text: t('Abiem atvejais aminas elgiasi kaip nukleofilas, nes yra organinis junginys.', 'In both cases the amine acts as a nucleophile, because it is an organic compound.') }
  ];
  const nucProblem = (n, amine, nIdx, amineName, hx, rx, salt1, salt2, claims) => ({
    id: 'u15.nuc.' + n,
    q: [
      { p: t('Tas pats aminas veikiamas rūgštimi $HX$ ir halogenalkanu. Kuriuo atveju jis elgiasi kaip bazė, o kuriuo – kaip nukleofilas? Nurodykite abu produktus.', 'The same amine is treated with the acid $HX$ and with an alkyl halide. In which case does it act as a base and in which as a nucleophile? Give both products.') },
      { scheme: { items: [{ smi: amine, name: amineName }, { plus: true }, { smi: hx }, { arrow: '→' }] } },
      { scheme: { items: [{ smi: amine }, { plus: true }, { smi: rx }, { arrow: '→' }] } }
    ],
    steps: [
      {
        prompt: t('Kuris teiginys teisingas?', 'Which statement is correct?'),
        kind: 'choice', options: roleOpts(), answer: 0,
        hint: t('Paklauskite, ką atakuoja laisva pora: protoną ar anglies atomą.', 'Ask what the lone pair attacks: a proton or a carbon atom.'),
        solution: [
          { p: t('Su rūgštimi laisva pora atakuoja protoną: prijungiamas $H+$, tai bazinis elgesys.', 'With the acid the lone pair attacks a proton: $H+$ is taken up, which is basic behaviour.') },
          mechBase(amine, nIdx, hx),
          { p: t('Su halogenalkanu laisva pora atakuoja elektrofilinį anglies atomą ir išstumia halogenidą: nukleofilinis elgesys ($SN2$).', 'With the alkyl halide the lone pair attacks the electrophilic carbon and displaces the halide: nucleophilic behaviour ($SN2$).') },
          mechSN2(amine, nIdx, rx)
        ]
      },
      {
        prompt: t('Koks yra produktas su rūgštimi?', 'What is the product with the acid?'),
        kind: 'choice', options: salt1.opts, answer: 0,
        hint: t('Protonas jungiasi prie azoto laisvos poros.', 'The proton bonds to the nitrogen lone pair.'),
        solution: t('Susidaro amonio druska: azotas prisijungia $H+$, o halogenidas lieka priešjonu.', 'An ammonium salt forms: nitrogen takes $H+$ and the halide remains as the counter-ion.')
      },
      {
        prompt: t('Koks yra produktas su halogenalkanu?', 'What is the product with the alkyl halide?'),
        kind: 'choice', options: salt2.opts, answer: 0,
        hint: t('Nukleofilas pakeičia halogenidą; ar produktas turi $N-H$, kurį galima prarasti?', 'The nucleophile replaces the halide; does the product carry an $N-H$ that could be lost?'),
        solution: t('Azotas sujungia ryšį su alkilo grupe ir susidaro alkilinta amonio druska; šarmas vėliau gali išlaisvinti laisvą aminą.', 'Nitrogen bonds to the alkyl group to form an alkylated ammonium salt; alkali can free the amine afterwards.')
      }
    ],
    why: t('Ta pati laisva azoto pora yra ir baziška, ir nukleofiliška. Su protonu ji sudaro $N-H$ ryšį (bazė), su anglies atomu – $N-C$ ryšį (nukleofilas). Todėl elgesys priklauso nuo reagento, o ne nuo to, ar aminas stiprus.',
      'The same nitrogen lone pair is both basic and nucleophilic. With a proton it forms an $N-H$ bond (base), with a carbon atom an $N-C$ bond (nucleophile). The behaviour is set by the reagent, not by how strong the amine is.'),
    src: 'S7.4',
    claims
  });
  const saltOpts = (right, wrong) => ({ opts: [{ mol: { smi: right } }].concat(wrong.map(w => ({ mol: { smi: w } }))) });
  const so = (right, wrong) => saltOpts(right, wrong);
  TYPES.push({
    id: 'u15.nuc',
    title: t('Amino bazinės ir nukleofilinės savybės', 'Basic and nucleophilic behaviour of an amine'),
    mirrors: ['S7.4'],
    bank: [
      nucProblem(1, 'CCNC(C)C', 2, t('N-etil-2-propanaminas', 'N-ethylpropan-2-amine'), 'Cl', 'CCBr',
        so('CC[NH2+]C(C)C.[Cl-]', ['CCNC(C)C', 'CCN(Cl)C(C)C']), so('CC[NH+](CC)C(C)C.[Br-]', ['CCN(CC)C(C)C', 'CC[NH2+]C(C)C.[Br-]']),
        [{ react: ['amine.protonate', ['CCNC(C)C'], { X: 'Cl' }, 'CC[NH2+]C(C)C.[Cl-]'] }, { react: ['amine.alkyl', ['CCNC(C)C', 'CCBr'], null, 'CC[NH+](CC)C(C)C.[Br-]'] }]),
      nucProblem(2, 'CNC', 1, t('N-metilmetanaminas', 'N-methylmethanamine'), 'Br', 'CCCI',
        so('C[NH2+]C.[Br-]', ['CNC', 'CN(Br)C']), so('CCC[NH+](C)C.[I-]', ['CCCN(C)C', 'CCC[NH2+]C.[I-]']),
        [{ react: ['amine.protonate', ['CNC'], { X: 'Br' }, 'C[NH2+]C.[Br-]'] }, { react: ['amine.alkyl', ['CNC', 'CCCI'], null, 'CCC[NH+](C)C.[I-]'] }]),
      nucProblem(3, 'CCN(CC)CC', 2, t('N,N-dietiletanaminas', 'N,N-diethylethanamine'), 'Cl', 'CI',
        so('CC[NH+](CC)CC.[Cl-]', ['CCN(CC)CC', 'CCN(CC)C(C)Cl']), so('CC[N+](C)(CC)CC.[I-]', ['CCN(CC)CC', 'CC[NH+](CC)CC.[I-]']),
        [{ react: ['amine.protonate', ['CCN(CC)CC'], { X: 'Cl' }, 'CC[NH+](CC)CC.[Cl-]'] }, { react: ['amine.alkyl', ['CCN(CC)CC', 'CI'], null, 'CC[N+](C)(CC)CC.[I-]'] }]),
      nucProblem(4, 'CNc1ccccc1', 1, t('N-metilbenzenaminas', 'N-methylaniline'), 'Cl', 'CCBr',
        so('C[NH2+]c1ccccc1.[Cl-]', ['CNc1ccccc1', 'CNc1ccc(Cl)cc1']), so('CC[NH+](C)c1ccccc1.[Br-]', ['CCN(C)c1ccccc1', 'CC[NH2+]c1ccccc1.[Br-]']),
        [{ react: ['amine.protonate', ['CNc1ccccc1'], { X: 'Cl' }, 'C[NH2+]c1ccccc1.[Cl-]'] }, { react: ['amine.alkyl', ['CNc1ccccc1', 'CCBr'], null, 'CC[NH+](C)c1ccccc1.[Br-]'] }]),
      nucProblem(5, 'C1CCNCC1', 3, t('piperidinas', 'piperidine'), 'Br', 'CCCBr',
        so('C1CC[NH2+]CC1.[Br-]', ['C1CCNCC1', 'BrN1CCCCC1']), so('CCC[NH+]1CCCCC1.[Br-]', ['CCCN1CCCCC1', 'C1CC[NH2+]CC1.[Br-]']),
        [{ react: ['amine.protonate', ['C1CCNCC1'], { X: 'Br' }, 'C1CC[NH2+]CC1.[Br-]'] }, { react: ['amine.alkyl', ['C1CCNCC1', 'CCCBr'], null, 'CCC[NH+]1CCCCC1.[Br-]'] }]),
      nucProblem(6, 'CCCN', 3, t('1-propanaminas', 'propan-1-amine'), 'Cl', 'CBr',
        so('CCC[NH3+].[Cl-]', ['CCCN', 'CCCNCl']), so('CCC[NH2+]C.[Br-]', ['CCCNC', 'CCC[NH3+].[Br-]']),
        [{ react: ['amine.protonate', ['CCCN'], { X: 'Cl' }, 'CCC[NH3+].[Cl-]'] }, { react: ['amine.alkyl', ['CCCN', 'CBr'], null, 'CCC[NH2+]C.[Br-]'] }]),
      {
        id: 'u15.nuc.7',
        q: [{ p: t('Trimetilaminas reaguoja su jodmetanu ir su $HCl$. Kuo skiriasi jo vaidmuo šiose reakcijose ir kodėl negalima gauti neutralaus produkto iš jodmetano?', 'Trimethylamine reacts with iodomethane and with $HCl$. How does its role differ in the two reactions, and why can a neutral product not form from iodomethane?') }, { mol: { smi: 'CN(C)C', name: t('N,N-dimetilmetanaminas', 'N,N-dimethylmethanamine') } }],
        steps: [
          {
            prompt: t('Koks produktas susidaro su jodmetanu?', 'What forms with iodomethane?'),
            kind: 'choice', options: [{ mol: { smi: 'C[N+](C)(C)C.[I-]' } }, { mol: { smi: 'CCN(C)C' } }, { mol: { smi: 'C[NH+](C)C.[I-]' } }, { mol: { smi: 'CNC' } }], answer: 0,
            hint: t('Ar tretinis aminas turi $N-H$, kurį galėtų prarasti?', 'Does a tertiary amine have an $N-H$ it could lose?'),
            solution: t('Azotas atakuoja metilo anglį, bet neturi $N-H$ vandenilio, kurį galėtų prarasti. Susidaro ketvirtinė amonio druska, tetrametilamonio jodidas.', 'Nitrogen attacks the methyl carbon but has no $N-H$ to lose. The quaternary ammonium salt, tetramethylammonium iodide, forms.')
          },
          {
            prompt: t('Kuris teiginys apie vaidmenį teisingas?', 'Which statement about the role is correct?'),
            kind: 'choice', options: roleOpts(), answer: 0,
            hint: t('Ar atakuojama protonas, ar anglis?', 'Is a proton or a carbon attacked?'),
            solution: t('Su $HCl$ susidaro $N-H$ ryšys (bazė), su $CH3I$ – $N-C$ ryšys (nukleofilas).', 'With $HCl$ an $N-H$ bond forms (base), with $CH3I$ an $N-C$ bond (nucleophile).')
          }
        ],
        why: t('Ketvirtinė amonio druska neturi laisvos poros ir $N-H$, todėl nevyksta nei pakartotinis alkilinimas, nei neutralizavimas šarmu. Trimetilaminas su $HCl$ duoda $N-H$ turinčią druską, kuri šarmu grąžinama į aminą.', 'A quaternary ammonium salt has no lone pair and no $N-H$, so neither further alkylation nor neutralisation by alkali is possible. With $HCl$ trimethylamine gives a salt with an $N-H$, which alkali converts back to the amine.'),
        src: 'S7.4',
        claims: [{ react: ['amine.alkyl', ['CN(C)C', 'CI'], null, 'C[N+](C)(C)C.[I-]'] }]
      },
      {
        id: 'u15.nuc.8',
        q: [{ p: t('Stiprus bazė ir geras nukleofilas dažnai kartu: palyginkite $HCl$ ir $CH3Br$ poveikį anilinui.', 'A strong base is often also a good nucleophile: compare the effect of $HCl$ and $CH3Br$ on aniline.') }, { mol: { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') } }],
        steps: [
          {
            prompt: t('Kurį teiginį apie anilino bazingumą ir nukleofiliškumą pasirinktumėte?', 'Which statement about the basicity and nucleophilicity of aniline would you choose?'),
            kind: 'choice',
            options: [
              { text: t('Anilinas silpnesnė bazė ir silpnesnis nukleofilas už alifatinį aminą, nes laisva pora konjuguota su žiedu; su $HCl$ vis tiek sudaro druską, su $CH3Br$ alkilinasi.', 'Aniline is a weaker base and a weaker nucleophile than an aliphatic amine because the lone pair is conjugated with the ring; it still forms a salt with $HCl$ and is alkylated by $CH3Br$.') },
              { text: t('Anilinas stipresnė bazė už alifatinį aminą, nes benzeno žiedas didina elektronų tankį ant azoto.', 'Aniline is a stronger base than an aliphatic amine because the benzene ring raises the electron density on nitrogen.') },
              { text: t('Anilinas nereaguoja nei su $HCl$, nei su $CH3Br$, nes yra aromatinis.', 'Aniline reacts neither with $HCl$ nor with $CH3Br$, because it is aromatic.') },
              { text: t('Anilinas yra tik nukleofilas, bazinių savybių neturi.', 'Aniline is only a nucleophile and has no basic properties.') }
            ],
            answer: 0,
            hint: t('Palyginkite, kiek elektronų tankio laisvoje poroje lieka po konjugacijos su žiedu.', 'Compare how much electron density is left in the lone pair after conjugation with the ring.'),
            solution: t('Konjuguota pora mažiau prieinama: anilinas silpnesnė bazė (pKaH 4,6) ir silpnesnis nukleofilas. Vis dėlto su stipria rūgštimi $HCl$ jis sudaro druską, o su $CH3Br$ lėčiau alkilinasi.', 'The conjugated pair is less available: aniline is a weaker base (pKaH 4.6) and a weaker nucleophile. Still, it forms a salt with the strong acid $HCl$ and is alkylated more slowly by $CH3Br$.')
          },
          {
            prompt: t('Koks yra produktas su $HCl$?', 'What is the product with $HCl$?'),
            kind: 'choice', options: [{ mol: { smi: 'c1ccccc1[NH3+].[Cl-]' } }, { mol: { smi: 'Nc1ccc(Cl)cc1' } }, { mol: { smi: 'ClNc1ccccc1' } }, { mol: { smi: 'Nc1ccccc1Cl' } }], answer: 0,
            hint: t('Rūgštis protonuoja azotą, žiedas nekeičiamas.', 'The acid protonates nitrogen; the ring is not changed.'),
            solution: t('Susidaro fenilamonio chloridas (anilinio chloridas).', 'Phenylammonium chloride (anilinium chloride) forms.')
          }
        ],
        why: t('Konjugacija mažina azoto poros prieinamumą ir bazinėms, ir nukleofilinėms savybėms, bet jų nepanaikina: aromatiniai aminai sudaro druskas su stipriomis rūgštimis ir alkilinasi.', 'Conjugation lowers the availability of the nitrogen pair for both basic and nucleophilic behaviour but does not remove it: aromatic amines form salts with strong acids and can be alkylated.'),
        src: 'T p97',
        claims: [{ react: ['amine.protonate', ['Nc1ccccc1'], { X: 'Cl' }, 'c1ccccc1[NH3+].[Cl-]'] }]
      }
    ]
  });

  /* ---------- u15.alkacyl: alkylation and acylation of amines (generator, S7.5, S7.9) ---------- */
  const NU_POOL = {                                          // amines for alkylation / acylation
    ali: ['CN', 'CCN', 'CCCN', 'CC(C)N', 'CCCCN', 'NC1CCCCC1', 'NCc1ccccc1', 'CNC', 'CCNCC', 'CCNC', 'CC(C)NC', 'C1CCNCC1', 'C1CCNC1', 'CCCNCCC', 'CNCc1ccccc1'],
    ar: ['Nc1ccccc1', 'Cc1ccc(N)cc1', 'Nc1ccc(Br)cc1', 'Nc1ccc(Cl)cc1', 'COc1ccc(N)cc1', 'CNc1ccccc1', 'CCNc1ccccc1', 'Nc1ccc([N+](=O)[O-])cc1']
  };
  const RX_POOL = [['CI', 'CH3I'], ['CCBr', 'CH3CH2Br'], ['CCI', 'CH3CH2I'], ['CCCBr', 'CH3CH2CH2Br'], ['CCCCBr', 'CH3(CH2)3Br']];
  const ACYL_POOL = [
    { smi: 'CC(=O)Cl', lbl: 'CH3COCl', acyl: 'CC(=O)', chloride: true }, { smi: 'CC(=O)OC(C)=O', lbl: '(CH3CO)2O', acyl: 'CC(=O)', chloride: false },
    { smi: 'CCC(=O)Cl', lbl: 'CH3CH2COCl', acyl: 'CCC(=O)', chloride: true }, { smi: 'O=C(Cl)c1ccccc1', lbl: 'C6H5COCl', acyl: 'O=C(c1ccccc1)', chloride: true }
  ];
  TYPES.push({
    id: 'u15.alkacyl',
    title: t('Aminų alkilinimas ir acilinimas', 'Alkylation and acylation of amines'),
    mirrors: ['S7.5', 'S7.9'],
    gen(rng, ctx) {
      for (let k = 0; k < 60; k++) {
        try { return alkacylBuild(rng, ctx); } catch (e) { if (e.message !== 'retry') throw e; }
      }
      throw new Error('u15.alkacyl: no usable problem');
    }
  });
  function alkacylBuild(rng, ctx) {
      const { react, name } = ctx;
      const mode = ctx.pick(['alk', 'alk', 'quat', 'acyl', 'acyl', 'acyl']);
      const amine = ctx.pick(NU_POOL.ali.concat(NU_POOL.ar, NU_POOL.ar));
      const c = classify(ctx, amine);
      if (!c) throw new Error('u15.alkacyl: no amine');
      const tapStep = (tail) => ({
        prompt: t('Bakstelėkite amino atomą, kuris atakuoja elektrofilą.', 'Tap the atom of the amine that attacks the electrophile.'),
        kind: 'atoms', mol: { smi: amine, opts: { numbers: [c.n] } }, answer: [c.n],
        hint: t('Ieškokite atomo, kuris gali duoti elektronų porą naujam ryšiui.', 'Look for the atom that can donate an electron pair to form a new bond.'),
        solution: t('Nukleofilas yra azoto atomas (Nr. ' + (c.n + 1) + '): jo laisva pora ' + tail.lt, 'The nucleophile is the nitrogen atom (no. ' + (c.n + 1) + '): its lone pair ' + tail.en)
      });
      if (mode === 'alk' || mode === 'quat') {
        if (mode === 'alk' && c.cls === 'tert') throw new Error('retry');
        let rx = null, res1 = null, res2 = null;
        for (let k = 0; k < 20 && !rx; k++) {
          const r = ctx.pick(RX_POOL);
          const a = react.run('amine.alkyl', [amine, r[0]], {});
          const b = react.run('amine.alkyl', [amine, r[0]], { excess: true });
          if (firstMajor(a) && firstMajor(b)) { rx = r; res1 = firstMajor(a); res2 = firstMajor(b); }
        }
        if (!rx) throw new Error('u15.alkacyl: no alkylation');
        const right = mode === 'alk' ? res1 : res2;
        const wrong = mode === 'alk' ? [freeAmine(res1), res2] : [res1, freeAmine(res1)];
        const opts = distinctOpts(ctx, [{ mol: { smi: right } }].concat(wrong.map(w => ({ mol: { smi: w } }))));
        if (opts.length < 3 || canon(ctx, opts[0].mol.smi) !== canon(ctx, right)) throw new Error('retry');
        const steps = [tapStep(t('atakuoja halogenalkano anglį.', 'attacks the carbon of the alkyl halide.')),
          {
            prompt: mode === 'alk' ? t('Koks yra pagrindinis produktas (be šarmo)?', 'What is the main product (before any alkali is added)?') : t('Koks produktas susidaro su halogenalkano pertekliumi?', 'What forms with an excess of the alkyl halide?'),
            kind: 'choice', options: opts, answer: 0,
            hint: mode === 'alk' ? t('Amino azotas sudaro naują $C-N$ ryšį; ką daro išsiskyręs $HX$ be šarmo?', 'Nitrogen forms a new $C-N$ bond; what does the released $HX$ do when no alkali is present?') : t('Produktas vėl yra nukleofilas: ką daro perteklius halogenalkano?', 'The product is a nucleophile again: what does an excess of the halide do?'),
            solution: mode === 'alk'
              ? t('Alkilinimas yra $SN2$: susidaro amonio druska, nes $HX$ lieka su aminu. Laisvą aminą išlaisvintų tik šarmas ($NaOH$).', 'Alkylation is $SN2$: the ammonium salt forms because the $HX$ stays with the amine. Only alkali ($NaOH$) would free the amine.')
              : t('Kiekvienas alkilinimo žingsnis duoda nukleofilesnį aminą, todėl su pertekliumi alkilinama iki galo: ketvirtinė amonio druska.', 'Each alkylation step gives a nucleophilic amine again, so with excess the alkylation goes all the way: the quaternary ammonium salt.')
          }];
        return {
          q: [
            { p: mode === 'alk' ? t('Aminas reaguoja su vienu ekvivalentu halogenalkano.', 'The amine reacts with one equivalent of an alkyl halide.') : t('Aminas reaguoja su dideliu halogenalkano pertekliumi.', 'The amine reacts with a large excess of an alkyl halide.') },
            { scheme: { items: [{ smi: amine }, { plus: true }, { smi: rx[0] }, mode === 'alk' ? { arrow: '→' } : { arrow: '→', above: t('perteklius', 'excess') }] } }
          ],
          steps,
          why: t('Amino azotas yra nukleofilas ir pakeičia halogenidą ($SN2$). Gaunamas amonio druskos jonas ir toliau gali alkilintis, nes jo laisvas aminas yra toks pat geras nukleofilas, todėl su pertekliumi susidaro ketvirtinė druska.', 'The amine nitrogen is a nucleophile and replaces the halide ($SN2$). The new ammonium ion can lose $H+$ and react again, because the free amine is as good a nucleophile, so an excess gives the quaternary salt.'),
          src: 'T p97'
        };
      }
      // acylation
      if (c.cls === 'tert') throw new Error('retry');
      const ac = ctx.pick(ACYL_POOL);
      const res = react.run('amine.acyl', [amine, ac.smi], {});
      const amide = firstMajor(res);
      if (!amide) throw new Error('retry');
      const prot = react.run('amine.protonate', [amine], { X: 'Cl' });
      const salt0 = firstMajor(prot);
      if (!salt0) throw new Error('retry');
      const salt = ac.chloride ? salt0 : salt0.replace('[Cl-]', ac.acyl + '[O-]');
      const options = distinctOpts(ctx, [{ mol: { smi: amide } }, { mol: { smi: salt } }, { mol: { smi: amine } }]);
      if (options.length < 3) throw new Error('retry');
      const lt = name.name(amide, { lang: 'lt' }), en = name.name(amide, { lang: 'en' });
      const base = ac.chloride ? f('pyridine') : null;
      const steps = [
        tapStep(t('atakuoja karbonilo anglį.', 'attacks the carbonyl carbon.')),
        {
          prompt: t('Koks yra acilinimo produktas?', 'What is the product of the acylation?'),
          kind: 'choice', options, answer: 0,
          hint: t('Azoto pora atakuoja karbonilo anglį; kas išeina iš acilo darinio?', 'The nitrogen pair attacks the carbonyl carbon; what leaves the acyl compound?'),
          solution: t('Nukleofilinis acilo pakeitimas: $Cl$ (arba karboksilatas) pakeičiamas amino grupe ir susidaro amidas. Amino druska atsirastų tik jei $HX$ lieka neprijungtas prie acilo, o neišreagavęs aminas – jei reakcija nevyktų.', 'Nucleophilic acyl substitution: $Cl$ (or the carboxylate) is replaced by the amino group and an amide forms. An ammonium salt would form only from the released acid, and unchanged amine only if nothing happened.')
        }
      ];
      if (lt && en) {
        steps.push({
          prompt: t('Pavadinkite amidą.', 'Name the amide.'),
          kind: 'name', mol: { smi: amide }, answer: { smi: amide },
          hint: t('Amidai pavadinami pagal rūgštį su galūne -amidas; pakaitai ant azoto žymimi $N$.', 'Amides are named after the acid with the ending -amide; substituents on nitrogen are marked $N$.'),
          solution: t(lt.name, en.name)
        });
      }
      return {
        q: [
          { p: t('Aminas acilinamas.', 'The amine is acylated.') },
          { scheme: { items: [{ smi: amine }, { plus: true }, { smi: ac.smi }, base ? { arrow: '→', above: base } : { arrow: '→' }] } }
        ],
        steps,
        why: t('Pirminiai ir antriniai aminai su rūgščių chloridais ar anhidridais sudaro amidus (nukleofilinis acilo pakeitimas). Amidas nebazinis, todėl reakcija sustoja ties vienu žingsniu; išsiskyręs $HCl$ suriša antras aminas arba piridinas.', 'Primary and secondary amines give amides with acyl chlorides or anhydrides (nucleophilic acyl substitution). The amide is not basic, so the reaction stops after one step; the released $HCl$ is taken up by a second amine or by pyridine.'),
        src: 'T p98'
      };
  }

  /* ---------- u15.hno2: reaction with nitrous acid by class (generator, S7.6) ---------- */
  const HNO2_CATS = ['prim_al', 'prim_ar', 'sec', 'tert_ar', 'tert_al'];
  const HNO2_CAT_T = {
    prim_al: t('Išsiskiria $N2$; susidaro alkoholio, halogenalkano ir alkeno mišinys.', '$N2$ is evolved; a mixture of alcohol, alkyl halide and alkene forms.'),
    prim_ar: t('Šaltyje susidaro stabilesnė arildiazonio druska; $N2$ neišsiskiria.', 'A more stable aryldiazonium salt forms in the cold; no $N2$ is evolved.'),
    sec: t('Susidaro N-nitrozoaminas.', 'An N-nitrosamine forms.'),
    tert_ar: t('Susidaro $p$-nitrozo darinys (nitrozinimas žiede).', 'The $p$-nitroso compound forms (nitrosation on the ring).'),
    tert_al: t('Susidaro tik amonio druska; nitrozo produkto nėra.', 'Only the ammonium salt forms; there is no nitroso product.')
  };
  const PRIM_AL = [
    ['CC(C)N', 'CC(C)O', 'CC(C)Cl', 'CC=C'], ['NC1CCCCC1', 'OC1CCCCC1', 'ClC1CCCCC1', 'C1=CCCCC1'], ['NC1CCCC1', 'OC1CCCC1', 'ClC1CCCC1', 'C1=CCCC1'],
    ['CC(C)(C)N', 'CC(C)(C)O', 'CC(C)(C)Cl', 'CC(C)=C'], ['NC1CCCCCC1', 'OC1CCCCCC1', 'ClC1CCCCCC1', 'C1=CCCCCC1']
  ];
  const PRIM_AR = ['Nc1ccccc1', 'Cc1ccc(N)cc1', 'Nc1ccc(Br)cc1', 'COc1ccc(N)cc1', 'Nc1ccc(Cl)cc1', 'Nc1ccc([N+](=O)[O-])cc1', 'Cc1cccc(N)c1', 'CCc1ccc(N)cc1', 'Cc1ccccc1N'];
  const SEC = ['CNC', 'CCNCC', 'CNc1ccccc1', 'CCNc1ccccc1', 'C1CCNCC1', 'C1CCNC1', 'C1COCCN1', 'CNc1ccc(OC)cc1', 'CC(C)NC(C)C', 'CNCc1ccccc1', 'CCCNCCC', 'CNc1ccc(C)cc1'];
  const TERT_AR = [['CN(C)c1ccccc1', 'CN(C)c1ccc(cc1)N=O', 'CN(C)c1ccccc1N=O'], ['CCN(CC)c1ccccc1', 'CCN(CC)c1ccc(cc1)N=O', 'CCN(CC)c1ccccc1N=O'], ['CCN(C)c1ccccc1', 'CCN(C)c1ccc(cc1)N=O', 'CCN(C)c1ccccc1N=O']];
  const TERT_AL = ['CN(C)C', 'CCN(CC)CC', 'CCN(C)C', 'CN1CCCC1', 'CCN1CCCC1', 'CN1CCCCC1', 'CCN(CC)C', 'CCCN(C)C'];

  function hno2Pick(rng, ctx) {
    const { react, chem } = ctx;
    const cat = ctx.pick(HNO2_CATS.concat(['sec', 'prim_ar', 'tert_al', 'prim_al']));
    let smi, extra = {};
    if (cat === 'prim_al') { const e = ctx.pick(PRIM_AL); smi = e[0]; extra = { ol: e[1], cl: e[2], ene: e[3] }; }
    else if (cat === 'prim_ar') smi = ctx.pick(PRIM_AR);
    else if (cat === 'sec') smi = ctx.pick(SEC);
    else if (cat === 'tert_ar') { const e = ctx.pick(TERT_AR); smi = e[0]; extra = { para: e[1], ortho: e[2] }; }
    else smi = ctx.pick(TERT_AL);
    const res = react.run('amine.hno2', [smi]);
    const c = classify(ctx, smi);
    if (!c) throw new Error('retry');
    const major = firstMajor(res);
    if (cat === 'prim_al') {
      if (!res.products.some(p => p.by && p.smi === 'N#N') || !major || !chem.same(major, extra.ol, { stereo: false })) throw new Error('retry');
    } else if (cat === 'prim_ar') {
      if (!major || !/\[N\+\]#N/.test(major)) throw new Error('retry');
    } else if (cat === 'sec') {
      if (!major || nitrosoKind(ctx, major) !== 'N') throw new Error('retry');
    } else if (cat === 'tert_ar') {
      if (!major || !chem.same(major, extra.para, { stereo: false })) throw new Error('retry');
    } else if (!res.none) throw new Error('retry');
    return { cat, smi, c, major, extra };
  }

  TYPES.push({
    id: 'u15.hno2',
    title: t('Aminai ir nitrito rūgštis', 'Amines and nitrous acid'),
    mirrors: ['S7.6'],
    gen(rng, ctx) {
      for (let k = 0; k < 40; k++) {
        try { return hno2Build(rng, ctx); } catch (e) { if (e.message !== 'retry') throw e; }
      }
      throw new Error('u15.hno2: no usable problem');
    }
  });
  function hno2Build(rng, ctx) {
      const { react } = ctx;
      const p = hno2Pick(rng, ctx);
      const { cat, smi, c, major, extra } = p;
      const nAtom = c.n;
      const salt = firstMajor(react.run('amine.protonate', [smi], { X: 'Cl' }));
      const steps = [{
        prompt: t('Ką stebėsite arba gausite veikdami $NaNO2$ / $HCl$ (žema temperatūra)?', 'What do you observe or obtain with $NaNO2$ / $HCl$ (low temperature)?'),
        kind: 'choice', options: HNO2_CATS.map(k => ({ text: HNO2_CAT_T[k] })), answer: HNO2_CATS.indexOf(cat),
        hint: t('Nustatykite amino klasę (pirminis, antrinis, tretinis) ir ar azotas prijungtas prie aromatinio žiedo.', 'Determine the class of the amine (primary, secondary, tertiary) and whether nitrogen is bonded to an aromatic ring.'),
        solution: ({
          prim_al: t('Pirminis alifatinis aminas duoda labai nestabilią diazonio druską, kuri iš karto skyla: išsiskiria $N2$ ir susidaro karbokatijonas, o iš jo – produktų mišinys.', 'A primary aliphatic amine gives a very unstable diazonium salt that decomposes at once: $N2$ is evolved and a carbocation forms, which gives a mixture of products.'),
          prim_ar: t('Pirminis aromatinis aminas 0–5 °C duoda arildiazonio druską, kuri šaltame tirpale išlieka.', 'A primary aromatic amine gives an aryldiazonium salt at 0-5 °C, which survives in the cold solution.'),
          sec: t('Antrinis aminas turi vieną $N-H$: nitrozilkatijonas jį pakeičia ir susidaro N-nitrozoaminas.', 'A secondary amine has one $N-H$: the nitrosyl cation replaces it and an N-nitrosamine forms.'),
          tert_ar: t('Tretinio aromatinio amino žiedas aktyvuotas, todėl $NO+$ atakuoja žiedą $p$-padėtyje ($SE$).', 'The ring of a tertiary aromatic amine is activated, so $NO+$ attacks the ring in the para position ($SE$).'),
          tert_al: t('Tretinis alifatinis aminas neturi $N-H$, todėl nitrozo darinys nesusidaro; gaunama tik druska.', 'A tertiary aliphatic amine has no $N-H$, so no nitroso compound forms; only the salt is obtained.')
        })[cat]
      }];
      if (cat === 'prim_al') {
        steps.push({
          prompt: t('Pažymėkite visus junginius, kurie susidaro iš karbokatijono.', 'Pick every compound that forms from the carbocation.'),
          kind: 'multi',
          options: [{ mol: { smi: extra.ol } }, { mol: { smi: extra.cl } }, { mol: { smi: extra.ene } }, { mol: { smi: addBranch(smi, nAtom, 'N=O') } }],
          answer: [0, 1, 2],
          hint: t('Karbokatijonas gali prisijungti nukleofilą ($H2O$, $Cl-$) arba prarasti protoną.', 'A carbocation can add a nucleophile ($H2O$, $Cl-$) or lose a proton.'),
          solution: t('Karbokatijonas virsta alkoholiu (su $H2O$), halogenalkanu (su $Cl-$) ir alkenu (atskyla $H+$). N-nitrozoaminas iš pirminio alifatinio amino nesusidaro, nes diazonio druska suyra.', 'The carbocation gives the alcohol (with $H2O$), the alkyl chloride (with $Cl-$) and the alkene (loss of $H+$). The N-nitroso compound does not form from a primary aliphatic amine, because the diazonium salt decomposes.')
        });
      } else {
        let right, wr;
        if (cat === 'prim_ar') {
          right = major;
          wr = [firstMajor(react.run('diazo.sub', [major], { with: 'H2O' })), addBranch(smi, nAtom, 'N=O')];
        } else if (cat === 'sec') {
          right = major;
          wr = [addBranch(smi, nAtom, '[N+](=O)[O-]'), firstMajor(react.run('amine.protonate', [smi], { X: 'Cl' }))];
        } else if (cat === 'tert_ar') {
          right = major;
          wr = [extra.ortho, salt];
        } else {
          right = salt;
          wr = [addBranch(setAtom(smi, nAtom, '[N+]'), nAtom, '[O-]'), smi];
        }
        const opts = distinctOpts(ctx, [{ mol: { smi: right } }].concat(wr.filter(Boolean).map(w => ({ mol: { smi: w } }))));
        if (opts.length < 3 || canon(ctx, opts[0].mol.smi) !== canon(ctx, right)) throw new Error('retry');
        steps.push({
          prompt: t('Pasirinkite produkto struktūrą.', 'Pick the structure of the product.'),
          kind: 'choice', options: opts, answer: 0,
          hint: cat === 'tert_ar' ? t('Aktyvuotame žiede elektrofilas pasirenka vieną iš dviejų padėčių; kuri mažiau užkrauta?', 'On an activated ring the electrophile picks one of two positions; which one is less hindered?') : t('Palyginkite, kuris atomas pakeitė amino vandenilį ar azoto grupę.', 'Compare which atom replaced the amine hydrogen or the nitrogen group.'),
          solution: ({
            prim_ar: t('Susidaro arildiazonio chloridas $ArN2+ Cl-$; fenolis atsirastų tik šildant.', 'The aryldiazonium chloride $ArN2+ Cl-$ forms; the phenol would appear only on warming.'),
            sec: t('$NO+$ pakeičia vienintelį $N-H$ vandenilį: $R2N-N=O$.', '$NO+$ replaces the single $N-H$ hydrogen: $R2N-N=O$.'),
            tert_ar: t('Nitrozinimas vyksta tik $p$-padėtyje (ne $o$-): $p$-nitrozo darinys.', 'Nitrosation occurs only para (not ortho): the $p$-nitroso compound.'),
            tert_al: t('Be $N-H$ ir su nukleofiliniu azotu susidaro tik amonio druska.', 'With no $N-H$ only the ammonium salt of the amine forms.')
          })[cat]
        });
      }
      return {
        q: [{ p: t('Aminas apdorojamas $NaNO2$ ir $HCl$ vandeniniame tirpale, esant žemai temperatūrai.', 'The amine is treated with $NaNO2$ and $HCl$ in aqueous solution at low temperature.') }, { mol: { smi } }],
        steps,
        why: t('Rezultatą lemia amino klasė. Pirminis alifatinis: diazonio druska skyla ir išsiskiria $N2$. Pirminis aromatinis: stabilesnė diazonio druska. Antrinis: N-nitrozoaminas. Tretinis aromatinis: nitrozinimas $p$-padėtyje. Tretinis alifatinis: tik druska.', 'The class of the amine decides. Primary aliphatic: the diazonium salt decomposes and $N2$ is evolved. Primary aromatic: a more stable diazonium salt. Secondary: an N-nitrosamine. Tertiary aromatic: nitrosation in the para position. Tertiary aliphatic: only a salt.'),
        src: 'T p98'
      };
  }

  /* ---------- u15.n2: which amines evolve N2 (generator, S7.7) ---------- */
  const N2_YES = ['CCN', 'CCCN', 'CC(C)N', 'CCCCN', 'CC(C)(C)N', 'NC1CCCCC1', 'NC1CCCC1', 'CCC(C)N', 'NCc1ccccc1', 'CC(N)Cc1ccccc1'];
  const N2_NO = ['Nc1ccccc1', 'Cc1ccc(N)cc1', 'Nc1ccc(Br)cc1', 'CNC', 'CCNCC', 'CNc1ccccc1', 'CCCNC', 'C1CCNCC1', 'CN(C)c1ccccc1', 'CN(C)C', 'CCN(CC)CC', 'CCN(C)C', 'CNC(C)C', 'CCNC', 'CN1CCCC1', 'CCCCNC'];
  TYPES.push({
    id: 'u15.n2',
    title: t('Kuris aminas išskiria azotą?', 'Which amine evolves nitrogen?'),
    mirrors: ['S7.7'],
    gen(rng, ctx) {
      const k = ctx.pick([1, 1, 2]);
      const yes = ctx.shuffle(N2_YES.slice()).slice(0, k);
      const no = ctx.shuffle(N2_NO.slice()).slice(0, 5 - k);
      const items = ctx.shuffle(yes.map(s => ({ s, y: true })).concat(no.map(s => ({ s, y: false }))));
      const answer = []; items.forEach((it, i) => { if (it.y) answer.push(i); });
      return {
        q: [{ p: t('Šie aminai veikiami nitrito rūgštimi ($NaNO2$ / $HCl$) žemoje temperatūroje. Kurie iš jų išskiria azotą?', 'These amines are treated with nitrous acid ($NaNO2$ / $HCl$) at low temperature. Which of them evolve nitrogen?') }],
        steps: [{
          prompt: t('Pažymėkite visus aminus, kurie išskiria $N2$.', 'Pick every amine that evolves $N2$.'),
          kind: 'multi', options: items.map(it => ({ mol: { smi: it.s } })), answer,
          hint: t('$N2$ išsiskiria, kai diazonio druska yra nestabili net šaltyje. Kuriam aminui taip yra?', '$N2$ is evolved when the diazonium salt is unstable even in the cold. For which amine is that so?'),
          solution: t('$N2$ išsiskiria tik iš pirminių alifatinių aminų (alifatinė diazonio druska nestabili). Aromatiniai pirminiai aminai šaltyje duoda stabilesnę diazonio druską, antriniai – N-nitrozoaminus, tretinis aromatinis – nitrozo darinį, tretinis alifatinis – tik druską.', '$N2$ is evolved only from primary aliphatic amines (the aliphatic diazonium salt is unstable). Primary aromatic amines give the more stable diazonium salt in the cold, secondary ones give N-nitrosamines, a tertiary aromatic one the nitroso compound, and a tertiary aliphatic one only the salt.')
        }],
        why: t('Svarbiausia yra diazonio druskos stabilumas: alifatinė skyla iš karto ($N2$ + karbokatijonas), arilo druska šaltame tirpale išlieka. Antriniai ir tretiniai aminai diazonio druskų neduoda.', 'What matters is the stability of the diazonium salt: the aliphatic one decomposes at once ($N2$ and a carbocation), the aryl one survives in cold solution. Secondary and tertiary amines give no diazonium salt.'),
        src: 'S7.7'
      };
    }
  });

  /* ---------- u15.diazo: Sandmeyer and replacement of the diazonium group (generator, S7.8, S7.9) ---------- */
  const DZ_AMINES = ['Nc1ccccc1', 'Cc1ccc(N)cc1', 'Nc1ccc(Br)cc1', 'Nc1ccc(Cl)cc1', 'COc1ccc(N)cc1', 'Nc1ccc([N+](=O)[O-])cc1', 'Nc1cccc([N+](=O)[O-])c1', 'Cc1ccccc1N', 'Nc1cccc(Cl)c1', 'CCc1ccc(N)cc1'];
  const DZ_REAGENTS = [
    { w: 'CuCl', l: 'CuCl', lt: t('Cl pakeičia $N2+$ (Zandmeierio reakcija)', 'Cl replaces $N2+$ (Sandmeyer reaction)') },
    { w: 'CuBr', l: 'CuBr', lt: t('Br pakeičia $N2+$ (Zandmeierio reakcija)', 'Br replaces $N2+$ (Sandmeyer reaction)') },
    { w: 'CuCN', l: 'CuCN', lt: t('$CN$ pakeičia $N2+$ (Zandmeierio reakcija)', '$CN$ replaces $N2+$ (Sandmeyer reaction)') },
    { w: 'KI', l: 'KI', lt: t('$I$ pakeičia $N2+$ (vario nereikia)', '$I$ replaces $N2+$ (no copper needed)') },
    { w: 'H2O', l: 'H2O, t°', lt: t('$OH$ pakeičia $N2+$ (hidrolizė šildant)', '$OH$ replaces $N2+$ (hydrolysis on heating)') }
  ];
  TYPES.push({
    id: 'u15.diazo',
    title: t('Diazotinimas ir diazonio grupės pakeitimas', 'Diazotisation and replacement of the diazonium group'),
    mirrors: ['S7.8', 'S7.9'],
    gen(rng, ctx) {
      for (let k = 0; k < 60; k++) {
        try { return diazoBuild(rng, ctx); } catch (e) { if (e.message !== 'retry') throw e; }
      }
      throw new Error('u15.diazo: no usable problem');
    }
  });
  function diazoBuild(rng, ctx) {
      const { react, name } = ctx;
      const amine = ctx.pick(DZ_AMINES);
      const rg = ctx.pick(DZ_REAGENTS);
      const dz = firstMajor(react.run('amine.hno2', [amine]));
      if (!dz || !/\[N\+\]#N/.test(dz)) throw new Error('retry');
      const prodOf = (r) => firstMajor(react.run('diazo.sub', [dz], { with: r.w }));
      const right = prodOf(rg);
      if (!right) throw new Error('retry');
      const others = ctx.shuffle(DZ_REAGENTS.filter(r => r.w !== rg.w)).slice(0, 2).map(prodOf).filter(Boolean);
      const hydro = prodOf(DZ_REAGENTS[4]);
      const optsProd = distinctOpts(ctx, [{ mol: { smi: right } }].concat(others.map(o => ({ mol: { smi: o } })), [{ mol: { smi: amine } }]));
      if (optsProd.length < 4 || canon(ctx, optsProd[0].mol.smi) !== canon(ctx, right)) throw new Error('retry');
      const nitrosamine = addBranch(amine, classify(ctx, amine).n, 'N=O');
      const optsDz = distinctOpts(ctx, [{ mol: { smi: dz } }, { mol: { smi: hydro } }, { mol: { smi: nitrosamine } }]);
      if (optsDz.length < 3) throw new Error('retry');
      const steps = [
        {
          prompt: t('Koks tarpinis junginys susidaro $NaNO2$ / $HCl$ veikiant 0–5 °C temperatūroje?', 'What intermediate forms with $NaNO2$ / $HCl$ at 0-5 °C?'),
          kind: 'choice', options: optsDz, answer: 0,
          hint: t('Pirminis aromatinis aminas su nitrito rūgštimi šaltyje; ką ji pakeičia?', 'A primary aromatic amine with nitrous acid in the cold; what does it replace?'),
          solution: t('Susidaro arildiazonio druska $ArN2+ Cl-$. Fenolis susidarytų tik sušildžius, o N-nitrozoaminas – iš antrinio amino.', 'The aryldiazonium salt $ArN2+ Cl-$ forms. The phenol would form only on warming, and the N-nitrosamine comes from a secondary amine.')
        },
        {
          prompt: t('Diazonio druska apdorojama ' + rg.l + '. Koks yra galutinis produktas?', 'The diazonium salt is treated with ' + rg.l + '. What is the final product?'),
          kind: 'choice', options: optsProd, answer: 0,
          hint: t('Ką šis reagentas įveda vietoj $N2+$?', 'What does this reagent introduce in place of $N2+$?'),
          solution: t(rg.lt.lt + '; išsiskiria $N2$.', rg.lt.en + '; $N2$ is evolved.')
        }
      ];
      const lt = name.name(right, { lang: 'lt' }), en = name.name(right, { lang: 'en' });
      if (lt && en) {
        steps.push({
          prompt: t('Pavadinkite produktą.', 'Name the product.'),
          kind: 'name', mol: { smi: right }, answer: { smi: right },
          hint: t('Aromatinio žiedo pakaitus sunumeruokite taip, kad pirmasis numeris būtų mažiausias.', 'Number the ring substituents so that the first number is lowest.'),
          solution: t(lt.name, en.name)
        });
      }
      return {
        q: [
          { p: t('Aromatinis aminas paverčiamas diazonio druska ir ši apdorojama reagentu.', 'An aromatic amine is converted to the diazonium salt, which is then treated with a reagent.') },
          { scheme: { items: [{ smi: amine }, { arrow: '→', above: f('1) NaNO2, HCl, 0–5 °C'), below: f('2) ' + rg.l) }] } }
        ],
        steps,
        why: t('Diazonio grupė yra puiki nueinančioji grupė ($N2$). $CuCl$, $CuBr$ ir $CuCN$ (Zandmeierio reakcijos) įveda $Cl$, $Br$ ir $CN$, $KI$ – jodą, o vanduo šildant – $OH$ grupę. Diazotinti reikia šaltyje, kad druska nesuirtų.', 'The diazonium group is an excellent leaving group ($N2$). $CuCl$, $CuBr$ and $CuCN$ (Sandmeyer reactions) introduce $Cl$, $Br$ and $CN$, $KI$ introduces iodine, and water on heating gives the $OH$ group. Diazotisation must be done cold so that the salt does not decompose.'),
        src: 'T p100'
      };
  }

  /* ---------- u15.basic: ranking basicity with reasons (bank, S7.2) ---------- */
  TYPES.push({
    id: 'u15.basic',
    title: t('Bazingumo palyginimas ir priežastis', 'Ranking basicity, with the reason'),
    mirrors: ['S7.2'],
    bank: [
      {
        id: 'u15.basic.1',
        q: [{ p: t('Palyginkite šių junginių bazingumą.', 'Compare the basicity of these compounds.') }, { mol: [{ smi: 'CN', name: t('metanaminas', 'methanamine') }, { smi: 'N', name: t('amoniakas', 'ammonia') }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }] }],
        steps: [
          {
            prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Arrange from the strongest to the weakest base.'),
            kind: 'order', options: [{ text: t('metanaminas', 'methanamine') }, { text: t('amoniakas', 'ammonia') }, { text: t('benzenaminas', 'aniline') }],
            hint: t('Palyginkite elektronų tankį ant azoto: ką daro metilo grupė ir ką – benzeno žiedas?', 'Compare the electron density on nitrogen: what does a methyl group do, and what does a benzene ring do?'),
            solution: t('Metanaminas (pKaH 10,6) > amoniakas (9,25) > benzenaminas (4,6).', 'Methanamine (pKaH 10.6) > ammonia (9.25) > aniline (4.6).')
          },
          {
            prompt: t('Kodėl anilinas yra silpniausia bazė?', 'Why is aniline the weakest base?'),
            kind: 'choice',
            options: [
              { text: t('Azoto laisva pora konjuguota su benzeno žiedu, todėl elektronų tankis ant azoto sumažėja.', 'The nitrogen lone pair is conjugated with the benzene ring, so the electron density on nitrogen drops.') },
              { text: t('Anilino molekulė turi daugiau anglies atomų nei metanaminas.', 'The aniline molecule has more carbon atoms than methanamine.') },
              { text: t('Benzeno žiedas stabilizuoja neutralią molekulę, bet ne amonio joną, nes jo $+I$ efektas didelis.', 'The benzene ring stabilises the neutral molecule but not the ammonium ion because its $+I$ effect is large.') },
              { text: t('Anilino azotas yra $sp2$ anglies, todėl neturi laisvos poros.', 'The aniline nitrogen is attached to an $sp2$ carbon and therefore has no lone pair.') }
            ],
            answer: 0,
            hint: t('Nupieškite anilino rezonansines formules ir pažiūrėkite, kur atsiduria azoto pora.', 'Draw the resonance structures of aniline and see where the nitrogen pair goes.'),
            solution: [
              { p: t('Azoto pora $p,π$-konjugacijos būdu pasiskirsto žiede, todėl azotas protoną jungia sunkiau. Alkilo grupės elektronų tankį, priešingai, didina (+I).', 'The nitrogen pair is delocalised into the ring by $p,π$ conjugation, so nitrogen takes up a proton less readily. Alkyl groups, in contrast, add electron density (+I).') },
              { resonance: [{ smi: 'Nc1ccccc1' }, { smi: '[NH2+]=C1[CH-]C=CC=C1' }] }
            ]
          }
        ],
        why: t('Aminų bazingumą lemia elektronų tankis ant azoto: alkilo grupės jį didina, benzeno žiedas konjugacijos būdu mažina.', 'The basicity of amines is set by the electron density on nitrogen: alkyl groups raise it, a benzene ring lowers it by conjugation.'),
        src: 'T p97'
      },
      {
        id: 'u15.basic.2',
        q: [{ p: t('Palyginkite pakeistų anilinų bazingumą.', 'Compare the basicity of substituted anilines.') }, { mol: [{ smi: 'Nc1ccc([N+](=O)[O-])cc1', name: t('4-nitrobenzenaminas', '4-nitroaniline') }, { smi: 'Cc1ccc(N)cc1', name: t('4-metilbenzenaminas', '4-methylaniline') }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }] }],
        steps: [
          {
            prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Arrange from the strongest to the weakest base.'),
            kind: 'order', options: [{ text: t('4-metilbenzenaminas', '4-methylaniline') }, { text: t('benzenaminas', 'aniline') }, { text: t('4-nitrobenzenaminas', '4-nitroaniline') }],
            hint: t('Kuris pakaitas elektronus duoda, o kuris traukia?', 'Which substituent donates electrons and which withdraws them?'),
            solution: t('4-metilanilinas (pKaH 5,1) > anilinas (4,6) > 4-nitroanilinas (1,0).', '4-Methylaniline (pKaH 5.1) > aniline (4.6) > 4-nitroaniline (1.0).')
          },
          {
            prompt: t('Kuo paaiškinamas $NO2$ poveikis?', 'What explains the effect of $NO2$?'),
            kind: 'choice',
            options: [
              { text: t('$NO2$ yra elektronų akceptorius ($-I$, $-M$): per žiedą jis ištraukia azoto elektronų porą ir bazingumas sumažėja.', '$NO2$ is an electron acceptor ($-I$, $-M$): through the ring it draws the nitrogen pair away and the basicity falls.') },
              { text: t('$NO2$ yra elektronų donoras ($+M$): jis perkrauna azotą ir sumažina bazingumą.', '$NO2$ is an electron donor ($+M$): it overloads nitrogen and lowers the basicity.') },
              { text: t('$NO2$ yra rūgštinė grupė ir atiduoda protoną azotui.', '$NO2$ is an acidic group and gives a proton to nitrogen.') },
              { text: t('$NO2$ stipriai didina molekulės masę, todėl bazingumas mažėja.', '$NO2$ greatly raises the molar mass, so the basicity falls.') }
            ],
            answer: 0,
            hint: t('Pagalvokite apie $NO2$ ir $CH3$ elektroninius efektus.', 'Think about the electronic effects of $NO2$ and $CH3$.'),
            solution: t('Nitro grupė traukia elektronus ir mažina elektronų tankį ant azoto, o metilo grupė jį didina.', 'The nitro group withdraws electrons and lowers the density on nitrogen, while a methyl group raises it.')
          }
        ],
        why: t('Žiede esantys elektronų donorai didina aromatinio amino bazingumą, akceptoriai – mažina; efektas didžiausias $p$-padėtyje.', 'Electron donors on the ring raise the basicity of an aromatic amine, acceptors lower it; the effect is largest in the para position.'),
        src: 'Klein'
      },
      {
        id: 'u15.basic.3',
        q: [{ p: t('Palyginkite trijų azoto junginių bazingumą.', 'Compare the basicity of three nitrogen compounds.') }, { mol: [{ smi: 'NC1CCCCC1', name: t('cikloheksanaminas', 'cyclohexanamine') }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }, { smi: 'CC(=O)Nc1ccccc1', name: t('N-feniletanamidas', 'N-phenylethanamide') }] }],
        steps: [
          {
            prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Arrange from the strongest to the weakest base.'),
            kind: 'order', options: [{ text: t('cikloheksanaminas', 'cyclohexanamine') }, { text: t('benzenaminas', 'aniline') }, { text: t('N-feniletanamidas', 'N-phenylethanamide') }],
            hint: t('Žiūrėkite, su kuo konjuguota azoto pora: nieko, benzeno žiedu, žiedu ir $C=O$.', 'See what the nitrogen pair is conjugated with: nothing, a benzene ring, a ring and $C=O$.'),
            solution: t('Cikloheksanaminas (pKaH apie 10,6) > anilinas (4,6) > amidas (nebazinis).', 'Cyclohexanamine (pKaH about 10.6) > aniline (4.6) > the amide (not basic).')
          },
          {
            prompt: t('Kodėl amidas beveik nebazinis?', 'Why is the amide hardly basic at all?'),
            kind: 'choice',
            options: [
              { text: t('Azoto pora delokalizuota į karbonilo grupę ($p,π$-konjugacija), todėl protonui nebeprieinama.', 'The nitrogen pair is delocalised into the carbonyl group ($p,π$ conjugation) and no longer available for a proton.') },
              { text: t('Amido azotas neturi laisvos poros, nes sudaro tris ryšius.', 'The amide nitrogen has no lone pair, because it forms three bonds.') },
              { text: t('Amidas yra rūgštis, todėl bazinių savybių neturi.', 'An amide is an acid and therefore has no basic properties.') },
              { text: t('Karbonilo deguonis visada atima protoną iš azoto.', 'The carbonyl oxygen always takes the proton away from nitrogen.') }
            ],
            answer: 0,
            hint: t('Nupieškite amido rezonansines formules.', 'Draw the resonance structures of the amide.'),
            solution: [
              { p: t('Azoto pora per $p,π$-konjugaciją dalijasi su $C=O$, todėl azotas beveik neturi bazinių savybių. Protonuojamas deguonis, bet tik stipriai rūgščioje terpėje.', 'The nitrogen pair is shared with $C=O$ through $p,π$ conjugation, so nitrogen has hardly any basicity. Oxygen is protonated, but only in strongly acidic medium.') },
              { resonance: [{ smi: 'CC(=O)N' }, { smi: 'CC([O-])=[NH2+]' }] }
            ]
          }
        ],
        why: t('Kuo labiau azoto pora delokalizuota, tuo silpnesnė bazė: alifatinis aminas > aromatinis aminas > amidas.', 'The more the nitrogen pair is delocalised, the weaker the base: aliphatic amine > aromatic amine > amide.'),
        src: 'T p97'
      },
      {
        id: 'u15.basic.4',
        q: [{ p: t('Palyginkite šių azoto junginių bazingumą.', 'Compare the basicity of these nitrogen compounds.') }, { mol: [{ smi: 'CCN', name: t('etanaminas', 'ethanamine') }, { smi: 'c1ccncc1', name: t('piridinas', 'pyridine') }, { smi: 'CC(N)=O', name: t('etanamidas', 'ethanamide') }] }],
        steps: [
          {
            prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Arrange from the strongest to the weakest base.'),
            kind: 'order', options: [{ text: t('etanaminas', 'ethanamine') }, { text: t('piridinas', 'pyridine') }, { text: t('etanamidas', 'ethanamide') }],
            hint: t('Palyginkite azoto hibridizaciją ir konjugaciją.', 'Compare the hybridisation of nitrogen and its conjugation.'),
            solution: t('Etanaminas (pKaH 10,7) > piridinas (5,2) > etanamidas (apie −0,5).', 'Ethanamine (pKaH 10.7) > pyridine (5.2) > ethanamide (about −0.5).')
          },
          {
            prompt: t('Kodėl piridinas yra daug silpnesnė bazė už etanaminą?', 'Why is pyridine so much weaker a base than ethanamine?'),
            kind: 'choice',
            options: [
              { text: t('Piridino azoto laisva pora yra $sp2$ orbitalėje, arčiau branduolio (daugiau $s$ pobūdžio), todėl ją sunkiau atiduoti protonui.', 'The pyridine lone pair is in an $sp2$ orbital, closer to the nucleus (more $s$ character), so it is harder to give to a proton.') },
              { text: t('Piridino azoto pora yra aromatinio sekstetas dalis, todėl protonuoti negalima.', 'The pyridine nitrogen pair is part of the aromatic sextet, so it cannot be protonated.') },
              { text: t('Piridinas turi daugiau anglies atomų nei etanaminas.', 'Pyridine has more carbon atoms than ethanamine.') },
              { text: t('Piridino azotas neturi laisvos poros.', 'The pyridine nitrogen has no lone pair.') }
            ],
            answer: 0,
            hint: t('Paklauskite, kurioje orbitalėje yra pora ir kuo ji skiriasi nuo $sp3$ poros.', 'Ask in which orbital the pair sits and how it differs from an $sp3$ pair.'),
            solution: t('Piridino pora yra plokštumoje, $sp2$ orbitalėje, ir nedalyvauja aromatinėje sistemoje; ji tvirčiau laikoma nei $sp3$ pora, todėl piridinas silpnesnė bazė, bet vis tiek protonuojasi.', 'The pyridine pair lies in the plane, in an $sp2$ orbital, and is not part of the aromatic system; it is held more tightly than an $sp3$ pair, so pyridine is a weaker base but still gets protonated.')
          }
        ],
        why: t('Bazingumas mažėja, kai azoto pora labiau užimta ar prisitraukta: $sp3$ amino pora (10–11) > $sp2$ piridino pora (5) > amido azotas (nebazinis).', 'Basicity falls as the nitrogen pair is held more tightly or delocalised: the $sp3$ amine pair (10-11) > the $sp2$ pyridine pair (5) > amide nitrogen (not basic).'),
        src: 'Klein'
      },
      {
        id: 'u15.basic.5',
        q: [{ p: t('Išdėstykite šiuos pakeistus anilinus.', 'Arrange these substituted anilines.') }, { mol: [{ smi: 'COc1ccc(N)cc1', name: t('4-metoksibenzenaminas', '4-methoxyaniline') }, { smi: 'Nc1ccc(Cl)cc1', name: t('4-chlorbenzenaminas', '4-chloroaniline') }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }, { smi: 'Nc1ccc([N+](=O)[O-])cc1', name: t('4-nitrobenzenaminas', '4-nitroaniline') }] }],
        steps: [{
          prompt: t('Išdėstykite nuo stipriausios iki silpniausios bazės.', 'Arrange from the strongest to the weakest base.'),
          kind: 'order', options: [{ text: t('4-metoksibenzenaminas', '4-methoxyaniline') }, { text: t('benzenaminas', 'aniline') }, { text: t('4-chlorbenzenaminas', '4-chloroaniline') }, { text: t('4-nitrobenzenaminas', '4-nitroaniline') }],
          hint: t('Nuspręskite, kurie pakaitai duoda elektronus ($+M$), o kurie jų traukia.', 'Decide which substituents donate electrons ($+M$) and which withdraw them.'),
          solution: t('4-metoksianilinas (pKaH 5,3) > anilinas (4,6) > 4-chloranilinas (4,0) > 4-nitroanilinas (1,0).', '4-Methoxyaniline (pKaH 5.3) > aniline (4.6) > 4-chloroaniline (4.0) > 4-nitroaniline (1.0).')
        }],
        why: t('Donorai ($OCH3$, $CH3$) bazingumą didina; halogenai ir ypač $NO2$ – mažina. Pakaitų eilė pagal akceptorinį poveikį: $NO2$ stipriausias.', 'Donors ($OCH3$, $CH3$) raise the basicity; halogens and above all $NO2$ lower it. The order by acceptor strength puts $NO2$ strongest.'),
        src: 'Klein'
      },
      {
        id: 'u15.basic.6',
        q: [{ p: t('Į vandeninį mišinį, kuriame yra visi keturi junginiai, įpilama praskiesta $HCl$. Kurie junginiai pereina į vandeninį sluoksnį kaip druskos?', 'Dilute $HCl$ is added to an aqueous mixture of all four compounds. Which ones go into the aqueous layer as salts?') }, { mol: [{ smi: 'CCN(CC)CC', name: t('N,N-dietiletanaminas', 'N,N-diethylethanamine') }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }, { smi: 'CC(=O)Nc1ccccc1', name: t('N-feniletanamidas', 'N-phenylethanamide') }, { smi: 'O=C(N)c1ccccc1', name: t('benzenkarboksamidas', 'benzamide') }] }],
        steps: [{
          prompt: t('Pažymėkite junginius, kurie su $HCl$ sudaro druskas.', 'Pick the compounds that form salts with $HCl$.'),
          kind: 'multi', options: [{ text: t('N,N-dietiletanaminas', 'N,N-diethylethanamine') }, { text: t('benzenaminas', 'aniline') }, { text: t('N-feniletanamidas', 'N-phenylethanamide') }, { text: t('benzenkarboksamidas', 'benzamide') }], answer: [0, 1],
          hint: t('Kurie junginiai turi pakankamai bazinį azotą, kad stiprios rūgšties ($HCl$) protoną prijungtų?', 'Which compounds have a nitrogen basic enough to take a proton from a strong acid ($HCl$)?'),
          solution: t('Alifatinis ir aromatinis aminai protonuojami stipria rūgštimi ($PhNH3+ Cl-$). Amidai nebazinis, todėl lieka neutralūs.', 'Aliphatic and aromatic amines are protonated by a strong acid ($PhNH3+ Cl-$). Amides are not basic and stay neutral.')
        }],
        why: t('Aromatiniai aminai su stipriomis rūgštimis sudaro druskas, nors silpnesni už alifatinius, o amidai – ne. Tuo remiantis aminus galima atskirti nuo amidų.', 'Aromatic amines form salts with strong acids even though they are weaker than aliphatic ones; amides do not. This is used to separate amines from amides.'),
        src: 'T p97'
      },
      {
        id: 'u15.basic.7',
        q: [{ p: t('Palyginkite dviejų aromatinių aminų bazingumą.', 'Compare the basicity of two aromatic amines.') }, { mol: [{ smi: 'CN(C)c1ccccc1', name: t('N,N-dimetilbenzenaminas', 'N,N-dimethylaniline') }, { smi: 'Nc1ccccc1', name: t('benzenaminas', 'aniline') }] }],
        steps: [{
          prompt: t('Kuris yra bazingesnis ir kodėl?', 'Which is more basic and why?'),
          kind: 'choice',
          options: [
            { text: t('N,N-dimetilanilinas: dvi metilo grupės didina elektronų tankį ant azoto ($+I$).', 'N,N-dimethylaniline: two methyl groups raise the electron density on nitrogen ($+I$).') },
            { text: t('Anilinas: nepakeistas $NH2$ stipriau konjuguotas su žiedu.', 'Aniline: the unsubstituted $NH2$ is more strongly conjugated with the ring.') },
            { text: t('Abu vienodai, nes abu aromatiniai.', 'Both are equal, because both are aromatic.') },
            { text: t('Anilinas: jis turi du $N-H$, todėl daugiau vandenilinių ryšių su vandeniu.', 'Aniline: it has two $N-H$ and therefore more hydrogen bonds with water.') }
          ],
          answer: 0,
          hint: t('Palyginkite metilo grupių poveikį azoto elektronų tankiui.', 'Compare the effect of the methyl groups on the electron density of nitrogen.'),
          solution: t('Alkilo grupės didina elektronų tankį ant azoto, todėl N,N-dimetilanilinas (pKaH 5,1) bazingesnis už anilino (4,6). Skirtumas nedidelis, nes abiejų pora konjuguota su žiedu.', 'Alkyl groups raise the electron density on nitrogen, so N,N-dimethylaniline (pKaH 5.1) is more basic than aniline (4.6). The difference is small because both pairs are conjugated with the ring.')
        }],
        why: t('Alkilo grupės ($+I$) didina aminų bazingumą; konjugacija su žiedu jį mažina abiem atvejais.', 'Alkyl groups ($+I$) raise the basicity of amines; conjugation with the ring lowers it in both.'),
        src: 'Klein'
      },
      {
        id: 'u15.basic.8',
        q: [{ p: t('Skirtingi azoto atomai dažnai turi labai skirtingą bazingumą.', 'Different nitrogen atoms often differ greatly in basicity.') }, { mol: { smi: 'NCCc1c[nH]cn1', name: t('histaminas', 'histamine'), opts: { numbers: [0, 5, 7] } } }],
        steps: [{
          prompt: t('Bakstelėkite bazingiausią azoto atomą.', 'Tap the most basic nitrogen atom.'),
          kind: 'atoms', mol: { smi: 'NCCc1c[nH]cn1', opts: { numbers: [0, 5, 7] } }, answer: [0],
          hint: t('Palyginkite pirminio alifatinio amino azotą su imidazolo žiedo azotais.', 'Compare the nitrogen of a primary aliphatic amine with the ring nitrogens of imidazole.'),
          solution: t('Atomas Nr. 1 yra alifatinio amino azotas ($sp3$, pKaH apie 9,8). Imidazolo piridino tipo azotas protonuojamas silpniau (pKaH apie 6), o $NH$ azoto pora yra aromatinio sekstetas dalis.', 'Atom no. 1 is the aliphatic amine nitrogen ($sp3$, pKaH about 9.8). The pyridine-type nitrogen of imidazole is protonated less readily (pKaH about 6), and the $NH$ nitrogen pair is part of the aromatic sextet.')
        }],
        why: t('Bazingiausias yra $sp3$ alifatinio amino azotas; $sp2$ piridino tipo azotas silpnesnis, o azotas, kurio pora yra aromatinio sekstetas dalis, nebazinis.', 'The $sp3$ aliphatic amine nitrogen is the most basic; the $sp2$ pyridine-type nitrogen is weaker, and a nitrogen whose pair belongs to the aromatic sextet is not basic.'),
        src: 'Klein',
        claims: [{ formula: ['NCCc1c[nH]cn1', 'C5H9N3'] }]
      }
    ]
  });

  /* ---------- u15.drug: most basic nitrogen in a drug (bank, S7.2) ---------- */
  const drugProblem = (n, smi, nm, ans, whyNot, why, extraClaims) => ({
    id: 'u15.drug.' + n,
    q: [{ p: t('Šiame vaistiniame junginyje yra keli azoto atomai. Raskite bazingiausią ir paaiškinkite.', 'This drug contains several nitrogen atoms. Find the most basic one and explain.') }, { mol: { smi, caption: nm } }],
    steps: [
      {
        prompt: t('Bakstelėkite bazingiausią azoto atomą.', 'Tap the most basic nitrogen atom.'),
        kind: 'atoms', mol: { smi }, answer: [ans],
        hint: t('Kiekvienam azotui paklauskite: ar jo pora konjuguota su $C=O$, su žiedu, ar priklauso aromatiniam sekstetui?', 'For each nitrogen ask: is its pair conjugated with $C=O$, with a ring, or part of an aromatic sextet?'),
        solution: whyNot.pick
      },
      {
        prompt: t('Kodėl kiti azoto atomai mažiau bazingi?', 'Why are the other nitrogen atoms less basic?'),
        kind: 'choice', options: whyNot.opts, answer: 0,
        hint: t('Palyginkite azoto aplinką: amidas, aromatinis aminas, piridino tipo azotas, $sp3$ aminas.', 'Compare the environment of nitrogen: an amide, an aromatic amine, a pyridine-type nitrogen, an $sp3$ amine.'),
        solution: whyNot.sol
      }
    ],
    why,
    src: 'S7.2',
    claims: extraClaims || []
  });
  TYPES.push({
    id: 'u15.drug',
    title: t('Bazingiausias azotas vaisto molekulėje', 'The most basic nitrogen in a drug'),
    mirrors: ['S7.2'],
    bank: [
      drugProblem(1, 'CCCCOc1cc(C(=O)NCCN(CC)CC)c2ccccc2n1', t('cinchokainas', 'cinchocaine'), 13,
        { pick: t('Dietilamino azotas yra tretinio alifatinio amino azotas ($sp3$, nekonjuguotas). Amido azotas ir chinolino azotas yra silpnesni.', 'The diethylamino nitrogen is a tertiary aliphatic amine nitrogen ($sp3$, not conjugated). The amide and quinoline nitrogens are weaker.'),
          opts: [{ text: t('Amido azoto pora konjuguota su $C=O$, o chinolino azotas yra $sp2$ aromatiniame žiede (pKaH apie 5); abu bazingi mažiau už $sp3$ aminą.', 'The amide nitrogen pair is conjugated with $C=O$ and the quinoline nitrogen is $sp2$ in an aromatic ring (pKaH about 5); both are less basic than an $sp3$ amine.') }, { text: t('Visi trys azoto atomai bazingi vienodai, nes yra toje pačioje molekulėje.', 'All three nitrogens are equally basic because they are in the same molecule.') }, { text: t('Amido azotas bazingiausias, nes jį supa karbonilas.', 'The amide nitrogen is the most basic because a carbonyl surrounds it.') }, { text: t('Chinolino azotas bazingiausias, nes yra aromatiniame žiede.', 'The quinoline nitrogen is the most basic because it is in an aromatic ring.') }],
          sol: t('Alifatinis tretinis aminas (pKaH apie 10) bazingesnis už chinolino azotą (apie 5) ir amidą (nebazinis).', 'An aliphatic tertiary amine (pKaH about 10) is more basic than the quinoline nitrogen (about 5) and the amide (not basic).') },
        t('Bazingiausias yra $sp3$ alifatinio amino azotas; amidas ir aromatinis azotas silpnesni dėl konjugacijos arba $sp2$ pobūdžio.', 'The $sp3$ aliphatic amine nitrogen is the most basic; the amide and the aromatic nitrogen are weaker because of conjugation or $sp2$ character.')),
      drugProblem(2, 'CCN(CC)CC(=O)Nc1c(C)cccc1C', t('lidokainas', 'lidocaine'), 2,
        { pick: t('Dietilamino azotas yra tretinio alifatinio amino azotas. Antrasis azotas yra amido azotas, nebazinis.', 'The diethylamino nitrogen is a tertiary aliphatic amine. The other nitrogen is an amide nitrogen, not basic.'),
          opts: [{ text: t('Amido azoto pora konjuguota su $C=O$ (ir su aromatiniu žiedu), todėl nebazinis.', 'The amide nitrogen pair is conjugated with $C=O$ (and with the aromatic ring), so it is not basic.') }, { text: t('Amido azotas bazingesnis, nes jį supa daugiau elektronų.', 'The amide nitrogen is more basic because more electrons surround it.') }, { text: t('Abu azotai vienodai bazingi, nes abu turi laisvą porą.', 'Both nitrogens are equally basic because both have a lone pair.') }, { text: t('Dietilamino azotas nebazinis, nes yra tretinis.', 'The diethylamino nitrogen is not basic because it is tertiary.') }],
          sol: t('Alifatinis aminas (pKaH apie 8–9, šiek tiek sumažintas gretimo $C=O$) bazingesnis už amidą, kurio pora delokalizuota.', 'The aliphatic amine (pKaH about 8-9, a little lowered by the neighbouring $C=O$) is more basic than the amide, whose pair is delocalised.') },
        t('Amidas niekada nėra bazingiausias azotas: jo pora dalyvauja konjugacijoje su $C=O$.', 'An amide is never the most basic nitrogen: its pair takes part in conjugation with $C=O$.')),
      drugProblem(3, 'CCN(CC)C(=O)C1C=C2c3cccc4[nH]cc(c34)CC2N(C)C1', t('LSD', 'LSD'), 21,
        { pick: t('Azotas, prie kurio prijungtas metilas, yra tretinio alifatinio amino azotas. Dietilamido azotas ir indolo $NH$ azotas nebazingi.', 'The nitrogen carrying the methyl group is a tertiary aliphatic amine nitrogen. The diethylamide nitrogen and the indole $NH$ nitrogen are not basic.'),
          opts: [{ text: t('Amido azoto pora konjuguota su $C=O$, o indolo azoto pora yra aromatinio sekstetas dalis; abu nebazingi.', 'The amide nitrogen pair is conjugated with $C=O$, and the indole nitrogen pair belongs to the aromatic sextet; neither is basic.') }, { text: t('Indolo azotas bazingiausias, nes yra aromatiniame žiede.', 'The indole nitrogen is the most basic because it is in an aromatic ring.') }, { text: t('Visi trys azotai bazingi vienodai.', 'All three nitrogens are equally basic.') }, { text: t('Amido azotas bazingesnis už aminą, nes turi daugiau pakaitų.', 'The amide nitrogen is more basic than the amine because it has more substituents.') }],
          sol: t('Tik $sp3$ aminas turi prieinamą laisvą porą; amido ir indolo azotų poros delokalizuotos.', 'Only the $sp3$ amine has an available lone pair; the amide and indole nitrogen pairs are delocalised.') },
        t('Indolo $NH$ nėra bazė: jo azoto pora sudaro aromatinį sekstetą. Bazingas yra tik alifatinis tretinis aminas.', 'The indole $NH$ is not a base: its nitrogen pair forms part of the aromatic sextet. Only the aliphatic tertiary amine is basic.')),
      drugProblem(4, 'CN1CCCC1c1cccnc1', t('nikotinas', 'nicotine'), 1,
        { pick: t('Pirolidino žiedo azotas yra alifatinis tretinis aminas ($sp3$, pKaH apie 8), piridino azotas – $sp2$ (apie 3).', 'The pyrrolidine nitrogen is an aliphatic tertiary amine ($sp3$, pKaH about 8); the pyridine nitrogen is $sp2$ (about 3).'),
          opts: [{ text: t('Piridino azoto pora yra $sp2$ orbitalėje, todėl ją protonui atiduoti sunkiau nei $sp3$ pirolidino porą.', 'The pyridine nitrogen pair is in an $sp2$ orbital, so it is harder to give to a proton than the $sp3$ pyrrolidine pair.') }, { text: t('Piridino azotas bazingesnis, nes yra aromatiniame žiede.', 'The pyridine nitrogen is more basic because it is in an aromatic ring.') }, { text: t('Pirolidino azotas nebazinis, nes yra žiede.', 'The pyrrolidine nitrogen is not basic because it is in a ring.') }, { text: t('Abu vienodai, nes abu yra heterociklai.', 'Both equal, since both are heterocycles.') }],
          sol: t('Pirolidino azotas (alifatinis) bazingesnis už piridino azotą; dėl to su vienu ekvivalentu $HCl$ nikotinas protonuojamas ties pirolidino azotu.', 'The pyrrolidine (aliphatic) nitrogen is more basic than the pyridine nitrogen, so with one equivalent of $HCl$ nicotine is protonated at the pyrrolidine nitrogen.') },
        t('$sp3$ alifatinis azotas bazingesnis už $sp2$ piridino azotą.', 'An $sp3$ aliphatic nitrogen is more basic than an $sp2$ pyridine nitrogen.')),
      drugProblem(5, 'CCN(CC)CCOC(=O)c1ccc(N)cc1', t('prokainas', 'procaine'), 2,
        { pick: t('Dietilamino azotas yra tretinis alifatinis aminas. Antrasis azotas yra aromatinio amino azotas, kurio pora konjuguota su žiedu ir esteriu.', 'The diethylamino nitrogen is a tertiary aliphatic amine. The other nitrogen is an aromatic amine nitrogen, its pair conjugated with the ring and the ester.'),
          opts: [{ text: t('Aromatinio amino pora konjuguota su žiedu, kuris turi akceptorių ($COOR$ para padėtyje); jo pKaH apie 2.', 'The aromatic amine pair is conjugated with the ring, which carries an acceptor ($COOR$ in para); its pKaH is about 2.') }, { text: t('Aromatinio amino azotas bazingesnis, nes yra pirminis.', 'The aromatic amine nitrogen is more basic because it is primary.') }, { text: t('Abu azotai vienodai bazingi.', 'Both nitrogens are equally basic.') }, { text: t('Esterio deguonis atima iš dietilamino azoto elektronus.', 'The ester oxygen takes electrons away from the diethylamino nitrogen.') }],
          sol: t('Alifatinis tretinis aminas (pKaH apie 9) yra daug bazingesnis už aromatinį (apie 2).', 'The aliphatic tertiary amine (pKaH about 9) is much more basic than the aromatic one (about 2).') },
        t('Pirminis aminas nebūtinai bazingesnis: nuo klasės svarbesnė aplinka, t. y. ar azoto pora konjuguota.', 'A primary amine is not necessarily more basic: the environment matters more than the class, that is, whether the pair is conjugated.')),
      drugProblem(6, 'CNC(C)C(O)c1ccccc1', t('efedrinas', 'ephedrine'), 1,
        { pick: t('Molekulėje yra vienintelis azotas: antrinis alifatinis aminas. Jis yra protonuojamas.', 'The molecule has a single nitrogen: a secondary aliphatic amine. It is the one that is protonated.'),
          opts: [{ text: t('Azotas nėra konjuguotas su benzeno žiedu, nes jį skiria $sp3$ anglies atomai, todėl elgiasi kaip alifatinis aminas.', 'The nitrogen is not conjugated with the benzene ring because $sp3$ carbons separate them, so it behaves as an aliphatic amine.') }, { text: t('Azotas nėra bazinis, nes molekulėje yra aromatinis žiedas.', 'The nitrogen is not basic because the molecule contains an aromatic ring.') }, { text: t('Azotas nebazinis, nes šalia yra $OH$ grupė.', 'The nitrogen is not basic because an $OH$ group is nearby.') }, { text: t('Bazingas deguonis, o ne azotas.', 'The oxygen is basic, not the nitrogen.') }],
          sol: t('Aromatinis žiedas yra pririštas prie anglies, o ne prie azoto, todėl azoto pora laisva; pKaH apie 9.', 'The aromatic ring is on carbon, not on nitrogen, so the nitrogen pair is free; pKaH about 9.') },
        t('Aromatinis žiedas molekulėje dar nereiškia aromatinio amino: svarbu, ar azotas prie jo prijungtas tiesiogiai.', 'An aromatic ring in the molecule does not make an aromatic amine: what matters is whether nitrogen is bonded to it directly.')),
      drugProblem(7, 'NCCc1c[nH]c2ccc(O)cc12', t('serotoninas', 'serotonin'), 0,
        { pick: t('Pirminis alifatinis amino azotas yra bazingiausias. Indolo azotas nebazinis.', 'The primary aliphatic amine nitrogen is the most basic. The indole nitrogen is not basic.'),
          opts: [{ text: t('Indolo azoto pora yra aromatinio sekstetas dalis, todėl protonui neprieinama.', 'The indole nitrogen pair is part of the aromatic sextet and is not available to a proton.') }, { text: t('Indolo azotas yra $sp3$ ir turi du $N-H$.', 'The indole nitrogen is $sp3$ and has two $N-H$.') }, { text: t('Indolo azotas bazingesnis, nes yra žiede.', 'The indole nitrogen is more basic because it is in a ring.') }, { text: t('Indolo azotas neturi laisvos poros.', 'The indole nitrogen has no lone pair.') }],
          sol: t('Indolo azotas turi porą, bet ji yra aromatinio sekstetas dalis, todėl indolas nebazinis.', 'The indole nitrogen has a pair, but it belongs to the aromatic sextet, so indole is not basic.') },
        t('Azoto pora, įeinanti į aromatinį sekstetą (indolas, pirolas), nėra bazinė.', 'A nitrogen pair that is part of the aromatic sextet (indole, pyrrole) is not basic.'),
        [{ formula: ['NCCc1c[nH]c2ccc(O)cc12', 'C10H12N2O'] }]),
      drugProblem(8, 'Nc1ccc(S(N)(=O)=O)cc1', t('sulfanilamidas', 'sulfanilamide'), 0,
        { pick: t('Aromatinio amino azotas ($NH2$ ant žiedo) yra bazingesnis už sulfonamido azotą, kurio pora konjuguota su $SO2$.', 'The aromatic amine nitrogen ($NH2$ on the ring) is more basic than the sulfonamide nitrogen, whose pair is conjugated with $SO2$.'),
          opts: [{ text: t('Sulfonamido azotą stipriai traukia $SO2$ grupė, todėl jis nebazinis.', 'The sulfonamide nitrogen is strongly withdrawn by the $SO2$ group, so it is not basic.') }, { text: t('Sulfonamido azotas bazingesnis, nes sujungtas su siera.', 'The sulfonamide nitrogen is more basic because it is bonded to sulfur.') }, { text: t('Abu azotai vienodai bazingi, nes abu yra $NH2$.', 'Both nitrogens are equally basic because both are $NH2$.') }, { text: t('Nė vienas azotas nėra bazinis.', 'Neither nitrogen is basic.') }],
          sol: t('Abu azotai yra $NH2$, bet vienas yra aromatinio amino, kitas – sulfonamido. Aromatinis aminas turi pKaH apie 2, sulfonamidas – nebazinis.', 'Both nitrogens are $NH2$, but one is an aromatic amine, the other a sulfonamide. The aromatic amine has pKaH about 2, the sulfonamide is not basic.') },
        t('Žiūrėkite į aplinką, o ne tik į grupės pavadinimą: $NH2$ ant žiedo ir $NH2$ prie $SO2$ elgiasi skirtingai.', 'Look at the environment, not only at the group: an $NH2$ on a ring and an $NH2$ on $SO2$ behave differently.'))
    ]
  });

  /* ---------- u15.scheme: multi-step schemes, fill in A-E (bank, S7.5, S7.8-S7.11) ---------- */
  const mc = (smi) => ({ mol: { smi } });                    // a choice option that is a drawn structure
  const txt = (lt, en) => ({ text: t(lt, en) });
  TYPES.push({
    id: 'u15.scheme',
    title: t('Daugiapakopės schemos: užpildykite A–E', 'Multi-step schemes: fill in A to E'),
    mirrors: ['S7.5', 'S7.8', 'S7.9', 'S7.10', 'S7.11'],
    bank: [
      {
        id: 'u15.scheme.1',
        q: [
          { p: t('Užpildykite schemą ir nustatykite junginį C.', 'Complete the scheme and identify compound C.') },
          { scheme: { items: [{ smi: 'CN', name: t('metanaminas', 'methanamine') }, { arrow: '→', above: f('1. A'), below: f('2. B') }, { smi: 'CNCC' }, { arrow: '→', above: f('NaNO2, HCl') }] } }
        ],
        steps: [
          {
            prompt: t('Koks yra reagentas A (pirmoji stadija)?', 'What is reagent A (the first stage)?'),
            kind: 'choice', options: [mc('CCBr'), mc('CC(=O)Cl'), mc('CCO'), mc('C=C')], answer: 0,
            hint: t('Reikia įvesti etilo grupę ant azoto: koks reagentas tą daro $SN2$ būdu?', 'An ethyl group has to be put on nitrogen: which reagent does that by $SN2$?'),
            solution: t('Bromoetanas alkilina aminą ($SN2$); acetilchloridas duotų amidą, o etanolis ir etenas amino neprijungia.', 'Bromoethane alkylates the amine ($SN2$); acetyl chloride would give an amide, while ethanol and ethene do not alkylate the amine.')
          },
          {
            prompt: t('Koks yra reagentas B (antroji stadija)?', 'What is reagent B (the second stage)?'),
            kind: 'choice', options: [txt('$NaOH$', '$NaOH$'), txt('$HCl$', '$HCl$'), txt('$NaNO2$', '$NaNO2$'), txt('$H2$, $Ni$', '$H2$, $Ni$')], answer: 0,
            hint: t('Po alkilinimo gauta amonio druska; kaip iš jos gauti laisvą aminą?', 'Alkylation gives an ammonium salt; how do you get the free amine from it?'),
            solution: t('Šarmas deprotonuoja amonio joną ir išlaisvina antrinį aminą $CH3NHC2H5$.', 'Alkali deprotonates the ammonium ion and frees the secondary amine $CH3NHC2H5$.')
          },
          {
            prompt: t('Koks yra junginys C?', 'What is compound C?'),
            kind: 'choice', options: [mc('CCN(C)N=O'), mc('CC[NH2+]C.[Cl-]'), mc('CCN(C)[N+](=O)[O-]'), mc('CCO')], answer: 0,
            hint: t('Nustatykite, kokio tipo amino reaguoja su $NaNO2$ / $HCl$: pirminio, antrinio ar tretinio?', 'Decide the class of amine that reacts with $NaNO2$ / $HCl$: primary, secondary or tertiary.'),
            solution: [{ p: t('Antrinis aminas sudaro N-nitrozoaminą: $NO+$ pakeičia vienintelį $N-H$.', 'A secondary amine gives an N-nitrosamine: $NO+$ replaces the single $N-H$.') }, { scheme: { items: [{ smi: 'CNCC' }, { arrow: '→', above: f('NaNO2, HCl') }, { smi: 'CCN(C)N=O' }] } }]
          }
        ],
        why: t('Pirminį aminą alkilinus halogenalkanu ir apdorojus šarmu gaunamas antrinis aminas; antrinis aminas su nitrito rūgštimi duoda N-nitrozoaminą.', 'Alkylating a primary amine with an alkyl halide and treating with alkali gives a secondary amine; a secondary amine gives an N-nitrosamine with nitrous acid.'),
        src: 'S7.5',
        claims: [
          { react: ['amine.alkyl', ['CN', 'CCBr'], null, 'CC[NH2+]C.[Br-]'] },
          { react: ['amine.hno2', ['CNCC'], null, 'CCN(C)N=O'] }
        ]
      },
      {
        id: 'u15.scheme.2',
        q: [
          { p: t('Užpildykite schemą ir pavadinkite junginius.', 'Complete the scheme and name the compounds.') },
          { scheme: { items: [{ smi: 'Nc1ccc(CC)cc1', name: t('4-etilbenzenaminas', '4-ethylaniline') }, { arrow: '→', above: f('1. NaNO2/HCl, 0–5 °C'), below: f('2. CuCN') }] } },
          { p: t('A → ($H2O$ / $H+$, šildant) → B → ($Br2$ / $FeBr3$) → C', 'A → ($H2O$ / $H+$, heat) → B → ($Br2$ / $FeBr3$) → C') }
        ],
        steps: [
          {
            prompt: t('Koks yra A?', 'What is A?'),
            kind: 'choice', options: [mc('CCc1ccc(cc1)C#N'), mc('CCc1ccc(cc1)Cl'), mc('CCc1ccc(cc1)O'), mc('CCc1ccc(cc1)C(N)=O')], answer: 0,
            hint: t('Ką $CuCN$ įveda vietoj diazonio grupės?', 'What does $CuCN$ introduce in place of the diazonium group?'),
            solution: t('Zandmeierio reakcija pakeičia $N2+$ grupe $CN$: 4-etilbenzonitrilas.', 'The Sandmeyer reaction replaces $N2+$ with $CN$: 4-ethylbenzonitrile.')
          },
          {
            prompt: t('Koks yra B?', 'What is B?'),
            kind: 'choice', options: [mc('CCc1ccc(cc1)C(=O)O'), mc('CCc1ccc(cc1)C(N)=O'), mc('CCc1ccc(cc1)CN'), mc('CCc1ccc(cc1)C=O')], answer: 0,
            hint: t('Ką rūgštyje šildant daro vanduo su nitrilu?', 'What does water do to a nitrile when heated in acid?'),
            solution: t('Nitrilas hidrolizuojasi iki karboksirūgšties: 4-etilbenzenkarboksirūgštis. Amidas būtų tik dalinės hidrolizės produktas.', 'The nitrile hydrolyses to the carboxylic acid: 4-ethylbenzoic acid. The amide would be only the product of partial hydrolysis.')
          },
          {
            prompt: t('Kur įsijungia bromas junginyje C?', 'Where does bromine go in compound C?'),
            kind: 'choice', options: [mc('CCc1ccc(cc1Br)C(=O)O'), mc('CCc1ccc(C(=O)O)c(Br)c1'), mc('CC(Br)c1ccc(cc1)C(=O)O'), mc('CCc1cc(Br)cc(c1)C(=O)O')], answer: 0,
            hint: t('Palyginkite, kur nukreipia kiekvienas pakaitas: etilas ir karboksilas.', 'Compare where each substituent directs: ethyl and carboxyl.'),
            solution: t('Etilas yra $o,p$-orientantas, $COOH$ – $m$-orientantas. Padėtis, esanti $o$ etilui, yra $m$ karboksilui, todėl abu nukreipia bromą į ją: 3-brom-4-etilbenzenkarboksirūgštis. Šoninės grandinės bromuoti reikėtų radikalinių sąlygų.', 'Ethyl is an $o,p$-director and $COOH$ an $m$-director. The position ortho to ethyl is meta to carboxyl, so both direct bromine there: 3-bromo-4-ethylbenzoic acid. Brominating the side chain would need radical conditions.')
          }
        ],
        why: t('Daugiapakopėje schemoje kiekvienas žingsnis keičia vieną grupę: $NH2$ → $CN$ → $COOH$, o paskutinis žingsnis ($SEAr$) pasirenka vietą pagal pakaitų nukreipimą.', 'In a multi-step scheme each step changes one group: $NH2$ → $CN$ → $COOH$, and the last step ($SEAr$) picks the place by the directing effects.'),
        src: 'S7.8',
        claims: [
          { react: ['diazo.sub', ['CCc1ccc(cc1)[N+]#N.[Cl-]'], { with: 'CuCN' }, 'CCc1ccc(cc1)C#N'] },
          { react: ['nitrile.hydrolysis', ['CCc1ccc(cc1)C#N'], null, 'CCc1ccc(cc1)C(=O)O'] },
          { react: ['sear', ['CCc1ccc(cc1)C(=O)O'], { E: 'Br' }, 'CCc1ccc(cc1Br)C(=O)O'] },
          { name: ['CCc1ccc(cc1Br)C(=O)O', t('3-brom-4-etilbenzenkarboksirūgštis', '3-bromo-4-ethylbenzoic acid')] }
        ]
      },
      {
        id: 'u15.scheme.3',
        q: [
          { p: t('Benzenas paverčiamas junginiu E. Užpildykite schemą. Junginio E formulė $C11H15NO$.', 'Benzene is converted to compound E. Complete the scheme. The formula of E is $C11H15NO$.') },
          { scheme: { items: [{ smi: 'c1ccccc1' }, { arrow: '→', above: f('(CH3)3CCl, AlCl3') }] } },
          { p: t('Toliau: A nitrinamas ($HNO3$) ir duoda B; B redukuojamas ($Fe$, $H3O+$) į C; C diazotinamas ir apdorojamas $CuCN$ (D); D hidrolizuojamas rūgštyje (E).', 'Then: A is nitrated ($HNO3$) to B; B is reduced ($Fe$, $H3O+$) to C; C is diazotised and treated with $CuCN$ (D); D is hydrolysed in acid (E).') }
        ],
        steps: [
          {
            prompt: t('Koks yra A?', 'What is A?'),
            kind: 'choice', options: [mc('CC(C)(C)c1ccccc1'), mc('CCC(C)c1ccccc1'), mc('CC(C)Cc1ccccc1'), mc('CCCCc1ccccc1')], answer: 0,
            hint: t('Frydelio ir Krafto alkilinimas: elektrofilas yra karbokatijonas iš alkilchlorido.', 'Friedel-Crafts alkylation: the electrophile is the carbocation from the alkyl chloride.'),
            solution: t('Iš tret-butilchlorido susidaro tret-butilkatijonas, kuris pakeičia vandenilį žiede: tret-butilbenzenas.', 'tert-Butyl chloride gives the tert-butyl cation, which replaces a ring hydrogen: tert-butylbenzene.')
          },
          {
            prompt: t('Koks yra B?', 'What is B?'),
            kind: 'choice', options: [mc('CC(C)(C)c1ccc(cc1)[N+](=O)[O-]'), mc('CC(C)(C)c1ccccc1[N+](=O)[O-]'), mc('CC(C)(C)c1cccc(c1)[N+](=O)[O-]')], answer: 0,
            hint: t('Alkilo grupė yra $o,p$-orientantas; kuri iš dviejų padėčių mažiau užkrauta tūriniu pakaitu?', 'An alkyl group is an $o,p$-director; which of the two positions is less hindered by a bulky substituent?'),
            solution: t('Didelė tret-butilo grupė užstoja $o$-padėtis, todėl nitrinama daugiausia $p$-padėtyje: 1-tret-butil-4-nitrobenzenas.', 'The bulky tert-butyl group shields the $o$-positions, so nitration goes mainly para: 1-tert-butyl-4-nitrobenzene.')
          },
          {
            prompt: t('Koks yra C?', 'What is C?'),
            kind: 'choice', options: [mc('CC(C)(C)c1ccc(N)cc1'), mc('CC(C)(C)c1ccc(cc1)N=O'), mc('CC(C)(C)C1CCC(N)CC1'), mc('CC(C)(C)c1ccc(NO)cc1')], answer: 0,
            hint: t('Metalas rūgštyje redukuoja nitrogrupę iki amino.', 'A metal in acid reduces the nitro group to the amine.'),
            solution: t('$Fe$ / $H3O+$ redukuoja $NO2$ iki $NH2$: 4-tret-butilbenzenaminas. Žiedas nehidrinamas.', '$Fe$ / $H3O+$ reduces $NO2$ to $NH2$: 4-tert-butylaniline. The ring is not hydrogenated.')
          },
          {
            prompt: t('Koks yra D?', 'What is D?'),
            kind: 'choice', options: [mc('CC(C)(C)c1ccc(cc1)C#N'), mc('CC(C)(C)c1ccc(cc1)Cl'), mc('CC(C)(C)c1ccc(cc1)O'), mc('CC(C)(C)c1ccc(cc1)C(N)=O')], answer: 0,
            hint: t('Diazotinimas, po to Zandmeierio reakcija su $CuCN$.', 'Diazotisation, then a Sandmeyer reaction with $CuCN$.'),
            solution: t('Diazonio grupė pakeičiama $CN$: 4-tret-butilbenzonitrilas.', 'The diazonium group is replaced by $CN$: 4-tert-butylbenzonitrile.')
          },
          {
            prompt: t('Koks yra E, kurio formulė $C11H15NO$?', 'What is E, whose formula is $C11H15NO$?'),
            kind: 'choice', options: [mc('CC(C)(C)c1ccc(cc1)C(N)=O'), mc('CC(C)(C)c1ccc(cc1)C(=O)O'), mc('CC(C)(C)c1ccc(cc1)C#N'), mc('CC(C)(C)c1ccc(CN)cc1')], answer: 0,
            hint: t('Suskaičiuokite, kuriuose variantuose yra azotas ir deguonis. Ar visiška hidrolizė išlaikytų azotą?', 'Count which options contain both nitrogen and oxygen. Would complete hydrolysis keep the nitrogen?'),
            solution: t('Pilna nitrilo hidrolizė duotų rūgštį $C11H14O2$ ir $NH4+$ (azoto nebūtų). Formulė $C11H15NO$ rodo dalinę hidrolizę, kuri sustoja ties amidu: 4-tret-butilbenzamidu.', 'Complete hydrolysis of the nitrile would give the acid $C11H14O2$ and $NH4+$ (no nitrogen). The formula $C11H15NO$ points to partial hydrolysis that stops at the amide: 4-tert-butylbenzamide.')
          }
        ],
        why: t('Šiame sekos žingsnyje derinami $SEAr$ (alkilinimas, nitrinimas), redukcija, diazonio chemija ir hidrolizė. Formulė padeda atpažinti, kad hidrolizė sustojo ties amidu.', 'This sequence combines $SEAr$ (alkylation, nitration), reduction, diazonium chemistry and hydrolysis. The formula tells you that hydrolysis stopped at the amide.'),
        src: 'S7.10',
        claims: [
          { react: ['sear', ['c1ccccc1'], { E: 'C(C)(C)C' }, 'CC(C)(C)c1ccccc1'] },
          { react: ['sear', ['CC(C)(C)c1ccccc1'], { E: 'NO2' }, 'CC(C)(C)c1ccc(cc1)[N+](=O)[O-]'] },
          { react: ['nitro.reduce', ['CC(C)(C)c1ccc(cc1)[N+](=O)[O-]'], null, 'CC(C)(C)c1ccc(N)cc1'] },
          { react: ['diazo.sub', ['CC(C)(C)c1ccc(cc1)[N+]#N.[Cl-]'], { with: 'CuCN' }, 'CC(C)(C)c1ccc(cc1)C#N'] },
          { react: ['nitrile.hydrolysis', ['CC(C)(C)c1ccc(cc1)C#N'], { stage: 'amide' }, 'CC(C)(C)c1ccc(cc1)C(N)=O'] },
          { formula: ['CC(C)(C)c1ccc(cc1)C(N)=O', 'C11H15NO'] }
        ]
      },
      {
        id: 'u15.scheme.4',
        q: [{ p: t('Pasiūlykite, kaip iš anilino gauti $m$-brombenzenkarboksirūgštį.', 'Suggest how to make $m$-bromobenzoic acid from aniline.') }, { scheme: { items: [{ smi: 'Nc1ccccc1' }, { arrow: '→', above: f('?') }, { smi: 'OC(=O)c1cccc(Br)c1', name: t('3-brombenzenkarboksirūgštis', '3-bromobenzoic acid') }] } }],
        steps: [
          {
            prompt: t('Sudėkite reagentus teisinga tvarka.', 'Put the reagents in the right order.'),
            kind: 'order',
            options: [{ text: t('$NaNO2$, $HCl$, 0–5 °C (diazotinimas)', '$NaNO2$, $HCl$, 0-5 °C (diazotisation)') }, { text: t('$CuCN$ (Zandmeierio reakcija)', '$CuCN$ (Sandmeyer reaction)') }, { text: t('$H2O$, $H+$, šildant (nitrilo hidrolizė)', '$H2O$, $H+$, heat (nitrile hydrolysis)') }, { text: t('$Br2$, $FeBr3$ (bromuojimas)', '$Br2$, $FeBr3$ (bromination)') }],
            hint: t('Bromo padėtis priklauso nuo to, koks pakaitas jau yra žiede, kai bromuojama.', 'The position of bromine depends on the substituent already on the ring when it is brominated.'),
            solution: t('Pirma $NH2$ paverčiama $COOH$ (diazotinimas, $CuCN$, hidrolizė), o bromas įvedamas paskutinis.', 'First $NH2$ is converted to $COOH$ (diazotisation, $CuCN$, hydrolysis), and bromine is introduced last.')
          },
          {
            prompt: t('Kodėl bromuojama paskutinis?', 'Why is the bromination done last?'),
            kind: 'choice',
            options: [
              txt('Karboksilo grupė yra $m$-orientantas, todėl bromas patenka į $m$-padėtį; $NH2$ būtų nukreipęs jį į $o,p$.', 'The carboxyl group is an $m$-director, so bromine goes meta; $NH2$ would have directed it ortho or para.'),
              txt('$FeBr3$ nesuderinamas su diazonio druska.', '$FeBr3$ is incompatible with the diazonium salt.'),
              txt('Bromas turi būti įvestas prieš nitrilą, nes nitrilas jo nepraleidžia.', 'Bromine has to be introduced before the nitrile because the nitrile blocks it.'),
              txt('$CuCN$ pakeičia ir bromą.', '$CuCN$ also replaces bromine.')
            ],
            answer: 0,
            hint: t('Ar $NH2$, ar $COOH$ yra $m$-orientantas?', 'Is $NH2$ or $COOH$ the $m$-director?'),
            solution: t('Bromuojant anilino, bromas eitų į $o,p$-padėtis. Todėl pirma $NH2$ pakeičiamas $m$-orientantu ($COOH$).', 'Brominating aniline would put bromine ortho and para. So $NH2$ is first replaced by an $m$-director ($COOH$).')
          }
        ],
        why: t('Pakaitų įvedimo tvarka lemia izomerą: kad gautumėte $m$-produktą, pirma įveskite $m$-orientantą, o tik po to – bromą.', 'The order of introducing substituents decides the isomer: to get the meta product, put the $m$-director on first and bromine afterwards.'),
        src: 'S7.11',
        claims: [{ react: ['sear', ['OC(=O)c1ccccc1'], { E: 'Br' }, 'OC(=O)c1cccc(Br)c1'] }, { react: ['nitrile.hydrolysis', ['N#Cc1ccccc1'], null, 'OC(=O)c1ccccc1'] }]
      },
      {
        id: 'u15.scheme.5',
        q: [{ p: t('Pasiūlykite, kaip iš anilino gauti $p$-brombenzenkarboksirūgštį.', 'Suggest how to make $p$-bromobenzoic acid from aniline.') }, { scheme: { items: [{ smi: 'Nc1ccccc1' }, { arrow: '→', above: f('?') }, { smi: 'OC(=O)c1ccc(Br)cc1', name: t('4-brombenzenkarboksirūgštis', '4-bromobenzoic acid') }] } }],
        steps: [
          {
            prompt: t('Sudėkite žingsnius teisinga tvarka.', 'Put the steps in the right order.'),
            kind: 'order',
            options: [
              { text: t('$CH3COCl$ (amino grupės apsauga)', '$CH3COCl$ (protecting the amino group)') },
              { text: t('$Br2$ (bromas patenka į $p$-padėtį)', '$Br2$ (bromine goes para)') },
              { text: t('$H3O+$, šildant (amido hidrolizė iki 4-bromanilino)', '$H3O+$, heat (amide hydrolysis to 4-bromoaniline)') },
              { text: t('$NaNO2$, $HCl$, 0–5 °C', '$NaNO2$, $HCl$, 0-5 °C') },
              { text: t('$CuCN$', '$CuCN$') },
              { text: t('$H2O$, $H+$, šildant (nitrilo hidrolizė)', '$H2O$, $H+$, heat (nitrile hydrolysis)') }
            ],
            hint: t('$NH2$ yra $o,p$-orientantas, bet bromuojant tiesiogiai gaunamas trigubas produktas; ką daryti su šia grupe?', '$NH2$ is an $o,p$-director, but direct bromination gives the tri-substituted product; what do you do with this group?'),
            solution: t('Pirma apsaugoma ir sušvelninama amino grupė, tada bromuojama, po to nuimama apsauga, o $NH2$ paverčiama $COOH$.', 'First the amino group is protected and moderated, then the ring is brominated, then the protection is removed, and $NH2$ is converted to $COOH$.')
          },
          {
            prompt: t('Kodėl pirmiausia acilinamas anilinas?', 'Why is aniline acylated first?'),
            kind: 'choice',
            options: [
              txt('Amidas silpnesnis aktyvatorius už $NH2$, todėl gaunamas monobromidas, o ne 2,4,6-tribromanilinas, ir $p$-izomeras vyrauja.', 'An amide is a weaker activator than $NH2$, so the mono-bromide forms rather than 2,4,6-tribromoaniline, and the para isomer predominates.'),
              txt('Amidas yra $m$-orientantas.', 'The amide is an $m$-director.'),
              txt('Acilinant išsiskiria $N2$, kuris apsaugo žiedą.', 'Acylation releases $N2$, which protects the ring.'),
              txt('Be acilinimo anilino negalima diazotinti.', 'Aniline cannot be diazotised without acylation.')
            ],
            answer: 0,
            hint: t('Palyginkite, kiek aktyvuoja žiedą laisva ir acilinta amino grupė.', 'Compare how strongly a free and an acylated amino group activate the ring.'),
            solution: t('Acilinant azoto pora dalijasi su $C=O$ ir šiek tiek mažiau aktyvuoja žiedą, todėl bromuojama kontroliuojamai.', 'On acylation the nitrogen pair is shared with $C=O$ and activates the ring somewhat less, so the bromination is controlled.')
          }
        ],
        why: t('Aktyvuotą anilino žiedą reikia sušvelninti (acilinti), kad gautumėte monoproduktą $p$-padėtyje. Po to $NH2$ paverčiama $COOH$ diazonio keliu.', 'The activated aniline ring has to be moderated (acylated) to get the mono product in the para position. Then $NH2$ is converted to $COOH$ by the diazonium route.'),
        src: 'S7.11',
        claims: [{ react: ['sear', ['CC(=O)Nc1ccccc1'], { E: 'Br' }, 'CC(=O)Nc1ccc(Br)cc1'] }, { react: ['nitrile.hydrolysis', ['N#Cc1ccc(Br)cc1'], null, 'OC(=O)c1ccc(Br)cc1'] }]
      },
      {
        id: 'u15.scheme.6',
        q: [{ p: t('Kaip iš anilino gauti $o$-brombenzenkarboksirūgštį? Pirmiausia aptarkite tiesioginį bromavimą.', 'How can $o$-bromobenzoic acid be made from aniline? Start with direct bromination.') }, { scheme: { items: [{ smi: 'Nc1ccccc1' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→', above: f('H2O') }, { smi: 'Nc1c(Br)cc(Br)cc1Br' }] } }],
        steps: [
          {
            prompt: t('Kodėl anilino negalima tiesiogiai monobromuoti?', 'Why can aniline not be mono-brominated directly?'),
            kind: 'choice',
            options: [
              txt('$NH2$ labai stipriai aktyvuoja $o$- ir $p$-padėtis, todėl bromuojamos visos trys vietos: susidaro 2,4,6-tribromanilinas.', '$NH2$ activates the ortho and para positions so strongly that all three positions are brominated: 2,4,6-tribromoaniline forms.'),
              txt('Anilinas yra deaktyvuotas, todėl bromuojasi tik su katalizatoriumi.', 'Aniline is deactivated, so it brominates only with a catalyst.'),
              txt('$NH2$ yra $m$-orientantas.', '$NH2$ is an $m$-director.'),
              txt('Bromas oksiduoja $NH2$ iki $NO2$.', 'Bromine oxidises $NH2$ to $NO2$.')
            ],
            answer: 0,
            hint: t('Ar amino grupė aktyvuoja, ar deaktyvuoja žiedą, ir kaip stipriai?', 'Does the amino group activate or deactivate the ring, and how strongly?'),
            solution: t('Amino grupė yra stipriausių aktyvatorių viena, todėl su $Br2$ be katalizatoriaus gaunamas tribromidas.', 'The amino group is one of the strongest activators, so $Br2$ without a catalyst gives the tribromide.')
          },
          {
            prompt: t('Kaip gauti tik $o$-brom darinį?', 'How is only the $o$-bromo compound obtained?'),
            kind: 'choice',
            options: [
              txt('Užblokuoti $p$-padėtį grupe $SO3H$ (grįžtamas sulfoninimas), sušvelninti $NH2$ acilinant, brominti $o$-padėtyje, po to pašalinti $SO3H$ ir $NH2$ paversti $COOH$ diazonio keliu.', 'Block the para position with $SO3H$ (reversible sulfonation), moderate $NH2$ by acylation, brominate ortho, then remove $SO3H$ and convert $NH2$ to $COOH$ by the diazonium route.'),
              txt('Bromuoti anilino su vienu ekvivalentu $Br2$ žemoje temperatūroje.', 'Brominate aniline with one equivalent of $Br2$ at low temperature.'),
              txt('Pirma įvesti $COOH$, po to brominti.', 'Introduce $COOH$ first, then brominate.'),
              txt('Naudoti $CuBr$ tiesiogiai su anilinu.', 'Use $CuBr$ directly with aniline.')
            ],
            answer: 0,
            hint: t('Reikia, kad $p$-padėtis būtų užimta, kol brominama.', 'The para position has to be occupied while the bromination is done.'),
            solution: t('$o$-izomerui reikia laikino blokatoriaus $p$-padėtyje. $COOH$ įvedimas pirmiau duotų $m$-bromo darinį.', 'The ortho isomer needs a temporary blocking group in the para position. Introducing $COOH$ first would give the meta bromo compound.')
          }
        ],
        why: t('Žiedo padėčių valdymui naudojami apsauginiai ir blokuojantys pakaitai, kuriuos vėliau pašalina. Aminų acilinimas moderuoja aktyvumą, o $SO3H$ užima $p$-padėtį.', 'Protecting and blocking groups, removed afterwards, are used to control the positions on a ring. Acylation of the amine moderates the activity, and $SO3H$ occupies the para position.'),
        src: 'S7.11'
      },
      {
        id: 'u15.scheme.7',
        q: [{ p: t('Parašykite 4-bromanilino reakcijų su šiais reagentais produktus.', 'Give the products of 4-bromoaniline with the following reagents.') }, { mol: { smi: 'Nc1ccc(Br)cc1', name: t('4-brombenzenaminas', '4-bromoaniline') } }],
        steps: [
          {
            prompt: t('Priskirkite kiekvienam reagentui produktą.', 'Match each reagent to its product.'),
            kind: 'match',
            answer: {
              left: [{ text: t('$CH3I$ (perteklius)', '$CH3I$ (excess)') }, { text: t('$HCl$', '$HCl$') }, { text: t('diazotinimas ($NaNO2$, $HCl$, šaltyje), po to $CuCl$', 'diazotisation ($NaNO2$, $HCl$, cold), then $CuCl$') }, { text: t('$CH3COCl$, piridinas', '$CH3COCl$, pyridine') }],
              right: [{ mol: { smi: 'CC(=O)Nc1ccc(Br)cc1' } }, { mol: { smi: 'C[N+](C)(C)c1ccc(Br)cc1.[I-]' } }, { mol: { smi: 'Brc1ccc(cc1)[NH3+].[Cl-]' } }, { mol: { smi: 'Brc1ccc(Cl)cc1' } }],
              pairs: [1, 2, 3, 0]
            },
            hint: t('Nuspręskite, ar kiekvienas reagentas elgiasi kaip alkilinantis, rūgštinis, diazotinantis ar acilinantis.', 'Decide whether each reagent is an alkylating, an acidic, a diazotising or an acylating one.'),
            solution: t('Perteklius $CH3I$ alkilina iki ketvirtinės druskos; $HCl$ protonuoja; diazotinimas ir $CuCl$ pakeičia $NH2$ chloru; $CH3COCl$ duoda amidą.', 'Excess $CH3I$ alkylates to the quaternary salt; $HCl$ protonates; diazotisation and $CuCl$ replace $NH2$ by chlorine; $CH3COCl$ gives the amide.')
          },
          {
            prompt: t('Su kuriuo reagentu išsiskiria dujos?', 'With which reagent is a gas evolved?'),
            kind: 'choice',
            options: [txt('$NaNO2$, $HCl$, po to $CuCl$', '$NaNO2$, $HCl$, then $CuCl$'), txt('$HCl$', '$HCl$'), txt('$CH3COCl$, piridinas', '$CH3COCl$, pyridine'), txt('$CH3I$ (perteklius)', '$CH3I$ (excess)')],
            answer: 0,
            hint: t('Kuris produktas susidaro pakeičiant grupę nueinančiąja grupe $N2$?', 'Which product forms by replacing a group with the leaving group $N2$?'),
            solution: t('Zandmeierio reakcijoje diazonio grupė išeina kaip $N2$.', 'In the Sandmeyer reaction the diazonium group leaves as $N2$.')
          }
        ],
        why: t('Tas pats aminas elgiasi skirtingai priklausomai nuo reagento: kaip nukleofilas ($CH3I$, $CH3COCl$), kaip bazė ($HCl$) arba kaip diazonio grupės šaltinis ($NaNO2$ / $HCl$).', 'The same amine behaves differently depending on the reagent: as a nucleophile ($CH3I$, $CH3COCl$), as a base ($HCl$) or as the source of a diazonium group ($NaNO2$ / $HCl$).'),
        src: 'S7.9',
        claims: [
          { react: ['amine.alkyl', ['Nc1ccc(Br)cc1', 'CI'], { excess: true }, 'C[N+](C)(C)c1ccc(Br)cc1.[I-]'] },
          { react: ['amine.protonate', ['Nc1ccc(Br)cc1'], { X: 'Cl' }, 'Brc1ccc(cc1)[NH3+].[Cl-]'] },
          { react: ['amine.acyl', ['Nc1ccc(Br)cc1', 'CC(=O)Cl'], null, 'CC(=O)Nc1ccc(Br)cc1'] },
          { react: ['diazo.sub', ['Brc1ccc(cc1)[N+]#N.[Cl-]'], { with: 'CuCl' }, 'Brc1ccc(Cl)cc1'] }
        ]
      },
      {
        id: 'u15.scheme.8',
        q: [{ p: t('Benzenas paverčiamas fenoliu keliais žingsniais.', 'Benzene is converted to phenol in several steps.') }, { scheme: { items: [{ smi: 'c1ccccc1' }, { arrow: '→', above: f('HNO3, H2SO4') }, { smi: '[O-][N+](=O)c1ccccc1' }, { arrow: '→', above: f('Fe, H3O+') }] } }],
        steps: [
          {
            prompt: t('Koks junginys susidaro iš nitrobenzeno su $Fe$ / $H3O+$?', 'What forms from nitrobenzene with $Fe$ / $H3O+$?'),
            kind: 'choice', options: [mc('Nc1ccccc1'), mc('O=Nc1ccccc1'), mc('ONc1ccccc1'), mc('NC1CCCCC1')], answer: 0,
            hint: t('Metalas rūgštyje redukuoja nitrogrupę iki galo, bet žiedo nehidrina.', 'A metal in acid reduces the nitro group completely but does not hydrogenate the ring.'),
            solution: t('Nitrogrupė redukuojama iki $NH2$: anilinas. Nitrozobenzenas ir hidroksilaminas yra tarpiniai junginiai, kurie neišlaikomi.', 'The nitro group is reduced all the way to $NH2$: aniline. Nitrosobenzene and the hydroxylamine are intermediates that do not survive.')
          },
          {
            prompt: t('Koks junginys susidaro su $NaNO2$ / $HCl$ 0–5 °C?', 'What forms with $NaNO2$ / $HCl$ at 0-5 °C?'),
            kind: 'choice', options: [mc('c1ccccc1[N+]#N.[Cl-]'), mc('O=NNc1ccccc1'), mc('[O-][N+](=O)c1ccccc1'), mc('Oc1ccccc1')], answer: 0,
            hint: t('Pirminis aromatinis aminas šaltyje.', 'A primary aromatic amine in the cold.'),
            solution: t('Susidaro benzendiazonio chloridas; fenolis atsirastų tik šildant.', 'Benzenediazonium chloride forms; the phenol would appear only on heating.')
          },
          {
            prompt: t('Koks galutinis produktas, šildant diazonio druską vandenyje?', 'What is the final product on heating the diazonium salt in water?'),
            kind: 'choice', options: [mc('Oc1ccccc1'), mc('Clc1ccccc1'), mc('c1ccccc1'), mc('N#Cc1ccccc1')], answer: 0,
            hint: t('Vanduo veikia kaip nukleofilas, o $N2$ išeina.', 'Water acts as a nucleophile and $N2$ leaves.'),
            solution: t('Vanduo pakeičia diazonio grupę: fenolis ir $N2$. Chlorbenzenui reikėtų $CuCl$, benzenui – $H3PO2$, benzonitrilui – $CuCN$.', 'Water replaces the diazonium group: phenol and $N2$. Chlorobenzene would need $CuCl$, benzene $H3PO2$, benzonitrile $CuCN$.')
          }
        ],
        why: t('Aminas gaunamas redukuojant nitrodariniį, o po to jis virsta diazonio druska ir pakeičiamas bet kuria grupe. Tai bendras būdas įvesti grupes į žiedą, kurių tiesiogiai įvesti sunku.', 'The amine is made by reducing the nitro compound, then becomes the diazonium salt and is replaced by any of several groups. This is the general way to place groups on a ring that are hard to introduce directly.'),
        src: 'T p100',
        claims: [
          { react: ['nitro.reduce', ['[O-][N+](=O)c1ccccc1'], null, 'Nc1ccccc1'] },
          { react: ['amine.hno2', ['Nc1ccccc1'], null, 'c1ccccc1[N+]#N.[Cl-]'] },
          { react: ['diazo.sub', ['c1ccccc1[N+]#N.[Cl-]'], { with: 'H2O' }, 'Oc1ccccc1'] }
        ]
      },
      {
        id: 'u15.scheme.9',
        q: [{ p: t('Iš anilino reikia gauti 1,3,5-tribrombenzeną, kurio tiesioginiu bromavimu gauti negalima.', 'Make 1,3,5-tribromobenzene from aniline, which cannot be made by direct bromination.') }, { scheme: { items: [{ smi: 'Nc1ccccc1' }, { arrow: '→', above: f('?') }, { smi: 'Brc1cc(Br)cc(Br)c1', name: t('1,3,5-tribrombenzenas', '1,3,5-tribromobenzene') }] } }],
        steps: [
          {
            prompt: t('Koks junginys susidaro iš anilino su $Br2$ / $H2O$?', 'What forms from aniline with $Br2$ / $H2O$?'),
            kind: 'choice', options: [mc('Nc1c(Br)cc(Br)cc1Br'), mc('Nc1ccc(Br)cc1'), mc('Nc1cc(Br)cc(Br)c1'), mc('Brc1cc(Br)cc(Br)c1')], answer: 0,
            hint: t('Amino grupė labai stipriai aktyvuoja $o$- ir $p$-padėtis.', 'The amino group strongly activates the ortho and para positions.'),
            solution: t('Bromas patenka į visas tris aktyvuotas padėtis (2, 4, 6): 2,4,6-tribromanilinas.', 'Bromine enters all three activated positions (2, 4, 6): 2,4,6-tribromoaniline.')
          },
          {
            prompt: t('Kuo, išskyrus $NaNO2$ / $HCl$, reikia veikti diazonio druską, kad $N2+$ būtų pakeistas vandeniliu?', 'Besides $NaNO2$ / $HCl$, what must the diazonium salt be treated with to replace $N2+$ by hydrogen?'),
            kind: 'choice', options: [txt('$H3PO2$', '$H3PO2$'), txt('$CuCl$', '$CuCl$'), txt('$KI$', '$KI$'), txt('$H2O$, šildant', '$H2O$, heat')], answer: 0,
            hint: t('Reikia reduktoriaus, kuris įveda $H$.', 'A reducing agent that puts in $H$ is needed.'),
            solution: t('Hipofosfito rūgštis pakeičia diazonio grupę vandeniliu, todėl $NH2$ galima panaudoti kaip laikiną nukreipiančią grupę.', 'Hypophosphorous acid replaces the diazonium group by hydrogen, so $NH2$ can be used as a temporary directing group.')
          },
          {
            prompt: t('Koks yra galutinis produktas?', 'What is the final product?'),
            kind: 'choice', options: [mc('Brc1cc(Br)cc(Br)c1'), mc('Brc1ccc(Br)c(Br)c1'), mc('Oc1c(Br)cc(Br)cc1Br'), mc('Clc1c(Br)cc(Br)cc1Br')], answer: 0,
            hint: t('Brom atomai lieka vietose, kurias užėmė; diazonio grupė pakeičiama vandeniliu.', 'The bromines stay where they were put; the diazonium group is replaced by hydrogen.'),
            solution: t('Pašalinus $NH2$ lieka trys bromo atomai viena nuo kitos per vieną padėtį (1, 3, 5). Fenolis gautųsi su $H2O$, o chloras – su $CuCl$.', 'After the removal of $NH2$ three bromine atoms remain, each one position apart (1, 3, 5). The phenol would come from $H2O$, the chloride from $CuCl$.')
          }
        ],
        why: t('Amino grupę galima panaudoti kaip $o,p$-nukreipiantį pakaitą, o paskui pašalinti. Taip gaunami $m$-pakeisti dariniai, kurių tiesioginis bromavimas neduoda.', 'The amino group can be used as an $o,p$-directing substituent and then removed. This gives meta-disubstituted compounds that direct bromination does not.'),
        src: 'T p100',
        claims: [{ name: ['Nc1c(Br)cc(Br)cc1Br', t('2,4,6-tribrombenzenaminas', '2,4,6-tribromoaniline')] }, { name: ['Brc1cc(Br)cc(Br)c1', t('1,3,5-tribrombenzenas', '1,3,5-tribromobenzene')] }]
      }
    ]
  });

  /* ---------- u15.cys: reactions of cysteine and disulfide bridges (bank, S7.12) ---------- */
  const CYS = 'NC(CS)C(=O)O';
  const cysMol = { smi: CYS, caption: t('cisteinas', 'cysteine') };
  TYPES.push({
    id: 'u15.cys',
    title: t('Cisteino reakcijos ir disulfidiniai tilteliai', 'Reactions of cysteine and disulfide bridges'),
    mirrors: ['S7.12'],
    bank: [
      {
        id: 'u15.cys.1',
        q: [{ p: t('Cisteinas veikiamas $NaOH$ pertekliumi.', 'Cysteine is treated with excess $NaOH$.') }, { mol: cysMol }],
        steps: [
          {
            prompt: t('Kurios grupės su $NaOH$ sudaro natrio druskas?', 'Which groups form sodium salts with $NaOH$?'),
            kind: 'multi', options: [txt('$COOH$', '$COOH$'), txt('$SH$', '$SH$'), txt('$C-H$ prie $α$-anglies', '$C-H$ on the $α$-carbon'), txt('$NH2$ (kaip bazė)', '$NH2$ (as a base)')], answer: [0, 1],
            hint: t('Pasiskirstykite grupes pagal rūgštingumą: karboksirūgštis, tiolis, amino grupė.', 'Rank the groups by acidity: carboxylic acid, thiol, amino group.'),
            solution: t('Stipriausiai rūgštinė yra $COOH$ (pKa apie 2), po jos – $SH$ (apie 8): jos sudaro druskas su $NaOH$. Amino grupė yra bazė ir su šarmu druskos nesudaro; $C-H$ nėra pakankamai rūgštus.', 'The strongest acid is $COOH$ (pKa about 2), then $SH$ (about 8): they form salts with $NaOH$. The amino group is a base and forms no salt with alkali; the $C-H$ is not acidic enough.')
          },
          {
            prompt: t('Koks yra produktas?', 'What is the product?'),
            kind: 'choice', options: [mc('NC(C[S-])C(=O)[O-].[Na+].[Na+]'), mc('NC(CS)C(=O)[O-].[Na+]'), mc('NC(C[S-])C(=O)O.[Na+]'), mc('NC(CO)C(=O)O')], answer: 0,
            hint: t('Pertekliui šarmo reikia dviejų ekvivalentų: kiek grupių rūgštesnės už vandenį?', 'Excess alkali means two equivalents: how many groups are more acidic than water?'),
            solution: t('Susidaro dinatrio druska: karboksilatas ir tiolatas.', 'The disodium salt forms: the carboxylate and the thiolate.')
          }
        ],
        why: t('Tioliai rūgštingesni už alkoholius ir reaguoja su šarmais. Perteklius šarmo deprotonuoja ir $COOH$, ir $SH$.', 'Thiols are more acidic than alcohols and react with alkalis. Excess alkali deprotonates both $COOH$ and $SH$.'),
        src: 'S7.12'
      },
      {
        id: 'u15.cys.2',
        q: [{ p: t('Cisteinas reaguoja su $HCl$.', 'Cysteine reacts with $HCl$.') }, { mol: cysMol }],
        steps: [
          {
            prompt: t('Kuri grupė protonuojama?', 'Which group is protonated?'),
            kind: 'choice', options: [txt('$NH2$', '$NH2$'), txt('$COOH$', '$COOH$'), txt('$SH$', '$SH$'), txt('$C=O$ deguonis', 'the $C=O$ oxygen')], answer: 0,
            hint: t('Kuri grupė yra bazė?', 'Which group is the base?'),
            solution: t('Bazinė funkcija yra amino grupė: laisva azoto pora prijungia protoną.', 'The basic function is the amino group: the nitrogen lone pair takes the proton.')
          },
          {
            prompt: t('Koks yra produktas?', 'What is the product?'),
            kind: 'choice', options: [mc('[NH3+]C(CS)C(=O)O.[Cl-]'), mc('NC(CS)C(=O)Cl'), mc('NC(CCl)C(=O)O'), mc('NC(CCl)C(=O)[O-]')], answer: 0,
            hint: t('Rūgštis bazės neesterinina ir nepakeičia $SH$; ji tik prijungia $H+$.', 'The acid does not esterify the base or replace the $SH$; it only adds $H+$.'),
            solution: t('Susidaro cisteino hidrochloridas: $-NH3+ Cl-$; $COOH$ ir $SH$ nesikeičia.', 'Cysteine hydrochloride forms: $-NH3+ Cl-$; $COOH$ and $SH$ are unchanged.')
          }
        ],
        why: t('$HCl$ yra rūgštis, o amino grupė – bazė, todėl susidaro amonio druska. Karboksilo ir tiolio grupės rūgštyje nesikeičia.', '$HCl$ is an acid and the amino group a base, so an ammonium salt forms. The carboxyl and thiol groups do not change in acid.'),
        src: 'S7.12',
        claims: [{ react: ['amine.protonate', [CYS], { X: 'Cl' }, '[NH3+]C(CS)C(=O)O.[Cl-]'] }]
      },
      {
        id: 'u15.cys.3',
        q: [{ p: t('Cisteinas reaguoja su metanoliu rūgštyje.', 'Cysteine reacts with methanol in acid.') }, { scheme: { items: [{ smi: CYS }, { plus: true }, { smi: 'CO' }, { arrow: '→', above: f('H+') }] } }],
        steps: [
          {
            prompt: t('Kuri grupė reaguoja?', 'Which group reacts?'),
            kind: 'choice', options: [txt('$COOH$ (esterinimas)', '$COOH$ (esterification)'), txt('$SH$', '$SH$'), txt('$NH2$ (alkilinimas)', '$NH2$ (alkylation)'), txt('$α$-anglis', 'the $α$-carbon')], answer: 0,
            hint: t('Alkoholis rūgštyje reaguoja su karboksirūgštimi.', 'An alcohol in acid reacts with a carboxylic acid.'),
            solution: t('Karboksirūgštis su alkoholiu rūgštinėje terpėje sudaro esterį ($H+$ katalizuoja). Amino grupė rūgštyje protonuota, todėl nereaguoja.', 'A carboxylic acid and an alcohol in acid form an ester ($H+$ catalyses). The amino group is protonated in acid and does not react.')
          },
          {
            prompt: t('Koks yra produktas?', 'What is the product?'),
            kind: 'choice', options: [mc('[NH3+]C(CS)C(=O)OC.[Cl-]'), mc('NC(CSC)C(=O)O'), mc('NC(CS)C(=O)NC'), mc('NC(COC)C(=O)O')], answer: 0,
            hint: t('Pakeičiamas rūgšties $OH$, o ne $SH$.', 'The acid $OH$ is replaced, not the $SH$.'),
            solution: t('Susidaro cisteino metilo esteris (hidrochlorido pavidalu, nes terpė rūgšti).', 'Cysteine methyl ester forms (as the hydrochloride, because the medium is acidic).')
          }
        ],
        why: t('Esterinimas rūgštyje vyksta karboksilo grupėje; kitos grupės lieka. Amino grupė protonuota ir nenukleofilinė.', 'Esterification in acid occurs at the carboxyl group; the other groups stay. The amino group is protonated and not nucleophilic.'),
        src: 'S7.12',
        claims: [{ name: ['COC(=O)C(N)CS', t('metil-2-amino-3-merkaptopropanoatas', 'methyl 2-amino-3-sulfanylpropanoate')] }]
      },
      {
        id: 'u15.cys.4',
        q: [{ p: t('Cisteinas veikiamas gyvsidabrio oksidu $HgO$.', 'Cysteine is treated with mercury oxide, $HgO$.') }, { mol: cysMol }],
        steps: [
          {
            prompt: t('Kuri grupė jungiasi su gyvsidabriu?', 'Which group bonds to mercury?'),
            kind: 'choice', options: [txt('$SH$', '$SH$'), txt('$COOH$', '$COOH$'), txt('$NH2$', '$NH2$'), txt('$C-H$', '$C-H$')], answer: 0,
            hint: t('Sunkieji metalai ypač stipriai jungiasi su siera.', 'Heavy metals bind sulfur especially strongly.'),
            solution: t('Tioliai su sunkiųjų metalų junginiais sudaro merkaptidus (jie vadinami tiolių nuodais), nes ryšys $S-Hg$ stiprus.', 'Thiols form mercaptides with heavy-metal compounds (hence "thiol poisons"), because the $S-Hg$ bond is strong.')
          },
          {
            prompt: t('Koks yra produktas?', 'What is the product?'),
            kind: 'choice', options: [mc('NC(CS[Hg]SCC(N)C(=O)O)C(=O)O'), mc('NC(CS)C(=O)O[Hg]O'), mc('NC(CSSCC(N)C(=O)O)C(=O)O'), mc('NC(C[S-])C(=O)[O-].[Hg+2]')], answer: 0,
            hint: t('Dvi $SH$ grupės pakeičia po vieną $H$ ir jungiasi su $Hg$.', 'Two $SH$ groups each lose one $H$ and bond to $Hg$.'),
            solution: t('2 cisteino molekulės + $HgO$ → $Hg(SR)2$ + $H2O$: gyvsidabrio merkaptidas. Disulfidas čia nesusidaro, nes $Hg(II)$ ne oksidatorius šioje reakcijoje.', '2 cysteine + $HgO$ → $Hg(SR)2$ + $H2O$: the mercury mercaptide. The disulfide does not form here, because the reaction is salt formation, not oxidation.')
          }
        ],
        why: t('Dėl to sunkieji metalai blokuoja baltymų $SH$ grupes ir yra nuodingi. Cisteino $SH$ elgiasi kaip silpna rūgštis su metalais.', 'This is why heavy metals block the $SH$ groups of proteins and are toxic. The $SH$ of cysteine acts as a weak acid toward metals.'),
        src: 'S7.12',
        claims: [{ react: ['thiol.base', [CYS], { metal: 'Hg' }, 'NC(CS[Hg]SCC(N)C(=O)O)C(=O)O'] }]
      },
      {
        id: 'u15.cys.5',
        q: [{ p: t('Cisteinas veikiamas $I2$ šarminiame vandeniniame tirpale.', 'Cysteine is treated with $I2$ in alkaline aqueous solution.') }, { scheme: { items: [{ smi: CYS }, { arrow: '→', above: f('I2, NaOH, H2O') }] } }],
        steps: [
          {
            prompt: t('Koks yra produktas?', 'What is the product?'),
            kind: 'choice', options: [mc('NC(CSSCC(N)C(=O)O)C(=O)O'), mc('NC(CS(=O)(=O)O)C(=O)O'), mc('NC(CI)C(=O)O'), mc('NC(CSI)C(=O)O')], answer: 0,
            hint: t('Jodas yra švelnus oksidatorius; ką jis daro dviem tiolio grupėms?', 'Iodine is a mild oxidant; what does it do to two thiol groups?'),
            solution: t('Dvi $SH$ grupės oksiduojamos į $S-S$ ryšį: susidaro disulfidas cistinas. Stipresni oksidatoriai duotų sulfono rūgštį.', 'Two $SH$ groups are oxidised to an $S-S$ bond: the disulfide cystine forms. Stronger oxidants would give the sulfonic acid.')
          },
          {
            prompt: t('Kas atsitinka su sieros oksidacijos laipsniu?', 'What happens to the oxidation state of sulfur?'),
            kind: 'choice', options: [txt('Padidėja nuo −2 iki −1 (oksidacija).', 'It rises from −2 to −1 (oxidation).'), txt('Sumažėja nuo −1 iki −2 (redukcija).', 'It falls from −1 to −2 (reduction).'), txt('Nesikeičia.', 'It does not change.'), txt('Padidėja iki +4.', 'It rises to +4.')], answer: 0,
            hint: t('Palyginkite $S-H$ ir $S-S$ ryšius: ar siera praranda vandenilį?', 'Compare $S-H$ and $S-S$ bonds: does sulfur lose hydrogen?'),
            solution: t('Siera tiolyje turi −2, disulfide −1: tioliai oksiduojasi. Atvirkštinė reakcija (cinkas, acto rūgštis) disulfidą redukuoja.', 'Sulfur is −2 in the thiol and −1 in the disulfide: thiols are oxidised. The reverse (zinc, acetic acid) reduces the disulfide.')
          }
        ],
        why: t('Dviejų tiolių oksidacija į disulfidą yra grįžtamas redokso procesas, svarbus baltymų struktūrai.', 'The oxidation of two thiols to a disulfide is a reversible redox process, important for protein structure.'),
        src: 'S7.12',
        claims: [{ react: ['thiol.disulfide', [CYS], null, 'NC(CSSCC(N)C(=O)O)C(=O)O'] }]
      },
      {
        id: 'u15.cys.6',
        q: [{ p: t('Priskirkite cisteino reagentus jų produktams.', 'Match the reagents of cysteine to their products.') }, { mol: cysMol }],
        steps: [{
          prompt: t('Sujunkite reagentą ir produktą.', 'Pair each reagent with its product.'),
          kind: 'match',
          answer: {
            left: [{ text: t('$NaOH$ (perteklius)', '$NaOH$ (excess)') }, { text: t('$HCl$', '$HCl$') }, { text: t('$CH3OH$ / $H+$', '$CH3OH$ / $H+$') }, { text: t('$HgO$', '$HgO$') }, { text: t('$I2$ / $NaOH$ / $H2O$', '$I2$ / $NaOH$ / $H2O$') }],
            right: [{ mol: { smi: 'NC(CS[Hg]SCC(N)C(=O)O)C(=O)O' } }, { mol: { smi: 'NC(C[S-])C(=O)[O-].[Na+].[Na+]' } }, { mol: { smi: '[NH3+]C(CS)C(=O)OC.[Cl-]' } }, { mol: { smi: 'NC(CSSCC(N)C(=O)O)C(=O)O' } }, { mol: { smi: '[NH3+]C(CS)C(=O)O.[Cl-]' } }],
            pairs: [1, 4, 2, 0, 3]
          },
          hint: t('Nuspręskite, kurią grupę kiekvienas reagentas veikia: rūgštinę, bazinę, tiolį.', 'Decide which group each reagent acts on: acidic, basic, thiol.'),
          solution: t('Šarmas – druska; $HCl$ – $NH3+$; metanolis – esteris; $HgO$ – merkaptidas; $I2$ – disulfidas.', 'Alkali gives the salt; $HCl$ the $NH3+$; methanol the ester; $HgO$ the mercaptide; $I2$ the disulfide.')
        }],
        why: t('Daugiafunkcis junginys reaguoja pagal reagento pobūdį: rūgštis protonuoja aminą, alkoholis esterina karboksilą, šarmas ir metalai veikia rūgštines grupes, oksidatorius – tiolį.', 'A polyfunctional compound reacts according to the nature of the reagent: acid protonates the amine, alcohol esterifies the carboxyl, alkali and metals act on the acidic groups, an oxidant acts on the thiol.'),
        src: 'S7.12'
      },
      {
        id: 'u15.cys.7',
        q: [{ p: t('Cisteinas yra baltymų aminorūgštis. Du cisteino likučiai grandinėje gali sudaryti $S-S$ ryšį.', 'Cysteine is a protein amino acid. Two cysteine residues in a chain can form an $S-S$ bond.') }],
        steps: [
          {
            prompt: t('Kokią baltymo struktūrą stabilizuoja disulfidiniai tilteliai?', 'Which structure of a protein do disulfide bridges stabilise?'),
            kind: 'choice', options: [txt('Tretinę struktūrą', 'The tertiary structure'), txt('Pirminę struktūrą (aminorūgščių seką)', 'The primary structure (amino acid sequence)'), txt('Antrinę struktūrą, kaip α-spiralės vandeniliniai ryšiai', 'The secondary structure, like the hydrogen bonds of an α-helix'), txt('Tik ketvirtinę struktūrą', 'Only the quaternary structure')], answer: 0,
            hint: t('Tiltelis jungia šonines grandines toli viena nuo kitos pagrindinėje grandinėje.', 'The bridge links side chains that lie far apart along the main chain.'),
            solution: t('Disulfidinis tiltelis jungia šonines grandines ir „susiuva“ jau sulankstytą grandinę: tai tretinė struktūra. Pirminė struktūra – aminorūgščių seka, o antrinė – vandeniliniai ryšiai.', 'A disulfide bridge links side chains and "stitches" the folded chain: this is the tertiary structure. The primary structure is the sequence, the secondary one the hydrogen bonds.')
          },
          {
            prompt: t('Baltymas turi 6 disulfidinius tiltelius. Kiek cisteino likučių juos sudaro?', 'A protein has 6 disulfide bridges. How many cysteine residues form them?'),
            kind: 'number', answer: { value: 12, tol: 0 },
            hint: t('Kiek $SH$ grupių sunaudojama vienam tilteliui?', 'How many $SH$ groups does one bridge use?'),
            solution: t('Kiekvienas tiltelis sunaudoja dvi $SH$ grupes: $6 × 2 = 12$ likučių.', 'Each bridge uses two $SH$ groups: $6 × 2 = 12$ residues.')
          }
        ],
        why: t('Disulfidiniai tilteliai yra kovalentiniai ryšiai tarp šoninių grandinių ir stabilizuoja baltymo tretinę struktūrą, skirtingai nei peptidinis ryšys pagrindinėje grandinėje.', 'Disulfide bridges are covalent bonds between side chains and stabilise the tertiary structure of the protein, unlike the peptide bond of the main chain.'),
        src: 'S7.12'
      },
      {
        id: 'u15.cys.8',
        q: [{ p: t('Palyginkite trijų cisteino grupių rūgštingumą.', 'Compare the acidity of the three groups of cysteine.') }, { mol: cysMol }],
        steps: [
          {
            prompt: t('Išdėstykite protonus nuo lengviausiai iki sunkiausiai atiduodamo.', 'Arrange the protons from the one lost most easily to the one lost least easily.'),
            kind: 'order', options: [txt('$COOH$ (pKa apie 2)', '$COOH$ (pKa about 2)'), txt('$SH$ (pKa apie 8)', '$SH$ (pKa about 8)'), txt('$NH3+$ (pKa apie 10)', '$NH3+$ (pKa about 10)')],
            hint: t('Rūgštingumą nusako konjuguotosios bazės stabilumas.', 'Acidity is set by the stability of the conjugate base.'),
            solution: t('Karboksilato krūvis išsklaidytas rezonansu, tiolato – dideliame sieros atome, o iš $NH3+$ susidariusio neutralaus amino jokio anijono nėra: rūgštingumas $COOH$ > $SH$ > $NH3+$.', 'The carboxylate charge is spread by resonance, the thiolate charge over the large sulfur atom, while $NH3+$ loses its proton to give a neutral amine with no anion to stabilise: acidity $COOH$ > $SH$ > $NH3+$.')
          },
          {
            prompt: t('Kodėl tiolis rūgštesnis už alkoholį?', 'Why is a thiol more acidic than an alcohol?'),
            kind: 'choice', options: [txt('Tiolato anijono neigiamas krūvis pasiskirsto didesniame sieros atome, todėl anijonas stabilesnis.', 'The negative charge of the thiolate is spread over the larger sulfur atom, so the anion is more stable.'), txt('Siera elektroneigiamesnė už deguonį.', 'Sulfur is more electronegative than oxygen.'), txt('Tiolis turi daugiau vandenilių.', 'A thiol has more hydrogens.'), txt('$S-H$ ryšys poliškesnis už $O-H$.', 'The $S-H$ bond is more polar than $O-H$.')], answer: 0,
            hint: t('Palyginkite deguonies ir sieros atomų dydį.', 'Compare the sizes of oxygen and sulfur.'),
            solution: t('Siera yra didesnė ir mažiau elektroneigiama, bet $S-H$ ryšys silpnesnis ir anijonas labiau išsklaidytas; dėl to $pKa$ mažesnis.', 'Sulfur is larger and less electronegative, but the $S-H$ bond is weaker and the anion more dispersed; so the pKa is lower.')
          }
        ],
        why: t('Cisteinas gali būti rūgštis ir bazė. Šarmo perteklius deprotonuoja $COOH$ ir $SH$, o $HCl$ protonuoja $NH2$.', 'Cysteine can be an acid and a base. Excess alkali deprotonates $COOH$ and $SH$, while $HCl$ protonates $NH2$.'),
        src: 'S7.12'
      }
    ]
  });

  ORG.unit({
    id: 'u15',
    lectureMissing: true,
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S7.1': ['u15.class', 'u15.bp'],
      'S7.2': ['u15.basic', 'u15.drug'],
      'S7.3': ['u15.acidbase'],
      'S7.4': ['u15.nuc'],
      'S7.5': ['u15.alkacyl', 'u15.scheme'],
      'S7.6': ['u15.hno2'],
      'S7.7': ['u15.n2'],
      'S7.8': ['u15.diazo', 'u15.scheme'],
      'S7.9': ['u15.alkacyl', 'u15.diazo', 'u15.scheme'],
      'S7.10': ['u15.scheme'],
      'S7.11': ['u15.scheme'],
      'S7.12': ['u15.cys']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
