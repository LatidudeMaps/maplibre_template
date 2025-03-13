/**
 * Crea il pannello per la gestione dei layer
 * @param {boolean} isVisible - Visibilità del pannello
 * @param {Array} layersList - Lista dei layer aggiunti
 * @param {Function} onToggleLayerVisibility - Callback per attivare/disattivare la visibilità di un layer
 * @param {Function} onRemoveLayer - Callback per rimuovere un layer
 * @param {Function} onTogglePanel - Callback per aprire/chiudere il pannello
 * @param {Object} dragOffset - Offset per il trascinamento
 * @returns {HTMLElement} - Il pannello dei layer
 */
export function createLayerPanel(isVisible, layersList, onToggleLayerVisibility, onRemoveLayer, onTogglePanel, dragOffset) {
    // Rimuovi il pannello esistente se presente
    const existingPanel = document.querySelector('.vector-layer-panel');
    if (existingPanel) {
        existingPanel.parentNode.removeChild(existingPanel);
    }
    
    // Crea il nuovo pannello
    const layerPanel = document.createElement('div');
    layerPanel.className = 'vector-layer-panel';
    
    // Posiziona inizialmente in basso a sinistra
    layerPanel.style.top = 'auto';
    layerPanel.style.bottom = '50px'; // Sopra la scala
    layerPanel.style.left = '10px';
    layerPanel.style.right = 'auto';
    
    layerPanel.style.display = isVisible ? 'block' : 'none';
    
    // Intestazione del pannello
    const header = document.createElement('div');
    header.className = 'vector-layer-panel-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Layer Panel';
    title.style.fontSize = '14px'; // Testo più piccolo
    
    const closeButton = document.createElement('button');
    closeButton.className = 'vector-layer-panel-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Chiudi pannello';
    closeButton.addEventListener('click', onTogglePanel);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    layerPanel.appendChild(header);
    
    // Aggiungi funzionalità drag
    makeDraggable(header, layerPanel, dragOffset);
    
    // Contenuto del pannello
    const content = document.createElement('div');
    content.className = 'vector-layer-panel-content';
    
    if (layersList.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'vector-layer-panel-empty';
        emptyMessage.textContent = 'Nessun layer disponibile';
        content.appendChild(emptyMessage);
    } else {
        // Crea la lista dei layer
        const layerList = document.createElement('ul');
        layerList.className = 'vector-layer-panel-list';
        
        // Aggiungi un elemento per ogni layer
        layersList.forEach((layer, index) => {
            const layerItem = document.createElement('li');
            layerItem.className = 'vector-layer-panel-item';
            
            // Checkbox per attivare/disattivare
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.id = `layer-toggle-${layer.layerId}`;
            toggle.checked = layer.visible !== false; // Tutti i layer sono visibili all'inizio
            toggle.addEventListener('change', () => onToggleLayerVisibility(layer, toggle.checked));
            
            // Label con il nome del layer
            const label = document.createElement('label');
            label.htmlFor = toggle.id;
            label.className = 'vector-layer-panel-label';
            label.textContent = layer.name;
            
            // Pulsante di rimozione
            const removeButton = document.createElement('button');
            removeButton.className = 'vector-layer-panel-remove';
            removeButton.title = 'Rimuovi layer';
            removeButton.innerHTML = '&times;';
            removeButton.addEventListener('click', () => onRemoveLayer(index));
            
            layerItem.appendChild(toggle);
            layerItem.appendChild(label);
            layerItem.appendChild(removeButton);
            layerList.appendChild(layerItem);
        });
        
        content.appendChild(layerList);
    }
    
    layerPanel.appendChild(content);
    
    // Aggiungi il pannello al DOM
    document.body.appendChild(layerPanel);
    
    return layerPanel;
}

/**
 * Rende il pannello trascinabile
 * @param {HTMLElement} headerElement - Elemento dell'intestazione 
 * @param {HTMLElement} panelElement - Elemento del pannello
 * @param {Object} dragOffset - Offset per il trascinamento
 */
export function makeDraggable(headerElement, panelElement, dragOffset) {
    let isDragging = false;
    
    headerElement.style.cursor = 'move';
    
    // Eventi mouse
    headerElement.addEventListener('mousedown', (e) => {
        if (e.target === headerElement || e.target.tagName === 'H3') {
            isDragging = true;
            
            // Calcola l'offset del mouse rispetto all'angolo del pannello
            const rect = panelElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calcola nuova posizione
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        
        // Applica la nuova posizione
        panelElement.style.left = `${x}px`;
        panelElement.style.top = `${y}px`;
        panelElement.style.right = 'auto';
        panelElement.style.bottom = 'auto';
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Eventi touch per dispositivi mobili
    headerElement.addEventListener('touchstart', (e) => {
        if (e.target === headerElement || e.target.tagName === 'H3') {
            isDragging = true;
            
            // Calcola l'offset del touch rispetto all'angolo del pannello
            const rect = panelElement.getBoundingClientRect();
            const touch = e.touches[0];
            dragOffset.x = touch.clientX - rect.left;
            dragOffset.y = touch.clientY - rect.top;
            
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        // Calcola nuova posizione
        const touch = e.touches[0];
        const x = touch.clientX - dragOffset.x;
        const y = touch.clientY - dragOffset.y;
        
        // Applica la nuova posizione
        panelElement.style.left = `${x}px`;
        panelElement.style.top = `${y}px`;
        panelElement.style.right = 'auto';
        panelElement.style.bottom = 'auto';
        
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

/**
 * Aggiorna il pannello dei layer
 * @param {Object} controlInstance - Istanza del controllo VectorLayerControl
 */
export function updateLayerPanel(controlInstance) {
    controlInstance._createLayerPanel();
}

/**
 * Mostra/nasconde il pannello dei layer
 * @param {boolean} isVisible - Visibilità del pannello
 * @param {HTMLElement} panelElement - Elemento del pannello
 * @param {Function} createFn - Funzione per creare il pannello
 */
export function toggleLayerPanel(isVisible, panelElement, createFn) {
    if (isVisible) {
        createFn();
    } else if (panelElement) {
        panelElement.style.display = 'none';
    }
}