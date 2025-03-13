/**
 * Crea il container per i controlli
 * @returns {HTMLElement} Container dei controlli
 */
export function createControlsContainer() {
    const container = document.createElement('div');
    container.className = 'settings-controls-container';
    container.style.position = 'absolute';
    container.style.right = '0';
    container.style.top = '100%';
    container.style.marginTop = '5px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.zIndex = '1';
    container.style.visibility = 'hidden';
    container.style.opacity = '0';
    container.style.transform = 'translateY(-5px)';
    container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    return container;
}

/**
 * Configura gli eventi dell'interfaccia utente
 * @param {Object} controlInstance - Istanza del controllo delle impostazioni
 */
export function setupUIEvents(controlInstance) {
    // Aggiunge l'event listener per il click sul pulsante principale
    controlInstance._button.addEventListener('click', (e) => {
        e.stopPropagation();
        controlInstance._toggleControls();
    });
    
    // Aggiunge l'event listener per chiudere il pannello quando si clicca fuori
    document.addEventListener('click', (e) => {
        if (!controlInstance._container.contains(e.target) && 
            !e.target.closest('.maplibregl-canvas-container') && 
            controlInstance._isExpanded) {
            controlInstance._hideControls();
        }
    });
}