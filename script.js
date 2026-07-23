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
