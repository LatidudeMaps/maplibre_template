/**
 * Controllo scala per dispositivi mobili
 */

/**
 * Configura la scala in basso a sinistra
 * @param {Object} map - Istanza della mappa MapLibre
 */
export function setupScaleControl(map) {
    const bottomLeftSection = document.querySelector('.mobile-controls-bottom .mobile-controls-left');
    if (!bottomLeftSection) return;
    
    // Usa direttamente il controllo scala di maplibre (solo riferimento)
    const scaleContainer = document.createElement('div');
    scaleContainer.className = 'mobile-scale';
    
    // Aggiorna subito il testo della scala
    updateScaleText();
    
    // Aggiungi il contenitore alla sezione
    bottomLeftSection.appendChild(scaleContainer);
    
    // Aggiorna la scala quando la mappa cambia
    map.on('move', updateScaleText);
    
    /**
     * Aggiorna il testo della scala direttamente dall'originale
     */
    function updateScaleText() {
        const originalScale = document.querySelector('.maplibregl-ctrl-scale');
        if (originalScale) {
            // Usa il testo dell'originale
            scaleContainer.textContent = originalScale.textContent;
        } else {
            // Fallback se non trovi l'originale
            scaleContainer.textContent = '100 m';
        }
    }
    
    // Aggiorna subito per avere il valore corretto
    setTimeout(updateScaleText, 500);
}
