// Rutan langst ner pa mobil och surfplatta, i stallet for styrningen.
//
// Den har tre lagen, som alla visas pa samma stalle:
//   meny   - ett rutnat med valen: "Vad vill du gora i dag?"
//   pa vag - vart figuren ar pa vag, och en knapp for att avbryta
//   framme - texten for platsen och en knapp for att valja nytt. En
//            stapel i knappen fylls medan tiden gar, sa att man ser
//            nar figuren gar tillbaka av sig sjalv.

const el = (tagg, attribut = {}, ...barn) => {
  const e = document.createElement(tagg);
  for (const [k, v] of Object.entries(attribut)) {
    if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  e.append(...barn);
  return e;
};

/**
 * skapaMobilmeny(text, val) ger { meny, paVag, framme, dolj, lage, hojd }.
 *   meny()            visar rutnatet. Ger ett Promise med det valda valet.
 *   paVag(rubrik, under, avbryt)  visar vart figuren ar pa vag.
 *   framme(rubrik, text, sekunder, igen)  visar att figuren ar framme.
 *   hojd              hur manga pixlar rutan tacker nedtill.
 */
export function skapaMobilmeny(text, val, ruta = document.getElementById("mobil")) {
  let lage = null;
  let valt = null;            // klar() for menyn som ar oppen

  function visa(nyttLage, ...barn) {
    lage = nyttLage;
    ruta.className = "syns " + nyttLage;
    ruta.replaceChildren(...barn);
  }

  function meny() {
    const knappar = val.map(v => {
      const k = el("button", { type: "button", class: "mobil-val" }, el("span", { text: v.text }));
      k.addEventListener("click", () => {
        const klar = valt;
        valt = null;
        klar?.(v);
      });
      return k;
    });
    visa("meny",
      el("h2", { id: "mobil-rubrik", text: text.rubrik }),
      el("p", { class: "under", text: text.under }),
      el("div", { class: "mobil-rutnat" }, ...knappar));
    ruta.setAttribute("role", "dialog");
    ruta.scrollTop = 0;
    return new Promise(klar => { valt = klar; });
  }

  function paVag(rubrik, under, avbryt) {
    const knapp = el("button", { type: "button", class: "dialogknapp", text: text.avbryt });
    knapp.addEventListener("click", avbryt);
    visa("pavag",
      el("div", { class: "mobil-rad" },
        el("div", { class: "mobil-text" },
          el("h2", { id: "mobil-rubrik", text: rubrik }),
          el("p", { class: "under", text: under })),
        knapp));
    ruta.setAttribute("role", "status");
  }

  function framme(rubrik, rad, sekunder, igen) {
    const knapp = el("button", { type: "button", class: "dialogknapp huvudval mobil-igen" },
      el("span", { class: "mobil-tid", style: `animation-duration: ${sekunder}s` }),
      el("span", { text: text.igen }));
    knapp.addEventListener("click", igen);
    visa("framme",
      el("h2", { id: "mobil-rubrik", text: rubrik }),
      ...(rad ? [el("p", { text: rad })] : []),
      el("div", { class: "knappar" }, knapp));
    ruta.setAttribute("role", "status");
  }

  function dolj() {
    lage = null;
    valt = null;
    ruta.className = "";
    ruta.replaceChildren();
  }

  return {
    meny, paVag, framme, dolj,
    get lage() { return lage; },
    get hojd() {
      if (!lage) return 0;
      return window.innerHeight - ruta.getBoundingClientRect().top;
    },
    /** Trycker pa valet med id mal, som om man rort vid skarmen. For proven. */
    valj(mal) {
      const v = val.find(x => x.mal === mal);
      if (!v || !valt) return false;
      const klar = valt;
      valt = null;
      klar(v);
      return true;
    }
  };
}
