import { THEME_CHANGE_EVENT } from './ThemeToggle';

class MapInfoControl {
    constructor() {
        this._container = null;
        this._map = null;
        this._panel = null;
        this._button = null;
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        // Create toggle button
        this._button = document.createElement('button');
        this._button.type = 'button';
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-zoom-info';
        this._button.setAttribute('title', 'Show map coordinates and bounds');
        
        // Create info box
        this._panel = document.createElement('div');
        this._panel.className = 'map-info-panel';
        this._panel.style.display = 'none';
        
        // Create elements for each parameter
        const zoomInfo = document.createElement('div');
        const boundsInfo = document.createElement('div');
        const bearingInfo = document.createElement('div');
        const pitchInfo = document.createElement('div');
        
        this._panel.appendChild(zoomInfo);
        this._panel.appendChild(boundsInfo);
        this._panel.appendChild(bearingInfo);
        this._panel.appendChild(pitchInfo);
        
        // Update function
        const updateInfo = () => {
            const bounds = map.getBounds();
            
            zoomInfo.textContent = `Zoom: ${map.getZoom().toFixed(2)}`;
            boundsInfo.innerHTML = `Bounds:<br>` +
                `  SW: [${bounds.getWest().toFixed(4)}, ${bounds.getSouth().toFixed(4)}]<br>` +
                `  NE: [${bounds.getEast().toFixed(4)}, ${bounds.getNorth().toFixed(4)}]`;
            bearingInfo.textContent = `Bearing: ${map.getBearing().toFixed(1)}°`;
            pitchInfo.textContent = `Pitch: ${map.getPitch().toFixed(1)}°`;
        };
        
        // Add click handler for toggle button
        this._button.addEventListener('click', () => {
            this._togglePanel();
        });
        
        // Add event listeners for all relevant map movements
        map.on('move', updateInfo);
        map.on('rotate', updateInfo);
        map.on('pitch', updateInfo);
        
        // Ascolto l'evento personalizzato di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, () => {
            // Non è necessario fare nulla qui perché gli stili CSS gestiscono tutto
        });
        
        // Initial update
        updateInfo();
        
        this._container.appendChild(this._button);
        this._container.appendChild(this._panel);
        return this._container;
    }

    _togglePanel() {
        if (this._panel.style.display === 'none') {
            this._panel.style.display = 'block';
            this._button.classList.add('active');
        } else {
            this._panel.style.display = 'none';
            this._button.classList.remove('active');
        }
    }

    onRemove() {
        // Rimuovi event listener del tema
        document.removeEventListener(THEME_CHANGE_EVENT, () => {});
        
        // Rimuovi il container
        this._container.parentNode.removeChild(this._container);
        this._map = null;
    }
}

export default MapInfoControl;