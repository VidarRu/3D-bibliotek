// Leksaksbiblioteket.
//
// All geometri kommer ur kartfilerna i src/data/ (en per vaning) och
// alla texter ur src/config/content.js. Andras de foljer varlden med,
// utan att nagon annan kod behover roras.

import * as THREE from "three";
import { byggVarld, byggLjus, VAGGHOJD } from "./varld.js";
import { byggFigur, stegaFigur, animeraFigur, FIGUR_HOJD } from "./figur.js";
import { skapaHinder, arFri, flytta, FIGUR_RADIE } from "./kollision.js";
import { VYER } from "./vyer.js";
import { PLATSER, SIDA, TEMA, INFOPUNKTER, MINISPEL, BOKJAKT } from "./config/content.js";
import { sammanfogaPlatser, byggZoner, iZon } from "./zoner.js";
import { byggRutnat, hittaVag, byggPrickar, vaglangd } from "./vagvisning.js";
import { byggPanel, meddela, doljMeddelande, fyllI, visaInfokort,
         byggForlopp, visaGrattis, ersatt, byggBokjaktRad } from "./panel.js";
import { byggInfopunkter } from "./infopunkter.js";
import { skapaMinispel } from "./minispel.js";
import { byggKonfetti } from "./konfetti.js";
import { byggBokjakt } from "./bokjakt.js";
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
  panel.markera(id);
  meddelaVag(plats);
  return vagvisning.vag;
}

function slutaVisa() {
  if (!vagvisning.mal) return;
  vagvisning.mal = null;
  vagvisning.vag = null;
  vagvisning.andraLangd = null;
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
    V.zoner.hoppa(plats.id, tid);
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
  sluta: slutaVisa,
  valjVaning: plan => {
    bytVaning(plan, "huvudtrappan");
    duk.focus({ preventScroll: true });
  }
}, info);
panel.visaVaning(V.plan);

// ------------------------------------------------------------ infopunkter

let infoOppen = null;      // kortet som visas just nu
let infoAvstangd = null;   // stangt med Esc, oppnas inte igen forran man gatt av

function oppnaInfo(id, tid = performance.now() / 1000) {
  infoOppen = id;
  for (const v of vaningar) v.infopunkter.markera(id, tid);
  visaInfokort(id ? info.find(i => i.id === id) : null, stangInfo);
}

function stangInfo() {
  if (!infoOppen) return;
  infoAvstangd = infoOppen;
  oppnaInfo(null);
}

function kollaInfo(tid) {
  const id = V.infopunkter.vid(tillstand.x, tillstand.z, infoOppen || infoAvstangd);
  if (infoAvstangd && id !== infoAvstangd) infoAvstangd = null;
  const visa = id && id !== infoAvstangd ? id : null;
  if (visa !== infoOppen) oppnaInfo(visa, tid);
}

// ------------------------------------------------------------- minispelet
//
// Forsta gangen figuren gar in i en zon gor skylten ett glatt hopp. For
// avdelningarna raknas det dessutom i minispelet, med konfetti och en
// grattishalsning nar alla ar funna. Avdelningarna pa bada vaningarna
// raknas i samma spel.

const lugnt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const konfetti = byggKonfetti();
scen.add(konfetti.nat);
const forlopp = byggForlopp(platser.filter(p => p.avdelning));
let stangGrattis = null;
let nu = 0;                            // tiden i sekunder, for skylthoppen
let nyssHittad = null;                 // avdelningen som hittades i den har bildrutan

