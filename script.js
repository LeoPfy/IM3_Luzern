// script.js

document.addEventListener('DOMContentLoaded', () => {

  // === 1. DOM-Elemente auswählen ===
  const timeDropdown = document.getElementById('timeDropdown');
  const timeMenu = document.getElementById('timeMenu');
  const timeLabel = timeDropdown.querySelector('.dropdown__label');
  const dateInput = document.getElementById('date'); 
  const selectButton = document.querySelector('.btn');
  const heroSection = document.querySelector('.hero');
  const stampElements = document.querySelectorAll('.stamp');
  
  const SWAN_VALUE = 10;
  
  let swanContainer = document.querySelector('.swan-container');
  if (!swanContainer) {
    swanContainer = document.createElement('div');
    swanContainer.className = 'swan-container';
    const stage = document.querySelector('.stage');
    if (stage) {
      stage.insertBefore(swanContainer, stage.firstChild);
    } else {
      heroSection.appendChild(swanContainer); 
    }
  }

  // Aktueller Zustand: Speichert, ob Gesamt- oder Detailansicht
  let currentView = {
    location: 'Gesamt',
    messzeit: null,
  };
  
  // Variable für den Animations-Loop
  let swanAnimationInterval = null;


  // === 2. Dropdown mit Zeiten füllen ===
  async function populateTimeDropdown() {
    timeMenu.innerHTML = '<li style="text-align:center;">Lade Zeiten...</li>';
    try {
      const response = await fetch('get_times.php');
      const availableTimes = await response.json();

      if (response.ok && Array.isArray(availableTimes) && availableTimes.length > 0) {
        
        timeMenu.innerHTML = '';
        
        const latestTime = availableTimes[0];
        const [latestDate, latestFullTime] = latestTime.split(' ');
        const latestFormattedTime = latestFullTime.substring(0, 5);

        // Standardwerte setzen
        dateInput.value = latestDate;
        timeLabel.textContent = `${latestFormattedTime} Uhr`;
        timeLabel.dataset.fullMesszeit = latestTime;
        currentView.messzeit = latestTime;

        availableTimes.forEach(fullMesszeit => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'dropdown__item';
          
          const [date, fullTime] = fullMesszeit.split(' ');
          const formattedTime = fullTime.substring(0, 5);

          button.textContent = `${formattedTime} Uhr`;
          button.dataset.fullMesszeit = fullMesszeit;

          button.addEventListener('click', () => {
            timeLabel.textContent = button.textContent;
            timeLabel.dataset.fullMesszeit = button.dataset.fullMesszeit;
            dateInput.value = date;
            currentView.messzeit = button.dataset.fullMesszeit;
            timeDropdown.classList.remove('open');
            // Bei Zeitwahl auf Gesamtansicht zurücksetzen
            updateView('Gesamt', currentView.messzeit);
          });

          li.appendChild(button);
          timeMenu.appendChild(li);
        });
        
      } else {
        timeLabel.textContent = "Keine Daten";
        timeMenu.innerHTML = '<li style="text-align:center;">Keine Messdaten gefunden.</li>';
      }
      
    } catch (error) {
      console.error('Fehler beim Laden der Uhrzeiten:', error);
      timeLabel.textContent = "Fehler: DB";
      timeMenu.innerHTML = '<li style="text-align:center; color:red;">Fehler beim Laden der Zeiten</li>';
    }
  }


  // === 3. Zentrale Funktion zum Laden und Anzeigen der Daten ===
  async function fetchAndDisplaySwans(locationID = 'Gesamt', fullMesszeit = currentView.messzeit) {
    if (!fullMesszeit) {
      swanContainer.innerHTML = 'Bitte wählen Sie zuerst eine Zeit aus.';
      return;
    }

    let apiUrl = `unload.php?messzeit=${encodeURIComponent(fullMesszeit)}`;

    if (locationID !== 'Gesamt') {
      apiUrl += `&location=${encodeURIComponent(locationID)}`;
    }
    
    try {
      document.body.style.pointerEvents = 'none';

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      let totalCounter = 0;
      
      if (locationID === 'Gesamt') {
          totalCounter = data.reduce((sum, entry) => sum + (parseInt(entry.counter, 10) || 0), 0);
      } else {
          const entry = data.find(e => e.location === locationID);
          totalCounter = (entry ? parseInt(entry.counter, 10) : 0);
      }

      const numberOfSwans = Math.ceil(totalCounter / SWAN_VALUE);
      
      renderSwans(numberOfSwans, locationID);

    } catch (error) {
      console.error('Fehler beim Laden der Counter-Daten:', error);
      swanContainer.innerHTML = '';
      const errorP = document.createElement('p');
      errorP.style.cssText = "color:red; text-align:center; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2;";
      document.querySelector('.stage').appendChild(errorP);
      
    } finally {
        setTimeout(() => {
          document.body.style.pointerEvents = 'auto';
        }, 500); 
    }
  }

  // Funktion zur Animation der Schwäne
  function animateSwans() {
    const activeSwans = swanContainer.querySelectorAll('.swan');
    
    activeSwans.forEach(swan => {
        // Zufällige Position (innerhalb 10% bis 80% des Viewports)
        const newLeft = 10 + Math.random() * 80;
        const newTop = 10 + Math.random() * 70;
        
        // Zufällige Grösse/Opazität, um Tiefe zu simulieren
        const newScale = 0.7 + Math.random() * 0.4;
        const newOpacity = 0.6 + Math.random() * 0.4;

        swan.style.left = `${newLeft}%`;
        swan.style.top = `${newTop}%`;
        swan.style.transform = `scale(${newScale})`; 
        swan.style.opacity = `${newOpacity}`;
    });
  }


  // === 4. Schwäne auf der Seite erstellen und bewegen ===
  function renderSwans(count, locationID) {
    // Animation stoppen, wenn eine neue Ansicht geladen wird
    if (swanAnimationInterval) {
        clearInterval(swanAnimationInterval);
        swanAnimationInterval = null;
    }
    
    const existingSwans = swanContainer.querySelectorAll('.swan');
    const existingCount = existingSwans.length;
    
    const errorP = document.querySelector('.stage p[style*="color:red"]');
    if (errorP) errorP.remove();


    if (locationID === 'Gesamt') {
        // --- GESAMT ANSICHT (SCHWIMMEN) ---
        
        // 1. Sanftes Entfernen alter Schwäne
        existingSwans.forEach((swan, index) => {
             // Setze eine kurze Transition für das Wegschwimmen
             swan.style.transition = 'all 1.5s ease-in-out';
             setTimeout(() => {
                swan.style.opacity = '0';
                swan.style.transform += ' scale(0)';
                swan.style.left = `${Math.random() * 100}vw`; 
                swan.style.top = `${Math.random() * 100}vh`; 
                setTimeout(() => swan.remove(), 1500);
            }, index * 10);
        });
        
        const cleanupDuration = existingCount > 0 ? 1500 : 0; 
        
        // 2. Erstellen neuer Schwäne und Start der Animation
        setTimeout(() => {
             swanContainer.innerHTML = ''; // Container leeren
             
             // Füge neue Schwäne hinzu
             for (let i = 0; i < count; i++) {
                const swan = document.createElement('img');
                swan.src = 'images/swan.png';
                swan.alt = 'Ein Schwan';
                swan.className = 'swan';
                
                // Setze Startposition und initialen Stil
                swan.style.position = 'absolute'; 
                swan.style.left = `${10 + Math.random() * 80}%`;
                swan.style.top = `${10 + Math.random() * 70}%`;
                swan.style.transform = `scale(${0.7 + Math.random() * 0.4})`;
                swan.style.opacity = `${0.6 + Math.random() * 0.4}`;
                
                // KEINE JS-Transition setzen, damit die lange CSS-Transition (z.B. 24s linear) gilt!
                
                swanContainer.appendChild(swan);
            }
            updateSwanCountText(count, locationID);
            
            // 3. Kontinuierliche Animation starten
            // NEU: Sofortiger Start der ersten Bewegung
            animateSwans(); 
            // Setze alle 18 Sekunden ein neues Ziel
            swanAnimationInterval = setInterval(animateSwans, 18000); 

        }, cleanupDuration); 

    } else {
        // --- DETAIL ANSICHT (BEWEGUNG ZUM STAMP) ---
        
        const targetElement = document.querySelector(`.stamp[data-location-id="${locationID}"] img`);
        const rect = targetElement ? targetElement.getBoundingClientRect() : null;
        
        const PADDING = 140;    
        const RANDOM_RADIUS = 4;
        
        if (!rect) {
            console.warn(`Ziel-Element für Location-ID "${locationID}" nicht gefunden.`);
            return;
        }

        const stampCenterX = rect.left + rect.width / 2;
        const stampCenterY = rect.top + rect.height / 2;

        // Schwäne hinzufügen/entfernen (sanft)
        if (count > existingCount) {
            for (let i = existingCount; i < count; i++) {
                const swan = document.createElement('img');
                swan.src = 'images/swan.png';
                swan.alt = 'Ein Schwan';
                swan.className = 'swan';

                // Setze die Transition FÜR DETAILANSICHT (4s)
                swan.style.transition = 'all 4s ease-in-out'; // NEU: 4s
                swan.style.left = `${10 + Math.random() * 80}%`;
                swan.style.top = `${10 + Math.random() * 70}%`;
                swan.style.transform = `scale(${0.7 + Math.random() * 0.4})`;
                swan.style.opacity = `${0.6 + Math.random() * 0.4}`;
                swanContainer.appendChild(swan);
            }
        } else if (count < existingCount) {
            for (let i = existingCount - 1; i >= count; i--) {
                setTimeout(() => {
                    if (existingSwans[i]) { 
                         // Setze kurze Transition für das Wegschwimmen
                        existingSwans[i].style.transition = 'all 1.5s ease-in-out';
                        existingSwans[i].style.opacity = '0';
                        existingSwans[i].style.transform += ' scale(0)'; 
                        existingSwans[i].style.left = `${Math.random() * 100}vw`; 
                        existingSwans[i].style.top = `${Math.random() * 100}vh`; 
                        setTimeout(() => existingSwans[i].remove(), 1500); 
                    }
                }, (existingCount - 1 - i) * 50); 
            }
        }

        // Alle finalen Schwäne zum Stamp bewegen
        const finalSwans = swanContainer.querySelectorAll('.swan');
        setTimeout(() => {
            finalSwans.forEach(swan => {
                // Setze die Transitionszeit für die Detailansicht auf 5s
                swan.style.transition = 'all 5s ease-in-out'; // NEU: 5s
                
                // Zufällige Positionierung um den Stamp
                const angle = Math.random() * 2 * Math.PI; 
                const distance = PADDING + Math.random() * RANDOM_RADIUS; 
                
                const targetX = stampCenterX + distance * Math.cos(angle);
                const targetY = stampCenterY + distance * Math.sin(angle);

                swan.style.position = 'fixed'; 
                swan.style.left = `${targetX - swan.offsetWidth / 2}px`; 
                swan.style.top = `${targetY - swan.offsetHeight / 2}px`; 
                swan.style.transform = `scale(${0.4 + Math.random() * 0.2})`;
                swan.style.opacity = `${0.8 + Math.random() * 0.2}`; 
            });
            updateSwanCountText(count, locationID);
        }, 100);
    }
  }
  
  // === 5. Hilfsfunktionen und Event-Handler ===

  function updateSwanCountText(count, locationID) {
    const existingHint = document.querySelector('.hint:not(.swan-hint)');
    let countElement = document.querySelector('.swan-hint');
    
    if (!countElement) {
        countElement = document.createElement('p');
        countElement.className = 'hint swan-hint';
        countElement.style.fontSize = '1.2em';
        if(existingHint) {
            existingHint.parentNode.insertBefore(countElement, existingHint.nextSibling);
        } else {
            heroSection.appendChild(countElement);
        }
    }
    
    const locationText = (locationID === 'Gesamt') ? 'alle Orte' : locationID;
    countElement.textContent = `Zeige ${count} Schwan${count === 1 ? '' : 'e'} für ${locationText}.`;
  }
  
  function updateView(locationID, messzeit) {
    currentView.location = locationID;
    currentView.messzeit = messzeit || currentView.messzeit;
    
    // Aktive Klasse am Stamp setzen
    stampElements.forEach(stamp => stamp.classList.remove('is-active'));
    
    if (locationID !== 'Gesamt') {
        const activeStamp = document.querySelector(`.stamp[data-location-id="${locationID}"]`);
        if (activeStamp) activeStamp.classList.add('is-active');
    }
    
    fetchAndDisplaySwans(currentView.location, currentView.messzeit);
  }
  
  // Dropdown-Toggle-Logik
  const toggle = timeDropdown.querySelector('.dropdown__toggle');
  toggle.addEventListener('click', () => {
    timeDropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!timeDropdown.contains(e.target)) {
      timeDropdown.classList.remove('open');
    }
  });

  // "Auswählen"-Button (Gesamtansicht mit neu gewählter Zeit)
  selectButton.addEventListener('click', () => {
      const fullMesszeit = timeLabel.dataset.fullMesszeit || currentView.messzeit;
      updateView('Gesamt', fullMesszeit);
  });
  
  // Stamp-Klick-Handler (Detailansicht)
  stampElements.forEach(stamp => {
    stamp.addEventListener('click', () => {
      const locationID = stamp.dataset.locationId;
      updateView(locationID, currentView.messzeit);
    });
  });

  // Initialisierung
  async function init() {
    await populateTimeDropdown();
    updateView('Gesamt');
  }

  init();
});