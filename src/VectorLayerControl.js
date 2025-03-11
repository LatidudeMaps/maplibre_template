import maplibregl from 'maplibre-gl';
import toGeoJSON from '@mapbox/togeojson';
import * as Papa from 'papaparse';
import * as turf from '@turf/turf';
import * as shpjs from 'shpjs';

/**
 * Controllo per aggiungere e rimuovere layer vettoriali alla mappa
 * Supporta i formati: GeoJSON, CSV, GPX, KML, Shapefile
 * Permette di caricare file da locale o da URL
 */
class VectorLayerControl {
    constructor(options = {}) {
        this._map = null;
        this._container = null;
        this._layerCount = 0;
        this._addedLayers = []; // Teniamo traccia dei layer aggiunti
        this._layerPanel = null; // Pannello per la gestione dei layer
        this._layerPanelVisible = false; // Stato di visibilità del pannello
        this._dragOffset = { x: 0, y: 0 }; // Per il dragging del pannello
        this._options = {
            position: options.position || 'top-right',
            supportedFormats: options.supportedFormats || ['csv', 'geojson', 'json', 'gpx', 'kml', 'shp', 'zip']
        };
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        // Creare il pulsante principale
        const button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon vector-layer-control';
        button.type = 'button';
        button.title = 'Aggiungi layer vettoriale';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" fill="currentColor"/>
            </svg>
        `;
        
        // Creare il menu a dropdown
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'vector-layer-dropdown';
        dropdownMenu.style.display = 'none';
        
        // Opzioni del menu
        const options = [
            { label: 'Carica file locale', action: () => this._promptLocalFile() },
            { label: 'Carica da URL', action: () => this._promptURL() },
            { label: 'Mostra Layer Panel', action: () => this._toggleLayerPanel() }
        ];
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'vector-layer-option';
            item.textContent = option.label;
            item.addEventListener('click', () => {
                option.action();
                dropdownMenu.style.display = 'none';
            });
            dropdownMenu.appendChild(item);
        });
        
        this._container.appendChild(button);
        this._container.appendChild(dropdownMenu);
        
        // Toggle del menu al click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownMenu.style.display === 'none') {
                dropdownMenu.style.display = 'block';
                
                // Reset del posizionamento per evitare problemi
                dropdownMenu.style.left = '';
                dropdownMenu.style.right = '';
                dropdownMenu.style.top = '';
            } else {
                dropdownMenu.style.display = 'none';
            }
        });
        
        // Chiudi il menu al click fuori
        document.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
        });
        
        // Crea il pannello dei layer
        this._createLayerPanel();
        
        // Aggiungi stili CSS
        this._addStyles();
        
        return this._container;
    }

    onRemove() {
        // Rimuovi il pannello dei layer se esiste
        if (this._layerPanel && this._layerPanel.parentNode) {
            this._layerPanel.parentNode.removeChild(this._layerPanel);
        }
        
        this._container.parentNode.removeChild(this._container);
        this._map = null;
    }
    
    /**
     * Crea il pannello per la gestione dei layer
     */
    _createLayerPanel() {
        // Rimuovi il pannello esistente se presente
        if (this._layerPanel && this._layerPanel.parentNode) {
            this._layerPanel.parentNode.removeChild(this._layerPanel);
        }
        
        // Crea il nuovo pannello
        this._layerPanel = document.createElement('div');
        this._layerPanel.className = 'vector-layer-panel';
        
        // Posiziona inizialmente in basso a sinistra
        this._layerPanel.style.top = 'auto';
        this._layerPanel.style.bottom = '50px'; // Sopra la scala
        this._layerPanel.style.left = '10px';
        this._layerPanel.style.right = 'auto';
        
        this._layerPanel.style.display = this._layerPanelVisible ? 'block' : 'none';
        
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
        closeButton.addEventListener('click', () => this._toggleLayerPanel());
        
        header.appendChild(title);
        header.appendChild(closeButton);
        this._layerPanel.appendChild(header);
        
        // Aggiungi funzionalità drag
        this._makeDraggable(header);
        
        // Contenuto del pannello
        const content = document.createElement('div');
        content.className = 'vector-layer-panel-content';
        
        if (this._addedLayers.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'vector-layer-panel-empty';
            emptyMessage.textContent = 'Nessun layer disponibile';
            content.appendChild(emptyMessage);
        } else {
            // Crea la lista dei layer
            const layerList = document.createElement('ul');
            layerList.className = 'vector-layer-panel-list';
            
            // Aggiungi un elemento per ogni layer
            this._addedLayers.forEach(layer => {
                const layerItem = document.createElement('li');
                layerItem.className = 'vector-layer-panel-item';
                
                // Checkbox per attivare/disattivare
                const toggle = document.createElement('input');
                toggle.type = 'checkbox';
                toggle.id = `layer-toggle-${layer.layerId}`;
                toggle.checked = layer.visible !== false; // Tutti i layer sono visibili all'inizio
                toggle.addEventListener('change', () => this._toggleLayerVisibility(layer, toggle.checked));
                
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
                removeButton.addEventListener('click', () => {
                    const index = this._addedLayers.findIndex(l => l.layerId === layer.layerId);
                    if (index !== -1) {
                        this._removeLayer(index);
                        this._updateLayerPanel(); // Aggiorna il pannello dopo la rimozione
                    }
                });
                
                layerItem.appendChild(toggle);
                layerItem.appendChild(label);
                layerItem.appendChild(removeButton);
                layerList.appendChild(layerItem);
            });
            
            content.appendChild(layerList);
        }
        
        this._layerPanel.appendChild(content);
        
        // Aggiungi il pannello al DOM
        document.body.appendChild(this._layerPanel);
    }

    onRemove() {
        // Rimuovi il pannello dei layer se esiste
        if (this._layerPanel && this._layerPanel.parentNode) {
            this._layerPanel.parentNode.removeChild(this._layerPanel);
        }
        
        this._container.parentNode.removeChild(this._container);
        this._map = null;
    }
    
    /**
     * Crea il pannello per la gestione dei layer
     */
    _createLayerPanel() {
        // Rimuovi il pannello esistente se presente
        if (this._layerPanel && this._layerPanel.parentNode) {
            this._layerPanel.parentNode.removeChild(this._layerPanel);
        }
        
        // Crea il nuovo pannello
        this._layerPanel = document.createElement('div');
        this._layerPanel.className = 'vector-layer-panel';
        
        // Posiziona inizialmente in basso a sinistra
        this._layerPanel.style.top = 'auto';
        this._layerPanel.style.bottom = '50px'; // Sopra la scala
        this._layerPanel.style.left = '10px';
        this._layerPanel.style.right = 'auto';
        
        this._layerPanel.style.display = this._layerPanelVisible ? 'block' : 'none';
        
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
        closeButton.addEventListener('click', () => this._toggleLayerPanel());
        
        header.appendChild(title);
        header.appendChild(closeButton);
        this._layerPanel.appendChild(header);
        
        // Aggiungi funzionalità drag
        this._makeDraggable(header);
        
        // Contenuto del pannello
        const content = document.createElement('div');
        content.className = 'vector-layer-panel-content';
        
        if (this._addedLayers.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'vector-layer-panel-empty';
            emptyMessage.textContent = 'Nessun layer disponibile';
            content.appendChild(emptyMessage);
        } else {
            // Crea la lista dei layer
            const layerList = document.createElement('ul');
            layerList.className = 'vector-layer-panel-list';
            
            // Aggiungi un elemento per ogni layer
            this._addedLayers.forEach(layer => {
                const layerItem = document.createElement('li');
                layerItem.className = 'vector-layer-panel-item';
                
                // Checkbox per attivare/disattivare
                const toggle = document.createElement('input');
                toggle.type = 'checkbox';
                toggle.id = `layer-toggle-${layer.layerId}`;
                toggle.checked = layer.visible !== false; // Tutti i layer sono visibili all'inizio
                toggle.addEventListener('change', () => this._toggleLayerVisibility(layer, toggle.checked));
                
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
                removeButton.addEventListener('click', () => {
                    const index = this._addedLayers.findIndex(l => l.layerId === layer.layerId);
                    if (index !== -1) {
                        this._removeLayer(index);
                        this._updateLayerPanel(); // Aggiorna il pannello dopo la rimozione
                    }
                });
                
                layerItem.appendChild(toggle);
                layerItem.appendChild(label);
                layerItem.appendChild(removeButton);
                layerList.appendChild(layerItem);
            });
            
            content.appendChild(layerList);
        }
        
        this._layerPanel.appendChild(content);
        
        // Aggiungi il pannello al DOM
        document.body.appendChild(this._layerPanel);
    }
    
    /**
     * Rende il pannello trascinabile
     */
    _makeDraggable(headerElement) {
        let isDragging = false;
        
        headerElement.style.cursor = 'move';
        
        // Eventi mouse
        headerElement.addEventListener('mousedown', (e) => {
            if (e.target === headerElement || e.target.tagName === 'H3') {
                isDragging = true;
                
                // Calcola l'offset del mouse rispetto all'angolo del pannello
                const rect = this._layerPanel.getBoundingClientRect();
                this._dragOffset.x = e.clientX - rect.left;
                this._dragOffset.y = e.clientY - rect.top;
                
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // Calcola nuova posizione
            const x = e.clientX - this._dragOffset.x;
            const y = e.clientY - this._dragOffset.y;
            
            // Applica la nuova posizione
            this._layerPanel.style.left = `${x}px`;
            this._layerPanel.style.top = `${y}px`;
            this._layerPanel.style.right = 'auto';
            this._layerPanel.style.bottom = 'auto';
            
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
                const rect = this._layerPanel.getBoundingClientRect();
                const touch = e.touches[0];
                this._dragOffset.x = touch.clientX - rect.left;
                this._dragOffset.y = touch.clientY - rect.top;
                
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            // Calcola nuova posizione
            const touch = e.touches[0];
            const x = touch.clientX - this._dragOffset.x;
            const y = touch.clientY - this._dragOffset.y;
            
            // Applica la nuova posizione
            this._layerPanel.style.left = `${x}px`;
            this._layerPanel.style.top = `${y}px`;
            this._layerPanel.style.right = 'auto';
            this._layerPanel.style.bottom = 'auto';
            
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

/**
     * Aggiorna il pannello dei layer
     */
_updateLayerPanel() {
    if (this._layerPanelVisible) {
        this._createLayerPanel();
    }
}

/**
 * Mostra/nasconde il pannello dei layer
 */
_toggleLayerPanel() {
    this._layerPanelVisible = !this._layerPanelVisible;
    
    if (this._layerPanelVisible) {
        this._createLayerPanel();
    } else if (this._layerPanel) {
        this._layerPanel.style.display = 'none';
    }
}

/**
 * Attiva/disattiva la visibilità di un layer
 */
_toggleLayerVisibility(layer, visible) {
    const visibility = visible ? 'visible' : 'none';
    
    // Aggiorna la visibilità di tutti i sublayer
    if (this._map.getLayer(`${layer.layerId}-fill`)) {
        this._map.setLayoutProperty(`${layer.layerId}-fill`, 'visibility', visibility);
    }
    
    if (this._map.getLayer(`${layer.layerId}-line`)) {
        this._map.setLayoutProperty(`${layer.layerId}-line`, 'visibility', visibility);
    }
    
    if (this._map.getLayer(`${layer.layerId}-point`)) {
        this._map.setLayoutProperty(`${layer.layerId}-point`, 'visibility', visibility);
    }
    
    if (this._map.getLayer(layer.layerId)) {
        this._map.setLayoutProperty(layer.layerId, 'visibility', visibility);
    }
    
    // Aggiorna lo stato del layer
    layer.visible = visible;
}

_addStyles() {
    if (!document.getElementById('vector-layer-control-styles')) {
        const style = document.createElement('style');
        style.id = 'vector-layer-control-styles';
        style.innerHTML = `
            /* Applica il font "Source Sans 3" a tutti gli elementi del controllo */
            .vector-layer-dropdown,
            .vector-layer-option,
            .vector-layer-message,
            .vector-layer-dialog,
            .vector-layer-dialog h3,
            .vector-layer-dialog input,
            .vector-layer-dialog select,
            .vector-layer-dialog textarea,
            .vector-layer-dialog button,
            .layer-item,
            .layer-item button,
            .maplibregl-popup-content,
            .layer-empty,
            .vector-layer-panel,
            .vector-layer-panel-header,
            .vector-layer-panel-content,
            .vector-layer-panel-item,
            .vector-layer-panel-label,
            .vector-layer-panel-empty {
                font-family: "Source Sans 3", "Helvetica Neue", Arial, Helvetica, sans-serif;
            }
            
            .vector-layer-dropdown {
                position: absolute;
                right: 0;
                top: 40px;
                background: white;
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                z-index: 100;
                min-width: 150px;
            }
            .vector-layer-option {
                padding: 8px 12px;
                cursor: pointer;
            }
            .vector-layer-option:hover {
                background-color: #f5f5f5;
            }
            .dark .vector-layer-dropdown {
                background: #111725;
                color: #cbd5e1;
            }
            .dark .vector-layer-option {
                color: #cbd5e1;
            }
            .dark .vector-layer-option:hover {
                background-color: #2c333d;
            }
            .vector-layer-message {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.9);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 80%;
                text-align: center;
                transition: opacity 0.3s ease;
            }
            .vector-layer-message.info {
                background-color: rgba(33, 150, 243, 0.9);
                color: white;
            }
            .vector-layer-message.error {
                background-color: rgba(244, 67, 54, 0.9);
                color: white;
            }
            .vector-layer-message.success {
                background-color: rgba(76, 175, 80, 0.9);
                color: white;
            }
            .dark .vector-layer-message {
                background-color: rgba(20, 25, 35, 0.9);
                color: #cbd5e1;
            }
            
