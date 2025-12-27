
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
  
  // Globale Variable für alle Zeitstempel (für Filterung)
  let allAvailableTimestamps = [];

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

  // Aktueller Zustand
  let currentView = {
    location: 'Gesamt',
    messzeit: null,
  };
  
  // Variable für den Animations-Loop
  let swanAnimationInterval = null;


  // === 2. Dropdown & Zeit-Logik ===

  // Hilfsfunktion: Füllt das Zeit-Dropdown basierend auf einem gewählten Datum
  function renderTimeOptions(selectedDate) {
    timeMenu.innerHTML = ''; // Menü leeren

    // Filtere Zeitstempel, die mit dem Datum beginnen (Format: YYYY-MM-DD)
    const timesForDate = allAvailableTimestamps.filter(ts => ts.startsWith(selectedDate));

    if (timesForDate.length > 0) {
      timeLabel.textContent = "Zeit wählen";
      
      timesForDate.forEach(fullMesszeit => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dropdown__item';
        
        // Anzeigeformat: "12:00 Uhr"
        const timePart = fullMesszeit.split(' ')[1].substring(0, 5);
        button.textContent = `${timePart} Uhr`;
        button.dataset.fullMesszeit = fullMesszeit;

        button.addEventListener('click', () => {
          timeLabel.textContent = button.textContent;
          timeLabel.dataset.fullMesszeit = button.dataset.fullMesszeit;
          
          currentView.messzeit = button.dataset.fullMesszeit;
          timeDropdown.classList.remove('open');
          
          // Optional: Direkt laden bei Klick
          // updateView('Gesamt', currentView.messzeit);
        });

        li.appendChild(button);
        timeMenu.appendChild(li);
      });
    } else {
      timeLabel.textContent = "-";
      timeMenu.innerHTML = '<li style="text-align:center; padding:10px;">Keine Daten für dieses Datum.</li>';
    }
  }

  // Hauptfunktion: Lädt alle Zeiten einmalig vom Server
  async function populateTimeDropdown() {
    timeMenu.innerHTML = '<li style="text-align:center;">Lade Zeiten...</li>';
    try {
      const response = await fetch('get_times.php');
      allAvailableTimestamps = await response.json();

      if (response.ok && Array.isArray(allAvailableTimestamps) && allAvailableTimestamps.length > 0) {
        
        // Neuesten Eintrag als Standard setzen
        const latestFullTime = allAvailableTimestamps[0];
        const [latestDate, latestTimePart] = latestFullTime.split(' ');
        const latestFormattedTime = latestTimePart.substring(0, 5);

        // GUI initialisieren
        dateInput.value = latestDate;
        renderTimeOptions(latestDate); // Dropdown befüllen für diesen Tag

        // Label setzen
        timeLabel.textContent = `${latestFormattedTime} Uhr`;
        timeLabel.dataset.fullMesszeit = latestFullTime;
        currentView.messzeit = latestFullTime;

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


  // === 3. Daten Laden & Anzeigen ===
  async function fetchAndDisplaySwans(locationID = 'Gesamt', fullMesszeit = currentView.messzeit) {
    if (!fullMesszeit) {
      swanContainer.innerHTML = '';
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
      console.error('Fehler:', error);
      // Fehleranzeige (optional, hier vereinfacht)
    } finally {
        setTimeout(() => { document.body.style.pointerEvents = 'auto'; }, 500); 
    }
  }

  // Animation der Schwäne (Zielpositionen setzen)
  function animateSwans() {
    const activeSwans = swanContainer.querySelectorAll('.swan');
    
    activeSwans.forEach(swan => {
        const newLeft = 10 + Math.random() * 80;
        const newTop = 10 + Math.random() * 70;
        
        const newScale = 0.7 + Math.random() * 0.4;
        const newOpacity = 0.6 + Math.random() * 0.4;

        swan.style.left = `${newLeft}%`;
        swan.style.top = `${newTop}%`;
        swan.style.transform = `scale(${newScale})`; 
        swan.style.opacity = `${newOpacity}`;
    });
  }


  // === 4. Rendering (Erstellen & Bewegen) ===
  function renderSwans(count, locationID) {
    // Alten Loop stoppen
    if (swanAnimationInterval) {
        clearInterval(swanAnimationInterval);
        swanAnimationInterval = null;
    }
    
    const existingSwans = swanContainer.querySelectorAll('.swan');
    const existingCount = existingSwans.length;

    if (locationID === 'Gesamt') {
        // --- GESAMT ANSICHT ---
        
        // 1. Aufräumen (Schwimmen weg)
        existingSwans.forEach((swan, index) => {
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
        
        // 2. Neu erstellen & Animation starten
        setTimeout(() => {
             swanContainer.innerHTML = ''; 
             
             for (let i = 0; i < count; i++) {
                const swan = document.createElement('img');
                swan.src = 'images/swan.png';
                swan.alt = 'Ein Schwan';
                swan.className = 'swan';
                
                // Initiale Position setzen
                swan.style.position = 'absolute'; 
                swan.style.left = `${10 + Math.random() * 80}%`;
                swan.style.top = `${10 + Math.random() * 70}%`;
                swan.style.transform = `scale(${0.7 + Math.random() * 0.4})`;
                swan.style.opacity = `${0.6 + Math.random() * 0.4}`;
                // Lange Transition für das Schwimmen
                swan.style.transition = 'all 24s linear'; 
                
                swanContainer.appendChild(swan);
            }
            updateSwanCountText(count, locationID);
            
            // Sofort starten!
            setTimeout(() => {
                animateSwans(); 
            }, 50);

            // Loop starten
            swanAnimationInterval = setInterval(animateSwans, 18000); 

        }, cleanupDuration); 

    } else {
        // --- DETAIL ANSICHT ---
        const targetElement = document.querySelector(`.stamp[data-location-id="${locationID}"] img`);
        const rect = targetElement ? targetElement.getBoundingClientRect() : null;
        
        if (!rect) return;

        const stampCenterX = rect.left + rect.width / 2;
        const stampCenterY = rect.top + rect.height / 2;
        
        // NEU: Responsive PADDING Berechnung
        // Wenn Fenster < 820px, dann kleinerer Radius (90px), sonst Standard (140px)
        const isMobile = window.innerWidth < 820;
        const PADDING = isMobile ? 90 : 140;    
        
        const RANDOM_RADIUS = 4;

        // Schwäne anpassen (+/-)
        if (count > existingCount) {
            for (let i = existingCount; i < count; i++) {
                const swan = document.createElement('img');
                swan.src = 'images/swan.png';
                swan.className = 'swan';
                swan.style.transition = 'all 4s ease-in-out';
                swan.style.position = 'fixed'; // Wichtig für Detailansicht
                
                // Zufälliger Startpunkt für neue
                swan.style.left = `${10 + Math.random() * 80}%`;
                swan.style.top = `${10 + Math.random() * 70}%`;
                
                swanContainer.appendChild(swan);
            }
        } else if (count < existingCount) {
            for (let i = existingCount - 1; i >= count; i--) {
                setTimeout(() => {
                    if (existingSwans[i]) { 
                        existingSwans[i].style.transition = 'all 1.5s ease-in-out';
                        existingSwans[i].style.opacity = '0';
                        setTimeout(() => existingSwans[i].remove(), 1500); 
                    }
                }, (existingCount - 1 - i) * 50); 
            }
        }

        // Bewegung zum Stamp
        const finalSwans = swanContainer.querySelectorAll('.swan');
        setTimeout(() => {
            finalSwans.forEach(swan => {
                swan.style.transition = 'all 5s ease-in-out';
                
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
  
  // === 5. Event-Handler ===

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
    
    stampElements.forEach(stamp => stamp.classList.remove('is-active'));
    if (locationID !== 'Gesamt') {
        const activeStamp = document.querySelector(`.stamp[data-location-id="${locationID}"]`);
        if (activeStamp) activeStamp.classList.add('is-active');
    }
    
    fetchAndDisplaySwans(currentView.location, currentView.messzeit);
  }
  
  // Dropdown Toggle
  const toggle = timeDropdown.querySelector('.dropdown__toggle');
  toggle.addEventListener('click', () => {
    timeDropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!timeDropdown.contains(e.target)) {
      timeDropdown.classList.remove('open');
    }
  });

  // Datum geändert -> Zeit-Liste updaten
  dateInput.addEventListener('change', (e) => {
      const newDate = e.target.value;
      renderTimeOptions(newDate);
      
      // UX: Erstes Element auswählen, damit man nicht "Zeit wählen" sieht
      const firstButton = timeMenu.querySelector('button');
      if (firstButton) {
          timeLabel.textContent = firstButton.textContent;
          timeLabel.dataset.fullMesszeit = firstButton.dataset.fullMesszeit;
          currentView.messzeit = firstButton.dataset.fullMesszeit;
      }
  });

  // "Auswählen"-Button
  selectButton.addEventListener('click', () => {
      const fullMesszeit = timeLabel.dataset.fullMesszeit || currentView.messzeit;
      updateView('Gesamt', fullMesszeit);
  });
  
  // Stamp Klicks
  stampElements.forEach(stamp => {
    stamp.addEventListener('click', () => {
      const locationID = stamp.dataset.locationId;
      updateView(locationID, currentView.messzeit);
    });
  });
  
  // Optional: Bei Resize (Handy drehen) Ansicht aktualisieren, damit Radien stimmen
  window.addEventListener('resize', () => {
     if(currentView.location !== 'Gesamt') {
         // Kurzer Debounce könnte hier sinnvoll sein, aber direktes Update geht auch
         renderSwans(document.querySelectorAll('.swan').length, currentView.location);
     }
  });

  // Start
  async function init() {
    await populateTimeDropdown();
    updateView('Gesamt');
  }

  init();
});