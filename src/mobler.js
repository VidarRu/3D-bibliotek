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

/** En stol med rygg pa den sida som "rygg" anger, sa att den vander sig mot bordet. */
function stol(f, t) {
  const g = new THREE.Group();
  const sits = 0.45;
  const farg = mat(SITTFARGER(t)[sittIndex++ % 3]);
  const ben = mat(t.hylla);
  for (const [dx, dz] of [[0.05, 0.05], [f.bredd - 0.05, 0.05], [0.05, f.djup - 0.05], [f.bredd - 0.05, f.djup - 0.05]]) {
    g.add(cylinder(f.x + dx, f.z + dz, 0.02, sits - 0.04, 0, ben, 8));
  }
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, 0.05, sits - 0.05, farg, 0.03));
  const T = 0.05;
  const r = { norr: [f.x, f.z, f.bredd, T], syd: [f.x, f.z + f.djup - T, f.bredd, T],
              vast: [f.x, f.z, T, f.djup], ost: [f.x + f.bredd - T, f.z, T, f.djup] }[f.rygg || "syd"];
  g.add(rundLada(r[0], r[1], r[2], r[3], f.hojd - sits, sits, farg, 0.02));
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

/**
 * Studiebas: skrivplatser med ljuddampande skarmvaggar runt sig.
 * "antal" bas i rad langs den langa sidan och "rader" (1 eller 2) bredvid
 * varandra. Tva rader vander sig mot varandra over en skarm i mitten.
 * "bord" ar bordets djup tvars over; ar rektangeln bredare ryms stolarna
 * innanfor, och gavelskarmarna gar da ut over dem, som i ett gruppbas.
 */
