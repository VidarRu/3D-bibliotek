// Ett folkbibliotek i 3D. Vilket bibliotek det ar star i src/config/content.js
// och i kartfilerna i src/data.
//
// Kartan ar till for att kunna planera sitt besok i lugn och ro. Darfor
// ar skarmen sa tom som mojligt: inget dyker upp utan att man fragas
// forst, och spelen startar man sjalv i Labbet.
//
// All geometri kommer ur kartfilerna i src/data/ (en per vaning) och
// alla texter ur src/config/content.js. Andras de foljer varlden med,
// utan att nagon annan kod behover roras.

import * as THREE from "three";
import { byggVarld, byggLjus, VAGGHOJD } from "./varld.js";
import { byggFigur, stegaFigur, animeraFigur, animeraFirande, FIGUR_HOJD } from "./figur.js";
import { skapaHinder, arFri, flytta, paGolv, FIGUR_RADIE } from "./kollision.js";
import { VYER } from "./vyer.js";
import { PLATSER, SIDA, TEMA, INFOPUNKTER, MINISPEL, BOKJAKT, RUTOR, BEHOV, MOBIL, KARTOR } from "./config/content.js";
import { sammanfogaPlatser, byggZoner, iZon } from "./zoner.js";
import { byggRutnat, hittaVag, byggPrickar, vaglangd } from "./vagvisning.js";
import { meddela, doljMeddelande, fyllI, visaInfokort,
         byggForlopp, visaGrattis, ersatt, byggBokjaktRuta } from "./panel.js";
import { byggInfopunkter } from "./infopunkter.js";
import { skapaMinispel } from "./minispel.js";
import { byggBokjakt } from "./bokjakt.js";
import { skapaDialog } from "./dialog.js";
import { byggLantagare } from "./lantagare.js";
import { byggPlattor } from "./vaningsbyte.js";
import { byggSkjutdorrar } from "./skjutdorrar.js";
import { skapaBehovshjul } from "./behovshjul.js";
import { skapaMobilmeny } from "./mobilmeny.js";
import { byggFirande } from "./firande.js";

// Kartorna lases vid start i stallet for att bakas in. Da racker det att
// spara om en kartfil och ladda om sidan for att se andringen.
// En kartfil per vaning, i ordning fran entreplanet och uppat.
const KARTFILER = KARTOR.map(fil => `./data/${fil}`);
const layouter = await Promise.all(KARTFILER.map(fil =>
  fetch(new URL(fil, import.meta.url)).then(svar => svar.json())));

document.title = SIDA.titel;
const duk = document.getElementById("spelduk");
const lugnt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderare = new THREE.WebGLRenderer({ canvas: duk, antialias: true });
renderare.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderare.shadowMap.enabled = true;
renderare.shadowMap.type = THREE.PCFSoftShadowMap;
// Mjukare och mer filmiska farger, utan att de vita ytorna blir graa.
renderare.toneMapping = THREE.NeutralToneMapping;
renderare.toneMappingExposure = 1.1;

const scen = new THREE.Scene();
scen.background = new THREE.Color(TEMA.bakgrund);
scen.fog = new THREE.Fog(TEMA.bakgrund, 55, 120);

// Bada vaningarna har samma yttermatt, sa ett ljus racker for bada.
scen.add(byggLjus(layouter[0], TEMA));

const figur = byggFigur(TEMA);
scen.add(figur);

// --------------------------------------------------------------- vaningar
//
// Varje vaning ar en egen grupp med varld, zoner, skyltar, infopunkter
// och plattor. Bara den vaning figuren ar pa ligger i scenen.

const delad = { bocker: 0, poang: 0 };   // bokjaktens poang, gemensam

async function byggVaning(layout) {
  const plan = layout.meta?.plan ?? 0;
  const grupp = new THREE.Group();
  grupp.name = `plan${plan}`;
  const varld = byggVarld(layout, TEMA);
  grupp.add(varld);
  const hinder = skapaHinder(layout);

  const platser = sammanfogaPlatser(layout, PLATSER);
  const zoner = await byggZoner(layout, platser);
  grupp.add(zoner.grupp);

  // Infopunkterna byggs efter skyltarna, nar typsnittet ar laddat.
  const info = INFOPUNKTER.filter(i => (layout.infopunkter || []).some(p => p.id === i.id));
  const infopunkter = byggInfopunkter(layout, info, TEMA);
  grupp.add(infopunkter.grupp);

  // For vagvisningen ar en infopunkt en liten plats runt plattan.
  const infoPlatser = infopunkter.punkter.map(p => ({
    id: p.id, plan, namn: fyllI(SIDA.infoNamn, p.text.rubrik), farg: TEMA.senap,
    skylt: { x: p.x, z: p.z },
    rutor: [{ x: p.x - 0.4, z: p.z - 0.4, bredd: 0.8, djup: 0.8 }]
  }));

  const plattor = byggPlattor(layout, TEMA);
  grupp.add(plattor.grupp);

  const skjutdorrar = byggSkjutdorrar(layout, TEMA, lugnt);
  grupp.add(skjutdorrar.grupp);

  return {
    plan, layout, grupp, varld, hinder, platser, zoner, info, infopunkter,
    infoPlatser, plattor, skjutdorrar,
    rutnat: byggRutnat(layout, hinder),
    bokjakt: byggBokjakt(layout, hinder, TEMA, BOKJAKT, delad),
    lantagare: byggLantagare(layout, TEMA, BOKJAKT.antalLantagare, BOKJAKT.lantagarFart)
  };
}

const vaningar = [];
for (const l of layouter) vaningar.push(await byggVaning(l));
const vaningFor = plan => vaningar.find(v => v.plan === plan);

// Den fasta kameran for granskning kan ligga pa vilken vaning som helst.
const valdVy = new URLSearchParams(location.search).get("vy");
const fastVy = valdVy && VYER[valdVy] ? VYER[valdVy] : null;

let V = vaningFor(fastVy?.plan ?? 0);    // vaningen figuren ar pa
scen.add(V.grupp);
// Figuren star pa torget pa plan 0 och hor inte hemma i en fast vy av plan 1.
if (fastVy?.plan) figur.visible = false;

