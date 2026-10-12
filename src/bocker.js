// Hyllor och bilderbokstrag, fyllda med fargglada bocker.
//
// Bockerna ar manga, sa de ritas som instanser: en enda lada som
// webblasaren ritar om pa tusentals platser i ett svep. Fargerna och
// storlekarna slumpas, men med fast fro, sa att det ser likadant ut
// varje gang sidan laddas.

import * as THREE from "three";
import { mat, rundLada, slump } from "./former.js";

const SOCKEL = 0.08;     // hyllans fot
const TAK = 0.05;        // hyllans ovansida
const GAVEL = 0.05;      // sidostyckena
const HYLLPLAN = 0.03;   // tjocklek pa varje hyllplan
const BOKDJUP = 0.07;
const NISCH = 0.02;      // hur langt in bockerna star fran hyllans framkant

/**
 * Samlar instanser for en lada-geometri. Varje instans har plats, storlek,
 * vridning och farg.
 */
function instanser() {
  const lista = [];
  return {
    lista,
    lagg(x, y, z, sx, sy, sz, farg, vridX = 0, vridY = 0, vridZ = 0) {
      lista.push({ x, y, z, sx, sy, sz, farg, vridX, vridY, vridZ });
    }
  };
}

function byggInstanser(lista, material) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const nat = new THREE.InstancedMesh(geo, material, Math.max(1, lista.length));
  const m = new THREE.Object3D();
  const c = new THREE.Color();
  lista.forEach((b, i) => {
    m.position.set(b.x, b.y, b.z);
    m.rotation.set(b.vridX, b.vridY, b.vridZ, "YXZ");
    m.scale.set(b.sx, b.sy, b.sz);
    m.updateMatrix();
    nat.setMatrixAt(i, m.matrix);
    nat.setColorAt(i, c.set(b.farg));
  });
  nat.count = lista.length;
  nat.castShadow = true;
  nat.receiveShadow = true;
  return nat;
}

/**
 * Lagger en rad bocker langs en hyllsida.
 * Allt raknas i hyllans egna koordinater: u langs hyllan, v ut fran mitten.
 */
function bokrad(slp, tema, start, langd, y0, hojdMax, lagg) {
  let u = start;
  const slut = start + langd;
  while (u < slut - 0.04) {
    // Ibland en lucka, som i en riktig hylla.
    if (slp() < 0.06) { u += 0.06 + slp() * 0.12; continue; }
    const b = 0.03 + slp() * 0.045;
    if (u + b > slut) break;
    const h = hojdMax * (0.62 + slp() * 0.34);
    const farg = tema.bocker[Math.floor(slp() * tema.bocker.length)];
    lagg(u + b / 2, y0 + h / 2, b * 0.92, h, farg);
    u += b;
  }
}

function hylla(h, tema, plan, bocker, grupp) {
  const vit = mat(tema.hylla);
  const langsX = h.bredd >= h.djup;
  const L = langsX ? h.bredd : h.djup;
  const T = langsX ? h.djup : h.bredd;
  const slp = slump(h.id);

  // Stommen: en karna i mitten, gavlar, tak och sockel.
  const karna = T - 2 * (BOKDJUP + NISCH);
  if (langsX) {
    grupp.add(rundLada(h.x, h.z + (T - karna) / 2, L, karna, h.hojd, 0, vit, 0.02));
    grupp.add(rundLada(h.x, h.z, GAVEL, T, h.hojd, 0, vit, 0.02));
    grupp.add(rundLada(h.x + L - GAVEL, h.z, GAVEL, T, h.hojd, 0, vit, 0.02));
  } else {
    grupp.add(rundLada(h.x + (T - karna) / 2, h.z, karna, L, h.hojd, 0, vit, 0.02));
    grupp.add(rundLada(h.x, h.z, T, GAVEL, h.hojd, 0, vit, 0.02));
    grupp.add(rundLada(h.x, h.z + L - GAVEL, T, GAVEL, h.hojd, 0, vit, 0.02));
  }
  grupp.add(rundLada(h.x, h.z, h.bredd, h.djup, TAK, h.hojd - TAK, vit, 0.025));
  grupp.add(rundLada(h.x, h.z, h.bredd, h.djup, SOCKEL, 0, vit, 0.025));

  const nivaer = Math.max(2, Math.round((h.hojd - SOCKEL - TAK) / 0.34));
  const nivahojd = (h.hojd - SOCKEL - TAK) / nivaer;

  // Hjalpfunktion som oversatter hyllans u/v till varldens x/z.
  const cx = h.x + h.bredd / 2, cz = h.z + h.djup / 2;
  const varld = (u, v) => langsX
    ? [h.x + u, cz + v]
    : [cx + v, h.z + u];

  for (let n = 0; n < nivaer; n++) {
    const golv = SOCKEL + n * nivahojd;
    // Hyllplanet under raden (det understa ar sockeln).
    if (n > 0) {
      const [x, z] = varld(L / 2, 0);
      plan.lagg(x, golv - HYLLPLAN / 2 + HYLLPLAN, z,
                langsX ? L - 2 * GAVEL : T, HYLLPLAN, langsX ? T : L - 2 * GAVEL, tema.hylla);
    }
    const y0 = golv + (n > 0 ? HYLLPLAN : 0);
    const hojdMax = nivahojd - (n > 0 ? HYLLPLAN : 0) - 0.03;
    for (const sida of [-1, 1]) {
      const v = sida * (karna / 2 + BOKDJUP / 2);
      bokrad(slp, tema, GAVEL, L - 2 * GAVEL, y0, hojdMax, (u, y, b, hh, farg) => {
        const [x, z] = varld(u, v);
        bocker.lagg(x, y, z, langsX ? b : BOKDJUP, hh, langsX ? BOKDJUP : b, farg);
      });
    }
  }
}

