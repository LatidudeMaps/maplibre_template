import maplibregl from 'maplibre-gl';
import { THEME_CHANGE_EVENT } from './ThemeToggle';

class FileLoaderControl {
    constructor(layerManager) {
        this._container = null;
        this._map = null;
        this._layerManager = layerManager;
        this._fileInput = null;
        this._supportedTypes = [
            { extension: 'geojson', mimeType: 'application/geo+json,application/json' },
            { extension: 'kml', mimeType: 'application/vnd.google-earth.kml+xml' },
            { extension: 'gpx', mimeType: 'application/gpx+xml' },
            { extension: 'csv', mimeType: 'text/csv' }
        ];
    }

    onAdd(map) {
        this._map = map;

        // Crea il container principale
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        // Imposta dimensioni specifiche per coerenza
        this._container.style.width = '30px';
        this._container.style.height = '30px';

        // Crea il pulsante di upload
        this._button = document.createElement('button');
        this._button.type = 'button';
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-file-loader';
        this._button.setAttribute('title', 'Carica file locali (GeoJSON, KML, GPX, CSV)');
        
        // Aggiungi un'icona SVG al pulsante (più coerente con gli altri controlli)
        this._button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
        `;

        // Crea il campo di input file nascosto
        this._fileInput = document.createElement('input');
        this._fileInput.type = 'file';
        this._fileInput.accept = this._supportedTypes.map(t => `.${t.extension},${t.mimeType}`).join(',');
        this._fileInput.style.display = 'none';

        // Gestione dell'evento di click sul pulsante
        this._button.addEventListener('click', () => {
            this._fileInput.click();
        });

        // Gestione dell'evento di cambio del file
        this._fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this._processFile(file);
            }
            // Reset del campo file per consentire di selezionare lo stesso file più volte
            this._fileInput.value = '';
        });

        // Ascolto dell'evento di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, () => {
            this._updateThemeStyles();
        });

        // Controllo iniziale del tema
        if (document.body.classList.contains('dark-theme')) {
            this._updateThemeStyles();
        }

        this._container.appendChild(this._button);
        this._container.appendChild(this._fileInput);

        return this._container;
    }

    _updateThemeStyles() {
        // Aggiunta esplicita dello stile per il tema scuro
        if (document.body.classList.contains('dark-theme')) {
            this._button.style.backgroundColor = 'var(--color-background-dark)';
            const svg = this._button.querySelector('svg');
            if (svg) {
                svg.style.stroke = 'var(--color-text-dark)';
            }
        } else {
            this._button.style.backgroundColor = 'var(--color-background-light)';
            const svg = this._button.querySelector('svg');
            if (svg) {
                svg.style.stroke = 'var(--color-text-light)';
            }
        }
    }

    _processFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            const fileContent = e.target.result;

            try {
                switch (fileExtension) {
                    case 'geojson':
                    case 'json':
                        this._processGeoJSON(fileContent, file.name);
                        break;
                    case 'kml':
                        this._processKML(fileContent, file.name);
                        break;
                    case 'gpx':
                        this._processGPX(fileContent, file.name);
                        break;
                    case 'csv':
                        this._processCSV(fileContent, file.name);
                        break;
                    default:
                        console.error('Formato file non supportato');
                        alert('Formato file non supportato. Si prega di caricare file GeoJSON, KML, GPX o CSV.');
                }
            } catch (error) {
                console.error('Errore durante l\'elaborazione del file:', error);
                alert(`Errore durante l'elaborazione del file: ${error.message}`);
            }
        };

        reader.onerror = () => {
            console.error('Errore durante la lettura del file');
            alert('Errore durante la lettura del file.');
        };

        reader.readAsText(file);
    }

    _processGeoJSON(content, fileName) {
        try {
            const data = JSON.parse(content);
            
            // Crea un ID univoco per il layer
            const layerId = `geojson-${Date.now()}`;
            
            // Aggiungi il layer alla mappa
            this._map.addSource(layerId, {
                type: 'geojson',
                data: data
            });

            // Determina il tipo di geometria nel GeoJSON
            let type = 'point';
            if (data.features && data.features.length > 0) {
                const firstFeature = data.features[0];
                if (firstFeature.geometry) {
                    if (firstFeature.geometry.type.includes('Polygon')) {
                        type = 'polygon';
                    } else if (firstFeature.geometry.type.includes('Line')) {
                        type = 'line';
                    }
                }
            }

            // Aggiungi lo stile appropriato in base al tipo
            if (type === 'polygon') {
                this._map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: layerId,
                    paint: {
                        'fill-color': this._getRandomColor(),
                        'fill-opacity': 0.6
                    }
                });
                
                // Notifica al LayerManager l'aggiunta di un nuovo layer
                this._layerManager.addLayer(layerId, fileName, 'polygon');
                
                // Aggiungiamo il layer di outline separatamente SOLO se necessario
                // Per ora lo commentiamo per evitare problemi con la rimozione
                /*
                this._map.addLayer({
                    id: `${layerId}-outline`,
                    type: 'line',
                    source: layerId,
                    paint: {
                        'line-color': this._getRandomColor(),
                        'line-width': 1
                    }
                });
                this._layerManager.addLayer(`${layerId}-outline`, `${fileName} (bordo)`, 'line', layerId);
                */
            } else if (type === 'line') {
                this._map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: {
                        'line-color': this._getRandomColor(),
                        'line-width': 3
                    }
                });
                
                // Notifica al LayerManager l'aggiunta di un nuovo layer
                this._layerManager.addLayer(layerId, fileName, 'line');
            } else {
                this._map.addLayer({
                    id: layerId,
                    type: 'circle',
                    source: layerId,
                    paint: {
                        'circle-radius': 6,
                        'circle-color': this._getRandomColor(),
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });
                
                // Notifica al LayerManager l'aggiunta di un nuovo layer
                this._layerManager.addLayer(layerId, fileName, 'point');
            }
            
            // Zoom all'estensione del dataset
            this._zoomToLayer(data);
            
        } catch (error) {
            console.error('Errore nel processo GeoJSON:', error);
            alert(`Errore durante l'elaborazione del GeoJSON: ${error.message}`);
        }
    }

    _processKML(content, fileName) {
        // Qui integrerei una libreria KML-to-GeoJSON
        alert('Supporto KML in implementazione. Per ora usa file GeoJSON.');
    }

    _processGPX(content, fileName) {
        // Qui integrerei una libreria GPX-to-GeoJSON
        alert('Supporto GPX in implementazione. Per ora usa file GeoJSON.');
    }

    _processCSV(content, fileName) {
        // Qui integrerei un parser CSV con supporto per coordinate
        alert('Supporto CSV in implementazione. Per ora usa file GeoJSON.');
    }

    _getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    _zoomToLayer(data) {
        if (!data || !data.features || data.features.length === 0) return;

        try {
            // Calcolo dei bounds
            let bounds = new maplibregl.LngLatBounds();
            
            data.features.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    if (feature.geometry.type === 'Point') {
                        bounds.extend(feature.geometry.coordinates);
                    } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiPoint') {
                        feature.geometry.coordinates.forEach(coord => {
                            bounds.extend(coord);
                        });
                    } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
                        feature.geometry.coordinates.forEach(ring => {
                            ring.forEach(coord => {
                                bounds.extend(coord);
                            });
                        });
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(polygon => {
                            polygon.forEach(ring => {
                                ring.forEach(coord => {
                                    bounds.extend(coord);
                                });
                            });
                        });
                    }
                }
            });

            if (!bounds.isEmpty()) {
                this._map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15
                });
            }
        } catch (error) {
            console.error('Errore nel calcolo dei bounds:', error);
        }
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        document.removeEventListener(THEME_CHANGE_EVENT, this._updateThemeStyles);
        this._map = null;
    }
}

export default FileLoaderControl;