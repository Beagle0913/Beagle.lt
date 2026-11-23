// site/organic/units/l3.js: lab unit 3, caffeine from tea, extraction, thin-layer chromatography
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });

  // a single-choice step: options are [lt, en] pairs, answer is the index of the right one
  const ch = (prompt, options, answer, hint, solution) => ({
    prompt, kind: 'choice', options: options.map(o => ({ text: t(o[0], o[1]) })), answer, hint, solution
  });
  const mu = (prompt, options, answer, hint, solution) => ({
    prompt, kind: 'multi', options: options.map(o => ({ text: t(o[0], o[1]) })), answer, hint, solution
  });
  // an order step: options are written in the RIGHT order, the trainer shuffles them
  const ord = (prompt, options, hint, solution) => ({
    prompt, kind: 'order', options: options.map(o => ({ text: t(o[0], o[1]) })), hint, solution
  });
  const Q = (lt, en) => [{ p: t(lt, en) }];

  const CAFF = 'Cn1cnc2c1c(=O)n(C)c(=O)n2C';
  const THEOPH = 'Cn1c(=O)c2[nH]cnc2n(C)c1=O';
  const THEOBR = 'Cn1cnc2c1c(=O)[nH]c(=O)n2C';
  const GALLIC = 'OC(=O)c1cc(O)c(O)c(O)c1';
  const GALLATE = '[O-]C(=O)c1cc(O)c(O)c(O)c1';
  const nCaff = t('kofeinas', 'caffeine');
  const nTheoph = t('teofilinas', 'theophylline');
  const nTheobr = t('teobrominas', 'theobromine');

  const U = {
    id: 'l3',
    notes: [
      {
        id: 'aim',
        title: t('Tikslas, principas ir kodėl reikia sodos', 'Aim, principle and why soda is used'),
        blocks: [
          { h: t('Ką šis darbas rodo', 'What this lab shows') },
          {
            p: t('Darbe iš arbatos lapelių išskiriamas kofeinas, o jo grynumas tikrinamas plonasluoksne chromatografija. Išskyrimo metodas yra ekstrakcija: karštas vanduo ištraukia kofeiną iš lapelių, o paskui jis perkeliamas į chloroformą. Gynime reikia paaiškinti, kodėl atliekamas kiekvienas veiksmas ir ką rodo gauti rezultatai.',
              'In this lab caffeine is isolated from tea leaves and its purity is checked by thin-layer chromatography. The method of isolation is extraction: hot water pulls caffeine out of the leaves and it is then moved into chloroform. At the defence you must explain why each step is done and what the results show.'),
            src: 'LW3 p4'
          },
          {
            mol: [
              { smi: CAFF, name: t('1,3,7-trimetilksantinas', '1,3,7-trimethylxanthine'), caption: nCaff },
              { smi: THEOPH, name: t('1,3-dimetilksantinas', '1,3-dimethylxanthine'), caption: nTheoph },
              { smi: THEOBR, name: t('3,7-dimetilksantinas', '3,7-dimethylxanthine'), caption: nTheobr }
            ],
            caption: t('Arbatoje yra iki 5 % kofeino ir nedidelis kiekis labai panašių purino alkaloidų.', 'Tea contains up to 5 % caffeine and small amounts of very similar purine alkaloids.'),
            src: 'LW3 p4',
            claims: [{ formula: [CAFF, 'C8H10N4O2'] }, { formula: [THEOPH, 'C7H8N4O2'] }, { formula: [THEOBR, 'C7H8N4O2'] }, { aromatic: [CAFF, true] }]
          },
          {
            p: t('Kofeino molekulėje trys $N-CH3$ grupės ir dvi karbonilo grupės; jis neturi $N-H$ ryšio, todėl yra mažiau polinis nei teofilinas ar teobrominas. Be to, tai labai silpna bazė, todėl neutralioje ir šarminėje terpėje išlieka neutrali molekulė, kurią lengvai ištraukia chloroformas.',
              'The caffeine molecule has three $N-CH3$ groups and two carbonyl groups; it has no $N-H$ bond, so it is less polar than theophylline or theobromine. It is also a very weak base, so in neutral and basic medium it stays a neutral molecule that chloroform extracts readily.')
          },
          { h: t('Kam beriama soda', 'What the soda is for') },
          {
            p: t('Arbatos lapeliuose yra rūgščių savybių polifenolių (taninų), kurie dalyvautų ekstrakcijoje ir nuspalvintų ekstraktą. Natrio karbonatas juos paverčia vandenyje tirpiomis natrio druskomis, todėl jos lieka vandeninėje fazėje. Be to, šarminė terpė suardo kofeino ir taninų kompleksus.',
              'Tea leaves contain acidic polyphenols (tannins) that would take part in the extraction and colour the extract. Sodium carbonate turns them into water-soluble sodium salts, so they stay in the aqueous phase. The alkaline medium also breaks up caffeine–tannin complexes.'),
            src: 'LW3 p4'
          },
          {
            scheme: { items: [{ smi: GALLIC, name: t('3,4,5-trihidroksibenzenkarboksirūgštis', '3,4,5-trihydroxybenzoic acid') }, { plus: true }, { smi: '[Na+].[Na+].[O-]C([O-])=O' }, { arrow: '→' }, { smi: GALLATE + '.[Na+]' }, { plus: true }, { smi: '[Na+].OC([O-])=O' }] },
            caption: t('Pavyzdys: galo rūgštis (hidrolizuojamų taninų struktūrinis vienetas) virsta natrio galatu; kofeinas šioje terpėje nesikeičia.', 'Example: gallic acid (building unit of hydrolysable tannins) becomes sodium gallate; caffeine is unchanged in this medium.'),
            src: 'LW3 p4',
            claims: [{ formula: [GALLIC, 'C7H6O5'] }]
          },
          {
            rule: t('Soda pašalina rūgštines priemaišas į vandeninę fazę, o kofeinas, kaip neutrali molekulė, pereina į chloroformą. Todėl ekstraktas gaunamas švaresnis.',
              'Soda removes acidic impurities into the aqueous phase, while caffeine, as a neutral molecule, moves into chloroform. The extract is therefore cleaner.')
          },
          { practice: 'l3.why' }
        ]
      },
      {
        id: 'extraction',
        title: t('Ekstrahavimas dalijamuoju piltuvu', 'Extraction with a separatory funnel'),
        blocks: [
          { h: t('Principas', 'Principle') },
          {
            p: t('Ekstrahuojant medžiaga pasiskirsto tarp dviejų nesimaišančių skysčių pagal tai, kur ji tirpsta geriau. Kai tirpalas pilamas į dalijamąjį piltuvą ir kratomas su tirpikliu, ji pereina į tirpiklį, jei tirpsta jame geriau nei vandenyje. Santykis tarp koncentracijų abiejuose sluoksniuose yra pasiskirstymo konstanta $K$: $K$ = c(ekstrahentas) / c(vanduo).',
              'In extraction a substance divides between two immiscible liquids according to where it dissolves better. When the solution is shaken with a solvent in a separatory funnel, the substance moves into the solvent if it dissolves better there than in water. The ratio of the concentrations in the two layers is the distribution constant $K$: $K$ = c(extractant) / c(water).'),
            src: 'LW3 p1'
          },
          {
            rule: t('Geras ekstrahentas nesimaišo su tirpalu, gerai tirpina norimą medžiagą ir lengvai pašalinamas (žemos virimo temperatūros). Ekstrahuoti geriau kelis kartus nedidelėmis porcijomis nei vieną kartą visu kiekiu.',
              'A good extractant does not mix with the solution, dissolves the wanted substance well and is easy to remove (low boiling point). It is better to extract several times with small portions than once with the whole volume.'),
            src: 'LW3 p1-2'
          },
          {
            table: {
              head: [t('Tirpiklis', 'Solvent'), t('Tankis, g/ml', 'Density, g/ml'), t('Sluoksnis lyginant su vandeniu', 'Layer compared with water')],
              rows: [
                [t('chloroformas', 'chloroform'), t('1,49', '1.49'), t('apatinis', 'lower')],
                [t('dichlormetanas', 'dichloromethane'), t('1,33', '1.33'), t('apatinis', 'lower')],
                [t('etilacetatas', 'ethyl acetate'), t('0,90', '0.90'), t('viršutinis', 'upper')],
                [t('dietileteris', 'diethyl ether'), t('0,71', '0.71'), t('viršutinis', 'upper')]
              ]
            },
            caption: t('Sluoksnių tvarką lemia tankis. Vanduo turi tankį 1,00 g/ml.', 'The order of layers is set by density. Water has a density of 1.00 g/ml.'),
            src: 'Klein'
          },
          { h: t('Kaip dirbama su piltuvu', 'How the funnel is used') },
          {
            list: [
              t('Piltuvas pripildomas ne daugiau kaip dviem trečdaliais; ekstrahento būna apie trečdalį tirpalo tūrio.', 'The funnel is filled to at most two thirds; the extractant is about a third of the solution volume.'),
              t('Uždarius kamštį, piltuvas apverčiamas ir kratomas; kas kelias sekundes atsukamas čiaupas, kad išeitų garų perteklius.', 'After the stopper goes on, the funnel is inverted and shaken; every few seconds the tap is opened to let out the excess vapour.'),
              t('Čiaupą atsukant piltuvo snapelis nukreipiamas aukštyn, nuo savęs ir kitų.', 'When venting, point the stem upwards, away from yourself and others.'),
              t('Piltuvas įtvirtinamas stove, kamštis nuimamas, ir atskirtas apatinis sluoksnis nuleidžiamas pro čiaupą.', 'The funnel is clamped in the stand, the stopper is taken off and the lower layer is run out through the tap.'),
              t('Pasiekus sluoksnių ribą čiaupas užsukamas; viršutinis sluoksnis išpilamas pro viršų, ne pro čiaupą.', 'At the boundary the tap is closed; the upper layer is poured out through the top, not through the tap.')
            ],
            src: 'LW3 p1'
          },
          {
            pitfall: t('Neišmeskite jokio sluoksnio, kol nesate tikri, kuris jų yra ekstraktas. Sluoksnį atpažinsite pagal tankį arba įlašinus lašelį vandens: jis susilieja su vandeniniu sluoksniu. Emulsiją šalina ramus laukimas, kelis lašus sočiojo $NaCl$ tirpalo, etanolio ar acetono, o geriausia – kratyti švelniai.',
              'Do not discard any layer until you are sure which one is the extract. Identify the layer by density, or add a drop of water: it joins the aqueous layer. An emulsion is broken by patient waiting, a few drops of saturated $NaCl$ solution, ethanol or acetone, and best avoided by shaking gently.'),
            src: 'LW3 p1-2'
          },
          {
            example: {
              q: [{ p: t('Vandeninėje fazėje (40 ml) yra kofeino; $K = 9$ (chloroformas : vanduo). Palyginkite ištrauktą dalį: ekstrahuojant 60 ml chloroformo iš karto ir trimis 20 ml porcijomis.', 'The aqueous phase (40 ml) contains caffeine; $K = 9$ (chloroform : water). Compare the fraction extracted: with 60 ml of chloroform at once and with three 20 ml portions.') }],
              steps: [
                [{ p: t('Po vieno ekstrahavimo vandenyje lieka $1 / (1 + K · V_o / V_w)$.', 'After one extraction the fraction left in water is $1 / (1 + K · V_o / V_w)$.') }],
                [{ p: t('Vienas kartas, 60 ml: $1 / (1 + 9 · 60 / 40) = 1 / 14{,}5 = 0{,}069$; ištraukta 93,1 %.', 'One portion of 60 ml: $1 / (1 + 9 · 60 / 40) = 1 / 14.5 = 0.069$; 93.1 % extracted.') }],
                [{ p: t('Trys kartai po 20 ml: lieka $(1 / 5{,}5)^3 = 0{,}006$; ištraukta 99,4 %.', 'Three portions of 20 ml: left $(1 / 5.5)^3 = 0.006$; 99.4 % extracted.') }],
                [{ p: t('Tas pats tirpiklio kiekis, bet porcijomis ištraukiama daugiau.', 'The same amount of solvent, but portions extract more.') }]
              ]
            }
          },
          { h: t('Džiovinimas ir tirpiklio pašalinimas', 'Drying and removing the solvent') },
          {
            p: t('Chloroformo ekstrakte lieka vandens. Jis pašalinamas bevandene natrio sulfato druska, kuri jungia vandenį kristalhidrato pavidalu: dedama po truputį, kol grūdeliai nebesilimpa ir laisvai juda. Po to tirpalas nupilamas nuo druskos, o chloroformas nugarinamas rotaciniu garintuvu; lieka kieta medžiaga.',
              'The chloroform extract still holds water. It is removed with anhydrous sodium sulfate, which binds water as a hydrate: it is added in small amounts until the grains no longer stick together and move freely. The solution is then poured off the salt and the chloroform is evaporated on a rotary evaporator; a solid remains.'),
            src: 'LW3 p2, p5'
          },
          { practice: 'l3.order' },
          { practice: 'l3.apparatus' }
        ]
      },
      {
        id: 'tlc',
        title: t('Plonasluoksnė chromatografija', 'Thin-layer chromatography'),
        blocks: [
          { h: t('Principas', 'Principle') },
          {
            p: t('Chromatografijoje junginiai pasiskirsto tarp nejudrios fazės (sorbento: silikagelio ar aliuminio oksido) ir judrios fazės (eliuento). Kuo stipriau junginys sąveikauja su sorbentu, tuo lėčiau jis juda. Silikagelis yra polinis, todėl polinės molekulės (turinčios $N-H$, $O-H$) juda lėčiau, o mažiau polinės greičiau.',
              'In chromatography compounds divide between a stationary phase (the sorbent: silica gel or aluminium oxide) and a mobile phase (the eluent). The more strongly a compound interacts with the sorbent, the more slowly it moves. Silica gel is polar, so polar molecules (with $N-H$, $O-H$) move more slowly and less polar ones faster.'),
            src: 'LW3 p2-3'
          },
          { h: t('Plokštelė žingsnis po žingsnio', 'The plate step by step') },
          {
            list: [
              t('Lengvu pieštuko brūkšniu pažymima starto linija maždaug pusės centimetro atstumu nuo apatinio krašto.', 'A start line is drawn with a light pencil stroke roughly half a centimetre from the bottom edge.'),
              t('Kapiliaru užlašinama maždaug 1 % tirpalo; dėmė turi būti ne didesnė kaip 3–5 mm. Jei tirpalas retas, lašinama kelis kartus, kaskart išdžiovinant.', 'About 1 % solution is applied with a capillary; the spot should be no more than 3–5 mm. If the solution is dilute, it is applied several times, drying in between.'),
              t('Plokštelė statoma į uždengtą indą, kuriame eliuento sluoksnis yra žemiau starto linijos. Eliuentas kyla ir neša junginius.', 'The plate stands in a covered chamber with the eluent level below the start line. The eluent rises and carries the compounds.'),
              t('Kai iki plokštelės viršaus lieka 5–10 mm, ji išimama, iškart pažymima fronto linija ir plokštelė išdžiovinama.', 'When 5–10 mm remain to the top of the plate, it is taken out, the front line is marked at once and the plate is dried.'),
              t('Dėmės stebimos ultravioletinėje šviesoje: sorbentas fluorescuoja, o UV šviesą sugeriantys junginiai matomi kaip tamsios (violetinės) dėmės.', 'The spots are viewed in ultraviolet light: the sorbent fluoresces and compounds that absorb UV light appear as dark (violet) spots.')
            ],
            ordered: true,
            src: 'LW3 p3'
          },
          {
            rule: t('$R_f = a / h$, kur $a$ yra atstumas nuo starto linijos iki dėmės centro, o $h$ – nuo starto linijos iki tirpiklio fronto. $R_f$ yra tarp 0 ir 1; jį galima lyginti tik tos pačios plokštelės ir to paties eliuento sąlygomis.',
              '$R_f = a / h$, where $a$ is the distance from the start line to the centre of the spot and $h$ the distance from the start line to the solvent front. $R_f$ lies between 0 and 1 and can only be compared under the same plate and eluent conditions.'),
            src: 'LW3 p3'
          },
          {
            p: t('Eliuentą sudaro chloroformas, etilacetatas ir metanolis tūrių santykiu $4 : 1 : 1$. Daugiau metanolio daro eliuentą polinesnį, tada visos dėmės pakyla aukščiau (didesni $R_f$).',
              'The eluent is made of chloroform, ethyl acetate and methanol in a volume ratio of $4 : 1 : 1$. More methanol makes the eluent more polar and all the spots rise higher (larger $R_f$).'),
            src: 'LW3 p5'
          },
          {
            example: {
              q: [{ p: t('Frontas nuėjo 6,0 cm, o ekstrakto dėmė – 3,3 cm. Ar tai gryna medžiaga, jei yra tik viena dėmė?', 'The front travelled 6.0 cm and the extract spot 3.3 cm. Is it a pure substance if there is only one spot?') }],
              steps: [
                [{ p: t('$R_f = 3{,}3 / 6{,}0 = 0{,}55$.', '$R_f = 3.3 / 6.0 = 0.55$.') }],
                [{ p: t('Viena dėmė rodo, kad šiomis sąlygomis priemaišų nematyti.', 'One spot shows that no impurity is seen under these conditions.') }],
                [{ p: t('Tačiau priemaiša gali turėti tokį pat $R_f$ arba nesugerti UV, todėl viena dėmė nėra absoliutus grynumo įrodymas.', 'An impurity may have the same $R_f$ or not absorb UV, so one spot is not absolute proof of purity.') }]
              ]
            }
          },
          {
            pitfall: t('Starto linija turi būti virš eliuento lygio, kitaip medžiaga ištirps indo skystyje, o ne kils plokštele. Nematuokite $a$ ir $h$ nuo plokštelės krašto: abu skaičiuojami nuo starto linijos.',
              'The start line must be above the eluent level, otherwise the sample dissolves in the liquid of the chamber instead of climbing the plate. Do not measure $a$ and $h$ from the edge of the plate: both are counted from the start line.')
          },
          { practice: 'l3.observe' },
          { practice: 'l3.prove' }
        ]
      },
      {
        id: 'procedure',
        title: t('Darbo eiga ir saugumas', 'Procedure and safety'),
        blocks: [
          { h: t('Eiga ir kiekvieno žingsnio paskirtis', 'Procedure and the purpose of each step') },
          {
            list: [
              t('Vandenyje užvirinamas natrio karbonatas, indas nukeliamas nuo viryklės, įmerkiami arbatos maišeliai, indas uždengiamas folija ir paliekamas apie 15 min.: karštame vandenyje kofeinas iš lapelių tirpsta gerai.', 'Sodium carbonate is boiled in water, the beaker is taken off the heat, the tea bags are immersed, the beaker is covered with foil and left for about 15 min: caffeine dissolves well from the leaves in hot water.'),
              t('Lapeliai pašalinami ir gerai nuspaudžiami (su pirštinėmis), kad į tirpalą pereitų visas kofeinas.', 'The leaves are removed and pressed well (with gloves) so that all the caffeine gets into the solution.'),
              t('Tirpalas atvėsinamas iki kambario temperatūros, nes karštas chloroformas virtų (virimo t. 61 °C) ir kiltų slėgis.', 'The solution is cooled to room temperature, because hot chloroform would boil (b.p. 61 °C) and build up pressure.'),
              t('Chloroformas naudojamas trimis 20 ml porcijomis; apatiniai sluoksniai renkami į vieną kolbą.', 'Chloroform is used in three portions of 20 ml; the lower layers are collected in one flask.'),
              t('Ekstraktas džiovinamas bevandeniu $Na2SO4$.', 'The extract is dried with anhydrous $Na2SO4$.'),
              t('Nedidelė dalis ekstrakto tikrinama plonasluoksne chromatografija, apskaičiuojamas $R_f$.', 'A small part of the extract is checked by thin-layer chromatography and $R_f$ is calculated.'),
              t('Ekstraktas nupilamas nuo sulfato ir nugarinamas rotaciniu garintuvu; likusi kieta medžiaga (kofeinas) pasveriama, skaičiuojamas kiekis arbatoje (mg ir %).', 'The extract is poured off the sulfate and evaporated on a rotary evaporator; the solid left (caffeine) is weighed and its content in the tea is calculated (mg and %).')
            ],
            ordered: true,
            src: 'LW3 p4-5'
          },
          { h: t('Ką stebime ir ką tai reiškia', 'What is observed and what it means') },
          {
            table: {
              head: [t('Stebėjimas', 'Observation'), t('Prasmė', 'Meaning')],
              rows: [
                [t('Du aiškūs sluoksniai, apatinis sunkesnis', 'Two clear layers, the lower one denser'), t('Apatinis yra chloroformas', 'The lower layer is chloroform')],
                [t('Drumzlinas tarpinis sluoksnis', 'A cloudy middle layer'), t('Emulsija: laukti, švelniai pakratyti', 'Emulsion: wait, swirl gently')],
                [t('Sulfato grūdeliai laisvai juda', 'Sulfate grains move freely'), t('Vandens beveik nebėra', 'Almost no water is left')],
                [t('Viena dėmė UV šviesoje', 'One spot in UV light'), t('Priemaišų nematyti', 'No impurity is seen')],
                [t('Kelios dėmės', 'Several spots'), t('Mišinys (teofilinas, teobrominas ar kitos medžiagos)', 'A mixture (theophylline, theobromine or other substances)')]
              ]
            },
            src: 'LW3 p2-5'
          },
          {
            rule: t('Kofeino kiekis arbatoje $= m(\\text{kofeino}) / m(\\text{arbatos}) · 100$ %. Išeiga $= m(\\text{gauta}) / m(\\text{tikėtina}) · 100$ %.',
              'Caffeine content of the tea $= m(\\text{caffeine}) / m(\\text{tea}) · 100$ %. Yield $= m(\\text{obtained}) / m(\\text{expected}) · 100$ %.'),
            src: 'LW3 p5'
          },
          {
            pitfall: t('Chloroformas lakus, kenksmingas ir įtariamas kancerogenu: dirbkite su pirštinėmis ir akiniais, geriausia traukos spintoje. Karštas tirpalas gali nudeginti. Kratydami piltuvą išleiskite garus, o chloroformo atliekas supilkite į skirtą halogenintų atliekų indą. Aparatūrą po darbo išplaukite ir padėkite į savo vietas.',
              'Chloroform is volatile, harmful and a suspected carcinogen: wear gloves and goggles, preferably work in a fume hood. The hot solution can burn. Vent the funnel while shaking and pour chloroform waste into the labelled halogenated waste container. Wash the apparatus after the work and put it back in its place.'),
            src: 'LW3 p4-5'
          },
          { practice: 'l3.calc' },
          { practice: 'l3.defence' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        list: [
          t('Kofeinas ($C8H10N4O2$, be $N-H$) iš arbatos ekstrahuojamas karštu vandeniu su $Na2CO3$, tada chloroformu.', 'Caffeine ($C8H10N4O2$, no $N-H$) is extracted from tea with hot water and $Na2CO3$, then into chloroform.'),
          t('Soda taninus paverčia vandenyje tirpiomis druskomis, o kofeinas lieka neutralus.', 'Soda turns tannins into water-soluble salts while caffeine stays neutral.'),
          t('Chloroformas tankesnis už vandenį ir yra apatinis sluoksnis; ekstrahuoti 3 × 20 ml geriau nei 1 × 60 ml.', 'Chloroform is denser than water and forms the lower layer; 3 × 20 ml extracts better than 1 × 60 ml.'),
          t('Piltuvą kratant išleisti garus; emulsija šalinama laukiant, sočiu $NaCl$ ar švelniai kratant.', 'Vent the funnel while shaking; break an emulsion by waiting, saturated $NaCl$ or gentle shaking.'),
          t('Džiovinti $Na2SO4$, kol grūdeliai laisvai juda; tirpiklį nugarinti rotaciniu garintuvu.', 'Dry with $Na2SO4$ until the grains move freely; remove the solvent on a rotary evaporator.'),
          t('$R_f = a / h$; eliuente chloroformo, etilacetato ir metanolio tūrių santykis $4 : 1 : 1$; UV šviesoje dėmės tamsios.', '$R_f = a / h$; the eluent has chloroform, ethyl acetate and methanol in a volume ratio of $4 : 1 : 1$; spots are dark in UV light.'),
          t('Viena dėmė: priemaišų nematyti; kelios dėmės: mišinys. Kofeino lyd. t. apie 236 °C.', 'One spot: no impurity seen; several spots: a mixture. Caffeine melts at about 236 °C.')
        ]
      }
    ],
    types: [
      // ------------------------------------------------------------------ order the steps
      {
        id: 'l3.order',
        title: t('Darbo žingsnių tvarka', 'Order of the steps'),
        mirrors: ['LW3.1', 'LW3.3', 'LW3.4', 'LW3.5', 'LW3.6', 'LW3.7'],
        bank: [
          {
            id: 'l3.order.1',
            q: Q('Kofeinas išskiriamas iš arbatos ir paruošiamas ekstrahavimui.', 'Caffeine is isolated from tea and prepared for extraction.'),
            steps: [ord(t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'), [
              ['užvirinti vandenyje $Na2CO3$ tirpalą ir nukelti nuo viryklės', 'boil the $Na2CO3$ solution and take it off the heat'],
              ['įmerkti arbatos maišelius į nuimtą nuo viryklės karštą tirpalą', 'immerse the tea bags in the hot solution'],
              ['uždengti ir palaikyti apie 15 min.', 'cover and leave for about 15 min'],
              ['nuspausti lapelius (su pirštinėmis)', 'press out the leaves (with gloves)'],
              ['atvėsinti tirpalą iki kambario temperatūros', 'cool the solution to room temperature'],
              ['perpilti per piltuvėlį į dalijamąjį piltuvą', 'pour it through a funnel into the separatory funnel']
            ], t('Chloroformas pilamas tik į atvėsintą tirpalą.', 'Chloroform is only added to a cooled solution.'),
              t('Pirmiausia ištirpinama soda ir ištraukiamas kofeinas karštu vandeniu, lapeliai nuspaudžiami, o tirpalas atvėsinamas prieš perpilant į dalijamąjį piltuvą.', 'First the soda is dissolved and caffeine is drawn out with hot water, the leaves are pressed, and the solution is cooled before it is poured into the separatory funnel.'))],
            why: t('Karštas tirpalas su chloroformu sukeltų virimą ir slėgį, todėl aušinama prieš ekstrahuojant.', 'A hot solution with chloroform would boil and build up pressure, so it is cooled before extraction.'),
            src: 'LW3 p4-5'
          },
          {
            id: 'l3.order.2',
            q: Q('Viena ekstrahavimo porcija dalijamajame piltuve.', 'One extraction portion in the separatory funnel.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['įpilti tirpalo ir chloroformo porciją, užkišti kamštį', 'add the solution and a portion of chloroform, put in the stopper'],
              ['apversti ir pakratyti, atsukant čiaupą garams išleisti', 'invert and shake, opening the tap to release vapour'],
              ['įtvirtinti piltuvą stove ir palaukti, kol susidarys sluoksniai', 'clamp the funnel in the stand and wait for the layers'],
              ['nuimti kamštį', 'take off the stopper'],
              ['apatinį sluoksnį nuleisti į kolbą', 'run the lower layer into the flask']
            ], t('Be kamščio nuėmimo skystis pro čiaupą netekėtų.', 'Without removing the stopper the liquid would not flow out through the tap.'),
              t('Pirma sumaišoma ir pakratoma, po to sluoksniams leidžiama atsiskirti, nuimamas kamštis, kad pateiktų oras, ir tik tada nuleidžiamas apatinis sluoksnis.', 'First the contents are mixed and shaken, then the layers settle, the stopper is taken off to let air in, and only then is the lower layer run out.'))],
            why: t('Nuėmus kamštį, slėgis išsilygina ir skystis teka tolygiai.', 'With the stopper off the pressure equalises and the liquid flows evenly.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.order.3',
            q: Q('Pakratius susidarė emulsija.', 'An emulsion has formed after shaking.'),
            steps: [ord(t('Išdėstykite veiksmus nuo švelniausio.', 'Put the actions in order, starting with the gentlest.'), [
              ['palikti piltuvą ilgam pastovėti', 'leave the funnel standing for a long time'],
              ['švelniai pasukioti piltuvą', 'swirl the funnel gently'],
              ['įlašinti kelis lašus sočiojo $NaCl$ tirpalo', 'add a few drops of saturated $NaCl$ solution'],
              ['jei vis dar neatsiskiria, filtruoti', 'if it still does not separate, filter']
            ], t('Pradėkite nuo to, kas nekeičia sistemos sudėties.', 'Start with what does not change the composition of the system.'),
              t('Laukimas nieko nekeičia ir dažniausiai pakanka; po to švelniai pasukiojama, tada keičiamas vandeninės fazės poliškumas druska, o filtravimas paskutinis.', 'Waiting changes nothing and is often enough; then swirling, then the polarity of the aqueous phase is changed with salt, and filtering is the last resort.'))],
            why: t('Druskos pridėjimas didina vandeninės fazės joninę jėgą ir padeda sluoksniams atsiskirti.', 'Adding salt raises the ionic strength of the aqueous phase and helps the layers separate.'),
            src: 'LW3 p1-2'
          },
          {
            id: 'l3.order.4',
            q: Q('Chloroformo ekstraktas turi būti išdžiovintas.', 'The chloroform extract has to be dried.'),
            steps: [ord(t('Išdėstykite džiovinimo veiksmus.', 'Put the drying actions in order.'), [
              ['įberti bevandenio $Na2SO4$ porciją', 'add a portion of anhydrous $Na2SO4$'],
              ['pakratyti kolbą', 'swirl the flask'],
              ['jei grūdeliai sulimpa, įberti dar', 'if the grains clump, add more'],
              ['kai grūdeliai laisvai juda, nupilti tirpalą nuo druskos', 'when the grains move freely, pour the solution off the salt']
            ], t('Paskutinis veiksmas atliekamas tik kai nebelieka vandens.', 'The last action is done only when no water is left.'),
              t('Sulfatas berimas po truputį ir maišomas, kol nebesusidaro gumulų – tai ženklas, kad vandens nebėra.', 'The sulfate is added little by little and swirled until no clumps form, which shows that no water remains.'))],
            why: t('Vandens liekanos užterštų kofeiną arba padidintų jo masę.', 'Residual water would contaminate the caffeine or raise its mass.'),
            src: 'LW3 p5'
          },
          {
            id: 'l3.order.5',
            q: Q('Plonasluoksnė chromatografija: plokštelės paruošimas ir išryškinimas.', 'Thin-layer chromatography: preparing and developing the plate.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['pieštuku pažymėti starto liniją', 'mark the start line with a pencil'],
              ['kapiliaru užlašinti mėginį ir išdžiovinti dėmę', 'apply the sample with a capillary and dry the spot'],
              ['įstatyti plokštelę į uždengtą indą su eliuentu', 'put the plate into a covered chamber with the eluent'],
              ['išimti, kai frontas netoli viršaus, ir pažymėti jį', 'take it out when the front is near the top and mark it'],
              ['apžiūrėti UV šviesoje ir apvesti dėmes', 'view it in UV light and outline the spots']
            ], t('Frontas pažymimas iškart išėmus, kol eliuentas nenugaravo.', 'The front is marked at once, before the eluent evaporates.'),
              t('Starto liniją pažymime prieš eliuuojant, o frontą – iškart išėmę plokštelę, kol eliuentas dar nenugaravo.', 'The start line is marked before developing, the front immediately after the plate is taken out, while the eluent has not yet evaporated.'))],
            why: t('Jei frontas nepažymėtas, išgaravus eliuentui $h$ nebeįmanoma išmatuoti.', 'If the front is not marked, $h$ cannot be measured once the eluent evaporates.'),
            src: 'LW3 p3'
          },
          {
            id: 'l3.order.6',
            q: Q('Kofeino kiekis nustatomas nugarinus ekstraktą.', 'The caffeine content is found by evaporating the extract.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['išdžiovintą ekstraktą nupilti į apvaliadugnę kolbą', 'pour the dried extract into a round-bottom flask'],
              ['nugarinti chloroformą rotaciniu garintuvu', 'evaporate the chloroform on a rotary evaporator'],
              ['metaline mentele išskrapštyti kietą medžiagą ant popierėlio', 'scrape the solid onto paper with a metal spatula'],
              ['pasverti medžiagą', 'weigh the substance'],
              ['apskaičiuoti kiekį arbatoje mg ir %', 'calculate the content in tea in mg and %']
            ], t('Svorį galima skaičiuoti tik kai tirpiklio nebėra.', 'A weight is only meaningful once the solvent is gone.'),
              t('Kolboje lieka tik kofeinas, kai tirpiklis pašalintas; jį iškrapštome, pasveriame ir tik tada skaičiuojame.', 'Only caffeine stays in the flask once the solvent is removed; it is scraped out, weighed and only then calculated.'))],
            why: t('Svoris be skaičiavimo nieko nereiškia: reikia palyginti su paimtu arbatos kiekiu.', 'A weight alone means nothing: it has to be compared with the amount of tea taken.'),
            src: 'LW3 p5'
          },
          {
            id: 'l3.order.7',
            q: Q('Reikia apskaičiuoti $R_f$ iš plokštelės.', 'The $R_f$ is to be worked out from the plate.'),
            steps: [ord(t('Išdėstykite skaičiavimo žingsnius.', 'Put the calculation steps in order.'), [
              ['išmatuoti atstumą nuo starto linijos iki fronto', 'measure the distance from the start line to the front'],
              ['išmatuoti atstumą nuo starto linijos iki dėmės centro', 'measure the distance from the start line to the centre of the spot'],
              ['dėmės atstumą padalyti iš fronto atstumo', 'divide the spot distance by the front distance']
            ], t('$R_f$ yra santykis.', '$R_f$ is a ratio.'),
              t('Abu atstumai matuojami nuo starto linijos; dalijama dėmės atstumas iš fronto.', 'Both distances are measured from the start line; the spot distance is divided by the front distance.'))],
            why: t('$R_f$ nepriklauso nuo plokštelės aukščio, todėl leidžia lyginti junginius.', '$R_f$ does not depend on the plate height, so it allows compounds to be compared.'),
            src: 'LW3 p3'
          },
          {
            id: 'l3.order.8',
            q: Q('Darbas baigtas, laikas tvarkyti vietą ir rašyti aprašą.', 'The work is done; time to tidy up and write up.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['chloroformo atliekas supilti į halogenintų atliekų indą', 'pour the chloroform waste into the halogenated waste container'],
              ['kruopščiai išplauti stiklo aparatūrą šiltu vandeniu', 'wash the glass apparatus thoroughly with warm water'],
              ['priemones sudėti į joms skirtas vietas', 'put the equipment back into its places'],
              ['sąsiuvinyje užrašyti rezultatus: formulę, mg ir %, $R_f$', 'write the results in the notebook: formula, mg and %, $R_f$'],
              ['parašyti išvadas', 'write the conclusions']
            ], t('Rezultatai rašomi po darbo, išvados – paskutinės.', 'Results are written after the work, conclusions last.'),
              t('Atliekos išpilamos į atskirus indus, aparatūra išplaunama ir sudedama; rezultatai užrašomi prieš išvadas.', 'Waste goes into separate containers, the apparatus is washed and put away; the results come before the conclusions.'))],
            why: t('Švari darbo vieta ir atskirtos atliekos saugo žmones ir aplinką.', 'A clean workplace and separated waste protect people and the environment.'),
            src: 'LW3 p5'
          }
        ]
      },
      // ------------------------------------------------------------------ why this step
      {
        id: 'l3.why',
        title: t('Kodėl taip daroma?', 'Why is this step done?'),
        mirrors: ['LW3.1', 'LW3.2', 'LW3.3', 'LW3.4'],
        bank: [
          {
            id: 'l3.why.1',
            q: Q('Į vandenį su arbata beriama natrio karbonato.', 'Sodium carbonate is added to the water with the tea.'),
            steps: [ch(t('Kodėl beriama soda?', 'Why is soda added?'), [
              ['rūgštinės polifenolių priemaišos virsta tirpiomis druskomis ir lieka vandenyje', 'acidic polyphenol impurities become soluble salts and stay in the water'],
              ['kofeinas virsta druska ir geriau tirpsta chloroforme', 'caffeine becomes a salt and dissolves better in chloroform'],
              ['soda sudaro su chloroformu nesimaišantį sluoksnį', 'soda forms a layer that does not mix with chloroform'],
              ['ji neutralizuoja chloroformą', 'it neutralises the chloroform']
            ], 0, t('Kas arbatoje yra rūgštingo?', 'What in tea is acidic?'),
              t('Taninai yra fenoliai ir rūgštys; bazinėje terpėje jie sudaro druskas ir lieka vandenyje. Kofeinas nėra rūgštis ir išlieka neutralus, todėl pereina į chloroformą.', 'Tannins are phenols and acids; in basic medium they form salts and stay in the water. Caffeine is not an acid and stays neutral, so it moves into chloroform.'))],
            why: t('Rūgštys-bazės chemija leidžia atskirti kofeiną nuo taninų: įkrautos dalelės lieka vandenyje, neutralios pereina į organinį tirpiklį.', 'Acid-base chemistry separates caffeine from tannins: charged particles stay in water, neutral ones move to the organic solvent.'),
            src: 'LW3 p4'
          },
          {
            id: 'l3.why.2',
            q: Q('Ekstrahuojama chloroformu. Chloroformo tankis 1,49 g/ml.', 'Chloroform is used for the extraction. The density of chloroform is 1.49 g/ml.'),
            steps: [ch(t('Kur bus chloroformo sluoksnis piltuve?', 'Where will the chloroform layer be in the funnel?'), [
              ['apačioje, nes chloroformas sunkesnis už vandenį', 'at the bottom, because chloroform is denser than water'],
              ['viršuje, nes organiniai tirpikliai lengvi', 'on top, because organic solvents are light'],
              ['abu sluoksniai susimaišo', 'the two layers mix'],
              ['priklauso nuo kratymo trukmės', 'it depends on how long you shake']
            ], 0, t('Palyginkite chloroformo ir vandens tankius.', 'Compare the densities of chloroform and water.'),
              t('Sluoksnį lemia tankis, o ne tai, kad tirpiklis organinis: 1,49 > 1,00, todėl chloroformas apačioje.', 'The layer is decided by density, not by the solvent being organic: 1.49 > 1.00, so chloroform is below.'))],
            why: t('Dietileteris ar etilacetatas būtų viršuje, o chloroformas ir dichlormetanas apačioje; tai svarbu žinoti prieš nuleidžiant sluoksnį.', 'Diethyl ether or ethyl acetate would be on top, chloroform and dichloromethane below; this must be known before draining a layer.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.why.3',
            q: Q('Kratant dalijamąjį piltuvą kas kelias sekundes atsukamas čiaupas.', 'While shaking the separatory funnel the tap is opened every few seconds.'),
            steps: [ch(t('Kodėl?', 'Why?'), [
              ['tirpiklio garai kelia slėgį, kurį reikia išleisti', 'solvent vapour raises the pressure, which has to be released'],
              ['kad į piltuvą patektų oro, o junginys oksiduotųsi', 'to let air in so that the compound is oxidised'],
              ['kad nutekėtų viršutinis sluoksnis', 'so that the upper layer drains off'],
              ['kad sumažėtų pasiskirstymo konstanta', 'so that the distribution constant decreases']
            ], 0, t('Chloroformas lakus.', 'Chloroform is volatile.'),
              t('Lakūs tirpiklio garai uždarame piltuve didina slėgį, todėl kamštis gali išlėkti, o skystis išsitaškyti.', 'Volatile vapours in a closed funnel raise the pressure, so the stopper could fly out and liquid splash.'))],
            why: t('Slėgio išleidimas – pagrindinė saugumo taisyklė dirbant su dalijamuoju piltuvu.', 'Releasing pressure is the main safety rule when working with a separatory funnel.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.why.4',
            q: Q('Ekstrahuojama tris kartus po 20 ml, o ne vieną kartą 60 ml chloroformo.', 'Extraction is done three times with 20 ml rather than once with 60 ml of chloroform.'),
            steps: [ch(t('Kodėl porcijomis?', 'Why in portions?'), [
              ['kiekviena nauja porcija ištraukia dalį likusios medžiagos, todėl iš viso ištraukiama daugiau', 'each new portion pulls out a share of what remains, so more is extracted in total'],
              ['mažos porcijos geriau tirpina kofeiną', 'small portions dissolve caffeine better'],
              ['taip sutaupoma laiko', 'it saves time'],
              ['nuo to priklauso sluoksnių tvarka', 'the order of layers depends on it']
            ], 0, t('Pagalvokite, kas lieka vandenyje po kiekvieno karto.', 'Think about what is left in the water after each time.'),
              t('Pasiskirstymas vyksta kaskart iš naujo su švaria tirpiklio porcija: vandenyje lieka vis mažesnė dalis.', 'The distribution takes place anew with a clean portion each time: a smaller and smaller share stays in the water.'))],
            why: t('Su tuo pačiu bendru tirpiklio kiekiu porcijomis ištraukiama daugiau nei vienu kartu.', 'With the same total amount of solvent, portions extract more than a single go.'),
            src: 'LW3 p2'
          },
          {
            id: 'l3.why.5',
            q: Q('Arbatos tirpalas prieš ekstrahavimą chloroformu atvėsinamas iki kambario temperatūros.', 'The tea solution is cooled to room temperature before extraction with chloroform.'),
            steps: [ch(t('Kodėl jis vėsinamas?', 'Why is it cooled?'), [
              ['chloroformas verda 61 °C, o karštame tirpale kiltų slėgis ir garuotų', 'chloroform boils at 61 °C and in a hot solution it would build up pressure and evaporate'],
              ['kad kofeinas iškristų iš vandens', 'so that caffeine crystallises from the water'],
              ['kad susidarytų emulsija', 'so that an emulsion forms'],
              ['kad sutirštėtų taninai', 'so that the tannins thicken']
            ], 0, t('Palyginkite chloroformo virimo temperatūrą su tirpalo.', 'Compare the boiling point of chloroform with the solution temperature.'),
              t('Kontaktuodamas su karštu tirpalu chloroformas užvirtų, dalis dingtų garais, o piltuve kiltų slėgis.', 'In contact with the hot solution chloroform would boil, part would be lost as vapour and the funnel would build up pressure.'))],
            why: t('Maža virimo temperatūra yra priežastis, dėl kurios chloroformas patogus pašalinti, bet reikalauja atsargumo.', 'A low boiling point makes chloroform easy to remove but calls for care.'),
            src: 'LW3 p4-5'
          },
          {
            id: 'l3.why.6',
            q: Q('Chloroformo tirpalas laikomas ant bevandenio natrio sulfato.', 'The chloroform solution is left standing over anhydrous sodium sulfate.'),
            steps: [ch(t('Ką daro sulfatas?', 'What does the sulfate do?'), [
              ['jungia ekstrakte ištirpusį vandenį ir kristalinės formos', 'it binds the water dissolved in the extract and turns crystalline'],
              ['reaguoja su kofeinu', 'it reacts with caffeine'],
              ['neutralizuoja chloroformą', 'it neutralises the chloroform'],
              ['išgarina chloroformą', 'it evaporates the chloroform']
            ], 0, t('Kuo ši druska skiriasi būdama bevandenė?', 'What is special about this salt being anhydrous?'),
              t('Bevandenė druska sudaro kristalhidratą su vandeniu ir taip paima jį iš tirpalo; kofeinas nesikeičia.', 'The anhydrous salt forms a hydrate with water and so takes it from the solution; caffeine is unchanged.'))],
            why: t('Vandens neturėtų likti, kitaip pasvertoje medžiagoje jo masė iškreiptų kofeino kiekį.', 'No water should remain, otherwise its mass would distort the caffeine amount weighed.'),
            src: 'LW3 p2, p5'
          },
          {
            id: 'l3.why.7',
            q: Q('Plokštelės starto linija pažymima pieštuku ir yra virš eliuento lygio.', 'The start line of the plate is drawn in pencil and lies above the eluent level.'),
            steps: [mu(t('Pažymėkite tinkamas priežastis.', 'Pick the valid reasons.'), [
              ['pieštuko grafitas netirpsta eliuente', 'pencil graphite does not dissolve in the eluent'],
              ['jei linija būtų žemiau eliuento, mėginys ištirptų eliuente', 'if the line were below the eluent, the sample would dissolve into the eluent'],
              ['pieštuku pažymėta linija pati duoda dėmę su $R_f$ = 1', 'a pencil line itself gives a spot with $R_f$ = 1'],
              ['kad plokštelė kiltų greičiau', 'so that the plate rises faster']
            ], [0, 1], t('Ar rašalas galėtų kilti kartu su eliuentu?', 'Could ink rise together with the eluent?'),
              t('Rašalas ištirptų ir pakiltų, sukeldamas papildomas dėmes; grafitas lieka vietoje. Mėginys turi kilti nuo linijos, o ne ištirpti indo skystyje.', 'Ink would dissolve and rise, causing extra spots; graphite stays put. The sample must climb from the line, not dissolve in the liquid of the chamber.'))],
            why: t('Dėmės turi pradėti kilti iš to paties taško ir tik nuo plokštelės paviršiaus.', 'The spots must start rising from a fixed point and only from the plate surface.'),
            src: 'LW3 p3'
          },
          {
            id: 'l3.why.8',
            q: Q('Plokštelė eliuojama uždengtame inde, kuriame yra eliuento garų.', 'The plate develops in a closed chamber that contains eluent vapour.'),
            steps: [ch(t('Kodėl indas uždengiamas?', 'Why is the chamber closed?'), [
              ['kad atmosfera prisisotintų garų ir eliuentas negaruotų nuo plokštelės, o frontas kiltų tolygiai', 'so that the atmosphere becomes saturated with vapour, the eluent does not evaporate from the plate and the front rises evenly'],
              ['kad kofeinas negaruotų', 'so that caffeine does not evaporate'],
              ['kad eliuentas kiltų greičiau', 'so that the eluent rises faster'],
              ['kad nereikėtų žymėti fronto', 'so that the front need not be marked']
            ], 0, t('Kas atsitiktų su lakiu eliuentu atvirame inde?', 'What would happen to a volatile eluent in an open vessel?'),
              t('Atviroje sistemoje eliuentas garuoja nuo plokštelės paviršiaus ir frontas pasviręs, todėl $R_f$ nėra atkartojamas.', 'In an open system the eluent evaporates from the plate surface and the front is uneven, so $R_f$ is not reproducible.'))],
            why: t('Prisotinta garų aplinka užtikrina vienodas sąlygas visoje plokštelėje ir atkartojamus $R_f$.', 'A vapour-saturated environment ensures uniform conditions across the plate and reproducible $R_f$.'),
            src: 'LW3 p3'
          }
        ]
      },
      // ------------------------------------------------------------------ what you would observe
      {
        id: 'l3.observe',
        title: t('Ką matysite?', 'What would you observe?'),
        mirrors: ['LW3.1', 'LW3.3', 'LW3.4', 'LW3.5', 'LW3.6'],
        bank: [
          {
            id: 'l3.observe.1',
            q: Q('Arbatos tirpalas ir chloroformas pakratyti ir paliktas stovėti dalijamajame piltuve.', 'Tea solution and chloroform have been shaken and left to stand in the separatory funnel.'),
            steps: [ch(t('Ką matote?', 'What do you see?'), [
              ['du sluoksniai: viršuje tamsus vandeninis, apačioje chloroformo ekstraktas', 'two layers: a dark aqueous one on top, the chloroform extract below'],
              ['vienas vienalytis sluoksnis', 'one uniform layer'],
              ['du sluoksniai: viršuje chloroformas, apačioje vanduo', 'two layers: chloroform on top, water below'],
              ['kristalai dugne', 'crystals at the bottom']
            ], 0, t('Kuris skystis tankesnis?', 'Which liquid is denser?'),
              t('Chloroformas nesimaišo su vandeniu ir yra tankesnis, todėl yra apačioje; vandeninis sluoksnis tamsiai rudas nuo taninų.', 'Chloroform does not mix with water and is denser, so it lies below; the aqueous layer is dark brown from tannins.'))],
            why: t('Du sluoksniai rodo, kad skysčiai nesimaišo; tankis nurodo, kuris iš jų apatinis.', 'Two layers show that the liquids do not mix; density tells which one is lower.'),
            src: 'LW3 p1, p4'
          },
          {
            id: 'l3.observe.2',
            q: Q('Po kratymo tarp sluoksnių liko pieno spalvos drumstas sluoksnis.', 'After shaking, a milky cloudy layer is left between the phases.'),
            steps: [ch(t('Kas tai?', 'What is it?'), [
              ['emulsija', 'an emulsion'],
              ['išsikristalinęs kofeinas', 'crystallised caffeine'],
              ['trečias tirpiklis', 'a third solvent'],
              ['natrio sulfatas', 'sodium sulfate']
            ], 0, t('Smulkūs vieno skysčio lašeliai kitame.', 'Fine droplets of one liquid in the other.'),
              t('Smulkūs skysčių lašeliai nesusilieja, nes pakratyta per smarkiai arba mišinyje yra paviršinio aktyvumo medžiagų (taninų). Kas padeda: palaukti, švelniai pasukioti, įlašinti sočiojo $NaCl$.', 'Fine droplets do not coalesce because shaking was too vigorous or surface-active substances (tannins) are present. Remedies: wait, swirl gently, add saturated $NaCl$.'))],
            why: t('Emulsija – laikinas darinys, o ne naujas junginys; ją suardžius ekstraktas atsiskiria.', 'An emulsion is a temporary state, not a new compound; once it breaks the extract separates.'),
            src: 'LW3 p1-2'
          },
          {
            id: 'l3.observe.3',
            q: Q('Piltuve nežinoma, kuris sluoksnis yra vandeninis. Per viršų įlašinamas lašas vandens.', 'In the funnel it is unknown which layer is the aqueous one. A drop of water is added through the top.'),
            steps: [ch(t('Ką matote, jei apatinis sluoksnis yra chloroformas?', 'What do you see if the lower layer is chloroform?'), [
              ['lašas susilieja su viršutiniu sluoksniu', 'the drop merges with the upper layer'],
              ['lašas nukrenta į apatinį sluoksnį ir susilieja su juo', 'the drop falls into the lower layer and merges with it'],
              ['lašas pasidaro rudas', 'the drop turns brown'],
              ['susidaro dujų burbuliukai', 'gas bubbles form']
            ], 0, t('Vanduo maišosi tik su vandeniu.', 'Water mixes only with water.'),
              t('Vanduo maišosi su vandenine faze, o chloroformas yra apačioje, todėl lašas lieka viršutiniame sluoksnyje.', 'Water mixes with the aqueous phase, and chloroform is below, so the drop stays in the upper layer.'))],
            why: t('Šis bandymas leidžia nepamesti ekstrakto, jei sluoksnių tvarka neaiški.', 'This test prevents losing the extract if the order of layers is unclear.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.observe.4',
            q: Q('Į chloroformo ekstraktą dedama bevandenio natrio sulfato.', 'Anhydrous sodium sulfate is added to the chloroform extract.'),
            steps: [ch(t('Kokie požymiai rodo, kad dar yra vandens?', 'Which sign shows that water is still present?'), [
              ['grūdeliai lipdosi į gumulus ir slysta prie sienelės', 'the grains stick into lumps and cling to the wall'],
              ['grūdeliai laisvai kaip smėlis juda', 'the grains move freely like sand'],
              ['ekstraktas pasidaro skaidresnis už chloroformą', 'the extract becomes clearer than chloroform'],
              ['sulfatas visai ištirpsta', 'the sulfate dissolves completely']
            ], 0, t('Sulfatas jungia vandenį.', 'Sulfate binds water.'),
              t('Hidratuotos druskos dalelės limpa, o sausos laisvai juda. Gumulai rodo, kad reikia dar sulfato.', 'Hydrated salt particles stick, dry ones move freely. Lumps show that more sulfate is needed.'))],
            why: t('Džiovinimo pabaigą nusako grūdelių elgesys, o ne laikas.', 'The end of drying is shown by how the grains behave, not by time.'),
            src: 'LW3 p2, p5'
          },
          {
            id: 'l3.observe.5',
            q: Q('Plokštelė su ekstraktu apžiūrima UV lempos šviesoje.', 'The plate with the extract is viewed under a UV lamp.'),
            steps: [ch(t('Kaip matomas kofeinas?', 'How does caffeine show?'), [
              ['kaip tamsi (violetinė) dėmė fluorescuojančiame fone', 'as a dark (violet) spot on the fluorescent background'],
              ['kaip švytinti žalia dėmė tamsiame fone', 'as a glowing green spot on a dark background'],
              ['visai nematomas', 'not visible at all'],
              ['kaip dėmė, kurią reikia išryškinti rūgštimi', 'as a spot that has to be developed with acid']
            ], 0, t('Sorbentas fluorescuoja, o kofeinas sugeria UV.', 'The sorbent fluoresces and caffeine absorbs UV.'),
              t('Kofeino aromatinė sistema sugeria UV šviesą, todėl toje vietoje sorbento fluorescencija užgesinama.', 'The aromatic system of caffeine absorbs UV light, so the fluorescence of the sorbent is quenched at that spot.'))],
            why: t('UV lempa leidžia matyti bespalves medžiagas, kurios sugeria UV.', 'A UV lamp lets you see colourless substances that absorb UV.'),
            src: 'LW3 p3'
          },
          {
            id: 'l3.observe.6',
            q: Q('Ekstrakto dėmė plokštelėje ištįsusi į ilgą juostą, o ne apvali.', 'The extract spot on the plate is smeared into a long streak instead of being round.'),
            steps: [ch(t('Kokia tikriausia priežastis?', 'What is the most likely cause?'), [
              ['užlašinta per daug arba per tirštas mėginys', 'too much or too concentrated a sample was applied'],
              ['eliuentas buvo per šaltas', 'the eluent was too cold'],
              ['kofeinas yra per lengvas', 'caffeine is too light'],
              ['plokštelė pasukta UV lempos pusėn', 'the plate was turned towards the UV lamp']
            ], 0, t('Kokio dydžio dėmė turi būti starte?', 'How big should the spot be at the start?'),
              t('Perkrovus sorbentą, medžiaga neišsiskiria tolygiai ir dėmė driekiasi. Reikia mažesnio lašo arba praskiesto tirpalo.', 'An overloaded sorbent does not separate the compound evenly and the spot trails. A smaller drop or a more dilute solution is needed.'))],
            why: t('Dėmė starte turi būti maža (3–5 mm), kad dėmės būtų aiškios ir atskirtos.', 'The start spot must be small (3–5 mm) so that the spots are clear and separated.'),
            src: 'LW3 p3'
          },
          {
            id: 'l3.observe.7',
            q: Q('Nugarinus chloroformą kolboje liko kieta medžiaga.', 'After the chloroform was evaporated a solid was left in the flask.'),
            steps: [ch(t('Ką tikitės matyti?', 'What do you expect to see?'), [
              ['baltą ar blyškiai gelsvą kristalinę medžiagą: neišgrynintą kofeiną', 'a white or pale yellowish crystalline solid: crude caffeine'],
              ['skaidrų bespalvį skystį', 'a clear colourless liquid'],
              ['juodą dervą', 'a black tar'],
              ['dujų burbulus', 'gas bubbles']
            ], 0, t('Chloroformas išgaravo; kas liko?', 'The chloroform has evaporated; what is left?'),
              t('Kofeinas yra kieta kristalinė medžiaga (lyd. t. apie 236 °C), todėl jis ir lieka kolboje. Geltonas atspalvis rodo nedidelį priemaišų kiekį.', 'Caffeine is a solid crystalline substance (m.p. about 236 °C), so it is what remains. A yellow tint points to a few impurities.'))],
            why: t('Tirpiklis lakus, o kofeinas ne, todėl garinant lieka jis.', 'The solvent is volatile and caffeine is not, so evaporation leaves caffeine behind.'),
            src: 'LW3 p5'
          },
          {
            id: 'l3.observe.8',
            q: Q('Eliuentas pakilo iki viršaus, o visos dėmės susibūrė prie fronto.', 'The eluent has reached the top, and all spots crowded near the front.'),
            steps: [ch(t('Ką sakytumėte apie eliuentą?', 'What would you say about the eluent?'), [
              ['jis per polinis, dėmės juda per greitai', 'it is too polar and the spots travel too fast'],
              ['jis per mažai polinis', 'it is not polar enough'],
              ['plokštelė per trumpa', 'the plate is too short'],
              ['dėmės yra to paties junginio', 'the spots belong to the same compound']
            ], 0, t('Didelis $R_f$ reiškia silpną sąveiką su sorbentu.', 'A large $R_f$ means weak interaction with the sorbent.'),
              t('Kai $R_f$ artimi 1, junginiai beveik nesilaiko sorbento: eliuentas per polinis, o reikia mažiau metanolio.', 'When $R_f$ values are near 1 the compounds hardly stick to the sorbent: the eluent is too polar and needs less methanol.'))],
            why: t('Eliuento poliškumas keičia visų dėmių vietą; geras $R_f$ yra maždaug 0,3–0,7.', 'Eluent polarity shifts the position of all spots; a good $R_f$ is roughly 0.3–0.7.'),
            src: 'LW3 p3, p5'
          }
        ]
      },
      // ------------------------------------------------------------------ which observation proves what
      {
        id: 'l3.prove',
        title: t('Ką įrodo stebėjimas?', 'What does the observation prove?'),
        mirrors: ['LW3.1', 'LW3.3', 'LW3.5', 'LW3.6'],
        bank: [
          {
            id: 'l3.prove.1',
            q: Q('Ekstrakto plokštelėje UV šviesoje matoma viena dėmė, $R_f$ = 0,55.', 'The extract plate shows one spot in UV light, $R_f$ = 0.55.'),
            steps: [ch(t('Ką tai rodo?', 'What does it show?'), [
              ['šiomis sąlygomis priemaišų nematyti, bet identiteto tai neįrodo', 'no impurity is seen under these conditions, but identity is not proved'],
              ['ekstraktas visiškai grynas', 'the extract is completely pure'],
              ['tai tikrai kofeinas', 'it is certainly caffeine'],
              ['ekstrakte yra du junginiai', 'the extract holds two compounds']
            ], 0, t('Ar kita medžiaga negalėtų turėti to paties $R_f$?', 'Could another substance have the same $R_f$?'),
              t('Viena dėmė viename eliuente rodo tik tai, kad priemaišos nepastebėtos. Identitetui reikia standarto ar kito metodo.', 'One spot in one eluent shows only that no impurity was noticed. Identity needs a standard or another method.'))],
            why: t('Atsargi išvada: „priemaišų nematyti“, o ne „gryna“.', 'A careful conclusion is "no impurity seen", not "pure".'),
            src: 'LW3 p3, p5'
          },
          {
            id: 'l3.prove.2',
            q: Q('Plokštelėje yra pagrindinė dėmė ir dar dvi silpnesnės, apačioje.', 'The plate shows a main spot and two weaker ones lower down.'),
            steps: [ch(t('Ką galima teigti?', 'What can be claimed?'), [
              ['ekstraktas yra mišinys; apatinės dėmės – polinesnės priemaišos (pvz., teofilinas, teobrominas)', 'the extract is a mixture; the lower spots are more polar impurities (e.g. theophylline, theobromine)'],
              ['kofeinas suskilo', 'caffeine decomposed'],
              ['plokštelė sugadinta', 'the plate is spoiled'],
              ['apatinės dėmės yra eliuentas', 'the lower spots are the eluent']
            ], 0, t('Žemesnis $R_f$ reiškia stipresnę sąveiką su polinių silikageliu.', 'A lower $R_f$ means stronger interaction with the polar silica gel.'),
              t('Teofilinas ir teobrominas turi $N-H$, todėl yra polinesni nei kofeinas ir silikagelyje juda lėčiau.', 'Theophylline and theobromine have an $N-H$, so they are more polar than caffeine and move more slowly on silica gel.'))],
            why: t('Kelios dėmės reiškia kelis junginius, kurie sąveikauja su sorbentu skirtingai.', 'Several spots mean several compounds that interact with the sorbent differently.'),
            src: 'LW3 p4-5'
          },
          {
            id: 'l3.prove.3',
            q: Q('Gauta medžiaga lydosi 232–234 °C. Kofeino lydymosi temperatūra apie 235–238 °C.', 'The substance obtained melts at 232–234 °C. The melting point of caffeine is about 235–238 °C.'),
            steps: [ch(t('Ką tai rodo?', 'What does it indicate?'), [
              ['medžiaga artima kofeinui, bet gali turėti nedidelį kiekį priemaišų', 'the substance is close to caffeine but may hold a little impurity'],
              ['tai ne kofeinas', 'it is not caffeine'],
              ['medžiaga visiškai gryna', 'the substance is perfectly pure'],
              ['medžiagoje daug vandens', 'the substance holds a lot of water']
            ], 0, t('Priemaišos mažina lydymosi temperatūrą.', 'Impurities lower the melting point.'),
              t('Mažas nuokrypis ir siaura riba rodo beveik gryną kofeiną; šiek tiek žemesnė riba leidžia įtarti nedidelį priemaišų kiekį.', 'A small deviation and a narrow range point to nearly pure caffeine; a slightly lower range suggests a small amount of impurity.'))],
            why: t('Lydymosi temperatūros depresija: priemaišos žemina ir praplečia lydymosi ribą.', 'Melting point depression: impurities lower and widen the melting range.'),
            src: 'Klein'
          },
          {
            id: 'l3.prove.4',
            q: Q('Kolboje po garinimo liko daug daugiau medžiagos, nei galėjo būti kofeino iš 4 g arbatos.', 'After evaporation far more substance remained in the flask than 4 g of tea could contain as caffeine.'),
            steps: [mu(t('Kokios galimos priežastys?', 'Which causes are possible?'), [
              ['neišgarintas chloroformas ar vandens liekanos', 'chloroform not fully evaporated or residual water'],
              ['pernelyg daug priemaišų (taninų) pateko į ekstraktą', 'too many impurities (tannins) got into the extract'],
              ['kofeinas virto kitu junginiu', 'caffeine turned into another compound'],
              ['soda sumažino kofeino masę', 'soda reduced the mass of caffeine']
            ], [0, 1], t('Kas dar gali sverti kartu su kofeinu?', 'What else could weigh together with caffeine?'),
              t('Pasvertoje liekanoje gali būti ne tik kofeinas: tirpiklio ar vandens likučiai, taninai ir kitos priemaišos didina masę. Kofeinas ir soda tarpusavyje nereaguoja.', 'The residue may hold more than caffeine: traces of solvent or water, tannins and other impurities add mass. Caffeine and soda do not react.'))],
            why: t('Per didelė masė paprastai rodo priemaišas, ne „daugiau kofeino“.', 'A mass that is too large usually signals impurities, not "more caffeine".'),
            src: 'LW3 p5'
          },
          {
            id: 'l3.prove.5',
            q: Q('Į dalijamąjį piltuvą įlašintas vandens lašas nukrito per viršutinį sluoksnį ir susiliejo su apatiniu.', 'A water drop added to the separatory funnel fell through the upper layer and merged with the lower one.'),
            steps: [ch(t('Ką tai įrodo?', 'What does that prove?'), [
              ['apatinis sluoksnis vandeninis, viršutinis – organinis', 'the lower layer is aqueous, the upper one organic'],
              ['apatinis sluoksnis yra chloroformas', 'the lower layer is chloroform'],
              ['susidarė emulsija', 'an emulsion formed'],
              ['kofeinas ištirpo vandenyje', 'caffeine dissolved in water']
            ], 0, t('Vandens lašas lieka kartu su vandeniu.', 'A water drop ends up with water.'),
              t('Lašas susilieja su vandenine faze, vadinasi, apatinis sluoksnis yra vandeninis. Tai gali būti, jei ekstrahentas lengvesnis už vandenį (pvz., eteris).', 'The drop merges with the aqueous phase, so the lower layer is aqueous. This happens when the extractant is lighter than water (e.g. ether).'))],
            why: t('Šis bandymas nepriklauso nuo tirpiklio spalvos ar tankio lentelių, todėl patikimas.', 'This test does not depend on solvent colour or density tables, so it is reliable.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.prove.6',
            q: Q('Džiovinant sulfatas visą laiką limpa į gumulus.', 'During drying the sulfate keeps clumping.'),
            steps: [ch(t('Ką tai reiškia?', 'What does it mean?'), [
              ['vandens dar yra, reikia daugiau sulfato', 'water is still present, more sulfate is needed'],
              ['ekstraktas jau sausas', 'the extract is already dry'],
              ['sulfatas suskilo', 'the sulfate has decomposed'],
              ['reikia pašildyti kolbą', 'the flask has to be warmed']
            ], 0, t('Kas prilipdo grūdelius?', 'What makes the grains stick?'),
              t('Gumulai yra vandenį pasiėmusi druska. Kol jų yra, vanduo neišnyko, todėl dedama daugiau sulfato.', 'Lumps are salt that has taken up water. While they appear the water has not run out, so more sulfate is added.'))],
            why: t('Sausumas nustatomas pagal grūdelių elgesį.', 'Dryness is judged by the behaviour of the grains.'),
            src: 'LW3 p2, p5'
          },
          {
            id: 'l3.prove.7',
            q: [{ p: t('Ant tos pačios plokštelės užlašinti ekstraktas ir kofeino standartas; abu pakilo iki tos pačios aukštumos.', 'Extract and a caffeine standard were spotted on the same plate; both rose to the same height.') }],
            steps: [ch(t('Ką galima teigti?', 'What can be claimed?'), [
              ['ekstrakto dėmė atitinka kofeiną (tas pats $R_f$), bet reikia dar kito metodo patvirtinti', 'the extract spot matches caffeine (same $R_f$), but a further method is needed to confirm'],
              ['ekstraktas tikrai gryna medžiaga', 'the extract is certainly pure'],
              ['ekstraktas yra teofilinas', 'the extract is theophylline'],
              ['jokių išvadų daryti negalima', 'no conclusion can be drawn']
            ], 0, t('Vienodas $R_f$ nėra absoliutus įrodymas.', 'An equal $R_f$ is not absolute proof.'),
              t('Sutampantis $R_f$ tame pačiame eliuente leidžia daryti išvadą, kad tai tikėtinai kofeinas; kitos medžiagos irgi gali turėti panašų $R_f$.', 'A matching $R_f$ in the same eluent supports caffeine as likely; other substances might share a similar $R_f$.'))],
            why: t('Standartas ant tos pačios plokštelės pašalina sąlygų skirtumus.', 'A standard on the same plate removes differences in conditions.'),
            src: 'LW3 p3'
          },
          {
            id: 'l3.prove.8',
            q: Q('Ekstrakto $R_f$ = 0,25, o kofeino standarto – 0,60 (ta pati plokštelė).', 'The extract has $R_f$ = 0.25 and the caffeine standard 0.60 (same plate).'),
            steps: [ch(t('Ką galima sakyti?', 'What can be said?'), [
              ['dėmė – ne kofeinas; tai polinesnis junginys, pvz., teobrominas', 'the spot is not caffeine; it is a more polar compound, e.g. theobromine'],
              ['dėmė yra kofeinas, tik plokštelė pasviro', 'the spot is caffeine, the plate was just tilted'],
              ['dėmės santykis rodo išeigą 25 %', 'the $R_f$ shows a yield of 25 %'],
              ['eliuentas buvo per polinis', 'the eluent was too polar']
            ], 0, t('Ta pati plokštelė – tos pačios sąlygos.', 'Same plate means same conditions.'),
              t('Skirtingi $R_f$ ant tos pačios plokštelės reiškia skirtingus junginius; mažesnis $R_f$ rodo stipresnę sąveiką su silikageliu, vadinasi, didesnį poliškumą.', 'Different $R_f$ values on the same plate mean different compounds; the lower $R_f$ shows stronger interaction with silica gel, hence higher polarity.'))],
            why: t('$R_f$ yra santykis, jis nesusijęs su išeiga.', '$R_f$ is a ratio and has nothing to do with the yield.'),
            src: 'LW3 p3'
          }
        ]
      },
      // ------------------------------------------------------------------ apparatus
      {
        id: 'l3.apparatus',
        title: t('Priemonės pagal aprašymą', 'Apparatus from its description'),
        mirrors: ['LW3.1', 'LW3.3', 'LW3.4', 'LW3.6'],
        bank: [
          { id: 'l3.apparatus.1', desc: ['kriaušės pavidalo stiklinis indas su čiaupu apačioje ir kamščiu viršuje, kuriame kratomi du nesimaišantys skysčiai', 'a pear-shaped glass vessel with a tap at the bottom and a stopper at the top, in which two immiscible liquids are shaken'], right: ['dalijamasis piltuvas', 'separatory funnel'], other: [['Biuchnerio piltuvas', 'Büchner funnel'], ['grįžtamasis kondensatorius', 'reflux condenser'], ['matavimo cilindras', 'measuring cylinder']], why: ['Čiaupas leidžia nuleisti apatinį sluoksnį.', 'The tap lets the lower layer be drained.'] },
          { id: 'l3.apparatus.2', desc: ['apvalus stiklinis indas su šlifuotu kakleliu, kuris jungiamas prie garintuvo ir kuriame lieka nugarinta medžiaga', 'a round glass vessel with a ground-glass neck that connects to the evaporator and in which the evaporated material remains'], right: ['apvaliadugnė šlifinė kolba', 'round-bottom flask with a ground joint'], other: [['Erlenmejerio kolba', 'Erlenmeyer flask'], ['stiklinė', 'beaker'], ['mėgintuvėlis', 'test tube']], why: ['Šlifas sandariai jungia kolbą prie garintuvo.', 'The ground joint seals the flask to the evaporator.'] },
          { id: 'l3.apparatus.3', desc: ['prietaisas, kuriame kolba sukasi šildomoje vonioje, o vakuumas greitai pašalina tirpiklį', 'a device in which a flask rotates over a heated bath and vacuum quickly removes the solvent'], right: ['rotacinis garintuvas', 'rotary evaporator'], other: [['magnetinė maišyklė', 'magnetic stirrer'], ['džiovinimo krosnelė', 'drying oven'], ['distiliavimo kolba', 'distillation flask']], why: ['Sukimas didina paviršių, o vakuumas žemina virimo temperatūrą.', 'Rotation increases the surface area and vacuum lowers the boiling point.'] },
          { id: 'l3.apparatus.4', desc: ['stiklinis indas su dangčiu, kuriame ant dugno pilamas eliuentas, o plokštelė statoma kiek pakreipta', 'a glass jar with a lid in which eluent is poured at the bottom and the plate is stood slightly inclined'], right: ['chromatografijos kamera', 'chromatography chamber'], other: [['eksikatorius', 'desiccator'], ['dalijamasis piltuvas', 'separatory funnel'], ['kristalizatorius', 'crystalliser dish']], why: ['Uždengta kamera prisotinama eliuento garų.', 'The closed chamber is saturated with eluent vapour.'] },
          { id: 'l3.apparatus.5', desc: ['labai plonas stiklinis vamzdelis, į kurį kapiliarine jėga įtraukiamas mėginys, kad jį būtų galima užlašinti ant plokštelės', 'a very thin glass tube that draws up a sample by capillary action so it can be spotted on the plate'], right: ['kapiliaras', 'capillary tube'], other: [['pipetė su guma', 'rubber-bulb pipette'], ['stiklinė lazdelė', 'glass rod'], ['biuretė', 'burette']], why: ['Kapiliaras užlašina labai mažą lašą.', 'The capillary delivers a very small drop.'] },
          { id: 'l3.apparatus.6', desc: ['prietaisas, kuris skleidžia nematomą šviesą ir leidžia matyti dėmes plokštelėje', 'a device that emits invisible light and lets you see the spots on the plate'], right: ['ultravioletinė lempa', 'ultraviolet lamp'], other: [['infraraudonųjų spindulių krosnelė', 'infrared heater'], ['stiklinis termometras', 'glass thermometer'], ['refraktometras', 'refractometer']], why: ['Sorbentas fluorescuoja UV šviesoje, o junginiai gesina fluorescenciją.', 'The sorbent fluoresces under UV light, and compounds quench the fluorescence.'] },
          { id: 'l3.apparatus.7', desc: ['plokščias metalinis įrankis, kuriuo iš kolbos išskrapštoma likusi kieta medžiaga', 'a flat metal tool used to scrape the remaining solid out of a flask'], right: ['metalinė mentelė', 'metal spatula'], other: [['stiklinė lazdelė', 'glass rod'], ['žnyplės', 'tongs'], ['laikiklis', 'clamp']], why: ['Mentelė patogi kietai medžiagai skrapštyti.', 'A spatula is handy for scraping solids.'] },
          { id: 'l3.apparatus.8', desc: ['kūgio formos kolba su siauru kakleliu, į kurią renkamas ekstraktas', 'a conical flask with a narrow neck into which the extract is collected'], right: ['Erlenmejerio kolba', 'Erlenmeyer flask'], other: [['apvaliadugnė šlifinė kolba', 'round-bottom flask with a ground joint'], ['mėgintuvėlis su atsaka', 'filter flask with a side arm'], ['matavimo kolba', 'volumetric flask']], why: ['Plokščias dugnas stabilus, kakleliui galima uždėti kamštį.', 'The flat bottom is stable and the neck can take a stopper.'] },
          { id: 'l3.apparatus.9', desc: ['platus seklus indas, į kurį pilamas vanduo su ledu, kad jame atvėstų arbatos tirpalas', 'a wide shallow vessel filled with water and ice in which the tea solution is cooled'], right: ['kristalizatorius (ledo vonia)', 'crystalliser dish (ice bath)'], other: [['garų vonia', 'steam bath'], ['džiovinimo krosnelė', 'drying oven'], ['eksikatorius', 'desiccator']], why: ['Plokščias indas gerai perduoda šilumą.', 'A flat vessel exchanges heat well.'] }
        ].map(a => ({
          id: a.id,
          q: [{ p: t('Aprašymas: ' + a.desc[0] + '.', 'Description: ' + a.desc[1] + '.') }],
          steps: [ch(t('Kokia tai priemonė?', 'Which piece of equipment is this?'),
            [a.right].concat(a.other).map(o => [o[0], o[1]]), 0,
            t('Kuo skiriasi aprašymas nuo kitų variantų paskirtimi?', 'How does the description differ from the others in purpose?'),
            t('Tai ' + a.right[0] + '. ' + a.why[0], 'It is the ' + a.right[1] + '. ' + a.why[1]))],
          why: t('Priemonė atpažįstama pagal tai, ką ji daro darbe, o ne tik pagal formą.', 'Equipment is recognised by what it does in the experiment, not only by its shape.'),
          src: 'LW3 p4'
        }))
      },
      // ------------------------------------------------------------------ calculations
      {
        id: 'l3.calc',
        title: t('Skaičiavimai: kiekis, išeiga, $R_f$, lydymasis', 'Calculations: content, yield, $R_f$, melting'),
        mirrors: ['LW3.1', 'LW3.3', 'LW3.5', 'LW3.6'],
        gen(rng, ctx) {
          const fmt = (x, d) => x.toFixed(d);
          const lt = (x, d) => fmt(x, d).replace('.', ',');
          const MC = 194.19;
          const variant = ctx.pick(['content', 'yield', 'rf', 'rfpos', 'mp', 'dist', 'mmol']);

          if (variant === 'content') {
            const tea = ctx.int(35, 45) / 10;
            const mg = ctx.int(40, Math.floor(tea * 45));
            const pct = mg / 1000 / tea * 100;
            return {
              q: [{ p: t('Ekstrahuota ' + lt(tea, 1) + ' g arbatos. Po garinimo gauta ' + mg + ' mg kofeino.', tea.toFixed(1) + ' g of tea was extracted. After evaporation ' + mg + ' mg of caffeine was obtained.') }],
              steps: [
                { prompt: t('Kiek tai gramų?', 'How many grams is that?'), kind: 'number', answer: { value: mg / 1000, tol: 0.001 },
                  hint: t('1 g = 1000 mg.', '1 g = 1000 mg.'),
                  solution: t(mg + ' mg = ' + lt(mg / 1000, 3) + ' g.', mg + ' mg = ' + fmt(mg / 1000, 3) + ' g.') },
                { prompt: t('Kiek procentų kofeino yra arbatoje?', 'What percentage of the tea is caffeine?'), kind: 'number', answer: { value: pct, tol: 0.06 },
                  hint: t('Kofeino masė dalijama iš arbatos masės.', 'Divide the caffeine mass by the tea mass.'),
                  solution: t('$' + lt(mg / 1000, 3) + ' / ' + lt(tea, 1) + ' · 100 = ' + lt(pct, 2) + '$ %.', '$' + fmt(mg / 1000, 3) + ' / ' + fmt(tea, 1) + ' · 100 = ' + fmt(pct, 2) + '$ %.') }
              ],
              why: t('Kiekis arbatoje yra išskirto kofeino masės ir arbatos masės santykis, išreikštas procentais.', 'The content of the tea is the ratio of the mass of caffeine isolated to the mass of tea, as a percentage.'),
              src: 'LW3 p5'
            };
          }

          if (variant === 'yield') {
            const tea = ctx.int(35, 45) / 10;
            const content = ctx.int(15, 45) / 10;
            const expected = tea * content / 100;
            const obtained = Math.round(expected * ctx.int(40, 90)) / 100;
            const y = obtained / Number(expected.toFixed(3)) * 100;
            return {
              q: [{ p: t('Etiketė nurodo, kad arbatoje yra ' + lt(content, 1) + ' % kofeino. Paimta ' + lt(tea, 1) + ' g arbatos, išskirta ' + lt(obtained, 3) + ' g kofeino.', 'The label says the tea holds ' + fmt(content, 1) + ' % caffeine. ' + fmt(tea, 1) + ' g of tea was taken and ' + fmt(obtained, 3) + ' g of caffeine was isolated.') }],
              steps: [
                { prompt: t('Kiek gramų kofeino turėjo būti arbatoje?', 'How many grams of caffeine should the tea contain?'), kind: 'number', answer: { value: expected, tol: 0.002 },
                  hint: t('Arbatos masė × kofeino dalis.', 'Mass of tea × caffeine fraction.'),
                  solution: t('$' + lt(tea, 1) + ' · ' + lt(content, 1) + ' / 100 = ' + lt(expected, 3) + '$ g.', '$' + fmt(tea, 1) + ' · ' + fmt(content, 1) + ' / 100 = ' + fmt(expected, 3) + '$ g.') },
                { prompt: t('Kokia išskyrimo išeiga (%)?', 'What is the yield of the isolation (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Gauta masė dalijama iš tikėtinos.', 'Divide the obtained mass by the expected one.'),
                  solution: t('$' + lt(obtained, 3) + ' / ' + lt(expected, 3) + ' · 100 = ' + lt(y, 1) + '$ %.', '$' + fmt(obtained, 3) + ' / ' + fmt(expected, 3) + ' · 100 = ' + fmt(y, 1) + '$ %.') }
              ],
              why: t('Išeiga lygina tai, ką išskyrėte, su tuo, ką teoriškai galima gauti. Ekstrahuojant dalis visada lieka vandenyje ir sorbente.', 'The yield compares what you isolated with what could theoretically be obtained. In extraction some always stays in the water and on the leaves.'),
              src: 'LW3 p5'
            };
          }

          if (variant === 'rf') {
            const front = ctx.int(45, 80);
            const s1 = ctx.int(10, 30), s2 = s1 + ctx.int(8, 20);
            return {
              q: [{ p: t('Plokštelėje frontas nuėjo ' + front + ' mm nuo starto linijos, pirmoji dėmė ' + s1 + ' mm, antroji ' + s2 + ' mm.', 'On the plate the front travelled ' + front + ' mm from the start line, the first spot ' + s1 + ' mm and the second ' + s2 + ' mm.') }],
              steps: [
                { prompt: t('Koks pirmosios dėmės $R_f$?', 'What is the $R_f$ of the first spot?'), kind: 'number', answer: { value: s1 / front, tol: 0.02 },
                  hint: t('Dėmės atstumas, padalytas iš fronto atstumo.', 'Spot distance divided by front distance.'),
                  solution: t('$R_f = ' + s1 + ' / ' + front + ' = ' + lt(s1 / front, 2) + '$.', '$R_f = ' + s1 + ' / ' + front + ' = ' + fmt(s1 / front, 2) + '$.') },
                { prompt: t('Koks antrosios dėmės $R_f$?', 'What is the $R_f$ of the second spot?'), kind: 'number', answer: { value: s2 / front, tol: 0.02 },
                  hint: t('Ta pati formulė.', 'The same formula.'),
                  solution: t('$R_f = ' + s2 + ' / ' + front + ' = ' + lt(s2 / front, 2) + '$.', '$R_f = ' + s2 + ' / ' + front + ' = ' + fmt(s2 / front, 2) + '$.') },
                ch(t('Kuri dėmė greičiausiai yra polinesnė medžiaga?', 'Which spot is more likely the more polar substance?'), [
                  ['pirmoji, nes ji mažiau pakilo', 'the first, because it rose less'],
                  ['antroji, nes ji pakilo aukščiau', 'the second, because it rose higher'],
                  ['abi vienodai', 'both equally'],
                  ['to negalima spręsti iš $R_f$', 'it cannot be decided from $R_f$']
                ], 0, t('Polinis silikagelis stipriau laiko polines molekules.', 'Polar silica gel holds polar molecules more strongly.'),
                  t('Mažesnis $R_f$ reiškia stipresnę sąveiką su polinių silikageliu, vadinasi, polinesnį junginį.', 'A smaller $R_f$ means stronger interaction with polar silica gel, hence a more polar compound.'))
              ],
              why: t('$R_f$ yra santykis, todėl nepriklauso nuo plokštelės ilgio ir leidžia lyginti junginius.', '$R_f$ is a ratio, so it does not depend on the plate length and lets compounds be compared.'),
              src: 'LW3 p3'
            };
          }

          if (variant === 'rfpos') {
            const front = ctx.int(45, 80);
            const rf = ctx.int(35, 75) / 100;
            const dist = rf * front;
            return {
              q: [{ p: t('Kofeino standarto $R_f$ yra ' + lt(rf, 2) + ' šiame eliuente. Frontas nuėjo ' + front + ' mm.', 'The caffeine standard has $R_f$ = ' + fmt(rf, 2) + ' in this eluent. The front travelled ' + front + ' mm.') }],
              steps: [
                { prompt: t('Kokiu atstumu (mm) nuo starto turi būti kofeino dėmė?', 'At what distance (mm) from the start should the caffeine spot be?'), kind: 'number', answer: { value: dist, tol: 0.8 },
                  hint: t('$R_f = a / h$; išreikškite $a$.', '$R_f = a / h$; solve for $a$.'),
                  solution: t('$a = R_f · h = ' + lt(rf, 2) + ' · ' + front + ' = ' + lt(dist, 1) + '$ mm.', '$a = R_f · h = ' + fmt(rf, 2) + ' · ' + front + ' = ' + fmt(dist, 1) + '$ mm.') }
              ],
              why: t('Žinant $R_f$ ir fronto kelią galima numatyti dėmės vietą.', 'Knowing $R_f$ and the front distance lets you predict the spot position.'),
              src: 'LW3 p3'
            };
          }

          if (variant === 'mp') {
            const pure = ctx.pick([true, false]);
            const lo = pure ? ctx.int(235, 236) : ctx.int(212, 228);
            const width = pure ? ctx.int(1, 2) : ctx.int(6, 12);
            const hi = lo + width;
            return {
              q: [{ p: t('Išskirto kofeino lydymosi riba išmatuota ' + lo + '–' + hi + ' °C. Literatūrinė riba apie 236–238 °C.', 'The melting range of the isolated caffeine was measured as ' + lo + '–' + hi + ' °C. The literature range is about 236–238 °C.') }],
              steps: [
                { prompt: t('Kokio pločio (°C) yra riba?', 'How wide (°C) is the range?'), kind: 'number', answer: { value: width, tol: 0.1 },
                  hint: t('Iš aukštesnės temperatūros atimkite žemesnę.', 'Subtract the lower temperature from the higher.'),
                  solution: t(hi + ' − ' + lo + ' = ' + width + ' °C.', hi + ' − ' + lo + ' = ' + width + ' °C.') },
                ch(t('Ką galima pasakyti apie grynumą?', 'What can be said about purity?'), [
                  ['pakankamai grynas', 'reasonably pure'],
                  ['nešvarus (turi priemaišų ar drėgmės)', 'impure (holds impurities or moisture)'],
                  ['tai ne organinė medžiaga', 'it is not an organic substance'],
                  ['nustatyti neįmanoma', 'it cannot be decided']
                ], pure ? 0 : 1, t('Palyginkite pločio ir žemiausios ribos nuokrypį.', 'Compare the width and the deviation of the lower end.'),
                  pure ? t('Siaura riba arti literatūrinės rodo gerą grynumą.', 'A narrow range close to the literature value indicates good purity.')
                    : t('Plati ir žema riba rodo priemaišų ar drėgmės.', 'A wide and low range indicates impurities or moisture.'))
              ],
              why: t('Priemaišos žemina ir praplečia lydymosi ribą (lydymosi temperatūros depresija).', 'Impurities lower and widen the melting range (melting point depression).'),
              src: 'Klein'
            };
          }

          if (variant === 'dist') {
            const K = ctx.pick([5, 6, 8, 9, 10, 12]);
            const Vw = ctx.pick([30, 40, 50, 60]);
            const p = ctx.pick([20, 30]);
            const pair = ctx.pick([[[1, 3 * p], [3, p]], [[3, p], [2, 1.5 * p]]]);
            const swap = ctx.pick([false, true]);
            const ways = swap ? [pair[1], pair[0]] : pair;
            const ext = w => (1 - Math.pow(1 / (1 + K * w[1] / Vw), w[0])) * 100;
            const e1 = ext(ways[0]), e2 = ext(ways[1]);
            const dl = w => w[0] === 1 ? w[1] + ' ml chloroformo vienu kartu' : w[0] + ' porcijomis po ' + w[1] + ' ml';
            const de = w => w[0] === 1 ? w[1] + ' ml of chloroform at once' : w[0] + ' portions of ' + w[1] + ' ml';
            const solL = (w, e) => w[0] === 1 ? 'Lieka $1 / (1 + ' + K + ' · ' + w[1] + ' / ' + Vw + ')$; ištraukta ' + lt(e, 1) + ' %.' : 'Lieka $(1 / (1 + ' + K + ' · ' + w[1] + ' / ' + Vw + '))^' + w[0] + '$; ištraukta ' + lt(e, 1) + ' %.';
            const solE = (w, e) => w[0] === 1 ? 'Left: $1 / (1 + ' + K + ' · ' + w[1] + ' / ' + Vw + ')$; extracted ' + fmt(e, 1) + ' %.' : 'Left: $(1 / (1 + ' + K + ' · ' + w[1] + ' / ' + Vw + '))^' + w[0] + '$; extracted ' + fmt(e, 1) + ' %.';
            const hintL = t('Vandenyje po kiekvienos porcijos lieka $1 / (1 + K · V_o / V_w)$.', 'After each portion the fraction left in water is $1 / (1 + K · V_o / V_w)$.');
            const best = ways[0][0] > ways[1][0] ? 0 : 1;
            return {
              q: [{ p: t('Vandeninėje fazėje (' + Vw + ' ml) yra kofeino; $K$ = ' + K + ' (chloroformas : vanduo). Ekstrahuojama tuo pačiu chloroformo kiekiu dviem būdais: pirmuoju – ' + dl(ways[0]) + ', antruoju – ' + dl(ways[1]) + '.', 'The aqueous phase (' + Vw + ' ml) contains caffeine; $K$ = ' + K + ' (chloroform : water). The same total amount of chloroform is used in two ways: the first way is ' + de(ways[0]) + ', the second ' + de(ways[1]) + '.') }],
              steps: [
                { prompt: t('Kiek procentų ištraukiama pirmuoju būdu?', 'What percentage is extracted the first way?'), kind: 'number', answer: { value: e1, tol: 0.6 },
                  hint: hintL,
                  solution: t(solL(ways[0], e1), solE(ways[0], e1)) },
                { prompt: t('Kiek procentų ištraukiama antruoju būdu?', 'What percentage is extracted the second way?'), kind: 'number', answer: { value: e2, tol: 0.6 },
                  hint: hintL,
                  solution: t(solL(ways[1], e2), solE(ways[1], e2)) },
                ch(t('Kuris būdas ištraukia daugiau?', 'Which way extracts more?'), [
                  ['pirmasis', 'the first'],
                  ['antrasis', 'the second'],
                  ['vienodai', 'both equal'],
                  ['priklauso nuo sluoksnių tvarkos', 'it depends on the order of the layers']
                ], best, t('Palyginkite savo du rezultatus.', 'Compare your two results.'),
                  t('Daugiau porcijų ištraukia daugiau, nes kiekviena nauja porcija pasiima dalį to, kas liko.', 'More portions extract more, because each new portion takes a share of what remains.'))
              ],
              why: t('Su tuo pačiu tirpiklio kiekiu kelios mažos porcijos ištraukia daugiau nei viena didelė.', 'With the same amount of solvent several small portions extract more than one big portion.'),
              src: 'LW3 p2'
            };
          }

          // mmol
          const mg = ctx.int(60, 200);
          const mmol = mg / MC;
          return {
            q: [{ p: t('Išskirta ' + mg + ' mg kofeino ($M$ = 194,19 g/mol).', mg + ' mg of caffeine was isolated ($M$ = 194.19 g/mol).') }],
            steps: [
              { prompt: t('Kiek tai mmol?', 'How many mmol is that?'), kind: 'number', answer: { value: mmol, tol: 0.02 },
                hint: t('$n = m / M$; mg padalyti iš g/mol duoda mmol.', '$n = m / M$; mg divided by g/mol gives mmol.'),
                solution: t('$n = ' + mg + ' / 194,19 = ' + lt(mmol, 3) + '$ mmol.', '$n = ' + mg + ' / 194.19 = ' + fmt(mmol, 3) + '$ mmol.') }
            ],
            why: t('Molių skaičius yra masė, padalyta iš molinės masės; mg ir g/mol duoda mmol.', 'The amount of substance is the mass divided by the molar mass; mg and g/mol give mmol.'),
            src: 'LW3 p5'
          };
        }
      },
      // ------------------------------------------------------------------ defence questions
      {
        id: 'l3.defence',
        title: t('Gynimo klausimai', 'Defence questions'),
        mirrors: ['LW3.1', 'LW3.2', 'LW3.3', 'LW3.4', 'LW3.5', 'LW3.6', 'LW3.7'],
        bank: [
          {
            id: 'l3.defence.1',
            q: [{ p: t('Pateikti trys panašūs arbatos alkaloidai.', 'Three similar tea alkaloids are shown.') }, { mol: [{ smi: CAFF }, { smi: THEOPH }, { smi: THEOBR }] }],
            steps: [{
              prompt: t('Sudėkite junginius ir apibūdinimus.', 'Pair each compound with its description.'),
              kind: 'match',
              answer: {
                left: [{ mol: { smi: CAFF } }, { mol: { smi: THEOPH } }, { mol: { smi: THEOBR } }],
                right: [{ text: t('trys $N-CH3$ grupės, $N-H$ nėra', 'three $N-CH3$ groups, no $N-H$') }, { text: t('dvi $N-CH3$ grupės, $N-H$ imidazolo žiede', 'two $N-CH3$ groups, $N-H$ in the imidazole ring') }, { text: t('dvi $N-CH3$ grupės, $N-H$ šešianariame žiede', 'two $N-CH3$ groups, $N-H$ in the six-membered ring') }],
                pairs: [0, 1, 2]
              },
              hint: t('Suskaičiuokite metilo grupes ir $N-H$.', 'Count the methyl groups and the $N-H$.'),
              solution: t('Kofeinas turi tris metilus, teofilinas – du ir $N-H$ penkianariame žiede, teobrominas – du ir $N-H$ šešianariame žiede.', 'Caffeine has three methyls, theophylline two and an $N-H$ in the five-membered ring, theobromine two and an $N-H$ in the six-membered ring.')
            }],
            why: t('Šie junginiai skiriasi tik metilo grupių skaičiumi ir vieta, todėl jų savybės panašios, bet $R_f$ šiek tiek skiriasi.', 'The compounds differ only in the number and place of methyl groups, so their properties are similar but their $R_f$ differs somewhat.'),
            src: 'LW3 p4',
            claims: [{ formula: [CAFF, 'C8H10N4O2'] }, { formula: [THEOPH, 'C7H8N4O2'] }, { formula: [THEOBR, 'C7H8N4O2'] }]
          },
          {
            id: 'l3.defence.2',
            q: [{ p: t('Kofeino formulė.', 'The formula of caffeine.') }, { mol: { smi: CAFF, opts: { numbers: 'all' } } }],
            steps: [{
              prompt: t('Bakstelėkite visas metilo grupes.', 'Tap all the methyl groups.'),
              kind: 'atoms', mol: { smi: CAFF, opts: { numbers: 'all' } }, answer: [0, 9, 13],
              hint: t('Metilas yra $sp^3$ anglis su trimis vandeniliais.', 'A methyl is an $sp^3$ carbon with three hydrogens.'),
              solution: t('Metilo grupės yra prie azoto: atomai Nr. 1, 10 ir 14.', 'The methyl groups sit on nitrogen: atoms no. 1, 10 and 14.')
            }, {
              prompt: t('Bakstelėkite karbonilo anglis.', 'Tap the carbonyl carbons.'),
              kind: 'atoms', mol: { smi: CAFF, opts: { numbers: 'all' } }, answer: [6, 10],
              hint: t('Ieškokite $C=O$.', 'Look for $C=O$.'),
              solution: t('Karbonilo anglys yra atomai Nr. 7 ir 11.', 'The carbonyl carbons are atoms no. 7 and 11.')
            }],
            why: t('Visi trys azoto atomai su pakaitais turi metilą, o $N-H$ neturi nė vienas, todėl kofeinas neturi vandenilio ryšio donoro ir yra mažiau polinis už teofiliną bei teobrominą.', 'All three substituted nitrogens carry a methyl group and none carries $N-H$, so caffeine has no hydrogen-bond donor and is less polar than theophylline and theobromine.'),
            src: 'LW3 p4'
          },
          {
            id: 'l3.defence.3',
            q: Q('Kas yra ekstrahavimas?', 'What is extraction?'),
            steps: [ch(t('Kuris apibrėžimas teisingas?', 'Which definition is correct?'), [
              ['medžiagos išskyrimas iš mišinio perkeliant ją į tirpiklį, kuriame ji tirpsta geriau ir kuris nesimaišo su pradiniu tirpikliu', 'isolation of a substance from a mixture by moving it into a solvent in which it dissolves better and which does not mix with the original solvent'],
              ['skysčių atskyrimas pagal virimo temperatūrą', 'separation of liquids by their boiling point'],
              ['kristalų gavimas iš tirpalo aušinant', 'getting crystals from a solution by cooling'],
              ['medžiagos nusodinimas cheminėmis reakcijomis', 'precipitating a substance by chemical reactions']
            ], 0, t('Ekstrahentas ir pradinis tirpiklis nesimaišo.', 'The extracting solvent and the original solvent do not mix.'),
              t('Ekstrahavimas remiasi skirtingu tirpumu dviejuose nesimaišančiuose skysčiuose; kitos paminėtos operacijos – distiliavimas, kristalinimas ir nusodinimas.', 'Extraction relies on different solubility in two immiscible liquids; the other options describe distillation, crystallisation and precipitation.'))],
            why: t('Ekstrahavimas yra pagrindinis ir paprasčiausias būdas išskirti medžiagą iš tirpalo ar augalinės žaliavos.', 'Extraction is a basic and simple way to isolate a substance from a solution or a plant material.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.defence.4',
            q: Q('Kokie reikalavimai keliami ekstrahentui?', 'What requirements must an extractant meet?'),
            steps: [mu(t('Pažymėkite visus teisingus.', 'Pick all that are right.'), [
              ['nesimaišo su pradiniu tirpikliu (vandeniu)', 'does not mix with the original solvent (water)'],
              ['gerai tirpina norimą medžiagą', 'dissolves the wanted substance well'],
              ['lengvai pašalinamas (žema virimo temperatūra)', 'is easy to remove (low boiling point)'],
              ['reaguoja su ekstrahuojama medžiaga', 'reacts with the substance being extracted']
            ], [0, 1, 2], t('Ar po ekstrahavimo medžiaga turi likti nepakitusi?', 'Should the substance remain unchanged after extraction?'),
              t('Ekstrahentas nesimaišo, gerai tirpina ir lengvai pašalinamas; reakcija su tiriama medžiaga nepageidaujama, nes tada išskirtume ne tą junginį.', 'The extractant does not mix, dissolves well and is easy to remove; reaction with the substance is unwanted, because we would then isolate a different compound.'))],
            why: t('Šie reikalavimai užtikrina, kad medžiaga išskiriama nepakitusi ir lengvai gaunama kieta.', 'These requirements ensure that the substance is isolated unchanged and is easy to obtain as a solid.'),
            src: 'LW3 p1'
          },
          {
            id: 'l3.defence.5',
            q: Q('Kas yra chromatografija ir kas yra eliuentas bei sorbentas?', 'What is chromatography, and what are eluent and sorbent?'),
            steps: [{
              prompt: t('Sudėkite sąvokas ir reikšmes.', 'Pair each term with its meaning.'),
              kind: 'match',
              answer: {
                left: [{ text: t('sorbentas', 'sorbent') }, { text: t('eliuentas', 'eluent') }, { text: t('eliuatas', 'eluate') }, { text: t('$R_f$', '$R_f$') }],
                right: [{ text: t('nejudri fazė, pvz., silikagelis', 'the stationary phase, e.g. silica gel') }, { text: t('judri fazė, tirpiklis', 'the mobile phase, the solvent') }, { text: t('eliuentas su ištirpusiomis medžiagomis (eliuatas)', 'the solution with dissolved compounds that comes out') }, { text: t('dėmės kelio ir fronto kelio santykis', 'the ratio of the spot distance to the front distance') }],
                pairs: [0, 1, 2, 3]
              },
              hint: t('Viena fazė nejuda, kita juda.', 'One phase stays, the other moves.'),
              solution: t('Sorbentas – nejudri, eliuentas – judri fazė, eliuatas – išeinantis tirpalas, $R_f$ – $a / h$.', 'The sorbent is stationary, the eluent mobile, the eluate the outgoing solution, and $R_f$ is $a / h$.')
            }],
            why: t('Chromatografijoje skirtingai sąveikaujantys junginiai juda skirtingu greičiu ir išsiskiria.', 'In chromatography compounds that interact differently move at different speeds and separate.'),
            src: 'LW3 p2'
          },
          {
            id: 'l3.defence.6',
            q: Q('Kofeinas ir silikagelis: kaip sorbento sąveika veikia $R_f$?', 'Caffeine and silica gel: which force sets the $R_f$?'),
            steps: [ch(t('Kuris teiginys teisingas?', 'Which statement is correct?'), [
              ['kuo stipresnė sąveika su sorbentu, tuo mažesnis $R_f$', 'the stronger the interaction with the sorbent, the smaller the $R_f$'],
              ['kuo stipresnė sąveika su sorbentu, tuo didesnis $R_f$', 'the stronger the interaction with the sorbent, the larger the $R_f$'],
              ['$R_f$ nepriklauso nuo sąveikos', '$R_f$ does not depend on interaction'],
              ['$R_f$ lygus išeigai', '$R_f$ equals the yield']
            ], 0, t('Kas juda greičiau, silpniau ar stipriau laikoma medžiaga?', 'Which moves faster: the weakly or the strongly held substance?'),
              t('Stipriau sorbento laikoma medžiaga daugiau laiko praleidžia nejudrioje fazėje, todėl nueina trumpesnį kelią ir turi mažesnį $R_f$.', 'A substance held strongly by the sorbent spends more time in the stationary phase, travels a shorter distance and has a smaller $R_f$.'))],
            why: t('$R_f$ iš esmės parodo, kaip junginys pasiskirsto tarp sorbento ir eliuento.', '$R_f$ essentially shows how a compound divides between sorbent and eluent.'),
            src: 'LW3 p2-3'
          },
          {
            id: 'l3.defence.7',
            q: Q('Darbui naudojamas chloroformas ir karštas tirpalas.', 'The experiment uses chloroform and a hot solution.'),
            steps: [mu(t('Kurios saugumo taisyklės tinka? Pažymėkite visas.', 'Which safety rules apply? Pick all.'), [
              ['dirbti su pirštinėmis ir akiniais, geriausia traukos spintoje', 'wear gloves and goggles, preferably work in a fume hood'],
              ['piltuvą kratant išleisti garus', 'release vapour while shaking the funnel'],
              ['chloroformo atliekas supilti į skirtą indą', 'pour chloroform waste into the labelled container'],
              ['karštą arbatos tirpalą iškart pilti į dalijamąjį piltuvą su chloroformu', 'pour the hot tea solution straight into the funnel with chloroform']
            ], [0, 1, 2], t('Kas nutiktų su chloroformu karštame tirpale?', 'What would happen to chloroform in a hot solution?'),
              t('Chloroformas lakus ir kenksmingas, todėl dirbama apsaugotai, garai išleidžiami, o atliekos surenkamos. Karšto tirpalo pilti negalima: chloroformas užvirtų.', 'Chloroform is volatile and harmful, so work is protected, vapour is released and waste is collected. The hot solution must not be poured in: chloroform would boil.'))],
            why: t('Saugumo taisyklės kyla iš medžiagų savybių: lakumo, toksiškumo ir žemos virimo temperatūros.', 'Safety rules follow from the properties of the substances: volatility, toxicity and low boiling point.'),
            src: 'LW3 p4-5'
          },
          {
            id: 'l3.defence.8',
            q: Q('Ką turi sudaryti darbo aprašas sąsiuvinyje?', 'What must the write-up in the notebook contain?'),
            steps: [mu(t('Pažymėkite, kas turi būti rezultatuose.', 'Pick what belongs in the results.'), [
              ['kofeino formulė', 'the formula of caffeine'],
              ['arbatos rūšis', 'the kind of tea'],
              ['išskirtas kofeino kiekis mg ir %', 'the amount of caffeine isolated in mg and %'],
              ['apskaičiuotas $R_f$', 'the calculated $R_f$']
            ], [0, 1, 2, 3], t('Ko reikia žmogui, kuris norėtų pakartoti darbą ir patikrinti išvadas?', 'What does a person need who wants to repeat the work and check the conclusions?'),
              t('Rezultatuose rašomi formulė, arbatos rūšis, išskirtas kiekis mg ir % bei $R_f$; išvadose – darbo eiga, kofeino grynumas, ko išmokote ir kokių sunkumų buvo.', 'The results hold the formula, the kind of tea, the amount isolated in mg and % and the $R_f$; the conclusions cover the procedure, the purity of the caffeine, what you learned and any difficulties.'))],
            why: t('Aprašas turi leisti kitam žmogui pakartoti darbą ir patikrinti išvadas.', 'The write-up must let another person repeat the work and check the conclusions.'),
            src: 'LW3 p5'
          }
        ]
      }
    ],
    coverage: {
      'LW3.1': ['l3.order', 'l3.why', 'l3.observe', 'l3.prove', 'l3.apparatus', 'l3.calc', 'l3.defence'],
      'LW3.2': ['l3.why', 'l3.defence'],
      'LW3.3': ['l3.order', 'l3.why', 'l3.observe', 'l3.prove', 'l3.apparatus', 'l3.calc', 'l3.defence'],
      'LW3.4': ['l3.order', 'l3.why', 'l3.observe', 'l3.apparatus', 'l3.defence'],
      'LW3.5': ['l3.order', 'l3.observe', 'l3.prove', 'l3.calc', 'l3.defence'],
      'LW3.6': ['l3.order', 'l3.observe', 'l3.prove', 'l3.apparatus', 'l3.calc', 'l3.defence'],
      'LW3.7': ['l3.order', 'l3.defence']
    }
  };

  ORG.unit(U);
})(globalThis.ORG = globalThis.ORG || {});
