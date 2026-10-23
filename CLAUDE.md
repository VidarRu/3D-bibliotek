# 3D-bibliotek

En 3D-karta över ett folkbibliotek som man går runt i med en liten figur.
Det här repot gäller Västerviks stadsbibliotek, men tanken är att samma
motor ska användas för en hel serie bibliotek. Allt som är specifikt för
ett bibliotek ska därför ligga i datafiler, inte i koden.

## Syfte och målgrupp

Kartan är till för besökare som är ängsliga, har en NPF-diagnos eller av
andra skäl vill planera sitt besök i förväg. Man ska kunna se hur det ser
ut, var saker finns och hur man tar sig dit, innan man går dit på riktigt.

Det leder till några principer som går före allt annat:

- **Lugnt och förutsägbart.** Inget gungar, studsar, blinkar eller rör sig
  av sig självt. Inga rutor som alltid syns. Kvar på skärmen är kartan och
  en liten `?`-knapp.
- **Fråga först.** Information visas inte förrän man har sagt ja, till
  exempel "Vill du veta vad det här är?" på infoplattorna.
- **Alla rutor fungerar likadant** och dyker upp på samma ställe, längst ner
  i mitten. Mellanslag är alltid Ja, Esc är alltid Nej eller Stäng
  (`src/dialog.js`).
- **Dämpad palett** i beige, brunt och mörkrött. Starka färger gör kartan
  plottrig. Undantag: de gula vägvisningsprickarna och gröna
  nödutgångsskyltar.
- **Utgå från besökarens behov**, inte från bibliotekets avdelningar.
  Hjulet vid entrén frågar "Vad vill du göra i dag?" (låna en dator, gå på
  toaletten, hitta en plats att amma, äta medhavd mat …) och gula prickar
  visar sedan vägen, även till en annan våning.
- **Spel är frivilliga.** Biblioteksorientering och Bokjakten startas bara
  i Labbet, efter frågan "Vill du utmana dig själv lite grann?", ett spel
  i taget och med en knapp för att avsluta.
- **Läs upp** finns på infokorten (webbläsarens talsyntes).
- **Mobil och dator är två olika lägen.** På dator styr man med pilarna.
  På pekskärm finns ingen pilstyrning. Där kommer en meny med samma val
  som hjulet, figuren går dit själv och firar lite när den är framme.
  "Jag vill utforska själv" låter en trycka på golvet dit figuren ska gå.
  `?lage=mobil` och `?lage=dator` väljer läge.
- **Verklighetstroget där det spelar roll.** Väggar, dörrar, trappor,
  toaletter och nödutgångar ska stämma med verkligheten, eftersom det är
  dem besökaren planerar efter. Personalutrymmen döljs.

## Teknik

- Ren HTML, CSS och JavaScript-moduler med Three.js. Inget byggsteg, inga
  paket att installera. Three.js och typsnittet Nunito ligger i `vendor/`.
- `index.html` innehåller all CSS och alla HTML-rutor. `src/main.js` binder
  ihop allt.
- Kod, variabler och filnamn är på svenska. Kommentarer i `.js`-filerna
  skrivs utan å, ä och ö (`vasterviks`, `vaning`). Texter som besökaren ser
  skrivs med å, ä och ö och ligger i `src/config/content.js`.

### Var saker ligger

| Fil | Innehåll |
| --- | --- |
| `src/data/layout.json`, `layout_plan1.json` | All geometri per våning: väggar, dörrar, hyllor, möbler, zoner, infopunkter, trappor och hiss, startplats |
| `src/config/content.js` | Alla texter, platser och färger: `SIDA`, `PLATSER`, `OPPETTIDER`, `KONTAKT`, `INFOPUNKTER`, `RUTOR`, `BEHOV`, `MOBIL`, `MINISPEL`, `BOKJAKT`, `TEMA` |
| `src/vyer.js` | Fasta kameravyer för granskning (`?vy=oversikt`, `?vy=salen` …) |
| `src/varld.js`, `mobler.js`, `bocker.js`, `former.js` | Bygger 3D-världen ur kartfilen |
| `src/zoner.js` | Golvzoner och skyltar, inklusive `fritFranVaggar` |
| `src/vagvisning.js` | Gula prickar och vägsökning, även mellan våningar |
| `src/mobilmeny.js`, `firande.js` | Mobilläget |
| `src/behovshjul.js` | Hjulet vid entrén |