// Pa en pekskarm utan mus kommer en meny i stallet for styrningen, se
// avsnittet om mobilen langre ner. ?lage=mobil eller ?lage=dator i
// adressen valjer sjalv.
const lageIAdressen = new URLSearchParams(location.search).get("lage");
const mobilLage = !fastVy && (lageIAdressen ? lageIAdressen === "mobil"
  : window.matchMedia("(hover: none) and (pointer: coarse)").matches);
if (mobilLage) document.body.classList.add("mobil");

const platser = vaningar.flatMap(v => v.platser);
const info = vaningar.flatMap(v => v.info);
const platsMed = id => platser.find(p => p.id === id) ||
  vaningar.flatMap(v => v.infoPlatser).find(p => p.id === id);

const prickar = byggPrickar();
scen.add(prickar.grupp);

const start = vaningFor(0).layout.start;
const tillstand = {
  x: start.x,
  z: start.z,
  riktning: (start.riktning * Math.PI) / 180,
  gar: false
};

const kamera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);

// ---------------------------------------------------------------- styrning

const tangenter = { fram: false, bak: false, vanster: false, hoger: false, spring: false };
const STILLA = { fram: false, bak: false, vanster: false, hoger: false, spring: false };
const KARTA = {
  ArrowUp: "fram", ArrowDown: "bak", ArrowLeft: "vanster", ArrowRight: "hoger",
  KeyW: "fram", KeyS: "bak", KeyA: "vanster", KeyD: "hoger", ShiftLeft: "spring"
};

const dialog = skapaDialog();
const hjul = skapaBehovshjul(BEHOV);
const tillbakaTillSpelet = () => duk.focus({ preventScroll: true });

// Nar fokus ligger i grattisrutan ska piltangenterna inte styra figuren.
const iGrattis = () => document.getElementById("grattis").contains(document.activeElement);

function tangent(e, ned) {
  if (ned && e.code === "Escape") { slutaVisa(); stangInfo(); return; }
  if (ned && e.code === "Space" && infoOppen) { e.preventDefault(); stangInfo(); return; }
  if (ned && (e.code === "KeyH" || e.key === "?") && !iGrattis()) { visaInstruktion(); return; }
  const namn = KARTA[e.code];
  if (!namn) return;
  if (ned && iGrattis()) return;
  tangenter[namn] = ned;
  e.preventDefault();
}
window.addEventListener("keydown", e => tangent(e, true));
window.addEventListener("keyup", e => tangent(e, false));
// Slapps en tangent medan fonstret saknar fokus fastnar den annars.
window.addEventListener("blur", () => { for (const k in tangenter) tangenter[k] = false; });

// ------------------------------------------------------------ instruktion
//
// Visas av sig sjalv forsta gangen. Sedan med ?-knappen eller H.

const SEDD = "bibliotek-instruktion-sedd";

function visaInstruktion() {
  stangInfo();
  dialog.fraga({
    rubrik: RUTOR.instruktionRubrik, rader: RUTOR.instruktionRader, stoppar: true,
    knappar: [{ text: RUTOR.forstar, tangenter: ["Space", "Escape"], varde: true, huvudval: true }]
  }).svar.then(() => {
    try { localStorage.setItem(SEDD, "1"); } catch { /* da visas den igen nasta gang */ }
    tillbakaTillSpelet();
  });
}
document.getElementById("hjalpknapp").addEventListener("click", visaInstruktion);

// ---------------------------------------------------------- hitta hit
//
// Ligger malet pa en annan vaning gar vagen forst till den platta (trappa
// eller hiss) som ger kortast vag sammanlagt, och vidare fran dar man
// kommer ut pa den andra vaningen.

// behov ar valet ur hjulet vid entren, om vagen visas for det.
const vagvisning = { mal: null, vag: null, senast: 0, andraLangd: null, behov: null };
let framme = null;

/** En platta som plats, sa att vagvisningen kan leda dit. */
const plattPlats = f => ({
  id: "platta_" + f.id,
  skylt: { x: f.platta.x + f.platta.bredd / 2, z: f.platta.z + f.platta.djup / 2 },
  rutor: [f.platta]
});

/** Hur langt det ar fran varje forbindelses ankomst till platsen. */
function langdPaAndraVaningen(plats) {
  const andra = vaningFor(plats.plan);
  const ut = new Map();
  for (const f of andra.layout.forbindelser || []) {
    const vag = hittaVag(andra.rutnat, f.ankomst.x, f.ankomst.z, plats);
    if (vag) ut.set(f.id, vaglangd(vag));
  }
  return ut;
}

function ritaVag() {
  const plats = platsMed(vagvisning.mal);
  if (plats.plan === V.plan) {
    vagvisning.vag = hittaVag(V.rutnat, tillstand.x, tillstand.z, plats);
  } else {
    if (!vagvisning.andraLangd) vagvisning.andraLangd = langdPaAndraVaningen(plats);
    let bast = null, bastLangd = Infinity;
    for (const f of V.layout.forbindelser || []) {
      if (f.till !== plats.plan || !vagvisning.andraLangd.has(f.id)) continue;
      const vag = hittaVag(V.rutnat, tillstand.x, tillstand.z, plattPlats(f));
      if (!vag) continue;
      const langd = vaglangd(vag) + vagvisning.andraLangd.get(f.id);
      if (langd < bastLangd) { bast = vag; bastLangd = langd; }
    }
    vagvisning.vag = bast;
  }
  const farg = vagvisning.behov ? BEHOV.prickfarg : plats.farg;
  if (vagvisning.vag) prickar.visa(vagvisning.vag, farg);
  else prickar.dolj();
  return vagvisning.vag;
}

function arFramme(id) {
  const plats = platsMed(id);
  if (!plats || plats.plan !== V.plan) return false;
  // Zoner som tacks av en disk gar inte att kliva in i, darav marginalen.
  return iZon(plats, tillstand.x, tillstand.z, 0.6);
}

