// =====================================================================
//  INNEHÅLL – här ändrar du texter utan att röra resten av koden.
// =====================================================================
//
//  Så här gör du:
//   * Ändra text mellan citattecknen "...". Behåll citattecknen.
//   * Behåll kommatecknen i slutet av raderna.
//   * Rör inte "id". Det kopplar platsen till kartan.
//   * avdelning: true  = räknas som avdelning i minispelet
//     avdelning: false = övrig plats, syns i listan men räknas inte
//   * plan: 1 = platsen ligger på plan 1. Utan plan ligger den på plan 0.
//     Platsen måste också finnas i den våningens kartfil.
//   * Ordningen här är ordningen i listan på sidan.
//   * farg är zonens färg på golvet och kanten på skylten, skriven som
//     en färgkod. Håll dig till lugna nyanser: beige, brunt och mörkrött.
//     Starka färger gör kartan plottrig.
//
//  Spara filen och ladda om sidan för att se ändringen.
// =====================================================================

export const SIDA = {
  titel: "Västerviks stadsbibliotek",
  framme: "Du är framme vid {namn}",
  visarVag: "Följ prickarna till {namn}",
  stangHjalp: "Tryck Esc för att sluta visa vägen",
  oppettiderRubrik: "Öppettider",
  kontaktRubrik: "Kontakt",
  infoNamn: "Info: {namn}",
  stangKort: "Stäng",
  lasUpp: "Läs upp",
  slutaLasa: "Sluta läsa",

  // Våningar
  nuPaPlan: "Du är på plan {plan}",
  vaningUpp: "Upp till plan {plan}",
  vaningNer: "Ner till plan {plan}",
  visarVagAnnanVaning: "{namn} finns på plan {plan}",
  visarVagAnnanUnder: "Följ prickarna till trappan."
};

// Kartfilerna i src/data, en per våning. Den första är entréplanet, där
// figuren börjar. Varje kartfil har sitt våningsnummer i "meta": { "plan": … }.
export const KARTOR = ["layout.json", "layout_plan1.json"];

