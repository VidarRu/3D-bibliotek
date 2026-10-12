// Konfetti: sma fargade papperslappar som flyger och dalar ner.
//
// Alla lappar ritas som instanser i ett enda ritanrop. Rorelsen ar enkel:
// en starthastighet, tyngdkraft, luftmotstand och lite fladder. Ingen
// fysikmotor. Lappar som landat ligger kvar en stund och krymper bort.

import * as THREE from "three";

const MAX = 600;
const TYNGD = 7.5;

export function byggKonfetti() {
  const geo = new THREE.BoxGeometry(0.11, 0.012, 0.07);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6,
                                               side: THREE.DoubleSide });
  const nat = new THREE.InstancedMesh(geo, mat, MAX);
  nat.frustumCulled = false;
  nat.count = 0;
  nat.castShadow = false;
  nat.name = "konfetti";
  // Instansfargen maste finnas fran borjan for att shadern ska anvanda den.
  const c = new THREE.Color();
  for (let i = 0; i < MAX; i++) nat.setColorAt(i, c.set(0xffffff));

  const lappar = [];
  const m = new THREE.Object3D();

  function lagg(x, y, z, vx, vy, vz, farg, liv) {
    if (lappar.length >= MAX) lappar.shift();
    lappar.push({
      x, y, z, vx, vy, vz,
      rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6,
      wx: (Math.random() - 0.5) * 12, wy: (Math.random() - 0.5) * 8, wz: (Math.random() - 0.5) * 12,
      fas: Math.random() * 6, farg, liv, alder: 0, landad: false
    });
  }

  /** En small som skjuts upp och ut fran en punkt, i en eller flera farger. */
  function small(x, y, z, farger, antal = 70) {
    for (let i = 0; i < antal; i++) {
      const v = Math.random() * Math.PI * 2;
      const ut = 1.2 + Math.random() * 2.2;
      lagg(x, y, z, Math.cos(v) * ut, 2.5 + Math.random() * 3.5, Math.sin(v) * ut,
           farger[i % farger.length], 3.5 + Math.random() * 1.5);
    }
  }

  /** Ett regn som faller over ett omrade runt (x, z). */
  function regn(x, z, farger, antal = 320, radie = 4.5) {
    for (let i = 0; i < antal; i++) {
      const v = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radie;
      lagg(x + Math.cos(v) * r, 4 + Math.random() * 6, z + Math.sin(v) * r,
           (Math.random() - 0.5) * 0.6, -Math.random() * 1.5, (Math.random() - 0.5) * 0.6,
           farger[i % farger.length], 6 + Math.random() * 2);
    }
  }

  function stega(dt) {
    if (!lappar.length && nat.count === 0) return;
    for (const l of lappar) {
      l.alder += dt;
      if (!l.landad) {
        // Luftmotstand gor att lapparna snart dalar i stallet for att falla.
        l.vy -= TYNGD * dt;
        const broms = Math.exp(-2.2 * dt);
        l.vx *= broms; l.vz *= broms;
        l.vy = Math.max(l.vy * Math.exp(-0.8 * dt), -1.6);
        l.x += (l.vx + Math.sin(l.alder * 3 + l.fas) * 0.35) * dt;
        l.y += l.vy * dt;
        l.z += (l.vz + Math.cos(l.alder * 2.6 + l.fas) * 0.35) * dt;
        l.rx += l.wx * dt; l.ry += l.wy * dt; l.rz += l.wz * dt;
        if (l.y <= 0.012) {
          l.y = 0.012; l.landad = true;
          l.rx = 0; l.rz = 0;
        }
      }
    }
    // Gamla lappar forsvinner.
    for (let i = lappar.length - 1; i >= 0; i--) if (lappar[i].alder > lappar[i].liv) lappar.splice(i, 1);

    const c = new THREE.Color();
    lappar.forEach((l, i) => {
      const krymp = Math.min(1, (l.liv - l.alder) / 0.6);
      m.position.set(l.x, l.y, l.z);
      m.rotation.set(l.rx, l.ry, l.rz);
      m.scale.setScalar(Math.max(0.001, krymp));
      m.updateMatrix();
      nat.setMatrixAt(i, m.matrix);
      nat.setColorAt(i, c.set(l.farg));
    });
    nat.count = lappar.length;
    nat.instanceMatrix.needsUpdate = true;
    if (nat.instanceColor) nat.instanceColor.needsUpdate = true;
  }

  return { nat, small, regn, stega, get antal() { return lappar.length; } };
}