/** Talar om vart prickarna leder, med vaningen om den ar en annan. */
function meddelaVag(plats) {
  // Pa mobilen star det i rutan nedtill i stallet.
  if (mobilLage) return;
  if (vagvisning.behov) {
    if (plats.plan === V.plan) meddela(BEHOV.visarVag, 0, fyllI(BEHOV.visarVagUnder, plats.namn));
    else meddela(BEHOV.visarVag, 0, ersatt(BEHOV.visarVagAnnanVaning, { namn: plats.namn, plan: plats.plan }));
    return;
  }
  if (plats.plan === V.plan) meddela(fyllI(SIDA.visarVag, plats.namn), 0, SIDA.stangHjalp);
  else meddela(ersatt(SIDA.visarVagAnnanVaning, { namn: plats.namn, plan: plats.plan }), 0,
               SIDA.visarVagAnnanUnder);
}

/** Visar vagen till platsen. behov ar valet ur hjulet, om det kom darifran. */
function visaVag(id, behov = null) {
  const plats = platsMed(id);
  if (!plats) return null;
  framme = null;
  if (arFramme(id)) {
    slutaVisa();
    meddelaFramme(plats, behov);
    framme = id;
    return [];
  }
  vagvisning.mal = id;
  vagvisning.behov = behov;
  vagvisning.andraLangd = null;
  ritaVag();
  meddelaVag(plats);
  return vagvisning.vag;
}

function meddelaFramme(plats, behov) {
  if (mobilLage) return;
  if (behov?.framme) meddela(fyllI(SIDA.framme, plats.namn), 7, behov.framme);
  else meddela(fyllI(SIDA.framme, plats.namn));
}

function slutaVisa() {
  if (!vagvisning.mal) return;
  vagvisning.mal = null;
  vagvisning.behov = null;
  vagvisning.vag = null;
  vagvisning.andraLangd = null;
  prickar.dolj();
  doljMeddelande();
}

function folj(tid) {
  if (!vagvisning.mal) return;
  if (arFramme(vagvisning.mal)) {
    const plats = platsMed(vagvisning.mal);
    const behov = vagvisning.behov;
    framme = plats.id;
    slutaVisa();
    // Har figuren just hittat avdelningen sager minispelet det i stallet.
    if (nyssHittad !== plats.id) meddelaFramme(plats, behov);
    return;
  }
  // Raknas om nagra ganger i sekunden medan figuren ror sig.
  if (tillstand.gar && tid - vagvisning.senast > 0.3) {
    vagvisning.senast = tid;
    ritaVag();
  }
}

// ------------------------------------------------------------ infopunkter
//
// Gar figuren upp pa en platta kommer en liten fraga: "Vill du veta vad
// det har ar?" Ja oppnar kortet. Fragan kommer inte igen forran man gatt
// av plattan. Man kan ocksa klicka pa i-bubblan, var man an star.

let infoOppen = null;      // kortet som visas just nu
let infoFranPlatta = false;// kortet stangs nar man gar av plattan
let platta = null;         // plattan figuren star pa
let infoFraga = null;      // fragan som visas just nu

function oppnaInfo(id, franPlatta = false) {
  infoOppen = id;
  infoFranPlatta = franPlatta;
  visaInfokort(id ? info.find(i => i.id === id) : null, () => { stangInfo(); tillbakaTillSpelet(); });
}

function stangInfo() {
  if (infoOppen) oppnaInfo(null);
}

function fragaOmInfo(id) {
  const i = info.find(x => x.id === id);
  const f = dialog.fraga({
    rubrik: RUTOR.infoFraga, under: i.rubrik,
    knappar: [{ text: RUTOR.ja, tangenter: ["Space"], varde: true, huvudval: true },
              { text: RUTOR.nej, tangenter: ["Escape"], varde: false }]
  });
  infoFraga = f;
  f.svar.then(ja => {
    if (infoFraga === f) infoFraga = null;
    if (ja && platta === id) oppnaInfo(id, true);
  });
}

function kollaInfo() {
  const id = V.infopunkter.vid(tillstand.x, tillstand.z, platta);
  if (id === platta) return;
  platta = id;
  infoFraga?.stang();
  if (infoOppen && infoFranPlatta) oppnaInfo(null);
  for (const v of vaningar) v.infopunkter.markera(id);
  // En storre ruta, som instruktionen, ska inte ersattas av fragan.
  if (id && !dialog.stoppar) fragaOmInfo(id);
}

// Klick pa en i-bubbla oppnar kortet direkt.
const straleKastare = new THREE.Raycaster();
function sikta(e) {
  const r = duk.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1,
                                -((e.clientY - r.top) / r.height) * 2 + 1);
  straleKastare.setFromCamera(ndc, kamera);
}
function bubblaUnder(e) {
  sikta(e);
  return V.infopunkter.traffad(straleKastare);
}
duk.addEventListener("click", e => {
  // Pa mobilen ligger menyn dar infokortet skulle ha hamnat.
  if (mobilLage) return;
  const id = bubblaUnder(e);
  if (!id || dialog.stoppar) return;
  infoFraga?.stang();
  oppnaInfo(id);
});
duk.addEventListener("pointermove", e => {
  duk.style.cursor = bubblaUnder(e) ? "pointer" : "";
});

// --------------------------------------------------------------- minispel
//
// Tva sma spel som man startar sjalv i Labbet: Biblioteksorientering
// (hitta alla avdelningar pa bada vaningarna) och Bokjakten. Bara ett i
// taget, och inget ar igang nar sidan oppnas.

let aktivtSpel = null;                 // null, "orientering" eller "bokjakt"
let stangGrattis = null;
let nyssHittad = null;                 // avdelningen som hittades i den har bildrutan

const forlopp = byggForlopp(platser.filter(p => p.avdelning), () => avslutaSpel());
const bokRuta = byggBokjaktRuta(BOKJAKT, () => avslutaSpel());

const minispel = skapaMinispel(platser, {
  narBesok: () => {},
  narHittad: (p, antal, totalt) => {
    nyssHittad = p.id;
    forlopp.uppdatera(minispel.funna);
    if (antal < totalt) {
      meddela(fyllI(MINISPEL.hittade, p.namn), 4,
              ersatt(MINISPEL.hittadeUnder, { antal, totalt }));
    }
  },
  narVinst: () => {
    const totalt = minispel.avdelningar.length;
    slutaVisa();
    doljMeddelande();
    stangGrattis = visaGrattis(totalt, {
      spelaIgen: () => { stangGrattis = null; nollstall(); tillbakaTillSpelet(); },
      fortsatt: () => { stangGrattis = null; avslutaSpel(); }
    });
  }
});

