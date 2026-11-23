// site/organic/units/u02.js: unit 2, atomic structure and the chemical bond
(function (ORG) {
  'use strict';
  const t = (lt, en) => ({ lt, en });
  const f = (s) => ({ lt: s, en: s });
  const tx = (lt, en) => ({ text: t(lt, en) });
  const ft = (s) => ({ text: f(s) });
  const mo = (smi, opts) => ({ mol: opts ? { smi, opts } : { smi } });

  /* ---------- shared data: electronegativities of the course (L2 p35) ---------- */
  const EN = { H: 2.1, Li: 1.0, Be: 1.5, B: 2.0, C: 2.5, N: 3.0, O: 3.5, F: 4.0, Na: 0.9, Mg: 1.2, Al: 1.5, Si: 1.8, P: 2.1, S: 2.5, Cl: 3.0, Br: 2.8, I: 2.5, K: 0.8, Ca: 1.0 };
  const EL = {
    H: { lt: 'vandenilis', en: 'hydrogen' }, C: { lt: 'anglis', en: 'carbon' }, N: { lt: 'azotas', en: 'nitrogen' }, O: { lt: 'deguonis', en: 'oxygen' },
    F: { lt: 'fluoras', en: 'fluorine' }, Cl: { lt: 'chloras', en: 'chlorine' }, Br: { lt: 'bromas', en: 'bromine' }, I: { lt: 'jodas', en: 'iodine' },
    S: { lt: 'siera', en: 'sulfur' }, Li: { lt: 'litis', en: 'lithium' }, Na: { lt: 'natris', en: 'sodium' }, K: { lt: 'kalis', en: 'potassium' },
    Mg: { lt: 'magnis', en: 'magnesium' }, Si: { lt: 'silicis', en: 'silicon' }
  };
  const dl = (x) => String(x).replace('.', ',');                 // decimal comma for Lithuanian text
  const r1 = (x) => Math.round(x * 10) / 10;

  const canon = (ctx, s) => ctx.chem.canonical(ctx.chem.parse(s), { stereo: false });
  const nameStep = (ctx, smi, hint) => {
    const lt = ctx.name.name(smi, { lang: 'lt' }), en = ctx.name.name(smi, { lang: 'en' });
    if (!lt || !en) return null;
    return {
      prompt: t('Pavadinkite junginį.', 'Name the compound.'),
      kind: 'name', mol: { smi }, answer: { smi },
      hint: hint || t('Raskite ilgiausią grandinę su pagrindine grupe ir sunumeruokite ją taip, kad pakaitų numeriai būtų kuo mažesni.', 'Find the longest chain that holds the main group and number it so that the locants are as low as possible.'),
      solution: t(lt.name, en.name)
    };
  };
  const listAtoms = (idx, lang) => idx.map((i) => (lang === 'lt' ? 'Nr. ' : 'no. ') + (i + 1)).join(', ');

  /* ====================================================================== notes */
  const NOTES = [
    /* ------------------------------------------------------------ 1 */
    {
      id: 'atom',
      title: t('Atomas, orbitalės ir valentingumas', 'The atom, orbitals and valence'),
      blocks: [
        { h: t('Iš ko sudarytas atomas', 'What an atom is made of') },
        {
          p: t('Atomo centre yra teigiamai įkrautas branduolys, sudarytas iš protonų ir neutralių neutronų, o aplink jį juda neigiamai įkrauti elektronai. Neutraliame atome protonų ir elektronų yra po lygiai. Protono ir neutrono masės beveik vienodos ir maždaug 1800 kartų didesnės už elektrono masę, todėl beveik visa masė sutelkta branduolyje, o didžiąją tūrio dalį užima elektronų debesis.',
            'At the centre of an atom is a positively charged nucleus made of protons and neutral neutrons, and negatively charged electrons move around it. A neutral atom has as many electrons as protons. A proton and a neutron have almost the same mass, about 1800 times that of an electron, so nearly all the mass sits in the nucleus while the electron cloud fills most of the volume.'),
          src: 'L2 p2'
        },
        {
          p: t('Elemento atominis skaičius lygus protonų skaičiui branduolyje, o masės skaičius – protonų ir neutronų sumai. Tą patį protonų, bet skirtingą neutronų skaičių turintys atomai vadinami izotopais. Labiausiai paplitęs anglies izotopas ¹²C sudarytas iš 6 protonų ir 6 neutronų, todėl jo masės skaičius lygus 12.',
            'The atomic number of an element equals the number of protons in the nucleus, and the mass number is the sum of protons and neutrons. Atoms with the same number of protons but a different number of neutrons are isotopes. The commonest carbon atom has 6 protons and 6 neutrons, so its mass number is 12.'),
          src: 'L2 p2'
        },
        {
          table: {
            head: [t('Atomas', 'Atom'), t('Protonai', 'Protons'), t('Neutronai', 'Neutrons'), t('Elektronai', 'Electrons'), t('Masės skaičius', 'Mass number')],
            rows: [[f('¹²C'), f('6'), f('6'), f('6'), f('12')], [f('¹³C'), f('6'), f('7'), f('6'), f('13')]]
          },
          caption: t('Anglies izotopai.', 'The isotopes of carbon.'), src: 'L2 p2'
        },
        { h: t('Atominės orbitalės ir kvantiniai skaičiai', 'Atomic orbitals and quantum numbers') },
        {
          p: t('Atomine orbitale (AO) vadinama erdvės sritis, kurioje elektroną rasti labiausiai tikėtina. Orbitalės energiją, formą ir padėtį erdvėje nusako kvantiniai skaičiai.',
            'The region of space in which the probability of finding an electron is highest is called an atomic orbital (AO). The energy, shape and orientation of an orbital are set by quantum numbers.'),
          src: 'L2 p3, T p19'
        },
        {
          list: [
            t('Pagrindinis kvantinis skaičius $n$ nusako energijos lygmenį. Tą patį $n$ turintys elektronai sudaro vieną elektronų sluoksnį.', 'The principal quantum number $n$ gives the energy level. Electrons with the same $n$ form one electron shell.'),
            t('Šalutinis kvantinis skaičius $l$ lemia orbitalės formą: kai $l = 0$, orbitalė sferinė ($s$); kai $l = 1$, ji panaši į hantelį ($p$) ir turi plokštumą (mazginę), kurioje elektrono tikimybė lygi nuliui; toliau eina $d$ ir $f$.', 'The secondary quantum number $l$ gives the shape: $l = 0$ is a spherical $s$ orbital, $l = 1$ a dumbbell-shaped $p$ orbital with a nodal plane in which the probability of finding the electron is zero; then come $d$ and $f$.'),
            t('Magnetinis kvantinis skaičius $m$ rodo, kaip orbitalė orientuota erdvėje: trys $p$ orbitalės ($p_x$, $p_y$, $p_z$) nukreiptos išilgai ašių.', 'The magnetic quantum number $m$ gives the orientation in space: the three $p$ orbitals ($p_x$, $p_y$, $p_z$) point along the axes.'),
            t('Sukinio kvantinis skaičius $s$ apibūdina elektrono sukimąsi ir turi dvi galimas reikšmes: +½ ir −½.', 'The spin quantum number $s$ describes the spin of the electron and is either +½ or −½.')
          ],
          src: 'L2 p3, p4'
        },
        {
          table: {
            head: [t('Sluoksnis ($n$)', 'Shell ($n$)'), t('Orbitalių tipai', 'Orbital types'), t('Orbitalių po tipą', 'Orbitals per type'), t('Orbitalių iš viso ($n^2$)', 'Orbitals in total ($n^2$)'), t('Daugiausia elektronų', 'Maximum electrons')],
            rows: [
              [f('1'), f('s'), f('1'), f('1'), f('2')],
              [f('2'), f('s, p'), f('1, 3'), f('4'), f('8')],
              [f('3'), f('s, p, d'), f('1, 3, 5'), f('9'), f('18')],
              [f('4'), f('s, p, d, f'), f('1, 3, 5, 7'), f('16'), f('32')]
            ]
          },
          caption: t('Orbitalių skaičius sluoksnyje lygus $n^2$, o elektronų – du kartus daugiau, nes orbitalėje telpa du elektronai.', 'The number of orbitals in a shell is $n^2$, and the electrons are twice as many because an orbital holds two electrons.'), src: 'L2 p6'
        },
        {
          p: t('Elektronai užpildo orbitales trimis taisyklėmis. Pirma, pagal patvarumo principą elektronai pirmiausia užima žemesnės energijos orbitales: 1s → 2s → 2p → 3s → 3p → 4s. Antra, pagal Pauli principą vienoje orbitalėje gali būti ne daugiau kaip du priešingų sukinių elektronai. Trečia, pagal Hundo taisyklę vienodos energijos orbitalėse (pavyzdžiui, trijose 2p) elektronai pirmiausia išsidėsto po vieną su lygiagrečiais sukiniais ir tik paskui susiporuoja.',
            'Electrons fill orbitals by three rules. First, by the stability (aufbau) principle the orbitals of lowest energy fill first: 1s → 2s → 2p → 3s → 3p → 4s. Second, by the Pauli principle an orbital holds at most two electrons, and their spins are opposite. Third, by Hund’s rule electrons in orbitals of equal energy (for example the three 2p orbitals) occupy them one at a time with parallel spins and pair up only afterwards.'),
          src: 'L2 p5, T p20'
        },
        { h: t('Anglies, azoto ir deguonies elektronų konfigūracijos', 'Electron configuration of C, N and O') },
        {
          table: {
            head: [t('Atomas', 'Atom'), f('Z'), t('Konfigūracija', 'Configuration'), f('1s'), f('2s'), f('2p'), t('Nesuporuoti elektronai', 'Unpaired electrons')],
            rows: [
              [f('C'), f('6'), f('1s²2s²2p²'), f('[↑↓]'), f('[↑↓]'), f('[↑] [↑] [ ]'), f('2')],
              [f('N'), f('7'), f('1s²2s²2p³'), f('[↑↓]'), f('[↑↓]'), f('[↑] [↑] [↑]'), f('3')],
              [f('O'), f('8'), f('1s²2s²2p⁴'), f('[↑↓]'), f('[↑↓]'), f('[↑↓] [↑] [↑]'), f('2')]
            ]
          },
          caption: t('Pagrindinis būvis. Kiekviena dėžutė yra viena orbitalė, rodyklė – elektronas.', 'The ground state. Each box is one orbital, an arrow is an electron.'), src: 'L2 p8'
        },
        {
          p: t('Ryšius sudaro išorinio sluoksnio elektronai, užimantys didžiausios energijos orbitales; jie vadinami valentiniais. Anglis jų turi 4, azotas 5, deguonis 6. Vidiniai 1s² elektronai ryšiuose nedalyvauja.',
            'The electrons that take part in bonding are those in the orbitals of highest energy, in the outer shell, and they are called valence electrons. Carbon has 4, nitrogen 5 and oxygen 6. The inner 1s² electrons do not take part in bonds.'),
          src: 'L2 p7'
        },
        {
          pitfall: t('Neparašykite 2p² kaip vieną pilną orbitalę ir dvi tuščias (↑↓, tuščia, tuščia). Pagal Hundo taisyklę du 2p elektronai anglyje yra skirtingose orbitalėse ir turi lygiagrečius sukinius: [↑] [↑] [ ]. Deguonyje ketvirtas 2p elektronas susiporuoja, nes laisvų 2p orbitalių nebeliko, ir lieka du nesuporuoti elektronai, o ne vienas.',
            'Do not write 2p² as one full orbital and two empty ones (↑↓, empty, empty). By Hund’s rule the two 2p electrons of carbon sit in different orbitals with parallel spins: [↑] [↑] [ ]. In oxygen the fourth 2p electron pairs up because every 2p orbital already holds one electron, so two unpaired electrons are left, not one.')
        },
        {
          example: {
            q: [{ p: t('Parašykite fluoro atomo (Z = 9) elektronų konfigūraciją ir nuspręskite, kiek kovalentinių ryšių jis sudaro.', 'Write the electron configuration of the fluorine atom (Z = 9) and decide how many covalent bonds it forms.') }],
            steps: [
              [{ p: t('Elektronai pildo orbitales eilės tvarka 1s → 2s → 2p. Devyni elektronai: 2 + 2 + 5, taigi 1s²2s²2p⁵.', 'Electrons fill the orbitals in the order 1s → 2s → 2p. Nine electrons: 2 + 2 + 5, so 1s²2s²2p⁵.') }],
              [{ p: t('Penki 2p elektronai: pirmiausia po vieną kiekvienoje iš trijų orbitalių, o du paskutiniai susiporuoja: [↑↓] [↑↓] [↑]. Nesuporuotas lieka vienas elektronas.', 'Five 2p electrons: first one in each of the three orbitals, then two more pair up: [↑↓] [↑↓] [↑]. One unpaired electron is left.') }],
              [{ p: t('Vienas nesuporuotas elektronas reiškia vieną ryšį: fluoras vienavalentis, kaip ir vandenilis bei kiti halogenai. Pavyzdys: HF.', 'One unpaired electron means one bond: fluorine is monovalent, like hydrogen and the other halogens. Example: HF.') }]
            ]
          },
          claims: [{ formula: ['F', 'FH'] }]
        },
        { h: t('Valentingumas ir oktetų taisyklė', 'Valence and the octet rule') },
        {
          rule: t('Valentingumas – tai atomo sudaromų ryšių su kitais atomais skaičius. Anglis paprastai sudaro keturis ryšius, azotas tris, deguonis du, vandenilis ir halogenai po vieną. Dvigubasis ryšys skaičiuojamas kaip du, trigubasis – kaip trys.',
            'Valence is the number of bonds an atom forms with other atoms. Carbon generally forms four bonds, nitrogen three, oxygen two, hydrogen and the halogens one each. A double bond counts as two bonds, a triple bond as three.'),
          src: 'L2 p7'
        },
        {
          mol: [
            { smi: 'C', opts: { allH: true }, caption: t('metanas: C turi 4 ryšius', 'methane: C has 4 bonds') },
            { smi: 'N', opts: { allH: true }, caption: t('amoniakas: N turi 3 ryšius', 'ammonia: N has 3 bonds') },
            { smi: 'O', opts: { allH: true }, caption: t('vanduo: O turi 2 ryšius', 'water: O has 2 bonds') },
            { smi: 'Cl', opts: { allH: true }, caption: t('HCl: Cl turi 1 ryšį', 'HCl: Cl has 1 bond') }
          ],
          src: 'L2 p7'
        },
        {
          p: t('Oktetų taisyklė paaiškina, kodėl būtent tiek ryšių: besijungiantys atomai persitvarko elektronų apvalkalus taip, kad gautų stabilią inertinių dujų konfigūraciją su 8 valentiniais elektronais. Ji tinka antrojo periodo atomams C, N, O ir F; vandenilis siekia dviejų elektronų.',
            'The octet rule explains why these numbers: bonding atoms rearrange their electron shells so that they reach the stable noble-gas configuration with 8 valence electrons. The rule holds for the second-period elements C, N, O and F; hydrogen aims for two electrons.'),
          src: 'L2 p22'
        },
        {
          p: t('Trečio periodo atomai, pavyzdžiui, siera ir fosforas, gali sudaryti daugiau ryšių, nei leidžia oktetas, nes turi laisvų 3d orbitalių (taip aiškinama paskaitoje). Siera turi 6 išorinius elektronus (3s²3p⁴). Tioliuose ($CH3SH$) ji dvivalentė kaip deguonis, dimetilsulfokside – keturvalentė, metansulfonrūgštyje – šešiavalentė, ir aplink ją yra 12 elektronų.',
            'Third-period atoms such as sulfur and phosphorus can form more bonds than the octet allows, because they have vacant 3d orbitals (the explanation given in the course). Sulfur has 6 outer electrons (3s²3p⁴). In thiols ($CH3SH$) it is divalent like oxygen, in dimethyl sulfoxide tetravalent, and in methanesulfonic acid hexavalent, with 12 electrons around it.'),
          src: 'L2 p23'
        },
        {
          mol: [
            { smi: 'CS', caption: t('metantiolis: S dvivalentė', 'methanethiol: S divalent') },
            { smi: 'CS(C)=O', caption: t('dimetilsulfoksidas: S keturvalentė', 'dimethyl sulfoxide: S tetravalent') },
            { smi: 'CS(=O)(=O)O', caption: t('metansulfonrūgštis: S šešiavalentė', 'methanesulfonic acid: S hexavalent') }
          ],
          src: 'L2 p23'
        },
        {
          pitfall: t('Valentingumas skaičiuoja ryšių linijas, o ne kaimynų skaičių. Anglies atomas molekulėje $CH2=CH2$ turi tik tris kaimynus (kitą $C$ ir du $H$), bet keturis ryšius: du su kita $C$ ir po vieną su kiekvienu $H$.',
            'Valence counts the lines of bonds, not the number of neighbours. A carbon in $CH2=CH2$ has only three neighbours (the other $C$ and two $H$) but four bonds: two to the other $C$ and one to each $H$.')
        },
        { practice: 'u02.config' },
        { practice: 'u02.valence' }
      ]
    },

    /* ------------------------------------------------------------ 2 */
    {
      id: 'hyb',
      title: t('Hibridizacija: sp³, sp² ir sp', 'Hybridisation: sp³, sp² and sp'),
      blocks: [
        { h: t('Kodėl anglis keturvalentė', 'Why carbon is tetravalent') },
        {
          p: t('Pagrindiniame būvyje anglies atomas (1s²2s²2p²) turi tik du nesuporuotus elektronus ir, atrodytų, galėtų sudaryti tik du ryšius. Bet anglis sudaro keturis. Paaiškinimas: vienas 2s elektronas pereina į laisvą 2p orbitalę (sužadintas būvis 1s²2s¹2p³), ir atsiranda keturi nesuporuoti elektronai. Kadangi 2s ir 2p energijos panašios, šios keturios orbitalės susimaišo ir sudaro vienodos energijos hibridines orbitales.',
            'In the ground state a carbon atom (1s²2s²2p²) has only two unpaired electrons and would seem able to form only two bonds. Yet carbon forms four. The explanation: one 2s electron moves into the vacant 2p orbital (the excited state 1s²2s¹2p³), which gives four unpaired electrons. Since 2s and 2p have similar energies, these orbitals mix and form hybrid orbitals of equal energy.'),
          src: 'L2 p9, T p20'
        },
        {
          table: {
            head: [t('Būvis', 'State'), f('1s'), f('2s'), f('2p'), t('Nesuporuoti elektronai', 'Unpaired electrons')],
            rows: [
              [t('Pagrindinis', 'Ground'), f('[↑↓]'), f('[↑↓]'), f('[↑] [↑] [ ]'), f('2')],
              [t('Sužadintas', 'Excited'), f('[↑↓]'), f('[↑]'), f('[↑] [↑] [↑]'), f('4')]
            ]
          },
          src: 'L2 p9'
        },
        {
          rule: t('Hibridizacija – skirtingų, bet panašios energijos atominių orbitalių susimaišymas į vienodos energijos hibridines orbitales. Hibridinių orbitalių skaičius lygus susimaišiusių orbitalių skaičiui. Hibridinė orbitalė yra ištęsta: viena skiltis didelė, kita maža.',
            'Hybridisation is the mixing of different atomic orbitals of similar energy into hybrid orbitals of equal energy. The number of hybrid orbitals equals the number of orbitals mixed. A hybrid orbital is elongated: one lobe is large and the other small.'),
          src: 'L2 p10, T p20'
        },
        {
          table: {
            head: [t('Hibridizacija', 'Hybridisation'), t('Susimaišo', 'Orbitals mixed'), t('Hibridinės orbitalės', 'Hybrid orbitals'), t('Kampas', 'Angle'), t('Forma', 'Shape'), t('Ryšiai', 'Bonds')],
            rows: [
              [f('sp³'), f('2s + 3 × 2p'), f('4'), f('109,5°'), t('tetraedras', 'tetrahedron'), t('keturi viengubieji (σ)', 'four single (σ)')],
              [f('sp²'), f('2s + 2 × 2p'), f('3 + 1 p'), f('120°'), t('plokščias trikampis', 'flat triangle'), t('vienas dvigubasis (σ + π) ir du viengubieji', 'one double (σ + π) and two single')],
              [f('sp'), f('2s + 1 × 2p'), f('2 + 2 p'), f('180°'), t('tiesė', 'straight line'), t('vienas trigubasis (σ + 2π) arba du dvigubieji', 'one triple (σ + 2π) or two double')]
            ]
          },
          caption: t('Likusios nehibridinės p orbitalės sudaro π ryšius ir yra statmenos hibridinių orbitalių plokštumai (sp atveju – jų ašiai).', 'The unhybridised p orbitals form the π bonds and are perpendicular to the plane of the hybrid orbitals (to their axis in the sp case).'), src: 'L2 p11, p12, p13, T p21'
        },
        {
          mol: [
            { smi: 'CC', name: t('etanas', 'ethane'), caption: t('abu C yra sp³', 'both C are sp³') },
            { smi: 'C=C', name: t('etenas', 'ethene'), opts: { condensed: true }, caption: t('abu C yra sp²', 'both C are sp²') },
            { smi: 'C#C', name: t('etinas', 'ethyne'), opts: { condensed: true }, caption: t('abu C yra sp', 'both C are sp') }
          ],
          src: 'L2 p18, p28, p29'
        },
        {
          rule: t('Anglies atomo hibridizaciją nusako jo ryšių rūšys: keturi viengubieji ryšiai – sp³; vienas dvigubasis ir du viengubieji – sp²; vienas trigubasis ir vienas viengubasis arba du dvigubieji – sp.',
            'The bonds of a carbon atom decide its hybridisation: four single bonds – sp³; one double and two single bonds – sp²; one triple and one single bond, or two double bonds – sp.'),
          src: 'L2 p18'
        },
        {
          p: t('Alene (propadienas) vidurinis anglies atomas turi du dvigubuosius ryšius, todėl yra sp, o abu galiniai – sp². Du π ryšiai yra statmenose plokštumose, todėl dviejų $CH2$ grupių plokštumos yra viena kitai statmenos.',
            'In allene (propadiene) the central carbon has two double bonds and is sp, while both end carbons are sp². The two π bonds lie in perpendicular planes, so the planes of the two $CH2$ groups are perpendicular to each other.'),
          src: 'L2 p30'
        },
        { mol: { smi: 'C=C=C', name: t('propadienas', 'propa-1,2-diene'), caption: t('alenas: sp² – sp – sp²', 'allene: sp² – sp – sp²') } },
        {
          example: {
            q: [{ p: t('Nustatykite kiekvieno anglies atomo hibridizaciją pent-3-en-1-ine. Atomų numeriai atitinka grandinės numeraciją.', 'Determine the hybridisation of every carbon in pent-3-en-1-yne. The atom numbers follow the chain numbering.') }, { mol: { smi: 'C#CC=CC', name: t('3-penten-1-inas', 'pent-3-en-1-yne'), opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Atomas Nr. 1 turi trigubąjį ryšį su Nr. 2 ir vieną $C–H$; atomas Nr. 2 – trigubąjį ir vieną viengubąjį ryšį su Nr. 3. Abu yra sp.', 'Carbon no. 1 has a triple bond to no. 2 and one $C–H$; carbon no. 2 has the triple bond and one single bond to no. 3. Both are sp.') }],
              [{ p: t('Atomai Nr. 3 ir Nr. 4 sudaro dvigubąjį ryšį: kiekvienas turi vieną dvigubąjį ir du viengubuosius ryšius, taigi sp².', 'Carbons no. 3 and no. 4 form the double bond: each has one double and two single bonds, so sp².') }],
              [{ p: t('Atomas Nr. 5 yra $CH3$ grupė, turi keturis viengubuosius ryšius, taigi sp³.', 'Carbon no. 5 is a $CH3$ group with four single bonds, so sp³.') }]
            ]
          },
          claims: [{ hyb: ['C#CC=CC', 0, 'sp'] }, { hyb: ['C#CC=CC', 1, 'sp'] }, { hyb: ['C#CC=CC', 2, 'sp2'] }, { hyb: ['C#CC=CC', 3, 'sp2'] }, { hyb: ['C#CC=CC', 4, 'sp3'] },
            { name: ['C#CC=CC', { lt: '3-penten-1-inas', en: 'pent-3-en-1-yne' }] }]
        },
        { h: t('Azoto ir deguonies atomų hibridizacija', 'Hybridisation of nitrogen and oxygen') },
        {
          p: t('Azotas, kaip ir anglis, gali būti sp³, sp² arba sp. Azotas sp³ yra amoniake, alifatiniuose aminuose ir aminorūgščių $NH2$ grupėje; sp² – aromatiniuose aminuose, iminuose ($C=N$) ir amiduose ($CONH2$); sp – nitrilų grupėje $C≡N$. Amine, imine ir nitrile laisvoji pora užima vieną iš hibridinių orbitalių (sp³ atveju – vieną iš keturių); amiduose ir aromatiniuose aminuose ji patenka į p orbitalę ir konjuguoja su π sistema.',
            'Nitrogen, like carbon, can be sp³, sp² or sp. It is sp³ in ammonia, aliphatic amines and the $NH2$ group of amino acids; sp² in aromatic amines, imines ($C=N$) and amides ($CONH2$); sp in the nitrile group $C≡N$. In amines, imines and nitriles the lone pair occupies one of the hybrid orbitals (in the sp³ case, one of the four); in amides and aromatic amines it goes into a p orbital and is conjugated with the π system.'),
          src: 'L2 p14'
        },
        {
          mol: [
            { smi: 'CN', opts: { lonePairs: true }, caption: t('metilaminas: N sp³', 'methylamine: N is sp³') },
            { smi: 'CC=N', opts: { lonePairs: true }, caption: t('etaniminas: N sp²', 'ethanimine: N is sp²') },
            { smi: 'CC#N', name: t('etannitrilas', 'ethanenitrile'), opts: { lonePairs: true }, caption: t('N sp', 'N is sp') }
          ],
          src: 'L2 p14'
        },
        {
          p: t('Amoniake keturios N sp³ orbitalės nukreiptos į tetraedro viršūnes: trys sudaro ryšius su vandeniliais, o ketvirtoje yra laisvoji pora. Kampas $H-N-H$ yra 107,3°, kiek mažesnis už tetraedro kampą 109,5°, nes laisvoji pora stipriau stumia ryšių poras (Klein). Vandenyje deguonis irgi sp³: dvi orbitalės ryšiams su $H$ ir dvi laisvosioms poroms, kampas $H-O-H$ yra 104,5°.',
            'In ammonia the four N sp³ orbitals point to the corners of a tetrahedron: three form bonds to hydrogen and the fourth holds the lone pair. The $H-N-H$ angle is 107.3°, slightly below the tetrahedral 109.5°, because the lone pair repels the bonding pairs more strongly (Klein). In water oxygen is also sp³: two orbitals bond to $H$ and two hold lone pairs, and the $H-O-H$ angle is 104.5°.'),
          src: 'L2 p15, p17'
        },
        {
          mol: [
            { smi: 'N', opts: { lonePairs: true }, caption: t('NH₃: 107,3°', 'NH₃: 107.3°') },
            { smi: 'O', opts: { lonePairs: true }, caption: t('H₂O: 104,5°', 'H₂O: 104.5°') }
          ],
          src: 'L2 p15, p17'
        },
        {
          p: t('Deguonis sp³ yra vandenyje, alkoholių $–OH$ grupėje ir eteriuose $–O–$; sp² – karbonilo grupėje $C=O$ ir fenolių $–OH$ grupėje. Fenolyje laisvoji pora greta žiedo π sistemos patenka į p orbitalę ir dalyvauja konjugacijoje.',
            'Oxygen is sp³ in water, in the $–OH$ group of alcohols and in ethers $–O–$; it is sp² in the carbonyl group $C=O$ and in the $–OH$ group of phenols. In phenol the lone pair next to the π system of the ring goes into a p orbital and takes part in conjugation.'),
          src: 'L2 p16'
        },
        {
          mol: [
            { smi: 'CO', name: t('metanolis', 'methanol'), opts: { lonePairs: true }, caption: t('O sp³', 'O is sp³') },
            { smi: 'COC', opts: { lonePairs: true }, caption: t('O sp³ (eteris)', 'O is sp³ (ether)') },
            { smi: 'CC(C)=O', opts: { lonePairs: true }, caption: t('C=O deguonis sp²', 'the C=O oxygen is sp²') },
            { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol'), opts: { lonePairs: true }, caption: t('fenolio O sp²', 'phenol O is sp²') }
          ],
          src: 'L2 p16'
        },
        {
          pitfall: t('N ir O atomai nevisada yra sp³, nors turi tik viengubuosius ryšius: jei laisvoji pora konjuguota su π sistema (amido $N$, aromatinio amino $N$, fenolio $O$), atomas yra sp². Dėmesio: 19 paskaitos skaidrėje („!“) karboksirūgšties $–OH$ deguonis ir hidrazono $–NH2$ azotas pažymėti kaip sp³, nors greta yra $C=O$ ar $C=N$; tikrasis vaizdas sudėtingesnis (laisvoji pora iš dalies delokalizuota, kaip amiduose). Egzamine atsakykite taip, kaip paskaitoje: šiuose dviejuose pavyzdžiuose – sp³; amido, aromatinio amino ir fenolio atveju – sp². Anglį visada galima nustatyti vien iš ryšių rūšių.',
            'N and O atoms are not always sp³ even when they have only single bonds: if the lone pair is conjugated with a π system (the $N$ of an amide, the $N$ of an aromatic amine, the $O$ of a phenol), the atom is sp². Careful: on lecture slide 19 (marked “!”) the $–OH$ oxygen of a carboxylic acid and the $–NH2$ nitrogen of a hydrazone are drawn as sp³ although they stand next to $C=O$ or $C=N$; the real picture is subtler (the lone pair is partly delocalised, as in amides). In the course, answer as the lecture does: sp³ for these two examples; sp² for an amide, an aromatic amine and a phenol. For carbon the bond types alone are enough.'),
          src: 'L2 p19'
        },
        { practice: 'u02.hyb' },
        { practice: 'u02.fromhyb' },
        { practice: 'u02.nohyb' }
      ]
    },

    /* ------------------------------------------------------------ 3 */
    {
      id: 'sigmapi',
      title: t('Kovalentinis ryšys: σ, π ir donorinis-akceptorinis', 'The covalent bond: σ, π and donor–acceptor'),
      blocks: [
        { h: t('Kas yra kovalentinis ryšys', 'What a covalent bond is') },
        {
          p: t('Cheminis ryšys – tai visos elektronų ir branduolių sąveikos, kurios laiko atomus vienoje molekulėje. Cheminė jungtis yra tik jo grafinis vaizdas viena ar keliomis brūkšnelėmis. Kovalentinis ryšys susidaro tarp dviejų atomų bendrai elektronų porai: kiekvieną ryšio elektroną traukia abu branduoliai, todėl sistema tampa patvaresnė.',
            'A chemical bond is the sum of interactions between electrons and nuclei that holds atoms together in a molecule. A bond line is only its graphic image, drawn as one or more dashes. A covalent bond forms when two atoms share an electron pair: both nuclei attract each bonding electron, so the system becomes more stable.'),
          src: 'L2 p22, p24, T p21'
        },
        {
          rule: t('σ ryšys susidaro orbitalėms persidengiant išilgai ryšio ašies (ašinis persidengimas); elektronų tankis didžiausias tiesėje tarp branduolių. Tai patvariausias ryšys. π ryšys susidaro šoniniu dviejų p orbitalių persiklojimu: elektronų tankis yra abiejose tiesės pusėse, persiklojimas silpnesnis, todėl π ryšys silpnesnis už σ. Viengubasis ryšys yra vienas σ, dvigubasis – σ + π, trigubasis – σ + 2π.',
            'A σ bond forms by overlap of orbitals along the bond axis (axial overlap); the electron density is highest on the line between the nuclei. It is the strongest kind of bond. A π bond forms by lateral overlap of two p orbitals: the electron density lies on both sides of the line, the overlap is poorer, so a π bond is weaker than a σ bond. A single bond is one σ, a double bond is σ + π, a triple bond is σ + 2π.'),
          src: 'L2 p24, p27, T p22'
        },
        {
          p: t('σ ryšį gali sudaryti s, p arba hibridinės orbitalės: $H–H$ yra s–s, $C–H$ metane yra sp³–s, $C–C$ etane yra sp³–sp³. Etene sp² atomai sujungti sp²–sp² σ ryšiu ir π ryšiu, kurį sudaro nehibridinės p orbitalės virš ir po molekulės plokštuma; visi šeši eteno atomai guli vienoje plokštumoje. Etine abu sp atomai sujungti σ ryšiu ir dviem statmenais π ryšiais, molekulė tiesinė, kampas 180°.',
            'A σ bond can be formed from s, p or hybrid orbitals: $H–H$ is s–s, the $C–H$ bond of methane is sp³–s, the $C–C$ bond of ethane is sp³–sp³. In ethene the sp² carbons are joined by an sp²–sp² σ bond and a π bond made of unhybridised p orbitals above and below the molecular plane; all six atoms of ethene lie in one plane. In ethyne the two sp carbons are joined by a σ bond and two perpendicular π bonds, and the molecule is linear with an angle of 180°.'),
          src: 'L2 p25, p28, p29'
        },
        {
          table: {
            head: [t('Junginys', 'Compound'), f('σ'), f('π'), t('Ryšių rūšys', 'Kinds of bonds')],
            rows: [
              [t('etanas $CH3CH3$', 'ethane $CH3CH3$'), f('7'), f('0'), t('1 × C–C (sp³–sp³), 6 × C–H', '1 × C–C (sp³–sp³), 6 × C–H')],
              [t('etenas $CH2=CH2$', 'ethene $CH2=CH2$'), f('5'), f('1'), t('1 × C=C (σ + π), 4 × C–H', '1 × C=C (σ + π), 4 × C–H')],
              [t('etinas $HC≡CH$', 'ethyne $HC≡CH$'), f('3'), f('2'), t('1 × C≡C (σ + 2π), 2 × C–H', '1 × C≡C (σ + 2π), 2 × C–H')]
            ]
          },
          src: 'L2 p26, p28, p29'
        },
        {
          rule: t('σ ryšių skaičiavimas: kiekviena brūkšnelių grupė tarp dviejų atomų (įskaitant $C–H$) duoda lygiai vieną σ ryšį. Neciklinėje molekulėje σ ryšių yra vienu mažiau nei visų atomų (su vandeniliais); kiekvienas žiedas prideda dar vieną. π ryšių skaičius – tai papildomos brūkšnelės dvigubuosiuose (po 1) ir trigubuosiuose (po 2) ryšiuose.',
            'Counting σ bonds: every group of lines between two atoms (including $C–H$) gives exactly one σ bond. In an acyclic molecule there is one σ bond fewer than there are atoms (hydrogens included); every ring adds one. The number of π bonds is the number of extra lines in double bonds (1 each) and triple bonds (2 each).')
        },
        {
          example: {
            q: [{ p: t('Suskaičiuokite σ ir π ryšius pent-3-en-1-ine.', 'How many σ and how many π bonds does pent-3-en-1-yne have?') }, { mol: { smi: 'C#CC=CC', name: t('3-penten-1-inas', 'pent-3-en-1-yne') } }],
            steps: [
              [{ p: t('Formulė $C5H6$: iš viso 11 atomų (5 C ir 6 H). Molekulė neciklinė, todėl σ ryšių yra 11 − 1 = 10.', 'The formula is $C5H6$: 11 atoms in all (5 C and 6 H). The molecule is acyclic, so there are 11 − 1 = 10 σ bonds.') }],
              [{ p: t('Trigubasis ryšys duoda 2 π, dvigubasis – 1 π: iš viso 3 π ryšiai.', 'The triple bond gives 2 π and the double bond 1 π: 3 π bonds in total.') }],
              [{ p: t('Patikrinimas: $C≡C$ (1 σ), $C=C$ (1 σ), du $C–C$ (2 σ), šeši $C–H$ (6 σ): 1 + 1 + 2 + 6 = 10 σ.', 'Check: $C≡C$ (1 σ), $C=C$ (1 σ), two $C–C$ (2 σ), six $C–H$ (6 σ): 1 + 1 + 2 + 6 = 10 σ.') }]
            ]
          },
          claims: [{ sigmaPi: ['C#CC=CC', 10, 3] }, { formula: ['C#CC=CC', 'C5H6'] }]
        },
        {
          pitfall: t('Dažna klaida – skaičiuoti tik $C–C$ ryšius ir pamiršti $C–H$, arba dvigubąjį ryšį laikyti dviem σ ryšiais. Dvigubajame ryšyje tėra vienas σ ryšys ir vienas π.',
            'A common mistake is to count only $C–C$ bonds and forget $C–H$, or to treat a double bond as two σ bonds. A double bond has just one σ bond and one π bond.')
        },
        { h: t('Donorinis-akceptorinis (koordinacinis) ryšys', 'The donor–acceptor (coordinate) bond') },
        {
          p: t('Kovalentinį ryšį galima sudaryti ne tik sujungiant du vienelektronius atomus. Jei vienas atomas atiduoda visą elektronų porą, o kitas turi tuščią orbitalę, susidaro koordinacinis (donorinis-akceptorinis) ryšys. Amoniakas savo azoto laisvąja pora prisijungia protoną ir susidaro amonio jonas, vanduo – oksonio jonas. Susidaręs jis lieka toks pat kaip ir kiti molekulės kovalentiniai ryšiai; skiriasi tik jo kilmė.',
            'A covalent bond does not have to form from two single-electron atoms. If one atom donates the whole electron pair and the other has a vacant orbital, a coordinate (donor–acceptor) bond forms. Ammonia uses the lone pair of nitrogen to bond to a proton and gives the ammonium ion; water gives the oxonium ion. Once formed, the bond is no different from the other covalent bonds of the molecule: only the way it came about differs.'),
          src: 'L2 p42, T p25'
        },
        {
          mech: [
            {
              scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: '[NH4+]' }], maxWidth: 640 },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }],
              note: t('Azoto laisvoji pora tampa $N–H$ ryšiu: amoniakas yra donoras, $H+$ – akceptorius.', 'The lone pair of nitrogen becomes the $N–H$ bond: ammonia is the donor, $H+$ the acceptor.')
            },
            {
              scheme: { items: [{ smi: 'O', opts: { lonePairs: true } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: '[OH3+]' }], maxWidth: 640 },
              arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }],
              note: t('Deguonies laisvoji pora prisijungia protoną: susidaro oksonio jonas.', 'A lone pair of oxygen bonds the proton: the oxonium ion forms.')
            }
          ],
          src: 'L2 p42'
        },
        {
          pitfall: t('Amonio jone visi keturi $N–H$ ryšiai vienodi, nors vienas atsirado kitaip. Teigiamas krūvis priklauso visam jonui (formaliai azotui), o ne „ketvirtam“ vandeniliui.',
            'In the ammonium ion all four $N–H$ bonds are the same, even though one arose differently. The positive charge belongs to the ion as a whole (formally to nitrogen), not to a “fourth” hydrogen.')
        },
        { practice: 'u02.sigmapi' },
        { practice: 'u02.bonds' }
      ]
    },

    /* ------------------------------------------------------------ 4 */
    {
      id: 'energy',
      title: t('Ryšio energija ir ilgis', 'Bond energy and bond length'),
      blocks: [
        { h: t('Kaip stiprus ir kaip ilgas ryšys', 'How strong and how long a bond is') },
        {
          p: t('Ryšio energija – tai energijos kiekis, išsiskiriantis ryšiui susidarant, arba energija, reikalinga dviem sujungtiems atomams atskirti. Kuo ji didesnė, tuo ryšys stipresnis. O ryšio ilgis matuojamas nuo vieno susijungusio branduolio centro iki kito.',
            'Bond energy is the amount of energy released when a bond forms, or needed to separate the two bonded atoms. The larger it is, the stronger the bond. Bond length is the distance between the centres of the two bonded nuclei.'),
          src: 'L2 p31, p32, T p23'
        },
        {
          table: {
            head: [t('Ryšys', 'Bond'), t('Sudėtis', 'Made of'), t('Energija, kJ/mol', 'Energy, kJ/mol'), t('Ilgis, nm', 'Length, nm')],
            rows: [
              [f('C–C (sp³–sp³)'), f('σ'), f('347'), t('0,154', '0.154')],
              [f('C=C (sp²=sp²)'), f('σ + π'), f('606'), t('0,133', '0.133')],
              [f('C≡C ($sp$≡$sp$)'), f('σ + 2π'), f('828'), t('0,120', '0.120')]
            ]
          },
          src: 'L2 p31, T p23'
        },
        {
          p: t('Daugiau ryšių tarp tų pačių atomų reiškia stipresnį ir trumpesnį ryšį. Bet dvigubasis ryšys (606 kJ/mol) yra silpnesnis už du viengubuosius (2 × 347 = 694 kJ/mol): antrasis, π, ryšys prideda apie 259 kJ/mol, o ne 347. Todėl π ryšys nutrūksta lengviau už σ, ir būtent jis dalyvauja daugelyje alkenų bei alkinų reakcijų.',
            'More bonds between the same atoms mean a stronger and shorter bond. But a double bond (606 kJ/mol) is weaker than two single bonds (2 × 347 = 694 kJ/mol): the second, π, bond adds about 259 kJ/mol, not 347. This is why a π bond breaks more easily than a σ bond, and it is the π bond that takes part in many reactions of alkenes and alkynes.'),
          src: 'L2 p27, p31'
        },
        {
          table: {
            head: [t('Ryšys', 'Bond'), t('Ilgis, nm', 'Length, nm'), t('Ryšys', 'Bond'), t('Ilgis, nm', 'Length, nm')],
            rows: [
              [f('C–H (sp³)'), t('0,110', '0.110'), f('C–I'), t('0,213', '0.213')],
              [f('C–H (sp²)'), t('0,107', '0.107'), f('C–N'), t('0,147', '0.147')],
              [f('C–H (sp)'), t('0,106', '0.106'), f('C=N'), t('0,128', '0.128')],
              [f('C–O'), t('0,143', '0.143'), f('C≡N'), t('0,116', '0.116')],
              [f('C=O'), t('0,121', '0.121'), f('C–S'), t('0,181', '0.181')],
              [f('C–F'), t('0,140', '0.140'), f('O–H'), t('0,096', '0.096')],
              [f('C–Cl'), t('0,176', '0.176'), f('N–H'), t('0,101', '0.101')],
              [f('C–Br'), t('0,194', '0.194'), f('S–H'), t('0,130', '0.130')]
            ]
          },
          src: 'L2 p32'
        },
        {
          rule: t('Ryšio ilgio taisyklės: (1) kuo atomas elektroneigiamesnis ir mažesnis, tuo trumpesnis jo ryšys su anglimi: $C–F$ < $C–Cl$ < $C–Br$ < $C–I$; (2) kuo didesnė s orbitalės dalis hibridinėje orbitalėje, tuo ryšys trumpesnis: $C–H$ sp < sp² < sp³, o trigubasis ryšys trumpesnis už dvigubąjį, dvigubasis – už viengubąjį.',
            'Rules for bond length: (1) the more electronegative and smaller the atom, the shorter its bond to carbon: $C–F$ < $C–Cl$ < $C–Br$ < $C–I$; (2) the larger the share of the s orbital in the hybrid orbital, the shorter the bond: $C–H$ sp < sp² < sp³, and a triple bond is shorter than a double bond, which is shorter than a single bond.'),
          src: 'L2 p32'
        },
        {
          pitfall: t('Neapverskite sąsajos: stipresnis ryšys yra trumpesnis, bet „stipresnis“ nereiškia, kad kiekviena jo dalis stipresnė. Dvigubasis ryšys stipresnis už viengubąjį, tačiau jo π dalis silpnesnė už σ.',
            'Do not reverse the link: a stronger bond is a shorter one, but “stronger” does not mean that every part of it is stronger. A double bond is stronger than a single bond, yet its π part is weaker than a σ bond.')
        },
        { practice: 'u02.bonds' }
      ]
    },

    /* ------------------------------------------------------------ 5 */
    {
      id: 'polar',
      title: t('Elektrinis neigiamumas, poliškumas ir joninis ryšys', 'Electronegativity, polarity and the ionic bond'),
      blocks: [
        { h: t('Elektrinis neigiamumas', 'Electronegativity') },
        {
          p: t('Ryšys tampa polinis, kai elektronų tankis pasiskirsto netolygiai, o taip nutinka dėl atomų elektrinio neigiamumo skirtumo. Elektrinis neigiamumas yra atomo geba molekulėje patraukti artyn savęs ryšio elektronus: kuo jis didesnis, tuo stipriau atomas traukia bendrą porą. Pagal Polingo skalę, sudarytą iš ryšių energijų, F turi didžiausią reikšmę (4,0).',
            'Bond polarity comes from an uneven distribution of electron density, and its cause is the different electronegativity of the bonded atoms. Electronegativity is the ability of an atom in a molecule to pull the bonding electrons towards itself: the larger it is, the harder the atom pulls on the shared pair. On the Pauling scale, derived from bond energies, F has the highest value (4.0).'),
          src: 'L2 p33, p34'
        },
        {
          table: {
            head: [f('H'), f('Li'), f('Be'), f('B'), f('C'), f('N'), f('O'), f('F')],
            rows: [[t('2,1', '2.1'), t('1,0', '1.0'), t('1,5', '1.5'), t('2,0', '2.0'), t('2,5', '2.5'), t('3,0', '3.0'), t('3,5', '3.5'), t('4,0', '4.0')]]
          },
          src: 'L2 p35'
        },
        {
          table: {
            head: [f('Na'), f('Mg'), f('Al'), f('Si'), f('P'), f('S'), f('Cl'), f('Br'), f('I')],
            rows: [[t('0,9', '0.9'), t('1,2', '1.2'), t('1,5', '1.5'), t('1,8', '1.8'), t('2,1', '2.1'), t('2,5', '2.5'), t('3,0', '3.0'), t('2,8', '2.8'), t('2,5', '2.5')]]
          },
          caption: t('Elektrinis neigiamumas didėja periode iš kairės į dešinę ir grupėje iš apačios į viršų. Dar: K 0,8.', 'Electronegativity grows along a period from left to right and up a group. Also: K 0.8.'), src: 'L2 p35'
        },
        {
          p: t('Anglies elektrinis neigiamumas priklauso nuo hibridizacijos: kuo daugiau s pobūdžio, tuo jis didesnis. Skalėje eilė tokia: F > O > C(sp) > N, Cl > Br, C(sp²) > I > C(sp³), S > H, P. Skaičiuojant užduotyse, jei nepasakyta kitaip, anglies reikšmė yra 2,5. Skaidrėje 34 nurodyta: C(sp) 3,1, C(sp²) 2,8, C(sp³) 2,5 (vadovėlyje C(sp) 3,2). Jodo reikšmė skaidrėje 34 yra 2,6, o 35 skaidrės lentelėje 2,5; skaičiuodami naudokite lentelę, nes abiem atvejais $C–I$ ryšys nepolinis (ΔEN ≤ 0,1).',
            'The electronegativity of carbon depends on hybridisation: the more s character, the higher it is. On the scale the order is F > O > C(sp) > N, Cl > Br, C(sp²) > I > C(sp³), S > H, P. In calculations, unless told otherwise, take 2.5 for carbon. Slide 34 gives C(sp) 3.1, C(sp²) 2.8, C(sp³) 2.5 (the textbook has C(sp) 3.2). The value for iodine is 2.6 on slide 34 and 2.5 in the table on slide 35; use the table, since either way the $C–I$ bond is nonpolar (ΔEN ≤ 0.1).'),
          src: 'L2 p34'
        },
        { h: t('Nepolinis, polinis ir joninis ryšys', 'Nonpolar, polar and ionic bonds') },
        {
          rule: t('Ryšio tipą lemia atomų elektrinių neigiamumų skirtumas ΔEN. Kai ΔEN < 0,5, ryšys nepolinis kovalentinis; kai jis nuo 0,5 iki maždaug 1,7 (iki 2), ryšys polinis kovalentinis; kai skirtumas viršija šią ribą, ryšys joninis. Kuo didesnis ΔEN, tuo poliškesnis ryšys. Vadovėlyje ribos kitokios (T p24: < 1,5 labiau kovalentinis, > 2,0 labiau joninis); atsakydami remkitės paskaitos ribomis 0,5 ir 1,7 (2). Tarp 1,7 ir 2,0 klausimų nekeliama.',
            'The type of bond is set by the difference ΔEN between the electronegativities of the atoms: below 0.5 – a nonpolar covalent bond; from 0.5 to 1.7 (2) – a polar covalent bond; above 1.7 (2) – an ionic bond. Polarity grows as ΔEN grows. The textbook draws the limits differently (T p24: < 1.5 more covalent, > 2.0 more ionic); in answers use the limits of the lecture, 0.5 and 1.7 (2). Differences between 1.7 and 2.0 are not asked.'),
          src: 'L2 p37, T p24'
        },
        {
          mol: [
            { smi: 'CC', name: t('etanas', 'ethane'), caption: t('C–C: ΔEN = 0, nepolinis', 'C–C: ΔEN = 0, nonpolar') },
            { smi: 'CO', name: t('metanolis', 'methanol'), opts: { deltas: { 0: '+', 1: '-' } }, caption: t('C–O: ΔEN = 1,0, polinis', 'C–O: ΔEN = 1.0, polar') },
            { smi: 'C#[C-].[Na+]', caption: t('natrio acetilidas: ΔEN didelis, joninis', 'sodium acetylide: ΔEN large, ionic') }
          ],
          src: 'L2 p36, p37'
        },
        {
          p: t('Poliniame ryšyje elektronų pora pasislenka link elektroneigiamesnio atomo. Jis įgyja dalinį neigiamą krūvį δ−, kitas atomas – dalinį teigiamą δ+. Poliarizacijos kryptis žymima rodykle, nukreipta į elektroneigiamesnį atomą: $C→Cl$ (L2 p36); ji rodo tą pačią kryptį kaip δ+ → δ−. Dalinis krūvis nėra jonas: tai tik elektronų tankio pokytis. Joniniame ryšyje pora praktiškai visiškai priklauso vienam atomui, susidaro jonai, o juos laiko elektrostatinė trauka.',
            'In a polar bond the electron pair shifts towards the more electronegative atom. That atom gets a partial negative charge δ−, the other atom a partial positive charge δ+. The direction of polarisation is drawn as an arrow pointing to the more electronegative atom: $C→Cl$ (L2 p36); it shows the same direction as δ+ → δ−. A partial charge is not an ion: it is only a shift of electron density. In an ionic bond the pair belongs almost wholly to one atom, ions form, and electrostatic attraction holds them together.'),
          src: 'L2 p36'
        },
        {
          mol: [
            { smi: 'CBr', opts: { deltas: { 0: '+', 1: '-' } }, caption: t('C δ+, Br δ−', 'C δ+, Br δ−') },
            { smi: 'CN', opts: { deltas: { 0: '+', 1: '-' } }, caption: t('C δ+, N δ−', 'C δ+, N δ−') },
            { smi: '[Li]C', opts: { deltas: { 0: '+', 1: '-' } }, caption: t('Li δ+, C δ−', 'Li δ+, C δ−') },
            { smi: 'C[Mg]Br', opts: { deltas: { 0: '-', 1: '+', 2: '-' } }, caption: t('C δ−, Mg δ+, Br δ−', 'C δ−, Mg δ+, Br δ−') }
          ],
          src: 'L2 p36, p52'
        },
        {
          pitfall: t('Kryptį lemia ΔEN, o ne atomų dydis ar vieta formulėje. Anglis yra δ+, kai ji susijungusi su O, N, Cl, Br ar F, bet δ− prie metalų ($Li$, $Mg$) ir silicio. Pagal šias reikšmes $C–S$ ir $C–I$ ryšiai nepoliniai (2,5 ir 2,5): poliškumą ten lemia tik kiti ryšiai, pavyzdžiui, $S–H$. Net ryšys, kurio ΔEN < 0,5 (pvz., $C–Br$ 0,3, $S–H$ 0,4), šiek tiek pasislenka į elektroneigiamesnį atomą, todėl seminare jo kryptis žymima; riba 0,5 tik atskiria ryšius, kurie laikomi nepoliniais.',
            'The direction is set by ΔEN, not by the size of the atoms or their place in the formula. Carbon is δ+ when bonded to O, N, F, Cl or Br, but δ− next to metals ($Li$, $Mg$) and silicon. With these values the $C–S$ and $C–I$ bonds are nonpolar (2.5 and 2.5): any polarity comes from other bonds, for example $S–H$. Even a bond with ΔEN < 0.5 (for example $C–Br$ 0.3, $S–H$ 0.4) shifts slightly towards the more electronegative atom, so its direction is marked in the seminar tasks; the 0.5 limit only separates the bonds that are treated as nonpolar.'),
          src: 'L2 p35, p36'
        },
        {
          example: {
            q: [{ p: t('Nustatykite metanolio ryšių tipus ir pažymėkite dalinius krūvius.', 'Determine the bond types of methanol and mark the partial charges.') }, { mol: { smi: 'CO', name: t('metanolis', 'methanol'), opts: { numbers: 'all' } } }],
            steps: [
              [{ p: t('Ryšys $C–O$ (atomai Nr. 1 ir Nr. 2): EN 2,5 ir 3,5, ΔEN = 1,0, tai polinis kovalentinis ryšys.', 'The $C–O$ bond (atoms no. 1 and no. 2): EN 2.5 and 3.5, ΔEN = 1.0, a polar covalent bond.') }],
              [{ p: t('Elektronai pasislenka į elektroneigiamesnį deguonį: atomas Nr. 2 yra δ−, atomas Nr. 1 – δ+. Ryšys $O–H$ (3,5 ir 2,1, ΔEN = 1,4) irgi polinis: vandenilis δ+.', 'The electrons shift to the more electronegative oxygen: atom no. 2 is δ−, atom no. 1 is δ+. The $O–H$ bond (3.5 and 2.1, ΔEN = 1.4) is polar as well: hydrogen is δ+.') }],
              [{ p: t('$C–H$ (ΔEN = 0,4) pagal 0,5 ribą laikomas nepoliniu.', '$C–H$ (ΔEN = 0.4) counts as nonpolar by the 0.5 limit.') }, { mol: { smi: 'CO', opts: { deltas: { 0: '+', 1: '-' } } } }]
            ]
          },
          claims: [{ name: ['CO', { lt: 'metanolis', en: 'methanol' }] }]
        },
        { h: t('Joniniai junginiai organinėje chemijoje', 'Ionic compounds in organic chemistry') },
        {
          p: t('Organinių rūgščių ir alkoholių druskos yra joninės: tarp metalo katijono ir deguonies anijono veikia joninis ryšys, o pačiame anijone visi ryšiai kovalentiniai. Kalio acetate ($CH3COOK$) joninis ryšys yra tarp $K+$ ir $O−$, o $C–H$, $C–C$ bei abu $C–O$ ryšiai yra kovalentiniai (du $C–O$ ryšiai anijone yra poliniai).',
            'Salts of organic acids and alcohols are ionic: an ionic bond acts between the metal cation and the oxygen anion, while all bonds inside the anion are covalent. In potassium acetate ($CH3COOK$) the ionic bond is between $K+$ and $O−$, and $C–H$, $C–C$ and both $C–O$ bonds are covalent (the two $C–O$ bonds in the anion are polar).'),
          src: 'L2 p36, p52'
        },
        {
          mol: [
            { smi: 'CC(=O)[O-].[K+]', name: t('kalio etanoatas', 'potassium ethanoate'), caption: t('kalio acetatas', 'potassium acetate') },
            { smi: 'CC[O-].[Na+]', caption: t('natrio etanoliatas', 'sodium ethoxide') },
            { smi: 'C[O-].[Na+]', caption: t('natrio metanoliatas', 'sodium methoxide') }
          ],
          src: 'S2.4, L2 p52'
        },
        { h: t('Molekulės poliškumas', 'Polarity of a molecule') },
        {
          p: t('Molekulė su poliniais ryšiais nebūtinai yra polinė. Molekulės dipolio momentas μ (vienetas – debajus, D) lygus atskirų ryšių dipolių vektorinei sumai. Simetriškoje molekulėje dipoliai vienas kitą panaikina ir μ = 0, nors ryšiai poliniai: $CO2$ (tiesinė), $BF3$ (plokščias trikampis), $CCl4$ (tetraedras). Vanduo (1,85 D), amoniakas (1,47 D) ir chlormetanas (1,87 D) yra polinės molekulės, nes ryšių dipoliai nesusinaikina.',
            'A molecule with polar bonds is not necessarily polar. Its dipole moment μ (measured in debye, D) is the vector sum of the bond dipoles. In a symmetric molecule the dipoles cancel and μ = 0 although the bonds are polar: $CO2$ (linear), $BF3$ (flat triangle), $CCl4$ (tetrahedron). Water (1.85 D), ammonia (1.47 D) and chloromethane (1.87 D) are polar molecules because the bond dipoles do not cancel.'),
          src: 'L2 p38, p39'
        },
        {
          mol: [
            { smi: 'O=C=O', opts: { deltas: { 0: '-', 1: '+', 2: '-' } }, caption: t('CO₂: μ = 0', 'CO₂: μ = 0') },
            { smi: 'FB(F)F', opts: { deltas: { 0: '-', 1: '+', 2: '-', 3: '-' } }, caption: t('BF₃: μ = 0', 'BF₃: μ = 0') },
            { smi: 'ClC(Cl)(Cl)Cl', name: t('tetrachlormetanas', 'tetrachloromethane'), opts: { deltas: { 0: '-', 1: '+', 2: '-', 3: '-', 4: '-' } }, caption: t('CCl₄: μ = 0', 'CCl₄: μ = 0') }
          ],
          src: 'L2 p38'
        },
        {
          p: t('Junginių dipolio momentų reikšmės nepatikimai rodo, kuris junginys poliškesnis, todėl praktikoje poliškumui palyginti naudojamos dielektrinės konstantos ε: kuo jos didesnė, tuo junginys poliškesnis.',
            'Dipole moments are an unreliable guide to which compound is more polar, so in practice polarity is compared by the dielectric constants ε: the larger ε is, the more polar the compound.'),
          src: 'L2 p40'
        },
        {
          table: {
            head: [t('Tirpiklis', 'Solvent'), f('ε'), t('Tirpiklis', 'Solvent'), f('ε')],
            rows: [
              [t('benzenas', 'benzene'), t('2,3', '2.3'), t('metanolis', 'methanol'), t('32,7', '32.7')],
              [t('dietileteris', 'diethyl ether'), t('4,3', '4.3'), t('dimetilformamidas (DMF)', 'dimethylformamide (DMF)'), t('36,7', '36.7')],
              [t('tetrahidrofuranas (THF)', 'tetrahydrofuran (THF)'), t('7,6', '7.6'), t('acetonitrilas', 'acetonitrile'), t('37,5', '37.5')],
              [t('dichlormetanas', 'dichloromethane'), t('9,1', '9.1'), t('vanduo', 'water'), t('78,4', '78.4')],
              [t('etanolis', 'ethanol'), t('24,3', '24.3'), t('formamidas', 'formamide'), f('109')]
            ]
          },
          caption: t('Skirtingų tirpiklių dielektrinė konstanta ε (apie 293–303 K).', 'Dielectric constants of some solvents (about 293–303 K).'), src: 'L2 p40'
        },
        { h: t('Poliarizuojamumas', 'Polarisability') },
        {
          p: t('Poliarizuojamumas rodo, kaip lengvai ryšio elektronai pasislenka veikiami išorinio elektrinio lauko ar artėjančios reaguojančios dalelės. Jį lemia elektronų judrumas: kuo elektronai toliau nuo branduolių, tuo jie judresni. Todėl π ryšys poliarizuojasi daug lengviau už σ, o didesnio atomo sudarytas ryšys (pavyzdžiui, $C–I$ prieš $C–F$) poliarizuojasi lengviau.',
            'The polarisability of a bond is the ability of its electrons to shift under an external electric field or an approaching reagent. It depends on how mobile the electrons are: the farther they are from the nuclei, the more mobile. So a π bond is polarised far more easily than a σ bond, and a bond formed by a larger atom (for example $C–I$ against $C–F$) is polarised more easily.'),
          src: 'L2 p41'
        },
        {
          pitfall: t('Poliškumas ir poliarizuojamumas – skirtingos savybės. Poliškumas yra pastovus ir priklauso nuo ΔEN, poliarizuojamumas – tai ryšio gebėjimas deformuotis veikiant kitai dalelei. $C–F$ yra labai polinis, bet silpnai poliarizuojamas; $C–I$ beveik nepolinis, bet lengvai poliarizuojamas.',
            'Polarity and polarisability are different properties. Polarity is permanent and depends on ΔEN, while polarisability is how readily the bond is deformed by another particle. $C–F$ is very polar but only weakly polarisable; $C–I$ is almost nonpolar but easily polarisable.'),
          src: 'L2 p41'
        },
        { practice: 'u02.bondtype' },
        { practice: 'u02.ionic' },
        { practice: 'u02.polar' },
        { practice: 'u02.morepolar' }
      ]
    },

    /* ------------------------------------------------------------ 6 */
    {
      id: 'hbond',
      title: t('Vandeniliniai ryšiai', 'Hydrogen bonds'),
      blocks: [
        { h: t('Kaip susidaro vandenilinis ryšys', 'How a hydrogen bond forms') },
        {
          p: t('Vandenilis, prijungtas prie labai elektroneigiamo atomo (N, O, F), netenka dalies elektronų tankio (δ+) ir traukiamas kito tokio atomo laisvosios poros, tarsi tiltas tarp dviejų atomų. Ši sąveika vadinama vandeniliniu ryšiu ir žymima taškais ar punktyru: $Z–H···:Z$, kur $Z$ yra N, O arba F.',
            'A hydrogen atom bonded to a highly electronegative atom (N, O, F) is electron-deficient (δ+). It can interact with a lone pair on another highly electronegative atom, as if linking the two atoms. This is a hydrogen bond, drawn as dots or a dashed line: $Z–H···:Z$, where $Z$ is N, O or F.'),
          src: 'L2 p43, T p25'
        },
        {
          rule: t('Vandenilinio ryšio donoras yra $X–H$ grupė, kurioje $X$ yra N, O (ar F): jos vandenilis δ+. Akceptorius yra N, O (ar F) atomas su laisvąja elektronų pora. Dažniausios poros: $O–H···O$, $O–H···O=C$, $O–H···N$, $N–H···O$, $N–H···O=C$, $N–H···N$. $C–H$ ryšys vandenilinio ryšio nesudaro.',
            'The donor of a hydrogen bond is an $X–H$ group in which $X$ is N or O (or F): its hydrogen is δ+. The acceptor is an N or O (or F) atom with a lone pair. The commonest pairs are $O–H···O$, $O–H···O=C$, $O–H···N$, $N–H···O$, $N–H···O=C$ and $N–H···N$. A $C–H$ bond does not form hydrogen bonds.'),
          src: 'L2 p43, p44'
        },
        {
          p: t('Vandenilinis ryšys silpnas: jo energija 10–40 kJ/mol, daug mažesnė už kovalentinio ($C–C$: 347 kJ/mol). Tačiau ryšių daug, todėl jie stipriai veikia junginių savybes.',
            'The energy of a hydrogen bond is small, 10–40 kJ/mol, far below that of a covalent bond ($C–C$: 347 kJ/mol). But there are many of them, so they have a strong effect on the properties of compounds.'),
          src: 'L2 p44'
        },
        {
          mol: [
            { smi: 'CCO', name: t('etanolis', 'ethanol'), opts: { lonePairs: true }, caption: t('1 donoras $O–H$, 2 laisvosios poros', '1 donor $O–H$, 2 lone pairs') },
            { smi: 'COC', opts: { lonePairs: true }, caption: t('2 laisvosios poros, donoro nėra', '2 lone pairs, no donor') },
            { smi: 'CN', name: t('metanaminas', 'methanamine'), opts: { lonePairs: true }, caption: t('2 donorai $N–H$, 1 laisvoji pora', '2 donors $N–H$, 1 lone pair') }
          ],
          src: 'L2 p44'
        },
        {
          rule: t('Didžiausias vandenilinių ryšių skaičius, kurį viena molekulė gali turėti su savo rūšies molekulėmis, lygus donorinių vandenilių ($N–H$, $O–H$) ir akceptorių laisvųjų porų ($N$, $O$) skaičių sumai, jei yra bent vienas donoras; be donoro – nė vieno. Vanduo gali sudaryti 4: du per $H$ ir du per deguonies laisvąsias poras. Tai skaičiavimo susitarimas, kaip vandens atveju 45 skaidrėje.',
            'The largest number of hydrogen bonds one molecule can form with identical molecules = the number of donor hydrogens ($N–H$, $O–H$) + the number of acceptor lone pairs ($N$, $O$), if there is at least one donor; with no donor, none. Water can form 4: two through its $H$ atoms and two through the lone pairs of oxygen. This is a counting convention, as for water on slide 45.'),
          src: 'L2 p45, p46'
        },
        {
          table: {
            head: [t('Junginys', 'Compound'), t('Donoriniai $H$', 'Donor $H$'), t('Poros ($N$, $O$)', 'Pairs ($N$, $O$)'), t('Daugiausia ryšių', 'Most bonds')],
            rows: [
              [f('$H2O$'), f('2'), f('2'), f('4')],
              [f('$NH3$'), f('3'), f('1'), f('4')],
              [f('$C2H5OH$'), f('1'), f('2'), f('3')],
              [f('$CH3NH2$'), f('2'), f('1'), f('3')],
              [f('$(CH3)2NH$'), f('1'), f('1'), f('2')],
              [f('$CH3OCH3$'), f('0'), f('2'), f('0')],
              [f('$CH3CHO$'), f('0'), f('2'), f('0')],
              [f('$CH3SH$'), f('0'), f('0'), f('0')],
              [f('$C3H8$'), f('0'), f('0'), f('0')]
            ]
          },
          caption: t('Tokiomis pat molekulėmis: eteris ir aldehidas turi laisvųjų porų, bet neturi donoro $H$, todėl tarpusavyje vandenilinių ryšių nesudaro. Tioliuose $S–H$ netraktuojamas kaip donoras (Z yra N, O, F).', 'With identical molecules: an ether and an aldehyde have lone pairs but no donor $H$, so they form no hydrogen bonds with each other. In thiols $S–H$ is not treated as a donor (Z is N, O, F).'), src: 'L2 p43, p45'
        },
        { h: t('Vandeniliniai ryšiai ir junginių savybės', 'Hydrogen bonds and the properties of compounds') },
        {
          p: t('Dėl tarpmolekulinių vandenilinių ryšių alkoholių molekulės asocijuojasi. Todėl vandenilinių ryšių susidarymas stipriai veikia fizikines (virimo ir lydymosi temperatūrą, klampumą, spektrus) ir chemines (rūgštines–bazines) savybes. Etanolio virimo temperatūra yra 78,4 °C, o to paties santykinės molekulinės masės dimetileterio, kuris nesuasocijuoja, – −23 °C.',
            'Because of intermolecular hydrogen bonds, alcohol molecules associate. So hydrogen bonding has a large effect on physical properties (boiling and melting point, viscosity, spectra) and chemical (acid–base) properties. Ethanol boils at 78.4 °C, while dimethyl ether, of the same molecular mass but unable to associate, boils at −23 °C.'),
          src: 'L2 p47'
        },
        {
          mol: [
            { smi: 'CCO', name: t('etanolis', 'ethanol'), caption: t('virimo temp. 78,4 °C', 'boiling point 78.4 °C') },
            { smi: 'COC', name: t('metoksimetanas', 'methoxymethane'), caption: t('virimo temp. −23 °C (dimetileteris)', 'boiling point −23 °C (dimethyl ether)') }
          ],
          src: 'L2 p47'
        },
        {
          p: t('Junginys gali sąveikauti su tirpikliu, sudarydamas tarpmolekulinius vandenilinius ryšius: tai solvatacija, o su vandeniu – hidratacija. Todėl alkoholiai vandeniniuose tirpaluose hidratuojasi. Net eteris, neturintis donoro, iš dalies tirpsta vandenyje: jo deguonies laisvosios poros priima vandens vandenilius.',
            'A compound can interact with a solvent by forming intermolecular hydrogen bonds: this is solvation, and with water it is hydration. Therefore alcohols are hydrated in aqueous solution. Even an ether, which has no donor, dissolves in water to some extent: the lone pairs of its oxygen accept hydrogens of water.'),
          src: 'T p26'
        },
        { h: t('Vidiniai molekuliniai vandeniliniai ryšiai', 'Intramolecular hydrogen bonds') },
        {
          p: t('Vandenilinis ryšys gali susidaryti ir toje pačioje molekulėje, jei susiformuoja šešianarė (rečiau penkianarė) ciklinė sistema. Pavyzdžiui, salicilo rūgštyje fenolio $OH$ vandenilis jungiasi su karboksilo grupės deguonimi, todėl ši rūgštis žymiai rūgštesnė už kitus savo izomerus.',
            'A hydrogen bond can also form within one molecule if a six-membered (more rarely five-membered) ring can close. In salicylic acid, for example, the hydrogen of the phenolic $OH$ bonds to oxygen of the carboxyl group, so this acid is markedly more acidic than its other isomers.'),
          src: 'L2 p49, T p26'
        },
        { mol: { smi: 'OC(=O)c1ccccc1O', caption: t('salicilo rūgštis: $O–H···O=C$ šešianariame cikle', 'salicylic acid: $O–H···O=C$ in a six-membered ring') }, src: 'L2 p49' },
        {
          p: t('Vandeniliniai ryšiai svarbūs ir gyvuosiuose organizmuose: jie laiko baltymų spiralę ir sujungia DNR grandines. Vaistai, pavyzdžiui, atorvastatinas, veikia, sudarydami vandenilinius ryšius su fermento aktyviuoju centru.',
            'Hydrogen bonds matter in living organisms too: they hold the helix of a protein together and join the strands of DNA. Drugs such as atorvastatin work by forming hydrogen bonds with the active site of an enzyme.'),
          src: 'L2 p50, p51'
        },
        {
          pitfall: t('Vandenilinis ryšys nėra kovalentinis: jis vaizduojamas punktyru, nėra molekulės formulės dalis ir yra maždaug dešimt kartų silpnesnis. Jis taip pat nesusidaro su anglimi ($C–H$), o virimo metu nutrūksta tarpmolekuliniai vandeniliniai ryšiai, o ne kovalentiniai.',
            'A hydrogen bond is not covalent: it is drawn dotted, it is not part of the molecular formula, and it is about ten times weaker. It does not form with carbon ($C–H$) either, and on boiling it is the intermolecular hydrogen bonds that break, not covalent bonds.'),
          src: 'L2 p44'
        },
        {
          example: {
            q: [{ p: t('Kiek vandenilinių ryšių didžiausiai gali sudaryti metilamino molekulė su kitomis metilamino molekulėmis?', 'How many hydrogen bonds can one methylamine molecule form at most with other methylamine molecules?') }, { mol: { smi: 'CN', name: t('metanaminas', 'methanamine'), opts: { lonePairs: true } } }],
            steps: [
              [{ p: t('Donoriniai vandeniliai: $NH2$ grupėje du $N–H$, taigi 2 ryšiai per $H$.', 'Donor hydrogens: the $NH2$ group has two $N–H$, so 2 bonds through $H$.') }],
              [{ p: t('Akceptorius: azotas turi vieną laisvąją porą, taigi dar 1 ryšys.', 'Acceptor: nitrogen has one lone pair, so 1 more bond.') }],
              [{ p: t('Donoras yra, todėl skaičiuojame viską: 2 + 1 = 3.', 'There is a donor, so we count everything: 2 + 1 = 3.') }]
            ]
          },
          claims: [{ formula: ['CN', 'CH5N'] }]
        },
        { practice: 'u02.hbond' },
        { practice: 'u02.hbondwhy' }
      ]
    }
  ];

  /* ====================================================================== summary */
  const SUMMARY = [
    { h: t('Santrauka', 'Summary') },
    {
      table: {
        head: [t('Hibridizacija', 'Hybridisation'), t('Ryšiai C atome', 'Bonds on the C atom'), t('Kampas ir forma', 'Angle and shape'), t('Pavyzdys', 'Example')],
        rows: [
          [f('sp³'), t('4 viengubieji (4 σ)', '4 single (4 σ)'), t('109,5°, tetraedras', '109.5°, tetrahedron'), f('$CH3–CH3$')],
          [f('sp²'), t('1 dvigubasis + 2 viengubieji (3 σ + π)', '1 double + 2 single (3 σ + π)'), t('120°, plokščia', '120°, planar'), f('$CH2=CH2$')],
          [f('sp'), t('1 trigubasis + 1 viengubasis arba 2 dvigubieji (2 σ + 2 π)', '1 triple + 1 single, or 2 double (2 σ + 2 π)'), t('180°, tiesė', '180°, linear'), f('$HC≡CH$')]
        ]
      },
      src: 'L2 p18'
    },
    {
      list: [
        t('Konfigūracija: C 1s²2s²2p², N 1s²2s²2p³, O 1s²2s²2p⁴. Pagal Hundo taisyklę 2p elektronai pirma užima orbitales po vieną. C sužadintas 1s²2s¹2p³ turi 4 nesuporuotus elektronus.', 'Configuration: C 1s²2s²2p², N 1s²2s²2p³, O 1s²2s²2p⁴. By Hund’s rule 2p electrons first occupy the orbitals singly. Excited C, 1s²2s¹2p³, has 4 unpaired electrons.'),
        t('Valentingumas: C 4, N 3, O 2, H ir halogenai 1. Oktetų taisyklė: 8 valentiniai elektronai (C, N, O, F); S ir P gali daugiau.', 'Valence: C 4, N 3, O 2, H and halogens 1. Octet rule: 8 valence electrons (C, N, O, F); S and P can have more.'),
        t('σ ryšys – ašinis persidengimas, patvariausias; π – šoninis p orbitalių persiklojimas, silpnesnis ir lengviau poliarizuojamas. Dvigubasis = σ + π, trigubasis = σ + 2π. Neciklinėje molekulėje σ = (atomų skaičius) − 1.', 'σ bond: axial overlap, the strongest; π bond: lateral overlap of p orbitals, weaker and more easily polarised. Double = σ + π, triple = σ + 2π. In an acyclic molecule σ = (number of atoms) − 1.'),
        t('Energija: C–C 347, C=C 606, C≡C 828 kJ/mol; ilgis: 0,154 > 0,133 > 0,120 nm. Kuo daugiau s pobūdžio, tuo trumpesnis ryšys (C–H: sp < sp² < sp³). C–F < C–Cl < C–Br < C–I.', 'Energy: C–C 347, C=C 606, C≡C 828 kJ/mol; length 0.154 > 0.133 > 0.120 nm. The more s character, the shorter the bond (C–H: sp < sp² < sp³). C–F < C–Cl < C–Br < C–I.'),
        t('Elektrinis neigiamumas: F 4,0 > O 3,5 > N, Cl 3,0 > Br 2,8 > C, S, I 2,5 > H, P 2,1. ΔEN < 0,5 – nepolinis kovalentinis; toliau iki ~1,7–2 – polinis; didesnis – joninis. δ− ant elektroneigiamesnio atomo.', 'Electronegativity: F 4.0 > O 3.5 > N, Cl 3.0 > Br 2.8 > C, S, I 2.5 > H, P 2.1. ΔEN < 0.5 nonpolar; 0.5–1.7 (2) polar; > 1.7 (2) ionic. δ− on the more electronegative atom.'),
        t('Simetrinės molekulės ($CO2$, $BF3$, $CCl4$) nepolinės (μ = 0). Poliškumą palygina dielektrinė konstanta ε.', 'Symmetric molecules ($CO2$, $BF3$, $CCl4$) are nonpolar (μ = 0). Polarity is compared by the dielectric constant ε.'),
        t('Koordinacinis ryšys: donorius duoda porą, akceptorius – tuščią orbitalę ($NH3 + H+ → NH4+$).', 'Coordinate bond: the donor gives the pair, the acceptor a vacant orbital ($NH3 + H+ → NH4+$).'),
        t('Vandenilinis ryšys: $X–H···:Z$, X, Z = N, O (F); 10–40 kJ/mol. Didž. skaičius = donoriniai $H$ + laisvosios poros, jei yra donoras; vanduo – 4. Jis didina virimo temperatūrą ir tirpumą vandenyje.', 'Hydrogen bond: $X–H···:Z$, X, Z = N, O (F); 10–40 kJ/mol. Maximum = donor $H$ + lone pairs, if there is a donor; water – 4. It raises the boiling point and the solubility in water.')
      ]
    }
  ];


  // bonds of a covalent molecule with the electronegativity difference: {i, j (null for a bond to hydrogen), a, b (elements), order, d}
  const bondList = (m) => {
    const out = [];
    m.bonds.forEach((b) => {
      const a = m.atoms[b.a].el, c = m.atoms[b.b].el;
      if (EN[a] !== undefined && EN[c] !== undefined) out.push({ i: b.a, j: b.b, a, b: c, order: b.order });
    });
    m.atoms.forEach((at, i) => { if (at.h > 0 && EN[at.el] !== undefined) out.push({ i, j: null, a: at.el, b: 'H', order: 1 }); });
    out.forEach((x) => { x.d = r1(Math.abs(EN[x.a] - EN[x.b])); });
    return out;
  };

  // molecules for the bond-type and polarity generators
  const BT_COV = ['CO', 'CCO', 'COC', 'CC=O', 'CC(C)=O', 'ClCl', 'BrBr', 'C[Mg]Br', 'C[Si](C)(C)C', 'CSC', 'CS', 'CI', 'CC', 'C=C', 'C#C', 'NN', 'OO', 'CN', 'CCN', 'CNC', 'CC(=O)O', 'Cl', 'Br', 'O', 'N',
    'NCC(=O)O', 'CCS', 'CCI', 'CC=CC', 'CC(C)O', 'OCCO'];
  const BT_IONIC = ['CC[O-].[Na+]', 'C[O-].[Na+]', 'CC(=O)[O-].[K+]', 'CC(=O)[O-].[Na+]', '[Na+].[Cl-]', 'CC(C)(C)[O-].[K+]', 'C[O-].[Li+]', 'O=C[O-].[Na+]'];
  const PL_MOLS = ['CBr', 'CCl', 'CF', 'CN', 'CO', 'CCO', 'COC', '[Li]C', 'C[Mg]Br', 'C[Si](C)(C)C', 'CC=O', 'CC#N', 'CCN', 'CC(=O)Cl', 'ClC(Cl)Cl', 'O', 'N', 'CC(=O)O', 'NCC', 'CCBr', 'CC(C)Cl', 'C=CCl', 'CC(C)=O', 'CNC',
    'ClCCl', 'CS', 'OCCO', 'CC(C)(C)Br'];
  // bond labels for "which is more polar": [label, element, element]
  const MP_BONDS = [['H3C–Cl', 'C', 'Cl'], ['Cl–Cl', 'Cl', 'Cl'], ['H3C–H', 'C', 'H'], ['H–Cl', 'H', 'Cl'], ['HO–CH3', 'O', 'C'], ['(CH3)3Si–CH3', 'Si', 'C'], ['H3C–Li', 'C', 'Li'],
    ['H3C–MgBr', 'C', 'Mg'], ['H3C–Br', 'C', 'Br'], ['H3C–F', 'C', 'F'], ['H2N–H', 'N', 'H'], ['HO–H', 'O', 'H'], ['H3C–NH2', 'C', 'N'], ['H3C–SH', 'C', 'S'], ['H3C–I', 'C', 'I'], ['H–F', 'H', 'F'],
    ['H–Br', 'H', 'Br'], ['H3C–CH3', 'C', 'C'], ['Br–Br', 'Br', 'Br'], ['H3C–SiH3', 'C', 'Si']];
  // molecules for the hydrogen-bond generator
  const HB = ['O', 'N', 'CO', 'CCO', 'CCCO', 'CC(C)O', 'CCCCO', 'CC(C)(C)O', 'CN', 'CCN', 'CCCN', 'CC(C)N', 'CNC', 'CCNCC', 'CN(C)C', 'CCN(CC)CC', 'COC', 'CCOCC', 'CCOC', 'CC=O', 'CCC=O', 'CC(C)=O', 'CCC(C)=O',
    'CCC', 'CCCC', 'C=CC', 'C#CC', 'CS', 'CCS', 'CSC', 'OCCO', 'NCCN', 'NCCO', 'C1CCCCC1', 'c1ccccc1', 'CCCCCO', 'CCCCCN', 'CC(C)OC', 'CC(=O)OC', 'CC#N', 'CCCl'];

  // a bank problem for the ionic/covalent type: statements = [[text, true|false], ...]; nIon = ionic bonds per formula unit
  function ionProblem(n, smi, caption, stmts, nIonStep, why, fsmi, fform) {
    const right = stmts.map((s, i) => (s[1] ? i : -1)).filter((i) => i >= 0);
    const nIon = fsmi.indexOf('.') >= 0 ? 1 : 0;
    return {
      id: 'u02.ionic.' + n,
      q: [{ p: t('Pateiktas junginys.', 'A compound is shown.') }, { mol: { smi, caption } }],
      steps: [
        {
          prompt: t('Pažymėkite visus teisingus teiginius apie ryšius šiame junginyje.', 'Pick every true statement about the bonds in this compound.'),
          kind: 'multi', options: stmts.map((s) => ({ text: s[0] })), answer: right,
          hint: t('Pagal elektrinių neigiamumų skirtumą nuspręskite, ar atomų pora dalijasi elektronais, ar atiduoda juos visiškai (susidaro jonai).', 'Use the electronegativity difference to decide whether the atoms share electrons or hand them over completely (ions form).'),
          solution: why
        },
        {
          prompt: t('Kiek joninių ryšių yra vienoje junginio formulinėje vienetoje?', 'How many ionic bonds are there in one formula unit of the compound?'),
          kind: 'number', answer: { value: nIon, tol: 0 },
          hint: t('Ieškokite metalo katijono arba kito atskiro jono.', 'Look for a metal cation or another separate ion.'),
          solution: nIon ? t('Vienas: tarp katijono ir anijono. Visi kiti junginio ryšiai kovalentiniai.', 'One: between the cation and the anion. All the other bonds in the compound are covalent.') : t('Nė vieno: visi ryšiai kovalentiniai (polinių arba nepolinių).', 'None: all the bonds are covalent (polar or nonpolar).')
        }
      ],
      why,
      src: 'S2.4, L2 p36, p37',
      claims: [{ formula: [fsmi, fform] }]
    };
  }

  /* ====================================================================== pools and helpers for the types */
  const AT = { H: 1, C: 6, N: 7, O: 8, F: 9 };
  const SUP = ['', '¹', '²', '³', '⁴', '⁵', '⁶'];
  const NUM_LT = ['nulį', 'vieną', 'du', 'tris', 'keturis', 'penkis', 'šešis', 'septynis', 'aštuonis'];
  const NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const andJoin = (arr, w) => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' ' + w + ' ' + arr[arr.length - 1]);

  // skeletal pools (all drawn without ring-closure double bonds and inside the validator's drawing limits)
  const VPOOL = ['CC', 'CCO', 'ClC(Cl)(Cl)Cl', 'CC#N', 'C=C', 'C#C', 'CN', 'CCN', 'COC', 'CC=O', 'CC(=O)O', 'CCCl', 'CBr', 'CC(C)Cl', 'C=CC', 'OCCO', 'CCS', 'CNC',
    'CN(C)C', 'C=CCl', 'CC(C)O', 'CC(C)=O', 'C=CC=C', 'CC(C)(C)Cl', 'NCC(=O)O', 'CCCC', 'CC(C)C', 'C1CC1', 'C1CCCCC1', 'CC#C', 'C=O', 'CCC#N', 'FC(F)F', 'CCBr',
    'CCOCC', 'CCC=O', 'CC(C)N', 'C=CC#N', 'ClCCCl', 'CCC(C)=O', 'CCCO', 'CSC', 'CC(Cl)Cl', 'ClCCl'];

  // hybridisation pool: hydrocarbons and heteroatom compounds whose N and O hybridisation the course states
  const HP = ['C#CCC=CCC', 'C=C=C=C=C', 'C#CC=CC#C', 'C1=CCC=C1', 'CC=CC#C', 'C=CC=C', 'CC#CC', 'C=C=C', 'CC(C)=C', 'C#CCC#C', 'C=CC#C', 'CCC#C', 'C=C=CC',
    'CC=CC=CC', 'C1=CCCCC1', 'CC1=CCCC1', 'C=CC(C)=C', 'CCC=C', 'CC#CCC', 'C=CCC=C', 'CC=C=CC', 'c1ccccc1', 'Cc1ccccc1', 'C=Cc1ccccc1',
    'CC#N', 'CC=O', 'CCO', 'COC', 'CN', 'CC(C)=O', 'C=CC#N', 'C=CCO', 'CC=N', 'CC(N)=O', 'C=CC=O', 'C#CCO', 'C=CCN', 'CCN', 'CNC', 'CC(C)O', 'C#CC=O'];

  // σ/π pool: no aromatic rings (the bond tap needs plain double and triple bonds)
  const SPOOL = ['C#CCC=CCC', 'C=C=C=C=C', 'C#CC=CC#C', 'C1=CCC=C1', 'CC=CC#C', 'C=CC=C', 'CC#CC', 'C=C=C', 'CC(C)=C', 'C#CCC#C', 'C=CC#C', 'CCC#C',
    'C=C=CC', 'CC=CC=CC', 'C1=CCCCC1', 'CC1=CCCC1', 'CCC=C', 'C=CCC=C', 'C=C', 'C#C', 'CC', 'C', 'CC=C', 'C1CC1', 'C1CCC1', 'C=CC#N', 'CC#N', 'O=C=O', 'CC=O', 'CC(C)=O',
    'C=CC=O', 'CCO', 'CN', 'C=CCO', 'CC#CC=C', 'C#CC#C', 'C=C=CC=C', 'C1=CC=CC1', 'CC(=O)CC', 'C=CC=CC=C', 'C=CCl', 'CC1=CC1', 'C1CC=CCC1', 'C#CC=C'];

  // groups of hydrocarbons for "which one has this hybridisation": grouped by formula at run time
  const FH = ['CC#C', 'C=C=C', 'C1=CC1', 'CC=C', 'C1CC1',
    'CC#CC', 'C=CC=C', 'C=C=CC', 'C1=CCC1', 'C=C1CC1', 'C#CCC',
    'CC=CC', 'C1CCC1', 'CC1CC1', 'CC(C)=C', 'C=CCC',
    'C#CC=C', 'C1=CC=C1',
    'CC#CCC', 'C=CC=CC', 'C=C=CCC', 'C1=CCCC1', 'C#CCCC', 'C=CCC=C',
    'C#CC=CC', 'C1=CC=CC1', 'C=C=CC=C', 'C#CC1CC1',
    'c1ccccc1', 'C#CCCC#C', 'C#CC=CC=C', 'C=C=CC=C=C',
    'C1CCC=CC1', 'CC#CCCC', 'C=CC=CCC', 'C=C=CCCC'];

  // atoms of every compound that carry a hydrogen of a donor group
  const donorH = (m) => m.atoms.reduce((s, a) => s + ((a.el === 'N' || a.el === 'O') ? a.h : 0), 0);

  /* ====================================================================== exercise types */
  const hybWords = (c) => [[c.sp, 'sp'], [c.sp2, 'sp²'], [c.sp3, 'sp³']].filter((x) => x[0] > 0).map((x) => x[0] + ' × ' + x[1]).join(', ');
  let fhCache = null;
  const fhInfo = (ctx) => {
    if (fhCache) return fhCache;
    fhCache = FH.map((smi) => {
      const m = ctx.chem.parse(smi);
      const c = { sp: 0, sp2: 0, sp3: 0 };
      m.atoms.forEach((a, i) => { if (a.el === 'C') c[ctx.chem.hybridization(m, i)]++; });
      return { smi, formula: ctx.chem.formulaString(m), c, sig: c.sp3 + '/' + c.sp2 + '/' + c.sp, pi: ctx.chem.bondCounts(m).pi };
    });
    return fhCache;
  };

  const TYPES = [
    /* ============================================================ u02.config */
    {
      id: 'u02.config',
      title: t('Atomo elektronų konfigūracija ir valentingumas', 'Electron configuration and valence of an atom'),
      mirrors: [],
      gen(rng, ctx) {
        const sym = ctx.pick(Object.keys(AT));
        const z = AT[sym];
        const box = (v) => (v === 0 ? '[ ]' : v === 1 ? '[↑]' : v === 2 ? '[↑↓]' : '[↑↑]');
        const diag = (o) => '1s ' + box(o.s1) + '  2s ' + box(o.s2) + '  2p ' + o.p.map(box).join(' ');
        const fillP = (n, pairFirst) => { const p = [0, 0, 0]; for (let i = 0; i < n; i++) p[pairFirst ? Math.floor(i / 2) : i % 3]++; return p; };
        const build = (zz, pairFirst) => ({ s1: Math.min(zz, 2), s2: Math.min(Math.max(zz - 2, 0), 2), p: fillP(Math.max(zz - 4, 0), pairFirst) });
        const cfg = (o) => '1s' + SUP[o.s1] + (o.s2 ? '2s' + SUP[o.s2] : '') + (o.p[0] + o.p[1] + o.p[2] ? '2p' + SUP[o.p[0] + o.p[1] + o.p[2]] : '');
        const ground = build(z);
        const right = diag(ground);
        const wrongs = [];
        if (z >= 6 && z <= 8) wrongs.push(diag(build(z, true)));                                         // pairs before singles (Hund)
        if (z >= 5) wrongs.push(diag({ s1: ground.s1, s2: ground.s2, p: ground.p }).replace(/\[↑↓\]/g, '[↑↑]')); // two parallel spins in one orbital (Pauli)
        if (z === 1) wrongs.push(diag({ s1: 0, s2: 1, p: [0, 0, 0] }));                                  // 2s before 1s (aufbau)
        else if (z <= 8) wrongs.push(diag({ s1: 2, s2: 0, p: fillP(z - 2) }));                           // 2p before 2s (aufbau)
        if (z === 6) wrongs.push(diag({ s1: 2, s2: 1, p: [1, 1, 1] }));                                  // the excited state
        wrongs.push(diag(build(z + 1)));                                                                  // one electron too many
        if (z > 1) wrongs.push(diag(build(z - 1)));                                                       // one electron too few
        const seen = new Set([right]);
        const uniq = ctx.shuffle(wrongs).filter((w) => !seen.has(w) && seen.add(w));
        const options = [ft(right)].concat(uniq.slice(0, 3).map((w) => ft(w)));
        const unpaired = [ground.s1, ground.s2].concat(ground.p).filter((v) => v === 1).length;
        const bonds = { H: 1, C: 4, N: 3, O: 2, F: 1 }[sym];
        const cf = cfg(ground);
        return {
          q: [{ p: t('Pagrindiniame būvyje $' + sym + '$ atomas turi ' + z + ' elektron' + (z === 1 ? 'ą' : 'us') + ' (atominis skaičius Z = ' + z + '). Dėžutė žymi orbitalę, rodyklė – elektroną.',
            'In the ground state an atom of $' + sym + '$ has ' + z + ' electron' + (z === 1 ? '' : 's') + ' (atomic number Z = ' + z + '). A box is an orbital, an arrow an electron.') }],
          steps: [
            {
              prompt: t('Kuri diagrama vaizduoja $' + sym + '$ atomo pagrindinį būvį?', 'Which diagram shows the ground state of the $' + sym + '$ atom?'),
              kind: 'choice', options, answer: 0,
              hint: t('Pildykite eilės tvarka 1s → 2s → 2p. Vienodos energijos 2p orbitalėse elektronai pirmiausia sėdasi po vieną, o orbitalėje telpa tik du priešingų sukinių elektronai.', 'Fill in the order 1s → 2s → 2p. In the 2p orbitals of equal energy the electrons first sit one each, and an orbital holds only two electrons of opposite spin.'),
              solution: t(z + ' elektron' + (z === 1 ? 'as' : 'ai') + ' pagal 1s → 2s → 2p: ' + cf + '. ' + right + '. Netinkamos diagramos pažeidžia eilę (patvarumo principą), Pauli arba Hundo taisyklę arba turi netinkamą elektronų skaičių.',
                z + ' electron' + (z === 1 ? '' : 's') + ' in the order 1s → 2s → 2p: ' + cf + '. ' + right + '. The other diagrams break the filling order, Pauli’s or Hund’s rule, or have the wrong number of electrons.')
            },
            {
              prompt: t('Kiek nesuporuotų elektronų turi $' + sym + '$ atomas pagrindiniame būvyje?', 'How many unpaired electrons does the $' + sym + '$ atom have in the ground state?'),
              kind: 'number', answer: { value: unpaired, tol: 0 },
              hint: t('Nesuporuotas elektronas yra orbitalėje, kurioje yra tik viena rodyklė.', 'An unpaired electron is in an orbital that holds just one arrow.'),
              solution: t('Orbitalių su viena rodykle: ' + unpaired + '.', 'Orbitals with a single arrow: ' + unpaired + '.')
            },
            {
              prompt: t('Kiek kovalentinių ryšių paprastai sudaro $' + sym + '$ atomas neutraliame junginyje?', 'How many covalent bonds does the $' + sym + '$ atom normally form in a neutral compound?'),
              kind: 'number', answer: { value: bonds, tol: 0 },
              hint: t('Palyginkite nesuporuotų elektronų skaičių su atomo valentingumu. Anglis yra ypatingas atvejis.', 'Compare the number of unpaired electrons with the valence of the atom. Carbon is a special case.'),
              solution: sym === 'C'
                ? t('Anglis turi tik 2 nesuporuotus elektronus, bet sudaro 4 ryšius: vienas 2s elektronas pereina į 2p, ir sužadintame būvyje (1s²2s¹2p³) yra 4 nesuporuoti elektronai.', 'Carbon has only 2 unpaired electrons but forms 4 bonds: one 2s electron moves to 2p, and the excited state (1s²2s¹2p³) has 4 unpaired electrons.')
                : t('Ryšių skaičius lygus nesuporuotų elektronų skaičiui: ' + bonds + '.', 'The number of bonds equals the number of unpaired electrons: ' + bonds + '.')
            }
          ],
          why: t('Elektronų konfigūracija iš atominio skaičiaus nustato valentingumą: N, O ir halogenų ryšių skaičius lygus nesuporuotų elektronų skaičiui (3, 2, 1). Anglis – išimtis: sužadinimas 2s → 2p duoda keturis nesuporuotus elektronus, todėl ji keturvalentė.',
            'The electron configuration, from the atomic number, fixes the valence: for N, O and the halogens the number of bonds equals the number of unpaired electrons (3, 2, 1). Carbon is the exception: promotion 2s → 2p gives four unpaired electrons, so it is tetravalent.'),
          src: 'L2 p5, p8, p9'
        };
      }
    },

    /* ============================================================ u02.valence */
    {
      id: 'u02.valence',
      title: t('Valentingumas skeleto formulėje: H skaičius ir formulė', 'Valence in a skeletal formula: the hydrogens and the formula'),
      mirrors: ['S2.1'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const smi = ctx.pick(VPOOL);
        const m = chem.parse(smi);
        const cs = m.atoms.map((a, i) => (a.el === 'C' ? i : -1)).filter((i) => i >= 0);
        const k = ctx.pick(cs);
        const hk = m.atoms[k].h;
        const VAL = { F: 1, Cl: 1, Br: 1, I: 1, O: 2, S: 2, N: 3 };
        const vals = [1, 2, 3].filter((v) => m.atoms.some((a) => VAL[a.el] === v));
        const formula = chem.formulaString(m);
        const steps = [{
          prompt: t('Skeleto formulėje vandenilio atomai prie anglies nepažymėti. Kiek $H$ atomų turi atomas Nr. ' + (k + 1) + '?', 'In a skeletal formula the hydrogens on carbon are not drawn. How many $H$ atoms does atom no. ' + (k + 1) + ' have?'),
          kind: 'number', answer: { value: hk, tol: 0 },
          hint: t('Anglis visada sudaro keturis ryšius. Suskaičiuokite jau nupieštus ryšius prie atomo (dvigubasis – du, trigubasis – trys); likusieji – su vandeniliais.', 'Carbon always forms four bonds. Count the bonds already drawn at the atom (a double bond is two, a triple bond three); the rest go to hydrogens.'),
          solution: t('Nupiešta ryšių: ' + (4 - hk) + ', iki keturių trūksta ' + hk + ', taigi atomas turi ' + hk + ' H.', 'Bonds drawn: ' + (4 - hk) + ', ' + hk + ' are missing to make four, so the atom has ' + hk + ' H.')
        }];
        if (vals.length) {
          const v = ctx.pick(vals);
          const ans = m.atoms.map((a, i) => (VAL[a.el] === v ? i : -1)).filter((i) => i >= 0);
          steps.push({
            prompt: t('Bakstelėkite visus atomus, kurių valentingumas yra ' + v + '.', 'Tap every atom whose valence is ' + v + '.'),
            kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, answer: ans,
            hint: t('Valentingumas yra ryšių skaičius: vandenilis ir halogenai 1, deguonis ir siera 2, azotas 3, anglis 4.', 'Valence is the number of bonds: hydrogen and the halogens 1, oxygen and sulfur 2, nitrogen 3, carbon 4.'),
            solution: t('Tokie atomai: ' + listAtoms(ans, 'lt') + '.', 'These atoms: ' + listAtoms(ans, 'en') + '.')
          });
        }
        steps.push({
          prompt: t('Parašykite molekulinę formulę.', 'Write the molecular formula.'),
          kind: 'formula', mol: { smi }, answer: formula,
          hint: t('Suskaičiuokite $C$ atomus, tada visus $H$ (ir nepažymėtus, ir prie heteroatomų), tada kitus elementus.', 'Count the $C$ atoms, then all the $H$ (the undrawn ones and those on heteroatoms), then the other elements.'),
          solution: t('Formulė: $' + formula + '$.', 'The formula is $' + formula + '$.')
        });
        const ns = nameStep(ctx, smi);
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Pateikta skeleto formulė; atomai sunumeruoti.', 'A skeletal formula is shown; the atoms are numbered.') }, { mol: { smi, opts: { numbers: 'all' } } }],
          steps,
          why: t('Skeleto formulėje nematomi tik $C–H$ ryšiai: juos atkuria valentingumas. Anglis turi keturis ryšius, azotas tris, deguonis du, vandenilis ir halogenai vieną, todėl formulę galima parašyti nenupiešus nė vieno vandenilio.', 'A skeletal formula hides only the $C–H$ bonds, and valence restores them. Carbon has four bonds, nitrogen three, oxygen two, hydrogen and the halogens one, so the formula can be written without drawing a single hydrogen.'),
          src: 'S2.1, L2 p7'
        };
      }
    },

    /* ============================================================ u02.hyb */
    {
      id: 'u02.hyb',
      title: t('Atomų hibridizacija, kampai ir nehibridinės p orbitalės', 'Hybridisation of atoms, angles and unhybridised p orbitals'),
      mirrors: ['S2.2'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const smi = ctx.pick(HP);
        const m = chem.parse(smi);
        const hy = m.atoms.map((a, i) => chem.hybridization(m, i));
        const kinds = ['sp', 'sp2', 'sp3'].filter((x) => hy.indexOf(x) >= 0);
        const X = ctx.pick(kinds);
        const idx = hy.map((h, i) => (h === X ? i : -1)).filter((i) => i >= 0);
        const cs = m.atoms.map((a, i) => (a.el === 'C' ? i : -1)).filter((i) => i >= 0);
        const k = ctx.pick(cs);
        const hk = hy[k];
        const label = { sp: 'sp', sp2: 'sp²', sp3: 'sp³' };
        const ang = { sp3: 0, sp2: 1, sp: 2 };
        const pRest = { sp3: 0, sp2: 1, sp: 2 };
        const groups = kinds.map((x) => label[x] + ': ' + listAtoms(hy.map((h, i) => (h === x ? i : -1)).filter((i) => i >= 0), 'lt'));
        const groupsEn = kinds.map((x) => label[x] + ': ' + listAtoms(hy.map((h, i) => (h === x ? i : -1)).filter((i) => i >= 0), 'en'));
        return {
          q: [{ p: t('Pateiktas junginys; atomai sunumeruoti.', 'A compound is shown; the atoms are numbered.') }, { mol: { smi, opts: { numbers: 'all' } } }],
          steps: [
            {
              prompt: t('Bakstelėkite visus ' + label[X] + ' hibridizacijos atomus.', 'Tap every ' + label[X] + ' atom.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all' } }, from: 'hyb:' + X,
              hint: t('Pažiūrėkite į ryšių rūšis: keturi viengubieji – sp³; vienas dvigubasis – sp²; trigubasis arba du dvigubieji – sp. Heteroatomams svarbi ir laisvoji pora.', 'Look at the kinds of bonds: four single – sp³; one double – sp²; a triple or two double – sp. For heteroatoms the lone pair matters too.'),
              solution: t('Hibridizacija: ' + groups.join('; ') + '.', 'Hybridisation: ' + groupsEn.join('; ') + '.')
            },
            {
              prompt: t('Koks apytikris kampas tarp σ ryšių anglies atome Nr. ' + (k + 1) + '?', 'What is the approximate angle between the σ bonds at carbon no. ' + (k + 1) + '?'),
              kind: 'choice',
              options: [tx('109,5°: tetraedras', '109.5°: tetrahedral'), tx('120°: plokščias trikampis', '120°: flat triangle'), tx('180°: tiesinė', '180°: linear'), tx('apie 90°: statmenos p orbitalės', 'about 90°: perpendicular p orbitals')],
              answer: ang[hk],
              hint: t('Pirmiausia nustatykite atomo hibridizaciją pagal jo ryšius.', 'First find the hybridisation of the atom from its bonds.'),
              solution: t('Atomas Nr. ' + (k + 1) + ' yra ' + label[hk] + ': ' + (hk === 'sp3' ? 'keturios sp³ orbitalės nukreiptos į tetraedro viršūnes, 109,5°.' : hk === 'sp2' ? 'trys sp² orbitalės vienoje plokštumoje, 120°.' : 'dvi sp orbitalės priešingomis kryptimis, 180°.'),
                'Atom no. ' + (k + 1) + ' is ' + label[hk] + ': ' + (hk === 'sp3' ? 'four sp³ orbitals point to the corners of a tetrahedron, 109.5°.' : hk === 'sp2' ? 'three sp² orbitals lie in one plane, 120°.' : 'two sp orbitals point in opposite directions, 180°.'))
            },
            {
              prompt: t('Kiek nehibridinių p orbitalių lieka atome Nr. ' + (k + 1) + '?', 'How many unhybridised p orbitals are left on atom no. ' + (k + 1) + '?'),
              kind: 'number', answer: { value: pRest[hk], tol: 0 },
              hint: t('Iš keturių orbitalių (2s ir trijų 2p) hibridizuojasi tiek, kiek yra hibridinių orbitalių.', 'Of the four orbitals (2s and three 2p) as many are hybridised as there are hybrid orbitals.'),
              solution: t(label[hk] + ' atome hibridinių orbitalių ' + (4 - pRest[hk]) + ', todėl nehibridinių p lieka ' + pRest[hk] + (pRest[hk] ? ': jos sudaro π ryšius.' : ': π ryšių nėra.'),
                'A ' + label[hk] + ' atom has ' + (4 - pRest[hk]) + ' hybrid orbitals, so ' + pRest[hk] + ' unhybridised p orbital' + (pRest[hk] === 1 ? ' is' : 's are') + ' left' + (pRest[hk] ? ': they form the π bonds.' : ': there are no π bonds.'))
            }
          ],
          why: t('Hibridizacija nusakoma tuo, kiek orbitalių susimaišo: tiek lieka ir hibridinių orbitalių, tiek aplink atomą σ ryšių ir laisvųjų porų. Kampas (109,5°, 120°, 180°) priklauso nuo hibridizacijos, o likusios p orbitalės sudaro π ryšius.',
            'Hybridisation is set by how many orbitals mix: that many hybrid orbitals arise, and that many σ bonds and lone pairs surround the atom. The angle (109.5°, 120°, 180°) follows from the hybridisation, and the remaining p orbitals form the π bonds.'),
          src: 'S2.2, L2 p18, p19'
        };
      }
    },

    /* ============================================================ u02.sigmapi */
    {
      id: 'u02.sigmapi',
      title: t('σ ir π ryšių skaičius molekulėje', 'Counting σ and π bonds in a molecule'),
      mirrors: ['S2.2'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const smi = ctx.pick(SPOOL);
        const m = chem.parse(smi);
        const bc = chem.bondCounts(m);
        const nAtoms = m.atoms.length + m.atoms.reduce((s, a) => s + a.h, 0);
        const rings = bc.sigma - (nAtoms - 1);
        const pairs = m.bonds.filter((b) => b.order >= 2).map((b) => [Math.min(b.a, b.b), Math.max(b.a, b.b)]);
        const formula = chem.formulaString(m);
        const steps = [
          {
            prompt: t('Kiek σ ryšių yra molekulėje?', 'How many σ bonds does the molecule contain?'),
            kind: 'number', answer: { value: bc.sigma, tol: 0 },
            hint: t('Kiekviena brūkšnelių grupė tarp dviejų atomų yra vienas σ ryšys, ir $C–H$ ryšiai taip pat. Pasinaudokite molekuline formule: suskaičiuokite visus atomus, ir vandenilius.', 'Every group of lines between two atoms is one σ bond, and $C–H$ bonds count too. Use the molecular formula to count all atoms.'),
            solution: t('Formulė $' + formula + '$: atomų ' + nAtoms + '. ' + (rings ? (rings === 1 ? 'Yra 1 žiedas' : 'Yra ' + rings + ' žiedai') + ', todėl σ = ' + nAtoms + ' − 1 + ' + rings + ' = ' + bc.sigma + '.' : 'Molekulė neciklinė, taigi σ = ' + nAtoms + ' − 1 = ' + bc.sigma + '.'),
              'Formula $' + formula + '$: ' + nAtoms + ' atoms. ' + (rings ? 'There ' + (rings === 1 ? 'is 1 ring' : 'are ' + rings + ' rings') + ', so σ = ' + nAtoms + ' − 1 + ' + rings + ' = ' + bc.sigma + '.' : 'The molecule is acyclic, so σ = ' + nAtoms + ' − 1 = ' + bc.sigma + '.'))
          },
          {
            prompt: t('Kiek π ryšių yra molekulėje?', 'How many π bonds does the molecule contain?'),
            kind: 'number', answer: { value: bc.pi, tol: 0 },
            hint: t('Dvigubasis ryšys turi vieną π, trigubasis – du.', 'A double bond has one π bond, a triple bond has two.'),
            solution: t('Dvigubieji ryšiai po 1 π, trigubieji po 2 π: iš viso ' + bc.pi + '.', 'Double bonds give 1 π each, triple bonds 2 π each: ' + bc.pi + ' in total.')
          }
        ];
        if (pairs.length) {
          steps.push({
            prompt: t('Bakstelėkite visus ryšius, kuriuose yra π ryšys.', 'Tap every bond that contains a π bond.'),
            kind: 'atoms', bonds: true, mol: { smi, opts: { numbers: 'all' } }, answer: pairs,
            hint: t('π ryšys yra tik dvigubuosiuose ir trigubuosiuose ryšiuose.', 'A π bond occurs only in double and triple bonds.'),
            solution: t('Daugialypiai ryšiai: ' + pairs.map((p) => (p[0] + 1) + '–' + (p[1] + 1)).join(', ') + '.', 'The multiple bonds: ' + pairs.map((p) => (p[0] + 1) + '–' + (p[1] + 1)).join(', ') + '.')
          });
        }
        return {
          q: [{ p: t('Pateiktas junginys.', 'A compound is shown.') }, { mol: { smi, opts: { numbers: 'all' } } }],
          steps,
          why: t('Viengubasis ryšys yra vienas σ, dvigubasis – σ ir π, trigubasis – σ ir du π. Todėl σ ryšių skaičius lygus visų ryšių (įskaitant $C–H$) skaičiui, o π skaičių rodo dvigubieji ir trigubieji ryšiai.',
            'A single bond is one σ, a double bond σ and π, a triple bond σ and two π. So the number of σ bonds equals the number of all bonds (including $C–H$), and the π bonds are counted from the double and triple bonds.'),
          src: 'S2.2, L2 p24, p27'
        };
      }
    },

    /* ============================================================ u02.fromhyb */
    {
      id: 'u02.fromhyb',
      title: t('Angliavandenilis pagal anglies atomų hibridizaciją', 'The hydrocarbon that fits a description of its carbons'),
      mirrors: ['S2.3'],
      gen(rng, ctx) {
        const all = fhInfo(ctx);
        let pick = null;
        for (let tries = 0; tries < 60 && !pick; tries++) {
          const a = ctx.pick(all);
          const others = all.filter((x) => x.formula === a.formula && x.sig !== a.sig);
          if (others.length < 1) continue;
          pick = { a, wrongs: ctx.shuffle(others).slice(0, 3) };
        }
        if (!pick) throw new Error('u02.fromhyb: no group');
        const { a, wrongs } = pick;
        const parts = [[a.c.sp, 'sp'], [a.c.sp2, 'sp²'], [a.c.sp3, 'sp³']].filter((p) => p[0] > 0);
        const ltDesc = andJoin(parts.map((p) => NUM_LT[p[0]] + ' ' + p[1]), 'ir');
        const enDesc = andJoin(parts.map((p) => NUM_EN[p[0]] + ' ' + p[1]), 'and');
        const options = [{ mol: { smi: a.smi } }].concat(wrongs.map((w) => ({ mol: { smi: w.smi } })));
        const steps = [
          {
            prompt: t('Kuris iš šių junginių, kurių formulė $' + a.formula + '$, turi ' + ltDesc + ' hibridizacijos anglies atomus?', 'Which of these compounds of formula $' + a.formula + '$ has ' + enDesc + ' carbon atoms?'),
            kind: 'choice', options, answer: 0,
            hint: t('Kiekvienam junginiui nustatykite kiekvieno anglies atomo hibridizaciją pagal jo ryšius ir suskaičiuokite sp, sp² ir sp³.', 'For each compound find the hybridisation of every carbon from its bonds and count the sp, sp² and sp³ atoms.'),
            solution: [
              { p: t('Teisingas junginys turi ' + ltDesc + ' hibridizacijos anglies atomus.', 'The right compound has ' + enDesc + ' carbon atoms.') },
              { mol: [{ smi: a.smi, caption: t('teisingas: ' + hybWords(a.c), 'right: ' + hybWords(a.c)) }].concat(wrongs.map((w) => ({ smi: w.smi, caption: t(hybWords(w.c), hybWords(w.c)) }))) }
            ]
          },
          {
            prompt: t('Kiek π ryšių turi šis junginys?', 'How many π bonds does this compound have?'),
            kind: 'number', mol: { smi: a.smi }, answer: { value: a.pi, tol: 0 },
            hint: t('Dvigubasis ryšys – vienas π, trigubasis – du.', 'A double bond is one π bond, a triple bond two.'),
            solution: t('π ryšių: ' + a.pi + '.', 'π bonds: ' + a.pi + '.')
          }
        ];
        const ns = nameStep(ctx, a.smi);
        if (ns) steps.push(ns);
        return {
          q: [{ p: t('Visi junginiai yra angliavandeniliai su ta pačia molekuline formule, todėl skiriasi tik ryšių išdėstymas.', 'All the compounds are hydrocarbons with the same molecular formula, so only the arrangement of bonds differs.') }],
          steps,
          why: t('Izomerų formulė ta pati, bet anglies atomų hibridizacija skiriasi: ji priklauso nuo to, kokius ryšius atomas sudaro, o ne nuo formulės. Visi sp² – kai tik dvigubieji ryšiai (arba aromatinis žiedas), sp – kai yra trigubasis ryšys arba du dvigubieji prie to paties atomo. Seminaro atvejai (visi anglies atomai sp³, visi sp² arba visi sp) yra atskiri šio uždavinio atvejai.',
            'Isomers have the same formula, yet the hybridisation of their carbons differs: it depends on the bonds an atom forms, not on the formula. All sp² means only double bonds (or an aromatic ring); sp means a triple bond or two double bonds at one atom. The seminar cases (all carbons sp³, all sp² or all sp) are special cases of this problem.'),
          src: 'S2.3, L2 p18, p21'
        };
      }
    },

    /* ============================================================ u02.bondtype */
    {
      id: 'u02.bondtype',
      title: t('Ryšio tipas pagal elektrinių neigiamumų skirtumą', 'The type of a bond from the electronegativity difference'),
      mirrors: ['S2.4', 'S2.5'],
      gen(rng, ctx) {
        const { chem } = ctx;
        let pick = null;
        for (let tries = 0; tries < 80 && !pick; tries++) {
          if (rng() < 0.2) {                                    // an ionic compound drawn with its ions
            const smi = ctx.pick(BT_IONIC);
            const m = chem.parse(smi);
            const ia = m.atoms.findIndex((a) => a.charge < 0), ib = m.atoms.findIndex((a) => a.charge > 0);
            const d = r1(Math.abs(EN[m.atoms[ia].el] - EN[m.atoms[ib].el]));
            if (d < 2.1) continue;
            pick = { smi, kind: 'ion', i: ia, j: ib, a: m.atoms[ia].el, b: m.atoms[ib].el, d };
          } else {
            const smi = ctx.pick(BT_COV);
            const m = chem.parse(smi);
            const ok = bondList(m).filter((x) => x.d === 0 || (x.d >= 0.6 && x.d <= 1.5));
            if (!ok.length) continue;
            const bnd = ctx.pick(ok);
            pick = Object.assign({ smi, kind: bnd.j === null ? 'h' : 'cov', order: bnd.order }, bnd);
          }
        }
        if (!pick) throw new Error('u02.bondtype: no bond');
        const { smi, kind, i, j, a, b, d } = pick;
        const sym = a === b ? a + '–' + a : a + (pick.order === 2 ? '=' : pick.order === 3 ? '≡' : '–') + b;
        const enTxt = a === b ? '$' + a + '$ – ' : '$' + a + '$ – ' + dl(EN[a].toFixed(1)) + '; $' + b + '$ – ';
        const enTxtEn = a === b ? '$' + a + '$ – ' : '$' + a + '$ – ' + EN[a].toFixed(1) + '; $' + b + '$ – ';
        const lastLt = dl(EN[b].toFixed(1)), lastEn = EN[b].toFixed(1);
        const en = t('Elektriniai neigiamumai: ' + enTxt + lastLt + '.', 'Electronegativities: ' + enTxtEn + lastEn + '.');
        const hl = kind === 'cov' ? { bonds: [[i, j]], tone: 1 } : kind === 'h' ? { atoms: [i], tone: 1 } : { atoms: [i, j], tone: 1 };
        const intro = kind === 'cov'
          ? t('Pažymėtas ryšys $' + sym + '$ (atomai Nr. ' + (i + 1) + ' ir Nr. ' + (j + 1) + ').', 'The highlighted bond is $' + sym + '$ (atoms no. ' + (i + 1) + ' and no. ' + (j + 1) + ').')
          : kind === 'h'
            ? t('Pažymėtas atomas Nr. ' + (i + 1) + ' ($' + a + '$) ir jo vandenilis: nagrinėjame ryšį $' + a + '–H$.', 'The highlighted atom is no. ' + (i + 1) + ' ($' + a + '$) and its hydrogen: we examine the bond $' + a + '–H$.')
            : t('Pažymėti atomai Nr. ' + (i + 1) + ' ($' + a + '$) ir Nr. ' + (j + 1) + ' ($' + b + '$): kokio tipo ryšys juos jungia?', 'The highlighted atoms are no. ' + (i + 1) + ' ($' + a + '$) and no. ' + (j + 1) + ' ($' + b + '$): what kind of bond links them?');
        const cls = d < 0.5 ? 0 : d <= 1.7 ? 1 : 2;
        const hi = Math.max(EN[a], EN[b]), lo = Math.min(EN[a], EN[b]);
        const steps = [
          {
            prompt: t('Apskaičiuokite elektrinių neigiamumų skirtumą ΔEN.', 'Calculate the electronegativity difference ΔEN.'),
            kind: 'number', answer: { value: d, tol: 0.05 },
            hint: t('Iš didesnės reikšmės atimkite mažesnę.', 'Subtract the smaller value from the larger.'),
            solution: t('ΔEN = ' + dl(hi.toFixed(1)) + ' − ' + dl(lo.toFixed(1)) + ' = ' + dl(d.toFixed(1)) + '.', 'ΔEN = ' + hi.toFixed(1) + ' − ' + lo.toFixed(1) + ' = ' + d.toFixed(1) + '.')
          },
          {
            prompt: t('Kokio tipo šis ryšys?', 'What kind of bond is it?'),
            kind: 'choice',
            options: [tx('nepolinis kovalentinis (ΔEN < 0,5)', 'nonpolar covalent (ΔEN < 0.5)'), tx('polinis kovalentinis (ΔEN nuo 0,5 iki 1,7)', 'polar covalent (ΔEN from 0.5 to 1.7)'), tx('joninis (ΔEN > 1,7)', 'ionic (ΔEN > 1.7)')],
            answer: cls,
            hint: t('Palyginkite skirtumą su ribomis 0,5 ir 1,7 (2).', 'Compare the difference with the limits 0.5 and 1.7 (2).'),
            solution: t('ΔEN = ' + dl(d.toFixed(1)) + ': ' + (cls === 0 ? 'mažiau nei 0,5, ryšys nepolinis kovalentinis (elektronų pora dalijamasi vienodai).' : cls === 1 ? 'nuo 0,5 iki 1,7, ryšys polinis kovalentinis (pora pasislenka į elektroneigiamesnį atomą).' : 'daugiau nei 1,7, ryšys joninis (susidaro jonai).'),
              'ΔEN = ' + d.toFixed(1) + ': ' + (cls === 0 ? 'below 0.5, a nonpolar covalent bond (the pair is shared equally).' : cls === 1 ? 'between 0.5 and 1.7, a polar covalent bond (the pair shifts to the more electronegative atom).' : 'above 1.7, an ionic bond (ions form).'))
          }
        ];
        if (d > 0 && kind !== 'ion') {
          const hiEl = EN[a] > EN[b] ? a : b;
          steps.push({
            prompt: t('Kuris atomas turi dalinį neigiamą krūvį δ−?', 'Which atom carries the partial negative charge δ−?'),
            kind: 'choice', options: [{ text: f('$' + a + '$') }, { text: f('$' + b + '$') }], answer: hiEl === a ? 0 : 1,
            hint: t('Elektronų pora pasislenka link elektroneigiamesnio atomo.', 'The electron pair shifts towards the more electronegative atom.'),
            solution: t('$' + hiEl + '$ turi didesnį elektrinį neigiamumą, todėl ją pasiekia elektronų tankis: δ− ant $' + hiEl + '$.', '$' + hiEl + '$ is more electronegative, so electron density moves to it: δ− on $' + hiEl + '$.')
          });
        }
        return {
          q: [{ p: intro }, { p: en }, { mol: { smi, opts: { numbers: 'all', highlight: hl } } }],
          steps,
          why: t('Ryšio tipą nusako atomų elektrinių neigiamumų skirtumas: kai jis mažesnis už 0,5, pora dalijamasi beveik tolygiai; nuo 0,5 iki 1,7 ji pasislenka link elektroneigiamesnio atomo; kai skirtumas didesnis, pora priklauso beveik vienam atomui ir susidaro jonai.',
            'The type of bond is set by the difference between the electronegativities of the atoms: below 0.5 the pair is shared almost evenly; between 0.5 and 1.7 it shifts towards the more electronegative atom; above that it belongs almost wholly to one atom and ions form.'),
          src: 'S2.4, L2 p37'
        };
      }
    },

    /* ============================================================ u02.polar */
    {
      id: 'u02.polar',
      title: t('Ryšio poliarizacijos kryptis: kur δ+ ir δ−', 'Direction of bond polarisation: where δ+ and δ− go'),
      mirrors: ['S2.5'],
      gen(rng, ctx) {
        const { chem } = ctx;
        let pick = null;
        for (let tries = 0; tries < 80 && !pick; tries++) {
          const smi = ctx.pick(PL_MOLS);
          const m = chem.parse(smi);
          const ok = bondList(m).filter((x) => x.d >= 0.3 && !((x.a === 'C' && x.b === 'H') || (x.a === 'H' && x.b === 'C')));
          if (!ok.length) continue;
          pick = Object.assign({ smi }, ctx.pick(ok));
        }
        if (!pick) throw new Error('u02.polar: no bond');
        const { smi, i, j, a, b, d } = pick;
        const hiIdx = j === null ? i : (EN[a] > EN[b] ? i : j);
        const hiEl = EN[a] > EN[b] ? a : b, loEl = hiEl === a ? b : a;
        const sym = a + (pick.order === 2 ? '=' : pick.order === 3 ? '≡' : '–') + b;
        const hl = j === null ? { atoms: [i], tone: 1 } : { bonds: [[i, j]], tone: 1 };
        const intro = j === null
          ? t('Pažymėtas atomas Nr. ' + (i + 1) + ' ($' + a + '$) ir jo vandenilis; nagrinėjame ryšį $' + a + '–H$.', 'The highlighted atom is no. ' + (i + 1) + ' ($' + a + '$) and its hydrogen; we examine the bond $' + a + '–H$.')
          : t('Pažymėtas ryšys $' + sym + '$ (atomai Nr. ' + (i + 1) + ' ir Nr. ' + (j + 1) + ').', 'The highlighted bond is $' + sym + '$ (atoms no. ' + (i + 1) + ' and no. ' + (j + 1) + ').');
        const en = t('Elektriniai neigiamumai: $' + a + '$ – ' + dl(EN[a].toFixed(1)) + '; $' + b + '$ – ' + dl(EN[b].toFixed(1)) + '.', 'Electronegativities: $' + a + '$ – ' + EN[a].toFixed(1) + '; $' + b + '$ – ' + EN[b].toFixed(1) + '.');
        const hiPos = hiIdx + 1;
        return {
          q: [{ p: intro }, { p: en }, { mol: { smi, opts: { numbers: 'all', highlight: hl } } }],
          steps: [
            {
              prompt: t('Bakstelėkite atomą, kuris šiame ryšyje turi dalinį neigiamą krūvį δ−.', 'Tap the atom that carries the partial negative charge δ− in this bond.'),
              kind: 'atoms', mol: { smi, opts: { numbers: 'all', highlight: hl } }, answer: [hiIdx],
              hint: t('Elektronai pasislenka link atomo, kurio elektrinis neigiamumas didesnis.', 'The electrons shift towards the atom of higher electronegativity.'),
              solution: t('$' + hiEl + '$ (' + dl(EN[hiEl].toFixed(1)) + ') yra elektroneigiamesnis už $' + loEl + '$ (' + dl(EN[loEl].toFixed(1)) + '), todėl δ− ant atomo Nr. ' + hiPos + ', o δ+ ant $' + loEl + '$.',
                '$' + hiEl + '$ (' + EN[hiEl].toFixed(1) + ') is more electronegative than $' + loEl + '$ (' + EN[loEl].toFixed(1) + '), so δ− sits on atom no. ' + hiPos + ' and δ+ on $' + loEl + '$.')
            },
            {
              prompt: t('Koks yra šio ryšio ΔEN?', 'What is ΔEN of this bond?'),
              kind: 'number', answer: { value: d, tol: 0.05 },
              hint: t('Iš didesnės reikšmės atimkite mažesnę.', 'Subtract the smaller value from the larger.'),
              solution: t('ΔEN = ' + dl(EN[hiEl].toFixed(1)) + ' − ' + dl(EN[loEl].toFixed(1)) + ' = ' + dl(d.toFixed(1)) + '.', 'ΔEN = ' + EN[hiEl].toFixed(1) + ' − ' + EN[loEl].toFixed(1) + ' = ' + d.toFixed(1) + '.')
            }
          ],
          why: t('Dalinį neigiamą krūvį δ− gauna elektroneigiamesnis atomas, kitas – δ+. Todėl anglis yra δ+ prie O, N ir halogeno, bet δ− prie metalo (Li, Mg) ar silicio. Kuo didesnis ΔEN, tuo ryšys poliškesnis.',
            'The more electronegative atom gets the partial negative charge δ−, the other δ+. So carbon is δ+ next to O, N and a halogen, but δ− next to a metal (Li, Mg) or silicon. The larger ΔEN is, the more polar the bond.'),
          src: 'S2.5, L2 p36'
        };
      }
    },

    /* ============================================================ u02.morepolar */
    {
      id: 'u02.morepolar',
      title: t('Kuris ryšys poliškesnis?', 'Which bond is more polar?'),
      mirrors: ['S2.6'],
      gen(rng, ctx) {
        let pick = null;
        for (let tries = 0; tries < 100 && !pick; tries++) {
          const x = ctx.pick(MP_BONDS), y = ctx.pick(MP_BONDS);
          if (x === y) continue;
          const dx = r1(Math.abs(EN[x[1]] - EN[x[2]])), dy = r1(Math.abs(EN[y[1]] - EN[y[2]]));
          if (Math.abs(dx - dy) < 0.3) continue;
          pick = dx > dy ? { w: x, wd: dx, l: y, ld: dy } : { w: y, wd: dy, l: x, ld: dx };
        }
        if (!pick) throw new Error('u02.morepolar: no pair');
        const first = ctx.pick([pick.w, pick.l]), second = first === pick.w ? pick.l : pick.w;
        const lab = (z) => '$' + z[0] + '$';
        const w = pick.w;
        const hiEl = EN[w[1]] > EN[w[2]] ? w[1] : w[2], loEl = hiEl === w[1] ? w[2] : w[1];
        return {
          q: [{ p: t('Palyginkite dviejų ryšių poliškumą: ' + lab(first) + ' ir ' + lab(second) + '. Elektriniai neigiamumai: ' + Object.keys(EN).filter((e) => [first[1], first[2], second[1], second[2]].indexOf(e) >= 0).map((e) => '$' + e + '$ ' + dl(EN[e].toFixed(1))).join(', ') + '.',
            'Compare the polarity of two bonds: ' + lab(first) + ' and ' + lab(second) + '. Electronegativities: ' + Object.keys(EN).filter((e) => [first[1], first[2], second[1], second[2]].indexOf(e) >= 0).map((e) => '$' + e + '$ ' + EN[e].toFixed(1)).join(', ') + '.') }],
          steps: [
            {
              prompt: t('Kuris ryšys poliškesnis?', 'Which bond is more polar?'),
              kind: 'choice', options: [{ text: f(lab(first)) }, { text: f(lab(second)) }, tx('abu vienodai poliniai', 'both equally polar')], answer: first === pick.w ? 0 : 1,
              hint: t('Poliškumas didėja augant elektrinių neigiamumų skirtumui ΔEN. Apskaičiuokite jį kiekvienam ryšiui.', 'Polarity grows with the electronegativity difference ΔEN. Work it out for each bond.'),
              solution: t('ΔEN: ' + lab(pick.w) + ' – ' + dl(pick.wd.toFixed(1)) + '; ' + lab(pick.l) + ' – ' + dl(pick.ld.toFixed(1)) + '. Poliškesnis yra ' + lab(pick.w) + '.', 'ΔEN: ' + lab(pick.w) + ' – ' + pick.wd.toFixed(1) + '; ' + lab(pick.l) + ' – ' + pick.ld.toFixed(1) + '. The more polar bond is ' + lab(pick.w) + '.')
            },
            {
              prompt: t('Į kurį atomą poliškesniame ryšyje pasislenka elektronų pora?', 'Towards which atom does the electron pair shift in the more polar bond?'),
              kind: 'choice', options: [{ text: f('$' + w[1] + '$') }, { text: f('$' + w[2] + '$') }], answer: hiEl === w[1] ? 0 : 1,
              hint: t('Pora traukiama stipriau to atomo, kurio elektrinis neigiamumas didesnis.', 'The pair is pulled harder by the atom with the larger electronegativity.'),
              solution: t('$' + hiEl + '$ yra elektroneigiamesnis, todėl δ− ant $' + hiEl + '$, δ+ ant $' + loEl + '$.', '$' + hiEl + '$ is more electronegative, so δ− is on $' + hiEl + '$ and δ+ on $' + loEl + '$.')
            },
            {
              prompt: t('Koks yra poliškesnio ryšio ΔEN?', 'What is ΔEN of the more polar bond?'),
              kind: 'number', answer: { value: pick.wd, tol: 0.05 },
              hint: t('Iš didesnės reikšmės atimkite mažesnę.', 'Subtract the smaller value from the larger.'),
              solution: t('ΔEN = ' + dl(EN[hiEl].toFixed(1)) + ' − ' + dl(EN[loEl].toFixed(1)) + ' = ' + dl(pick.wd.toFixed(1)) + '.', 'ΔEN = ' + EN[hiEl].toFixed(1) + ' − ' + EN[loEl].toFixed(1) + ' = ' + pick.wd.toFixed(1) + '.')
            }
          ],
          why: t('Du ryšius palygina jų ΔEN, o ne atomų dydis ar vieta eilutėje. Jungiantis vienodiems atomams ΔEN yra 0 ir ryšys nepolinis. Taip pat atkreipkite dėmesį į kryptį: prie metalo ar silicio anglis yra δ−.',
            'Two bonds are compared by ΔEN, not by the size of the atoms or by their place in the formula. Between identical atoms ΔEN is 0 and the bond is nonpolar. Mind the direction as well: next to a metal or silicon, carbon is δ−.'),
          src: 'S2.6, L2 p34, p36'
        };
      }
    },

    /* ============================================================ u02.hbond */
    {
      id: 'u02.hbond',
      title: t('Laisvosios poros ir vandeniliniai ryšiai tarp tokių pat molekulių', 'Lone pairs and hydrogen bonds between identical molecules'),
      mirrors: ['S2.9'],
      gen(rng, ctx) {
        const { chem } = ctx;
        const smi = ctx.pick(HB);
        const m = chem.parse(smi);
        const lp = m.atoms.map((a, i) => (a.el === 'C' ? 0 : chem.lonePairs(m, i)));
        const total = lp.reduce((s, x) => s + x, 0);
        const D = donorH(m);
        const A = m.atoms.reduce((s, a, i) => s + ((a.el === 'N' || a.el === 'O') ? lp[i] : 0), 0);
        const hasNO = m.atoms.some((a) => a.el === 'N' || a.el === 'O');
        const max = D > 0 ? D + A : 0;
        const kind = D > 0 ? 0 : hasNO ? 1 : 2;
        const steps = [];
        const withLp = m.atoms.map((a, i) => (lp[i] > 0 ? a.el + ' (' + (i + 1) + ') – ' + lp[i] : null)).filter(Boolean).join('; ');
        if (total > 0) {
          steps.push({
            prompt: t('Kiek laisvųjų elektronų porų turi visi molekulės heteroatomai kartu?', 'How many lone pairs do all the heteroatoms of the molecule have together?'),
            kind: 'number', answer: { value: total, tol: 0 },
            hint: t('Heteroatomas turi tiek porų, kiek valentinių elektronų lieka po ryšių: $N$ – 1, $O$ ir $S$ – 2, $Cl$ – 3.', 'A heteroatom has as many pairs as valence electrons remain after the bonds: $N$ – 1, $O$ and $S$ – 2, $Cl$ – 3.'),
            solution: [{ p: t('Poros (atomas, numeris, porų skaičius): ' + withLp + '. Iš viso ' + total + '.', 'Pairs (atom, number, pairs): ' + withLp + '. In all ' + total + '.') }, mo(smi, { lonePairs: true, numbers: 'all' })]
          });
        }
        steps.push({
          prompt: t('Ar tokios pat šio junginio molekulės gali sudaryti tarpusavyje vandenilinius ryšius?', 'Can identical molecules of this compound form hydrogen bonds with each other?'),
          kind: 'choice',
          options: [
            tx('Taip: yra $O–H$ arba $N–H$ (donoras) ir $N$ ar $O$ laisvųjų porų (akceptorius).', 'Yes: there is an $O–H$ or $N–H$ (donor) and lone pairs on $N$ or $O$ (acceptor).'),
            tx('Ne: $N$ ar $O$ turi laisvųjų porų, bet prie jų nėra vandenilio.', 'No: $N$ or $O$ has lone pairs, but no hydrogen is attached to it.'),
            tx('Ne: molekulėje nėra $N$, $O$ ar $F$ atomų, kurie sudarytų vandenilinį ryšį.', 'No: the molecule has no $N$, $O$ or $F$ atom to take part in a hydrogen bond.'),
            tx('Taip: bet kokie $C–H$ ryšiai sudaro vandenilinius ryšius.', 'Yes: any $C–H$ bonds form hydrogen bonds.')
          ],
          answer: kind,
          hint: t('Vandenilinį ryšį sudaro $X–H$ donoras ($X$ yra N ar O) ir kitos molekulės laisva pora. Patikrinkite, ar yra ir viena, ir kita.', 'A hydrogen bond needs an $X–H$ donor ($X$ is N or O) and a lone pair of another molecule. Check that both are present.'),
          solution: kind === 0 ? t('Yra ir donoras ($N–H$ / $O–H$), ir laisvosios poros: taip.', 'Both a donor ($N–H$ / $O–H$) and lone pairs are present: yes.')
            : kind === 1 ? t('Laisvųjų porų yra, bet nėra $O–H$ ar $N–H$: vandenilinio ryšio nėra, nors su vandeniu ar alkoholiu jis susidarytų.', 'Lone pairs exist, but there is no $O–H$ or $N–H$: no hydrogen bond between these molecules, although one would form with water or an alcohol.')
              : t('Nėra nei $N$, nei $O$ (tioliuose $S–H$ netraktuojamas kaip donoras): vandenilinių ryšių nėra.', 'There is neither $N$ nor $O$ ($S–H$ in thiols is not treated as a donor): no hydrogen bonds.')
        });
        steps.push({
          prompt: t('Kiek vandenilinių ryšių didžiausiai gali sudaryti viena molekulė su tokiomis pat molekulėmis?', 'How many hydrogen bonds can one molecule form at most with identical molecules?'),
          kind: 'number', answer: { value: max, tol: 0 },
          hint: t('Jei donoras yra, skaičiuokite donorinius vandenilius ($N–H$, $O–H$) ir akceptorių laisvąsias poras ($N$, $O$); be donoro – nė vieno.', 'If there is a donor, count the donor hydrogens ($N–H$, $O–H$) and the lone pairs of the acceptors ($N$, $O$); with no donor, none.'),
          solution: D > 0 ? t('Donorinių $H$: ' + D + ', laisvųjų porų ($N$, $O$): ' + A + '. Iš viso ' + D + ' + ' + A + ' = ' + max + '.', 'Donor $H$: ' + D + ', lone pairs ($N$, $O$): ' + A + '. In all ' + D + ' + ' + A + ' = ' + max + '.')
            : t('Nėra donorinio $H$ ($N–H$, $O–H$), todėl tarpusavyje – 0.', 'There is no donor $H$ ($N–H$, $O–H$), so among themselves: 0.')
        });
        return {
          q: [{ p: t('Pateikta skeleto formulė. Heteroatomų laisvosios poros nepažymėtos.', 'A skeletal formula is shown. The lone pairs of the heteroatoms are not drawn.') }, { mol: { smi, opts: { numbers: 'all' } } }],
          steps,
          why: t('Vandenilinį ryšį sudaro $N–H$ ar $O–H$ vandenilis (donoras) ir kitos molekulės $N$ ar $O$ laisvoji pora (akceptorius). Eteriai, aldehidai ir ketonai turi poras, bet neturi donoro, todėl tarpusavyje nesiasocijuoja; angliavandeniliai ir tioliai ryšių nesudaro.',
            'A hydrogen bond needs the hydrogen of an $N–H$ or $O–H$ (donor) and a lone pair of $N$ or $O$ on another molecule (acceptor). Ethers, aldehydes and ketones have pairs but no donor, so they do not associate with each other; hydrocarbons and thiols form none.'),
          src: 'S2.9, L2 p43, p44, p45'
        };
      }
    },

    /* ============================================================ u02.nohyb */
    {
      id: 'u02.nohyb',
      title: t('Hibridizacija: N, O, S, kampai, aleno geometrija ir sudėtingesnės molekulės', 'Hybridisation: N, O, S, angles, the geometry of allene and larger molecules'),
      mirrors: [],
      bank: [
        {
          id: 'u02.nohyb.1',
          q: [{ p: t('Amoniako molekulėje $NH3$ azotas sudaro tris ryšius su vandeniliu ir turi vieną laisvąją elektronų porą.', 'In the ammonia molecule $NH3$ nitrogen forms three bonds to hydrogen and has one lone pair.') }, mo('N', { lonePairs: true })],
          steps: [
            {
              prompt: t('Kokios hibridizacijos yra azoto atomas?', 'What is the hybridisation of the nitrogen atom?'),
              kind: 'choice', options: [ft('sp'), ft('sp²'), ft('sp³'), tx('nehibridizuotas', 'not hybridised')], answer: 2,
              hint: t('Suskaičiuokite, kiek sričių aplink azotą užima σ ryšiai ir laisvosios poros kartu.', 'Count how many regions around nitrogen are taken by σ bonds and lone pairs together.'),
              solution: t('Trys σ ryšiai ir viena laisvoji pora duoda keturias sritis: azotas sp³, laisvoji pora yra vienoje iš keturių sp³ orbitalių.', 'Three σ bonds and one lone pair make four regions: nitrogen is sp³, and the lone pair sits in one of the four sp³ orbitals.')
            },
            {
              prompt: t('Kodėl kampas $H–N–H$ lygus 107,3°, o ne 109,5°?', 'Why is the $H–N–H$ angle 107.3° and not 109.5°?'),
              kind: 'choice',
              options: [
                tx('Laisvoji pora stipriau stumia ryšių poras, todėl ryšių kampas šiek tiek sumažėja.', 'The lone pair repels the bonding pairs more strongly, so the bond angle shrinks a little.'),
                tx('Azotas yra sp² hibridizacijos, todėl kampas artėja prie 120°.', 'Nitrogen is sp² hybridised, so the angle approaches 120°.'),
                tx('Vandenilio atomai vienas kitą traukia.', 'The hydrogen atoms attract each other.'),
                tx('$N–H$ ryšiai yra π ryšiai.', 'The $N–H$ bonds are π bonds.')
              ],
              answer: 0,
              hint: t('Palyginkite, ką erdvėje užima ryšys ir ką – laisvoji pora.', 'Compare what a bond takes up in space with what a lone pair takes up.'),
              solution: t('Laisvoji pora yra arčiau azoto ir užima daugiau vietos nei ryšio pora, todėl stumia $N–H$ ryšius arčiau vienas kito: 107,3°.', 'The lone pair sits closer to nitrogen and takes up more room than a bonding pair, so it pushes the $N–H$ bonds closer together: 107.3°.')
            }
          ],
          why: t('Azotas amoniake sp³ hibridizuotas, kaip ir anglis metane, bet viena iš keturių orbitalių užimta laisvąja pora. Jos stūmimas ryšių atžvilgiu sumažina kampą iki 107,3°.', 'Nitrogen in ammonia is sp³ like carbon in methane, but one of the four orbitals holds a lone pair. Its repulsion of the bonds reduces the angle to 107.3°.'),
          src: 'L2 p15, Klein', claims: [{ hyb: ['N', 0, 'sp3'] }]
        },
        {
          id: 'u02.nohyb.2',
          q: [{ p: t('Palyginkite kampus tarp ryšių metane, amoniake ir vandenyje.', 'Compare the bond angles in methane, ammonia and water.') }, { mol: [{ smi: 'C', opts: { allH: true } }, { smi: 'N', opts: { lonePairs: true } }, { smi: 'O', opts: { lonePairs: true } }] }],
          steps: [
            {
              prompt: t('Išdėstykite molekules pagal ryšių kampą nuo didžiausio iki mažiausio.', 'Put the molecules in order of bond angle, from largest to smallest.'),
              kind: 'order', options: [tx('metanas: 109,5°', 'methane: 109.5°'), tx('amoniakas: 107,3°', 'ammonia: 107.3°'), tx('vanduo: 104,5°', 'water: 104.5°')],
              hint: t('Visuose trijuose centrinis atomas sp³ hibridizacijos. Skiriasi tik tai, kiek laisvųjų porų jis turi.', 'In all three the central atom is sp³. They differ only in how many lone pairs it has.'),
              solution: t('Metane laisvųjų porų nėra (109,5°), amoniake viena (107,3°), vandenyje dvi (104,5°).', 'Methane has no lone pair (109.5°), ammonia one (107.3°), water two (104.5°).')
            },
            {
              prompt: t('Kas lemia šią tvarką?', 'What explains this order?'),
              kind: 'choice',
              options: [
                tx('Kuo daugiau laisvųjų porų prie centrinio atomo, tuo labiau jos suspaudžia ryšių kampą.', 'The more lone pairs on the central atom, the more they squeeze the bond angle.'),
                tx('Kuo atomas elektroneigiamesnis, tuo didesnis kampas.', 'The more electronegative the atom, the larger the angle.'),
                tx('Metane yra π ryšių, todėl kampas didžiausias.', 'Methane has π bonds, so its angle is the largest.'),
                tx('Vandenyje deguonis yra sp² hibridizacijos.', 'In water oxygen is sp² hybridised.')
              ],
              answer: 0,
              hint: t('Pasižiūrėkite, kuo skiriasi trys molekulės aplink centrinį atomą.', 'Look at what differs around the central atom of the three molecules.'),
              solution: t('Laisvosios poros užima daugiau vietos nei ryšių poros. Kiekviena papildoma pora sumažina kampą apie 2–3°: 109,5° → 107,3° → 104,5°.', 'Lone pairs take up more room than bonding pairs. Each extra pair lowers the angle by about 2–3°: 109.5° → 107.3° → 104.5°.')
            }
          ],
          why: t('Visų trijų atomų hibridizacija sp³ ir kampai artimi tetraedro 109,5°, tačiau laisvosios poros šiek tiek suspaudžia ryšių kampą.', 'All three central atoms are sp³ and the angles are near the tetrahedral 109.5°, but lone pairs squeeze the bond angle a little.'),
          src: 'L2 p11, p15, p17'
        },
        {
          id: 'u02.nohyb.3',
          q: [{ p: t('Trys junginiai turi po azoto atomą su skirtinga aplinka.', 'Three compounds each contain a nitrogen atom in a different environment.') }],
          steps: [{
            prompt: t('Priskirkite kiekvienam junginiui azoto atomo hibridizaciją.', 'Match each compound with the hybridisation of its nitrogen atom.'),
            kind: 'match',
            answer: { left: [{ mol: { smi: 'CN', name: t('metanaminas', 'methanamine') } }, { mol: { smi: 'CC=N', opts: { lonePairs: true } } }, { mol: { smi: 'CC#N', name: t('etannitrilas', 'ethanenitrile') } }], right: [ft('sp³'), ft('sp²'), ft('sp')], pairs: [0, 1, 2] },
            hint: t('Pažiūrėkite, kokiu ryšiu azotas jungiasi su anglimi: viengubuoju, dvigubuoju ar trigubuoju.', 'Look at the bond by which nitrogen is joined to carbon: single, double or triple.'),
            solution: t('Aminas (tik viengubieji ryšiai) – sp³; iminas ($C=N$) – sp²; nitrilas ($C≡N$) – sp.', 'Amine (only single bonds) – sp³; imine ($C=N$) – sp²; nitrile ($C≡N$) – sp.')
          }],
          why: t('Azoto hibridizacija, kaip ir anglies, rodo, kiek sričių (σ ryšių ir laisvųjų porų) jis turi: amine 3 + 1, imine 2 + 1, nitrile 1 + 1.', 'The hybridisation of nitrogen, as of carbon, counts its regions (σ bonds and lone pairs): amine 3 + 1, imine 2 + 1, nitrile 1 + 1.'),
          src: 'L2 p14', claims: [{ hyb: ['CN', 1, 'sp3'] }, { hyb: ['CC=N', 2, 'sp2'] }, { hyb: ['CC#N', 2, 'sp'] }]
        },
        {
          id: 'u02.nohyb.4',
          q: [{ p: t('Acetone yra paprasčiausias ketonas.', 'Acetone is the simplest ketone.') }, { mol: { smi: 'CC(=O)C', name: t('propanonas', 'propan-2-one'), opts: { numbers: 'all' } } }],
          steps: [
            {
              prompt: t('Bakstelėkite visus sp² hibridizacijos atomus.', 'Tap every sp² atom.'),
              kind: 'atoms', mol: { smi: 'CC(=O)C', opts: { numbers: 'all' } }, from: 'hyb:sp2',
              hint: t('Suskaičiuokite, kiek sričių (σ ryšių ir laisvųjų porų) turi kiekvienas atomas, ir atsiminkite, kad ir deguonis turi hibridizaciją.', 'Count how many regions (σ bonds and lone pairs) each atom has, and remember that oxygen is hybridised too.'),
              solution: t('Karbonilo anglis (Nr. 2) ir deguonis (Nr. 3) yra sp², o abi metilo grupės (Nr. 1 ir Nr. 4) sp³.', 'The carbonyl carbon (no. 2) and the oxygen (no. 3) are sp², and both methyl groups (no. 1 and no. 4) are sp³.')
            },
            {
              prompt: t('Kiek laisvųjų elektronų porų turi šis deguonis?', 'How many lone pairs does this oxygen have?'),
              kind: 'number', answer: { value: 2, tol: 0 },
              hint: t('Deguonis turi 6 valentinius elektronus, du iš jų sudaro dvigubąjį ryšį.', 'Oxygen has 6 valence electrons, two of which form the double bond.'),
              solution: t('Dvigubasis ryšys naudoja 2 elektronus, lieka 4: dvi laisvosios poros (jos yra sp² orbitalėse).', 'The double bond uses 2 electrons and 4 are left: two lone pairs (in sp² orbitals).')
            }
          ],
          why: t('Karbonilo grupėje ($C=O$) abu atomai yra sp²: σ ryšys susidaro iš sp² orbitalių, π ryšį sudaro p orbitalės. Deguonies dvi laisvosios poros užima kitas dvi sp² orbitales.', 'In the carbonyl group ($C=O$) both atoms are sp²: the σ bond is formed from sp² orbitals and the π bond from p orbitals. The two lone pairs of oxygen occupy the other two sp² orbitals.'),
          src: 'L2 p16, p18', claims: [{ hyb: ['CC(=O)C', 1, 'sp2'] }, { hyb: ['CC(=O)C', 2, 'sp2'] }, { name: ['CC(=O)C', { lt: 'propanonas', en: 'propan-2-one' }] }]
        },
        {
          id: 'u02.nohyb.5',
          q: [{ p: t('Trys junginiai turi formulę $C3H7N$.', 'Three compounds have the formula $C3H7N$.') }],
          steps: [{
            prompt: t('Kuriame iš jų azoto atomas yra sp³ hibridizacijos?', 'In which of them is the nitrogen atom sp³ hybridised?'),
            kind: 'choice', options: [mo('C=CCN'), mo('CCC=N'), mo('CC=NC')], answer: 0,
            hint: t('Pažiūrėkite, ar azotas turi dvigubąjį ryšį, ar tik viengubuosius.', 'See whether nitrogen has a double bond or only single bonds.'),
            solution: t('Alilaminas turi tik viengubuosius ryšius ir tris sritis plius laisvąją porą: sp³. Abiejuose iminuose azotas turi dvigubąjį ryšį $C=N$: sp².', 'Allylamine has only single bonds, three bonds plus a lone pair: sp³. In both imines nitrogen has a $C=N$ double bond: sp².')
          }],
          why: t('Dvigubasis ryšys $C=N$ azotui duoda tris sritis (σ ryšys su $C$, σ ryšys su $H$ ar $C$ ir laisvoji pora) – sp²; tik viengubuosius ryšius turintis ir nekonjuguotas azotas yra sp³.', 'A $C=N$ double bond gives nitrogen three regions (σ bond to $C$, σ bond to $H$ or $C$, and the lone pair): sp²; a nitrogen with only single bonds and no conjugation is sp³.'),
          src: 'L2 p14', claims: [{ hyb: ['C=CCN', 3, 'sp3'] }, { hyb: ['CCC=N', 3, 'sp2'] }, { hyb: ['CC=NC', 2, 'sp2'] }, { formula: ['C=CCN', 'C3H7N'] }, { formula: ['CCC=N', 'C3H7N'] }, { formula: ['CC=NC', 'C3H7N'] }]
        },
        {
          id: 'u02.nohyb.6',
          q: [{ p: t('Acetamido molekulėje azotas jungiasi tik viengubaisiais ryšiais ir turi laisvąją porą.', 'In the acetamide molecule nitrogen has only single bonds and carries a lone pair.') }, { mol: { smi: 'CC(N)=O', name: t('etanamidas', 'ethanamide'), opts: { lonePairs: true, numbers: 'all' } } }],
          steps: [{
            prompt: t('Kokios hibridizacijos yra azotas ir kodėl?', 'What is the hybridisation of nitrogen, and why?'),
            kind: 'choice',
            options: [
              tx('sp²: laisvoji pora yra p orbitalėje ir konjuguota su $C=O$ grupe.', 'sp²: the lone pair is in a p orbital and conjugated with the $C=O$ group.'),
              tx('sp³: azotas turi tik viengubuosius ryšius.', 'sp³: nitrogen has only single bonds.'),
              tx('sp²: azotas sudaro dvigubąjį ryšį su anglimi.', 'sp²: nitrogen forms a double bond with carbon.'),
              tx('sp: azotas turi laisvąją porą.', 'sp: nitrogen has a lone pair.')
            ],
            answer: 0,
            hint: t('Pagalvokite, kas yra šalia azoto: ar jo laisvoji pora gali sąveikauti su kaimynine π sistema?', 'Think what is next to the nitrogen: can its lone pair interact with a neighbouring π system?'),
            solution: t('Laisvoji pora patenka į p orbitalę ir persidengia su $C=O$ π sistema, todėl azotas yra sp² (amidų $N$ – sp²). Dvigubojo ryšio su anglimi nėra.', 'The lone pair goes into a p orbital and overlaps the π system of $C=O$, so nitrogen is sp² (the $N$ of amides is sp²). There is no double bond to carbon.')
          }],
          why: t('Azoto ar deguonies hibridizacijos nepakanka spręsti vien iš ryšių: kai laisvoji pora šalia π sistemos, atomas yra sp². Todėl amido azotas plokščias, o amino – piramidinis.', 'The hybridisation of N or O cannot be read from the bonds alone: when the lone pair stands next to a π system, the atom is sp². So an amide nitrogen is planar, an amine nitrogen pyramidal.'),
          src: 'L2 p14, p19', claims: [{ hyb: ['CC(N)=O', 2, 'sp2'] }, { name: ['CC(N)=O', { lt: 'etanamidas', en: 'ethanamide' }] }]
        },
        {
          id: 'u02.nohyb.7',
          q: [{ p: t('Palyginkite deguonies atomą metanolyje ir fenolyje.', 'Compare the oxygen atom in methanol and in phenol.') }, { mol: [{ smi: 'CO', name: t('metanolis', 'methanol'), opts: { lonePairs: true } }, { smi: 'Oc1ccccc1', name: t('fenolis', 'phenol'), opts: { lonePairs: true } }] }],
          steps: [{
            prompt: t('Kuris teiginys teisingas?', 'Which statement is right?'),
            kind: 'choice',
            options: [
              tx('Metanolyje $O$ yra sp³, fenolyje sp², nes jo laisvoji pora konjuguota su benzeno žiedu.', 'In methanol $O$ is sp³ and in phenol sp², because its lone pair is conjugated with the benzene ring.'),
              tx('Abiejuose $O$ yra sp³, nes yra tik viengubieji ryšiai.', 'In both $O$ is sp³, because there are only single bonds.'),
              tx('Metanolyje $O$ yra sp², fenolyje sp³.', 'In methanol $O$ is sp² and in phenol sp³.'),
              tx('Abiejuose $O$ yra sp².', 'In both $O$ is sp².')
            ],
            answer: 0,
            hint: t('Palyginkite, kas prijungta prie deguonies: sotus ar π sistemos atomas.', 'Compare what is attached to oxygen: a saturated atom or an atom of a π system.'),
            solution: t('Alkoholio deguonis sp³ ($H_2O$ pavyzdys). Fenolio deguonies laisvoji pora sąveikauja su žiedo π sistema, todėl deguonis sp².', 'The oxygen of an alcohol is sp³ (like water). The lone pair of the phenol oxygen interacts with the π system of the ring, so that oxygen is sp².')
          }],
          why: t('Taisyklė ta pati kaip azotui: viengubuosius ryšius turintis heteroatomas yra sp³ tik tada, kai šalia nėra π sistemos.', 'The rule is the same as for nitrogen: a heteroatom with single bonds is sp³ only when no π system is nearby.'),
          src: 'L2 p16', claims: [{ hyb: ['CO', 1, 'sp3'] }, { hyb: ['Oc1ccccc1', 0, 'sp2'] }]
        },
        {
          id: 'u02.nohyb.8',
          q: [{ p: t('Siera, skirtingai nei deguonis, junginiuose gali turėti skirtingą valentingumą.', 'Sulfur, unlike oxygen, can have different valences in compounds.') }],
          steps: [
            {
              prompt: t('Priskirkite kiekvienam junginiui sieros valentingumą.', 'Match each compound with the valence of sulfur.'),
              kind: 'match',
              answer: { left: [{ mol: { smi: 'CS', caption: t('metantiolis', 'methanethiol') } }, { mol: { smi: 'CS(C)=O', caption: t('dimetilsulfoksidas', 'dimethyl sulfoxide') } }, { mol: { smi: 'CS(=O)(=O)O', caption: t('metansulfonrūgštis', 'methanesulfonic acid') } }], right: [ft('2'), ft('4'), ft('6')], pairs: [0, 1, 2] },
              hint: t('Suskaičiuokite ryšių linijas prie sieros: dvigubasis ryšys duoda dvi.', 'Count the bond lines at sulfur: a double bond gives two.'),
              solution: t('Tiolyje 2 viengubieji ryšiai; sulfokside viengubieji su $C$ ir du ryšiai, iš viso 4; sulfonrūgštyje du dvigubieji ir du viengubieji: 6.', 'The thiol has 2 single bonds; the sulfoxide has two single bonds and the S=O double bond, 4 in all; the sulfonic acid has two double and two single bonds: 6.')
            },
            {
              prompt: t('Kodėl siera gali sudaryti daugiau ryšių, nei leidžia oktetas, o deguonis – ne?', 'Why can sulfur form more bonds than the octet allows, while oxygen cannot?'),
              kind: 'choice',
              options: [
                tx('Siera turi laisvų 3d orbitalių, į kurias gali būti pakelti elektronai.', 'Sulfur has vacant 3d orbitals to which electrons can be promoted.'),
                tx('Siera elektroneigiamesnė už deguonį.', 'Sulfur is more electronegative than oxygen.'),
                tx('Siera turi mažiau valentinių elektronų.', 'Sulfur has fewer valence electrons.'),
                tx('Siera yra metalas.', 'Sulfur is a metal.')
              ],
              answer: 0,
              hint: t('Pagalvokite apie sluoksnį, kuriame yra sieros valentiniai elektronai, palyginti su deguonimi.', 'Think of the shell that holds the valence electrons of sulfur compared with oxygen.'),
              solution: t('Antro periodo deguonis turi tik 2s ir 2p orbitales, trečio periodo siera dar ir 3d. Todėl sužadinta siera gali turėti 4 ar 6 nesuporuotus elektronus.', 'Oxygen, in period 2, has only 2s and 2p orbitals; sulfur, in period 3, also has 3d. So excited sulfur can have 4 or 6 unpaired electrons.')
            }
          ],
          why: t('Oktetų taisyklė galioja C, N, O ir F (antras periodas). Trečio periodo S ir P dėl 3d orbitalių gali turėti daugiau nei 8 elektronus.', 'The octet rule holds for C, N, O and F (period 2). S and P of period 3 can hold more than 8 electrons because of their 3d orbitals.'),
          src: 'L2 p22, p23', claims: [{ formula: ['CS', 'CH4S'] }, { formula: ['CS(C)=O', 'C2H6OS'] }, { formula: ['CS(=O)(=O)O', 'CH4O3S'] }]
        },
        {
          id: 'u02.nohyb.9',
          q: [{ p: t('Propadienas (alenas) turi du dvigubuosius ryšius prie vieno anglies atomo.', 'Propadiene (allene) has two double bonds at one carbon atom.') }, { mol: { smi: 'C=C=C', name: t('propadienas', 'propa-1,2-diene') } }],
          steps: [
            {
              prompt: t('Kokios hibridizacijos yra trys anglies atomai (nuo kairiojo iki dešiniojo)?', 'What are the hybridisations of the three carbons (from left to right)?'),
              kind: 'choice', options: [ft('$sp²$ – $sp$ – $sp²$'), ft('$sp²$ – $sp²$ – $sp²$'), ft('$sp$ – $sp²$ – $sp$'), ft('$sp³$ – $sp$ – $sp³$')], answer: 0,
              hint: t('Vidurinis atomas turi du dvigubuosius ryšius, o kraštiniai – po vieną dvigubąjį ir du vandenilius.', 'The middle atom has two double bonds, and the end atoms have one double bond and two hydrogens each.'),
              solution: t('Vidurinė anglis: du dvigubieji ryšiai, dvi sritys, sp. Galinės: dvigubasis ir du $C–H$, trys sritys, sp².', 'Middle carbon: two double bonds, two regions, sp. End carbons: a double bond and two $C–H$, three regions, sp².')
            },
            {
              prompt: t('Kokia yra alene dviejų $CH2$ grupių plokštumų tarpusavio padėtis?', 'How are the planes of the two $CH2$ groups placed in allene?'),
              kind: 'choice',
              options: [
                tx('Statmenos viena kitai: du π ryšiai yra statmenose plokštumose.', 'Perpendicular to each other: the two π bonds lie in perpendicular planes.'),
                tx('Vienoje plokštumoje: visi penki atomai yra plokštumoje.', 'In one plane: all five atoms lie in one plane.'),
                tx('Sutampa, nes molekulė tiesinė.', 'They coincide, because the molecule is linear.'),
                tx('Kampas tarp jų 109,5°.', 'The angle between them is 109.5°.')
              ],
              answer: 0,
              hint: t('Vidurinis atomas turi dvi statmenas nehibridines p orbitales, kiekviena sudaro vieną π ryšį.', 'The middle atom has two perpendicular unhybridised p orbitals, each forming one π bond.'),
              solution: t('Kiekvienas π ryšys yra statmenas kitam (viena p orbitalė statmena kitai), todėl galinių $CH2$ grupių plokštumos viena kitai statmenos (sukamos 90°).', 'Each π bond is perpendicular to the other (one p orbital is perpendicular to the other), so the planes of the end $CH2$ groups are turned 90° to each other.')
            }
          ],
          why: t('Alenas parodo, kad π ryšių kryptys priklauso nuo p orbitalių krypčių: du π ryšiai prie tos pačios sp anglies yra statmeni, todėl alenas nėra plokščias.', 'Allene shows that the directions of π bonds follow the directions of the p orbitals: two π bonds at the same sp carbon are perpendicular, so allene is not flat.'),
          src: 'L2 p30', claims: [{ hyb: ['C=C=C', 0, 'sp2'] }, { hyb: ['C=C=C', 1, 'sp'] }, { hyb: ['C=C=C', 2, 'sp2'] }, { name: ['C=C=C', { lt: 'propadienas', en: 'propa-1,2-diene' }] }]
        },
        {
          id: 'u02.nohyb.10',
          q: [{ p: t('Pateikti keturi angliavandeniliai.', 'Four hydrocarbons are shown.') }],
          steps: [{
            prompt: t('Pažymėkite visas molekules, kurių visi atomai yra vienoje plokštumoje.', 'Pick every molecule whose atoms all lie in one plane.'),
            kind: 'multi', options: [mo('C=C', { condensed: false }), mo('C#C'), mo('CC'), mo('C=C=C')], answer: [0, 1],
            hint: t('Pagalvokite apie anglies atomų hibridizaciją ir kryptis, į kurias nukreiptos jų σ ryšiai.', 'Think of the hybridisation of the carbons and the directions of their σ bonds.'),
            solution: t('Etenas plokščias (sp², 120°), etinas tiesinis (sp, 180°), todėl abu guli plokštumoje. Etanas turi sp³ atomus (tetraedras), o alene vienos $CH2$ grupės plokštuma statmena kitos.', 'Ethene is planar (sp², 120°) and ethyne is linear (sp, 180°), so both lie in a plane. Ethane has sp³ atoms (tetrahedra), and in allene the plane of one $CH2$ group is perpendicular to the other.')
          }],
          why: t('Plokščias molekules sudaro sp² ir sp atomai, kurių ryšiai plokštumoje; sp³ atomas visada duoda tetraedrą, o alenas dėl statmenų π ryšių nėra plokščias.', 'Flat molecules are built of sp² and sp atoms whose bonds lie in the plane; an sp³ atom always gives a tetrahedron, and allene, with its perpendicular π bonds, is not flat.'),
          src: 'L2 p28, p29, p30'
        },
        {
          id: 'u02.nohyb.11',
          q: [{ p: t('Acetonitrilas turi trigubąjį ryšį $C≡N$.', 'Acetonitrile has a $C≡N$ triple bond.') }, { mol: { smi: 'CC#N', name: t('etannitrilas', 'ethanenitrile'), opts: { numbers: 'all' } } }],
          steps: [
            {
              prompt: t('Bakstelėkite visus sp hibridizacijos atomus.', 'Tap every sp atom.'),
              kind: 'atoms', mol: { smi: 'CC#N', opts: { numbers: 'all' } }, from: 'hyb:sp',
              hint: t('Atomas su trigubuoju ryšiu turi tik dvi sritis: σ ryšį su kaimynu ir antrą σ ryšį (arba laisvąją porą).', 'An atom with a triple bond has only two regions: a σ bond to the neighbour and the σ bond of the triple bond (or a lone pair).'),
              solution: t('Nitrilo anglis (Nr. 2) ir azotas (Nr. 3) yra sp; metilo anglis (Nr. 1) – sp³.', 'The nitrile carbon (no. 2) and the nitrogen (no. 3) are sp; the methyl carbon (no. 1) is sp³.')
            },
            {
              prompt: t('Kokioje orbitalėje yra azoto laisvoji pora?', 'In what kind of orbital is the lone pair of nitrogen?'),
              kind: 'choice', options: [ft('sp'), ft('sp²'), ft('sp³'), ft('p')], answer: 0,
              hint: t('Laisvoji pora užima vieną iš azoto hibridinių orbitalių.', 'The lone pair occupies one of the hybrid orbitals of nitrogen.'),
              solution: t('Azotas yra sp: viena sp orbitalė sudaro σ ryšį su anglimi, kita laiko laisvąją porą.', 'Nitrogen is sp: one sp orbital forms the σ bond to carbon, and the other holds the lone pair.')
            }
          ],
          why: t('Trigubasis ryšys yra σ ir du π, todėl abu jo atomai turi tik dvi hibridines orbitales (sp) ir dvi statmenas p orbitales π ryšiams. Kampas $C–C≡N$ yra 180°.', 'A triple bond is a σ and two π bonds, so both of its atoms have only two hybrid orbitals (sp) and two perpendicular p orbitals for the π bonds. The $C–C≡N$ angle is 180°.'),
          src: 'L2 p14, p18', claims: [{ hyb: ['CC#N', 1, 'sp'] }, { hyb: ['CC#N', 2, 'sp'] }, { name: ['CC#N', { lt: 'etannitrilas', en: 'ethanenitrile' }] }]
        },
        {
          id: 'u02.nohyb.12',
          q: [{ p: t('Askorbo rūgštis (vitaminas C) turi penkianarį laktono žiedą, dvigubąjį ryšį $C=C$ ir karbonilo grupę.', 'Ascorbic acid (vitamin C) has a five-membered lactone ring, a $C=C$ double bond and a carbonyl group.') }, { mol: { smi: 'OCC(O)C1OC(=O)C(O)=C1O', opts: { numbers: 'all' } } }],
          steps: [
            {
              prompt: t('Bakstelėkite visus sp³ hibridizacijos anglies atomus.', 'Tap every sp³ carbon atom.'),
              kind: 'atoms', mol: { smi: 'OCC(O)C1OC(=O)C(O)=C1O', opts: { numbers: 'all' } }, answer: [1, 2, 4],
              hint: t('Raskite anglies atomus, kurie turi tik viengubuosius ryšius.', 'Find the carbon atoms that have only single bonds.'),
              solution: t('Sp³ yra $CH2OH$ anglis (Nr. 2), $CH(OH)$ anglis (Nr. 3) ir žiedo $CH$ anglis (Nr. 5). Karbonilo anglis (Nr. 7) ir abu enolio $C=C$ atomai (Nr. 9 ir Nr. 11) yra sp².', 'The sp³ carbons are the $CH2OH$ carbon (no. 2), the $CH(OH)$ carbon (no. 3) and the ring $CH$ carbon (no. 5). The carbonyl carbon (no. 7) and both atoms of the enol $C=C$ (no. 9 and no. 11) are sp².')
            },
            {
              prompt: t('Kiek sp² hibridizacijos anglies atomų turi molekulė?', 'How many sp² carbon atoms does the molecule have?'),
              kind: 'number', answer: { value: 3, tol: 0 },
              hint: t('Suskaičiuokite anglies atomus, turinčius dvigubąjį ryšį.', 'Count the carbon atoms that carry a double bond.'),
              solution: t('Dvigubąjį ryšį turi trys anglies atomai: $C=O$ ir abu $C=C$ atomai.', 'Three carbon atoms have a double bond: the $C=O$ carbon and both atoms of the $C=C$.')
            }
          ],
          why: t('Anglies hibridizaciją nusako vien jos ryšių rūšys: viengubieji – sp³, dvigubasis – sp². Šiame uždavinyje klausiama tik apie anglį; heteroatomų hibridizacija priklauso nuo laisvosios poros konjugacijos (19 skaidrė).', 'The hybridisation of carbon is set by its kinds of bonds alone: single – sp³, double – sp². This problem asks only about carbon; the hybridisation of the heteroatoms depends on conjugation of the lone pair (slide 19).'),
          src: 'L2 p20, p18', claims: [{ hyb: ['OCC(O)C1OC(=O)C(O)=C1O', 1, 'sp3'] }, { hyb: ['OCC(O)C1OC(=O)C(O)=C1O', 2, 'sp3'] }, { hyb: ['OCC(O)C1OC(=O)C(O)=C1O', 4, 'sp3'] }, { hyb: ['OCC(O)C1OC(=O)C(O)=C1O', 6, 'sp2'] }, { hyb: ['OCC(O)C1OC(=O)C(O)=C1O', 8, 'sp2'] }, { hyb: ['OCC(O)C1OC(=O)C(O)=C1O', 10, 'sp2'] }, { formula: ['OCC(O)C1OC(=O)C(O)=C1O', 'C6H8O6'] }]
        },
        {
          id: 'u02.nohyb.13',
          q: [{ p: t('Kofeinas yra purino darinys: du sujungti žiedai, trys $N-CH3$ grupės ir dvi karbonilo grupės.', 'Caffeine is a purine derivative: two fused rings, three $N-CH3$ groups and two carbonyl groups.') }, { mol: { smi: 'CN1C=NC2=C1C(=O)N(C)C(=O)N2C', opts: { numbers: 'all' } } }],
          steps: [
            {
              prompt: t('Bakstelėkite visus sp³ hibridizacijos anglies atomus.', 'Tap every sp³ carbon atom.'),
              kind: 'atoms', mol: { smi: 'CN1C=NC2=C1C(=O)N(C)C(=O)N2C', opts: { numbers: 'all' } }, answer: [0, 9, 13],
              hint: t('Raskite anglies atomus, kurie turi tik viengubuosius ryšius.', 'Find the carbon atoms that have only single bonds.'),
              solution: t('Sp³ yra tik trys metilo grupių anglies atomai (Nr. 1, Nr. 10 ir Nr. 14). Visi kiti anglies atomai turi dvigubąjį ryšį (žiedo $C=C$, $C=N$ arba $C=O$) ir yra sp².', 'Only the three methyl carbons (no. 1, no. 10 and no. 14) are sp³. Every other carbon has a double bond (the ring $C=C$, $C=N$ or $C=O$) and is sp².')
            },
            {
              prompt: t('Kiek sp² hibridizacijos anglies atomų turi molekulė?', 'How many sp² carbon atoms does the molecule have?'),
              kind: 'number', answer: { value: 5, tol: 0 },
              hint: t('Iš 8 anglies atomų atimkite sp³ atomus.', 'Subtract the sp³ atoms from the 8 carbon atoms.'),
              solution: t('8 anglies atomai, iš jų 3 sp³, taigi sp² yra 5. (Azoto atomai čia nevertinami; pagal konjugacijos taisyklę jie taip pat sp².)', 'There are 8 carbon atoms, 3 of them sp³, so 5 are sp². (The nitrogens are not asked here; by the conjugation rule they are sp² too.)')
            }
          ],
          why: t('Kofeino žiedų atomai sudaro vieną konjuguotą plokščią sistemą: todėl net azotai, turintys tik viengubuosius ryšius, yra sp² – jų laisvosios poros guli p orbitalėse.', 'The ring atoms of caffeine form one flat conjugated system: so even the nitrogens that have only single bonds are sp², with their lone pairs in p orbitals.'),
          src: 'L2 p20, p14', claims: [{ hyb: ['CN1C=NC2=C1C(=O)N(C)C(=O)N2C', 0, 'sp3'] }, { hyb: ['CN1C=NC2=C1C(=O)N(C)C(=O)N2C', 1, 'sp2'] }, { formula: ['CN1C=NC2=C1C(=O)N(C)C(=O)N2C', 'C8H10N4O2'] }]
        }
      ]
    },

    /* ============================================================ u02.ionic */
    {
      id: 'u02.ionic',
      title: t('Joniniai ir kovalentiniai ryšiai junginiuose', 'Ionic and covalent bonds in compounds'),
      mirrors: ['S2.4'],
      bank: [
        ionProblem(1, 'CCl', t('chlormetanas', 'chloromethane'), [
          [t('Ryšys $C–Cl$ yra polinis kovalentinis.', 'The $C–Cl$ bond is polar covalent.'), true],
          [t('Ryšys $C–Cl$ yra joninis.', 'The $C–Cl$ bond is ionic.'), false],
          [t('$C–H$ ryšiai yra kovalentiniai.', 'The $C–H$ bonds are covalent.'), true],
          [t('Junginys sudarytas iš jonų $CH3+$ ir $Cl−$.', 'The compound is built of $CH3+$ and $Cl−$ ions.'), false]],
          0, t('ΔEN ($C$ ir $Cl$) yra 0,5, todėl elektronų pora pasislenka į chlorą, bet jonai nesusidaro.', 'ΔEN of $C$ and $Cl$ is 0.5, so the electron pair shifts towards chlorine, but no ions form.'), 'CCl', 'CH3Cl'),
        ionProblem(2, 'ClCl', t('chloras', 'chlorine'), [
          [t('Ryšys $Cl–Cl$ yra nepolinis kovalentinis.', 'The $Cl–Cl$ bond is nonpolar covalent.'), true],
          [t('Vienas atomas yra $Cl+$, kitas $Cl−$.', 'One atom is $Cl+$ and the other $Cl−$.'), false],
          [t('Atomus sieja joninis ryšys.', 'An ionic bond joins the atoms.'), false],
          [t('Elektronų pora tolygiai dalijama tarp abiejų atomų.', 'The electron pair is shared evenly by both atoms.'), true]],
          0, t('Du vienodi atomai turi vienodą elektrinį neigiamumą (ΔEN = 0), todėl niekuris nepatraukia poros stipriau.', 'Two identical atoms have the same electronegativity (ΔEN = 0), so neither pulls the pair harder.'), 'ClCl', 'Cl2'),
        ionProblem(3, 'OCl', t('hipochlorito rūgštis (HOCl)', 'hypochlorous acid (HOCl)'), [
          [t('Ryšys $O–H$ yra polinis kovalentinis (ΔEN = 1,4).', 'The $O–H$ bond is polar covalent (ΔEN = 1.4).'), true],
          [t('Junginys sudarytas iš $H+$ ir $OCl−$ jonų.', 'The compound consists of $H+$ and $OCl−$ ions.'), false],
          [t('Ryšys $O–Cl$ yra kovalentinis.', 'The $O–Cl$ bond is covalent.'), true],
          [t('Ryšys $O–H$ yra joninis, nes vandenilis atiduoda elektroną.', 'The $O–H$ bond is ionic, because hydrogen gives up an electron.'), false]],
          0, t('Nemetalų atomai tarpusavyje jungiasi kovalentiniais ryšiais. $O–H$ ryšys poliškas, nes deguonis (3,5) elektroneigiamesnis už vandenilį (2,1).', 'Atoms of nonmetals bond to each other covalently. The $O–H$ bond is polar because oxygen (3.5) is more electronegative than hydrogen (2.1).'), 'OCl', 'ClHO'),
        ionProblem(4, 'CC(=O)[O-].[K+]', t('kalio acetatas', 'potassium acetate'), [
          [t('Joninis ryšys yra tarp $K+$ ir karboksilato deguonies.', 'The ionic bond is between $K+$ and the carboxylate oxygen.'), true],
          [t('$C–C$ ir $C–H$ ryšiai yra joniniai.', 'The $C–C$ and $C–H$ bonds are ionic.'), false],
          [t('Anijone esantys ryšiai tarp $C$ ir $O$ yra kovalentiniai.', 'The bonds between $C$ and $O$ in the anion are covalent.'), true],
          [t('Kalis kovalentiškai jungiasi su anglimi.', 'Potassium bonds covalently to carbon.'), false]],
          1, t('Kalis (0,8) ir deguonis (3,5): ΔEN = 2,7, ryšys joninis. Pačiame acetato anijone atomus jungia kovalentiniai ryšiai.', 'Potassium (0.8) and oxygen (3.5): ΔEN = 2.7, an ionic bond. Inside the acetate anion the atoms are joined by covalent bonds.'), 'CC(=O)[O-].[K+]', 'C2H3KO2'),
        ionProblem(5, 'CC[O-].[Na+]', t('natrio etanoliatas', 'sodium ethoxide'), [
          [t('Natris su deguonimi sudaro joninį ryšį.', 'Sodium forms an ionic bond with oxygen.'), true],
          [t('Etilo grupės viduje esantys ryšiai yra kovalentiniai.', 'The bonds inside the ethyl group are covalent.'), true],
          [t('Visi molekulės ryšiai yra joniniai.', 'All the bonds of the compound are ionic.'), false],
          [t('Ryšys tarp $Na$ ir $O$ yra nepolinis kovalentinis.', 'The bond between $Na$ and $O$ is nonpolar covalent.'), false]],
          1, t('Natrio ir deguonies ΔEN = 2,6, taigi ryšys joninis; etoksido anijono viduje atomus jungia kovalentiniai ryšiai ($C–C$ nepolinis, $C–O$ polinis).', 'ΔEN of sodium and oxygen is 2.6, so the bond is ionic; inside the ethoxide anion the atoms are joined by covalent bonds ($C–C$ nonpolar, $C–O$ polar).'), 'CC[O-].[Na+]', 'C2H5NaO'),
        {
          id: 'u02.ionic.6',
          q: [{ p: t('Palyginkite metanolį, natrio metanoliatą ir natrio metanoatą.', 'Compare methanol, sodium methoxide and sodium methanoate.') }, { mol: [{ smi: 'CO', name: t('metanolis', 'methanol') }, { smi: 'C[O-].[Na+]', caption: t('natrio metanoliatas', 'sodium methoxide') }, { smi: 'O=C[O-].[Na+]', caption: t('natrio metanoatas', 'sodium methanoate') }] }],
          steps: [{
            prompt: t('Kuriuose iš šių junginių yra joninis ryšys?', 'Which of these compounds contain an ionic bond?'),
            kind: 'multi', options: [mo('CO'), mo('C[O-].[Na+]'), mo('O=C[O-].[Na+]'), mo('COC')], answer: [1, 2],
            hint: t('Ieškokite junginių, kurių formulėje yra metalo katijonas ir anijonas.', 'Look for compounds that contain a metal cation and an anion.'),
            solution: t('Joninis ryšys yra natrio druskose: $Na+$ ir $O−$. Metanolyje ir dimetilo eteryje visi ryšiai kovalentiniai.', 'An ionic bond is present in the sodium salts: $Na+$ and $O−$. In methanol and dimethyl ether all bonds are covalent.')
          }],
          why: t('Rūgščių ir alkoholių druskos yra joninės: tarp metalo ir deguonies – joninis ryšys, anijone – kovalentiniai. Pats alkoholis ar rūgštis (metanolis, eteris) – tik kovalentiniai.', 'Salts of acids and alcohols are ionic: ionic between the metal and oxygen, covalent in the anion. The alcohol or acid itself (methanol, ether) has covalent bonds only.'),
          src: 'L2 p52, S2.4', claims: [{ name: ['CO', { lt: 'metanolis', en: 'methanol' }] }]
        },
        ionProblem(7, '[NH4+].[Cl-]', t('amonio chloridas', 'ammonium chloride'), [
          [t('Tarp $NH4+$ ir $Cl−$ yra joninis ryšys.', 'Between $NH4+$ and $Cl−$ there is an ionic bond.'), true],
          [t('Amonio jone visi keturi $N–H$ ryšiai yra kovalentiniai, nors vienas atsirado donoriniu-akceptoriniu būdu.', 'In the ammonium ion all four $N–H$ bonds are covalent, although one arose by the donor–acceptor route.'), true],
          [t('Amonio jone vienas $N–H$ ryšys yra joninis.', 'In the ammonium ion one $N–H$ bond is ionic.'), false],
          [t('Chloras kovalentiškai prijungtas prie azoto.', 'Chlorine is covalently attached to nitrogen.'), false]],
          1, t('Druska sudaryta iš amonio katijono ir chlorido anijono. Katijone ryšiai kovalentiniai, ir jie nesiskiria vienas nuo kito.', 'The salt consists of an ammonium cation and a chloride anion. Inside the cation the bonds are covalent and indistinguishable.'), '[NH4+].[Cl-]', 'ClH4N'),
        {
          id: 'u02.ionic.8',
          q: [{ p: t('Pateikta penki junginiai.', 'Five compounds are shown.') }, { mol: [{ smi: 'CCl', caption: f('CH₃Cl') }, { smi: 'ClCl', caption: f('Cl₂') }, { smi: 'OCl', caption: f('HOCl') }, { smi: 'CC(=O)[O-].[K+]', caption: f('CH₃COOK') }, { smi: 'CC[O-].[Na+]', caption: f('C₂H₅ONa') }] }],
          steps: [{
            prompt: t('Kuriuose iš jų yra bent vienas joninis ryšys?', 'Which of them contain at least one ionic bond?'),
            kind: 'multi', options: [mo('CCl'), mo('ClCl'), mo('OCl'), mo('CC(=O)[O-].[K+]'), mo('CC[O-].[Na+]')], answer: [3, 4],
            hint: t('Joninis ryšys atsiranda, kai ΔEN didelis; tai tipiška metalo ir deguonies porai.', 'An ionic bond appears when ΔEN is large; it is typical of a metal–oxygen pair.'),
            solution: t('Kalio acetate ir natrio etoksido molekulėje yra $O−$ ir metalo katijonas. Likusiuose junginiuose elektronų poros bendros: $C–Cl$ polinis, $Cl–Cl$ nepolinis, $O–H$ ir $O–Cl$ kovalentiniai.', 'Potassium acetate and sodium ethoxide contain $O−$ and a metal cation. In the other compounds the electron pairs are shared: $C–Cl$ polar, $Cl–Cl$ nonpolar, $O–H$ and $O–Cl$ covalent.')
          }],
          why: t('Organiniuose junginiuose joninį ryšį beveik visada sudaro metalas ir deguonis (arba kitas elektroneigiamas atomas) druskose; nemetalų atomai jungiasi kovalentiškai, o poliškumą nusako ΔEN.', 'In organic compounds an ionic bond is almost always formed by a metal and oxygen (or another electronegative atom) in salts; atoms of nonmetals bond covalently, and ΔEN decides the polarity.'),
          src: 'S2.4, L2 p36'
        }
      ]
    },

    /* ============================================================ u02.hbondwhy */
    {
      id: 'u02.hbondwhy',
      title: t('Vandeniliniai ryšiai ir junginių savybės', 'Hydrogen bonds and the properties of compounds'),
      mirrors: [],
      bank: [
        {
          id: 'u02.hbondwhy.1',
          q: [{ p: t('Etanolis ir dimetileteris turi tą pačią formulę $C2H6O$, bet etanolis verda 78,4 °C, o eteris – −23 °C.', 'Ethanol and dimethyl ether have the same formula $C2H6O$, but ethanol boils at 78.4 °C and the ether at −23 °C.') },
            { mol: [{ smi: 'CCO', name: t('etanolis', 'ethanol'), opts: { numbers: 'all' } }, { smi: 'COC', name: t('metoksimetanas', 'methoxymethane') }] }],
          steps: [
            {
              prompt: t('Kuo paaiškinamas toks skirtumas?', 'What explains the difference?'),
              kind: 'choice',
              options: [
                tx('Etanolio molekulės sudaro tarpmolekulinius vandenilinius ryšius (asocijuojasi), o eterio – ne.', 'Ethanol molecules form intermolecular hydrogen bonds (they associate), ether molecules do not.'),
                tx('Etanolis turi didesnę molekulinę masę.', 'Ethanol has the larger molecular mass.'),
                tx('Eteryje kovalentiniai ryšiai silpnesni.', 'The covalent bonds in the ether are weaker.'),
                tx('Etanolis yra joninis junginys.', 'Ethanol is an ionic compound.')
              ],
              answer: 0,
              hint: t('Palyginkite formules ir ieškokite grupės, kuri gali būti donoras.', 'Compare the formulas and look for a group that can be a donor.'),
              solution: t('Abu junginiai izomerai, todėl masė ta pati. Skirtumą duoda $O–H$ grupė etanolyje: jos vandenilis jungiasi su kitos molekulės deguonies pora. Eteris donoro neturi.', 'The compounds are isomers, so the mass is the same. The difference comes from the $O–H$ group of ethanol: its hydrogen bonds to a lone pair of another molecule. The ether has no donor.')
            },
            {
              prompt: t('Bakstelėkite etanolio atomą, kurio laisvoji pora priima vandenilinį ryšį.', 'Tap the atom of ethanol whose lone pair accepts a hydrogen bond.'),
              kind: 'atoms', mol: { smi: 'CCO', opts: { numbers: 'all' } }, answer: [2],
              hint: t('Akceptorius yra didelio elektrinio neigiamumo atomas su laisvąja pora.', 'The acceptor is an atom of high electronegativity with a lone pair.'),
              solution: t('Deguonis (Nr. 3) turi dvi laisvąsias poras, todėl yra akceptorius; jo $H$ – donoras.', 'Oxygen (no. 3) has two lone pairs, so it is the acceptor; its $H$ is the donor.')
            }
          ],
          why: t('Vandeniliniai ryšiai tarp molekulių skystyje reikalauja papildomos energijos nutraukti virinant. Todėl asocijuotas etanolis verda daug aukštesnėje temperatūroje nei neasocijuotas izomeras.', 'Hydrogen bonds between molecules in a liquid take extra energy to break when boiling. So associated ethanol boils at a much higher temperature than its non-associating isomer.'),
          src: 'L2 p47', claims: [{ formula: ['CCO', 'C2H6O'] }, { formula: ['COC', 'C2H6O'] }, { name: ['CCO', { lt: 'etanolis', en: 'ethanol' }] }, { name: ['COC', { lt: 'metoksimetanas', en: 'methoxymethane' }] }]
        },
        {
          id: 'u02.hbondwhy.2',
          q: [{ p: t('Keturių panašios masės junginių virimo temperatūros labai skiriasi.', 'The boiling points of four compounds of similar mass differ greatly.') }, { mol: [{ smi: 'CCC', name: t('propanas', 'propane') }, { smi: 'COC', caption: t('dimetileteris', 'dimethyl ether') }, { smi: 'CC=O', name: t('etanalis', 'ethanal') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }] }],
          steps: [
            {
              prompt: t('Išdėstykite junginius nuo žemiausios iki aukščiausios virimo temperatūros.', 'Put the compounds in order from the lowest to the highest boiling point.'),
              kind: 'order', options: [tx('propanas (−42 °C)', 'propane (−42 °C)'), tx('dimetileteris (−23 °C)', 'dimethyl ether (−23 °C)'), tx('etanalis (20 °C)', 'ethanal (20 °C)'), tx('etanolis (78 °C)', 'ethanol (78 °C)')],
              hint: t('Pirma raskite, kuris junginys gali sudaryti vandenilinius ryšius su savimi. Tada palyginkite poliškumą.', 'First find which compound can form hydrogen bonds with itself. Then compare the polarity.'),
              solution: t('Etanolis asocijuojasi ($O–H$ donoras), todėl verda aukščiausiai. Etanalis ir eteris poliniai, bet be donoro; polinis $C=O$ stipriau traukia molekules nei $C–O–C$. Propanas beveik nepolinis.', 'Ethanol associates (an $O–H$ donor), so it boils highest. Ethanal and the ether are polar but have no donor; the polar $C=O$ attracts the molecules more strongly than $C–O–C$. Propane is almost nonpolar.')
            },
            {
              prompt: t('Kuris veiksnys iš visų labiausiai pakelia virimo temperatūrą šioje eilutėje?', 'Which factor raises the boiling point most in this series?'),
              kind: 'choice',
              options: [
                tx('Vandenilinių ryšių tarp molekulių atsiradimas.', 'The appearance of hydrogen bonds between the molecules.'),
                tx('Atomų skaičius molekulėje.', 'The number of atoms in the molecule.'),
                tx('Hibridizacijos pasikeitimas.', 'A change of hybridisation.'),
                tx('Dvigubieji ryšiai.', 'Double bonds.')
              ],
              answer: 0,
              hint: t('Žiūrėkite, kuri pora skiriasi labiausiai, nors masė beveik ta pati.', 'Look at which pair differs most although the mass is almost the same.'),
              solution: t('Etanolis nuo eterio, turinčio tą pačią formulę, skiriasi 100 °C, ir vienintelė priežastis yra vandenilinis ryšys.', 'Ethanol differs by about 100 °C from the ether of the same formula, and the only reason is the hydrogen bond.')
            }
          ],
          why: t('Virimo temperatūrą lemia, kaip stipriai molekulės traukia viena kitą: nepolinės – silpnai, poliarinės – stipriau, o su vandeniliniais ryšiais – stipriausiai.', 'The boiling point depends on how strongly molecules attract each other: nonpolar ones weakly, polar ones more strongly, and those with hydrogen bonds most strongly.'),
          src: 'L2 p47, Klein', claims: [{ name: ['CCC', { lt: 'propanas', en: 'propane' }] }, { name: ['CC=O', { lt: 'etanalis', en: 'ethanal' }] }]
        },
        {
          id: 'u02.hbondwhy.3',
          q: [{ p: t('Vanduo gali sudaryti vandenilinius ryšius su kitomis vandens molekulėmis.', 'Water can form hydrogen bonds with other water molecules.') }, { mol: { smi: 'O', opts: { lonePairs: true } } }],
          steps: [
            {
              prompt: t('Kiek vandenilinių ryšių daugiausia gali turėti viena vandens molekulė?', 'How many hydrogen bonds can one water molecule form at most?'),
              kind: 'number', answer: { value: 4, tol: 0 },
              hint: t('Suskaičiuokite, kiek donorinių $H$ ir kiek laisvųjų porų yra molekulėje.', 'Count how many donor $H$ and how many lone pairs the molecule has.'),
              solution: t('Du $O–H$ vandeniliai (donorai) ir dvi deguonies laisvosios poros (akceptoriai): 2 + 2 = 4.', 'Two $O–H$ hydrogens (donors) and two lone pairs of oxygen (acceptors): 2 + 2 = 4.')
            },
            {
              prompt: t('Kaip tie ryšiai pasiskirsto?', 'How are these bonds distributed?'),
              kind: 'choice',
              options: [
                tx('Du ryšiai per vandenilius (donorai), du per deguonies laisvąsias poras (akceptorius).', 'Two through the hydrogens (donor), two through the lone pairs of oxygen (acceptor).'),
                tx('Keturi ryšiai per vienintelį deguonies atomą kaip donorą.', 'Four through the single oxygen atom as a donor.'),
                tx('Visi keturi per vandenilius, nes deguonis jų neima.', 'All four through the hydrogens, because oxygen takes none.'),
                tx('Du ryšiai: po vieną per kiekvieną vandenilį.', 'Two bonds: one through each hydrogen.')
              ],
              answer: 0,
              hint: t('Donoras yra $H$ prie deguonies, akceptorius – deguonies laisvoji pora. Suskaičiuokite abiejų rūšių.', 'The donor is the $H$ on oxygen, the acceptor a lone pair of oxygen. Count both kinds.'),
              solution: t('Vandenilio atomai ($δ+$) traukiasi prie kaimynų deguonies laisvųjų porų ($δ−$), o jos pačios laisvosios poros priima kaimynų vandenilius – tetraedrinė struktūra.', 'The hydrogens ($δ+$) are attracted to the lone pairs of neighbouring oxygens ($δ−$), and the molecule’s own lone pairs accept the hydrogens of neighbours: a tetrahedral arrangement.')
            }
          ],
          why: t('Vanduo turi vienodą donorų ir akceptorių skaičių, todėl sudaro tinklą su keturiais ryšiais iš molekulės. Tai paaiškina jo aukštą virimo temperatūrą ir didelę dielektrinę konstantą (78,4).', 'Water has equal numbers of donors and acceptors, so it forms a network with four bonds per molecule. This explains its high boiling point and its large dielectric constant (78.4).'),
          src: 'L2 p45, p46'
        },
        {
          id: 'u02.hbondwhy.4',
          q: [{ p: t('Vandenilinis ryšys sudaromas tarp donoro $X–H$ ir akceptoriaus $:Z$.', 'A hydrogen bond forms between a donor $X–H$ and an acceptor $:Z$.') }],
          steps: [{
            prompt: t('Pažymėkite poras, tarp kurių gali susidaryti vandenilinis ryšys.', 'Pick the pairs between which a hydrogen bond can form.'),
            kind: 'multi',
            options: [ft('$O–H···:N$'), ft('$N–H···:O=C$'), ft('$C–H···:O$'), ft('$C–H···:N$')], answer: [0, 1],
            hint: t('Vandenilis turi būti prijungtas prie didelio elektrinio neigiamumo atomo (N, O, F), kitas atomas turi laisvąją porą.', 'The hydrogen must be attached to an atom of high electronegativity (N, O, F), and the other atom must have a lone pair.'),
            solution: t('Teisingos $O–H···N$ ir $N–H···O=C$. $C–H$ ryšys per mažai poliarizuotas (anglis, 2,5, ir vandenilis, 2,1 yra panašūs), todėl donoru nėra.', 'Right: $O–H···N$ and $N–H···O=C$. The $C–H$ bond is hardly polarised (carbon 2.5 and hydrogen 2.1 are close), so it is not a donor.')
          }],
          why: t('Donoru tampa tik vandenilis prie N, O ar F, nes tik tada jis yra pakankamai δ+; akceptoriumi – bet kuris toks atomas su laisvąja pora.', 'Only a hydrogen on N, O or F becomes a donor, because only then is it sufficiently δ+; any such atom with a lone pair can be the acceptor.'),
          src: 'L2 p43, p44'
        },
        {
          id: 'u02.hbondwhy.5',
          q: [{ p: t('Salicilo rūgštyje vandenilinis ryšys susidaro toje pačioje molekulėje.', 'In salicylic acid a hydrogen bond forms within the same molecule.') }, { mol: { smi: 'OC(=O)c1ccccc1O', caption: t('salicilo rūgštis', 'salicylic acid') } }],
          steps: [{
            prompt: t('Kokia vidinio vandenilinio ryšio sandara?', 'What is the structure of the intramolecular hydrogen bond?'),
            kind: 'choice',
            options: [
              tx('Fenolio $O–H$ vandenilis jungiasi su karboksilo grupės $C=O$ deguonimi ir susidaro šešianaris ciklas.', 'The hydrogen of the phenolic $O–H$ bonds to the $C=O$ oxygen of the carboxyl group, closing a six-membered ring.'),
              tx('Karboksilo $O–H$ vandenilis jungiasi su kitos molekulės karboksilu, sudarydamas dimerą.', 'The carboxyl $O–H$ hydrogen bonds to the carboxyl of another molecule, forming a dimer.'),
              tx('Benzeno žiedo $C–H$ vandenilis jungiasi su karbonilo deguonimi.', 'A ring $C–H$ hydrogen bonds to the carbonyl oxygen.'),
              tx('Ryšys susidaro tarp dviejų deguonies atomų be vandenilio.', 'The bond forms between two oxygen atoms without a hydrogen.')
            ],
            answer: 0,
            hint: t('Raskite donorą ir akceptorių, kurie viena kitai yra gretimose padėtyse prie žiedo.', 'Find a donor and an acceptor on neighbouring positions of the ring.'),
            solution: t('$O–H$ prie atomo C2 ir $C=O$ prie C1 yra arti; vandenilio jungtis sudaro šešianarį ciklą ($H$, $O$, C2, C1, $C$, $O$). Tai vidinis molekulinis ryšys.', 'The $O–H$ at C2 and the $C=O$ at C1 are close; the hydrogen bridge closes a six-membered ring ($H$, $O$, C2, C1, $C$, $O$). This is an intramolecular bond.')
          }],
          why: t('Vidiniai vandeniliniai ryšiai susidaro, kai tarp donoro ir akceptoriaus telpa penkių ar šešių narių ciklas. Toks ryšys, pavyzdžiui, padidina salicilo rūgšties rūgštingumą, palyginti su jos izomerais.', 'Intramolecular hydrogen bonds form when a five- or six-membered ring fits between the donor and the acceptor. Such a bond raises, for example, the acidity of salicylic acid compared with its isomers.'),
          src: 'L2 p49'
        },
        {
          id: 'u02.hbondwhy.6',
          q: [{ p: t('Metanolis maišosi su vandeniu bet kokiomis proporcijomis.', 'Methanol mixes with water in any proportion.') }, { mol: [{ smi: 'CO', name: t('metanolis', 'methanol'), opts: { lonePairs: true } }, { smi: 'O', opts: { lonePairs: true } }] }],
          steps: [
            {
              prompt: t('Kodėl metanolis gerai tirpsta vandenyje?', 'Why does methanol dissolve readily in water?'),
              kind: 'choice',
              options: [
                tx('Jo molekulės sudaro su vandeniu tarpmolekulinius vandenilinius ryšius (hidratuojasi).', 'Its molecules form intermolecular hydrogen bonds with water (they are hydrated).'),
                tx('Metanolis su vandeniu sudaro joninį ryšį.', 'Methanol forms an ionic bond with water.'),
                tx('Metanolyje yra $π$ ryšių.', 'Methanol contains $π$ bonds.'),
                tx('Metanolis – nepolinis junginys.', 'Methanol is a nonpolar compound.')
              ],
              answer: 0,
              hint: t('Pagalvokite, ar metanolis gali būti ir donoras, ir akceptorius.', 'Think whether methanol can be both donor and acceptor.'),
              solution: t('Metanolio $O–H$ yra donoras, deguonis – akceptorius; vandens molekulės dalyvauja kaip abi. Taip susidaro hidratacinis apvalkalas.', 'The $O–H$ of methanol is a donor and its oxygen an acceptor; water molecules can serve as both. A hydration shell forms.')
            },
            {
              prompt: t('Kuri savybė, be vandenilinių ryšių, aiškina metanolio ir vandens maišymąsi?', 'Which property, besides hydrogen bonds, helps methanol and water mix?'),
              kind: 'choice',
              options: [
                tx('Abu yra poliniai (didelės dielektrinės konstantos: 32,7 ir 78,4).', 'Both are polar (large dielectric constants: 32.7 and 78.4).'),
                tx('Abu turi tą patį atomų skaičių.', 'Both have the same number of atoms.'),
                tx('Abu yra sp² hibridizacijos.', 'Both are sp² hybridised.'),
                tx('Abu yra rūgštys.', 'Both are acids.')
              ],
              answer: 0,
              hint: t('Panašus tirpina panašų: palyginkite poliškumą.', 'Like dissolves like: compare the polarity.'),
              solution: t('Poliniai tirpikliai yra tarpusavyje suderinami: panašūs dielektrinės konstantos ir panašūs vandenilinių ryšių tinklai.', 'Polar solvents are compatible with each other: similar dielectric constants and similar networks of hydrogen bonds.')
            }
          ],
          why: t('Tirpumas vandenyje priklauso nuo gebėjimo sudaryti vandenilinius ryšius su vandeniu (hidratacija). Alkoholių $O–H$ ir $O$ tai leidžia, todėl mažos alkoholių molekulės tirpsta.', 'Solubility in water depends on the ability to form hydrogen bonds with water (hydration). The $O–H$ and $O$ of alcohols allow it, so small alcohol molecules dissolve.'),
          src: 'T p26, L2 p40', claims: [{ name: ['CO', { lt: 'metanolis', en: 'methanol' }] }]
        },
        {
          id: 'u02.hbondwhy.7',
          q: [{ p: t('Etanolio virimo temperatūra 78,4 °C. Vandenilinio ryšio energija 10–40 kJ/mol, o kovalentinio $C–C$ – 347 kJ/mol.', 'Ethanol boils at 78.4 °C. The energy of a hydrogen bond is 10–40 kJ/mol, that of a covalent $C–C$ bond 347 kJ/mol.') }],
          steps: [
            {
              prompt: t('Kas nutrūksta, kai etanolis verda?', 'What breaks when ethanol boils?'),
              kind: 'choice',
              options: [
                tx('Tarpmolekuliniai vandeniliniai ryšiai, ir kovalentiniai ryšiai lieka.', 'The intermolecular hydrogen bonds; the covalent bonds stay.'),
                tx('Visi $C–C$ ryšiai.', 'All the $C–C$ bonds.'),
                tx('Kovalentiniai $O–H$ ryšiai.', 'The covalent $O–H$ bonds.'),
                tx('Kovalentiniai ryšiai ir vandeniliniai ryšiai vienodai.', 'Covalent and hydrogen bonds equally.')
              ],
              answer: 0,
              hint: t('Virimas yra fizikinis virsmas: molekulės išlieka tos pačios.', 'Boiling is a physical change: the molecules stay the same.'),
              solution: t('Garuojant molekulės atsiskiria viena nuo kitos, o pačios lieka. Nutrūksta silpnos sąveikos, tai yra vandeniliniai ryšiai.', 'On evaporating the molecules separate from each other but stay intact. The weak interactions break, that is, the hydrogen bonds.')
            },
            {
              prompt: t('Kiek maždaug kartų vandenilinis ryšys (apie 30 kJ/mol) silpnesnis už $C–C$ ryšį?', 'About how many times weaker is a hydrogen bond (about 30 kJ/mol) than a $C–C$ bond?'),
              kind: 'number', answer: { value: 11.5, tol: 2.5 },
              hint: t('Padalykite kovalentinio ryšio energiją iš vandenilinio.', 'Divide the energy of the covalent bond by that of the hydrogen bond.'),
              solution: t('347 / 30 ≈ 12, taigi apie dešimt kartų silpnesnis.', '347 / 30 ≈ 12, so about ten times weaker.')
            }
          ],
          why: t('Vandeniliniai ryšiai yra silpni, bet jų daug; todėl jie nulemia virimo temperatūrą, tačiau kovalentiniai ryšiai pačioje molekulėje išlieka.', 'Hydrogen bonds are weak but numerous; they decide the boiling point, but the covalent bonds within the molecule survive.'),
          src: 'L2 p44, p47'
        },
        {
          id: 'u02.hbondwhy.8',
          q: [{ p: t('Baltymų spirales ir DNR grandines vienija vandeniliniai ryšiai.', 'Hydrogen bonds hold protein helices and DNA strands together.') }, { mol: { smi: 'CC(=O)NC', name: t('N-metiletanamidas', 'N-methylethanamide'), opts: { lonePairs: true, numbers: 'all' } } }],
          steps: [{
            prompt: t('Bakstelėkite atomus amido grupėje, kurie gali būti vandenilinio ryšio donoras ir akceptorius (po vieną).', 'Tap the atoms of the amide group that can serve as the donor of a hydrogen bond and as the acceptor (one each).'),
            kind: 'atoms', mol: { smi: 'CC(=O)NC', opts: { numbers: 'all' } }, answer: [2, 3],
            hint: t('Donorius – atomas su prisijungusiu vandeniliu, akceptorius – atomas su laisvąja pora, kuris neturi donoro.', 'The donor is the atom carrying a hydrogen, the acceptor an atom with a lone pair.'),
            solution: t('$N–H$ (azotas Nr. 4) yra donoras, karbonilo deguonis Nr. 3 – akceptorius. Todėl peptidinėje jungtyje susidaro $N–H···O=C$ ryšiai.', 'The $N–H$ (nitrogen no. 4) is the donor and the carbonyl oxygen no. 3 the acceptor. So in a peptide chain $N–H···O=C$ bonds form.')
          }],
          why: t('Dažniausia biologinė pora yra $N–H···O=C$: tokių ryšių daug, todėl jie stabilizuoja baltymų ir nukleorūgščių struktūras, nors kiekvienas silpnas.', 'The commonest biological pair is $N–H···O=C$: there are many such bonds, so they stabilise the structures of proteins and nucleic acids even though each is weak.'),
          src: 'L2 p44, p50', claims: [{ name: ['CC(=O)NC', { lt: 'N-metiletanamidas', en: 'N-methylethanamide' }] }]
        },
        {
          id: 'u02.hbondwhy.9',
          q: [{ p: t('Keturi junginiai gali sąveikauti su vandeniu.', 'Four compounds can interact with water.') }, { mol: [{ smi: 'CCOCC', caption: t('dietilo eteris', 'diethyl ether') }, { smi: 'CC(C)=O', caption: t('acetonas', 'acetone') }, { smi: 'CCO', name: t('etanolis', 'ethanol') }, { smi: 'CCCCC', name: t('pentanas', 'pentane') }] }],
          steps: [{
            prompt: t('Kurie junginiai gali būti vandenilinio ryšio akceptoriai, bet ne donorai?', 'Which compounds can be hydrogen-bond acceptors but not donors?'),
            kind: 'multi', options: [mo('CCOCC'), mo('CC(C)=O'), mo('CCO'), mo('CCCCC')], answer: [0, 1],
            hint: t('Akceptoriui reikia laisvosios poros ($N$, $O$), o donorui – dar ir $O–H$ ar $N–H$.', 'An acceptor needs a lone pair ($N$, $O$), and a donor also needs an $O–H$ or $N–H$.'),
            solution: t('Eteris ir ketonas turi deguonies poras, bet neturi $O–H$: tik akceptoriai. Etanolis – ir donoras, ir akceptorius; pentanas – nei vienas.', 'The ether and the ketone have oxygen lone pairs but no $O–H$: acceptors only. Ethanol is both donor and acceptor; pentane is neither.')
          }],
          why: t('Todėl eteriai ir ketonai tarpusavyje nesiasocijuoja ir verda žemiau nei alkoholiai, bet vandenyje iš dalies tirpsta, nes priima vandens vandenilius.', 'So ethers and ketones do not associate with themselves and boil lower than alcohols, but dissolve in water to some extent because they accept the hydrogens of water.'),
          src: 'L2 p44, T p26'
        }
      ]
    },

    /* ============================================================ u02.bonds */
    {
      id: 'u02.bonds',
      title: t('Ryšio ilgis, energija, poliškumas ir koordinacinis ryšys', 'Bond length, energy, polarity and the coordinate bond'),
      mirrors: [],
      bank: [
        {
          id: 'u02.bonds.1',
          q: [{ p: t('Palyginkite tris anglies–anglies ryšius.', 'Compare three carbon–carbon bonds.') }, { mol: [{ smi: 'CC', caption: f('C–C') }, { smi: 'C=C', caption: f('C=C') }, { smi: 'C#C', caption: f('C≡C') }] }],
          steps: [
            {
              prompt: t('Išdėstykite ryšius nuo trumpiausio iki ilgiausio.', 'Put the bonds in order from the shortest to the longest.'),
              kind: 'order', options: [tx('$C≡C$ (0,120 nm)', '$C≡C$ (0.120 nm)'), tx('$C=C$ (0,133 nm)', '$C=C$ (0.133 nm)'), tx('$C–C$ (0,154 nm)', '$C–C$ (0.154 nm)')],
              hint: t('Kuo daugiau ryšių tarp tų pačių atomų, tuo stipriau jie traukia branduolius.', 'The more bonds between the same atoms, the more tightly they pull the nuclei together.'),
              solution: t('Trigubasis ryšys trumpiausias, viengubasis ilgiausias.', 'The triple bond is the shortest, the single bond the longest.')
            },
            {
              prompt: t('Išdėstykite tuos pačius ryšius nuo stipriausio iki silpniausio.', 'Put the same bonds in order from the strongest to the weakest.'),
              kind: 'order', options: [tx('$C≡C$ (828 kJ/mol)', '$C≡C$ (828 kJ/mol)'), tx('$C=C$ (606 kJ/mol)', '$C=C$ (606 kJ/mol)'), tx('$C–C$ (347 kJ/mol)', '$C–C$ (347 kJ/mol)')],
              hint: t('Stipresnis ryšys yra trumpesnis.', 'A stronger bond is a shorter one.'),
              solution: t('Energija didėja eilėje $C–C$ < $C=C$ < $C≡C$.', 'The energy grows in the order $C–C$ < $C=C$ < $C≡C$.')
            }
          ],
          why: t('Kuo daugiau elektronų porų tarp atomų, tuo ryšys stipresnis ir trumpesnis. Bet kiekvienas papildomas π ryšys prideda mažiau nei σ ryšys (606 − 347 = 259, 828 − 606 = 222 kJ/mol).', 'The more electron pairs between the atoms, the stronger and shorter the bond. But each extra π bond adds less than a σ bond (606 − 347 = 259, 828 − 606 = 222 kJ/mol).'),
          src: 'L2 p31'
        },
        {
          id: 'u02.bonds.2',
          q: [{ p: t('Dvigubasis ryšys $C=C$ (606 kJ/mol) yra silpnesnis už du viengubuosius $C–C$ ryšius (2 × 347 = 694 kJ/mol).', 'A double bond $C=C$ (606 kJ/mol) is weaker than two single $C–C$ bonds (2 × 347 = 694 kJ/mol).') }],
          steps: [{
            prompt: t('Kodėl?', 'Why?'),
            kind: 'choice',
            options: [
              tx('π ryšys susidaro šoniniu p orbitalių persiklojimu, kuris yra silpnesnis už ašinį σ ryšio persidengimą.', 'The π bond forms by lateral overlap of p orbitals, which is weaker than the axial overlap of a σ bond.'),
              tx('π ryšys yra ilgesnis už σ, todėl stipresnis.', 'The π bond is longer than the σ bond, hence stronger.'),
              tx('Dvigubajame ryšyje yra tik vienas ryšys.', 'A double bond contains only one bond.'),
              tx('Dvigubasis ryšys susidaro iš dviejų σ ryšių.', 'A double bond is made of two σ bonds.')
            ],
            answer: 0,
            hint: t('Dvigubasis ryšys yra σ ir dar kažkas: kaip jis susidaro?', 'A double bond is a σ bond and something more: how does it form?'),
            solution: t('Dvigubasis ryšys = σ + π. Antroji dalis (π) mažiau efektyviai persidengia, todėl sudaro tik ~259 kJ/mol, ne 347.', 'A double bond = σ + π. The second part (π) overlaps less effectively, so it contributes only about 259 kJ/mol, not 347.')
          }],
          why: t('Todėl alkenų reakcijose nutrūksta būtent π ryšys, o σ skeletas lieka: tam reikia mažiau energijos.', 'That is why in reactions of alkenes it is the π bond that breaks while the σ skeleton remains: it takes less energy.'),
          src: 'L2 p27, p31'
        },
        {
          id: 'u02.bonds.3',
          q: [{ p: t('Anglies atomas gali sudaryti $C–H$ ryšį būdamas skirtingos hibridizacijos.', 'A carbon atom can form a $C–H$ bond in different hybridisations.') }, { mol: [{ smi: 'CC', caption: t('$C–H$ iš sp³', '$C–H$ from sp³') }, { smi: 'C=C', caption: t('$C–H$ iš sp²', '$C–H$ from sp²') }, { smi: 'C#C', caption: t('$C–H$ iš sp', '$C–H$ from sp') }] }],
          steps: [
            {
              prompt: t('Išdėstykite $C–H$ ryšius nuo trumpiausio iki ilgiausio.', 'Put the $C–H$ bonds in order from the shortest to the longest.'),
              kind: 'order', options: [tx('sp (0,106 nm)', 'sp (0.106 nm)'), tx('sp² (0,107 nm)', 'sp² (0.107 nm)'), tx('sp³ (0,110 nm)', 'sp³ (0.110 nm)')],
              hint: t('Palyginkite, kokią dalį hibridinėje orbitalėje sudaro s orbitalė.', 'Compare what share of the hybrid orbital is the s orbital.'),
              solution: t('sp orbitalėje s dalis 50 %, sp² – 33 %, sp³ – 25 %: kuo didesnė s dalis, tuo trumpesnis ryšys.', 'In an sp orbital the s share is 50 %, in sp² 33 %, in sp³ 25 %: the larger the s share, the shorter the bond.')
            },
            {
              prompt: t('Kuo ši tvarka paaiškinama?', 'What explains this order?'),
              kind: 'choice',
              options: [
                tx('s orbitalė yra arčiau branduolio, todėl daugiau s pobūdžio – trumpesnis ryšys.', 'An s orbital lies closer to the nucleus, so more s character means a shorter bond.'),
                tx('Daugiau p pobūdžio reiškia stipresnį trauką.', 'More p character means a stronger pull.'),
                tx('Skiriasi vandenilio atomo dydis.', 'The size of the hydrogen atom differs.'),
                tx('Ryšys yra π, todėl ilgesnis.', 'The bond is π, so it is longer.')
              ],
              answer: 0,
              hint: t('Kuri orbitalė labiau sutelkta aplink branduolį: s ar p?', 'Which orbital is more concentrated around the nucleus: s or p?'),
              solution: t('s orbitalė yra sferinė ir arčiau branduolio nei p; kuo ji svarbesnė hibridinėje orbitalėje, tuo elektronai arčiau branduolio.', 'An s orbital is spherical and closer to the nucleus than p; the more it contributes to the hybrid orbital, the closer the electrons are to the nucleus.')
            }
          ],
          why: t('Ryšio ilgį lemia hibridizacija: kuo daugiau s pobūdžio, tuo ryšys trumpesnis (todėl trigubasis ryšys trumpesnis už dvigubąjį, o šis – už viengubąjį).', 'The length of a bond depends on hybridisation: the more s character, the shorter the bond (so a triple bond is shorter than a double one, and that shorter than a single one).'),
          src: 'L2 p32'
        },
        {
          id: 'u02.bonds.4',
          q: [{ p: t('Palyginkite anglies ryšius su halogenais.', 'Compare the bonds of carbon to the halogens.') }],
          steps: [
            {
              prompt: t('Išdėstykite ryšius nuo trumpiausio iki ilgiausio.', 'Put the bonds in order from the shortest to the longest.'),
              kind: 'order', options: [tx('$C–F$ (0,140 nm)', '$C–F$ (0.140 nm)'), tx('$C–Cl$ (0,176 nm)', '$C–Cl$ (0.176 nm)'), tx('$C–Br$ (0,194 nm)', '$C–Br$ (0.194 nm)'), tx('$C–I$ (0,213 nm)', '$C–I$ (0.213 nm)')],
              hint: t('Pagalvokite apie halogeno atomo dydį grupėje iš viršaus į apačią.', 'Think of the size of the halogen atom going down the group.'),
              solution: t('Fluoras mažiausias, jodas didžiausias, todėl $C–F$ trumpiausias, $C–I$ ilgiausias.', 'Fluorine is the smallest and iodine the largest, so $C–F$ is the shortest and $C–I$ the longest.')
            },
            {
              prompt: t('Kuris ryšys lengviausiai poliarizuojamas?', 'Which bond is polarised most easily?'),
              kind: 'choice', options: [ft('$C–F$'), ft('$C–Cl$'), ft('$C–Br$'), ft('$C–I$')], answer: 3,
              hint: t('Poliarizuojamumas didėja, kai ryšio elektronai yra toliau nuo branduolio.', 'Polarisability grows when the bonding electrons are farther from the nuclei.'),
              solution: t('Joduotas ryšys ilgiausias: jo elektronai toliausiai nuo branduolių ir judriausi, todėl lengviausiai poliarizuojasi.', 'The iodine bond is the longest: its electrons are farthest from the nuclei and the most mobile, so it is polarised most easily.')
            }
          ],
          why: t('Didėjant halogeno atomui ryšys ilgėja ir silpnėja, bet vis lengviau poliarizuojamas, nors poliškumas (ΔEN) mažėja.', 'As the halogen atom grows, the bond lengthens and weakens and is more easily polarised, even though the polarity (ΔEN) decreases.'),
          src: 'L2 p32, p41'
        },
        {
          id: 'u02.bonds.5',
          q: [{ p: t('Eteno molekulėje yra σ ir π ryšiai tarp anglies atomų.', 'In ethene there are σ and π bonds between the carbon atoms.') }, { mol: { smi: 'C=C', opts: { condensed: false } } }],
          steps: [{
            prompt: t('Kuris eteno ryšys pirmiausia reaguoja su artėjančiu reagentu ir kodėl?', 'Which bond of ethene reacts first with an approaching reagent, and why?'),
            kind: 'choice',
            options: [
              tx('π ryšys: jo elektronai toliau nuo branduolių, todėl judresni ir lengviau poliarizuojami.', 'The π bond: its electrons are farther from the nuclei, so more mobile and more easily polarised.'),
              tx('σ ryšys, nes jis stipriausias.', 'The σ bond, because it is the strongest.'),
              tx('$C–H$ ryšys, nes jis poliariškiausias.', 'The $C–H$ bond, because it is the most polar.'),
              tx('Visi ryšiai vienodai.', 'All bonds equally.')
            ],
            answer: 0,
            hint: t('Kurio ryšio elektronai yra toliau nuo sujungtų branduolių?', 'Whose bonding electrons are farther from the bonded nuclei?'),
            solution: t('π elektronų debesis yra virš ir po molekulės plokštuma, toliau nuo branduolių nei σ ryšio. Todėl π ryšys lengviau poliarizuojamas ir reaguoja pirmas.', 'The electron density maximum of the π bond is above and below the molecular plane, farther from the nuclei than that of the σ bond. So the π bond is polarised more easily and reacts first.')
          }],
          why: t('π ryšys silpnesnis ir poliarizuojamesnis už σ, todėl alkenų ir alkinų reakcijos prasideda ties π ryšiu.', 'A π bond is weaker and more polarisable than a σ bond, so the reactions of alkenes and alkynes start at the π bond.'),
          src: 'L2 p27, p41'
        },
        {
          id: 'u02.bonds.6',
          q: [{ p: t('Visi šie junginiai turi polinių ryšių.', 'All these compounds contain polar bonds.') }, { mol: [{ smi: 'O=C=O', caption: f('CO₂') }, { smi: 'O', caption: f('H₂O') }, { smi: 'ClC(Cl)(Cl)Cl', caption: f('CCl₄') }, { smi: 'CCl', caption: f('CH₃Cl') }, { smi: 'FB(F)F', caption: f('BF₃') }] }],
          steps: [
            {
              prompt: t('Kurių molekulių dipolio momentas lygus nuliui?', 'Which molecules have a dipole moment of zero?'),
              kind: 'multi', options: [mo('O=C=O'), mo('O'), mo('ClC(Cl)(Cl)Cl'), mo('CCl'), mo('FB(F)F')], answer: [0, 2, 4],
              hint: t('Atskirų ryšių dipolius pridėkite kaip vektorius: simetrinėje molekulėje jie panaikina vienas kitą.', 'Add the bond dipoles as vectors: in a symmetric molecule they cancel.'),
              solution: t('$CO2$ (tiesinė), $CCl4$ (tetraedras) ir $BF3$ (lygiakraštis trikampis) simetriški, μ = 0. Vanduo (1,85 D) ir chlormetanas (1,87 D) turi dipolį.', '$CO2$ (linear), $CCl4$ (tetrahedron) and $BF3$ (equilateral triangle) are symmetric, μ = 0. Water (1.85 D) and chloromethane (1.87 D) have a dipole.')
            },
            {
              prompt: t('Kodėl $CCl4$ nepolinis, nors $C–Cl$ ryšys polinis?', 'Why is $CCl4$ nonpolar although the $C–Cl$ bond is polar?'),
              kind: 'choice',
              options: [
                tx('Keturi vienodi $C–Cl$ dipoliai, nukreipti į tetraedro viršūnes, vienas kitą panaikina.', 'The four identical $C–Cl$ dipoles, pointing to the corners of a tetrahedron, cancel.'),
                tx('$C–Cl$ ryšys joninis.', 'The $C–Cl$ bond is ionic.'),
                tx('Chloras ir anglis turi vienodą elektrinį neigiamumą.', 'Chlorine and carbon have the same electronegativity.'),
                tx('Molekulė turi tik π ryšių.', 'The molecule has only π bonds.')
              ],
              answer: 0,
              hint: t('Pagalvokite apie molekulės formą.', 'Think about the shape of the molecule.'),
              solution: t('Ryšiai poliniai, bet molekulė simetriška, todėl dipolių vektorių suma lygi nuliui. Nepoliniai ryšiai čia nereikalingi.', 'The bonds are polar, but the molecule is symmetric, so the sum of the dipole vectors is zero. Nonpolar bonds are not needed.')
            }
          ],
          why: t('Molekulės poliškumą lemia ne vien poliniai ryšiai, bet ir jų išsidėstymas: simetrijoje dipoliai vienas kitą panaikina.', 'The polarity of a molecule depends not only on the polar bonds but on their arrangement: in a symmetric molecule the dipoles cancel.'),
          src: 'L2 p38, p39'
        },
        {
          id: 'u02.bonds.7',
          q: [{ p: t('Dichlormetanas ir tetrachlormetanas abu turi $C–Cl$ ryšius.', 'Dichloromethane and tetrachloromethane both have $C–Cl$ bonds.') }, { mol: [{ smi: 'ClCCl', name: t('dichlormetanas', 'dichloromethane') }, { smi: 'ClC(Cl)(Cl)Cl', name: t('tetrachlormetanas', 'tetrachloromethane') }] }],
          steps: [{
            prompt: t('Kuris iš jų yra polinė molekulė?', 'Which of them is a polar molecule?'),
            kind: 'choice', options: [tx('dichlormetanas', 'dichloromethane'), tx('tetrachlormetanas', 'tetrachloromethane'), tx('abu nepoliniai', 'both nonpolar'), tx('abu vienodai poliniai', 'both equally polar')], answer: 0,
            hint: t('Palyginkite, ar dipolių vektoriai simetriškai išsidėstę aplink anglį.', 'Compare whether the dipole vectors are arranged symmetrically around the carbon.'),
            solution: t('Dichlormetane $C–Cl$ dipoliai vienas kito nepanaikina, nes dvi padėtys užimtos beveik nepoliniais $C–H$ ryšiais: molekulė turi dipolį. $CCl4$ simetriškas, μ = 0.', 'In dichloromethane the $C–Cl$ dipoles do not cancel, because two positions carry nonpolar $C–H$: the molecule has a dipole. $CCl4$ is symmetric, μ = 0.')
          }],
          why: t('Pakeitus bent vieną chlorą kitu atomu, simetrija sutrinka ir dipolių suma nebelygi nuliui.', 'Replacing even one chlorine by another atom breaks the symmetry, and the sum of the dipoles is no longer zero.'),
          src: 'L2 p38, p39, Klein', claims: [{ name: ['ClCCl', { lt: 'dichlormetanas', en: 'dichloromethane' }] }, { name: ['ClC(Cl)(Cl)Cl', { lt: 'tetrachlormetanas', en: 'tetrachloromethane' }] }]
        },
        {
          id: 'u02.bonds.8',
          q: [{ p: t('Amoniakas reaguoja su protonu.', 'Ammonia reacts with a proton.') }, { scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: '[NH4+]' }] } }],
          steps: [
            {
              prompt: t('Kuris dalyvis yra donoras, o kuris – akceptorius?', 'Which partner is the donor and which the acceptor?'),
              kind: 'choice',
              options: [
                tx('Amoniakas – donoras (laisvoji pora), $H+$ – akceptorius (tuščia orbitalė).', 'Ammonia is the donor (lone pair), $H+$ the acceptor (vacant orbital).'),
                tx('$H+$ – donoras, amoniakas – akceptorius.', '$H+$ is the donor, ammonia the acceptor.'),
                tx('Abu duoda po elektroną.', 'Each gives one electron.'),
                tx('Abu duoda po elektronų porą.', 'Each gives an electron pair.')
              ],
              answer: 0,
              hint: t('Kuris dalyvis turi laisvąją elektronų porą, o kuris – tuščią orbitalę?', 'Which partner has a lone pair, and which a vacant orbital?'),
              solution: [{ p: t('Azotas atiduoda savo laisvąją porą, protonas ($1s$ orbitalė tuščia) ją priima:', 'Nitrogen gives its lone pair and the proton (its $1s$ orbital is empty) accepts it:') },
                { mech: [{ scheme: { items: [{ smi: 'N', opts: { lonePairs: true } }, { plus: true }, { smi: '[H+]' }, { arrow: '→' }, { smi: '[NH4+]' }] }, arrows: [{ from: { m: 0, lp: 0 }, to: { m: 1, a: 0 } }] }] }]
            },
            {
              prompt: t('Kiek $N–H$ ryšių amonio jone gali būti atskirti vienas nuo kito?', 'How many of the $N–H$ bonds of the ammonium ion can be told apart?'),
              kind: 'number', answer: { value: 0, tol: 0 },
              hint: t('Pagalvokite, ar po susidarymo koordinacinis ryšys skiriasi nuo kitų kovalentinių.', 'Think whether the coordinate bond differs from the other covalent bonds once it has formed.'),
              solution: t('Nė vieno: visi keturi $N–H$ ryšiai tapatūs, skiriasi tik vieno susidarymo būdas.', 'None: all four $N–H$ bonds are identical; only the way one of them formed differs.')
            }
          ],
          why: t('Donorinis-akceptorinis ryšys – tai kovalentinis ryšys, kurio elektronų porą atiduoda vienas atomas, o kitas turi tuščią orbitalę. Susidaręs jis niekuo nesiskiria nuo kitų.', 'A donor–acceptor bond is a covalent bond whose electron pair is given by one atom while the other has a vacant orbital. Once formed it is no different from the others.'),
          src: 'L2 p42'
        },
        {
          id: 'u02.bonds.9',
          q: [{ p: t('Keturi tirpikliai išdėstyti atsitiktine tvarka.', 'Four solvents are listed in random order.') }],
          steps: [{
            prompt: t('Išdėstykite juos pagal poliškumą (dielektrinę konstantą) nuo mažiausio iki didžiausio.', 'Put them in order of polarity (dielectric constant) from the lowest to the highest.'),
            kind: 'order', options: [tx('benzenas (ε = 2,3)', 'benzene (ε = 2.3)'), tx('dietilo eteris (ε = 4,3)', 'diethyl ether (ε = 4.3)'), tx('etanolis (ε = 24,3)', 'ethanol (ε = 24.3)'), tx('vanduo (ε = 78,4)', 'water (ε = 78.4)')],
            hint: t('Poliškesnis junginys turi didesnę dielektrinę konstantą.', 'The more polar the compound, the larger its dielectric constant.'),
            solution: t('Benzenas beveik nepolinis, eteris silpnai polinis, etanolis ir vanduo asocijuojasi vandeniliniais ryšiais, o vanduo – labiausiai.', 'Benzene is almost nonpolar, ether weakly polar, ethanol and water associate through hydrogen bonds, and water most of all.')
          }],
          why: t('Dipolių momentai nepatikimi lyginant junginius, todėl praktikoje poliškumą vertina dielektrinė konstanta ε.', 'Dipole moments are unreliable for comparing compounds, so in practice polarity is judged by the dielectric constant ε.'),
          src: 'L2 p40'
        }
      ]
    }
  ];

  ORG.unit({
    id: 'u02',
    notes: NOTES,
    summary: SUMMARY,
    types: TYPES,
    coverage: {
      'S2.1': ['u02.valence'],
      'S2.2': ['u02.hyb', 'u02.sigmapi'],
      'S2.3': ['u02.fromhyb'],
      'S2.4': ['u02.bondtype', 'u02.ionic'],
      'S2.5': ['u02.polar', 'u02.bondtype'],
      'S2.6': ['u02.morepolar'],
      'S2.9': ['u02.hbond']
    }
  });
})(globalThis.ORG = globalThis.ORG || {});
