// Listan till hoger: alla platser som vanlig text, med en knapp som visar
// vagen. Listan gar att anvanda utan att spela, och med tangentbordet.

import { SIDA, OPPETTIDER, KONTAKT, MINISPEL } from "./config/content.js";

const el = (tagg, attribut = {}, ...barn) => {
  const e = document.createElement(tagg);
  for (const [k, v] of Object.entries(attribut)) {
    if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  e.append(...barn);
  return e;
};

// ---------------------------------------------------------- öppettider

/** Dagens rad i OPPETTIDER. Listan borjar pa mandag, Date pa sondag. */
export function idag(datum = new Date()) {
  return OPPETTIDER[(datum.getDay() + 6) % 7];
}

export function idagText(datum = new Date()) {
  const d = idag(datum);
  return /stängt/i.test(d.tid) ? SIDA.stangtIdag : SIDA.oppetIdag.replace("{tid}", d.tid);
}

function oppettidTabell() {
  const dagens = idag();
  const tabell = el("table", { class: "oppettider" },
    el("caption", { text: SIDA.oppettiderRubrik }));
  for (const rad of OPPETTIDER) {
    const tr = el("tr", rad === dagens ? { class: "idag" } : {},
      el("th", { scope: "row", text: rad.dag }), el("td", { text: rad.tid }));
    tabell.append(tr);
  }
  return tabell;
}

/** Innehallet i en infopunkt, som anvands bade pa kortet och i listan. */
export function infoInnehall(info) {
  const del = el("div", { class: "info-text" });
  for (const rad of info.rader) del.append(el("p", { text: rad }));
  if (info.visaOppettider) {
    del.append(oppettidTabell());
    del.append(el("p", { class: "liten", text: KONTAKT.avvikelser }));
    del.append(el("h4", { text: SIDA.kontaktRubrik }),
      el("p", { class: "kontakt" },
        KONTAKT.namn, el("br"), KONTAKT.adress, el("br"),
        `Telefon ${KONTAKT.telefon}`, el("br"), KONTAKT.epost, el("br"), KONTAKT.hemsida));
  }
  return del;
}

const plan = (mall, n) => mall.replace("{plan}", n);

/**
 * Bygger panelen i elementet #panel.
 * valj(id) anropas nar nagon trycker pa "Visa vagen".
 * sluta() anropas nar nagon trycker pa "Sluta visa".
 * valjVaning(plan) anropas nar nagon trycker pa en vaningsknapp.
 */
export function byggPanel(platser, { valj, sluta, valjVaning }, info = []) {
  const panel = document.getElementById("panel");
  const knappar = new Map();
  const rader = new Map();

  const fallKnapp = el("button", {
    class: "fall", type: "button", "aria-expanded": "true",
    "aria-controls": "panel-innehall", text: SIDA.fallIhop
  });

  const innehall = el("div", { id: "panel-innehall" });

  const grupp = (rubrik, lista, avdelning) => {
    const ul = el("ul", { class: "platser" });
    for (const p of lista) {
      const knapp = el("button", { type: "button", class: "visa",
                                   "aria-label": `${SIDA.knappVisaVag} till ${p.namn}`,
                                   text: SIDA.knappVisaVag });
      knapp.addEventListener("click", () => {
        if (knapp.classList.contains("aktiv")) sluta();
        else valj(p.id);
      });
      knappar.set(p.id, knapp);
      const li = el("li", { class: "plats" + (avdelning ? " avdelning" : ""),
                            style: `--farg: ${p.farg}` },
        el("span", { class: "prick", "aria-hidden": "true" }),
        el("div", { class: "text" },
          el("h4", {}, el("span", { text: p.namn }),
            el("span", { class: "hittad-marke", text: MINISPEL.hittadMarke })),
          el("p", { text: p.beskrivning })),
        knapp);
      ul.append(li);
      rader.set(p.id, li);
    }
    return el("section", {}, el("h3", { class: "grupp", text: rubrik }), ul);
  };

  // En del per vaning, med avdelningar och ovriga platser.
  const planer = [...new Set(platser.map(p => p.plan ?? 0))].sort();
  const vaningsdelar = planer.map(n => {
    const har = platser.filter(p => (p.plan ?? 0) === n);
    const delar = [el("h2", { class: "vaning", text: plan(SIDA.vaningGrupp, n) })];
    if (har.some(p => p.avdelning)) delar.push(grupp(SIDA.avdelningarRubrik, har.filter(p => p.avdelning), true));
    if (har.some(p => !p.avdelning)) delar.push(grupp(SIDA.ovrigtRubrik, har.filter(p => !p.avdelning), false));
    return el("section", { class: "vaningsdel" }, ...delar);
  });

  // Knappar for att byta vaning direkt, utan att ga till trappan.
  const vaningsknappar = new Map();
  const vaningsval = el("div", { class: "vaningsval", role: "group", "aria-label": SIDA.vaningRubrik });
  for (const n of planer) {
    const k = el("button", { type: "button", "aria-pressed": "false", text: plan(SIDA.vaningKnapp, n) });
    k.addEventListener("click", () => valjVaning && valjVaning(n));
    vaningsknappar.set(n, k);
    vaningsval.append(k);
  }
  const undertitel = el("small", { text: plan(SIDA.undertitel, planer[0] ?? 0) });

  // "Bra att veta": en utfallbar rad per infopunkt.
  const braAttVeta = el("ul", { class: "platser" });
  for (const i of info) {
    const knapp = el("button", { type: "button", class: "visa",
                                 "aria-label": `${SIDA.knappVisaVag} till infopunkten ${i.rubrik}`,
                                 text: SIDA.knappVisaVag });
    knapp.addEventListener("click", () => {
      if (knapp.classList.contains("aktiv")) sluta();
      else valj(i.id);
    });
    knappar.set(i.id, knapp);
    const detaljer = el("details", { class: "info" },
      el("summary", {}, el("span", { class: "i-prick", "aria-hidden": "true", text: "i" }),
        el("span", { text: i.rubrik })),
      infoInnehall(i), knapp);
    braAttVeta.append(el("li", { class: "plats info-rad" }, detaljer));
  }

  innehall.append(
    ...vaningsdelar,
    el("section", { class: "vaningsdel" }, el("h2", { class: "vaning", text: SIDA.braAttVeta }), braAttVeta));

  panel.append(
    el("header", {},
      el("h1", {}, el("span", { text: SIDA.titel }), " ", undertitel),
      el("p", { class: "idag-chip", text: idagText() }),
      planer.length > 1 ? vaningsval : "",
      el("p", { class: "listrubrik", text: SIDA.listrubrik })),
    fallKnapp,
    innehall);

  fallKnapp.addEventListener("click", () => {
    const ihop = panel.classList.toggle("ihop");
    fallKnapp.textContent = ihop ? SIDA.fallUt : SIDA.fallIhop;
    fallKnapp.setAttribute("aria-expanded", String(!ihop));
  });

  /** Markerar vilken plats som har vagvisning just nu, eller ingen. */
  function markera(aktivId) {
    for (const [id, knapp] of knappar) {
      const aktiv = id === aktivId;
      knapp.classList.toggle("aktiv", aktiv);
      knapp.textContent = aktiv ? SIDA.knappSluta : SIDA.knappVisaVag;
      knapp.setAttribute("aria-pressed", String(aktiv));
    }
  }

  /** Markerar de avdelningar som ar funna i minispelet. */
  function markeraFunna(ids) {
    for (const [id, li] of rader) li.classList.toggle("funnen", ids.includes(id));
  }

  /** Visar vilken vaning figuren ar pa. */
  function visaVaning(n) {
    undertitel.textContent = plan(SIDA.undertitel, n);
    for (const [p, k] of vaningsknappar) {
      k.setAttribute("aria-pressed", String(p === n));
      k.classList.toggle("vald", p === n);
    }
  }

  return { panel, markera, markeraFunna, visaVaning };
}

// ---------------------------------------------------------- meddelanden

let doljTimer = null;

/** Visar en kort glad ruta overst. Langd i sekunder, 0 = tills vidare. */
export function meddela(text, langd = 3, under = "") {
  const ruta = document.getElementById("meddelande");
  ruta.replaceChildren(el("span", { class: "huvud", text }));
  if (under) ruta.append(el("span", { class: "under", text: under }));
  ruta.classList.remove("syns");
  void ruta.offsetWidth;              // startar om animationen
  ruta.classList.add("syns");
  clearTimeout(doljTimer);
  if (langd > 0) doljTimer = setTimeout(() => ruta.classList.remove("syns"), langd * 1000);
}

export function doljMeddelande() {
  clearTimeout(doljTimer);
  document.getElementById("meddelande").classList.remove("syns");
}

export const fyllI = (mall, namn) => mall.replace("{namn}", namn);

// ------------------------------------------------------------ infokortet

/** Visar infokortet nederst, eller doljer det om info ar null. */
export function visaInfokort(info, stang) {
  const kort = document.getElementById("infokort");
  if (!info) {
    kort.classList.remove("syns");
    return;
  }
  const knapp = el("button", { type: "button", class: "stang", text: SIDA.stangKort });
  knapp.addEventListener("click", stang);
  kort.replaceChildren(
    el("div", { class: "kort-huvud" },
      el("span", { class: "i-prick stor", "aria-hidden": "true", text: "i" }),
      el("h2", { text: info.rubrik }),
      knapp),
    infoInnehall(info));
  kort.classList.remove("syns");
  void kort.offsetWidth;              // startar om animationen
  kort.classList.add("syns");
}

// ------------------------------------------------------ minispelet

const ersatt = (mall, varden) =>
  mall.replace(/\{(\w+)\}/g, (_, k) => (k in varden ? varden[k] : `{${k}}`));
export { ersatt };

/** Brickan uppe till vanster: rubrik, "3 av 6" och en prick per avdelning. */
export function byggForlopp(avdelningar) {
  const ruta = document.getElementById("forlopp");
  const text = el("span", { class: "rakning" });
  const prickar = new Map();
  // En rad prickar per vaning.
  const rader = new Map();
  for (const a of avdelningar) {
    const n = a.plan ?? 0;
    if (!rader.has(n)) rader.set(n, el("div", { class: "prickrad", "aria-hidden": "true" }));
    const p = el("span", { class: "forlopp-prick", style: `--farg: ${a.farg}`, title: a.namn });
    prickar.set(a.id, p);
    rader.get(n).append(p);
  }
  ruta.replaceChildren(
    el("div", { class: "forlopp-rubrik" },
      el("span", { text: MINISPEL.rubrik }), " · ", text),
    ...[...rader.keys()].sort().map(n => rader.get(n)));

  function uppdatera(funna) {
    text.textContent = ersatt(MINISPEL.rakning, { antal: funna.length, totalt: avdelningar.length });
    for (const [id, p] of prickar) {
      const nu = funna.includes(id);
      if (nu && !p.classList.contains("fylld")) {
        p.classList.add("fylld", "studs");
        setTimeout(() => p.classList.remove("studs"), 600);
      } else if (!nu) p.classList.remove("fylld");
    }
  }
  uppdatera([]);
  return { uppdatera };
}

/**
 * Grattiskortet. Fokus flyttas till "Fortsatt utforska", och Esc eller
 * knapparna stanger det. Ger tillbaka en funktion som stanger kortet.
 */
export function visaGrattis(totalt, { spelaIgen, fortsatt }) {
  const ruta = document.getElementById("grattis");
  const igen = el("button", { type: "button", class: "visa stor", text: MINISPEL.spelaIgen });
  const vidare = el("button", { type: "button", class: "visa stor huvudval", text: MINISPEL.fortsatt });
  const tidigareFokus = document.activeElement;

  function stang() {
    ruta.classList.remove("syns");
    ruta.removeEventListener("keydown", tangent);
    if (tidigareFokus && tidigareFokus.focus) tidigareFokus.focus({ preventScroll: true });
  }
  function tangent(e) {
    if (e.key === "Escape") { e.stopPropagation(); stang(); fortsatt(); }
    // Tab stannar inne i kortet medan det ar oppet.
    if (e.key === "Tab") {
      const forsta = igen, sista = vidare;
      if (e.shiftKey && document.activeElement === forsta) { e.preventDefault(); sista.focus(); }
      else if (!e.shiftKey && document.activeElement === sista) { e.preventDefault(); forsta.focus(); }
    }
  }
  igen.addEventListener("click", () => { stang(); spelaIgen(); });
  vidare.addEventListener("click", () => { stang(); fortsatt(); });

  ruta.replaceChildren(
    el("div", { class: "grattis-kort" },
      el("div", { class: "stjarnor", "aria-hidden": "true", text: "★ ★ ★" }),
      el("h2", { id: "grattis-rubrik", text: MINISPEL.grattisRubrik }),
      el("p", { text: ersatt(MINISPEL.grattisText, { totalt }) }),
      el("div", { class: "knappar" }, igen, vidare)));
  ruta.classList.add("syns");
  ruta.addEventListener("keydown", tangent);
  vidare.focus({ preventScroll: true });
  return stang;
}

// --------------------------------------------------------------- bokjakt

/**
 * Av/pa-knappar for bokjakten: en pa poangraden uppe till vanster och en
 * i listan. vaxla() anropas nar nagon trycker. uppdatera(pa, status)
 * visar lage och poang.
 */
export function byggBokjaktRad(text, vaxla) {
  const rad = document.getElementById("bokjakt");
  const knappar = [];
  const ny = () => {
    const k = el("button", { type: "button", class: "vaxel", "aria-pressed": "false" },
      el("span", { class: "vaxel-namn", text: text.knapp }),
      el("span", { class: "vaxel-spar", "aria-hidden": "true" }, el("span", { class: "vaxel-knopp" })),
      el("span", { class: "vaxel-lage" }));
    k.addEventListener("click", vaxla);
    knappar.push(k);
    return k;
  };
  const poang = el("span", { class: "poang", role: "status", "aria-live": "polite" });
  rad.replaceChildren(ny(), poang);

  // Samma knapp i listan, med en kort forklaring.
  const iListan = el("div", { class: "bokjakt-i-listan" }, ny(),
    el("p", { text: text.forklaring }));
  document.querySelector("#panel header").append(iListan);

  function uppdatera(pa, status) {
    for (const k of knappar) {
      k.setAttribute("aria-pressed", String(pa));
      k.classList.toggle("pa", pa);
      k.querySelector(".vaxel-lage").textContent = pa ? text.pa : text.av;
    }
    poang.hidden = !pa;
    const mall = status.bocker === 1 ? text.rakningEn : text.rakning;
    poang.textContent = pa ? "📚 " + ersatt(mall, status) : "";
  }

  /** Liten studs pa poangen nar den andras. */
  function studsa() {
    poang.classList.remove("studs");
    void poang.offsetWidth;
    poang.classList.add("studs");
  }
  return { uppdatera, studsa };
}