function studiebas(f, t) {
  const g = new THREE.Group();
  const langsZ = f.djup >= f.bredd;
  const L = langsZ ? f.djup : f.bredd;
  const K = langsZ ? f.bredd : f.djup;
  // s gar langs den langa sidan, k tvars over.
  const lada = (s, k, ls, lk, h, y0, m, r) => langsZ
    ? rundLada(f.x + k, f.z + s, lk, ls, h, y0, m, r)
    : rundLada(f.x + s, f.z + k, ls, lk, h, y0, m, r);
  const ben = (s, k, h, m) => langsZ
    ? cylinder(f.x + k, f.z + s, 0.03, h, 0, m, 8)
    : cylinder(f.x + s, f.z + k, 0.03, h, 0, m, 8);

  const rader = f.rader || 1, antal = f.antal || 1;
  const bord = f.bord || K;
  const k0 = (K - bord) / 2;
  const BORDHOJD = 0.74, T = 0.05;
  const skiva = mat(t.bjork), vit = mat(t.hylla), filt = mat(t.ljudvagg);
  const plats = L / antal;
  const radDjup = bord / rader;

  // En skiva per plats, med ben vid den oppna kanten.
  for (let r = 0; r < rader; r++) {
    for (let i = 0; i < antal; i++) {
      const s = i * plats + T, ls = plats - 2 * T;
      const k = k0 + r * radDjup + (r === 1 ? T / 2 : 0.01);
      const lk = radDjup - T / 2 - 0.01;
      g.add(lada(s, k, ls, lk, 0.05, BORDHOJD - 0.05, skiva, 0.02));
      const ytter = r === 0 && rader === 2 ? k + 0.06 : k + lk - 0.06;
      if (rader === 2) {
        g.add(ben(s + 0.08, ytter, BORDHOJD - 0.05, vit));
        g.add(ben(s + ls - 0.08, ytter, BORDHOJD - 0.05, vit));
      } else {
        for (const kk of [k + 0.06, k + lk - 0.06]) {
          g.add(ben(s + 0.08, kk, BORDHOJD - 0.05, vit));
          g.add(ben(s + ls - 0.08, kk, BORDHOJD - 0.05, vit));
        }
      }
    }
  }

  // Skarmvaggar av filt med en tunn bjorklist overst. Gavlarna och
  // mellanvaggarna gar tvars over, mittskarmen langs mitten.
  const skarm = (s, k, ls, lk) => {
    g.add(lada(s, k, ls, lk, f.hojd - 0.03, 0, filt, 0.02));
    g.add(lada(s, k, ls, lk, 0.03, f.hojd - 0.03, skiva, 0.012));
  };
  for (let i = 0; i <= antal; i++) {
    const s = Math.min(Math.max(i * plats - T / 2, 0), L - T);
    // Mellan basen racker skarmen over bordet, gavlarna gar hela vagen.
    const yttre = i === 0 || i === antal;
    skarm(s, yttre ? 0 : k0, T, yttre ? K : bord);
  }
  if (rader === 2) skarm(T, K / 2 - T / 2, L - 2 * T, T);
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
 *
 * Ett trapplopp kan borja under golvet och sluta i ett vilplan, sa att
 * tva lopp tillsammans blir en trappa som svanger:
 *   fran      hur langt under golvet loppet borjar (0 = vid golvet)
 *   fall      hur mycket loppet sjunker
 *   vilplan   langd pa det plana partiet i den nedre anden
 *   racke     sidor med racke bara en bit, { syd: [fran, till] } i meter
 *             fran det nordvastra hornet, eller false for inget racke
 */
export const SCHAKTDJUP = 2.9;

function trappaNer(f, t) {
  const g = new THREE.Group();
  const mot = f.nerMot || "norr";
  const langsZ = mot === "norr" || mot === "syd";
  const langd = langsZ ? f.djup : f.bredd;
  const fran = f.fran ?? 0;
  const fall = f.fall ?? SCHAKTDJUP - 0.1 - fran;
  const vilplan = f.vilplan ?? 0;
  const antal = Math.max(3, Math.round(fall / 0.2));
  const steglangd = (langd - vilplan) / antal;
  // Bjorksteg, sa att trappan syns mot det grå golvet nar man tittar ner.
  const steg = mat(t.bjork);
  const kant = mat("#5b4130");

  // Rektangel "fram" meter fran den kant dar man kliver ner, "l" lang.
  const bit = (fram, l) =>
    mot === "vast" ? [f.x + f.bredd - fram - l, f.z, l, f.djup] :
    mot === "ost"  ? [f.x + fram, f.z, l, f.djup] :
    mot === "norr" ? [f.x, f.z + f.djup - fram - l, f.bredd, l] :
                     [f.x, f.z + fram, f.bredd, l];

  // Steg i fran ovansidan och nedat, och vilplanet sist.
  for (let i = 0; i < antal; i++) {
    const [x, z, b, d] = bit(i * steglangd, steglangd);
    const topp = -(fran + (fall * (i + 1)) / antal);
    g.add(rundLada(x, z, b, d, topp + SCHAKTDJUP, -SCHAKTDJUP, steg, 0.02));
    // Mork framkant pa varje steg, sa att stegen gar att skilja at.
    const [nx, nz, nb, nd] = bit(i * steglangd, 0.06);
    g.add(rundLada(nx, nz, nb, nd, 0.012, topp, kant, 0.004));
  }
  if (vilplan > 0) {
    const [x, z, b, d] = bit(langd - vilplan, vilplan);
    g.add(rundLada(x, z, b, d, SCHAKTDJUP - fran - fall, -SCHAKTDJUP, steg, 0.02));
  }

  // Gul-svart rand pa forsta steget, sa att kanten syns.
  if (fran === 0) {
    const tex = randTextur(t);
    const tvars = langsZ ? f.bredd : f.djup;
    tex.repeat.set(tvars / 0.5, 1);
    const rand = new THREE.Mesh(new THREE.PlaneGeometry(tvars - 0.04, 0.1),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    rand.rotation.x = -Math.PI / 2;
    if (!langsZ) rand.rotation.z = Math.PI / 2;
    const [x, z, b, d] = bit(0, 0.12);
    rand.position.set(x + b / 2, -fall / antal + 0.002, z + d / 2);
    g.add(rand);
  }

  // Kanterna: vaggar ner i schaktet och glasracke ovanfor golvet. Ingen
  // av delarna hamnar dar man kliver ner, och en kant kan vara kortad
  // dar trappan fortsatter i ett annat lopp.
  const T = 0.06;
  const motsatt = { norr: "syd", syd: "norr", ost: "vast", vast: "ost" };
  const kanter = [];
  for (const sida of ["norr", "syd", "vast", "ost"]) {
    if (sida === motsatt[mot]) continue;
    const del = f.racke?.[sida];
    if (del === false) continue;
    const langsSida = sida === "norr" || sida === "syd" ? f.bredd : f.djup;
    const [a, b] = del || [0, langsSida];
    kanter.push(
      sida === "norr" ? [f.x + a, f.z, b - a, T] :
      sida === "syd"  ? [f.x + a, f.z + f.djup - T, b - a, T] :
      sida === "vast" ? [f.x, f.z + a, T, b - a] :
                        [f.x + f.bredd - T, f.z + a, T, b - a]);
  }
  const vagg = mat(t.vaggKant);
  const glas = new THREE.MeshStandardMaterial({
    color: t.glas, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false });
  const bjork = mat(t.bjork);
  for (const [x, z, b, d] of kanter) {
    g.add(rundLada(x, z, b, d, SCHAKTDJUP, -SCHAKTDJUP, vagg, 0.01));
    const ruta = new THREE.Mesh(new THREE.BoxGeometry(b, 0.85, d), glas);
    ruta.position.set(x + b / 2, 0.45, z + d / 2);
    g.add(ruta);
    g.add(rundLada(x - 0.01, z - 0.01, b + 0.02, d + 0.02, 0.07, 0.9, bjork, 0.03));
  }
  g.add(rundLada(f.x, f.z, f.bredd, f.djup, 0.05, -SCHAKTDJUP - 0.05, mat("#6d6a66"), 0.01));
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

// ----------------------------------------------------------- kopiatorn

/** En stor kopiator med pappersfack, en lutad panel och ett lock overst. */
function kopiator(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    const ljus = mat("#e9e5de"), mork = mat("#8d8984");
    const kropp = f.hojd - 0.12;
    g.add(rundLadaMitt(0, 0, bredd * 0.56, djup, kropp, 0, ljus, 0.05));
    // Fyra pappersfack med morka handtag pa framsidan.
    for (let i = 0; i < 4; i++) {
      const y = 0.1 + i * 0.17;
      g.add(rundLadaMitt(0, -djup / 2 - 0.005, bredd * 0.52, 0.02, 0.13, y, mat("#f4f1ec"), 0.01));
      g.add(rundLadaMitt(0, -djup / 2 - 0.02, 0.18, 0.02, 0.03, y + 0.09, mork, 0.008));
    }
    // Locket och skannern overst, och en lutad panel med skarm.
    g.add(rundLadaMitt(0, 0.02, bredd * 0.56, djup - 0.06, 0.12, kropp, ljus, 0.03));
    const panel = new THREE.Group();
    panel.add(rundLadaMitt(0, 0, 0.36, 0.2, 0.04, 0, mork, 0.015));
    panel.add(rundLadaMitt(-0.06, 0, 0.16, 0.12, 0.01, 0.04, lysande(t.skarm, 0.7), 0.004));
    panel.position.set(bredd * 0.12, kropp + 0.08, -djup / 2 + 0.02);
    panel.rotation.x = 0.4;
    g.add(panel);
    // Utmatningsfacket pa sidan, med nagra ark.
    g.add(rundLadaMitt(bredd * 0.28 + 0.13, 0, 0.26, djup * 0.7, 0.03, kropp * 0.62, mork, 0.01));
    g.add(rundLadaMitt(bredd * 0.28 + 0.13, 0, 0.22, djup * 0.55, 0.02, kropp * 0.62 + 0.03,
                       mat("#fbfaf7"), 0.005));
    // Ett litet bord med papper bredvid.
    g.add(rundLadaMitt(-bredd / 2 + 0.15, 0, 0.28, djup * 0.9, 0.75, 0, mat(t.bjork), 0.04));
    g.add(rundLadaMitt(-bredd / 2 + 0.15, 0, 0.22, 0.3, 0.12, 0.75, mat("#fbfaf7"), 0.01));
    return g;
  });
}

// ------------------------------------------------------- varuautomater

/**
 * En hog varuautomat. sort "godis" har ett stort fonster med fargglada
 * paket i rader, sort "kaffe" har en lysande panel och en kopphylla.
 */
function varuautomat(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    const godis = f.sort === "godis";
    const fram = -djup / 2;
    g.add(rundLadaMitt(0, 0, bredd, djup, f.hojd, 0, mat(godis ? t.rosa : t.automat), 0.06));
    if (godis) {
      // Glasruta med fyra rader paket, och knappsats till hoger.
      const b = bredd * 0.62, x0 = -bredd * 0.12;
      g.add(rundLadaMitt(x0, fram - 0.005, b, 0.02, 1.0, 0.6, mat("#3b2f27"), 0.02));
      const farger = [t.senap, t.mint, "#e6dccb", t.bjork, "#7a3b33"];
      const slp = slump(f.id);
      for (let rad = 0; rad < 4; rad++) {
        for (let i = 0; i < 5; i++) {
          g.add(rundLadaMitt(x0 - b / 2 + b * (i + 0.5) / 5, fram - 0.02, b / 5 - 0.04, 0.03,
                             0.15, 0.68 + rad * 0.23,
                             mat(farger[Math.floor(slp() * farger.length)]), 0.01));
        }
      }
      g.add(rundLadaMitt(x0, fram - 0.012, b, 0.012, 1.0, 0.6, new THREE.MeshStandardMaterial({
        color: t.glas, transparent: true, opacity: 0.25, roughness: 0.1, depthWrite: false }), 0.01));
      g.add(rundLadaMitt(bredd * 0.36, fram - 0.01, bredd * 0.16, 0.02, 0.4, 1.0,
                         lysande(t.skarm, 0.5), 0.01));
      g.add(rundLadaMitt(x0, fram - 0.01, b, 0.03, 0.16, 0.3, mat("#3b2f27"), 0.02));
    } else {
      // Lysande panel med bild pa en kopp, knappar och en nisch for koppen.
      g.add(rundLadaMitt(0, fram - 0.005, bredd * 0.8, 0.02, 0.6, 1.0, lysande(t.bjork, 0.45), 0.02));
      g.add(cylinder(0, fram - 0.02, 0.1, 0.16, 1.2, mat("#fbf6ee"), 16));
      for (let i = 0; i < 3; i++) {
        g.add(rundLadaMitt(-0.2 + i * 0.2, fram - 0.01, 0.12, 0.02, 0.06, 0.85,
                           mat([t.senap, t.mint, t.rosa][i]), 0.01));
      }
      g.add(rundLadaMitt(0, fram + 0.08, 0.32, 0.18, 0.32, 0.4, mat("#1b1a19"), 0.02));
      g.add(cylinder(0, fram + 0.04, 0.04, 0.09, 0.42, mat("#fbf6ee"), 12));
      // Vattenkranen bredvid.
      g.add(rundLadaMitt(bredd * 0.3, fram - 0.01, 0.12, 0.04, 0.18, 0.55, mat(t.glas), 0.02));
    }
    return g;
  });
}

