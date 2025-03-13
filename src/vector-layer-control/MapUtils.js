import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';

/**
 * Aggiunge GeoJSON alla mappa
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} geojson - Oggetto GeoJSON
 * @param {string} layerName - Nome del layer
 * @param {Array} addedLayers - Lista dei layer aggiunti
 * @param {Function} addPopupCallback - Callback per aggiungere popup al layer
 * @param {Function} onLayerAddedCallback - Callback da eseguire dopo l'aggiunta del layer
 * @param {Function} showMessageCallback - Callback per mostrare messaggi
 */
export function addGeoJSONToMap(
    map, 
    geojson, 
    layerName, 
    addedLayers, 
    addPopupCallback, 
    onLayerAddedCallback,
    showMessageCallback
) {
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        showMessageCallback('Il file non contiene dati geografici validi', 'error');
        return;
    }
    
    // Assicuriamoci che tutte le feature abbiano geometrie valide
    const validFeatures = geojson.features.filter(f => 
        f && f.geometry && f.geometry.coordinates && 
        Array.isArray(f.geometry.coordinates) && 
        f.geometry.coordinates.length > 0
    );
    
    if (validFeatures.length === 0) {
        showMessageCallback('Il file non contiene geometrie valide', 'error');
        return;
    }
    
    // Aggiorna il geojson per includere solo feature valide
    geojson.features = validFeatures;
    
    const sourceId = `source-${layerName}`;
    const layerId = `layer-${layerName}`;
    
    // Verifica se il source esiste già
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
    
    // Aggiungi source
    map.addSource(sourceId, {
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
    
    const color = randomColor();
    
    // Aggiungi layer appropriato
    if (mainType.includes('Polygon')) {
        // Per poligoni aggiungi fill e stroke
        map.addLayer({
            id: `${layerId}-fill`,
            source: sourceId,
            type: 'fill',
            paint: {
                'fill-color': color,
                'fill-opacity': 0.5
            },
            layout: {
                'visibility': 'visible'
            }
        });
        
        map.addLayer({
            id: `${layerId}-line`,
            source: sourceId,
            type: 'line',
            paint: {
                'line-color': color,
                'line-width': 1.5
            },
            layout: {
                'visibility': 'visible'
            }
        });
    } else if (mainType.includes('LineString')) {
        // Per linee
        map.addLayer({
            id: `${layerId}-line`,
            source: sourceId,
            type: 'line',
            paint: {
                'line-color': color,
                'line-width': 2
            },
            layout: {
                'visibility': 'visible'
            }
        });
    } else {
        // Per punti
        map.addLayer({
            id: `${layerId}-point`,
            source: sourceId,
            type: 'circle',
            paint: {
                'circle-radius': 5,
                'circle-color': color,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    // Aggiungi popup per mostrare le proprietà al click
    addPopupCallback(layerId, sourceId);
    
    // Aggiungi il layer alla lista
    addedLayers.push({
        sourceId,
        layerId,
        name: layerName,
        type: 'geojson',
        visible: true,
        color: color
    });

    // Notifica che il layer è stato aggiunto
    onLayerAddedCallback();
    
    // Zoom sul layer
    try {
        // Cerchiamo di calcolare manualmente un bounding box se turf fallisce
        let bbox;
        
        try {
            bbox = turf.bbox(geojson);
        } catch (e) {
            // Calcoliamo manualmente il bounding box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            // Iteriamo attraverso tutte le coordinate di tutte le feature
            const processCoordinates = (coords) => {
                if (!Array.isArray(coords)) return;
                
                if (Array.isArray(coords[0])) {
                    // Array annidato di coordinate
                    coords.forEach(processCoordinates);
                } else if (coords.length >= 2) {
                    // Singola coordinata [lng, lat]
                    const [x, y] = coords;
                    if (typeof x === 'number' && typeof y === 'number') {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            };
            
            // Processiamo tutte le feature
            geojson.features.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    processCoordinates(feature.geometry.coordinates);
                }
            });
            
            // Verifichiamo che abbiamo trovato coordinate valide
            if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
                bbox = [minX, minY, maxX, maxY];
            } else {
                throw new Error("Impossibile calcolare il bounding box");
            }
        }
        
        // Verifichiamo che bbox sia valido prima di fare il fit
        if (bbox && Array.isArray(bbox) && bbox.length === 4 && 
            !bbox.some(coord => isNaN(coord) || !isFinite(coord))) {
            map.fitBounds([
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ], { padding: 50 });
        } else {
            console.warn("Bounding box non valido, impossibile fare il fit");
        }
    } catch (e) {
        console.error('Errore nel calcolo del bounding box:', e);
        // Non interrompiamo l'importazione se il calcolo del bounding box fallisce
    }
    
    showMessageCallback(`Layer "${layerName}" aggiunto con successo`, 'success');
}

/**
 * Aggiunge popup al layer per mostrare le proprietà al click
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {string} layerId - ID del layer
 * @param {string} sourceId - ID della source
 */
export function addPopupToLayer(map, layerId, sourceId) {
    // Rimuovi eventuali listener precedenti
    map.off('click', `${layerId}-point`);
    map.off('click', `${layerId}-fill`);
    map.off('click', `${layerId}-line`);
    
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
            .addTo(map);
    };

    // Aggiungi listener per ciascun tipo di geometria
    if (map.getLayer(`${layerId}-point`)) {
        map.on('click', `${layerId}-point`, showPopup);
        
        // Cambia il cursore quando si passa sopra
        map.on('mouseenter', `${layerId}-point`, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', `${layerId}-point`, () => {
            map.getCanvas().style.cursor = '';
        });
    }
    
    if (map.getLayer(`${layerId}-fill`)) {
        map.on('click', `${layerId}-fill`, showPopup);
        
        map.on('mouseenter', `${layerId}-fill`, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', `${layerId}-fill`, () => {
            map.getCanvas().style.cursor = '';
        });
    }
    
    if (map.getLayer(`${layerId}-line`)) {
        map.on('click', `${layerId}-line`, showPopup);
        
        map.on('mouseenter', `${layerId}-line`, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', `${layerId}-line`, () => {
            map.getCanvas().style.cursor = '';
        });
    }
}

