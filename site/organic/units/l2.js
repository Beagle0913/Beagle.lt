// site/organic/units/l2.js: lab unit 2, distillation (fractional distillation of acetone waste) and refractive index
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

  const ACETONE = 'CC(C)=O';
  const ETOH = 'CCO';
  const nAcetone = t('propanonas (acetonas)', 'propanone (acetone)');
  const nEtOH = t('etanolis', 'ethanol');

  const U = {
    id: 'l2',
    notes: [
      {
        id: 'aim',
        title: t('Tikslas ir principas', 'Aim and principle'),
        blocks: [
          { h: t('Ką šis darbas parodo', 'What this lab shows') },
          {
            p: t('Laboratorijose indams plauti sunaudojama daug acetono, todėl lieka daug jo atliekų. Jose yra kitų organinių medžiagų ir vandens, bet jei skystį distiliuosime per deflegmatorių, gausime pakankamai gryną acetoną, tinkamą indams plauti iš naujo. Darbe išmokstama atskirti komponentus pagal virimo temperatūrą ir nustatyti gauto skysčio grynumą.',
              'Laboratories use acetone in large amounts to rinse glassware, so a lot of acetone waste builds up. It contains other organic compounds and water, but distilling it through a fractionating column (dephlegmator) gives acetone pure enough to rinse glassware again. The lab teaches how to separate components by boiling point and how to judge the purity of the result.'),
            src: 'LW2 p5'
          },
          {
            mol: [{ smi: ACETONE, name: t('propanonas', 'propanone'), caption: t('acetonas, v. t. apie 56 °C', 'acetone, b. p. about 56 °C') },
              { smi: ETOH, name: nEtOH, caption: t('etanolis, v. t. 78 °C', 'ethanol, b. p. 78 °C') }],
            src: 'LW2 p4',
            claims: [{ formula: [ACETONE, 'C3H6O'] }, { formula: [ETOH, 'C2H6O'] }]
          },
          {
            rule: t('Skystis užverda tada, kai jo sočiųjų garų slėgį išlygina aplinkos slėgis. Šią temperatūrą vadiname virimo temperatūra. Ji kinta kartu su slėgiu, todėl lentelėse nurodoma ir slėgio vertė.',
              'A liquid boils once its saturated vapour pressure is matched by the surrounding pressure. That temperature is the boiling point. It moves with pressure, so table values state the pressure.'),
            src: 'LW2 p1'
          },
          {
            p: t('Distiliavimo metu skystis užverda, garai kyla, kondensatoriuje atvėsta ir susirenka priimtuve. Lakesnis komponentas garuose yra turtingesnis negu skystyje, todėl iš mišinio jis pasišalina pirmas.',
              'In a distillation the liquid boils, the vapour rises, cools in the condenser and collects in the receiver. The more volatile component is richer in the vapour than in the liquid, so it leaves the mixture first.')
          },
          {
            pitfall: t('Virimo temperatūra nėra pastovi gamtos konstanta: ji priklauso nuo slėgio. Todėl lyginti reikia su lentelės verte tomis pačiomis sąlygomis.',
              'The boiling point is not a fixed constant: it depends on pressure. Compare it with a table value taken under the same conditions.')
          },
          { practice: 'l2.defence' }
        ]
      },
      {
        id: 'kinds',
        title: t('Distiliavimo rūšys', 'Kinds of distillation'),
        blocks: [
          { h: t('Kada kurią rūšį rinktis', 'When to use which kind') },
          {
            table: {
              head: [t('Rūšis', 'Kind'), t('Kada naudojama', 'When it is used'), t('Esmė', 'Key idea')],
              rows: [
                [t('paprastasis', 'simple'), t('komponentų v. t. skiriasi daugiau kaip 80 °C, arba nuo lakios dalies atskiriamos nelakios medžiagos', 'boiling points differ by more than 80 °C, or volatile material is separated from non-volatile solids'), t('vienas garinimo ir kondensavimo ciklas', 'one vaporisation and condensation cycle')],
                [t('frakcinis', 'fractional'), t('panašios v. t. skysčių mišinys', 'a mixture of liquids with close boiling points'), t('kolonoje ciklai kartojasi daug kartų', 'many cycles repeat in a column')],
                [t('vakuume', 'under vacuum'), t('v. t. aukšta, medžiaga skyla kaitinama', 'high boiling point, the compound decomposes on heating'), t('sumažinus slėgį, v. t. nukrinta', 'lowering the pressure lowers the boiling point')],
                [t('vandens garais', 'with steam'), t('aukštos v. t. ir vandenyje netirpi medžiaga', 'high boiling, water-insoluble compound'), t('pro mišinį leidžiami vandens garai', 'steam is passed through the mixture')]
              ]
            },
            src: 'LW2 p1, p4'
          },
          {
            p: t('Frakciniame distiliavime tarp kolbos ir kondensatoriaus yra kolona (deflegmatorius). Joje dalis garų kondensuojasi ir grįžta žemyn, todėl garai su skysčiu kontaktuoja daug kartų. Kiekvieną kartą garai tampa vis turtingesni lakesniu komponentu, ir viršuje išeina beveik gryna lakioji frakcija.',
              'In fractional distillation a column (dephlegmator) sits between the flask and the condenser. Part of the vapour condenses there and runs back down, so vapour and liquid meet many times. Each contact enriches the vapour in the more volatile component, and a nearly pure volatile fraction leaves at the top.'),
            src: 'LW2 p3'
          },
          {
            rule: t('Vakuume veikia apytikslė taisyklė: perpus sumažinus slėgį, virimo temperatūra nukrinta maždaug 15–20 °C; kai slėgis tik 5–10 mm Hg, nukritimas siekia 100–150 °C.',
              'Under vacuum a rule of thumb holds: halving the pressure lowers the boiling point by roughly 15–20 °C; at a pressure of only 5–10 mm Hg the drop is 100–150 °C.'),
            src: 'LW2 p4'
          },
          { h: t('Azeotropai', 'Azeotropes') },
          {
            p: t('Azeotropinio mišinio garai ir skystis turi tokią pačią sudėtį, todėl distiliuojant jis elgiasi kaip viena medžiaga ir jo negalima suskaidyti frakciniu distiliavimu. Pavyzdžiui, etanolis su vandeniu sudaro azeotropą, kuriame yra 95,5 % etanolio ir kuris verda 78,15 °C temperatūroje. Absoliutus etanolis gaunamas vandenį cheminiu būdu surišus, pavyzdžiui, virinant su $CaO$.',
              'An azeotropic mixture gives a vapour with the same composition as the liquid, so it distils like a single substance and fractional distillation cannot split it. For example ethanol and water form an azeotrope containing 95.5 % ethanol that boils at 78.15 °C. Absolute ethanol is obtained by binding the water chemically, for instance by boiling with $CaO$.'),
            src: 'LW2 p4'
          },
          {
            pitfall: t('Pastovi virimo temperatūra dar nereiškia gryno junginio: azeotropas taip pat verda pastovioje temperatūroje.',
              'A constant boiling temperature does not by itself prove a pure compound: an azeotrope also boils at a constant temperature.')
          },
          { practice: 'l2.apparatus' }
        ]
      },
      {
        id: 'apparatus',
        title: t('Aparatūra', 'Apparatus'),
        blocks: [
          { h: t('Frakcinio distiliavimo surinkimas', 'Assembling the fractional distillation') },
          {
            list: [
              t('Elektrinė viryklė su vandens vonia (kaitinimas per vonią saugesnis už liepsną ir tolygesnis).', 'An electric hot plate with a water bath (heating through a bath is safer than a flame and more even).'),
              t('Viurco kolba (distiliavimo kolba su šonine atšaka) – paprastajam distiliavimui.', 'A Würtz flask (distillation flask with a side arm) for simple distillation.'),
              t('Favorskio kolba, kuri vienoje detalėje apjungia kolbą, kolonėlę ir šoninę atšaką; be jos naudojama atskira kolba su atšakos adapteriu ir deflegmatoriumi.', 'A Favorsky flask, which combines flask, column and side arm in one piece; without it, a separate flask with a side-arm adapter and a dephlegmator.'),
              t('Termometras viršutinėje angoje, Lybigo kondensatorius ant stovo, priimtuvas (Erlenmejerio kolbutė) ir matavimo cilindras.', 'A thermometer in the top opening, a Liebig condenser on a stand, a receiver (Erlenmeyer flask) and a graduated cylinder.'),
              t('Pemzos gabalėliai (virimo akmenukai).', 'Pumice pieces (boiling chips).')
            ],
            src: 'LW2 p5'
          },
          {
            rule: t('Termometro gyvsidabrio rutuliuko viršutinis kraštas turi sutapti su atšakos apatinio krašto aukščiu: tada jis rodo garų, o ne kolbos šilumos temperatūrą. Skysčio pilama ne daugiau kaip du trečdaliai kolbos tūrio. Vanduo į kondensatorių įleidžiamas iš apačios.',
              'The top of the bulb is level with the lower edge of the side arm: then it reads the temperature of the vapour, not of the hot flask. The flask holds no more than two thirds of its volume. Water enters the condenser from below.'),
            src: 'LW2 p2, p5'
          },
          {
            p: t('Kondensatorius parenkamas pagal virimo temperatūrą: žemiau 120 °C tinka kondensatorius su tekančiu vandeniu, 120–160 °C – su nejudančiu vandeniu, o virš 160 °C – oro kondensatorius (stiklinis vamzdis). Šildymo vonia turi būti 20–25 °C karštesnė už skysčio v. t.; labai lakiems ir degiems skysčiams, pavyzdžiui, dietileteriui, būtina vandens vonia.',
              'The condenser follows the boiling point: below 120 °C a water-cooled one with flowing water, 120–160 °C the same with standing water, above 160 °C an air condenser (a glass tube). The heating bath should be 20–25 °C hotter than the boiling point of the liquid; very volatile and flammable liquids, for example diethyl ether, need a water bath.'),
            src: 'LW2 p2'
          },
          {
            pitfall: t('Niekada nemeskite virimo akmenukų į jau įkaitusį skystį: jis gali staiga išsiveržti iš kolbos. Pamiršus, kaitinimą išjunkite, leiskite atvėsti ir tik tada įdėkite.',
              'Never drop boiling chips into a hot liquid: it can erupt from the flask. If you forgot, switch the heating off, let it cool, and only then add them.'),
            src: 'LW2 p2'
          },
          { practice: 'l2.order' }
        ]
      },
      {
        id: 'procedure',
        title: t('Darbo eiga ir ką ji reiškia', 'Procedure and what it means'),
        blocks: [
          { h: t('Kaip skirstomos frakcijos', 'How fractions are collected') },
          {
            list: [
              t('Surenkama aparatūra, į kondensatorių paleidžiamas vanduo (apačioje įėjimas, viršuje išėjimas), kolba pripildoma 50 ml acetono atliekų su virimo akmenukais.', 'Assemble the apparatus, start the condenser water (in at the bottom, out at the top), and fill the flask with 50 ml of acetone waste and boiling chips.'),
              t('Įjungus kaitinimą stebimas termometras: skystis užverda, garų žiedas kyla deflegmatoriumi ir pasiekia termometrą.', 'Switch on the heating and watch the thermometer: the liquid boils, a ring of vapour climbs through the dephlegmator and reaches the thermometer.'),
              t('Kaitinimas parenkamas toks, kad priimtuve kas sekundę pasirodytų 1–2 lašai.', 'Set the heating so that one or two drops reach the receiver every second.'),
              t('Pradinė frakcija (1–3 ml) surenkama atskirai ir išpilama; tada priimtuvas keičiamas ir renkama pagrindinė frakcija, kai temperatūra apie 55–58 °C.', 'The forerun (1–3 ml) is collected separately and discarded; then the receiver is changed and the main fraction is collected at about 55–58 °C.'),
              t('Distiliavimą nutraukiame, kai termometras rodo daugiau nei 58 °C, kolboje telieka apie 3 ml arba lašai nebekrenta.', 'Stop the distillation when the thermometer shows more than 58 °C, when only about 3 ml remain in the flask, or when drops no longer fall.'),
              t('Išjungus kaitinimą, laukiama, kol nulašės paskutiniai lašai; tik tada užsukamas vanduo ir nuimamas priimtuvas.', 'After switching off the heating, wait for the last drops to fall; only then close the water and remove the receiver.')
            ],
            ordered: true,
            src: 'LW2 p5, p6'
          },
          {
            p: t('Kiekvienas žingsnis turi priežastį. Lašėjimo greitis lemia pusiausvyrą kolonoje: per greitai kaitinant, garai praeina neišsiskyrę. Pradinė frakcija turi lakesnių priemaišų. Pagrindinė frakcija renkama tada, kai temperatūra tampa pastovi. Kolbos negalima distiliuoti iki sausumo, nes sausame likutyje gali kauptis nestabilūs ar pavojingi junginiai.',
              'Each step has a reason. The dripping rate sets the equilibrium in the column: heated too fast, the vapour passes through unseparated. The forerun holds more volatile impurities. The main fraction is collected once the temperature is steady. The flask must not be run dry, because a dry residue can hold unstable or hazardous compounds.'),
            src: 'LW2 p2'
          },
          {
            pitfall: t('Pagrindinės frakcijos v. t. užrašoma ne iš pirmo, o iš viso jos rinkimo intervalo, kai termometras rodė pastovią vertę. Neimkite temperatūros pačioje pradžioje ar pabaigoje.',
              'The boiling point of the main fraction is not read at its first drop or its last, but over the whole interval in which the thermometer held steady.'),
            src: 'LW2 p6'
          },
          { practice: 'l2.why' },
          { practice: 'l2.observe' }
        ]
      },
      {
        id: 'purity',
        title: t('Grynumas ir lūžio rodiklis', 'Purity and refractive index'),
        blocks: [
          { h: t('Ką byloja virimo temperatūra ir lūžio rodiklis', 'What boiling point and refractive index tell') },
          {
            p: t('Praktiškai grynais laikomi skysčiai, kurie distiliuojasi 1–2 °C intervale. Papildomai matuojamas lūžio rodiklis $n$: tai kritimo ir lūžimo kampų sinusų santykis, $n = sin α / sin β$, kai šviesa iš oro patenka į skystį. Jis priklauso nuo bangos ilgio ir temperatūros, todėl žymimas $n_D^20$ (natrio dublėto D linija, bangos ilgis 589 nm, temperatūra 20 °C).',
              'Liquids that distil within a 1–2 °C interval count as practically pure. In addition the refractive index $n$ is measured: it is the ratio of the sines of the angles of incidence and refraction, $n = sin α / sin β$, for light going from air into the liquid. It depends on wavelength and temperature, so it is written $n_D^20$ (the sodium D line, wavelength 589 nm, temperature 20 °C).'),
            src: 'LW2 p3'
          },
          {
            rule: t('Gryno acetono $n_D^20$ yra apie 1,359; vandens apie 1,333. Vandens priemaiša rodiklį mažina, o rodiklio pokytis rodo, kiek mišinys nutolo nuo gryno junginio.',
              'Pure acetone has $n_D^20$ of about 1.359, water about 1.333. Water as an impurity lowers the value, and the shift shows how far the mixture is from the pure compound.'),
            src: 'LW2 p3, Klein'
          },
          {
            example: {
              q: [{ p: t('Iš 50 ml atliekų surinkta 1 ml pradinės frakcijos ir 38 ml pagrindinės frakcijos. Kokia pagrindinės frakcijos išeiga procentais ir kiek skysčio liko?', 'From 50 ml of waste, 1 ml of forerun and 38 ml of main fraction were collected. What is the yield of the main fraction in per cent, and how much liquid is left?') }],
              steps: [
                [{ p: t('Išeiga skaičiuojama pagal tūrį: pagrindinė frakcija padalijama iš pradinio tūrio.', 'The yield is calculated by volume: main fraction divided by the starting volume.') }],
                [{ p: t('$38 / 50 · 100 = 76$ %.', '$38 / 50 · 100 = 76$ %.') }],
                [{ p: t('Likutis ir nuostoliai: $50 − 1 − 38 = 11$ ml.', 'Residue and losses: $50 − 1 − 38 = 11$ ml.') }]
              ]
            }
          },
          {
            p: t('Distiliatas ir likutis išmatuojami, išeiga skaičiuojama procentais, o lūžio rodiklis nustatomas refraktometru: ant matavimo stikliuko užlašinami keli lašai skysčio ir paspaudžiamas mygtukas, ekrane atsiranda skaičius.',
              'The distillate and residue are measured, the yield is calculated in per cent, and the refractive index is found with a refractometer: a few drops of the liquid go on the measuring glass, a button is pressed and the value appears on the screen.'),
            src: 'LW2 p3, p6'
          },
          {
            pitfall: t('Sutapęs lūžio rodiklis dar neįrodo grynumo, nes skirtingos medžiagos gali turėti panašius rodiklius (acetono ir etanolio rodikliai atitinkamai apie 1,359 ir 1,361). Jį reikia derinti su virimo temperatūra.',
              'A matching refractive index does not prove purity, because different compounds can have close values (acetone and ethanol about 1.359 and 1.361). Combine it with the boiling point.')
          },
          { practice: 'l2.prove' },
          { practice: 'l2.calc' }
        ]
      },
      {
        id: 'safety',
        title: t('Sauga ir tvarka', 'Safety and tidiness'),
        blocks: [
          { h: t('Saugus darbas', 'Working safely') },
          {
            p: t('Acetonas labai degus ir lakus, jo garai lengvai užsiliepsnoja. Sistema neturi būti visiškai uždara, kad nesikauptų slėgis, o jungtys turi gerai priglusti, kad garai nepabėgtų. Prieš kaitinant būtina paleisti vandenį į kondensatorių, o atvirą liepsną pakeisti elektrine virykle su vandens vonia.',
              'Acetone is highly flammable and volatile, and its vapour ignites easily. The system must not be sealed shut, so no pressure builds up, yet the joints must fit well so the vapour cannot escape. Start the condenser water before heating, and use an electric hot plate with a water bath instead of a flame.'),
            src: 'LW2 p2, p5'
          },
          {
            list: [
              t('Atliekos ir likučiai pilami tik į joms skirtas talpyklas, ne į kriauklę.', 'Waste and residues go only into the containers meant for them, never down the sink.'),
              t('Aparatūra po darbo išardoma, o įrankiai grąžinami į jų vietas.', 'After the work the apparatus is taken apart and the equipment goes back to its place.'),
              t('Gautas acetonas supilamas į jam skirtą indą; pradinė frakcija – į atliekų indą.', 'The recovered acetone goes into its own container; the forerun goes into the waste container.')
            ],
            src: 'LW2 p6'
          },
          {
            pitfall: t('Nepalikite kaitinamos aparatūros be priežiūros ir neišardykite jos, kol skystis dar verda ar kolba karšta.',
              'Do not leave heated apparatus unattended, and do not take it apart while the liquid still boils or the flask is hot.')
          },
          { practice: 'l2.order' }
        ]
      }
    ],
    summary: [
      { h: t('Santrauka', 'Summary') },
      {
        list: [
          t('V. t. – kai sočiųjų garų slėgis lygus išoriniam slėgiui; ji priklauso nuo slėgio.', 'The boiling point is where the saturated vapour pressure equals the external pressure; it depends on pressure.'),
          t('Paprastasis distiliavimas: v. t. skirtumas daugiau nei 80 °C; frakcinis: artimos v. t.; vakuume ir vandens garais: jautrios ar aukštos v. t. medžiagos.', 'Simple distillation: boiling points more than 80 °C apart; fractional: close boiling points; vacuum and steam: sensitive or high-boiling compounds.'),
          t('Termometras ties atšakos apatiniu kraštu; kolba ne daugiau 2/3; virimo akmenukai; vanduo į kondensatorių iš apačios.', 'Thermometer at the lower edge of the side arm; flask at most 2/3 full; boiling chips; condenser water in from below.'),
          t('1–2 lašai per sekundę; pradinė frakcija išmetama; pagrindinė frakcija renkama 55–58 °C; stabdoma, kai temperatūra viršija 58 °C arba kolboje lieka apie 3 ml.', 'One or two drops per second; discard the forerun; collect the main fraction at 55–58 °C; stop when the temperature passes 58 °C or about 3 ml remain.'),
          t('Azeotropas verda pastovioje temperatūroje, bet nėra grynas junginys.', 'An azeotrope boils at constant temperature but is not a pure compound.'),
          t('$n = sin α / sin β$; $n_D^20$ gryno acetono apie 1,359; vanduo rodiklį mažina.', '$n = sin α / sin β$; $n_D^20$ of pure acetone is about 1.359; water lowers it.')
        ]
      }
    ],
    types: [
      // ---------------------------------------------------------------- order
      {
        id: 'l2.order',
        title: t('Darbo žingsnių tvarka', 'Order of the steps'),
        mirrors: ['LW2.4', 'LW2.5', 'LW2.6', 'LW2.7', 'LW2.8'],
        bank: [
          {
            id: 'l2.order.1',
            q: Q('Surenkama frakcinio distiliavimo aparatūra.', 'The fractional distillation apparatus is being assembled.'),
            steps: [ord(t('Išdėstykite veiksmus teisinga tvarka.', 'Put the actions in the right order.'), [
              ['ant stovo pastatyti viryklę su vandens vonia', 'put the hot plate with the water bath on the stand'],
              ['kolbą pritvirtinti laikikliu virš vonios', 'clamp the flask above the bath'],
              ['į viršutinę angą įstatyti termometrą', 'fit the thermometer into the top opening'],
              ['prie atšakos prijungti kondensatorių ir jį pritvirtinti prie stovo', 'attach the condenser to the side arm and clamp it to a stand'],
              ['prijungti vandens šlangeles', 'connect the water hoses'],
              ['po kondensatoriaus galu pastatyti priimtuvą', 'place the receiver under the end of the condenser']
            ], t('Pradėkite nuo to, kas laiko visą aparatą, ir baikite tuo, kas renka produktą.', 'Begin with what supports the whole apparatus and end with what collects the product.'),
              t('Pirmiausia šildymo dalis, tada kolba, termometras ir kondensatorius, paskui vandens šlangelės, nes jos jungiamos prie jau pastatyto kondensatoriaus, ir galiausiai priimtuvas po jo galu.', 'First the heating part, then the flask, thermometer and condenser, then the water hoses (they attach to the condenser already in place), and last the receiver under its tip.'))],
            why: t('Aparatūra renkama nuo apačios aukštyn ir nuo šaltinio prie priimtuvo, kad kiekviena dalis būtų pritvirtinta prie jau stovinčios.', 'The apparatus is built from the bottom up and from the source to the receiver, so each part is fixed to one that already stands.'),
            src: 'LW2 p5'
          },
          {
            id: 'l2.order.2',
            q: Q('Aparatūra surinkta, reikia pradėti distiliuoti.', 'The apparatus is assembled and the distillation is to start.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['patikrinti, ar kolboje yra virimo akmenukų ir ne daugiau 2/3 tūrio skysčio', 'check that the flask has boiling chips and no more than 2/3 of liquid'],
              ['paleisti vandenį į kondensatorių', 'start the water through the condenser'],
              ['įjungti viryklę', 'switch on the hot plate'],
              ['sureguliuoti kaitinimą iki 1–2 lašų per sekundę', 'adjust the heating to one or two drops per second'],
              ['pradinę frakciją surinkti į atskirą indą', 'collect the forerun in a separate vessel']
            ], t('Kondensatorius turi veikti dar iki pirmųjų garų.', 'The condenser must be working before the first vapour arrives.'),
              t('Prieš kaitinant tikrinamas užpildymas ir virimo akmenukai, paleidžiamas vanduo, tada kaitinama; lašėjimo greitis reguliuojamas, ir pirmoji dalis renkama atskirai.', 'Before heating, the fill level and chips are checked and the water is started; then heating begins, the rate is adjusted, and the first part is collected separately.'))],
            why: t('Jei kondensatorius dar nevėsina, pirmieji garai išeina į orą, o tai pavojinga, nes acetonas degus.', 'If the condenser is not yet cooling, the first vapour escapes into the room, which is dangerous because acetone is flammable.'),
            src: 'LW2 p5'
          },
          {
            id: 'l2.order.3',
            q: Q('Distiliavimas baigiamas.', 'The distillation is ending.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['išjungti viryklę', 'switch off the hot plate'],
              ['palaukti, kol kondensatoriaus snapelis nulašės paskutinius lašus', 'wait until the condenser tip drips the last drops'],
              ['užsukti vandenį', 'turn off the water'],
              ['nuimti kolbą su likučiu ir distiliatą', 'remove the flask with the residue and the distillate']
            ], t('Vanduo turi tekėti tol, kol dar yra ką kondensuoti.', 'Water must run while there is still vapour to condense.'),
              t('Pirmiausia nutraukiamas kaitinimas, tada laukiama paskutinių lašų, užsukamas vanduo ir tik tada išmontuojama.', 'First the heating stops, then the last drops are awaited, the water is turned off and only then is the apparatus taken apart.'))],
            why: t('Dar karšti garai po išjungimo kondensatoriuje turi sukondensuotis, kitaip jie išeitų į patalpą.', 'The vapour still hot after switching off must condense, otherwise it would leave into the room.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.order.4',
            q: Q('Distiliatas surinktas, jo reikia aprašyti ir įvertinti.', 'The distillate is collected and has to be recorded and judged.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['išmatuoti distiliato tūrį matavimo cilindru', 'measure the volume of the distillate with the graduated cylinder'],
              ['ant refraktometro stikliuko užlašinti kelis lašus distiliato', 'put a few drops of distillate on the refractometer glass'],
              ['paspausti mygtuką ir nuskaityti lūžio rodiklį', 'press the button and read the refractive index'],
              ['gautą acetoną supilti į jam skirtą indą', 'pour the recovered acetone into its own container']
            ], t('Supylimas į bendrą indą daromas paskutinis.', 'Pouring into a shared container comes last.'),
              t('Tūris matuojamas dar nesupylus, nes tada žinoma išeiga; po to nustatomas lūžio rodiklis, o tik tada skystis supilamas.', 'The volume is measured before pouring away because it gives the yield; the refractive index follows, and only then is the liquid poured away.'))],
            why: t('Matavimai daromi su visu distiliatu, kol jo dar nesupylėte į bendrą indą, kuriame jis susimaišytų su kitu acetonu.', 'The measurements are done on the distillate before it is poured into a shared container where it would mix with other acetone.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.order.5',
            q: Q('Darbas baigtas, laboratorinis stalas turi būti sutvarkytas.', 'The work is finished and the bench must be tidied.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['palaukti, kol aparatūra atvės', 'wait for the apparatus to cool'],
              ['išardyti aparatūrą', 'take the apparatus apart'],
              ['likutį ir pradinę frakciją supilti į atliekų indą', 'pour the residue and the forerun into the waste container'],
              ['priemones sudėti į joms skirtas vietas', 'put the equipment back in its places']
            ], t('Karštos aparatūros ardyti negalima.', 'Hot apparatus must not be taken apart.'),
              t('Pirmiausia leidžiama atvėsti, tada išmontuojama, atliekos pilamos į jų indą, o gerai sutvarkyti daiktai grąžinami į vietas.', 'It is allowed to cool, then dismantled, the waste goes into its container, and the cleaned items are returned.'))],
            why: t('Šiluma gali nudeginti, o atliekos neturi patekti į kanalizaciją.', 'Heat can burn, and waste must not reach the drain.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.order.6',
            q: Q('Stebima, kaip pagrindinė frakcija pradeda distiliuotis.', 'You watch how the main fraction begins to distil.'),
            steps: [ord(t('Išdėstykite įvykius tokia seka, kokia juos pamatysite.', 'Put the events in the order in which you will see them.'), [
              ['skystis kolboje užverda', 'the liquid in the flask boils'],
              ['garų žiedas kyla deflegmatoriumi', 'a ring of vapour climbs through the dephlegmator'],
              ['termometro rutuliukas sušlampa ir rodmuo greitai kyla', 'the thermometer bulb is wetted and the reading climbs fast'],
              ['į priimtuvą pradeda kristi pirmieji lašai', 'the first drops fall into the receiver'],
              ['rodmuo nusistovi ties 55–58 °C', 'the reading settles at 55–58 °C']
            ], t('Kol garai nepasiekė termometro, jis nerodo virimo temperatūros.', 'Until the vapour reaches the thermometer, it does not show the boiling point.'),
              t('Pirmiausia skystis verda, garų žiedas pakyla, apgaubia termometrą ir rodmuo greitai kyla; pradeda lašėti kondensatas, o rodmuo nusistovi ties virimo temperatūra.', 'First the liquid boils, the vapour ring rises and surrounds the thermometer and the reading climbs fast; condensate starts to drip and the reading levels off at the boiling point.'))],
            why: t('Pastovus rodmuo rodo, kad pasiekta pusiausvyra tarp skysčio ir garų ties v. t.', 'A steady reading shows that equilibrium between liquid and vapour has been reached at the boiling point.'),
            src: 'LW2 p2, p6'
          },
          {
            id: 'l2.order.7',
            q: Q('Lūžio rodiklis matuojamas refraktometru.', 'The refractive index is measured with a refractometer.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['nuvalyti matavimo stikliuką', 'wipe the measuring glass'],
              ['užlašinti kelis lašus tiriamo skysčio', 'apply a few drops of the liquid under test'],
              ['paspausti matavimo mygtuką', 'press the measuring button'],
              ['užrašyti ekrane rodomą skaičių', 'record the number on the screen'],
              ['stikliuką vėl nuvalyti', 'wipe the glass again']
            ], t('Prieš ir po matavimo paviršius turi būti švarus.', 'The surface must be clean before and after the measurement.'),
              t('Švarus stikliukas, lašai, mygtukas, užrašymas, paskui vėl valymas kitam skysčiui.', 'A clean glass, the drops, the button, the record, then cleaning again for the next liquid.'))],
            why: t('Net maža priemaiša ant stikliuko keičia rodiklį, todėl matuojama ant švaraus paviršiaus.', 'Even a small impurity on the glass shifts the value, so the measurement is made on a clean surface.'),
            src: 'LW2 p3'
          },
          {
            id: 'l2.order.8',
            q: Q('Kolba jau kaitinama, bet pamiršote įdėti virimo akmenukų.', 'The flask is already heating, but you forgot the boiling chips.'),
            steps: [ord(t('Išdėstykite veiksmus.', 'Put the actions in order.'), [
              ['išjungti kaitinimą', 'switch off the heating'],
              ['palaukti, kol skystis atvės žemiau virimo temperatūros', 'wait until the liquid cools below its boiling point'],
              ['įmesti keletą pemzos gabalėlių', 'add a few pieces of pumice'],
              ['vėl pradėti kaitinti', 'resume heating']
            ], t('Virimo akmenukų niekada neberiama į karštą skystį.', 'Boiling chips are never added to a hot liquid.'),
              t('Pašalinamas šilumos šaltinis, laukiama, kol skystis nebevirs, tada dedama ir kaitinama iš naujo.', 'The source of heat is removed, the liquid is allowed to stop boiling, then the chips go in and heating restarts.'))],
            why: t('Perkaitęs skystis be užuomazgų gali užvirti staigiai ir išsiveržti iš kolbos.', 'A superheated liquid without nucleation sites can boil suddenly and erupt from the flask.'),
            src: 'LW2 p2'
          }
        ]
      },
      // ---------------------------------------------------------------- why
      {
        id: 'l2.why',
        title: t('Kodėl taip daroma?', 'Why is this step done?'),
        mirrors: ['LW2.1', 'LW2.3', 'LW2.4', 'LW2.5', 'LW2.6'],
        bank: [
          {
            id: 'l2.why.1',
            q: Q('Į kolbą su skysčiu prieš kaitinant įdedama pemzos gabalėlių.', 'Pumice pieces are put into the flask with the liquid before heating.'),
            steps: [ch(t('Kokia jų paskirtis?', 'What is their purpose?'), [
              ['jų poruose yra oro, kuris tampa garų burbulų užuomazga ir virimas vyksta tolygiai', 'their pores hold air that seeds vapour bubbles, so boiling is smooth'],
              ['jie reaguoja su priemaišomis', 'they react with the impurities'],
              ['jie padidina skysčio virimo temperatūrą', 'they raise the boiling point of the liquid'],
              ['jie pagreitina garų kondensaciją', 'they speed up the condensation of the vapour']
            ], 0, t('Pagalvokite, kas laiko burbulus užsimegzti.', 'Think about what lets bubbles start to form.'),
              t('Pemzos poros turi oro; be jo skystis gali perkaisti virš v. t. ir staiga išsiveržti.', 'The pores of pumice hold air; without it the liquid can superheat above its boiling point and suddenly erupt.'))],
            why: t('Virimo akmenukai suteikia burbulams užuomazgų, todėl skystis verda tolygiai.', 'Boiling chips give bubbles nuclei, so the liquid boils evenly.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.why.2',
            q: Q('Termometro rutuliukas įstatomas ties atšakos apatiniu kraštu.', 'The thermometer bulb is placed level with the lower edge of the side arm.'),
            steps: [ch(t('Ką rodo termometras tokioje padėtyje?', 'What does the thermometer show in that position?'), [
              ['garų, išeinančių į kondensatorių, temperatūrą', 'the temperature of the vapour leaving for the condenser'],
              ['skysčio kolbos dugne temperatūrą', 'the temperature of the liquid at the flask bottom'],
              ['kaitinimo vonios temperatūrą', 'the temperature of the heating bath'],
              ['kambario temperatūrą', 'room temperature']
            ], 0, t('Kokios temperatūros mums reikia, kad nustatytume v. t.?', 'Which temperature do we need to find the boiling point?'),
              t('Virimo temperatūrą atitinka garai pusiausvyroje su skysčiu, todėl rutuliukas turi būti garų kelyje prie išėjimo.', 'The boiling point corresponds to vapour in equilibrium with the liquid, so the bulb must sit in the vapour path at the exit.'))],
            why: t('Per aukštai pastatytas termometras būtų šaltesnis už garus, per žemai – šlaptų nuo skysčio.', 'A thermometer set too high would read below the vapour; too low, it would be soaked by the liquid.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.why.3',
            q: Q('Į distiliavimo kolbą galima pilti ne daugiau kaip du trečdalius jos tūrio.', 'No more than two thirds of the flask volume may be filled.'),
            steps: [ch(t('Kodėl?', 'Why?'), [
              ['užverdantis skystis putoja ir gali būti permestas į kondensatorių', 'the boiling liquid foams and may be thrown over into the condenser'],
              ['kad aparatas būtų lengvesnis', 'so that the apparatus is lighter'],
              ['kad pemza geriau tirptų', 'so that the pumice dissolves better'],
              ['kad termometras rodytų aukštesnę temperatūrą', 'so that the thermometer reads a higher temperature']
            ], 0, t('Kas dedasi virš verdančio skysčio paviršiaus?', 'What happens above the surface of a boiling liquid?'),
              t('Verdant kyla burbulai ir purslai; laisvas tūris sulaiko juos nuo patekimo į kondensatorių.', 'Bubbles and spray rise while boiling; free volume keeps them from reaching the condenser.'))],
            why: t('Laisvas kolbos tūris saugo, kad neišsiveržtų neišgrynintas skystis į distiliatą.', 'The free flask volume prevents unpurified liquid from reaching the distillate.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.why.4',
            q: Q('Vanduo į Lybigo kondensatorių įleidžiamas per apatinę atšakėlę, o išteka per viršutinę.', 'Water enters the Liebig condenser through the lower connection and leaves through the upper one.'),
            steps: [ch(t('Kodėl taip?', 'Why this way?'), [
              ['kad apvalkalas visada būtų pilnas vandens ir srautas eitų priešinga garams kryptimi', 'so the jacket always stays full of water and the flow runs against the vapour'],
              ['kad vanduo pats virtų', 'so that the water boils itself'],
              ['kad garai greičiau kiltų aukštyn', 'so that the vapour rises faster'],
              ['kad nereikėtų šlangelių', 'so that no hoses are needed']
            ], 0, t('Kur kondensatoriuje pirmiausia atsiduria vanduo, kai jis įteka iš viršaus?', 'Where does water collect first if it came in from the top?'),
              t('Įleidžiant iš apačios, vanduo užpildo visą apvalkalą ir šalčiausias vanduo susiduria su jau atvėsusiais garais.', 'With the inlet at the bottom the water fills the whole jacket, and the coldest water meets the already cooled vapour.'))],
            why: t('Priešsrovis yra efektyviausias šilumos mainams, o pilnas apvalkalas vėsina visą vamzdį.', 'Counter-current flow gives the most efficient heat exchange, and a full jacket cools the entire tube.'),
            src: 'LW2 p5'
          },
          {
            id: 'l2.why.5',
            q: Q('Distiliuojama ne iki sausumo: kolboje paliekama apie 1–2 ml skysčio.', 'The liquid is not distilled to dryness: about 1–2 ml are left in the flask.'),
            steps: [ch(t('Kodėl?', 'Why?'), [
              ['sausame likutyje gali būti nestabilių, sprogių ar pavojingų junginių, o kolba gali įskilti', 'a dry residue may hold unstable or explosive compounds and the flask may crack'],
              ['kad paskutiniai lašai neapgadintų termometro', 'so that the last drops do not damage the thermometer'],
              ['kad būtų daugiau distiliato', 'to get more distillate'],
              ['kad sumažėtų acetono v. t.', 'to lower the boiling point of acetone']
            ], 0, t('Kas koncentruojasi kolboje distiliuojant?', 'What becomes concentrated in the flask during distillation?'),
              t('Kolboje lieka nelakios priemaišos; jas išdžiovinus gali kilti pavojus.', 'The non-volatile impurities remain in the flask; drying them out can be hazardous.'))],
            why: t('Nepasiekus sausumo išvengiama pavojingų likučių ir įskilusio stiklo.', 'Stopping short of dryness avoids hazardous residues and cracked glass.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.why.6',
            q: Q('Kaitinimas parinktas taip, kad kas sekundę nukristų 1–2 lašai, bet ne daugiau.', 'The heating is set so that one or two drops fall every second, not more.'),
            steps: [ch(t('Kokia to priežastis?', 'What is the reason?'), [
              ['esant lėtam srautui kolonoje spėja nusistovėti skysčio ir garų pusiausvyra', 'at a slow flow, liquid–vapour equilibrium has time to set up in the column'],
              ['greitas distiliavimas keičia acetono struktūrą', 'fast distillation changes the structure of acetone'],
              ['kad kondensatorius nesušiltų', 'so that the condenser does not warm up'],
              ['kad termometras būtų švarus', 'so that the thermometer stays clean']
            ], 0, t('Kolonoje garai ir skystis turi spėti pasikeisti.', 'In the column the vapour and liquid need time to exchange.'),
              t('Lėtai distiliuojant daug garinimo ir kondensavimo ciklų ir geriau išsiskiria komponentai; per greitai garai praeina nesuskirstyti.', 'Slow distilling allows many vaporisation and condensation cycles and a better separation; too fast and the vapour passes unseparated.'))],
            why: t('Frakcinio skyrimo geba priklauso nuo ciklų skaičiaus, o jį riboja lašėjimo greitis.', 'The separating power of fractional distillation depends on the number of cycles, which the dripping rate limits.'),
            src: 'LW2 p2, p6'
          },
          {
            id: 'l2.why.7',
            q: Q('Pirmieji 1–3 ml distiliato surenkami į kitą indą ir nepridedami prie pagrindinės frakcijos.', 'The first 1–3 ml of distillate go into another vessel and are not added to the main fraction.'),
            steps: [ch(t('Kodėl?', 'Why?'), [
              ['jie turi lakesnių priemaišų ir dar nepasiekta pastovi temperatūra', 'it holds more volatile impurities and the temperature has not yet become steady'],
              ['jie yra švariausias acetonas', 'it is the purest acetone'],
              ['jie sudaryti iš vandens', 'it consists of water'],
              ['jie padeda nustatyti lūžio rodiklį', 'it helps to determine the refractive index']
            ], 0, t('Kas distiliuojasi pirmiau už pagrindinį komponentą?', 'What distils ahead of the main component?'),
              t('Lakesni komponentai atsiskiria pirmi; pradinė frakcija jų ir turi.', 'More volatile components leave first; the forerun contains them.'))],
            why: t('Pradinė frakcija pašalina mažiausiai virią priemaišą, todėl pagrindinė frakcija lieka grynesnė.', 'The forerun removes the lowest-boiling impurity, so the main fraction stays purer.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.why.8',
            q: Q('Distiliuojant dietileterį naudojama ne liepsna, o karšta vandens vonia.', 'Diethyl ether is distilled with a hot water bath, not a flame.'),
            steps: [ch(t('Kodėl vonia, o ne liepsna?', 'Why a bath and not a flame?'), [
              ['eteris labai lakus ir degus, o vonia neviršija saugios temperatūros', 'ether is very volatile and flammable, and a bath cannot exceed a safe temperature'],
              ['vandens vonia padidina slėgį', 'a water bath increases the pressure'],
              ['eteris reaguoja su ugnimi ir susidaro acetonas', 'ether reacts with a flame to give acetone'],
              ['liepsna nuspalvintų eterį', 'a flame would colour the ether']
            ], 0, t('Kokia yra eterio virimo temperatūra ir koks pavojus?', 'What is the boiling point of ether and what is the hazard?'),
              t('Eteris verda žemoje temperatūroje, jo garai lengvai užsidega. Vonia leidžia nustatyti temperatūrą apie 20–25 °C virš v. t.', 'Ether boils at a low temperature and its vapour ignites easily. A bath allows a temperature about 20–25 °C above its boiling point.'))],
            why: t('Šildymo šaltinis parenkamas pagal skysčio v. t. ir degumą.', 'The heat source is chosen by the boiling point and flammability of the liquid.'),
            src: 'LW2 p2',
            claims: [{ formula: ['CCOCC', 'C4H10O'] }]
          }
        ]
      },
      // ---------------------------------------------------------------- observe
      {
        id: 'l2.observe',
        title: t('Ką pamatysite?', 'What would you observe?'),
        mirrors: ['LW2.3', 'LW2.5', 'LW2.6'],
        bank: [
          {
            id: 'l2.observe.1',
            q: Q('Skystis kaitinamas be virimo akmenukų.', 'A liquid is heated without boiling chips.'),
            steps: [ch(t('Ką galite pamatyti?', 'What may you see?'), [
              ['skystis perkaista ir staiga užverda, išmesdamas dalį turinio', 'the liquid superheats and suddenly boils, throwing out part of the contents'],
              ['skystis niekada neužverda', 'the liquid never boils'],
              ['skystis verda lygiai, kaip ir su akmenukais', 'the liquid boils evenly, just as with chips'],
              ['termometras rodo žemesnę nei kambario temperatūrą', 'the thermometer shows below room temperature']
            ], 0, t('Kas valdo burbulų atsiradimą skystyje?', 'What controls the start of bubbles in a liquid?'),
              t('Be užuomazgų skystis gali būti perkaitintas; išsiveržimas yra nenuspėjamas.', 'Without nuclei the liquid can superheat; the eruption is unpredictable.'))],
            why: t('Burbulų užuomazgos garantuoja tolygų virimą.', 'Bubble nuclei guarantee smooth boiling.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.observe.2',
            q: Q('Termometras pakeltas gerokai virš atšakos apatinio krašto.', 'The thermometer sits well above the lower edge of the side arm.'),
            steps: [ch(t('Ką parodys termometras?', 'What will the thermometer show?'), [
              ['žemesnę temperatūrą nei tikroji garų temperatūra', 'a lower temperature than the true vapour temperature'],
              ['aukštesnę nei kaitinimo vonios temperatūra', 'a higher temperature than the bath'],
              ['lygiai tikrąją v. t.', 'exactly the true boiling point'],
              ['nieko, nes stiklas nepraleidžia šilumos', 'nothing, because glass does not conduct heat']
            ], 0, t('Ar garai pasiekia rutuliuką?', 'Do the vapours reach the bulb?'),
              t('Garai nepakyla iki termometro arba atvėsta, todėl jis rodo per mažai.', 'The vapour does not rise to the thermometer or cools on the way, so it reads too low.'))],
            why: t('Termometro padėtis nustato, ar matuojama garų temperatūra, ar kažkas kita.', 'The thermometer position decides whether the vapour temperature or something else is being measured.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.observe.3',
            q: Q('Kolba kaitinama per stipriai: lašai krenta greičiau nei 5 per sekundę.', 'The flask is heated too strongly: more than five drops fall per second.'),
            steps: [ch(t('Kas nutiks?', 'What will happen?'), [
              ['skyrimas pablogės, nes garai praeina kolona nenusistovėjus pusiausvyrai', 'separation gets worse, because vapour passes through the column before equilibrium is reached'],
              ['distiliatas taps grynesnis', 'the distillate becomes purer'],
              ['acetonas virs vandeniu', 'acetone turns into water'],
              ['termometras kris', 'the thermometer falls']
            ], 0, t('Kolonoje reikia laiko.', 'The column needs time.'),
              t('Kolonoje nespėja vykti daug garinimo ir kondensavimo ciklų, todėl distiliate daugiau priemaišų.', 'Not enough cycles take place in the column, so the distillate contains more impurities.'))],
            why: t('Per greitas kaitinimas sumažina frakcinio skyrimo efektyvumą.', 'Heating too fast lowers the efficiency of the fractional separation.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.observe.4',
            q: Q('Pagrindinė frakcija jau surinkta, o kolboje dar lieka aukštesnės v. t. priemaišų.', 'The main fraction is collected and the flask still holds higher-boiling impurities.'),
            steps: [ch(t('Kaip pasikeis termometro rodmuo, jei toliau kaitinsite?', 'How will the reading change if you keep heating?'), [
              ['pakils virš acetono intervalo, nes pradės garuoti aukštesnės v. t. komponentas', 'it will rise above the acetone range as a higher-boiling component starts to vaporise'],
              ['nukris žemiau 40 °C', 'it will fall below 40 °C'],
              ['liks lygiai 56 °C amžinai', 'it will stay exactly 56 °C forever'],
              ['pradės svyruoti dėl gyvsidabrio garų', 'it will oscillate because of mercury vapour']
            ], 0, t('Kas distiliuojasi po acetono?', 'What distils after acetone?'),
              t('Kai acetonas išgaruoja, temperatūra kyla į aukštesnio v. t. komponento intervalą; tai ženklas stabdyti.', 'When the acetone has gone, the temperature climbs towards the range of the higher-boiling component; that is the signal to stop.'))],
            why: t('Temperatūros šuolis rodo, kad prasideda kita frakcija.', 'A jump in temperature shows that the next fraction is starting.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.observe.5',
            q: Q('Renkant pagrindinę frakciją termometras ilgai rodo maždaug 56 °C.', 'The main fraction is being collected and the thermometer shows about 56 °C for a long time.'),
            steps: [ch(t('Ką tai byloja?', 'What does it indicate?'), [
              ['distiliuojasi beveik viena medžiaga, v. t. artima acetono', 'practically one substance is distilling, with a boiling point close to that of acetone'],
              ['kolba perkaista', 'the flask is overheating'],
              ['kondensatorius užsikimšo', 'the condenser is blocked'],
              ['distiliavimą reikia tuoj pat nutraukti', 'the distillation must be stopped at once']
            ], 0, t('Ar kintanti temperatūra liudytų grynumą?', 'Would a changing temperature suggest purity?'),
              t('Pastovi temperatūra intervale 1–2 °C rodo, kad distiliuojasi beveik gryna medžiaga.', 'A constant temperature within 1–2 °C shows that an almost pure substance is distilling.'))],
            why: t('Gryna medžiaga (ar azeotropas) verda pastovioje temperatūroje, įprastas mišinys – temperatūrų intervale.', 'A pure substance (or an azeotrope) boils at constant temperature; an ordinary mixture over a range.'),
            src: 'LW2 p2, p6'
          },
          {
            id: 'l2.observe.6',
            q: Q('Kondensatoriaus vanduo užsukamas, bet kolba toliau kaitinama.', 'The condenser water is turned off while the flask is still heated.'),
            steps: [ch(t('Ką pamatysite?', 'What will you notice?'), [
              ['garai nesikondensuoja ir išeina pro priimtuvą, o jų kvapas plinta patalpoje', 'the vapour does not condense and escapes past the receiver, its smell spreading in the room'],
              ['distiliatas bus grynesnis', 'the distillate will be purer'],
              ['termometras nustos veikti', 'the thermometer will stop working'],
              ['kolba atvės', 'the flask will cool']
            ], 0, t('Kam skirtas kondensatorius?', 'What is the condenser for?'),
              t('Be vėsinimo garai lieka dujiniai; acetonas pavojingas degumu.', 'Without cooling the vapour stays gaseous; acetone is hazardous because it burns.'))],
            why: t('Vėsinimas yra distiliavimo dalis: be jo skystis netenkamas.', 'Cooling is part of distillation: without it the liquid is lost.'),
            src: 'LW2 p5'
          },
          {
            id: 'l2.observe.7',
            q: Q('Ta pati medžiaga distiliuojama sumažintu slėgiu (vakuume).', 'The same substance is distilled at reduced pressure (under vacuum).'),
            steps: [ch(t('Kaip pasikeis jos virimo temperatūra?', 'How does its boiling temperature change?'), [
              ['sumažės', 'it decreases'],
              ['padidės', 'it increases'],
              ['nepakis', 'it does not change'],
              ['taps lygi nuliui', 'it becomes zero']
            ], 0, t('Skystis verda, kai garų slėgis lygus išoriniam.', 'A liquid boils when its vapour pressure equals the external pressure.'),
              t('Skystis verda, kai jo garų slėgis tampa lygus išoriniam; kai išorinis slėgis mažesnis, tai įvyksta žemesnėje temperatūroje. Perpus sumažinus slėgį, v. t. krenta apie 15–20 °C.', 'A liquid boils when its vapour pressure equals the external pressure; at lower external pressure this happens at a lower temperature. Halving the pressure lowers the b. p. by about 15–20 °C.'))],
            why: t('Vakuuminis distiliavimas apsaugo jautrias medžiagas nuo skilimo.', 'Vacuum distillation protects sensitive compounds from decomposition.'),
            src: 'LW2 p4'
          },
          {
            id: 'l2.observe.8',
            q: Q('Distiliuojamas etanolio ir vandens mišinys, kuriame yra 90 % etanolio. Kolonoje pakanka teorinių lėkštelių.', 'Ethanol–water of 90 % ethanol is distilled. The column has plenty of theoretical plates.'),
            steps: [ch(t('Kokio produkto galima tikėtis distiliate?', 'What can you expect in the distillate?'), [
              ['apie 95,5 % etanolio azeotropo, bet ne 100 % etanolio', 'about 95.5 % ethanol azeotrope, but not 100 % ethanol'],
              ['100 % etanolio', '100 % ethanol'],
              ['gryno vandens', 'pure water'],
              ['abiejų skysčių atskirų frakcijų, kiekviena grynesnė už 99 %', 'separate fractions of both liquids, each purer than 99 %']
            ], 0, t('Kaip elgiasi azeotropo garai?', 'How does the vapour of an azeotrope behave?'),
              t('Azeotropo garai ir skystis sudėtimi sutampa, todėl frakcine distiliacija toliau nesuskaidoma.', 'The vapour and liquid of an azeotrope have the same composition, so fractional distillation cannot go further.'))],
            why: t('Absoliutų etanolį gauname tik vandenį susiejus chemiškai, pavyzdžiui, su $CaO$.', 'Absolute ethanol is obtained only by binding the water chemically, for example with $CaO$.'),
            src: 'LW2 p4'
          }
        ]
      },
      // ---------------------------------------------------------------- prove
      {
        id: 'l2.prove',
        title: t('Ką įrodo stebėjimas?', 'What does the observation prove?'),
        mirrors: ['LW2.2', 'LW2.5', 'LW2.6', 'LW2.7'],
        bank: [
          {
            id: 'l2.prove.1',
            q: Q('Pagrindinė frakcija distiliavosi 55–57 °C intervale.', 'The main fraction distilled over the range 55–57 °C.'),
            steps: [ch(t('Kokia išvada pagrįsta?', 'Which conclusion is supported?'), [
              ['frakcija praktiškai gryna, nes siaurame intervale distiliavosi viena medžiaga', 'the fraction is practically pure, since one substance distilled in a narrow range'],
              ['frakcija tikrai 100 % gryna', 'the fraction is certainly 100 % pure'],
              ['frakcijoje daug vandens', 'the fraction contains much water'],
              ['aparatūra nesandari', 'the apparatus leaks']
            ], 0, t('Ką rodo siauras virimo intervalas ir ko jis neįrodo?', 'What does a narrow boiling range show, and what does it not prove?'),
              t('Praktiškai grynu laikomas skystis, kuris distiliuojasi 1–2 °C intervale; dar ne 100 %.', 'A liquid distilling over 1–2 °C counts as practically pure, not necessarily 100 %.'))],
            why: t('Siauras intervalas yra grynumo požymis, bet ne griežtas įrodymas.', 'A narrow range is an indication of purity, not a strict proof.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.prove.2',
            q: Q('Distiliato lūžio rodiklis $n_D^20$ lygus 1,359.', 'The refractive index of the distillate $n_D^20$ is 1.359.'),
            steps: [ch(t('Ką tai rodo?', 'What does it show?'), [
              ['atitinka gryną acetoną, bet vienas rodiklis neatskiria nuo panašaus rodiklio medžiagų', 'it matches pure acetone, but alone it cannot rule out compounds with a similar value'],
              ['distiliate tikrai yra vandens', 'the distillate certainly contains water'],
              ['distiliavimas buvo per greitas', 'the distillation was too fast'],
              ['kolba netinkama', 'the flask is unsuitable']
            ], 0, t('Ar kitos medžiagos gali turėti panašų rodiklį?', 'Could other compounds have a similar value?'),
              t('Rodiklis papildo v. t.; pavyzdžiui, etanolio rodiklis 1,361 labai artimas acetono.', 'The index complements the boiling point; for example the value for ethanol, 1.361, is very close to acetone.'))],
            why: t('Du nepriklausomi dydžiai (v. t. ir $n$) kartu įtikinamesni už vieną.', 'Two independent quantities (boiling point and $n$) are more convincing together than one.'),
            src: 'LW2 p3'
          },
          {
            id: 'l2.prove.3',
            q: Q('Distiliato $n_D^20$ lygus 1,349, o gryno acetono – 1,359.', 'The distillate has $n_D^20$ of 1.349 while pure acetone has 1.359.'),
            steps: [ch(t('Kokia tikriausia priežastis?', 'What is the likeliest cause?'), [
              ['distiliate yra vandens', 'the distillate contains water'],
              ['distiliatas grynesnis už gryną acetoną', 'the distillate is purer than pure acetone'],
              ['termometras rodė per mažai', 'the thermometer read too low'],
              ['lūžio rodiklis nepriklauso nuo sudėties', 'the refractive index does not depend on composition']
            ], 0, t('Kuris skystis turi mažesnį rodiklį: acetonas ar vanduo?', 'Which liquid has the lower index, acetone or water?'),
              t('Vandens $n$ apie 1,333, mažesnis už acetono; vandens priemaiša sumažina mišinio rodiklį.', 'Water has $n$ of about 1.333, lower than acetone; water as an impurity lowers the value of the mixture.'))],
            why: t('Lūžio rodiklis svertinis pagal sudėtį, todėl kelia klausimą apie priemaišą.', 'The refractive index is weighted by composition, so a shift points to an impurity.'),
            src: 'LW2 p3, Klein'
          },
          {
            id: 'l2.prove.4',
            q: Q('Distiliuojant temperatūra nuolat didėja ir nesustoja ties jokia verte.', 'During the distillation the temperature keeps climbing and never levels off at any value.'),
            steps: [ch(t('Ką tai rodo?', 'What does it show?'), [
              ['distiliuojamas mišinys, kurio komponentų v. t. skiriasi', 'a mixture is distilling, with components of different boiling points'],
              ['distiliuojama gryna medžiaga', 'a pure substance is distilling'],
              ['distiliuojamas azeotropas', 'an azeotrope is distilling'],
              ['kondensatorius veikia gerai', 'the condenser works well']
            ], 0, t('Kuri medžiaga verda pastovioje temperatūroje?', 'Which kind of sample boils at constant temperature?'),
              t('Kintanti temperatūra rodo, kad sudėtis nuolat keičiasi.', 'A changing temperature shows that the composition keeps changing.'))],
            why: t('Pastovumas rodo vienalytį junginį ar azeotropą, kitimas – mišinį.', 'Constancy shows a homogeneous compound or an azeotrope, change a mixture.'),
            src: 'LW2 p2'
          },
          {
            id: 'l2.prove.5',
            q: Q('Etanolio ir vandens mišinys distiliuojasi pastovioje 78,15 °C temperatūroje, o distiliate yra 95,5 % etanolio.', 'An ethanol–water mixture distils at a constant 78.15 °C, and the distillate holds 95.5 % ethanol.'),
            steps: [mu(t('Kurie teiginiai teisingi? Pažymėkite visus.', 'Which statements are correct? Pick all.'), [
              ['tai azeotropinis mišinys', 'it is an azeotropic mixture'],
              ['frakcinis distiliavimas čia negali pasiekti 100 % etanolio', 'fractional distillation cannot reach 100 % ethanol here'],
              ['pastovi temperatūra įrodo, kad distiliatas gryna medžiaga', 'the constant temperature proves the distillate is a pure compound'],
              ['vandenį galima pašalinti chemiškai, pavyzdžiui, su $CaO$', 'the water can be removed chemically, for instance with $CaO$']
            ], [0, 1, 3], t('Ar pastovi temperatūra visada reiškia vieną junginį?', 'Does constant temperature always mean one compound?'),
              t('Azeotropas verda pastoviai, bet sudėtis nepasikeičia, todėl frakcija nėra vienas junginys. Tada vanduo surišamas chemiškai.', 'An azeotrope boils steadily but its composition does not change, so the fraction is not a single compound. The water is then bound chemically.'))],
            why: t('Pastovi v. t. būtina, bet ne pakankama grynumo sąlyga.', 'A constant boiling point is necessary but not sufficient for purity.'),
            src: 'LW2 p4',
            claims: [{ formula: [ETOH, 'C2H6O'] }]
          },
          {
            id: 'l2.prove.6',
            q: Q('Pagrindinei frakcijai pasibaigus, temperatūra staiga pakyla virš 58 °C.', 'After the main fraction, the temperature suddenly climbs above 58 °C.'),
            steps: [ch(t('Ką daryti ir kodėl?', 'What to do and why?'), [
              ['nutraukti distiliavimą, nes acetonas jau nudistiliuotas ir kolboje liko aukštesnės v. t. medžiagos', 'stop, since the acetone has distilled and higher-boiling substances remain in the flask'],
              ['dar stipriau kaitinti', 'heat harder'],
              ['pakeisti kondensatorių', 'replace the condenser'],
              ['pilti į kolbą daugiau skysčio', 'pour more liquid into the flask']
            ], 0, t('Kas dar išsiskirs, jei tęsite?', 'What would still come over if you continued?'),
              t('Viršijus acetono intervalą, į priimtuvą pateks priemaišos, tad distiliavimas baigiamas.', 'Above the acetone range impurities would enter the receiver, so the distillation is ended.'))],
            why: t('Temperatūros šuolis yra nutraukimo kriterijus.', 'The jump in temperature is the criterion for stopping.'),
            src: 'LW2 p6'
          },
          {
            id: 'l2.prove.7',
            q: Q('Nustatyta nežinomo skysčio v. t. 78 °C, bet lentelėje nurodyta 80,5 °C esant 760 mm Hg. Šiandien slėgis apie 700 mm Hg.', 'An unknown liquid boils at 78 °C, but the table says 80.5 °C at 760 mm Hg. Today the pressure is about 700 mm Hg.'),
            steps: [ch(t('Kuris paaiškinimas tinka?', 'Which explanation fits?'), [
              ['mažesnis slėgis sumažina v. t., todėl skirtumas gali būti natūralus', 'a lower pressure lowers the boiling point, so the difference may be natural'],
              ['skystis tikrai kita medžiaga', 'the liquid is certainly another compound'],
              ['termometras negali rodyti 78 °C', 'a thermometer cannot show 78 °C'],
              ['skystis pernelyg grynas', 'the liquid is too pure']
            ], 0, t('Lentelės vertė galioja tam tikram slėgiui.', 'The table value applies to a given pressure.'),
              t('V. t. priklauso nuo slėgio, todėl kelių laipsnių skirtumas esant skirtingam slėgiui nieko neįrodo.', 'The boiling point depends on pressure, so a difference of a few degrees at another pressure proves nothing.'))],
            why: t('Palyginimui reikia pažymėti slėgį.', 'For comparison the pressure must be stated.'),
            src: 'LW2 p1'
          },
          {
            id: 'l2.prove.8',
            q: Q('Distiliate pastebimai matyti du sluoksniai.', 'Two layers are clearly visible in the distillate.'),
            steps: [ch(t('Ką tai rodo?', 'What does it show?'), [
              ['distiliatas nėra vienalytis, jame yra netirpios priemaišos', 'the distillate is not homogeneous, it contains an immiscible impurity'],
              ['distiliatas labai gryna medžiaga', 'the distillate is a very pure substance'],
              ['kondensatorius per šaltas', 'the condenser is too cold'],
              ['lūžio rodiklis tikrai 1,359', 'the refractive index is certainly 1.359']
            ], 0, t('Ar gryna vienalytė medžiaga gali sudaryti du sluoksnius?', 'Can a pure homogeneous substance form two layers?'),
              t('Du sluoksniai reiškia dvi nesimaišančias fazes, vadinasi, mišinys.', 'Two layers mean two immiscible phases, so a mixture.'))],
            why: t('Vienalytis skystis turi vieną fazę.', 'A homogeneous liquid has one phase.'),
            src: 'LW2 p2'
          }
        ]
      },
      // ---------------------------------------------------------------- apparatus
      {
        id: 'l2.apparatus',
        title: t('Prietaisų atpažinimas pagal aprašą', 'Identifying apparatus from a description'),
        mirrors: ['LW2.3', 'LW2.4', 'LW2.7'],
        bank: [
          {
            id: 'l2.apparatus.1',
            q: Q('Apvaliadugnė kolba, kurios kaklelyje yra šoninė atšaka, nukreipta žemyn į kondensatorių.', 'A round-bottom flask with a side arm in its neck pointing down towards the condenser.'),
            steps: [ch(t('Kas tai?', 'What is it?'), [
              ['Viurco kolba', 'Wurtz flask'],
              ['Erlenmejerio kolbutė', 'Erlenmeyer flask'],
              ['matavimo cilindras', 'graduated cylinder'],
              ['lašinamasis piltuvas', 'dropping funnel']
            ], 0, t('Kokiam tikslui skirta šoninė atšaka?', 'What is the side arm for?'),
              t('Tai Viurco kolba (distiliavimo kolba su atšaka), kuria garai nuvedami į kondensatorių.', 'This is a Wurtz flask (a distillation flask with a side arm) that leads the vapour to the condenser.'))],
            why: t('Atšaka garams nukreipti – esminė paprastojo distiliavimo detalė.', 'The side arm for the vapour is the key part of a simple distillation set.'),
            src: 'LW2 p1'
          },
          {
            id: 'l2.apparatus.2',
            q: Q('Tiesus stiklinis vamzdis, apsuptas išorinio apvalkalo, kurio apatinėje ir viršutinėje atšakėlėse jungiamos šlangelės.', 'A straight glass tube surrounded by an outer jacket with hose connections at the lower and upper ends.'),
            steps: [ch(t('Koks tai prietaisas?', 'What is this device?'), [
              ['Lybigo kondensatorius', 'Liebig condenser'],
              ['deflegmatorius', 'dephlegmator'],
              ['refraktometras', 'refractometer'],
              ['rotacinis garintuvas', 'rotary evaporator']
            ], 0, t('Kur teka vanduo?', 'Where does the water flow?'),
              t('Tai Lybigo kondensatorius: vandens apvalkalas vėsina vidinį vamzdį, ir garai virsta skysčiu.', 'This is a Liebig condenser: the water jacket cools the inner tube and the vapour turns into liquid.'))],
            why: t('Kondensatorius sukondensuoja garus į distiliatą.', 'The condenser turns the vapour into distillate.'),
            src: 'LW2 p1'
          },
          {
            id: 'l2.apparatus.3',
            q: Q('Vertikali kolona tarp kolbos ir kondensatoriaus, kurioje dalis garų kondensuojasi ir grįžta žemyn.', 'A vertical column between flask and condenser in which part of the vapour condenses and runs back down.'),
            steps: [ch(t('Kas tai?', 'What is it?'), [
              ['deflegmatorius (rektifikavimo kolona)', 'dephlegmator (rectifying column)'],
              ['Viurco atšaka', 'Wurtz side arm'],
              ['priimtuvas', 'receiver'],
              ['metalinis žiedas', 'metal ring']
            ], 0, t('Kuri dalis padaro distiliavimą frakcinį?', 'Which part makes the distillation fractional?'),
              t('Deflegmatorius įrengiamas tarp kolbos ir kondensatoriaus; joje daug kartų vyksta garinimas ir kondensavimas.', 'The dephlegmator sits between flask and condenser; vaporisation and condensation repeat many times in it.'))],
            why: t('Šis papildomas elementas skiria frakcinį nuo paprastojo distiliavimo.', 'This extra element distinguishes fractional from simple distillation.'),
            src: 'LW2 p3'
          },
          {
            id: 'l2.apparatus.4',
            q: Q('Į vieną įrenginį sujungta distiliavimo kolba, deflegmatorius ir šoninė atšaka.', 'A distillation flask, dephlegmator and side arm are joined into one piece.'),
            steps: [ch(t('Koks tai prietaisas?', 'What is it?'), [
              ['Favorskio kolba', 'Favorsky flask'],
              ['Lybigo kondensatorius', 'Liebig condenser'],
              ['Erlenmejerio kolbutė', 'Erlenmeyer flask'],
              ['rotacinis garintuvas', 'rotary evaporator']
            ], 0, t('Jis pakeičia kelias atskiras dalis viena.', 'It replaces several separate parts with one.'),
              t('Tai Favorskio kolba, naudojama frakciniam distiliavimui.', 'This is the Favorsky flask used for fractional distillation.'))],
            why: t('Be jos imama atskira kolba su atšakos adapteriu ir deflegmatoriumi.', 'Without it, a separate flask with a side-arm adapter and a dephlegmator is used.'),
            src: 'LW2 p3, p5'
          },
          {
            id: 'l2.apparatus.5',
            q: Q('Kūgio formos stiklinė kolbutė su siauru kakleliu, kurioje renkamas distiliatas.', 'A conical glass flask with a narrow neck, used to collect the distillate.'),
            steps: [ch(t('Koks tai indas?', 'What vessel is it?'), [
              ['Erlenmejerio kolbutė', 'Erlenmeyer flask'],
              ['Favorskio kolba', 'Favorsky flask'],
              ['matavimo cilindras', 'graduated cylinder'],
              ['deflegmatorius', 'dephlegmator']
            ], 0, t('Kuris indas turi kūgišką korpusą?', 'Which vessel has a conical body?'),
              t('Tai Erlenmejerio kolbutė, priimtuvas po kondensatoriaus snapeliu.', 'This is an Erlenmeyer flask, the receiver under the condenser tip.'))],
            why: t('Priimtuvas turi sulaikyti sukondensuotą skystį.', 'The receiver holds the condensed liquid.'),
            src: 'LW2 p5'
          },
          {
            id: 'l2.apparatus.6',
            q: Q('Besisukanti kolba šildomoje vonioje, sujungta su vakuumu, ir stiklinis kondensatorius, o priimtuvas prijungtas apačioje.', 'A flask rotating in a heated bath, connected to a vacuum, with a glass condenser and a receiver at the bottom.'),
            steps: [ch(t('Kas tai?', 'What is it?'), [
              ['vakuuminis rotacinis garintuvas', 'vacuum rotary evaporator'],
              ['paprastasis distiliavimo prietaisas', 'a simple distillation set'],
              ['refraktometras', 'refractometer'],
              ['oro kondensatorius', 'air condenser']
            ], 0, t('Kokiai atliekai ar tirpikliui jis skirtas?', 'What is it used for?'),
              t('Tai vakuuminis rotacinis garintuvas, tirpikliams nugarinti iš ekstrakto; besisukanti kolba didina paviršių.', 'This is a vacuum rotary evaporator, used to remove solvent from an extract; the rotating flask enlarges the surface.'))],
            why: t('Sumažintas slėgis ir sukimasis leidžia išgarinti greitai ir žemoje temperatūroje.', 'Reduced pressure and rotation allow fast evaporation at low temperature.'),
            src: 'LW2 p1, p4'
          },
          {
            id: 'l2.apparatus.7',
            q: Q('Prietaisas su matavimo stikliuku: užlašinus skysčio ir paspaudus mygtuką, ekrane rodomas skaičius apie 1,36.', 'A device with a measuring glass: after applying a drop of liquid and pressing a button, the screen shows a number about 1.36.'),
            steps: [ch(t('Ką jis matuoja?', 'What does it measure?'), [
              ['lūžio rodiklį (refraktometras)', 'the refractive index (refractometer)'],
              ['tankį', 'the density'],
              ['virimo temperatūrą', 'the boiling point'],
              ['pH', 'the pH']
            ], 0, t('Koks dydis paprastai būna apie 1,3–1,5 organiniams skysčiams?', 'Which quantity is about 1.3–1.5 for organic liquids?'),
              t('Tai refraktometras: rodo lūžio rodiklį, apie 1,36 yra tipiška organinio skysčio vertė.', 'This is a refractometer: it displays the refractive index, about 1.36 being typical for an organic liquid.'))],
            why: t('Refraktometras reikalauja kelių lašų ir suteikia grynumo įvertį.', 'A refractometer needs only a few drops and gives an estimate of purity.'),
            src: 'LW2 p3'
          },
          {
            id: 'l2.apparatus.8',
            q: Q('Stiklo vamzdis be vandens apvalkalo, 12–16 mm skersmens.', 'A wide glass tube with no water jacket, 12–16 mm across.'),
            steps: [ch(t('Kokiai v. t. jis tinka?', 'For which boiling point is it suitable?'), [
              ['virš 160 °C', 'above 160 °C'],
              ['žemesnei kaip 120 °C', 'below 120 °C'],
              ['120–160 °C', '120–160 °C'],
              ['kambario temperatūrai', 'room temperature']
            ], 0, t('Kuo aukštesnė v. t., tuo mažiau reikia vandens.', 'The higher the boiling point, the less water is needed.'),
              t('Tai oro kondensatorius; naudojamas, kai v. t. aukštesnė kaip 160 °C, nes tokie garai per vamzdžio sieneles atvėsta ore.', 'This is an air condenser, used when the boiling point is above 160 °C, since such vapours cool in the air through the tube walls.'))],
            why: t('Vandens vėsinimas aukštos v. t. medžiagoms būtų per staigus ir stiklas gali įtrūkti.', 'Water cooling would be too abrupt for high-boiling substances, and the glass could crack.'),
            src: 'LW2 p2'
          }
        ]
      },
      // ---------------------------------------------------------------- calc
      {
        id: 'l2.calc',
        title: t('Skaičiavimai', 'Calculations'),
        mirrors: ['LW2.2', 'LW2.5', 'LW2.6', 'LW2.7'],
        gen(rng, ctx) {
          const fmt = (x, d) => x.toFixed(d);
          const lt = (x, d) => fmt(x, d).replace('.', ',');
          const variant = ctx.pick(['yield', 'fill', 'bath', 'rate', 'n', 'nclass']);

          if (variant === 'yield') {
            const V0 = ctx.pick([40, 45, 50, 55, 60, 80, 100]);
            const fore = ctx.int(1, 3);
            const main = ctx.int(Math.round(V0 * 0.45), Math.round(V0 * 0.85));
            const y = main / V0 * 100;
            const rest = V0 - fore - main;
            return {
              q: [{ p: t('Distiliavimui paimta ' + V0 + ' ml acetono atliekų. Pradinė frakcija sudarė ' + fore + ' ml, pagrindinė – ' + main + ' ml.',
                'For the distillation ' + V0 + ' ml of acetone waste was used. The forerun measured ' + fore + ' ml and the main fraction ' + main + ' ml.') }],
              steps: [
                { prompt: t('Kokia pagrindinės frakcijos išeiga (%)?', 'What is the yield of the main fraction (%)?'), kind: 'number', answer: { value: y, tol: 0.6 },
                  hint: t('Išeiga skaičiuojama nuo pradinio tūrio.', 'The yield is taken relative to the starting volume.'),
                  solution: t('$' + main + ' / ' + V0 + ' · 100 = ' + lt(y, 1) + '$ %.', '$' + main + ' / ' + V0 + ' · 100 = ' + fmt(y, 1) + '$ %.') },
                { prompt: t('Kiek ml skysčio nepateko nei į pradinę, nei į pagrindinę frakciją (likutis ir nuostoliai)?', 'How many ml went into neither the forerun nor the main fraction (residue and losses)?'), kind: 'number', answer: { value: rest, tol: 0.05 },
                  hint: t('Atimkite abi frakcijas iš pradinio tūrio.', 'Subtract both fractions from the starting volume.'),
                  solution: t('$' + V0 + ' − ' + fore + ' − ' + main + ' = ' + rest + '$ ml.', '$' + V0 + ' − ' + fore + ' − ' + main + ' = ' + rest + '$ ml.') }
              ],
              why: t('Išeiga lygina gautą tūrį su pradiniu, o likusi dalis yra likutis ir nuostoliai.', 'The yield compares the volume obtained with the starting one, and what is missing is residue and losses.'),
              src: 'LW2 p6'
            };
          }

          if (variant === 'fill') {
            const V = ctx.pick([50, 100, 150, 250, 500, 750, 1000]);
            const max = V * 2 / 3;
            return {
              q: [{ p: t('Naudojama ' + V + ' ml tūrio distiliavimo kolba. Skysčio į ją pilama ne daugiau kaip du trečdaliai tūrio.', 'A distillation flask of ' + V + ' ml is used. It may hold no more than two thirds of its volume.') }],
              steps: [{ prompt: t('Kiek ml skysčio galima pilti daugiausia?', 'What is the greatest volume of liquid in ml?'), kind: 'number', answer: { value: max, tol: 0.7 },
                hint: t('Du trečdaliai tūrio.', 'Two thirds of the volume.'),
                solution: t('$' + V + ' · 2/3 = ' + lt(max, 1) + '$ ml.', '$' + V + ' · 2/3 = ' + fmt(max, 1) + '$ ml.') }],
              why: t('Likusi dalis skirta putoms ir purslams, kad neišsiveržtų į kondensatorių.', 'The rest is for foam and spray, so they do not reach the condenser.'),
              src: 'LW2 p2'
            };
          }

          if (variant === 'bath') {
            const L = ctx.pick([['acetonas', 'acetone', 56], ['etanolis', 'ethanol', 78], ['metanolis', 'methanol', 65], ['etilo acetatas', 'ethyl acetate', 77], ['heksanas', 'hexane', 69], ['dichlormetanas', 'dichloromethane', 40]]);
            return {
              q: [{ p: t('Skystis: ' + L[0] + ' (v. t. apie ' + L[2] + ' °C). Šildymo vonia turi būti 20–25 °C karštesnė už skysčio virimo temperatūrą.',
                'Liquid: ' + L[1] + ' (b. p. about ' + L[2] + ' °C). The heating bath should be 20–25 °C hotter than the boiling point of the liquid.') }],
              steps: [
                { prompt: t('Kokia mažiausia vonios temperatūra (°C)?', 'What is the lowest bath temperature (°C)?'), kind: 'number', answer: { value: L[2] + 20, tol: 0.5 },
                  hint: t('Prie v. t. pridedamas mažesnis skirtumas.', 'Add the smaller difference to the boiling point.'),
                  solution: t('$' + L[2] + ' + 20 = ' + (L[2] + 20) + '$ °C.', '$' + L[2] + ' + 20 = ' + (L[2] + 20) + '$ °C.') },
                { prompt: t('Kokia didžiausia vonios temperatūra (°C)?', 'What is the highest bath temperature (°C)?'), kind: 'number', answer: { value: L[2] + 25, tol: 0.5 },
                  hint: t('Prie v. t. pridedamas didesnis skirtumas.', 'Add the larger difference to the boiling point.'),
                  solution: t('$' + L[2] + ' + 25 = ' + (L[2] + 25) + '$ °C.', '$' + L[2] + ' + 25 = ' + (L[2] + 25) + '$ °C.') }
              ],
              why: t('Truputį karštesnė vonia užtikrina tolygų garavimą, bet nekelia perkaitimo ir degimo pavojaus.', 'A moderately hotter bath gives steady vaporisation without the risk of overheating and fire.'),
              src: 'LW2 p2'
            };
          }

          if (variant === 'rate') {
            const mins = ctx.pick([2, 3, 4, 5]);
            const V = ctx.int(9 * mins, 90 * mins) / 10;
            const r = V * 20 / (mins * 60);
            const rr = Math.round(r * 100) / 100;
            const cls = rr < 1 ? 1 : (rr > 2 ? 2 : 0);
            return {
              q: [{ p: t('Per ' + mins + ' min priimtuve surinkta ' + lt(V, 1) + ' ml distiliato. Laikykite, kad 1 ml yra apie 20 lašų.', 'In ' + mins + ' min the receiver collected ' + fmt(V, 1) + ' ml of distillate. Take 1 ml as about 20 drops.') }],
              steps: [
                { prompt: t('Kiek lašų per sekundę tai atitinka?', 'How many drops per second is that?'), kind: 'number', answer: { value: r, tol: 0.06 },
                  hint: t('Lašų skaičių dalinkite iš sekundžių skaičiaus.', 'Divide the number of drops by the number of seconds.'),
                  solution: t('$' + lt(V, 1) + ' · 20 / (' + mins + ' · 60) = ' + lt(r, 2) + '$ lašo/s.', '$' + fmt(V, 1) + ' · 20 / (' + mins + ' · 60) = ' + fmt(r, 2) + '$ drops/s.') },
                ch(t('Ar greitis tinkamas?', 'Is the rate suitable?'), [
                  ['taip, tinka (1–2 lašai per sekundę)', 'yes, suitable (one to two drops per second)'],
                  ['per lėtas, kaitinimą reikia padidinti', 'too slow, the heating should be raised'],
                  ['per greitas, kaitinimą reikia sumažinti', 'too fast, the heating should be reduced']
                ], cls === 0 ? 0 : (cls === 1 ? 1 : 2),
                t('Palyginkite su leistinu intervalu.', 'Compare it with the allowed range.'),
                t('Tinkamas greitis yra 1–2 lašai per sekundę: lėčiau – veltui laukiama, greičiau – blogėja skyrimas.', 'The right rate is one to two drops per second: slower wastes time, faster spoils the separation.'))
              ],
              why: t('Lašėjimo greitis yra pagrindinis kintamasis, kurį kontroliuojate kaitinimu.', 'The dripping rate is the main variable you control with the heating.'),
              src: 'LW2 p6'
            };
          }

          if (variant === 'n') {
            const pairs = [];
            for (let a0 = 50; a0 <= 65; a0++) {
              for (let b0 = 28; b0 <= 55; b0++) {
                const n0 = Math.sin(a0 * Math.PI / 180) / Math.sin(b0 * Math.PI / 180);
                if (n0 >= 1.33 && n0 <= 1.38 && Math.abs(n0 - 1.3588) > 0.01) pairs.push([a0, b0, n0]);
              }
            }
            if (!pairs.length) throw new Error('l2.calc: no angle pair');
            const [a, b, n] = ctx.pick(pairs);
            return {
              q: [{ p: t('Šviesos spindulys iš oro krinta į skystį kampu $α$ = ' + a + '°, o skystyje lūžta kampu $β$ = ' + b + '°.', 'A light ray goes from air into a liquid at the angle $α$ = ' + a + '° and is refracted in the liquid at the angle $β$ = ' + b + '°.') }],
              steps: [
                { prompt: t('Kokio dydžio lūžio rodiklis $n$?', 'What is the refractive index $n$?'), kind: 'number', answer: { value: n, tol: 0.01 },
                  hint: t('Kampų sinusų santykis.', 'The ratio of the sines of the angles.'),
                  solution: t('$n = sin ' + a + '° / sin ' + b + '° = ' + lt(n, 3) + '$.', '$n = sin ' + a + '° / sin ' + b + '° = ' + fmt(n, 3) + '$.') },
                ch(t('Ar $n$ didesnis ar mažesnis už gryno acetono rodiklį (1,359)?', 'Is $n$ greater or smaller than that of pure acetone (1.359)?'), [
                  ['didesnis', 'greater'],
                  ['mažesnis', 'smaller']
                ], n > 1.3588 ? 0 : 1,
                t('Palyginkite savo skaičių su 1,359.', 'Compare your number with 1.359.'),
                t('Lyginamas rastas $n$ su 1,359.', 'The found $n$ is compared with 1.359.'))
              ],
              why: t('Lūžio rodiklis – kritimo ir lūžimo kampų sinusų santykis; palyginus su lentelės verte vertinamas grynumas.', 'The refractive index is the ratio of the sines of the angles of incidence and refraction; comparing it with a table value judges purity.'),
              src: 'LW2 p3'
            };
          }

          // nclass: judge the distillate from the refractive index
          // the index is drawn well inside one answer band (edges 1.338 and 1.356), so that interpolating between water and acetone agrees with the key
          const cls = ctx.pick([0, 1, 2]);
          const x = (cls === 0 ? ctx.int(13575, 13600) : cls === 1 ? ctx.int(13470, 13500) : ctx.int(13330, 13350)) / 10000;
          return {
            q: [{ p: t('Distiliato lūžio rodiklis $n_D^20$ yra ' + lt(x, 4) + '. Gryno acetono – 1,3588, vandens – 1,3330.', 'The refractive index of the distillate $n_D^20$ is ' + fmt(x, 4) + '. For pure acetone it is 1.3588 and for water 1.3330.') }],
            steps: [ch(t('Ką galima teigti apie distiliatą?', 'What can be said about the distillate?'), [
              ['beveik gryna acetonas (lūžio rodiklis nuo 1,356)', 'practically pure acetone (index from 1.356)'],
              ['acetonas su pastebimu vandens kiekiu', 'acetone with a noticeable amount of water'],
              ['daugiausia vanduo (rodiklis iki 1,338)', 'mostly water (index up to 1.338)']
            ], cls,
            t('Kuris yra arčiau – 1,3588 ar 1,3330?', 'Which is closer, 1.3588 or 1.3330?'),
            t('Rodiklis tarp vandens ir acetono reikšmių rodo mišinį; kuo arčiau 1,3588, tuo mažiau vandens.', 'An index between the values of water and acetone points to a mixture; the closer to 1.3588, the less water.'))],
            why: t('Vanduo mažina lūžio rodiklį, todėl nuokrypis nuo 1,3588 rodo priemaišos kiekį.', 'Water lowers the refractive index, so the deviation from 1.3588 shows how much impurity there is.'),
            src: 'LW2 p3'
          };
        }
      },
      // ---------------------------------------------------------------- defence
      {
        id: 'l2.defence',
        title: t('Gynimo klausimai', 'Defence questions'),
        mirrors: ['LW2.1', 'LW2.2', 'LW2.3', 'LW2.8'],
        bank: [
          {
            id: 'l2.defence.1',
            q: Q('Kokias distiliavimo rūšis išskiriame?', 'Which kinds of distillation do we distinguish?'),
            steps: [mu(t('Pažymėkite visas tikras rūšis.', 'Pick all real kinds.'), [
              ['paprastasis distiliavimas', 'simple distillation'],
              ['frakcinis distiliavimas', 'fractional distillation'],
              ['distiliavimas vakuume', 'distillation under vacuum'],
              ['distiliavimas vandens garais', 'steam distillation'],
              ['distiliavimas šaldant', 'distillation by freezing']
            ], [0, 1, 2, 3], t('Keturios iš penkių vartojamos laboratorijoje.', 'Four of the five are used in the laboratory.'),
              t('Pagrindinės rūšys: paprastasis, frakcinis, vakuume ir vandens garais.', 'The main kinds are simple, fractional, vacuum and steam distillation.'))],
            why: t('Rūšis parenkama pagal v. t. skirtumą, medžiagos jautrumą ir tirpumą vandenyje.', 'The kind is chosen by the boiling-point gap, the sensitivity of the compound and its solubility in water.'),
            src: 'LW2 p1'
          },
          {
            id: 'l2.defence.2',
            q: Q('Kada pakanka paprastojo distiliavimo?', 'When is simple distillation enough?'),
            steps: [ch(t('Pasirinkite.', 'Choose.'), [
              ['kai komponentų v. t. skiriasi daugiau nei 80 °C arba skystis atskiriamas nuo nelakių medžiagų', 'when the components differ by more than 80 °C in boiling point, or a liquid is separated from non-volatile matter'],
              ['kai v. t. skiriasi mažiau nei 5 °C', 'when the boiling points differ by less than 5 °C'],
              ['kai mišinys yra azeotropas', 'when the mixture is an azeotrope'],
              ['visada', 'always']
            ], 0, t('Kuo didesnis v. t. skirtumas, tuo paprasčiau.', 'The larger the boiling-point gap, the easier.'),
              t('Jei v. t. labai skiriasi, vienas ciklas pakanka; artimoms v. t. reikia kolonos.', 'With a wide gap one cycle is enough; close boiling points need a column.'))],
            why: t('Skyrimo geba didėja su ciklų skaičiumi, o paprastasis distiliavimas turi tik vieną.', 'Separating power grows with the number of cycles, and simple distillation has only one.'),
            src: 'LW2 p1'
          },
          {
            id: 'l2.defence.3',
            q: Q('Kas yra virimo temperatūra?', 'What is the boiling point?'),
            steps: [ch(t('Kuris apibrėžimas tikslus?', 'Which definition is accurate?'), [
              ['temperatūra, kurioje garų slėgis tampa lygus slėgiui aplink skystį', 'the temperature at which the vapour pressure becomes equal to the pressure around the liquid'],
              ['temperatūra, kai skystis tampa kietas', 'the temperature at which the liquid becomes solid'],
              ['temperatūra, kai garų slėgis lygus nuliui', 'the temperature at which the vapour pressure is zero'],
              ['aukščiausia temperatūra kolboje', 'the highest temperature in the flask']
            ], 0, t('Susiję du slėgiai.', 'Two pressures are involved.'),
              t('Skystis verda, kai jo garų slėgis lygus aplinkos slėgiui; todėl v. t. priklauso nuo slėgio.', 'A liquid boils when its vapour pressure equals the surrounding pressure; hence the boiling point depends on pressure.'))],
            why: t('Šis apibrėžimas paaiškina, kodėl vakuume skysčiai verda žemesnėje temperatūroje.', 'This definition explains why liquids boil lower under vacuum.'),
            src: 'LW2 p1'
          },
          {
            id: 'l2.defence.4',
            q: Q('Kuo frakcinio distiliavimo įranga skiriasi nuo paprastojo distiliavimo ir kodėl ji skiria geriau?', 'How does fractional distillation apparatus differ from simple apparatus, and why does it separate better?'),
            steps: [ch(t('Pasirinkite.', 'Choose.'), [
              ['tarp kolbos ir kondensatoriaus yra kolona, kurioje garinimas ir kondensavimas vyksta daug kartų', 'a column between flask and condenser, in which vaporisation and condensation repeat many times'],
              ['naudojama didesnė kolba', 'a larger flask is used'],
              ['vandens kondensatorius pakeičiamas oro', 'the water condenser is replaced by an air one'],
              ['termometras išimamas', 'the thermometer is removed']
            ], 0, t('Kokią papildomą dalį pridedame?', 'Which extra part do we add?'),
              t('Kolonoje garai pakartotinai kontaktuoja su skysčiu ir tampa vis lakesni.', 'In the column the vapour repeatedly meets the liquid and becomes ever more volatile.'))],
            why: t('Daug nedidelių skyrimų virsta vienu dideliu.', 'Many small separations add up to a big one.'),
            src: 'LW2 p3'
          },
          {
            id: 'l2.defence.5',
            q: Q('Ar frakciniu distiliavimu galima skirti azeotropinius mišinius?', 'Can azeotropic mixtures be separated by fractional distillation?'),
            steps: [ch(t('Pasirinkite.', 'Choose.'), [
              ['ne, nes garų ir skysčio sudėtis vienoda; reikia kito metodo, pavyzdžiui, cheminio vandens surišimo', 'no, since vapour and liquid have the same composition; another method is needed, such as chemical binding of water'],
              ['taip, reikia tik ilgesnės kolonos', 'yes, only a longer column is needed'],
              ['taip, jei kaitinti stipriau', 'yes, if heated harder'],
              ['taip, jei naudoti didesnį kondensatorių', 'yes, with a bigger condenser']
            ], 0, t('Kokia yra garų sudėtis azeotropo atveju?', 'What is the vapour composition in an azeotrope?'),
              t('Kolonos ilgis nepakeičia sudėties, nes azeotropas elgiasi kaip viena medžiaga.', 'A longer column does not change the composition, since an azeotrope behaves like one substance.'))],
            why: t('Absoliutų etanolį gauna surišę vandenį, pavyzdžiui, virindami su $CaO$.', 'Absolute ethanol is made by binding water, for example by boiling with $CaO$.'),
            src: 'LW2 p4'
          },
          {
            id: 'l2.defence.6',
            q: Q('Kodėl vakuumu distiliuojamos kai kurios medžiagos ir kiek sumažėja jų virimo temperatūra?', 'Why are some compounds distilled under vacuum, and by how much does their boiling point fall?'),
            steps: [ch(t('Pasirinkite.', 'Choose.'), [
              ['jos skyla kaitinamos, o perpus sumažinus slėgį v. t. nukrinta maždaug 15–20 °C', 'they decompose on heating, and halving the pressure lowers the boiling point by roughly 15–20 °C'],
              ['jos atsparios šilumai, o v. t. kyla 15–20 °C', 'they resist heat, and the boiling point rises by 15–20 °C'],
              ['kad prarastų vandenį', 'so that they lose water'],
              ['kad distiliatas būtų spalvotas', 'so that the distillate is coloured']
            ], 0, t('Kokia kryptimi keičiasi v. t. mažinant slėgį?', 'In which direction does the boiling point move when pressure is lowered?'),
              t('Slėgis mažinamas tam, kad v. t. nukristų žemiau skilimo temperatūros; kai slėgis 5–10 mm Hg, v. t. sumažėja net 100–150 °C.', 'The pressure is lowered so the boiling point falls below the decomposition temperature; at 5–10 mm Hg it falls by 100–150 °C.'))],
            why: t('Vakuumas apsaugo termiškai jautrias medžiagas.', 'Vacuum protects thermally sensitive compounds.'),
            src: 'LW2 p4'
          },
          {
            id: 'l2.defence.7',
            q: Q('Kokioms medžiagoms taikomas distiliavimas vandens garais?', 'For which compounds is steam distillation used?'),
            steps: [ch(t('Pasirinkite.', 'Choose.'), [
              ['aukštos v. t., netirpioms ar blogai tirpioms vandenyje', 'for high-boiling compounds that are insoluble or poorly soluble in water'],
              ['gerai vandenyje tirpioms ir žemos v. t.', 'for water-soluble compounds with low boiling points'],
              ['tik kietoms medžiagoms', 'for solids only'],
              ['tik dujoms', 'for gases only']
            ], 0, t('Medžiaga turi išsiskirti iš vandens.', 'The compound must separate from water.'),
              t('Vandens garai išneša tokią medžiagą žemiau jos v. t., o ji lengvai atskiriama nuo vandens.', 'Steam carries such a compound over below its boiling point, and it is easy to separate from the water.'))],
            why: t('Metodas gerai tinka, kai produktas užterštas nelakiomis dervingomis priemaišomis.', 'The method suits a product contaminated with non-volatile tarry impurities.'),
            src: 'LW2 p4'
          },
          {
            id: 'l2.defence.8',
            q: Q('Ką žymi $n_D^20$ ir nuo ko priklauso lūžio rodiklis?', 'What does $n_D^20$ denote and what does the refractive index depend on?'),
            steps: [ch(t('Pasirinkite.', 'Choose.'), [
              ['rodiklis, išmatuotas esant 20 °C ir natrio D linijos šviesai (589 nm); jis priklauso nuo temperatūros, bangos ilgio ir sudėties', 'the index measured at 20 °C with sodium D light (589 nm); it depends on temperature, wavelength and composition'],
              ['rodiklis, išmatuotas esant 589 °C ir 20 nm', 'the index measured at 589 °C and 20 nm'],
              ['rodiklis, nepriklausantis nuo temperatūros', 'an index independent of temperature'],
              ['rodiklis, rodantis tik tankį', 'an index showing only the density']
            ], 0, t('Indeksai nurodo temperatūrą ir bangos ilgį.', 'The indices give temperature and wavelength.'),
              t('Viršutinis indeksas – temperatūra, apatinis D – natrio linija; abu būtini, nes rodiklis nuo jų keičiasi.', 'The upper index is the temperature, the lower D the sodium line; both are needed since the index changes with them.'))],
            why: t('Palyginti galima tik tomis pačiomis sąlygomis išmatuotas vertes.', 'Only values measured under the same conditions can be compared.'),
            src: 'LW2 p3'
          },
          {
            id: 'l2.defence.9',
            q: Q('Kokį kondensatorių pasirinkti pagal virimo temperatūrą?', 'Which condenser should be chosen according to the boiling point?'),
            steps: [ch(t('Kuri tvarka teisinga?', 'Which arrangement is correct?'), [
              ['žemiau 120 °C – su tekančiu vandeniu, 120–160 °C – su nejudančiu vandeniu, virš 160 °C – oro', 'below 120 °C – water-cooled with flowing water, 120–160 °C – with standing water, above 160 °C – air'],
              ['iki 120 °C – oro, virš 160 °C – su tekančiu vandeniu', 'below 120 °C – air, above 160 °C – running water'],
              ['visais atvejais su tekančiu vandeniu', 'in all cases running water'],
              ['visais atvejais oro', 'in all cases air']
            ], 0, t('Kuo aukštesnė v. t., tuo švelnesnis vėsinimas.', 'The higher the boiling point, the gentler the cooling.'),
              t('Karšti garai su šaltu vandeniu gali įtrūkdyti stiklą, todėl aukštoms v. t. vėsinama švelniau.', 'Hot vapour with cold water can crack the glass, so high boiling points are cooled more gently.'))],
            why: t('Kondensatorius parenkamas pagal v. t. ir stiklo atsparumą temperatūrų šuoliams.', 'The condenser is chosen by the boiling point and the glass resistance to temperature shocks.'),
            src: 'LW2 p2'
          }
        ]
      }
    ],
    coverage: {}
  };

  // coverage is derived from the mirrors of the types, so the two stay consistent
  U.types.forEach(ty => (ty.mirrors || []).forEach(k => {
    (U.coverage[k] = U.coverage[k] || []).push(ty.id);
  }));

  ORG.unit(U);
})(globalThis.ORG = globalThis.ORG || {});
