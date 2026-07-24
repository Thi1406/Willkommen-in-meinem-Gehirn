// ====================================================
// 1. SEITEN-NAVIGATION (Startseite & Unterseiten)
// ====================================================
function zeigeBereich(bereichId) {
  // Versteckt die Startseite komplett
  document.querySelector('header')?.classList.add('hidden');
  document.querySelector('.navigation-grid')?.classList.add('hidden');
  
  // Versteckt alle Unterseiten zur Sicherheit
  const alleUnterseiten = document.querySelectorAll('.unterseite');
  alleUnterseiten.forEach(seite => seite.classList.add('hidden'));
  
  // Zeigt die geklickte Unterseite an
  const zielSeite = document.getElementById('unterseite-' + bereichId);
  if (zielSeite) {
    zielSeite.classList.remove('hidden');
  }

  // Wenn Geschichten geladen werden, die Liste aufbauen
  if (bereichId === 'geschichten') {
    ladeGeschichtenUebersicht();
  }
}

function zeigeStartseite() {
  // Versteckt alle Unterseiten wieder
  const alleUnterseiten = document.querySelectorAll('.unterseite');
  alleUnterseiten.forEach(seite => seite.classList.add('hidden'));
  
  // Bringt die Hauptkacheln und den Header zurück
  document.querySelector('header')?.classList.remove('hidden');
  document.querySelector('.navigation-grid')?.classList.remove('hidden');
}


// ====================================================
// 2. BILDER-LINKS (Hier deine Bilder eintragen!)
// ====================================================
const meineBilder = [
  "https://picsum.photos/300/200?random=1",
  "https://picsum.photos/300/200?random=2",
  "https://picsum.photos/300/200?random=3",
  "https://picsum.photos/300/200?random=4"
];

// globale Variablen für die Logik
let aktuellesBildId = null;
let isDrawing = false;
let aktuellesWerkzeug = 'bleistift';
let canvas, ctx;


// ====================================================
// 3. GALERIE AUTOMATISCH GENERIEREN
// ====================================================
function erstelleGalerie() {
  const galerieGrid = document.getElementById("galerie-grid");
  if (!galerieGrid) return; // Sicherheitsabfrage
  
  galerieGrid.innerHTML = ""; // Zurücksetzen

  meineBilder.forEach((bildUrl, index) => {
    const id = index + 1; // 1, 2, 3...

    const karteHtml = `
      <div class="bild-karte" id="karte-${id}">
        <div class="bild-container">
          <img src="${bildUrl}" alt="Bild ${id}">
          
          <div class="badges-container">
            <div class="badge sprechblase hidden" onclick="zeigWolke(${id})">💬 <span class="anzahl-beschreibungen">0</span></div>
            <div class="badge farbklecks hidden">🎨 <span class="anzahl-paintings">0</span></div>
          </div>

          <div class="beschreibung-wolke hidden" id="wolke-${id}">
            <p id="wolke-text-${id}"></p>
            <small id="wolke-autor-${id}"></small>
          </div>
        </div>

        <div class="button-gruppe">
          <button class="btn-aktion btn-beschreiben" onclick="oeffneBeschreibungModal(${id})">Beschreiben</button>
          <button class="btn-aktion btn-bearbeiten" onclick="oeffnePaintModal(${id}, '${bildUrl}')">Bearbeiten</button>
        </div>
      </div>
    `;

    galerieGrid.innerHTML += karteHtml;
  });
}

// Beim Laden der Seite Galerie sofort aufbauen
erstelleGalerie();


// ====================================================
// 4. LOGIK FÜR DAS BESCHREIBEN-MODAL
// ====================================================
function oeffneBeschreibungModal(bildId) {
  aktuellesBildId = bildId;
  document.getElementById("modal-beschreibung").classList.remove("hidden");
  document.getElementById("modal-fehler").classList.add("hidden");
}

function schliesseBeschreibungModal() {
  document.getElementById("modal-beschreibung").classList.add("hidden");
  document.getElementById("beschreibung-text").value = "";
  document.getElementById("beschreibung-name").value = "";
}

