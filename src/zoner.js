// Zoner pa golvet och skyltar over varje plats.
//
// Var en zon ligger kommer ur src/data/layout.json. Vad den heter och
// vilken farg den har kommer ur src/config/content.js.

import * as THREE from "three";
import { VAGGHOJD } from "./varld.js";

export const TYPSNITT = "Nunito, 'Segoe UI', system-ui, sans-serif";
const PX_PER_METER = 40;

/** Platserna med bade geometri och innehall, i innehallsfilens ordning. */
export function sammanfogaPlatser(layout, platser) {
  const zoner = new Map(layout.zones.map(z => [z.id, z]));
  const plan = layout.meta?.plan ?? 0;
  return platser
    .filter(p => zoner.has(p.id))
    .map(p => ({ ...p, plan, rutor: zoner.get(p.id).rutor, skylt: zoner.get(p.id).skylt }));
}

/** Ligger punkten i platsens zon, eventuellt med lite marginal? */
export function iZon(plats, x, z, marginal = 0) {
  return plats.rutor.some(r =>
    x >= r.x - marginal && x <= r.x + r.bredd + marginal &&
    z >= r.z - marginal && z <= r.z + r.djup + marginal);
}

// ------------------------------------------------------------ golvet

// En zon kan besta av flera rutor. For att den ska se ut som en enda yta,
// utan skarvar dar rutorna mots, ritas den som en mask: forst alla rutor
// tillsammans, sedan krymps och vidgas masken for att fa rundade horn och
// en kant som bara loper runt ytterkanten.

function nyDuk(b, h) {
  const d = document.createElement("canvas");
  d.width = b; d.height = h;
  return d;
}

/** Flyttar masken at alla hall och behaller det som overlappar (krymper)
 *  eller allt som tacks (vidgar). */
function forskjut(mask, radie, krymp) {
  const ut = nyDuk(mask.width, mask.height);
  const ctx = ut.getContext("2d");
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = krymp ? "destination-in" : "source-over";
  const STEG = 32;
  for (let i = 0; i < STEG; i++) {
    const v = (i / STEG) * Math.PI * 2;
    ctx.drawImage(mask, Math.cos(v) * radie, Math.sin(v) * radie);
  }
  return ut;
}

/** Fargar in en mask. */
function farga(mask, farg) {
  const ut = nyDuk(mask.width, mask.height);
  const ctx = ut.getContext("2d");
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = farg;
  ctx.fillRect(0, 0, ut.width, ut.height);
  return ut;
}

function blekare(hex, andel) {
  return "#" + new THREE.Color(hex).lerp(new THREE.Color(0xffffff), andel).getHexString();
}

/** Ritar en zon som en rundad yta med fargad kant. Ger duk och placering. */
function ritaZon(rutor, farg) {
  const RUND = 0.45 * PX_PER_METER;   // hornens radie
  const KANT = 0.14 * PX_PER_METER;   // kantens bredd
  const LUFT = 4;

  // Arbeta bara over zonens egen yta, inte hela huset.
  const x0 = Math.floor(Math.min(...rutor.map(r => r.x)) * PX_PER_METER) - LUFT;
  const z0 = Math.floor(Math.min(...rutor.map(r => r.z)) * PX_PER_METER) - LUFT;
  const x1 = Math.ceil(Math.max(...rutor.map(r => r.x + r.bredd)) * PX_PER_METER) + LUFT;
  const z1 = Math.ceil(Math.max(...rutor.map(r => r.z + r.djup)) * PX_PER_METER) + LUFT;

  const mask = nyDuk(x1 - x0, z1 - z0);
  const m = mask.getContext("2d");
  m.fillStyle = "#000";
  // Rutorna overlappar lite, sa att inga tunna glipor blir kvar mellan dem.
  for (const r of rutor) {
    m.fillRect(r.x * PX_PER_METER - x0 - 0.5, r.z * PX_PER_METER - z0 - 0.5,
               r.bredd * PX_PER_METER + 1, r.djup * PX_PER_METER + 1);
  }

  // Krympa och vidga igen ger rundade yttre horn.
  const yttre = forskjut(forskjut(mask, RUND, true), RUND, false);
  const inre = forskjut(yttre, KANT, true);

  const duk = farga(yttre, farg);
  duk.getContext("2d").drawImage(farga(inre, blekare(farg, 0.5)), 0, 0);
  return { duk, x: x0, z: z0 };
}

