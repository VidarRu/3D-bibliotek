// Leksaksbiblioteket.
//
// All geometri kommer ur src/data/layout.json och alla texter ur
// src/config/content.js. Andras de foljer varlden med, utan att nagon
// annan kod behover roras.

import * as THREE from "three";
import { byggVarld, byggLjus, VAGGHOJD } from "./varld.js";
import { byggFigur, stegaFigur, animeraFigur, FIGUR_HOJD } from "./figur.js";
import { skapaHinder, arFri, flytta, FIGUR_RADIE } from "./kollision.js";
import { VYER } from "./vyer.js";
import { PLATSER, SIDA, TEMA, INFOPUNKTER, MINISPEL, BOKJAKT } from "./config/content.js";
import { sammanfogaPlatser, byggZoner, iZon } from "./zoner.js";
import { byggRutnat, hittaVag, byggPrickar } from "./vagvisning.js";
import { byggPanel, meddela, doljMeddelande, fyllI, visaInfokort,
         byggForlopp, visaGrattis, ersatt, byggBokjaktRad } from "./panel.js";
import { byggInfopunkter } from "./infopunkter.js";
import { skapaMinispel } from "./minispel.js";
import { byggKonfetti } from "./konfetti.js";
import { byggBokjakt } from "./bokjakt.js";
import { byggLantagare } from "./lantagare.js";

// Kartan lases vid start i stallet for att bakas in. Da racker det att
// spara om src/data/layout.json och ladda om sidan for att se andringen.
const layout = await fetch(new URL("./data/layout.json", import.meta.url))
  .then(svar => svar.json());

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

scen.add(byggLjus(layout, TEMA));
const varld = byggVarld(layout, TEMA);
scen.add(varld);

const figur = byggFigur(TEMA);
scen.add(figur);

const hinder = skapaHinder(layout);

// ------------------------------------------------- platser och skyltar

const platser = sammanfogaPlatser(layout, PLATSER);
const zoner = await byggZoner(layout, platser);
scen.add(zoner.grupp);

// Infopunkterna byggs efter skyltarna, nar typsnittet ar laddat.
const info = INFOPUNKTER.filter(i => (layout.infopunkter || []).some(p => p.id === i.id));
const infopunkter = byggInfopunkter(layout, info, TEMA);
scen.add(infopunkter.grupp);

// For vagvisningen ar en infopunkt en liten plats runt plattan.
const infoPlatser = infopunkter.punkter.map(p => ({
  id: p.id, namn: fyllI(SIDA.infoNamn, p.text.rubrik), farg: TEMA.senap,
  skylt: { x: p.x, z: p.z },
  rutor: [{ x: p.x - 0.4, z: p.z - 0.4, bredd: 0.8, djup: 0.8 }]
}));
const platsMed = id => platser.find(p => p.id === id) || infoPlatser.find(p => p.id === id);

const rutnat = byggRutnat(layout, hinder);
const prickar = byggPrickar();
scen.add(prickar.grupp);

const tillstand = {
  x: layout.start.x,
  z: layout.start.z,
  riktning: (layout.start.riktning * Math.PI) / 180,
  gar: false
};

const kamera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);

// ---------------------------------------------------------------- styrning

const tangenter = { fram: false, bak: false, vanster: false, hoger: false, spring: false };
const KARTA = {
  ArrowUp: "fram", ArrowDown: "bak", ArrowLeft: "vanster", ArrowRight: "hoger",
  KeyW: "fram", KeyS: "bak", KeyA: "vanster", KeyD: "hoger", ShiftLeft: "spring"
};

// Nar fokus ligger i listan ska piltangenterna sköta listan, inte figuren.
const iPanelen = () => {
  const a = document.activeElement;
  return a && a !== document.body &&
    (document.getElementById("panel").contains(a) || document.getElementById("grattis").contains(a));
};

