// Det som visas ovanpa 3D-bilden: meddelanden, infokortet och rutorna
// for minispelen.

import { SIDA, OPPETTIDER, KONTAKT, MINISPEL, RUTOR } from "./config/content.js";

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

// ---------------------------------------------------------- meddelanden

let doljTimer = null;

/** Visar en kort ruta overst. Langd i sekunder, 0 = tills vidare. */
export function meddela(text, langd = 4.5, under = "") {
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

/** Laser upp text med webblasarens talsyntes, om den finns. */
const tal = typeof speechSynthesis !== "undefined" ? speechSynthesis : null;

function lasUppKnapp(info) {
  if (!tal || typeof SpeechSynthesisUtterance === "undefined") return "";
  const knapp = el("button", { type: "button", class: "stang", text: SIDA.lasUpp });
  knapp.addEventListener("click", () => {
    if (tal.speaking) { tal.cancel(); return; }
    const yttrande = new SpeechSynthesisUtterance([info.rubrik, ...info.rader].join(". "));
    yttrande.lang = "sv-SE";
    const rost = tal.getVoices().find(r => r.lang?.startsWith("sv"));
    if (rost) yttrande.voice = rost;
    yttrande.onend = yttrande.onerror = () => { knapp.textContent = SIDA.lasUpp; };
    knapp.textContent = SIDA.slutaLasa;
    tal.speak(yttrande);
  });
  return knapp;
}

/** Visar infokortet nederst, eller doljer det om info ar null. */
export function visaInfokort(info, stang) {
  const kort = document.getElementById("infokort");
  tal?.cancel();
  if (!info) {
    kort.classList.remove("syns");
    return;
  }
  const knapp = el("button", { type: "button", class: "stang" },
    el("span", { text: SIDA.stangKort }), " ", el("kbd", { text: "Esc" }));
  knapp.addEventListener("click", stang);
  kort.replaceChildren(
    el("div", { class: "kort-huvud" },
      el("span", { class: "i-prick stor", "aria-hidden": "true", text: "i" }),
      el("h2", { text: info.rubrik })),
    infoInnehall(info),
    el("div", { class: "kort-fot" }, lasUppKnapp(info), knapp));
  kort.classList.add("syns");
}

// ------------------------------------------------------ minispelet

const ersatt = (mall, varden) =>
  mall.replace(/\{(\w+)\}/g, (_, k) => (k in varden ? varden[k] : `{${k}}`));
export { ersatt };

/** Avsluta-knappen som alla spelrutor har. */
function avslutaKnapp(avsluta) {
  const k = el("button", { type: "button", class: "avsluta", text: RUTOR.avsluta });
  k.addEventListener("click", avsluta);
  return k;
}

/**
 * Brickan uppe till vanster medan orienteringen pagar: rubrik, "3 av 6",
 * en prick per avdelning och en knapp for att avsluta.
 */
export function byggForlopp(avdelningar, avsluta) {
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
    ...[...rader.keys()].sort().map(n => rader.get(n)),
    avslutaKnapp(avsluta));

  function uppdatera(funna) {
    text.textContent = ersatt(MINISPEL.rakning, { antal: funna.length, totalt: avdelningar.length });
    for (const [id, p] of prickar) {
      const nu = funna.includes(id);
      p.classList.toggle("fylld", nu);
    }
  }
  uppdatera([]);
  return { uppdatera, visa: syns => { ruta.hidden = !syns; } };
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
 * Rutan uppe till vanster medan bokjakten pagar: poang och en knapp for
 * att avsluta. uppdatera(status) visar poangen.
 */
export function byggBokjaktRuta(text, avsluta) {
  const ruta = document.getElementById("bokjakt");
  const poang = el("span", { class: "poang", role: "status", "aria-live": "polite" });
  ruta.replaceChildren(
    el("div", { class: "forlopp-rubrik", text: text.namn }), poang, avslutaKnapp(avsluta));

  function uppdatera(status) {
    const mall = status.bocker === 1 ? text.rakningEn : text.rakning;
    poang.textContent = ersatt(mall, status);
  }
  return { uppdatera, visa: syns => { ruta.hidden = !syns; } };
}
