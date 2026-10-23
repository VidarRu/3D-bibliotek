# 3D-bibliotek

En 3D-karta över ett folkbibliotek som man går runt i med en liten figur.
Det här repot gäller Västerviks stadsbibliotek, men tanken är att samma
motor ska användas för en hel serie bibliotek. Allt som är specifikt för
ett bibliotek ska därför ligga i datafiler, inte i koden.

## Syfte och målgrupp

Kartan är till för alla som vill planera sitt besök i förväg: den som är
ängslig eller har en NPF-diagnos, nyanlända, äldre, barnfamiljer och andra
som vill veta vad som väntar. Man ska kunna se hur det ser ut, var saker
finns och hur man tar sig dit, innan man går dit på riktigt.

Det leder till några principer som går före allt annat:

- **Lugnt och förutsägbart.** Inget gungar, studsar, blinkar eller rör sig
  av sig självt. Inga rutor som alltid syns. Kvar på skärmen är kartan och
  en liten `?`-knapp. Ett medvetet undantag: i mobilläget får figuren
  hoppa och vinka lite när den kommer fram.
- **Fråga först.** Information visas inte förrän man har sagt ja, till
  exempel "Vill du veta vad det här är?" på infoplattorna.
- **Alla rutor fungerar likadant** och dyker upp på samma ställe, längst ner
  i mitten. Mellanslag är alltid Ja, Esc är alltid Nej eller Stäng
  (`src/dialog.js`).
- **Dämpad palett.** Starka färger gör kartan plottrig. Utgå från
  kommunens eller bibliotekets grafiska profil, men i dämpade nyanser
  (Västervik har beige, brunt och mörkrött). Undantag: de gula
  vägvisningsprickarna och gröna nödutgångsskyltar.
- **Utgå från besökarens behov**, inte från bibliotekets avdelningar.
  Hjulet vid entrén frågar "Vad vill du göra i dag?" (låna en dator, gå på
  toaletten, hitta en plats att amma, äta medhavd mat …) och gula prickar
  visar sedan vägen, även till en annan våning. Valen i Västervik är ett
  grundförslag som anpassas efter varje bibliotek.
- **Spel är frivilliga.** Biblioteksorientering och Bokjakten startas bara
  på en plats man väljer (i Västervik Labbet), efter frågan "Vill du
  utmana dig själv lite grann?", ett spel i taget och med en knapp för att
  avsluta. Alla bibliotek behöver inte ha spelen.
- **Läs upp** finns på infokorten (webbläsarens talsyntes).
- **Mobil och dator är två olika lägen.** På dator styr man med pilarna.
  På pekskärm finns ingen pilstyrning. Där kommer en meny med samma val
  som hjulet, figuren går dit själv och firar lite när den är framme.
  "Jag vill utforska själv" låter en trycka på golvet dit figuren ska gå.
  `?lage=mobil` och `?lage=dator` väljer läge.
- **Verklighetstroget där det spelar roll.** Väggar, dörrar, trappor,
  toaletter och nödutgångar ska stämma med verkligheten, eftersom det är
  dem besökaren planerar efter. Personalutrymmen döljs.

## Stil: Bruno Simons portfolio

Förebilden för utseendet är Bruno Simons portfolio (bruno-simon.com): en
liten 3D-värld i leksaksformat, byggd med Three.js, där man styr en figur
och kameran följer snett uppifrån. Alla bibliotek i serien ska ha samma
stil, så att de känns som delar av samma familj och inte varierar.

Det vi tar därifrån:

- **Leksaksvärld i miniatyr.** Huset ser ut som en modell man kan titta ner
  i, med låga väggar och en kamera som följer figuren snett uppifrån.
- **Runda, mjuka former.** Lådor med rundade kanter (`RoundedBoxGeometry`
  via `src/former.js`), runda leksaksfigurer med bara ögon och en liten näsa,
  möbler som ser ut som leksaker (`src/mobler.js`).
