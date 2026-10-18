// Skjutdorrarna i entren: tva glasdorrar som glider isar nar figuren
// kommer nara, som en vanlig sensordorr.
//
// Dorrarna ar dorrar i kartan med "skjutdorrar": true. De byggs utanfor
// resten av varlden, eftersom de ror sig och darfor inte kan slas ihop
// med de fasta delarna. Kollisionen bryr sig inte om dem: de hinner
// alltid oppnas innan figuren nar fram.

import * as THREE from "three";
import { mat, rundLada } from "./former.js";

const DORRHOJD = 2.30;
const AVKANNING = 2.4;       // meter fran dorrens mitt dar sensorn reagerar
const FART = 1.8;            // hur stor del av vagen dorren glider per sekund

/** Ett dorrblad med glas och smal karm, byggt langs z med mitten i origo. */
function dorrblad(langd, tjock, tema, glas) {
  const g = new THREE.Group();
  const karm = mat(tema.karm);
  g.add(rundLada(-tjock / 2, -langd / 2, tjock, 0.07, DORRHOJD, 0, karm, 0.02));
  g.add(rundLada(-tjock / 2, langd / 2 - 0.07, tjock, 0.07, DORRHOJD, 0, karm, 0.02));
  g.add(rundLada(-tjock / 2, -langd / 2, tjock, langd, 0.1, 0, karm, 0.02));
  g.add(rundLada(-tjock / 2, -langd / 2, tjock, langd, 0.08, DORRHOJD - 0.08, karm, 0.02));
  const ruta = new THREE.Mesh(new THREE.BoxGeometry(0.02, DORRHOJD - 0.18, langd - 0.14), glas);
  ruta.position.y = 0.1 + (DORRHOJD - 0.18) / 2;
  g.add(ruta);
  return g;
}

export function byggSkjutdorrar(layout, tema, lugnt = false) {
  const grupp = new THREE.Group();
  grupp.name = "skjutdorrar";
  const glas = new THREE.MeshStandardMaterial({
    color: tema.glas, transparent: true, opacity: 0.32, roughness: 0.08,
    metalness: 0.1, depthWrite: false });

  const dorrar = [];
  for (const d of (layout.doors || []).filter(o => o.skjutdorrar)) {
    const langsX = d.bredd > d.djup;
    const langd = langsX ? d.bredd : d.djup;
    const tjock = langsX ? d.djup : d.bredd;
    const mitt = { x: d.x + d.bredd / 2, z: d.z + d.djup / 2 };
    // Bladen glider pa utsidan av vaggen, sa att de inte skar i karmarna.
    // Ett kvarts varv gor lokal x till -z, darav de omvanda tecknen.
    const ut = (langsX ? { syd: -1, norr: 1 } : { ost: 1, vast: -1 })[d.riktning] ?? 1;
    const ytan = tjock / 2 + 0.05;

    const del = new THREE.Group();
    del.position.set(mitt.x, 0, mitt.z);
    if (langsX) del.rotation.y = Math.PI / 2;
    grupp.add(del);

    // Overstycket ovanfor dorren, med en liten sensor mitt pa.
    del.add(rundLada(-tjock / 2, -langd / 2, tjock, langd, 3.2 - DORRHOJD, DORRHOJD,
                     mat(tema.vagg), 0.04));
    del.add(rundLada(ut * ytan - 0.05, -0.15, 0.1, 0.3, 0.08, DORRHOJD + 0.05,
                     mat(tema.automat), 0.02));

    const blad = [-1, 1].map(sida => {
      const b = dorrblad(langd / 2 + 0.04, 0.05, tema, glas);
      b.position.x = ut * ytan;
      del.add(b);
      return { b, sida };
    });
    dorrar.push({ mitt, langd, blad, oppen: 0 });
  }

  function placera(d) {
    // Mjuk start och mjukt stopp, som en riktig dorr.
    const t = d.oppen * d.oppen * (3 - 2 * d.oppen);
    for (const { b, sida } of d.blad) {
      b.position.z = sida * (d.langd / 4 + t * (d.langd / 2 - 0.08));
    }
  }
  dorrar.forEach(placera);

  /** Oppnar dorrarna nar figuren ar nara och stanger dem annars. */
  function stega(x, z, dt) {
    for (const d of dorrar) {
      const mal = Math.hypot(x - d.mitt.x, z - d.mitt.z) < AVKANNING ? 1 : 0;
      if (d.oppen === mal) continue;
      d.oppen = lugnt ? mal
        : mal > d.oppen ? Math.min(1, d.oppen + FART * dt) : Math.max(0, d.oppen - FART * dt);
      placera(d);
    }
  }

  return { grupp, stega, get oppna() { return dorrar.map(d => d.oppen); } };
}
