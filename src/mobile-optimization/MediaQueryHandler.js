/**
 * Modulo per gestire i media queries e adattamenti reattivi dinamici
 */

/**
 * Configura i media queries per adattamenti dinamici
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
export function setupMediaQueries(map, options = {}) {
    const defaultOptions = {
        smallScreenWidth: 480,    // Larghezza max per schermi molto piccoli (px)
        mediumScreenWidth: 768,   // Larghezza max per schermi medi (px)
        orientationChangeDelay: 250 // Ritardo dopo cambio orientamento (ms) - ridotto per maggiore reattività
    };

    // Combina le opzioni predefinite con quelle passate
    const opts = { ...defaultOptions, ...options };

    // Applica subito le ottimizzazioni in base alla dimensione attuale
    applyScreenSizeOptimizations(map, window.innerWidth, window.innerHeight, opts);

    // Listener per il resize dello schermo
    window.addEventListener('resize', debounce(() => {
        applyScreenSizeOptimizations(map, window.innerWidth, window.innerHeight, opts);
    }, 200)); // Ridotto a 200ms per maggiore reattività

    // Listener per il cambio di orientamento su mobile
    window.addEventListener('orientationchange', () => {
        // Piccolo ritardo per dare tempo al browser di completare il cambio
        setTimeout(() => {
            applyScreenSizeOptimizations(map, window.innerWidth, window.innerHeight, opts);
        }, opts.orientationChangeDelay);
    });
}

/**
 * Applica ottimizzazioni specifiche in base alla dimensione dello schermo
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {number} screenWidth - Larghezza attuale dello schermo
 * @param {number} screenHeight - Altezza attuale dello schermo
 * @param {Object} options - Opzioni di configurazione
 */
function applyScreenSizeOptimizations(map, screenWidth, screenHeight, options) {
    // Aggiungi classi al body per controllare gli stili CSS
    if (screenWidth <= options.smallScreenWidth) {
        document.body.classList.add('mobile-xs');
        document.body.classList.remove('mobile-sm', 'mobile-md');
    } else if (screenWidth <= options.mediumScreenWidth) {
        document.body.classList.add('mobile-sm');
        document.body.classList.remove('mobile-xs', 'mobile-md');
    } else if (screenWidth <= 1024) {
        document.body.classList.add('mobile-md');
        document.body.classList.remove('mobile-xs', 'mobile-sm');
    } else {
        document.body.classList.remove('mobile-xs', 'mobile-sm', 'mobile-md');
    }

    // Aggiungi classe per l'orientamento
    const isLandscape = screenWidth > screenHeight;
    if (isLandscape) {
        document.body.classList.add('landscape');
        document.body.classList.remove('portrait');
    } else {
        document.body.classList.add('portrait');
        document.body.classList.remove('landscape');
    }

    // Ottimizzazioni per schermi molto piccoli
    if (screenWidth <= options.smallScreenWidth) {
        // Riduci la distanza tra i controlli
        adjustControlSpacing(4);
        
        // Nascondi la minimap o riducila ulteriormente
        adjustMinimapSize(0.5);
        
        // Ottimizza il selettore di basemap
        adjustBasemapSelector(true);
        
        // Ottimizza la scala della mappa
        adjustScaleControl(80);
    } 
    // Ottimizzazioni per schermi medi
    else if (screenWidth <= options.mediumScreenWidth) {
        // Imposta una distanza moderata tra i controlli
        adjustControlSpacing(5);
        
        // Riduci la dimensione della minimap ma non nasconderla
        adjustMinimapSize(0.6);
        
        // Ottimizza il selettore di basemap
        adjustBasemapSelector(false);
        
        // Ottimizza la scala della mappa
        adjustScaleControl(100);
    }
    // Ottimizzazioni per tablet e schermi grandi
    else {
        // Ripristina la distanza standard tra i controlli
        adjustControlSpacing(6);
        
        // Ripristina la dimensione della minimap
        adjustMinimapSize(0.7);
        
        // Ripristina il selettore di basemap
        adjustBasemapSelector(false);
        
        // Ripristina la scala della mappa
        adjustScaleControl(null);
    }
    
    // Adattamenti speciali per l'orientamento landscape su schermi piccoli
    if (isLandscape && screenHeight <= 450) {
        // In landscape su schermi piccoli, minimizza ulteriormente l'interfaccia
        document.body.classList.add('compact-ui');
        compactUIMode(true);
    } else {
        document.body.classList.remove('compact-ui');
        compactUIMode(false);
    }
}

/**
 * Attiva o disattiva la modalità compatta dell'interfaccia per schermi molto bassi
 * @param {boolean} enable - Se attivare la modalità compatta
 */