function kollaZoner() {
  nyssHittad = null;
  if (aktivtSpel === "orientering") minispel.kolla(tillstand.x, tillstand.z, V.plan);
}

function nollstall() {
  minispel.nollstall(tillstand.x, tillstand.z, V.plan);
  forlopp.uppdatera([]);
}

function startaSpel(namn) {
  avslutaSpel(true);
  aktivtSpel = namn;
  if (namn === "orientering") {
    nollstall();
    forlopp.visa(true);
  } else {
    slaPaBokjakt(true);
    bokRuta.uppdatera(delad);
    bokRuta.visa(true);
  }
  tillbakaTillSpelet();
}

function avslutaSpel(tyst = false) {
  if (!aktivtSpel) return;
  if (aktivtSpel === "bokjakt") slaPaBokjakt(false);
  aktivtSpel = null;
  forlopp.visa(false);
  bokRuta.visa(false);
  if (stangGrattis) { stangGrattis(); stangGrattis = null; }
  if (!tyst) meddela(RUTOR.spelSlut, 3);
  tillbakaTillSpelet();
}

// Fragan i Labbet kommer nar figuren gar in, och inte igen forran den
// har gatt ut. Ar ett spel redan igang fragas ingenting.
const spelPlats = platser.find(p => p.id === RUTOR.spelPlats);
let iSpelPlatsen = true;               // startplatsen raknas inte som att ga in

async function fragaOmSpel() {
  stangInfo();
  const ja = await dialog.fraga({
    rubrik: RUTOR.labbFraga, under: RUTOR.labbUnder, stoppar: true,
    knappar: [{ text: RUTOR.ja, tangenter: ["Space"], varde: true, huvudval: true },
              { text: RUTOR.nej, tangenter: ["Escape"], varde: false }]
  }).svar;
  if (!ja) { tillbakaTillSpelet(); return; }
  const val = await dialog.fraga({
    rubrik: RUTOR.valjSpel, stoppar: true,
    rader: [`${MINISPEL.namn}: ${MINISPEL.forklaring}`, `${BOKJAKT.namn}: ${BOKJAKT.forklaring}`],
    knappar: [{ text: MINISPEL.namn, tangenter: ["Digit1"], varde: "orientering", huvudval: true },
              { text: BOKJAKT.namn, tangenter: ["Digit2"], varde: "bokjakt" },
              { text: RUTOR.ingetSpel, tangenter: ["Escape"], varde: null }]
  }).svar;
  if (val) startaSpel(val);
  else tillbakaTillSpelet();
}

function kollaSpelPlatsen() {
  const inne = !!spelPlats && spelPlats.plan === V.plan && iZon(spelPlats, tillstand.x, tillstand.z);
  if (inne && !iSpelPlatsen && !aktivtSpel && !dialog.stoppar) fragaOmSpel();
  iSpelPlatsen = inne;
}

// ------------------------------------------------------- hjulet vid entren
//
// Nar figuren kommer fram till skjutdorrarna fran torget fragar hjulet
// vad man vill gora, och gula prickar visar vagen dit. Hjulet kommer inte
// igen forran figuren har gatt ifran dorrarna. Under ett spel fragas
// ingenting.

let vidDorrarna = false;

async function fragaOmBehov() {
  stangInfo();
  infoFraga?.stang();
  const val = await hjul.visa();
  tillbakaTillSpelet();
  if (!val) return;
  if (val.mal) visaVag(val.mal, val);
  else slutaVisa();
}

function kollaValplats() {
  const r = V.layout.valplats;
  const inne = !!r && tillstand.x >= r.x && tillstand.x <= r.x + r.bredd &&
    tillstand.z >= r.z && tillstand.z <= r.z + r.djup;
  if (inne && !vidDorrarna && !aktivtSpel && !dialog.stoppar && !hjul.oppet) fragaOmBehov();
  vidDorrarna = inne;
}

// ---------------------------------------------------------------- bokjakt
//
// Ett eget lager ovanpa resten: bocker att samla och lantagare att
// undvika. Ar det avstangt finns det inte i scenen och ingen av dess kod
// kors. Varje vaning har sina egna bocker och lantagare, men poangen ar
// gemensam.

const SKYDDAD = 1.5;                   // sekunder utan nya krockar efter en krock
const bokLager = { pa: false, skyddadTill: 0, lugnTill: 0, allaVar: false };

function slaPaBokjakt(pa) {
  bokLager.pa = pa;
  for (const v of vaningar) {
    if (pa) {
      v.bokjakt.nollstall();
      v.grupp.add(v.bokjakt.grupp, v.lantagare.grupp);
    } else {
      v.grupp.remove(v.bokjakt.grupp, v.lantagare.grupp);
    }
  }
  bokLager.allaVar = false;
}

/** Knuffar figuren bort fran (fx, fz), med vanlig kollision i sma steg. */
function knuffa(fx, fz, langd) {
  let dx = tillstand.x - fx, dz = tillstand.z - fz;
  const l = Math.hypot(dx, dz) || 1;
  dx /= l; dz /= l;
  const steg = 12;
  for (let i = 0; i < steg; i++) {
    const ny = flytta(V.layout, V.hinder, tillstand.x, tillstand.z,
                      dx * langd / steg, dz * langd / steg);
    tillstand.x = ny.x; tillstand.z = ny.z;
  }
}

