// Bokjakt: svavande bocker att samla, och bocker som tappas vid krock.
//
// Platserna raknas fram ur kartan: fri golvyta, en bit fran varandra,
// aldrig pa en infoplatta och inte precis vid start. Fast slumpfro, sa
// att bockerna hamnar pa samma platser varje gang.

import * as THREE from "three";
import { arFri } from "./kollision.js";
import { slump } from "./former.js";
import { TYPSNITT } from "./zoner.js";

const PLOCK = 0.55;          // sa nara mitten en bok plockas
const AVSTAND = 2.0;         // minsta avstand mellan bockerna
const MAX = 80;              // utlagda plus tappade bocker

/** Fria platser for bockerna, valda med fast slump. */
export function placeraBocker(layout, hinder, antal) {
  const slp = slump("bokjakt");
  const kandidater = [];
  for (let x = 0.5; x < layout.bounds.bredd; x += 0.5) {
    for (let z = 0.5; z < layout.bounds.djup; z += 0.5) {
      if (!arFri(layout, hinder, x, z, 0.45)) continue;
      if ((layout.infopunkter || []).some(p => Math.hypot(p.x - x, p.z - z) < 1.3)) continue;
      if (Math.hypot(layout.start.x - x, layout.start.z - z) < 1.5) continue;
      kandidater.push({ x, z, r: slp() });
    }
  }
  kandidater.sort((a, b) => a.r - b.r);
  const valda = [];
  for (const k of kandidater) {
    if (valda.every(v => Math.hypot(v.x - k.x, v.z - k.z) >= AVSTAND)) valda.push({ x: k.x, z: k.z });
    if (valda.length >= antal) break;
  }
  return valda;
}

