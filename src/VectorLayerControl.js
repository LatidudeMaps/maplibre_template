import maplibregl from 'maplibre-gl';
import toGeoJSON from '@mapbox/togeojson';
import * as Papa from 'papaparse';
import * as turf from '@turf/turf';

/**
 * Controllo per aggiungere e rimuovere layer vettoriali alla mappa
 * Supporta i formati: GeoJSON, CSV, GPX, KML
 * Permette di caricare file da locale o da URL
 */
class VectorLayerControl {
    constructor(options = {}) {
        this._map = null;
        this._container = null;
        this._layerCount = 0;
        this._addedLayers = []; // Teniamo traccia dei layer aggiunti
        this._options = {
            position: options.position || 'top-right',
            supportedFormats: options.supportedFormats || ['csv', 'geojson', 'json', 'gpx', 'kml']
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
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
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
            { label: 'Gestisci layer', action: () => this._manageLayersDialog() }
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
            } else {
                dropdownMenu.style.display = 'none';
            }
        });
        
        // Chiudi il menu al click fuori
        document.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
        });
        
        // Aggiungi stili CSS
        this._addStyles();
        
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = null;
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
                .layer-empty {
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
                    background: #333;
                    color: white;
                }
                .dark .vector-layer-option:hover {
                    background-color: #444;
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
                    background-color: rgba(50, 50, 50, 0.9);
                    color: white;
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
                    background: #333;
                    color: white;
                }
                .vector-layer-dialog h3 {
                    margin-top: 0;
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
                    background: #444;
                    color: white;
                    border: 1px solid #555;
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
                    background: #555;
                    color: white;
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
                    border-color: #555;
                }
                .layer-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                }
                .dark .layer-item {
                    border-bottom-color: #444;
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
        input.accept = '.geojson,.json,.csv,.gpx,.kml';
        
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
                        { value: 'kml', label: 'KML' }
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
     * Mostra il dialog per gestire i layer aggiunti
     */
    _manageLayersDialog() {
        // Crea il contenuto HTML per la lista dei layer
        let layersHtml = '';
        
        if (this._addedLayers.length === 0) {
            layersHtml = '<div class="layer-empty">Nessun layer presente</div>';
        } else {
            this._addedLayers.forEach((layer, index) => {
                layersHtml += `
                    <div class="layer-item">
                        <span>${layer.name}</span>
                        <button data-index="${index}" class="remove-layer">Rimuovi</button>
                    </div>
                `;
            });
        }
        
        // Crea il dialog
        const dialog = this._createDialog({
            title: 'Gestisci layer',
            content: `
                <div class="layer-list">
                    ${layersHtml}
                </div>
                <div class="vector-layer-dialog-buttons">
                    <button class="cancel">Chiudi</button>
                </div>
            `
        });
        
        // Gestione eventi per i pulsanti di rimozione
        const removeButtons = dialog.querySelectorAll('.remove-layer');
        removeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                this._removeLayer(index);
                
                // Aggiorna il dialog con la lista aggiornata
                this._manageLayersDialog();
                
                // Chiudi il dialog corrente
                document.querySelector('.vector-layer-dialog-backdrop').remove();
                dialog.remove();
            });
        });
        
        // Gestione dell'evento per il pulsante "Chiudi"
        const closeButton = dialog.querySelector('button.cancel');
        closeButton.addEventListener('click', () => {
            document.querySelector('.vector-layer-dialog-backdrop').remove();
            dialog.remove();
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
                }
            });
            
            this._map.addLayer({
                id: `${layerId}-line`,
                source: sourceId,
                type: 'line',
                paint: {
                    'line-color': color,
                    'line-width': 1.5
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
            type: 'geojson'
        });
        
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