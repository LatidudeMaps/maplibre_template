/**
 * Controlli di navigazione per dispositivi mobili
 * Usa i controlli standard di MapLibre disposti orizzontalmente
 */

/**
 * Configura i controlli di navigazione in alto al centro
 * @param {Object} map - Istanza della mappa MapLibre
 */
export function setupNavigationControls(map) {
    const centerSection = document.querySelector('.mobile-controls-top .mobile-controls-center');
    if (!centerSection) return;
    
    // Crea il contenitore dei controlli di navigazione
    const navControls = document.createElement('div');
    navControls.className = 'mobile-nav-controls';
    
    // Crea semplicemente i pulsanti con contenuti chiari
    const zoomInButton = document.createElement('button');
    zoomInButton.className = 'maplibregl-ctrl-zoom-in';
    zoomInButton.type = 'button';
    zoomInButton.setAttribute('aria-label', 'Zoom In');
    
    const compassButton = document.createElement('button');
    compassButton.className = 'maplibregl-ctrl-compass';
    compassButton.type = 'button';
    compassButton.setAttribute('aria-label', 'Reset North');
    
    const zoomOutButton = document.createElement('button');
    zoomOutButton.className = 'maplibregl-ctrl-zoom-out';
    zoomOutButton.type = 'button';
    zoomOutButton.setAttribute('aria-label', 'Zoom Out');
    
    // Trova i pulsanti originali di MapLibre
    const originalZoomIn = document.querySelector('.maplibregl-ctrl-zoom-in');
    const originalCompass = document.querySelector('.maplibregl-ctrl-compass');
    const originalZoomOut = document.querySelector('.maplibregl-ctrl-zoom-out');
    
    // Assegna i comportamenti
    zoomInButton.addEventListener('click', () => {
        if (originalZoomIn) {
            originalZoomIn.click();
        } else {
            map.zoomIn();
        }
    });
    
    compassButton.addEventListener('click', () => {
        if (originalCompass) {
            originalCompass.click();
        } else {
            map.easeTo({
                bearing: 0,
                pitch: 0,
                duration: 500
            });
        }
    });
    
    zoomOutButton.addEventListener('click', () => {
        if (originalZoomOut) {
            originalZoomOut.click();
        } else {
            map.zoomOut();
        }
    });
    
    // Aggiungi i pulsanti al contenitore
    navControls.appendChild(zoomInButton);
    navControls.appendChild(compassButton);
    navControls.appendChild(zoomOutButton);
    
    // Aggiungi i controlli alla sezione centrale
    centerSection.appendChild(navControls);
}