function speichereBeschreibung() {
  const text = document.getElementById("beschreibung-text").value;
  const name = document.getElementById("beschreibung-name").value.trim();

  if (name === "") {
    document.getElementById("modal-fehler").classList.remove("hidden");
    return;
  }

  document.getElementById(`wolke-text-${aktuellesBildId}`).innerText = `"${text}"`;
  document.getElementById(`wolke-autor-${aktuellesBildId}`).innerText = `— ${name}`;

  const karte = document.getElementById(`karte-${aktuellesBildId}`);
  const badge = karte.querySelector(".sprechblase");
  const anzahlSpan = karte.querySelector(".anzahl-beschreibungen");
  
  badge.classList.remove("hidden");
  anzahlSpan.innerText = parseInt(anzahlSpan.innerText) + 1;

  schliesseBeschreibungModal();
}

function zeigWolke(bildId) {
  const wolke = document.getElementById(`wolke-${bildId}`);
  wolke.classList.toggle("hidden");
}


// ====================================================
// 5. LOGIK FÜR DAS PAINT-MAL-STUDIO
// ====================================================
function initCanvas() {
  canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  canvas.onmousedown = startZeichnen;
  canvas.onmousemove = zeichnen;
  canvas.onmouseup = stoppZeichnen;
}

function setzeWerkzeug(werkzeug, event) {
  aktuellesWerkzeug = werkzeug;
  document.querySelectorAll('.btn-tool').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

function oeffnePaintModal(bildId, bildUrl) {
  aktuellesBildId = bildId;
  const modal = document.getElementById('modal-paint');
  const img = document.getElementById('paint-hintergrund-bild');
  
  img.src = bildUrl;
  modal.classList.remove('hidden');
  document.getElementById('paint-fehler').classList.add('hidden');

  setTimeout(initCanvas, 100);
}

function schliessePaintModal() {
  document.getElementById('modal-paint').classList.add('hidden');
  document.getElementById('paint-name').value = '';
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startZeichnen(e) {
  isDrawing = true;
  zeichnen(e);
}

function stoppZeichnen() {
  isDrawing = false;
  if (ctx) ctx.beginPath();
}

function zeichnen(e) {
  if (!isDrawing || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const farbe = document.getElementById('paint-farbe').value;

  ctx.strokeStyle = farbe;
  ctx.fillStyle = farbe;

  if (aktuellesWerkzeug === 'bleistift') {
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else if (aktuellesWerkzeug === 'kugelschreiber') {
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else if (aktuellesWerkzeug === 'spray') {
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 15;
      const offsetY = (Math.random() - 0.5) * 15;
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
  }
}

function speicherePaint() {
  const name = document.getElementById('paint-name').value.trim();

  if (name === '') {
    document.getElementById('paint-fehler').classList.remove('hidden');
    return;
  }

  const karte = document.getElementById(`karte-${aktuellesBildId}`);
  const badge = karte.querySelector('.farbklecks');
  const anzahlSpan = karte.querySelector('.anzahl-paintings');

  badge.classList.remove('hidden');
  anzahlSpan.innerText = parseInt(anzahlSpan.innerText) + 1;

  schliessePaintModal();
}


// ====================================================
// 6. GESCHICHTEN-DATENBANK & UMSCHALT-LOGIK
// ====================================================
const geschichtenDaten = {
  demenz: {
    titel: "Der kalte Gang",
    vorschau: "Ein feuchter Keller, Schritte in der Dunkelheit und die Panik im Nacken...",
    genres: {
      original: `Der kalte und leicht nasse Luftzug aus den alten maroden Kellerräumen zog in meinen Nacken und sorgte für Gänsehaut, die ich am ganzen Körper verspürte. Die Angst beherrschte meine Gedanken und sorgte dafür, dass ich an jeder Ecke befürchtete, dass dort etwas Schlimmes passieren könnte, dass jemand kommen könnte und mich findet. Nichts ahnend ging ich immer weiter durch die kalten und dunklen Kellergänge, dabei waren die lautesten Worte in meinem Kopf: "Werde ich hier sterben?"

Ein Tropfen fiel in meinen Nacken und ließ mich für einen Moment erstarren und innehalten. Ich dachte nur daran, dass ich hier schnellstmöglich raus muss, zurück ins Tageslicht. Ob es überhaupt hell draußen war oder ob ich in einer belebten Gegend war, wusste ich nicht. Ein lauter Schrei ertönte aus der Richtung, aus der ich kam. Ich lief den Gang immer schneller entlang. Links, rechts, einfach weiter – nicht immer die gleiche Richtung nehmen, damit ich nicht aus Versehen im Kreis laufe. Ich spürte, wie die Panik in mir immer größer wurde, bis ich anfing, immer schneller zu atmen. Beim Laufen versuchte ich mir zu merken, ob ich schon irgendeine Tür gesehen hatte. Die Verzweiflung schlich sich immer mehr in meine Gedanken, sie sorgte dafür, dass einige Tränen über mein Gesicht flossen. 

Total benebelt von meinen Gedanken und dem Laufen, stolperte ich über einen erhöhten Stein und zog mir eine Schürfwunde zu, sie brannte und juckte aber das konnte ich schnell wieder ausblenden denn mein Kopf war viel zu beschäftigt mit den anderen Gedanken als sich dem Schmerz zu widmen. Ich fasste neuen Mut, lief weiter in die Richtung, aus der ein leichter Luftstrom durch meine Haare wehte. Ausgang war das Wort, was sich in meinen Gedanken ständig wiederholte bis ich auf einmal stolperte, über den gleichen Stein wie schon zuvor. Ich realisierte, dass ich im Kreis lief und fing an zu Boden zu sinken. Ich weinte und wusste nicht mehr weiter. Meine Gedanken kreisten und ich fing an zu schreien, auch wenn mich jemand bemerken könnte, in dem Moment wollte ich nur noch aus dieser Situation raus, raus aus diesen nassen, dunklen Kellerräumen. 

Die Zeit verging und ich verzweifelte immer mehr, mehr Tränen, mehr Schreie, nach einer Weile saß ich ganz auf dem Boden, alles sah einfach nur gleich aus. Verzweiflung machte sich breit und ich sah keine Chance mehr jemals diesen Ausgang zu finden. Ich starrte auf meine Schürfwunde am Knie und sah wie ein Bluttropfen an meinem Bein herunterlief, der Gedanke dass sich die Wunde entzünden konnte, wurde immer lauter, weil hier unten alles kalt, nass und dreckig war. 

Es riss mich aus meinen Gedanken, als ich plötzlich Schritte hörte, sie klangen weit weg, so weit weg und leise, dass ich die Richtung nicht bestimmen konnte. Ein Zwiespalt machte sich in mir breit, sollte ich sitzen bleiben und warten, aber worauf? Oder sollte ich weglaufen, aber wohin? Fragen über Fragen und trotzdem werde ich die richtige Antwort nicht rechtzeitig finden. Ich stand auf und ging doch weiter, denn alles andere ergab für mich keinen Sinn. Der Schmerz der Schürfwunde zog durch mein ganzes Bein und ich fing an unbewusst leicht zu humpeln.

Die Schritte, die ich vernahm, wurden lauter und ich war mir in dem Moment immer noch nicht sicher, ob es richtig ist weiter wegzulaufen oder doch zu warten bis mich jemand findet. An der nächsten Ecke überwog der Gedanke, wissen zu wollen, wer mich verfolgte. Ich blieb stehen, wartete und in dem Moment hörte ich meinen Herzschlag und meinen Puls immer schneller werden. Diese Angst und gleichzeitige Aggression ließen das Adrenalin in die Höhe schießen, so sehr, dass ich es in den Adern spürte und es mir das Gefühl gab alles und jeden zu Boden zu reißen, der sich mir und meiner Freiheit in den Weg stellen wollte. Still stehend versuchte ich herauszuhören wie viele Schritte es sein könnten. "Wie viele kamen dort auf mich zu? Wer oder was könnte der Mensch oder die Menschen von mir wollen? Sollte ich direkt zuschlagen, sollte ich erst fragen? Was soll ich machen, wenn ich jemanden sehe?" sagte ich so leise wie noch nie zu mir selbst.

Die Schritte wurden hörbar schneller und kamen immer näher und näher. Mein Puls stieg noch weiter an und sorgte für ein drückendes Engegefühl in meinem Hals. Ich dachte dass mir die Luft zum Atmen wegbleibt, da es mir immer schwerer fiel und ich spürte dass die Schnelligkeit meiner Atmung nicht mehr unter meiner Kontrolle war. Ich wurde nervöser, unruhiger und bemerkte dass sich Panik ausbreitete, was sich mit größer werdender Verzweiflung mischte. Im nächsten Moment nahm ich nur noch die Schritte wahr die keine zwei Minuten mehr von mir entfernt waren. Das war das Signal für meinen Körper alles an Adrenalin auszuschütten, was ich noch zur Verfügung hatte. Mein Puls ging noch mehr in die Höhe, mein Herz fing an zu schmerzen, mein Kopf fühlte sich an als würde er jede Sekunde platzen und meine Lungen als würden sie gleich kollabieren. Währenddessen schoss mir eine Frage durch den Kopf: "Sollte ich vielleicht jetzt mit meinem Leben abschließen?"

Ich weinte und zitterte am ganzen Körper ohne einen Ton von mir zu geben. Hockte wieder auf dem kalten Boden, schaute jede Sekunde um die Ecke um zu sehen, wann der Mensch da ist. "Wann ist es denn endlich vorbei? Wann kann ich aufgeben oder gehen?" flüsterte ich mir zu. Ich wollte nur noch raus, raus aus dieser schrecklichen Situation. Ich war am Ende, konnte nicht mehr, dieses elende Warten, es fühlte sich an wie Stunden, die ich hier unten schon war. 

Plötzlich sah ich ein Gesicht, was beim Anblick meiner verzweifelten Gestalt sagte: "Da bist du ja". Mir kam das Gesicht bekannt vor, aber mir war nicht klar woher. Die Angst und Panik legte sich, denn ich fühlte mich nicht mehr so hilflos, sondern befreit, denn der Mensch dem vermutlich die Schritte gehörten war freundlich mir gegenüber. Dennoch war ich skeptisch, als die Person langsam näher kam, eine Hand auf meine Schulter legte und sagte: "Ich habe dich schon sehr lange gesucht, denn vermutlich bist du dir dem gerade nicht bewusst, dass du demenzkrank bist und dich vermutlich deshalb auf dem Weg zur Toilette, hier im Dinosaurier-Museum in den Kellerräumen verlaufen hast." 

Nach diesem Satz spürte ich dass meine Emotionen mich jeden Moment überrumpeln und kein Atemzug später platzte es aus mir heraus. Ich fing bitterlich an zu weinen, war verwirrt, traurig und wütend, denn dadurch dass ich die Diagnose noch nicht lange hatte, konnte ich meinem Gegenüber Glauben schenken. Das Parfum, was ich vernahm, habe ich der Person vor geraumer Zeit geschenkt. Nachdem ich mich etwas gesammelt hatte, gingen wir hoch und ich sah die Skelette der Dinosaurier-Ausstellung. Ich erwischte mich wieder dabei in Gedanken zu schwelgen bis mich meine Begleitperson rausriss: "Also wie du siehst sind wir wirklich in einem Museum und nachdem ich dich habe ausrufen lassen und du nicht aufgetaucht bist, ging ich auf die Suche in Richtung Toiletten und konnte in der Ferne weglaufende Schritte wahrnehmen, weshalb ich nachsah. Ich denke dass diese Situation schrecklich für dich gewesen sein muss. Ich werde dir ein Pflaster besorgen und würde dich dann gerne nach Hause bringen."`,

      horror: `Ein moderiger, nach Verwesung stinkender Hauch zog aus der pechschwarzen Tiefe der Gewölbe empor. Die Dunkelheit schien nicht nur die Abwesenheit von Licht zu sein, sondern eine krallende, lebendige Masse. "Werde ich hier sterben?", kreischte die Stimme der Verzweiflung in meinem Schädel.

Ein eiskalter Tropfen – oder war es Blut? – traf meinen Nacken. Aus der Finsternis hinter mir drang ein verzerrter, nicht-menschlicher Schrei. Ich rannte. Meine Lungen brannten, die Orientierung war längst verloren. Ich stolperte über eine hervorstehende Wurzel, die sich anfühlte wie die fingerdicken Knochen einer Leiche. Das Fleisch an meinem Knie riss auf, warmes Blut sickerte meine Haut hinab. 

Als ich kurz darauf erneut über dieselbe Stelle stürzte, überkam mich das grauenhafte Verlangen aufzugeben. Die Wände schienen sich eng um mich zu schließen. Dann ertönten die Schritte. Kein menschlicher Gang, sondern ein schweres, rhythmisches Scharren. 

Eine Gestalt trat aus dem Schatten. Ihr Gesicht wirkte wie eine Wachsmaske im fahlen Restlicht. "Da bist du ja...", flüsterte die Kreatur mit einer Stimme, die wie trockenes Laub raschelte. Eine eiskalte Hand legte sich auf meine Schulter. "Du kannst dem Museum der Toten nicht entkommen. Du hast vergessen, wer du bist – und jetzt gehörst du für immer zu den Knochen im Keller..."`,

      krimi: `Der kühle, feuchte Zugwind in den Katakomben riecht nach altem Beton und Gefahr. Täterwissen oder Schock? Mein Kopf rast, die Sinne sind auf Hochspannung eingestellt. Jemand verfolgt mich durch diesen Labyrinth-Komplex. Wenn ich hier eingekesselt werde, bin ich geliefert.

Ich wechsle die Richtung. Links, rechts, Zickzack-Muster, um den Verfolger abzuschütteln. Meine Füße fliegen über den unebenen Boden, bis ich an einem vorstehenden Betonsockel hängen bleibe. Der Sturz reißt die Haut am Knie auf. Kein Blick zurück. Schmerz ist im Moment nur ein Störfaktor.

Doch zwei Minuten später stehe ich wieder vor demselben Hindernis. Kreisbewegung. Taktischer Fehler. Ich gehe in Deckung, den Rücken an die kalte Wand gepresst. Die Schritte kommen näher. Zügig, entschlossen. Ein Profi?

Ich hole tief Luft, mache mich bereit zur Gegenwehr. Da schwenkt eine Taschenlampe um die Ecke. Ein Mann blendet mich. "Da bist du ja!", ruft er und senkt die Lampe. "Gott sei Dank! Ich bin der Ermittler vom Sicherheitsdienst. Sie stehen unter Schock. Ihre Begleitperson hat Sie vor einer Stunde vermisst gemeldet – Sie haben das Museumsorientierungssystem aufgrund Ihres Anfalls aus den Augen verloren."`,

      kindlich: `Huui, da pfeift aber ein ganz schön kalter Wind durch die dunklen Höhlenräume! Zitternd zog ich meine Jacke enger zusammen. Wo war nur der Ausgang von diesem riesigen Versteckspiel-Labyrinth? 

*Plitsch!* Ein dicker Wassertropfen landete mitten auf meiner Nase. "Ohoh, schnell raus hier!", dachte ich mir und hüpfte mit großen Schritten über die dunklen Fliesen. Aber ach je – da lag ein frecher Kieselstein im Weg! Ich stolperte und schnaufte tief durch. Aua, mein Knie hatte einen kleinen Kratzer abbekommen. 

Ich lief weiter, immer an der Wand entlang, bis ich plötzlich wieder an demselben frechen Kieselstein vorbeikam. "Menno!", rief ich und setzte mich schmollend auf den Boden. Wo ging es nur wieder zurück zu den bunten Lichtern?

Plötzlich hörte ich Schritte. Tap, tap, tap. War da etwa ein Monster unterwegs? Ich schloss ganz fest die Augen. Doch als ich sie wieder aufmachte, stand da ein freundlicher Mann mit einer lustigen Mütze und einem breiten Lächeln! "Da bist du ja, du kleiner Abenteurer!", lachte er. "Du hast dich wohl bei den riesigen Dino-Knochen im Museum verlaufen, was? Komm, wir holen uns oben ein Pflaster und suchen deine Begleitung!"`,

      erotisch: `Der kühle Luftzug, der aus den tiefen Kellerräumen emporstieg, ließ einen prickelnden Schauer über meine Haut gleiten. Jeder Atemzug war geladen mit einer elektrisierenden Spannung, die mein Herz wie wild klopfen ließ. Angst und Verlangen verschmolzen zu einem berauschenden Adrenalinkick.

Ein feuchter Tropfen traf meinen Nacken und rann langsam an meiner Wirbelsäule hinab. Mein Atem wurde schneller, verlangend und unkontrolliert. Auf der Flucht durch die dunklen Gänge stolperte ich, die Haut an meinem Bein riss leicht auf – ein brennender Schmerz, der meine Sinne nur noch mehr anfeuerte.

Schritte hallten durch den Gang. Schwer, dominant und immer näher kommend. Mein Puls raste, mein Körper bebte vor Erwartung. Wer war dieser Unbekannte, der mich jagte? 

Als die Gestalt schließlich um die Ecke trat, raubte mir der Anblick den Atem. Mit einem intensiven, raunenden Blick trat die Person an mich heran. "Da bist du ja...", hauchte eine dunkle Stimme. Eine warme, kräftige Hand legte sich sanft, aber bestimmt auf meine Schulter und zog mich nah heran. Der vertraute, berauschende Duft des Parfums stieg mir in die Nase – eine Umarmung, die mich alle Angst auf der Stelle vergessen ließ...`
    }
  }
};

// Aktuell ausgewählte Geschichte und Genre
let aktuelleStoryId = 'demenz';
let aktuellesGenre = 'original';

function ladeGeschichtenUebersicht() {
  const container = document.getElementById('geschichten-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let id in geschichtenDaten) {
    const story = geschichtenDaten[id];
    const karte = document.createElement('div');
    karte.className = 'geschichte-karte';
    karte.onclick = () => oeffneGeschichte(id);
    karte.innerHTML = `
      <h3>${story.titel}</h3>
      <p>${story.vorschau}</p>
    `;
    container.appendChild(karte);
  }
}

function oeffneGeschichte(id) {
  aktuelleStoryId = id;
  aktuellesGenre = 'original';
  
  document.getElementById('geschichte-titel').innerText = geschichtenDaten[id].titel;
  
  // Setze den "Original"-Button optisch wieder als aktiv
  const buttons = document.querySelectorAll('.btn-genre');
  buttons.forEach(btn => {
    if (btn.innerText.toLowerCase() === 'original') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  aktualisiereGenreText();
  document.getElementById('modal-geschichte').classList.remove('hidden');
}

function wechsleGenre(genre) {
  aktuellesGenre = genre;
  
  const buttons = document.querySelectorAll('.btn-genre');
  buttons.forEach(btn => {
    if (btn.innerText.toLowerCase() === genre) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  aktualisiereGenreText();
}

function aktualisiereGenreText() {
  const story = geschichtenDaten[aktuelleStoryId];
  const textElem = document.getElementById('geschichte-text');
  if (textElem && story) {
    textElem.innerText = story.genres[aktuellesGenre] || story.genres['original'];
  }
}

function schliesseGeschichteModal() {
  document.getElementById('modal-geschichte').classList.add('hidden');
}
