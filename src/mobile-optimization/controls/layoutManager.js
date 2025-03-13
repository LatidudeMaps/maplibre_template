/**
 * Layout Manager per i controlli su dispositivi mobili
 */

/**
 * Applica stili ottimizzati ai contenitori dei controlli
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
export function applyControlStyles(map, options) {
    // Aggiungi classe CSS per identificare il layout mobile orizzontale
    document.body.classList.add('mobile-horizontal-controls');
    
    // Imposta il container principale
    const topControlsContainer = document.createElement('div');
    topControlsContainer.className = 'mobile-top-controls-container';
    topControlsContainer.style.position = 'fixed';
    topControlsContainer.style.top = `${options.controlsTopPadding}px`;
    topControlsContainer.style.left = '0';
    topControlsContainer.style.right = '0';
    topControlsContainer.style.display = 'flex';
    topControlsContainer.style.justifyContent = 'center';  // Centra i controlli orizzontalmente
    topControlsContainer.style.alignItems = 'center';
    topControlsContainer.style.gap = '8px';  // Ridotto a 8px
    topControlsContainer.style.padding = `0 ${options.controlsSidePadding}px`;
    topControlsContainer.style.pointerEvents = 'none'; // Non interferisce con la mappa
    topControlsContainer.style.zIndex = '100';
    
    document.body.appendChild(topControlsContainer);
    
    // Trova i controlli originali
    const navigationControls = document.querySelector('.maplibregl-ctrl-group');
    const settingsControl = document.querySelector('.maplibregl-ctrl-settings')?.closest('.maplibregl-ctrl-group');
    const originalLogoContainer = document.querySelector('.copyright-control');
    
    // 1. Sezione sinistra per il logo (mantenendo quello originale)
    const leftSection = createLogoSection(originalLogoContainer, options);
    topControlsContainer.appendChild(leftSection);
    
    // 2. Sezione centrale per i controlli di navigazione
    const centerSection = createNavigationSection(map, navigationControls, options);
    topControlsContainer.appendChild(centerSection);
    
    // 3. Sezione destra per il wrapper
    const rightSection = createWrapperSection(map, settingsControl, options);
    topControlsContainer.appendChild(rightSection);
    
    // Ottimizza il selettore di basemap in basso allineandolo con gli altri elementi in basso
    optimizeBasemapSelector(options);
    
    // Rimuovi la minimappa se opzione impostata su false
    if (!options.showMinimap) {
        const minimapContainer = document.querySelector('.minimap-container')?.closest('.maplibregl-ctrl');
        if (minimapContainer) {
            minimapContainer.style.display = 'none';
        }
    }
}

/**
 * Riorganizza i controlli per una migliore usabilità su mobile
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
export function reorganizeControls(map, options) {
    // Aggiungi comportamenti di interazione touch ai controlli
    addTouchBehaviors();
    
    // Riposiziona i controlli della mappa specifici per mobile
    repositionMapControls(options);
}

/**
 * Ottimizza pannelli e dialoghi per uso su mobile
 * @param {Object} options - Opzioni di configurazione
 */
export function optimizePanelsAndDialogs(options) {
    // Implementazione specifica per pannelli
    setupPanelDragging();
    
    // Migliora le interazioni con i dialoghi
    enhanceDialogInteractions();
}

/**
 * Crea la sezione per il logo
 * @param {HTMLElement} originalLogo - Elemento originale del logo
 * @param {Object} options - Opzioni di configurazione
 * @returns {HTMLElement} - Sezione del logo
 */
