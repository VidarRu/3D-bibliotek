// Lantagare: runda leksaksfigurer som gar lugnt langs fasta banor.
//
// Banorna ar punkter i src/data/layout.json (lantagare). En bana ar
// antingen en slinga, dar lantagaren gar runt och runt, eller en strak-
// ka, dar den gar fram och tillbaka. Ingen AI, bara banan.

import * as THREE from "three";
import { byggFigur, animeraFigur } from "./figur.js";
import { FIGUR_RADIE } from "./kollision.js";

export const LANTAGAR_RADIE = 0.3;

// Kladfarger, sa att lantagarna skiljer sig fran spelaren och varandra.
const KLADER = [
  { troja: "#a46a5a", byxor: "#5b4130", har: "#6b4a3a" },
  { troja: "#c8ad86", byxor: "#6b4a3a", har: "#2b2420" },
  { troja: "#6b4a3a", byxor: "#a8845c", har: "#c8ad86" },
  { troja: "#9a6b4f", byxor: "#3d3029", har: "#5a3d2b" }
];

/** En liten bokhog som lantagaren bar i famnen. */
function bokhog(tema) {
  const g = new THREE.Group();
  const farger = [tema.senap, tema.mint, tema.rosa];
  for (let i = 0; i < 3; i++) {
    const bok = new THREE.Mesh(
      new THREE.BoxGeometry(0.26 - i * 0.02, 0.06, 0.2 - i * 0.01),
      new THREE.MeshStandardMaterial({ color: farger[i], roughness: 0.6 }));
    bok.position.set((i % 2) * 0.02 - 0.01, i * 0.062, 0);
    bok.rotation.y = (i - 1) * 0.15;
    bok.castShadow = true;
    g.add(bok);
  }
  g.position.set(0, 0.86, -0.27);
  return g;
}

/** Langden av varje stracka och hela banan. */
function matBana(punkter, slinga) {
  const p = slinga ? [...punkter, punkter[0]] : punkter;
  const strackor = [];
  let total = 0;
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    strackor.push({ a: p[i - 1], b: p[i], l, start: total });
    total += l;
  }
  return { strackor, total };
}

/** Plats och riktning en viss stracka in pa banan. */
function punktPa(bana, s) {
  for (const st of bana.strackor) {
    if (s <= st.start + st.l || st === bana.strackor.at(-1)) {
      const t = Math.min(1, Math.max(0, (s - st.start) / st.l));
      return {
        x: st.a[0] + (st.b[0] - st.a[0]) * t,
        z: st.a[1] + (st.b[1] - st.a[1]) * t,
        riktning: Math.atan2(st.b[0] - st.a[0], -(st.b[1] - st.a[1]))
      };
    }
  }
}

export function byggLantagare(layout, tema, antal, fart) {
  const grupp = new THREE.Group();
  grupp.name = "lantagare";
  const lista = [];

  (layout.lantagare || []).slice(0, antal).forEach((def, i) => {
    const figur = byggFigur(tema, KLADER[i % KLADER.length]);
    figur.userData.kropp.add(bokhog(tema));
    grupp.add(figur);
    const bana = matBana(def.bana, def.slinga);
    // Var och en borjar en bit in pa sin bana, sa att de inte gar i takt.
    lista.push({ id: def.id, figur, bana, slinga: def.slinga,
                 s: (bana.total * (i * 0.37 % 1)), riktning: 1,
                 x: 0, z: 0, vinkel: 0, tillstand: { gar: true } });
  });

  function stega(dt) {
    for (const l of lista) {
      l.s += fart * dt * l.riktning;
      if (l.slinga) {
        l.s = ((l.s % l.bana.total) + l.bana.total) % l.bana.total;
      } else if (l.s >= l.bana.total) {
        l.s = l.bana.total; l.riktning = -1;
      } else if (l.s <= 0) {
        l.s = 0; l.riktning = 1;
      }
      const p = punktPa(l.bana, l.s);
      l.x = p.x; l.z = p.z;
      const mal = l.riktning > 0 ? p.riktning : p.riktning + Math.PI;
      // Vander sig mjukt i stallet for att knycka runt i vandpunkterna.
      let d = mal - l.vinkel;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      l.vinkel += d * Math.min(1, dt * 6);

      l.figur.position.set(l.x, 0, l.z);
      l.figur.rotation.y = -l.vinkel;
      animeraFigur(l.figur, l.tillstand, dt, false);
      // Armarna haller bokhogen i stallet for att svanga.
      const led = l.figur.userData.leder;
      led.vansterArm.rotation.set(-1.2, 0, -0.35);
      led.hogerArm.rotation.set(-1.2, 0, 0.35);
    }
  }

  /** Den lantagare som spelaren krockar med, rektangel mot rektangel. */
  function krock(x, z) {
    const n = FIGUR_RADIE + LANTAGAR_RADIE;
    return lista.find(l => Math.abs(l.x - x) < n && Math.abs(l.z - z) < n) || null;
  }

  stega(0);
  return { grupp, lista, stega, krock };
}
