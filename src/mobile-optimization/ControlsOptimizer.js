/**
 * Modulo principale per ottimizzare i controlli della mappa su dispositivi mobili
 */

import { setupLogo } from './controls/LogoControl';
import { setupNavigationControls } from './controls/NavigationControls';
import { setupWrapperButton, setupSettingsMenu } from './controls/WrapperControl';
import { setupScaleControl } from './controls/ScaleControl';
import { setupBasemapSelector } from './controls/BasemapSelector';
import { setupAttributionButton } from './controls/AttributionControl';

/**
 * Configura i controlli per una migliore usabilità su mobile
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
export function setupMobileControls(map, options = {}) {
    // Rimuovi eventuali stili o strutture precedenti
    cleanupPreviousUI();
    
    // Crea la struttura UI principale
    createMainUI();
    
    // Posiziona e configura tutti i controlli
    setupAllControls(map, options);
    
    // Aggiungi eventi e interazioni
    setupEventListeners(map);
    
    // Nascondi i controlli originali (ma mantienili funzionali)
    hideOriginalControls();
    
    // Aggiungi un evento di resize per aggiornare l'interfaccia quando cambia l'orientamento
    window.addEventListener('resize', () => {
        // Piccolo ritardo per assicurarsi che le dimensioni siano aggiornate
        setTimeout(() => {
            cleanupPreviousUI();
            createMainUI();
            setupAllControls(map, options);
            setupEventListeners(map);
        }, 300);
    });
}

/**
 * Rimuove eventuali elementi UI mobile precedenti
 */
function cleanupPreviousUI() {
    // Rimuovi i contenitori dei controlli
    document.querySelectorAll('.mobile-controls-top, .mobile-controls-bottom, .mobile-settings-container, .mobile-attribution-popup').forEach(el => {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

/**
 * Crea la struttura UI principale per i controlli mobile
 */
function createMainUI() {
    // Crea il contenitore per i controlli superiori
    const topControls = document.createElement('div');
    topControls.className = 'mobile-controls-top';
    document.body.appendChild(topControls);
    
    // Crea sezione sinistra (logo)
    const leftSection = document.createElement('div');
    leftSection.className = 'mobile-controls-left';
    topControls.appendChild(leftSection);
    
    // Crea sezione centrale (controlli navigazione)
    const centerSection = document.createElement('div');
    centerSection.className = 'mobile-controls-center';
    topControls.appendChild(centerSection);
    
    // Crea sezione destra (wrapper)
    const rightSection = document.createElement('div');
    rightSection.className = 'mobile-controls-right';
    topControls.appendChild(rightSection);
    
    // Crea il contenitore per i controlli inferiori
    const bottomControls = document.createElement('div');
    bottomControls.className = 'mobile-controls-bottom';
    document.body.appendChild(bottomControls);
    
    // Crea sezione sinistra inferiore (scale)
    const bottomLeftSection = document.createElement('div');
    bottomLeftSection.className = 'mobile-controls-left';
    bottomControls.appendChild(bottomLeftSection);
    
    // Crea sezione centrale inferiore (basemap selector)
    const bottomCenterSection = document.createElement('div');
    bottomCenterSection.className = 'mobile-controls-center';
    bottomControls.appendChild(bottomCenterSection);
    
    // Crea sezione destra inferiore (attribution)
    const bottomRightSection = document.createElement('div');
    bottomRightSection.className = 'mobile-controls-right';
    bottomControls.appendChild(bottomRightSection);
    
    // Crea il contenitore per la tendina dei controlli aggiuntivi
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'mobile-settings-container';
    document.body.appendChild(settingsContainer);
    
    // Crea il popup per le attribuzioni
    const attributionPopup = document.createElement('div');
    attributionPopup.className = 'mobile-attribution-popup';
    document.body.appendChild(attributionPopup);
}

/**
 * Configura tutti i controlli mobili
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
function setupAllControls(map, options) {
    // Configura il logo in alto a sinistra
    setupLogo();
    
    // Configura i controlli di navigazione in alto al centro
    setupNavigationControls(map);
    
    // Configura il tasto wrapper in alto a destra
    setupWrapperButton();
    
    // Configura i controlli della tendina (menu settings)
    setupSettingsMenu(map);
    
    // Configura la scala in basso a sinistra
    setupScaleControl(map);
    
    // Configura il selettore di basemap in basso al centro
    setupBasemapSelector(map);
    
    // Configura il tasto attribution in basso a destra
    setupAttributionButton(map);
}

/**
 * Imposta tutti gli event listener necessari
 * @param {Object} map - Istanza della mappa MapLibre
 */
function setupEventListeners(map) {
    // Chiudi la tendina settings quando si clicca fuori
    document.addEventListener('click', (e) => {
        const settingsContainer = document.querySelector('.mobile-settings-container');
        const wrapperButton = document.querySelector('.mobile-wrapper-button');
        
        if (settingsContainer && settingsContainer.classList.contains('visible') && 
            !settingsContainer.contains(e.target) && 
            !wrapperButton.contains(e.target)) {
            settingsContainer.classList.remove('visible');
        }
    });
    
    // Chiudi il popup di attribuzione quando si clicca fuori
    document.addEventListener('click', (e) => {
        const popup = document.querySelector('.mobile-attribution-popup');
        const attributionButton = document.querySelector('.mobile-attribution-button');
        
        if (popup && popup.classList.contains('visible') && 
            !popup.contains(e.target) && 
            !attributionButton.contains(e.target)) {
            popup.classList.remove('visible');
        }
    });
}

/**
 * Nascondi i controlli originali ma mantienili funzionali
 */
function hideOriginalControls() {
    // Nascondi i controlli originali
    const controlContainers = document.querySelectorAll('.maplibregl-control-container');
    controlContainers.forEach(container => {
        container.style.opacity = '0.01';
        container.style.pointerEvents = 'none';
    });
    
    // Mantieni attivi per poterli cliccare programmaticamente
    const controls = document.querySelectorAll('.maplibregl-ctrl');
    controls.forEach(control => {
        control.style.pointerEvents = 'auto';
    });
}
