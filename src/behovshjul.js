// Hjulet vid entrédörrarna: "Vad vill du göra i dag?"
//
// Valen star pa ett hjul som vrids med pilarna vanster och hoger. Valet i
// mitten ar storst, grannarna blir mindre och svagare ut mot kanterna.
// Enter valjer och Esc stanger. Medan hjulet ar oppet fangar det alla
// tangenter, sa att figuren star still och inget annat oppnas bakom det.

const el = (tagg, attribut = {}, ...barn) => {
  const e = document.createElement(tagg);
  for (const [k, v] of Object.entries(attribut)) {
    if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  e.append(...barn);
  return e;
};

const SYNLIGA = 2;          // sa manga grannar syns at varje hall
const AVSTAND = 136;        // pixlar mellan korten
const VRIDNING = 24;        // grader per steg ut fran mitten

/**
 * skapaBehovshjul(text) ger { visa, stang, oppet, valt }.
 * visa() oppnar hjulet och ger ett Promise med det valda valet ur
 * text.val, eller null om hjulet stangdes.
 */
export function skapaBehovshjul(text, ruta = document.getElementById("behov")) {
  const val = text.val;
  let oppen = null;           // { klar }
  let valt = 0;

  const kort = val.map((v, i) => {
    const k = el("button", { type: "button", class: "behov-kort", tabindex: "-1",
                             "aria-hidden": "true" }, el("span", { text: v.text }));
    k.addEventListener("click", () => (i === valt ? stang(val[i]) : vrid(i - valt)));
    return k;
  });
  const status = el("p", { class: "behov-status", "aria-live": "polite" });
  const vanster = el("button", { type: "button", class: "behov-pil", "aria-label": "Föregående" },
    el("span", { "aria-hidden": "true", text: "‹" }));
  const hoger = el("button", { type: "button", class: "behov-pil", "aria-label": "Nästa" },
    el("span", { "aria-hidden": "true", text: "›" }));
  vanster.addEventListener("click", () => vrid(-1));
  hoger.addEventListener("click", () => vrid(1));
  const valjKnapp = el("button", { type: "button", class: "dialogknapp huvudval" },
    el("span", { text: text.valj }), " ", el("kbd", { text: "Enter" }));
  valjKnapp.addEventListener("click", () => stang(val[valt]));
  const stangKnapp = el("button", { type: "button", class: "dialogknapp" },
    el("span", { text: text.stang }), " ", el("kbd", { text: "Esc" }));
  stangKnapp.addEventListener("click", () => stang(null));

  ruta.replaceChildren(
    el("h2", { id: "behov-rubrik", text: text.rubrik }),
    el("p", { class: "under", text: text.under }),
    el("div", { class: "behov-hjul" }, vanster, el("div", { class: "behov-bana" }, ...kort), hoger),
    status,
    el("div", { class: "knappar" }, valjKnapp, stangKnapp));

  /** Kortets plats i forhallande till mitten, runt hjulet at kortaste hallet. */
  function steg(i) {
    const n = val.length;
    let d = (i - valt) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  function rita() {
    kort.forEach((k, i) => {
      const d = steg(i), a = Math.abs(d);
      k.style.transform =
        `translateX(${d * AVSTAND}px) rotateY(${-d * VRIDNING}deg) scale(${1 - a * 0.14})`;
      k.style.opacity = a > SYNLIGA ? 0 : 1 - a * 0.33;
      k.style.zIndex = 10 - a;
      k.style.visibility = a > SYNLIGA ? "hidden" : "visible";
      k.classList.toggle("vald", d === 0);
    });
    status.textContent = `${val[valt].text} (${valt + 1} av ${val.length})`;
  }

  function vrid(d) {
    valt = (valt + d + val.length) % val.length;
    rita();
  }

  function stang(svar = null) {
    if (!oppen) return;
    const { klar } = oppen;
    oppen = null;
    ruta.classList.remove("syns");
    klar(svar);
  }

  function visa() {
    stang();
    valt = 0;
    rita();
    ruta.classList.add("syns");
    valjKnapp.focus({ preventScroll: true });
    return new Promise(klar => { oppen = { klar }; });
  }

  window.addEventListener("keydown", e => {
    if (!oppen) return;
    // Tab far ga runt bland knapparna, allt annat tar hjulet hand om.
    if (e.key === "Tab") {
      const knappar = [vanster, hoger, valjKnapp, stangKnapp];
      const i = knappar.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); stangKnapp.focus(); }
      else if (!e.shiftKey && i === knappar.length - 1) { e.preventDefault(); vanster.focus(); }
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code === "ArrowLeft" || e.code === "KeyA") vrid(-1);
    else if (e.code === "ArrowRight" || e.code === "KeyD") vrid(1);
    else if (e.repeat) return;
    else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space") {
      // En fokuserad pil eller Stang-knappen gor sitt eget.
      const f = document.activeElement;
      if (f === vanster) vrid(-1);
      else if (f === hoger) vrid(1);
      else if (f === stangKnapp) stang(null);
      else stang(val[valt]);
    } else if (e.code === "Escape") stang(null);
  }, true);
  // Enter och mellanslag slapps efter att hjulet stangts. Utan det har
  // skulle knappen som da har fokus "klickas" av samma tryck.
  window.addEventListener("keyup", e => {
    if ((e.code === "Space" || e.code === "Enter") && ruta.contains(document.activeElement)) {
      e.preventDefault();
    }
  }, true);

  return {
    visa,
    stang: () => stang(null),
    vrid,
    get oppet() { return !!oppen; },
    get valt() { return val[valt]; }
  };
}
