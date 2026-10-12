// "Hitta hit": raknar ut en vag over golvet och visar den som prickar.
//
// Golvet delas in i ett rutnat. En ruta ar fri om figuren far sta dar
// enligt kollisionen, sa vagen gar exakt dar figuren kan ga. Kortaste
// vagen hittas med A*, en vanlig metod for kortaste vag i ett rutnat.

import * as THREE from "three";
import { arFri, FIGUR_RADIE } from "./kollision.js";
import { iZon } from "./zoner.js";

const RUTA = 0.25;                       // meter
const MARGINAL = 0.08;                   // extra luft mellan vag och hinder
const PRICKAVSTAND = 0.55;               // meter mellan prickarna
const MAX_PRICKAR = 200;

// ------------------------------------------------------------- rutnatet

export function byggRutnat(layout, hinder) {
  const kol = Math.ceil(layout.bounds.bredd / RUTA);
  const rad = Math.ceil(layout.bounds.djup / RUTA);
  const fri = new Uint8Array(kol * rad);       // 2 = med marginal, 1 = precis
  for (let r = 0; r < rad; r++) {
    for (let k = 0; k < kol; k++) {
      const x = (k + 0.5) * RUTA, z = (r + 0.5) * RUTA;
      if (arFri(layout, hinder, x, z, FIGUR_RADIE + MARGINAL)) fri[r * kol + k] = 2;
      else if (arFri(layout, hinder, x, z)) fri[r * kol + k] = 1;
    }
  }
  return { kol, rad, fri, layout, hinder };
}

const mitt = (k) => (k + 0.5) * RUTA;
const index = (n, x, z) => {
  const k = Math.min(n.kol - 1, Math.max(0, Math.floor(x / RUTA)));
  const r = Math.min(n.rad - 1, Math.max(0, Math.floor(z / RUTA)));
  return r * n.kol + k;
};

/** Narmaste fria ruta till en punkt, valfritt begransad till en zon. */
function narmasteFria(n, x, z, plats = null, krav = 2) {
  let bast = -1, bastAvstand = Infinity;
  for (let i = 0; i < n.fri.length; i++) {
    if (n.fri[i] < krav) continue;
    const cx = mitt(i % n.kol), cz = mitt(Math.floor(i / n.kol));
    if (plats && !iZon(plats, cx, cz)) continue;
    const d = (cx - x) ** 2 + (cz - z) ** 2;
    if (d < bastAvstand) { bastAvstand = d; bast = i; }
  }
  return bast;
}

/** Malet for en plats: fri ruta i zonen narmast skylten. */
export function malFor(n, plats) {
  let i = narmasteFria(n, plats.skylt.x, plats.skylt.z, plats);
  // Zoner som helt tacks av en mobel, till exempel en disk: ga fram till den.
  if (i < 0) i = narmasteFria(n, plats.skylt.x, plats.skylt.z);
  return { x: mitt(i % n.kol), z: mitt(Math.floor(i / n.kol)), i };
}

// ------------------------------------------------------------------ A*

function aStjarna(n, start, mal, krav) {
  const { kol, fri } = n;
  const antal = fri.length;
  const g = new Float32Array(antal).fill(Infinity);
  const fran = new Int32Array(antal).fill(-1);
  const stangd = new Uint8Array(antal);
  const mk = mal % kol, mr = Math.floor(mal / kol);
  const h = (i) => {
    const dx = Math.abs(i % kol - mk), dz = Math.abs(Math.floor(i / kol) - mr);
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
  };

  // En enkel binar hog, sa att ocksa langa vagar gar fort.
  const hog = [];
  const push = (i, f) => {
    hog.push([f, i]);
    let c = hog.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (hog[p][0] <= hog[c][0]) break;
      [hog[p], hog[c]] = [hog[c], hog[p]]; c = p;
    }
  };
  const pop = () => {
    const topp = hog[0], sista = hog.pop();
    if (hog.length) {
      hog[0] = sista;
      let c = 0;
      for (;;) {
        const v = 2 * c + 1, ho = v + 1;
        let m = c;
        if (v < hog.length && hog[v][0] < hog[m][0]) m = v;
        if (ho < hog.length && hog[ho][0] < hog[m][0]) m = ho;
        if (m === c) break;
        [hog[m], hog[c]] = [hog[c], hog[m]]; c = m;
      }
    }
    return topp[1];
  };

  g[start] = 0;
  push(start, h(start));
  const GRANNAR = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
                   [1, 1, Math.SQRT2], [1, -1, Math.SQRT2],
                   [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

  while (hog.length) {
    const i = pop();
    if (i === mal) break;
    if (stangd[i]) continue;
    stangd[i] = 1;
    const k = i % kol, r = Math.floor(i / kol);
    for (const [dk, dr, kost] of GRANNAR) {
      const nk = k + dk, nr = r + dr;
      if (nk < 0 || nr < 0 || nk >= kol || nr >= n.rad) continue;
      const j = nr * kol + nk;
      if (fri[j] < krav || stangd[j]) continue;
      // Snett bara om bada raka grannarna ocksa ar fria, annars skar vagen horn.
      if (dk && dr && (fri[r * kol + nk] < krav || fri[nr * kol + k] < krav)) continue;
      const ng = g[i] + kost;
      if (ng < g[j]) { g[j] = ng; fran[j] = i; push(j, ng + h(j)); }
    }
  }
  if (fran[mal] < 0 && mal !== start) return null;

  const vag = [];
  for (let i = mal; i >= 0; i = fran[i]) vag.push(i);
  return vag.reverse();
}

