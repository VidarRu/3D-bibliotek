// Den lilla rutan langst ner i mitten: instruktionen och alla fragor.
//
// Alla rutor dyker upp pa samma stalle och fungerar likadant, sa att man
// alltid vet var man ska titta. Mellanslag ar Ja och Esc ar Nej. Bara en
// ruta i taget: en ny fraga stanger den som var oppen.

const el = (tagg, attribut = {}, ...barn) => {
  const e = document.createElement(tagg);
  for (const [k, v] of Object.entries(attribut)) {
    if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  e.append(...barn);
  return e;
};

const TANGENTNAMN = { Space: "Mellanslag", Escape: "Esc", Digit1: "1", Digit2: "2" };

/**
 * fraga({ rubrik, under, rader, knappar, stoppar }) visar rutan.
 *   knappar: [{ text, tangenter: ["Space"], varde, huvudval }]
 *   stoppar: figuren star still medan rutan ar oppen.
 * Ger tillbaka { svar, stang }. svar ar ett Promise med knappens varde,
 * eller null om rutan stangdes utan svar.
 */
export function skapaDialog(ruta = document.getElementById("dialog")) {
  let oppen = null;            // { knappar, stoppar, klar }

  function stang(varde = null) {
    if (!oppen) return;
    const { klar } = oppen;
    oppen = null;
    ruta.classList.remove("syns");
    ruta.replaceChildren();
    klar(varde);
  }

  function fraga({ rubrik, under = "", rader = [], knappar, stoppar = false }) {
    stang();
    let klar;
    const svar = new Promise(r => { klar = r; });
    const knappEl = knappar.map(k => {
      const b = el("button", { type: "button", class: "dialogknapp" + (k.huvudval ? " huvudval" : "") },
        el("span", { text: k.text }));
      for (const t of k.tangenter || []) b.append(" ", el("kbd", { text: TANGENTNAMN[t] || t }));
      b.addEventListener("click", () => stang(k.varde));
      return b;
    });
    ruta.replaceChildren(
      el("h2", { id: "dialog-rubrik", text: rubrik }),
      ...(under ? [el("p", { class: "under", text: under })] : []),
      ...rader.map(r => el("p", { text: r })),
      el("div", { class: "knappar" }, ...knappEl));
    ruta.classList.add("syns");
    const denna = { knappar, knappEl, stoppar, klar };
    oppen = denna;
    // En ruta som stoppar figuren far fokus, sa att Tab och skarmlasare
    // hamnar ratt. En liten fraga i forbifarten tar inte fokus.
    if (stoppar) (knappEl.find((_, i) => knappar[i].huvudval) || knappEl[0]).focus({ preventScroll: true });
    return { svar, stang: () => { if (oppen === denna) stang(); } };
  }

  // Tangenterna fangas forst av allt, sa att Esc inte ocksa stanger
  // nagot annat bakom rutan.
  window.addEventListener("keydown", e => {
    if (!oppen) return;
    const i = oppen.knappar.findIndex(k => (k.tangenter || []).includes(e.code));
    if (i >= 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) stang(oppen.knappar[i].varde);
      return;
    }
    if (e.key === "Tab" && ruta.contains(document.activeElement)) {
      const forsta = oppen.knappEl[0], sista = oppen.knappEl.at(-1);
      if (e.shiftKey && document.activeElement === forsta) { e.preventDefault(); sista.focus(); }
      else if (!e.shiftKey && document.activeElement === sista) { e.preventDefault(); forsta.focus(); }
    }
  }, true);
  // Mellanslag slapps efter att rutan stangts. Utan det har skulle
  // knappen i nasta ruta "klickas" av samma tryck.
  window.addEventListener("keyup", e => {
    if (e.code === "Space" && document.activeElement?.closest?.("#dialog")) e.preventDefault();
  }, true);

  return {
    fraga,
    stang: () => stang(),
    get oppen() { return !!oppen; },
    get stoppar() { return !!oppen?.stoppar; },
    get rubrik() { return oppen ? ruta.querySelector("h2").textContent : null; }
  };
}
