// Bygger hela 3D-varlden ur src/data/layout.json.
//
// Allt som syns har sitt matt ur datafilen, sa andras kartan foljer
// varlden med. Fargerna kommer ur TEMA i src/config/content.js och ar
// hamtade ur fotona: vita hyllor, ljusgratt golv, laxrosa vaggpartier
// och bibliotekets egna farger senap, mint och rosa.

import * as THREE from "three";
import { mat, rundLada, rundLadaMitt, slaIhop } from "./former.js";
import { byggHyllor } from "./bocker.js";
import { byggMobel, pendellampa } from "./mobler.js";

export const VAGGHOJD = 3.20;
const GOLVTJOCKLEK = 0.30;
const PX_PER_METER = 40;

// Vilka vaggar som far annan yta an varmvitt. Namnen ar vaggarnas id.
const LAXROSA_VAGGAR = ["yttre_norr", "labb_ostvagg", "karna_vast", "karna_norr"];
const TEGEL_VAGGAR = ["karna_ost_syd", "karna_ost_mitt"];
// Zoner med beige stengolv i stallet for det grå golvet.
const STENGOLV = ["entre", "trappa_hiss", "trappa_hiss_plan1"];

/** Trappor som gar ner till vaningen under. Dar har golvet ett hal. */
const halIGolvet = layout => layout.fixtures.filter(f => f.typ === "trappa" && f.ner);

/** Delar en rektangel i bitar som inte overlappar halet. */
function utanHal(r, h) {
  const x1 = Math.max(r.x, h.x), x2 = Math.min(r.x + r.bredd, h.x + h.bredd);
  const z1 = Math.max(r.z, h.z), z2 = Math.min(r.z + r.djup, h.z + h.djup);
  if (x1 >= x2 || z1 >= z2) return [r];
  const bitar = [
    { x: r.x, z: r.z, bredd: r.bredd, djup: z1 - r.z },
    { x: r.x, z: z2, bredd: r.bredd, djup: r.z + r.djup - z2 },
    { x: r.x, z: z1, bredd: x1 - r.x, djup: z2 - z1 },
    { x: x2, z: z1, bredd: r.x + r.bredd - x2, djup: z2 - z1 }
  ];
  return bitar.filter(b => b.bredd > 0.001 && b.djup > 0.001);
}

/**
 * At vilket hall en nedatgaende trappa sjunker: bort fran plattan dar
 * man kliver pa. Plattan ligger i forbindelserna i datafilen.
 */
function nerRiktning(layout, f) {
  const fb = (layout.forbindelser || []).find(o => o.fixture === f.id);
  if (!fb) return f.bredd >= f.djup ? "vast" : "norr";
  const px = fb.platta.x + fb.platta.bredd / 2, pz = fb.platta.z + fb.platta.djup / 2;
  const dx = px - (f.x + f.bredd / 2), dz = pz - (f.z + f.djup / 2);
  if (Math.abs(dx) / f.bredd > Math.abs(dz) / f.djup) return dx > 0 ? "vast" : "ost";
  return dz > 0 ? "norr" : "syd";
}

// ---------------------------------------------------------------- golvet

