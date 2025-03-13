/**
 * Utility functions for mobile controls
 */

/**
 * Aggiorna l'orientamento della bussola in base alla rotazione della mappa
 * @param {Object} map - Istanza della mappa MapLibre
 */
export function updateCompassOrientation(map) {
    // Trova il pulsante della bussola nella UI visibile
    const compassBtn = document.querySelector('.mobile-controls-center .maplibregl-ctrl-compass');
    
    if (compassBtn) {
        // Ottieni l'angolo di rotazione della mappa
        const bearing = map.getBearing();
        
        // Seleziona l'icona all'interno del pulsante della bussola
        const compassIcon = compassBtn.querySelector('.maplibregl-ctrl-icon');
        
        if (compassIcon) {
            // Ruota l'icona in base alla rotazione della mappa
            compassIcon.style.transform = `rotate(${-bearing}deg)`;
        }
    }
}

/**
 * Rimuove i controlli precedenti per evitare duplicazioni
 */
export function clearPreviousControls() {
    // Rimuove contenitore precedente se esiste
    const existingContainer = document.querySelector('.mobile-top-controls-container');
    if (existingContainer) {
        existingContainer.remove();
    }
}

/**
 * Nasconde il pannello di attribuzione all'avvio dell'applicazione
 */
export function hideAttributionByDefault() {
    // Assicuriamoci che il DOM sia completamente caricato
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const mapInfoControl = document.querySelector('.maplibregl-ctrl-zoom-info');
            const mapInfoPanel = document.querySelector('.map-info-panel');
            
            if (mapInfoPanel && mapInfoPanel.style.display !== 'none') {
                mapInfoPanel.style.display = 'none';
                if (mapInfoControl) {
                    mapInfoControl.classList.remove('active');
                }
            }
        }, 300);
    });
    
    // Se il DOM è già caricato, esegui subito
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            const mapInfoControl = document.querySelector('.maplibregl-ctrl-zoom-info');
            const mapInfoPanel = document.querySelector('.map-info-panel');
            
            if (mapInfoPanel && mapInfoPanel.style.display !== 'none') {
                mapInfoPanel.style.display = 'none';
                if (mapInfoControl) {
                    mapInfoControl.classList.remove('active');
                }
            }
        }, 300);
    }
}
