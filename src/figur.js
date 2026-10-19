// Figuren som besokaren styr, och hur den ror sig.
//
// Styrningen ar den som passar en kamera snett bakifran: upp och ner gar
// framat och bakat, hoger och vanster vrider. Da slipper spelaren tanka
// pa vilket vaderstreck kameran rakar titta at.

import * as THREE from "three";
import { FIGUR_RADIE, flytta } from "./kollision.js";

export const GANGFART = 3.2;        // meter i sekunden
export const SPRINGFART = 5.4;
export const VRIDFART = 2.6;        // radianer i sekunden
export const FIGUR_HOJD = 1.55;

/**
 * En rund leksaksfigur: senapsgul troja, mintgrona byxor och ett runt
 * huvud med har. Benen och armarna sitter i egna leder, sa att de kan
 * svanga nar figuren gar.
 */
export function byggFigur(tema, farger = {}) {
  const grupp = new THREE.Group();
  grupp.name = "figur";
  const material = farg => new THREE.MeshStandardMaterial({ color: farg, roughness: 0.65 });
  const troja = material(farger.troja || tema.figurTroja);
  const byxor = material(farger.byxor || tema.figurByxor);
  const hud = material(farger.hud || tema.figurHud);
  const har = material(farger.har || tema.figurHar);
  const skor = material("#3a3330");

  // Kroppen guppar, sa allt utom skuggan sitter i en egen grupp.
  const kropp = new THREE.Group();
  grupp.add(kropp);

  const leder = {};
  for (const [namn, x] of [["vansterBen", -0.11], ["hogerBen", 0.11]]) {
    const led = new THREE.Group();
    led.position.set(x, 0.5, 0);
    const ben = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.28, 6, 12), byxor);
    ben.position.y = -0.22;
    const sko = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), skor);
    sko.scale.set(1, 0.6, 1.35);
    sko.position.set(0, -0.44, -0.04);
    led.add(ben, sko);
    kropp.add(led);
    leder[namn] = led;
  }

  const bal = new THREE.Mesh(new THREE.CapsuleGeometry(FIGUR_RADIE * 0.88, 0.28, 8, 16), troja);
  bal.position.y = 0.82;
  kropp.add(bal);

  for (const [namn, x] of [["vansterArm", -0.29], ["hogerArm", 0.29]]) {
    const led = new THREE.Group();
    led.position.set(x, 1.0, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.26, 6, 10), troja);
    arm.position.y = -0.18;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), hud);
    hand.position.y = -0.37;
    led.add(arm, hand);
    led.rotation.z = x < 0 ? -0.12 : 0.12;
    kropp.add(led);
    leder[namn] = led;
  }

  const huvud = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), hud);
  huvud.position.y = 1.32;
  kropp.add(huvud);
  // Haret: ett halvklot som ar vridet bakat, sa att det tacker nacken.
  const lugg = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), har);
  lugg.position.set(0, 1.335, 0.02);
  lugg.rotation.x = 0.6;
  kropp.add(lugg);

  // Ogon och en liten nasa, sa att man ser at vilket hall figuren tittar.
  const ogonMat = material("#2a2421");
  for (const x of [-0.075, 0.075]) {
    const oga = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), ogonMat);
    oga.position.set(x, 1.35, -0.205);
    kropp.add(oga);
  }
  const nasa = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), hud);
  nasa.position.set(0, 1.29, -0.225);
  kropp.add(nasa);

  kropp.traverse(del => {
    if (del.isMesh) { del.castShadow = true; del.receiveShadow = true; }
  });

  grupp.userData = { kropp, leder, fas: 0, gang: 0, material: { troja, byxor, hud, har } };
  return grupp;
}

/** Gungar figuren nar den gar, och later den sta still annars. */
export function animeraFigur(figur, tillstand, dt, springer) {
  const d = figur.userData;
  // Mjuk overgang mellan att sta och att ga.
  const mal = tillstand.gar ? 1 : 0;
  d.gang += (mal - d.gang) * Math.min(1, dt * 10);
  d.fas += dt * (springer ? 15 : 10.5) * (tillstand.gar ? 1 : 0.3);

  const sving = Math.sin(d.fas) * 0.6 * d.gang;
  d.leder.vansterBen.rotation.x = sving;
  d.leder.hogerBen.rotation.x = -sving;
  d.leder.vansterArm.rotation.x = -sving * 0.8;
  d.leder.hogerArm.rotation.x = sving * 0.8;
  d.kropp.position.y = Math.abs(Math.sin(d.fas)) * 0.06 * d.gang;
  d.kropp.rotation.z = Math.sin(d.fas) * 0.04 * d.gang;
}

/**
 * Figuren firar att den ar framme: tva glada hopp med armarna i luften,
 * och sedan vinkar den med hogerarmen. t ar sekunder sedan firandet
 * borjade. Med t < 0 star figuren som vanligt igen.
 */
export function animeraFirande(figur, t) {
  const d = figur.userData;
  if (t < 0) {
    d.leder.vansterArm.rotation.z = -0.12;
    d.leder.hogerArm.rotation.z = 0.12;
    d.kropp.position.y = 0;
    d.kropp.rotation.z = 0;
    return;
  }
  // Armarna lyfts mjukt under den forsta kvarts sekunden.
  const upp = Math.min(1, t / 0.25);
  const hopp = t < 1.3 ? Math.max(0, Math.sin(t * Math.PI / 0.65)) : 0;
  d.kropp.position.y = hopp * 0.32;
  d.kropp.rotation.z = 0;
  for (const namn of ["vansterBen", "hogerBen"]) d.leder[namn].rotation.x = -hopp * 0.35;
  d.leder.vansterArm.rotation.x = 0;
  d.leder.hogerArm.rotation.x = 0;
  // Efter hoppen vinkar hogerarmen, och vansterarmen sjunker ner.
  const vinka = t > 1.3 ? Math.sin((t - 1.3) * 9) * 0.35 : 0;
  const ner = t > 1.3 ? Math.min(1, (t - 1.3) / 0.4) : 0;
  d.leder.hogerArm.rotation.z = 0.12 + upp * 2.5 + vinka;
  d.leder.vansterArm.rotation.z = -0.12 - upp * 2.5 * (1 - ner);
}

/**
 * Flyttar figuren ett tidssteg.
 * riktning ar radianer medurs fran norr, samma som i datafilen.
 */
export function stegaFigur(tillstand, tangenter, dt, layout, hinder) {
  // Riktningen raknas medurs, sa hoger okar den och vanster minskar den.
  const vrid = (tangenter.hoger ? 1 : 0) - (tangenter.vanster ? 1 : 0);
  tillstand.riktning += vrid * VRIDFART * dt;

  const framat = (tangenter.fram ? 1 : 0) - (tangenter.bak ? 1 : 0);
  const fart = tangenter.spring ? SPRINGFART : GANGFART;
  const langd = framat * fart * dt;

  // Riktning 0 pekar mot norr, alltsa mot minskande z.
  const dx = Math.sin(tillstand.riktning) * langd;
  const dz = -Math.cos(tillstand.riktning) * langd;

  const ny = flytta(layout, hinder, tillstand.x, tillstand.z, dx, dz);
  const stoppad = langd !== 0 &&
    Math.abs(ny.x - tillstand.x) < 1e-9 && Math.abs(ny.z - tillstand.z) < 1e-9;

  tillstand.x = ny.x;
  tillstand.z = ny.z;
  tillstand.gar = framat !== 0 && !stoppad;
  return tillstand;
}