function stegaBokjakt(dt, tid) {
  if (!bokLager.pa) return;
  const { bokjakt, lantagare } = V;
  lantagare.stega(dt);

  if (bokjakt.plocka(tillstand.x, tillstand.z, tid)) bokRuta.uppdatera(delad);

  const alla = bokjakt.allaPlockade();
  if (alla && !bokLager.allaVar) meddela(BOKJAKT.allaSamlade, 4.5, BOKJAKT.allaUnder);
  bokLager.allaVar = alla;

  // Krock med en lantagare: tappa bocker och knuffas lite. Figuren
  // blinkar inte, det blir for mycket som hander pa en gang.
  const l = tid > bokLager.skyddadTill && tid > bokLager.lugnTill &&
    lantagare.krock(tillstand.x, tillstand.z);
  if (l) {
    const tappade = bokjakt.tappa(tillstand.x, tillstand.z, BOKJAKT.tappVidKrock, tid);
    knuffa(l.x, l.z, 0.9);
    bokLager.skyddadTill = tid + SKYDDAD;
    meddela(tappade ? ersatt(BOKJAKT.krock, { antal: tappade }) : BOKJAKT.krockUtan, 3);
    bokRuta.uppdatera(delad);
  }
}

// ------------------------------------------------------------ byta vaning
//
// Gar figuren upp pa en gul platta tonar bilden ut, figuren flyttas till
// samma trappa eller hiss pa den andra vaningen och bilden tonar in igen.

const tona = document.getElementById("tona");
let byter = false;

function flyttaTillVaning(plan, viaId) {
  const ny = vaningFor(plan);
  if (!ny) return;
  scen.remove(V.grupp);
  V = ny;
  scen.add(V.grupp);

  const fb = (V.layout.forbindelser || []);
  // Utan via kommer man ut vid den forsta forbindelsen i kartfilen.
  const f = fb.find(o => o.id === viaId) || fb[0];
  const a = f ? f.ankomst : V.layout.start;
  tillstand.x = a.x;
  tillstand.z = a.z;
  tillstand.riktning = (a.riktning * Math.PI) / 180;
  tillstand.gar = false;

  // Infokortet och fragan hor till den vaning man lamnade.
  platta = null;
  infoFraga?.stang();
  stangInfo();
  // En lantagare som star vid trappan ska inte krocka med en gang.
  bokLager.lugnTill = performance.now() / 1000 + 1.0;
  bokLager.allaVar = V.bokjakt.allaPlockade();
  // Den som utforskar sjalv borjar om pa den nya vaningen.
  if (mobil.lage === "utforskar") stannaUtforska();

  if (vagvisning.mal) {
    ritaVag();
    meddelaVag(platsMed(vagvisning.mal));
  } else {
    meddela(ersatt(SIDA.nuPaPlan, { plan: V.plan }), 3);
  }
  placeraKamera(true);
}

/** Byter vaning. direkt hoppar over overtoningen, for proven. */
function bytVaning(plan, viaId, direkt = false) {
  if (byter || plan === V.plan || !vaningFor(plan)) return;
  if (direkt || lugnt) {
    flyttaTillVaning(plan, viaId);
    return;
  }
  byter = true;
  tona.classList.add("syns");
  setTimeout(() => {
    flyttaTillVaning(plan, viaId);
    tona.classList.remove("syns");
    setTimeout(() => { byter = false; }, 250);
  }, 260);
}

function kollaVaning(direkt = false) {
  const f = V.plattor.vid(tillstand.x, tillstand.z);
  if (f) bytVaning(f.till, f.id, direkt);
}

// ---------------------------------------------------------------- mobilen
//
// Pa en pekskarm gar det inte att styra figuren. Dar kommer i stallet en
// meny med valen fran hjulet vid entren. Figuren gar dit av sig sjalv
// langs de gula prickarna, och tar trappan eller hissen om platsen ligger
// pa den andra vaningen. Framme firar den en liten stund, och sedan star
// den pa torget igen och man kan valja nytt.
//
// Overst i menyn kan man i stallet valja att utforska sjalv. Da falls
// menyn ner till en smal list och figuren gar dit man trycker pa golvet.
// Infopunkterna och trappornas plattor fungerar som med tangenterna.

const mobilmeny = skapaMobilmeny(MOBIL, BEHOV.val.filter(v => v.mal && platsMed(v.mal)));
const firande = byggFirande([BEHOV.prickfarg, TEMA.senap, TEMA.rosa, TEMA.figurTroja,
                             TEMA.mint, TEMA.bjork, "#fffaf2"]);
scen.add(firande.grupp);

// lage ar null, "meny", "gar", "firar", "tillbaka" eller "utforskar".
// fran ar "utforskar" om menyn oppnades medan man utforskade sjalv, och
// tryck ar vagen till dit man senast tryckte.
const mobil = { lage: null, val: null, plats: null, vag: null, steg: 1, plan: 0,
                firat: 0, kameraRiktning: 0, timer: null, fran: null, tryck: null };
const VRIDFART_SJALV = 7;               // radianer i sekunden
const TRYCK_NARA = 1.5;                 // meter mellan trycket och narmaste fria plats

async function mobilMeny() {
  mobil.lage = "meny";
  const val = await mobilmeny.meny();
  if (mobil.lage !== "meny") return;
  if (val.utforska) mobilUtforska();
  else mobilGa(val);
}

function visaPaVag() {
  const { plats } = mobil;
  mobilmeny.paVag(fyllI(MOBIL.paVag, plats.namn),
    plats.plan === V.plan ? MOBIL.paVagUnder
      : ersatt(MOBIL.paVagAnnanVaning, { namn: plats.namn, plan: plats.plan }),
    () => mobilAvbryt());
}

/** Avbryt pa vagen: tillbaka till torget, eller fortsatt utforska dar man ar. */
function mobilAvbryt() {
  if (mobil.fran !== "utforskar") { mobilTillbaka(); return; }
  if (byter) { setTimeout(mobilAvbryt, 120); return; }
  slutaVisa();
  mobilUtforska();
}

function mobilGa(val) {
  mobil.val = val;
  mobil.plats = platsMed(val.mal);
  mobil.plan = V.plan;
  const vag = visaVag(val.mal, val);
  if (!vag) { slutaVisa(); mobilMeny(); return; }      // ingen vag dit
  if (!vag.length) { mobilFira(); return; }            // redan framme
  mobil.lage = "gar";
  mobil.vag = null;
  visaPaVag();
}

/** Vrider figuren mjukt mot riktningen mal. */
function vridMot(mal, dt) {
  let d = (mal - tillstand.riktning) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  const max = VRIDFART_SJALV * dt;
  tillstand.riktning += Math.max(-max, Math.min(max, d));
}

