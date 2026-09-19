// ====================================================
// 1. HELFER-FUNKTIONEN (Sicheres LocalStorage & Escaping)
// ====================================================
function ladeLokalDaten(key, standardWert) {
  try {
    const daten = localStorage.getItem(key);
    return daten ? JSON.parse(daten) : standardWert;
  } catch (e) {
    console.error(`Fehler beim Laden von ${key} aus LocalStorage:`, e);
    return standardWert;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global definierte Datenstrukturen aus LocalStorage
let kiBearbeiteteBilder = ladeLokalDaten('kiBearbeiteteBilder', []);
let freieGemaelde = ladeLokalDaten('freieGemaelde', []);
let highscores = ladeLokalDaten('clipper_highscores', []);

// Standard-Geschichten für die App
const geschichtenDaten = {
  story1: {
    titel: "Der verlorene Funke",
    klasse: "karte-fantasy",
    vorschau: "Ein kleiner Roboter sucht im Nebel nach seiner vergessenen Energiequelle.",
    inhalt: "In einer Welt aus Altmetall und leisem Summen wachte der kleine Roboter 404 auf. Sein Akku blinkte rot. Doch weit im Norden sah er ein blaues Leuchten..."
  },
  story2: {
    titel: "Schatten über Bremen",
    klasse: "karte-krimi",
    vorschau: "Rätselhafte Vorkommnisse an der Weser halten die Stadt in Atem.",
    inhalt: "Der Regen peitschte gegen die Fensterscheiben im Viertel. Hauptkommissar Hansen zog an seiner Zigarette und blickte auf die alte Karte der Weser..."
  }
};

let aktuellesStoryKey = null;

// ====================================================
// 2. SEITEN-NAVIGATION & UNTER-REITER
// ====================================================
function zeigeBereich(bereichId) {
  document.querySelector('header')?.classList.add('hidden');
  document.querySelector('.navigation-grid')?.classList.add('hidden');

  const alleUnterseiten = document.querySelectorAll('.unterseite');
  alleUnterseiten.forEach(seite => seite.classList.add('hidden'));

  const zielSeite = document.getElementById('unterseite-' + bereichId);
  if (zielSeite) {
    zielSeite.classList.remove('hidden');
  }

  if (bereichId === 'geschichten') {
    ladeGeschichtenUebersicht();
  } else if (bereichId === 'bilder') {
    if (typeof ladeKiBilder === 'function') {
      ladeKiBilder(aktuelleKiKategorie);
    }
    setTimeout(() => {
      initFreiesCanvas();
      initStudioCanvas();
    }, 100);
  }
}

function zeigeStartseite() {
  const alleUnterseiten = document.querySelectorAll('.unterseite');
  alleUnterseiten.forEach(seite => seite.classList.add('hidden'));

  document.querySelector('header')?.classList.remove('hidden');
  document.querySelector('.navigation-grid')?.classList.remove('hidden');
}

function wechsleBilderTab(tabName, evt) {
  document.querySelectorAll('.bilder-tabs .btn-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('#unterseite-bilder .tab-content').forEach(tab => tab.classList.add('hidden'));

  if (evt) {
    const btn = evt.currentTarget || evt.target;
    btn.classList.add('active');
  }

  const zielTab = document.getElementById(`tab-${tabName}`);
  if (zielTab) {
    zielTab.classList.remove('hidden');
  }

  if (tabName === 'freies-malen') {
    setTimeout(initFreiesCanvas, 50);
  } else if (tabName === 'ki-studio') {
    setTimeout(initStudioCanvas, 50);
  }
}

// ====================================================
// 3. BESCHREIBEN & PAINT MODALS (GALERIE & KI)
// ====================================================
let aktuellesBildId = null;
let isDrawing = false;
let aktuellesWerkzeug = 'bleistift';
let canvas, ctx;

function holeKoordinaten(e, targetCanvas) {
  const rect = targetCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function oeffneBeschreibungModal(bildId) {
  aktuellesBildId = bildId;
  document.getElementById("modal-beschreibung")?.classList.remove("hidden");
  document.getElementById("modal-fehler")?.classList.add("hidden");
}

function schliesseBeschreibungModal() {
  document.getElementById("modal-beschreibung")?.classList.add("hidden");
  const txt = document.getElementById("beschreibung-text");
  const name = document.getElementById("beschreibung-name");
  if (txt) txt.value = "";
  if (name) name.value = "";
}

function speichereBeschreibung() {
  const text = document.getElementById("beschreibung-text")?.value || "";
  const name = document.getElementById("beschreibung-name")?.value.trim() || "";

  if (name === "") {
    document.getElementById("modal-fehler")?.classList.remove("hidden");
    return;
  }

  alert(`Beschreibung gespeichert von ${name}!`);
  schliesseBeschreibungModal();
}

function initCanvas() {
  canvas = document.getElementById('paint-canvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 600;
  canvas.height = canvas.offsetHeight || 400;

  const startFn = (e) => startZeichnen(e);
  const moveFn = (e) => zeichnen(e);
  const stopFn = () => stoppZeichnen();

  canvas.onmousedown = startFn;
  canvas.onmousemove = moveFn;
  canvas.onmouseup = stopFn;
  canvas.onmouseleave = stopFn;

  canvas.ontouchstart = (e) => { e.preventDefault(); startFn(e); };
  canvas.ontouchmove = (e) => { e.preventDefault(); moveFn(e); };
  canvas.ontouchend = stopFn;
}

function setzeWerkzeug(werkzeug, evt) {
  aktuellesWerkzeug = werkzeug;
  document.querySelectorAll('#paint-modal-werkzeugleiste .btn-tool').forEach(btn => btn.classList.remove('active'));
  if (evt) {
    const btn = evt.currentTarget || evt.target;
    btn.classList.add('active');
  }
}

function oeffnePaintModal(bildId, bildUrl) {
  aktuellesBildId = bildId;
  const modal = document.getElementById('modal-paint');
  const img = document.getElementById('paint-hintergrund-bild');

  if (img) img.src = bildUrl;
  modal?.classList.remove('hidden');
  document.getElementById('paint-fehler')?.classList.add('hidden');

  setTimeout(initCanvas, 100);
}

function schliessePaintModal() {
  document.getElementById('modal-paint')?.classList.add('hidden');
  const nameInput = document.getElementById('paint-name');
  if (nameInput) nameInput.value = '';
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startZeichnen(e) {
  isDrawing = true;
  if (!ctx || !canvas) return;
  const pos = holeKoordinaten(e, canvas);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function stoppZeichnen() {
  isDrawing = false;
  if (ctx) ctx.beginPath();
}

function zeichnen(e) {
  if (!isDrawing || !ctx || !canvas) return;

  const pos = holeKoordinaten(e, canvas);
  const farbe = document.getElementById('paint-farbe')?.value || '#000000';

  ctx.strokeStyle = farbe;
  ctx.fillStyle = farbe;

  if (aktuellesWerkzeug === 'bleistift' || aktuellesWerkzeug === 'kugelschreiber') {
    ctx.lineWidth = aktuellesWerkzeug === 'bleistift' ? 2 : 4;
    ctx.lineCap = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else if (aktuellesWerkzeug === 'spray') {
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 15;
      const offsetY = (Math.random() - 0.5) * 15;
      ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
    }
  }
}

function speicherePaint() {
  const nameInput = document.getElementById('paint-name');
  const name = nameInput ? nameInput.value.trim() : '';

  if (name === '') {
    document.getElementById('paint-fehler')?.classList.remove('hidden');
    return;
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  const img = document.getElementById('paint-hintergrund-bild');
  if (img && img.complete) {
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
  }
  tempCtx.drawImage(canvas, 0, 0);

  const kombiniertesBildDataUrl = tempCanvas.toDataURL('image/png');

  kiBearbeiteteBilder.push({
    id: Date.now(),
    bildId: aktuellesBildId,
    autor: name,
    bildData: kombiniertesBildDataUrl,
    datum: new Date().toLocaleDateString('de-DE'),
    zeit: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  localStorage.setItem('kiBearbeiteteBilder', JSON.stringify(kiBearbeiteteBilder));

  rendereKiUserListe();
  schliessePaintModal();
}

function oeffneBildInNeuemFenster(titel, autor, bildData) {
  const win = window.open('');
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(titel)}</title>
        <style>
          body { background:#111; color:#fff; text-align:center; font-family:sans-serif; padding:20px; }
          img { max-width:90%; border:2px solid #00f3ff; border-radius:8px; margin-top:15px; }
        </style>
      </head>
      <body>
        <h3>${escapeHtml(titel)}</h3>
        <p>Erstellt von: <strong>${escapeHtml(autor)}</strong></p>
        <img src="${bildData}" alt="Werk von ${escapeHtml(autor)}"/>
      </body>
      </html>
    `);
    win.document.close();
  }
}

function rendereKiUserListe() {
  const liste = document.getElementById('ki-user-liste');
  if (!liste) return;
  liste.innerHTML = '';

  kiBearbeiteteBilder.forEach((werk) => {
    const btn = document.createElement('button');
    btn.className = 'btn-neon-user';
    btn.innerText = `🎨 ${werk.autor} (${werk.zeit || ''})`;
    btn.onclick = () => {
      if (werk.bildData) {
        oeffneBildInNeuemFenster(`Werk zu Bild #${werk.bildId || ''}`, werk.autor, werk.bildData);
      }
    };
    liste.appendChild(btn);
  });
}

function rendereFreiUserListe() {
  const liste = document.getElementById('frei-user-liste');
  if (!liste) return;
  liste.innerHTML = '';

  freieGemaelde.forEach((werk) => {
    const btn = document.createElement('button');
    btn.className = 'btn-neon-user';
    btn.innerText = `🖼️ ${werk.autor} (${werk.zeit || ''})`;
    btn.onclick = () => {
      if (werk.bildData) {
        oeffneBildInNeuemFenster(`Freies Gemälde`, werk.autor, werk.bildData);
      }
    };
    liste.appendChild(btn);
  });
}

// ====================================================
// 4. KI-SPAß GALERIE
// ====================================================
let aktuelleKiKategorie = 'standard';

function aendereKiKategorie(kategorie) {
  aktuelleKiKategorie = kategorie;
  ladeKiBilder(kategorie);
}

function würfeleKiBilder() {
  ladeKiBilder(aktuelleKiKategorie);
}

async function ladeKiBilder(kategorie) {
  const grid = document.getElementById('ki-galerie-grid');
  if (!grid) return;
  grid.innerHTML = ''; 

  let bildURLs = [];
  const r = Date.now();

  switch (kategorie) {
    case 'katzen':
      for (let i = 0; i < 4; i++) bildURLs.push(`https://cataas.com/cat?t=${r}_${i}`);
      break;
    case 'hunde':
      try {
        const res = await fetch('https://dog.ceo/api/breeds/image/random/4');
        const data = await res.json();
        bildURLs = data.message;
      } catch (e) {
        for (let i = 0; i < 4; i++) bildURLs.push(`https://picsum.photos/400/300?random=${r + i}`);
      }
      break;
    case 'pokemon-gen1':
      for (let i = 0; i < 4; i++) {
        const pId = Math.floor(Math.random() * 151) + 1;
        bildURLs.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pId}.png`);
      }
      break;
    case 'standard':
    default:
      for (let i = 0; i < 4; i++) bildURLs.push(`https://picsum.photos/400/300?random=${r + i}`);
      break;
  }

  bildURLs.forEach((url, idx) => {
    const card = document.createElement('div');
    card.className = 'galerie-karte';
    card.style.cssText = "background: #181818; padding: 10px; border-radius: 8px; border: 1px solid #333; text-align: center;";
    card.innerHTML = `
      <img src="${url}" alt="KI Bild ${idx + 1}" style="width:100%; height:200px; object-fit:contain; border-radius:6px; background:#000;">
      <div class="galerie-buttons" style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
        <button onclick="oeffnePaintModal(${idx + 1}, '${url}')">🎨 Bearbeiten</button>
        <button onclick="oeffneBeschreibungModal(${idx + 1})">💬 Beschreiben</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ====================================================
// 5. FREIES MALEN SYSTEM
// ====================================================
let aktuellesFreiWerkzeug = 'bleistift';
let freiCanvas, freiCtx, freiIsDrawing = false;

function initFreiesCanvas() {
  freiCanvas = document.getElementById('frei-paint-canvas');
  if (!freiCanvas) return;

  freiCanvas.width = freiCanvas.offsetWidth || 800;
  freiCanvas.height = 450;
  freiCtx = freiCanvas.getContext('2d');
  
  freiCtx.fillStyle = '#111111';
  freiCtx.fillRect(0, 0, freiCanvas.width, freiCanvas.height);

  const startFn = (e) => {
    freiIsDrawing = true;
    const pos = holeKoordinaten(e, freiCanvas);
    freiCtx.beginPath();
    freiCtx.moveTo(pos.x, pos.y);
  };

  const moveFn = (e) => zeugeFreiMalen(e);

  const stopFn = () => {
    freiIsDrawing = false;
    if (freiCtx) freiCtx.beginPath();
  };

  freiCanvas.onmousedown = startFn;
  freiCanvas.onmousemove = moveFn;
  freiCanvas.onmouseup = stopFn;
  freiCanvas.onmouseleave = stopFn;

  freiCanvas.ontouchstart = (e) => { e.preventDefault(); startFn(e); };
  freiCanvas.ontouchmove = (e) => { e.preventDefault(); moveFn(e); };
  freiCanvas.ontouchend = stopFn;

  rendereFreiUserListe();
}

function setzeFreiWerkzeug(werkzeug, evt) {
  aktuellesFreiWerkzeug = werkzeug;
  document.querySelectorAll('#tab-freies-malen .btn-tool').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');
}

function zeugeFreiMalen(e) {
  if (!freiIsDrawing || !freiCtx || !freiCanvas) return;

  const pos = holeKoordinaten(e, freiCanvas);
  const farbe = document.getElementById('frei-paint-farbe')?.value || '#00f3ff';
  const groesse = parseFloat(document.getElementById('frei-paint-groesse')?.value) || 5;

  freiCtx.strokeStyle = farbe;
  freiCtx.fillStyle = farbe;
  freiCtx.lineWidth = groesse;

  if (aktuellesFreiWerkzeug === 'radiergummi') {
    freiCtx.fillStyle = '#111111';
    freiCtx.fillRect(pos.x - groesse / 2, pos.y - groesse / 2, groesse * 2, groesse * 2);
    return;
  }

  if (aktuellesFreiWerkzeug === 'bleistift' || aktuellesFreiWerkzeug === 'kugelschreiber') {
    freiCtx.lineCap = 'round';
    freiCtx.lineTo(pos.x, pos.y);
    freiCtx.stroke();
  } else if (aktuellesFreiWerkzeug === 'spray') {
    for (let i = 0; i < 15; i++) {
      const offsetX = (Math.random() - 0.5) * (groesse * 3);
      const offsetY = (Math.random() - 0.5) * (groesse * 3);
      freiCtx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
    }
  }
}

function allesAusfuellenFreiCanvas() {
  if (!freiCtx || !freiCanvas) return;
  const farbe = document.getElementById('frei-paint-farbe')?.value || '#00f3ff';
  freiCtx.fillStyle = farbe;
  freiCtx.fillRect(0, 0, freiCanvas.width, freiCanvas.height);
}

function löscheFreiCanvas() {
  if (!freiCtx || !freiCanvas) return;
  freiCtx.fillStyle = '#111111';
  freiCtx.fillRect(0, 0, freiCanvas.width, freiCanvas.height);
}

function speichereFreiesGemälde() {
  const nameInput = document.getElementById('frei-paint-name');
  const name = nameInput ? nameInput.value.trim() : '';

  if (name === '') {
    document.getElementById('frei-paint-fehler')?.classList.remove('hidden');
    return;
  }

  document.getElementById('frei-paint-fehler')?.classList.add('hidden');

  const gemaeldeData = {
    autor: name,
    bildData: freiCanvas.toDataURL(),
    zeit: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  freieGemaelde.push(gemaeldeData);
  localStorage.setItem('freieGemaelde', JSON.stringify(freieGemaelde));

  nameInput.value = '';
  löscheFreiCanvas();
  rendereFreiUserListe();
  alert('Dein Kunstwerk wurde erfolgreich gespeichert!');
}

// ====================================================
// 6. KI-STUDIO & ANALYSE
// ====================================================
let studioCanvas, studioCtx, studioIsDrawing = false;
let aktuellesStudioWerkzeug = 'bleistift';

function initStudioCanvas() {
  studioCanvas = document.getElementById('studio-paint-canvas');
  if (!studioCanvas) return;

  studioCanvas.width = studioCanvas.offsetWidth || 800;
  studioCanvas.height = 450;
  studioCtx = studioCanvas.getContext('2d');

  if (!studioCanvas.dataset.hasImage) {
    studioCtx.fillStyle = '#111111';
    studioCtx.fillRect(0, 0, studioCanvas.width, studioCanvas.height);
  }

  const startFn = (e) => {
    studioIsDrawing = true;
    const pos = holeKoordinaten(e, studioCanvas);
    studioCtx.beginPath();
    studioCtx.moveTo(pos.x, pos.y);
  };

  const moveFn = (e) => zeichneStudioCanvas(e);

  const stopFn = () => {
    studioIsDrawing = false;
    if (studioCtx) studioCtx.beginPath();
  };

  studioCanvas.onmousedown = startFn;
  studioCanvas.onmousemove = moveFn;
  studioCanvas.onmouseup = stopFn;
  studioCanvas.onmouseleave = stopFn;

  studioCanvas.ontouchstart = (e) => { e.preventDefault(); startFn(e); };
  studioCanvas.ontouchmove = (e) => { e.preventDefault(); moveFn(e); };
  studioCanvas.ontouchend = stopFn;
}

function ladeStudioBildHoch(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      initStudioCanvas();
      if (studioCtx && studioCanvas) {
        studioCanvas.dataset.hasImage = "true";
        studioCtx.clearRect(0, 0, studioCanvas.width, studioCanvas.height);
        studioCtx.drawImage(img, 0, 0, studioCanvas.width, studioCanvas.height);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setzeStudioWerkzeug(werkzeug, evt) {
  aktuellesStudioWerkzeug = werkzeug;
  document.querySelectorAll('#tab-ki-studio .btn-tool').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');
}

function zeichneStudioCanvas(e) {
  if (!studioIsDrawing || !studioCtx || !studioCanvas) return;

  const pos = holeKoordinaten(e, studioCanvas);
  const farbe = document.getElementById('studio-paint-farbe')?.value || '#ff007f';
  const groesse = parseFloat(document.getElementById('studio-paint-groesse')?.value) || 5;

  studioCtx.strokeStyle = farbe;
  studioCtx.fillStyle = farbe;
  studioCtx.lineWidth = groesse;

  if (aktuellesStudioWerkzeug === 'bleistift' || aktuellesStudioWerkzeug === 'kugelschreiber') {
    studioCtx.lineCap = 'round';
    studioCtx.lineTo(pos.x, pos.y);
    studioCtx.stroke();
  } else if (aktuellesStudioWerkzeug === 'spray') {
    for (let i = 0; i < 15; i++) {
      const offsetX = (Math.random() - 0.5) * (groesse * 3);
      const offsetY = (Math.random() - 0.5) * (groesse * 3);
      studioCtx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
    }
  }
}

function speichereStudioBild() {
  const nameInput = document.getElementById('studio-paint-name');
  const name = nameInput ? nameInput.value.trim() : '';

  if (name === '') {
    alert('Bitte gib deinen Namen ein!');
    return;
  }

  const gemaeldeData = {
    autor: name,
    bildData: studioCanvas.toDataURL(),
    zeit: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  freieGemaelde.push(gemaeldeData);
  localStorage.setItem('freieGemaelde', JSON.stringify(freieGemaelde));

  if (nameInput) nameInput.value = '';
  alert('Bild im KI-Studio gespeichert!');
  rendereFreiUserListe();
}

function analysiereKiBild(modus) {
  const modal = document.getElementById('modal-ki-output');
  const textElem = document.getElementById('ki-output-text');
  const titelElem = document.getElementById('ki-output-titel');

  if (!modal || !textElem) return;

  if (modus === 'analyse') {
    titelElem.innerText = "🤖 KI-Analyse";
    textElem.innerText = "Das Bild zeigt eine dynamische Komposition mit starkem Farbkontrast und kreativem Fluss. Gut strukturiert!";
  } else if (modus === 'tipp') {
    titelElem.innerText = "💡 KI-Tipp";
    textElem.innerText = "Setze gezielt Glanzlichter an den Rändern, um dem Objekt mehr Tiefe und ein 3D-Gefühl zu verleihen.";
  } else if (modus === 'prompt') {
    titelElem.innerText = "✍️ KI-Prompt";
    textElem.innerText = "Prompt: 'Digital painting of a futuristic neon symbol, glowing in cyan and magenta, detailed line art, dark ambient background.'";
  }

  modal.classList.remove('hidden');
}

function schliesseKiOutputModal() {
  document.getElementById('modal-ki-output')?.classList.add('hidden');
}
// ====================================================
// 5. GESCHICHTEN-DATENBANK & BROWSER-STEUERUNG
// =======================================
const geschichtenDaten = {
  demenz: {
    titel: "Der kalte Gang",
    vorschau: "Ein feuchter Keller, Schritte in der Dunkelheit und die Panik im Nacken...",
    views: 0,
    rating: 0,
    kommentareCount: 0,
    genres: {
      original: `Der kalte und leicht nasse Luftzug aus den alten maroden Kellerräumen zog in meinen Nacken und sorgte für Gänsehaut, die ich am ganzen Körper verspürte. Die Angst beherrschte meine Gedanken und sorgte dafür, dass ich an jeder Ecke befürchtete, dass dort etwas Schlimmes passieren könnte, dass jemand kommen könnte und mich findet. Nichts ahnend ging ich immer weiter durch die kalten und dunklen Kellergänge, dabei waren die lautesten Worte in meinem Kopf: "Werde ich hier sterben?"

Ein Tropfen fiel in meinen Nacken und ließ mich für einen Moment erstarren und innehalten. Ich dachte nur daran, dass ich hier schnellstmöglich raus muss, zurück ins Tageslicht. Ob es überhaupt hell draußen war oder ob ich in einer belebten Gegend war, wusste ich nicht. Ein lauter Schrei ertönte aus der Richtung, aus der ich kam. Ich lief den Gang immer schneller entlang. Links, rechts, einfach weiter – nicht immer die gleiche Richtung nehmen, damit ich nicht aus Versehen im Kreis laufe. Ich spürte, wie die Panik in mir immer größer wurde, bis ich anfing, immer schneller zu atmen. Beim Laufen versuchte ich mir zu merken, ob ich schon irgendeine Tür gesehen hatte. Die Verzweiflung schlich sich immer mehr in meine Gedanken, sie sorgte dafür, dass einige Tränen über mein Gesicht flossen.

Total benebelt von meinen Gedanken und dem Laufen, stolperte ich über einen erhöhten Stein und zog mir eine Schürfwunde zu, sie brannte und juckte aber das konnte ich schnell wieder ausblenden denn mein Kopf war viel zu beschäftigt mit den anderen Gedanken als sich dem Schmerz zu widmen. Ich fasste neuen Mut, lief weiter in die Richtung, aus der ein leichter Luftstrom durch meine Haare wehte. Ausgang war das Wort, was sich in meinen Gedanken ständig wiederholte bis ich auf einmal stolperte, über den gleichen Stein wie schon zuvor. Ich realisierte, dass ich im Kreis lief und fing an zu Boden zu sinken. Ich weinte und wusste nicht mehr weiter. Meine Gedanken kreisten und ich fing an zu schreien, auch wenn mich jemand bemerken könnte, in dem Moment wollte ich nur noch aus dieser Situation raus, raus aus diesen nassen, dunklen Kellerräumen.

Die Zeit verging und ich verzweifelte immer mehr, mehr Tränen, mehr Schreie, nach einer Weile saß ich ganz auf dem Boden, alles sah einfach nur gleich aus. Verzweiflung machte sich breit und ich sah keine Chance mehr jemals diesen Ausgang zu finden. Ich starrte auf meine Schürfwunde am Knie und sah wie ein Bluttropfen an meinem Bein herunterlief, der Gedanke dass sich die Wunde entzünden konnte, wurde immer lauter, weil hier unten alles kalt, nass und dreckig war.

Es riss mich aus meinen Gedanken, als ich plötzlich Schritte hörte, sie klangen weit weg, so weit weg und leise, dass ich die Richtung nicht bestimmen konnte. Ein Zwiespalt machte sich in mir breit, sollte ich sitzen bleiben und warten, aber worauf? Oder sollte ich weglaufen, aber wohin? Fragen über Fragen und trotzdem werde ich die richtige Antwort nicht rechtzeitig finden. Ich stand auf und ging doch weiter, denn alles andere ergab für mich keinen Sinn. Der Schmerz der Schürfwunde zog durch mein ganzes Bein und ich fing an unbewusst leicht zu humpeln.

Die Schritte, die ich vernahm, wurden lauter und ich war mir in dem Moment immer noch nicht sicher, ob es richtig ist weiter wegzulaufen oder doch zu warten bis mich jemand findet. An der nächsten Ecke überwog der Gedanke, wissen zu wollen, wer mich verfolgte. Ich blieb stehen, wartete und in dem Moment hörte ich meinen Herzschlag und meinen Puls immer schneller werden. Diese Angst und gleichzeitige Aggression ließen das Adrenalin in die Höhe schießen, so sehr, dass ich es in den Adern spürte und es mir das Gefühl gab alles und jeden zu Boden zu reißen, der sich mir und meiner Freiheit in den Weg stellen wollte. Still stehend versuchte ich herauszuhören wie viele Schritte es sein könnten. "Wie viele kamen dort auf mich zu? Wer oder was könnte der Mensch oder die Menschen von mir wollen? Sollte ich direkt zuschlagen, sollte ich erst fragen? Was soll ich machen, wenn ich jemanden sehe?" sagte ich so leise wie noch nie zu mir selbst.

Die Schritte wurden hörbar schneller und kamen immer näher und näher. Mein Puls stieg noch weiter an und sorgte für ein drückendes Engegefühl in meinem Hals. Ich dachte dass mir die Luft zum Atmen wegbleibt, da es mir immer schwerer fiel und ich spürte dass die Schnelligkeit meiner Atmung nicht mehr unter meiner Kontrolle war. Ich wurde nervöser, unruhiger und bemerkte dass sich Panik ausbreitete, was sich mit größer werdender Verzweiflung mischte. Im nächsten Moment nahm ich nur noch die Schritte wahr die keine zwei Minuten mehr von mir entfernt waren. Das war das Signal für meinen Körper alles an Adrenalin auszusschütten, was ich noch zur Verfügung hatte. Mein Puls ging noch mehr in die Höhe, mein Herz fing an zu schmerzen, mein Kopf fühlte sich an als würde er jede Sekunde platzen und meine Lungen als würden sie gleich kollabieren. Währenddessen schoss mir eine Frage durch den Kopf: "Sollte ich vielleicht jetzt mit meinem Leben abschließen?"

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

Schritte hallten durch den Gang. Schwer, dominant und immer näher kommen. Mein Puls raste, mein Körper bebte vor Erwartung. Wer war dieser Unbekannte, der mich jagte?

Als die Gestalt schließlich um die Ecke trat, raubte mir der Anblick den Atem. Mit einem intensiven, raunenden Blick trat die Person an mich heran. "Da bist du ja...", hauchte eine dunkle Stimme. Eine warme, kräftige Hand legte sich sanft, aber bestimmt auf meine Schulter und zog mich nah heran. Der vertraute, berauschende Duft des Parfums stieg mir in die Nase – eine Umarmung, die mich alle Angst auf der Stelle vergessen ließ...`
    }
  },

  platinen: {
    titel: "Der Platinen-Abgrund: Überleben im Kern",
    vorschau: "Ein Sturz in die Finsternis, kaputte Werkzeuge und ein harter Kampf ums Überleben...",
    klasse: "card-geschichte-2",
    views: 0,
    rating: 0,
    kommentareCount: 0,
    genres: {
      original: `Kapitel 1: Der Sturz in die Tiefe

Ein ganz normaler Arbeitstag – dachte ich zumindest. Ich muss die Außenfassade im Sektor B-11 überprüfen. Das ist das Viertel der Unterschicht, wo die Luft nach heißem Metall und altem Ozon schmeckt. Anscheinend haben ein paar Platinen einen Defekt. Ich bin AJ und arbeite seit drei Jahren als offizielle Wartungsangestellte. Für jemanden wie mich, der aus einer Familie von „Kupfer-Putzern“ stammt, ist das ein echter Aufstieg.

Wir leben in einem gigantischen Hightech-Magnetwürfel, der uns vor der „Großen Leere“ schützt – einer endlosen Wüste da draußen, die alles Leben verschlingt. Der Platinen-Abgrund ist die Haut unseres Würfels. Würden die Platinen versagen, würde der Magnetismus nachlassen und der Wüstensand uns zerquetschen.

Ich packe Proviant für zwei Tage und kümmere mich um Bavin 787, meine Katze aus Fleisch und Blut. Ein schneller Kuss auf das Foto meiner Süßen, dann geht es los. Am Rand des Abgrunds lasse ich mich am Seil hinab. Doch dann: Sirenen. Ein Polizeiwagen rast über meinen Sicherheitsanker. Ein Kreischen von berstendem Metall, das Seil reißt wie ein Peitschenhieb. Sekundenlang gibt es nur den freien Fall, bis die Welt in Schmerz explodiert.


Kapitel 2: Blut und Silizium

Als ich wieder zu mir komme, liege ich auf einem Leichnam. Ein Toter hat meinen Sturz abgefedert. Ich versuche, nach meinem Werkzeug zu greifen, doch mein Herz sinkt: Mein Multimeter ist zerbrochen, die Lötstation Schrott. „Verdammt!“, schluchze ich. Ich kann hier unten gar nichts reparieren. Alles umsonst.

Ein markerschütternder Schmerz explodiert in meinem linken Knöchel, als ich mich bewege. Mein Fuß steht in einem unnatürlichen Winkel ab. Jede kleinste Bewegung schickt eine Schockwelle durch mein Bein. Ich schiebe mich vom Toten herunter und finde ein verrostetes Metallrohr. Ich nehme es mit – mein einziges „Werkzeug“ in dieser Hölle.

Der Anblick ist widerlich, und der Gedanke an das, was ich tun muss, lässt meinen Magen revoltieren. Ich zögere, das Metallrohr zu heben. Es kostet mich eine unfassbare Überwindung, den harten Widerstand des Gewebes zu durchstoßen. Es ist unhygienisch, gefährlich – wer weiß, welche Infektionen hier unten lauern? Aber der Durst ist stäker als der Ekel. Mit zitternden Händen ramme ich das Rohr in den Hals des Toten, um ein paar Tropfen metallisch schmeckendes Blut zu gewinnen. Es ist ein Akt der puren Verzweiflung.


Kapitel 3: Das Licht am Ende

Der Schmerz im Bein ist mittlerweile ein dumpfes Dröhnen, das mein Denken vernebelt. Endlich erreiche ich das Schild der Rettungskammer. Ich drücke den Knopf, binde mir das Seil um und werde nach oben gezogen. Jedes Mal, wenn mein gebrochener Fuß gegen eine Kante schlägt, schreie ich lautlos auf.

Oben angekommen, sehe ich sie. Meine Süße nimmt mich stürmisch in den Arm. Ich spüre ihre Wärme, ihre Tränen auf meiner Haut. Ich versuche etwas zu sagen, doch die Erschöpfung gewinnt. In ihren Armen verliere ich das Bewusstsein.

Einige Stunden später öffne ich die Augen. Bavin 787 schnurrt auf meinem Bauch. Es riecht nach Pommes und Porree-Salat. Meine Süße steht am Herd, und als sie sieht, dass ich wach bin, kommt sie sofort herüber.

„Ich dachte, ich hätte dich verloren“, flüstert sie und streichelt mir übers Haar. Ich nehme ihre Hand. „Es war... wie in einem Albtraum. Überall Leichen, diese blauen Blitze... und mein Werkzeug ist weg. Ich konnte nichts reparieren. Ich bin nur gekrochen, nur um wieder zu dir zu kommen. Der Schmerz im Fuß hat mich fast wahnsinnig gemacht, aber ich musste an dich denken.“ Ich schaue sie fest an. „Danke, dass du hier bist. Ich liebe dich so sehr. Was ich dich eigentlich schon im Sektor B-11 fragen wollte... willst du bei mir einziehen?“

Sie lächelt durch ihre Tränen. „Ich bin schon längst hier, AJ. Die Koffer stehen im Flur. Ich lass dich nie wieder allein in diesen Abgrund. Und Bavin 787 habe ich auch schon adoptiert.“ Tränen laufen mir übers Gesicht. Ich bin endlich sicher.`,

      horror: `Kapitel 1: Das Grab im Stahl

Sektor B-11 stank nach Tod und verbranntem Fleisch. Als Wartungsangestellte AJ wusste ich, dass die Platinen am Rande des Magnetwürfels versagten. Doch es war keine gewöhnliche Störung. Aus den dunklen Ritzen der Wände drang ein trockenes, schabendes Geräusch, als würde der Wüstensand draußen gierig an unserer Zuflucht kauen.

Nach einem flüchtigen Abschied von meiner Katze Bavin 787 und einem Blick auf das Foto meiner Liebsten stieg ich in die Tiefe. Plötzlich ertönten Sirenen wie das Geschrei Sterbender. Ein Polizeiwagen krachte in meinen Sicherheitsanker. Das Seil riss. Ich fiel – vorbei an schimmernden Silizium-Eingeweiden – hinein in eine tiefschwarze, hungrige Finsternis.


Kapitel 2: Fleisch und Korrosion

Ich erwachte auf etwas Weichem, Nassmachendem. Unter mir lag ein entstellter, kalter Kadaver, dessen Augen mich starr aus der Dunkelheit anstarrten. Mein Sturz war abgefedert worden, doch mein Werkzeug war zermalmt. Ein entsetzlicher Schmerz durchzuckte mein Bein: Mein Fuß stand völlig verdreht nach hinten ab, die Knochen splitterten unter der Haut.

Ein unerträglicher Brand brannte in meiner Kehle. Von Verzweiflung getrieben, griff ich nach einem verrosteten Metallrohr. Der Leichnam unter mir hatte bereits grünliche Verwesungsflecken, doch der Durst trieb mich in den Wahnsinn. Mit einem feuchten, krachenden Geräusch stieß ich das Rohr in die Halsschlagader der Leiche. Der dicke, metallische Saft lief mir über das Kinn – verflucht, unhygienisch, voller Erreger, aber es war das einzige Elixier, das mich vor dem Tod bewahrte.


Kapitel 3: Das blutige Erwachen

Halb wahnsinnig vor Schmerz schleifte ich meinen gebrochenen Körper zur Rettungskammer. Die Seilwinde zog mich nach oben, während mein zertrümmertes Bein grausam an den Stahlkanten entlangschleifte.

Oben fing mich meine Süße auf. Ihr Schrei hallte in meinen Ohren nach, ehe mich das schwarze Nichts verschlang. Als ich Stunden später erwachte, lag Bavin 787 schwer auf meiner Brust. Der süßliche Geruch von Essen vermischte sich mit dem Gestank von Verwesung, den ich noch immer in der Nase hatte.

Meine Liebste kniete neben mir, die Augen rot geweint. Ich fasste ihre zitternde Hand: „Es war die Hölle da unten... Überall Verstümmelung und Finsternis. Aber dein Bild hat mich am Leben gehalten. Willst du zu mir ziehen?“ Sie nickte schluchzend und zeigte auf die Koffer. Doch als ich die Augen schloss, spürte ich noch immer den kalten Geschmack des Blutes auf meiner Zunge.`,

      krimi: `Kapitel 1: Der Sabotagefall

Ein Routineeinsatz in Sektor B-11 entpuppte sich rasch als Tatort. Wartungstechnikerin AJ verließ die Unterkunft, nachdem sie Katze Bavin 787 versorgt und ihre Lebensgefährtin benachrichtigt hatte. Am Magnetwürfel schwächelten die Systeme – doch die Telemetrie deutete auf Fremdeinwirkung hin.

Beim Abseilen geschah das Verbrechen: Ein herannahender Streifenwagen kappte durch gezielte Rammung den Sicherheitsanker. Sabotage. Das Seil riss präzise unter der Belastungsgrenze, und AJ stürzte in den unbeleuchteten Versorgungsschacht.


Kapitel 2: Spurensicherung im Untergrund

Der Aufprall wurde durch das Opfer eines früheren Verbrechens gedämpft. AJ erlangte das Bewusstsein auf einer männlichen Leiche wieder. Die Analyse der Ausrüstung ergab Totalschaden: Multimeter und Lötstation waren unbrauchbar gemacht worden.

Trotz einer schweren Fraktur des linken Sprunggelenks sicherte AJ ein verrostetes Metallrohr als Primärwerkzeug und Beweismittel. Um ein Verdursten in der isolierten Zone zu verhindern, nutzte sie das Rohr zur Entnahme von Körperflüssigkeit aus der Halsschlagader des Leichnams. Eine extreme, aber unter den gegebenen Umständen logische Überlebensmaßnahme zur Aufrechterhaltung der Vitalfunktionen.


Kapitel 3: Die Aussage

Unter Erhaltung der letzten Kräfte aktivierte AJ den Notruf der Rettungskammer. Am oberen Ausstieg nahm ihre Partnerin die Schwerverletzte in Empfang, woraufhin AJ aufgrund des traumatischen Schocks kollabierte.

Die Rekonstruktion der Ereignisse erfolgte Stunden später in der gemeinsamen Wohnung. Bei Porree-Salat und Pommes gab AJ zu Protokoll: „Der Sturz war kein Unfall. Die Ausrüstung wurde zerstört, aber ich habe überlebt.“ Im Zuge der Beweisaufnahme stellte AJ die entscheidende private Frage bezüglich des gemeinsamen Wohnsitzes. Die Koffer im Flur bestätigten, dass die Ermittlungen in diesem Fall mit einer Zusammenlegung der Haushalte abgeschlossen werden konnten.`,

      kindlich: `Kapitel 1: Die Reise in die Tiefe

AJ hatte einen ganz besonderen Beruf: Sie war die Beschützerin der riesigen Zauber-Platinen, die die ganze Stadt wie ein bunter Magnetwürfel zusammenhielten! Wenn die Platinen kitzelten oder wackelten, musste AJ nach dem Rechten sehen.

An diesem Morgen fütterte sie noch schnell ihre kleine Schnurr-Katze Bavin 787, gab ihrer Lieblingsperson einen dicken Kuss und machte sich auf den Weg. Doch huch! Ein rasantes Spielzeug-Polizeiauto sauste vorbei und schubste versehentlich AJs Kletterseil um. *Pling!* – und AJ rutschte wie auf einer riesigen Rutsche tief hinab ins Abenteuerland.


Kapitel 2: Eine knifflige Aufgabe

*Puff!* AJ landete weich auf einem großen, alten Schutzanzug, der unten im Schacht lag. Schade aber auch: Das Werkzeug war leider im Eimer. Und auwei, der linke Fuß tat ganz schön weh und war etwas verdreht.

Aber AJ gab nicht auf! Sie fand ein Alurohr und schaffte es mit viel Mut und Mühe, ein paar Wassertropfen aus den alten Vorratsleitungen zu fischen, um den großen Durst zu löschen. Bäh, schmeckte das ein bisschen nach Blech! Aber ein echter Abenteurer hält durch.


Kapitel 3: Wieder zu Hause

Mit Ruckzuck-Kraft kroch AJ zur Notfall-Glocke. *Bimm-Bimm!* Ein Zauberseil zog sie wieder nach oben, direkt in die Arme ihrer Liebsten. Die drückte AJ ganz fest, bis AJ vor Müdigkeit ein kleines Nickerchen machte.

Als sie aufwachte, lag Katze Bavin 787 schnurrend auf ihrem Bauch und es duftete lecker nach knusprigen Pommes! „Möchtest du eigentlich fest bei mir einziehen?“, fragte AJ ganz lieb. Ihre Freundin strahlte übers ganze Gesicht: „Aber klar doch, meine Koffer stehen schon da!“ Und so kuschelten sie sich zusammen und wussten, dass alles gut war.`,

      erotisch: `Kapitel 1: Gefährliche Hingabe

Die Luft im Sektor B-11 war heiß, aufgeladen mit Knistern und dem berauschenden Duft von Ozon. Als Wartungsangestellte AJ verlangte mir dieser Ort alles ab. Doch bevor ich mich in die Tiefe des Magnetwürfels vagte, gehörte mein ganzer Gedanke meiner Liebsten. Das Foto auf meinem Tisch ließ meine Haut kribbeln. Ein sanftes Streicheln über das Fell von Katze Bavin 787, dann ließ ich mich am Seil hinab.

Doch die Kontrolle entglitt mir brutal. Sirenen heulten, ein Wagen riss meine Verankerung los. Das Seil peitschte durch die Luft, und ich ergab mich dem hilflosen, Rausch-ähnlichen freien Fall in den Abgrund.


Kapitel 2: Schmerz und Begehren

Ich erwachte auf einem fremden, leblosen Körper. Mein eigener Leib brannte. Mein Werkzeug war zerstört, mein Fuß in einer schrecklich verlockenden, schmerzvollen Hilflosigkeit gefangen. Jede Bewegung schickte heiße Wellen durch meine Nerven.

Die Hitze in der Tiefe ließ meine Lippen austrocknen. Ein dunkles, Verzweiflung-getriebenes Verlangen nach Überleben ergriff Besitz von mir. Ich nahm ein kühles Metallrohr, stieß es durch das feste Gewebe am Hals des Leichnams und saugte die dunkle, metallisch schmeckende Flüssigkeit auf. Es war ein intimer, verbotener Akt des puren Überlebenswillens, der mein Herz wie wild gegen meine Rippen hämmern ließ.


Kapitel 3: In deinen Armen

Als die Rettungskammer mich nach oben zog, war jeder Stoß an meinem Bein eine Qual, die mich stöhnen ließ. Doch oben warteten ihre weichen Lippen, ihre zitternden Hände, die gierig nach mir griffen. Ich spürte ihre Körperschmelze, ehe die Dunkelheit mich einhüllte.

Ich erwachte beim Duft von warmem Essen. Bavin 787 lag auf meinem Leib, doch mein Blick suchte nur sie. Sie trat an mein Bett, streichelte zärtlich über meine erhitzte Haut. „Es war ein Albtraum“, flüsterte ich, meine Stimme rau vor Verlangen und Erschöpfung. „Ich habe nur an deinen Körper, deine Wärme gedacht... Zieh bei mir ein. Bleib für immer.“`
    }
  }
};

function ladeGeschichtenUebersicht() {
  const container = document.getElementById('geschichten-grid');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(geschichtenDaten).forEach(key => {
    const geschichte = geschichtenDaten[key];
    const klicks = Number(localStorage.getItem(`klicks-${key}`)) || 0;

    const karte = document.createElement('div');
    karte.className = `geschichte-karte ${geschichte.klasse || ''}`;
    karte.style.cssText = "background: #222; padding: 15px; border-radius: 8px; border: 1px solid #444;";
    karte.innerHTML = `
      <h3>${geschichte.titel}</h3>
      <p>${geschichte.vorschau}</p>
      <div style="display: flex; justify-content: space-between; margin-top: 15px; align-items: center;">
        <span>👁️ <strong id="klicks-${key}">${klicks}</strong></span>
        <button onclick="oeffneGeschichteModal('${key}')">Lesen</button>
      </div>
    `;
    container.appendChild(karte);
  });
}

function oeffneGeschichteModal(key) {
  aktuellesStoryKey = key;
  const geschichte = geschichtenDaten[key];
  if (!geschichte) return;

  const modal = document.getElementById('modal-geschichte');
  const titelElem = document.getElementById('geschichte-titel');
  const textElem = document.getElementById('geschichte-text');

  if (titelElem) titelElem.innerText = geschichte.titel;
  if (textElem) textElem.innerText = geschichte.inhalt;

  let klicks = Number(localStorage.getItem(`klicks-${key}`)) || 0;
  klicks++;
  localStorage.setItem(`klicks-${key}`, klicks);

  const klickElem = document.getElementById(`klicks-${key}`);
  if (klickElem) klickElem.innerText = klicks;

  modal?.classList.remove('hidden');
}

function schliesseGeschichteModal(e) {
  if (!e || e.target.id === 'modal-geschichte' || e.target.classList.contains('btn-abbrechen')) {
    document.getElementById('modal-geschichte')?.classList.add('hidden');
  }
}

function wechsleGenre(genre) {
  document.querySelectorAll('.btn-genre').forEach(b => b.classList.remove('active'));
  const btn = event?.target;
  if (btn) btn.classList.add('active');

  const textElem = document.getElementById('geschichte-text');
  if (!textElem || !aktuellesStoryKey) return;

  const origText = geschichtenDaten[aktuellesStoryKey].inhalt;

  if (genre === 'horror') {
    textElem.innerText = origText + " ...Doch plötzlich erlosch das Licht und ein kaltes Lachen hallte durch die Finsternis.";
  } else if (genre === 'krimi') {
    textElem.innerText = "AKTE #404: " + origText + " Am Tatort hinterließ der Täter eine rätselhafte Botschaft.";
  } else {
    textElem.innerText = origText;
  }
}

// ====================================================
// 8. CLIPPER CATCHER GAME LOGIK
// ====================================================
let score = 0;
let herzen = 3;
let gameTimerInterval = null;
let spawnTimeout = null;
let verstreichendeSekunden = 0;
let aktuellesTempo = 2000;
let schwierigkeit = 'leicht';
let targetScore = 420;

function oeffneClipperSpiel() {
  document.getElementById('modal-clipper-game')?.classList.remove('hidden');
  document.getElementById('clipper-difficulty-select')?.classList.remove('hidden');
  document.getElementById('clipper-game-area')?.classList.add('hidden');
}

function starteClipperSpiel(selectedDifficulty) {
  schwierigkeit = selectedDifficulty || 'leicht';
  
  if (schwierigkeit === 'leicht') {
    targetScore = 420;
    aktuellesTempo = 2000;
  } else if (schwierigkeit === 'normal') {
    targetScore = 840;
    aktuellesTempo = 1500;
  } else {
    targetScore = 1260;
    aktuellesTempo = 1000;
  }

  score = 0;
  herzen = 3;
  verstreichendeSekunden = 0;

  document.getElementById('clipper-score').innerText = score;
  document.getElementById('clipper-herzen').innerText = '❤️❤️❤️';
  document.getElementById('clipper-timer').innerText = '00:00';

  document.getElementById('clipper-difficulty-select')?.classList.add('hidden');
  document.getElementById('clipper-game-area')?.classList.remove('hidden');

  starteClipperLoop();
}

function starteClipperLoop() {
  clearInterval(gameTimerInterval);
  clearTimeout(spawnTimeout);

  gameTimerInterval = setInterval(() => {
    verstreichendeSekunden++;
    const min = String(Math.floor(verstreichendeSekunden / 60)).padStart(2, '0');
    const sec = String(verstreichendeSekunden % 60).padStart(2, '0');
    document.getElementById('clipper-timer').innerText = `${min}:${sec}`;
  }, 1000);

  erzeugeClipperItem();
}

function erzeugeClipperItem() {
  const spielfeld = document.getElementById('clipper-spielfeld');
  if (!spielfeld) return;

  const altesItem = document.getElementById('active-clipper-item');
  if (altesItem) altesItem.remove();

  const item = document.createElement('div');
  item.id = 'active-clipper-item';
  item.style.cssText = `
    position: absolute;
    width: 40px;
    height: 40px;
    background: #ff007f;
    border-radius: 50%;
    cursor: pointer;
    left: ${Math.random() * (spielfeld.clientWidth - 50)}px;
    top: ${Math.random() * (spielfeld.clientHeight - 50)}px;
  `;

  item.onclick = () => {
    score += 60;
    document.getElementById('clipper-score').innerText = score;
    item.remove();

    if (score >= targetScore) {
      beendeClipperSpiel(true);
    } else {
      erzeugeClipperItem();
    }
  };

  spielfeld.appendChild(item);

  spawnTimeout = setTimeout(() => {
    if (document.getElementById('active-clipper-item')) {
      herzen--;
      document.getElementById('clipper-herzen').innerText = '❤️'.repeat(herzen);
      if (herzen <= 0) {
        beendeClipperSpiel(false);
      } else {
        erzeugeClipperItem();
      }
    }
  }, aktuellesTempo);
}

function beendeClipperSpiel(gewonnen = false) {
  clearInterval(gameTimerInterval);
  clearTimeout(spawnTimeout);

  document.getElementById('modal-clipper-game')?.classList.add('hidden');

  if (gewonnen) {
    document.getElementById('end-score').innerText = score;
    document.getElementById('end-time').innerText = document.getElementById('clipper-timer').innerText;
    document.getElementById('modal-game-over')?.classList.remove('hidden');
  }
}

function schliesseGameOverModal() {
  document.getElementById('modal-game-over')?.classList.add('hidden');
}

function speichereHighscore() {
  const player = document.getElementById('player-name')?.value.trim() || 'Anonym';
  highscores.push({
    spieler: player,
    punkte: score,
    zeit: document.getElementById('clipper-timer').innerText,
    schwierigkeit: schwierigkeit
  });

  localStorage.setItem('clipper_highscores', JSON.stringify(highscores));
  schliesseGameOverModal();
  oeffneHighscoreModal(schwierigkeit);
}

function oeffneHighscoreModal(kategorie = 'leicht') {
  document.getElementById('modal-highscore')?.classList.remove('hidden');
  zeigeHighscoreKategorie(kategorie);
}

function zeigeHighscoreKategorie(kategorie) {
  const liste = document.getElementById('highscore-liste');
  if (!liste) return;
  liste.innerHTML = '';

  const gefiltert = highscores.filter(h => h.schwierigkeit === kategorie);

  gefiltert.forEach(entry => {
    const li = document.createElement('li');
    li.style.cssText = "padding: 5px; border-bottom: 1px solid #333; color: #fff;";
    li.innerText = `👤 ${entry.spieler} - ${entry.punkte} Pkt (${entry.zeit})`;
    liste.appendChild(li);
  });
}

function schliesseHighscoreModal() {
  document.getElementById('modal-highscore')?.classList.add('hidden');
}

// ====================================================
// 9. MINISPIEL: TITEL ERRATEN
// ====================================================
function starteTitelRatenSpiel() {
  const titel = prompt("🎨 Welcher Kunst-Titel passt zu einer bunten Mona Lisa?\n1) Die Farbige\n2) Cyberpunk Lisa\n3) Neon Smile");
  if (titel === "2" || titel?.toLowerCase() === "cyberpunk lisa") {
    alert("🎉 Richtig geraten!");
  } else if (titel) {
    alert("Leider falsch! Die richtige Antwort war 'Cyberpunk Lisa'.");
  }
}

// ====================================================
// 10. INITIALISIERUNG BEIM SEITENLADEN
// ====================================================
window.addEventListener('DOMContentLoaded', () => {
  initFreiesCanvas();
  initStudioCanvas();
  rendereKiUserListe();
  rendereFreiUserListe();
});
