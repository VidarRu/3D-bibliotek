// Signaturmobler i leksaksstil.
//
// Varje mobel byggs inom sin rektangel i datafilen, sa att den syns dar
// kollisionen sager att den star. Formerna ar enkla och rundade, och
// fargerna kommer ur TEMA i src/config/content.js.

import * as THREE from "three";
import { mat, lysande, rundLada, rundLadaMitt, cylinder, slump } from "./former.js";

const mitt = f => ({ x: f.x + f.bredd / 2, z: f.z + f.djup / 2 });

// Vridning runt lodlinjen sa att en framsida byggd mot norr vetter at
// det hall som "riktning" i datafilen anger.
const VRIDNING = { norr: 0, syd: Math.PI, ost: -Math.PI / 2, vast: Math.PI / 2 };

/**
 * Lagger en mobel som ar byggd kring origo, med framsidan mot norr, pa
 * sin plats och vrider den. Bredd ar alltid den langa sidan.
 */
function placera(f, bygg) {
  const lang = Math.max(f.bredd, f.djup), kort = Math.min(f.bredd, f.djup);
  const inre = bygg(lang, kort);
  const m = mitt(f);
  inre.position.set(m.x, 0, m.z);
  inre.rotation.y = VRIDNING[f.riktning || "norr"];
  return inre;
}

// ------------------------------------------------------------- disken

function disk(f, t) {
  const g = new THREE.Group();
  const m = mitt(f);
  // Vit stomme, en bjorkskiva som sticker ut lite och en liten skarm.
  g.add(rundLada(f.x + 0.05, f.z + 0.05, f.bredd - 0.1, f.djup - 0.1, f.hojd - 0.06, 0,
                 mat(t.hylla), 0.06));
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, 0.07, f.hojd - 0.07, mat(t.bjork), 0.03));
  for (const dx of [-0.55, 0.55]) {
    g.add(rundLadaMitt(m.x + dx, m.z + 0.05, 0.5, 0.05, 0.34, f.hojd + 0.12, mat(t.automat), 0.02));
    g.add(rundLadaMitt(m.x + dx, m.z + 0.02, 0.44, 0.01, 0.28, f.hojd + 0.15, lysande(t.skarm, 0.6), 0.004));
    g.add(cylinder(m.x + dx, m.z + 0.08, 0.025, 0.14, f.hojd, mat(t.automat), 8));
  }
  return g;
}

/** Informationsdisken pa plan 1: en mindre disk med en enda skarm. */
function infodisk(f, t) {
  const g = new THREE.Group();
  const m = mitt(f);
  g.add(rundLada(f.x + 0.05, f.z + 0.05, f.bredd - 0.1, f.djup - 0.1, f.hojd - 0.06, 0,
                 mat(t.hylla), 0.06));
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, 0.07, f.hojd - 0.07, mat(t.bjork), 0.03));
  // En senapsgul rand runt disken, sa att den syns pa avstand.
  g.add(rundLada(f.x + 0.04, f.z + 0.04, f.bredd - 0.08, f.djup - 0.08, 0.12, f.hojd - 0.3,
                 mat(t.senap), 0.04));
  g.add(rundLadaMitt(m.x, m.z, 0.5, 0.05, 0.34, f.hojd + 0.12, mat(t.automat), 0.02));
  g.add(rundLadaMitt(m.x, m.z + 0.03, 0.44, 0.01, 0.28, f.hojd + 0.15, lysande(t.skarm, 0.6), 0.004));
  g.add(cylinder(m.x, m.z - 0.04, 0.025, 0.14, f.hojd, mat(t.automat), 8));
  return g;
}

/**
 * Ett datorbord med skarmar rygg mot rygg langs mitten, sa att man
 * sitter pa bada langsidorna.
 */