export const PLATSER = [
  // ---------------------------------------------------- avdelningar
  {
    id: "receptionsdisk",
    namn: "Receptionsdisken",
    beskrivning: "Här kan du fråga personalen om allt.",
    avdelning: true,
    farg: "#a8845c"
  },
  {
    id: "lana_aterlamna",
    namn: "Låna och återlämna",
    beskrivning: "Automater där du lånar och lämnar tillbaka själv.",
    avdelning: true,
    farg: "#8c6b4f"
  },
  {
    id: "utstallningsyta",
    namn: "Utställningsytan",
    beskrivning: "Här visas utställningar som byts ut under året.",
    avdelning: true,
    farg: "#9a5a4a"
  },
  {
    id: "ungdomshorna",
    namn: "Ungdomshörnan",
    beskrivning: "Soffor, böcker och spel för dig som är ung.",
    avdelning: true,
    farg: "#7a3b33"
  },
  {
    id: "labbet",
    namn: "Labbet",
    beskrivning: "Prova på teknik, skapa och bygg.",
    avdelning: true,
    farg: "#6b4a3a"
  },
  {
    id: "barnavdelning",
    namn: "Barnavdelningen",
    beskrivning: "Bilderböcker och barnböcker, och en egen lånedisk.",
    avdelning: true,
    farg: "#b8925f"
  },

  // ------------------------------------------------- övriga platser
  {
    id: "entre",
    namn: "Entré",
    beskrivning: "Här kommer du in.",
    avdelning: false,
    farg: "#c8b496"
  },
  {
    id: "scen",
    namn: "Scenen",
    beskrivning: "Här hålls föreställningar och evenemang.",
    avdelning: false,
    farg: "#a46a5a"
  },
  {
    id: "talbocker",
    namn: "Talböcker",
    beskrivning: "Böcker att lyssna på.",
    avdelning: false,
    farg: "#b59a78"
  },
  {
    id: "storstil",
    namn: "Storstil",
    beskrivning: "Böcker med stor text.",
    avdelning: false,
    farg: "#c2ab8a"
  },
  {
    id: "soffgrupp",
    namn: "Soffgruppen",
    beskrivning: "Fåtöljer runt ett soffbord, en lugn plats att sitta och läsa.",
    avdelning: false,
    farg: "#a8846a"
  },
  {
    id: "godis",
    namn: "Godisautomat",
    beskrivning: "Här kan du köpa godis.",
    avdelning: false,
    farg: "#9a5a4a"
  },
  {
    id: "reservationer",
    namn: "Reservationer",
    beskrivning: "Här hämtar du det du har reserverat.",
    avdelning: false,
    farg: "#8c6b4f"
  },
  {
    id: "kopiator",
    namn: "Utskrifter och kopior",
    beskrivning: "Kopiatorn där du skriver ut och kopierar.",
    avdelning: false,
    farg: "#7d6a5a"
  },
  {
    id: "kaffe",
    namn: "Kaffe och vatten",
    beskrivning: "Automat med kaffe och vatten, vid toaletterna.",
    avdelning: false,
    farg: "#8c5a3c"
  },
  {
    id: "toaletter",
    namn: "Toaletter",
    beskrivning: "Två toaletter mot salen, och två till från barnavdelningen.",
    avdelning: false,
    farg: "#b8ab8c"
  },
  {
    id: "smabarn",
    namn: "Småbarnsrummet",
    beskrivning: "Ett lugnt rum för de minsta, med bilderbokstråg.",
    avdelning: false,
    farg: "#c8a878"
  },
  {
    id: "pentry",
    namn: "Pentry",
    beskrivning: "Ett litet kök med bord, innanför småbarnsrummet.",
    avdelning: false,
    farg: "#b59a78"
  },
  {
    id: "hoglasningsrum",
    namn: "Högläsningsrummet",
    beskrivning: "Ett rum för sagostunder, med en sittrappa att sitta i.",
    avdelning: false,
    farg: "#a46a5a"
  },
  {
    id: "barnvagnar",
    namn: "Barnvagnsparkering",
    beskrivning: "Här ställer du barnvagnen, strax innanför entrén.",
    avdelning: false,
    farg: "#c8b496"
  },
  {
    id: "torget",
    namn: "Torget",
    beskrivning: "Utanför entrén. Här börjar du.",
    avdelning: false,
    farg: "#c8b496"
  },
  {
    id: "trappa_hiss",
    namn: "Trappa och hiss",
    beskrivning: "Upp till plan 1.",
    avdelning: false,
    farg: "#bfb2a0"
  },

  // ------------------------------------------- plan 1, avdelningar
  {
    id: "romaner",
    plan: 1,
    namn: "Romaner",
    beskrivning: "Skönlitteratur för vuxna.",
    avdelning: true,
    farg: "#7a3b33"
  },
  {
    id: "spanning",
    plan: 1,
    namn: "Spänning",
    beskrivning: "Deckare och thrillers.",
    avdelning: true,
    farg: "#8c4a3c"
  },
  {
    id: "klassiker",
    plan: 1,
    namn: "Klassiker",
    beskrivning: "Böcker som har hållit i många år.",
    avdelning: true,
    farg: "#a8845c"
  },
  {
    id: "ljudbocker",
    plan: 1,
    namn: "Ljudböcker",
    beskrivning: "Böcker att lyssna på.",
    avdelning: true,
    farg: "#6b4a3a"
  },
  {
    id: "biografier",
    plan: 1,
    namn: "Biografier",
    beskrivning: "Berättelser om verkliga människors liv.",
    avdelning: true,
    farg: "#8c6b4f"
  },
  {
    id: "serier",
    plan: 1,
    namn: "Serier",
    beskrivning: "Serieböcker och grafiska romaner.",
    avdelning: true,
    farg: "#9a5a4a"
  },
  {
    id: "tidningshorna",
    plan: 1,
    namn: "Tidningshörnan",
    beskrivning: "Dagstidningar och tidskrifter i sköna fåtöljer.",
    avdelning: true,
    farg: "#b8925f"
  },
  {
    id: "studieyta",
    plan: 1,
    namn: "Studieytan",
    beskrivning: "Långbord där du kan sitta och plugga.",
    avdelning: true,
    farg: "#8c6b4f"
  },
  {
    id: "datorer",
    plan: 1,
    namn: "Publika datorer",
    beskrivning: "Datorer och skrivare som alla får använda.",
    avdelning: true,
    farg: "#5b4130"
  },
  {
    id: "slaktforskning",
    plan: 1,
    namn: "Släktforskning",
    beskrivning: "Tjustrummet, med material för den som släktforskar.",
    avdelning: true,
    farg: "#a46a5a"
  },

  // --------------------------------------- plan 1, övriga platser
  {
    id: "information",
    plan: 1,
    namn: "Information",
    beskrivning: "Disken där du kan fråga om hjälp på plan 1.",
    avdelning: false,
    farg: "#a8845c"
  },
  {
    id: "facklitteratur",
    plan: 1,
    namn: "Facklitteratur",
    beskrivning: "Böcker om allt mellan himmel och jord.",
    avdelning: false,
    farg: "#b59a78"
  },
  {
    id: "trappa_hiss_plan1",
    plan: 1,
    namn: "Trappa och hiss",
    beskrivning: "Ner till plan 0.",
    avdelning: false,
    farg: "#bfb2a0"
  },
  {
    id: "toaletter_plan1",
    plan: 1,
    namn: "Toaletter",
    beskrivning: "Två toaletter, mellan studieytan och tidningshörnan.",
    avdelning: false,
    farg: "#b8ab8c"
  }
];

