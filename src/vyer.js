// Fasta kameraplatser for granskning.
//
// Verifieringen tar en skarmbild fran varje plats, sa att samma vinklar
// gar att jamfora mellan olika versioner. Oppna spelet med ?vy=salen for
// att se en av dem i webblasaren. plan: 1 betyder att vyn visar plan 1.

export const VYER = {
  oversikt: {
    beskrivning: "Hela vaningen snett uppifran",
    position: [11.85, 38, 47],
    mot: [11.85, 0, 19.5]
  },
  salen: {
    beskrivning: "Stora salen, blickar norrut mot scenen",
    position: [12.6, 2.1, 18.6],
    mot: [16.5, 1.1, 2.5]
  },
  entre: {
    beskrivning: "Innanfor entren, blickar in mot trappan",
    position: [17.4, 1.9, 25.9],
    mot: [11.0, 1.0, 24.2]
  },
  barn: {
    beskrivning: "Barnavdelningen, blickar norrut mot trappan",
    position: [11.0, 2.2, 36.6],
    mot: [11.0, 1.0, 27.0]
  },
  hyllgang: {
    beskrivning: "Mellan hyllraderna vaster om salen",
    position: [8.2, 1.7, 15.4],
    mot: [8.2, 1.2, 8.6]
  },
  skylt: {
    beskrivning: "Labbets skylt pa nara hall, for att doma av lasbarheten",
    position: [8.3, 5.2, 10.5],
    mot: [8.3, 3.6, 4.0]
  },
  info: {
    beskrivning: "Infopunkten vid automaterna pa nara hall",
    position: [17.9, 3.4, 17.6],
    mot: [15.6, 0.8, 14.4]
  },
  labbet: {
    beskrivning: "Labbet genom glasvaggen, med bord, skap och tv",
    position: [13.6, 3.0, 10.2],
    mot: [8.0, 0.6, 4.2]
  },
  automater: {
    beskrivning: "Aterlamningsautomaterna rygg mot rygg, fran oster",
    position: [16.9, 1.9, 14.7],
    mot: [13.9, 0.9, 14.4]
  },
  trapphall: {
    beskrivning: "Trappan och hissen sedda fran entredorren",
    position: [17.6, 2.0, 24.6],
    mot: [12.0, 1.2, 24.0]
  },
  barndisk: {
    beskrivning: "Barnavdelningens automat och lanedisk",
    position: [12.6, 2.2, 33.2],
    mot: [12.4, 0.8, 28.9]
  },
  fonster: {
    beskrivning: "Golvfonstren i barnavdelningens hörn",
    position: [9.0, 2.1, 29.5],
    mot: [17.0, 1.2, 36.8]
  },
  figur: {
    beskrivning: "Figuren i ogonhojd, for att doma av skalan",
    position: [16.6, 1.6, 30.2],
    mot: [16.6, 1.0, 25.0]
  },
  lillatrappan: {
    beskrivning: "Plan 0: lilla trappan upp till plan 1, med sin gula platta",
    position: [14.2, 2.4, 9.0],
    mot: [17.0, 0.6, 3.6]
  },
  soffgrupp: {
    beskrivning: "Soffgruppen, godisautomaten och nodutgangen i sydostra hornet",
    position: [17.4, 3.2, 13.2],
    mot: [21.4, 0.8, 18.0]
  },
  talbocker: {
    beskrivning: "Talbockernas hyllrad framfor utstallningsytan och storstil",
    position: [13.2, 3.4, 15.0],
    mot: [18.6, 1.0, 8.6]
  },
  kopiator: {
    beskrivning: "Kopiatorn vid labbets glasvagg och bokhyllorna soder om den",
    position: [9.9, 1.9, 9.4],
    mot: [6.4, 0.8, 8.6]
  },
  toaletter: {
    beskrivning: "Toalettdorrarna och kaffeautomaten mot salen",
    position: [12.0, 2.6, 15.2],
    mot: [12.0, 1.0, 19.8]
  },
  smabarn: {
    beskrivning: "Smabarnsrummet och pentryt, sett uppifran",
    position: [2.8, 7.5, 21.0],
    mot: [2.8, 0.0, 15.6]
  },
  hoglasning: {
    beskrivning: "Hoglasningsrummet med sittrappan, sett uppifran",
    position: [5.4, 7.5, 40.5],
    mot: [5.4, 0.0, 34.8]
  },
  hyllrummet: {
    beskrivning: "Det lilla rummet av bokhyllor mellan labbet och ungdomshornan",
    position: [9.2, 4.2, 16.4],
    mot: [8.8, 0.6, 11.0]
  },
  pentry: {
    beskrivning: "Pentryt med hoga vaggar och ingang i sydvastra hornet",
    position: [0.8, 6.5, 19.0],
    mot: [3.6, 0.4, 14.4]
  },
  barnentre: {
    beskrivning: "Dorroppningen fran entren in till barnavdelningen, och automaten framfor forradet",
    position: [16.6, 7.5, 32.5],
    mot: [15.4, 0.0, 26.4]
  },
  torget: {
    beskrivning: "Startplatsen pa torget, figuren blickar mot entren",
    position: [23.2, 3.0, 28.6],
    mot: [18.6, 1.0, 24.6]
  },
  barnhyllor: {
    beskrivning: "Bilderbokstragen vaster om barnavdelningens lanedisk",
    position: [8.6, 3.6, 33.0],
    mot: [7.2, 0.4, 26.0]
  },

  ungdomshorna: {
    beskrivning: "Ungdomshornan med en soffa langs varje vagg och L-hyllan mot toaletterna",
    position: [13.4, 4.4, 13.6],
    mot: [8.4, 0.6, 18.2]
  },
  nodvast: {
    beskrivning: "Nodutgangen i vastra vaggen vid kopiatorn, och hyllorna soder om den",
    position: [8.4, 4.6, 9.2],
    mot: [5.4, 1.0, 9.7]
  },
  storstilskylt: {
    beskrivning: "Storstils skylt ovanpa hyllan vid godisautomaten",
    position: [17.2, 3.0, 11.2],
    mot: [22.0, 1.4, 15.0]
  },
  skjutdorrar: {
    beskrivning: "Entrens skjutdorrar sedda fran torget",
    position: [22.6, 2.4, 25.5],
    mot: [18.2, 1.2, 25.5]
  },

  // ------------------------------------------------------------- plan 1
  nodtjust1: {
    plan: 1,
    beskrivning: "Plan 1: nodutgangen langst in i slaktforskningen",
    position: [21.0, 3.2, 8.4],
    mot: [19.9, 1.0, 0.4]
  },
  utsikt1: {
    plan: 1,
    beskrivning: "Plan 1: genom datorernas sodra fonster, ner mot torget",
    position: [20.4, 3.0, 15.6],
    mot: [21.4, -3.5, 25.0]
  },
  studievagg1: {
    plan: 1,
    beskrivning: "Plan 1: sodra vaggen bakom studieytans hyllor",
    position: [9.8, 2.4, 31.2],
    mot: [7.0, 1.0, 37.6]
  },
  oversikt1: {
    plan: 1,
    beskrivning: "Plan 1: hela vaningen snett uppifran",
    position: [11.85, 38, 47],
    mot: [11.85, 0, 19.5]
  },
  trapphall1: {
    plan: 1,
    beskrivning: "Plan 1: trappan ner, hissen och plattorna",
    position: [17.5, 2.6, 27.0],
    mot: [13.6, 0.0, 22.6]
  },
  information1: {
    plan: 1,
    beskrivning: "Plan 1: informationsdisken och lilla trappan",
    position: [10.6, 3.0, 8.6],
    mot: [14.2, 0.6, 1.6]
  },
  hyllgang1: {
    plan: 1,
    beskrivning: "Plan 1: gangen mellan romaner och spanning",
    position: [10.6, 1.8, 19.6],
    mot: [10.6, 1.1, 8.0]
  },
  datorer1: {
    plan: 1,
    beskrivning: "Plan 1: publika datorer i Tjustrummet",
    position: [22.6, 2.4, 18.9],
    mot: [19.6, 0.7, 11.5]
  },
  tidningar1: {
    plan: 1,
    beskrivning: "Plan 1: studieytan och tidningshornan",
    position: [7.4, 2.6, 28.6],
    mot: [13.0, 0.6, 35.6]
  }
};
