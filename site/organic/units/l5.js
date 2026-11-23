// site/organic/units/l5.js: lab unit 5, isomerisation of maleic acid to fumaric acid
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

  const MALEIC = 'OC(=O)/C=C\\C(=O)O';
  const FUMARIC = 'OC(=O)/C=C/C(=O)O';
  const ANHYD = 'O=C1OC(=O)C=C1';
  const nMal = t('maleino rūgštis', 'maleic acid');
  const nFum = t('fumaro rūgštis', 'fumaric acid');

  const U = {
    id: 'l5',
    notes: [
      {
        id: 'aim',
        title: t('Tikslas ir principas', 'Aim and principle'),
        blocks: [
          { h: t('Ką šis darbas parodo', 'What this lab shows') },
          {
            p: t('Darbe gaunama maleino rūgštis iš jos anhidrido, o paskui ji izomerizuojama į fumaro rūgštį. Abi rūgštys turi tą pačią formulę $C4H4O4$ ir skiriasi tik dvigubojo ryšio geometrija, todėl jų fizinės savybės gerokai kitokios. Gynime reikia paaiškinti, kodėl ir kaip viena rūgštis virsta kita.',
              'In this lab maleic acid is prepared from its anhydride and then isomerised to fumaric acid. Both acids have the formula $C4H4O4$ and differ only in the geometry of the double bond, so their physical properties are very different. At the defence you must explain why and how one acid turns into the other.'),
            src: 'LW5 p1'
          },
          {
            scheme: { items: [{ smi: ANHYD, name: t('maleino rūgšties anhidridas', 'maleic anhydride') }, { arrow: '→', above: f('H2O') }, { smi: MALEIC }, { arrow: '→', above: f('HCl, t') }, { smi: FUMARIC }] },
            caption: t('Anhidridas hidrolizuojamas į Z-rūgštį, o ši rūgščioje terpėje kaitinant virsta E-rūgštimi.', 'The anhydride is hydrolysed to the Z acid, which turns into the E acid on heating in acid.'),
            src: 'LW5 p1',
            claims: [{ ez: [MALEIC, 3, 4, 'Z'] }, { ez: [FUMARIC, 3, 4, 'E'] }, { formula: [MALEIC, 'C4H4O4'] }, { formula: [FUMARIC, 'C4H4O4'] }, { formula: [ANHYD, 'C4H2O3'] }]
          },
          {
            mol: [{ smi: MALEIC, name: t('(Z)-2-buteno dirūgštis', '(Z)-but-2-enedioic acid'), caption: t('maleino rūgštis (cis)', 'maleic acid (cis)') },
              { smi: FUMARIC, name: t('(E)-2-buteno dirūgštis', '(E)-but-2-enedioic acid'), caption: t('fumaro rūgštis (trans)', 'fumaric acid (trans)') }]
          },
          {
            rule: t('Maleino rūgštis yra Z-izomeras (abi $COOH$ vienoje dvigubojo ryšio pusėje), fumaro rūgštis yra E-izomeras (priešingose pusėse). Tai ne konformerai: juos skiria $π$ ryšys, todėl be reakcijos jie nevirsta vienas kitu.',
              'Maleic acid is the Z isomer (both $COOH$ groups on the same side of the double bond), fumaric acid is the E isomer (opposite sides). They are not conformers: the $π$ bond separates them, so without a reaction they do not interconvert.'),
            src: 'LW5 p1'
          },
          { h: t('Mechanizmas', 'Mechanism') },
          {
            p: t('Rūgšties $H+$ prisijungia prie dvigubojo ryšio ir susidaro karbokatijonas. Dabar tarp anglies atomų yra tik $σ$ ryšys, todėl galima sukimasis aplink jį. Pasisukus ir atskilus $H+$, dvigubasis ryšys atsistato, bet jau kitoje konfigūracijoje, kurioje abi $COOH$ grupės toliau viena nuo kitos.',
              'The acid supplies $H+$, which adds to the double bond and gives a carbocation. Now only a $σ$ bond links the two carbons, so rotation around it is possible. After the turn the $H+$ is lost, the double bond re-forms in the other configuration, with the two $COOH$ groups far apart.')
          },
          {
            mech: [{
              scheme: { items: [{ smi: MALEIC }, { plus: true }, { smi: 'Cl', opts: { allH: true } }] },
              arrows: [{ from: { m: 0, b: [3, 4] }, to: { m: 1, a: 'H0' } }, { from: { m: 1, b: [0, 'H0'] }, to: { m: 1, a: 0 } }],
              note: t('1 stadija: $π$ ryšio elektronai sudaro $C-H$ ryšį.', 'Stage 1: the $π$ electrons form a $C-H$ bond.')
            }],
            src: 'LW5 p1'
          },
          {
            scheme: { items: [{ smi: 'OC(=O)[CH+]CC(=O)O' }, { arrow: '→', above: t('sukimasis ir −H+', 'rotation and −H+') }, { smi: FUMARIC }] },
            caption: t('2 stadija: pasisukus aplink $C-C$ ryšį, atskyla $H+$ ir susidaro stabilesnis E-izomeras.', 'Stage 2: after rotation about the $C-C$ bond, $H+$ is lost and the more stable E isomer forms.'),
            claims: [{ formula: ['OC(=O)[CH+]CC(=O)O', 'C4H5O4+'] }]
          },
          {
            pitfall: t('Neteiskite, kad $HCl$ „pasuka“ molekulę. $HCl$ tik katalizuoja: jis suteikia $H+$, kuris laikinai panaikina dvigubąjį ryšį, ir po reakcijos atsinaujina.',
              'Do not say that $HCl$ "turns" the molecule. $HCl$ only catalyses: it gives $H+$, which temporarily removes the double bond, and it is regenerated at the end.')
          },
          { practice: 'l5.defence' }
        ]
      },
      {
        id: 'method',
        title: t('Įranga ir darbo eiga', 'Apparatus and procedure'),
        blocks: [
          { h: t('Įranga', 'Apparatus') },
          {
            p: t('Reikia mažos stiklinėlės ir Erlenmejerio kolbos, elektrinės viryklės su magnetine maišykle, grįžtamojo kondensatoriaus ant kolbos, filtravimo įrangos (stiklinio piltuvėlio ir mėgintuvėlio su atsaka), stiklinio kamštelio kristalams nuspausti, ledo vonios, džiovinimo krosnelės (80 °C) ir spiritinio termometro lydymosi temperatūrai nustatyti.',
              'You need a small beaker and an Erlenmeyer flask, an electric hot plate with a magnetic stirrer, a reflux condenser for the flask, filtration equipment (a glass funnel and a flask with a side arm), a glass stopper for pressing crystals, an ice bath, a drying oven (80 °C) and a spirit thermometer for the melting point.'),
            src: 'LW5 p1'
          },
          { h: t('Eiga ir kiekvieno žingsnio paskirtis', 'Procedure and the purpose of each step') },
          {
            list: [
              t('Į mažą stiklinėlę įpilama apie 3,5 ml vandens ir jis pakaitinamas; indą nukėlus nuo kaitinimo, įberiama 0,02 mol (apie 2 g) anhidrido, kuris hidrolizuojasi į maleino rūgštį ir ištirpsta.', 'About 3.5 ml of water is heated in a small beaker; with the beaker off the heat, 2 g (0.02 mol) of anhydride are added, and it hydrolyses to maleic acid and dissolves.'),
              t('Tirpalas aušinamas ledo vonioje; pirmieji kristalai (maleino rūgštis) nufiltruojami ir nuspaudžiami kamšteliu, bet neplaunami vandeniu, nes labai gerai tirpsta.', 'The solution is cooled in ice; the first crystals (maleic acid) are filtered and pressed with the stopper, but not washed with water, because they are very soluble.'),
              t('Filtratas su likusia maleino rūgštimi perpilamas į kolbą, pridedama 2 ml konc. $HCl$ ir maišymo magnetas.', 'The filtrate with the remaining maleic acid goes into the flask; 2 ml conc. $HCl$ and a stirring bar are added.'),
              t('Užmaunamas grįžtamasis kondensatorius, vanduo jam tiekiamas iš apačios, kolbos turinys verdamas maišant 10 min.', 'The reflux condenser is fitted, water enters it from below, and the contents are boiled with stirring for 10 min.'),
              t('Kaitinimas nutraukiamas, kolba atvėsinama vandeniu su ledu, ir išsikristalina fumaro rūgštis.', 'Heating is stopped, the flask is chilled with ice water, and fumaric acid crystallises.'),
              t('Kristalai filtruojami, 3 × 10 ml šalto vandens plaunami (pirmiausia nuplaunama kolba), nuspaudžiami ir džiovinami 20 min. 80 °C temperatūroje.', 'The crystals are filtered, washed with 3 × 10 ml of cold water (the flask is rinsed first), pressed and dried for 20 min at 80 °C.'),
              t('Pasveriami abu produktai, apskaičiuojamos išeigos, nustatoma maleino rūgšties lydymosi temperatūra.', 'Both products are weighed, the yields calculated and the melting point of maleic acid measured.')
            ],
            ordered: true,
            src: 'LW5 p1-2'
          },
          { practice: 'l5.order' },
          { practice: 'l5.why' },
          { practice: 'l5.apparatus' }
        ]
      },
      {
        id: 'results',
        title: t('Stebėjimai, skaičiavimai ir saugumas', 'Observations, calculations and safety'),
        blocks: [
          { h: t('Kodėl fumaro rūgštis iškrenta', 'Why fumaric acid precipitates') },
          {
            p: t('Fumaro rūgštis simetriška ir joje susidaro tarpmolekuliniai vandenilio ryšiai, todėl kristalai tvirti (lyd. t. 299–300 °C, sublimuojasi), o tirpumas vandenyje mažas. Maleino rūgšties $COOH$ grupės arti viena kitos, jos sudaro vidumolekulinį vandenilio ryšį, o molekulė poliška, todėl rūgštis gerai tirpsta (lyd. t. 140–142 °C). Fumaro rūgščiai išsikristalinus, pusiausvyra pasislenka jos link.',
              'Fumaric acid is symmetrical and forms intermolecular hydrogen bonds, so its crystals are strong (m.p. 299–300 °C, it sublimes) and its solubility in water is low. In maleic acid the $COOH$ groups are close together and can form an intramolecular hydrogen bond, and the molecule is polar, so the acid dissolves well (m.p. 140–142 °C). When fumaric acid crystallises, the equilibrium is pulled towards it.'),
            src: 'LW5 p2'
          },
          {
            table: {
              head: [t('Savybė', 'Property'), nMal, nFum],
              rows: [
                [t('konfigūracija', 'configuration'), t('Z (cis)', 'Z (cis)'), t('E (trans)', 'E (trans)')],
                [t('lydymosi temperatūra', 'melting point'), t('140–142 °C', '140–142 °C'), t('299–300 °C (sublimuojasi)', '299–300 °C (sublimes)')],
                [t('tirpumas vandenyje', 'solubility in water'), t('labai geras', 'very good'), t('menkas, šaltame vandenyje dar mažesnis', 'poor, even lower in cold water')],
                [t('poliškumas', 'polarity'), t('poliška molekulė', 'polar molecule'), t('dipolių momentai susinaikina', 'dipoles cancel')]
              ]
            },
            src: 'LW5 p2'
          },
          { h: t('Ką stebime ir ką tai įrodo', 'What is observed and what it proves') },
          {
            list: [
              t('Maleino rūgšties tirpalas aušinamas ir iškrinta kristalų; jei nesikristalizuoja, stiklo lazdele brūkšnojama kolbos sienelė.', 'The maleic acid solution is cooled and crystals appear; if they do not, the wall is scratched with a glass rod.'),
              t('Verdant su $HCl$ pasirodo balti miltelių pavidalo kristalai: tai menkai tirpi fumaro rūgštis.', 'On boiling with $HCl$ white powdery crystals appear: this is the poorly soluble fumaric acid.'),
              t('Produktas nesilydo 140 °C, o tirpumas mažas: tai ne maleino rūgštis, o jos izomeras.', 'The product does not melt at 140 °C and its solubility is low: it is not maleic acid but its isomer.')
            ]
          },
          {
            rule: t('Išeiga $= m(\\text{gauta}) / m(\\text{teorinė}) · 100$ %. Maleino ir fumaro rūgščių molinė masė vienoda (116,07 g/mol), todėl izomerizuojant teorinė masė lygi pradinei maleino rūgšties masei.',
              'Yield $= m(\\text{obtained}) / m(\\text{theoretical}) · 100$ %. Maleic and fumaric acid have the same molar mass (116.07 g/mol), so in the isomerisation the theoretical mass equals the mass of maleic acid taken.'),
            src: 'LW5 p2'
          },
          {
            example: {
              q: [{ p: t('Paimta 2,00 g anhidrido ($M$ = 98,07 g/mol). Gauta 1,10 g maleino rūgšties ($M$ = 116,07 g/mol). Kokia išeiga?', '2.00 g of anhydride ($M$ = 98.07 g/mol) was taken and 1.10 g of maleic acid ($M$ = 116.07 g/mol) obtained. What is the yield?') }],
              steps: [
                [{ p: t('Anhidrido molių skaičius: $2,00 / 98,07 = 0,0204$ mol.', 'Moles of anhydride: $2.00 / 98.07 = 0.0204$ mol.') }],
                [{ p: t('Santykis 1 : 1, todėl teorinė masė $= 0,0204 · 116,07 = 2,37$ g.', 'The ratio is 1 : 1, so the theoretical mass $= 0.0204 · 116.07 = 2.37$ g.') }],
                [{ p: t('Išeiga $= 1,10 / 2,37 · 100 = 46$ %.', 'Yield $= 1.10 / 2.37 · 100 = 46$ %.') }]
              ]
            }
          },
          { h: t('Saugumas', 'Safety') },
          {
            pitfall: t('Konc. $HCl$ ėsdina ir garuoja: dirbkite su akiniais ir pirštinėmis, geriausia traukos spintoje. Verdant tirpalą grįžtamasis kondensatorius turi būti prijungtas, o kolbos negalima uždaryti kamščiu. Karšto tirpalo ir viryklės nelieskite plikomis rankomis. Aparatūrą (išskyrus termometrą) kruopščiai plaukite karštu vandeniu.',
              'Conc. $HCl$ is corrosive and fumes: wear goggles and gloves, preferably work in a fume hood. During boiling the reflux condenser must be connected and the flask must never be closed with a stopper. Do not touch the hot solution or hot plate with bare hands. Wash the apparatus (except the thermometer) thoroughly with hot water.'),
            src: 'LW5 p1-2'
          },
          { practice: 'l5.observe' },
          { practice: 'l5.prove' },
          { practice: 'l5.calc' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        list: [
          t('Anhidridas + $H2O$ → maleino rūgštis (Z); ji $HCl$ ir šilumos veikiama izomerizuojasi į fumaro rūgštį (E).', 'Anhydride + $H2O$ → maleic acid (Z); with $HCl$ and heat it isomerises to fumaric acid (E).'),
          t('Mechanizmas: $H+$ prisijungia prie $C=C$, sukimasis aplink $C-C$, $H+$ atskyla.', 'Mechanism: $H+$ adds to $C=C$, rotation about $C-C$, $H+$ is lost.'),
          t('Fumaro rūgštis iškrenta, nes menkai tirpsta; maleino rūgšties vandeniu neplaunama.', 'Fumaric acid precipitates because it is poorly soluble; maleic acid is not washed with water.'),
          t('Lydymosi temperatūros: maleino 140–142 °C, fumaro 299–300 °C (sublimuojasi).', 'Melting points: maleic 140–142 °C, fumaric 299–300 °C (sublimes).'),
          t('Išeiga = gauta masė / teorinė masė · 100 %; $M$(anhidrido) 98,07, $M$(rūgščių) 116,07 g/mol.', 'Yield = mass obtained / theoretical mass · 100 %; $M$(anhydride) 98.07, $M$(acids) 116.07 g/mol.')
        ]
      }
    ],
    types: [
      // ------------------------------------------------------------------ order the steps
      {
        id: 'l5.order',
        title: t('Darbo žingsnių tvarka', 'Order of the steps'),
        mirrors: ['LW5.1', 'LW5.2', 'LW5.3', 'LW5.4', 'LW5.5', 'LW5.7'],
        bank: [
          {
            id: 'l5.order.1',
            q: Q('Maleino rūgštis ruošiama iš anhidrido.', 'Maleic acid is prepared from the anhydride.'),
            steps: [ord(t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'), [
              ['pakaitinti nedidelį kiekį vandens stiklinėlėje', 'heat a small amount of water in a beaker'],
              ['nukelti stiklinėlę nuo viryklės', 'take the beaker off the hot plate'],
              ['suberti anhidridą', 'add the anhydride'],
              ['maišyti, kol medžiaga ištirps', 'stir until the solid dissolves']
            ], t('Pagalvokite, ką daryti prieš berdami anhidridą.', 'Think about what to do before the anhydride goes in.'),
              t('Vanduo pakaitinamas, kad anhidridas greitai hidrolizuotųsi ir ištirptų, tada stiklinėlė nukeliama nuo viryklės, nes reakcija egzoterminė, ir tik tada beriama anhidridas.', 'The water is heated so that the anhydride hydrolyses and dissolves quickly; the beaker is then taken off the plate because the reaction is exothermic, and only then is the anhydride added.'))],
            why: t('Veiksmų seka saugo nuo ištiškimo: anhidridas pilamas į jau pakaitintą, bet nebevirinamą vandenį.', 'The sequence prevents splashing: the anhydride goes into water that is already warm but no longer heated.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.order.2',
            q: Q('Reikia išskirti pirmąją maleino rūgšties kristalų porciją.', 'The first crop of maleic acid crystals has to be isolated.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['atšaldyti tirpalą ledo vonioje', 'cool the solution in an ice bath'],
              ['nufiltruoti kristalus', 'filter off the crystals'],
              ['nuspausti kristalus stikliniu kamšteliu', 'press the crystals with a glass stopper'],
              ['iškrapštyti kristalus ant popierėlio ir išdžiovinti', 'scrape the crystals onto paper and dry them'],
              ['filtratą perpilti į kolbą', 'pour the filtrate into the flask']
            ], t('Kristalus pirmiausia reikia gauti, o filtratas lieka tolesniam etapui.', 'The crystals must be obtained first; the filtrate is kept for the next stage.'),
              t('Pirmiausia kristalai iškristalinami šaltyje, nufiltruojami ir nuspaudžiami, išdžiovinami, o filtratas su likusia maleino rūgštimi naudojamas izomerizacijai.', 'The crystals are crystallised in the cold, filtered, pressed and dried; the filtrate with the remaining maleic acid is used for the isomerisation.'))],
            why: t('Maleino rūgštis gerai tirpsta, todėl dalis jos lieka filtrate, kuris naudojamas toliau.', 'Maleic acid dissolves well, so part of it stays in the filtrate, which is used further.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.order.3',
            q: Q('Filtratas bus verdamas su $HCl$ su grįžtamuoju kondensatoriumi.', 'The filtrate will be boiled with $HCl$ under a reflux condenser.'),
            steps: [ord(t('Išdėstykite aparatūros surinkimo tvarką.', 'Put the assembly of the apparatus in order.'), [
              ['į kolbą įpilti filtratą ir 2 ml konc. $HCl$, įmesti magnetą', 'put the filtrate and 2 ml conc. $HCl$ in the flask and add the stirring bar'],
              ['pritvirtinti kolbą prie stovo virš maišyklės', 'clamp the flask to the stand above the stirrer'],
              ['įstatyti grįžtamąjį kondensatorių', 'fit the reflux condenser'],
              ['prijungti vandens žarneles', 'connect the water hoses'],
              ['įjungti kaitinimą ir maišymą', 'switch on heating and stirring']
            ], t('Kaitinimas yra paskutinis, kai viskas jau uždaryta ir aušinama.', 'Heating comes last, when everything is in place and cooled.'),
              t('Pirma paruošiama kolba su reagentais, sumontuojamas kondensatorius ir jam tiekamas vanduo, ir tik tada kaitinama.', 'First the flask with reagents is prepared, the condenser is mounted and supplied with water, and only then is the mixture heated.'))],
            why: t('Kaitinti be veikiančio kondensatoriaus negalima: pasišalintų $HCl$ ir vandens garai.', 'You must not heat without a working condenser: $HCl$ and water vapour would escape.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.order.4',
            q: Q('Izomerizacija baigta, kolba su mišiniu dar karšta.', 'The isomerisation is finished and the flask with the mixture is still hot.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['išjungti kaitinimą ir maišymą', 'switch off the heating and stirring'],
              ['užsukti vandens čiaupą ir nuimti kondensatorių', 'turn off the water and remove the condenser'],
              ['kolbą aušinti vandens ir ledo vonioje', 'cool the flask in a water and ice bath'],
              ['kristalus nufiltruoti', 'filter off the crystals']
            ], t('Vandens kondensatoriui negalima nutraukti, kol viskas dar verda.', 'The condenser water must not be stopped while everything is still boiling.'),
              t('Pirmiausia nutraukiamas šildymas, po to nuimamas kondensatorius ir užsukamas vanduo; tik tada kolba aušinama, kad kuo daugiau fumaro rūgšties išsikristalintų.', 'Heating stops first, then the condenser is removed and the water turned off; only then is the flask cooled so that as much fumaric acid as possible crystallises.'))],
            why: t('Kuo šaltesnis tirpalas, tuo mažiau fumaro rūgšties jame lieka.', 'The colder the solution, the less fumaric acid stays in it.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.order.5',
            q: Q('Fumaro rūgšties kristalai jau yra filtre.', 'The fumaric acid crystals are already on the filter.'),
            steps: [ord(t('Išdėstykite plovimo ir džiovinimo veiksmus.', 'Put washing and drying in order.'), [
              ['šaltu vandeniu nuplauti kolbą', 'rinse the flask with cold water'],
              ['tą patį vandenį užpilti ant kristalų', 'pour that same water onto the crystals'],
              ['kristalus nuspausti stikliniu kamšteliu', 'press the crystals with the glass stopper'],
              ['iškrapštyti ant popierėlio ir džiovinti 80 °C', 'scrape onto paper and dry at 80 °C']
            ], t('Plovimo vanduo naudojamas du kartus, kad nebūtų prarasta kristalų.', 'The wash water does a double job, so no crystals are lost.'),
              t('Plovimo vandeniu pirmiausia nuplaunama kolba, nes joje liko kristalų, ir tas pats vanduo užpilamas ant filtro; po to kristalai nuspaudžiami ir džiovinami.', 'The wash water first rinses the flask, because crystals remain in it, and then goes onto the filter; the crystals are then pressed and dried.'))],
            why: t('Taip kristalai nuplaunami nuo $HCl$ ir maleino rūgšties likučių, o nuostoliai mažiausi.', 'This washes $HCl$ and maleic acid residues off the crystals with the smallest losses.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.order.6',
            q: Q('Rūgščioje terpėje Z-buten-2-diorūgštis virsta E-izomeru.', 'Acid-catalysed conversion of the Z isomer of but-2-enedioic acid into the E isomer.'),
            steps: [ord(t('Išdėstykite mechanizmo stadijas.', 'Put the stages of the mechanism in order.'), [
              ['$H+$ prisijungia prie $C=C$ ir susidaro karbokatijonas', '$H+$ adds to $C=C$ and a carbocation forms'],
              ['aplink $C-C$ ryšį pasisuka', 'rotation about the $C-C$ bond'],
              ['atskyla $H+$ ir susidaro dvigubasis ryšys', '$H+$ is lost and the double bond re-forms']
            ], t('Sukimasis galimas tik kai $π$ ryšio nebėra.', 'Rotation is possible only when the $π$ bond is gone.'),
              t('Kol dvigubasis ryšys yra, sukimasis neįmanomas. Protonavimas jį panaikina, tuomet molekulė pasisuka, o $H+$ atskilus ryšys atsistato.', 'While the double bond exists, rotation is impossible. Protonation removes it, the molecule then turns, and loss of $H+$ restores the bond.'))],
            why: t('Kad izomerizacija vyktų, $π$ ryšys turi laikinai išnykti; tai ir daro protonas.', 'For isomerisation the $π$ bond has to disappear temporarily; the proton does that.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.order.7',
            q: Q('Reikia apskaičiuoti fumaro rūgšties išeigą.', 'The yield of fumaric acid has to be calculated.'),
            steps: [ord(t('Išdėstykite skaičiavimo žingsnius.', 'Put the calculation steps in order.'), [
              ['apskaičiuoti pradinį molių skaičių $n = m / M$', 'calculate the starting amount $n = m / M$'],
              ['iš jo gauti teorinę masę', 'get the theoretical mass from it'],
              ['pasverti gautą produktą', 'weigh the product obtained'],
              ['gautą masę padalyti iš teorinės ir padauginti iš 100', 'divide the obtained mass by the theoretical one and multiply by 100']
            ], t('Išeiga reikalauja ir teorinės, ir realios masės.', 'A yield needs both the theoretical and the real mass.'),
              t('Pirma randama teorinė masė pagal santykį 1 : 1, po to lyginama su tikrąja mase.', 'First the theoretical mass is found by the 1 : 1 ratio, and then compared with the real mass.'))],
            why: t('Išeiga rodo, kokią dalį galimo produkto realiai gavote.', 'The yield shows what fraction of the possible product you actually obtained.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.order.8',
            q: Q('Darbo aprašas sąsiuvinyje.', 'The write-up in the lab notebook.'),
            steps: [ord(t('Išdėstykite aprašo dalis.', 'Put the parts of the write-up in order.'), [
              ['darbo pavadinimas', 'title of the experiment'],
              ['priemonės ir medžiagos', 'apparatus and materials'],
              ['darbo eiga', 'procedure'],
              ['rezultatai: išeigos ir lydymosi temperatūra', 'results: yields and melting point'],
              ['išvados', 'conclusions']
            ], t('Rezultatai ir išvados remiasi tuo, kas aprašyta anksčiau.', 'Results and conclusions rely on what was described before.'),
              t('Aprašas eina nuo tikslo iki išvadų, kurias remia gauti rezultatai.', 'The write-up goes from the aim to the conclusions, which are supported by the results.'))],
            why: t('Teisinga tvarka leidžia kitam žmogui pakartoti darbą ir patikrinti išvadas.', 'The right order lets another person repeat the work and check the conclusions.'),
            src: 'LW5 p2'
          }
        ]
      },
      // ------------------------------------------------------------------ why this step
      {
        id: 'l5.why',
        title: t('Kodėl taip daroma?', 'Why is this step done?'),
        mirrors: ['LW5.1', 'LW5.2', 'LW5.3', 'LW5.4', 'LW5.6'],
        bank: [
          {
            id: 'l5.why.1',
            q: Q('Anhidridas beriamas į pakaitintą vandenį, o stiklinėlė prieš tai nukeliama nuo viryklės.', 'The anhydride is added to warm water, and the beaker is first taken off the hot plate.'),
            steps: [ch(t('Kodėl nukeliama nuo viryklės?', 'Why is it taken off the plate?'), [
              ['hidrolizė egzoterminė ir smarkiai reaguoja su karštu vandeniu, galimas ištiškimas', 'the hydrolysis is exothermic and reacts violently with hot water, so spattering is possible'],
              ['kad anhidridas netirptų', 'so that the anhydride does not dissolve'],
              ['kad susidarytų fumaro rūgštis', 'so that fumaric acid forms'],
              ['kad vanduo greičiau atvėstų iki 0 °C', 'so that the water cools quickly to 0 °C']
            ], 0, t('Pagalvokite apie reakcijos šilumą.', 'Think about the heat of the reaction.'),
              t('Anhidrido hidrolizė išskiria šilumą, o virš viryklės ją lydėtų kaitimas; tada tirpalas gali ištikšti. Fumaro rūgštis dar nesusidaro, nes nėra katalizatoriaus.', 'Hydrolysis of the anhydride releases heat, and on the plate it would overheat and spatter. Fumaric acid does not yet form, because there is no catalyst.'))],
            why: t('Vandens nukleofilas atakuoja anhidrido karbonilo anglį ir atskelia $C-O$ ryšį; reakcija vyksta greitai ir su šiluma.', 'Water acts as a nucleophile on the carbonyl carbon and cleaves the $C-O$ bond; the reaction is fast and gives off heat.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.why.2',
            q: Q('Vanduo pirmiausia pakaitinamas, o tik paskui beriamas anhidridas.', 'The water is warmed first, and only then is the anhydride added.'),
            steps: [ch(t('Kokia karštesnio vandens nauda?', 'What does warmer water give?'), [
              ['anhidridas greičiau hidrolizuojasi ir tirpsta', 'the anhydride hydrolyses and dissolves faster'],
              ['jis pakeičia katalizatorių', 'it replaces the catalyst'],
              ['pasikeičia dvigubojo ryšio konfigūracija', 'the configuration of the double bond changes'],
              ['sumažėja maleino rūgšties masė', 'the mass of maleic acid decreases']
            ], 0, t('Kaip temperatūra veikia greitį?', 'How does temperature affect rate?'),
              t('Kaitinimas pagreitina hidrolizę ir tirpinimą. Konfigūracija nesikeičia, nes tam reikia rūgšties.', 'Heating speeds up hydrolysis and dissolution. The configuration does not change, because that needs acid.'))],
            why: t('Vien vandens ir kaitinimo nepakanka $π$ ryšiui sukti: tam reikia $H+$.', 'Water and heat alone cannot twist the $π$ bond: that needs $H+$.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.why.3',
            q: Q('Pirmieji maleino rūgšties kristalai nuspaudžiami kamšteliu, bet neplaunami vandeniu.', 'The first maleic acid crystals are pressed with the stopper but not washed with water.'),
            steps: [ch(t('Kodėl neplaunama vandeniu?', 'Why no water wash?'), [
              ['maleino rūgštis labai gerai tirpsta vandenyje ir ištirptų', 'maleic acid is very soluble in water and would dissolve'],
              ['vanduo ją paverstų fumaro rūgštimi', 'water would turn it into fumaric acid'],
              ['vanduo ją suskaido į anhidridą', 'water would turn it back into the anhydride'],
              ['plaunant ji sublimuojasi', 'it sublimes on washing']
            ], 0, t('Prisiminkite lentelę apie tirpumą.', 'Recall the solubility row of the table.'),
              t('Maleino rūgštis poliška ir sudaro ryšius su vandeniu, todėl plovimas vandeniu pražudytų produktą.', 'Maleic acid is polar and bonds to water, so a water wash would lose the product.'))],
            why: t('Plaunama tik tuo, kuo produktas netirpsta; fumaro rūgštis šaltame vandenyje tirpsta menkai, todėl ją plauti galima.', 'You wash only with something the product does not dissolve in; fumaric acid is poorly soluble in cold water, so it can be washed.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.why.4',
            q: Q('Kolba su $HCl$ verdama su grįžtamuoju kondensatoriumi.', 'The flask with $HCl$ is boiled under a reflux condenser.'),
            steps: [ch(t('Kokia kondensatoriaus paskirtis?', 'What is the condenser for?'), [
              ['kondensuoja garus ir grąžina skystį į kolbą, todėl tūris ir koncentracija nekinta', 'it condenses the vapours and returns the liquid, so volume and concentration stay constant'],
              ['jis paskatina izomerizaciją', 'it promotes the isomerisation'],
              ['jis iš kolbos išsiurbia orą', 'it sucks the air out of the flask'],
              ['jis atskiria $HCl$ nuo vandens distiliuodamas', 'it separates $HCl$ from water by distillation']
            ], 0, t('Kondensatorius ne eliminuoja produktą, o grąžina garus.', 'The condenser does not remove anything, it returns vapour.'),
              t('Garai kyla aušinamu vamzdžiu, vėsta ir nuteka atgal. Taip galima ilgai virinti nepraradus tirpiklio ir rūgšties.', 'Vapour rises in the cooled tube, condenses and runs back. This allows long boiling without losing solvent or acid.'))],
            why: t('Kai mišinį reikia ilgai virinti, o ne distiliuoti, nei tirpiklis, nei lakūs komponentai neturi pasišalinti.', 'When a mixture has to be boiled for a long time rather than distilled, neither solvent nor volatile components may escape.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.why.5',
            q: Q('Kondensatoriui vanduo tiekiamas iš apačios, o išleidžiamas iš viršaus.', 'Water enters the condenser at the bottom and leaves at the top.'),
            steps: [ch(t('Kodėl taip jungiama?', 'Why connected this way?'), [
              ['kad apvalkalas būtų pilnas vandens ir nebūtų oro kišenių', 'so that the jacket is full of water with no air pockets'],
              ['kad vanduo greičiau išbėgtų', 'so that water runs out faster'],
              ['kad vanduo būtų šiltesnis', 'so that the water is warmer'],
              ['kad nereikėtų žarnelių', 'so that no hoses are needed']
            ], 0, t('Kaip vanduo užpildo vamzdį kylant aukštyn?', 'How does water fill a tube when it rises upwards?'),
              t('Kylant aukštyn vanduo išstumia orą ir užpildo visą apvalkalą, todėl vėsinimas tolygus.', 'Rising water pushes air out and fills the whole jacket, so cooling is even.'))],
            why: t('Priešsrovė ir pilnas apvalkalas užtikrina geriausią šilumos pasikeitimą.', 'A counter-current and a full jacket give the best heat exchange.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.why.6',
            q: Q('Reakcijos mišinys verdamas maišant magnetine maišykle.', 'The mixture boils while stirred with a magnetic stirrer.'),
            steps: [ch(t('Ką duoda maišymas?', 'What does stirring give?'), [
              ['tolygų šildymą ir ramesnį virimą be pašokimų', 'even heating and calmer boiling without bumping'],
              ['jis sukelia $E/Z$ keitimąsi', 'it causes the $E/Z$ change'],
              ['jis sumažina išeigą', 'it lowers the yield'],
              ['jis pakeičia $HCl$ stiprumą', 'it changes the strength of $HCl$']
            ], 0, t('Kaip kaitinamas tirpalas, jei jis nejuda?', 'How is a solution heated if it does not move?'),
              t('Maišymas išlygina temperatūrą ir neleidžia susidaryti perkaitintoms vietoms.', 'Stirring evens out the temperature and prevents superheated spots.'))],
            why: t('Tolygus kaitinimas saugo nuo staigaus pašokimo ir padeda reakcijai vykti vienodai.', 'Even heating protects against sudden bumping and lets the reaction go uniformly.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.why.7',
            q: Q('Fumaro rūgšties tirpalas aušinamas vandens ir ledo vonioje, o kristalai plaunami šaltu vandeniu.', 'The fumaric acid mixture is cooled in a water and ice bath and the crystals are washed with cold water.'),
            steps: [ch(t('Kodėl šaltas vanduo?', 'Why cold water?'), [
              ['žemoje temperatūroje tirpumas mažesnis, todėl nuostoliai mažesni', 'solubility is lower at low temperature, so the losses are smaller'],
              ['šaltas vanduo paverčia kristalus maleino rūgštimi', 'cold water turns the crystals into maleic acid'],
              ['šaltame vandenyje $HCl$ nustoja tirpti', '$HCl$ stops dissolving in cold water'],
              ['kad kristalai greičiau išdžiūtų', 'so that the crystals dry faster']
            ], 0, t('Kaip tirpumas keičiasi su temperatūra?', 'How does solubility change with temperature?'),
              t('Fumaro rūgštis šaltame vandenyje tirpsta dar blogiau nei karštame, todėl šaltu plaunant dingsta mažiau.', 'Fumaric acid dissolves even worse in cold water than in hot, so washing with cold water loses less.'))],
            why: t('Žemoje temperatūroje daugiau produkto lieka kristalų pavidalu.', 'At low temperature more of the product stays as crystals.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.why.8',
            q: Q('Išdžiovinimui kristalai paliekami krosnelėje, įkaitintoje iki 80 °C, o ne daug karštesnėje.', 'For drying the crystals are left in an oven heated to 80 °C, not a much hotter one.'),
            steps: [ch(t('Ko siekiama džiovinant šioje temperatūroje?', 'What is achieved by drying at this temperature?'), [
              ['pašalina vandenį ir HCl likučius, nesukeldama lydymosi ar skilimo', 'removes water and HCl traces without melting or decomposition'],
              ['ji paverčia fumaro rūgštį maleino', 'it turns fumaric acid into maleic acid'],
              ['ji išlydo fumaro rūgštį', 'it melts fumaric acid'],
              ['ji sublimuoja fumaro rūgštį', 'it sublimes fumaric acid']
            ], 0, t('Palyginkite 80 °C su abiejų rūgščių lydymosi temperatūromis.', 'Compare 80 °C with the melting points of both acids.'),
              t('80 °C yra žemiau abiejų rūgščių lydymosi temperatūros, todėl išgaruoja tik drėgmė.', '80 °C is below the melting points of both acids, so only moisture evaporates.'))],
            why: t('Džiovinti reikia, nes šlapias produktas sveriasi per daug ir lydosi žemesnėje temperatūroje.', 'Drying is needed because a wet product weighs too much and melts at a lower temperature.'),
            src: 'LW5 p2'
          }
        ]
      },
      // ------------------------------------------------------------------ what you would observe
      {
        id: 'l5.observe',
        title: t('Ką pamatysite?', 'What would you observe?'),
        mirrors: ['LW5.1', 'LW5.2', 'LW5.3', 'LW5.4', 'LW5.5'],
        bank: [
          {
            id: 'l5.observe.1',
            q: Q('Į pakaitintą vandenį suberiamas baltas anhidrido miltelių kiekis ir maišoma.', 'White anhydride powder is added to warmed water and stirred.'),
            steps: [ch(t('Ką pastebėsite?', 'What do you see?'), [
              ['miltelių nelieka, gaunamas skaidrus tirpalas', 'the powder disappears and a clear solution forms'],
              ['iškrenta geltonos nuosėdos', 'a yellow precipitate forms'],
              ['išsiskiria dujos', 'a gas is evolved'],
              ['tirpalas nusidažo mėlynai', 'the solution turns blue']
            ], 0, t('Anhidridas virsta labai tirpia rūgštimi.', 'The anhydride becomes a very soluble acid.'),
              t('Susidaro maleino rūgštis, kuri vandenyje tirpsta, todėl tirpalas skaidrus.', 'Maleic acid forms and dissolves in water, so the solution is clear.'))],
            why: t('Hidrolizė anhidridą paverčia poliškesne rūgštimi, turinčia dvi $COOH$ grupes.','Hydrolysis changes the anhydride into a more polar acid with two $COOH$ groups.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.observe.2',
            q: Q('Maleino rūgšties tirpalas atvėsintas ledo vonioje, bet kristalų nėra.', 'The maleic acid solution is cooled in ice, but no crystals appear.'),
            steps: [ch(t('Ką daryti?', 'What do you do?'), [
              ['stikline lazdele brūkšnoti sienelę, kad prasidėtų kristalizacija', 'scratch the wall with a glass rod to start crystallisation'],
              ['pridėti $HCl$', 'add $HCl$'],
              ['stipriai pakaitinti', 'heat strongly'],
              ['plauti vandeniu', 'wash with water']
            ], 0, t('Kristalams reikia užuomazgų.', 'Crystals need nuclei.'),
              t('Brūkšnojant lieka mikroįbrėžimų, kurie tampa kristalizacijos centrais.', 'Scratching leaves tiny grooves that become nucleation sites.'))],
            why: t('Persotintam tirpalui trūksta kristalizacijos centrų; įbrėžimai juos suteikia.', 'A supersaturated solution lacks nucleation sites; scratches provide them.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.observe.3',
            q: Q('Filtratas su $HCl$ kaitinamas virimo temperatūroje.', 'The filtrate with $HCl$ is boiled.'),
            steps: [ch(t('Kokį požymį tikitės?', 'What sign do you expect?'), [
              ['karštame tirpale atsiranda baltų kristalų, nes fumaro rūgštis menkai tirpsta', 'white crystals appear in the hot solution because fumaric acid is poorly soluble'],
              ['tirpalas tampa purpurinis', 'the solution turns purple'],
              ['išsiskiria dujų burbuliukai, nes skyla rūgštis', 'gas bubbles evolve because the acid decomposes'],
              ['jokių pokyčių nėra, nes reakcija vyksta tik šaltyje', 'nothing changes because the reaction needs cold']
            ], 0, t('Kuris izomeras nutirpsta blogai?', 'Which isomer dissolves poorly?'),
              t('Vos susidarius fumaro rūgščiai, ji viršija savo tirpumą ir iškrenta kaip balti milteliai.', 'As soon as fumaric acid forms, it exceeds its solubility and falls out as a white powder.'))],
            why: t('Kristalai yra matomas izomerizacijos požymis: atsiranda naujas, mažiau tirpus junginys.', 'Crystals are the visible sign of isomerisation: a new, less soluble compound appears.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.observe.4',
            q: Q('Pirmųjų kristalų lydymosi temperatūra matuojama spiritiniu termometru.', 'The melting point of the first crystals is measured with a spirit thermometer.'),
            steps: [ch(t('Kokia temperatūra rodo grynus kristalus?', 'Which melting range suggests pure crystals?'), [
              ['140–142 °C, siaura riba', '140–142 °C, a narrow range'],
              ['115–130 °C, plati riba', '115–130 °C, a wide range'],
              ['apie 300 °C su sublimacija', 'about 300 °C with sublimation'],
              ['jau 50 °C', 'already 50 °C']
            ], 0, t('Grynos medžiagos lydosi siauroje riboje.', 'Pure substances melt over a narrow range.'),
              t('Maleino rūgšties lyd. t. yra 140–142 °C, o priemaišos ją sumažina ir praplečia ribą.', 'The m.p. of maleic acid is 140–142 °C; impurities lower it and widen the range.'))],
            why: t('Lydymosi riba yra grynumo požymis: siaura ir artima literatūros reikšmei reiškia gerą grynumą.', 'The melting range reflects purity: narrow and close to the literature value means good purity.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.observe.5',
            q: Q('Išdžiovintas $HCl$ izomerizacijos produktas kaitinamas lydymosi aparate.', 'The dried product of the $HCl$ isomerisation is heated in a melting point apparatus.'),
            steps: [ch(t('Kas vyksta, jei tai fumaro rūgštis?', 'What happens if it is fumaric acid?'), [
              ['prie 140 °C nesilydo, apie 300 °C sublimuojasi', 'it does not melt at 140 °C and sublimes around 300 °C'],
              ['prie 140 °C išsilydo', 'it melts at 140 °C'],
              ['jis nuspalvinamas rudai', 'it turns brown'],
              ['jis tirpsta nuo kaitinimo', 'it dissolves on heating']
            ], 0, t('Palyginkite su abiejų rūgščių lydymosi temperatūromis.', 'Compare with the m.p. of both acids.'),
              t('Fumaro rūgštis lydosi aukštai (299–300 °C) ir sublimuojasi, nes tarpmolekuliniai ryšiai stiprūs.', 'Fumaric acid melts high (299–300 °C) and sublimes, because intermolecular bonds are strong.'))],
            why: t('Itin aukšta lydymosi temperatūra liudija trans izomerą.', 'A very high melting point points to the trans isomer.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.observe.6',
            q: Q('Fumaro rūgšties kristalai plaunami šaltu vandeniu.', 'Fumaric acid crystals are rinsed with cold water.'),
            steps: [ch(t('Kas nutiktų, jei plautumėte karštu vandeniu?', 'What would happen if you rinsed with hot water?'), [
              ['daugiau kristalų ištirptų ir išeiga sumažėtų', 'more crystals would dissolve and the yield would fall'],
              ['kristalai virstų maleino rūgštimi', 'the crystals would turn into maleic acid'],
              ['išeiga padidėtų', 'the yield would rise'],
              ['kristalai pabaltėtų', 'the crystals would turn whiter']
            ], 0, t('Tirpumas didėja kylant temperatūrai.', 'Solubility rises with temperature.'),
              t('Karštame vandenyje fumaro rūgštis tirpsta geriau, todėl dalis produkto būtų prarasta.', 'Fumaric acid dissolves better in hot water, so part of the product would be lost.'))],
            why: t('Plovimas turi pašalinti priemaišas, bet neištirpinti produkto.', 'Washing must remove impurities without dissolving the product.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.observe.7',
            q: Q('Į du mėgintuvėlius su šaltu vandeniu įberiama po šiek tiek maleino ir fumaro rūgšties.', 'A little maleic acid and fumaric acid are added to two tubes of cold water.'),
            steps: [ch(t('Kas matoma?', 'What is seen?'), [
              ['maleino rūgštis tirpsta, fumaro lieka kaip nuosėdos', 'maleic acid dissolves, fumaric acid stays as a solid'],
              ['abi tirpsta vienodai', 'both dissolve equally'],
              ['fumaro rūgštis tirpsta, maleino ne', 'fumaric acid dissolves, maleic acid does not'],
              ['abi iškart reaguoja su vandeniu į dujas', 'both react with water to give a gas']
            ], 0, t('Kuri rūgštis poliškesnė?', 'Which acid is the more polar one?'),
              t('Poliškesnė maleino rūgštis tirpsta labai gerai, simetriška fumaro rūgštis daug blogiau.', 'The more polar maleic acid dissolves very well, the symmetrical fumaric acid much worse.'))],
            why: t('Tirpumo skirtumas atsiranda dėl skirtingos geometrijos ir vandenilio ryšių tipo.', 'The solubility difference arises from different geometry and the type of hydrogen bonding.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.observe.8',
            q: Q('Atfiltravus fumaro rūgštį, lieka filtratas.', 'After the fumaric acid is filtered off, a filtrate remains.'),
            steps: [mu(t('Kas yra filtrate? Pažymėkite visus.', 'What is in the filtrate? Pick all.'), [
              ['$HCl$', '$HCl$'],
              ['dalis neizomerizuotos maleino rūgšties', 'part of the unisomerised maleic acid'],
              ['nedidelis fumaro rūgšties kiekis, kurio tirpumas ribotas', 'a little fumaric acid, because of its limited solubility'],
              ['maleino rūgšties anhidridas', 'maleic anhydride']
            ], [0, 1, 2], t('Atsiminkite, kas lieka tirpale po kristalizacijos.', 'Remember what stays dissolved after crystallisation.'),
              t('Filtrate lieka katalizatorius $HCl$, nesureagavusi maleino rūgštis ir šiek tiek ištirpusios fumaro rūgšties. Anhidridas vandenyje jau seniai hidrolizavosi.', 'The filtrate contains the catalyst $HCl$, unreacted maleic acid and a little dissolved fumaric acid. The anhydride hydrolysed long ago in water.'))],
            why: t('Nė viena kristalizacija nėra visiška: dalis produkto ir reagentų lieka tirpale.', 'No crystallisation is complete: part of the product and reagents stays in solution.'),
            src: 'LW5 p2'
          }
        ]
      },
      // ------------------------------------------------------------------ which observation proves what
      {
        id: 'l5.prove',
        title: t('Ką įrodo stebėjimas?', 'What does the observation prove?'),
        mirrors: ['LW5.2', 'LW5.3', 'LW5.5', 'LW5.7'],
        bank: [
          {
            id: 'l5.prove.1',
            q: Q('Produktas nesilydo iki 250 °C, o apie 300 °C sublimuojasi.', 'The product does not melt up to 250 °C and sublimes around 300 °C.'),
            steps: [ch(t('Ką tai įrodo?', 'What does this prove?'), [
              ['kad tai fumaro, o ne maleino rūgštis', 'that it is fumaric, not maleic acid'],
              ['kad tai anhidridas', 'that it is the anhydride'],
              ['kad produktas drėgnas', 'that the product is wet'],
              ['kad nėra jokių priemaišų', 'that there are no impurities at all']
            ], 0, t('Palyginkite su literatūrine lydymosi temperatūra.', 'Compare with the literature melting point.'),
              t('Maleino rūgštis jau 140 °C lydosi, todėl toks aukštas taškas rodo fumaro rūgštį.', 'Maleic acid melts already at 140 °C, so such a high point means fumaric acid.'))],
            why: t('Skirtingi lydymosi taškai parodo, kad izomerizacija įvyko.', 'Different melting points show that the isomerisation took place.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.prove.2',
            q: Q('Abu produktai turi formulę $C4H4O4$ ir skirtingus lydymosi taškus.', 'Both products have the formula $C4H4O4$ and different melting points.'),
            steps: [ch(t('Ką tai rodo?', 'What does this show?'), [
              ['jie yra izomerai', 'they are isomers'],
              ['jie yra to paties junginio konformerai', 'they are conformers of the same compound'],
              ['vienas jų yra druska', 'one of them is a salt'],
              ['jie skiriasi funkcinėmis grupėmis', 'they differ in functional groups']
            ], 0, t('Ta pati sudėtis, bet skiriasi savybės.', 'Same composition, different properties.'),
              t('Vienodos formulės ir skirtingos savybės reiškia izomerus; čia tai $Z/E$ izomerai, o ne konformerai, nes sukimasis aplink $C=C$ neįmanomas.', 'Same formula and different properties mean isomers; these are $Z/E$ isomers, not conformers, since rotation about $C=C$ is impossible.'))],
            why: t('Konformerus galima paversti vienas kitu sukant aplink $σ$ ryšį, o čia reikia nutraukti $π$ ryšį.', 'Conformers interconvert by rotation about a $σ$ bond, but here a $π$ bond has to be broken.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.prove.3',
            q: Q('Pirmųjų kristalų lydymosi riba 125–134 °C.', 'The melting range of the first crystals is 125–134 °C.'),
            steps: [ch(t('Ką daryti išvadą?', 'What do you conclude?'), [
              ['maleino rūgštis nešvari arba drėgna', 'the maleic acid is impure or damp'],
              ['gauta fumaro rūgštis', 'fumaric acid was obtained'],
              ['gautas grynas anhidridas', 'pure anhydride was obtained'],
              ['termometras rodo be klaidos', 'the thermometer is exactly right']
            ], 0, t('Riba plati ir žemesnė už literatūrinę.', 'The range is wide and below the literature value.'),
              t('Priemaišos žemina ir praplečia lydymosi ribą, todėl reikalingas džiovinimas ar perkristalinimas.', 'Impurities lower and widen the melting range, so drying or recrystallisation is needed.'))],
            why: t('Lydymosi temperatūros nuokrypis nuo literatūrinės yra grynumo matas.', 'The deviation from the literature melting point measures purity.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.prove.4',
            q: Q('Ir maleino, ir fumaro rūgšties tirpalas pašalina bromo vandens spalvą.', 'Solutions of both maleic and fumaric acid remove the colour of bromine water.'),
            steps: [ch(t('Ką tai parodo?', 'What does it show?'), [
              ['abiejose yra $C=C$, bet bandymas jų neatskiria', 'both contain $C=C$, but the test does not distinguish them'],
              ['tik fumaro rūgštyje yra $C=C$', 'only fumaric acid contains $C=C$'],
              ['tik maleino rūgštyje yra $C=C$', 'only maleic acid contains $C=C$'],
              ['nė viena neturi dvigubo ryšio', 'neither has a double bond']
            ], 0, t('Ar bandymas jautrus geometrijai?', 'Does the test care about geometry?'),
              t('Bromas jungiasi prie bet kurio $C=C$, todėl šis bandymas parodo tik nesotumą, bet ne $Z/E$ izomeriją.', 'Bromine adds to any $C=C$, so this test shows only unsaturation, not $Z/E$ isomerism.'))],
            why: t('Kokybinis bandymas atsako tik į klausimą apie funkcinę grupę; geometriją atskleidžia fizinės savybės.', 'A qualitative test answers only a question about the functional group; geometry is revealed by physical properties.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.prove.5',
            q: Q('Pilant $HCl$ iškrito kristalų; panašus kontrolinis mėginys be $HCl$ ir be kaitinimo kristalų neiškrito.', 'Crystals appeared with $HCl$; a similar control sample without $HCl$ or heating gave none.'),
            steps: [ch(t('Ką tai rodo?', 'What does this show?'), [
              ['kad izomerizacijai reikalinga rūgštis ir šiluma', 'that isomerisation needs acid and heat'],
              ['kad vanduo pats paverčia izomerus', 'that water alone interconverts the isomers'],
              ['kad kristalai yra druska', 'that the crystals are a salt'],
              ['kad $HCl$ sunaudojamas visas', 'that all the $HCl$ is used up']
            ], 0, t('Kontrolė keičia tik vieną sąlygą.', 'A control changes only one condition.'),
              t('Be $H+$ ir kaitinimo $π$ ryšys išlieka, todėl kristalai neiškrenta. Tai rodo katalizinį $HCl$ vaidmenį.', 'Without $H+$ and heat the $π$ bond survives, so no crystals form. This shows the catalytic role of $HCl$.'))],
            why: t('Kontrolinis bandymas atskiria, kas iš tiesų sukelia pokytį.', 'A control experiment isolates what really causes the change.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.prove.6',
            q: Q('Išeiga lygi 112 %.', 'The yield comes out as 112 %.'),
            steps: [mu(t('Kas galėjo nutikti? Pažymėkite visas tikėtinas priežastis.', 'What could be the reason? Pick all plausible causes.'), [
              ['produktas nepakankamai išdžiūvo', 'the product was not dry enough'],
              ['liko $HCl$ ar kitų priemaišų', 'it still contains $HCl$ or other impurities'],
              ['neteisingai apskaičiuota teorinė masė', 'the theoretical mass was miscalculated'],
              ['filtratas buvo per šaltai atvėsintas', 'the mixture was chilled too much']
            ], [0, 1, 2], t('Išeiga negali viršyti 100 %.', 'A yield cannot exceed 100 %.'),
              t('Per didelę masę lemia drėgmė, priemaišos arba skaičiavimo klaida. Šaltesnis aušinimas masę ne padidintų, o sumažintų.', 'Excess mass comes from moisture, impurities or a calculation error. Colder cooling would lower the mass, not raise it.'))],
            why: t('Realiai išeiga viršyti 100 % negali, todėl tokį rezultatą reikia aiškintis kaip klaidą.', 'A real yield cannot exceed 100 %, so such a result has to be explained as an error.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.prove.7',
            q: Q('Iš filtrato, kuriame buvo maleino rūgšties, po virinimo su $HCl$ gauta kristalų, kurių lyd. t. 299–300 °C.', 'Boiling the filtrate that contained maleic acid with $HCl$ gave crystals with m.p. 299–300 °C.'),
            steps: [ch(t('Kuri išvada pagrįsta?', 'Which conclusion is justified?'), [
              ['maleino rūgšties $Z$ konfigūracija pakito į $E$', 'the Z configuration of maleic acid changed to E'],
              ['atsirado naujas elementas', 'a new element appeared'],
              ['skeletas pertvarkytas į trijų anglių grandinę', 'the skeleton was rearranged to a three-carbon chain'],
              ['$COOH$ virto $CHO$', '$COOH$ became $CHO$']
            ], 0, t('Kas pasikeitė pagal formulę ir lydymosi tašką?', 'What changed according to formula and melting point?'),
              t('Formulė ta pati, skirtinga tik dvigubojo ryšio geometrija: $Z$ pakito į $E$.', 'The formula is the same, only the double-bond geometry differs: Z changed to E.'))],
            why: t('Izomerizacija keičia erdvinę, ne konstitucinę, sandarą.', 'Isomerisation changes the spatial, not the constitutional, structure.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.prove.8',
            q: Q('Maleino rūgšties pKa1 yra apie 1,9, o fumaro rūgšties apie 3,0.', 'The pKa1 of maleic acid is about 1.9 and of fumaric acid about 3.0.'),
            steps: [ch(t('Ką tai rodo apie maleino rūgštį?', 'What does this suggest about maleic acid?'), [
              ['jos monoanijoną stabilizuoja vidumolekulinis vandenilio ryšys', 'its monoanion is stabilised by an intramolecular hydrogen bond'],
              ['ji turi daugiau anglies atomų', 'it has more carbon atoms'],
              ['ji yra trans izomeras', 'it is the trans isomer'],
              ['joje nėra $COOH$ grupių', 'it has no $COOH$ groups']
            ], 0, t('Kokiame izomere $COOH$ grupės arti viena kitos?', 'Which isomer has $COOH$ groups close together?'),
              t('Cis izomere neigiamas krūvis dalijasi per vandenilio tiltelį su antrąja $COOH$ grupe, todėl pirmoji rūgštis stipresnė.', 'In the cis isomer the negative charge is shared through a hydrogen bridge with the second $COOH$, so the first acid is stronger.'))],
            why: t('Ta pati vidumolekulinė sąveika paaiškina ir tirpumą, ir rūgštingumą.', 'The same intramolecular interaction explains both solubility and acidity.'),
            src: 'Klein'
          }
        ]
      },
      // ------------------------------------------------------------------ apparatus
      {
        id: 'l5.apparatus',
        title: t('Priemonės pagal aprašymą', 'Apparatus from its description'),
        mirrors: ['LW5.1', 'LW5.2', 'LW5.3', 'LW5.4', 'LW5.5', 'LW5.6'],
        bank: [
          { id: 'l5.apparatus.1', desc: ['ilgas stiklinis vamzdis su apvalkalu, kuriuo teka vanduo; dedamas ant kolbos kaklelio, kad garai nesprūstų', 'a long glass tube with a jacket through which water flows; fitted to the neck of the flask so vapours cannot escape'], right: ['grįžtamasis kondensatorius', 'reflux condenser'], other: [['atskirtuvas', 'separatory funnel'], ['Büchnerio piltuvėlis', 'Büchner funnel'], ['pipetė', 'pipette']], why: ['Garai kondensuojasi ir grįžta atgal.', 'Vapours condense and run back.'] },
          { id: 'l5.apparatus.2', desc: ['kūgio formos kolba su siauru kakleliu, kurią galima kaitinti ant viryklės', 'a conical flask with a narrow neck that can be heated on a hot plate'], right: ['Erlenmejerio kolba', 'Erlenmeyer flask'], other: [['matavimo cilindras', 'measuring cylinder'], ['stiklinė lazdelė', 'glass rod'], ['kristalizatorius', 'crystalliser dish']], why: ['Siauras kaklelis mažina garavimą.', 'The narrow neck reduces evaporation.'] },
          { id: 'l5.apparatus.3', desc: ['storasienis stiklinis indas su šonine atšaka, prijungiamas prie vakuumo; ant jo dedamas piltuvėlis', 'a thick-walled glass vessel with a side arm connected to the vacuum, with a funnel on top'], right: ['mėgintuvėlis su atsaka filtravimui', 'filter flask with a side arm'], other: [['Erlenmejerio kolba su kamščiu', 'plain flask with stopper'], ['dulkių surinkėjas', 'dust collector'], ['dujų plovimo indas', 'gas wash bottle']], why: ['Vakuumas pagreitina filtravimą.', 'Vacuum speeds up the filtration.'] },
          { id: 'l5.apparatus.4', desc: ['platus seklus stiklinis indas, į kurį pilamas vanduo su ledu, kad jame būtų atšaldomi kristalai ar kolba', 'a wide shallow dish filled with water and ice'], right: ['kristalizatorius (ledo vonia)', 'crystalliser dish (ice bath)'], other: [['džiovinimo krosnelė', 'drying oven'], ['grįžtamasis kondensatorius', 'reflux condenser'], ['magnetinė maišyklė', 'magnetic stirrer']], why: ['Plokščias indas gerai perduoda šilumą.', 'A flat vessel exchanges heat well.'] },
          { id: 'l5.apparatus.5', desc: ['maža teflonu padengta „tabletė“ ar lazdelė, kuri sukasi tirpale, kai po indu yra besisukantis magnetas', 'a small Teflon-coated "pill" or rod that spins in the liquid when a rotating magnet is below the vessel'], right: ['teflono maišikliukas', 'Teflon stirring bar'], other: [['laikiklis', 'clamp'], ['kamštelis', 'stopper'], ['termometras', 'thermometer']], why: ['Magnetas suka maišikliuką.', 'The magnet spins the bar.'] },
          { id: 'l5.apparatus.6', desc: ['stiklinis strypas su plokščiu pagrindu, kuriuo kristalai nuspaudžiami filtre', 'a glass rod with a flat base used to press crystals on the filter'], right: ['stiklinis kamštelis kristalams nuspausti', 'glass stopper for pressing crystals'], other: [['stiklinė lazdelė su šluotele', 'brush on a glass rod'], ['pipetė su guma', 'rubber-bulb pipette'], ['piltuvėlio kamštis', 'funnel stopper']], why: ['Nuspaudžiama, kad skystis būtų išspaustas.', 'Pressing squeezes the liquid out.'] },
          { id: 'l5.apparatus.7', desc: ['šildomas dėžutės pavidalo prietaisas, kuriame džiovinama 80 °C', 'a heated box in which things are dried at 80 °C'], right: ['džiovinimo krosnelė', 'drying oven'], other: [['šaldytuvas', 'refrigerator'], ['garų kaitintuvas', 'steam heater'], ['vakuuminis eksikatorius', 'vacuum desiccator']], why: ['Karštas oras išgarina vandenį.', 'Hot air evaporates the water.'] },
          { id: 'l5.apparatus.8', desc: ['stiklinis termometras su spiritu, naudojamas apytiksliai lydymosi temperatūrai nustatyti', 'a glass thermometer filled with alcohol, used to get an approximate melting point'], right: ['spiritinis termometras', 'spirit thermometer'], other: [['gyvsidabrinis barometras', 'mercury barometer'], ['pH jutiklis', 'pH electrode'], ['refraktometras', 'refractometer']], why: ['Spiritas netoksiškas, jis nuspalvintas.', 'Alcohol is less toxic and dyed.'] }
        ].map(a => ({
          id: a.id,
          q: [{ p: t('Aprašymas: ' + a.desc[0] + '.', 'Description: ' + a.desc[1] + '.') }],
          steps: [ch(t('Kokia tai priemonė?', 'Which piece of equipment is this?'),
            [a.right].concat(a.other).map(o => [o[0], o[1]]), 0,
            t('Kuo skiriasi aprašymas nuo kitų variantų paskirtimi?', 'How does the description differ from the others in purpose?'),
            t('Tai ' + a.right[0] + '. ' + a.why[0], 'It is the ' + a.right[1] + '. ' + a.why[1]))],
          why: t('Priemonė parenkama pagal savo paskirtį: ką ji daro darbe, o ne pagal išvaizdą.', 'Equipment is identified by what it does in the experiment, not only by its shape.'),
          src: 'LW5 p1'
        }))
      },
      // ------------------------------------------------------------------ calculations
      {
        id: 'l5.calc',
        title: t('Skaičiavimai: išeiga ir lydymosi temperatūra', 'Calculations: yield and melting point'),
        mirrors: ['LW5.2', 'LW5.4', 'LW5.5'],
        gen(rng, ctx) {
          const fmt = (x, d) => x.toFixed(d);
          const lt = (x, d) => fmt(x, d).replace('.', ',');
          const MA = 98.07, MM = 116.07;
          const variant = ctx.pick(['acid', 'fumaric', 'overall', 'mp', 'rf']);

          if (variant === 'acid') {
            const m = ctx.int(15, 30) / 10;
            const theo = m / MA * MM;
            const obt = Math.round(theo * ctx.int(30, 85)) / 100;
            const y = obt / theo * 100;
            return {
              q: [{ p: t('Maleino rūgščiai gauti paimta ' + lt(m, 2) + ' g anhidrido ($M$ = 98,07 g/mol). Pirmoji kristalų porcija po džiovinimo sveria ' + lt(obt, 2) + ' g ($M$ rūgšties = 116,07 g/mol).',
                'To obtain maleic acid, ' + fmt(m, 2) + ' g of anhydride ($M$ = 98.07 g/mol) was used. The first crop of crystals weighs ' + fmt(obt, 2) + ' g after drying ($M$ of the acid = 116.07 g/mol).') }],
              steps: [
                { prompt: t('Kokia teorinė maleino rūgšties masė (g)?', 'What is the theoretical mass of maleic acid (g)?'), kind: 'number', answer: { value: theo, tol: 0.03 },
                  hint: t('Santykis 1 : 1; pirmiausia reikia molių.', 'The ratio is 1 : 1; first you need moles.'),
                  solution: t('$n = ' + lt(m, 2) + ' / 98,07$; masė $= n · 116,07 = ' + lt(theo, 2) + '$ g.', '$n = ' + fmt(m, 2) + ' / 98.07$; mass $= n · 116.07 = ' + fmt(theo, 2) + '$ g.') },
                { prompt: t('Kokia išeiga (%)?', 'What is the yield (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Gauta masė dalijama iš teorinės.', 'Divide the obtained mass by the theoretical one.'),
                  solution: t('$' + lt(obt, 2) + ' / ' + lt(theo, 2) + ' · 100 = ' + lt(y, 1) + '$ %.', '$' + fmt(obt, 2) + ' / ' + fmt(theo, 2) + ' · 100 = ' + fmt(y, 1) + '$ %.') }
              ],
              why: t('Išeiga lygina gautą masę su ta, kurią duotų visiškas sureagavimas pagal santykį 1 : 1.', 'The yield compares the mass obtained with what complete conversion would give by the 1 : 1 ratio.'),
              src: 'LW5 p2'
            };
          }

          if (variant === 'fumaric') {
            const m = ctx.int(5, 18) / 10;
            const obt = Math.round(m * ctx.int(30, 90)) / 100;
            const y = obt / m * 100;
            return {
              q: [{ p: t('Izomerizacijai imta ' + lt(m, 2) + ' g maleino rūgšties. Išdžiovinta fumaro rūgštis sveria ' + lt(obt, 2) + ' g.', 'For the isomerisation ' + fmt(m, 2) + ' g of maleic acid was used. The dried fumaric acid weighs ' + fmt(obt, 2) + ' g.') }],
              steps: [
                { prompt: t('Kokia teorinė fumaro rūgšties masė (g)?', 'What is the theoretical mass of fumaric acid (g)?'), kind: 'number', answer: { value: m, tol: 0.03 },
                  hint: t('Palyginkite abiejų rūgščių formules.', 'Compare the formulas of the two acids.'),
                  solution: t('Izomerų molinės masės vienodos, todėl teorinė masė lygi pradinei: ' + lt(m, 2) + ' g.', 'Isomers have the same molar mass, so the theoretical mass equals the starting mass: ' + fmt(m, 2) + ' g.') },
                { prompt: t('Kokia išeiga (%)?', 'What is the yield (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Gauta masė dalijama iš teorinės.', 'Obtained mass over theoretical mass.'),
                  solution: t('$' + lt(obt, 2) + ' / ' + lt(m, 2) + ' · 100 = ' + lt(y, 1) + '$ %.', '$' + fmt(obt, 2) + ' / ' + fmt(m, 2) + ' · 100 = ' + fmt(y, 1) + '$ %.') }
              ],
              why: t('Izomerizacijoje atomų skaičius nesikeičia, todėl masė teoriškai lieka ta pati.', 'Isomerisation does not change the number of atoms, so the mass stays the same in theory.'),
              src: 'LW5 p2'
            };
          }

          if (variant === 'overall') {
            const m = ctx.int(15, 30) / 10;
            const theo = m / MA * MM;
            const obt = Math.round(theo * ctx.int(15, 60)) / 100;
            const y = obt / theo * 100;
            return {
              q: [{ p: t('Iš ' + lt(m, 2) + ' g maleino rūgšties anhidrido ($M$ = 98,07 g/mol) po hidrolizės ir izomerizacijos gauta ' + lt(obt, 2) + ' g fumaro rūgšties ($M$ = 116,07 g/mol).',
                'From ' + fmt(m, 2) + ' g of maleic anhydride ($M$ = 98.07 g/mol), ' + fmt(obt, 2) + ' g of fumaric acid ($M$ = 116.07 g/mol) was obtained after hydrolysis and isomerisation.') }],
              steps: [
                { prompt: t('Kiek mmol anhidrido paimta?', 'How many mmol of anhydride were used?'), kind: 'number', answer: { value: m / MA * 1000, tol: 0.5 },
                  hint: t('$n = m / M$, pervesta į mmol.', '$n = m / M$, converted to mmol.'),
                  solution: t('$' + lt(m, 2) + ' / 98,07 · 1000 = ' + lt(m / MA * 1000, 1) + '$ mmol.', '$' + fmt(m, 2) + ' / 98.07 · 1000 = ' + fmt(m / MA * 1000, 1) + '$ mmol.') },
                { prompt: t('Kokia bendra išeiga (%)?', 'What is the overall yield (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Abu etapai po 1 : 1, todėl teorinė masė žinoma iš pirmo etapo.', 'Both stages are 1 : 1, so the theoretical mass follows from the first stage.'),
                  solution: t('Teorinė masė $= ' + lt(theo, 2) + '$ g; išeiga $= ' + lt(obt, 2) + ' / ' + lt(theo, 2) + ' · 100 = ' + lt(y, 1) + '$ %.', 'Theoretical mass $= ' + fmt(theo, 2) + '$ g; yield $= ' + fmt(obt, 2) + ' / ' + fmt(theo, 2) + ' · 100 = ' + fmt(y, 1) + '$ %.') }
              ],
              why: t('Bendra išeiga gali būti mažesnė už kiekvieno etapo išeigą, nes nuostoliai kaupiasi.', 'The overall yield can be below that of each stage, because the losses accumulate.'),
              src: 'LW5 p2'
            };
          }

          if (variant === 'mp') {
            const pure = ctx.pick([true, false]);
            const lo = pure ? ctx.int(139, 140) : ctx.int(120, 134);
            const width = pure ? ctx.int(1, 3) : ctx.int(5, 10);
            const hi = lo + width;
            return {
              q: [{ p: t('Pirmųjų kristalų lydymosi riba išmatuota ' + lo + '–' + hi + ' °C. Literatūrinė maleino rūgšties lydymosi riba yra 140–142 °C.', 'The melting range of the first crystals was measured as ' + lo + '–' + hi + ' °C. The literature range for maleic acid is 140–142 °C.') }],
              steps: [
                { prompt: t('Kokio pločio (°C) yra išmatuota lydymosi riba?', 'How wide (°C) is the measured melting range?'), kind: 'number', answer: { value: width, tol: 0.1 },
                  hint: t('Iš aukštesnės temperatūros atimkite žemesnę.', 'Subtract the lower temperature from the higher.'),
                  solution: t(hi + ' − ' + lo + ' = ' + width + ' °C.', hi + ' − ' + lo + ' = ' + width + ' °C.') },
                ch(t('Ką sakote apie grynumą?', 'What do you say about purity?'), [
                  ['pakankamai grynas', 'reasonably pure'],
                  ['nešvarus arba drėgnas', 'impure or damp'],
                  ['tai fumaro rūgštis', 'it is fumaric acid'],
                  ['nustatyti neįmanoma', 'it cannot be decided']
                ], pure ? 0 : 1, t('Palyginkite pločio ir žemiausios temperatūros nuokrypį.', 'Compare the width and the deviation of the lower end.'),
                  pure ? t('Siaura riba arti 140–142 °C rodo gerą grynumą.', 'A narrow range close to 140–142 °C indicates good purity.')
                    : t('Plati ir žema riba rodo priemaišų arba drėgmės.', 'A wide, low range indicates impurities or moisture.'))
              ],
              why: t('Priemaišos žemina ir praplečia lydymosi ribą (lydymosi temperatūros depresija).', 'Impurities lower and widen the melting range (melting point depression).'),
              src: 'LW5 p2'
            };
          }

          const front = ctx.int(40, 70);
          const s1 = ctx.int(8, 30), s2 = s1 + ctx.int(5, 15);
          return {
            q: [{ p: t('Ploname sluoksnyje atlikta chromatograma: tirpiklio frontas nueina ' + front + ' mm, pirmoji dėmė ' + s1 + ' mm, antroji ' + s2 + ' mm nuo starto linijos.', 'On a thin-layer chromatogram the solvent front moved ' + front + ' mm; the first spot is at ' + s1 + ' mm and the second at ' + s2 + ' mm from the start line.') }],
            steps: [
              { prompt: t('Koks pirmosios dėmės $R_f$?', 'What is the $R_f$ of the first spot?'), kind: 'number', answer: { value: s1 / front, tol: 0.02 },
                hint: t('$R_f$ yra dėmės nueitas kelias, padalytas iš fronto kelio.', '$R_f$ is the spot distance divided by the front distance.'),
                solution: t('$R_f = ' + s1 + ' / ' + front + ' = ' + lt(s1 / front, 2) + '$.', '$R_f = ' + s1 + ' / ' + front + ' = ' + fmt(s1 / front, 2) + '$.') },
              { prompt: t('Koks antrosios dėmės $R_f$?', 'What is the $R_f$ of the second spot?'), kind: 'number', answer: { value: s2 / front, tol: 0.02 },
                hint: t('Ta pati formulė.', 'Same formula.'),
                solution: t('$R_f = ' + s2 + ' / ' + front + ' = ' + lt(s2 / front, 2) + '$.', '$R_f = ' + s2 + ' / ' + front + ' = ' + fmt(s2 / front, 2) + '$.') }
            ],
            why: t('$R_f$ yra santykis, todėl nepriklauso nuo plokštelės ilgio ir leidžia lyginti junginius.', '$R_f$ is a ratio, so it does not depend on the plate length and lets you compare compounds.'),
            src: 'LW5 p2'
          };
        }
      },
      // ------------------------------------------------------------------ defence questions
      {
        id: 'l5.defence',
        title: t('Gynimo klausimai', 'Defence questions'),
        mirrors: ['LW5.1', 'LW5.3', 'LW5.4', 'LW5.6', 'LW5.7'],
        bank: [
          {
            id: 'l5.defence.1',
            q: [{ p: t('Sudėkite junginius su jų pavadinimais.', 'Match the compounds with their names.') }, { mol: [{ smi: MALEIC }, { smi: FUMARIC }] }],
            steps: [{
              prompt: t('Sudėkite junginius ir jų konfigūracijas.', 'Pair each compound with its description.'),
              kind: 'match',
              answer: {
                left: [{ mol: { smi: MALEIC } }, { mol: { smi: FUMARIC } }],
                right: [{ text: t('maleino rūgštis, Z', 'maleic acid, Z') }, { text: t('fumaro rūgštis, E', 'fumaric acid, E') }],
                pairs: [0, 1]
              },
              hint: t('Z reiškia, kad aukštesnio prioriteto grupės yra vienoje pusėje.', 'Z means the higher-priority groups are on the same side.'),
              solution: t('Maleino rūgšties $COOH$ grupės vienoje dvigubojo ryšio pusėje (Z), fumaro rūgšties priešingose (E).', 'In maleic acid the $COOH$ groups are on the same side of the double bond (Z), in fumaric acid on opposite sides (E).')
            }],
            why: t('Z/E nusako grupių išsidėstymą aplink dvigubąjį ryšį pagal prioritetus.', 'Z/E describes the arrangement around a double bond by priority.'),
            src: 'LW5 p1',
            claims: [{ ez: [MALEIC, 3, 4, 'Z'] }, { ez: [FUMARIC, 3, 4, 'E'] }]
          },
          {
            id: 'l5.defence.2',
            q: [{ p: t('Maleino rūgšties anhidridas pilamas į vandenį.', 'Maleic anhydride is added to water.') }, { mol: { smi: ANHYD, name: t('maleino rūgšties anhidridas', 'maleic anhydride') } }],
            steps: [ch(t('Kas vyksta ir kokia reakcijos rūšis?', 'What happens and what kind of reaction is it?'), [
              ['hidrolizė: vanduo atakuoja karbonilo anglį ir atveria žiedą', 'hydrolysis: water attacks the carbonyl carbon and opens the ring'],
              ['dvigubojo ryšio hidrinimas', 'hydrogenation of the double bond'],
              ['radikalinis pakeitimas', 'radical substitution'],
              ['elektrofilinis prijungimas prie $C=C$', 'electrophilic addition to $C=C$']
            ], 0, t('Vanduo čia nukleofilas.', 'Water is the nucleophile here.'),
              t('Vandens deguonis jungiasi su karbonilo anglimi, žiedas atsiveria ir susidaro dvi $COOH$ grupės; dvigubasis ryšys nekeičiamas.', 'The oxygen of water bonds to the carbonyl carbon, the ring opens and two $COOH$ groups form; the double bond is untouched.'))],
            why: t('Anhidridų karbonilo anglis elektrofilinė, todėl vandens nukleofilas ją lengvai atakuoja.', 'The carbonyl carbon of an anhydride is electrophilic, so the water nucleophile attacks it easily.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.defence.3',
            q: Q('Fumaro rūgštis lydosi aukščiau nei maleino ir daug blogiau tirpsta.', 'Fumaric acid melts higher than maleic acid and dissolves much worse.'),
            steps: [ch(t('Kokia pagrindinė priežastis?', 'What is the main reason?'), [
              ['simetriška molekulė, kuri tvirtai pakuojasi kristale ir sudaro tarpmolekulinius vandenilio ryšius', 'a symmetrical molecule that packs tightly in the crystal and forms intermolecular hydrogen bonds'],
              ['ji turi daugiau $COOH$ grupių', 'it has more $COOH$ groups'],
              ['jos molinė masė didesnė', 'its molar mass is higher'],
              ['ji yra druska', 'it is a salt']
            ], 0, t('Abi rūgštys turi tą pačią formulę.', 'Both acids have the same formula.'),
              t('Formulė ir molinė masė vienodos, skiriasi tik geometrija: trans forma kristale pakuojasi geriau, o cis forma dalį vandenilio ryšių panaudoja viduje.', 'Formula and molar mass are equal, only the geometry differs: the trans form packs better in the crystal, while the cis form uses some hydrogen bonds internally.'))],
            why: t('Savybes lemia ne sudėtis, o sąveikos tarp molekulių ir kristalo struktūra.', 'Properties are decided not by composition but by interactions between molecules and by crystal structure.'),
            src: 'LW5 p2'
          },
          {
            id: 'l5.defence.4',
            q: [{ p: t('Nurodykite anglies atomus, prie kurių pirmoje stadijoje prisijungia $H+$.', 'Show the carbons to which $H+$ adds in the first stage.') }],
            steps: [{
              prompt: t('Bakstelėkite abu anglies atomus, kurie gali prisijungti protoną.', 'Tap both carbons that can receive the proton.'),
              kind: 'atoms', mol: { smi: MALEIC, opts: { numbers: 'all' } }, answer: [3, 4],
              hint: t('Protoną priima $π$ ryšio elektronų pora.', 'The proton is accepted by the $π$ electron pair.'),
              solution: t('Protoną priima $C=C$ ryšys, t. y. atomai Nr. 4 ir Nr. 5, nes jie yra dvigubojo ryšio galai.', 'The $C=C$ bond accepts the proton, that is carbons no. 4 and no. 5, the ends of the double bond.')
            }],
            why: t('Dvigubojo ryšio $π$ elektronai yra nukleofilai ir pirmieji atakuoja rūgšties protoną.', 'The $π$ electrons of the double bond are the nucleophile and attack the acid proton first.'),
            src: 'LW5 p1'
          },
          {
            id: 'l5.defence.5',
            q: Q('Kodėl izomerizacija vyksta tik viena kryptimi, iš maleino į fumaro rūgštį?', 'Why does the isomerisation go in one direction, from maleic to fumaric acid?'),
            steps: [mu(t('Pažymėkite visus teisingus teiginius.', 'Pick every correct statement.'), [
              ['fumaro rūgštis termodinamiškai stabilesnė (mažiau steriškai trukdo)', 'fumaric acid is thermodynamically more stable (less steric strain)'],
              ['ji iškrenta iš tirpalo, todėl pusiausvyra tolsta nuo maleino rūgšties', 'it precipitates, so the equilibrium moves away from maleic acid'],
              ['$HCl$ sunaudojamas ir nebeatsinaujina', '$HCl$ is consumed and not regenerated'],
              ['maleino rūgštis visai nesireaguoja', 'maleic acid does not react at all']
            ], [0, 1], t('Pagalvokite apie stabilumą ir apie tai, kas vyksta, kai produktas išsikristalina.', 'Think about stability and about what happens when the product crystallises.'),
              t('Abu veiksniai stumia pusiausvyrą į fumaro pusę: mažesnė įtampa ir menkas tirpumas. $HCl$ yra katalizatorius ir atsinaujina.', 'Both factors push the equilibrium toward fumaric acid: lower strain and poor solubility. $HCl$ is a catalyst and is regenerated.'))],
            why: t('Pusiausvyrą nulemia ir produktų stabilumas, ir tai, kad vienas jų pasišalina kristalais.', 'The equilibrium is set both by product stability and by one product leaving as crystals.'),
            src: 'Klein'
          },
          {
            id: 'l5.defence.6',
            q: Q('Palyginkite abiejų izomerų dipolius.', 'Compare the dipole moments of the two isomers.'),
            steps: [ch(t('Kurioje molekulėje dipolių suma lygi nuliui?', 'In which molecule do the dipoles sum to zero?'), [
              ['fumaro rūgštyje (trans, simetriška)', 'in fumaric acid (trans, symmetrical)'],
              ['maleino rūgštyje', 'in maleic acid'],
              ['abiejose', 'in both'],
              ['nė vienoje', 'in neither']
            ], 0, t('Kaip nukreipti dipoliai priešingose pusėse?', 'How do dipoles on opposite sides point?'),
              t('Trans izomere $C-COOH$ dipoliai nukreipti priešingai ir susinaikina; cis izomere jie sudedami ir molekulė poliška.', 'In the trans isomer the $C-COOH$ dipoles point opposite ways and cancel; in the cis isomer they add up and the molecule is polar.'))],
            why: t('Poliška molekulė geriau tirpsta vandenyje ir turi kitokias fizines savybes.', 'A polar molecule dissolves better in water and has different physical properties.'),
            src: 'Klein'
          },
          {
            id: 'l5.defence.7',
            q: Q('Kodėl pirmoji maleino rūgšties disociacija stipresnė, o antroji silpnesnė negu fumaro?', 'Why is the first dissociation of maleic acid stronger, and the second weaker, than that of fumaric acid?'),
            steps: [ch(t('Kuri priežastis tinka?', 'Which reason fits?'), [
              ['monoanijoną stabilizuoja vidumolekulinis vandenilio ryšys, todėl antrą $H+$ atskelti sunkiau', 'the monoanion is stabilised by an intramolecular hydrogen bond, so the second $H+$ is harder to remove'],
              ['maleino rūgštis turi daugiau $H$', 'maleic acid has more $H$'],
              ['fumaro rūgštis turi tris $COOH$', 'fumaric acid has three $COOH$'],
              ['skirtumas atsiranda dėl $HCl$', 'the difference comes from $HCl$']
            ], 0, t('Kokioje formoje abi $COOH$ arti?', 'In which form are both $COOH$ close?'),
              t('Cis izomere vienas anijonas ir kita $COOH$ sudaro tiltelį, todėl pirmas $H+$ atskyla lengviau, o antras – sunkiau.', 'In the cis isomer the carboxylate and the other $COOH$ form a bridge, so the first $H+$ leaves more easily and the second less easily.'))],
            why: t('Tas pats vidumolekulinis ryšys paaiškina ir rūgštingumą, ir tirpumą.', 'The same intramolecular bond explains both acidity and solubility.'),
            src: 'Klein'
          },
          {
            id: 'l5.defence.8',
            q: Q('Darbui naudojama konc. $HCl$ ir verdantis tirpalas.', 'The experiment uses conc. $HCl$ and a boiling solution.'),
            steps: [mu(t('Kurios saugumo taisyklės tinka? Pažymėkite visas.', 'Which safety rules apply? Pick all.'), [
              ['dirbti su akiniais ir pirštinėmis', 'wear goggles and gloves'],
              ['kolbos su virinamu mišiniu neuždaryti kamščiu', 'never close the boiling flask with a stopper'],
              ['prie kondensatoriaus prijungti vandenį prieš kaitinant', 'connect the condenser water before heating'],
              ['termometrą po darbo plauti karštu vandeniu', 'wash the thermometer with hot water after the work']
            ], [0, 1, 2], t('Prisiminkite, kaip po darbo tvarkoma aparatūra.', 'Recall how the apparatus is handled after the work.'),
              t('Rūgštis ėsdina, uždaroje sistemoje kyla slėgis, o kondensatorius turi veikti. Termometras plaunamas ne taip kaip kita aparatūra – jis nustatomas atskirai.', 'The acid is corrosive, a closed system builds pressure, and the condenser must run. The thermometer is not washed like the other apparatus; it is put aside separately.'))],
            why: t('Saugumo taisyklės kyla iš to, kokias pavojingas savybes turi medžiagos ir kaip jos reaguoja.', 'Safety rules follow from the hazards of the substances and the way they behave.'),
            src: 'LW5 p2'
          }
        ]
      }
    ],
    coverage: {
      'LW5.1': ['l5.order', 'l5.why', 'l5.observe', 'l5.apparatus', 'l5.defence'],
      'LW5.2': ['l5.order', 'l5.why', 'l5.observe', 'l5.prove', 'l5.apparatus', 'l5.calc'],
      'LW5.3': ['l5.order', 'l5.why', 'l5.observe', 'l5.prove', 'l5.apparatus', 'l5.defence'],
      'LW5.4': ['l5.order', 'l5.why', 'l5.observe', 'l5.apparatus', 'l5.calc', 'l5.defence'],
      'LW5.5': ['l5.order', 'l5.observe', 'l5.prove', 'l5.apparatus', 'l5.calc'],
      'LW5.6': ['l5.why', 'l5.apparatus', 'l5.defence'],
      'LW5.7': ['l5.order', 'l5.prove', 'l5.defence']
    }
  };

  ORG.unit(U);
})(globalThis.ORG = globalThis.ORG || {});
