/**
 * Modulo per migliorare la gestione delle gesture touch su mobile
 */

/**
 * Configura le gesture touch avanzate per mobile
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
export function setupGestures(map, options = {}) {
    const defaultOptions = {
        enableQuickZoom: true,           // Abilita il double tap per zoom
        enableTwoFingerRotation: true,   // Abilita rotazione con due dita
        enableTwoFingerTiltUp: true,     // Abilita inclinazione con due dita (verso l'alto)
        enableQuickReset: true,          // Abilita triple tap per reset vista
        tiltSensitivity: 0.6,            // Sensibilità dell'inclinazione (aumentata leggermente)
        rotationSensitivity: 0.8         // Sensibilità della rotazione
    };

    // Combina le opzioni predefinite con quelle passate
    const opts = { ...defaultOptions, ...options };

    // Aggiungi info all'utente sulla prima visita
    showGestureInfo();
    
    // Configura le gesture personalizzate
    if (opts.enableQuickZoom) {
        setupQuickZoom(map);
    }
    
    if (opts.enableTwoFingerRotation || opts.enableTwoFingerTiltUp) {
        setupTwoFingerGestures(map, opts);
    }
    
    if (opts.enableQuickReset) {
        setupQuickReset(map);
    }
    
    // Migliora la reattività dei controlli touch
    improveControlsTouchFeedback();
}

/**
 * Mostra informazioni sulle gesture all'utente (solo la prima volta)
 */
function showGestureInfo() {
    // Controlla se l'utente ha già visto l'info
    if (localStorage.getItem('mobile-gestures-info-shown')) {
        return;
    }
    
    // Crea e mostra il tooltip di informazione
    const infoTooltip = document.createElement('div');
    infoTooltip.className = 'mobile-gesture-info';
    infoTooltip.innerHTML = `
        <div class=\"mobile-gesture-info-content\">
            <h3>Controlli touch disponibili</h3>
            <ul class=\"mobile-gesture-list\">
                <li><span class=\"gesture-icon\">👆👆</span> Doppio tap = Zoom avanti</li>
                <li><span class=\"gesture-icon\">🔄</span> Due dita rotazione = Ruota mappa</li>
                <li><span class=\"gesture-icon\">👆👇</span> Due dita verticale = Inclina vista</li>
                <li><span class=\"gesture-icon\">👆👆👆</span> Triplo tap = Reset vista</li>
            </ul>
            <button class=\"mobile-gesture-close\">Ho capito</button>
        </div>
    `;
    
    document.body.appendChild(infoTooltip);
    
    // Gestisci la chiusura
    const closeButton = infoTooltip.querySelector('.mobile-gesture-close');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(infoTooltip);
        localStorage.setItem('mobile-gestures-info-shown', 'true');
    });
    
    // Chiudi automaticamente dopo 8 secondi (ridotto da 10 a 8)
    setTimeout(() => {
        if (document.body.contains(infoTooltip)) {
            document.body.removeChild(infoTooltip);
            localStorage.setItem('mobile-gestures-info-shown', 'true');
        }
    }, 8000);
}

/**
 * Configura la gesture di doppio tap per zoom rapido
 * @param {Object} map - Istanza della mappa MapLibre
 */
function setupQuickZoom(map) {
    let lastTap = 0;
    let tapCount = 0;
    let tapTimeout;
    
    map.getCanvas().addEventListener('touchend', (e) => {
        // Ignora eventi con più di un tocco (multitouch)
        if (e.changedTouches.length > 1) return;
        
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        clearTimeout(tapTimeout);
        
        if (tapLength < 300 && tapLength > 0) {
            tapCount++;
            
            if (tapCount === 1) {
                // Doppio tap: zoom avanti
                tapTimeout = setTimeout(() => {
                    const targetZoom = Math.min(map.getZoom() + 1, map.getMaxZoom());
                    
                    // Ottieni il punto di tap per centrare lo zoom
                    const touch = e.changedTouches[0];
                    const rect = map.getCanvas().getBoundingClientRect();
                    const point = {
                        x: touch.clientX - rect.left,
                        y: touch.clientY - rect.top
                    };
                    
                    // Anima lo zoom al punto toccato
                    map.easeTo({
                        zoom: targetZoom,
                        center: map.unproject([point.x, point.y]),
                        duration: 300
                    });
                    
                    tapCount = 0;
                }, 300);
            } else if (tapCount === 2) {
                // Triplo tap: gestito da setupQuickReset
                tapCount = 0;
            }
        } else {
            tapCount = 0;
        }
        
        lastTap = currentTime;
    });
}

/**
 * Configura la gesture di triplo tap per reset della vista
 * @param {Object} map - Istanza della mappa MapLibre
 */
function setupQuickReset(map) {
    let lastTap = 0;
    let tapCount = 0;
    
    map.getCanvas().addEventListener('touchend', (e) => {
        // Ignora eventi con più di un tocco (multitouch)
        if (e.changedTouches.length > 1) return;
        
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            tapCount++;
            
            if (tapCount === 2) {
                // Triplo tap: reset vista a nord
                setTimeout(() => {
                    // Ripristina l'orientamento a nord con animazione
                    map.easeTo({
                        bearing: 0,
                        pitch: 0,
                        duration: 500
                    });
                    
                    tapCount = 0;
                }, 300);
            }
        } else {
            tapCount = 0;
        }
        
        lastTap = currentTime;
    });
}

