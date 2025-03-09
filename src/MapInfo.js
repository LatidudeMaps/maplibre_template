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
        this._panel.className = 'map-info-panel slide-in';
        this._panel.style.display = 'none';
        
        // Creiamo un container principale
        const mainContainer = document.createElement('div');
        mainContainer.className = 'map-info-main';
        
        // Sezione vista corrente (la più importante)
        const viewSection = document.createElement('div');
        viewSection.className = 'map-info-section map-view-section';
        
        // Valori principali in formato compatto
        const zoomValue = document.createElement('div');
        zoomValue.className = 'map-info-primary';
        zoomValue.innerHTML = '<span class="info-label">Zoom Level: </span><span id="zoom-value" class="zoom-value"></span>';
        
        const navigationValues = document.createElement('div');
        navigationValues.className = 'map-info-secondary';
        navigationValues.innerHTML = 
            '<div class="nav-item"><span class="info-label">Bearing: </span><span id="bearing-value" class="bearing-value"></span></div>' +
            '<div class="nav-item"><span class="info-label">Pitch: </span><span id="pitch-value" class="pitch-value"></span></div>';
            
        viewSection.appendChild(zoomValue);
        viewSection.appendChild(navigationValues);
        
        // Sezione coordinate (più tecnica)
        const coordSection = document.createElement('div');
        coordSection.className = 'map-info-section map-coords-section';
        
        const boundsLabel = document.createElement('div');
        boundsLabel.className = 'coords-label';
        boundsLabel.textContent = 'MAPVIEW BOUNDS';
        
        const coordsContainer = document.createElement('div');
        coordsContainer.className = 'coords-container';
        
        const swCoords = document.createElement('div');
        swCoords.className = 'coord-item';
        swCoords.innerHTML = '<span class="coord-label">SW</span><span id="sw-value" class="coord-value"></span>';
        
        const neCoords = document.createElement('div');
        neCoords.className = 'coord-item';
        neCoords.innerHTML = '<span class="coord-label">NE</span><span id="ne-value" class="coord-value"></span>';
        
        coordsContainer.appendChild(swCoords);
        coordsContainer.appendChild(neCoords);
        
        coordSection.appendChild(boundsLabel);
        coordSection.appendChild(coordsContainer);
        
        // Assembliamo il pannello
        mainContainer.appendChild(viewSection);
        mainContainer.appendChild(coordSection);
        this._panel.appendChild(mainContainer);
        
        // Update function
        const updateInfo = () => {
            const bounds = map.getBounds();
            const zoom = map.getZoom();
            const bearing = map.getBearing();
            const pitch = map.getPitch();
            
            // Aggiorna i valori
            document.getElementById('zoom-value').textContent = zoom.toFixed(2);
            document.getElementById('bearing-value').textContent = `${bearing.toFixed(1)}°`;
            document.getElementById('pitch-value').textContent = `${pitch.toFixed(1)}°`;
            
            document.getElementById('sw-value').textContent = 
                `${bounds.getWest().toFixed(4)}, ${bounds.getSouth().toFixed(4)}`;
            document.getElementById('ne-value').textContent = 
                `${bounds.getEast().toFixed(4)}, ${bounds.getNorth().toFixed(4)}`;
        };
        
        // Add click handler for toggle button
        this._button.addEventListener('click', () => {
            this._togglePanel();
        });
        
        // Add event listeners for all relevant map movements
        map.on('move', updateInfo);
        map.on('rotate', updateInfo);
        map.on('pitch', updateInfo);
        
        // Initial update
        setTimeout(updateInfo, 100);
        
        this._container.appendChild(this._button);
        this._container.appendChild(this._panel);
        
        return this._container;
    }

    _togglePanel() {
        if (this._panel.style.display === 'none') {
            this._panel.style.display = 'block';
            this._button.classList.add('active');
            this._panel.classList.add('fade-in');
        } else {
            this._panel.style.display = 'none';
            this._button.classList.remove('active');
            this._panel.classList.remove('fade-in');
        }
    }

    onRemove() {
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._map = null;
    }
}

export default MapInfoControl;