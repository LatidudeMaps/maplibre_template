import toGeoJSON from '@mapbox/togeojson';
import shpjs from 'shpjs';
import * as Papa from 'papaparse';

/**
 * Gestisce il file locale selezionato
 * @param {File} file - Il file selezionato
 * @param {Array} supportedFormats - Formati supportati
 * @param {Function} addGeoJSONCallback - Callback per aggiungere GeoJSON alla mappa
 * @param {Function} parseCSVCallback - Callback per analizzare un file CSV
 * @param {Function} processShapefileCallback - Callback per elaborare uno shapefile
 * @param {Function} showMessageCallback - Callback per mostrare messaggi
 */
export function handleLocalFile(file, supportedFormats, addGeoJSONCallback, parseCSVCallback, processShapefileCallback, showMessageCallback) {
    const reader = new FileReader();
    const fileName = file.name;
    const extension = fileName.split('.').pop().toLowerCase();
    const layerName = fileName.split('.')[0] || `Layer (senza nome)`;
    
    // Gestione comune degli errori per tutti i tipi di file
    reader.onerror = (event) => {
        const error = event.target.error;
        console.error("Errore nella lettura del file:", error);
        
        let errorMessage = 'Errore nella lettura del file';
        
        // Messaggi specifici per diversi tipi di errori
        switch (error.code) {
            case error.NOT_FOUND_ERR:
                errorMessage = 'File non trovato';
                break;
            case error.SECURITY_ERR:
                errorMessage = 'Problema di sicurezza nell\'accesso al file';
                break;
            case error.ABORT_ERR:
                errorMessage = 'Operazione annullata';
                break;
            case error.NOT_READABLE_ERR:
                errorMessage = 'File non leggibile';
                break;
            case error.ENCODING_ERR:
                errorMessage = 'Errore di codifica';
                break;
        }
        
        showMessageCallback(errorMessage, 'error');
    };
    
    // Verifica se il formato del file è supportato
    if (!supportedFormats.includes(extension)) {
        showMessageCallback(`Formato ${extension} non supportato. Formati supportati: ${supportedFormats.join(', ')}`, 'error');
        return;
    }
    
    // Se è uno shapefile o un file zip, gestiamolo diversamente
    if (extension === 'shp' || extension === 'zip') {
        showMessageCallback("Caricamento dello shapefile in corso...", 'info');
        reader.onload = async (e) => {
            try {
                await processShapefileCallback(e.target.result, layerName);
            } catch (error) {
                console.error("Errore nell'elaborazione dello shapefile:", error);
                showMessageCallback(`Errore nell'elaborazione dello shapefile: ${error.message}`, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        return;
    }
    
    // Per gli altri formati (GeoJSON, CSV, GPX, KML), usiamo il reader di testo
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            
            switch(extension) {
                case 'geojson':
                case 'json':
                    try {
                        const geojson = JSON.parse(content);
                        addGeoJSONCallback(geojson, layerName);
                    } catch (jsonError) {
                        throw new Error(`Il file non contiene un JSON valido: ${jsonError.message}`);
                    }
                    break;
                case 'csv':
                    parseCSVCallback(content, layerName);
                    break;
                case 'gpx':
                    try {
                        const gpxDoc = new DOMParser().parseFromString(content, 'text/xml');
                        if (gpxDoc.getElementsByTagName('parsererror').length > 0) {
                            throw new Error('Formato GPX non valido');
                        }
                        const gpxGeoJSON = toGeoJSON.gpx(gpxDoc);
                        addGeoJSONCallback(gpxGeoJSON, layerName);
                    } catch (gpxError) {
                        throw new Error(`Errore nell'elaborazione del file GPX: ${gpxError.message}`);
                    }
                    break;
                case 'kml':
                    try {
                        const kmlDoc = new DOMParser().parseFromString(content, 'text/xml');
                        if (kmlDoc.getElementsByTagName('parsererror').length > 0) {
                            throw new Error('Formato KML non valido');
                        }
                        const kmlGeoJSON = toGeoJSON.kml(kmlDoc);
                        addGeoJSONCallback(kmlGeoJSON, layerName);
                    } catch (kmlError) {
                        throw new Error(`Errore nell'elaborazione del file KML: ${kmlError.message}`);
                    }
                    break;
                default:
                    showMessageCallback(`Formato ${extension} non supportato`, 'error');
            }
        } catch (error) {
            console.error(`Errore nell'elaborazione del file:`, error);
            showMessageCallback(`Errore nell'elaborazione del file: ${error.message}`, 'error');
        }
    };
    
    reader.readAsText(file);
}

/**
 * Carica dati da un URL
 * @param {string} url - URL del file da caricare
 * @param {string} format - Formato del file
 * @param {string} layerName - Nome del layer
 * @param {Function} addGeoJSONCallback - Callback per aggiungere GeoJSON alla mappa
 * @param {Function} parseCSVCallback - Callback per analizzare un file CSV
 * @param {Function} processShapefileCallback - Callback per elaborare uno shapefile
 * @param {Function} showMessageCallback - Callback per mostrare messaggi
 * @param {Function} showLoadingMessageCallback - Callback per mostrare il messaggio di caricamento
 */
export function loadFromURL(
    url, 
    format, 
    layerName, 
    addGeoJSONCallback, 
    parseCSVCallback, 
    processShapefileCallback, 
    showMessageCallback,
    showLoadingMessageCallback
) {
    showMessageCallback(`Caricamento di ${url}...`, 'info');
    
    // Per shapefile, dobbiamo usare arrayBuffer invece di text
    if (format === 'shp' || format === 'zip') {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore HTTP: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(async (buffer) => {
                try {
                    await processShapefileCallback(buffer, layerName);
                } catch (error) {
                    console.error("Errore nell'elaborazione dello shapefile:", error);
                    showMessageCallback(`Errore nell'elaborazione dello shapefile: ${error.message}`, 'error');
                }
            })
            .catch(error => {
                console.error("Errore nel caricamento da URL:", error);
                showMessageCallback(`Errore nel caricamento: ${error.message}`, 'error');
            });
        return;
    }
    
    // Per gli altri formati
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(content => {
            try {
                switch(format) {
                    case 'geojson':
                        const geojson = JSON.parse(content);
                        addGeoJSONCallback(geojson, layerName);
                        break;
                    case 'csv':
                        parseCSVCallback(content, layerName);
                        break;
                    case 'gpx':
                        const gpxDoc = new DOMParser().parseFromString(content, 'text/xml');
                        const gpxGeoJSON = toGeoJSON.gpx(gpxDoc);
                        addGeoJSONCallback(gpxGeoJSON, layerName);
                        break;
                    case 'kml':
                        const kmlDoc = new DOMParser().parseFromString(content, 'text/xml');
                        const kmlGeoJSON = toGeoJSON.kml(kmlDoc);
                        addGeoJSONCallback(kmlGeoJSON, layerName);
                        break;
                    default:
                        showMessageCallback(`Formato ${format} non supportato`, 'error');
                }
            } catch (error) {
                console.error("Errore nell'elaborazione del file:", error);
                showMessageCallback(`Errore nell'elaborazione del file: ${error.message}`, 'error');
            }
        })
        .catch(error => {
            console.error("Errore nel caricamento da URL:", error);
            showMessageCallback(`Errore nel caricamento: ${error.message}`, 'error');
        });
}

/**
 * Processa uno shapefile e lo converte in GeoJSON
 * @param {ArrayBuffer} buffer - Il contenuto del file shapefile
 * @param {string} layerName - Il nome da assegnare al layer
 * @param {Function} addGeoJSONCallback - Callback per aggiungere GeoJSON alla mappa
 * @param {Function} showLoadingMessageCallback - Callback per mostrare il messaggio di caricamento
 * @param {Function} hideLoadingMessageCallback - Callback per nascondere il messaggio di caricamento
 * @param {Function} showMessageCallback - Callback per mostrare messaggi
 */
export async function processShapefile(
    buffer, 
    layerName, 
    addGeoJSONCallback,
    showLoadingMessageCallback,
    hideLoadingMessageCallback,
    showMessageCallback
) {
    try {
        // Mostra un indicatore di caricamento
        showLoadingMessageCallback("Elaborazione dello shapefile in corso...");
        
        // Determina se stiamo lavorando con un file .shp o .zip
        const isZip = isZipBuffer(buffer);
        
        let geojson;
        
        if (isZip) {
            // Per i file ZIP dobbiamo usare JSZip direttamente per evitare l'errore nodebuffer
            try {
                // Importiamo dinamicamente JSZip
                const JSZip = await import('jszip').then(module => module.default);
                const zip = new JSZip();
                
                // Carichiamo l'archivio ZIP
                const zipContent = await zip.loadAsync(buffer);
                
                // Cerchiamo i file .shp e .dbf nell'archivio
                let shpFile = null;
                let dbfFile = null;
                
                // Scan per i file necessari
                const files = Object.keys(zipContent.files);
                for (const filename of files) {
                    const lowerName = filename.toLowerCase();
                    if (lowerName.endsWith('.shp')) {
                        shpFile = { name: filename, content: await zipContent.files[filename].async('arraybuffer') };
                    } else if (lowerName.endsWith('.dbf')) {
                        dbfFile = { name: filename, content: await zipContent.files[filename].async('arraybuffer') };
                    }
                }
                
                if (!shpFile) {
                    throw new Error("Nessun file .shp trovato nell'archivio ZIP");
                }
                
                // Utilizziamo la funzione parseShp per il file .shp
                let features = await shpjs.parseShp(shpFile.content);
                
                // Se abbiamo anche un file .dbf, aggiungiamo gli attributi
                if (dbfFile) {
                    const attributes = await shpjs.parseDbf(dbfFile.content);
                    
                    // Combiniamo geometria e attributi
                    if (Array.isArray(features) && Array.isArray(attributes) && features.length === attributes.length) {
                        features = features.map((feature, i) => {
                            return {
                                ...feature,
                                properties: attributes[i]
                            };
                        });
                    }
                }
                
                // Validiamo le feature e filtriamo quelle non valide
                features = validateAndFixFeatures(features);
                
                // Creiamo il GeoJSON
                geojson = {
                    type: 'FeatureCollection',
                    features: features
                };
                
            } catch (zipError) {
                console.error("Errore nell'elaborazione del file ZIP:", zipError);
                throw new Error("Impossibile elaborare il file ZIP: " + zipError.message);
            }
        } else {
            // Se non è un archivio zip, tentiamo di elaborarlo come shapefile singolo
            try {
                let features = await shpjs.parseShp(buffer);
                
                // Validiamo le feature e filtriamo quelle non valide
                features = validateAndFixFeatures(features);
                
                // Creiamo il GeoJSON
                geojson = {
                    type: 'FeatureCollection',
                    features: features
                };
            } catch (shpError) {
                console.error("Errore nell'elaborazione del file SHP:", shpError);
                throw new Error("Impossibile elaborare il file come shapefile: " + shpError.message);
            }
        }
        
        // Verifica se abbiamo ottenuto un GeoJSON valido
        if (!geojson || !geojson.features || geojson.features.length === 0) {
            throw new Error("Nessun dato valido trovato nel file shapefile.");
        }
        
        // Rimuovi l'indicatore di caricamento
        hideLoadingMessageCallback();
        
        // Aggiungi il GeoJSON alla mappa
        addGeoJSONCallback(geojson, layerName);
    } catch (error) {
        hideLoadingMessageCallback();
        console.error("Errore nell'elaborazione dello shapefile:", error);
        showMessageCallback(`Errore nell'elaborazione dello shapefile: ${error.message}`, 'error');
    }
}

/**
 * Valida e corregge le feature GeoJSON per assicurarsi che siano valide
 * @param {Array} features - Array di feature GeoJSON
 * @returns {Array} - Array di feature valide
 */
export function validateAndFixFeatures(features) {
    if (!Array.isArray(features)) {
        return [];
    }
    
    return features.filter(feature => {
        // Verifica che la feature abbia una geometria
        if (!feature || !feature.geometry) {
            return false;
        }
        
        // Verifica che la geometria abbia un tipo valido
        const validTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
        if (!feature.geometry.type || !validTypes.includes(feature.geometry.type)) {
            return false;
        }
        
        // Verifica che ci siano coordinate valide
        if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
            return false;
        }
        
        // Verifica specifiche per ogni tipo di geometria
        switch (feature.geometry.type) {
            case 'Point':
                return Array.isArray(feature.geometry.coordinates) && 
                       feature.geometry.coordinates.length >= 2 &&
                       feature.geometry.coordinates.every(coord => typeof coord === 'number');
                
            case 'MultiPoint':
            case 'LineString':
                return Array.isArray(feature.geometry.coordinates) && 
                       feature.geometry.coordinates.length > 0 &&
                       feature.geometry.coordinates.every(coord => 
                           Array.isArray(coord) && coord.length >= 2 && coord.every(c => typeof c === 'number')
                       );
                
            case 'MultiLineString':
            case 'Polygon':
                return Array.isArray(feature.geometry.coordinates) && 
                       feature.geometry.coordinates.length > 0 &&
                       feature.geometry.coordinates.every(ring => 
                           Array.isArray(ring) && ring.length > 0 && 
                           ring.every(coord => Array.isArray(coord) && coord.length >= 2 && coord.every(c => typeof c === 'number'))
                       );
                
            case 'MultiPolygon':
                return Array.isArray(feature.geometry.coordinates) && 
                       feature.geometry.coordinates.length > 0 &&
                       feature.geometry.coordinates.every(polygon => 
                           Array.isArray(polygon) && polygon.length > 0 &&
                           polygon.every(ring => 
                               Array.isArray(ring) && ring.length > 0 && 
                               ring.every(coord => Array.isArray(coord) && coord.length >= 2 && coord.every(c => typeof c === 'number'))
                           )
                       );
                
            default:
                return false;
        }
    });
}

