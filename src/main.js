// Vasterviks stadsbibliotek i 3D.
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
import { byggFigur, stegaFigur, animeraFigur, FIGUR_HOJD } from "./figur.js";
import { skapaHinder, arFri, flytta, FIGUR_RADIE } from "./kollision.js";
import { VYER } from "./vyer.js";
import { PLATSER, SIDA, TEMA, INFOPUNKTER, MINISPEL, BOKJAKT, RUTOR } from "./config/content.js";
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

// Kartorna lases vid start i stallet for att bakas in. Da racker det att
// spara om en kartfil och ladda om sidan for att se andringen.
const KARTFILER = ["./data/layout.json", "./data/layout_plan1.json"];
const layouter = await Promise.all(KARTFILER.map(fil =>
  fetch(new URL(fil, import.meta.url)).then(svar => svar.json())));

const duk = document.getElementById("spelduk");

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

  return {
    plan, layout, grupp, varld, hinder, platser, zoner, info, infopunkter,
    infoPlatser, plattor,
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

const vagvisning = { mal: null, vag: null, senast: 0, andraLangd: null };
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
  if (vagvisning.vag) prickar.visa(vagvisning.vag, plats.farg);
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
  if (plats.plan === V.plan) meddela(fyllI(SIDA.visarVag, plats.namn), 0, SIDA.stangHjalp);
  else meddela(ersatt(SIDA.visarVagAnnanVaning, { namn: plats.namn, plan: plats.plan }), 0,
               SIDA.visarVagAnnanUnder);
}

function visaVag(id) {
  const plats = platsMed(id);
  if (!plats) return null;
  framme = null;
  if (arFramme(id)) {
    slutaVisa();
    meddela(fyllI(SIDA.framme, plats.namn));
    framme = id;
    return [];
  }
  vagvisning.mal = id;
  vagvisning.andraLangd = null;
  ritaVag();
  meddelaVag(plats);
  return vagvisning.vag;
}

function slutaVisa() {
  if (!vagvisning.mal) return;
  vagvisning.mal = null;
  vagvisning.vag = null;
  vagvisning.andraLangd = null;
  prickar.dolj();
  doljMeddelande();
}

function folj(tid) {
  if (!vagvisning.mal) return;
  if (arFramme(vagvisning.mal)) {
    const plats = platsMed(vagvisning.mal);
    framme = plats.id;
    slutaVisa();
    // Har figuren just hittat avdelningen sager minispelet det i stallet.
    if (nyssHittad !== plats.id) meddela(fyllI(SIDA.framme, plats.namn));
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
function bubblaUnder(e) {
  const r = duk.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1,
                                -((e.clientY - r.top) / r.height) * 2 + 1);
  straleKastare.setFromCamera(ndc, kamera);
  return V.infopunkter.traffad(straleKastare);
}
duk.addEventListener("click", e => {
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

const lugnt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tona = document.getElementById("tona");
let byter = false;

function flyttaTillVaning(plan, viaId) {
  const ny = vaningFor(plan);
  if (!ny) return;
  scen.remove(V.grupp);
  V = ny;
  scen.add(V.grupp);

  const fb = (V.layout.forbindelser || []);
  const f = fb.find(o => o.id === viaId) || fb.find(o => o.id === "huvudtrappan") || fb[0];
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

// ------------------------------------------------------------ fast kamera

let friVy = null;           // valfri kamera, bara for granskningen

function placeraKamera(forsta) {
  const vy = friVy || fastVy;
  if (vy) {
    kamera.position.set(...vy.position);
    kamera.lookAt(new THREE.Vector3(...vy.mot));
    return;
  }
  // Foljer snett bakifran. Kameran maste ligga hogre an vagghojden,
  // annars skar narmaste vagg rakt genom bilden.
  const bakat = new THREE.Vector3(
    -Math.sin(tillstand.riktning), 0, Math.cos(tillstand.riktning));
  const mal = new THREE.Vector3(tillstand.x, 0, tillstand.z)
    .addScaledVector(bakat, 8.0)
    .add(new THREE.Vector3(0, VAGGHOJD + 5.8, 0));
  if (forsta) kamera.position.copy(mal);
  else kamera.position.lerp(mal, 0.12);
  kamera.lookAt(tillstand.x, 0.9, tillstand.z);
}

// ------------------------------------------------------------------ slinga

function passaStorlek() {
  const b = duk.clientWidth, h = duk.clientHeight;
  if (duk.width !== b || duk.height !== h) {
    renderare.setSize(b, h, false);
    kamera.aspect = b / h;
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
  if (!fastVy && !byter) {
    // Medan en storre ruta ar oppen star figuren still.
    const knappar = dialog.stoppar || stangGrattis ? STILLA : tangenter;
    stegaFigur(tillstand, knappar, dt, V.layout, V.hinder);
    animeraFigur(figur, tillstand, dt, knappar.spring);
    kollaZoner();
    kollaInfo();
    kollaSpelPlatsen();
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
if (!sedd && !fastVy) visaInstruktion();

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
