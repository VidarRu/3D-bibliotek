// Enkel rektangelkollision i planvy. Ingen fysikmotor.
//
// Figuren behandlas som en kvadrat runt sin mittpunkt. Varje vagg, hylla
// och mobel ar en rektangel. Rorelsen prövas en riktning i taget, vilket
// gor att figuren glider langs en vagg i stallet for att fastna i den.

export const FIGUR_RADIE = 0.30;

/** Rektanglar som figuren inte far ga igenom. */
export function skapaHinder(layout) {
  const ut = [];
  const lagg = (o, sort) =>
    ut.push({ id: o.id, sort, x: o.x, z: o.z, bredd: o.bredd, djup: o.djup });

  for (const v of layout.walls) lagg(v, "vagg");
  for (const b of layout.blocks) if (!b.gangbar) lagg(b, "block");
  for (const h of layout.shelves) lagg(h, "hylla");
  for (const f of layout.fixtures) {
    // Tavlor hanger pa vaggen och star inte i vagen.
    if (f.typ === "tavla") continue;
    lagg(f, "inredning");
  }
  return ut;
}

/** Ligger punkten pa nagot av golven? */
export function paGolv(layout, x, z) {
  return layout.floors.some(g =>
    x >= g.x && x <= g.x + g.bredd && z >= g.z && z <= g.z + g.djup);
}

/** Ar platsen fri for en figur med given radie? */
export function arFri(layout, hinder, x, z, radie = FIGUR_RADIE) {
  if (!paGolv(layout, x, z)) return false;
  for (const o of hinder) {
    if (x + radie > o.x && x - radie < o.x + o.bredd &&
        z + radie > o.z && z - radie < o.z + o.djup) {
      return false;
    }
  }
  return true;
}

/**
 * Flytta en figur och lat den glida langs det den stoter emot.
 * Returnerar den nya platsen, som kan vara samma som den gamla.
 */
export function flytta(layout, hinder, x, z, dx, dz, radie = FIGUR_RADIE) {
  let nx = x, nz = z;
  if (dx !== 0 && arFri(layout, hinder, x + dx, nz, radie)) nx = x + dx;
  if (dz !== 0 && arFri(layout, hinder, nx, z + dz, radie)) nz = z + dz;
  return { x: nx, z: nz };
}