            /* Stili per il pannello dei layer */
            .vector-layer-panel {
                position: absolute;
                width: 250px;
                max-height: 80vh;
                background: white;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
                z-index: 99;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .dark .vector-layer-panel {
                background: #111725;
                color: #cbd5e1;
                box-shadow: 0 0 0 2px rgb(0 0 0 / 35%);
            }
            .vector-layer-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #f8f8f8;
                border-bottom: 1px solid #ddd;
                user-select: none;
            }
            .dark .vector-layer-panel-header {
                background: #414853;
                border-bottom-color: #323436;
            }
            .vector-layer-panel-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            .dark .vector-layer-panel-header h3 {
                color: #cbd5e1;
            }
            .vector-layer-panel-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                color: #666;
            }
            .dark .vector-layer-panel-close {
                color: #cbd5e1;
            }
            .vector-layer-panel-content {
                padding: 10px;
                overflow-y: auto;
                max-height: calc(80vh - 50px);
            }
            .vector-layer-panel-empty {
                padding: 15px 0;
                text-align: center;
                color: #888;
            }
            .dark .vector-layer-panel-empty {
                color: #8b9cb3;
            }
            .vector-layer-panel-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .vector-layer-panel-item {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .dark .vector-layer-panel-item {
                border-bottom-color: #323436;
            }
            .vector-layer-panel-item:last-child {
                border-bottom: none;
            }
            .vector-layer-panel-item input[type="checkbox"] {
                margin-right: 10px;
            }
            .vector-layer-panel-label {
                flex-grow: 1;
                margin-right: 10px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
            }
            .dark .vector-layer-panel-label {
                color: #cbd5e1;
            }
            .vector-layer-panel-remove {
                background: none;
                border: none;
                color: #f44336;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                margin: 0;
                line-height: 1;
            }
            .dark .vector-layer-panel-remove {
                color: #ff6b6b;
            }
            
            .vector-layer-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                max-width: 500px;
                width: 90%;
            }
            .dark .vector-layer-dialog {
                background: #111725;
                color: #cbd5e1;
                box-shadow: 0 0 0 2px rgb(0 0 0 / 35%);
            }
            .vector-layer-dialog h3 {
                margin-top: 0;
            }
            .dark .vector-layer-dialog h3 {
                color: #cbd5e1;
            }
            .vector-layer-dialog input,
            .vector-layer-dialog select,
            .vector-layer-dialog textarea {
                width: 100%;
                padding: 8px;
                margin: 8px 0;
                border-radius: 4px;
                border: 1px solid #ddd;
                box-sizing: border-box;
            }
            .dark .vector-layer-dialog input,
            .dark .vector-layer-dialog select,
            .dark .vector-layer-dialog textarea {
                background: #323436;
                color: #cbd5e1;
                border: 1px solid #414853;
            }
            .vector-layer-dialog-buttons {
                display: flex;
                justify-content: flex-end;
                margin-top: 15px;
            }
            .vector-layer-dialog-buttons button {
                padding: 8px 15px;
                margin-left: 10px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
            .vector-layer-dialog-buttons button.cancel {
                background: #f5f5f5;
            }
            .vector-layer-dialog-buttons button.confirm {
                background: #0078ff;
                color: white;
            }
            .dark .vector-layer-dialog-buttons button.cancel {
                background: #414853;
                color: #cbd5e1;
            }
            .vector-layer-dialog-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
            }
            .layer-list {
                max-height: 300px;
                overflow-y: auto;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .dark .layer-list {
                border-color: #414853;
            }
            .layer-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
            }
            .dark .layer-item {
                border-bottom-color: #323436;
                color: #cbd5e1;
            }
            .layer-item:last-child {
                border-bottom: none;
            }
            .layer-item button {
                background: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
            }
            .layer-item button:hover {
                background: #d32f2f;
            }
            .layer-empty {
                padding: 15px;
                text-align: center;
                color: #888;
            }
            .dark .layer-empty {
                color: #8b9cb3;
            }
            .vector-loading-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid rgba(0, 120, 255, 0.3);
                border-radius: 50%;
                border-top-color: #0078ff;
                animation: vector-spin 1s linear infinite;
                margin-right: 8px;
            }
            .dark .vector-loading-indicator {
                border: 2px solid rgba(0, 120, 255, 0.3);
                border-top-color: #0078ff;
            }
            @keyframes vector-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
     * Apre un dialog per selezionare un file locale
     */
_promptLocalFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.geojson,.json,.csv,.gpx,.kml,.shp,.zip';
    
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            this._handleLocalFile(e.target.files[0]);
        }
    };
    
    input.click();
}

/**
 * Gestisce il file locale selezionato
 */
_handleLocalFile(file) {
    const reader = new FileReader();
    const fileName = file.name;
    const extension = fileName.split('.').pop().toLowerCase();
    const layerName = fileName.split('.')[0] || `Layer ${++this._layerCount}`;
    
    // Se è uno shapefile, gestiamolo diversamente
    if (extension === 'shp' || extension === 'zip') {
        this._showMessage("Caricamento dello shapefile in corso...", 'info');
        reader.onload = (e) => {
            this._processShapefile(e.target.result, layerName);
        };
        reader.readAsArrayBuffer(file);
        return;
    }
    
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            
            switch(extension) {
                case 'geojson':
                case 'json':
                    const geojson = JSON.parse(content);
                    this._addGeoJSONToMap(geojson, layerName);
                    break;
                case 'csv':
                    this._parseCSV(content, layerName);
                    break;
                case 'gpx':
                    const gpxDoc = new DOMParser().parseFromString(content, 'text/xml');
                    const gpxGeoJSON = toGeoJSON.gpx(gpxDoc);
                    this._addGeoJSONToMap(gpxGeoJSON, layerName);
                    break;
                case 'kml':
                    const kmlDoc = new DOMParser().parseFromString(content, 'text/xml');
                    const kmlGeoJSON = toGeoJSON.kml(kmlDoc);
                    this._addGeoJSONToMap(kmlGeoJSON, layerName);
                    break;
                default:
                    this._showMessage(`Formato ${extension} non supportato`, 'error');
            }
        } catch (error) {
            console.error("Errore nell'elaborazione del file:", error);
            this._showMessage(`Errore nell'elaborazione del file: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = () => {
        this._showMessage('Errore nella lettura del file', 'error');
    };
    
    reader.readAsText(file);
}

/**
     * Processa uno shapefile e lo converte in GeoJSON
     * @param {ArrayBuffer} buffer - Il contenuto del file shapefile
     * @param {string} layerName - Il nome da assegnare al layer
     */
async _processShapefile(buffer, layerName) {
    try {
        // Mostra un indicatore di caricamento
        this._showLoadingMessage("Elaborazione dello shapefile in corso...");
        
        // Utilizziamo shpjs per convertire lo shapefile in GeoJSON
        let geojson;
        
        try {
            // Tenta di elaborare come shapefile singolo
            geojson = await shpjs.parseShp(buffer);
            
            // Se arriviamo qui ma geojson non ha features o non è un oggetto valido,
            // proviamo come archivio zip
            if (!geojson || !geojson.features) {
                geojson = await shpjs.parseZip(buffer);
            }
        } catch (e) {
            // Se fallisce come shapefile singolo, prova come archivio zip
            try {
                geojson = await shpjs.parseZip(buffer);
            } catch (zipError) {
                throw new Error("Impossibile elaborare il file come shapefile o archivio zip.");
            }
        }
        
        // Verifica se abbiamo ottenuto un GeoJSON valido
        if (!geojson) {
            throw new Error("Nessun dato valido trovato nel file shapefile.");
        }
        
        // Rimuovi l'indicatore di caricamento
        this._hideLoadingMessage();
        
        // Aggiungi il GeoJSON alla mappa
        this._addGeoJSONToMap(geojson, layerName);
    } catch (error) {
        this._hideLoadingMessage();
        console.error("Errore nell'elaborazione dello shapefile:", error);
        this._showMessage(`Errore nell'elaborazione dello shapefile: ${error.message}`, 'error');
    }
}

