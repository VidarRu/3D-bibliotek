// Ett litet firande nar figuren har gatt fram till platsen av sig sjalv:
// en kaskad av pappersbitar som flyger upp och dalar ner runt figuren.
//
// Bitarna ar dampade, i samma farger som resten av kartan, och lagger
// sig till ro pa golvet innan de forsvinner.

import * as THREE from "three";

const ANTAL = 80;
const TYNGD = 7.0;            // meter per sekund i kvadrat
const LANGD = 3.6;            // sekunder fran start tills bitarna ar borta

export function byggFirande(farger) {
  const grupp = new THREE.Group();
  grupp.name = "firande";
  grupp.visible = false;

  const geo = new THREE.PlaneGeometry(0.11, 0.06);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const bitar = new THREE.InstancedMesh(geo, material, ANTAL);
  bitar.frustumCulled = false;
  const farg = new THREE.Color();
  for (let i = 0; i < ANTAL; i++) bitar.setColorAt(i, farg.set(farger[i % farger.length]));
  grupp.add(bitar);

  const delar = Array.from({ length: ANTAL }, () => ({
    p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3(),
    fas: 0
  }));
  const hjalp = new THREE.Object3D();
  let tid = -1;

  /** Startar kaskaden ovanfor huvudet pa en figur som star i (x, z). */
  function starta(x, z) {
    for (const d of delar) {
      const vinkel = Math.random() * Math.PI * 2;
      const ut = 0.6 + Math.random() * 1.8;
      d.p.set(x, 1.45, z);
      d.v.set(Math.cos(vinkel) * ut, 3.6 + Math.random() * 2.4, Math.sin(vinkel) * ut);
      d.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      d.rv.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      d.fas = Math.random() * Math.PI * 2;
    }
    tid = 0;
    grupp.visible = true;
  }

  function stega(dt) {
    if (tid < 0) return;
    tid += dt;
    if (tid > LANGD) { stoppa(); return; }
    // Krymper bort den sista halva sekunden.
    const s = Math.min(1, (LANGD - tid) / 0.5);
    for (let i = 0; i < ANTAL; i++) {
      const d = delar[i];
      if (d.p.y > 0.01) {
        // Luftmotstand: bitarna faller snart lika langsamt som papper,
        // och fladdrar lite fram och tillbaka.
        d.v.y -= TYNGD * dt;
        d.v.multiplyScalar(Math.max(0, 1 - 2.2 * dt));
        if (d.v.y < -1.1) d.v.y = -1.1;
        d.p.addScaledVector(d.v, dt);
        d.p.x += Math.sin(tid * 6 + d.fas) * 0.35 * dt;
        d.r.x += d.rv.x * dt; d.r.y += d.rv.y * dt; d.r.z += d.rv.z * dt;
        if (d.p.y <= 0.01) { d.p.y = 0.01; d.r.set(-Math.PI / 2, 0, d.r.z); }
      }
      hjalp.position.copy(d.p);
      hjalp.rotation.copy(d.r);
      hjalp.scale.setScalar(s);
      hjalp.updateMatrix();
      bitar.setMatrixAt(i, hjalp.matrix);
    }
    bitar.instanceMatrix.needsUpdate = true;
  }

  function stoppa() {
    tid = -1;
    grupp.visible = false;
  }

  return { grupp, starta, stega, stoppa, get pagar() { return tid >= 0; } };
}