/** Flyttar figuren en bit langs vagen. Ger true medan den fortfarande gar. */
function stegaLangs(vag, dt) {
  let kvar = MOBIL.fart * dt;
  while (kvar > 0 && mobil.steg < vag.length) {
    const m = vag[mobil.steg];
    const dx = m.x - tillstand.x, dz = m.z - tillstand.z;
    const l = Math.hypot(dx, dz);
    if (l <= kvar) {
      tillstand.x = m.x; tillstand.z = m.z;
      kvar -= l;
      mobil.steg++;
    } else {
      tillstand.x += (dx / l) * kvar;
      tillstand.z += (dz / l) * kvar;
      kvar = 0;
    }
  }
  const m = vag[Math.min(mobil.steg, vag.length - 1)];
  const dx = m.x - tillstand.x, dz = m.z - tillstand.z;
  if (Math.hypot(dx, dz) > 0.05) vridMot(Math.atan2(dx, -dz), dt);
  tillstand.gar = mobil.steg < vag.length;
  return tillstand.gar;
}

/** Figuren gar langs vagen av sig sjalv. */
function gaSjalv(dt) {
  const vag = vagvisning.vag;
  // Ny vag efter ett vaningsbyte: borja om fran dess forsta punkt.
  if (vag !== mobil.vag) {
    mobil.vag = vag;
    mobil.steg = 1;
    if (mobil.plan !== V.plan) { mobil.plan = V.plan; visaPaVag(); }
  }
  if (!vag || stegaLangs(vag, dt)) return;
  if (mobil.plats.plan === V.plan) mobilFira();
  // Vagen till en annan vaning slutar pa plattan vid trappan eller hissen.
  else bytVaning(mobil.plats.plan, V.plattor.vid(tillstand.x, tillstand.z)?.id);
}

function mobilFira() {
  const { plats, val } = mobil;
  mobil.lage = "firar";
  mobil.firat = 0;
  // Kameran stannar dar den ar medan figuren vander sig om mot den.
  mobil.kameraRiktning = tillstand.riktning;
  tillstand.gar = false;
  slutaVisa();
  framme = plats.id;
  if (!lugnt) firande.starta(tillstand.x, tillstand.z);
  mobilmeny.framme(fyllI(MOBIL.framme, plats.namn), val.framme || "", MOBIL.vantetid,
                   () => mobilTillbaka());
  clearTimeout(mobil.timer);
  mobil.timer = setTimeout(() => mobilTillbaka(), MOBIL.vantetid * 1000);
}

/** Tillbaka till torget pa plan 0, och menyn igen. */
function mobilTillbaka(direkt = false) {
  if (mobil.lage === "tillbaka" || mobil.lage === "meny") return;
  // Mitt i ett vaningsbyte: vanta tills det ar klart.
  if (byter) { setTimeout(() => mobilTillbaka(direkt), 120); return; }
  clearTimeout(mobil.timer);
  mobil.lage = "tillbaka";
  mobilmeny.dolj();
  const klart = () => {
    slutaVisa();
    framme = null;
    mobil.fran = null;
    platta = null;
    infoFraga?.stang();
    stangInfo();
    firande.stoppa();
    animeraFirande(figur, -1);
    const hem = vaningFor(0);
    if (V !== hem) {
      scen.remove(V.grupp);
      V = hem;
      scen.add(V.grupp);
    }
    tillstand.x = start.x;
    tillstand.z = start.z;
    tillstand.riktning = (start.riktning * Math.PI) / 180;
    tillstand.gar = false;
    mobil.plan = V.plan;
    placeraKamera(true);
    mobilMeny();
  };
  if (direkt || lugnt) { klart(); return; }
  byter = true;
  tona.classList.add("syns");
  setTimeout(() => {
    klart();
    tona.classList.remove("syns");
    setTimeout(() => { byter = false; }, 250);
  }, 260);
}

// ------------------------------------------------- mobilen: utforska sjalv

const dialogRuta = document.getElementById("dialog");

function mobilUtforska() {
  mobil.lage = "utforskar";
  mobil.fran = "utforskar";
  stannaUtforska();
  mobilmeny.utforska(MOBIL.utforskaRubrik, MOBIL.utforskaRad, () => mobilVisaMeny());
}

/** Figuren stannar dar den ar och prickarna forsvinner. */
function stannaUtforska() {
  mobil.tryck = null;
  tillstand.gar = false;
  if (!vagvisning.mal) prickar.dolj();
}

/** "Meny" i listen: menyn falls upp igen, och figuren star kvar. */
function mobilVisaMeny() {
  stannaUtforska();
  infoFraga?.stang();
  stangInfo();
  mobilMeny();
}

/** Gar dit man tryckte, eller till narmaste fria plats intill. */
function utforskaTill(x, z) {
  if (mobil.lage !== "utforskar" || byter || !paGolv(V.layout, x, z)) return false;
  const plats = { id: "tryck", plan: V.plan, skylt: { x, z },
                  rutor: [{ x: x - 0.25, z: z - 0.25, bredd: 0.5, djup: 0.5 }] };
  const vag = hittaVag(V.rutnat, tillstand.x, tillstand.z, plats);
  if (!vag || vag.length < 2) return false;
  // Ett tryck mitt pa en stor disk eller bakom en vagg ger ingen vag dit.
  const slut = vag[vag.length - 1];
  if (Math.hypot(slut.x - x, slut.z - z) > TRYCK_NARA) return false;
  if (infoOppen && !infoFranPlatta) stangInfo();
  mobil.tryck = vag;
  mobil.steg = 1;
  prickar.visa(vag, BEHOV.prickfarg);
  return true;
}

/** Var pa golvet trycket hamnade. En hylla eller ett bord raknas dar det star. */
const golvplan = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function golvpunkt(e) {
  sikta(e);
  const traff = straleKastare.intersectObject(V.varld, true)[0];
  if (traff) return { x: traff.point.x, z: traff.point.z };
  const p = straleKastare.ray.intersectPlane(golvplan, new THREE.Vector3());
  return p ? { x: p.x, z: p.z } : null;
}

