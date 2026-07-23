function zeigeBereich(bereichId) {
  // Versteckt die Startseite komplett
  document.querySelector('header').classList.add('hidden');
  document.querySelector('.navigation-grid').classList.add('hidden');
  
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
  document.querySelector('header').classList.remove('hidden');
  document.querySelector('.navigation-grid').classList.remove('hidden');
}