/** Ett "+10" som flyger upp och tonar bort. */
function plusDuk(text) {
  const duk = document.createElement("canvas");
  duk.width = 256; duk.height = 128;
  const c = duk.getContext("2d");
  c.font = `800 88px ${TYPSNITT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineWidth = 14;
  c.strokeStyle = "#ffffff";
  c.strokeText(text, 128, 66);
  c.fillStyle = "#2f8a6b";
  c.fillText(text, 128, 66);
  const tex = new THREE.CanvasTexture(duk);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * status kan delas mellan flera vaningar, sa att boken man plockar pa
 * plan 1 raknas ihop med dem fran plan 0.
 */
export function byggBokjakt(layout, hinder, tema, installning,
                            status = { bocker: 0, poang: 0 }) {
  const grupp = new THREE.Group();
  grupp.name = "bokjakt";

  // Varje bok ar en fargad parm och vita sidor, ritade som instanser.
  const parm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.52, 0.66, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), MAX);
  const sidor = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.61, 0.13),
    new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.8 }), MAX);
  for (const n of [parm, sidor]) {
    n.frustumCulled = false;
    n.castShadow = true;
    n.count = 0;
    grupp.add(n);
  }
  const c = new THREE.Color();
  for (let i = 0; i < MAX; i++) parm.setColorAt(i, c.set(0xffffff));

  // Skuggflack under varje bok, sa att den syns svava.
  const skugga = new THREE.InstancedMesh(new THREE.CircleGeometry(0.3, 20),
    new THREE.MeshBasicMaterial({ color: 0x5a4632, transparent: true, opacity: 0.18,
                                  depthWrite: false }), MAX);
  skugga.frustumCulled = false;
  skugga.count = 0;
  grupp.add(skugga);

  // "+10"-texter: en liten hog med sprites som ateranvands.
  const plusTex = plusDuk(`+${installning.poangPerBok}`);
  const plus = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: plusTex, transparent: true, depthWrite: false, toneMapped: false }));
    s.scale.set(0.9, 0.45, 1);
    s.visible = false;
    s.renderOrder = 11;
    grupp.add(s);
    plus.push({ s, start: -10 });
  }

  const platser = placeraBocker(layout, hinder, installning.antalBocker);
  const farger = tema.bocker;
  let bocker = [];
  let ny = 0;                          // naer nya bocker ska dyka upp

  function laggUt() {
    bocker = platser.map((p, i) => ({
      x: p.x, z: p.z, farg: farger[i % farger.length], fas: i * 0.9,
      plockad: -1, tappad: false, kanTasFran: 0, flyg: null
    }));
    ny = 0;
  }
  laggUt();

  function nollstall() {
    status.bocker = 0;
    status.poang = 0;
    laggUt();
  }

  /** Plockar bocker figuren star pa. Ger antalet plockade. */
  function plocka(x, z, tid) {
    let antal = 0;
    for (const b of bocker) {
      if (b.plockad >= 0 || b.flyg || tid < b.kanTasFran) continue;
      if (Math.hypot(b.x - x, b.z - z) > PLOCK) continue;
      b.plockad = tid;
      antal++;
      status.bocker++;
      status.poang = status.bocker * installning.poangPerBok;
      const p = plus.find(p => tid - p.start > 0.9) || plus[0];
      p.start = tid;
      p.x = b.x; p.z = b.z;
    }
    return antal;
  }

  /** Alla bocker plockade? Da kommer nya efter en stund. */
  function allaPlockade() {
    return bocker.length > 0 && bocker.every(b => b.plockad >= 0);
  }

  /**
   * Tappar bocker runt (x, z). De flyger ut i en bage och landar pa fri
   * golvyta, och gar att plocka upp igen efter en kort stund.
   */
  function tappa(x, z, antal, tid) {
    const n = Math.min(antal, status.bocker);
    const slp = slump(`tapp${Math.round(tid * 1000)}`);
    for (let i = 0; i < n; i++) {
      let mal = null;
      for (let forsok = 0; forsok < 24 && !mal; forsok++) {
        const v = slp() * Math.PI * 2;
        const r = 1.1 + slp() * 0.9;
        const tx = x + Math.cos(v) * r, tz = z + Math.sin(v) * r;
        if (arFri(layout, hinder, tx, tz, 0.35)) mal = { x: tx, z: tz };
      }
      if (!mal) mal = { x, z };
      bocker.push({ x: mal.x, z: mal.z, farg: farger[(bocker.length + i) % farger.length],
                    fas: slp() * 6, plockad: -1, tappad: true, kanTasFran: tid + 1.0,
                    flyg: { fran: { x, z }, start: tid } });
    }
    status.bocker -= n;
    status.poang = status.bocker * installning.poangPerBok;
    // Gamla plockade bocker behovs inte langre, utom de som ska dyka upp igen.
    if (bocker.length > MAX - 5) bocker = bocker.filter(b => b.plockad < 0 || !b.tappad);
    return n;
  }

  const m = new THREE.Object3D();
  function animera(tid) {
    // Nya bocker nar alla ar plockade, efter en paus.
    if (allaPlockade()) {
      if (!ny) ny = tid + 5;
      else if (tid > ny) laggUt();
    }

    let i = 0;
    for (const b of bocker) {
      let x = b.x, z = b.z, y = 0.75 + Math.sin(tid * 2.4 + b.fas) * 0.1, s = 1;
      if (b.flyg) {
        // En bage fran figuren ut till landningsplatsen.
        const t = Math.min(1, (tid - b.flyg.start) / 0.55);
        x = b.flyg.fran.x + (b.x - b.flyg.fran.x) * t;
        z = b.flyg.fran.z + (b.z - b.flyg.fran.z) * t;
        y = 0.9 + Math.sin(t * Math.PI) * 1.2 - t * 0.35;
        if (t >= 1) b.flyg = null;
      }
      if (b.plockad >= 0) {
        // Plopp: boken vaxer lite och krymper bort.
        const t = (tid - b.plockad) / 0.25;
        if (t >= 1) continue;
        s = 1 + Math.sin(t * Math.PI) * 0.5 - t;
        y += t * 0.4;
      }
      if (i >= MAX) break;
      m.position.set(x, y, z);
      m.rotation.set(0.15, tid * 1.4 + b.fas, 0.1);
      m.scale.setScalar(Math.max(0.001, s));
      m.updateMatrix();
      parm.setMatrixAt(i, m.matrix);
      sidor.setMatrixAt(i, m.matrix);
      parm.setColorAt(i, c.set(b.farg));
      m.position.set(x, 0.015, z);
      m.rotation.set(-Math.PI / 2, 0, 0);
      m.scale.setScalar(Math.max(0.001, s * (1.1 - (y - 0.75) * 0.4)));
      m.updateMatrix();
      skugga.setMatrixAt(i, m.matrix);
      i++;
    }
    for (const n of [parm, sidor, skugga]) {
      n.count = i;
      n.instanceMatrix.needsUpdate = true;
    }
    parm.instanceColor.needsUpdate = true;

    for (const p of plus) {
      const t = (tid - p.start) / 0.9;
      p.s.visible = t >= 0 && t < 1;
      if (!p.s.visible) continue;
      p.s.position.set(p.x, 1.2 + t * 1.1, p.z);
      p.s.material.opacity = 1 - t * t;
    }
  }

  return {
    grupp, status, plocka, tappa, animera, nollstall, allaPlockade,
    get kvar() { return bocker.filter(b => b.plockad < 0); },
    platser
  };
}
