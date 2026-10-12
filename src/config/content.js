// =====================================================================
//  INNEHÅLL – här ändrar du texter utan att röra resten av koden.
// =====================================================================
//
//  Så här gör du:
//   * Ändra text mellan citattecknen "...". Behåll citattecknen.
//   * Behåll kommatecknen i slutet av raderna.
//   * Rör inte "id". Det kopplar platsen till kartan.
//   * avdelning: true  = räknas som avdelning (och i minispelet senare)
//     avdelning: false = övrig plats, syns i listan men räknas inte
//   * Ordningen här är ordningen i listan på sidan.
//   * farg är zonens färg på golvet och kanten på skylten, skriven som
//     en färgkod. Sök på "color picker" på nätet för att hitta koder.
//
//  Spara filen och ladda om sidan för att se ändringen.
// =====================================================================

export const SIDA = {
  titel: "Leksaksbiblioteket",
  undertitel: "Plan 0",
  listrubrik: "Hitta i biblioteket",
  avdelningarRubrik: "Avdelningar",
  ovrigtRubrik: "Övriga platser",
  knappVisaVag: "Visa vägen",
  knappSluta: "Sluta visa",
  framme: "Du är framme vid {namn}!",
  visarVag: "Följ prickarna till {namn}",
  stangHjalp: "Tryck Esc för att sluta visa vägen",
  fallIhop: "Dölj listan",
  fallUt: "Visa listan",
  oppetIdag: "Öppet idag {tid}",
  stangtIdag: "Stängt idag",
  braAttVeta: "Bra att veta",
  oppettiderRubrik: "Öppettider",
  kontaktRubrik: "Kontakt",
  infoNamn: "Info: {namn}",
  stangKort: "Stäng"
};

export const PLATSER = [
  // ---------------------------------------------------- avdelningar
  {
    id: "receptionsdisk",
    namn: "Receptionsdisken",
    beskrivning: "Här kan du fråga personalen om allt.",
    avdelning: true,
    farg: "#f2a65a"
  },
  {
    id: "lana_aterlamna",
    namn: "Låna och återlämna",
    beskrivning: "Automater där du lånar och lämnar tillbaka själv.",
    avdelning: true,
    farg: "#7cc6a4"
  },
  {
    id: "utstallningsyta",
    namn: "Utställningsytan",
    beskrivning: "Här visas utställningar som byts ut under året.",
    avdelning: true,
    farg: "#e88aa6"
  },
  {
    id: "ungdomshorna",
    namn: "Ungdomshörnan",
    beskrivning: "Soffor, böcker och spel för dig som är ung.",
    avdelning: true,
    farg: "#9b8fe0"
  },
  {
    id: "labbet",
    namn: "Labbet",
    beskrivning: "Prova på teknik, skapa och bygg.",
    avdelning: true,
    farg: "#5fb3e0"
  },
  {
    id: "barnavdelning",
    namn: "Barnavdelningen",
    beskrivning: "Bilderböcker och barnböcker, och en egen lånedisk.",
    avdelning: true,
    farg: "#f2cd4b"
  },

  // ------------------------------------------------- övriga platser
  {
    id: "entre",
    namn: "Entré",
    beskrivning: "Här kommer du in.",
    avdelning: false,
    farg: "#c9b8a3"
  },
  {
    id: "scen",
    namn: "Scenen",
    beskrivning: "Här hålls föreställningar och evenemang.",
    avdelning: false,
    farg: "#d99a8b"
  },
  {
    id: "talbocker",
    namn: "Talböcker",
    beskrivning: "Böcker att lyssna på.",
    avdelning: false,
    farg: "#a5c48a"
  },
  {
    id: "storstil",
    namn: "Storstil",
    beskrivning: "Böcker med stor text och en lugn sitthörna.",
    avdelning: false,
    farg: "#b7c9d6"
  },
  {
    id: "trappa_hiss",
    namn: "Trappa och hiss",
    beskrivning: "Upp till plan 1.",
    avdelning: false,
    farg: "#c4bdb3"
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
  }
];

