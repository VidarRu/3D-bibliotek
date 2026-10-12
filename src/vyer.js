// Fasta kameraplatser for granskning.
//
// Verifieringen tar en skarmbild fran varje plats, sa att samma vinklar
// gar att jamfora mellan olika versioner. Oppna spelet med ?vy=salen for
// att se en av dem i webblasaren.

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
    position: [16.6, 3.4, 17.6],
    mot: [14.3, 0.8, 14.4]
  },
  labbet: {
    beskrivning: "Labbet genom glasvaggen, med bord, skap och tv",
    position: [13.6, 3.0, 10.2],
    mot: [8.0, 0.6, 4.2]
  },
  automater: {
    beskrivning: "Aterlamningsautomaterna rygg mot rygg, fran oster",
    position: [15.6, 1.9, 14.7],
    mot: [12.6, 0.9, 14.4]
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
  }
};