function datorbord(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    g.add(rundLadaMitt(0, 0, bredd, djup, 0.06, f.hojd - 0.06, mat(t.bjork), 0.03));
    const ben = mat(t.hylla);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.add(cylinder(dx * (bredd / 2 - 0.1), dz * (djup / 2 - 0.1), 0.04, f.hojd - 0.06, 0, ben, 10));
    }
    const svart = mat(t.automat);
    const antal = Math.max(1, Math.floor(bredd / 1.1));
    for (let i = 0; i < antal; i++) {
      const x = -bredd / 2 + bredd * (i + 0.5) / antal;
      for (const sida of [-1, 1]) {
        const z = sida * 0.1;
        g.add(cylinder(x, z, 0.025, 0.14, f.hojd, svart, 8));
        g.add(rundLadaMitt(x, z, 0.56, 0.05, 0.36, f.hojd + 0.12, svart, 0.02));
        g.add(rundLadaMitt(x, z + sida * 0.03, 0.5, 0.01, 0.3, f.hojd + 0.15,
                           lysande(t.skarm, 0.6), 0.004));
        // Tangentbord framfor skarmen.
        g.add(rundLadaMitt(x, sida * 0.38, 0.42, 0.14, 0.025, f.hojd, mat(t.hylla), 0.01));
      }
    }
    return g;
  });
}

// ------------------------------------------------------------ automaten

function automat(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    const svart = mat(t.automat);
    // Fotplatta, pelare och en snett stalld skarm. Skarmen vetter at
    // det hall som riktning anger, annars mot norr.
    g.add(rundLadaMitt(0, 0, bredd * 0.7, djup, 0.05, 0, svart, 0.02));
    g.add(rundLadaMitt(0, 0.08, 0.26, 0.22, f.hojd - 0.15, 0, svart, 0.08));
    const huvud = new THREE.Group();
    huvud.add(rundLadaMitt(0, 0, bredd * 0.8, 0.1, 0.5, -0.25, mat(t.hylla), 0.04));
    huvud.add(rundLadaMitt(0, -0.052, bredd * 0.66, 0.01, 0.38, -0.19, lysande(t.skarm, 0.85), 0.004));
    huvud.position.set(0, f.hojd, -0.02);
    huvud.rotation.x = 0.35;
    g.add(huvud);
    return g;
  });
}

// ------------------------------------------------------------- labbet

/** Ett lagt vitt skap med bjorklock och tva luckor med runda knoppar. */
function skap(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    g.add(rundLadaMitt(0, 0, bredd - 0.04, djup - 0.04, f.hojd - 0.05, 0, mat(t.hylla), 0.05));
    g.add(rundLadaMitt(0, 0, bredd, djup, 0.05, f.hojd - 0.05, mat(t.bjork), 0.02));
    for (const dx of [-bredd / 4, bredd / 4]) {
      g.add(rundLadaMitt(dx, -djup / 2 + 0.01, bredd / 2 - 0.08, 0.02, f.hojd - 0.2, 0.08,
                         mat("#f1ebe1"), 0.01));
      g.add(rundLadaMitt(dx + (dx < 0 ? 0.18 : -0.18), -djup / 2 - 0.02, 0.06, 0.04, 0.06,
                         f.hojd * 0.6, mat(t.senap), 0.025));
    }
    return g;
  });
}

let pallIndex = 0;

/** En rund pall i nagon av bibliotekets farger. */
function pall(f, t) {
  const g = new THREE.Group();
  const m = mitt(f);
  const r = Math.min(f.bredd, f.djup) / 2;
  const farg = [t.senap, t.mint, t.rosa][pallIndex++ % 3];
  g.add(cylinder(m.x, m.z, r * 0.95, f.hojd - 0.08, 0, mat(t.bjork), 16));
  g.add(cylinder(m.x, m.z, r, 0.1, f.hojd - 0.1, mat(farg), 20));
  return g;
}

/** Tv-bank med en stor tv, en spelkonsol och tva handkontroller. */
function tv(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    g.add(rundLadaMitt(0, 0, bredd, djup, f.hojd, 0, mat(t.bjork), 0.05));
    // Skarmen star pa en liten fot och vetter framat.
    const svart = mat(t.automat);
    g.add(rundLadaMitt(0, 0.05, 0.3, 0.16, 0.08, f.hojd, svart, 0.03));
    g.add(rundLadaMitt(0, 0.08, 0.08, 0.05, 0.14, f.hojd + 0.06, svart, 0.02));
    g.add(rundLadaMitt(0, 0.06, 1.5, 0.07, 0.86, f.hojd + 0.18, svart, 0.04));
    g.add(rundLadaMitt(0, 0.02, 1.38, 0.01, 0.74, f.hojd + 0.24, lysande(t.tv, 0.6), 0.006));
    // Konsolen och tva handkontroller.
    g.add(rundLadaMitt(0.62, -0.06, 0.3, 0.2, 0.06, f.hojd, mat(t.hylla), 0.02));
    for (const [dx, farg] of [[-0.75, t.rosa], [-0.45, t.mint]]) {
      g.add(rundLadaMitt(dx, -0.12, 0.16, 0.1, 0.04, f.hojd, mat(farg), 0.018));
    }
    return g;
  });
}

