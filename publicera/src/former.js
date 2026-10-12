// Gemensamma byggstenar: rundade lador och delade material.
//
// Allt i varlden byggs av nagra fa enkla former. Material med samma farg
// delas, sa att webblasaren slipper byta material i onodan.

import * as THREE from "three";
import { RoundedBoxGeometry } from "../vendor/addons/RoundedBoxGeometry.js";
import { mergeGeometries } from "../vendor/addons/BufferGeometryUtils.js";

const material = new Map();

/** Ett mjukt, matt material i angiven farg. Delas mellan alla som ber om det. */
export function mat(farg, extra = {}) {
  const nyckel = farg + JSON.stringify(extra);
  if (!material.has(nyckel)) {
    material.set(nyckel, new THREE.MeshStandardMaterial({
      color: farg, roughness: 0.82, metalness: 0, ...extra
    }));
  }
  return material.get(nyckel);
}

/** Ett material som lyser svagt av sig sjalvt, till skarmar och lampor. */
export function lysande(farg, styrka = 0.9) {
  return mat(farg, { emissive: farg, emissiveIntensity: styrka, roughness: 0.4 });
}

function skuggor(nat) {
  nat.castShadow = true;
  nat.receiveShadow = true;
  return nat;
}

/**
 * En rundad lada med sitt nordvastra horn i (x, z) och botten pa hojden y0,
 * precis som rektanglarna i datafilen.
 */
export function rundLada(x, z, bredd, djup, hojd, y0, material, radie = 0.06) {
  const r = Math.min(radie, bredd / 2 - 0.001, djup / 2 - 0.001, hojd / 2 - 0.001);
  const geo = new RoundedBoxGeometry(bredd, hojd, djup, 2, Math.max(r, 0.001));
  const nat = new THREE.Mesh(geo, material);
  nat.position.set(x + bredd / 2, y0 + hojd / 2, z + djup / 2);
  return skuggor(nat);
}

/** Samma sak, men med mitten i (cx, cz). */
export function rundLadaMitt(cx, cz, bredd, djup, hojd, y0, material, radie = 0.06) {
  return rundLada(cx - bredd / 2, cz - djup / 2, bredd, djup, hojd, y0, material, radie);
}

export function cylinder(cx, cz, radie, hojd, y0, material, segment = 20) {
  const nat = new THREE.Mesh(
    new THREE.CylinderGeometry(radie, radie, hojd, segment), material);
  nat.position.set(cx, y0 + hojd / 2, cz);
  return skuggor(nat);
}

/** Ett fast slumptal, sa att varlden ser likadan ut varje gang. */
export function slump(fro) {
  let s = 0;
  for (const t of String(fro)) s = (s * 31 + t.charCodeAt(0)) >>> 0;
  s = s || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/**
 * Slar ihop alla fasta delar som delar material till en enda form.
 *
 * Varlden byggs av hundratals sma delar. Att rita dem en och en kostar
 * mycket, sa nar allt ar byggt slas delar med samma material ihop. Det
 * syns inte, men webblasaren behover bara ett par dussin ritanrop.
 */
export function slaIhop(grupp) {
  grupp.updateMatrixWorld(true);
  const hogar = new Map();
  const bort = [];
  grupp.traverse(nat => {
    if (!nat.isMesh || nat.isInstancedMesh || nat.material.transparent) return;
    const nyckel = `${nat.material.uuid}|${nat.castShadow}|${nat.receiveShadow}`;
    if (!hogar.has(nyckel)) hogar.set(nyckel, { forsta: nat, geometrier: [] });
    let geo = nat.geometry.index ? nat.geometry.toNonIndexed() : nat.geometry.clone();
    geo.applyMatrix4(nat.matrixWorld);
    // Bara de egenskaper alla former har, annars gar de inte att sla ihop.
    for (const namn of Object.keys(geo.attributes)) {
      if (!["position", "normal", "uv"].includes(namn)) geo.deleteAttribute(namn);
    }
    hogar.get(nyckel).geometrier.push(geo);
    bort.push(nat);
  });
  for (const nat of bort) nat.removeFromParent();

  const ihop = new THREE.Group();
  ihop.name = "ihopslaget";
  for (const { forsta, geometrier } of hogar.values()) {
    const nat = new THREE.Mesh(mergeGeometries(geometrier, false), forsta.material);
    nat.castShadow = forsta.castShadow;
    nat.receiveShadow = forsta.receiveShadow;
    ihop.add(nat);
  }
  grupp.add(ihop);
  return grupp;
}
