import * as maplibregl from 'maplibre-gl';
import { THEME_CHANGE_EVENT } from '../ThemeToggle';
import { createControlsContainer, setupUIEvents } from './UIManager';
import { addWrappedControls, toggleControlState } from './ControlsManager';

/**
 * Controllo principale per le impostazioni dell'applicazione.
 * Aggrega diversi controlli in un unico pannello.
 */
class SettingsControl {
    constructor() {
        this._container = null;
        this._map = null;
        this._isExpanded = false;
        this._controls = [];
        this._controlsContainer = null;
        this._activeButtons = new Set();
        this._controlStates = new Map();
        this._hideTimeout = null;
    }

    /**
     * Metodo chiamato quando il controllo viene aggiunto alla mappa
     * @param {Object} map - Istanza della mappa MapLibre
     * @returns {HTMLElement} Elemento DOM del controllo
     */
    onAdd(map) {
        this._map = map;
        
        // Crea il container principale
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this._container.style.position = 'relative';
        
        // Crea il pulsante di toggle
        this._button = document.createElement('button');
        this._button.type = 'button';
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-settings';
        this._button.setAttribute('title', 'Show all commands');
        
        // Crea il container per i controlli
        this._controlsContainer = createControlsContainer();
        
        // Imposta gli event listener
        setupUIEvents(this);
        
        // Ascolta l'evento personalizzato di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, () => {
            this._updateThemeStyles();
        });
        
        this._container.appendChild(this._button);
        this._container.appendChild(this._controlsContainer);
        
        // Aggiunge i controlli secondari
        this._controls = addWrappedControls(map, this._controlsContainer, this._controlStates);
        
        return this._container;
    }

    /**
     * Aggiorna gli stili in base al tema
     */
    _updateThemeStyles() {
        // Gli stili CSS gestiscono tutto autonomamente
    }

    /**
     * Attiva/disattiva lo stato di un controllo
     * @param {HTMLElement} button - Pulsante del controllo
     */
    _toggleControlState(button) {
        toggleControlState(button, this._controlStates);
    }

    /**
     * Attiva/disattiva la visibilità del pannello dei controlli
     */
    _toggleControls() {
        if (this._isExpanded) {
            this._hideControls();
        } else {
            this._showControls();
        }
    }

    /**
     * Mostra il pannello dei controlli
     */
    _showControls() {
        this._controlsContainer.style.visibility = 'visible';
        this._controlsContainer.style.opacity = '1';
        this._controlsContainer.style.transform = 'translateY(0)';
        this._button.classList.add('active');
        this._isExpanded = true;
    }

    /**
     * Nasconde il pannello dei controlli
     */
    _hideControls() {
        this._controlsContainer.style.opacity = '0';
        this._controlsContainer.style.transform = 'translateY(-5px)';
        this._button.classList.remove('active');
        this._isExpanded = false;
        
        // Quando nascondiamo i controlli principali, nascondiamo anche tutti i pannelli secondari e disattiviamo i pulsanti
        this._controlStates.forEach((state, button) => {
            if (state.isActive) {
                state.isActive = false;
                button.classList.remove('active');
                if (state.panel) {
                    state.panel.style.display = 'none';
                }
            }
        });

        // Impostiamo un timeout per nascondere il container dopo l'animazione
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
        }
        
        this._hideTimeout = setTimeout(() => {
            if (!this._isExpanded) {
                this._controlsContainer.style.visibility = 'hidden';
            }
            this._hideTimeout = null;
        }, 300);
    }

    /**
     * Metodo chiamato quando il controllo viene rimosso dalla mappa
     */
    onRemove() {
        // Cancelliamo eventuali timeout pendenti
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
        }
        
        // Rimuoviamo gli event listener
        document.removeEventListener(THEME_CHANGE_EVENT, this._updateThemeStyles);
        
        // Rimuoviamo i controlli
        this._controls.forEach(control => {
            if (control.onRemove) {
                control.onRemove();
            }
        });

        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        
        this._map = null;
    }
}

export default SettingsControl;