// ----------------------------------------------------- soffa och fatolj

const SITTFARGER = t => [t.senap, t.mint, t.rosa];

/**
 * Ryggen hamnar pa den sida som vetter bort fran gruppen, sa att soffor
 * och fatoljer runt ett bord vander sig mot varandra.
 */
function ryggsida(f, alla) {
  // En ensam fatolj vid en vagg far sin rygg angiven i datafilen.
  if (f.rygg) return f.rygg;
  const m = mitt(f);
  const grannar = alla.filter(o => ["soffa", "fatolj", "bord"].includes(o.typ) &&
    Math.hypot(mitt(o).x - m.x, mitt(o).z - m.z) < 3.5);
  const c = grannar.reduce((s, o) => ({ x: s.x + mitt(o).x, z: s.z + mitt(o).z }), { x: 0, z: 0 });
  c.x /= grannar.length; c.z /= grannar.length;
  const dx = m.x - c.x, dz = m.z - c.z;
  if (f.bredd >= f.djup * 1.4) return dz < 0 ? "norr" : "syd";
  if (f.djup >= f.bredd * 1.4) return dx < 0 ? "vast" : "ost";
  return Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? "vast" : "ost") : (dz < 0 ? "norr" : "syd");
}

function sittmobel(f, t, alla, index) {
  const g = new THREE.Group();
  const farg = mat(SITTFARGER(t)[index % 3]);
  const sits = 0.42;
  const rygg = 0.2;
  const arm = 0.14;
  const sida = ryggsida(f, alla);

  g.add(rundLada(f.x, f.z, f.bredd, f.djup, sits, 0, farg, 0.12));

  // Rygg och armstod som rundade kuddar.
  const r = { norr: [f.x, f.z, f.bredd, rygg], syd: [f.x, f.z + f.djup - rygg, f.bredd, rygg],
              vast: [f.x, f.z, rygg, f.djup], ost: [f.x + f.bredd - rygg, f.z, rygg, f.djup] }[sida];
  g.add(rundLada(r[0], r[1], r[2], r[3], f.hojd, 0, farg, 0.1));
  const langsX = sida === "norr" || sida === "syd";
  if (langsX) {
    g.add(rundLada(f.x, f.z, arm, f.djup, sits + 0.16, 0, farg, 0.07));
    g.add(rundLada(f.x + f.bredd - arm, f.z, arm, f.djup, sits + 0.16, 0, farg, 0.07));
  } else {
    g.add(rundLada(f.x, f.z, f.bredd, arm, sits + 0.16, 0, farg, 0.07));
    g.add(rundLada(f.x, f.z + f.djup - arm, f.bredd, arm, sits + 0.16, 0, farg, 0.07));
  }
  return g;
}

function bord(f, t) {
  const g = new THREE.Group();
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, 0.06, f.hojd - 0.06, mat(t.bjork), 0.03));
  const ben = mat(t.hylla);
  for (const [dx, dz] of [[0.1, 0.1], [f.bredd - 0.1, 0.1], [0.1, f.djup - 0.1], [f.bredd - 0.1, f.djup - 0.1]]) {
    g.add(cylinder(f.x + dx, f.z + dz, 0.04, f.hojd - 0.06, 0, ben, 10));
  }
  return g;
}

// ------------------------------------------------------------ scenen

function scen(f, t) {
  const g = new THREE.Group();
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, f.hojd, 0, mat(t.bjork), 0.08));
  // Fondvagg mot norra vaggen, i det bla scenljuset fran fotot.
  g.add(rundLada(f.x, f.z - 0.3, f.bredd, 0.08, 2.6, f.hojd,
                 mat(t.scenFond, { emissive: t.scenFond, emissiveIntensity: 0.25 }), 0.03));
  return g;
}