function tangent(e, ned) {
  if (ned && e.code === "Escape") { slutaVisa(); stangInfo(); return; }
  const namn = KARTA[e.code];
  if (!namn) return;
  if (ned && iPanelen()) return;
  tangenter[namn] = ned;
  e.preventDefault();
}
window.addEventListener("keydown", e => tangent(e, true));
window.addEventListener("keyup", e => tangent(e, false));
// Slapps en tangent medan fonstret saknar fokus fastnar den annars.
window.addEventListener("blur", () => { for (const k in tangenter) tangenter[k] = false; });

// ---------------------------------------------------------- hitta hit

const vagvisning = { mal: null, vag: null, senast: 0 };
let framme = null;

function ritaVag() {
  const plats = platsMed(vagvisning.mal);
  vagvisning.vag = hittaVag(rutnat, tillstand.x, tillstand.z, plats);
  if (vagvisning.vag) prickar.visa(vagvisning.vag, plats.farg);
  else prickar.dolj();
  return vagvisning.vag;
}

function arFramme(id) {
  const plats = platsMed(id);
  if (!plats) return false;
  // Zoner som tacks av en disk gar inte att kliva in i, darav marginalen.
  return iZon(plats, tillstand.x, tillstand.z, 0.6);
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
  ritaVag();
  panel.markera(id);
  meddela(fyllI(SIDA.visarVag, plats.namn), 0, SIDA.stangHjalp);
  return vagvisning.vag;
}

function slutaVisa() {
  if (!vagvisning.mal) return;
  vagvisning.mal = null;
  vagvisning.vag = null;
  prickar.dolj();
  panel.markera(null);
  doljMeddelande();
}

function folj(tid) {
  if (!vagvisning.mal) return;
  if (arFramme(vagvisning.mal)) {
    const plats = platsMed(vagvisning.mal);
    framme = plats.id;
    slutaVisa();
    // Har figuren just hittat avdelningen sager minispelet det i stallet.
    if (nyssHittad !== plats.id) meddela(fyllI(SIDA.framme, plats.namn), 3.5);
    zoner.hoppa(plats.id, tid);
    return;
  }
  // Raknas om nagra ganger i sekunden medan figuren ror sig.
  if (tillstand.gar && tid - vagvisning.senast > 0.3) {
    vagvisning.senast = tid;
    ritaVag();
  }
}

const panel = byggPanel(platser, {
  valj: id => {
    visaVag(id);
    // Tillbaka till spelet, sa att piltangenterna styr figuren direkt.
    duk.focus({ preventScroll: true });
  },
  sluta: slutaVisa
}, info);

// ------------------------------------------------------------ infopunkter

let infoOppen = null;      // kortet som visas just nu
let infoAvstangd = null;   // stangt med Esc, oppnas inte igen forran man gatt av

function oppnaInfo(id, tid = performance.now() / 1000) {
  infoOppen = id;
  infopunkter.markera(id, tid);
  visaInfokort(id ? info.find(i => i.id === id) : null, stangInfo);
}

function stangInfo() {
  if (!infoOppen) return;
  infoAvstangd = infoOppen;
  oppnaInfo(null);
}

function kollaInfo(tid) {
  const id = infopunkter.vid(tillstand.x, tillstand.z, infoOppen || infoAvstangd);
  if (infoAvstangd && id !== infoAvstangd) infoAvstangd = null;
  const visa = id && id !== infoAvstangd ? id : null;
  if (visa !== infoOppen) oppnaInfo(visa, tid);
}

// ------------------------------------------------------------- minispelet
//
// Forsta gangen figuren gar in i en zon gor skylten ett glatt hopp. For
// avdelningarna raknas det dessutom i minispelet, med konfetti och en
// grattishalsning nar alla ar funna.

const lugnt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const konfetti = byggKonfetti();
scen.add(konfetti.nat);
const forlopp = byggForlopp(platser.filter(p => p.avdelning));
let stangGrattis = null;
let nu = 0;                            // tiden i sekunder, for skylthoppen
let nyssHittad = null;                 // avdelningen som hittades i den har bildrutan

