// site/organic/units/l1.js: lab unit 1, crystallisation and melting point (recrystallisation of benzoic acid)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });

  const BA = 'c1ccccc1C(=O)O';
  const baName = t('benzenkarboksirūgštis', 'benzoic acid');

  // decimal number as text: comma in Lithuanian, point in English
  const num = (x, d, lang) => { const s = x.toFixed(d); return lang === 'lt' ? s.replace('.', ',') : s; };
  const nt = (x, d, suffixLt, suffixEn) => t(num(x, d, 'lt') + (suffixLt || ''), num(x, d, 'en') + (suffixEn === undefined ? (suffixLt || '') : suffixEn));

  // bank builders: the right option is written first (answer 0), the trainer shuffles
  const mc = (id, q, prompt, opts, hint, sol, why, src) => ({
    id, q: [{ p: q }],
    steps: [{ prompt, kind: 'choice', options: opts.map(o => ({ text: o })), answer: 0, hint, solution: sol }],
    why, src
  });
  const ord = (id, q, prompt, items, hint, sol, why, src) => ({
    id, q: [{ p: q }],
    steps: [{ prompt, kind: 'order', options: items.map(o => ({ text: o })), hint, solution: sol }],
    why, src
  });

  ORG.unit({
    id: 'l1',
    notes: [
      {
        id: 'principle',
        title: t('Tikslas ir principas', 'Aim and principle'),
        blocks: [
          { h: t('Kodėl kristalinama', 'Why we recrystallise') },
          {
            p: t('Sintezės produktas beveik niekada nėra visiškai grynas: jame lieka nesureagavusių pradinių medžiagų, šalutinių produktų ir spalvotų priemaišų. Kai priemaišų yra nedaug, kietą produktą galima išvalyti kristalinimu. Šiame darbe valote techninę benzenkarboksirūgštį ir po to nustatote jos lydymosi temperatūrą.',
              'A synthetic product is almost never completely pure: it still holds starting material, by-products and coloured impurities. When the impurities are a small part of the solid, recrystallisation can clean it. In this lab you purify technical benzoic acid and then measure its melting point.'),
            src: 'LW1 p1'
          },
          { mol: { smi: BA, name: baName }, caption: t('Benzenkarboksirūgštis, $C7H6O2$, lydosi apie 122 °C.', 'Benzoic acid, $C7H6O2$, melts at about 122 °C.') },
          {
            rule: t('Kristalinimo principas: daugumos kietų medžiagų tirpumas didėja kylant temperatūrai. Medžiaga ištirpinama karštame tirpiklyje, o vėsdama ji išsiskiria kristalais, nes šaltame tirpiklyje tirpsta mažiau. Priemaišos lieka tirpale, nes jų yra per mažai, kad pasiektų sotinimą, arba jos išfiltruojamos karštos.',
              'The principle of recrystallisation: the solubility of most solids rises with temperature. The substance is dissolved in a hot solvent and crystallises on cooling because it dissolves less in the cold solvent. The impurities stay in solution, since there is too little of them to saturate it, or they are filtered off while hot.'),
            src: 'LW1 p1'
          },
          {
            pitfall: t('Kristalinimas valo tik tada, kai priemaišų mažai. Jei mišinyje maždaug lygiomis dalimis yra dviejų medžiagų, kristalinant pagal šį principą jų neatskirsite.',
              'Recrystallisation cleans only when the impurities are few. A mixture of two substances in comparable amounts will not be separated by it.')
          },
          { practice: 'l1.defence' }
        ]
      },
      {
        id: 'solvent',
        title: t('Tirpiklio parinkimas', 'Choosing the solvent'),
        blocks: [
          {
            p: t('Gerą tirpiklį reikia atrasti bandymu. Pradžioje padeda taisyklė „panašus tirpsta panašiame“: nepolinės medžiagos tirpsta nepoliniuose tirpikliuose, polinės ir turinčios $OH$ ar $COOH$ grupių medžiagos – vandenyje ar alkoholiuose. Bet molekulės dydis ir kitos grupės taip pat svarbu, todėl taisyklė tik nurodo kryptį.',
              'A good solvent has to be found by testing. The rule "like dissolves like" gives a start: non-polar substances dissolve in non-polar solvents, polar ones and those with $OH$ or $COOH$ groups in water or alcohols. Molecular size and other groups matter too, so the rule only gives a direction.'),
            src: 'LW1 p1'
          },
          {
            p: t('Bandymas: į kelis mėgintuvėlius įberiama po 10–15 mg medžiagos ir pilama skirtingų tirpiklių. Stebima, kas vyksta šaltame tirpiklyje, paskui kaitinant, galiausiai vėsinant.',
              'The test: put 10 to 15 mg of the substance in several test tubes and add a different solvent to each. Watch what happens cold, then on heating, and finally on cooling.')
          },
          {
            table: {
              head: [t('Ką matote', 'What you see'), t('Išvada', 'Conclusion')],
              rows: [
                [t('Tirpsta jau šaltame tirpiklyje', 'Dissolves in the cold solvent'), t('Netinka: atvėsus kristalų beveik nebus.', 'Unsuitable: almost no crystals would come back on cooling.')],
                [t('Netirpsta nei šaltame, nei verdančiame, net pridėjus tirpiklio', 'Does not dissolve cold or boiling, even with more solvent'), t('Netinka: nėra iš ko kristalinti.', 'Unsuitable: nothing goes into solution to recrystallise.')],
                [t('Šaltame netirpsta, karštame ištirpsta, atvėsus išsiskiria daug kristalų', 'Insoluble cold, dissolves hot, many crystals form on cooling'), t('Tinka.', 'Suitable.')]
              ]
            },
            src: 'LW1 p1'
          },
          {
            p: t('Jei tinka keli tirpikliai, renkamasi pigiausias, mažiausiai nuodingas ir mažiausiai degus. Benzenkarboksirūgščiai tinka vanduo: šaltame ji tirpsta labai mažai, verdančiame gerokai daugiau.',
              'If several solvents work, the cheapest, least toxic and least flammable one is chosen. Water suits benzoic acid: it dissolves very little cold and much more in boiling water.'),
            src: 'LW1 p2'
          },
          { practice: 'l1.why' },
          { practice: 'l1.solub' }
        ]
      },
      {
        id: 'procedure',
        title: t('Darbo eiga ir kiekvieno žingsnio paskirtis', 'The procedure and what each step is for'),
        blocks: [
          { h: t('Nuo tirpalo iki kristalų', 'From solution to crystals') },
          {
            list: [
              t('**Tirpinimas karštame tirpiklyje.** Medžiaga beriama į nedidelę kolbą ar stiklinę, pilama tirpiklio ir kaitinama iki virimo maišant. Tirpiklio imama kiek įmanoma mažiau, kad tirpalas būtų sotus: kuo daugiau tirpiklio, tuo daugiau produkto lieka tirpale.', '**Dissolving hot.** The solid goes into a small flask or beaker, solvent is added, and the mixture is heated to boiling with stirring. As little solvent as possible is used so that the solution is saturated: the more solvent, the more product stays dissolved.'),
              t('**Aktyvinta anglis.** Jei tirpalas spalvotas, jį kelioms minutėms užviriname su apie 5 % medžiagos masės aktyvintos anglies, kuri sugeria spalvotas priemaišas. Anglis beriama tik nuėmus tirpalą nuo šilumos, kitaip jis staiga išsiveržtų per kolbos kraštą. Pertekliaus vengiama: anglis sugeria ir produktą.', '**Activated charcoal.** If the solution is coloured, it is boiled for a few minutes with about 5 % of the sample mass of activated charcoal, which adsorbs coloured impurities. It is added only after the solution is taken off the heat, otherwise the liquid would foam over. A large excess is avoided: charcoal adsorbs product too.'),
              t('**Karštas filtravimas.** Karštas tirpalas filtruojamas per piltuvėlį su vata ar rievėtu popieriniu filtru, kad liktų netirpios dalelės ir anglis. Filtruojama karštai, kad kristalai neiškristų ant filtro. Todėl dažnai pridedama apie 20 % daugiau tirpiklio.', '**Hot filtration.** The hot solution goes through a funnel with cotton wool or a fluted paper filter, which keeps back insoluble particles and the charcoal. It is done hot so that crystals do not form on the filter; for the same reason about 20 % extra solvent is often added.'),
              t('**Lėtas aušinimas.** Filtratas paliekamas vėsti iki kambario temperatūros, paskui statomas į kristalizatorių su ledu. Lėtai augantys kristalai būna dideli ir švarūs, o staigiai atšaldyti sudaro smulkią masę, kuri sugeria priemaišas.', '**Slow cooling.** The filtrate cools to room temperature, then goes into a crystalliser with ice. Crystals that grow slowly are large and clean, while a shock-cooled solution gives a fine mass that traps impurities.'),
              t('**Filtravimas vakuume.** Kristalai atskiriami Biuchnerio piltuvu, sujungtu su Bunzeno kolba ir vandens čiurkšlės siurbliu. Kristalai praplaunami nedideliu kiekiu šalto tirpiklio ir nuspaudžiami.', '**Vacuum filtration.** The crystals are separated with a Büchner funnel on a Bunsen flask connected to a water aspirator. They are rinsed with a little cold solvent and pressed dry.'),
              t('**Džiovinimas.** Kristalai džiovinami ore arba džiovinimo spintoje, kurios temperatūra 30–50 °C žemesnė už medžiagos lydymosi temperatūrą. Taip kristalai nesuminkštėja.', '**Drying.** The crystals are dried in air or in a drying cabinet kept 30 to 50 °C below the melting point of the substance, so that they do not soften.')
            ],
            ordered: true,
            src: 'LW1 p2'
          },
          {
            rule: t('Pabaigus vakuuminį filtravimą, pirmiausia atjungiama žarna nuo siurblio, ir tik tada uždaromas vanduo. Priešingai nutiktų, kad vanduo būtų įsiurbtas atgal į Bunzeno kolbą.',
              'After vacuum filtration, first disconnect the hose from the aspirator and only then shut the water. In the opposite order water would be drawn back into the Bunsen flask.'),
            src: 'LW1 p4'
          },
          {
            p: t('Filtratas renkamas į švarią Erlenmejerio kolbą ir saugomas atidžiai, nes jame yra produktas.',
              'The filtrate is collected in a clean Erlenmeyer flask and guarded carefully, since the product is in it.'),
            src: 'LW1 p5'
          },
          {
            pitfall: t('Jei kristalai neišsiskiria, nereikia šalinti tirpalo. Paprastai kaltas per didelis tirpiklio kiekis arba tirpalas persotintas: įtrinkite kolbos sienelę stikline lazdele ar įmeskite kristaliuką.',
              'If no crystals form, do not discard the solution. Usually there is too much solvent, or the solution is supersaturated: scratch the flask wall with a glass rod or add a seed crystal.'),
            src: 'LW1 p3'
          },
          { practice: 'l1.order' },
          { practice: 'l1.observe' },
          { practice: 'l1.app' }
        ]
      },
      {
        id: 'mp',
        title: t('Lydymosi temperatūra', 'Melting point'),
        blocks: [
          {
            p: t('Lydymosi temperatūra – riba, ties kuria kristalinė medžiaga pradeda skystėti. Praktiškai nurodomas intervalas: nuo pirmojo skysčio lašo iki visiško išsilydymo. Tai medžiagos konstanta ir svarbiausias grynumo rodiklis.',
              'The melting point marks where a crystalline substance changes to a liquid. In practice a range is reported, from the first drop of liquid to complete melting. It is a physical constant and the main criterion of purity.'),
            src: 'LW1 p4'
          },
          {
            rule: t('Gryna medžiaga lydosi siaurame intervale (apie 0,1–1 °C), artimame literatūrinei vertei. Priemaišos lydymosi temperatūrą sumažina, o intervalą išplečia.',
              'A pure substance melts over a narrow range (about 0.1 to 1 °C) close to the literature value. Impurities lower the melting point and widen the range.'),
            src: 'LW1 p4'
          },
          {
            p: t('Tikslūs matavimai atliekami kapiliare: į plonasienį stiklinį vamzdelį įberiama šiek tiek susmulkintos medžiagos ir jis įstatomas į šildomą aparatą. Pirmą kartą temperatūra pakeliama greitai, kad sužinotumėte apytikslę vertę, o antrą kartą prie jos artėjama lėtai, apie 1–2 °C per minutę.',
              'Exact measurements are made in a capillary: a little ground solid is tapped into a thin glass tube and placed in a heated apparatus. The first run is quick, to find the approximate value, and the second approaches it slowly, about 1 to 2 °C per minute.')
          },
          {
            p: t('**Mišrioji lydymosi temperatūra.** Jei dviejų mėginių lydymosi temperatūros vienodos, juos sumaišius galima patikrinti, ar tai ta pati medžiaga. Tokiu atveju mišinys lydosi nepakitusiame intervale. Jei medžiagos skirtingos, mišinio lydymosi temperatūra krinta, o intervalas plečiasi.',
              '**Mixed melting point.** If two samples have the same melting point, mixing them shows whether they are the same substance. If they are, the mixture melts over the unchanged range. If they differ, the mixture melts lower and over a wider range.'),
            src: 'LW1 p4'
          },
          {
            pitfall: t('Vienoda lydymosi temperatūra dar nereiškia vienodos medžiagos: skirtingi junginiai gali lydytis panašiai. Todėl identiteto patikrai reikalinga mišrioji lydymosi temperatūra. Drėgni kristalai taip pat lydosi žemiau ir plačiau, todėl prieš matuojant juos reikia gerai išdžiovinti.',
              'The same melting point does not prove the same substance, because different compounds may melt alike. That is why the mixed melting point is needed to check identity. Damp crystals also melt lower and wider, so dry them well before measuring.')
          },
          { practice: 'l1.mp' },
          { practice: 'l1.proof' }
        ]
      },
      {
        id: 'yield',
        title: t('Išeiga', 'Yield'),
        blocks: [
          {
            p: t('Kristalinimo išeiga rodo, kokią dalį medžiagos pavyko atgauti. Dalis visada lieka motininiame tirpale, nes net šaltame tirpiklyje medžiaga šiek tiek tirpsta, todėl išeiga visada mažesnė už 100 %.',
              'The recovery shows what part of the material came back. Some always stays in the mother liquor, because the substance still dissolves a little in the cold solvent, so it is always below 100 %.'),
            src: 'LW1 p5'
          },
          {
            rule: t('Išeiga (%) = išdžiovintų kristalų masė : pradinės medžiagos masė × 100.', 'Yield (%) = mass of dry crystals : mass of starting material × 100.'),
            src: 'LW1 p5'
          },
          {
            example: {
              q: [
                { p: t('Kristalinant paimta 1,00 g techninės benzenkarboksirūgšties, o išdžiovinta 0,72 g kristalų. Kokia išeiga ir ar toks rezultatas tikėtinas?', 'In a recrystallisation 1.00 g of technical benzoic acid was taken and 0.72 g of dry crystals was obtained. What is the yield, and is it plausible?') },
                { mol: { smi: BA, name: baName } }
              ],
              steps: [
                [{ p: t('Užrašome santykį: $0,72 : 1,00$.', 'Write the ratio: $0.72 : 1.00$.') }],
                [{ p: t('Padauginame iš 100: išeiga yra 72 %.', 'Multiply by 100: the yield is 72 %.') }],
                [{ p: t('Skaičius mažesnis už 100 % ir nėra labai mažas, todėl tai tikėtinas rezultatas. Likusius apie 28 % sudaro motininiame tirpale ištirpusi medžiaga ir priemaišos.', 'The number is below 100 % and not very low, so it is plausible. The remaining 28 % or so is product dissolved in the mother liquor plus impurities.') }]
              ]
            },
            claims: [{ formula: [BA, 'C7H6O2'] }, { name: [BA, baName] }]
          },
          {
            pitfall: t('Išeiga, didesnė už 100 %, rodo klaidą: kristalai neišdžiūvo arba juose lieka priemaišų.',
              'A yield above 100 % points to a mistake: the crystals are not dry or still hold impurities.')
          },
          { practice: 'l1.yield' }
        ]
      },
      {
        id: 'safety',
        title: t('Saugus darbas', 'Working safely'),
        blocks: [
          {
            list: [
              t('Akys saugomos akiniais. Benzenkarboksirūgštis dirgina akis ir kvėpavimo takus.', 'Wear goggles. Benzoic acid irritates the eyes and the airways.'),
              t('Verdantis vanduo ir elektrinė viryklė gali nudeginti. Kolba niekada nekaitinama uždara.', 'Boiling water and the electric hot plate can burn. Never heat a closed flask.'),
              t('Aktyvinta anglis beriama tik nuėmus tirpalą nuo šilumos, kitaip jis išsiverš.', 'Add activated charcoal only after taking the solution off the heat, otherwise it foams over.'),
              t('Darbo pabaigoje aparatūra (išskyrus termometrą) nuplaunama šiltu vandeniu, o bendro naudojimo priemonės grąžinamos į vietą.', 'At the end the apparatus (except the thermometer) is washed with warm water, and shared items go back to their place.')
            ],
            src: 'LW1 p5'
          },
          { practice: 'l1.proof' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        list: [
          t('Kristalinimas valo kietą medžiagą: karštas, sotus tirpalas atvėsta, ir išsiskiria grynesni kristalai.', 'Recrystallisation cleans a solid: a hot, saturated solution cools and purer crystals separate.'),
          t('Tinkamas tirpiklis: šaltame netirpina, karštame tirpina, atvėsus kristalai išsiskiria; pigus ir saugus.', 'A good solvent: does not dissolve the substance cold, dissolves it hot, gives crystals on cooling; cheap and safe.'),
          t('Tirpiklio – minimaliai, kad nuostolių būtų kuo mažiau. Karštas filtravimas šalina netirpias dalis ir anglį.', 'Use a minimum of solvent to limit losses. Hot filtration removes insoluble matter and charcoal.'),
          t('Aušinama lėtai: didesni ir švaresni kristalai. Filtruojama vakuume, plaunama nedideliu šalto tirpiklio kiekiu.', 'Cool slowly: larger, cleaner crystals. Filter under vacuum and rinse with a little cold solvent.'),
          t('Gryna medžiaga lydosi siaurame intervale ir aukštesnėje temperatūroje; priemaišos lydymąsi nukelia žemyn ir išplečia.', 'A pure substance melts over a narrow range at a higher temperature; impurities lower the melting point and widen the range.'),
          t('Mišrioji lydymosi temperatūra be pokyčio: ta pati medžiaga. Su sumažėjimu: skirtingos.', 'A mixed melting point with no change: the same substance. With a drop: different substances.'),
          t('Išeiga (%) = gautų kristalų masė : pradinė masė × 100.', 'Yield (%) = mass of crystals obtained : starting mass × 100.')
        ]
      }
    ],
    types: [
      /* ----- order the steps ----- */
      {
        id: 'l1.order',
        title: t('Veiksmų seka', 'Order of the steps'),
        mirrors: ['LW1.3', 'LW1.4', 'LW1.7'],
        bank: [
          ord('l1.order.1',
            t('Reikia išvalyti kietą medžiagą kristalinant.', 'A solid is to be purified by recrystallisation.'),
            t('Sudėkite pagrindinius kristalinimo etapus teisinga tvarka.', 'Put the main stages of recrystallisation in the right order.'),
            [t('ištirpinti minimaliame karšto tirpiklio kiekyje', 'dissolve in the minimum of hot solvent'),
              t('karštai nufiltruoti netirpias dalis', 'filter off insoluble matter while hot'),
              t('lėtai atvėsinti filtratą', 'cool the filtrate slowly'),
              t('kristalus atskirti vakuuminiu filtravimu', 'separate the crystals by vacuum filtration'),
              t('praplauti šaltu tirpikliu', 'rinse with cold solvent'),
              t('išdžiovinti', 'dry')],
            t('Pagalvokite, kada priemaišos dar ištirpusios, o kada produktas jau kristalų pavidalo.', 'Think about when the impurities are still dissolved and when the product is already crystalline.'),
            t('Medžiaga pirma tirpinama, tada šalinamos netirpios dalys, kol produktas dar tirpale. Po aušinimo kristalai atskiriami, plaunami ir tik tada džiovinami.', 'The substance is dissolved first, insoluble matter is removed while the product is still in solution. After cooling the crystals are separated, rinsed and only then dried.'),
            t('Kiekvienas etapas paruošia kitą: tirpalas, kuriame produktas ištirpęs, leidžia pašalinti kietas priemaišas, o šaltis išskiria produktą.', 'Each stage prepares the next: a solution with the product dissolved lets solid impurities be removed, and cold separates the product.'), 'LW1 p1'),
          ord('l1.order.2',
            t('Benzenkarboksirūgštis kristalinama iš vandens.', 'Benzoic acid is recrystallised from water.'),
            t('Išdėstykite veiksmus tinkama tvarka.', 'Arrange the actions in the right order.'),
            [t('užpilti vandens ant medžiagos ir kaitinti maišant, kol ištirps', 'add water to the solid and heat with stirring until it dissolves'),
              t('karštą tirpalą nufiltruoti į švarią Erlenmejerio kolbą', 'filter the hot solution into a clean Erlenmeyer flask'),
              t('kolbą atvėsinti ledo vandens vonioje', 'cool the flask in an ice-water bath'),
              t('kristalus nufiltruoti Biuchnerio piltuvu', 'filter the crystals on the Büchner funnel'),
              t('kristalus praplauti nedideliu šalto vandens kiekiu', 'rinse the crystals with a little cold water'),
              t('džiovinti ir pasverti', 'dry and weigh')],
            t('Kuris veiksmas turi būti prieš kitą, kad filtravimas vyktų su tirpalu, o ne su kristalais?', 'Which action has to come before which, so that the first filtration deals with a solution and not crystals?'),
            t('Pirma gaunamas karštas tirpalas ir jis filtruojamas, kol produktas dar ištirpęs. Tada vėsinama, filtruojama dar kartą (dabar ant filtro lieka produktas), plaunama ir džiovinama.', 'A hot solution is made first and filtered while the product is dissolved. Then it is cooled and filtered a second time (now the product stays on the filter), rinsed and dried.'),
            t('Yra du filtravimai, kurių paskirtis priešinga: pirmas šalina priemaišas ir palieka produktą tirpale, antras atskiria produktą nuo tirpalo.', 'There are two filtrations with opposite purposes: the first removes impurities and keeps the product in solution, the second separates the product from the solution.'), 'LW1 p5'),
          ord('l1.order.3',
            t('Kristalai filtruojami vakuume Biuchnerio piltuvu.', 'The crystals are filtered under vacuum on a Büchner funnel.'),
            t('Sudėkite veiksmus teisinga seka.', 'Put the actions in the right order.'),
            [t('filtro popierių įdėti į piltuvą ir sudrėkinti tirpikliu', 'place the filter paper in the funnel and wet it with solvent'),
              t('įjungti vakuumą', 'switch on the vacuum'),
              t('supilti kristalų suspensiją, išplauti indą motininiu tirpalu', 'pour in the crystal suspension and rinse the vessel with the mother liquor'),
              t('kristalus nuplauti keliais lašais šalto tirpiklio ir nuspausti', 'wash the crystals with a few drops of cold solvent and press them'),
              t('atjungti žarną nuo siurblio', 'disconnect the hose from the aspirator'),
              t('užsukti vandens čiaupą', 'turn off the water tap')],
            t('Atkreipkite dėmesį, kurioje vietoje vakuumas turi dar veikti, o kada jau pavojinga jį palikti.', 'Notice at which points the vacuum must still work and when it becomes risky to leave it on.'),
            t('Popierius turi priglusti prieš pilant, kad kristalai nepraslystų. Kai vakuumas dirba, suspensija pilama ir kristalai plaunami. Pabaigoje pirma atjungiama žarna, o tik paskui užsukamas čiaupas, kad vanduo neįsiurbtų atgal.', 'The paper must be seated before pouring so crystals do not slip past. While the vacuum runs, the suspension is poured and the crystals rinsed. At the end the hose is disconnected first and the tap closed afterwards, so that water is not drawn back.'),
            t('Tvarką lemia švara ir saugumas: popierius turi gerai priglusti, o vanduo negali būti įsiurbtas atgal į kolbą.', 'The order is set by cleanliness and safety: the paper must be seated well, and water must not be drawn back into the flask.'), 'LW1 p4'),
          ord('l1.order.4',
            t('Matuojate benzenkarboksirūgšties lydymosi temperatūrą kapiliare.', 'You measure the melting point of benzoic acid in a capillary.'),
            t('Išdėstykite matavimo etapus.', 'Arrange the stages of the measurement.'),
            [t('į kapiliarą įberti truputį smulkių sausų kristalų', 'tap a little fine, dry crystals into the capillary'),
              t('greitai pašildyti ir pamatyti apytikslę lydymosi temperatūrą', 'heat quickly to see the approximate melting point'),
              t('leisti aparatui atvėsti ir paimti naują kapiliarą', 'let the apparatus cool and take a fresh capillary'),
              t('prie apytikslės vertės šildyti lėtai, apie 1–2 °C per minutę', 'near the approximate value heat slowly, about 1 to 2 °C per minute'),
              t('užrašyti temperatūrą, kai pasirodo pirmasis lašas, ir kai viskas išsilydo', 'record the temperature when the first drop appears and when all has melted')],
            t('Kodėl pirmas matavimas negali būti galutinis?', 'Why cannot the first measurement be the final one?'),
            t('Greitas pašildymas parodo, kur ieškoti. Naudoti jau lydytą medžiagą negalima, todėl imamas naujas kapiliaras. Tikslus intervalas nustatomas lėtai šildant, kad termometro rodmuo spėtų sekti mėginio temperatūrą.', 'The quick run shows where to look. Already melted material cannot be reused, so a fresh capillary is taken. The exact range is found by slow heating, so that the thermometer reading can keep up with the sample temperature.'),
            t('Greitai šildant termometras atsilieka nuo mėginio ir nuskaityta vertė nukrypsta, todėl tiksli vertė gaunama tik lėtai.', 'Under fast heating the thermometer lags behind the sample and the reading drifts, so the exact value is only obtained slowly.'), 'LW1 p4'),
          ord('l1.order.5',
            t('Tirpalas nuspalvintas priemaišų.', 'The solution is coloured by impurities.'),
            t('Sudėkite spalvos šalinimo veiksmus.', 'Put the colour-removal actions in order.'),
            [t('medžiagą ištirpinti karštame tirpiklyje', 'dissolve the substance in hot solvent'),
              t('tirpalą nuimti nuo šilumos', 'take the solution off the heat'),
              t('įberti nedidelį kiekį aktyvintos anglies', 'add a small amount of activated charcoal'),
              t('apie 5–10 min pavirinti', 'boil for about 5 to 10 min'),
              t('karštai nufiltruoti per tankų filtrą', 'filter hot through a tight filter')],
            t('Kas atsitiktų, jei anglies berti į jau verdantį skystį?', 'What would happen if charcoal were added to liquid that is already boiling?'),
            t('Smulkios anglies dalelės sudaro daug užuomazgų, ir perkaitęs tirpalas staiga užverda bei išsiverčia. Todėl pirma nuimama nuo šilumos. Po virinimo anglis šalinama filtruojant per tankų filtrą, kad dulkės neprasiskverbtų.', 'Fine charcoal gives a great many nucleation sites, and an overheated solution boils up and over at once. That is why it is taken off the heat first. Afterwards the charcoal is removed by filtering through a tight filter so that the dust does not pass.'),
            t('Anglis sugeria spalvotas priemaišas tik tada, kai tirpalas kontaktuoja su ja pakankamai ilgai, o šalinama filtruojant.', 'Charcoal adsorbs coloured impurities only when it stays in contact with the solution long enough, and it is removed by filtration.'), 'LW1 p2'),
          ord('l1.order.6',
            t('Reikia ištirpinti kietą medžiagą kristalinimui.', 'A solid is to be dissolved for recrystallisation.'),
            t('Sudėkite tirpinimo žingsnius.', 'Put the dissolving steps in order.'),
            [t('medžiagą susmulkinti', 'grind the substance'),
              t('į kolbą su kondensatoriumi įpilti mažiau tirpiklio, nei tikimasi prireikti', 'put less solvent than you expect to need into the flask with the condenser'),
              t('užvirinti', 'bring to the boil'),
              t('mažomis porcijomis pilti dar karšto tirpiklio, kol ištirps', 'add more hot solvent in small portions until it dissolves'),
              t('pastebėjus skaidrų tirpalą, nustoti pilti', 'stop adding once the solution is clear')],
            t('Ką turėtumėte daryti su pirmąja tirpiklio porcija, jei nežinote, kiek jo reikės?', 'What should you do with the first portion of solvent if you do not know how much will be needed?'),
            t('Smulkinta medžiaga tirpsta greičiau. Pradedama nuo per mažo tirpiklio kiekio, nes jį galima papildyti, o per daug įpilto pašalinti sunku. Pridedama po truputį, kol pamatoma skaidrus tirpalas.', 'Ground solid dissolves faster. One starts with too little solvent because more can be added, while too much is hard to take out. Solvent is added little by little until the solution is clear.'),
            t('Perteklinis tirpiklis tiesiogiai mažina išeigą, todėl jo dedama minimaliai.', 'Excess solvent directly lowers the yield, so the minimum is used.'), 'LW1 p2'),
          ord('l1.order.7',
            t('Tirpiklį parenkate bandymais su mažais kiekiais.', 'You pick the solvent by trying small amounts.'),
            t('Išdėstykite bandymo etapus.', 'Arrange the stages of the test.'),
            [t('į mėgintuvėlį įberti 10–15 mg medžiagos ir įlašinti tirpiklio', 'put 10 to 15 mg of the substance in a test tube and add some solvent'),
              t('pamatyti, ar tirpsta šaltame', 'see whether it dissolves cold'),
              t('jei netirpsta, kaitinti iki virimo', 'if it does not, heat to boiling'),
              t('jei ištirpo, atvėsinti', 'if it dissolved, cool'),
              t('įvertinti, ar išsiskyrė daug kristalų', 'judge whether many crystals separated')],
            t('Kurioje vietoje jau galima atmesti tirpiklį?', 'At which point can a solvent be ruled out already?'),
            t('Jei medžiaga tirpsta šaltame, tirpiklis atmetamas iš karto. Jei netirpsta ir verdant, galima įpilti daugiau, o jei ir tada netirpsta, atmetama. Tirpiklis tinka tik tada, kai medžiaga tirpsta karštame ir išsiskiria vėstant.', 'If the substance dissolves cold, the solvent is rejected at once. If it does not dissolve even boiling, a little more can be added, and if it still does not, it is rejected. Only when it dissolves hot and separates on cooling does the solvent qualify.'),
            t('Geras tirpiklis tirpina labai skirtingai šaltas ir karštas, todėl bandoma abiem sąlygomis.', 'A good solvent dissolves very differently cold and hot, which is why both conditions are tried.'), 'LW1 p1'),
          ord('l1.order.8',
            t('Kristalai jau nufiltruoti ir plaunami.', 'The crystals have been filtered and rinsed.'),
            t('Išdėstykite baigiamuosius darbus.', 'Arrange the closing tasks.'),
            [t('išdžiovinti kristalus džiovinimo spintoje', 'dry the crystals in the drying cabinet'),
              t('pasverti sausus kristalus', 'weigh the dry crystals'),
              t('apskaičiuoti išeigą', 'calculate the yield'),
              t('nustatyti lydymosi temperatūrą', 'determine the melting point'),
              t('aparatūrą išplauti ir grąžinti į vietą', 'wash the apparatus and put it back')],
            t('Kodėl svėrimas negali būti pirma džiovinimo?', 'Why can weighing not come before drying?'),
            t('Drėgni kristalai sveria daugiau ir lydosi žemiau, todėl pirma džiovinama. Svoris reikalingas išeigai, o lydymosi temperatūra parodo, ar produktas švarus. Plovimas paliekamas pabaigai.', 'Wet crystals weigh more and melt lower, so they are dried first. The mass is needed for the yield, and the melting point shows whether the product is clean. Washing is left to the end.'),
            t('Rezultatai skaičiuojami tik iš sauso produkto, kitaip svoris ir lydymosi temperatūra klaidina.', 'Results are taken only from the dry product, otherwise the mass and the melting point mislead.'), 'LW1 p5')
        ]
      },

      /* ----- why this step ----- */
      {
        id: 'l1.why',
        title: t('Kodėl taip daroma?', 'Why is it done this way?'),
        mirrors: ['LW1.1', 'LW1.2', 'LW1.7'],
        bank: [
          mc('l1.why.1',
            t('Medžiagai tirpinti pilama tirpiklio tik tiek, kad ji vos ištirptų verdant.', 'Only as much solvent as is needed to just dissolve the solid at the boil is added.'),
            t('Kodėl vengiama tirpiklio pertekliaus?', 'Why is an excess of solvent avoided?'),
            [t('Didesnis tirpiklio kiekis atvėsus išlaiko daugiau produkto ištirpusio, todėl kristalų gaunama mažiau.', 'More solvent keeps more product dissolved after cooling, so fewer crystals are obtained.'),
              t('Perteklinis tirpiklis reaguoja su produktu.', 'Excess solvent reacts with the product.'),
              t('Perteklinis tirpiklis padidina medžiagos lydymosi temperatūrą.', 'Excess solvent raises the melting point of the substance.'),
              t('Verdant tirpiklio perteklius greičiau garuoja ir sprogsta.', 'Excess solvent evaporates too fast on boiling and explodes.')],
            t('Pagalvokite, kiek medžiagos tirpale lieka vėsstant, jei skysčio daug.', 'Think about how much substance remains dissolved on cooling if there is a lot of liquid.'),
            t('Net šaltame tirpiklyje medžiaga šiek tiek tirpsta. Ištirpusi dalis proporcinga tirpiklio tūriui, todėl kuo daugiau tirpiklio, tuo daugiau produkto praranda motininis tirpalas.', 'Even in cold solvent the substance dissolves a little. The dissolved part is proportional to the volume of solvent, so the more solvent there is, the more product the mother liquor takes.'),
            t('Išeigą riboja tirpumas šaltame tirpiklyje, todėl tirpiklio turi būti minimaliai.', 'The yield is limited by the solubility in the cold solvent, so the solvent volume is kept to a minimum.'), 'LW1 p1'),
          mc('l1.why.2',
            t('Tirpalas su netirpiomis priemaišomis filtruojamas karštas.', 'A solution with insoluble impurities is filtered hot.'),
            t('Kodėl filtruojama karštai, o ne atvėsus?', 'Why is it filtered hot rather than cold?'),
            [t('Atvėsus produktas išsiskirtų ir liktų ant filtro kartu su priemaišomis.', 'On cooling the product would crystallise and stay on the filter together with the impurities.'),
              t('Karštas tirpalas greičiau tirpdo filtro popierių.', 'A hot solution dissolves the filter paper faster.'),
              t('Šaltas tirpalas gali praeiti pro filtrą pernelyg lėtai, bet produktas nepasikeistų.', 'A cold solution may pass the filter too slowly, but the product would stay the same.'),
              t('Karštame tirpale priemaišos tampa tirpios.', 'Impurities become soluble in the hot solution.')],
            t('Kur liktų produktas, jei tirpalas atvėstų pirma filtravimo?', 'Where would the product end up if the solution cooled before filtration?'),
            t('Kol tirpalas karštas, produktas ištirpęs ir praeina pro filtrą, o netirpios dalelės ir anglis lieka. Atvėsus produktas kristalizuotųsi ant filtro ir būtų prarastas.', 'While the solution is hot the product is dissolved and passes through, while insoluble particles and charcoal stay behind. If it cooled, the product would crystallise on the filter and be lost.'),
            t('Karštas filtravimas atskiria tai, kas netirpsta, nuo to, kas turi likti tirpale.', 'Hot filtration separates what never dissolves from what has to stay in solution.'), 'LW1 p2'),
          mc('l1.why.3',
            t('Tirpalas po filtravimo paliekamas ramiai vėsti.', 'After filtering, the solution is left to cool quietly.'),
            t('Kodėl rekomenduojama aušinti lėtai?', 'Why is slow cooling recommended?'),
            [t('Lėtai augantys kristalai būna didesni ir tvarkingesni, todėl į juos patenka mažiau priemaišų.', 'Slowly growing crystals are larger and more orderly, so fewer impurities are included in them.'),
              t('Lėtai vėsstant tirpumas didėja, todėl daugiau produkto ištirpsta.', 'The solubility increases on slow cooling, so more product dissolves.'),
              t('Greitas aušinimas ištirpina priemaišas, kurios jau buvo išsiskyrusios.', 'Fast cooling dissolves impurities that had already separated.'),
              t('Lėtas aušinimas leidžia tirpikliui garuoti ir didina išeigą.', 'Slow cooling lets the solvent evaporate and raises the yield.')],
            t('Palyginkite, kaip kristalai auga lėtai ir kaip greitai.', 'Compare how crystals grow slowly and how they grow quickly.'),
            t('Greitai atšaldžius susidaro daug smulkių kristalų, o tarp jų lieka motininio tirpalo su priemaišomis. Lėtai augantis kristalas kaupia tik savo molekules, o pašalines palieka tirpale.', 'Quick chilling gives many fine crystals with mother liquor and its impurities trapped between them. A slowly growing crystal takes up only its own molecules and leaves the foreign ones in solution.'),
            t('Kristalinimo valymas remiasi tuo, kad kristalinė gardelė atrenka savo molekules; skubant ši atranka suprastėja.', 'Purification by crystallisation relies on the crystal lattice selecting its own molecules; haste weakens this selection.'), 'LW1 p3'),
          mc('l1.why.4',
            t('Nufiltruoti kristalai plaunami, bet tik nedideliu šalto tirpiklio kiekiu.', 'The filtered crystals are rinsed, but only with a small amount of cold solvent.'),
            t('Kodėl plaunama tik šaltu ir nedideliu kiekiu?', 'Why only cold and only a little?'),
            [t('Šaltas tirpiklis nuplauna motininį tirpalą nuo paviršiaus ir ištirpdo mažai produkto.', 'Cold solvent washes the mother liquor from the surface and dissolves little product.'),
              t('Karštas tirpiklis sulaikytų priemaišas ant kristalų.', 'Hot solvent would hold impurities on the crystals.'),
              t('Šaltas tirpiklis chemiškai neutralizuoja priemaišas.', 'Cold solvent chemically neutralises the impurities.'),
              t('Didelis kiekis šalto tirpiklio gali padidinti kristalų masę.', 'A large amount of cold solvent could raise the mass of the crystals.')],
            t('Ar šaltas tirpiklis gali ištirpinti daug jau išsiskyrusių kristalų?', 'Can a cold solvent dissolve many crystals that have already separated?'),
            t('Ant kristalų paviršiaus lieka priemaišų turinčio motininio tirpalo plėvelė. Šaltas tirpiklis ją nuplauna, o kristalų beveik netirpdo. Šiltas arba didelis kiekis tirpintų ir produktą.', 'A film of impurity-bearing mother liquor stays on the crystal surfaces. Cold solvent rinses it away while hardly dissolving the crystals. Warm solvent or a large amount would dissolve product too.'),
            t('Plovimo tikslas yra pašalinti paviršiaus tirpalą, o ne tirpinti produktą.', 'The aim of rinsing is to remove surface solution, not to dissolve the product.'), 'LW1 p4'),
          mc('l1.why.5',
            t('Aktyvinta anglis dedama tik į nuimtą nuo viryklės tirpalą.', 'Activated charcoal goes only into a solution taken off the hot plate.'),
            t('Kodėl?', 'Why?'),
            [t('Smulkių dalelių sukeltas staigus virimas galėtų išmesti tirpalą iš kolbos.', 'Sudden boiling set off by the fine particles could throw the solution out of the flask.'),
              t('Anglis veikia tik šaltame tirpale.', 'Charcoal works only in a cold solution.'),
              t('Karšta anglis reaguoja su tirpikliu.', 'Hot charcoal reacts with the solvent.'),
              t('Verdant anglis ištirpsta ir nebeadsorbuoja.', 'Charcoal dissolves on boiling and stops adsorbing.')],
            t('Ką daro smulkios kietos dalelės perkaitintame skystyje?', 'What do fine solid particles do in a superheated liquid?'),
            t('Dalelės tampa virimo centrais, tad perkaitęs skystis staiga išverda ir išsiveržia. Anglis adsorbuoja priemaišas ir karštame, ir pavėsintame tirpale.', 'The particles become boiling centres, so an overheated liquid boils up all at once and surges out. Charcoal adsorbs impurities in a hot or slightly cooled solution alike.'),
            t('Saugumo klausimas: smulkią kietą medžiagą į karštą skystį beriama atsargiai ir tik nuėmus šilumą.', 'A safety matter: fine solids are added to a hot liquid carefully and only off the heat.'), 'LW1 p2'),
          mc('l1.why.6',
            t('Spalvotam tirpalui pridedama tik apie 5 % medžiagos masės aktyvintos anglies, o ne kelis kartus daugiau.', 'Only about 5 % of the sample mass of activated charcoal is added to a coloured solution, not several times more.'),
            t('Kodėl nenaudojama daugiau?', 'Why is no more used?'),
            [t('Anglis sugeria ir produktą, todėl daug anglies mažina išeigą.', 'Charcoal also adsorbs the product, so a lot of charcoal lowers the yield.'),
              t('Daug anglies užkemša kondensatorių.', 'A lot of charcoal blocks the condenser.'),
              t('Daug anglies padidina tirpiklio virimo temperatūrą.', 'A lot of charcoal raises the boiling point of the solvent.'),
              t('Daug anglies ištirpsta ir nuspalvina tirpalą juodai.', 'A lot of charcoal dissolves and colours the solution black.')],
            t('Ar anglis atskiria spalvotą priemaišą nuo produkto, ar sugeria tai, kas priglunda prie jos paviršiaus?', 'Does charcoal tell a coloured impurity from the product, or adsorb whatever sticks to its surface?'),
            t('Anglis yra labai porėta ir nesirenka medžiagos pagal vertingumą: ji sugeria ir priemaišas, ir dalį produkto. Todėl jos dedama tik tiek, kad pašalintų spalvą.', 'Charcoal is highly porous and does not choose by value: it adsorbs both impurities and a share of the product. So only as much is used as removes the colour.'),
            t('Adsorbentas nėra selektyvus, todėl kiekis derinamas prie spalvos, o ne didinamas apsidraudžiant.', 'The adsorbent is not selective, so the amount is matched to the colour and not raised just to be safe.'), 'LW1 p2'),
          mc('l1.why.7',
            t('Pabaigus filtravimą vakuume, atjungiama žarna, tik tada užsukamas vandens čiaupas.', 'After vacuum filtration the hose is disconnected first and the water tap closed afterwards.'),
            t('Kodėl svarbi ši tvarka?', 'Why does this order matter?'),
            [t('Jei čiaupas užsuktas, o žarna dar prijungta, slėgių skirtumas gali įtraukti vandenį atgal į Bunzeno kolbą ir užteršti filtratą.', 'If the tap is closed while the hose is still connected, the pressure difference can draw water back into the Bunsen flask and contaminate the filtrate.'),
              t('Kitaip vakuumas ištrauktų kristalus pro filtrą.', 'Otherwise the vacuum would pull the crystals through the filter.'),
              t('Kitaip čiaupas įkaistų nuo vakuumo.', 'Otherwise the tap would heat up from the vacuum.'),
              t('Kitaip sulūžtų Biuchnerio piltuvas.', 'Otherwise the Büchner funnel would break.')],
            t('Kur būna mažesnis slėgis: kolboje ar čiurkšlės siurblyje, kai vandens srovė silpsta?', 'Where is the pressure lower when the water flow weakens: in the flask or in the aspirator?'),
            t('Vakuume kolboje slėgis žemesnis negu išorėje. Sustojus vandens srovei, skystis siurblyje gali pasitraukti link mažesnio slėgio, t. y. į kolbą. Atjungus žarną slėgiai susilygina.', 'In vacuum the pressure in the flask is lower than outside. When the water flow stops, liquid in the aspirator can move toward the lower pressure, that is into the flask. Disconnecting the hose equalises the pressures.'),
            t('Visada pirma sulyginamas slėgis, o tik paskui nutraukiamas jo šaltinis.', 'The pressure is always equalised first and its source stopped afterwards.'), 'LW1 p4'),
          mc('l1.why.8',
            t('Išplauti kristalai džiovinami spintoje, kurios temperatūra 30–50 °C žemesnė už jų lydymosi temperatūrą.', 'The rinsed crystals are dried in a cabinet that stays 30 to 50 °C below their melting point.'),
            t('Kodėl aukštesnė temperatūra netinka?', 'Why would a higher temperature not do?'),
            [t('Arti lydymosi temperatūros kristalai minkštėja, lydosi ar sulimpa, o tai blogina grynumą.', 'Close to the melting point the crystals soften, melt or stick together, which spoils purity.'),
              t('Aukštesnė temperatūra paverčia kristalus kitu junginiu.', 'A higher temperature turns the crystals into another compound.'),
              t('Aukštesnėje temperatūroje drėgmė sugrįžta į kristalus.', 'At a higher temperature moisture returns into the crystals.'),
              t('Džiovinimo spintos neveikia aukštesnėje nei 50 °C temperatūroje.', 'Drying cabinets do not work above 50 °C.')],
            t('Kas atsitinka su medžiaga, kai temperatūra artėja prie jos lydymosi temperatūros?', 'What happens to a substance as its temperature approaches its melting point?'),
            t('Žemiau lydymosi temperatūros kristalai lieka kieti ir drėgmė iš jų išgaruoja. Priartėjus prie lydymosi temperatūros, kristalai ima sulipti, o lydalas sulaiko tirpiklį ir priemaišas.', 'Below the melting point the crystals stay solid and moisture escapes. Close to the melting point crystals begin to stick and the melt holds solvent and impurities.'),
            t('Džiovinimas turi pašalinti tirpiklį, bet išlaikyti kristalus kietus.', 'Drying must remove the solvent but keep the crystals solid.'), 'LW1 p4')
        ]
      },

      /* ----- what you would observe ----- */
      {
        id: 'l1.observe',
        title: t('Ką pastebėsite?', 'What would you observe?'),
        mirrors: ['LW1.2', 'LW1.3', 'LW1.5'],
        bank: [
          mc('l1.observe.1',
            t('Mėgintuvėlyje ~10 mg medžiagos su 1 ml tirpiklio šaltai lieka nepakitusi; pakaitinus ištirpsta, o atvėsus iškrenta daug kristalų.', 'In a test tube, ~10 mg of substance with 1 mL of solvent stays unchanged cold; on heating it dissolves, and on cooling many crystals fall out.'),
            t('Ką tai rodo apie tirpiklį?', 'What does this tell you about the solvent?'),
            [t('Tirpiklis tinka kristalinimui.', 'The solvent is suitable for recrystallisation.'),
              t('Tirpiklis netinka, nes medžiaga šaltame netirpsta.', 'The solvent is unsuitable because the substance does not dissolve cold.'),
              t('Tirpiklis netinka, nes medžiaga tirpsta karštame.', 'The solvent is unsuitable because the substance dissolves hot.'),
              t('Tirpiklis tinka tik su aktyvinta anglimi.', 'The solvent is suitable only with activated charcoal.')],
            t('Kokios dvi savybės reikalingos gerame kristalinimo tirpiklyje?', 'Which two properties does a good recrystallisation solvent need?'),
            t('Šaltame tirpiklyje medžiaga turi netirpti, o karštame tirpti. Tada atvėsus tirpalas persisotina ir kristalai išsiskiria. Būtent tai ir matoma.', 'The substance must be insoluble cold and soluble hot. Then on cooling the solution becomes supersaturated and the crystals appear. That is exactly what is seen.'),
            t('Tirpumo skirtumas tarp karšto ir šalto yra tirpiklio tinkamumo matas.', 'The solubility difference between hot and cold measures the suitability of a solvent.'), 'LW1 p1'),
          mc('l1.observe.2',
            t('Medžiaga ištirpsta jau kambario temperatūroje, vos įpylus tirpiklio.', 'The substance dissolves at room temperature as soon as the solvent is added.'),
            t('Ką daryti su šiuo tirpikliu?', 'What should be done with this solvent?'),
            [t('Atmesti ir bandyti kitą, nes atvėsus kristalų beveik neišsiskirtų.', 'Reject it and try another, since few crystals would separate on cooling.'),
              t('Naudoti, nes medžiaga greitai ištirpsta.', 'Use it, because the substance dissolves quickly.'),
              t('Naudoti, bet kaitinti iki virimo.', 'Use it, but heat to boiling.'),
              t('Naudoti tik atvėsintą iki 0 °C.', 'Use it, but only cooled to 0 °C.')],
            t('Kiek medžiagos išsiskirtų atvėsus, jei ji ir šaltame tirpiklyje ištirpsta?', 'How much substance would separate on cooling if it already dissolves in the cold solvent?'),
            t('Tirpiklis, kuris šaltą medžiagą ištirpina, ir vėsinamas didžiąją dalį produkto išlaiko ištirpusį. Greitas ištirpimas tai blogas ženklas, o ne geras.', 'A solvent that dissolves the substance cold also keeps most of the product dissolved when cooled. Quick dissolving is a bad sign, not a good one.'),
            t('Kristalinimui reikia pastebimo tirpumo pokyčio su temperatūra.', 'Recrystallisation needs a clear change of solubility with temperature.'), 'LW1 p1'),
          mc('l1.observe.3',
            t('Po karšto filtravimo filtratas šviesus, bet jame plaukioja juodos dalelės.', 'After hot filtration the filtrate is pale, but black particles float in it.'),
            t('Kas nutiko ir ką daryti?', 'What happened and what should be done?'),
            [t('Anglis prasiskverbė pro filtrą; reikia perfiltruoti, dedant du popieriaus sluoksnius.', 'Charcoal passed through the filter; filter again, using two layers of paper.'),
              t('Tirpalas pakilo iki virimo, todėl reikia laukti.', 'The solution reached boiling, so just wait.'),
              t('Produktas pajuodo, todėl reikia pridėti daugiau anglies.', 'The product has turned black, so add more charcoal.'),
              t('Kristalai jau susidarė, todėl galima nutraukti filtravimą.', 'Crystals have already formed, so stop filtering.')],
            t('Ką reiškia juodos dalelės šviesiame filtrate?', 'What do black particles in a pale filtrate mean?'),
            t('Juodos dalelės yra anglis. Filtro popierius turėjo ją sulaikyti. Todėl filtravimas kartojamas, o filtruojant adsorbentą popierius turi būti tankus arba padengiamas antruoju sluoksniu.', 'Black particles are charcoal. The filter paper should have held it back. So the filtration is repeated, and for an adsorbent the paper has to be tight or covered with a second layer.'),
            t('Dulkės filtrate rodo, kad filtras per laidus; tai ištaisoma filtravimo pakartojimu, o ne papildomu priedu.', 'Specks in the filtrate show the filter is too open; it is fixed by repeating the filtration, not with another additive.'), 'LW1 p3'),
          mc('l1.observe.4',
            t('Filtruojant karštą tirpalą, ant piltuvėlio ir popieriaus pradeda augti kristalai ir užkemša filtrą.', 'During hot filtration crystals begin to grow on the funnel and the paper and clog the filter.'),
            t('Kodėl ir ką padaryti?', 'Why, and what can be done?'),
            [t('Tirpalas atvėso ant šaltų paviršių; padeda užkaitintas piltuvėlis ir apie 20 % papildomo tirpiklio.', 'The solution cooled on cold surfaces; a warmed funnel and about 20 % extra solvent help.'),
              t('Medžiaga reaguoja su popieriumi; reikia keisti popierių į vatą.', 'The substance reacts with the paper; replace the paper with cotton.'),
              t('Tirpalas buvo per praskiestas; reikia jį išgarinti.', 'The solution was too dilute; it has to be evaporated.'),
              t('Tai priemaišos; jas reikia palikti ir tęsti.', 'These are impurities; leave them and continue.')],
            t('Ką atvėsimas daro su sočiu tirpalu?', 'What does cooling do to a saturated solution?'),
            t('Soti karšta tirpalo plėvelė ant šalto stiklo atvėsta ir persisotina, todėl kristalai išsiskiria. Papildomas tirpiklis padaro tirpalą šiek tiek nesotų, o šildomas piltuvėlis neleidžia atvėsti.', 'A thin layer of saturated hot solution on cold glass cools and becomes supersaturated, so crystals separate. Extra solvent makes the solution slightly unsaturated, and a warmed funnel prevents cooling.'),
            t('Karštas filtravimas daromas greitai ir iš šilto indo, o nedidelį tirpiklio perteklių galima nugarinti po filtravimo.', 'Hot filtration is done fast and from a warm vessel, and the small excess of solvent can be boiled off afterwards.'), 'LW1 p2'),
          mc('l1.observe.5',
            t('Du mėginiai vienodo tirpalo: vienas atvėsinamas ledo vonioje per minutę, kitas ramiai kambario temperatūroje.', 'Two samples of the same solution: one is chilled in an ice bath within a minute, the other cooled quietly at room temperature.'),
            t('Ką pamatysite?', 'What will you see?'),
            [t('Staigiai šaldytame – smulki miltelių pavidalo masė, lėtai vėsusiame – didesni, aiškesnių formų kristalai.', 'The chilled one gives a fine powdery mass, the slowly cooled one larger, better-formed crystals.'),
              t('Staigiai šaldytame – didesni kristalai, lėtai vėsusiame – milteliai.', 'The chilled one gives larger crystals, the slowly cooled one a powder.'),
              t('Abiejuose susidarys vienodi kristalai, tik skirtingu greičiu.', 'Both give identical crystals, only at different speeds.'),
              t('Staigiai šaldytame kristalų nebus iš viso.', 'The chilled one gives no crystals at all.')],
            t('Kuriame tirpale daugiau laiko kristalui augti?', 'In which solution does a crystal have more time to grow?'),
            t('Greitai atšaldžius vienu metu susidaro daug užuomazgų ir augti nelieka laiko, o lėtai vėsstant susidaro mažai užuomazgų, kurios išauga dideli.', 'On quick chilling many nuclei form at once and there is no time for growth, while slow cooling gives few nuclei that grow large.'),
            t('Užuomazgų skaičius ir augimo laikas lemia kristalų dydį.', 'The number of nuclei and the growth time set the crystal size.'), 'LW1 p3'),
          mc('l1.observe.6',
            t('Tirpalas atvėso iki ledo vonios temperatūros, bet kristalų nėra, tirpalas skaidrus.', 'The solution cooled to ice-bath temperature, but no crystals appeared and it stays clear.'),
            t('Ką pirmiausia išbandyti?', 'What should you try first?'),
            [t('Įtrinti kolbos sienelę stikline lazdele arba įmesti kristaliuką.', 'Scratch the flask wall with a glass rod, or add a seed crystal.'),
              t('Išpilti tirpalą ir pradėti iš naujo.', 'Pour the solution away and start again.'),
              t('Karštai pakaitinti ir iškart filtruoti.', 'Heat it and filter immediately.'),
              t('Pridėti aktyvintos anglies.', 'Add activated charcoal.')],
            t('Kuri būsena kartais sutrukdo kristalams pradėti augti, nors tirpalas jau persotintas?', 'Which state sometimes stops crystals from starting even though the solution is already supersaturated?'),
            t('Persotintas tirpalas gali ilgai užsilikti, jei trūksta užuomazgų. Įbrėžimai ar kristaliukas jas sukuria. Jei nepadeda, tirpiklio gali būti per daug ir jį reikia dalį išgarinti.', 'A supersaturated solution can persist for a long time if nuclei are missing. Scratches or a seed crystal provide them. If that does not help, there may be too much solvent and some has to be boiled off.'),
            t('Tai dažniausia kristalinimo problema, ir ji sprendžiama be naujo tirpalo ruošimo.', 'This is the most common recrystallisation problem, and it is solved without making up the solution again.'), 'LW1 p3'),
          mc('l1.observe.7',
            t('Išdžiovinti kristalai šildymo aparate pradeda skystėti ties 108 °C ir visiškai išsilydo ties 118 °C. Gryna benzenkarboksirūgštis lydosi ties 122 °C.', 'The dried crystals begin to liquefy at 108 °C in the apparatus and are completely melted at 118 °C. Pure benzoic acid melts at 122 °C.'),
            t('Koks yra tikriausias paaiškinimas?', 'What is the most likely explanation?'),
            [t('Kristalai dar neišdžiūvę arba juose liko priemaišų.', 'The crystals are not yet dry or still hold impurities.'),
              t('Kristalai tapo švaresni nei literatūrinė medžiaga.', 'The crystals became purer than the literature material.'),
              t('Termometras rodo pernelyg aukštą temperatūrą.', 'The thermometer reads too high.'),
              t('Kristalai yra kitas junginys, kurio lydymosi temperatūra visada yra 113 °C.', 'The crystals are another compound whose melting point is always 113 °C.')],
            t('Kaip priemaišos veikia lydymosi temperatūrą ir intervalo plotį?', 'How do impurities affect the melting point and the width of the range?'),
            t('Žema pradžia (108 °C) ir platus intervalas (10 °C) – tipiški nešvaraus ar drėgno mėginio požymiai. Drėgmė ar priemaišos žemina ir plečia lydymąsi.', 'A low start (108 °C) and a wide range (10 °C) are typical of an impure or damp sample. Moisture or impurities lower and widen the melting.'),
            t('Siauras intervalas prie literatūrinės vertės – grynumo požymis, o nukrypimas žemyn ir platesnis intervalas – ne.', 'A narrow range near the literature value signals purity, whereas a drop and a wider range do not.'), 'LW1 p4'),
          mc('l1.observe.8',
            t('Filtruodami tirpalą su aktyvinta anglimi pastebite, kad apatinė filtro popieriaus pusė pilka.', 'While filtering a solution with activated charcoal you notice that the underside of the filter paper is grey.'),
            t('Ką tai rodo?', 'What does this show?'),
            [t('Anglies dalelės prasiskverbė pro popierių, todėl filtravimą reikia kartoti per dvigubą sluoksnį.', 'Charcoal particles went through the paper, so the filtration has to be repeated through a double layer.'),
              t('Anglis sulaikyta ir filtras veikia gerai.', 'The charcoal is held back and the filter works well.'),
              t('Ant filtro susidarė produkto kristalai.', 'Crystals of the product formed on the filter.'),
              t('Filtro popierius sudegė nuo karšto tirpalo.', 'The filter paper burned in the hot solution.')],
            t('Kuri medžiaga pilkina popierių?', 'Which substance greys paper?'),
            t('Jei anglis būtų sulaikyta, apatinė filtro pusė liktų balta. Pilka spalva rodo, kad smulkios dalelės prasiskverbė, todėl filtruojama iš naujo, o popierius dedamas dvigubas.', 'If the charcoal had been held back, the lower side of the filter would stay white. A grey colour shows that fine particles got through, so the filtration is repeated with a double layer of paper.'),
            t('Popieriaus apatinė pusė yra paprastas patikros būdas, ar adsorbentas sulaikytas.', 'The underside of the paper is a simple check that the adsorbent has been held back.'), 'LW1 p3')
        ]
      },

      /* ----- which observation proves what ----- */
      {
        id: 'l1.proof',
        title: t('Kokią išvadą leidžia daryti?', 'What does the observation prove?'),
        mirrors: ['LW1.5', 'LW1.8'],
        bank: [
          mc('l1.proof.1',
            t('Išdžiovintų kristalų lydymosi intervalas yra 121,5–122,5 °C.', 'The dried crystals melt over 121.5 to 122.5 °C.'),
            t('Kokia išvada pagrįsta?', 'Which conclusion is justified?'),
            [t('Mėginys artimas gryno junginio, nes intervalas siauras ir artimas literatūrinei vertei.', 'The sample is close to pure, because the range is narrow and near the literature value.'),
              t('Mėginys yra tikrai tik benzenkarboksirūgštis, nes lydymosi temperatūra tokia pati.', 'The sample is certainly benzoic acid, because the melting point is the same.'),
              t('Mėginyje yra daug priemaišų, nes intervalas ne vienas skaičius.', 'The sample contains many impurities, because the range is not a single number.'),
              t('Kristalai dar drėgni, nes intervalas nepasislinko žemyn.', 'The crystals are still damp, because the range has not moved down.')],
            t('Skiriasi tai, ką lydymosi temperatūra parodo apie grynumą, ir tai, ką ji parodo apie tapatybę.', 'What the melting point tells about purity differs from what it tells about identity.'),
            t('Siauras intervalas prie literatūrinės vertės rodo grynumą. Tapatybei patvirtinti vienos vertės nepakanka, nes kiti junginiai gali lydytis panašiai.', 'A narrow range near the literature value shows purity. For identity one value is not enough, because other compounds may melt alike.'),
            t('Grynumą rodo siauras intervalas, o tapatybę – mišrioji lydymosi temperatūra.', 'Purity is shown by a narrow range, identity by a mixed melting point.'), 'LW1 p4'),
          mc('l1.proof.2',
            t('Nežinomas baltas kietas mėginys lydosi 121–122 °C. Sumaišius su tokiu pat kiekiu benzenkarboksirūgšties, mišinys lydosi 121–122 °C.', 'An unknown white solid melts at 121 to 122 °C. Mixed with an equal amount of benzoic acid, the mixture also melts at 121 to 122 °C.'),
            t('Ką tai įrodo?', 'What does this prove?'),
            [t('Mėginys yra labai tikėtina ta pati medžiaga kaip benzenkarboksirūgštis.', 'The sample is very probably the same substance as benzoic acid.'),
              t('Mėginys yra skirtingas junginys, nes lydymosi temperatūra nepasikeitė.', 'The sample is a different compound, because the melting point did not change.'),
              t('Mėginys yra drėgnas, nes lydymosi temperatūra nepasikeitė.', 'The sample is damp, because the melting point did not change.'),
              t('Nieko, nes mišinio lydymosi temperatūra neturi prasmės.', 'Nothing, because the mixture melting point has no meaning.')],
            t('Ką daro skirtingų medžiagų priemaiša kito junginio lydymosi temperatūrai?', 'What does a foreign substance do to the melting point of another compound?'),
            t('Jei medžiagos skirtingos, viena kitai tampa priemaiša ir mišinys lydytųsi žemiau bei plačiau. Nepakitęs intervalas rodo, kad jos tapačios.', 'If the substances differ, each is an impurity to the other and the mixture would melt lower and wider. An unchanged range shows they are identical.'),
            t('Mišriosios lydymosi temperatūros bandymas paverčia priemaišų poveikį tapatybės testu.', 'The mixed melting point test turns the effect of impurities into a test of identity.'), 'LW1 p4'),
          mc('l1.proof.3',
            t('Nežinomas mėginys lydosi 121–122 °C. Sumaišius su benzenkarboksirūgštimi, mišinys lydosi 104–113 °C.', 'An unknown sample melts at 121 to 122 °C. Mixed with benzoic acid, the mixture melts at 104 to 113 °C.'),
            t('Kas pagrįsta?', 'What follows?'),
            [t('Mėginys nėra benzenkarboksirūgštis, nors jo lydymosi temperatūra panaši.', 'The sample is not benzoic acid, even though its melting point is similar.'),
              t('Mėginys yra benzenkarboksirūgštis, tik ją reikia perkristalinti.', 'The sample is benzoic acid, it only has to be recrystallised again.'),
              t('Mėginys yra gryna benzenkarboksirūgštis, o termometras suklydo.', 'The sample is pure benzoic acid and the thermometer erred.'),
              t('Nieko, nes tokie mišiniai visada lydosi žemiau.', 'Nothing, because such mixtures always melt lower.')],
            t('Kas nutinka mišinio lydymosi temperatūrai, kai dvi medžiagos yra skirtingos?', 'What happens to the mixture melting point when the two substances are different?'),
            t('Mišinio lydymosi temperatūra smarkiai nukrito ir intervalas išsiplėtė. Taip elgiasi skirtingų medžiagų mišinys, todėl nežinomasis kitas junginys, tik panašios lydymosi temperatūros.', 'The mixture melting point dropped markedly and the range widened. A mixture of different substances behaves like this, so the unknown is another compound with a similar melting point.'),
            t('Depresija rodo skirtingumą, nepasikeitimas – tapatumą.', 'A depression shows difference, no change shows identity.'), 'LW1 p4'),
          mc('l1.proof.4',
            t('Pavertus nufiltruotų kristalų masę į išeigą gauta 108 %.', 'Converting the mass of filtered crystals into a yield gave 108 %.'),
            t('Ką tai įrodo?', 'What does this show?'),
            [t('Matavimo klaidą: kristalai neišdžiūvo arba juose yra priemaišų.', 'A measurement error: the crystals are not dry or contain impurities.'),
              t('Kad atgauta daugiau, nei buvo, nes produktas padaugėjo kristalinant.', 'That more was recovered than was present, because the product increased on recrystallisation.'),
              t('Kad kristalinimas buvo ypač sėkmingas.', 'That the recrystallisation was exceptionally successful.'),
              t('Kad tirpiklis buvo tobulai parinktas.', 'That the solvent was chosen perfectly.')],
            t('Ar kristalinimas gali sukurti medžiagos?', 'Can recrystallisation create material?'),
            t('Kristalinimas medžiagos nesukuria ir dalis visada lieka tirpale, todėl išeiga negali viršyti 100 %. Perteklius yra drėgmė ar priemaišos.', 'Recrystallisation creates no material and some always stays in solution, so the yield cannot exceed 100 %. The excess is moisture or impurities.'),
            t('Skaičius, kuris pažeidžia masės tvermę, visada rodo klaidą.', 'A number that breaks conservation of mass always points to an error.'), 'LW1 p5'),
          mc('l1.proof.5',
            t('Atvėsinus tirpalą ledo vonioje ir nufiltravus kristalus, išgarintas filtratas palieka nemažai baltų kristalų.', 'After cooling the solution in an ice bath and filtering off the crystals, evaporating the filtrate leaves a fair amount of white crystals.'),
            t('Ką tai rodo?', 'What does this show?'),
            [t('Dalis produkto liko motininiame tirpale, tai kristalinimo nuostolis.', 'Some product stayed in the mother liquor: a loss in recrystallisation.'),
              t('Kristalai yra priemaišos, kurių filtravimas neišvalė.', 'The crystals are impurities that the filtration did not remove.'),
              t('Filtravimo popierius ištirpo.', 'The filter paper dissolved.'),
              t('Produktas sureagavo su vandeniu.', 'The product reacted with water.')],
            t('Ar šaltas tirpiklis visiškai netirpina produkto?', 'Does cold solvent dissolve none of the product?'),
            t('Medžiaga šaltame tirpiklyje turi nors ir mažą tirpumą. Tirpale likusi dalis išgarinus atsiranda kristalais. Taip paaiškinama, kodėl išeiga mažesnė už 100 %.', 'The substance has a small solubility in the cold solvent. The part left in solution reappears as crystals when evaporated. This explains why the yield is below 100 %.'),
            t('Nuostolis kristalinant neišvengiamas ir mažinamas ne tuo, kad vengiama kristalinti, o minimaliu tirpiklio kiekiu.', 'The loss in recrystallisation is unavoidable, and it is reduced by a minimum of solvent, not by avoiding the method.'), 'LW1 p1'),
          mc('l1.proof.6',
            t('Dviejų skirtingų junginių, A ir B, lydymosi temperatūros abi yra 122 °C.', 'Two different compounds, A and B, both have a melting point of 122 °C.'),
            t('Kokia išvada apie vieną mėginį pagrįsta, jei jo lydymosi temperatūra yra 122 °C?', 'Which conclusion about a sample with a melting point of 122 °C is justified?'),
            [t('Tik kad jis gali būti A arba B ar dar kitas junginys: tapatybei reikia papildomo patikrinimo.', 'Only that it may be A, B or yet another compound: identity needs a further check.'),
              t('Kad tai tikrai A, nes jo temperatūra sutampa.', 'That it is certainly A, because its temperature matches.'),
              t('Kad tai tikrai B, nes B tirpsta lengviau.', 'That it is certainly B, because B melts more easily.'),
              t('Kad tai mišinys, nes jis lydosi vienoje temperatūroje.', 'That it is a mixture, because it melts at a single temperature.')],
            t('Kiek skirtingų junginių gali turėti tą pačią lydymosi temperatūrą?', 'How many different compounds can share the same melting point?'),
            t('Lydymosi temperatūra yra viena savybė, ir ją gali turėti keli junginiai. Todėl vienos vertės sutapimas tapatybės neįrodo, reikia mišriosios lydymosi temperatūros ar kitų duomenų.', 'The melting point is a single property that several compounds can share. A single matching value therefore does not prove identity; a mixed melting point or other data are needed.'),
            t('Sutapimas yra užuomina, bet ne įrodymas.', 'A match is a hint, not a proof.'), 'LW1 p4'),
          mc('l1.proof.7',
            t('Neišdžiūvęs mėginys išsilydo ties 103–117 °C. Po kruopštaus išdžiovinimo to paties mėginio intervalas yra 121–122 °C.', 'A sample that is not yet dry melts at 103 to 117 °C. After careful drying the same sample melts at 121 to 122 °C.'),
            t('Ką rodo skirtumas tarp matavimų?', 'What does the difference between the two measurements show?'),
            [t('Pirmą kartą lydymąsi žeminusi ir plėtusi priemaiša buvo drėgmė, o pats produktas švarus.', 'The first time, the impurity that lowered and widened the melting was moisture, and the product itself was clean.'),
              t('Džiovinimas sukūrė naują junginį.', 'Drying created a new compound.'),
              t('Pirmasis matavimas buvo teisingas, o antrasis klaidingas.', 'The first measurement was right and the second wrong.'),
              t('Termometras tarp matavimų pakeitė rodmenis.', 'The thermometer changed its reading between the measurements.')],
            t('Kas dar gali veikti kaip priemaiša kristale, be kitų medžiagų?', 'What else can act as an impurity in a crystal besides other substances?'),
            t('Tirpiklio likučiai veikia kaip priemaiša ir žemina lydymosi temperatūrą. Kai drėgmė pašalinama, intervalas siaurėja ir pasiekia literatūrinę vertę.', 'Residual solvent acts as an impurity and lowers the melting point. When the moisture is removed, the range narrows and reaches the literature value.'),
            t('Prieš matuojant lydymosi temperatūrą, mėginys turi būti sausas.', 'Before measuring a melting point the sample has to be dry.'), 'LW1 p4'),
          mc('l1.proof.8',
            t('Po karšto filtravimo ant filtro popieriaus lieka juodos nuosėdos, o filtratas šviesus.', 'After hot filtration black residue stays on the filter paper while the filtrate is pale.'),
            t('Ką tai įrodo apie tirpalą?', 'What does this show about the solution?'),
            [t('Spalvotos ir netirpios priemaišos pašalintos, o produktas lieka tirpale.', 'Coloured and insoluble impurities have been removed while the product remains in solution.'),
              t('Produktas liko ant filtro.', 'The product stayed on the filter.'),
              t('Tirpalas nebesotus.', 'The solution is no longer saturated.'),
              t('Tirpiklis buvo parinktas netinkamai.', 'The solvent was chosen wrongly.')],
            t('Ką turi sulaikyti karštas filtravimas?', 'What should hot filtration hold back?'),
            t('Karštas filtravimas turi sulaikyti kietas priemaišas ir anglį, o produktas, kuris karštame tirpiklyje ištirpęs, praeina su filtratu.', 'Hot filtration should hold back solid impurities and charcoal, while the product, dissolved in the hot solvent, passes through with the filtrate.'),
            t('Ant filtro lieka tai, kas netirpsta; vertingas produktas lieka tirpale.', 'What stays on the filter is what does not dissolve; the valuable product stays in solution.'), 'LW1 p2')
        ]
      },

      /* ----- yield: generator ----- */
      {
        id: 'l1.yield',
        title: t('Išeigos skaičiavimas', 'Calculating the yield'),
        mirrors: ['LW1.6'],
        gen(rng, ctx) {
          let m0, rec, y, cls;
          for (let tries = 0; tries < 60; tries++) {
            m0 = ctx.int(80, 150) / 100;
            const pct = ctx.int(30, 106);
            rec = Math.round(m0 * pct) / 100;
            if (rec <= 0.2) continue;
            y = rec / m0 * 100;
            if (Math.abs(y - 100) < 1.5 || Math.abs(y - 50) < 1.5) continue;
            cls = y > 100 ? 0 : y < 50 ? 1 : 2;
            break;
          }
          if (cls === undefined) throw new Error('l1.yield: no usable values');
          const sample = ctx.pick([t('techninės benzenkarboksirūgšties', 'technical benzoic acid'), t('nešvarios benzenkarboksirūgšties', 'impure benzoic acid')]);
          return {
            q: [{
              p: t('Kristalinimui paimta ' + num(m0, 2, 'lt') + ' g ' + sample.lt + ', o išdžiovintų kristalų gauta ' + num(rec, 2, 'lt') + ' g.',
                'For the recrystallisation ' + num(m0, 2, 'en') + ' g of ' + sample.en + ' was taken, and ' + num(rec, 2, 'en') + ' g of dried crystals was obtained.')
            }],
            steps: [
              {
                prompt: t('Apskaičiuokite išeigą procentais (vienas skaičius po kablelio).', 'Calculate the yield in percent (one decimal place).'),
                kind: 'number', answer: { value: y, tol: 0.15 },
                hint: t('Palyginkite gautą masę su pradine, kad pamatytumėte, kokia dalis atgauta.', 'Compare the mass obtained with the starting mass to see what part was recovered.'),
                solution: t('Išeiga = ' + num(rec, 2, 'lt') + ' : ' + num(m0, 2, 'lt') + ' × 100 = ' + num(y, 1, 'lt') + ' %.',
                  'Yield = ' + num(rec, 2, 'en') + ' : ' + num(m0, 2, 'en') + ' × 100 = ' + num(y, 1, 'en') + ' %.')
              },
              {
                prompt: t('Ką šis rezultatas sako apie darbą?', 'What does this result say about the work?'),
                kind: 'choice',
                options: [
                  t('Išeiga didesnė už 100 %: kristalai neišdžiūvo arba juose yra priemaišų.', 'The yield is above 100 %: the crystals are not dry or contain impurities.'),
                  t('Išeiga maža: greičiausiai buvo naudota per daug tirpiklio arba kristalai prarasti filtruojant.', 'The yield is low: probably too much solvent was used, or crystals were lost in filtering.'),
                  t('Išeiga tikėtina: dalis produkto visada lieka motininiame tirpale.', 'The yield is plausible: some product always stays in the mother liquor.')
                ].map(text => ({ text })),
                answer: cls,
                hint: t('Palyginkite išeigą su dviem ribomis: 100 % ir maždaug puse pradinės masės.', 'Compare the yield with two limits: 100 % and about half of the starting mass.'),
                solution: t(
                  cls === 0 ? 'Gavome daugiau nei paėmėme, o tai neįmanoma: kristalai drėgni arba netyri.' : cls === 1 ? 'Prarasta daugiau nei pusė: tirpiklio buvo per daug arba kristalų liko ant indų ir filtro.' : 'Dalies netenkama dėl tirpumo šaltame tirpiklyje, todėl tokia išeiga normali.',
                  cls === 0 ? 'More was obtained than was taken, which is impossible: the crystals are wet or impure.' : cls === 1 ? 'More than half was lost: too much solvent was used, or crystals stayed on the glassware and filter.' : 'Some is lost to solubility in the cold solvent, so such a yield is normal.')
              }
            ],
            why: t('Išeiga nurodo, kiek produkto atgauta. Kristalinimas visada ką nors praranda, nes šaltame tirpiklyje likusi dalis neišsiskiria, todėl 100 % viršyti negalima, o labai maža išeiga rodo klaidą.',
              'The yield tells how much product is recovered. Recrystallisation always loses something, since what stays dissolved in the cold solvent does not separate, so 100 % cannot be exceeded and a very low yield points to an error.'),
            src: 'LW1 p5'
          };
        }
      },

      /* ----- solubility: generator ----- */
      {
        id: 'l1.solub',
        title: t('Tirpumas ir nuostoliai', 'Solubility and losses'),
        mirrors: ['LW1.1', 'LW1.6'],
        gen(rng, ctx) {
          const m = ctx.int(2, 10) / 2;
          const sh = ctx.pick([4, 5, 8, 10, 20, 25]);
          const sc = ctx.pick([0.2, 0.4, 0.5, 1]);
          const v = m / sh * 100;
          const loss = v * sc / 100;
          const rec = m - loss;
          return {
            q: [{
              p: t('Medžiagos tirpumas karštame tirpiklyje yra ' + num(sh, 0, 'lt') + ' g / 100 ml, o šaltame ' + num(sc, 1, 'lt') + ' g / 100 ml. Kristalinama ' + num(m, 1, 'lt') + ' g medžiagos, naudojant minimalų karšto tirpiklio kiekį.',
                'The solubility of a substance in a hot solvent is ' + num(sh, 0, 'en') + ' g / 100 mL and in the cold solvent ' + num(sc, 1, 'en') + ' g / 100 mL. ' + num(m, 1, 'en') + ' g of the substance is recrystallised with the minimum amount of hot solvent.')
            }],
            steps: [
              {
                prompt: t('Kiek mililitrų karšto tirpiklio reikia?', 'How many millilitres of hot solvent are needed?'),
                kind: 'number', answer: { value: v, tol: 0.5 },
                hint: t('Minimalus tūris yra toks, kuriame karštas tirpalas jau sotus.', 'The minimum volume is the one in which the hot solution is just saturated.'),
                solution: t('V = ' + num(m, 1, 'lt') + ' : ' + num(sh, 0, 'lt') + ' × 100 = ' + num(v, 1, 'lt') + ' ml.', 'V = ' + num(m, 1, 'en') + ' : ' + num(sh, 0, 'en') + ' × 100 = ' + num(v, 1, 'en') + ' mL.')
              },
              {
                prompt: t('Kiek gramų (daugiausia) kristalų galima gauti atvėsinus?', 'What is the greatest mass of crystals (in g) that can be obtained on cooling?'),
                kind: 'number', answer: { value: rec, tol: 0.03 },
                hint: t('Šaltame tirpiklyje to paties tūrio lieka ištirpusios medžiagos dalis.', 'A part of the substance stays dissolved in that same volume of cold solvent.'),
                solution: t('Šaltame tirpiklyje lieka ' + num(v, 1, 'lt') + ' × ' + num(sc, 1, 'lt') + ' : 100 = ' + num(loss, 2, 'lt') + ' g, todėl kristalų gaunama ' + num(m, 1, 'lt') + ' − ' + num(loss, 2, 'lt') + ' = ' + num(rec, 2, 'lt') + ' g.',
                  'In the cold solvent ' + num(v, 1, 'en') + ' × ' + num(sc, 1, 'en') + ' : 100 = ' + num(loss, 2, 'en') + ' g stays dissolved, so ' + num(m, 1, 'en') + ' − ' + num(loss, 2, 'en') + ' = ' + num(rec, 2, 'en') + ' g of crystals is obtained.')
              },
              {
                prompt: t('Kas atsitiks su atgauta mase, jei tirpiklio imsite dvigubai daugiau?', 'What happens to the recovered mass if twice as much solvent is used?'),
                kind: 'choice',
                options: [t('Sumažės, nes šaltame tirpiklyje liks daugiau produkto.', 'It decreases, because more product stays in the cold solvent.'),
                  t('Padidės, nes tirpiklis geriau ištirpina priemaišas.', 'It increases, because the solvent dissolves impurities better.'),
                  t('Nepasikeis, nes tirpumas nuo tūrio nepriklauso.', 'It stays the same, because solubility does not depend on volume.')].map(text => ({ text })),
                answer: 0,
                hint: t('Ištirpusi dalis šaltame skystyje didėja kartu su jo tūriu.', 'The dissolved part in the cold liquid grows with its volume.'),
                solution: t('Praradimas yra tirpumas × tūris, todėl dvigubas tirpiklio kiekis dvigubina motininiame tirpale likusią medžiagą.', 'The loss is solubility × volume, so twice the solvent doubles the material left in the mother liquor.')
              }
            ],
            why: t('Karštame tirpiklyje reikia tiek tūrio, kad tirpalas būtų sotus, o šaltame tirpiklyje tame pačiame tūryje lieka tirpumo ribą atitinkanti masė. Kuo didesnis tūris, tuo didesnis nuostolis.',
              'The hot solvent needs just the volume at which the solution is saturated, and in the cold solvent the mass allowed by the solubility remains in that same volume. The larger the volume, the larger the loss.'),
            src: 'LW1 p1'
          };
        }
      },

      /* ----- melting point: generator ----- */
      {
        id: 'l1.mp',
        title: t('Lydymosi temperatūra ir grynumas', 'Melting point and purity'),
        mirrors: ['LW1.5'],
        gen(rng, ctx) {
          const kind = ctx.pick(['pure', 'impure', 'mixSame', 'mixDiff']);
          let lo, hi, q, prompt, opts, why1, widthPrompt;
          if (kind === 'pure') {
            lo = ctx.int(1210, 1220) / 10; hi = lo + ctx.int(5, 10) / 10;
            q = t('Išdžiovinta benzenkarboksirūgštis lydosi nuo ' + num(lo, 1, 'lt') + ' iki ' + num(hi, 1, 'lt') + ' °C. Literatūrinė vertė yra apie 122 °C.',
              'Dried benzoic acid melts from ' + num(lo, 1, 'en') + ' to ' + num(hi, 1, 'en') + ' °C. The literature value is about 122 °C.');
            prompt = t('Ką galima teigti apie grynumą?', 'What can be said about purity?');
            opts = [t('Mėginys yra gana grynas: intervalas siauras ir artimas literatūrinei vertei.', 'The sample is fairly pure: the range is narrow and close to the literature value.'),
              t('Mėginys nešvarus: lydymosi temperatūra turėtų būti vienas skaičius.', 'The sample is impure: the melting point should be a single number.'),
              t('Mėginys drėgnas: lydymosi temperatūra pernelyg aukšta.', 'The sample is damp: the melting point is too high.')];
            why1 = t('Siauras intervalas (apie 1 °C) arti 122 °C yra gryno junginio požymis.', 'A narrow range (about 1 °C) near 122 °C is a sign of a pure compound.');
          } else if (kind === 'impure') {
            lo = ctx.int(1100, 1180) / 10; hi = lo + ctx.int(30, 80) / 10;
            q = t('Išdžiovinta benzenkarboksirūgštis lydosi nuo ' + num(lo, 1, 'lt') + ' iki ' + num(hi, 1, 'lt') + ' °C. Literatūrinė vertė yra apie 122 °C.',
              'Dried benzoic acid melts from ' + num(lo, 1, 'en') + ' to ' + num(hi, 1, 'en') + ' °C. The literature value is about 122 °C.');
            prompt = t('Ką galima teigti apie grynumą?', 'What can be said about purity?');
            opts = [t('Mėginyje yra priemaišų arba drėgmės: lydymosi temperatūra sumažėjusi ir intervalas platus.', 'The sample holds impurities or moisture: the melting point is lowered and the range is wide.'),
              t('Mėginys labai grynas: intervalas turi būti platus.', 'The sample is very pure: the range is meant to be wide.'),
              t('Mėginys grynesnis už literatūrinį.', 'The sample is purer than the literature material.')];
            why1 = t('Priemaišos žemina lydymosi temperatūrą ir plečia intervalą, ir čia matomi abu požymiai.', 'Impurities lower the melting point and widen the range, and both signs are seen here.');
          } else if (kind === 'mixSame') {
            lo = ctx.int(1210, 1215) / 10; hi = lo + ctx.int(5, 10) / 10;
            q = t('Nežinomas junginys lydosi ' + num(lo, 1, 'lt') + '–' + num(hi, 1, 'lt') + ' °C, taip pat kaip benzenkarboksirūgštis. Sumaišius su benzenkarboksirūgštimi, mišinys lydosi tame pačiame intervale ' + num(lo, 1, 'lt') + '–' + num(hi, 1, 'lt') + ' °C.',
              'An unknown compound melts at ' + num(lo, 1, 'en') + ' to ' + num(hi, 1, 'en') + ' °C, like benzoic acid. Mixed with benzoic acid, the mixture melts over the same range ' + num(lo, 1, 'en') + ' to ' + num(hi, 1, 'en') + ' °C.');
            prompt = t('Kokia išvada?', 'What is the conclusion?');
            opts = [t('Nežinomasis greičiausiai yra benzenkarboksirūgštis.', 'The unknown is most likely benzoic acid.'),
              t('Nežinomasis yra kitas junginys, tik su ta pačia lydymosi temperatūra.', 'The unknown is another compound that has the same melting point.'),
              t('Mišinys nešvarus, todėl nieko negalima teigti.', 'The mixture is impure, so nothing can be said.')];
            why1 = t('Be nuolydžio mišinys elgiasi kaip viena medžiaga, vadinasi, abu mėginiai tapatūs.', 'With no depression the mixture behaves as a single substance, so the two samples are identical.');
          } else {
            lo = ctx.int(1000, 1120) / 10; hi = lo + ctx.int(50, 90) / 10;
            q = t('Nežinomas junginys lydosi apie 122 °C, taip pat kaip benzenkarboksirūgštis. Sumaišius su benzenkarboksirūgštimi, mišinys lydosi nuo ' + num(lo, 1, 'lt') + ' iki ' + num(hi, 1, 'lt') + ' °C.',
              'An unknown compound melts at about 122 °C, like benzoic acid. Mixed with benzoic acid, the mixture melts from ' + num(lo, 1, 'en') + ' to ' + num(hi, 1, 'en') + ' °C.');
            prompt = t('Kokia išvada?', 'What is the conclusion?');
            opts = [t('Nežinomasis yra kitas junginys, tik panašios lydymosi temperatūros.', 'The unknown is another compound with a similar melting point.'),
              t('Nežinomasis yra benzenkarboksirūgštis.', 'The unknown is benzoic acid.'),
              t('Matavimas negalioja, nes mišinių negalima lydyti.', 'The measurement is invalid, because mixtures cannot be melted.')];
            why1 = t('Mišinys lydosi žemiau ir plačiau, taigi mėginiai skirtingi.', 'The mixture melts lower and wider, so the samples are different.');
          }
          const width = hi - lo;
          return {
            q: [{ p: q }],
            steps: [
              {
                prompt, kind: 'choice', options: opts.map(text => ({ text })), answer: 0,
                hint: kind === 'mixSame' || kind === 'mixDiff'
                  ? t('Kaip pasikeistų mišinio lydymosi temperatūra, jei medžiagos skirtingos?', 'How would the mixture melting point change if the substances were different?')
                  : t('Palyginkite intervalo plotį ir padėtį su literatūrine verte.', 'Compare the width and the position of the range with the literature value.'),
                solution: why1
              },
              {
                prompt: kind === 'mixSame' || kind === 'mixDiff' ? t('Kokio pločio (°C) yra mišinio lydymosi intervalas?', 'How wide (in °C) is the melting range of the mixture?') : t('Kokio pločio (°C) yra lydymosi intervalas?', 'How wide (in °C) is the melting range?'),
                kind: 'number', answer: { value: width, tol: 0.06 },
                hint: t('Intervalas yra skirtumas tarp pabaigos ir pradžios temperatūros.', 'The range is the difference between the end and the start temperature.'),
                solution: t('Plotis = ' + num(hi, 1, 'lt') + ' − ' + num(lo, 1, 'lt') + ' = ' + num(width, 1, 'lt') + ' °C.', 'Width = ' + num(hi, 1, 'en') + ' − ' + num(lo, 1, 'en') + ' = ' + num(width, 1, 'en') + ' °C.')
              }
            ],
            why: t('Grynumą rodo siauras intervalas prie literatūrinės vertės, o tapatybę – mišrioji lydymosi temperatūra: be pokyčio medžiagos tapačios, su nuolydžiu – skirtingos.',
              'Purity is shown by a narrow range near the literature value and identity by the mixed melting point: no change means identical substances, a depression means different ones.'),
            src: 'LW1 p4'
          };
        }
      },

      /* ----- apparatus ----- */
      {
        id: 'l1.app',
        title: t('Aparatūra pagal aprašymą', 'Apparatus from a description'),
        mirrors: ['LW1.4'],
        bank: [
          mc('l1.app.1',
            t('Porcelianinis ar stiklinis indas su plokščiu skylėtu dugnu, ant kurio dedamas filtro popieriaus skritulys, įstatomas į kolbos kamštį.', 'A porcelain or glass vessel with a flat perforated plate on which a disc of filter paper lies, fitted into the stopper of a flask.'),
            t('Kaip jis vadinamas?', 'What is it called?'),
            [t('Biuchnerio piltuvas', 'Büchner funnel'), t('Skiriamasis piltuvas', 'Separatory funnel'), t('Kristalizatorius', 'Crystalliser'), t('Matavimo cilindras', 'Measuring cylinder')],
            t('Kam skirtas filtravimas vakuume?', 'What is vacuum filtration used for?'),
            t('Skylėtas dugnas laiko popierių, o tirpalas pro jį traukiamas vakuumu. Tai būdingas vakuuminio filtravimo indas.', 'The perforated plate holds the paper and the solution is drawn through it by the vacuum. It is the typical vessel of vacuum filtration.'),
            t('Daugiau medžiagos ir greitesnis filtravimas: Biuchnerio piltuvas.', 'More material and quicker filtration: the Büchner funnel.'), 'LW1 p3'),
          mc('l1.app.2',
            t('Storasienė kūginė kolba su šoniniu vamzdeliu, kuris jungiamas žarna prie vandens čiurkšlės siurblio.', 'A thick-walled conical flask with a side arm connected by a hose to a water aspirator.'),
            t('Kaip ji vadinama?', 'What is it called?'),
            [t('Bunzeno kolba', 'Bunsen flask'), t('Erlenmejerio kolba', 'Erlenmeyer flask'), t('Apvaliadugnė kolba', 'Round-bottom flask'), t('Matavimo kolba', 'Volumetric flask')],
            t('Kuri kolba atlaiko vakuumą?', 'Which flask withstands a vacuum?'),
            t('Šoninis vamzdelis leidžia išsiurbti orą, o stora siena – atlaikyti vakuumą. Tai Bunzeno kolba.', 'The side arm lets air be drawn out and the thick wall withstands the vacuum. It is the Bunsen flask.'),
            t('Be šoninio vamzdelio kolba negalėtų jungtis prie siurblio.', 'Without the side arm the flask could not be connected to the aspirator.'), 'LW1 p3'),
          mc('l1.app.3',
            t('Į apvaliadugnę kolbą įstatomas vertikalus stiklinis vamzdis su aušinimo apvalkalu, per kurį cirkuliuoja vanduo, o garai kondensuojasi ir grįžta atgal.', 'A vertical glass tube with a cooling jacket, through which water circulates, is fitted into a round-bottom flask; vapours condense in it and run back.'),
            t('Kas tai?', 'What is it?'),
            [t('Grįžtamasis kondensatorius', 'Reflux condenser'), t('Vakuuminis siurblys', 'Vacuum pump'), t('Biuretė', 'Burette'), t('Termometras', 'Thermometer')],
            t('Ką daryti su garais, kai verdama kolboje ilgai?', 'What should be done with the vapours when boiling in a flask for a long time?'),
            t('Kondensatorius sugrąžina garus į kolbą, tad tirpiklio kiekis nesikeičia. Jis naudojamas, kai kristalinama iš nuodingų ar lakių tirpiklių.', 'The condenser returns the vapour to the flask so the volume of solvent does not change. It is used when crystallising from toxic or volatile solvents.'),
            t('Kad tirpiklis neišgaruotų, o garai neprasiskverbtų į laboratoriją, naudojamas grįžtamasis kondensatorius.', 'To keep the solvent from evaporating and its vapour out of the lab, a reflux condenser is used.'), 'LW1 p2'),
          mc('l1.app.4',
            t('Kūgio formos plokščiadugnė kolba su siauru kakleliu; į ją filtruojamas karštas tirpalas.', 'A flat-bottomed conical flask with a narrow neck; the hot solution is filtered into it.'),
            t('Kaip vadinama?', 'What is it called?'),
            [t('Erlenmejerio kolba', 'Erlenmeyer flask'), t('Bunzeno kolba', 'Bunsen flask'), t('Distiliavimo kolba su šoniniu vamzdeliu', 'Distillation flask with a side arm'), t('Stiklinis cilindras', 'Glass cylinder')],
            t('Kuri kolba neturi šoninio vamzdelio?', 'Which flask has no side arm?'),
            t('Siauras kaklelis riboja tirpiklio garavimą ir leidžia kolbą sukioti, o plokščias dugnas laiko ją stabiliai. Tokia kolba yra Erlenmejerio.', 'A narrow neck limits evaporation of the solvent and lets the flask be swirled, while the flat bottom keeps it stable. Such a flask is the Erlenmeyer.'),
            t('Kolba be šoninio vamzdelio ir plokščiu dugnu: Erlenmejerio.', 'A flask with a flat bottom and no side arm: Erlenmeyer.'), 'LW1 p5'),
          mc('l1.app.5',
            t('Plati, žema stiklinė dubenėlio formos taurė, kurioje dedamas ledo ir vandens mišinys, į jį panardinama kolba su tirpalu.', 'A wide, shallow, dish-shaped glass vessel that holds an ice and water mixture, into which the flask with the solution is placed.'),
            t('Kas tai?', 'What is it?'),
            [t('Kristalizatorius', 'Crystalliser'), t('Eksikatorius', 'Desiccator'), t('Džiovinimo spinta', 'Drying cabinet'), t('Skiriamasis piltuvas', 'Separatory funnel')],
            t('Kur atvėsinamas filtratas, kad kristalai išsiskirtų?', 'Where is the filtrate cooled so that the crystals separate?'),
            t('Žemas platus indas leidžia kolbą visą apsupti šalčio vonia. Toks indas vadinamas kristalizatoriumi.', 'A low, wide vessel lets the flask be surrounded by a cooling bath. Such a vessel is called a crystalliser.'),
            t('Kristalizatorius yra šaldymo vonia kristalinimui.', 'The crystalliser is the cold bath for crystallisation.'), 'LW1 p5'),
          mc('l1.app.6',
            t('Plonas stiklinis vamzdelis, vienu galu užlydytas, kuriame kaitinamas mažas medžiagos kiekis.', 'A thin glass tube sealed at one end, in which a small amount of substance is heated.'),
            t('Kam jis naudojamas šiame darbe?', 'What is it used for in this lab?'),
            [t('Lydymosi temperatūrai nustatyti', 'To determine the melting point'), t('Tirpikliui paimti', 'To measure out the solvent'), t('Vakuumui sukurti', 'To produce a vacuum'), t('Kristalams džiovinti', 'To dry the crystals')],
            t('Kam reikalinga labai nedidelė medžiagos porcija?', 'What needs only a very small portion of substance?'),
            t('Kapiliaras sulaiko nedidelį kiekį medžiagos, kuri greitai ir tolygiai įkaista aparate, ir leidžia tiksliai stebėti lydymąsi.', 'The capillary holds a small amount of substance that heats quickly and evenly in the apparatus and lets the melting be watched closely.'),
            t('Mažas kiekis lydosi vienodai, todėl intervalas matuojamas tiksliai.', 'A small amount melts uniformly, so the range is measured accurately.'), 'LW1 p4'),
          mc('l1.app.7',
            t('Dėžė su reguliuojama temperatūra, kurioje kristalai džiovinami 80 °C temperatūroje apie 20 minučių.', 'A box with adjustable temperature in which crystals are dried at 80 °C for about 20 minutes.'),
            t('Kas tai?', 'What is it?'),
            [t('Džiovinimo spinta', 'Drying cabinet'), t('Kristalizatorius', 'Crystalliser'), t('Biuchnerio piltuvas', 'Büchner funnel'), t('Garų kondensatorius', 'Vapour condenser')],
            t('Kuri įranga šalina tirpiklio likučius?', 'Which equipment removes the residual solvent?'),
            t('Spintoje palaikoma pastovi temperatūra, žemesnė už medžiagos lydymosi temperatūrą, ir tirpiklis iš kristalų išgaruoja neištirpdant jų.', 'The cabinet holds a steady temperature below the melting point of the substance, and the solvent leaves the crystals without melting them.'),
            t('Džiovinimo spinta išdžiovina kristalus nesulydydama jų.', 'The drying cabinet dries crystals without melting them.'), 'LW1 p4'),
          mc('l1.app.8',
            t('Mažas stiklinis piltuvėlis, į kurio kaklelį įdėta vatos, naudojamas karštam tirpalui filtruoti.', 'A small glass funnel with a plug of cotton wool in its neck, used to filter a hot solution.'),
            t('Kam vata?', 'What is the cotton for?'),
            [t('Sulaiko netirpias daleles, kai filtruojamas nedidelis tirpalo kiekis.', 'It holds back insoluble particles when a small amount of solution is filtered.'),
              t('Sugeria produktą, kad jis nepatektų į filtratą.', 'It absorbs the product so that it does not reach the filtrate.'),
              t('Šildo tirpalą.', 'It heats the solution.'),
              t('Sudaro vakuumą.', 'It produces the vacuum.')],
            t('Kokio dydžio tirpalą galima filtruoti per tokį piltuvėlį?', 'What size of solution can be filtered through such a funnel?'),
            t('Nedideliems kiekiams pakanka piltuvėlio su vata ar rievėtu popierinio filtro. Dideliems naudojamas Biuchnerio piltuvas su vakuumu.', 'For small amounts a funnel with cotton or a fluted paper filter is enough. For large ones the Büchner funnel with vacuum is used.'),
            t('Aparatas parenkamas pagal kiekį.', 'The apparatus is chosen by the amount.'), 'LW1 p3')
        ]
      },

      /* ----- defence questions ----- */
      {
        id: 'l1.defence',
        title: t('Gynimo klausimai', 'Defence questions'),
        mirrors: ['LW1.8'],
        bank: [
          mc('l1.defence.1',
            t('Dėstytojas klausia, kodėl kristalinant gaunama grynesnė medžiaga.', 'The examiner asks why recrystallisation gives a purer product.'),
            t('Kuris atsakymas teisingas?', 'Which answer is right?'),
            [t('Priemaišų yra mažai, todėl jos lieka tirpale, o produktas, esant sočiam tirpalui, atvėsus išsiskiria.', 'Impurities are few, so they stay in solution, while the product separates from the saturated solution on cooling.'),
              t('Priemaišos reaguoja su tirpikliu ir virsta dujomis.', 'Impurities react with the solvent and turn into gases.'),
              t('Kristalinimas ištirpdo visas priemaišas amžiams.', 'Crystallisation dissolves all impurities for good.'),
              t('Kristalinimas keičia produkto cheminę sudėtį.', 'Crystallisation changes the chemical composition of the product.')],
            t('Kas atsitinka su kiekviena medžiaga, kai tirpalas vėsta?', 'What happens to each substance as the solution cools?'),
            t('Atvėsus tirpalas tampa persotintas produkto atžvilgiu ir produktas kristalizuojasi. Priemaišų tirpale mažai, todėl jų tirpumo riba nepasiekiama ir jos lieka ištirpusios.', 'On cooling the solution becomes supersaturated with the product and the product crystallises. There is little impurity, so its solubility limit is not reached and it stays dissolved.'),
            t('Skirtingas medžiagų kiekis tirpale lemia, kuri iškrenta.', 'The different amounts in solution decide which one drops out.'), 'LW1 p1'),
          mc('l1.defence.2',
            t('Reikia parinkti tirpiklį kristalinimui, bet jo savybės nežinomos.', 'A solvent for recrystallisation must be chosen, but nothing is known about it.'),
            t('Kaip pagrįstai pradėti?', 'How can one begin sensibly?'),
            [t('Pagal taisyklę „panašus tirpsta panašiame“, o tada išbandyti mažais kiekiais.', 'By the rule "like dissolves like", then testing it with small amounts.'),
              t('Rinktis tirpiklį su aukščiausia virimo temperatūra.', 'Choose the solvent with the highest boiling point.'),
              t('Rinktis brangiausią tirpiklį.', 'Choose the most expensive solvent.'),
              t('Rinktis tirpiklį, kuriame medžiaga tirpsta šaltai.', 'Choose a solvent in which the substance dissolves cold.')],
            t('Kuri taisyklė suteikia pradinę kryptį ir kas patvirtina pasirinkimą?', 'Which rule gives the starting direction and what confirms the choice?'),
            t('Taisyklė tik rodo kryptį. Pirmiausia pasirenkamos tinkamos polinės ar nepolinės medžiagos, o tinkamumą patvirtina bandymas mėgintuvėliuose su labai mažu medžiagos kiekiu.', 'The rule only gives a direction. First polar or non-polar solvents are chosen to match, and a test in tubes with a tiny amount of substance confirms the suitability.'),
            t('Teorija nusako kryptį, bandymas nusprendžia.', 'Theory gives the direction, the experiment decides.'), 'LW1 p1'),
          mc('l1.defence.3',
            t('Studentas pasakoja: „Medžiaga ištirpo šaltame vandenyje, bet aš vis tiek atvėsinau tirpalą ir laukiau kristalų“.', 'A student says: "The substance dissolved in cold water, but I cooled the solution anyway and waited for crystals."'),
            t('Kas čia nesuprasta?', 'What has been misunderstood?'),
            [t('Jei medžiaga tirpsta šaltame tirpiklyje, jis netinka, ir atvėsinus kristalų beveik nebus.', 'If the substance dissolves in the cold solvent, the solvent is unsuitable and few crystals will form on cooling.'),
              t('Reikėjo vėsinti ne ledu, o šiluma.', 'It should have been cooled with heat, not ice.'),
              t('Reikėjo pridėti daugiau medžiagos.', 'More substance should have been added.'),
              t('Nieko, taip ir turi būti.', 'Nothing, that is how it should be.')],
            t('Kuri sąlyga yra pirmoji reikalavimų tirpikliui sąraše?', 'Which condition comes first in the list of requirements for the solvent?'),
            t('Tinkamas tirpiklis šaltame turi tirpinti mažai. Jei tirpina gerai, tirpiklį keičia, o ne bando kristalinti iš jo.', 'A suitable solvent dissolves little when cold. If it dissolves well, the solvent is changed and one does not try to recrystallise from it.'),
            t('Tirpiklio tirpinimo gebos skirtumas tarp karšto ir šalto yra kristalinimo pagrindas.', 'The difference in dissolving power between hot and cold is the basis of recrystallisation.'), 'LW1 p1'),
          mc('l1.defence.4',
            t('Dėstytojas klausia, ką reiškia gryno junginio lydymosi temperatūra.', 'The examiner asks what the melting point of a pure compound means.'),
            t('Kuris teiginys teisingas?', 'Which statement is correct?'),
            [t('Gryna medžiaga lydosi siaurame intervale (apie 0,1–1 °C), o priemaišos temperatūrą sumažina.', 'A pure substance melts over a narrow range (about 0.1 to 1 °C), and impurities lower the temperature.'),
              t('Gryna medžiaga lydosi platesniame intervale nei nešvari.', 'A pure substance melts over a wider range than an impure one.'),
              t('Priemaišos lydymosi temperatūrą pakelia.', 'Impurities raise the melting point.'),
              t('Lydymosi temperatūra nepriklauso nuo grynumo.', 'The melting point does not depend on purity.')],
            t('Kaip kinta intervalo plotis, kai pridedama priemaišų?', 'How does the width of the range change when impurities are added?'),
            t('Priemaišos žemina ir plečia lydymosi intervalą, todėl lydymosi temperatūra yra jautrus grynumo kriterijus.', 'Impurities lower and widen the melting range, which makes the melting point a sensitive criterion of purity.'),
            t('Siauras intervalas ir aukštesnė temperatūra rodo grynumą.', 'A narrow range and a higher temperature indicate purity.'), 'LW1 p4'),
          mc('l1.defence.5',
            t('Dėstytojas klausia, kodėl nufiltruoti kristalai nuplaunami mažu kiekiu šalto tirpiklio.', 'The examiner asks why the filtered crystals are washed with a small amount of cold solvent.'),
            t('Kuris atsakymas geriausias?', 'Which answer is best?'),
            [t('Kad pašalintų paviršiuje likusį motininį tirpalą su priemaišomis, o produkto per daug neištirpintų.', 'To remove mother liquor with impurities left on the surface without dissolving too much product.'),
              t('Kad pakeistų kristalų spalvą.', 'To change the colour of the crystals.'),
              t('Kad paspartintų džiovinimą šildant.', 'To speed up drying by heating.'),
              t('Kad padidintų išeigą.', 'To raise the yield.')],
            t('Kas lieka ant kristalų paviršiaus, kai tirpalas nusunkiamas?', 'What stays on the surface of the crystals when the liquid has been drawn off?'),
            t('Paviršiuje lieka plėvelė motininio tirpalo, kuriame yra priemaišų. Ją nuplauna nedidelis šalto tirpiklio kiekis, o produktas beveik netirpsta.', 'A film of mother liquor containing impurities stays on the surface. A small amount of cold solvent rinses it off while the product barely dissolves.'),
            t('Plovimas valo paviršių, o ne tirpina produktą.', 'Rinsing cleans the surface and does not dissolve the product.'), 'LW1 p4'),
          mc('l1.defence.6',
            t('Dėstytojas klausia, kodėl išeiga kristalinant niekada nesiekia 100 %.', 'The examiner asks why a recrystallisation yield never reaches 100 %.'),
            t('Kuris atsakymas teisingas?', 'Which answer is right?'),
            [t('Dalis produkto lieka tirpale net šaltame tirpiklyje, be to, šiek tiek prarandama filtruojant.', 'Some product stays in solution even in the cold solvent, and a little is lost in filtering.'),
              t('Kristalinimo metu produktas skyla į kitas medžiagas.', 'The product breaks down into other substances during recrystallisation.'),
              t('Svarstyklės visada rodo mažiau.', 'The balance always reads low.'),
              t('Aušinimas sunaikina dalį kristalų.', 'Cooling destroys some of the crystals.')],
            t('Kur galima rasti nuostolį, jei išgarinsite filtratą?', 'Where could the loss be found if you evaporated the filtrate?'),
            t('Tirpumas šaltame tirpiklyje nelygus nuliui, todėl motininiame tirpale lieka produkto. Filtravimo ir perkėlimo nuostoliai prisideda.', 'The solubility in the cold solvent is not zero, so product stays in the mother liquor. Losses on filtering and transferring add to it.'),
            t('Dalis medžiagos neišvengiamai ištirpusi, o likusi sudaro kristalus.', 'Some material is unavoidably dissolved and the rest forms crystals.'), 'LW1 p1'),
          mc('l1.defence.7',
            t('Dėstytojas klausia, kuo skiriasi dviejų junginių lydymosi temperatūros sutapimas ir mišriosios lydymosi temperatūros rezultatas.', 'The examiner asks how a coincidence of two melting points differs from a mixed melting point result.'),
            t('Kuris atsakymas teisingas?', 'Which answer is correct?'),
            [t('Sutapimas gali būti atsitiktinis, o mišinio lydymosi temperatūros nepasikeitimas rodo, kad medžiagos tapačios.', 'A coincidence can be accidental, while an unchanged mixed melting point shows the substances are identical.'),
              t('Abu rodo tą patį ir yra vienodai patikimi.', 'Both show the same and are equally reliable.'),
              t('Mišinio lydymosi temperatūra nieko nerodo.', 'The mixture melting point shows nothing.'),
              t('Sutapimas visada įrodo tapatumą.', 'A coincidence always proves identity.')],
            t('Ką daro skirtingų medžiagų priemaiša lydymosi temperatūrai?', 'What does a foreign substance do to the melting point?'),
            t('Dvi skirtingos medžiagos viena kitai yra priemaiša, todėl mišinys lydosi žemiau. Tapatūs mėginiai sumaišyti neturi kitokio elgesio.', 'Two different substances are impurities to each other, so the mixture melts lower. Identical samples mixed together behave no differently.'),
            t('Mišinys keičia sutapimo patikimumą iš spėjimo į įrodymą.', 'The mixture turns the match from a guess into a proof.'), 'LW1 p4'),
          mc('l1.defence.8',
            t('Dėstytojas klausia, ką daryti, kai tirpalas atvėsta, bet kristalų nėra.', 'The examiner asks what to do when the solution has cooled but no crystals appear.'),
            t('Kokie veiksmai pagrįsti?', 'Which actions are sensible?'),
            [t('Įtrinti stikliniu lazdele ar įmesti kristaliuką; jei nepadeda – dalį tirpiklio nugarinti.', 'Scratch with a glass rod or add a seed crystal; if that does not help, boil off some of the solvent.'),
              t('Pridėti daugiau tirpiklio.', 'Add more solvent.'),
              t('Pridėti daugiau aktyvintos anglies.', 'Add more activated charcoal.'),
              t('Išpilti tirpalą ir pradėti nuo pradžių.', 'Pour the solution away and start from the beginning.')],
            t('Kokios dvi priežastys dažniausios, kai kristalai nesidaro?', 'What are the two most common reasons why crystals do not form?'),
            t('Arba tirpalas persotintas ir trūksta kristalizacijos centrų, arba tirpiklio per daug. Pirmu atveju padeda įbrėžimas ar kristaliukas, antru – dalies tirpiklio išgarinimas.', 'Either the solution is supersaturated and lacks nucleation sites, or there is too much solvent. In the first case a scratch or a seed helps, in the second boiling some solvent off does.'),
            t('Pirma bandoma paprasčiausia, o tirpalas niekada neišmetamas.', 'The simplest remedy is tried first, and the solution is never thrown away.'), 'LW1 p3')
        ]
      }
    ],
    coverage: {
      'LW1.1': ['l1.why', 'l1.solub'],
      'LW1.2': ['l1.why', 'l1.observe'],
      'LW1.3': ['l1.order', 'l1.observe'],
      'LW1.4': ['l1.order', 'l1.app'],
      'LW1.5': ['l1.observe', 'l1.proof', 'l1.mp'],
      'LW1.6': ['l1.yield', 'l1.solub'],
      'LW1.7': ['l1.order', 'l1.why'],
      'LW1.8': ['l1.proof', 'l1.defence']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