function createLogoSection(originalLogo, options) {
    const leftSection = document.createElement('div');
    leftSection.className = 'mobile-controls-left';
    leftSection.style.pointerEvents = 'auto';
    
    // Se esiste il logo originale, creiamo una copia dello stesso design del copyright
    if (originalLogo) {
        // Crea un nuovo logo
        const logoContainer = document.createElement('div');
        logoContainer.className = 'mobile-logo-container copyright-control';
        
        // Creiamo il pulsante del logo nello stesso modo del CopyrightControl
        const logoButton = document.createElement('button');
        logoButton.className = 'maplibregl-ctrl-logo-button';
        logoButton.setAttribute('aria-label', 'LatidudeMaps Logo');
        
        // Stile CSS inline per il pulsante del logo
        logoButton.style.border = 'none';
        logoButton.style.background = 'none';
        logoButton.style.cursor = 'pointer';
        logoButton.style.padding = '0';
        logoButton.style.margin = '0';
        logoButton.style.display = 'flex';
        logoButton.style.alignItems = 'center';
        logoButton.style.justifyContent = 'center';
        
        // Crea il logo SVG
        const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        logoSvg.setAttribute('viewBox', '0 0 100 100');
        logoSvg.setAttribute('width', '30');
        logoSvg.setAttribute('height', '30');
        logoSvg.style.borderRadius = '50%';
        logoSvg.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        
        // Il contenuto SVG - onde stilizzate
        logoSvg.innerHTML = `
            <path d="M10,50 C20,40 30,60 40,50 C50,40 60,60 70,50 C80,40 90,60 100,50" 
                  stroke="#333" 
                  stroke-width="6" 
                  fill="none" 
                  stroke-linecap="round"/>
            <path d="M10,70 C20,60 30,80 40,70 C50,60 60,80 70,70 C80,60 90,80 100,70" 
                  stroke="#333" 
                  stroke-width="6" 
                  fill="none" 
                  stroke-linecap="round"/>
        `;
        
        logoButton.appendChild(logoSvg);
        
        // Aggiungi evento click per aprire il link a Linktree
        logoButton.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(options.linktreeUrl, '_blank');
        });
        
        logoContainer.appendChild(logoButton);
        leftSection.appendChild(logoContainer);
    }
    
    return leftSection;
}

/**
 * Crea la sezione per i controlli di navigazione
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {HTMLElement} originalControls - Controlli di navigazione originali
 * @param {Object} options - Opzioni di configurazione
 * @returns {HTMLElement} - Sezione dei controlli di navigazione
 */
function createNavigationSection(map, originalControls, options) {
    const centerSection = document.createElement('div');
    centerSection.className = 'mobile-controls-center';
    centerSection.style.pointerEvents = 'auto';
    
    if (originalControls) {
        // Clona i controlli di navigazione originali
        const navControls = originalControls.cloneNode(true);
        
        // Aggiorna tutti gli event listeners nei controlli clonati
        const zoomIn = navControls.querySelector('.maplibregl-ctrl-zoom-in');
        const zoomOut = navControls.querySelector('.maplibregl-ctrl-zoom-out');
        const compass = navControls.querySelector('.maplibregl-ctrl-compass');
        
        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                map.zoomIn();
            });
        }
        
        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                map.zoomOut();
            });
        }
        
        if (compass) {
            compass.addEventListener('click', () => {
                map.resetNorthPitch();
            });
        }
        
        centerSection.appendChild(navControls);
    }
    
    return centerSection;
}

/**
 * Crea la sezione per il wrapper dei controlli
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {HTMLElement} originalSettings - Controllo settings originale
 * @param {Object} options - Opzioni di configurazione
 * @returns {HTMLElement} - Sezione del wrapper
 */
function createWrapperSection(map, originalSettings, options) {
    const rightSection = document.createElement('div');
    rightSection.className = 'mobile-controls-right';
    rightSection.style.pointerEvents = 'auto';
    
    if (originalSettings) {
        // Clone the settings control
        const wrapperControl = document.createElement('div');
        wrapperControl.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        // Create a button for the wrapper
        const wrapperBtn = document.createElement('button');
        wrapperBtn.type = 'button';
        wrapperBtn.className = 'maplibregl-ctrl-settings maplibregl-ctrl-icon';
        wrapperBtn.title = 'Additional Controls';
        
        // Assicuriamo che il tasto wrapper risponda al tap
        wrapperBtn.addEventListener('click', () => {
            const settingsContainer = document.querySelector('.settings-controls-container');
            if (settingsContainer) {
                if (settingsContainer.style.display === 'none') {
                    settingsContainer.style.display = 'flex';
                    wrapperBtn.classList.add('active');
                } else {
                    settingsContainer.style.display = 'none';
                    wrapperBtn.classList.remove('active');
                }
            }
        });
        
        wrapperControl.appendChild(wrapperBtn);
        rightSection.appendChild(wrapperControl);
    }
    
    return rightSection;
}

/**
 * Ottimizza il selettore di basemap
 * @param {Object} options - Opzioni di configurazione
 */
function optimizeBasemapSelector(options) {
    // Cambia le etichette del selettore di basemap
    setTimeout(() => {
        const basemapButtons = document.querySelectorAll('.basemap-button');
        
        basemapButtons.forEach(button => {
            if (button.textContent.trim() === 'Satellite') {
                button.textContent = 'Sat';
            } else if (button.textContent.trim() === 'OpenStreetMap') {
                button.textContent = 'OSM';
            } else if (button.textContent.trim() === 'Topographic') {
                button.textContent = 'Topo';
            }
        });
        
        // Allinea il selettore di basemap con la scala e il tasto attribution
        const basemapControl = document.querySelector('.basemap-buttons-control');
        if (basemapControl) {
            basemapControl.style.left = 'auto';
            basemapControl.style.right = '10px';
            basemapControl.style.transform = 'none';
        }
    }, 500);
}

