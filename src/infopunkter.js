// Infopunkter: runda gula plattor pa golvet med en studsande "i"-bubbla.
//
// Var plattorna ligger kommer ur src/data/layout.json (infopunkter) och
// vad som star pa korten ur src/config/content.js (INFOPUNKTER).
// Plattorna ar inga hinder. Figuren gar upp pa dem for att lasa.

import * as THREE from "three";
import { TYPSNITT } from "./zoner.js";

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

    punkter.push({ ...p, text, sida, topp, bubbla, fas: punkter.length * 1.7, hopp: -1, aktiv: false });
  }

  function animera(tid) {
    for (const p of punkter) {
      let y = 2.1 + Math.sin(tid * 2.2 + p.fas) * 0.1;
      let s = 1;
      if (p.hopp >= 0) {
        const t = (tid - p.hopp) / 0.7;
        if (t > 1) p.hopp = -1;
        else { y += Math.sin(t * Math.PI) * 0.5; s = 1 + Math.sin(t * Math.PI * 2) * 0.15; }
      }
      p.bubbla.position.set(p.x, y, p.z);
      p.bubbla.scale.set(0.62 * s, 0.62 * s, 1);
      // Plattan lyser svagt nar figuren star pa den.
      const glod = p.aktiv ? 0.35 + Math.sin(tid * 4) * 0.08 : 0;
      p.sida.emissiveIntensity = glod;
      p.topp.emissiveIntensity = glod * 0.6;
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

  function markera(id, tid) {
    for (const p of punkter) {
      const var_ = p.aktiv;
      p.aktiv = p.id === id;
      if (p.aktiv && !var_) p.hopp = tid;
    }
  }

  return { grupp, punkter, animera, vid, markera };
}
