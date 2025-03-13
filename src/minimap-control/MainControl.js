import * as maplibregl from "maplibre-gl";
import { THEME_CHANGE_EVENT } from '../ThemeToggle';
import { createUIElements, toggleMinimap, updateTheme } from './UIManager';
import { initMinimap, updateMinimap } from './MapRenderer';

/**
 * Controllo per visualizzare una minimappa in sovraimpressione.
 */
class MinimapControl {
    constructor(options = {}) {
        this._container = null;
        this._minimap = null;
        this._minimapCanvas = null;
        this._mainMap = null;
        this._width = options.width || 200;
        this._height = options.height || 200;
        this._zoomOffset = options.zoomOffset || 4;
        this._isVisible = true;
        this._themeHandler = this._updateTheme.bind(this);
    }

    /**
     * Metodo chiamato quando il controllo viene aggiunto alla mappa.
     * @param {Object} map - Istanza della mappa MapLibre
     * @returns {HTMLElement} Elemento DOM del controllo
     */
    onAdd(map) {
        this._mainMap = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl';
        this._container.style.backgroundColor = 'transparent';
        this._container.style.position = 'relative';
        
        // Crea gli elementi dell'interfaccia utente
        const { minimapWrapper, toggleButton, minimizeIcon, maximizeIcon } = createUIElements(
            this._width, 
            this._height
        );
        
        this._toggleButton = toggleButton;
        this._minimizeIcon = minimizeIcon;
        this._maximizeIcon = maximizeIcon;

        // Aggiungi il gestore per l'hover
        toggleButton.addEventListener('mouseover', () => {
            toggleButton.style.backgroundColor = document.body.classList.contains('dark') ? 
                '#444' : '#f0f0f0';
        });
        
        toggleButton.addEventListener('mouseout', () => {
            toggleButton.style.backgroundColor = document.body.classList.contains('dark') ? 
                '#333' : 'white';
        });

        // Aggiungi il gestore per il click
        toggleButton.addEventListener('click', () => {
            this._isVisible = toggleMinimap(
                this._isVisible, 
                minimapWrapper, 
                toggleButton, 
                this._minimizeIcon, 
                this._maximizeIcon
            );
        });

        // Ascolta l'evento personalizzato di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, this._themeHandler);
        
        // Inizializza il tema corretto
        this._updateTheme();

        this._container.appendChild(toggleButton);
        this._container.appendChild(minimapWrapper);
        
        if (map.loaded()) {
            this._initMinimap(minimapWrapper);
        } else {
            map.on('load', () => this._initMinimap(minimapWrapper));
        }

        return this._container;
    }

    /**
     * Aggiorna il tema degli elementi UI.
     */
    _updateTheme() {
        if (!this._toggleButton) return;
        updateTheme(this._toggleButton, document.body.classList.contains('dark'));
    }

    /**
     * Inizializza la minimappa.
     * @param {HTMLElement} container - Container della minimappa
     */
    _initMinimap(container) {
        const { minimap, minimapCanvas } = initMinimap(
            container,
            this._mainMap,
            this._width,
            this._height,
            this._zoomOffset
        );
        
        this._minimap = minimap;
        this._minimapCanvas = minimapCanvas;
        
        // Configura gli event listener
        this._minimap.on('load', () => {
            this._mainMap.on('move', this._updateMinimap.bind(this));
            this._mainMap.on('pitch', this._updateMinimap.bind(this));
            this._mainMap.on('rotate', this._updateMinimap.bind(this));
            this._updateMinimap();
        });
    }

    /**
     * Aggiorna la minimappa in base allo stato della mappa principale.
     */
    _updateMinimap() {
        if (!this._minimap || !this._mainMap) return;
        
        updateMinimap(
            this._mainMap,
            this._minimap,
            this._minimapCanvas,
            this._width,
            this._height,
            this._zoomOffset
        );
    }

    /**
     * Metodo chiamato quando il controllo viene rimosso dalla mappa.
     */
    onRemove() {
        // Rimuovi l'event listener del tema
        document.removeEventListener(THEME_CHANGE_EVENT, this._themeHandler);
        
        if (this._minimap) {
            this._minimap.remove();
        }
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._mainMap = null;
    }
}

export default MinimapControl;