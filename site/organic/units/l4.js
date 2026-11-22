// site/organic/units/l4.js: lab unit 4, synthesis of acetylsalicylic acid (aspirin)
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });

  const SAL = 'Oc1ccccc1C(=O)O';
  const ASP = 'CC(=O)Oc1ccccc1C(=O)O';
  const ANH = 'CC(=O)OC(C)=O';
  const AA = 'CC(=O)O';
  const salName = t('salicilo rūgštis (2-hidroksibenzenkarboksirūgštis)', 'salicylic acid (2-hydroxybenzoic acid)');

  // a single-choice step with [lt, en] option pairs; the right option is written first (the trainer shuffles)
  const ch = (prompt, options, hint, solution) => ({
    prompt, kind: 'choice', options: options.map(o => ({ text: t(o[0], o[1]) })), answer: 0, hint, solution
  });
  // an order step: options are written in the right order
  const ord = (prompt, options, hint, solution) => ({
    prompt, kind: 'order', options: options.map(o => ({ text: t(o[0], o[1]) })), hint, solution
  });
  // one bank problem with one step
  const P = (id, q, step, why, src) => ({ id, q: [{ p: q }], steps: [step], why, src });
  const SORT = t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.');

  const U = {
    id: 'l4',
    notes: [
      {
        id: 'aim',
        title: t('Tikslas, principas ir saugumas', 'Aim, principle and safety'),
        blocks: [
          { h: t('Ką gaunate ir kodėl', 'What you make, and why') },
          {
            p: t('Darbe sintetinama acetilsalicilo rūgštis, vaistas aspirinas. Pradinė medžiaga yra salicilo rūgštis: ji turi fenolinę $OH$ grupę ir karboksilo grupę. Acilinama fenolinė $OH$, o karboksilo grupė lieka nepaliesta. Gynime reikia mokėti paaiškinti reakciją, kiekvieną darbo žingsnį ir bandymą, kuriuo tikrinama, ar produkte neliko salicilo rūgšties.',
              'The lab makes acetylsalicylic acid, the drug aspirin. The starting material is salicylic acid, which has a phenolic $OH$ group and a carboxyl group. The phenolic $OH$ is acylated and the carboxyl group stays untouched. At the defence you must be able to explain the reaction, every step of the work and the test that shows whether any salicylic acid is left in the product.'),
            src: 'LW4 p1'
          },
          {
            scheme: {
              items: [
                { smi: SAL, name: t('2-hidroksibenzenkarboksirūgštis', '2-hydroxybenzoic acid') }, { plus: true },
                { smi: ANH, name: t('etano rūgšties anhidridas', 'ethanoic anhydride') }, { arrow: '→', above: f('H2SO4') },
                { smi: ASP, name: t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid') }, { plus: true },
                { smi: AA, name: t('etano rūgštis', 'ethanoic acid') }
              ]
            },
            caption: t('Salicilo rūgštis ir acetanhidridas duoda aspiriną ir acto rūgštį (šalutinis produktas).', 'Salicylic acid and acetic anhydride give aspirin and acetic acid (the by-product).'),
            src: 'LW4 p1'
          },
          {
            rule: t('Fenolio $OH$ su anhidridu virsta esteriu (acilinimas). Anhidridas yra reaktyvesnis acilinimo reagentas už rūgštį, o sieros rūgštis tik katalizuoja: jos užtenka keleto lašų.',
              'A phenolic $OH$ with an anhydride becomes an ester (acylation). The anhydride is a more reactive acylating reagent than the acid, and sulfuric acid only catalyses: a few drops are enough.')
          },
          { h: t('Įranga', 'Equipment') },
          {
            list: [
              t('Erlenmejerio kolba, matavimo cilindras, magnetinė maišyklė su tefloniniu maišikliukėliu;', 'an Erlenmeyer flask, a measuring cylinder, a magnetic stirrer with a Teflon stir bar;'),
              t('kamštelis kolbai uždaryti, kristalizatorius su vandeniu ir ledu;', 'a stopper to close the flask, a crystallising dish with water and ice;'),
              t('vakuuminiam filtravimui: Biuchnerio piltuvas, sujungtas su Bunzeno kolba, ir stiklinis kamštis kristalams nuspausti;', 'for vacuum filtration, a Büchner funnel joined to a Bunsen flask, and a glass stopper to press the crystals;'),
              t('džiovinimo krosnis (80 °C), mėgintuvėlis kokybiniam bandymui, termometras.', 'a drying oven (80 °C), a test tube for the qualitative test, a thermometer.')
            ],
            src: 'LW4 p1'
          },
          {
            pitfall: t('Acetanhidridas stipriai kvepia ir dirgina odą bei kvėpavimo takus: matuokite jį traukos spintoje, su akiniais ir pirštinėmis. Koncentruota $H2SO4$ ėsdina, todėl lašinkite atsargiai. Panaudotą stiklą plaukite šiltu vandeniu ir sudėkite į jam skirtą vietą.',
              'Acetic anhydride has a sharp smell and irritates skin and airways: measure it in the fume hood, with goggles and gloves. Concentrated $H2SO4$ is corrosive, so add it with care. Wash used glassware with warm water and put it back in its place.'),
            src: 'LW4 p1'
          },
          { practice: 'l4.apparatus' }
        ]
      },
      {
        id: 'procedure',
        title: t('Darbo eiga ir kiekvieno žingsnio paskirtis', 'The procedure and the purpose of each step'),
        blocks: [
          {
            list: [
              t('Kolboje sumaišoma salicilo rūgštis (0,0145 mol, tai 2 g) su acetanhidridu (apie 0,053 mol, tai 5 ml). Anhidridas yra perteklinis: salicilo rūgštis yra ribojantis reagentas, o perteklius užtikrina visišką sureagavimą.', 'In an Erlenmeyer flask salicylic acid (0.0145 mol, which is 2 g) is mixed with acetic anhydride (about 0.053 mol, which is 5 ml). The anhydride is in excess: salicylic acid is the limiting reagent, and the excess makes the reaction go to completion.'),
              t('Įdedamas tefloninis maišiklis, įjungiama maišyklė ir įlašinami 4 lašai konc. $H2SO4$. Rūgštis protonuoja anhidrido karbonilo deguonį ir padaro jį stipresniu elektrofilu.', 'The Teflon bar goes in, the stirrer is switched on and 4 drops of conc. $H2SO4$ are added. The acid protonates the carbonyl oxygen of the anhydride and makes it a stronger electrophile.'),
              t('Kolba uždengiama kamšteliu ir 30 min maišoma kambario temperatūroje. Salicilo rūgštis ištirpsta, o aspirinas iškrinta nuosėdomis.', 'The flask is covered and stirred for 30 min at room temperature. The salicylic acid dissolves and aspirin separates as a solid.'),
              t('Lėtai pilama 25 ml distiliuoto vandens ir maišoma dar 5 min. Vanduo suskaido acetanhidrido perteklių į acto rūgštį (reakcija šiluminė, todėl lėtai) ir verčia aspiriną kristalizuotis.', 'Slowly add 25 ml of distilled water and stir for 5 min more. Water breaks down the excess anhydride to acetic acid (the reaction gives off heat, hence slowly) and makes the aspirin crystallise.'),
              t('Mišinys perpilamas į kristalizatorių su vandeniu ir ledu: žemoje temperatūroje aspirinas tirpsta dar mažiau.', 'The mixture is poured into a crystallising dish with water and ice: at low temperature aspirin dissolves even less.'),
              t('Kristalai filtruojami vakuume Biuchnerio piltuvu ir plaunami keturis kartus po 15 ml ledinio vandens: nuplaunama acto rūgštis ir $H2SO4$. Paskui jie nuspaudžiami stikliniu kamščiu ir sausai nugramdomi ant filtro popieriaus.', 'The crystals are vacuum-filtered on the Büchner funnel and washed four times with 15 ml of ice water: this removes acetic acid and $H2SO4$. They are then pressed with the glass stopper and scraped onto filter paper.'),
              t('Nedidelis kiekis drėgnos medžiagos paimamas $FeCl3$ bandymui, likusi 20 min. džiovinama 80 °C krosnyje, po to sveriama, o termometru nustatoma lydymosi temperatūra.', 'A small amount of the moist product is kept for the $FeCl3$ test, the rest is dried in the oven at 80 °C for 20 min, then weighed, and its melting point is measured.')
            ],
            ordered: true,
            src: 'LW4 p1'
          },
          {
            pitfall: t('Ledinio vandens plovimas nėra tas pats, kas karšto: šiltame vandenyje dalis aspirino ištirptų, o dalis hidrolizuotųsi atgal į salicilo rūgštį ir acto rūgštį.',
              'Washing with ice water is not the same as with warm water: in a warm liquid some of the aspirin would dissolve and some would hydrolyse back to salicylic and acetic acid.')
          },
          { practice: 'l4.order' },
          { practice: 'l4.why' }
        ]
      },
      {
        id: 'mechanism',
        title: t('Reakcijos mechanizmas', 'The mechanism'),
        blocks: [
          {
            p: t('Tai nukleofilinis acilpakeitimas (prijungimas–atskilimas). Fenolio deguonis yra silpnas nukleofilas, todėl rūgšties katalizė svarbi: protonuotas karbonilas turi didelį dalinį teigiamą krūvį, ir fenolio laisvoji elektronų pora atakuoja šią anglį.',
              'This is nucleophilic acyl substitution (addition, then elimination). The phenolic oxygen is a weak nucleophile, so acid catalysis matters: a protonated carbonyl carries a large partial positive charge, and a lone pair of the phenol attacks this carbon.'),
            src: 'LW4 p1'
          },
          {
            mech: [{
              scheme: { items: [{ smi: 'CC(=[OH+])OC(C)=O', opts: { allH: true, coords: [[0, 0], [0.87, 0.5], [0.87, 1.5], [1.73, 0], [2.6, 0.5], [3.46, 0], [2.6, 1.5]] } }, { plus: true }, { smi: SAL, opts: { lonePairs: [0] } }] },
              arrows: [{ from: { m: 1, lp: 0 }, to: { m: 0, a: 1 } }, { from: { m: 0, b: [1, 2] }, to: { m: 0, a: 2 } }],
              note: t('Fenolio deguonies laisvoji pora atakuoja protonuoto anhidrido karbonilo anglį; $C=O$ ryšio elektronai pereina deguoniui.', 'A lone pair of the phenolic oxygen attacks the carbonyl carbon of the protonated anhydride; the $C=O$ electrons move onto oxygen.')
            }],
            src: 'LW4 p1'
          },
          {
            p: t('Susidaro tetraedrinis tarpinis junginys. Jame $OH$ grupė atstato karbonilą, o anglies ir acetato deguonies ryšys nutrūksta: išeina acto rūgštis kaip nueinančioji grupė. Galiausiai prarandamas protonas, ir gaunamas aspirinas.',
              'A tetrahedral intermediate forms. Its $OH$ group restores the carbonyl while the bond from carbon to the acetate oxygen breaks: acetic acid leaves as the leaving group. Finally a proton is lost and aspirin results.')
          },
          {
            scheme: {
              items: [
                { smi: 'CC(O)([OH+]c1ccccc1C(=O)O)OC(C)=O' }, { arrow: '→' },
                { smi: ASP, name: t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid') }, { plus: true },
                { smi: AA, name: t('etano rūgštis', 'ethanoic acid') }, { plus: true }, { smi: '[H+]' }
              ]
            },
            caption: t('Tetraedrinis tarpinis junginys suyra: išsiskiria acto rūgštis ir protonas (katalizatorius atsistato).', 'The tetrahedral intermediate collapses: acetic acid and a proton leave (the catalyst is regenerated).')
          },
          {
            rule: t('Aspirine fenolio $OH$ pakeista acetilo esterio grupe, todėl jis nebesudaro spalvoto komplekso su $FeCl3$. Tai ir yra reakcijos pabaigos įrodymas.',
              'In aspirin the phenolic $OH$ has been replaced by an acetyl ester group, so it no longer forms a coloured complex with $FeCl3$. That is the evidence that the reaction is finished.')
          },
          { practice: 'l4.defence' }
        ]
      },
      {
        id: 'results',
        title: t('Stebėjimai, $FeCl3$ bandymas ir išeiga', 'Observations, the $FeCl3$ test and the yield'),
        blocks: [
          { h: t('Ar liko salicilo rūgšties?', 'Is any salicylic acid left?') },
          {
            p: t('Mažas kiekis produkto ištirpinamas 3 ml distiliuoto vandens (šalto, maišant stikline lazdele) ir įlašinami 3 lašai $FeCl3$ tirpalo. Fenolio $OH$ su $Fe3+$ sudaro violetinį kompleksą, kuriame dalyvauja fenolio deguonis ir karboksilatas. Aspirinas fenolio $OH$ neturi, todėl spalvos nėra. Violetinė spalva reiškia, kad liko nesureagavusios salicilo rūgšties.',
              'A small amount of product is dissolved in 3 ml of distilled water (cold, stirring with a glass rod) and 3 drops of $FeCl3$ solution are added. A phenolic $OH$ forms a violet complex with $Fe3+$, in which the phenolic oxygen and the carboxylate take part. Aspirin has no phenolic $OH$, so there is no colour. A violet colour means that unreacted salicylic acid is left.'),
            src: 'LW4 p2'
          },
          {
            table: {
              head: [t('Stebėjimas', 'Observation'), t('Ką reiškia', 'What it means')],
              rows: [
                [t('violetinė spalva su $FeCl3$', 'violet colour with $FeCl3$'), t('yra laisvos fenolio $OH$: liko salicilo rūgšties', 'free phenolic $OH$ is present: salicylic acid is left')],
                [t('spalvos nėra', 'no colour'), t('laisvo fenolio nepastebėta: acilinimas pilnas', 'no free phenol seen: acylation is complete')],
                [t('lydymosi temperatūra apie 135 °C, siauras intervalas', 'melting point about 135 °C, narrow range'), t('produktas grynas', 'the product is pure')],
                [t('žema temperatūra, platus intervalas', 'low temperature, broad range'), t('yra priemaišų: reikia perkristalinti', 'impurities are present: recrystallise')]
              ]
            },
            src: 'LW4 p2'
          },
          {
            pitfall: t('Jei produktą verdate vandenyje, jis hidrolizuojasi į salicilo rūgštį ir $FeCl3$ rodo violetinę spalvą, nors produkte jos nebuvo. Todėl tirpalas nekaitinamas.',
              'If you heat the product in water it hydrolyses to salicylic acid and $FeCl3$ shows violet even though there was none in the product. That is why the solution is not heated.'),
            src: 'LW4 p2'
          },
          { h: t('Išeiga', 'Yield') },
          {
            rule: t('Išeiga $= m_{gauta} / m_{teor.} · 100$ %. Teorinė masė skaičiuojama iš ribojančio reagento (salicilo rūgšties) santykiu 1 : 1, jei užrašytas lygus kiekis molių.',
              'Yield $= m_{obtained} / m_{theor.} · 100$ %. The theoretical mass is calculated from the limiting reagent (salicylic acid) in a 1 : 1 ratio.'),
            src: 'LW4 p2'
          },
          {
            example: {
              q: [{ p: t('Imta 2,00 g salicilo rūgšties ($M$ = 138,12 g/mol), gauta 1,85 g aspirino ($M$ = 180,16 g/mol). Kokia išeiga?', '2.00 g of salicylic acid ($M$ = 138.12 g/mol) was taken and 1.85 g of aspirin ($M$ = 180.16 g/mol) was obtained. What is the yield?') }],
              steps: [
                [{ p: t('Ribojantis reagentas yra salicilo rūgštis: $n = 2,00 / 138,12 = 0,0145$ mol.', 'The limiting reagent is salicylic acid: $n = 2.00 / 138.12 = 0.0145$ mol.') }, { mol: { smi: SAL, name: t('2-hidroksibenzenkarboksirūgštis', '2-hydroxybenzoic acid') } }],
                [{ p: t('Santykis 1 : 1, todėl aspirino taip pat gali susidaryti 0,0145 mol, tai $0,0145 · 180,16 = 2,61$ g.', 'The ratio is 1 : 1, so 0.0145 mol of aspirin can form: $0.0145 · 180.16 = 2.61$ g.') }, { mol: { smi: ASP, name: t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid') } }],
                [{ p: t('Išeiga $= 1,85 / 2,61 · 100 = 70,9$ %.', 'Yield $= 1.85 / 2.61 · 100 = 70.9$ %.') }]
              ]
            },
            claims: [
              { formula: [SAL, 'C7H6O3'] }, { formula: [ASP, 'C9H8O4'] },
              { react: ['phenol.acyl', [SAL, ANH], null, ASP] },
              { name: [ASP, t('2-acetiloksibenzenkarboksirūgštis', '2-(acetyloxy)benzoic acid')] }
            ]
          },
          { practice: 'l4.observe' },
          { practice: 'l4.proves' },
          { practice: 'l4.calc' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        table: {
          head: [t('Dalykas', 'Item'), t('Svarbiausia', 'Key point')],
          rows: [
            [t('Reakcija', 'Reaction'), t('salicilo rūgštis + acetanhidridas → aspirinas + acto rūgštis, katalizatorius $H2SO4$', 'salicylic acid + acetic anhydride → aspirin + acetic acid, catalyst $H2SO4$')],
            [t('Tipas', 'Type'), t('nukleofilinis acilpakeitimas, fenolio $OH$ virsta esteriu', 'nucleophilic acyl substitution, the phenolic $OH$ becomes an ester')],
            [t('Ribojantis reagentas', 'Limiting reagent'), t('salicilo rūgštis (0,0145 mol); acetanhidridas 0,053 mol', 'salicylic acid (0.0145 mol); acetic anhydride 0.053 mol')],
            [t('Išskyrimas', 'Isolation'), t('vanduo, ledas, vakuuminis filtravimas, plovimas ledu', 'water, ice, vacuum filtration, washing with ice water')],
            [t('$FeCl3$ bandymas', '$FeCl3$ test'), t('violetinė spalva = liko salicilo rūgšties; nekaitinti', 'violet = salicylic acid left; do not heat')],
            [t('Lydymosi temperatūra', 'Melting point'), t('aspirinas apie 135 °C; platus ir žemesnis intervalas rodo priemaišas', 'aspirin about 135 °C; a broad, lowered range shows impurities')]
          ]
        }
      },
      {
        list: [
          t('Išeiga $= m_{gauta} / m_{teor.} · 100$ %; teorinė masė iš ribojančio reagento.', 'Yield $= m_{obtained} / m_{theor.} · 100$ %; the theoretical mass comes from the limiting reagent.'),
          t('Rf yra dėmės kelias, padalytas iš tirpiklio fronto kelio.', 'Rf is the spot distance divided by the distance of the solvent front.')
        ]
      }
    ],
    types: [
      // ------------------------------------------------------------------ order
      {
        id: 'l4.order',
        title: t('Darbo eiga: išdėstykite žingsnius', 'Procedure: put the steps in order'),
        mirrors: ['LW4.1', 'LW4.2', 'LW4.3', 'LW4.4', 'LW4.5', 'LW4.6', 'LW4.7', 'LW4.8'],
        bank: [
          P('l4.order.1', t('Pradedate aspirino sintezę.', 'You start the aspirin synthesis.'),
            ord(SORT, [
              ['Į kolbą įberti 2 g salicilo rūgšties', 'Put 2 g of salicylic acid into the flask'],
              ['Traukos spintoje įpilti 5 ml acetanhidrido', 'In the fume hood add 5 ml of acetic anhydride'],
              ['Įdėti tefloninį maišiklį ir įjungti maišyklę', 'Add the Teflon stir bar and switch on the stirrer'],
              ['Maišant įlašinti 4 lašus konc. $H2SO4$', 'While stirring add 4 drops of conc. $H2SO4$'],
              ['Uždengti kolbą ir maišyti 30 min', 'Cover the flask and stir for 30 min']
            ], t('Katalizatorius dedamas, kai reagentai jau sumaišyti ir maišoma.', 'The catalyst goes in once the reagents are mixed and stirring.'),
              t('Pirma sudedami reagentai ir įjungiamas maišymas, tik tada lašinama rūgštis, o reakcija vyksta uždengtoje kolboje.', 'First the reagents go in and stirring starts, only then the acid is added, and the reaction runs in the covered flask.')),
            t('Rūgštis lašinama maišant, kad katalizatorius pasiskirstytų tolygiai, o kolba uždengiama garams sulaikyti.', 'The acid is added under stirring so that the catalyst is spread evenly, and the flask is covered to hold back the vapours.'), 'LW4 p1'),
          P('l4.order.2', t('Reakcija baigėsi, gaunate kristalus.', 'The reaction is over and you want the crystals.'),
            ord(SORT, [
              ['Lėtai įpilti 25 ml distiliuoto vandens', 'Slowly add 25 ml of distilled water'],
              ['Maišyti dar 5 min', 'Stir for another 5 min'],
              ['Mišinį perpilti į kristalizatorių su vandeniu ir ledu', 'Pour the mixture into the crystallising dish with water and ice'],
              ['Nufiltruoti kristalus Biuchnerio piltuvu', 'Filter the crystals on the Büchner funnel'],
              ['Nuplauti keturis kartus po 15 ml ledinio vandens', 'Wash with four portions of 15 ml of ice water']
            ], t('Pirma sunaikinamas anhidrido perteklius, o tik paskui kristalai atskiriami.', 'First the excess anhydride is destroyed, and only then are the crystals separated.'),
              t('Vanduo suskaido perteklių, ledas sumažina tirpumą, filtravimas atskiria kietą medžiagą, o plovimas pašalina rūgštis.', 'Water destroys the excess, ice reduces the solubility, filtration separates the solid and washing removes the acids.')),
            t('Kiekvienas žingsnis ruošia kitą: pirma kristalizacija, paskui atskyrimas ir valymas.', 'Each step prepares the next: crystallisation first, then separation and cleaning.'), 'LW4 p1'),
          P('l4.order.3', t('Turite filtre kristalus ir norite juos paruošti tolesniems veiksmams.', 'You have crystals on the filter and want to prepare them for the next steps.'),
            ord(SORT, [
              ['Kristalus filtre nuspausti stikliniu kamščiu', 'Press the crystals on the filter with the glass stopper'],
              ['Nugramdyti ant pasverto popierėlio', 'Scrape them onto a pre-weighed paper'],
              ['Nedidelį kiekį drėgnos medžiagos išimti bandymui', 'Take a small amount of the moist product for the test'],
              ['Likusią medžiagą džiovinti 20 min krosnyje 80 °C', 'Dry the rest for 20 min in the oven at 80 °C'],
              ['Išdžiūvusią medžiagą pasverti', 'Weigh the dried material']
            ], t('Svorį verta nustatyti tik tada, kai medžiaga išdžiūvusi.', 'The weight means something only once the material is dry.'),
              t('Nuspaudimas pašalina motininį tirpalą, tada paimamas bandinys, o masė matuojama tik po džiovinimo, kad drėgmė neiškreiptų išeigos.', 'Pressing removes the mother liquor, then a sample is taken, and the mass is measured only after drying so that moisture does not distort the yield.')),
            t('Drėgna medžiaga sveria daugiau už tikrąją, todėl pirma džiovinama, o paskui sveriama.', 'Moist material weighs more than the real product, so it is dried first and weighed afterwards.'), 'LW4 p1'),
          P('l4.order.4', t('Tikrinate, ar produkte neliko salicilo rūgšties.', 'You check whether salicylic acid is left in the product.'),
            ord(SORT, [
              ['Į mėgintuvėlį įdėti truputį produkto', 'Put a little product in a test tube'],
              ['Įpilti 3 ml distiliuoto vandens', 'Add 3 ml of distilled water'],
              ['Maišyti stikline lazdele, nekaitinant', 'Stir with a glass rod, without heating'],
              ['Įlašinti 3 lašus $FeCl3$ tirpalo', 'Add 3 drops of $FeCl3$ solution'],
              ['Stebėti spalvą ir padaryti išvadą', 'Watch the colour and draw the conclusion']
            ], t('Reagentas $FeCl3$ dedamas paskutinis.', 'The reagent $FeCl3$ goes in last.'),
              t('Pirma gaunamas tirpalas, ir tik tada pridedamas $FeCl3$, kad spalva rodytų jau esančią salicilo rūgštį.', 'First a solution is made, and only then is $FeCl3$ added, so that the colour reports the salicylic acid already present.')),
            t('Bandymas veikia tik ištirpus medžiagai; kaitinti negalima, nes aspirinas hidrolizuotųsi.', 'The test works only once the material has dissolved; heating is forbidden because aspirin would hydrolyse.'), 'LW4 p2'),
          P('l4.order.5', t('Skaičiuojate išeigą.', 'You calculate the yield.'),
            ord(SORT, [
              ['Rasti ribojantį reagentą ir jo molių skaičių', 'Find the limiting reagent and its moles'],
              ['Pritaikyti santykį 1 : 1 ir gauti aspirino molius', 'Apply the 1 : 1 ratio to get the moles of aspirin'],
              ['Padauginti iš aspirino molinės masės: teorinė masė', 'Multiply by the molar mass of aspirin: theoretical mass'],
              ['Gautą masę padalyti iš teorinės ir padauginti iš 100', 'Divide the mass obtained by the theoretical and multiply by 100']
            ], t('Išeiga visada lyginama su ribojančiu reagentu.', 'Yield is always compared with the limiting reagent.'),
              t('Nuo molių iki teorinės masės, o tik tada lyginama su gauta mase.', 'From moles to the theoretical mass, and only then compared with the mass obtained.')),
            t('Teorinė masė yra tai, ką duotų visiškas sureagavimas; išeiga rodo, kokią dalį to gavote.', 'The theoretical mass is what complete conversion would give; the yield tells which part of it you got.'), 'LW4 p2'),
          P('l4.order.6', t('Kristalai išdžiūvo ir norite įvertinti jų grynumą.', 'The crystals are dry and you want to judge their purity.'),
            ord(SORT, [
              ['Pasverti išdžiūvusį produktą', 'Weigh the dried product'],
              ['Termometru nustatyti lydymosi temperatūrą', 'Measure the melting point with the thermometer'],
              ['Palyginti ją su apie 135 °C', 'Compare it with about 135 °C'],
              ['Pagal intervalo plotį spręsti apie priemaišas', 'Judge impurities from the width of the range']
            ], t('Pirma gaunamas skaičius, tik paskui jis lyginamas.', 'A number is obtained first and compared afterwards.'),
              t('Išmatuotas intervalas lyginamas su literatūrine verte, o plotis rodo grynumą.', 'The measured range is compared with the literature value, and the width indicates purity.')),
            t('Gryno junginio lydymosi intervalas siauras ir artimas literatūrinei vertei.', 'A pure compound has a narrow melting range close to the literature value.'), 'LW4 p2'),
          P('l4.order.7', t('Reakcija vyksta nuo reagentų iki produkto. Išdėstykite mechanizmo etapus.', 'The reaction goes from the reagents to the product. Order the stages of the mechanism.'),
            ord(SORT, [
              ['Rūgštis protonuoja anhidrido karbonilo deguonį', 'The acid protonates the carbonyl oxygen of the anhydride'],
              ['Fenolio deguonis atakuoja karbonilo anglį', 'The phenolic oxygen attacks the carbonyl carbon'],
              ['Susidaro tetraedrinis tarpinis junginys', 'A tetrahedral intermediate forms'],
              ['Išeina acto rūgštis, atsistato karbonilas', 'Acetic acid leaves and the carbonyl is restored'],
              ['Prarandamas protonas: aspirinas', 'A proton is lost: aspirin']
            ], t('Elektrofilas aktyvinamas prieš nukleofilui atakuojant.', 'The electrophile is activated before the nucleophile attacks.'),
              t('Pirmiausia aktyvuojamas elektrofilas, tada ataka, tarpinis junginys, atskilimas ir deprotonavimas.', 'First the electrophile is activated, then attack, intermediate, elimination and deprotonation.')),
            t('Prijungimo ir atskilimo seka yra nukleofilinio acilpakeitimo požymis.', 'The addition–elimination sequence is the mark of nucleophilic acyl substitution.'), 'LW4 p1'),
          P('l4.order.8', t('Baigiate darbą.', 'You finish the work.'),
            ord(SORT, [
              ['Aprašyti rezultatus ir padaryti išvadas', 'Record the results and conclusions'],
              ['Visą naudotą aparatūrą (be termometro) išplauti šiltu vandeniu', 'Wash all used apparatus (except the thermometer) with warm water'],
              ['Padėti ją ant laboratorijos stalo', 'Put it on the laboratory bench'],
              ['Sudėti priemones į joms skirtas vietas', 'Put the equipment back into its places']
            ], t('Tvarkoma pagal tai, kas jau nebereikalinga.', 'Things are tidied once they are no longer needed.'),
              t('Rezultatai užrašomi, kol medžiaga dar yra, o aparatūra plaunama ir dedama į savo vietą pabaigoje.', 'Results are recorded while the material is still there, and the apparatus is washed and put away at the end.')),
            t('Švari aparatūra ir tvarka yra darbo dalis, o ne papildymas.', 'Clean apparatus and order are part of the work, not an extra.'), 'LW4 p2')
        ]
      },
      // ------------------------------------------------------------------ why each step
      {
        id: 'l4.why',
        title: t('Kodėl taip daroma?', 'Why is this step done?'),
        mirrors: ['LW4.1', 'LW4.2', 'LW4.3', 'LW4.4', 'LW4.8'],
        bank: [
          P('l4.why.1', t('Į mišinį pilami vos 4 lašai koncentruotos $H2SO4$.', 'Only 4 drops of concentrated $H2SO4$ are added to the mixture.'),
            ch(t('Kokia šios rūgšties paskirtis?', 'What does this acid do?'), [
              ['Protonuoja anhidrido karbonilą ir didina jo elektrofiliškumą; ji yra katalizatorius.', 'It protonates the anhydride carbonyl and raises its electrophilicity; it is a catalyst.'],
              ['Sureaguoja su salicilo rūgštimi ir sudaro aspiriną.', 'It reacts with salicylic acid and makes aspirin.'],
              ['Pašalina vandenį, kuris išsiskiria reakcijoje.', 'It removes the water released in the reaction.'],
              ['Neutralizuoja susidariusią acto rūgštį.', 'It neutralises the acetic acid formed.']
            ], t('Kodėl pakanka tokio mažo kiekio?', 'Why is such a small amount enough?'),
              t('Katalizatorius sunaudojamas ir atsistato, todėl užtenka keleto lašų. Reakcijoje vanduo nesusidaro, o acto rūgštis lieka.', 'A catalyst is used up and regenerated, so a few drops are enough. No water is formed in the reaction, and acetic acid remains.')),
            t('Rūgštis keičia kelią, o ne balansą: ji padaro karbonilo anglį labiau teigiamą.', 'The acid changes the path, not the balance: it makes the carbonyl carbon more positive.'), 'LW4 p1'),
          P('l4.why.2', t('Paimta 0,0145 mol rūgšties ir 0,053 mol anhidrido.', '0.0145 mol of the acid and 0.053 mol of the anhydride were taken.'),
            ch(t('Kodėl anhidridas imamas pertekliumi?', 'Why is the anhydride taken in excess?'), [
              ['Kad ribojantis reagentas (salicilo rūgštis) sureaguotų visiškai.', 'So that the limiting reagent (salicylic acid) is consumed completely.'],
              ['Kad produktas gautųsi grynesnis, nes anhidridas jį valo.', 'So that the product comes out purer because the anhydride cleans it.'],
              ['Kad sureaguotų ir karboksilo grupė.', 'So that the carboxyl group reacts as well.'],
              ['Kad reakcijos mišinys nesustingtų.', 'So that the reaction mixture does not solidify.']
            ], t('Kuris reagentas yra ribojantis ir ką darytų jo likutis?', 'Which reagent is limiting and what would its leftover do?'),
              t('Likusi salicilo rūgštis užterštų produktą, o pigus anhidrido perteklius nuplaunamas vandeniu kaip acto rūgštis.', 'Leftover salicylic acid would contaminate the product, while the cheap excess anhydride is removed with water as acetic acid.')),
            t('Pertekliumi imamas lengviau pašalinamas reagentas, kad brangesnis (ar sunkiau pašalinamas) sureaguotų visas.', 'The reagent that is easier to remove is taken in excess so that the other reacts completely.'), 'LW4 p1'),
          P('l4.why.3', t('Reakcijos kolba uždengiama kamšteliu, o acetanhidridas matuojamas traukos spintoje.', 'The reaction flask is covered and the acetic anhydride is measured in the fume hood.'),
            ch(t('Kodėl taip daroma?', 'Why is this done?'), [
              ['Anhidridas aštraus kvapo ir erzina; uždengimas riboja garus (ir drėgmę).', 'The anhydride has a sharp smell and is irritating; covering limits vapours (and moisture).'],
              ['Be kamštelio reakcija nevyksta.', 'Without the cover the reaction does not occur.'],
              ['Kad medžiaga nesušaltų.', 'So that the material does not freeze.'],
              ['Kad dujos, kurios išsiskiria, nesprogtų.', 'So that the released gas does not explode.']
            ], t('Kokia saugumo pastaba yra darbo tekste?', 'What safety remark does the lab text make?'),
              t('Acetanhidridas yra lakus ir aštraus kvapo. Jį reikia matuoti traukos spintoje, o garai neturi patekti ant žmogaus ar į kambarį.', 'Acetic anhydride is volatile and sharp-smelling. It must be measured in the hood and the vapours must not reach people or the room.')),
            t('Saugumas yra dalis darbo plano: mažiname garų kiekį prie šaltinio.', 'Safety is part of the plan: vapours are reduced at the source.'), 'LW4 p1'),
          P('l4.why.4', t('Po 30 min į mišinį lėtai pilama 25 ml vandens.', 'After 30 min 25 ml of water is added slowly.'),
            ch(t('Kodėl vanduo pilamas lėtai?', 'Why is the water added slowly?'), [
              ['Vanduo suskaido acetanhidrido perteklių, o reakcija šiluminė.', 'Water breaks down the excess anhydride, and the reaction gives off heat.'],
              ['Kad aspirinas nesuirtų į dalis.', 'So that aspirin does not break into pieces.'],
              ['Kad mišinys nesušaltų.', 'So that the mixture does not freeze.'],
              ['Kad kristalai taptų didesni nei lede.', 'So that the crystals get bigger than in the ice.']
            ], t('Ką daro vanduo su anhidridu?', 'What does water do to an anhydride?'),
              t('Anhidridas su vandeniu virsta dviem acto rūgšties molekulėmis ir išskiria šilumą. Greitai supylus galėtų ištaškyti.', 'An anhydride with water becomes two molecules of acetic acid and gives off heat. A quick pour could splash.')),
            t('Anhidrido hidrolizė yra egzoterminė, todėl vanduo dedamas atsargiai.', 'Anhydride hydrolysis is exothermic, so water is added carefully.'), 'LW4 p1'),
          P('l4.why.5', t('Perpylus mišinį į vandenį su ledu iškrenta daug kristalų.', 'When the mixture is poured into water with ice many crystals appear.'),
            ch(t('Kodėl aspirinas iškrenta?', 'Why does aspirin separate?'), [
              ['Šaltame vandenyje jis tirpsta mažai, o acto rūgštis ir $H2SO4$ lieka tirpale.', 'It is only slightly soluble in cold water, while acetic acid and $H2SO4$ stay dissolved.'],
              ['Vanduo su ledu sureaguoja su aspirinu ir sudaro nuosėdas.', 'Ice water reacts with aspirin to give a precipitate.'],
              ['Aspirinas yra jonų junginys ir šaltyje sukristalėja.', 'Aspirin is an ionic compound and crystallises in the cold.'],
              ['Ledas ištirpdo salicilo rūgštį.', 'Ice dissolves the salicylic acid.']
            ], t('Palyginkite, kiek vandenyje tirpsta aspirinas ir kiek acto rūgštis.', 'Compare how much aspirin and how much acetic acid dissolve in water.'),
              t('Acto rūgštis maišosi su vandeniu be ribų, o aspirino tirpumas šaltyje mažas, todėl jis kristalizuojasi.', 'Acetic acid mixes with water without limit while aspirin dissolves poorly in the cold, so it crystallises.')),
            t('Skirtingas tirpumas leidžia produktą atskirti nuo šalutinių produktų.', 'The difference in solubility separates the product from the by-products.'), 'LW4 p1'),
          P('l4.why.6', t('Filtre likusius kristalus plaunate keturias porcijas po 15 ml ledinio vandens.', 'You wash the crystals on the filter with four 15 ml portions of ice water.'),
            ch(t('Kodėl vanduo ledinis?', 'Why is the water icy?'), [
              ['Aspirinas šaltame vandenyje tirpsta mažai, todėl mažiau prarandama; šiltame dalis ištirptų ir hidrolizuotųsi.', 'Aspirin dissolves little in cold water, so less is lost; in a warm liquid some would dissolve and hydrolyse.'],
              ['Ledinis vanduo pagreitina acilinimą.', 'Ice water speeds up the acylation.'],
              ['Ledas neutralizuoja $H2SO4$.', 'Ice neutralises the $H2SO4$.'],
              ['Karštas vanduo sumažintų priemaišų kiekį labiau.', 'Hot water would remove more impurities.']
            ], t('Kaip temperatūra veikia kietų medžiagų tirpumą?', 'How does temperature affect the solubility of solids?'),
              t('Kuo aušriau, tuo mažiau aspirino ištirpsta, o acto rūgštis vis tiek nuplaunama.', 'The colder it is, the less aspirin dissolves, and acetic acid is still washed away.')),
            t('Plaunama tuo, kas nuplauna priemaišas, bet nelabai ištirpdo produkto.', 'Washing uses something that removes impurities but hardly dissolves the product.'), 'LW4 p1'),
          P('l4.why.7', t('Kristalai atskiriami Biuchnerio piltuvu, prijungtu prie Bunzeno kolbos.', 'The crystals are separated on a Büchner funnel connected to a Bunsen flask.'),
            ch(t('Kodėl naudojamas vakuuminis filtravimas?', 'Why is vacuum filtration used?'), [
              ['Skystis per filtrą išsiurbiamas greitai, o kristalai lieka sausesni.', 'The liquid is drawn through quickly and the crystals are left drier.'],
              ['Vakuumas išgarina acto rūgštį iš kristalų vidaus.', 'The vacuum evaporates acetic acid from inside the crystals.'],
              ['Vakuumas pagreitina acilinimo reakciją.', 'The vacuum speeds up the acylation.'],
              ['Vakuume kristalai lydosi ir išvalomi.', 'Under vacuum the crystals melt and get cleaned.']
            ], t('Kas veikia skystį skersai filtro popieriaus?', 'What pushes liquid through the filter paper?'),
              t('Sumažinus slėgį po filtru, atmosferos slėgis varo skystį per kristalus, kurie lieka ant popieriaus.', 'With reduced pressure under the filter, atmospheric pressure drives the liquid through, while the crystals stay on the paper.')),
            t('Greitas atskyrimas sumažina laiką, per kurį aspirinas kontaktuoja su drėgme.', 'Fast separation shortens the time aspirin is in contact with moisture.'), 'LW4 p1'),
          P('l4.why.8', t('Filtre kristalai nuspaudžiami stikliniu kamščiu.', 'The crystals on the filter are pressed with the glass stopper.'),
            ch(t('Kam tai daroma?', 'What is it for?'), [
              ['Išspaudžiamas motininis tirpalas su acto rūgštimi, taigi lengviau džiūsta.', 'The mother liquor with acetic acid is squeezed out, so the crystals dry more easily.'],
              ['Kristalai suspaudžiami į vieną gabalą kaip tabletė.', 'The crystals are compacted into one piece like a tablet.'],
              ['Kristalai sureaguoja su stiklu.', 'The crystals react with glass.'],
              ['Taip pašalinami kristalai su priemaišomis.', 'It removes crystals that carry impurities.']
            ], t('Kas lieka tarp kristalų po plovimo?', 'What is left between the crystals after washing?'),
              t('Tarp kristalų lieka skystis su ištirpusiomis rūgštimis. Jį išspaudus, džiovinimas trunka trumpiau ir produktas švaresnis.', 'Liquid with dissolved acids is left between the crystals. Squeezing it out shortens drying and makes the product cleaner.')),
            t('Kuo mažiau skysčio lieka, tuo mažesnė acto rūgšties priemaiša.', 'The less liquid left, the smaller the acetic acid impurity.'), 'LW4 p1')
        ]
      },
      // ------------------------------------------------------------------ observe
      {
        id: 'l4.observe',
        title: t('Ką pamatysite?', 'What would you observe?'),
        mirrors: ['LW4.1', 'LW4.2', 'LW4.3', 'LW4.4', 'LW4.5', 'LW4.6'],
        bank: [
          P('l4.observe.1', t('Sintezės kolboje salicilo rūgštis ir acetanhidridas po $H2SO4$ lašų maišomi 30 min.', 'In the synthesis flask salicylic acid and acetic anhydride are stirred for 30 min after the $H2SO4$ drops.'),
            ch(t('Ką matote?', 'What do you see?'), [
              ['Balta kieta salicilo rūgštis pamažu ištirpsta, o po to iškrenta produkto nuosėdos.', 'The white solid salicylic acid slowly dissolves, and later a precipitate of the product appears.'],
              ['Mišinys iškart tampa violetinis.', 'The mixture turns violet at once.'],
              ['Išsiskiria daug dujų ir mišinys užverda.', 'Lots of gas is given off and the mixture boils.'],
              ['Nieko nekinta, kol nepakaitinsite.', 'Nothing changes until you heat it.']
            ], t('Pradinė medžiaga ir produktas turi skirtingą tirpumą.', 'The starting material and the product differ in solubility.'),
              t('Salicilo rūgštis pamažu reaguoja anhidride, o susidaręs aspirinas mažiau tirpus ir iškrenta. Sintezė vyksta be kaitinimo.', 'Salicylic acid reacts slowly in the anhydride and the aspirin formed is less soluble and separates. The synthesis needs no heating.')),
            t('Kietos medžiagos virsmas kita kieta medžiaga rodo tirpumo skirtumą.', 'A solid turning into another solid shows the solubility difference.'), 'LW4 p1'),
          P('l4.observe.2', t('Į reakcijos mišinį lėtai pilate vandenį.', 'You slowly add water to the reaction mixture.'),
            ch(t('Ką pastebėsite?', 'What will you notice?'), [
              ['Kolba sušyla ir pasirodo acto kvapas; mišinys drumzlinasi, nes kristalizuojasi aspirinas.', 'The flask warms up and a vinegar smell appears; the mixture turns cloudy as aspirin crystallises.'],
              ['Mišinys sušąla ir visiškai skaidrėja.', 'The mixture cools and becomes fully clear.'],
              ['Pasirodo žalia spalva.', 'A green colour appears.'],
              ['Išsiskiria rudos nuosėdos.', 'Brown precipitate separates.']
            ], t('Ką vanduo daro acto anhidridui?', 'What does water do to acetic anhydride?'),
              t('Vanduo anhidridą hidrolizuoja į acto rūgštį ir išskiria šilumą. Acto rūgštis kvepia kaip actas.', 'Water hydrolyses the anhydride to acetic acid and releases heat. Acetic acid smells like vinegar.')),
            t('Šilumos ir kvapo pokyčiai rodo anhidrido hidrolizę.', 'Heat and smell changes show anhydride hydrolysis.'), 'LW4 p1'),
          P('l4.observe.3', t('Gryno aspirino mažas kiekis ištirpintas vandenyje ir įlašinta $FeCl3$ tirpalo.', 'A small amount of pure aspirin is dissolved in water and $FeCl3$ solution is added.'),
            ch(t('Kokia spalva?', 'What colour?'), [
              ['Violetinės spalvos nėra: lieka šviesiai geltona $FeCl3$ spalva.', 'No violet colour: only the pale yellow of $FeCl3$ remains.'],
              ['Intensyvi violetinė spalva.', 'An intense violet colour.'],
              ['Mėlynos nuosėdos.', 'Blue precipitate.'],
              ['Žalia spalva.', 'A green colour.']
            ], t('Ar aspirino molekulėje yra fenolio $OH$?', 'Does the aspirin molecule contain a phenolic $OH$?'),
              t('Fenolio $OH$ yra aciliuota, todėl su $Fe3+$ kompleksas nesusidaro.', 'The phenolic $OH$ is acylated, so no complex forms with $Fe3+$.')),
            t('Spalva priklauso nuo laisvos fenolinės grupės, o ne nuo karboksilo grupės.', 'The colour depends on a free phenolic group, not on the carboxyl group.'), 'LW4 p2'),
          P('l4.observe.4', t('Produkte liko dalis nesureagavusios salicilo rūgšties.', 'Some unreacted salicylic acid is left in the product.'),
            ch(t('Ką rodo $FeCl3$ bandymas?', 'What does the $FeCl3$ test show?'), [
              ['Pasirodo violetinė spalva.', 'A violet colour appears.'],
              ['Pasirodo raudonos nuosėdos.', 'A red precipitate appears.'],
              ['Spalva nepasikeičia, bet kvapas stipresnis.', 'No colour change, but a stronger smell.'],
              ['Tirpalas tampa bespalvis.', 'The solution turns colourless.']
            ], t('Kuri molekulės dalis duoda spalvotą kompleksą su $Fe3+$?', 'Which part of the molecule forms the coloured complex with $Fe3+$?'),
              t('Salicilo rūgštis turi laisvą fenolio $OH$ ir karboksilo grupę greta, todėl su $Fe3+$ sudaro violetinį chelatą.', 'Salicylic acid has a free phenolic $OH$ with a carboxyl group beside it, so it forms a violet chelate with $Fe3+$.')),
            t('Spalvą duoda pradinė medžiaga, ne produktas.', 'The starting material gives the colour, not the product.'), 'LW4 p2'),
          P('l4.observe.5', t('Gryną salicilo rūgštį ištirpinate vandenyje ir pilate $FeCl3$.', 'You dissolve pure salicylic acid in water and add $FeCl3$.'),
            ch(t('Ką matote?', 'What do you see?'), [
              ['Aiškią violetinę spalvą; tai yra kontrolė, rodanti, kaip atrodo teigiamas rezultatas.', 'A clear violet colour; this is the control showing what a positive result looks like.'],
              ['Skaidrų tirpalą be spalvos.', 'A clear, colourless solution.'],
              ['Baltus dūmus.', 'White fumes.'],
              ['Rudą nuosėdų sluoksnį.', 'A brown precipitate layer.']
            ], t('Kaip suprasti, kaip atrodo teigiamas bandymas?', 'How do you know what a positive test looks like?'),
              t('Pradinės medžiagos tirpalas visada duoda violetinę spalvą, todėl jį naudojame kaip palyginimą.', 'A solution of the starting material always gives violet, so it serves as a comparison.')),
            t('Kontrolė parodo, ar reagentas veikia ir kaip atrodo teigiamas atsakymas.', 'A control shows whether the reagent works and how a positive answer looks.'), 'LW4 p2'),
          P('l4.observe.6', t('Aspirino tirpalą kaitinote vandenyje, tada įlašinote $FeCl3$.', 'You heated the aspirin solution in water and then added $FeCl3$.'),
            ch(t('Ką pamatysite?', 'What will you see?'), [
              ['Pasirodys violetinė spalva, nes aspirinas dalinai hidrolizavosi į salicilo rūgštį.', 'A violet colour appears because aspirin partly hydrolysed to salicylic acid.'],
              ['Spalvos nebus, nes kaitinant aspirinas stabilėja.', 'There will be no colour because heating stabilises aspirin.'],
              ['Tirpalas taps raudonas dėl karboksilo grupės.', 'The solution turns red because of the carboxyl group.'],
              ['Iškris juodos nuosėdos.', 'Black precipitate forms.']
            ], t('Ką daro karštas vanduo esteriui?', 'What does hot water do to an ester?'),
              t('Esteris šiltame vandenyje hidrolizuojasi atgal į fenolį ir acto rūgštį. Spalva atsiranda dėl kaitinimo, ne dėl priemaišos.', 'In hot water the ester hydrolyses back to the phenol and acetic acid. The colour comes from the heating, not from an impurity.')),
            t('Klaidingai teigiamas rezultatas atsiranda dėl bandymo sąlygų.', 'A false positive arises from the conditions of the test.'), 'LW4 p2'),
          P('l4.observe.7', t('Filtruojate kristalus Biuchnerio piltuvu ir plaunate ledo vandeniu.', 'You filter the crystals on the Büchner funnel and wash with ice water.'),
            ch(t('Kuo kvepia filtratas ir kodėl?', 'What does the filtrate smell of, and why?'), [
              ['Actu: filtrate yra acto rūgštis, susidariusi reakcijoje ir iš anhidrido.', 'Vinegar: the filtrate contains acetic acid formed in the reaction and from the anhydride.'],
              ['Aspirinu: jis lakus.', 'Of aspirin: it is volatile.'],
              ['Nieko, nes viskas liko kristaluose.', 'Of nothing, because it all stayed in the crystals.'],
              ['Sieros rūgštimi: ji turi stiprų kvapą.', 'Of sulfuric acid: it has a strong smell.']
            ], t('Kas nuplaunama kartu su skysčiu?', 'What is washed away with the liquid?'),
              t('Acto rūgštis visiškai maišosi su vandeniu ir nuplaunama su filtratu. Aspirinas yra kietas ir kvapo beveik neturi.', 'Acetic acid mixes fully with water and goes with the filtrate. Aspirin is a solid and has hardly any smell.')),
            t('Kvapas nurodo, kokia lakioji medžiaga pašalinta.', 'The smell tells which volatile substance has been removed.'), 'LW4 p1'),
          P('l4.observe.8', t('Aspirinas lydosi 126–131 °C ribose, o literatūrinė vertė yra apie 135 °C.', 'Aspirin melts within 126–131 °C and the literature value is about 135 °C.'),
            ch(t('Ką matote ir ką tai rodo?', 'What do you see and what does it show?'), [
              ['Intervalas platus ir žemesnis už literatūrinį: produktas nešvarus.', 'The range is broad and below the literature value: the product is impure.'],
              ['Intervalas siauras: produktas grynas.', 'The range is narrow: the product is pure.'],
              ['Aukštesnė temperatūra rodo grynesnį produktą.', 'A higher temperature shows a purer product.'],
              ['Intervalas nieko nerodo.', 'The range shows nothing.']
            ], t('Kaip priemaišos keičia lydymosi tašką ir jo plotį?', 'How do impurities change the melting point and its width?'),
              t('Priemaišos žemina ir plečia intervalą. Gryno aspirino lydymosi intervalas siauras, apie 135 °C.', 'Impurities lower and broaden the range. Pure aspirin melts in a narrow range around 135 °C.')),
            t('Lydymosi intervalas yra pigiausias grynumo rodiklis.', 'The melting range is the cheapest purity indicator.'), 'LW4 p2')
        ]
      },
      // ------------------------------------------------------------------ proves
      {
        id: 'l4.proves',
        title: t('Koks stebėjimas ką įrodo?', 'Which observation proves what?'),
        mirrors: ['LW4.4', 'LW4.5', 'LW4.6', 'LW4.7'],
        bank: [
          P('l4.proves.1', t('Su $FeCl3$ produkto tirpalas tampa intensyviai violetinis.', 'The product solution turns intensely violet with $FeCl3$.'),
            ch(t('Ką tai įrodo?', 'What does this prove?'), [
              ['Yra laisvų fenolio $OH$ grupių, tai yra liko nesureagavusios salicilo rūgšties.', 'Free phenolic $OH$ groups are present, that is unreacted salicylic acid is left.'],
              ['Produktas yra grynas aspirinas.', 'The product is pure aspirin.'],
              ['Susidarė acetilsalicilo rūgšties kompleksas.', 'A complex of acetylsalicylic acid has formed.'],
              ['Yra karboksilo grupių.', 'Carboxyl groups are present.']
            ], t('Kuri funkcinė grupė reaguoja su $Fe3+$?', 'Which functional group reacts with $Fe3+$?'),
              t('Aspirine ir salicilo rūgštyje yra karboksilo grupė, bet laisvo fenolio turi tik salicilo rūgštis.', 'Both aspirin and salicylic acid have a carboxyl group, but only salicylic acid has a free phenol.')),
            t('Bandymas atskiria produktą nuo pradinės medžiagos pagal fenolio grupę.', 'The test tells the product from the starting material by the phenolic group.'), 'LW4 p2'),
          P('l4.proves.2', t('Su $FeCl3$ spalvos nėra.', 'There is no colour with $FeCl3$.'),
            ch(t('Ką galima teigti?', 'What can be claimed?'), [
              ['Laisvo fenolio neaptikta, bet tai dar neįrodo, kad produktas absoliučiai grynas.', 'No free phenol was found, but this does not yet prove that the product is perfectly pure.'],
              ['Produktas absoliučiai grynas.', 'The product is perfectly pure.'],
              ['Reakcija nevyko.', 'The reaction did not occur.'],
              ['Produktas yra salicilo rūgštis.', 'The product is salicylic acid.']
            ], t('Kokias priemaišas bandymas gali aptikti?', 'Which impurities can the test detect?'),
              t('Bandymas jautrus tik fenolinei grupei. Acto rūgštis ar kitos priemaišos jo neveikia, todėl papildomai matuojama lydymosi temperatūra.', 'The test is sensitive only to a phenolic group. Acetic acid or other impurities do not affect it, so the melting point is measured as well.')),
            t('Neigiamas rezultatas riboja tik tai, ką bandymas gali rodyti.', 'A negative result is limited to what the test can show.'), 'LW4 p2'),
          P('l4.proves.3', t('Produkto tirpalas su $FeCl3$ duoda tik blyškiai rausvą atspalvį.', 'The product solution with $FeCl3$ shows only a faint pink-violet tint.'),
            ch(t('Ką daryti?', 'What do you do?'), [
              ['Liko nedidelis salicilo rūgšties kiekis; produktą verta perkristalinti.', 'A small amount of salicylic acid is left; the product is worth recrystallising.'],
              ['Nieko, nes jokio fenolio nėra.', 'Nothing, since there is no phenol.'],
              ['Pakartoti sintezę su dvigubu $H2SO4$ kiekiu.', 'Repeat the synthesis with twice the $H2SO4$.'],
              ['Kaitinti tirpalą, kol spalva išnyks.', 'Heat the solution until the colour disappears.']
            ], t('Silpna spalva nėra „nulis“.', 'A weak colour is not "zero".'),
              t('Net silpnas atspalvis reiškia, kad priemaiša yra. Perkristalinimas išvalo, o kaitinimas tik sukeltų hidrolizę.', 'Even a faint tint means that the impurity is there. Recrystallisation cleans it, while heating would only cause hydrolysis.')),
            t('Bandymas jautrus, todėl silpna spalva vis tiek yra požymis.', 'The test is sensitive, so a faint colour is still a sign.'), 'LW4 p2'),
          P('l4.proves.4', t('Aspirino lydymosi intervalas: 134–136 °C; $FeCl3$ spalvos nėra.', 'Aspirin melting range 134–136 °C; no colour with $FeCl3$.'),
            ch(t('Ką rodo abu rezultatai kartu?', 'What do the two results show together?'), [
              ['Du nepriklausomi metodai rodo, kad produktas grynas.', 'Two independent methods show that the product is pure.'],
              ['Produktas neišvalytas, nes rezultatai sutampa.', 'The product is not clean because the results agree.'],
              ['Reakcija nepasibaigė.', 'The reaction was not completed.'],
              ['Bandymai prieštarauja vienas kitam.', 'The tests contradict each other.']
            ], t('Ar abu metodai tikrina tą patį?', 'Do the two methods test the same thing?'),
              t('$FeCl3$ rodo, ar nėra fenolio, o lydymosi intervalas – ar bendras grynumas. Sutapimas stiprina išvadą.', '$FeCl3$ shows whether phenol is absent, and the melting range shows overall purity. Their agreement strengthens the conclusion.')),
            t('Du skirtingi įrodymai patikimesni už vieną.', 'Two different pieces of evidence are more reliable than one.'), 'LW4 p2'),
          P('l4.proves.5', t('Gauta daugiau aspirino, nei apskaičiuota pagal teorinę masę (išeiga virš 100 %).', 'More aspirin was obtained than the theoretical mass (a yield above 100 %).'),
            ch(t('Ką tai rodo?', 'What does that show?'), [
              ['Produktas drėgnas arba užterštas (pvz., acto rūgštimi ar salicilo rūgštimi).', 'The product is moist or contaminated (for example with acetic or salicylic acid).'],
              ['Sintezė buvo labai sėkminga.', 'The synthesis was very successful.'],
              ['Susidarė daugiau molių nei reagavo.', 'More moles formed than reacted.'],
              ['Salicilo rūgštis yra pertekliuje.', 'Salicylic acid is in excess.']
            ], t('Ar masė gali viršyti stechiometrinę ribą?', 'Can the mass exceed the stoichiometric limit?'),
              t('Pagal stechiometriją daugiau nei teorinės masės susidaryti negali, todėl perteklius yra vanduo ar priemaišos.', 'By stoichiometry more than the theoretical mass cannot form, so the excess is water or impurities.')),
            t('Išeiga virš 100 % visada signalizuoja klaidą, ne sėkmę.', 'A yield above 100 % always signals an error, not success.'), 'LW4 p2'),
          P('l4.proves.6', t('Gryno aspirino tirpalas su $FeCl3$ buvo bespalvis, bet pakaitinus tirpalą atsirado violetinė spalva.', 'A pure aspirin solution with $FeCl3$ was colourless, but a violet colour appeared after the solution was heated.'),
            ch(t('Kaip tai aiškinama?', 'How is this explained?'), [
              ['Kaitinant aspirinas hidrolizavosi į salicilo rūgštį, todėl spalva neįrodo priemaišos pradiniame produkte.', 'On heating aspirin hydrolysed to salicylic acid, so the colour does not prove an impurity in the original product.'],
              ['Produktas buvo nešvarus nuo pradžių.', 'The product was impure from the start.'],
              ['$FeCl3$ reaguoja su karboksilo grupe tik karštyje.', '$FeCl3$ reacts with the carboxyl group only when hot.'],
              ['Aspirinas pavirto į kitą junginį su viena $OH$ grupe daugiau.', 'Aspirin turned into another compound with an extra $OH$ group.']
            ], t('Kuri sąlyga pasikeitė tarp dviejų bandymų?', 'Which condition changed between the two tests?'),
              t('Karštas vanduo skaldo esterio ryšį. Todėl bandymui reikia šalto vandens.', 'Hot water splits the ester bond. That is why the test needs cold water.')),
            t('Prieš darant išvadą, patikrinkite, ar bandymo sąlygos pačios nekeičia mėginio.', 'Before concluding, check that the test conditions do not change the sample themselves.'), 'LW4 p2'),
          P('l4.proves.7', t('Produktas lydosi nuo 118 iki 130 °C.', 'The product melts from 118 to 130 °C.'),
            ch(t('Kokia išvada?', 'What is the conclusion?'), [
              ['Per platus intervalas ir per žema pradžia: yra priemaišų, reikia perkristalinti.', 'The range is too broad and starts too low: impurities are present and recrystallisation is needed.'],
              ['Produktas yra grynas, nes lydosi apie 135 °C.', 'The product is pure, since it melts near 135 °C.'],
              ['Matuota neteisingai: reikia padidinti $FeCl3$ kiekį.', 'The measurement is wrong: increase the $FeCl3$ amount.'],
              ['Priemaišos kėlė lydymosi temperatūrą.', 'The impurities raised the melting point.']
            ], t('Ką daro priemaišos kristalinei gardelei?', 'What do impurities do to the crystal lattice?'),
              t('Priemaišos trukdo gardelei, todėl lydymasis prasideda žemesnėje temperatūroje ir tęsiasi ilgiau.', 'Impurities disturb the lattice, so melting starts at a lower temperature and lasts longer.')),
            t('Grynas junginys lydosi staigiai, nešvarus – lėtai ir žemiau.', 'A pure compound melts sharply, an impure one slowly and lower.'), 'LW4 p2'),
          P('l4.proves.8', t('Plonasluoksnės chromatografijos plokštelėje produkto dėmė nueina tiek pat, kiek salicilo rūgšties kontrolės dėmė.', 'On a TLC plate the product spot runs as far as the salicylic acid reference spot.'),
            ch(t('Ką tai reiškia?', 'What does this mean?'), [
              ['Produkte gali būti salicilo rūgšties (reikia tolesnio tikrinimo).', 'The product may contain salicylic acid (further checking is needed).'],
              ['Produktas tikrai grynas aspirinas.', 'The product is definitely pure aspirin.'],
              ['Dėmė reiškia acto rūgštį.', 'The spot means acetic acid.'],
              ['Plokštelė sugadinta.', 'The plate is spoiled.']
            ], t('Kas lemia dėmės kelią plokštelėje?', 'What decides how far a spot travels?'),
              t('Vienodas $R_f$ rodo panašų junginį, bet vien dėmės nepakanka: patvirtina $FeCl3$ bandymas.', 'The same $R_f$ suggests the same compound, but one spot is not enough: the $FeCl3$ test confirms.')),
            t('Chromatografija yra papildomas, o ne darbo tekste aprašytas patikrinimas.', 'Chromatography is an additional check, not one described in the lab text.'))
        ]
      },
      // ------------------------------------------------------------------ calculations
      {
        id: 'l4.calc',
        title: t('Skaičiavimai: išeiga, Rf, lydymosi temperatūra', 'Calculations: yield, Rf, melting point'),
        mirrors: ['LW4.1', 'LW4.6', 'LW4.7'],
        gen(rng, ctx) {
          const fmt = (x, d) => x.toFixed(d);
          const lt = (x, d) => fmt(x, d).replace('.', ',');
          const variant = ctx.pick(['yield', 'excess', 'target', 'rf', 'mp']);
          const MS = 138.12, MA = 180.16, MH = 102.09;

          if (variant === 'yield') {
            const m = ctx.int(10, 50) / 10;                  // g salicylic acid
            const theo = m / MS * MA;
            const obt = Math.round(theo * ctx.int(40, 92)) / 100;
            const y = obt / theo * 100;
            return {
              q: [{ p: t('Aspirino sintezei salicilo rūgšties masė: ' + lt(m, 1) + ' g ($M$ = 138,12 g/mol), acetanhidridas pertekliuje. Išdžiovinus gauta ' + lt(obt, 2) + ' g aspirino ($M$ = 180,16 g/mol).',
                'For the aspirin synthesis ' + fmt(m, 1) + ' g of salicylic acid ($M$ = 138.12 g/mol) was taken, with acetic anhydride in excess. After drying ' + fmt(obt, 2) + ' g of aspirin ($M$ = 180.16 g/mol) was obtained.') }],
              steps: [
                { prompt: t('Kokia teorinė aspirino masė (g)?', 'What is the theoretical mass of aspirin (g)?'), kind: 'number', answer: { value: theo, tol: 0.03 },
                  hint: t('Ribojantis reagentas yra salicilo rūgštis, santykis 1 : 1.', 'The limiting reagent is salicylic acid, the ratio is 1 : 1.'),
                  solution: t('$n = ' + lt(m, 1) + ' / 138,12$; teorinė masė $= n · 180,16 = ' + lt(theo, 2) + '$ g.', '$n = ' + fmt(m, 1) + ' / 138.12$; theoretical mass $= n · 180.16 = ' + fmt(theo, 2) + '$ g.') },
                { prompt: t('Kokia išeiga (%)?', 'What is the yield (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Išeiga yra gauta masė, padalyta iš teorinės.', 'Yield is the mass obtained divided by the theoretical mass.'),
                  solution: t('$' + lt(obt, 2) + ' / ' + lt(theo, 2) + ' · 100 = ' + lt(y, 1) + '$ %.', '$' + fmt(obt, 2) + ' / ' + fmt(theo, 2) + ' · 100 = ' + fmt(y, 1) + '$ %.') }
              ],
              why: t('Išeiga lygina tikrąją masę su ta, kurią duotų visiškas sureagavimas pagal 1 : 1 santykį, skaičiuojant iš ribojančio reagento.', 'Yield compares the real mass with that which complete conversion would give by the 1 : 1 ratio, calculated from the limiting reagent.'),
              src: 'LW4 p2'
            };
          }

          if (variant === 'excess') {
            const m = ctx.int(10, 40) / 10;                  // g salicylic acid
            const v = ctx.int(30, 80) / 10;                  // ml anhydride (d = 1.08)
            const ns = m / MS, nh = v * 1.08 / MH;
            const ratio = nh / ns;
            return {
              q: [{ p: t('Salicilo rūgšties masė ' + lt(m, 1) + ' g ($M$ = 138,12 g/mol), be to ' + lt(v, 1) + ' ml acetanhidrido ($ρ$ = 1,08 g/ml, $M$ = 102,09 g/mol).',
                'Used: ' + fmt(m, 1) + ' g of salicylic acid ($M$ = 138.12 g/mol) and ' + fmt(v, 1) + ' ml of acetic anhydride ($ρ$ = 1.08 g/ml, $M$ = 102.09 g/mol).') }],
              steps: [
                { prompt: t('Kiek anhidrido molių tenka vienam salicilo rūgšties moliui?', 'How many moles of anhydride are there per mole of salicylic acid?'), kind: 'number', answer: { value: ratio, tol: 0.1 },
                  hint: t('Pirmiausia pervesk abu kiekius į molius.', 'First convert both amounts to moles.'),
                  solution: t('$n$(rūgšties) $= ' + lt(ns * 1000, 1) + '$ mmol; $n$(anhidrido) $= ' + lt(v * 1.08 / MH * 1000, 1) + '$ mmol; santykis $= ' + lt(ratio, 1) + '$.',
                    '$n$(acid) $= ' + fmt(ns * 1000, 1) + '$ mmol; $n$(anhydride) $= ' + fmt(v * 1.08 / MH * 1000, 1) + '$ mmol; ratio $= ' + fmt(ratio, 1) + '$.') },
                ch(t('Kuris reagentas ribojantis?', 'Which reagent is limiting?'), [
                  ['salicilo rūgštis', 'salicylic acid'], ['acetanhidridas', 'acetic anhydride'], ['jie lygūs', 'they are equal'], ['sieros rūgštis', 'sulfuric acid']
                ], t('Reakcija vyksta 1 : 1.', 'The reaction goes 1 : 1.'),
                  t('Santykis yra didesnis už 1, todėl pertekliuje yra anhidridas, o ribojanti yra salicilo rūgštis.', 'The ratio is above 1, so the anhydride is in excess and salicylic acid is limiting.'))
              ],
              why: t('Reakcijos stechiometrija 1 : 1, todėl mažiau molių turintis reagentas riboja. Anhidridas imamas pertekliumi, kad salicilo rūgštis sureaguotų visa.', 'The stoichiometry is 1 : 1, so the reagent with fewer moles is limiting. The anhydride is in excess so that all the salicylic acid reacts.'),
              src: 'LW4 p1'
            };
          }

          if (variant === 'target') {
            const target = ctx.int(10, 40) / 10;             // g aspirin wanted
            const pct = ctx.pick([60, 65, 70, 75, 80, 85]);
            const need = target / (pct / 100) / MA * MS;
            return {
              q: [{ p: t('Norima gauti ' + lt(target, 1) + ' g aspirino ($M$ = 180,16 g/mol), o patirtis rodo, kad išeiga būna apie ' + pct + ' %. Salicilo rūgšties molinė masė 138,12 g/mol.',
                'You want ' + fmt(target, 1) + ' g of aspirin ($M$ = 180.16 g/mol), and experience shows a yield of about ' + pct + ' %. The molar mass of salicylic acid is 138.12 g/mol.') }],
              steps: [
                { prompt: t('Kiek salicilo rūgšties (g) reikia paimti?', 'How many grams of salicylic acid should be taken?'), kind: 'number', answer: { value: need, tol: 0.04 },
                  hint: t('Pirma nustatykite teorinę masę, kad po išeigos gautųsi norima masė.', 'First find the theoretical mass that gives the wanted mass after the yield.'),
                  solution: t('Teorinė masė $= ' + lt(target, 1) + ' / ' + (pct / 100).toString().replace('.', ',') + '$ g; $n = $ teorinė masė $/ 180,16$; $m = n · 138,12 = ' + lt(need, 2) + '$ g.',
                    'Theoretical mass $= ' + fmt(target, 1) + ' / ' + (pct / 100) + '$ g; $n = $ theoretical mass $/ 180.16$; $m = n · 138.12 = ' + fmt(need, 2) + '$ g.') }
              ],
              why: t('Skaičiavimas vyksta atvirkščiai: pagal išeigą apskaičiuojama teorinė masė, o iš jos pagal 1 : 1 santykį – pradinės medžiagos masė.', 'The calculation runs in reverse: the yield gives the theoretical mass, and the 1 : 1 ratio gives the mass of the starting material.'),
              src: 'LW4 p2'
            };
          }

          if (variant === 'rf') {
            const front = ctx.int(60, 90);
            const a = ctx.int(18, 40);
            const sameSpot = ctx.int(0, 1) === 0;
            const b = sameSpot ? a + ctx.int(0, 1) : a + ctx.int(14, 26);
            return {
              q: [{ p: t('Plonasluoksnėje plokštelėje tirpiklio frontas nuėjo ' + front + ' mm. Produkto dėmė nuėjo ' + b + ' mm, salicilo rūgšties kontrolės dėmė ' + a + ' mm nuo starto linijos.',
                'On a thin-layer plate the solvent front moved ' + front + ' mm. The product spot moved ' + b + ' mm and the salicylic acid reference spot ' + a + ' mm from the start line.') }],
              steps: [
                { prompt: t('Koks produkto dėmės $R_f$?', 'What is the $R_f$ of the product spot?'), kind: 'number', answer: { value: b / front, tol: 0.01 },
                  hint: t('$R_f$ yra dėmės kelias, padalytas iš tirpiklio fronto kelio.', '$R_f$ is the distance of the spot divided by the distance of the solvent front.'),
                  solution: t('$R_f = ' + b + ' / ' + front + ' = ' + lt(b / front, 2) + '$.', '$R_f = ' + b + ' / ' + front + ' = ' + fmt(b / front, 2) + '$.') },
                { prompt: t('Koks kontrolės dėmės $R_f$?', 'What is the $R_f$ of the reference spot?'), kind: 'number', answer: { value: a / front, tol: 0.01 },
                  hint: t('Tas pats skaičiavimas su kita dėme.', 'The same calculation with the other spot.'),
                  solution: t('$R_f = ' + a + ' / ' + front + ' = ' + lt(a / front, 2) + '$.', '$R_f = ' + a + ' / ' + front + ' = ' + fmt(a / front, 2) + '$.') },
                ch(t('Ką rodo palyginimas?', 'What does the comparison show?'), sameSpot ? [
                  ['Dėmės sutampa: produkte gali būti salicilo rūgšties.', 'The spots coincide: the product may contain salicylic acid.'],
                  ['Produktas grynas, nes dėmė viena.', 'The product is pure because there is one spot.'],
                  ['Dėmės sutampa, vadinasi, medžiagos skirtingos.', 'The spots coincide, so the substances are different.'],
                  ['Palyginti galima tik pagal spalvą.', 'It can only be compared by colour.']
                ] : [
                  ['Dėmių $R_f$ skiriasi: produktas nėra salicilo rūgštis.', 'The $R_f$ values differ: the product is not salicylic acid.'],
                  ['Dėmės sutampa: produktas yra salicilo rūgštis.', 'The spots coincide: the product is salicylic acid.'],
                  ['$R_f$ visada lygus 1.', '$R_f$ is always equal to 1.'],
                  ['Skirtingas $R_f$ rodo klaidą plokštelėje.', 'A different $R_f$ shows an error in the plate.']
                ], t('Vienodi junginiai tomis pačiomis sąlygomis nueina tą patį atstumą.', 'Identical compounds travel the same distance under the same conditions.'),
                  sameSpot ? t('Vienodas $R_f$ rodo, kad produkte yra medžiagos, judančios kaip salicilo rūgštis.', 'The same $R_f$ shows that the product holds a substance that moves like salicylic acid.')
                    : t('Skirtingas $R_f$ rodo, kad tai skirtingos medžiagos.', 'A different $R_f$ shows that these are different substances.'))
              ],
              why: t('$R_f$ yra santykis, nepriklausantis nuo plokštelės dydžio. Palyginti galima tik toje pačioje plokštelėje ir tomis pačiomis sąlygomis.', '$R_f$ is a ratio independent of plate size. Spots can be compared only on the same plate under the same conditions.')
            };
          }

          // melting point
          const pure = ctx.int(0, 1) === 0;
          const lo = pure ? 134 + ctx.int(0, 1) : 135 - ctx.int(6, 15);
          const hi = lo + (pure ? ctx.int(1, 2) : ctx.int(4, 9));
          return {
            q: [{ p: t('Perkristalintas aspirinas lydosi ' + lo + '–' + hi + ' °C temperatūroje; literatūrinė lydymosi temperatūra apie 135 °C.',
              'Recrystallised aspirin melts at ' + lo + '–' + hi + ' °C; the literature melting point is about 135 °C.') }],
            steps: [
              { prompt: t('Koks lydymosi intervalo plotis (°C)?', 'What is the width of the melting range (°C)?'), kind: 'number', answer: { value: hi - lo, tol: 0 },
                hint: t('Plotis yra aukščiausia minus žemiausia temperatūra.', 'The width is the highest minus the lowest temperature.'),
                solution: t('$' + hi + ' − ' + lo + ' = ' + (hi - lo) + '$ °C.', '$' + hi + ' − ' + lo + ' = ' + (hi - lo) + '$ °C.') },
              ch(t('Ką rodo rezultatas?', 'What does the result show?'), pure ? [
                ['Grynas: siauras intervalas arti literatūrinės vertės.', 'Pure: a narrow range close to the literature value.'],
                ['Nešvarus: platus intervalas ir žema temperatūra.', 'Impure: a broad range and low temperature.'],
                ['Grynas: žemesnė temperatūra rodo didesnį grynumą.', 'Pure: a lower temperature shows higher purity.'],
                ['Nešvarus: kiekvienas lydymasis rodo priemaišas.', 'Impure: every melting shows impurities.']
              ] : [
                ['Nešvarus: platus intervalas ir žemesnė temperatūra.', 'Impure: a broad range and a lowered temperature.'],
                ['Grynas: lydymasis vyksta greitai.', 'Pure: melting is fast.'],
                ['Grynas: aukštesnė temperatūra nei 135 °C.', 'Pure: the temperature is above 135 °C.'],
                ['Priemaišos temperatūrą kelia, todėl intervalas platus.', 'Impurities raise the temperature, hence the wide range.']
              ], t('Priemaišos žemina ir plečia lydymosi intervalą.', 'Impurities lower and broaden the melting range.'),
                pure ? t('Intervalas siauras (' + (hi - lo) + ' °C) ir sutampa su literatūrine verte: junginys grynas.', 'The range is narrow (' + (hi - lo) + ' °C) and agrees with the literature value: the compound is pure.')
                  : t('Intervalas platus (' + (hi - lo) + ' °C), o pradžia gerokai žemesnė už 135 °C: yra priemaišų, reikia perkristalinti.', 'The range is wide (' + (hi - lo) + ' °C) and starts well below 135 °C: impurities are present and the product needs recrystallising.'))
            ],
            why: t('Priemaišos sutrikdo kristalinę gardelę, todėl lydymosi temperatūra krinta, o intervalas plečiasi. Grynas junginys lydosi apie 1–2 °C intervale.', 'Impurities disturb the crystal lattice, so the melting point falls and the range widens. A pure compound melts within about 1–2 °C.'),
            src: 'LW4 p2'
          };
        }
      },
      // ------------------------------------------------------------------ apparatus
      {
        id: 'l4.apparatus',
        title: t('Įrangos atpažinimas pagal aprašymą', 'Identifying apparatus from a description'),
        mirrors: ['LW4.1', 'LW4.2', 'LW4.3', 'LW4.4', 'LW4.8'],
        bank: [
          P('l4.apparatus.1', t('Kūgio formos kolba plokščiu dugnu ir siauru kaklu.', 'A cone-shaped flask with a flat base and a narrow neck.'),
            ch(t('Kas tai?', 'What is it?'), [
              ['Erlenmejerio kolba: reakcijos indas, kurį lengva maišyti ir uždengti.', 'An Erlenmeyer flask: a reaction vessel that is easy to swirl and cover.'],
              ['Distiliavimo kolba su šoniniu atvamzdžiu.', 'A distilling flask with a side arm.'],
              ['Bunzeno kolba.', 'A Bunsen flask.'],
              ['Matavimo cilindras.', 'A measuring cylinder.']
            ], t('Ar kolba turi šoninį atvamzdį vakuumui?', 'Does the flask have a side arm for a vacuum?'),
              t('Šoninio atvamzdžio nėra, todėl tai paprasta Erlenmejerio kolba, naudojama sintezei.', 'There is no side arm, so this is an ordinary Erlenmeyer flask used for the synthesis.')),
            t('Siauras kaklas mažina garavimą ir leidžia užkimšti ar uždengti.', 'A narrow neck reduces evaporation and allows covering.'), 'LW4 p1'),
          P('l4.apparatus.2', t('Prietaisas po kolba sukuria besisukantį magnetinį lauką, o kolboje sukasi baltas lazdelės pavidalo kūnas.', 'A device under the flask creates a rotating magnetic field, and a white rod-shaped body spins in the flask.'),
            ch(t('Ką aprašo šis vaizdas?', 'What does this describe?'), [
              ['Magnetinė maišyklė su tefloniniu maišikliuku, inertišku rūgštims.', 'A magnetic stirrer with a Teflon stir bar, inert to acids.'],
              ['Kaitinimo viryklė.', 'A hot plate.'],
              ['Centrifuga.', 'A centrifuge.'],
              ['Vakuuminis siurblys.', 'A vacuum pump.']
            ], t('Kas judina kūną nesiliečiant su juo?', 'What moves the body without touching it?'),
              t('Magnetinis laukas sukioja viduje esantį magnetą, o teflono dangalas nereaguoja su $H2SO4$ ir anhidridu.', 'The magnetic field turns the magnet inside, and the Teflon coating does not react with $H2SO4$ and the anhydride.')),
            t('Maišymas užtikrina tolygų katalizatoriaus pasiskirstymą.', 'Stirring gives an even distribution of the catalyst.'), 'LW4 p1'),
          P('l4.apparatus.3', t('Platus apvalus dubuo žemais šonais, pripildytas vandens ir ledo.', 'A wide round dish with low sides filled with water and ice.'),
            ch(t('Kas tai ir kam reikalinga?', 'What is it and what is it for?'), [
              ['Kristalizatorius: į jį supilamas mišinys, kad greitai atvėstų ir iškristų kristalai.', 'A crystallising dish: the mixture is poured in to cool fast so that crystals separate.'],
              ['Distiliavimo kolba.', 'A distilling flask.'],
              ['Džiovinimo indas.', 'A drying vessel.'],
              ['Kaitinimo vonia.', 'A heating bath.']
            ], t('Ar indas skirtas šildyti, ar vėsinti?', 'Is the vessel for heating or for cooling?'),
              t('Didelis paviršius ir ledas greitai atvėsina turinį, todėl aspirinas kristalizuojasi.', 'The large surface and the ice cool the content quickly, so aspirin crystallises.')),
            t('Šaltis sumažina tirpumą ir didina išeigą.', 'Cold lowers solubility and increases the yield.'), 'LW4 p1'),
          P('l4.apparatus.4', t('Porcelianinis piltuvas su plokščiu skylėtu dugnu, ant jo apvalus filtro popierius, o apačioje gumine movele sujungtas storasienis indas su šoniniu atvamzdžiu.', 'A porcelain funnel with a flat perforated plate, a round filter paper on it, and below it, connected with a rubber seal, a thick-walled vessel with a side arm.'),
            ch(t('Ką aprašo šis vaizdas?', 'What does this describe?'), [
              ['Biuchnerio piltuvas su Bunzeno kolba: vakuuminis filtravimas.', 'A Büchner funnel with a Bunsen flask: vacuum filtration.'],
              ['Lašinamoji piltuvė su kolba.', 'A dropping funnel with a flask.'],
              ['Liebigo šaldytuvas.', 'A Liebig condenser.'],
              ['Soksleto aparatas.', 'A Soxhlet apparatus.']
            ], t('Kam reikalingas šoninis atvamzdis storasienėje kolboje?', 'What is the side arm on the thick-walled flask for?'),
              t('Atvamzdis jungiamas prie vakuuminės linijos, todėl skystis išsiurbiamas per kristalus.', 'The side arm connects to the vacuum line, so the liquid is drawn through the crystals.')),
            t('Vakuuminis filtravimas yra greitas ir palieka sausesnę medžiagą.', 'Vacuum filtration is quick and leaves a drier material.'), 'LW4 p1'),
          P('l4.apparatus.5', t('Kūgio formos guminis kūnas, įstumiamas į kolbos kaklą.', 'A cone-shaped rubber body pushed into the neck of the flask.'),
            ch(t('Koks jo vardas ir paskirtis?', 'What is it called and what does it do?'), [
              ['Kamštelis: uždaro kolbos angą, riboja garų išsiskyrimą ir apsaugo nuo purslų.', 'A stopper: closes the mouth of the flask, limits the escape of vapours and protects against splashes.'],
              ['Matavimo cilindras.', 'A measuring cylinder.'],
              ['Filtro popierius.', 'Filter paper.'],
              ['Aušinimo kolona.', 'A cooling column.']
            ], t('Ar jis atviras, ar sandariai uždaro kaklą?', 'Is it open, or does it seal the neck?'),
              t('Jis užkemša kaklą, todėl garai nepabėga, o purslai nepatenka į aplinką.', 'It plugs the neck, so vapours do not escape and splashes do not leave the flask.')),
            t('Uždarymas yra paprasčiausia garų ir purslų kontrolė.', 'Closing is the simplest control of vapours and splashes.'), 'LW4 p1'),
          P('l4.apparatus.6', t('Dėžė su šildytuvu, kurioje laikoma medžiaga 20 min 80 °C temperatūroje.', 'A box with a heater in which the material is kept at 80 °C for 20 min.'),
            ch(t('Ką aprašo šis vaizdas?', 'What does this describe?'), [
              ['Džiovinimo krosnis: pašalina drėgmę, kad masė būtų tikra.', 'A drying oven: removes moisture so that the mass is true.'],
              ['Vandens vonia.', 'A water bath.'],
              ['Šaldytuvas.', 'A refrigerator.'],
              ['Elektrinė viryklė.', 'An electric hot plate.']
            ], t('Kodėl temperatūra žemesnė už aspirino lydymosi tašką?', 'Why is the temperature below the melting point of aspirin?'),
              t('80 °C pakanka vandeniui išgarinti, bet nelydo ir neskaido aspirino.', '80 °C is enough to evaporate water but does not melt or decompose aspirin.')),
            t('Pasverti reikia išdžiūvusią medžiagą, antraip išeiga bus per didelė.', 'Only dried material should be weighed, otherwise the yield will be too high.'), 'LW4 p1'),
          P('l4.apparatus.7', t('Cilindras su padalomis, kuriuo matuojami 25 ml skysčio vandens.', 'A cylinder with graduations used to measure 25 ml of liquid water.'),
            ch(t('Kas tai?', 'What is it?'), [
              ['Matavimo cilindras: tūriui matuoti.', 'A measuring cylinder: for measuring volume.'],
              ['Kolba su atvamzdžiu.', 'A flask with a side arm.'],
              ['Kristalizatorius.', 'A crystallising dish.'],
              ['Lašinamoji piltuvė.', 'A dropping funnel.']
            ], t('Ar tai indas reakcijai ar matavimui?', 'Is it for reaction or for measurement?'),
              t('Skalės leidžia nustatyti tūrį, todėl cilindras tinka vandeniui ir acetanhidridui matuoti.', 'The scale gives the volume, so a cylinder suits measuring water and acetic anhydride.')),
            t('Tikslus tūris reikalingas, kad reagentų santykis būtų teisingas.', 'An accurate volume is needed for the correct reagent ratio.'), 'LW4 p1'),
          P('l4.apparatus.8', t('Metalinė mentelė ir stiklinis kamštis, kuriais spaudžiamos ir nugramdomos medžiagos.', 'A metal spatula and a glass stopper used to press and scrape material.'),
            ch(t('Kam jie naudojami šiame darbe?', 'What are they used for in this work?'), [
              ['Kristalams ant filtro nuspausti ir iškrapštyti ant popierėlio.', 'To press the crystals on the filter and scrape them onto the paper.'],
              ['Kolbai maišyti kaitinant.', 'To stir the flask while heating.'],
              ['Reagentams matuoti.', 'To measure reagents.'],
              ['Lydymosi temperatūrai matuoti.', 'To measure the melting point.']
            ], t('Kurioje darbo dalyje reikia suspausti drėgnus kristalus?', 'In which part of the work do you press moist crystals?'),
              t('Šie įrankiai skirti produktui filtre išspausti ir surinkti prieš džiovinant.', 'These tools press and collect the product on the filter before drying.')),
            t('Teisingi įrankiai mažina nuostolius ir užteršimą.', 'Correct tools reduce loss and contamination.'), 'LW4 p1')
        ]
      },
      // ------------------------------------------------------------------ defence
      {
        id: 'l4.defence',
        title: t('Gynimo klausimai', 'Defence questions'),
        mirrors: ['LW4.1', 'LW4.2', 'LW4.3', 'LW4.4', 'LW4.5', 'LW4.6', 'LW4.7', 'LW4.8'],
        bank: [
          P('l4.defence.1', t('Aspirino kristalus bandymui ištirpinate šaltame vandenyje; kaitinti tirpalo negalima.', 'You dissolve the aspirin crystals for the test in cold water; heating the solution is not allowed.'),
            ch(t('Kodėl negalima kaitinti?', 'Why must it not be heated?'), [
              ['Aspirinas karštame vandenyje hidrolizuojasi į salicilo rūgštį ir acto rūgštį, todėl $FeCl3$ duotų klaidingą violetinę spalvą.', 'In hot water aspirin hydrolyses to salicylic acid and acetic acid, so $FeCl3$ would give a false violet colour.'],
              ['Karštame vandenyje aspirinas polimerizuojasi.', 'In hot water aspirin polymerises.'],
              ['Kaitinant $FeCl3$ suyra.', '$FeCl3$ decomposes on heating.'],
              ['Aspirinas sublimuojasi ir pabėga.', 'Aspirin sublimes and escapes.']
            ], t('Koks ryšys aspirine jautrus vandeniui?', 'Which bond in aspirin is sensitive to water?'),
              t('Esterio ryšys su vandeniu skyla, ypač šildomas. Tada atsiranda laisvas fenolio $OH$.', 'The ester bond is split by water, especially when warmed. A free phenolic $OH$ then appears.')),
            t('Bandymas turi rodyti, kas buvo produkte, o ne tai, kas atsirado bandymo metu.', 'The test must show what was in the product, not what appears during the test.'), 'LW4 p2'),
          P('l4.defence.2', t('Aspirino sintezėje vyksta reakcija tarp salicilo rūgšties ir acetanhidrido.', 'In the aspirin synthesis salicylic acid reacts with acetic anhydride.'),
            ch(t('Koks yra reakcijos tipas?', 'What type of reaction is this?'), [
              ['Fenolio $OH$ acilinimas (nukleofilinis acilpakeitimas) į esterį.', 'Acylation of the phenolic $OH$ (nucleophilic acyl substitution) to an ester.'],
              ['Elektrofilinis prijungimas prie dvigubojo ryšio.', 'Electrophilic addition to a double bond.'],
              ['Aromatinis nitrinimas (SEAr).', 'Aromatic nitration (SEAr).'],
              ['Radikalinis pakeitimas (SR).', 'Radical substitution (SR).']
            ], t('Ką fenolio deguonis daro karbonilo anglies atžvilgiu?', 'What does the phenolic oxygen do to the carbonyl carbon?'),
              t('Deguonis kaip nukleofilas atakuoja karbonilo anglį, ir acilo grupė pakeičia vandenilį: tai acilpakeitimas.', 'Oxygen as a nucleophile attacks the carbonyl carbon and an acyl group replaces hydrogen: acyl substitution.')),
            t('Pagrindinis požymis: karboksilo darinys su nukleofilu duoda kitą karboksilo darinį.', 'The mark: a carboxylic acid derivative with a nucleophile gives another acid derivative.'), 'LW4 p1'),
          P('l4.defence.3', t('Salicilo rūgštyje yra dvi grupės su $OH$: fenolinė ir karboksilo.', 'Salicylic acid has two groups with $OH$: the phenolic and the carboxyl one.'),
            { prompt: t('Bakstelėkite deguonį, kuris aciliuojamas.', 'Tap the oxygen that is acylated.'), kind: 'atoms', mol: { smi: SAL, opts: { numbers: 'all' } }, answer: [0],
              hint: t('Kuri $OH$ yra prijungta tiesiai prie aromatinio žiedo?', 'Which $OH$ is attached directly to the aromatic ring?'),
              solution: t('Deguonis Nr. 1 priklauso fenolinei $OH$, kuri virsta esteriu. Karboksilo grupė lieka rūgštimi.', 'Oxygen no. 1 belongs to the phenolic $OH$, which becomes the ester. The carboxyl group stays an acid.') },
            t('Anhidridas acilina fenolio deguonį, o karboksilo grupė išlieka, todėl aspirinas dar yra rūgštis.', 'The anhydride acylates the phenolic oxygen and the carboxyl group remains, so aspirin is still an acid.'), 'LW4 p1'),
          P('l4.defence.4', t('Salicilo rūgšties ir acetanhidrido reakcijoje susidaro ne tik aspirinas.', 'Salicylic acid and acetic anhydride give more than just aspirin.'),
            ch(t('Koks yra šalutinis produktas?', 'What is the by-product?'), [
              ['Acto rūgštis.', 'Acetic acid.'],
              ['Vanduo.', 'Water.'],
              ['Anglies dioksidas.', 'Carbon dioxide.'],
              ['Sieros rūgštis.', 'Sulfuric acid.']
            ], t('Kokia anhidrido dalis neprisijungia prie fenolio?', 'Which part of the anhydride does not bond to the phenol?'),
              t('Viena acetilo grupė pereina į aspiriną, o antroji su deguonimi lieka kaip $CH3COOH$. Esterifikuojant rūgštimi susidarytų vanduo, bet su anhidridu vandens nėra.', 'One acetyl group goes to aspirin, and the other stays with the oxygen as $CH3COOH$. Esterification with the acid would form water, but with the anhydride there is none.')),
            t('Anhidridas yra dvi acetilo grupės, sujungtos deguonimi: viena prisijungia, kita išeina.', 'An anhydride is two acetyl groups joined by oxygen: one bonds and the other leaves.'), 'LW4 p1'),
          P('l4.defence.5', t('Darbe sakoma, kad 2 g salicilo rūgšties yra 0,0145 mol, o 5 ml acetanhidrido – 0,053 mol.', 'The lab says 2 g of salicylic acid is 0.0145 mol and 5 ml of acetic anhydride is 0.053 mol.'),
            { prompt: t('Kokią teorinę aspirino masę (g) turėtų duoti 2 g salicilo rūgšties ($M$ = 138,12; aspirino $M$ = 180,16)?', 'What theoretical mass of aspirin (g) should 2 g of salicylic acid give ($M$ = 138.12; aspirin $M$ = 180.16)?'),
              kind: 'number', answer: { value: 2 / 138.12 * 180.16, tol: 0.03 },
              hint: t('Raskite molius ir padauginkite iš aspirino molinės masės.', 'Find the moles and multiply by the molar mass of aspirin.'),
              solution: t('$2 / 138,12 · 180,16 = 2,61$ g.', '$2 / 138.12 · 180.16 = 2.61$ g.') },
            t('Teorinė masė yra aukščiausia galima riba; tikra išeiga visada mažesnė.', 'The theoretical mass is the upper limit; the true yield is always smaller.'), 'LW4 p2'),
          P('l4.defence.6', t('Fenolio $OH$ ir karboksilo grupė greta vienas kito salicilo rūgštyje sudaro su $Fe3+$ chelatą.', 'The phenolic $OH$ and the carboxyl group side by side in salicylic acid form a chelate with $Fe3+$.'),
            ch(t('Kodėl aspirinas to nedaro?', 'Why does aspirin not do this?'), [
              ['Jo fenolio deguonis surištas su acetilo grupe ir nebegali tapti fenoksidu bei dalyvauti kompleksuose.', 'Its phenolic oxygen is bonded to the acetyl group and can no longer act as a phenoxide in the complex.'],
              ['Aspirinas neturi karboksilo grupės.', 'Aspirin has no carboxyl group.'],
              ['Aspirinas yra nepolinis ir netirpsta vandenyje.', 'Aspirin is nonpolar and does not dissolve in water.'],
              ['Aspirine geležis redukuojama iki $Fe2+$.', 'In aspirin the iron is reduced to $Fe2+$.']
            ], t('Kuri molekulės dalis pasikeitė reakcijoje?', 'Which part of the molecule changed in the reaction?'),
              t('Aspirino karboksilo grupė išlikusi, bet fenolio $OH$ virto esteriu. Kompleksui reikia abiejų grupių.', 'The carboxyl group of aspirin remains, but the phenolic $OH$ became an ester. The complex needs both groups.')),
            t('Bandymas tikrina specifinę grupę, o ne bendrą rūgštingumą.', 'The test checks one specific group, not acidity in general.'), 'LW4 p2'),
          P('l4.defence.7', t('Aspirino gavote tik 70 % teorinės masės.', 'You obtained only 70 % of the theoretical mass of aspirin.'),
            ch(t('Kuri priežastis yra tikėtina?', 'Which reason is likely?'), [
              ['Dalis produkto liko tirpale ir filtrate arba pasiliko ant įrankių.', 'Part of the product stayed in solution, in the filtrate, or on the equipment.'],
              ['Stechiometrija neleidžia gauti daugiau nei 70 %.', 'Stoichiometry does not allow more than 70 %.'],
              ['Acetanhidridas buvo ribojantis reagentas.', 'Acetic anhydride was the limiting reagent.'],
              ['Reakcija yra negrįžtama, todėl produktas visada sveria mažiau.', 'The reaction is irreversible, so the product always weighs less.']
            ], t('Kur gali dingti kristalai tarp reakcijos ir svėrimo?', 'Where can crystals disappear between the reaction and weighing?'),
              t('Aspirinas šiek tiek tirpsta vandenyje, dalis lieka ant stiklo ir filtro. Be to, reakcija gali nepasibaigti.', 'Aspirin dissolves a little in water, and some stays on the glass and filter. The reaction may also be incomplete.')),
            t('Išeiga mažėja dėl mechaninių nuostolių ir tirpumo, o ne dėl stechiometrijos.', 'Yield falls through mechanical losses and solubility, not through stoichiometry.'), 'LW4 p2'),
          P('l4.defence.8', t('Po darbo reikia išplauti aparatūrą šiltu vandeniu, išskyrus termometrą.', 'After the work the apparatus is washed with warm water, except the thermometer.'),
            ch(t('Kokia saugumo ir tvarkos taisyklė galioja?', 'Which safety and housekeeping rule applies?'), [
              ['Plauti šiltu vandeniu, padėti ant stalo, o priemones grąžinti į jų vietas; termometro neplauti šiltu vandeniu.', 'Wash with warm water, put it on the bench and return the equipment to its places; do not wash the thermometer in warm water.'],
              ['Aparatūrą palikti nešvarią kitiems.', 'Leave the apparatus dirty for the next group.'],
              ['Visas liekanas pilti į kriauklę.', 'Pour all residues into the sink.'],
              ['Karštą stiklą aušinti ledu.', 'Cool hot glass with ice.']
            ], t('Kas lieka po darbo kolboje?', 'What is left in the flask after the work?'),
              t('Rūgščių liekanos ir vaistas neturi likti: aparatūra plaunama pati, o tvarka leidžia kitiems dirbti saugiai.', 'Acid residues and the drug should not remain: the apparatus is washed and order lets others work safely.')),
            t('Tvarka laboratorijoje yra saugumo dalis.', 'Order in the lab is part of safety.'), 'LW4 p2')
        ]
      }
    ],
    coverage: {}
  };
  // coverage is the inverse of the mirrors lists
  U.types.forEach(ty => ty.mirrors.forEach(k => { (U.coverage[k] = U.coverage[k] || []).push(ty.id); }));
  ORG.unit(U);
})(globalThis.ORG = globalThis.ORG || {});