/**
     * Mostra un messaggio di caricamento
     */
_showLoadingMessage(message) {
    let loadingElement = document.querySelector('.vector-layer-loading');
    
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'vector-layer-message info vector-layer-loading';
        
        const spinner = document.createElement('span');
        spinner.className = 'vector-loading-indicator';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        
        loadingElement.appendChild(spinner);
        loadingElement.appendChild(textSpan);
        
        document.body.appendChild(loadingElement);
    } else {
        const textSpan = loadingElement.querySelector('span:not(.vector-loading-indicator)');
        if (textSpan) {
            textSpan.textContent = message;
        }
    }
    
    loadingElement.style.opacity = '1';
}
    
/**
     * Nasconde il messaggio di caricamento
     */
_hideLoadingMessage() {
    const loadingElement = document.querySelector('.vector-layer-loading');
    
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
            if (loadingElement.parentNode) {
                loadingElement.parentNode.removeChild(loadingElement);
            }
        }, 300);
    }
}
    
/**
     * Mostra un dialog per inserire un URL
     */
_promptURL() {
    this._showDialog({
        title: 'Carica da URL',
        fields: [
            {
                type: 'url',
                id: 'url',
                label: 'URL del file vettoriale',
                placeholder: 'https://example.com/data.geojson'
            },
            {
                type: 'text',
                id: 'name',
                label: 'Nome del layer',
                placeholder: 'Il mio layer'
            },
            {
                type: 'select',
                id: 'format',
                label: 'Formato',
                options: [
                    { value: 'geojson', label: 'GeoJSON' },
                    { value: 'csv', label: 'CSV' },
                    { value: 'gpx', label: 'GPX' },
                    { value: 'kml', label: 'KML' },
                    { value: 'shp', label: 'Shapefile' },
                    { value: 'zip', label: 'Shapefile (ZIP)' }
                ]
            }
        ],
        onConfirm: (values) => {
            if (!values.url) {
                this._showMessage('Inserisci un URL valido', 'error');
                return;
            }
            
            const layerName = values.name || `Layer ${++this._layerCount}`;
            this._loadFromURL(values.url, values.format, layerName);
        }
    });
}
    
