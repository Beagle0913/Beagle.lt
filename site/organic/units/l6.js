// site/organic/units/l6.js: lab unit 6, reactions of functional groups
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });

  // a single-choice step: options are written as [lt, en] pairs, answer is the index of the right one
  const ch = (prompt, options, answer, hint, solution) => ({
    prompt, kind: 'choice', options: options.map(o => ({ text: t(o[0], o[1]) })), answer, hint, solution
  });
  // an order step: options are written in the RIGHT order, the trainer shuffles them
  const ord = (prompt, options, hint, solution) => ({
    prompt, kind: 'order', options: options.map(o => ({ text: t(o[0], o[1]) })), hint, solution
  });

  const NAPH = 'c1ccc2ccccc2c1';
  const NITRO = '[O-][N+](=O)c1cccc2ccccc12';
  const PHENOL = 'Oc1ccccc1';
  const TBP = 'Oc1c(Br)cc(Br)cc1Br';
  const IMINE = 'C(=Nc1ccccc1)c1ccccc1';
  const ESTER = 'CC(=O)OCCC(C)C';
  const PHTH = 'O=C1OC(c2ccccc12)(c1ccc(O)cc1)c1ccc(O)cc1';
  const PHTH_ION = '[O-]C(=O)c1ccccc1C(c1ccc([O-])cc1)=C1C=CC(=O)C=C1.[Na+].[Na+]';
  const FLU = 'O=C1OC2(c3ccccc13)c1ccc(O)cc1Oc1cc(O)ccc12';
  const FLU_ION = '[O-]C(=O)c1ccccc1C1=C2C=CC(=O)C=C2Oc2cc([O-])ccc12.[Na+].[Na+]';
  const CUGLY = 'OCC1CO[Cu-2]2([OH+]1)OCC(CO)[OH+]2'; // Cu(C3H7O3)2 = C6H14CuO6: each glycerol binds through one O- (covalent) and one OH (donor)

  const U = {
    id: 'l6',
    notes: [
      {
        id: 'aim',
        title: t('Tikslas, įranga ir saugumas', 'Aim, equipment and safety'),
        blocks: [
          { h: t('Ko mokomasi šiame darbe', 'What this lab is about') },
          {
            p: t('Darbe atliekami kokybiniai bandymai: kiekvienai funkcinei grupei parenkamas reagentas, kuris duoda aiškų, matomą pokytį, tai yra spalvos kitimą, nuosėdas, dujas ar kvapą. Iš pokyčio sprendžiama, kokia grupė yra molekulėje. Gynime reikia mokėti užrašyti reakciją, pasakyti, ką matote, ir paaiškinti kodėl.',
              'The lab consists of qualitative tests: for each functional group a reagent is chosen that gives a clear visible change, such as a colour change, a precipitate, a gas or a smell. The change tells you which group the molecule contains. At the defence you must write the reaction, say what you see and explain why.'),
            src: 'LW6 p1'
          },
          {
            rule: t('Kokybinis bandymas = reagentas + matomas požymis + išvada apie funkcinę grupę. Požymis be paaiškinimo, kas jį sukelia, yra neužbaigtas atsakymas.',
              'A qualitative test = reagent + visible sign + conclusion about the functional group. A sign without an explanation of its cause is an unfinished answer.')
          },
          { h: t('Įranga', 'Equipment') },
          {
            list: [
              t('mėgintuvėliai, stovas, laikiklis; lašinamieji buteliukai su pipetėmis reagentams lašinti;', 'test tubes, a rack and a holder; dropper bottles for adding reagents by drops;'),
              t('mėgintuvėlis su kamščiu ir sulenktu dujų vamzdeliu: dujos praleidžiamos pro tirpalą;', 'a test tube with a stopper and a bent gas tube: the gas is bubbled through a solution;'),
              t('oro kondensatorius: ilgas stiklinis vamzdelis kamštyje, kuriame garai kondensuojasi ir grįžta atgal;', 'an air condenser: a long glass tube in the stopper in which vapours condense and run back;'),
              t('vandens vonia: stiklinė su verdančiu vandeniu ant elektrinės viryklės;', 'a water bath: a beaker of boiling water on an electric hot plate;'),
              t('stiklinė lazdelė, filtravimo popierius ir pincetas, UV lempa.', 'a glass rod, filter paper and tweezers, a UV lamp.')
            ],
            src: 'LW6 p1'
          },
          {
            pitfall: t('Koncentruotos $H2SO4$ ir $HNO3$ stipriai ėsdina, bromo vanduo ir fenolis nuodingi, anilinas lengvai įsiskverbia pro odą, o natris smarkiai reaguoja su vandeniu. Dirbkite su akiniais ir pirštinėmis, nuodingas medžiagas naudokite traukos spintoje, mėgintuvėlio angos nenukreipkite į žmones, o liekanas pilkite tik į atliekų indus.',
              'Concentrated $H2SO4$ and $HNO3$ are strongly corrosive, bromine water and phenol are toxic, aniline passes through skin and sodium reacts violently with water. Wear goggles and gloves, handle toxic substances in a fume hood, never point a tube at anyone and pour residues only into the waste containers.')
          },
          { practice: 'l6.apparatus' }
        ]
      },
      {
        id: 'ethene',
        title: t('Etenas ir dvigubojo ryšio bandymai', 'Ethene and the double-bond tests'),
        blocks: [
          { h: t('Eteno gavimas', 'Preparing ethene') },
          {
            p: t('Etanolis su koncentruota sieros rūgštimi pirmiausia sudaro etanolio ir sieros rūgšties esterį. Kaitinamas esteris skyla: išsiskiria etenas ir atsistato sieros rūgštis. Iš viso tai etanolio dehidratacija, vandens eliminavimas. Į mišinį įberiamas žiupsnelis $Al2O3$: jis veikia kaip virimo agentas (mišinys verda tolygiai, mažiau putoja) ir gali šiek tiek palengvinti vandens atskilimą.',
              'Ethanol and concentrated sulfuric acid first form ethyl hydrogen sulfate (the sulfuric acid ester of ethanol). On heating the ester breaks down: ethene is released and the sulfuric acid is regenerated. Overall this is dehydration of the alcohol, an elimination of water. A pinch of $Al2O3$ goes into the mixture: it acts as a boiling aid (the mixture boils evenly and foams less) and may slightly assist the loss of water.'),
            src: 'LW6 p1'
          },
          {
            scheme: {
              items: [
                { smi: 'CCO', name: t('etanolis', 'ethanol') }, { arrow: '→', above: t('konc. H2SO4', 'conc. H2SO4') },
                { smi: 'CCOS(=O)(=O)O' }, { arrow: '→', above: f('t°') },
                { smi: 'C=C', name: t('etenas', 'ethene') }
              ]
            },
            caption: t('Etanolis, esteris tarpinis junginys, etenas (kartu atsistato $H2SO4$).', 'Ethanol, the intermediate ester, ethene (with $H2SO4$ regenerated).'),
            src: 'LW6 p1'
          },
          {
            p: t('Dujos pirmiausia praleidžiamos pro geltoną bromo vandenį, paskui pro violetinį kalio permanganato tirpalą. Abu bandymai rodo dvigubąjį (ir trigubąjį) ryšį. Vandeninėje terpėje dalis eteno duoda 2-bromoetanolį (bromhidriną); kurse – 1,2-dibrometanas. Kartais kartu išsiskiria $SO2$ ir $CO2$ (iš sieros rūgšties ir anglėjančio etanolio): $SO2$ irgi pablukina bromo vandenį ir $KMnO4$.',
              'The gas is first led through yellow bromine water and then through violet potassium permanganate solution. Both tests reveal a double (or triple) bond. In water part of the ethene gives 2-bromoethanol (a bromohydrin); the course shows 1,2-dibromoethane. Sometimes $SO2$ and $CO2$ form as well (from sulfuric acid and charring ethanol): $SO2$ also decolourises bromine water and $KMnO4$.'),
            src: 'LW6 p1'
          },
          {
            scheme: {
              items: [
                { smi: 'C=C' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' },
                { smi: 'BrCCBr', name: t('1,2-dibrometanas', '1,2-dibromoethane') }
              ]
            },
            caption: t('Bromas jungiasi prie dvigubojo ryšio (AE), todėl geltona bromo vandens spalva išnyksta.', 'Bromine adds to the double bond (AE), so the yellow colour of bromine water disappears.'),
            src: 'LW6 p1'
          },
          {
            scheme: {
              items: [
                { smi: 'C=C' }, { plus: true }, { smi: 'O[Mn](=O)(=O)=O' }, { arrow: '→', above: f('H2O') },
                { smi: 'OCCO' }, { plus: true }, { smi: 'O=[Mn]=O' }
              ]
            },
            caption: t('$3 C2H4 + 2 KMnO4 + 4 H2O → 3 HOCH2CH2OH + 2 MnO2 + 2 KOH$: violetinis $MnO4-$ virsta rudomis $MnO2$ nuosėdomis, o etenas oksiduojamas į diolį.',
              '$3 C2H4 + 2 KMnO4 + 4 H2O → 3 HOCH2CH2OH + 2 MnO2 + 2 KOH$: violet $MnO4-$ becomes brown $MnO2$ precipitate, while ethene is oxidised to the diol.'),
            src: 'LW6 p1'
          },
          {
            rule: t('Bromo vandens ir $KMnO4$ spalvos išnykimas rodo dvigubąjį ar trigubąjį ryšį, bet neatskiria alkeno nuo alkino.',
              'Loss of colour of bromine water and of $KMnO4$ shows a double or triple bond, but does not tell an alkene from an alkyne.'),
            src: 'LW6 p1'
          },
          {
            pitfall: t('Prieš nustodami kaitinti ištraukite dujų vamzdelį iš tirpalo, kitaip vėstantis mišinys įsiurbs skystį atgal į karštą mėgintuvėlį.',
              'Take the gas tube out of the solution before you stop heating, otherwise the cooling mixture sucks the liquid back into the hot tube.')
          },
          { practice: 'l6.order' }
        ]
      },
      {
        id: 'arene',
        title: t('Naftaleno nitrinimas ir absoliutus etanolis', 'Nitration of naphthalene and absolute ethanol'),
        blocks: [
          { h: t('Naftaleno nitrinimas', 'Nitration of naphthalene') },
          {
            p: t('Keli naftaleno kristalai kaitinami su kelais lašais koncentruotos $HNO3$ vandens vonioje 5–10 min.; mėgintuvėlis uždarytas kamščiu su oro kondensatoriumi. Tai elektrofilinis aromatinis pakeitimas (SEAr). Elektrofilas $NO2+$ pirmiausia atakuoja padėtį 1 (α), nes tada susidarantis tarpinis katijonas turi daugiau rezonansinių formulių, kuriose lieka nepažeistas benzeno žiedas.',
              'A few naphthalene crystals are heated with a few drops of concentrated $HNO3$ in a water bath for 5–10 min; the tube is closed with a stopper carrying an air condenser. This is electrophilic aromatic substitution (SEAr). The electrophile $NO2+$ attacks position 1 (α) first, because the intermediate cation then has more resonance structures that keep an intact benzene ring.'),
            src: 'LW6 p1'
          },
          {
            scheme: { items: [{ smi: NAPH, name: t('naftalenas', 'naphthalene') }, { plus: true }, { smi: 'O[N+](=O)[O-]' }, { arrow: '→' }, { smi: NITRO, name: t('1-nitronaftalenas', '1-nitronaphthalene') }, { plus: true }, { smi: 'O' }] },
            src: 'LW6 p1'
          },
          {
            p: t('Kai naftalenas ištirpsta, viršuje atsiranda oranžinis alyvos pavidalo sluoksnis. Į atvėsintą mišinį įpylus 5 ml šalto vandens, nitrojunginys nusileidžia ant dugno ir sukietėja į geltonas nuosėdas: jis sunkesnis už vandenį ir jame netirpsta. Geltona spalva būdinga nitrojunginiams. Papildomai plonasluoksne chromatografija galima atskirti produktą nuo naftaleno: nitronaftalenas poliškesnis, todėl turi mažesnį $R_f$.',
              'When the naphthalene has dissolved, an orange oily layer appears on top. When 5 ml of cold water is added to the cooled mixture, the nitro compound sinks to the bottom and solidifies into a yellow solid: it is denser than water and insoluble in it. A yellow colour is typical of nitro compounds. As an extra, thin-layer chromatography separates the product from naphthalene: nitronaphthalene is more polar, so its $R_f$ is smaller.'),
            src: 'LW6 p1'
          },
          { h: t('Absoliutaus etanolio gavimas', 'Preparing absolute ethanol') },
          {
            p: t('Į sausą mėgintuvėlį su baltais bevandenio $CuSO4$ milteliais įpilkite apie 3 ml etanolio, gerai supurtykite ir palaukite, kol kietos dalelės nusės. Bevandenis sulfatas suriša vandenį į kristalhidratą, kuris yra melsvas: $CuSO4 + 5 H2O → CuSO4·5H2O$. Vandens dalis surišama kristalhidratu, ir gaunamas gerokai sausesnis (kurso aprašyme – „absoliutus“) etanolis; visiškai sausam etanoliui reikia stipresnio džiovinimo (pvz., $CaO$ ir distiliavimo). Spalvos pokytis rodo, kad vanduo tikrai buvo. Gautas etanolis nupilamas nuo nuosėdų.',
              'White anhydrous $CuSO4$ powder is placed in a dry test tube, 2–3 ml of ethanol are added, and the tube is shaken and left to settle. The anhydrous sulfate binds water as a pale blue crystal hydrate: $CuSO4 + 5 H2O → CuSO4·5H2O$. Part of the water is bound as the hydrate and a much drier ethanol results (the course text calls it "absolute"); fully dry ethanol needs stronger drying (for example $CaO$ followed by distillation). The colour change shows that water was really there. The ethanol is poured off the solid.'),
            src: 'LW6 p1'
          },
          {
            rule: t('Etanolis su vandeniu sudaro azeotropinį mišinį: 78,15 °C temperatūroje distiliuojasi 95,5 % etanolis, todėl frakcine distiliacija bevandenio etanolio negausi. Vandenį reikia surišti chemiškai.',
              'Ethanol and water form an azeotropic mixture: at 78.15 °C 95.5 % ethanol distils over, so fractional distillation cannot give absolute ethanol. The water must be bound chemically.'),
            src: 'LW6 p1'
          },
          { practice: 'l6.observe' }
        ]
      },
      {
        id: 'alk',
        title: t('Alkoksidai ir polihidroksiliai alkoholiai', 'Alkoxides and polyhydric alcohols'),
        blocks: [
          { h: t('Natrio etoksidas ir jo hidrolizė', 'Sodium ethoxide and its hydrolysis') },
          {
            p: t('Alkoholio $O-H$ vandenilis yra silpnai rūgštus, todėl natris jį išstumia: išsiskiria vandenilis ir susidaro natrio etoksidas. Mažas, filtravimo popieriumi nusausintas natrio gabalėlis įmetamas į absoliutų etanolį. Vanduo čia trukdytų: jis irgi reaguoja su natriu ir sudaro $NaOH$, kuris vėliau suklaidintų fenolftaleino bandymą.',
              'The $O-H$ hydrogen of an alcohol is weakly acidic, so sodium displaces it: hydrogen is released and sodium ethoxide forms. A small piece of sodium, dried with filter paper, is dropped into absolute ethanol. Water would interfere here: it also reacts with sodium and forms $NaOH$, which would later spoil the phenolphthalein test.'),
            src: 'LW6 p2'
          },
          {
            scheme: { items: [{ smi: 'CCO' }, { plus: true }, { smi: '[Na]' }, { arrow: '→' }, { smi: 'CC[O-].[Na+]' }, { plus: true }, { smi: '[H][H]' }] },
            caption: t('Dvi alkoholio molekulės ir du natrio atomai duoda dvi natrio etoksido vienetines formules ir vieną $H2$ molekulę. Dujas uždegus, jos sudega su trumpu pokštelėjimu.', 'Two alcohol molecules and two sodium atoms give two formula units of sodium ethoxide and one $H2$ molecule. When lit, the gas burns with a short pop.'),
            src: 'LW6 p2'
          },
          {
            p: t('Kai visas natris sureagavo, į mišinį pilama distiliuoto vandens ir lašinama fenolftaleino. Etoksido anijonas yra stipresnė bazė už vandenį, todėl iš vandens atima protoną: alkoksidas hidrolizuojasi į alkoholį ir $NaOH$, o šarminėje terpėje fenolftaleinas parausta.',
              'When all the sodium has reacted, distilled water is added to the mixture together with phenolphthalein. The ethoxide anion is a stronger base than water, so it takes a proton from the water: the alkoxide hydrolyses to the alcohol and $NaOH$, and in the alkaline medium phenolphthalein turns crimson.'),
            src: 'LW6 p2'
          },
          {
            scheme: { items: [{ smi: 'CC[O-].[Na+]' }, { plus: true }, { smi: 'O' }, { arrow: '→' }, { smi: 'CCO' }, { plus: true }, { smi: '[Na+].[OH-]' }] },
            src: 'LW6 p2'
          },
          { h: t('Glicerolis ir $Cu(OH)2$', 'Glycerol and $Cu(OH)2$') },
          {
            p: t('Vario sulfatas su $NaOH$ sudaro melsvas $Cu(OH)2$ nuosėdas. Pridėjus glicerolio ir supurčius, nuosėdos ištirpsta ir tirpalas tampa tamsiai mėlynas: dvi glicerolio molekulės sudaro kompleksą su variu. Deguonies atomų laisvosios poros jungiasi su $Cu$, o tokią chelatinę struktūrą padeda sudaryti gretimos hidroksigrupės.',
              'Copper sulfate and $NaOH$ give a pale blue $Cu(OH)2$ precipitate. On adding glycerol and shaking, the precipitate dissolves and the solution turns deep blue: two glycerol molecules form a complex with copper. Lone pairs of oxygen atoms bond to $Cu$, and neighbouring hydroxyl groups make this chelate structure possible.'),
            src: 'LW6 p2'
          },
          {
            scheme: { items: [{ smi: 'OCC(O)CO', name: t('1,2,3-propantriolis', 'propane-1,2,3-triol') }, { plus: true }, { smi: 'OCC(O)CO' }, { plus: true }, { smi: 'O[Cu]O' }, { arrow: '→' }, { smi: CUGLY }, { plus: true }, { smi: 'O' }, { plus: true }, { smi: 'O' }] },
            caption: t('Parodytas supaprastintas chelatas: kiekviena glicerolio liekana jungiasi su variu dviem gretimais deguonimis (viena – kovalentiškai, kita – donoriniu ryšiu iš $OH$). Lygtis: $Cu(OH)2 + 2 C3H8O3 → Cu(C3H7O3)2 + 2 H2O$.', 'A simplified chelate: each glycerol residue binds copper through two neighbouring oxygens (one covalent, one donor bond from $OH$). Equation: $Cu(OH)2 + 2 C3H8O3 → Cu(C3H7O3)2 + 2 H2O$.'),
            src: 'LW6 p2'
          },
          {
            rule: t('Tamsiai mėlyną kompleksą su $Cu(OH)2$ sudaro junginiai, turintys dvi donorines grupes prie gretimų anglies atomų: polihidroksiliai alkoholiai ir angliavandeniai (dvi $OH$ grupės), α-hidroksirūgštys ($OH$ ir $COO-$) bei α-aminorūgštys ($NH2$ ir $COO-$). Vienahidroksiliai alkoholiai jo nesudaro.',
              'A deep blue complex with $Cu(OH)2$ is given by compounds with two donor groups on neighbouring carbons: polyhydric alcohols and carbohydrates (two $OH$ groups), α-hydroxy acids ($OH$ and $COO-$) and α-amino acids ($NH2$ and $COO-$). Monohydric alcohols do not form it.'),
            src: 'LW6 p2'
          },
          {
            pitfall: t('Natrio niekada nemeskite į vandenį ar į mišinį, kuriame jo dar yra. Vandens pilkite tik tada, kai visas natris išnyko.',
              'Never put sodium into water, or into a mixture that still contains sodium. Add water only after all the sodium has gone.')
          },
          { practice: 'l6.why' }
        ]
      },
      {
        id: 'ox',
        title: t('Alkoholių ir aldehidų oksidacija', 'Oxidation of alcohols and aldehydes'),
        blocks: [
          { h: t('Etanolio oksidacija', 'Oxidation of ethanol') },
          {
            p: t('Dviejuose mėgintuvėliuose sumaišoma po mililitrą 1 M sieros rūgšties ir po pusę mililitro etanolio. Pirmasis gauna dichromato tirpalo (0,2 M), antrasis – permanganato (0,03 M), po 1 ml; abu šildomi, kol spalva pasikeičia. Pirminis alkoholis oksiduojamas į aldehidą, o šis toliau į karboksirūgštį.',
              'Into two test tubes go 1 ml of 1 M $H2SO4$ and 0.5 ml of ethanol each. To one is added 1 ml of 0.2 M $K2Cr2O7$, to the other 1 ml of 0.03 M $KMnO4$; the mixtures are heated until the colour changes. The primary alcohol is oxidised to an aldehyde and then on to a carboxylic acid.'),
            src: 'LW6 p2'
          },
          {
            scheme: {
              items: [
                { smi: 'CCO' }, { arrow: '→', above: f('[O]') },
                { smi: 'CC=O', name: t('etanalis', 'ethanal') }, { arrow: '→', above: f('[O]') },
                { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }
              ]
            },
            src: 'LW6 p2'
          },
          {
            table: {
              head: [t('Oksidatorius', 'Oxidant'), t('Prieš', 'Before'), t('Po', 'After'), t('Kas pasikeičia', 'What changes')],
              rows: [
                [t('$K2Cr2O7$ (rūgštinė terpė)', '$K2Cr2O7$ (acidic)'), t('oranžinis', 'orange'), t('žalias', 'green'), t('$Cr(+6)$ virsta $Cr(+3)$: $Cr2(SO4)3$', '$Cr(+6)$ becomes $Cr(+3)$: $Cr2(SO4)3$')],
                [t('$KMnO4$ (rūgštinė terpė)', '$KMnO4$ (acidic)'), t('violetinis', 'violet'), t('bespalvis (kartais rudos $MnO2$ nuosėdos)', 'colourless (sometimes brown $MnO2$)'), t('$Mn(+7)$ virsta $Mn(+2)$: $MnSO4$', '$Mn(+7)$ becomes $Mn(+2)$: $MnSO4$')]
              ]
            },
            src: 'LW6 p2'
          },
          {
            example: {
              q: [
                { p: t('Kiek etanolio molekulių oksiduoja viena dichromato dalelė $Cr2O7 2-$, kai alkoholis virsta rūgštimi?', 'How many ethanol molecules does one dichromate ion $Cr2O7 2-$ oxidise when the alcohol is turned into the acid?') },
                { scheme: { items: [{ smi: 'CCO', name: t('etanolis', 'ethanol') }, { arrow: '→', above: f('[O]') }, { smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }] } }
              ],
              steps: [
                [{ p: t('Dichromate yra du $Cr(+6)$, o gale – du $Cr(+3)$: viena dalelė priima 6 elektronus.', 'The dichromate contains two $Cr(+6)$, which end as two $Cr(+3)$: one ion accepts 6 electrons.') }],
                [{ p: t('Alkoholio $CH2OH$ anglis turi oksidacijos laipsnį −1, rūgšties $COOH$ anglis +3: viena molekulė atiduoda 4 elektronus.', 'The $CH2OH$ carbon of the alcohol has oxidation state −1 and the $COOH$ carbon of the acid +3: one molecule gives up 4 electrons.') }],
                [{ p: t('Elektronų balansas: 6 : 4 = 1,5. Taigi 2 dichromato dalelės oksiduoja 3 etanolio molekules.', 'Electron balance: 6 : 4 = 1.5. So 2 dichromate ions oxidise 3 ethanol molecules.') }]
              ]
            },
            claims: [{ formula: ['CCO', 'C2H6O'] }, { formula: ['CC(=O)O', 'C2H4O2'] }]
          },
          { h: t('Aldehidų oksidacija $Cu(OH)2$', 'Oxidation of aldehydes by $Cu(OH)2$') },
          {
            p: t('Į formaldehido tirpalą su $NaOH$ lašinamas $CuSO4$, kol atsiranda pastovus drumstis ($Cu(OH)2$). Šildoma tik viršutinė dalis, o apatinė lieka mėlyna kaip kontrolė. Aldehidas oksiduojamas į rūgštį (šarminėje terpėje į druską), o $Cu(II)$ redukuojasi: geltonas $CuOH$ pereina į raudoną $Cu2O$, o metanalis gali redukuoti ir iki metalinio vario, kuris nusėda ant mėgintuvėlio sienelių (vario veidrodis). Be aldehido kaitinamas $Cu(OH)2$ tik skyla į juodą $CuO$.',
              'Copper sulfate is added dropwise to a formaldehyde solution containing $NaOH$ until a lasting turbidity of $Cu(OH)2$ appears. Only the upper part is heated, the lower part stays blue as a control. The aldehyde is oxidised to an acid (to its salt in alkaline medium) while $Cu(II)$ is reduced: yellow $CuOH$ turns into red $Cu2O$, and methanal can reduce copper even to the metal, which deposits on the tube wall (copper mirror). Without an aldehyde, heated $Cu(OH)2$ merely decomposes to black $CuO$.'),
            src: 'LW6 p3'
          },
          {
            scheme: { items: [{ smi: 'C=O', name: t('metanalis', 'methanal') }, { plus: true }, { smi: 'O[Cu]O' }, { arrow: '→', above: f('t°') }, { smi: 'O=CO', name: t('metano rūgštis', 'methanoic acid') }, { plus: true }, { smi: 'O' }, { plus: true }, { smi: '[Cu]O' }] },
            caption: t('Lygtis su koeficientais: $HCHO + 2 Cu(OH)2 → HCOOH + 2 CuOH + H2O$. Spalvų eilė: mėlyna, geltona ($CuOH$), raudona ($Cu2O$), vario veidrodis ($Cu$).', 'Equation with coefficients: $HCHO + 2 Cu(OH)2 → HCOOH + 2 CuOH + H2O$. Colour sequence: blue, yellow ($CuOH$), red ($Cu2O$), copper mirror ($Cu$).'),
            src: 'LW6 p3'
          },
          {
            rule: t('Aldehidai redukuoja $Cu(II)$ šarminėje terpėje, o ketonai ne, todėl bandymas aldehidinę grupę atskiria nuo ketoninės. Sidabro veidrodžio reakcija su amoniakiniu $Ag2O$ tirpalu rodo tą patį.',
              'Aldehydes reduce $Cu(II)$ in alkaline medium and ketones do not, so the test tells an aldehyde group from a ketone group. The silver mirror reaction with ammoniacal $Ag2O$ shows the same.'),
            src: 'LW6 p3'
          },
          { practice: 'l6.proves' }
        ]
      },
      {
        id: 'phenol',
        title: t('Fenolio brominimas ir Šifo bazė', 'Bromination of phenol and a Schiff base'),
        blocks: [
          { h: t('Fenolio brominimas', 'Bromination of phenol') },
          {
            p: t('Mažame fenolio tirpalo (5 %) kiekyje lašinamas bromo vanduo. Bromo spalva išnyksta, o iš tirpalo iškrenta baltos tribromfenolio nuosėdos. Hidroksigrupė yra elektronų donorė (+M), todėl žiedo elektronų tankis padidėja, ypač padėtyse $o$ ir $p$. Fenolis taip lengvai dalyvauja SEAr reakcijoje, kad nereikia nei katalizatoriaus, nei kaitinimo.',
              'Bromine water is added dropwise to 0.5 ml of 5 % phenol solution. The bromine colour vanishes and white tribromophenol precipitates. The hydroxyl group is an electron donor (+M), so the electron density of the ring rises, above all at the $o$ and $p$ positions. Phenol takes part in SEAr so easily that neither a catalyst nor heating is needed.'),
            src: 'LW6 p2'
          },
          {
            scheme: { items: [{ smi: PHENOL, name: t('fenolis', 'phenol') }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }, { smi: TBP, name: t('2,4,6-tribromfenolis', '2,4,6-tribromophenol') }, { plus: true }, { smi: 'Br' }] },
            caption: t('Reakcijos lygtis: 1 fenolis + 3 $Br2$, išsiskiria $3 HBr$.', 'Equation: 1 phenol + 3 $Br2$, releasing $3 HBr$.'),
            src: 'LW6 p2'
          },
          {
            example: {
              q: [
                { p: t('Prie kurių fenolio žiedo atomų jungiasi bromas? Atomų numeriai pažymėti paveikslėlyje.', 'At which ring atoms of phenol does bromine enter? The atom numbers are shown in the picture.') },
                { mol: { smi: PHENOL, name: t('fenolis', 'phenol'), opts: { numbers: 'all' } } }
              ],
              steps: [
                [{ p: t('Atomas Nr. 1 yra deguonis, Nr. 2 – žiedo anglis su $OH$ grupe. Hidroksigrupė yra $o,p$-orientantas.', 'Atom no. 1 is the oxygen, no. 2 is the ring carbon bearing $OH$. The hydroxyl group is an $o,p$ director.') }],
                [{ p: t('Orto padėtyse yra atomai Nr. 3 ir Nr. 7, para padėtyje – Nr. 5.', 'The ortho positions are atoms no. 3 and no. 7, the para position is no. 5.') }],
                [{ p: t('Bromo vandenyje aktyvus fenolis pakeičia visas tris padėtis, todėl susidaro tribromfenolis.', 'In bromine water the activated phenol is substituted at all three positions, so the tribromophenol forms.') }, { mol: { smi: TBP, name: t('2,4,6-tribromfenolis', '2,4,6-tribromophenol') } }]
              ]
            },
            claims: [{ react: ['phenol.br2', [PHENOL], null, TBP] }, { formula: [TBP, 'C6H3Br3O'] }]
          },
          { h: t('Šifo bazės sintezė', 'Synthesis of a Schiff base') },
          {
            p: t('Benzenkarbaldehidas ir anilinas, imami vienodais lašų skaičiais (po tris), sumaišomi kambario temperatūroje. Amino grupė nukleofiliškai prisijungia prie aldehido karbonilo anglies, o po to atskyla vanduo ir susidaro $C=N$ ryšys. Gaunama kieta gelsva medžiaga, kuri atšaldoma, stiklo lazdele pasukinėjama sienelė, kad prasidėtų kristalizacija (kurso paaiškinime – gryninama kristalinant iš etanolio).',
              'Three drops each of benzaldehyde and aniline are mixed at room temperature. The amino group adds nucleophilically to the carbonyl carbon of the aldehyde, then water is lost and a $C=N$ bond forms. A yellowish solid results; it is cooled, the wall is scratched with a glass rod to start crystallisation (the course explanation purifies it by crystallisation from ethanol).'),
            src: 'LW6 p3'
          },
          {
            scheme: { items: [{ smi: 'O=Cc1ccccc1', name: t('benzenkarbaldehidas', 'benzaldehyde') }, { plus: true }, { smi: 'Nc1ccccc1', name: t('anilinas', 'aniline') }, { arrow: '→' }, { smi: IMINE }, { plus: true }, { smi: 'O' }] },
            caption: t('Junginiai su grupe $R-CH=N-R$ yra iminai, kitaip – Šifo bazės.', 'Compounds $R-CH=N-R$ of this kind are called imines or Schiff bases.'),
            src: 'LW6 p3'
          },
          {
            pitfall: t('Lašų skaičius turi būti vienodas: reagentai jungiasi santykiu 1 : 1, o perteklius lieka produkte kaip priemaiša ir neleidžia jam sukietėti. Anilinas lengvai oksiduojasi ir rusvėja, todėl tinka tik šviežias.',
              'Count the drops carefully: the reagents combine 1 : 1, and any excess stays in the product as an impurity that keeps it from solidifying. Aniline oxidises easily and turns brown, so only fresh aniline will do.')
          },
          { practice: 'l6.products' }
        ]
      },
      {
        id: 'ester',
        title: t('Esterio ir ftaleinų sintezė', 'Synthesis of an ester and of phthaleins'),
        blocks: [
          { h: t('Izopentilacetatas', 'Isopentyl acetate') },
          {
            p: t('Kelių lašų acto rūgšties, kiek daugiau lašų izopentanolio ir lašo koncentruotos $H2SO4$ mišinys apie dešimt minučių kaitinamas karštoje vandens vonioje, mėgintuvėlį uždarius oro kondensatoriumi. Esterinimas yra grįžtamoji reakcija: sieros rūgštis ją katalizuoja ir suriša dalį vandens, o kaitinimas pagreitina pusiausvyros pasiekimą.',
              'Three to five drops of acetic acid, 5–8 drops of isopentanol and a drop of concentrated $H2SO4$ are heated in a boiling water bath for 7–10 min with an air condenser. Esterification is reversible: sulfuric acid catalyses it and binds some water, while heating speeds up the approach to equilibrium.'),
            src: 'LW6 p3'
          },
          {
            scheme: { items: [{ smi: 'CC(=O)O', name: t('etano rūgštis', 'ethanoic acid') }, { plus: true }, { smi: 'CC(C)CCO', name: t('3-metil-1-butanolis', '3-methylbutan-1-ol') }, { arrow: '⇌', above: f('H2SO4') }, { smi: ESTER, name: t('3-metilbutiletanoatas', '3-methylbutyl ethanoate') }, { plus: true }, { smi: 'O' }] },
            src: 'LW6 p3'
          },
          {
            p: t('Mišinys atvėsinamas, po to į jį įpilama 5 ml šalto vandens. Esterio tankis mažesnis nei vandens ir jis vandenyje netirpsta, todėl plūduriuoja viršuje; esterių kvapas malonus, vaisių, todėl jį galima atpažinti uostant (atsargiai, ranka pamojuojant garus link nosies).',
              'The mixture is cooled and diluted with 5 ml of cold water. The ester is less dense than water and immiscible with it, so a layer forms on top; esters smell pleasantly fruity, so the smell identifies them (sniff carefully by wafting the vapour towards you).'),
            src: 'LW6 p3'
          },
          {
            example: {
              q: [
                { p: t('Iš 4,0 g izopentanolio ($M$ = 88,15 g/mol) gauta 3,2 g izopentilacetato ($M$ = 130,18 g/mol). Koks išeigos procentas?', 'From 4.0 g of isopentanol ($M$ = 88.15 g/mol) 3.2 g of isopentyl acetate ($M$ = 130.18 g/mol) was obtained. What is the yield in per cent?') },
                { scheme: { items: [{ smi: 'CC(C)CCO' }, { arrow: '→', above: f('CH3COOH') }, { smi: ESTER }] } }
              ],
              steps: [
                [{ p: t('Reakcijoje 1 mol alkoholio duoda 1 mol esterio. Alkoholio kiekis: 4,0 / 88,15 = 0,0454 mol.', 'In the reaction 1 mol of alcohol gives 1 mol of ester. Amount of alcohol: 4.0 / 88.15 = 0.0454 mol.') }],
                [{ p: t('Teorinė esterio masė: 0,0454 · 130,18 = 5,91 g.', 'Theoretical mass of ester: 0.0454 · 130.18 = 5.91 g.') }],
                [{ p: t('Išeiga = 3,2 / 5,91 · 100 % = 54 %.', 'Yield = 3.2 / 5.91 · 100 % = 54 %.') }]
              ]
            },
            claims: [{ formula: ['CC(C)CCO', 'C5H12O'] }, { formula: [ESTER, 'C7H14O2'] }, { react: ['acid.ester', ['CC(=O)O', 'CC(C)CCO'], null, ESTER] }]
          },
          { h: t('Fenolftaleino ir fluoresceino sintezė', 'Synthesis of phenolphthalein and fluorescein') },
          {
            p: t('Ftalio anhidridas kaitinamas su dvigubu fenolio kiekiu ir lašu koncentruotos $H2SO4$, kol masė išsilydo ir parausta. Vyksta kondensacija, sieros rūgštis suriša vandenį. Lydalas atvėsinamas ir tirpinamas karštame vandenyje (šaltas vanduo gali sutrūkdyti karštą stiklą). Naudokite kuo mažiau medžiagos, nes mėgintuvėlius sunku išplauti.',
              'Phthalic anhydride is heated with twice the amount of phenol and a drop of concentrated $H2SO4$ until the mass melts and turns red. A condensation takes place and sulfuric acid binds the water. The melt is cooled and dissolved in hot water (cold water can crack hot glass). Use as little material as possible, since the tubes are hard to clean.'),
            src: 'LW6 p3'
          },
          {
            scheme: { items: [{ smi: 'O=C1OC(=O)c2ccccc12', name: t('ftalio anhidridas', 'phthalic anhydride') }, { plus: true }, { smi: PHENOL }, { arrow: '→', above: f('H2SO4') }, { smi: PHTH }] },
            caption: t('Reakcijai reikia 2 molių fenolio; išsiskiria $H2O$. Produktas – fenolftaleinas, bespalvis laktonas.', 'The reaction needs 2 mol of phenol and releases $H2O$; the product is phenolphthalein, a colourless lactone.'),
            src: 'LW6 p3'
          },
          {
            scheme: { items: [{ smi: PHTH }, { arrow: '⇌', above: f('2 NaOH') }, { smi: PHTH_ION }] },
            caption: t('Šarminėje terpėje laktono žiedas atsiveria ir vienas žiedas tampa chinoidiniu: dvi para-pakeistos žiedų sistemos sujungiamos per centrinę anglį į vieną konjuguotą sistemą, todėl tirpalas raudonai violetinis (kurso apraše – „visus žiedus apimanti“ sistema).', 'In alkali the lactone ring opens and one ring becomes quinoid: the two para-substituted rings are joined through the central carbon into one conjugated system, hence the red-violet colour (the course text speaks of a system "spanning all rings").'),
            src: 'LW6 p4'
          },
          {
            p: t('Su rezorcinoliu vietoj fenolio susidaro fluoresceinas. Jo tirpalas šarmuose ryškiai žaliai fluorescuoja, ypač UV šviesoje.',
              'With resorcinol instead of phenol, fluorescein forms. Its alkaline solution fluoresces brightly green, above all in UV light.'),
            src: 'LW6 p4'
          },
          {
            scheme: { items: [{ smi: 'O=C1OC(=O)c2ccccc12' }, { plus: true }, { smi: 'Oc1cccc(O)c1', name: t('1,3-benzendiolis', 'benzene-1,3-diol') }, { arrow: '→', above: f('H2SO4') }, { smi: FLU, opts: { coords: [[2.489, 2.116], [2.083, 1.203], [1.105, 0.995], [1, 0], [1.914, -0.407], [2.223, -1.358], [3.201, -1.566], [3.87, -0.823], [3.561, 0.128], [2.583, 0.336], [0.5, 0.866], [1, 1.732], [0.5, 2.598], [-0.5, 2.598], [-1, 3.464], [-1, 1.732], [-0.5, 0.866], [-1, 0], [-0.5, -0.866], [-1, -1.732], [-0.5, -2.598], [-1, -3.464], [0.5, -2.598], [1, -1.732], [0.5, -0.866]] } }, { arrow: '⇌', above: f('2 NaOH') }, { smi: FLU_ION }] },
            src: 'LW6 p4'
          },
          { practice: 'l6.calc' },
          { practice: 'l6.defence' }
        ]
      }
    ],
    summary: [
      { h: t('Bandymų santrauka', 'Summary of the tests') },
      {
        table: {
          head: [t('Bandymas', 'Test'), t('Stebima', 'Observed'), t('Išvada', 'Conclusion')],
          rows: [
            [t('Etenas + bromo vanduo', 'Ethene + bromine water'), t('geltona spalva išnyksta', 'yellow colour disappears'), t('dvigubasis ryšys (AE)', 'double bond (AE)')],
            [t('Etenas + $KMnO4$', 'Ethene + $KMnO4$'), t('violetinė spalva išnyksta, rudos $MnO2$ nuosėdos', 'violet disappears, brown $MnO2$'), t('dvigubasis ryšys, oksidacija į diolį', 'double bond, oxidation to a diol')],
            [t('Naftalenas + $HNO3$', 'Naphthalene + $HNO3$'), t('geltonas junginys, sunkesnis už vandenį', 'yellow compound denser than water'), t('1-nitronaftalenas (SEAr)', '1-nitronaphthalene (SEAr)')],
            [t('Etanolis + bevandenis $CuSO4$', 'Ethanol + anhydrous $CuSO4$'), t('baltas junginys pamėlsta', 'white solid turns pale blue'), t('vanduo surištas: etanolis nusausinamas, bet absoliutus negaunamas', 'water is bound: the ethanol is dried, but not made absolute')],
            [t('Etanolis + $Na$, paskui vanduo + fenolftaleinas', 'Ethanol + $Na$, then water + phenolphthalein'), t('$H2$ dujos; raudonai violetinė spalva', '$H2$ gas; red-violet colour'), t('rūgštus $O-H$; alkoksidas hidrolizuojasi į $NaOH$', 'acidic $O-H$; alkoxide hydrolyses to $NaOH$')],
            [t('Glicerolis + $Cu(OH)2$', 'Glycerol + $Cu(OH)2$'), t('nuosėdos ištirpsta, tamsiai mėlyna', 'precipitate dissolves, deep blue'), t('gretimos $OH$ grupės', 'neighbouring $OH$ groups')],
            [t('Etanolis + $K2Cr2O7$ / $KMnO4$', 'Ethanol + $K2Cr2O7$ / $KMnO4$'), t('oranžinė virsta žalia; violetinė išnyksta', 'orange turns green; violet fades'), t('alkoholis oksiduojamas', 'alcohol is oxidised')],
            [t('Fenolis + bromo vanduo', 'Phenol + bromine water'), t('spalva išnyksta, baltos nuosėdos', 'colour disappears, white precipitate'), t('fenolis, 2,4,6-tribromfenolis (SEAr)', 'phenol, 2,4,6-tribromophenol (SEAr)')],
            [t('Metanalis + $Cu(OH)2$, kaitinimas', 'Methanal + $Cu(OH)2$, heating'), t('geltona, raudona, vario veidrodis', 'yellow, red, copper mirror'), t('aldehidas redukuoja $Cu(II)$', 'aldehyde reduces $Cu(II)$')],
            [t('Benzenkarbaldehidas + anilinas', 'Benzaldehyde + aniline'), t('gelsva kieta medžiaga', 'yellowish solid'), t('imino (Šifo bazės) susidarymas', 'imine (Schiff base) formed')],
            [t('Acto rūgštis + izopentanolis, $H2SO4$', 'Acetic acid + isopentanol, $H2SO4$'), t('sluoksnis viršuje, vaisių kvapas', 'layer on top, fruity smell'), t('esteris', 'ester')],
            [t('Ftalio anhidridas + fenolis, paskui $NaOH$', 'Phthalic anhydride + phenol, then $NaOH$'), t('raudonai violetinė spalva', 'red-violet colour'), t('chinoidinė konjuguota sistema', 'quinoid conjugated system')]
          ]
        }
      },
      {
        list: [
          t('Bevandenio etanolio negalima gauti distiliacija: azeotropas 95,5 %.', 'Absolute ethanol cannot be made by distillation: the azeotrope is 95.5 %.'),
          t('Šifo bazės sintezėje svarbus santykis 1 : 1; esterinimas yra grįžtamas.', 'For the Schiff base the 1 : 1 ratio matters; esterification is reversible.'),
          t('Karštą stiklą šaltu vandeniu aušinti negalima.', 'Never cool hot glass with cold water.')
        ]
      }
    ],
    types: [
      {
        id: 'l6.order',
        title: t('Darbo eiga: išdėstykite žingsnius', 'Procedure: put the steps in order'),
        mirrors: ['LW6.1', 'LW6.2', 'LW6.3', 'LW6.4', 'LW6.5', 'LW6.8', 'LW6.10', 'LW6.11'],
        bank: [
          {
            id: 'l6.order.1',
            q: [{ p: t('Gaunate eteną ir tikrinate jo savybes.', 'You prepare ethene and test its properties.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Į du mažesnius mėgintuvėlius įpilti bromo vandens ir $KMnO4$ tirpalo', 'Put bromine water and $KMnO4$ solution into the two smaller tubes'],
                ['Į didesnį mėgintuvėlį įpilti etanolio, konc. $H2SO4$ ir $Al2O3$', 'Put ethanol, conc. $H2SO4$ and $Al2O3$ into the larger tube'],
                ['Užkimšti kamščiu su dujų vamzdeliu ir pradėti kaitinti', 'Close with the stopper carrying the gas tube and start heating'],
                ['Dujas praleisti pro bromo vandenį, kol išnyks spalva', 'Lead the gas through bromine water until the colour disappears'],
                ['Tas pačias dujas praleisti pro $KMnO4$ tirpalą', 'Lead the same gas through the $KMnO4$ solution']
              ],
              t('Pirmiausia paruoškite viską, kas reikalinga dujoms priimti, ir tik tada pradėkite kaitinti.', 'First prepare everything that will receive the gas, and only then start to heat.'),
              t('Gaunamo eteno negalima laikyti: jis iškart turi patekti į priimantį tirpalą. Todėl pirma paruošiami mėgintuvėliai su reagentais, paskui sudedamas mišinys, kaitinama, o dujos eina iš eilės pro du tirpalus.', 'The ethene cannot be stored: it must go straight into the receiving solution. So the tubes with reagents are prepared first, then the mixture is made up and heated, and the gas passes through the two solutions in turn.')
            )],
            why: t('Kad dujos nenueitų veltui, priimantys tirpalai turi būti paruošti prieš kaitinimą; tvarka (pirma bromas, paskui $KMnO4$) leidžia palyginti abu bandymus su ta pačia dujų srove.', 'So that no gas is wasted, the receiving solutions must be ready before heating; the order (bromine first, then $KMnO4$) lets you compare both tests on the same gas stream.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.order.2',
            q: [{ p: t('Nitrinate naftaleną ir gausite produktą kietos medžiagos pavidalu.', 'You nitrate naphthalene and obtain the product as a solid.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Į sausą mėgintuvėlį suberti naftaleno kristalų ir įlašinti konc. $HNO3$', 'Put naphthalene crystals into a dry tube and add conc. $HNO3$'],
                ['Užkimšti kamščiu su oro kondensatoriumi', 'Close with a stopper carrying an air condenser'],
                ['Kaitinti verdančio vandens vonioje, purtant, kol naftalenas ištirps', 'Heat in a boiling water bath, shaking, until the naphthalene has dissolved'],
                ['Pastebėti viršuje oranžinį alyvos sluoksnį', 'Note the orange oily layer on top'],
                ['Į atvėsintą mišinį įpilti 5 ml šalto vandens ir stebėti, kaip junginys nusėda ir sukietėja', 'Add 5 ml of cold water to the cooled mixture and watch the compound settle and solidify']
              ],
              t('Šaltas vanduo pilamas paskutinis: jis ne dalis reakcijos, o būdas produktą išskirti.', 'Cold water comes last: it is not part of the reaction but a way to separate the product.'),
              t('Pirma reagentai ir uždarymas su kondensatoriumi, paskui kaitinimas ir stebėjimas, o išskyrimas vandeniu darbo pabaigoje.', 'Reagents and closing with the condenser come first, then heating and observing, and separation with water at the end.')
            )],
            why: t('Reakcijos mišinys atskiedžiamas tik pabaigoje: vandens pridėjimas sustabdo nitrinimą ir išskiria vandenyje netirpų produktą.', 'The reaction mixture is diluted only at the end: adding water stops the nitration and separates the product that is insoluble in water.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.order.3',
            q: [{ p: t('Etanolį veikiate natriu ir tikrinate, kas susidaro.', 'You treat ethanol with sodium and test what forms.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Į etanolį įmesti mažą, popieriumi nusausintą natrio gabalėlį', 'Drop a small piece of sodium, dried with paper, into the ethanol'],
                ['Pirštu uždengti mėgintuvėlį ir leisti dujoms susikaupti', 'Cover the tube with a finger and let the gas collect'],
                ['Prie angos prikišti degantį degtuką', 'Hold a burning match to the mouth of the tube'],
                ['Kai natris visiškai sureagavo, įpilti distiliuoto vandens', 'When all the sodium has reacted, add distilled water'],
                ['Įlašinti fenolftaleino ir stebėti spalvą', 'Add phenolphthalein and watch the colour']
              ],
              t('Pagalvokite, kada saugu pilti vandens.', 'Think about when it is safe to add water.'),
              t('Pirmiausia vyksta natrio ir alkoholio reakcija, paskui dujos išbandomos, ir tik tada, kai natrio nebelieka, tirpalas hidrolizuojamas vandeniu ir tikrinamas indikatoriumi.', 'The reaction of sodium with alcohol comes first, the gas is then tested, and only when no sodium is left is the solution hydrolysed with water and checked with the indicator.')
            )],
            why: t('Vandens pridėjimas anksčiau būtų pavojingas (natris su vandeniu reaguoja smarkiai) ir suklaidintų: $NaOH$ susidarytų ir be alkoksido.', 'Adding water earlier would be dangerous (sodium reacts violently with water) and misleading: $NaOH$ would form even without alkoxide.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.order.4',
            q: [{ p: t('Tikrinate, ar glicerolis sudaro kompleksą su variu.', 'You check whether glycerol forms a complex with copper.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Į mėgintuvėlį įlašinti $CuSO4$ ir $NaOH$ tirpalų', 'Add $CuSO4$ and $NaOH$ solutions to the tube'],
                ['Pastebėti melsvas $Cu(OH)2$ nuosėdas', 'Note the pale blue $Cu(OH)2$ precipitate'],
                ['Įlašinti glicerolio', 'Add glycerol'],
                ['Supurtyti', 'Shake'],
                ['Pastebėti tamsiai mėlyną tirpalą', 'Note the deep blue solution']
              ],
              t('Pirmiausia reikia gauti $Cu(OH)2$ ir pamatyti, kad nuosėdos neištirpsta pačios.', 'First the $Cu(OH)2$ must be made, and you must see that the precipitate does not dissolve on its own.'),
              t('Pirma gaunamas $Cu(OH)2$ ir užfiksuojama jo spalva, tik paskui pridedamas glicerolis; todėl matyti, kad nuosėdų ištirpimą sukėlė jis.', 'The $Cu(OH)2$ is made first and its colour recorded, then glycerol is added; so it is clear that the glycerol caused the precipitate to dissolve.')
            )],
            why: t('Palyginti „prieš“ ir „po“ galima tik tada, kai pirmoji būsena užfiksuota. Tai bendras kokybinių bandymų principas.', 'A before-and-after comparison is possible only when the first state has been noted. This is a general principle of qualitative tests.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.order.5',
            q: [{ p: t('Tikrinate formaldehidą $Cu(OH)2$.', 'You test formaldehyde with $Cu(OH)2$.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Į formaldehido tirpalą įpilti $NaOH$', 'Add $NaOH$ to the formaldehyde solution'],
                ['Lašinti $CuSO4$, kol atsiranda pastovi drumstis', 'Add $CuSO4$ dropwise until a lasting turbidity appears'],
                ['Kaitinti tik viršutinę skysčio dalį', 'Heat only the upper part of the liquid'],
                ['Stebėti, kaip spalva keičiasi iš geltonos į raudoną', 'Watch the colour change from yellow to red'],
                ['Pastebėti vario veidrodį ant sienelių', 'Notice the copper mirror on the wall']
              ],
              t('Reagentas $Cu(OH)2$ turi būti gautas šarminėje aplinkoje, prieš kaitinant.', '$Cu(OH)2$ must be formed in alkaline medium before heating.'),
              t('Šarminis tirpalas ir $CuSO4$ sudaro $Cu(OH)2$, tada kaitinama viršutinė dalis, kad apatinė liktų kontrolei.', 'The alkaline solution and $CuSO4$ form $Cu(OH)2$, then the upper part is heated so that the lower part remains as a control.')
            )],
            why: t('Redukcija vyksta tik šildant, o tolesnis redukavimas iki metalo (veidrodis) gali įvykti vėliau. Šildant tik dalį tirpalo, lieka lyginamasis mėlynas sluoksnis.', 'Reduction takes place only on heating, and further reduction to the metal (mirror) may follow later. Heating only part of the solution leaves a blue comparison layer.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.order.6',
            q: [{ p: t('Sintezuojate izopentilacetatą.', 'You synthesise isopentyl acetate.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Sumaišyti acto rūgštį, izopentanolį ir lašą konc. $H2SO4$', 'Mix acetic acid, isopentanol and a drop of conc. $H2SO4$'],
                ['Uždaryti kamščiu su oro kondensatoriumi', 'Close with a stopper carrying an air condenser'],
                ['Šildyti karštoje vandens vonioje maždaug dešimt minučių', 'Heat in a boiling water bath for 7–10 min'],
                ['Atvėsinti ir praskiesti 5 ml šalto vandens', 'Cool and dilute with 5 ml of cold water'],
                ['Atpažinti sluoksnį viršuje ir pauostyti', 'Identify the layer on top and sniff carefully']
              ],
              t('Kaitinama su kondensatoriumi, o skiedžiama tik po to.', 'Heating goes with the condenser, and dilution comes only afterwards.'),
              t('Reakcijos mišinys pirmiausia sudaromas ir kaitinamas, o esteris išskiriamas vandeniu tik pabaigoje, nes jis lengvesnis už vandenį ir plūduriuoja viršuje.', 'The reaction mixture is made and heated first, and the ester is separated with water at the end, because it is less dense than water and floats.')
            )],
            why: t('Kondensatorius grąžina nulakstančius garus, o praskiedimas vandeniu atskiria nesimaišantį esterį nuo vandenyje tirpių rūgščių.', 'The condenser returns vapours that would escape, and dilution with water separates the immiscible ester from the water-soluble acids.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.order.7',
            q: [{ p: t('Gaunate fenolftaleiną ir išbandote jo spalvą.', 'You make phenolphthalein and test its colour.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Sausame mėgintuvėlyje sumaišyti ftalio anhidridą ir dvigubai daugiau fenolio, įlašinti konc. $H2SO4$', 'Mix phthalic anhydride with twice as much phenol in a dry tube and add conc. $H2SO4$'],
                ['Kaitinti virš elektrinės viryklės, kol išsilydys ir parausta', 'Heat over the hot plate until the mass melts and turns red'],
                ['Atvėsinti ir įpilti karšto vandens', 'Cool and add hot water'],
                ['Į švarų mėgintuvėlį nupilti 1 ml gauto tirpalo', 'Pour 1 ml of the solution into a clean tube'],
                ['Lašinti $NaOH$, kol tirpalas pakeis spalvą', 'Add $NaOH$ dropwise until the solution changes colour']
              ],
              t('Pagalvokite, kuris skystis turi būti pridėtas prieš ir kuris po kaitinimo.', 'Think about which liquid is added before and which after heating.'),
              t('Pirmiausia vyksta kondensacija lydale, tada produktas ištirpinamas, o tik paskui bandoma jo spalva šarmu.', 'The condensation in the melt comes first, then the product is dissolved, and only afterwards its colour is tested with alkali.')
            )],
            why: t('Sintezė ir indikatoriaus savybių bandymas yra skirtingi etapai: spalva atsiranda tik pridėjus šarmo ir atsivėrus laktono žiedui.', 'Synthesis and the indicator test are separate stages: the colour appears only on adding alkali, when the lactone ring opens.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.order.8',
            q: [{ p: t('Gaunate absoliutų etanolį chemiškai.', 'You make absolute ethanol chemically.') }],
            steps: [ord(
              t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'),
              [
                ['Į sausą mėgintuvėlį suberti baltų bevandenio $CuSO4$ miltelių', 'Put white anhydrous $CuSO4$ powder into a dry tube'],
                ['Pilti 2–3 ml etanolio', 'Add 2–3 ml of ethanol'],
                ['Supurtyti ir palikti nusistoti', 'Shake and leave to settle'],
                ['Pastebėti, kad milteliai pamėlo', 'Notice that the powder turns blue'],
                ['Atsargiai nupilti etanolį nuo nuosėdų', 'Carefully pour the ethanol off the solid']
              ],
              t('Milteliai turi būti sausi iki pat pradžios.', 'The powder must be dry right from the start.'),
              t('Pirmiausia sausas vandens surišėjas ir etanolis, tada supurtymas, kad kontaktas būtų pilnas, galiausiai nupilamas gryniausias skystis.', 'The dry water binder and ethanol come first, then shaking so that contact is complete, and finally the dried liquid is poured off.')
            )],
            why: t('Absoliutaus etanolio negalima gauti distiliuojant (azeotropas), todėl vanduo surišamas kristalhidratu ir tik tada skystis atskiriamas.', 'Absolute ethanol cannot be made by distillation (azeotrope), so the water is bound as a crystal hydrate and only then the liquid is separated.'),
            src: 'LW6 p1'
          }
        ]
      },
      {
        id: 'l6.why',
        title: t('Kodėl taip daroma?', 'Why is this done?'),
        mirrors: ['LW6.1', 'LW6.2', 'LW6.3', 'LW6.4', 'LW6.7', 'LW6.8', 'LW6.9', 'LW6.10', 'LW6.11', 'LW6.12', 'LW6.13', 'LW6.15', 'LW6.16', 'LW6.17', 'LW6.20', 'LW6.21', 'LW6.22', 'LW6.23', 'LW6.24'],
        bank: [
          {
            id: 'l6.why.1',
            q: [{ p: t('Eteno dujos praleidžiamos pro geltoną bromo vandenį, ir tirpalas išblunka (tampa bespalvis).', 'Ethene is bubbled through yellow bromine water and the solution turns colourless.') }],
            steps: [ch(
              t('Kodėl bromo vandens spalva išnyksta?', 'Why does the colour of the bromine water disappear?'),
              [
                ['Bromas jungiasi prie dvigubojo ryšio ir susidaro bespalvis dibromidas.', 'Bromine adds to the double bond and a colourless dibromide forms.'],
                ['Etenas pakeičia vandenilį bromu ir išsiskiria $H2$.', 'Ethene replaces a hydrogen by bromine and $H2$ is released.'],
                ['Etenas redukuoja bromą iki bromido, o pats virsta etanoliu.', 'Ethene reduces bromine to bromide and itself becomes ethanol.'],
                ['Bromas ištirpsta eteno dujose ir nebesimato.', 'Bromine dissolves in the ethene gas and can no longer be seen.']
              ], 0,
              t('Kas atsitinka su $\\pi$ ryšiu, kai jį atakuoja elektrofilas?', 'What happens to the $\\pi$ bond when an electrophile attacks it?'),
              t('Bromas prisijungia prie $C=C$ (AE), susidaro 1,2-dibrometanas. Bromo $Br2$ nebelieka, todėl nyksta ir spalva. Pakeitimo (SR) reikėtų šviesos ir jis vyktų ne su alkenu.', 'Bromine adds across $C=C$ (AE) and 1,2-dibromoethane forms. No $Br2$ is left, so the colour disappears. Substitution (SR) would need light and is not what an alkene does here.')
            )],
            why: t('Dvigubasis ryšys turi daug elektronų tankio ir prisijungia elektrofilą. Spalvą turi laisvas $Br2$, o produktas yra bespalvis, todėl spalvos išnykimas yra jungimosi požymis.', 'A double bond is electron-rich and adds an electrophile. The colour belongs to free $Br2$ and the product is colourless, so the loss of colour is the sign of addition.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.why.2',
            q: [{ p: t('Eteno dujos praleidžiamos pro violetinį $KMnO4$ tirpalą. Spalva išnyksta, ir atsiranda rudos nuosėdos.', 'Ethene is bubbled through violet $KMnO4$ solution. The colour fades and brown flakes appear.') }],
            steps: [ch(
              t('Kas yra rudos nuosėdos ir iš kur jos atsiranda?', 'What are the brown flakes and where do they come from?'),
              [
                ['$MnO2$: permanganatas redukuojasi, o etenas oksiduojamas į 1,2-etandiolį.', '$MnO2$: permanganate is reduced while ethene is oxidised to ethane-1,2-diol.'],
                ['Metalinis varis iš $Cu$ priemaišų.', 'Metallic copper from $Cu$ impurities.'],
                ['Anglis, kuri susidaro etenui sudegus.', 'Carbon formed when the ethene burns.'],
                ['$KOH$, kuris kristalizuojasi iš tirpalo.', '$KOH$ crystallising out of solution.']
              ], 0,
              t('Kuris elementas pakeičia oksidacijos laipsnį ir kokią spalvą turi jo junginiai?', 'Which element changes its oxidation state, and what colour are its compounds?'),
              t('Violetinis $MnO4-$ ($Mn+7$) priima elektronus ir virsta rudu $MnO2$ ($Mn+4$). Etenas atiduoda elektronus ir virsta dioliu: $3 C2H4 + 2 KMnO4 + 4 H2O → 3 HOCH2CH2OH + 2 MnO2 + 2 KOH$.', 'Violet $MnO4-$ ($Mn+7$) takes up electrons and becomes brown $MnO2$ ($Mn+4$). Ethene gives up electrons and becomes the diol: $3 C2H4 + 2 KMnO4 + 4 H2O → 3 HOCH2CH2OH + 2 MnO2 + 2 KOH$.')
            )],
            why: t('Šis bandymas rodo oksidaciją: spalva keičiasi, nes keičiasi mangano oksidacijos laipsnis, o diolis lieka tirpale.', 'This test shows an oxidation: the colour change is due to the change of the oxidation state of manganese, and the diol product stays in solution.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.why.3',
            q: [{ p: t('Po naftaleno nitrinimo į atvėsintą oranžinį mišinį įpilama 5 ml šalto vandens.', 'After the nitration of naphthalene, 5 ml of cold water is added to the cooled orange mixture.') }],
            steps: [ch(
              t('Kodėl produktas nusėda ant dugno ir sukietėja?', 'Why does the product settle on the bottom and solidify?'),
              [
                ['Nitrojunginys nesimaišo su vandeniu, yra sunkesnis ir atšalęs sukietėja.', 'The nitro compound does not mix with water, is denser and solidifies on cooling.'],
                ['Vanduo hidrolizuoja nitrogrupę ir susidaro naftolis.', 'Water hydrolyses the nitro group and naphthol forms.'],
                ['Vanduo pašalina visus naftaleno likučius ir lieka tik rūgštis.', 'Water removes all the naphthalene and only the acid remains.'],
                ['Skiedžiama rūgštis labiau nitrina ir susidaro dinitrojunginys.', 'The diluted acid nitrates more strongly and a dinitro compound forms.']
              ], 0,
              t('Pagalvokite apie tankį ir tirpumą vandenyje.', 'Think about density and solubility in water.'),
              t('Neturintis polinių grupių, išskyrus $NO2$, aromatinis junginys vandenyje netirpsta. Jo tankis didesnis už vandens, todėl nusileidžia, o tirpalui atvėsus pasidaro kietas.', 'An aromatic compound without polar groups except $NO2$ is insoluble in water. Its density is higher than that of water, so it sinks, and as the mixture cools it becomes a solid.')
            )],
            why: t('Vandens pridėjimas atskiedžia rūgštį ir nutraukia nitrinimą, o organinis produktas atsiskiria kaip atskira fazė, kurią lengva stebėti.', 'Water dilutes the acid, which ends the nitration, and the organic product separates as its own phase that is easy to observe.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.why.4',
            q: [{ p: t('Norite iš 95 % etanolio gauti bevandenį etanolį.', 'You want anhydrous ethanol from 95 % ethanol.') }],
            steps: [ch(
              t('Kodėl vandens neįmanoma pašalinti frakcine distiliacija?', 'Why can the water not be removed by fractional distillation?'),
              [
                ['Etanolis ir vanduo sudaro azeotropą, kuris distiliuojasi nekeisdamas sudėties.', 'Ethanol and water form an azeotrope that distils without changing its composition.'],
                ['Vanduo verda žemesnėje temperatūroje, todėl lieka su etanolio garais.', 'Water boils at a lower temperature, so it stays with the ethanol vapour.'],
                ['Etanolis ir vanduo chemiškai reaguoja ir sudaro eterį.', 'Ethanol and water react chemically to form an ether.'],
                ['Distiliuojant etanolis suyra.', 'Ethanol decomposes on distillation.']
              ], 0,
              t('Kas atsitinka su garų sudėtimi, kai mišinys verda pastovia temperatūra?', 'What happens to the composition of the vapour when the mixture boils at a constant temperature?'),
              t('Azeotropinio mišinio garai ir skystis turi tą pačią sudėtį (čia 95,5 % etanolio, 78,15 °C), todėl pakartotinė distiliacija jo nebeskiria. Vandenį reikia surišti chemiškai, pavyzdžiui, $CaO$.', 'An azeotropic mixture gives vapour and liquid of the same composition (here 95.5 % ethanol, 78.15 °C), so repeated distillation no longer separates it. Water must be bound chemically, for example by $CaO$.')
            )],
            why: t('Frakcinė distiliacija remiasi garų ir skysčio sudėties skirtumu. Azeotropas šį skirtumą panaikina, todėl reikalingas cheminis vandens surišimas.', 'Fractional distillation relies on a difference between vapour and liquid composition. The azeotrope removes that difference, so chemical binding of water is needed.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.why.5',
            q: [{ p: t('Natris dedamas į etanolį, kuris iš pradžių džiovintas $CuSO4$, o ne į 95 % etanolį.', 'Sodium is added to ethanol that has first been dried with $CuSO4$, not to 95 % ethanol.') }],
            steps: [ch(
              t('Kodėl pavyzdys turi būti kuo sausesnis?', 'Why must the sample be as dry as possible?'),
              [
                ['Vanduo reaguotų su natriu ir sudarytų $NaOH$, todėl vėlesnis fenolftaleino bandymas būtų klaidingas; etanolis turi būti kuo sausesnis.', 'Water would react with sodium and form $NaOH$, so the later phenolphthalein test would be misleading; the ethanol must be as dry as possible.'],
                ['Vanduo sulėtintų $H2$ degimą.', 'Water would slow the burning of $H2$.'],
                ['Natris tirpsta tik gryname etanolyje.', 'Sodium dissolves only in pure ethanol.'],
                ['Vanduo susijungtų su etoksidu į stabilų hidratą.', 'Water would combine with ethoxide to a stable hydrate.']
              ], 0,
              t('Ką sudaro natris su vandeniu ir kaip tai paveiktų vėlesnį bandymą?', 'What does sodium form with water, and how would that affect the later test?'),
              t('Natris reaguoja ir su vandeniu: $2 Na + 2 H2O → 2 NaOH + H2$. Jei vandens būtų, šarminė terpė atsirastų dar prieš hidrolizę ir bandymas nieko neįrodytų.', 'Sodium also reacts with water: $2 Na + 2 H2O → 2 NaOH + H2$. With water present the alkaline medium would exist before any hydrolysis and the test would prove nothing.')
            )],
            why: t('Bandymas turi parodyti, kad šarmą sukuria alkoksido hidrolizė. Todėl kiti $OH-$ šaltiniai turi būti pašalinti iš anksto.', 'The test must show that the alkali comes from hydrolysis of the alkoxide. So other sources of $OH-$ must be excluded beforehand.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.why.6',
            q: [{ p: t('Natrio etoksido tirpalą atskiedus vandeniu ir lašinus fenolftaleino, atsiranda raudonai violetinė spalva.', 'After diluting a sodium ethoxide solution with water and adding phenolphthalein, a red-violet colour appears.') }],
            steps: [ch(
              t('Kodėl tirpalas šarminis?', 'Why is the solution alkaline?'),
              [
                ['Etoksido anijonas atima protoną iš vandens ir susidaro $OH-$.', 'The ethoxide anion takes a proton from water and $OH-$ forms.'],
                ['Etoksidas atiduoda $Na+$, kuris pats yra stipri bazė.', 'Ethoxide releases $Na+$, which is itself a strong base.'],
                ['Likęs natris reaguoja su fenolftaleinu.', 'Remaining sodium reacts with phenolphthalein.'],
                ['Etanolis ištirpina fenolftaleino laktoną ir keičia jo spalvą.', 'Ethanol dissolves the phenolphthalein lactone and changes its colour.']
              ], 0,
              t('Kuri rūgštis stipresnė: vanduo ar etanolis, ir ką tai reiškia konjuguotoms bazėms?', 'Which acid is stronger, water or ethanol, and what does that mean for their conjugate bases?'),
              t('Etoksido anijonas yra konjuguotoji bazė silpnesnės rūgšties nei vanduo, todėl atima iš jo protoną: $C2H5O- + H2O → C2H5OH + OH-$. Šarminėje terpėje fenolftaleinas parausta.', 'The ethoxide anion is the conjugate base of a weaker acid than water and so takes a proton from it: $C2H5O- + H2O → C2H5OH + OH-$. In alkaline medium phenolphthalein turns crimson.')
            )],
            why: t('Alkoksidas yra stipresnė bazė už hidroksidą, todėl vandenyje jis visiškai hidrolizuojasi. Pagal rūgščių ir bazių stiprumą galima numatyti, kuria kryptimi vyksta pusiausvyra.', 'An alkoxide is a stronger base than hydroxide, so in water it is hydrolysed completely. From the strengths of the acids and bases one predicts the direction of the equilibrium.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.why.7',
            q: [{ p: t('Fenolis brominasi bromo vandeniu kambario temperatūroje be katalizatoriaus, o benzenas ne.', 'Phenol is brominated by bromine water at room temperature without a catalyst, benzene is not.') }],
            steps: [ch(
              t('Kodėl fenolis toks reaktyvus?', 'Why is phenol so reactive?'),
              [
                ['$OH$ grupė perduoda žiedui elektronų tankį (+M), todėl elektrofilas lengvai atakuoja $o$ ir $p$ padėtis.', 'The $OH$ group donates electron density to the ring (+M), so the electrophile readily attacks the $o$ and $p$ positions.'],
                ['$OH$ grupė atitraukia elektronus iš žiedo (−M) ir paruošia jį pakeitimui.', 'The $OH$ group withdraws electrons from the ring (−M) and prepares it for substitution.'],
                ['Fenolis yra rūgštus ir protonuoja bromą.', 'Phenol is acidic and protonates bromine.'],
                ['Fenolio žiedas mažesnis už benzeno.', 'The phenol ring is smaller than the benzene ring.']
              ], 0,
              t('Pagalvokite, ar $OH$ grupė žiedą aktyvuoja, ar deaktyvuoja.', 'Think about whether the $OH$ group activates or deactivates the ring.'),
              t('Deguonies laisvoji pora konjuguoja su žiedu, todėl didėja elektronų tankis ties $o$ ir $p$ atomais. Tarpinis katijonas stabilesnis, o pakeitimas vyksta be katalizatoriaus ir visose trijose padėtyse.', 'The lone pair of oxygen conjugates with the ring, so electron density rises at the $o$ and $p$ carbons. The intermediate cation is more stable, and substitution takes place without a catalyst and at all three positions.')
            )],
            why: t('Aktyvuojantys pakaitai (+M) pagreitina SEAr. Dėl to fenolio bandymas yra jautrus: nuosėdos susidaro net praskiestame tirpale.', 'Activating substituents (+M) speed up SEAr. That makes the phenol test sensitive: a precipitate forms even in dilute solution.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.why.8',
            q: [{ p: t('Tikrindami aldehidą $Cu(OH)2$, šildote tik viršutinę tirpalo dalį.', 'In testing an aldehyde with $Cu(OH)2$ you heat only the upper part of the solution.')}],
            steps: [ch(
              t('Kam tai daroma?', 'What is the purpose?'),
              [
                ['Apatinė mėlyna dalis lieka palyginimui, todėl aiškiai matomas spalvos pokytis.', 'The lower blue part stays for comparison, so the colour change is clearly visible.'],
                ['Kad apsaugotų mėgintuvėlį nuo skilimo.', 'To protect the tube from cracking.'],
                ['Kad aldehidas išgaruotų ir nebūtų reakcijos.', 'So the aldehyde evaporates and no reaction takes place.'],
                ['Kad tik viršuje susidarytų $Cu(OH)2$.', 'So that $Cu(OH)2$ forms only at the top.']
              ], 0,
              t('Ką naudojate palyginimui, kai vertinate pokytį?', 'What do you use as a reference when judging a change?'),
              t('Nešildoma dalis rodo pradinę spalvą (mėlyną), todėl matyti, kad geltoną ir raudoną spalvą sukelia kaitinimas ir aldehidas, o ne tirpalas pats.', 'The unheated part shows the starting colour (blue), so it is clear that the yellow and red colours are due to heating and the aldehyde, not to the solution itself.')
            )],
            why: t('Kontrolė yra bendras eksperimento principas: be jos negalima atskirti reakcijos pokyčio nuo reagento savybių.', 'A control is a general principle of experiments: without it a change due to the reaction cannot be told from a property of the reagent.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.why.9',
            q: [{ p: t('Šifo bazei gauti benzenkarbaldehido ir anilino lašai skaičiuojami labai atidžiai.', 'The drops of benzaldehyde and aniline for the Schiff base are counted very carefully.') }],
            steps: [ch(
              t('Kodėl svarbus reagentų santykis?', 'Why does the ratio of the reagents matter?'),
              [
                ['Jie jungiasi 1 : 1, o perteklius lieka kaip skystoji priemaiša ir neleidžia produktui sukietėti.', 'They combine 1 : 1, and an excess stays as a liquid impurity that keeps the product from solidifying.'],
                ['Pertekliaus reikia, kad reakcija vyktų greičiau.', 'An excess is needed to make the reaction go faster.'],
                ['Per daug anilino suardo $C=N$ ryšį.', 'Too much aniline destroys the $C=N$ bond.'],
                ['Skirtingi kiekiai keičia produkto spalvą, bet ne grynumą.', 'Different amounts change the colour of the product but not its purity.']
              ], 0,
              t('Pažiūrėkite į reakcijos lygtį: kiek molekulių kiekvieno reagento sunaudojama?', 'Look at the equation: how many molecules of each reagent are used?'),
              t('Viena aldehido molekulė reaguoja su viena anilino. Kuris reagentas pertekliuje, tas lieka nesureagavęs ir teršia produktą, todėl lašų skaičiavimas yra kiekybinės stechiometrijos klausimas.', 'One aldehyde molecule reacts with one aniline molecule. Whichever reagent is in excess is left unreacted and contaminates the product, so counting drops is a matter of quantitative stoichiometry.')
            )],
            why: t('Sintezėje nesureagavę reagentai tampa priemaišomis; stechiometrinis santykis duoda gryniausią produktą su mažiausiu perkristalinimo poreikiu.', 'In a synthesis unreacted reagents become impurities; a stoichiometric ratio gives the purest product with the least need for recrystallisation.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.why.10',
            q: [{ p: t('Esterinimo mišinys su lašu konc. $H2SO4$ kaitinamas, atvėsinamas ir praskiedžiamas vandeniu, ir ant vandens plūduriuoja skaidrus sluoksnis.', 'The esterification mixture with a drop of conc. $H2SO4$ is heated, cooled and diluted with water, and a clear layer floats on the water.') }],
            steps: [ch(
              t('Kokia sieros rūgšties paskirtis ir kodėl sluoksnis viršuje?', 'What is the role of sulfuric acid, and why is the layer on top?'),
              [
                ['Ji katalizuoja esterinimą ir suriša dalį vandens; esteris lengvesnis už vandenį ir nesimaišo.', 'It catalyses esterification and binds some water; the ester is less dense than water and immiscible.'],
                ['Ji oksiduoja alkoholį į aldehidą; esteris yra dujos.', 'It oxidises the alcohol to an aldehyde; the ester is a gas.'],
                ['Ji neutralizuoja rūgštį; esteris sunkesnis už vandenį.', 'It neutralises the acid; the ester is denser than water.'],
                ['Ji sudaro sulfatą, kuris plūduriuoja.', 'It forms a sulfate that floats.']
              ], 0,
              t('Ką padaro rūgščių katalizė su pusiausvyra, ir kokį tankį turi tipiškas esteris?', 'What does acid catalysis do for the equilibrium, and what density does a typical ester have?'),
              t('Esterinimas yra grįžtamas, todėl $H^+$ pagreitina pusiausvyros pasiekimą, o surišamas vanduo ją stumia link produkto. Esteris turi nepolinę grandinę, todėl nesimaišo su vandeniu ir plūduriuoja.', 'Esterification is reversible, so $H^+$ speeds up reaching equilibrium and the bound water pushes it toward the product. The ester has a nonpolar chain, so it does not mix with water and floats.')
            )],
            why: t('Pusiausvyros reakcijos produkto išeigą galima padidinti vandenį pašalinant arba surišant. Esterį atskiria tai, kad jis yra nepolinis ir lengvesnis už vandenį.', 'The yield of an equilibrium reaction can be raised by removing or binding water. The ester is separated because it is nonpolar and less dense than water.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.why.11',
            q: [{ p: t('Fenolftaleino lydalas atvėsinamas, ir tik tada pilamas karštas vanduo; šalto vandens iš karto pilti negalima.', 'The phenolphthalein melt is cooled somewhat, and then hot water is added; cold water must not be added at once.') }],
            steps: [ch(
              t('Kodėl karštas, o ne šaltas vanduo?', 'Why hot water and not cold?'),
              [
                ['Staigus karšto stiklo atvėsimas gali sutrūkdyti mėgintuvėlį.', 'A sudden cooling of hot glass can crack the tube.'],
                ['Šaltame vandenyje fenolftaleinas skyla.', 'Phenolphthalein decomposes in cold water.'],
                ['Karštas vanduo dalyvauja dehidratacijos reakcijoje.', 'Hot water takes part in a dehydration.'],
                ['Šaltas vanduo atveria laktoną ir ima spalvinti.', 'Cold water opens the lactone and develops colour.']
              ], 0,
              t('Kas atsitinka stiklui, kai jį staigiai atvėsinate?', 'What happens to glass when it is cooled suddenly?'),
              t('Skirtingas plėtimasis sukelia įtempius stikle, ir jis sutrūksta. Bandymo chemija nuo to nepriklauso, tai laboratorinės saugos taisyklė.', 'Uneven contraction creates stresses in the glass and it cracks. The chemistry of the test does not depend on this; it is a rule of laboratory safety.')
            )],
            why: t('Dalis gynimo klausimų tikrina ne chemiją, o praktiką: stiklo elgesys su temperatūros šuoliais yra jos dalis.', 'Some defence questions test practice rather than chemistry: the behaviour of glass under sudden temperature changes belongs to it.'),
            src: 'LW6 p3'
          }
        ]
      },
      {
        id: 'l6.observe',
        title: t('Ką stebėsite?', 'What will you observe?'),
        mirrors: ['LW6.1', 'LW6.2', 'LW6.3', 'LW6.4', 'LW6.5', 'LW6.6', 'LW6.7', 'LW6.8', 'LW6.11', 'LW6.12', 'LW6.13', 'LW6.18', 'LW6.19', 'LW6.21'],
        bank: [
          {
            id: 'l6.observe.1',
            q: [{ p: t('Eteno dujos praleidžiamos pro geltoną bromo vandenį.', 'Ethene is bubbled through yellow bromine water.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Geltona spalva palaipsniui išnyksta.', 'The yellow colour gradually disappears.'],
                ['Atsiranda baltos nuosėdos.', 'White precipitate appears.'],
                ['Tirpalas tampa žalias.', 'The solution turns green.'],
                ['Spalva nesikeičia, bet kyla dujos.', 'The colour does not change but gas rises.']
              ], 0,
              t('Kokia spalva būdinga laisvam bromui ir ar ji lieka po prisijungimo?', 'Which colour belongs to free bromine, and does it remain after addition?'),
              t('Bromas prisijungia prie $C=C$, todėl jo geltona spalva dingsta. Baltos nuosėdos būtų fenolio brominimo požymis.', 'Bromine adds to $C=C$, so its yellow colour disappears. White precipitate would be the sign of phenol bromination.'))],
            why: t('Matoma spalva priklauso nuo laisvo $Br2$; jam prisijungus išnyksta ir spalva.', 'The visible colour depends on free $Br2$; once it has added, the colour is gone.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.observe.2',
            q: [{ p: t('Eteno dujos praleidžiamos pro violetinį $KMnO4$ tirpalą.', 'Ethene is bubbled through violet $KMnO4$ solution.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Violetinė spalva išnyksta ir iškrenta rudos nuosėdos.', 'The violet colour disappears and brown flakes precipitate.'],
                ['Tirpalas tampa žalias dėl $Cr3+$.', 'The solution turns green because of $Cr3+$.'],
                ['Tirpalas tampa mėlynas.', 'The solution turns blue.'],
                ['Tirpalas lieka violetinis, bet kyla dujos.', 'The solution stays violet and gas rises.']
              ], 0,
              t('Kuris mangano junginys yra rudas?', 'Which manganese compound is brown?'),
              t('Neutralioje ar šarminėje terpėje $MnO4-$ redukuojasi iki $MnO2$, rudų nuosėdų.', 'In neutral or alkaline medium $MnO4-$ is reduced to $MnO2$, brown flakes.'))],
            why: t('Permanganato spalvos išnykimas ir $MnO2$ nuosėdos yra oksidacijos požymis.', 'The loss of the permanganate colour and the $MnO2$ precipitate are signs of oxidation.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.observe.3',
            q: [{ p: t('Į baltus bevandenio $CuSO4$ miltelius pilama etanolio, kuriame yra truputis vandens.', 'Ethanol that contains a little water is added to white anhydrous $CuSO4$ powder.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Balti milteliai pamėlsta, nes susidaro kristalhidratas.', 'The white powder turns pale blue because the crystal hydrate forms.'],
                ['Milteliai ištirpsta ir tirpalas tampa tamsiai mėlynas.', 'The powder dissolves and the solution turns deep blue.'],
                ['Milteliai lieka balti, nes etanolis juos apsaugo.', 'The powder stays white because ethanol protects it.'],
                ['Išsiskiria dujos.', 'Gas is released.']
              ], 0,
              t('Kokia spalva būdinga $CuSO4·5H2O$ ir kokia bevandeniui sulfatui?', 'Which colour does $CuSO4·5H2O$ have, and which does the anhydrous sulfate have?'),
              t('Bevandenis $CuSO4$ baltas, o su vandeniu sudaro melsvą kristalhidratą. Kristalai netirpsta etanolyje, todėl nusėda.', 'Anhydrous $CuSO4$ is white and with water forms a pale blue crystal hydrate. The crystals do not dissolve in ethanol, so they settle.'))],
            why: t('Spalvos pokytis yra ir vandens jutiklis, ir sauso reagento žymeklis.', 'The colour change is both a sensor for water and a marker for the drying reagent.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.observe.4',
            q: [{ p: t('Į absoliutų etanolį dedama mažas natrio gabalėlis.', 'A small piece of sodium is dropped into absolute ethanol.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Natris tirpsta, kyla dujų burbuliukai.', 'The sodium dissolves and gas bubbles rise.'],
                ['Susidaro baltos nuosėdos ir tirpalas parausta.', 'White precipitate forms and the solution turns red.'],
                ['Natris liečiasi su skysčiu be pokyčių.', 'The sodium stays in the liquid without any change.'],
                ['Tirpalas tampa mėlynas.', 'The solution turns blue.']
              ], 0,
              t('Kokios dujos išsiskiria, kai metalas išstumia rūgštų vandenilį?', 'Which gas is released when a metal displaces an acidic hydrogen?'),
              t('Natris pakeičia $O-H$ vandenilį ir susidaro $H2$ bei natrio etoksidas. Raudona spalva atsirastų tik pridėjus vandens ir fenolftaleino.', 'Sodium replaces the $O-H$ hydrogen and $H2$ and sodium ethoxide form. A red colour would appear only after adding water and phenolphthalein.'))],
            why: t('Vandenilio išsiskyrimas rodo, kad alkoholio $O-H$ vandenilis yra pakankamai rūgštus, kad jį išstumtų aktyvus metalas.', 'The release of hydrogen shows that the $O-H$ hydrogen of the alcohol is acidic enough to be displaced by an active metal.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.observe.5',
            q: [{ p: t('Į $Cu(OH)2$ nuosėdas pilamas glicerolis ir supurtoma.', 'Glycerol is added to $Cu(OH)2$ precipitate and the tube is shaken.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Nuosėdos ištirpsta ir tirpalas tampa tamsiai mėlynas.', 'The precipitate dissolves and the solution turns deep blue.'],
                ['Nuosėdos tampa raudonos.', 'The precipitate turns red.'],
                ['Susidaro vario veidrodis.', 'A copper mirror forms.'],
                ['Nieko nepasikeičia.', 'Nothing changes.']
              ], 0,
              t('Kokį junginį sudaro hidroksigrupės su variu?', 'What kind of compound do hydroxyl groups form with copper?'),
              t('Gretimos $OH$ grupės chelatiškai suriša $Cu$, kompleksas tirpus ir ryškiai mėlynas. Raudona spalva ir veidrodis būdingi aldehido bandymui, kitam reakcijos tipui.', 'Neighbouring $OH$ groups bind $Cu$ as a chelate, the complex is soluble and deep blue. A red colour and a mirror belong to the aldehyde test, a different type of reaction.'))],
            why: t('Šis bandymas yra ne redokso, o kompleksų sudarymo reakcija: vario oksidacijos laipsnis nesikeičia.', 'This test is a complex formation, not a redox reaction: the oxidation state of copper does not change.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.observe.6',
            q: [{ p: t('Etanolis kaitinamas su rūgštiniu $K2Cr2O7$ tirpalu.', 'Ethanol is heated with acidified $K2Cr2O7$ solution.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Oranžinė spalva pakinta į žalią.', 'The orange colour changes to green.'],
                ['Žalia spalva pakinta į oranžinę.', 'The green colour changes to orange.'],
                ['Tirpalas tampa bespalvis.', 'The solution becomes colourless.'],
                ['Iškrenta rudos nuosėdos.', 'Brown precipitate forms.']
              ], 0,
              t('Kuri vandenyje esanti chromo forma oranžinė, o kuri žalia?', 'Which chromium species is orange and which is green?'),
              t('Oranžinis dichromatas ($Cr+6$) oksiduodamas alkoholį redukuojasi iki žalio $Cr3+$.', 'Dichromate $Cr(+6)$ is orange; when it oxidises the alcohol, it is reduced to green $Cr(+3)$.'))],
            why: t('Oksidatoriaus spalvos pokytis rodo, kad jis sunaudojamas: alkoholis oksiduojamas.', 'The colour change of the oxidant shows that it is consumed: the alcohol is being oxidised.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.observe.7',
            q: [{ p: t('Į fenolio tirpalą lašinamas bromo vanduo.', 'Bromine water is added dropwise to phenol solution.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Bromo spalva išnyksta ir iškrenta baltos nuosėdos.', 'The bromine colour vanishes and white precipitate forms.'],
                ['Tirpalas tampa tamsiai mėlynas.', 'The solution turns deep blue.'],
                ['Tirpalas lieka geltonas ir nieko nevyksta.', 'The solution stays yellow and nothing happens.'],
                ['Išsiskiria dujos ir tirpalas parausta.', 'Gas is released and the solution turns red.']
              ], 0,
              t('Ar fenolis reaguoja su bromu kambario temperatūroje ir koks produktas netirpsta vandenyje?', 'Does phenol react with bromine at room temperature, and which product is insoluble in water?'),
              t('Susidaro 2,4,6-tribromfenolis, kuris netirpsta vandenyje, todėl iškrenta baltos nuosėdos, o bromo spalva dingsta.', 'Insoluble 2,4,6-tribromophenol forms and precipitates as white solid, while the bromine colour disappears.'))],
            why: t('Baltos nuosėdos kartu su išnykusia bromo spalva patvirtina greitą pakeitimą fenolio žiede.', 'White precipitate together with the lost bromine colour confirms a fast substitution in the phenol ring.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.observe.8',
            q: [{ p: t('Propanonas (acetonas) kaitinamas su šarminiu $Cu(OH)2$ taip pat, kaip metanalis.', 'Propanone (acetone) is heated with alkaline $Cu(OH)2$ in the same way as methanal.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Geltonos ar raudonos nuosėdos nesusidaro, nes ketonai šio reagento neredukuoja (mėlynos nuosėdos kaitinant gali patamsėti).', 'No yellow or red precipitate forms, because ketones do not reduce this reagent (on heating the blue precipitate may darken).'],
                ['Geltona, paskui raudona nuosėda.', 'A yellow, then red precipitate.'],
                ['Vario veidrodis.', 'A copper mirror.'],
                ['Tirpalas tampa žalias.', 'The solution turns green.']
              ], 0,
              t('Ar ketonas turi vandenilio prie karbonilo anglies, kurį galima oksiduoti?', 'Does a ketone have a hydrogen on the carbonyl carbon that can be oxidised?'),
              t('Ketonai neoksiduojasi švelniai nenutraukiant $C-C$ ryšio, todėl $Cu(II)$ nesiredukuoja ir raudonų ar geltonų nuosėdų nėra; kaip ir be aldehido, kaitinamos mėlynos nuosėdos gali patamsėti, nes susidaro juodas $CuO$.', 'Ketones cannot be oxidised mildly without breaking a $C-C$ bond, so $Cu(II)$ is not reduced and no red or yellow precipitate forms; as with any compound that is not a reducing agent, the heated blue precipitate may darken to black $CuO$.'))],
            why: t('Šis neigiamas rezultatas yra svarbus: jis atskiria aldehidus nuo ketonų.', 'This negative result is important: it separates aldehydes from ketones.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.observe.9',
            q: [{ p: t('Į fluoresceino tirpalą lašinama $NaOH$ ir tirpalas apšviečiamas UV lempa.', '$NaOH$ is added to a fluorescein solution and the solution is lit with a UV lamp.') }],
            steps: [ch(t('Ką stebėsite?', 'What will you see?'),
              [
                ['Tirpalas ryškiai žaliai fluorescuoja.', 'The solution fluoresces bright green.'],
                ['Tirpalas tampa raudonai violetinis, kaip fenolftaleinas.', 'The solution turns red-violet, like phenolphthalein.'],
                ['Tirpalas išblunka ir tampa bespalvis.', 'The solution fades and becomes colourless.'],
                ['Iškrenta mėlynos nuosėdos.', 'Blue precipitate forms.']
              ], 0,
              t('Kuris iš šių junginių yra fluorescentinis dažiklis?', 'Which of these compounds is a fluorescent dye?'),
              t('Šarminėje terpėje fluoresceinas sudaro konjuguotą dianijoną, kuris sugeria šviesą ir skleidžia žalią fluorescenciją. Raudonai violetinė spalva būdinga fenolftaleinui.', 'In alkaline medium fluorescein forms a conjugated dianion that absorbs light and emits green fluorescence. The red-violet colour belongs to phenolphthalein.'))],
            why: t('Konjuguotos ir standžios sistemos linkusios fluorescuoti; šarmas atveria laktoną ir sukuria tokią sistemą.', 'Conjugated and rigid systems tend to fluoresce; alkali opens the lactone and creates such a system.'),
            src: 'LW6 p4'
          }
        ]
      },
      {
        id: 'l6.proves',
        title: t('Kas ką įrodo?', 'Which observation proves what?'),
        mirrors: ['LW6.1', 'LW6.2', 'LW6.4', 'LW6.5', 'LW6.6', 'LW6.8', 'LW6.9', 'LW6.10', 'LW6.14', 'LW6.18', 'LW6.19', 'LW6.21'],
        bank: [
          {
            id: 'l6.proves.1',
            q: [{ p: t('Eteno bandymai: suporuokite stebėjimą su išvada.', 'The ethene tests: pair each observation with its conclusion.') }],
            steps: [{
              prompt: t('Suporuokite.', 'Match.'), kind: 'match',
              answer: {
                left: [{ text: t('Bromo vandens geltona spalva išnyksta', 'The yellow colour of bromine water disappears') }, { text: t('Violetinis tirpalas virsta rudomis nuosėdomis', 'The violet solution gives brown flakes') }, { text: t('Dujos užsidega ir dega šviečiančia liepsna', 'The gas ignites and burns with a luminous flame') }],
                right: [{ text: t('prisijungė bromas (AE)', 'bromine has added (AE)') }, { text: t('įvyko oksidacija į diolį, redukuojant Mn(+7)', 'oxidation to a diol, with reduction of Mn(+7)') }, { text: t('dujos yra degios', 'the gas is combustible') }],
                pairs: [0, 1, 2]
              },
              hint: t('Kuris stebėjimas susijęs su prijungimu, kuris su oksidacija?', 'Which observation relates to addition and which to oxidation?'),
              solution: t('Bromo spalvos išnykimas rodo prijungimą, $KMnO4$ spalvos pokytis rodo oksidaciją, o degimas rodo tik degumą.', 'Loss of the bromine colour shows addition, the change of $KMnO4$ shows oxidation, and burning shows only combustibility.')
            }],
            why: t('Du bandymai papildo vienas kitą: bromas rodo prijungimą, permanganatas rodo oksidaciją, bet abu nurodo nepasotintą ryšį.', 'The two tests complement each other: bromine shows addition and permanganate shows oxidation, but both point to an unsaturated bond.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.proves.2',
            q: [{ p: t('Natrio ir etanolio bandymas.', 'The sodium and ethanol test.') }],
            steps: [{
              prompt: t('Suporuokite stebėjimą ir išvadą.', 'Match each observation with its conclusion.'), kind: 'match',
              answer: {
                left: [{ text: t('Išsiskiria dujų, kurios sudega su trumpu pokštelėjimu', 'A gas is released that burns with a short pop') }, { text: t('Pridėjus vandens ir fenolftaleino, tirpalas parausta', 'After adding water and phenolphthalein the solution turns red') }, { text: t('Natris išnyksta etanolyje', 'The sodium disappears in the ethanol') }],
                right: [{ text: t('išsiskiria $H2$', '$H2$ is released') }, { text: t('susidaręs alkoksidas hidrolizavosi į $NaOH$', 'the alkoxide formed has hydrolysed to $NaOH$') }, { text: t('susidarė tirpi natrio druska', 'a soluble sodium salt formed') }],
                pairs: [0, 1, 2]
              },
              hint: t('Kiekviena dalis rodo vis kitą reakcijos etapą.', 'Each observation shows a different stage of the reaction.'),
              solution: t('Dujos: vandenilis. Raudona spalva: bazė $OH-$ po hidrolizės. Natrio išnykimas: tirpus etoksidas.', 'Gas: hydrogen. Red colour: base $OH-$ after hydrolysis. Disappearing sodium: soluble ethoxide.')
            }],
            why: t('Trys stebėjimai nusako visą seką: pakeitimas, tirpi druska, hidrolizė.', 'Three observations describe the whole sequence: substitution, soluble salt, hydrolysis.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.proves.3',
            q: [{ p: t('Bandymai su $Cu(OH)2$.', 'Tests with $Cu(OH)2$.') }],
            steps: [{
              prompt: t('Suporuokite mėgintuvėlį ir jame stebimą reiškinį.', 'Match each tube with what is seen in it.'), kind: 'match',
              answer: {
                left: [{ text: t('Glicerolis + šviežias $Cu(OH)2$', 'Glycerol + fresh $Cu(OH)2$') }, { text: t('Etanolis + šviežias $Cu(OH)2$', 'Ethanol + fresh $Cu(OH)2$') }, { text: t('Metanalis + $Cu(OH)2$, kaitinant', 'Methanal + $Cu(OH)2$ on heating') }],
                right: [{ text: t('tamsiai mėlynas tirpalas', 'a deep blue solution') }, { text: t('melsvos nuosėdos nesikeičia', 'the pale blue precipitate does not change') }, { text: t('geltona, raudona ir vario veidrodis', 'yellow, red and a copper mirror') }],
                pairs: [0, 1, 2]
              },
              hint: t('Du bandymai yra kompleksų ir redokso skirtumai.', 'Two of the tests differ in complexation versus redox.'),
              solution: t('Glicerolis sudaro kompleksą, vienahidroksilis etanolis jo nesudaro, o aldehidas redukuoja $Cu(II)$.', 'Glycerol forms a complex, monohydric ethanol does not, and the aldehyde reduces $Cu(II)$.')
            }],
            why: t('Tas pats reagentas gali tikrinti skirtingas funkcines grupes: svarbu, kokios sąlygos ir ką stebi.', 'The same reagent can test different functional groups: what matters is the conditions and what is observed.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.proves.4',
            q: [{ p: t('Alkoholio oksidacija rūgštinėje terpėje.', 'Oxidation of an alcohol in acidic medium.') }],
            steps: [{
              prompt: t('Suporuokite oksidatorių ir jo pokytį.', 'Match each oxidant with its change.'), kind: 'match',
              answer: {
                left: [{ text: t('$K2Cr2O7$ + $H2SO4$', '$K2Cr2O7$ + $H2SO4$') }, { text: t('$KMnO4$ + $H2SO4$', '$KMnO4$ + $H2SO4$') }, { text: t('$KMnO4$ neutralioje terpėje', '$KMnO4$ in neutral medium') }],
                right: [{ text: t('oranžinė spalva pereina į žalią ($Cr3+$)', 'orange changes to green ($Cr3+$)') }, { text: t('violetinė spalva išnyksta ($Mn2+$ bespalvis)', 'violet disappears ($Mn2+$ is colourless)') }, { text: t('rudos $MnO2$ nuosėdos', 'brown $MnO2$ precipitate') }],
                pairs: [0, 1, 2]
              },
              hint: t('Pagalvokite, į kokį oksidacijos laipsnį redukuojasi kiekvienas metalas.', 'Think to which oxidation state each metal is reduced.'),
              solution: t('Chromas virsta $Cr(+3)$ (žalias), manganas rūgštyje $Mn(+2)$ (bespalvis), o ne rūgštyje $Mn(+4)$ (rudas $MnO2$).', 'Chromium becomes $Cr(+3)$ (green), manganese in acid becomes $Mn(+2)$ (colourless), and outside acid it becomes $Mn(+4)$ (brown $MnO2$).')
            }],
            why: t('Redukcijos produktas priklauso nuo metalo ir terpės. Tai padeda spėti spalvą net neprisiminus lentelės.', 'The reduction product depends on the metal and the medium. This lets you guess the colour without recalling a table.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.proves.5',
            q: [{ p: t('Aromatinių junginių bandymai.', 'Tests of aromatic compounds.') }],
            steps: [{
              prompt: t('Suporuokite reakciją ir stebėjimą.', 'Match each reaction with its observation.'), kind: 'match',
              answer: {
                left: [{ text: t('Fenolis + bromo vanduo', 'Phenol + bromine water') }, { text: t('Naftalenas + konc. $HNO3$, paskui vanduo', 'Naphthalene + conc. $HNO3$, then water') }, { text: t('Benzenkarbaldehidas + anilinas', 'Benzaldehyde + aniline') }],
                right: [{ text: t('baltos nuosėdos, bromo spalva išnyksta', 'white precipitate, bromine colour disappears') }, { text: t('geltonas junginys nusėda ir sukietėja', 'a yellow compound settles and solidifies') }, { text: t('gelsva kieta medžiaga', 'a yellowish solid') }],
                pairs: [0, 1, 2]
              },
              hint: t('Pagalvokite, kuris produktas yra nitrojunginys, kuris iminas ir kuris bromintas.', 'Think which product is the nitro compound, which the imine and which the brominated one.'),
              solution: t('Tribromfenolis baltas, nitronaftalenas geltonas, iminas gelsvas.', 'Tribromophenol is white, nitronaphthalene is yellow, and the imine is yellowish.')
            }],
            why: t('Produkto išvaizda ir tirpumas padeda atpažinti reakcijos tipą dar prieš naudojant instrumentinius metodus.', 'The appearance and solubility of the product help to identify the reaction type even before instrumental methods are used.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.proves.6',
            q: [{ p: t('Esterio ir ftaleinų sintezė.', 'The ester and phthalein syntheses.') }],
            steps: [{
              prompt: t('Suporuokite stebėjimą ir ką jis rodo.', 'Match each observation with what it shows.'), kind: 'match',
              answer: {
                left: [{ text: t('Ant vandens plūduriuoja sluoksnis su vaisių kvapu', 'A fruity-smelling layer floats on the water') }, { text: t('Fenolftaleino tirpalas su $NaOH$ parausta', 'A phenolphthalein solution with $NaOH$ turns red') }, { text: t('Fluoresceino tirpalas šarme šviečia žaliai', 'A fluorescein solution in alkali glows green') }],
                right: [{ text: t('susidarė esteris', 'an ester has formed') }, { text: t('atsivėrė laktono žiedas, atsirado chinoidinė konjuguota sistema', 'the lactone ring has opened and a quinoid conjugated system arose') }, { text: t('susidarė fluorescuojantis dianijonas', 'a fluorescent dianion has formed') }],
                pairs: [0, 1, 2]
              },
              hint: t('Kuri spalva siejama su žiedo atsivėrimu?', 'Which colour is linked to the ring opening?'),
              solution: t('Kvapas ir sluoksnis rodo esterį; fenolftaleino raudona spalva rodo konjuguotą chinoidinę formą; žalia fluorescencija būdinga fluoresceino dianijonui.', 'The smell and the layer show the ester; the red colour of phenolphthalein shows the conjugated quinoid form; green fluorescence belongs to the fluorescein dianion.')
            }],
            why: t('Spalva ir fluorescencija priklauso nuo konjugacijos ilgio ir rigidiškumo, o ne nuo atskirų grupių.', 'Colour and fluorescence depend on the length and rigidity of the conjugation, not on single groups.'),
            src: 'LW6 p4'
          },
          {
            id: 'l6.proves.7',
            q: [{ p: t('Funkcinės grupės ir bandymas.', 'Functional groups and tests.') }],
            steps: [{
              prompt: t('Suporuokite funkcinę grupę ir tinkamą bandymą.', 'Match each functional group with a suitable test.'), kind: 'match',
              answer: {
                left: [{ text: t('dvigubasis ryšys', 'double bond') }, { text: t('aldehidinė grupė', 'aldehyde group') }, { text: t('hidroksigrupės prie gretimų atomų', 'hydroxyl groups on neighbouring atoms') }, { text: t('fenolio $OH$ grupė', 'phenolic $OH$ group') }],
                right: [{ text: t('bromo vanduo arba $KMnO4$', 'bromine water or $KMnO4$') }, { text: t('šarminis $Cu(OH)2$ su kaitinimu', 'alkaline $Cu(OH)2$ with heating') }, { text: t('$Cu(OH)2$ be kaitinimo, mėlynas kompleksas', '$Cu(OH)2$ without heating, a blue complex') }, { text: t('bromo vanduo, baltos nuosėdos', 'bromine water, white precipitate') }],
                pairs: [0, 1, 2, 3]
              },
              hint: t('Du bandymai naudoja tuos pačius reagentus, bet skirtingai.', 'Two of the tests use the same reagents differently.'),
              solution: t('Dvigubąjį ryšį rodo bromas ir $KMnO4$; aldehidas redukuoja šilumoje $Cu(II)$; polioliai sudaro mėlyną kompleksą; fenolis sudaro baltas tribromo nuosėdas.', 'A double bond is shown by bromine and $KMnO4$; the aldehyde reduces $Cu(II)$ when heated; polyols form a blue complex; phenol gives the white tribromo precipitate.')
            }],
            why: t('Gynime dažnai klausiama atvirkščiai: kokį bandymą pasirinktumėte nežinomam junginiui? Reikia mokėti ir tą kryptį.', 'At the defence you are often asked the other way round: which test would you choose for an unknown compound? Know that direction too.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.proves.8',
            q: [{ p: t('Trys skysčiai: etanolis, glicerolis ir metanalis. Atliekami bandymai su šviežiu $Cu(OH)2$.', 'Three liquids: ethanol, glycerol and methanal. Each is tested with fresh $Cu(OH)2$.') }],
            steps: [{
              prompt: t('Suporuokite skystį ir rezultatą be kaitinimo arba su juo.', 'Match each liquid with the result, without or with heating.'), kind: 'match',
              answer: {
                left: [{ text: t('Etanolis', 'Ethanol') }, { text: t('Glicerolis', 'Glycerol') }, { text: t('Metanalis', 'Methanal') }],
                right: [{ text: t('šaltyje nuosėdos nesikeičia, kaitinant tik pajuoduoja ($CuO$)', 'unchanged in the cold, only turns black ($CuO$) on heating') }, { text: t('ištirpsta jau šaltyje, tirpalas tamsiai mėlynas', 'dissolves in the cold, the solution is deep blue') }, { text: t('kaitinant pagelsta, paskui parausta ($Cu2O$), gali atsirasti vario veidrodis', 'turns yellow on heating, then red ($Cu2O$); a copper mirror may form') }],
                pairs: [0, 1, 2]
              },
              hint: t('Kuris iš trijų reaguoja šaltyje ir kodėl?', 'Which of the three reacts in the cold, and why?'),
              solution: t('Glicerolis sudaro kompleksą jau šaltyje; metanalis redukuoja $Cu(II)$ tik kaitinant (geltona, raudona); etanolis nereaguoja, o kaitinamas $Cu(OH)2$ tik skyla į juodą $CuO$.', 'Glycerol forms the complex already in the cold; methanal reduces $Cu(II)$ only on heating (yellow, red); ethanol does not react, and heated $Cu(OH)2$ merely decomposes to black $CuO$.')
            }],
            why: t('Kompleksavimas ir redukcija yra skirtingi procesai, todėl ir sąlygos skirtingos: šaltis ir kaitinimas.', 'Complexation and reduction are different processes, hence the different conditions: cold and heating.'),
            src: 'LW6 p2'
          }
        ]
      },
      {
        id: 'l6.products',
        title: t('Reakcijos produktas', 'The product of the reaction'),
        mirrors: ['LW6.1', 'LW6.2', 'LW6.4', 'LW6.5', 'LW6.7', 'LW6.8', 'LW6.9', 'LW6.10', 'LW6.11'],
        bank: [
          {
            id: 'l6.products.1',
            q: [{ scheme: { items: [{ smi: 'CCO' }, { arrow: '→', above: t('konc. H2SO4, t°', 'conc. H2SO4, t°') }] } }],
            steps: [
              ch(t('Kuris iš šių junginių yra pagrindinis dujinis produktas?', 'Which compound is the main gaseous product?'),
                [['etenas', 'ethene'], ['etanalis', 'ethanal'], ['dietileteris', 'diethyl ether'], ['etanas', 'ethane']], 0,
                t('Kokia reakcija vyksta kaitinant alkoholį su koncentruota rūgštimi: oksidacija ar dehidratacija?', 'Which reaction takes place on heating an alcohol with a concentrated acid: oxidation or dehydration?'),
                t('Aukštoje temperatūroje alkoholis eliminuoja vandenį ir susidaro alkenas. Aldehidui reikėtų oksidatoriaus, o eteris susidaro žemesnėje temperatūroje, esant alkoholio pertekliui.', 'At high temperature the alcohol loses water and the alkene forms. An aldehyde would need an oxidant, and the ether forms at a lower temperature with excess alcohol.')),
              ch(t('Kokia šio proceso reakcijos rūšis?', 'What type of reaction is this?'),
                [['eliminavimas', 'elimination'], ['jungimasis', 'addition'], ['radikalinis pakeitimas', 'radical substitution'], ['oksidacija', 'oxidation']], 0,
                t('Kas atsitinka su alkoholio molekule: kas atskyla?', 'What happens to the alcohol molecule: what is lost?'),
                t('Iš $C-C-OH$ atskyla $H$ ir $OH$ (vanduo), tai eliminavimas.', 'From $C-C-OH$ an $H$ and an $OH$ (water) are lost: elimination.'))
            ],
            why: t('Koncentruota $H2SO4$ yra ir rūgštis, ir dehidratuojanti medžiaga: alkoholis protonuojamas, atskyla vanduo ir susidaro dvigubasis ryšys.', 'Concentrated $H2SO4$ is both an acid and a dehydrating agent: the alcohol is protonated, water leaves and a double bond forms.'),
            src: 'LW6 p1',
            claims: [{ formula: ['C=C', 'C2H4'] }]
          },
          {
            id: 'l6.products.2',
            q: [{ scheme: { items: [{ smi: 'C=C' }, { plus: true }, { smi: 'BrBr' }, { arrow: '→' }] } }],
            steps: [
              ch(t('Koks yra produktas?', 'What is the product?'),
                [['1,2-dibrometanas', '1,2-dibromoethane'], ['1,1-dibrometanas', '1,1-dibromoethane'], ['bromoetenas ir $HBr$', 'bromoethene and $HBr$'], ['bromoetanas', 'bromoethane']], 0,
                t('Bromas jungiasi prie abiejų dvigubojo ryšio atomų.', 'Bromine bonds to both carbons of the double bond.'),
                t('Prie kiekvieno dvigubojo ryšio atomo prisijungia po vieną bromo atomą, tad susidaro 1,2-dibrometanas. 1,1-izomeras reikalautų abu bromus prie vieno atomo.', 'One bromine atom adds to each carbon of the double bond, giving 1,2-dibromoethane. The 1,1-isomer would need both bromines on one carbon.')),
              ch(t('Koks mechanizmas?', 'Which mechanism?'),
                [['AE', 'AE'], ['SR', 'SR'], ['SN2', 'SN2'], ['E2', 'E2']], 0,
                t('Dvigubąjį ryšį atakuoja elektrofilas.', 'An electrophile attacks the double bond.'),
                t('Alkeno $π$ ryšys atakuoja $Br2$: elektrofilinis prijungimas, AE.', 'The $π$ bond of the alkene attacks $Br2$: electrophilic addition, AE.'))
            ],
            why: t('Alkenui būdingas prijungimas, kurio metu išnyksta dvigubasis ryšys, o bromo spalva dingsta.', 'Addition is typical of alkenes: the double bond is lost and the bromine colour disappears.'),
            src: 'LW6 p1',
            claims: [{ formula: ['BrCCBr', 'C2H4Br2'] }, { name: ['BrCCBr', t('1,2-dibrometanas', '1,2-dibromoethane')] }]
          },
          {
            id: 'l6.products.3',
            q: [{ scheme: { items: [{ smi: 'C=C' }, { arrow: '→', above: f('KMnO4, H2O') }] } }],
            steps: [
              ch(t('Koks organinis produktas susidaro šaltoje neutralioje ar šarminėje terpėje?', 'Which organic product forms in the cold, in neutral or alkaline medium?'),
                [['1,2-etandiolis', 'ethane-1,2-diol'], ['etano rūgštis', 'ethanoic acid'], ['metanalis', 'methanal'], ['oksalo rūgštis', 'oxalic acid']], 0,
                t('Švelnus oksidatorius prie dvigubojo ryšio prijungia dvi $OH$ grupes ir nenutraukia anglies grandinės.', 'A mild oxidant adds two $OH$ groups across the double bond without breaking the carbon chain.'),
                t('Švelniai oksiduojant jungiasi dvi $OH$ grupės: $HOCH2CH2OH$. Rūgštys ir aldehidai atsirastų nutraukus $C=C$ (stipri oksidacija).', 'Mild oxidation adds two $OH$ groups: $HOCH2CH2OH$. Acids and aldehydes would arise from cleavage of $C=C$ (harsh oxidation).'))
            ],
            why: t('Šaltas neutralus ar šarminis $KMnO4$ dihidroksilina dvigubąjį ryšį; $MnO2$ nuosėdos yra redukcijos produktas.', 'Cold neutral or alkaline $KMnO4$ dihydroxylates the double bond; the $MnO2$ precipitate is the reduction product.'),
            src: 'LW6 p1',
            claims: [{ react: ['ox.kmno4.mild', ['C=C'], {}, 'OCCO'] }, { name: ['OCCO', t('1,2-etandiolis', 'ethane-1,2-diol')] }]
          },
          {
            id: 'l6.products.4',
            q: [{ scheme: { items: [{ smi: NAPH, name: t('naftalenas', 'naphthalene') }, { plus: true }, { smi: 'O[N+](=O)[O-]' }, { arrow: '→' }] } }],
            steps: [
              ch(t('Kuris mononitrojunginys susidaro daugiausia?', 'Which mononitro compound forms mainly?'),
                [['1-nitronaftalenas', '1-nitronaphthalene'], ['2-nitronaftalenas', '2-nitronaphthalene'], ['1,5-dinitronaftalenas', '1,5-dinitronaphthalene'], ['1-naftolis', '1-naphthol']], 0,
                t('Kurioje padėtyje elektrofilas gauna stabilesnį tarpinį katijoną?', 'In which position does the electrophile give the more stable intermediate cation?'),
                t('Atakuojant padėtį 1 katijonas turi daugiau rezonansinių formulių su nepažeistu benzeno žiedu, todėl α produktas vyrauja. Dinitravimui reikia griežtesnių sąlygų.', 'Attack at position 1 gives a cation with more resonance structures that keep an intact benzene ring, so the α product dominates. Dinitration needs harsher conditions.')),
              ch(t('Koks mechanizmas?', 'Which mechanism?'),
                [['SEAr', 'SEAr'], ['AE', 'AE'], ['SN1', 'SN1'], ['AN', 'AN']], 0,
                t('Aromatinis žiedas, elektrofilas $NO2+$, išlaikomas aromatiškumas.', 'An aromatic ring, the electrophile $NO2+$, aromaticity is kept.'),
                t('Elektrofilinis aromatinis pakeitimas: $H$ pakeičiamas $NO2$ grupe, žiedas lieka aromatinis.', 'Electrophilic aromatic substitution: $H$ is replaced by $NO2$ and the ring stays aromatic.'))
            ],
            why: t('Aromatiniai junginiai dažniau pakeičiami nei jungia, nes tai išsaugo aromatiškumą. Naftaleno atveju kryptį lemia tarpinio katijono stabilumas.', 'Aromatic compounds undergo substitution rather than addition because that preserves aromaticity. In naphthalene the intermediate cation sets the position.'),
            src: 'LW6 p1',
            claims: [{ formula: [NITRO, 'C10H7NO2'] }, { react: ['sear', [NAPH], { E: 'NO2' }, NITRO] }]
          },
          {
            id: 'l6.products.5',
            q: [{ scheme: { items: [{ smi: PHENOL, name: t('fenolis', 'phenol') }, { plus: true }, { smi: 'BrBr' }, { arrow: '→', above: t('bromo vanduo, perteklius', 'bromine water, excess') }] } }],
            steps: [
              ch(t('Kuris produktas iškrenta baltų nuosėdų pavidalu?', 'Which product precipitates as white solid?'),
                [['2,4,6-tribromfenolis', '2,4,6-tribromophenol'], ['3,4,5-tribromfenolis', '3,4,5-tribromophenol'], ['2,4-dibromfenolis', '2,4-dibromophenol'], ['bromcikloheksanolis', 'bromocyclohexanol']], 0,
                t('Kurios padėtys žiede suaktyvintos $OH$ grupės?', 'Which ring positions are activated by the $OH$ group?'),
                t('$OH$ orientuoja į $o$ ir $p$ padėtis, o bromo vandens pertekliuje pakeičiamos visos tris: 2, 4 ir 6. Meta padėtys (3, 5) neaktyvintos.', '$OH$ directs to the $o$ and $p$ positions, and with excess bromine water all three are substituted: 2, 4 and 6. The meta positions (3, 5) are not activated.'))
            ],
            why: t('Orto ir para orientacija kartu su dideliu žiedo aktyvumu duoda trigubą pakeitimą be katalizatoriaus.', 'Ortho and para direction together with high ring reactivity give triple substitution without a catalyst.'),
            src: 'LW6 p2',
            claims: [{ react: ['phenol.br2', [PHENOL], null, TBP] }, { name: [TBP, t('2,4,6-tribromfenolis', '2,4,6-tribromophenol')] }]
          },
          {
            id: 'l6.products.6',
            q: [{ scheme: { items: [{ smi: 'CCO' }, { plus: true }, { smi: '[Na]' }, { arrow: '→' }] } }],
            steps: [
              ch(t('Kokia druska susidaro?', 'Which salt forms?'),
                [['natrio etoksidas', 'sodium ethoxide'], ['natrio acetatas', 'sodium acetate'], ['natrio karbonatas', 'sodium carbonate'], ['etilnatris', 'ethylsodium']], 0,
                t('Koks atomas išsiskiria kaip $H2$: kuris vandenilis rūgštus?', 'Which atom is released as $H2$: which hydrogen is acidic?'),
                t('Rūgštus yra $O-H$ vandenilis, todėl natris jį pakeičia ir susidaro $CH3CH2O^-Na^+$. Acetatas atsirastų tik oksiduojant alkoholį.', 'The $O-H$ hydrogen is the acidic one, so sodium replaces it to give $CH3CH2O^-Na^+$. An acetate would require an oxidised alcohol.'))
            ],
            why: t('Metalas pakeičia rūgštaus $O-H$ vandenilį ir išskiria $H2$; $C-H$ vandeniliai tam per silpnai rūgštūs.', 'The metal replaces the acidic $O-H$ hydrogen and releases $H2$; the $C-H$ hydrogens are far too weakly acidic.'),
            src: 'LW6 p2',
            claims: [{ formula: ['CC[O-]', 'C2H5O-'] }]
          },
          {
            id: 'l6.products.7',
            q: [{ scheme: { items: [{ smi: 'C=O', name: t('metanalis', 'methanal') }, { plus: true }, { smi: 'O[Cu]O' }, { arrow: '→', above: f('NaOH, t°') }] } }],
            steps: [
              ch(t('Kuris yra organinis produktas?', 'Which is the organic product?'),
                [['metano rūgštis (šarme jos druska)', 'methanoic acid (its salt in alkali)'], ['metanolis', 'methanol'], ['anglies dioksidas', 'carbon dioxide'], ['etanalis', 'ethanal']], 0,
                t('Ar aldehidas čia oksiduojamas, ar redukuojamas?', 'Is the aldehyde oxidised or reduced here?'),
                t('Aldehidas redukuoja $Cu(II)$, pats oksiduojasi iki rūgšties. Metanolis atsirastų redukuojant, o $CO2$ – visišką oksidaciją.', 'The aldehyde reduces $Cu(II)$ and is itself oxidised to the acid. Methanol would be a reduction, and $CO2$ a complete oxidation.'))
            ],
            why: t('Aldehidas yra redukuotojas: jo $C-H$ ryšys oksiduojasi, todėl varis iš $Cu(II)$ virsta $Cu(I)$ ar $Cu$.', 'An aldehyde is a reducing agent: its $C-H$ bond is oxidised, so copper goes from $Cu(II)$ to $Cu(I)$ or $Cu$.'),
            src: 'LW6 p3',
            claims: [{ formula: ['O=CO', 'CH2O2'] }, { name: ['O=CO', t('metano rūgštis', 'methanoic acid')] }]
          },
          {
            id: 'l6.products.8',
            q: [{ scheme: { items: [{ smi: 'O=Cc1ccccc1' }, { plus: true }, { smi: 'Nc1ccccc1' }, { arrow: '→' }] } }],
            steps: [
              ch(t('Kuris produktas susidaro?', 'Which product forms?'),
                [['iminas (Šifo bazė)', 'an imine (Schiff base)'], ['amidas', 'an amide'], ['hemiaminalas, kuris nebeskyla', 'a hemiaminal that does not break down'], ['benzenkarboksirūgštis', 'benzoic acid']], 0,
                t('Kas vyksta po amino grupės prisijungimo prie karbonilo anglies?', 'What happens after the amino group has added to the carbonyl carbon?'),
                t('Po nukleofilinio prijungimo atskyla vanduo ir susidaro $C=N$, tai iminas. Amidas reikalautų rūgšties darinio.', 'After nucleophilic addition water is lost and $C=N$ forms, an imine. An amide would need an acid derivative.')),
              ch(t('Kuris fragmentas yra Šifo bazės požymis?', 'Which fragment marks a Schiff base?'),
                [['$C=N$', '$C=N$'], ['$C=O$', '$C=O$'], ['$N-H$', '$N-H$'], ['$C-O-C$', '$C-O-C$']], 0,
                t('Kokią grupę sudaro dvigubasis ryšys su azotu?', 'Which group is the double bond to nitrogen?'),
                t('Šifo bazės yra iminai $R-CH=N-R$.', 'Schiff bases are imines $R-CH=N-R$.'))
            ],
            why: t('Aldehidas su pirminiu aminu sudaro iminą: aminas prijungiamas prie $C=O$, po to atskyla vanduo.', 'An aldehyde and a primary amine give an imine: the amine adds to $C=O$ and then water is lost.'),
            src: 'LW6 p3',
            claims: [{ formula: [IMINE, 'C13H11N'] }]
          },
          {
            id: 'l6.products.9',
            q: [{ scheme: { items: [{ smi: 'CC(=O)O' }, { plus: true }, { smi: 'CC(C)CCO' }, { arrow: '⇌', above: f('H2SO4') }] } }],
            steps: [
              ch(t('Kuris esteris susidaro?', 'Which ester forms?'),
                [['izopentilacetatas (3-metilbutiletanoatas)', 'isopentyl acetate (3-methylbutyl ethanoate)'], ['pentan-2-iletanoatas', 'pentan-2-yl ethanoate'], ['pentiletanoatas', 'pentyl ethanoate'], ['izopentilo eteris', 'diisopentyl ether']], 0,
                t('Ar šakota alkilo grandinė pasikeičia reakcijoje?', 'Does the branched alkyl chain change in the reaction?'),
                t('Alkoholio anglies skeletas nesikeičia: $CH3COO-$ jungiasi su $OCH2CH2CH(CH3)2$. Kiti variantai turi kitokią grandinę ar jungiasi per kitą atomą.', 'The carbon skeleton of the alcohol is unchanged: $CH3COO-$ bonds to $OCH2CH2CH(CH3)2$. The other options have a different chain or a different link.')),
              ch(t('Kuris iš šių veiksmų pagerina esterio išeigą?', 'Which of these improves the ester yield?'),
                [['vandens surišimas ($H2SO4$)', 'binding the water ($H2SO4$)'], ['vandens pridėjimas', 'adding water'], ['rūgšties pašalinimas', 'removing the acid'], ['aušinimas iki $0 °C$', 'cooling to $0 °C$']], 0,
                t('Esterinimas yra pusiausvyros reakcija.', 'Esterification is an equilibrium reaction.'),
                t('Pašalinus vandenį, pusiausvyra pasislenka produktų link, o vandens pridėjimas veda atgal (hidrolizė).', 'Removing water shifts the equilibrium toward the products, while adding water drives it back (hydrolysis).'))
            ],
            why: t('Esterinimas yra grįžtamas: katalizatorius pagreitina pusiausvyrą, o vandens šalinimas didina išeigą.', 'Esterification is reversible: the catalyst speeds up equilibrium, and removal of water raises the yield.'),
            src: 'LW6 p3',
            claims: [{ react: ['acid.ester', ['CC(=O)O', 'CC(C)CCO'], null, ESTER] }, { name: [ESTER, t('3-metilbutiletanoatas', '3-methylbutyl ethanoate')] }]
          }
        ]
      },
      {
        id: 'l6.calc',
        title: t('Skaičiavimai: išeiga, Rf, lydymosi temperatūra', 'Calculations: yield, Rf, melting point'),
        mirrors: ['LW6.2', 'LW6.9', 'LW6.10', 'LW6.11', 'LW6.22'],
        gen(rng, ctx) {
          const fmt = (x, d) => x.toFixed(d);
          const lt = (x, d) => fmt(x, d).replace('.', ',');
          const variant = ctx.pick(['ester', 'phth', 'rf', 'mp', 'ratio']);

          if (variant === 'ester') {
            const m = ctx.int(20, 90) / 10;                      // g of isopentanol
            const theo = m / 88.15 * 130.18;                     // 1 : 1
            const obt = Math.round(theo * ctx.int(35, 90)) / 100; // g obtained
            const y = obt / Number(theo.toFixed(2)) * 100;
            return {
              q: [{ p: t('Izopentilacetatas ($M$ = 130,18 g/mol) gaunamas iš izopentanolio ($M$ = 88,15 g/mol); reagentai reaguoja santykiu 1 : 1. Naudota ' + lt(m, 1) + ' g izopentanolio (rūgšties pertekliuje), po išskyrimo gauta ' + lt(obt, 2) + ' g esterio.',
                'Isopentyl acetate ($M$ = 130.18 g/mol) is made from isopentanol ($M$ = 88.15 g/mol), 1 : 1. ' + fmt(m, 1) + ' g of isopentanol was used (acid in excess) and ' + fmt(obt, 2) + ' g of ester was obtained after work-up.') }],
              steps: [
                { prompt: t('Kokia teorinė esterio masė (g)?', 'What is the theoretical mass of ester (g)?'), kind: 'number', answer: { value: theo, tol: 0.03 },
                  hint: t('Pirma raskite alkoholio molių skaičių, tada padauginkite iš esterio molinės masės.', 'First find the moles of alcohol, then multiply by the molar mass of the ester.'),
                  solution: t('$n = ' + lt(m, 1) + ' / 88,15$; teorinė masė $= n · 130,18 = ' + lt(theo, 2) + '$ g.', '$n = ' + fmt(m, 1) + ' / 88.15$; theoretical mass $= n · 130.18 = ' + fmt(theo, 2) + '$ g.') },
                { prompt: t('Kokia išeiga (%)?', 'What is the yield (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Išeiga yra gauta masė, padalyta iš teorinės.', 'Yield is the mass obtained divided by the theoretical mass.'),
                  solution: t('Išeiga $= ' + lt(obt, 2) + ' / ' + lt(theo, 2) + ' · 100 = ' + lt(y, 1) + ' %$.', 'Yield $= ' + fmt(obt, 2) + ' / ' + fmt(theo, 2) + ' · 100 = ' + fmt(y, 1) + ' %$.') }
              ],
              why: t('Išeiga lygina tikrąjį produkto kiekį su tuo, kurį duotų visiškas sureagavimas pagal stechiometriją. Ribojantis reagentas yra alkoholis, nes rūgšties yra pertekliuje.', 'Yield compares the real amount of product with what complete reaction would give by stoichiometry. The limiting reagent is the alcohol because the acid is in excess.'),
              src: 'LW6 p3'
            };
          }

          if (variant === 'phth') {
            const m = ctx.int(5, 30) / 10;                       // g phthalic anhydride (148.12)
            const phen = 2 * m / 148.12 * 94.11;                 // g of phenol needed (2 equivalents)
            const theo = m / 148.12 * 318.32;                    // phenolphthalein 1 : 1
            const obt = Math.round(theo * ctx.int(40, 85)) / 100;
            const y = obt / Number(theo.toFixed(2)) * 100;
            return {
              q: [{ p: t('Fenolftaleinas ($M$ = 318,32 g/mol) gaunamas iš ftalio anhidrido ($M$ = 148,12 g/mol) ir fenolio ($M$ = 94,11 g/mol). Imta ' + lt(m, 1) + ' g ftalio anhidrido, fenolio tiek, kad jo būtų dvigubai daugiau molių; gauta ' + lt(obt, 2) + ' g fenolftaleino.',
                'Phenolphthalein ($M$ = 318.32 g/mol) is made from phthalic anhydride ($M$ = 148.12 g/mol) and phenol ($M$ = 94.11 g/mol). ' + fmt(m, 1) + ' g of phthalic anhydride was taken, with phenol in twice the number of moles; ' + fmt(obt, 2) + ' g of phenolphthalein was obtained.') }],
              steps: [
                { prompt: t('Kiek fenolio (g) reikia?', 'How many grams of phenol are needed?'), kind: 'number', answer: { value: phen, tol: 0.03 },
                  hint: t('Fenolio molių skaičius lygus dvigubam anhidrido molių skaičiui.', 'The moles of phenol equal twice the moles of anhydride.'),
                  solution: t('$n(anhidrido) = ' + lt(m, 1) + ' / 148,12$; fenolio $2n · 94,11 = ' + lt(phen, 2) + '$ g.', '$n(anhydride) = ' + fmt(m, 1) + ' / 148.12$; phenol $2n · 94.11 = ' + fmt(phen, 2) + '$ g.') },
                { prompt: t('Kokia teorinė fenolftaleino masė (g)?', 'What is the theoretical mass of phenolphthalein (g)?'), kind: 'number', answer: { value: theo, tol: 0.03 },
                  hint: t('Produkto ir anhidrido moliai santykiu 1 : 1.', 'Moles of product to moles of anhydride are 1 : 1.'),
                  solution: t('$' + lt(m, 1) + ' / 148,12 · 318,32 = ' + lt(theo, 2) + '$ g.', '$' + fmt(m, 1) + ' / 148.12 · 318.32 = ' + fmt(theo, 2) + '$ g.') },
                { prompt: t('Kokia išeiga (%)?', 'What is the yield (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Gauta masė, padalinta iš teorinės.', 'Mass obtained divided by theoretical mass.'),
                  solution: t('$' + lt(obt, 2) + ' / ' + lt(theo, 2) + ' · 100 = ' + lt(y, 1) + ' %$.', '$' + fmt(obt, 2) + ' / ' + fmt(theo, 2) + ' · 100 = ' + fmt(y, 1) + ' %$.') }
              ],
              why: t('Stechiometrinis santykis rodo, kad vienam anhidrido moliui reikia dviejų molių fenolio, bet produkto kiekį riboja anhidridas (1 : 1).', 'Stoichiometry shows that one mole of anhydride needs two moles of phenol, while the product amount is limited by the anhydride (1 : 1).'),
              src: 'LW6 p3'
            };
          }

          if (variant === 'rf') {
            const front = ctx.int(60, 90);
            const a = ctx.int(14, 36);                           // 1-nitronaphthalene (more polar)
            const b = ctx.int(a + 10, front - 8);                // naphthalene (less polar)
            return {
              q: [{ p: t('Plonasluoksnės chromatografijos plokštelėje (silikagelis, nepolinis eluentas) nitrinimo mišinys išskirstomas į naftaleną ir 1-nitronaftaleną. Tirpiklio frontas nuėjo ' + front + ' mm, 1-nitronaftaleno dėmė ' + a + ' mm, naftaleno dėmė ' + b + ' mm nuo starto linijos.',
                'In thin-layer chromatography (silica gel, nonpolar eluent) the nitration mixture is separated into naphthalene and 1-nitronaphthalene. The solvent front moved ' + front + ' mm, the 1-nitronaphthalene spot ' + a + ' mm and the naphthalene spot ' + b + ' mm from the start line.') }],
              steps: [
                { prompt: t('Koks 1-nitronaftaleno $R_f$?', 'What is the $R_f$ of 1-nitronaphthalene?'), kind: 'number', answer: { value: a / front, tol: 0.01 },
                  hint: t('$R_f$ yra dėmės nueitas kelias, padalytas iš tirpiklio fronto kelio.', '$R_f$ is the distance travelled by the spot divided by the distance of the solvent front.'),
                  solution: t('$R_f = ' + a + ' / ' + front + ' = ' + lt(a / front, 2) + '$.', '$R_f = ' + a + ' / ' + front + ' = ' + fmt(a / front, 2) + '$.') },
                { prompt: t('Koks naftaleno $R_f$?', 'What is the $R_f$ of naphthalene?'), kind: 'number', answer: { value: b / front, tol: 0.01 },
                  hint: t('Tas pats skaičiavimas su kita dėme.', 'The same calculation for the other spot.'),
                  solution: t('$R_f = ' + b + ' / ' + front + ' = ' + lt(b / front, 2) + '$.', '$R_f = ' + b + ' / ' + front + ' = ' + fmt(b / front, 2) + '$.') },
                ch(t('Kuris junginys mažiau polinis ir kodėl?', 'Which compound is less polar, and why?'),
                  [['naftalenas: didesnis $R_f$, mažiau sąveikauja su silikageliu', 'naphthalene: higher $R_f$, it interacts less with the silica'],
                   ['1-nitronaftalenas: didesnis $R_f$', '1-nitronaphthalene: higher $R_f$'],
                   ['abu vienodai polinių, skiriasi tik masė', 'both are equally polar, only the mass differs'],
                   ['nustatyti galima tik pagal spalvą', 'it can only be told from the colour']], 0,
                  t('Nepolinis eluentas greičiau neša mažiau polinį junginį.', 'A nonpolar eluent carries the less polar compound faster.'),
                  t('Nitrogrupė didina polinį pobūdį, todėl nitronaftalenas stipriau sulaikomas silikagelio ir nueina mažesnį kelią. Naftalenas turi didesnį $R_f$.', 'The nitro group raises polarity, so nitronaphthalene is held more strongly by the silica and travels less. Naphthalene has the higher $R_f$.'))
              ],
              why: t('$R_f$ yra santykis, nepriklausantis nuo plokštelės dydžio, ir nusako junginio sąveiką su sorbentu bei eluentu: poliškesnis junginys silikagelyje juda lėčiau.', '$R_f$ is a ratio independent of plate size and describes the interaction of a compound with sorbent and eluent: a more polar compound moves more slowly on silica.'),
              src: 'LW6 p1'
            };
          }

          if (variant === 'mp') {
            const comp = ctx.pick([
              { lt: '1-nitronaftalenas', en: '1-nitronaphthalene', mp: 61 },
              { lt: 'benzilidenanilinas (Šifo bazė)', en: 'benzylideneaniline (the Schiff base)', mp: 52 },
              { lt: 'naftalenas', en: 'naphthalene', mp: 80 },
              { lt: 'fenolftaleinas', en: 'phenolphthalein', mp: 262 }
            ]);
            const pure = ctx.int(0, 1) === 0;
            const lo = pure ? comp.mp - ctx.int(0, 1) : comp.mp - ctx.int(6, 14);
            const hi = lo + (pure ? ctx.int(1, 2) : ctx.int(4, Math.min(9, comp.mp - 1 - lo))); // an impure range ends below the pure melting point
            return {
              q: [{ p: t('Perkristalintas junginys ' + comp.lt + ' lydosi ' + lo + '–' + hi + ' °C temperatūroje; literatūrinė lydymosi temperatūra ' + comp.mp + ' °C.',
                'The recrystallised compound ' + comp.en + ' melts at ' + lo + '–' + hi + ' °C; the literature melting point is ' + comp.mp + ' °C.') }],
              steps: [
                { prompt: t('Kokia lydymosi intervalo plotis (°C)?', 'What is the width of the melting range (°C)?'), kind: 'number', answer: { value: hi - lo, tol: 0 },
                  hint: t('Intervalo plotis yra aukščiausia minus žemiausia temperatūra.', 'The width is the upper temperature minus the lower one.'),
                  solution: t('$' + hi + ' − ' + lo + ' = ' + (hi - lo) + '$ °C.', '$' + hi + ' − ' + lo + ' = ' + (hi - lo) + '$ °C.') },
                ch(t('Ką rodo rezultatas?', 'What does the result show?'),
                  [['grynas: siauras intervalas (iki 2 °C) arti literatūrinės vertės', 'pure: narrow range (up to 2 °C) close to the literature value'],
                   ['nešvarus: platus intervalas ir žemesnė temperatūra', 'impure: broad range and a lower temperature'],
                   ['grynas: žemesnė temperatūra įrodo didesnį grynumą', 'pure: a lower temperature proves higher purity'],
                   ['nešvarus: bet koks lydymasis rodo priemaišas', 'impure: any melting shows impurities']],
                  pure ? 0 : 1,
                  t('Priemaišos plečia lydymosi intervalą ir jį žemina.', 'Impurities broaden the melting range and lower it.'),
                  pure
                    ? t('Intervalas siauras (' + (hi - lo) + ' °C) ir sutampa su literatūrine verte: junginys grynas.', 'The range is narrow (' + (hi - lo) + ' °C) and agrees with the literature value: the compound is pure.')
                    : t('Intervalas platus (' + (hi - lo) + ' °C), o pradžia gerokai žemesnė už ' + comp.mp + ' °C: yra priemaišų, reikia perkristalinti.', 'The range is wide (' + (hi - lo) + ' °C) and starts well below ' + comp.mp + ' °C: impurities are present and the compound needs recrystallising.'))
              ],
              why: t('Priemaišos sutrikdo kristalinę gardelę, todėl lydymosi temperatūra krinta, o intervalas plečiasi. Grynas junginys lydosi siaurame (apie 1–2 °C) intervale.', 'Impurities disturb the crystal lattice, so the melting point falls and the range widens. A pure compound melts in a narrow range (about 1–2 °C).'),
              src: 'LW6 p3'
            };
          }

          // ratio of the Schiff base reagents from the measured volumes
          let vb, va, r;
          for (let k = 0; k < 40; k++) {
            vb = ctx.int(2, 12) / 10; va = ctx.int(2, 12) / 10;
            r = (va * 1.022 / 93.13) / (vb * 1.044 / 106.12);
            if (Math.abs(r - 1) > 0.15) break;
            r = null;
          }
          if (r === null) throw new Error('l6.calc: no usable volumes');
          const ans = r > 1 ? 0 : 1;
          return {
            q: [{ p: t('Šifo bazei imta ' + lt(vb, 1) + ' ml benzenkarbaldehido ($ρ$ = 1,044 g/ml, $M$ = 106,12 g/mol) ir ' + lt(va, 1) + ' ml anilino ($ρ$ = 1,022 g/ml, $M$ = 93,13 g/mol).',
              'For the Schiff base ' + fmt(vb, 1) + ' ml of benzaldehyde ($ρ$ = 1.044 g/ml, $M$ = 106.12 g/mol) and ' + fmt(va, 1) + ' ml of aniline ($ρ$ = 1.022 g/ml, $M$ = 93.13 g/mol) were taken.') }],
            steps: [
              { prompt: t('Koks yra moliu santykis $n$(anilino) : $n$(benzenkarbaldehido)?', 'What is the mole ratio $n$(aniline) : $n$(benzaldehyde)?'), kind: 'number', answer: { value: r, tol: 0.03 },
                hint: t('Moliai = tūris · tankis / molinė masė.', 'Moles = volume · density / molar mass.'),
                solution: t('$n$(anilino) $= ' + lt(va * 1.022 / 93.13 * 1000, 2) + '$ mmol, $n$(aldehido) $= ' + lt(vb * 1.044 / 106.12 * 1000, 2) + '$ mmol; santykis $= ' + lt(r, 2) + '$.',
                  '$n$(aniline) $= ' + fmt(va * 1.022 / 93.13 * 1000, 2) + '$ mmol, $n$(aldehyde) $= ' + fmt(vb * 1.044 / 106.12 * 1000, 2) + '$ mmol; ratio $= ' + fmt(r, 2) + '$.') },
              ch(t('Kuris reagentas yra pertekliuje?', 'Which reagent is in excess?'),
                [['anilinas', 'aniline'], ['benzenkarbaldehidas', 'benzaldehyde'], ['jie lygūs 1 : 1', 'they are equal 1 : 1'], ['negalima nustatyti', 'it cannot be determined']], ans,
                t('Reakcijoje reagentai jungiasi 1 : 1, todėl didesnis kiekis lieka nesureagavęs.', 'The reagents combine 1 : 1, so the larger amount is left unreacted.'),
                t('Santykis ' + lt(r, 2) + (r > 1 ? ' > 1: pertekliuje yra anilinas.' : ' < 1: pertekliuje yra benzenkarbaldehidas.'), 'The ratio ' + fmt(r, 2) + (r > 1 ? ' > 1: aniline is in excess.' : ' < 1: benzaldehyde is in excess.')))
            ],
            why: t('Reakcija vyksta 1 : 1, todėl mažesnio kiekio reagentas yra ribojantis, o kito perteklius lieka priemaiša. Todėl lašus reikia skaičiuoti atidžiai.', 'The reaction is 1 : 1, so the reagent in the smaller amount is limiting and the excess of the other remains as an impurity. That is why the drops must be counted with care.'),
            src: 'LW6 p3'
          };
        }
      },
      {
        id: 'l6.apparatus',
        title: t('Įrangos atpažinimas pagal aprašymą', 'Identifying apparatus from a description'),
        mirrors: ['LW6.1', 'LW6.2', 'LW6.4', 'LW6.8', 'LW6.9', 'LW6.10', 'LW6.11'],
        bank: [
          {
            id: 'l6.apparatus.1',
            q: [{ p: t('Naftaleno nitrinimo mėgintuvėlis užkimštas kamščiu, per kurį eina ilgas tiesus stiklinis vamzdelis, stovintis vertikaliai.', 'The naphthalene nitration tube is closed with a stopper through which a long straight glass tube runs, standing vertically.') }],
            steps: [ch(t('Kas tai ir kam reikalinga?', 'What is it and what is it for?'),
              [
                ['Oro kondensatorius: garai vamzdelyje kondensuojasi ir grįžta į mišinį.', 'An air condenser: vapours condense in the tube and return to the mixture.'],
                ['Dujų vamzdelis: dujos nuvedamos į kitą tirpalą.', 'A gas tube: the gas is led into another solution.'],
                ['Lašinamoji piltuvė: reagentas pilamas lašais.', 'A dropping funnel: reagent is added by drops.'],
                ['Lybigo kondensatorius: produktas distiliuojamas.', 'A Liebig condenser: the product is distilled.']
              ], 0,
              t('Ar vamzdelis sujungtas su kitu indu, ar lieka atviras viršuje?', 'Is the tube connected to another vessel, or is it open at the top?'),
              t('Vamzdelis atviras viršuje, o ilgas ir šaltas oro srautas kondensuoja garus, todėl mišinys neišgaruoja. Dujų vamzdelis būtų sulenktas ir nuleistas į kitą indą.', 'The tube is open at the top and the long cool surface condenses vapours so that nothing is lost. A gas tube would be bent and lowered into another vessel.'))],
            why: t('Kaitinant lakias medžiagas atvirame indelyje jos garuotų. Oro kondensatorius yra paprasčiausias grįžtamojo kondensatoriaus pakaitalas.', 'On heating volatile substances in an open vessel they would evaporate. An air condenser is the simplest reflux device.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.apparatus.2',
            q: [{ p: t('Eteno bandyme mėgintuvėlis su kamščiu turi sulenktą stiklinį vamzdelį, kurio galas panardintas į kitame mėgintuvėlyje esantį tirpalą.', 'In the ethene experiment a stoppered test tube has a bent glass tube whose end dips into a solution in another tube.') }],
            steps: [ch(t('Kokia šio vamzdelio paskirtis?', 'What is this tube for?'),
              [
                ['Dujas (etenas) praleisti pro tirpalą ir stebėti reakciją.', 'To lead the gas (ethene) through a solution and watch the reaction.'],
                ['Atvėsinti garus ir grąžinti skystį.', 'To cool vapours and return the liquid.'],
                ['Į mišinį lašinti reagentą.', 'To add a reagent dropwise to the mixture.'],
                ['Išlyginti slėgį, kad kamštis neišlėktų.', 'To equalise the pressure so that the stopper does not pop out.']
              ], 0,
              t('Kur patenka dujos po to, kai pasiekia vamzdelio galą?', 'Where does the gas go after it reaches the end of the tube?'),
              t('Dujų vamzdelis veda eteną į bromo vandenį ar permanganatą, kad dujos reaguotų su reagentu.', 'The gas tube leads the ethene into bromine water or permanganate so that it reacts with the reagent.'))],
            why: t('Gaunamas dujas sunku laikyti, todėl jos tiesiai nuvedamos į reagentą. Vamzdelio galas turi būti po skysčio paviršiumi.', 'Gases are hard to store, so they are led directly into the reagent. The end of the tube must be below the liquid surface.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.apparatus.3',
            q: [{ p: t('Stiklinė su verdančiu vandeniu ant elektrinės viryklės, o joje mažas mėgintuvėlis su reagentais.', 'A beaker of boiling water on an electric hot plate, with a small test tube of reagents in it.') }],
            steps: [ch(t('Kokią įrangą aprašo šis vaizdas ir kodėl ji naudojama?', 'What does this describe and why is it used?'),
              [
                ['Vandens vonia: švelnus tolygus kaitinimas iki ne daugiau kaip 100 °C.', 'A water bath: gentle even heating to at most 100 °C.'],
                ['Distiliavimo aparatas: skysčiai atskiriami pagal virimo temperatūrą.', 'A distillation set: liquids are separated by boiling point.'],
                ['Aušinimo vonia: mišinys vėsinamas.', 'A cooling bath: the mixture is cooled.'],
                ['Krosnelė, kuri kaitina virš 200 °C.', 'A furnace heating above 200 °C.']
              ], 0,
              t('Kokios aukščiausios temperatūros gali pasiekti verdantis vanduo?', 'What is the highest temperature that boiling water can reach?'),
              t('Verdantis vanduo kaitina tolygiai ir niekada neįkaista virš 100 °C, todėl tinka esterinimui ir nitrinimui, kai nereikia aukštesnės temperatūros.', 'Boiling water heats evenly and never goes above 100 °C, so it suits esterification and nitration, where no higher temperature is needed.'))],
            why: t('Tolygus kaitinimas apsaugo mišinį nuo vietinio perkaitimo ir suirimo.', 'Even heating protects the mixture from local overheating and decomposition.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.apparatus.4',
            q: [{ p: t('Mažas buteliukas su guminiu kamšteliu ir stikline pipete, kurią galima išimti.', 'A small bottle with a rubber teat and a glass pipette that can be lifted out.') }],
            steps: [ch(t('Kam jis naudojamas?', 'What is it used for?'),
              [
                ['Reagentams lašinti po lašą: tinka mažiems kiekiams.', 'Adding reagents drop by drop: suitable for small amounts.'],
                ['Skysčiams matuoti iki mililitro tikslumo.', 'Measuring liquids with millilitre precision.'],
                ['Dujoms rinkti.', 'Collecting gases.'],
                ['Skysčiui filtruoti.', 'Filtering a liquid.']
              ], 0,
              t('Kuriam darbo etape reikia kelių lašų reagento?', 'At which step of the work do you need a few drops of reagent?'),
              t('Tai lašinamasis buteliukas: lašus galima skaičiuoti, o tai svarbu Šifo bazės ar esterio sintezėje. Matavimui naudojamas cilindras ar pipetė su padalomis.', 'This is a dropper bottle: the drops can be counted, which matters in the Schiff base or ester synthesis. A measuring cylinder or graduated pipette is used for measuring.'))],
            why: t('Lašų skaičiavimas leidžia dozuoti reagentus be svarstyklių, ypač kai reikia santykio 1 : 1.', 'Counting drops allows reagents to be dosed without a balance, especially when a 1 : 1 ratio is needed.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.apparatus.5',
            q: [{ p: t('Šifo bazė neiškrito, kol nepatrynėte vidinės mėgintuvėlio sienelės stikline lazdele.', 'The Schiff base did not crystallise until you rubbed the inner wall of the test tube with a glass rod.') }],
            steps: [ch(t('Kodėl taip daroma?', 'Why is this done?'),
              [
                ['Brūkštelėjimai sukuria kristalizacijos centrus ir kristalai pradeda augti.', 'Scratches create nucleation sites and crystals start to grow.'],
                ['Lazdelė šildo mišinį.', 'The rod warms the mixture.'],
                ['Lazdelė suriša vandenį.', 'The rod binds water.'],
                ['Lazdelė išstumia orą iš tirpalo.', 'The rod drives air out of the solution.']
              ], 0,
              t('Ko reikia persotintam tirpalui, kad iškristų kietoji fazė?', 'What does a supersaturated solution need before a solid phase forms?'),
              t('Persotintame tirpale trūksta kristalizacijos centrų. Pabraukius stiklą, atsiranda nelygumų ir mikroskopinių stiklo dulkių, ant kurių kristalai ima augti.', 'A supersaturated solution lacks nucleation sites. Scratching the glass creates rough spots and tiny glass particles on which crystals begin to grow.'))],
            why: t('Kristalizacija prasideda ties pradmeniu; tinkamas paviršius gali jį pakeisti.', 'Crystallisation starts at a nucleus; a suitable surface can replace it.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.apparatus.6',
            q: [{ p: t('Tamsiame kambaryje fluoresceino tirpalą apšviečiate įtaisu, kuris skleidžia nematomą spinduliuotę, kurios bangos ilgis trumpesnis už violetinės šviesos ir kuria žadinama fluorescencija.', 'In a dark room you illuminate the fluorescein solution with a device that emits invisible radiation of shorter wavelength than violet light, used to excite fluorescence.') }],
            steps: [ch(t('Koks tai įtaisas?', 'Which device is this?'),
              [
                ['UV lempa', 'A UV lamp'],
                ['Infraraudonųjų spindulių šildytuvas', 'An infrared heater'],
                ['Magnetinė maišyklė', 'A magnetic stirrer'],
                ['Mikrobangų krosnelė', 'A microwave oven']
              ], 0,
              t('Fluorescencijai žadinti naudojama trumpesnė už matomą šviesą spinduliuotė.', 'Fluorescence is excited by radiation of shorter wavelength than visible light.'),
              t('Fluoresceinas sugeria UV šviesą ir skleidžia žalią matomą šviesą. Todėl naudojama UV lempa, o ne šildytuvas ar mikrobangų krosnelė.', 'Fluorescein absorbs UV light and emits green visible light. so a UV lamp is used, not a heater or a microwave oven.'))],
            why: t('Fluorescencijai žadinti reikia šviesos, kurios fotonų energija didesnė už skleidžiamos šviesos fotonų energiją.', 'Exciting fluorescence needs light whose photons carry more energy than the emitted ones.'),
            src: 'LW6 p4'
          },
          {
            id: 'l6.apparatus.7',
            q: [{ p: t('Lydalą (ftalio anhidridas su fenoliu) kaitinate pasvirusiame mėgintuvėlyje, liečiančiame elektrinės viryklės paviršių, kartais apvyniotame folija.', 'You heat the melt (phthalic anhydride with phenol) in a tilted tube that touches the hot-plate surface, sometimes wrapped in foil.') }],
            steps: [ch(t('Kam naudojama folija?', 'What is the foil for?'),
              [
                ['Šilumai perduoti: mėgintuvėlis įkaista greičiau ir tolygiau.', 'To conduct heat: the tube heats faster and more evenly.'],
                ['Apsaugoti turinį nuo šviesos.', 'To protect the contents from light.'],
                ['Surišti vandenį.', 'To bind water.'],
                ['Kad mėgintuvėlis atvėstų.', 'So the tube cools down.']
              ], 0,
              t('Metalas yra geras ar blogas šilumos laidininkas?', 'Is a metal a good or a poor conductor of heat?'),
              t('Folija yra metalas ir gerai laidus šilumai, todėl ji pagreitina mėgintuvėlio įkaitimą ir sumažina vietinį perkaitimą.', 'Foil is a metal and conducts heat well, so it speeds up the heating of the tube and reduces local overheating.'))],
            why: t('Kontaktas su šildomu paviršiumi yra pagrindinis šilumos šaltinis; metalinė folija padeda jam pasiekti mėgintuvėlį.', 'Contact with the heated surface is the main source of heat; metal foil helps it reach the tube.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.apparatus.8',
            q: [{ p: t('Į absoliutų etanolį dedamas natrio gabalėlis, kurį iš indo ištraukėte pincetu ir nusausinote lapeliu.', 'A piece of sodium is dropped into absolute ethanol; you took it from its container with tweezers and dried it on a sheet of paper.') }],
            steps: [ch(t('Kodėl natrio nelieskite pirštais ir nusausinate popieriumi?', 'Why is sodium not touched with fingers and dried on paper?'),
              [
                ['Odos drėgmė su natriu reaguoja ir sukelia nudegimą; alyva (apsauginis sluoksnis) turi būti pašalinta.', 'Moisture on skin reacts with sodium and causes a burn; the oil (protective layer) must be removed.'],
                ['Pirštai oksiduoja natrį į natrio oksidą.', 'Fingers oxidise sodium to sodium oxide.'],
                ['Popierius suriša natrio jonus.', 'The paper binds sodium ions.'],
                ['Natris tirpsta odoje ir sudaro dažus.', 'Sodium dissolves in fingers and dyes must be avoided.']
              ], 0,
              t('Kas atsitinka, kai natris susiduria su vandeniu?', 'What happens when sodium meets water?'),
              t('Natris reaguoja su drėgme ant odos ir sudaro šarmą bei karštį. Todėl jį imama pincetu, o alyvos likučiai pašalinami popieriumi.', 'Sodium reacts with moisture on skin to give alkali and heat. So it is picked up with tweezers and oil residues are removed with paper.'))],
            why: t('Šarminiai metalai saugomi po aliejumi, kad nekontaktuotų su drėgme; prieš naudojimą aliejus pašalinamas.', 'Alkali metals are stored under oil to keep them away from moisture; the oil is removed before use.'),
            src: 'LW6 p2'
          }
        ]
      },
      {
        id: 'l6.defence',
        title: t('Gynimo klausimai', 'Defence questions'),
        mirrors: ['LW6.3', 'LW6.6', 'LW6.9', 'LW6.12', 'LW6.13', 'LW6.14', 'LW6.15', 'LW6.16', 'LW6.17', 'LW6.18', 'LW6.19', 'LW6.20', 'LW6.21', 'LW6.22', 'LW6.23', 'LW6.24', 'LW6.25'],
        bank: [
          {
            id: 'l6.defence.1',
            q: [{ p: t('Gynime paklausta: kurie iš trijų dujų – etanas, etenas, etinas – pablukina bromo vandenį?', 'At the defence you are asked: which of three gases, ethane, ethene, ethyne, decolourise bromine water?') }],
            steps: [{
              prompt: t('Pažymėkite visas dujas, kurios pakeičia bromo vandens spalvą.', 'Select every gas that decolourises bromine water.'), kind: 'multi',
              options: [{ text: t('etanas', 'ethane') }, { text: t('etenas', 'ethene') }, { text: t('etinas', 'ethyne') }],
              answer: [1, 2],
              hint: t('Kuriose molekulėse yra daugialypių ryšių?', 'Which molecules contain multiple bonds?'),
              solution: t('Bromas prisijungia prie dvigubojo ir trigubojo ryšio. Etanas turi tik viengubuosius ryšius ir spalvos nekeičia.', 'Bromine adds to double and triple bonds. Ethane has only single bonds and does not change the colour.')
            }],
            why: t('Bandymas rodo daugialypį ryšį, bet neskiria alkeno nuo alkino.', 'The test shows a multiple bond but does not tell an alkene from an alkyne.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.defence.2',
            q: [{ p: t('Kokie stebėjimai nitrinant naftaleną patvirtina, kad susidarė nitrojunginys?', 'Which observations in the nitration of naphthalene support that a nitro compound formed?') }],
            steps: [{
              prompt: t('Pažymėkite stebėjimus, kurie tai palaiko.', 'Select the observations that support it.'), kind: 'multi',
              options: [
                { text: t('geltonas junginys, būdingas nitrojunginiams', 'a yellow compound, typical of nitro compounds') },
                { text: t('produktas netirpsta vandenyje, nusėda ir sukietėja', 'the product is insoluble in water, settles and solidifies') },
                { text: t('išsiskiria $H2$ dujos', '$H2$ gas is released') },
                { text: t('tirpalas tampa mėlynas', 'the solution turns blue') }
              ],
              answer: [0, 1],
              hint: t('Ką sakoma apie nitrojunginių spalvą ir tirpumą?', 'What is said about the colour and solubility of nitro compounds?'),
              solution: t('Geltona spalva būdinga nitrojunginiams, o nepolinis aromatinis nitrojunginys netirpsta ir yra sunkesnis už vandenį. Vandenilio dujos ir mėlyna spalva su šia reakcija nesusijusios.', 'A yellow colour is typical of nitro compounds, and a nonpolar aromatic nitro compound is insoluble and denser than water. Hydrogen and a blue colour have nothing to do with this reaction.')
            }],
            why: t('Šie požymiai tik netiesiogiai rodo nitrojunginį; patvirtinti galima lydymosi temperatūra ar spektrais.', 'These signs only indirectly show a nitro compound; confirmation would use the melting point or spectra.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.defence.3',
            q: [{ p: t('Etanolis su vandeniu sudaro azeotropą. Ką tai reiškia ir kaip gaunamas bevandenis etanolis?', 'Ethanol forms an azeotrope with water. What does it mean and how is anhydrous ethanol obtained?') }],
            steps: [
              ch(t('Kas yra azeotropas?', 'What is an azeotrope?'),
                [['mišinys, kurio garai ir skystis turi tą pačią sudėtį, todėl jis distiliuojasi nekeisdamas sudėties', 'a mixture whose vapour and liquid have the same composition, so it distils without changing'],
                 ['mišinys, kurio komponentų virimo temperatūros skiriasi daugiau nei 80 °C', 'a mixture whose components boil more than 80 °C apart'],
                 ['mišinys, kuris tirpsta kristalizuojantis', 'a mixture that dissolves on crystallising'],
                 ['junginys, susidarantis iš etanolio ir vandens', 'a compound formed from ethanol and water']], 0,
                t('Ką distiliavimas galėtų atskirti, jei sudėtis kinta?', 'What could distillation separate if the composition changes?'),
                t('Azeotropas elgiasi kaip vienas junginys: garų ir skysčio sudėtis ta pati, todėl distiliacija jo neskiria.', 'An azeotrope behaves like a single compound: vapour and liquid have the same composition, so distillation does not separate it.')),
              ch(t('Kaip gaunamas absoliutus etanolis?', 'How is absolute ethanol obtained?'),
                [['vandenį chemiškai suriša $CaO$, o etanolis nudistiliuojamas', 'water is bound chemically by $CaO$ and the ethanol is distilled off'],
                 ['pakartotinai distiliuojant', 'by repeated distillation'],
                 ['pridedant vandens', 'by adding water'],
                 ['užšaldant etanolį', 'by freezing the ethanol']], 0,
                t('Pagalvokite, kaip vandenį galima paimti iš mišinio cheminiu būdu.', 'You need to remove water from solution, not just change the temperature.'),
                t('$CaO$ virsta $Ca(OH)2$, taip vanduo pašalinamas chemiškai, o etanolis nudistiliuojamas. Bevandenis $CuSO4$ suriša vandenį kristalhidratu, bet tik nusausina etanolį ir parodo vandenį; absoliutaus etanolio juo negauname.', '$CaO$ becomes $Ca(OH)2$, which removes the water chemically, and the ethanol is then distilled off. Anhydrous $CuSO4$ binds water as a crystal hydrate, but it only dries the ethanol and detects water; it does not give absolute ethanol.'))
            ],
            why: t('Kai fizinis atskyrimas neįmanomas, naudojama cheminė reakcija, kuri paima vieną komponentą.', 'When physical separation is not possible, a chemical reaction that takes up one component is used.'),
            src: 'LW6 p1'
          },
          {
            id: 'l6.defence.4',
            q: [{ p: t('Į etanolį įmetus natrio, išsiskiria dujos. Kas įvyksta ir kodėl?', 'Sodium dropped into ethanol releases a gas. What happens and why?') }],
            steps: [{
              prompt: t('Pažymėkite visus teisingus teiginius.', 'Select all correct statements.'), kind: 'multi',
              options: [
                { text: t('Natris pakeičia $O-H$ vandenilį.', 'Sodium replaces the $O-H$ hydrogen.') },
                { text: t('Susidaro natrio etoksidas.', 'Sodium ethoxide forms.') },
                { text: t('Išsiskiria $H2$.', '$H2$ is released.') },
                { text: t('Susidaro natrio karbonatas.', 'Sodium carbonate forms.') },
                { text: t('Natris pakeičia $C-H$ vandenilį.', 'Sodium replaces a $C-H$ hydrogen.') }
              ],
              answer: [0, 1, 2],
              hint: t('Kuris vandenilis alkoholyje silpnai rūgštus?', 'Which hydrogen in an alcohol is weakly acidic?'),
              solution: t('Natris pakeičia poliarizuoto $O-H$ ryšio vandenilį, išsiskiria $H2$ ir susidaro natrio etoksidas. $C-H$ vandeniliai nėra pakankamai rūgštūs.', 'Sodium replaces the hydrogen of the polarised $O-H$ bond, $H2$ is released and sodium ethoxide forms. The $C-H$ hydrogens are not acidic enough.')
            }],
            why: t('Alkoholio $O-H$ vandenilis silpnai rūgštus: aktyvus metalas jį išstumia kaip $H2$.', 'The $O-H$ hydrogen of an alcohol is weakly acidic: an active metal displaces it as $H2$.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.defence.5',
            q: [{ p: t('Natrio etoksido tirpale su vandeniu ir fenolftaleinu atsiranda raudonai violetinė spalva. Kokia spalva, jei vietoj etoksido būtų neutralus etanolis?', 'Sodium ethoxide solution with water and phenolphthalein turns red-violet. What colour would neutral ethanol with phenolphthalein give?') }],
            steps: [ch(t('Kokia spalva su neutraliu etanoliu?', 'Which colour with neutral ethanol?'),
              [['bespalvis', 'colourless'], ['raudonai violetinė', 'red-violet'], ['geltona', 'yellow'], ['žalia', 'green']], 0,
              t('Fenolftaleinas spalvinasi tik šarminėje terpėje.', 'Phenolphthalein is coloured only in alkaline medium.'),
              t('Neutralioje ar rūgščioje terpėje fenolftaleinas bespalvis (laktonas); parausta tik pH virš maždaug 8,3, kai atsiveria žiedas.', 'In neutral or acidic medium phenolphthalein is colourless (lactone); it turns red only above about pH 8.3, when the ring opens.'))],
            why: t('Spalva rodo šarmą, todėl raudonumas po etoksido hidrolizės yra įrodymas, kad susidarė $OH-$.', 'The colour shows alkali, so the red after hydrolysis of ethoxide is proof that $OH-$ formed.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.defence.6',
            q: [{ p: t('Šviežiai pagamintas $Cu(OH)2$ tikrinamas su trimis medžiagomis.', 'Freshly made $Cu(OH)2$ is tested with three substances.') }, { mol: [{ smi: 'OCC(O)CO' }, { smi: 'OCCO' }, { smi: 'CCO' }] }],
            steps: [{
              prompt: t('Kurie iš šių junginių (glicerolis, 1,2-etandiolis, etanolis) ištirpina $Cu(OH)2$ ir sudaro tamsiai mėlyną tirpalą?', 'Which of these compounds (glycerol, ethane-1,2-diol, ethanol) dissolve $Cu(OH)2$ to a deep blue solution?'), kind: 'multi',
              options: [{ text: t('glicerolis', 'glycerol') }, { text: t('1,2-etandiolis', 'ethane-1,2-diol') }, { text: t('etanolis', 'ethanol') }],
              answer: [0, 1],
              hint: t('Kiek hidroksigrupių ir ant kokių atomų reikalinga chelatui?', 'How many hydroxyl groups, and on which atoms, are needed for a chelate?'),
              solution: t('Chelatas reikalauja hidroksigrupių prie gretimų anglies atomų. Glicerolis ir 1,2-etandiolis jas turi, etanolis turi tik vieną.', 'A chelate needs hydroxyl groups on neighbouring carbons. Glycerol and ethane-1,2-diol have them, ethanol has only one.')
            }],
            why: t('Bandymas nėra specifinis glicerolui: jis atpažįsta funkcinį išsidėstymą (gretimas $OH$ grupes), taip pat angliavandenius; mėlyną kompleksą su variu duoda ir α-aminorūgštys, bet jos jungiasi per $NH2$ ir $COO-$.', 'The test is not specific to glycerol: it recognises a functional arrangement (neighbouring $OH$ groups), also carbohydrates; α-amino acids also give a blue copper complex, but they bind through $NH2$ and $COO-$.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.defence.7',
            q: [{ p: t('Etanolis oksiduojamas rūgštiniu $K2Cr2O7$ ir rūgštiniu $KMnO4$.', 'Ethanol is oxidised by acidified $K2Cr2O7$ and by acidified $KMnO4$.') }],
            steps: [
              ch(t('Kokia spalvos kitimo seka stebima su $K2Cr2O7$?', 'Which colour sequence is seen with $K2Cr2O7$?'),
                [['oranžinė, žalia', 'orange, green'], ['žalia, oranžinė', 'green, orange'], ['violetinė, bespalvė', 'violet, colourless'], ['geltona, mėlyna', 'yellow, blue']], 0,
                t('Chromas redukuojasi iš $+6$ į $+3$.', 'Chromium is reduced from $+6$ to $+3$.'),
                t('$Cr2O7 2-$ oranžinis, $Cr3+$ žalias.', '$Cr2O7 2-$ is orange, $Cr3+$ is green.')),
              ch(t('Kuri organinė medžiaga galiausiai susidaro?', 'Which organic substance finally forms?'),
                [['etano rūgštis', 'ethanoic acid'], ['etanalis', 'ethanal'], ['etenas', 'ethene'], ['anglies dioksidas', 'carbon dioxide']], 0,
                t('Oksidatoriaus pertekliuje aldehidas toliau oksiduojamas.', 'With excess oxidant the aldehyde is oxidised further.'),
                t('Etanolis eina per etanalį į etano rūgštį.', 'Ethanol passes through ethanal to ethanoic acid.'))
            ],
            why: t('Du oksidatoriai duoda skirtingas spalvas, bet tą patį organinį produktą. Spalvų pokytis yra oksidatoriaus, o ne alkoholio požymis.', 'The two oxidants give different colours but the same organic product. The colour change belongs to the oxidant, not to the alcohol.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.defence.8',
            q: [{ p: t('Fenolis brominasi bromo vandeniu. Paveikslėlyje parodyti fenolio atomai.', 'Phenol is brominated by bromine water. The atoms of phenol are shown.') }, { mol: { smi: PHENOL, opts: { numbers: 'all' } } }],
            steps: [{
              prompt: t('Bakstelėkite žiedo anglis, prie kurių jungiasi bromas.', 'Tap the ring carbons to which bromine bonds.'), kind: 'atoms',
              mol: { smi: PHENOL, opts: { numbers: 'all' } }, answer: [2, 4, 6],
              hint: t('Kokios padėtys žiede aktyvintos $OH$ grupės?', 'Which ring positions are activated by the $OH$ group?'),
              solution: t('Atomai Nr. 3 ir Nr. 7 yra orto, Nr. 5 – para padėtis. $OH$ yra $o,p$-orientantas, todėl bromas patenka į visas tris.', 'Atoms no. 3 and no. 7 are ortho, no. 5 is para. $OH$ is an $o,p$ director, so bromine enters all three.')
            }],
            why: t('Pakeitimo padėtys priklauso nuo pakaito orientacijos, o ne nuo reagento pertekliaus.', 'The positions of substitution depend on the directing effect of the substituent, not on the excess of reagent.'),
            src: 'LW6 p2'
          },
          {
            id: 'l6.defence.9',
            q: [{ p: t('Aldehido bandymas su šarminiu $Cu(OH)2$ ir su amoniakiniu $Ag2O$ tirpalu.', 'Aldehyde tests with alkaline $Cu(OH)2$ and with ammoniacal $Ag2O$ solution.') }],
            steps: [{
              prompt: t('Kurie junginiai duoda teigiamą rezultatą?', 'Which compounds give a positive result?'), kind: 'multi',
              options: [{ text: t('metanalis', 'methanal') }, { text: t('etanalis', 'ethanal') }, { text: t('propanonas', 'propanone') }, { text: t('cikloheksanonas', 'cyclohexanone') }],
              answer: [0, 1],
              hint: t('Kuris junginys gali būti oksiduotas nenutraukiant anglies skeleto?', 'Which compound can be oxidised without breaking the carbon skeleton?'),
              solution: t('Aldehidai turi $C-H$ ryšį prie karbonilo anglies, todėl lengvai oksiduojasi. Ketonų tokios grupės neturi, todėl jie bandymo neduoda.', 'Aldehydes have a $C-H$ bond on the carbonyl carbon and oxidise easily. Ketones lack it, so they give a negative result.')
            }],
            why: t('Redukuojančios savybės atskiria aldehidus nuo ketonų.', 'Reducing properties separate aldehydes from ketones.'),
            src: 'LW6 p3'
          },
          {
            id: 'l6.defence.10',
            q: [{ p: t('Šifo bazė gaunama iš benzenkarbaldehido ir anilino.', 'A Schiff base forms from benzaldehyde and aniline.') }],
            steps: [{
              prompt: t('Bakstelėkite atomus, sudarančius būdingąją Šifo bazės grupę.', 'Tap the atoms of the group characteristic of a Schiff base.'), kind: 'atoms',
              mol: { smi: IMINE, opts: { numbers: 'all' } }, answer: [0, 1],
              hint: t('Ieškokite dvigubojo ryšio su azotu.', 'Look for the double bond to nitrogen.'),
              solution: t('Ryšys $C=N$ yra tarp atomų Nr. 1 ir Nr. 2: tai iminas. Kiti žiedų atomai priklauso aromatiniams žiedams.', 'The $C=N$ bond is between atoms no. 1 and no. 2: this is the imine. The other atoms belong to the aromatic rings.')
            }],
            why: t('Šifo bazės yra iminai, susidarantys iš aldehido ar ketono ir pirminio amino; bendras vardas yra svarbi gynimo dalis.', 'Schiff bases are imines formed from an aldehyde or ketone and a primary amine; the general name is an important part of the defence.'),
            src: 'LW6 p3'
          }
        ]
      }
    ],
    coverage: {}
  };
  // coverage is the inverse of the mirrors lists
  U.types.forEach(ty => ty.mirrors.forEach(k => { (U.coverage[k] = U.coverage[k] || []).push(ty.id); }));
  ORG.unit(U);
})(globalThis.ORG = globalThis.ORG || {});
