/**
 * Modulo per l'ottimizzazione dell'interfaccia su dispositivi mobili
 * Implementa modifiche specifiche secondo il mockup fornito
 */
import { setupMobileControls } from './ControlsOptimizer';
import { setupGestures } from './GestureHandler';
import { setupMediaQueries } from './MediaQueryHandler';
import './mobile-styles.css';

/**
 * Rileva se il dispositivo è mobile in base a dimensioni schermo e capacità touch
 * @returns {boolean} True se il dispositivo è probabilmente mobile
 */
export function isMobileDevice() {
    return (
        (window.innerWidth <= 768) ||
        (('ontouchstart' in window) && window.innerWidth <= 1024) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024)
    );
}

/**
 * Applica tutte le ottimizzazioni mobile all'applicazione
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
export function applyMobileOptimizations(map, options = {}) {
    // Se non è un dispositivo mobile, non fare nulla
    if (!isMobileDevice() && !options.forceOptimizations) {
        console.log('Non è un dispositivo mobile, ottimizzazioni non applicate');
        return;
    }

    // Applica classe CSS al body per gli stili mobile
    document.body.classList.add('mobile-device');
    
    // Nascondi esplicitamente il selettore di basemap desktop
    const desktopBasemapSelector = document.querySelector('.basemap-buttons-control');
    if (desktopBasemapSelector) {
        desktopBasemapSelector.style.display = 'none';
    }
    
    // Configura l'interfaccia mobile secondo il mockup
    setupMobileControls(map, options);
    
    // Configura i gesture handler per interazioni touch migliorate
    setupGestures(map, options);
    
    // Configura i media queries per adattamenti reattivi
    setupMediaQueries(map, options);
    
    // Disabilitiamo lo scrolling della pagina quando si interagisce con la mappa
    preventMapScrollConflicts();

    console.log('Ottimizzazioni mobile applicate');
}

/**
 * Impedisce conflitti tra scrolling della pagina e interazioni con la mappa
 */
function preventMapScrollConflicts() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    // Su dispositivi touch, previeni lo scrolling della pagina quando si fa drag sulla mappa
    let touchStartY = 0;
    
    mapContainer.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    mapContainer.addEventListener('touchmove', (e) => {
        // Blocca lo scroll della pagina solo se c'è un movimento significativo sulla mappa
        // e non ci sono due dita (per permettere zoom pinch)
        if (e.touches.length !== 2) {
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - touchStartY;
            
            // Se il movimento è significativo, impedisci lo scroll della pagina
            if (Math.abs(deltaY) > 10) {
                e.preventDefault();
            }
        }
    }, { passive: false });
}