const minispel = skapaMinispel(platser, {
  narBesok: p => zoner.hoppa(p.id, nu),
  narHittad: (p, antal, totalt) => {
    nyssHittad = p.id;
    forlopp.uppdatera(minispel.funna);
    panel.markeraFunna(minispel.funna);
    if (antal < totalt) {
      meddela(fyllI(MINISPEL.hittade, p.namn), 3,
              ersatt(MINISPEL.hittadeUnder, { antal, totalt }));
    }
    if (!lugnt) konfetti.small(p.skylt.x, VAGGHOJD + 0.8, p.skylt.z, [p.farg, "#ffffff", p.farg]);
  },
  narVinst: () => {
    const totalt = minispel.avdelningar.length;
    if (!lugnt) konfetti.regn(tillstand.x, tillstand.z, [TEMA.senap, TEMA.mint, TEMA.rosa, "#ffffff"]);
    slutaVisa();
    doljMeddelande();
    stangGrattis = visaGrattis(totalt, {
      spelaIgen: () => { stangGrattis = null; nollstall(); duk.focus({ preventScroll: true }); },
      fortsatt: () => { stangGrattis = null; duk.focus({ preventScroll: true }); }
    });
  }
});
// Startplatsen raknas inte som ett besok.
minispel.borja(tillstand.x, tillstand.z);

function kollaZoner(tid) {
  nu = tid;
  nyssHittad = null;
  minispel.kolla(tillstand.x, tillstand.z);
}

function nollstall() {
  minispel.nollstall(tillstand.x, tillstand.z);
  forlopp.uppdatera([]);
  panel.markeraFunna([]);
}

// ---------------------------------------------------------------- bokjakt
//
// Ett eget lager ovanpa resten: bocker att samla och lantagare att
// undvika. Ar det avstangt finns det inte i scenen och ingen av dess kod
// kors, sa det kan aldrig stora orienteringen eller minispelet.

const bokjakt = byggBokjakt(layout, hinder, TEMA, BOKJAKT);
const lantagare = byggLantagare(layout, TEMA, BOKJAKT.antalLantagare, BOKJAKT.lantagarFart);
const SKYDDAD = 1.5;                   // sekunder utan nya krockar efter en krock
const bokLager = { pa: false, skyddadTill: 0, allaVar: false };

const bokRad = byggBokjaktRad(BOKJAKT, () => {
  slaPaBokjakt(!bokLager.pa);
});

function slaPaBokjakt(pa) {
  bokLager.pa = pa;
  if (pa) {
    bokjakt.nollstall();
    scen.add(bokjakt.grupp, lantagare.grupp);
  } else {
    scen.remove(bokjakt.grupp, lantagare.grupp);
    figur.visible = true;
  }
  bokLager.allaVar = false;
  bokRad.uppdatera(pa, bokjakt.status);
}
slaPaBokjakt(BOKJAKT.paFranStart);

/** Knuffar figuren bort fran (fx, fz), med vanlig kollision i sma steg. */
function knuffa(fx, fz, langd) {
  let dx = tillstand.x - fx, dz = tillstand.z - fz;
  const l = Math.hypot(dx, dz) || 1;
  dx /= l; dz /= l;
  const steg = 12;
  for (let i = 0; i < steg; i++) {
    const ny = flytta(layout, hinder, tillstand.x, tillstand.z,
                      dx * langd / steg, dz * langd / steg);
    tillstand.x = ny.x; tillstand.z = ny.z;
  }
}

function stegaBokjakt(dt, tid) {
  if (!bokLager.pa) return;
  lantagare.stega(dt);

  if (bokjakt.plocka(tillstand.x, tillstand.z, tid)) {
    bokRad.uppdatera(true, bokjakt.status);
    bokRad.studsa();
  }

  const alla = bokjakt.allaPlockade();
  if (alla && !bokLager.allaVar) meddela(BOKJAKT.allaSamlade, 3.5, BOKJAKT.allaUnder);
  bokLager.allaVar = alla;

  // Krock med en lantagare: tappa bocker, knuffas och blinka en stund.
  const l = tid > bokLager.skyddadTill && lantagare.krock(tillstand.x, tillstand.z);
  if (l) {
    const tappade = bokjakt.tappa(tillstand.x, tillstand.z, BOKJAKT.tappVidKrock, tid);
    knuffa(l.x, l.z, 0.9);
    bokLager.skyddadTill = tid + SKYDDAD;
    meddela(tappade ? ersatt(BOKJAKT.krock, { antal: tappade }) : BOKJAKT.krockUtan, 2.2);
    bokRad.uppdatera(true, bokjakt.status);
    bokRad.studsa();
  }
  figur.visible = tid > bokLager.skyddadTill || Math.floor(tid * 10) % 2 === 0;
}

