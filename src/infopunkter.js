// Infopunkter: runda plattor pa golvet med en stillastaende "i"-bubbla.
//
// Var plattorna ligger kommer ur src/data/layout.json (infopunkter) och
// vad som star pa korten ur src/config/content.js (INFOPUNKTER).
// Plattorna ar inga hinder. Gar figuren upp pa en fragar spelet om man
// vill lasa. Bubblan gar ocksa att klicka pa.

import * as THREE from "three";
import { TYPSNITT, fritFranVaggar } from "./zoner.js";

export const RADIE = 0.55;          // plattans radie i meter
const KLIV_PA = 0.62;               // sa nara mitten raknas som pa plattan
const KLIV_AV = 0.95;               // och sa langt bort innan kortet stangs

/** Ritar ett vitt "i" i en fargad cirkel. */
function iDuk(farg, storlek, kant) {
  const duk = document.createElement("canvas");
  duk.width = duk.height = storlek;
  const c = duk.getContext("2d");
  const m = storlek / 2;
  c.beginPath();
  c.arc(m, m, m - 2, 0, Math.PI * 2);
  c.fillStyle = "#ffffff";
  c.fill();
  c.beginPath();
  c.arc(m, m, m - 2 - kant, 0, Math.PI * 2);
  c.fillStyle = farg;
  c.fill();
  // Liten glans uppe till vanster, som pa en leksak.
  c.beginPath();
  c.arc(m * 0.62, m * 0.55, m * 0.13, 0, Math.PI * 2);
  c.fillStyle = "rgba(255,255,255,0.45)";
  c.fill();
  c.fillStyle = "#ffffff";
  c.font = `800 ${Math.round(storlek * 0.62)}px ${TYPSNITT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("i", m, m + storlek * 0.04);
  const tex = new THREE.CanvasTexture(duk);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Plattor och bubblor for alla infopunkter som har text. */
export function byggInfopunkter(layout, info, tema) {
  const grupp = new THREE.Group();
  grupp.name = "infopunkter";
  const punkter = [];
  const toppTextur = iDuk(tema.senap, 256, 18);
  const bubbelTextur = iDuk(tema.senap, 256, 14);

  for (const p of layout.infopunkter || []) {
    const text = info.find(i => i.id === p.id);
    if (!text) continue;

    // Plattan: sidan och botten i senap, ovansidan med "i".
    const sida = new THREE.MeshStandardMaterial({
      color: tema.senap, emissive: tema.senap, emissiveIntensity: 0, roughness: 0.55 });
    const topp = new THREE.MeshStandardMaterial({
      map: toppTextur, emissive: 0xffffff, emissiveMap: toppTextur,
      emissiveIntensity: 0, roughness: 0.55 });
    const platta = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIE, RADIE + 0.03, 0.05, 40), [sida, topp, sida]);
    platta.position.set(p.x, 0.025, p.z);
    platta.rotation.y = Math.PI / 2;   // "i" upprätt for den som kommer soderifran
    platta.receiveShadow = true;
    grupp.add(platta);

    const bubbla = new THREE.Sprite(new THREE.SpriteMaterial({
      map: bubbelTextur, transparent: true, depthWrite: false, toneMapped: false }));
    bubbla.scale.set(0.62, 0.62, 1);
    bubbla.renderOrder = 9;
    grupp.add(bubbla);

    punkter.push({ ...p, text, sida, topp, bubbla, aktiv: false });
  }

  // Bubblorna star still. Bara plattan man star pa lyser, utan att blinka.
  // Bubblan flyttas ut fran en vagg den annars skulle sticka in i.
  for (const p of punkter) {
    const fri = fritFranVaggar(layout, p.x, p.z, p.bubbla.scale.x / 2);
    p.bubbla.position.set(fri.x, 2.1, fri.z);
  }

  function animera() {
    for (const p of punkter) {
      p.sida.emissiveIntensity = p.aktiv ? 0.35 : 0;
      p.topp.emissiveIntensity = p.aktiv ? 0.2 : 0;
    }
  }

  /**
   * Vilken platta star figuren pa? Den platta som redan ar oppen far lite
   * extra marginal, sa att kortet inte fladdrar vid kanten.
   */
  function vid(x, z, oppen) {
    for (const p of punkter) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < (p.id === oppen ? KLIV_AV : KLIV_PA)) return p.id;
    }
    return null;
  }

  function markera(id) {
    for (const p of punkter) p.aktiv = p.id === id;
  }

  /** Vilken bubbla traffar stralen, eller null. Bubblan kan klickas. */
  function traffad(straleKastare) {
    const traff = straleKastare.intersectObjects(punkter.map(p => p.bubbla), false)[0];
    return traff ? punkter.find(p => p.bubbla === traff.object).id : null;
  }

  return { grupp, punkter, animera, vid, markera, traffad };
}
