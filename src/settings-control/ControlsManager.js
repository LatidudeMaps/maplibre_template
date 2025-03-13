import * as maplibregl from 'maplibre-gl';
import MapInfoControl from '../MapInfo';

/**
 * Aggiunge i controlli secondari al container
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {HTMLElement} container - Container dove aggiungere i controlli
 * @param {Map} controlStates - Mappa per memorizzare lo stato dei controlli
 * @returns {Array} Lista dei controlli aggiunti
 */
export function addWrappedControls(map, container, controlStates) {
    // Lista dei controlli da aggiungere
    const controls = [
        { instance: new MapInfoControl(), className: 'maplibregl-ctrl-zoom-info' },
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

    // Lista per memorizzare le istanze dei controlli
    const controlInstances = [];

    // Aggiunge ogni controllo al container
    controls.forEach(control => {
        const controlContainer = control.instance.onAdd(map);
        controlContainer.style.position = 'relative';
        controlContainer.style.marginBottom = '5px';
        controlContainer.style.display = 'block';
        
        // Corregge la dimensione per tutti i controlli
        if (controlContainer.classList.contains('maplibregl-ctrl-group')) {
            controlContainer.style.margin = '0';
        }

        // Trova il pulsante e il pannello associato nel container del controllo
        const button = controlContainer.querySelector('button');
        const panel = controlContainer.querySelector('div:not(button)');

        if (button && panel) {
            // Inizializza lo stato del controllo
            controlStates.set(button, {
                panel: panel,
                isActive: false,
                className: control.className
            });

            // Aggiunge l'event listener per il click sul pulsante
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleControlState(button, controlStates);
            });
        }

        // Aggiunge il container del controllo al container principale
        container.appendChild(controlContainer);
        // Memorizza l'istanza del controllo
        controlInstances.push(control.instance);
    });

    return controlInstances;
}

/**
 * Attiva/disattiva lo stato di un controllo
 * @param {HTMLElement} button - Pulsante del controllo
 * @param {Map} controlStates - Mappa con lo stato dei controlli
 */
export function toggleControlState(button, controlStates) {
    const state = controlStates.get(button);
    if (!state) return;

    // Attiva/disattiva il controllo corrente
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