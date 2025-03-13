// import LayerControl from './LayerControl';
// import GeoInfoPanel from './GeoInfoPanel';
import MapInfoControl from './MapInfo';
// import ProfileControl from './ProfileControl.jsx';
// import GeologyOpacityControl from './GeologyOpacityControl';
import * as maplibregl from 'maplibre-gl';
import { THEME_CHANGE_EVENT } from './ThemeToggle';

class SettingsControl {
    constructor() {
        this._container = null;
        this._map = null;
        this._isExpanded = false;
        this._controls = [];
        this._controlsContainer = null;
        this._activeButtons = new Set();
        this._controlStates = new Map();
    }

    onAdd(map) {
        this._map = map;
        
        // Create main container
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this._container.style.position = 'relative';
        
        // Create toggle button
        this._button = document.createElement('button');
        this._button.type = 'button';
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-settings';
        this._button.setAttribute('title', 'Show all commands');
        
        // Create controls container
        this._controlsContainer = document.createElement('div');
        this._controlsContainer.className = 'settings-controls-container';
        this._controlsContainer.style.position = 'absolute';
        this._controlsContainer.style.right = '0';
        this._controlsContainer.style.top = '100%';
        this._controlsContainer.style.marginTop = '5px'; // Ridotto da 10px a 5px
        this._controlsContainer.style.display = 'flex';
        this._controlsContainer.style.flexDirection = 'column';
        // this._controlsContainer.style.gap = '5px';
        this._controlsContainer.style.zIndex = '1';
        this._controlsContainer.style.visibility = 'hidden';
        this._controlsContainer.style.opacity = '0';
        this._controlsContainer.style.transform = 'translateY(-5px)'; // Ridotto da -10px a -5px
        this._controlsContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Add click handler for main settings button
        this._button.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleControls();
        });
        
        // Add click handler to close settings panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!this._container.contains(e.target) && 
                !e.target.closest('.maplibregl-canvas-container') && 
                this._isExpanded) {
                this._hideControls();
            }
        });
        
        // Ascolto l'evento personalizzato di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, () => {
            this._updateThemeStyles();
        });
        
        this._container.appendChild(this._button);
        this._container.appendChild(this._controlsContainer);
        
        this._addWrappedControls(map);
        
        return this._container;
    }

    _updateThemeStyles() {
        // Non dobbiamo fare niente, gli stili CSS gestiscono tutto
    }

    _addWrappedControls(map) {
        // Add the controls we want to wrap
        const controls = [
            // { instance: new LayerControl(), className: 'maplibregl-ctrl-layers' },
            // { instance: new GeologyOpacityControl(), className: 'maplibregl-ctrl-opacity' },
            // { instance: new GeoInfoPanel(), className: 'maplibregl-ctrl-inspect' },
            { instance: new MapInfoControl(), className: 'maplibregl-ctrl-zoom-info' },
            // { instance: new ProfileControl(), className: 'maplibregl-ctrl-profile' },
            { instance: new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true
            }), className: 'maplibregl-ctrl-geolocate' },
            { instance: new maplibregl.FullscreenControl(), className: 'maplibregl-ctrl-fullscreen' },
            { instance: new maplibregl.TerrainControl({
                source: 'terrain-source',
                exaggeration: 0.05
            }), className: 'maplibregl-ctrl-terrain' },
        ];

        controls.forEach(control => {
            const controlContainer = control.instance.onAdd(map);
            controlContainer.style.position = 'relative';
            controlContainer.style.marginBottom = '5px';
            controlContainer.style.display = 'block';
            
            // Correggiamo la dimensione per tutti i controlli
            if (controlContainer.classList.contains('maplibregl-ctrl-group')) {
                controlContainer.style.margin = '0';
            }

            // Find the button and associated panel within the control container
            const button = controlContainer.querySelector('button');
            const panel = controlContainer.querySelector('div:not(button)');

            if (button && panel) {
                // Initialize control state
                this._controlStates.set(button, {
                    panel: panel,
                    isActive: false,
                    className: control.className
                });

                // Add click handler for tracking active state
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._toggleControlState(button);
                });
            }

            this._controlsContainer.appendChild(controlContainer);
            this._controls.push(control.instance);
        });
    }

    _toggleControlState(button) {
        const state = this._controlStates.get(button);
        if (!state) return;

        // Toggle the current control
        state.isActive = !state.isActive;
        
        if (state.isActive) {
            button.classList.add('active');
            if (state.panel) {
                state.panel.style.display = 'block';
            }
        } else {
            button.classList.remove('active');
            if (state.panel) {
                state.panel.style.display = 'none';
            }
        }
    }

    _toggleControls() {
        if (this._isExpanded) {
            this._hideControls();
        } else {
            this._showControls();
        }
    }

    _showControls() {
        this._controlsContainer.style.visibility = 'visible';
        this._controlsContainer.style.opacity = '1';
        this._controlsContainer.style.transform = 'translateY(0)';
        this._button.classList.add('active');
        this._isExpanded = true;
    }

    _hideControls() {
        this._controlsContainer.style.opacity = '0';
        this._controlsContainer.style.transform = 'translateY(-5px)';  // Ridotto da -10px a -5px
        this._button.classList.remove('active');
        this._isExpanded = false;
        
        // When hiding the main controls, also hide all sub-panels and deactivate buttons
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
        // ma conserviamo il riferimento per poter cancellare il timeout se necessario
        this._hideTimeout = setTimeout(() => {
            if (!this._isExpanded) {
                this._controlsContainer.style.visibility = 'hidden';
            }
            this._hideTimeout = null;
        }, 300);
    }

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