/**
 * Attiva/disattiva la visibilità di un layer
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Object} layer - Layer da attivare/disattivare
 * @param {boolean} visible - Visibilità del layer
 */
export function toggleLayerVisibility(map, layer, visible) {
    const visibility = visible ? 'visible' : 'none';
    
    // Aggiorna la visibilità di tutti i sublayer
    if (map.getLayer(`${layer.layerId}-fill`)) {
        map.setLayoutProperty(`${layer.layerId}-fill`, 'visibility', visibility);
    }
    
    if (map.getLayer(`${layer.layerId}-line`)) {
        map.setLayoutProperty(`${layer.layerId}-line`, 'visibility', visibility);
    }
    
    if (map.getLayer(`${layer.layerId}-point`)) {
        map.setLayoutProperty(`${layer.layerId}-point`, 'visibility', visibility);
    }
    
    if (map.getLayer(layer.layerId)) {
        map.setLayoutProperty(layer.layerId, 'visibility', visibility);
    }
    
    // Aggiorna lo stato del layer
    layer.visible = visible;
}

/**
 * Rimuove un layer dalla mappa
 * @param {Object} map - Istanza della mappa MapLibre
 * @param {Array} addedLayers - Lista dei layer aggiunti
 * @param {number} index - Indice del layer da rimuovere
 * @param {Function} updatePanelCallback - Callback per aggiornare il pannello dei layer
 * @param {Function} showMessageCallback - Callback per mostrare messaggi
 */
export function removeLayer(map, addedLayers, index, updatePanelCallback, showMessageCallback) {
    if (index < 0 || index >= addedLayers.length) return;
    
    const layer = addedLayers[index];
    const { sourceId, layerId, name } = layer;
    
    // Rimuovi i layer dalla mappa
    if (map.getLayer(`${layerId}-fill`)) {
        map.removeLayer(`${layerId}-fill`);
    }
    
    if (map.getLayer(`${layerId}-line`)) {
        map.removeLayer(`${layerId}-line`);
    }
    
    if (map.getLayer(`${layerId}-point`)) {
        map.removeLayer(`${layerId}-point`);
    }
    
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
    
    // Rimuovi la source
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
    
    // Rimuovi il layer dalla lista
    addedLayers.splice(index, 1);
    
    // Aggiorna il pannello dei layer
    updatePanelCallback();
    
    // Mostra messaggio
    showMessageCallback(`Layer "${name}" rimosso con successo`, 'success');
}

/**
 * Genera un colore casuale
 * @returns {string} - Colore in formato esadecimale
 */
export function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}