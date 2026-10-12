// Minispelet "Hitta alla avdelningar".
//
// Haller reda pa vilka platser figuren har besokt. Avdelningarna raknas
// i spelet, ovriga platser far bara sitt glada skylthopp forsta gangen.
// Ingenting sparas: laddar man om sidan borjar man om.

import { iZon } from "./zoner.js";

// Samma marginal som for vagvisningen, sa att en disk som tacker hela
// zonen anda gar att "na" genom att stalla sig framfor den.
const MARGINAL = 0.6;

/**
 * platser: alla platser. narHittad(plats, antal, totalt) anropas forsta
 * gangen en avdelning nas, narVinst() nar alla ar funna och
 * narBesok(plats) forsta gangen vilken plats som helst nas.
 */
export function skapaMinispel(platser, { narHittad, narVinst, narBesok }) {
  const avdelningar = platser.filter(p => p.avdelning);
  const funna = new Set();
  const besokta = new Set();
  // Avdelningar som figuren stod i nar spelet borjade. De raknas forst
  // nar figuren har gatt ut och kommit tillbaka.
  const vantar = new Set();
  let vunnit = false;

  /** Platser figuren star i just nu raknas inte forran man gatt ut. */
  function borja(x, z) {
    for (const p of platser) if (iZon(p, x, z)) besokta.add(p.id);
    for (const p of avdelningar) if (iZon(p, x, z, MARGINAL)) vantar.add(p.id);
  }

  function kolla(x, z) {
    for (const p of platser) {
      if (!besokta.has(p.id) && iZon(p, x, z)) {
        besokta.add(p.id);
        narBesok(p);
      }
    }
    for (const p of avdelningar) {
      const inne = iZon(p, x, z, MARGINAL);
      if (vantar.has(p.id)) {
        if (!inne) vantar.delete(p.id);
        continue;
      }
      if (funna.has(p.id) || !inne) continue;
      funna.add(p.id);
      narHittad(p, funna.size, avdelningar.length);
      if (funna.size === avdelningar.length && !vunnit) {
        vunnit = true;
        narVinst();
      }
    }
  }

  function nollstall(x, z) {
    funna.clear();
    besokta.clear();
    vantar.clear();
    vunnit = false;
    borja(x, z);
  }

  return {
    avdelningar,
    kolla,
    borja,
    nollstall,
    get funna() { return [...funna]; },
    get vunnit() { return vunnit; },
    arFunnen: id => funna.has(id)
  };
}