// =====================================================================
//  ÖPPETTIDER OCH KONTAKT
// =====================================================================
//
//  Hämtat från bibliotek.vastervik.se den 12 oktober 2026.
//  Skriv "Stängt" för dagar då biblioteket är stängt.
//  Ordningen är måndag först, söndag sist.

export const OPPETTIDER = [
  { dag: "Måndag",  tid: "10–19" },
  { dag: "Tisdag",  tid: "10–19" },
  { dag: "Onsdag",  tid: "10–19" },
  { dag: "Torsdag", tid: "10–19" },
  { dag: "Fredag",  tid: "10–17" },
  { dag: "Lördag",  tid: "10–13" },
  { dag: "Söndag",  tid: "Stängt" }
];

export const KONTAKT = {
  namn:     "Västerviks stadsbibliotek",
  adress:   "Spötorget 7, 593 30 Västervik",
  telefon:  "010-35 555 00",
  epost:    "biblioteket@vastervik.se",
  hemsida:  "bibliotek.vastervik.se",
  avvikelser: "Avvikelser kan förekomma, till exempel vid helger. Se hemsidan."
};

// =====================================================================
//  INFOPUNKTER – runda gula plattor på golvet i spelet.
// =====================================================================
//
//  "id" kopplar texten till plattans plats i kartan. Rör inte id.
//  Varje rad i "rader" blir ett eget stycke på infokortet.
//  visaOppettider: true lägger in hela veckans öppettider och kontakt.

export const INFOPUNKTER = [
  {
    id: "info_entre",
    rubrik: "Välkommen!",
    rader: ["Välkommen till Västerviks stadsbibliotek."],
    visaOppettider: true
  },
  {
    id: "info_reception",
    rubrik: "Bibliotekskort och lån",
    rader: [
      "För att låna behöver du ett bibliotekskort. Ta med legitimation, så hjälper vi dig här.",
      "Lånetiden är 4 veckor. Om det är kö, och för tv-spel och tidskrifter, är den 2 veckor.",
      "Är boken utlånad kan du reservera den. Finns den inte här kan vi ofta beställa den från ett annat bibliotek (fjärrlån, 25 kr)."
    ]
  },
  {
    id: "info_automater",
    rubrik: "Låna och lämna själv",
    rader: [
      "Här lånar och lämnar du tillbaka själv, med ditt bibliotekskort.",
      "När biblioteket är stängt kan du lämna böcker i bokinkastet.",
      "Lämnar du tillbaka för sent kostar det 5 kr per vecka för vuxenmedier."
    ]
  },
  {
    id: "info_barn",
    rubrik: "För barn och föräldrar",
    rader: [
      "Barn- och ungdomsböcker har inga förseningsavgifter.",
      "Vårdnadshavare ansvarar för barnens lån."
    ]
  },
  {
    id: "info_plan1",
    plan: 1,
    rubrik: "Välkommen till plan 1",
    rader: [
      "Här finns romaner, spänning, facklitteratur, ljudböcker, biografier och serier.",
      "Vid informationsdisken kan du fråga om hjälp att hitta.",
      "Datorerna och släktforskningen finns i Tjustrummet längst in åt öster."
    ]
  }
];

