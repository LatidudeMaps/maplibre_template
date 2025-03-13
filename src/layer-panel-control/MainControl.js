import maplibregl from 'maplibre-gl';
import { addStyles } from '../vector-layer-control/UIComponents';
import { createLayerPanel, toggleLayerPanel } from './LayerPanel';

/**
 * Controllo per visualizzare e gestire il pannello dei layer
 */
class LayerPanelControl {
    constructor(options = {}) {
        this._map = null;
        this._container = null;
        this._layerPanel = null;
        this._layerPanelVisible = false;
        this._addedLayers = []; // Riferimento ai layer aggiunti
        this._dragOffset = { x: 0, y: 0 }; // Per il dragging del pannello
        this._options = {
            position: options.position || 'top-right'
        };

        // Ottieni il riferimento al VectorLayerControl se disponibile
        this._vectorLayerControlRef = options.vectorLayerControlRef || null;
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        // Creare il pulsante principale
        const button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon layer-panel-control';
        button.type = 'button';
        button.title = 'Gestisci layer';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 4.5L2 9.5L12 14.5L22 9.5L12 4.5Z" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M2 14.5L12 19.5L22 14.5" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
        
        // Al click del pulsante, mostra/nascondi il pannello dei layer
        button.addEventListener('click', () => {
            this._toggleLayerPanel();
        });
        
        this._container.appendChild(button);
        
        // Ottenere il riferimento ai layer aggiunti se il controllo VectorLayerControl è disponibile
        if (this._vectorLayerControlRef) {
            this._addedLayers = this._vectorLayerControlRef._addedLayers;
        } else {
            // Cerca il controllo VectorLayerControl nella mappa
            const controls = map._controls || [];
            for (const control of controls) {
                if (control instanceof VectorLayerControl) {
                    this._vectorLayerControlRef = control;
                    this._addedLayers = control._addedLayers;
                    break;
                }
            }
        }
        
        // Aggiungere stili CSS
        addStyles();
        this._addCustomStyles();
        
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
    
    // Metodo per aggiungere stili CSS specifici per il controllo
    _addCustomStyles() {
        if (!document.getElementById('layer-panel-control-styles')) {
            const style = document.createElement('style');
            style.id = 'layer-panel-control-styles';
            style.innerHTML = `
                .layer-panel-control {
                    background-image: none !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Metodo per creare il pannello dei layer
    _createLayerPanel() {
        const onToggleLayerVisibility = (layer, visible) => {
            if (this._vectorLayerControlRef) {
                this._vectorLayerControlRef._toggleLayerVisibility(layer, visible);
            } else {
                // Implementazione di fallback se non c'è il riferimento
                const mapLayer = this._map.getLayer(layer.layerId);
                if (mapLayer) {
                    this._map.setLayoutProperty(layer.layerId, 'visibility', visible ? 'visible' : 'none');
                    layer.visible = visible;
                }
            }
        };
        
        const onRemoveLayer = (index) => {
            if (this._vectorLayerControlRef) {
                this._vectorLayerControlRef._removeLayer(index);
            } else {
                // Implementazione di fallback se non c'è il riferimento
                const layer = this._addedLayers[index];
                if (layer) {
                    if (this._map.getLayer(layer.layerId)) {
                        this._map.removeLayer(layer.layerId);
                    }
                    if (this._map.getSource(layer.sourceId)) {
                        this._map.removeSource(layer.sourceId);
                    }
                    this._addedLayers.splice(index, 1);
                    this._updateLayerPanel();
                }
            }
        };
        
        this._layerPanel = createLayerPanel(
            this._layerPanelVisible,
            this._addedLayers,
            onToggleLayerVisibility,
            onRemoveLayer,
            () => this._toggleLayerPanel(),
            this._dragOffset
        );
    }
    
    // Metodo per aggiornare il pannello dei layer
    _updateLayerPanel() {
        if (this._layerPanelVisible) {
            this._createLayerPanel();
        }
    }
    
    // Metodo per mostrare/nascondere il pannello dei layer
    _toggleLayerPanel() {
        this._layerPanelVisible = !this._layerPanelVisible;
        toggleLayerPanel(this._layerPanelVisible, this._layerPanel, () => this._createLayerPanel());
    }
}

// Esporta il controllo
export default LayerPanelControl;

// Importa VectorLayerControl per la ricerca dinamica
import VectorLayerControl from '../vector-layer-control/MainControl';