- **Matta material och mjuka skuggor.** `MeshStandardMaterial` med hög
  `roughness`, mjuka skuggor och varmt ljus. Inga blanka ytor eller
  fotorealistiska texturer.
- **Enkla, tydliga färgytor** i stället för mönster och detaljer.
- **Typsnittet Nunito**, runt och vänligt, i alla rutor och skyltar.

Det vi inte tar: fysiken, att saker välter och studsar, och allt som rör
sig av sig självt. Lugnet går före leksakskänslan.

Nya möbler och föremål byggs i samma stil som de som redan finns. Titta
alltid i `src/mobler.js` och `src/former.js` först.

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
- Väggar med `"fonster": true` blir fönsterväggar. `"yta": "laxrosa"` ger
  en accentvägg och `"yta": "tegel"` en tegelvägg. Utan yta blir väggen
  varmvit.
- Zoner med `"stengolv": true` får stenplattor i stället för vanligt golv,
  till exempel entré, torg och trapphall.
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

- Jag (Vidar) skickar underlag, oftast en våning eller ett hörn i taget.
  Planskissen är det viktigaste. Ibland finns en riktig ritning och några
  foton. Skissen avgör var saker står, ritningen ger måtten och fotona
  ger färger, material och detaljer. Du bygger, tar skärmdumpar och visar
  resultatet.
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

## Starta ett nytt bibliotek

Fråga mig om det här innan du börjar bygga:

1. **Vilket bibliotek**, och namn, adress, öppettider och kontaktuppgifter.
2. **Färgprofilen.** Vilka RGB- eller hexkoder har kommunen eller
   biblioteket i sin grafiska profil? Gör dem dämpade och lägg dem i
   `TEMA` i `content.js`. Visa förslaget innan det används överallt.
3. **Underlaget.** Planskiss för varje våning, och ritning och foton om de
   finns. Hur många våningar, och var trappor och hiss finns.
4. **Spelen.** Ska Biblioteksorientering och Bokjakten finnas med? I så
   fall, på vilken plats ska de startas (`RUTOR.spelPlats`)? Utan spel:
   `spelPlats: null`, och stryk raden om spelen i `RUTOR.instruktionRader`.
5. **Behovshjulet.** Gå igenom valen i `BEHOV` tillsammans med mig. Utgå
   från Västerviks val och stryk, byt eller lägg till efter vad det här
   biblioteket har.
6. **Startplats och entré.** Var börjar figuren, och var ska hjulet dyka
   upp (`start` och `valplats`)?

Stil, principer och motor är desamma i alla bibliotek. Det som byts ut
står i nästa avsnitt.

## Västervik-specifikt

Det här är det som byts ut när motorn används för ett annat bibliotek:

- Kartfilerna i `src/data`, en per våning: `layout.json` (plan 0) och
  `layout_plan1.json` (plan 1). Vilka filer som läses står i `KARTOR` i
  `content.js`, med entréplanet först.
- Allt innehåll i `src/config/content.js`: namn, adress, öppettider,
  platser, färger (`TEMA`), valen i `BEHOV`, var spelen startar
  (`RUTOR.spelPlats`, eller `null` för inga spel).
- Vyerna i `src/vyer.js`, som har Västerviks koordinater.
- Titeln i `index.html`. Sidan byter själv till `SIDA.titel` när den
  laddas, men titeln i filen syns innan dess.

Motorn i `src/*.js` ska inte innehålla något om ett visst bibliotek: inga
id:n för väggar, zoner eller platser och inga koordinater. Behövs något
sådant, lägg det i kartfilen eller i `content.js` i stället.

Plan 0 är entréplanet med torget, receptionen, barnavdelningen, Labbet och
ungdomshörnan. Plan 1 har studieytan, tidningshörnan, släktforskningen och
Tjustrummet. Figuren börjar på torget utanför skjutdörrarna.

## Förslag som inte är gjorda än

- Information om sinnesintryck i infokorten: var det är lugnt eller
  stökigt, och att man alltid kan fråga i receptionen.
- Riktiga foton av platserna i infokorten.