// =====================================================================
//  RUTOR – instruktionen och de små frågorna
// =====================================================================
//
//  Alla rutor dyker upp på samma ställe, längst ner i mitten.
//  Mellanslag betyder alltid Ja och Esc betyder alltid Nej eller Stäng.
//  Varje rad i "rader" blir ett eget stycke i instruktionen.

export const RUTOR = {
  instruktionRubrik: "Så går du runt i biblioteket",
  instruktionRader: [
    "Pilarna ↑ och ↓ går framåt och bakåt. Pilarna ← och → vrider figuren.",
    "Står du på en brun i-platta får du frågan om du vill veta vad platsen är. Du kan också klicka på i-bubblan.",
    "Vid entrédörrarna får du välja vad du vill göra. Gula prickar visar sedan vägen. Gå ut till dörrarna igen för att välja något annat.",
    "Gå upp på plattan vid trappan för att byta våning.",
    "I Labbet på plan 0 finns två små spel, om du vill prova.",
    "Tryck på ? eller H för att se det här igen."
  ],
  forstar:      "Jag förstår",
  visaHjalp:    "Visa instruktionerna",
  ja:           "Ja",
  nej:          "Nej",
  infoFraga:    "Vill du veta vad det här är?",

  // Labbet. spelPlats är id för platsen där spelen startar. Skriv null
  // om biblioteket inte ska ha spelen, och ta då bort raden om spelen i
  // instruktionRader ovan.
  spelPlats:    "labbet",
  labbFraga:    "Vill du utmana dig själv lite grann?",
  labbUnder:    "Här i Labbet kan du prova ett litet spel.",
  valjSpel:     "Vilket spel vill du prova?",
  ingetSpel:    "Inget spel",
  avsluta:      "Avsluta spelet",
  spelSlut:     "Spelet är avslutat"
};

// =====================================================================
//  BEHOV – hjulet vid entrédörrarna
// =====================================================================
//
//  När figuren kommer fram till skjutdörrarna från torget dyker ett
//  hjul upp. Pilarna ← och → vrider hjulet och Enter väljer. Sedan
//  leder gula prickar till platsen.
//
//   * text   = det som står i hjulet
//   * mal    = id för platsen prickarna leder till (se PLATSER ovan)
//   * framme = det som står när man har kommit fram
//   * Ett val utan mal stänger bara hjulet.
//   * Ordningen här är ordningen i hjulet. Det första valet står i mitten
//     när hjulet öppnas.

