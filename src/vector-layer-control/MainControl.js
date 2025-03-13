import maplibregl from 'maplibre-gl';
import { createLayerPanel, updateLayerPanel, toggleLayerPanel, makeDraggable } from './LayerPanel';
import { handleLocalFile, loadFromURL, processShapefile } from './FileHandlers';
import { showDialog, showMessage, showLoadingMessage, hideLoadingMessage, addStyles } from './UIComponents';
import { addGeoJSONToMap, removeLayer, toggleLayerVisibility, addPopupToLayer } from './MapUtils';
import { parseCSV } from './CSVHandler';

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
        addStyles();
        
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
    
    // Metodi wrappers che esportano il contesto
    _createLayerPanel() {
        this._layerPanel = createLayerPanel(
            this._layerPanelVisible, 
            this._addedLayers, 
            (layer, visible) => this._toggleLayerVisibility(layer, visible),
            (index) => this._removeLayer(index),
            () => this._toggleLayerPanel(),
            this._dragOffset
        );
    }
    
    _updateLayerPanel() {
        if (this._layerPanelVisible) {
            updateLayerPanel(this);
        }
    }
    
    _toggleLayerPanel() {
        this._layerPanelVisible = !this._layerPanelVisible;
        toggleLayerPanel(this._layerPanelVisible, this._layerPanel, () => this._createLayerPanel());
    }
    
    _toggleLayerVisibility(layer, visible) {
        toggleLayerVisibility(this._map, layer, visible);
    }
    
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
    
    _handleLocalFile(file) {
        handleLocalFile(
            file, 
            this._options.supportedFormats, 
            (geojson, layerName) => this._addGeoJSONToMap(geojson, layerName),
            (content, layerName) => parseCSV(content, layerName, (geojson, layerName) => this._addGeoJSONToMap(geojson, layerName), showMessage),
            (buffer, layerName) => processShapefile(
                buffer, 
                layerName, 
                (geojson, layerName) => this._addGeoJSONToMap(geojson, layerName),
                showLoadingMessage,
                hideLoadingMessage,
                showMessage
            ),
            showMessage
        );
    }
    
    _promptURL() {
        showDialog({
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
                    showMessage('Inserisci un URL valido', 'error');
                    return;
                }
                
                const layerName = values.name || `Layer ${++this._layerCount}`;
                this._loadFromURL(values.url, values.format, layerName);
            }
        });
    }
    
    _loadFromURL(url, format, layerName) {
        loadFromURL(
            url, 
            format, 
            layerName, 
            (geojson, layerName) => this._addGeoJSONToMap(geojson, layerName),
            (content, layerName) => parseCSV(content, layerName, (geojson, layerName) => this._addGeoJSONToMap(geojson, layerName), showMessage),
            (buffer, layerName) => processShapefile(
                buffer, 
                layerName, 
                (geojson, layerName) => this._addGeoJSONToMap(geojson, layerName),
                showLoadingMessage,
                hideLoadingMessage,
                showMessage
            ),
            showMessage,
            showLoadingMessage
        );
    }
    
    _removeLayer(index) {
        removeLayer(this._map, this._addedLayers, index, () => this._updateLayerPanel(), showMessage);
    }
    
    _addGeoJSONToMap(geojson, layerName) {
        addGeoJSONToMap(
            this._map, 
            geojson, 
            layerName, 
            this._addedLayers, 
            (layerId, sourceId) => this._addPopupToLayer(layerId, sourceId),
            () => {
                if (!this._layerPanelVisible) {
                    this._toggleLayerPanel();
                } else {
                    this._updateLayerPanel();
                }
            },
            showMessage
        );
    }
    
    _addPopupToLayer(layerId, sourceId) {
        addPopupToLayer(this._map, layerId, sourceId);
    }
}

export default VectorLayerControl;