/** Ar strackan fri hela vagen? Provas i korta steg. */
function siktFri(n, a, b, radie) {
  const langd = Math.hypot(b.x - a.x, b.z - a.z);
  const steg = Math.max(1, Math.ceil(langd / 0.08));
  for (let s = 1; s < steg; s++) {
    const t = s / steg;
    if (!arFri(n.layout, n.hinder, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, radie)) {
      return false;
    }
  }
  return true;
}

/** Stryker onodiga mellanpunkter, sa att vagen gar i raka strackor. */
function rata(n, punkter, radie) {
  if (punkter.length <= 2) return punkter;
  const ut = [punkter[0]];
  let a = 0;
  while (a < punkter.length - 1) {
    let b = punkter.length - 1;
    while (b > a + 1 && !siktFri(n, punkter[a], punkter[b], radie)) b--;
    ut.push(punkter[b]);
    a = b;
  }
  return ut;
}

/**
 * Raknar ut en vag fran (x, z) till platsen.
 * Ger tillbaka en lista med punkter {x, z}, eller null om ingen vag finns.
 */
export function hittaVag(n, x, z, plats) {
  const mal = malFor(n, plats);
  for (const krav of [2, 1]) {
    let start = index(n, x, z);
    if (n.fri[start] < krav) start = narmasteFria(n, x, z, null, krav);
    const rutor = aStjarna(n, start, mal.i, krav);
    if (!rutor) continue;
    const punkter = rutor.map(i => ({ x: mitt(i % n.kol), z: mitt(Math.floor(i / n.kol)) }));
    punkter[0] = { x, z };
    const radie = krav === 2 ? FIGUR_RADIE + MARGINAL : FIGUR_RADIE;
    return rata(n, punkter, radie);
  }
  return null;
}

/** Vagens langd i meter. */
export function vaglangd(vag) {
  let s = 0;
  for (let i = 1; i < vag.length; i++) {
    s += Math.hypot(vag[i].x - vag[i - 1].x, vag[i].z - vag[i - 1].z);
  }
  return s;
}

// --------------------------------------------------------------- prickar

/**
 * Prickarna pa golvet och en studsande markor vid malet.
 * visa(vag, farg) placerar dem, dolj() tar bort dem och animera(tid)
 * later prickarna pulsera i den riktning man ska ga.
 */
export function byggPrickar() {
  const grupp = new THREE.Group();
  grupp.name = "vagvisning";
  grupp.visible = false;

  const prickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.5
  });
  // Lite tillplattade kulor, som godisknappar pa golvet.
  const prickGeo = new THREE.SphereGeometry(0.14, 16, 10);
  prickGeo.scale(1, 0.45, 1);
  const prickar = new THREE.InstancedMesh(prickGeo, prickMat, MAX_PRICKAR);
  prickar.castShadow = true;
  prickar.frustumCulled = false;      // prickarna flyttas hela tiden
  prickar.count = 0;
  grupp.add(prickar);

  // Markoren: en rund nal som pekar ner pa malet.
  const markor = new THREE.Group();
  const markorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.45
  });
  const kula = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), markorMat);
  kula.position.y = 0.5;
  const spets = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 20), markorMat);
  spets.rotation.x = Math.PI;
  spets.position.y = 0.2;
  const glans = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glans.position.set(-0.1, 0.6, 0.18);
  markor.add(kula, spets, glans);
  for (const d of [kula, spets]) d.castShadow = true;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8,
                                  depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  grupp.add(markor, ring);

  let punkter = [];
  const hjalp = new THREE.Object3D();

  function visa(vag, farg) {
    const c = new THREE.Color(farg);
    prickMat.color.copy(c);
    prickMat.emissive.copy(c);
    markorMat.color.copy(c);
    markorMat.emissive.copy(c);
    ring.material.color.copy(c);

    // Prickar med jamna mellanrum langs vagen, men inte under figuren
    // och inte under markoren.
    punkter = [];
    let kvar = 0.7;
    for (let i = 1; i < vag.length; i++) {
      const a = vag[i - 1], b = vag[i];
      const langd = Math.hypot(b.x - a.x, b.z - a.z);
      let t = kvar;
      while (t < langd) {
        punkter.push({ x: a.x + (b.x - a.x) * t / langd, z: a.z + (b.z - a.z) * t / langd });
        t += PRICKAVSTAND;
      }
      kvar = t - langd;
    }
    const sista = vag[vag.length - 1];
    while (punkter.length && Math.hypot(punkter.at(-1).x - sista.x,
                                         punkter.at(-1).z - sista.z) < 0.5) punkter.pop();
    if (punkter.length > MAX_PRICKAR) punkter.length = MAX_PRICKAR;
    prickar.count = punkter.length;

    markor.position.set(sista.x, 0, sista.z);
    ring.position.x = sista.x;
    ring.position.z = sista.z;
    grupp.visible = true;
  }

  function dolj() {
    grupp.visible = false;
    punkter = [];
    prickar.count = 0;
  }

  function animera(tid) {
    if (!grupp.visible) return;
    // En vag av storre prickar som rullar fram mot malet.
    for (let i = 0; i < punkter.length; i++) {
      const v = Math.max(0, Math.sin(tid * 5 - i * 0.55));
      const s = 0.8 + v * v * 0.7;
      hjalp.position.set(punkter[i].x, 0.06 + v * 0.05, punkter[i].z);
      hjalp.scale.setScalar(s);
      hjalp.updateMatrix();
      prickar.setMatrixAt(i, hjalp.matrix);
    }
    prickar.instanceMatrix.needsUpdate = true;

    const studs = Math.abs(Math.sin(tid * 3.2));
    markor.position.y = 0.25 + studs * 0.45;
    markor.rotation.y = tid * 1.5;
    const s = 1 + (1 - studs) * 0.25;
    ring.scale.set(s, s, s);
  }

  return { grupp, visa, dolj, animera };
}
