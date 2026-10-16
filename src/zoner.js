// Zoner pa golvet och skyltar over varje plats.
//
// Var en zon ligger kommer ur src/data/layout.json. Vad den heter och
// vilken farg den har kommer ur src/config/content.js.

import * as THREE from "three";

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
    // Svaga ytor: zonen ska antyda platsen, inte ta over bilden.
    ctx.globalAlpha = p.avdelning ? 0.32 : 0.2;
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

const SKYLTHOJD = 0.4;              // skyltens hojd i meter
const UTAN_HYLLA = 1.75;            // dar platsen saknar hylla

/**
 * Ritar en liten, lugn skylt, som en hyllskylt i ett riktigt bibliotek:
 * ljus botten, tunn kant i platsens farg och mork text. Ingen skugga,
 * ingen prick.
 */
function byggSkylt(plats) {
  const H = 128;                    // dukens hojd i pixlar
  const textstorlek = 74;
  const kant = 8;

  const mat = document.createElement("canvas").getContext("2d");
  mat.font = `700 ${textstorlek}px ${TYPSNITT}`;
  const B = Math.ceil(mat.measureText(plats.namn).width) + 72;

  const duk = document.createElement("canvas");
  duk.width = B + kant;
  duk.height = H + kant;
  const ctx = duk.getContext("2d");
  rundRekt(ctx, kant / 2, kant / 2, B, H, 18);
  ctx.fillStyle = "#f7f1e6";
  ctx.fill();
  ctx.lineWidth = kant;
  ctx.strokeStyle = plats.farg;
  ctx.stroke();

  ctx.font = `700 ${textstorlek}px ${TYPSNITT}`;
  ctx.fillStyle = "#3b2f27";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(plats.namn, duk.width / 2, duk.height / 2 + 3);

  const textur = new THREE.CanvasTexture(duk);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.anisotropy = 4;

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textur, transparent: true, depthWrite: false, toneMapped: false
  }));
  sprite.scale.set(SKYLTHOJD * duk.width / duk.height, SKYLTHOJD, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/**
 * Var skylten ska sta: ovanpa den hylla i zonen som ligger narmast
 * skyltpunkten i kartan. Har platsen ingen hylla star skylten pa
 * skyltpunkten, i ogonhojd. Har skyltpunkten en egen hojd (y) svavar
 * skylten fritt dar, till exempel over datorerna eller fatoljerna.
 */
export function skyltPlats(layout, plats) {
  if (plats.skylt.y !== undefined) return { x: plats.skylt.x, y: plats.skylt.y, z: plats.skylt.z };
  const hyllor = (layout.shelves || []).filter(h => h.zon === plats.id);
  if (!hyllor.length) return { x: plats.skylt.x, y: UTAN_HYLLA, z: plats.skylt.z };
  const mitt = h => ({ x: h.x + h.bredd / 2, z: h.z + h.djup / 2 });
  const avst = h => Math.hypot(mitt(h).x - plats.skylt.x, mitt(h).z - plats.skylt.z);
  const h = hyllor.reduce((a, b) => (avst(b) < avst(a) ? b : a));
  return { ...mitt(h), y: (h.hojd ?? 1.8) + SKYLTHOJD / 2 + 0.03 };
}

/**
 * Flyttar en skylt sa att den inte sticker in i en vagg eller ett slutet
 * rum, hisschakt eller pelare. En skylt vander sig alltid mot kameran, sa sett fran sidan tar den
 * upp en cirkel med halva skyltbredden som radie. Cirkeln skjuts ut fran
 * allt den overlappar, nagra varv sa att horn ocksa klaras.
 */
export function fritFranVaggar(layout, x, z, radie) {
  const LUFT = 0.05;
  const r = radie + LUFT;
  // Hisschakt och pelare nar upp i skylthojd, sa de raknas som vaggar.
  const hinder = [...layout.walls, ...(layout.blocks || []).filter(b => !b.gangbar),
                  ...(layout.fixtures || []).filter(f => f.typ === "hiss" || f.typ === "pelare")];
  for (let varv = 0; varv < 8; varv++) {
    let flyttad = false;
    for (const o of hinder) {
      const nx = Math.min(Math.max(x, o.x), o.x + o.bredd);
      const nz = Math.min(Math.max(z, o.z), o.z + o.djup);
      const dx = x - nx, dz = z - nz;
      const d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d > 1e-6) {
        x = nx + dx / d * r;
        z = nz + dz / d * r;
      } else {
        // Mitten ligger inne i hindret: ut genom narmaste sida.
        const ut = [[o.x - r - x, 0], [o.x + o.bredd + r - x, 0],
                    [0, o.z - r - z], [0, o.z + o.djup + r - z]];
        const [ux, uz] = ut.reduce((a, b) =>
          Math.abs(a[0] + a[1]) < Math.abs(b[0] + b[1]) ? a : b);
        x += ux; z += uz;
      }
      flyttad = true;
    }
    if (!flyttad) break;
  }
  return { x, z };
}

/**
 * Bygger zoner och skyltar. Ger tillbaka gruppen. Skyltarna star still,
 * sa att det inte ror sig nagot i bilden som man inte sjalv satt igang.
 */
export async function byggZoner(layout, platser) {
  // Typsnittet maste vara laddat innan skylttexten ritas.
  try {
    await Promise.all([
      document.fonts.load(`700 74px Nunito`),
      document.fonts.load(`400 16px Nunito`)
    ]);
  } catch { /* reservtypsnittet duger */ }

  const grupp = new THREE.Group();
  grupp.name = "zoner";
  grupp.add(byggGolvzoner(layout, platser));

  for (const p of platser) {
    const s = byggSkylt(p);
    const { x, y, z } = skyltPlats(layout, p);
    const fri = fritFranVaggar(layout, x, z, s.scale.x / 2);
    s.position.set(fri.x, y, fri.z);
    s.name = "skylt_" + p.id;
    grupp.add(s);
  }

  return { grupp };
}
