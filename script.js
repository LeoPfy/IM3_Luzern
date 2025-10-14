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
    heroSection.appendChild(swanContainer);
  }

  // Aktueller Zustand: Speichert, ob Gesamt- oder Detailansicht
  let currentView = {
    location: 'Gesamt',
    messzeit: null,
  };


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
      swanContainer.innerHTML = 'Lade Daten...';

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
      swanContainer.innerHTML = `<p style="color:red; text-align:center;">Fehler beim Laden der Schwan-Daten: ${error.message}</p>`;
    } finally {
        document.body.style.pointerEvents = 'auto';
    }
  }


  // === 4. Schwäne auf der Seite erstellen und bewegen ===
  function renderSwans(count, locationID) {
    const existingSwans = swanContainer.querySelectorAll('.swan');
    const existingCount = existingSwans.length;

    if (locationID === 'Gesamt') {
        // Bei Gesamtansicht, lösche alte und erstelle neue Schwäne an zufälliger Position
        swanContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const swan = document.createElement('img');
            swan.src = 'images/swan.png';
            swan.alt = 'Ein Schwan';
            swan.className = 'swan';
            swan.style.left = `${10 + Math.random() * 80}%`;
            swan.style.top = `${10 + Math.random() * 70}%`;
            swan.style.transform = `scale(${0.7 + Math.random() * 0.4})`;
            swan.style.opacity = `${0.6 + Math.random() * 0.4}`;
            swan.style.transition = 'all 1.5s ease-in-out';
            swanContainer.appendChild(swan);
        }
    } else {
        // Bei Detailansicht, bewege die Schwäne
        const targetElement = document.querySelector(`.stamp[data-location-id="${locationID}"] img`);
        const rect = targetElement ? targetElement.getBoundingClientRect() : null;
        
        const targetX = rect ? `${rect.left + rect.width / 2}px` : '50%';
        const targetY = rect ? `${rect.top + rect.height / 2}px` : '50%';

        // Schwäne hinzufügen/entfernen
        if (count > existingCount) {
            for (let i = existingCount; i < count; i++) {
                const swan = document.createElement('img');
                swan.src = 'images/swan.png';
                swan.alt = 'Ein Schwan';
                swan.className = 'swan';
                swan.style.left = `${10 + Math.random() * 80}%`;
                swan.style.top = `${10 + Math.random() * 70}%`;
                swan.style.transform = `scale(${0.7 + Math.random() * 0.4})`;
                swan.style.opacity = `${0.6 + Math.random() * 0.4}`;
                swan.style.transition = 'all 1.5s ease-in-out';
                swanContainer.appendChild(swan);
            }
        } else if (count < existingCount) {
            for (let i = existingCount - 1; i >= count; i--) {
                existingSwans[i].remove();
            }
        }

        // Alle finalen Schwäne zum Ziel bewegen
        const finalSwans = swanContainer.querySelectorAll('.swan');
        setTimeout(() => {
            finalSwans.forEach(swan => {
                swan.style.position = 'fixed';
                swan.style.left = targetX;
                swan.style.top = targetY;
                swan.style.transform = `scale(${0.4 + Math.random() * 0.2})`;
                swan.style.opacity = `${0.8 + Math.random() * 0.2}`;
            });
        }, 100);
    }
    
    updateSwanCountText(count, locationID);
  }
  
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
    
    const locationText = (locationID === 'Gesamt') ? 'allen Locations' : locationID;
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
  
  const toggle = timeDropdown.querySelector('.dropdown__toggle');
  toggle.addEventListener('click', () => {
    timeDropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!timeDropdown.contains(e.target)) {
      timeDropdown.classList.remove('open');
    }
  });

  selectButton.addEventListener('click', () => {
      updateView('Gesamt', timeLabel.dataset.fullMesszeit);
  });
  
  stampElements.forEach(stamp => {
    stamp.addEventListener('click', () => {
      const locationID = stamp.dataset.locationId;
      updateView(locationID, currentView.messzeit);
    });
  });

  async function init() {
    await populateTimeDropdown();
    updateView('Gesamt');
  }

  init();
});