/**
 * Configura le gesture con due dita per rotazione e inclinazione
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} options - Opzioni di configurazione
 */
function setupTwoFingerGestures(map, options) {
    let startTouches = [];
    let lastTouches = [];
    let isRotating = false;
    let isTilting = false;
    
    // Calcola l'angolo tra due punti
    const getAngle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    
    // Calcola la distanza tra due punti
    const getDistance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    
    // Calcola il punto medio tra due punti
    const getMidpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
    
    // Blocca la pagina dal scrolling durante le gesture di mappa
    const preventPageScroll = (e) => {
        // Blocca solo se stiamo usando due dita sulla mappa
        if (e.touches.length === 2 && (isRotating || isTilting)) {
            e.preventDefault();
        }
    };
    
    // Aggiungi l'handler per prevenire lo scrolling della pagina
    document.addEventListener('touchmove', preventPageScroll, { passive: false });
    
    map.getCanvas().addEventListener('touchstart', (e) => {
        // Cattura solo eventi con esattamente due tocchi
        if (e.touches.length === 2) {
            e.preventDefault();
            
            // Salva i punti di inizio
            startTouches = [
                { x: e.touches[0].clientX, y: e.touches[0].clientY },
                { x: e.touches[1].clientX, y: e.touches[1].clientY }
            ];
            
            lastTouches = [...startTouches];
            
            // Determina se i tocchi sono principalmente orizzontali o verticali
            const dx = Math.abs(startTouches[0].x - startTouches[1].x);
            const dy = Math.abs(startTouches[0].y - startTouches[1].y);
            
            // Calcola la distanza iniziale tra i tocchi
            const initialDistance = getDistance(startTouches[0], startTouches[1]);
            
            isRotating = dx > dy && options.enableTwoFingerRotation;
            isTilting = dy > dx && options.enableTwoFingerTiltUp;
        }
    }, { passive: false });
    
    map.getCanvas().addEventListener('touchmove', (e) => {
        // Processa solo eventi con esattamente due tocchi
        if (e.touches.length === 2 && (isRotating || isTilting)) {
            e.preventDefault();
            
            const currentTouches = [
                { x: e.touches[0].clientX, y: e.touches[0].clientY },
                { x: e.touches[1].clientX, y: e.touches[1].clientY }
            ];
            
            if (isRotating) {
                // Calcola la rotazione
                const startAngle = getAngle(startTouches[0], startTouches[1]);
                const currentAngle = getAngle(currentTouches[0], currentTouches[1]);
                const deltaAngle = (currentAngle - startAngle) * options.rotationSensitivity;
                
                // Calcola il punto centrale tra i due tocchi
                const centerPoint = getMidpoint(currentTouches[0], currentTouches[1]);
                const rect = map.getCanvas().getBoundingClientRect();
                const center = map.unproject([
                    centerPoint.x - rect.left,
                    centerPoint.y - rect.top
                ]);
                
                // Applica la rotazione
                map.setBearing(map.getBearing() - deltaAngle);
            } else if (isTilting) {
                // Calcola il delta dell'inclinazione (movimento verticale medio)
                const lastMiddleY = (lastTouches[0].y + lastTouches[1].y) / 2;
                const currentMiddleY = (currentTouches[0].y + currentTouches[1].y) / 2;
                const deltaY = (lastMiddleY - currentMiddleY) * options.tiltSensitivity;
                
                // Applica l'inclinazione (positivo = inclina su, negativo = inclina giù)
                const newPitch = Math.max(0, Math.min(85, map.getPitch() + deltaY));
                map.setPitch(newPitch);
            }
            
            // Aggiorna i tocchi precedenti
            lastTouches = [...currentTouches];
        }
    }, { passive: false });
    
    map.getCanvas().addEventListener('touchend', (e) => {
        // Reset delle variabili quando termina il tocco
        if (e.touches.length < 2) {
            isRotating = false;
            isTilting = false;
        }
    });
    
    // Pulisci l'event listener quando l'utente lascia la pagina
    window.addEventListener('beforeunload', () => {
        document.removeEventListener('touchmove', preventPageScroll);
    });
}

/**
 * Migliora il feedback touch per i controlli
 */
function improveControlsTouchFeedback() {
    // Aggiungi feedback visivo al touch per tutti i controlli
    const mapControls = document.querySelectorAll('.maplibregl-ctrl button, .basemap-button');
    
    mapControls.forEach(button => {
        // Impedisci effetto zoom su mobile quando si toccano i controlli
        button.style.touchAction = 'manipulation';
        
        // Aggiungi classe di evidenziazione al tocco
        button.addEventListener('touchstart', () => {
            button.classList.add('mobile-touch-active');
        }, { passive: true });
        
        // Rimuovi classe di evidenziazione dopo il tocco
        ['touchend', 'touchcancel'].forEach(event => {
            button.addEventListener(event, () => {
                button.classList.remove('mobile-touch-active');
                
                // Aggiungi effetto ripple
                const ripple = document.createElement('span');
                ripple.className = 'mobile-touch-ripple';
                button.appendChild(ripple);
                
                // Rimuovi l'elemento ripple dopo l'animazione
                setTimeout(() => {
                    if (button.contains(ripple)) {
                        button.removeChild(ripple);
                    }
                }, 500);
            }, { passive: true });
        });
    });
}