// ------------------------------------------------------------ trappor

function randTextur(t) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 16;
  const x = c.getContext("2d");
  x.fillStyle = "#222";
  x.fillRect(0, 0, 128, 16);
  x.fillStyle = t.senap;
  for (let i = -16; i < 128; i += 16) {
    x.beginPath();
    x.moveTo(i, 16); x.lineTo(i + 8, 16); x.lineTo(i + 16, 0); x.lineTo(i + 8, 0);
    x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function trappa(f, t) {
  if (f.ner) return trappaNer(f, t);
  const g = new THREE.Group();
  const antal = 14;
  const langsZ = f.djup >= f.bredd;
  const steglangd = (langsZ ? f.djup : f.bredd) / antal;
  const steg = mat("#8f8b86");

  // Stiger mot norr respektive mot vaster, bort fran rummet.
  for (let i = 0; i < antal; i++) {
    const h = (f.hojd * (i + 1)) / antal;
    const fram = (antal - 1 - i) * steglangd;
    g.add(langsZ
      ? rundLada(f.x, f.z + fram, f.bredd, steglangd, h, 0, steg, 0.02)
      : rundLada(f.x + fram, f.z, steglangd, f.djup, h, 0, steg, 0.02));
  }

  // Gul-svart rand pa forsta steget.
  const tex = randTextur(t);
  tex.repeat.set((langsZ ? f.bredd : f.djup) / 0.5, 1);
  const rand = new THREE.Mesh(
    new THREE.PlaneGeometry(langsZ ? f.bredd - 0.04 : 0.1, langsZ ? 0.1 : f.djup - 0.04),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  rand.rotation.x = -Math.PI / 2;
  if (!langsZ) {
    // Randen loper langs z, sa monstret vrids ett kvarts varv.
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2;
  }
  const forsta = f.hojd / antal + 0.002;
  rand.position.set(langsZ ? f.x + f.bredd / 2 : f.x + f.bredd - 0.08,
                    forsta,
                    langsZ ? f.z + f.djup - 0.08 : f.z + f.djup / 2);
  rand.receiveShadow = true;
  g.add(rand);

  // Bjorkracken langs bada sidor, i trappans lutning.
  const lutLangd = Math.hypot(langsZ ? f.djup : f.bredd, f.hojd);
  const vinkel = Math.atan2(f.hojd, langsZ ? f.djup : f.bredd);
  for (const kant of [0.06, (langsZ ? f.bredd : f.djup) - 0.06]) {
    const racke = new THREE.Mesh(
      new THREE.BoxGeometry(langsZ ? 0.07 : lutLangd, 0.06, langsZ ? lutLangd : 0.07),
      mat(t.bjork));
    racke.castShadow = true;
    if (langsZ) {
      racke.position.set(f.x + kant, f.hojd / 2 + 0.9, f.z + f.djup / 2);
      racke.rotation.x = vinkel;
    } else {
      racke.position.set(f.x + f.bredd / 2, f.hojd / 2 + 0.9, f.z + kant);
      racke.rotation.z = -vinkel;
    }
    g.add(racke);
  }
  return g;
}

/**
 * En trappa som gar ner genom ett hal i golvet. Hålet tas upp av golvet
 * sjalvt (se varld.js). Har byggs stegen, schaktets vaggar och racken
 * med glas langs kanterna. f.nerMot sager at vilket hall trappan sjunker.
 */
export const SCHAKTDJUP = 2.9;

function trappaNer(f, t) {
  const g = new THREE.Group();
  const antal = 14;
  const mot = f.nerMot || "norr";
  const langsZ = mot === "norr" || mot === "syd";
  const langd = langsZ ? f.djup : f.bredd;
  const steglangd = langd / antal;
  const steg = mat("#8f8b86");
  const djup = SCHAKTDJUP - 0.1;

  // Steg i fran ovansidan och nedat. "fram" ar avstandet fran den kant
  // dar man kliver ner.
  for (let i = 0; i < antal; i++) {
    const topp = -(djup * (i + 1)) / antal;
    const fram = i * steglangd;
    const h = topp + SCHAKTDJUP;
    const [x, z, b, d] =
      mot === "vast" ? [f.x + f.bredd - fram - steglangd, f.z, steglangd, f.djup] :
      mot === "ost"  ? [f.x + fram, f.z, steglangd, f.djup] :
      mot === "norr" ? [f.x, f.z + f.djup - fram - steglangd, f.bredd, steglangd] :
                       [f.x, f.z + fram, f.bredd, steglangd];
    g.add(rundLada(x, z, b, d, h, -SCHAKTDJUP, steg, 0.02));
  }

  // Schaktets vaggar och botten, sa att man inte ser ut under huset.
  const vagg = mat(t.vaggKant);
  const T = 0.04;
  g.add(rundLada(f.x, f.z, f.bredd, T, SCHAKTDJUP, -SCHAKTDJUP, vagg, 0.01));
  g.add(rundLada(f.x, f.z + f.djup - T, f.bredd, T, SCHAKTDJUP, -SCHAKTDJUP, vagg, 0.01));
  g.add(rundLada(f.x, f.z, T, f.djup, SCHAKTDJUP, -SCHAKTDJUP, vagg, 0.01));
  g.add(rundLada(f.x + f.bredd - T, f.z, T, f.djup, SCHAKTDJUP, -SCHAKTDJUP, vagg, 0.01));
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, 0.05, -SCHAKTDJUP - 0.05, mat("#6d6a66"), 0.01));

  // Glasrack langs kanterna, utom dar man kliver ner.
  const glas = new THREE.MeshStandardMaterial({
    color: t.glas, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false });
  const bjork = mat(t.bjork);
  const kanter = {
    norr: [f.x, f.z, f.bredd, 0.06], syd: [f.x, f.z + f.djup - 0.06, f.bredd, 0.06],
    vast: [f.x, f.z, 0.06, f.djup], ost: [f.x + f.bredd - 0.06, f.z, 0.06, f.djup]
  };
  const motsatt = { norr: "syd", syd: "norr", ost: "vast", vast: "ost" };
  for (const [sida, [x, z, b, d]] of Object.entries(kanter)) {
    if (sida === motsatt[mot]) continue;
    const ruta = new THREE.Mesh(new THREE.BoxGeometry(b, 0.85, d), glas);
    ruta.position.set(x + b / 2, 0.45, z + d / 2);
    g.add(ruta);
    g.add(rundLada(x - 0.01, z - 0.01, b + 0.02, d + 0.02, 0.07, 0.9, bjork, 0.03));
  }
  return g;
}

