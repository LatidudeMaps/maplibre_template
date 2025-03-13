/**
 * Controllo wrapper in alto a destra e menu delle impostazioni
 * Versione aggiornata che utilizza le icone originali di MapLibre
 */

/**
 * Configura il tasto wrapper in alto a destra
 */
export function setupWrapperButton() {
    const rightSection = document.querySelector('.mobile-controls-top .mobile-controls-right');
    if (!rightSection) return;
    
    // Crea il contenitore del wrapper button
    const wrapperButton = document.createElement('div');
    wrapperButton.className = 'mobile-wrapper-button';
    wrapperButton.setAttribute('aria-label', 'Settings');
    
    // Trova il pulsante originale per usare la stessa icona
    const originalButton = document.querySelector('.maplibregl-ctrl-settings');
    if (originalButton) {
        // Clona l'interno del pulsante originale
        wrapperButton.innerHTML = originalButton.innerHTML;
    } else {
        // Fallback: icona ingranaggio
        wrapperButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    }
    
    // Aggiungi evento click per aprire/chiudere la tendina
    wrapperButton.addEventListener('click', toggleSettingsMenu);
    
    // Aggiungi il wrapper alla sezione destra
    rightSection.appendChild(wrapperButton);
}

/**
 * Configura i controlli nella tendina dei settings
 * @param {Object} map - Istanza della mappa MapLibre
 */
export function setupSettingsMenu(map) {
    const settingsContainer = document.querySelector('.mobile-settings-container');
    if (!settingsContainer) return;
    
    // Svuota il contenitore prima di riempirlo
    settingsContainer.innerHTML = '';
    
    // Ottieni i pulsanti reali dalle tendina originale
    const settingsControlsContainer = document.querySelector('.settings-controls-container');
    
    // Definisci gli identificatori dei controlli che vogliamo supportare
    const controlSelectors = [
        {id: 'theme', selector: '.maplibregl-ctrl-theme-toggle', fallbackIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'},
        {id: 'globe', selector: '.maplibregl-ctrl-globe', fallbackIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'},
        {id: 'import', selector: '.vector-layer-control', fallbackIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" fill="currentColor"/></svg>'},
        {id: 'geolocate', selector: '.maplibregl-ctrl-geolocate', fallbackIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>'},
        {id: 'info', selector: '.maplibregl-ctrl-zoom-info', fallbackIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'},
        {id: 'terrain', selector: '.maplibregl-ctrl-terrain', fallbackIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>'}
    ];
    
    controlSelectors.forEach(control => {
        // Cerca il pulsante originale nel DOM
        const originalButton = document.querySelector(control.selector);
        
        // Crea il nuovo pulsante per la tendina
        const newButton = document.createElement('button');
        newButton.setAttribute('data-control-id', control.id);
        
        // Se esiste il pulsante originale, ne copiamo l'HTML
        if (originalButton) {
            newButton.innerHTML = originalButton.innerHTML;
            newButton.setAttribute('aria-label', originalButton.getAttribute('aria-label') || '');
            newButton.title = originalButton.title || '';
        } else {
            // Altrimenti, utilizziamo l'icona di fallback
            newButton.innerHTML = control.fallbackIcon;
            newButton.setAttribute('aria-label', control.id);
            newButton.title = control.id;
        }
        
        // Aggiungi evento click
        newButton.addEventListener('click', () => {
            toggleSettingsMenu(false); // Chiudi la tendina
            
            setTimeout(() => {
                // Trova e clicca il pulsante originale
                if (originalButton) {
                    originalButton.click();
                } else {
                    // Per alcune funzionalità speciali potremmo avere un comportamento alternativo
                    handleFallbackAction(control.id, map);
                }
            }, 50);
        });
        
        // Aggiungi il pulsante alla tendina
        settingsContainer.appendChild(newButton);
    });
}

/**
 * Gestisce azioni di fallback per i pulsanti che non hanno un corrispondente nel DOM
 * @param {string} controlId - ID del controllo
 * @param {Object} map - Istanza della mappa
 */
function handleFallbackAction(controlId, map) {
    switch (controlId) {
        case 'geolocate':
            // Implementare geolocalizzazione diretta
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        map.flyTo({
                            center: [position.coords.longitude, position.coords.latitude],
                            zoom: 14
                        });
                    },
                    (error) => {
                        console.error('Errore nella geolocalizzazione:', error);
                        alert('Impossibile ottenere la tua posizione.');
                    }
                );
            }
            break;
        case 'import':
            // Trigger vector layer dialog manualmente
            const vectorButton = document.querySelector('.vector-layer-control');
            if (vectorButton) {
                // Prova a trovare il dropdown
                const dropdown = document.querySelector('.vector-layer-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'block';
                    // Simula il click sul primo elemento
                    setTimeout(() => {
                        const firstOption = dropdown.querySelector('.vector-layer-option');
                        if (firstOption) firstOption.click();
                        else dropdown.style.display = 'none';
                    }, 50);
                } else {
                    vectorButton.click();
                }
            }
            break;
        // Altre azioni di fallback possono essere aggiunte qui
    }
}

/**
 * Alterna la visibilità del menu settings
 * @param {boolean|Event} forceState - Forza uno stato specifico (true=visibile, false=nascosto) o evento
 */
export function toggleSettingsMenu(forceState) {
    const settingsContainer = document.querySelector('.mobile-settings-container');
    if (!settingsContainer) return;
    
    // Se è un evento, non abbiamo uno stato forzato
    const isEvent = forceState instanceof Event;
    
    if (isEvent) {
        // Toggle della classe 'visible'
        settingsContainer.classList.toggle('visible');
    } else if (forceState === true) {
        // Forza visibile
        settingsContainer.classList.add('visible');
    } else if (forceState === false) {
        // Forza nascosto
        settingsContainer.classList.remove('visible');
    }
}
