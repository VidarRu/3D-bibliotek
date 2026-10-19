// Rutan langst ner pa mobil och surfplatta, i stallet for styrningen.
//
// Den har fyra lagen, som alla visas pa samma stalle:
//   meny   - ett rutnat med valen: "Vad vill du gora i dag?", och
//            overst en bred knapp for att utforska sjalv
//   utforska - en smal list: tryck pa golvet, och en knapp till menyn
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

// Det man far fran menyn nar man trycker pa "Jag vill utforska sjalv".
export const UTFORSKA = { utforska: true };

/**
 * skapaMobilmeny(text, val) ger { meny, utforska, paVag, framme, dolj, gom, lage, hojd }.
 *   meny()            visar rutnatet. Ger ett Promise med det valda valet,
 *                     eller UTFORSKA.
 *   utforska(rubrik, rad, visaMeny)  visar listen nar man utforskar sjalv.
 *   gom(ja)           gommer listen medan nagot annat ligger dar.
 *   paVag(rubrik, under, avbryt)  visar vart figuren ar pa vag.
 *   framme(rubrik, text, sekunder, igen)  visar att figuren ar framme.
 *   hojd              hur manga pixlar rutan tacker nedtill.
 */
export function skapaMobilmeny(text, val, ruta = document.getElementById("mobil")) {
  let lage = null;
  let valt = null;            // klar() for menyn som ar oppen
  let gomd = false;

  function visa(nyttLage, ...barn) {
    lage = nyttLage;
    gomd = false;
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
    const utforska = el("button", { type: "button", class: "mobil-utforska" },
      el("span", { text: text.utforska }),
      el("span", { class: "liten", text: text.utforskaUnder }));
    utforska.addEventListener("click", () => {
      const klar = valt;
      valt = null;
      klar?.(UTFORSKA);
    });
    visa("meny",
      el("h2", { id: "mobil-rubrik", text: text.rubrik }),
      utforska,
      el("p", { class: "under", text: text.under }),
      el("div", { class: "mobil-rutnat" }, ...knappar));
    ruta.setAttribute("role", "dialog");
    ruta.scrollTop = 0;
    return new Promise(klar => { valt = klar; });
  }

  function utforska(rubrik, rad, visaMeny) {
    const knapp = el("button", { type: "button", class: "dialogknapp huvudval", text: text.visaMeny });
    knapp.addEventListener("click", visaMeny);
    visa("utforska",
      el("div", { class: "mobil-rad" },
        el("div", { class: "mobil-text" },
          el("h2", { id: "mobil-rubrik", text: rubrik }),
          el("p", { class: "under", text: rad })),
        knapp));
    ruta.setAttribute("role", "status");
  }

  function gom(ja) {
    if (!lage || ja === gomd) return;
    gomd = ja;
    ruta.classList.toggle("gomd", ja);
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
    gomd = false;
    ruta.className = "";
    ruta.replaceChildren();
  }

  return {
    meny, utforska, paVag, framme, dolj, gom,
    get lage() { return lage; },
    get hojd() {
      if (!lage || gomd) return 0;
      return window.innerHeight - ruta.getBoundingClientRect().top;
    },
    /** Trycker pa valet med id mal, som om man rort vid skarmen. For proven.
     *  "utforska" ar knappen overst. */
    valj(mal) {
      const v = mal === "utforska" ? UTFORSKA : val.find(x => x.mal === mal);
      if (!v || !valt) return false;
      const klar = valt;
      valt = null;
      klar(v);
      return true;
    }
  };
}
