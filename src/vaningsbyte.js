// Bruna plattor framfor trappor och hiss, dar figuren byter vaning.
//
// Var plattorna ligger, och var man kommer ut pa den andra vaningen,
// kommer ur "forbindelser" i src/data/layout.json och layout_plan1.json.
// En forbindelse med samma id finns pa bada vaningarna: gar man pa
// plattan "hissen" pa plan 0 kommer man ut vid "hissen" pa plan 1.

import * as THREE from "three";
import { TYPSNITT, rundRekt, fritFranVaggar } from "./zoner.js";
import { SIDA } from "./config/content.js";

const PX = 128;                 // pixlar per meter pa plattans duk
const LUFT = 0.12;              // sa langt utanfor kanten raknas som pa

const ersatt = (mall, plan) => mall.replace("{plan}", plan);

/** Plattans ovansida: varmt brun med vita pilar mot trappan. */
function plattDuk(f, mot, tema) {
  const duk = document.createElement("canvas");
  duk.width = Math.round(f.platta.bredd * PX);
  duk.height = Math.round(f.platta.djup * PX);
  const c = duk.getContext("2d");
  c.fillStyle = tema.senap;
  c.fillRect(0, 0, duk.width, duk.height);
  c.lineWidth = 10;
  c.strokeStyle = "rgba(255,255,255,0.9)";
  c.strokeRect(5, 5, duk.width - 10, duk.height - 10);

  // Tre pilar bredvid varandra, som pekar mot trappan eller hissen.
  // Ladans ovansida visar duken spegelvand i hojdled (dukens overkant
  // hamnar at soder), darfor vands den forst.
  c.save();
  c.translate(0, duk.height);
  c.scale(1, -1);
  c.translate(duk.width / 2, duk.height / 2);
  c.rotate({ norr: -Math.PI / 2, syd: Math.PI / 2, vast: Math.PI, ost: 0 }[mot]);
  c.fillStyle = "#ffffff";
  const s = Math.min(duk.width, duk.height) * 0.3;
  for (const dy of [-1.25, 0, 1.25]) {
    const y = dy * s;
    c.beginPath();
    c.moveTo(-s * 0.4, y - s * 0.5);
    c.lineTo(s * 0.2, y);
    c.lineTo(-s * 0.4, y + s * 0.5);
    c.lineTo(-s * 0.1, y + s * 0.5);
    c.lineTo(s * 0.5, y);
    c.lineTo(-s * 0.1, y - s * 0.5);
    c.closePath();
    c.fill();
  }
  c.restore();
  const tex = new THREE.CanvasTexture(duk);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** En skylt over plattan: "Upp till plan 1" med en pil. */
function skyltDuk(text, upp, tema) {
  const H = 120, storlek = 60, kant = 12;
  const matt = document.createElement("canvas").getContext("2d");
  matt.font = `800 ${storlek}px ${TYPSNITT}`;
  const B = Math.ceil(matt.measureText(text).width) + H + 60;
  const duk = document.createElement("canvas");
  duk.width = B + 8; duk.height = H + 8;
  const c = duk.getContext("2d");
  rundRekt(c, 4 + kant / 2, 4 + kant / 2, B - kant, H - kant, (H - kant) / 2);
  c.fillStyle = tema.senap;
  c.fill();
  c.lineWidth = kant;
  c.strokeStyle = "#ffffff";
  c.stroke();
  // Pilen, upp eller ner.
  const mx = 4 + H / 2 + 4, my = 4 + H / 2;
  c.fillStyle = "#2b2420";
  c.beginPath();
  const r = H * 0.22, v = upp ? -1 : 1;
  c.moveTo(mx, my + v * r);
  c.lineTo(mx - r, my - v * r * 0.2);
  c.lineTo(mx - r * 0.38, my - v * r * 0.2);
  c.lineTo(mx - r * 0.38, my - v * r);
  c.lineTo(mx + r * 0.38, my - v * r);
  c.lineTo(mx + r * 0.38, my - v * r * 0.2);
  c.lineTo(mx + r, my - v * r * 0.2);
  c.closePath();
  c.fill();
  c.font = `800 ${storlek}px ${TYPSNITT}`;
  c.textBaseline = "middle";
  c.fillText(text, 4 + H, my + 3);
  const tex = new THREE.CanvasTexture(duk);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  const hojd = 0.42;
  sprite.scale.set(hojd * duk.width / duk.height, hojd, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** At vilket hall trappan eller hissen ligger, sett fran plattan. */
function riktningMot(f, fixture) {
  if (!fixture) return "norr";
  const px = f.platta.x + f.platta.bredd / 2, pz = f.platta.z + f.platta.djup / 2;
  const dx = fixture.x + fixture.bredd / 2 - px, dz = fixture.z + fixture.djup / 2 - pz;
  if (Math.abs(dx) / fixture.bredd > Math.abs(dz) / fixture.djup) return dx > 0 ? "ost" : "vast";
  return dz > 0 ? "syd" : "norr";
}

export function byggPlattor(layout, tema) {
  const grupp = new THREE.Group();
  grupp.name = "vaningsplattor";
  const plan = layout.meta?.plan ?? 0;
  const plattor = [];

  for (const f of layout.forbindelser || []) {
    const fixture = layout.fixtures.find(o => o.id === f.fixture);
    const mot = riktningMot(f, fixture);
    const p = f.platta;
    const tex = plattDuk(f, mot, tema);
    const sida = new THREE.MeshStandardMaterial({ color: tema.senap, roughness: 0.55 });
    const topp = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.2, roughness: 0.55 });
    // En lada har sex sidor, och den tredje (index 2) ar ovansidan.
    const platta = new THREE.Mesh(new THREE.BoxGeometry(p.bredd, 0.04, p.djup),
                                  [sida, sida, topp, sida, sida, sida]);
    platta.position.set(p.x + p.bredd / 2, 0.02, p.z + p.djup / 2);
    platta.receiveShadow = true;
    grupp.add(platta);

    const upp = f.till > plan;
    const text = ersatt(upp ? SIDA.vaningUpp : SIDA.vaningNer, f.till);
    const skylt = skyltDuk(text, upp, tema);
    grupp.add(skylt);
    plattor.push({ ...f, skylt, topp });
  }

  // Skylten star still over plattan, men inte inne i en vagg.
  for (const p of plattor) {
    const m = p.platta;
    const fri = fritFranVaggar(layout, m.x + m.bredd / 2, m.z + m.djup / 2, p.skylt.scale.x / 2);
    p.skylt.position.set(fri.x, 2.35, fri.z);
  }
  function animera() {}

  /** Plattan figuren star pa, eller null. */
  function vid(x, z) {
    return plattor.find(p => x >= p.platta.x - LUFT && x <= p.platta.x + p.platta.bredd + LUFT &&
                             z >= p.platta.z - LUFT && z <= p.platta.z + p.platta.djup + LUFT) || null;
  }

  return { grupp, plattor, animera, vid };
}