const minispel = skapaMinispel(platser, {
  narBesok: p => vaningFor(p.plan).zoner.hoppa(p.id, nu),
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
minispel.borja(tillstand.x, tillstand.z, V.plan);

function kollaZoner(tid) {
  nu = tid;
  nyssHittad = null;
  minispel.kolla(tillstand.x, tillstand.z, V.plan);
}

function nollstall() {
  minispel.nollstall(tillstand.x, tillstand.z, V.plan);
  forlopp.uppdatera([]);
  panel.markeraFunna([]);
}

// ---------------------------------------------------------------- bokjakt
//
// Ett eget lager ovanpa resten: bocker att samla och lantagare att
// undvika. Ar det avstangt finns det inte i scenen och ingen av dess kod
// kors, sa det kan aldrig stora orienteringen eller minispelet. Varje
// vaning har sina egna bocker och lantagare, men poangen ar gemensam.

const SKYDDAD = 1.5;                   // sekunder utan nya krockar efter en krock
const bokLager = { pa: false, skyddadTill: 0, lugnTill: 0, allaVar: false };

const bokRad = byggBokjaktRad(BOKJAKT, () => {
  slaPaBokjakt(!bokLager.pa);
});

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
  if (!pa) figur.visible = true;
  bokLager.allaVar = false;
  bokRad.uppdatera(pa, delad);
}
slaPaBokjakt(BOKJAKT.paFranStart);

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

  if (bokjakt.plocka(tillstand.x, tillstand.z, tid)) {
    bokRad.uppdatera(true, delad);
    bokRad.studsa();
  }

  const alla = bokjakt.allaPlockade();
  if (alla && !bokLager.allaVar) meddela(BOKJAKT.allaSamlade, 3.5, BOKJAKT.allaUnder);
  bokLager.allaVar = alla;

  // Krock med en lantagare: tappa bocker, knuffas och blinka en stund.
  const l = tid > bokLager.skyddadTill && tid > bokLager.lugnTill &&
    lantagare.krock(tillstand.x, tillstand.z);
  if (l) {
    const tappade = bokjakt.tappa(tillstand.x, tillstand.z, BOKJAKT.tappVidKrock, tid);
    knuffa(l.x, l.z, 0.9);
    bokLager.skyddadTill = tid + SKYDDAD;
    meddela(tappade ? ersatt(BOKJAKT.krock, { antal: tappade }) : BOKJAKT.krockUtan, 2.2);
    bokRad.uppdatera(true, delad);
    bokRad.studsa();
  }
  figur.visible = tid > bokLager.skyddadTill || Math.floor(tid * 10) % 2 === 0;
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
  const f = fb.find(o => o.id === viaId) || fb.find(o => o.id === "huvudtrappan") || fb[0];
  const a = f ? f.ankomst : V.layout.start;
  tillstand.x = a.x;
  tillstand.z = a.z;
  tillstand.riktning = (a.riktning * Math.PI) / 180;
  tillstand.gar = false;

  // Infokortet hor till den vaning man lamnade.
  infoAvstangd = null;
  if (infoOppen) oppnaInfo(null);
  // En lantagare som star vid trappan ska inte krocka med en gang.
  bokLager.lugnTill = performance.now() / 1000 + 1.0;
  bokLager.allaVar = V.bokjakt.allaPlockade();

  panel.visaVaning(V.plan);
  if (vagvisning.mal) {
    ritaVag();
    meddelaVag(platsMed(vagvisning.mal));
  } else {
    meddela(ersatt(SIDA.nuPaPlan, { plan: V.plan }), 2.5);
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
  V.zoner.animera(tid);
  prickar.animera(tid);
  V.infopunkter.animera(tid);
  V.plattor.animera(tid);
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
    stegaFigur(tillstand, tangenter, dt, V.layout, V.hinder);
    animeraFigur(figur, tillstand, dt, tangenter.spring);
    kollaZoner(tid);
    kollaInfo(tid);
    folj(tid);
    stegaBokjakt(dt, tid);
    kollaVaning();
  }
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
  get konfetti() { return konfetti.antal; },
  nollstall,
  kollaZoner: () => kollaZoner(performance.now() / 1000),
  bokjakt: {
    get pa() { return bokLager.pa; },
    satt: slaPaBokjakt,
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
  kollaInfo: () => kollaInfo(performance.now() / 1000),
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