// =====================================================================
//  MINISPEL – "Hitta alla avdelningar"
// =====================================================================
//
//  Alla platser med avdelning: true räknas. {namn}, {antal} och
//  {totalt} byts mot rätt ord och siffror när texten visas.

export const MINISPEL = {
  rubrik:        "Hitta alla avdelningar",
  rakning:       "{antal} av {totalt}",
  hittade:       "Du hittade {namn}!",
  hittadeUnder:  "{antal} av {totalt} avdelningar",
  hittadMarke:   "Hittad!",
  grattisRubrik: "Grattis!",
  grattisText:   "Du har hittat alla {totalt} avdelningar. Nu hittar du rätt när du kommer till biblioteket på riktigt!",
  spelaIgen:     "Spela igen",
  fortsatt:      "Fortsätt utforska"
};

// =====================================================================
//  BOKJAKT – samla böcker och undvik låntagare (kan stängas av)
// =====================================================================
//
//  paFranStart: false betyder att bokjakten är avstängd när sidan
//  öppnas, och besökaren slår på den med knappen.

export const BOKJAKT = {
  paFranStart:    false,
  antalBocker:    20,
  poangPerBok:    10,
  tappVidKrock:   3,      // så många böcker tappar man vid krock
  antalLantagare: 4,      // högst så många som det finns banor i kartan
  lantagarFart:   1.4,    // meter per sekund (spelaren går 3,2)

  knapp:          "Bokjakt",
  pa:             "På",
  av:             "Av",
  rakning:        "{bocker} böcker · {poang} poäng",
  rakningEn:      "1 bok · {poang} poäng",
  allaSamlade:    "Alla böcker samlade!",
  allaUnder:      "Nya böcker dyker snart upp.",
  krock:          "Oj! Du tappade {antal} böcker.",
  krockUtan:      "Oj! Akta låntagarna.",
  forklaring:     "Samla böcker och undvik låntagarna. Krockar du tappar du böcker."
};

// =====================================================================
//  TEMA – världens färger. Hämtade ur fotona i material/foton.
// =====================================================================
//
//  Färgkoder skrivs som "#rrggbb". Ändra, spara och ladda om sidan.

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
  laxrosa:       "#f4c7b0",   // accentväggar och pelare
  tegel:         "#d9a948",   // gula tegelväggen vid hissen
  tegelFog:      "#b88a35",
  morkgra:       "#6d6a66",   // hissväggen
  glas:          "#a9dbe8",   // fönster och glasväggar, svagt blå
  karm:          "#f7f1e6",   // fönsterkarmar

  // Möbler
  hylla:         "#fdfbf7",   // vita hyllor
  bjork:         "#e3b06a",   // björkskivor och räcken
  automat:       "#2e2c2b",
  skarm:         "#4fd6d0",   // turkos skärm
  scenFond:      "#5466cc",
  lampa:         "#fff3dc",
  lampSken:      "#ffd89a",

  // Pendellampor hänger över de här platserna (samma id som i listan ovan)
  lampor: ["receptionsdisk", "ungdomshorna", "storstil", "barnavdelning", "entre"],

  // Bibliotekets profilfärger, från fasaden
  senap:         "#e7b53c",
  mint:          "#8fd0b6",
  rosa:          "#e7a6c6",

  // Bokryggarna dras slumpvis ur den här listan
  bocker: ["#e7b53c", "#8fd0b6", "#e7a6c6", "#d8574a", "#3d6fb6",
           "#2f8a6b", "#f2ede3", "#2b2a33", "#c97b3a", "#8a5aa8",
           "#e6d06a", "#5aa7c9"],

  // Figuren
  figurTroja:    "#e7b53c",
  figurByxor:    "#5fae93",
  figurHud:      "#f1d9c0",
  figurHar:      "#5a3d2b"
};