/**
 * Verifica se un ArrayBuffer contiene un file ZIP
 * @param {ArrayBuffer} buffer - Il buffer da verificare
 * @returns {boolean} - true se il buffer contiene un file ZIP
 */
export function isZipBuffer(buffer) {
    // Verifica la firma (magic number) del file ZIP: 0x50 0x4B 0x03 0x04
    const bytes = new Uint8Array(buffer.slice(0, 4));
    return bytes[0] === 0x50 && 
           bytes[1] === 0x4B && 
           bytes[2] === 0x03 && 
           bytes[3] === 0x04;
}

/**
 * Verifica se un ArrayBuffer contiene un file Shapefile
 * @param {ArrayBuffer} buffer - Il buffer da verificare
 * @returns {boolean} - true se il buffer contiene un file Shapefile
 */
export function isShpBuffer(buffer) {
    // Controlla la firma del file Shapefile (Magic number: 0x0000270a in big endian)
    const view = new DataView(buffer);
    const fileCode = view.getInt32(0, false); // false = big endian
    return fileCode === 9994; // 0x0000270a in decimale
}

/**
 * Converte CSV in GeoJSON
 * @param {Array} rows - Righe del CSV
 * @param {string} lonColumn - Nome della colonna longitudine
 * @param {string} latColumn - Nome della colonna latitudine
 * @returns {Object} - GeoJSON
 */
export function csvToGeoJSON(rows, lonColumn, latColumn) {
    const features = rows
        .filter(row => row[lonColumn] != null && row[latColumn] != null)
        .map(row => {
            const lon = parseFloat(row[lonColumn]);
            const lat = parseFloat(row[latColumn]);
            
            if (isNaN(lon) || isNaN(lat)) return null;
            
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat]
                },
                properties: { ...row }
            };
        })
        .filter(f => f !== null);
    
    return {
        type: 'FeatureCollection',
        features: features
    };
}