function tryckPaDuken(e) {
  if (mobil.lage !== "utforskar" || byter || dialog.stoppar) return;
  const id = bubblaUnder(e);
  if (id) { infoFraga?.stang(); oppnaInfo(id); return; }
  const p = golvpunkt(e);
  if (p) utforskaTill(p.x, p.z);
}

// Bara ett kort tryck med ett finger raknas. Ett drag eller tva fingrar
// gor ingenting, sa att figuren inte gar ivag av misstag.
const pekare = new Map();               // pekare som ar nere: { x, y, tid, flera }
duk.addEventListener("pointerdown", e => {
  if (!mobilLage) return;
  for (const p of pekare.values()) p.flera = true;
  pekare.set(e.pointerId, { x: e.clientX, y: e.clientY, tid: performance.now(),
                            flera: pekare.size > 0 });
});
duk.addEventListener("pointerup", e => {
  const p = pekare.get(e.pointerId);
  pekare.delete(e.pointerId);
  if (!p || p.flera) return;
  if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 12 || performance.now() - p.tid > 600) return;
  tryckPaDuken(e);
});
duk.addEventListener("pointercancel", e => pekare.delete(e.pointerId));

function stegaUtforska(dt) {
  if (mobil.tryck && !stegaLangs(mobil.tryck, dt)) stannaUtforska();
  animeraFigur(figur, tillstand, dt, tillstand.gar);
  kollaInfo();
  kollaVaning();
  // Fragan och infokortet ligger dar listen ar.
  mobilmeny.gom(dialogRuta.classList.contains("syns") || !!infoOppen);
}

function stegaMobil(dt) {
  if (mobil.lage === "utforskar") {
    stegaUtforska(dt);
  } else if (mobil.lage === "gar") {
    gaSjalv(dt);
    animeraFigur(figur, tillstand, dt, true);
  } else if (mobil.lage === "firar") {
    mobil.firat += dt;
    firande.stega(dt);
    if (lugnt) return;
    // Vander sig mot kameran, hoppar och vinkar.
    vridMot(mobil.kameraRiktning + Math.PI, dt);
    animeraFirande(figur, mobil.firat);
  } else {
    animeraFigur(figur, tillstand, dt, false);
  }
}

// ------------------------------------------------------------ fast kamera

let friVy = null;           // valfri kamera, bara for granskningen
let nedtill = 0;            // pixlar som rutan nedtill tacker, utjamnat

function placeraKamera(forsta) {
  const vy = friVy || fastVy;
  if (vy) {
    kamera.position.set(...vy.position);
    kamera.lookAt(new THREE.Vector3(...vy.mot));
    return;
  }
  // Foljer snett bakifran. Kameran maste ligga hogre an vagghojden,
  // annars skar narmaste vagg rakt genom bilden. Pa mobilen ligger den
  // hogre och brantare, sa att man ser mer av golvet pa den smala
  // skarmen. Nar figuren firar kommer kameran lite narmare.
  const firar = mobilLage && mobil.lage === "firar";
  const riktning = firar ? mobil.kameraRiktning : tillstand.riktning;
  const [bak, upp] = !mobilLage ? [8.0, 5.8] : firar ? [5.6, 4.2] : [7.2, 7.4];
  const bakat = new THREE.Vector3(-Math.sin(riktning), 0, Math.cos(riktning));
  const mal = new THREE.Vector3(tillstand.x, 0, tillstand.z)
    .addScaledVector(bakat, bak)
    .add(new THREE.Vector3(0, VAGGHOJD + upp, 0));
  if (forsta) kamera.position.copy(mal);
  else kamera.position.lerp(mal, firar ? 0.05 : 0.12);
  kamera.lookAt(tillstand.x, 0.9, tillstand.z);

  // Tacker en ruta nedre delen av skarmen tittar kameran lite brantare
  // ner, sa att figuren hamnar mitt i den del av bilden som syns.
  if (!mobilLage) return;
  const h = duk.clientHeight || 1;
  const tackt = Math.min(mobilmeny.hojd, h * 0.7);
  nedtill = forsta ? tackt : nedtill + (tackt - nedtill) * 0.15;
  const halva = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
  kamera.rotateX(-Math.atan((nedtill / h) * halva));
}

// ------------------------------------------------------------------ slinga

// Duken ar storre an sin plats pa skarmar med hog upplosning, darfor
// jamfors med den senaste storleken och inte med dukens egen.
let storlek = "";
function passaStorlek() {
  const b = duk.clientWidth, h = duk.clientHeight;
  if (storlek !== `${b}x${h}`) {
    storlek = `${b}x${h}`;
    renderare.setSize(b, h, false);
    kamera.aspect = b / h;
    // En staende mobilskarm ar smal. Kameran far da en storre synvinkel
    // pa hojden, sa att det inte blir som att titta genom ett titthal.
    if (mobilLage && kamera.aspect < 1) {
      const vinkel = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(27)) / kamera.aspect);
      kamera.fov = Math.min(72, THREE.MathUtils.radToDeg(vinkel));
    } else {
      kamera.fov = 52;
    }
    kamera.updateProjectionMatrix();
  }
}

function rita(tid = performance.now() / 1000) {
  figur.position.set(tillstand.x, 0, tillstand.z);
  figur.rotation.y = -tillstand.riktning;
  prickar.animera(tid);
  V.infopunkter.animera();
  if (bokLager.pa) V.bokjakt.animera(tid);
  passaStorlek();
  renderare.render(scen, kamera);
}

let forra = performance.now();
function slinga(nu) {
  const dt = Math.min((nu - forra) / 1000, 0.05);
  const tid = nu / 1000;
  forra = nu;
  if (mobilLage && !byter) {
    stegaMobil(dt);
    V.skjutdorrar.stega(tillstand.x, tillstand.z, dt);
  } else if (!fastVy && !byter) {
    // Medan en storre ruta ar oppen star figuren still.
    const knappar = dialog.stoppar || stangGrattis || hjul.oppet ? STILLA : tangenter;
    stegaFigur(tillstand, knappar, dt, V.layout, V.hinder);
    animeraFigur(figur, tillstand, dt, knappar.spring);
    kollaZoner();
    kollaInfo();
    kollaSpelPlatsen();
    kollaValplats();
    V.skjutdorrar.stega(tillstand.x, tillstand.z, dt);
    folj(tid);
    stegaBokjakt(dt, tid);
    kollaVaning();
  }
  placeraKamera(false);
  rita(tid);
  requestAnimationFrame(slinga);
}

