/**
 * Controllo del logo per dispositivi mobili
 */

/**
 * Configura il logo cliccabile in alto a sinistra
 */
export function setupLogo() {
    const leftSection = document.querySelector('.mobile-controls-top .mobile-controls-left');
    if (!leftSection) return;
    
    // Crea il contenitore del logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'mobile-logo';
    
    // Carica il logo SVG
    fetch('https://raw.githubusercontent.com/latidudemaps/GeologiaVDA/main/data/logo_color.svg')
        .then(response => response.text())
        .then(svgText => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');
            
            if (svgElement) {
                // Imposta le dimensioni e lo stile dell'SVG
                svgElement.setAttribute('width', '28');
                svgElement.setAttribute('height', '28');
                logoContainer.appendChild(svgElement);
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento del logo:', error);
            // Fallback in caso di errore
            logoContainer.textContent = '🗺️';
        });
    
    // Aggiungi evento click per aprire il linktree
    logoContainer.addEventListener('click', () => {
        window.open('https://linktr.ee/latidudemaps', '_blank');
    });
    
    // Aggiungi il logo alla sezione sinistra
    leftSection.appendChild(logoContainer);
}