// ------------------------------------------------------------ fast kamera

const valdVy = new URLSearchParams(location.search).get("vy");
const fastVy = valdVy && VYER[valdVy] ? VYER[valdVy] : null;

function placeraKamera(forsta) {
  if (fastVy) {
    kamera.position.set(...fastVy.position);
    kamera.lookAt(new THREE.Vector3(...fastVy.mot));
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
  zoner.animera(tid);
  prickar.animera(tid);
  infopunkter.animera(tid);
  if (bokLager.pa) bokjakt.animera(tid);
  passaStorlek();
  renderare.render(scen, kamera);
}

let forra = performance.now();
function slinga(nu) {
  const dt = Math.min((nu - forra) / 1000, 0.05);
  const tid = nu / 1000;
  forra = nu;
  if (!fastVy) {
    stegaFigur(tillstand, tangenter, dt, layout, hinder);
    animeraFigur(figur, tillstand, dt, tangenter.spring);
    kollaZoner(tid);
    kollaInfo(tid);
    folj(tid);
  }
  if (!fastVy) stegaBokjakt(dt, tid);
  konfetti.stega(dt);
  placeraKamera(false);
  rita(tid);
  requestAnimationFrame(slinga);
}

placeraKamera(true);
rita();
requestAnimationFrame(slinga);

// --------------------------------------------------------- krok for tester
// Verifieringen behover kunna styra figuren utan tangentbord och lasa av
// var den hamnade. Allt nedan ar till for granskningen, inte for spelaren.

window.spel = {
  layout,
  hinder,
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
      stegaFigur(tillstand, { ...tangenter, ...knappar }, steg, layout, hinder);
    }
    if (ritaEfter) rita();
    return { x: tillstand.x, z: tillstand.z };
  },
  visaVag,
  slutaVisa,
  arFramme,
  arFri: (x, z) => arFri(layout, hinder, x, z),
  get vag() { return vagvisning.vag; },
  get framme() { return framme; },
  get infoVid() { return infoOppen; },
  get funna() { return minispel.funna; },
  get vunnit() { return minispel.vunnit; },
  get konfetti() { return konfetti.antal; },
  nollstall,
  kollaZoner: () => kollaZoner(performance.now() / 1000),
  bokjakt: {
    get pa() { return bokLager.pa; },
    satt: slaPaBokjakt,
    get status() { return { ...bokjakt.status }; },
    get bocker() { return bokjakt.kvar.map(b => ({ x: b.x, z: b.z, tappad: b.tappad })); },
    get lantagare() { return lantagare.lista.map(l => ({ id: l.id, x: l.x, z: l.z })); },
    /** Ett steg i bokjakten utan att rita, for proven. */
    steg: (dt = 1 / 60) => stegaBokjakt(dt, performance.now() / 1000),
    get iScenen() { return scen.children.includes(bokjakt.grupp); },
    get skyddad() { return performance.now() / 1000 < bokLager.skyddadTill; }
  },
  infopunkter: infopunkter.punkter.map(p => ({ id: p.id, x: p.x, z: p.z, rubrik: p.text.rubrik })),
  kollaInfo: () => kollaInfo(performance.now() / 1000),
  rita,
  /** Hur tung scenen ar: ritanrop, trianglar och antal bocker. */
  statistik() {
    rita();
    const i = renderare.info.render;
    return { ritanrop: i.calls, trianglar: i.triangles,
             bocker: varld.userData.antalBocker };
  }
};
document.body.dataset.klar = "1";