placeraKamera(true);
rita();
requestAnimationFrame(slinga);

// Instruktionen forsta gangen. Inte i granskningens fasta vyer.
let sedd = false;
try { sedd = localStorage.getItem(SEDD) === "1"; } catch { /* visas varje gang */ }
if (mobilLage) mobilMeny();
else if (!sedd && !fastVy) visaInstruktion();

// --------------------------------------------------------- krok for tester
// Verifieringen behover kunna styra figuren utan tangentbord och lasa av
// var den hamnade. Allt nedan ar till for granskningen, inte for spelaren.

window.spel = {
  get layout() { return V.layout; },
  get hinder() { return V.hinder; },
  get plan() { return V.plan; },
  tillstand,
  platser,
  vyer: VYER,
  matt: { figurRadie: FIGUR_RADIE, figurHojd: FIGUR_HOJD, vagghojd: VAGGHOJD },
  stall(x, z, riktningGrader = 0) {
    tillstand.x = x;
    tillstand.z = z;
    tillstand.riktning = (riktningGrader * Math.PI) / 180;
    placeraKamera(true);
    rita();
  },
  /** Ga framat i angivet antal sekunder, i steg om en sextiondels sekund. */
  ga(sekunder, knappar = { fram: true }, ritaEfter = true) {
    const steg = 1 / 60;
    for (let t = 0; t < sekunder; t += steg) {
      stegaFigur(tillstand, { ...tangenter, ...knappar }, steg, V.layout, V.hinder);
    }
    if (ritaEfter) rita();
    return { x: tillstand.x, z: tillstand.z };
  },
  /** Byter vaning direkt, utan overtoning. */
  bytVaning: (plan, via) => { bytVaning(plan, via, true); rita(); },
  /** Byter vaning om figuren star pa en platta, direkt. */
  kollaVaning: () => kollaVaning(true),
  /** Alla svavande skyltar pa bada vaningarna, for granskningen. */
  get skyltar() {
    return vaningar.flatMap(v => {
      const ut = [];
      v.grupp.updateMatrixWorld(true);
      v.grupp.traverse(n => {
        if (!n.isSprite || !n.visible) return;
        const p = n.getWorldPosition(new THREE.Vector3());
        ut.push({ plan: v.plan, namn: n.name, x: p.x, y: p.y, z: p.z, radie: n.scale.x / 2 });
      });
      return ut;
    });
  },
  get plattor() {
    return vaningar.map(v => ({ plan: v.plan, plattor: v.plattor.plattor.map(p => ({
      id: p.id, till: p.till, platta: p.platta, ankomst: p.ankomst })) }));
  },
  visaVag,
  slutaVisa,
  arFramme,
  arFri: (x, z) => arFri(V.layout, V.hinder, x, z),
  get vag() { return vagvisning.vag; },
  get framme() { return framme; },
  get infoVid() { return infoOppen; },
  get funna() { return minispel.funna; },
  get vunnit() { return minispel.vunnit; },
  nollstall,
  kollaZoner,
  dialog,
  get aktivtSpel() { return aktivtSpel; },
  startaSpel,
  avslutaSpel,
  kollaSpelPlatsen,
  kollaValplats,
  hjul,
  get behov() { return vagvisning.behov; },
  get skjutdorrar() { return V.skjutdorrar.oppna; },
  mobil: {
    get pa() { return mobilLage; },
    get lage() { return mobil.lage; },
    get menylage() { return mobilmeny.lage; },
    /** Som att trycka pa ett val i menyn. "utforska" ar knappen overst. */
    valj: mal => mobilmeny.valj(mal),
    /** Som ett tryck pa golvet i (x, z) nar man utforskar sjalv. */
    tryck: (x, z) => utforskaTill(x, z),
    /** Som "Meny" i listen. */
    visaMeny: () => mobilVisaMeny(),
    /** Stegar figuren i sekunder utan att rita, for proven. */
    stega(sekunder, dt = 1 / 60) {
      for (let t = 0; t < sekunder && !byter; t += dt) stegaMobil(dt);
      placeraKamera(true);
      rita();
      return { x: tillstand.x, z: tillstand.z, plan: V.plan, lage: mobil.lage };
    },
    tillbaka: () => mobilTillbaka(true)
  },
  visaInstruktion,
  /** Som ett klick pa i-bubblan. */
  klickaInfo: id => { infoFraga?.stang(); oppnaInfo(id); },
  bokjakt: {
    get pa() { return bokLager.pa; },
    satt: pa => (pa ? startaSpel("bokjakt") : avslutaSpel()),
    get status() { return { ...delad }; },
    get bocker() { return V.bokjakt.kvar.map(b => ({ x: b.x, z: b.z, tappad: b.tappad })); },
    get lantagare() { return V.lantagare.lista.map(l => ({ id: l.id, x: l.x, z: l.z })); },
    /** Ett steg i bokjakten utan att rita, for proven. */
    steg: (dt = 1 / 60) => stegaBokjakt(dt, performance.now() / 1000),
    get iScenen() { return scen.children.includes(V.grupp) && V.grupp.children.includes(V.bokjakt.grupp); },
    get skyddad() { return performance.now() / 1000 < bokLager.skyddadTill; }
  },
  get infopunkter() {
    return V.infopunkter.punkter.map(p => ({ id: p.id, x: p.x, z: p.z, rubrik: p.text.rubrik }));
  },
  kollaInfo,
  rita,
  /** Stall kameran var som helst, for granskningen. Utan argument: folj figuren. */
  titta(x, y, z, mx, my, mz) {
    friVy = x === undefined ? null : { position: [x, y, z], mot: [mx, my, mz] };
    placeraKamera(true);
    rita();
  },
  /** Hur tung scenen ar: ritanrop, trianglar och antal bocker. */
  statistik() {
    rita();
    const i = renderare.info.render;
    return { ritanrop: i.calls, trianglar: i.triangles,
             bocker: V.varld.userData.antalBocker };
  }
};
document.body.dataset.klar = "1";