export const BEHOV = {
  rubrik:    "Vad vill du göra i dag?",
  under:     "Välj med ← och →. Tryck Enter för att få vägen visad.",
  stang:     "Stäng",
  valj:      "Visa vägen",
  prickfarg: "#e3b230",       // de gula prickarna
  visarVag:  "Följ de gula prickarna",
  visarVagUnder: "Till {namn}. Tryck Esc för att sluta visa vägen.",
  visarVagAnnanVaning: "{namn} finns på plan {plan}. Följ prickarna till trappan.",

  val: [
    { text: "Hitta en bok",            mal: "information",
      framme: "Vid informationsdisken hjälper personalen dig att hitta rätt bok." },
    { text: "Hämta reserverad bok",    mal: "reservationer",
      framme: "Här i hyllan hämtar du det du har reserverat." },
    { text: "Gå på toaletten",         mal: "toaletter",
      framme: "Här är toaletterna." },
    { text: "Sitta och plugga",        mal: "studieyta",
      framme: "Här på studieytan kan du sitta i lugn och ro och plugga." },
    { text: "Äta medhavd mat",         mal: "pentry",
      framme: "I pentryt kan du äta din medhavda mat." },
    { text: "Köpa fika",               mal: "kaffe",
      framme: "Här finns kaffe och vatten. Godisautomaten står vid soffgruppen." },
    { text: "Hitta en plats att amma", mal: "hoglasningsrum",
      framme: "I högläsningsrummet kan du stänga dörren och amma i lugn och ro." },
    { text: "Göra en utskrift",        mal: "kopiator",
      framme: "Här skriver du ut och kopierar." },
    { text: "Låna en dator",           mal: "datorer",
      framme: "Här finns datorer som alla får använda." },
    { text: "Sitta och hänga",         mal: "ungdomshorna",
      framme: "Ungdomshörnan är till för dig som är ung. Slå dig ner i en soffa!" },
    { text: "Sitta ner en stund",      mal: "soffgrupp",
      framme: "Här i soffgruppen kan du sitta ner en stund." },
    { text: "Läsa en tidning",         mal: "tidningshorna",
      framme: "Här finns dagstidningar och tidskrifter." },
    { text: "Bara titta runt",         mal: null }
  ]
};

// =====================================================================
//  MOBIL – menyn i stället för styrning, på mobil och surfplatta
// =====================================================================
//
//  På en pekskärm går det inte att styra figuren med pilar. Där kommer
//  i stället en meny med samma val som hjulet vid entrén (BEHOV.val
//  ovan, utom valen utan mal). Trycker man på ett val går figuren dit
//  av sig själv, firar när den är framme och går sedan tillbaka till
//  start, så att man kan välja något nytt.
//
//  Överst i menyn finns en bred knapp, "Jag vill utforska själv". Då
//  fälls menyn ner till en smal list, och figuren går dit man trycker
//  på golvet. "Meny" i listen fäller upp menyn igen.
//
//  Vill man prova menyn på en dator: lägg till ?lage=mobil i adressen.
//  ?lage=dator ger styrningen med pilar även på en pekskärm.

export const MOBIL = {
  rubrik:      "Vad vill du göra i dag?",
  utforska:    "Jag vill utforska själv",
  utforskaUnder: "Tryck på golvet dit du vill gå",
  under:       "Eller välj en plats, så går figuren dit och visar vägen.",
  utforskaRubrik: "Tryck på golvet dit du vill gå",
  utforskaRad: "En gul platta vid trappan eller hissen tar dig till den andra våningen.",
  visaMeny:    "Meny",
  paVag:       "På väg till {namn}",
  paVagUnder:  "Följ figuren och de gula prickarna.",
  paVagAnnanVaning: "{namn} finns på plan {plan}. Figuren tar sig upp dit.",
  avbryt:      "Avbryt",
  framme:      "Du är framme vid {namn}!",
  igen:        "Välj något nytt",
  vantetid:    8,          // sekunder innan figuren går tillbaka till start
  fart:        4.2         // meter i sekunden när figuren går själv
};

// =====================================================================
//  MINISPEL – "Biblioteksorientering", startas i Labbet
// =====================================================================
//
//  Alla platser med avdelning: true räknas. {namn}, {antal} och
//  {totalt} byts mot rätt ord och siffror när texten visas.

export const MINISPEL = {
  namn:          "Biblioteksorientering",
  forklaring:    "Gå till alla avdelningar på båda våningarna.",
  rubrik:        "Biblioteksorientering",
  rakning:       "{antal} av {totalt}",
  hittade:       "Du hittade {namn}",
  hittadeUnder:  "{antal} av {totalt} avdelningar",
  hittadMarke:   "Hittad!",
  grattisRubrik: "Bra gjort!",
  grattisText:   "Du har hittat alla {totalt} avdelningar. Nu hittar du rätt när du kommer till biblioteket på riktigt!",
  spelaIgen:     "Spela igen",
  fortsatt:      "Avsluta spelet"
};