function compactUIMode(enable) {
    if (enable) {
        // Riduce le dimensioni e il padding di tutti i controlli
        document.querySelectorAll('.maplibregl-ctrl button').forEach(button => {
            button.style.width = '30px';
            button.style.height = '30px';
        });
        
        // Riduci la dimensione dei contenitori
        document.querySelectorAll('.maplibregl-ctrl-group').forEach(group => {
            group.style.marginBottom = '3px';
        });
        
        // Sposta i controlli in alto più vicino al bordo
        const topControls = document.querySelectorAll('.maplibregl-ctrl-top-right, .maplibregl-ctrl-top-left');
        topControls.forEach(control => {
            control.style.top = '3px';
        });
        
        // Adatta il selettore di basemap
        const basemapControl = document.querySelector('.basemap-buttons-control');
        if (basemapControl) {
            basemapControl.style.right = '5px';
            
            // Riduci la dimensione dei pulsanti
            const buttons = basemapControl.querySelectorAll('.basemap-button');
            buttons.forEach(button => {
                button.style.padding = '4px 8px';
                button.style.fontSize = '11px';
            });
        }
    } else {
        // Ripristina le dimensioni standard
        document.querySelectorAll('.maplibregl-ctrl button').forEach(button => {
            button.style.width = '';
            button.style.height = '';
        });
        
        document.querySelectorAll('.maplibregl-ctrl-group').forEach(group => {
            group.style.marginBottom = '';
        });
        
        const topControls = document.querySelectorAll('.maplibregl-ctrl-top-right, .maplibregl-ctrl-top-left');
        topControls.forEach(control => {
            control.style.top = '';
        });
        
        // Ripristina il selettore di basemap
        const basemapControl = document.querySelector('.basemap-buttons-control');
        if (basemapControl) {
            basemapControl.style.right = '';
            
            const buttons = basemapControl.querySelectorAll('.basemap-button');
            buttons.forEach(button => {
                button.style.padding = '';
                button.style.fontSize = '';
            });
        }
    }
}

/**
 * Regola lo spazio tra i controlli
 * @param {number} spacing - Spazio in pixel tra i controlli
 */
function adjustControlSpacing(spacing) {
    const rightControls = document.querySelectorAll('.maplibregl-ctrl-top-right .maplibregl-ctrl-group');
    rightControls.forEach(control => {
        control.style.margin = `0 0 ${spacing}px 0`;
    });
    
    const leftControls = document.querySelectorAll('.maplibregl-ctrl-top-left .maplibregl-ctrl');
    leftControls.forEach(control => {
        control.style.margin = `0 ${spacing}px ${spacing}px 0`;
    });
}

/**
 * Regola la dimensione della minimap
 * @param {number} scaleFactor - Fattore di scala (1 = dimensione originale)
 */
function adjustMinimapSize(scaleFactor) {
    const minimap = document.querySelector('.maplibregl-ctrl .minimap-toggle-btn')?.closest('.maplibregl-ctrl');
    if (minimap) {
        // Troviamo la dimensione originale (considerando che potrebbe essere già stata modificata)
        const originalStyle = minimap.getAttribute('data-original-style');
        let originalWidth = 200;  // Valore predefinito
        let originalHeight = 200; // Valore predefinito
        
        if (!originalStyle) {
            // Salvare lo stile originale la prima volta
            originalWidth = parseInt(window.getComputedStyle(minimap).width) || 200;
            originalHeight = parseInt(window.getComputedStyle(minimap).height) || 200;
            minimap.setAttribute('data-original-style', JSON.stringify({
                width: originalWidth,
                height: originalHeight
            }));
        } else {
            // Usare i valori originali salvati
            const originalDimensions = JSON.parse(originalStyle);
            originalWidth = originalDimensions.width;
            originalHeight = originalDimensions.height;
        }
        
        // Applica il fattore di scala
        minimap.style.width = `${originalWidth * scaleFactor}px`;
        minimap.style.height = `${originalHeight * scaleFactor}px`;
        
        // Se il fattore di scala è molto piccolo, nascondi la minimap
        if (scaleFactor <= 0.5) {
            const minimapToggle = minimap.querySelector('.minimap-toggle-btn');
            if (minimapToggle && window.getComputedStyle(minimap).opacity === '1') {
                // Se la minimap è aperta, chiudila automaticamente
                try {
                    minimapToggle.click();
                } catch (e) {
                    console.error('Impossibile chiudere automaticamente la minimap:', e);
                }
            }
        }
    }
}

/**
 * Regola il selettore di basemap per diverse dimensioni di schermo
 * @param {boolean} compact - Se utilizzare la versione compatta
 */
function adjustBasemapSelector(compact) {
    const basemapControl = document.querySelector('.basemap-buttons-control');
    if (!basemapControl) return;
    
    const basemapButtons = basemapControl.querySelector('.basemap-buttons-container');
    if (!basemapButtons) return;
    
    if (compact) {
        // Versione compatta per schermi molto piccoli
        basemapControl.style.right = '8px';
        
        // Riduci la dimensione dei pulsanti
        const buttons = basemapButtons.querySelectorAll('.basemap-button');
        buttons.forEach(button => {
            button.style.padding = '5px 10px';
            button.style.fontSize = '12px';
            button.style.margin = '1px 0';
        });
    } else {
        // Versione standard
        basemapControl.style.right = '10px';
        
        // Ripristina la dimensione dei pulsanti
        const buttons = basemapButtons.querySelectorAll('.basemap-button');
        buttons.forEach(button => {
            button.style.padding = '6px 12px';
            button.style.fontSize = '13px';
            button.style.margin = '2px 0';
        });
    }
}

/**
 * Regola la scala della mappa
 * @param {number|null} width - Larghezza della scala in pixel, null per ripristinare
 */
function adjustScaleControl(width) {
    const scaleControl = document.querySelector('.maplibregl-ctrl-scale');
    if (scaleControl) {
        if (width) {
            scaleControl.style.width = `${width}px`;
        } else {
            scaleControl.style.width = '';  // Ripristina la larghezza predefinita
        }
    }
}

/**
 * Funzione di debounce per limitare la frequenza di esecuzione
 * @param {Function} func - Funzione da eseguire
 * @param {number} wait - Tempo di attesa in ms
 * @returns {Function} - Funzione con debounce
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}