// ---------------------------------------------------------- nodutgang

let nodMaterial = null;
/** Den gronna nodutgangsskylten: en springande figur mot en dorr. */
function nodSkylt() {
  if (!nodMaterial) {
    const duk = document.createElement("canvas");
    duk.width = 256; duk.height = 104;
    const c = duk.getContext("2d");
    c.fillStyle = "#1f8a4c";
    c.beginPath();
    c.roundRect(0, 0, 256, 104, 12);
    c.fill();
    c.strokeStyle = c.fillStyle = "#ffffff";
    c.lineCap = "round";
    c.lineWidth = 11;
    // Dorren till hoger och figuren som springer mot den.
    c.strokeRect(176, 18, 52, 70);
    c.beginPath(); c.arc(124, 26, 10, 0, Math.PI * 2); c.fill();
    c.beginPath();
    c.moveTo(120, 40); c.lineTo(108, 66);
    c.moveTo(108, 66); c.lineTo(128, 86);
    c.moveTo(108, 66); c.lineTo(86, 84);
    c.moveTo(118, 44); c.lineTo(142, 58);
    c.moveTo(118, 44); c.lineTo(96, 50);
    c.stroke();
    // En pil framfor figuren.
    c.beginPath();
    c.moveTo(24, 52); c.lineTo(70, 52);
    c.moveTo(56, 38); c.lineTo(72, 52); c.lineTo(56, 66);
    c.stroke();
    const tex = new THREE.CanvasTexture(duk);
    tex.colorSpace = THREE.SRGBColorSpace;
    nodMaterial = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55, roughness: 0.5 });
  }
  return nodMaterial;
}