function byggGolvzoner(layout, platser) {
  const { bredd, djup } = layout.bounds;
  const duk = nyDuk(Math.ceil(bredd * PX_PER_METER), Math.ceil(djup * PX_PER_METER));
  const ctx = duk.getContext("2d");

  for (const p of platser) {
    const zon = ritaZon(p.rutor, p.farg);
    ctx.globalAlpha = p.avdelning ? 0.9 : 0.6;
    ctx.drawImage(zon.duk, zon.x, zon.z);
    ctx.globalAlpha = 1;
  }
  // Trappor som gar ner ar hal i golvet, och zonfargen far inte tacka dem.
  ctx.globalCompositeOperation = "destination-out";
  for (const f of layout.fixtures.filter(f => f.typ === "trappa" && f.ner)) {
    ctx.fillRect(f.x * PX_PER_METER, f.z * PX_PER_METER, f.bredd * PX_PER_METER, f.djup * PX_PER_METER);
  }
  ctx.globalCompositeOperation = "source-over";

  const textur = new THREE.CanvasTexture(duk);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.anisotropy = 4;

  const yta = new THREE.Mesh(
    new THREE.PlaneGeometry(bredd, djup),
    new THREE.MeshStandardMaterial({
      map: textur, transparent: true, depthWrite: false, roughness: 0.9,
      polygonOffset: true, polygonOffsetFactor: -2
    }));
  yta.rotation.x = -Math.PI / 2;
  yta.position.set(bredd / 2, 0.01, djup / 2);
  yta.receiveShadow = true;
  yta.name = "golvzoner";
  return yta;
}

// ------------------------------------------------------------ skyltarna

export function rundRekt(ctx, x, y, b, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + b, y, x + b, y + h, r);
  ctx.arcTo(x + b, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + b, y, r);
  ctx.closePath();
}

/** Ritar en pillerformad skylt och ger tillbaka en sprite i ratt storlek. */
function byggSkylt(plats) {
  const H = 150;                    // dukens hojd i pixlar
  const textstorlek = 72;
  const kant = 14;
  const skugga = 12;
  const prick = 30;

  const mat = document.createElement("canvas").getContext("2d");
  mat.font = `800 ${textstorlek}px ${TYPSNITT}`;
  const textbredd = Math.ceil(mat.measureText(plats.namn).width);
  const B = textbredd + H + prick * 2 + 20;

  const duk = document.createElement("canvas");
  duk.width = B + 8;
  duk.height = H + skugga + 8;
  const ctx = duk.getContext("2d");
  const h = H - kant, b = B - kant, x0 = kant / 2 + 4, y0 = kant / 2 + 4;

  // Mjuk skugga under, som en leksak som star pa bordet.
  rundRekt(ctx, x0, y0 + skugga, b, h, h / 2);
  ctx.fillStyle = "rgba(60, 45, 30, 0.22)";
  ctx.fill();

  // Kropp och kant.
  rundRekt(ctx, x0, y0, b, h, h / 2);
  ctx.fillStyle = "#fffaf2";
  ctx.fill();
  ctx.lineWidth = kant;
  ctx.strokeStyle = plats.farg;
  ctx.stroke();

  // Liten fargprick framfor texten.
  ctx.beginPath();
  ctx.arc(x0 + h / 2 + 4, y0 + h / 2, prick, 0, Math.PI * 2);
  ctx.fillStyle = plats.farg;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x0 + h / 2 - 4, y0 + h / 2 - 8, prick * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fill();

  ctx.font = `800 ${textstorlek}px ${TYPSNITT}`;
  ctx.fillStyle = "#2b2420";
  ctx.textBaseline = "middle";
  ctx.fillText(plats.namn, x0 + h / 2 + prick + 26, y0 + h / 2 + 4);

  const textur = new THREE.CanvasTexture(duk);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.anisotropy = 4;

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textur, transparent: true, depthWrite: false, toneMapped: false
  }));
  const hojd = plats.avdelning ? 0.95 : 0.7;
  sprite.scale.set(hojd * duk.width / duk.height, hojd, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/**
 * Bygger zoner och skyltar. Ger tillbaka gruppen och en funktion som
 * animerar skyltarna, samt ett satt att fa en skylt att hoppa.
 */
export async function byggZoner(layout, platser) {
  // Typsnittet maste vara laddat innan skylttexten ritas.
  try {
    await Promise.all([
      document.fonts.load(`800 72px Nunito`),
      document.fonts.load(`400 16px Nunito`)
    ]);
  } catch { /* reservtypsnittet duger */ }

  const grupp = new THREE.Group();
  grupp.name = "zoner";
  grupp.add(byggGolvzoner(layout, platser));

  const skyltar = new Map();
  platser.forEach((p, i) => {
    const s = byggSkylt(p);
    const y = VAGGHOJD + (p.avdelning ? 0.75 : 0.45);
    s.position.set(p.skylt.x, y, p.skylt.z);
    grupp.add(s);
    skyltar.set(p.id, { sprite: s, y, fas: i * 1.3, hopp: -1, skala: s.scale.clone() });
  });

  function animera(tid) {
    for (const s of skyltar.values()) {
      let lyft = Math.sin(tid * 1.6 + s.fas) * 0.07;
      let stor = 1;
      if (s.hopp >= 0) {
        const t = tid - s.hopp;
        if (t > 0.9) s.hopp = -1;
        else {
          // Ett glatt hopp: upp och ner, med en liten studs i storleken.
          lyft += Math.sin((t / 0.9) * Math.PI) * 0.8;
          stor = 1 + Math.sin((t / 0.9) * Math.PI * 2) * 0.12;
        }
      }
      s.sprite.position.y = s.y + lyft;
      s.sprite.scale.set(s.skala.x * stor, s.skala.y * stor, 1);
    }
  }

  function hoppa(id, tid) {
    const s = skyltar.get(id);
    if (s) s.hopp = tid;
  }

  return { grupp, animera, hoppa };
}
