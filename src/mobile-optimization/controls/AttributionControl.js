/**
 * Controllo attribuzione per dispositivi mobili
 */

/**
 * Configura il tasto attribution in basso a destra
 * @param {Object} map - Istanza della mappa MapLibre
 */
export function setupAttributionButton(map) {
    const bottomRightSection = document.querySelector('.mobile-controls-bottom .mobile-controls-right');
    if (!bottomRightSection) return;
    
    // Crea il pulsante di attribution
    const attributionButton = document.createElement('div');
    attributionButton.className = 'mobile-attribution-button';
    attributionButton.textContent = 'i';
    attributionButton.setAttribute('aria-label', 'Show attribution');
    
    // Aggiungi evento click per mostrare/nascondere il popup
    attributionButton.addEventListener('click', () => {
        const popup = document.querySelector('.mobile-attribution-popup');
        if (popup) {
            popup.classList.toggle('visible');
            
            // Se diventa visibile, popola il contenuto
            if (popup.classList.contains('visible')) {
                populateAttributionPopup(popup, map);
            }
        }
    });
    
    bottomRightSection.appendChild(attributionButton);
}

/**
 * Popola il popup di attribuzione con i dati corretti
 * @param {HTMLElement} popup - Elemento popup
 * @param {Object} map - Istanza della mappa
 */
function populateAttributionPopup(popup, map) {
    // Pulisci il contenuto esistente
    popup.innerHTML = '';
    
    // Ottieni i dati di attribuzione - metodo corretto, non usare map.getAttributions()
    // Invece, prendiamo le attribuzioni direttamente dagli elementi del DOM
    const attributions = [];
    const attribContainer = document.querySelector('.maplibregl-ctrl-attrib');
    
    if (attribContainer) {
        const links = attribContainer.querySelectorAll('a');
        links.forEach(link => {
            attributions.push(link.outerHTML);
        });
    }
    
    // Aggiungi le attribuzioni al popup
    if (attributions && attributions.length > 0) {
        const attribsElement = document.createElement('p');
        attribsElement.innerHTML = attributions.join(' | ');
        popup.appendChild(attribsElement);
    } else {
        // Attribuzioni default
        const defaultAttribution = document.createElement('p');
        defaultAttribution.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors<br>© <a href="https://www.maplibre.org/" target="_blank">MapLibre</a>';
        popup.appendChild(defaultAttribution);
    }
    
    // Aggiungi info sul creatore dell'app
    const appInfo = document.createElement('p');
    appInfo.innerHTML = 'App by <a href="https://linktr.ee/latidudemaps" target="_blank">LatidudeMaps</a><br>© ' + new Date().getFullYear();
    popup.appendChild(appInfo);
    
    // Aggiungi un pulsante per chiudere
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.width = '100%';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px';
    closeButton.style.background = 'var(--mobile-primary-color)';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.addEventListener('click', () => {
        popup.classList.remove('visible');
    });
    popup.appendChild(closeButton);
}