/**
 * Aggiunge comportamenti di interazione touch ai controlli
 */
function addTouchBehaviors() {
    // Implementazione dei feedback touch
    document.querySelectorAll('.maplibregl-ctrl button, .basemap-button').forEach(button => {
        button.addEventListener('touchstart', function(e) {
            this.classList.add('mobile-touch-active');
            
            // Crea effetto ripple
            const ripple = document.createElement('span');
            ripple.className = 'mobile-touch-ripple';
            this.appendChild(ripple);
            
            // Rimuovi l'effetto ripple dopo l'animazione
            setTimeout(() => {
                ripple.remove();
            }, 500);
        });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('mobile-touch-active');
        });
        
        button.addEventListener('touchcancel', function() {
            this.classList.remove('mobile-touch-active');
        });
    });
}

/**
 * Riposiziona i controlli della mappa specificatamente per mobile
 * @param {Object} options - Opzioni di configurazione
 */
function repositionMapControls(options) {
    // Modifica i pannelli per adattarli meglio allo schermo mobile
    setTimeout(() => {
        // Posiziona i controlli secondari nel menu a tendina
        const settingsContainer = document.querySelector('.settings-controls-container');
        if (settingsContainer) {
            // Nascondi inizialmente il container delle impostazioni
            settingsContainer.style.display = 'none';
            
            // Posiziona correttamente il container
            settingsContainer.style.position = 'fixed';
            settingsContainer.style.top = `${options.controlsTopPadding + options.buttonSize + 5}px`;
            settingsContainer.style.right = `${options.controlsSidePadding}px`;
        }
    }, 300);
}

/**
 * Aggiunge supporto per trascinamento dei pannelli
 */
function setupPanelDragging() {
    // Implementazione del supporto per il drag and drop dei pannelli
    setTimeout(() => {
        document.querySelectorAll('.vector-layer-panel, .map-info-panel').forEach(panel => {
            if (!panel.classList.contains('draggable-enabled')) {
                makeElementDraggable(panel);
                panel.classList.add('draggable-enabled');
            }
        });
    }, 500);
}

/**
 * Migliora le interazioni con i dialoghi
 */
function enhanceDialogInteractions() {
    // Migliora l'interazione con i dialoghi su dispositivi mobili
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('vector-layer-panel-close') || 
            e.target.closest('.vector-layer-panel-close')) {
            const panel = e.target.closest('.vector-layer-panel');
            if (panel) {
                panel.style.display = 'none';
            }
        }
    });
}

/**
 * Rende un elemento trascinabile
 * @param {HTMLElement} element - Elemento da rendere trascinabile
 */
function makeElementDraggable(element) {
    if (!element) return;
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // Trova l'intestazione del pannello o usa l'intero pannello
    const header = element.querySelector('.vector-layer-panel-header') || 
                   element.querySelector('.map-info-panel-header') || 
                   element;
    
    if (header) {
        header.style.cursor = 'move';
        header.onmousedown = dragMouseDown;
        header.ontouchstart = dragTouchStart;
    }
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Ottieni la posizione del cursore all'avvio
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Chiama una funzione ogni volta che il cursore si muove
        document.onmousemove = elementDrag;
    }
    
    function dragTouchStart(e) {
        e = e || window.event;
        // Per il touch, impedisci lo scrolling della pagina
        if (e.cancelable) {
            e.preventDefault();
        }
        // Ottieni la posizione del touch all'avvio
        pos3 = e.touches[0].clientX;
        pos4 = e.touches[0].clientY;
        document.ontouchend = closeDragElement;
        // Chiama una funzione ogni volta che il touch si muove
        document.ontouchmove = elementTouchDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calcola la nuova posizione del cursore
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Imposta la nuova posizione dell'elemento
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function elementTouchDrag(e) {
        e = e || window.event;
        // Per il touch, impedisci lo scrolling della pagina durante il drag
        if (e.cancelable) {
            e.preventDefault();
        }
        // Calcola la nuova posizione del touch
        pos1 = pos3 - e.touches[0].clientX;
        pos2 = pos4 - e.touches[0].clientY;
        pos3 = e.touches[0].clientX;
        pos4 = e.touches[0].clientY;
        // Imposta la nuova posizione dell'elemento
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        // Ferma il movimento quando il tasto del mouse viene rilasciato o il touch termina
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}