/**
     * Carica dati da un URL
     */
_loadFromURL(url, format, layerName) {
    this._showMessage(`Caricamento di ${url}...`, 'info');
    
    // Per shapefile, dobbiamo usare arrayBuffer invece di text
    if (format === 'shp' || format === 'zip') {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore HTTP: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                this._processShapefile(buffer, layerName);
            })
            .catch(error => {
                console.error("Errore nel caricamento da URL:", error);
                this._showMessage(`Errore nel caricamento: ${error.message}`, 'error');
            });
        return;
    }
    
    // Per gli altri formati, usiamo il metodo esistente
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(content => {
            switch(format) {
                case 'geojson':
                    const geojson = JSON.parse(content);
                    this._addGeoJSONToMap(geojson, layerName);
                    break;
                case 'csv':
                    this._parseCSV(content, layerName);
                    break;
                case 'gpx':
                    const gpxDoc = new DOMParser().parseFromString(content, 'text/xml');
                    const gpxGeoJSON = toGeoJSON.gpx(gpxDoc);
                    this._addGeoJSONToMap(gpxGeoJSON, layerName);
                    break;
                case 'kml':
                    const kmlDoc = new DOMParser().parseFromString(content, 'text/xml');
                    const kmlGeoJSON = toGeoJSON.kml(kmlDoc);
                    this._addGeoJSONToMap(kmlGeoJSON, layerName);
                    break;
            }
        })
        .catch(error => {
            console.error("Errore nel caricamento da URL:", error);
            this._showMessage(`Errore nel caricamento: ${error.message}`, 'error');
        });
}