function slumpare(fro) {
  let s = fro;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * Ritar golvets ovansida pa en enda duk: marmormonster, stenplattor och
 * mjuka skuggor under allt som star pa golvet.
 */
function golvDuk(layout, tema) {
  const { bredd, djup } = layout.bounds;
  const P = PX_PER_METER;
  const duk = document.createElement("canvas");
  duk.width = Math.ceil(bredd * P);
  duk.height = Math.ceil(djup * P);
  const c = duk.getContext("2d");
  const slp = slumpare(4711);

  // Bara dar det finns golv. Utanfor ar duken genomskinlig.
  c.save();
  c.beginPath();
  for (const g of layout.floors) c.rect(g.x * P, g.z * P, g.bredd * P, g.djup * P);
  c.clip();

  // Marmor: ljusgra grund med mjuka moln och nagra tunna adror.
  c.fillStyle = tema.golv;
  c.fillRect(0, 0, duk.width, duk.height);
  c.filter = "blur(14px)";
  for (let i = 0; i < 260; i++) {
    c.globalAlpha = 0.10 + slp() * 0.14;
    c.fillStyle = slp() < 0.5 ? tema.golvMonster : "#ffffff";
    c.beginPath();
    c.ellipse(slp() * duk.width, slp() * duk.height, 20 + slp() * 70, 10 + slp() * 40,
              slp() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
  c.filter = "blur(1.2px)";
  c.strokeStyle = tema.golvMonster;
  for (let i = 0; i < 70; i++) {
    c.globalAlpha = 0.25 + slp() * 0.2;
    c.lineWidth = 1 + slp() * 1.5;
    let x = slp() * duk.width, y = slp() * duk.height;
    c.beginPath();
    c.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (slp() - 0.5) * 90; y += (slp() - 0.3) * 60;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  c.filter = "none";
  c.globalAlpha = 1;

  // Stenplattor i entren och trapphallen, i forskjutna rader.
  const PL = 0.6 * P, PH = 0.4 * P;
  for (const zon of layout.zones.filter(z => STENGOLV.includes(z.id))) {
    for (const r of zon.rutor) {
      c.save();
      c.beginPath();
      c.rect(r.x * P, r.z * P, r.bredd * P, r.djup * P);
      c.clip();
      c.fillStyle = tema.stengolvFog;
      c.fillRect(r.x * P, r.z * P, r.bredd * P, r.djup * P);
      for (let rad = 0, y = r.z * P; y < (r.z + r.djup) * P; rad++, y += PH) {
        for (let x = r.x * P - (rad % 2) * PL / 2; x < (r.x + r.bredd) * P; x += PL) {
          const ljus = 0.94 + slp() * 0.1;
          const bas = new THREE.Color(tema.stengolv).multiplyScalar(ljus);
          c.fillStyle = "#" + bas.getHexString();
          c.beginPath();
          c.roundRect(x + 1.5, y + 1.5, PL - 3, PH - 3, 4);
          c.fill();
        }
      }
      c.restore();
    }
  }

  // Mjuka skuggor dar saker star pa golvet. De gor att mobler och
  // vaggar ser ut att sta stadigt, i stallet for att sväva.
  c.filter = "blur(7px)";
  c.fillStyle = "rgba(70, 52, 36, 0.30)";
  const skugga = (o, luft) => {
    c.beginPath();
    c.roundRect((o.x - luft) * P, (o.z - luft) * P,
                (o.bredd + 2 * luft) * P, (o.djup + 2 * luft) * P, 6);
    c.fill();
  };
  for (const v of layout.walls) if (!v.fonster) skugga(v, 0.1);
  for (const b of layout.blocks) if (!b.gangbar) skugga(b, 0.1);
  for (const h of layout.shelves) skugga(h, 0.07);
  for (const f of layout.fixtures) if (f.typ !== "tavla" && !f.ner) skugga(f, 0.06);
  c.filter = "none";

  // Hal dar trapporna gar ner.
  c.globalCompositeOperation = "destination-out";
  for (const h of halIGolvet(layout)) c.fillRect(h.x * P, h.z * P, h.bredd * P, h.djup * P);
  c.globalCompositeOperation = "source-over";
  c.restore();
  return duk;
}

function byggGolv(layout, tema) {
  const grupp = new THREE.Group();
  const kant = mat(tema.vaggKant);
  const hal = halIGolvet(layout);
  let bitar = layout.floors;
  for (const h of hal) bitar = bitar.flatMap(r => utanHal(r, h));
  for (const g of bitar) {
    const golv = new THREE.Mesh(new THREE.BoxGeometry(g.bredd, GOLVTJOCKLEK, g.djup), kant);
    golv.position.set(g.x + g.bredd / 2, -GOLVTJOCKLEK / 2 - 0.001, g.z + g.djup / 2);
    golv.receiveShadow = true;
    grupp.add(golv);
  }

  const { bredd, djup } = layout.bounds;
  const tex = new THREE.CanvasTexture(golvDuk(layout, tema));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const yta = new THREE.Mesh(new THREE.PlaneGeometry(bredd, djup),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.75 }));
  yta.rotation.x = -Math.PI / 2;
  yta.position.set(bredd / 2, 0.001, djup / 2);
  yta.receiveShadow = true;
  yta.name = "golvyta";
  grupp.add(yta);

  // Mjuk mark runt huset, sa att det inte svavar i tomma intet.
  // Marken har samma hal som golvet, annars skymmer den trappschaktet.
  const form = new THREE.Shape();
  form.absarc(0, 0, 90, 0, Math.PI * 2, false);
  for (const h of hal) {
    // Formen ligger i x/y och vrids sedan ner, sa z blir -y.
    const x0 = h.x - bredd / 2, y0 = -(h.z - djup / 2);
    const p = new THREE.Path();
    p.moveTo(x0, y0);
    p.lineTo(x0, y0 - h.djup);
    p.lineTo(x0 + h.bredd, y0 - h.djup);
    p.lineTo(x0 + h.bredd, y0);
    p.closePath();
    form.holes.push(p);
  }
  const mark = new THREE.Mesh(new THREE.ShapeGeometry(form, 48), mat(tema.mark, { roughness: 1 }));
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(bredd / 2, -GOLVTJOCKLEK - 0.01, djup / 2);
  mark.receiveShadow = true;
  grupp.add(mark);
  return grupp;
}

// --------------------------------------------------------------- vaggar

let tegelBild = null;
function tegelTextur(tema, langd) {
  if (!tegelBild) {
    // En meter tegelvagg: stenar 0,25 x 0,08 m i forskjutna rader.
    tegelBild = document.createElement("canvas");
    tegelBild.width = 256; tegelBild.height = 256;
    const c = tegelBild.getContext("2d");
    c.fillStyle = tema.tegelFog;
    c.fillRect(0, 0, 256, 256);
    const slp = slumpare(99);
    const SB = 64, SH = 256 / 12;
    for (let rad = 0; rad < 12; rad++) {
      for (let x = -(rad % 2) * SB / 2; x < 256; x += SB) {
        const bas = new THREE.Color(tema.tegel).multiplyScalar(0.92 + slp() * 0.14);
        c.fillStyle = "#" + bas.getHexString();
        c.beginPath();
        c.roundRect(x + 2, rad * SH + 2, SB - 4, SH - 4, 3);
        c.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(tegelBild);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(langd, VAGGHOJD);
  return tex;
}

/**
 * En fönstervägg från golv till tak: rundade karmar med jämna mellanrum
 * och svagt blått glas emellan. Glaset kastar ingen skugga, sa solen
 * lyser in genom det.
 */
function fonstervagg(v, tema) {
  const g = new THREE.Group();
  const karm = mat(tema.karm);
  const langsX = v.bredd >= v.djup;
  const langd = langsX ? v.bredd : v.djup;
  const tjock = langsX ? v.djup : v.bredd;
  // Del av vaggen, angiven langs dess langd: start, langd, hojd, botten.
  const del = (s, l, h, y0, material, radie) => langsX
    ? rundLada(v.x + s, v.z, l, tjock, h, y0, material, radie)
    : rundLada(v.x, v.z + s, tjock, l, h, y0, material, radie);

  g.add(del(0, langd, 0.14, 0, karm, 0.05));
  g.add(del(0, langd, 0.28, VAGGHOJD - 0.28, karm, 0.08));
  const rutor = Math.max(1, Math.round(langd / 1.4));
  for (let i = 0; i <= rutor; i++) {
    const s = Math.min(Math.max(i * langd / rutor - 0.06, 0), langd - 0.12);
    g.add(del(s, 0.12, VAGGHOJD, 0, karm, 0.04));
  }
  const glas = new THREE.MeshStandardMaterial({
    color: tema.glas, transparent: true, opacity: 0.28, roughness: 0.1,
    metalness: 0.1, depthWrite: false });
  const ruta = langsX
    ? new THREE.BoxGeometry(langd, VAGGHOJD - 0.42, 0.03)
    : new THREE.BoxGeometry(0.03, VAGGHOJD - 0.42, langd);
  const nat = new THREE.Mesh(ruta, glas);
  nat.position.set(v.x + v.bredd / 2, 0.14 + (VAGGHOJD - 0.42) / 2, v.z + v.djup / 2);
  g.add(nat);
  return g;
}

function byggVaggar(layout, tema) {
  const grupp = new THREE.Group();
  for (const v of layout.walls) {
    if (v.fonster) {
      grupp.add(fonstervagg(v, tema));
      continue;
    }
    let material = mat(tema.vagg);
    if (LAXROSA_VAGGAR.includes(v.id)) material = mat(tema.laxrosa);
    if (TEGEL_VAGGAR.includes(v.id)) {
      material = new THREE.MeshStandardMaterial({
        map: tegelTextur(tema, Math.max(v.bredd, v.djup)), roughness: 0.9 });
    }
    grupp.add(rundLada(v.x, v.z, v.bredd, v.djup, VAGGHOJD, 0, material, 0.1));
  }

  // Slutna rum, som toaletterna, blir rundade block med en farglad dorr.
  const dorrar = { toalett: { sida: "syd", farg: tema.mint, antal: 2 },
                   barnvagn: { sida: "norr", farg: tema.rosa, antal: 1 } };
  for (const b of layout.blocks) {
    if (b.gangbar) continue;
    grupp.add(rundLada(b.x, b.z, b.bredd, b.djup, VAGGHOJD, 0, mat(tema.vagg), 0.12));
    const d = dorrar[b.id];
    if (!d) continue;
    const z = d.sida === "syd" ? b.z + b.djup + 0.01 : b.z - 0.01;
    for (let i = 0; i < d.antal; i++) {
      const x = b.x + b.bredd * (i + 1) / (d.antal + 1);
      grupp.add(rundLadaMitt(x, z, 0.9, 0.05, 2.05, 0, mat(d.farg), 0.03));
      grupp.add(rundLadaMitt(x + 0.3, z + (d.sida === "syd" ? 0.03 : -0.03),
                             0.08, 0.03, 0.08, 1.0, mat(tema.automat), 0.01));
    }
  }
  return grupp;
}

// --------------------------------------------------------------- lampor

/** Pendellampor over de zoner som TEMA namner, fler over stora zoner. */
function byggLampor(layout, tema) {
  const grupp = new THREE.Group();
  // En lampa far inte hanga inuti en vagg eller ett slutet rum.
  const LUFT = 0.6;
  const iVagen = (x, z) => [...layout.walls, ...layout.blocks.filter(b => !b.gangbar)]
    .some(o => x > o.x - LUFT && x < o.x + o.bredd + LUFT &&
               z > o.z - LUFT && z < o.z + o.djup + LUFT);

  for (const id of tema.lampor || []) {
    const zon = layout.zones.find(z => z.id === id);
    if (!zon) continue;
    for (const r of zon.rutor) {
      const yta = r.bredd * r.djup;
      if (yta < 6) continue;
      const antal = Math.min(2, Math.max(1, Math.round(yta / 45)));
      const langsX = r.bredd >= r.djup;
      for (let i = 0; i < antal; i++) {
        const a = (i + 0.5) / antal;
        const x = langsX ? r.x + r.bredd * a : r.x + r.bredd / 2;
        const z = langsX ? r.z + r.djup / 2 : r.z + r.djup * a;
        if (!iVagen(x, z)) grupp.add(pendellampa(x, z, tema));
      }
    }
  }
  return grupp;
}

// ----------------------------------------------------------------- allt

export function byggVarld(layout, tema) {
  const varld = new THREE.Group();
  varld.name = "varld";

  varld.add(byggGolv(layout, tema));
  varld.add(byggVaggar(layout, tema));

  const hyllor = byggHyllor(layout, tema);
  varld.add(hyllor.grupp);
  varld.userData.antalBocker = hyllor.antalBocker;

  const mobler = new THREE.Group();
  mobler.name = "mobler";
  for (const f of layout.fixtures) {
    const m = f.ner ? { ...f, nerMot: nerRiktning(layout, f) } : f;
    mobler.add(byggMobel(m, tema, layout.fixtures));
  }
  varld.add(mobler);

  varld.add(byggLampor(layout, tema));
  return slaIhop(varld);
}

/** Varmt, mjukt ljus, som en ljus eftermiddag i biblioteket. */
export function byggLjus(layout, tema) {
  const grupp = new THREE.Group();

  grupp.add(new THREE.HemisphereLight(0xfff4e6, 0xd9c6ad, 1.7));

  const sol = new THREE.DirectionalLight(0xfff0d8, 2.3);
  const { bredd, djup } = layout.bounds;
  sol.position.set(bredd + 12, 30, djup * 0.2);
  sol.target.position.set(bredd / 2, 0, djup / 2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.bias = -0.0005;
  sol.shadow.normalBias = 0.02;

  // Skuggkameran tacker precis byggnaden, annars blir skuggorna grova.
  const r = Math.max(bredd, djup) * 0.62;
  const k = sol.shadow.camera;
  k.left = -r; k.right = r; k.top = r; k.bottom = -r;
  k.near = 1; k.far = 110;

  grupp.add(sol);
  grupp.add(sol.target);
  return grupp;
}