En plats måste finnas både i `PLATSER` i `content.js` och som zon i rätt
kartfil, med samma `id`. `plan: 1` i `PLATSER` betyder att platsen ligger
på plan 1.

### Kartfilerna

- Enhet meter. x växer österut, z söderut, origo i byggnadens nordvästra
  ytterhörn. Håll `meta` i kartfilen (noter om rummen) uppdaterad när
  något ändras.
- Väggar med `"fonster": true` blir fönsterväggar.
- Hyllor med `"typ": "trag"` blir låga boktråg.
- En zonskylt med `"y"` svävar fritt på den höjden. Utan `"y"` står den på
  den hylla i zonen som ligger närmast skyltpunkten.
- Fåtöljer kan få `"rygg": "norr" | "syd" | "ost" | "vast"`.
- Möbeltypen `studiebas` (rader, antal, bord) ger studiebås med skärmar.
- Block (t.ex. toaletter) kan få `"dorrar": {sida, x: [...]}`.
- Dörrar kan ha `"skjutdorrar": true`.
- En trappa med `"ner": true` kan delas i lopp med `fran`, `fall`,
  `vilplan`, `racke` och `nerMot`. Se trappan vid infodisken på plan 1.
- `forbindelser` kopplar ihop våningarna (trappa och hiss) med en platta
  man kliver på och en ankomstplats.
- `valplats` är där hjulet dyker upp, `start` där figuren börjar.

## Önskemål som gäller överallt

- Skyltar ska synas från alla håll. En skylt vänder sig alltid mot kameran
  och får aldrig hamna i en vägg, ett slutet rum, ett hisschakt eller en
  pelare. `fritFranVaggar` sköter det, och `window.spel.skyltar` gör det
  möjligt att kontrollera.
- Låt hellre skyltar sväva fritt än stå i hyllor där det inte passar.
- Sittmöbler ska vändas mot varandra, parvis kring bord.
- Hitta inte på möbler eller hyllor som inte finns på skisserna.
- Gångar och dörröppningar måste vara så breda att vägvisningen hittar
  fram. Kontrollera varje gång en plats flyttas eller får en ny ingång.

## Så arbetar vi

- Jag (Vidar) skickar skisser, foton och beskrivningar, oftast en våning
  eller ett hörn i taget. Du bygger, tar skärmdumpar och visar resultatet.
- Fråga hellre än gissa när en skiss är otydlig.
- Jag testar ofta på mobilen, via en PR. Skapa PR när jag ber om det.
- Svara och skriv commits på enkel svenska. Beskriv vad besökaren ser och
  gör, inte vilka funktioner som ändrats.

### Kontrollera ändringar

- Starta en server i repot, t.ex. `npx http-server -p 8123 -s -c-1 .`, och
  ta skärmdumpar med Playwright i Chromium (swiftshader). Det tar några
  minuter att rendera.
- `window.spel` är en krok för granskningen: `stall(x, z, riktning)`,
  `ga(sekunder, knappar)`, `bytVaning(plan)`, `titta(...)`, `skyltar`,
  `plattor`, `layout` med flera (slutet av `src/main.js`).
- Jämför samma `?vy=` före och efter. Lägg till en ny vy i `src/vyer.js`
  när ett nytt hörn behöver granskas.
- Testa både datorläget och `?lage=mobil`, och att alla val i hjulet och
  mobilmenyn kommer fram, även till den andra våningen.

## Västervik-specifikt

Det här är det som byts ut när motorn används för ett annat bibliotek:

- `src/data/layout.json` (plan 0) och `layout_plan1.json` (plan 1), plus
  listan `KARTFILER` i `src/main.js`.
- Allt innehåll i `src/config/content.js`: namn, adress, öppettider,
  platser, valen i `BEHOV`, var spelen startar (`RUTOR.spelPlats`).
- Vyerna i `src/vyer.js`, som har Västerviks koordinater.
- Titeln i `index.html` och första raden i `src/main.js`.

Plan 0 är entréplanet med torget, receptionen, barnavdelningen, Labbet och
ungdomshörnan. Plan 1 har studieytan, tidningshörnan, släktforskningen och
Tjustrummet. Figuren börjar på torget utanför skjutdörrarna.

## Förslag som inte är gjorda än

- Information om sinnesintryck i infokorten: var det är lugnt eller
  stökigt, och att man alltid kan fråga i receptionen.
- Riktiga foton av platserna i infokorten.