/**
     * Rimuove un layer dalla mappa
     */
_removeLayer(index) {
    if (index < 0 || index >= this._addedLayers.length) return;
    
    const layer = this._addedLayers[index];
    const { sourceId, layerId, name } = layer;
    
    // Rimuovi i layer dalla mappa
    if (this._map.getLayer(`${layerId}-fill`)) {
        this._map.removeLayer(`${layerId}-fill`);
    }
    
    if (this._map.getLayer(`${layerId}-line`)) {
        this._map.removeLayer(`${layerId}-line`);
    }
    
    if (this._map.getLayer(`${layerId}-point`)) {
        this._map.removeLayer(`${layerId}-point`);
    }
    
    if (this._map.getLayer(layerId)) {
        this._map.removeLayer(layerId);
    }
    
    // Rimuovi la source
    if (this._map.getSource(sourceId)) {
        this._map.removeSource(sourceId);
    }
    
    // Rimuovi il layer dalla lista
    this._addedLayers.splice(index, 1);
    
    // Aggiorna il pannello dei layer se visibile
    this._updateLayerPanel();
    
    // Mostra messaggio
    this._showMessage(`Layer "${name}" rimosso con successo`, 'success');
}

/**
 * Analizza file CSV
 */
_parseCSV(csvContent, layerName) {
    Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                console.error('Errori nel parsing CSV:', results.errors);
                this._showMessage('Errore nel parsing del CSV', 'error');
                return;
            }
            
            const rows = results.data;
            if (rows.length === 0) {
                this._showMessage('Il CSV non contiene dati', 'error');
                return;
            }
            
            // Cerca automaticamente colonne lat/lon
            const firstRow = rows[0];
            const columns = Object.keys(firstRow);
            
            let latCol = columns.find(c => /^(lat|latitude|y)$/i.test(c));
            let lonCol = columns.find(c => /^(lon|lng|longitude|long|x)$/i.test(c));
            
            if (!latCol || !lonCol) {
                // Se non trova automaticamente, mostra un dialog per selezionare le colonne
                this._showCSVColumnDialog(rows, columns, layerName);
                return;
            }
            
            // Converti in GeoJSON
            const geojson = this._csvToGeoJSON(rows, lonCol, latCol);
            this._addGeoJSONToMap(geojson, layerName);
        }
    });
}