// =====================================================================
//  BOKJAKT – samla böcker och undvik låntagare, startas i Labbet
// =====================================================================

export const BOKJAKT = {
  antalBocker:    20,
  poangPerBok:    10,
  tappVidKrock:   3,      // så många böcker tappar man vid krock
  antalLantagare: 4,      // högst så många som det finns banor i kartan
  lantagarFart:   1.4,    // meter per sekund (spelaren går 3,2)

  namn:           "Bokjakten",
  rakning:        "{bocker} böcker · {poang} poäng",
  rakningEn:      "1 bok · {poang} poäng",
  allaSamlade:    "Alla böcker samlade!",
  allaUnder:      "Nya böcker dyker snart upp.",
  krock:          "Du tappade {antal} böcker",
  krockUtan:      "Akta låntagarna",
  forklaring:     "Samla böcker och undvik låntagarna. Krockar du tappar du några böcker."
};

// =====================================================================
//  TEMA – världens färger. Hämtade ur fotona i material/foton, och
//  sedan dämpade till en lugn palett: beige, brunt och mörkrött.
// =====================================================================
//
//  Färgkoder skrivs som "#rrggbb". Ändra, spara och ladda om sidan.
//  Starka färger gör kartan plottrig för den som är känslig för intryck.

export const TEMA = {
  // Himmel och mark runt huset
  bakgrund:      "#f6efe5",
  mark:          "#efe6d8",

  // Golv
  golv:          "#c9c7c2",   // ljusgrått, som i bokhyllefotot
  golvMonster:   "#b7b4ae",   // det svaga marmormönstret
  stengolv:      "#ddd0bb",   // beige plattor i entré och trapphall
  stengolvFog:   "#c9b9a0",

  // Väggar
  vagg:          "#fbf6ee",   // varmvitt
  vaggKant:      "#efe5d6",   // överkanten
  laxrosa:       "#e6cdb8",   // accentväggar och pelare
  tegel:         "#c9a46c",   // tegelväggen vid hissen
  tegelFog:      "#a8865a",
  morkgra:       "#6d6a66",   // hissväggen
  glas:          "#a9dbe8",   // fönster och glasväggar, svagt blå
  tak:           "#b9b2a8",   // taket på plan 0, sett från fönstren på plan 1
  karm:          "#f7f1e6",   // fönsterkarmar

  // Möbler
  hylla:         "#fdfbf7",   // vita hyllor
  bjork:         "#d6b48a",   // björkskivor och räcken
  automat:       "#2e2c2b",
  skarm:         "#9fb1ad",   // matt skärm
  tv:            "#a7b2b4",
  scenFond:      "#6b4540",   // dämpad mörkröd ridå
  ljudvagg:      "#a59a86",   // ljuddämpande skärmar runt studiebåsen
  lampa:         "#fff3dc",
  lampSken:      "#ffd89a",

  // Pendellampor hänger över de här platserna (samma id som i listan ovan)
  lampor: ["receptionsdisk", "ungdomshorna", "storstil", "soffgrupp", "barnavdelning", "entre",
           "smabarn", "hoglasningsrum",
           "information", "tidningshorna", "studieyta", "slaktforskning"],

  // Accentfärger. senap används till i-plattorna och trapplattorna,
  // så den ska synas, men inte skrika.
  senap:         "#b9874a",
  mint:          "#b8ab8c",
  rosa:          "#b07a6e",

  // Bokryggarna dras slumpvis ur den här listan
  bocker: ["#7a3b33", "#8c5a3c", "#a8845c", "#5b4130", "#c8ad86",
           "#e6dccb", "#6b4a3a", "#9a6b4f"],

  // Figuren: mörkröd tröja, så att den syns mot det ljusa golvet
  figurTroja:    "#8a3a30",
  figurByxor:    "#5b4130",
  figurHud:      "#f1d9c0",
  figurHar:      "#5a3d2b"
};
