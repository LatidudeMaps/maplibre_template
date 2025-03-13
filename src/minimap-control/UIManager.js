/**
 * Crea gli elementi dell'interfaccia utente per la minimappa.
 * @param {number} width - Larghezza della minimappa
 * @param {number} height - Altezza della minimappa
 * @returns {Object} Oggetto contenente gli elementi UI creati
 */
export function createUIElements(width, height) {
    // Crea il wrapper per la minimappa
    const minimapWrapper = document.createElement('div');
    minimapWrapper.style.width = width + 'px';
    minimapWrapper.style.height = height + 'px';
    minimapWrapper.style.position = 'relative';
    minimapWrapper.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    minimapWrapper.style.transformOrigin = 'top left';
    minimapWrapper.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    minimapWrapper.style.borderRadius = '8px';
    minimapWrapper.style.overflow = 'hidden';
    minimapWrapper.style.backdropFilter = 'blur(8px)';
    minimapWrapper.style.WebkitBackdropFilter = 'blur(8px)';
    minimapWrapper.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
    
    // Crea il pulsante di toggle
    const toggleButton = document.createElement('button');
    toggleButton.className = 'minimap-toggle-btn';
    toggleButton.style.width = '26px';
    toggleButton.style.height = '26px';
    toggleButton.style.display = 'flex';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.justifyContent = 'center';
    
    // Definisci le icone di minimizza e massimizza
    const minimizeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            style="min-width: 8px; min-height: 8px; max-width: 18px; max-height: 18px;">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
    `;

    const maximizeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            style="min-width: 8px; min-height: 8px; max-width: 18px; max-height: 18px;">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
    `;
    
    toggleButton.innerHTML = minimizeIcon;
    
    return {
        minimapWrapper,
        toggleButton,
        minimizeIcon,
        maximizeIcon
    };
}

/**
 * Attiva/disattiva la visibilità della minimappa.
 * @param {boolean} isVisible - Stato corrente di visibilità
 * @param {HTMLElement} wrapper - Wrapper della minimappa
 * @param {HTMLElement} button - Pulsante di toggle
 * @param {string} minimizeIcon - HTML dell'icona di minimizzazione
 * @param {string} maximizeIcon - HTML dell'icona di massimizzazione
 * @returns {boolean} Nuovo stato di visibilità
 */
export function toggleMinimap(isVisible, wrapper, button, minimizeIcon, maximizeIcon) {
    if (isVisible) {
        wrapper.style.transform = 'scale(0)';
        wrapper.style.opacity = '0';
        button.innerHTML = maximizeIcon;
        return false;
    } else {
        wrapper.style.transform = 'scale(1)';
        wrapper.style.opacity = '1';
        button.innerHTML = minimizeIcon;
        return true;
    }
}

/**
 * Aggiorna lo stile del pulsante in base al tema.
 * @param {HTMLElement} button - Pulsante di toggle
 * @param {boolean} isDarkTheme - Indica se il tema è scuro
 */
export function updateTheme(button, isDarkTheme) {
    // Imposta il colore di sfondo corretto
    button.style.backgroundColor = isDarkTheme ? '#333' : 'white';
    
    // Imposta il colore del testo (per l'SVG)
    button.style.color = isDarkTheme ? '#fff' : '#333';
    
    // Imposta l'ombra appropriata
    button.style.boxShadow = isDarkTheme ? 
        '0 1px 4px rgba(0,0,0,0.5)' : 
        '0 1px 4px rgba(0,0,0,0.3)';
}