/**
     * Mostra un dialog per selezionare le colonne lat/lon in un CSV
     */
_showCSVColumnDialog(rows, columns, layerName) {
    const options = columns.map(col => ({ value: col, label: col }));
    
    this._showDialog({
        title: 'Seleziona le colonne geografiche',
        fields: [
            {
                type: 'select',
                id: 'latColumn',
                label: 'Colonna latitudine',
                options: options
            },
            {
                type: 'select',
                id: 'lonColumn',
                label: 'Colonna longitudine',
                options: options
            }
        ],
        onConfirm: (values) => {
            const geojson = this._csvToGeoJSON(rows, values.lonColumn, values.latColumn);
            this._addGeoJSONToMap(geojson, layerName);
        }
    });
}

/**
     * Converte CSV in GeoJSON
     */
_csvToGeoJSON(rows, lonColumn, latColumn) {
    const features = rows
        .filter(row => row[lonColumn] != null && row[latColumn] != null)
        .map(row => {
            const lon = parseFloat(row[lonColumn]);
            const lat = parseFloat(row[latColumn]);
            
            if (isNaN(lon) || isNaN(lat)) return null;
            
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat]
                },
                properties: { ...row }
            };
        })
        .filter(f => f !== null);
    
    return {
        type: 'FeatureCollection',
        features: features
    };
}

/**
     * Aggiunge GeoJSON alla mappa
     */