/** Lagt bilderbokstrag: en vit lada med bocker som lutar uppat. */
function trag(h, tema, bocker, grupp) {
  const vit = mat(tema.hylla);
  const langsX = h.bredd >= h.djup;
  const L = langsX ? h.bredd : h.djup;
  const T = langsX ? h.djup : h.bredd;
  const slp = slump(h.id);
  const botten = h.hojd - 0.12;

  grupp.add(rundLada(h.x, h.z, h.bredd, h.djup, botten, 0, vit, 0.05));
  // Kanter runt traget, sa att bockerna star i en lada.
  const kant = 0.04;
  if (langsX) {
    grupp.add(rundLada(h.x, h.z, L, kant, h.hojd, 0, vit, 0.018));
    grupp.add(rundLada(h.x, h.z + T - kant, L, kant, h.hojd, 0, vit, 0.018));
  } else {
    grupp.add(rundLada(h.x, h.z, kant, L, h.hojd, 0, vit, 0.018));
    grupp.add(rundLada(h.x + T - kant, h.z, kant, L, h.hojd, 0, vit, 0.018));
  }

  // Bilderbocker ar breda och fargglada. Tva rader, en at varje hall.
  const glada = tema.bocker.filter(f => !["#2b2a33", "#f2ede3"].includes(f));
  const cx = h.x + h.bredd / 2, cz = h.z + h.djup / 2;
  for (const sida of [-1, 1]) {
    let u = 0.12;
    while (u < L - 0.3) {
      const b = 0.2 + slp() * 0.08;
      const hh = 0.22 + slp() * 0.08;
      const farg = glada[Math.floor(slp() * glada.length)];
      const luta = sida * (0.38 + slp() * 0.1);
      const v = sida * T * 0.2;
      const x = langsX ? h.x + u + b / 2 : cx + v;
      const z = langsX ? cz + v : h.z + u + b / 2;
      // Boken lutar bakat mot mitten, med framsidan utat.
      if (langsX) bocker.lagg(x, botten + hh * 0.42, z, b, hh, 0.025, farg, -luta, 0);
      else bocker.lagg(x, botten + hh * 0.42, z, 0.025, hh, b, farg, 0, 0, luta);
      u += b + 0.04;
    }
  }
}

export function byggHyllor(layout, tema) {
  const grupp = new THREE.Group();
  grupp.name = "hyllor";
  const plan = instanser();
  const bocker = instanser();

  for (const h of layout.shelves) {
    if (h.typ === "trag") trag(h, tema, bocker, grupp);
    else hylla(h, tema, plan, bocker, grupp);
  }

  grupp.add(byggInstanser(plan.lista, mat(tema.hylla)));
  // Vitt grundmaterial: varje bok far sin egen farg genom instansfargen.
  const bokMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const bokNat = byggInstanser(bocker.lista, bokMat);
  bokNat.name = "bocker";
  grupp.add(bokNat);
  return { grupp, antalBocker: bocker.lista.length };
}