/**
 * En nodutgang i ytterväggen: en dorr med tryckstang, vagg ovanfor och
 * en liten gron skylt. riktning ar sidan som vetter in mot rummet.
 */
function nodutgang(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    const dorrHojd = f.hojd;
    g.add(rundLadaMitt(0, 0, bredd, djup, 3.2 - dorrHojd, dorrHojd, mat(t.vagg), 0.04));
    g.add(rundLadaMitt(0, 0, bredd, djup * 0.5, dorrHojd, 0, mat("#e3ddd4"), 0.03));
    // Karm och tryckstang pa insidan.
    for (const dx of [-bredd / 2 + 0.04, bredd / 2 - 0.04]) {
      g.add(rundLadaMitt(dx, 0, 0.08, djup, dorrHojd, 0, mat(t.karm), 0.02));
    }
    g.add(rundLadaMitt(0, -djup * 0.25 - 0.05, bredd * 0.7, 0.05, 0.05, 1.0, mat("#9b9690"), 0.02));
    const skylt = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.17), nodSkylt());
    // Planet vetter mot syd fran borjan, vand det mot norr (in mot rummet).
    skylt.rotation.y = Math.PI;
    skylt.position.set(0, dorrHojd + 0.2, -djup / 2 - 0.025);
    g.add(skylt);
    g.add(rundLadaMitt(0, -djup / 2 - 0.01, 0.46, 0.02, 0.21, dorrHojd + 0.095, mat("#f7f1e6"), 0.01));
    return g;
  });
}