// --------------------------------------------------------------- hissen

function hiss(f, t) {
  const g = new THREE.Group();
  const m = mitt(f);
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, f.hojd, 0, mat(t.morkgra), 0.05));
  // Dorrarna vetter at det hall som riktning anger, annars mot norr.
  const dorr = mat("#85817c", { roughness: 0.5 });
  const lampa = lysande(t.senap, 1.2);
  const sida = f.riktning || "norr";
  if (sida === "ost" || sida === "vast") {
    const x = sida === "ost" ? f.x + f.bredd + 0.01 : f.x - 0.01;
    for (const dz of [-0.31, 0.31]) {
      g.add(rundLadaMitt(x, m.z + 0.1 + dz, 0.04, 0.6, 2.1, 0, dorr, 0.015));
    }
    g.add(rundLadaMitt(x + (sida === "ost" ? 0.01 : -0.01), m.z + 0.1, 0.04, 0.16, 0.12, 2.2, lampa, 0.02));
  } else {
    const z = sida === "syd" ? f.z + f.djup + 0.01 : f.z - 0.01;
    for (const dx of [-0.31, 0.31]) {
      g.add(rundLadaMitt(m.x + dx, z, 0.6, 0.04, 2.1, 0, dorr, 0.015));
    }
    // Den lilla gula vaningslampan.
    g.add(rundLadaMitt(m.x - 0.75, z + (sida === "syd" ? 0.01 : -0.01), 0.16, 0.04, 0.12, 2.2, lampa, 0.02));
  }
  return g;
}

// --------------------------------------------------------------- tavlor