_addGeoJSONToMap(geojson, layerName) {
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        this._showMessage('Il file non contiene dati geografici validi', 'error');
        return;
    }
    
    const sourceId = `source-${layerName}`;
    const layerId = `layer-${layerName}`;
    
    // Verifica se il source esiste già
    if (this._map.getSource(sourceId)) {
        this._map.removeSource(sourceId);
    }
    
    // Aggiungi source
    this._map.addSource(sourceId, {
        type: 'geojson',
        data: geojson
    });

    // Determina il tipo di geometria principale
    const types = geojson.features.map(f => f.geometry?.type).filter(Boolean);
    const typeCounts = {};
    types.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    let mainType = Object.keys(typeCounts).reduce(
        (a, b) => typeCounts[a] > typeCounts[b] ? a : b, 
        'Point'  // Default a Point
    );
    
    const color = this._randomColor();
    
    // Aggiungi layer appropriato
    if (mainType.includes('Polygon')) {
        // Per poligoni aggiungi fill e stroke
        this._map.addLayer({
            id: `${layerId}-fill`,
            source: sourceId,
            type: 'fill',
            paint: {
                'fill-color': color,
                'fill-opacity': 0.5
            },
            layout: {
                'visibility': 'visible'
            }
        });
        
        this._map.addLayer({
            id: `${layerId}-line`,
            source: sourceId,
            type: 'line',
            paint: {
                'line-color': color,
                'line-width': 1.5
            },
            layout: {
                'visibility': 'visible'
            }
        });
    } else if (mainType.includes('LineString')) {
        // Per linee
        this._map.addLayer({
            id: `${layerId}-line`,
            source: sourceId,
            type: 'line',
            paint: {
                'line-color': color,
                'line-width': 2
            },
            layout: {
                'visibility': 'visible'
            }
        });
    } else {
        // Per punti
        this._map.addLayer({
            id: `${layerId}-point`,
            source: sourceId,
            type: 'circle',
            paint: {
                'circle-radius': 5,
                'circle-color': color,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    // Aggiungi popup per mostrare le proprietà al click
    this._addPopupToLayer(layerId, sourceId);
    
    // Aggiungi il layer alla lista
    this._addedLayers.push({
        sourceId,
        layerId,
        name: layerName,
        type: 'geojson',
        visible: true,
        color: color
    });

    // Mostra il pannello dei layer se non è già visibile
    if (!this._layerPanelVisible) {
        this._toggleLayerPanel();
    } else {
        // Altrimenti aggiornalo
        this._updateLayerPanel();
    }
    
    // Zoom sul layer
    try {
        const bbox = turf.bbox(geojson);
        this._map.fitBounds([
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]]
        ], { padding: 50 });
    } catch (e) {
        console.error('Errore nel calcolo del bounding box:', e);
    }
    
    this._showMessage(`Layer "${layerName}" aggiunto con successo`, 'success');
}

/**
     * Aggiunge popup al layer per mostrare le proprietà al click
     */
_addPopupToLayer(layerId, sourceId) {
    // Rimuovi eventuali listener precedenti
    this._map.off('click', `${layerId}-point`);
    this._map.off('click', `${layerId}-fill`);
    this._map.off('click', `${layerId}-line`);
    
    // Funzione per mostrare il popup
    const showPopup = (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const properties = feature.properties;
        
        if (!properties) return;
        
        // Crea HTML per le proprietà
        let html = '<div style="max-height: 200px; overflow-y: auto; font-family: \'Source Sans 3\', \'Helvetica Neue\', Arial, Helvetica, sans-serif;">';
        html += '<table style="border-collapse: collapse; width: 100%;">';
        
        Object.keys(properties).forEach(key => {
            if (key !== 'lat' && key !== 'lon' && key !== 'longitude' && key !== 'latitude') {
                html += `<tr>
                    <td style="padding: 4px; border-bottom: 1px solid #eee; font-weight: 500;">${key}</td>
                    <td style="padding: 4px; border-bottom: 1px solid #eee;">${properties[key]}</td>
                </tr>`;
            }
        });
        
        html += '</table></div>';
        
        // Mostra il popup
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(this._map);
    };

    // Aggiungi listener per ciascun tipo di geometria
    if (this._map.getLayer(`${layerId}-point`)) {
        this._map.on('click', `${layerId}-point`, showPopup);
        
        // Cambia il cursore quando si passa sopra
        this._map.on('mouseenter', `${layerId}-point`, () => {
            this._map.getCanvas().style.cursor = 'pointer';
        });
        
        this._map.on('mouseleave', `${layerId}-point`, () => {
            this._map.getCanvas().style.cursor = '';
        });
    }
    
    if (this._map.getLayer(`${layerId}-fill`)) {
        this._map.on('click', `${layerId}-fill`, showPopup);
        
        this._map.on('mouseenter', `${layerId}-fill`, () => {
            this._map.getCanvas().style.cursor = 'pointer';
        });
        
        this._map.on('mouseleave', `${layerId}-fill`, () => {
            this._map.getCanvas().style.cursor = '';
        });
    }
    
    if (this._map.getLayer(`${layerId}-line`)) {
        this._map.on('click', `${layerId}-line`, showPopup);
        
        this._map.on('mouseenter', `${layerId}-line`, () => {
            this._map.getCanvas().style.cursor = 'pointer';
        });
        
        this._map.on('mouseleave', `${layerId}-line`, () => {
            this._map.getCanvas().style.cursor = '';
        });
    }
}

/**
     * Mostra un dialog personalizzato
     */
_showDialog(options) {
    // Creare il backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'vector-layer-dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // Creare il dialog
    const dialog = document.createElement('div');
    dialog.className = 'vector-layer-dialog';
    
    // Titolo
    let content = `<h3>${options.title}</h3>`;
    
    // Campi
    options.fields.forEach(field => {
        content += `<div>
            <label for="${field.id}">${field.label}:</label>`;
            
        if (field.type === 'select') {
            content += `<select id="${field.id}">
                ${field.options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('')}
            </select>`;
        } else if (field.type === 'textarea') {
            content += `<textarea id="${field.id}" placeholder="${field.placeholder || ''}"></textarea>`;
        } else {
            content += `<input type="${field.type}" id="${field.id}" placeholder="${field.placeholder || ''}">`;
        }
        
        content += `</div>`;
    });
    
    // Pulsanti
    content += `<div class="vector-layer-dialog-buttons">
        <button class="cancel">Annulla</button>
        <button class="confirm">Conferma</button>
    </div>`;
    
    dialog.innerHTML = content;
    document.body.appendChild(dialog);
    
    // Gestione degli eventi
    const cancelBtn = dialog.querySelector('button.cancel');
    const confirmBtn = dialog.querySelector('button.confirm');
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        document.body.removeChild(backdrop);
    });
    
    confirmBtn.addEventListener('click', () => {
        const values = {};
        
        options.fields.forEach(field => {
            values[field.id] = dialog.querySelector(`#${field.id}`).value;
        });
        
        options.onConfirm(values);
        
        document.body.removeChild(dialog);
        document.body.removeChild(backdrop);
    });
}

/**
     * Crea un dialog personalizzato con HTML
     */
_createDialog(options) {
    // Creare il backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'vector-layer-dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // Creare il dialog
    const dialog = document.createElement('div');
    dialog.className = 'vector-layer-dialog';
    
    // Titolo e contenuto
    dialog.innerHTML = `
        <h3>${options.title}</h3>
        ${options.content}
    `;
    
    document.body.appendChild(dialog);
    
    return dialog;
}

/**
 * Genera un colore casuale
 */
_randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Mostra un messaggio
 */
_showMessage(message, type = 'info') {
    let messageElement = document.querySelector('.vector-layer-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = `vector-layer-message ${type}`;
        document.body.appendChild(messageElement);
    } else {
        messageElement.className = `vector-layer-message ${type}`;
    }
    
    messageElement.textContent = message;
    messageElement.style.opacity = '1';
    
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}
}

export default VectorLayerControl;