// -------------------------------------------------------------- pentry

/** En pentrybank: vita skap, bjorkskiva, diskho med kran och en vattenkokare. */
function pentry(f, t) {
  return placera(f, (bredd, djup) => {
    const g = new THREE.Group();
    g.add(rundLadaMitt(0, 0, bredd - 0.04, djup - 0.04, f.hojd - 0.05, 0, mat(t.hylla), 0.04));
    g.add(rundLadaMitt(0, 0, bredd, djup, 0.05, f.hojd - 0.05, mat(t.bjork), 0.02));
    const luckor = Math.max(2, Math.round(bredd / 0.6));
    for (let i = 0; i < luckor; i++) {
      const x = -bredd / 2 + bredd * (i + 0.5) / luckor;
      g.add(rundLadaMitt(x, -djup / 2 + 0.01, bredd / luckor - 0.05, 0.02, f.hojd - 0.2, 0.08,
                         mat("#f1ebe1"), 0.01));
      g.add(rundLadaMitt(x, -djup / 2 - 0.02, 0.12, 0.03, 0.03, f.hojd - 0.22, mat(t.senap), 0.012));
    }
    // Diskhon ar en grund, gra fordjupning i skivan, med kran bakom.
    g.add(rundLadaMitt(bredd * 0.2, 0, 0.5, 0.36, 0.02, f.hojd, mat("#b9b6b1"), 0.03));
    g.add(cylinder(bredd * 0.2, djup / 2 - 0.1, 0.02, 0.26, f.hojd, mat("#c9c6c1"), 10));
    g.add(rundLadaMitt(bredd * 0.2, djup / 2 - 0.16, 0.04, 0.14, 0.03, f.hojd + 0.24, mat("#c9c6c1"), 0.012));
    g.add(cylinder(-bredd * 0.25, 0, 0.09, 0.22, f.hojd, mat(t.mint), 16));
    return g;
  });
}

// ----------------------------------------------------------- sittrappa

/**
 * En sittrappa med "steg" breda trappsteg som stiger mot "hogMot".
 * Varje steg har en dyna i nagon av bibliotekets farger.
 */
function sittrappa(f, t) {
  const g = new THREE.Group();
  const n = f.steg || 3;
  const sida = f.hogMot || "ost";
  const langsX = sida === "ost" || sida === "vast";
  const L = langsX ? f.bredd : f.djup;
  const s = L / n, h = f.hojd / n;
  const dynor = [t.senap, t.mint, t.rosa];
  for (let i = 0; i < n; i++) {
    // Steg i borjar i fran den laga sidan och gar anda till den hoga.
    const fran = sida === "ost" || sida === "syd" ? i * s : 0;
    const langd = L - i * s;
    const [x, z, b, d] = langsX ? [f.x + fran, f.z, langd, f.djup] : [f.x, f.z + fran, f.bredd, langd];
    g.add(rundLada(x, z, b, d, h, i * h, mat(t.bjork), 0.03));
    // Dynan ligger pa stegets synliga del.
    const synlig = sida === "ost" || sida === "syd" ? 0 : langd - s;
    const [dx, dz, db, dd] = langsX ? [x + synlig + 0.04, z + 0.06, s - 0.08, d - 0.12]
                                    : [x + 0.06, z + synlig + 0.04, b - 0.12, s - 0.08];
    g.add(rundLada(dx, dz, db, dd, 0.06, (i + 1) * h, mat(dynor[i % 3]), 0.03));
  }
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
    case "stol": return stol(f, t);
    case "studiebas": return studiebas(f, t);
    case "scen": return scen(f, t);
    case "trappa": return trappa(f, t);
    case "hiss": return hiss(f, t);
    case "skap": return skap(f, t);
    case "pall": return pall(f, t);
    case "tv": return tv(f, t);
    case "tavla": return tavla(f, t);
    case "pelare": return pelare(f, t);
    case "kopiator": return kopiator(f, t);
    case "varuautomat": return varuautomat(f, t);
    case "nodutgang": return nodutgang(f, t);
    case "pentry": return pentry(f, t);
    case "sittrappa": return sittrappa(f, t);
    default: return rundLada(f.x, f.z, f.bredd, f.djup, f.hojd, 0, mat(t.hylla), 0.06);
  }
}