function tavla(f, t) {
  const g = new THREE.Group();
  const slp = slump(f.id);
  const c = document.createElement("canvas");
  c.width = 256; c.height = 184;
  const x = c.getContext("2d");
  const farger = [t.senap, t.mint, t.rosa, "#7a3b33", "#5b4130", "#fbf6ee"];
  x.fillStyle = farger[Math.floor(slp() * 3)];
  x.fillRect(0, 0, 256, 184);
  // Nagra enkla former, som barnteckningar.
  for (let i = 0; i < 5; i++) {
    x.fillStyle = farger[Math.floor(slp() * farger.length)];
    const r = 20 + slp() * 50;
    x.beginPath();
    if (slp() < 0.5) x.arc(slp() * 256, slp() * 184, r, 0, Math.PI * 2);
    else x.roundRect(slp() * 200, slp() * 130, r * 1.6, r, 14);
    x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const y0 = 1.15;
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, f.hojd, y0, mat(t.bjork), 0.03));
  // Tavlan hanger pa ostra vaggen och vetter mot vaster.
  const bild = new THREE.Mesh(new THREE.PlaneGeometry(f.djup - 0.14, f.hojd - 0.14),
                              new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  bild.rotation.y = -Math.PI / 2;
  bild.position.set(f.x - 0.002, y0 + f.hojd / 2, f.z + f.djup / 2);
  g.add(bild);
  return g;
}

// --------------------------------------------------------------- pelare

function pelare(f, t) {
  const g = new THREE.Group();
  const m = mitt(f);
  const r = Math.min(f.bredd, f.djup) / 2;
  const farg = f.farg === "laxrosa" ? t.laxrosa : t.vagg;
  g.add(cylinder(m.x, m.z, r, f.hojd, 0, mat(farg), 24));
  g.add(cylinder(m.x, m.z, r + 0.012, 0.16, 0, mat("#4a4744"), 24));
  return g;
}

// -------------------------------------------------------- pendellampor

let lampGeo = null;

/** En vit lampa med vagig kant, som hanger i en tunn sladd. */
export function pendellampa(x, z, t, hojd = 2.35) {
  if (!lampGeo) {
    // Profilen roteras runt mitten. Kupan ar rundad och vidgar sig nedat.
    const p = [];
    for (let i = 0; i <= 12; i++) {
      const a = i / 12;
      p.push(new THREE.Vector2(0.04 + Math.sin(a * Math.PI / 2) * 0.26, 0.3 - a * 0.3));
    }
    lampGeo = new THREE.LatheGeometry(p, 28);
  }
  const g = new THREE.Group();
  const kupa = new THREE.Mesh(lampGeo, mat(t.lampa, { side: THREE.DoubleSide, roughness: 0.5 }));
  kupa.castShadow = true;
  g.add(kupa);
  // Den vagiga kanten: en ring av sma kulor.
  const kulGeo = new THREE.SphereGeometry(0.045, 10, 8);
  for (let i = 0; i < 14; i++) {
    const v = (i / 14) * Math.PI * 2;
    const k = new THREE.Mesh(kulGeo, mat(t.lampa, { roughness: 0.5 }));
    k.position.set(Math.cos(v) * 0.29, 0, Math.sin(v) * 0.29);
    g.add(k);
  }
  // Det varma skenet underifran.
  const sken = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), lysande(t.lampSken, 1.6));
  sken.rotation.x = Math.PI / 2;
  sken.position.y = 0.02;
  g.add(sken);
  const sladd = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6), mat("#333"));
  sladd.position.y = 0.9;
  g.add(sladd);
  g.position.set(x, hojd, z);
  return g;
}

// ---------------------------------------------------------------- urval

let sittIndex = 0;

export function byggMobel(f, t, alla) {
  switch (f.typ) {
    case "disk": return disk(f, t);
    case "infodisk": return infodisk(f, t);
    case "datorbord": return datorbord(f, t);
    case "automat": return automat(f, t);
    case "soffa":
    case "fatolj": return sittmobel(f, t, alla, sittIndex++);
    case "bord": return bord(f, t);
    case "scen": return scen(f, t);
    case "trappa": return trappa(f, t);
    case "hiss": return hiss(f, t);
    case "skap": return skap(f, t);
    case "pall": return pall(f, t);
    case "tv": return tv(f, t);
    case "tavla": return tavla(f, t);
    case "pelare": return pelare(f, t);
    default: return rundLada(f.x, f.z, f.bredd, f.djup, f.hojd, 0, mat(t.hylla), 0.06);
  }
}
