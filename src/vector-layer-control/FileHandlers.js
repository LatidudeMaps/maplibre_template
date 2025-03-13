import toGeoJSON from '@mapbox/togeojson';
import shpjs from 'shpjs';
import * as Papa from 'papaparse';
import JSZip from 'jszip';

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
 * Decodifica un file DBF
 * @param {ArrayBuffer} buffer - Il contenuto del file DBF
 * @returns {Promise<Array>} - Array di oggetti con gli attributi
 */
async function parseDbf(buffer) {
    try {
        const attributes = await shpjs.parseDbf(buffer);
        return attributes;
    } catch (error) {
        console.error("Errore nel parsing del file DBF:", error);
        throw error;
    }
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
            console.log("File ZIP rilevato, estrazione dei file...");
            try {
                // Carica l'archivio ZIP
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(buffer);
                
                // Estrai i nomi dei file a scopo di debug
                const fileNames = Object.keys(zipContent.files).join(", ");
                console.log("File trovati nello ZIP:", fileNames);
                
                // Raccogli tutti i file necessari per uno shapefile completo
                let shpFile = null;
                let dbfFile = null;
                
                // Cerca i file .shp e .dbf
                for (const filename of Object.keys(zipContent.files)) {
                    if (zipContent.files[filename].dir) continue;
                    
                    const lowerName = filename.toLowerCase();
                    if (lowerName.endsWith('.shp')) {
                        console.log("File SHP trovato:", filename);
                        shpFile = {
                            name: filename,
                            content: await zipContent.files[filename].async('arraybuffer')
                        };
                    } else if (lowerName.endsWith('.dbf')) {
                        console.log("File DBF trovato:", filename);
                        dbfFile = {
                            name: filename,
                            content: await zipContent.files[filename].async('arraybuffer')
                        };
                    }
                }
                
                if (!shpFile) {
                    throw new Error("Nessun file .shp trovato nell'archivio ZIP");
                }
                
                // Elabora il file .shp
                console.log("Elaborazione geometria dal file .shp...");
                let geomFeatures;
                try {
                    geomFeatures = await shpjs.parseShp(shpFile.content);
                    console.log("Geometrie estratte con successo:", geomFeatures.length);
                } catch (shpError) {
                    console.error("Errore nell'elaborazione del file .shp:", shpError);
                    throw new Error("Impossibile estrarre le geometrie dal file .shp: " + shpError.message);
                }
                
                // Se abbiamo un file DBF, estrai gli attributi
                let attributes = [];
                if (dbfFile) {
                    console.log("Elaborazione attributi dal file .dbf...");
                    try {
                        attributes = await parseDbf(dbfFile.content);
                        console.log("Attributi estratti con successo:", attributes.length);
                    } catch (dbfError) {
                        console.error("Errore nell'elaborazione del file .dbf:", dbfError);
                        // Non blocchiamo tutto, ma notiamo l'errore
                        console.warn("Gli attributi non saranno disponibili nelle feature");
                    }
                }
                
                // Combina geometrie e attributi
                console.log("Combinazione geometrie e attributi...");
                let features = [];
                
                if (Array.isArray(geomFeatures) && geomFeatures.length > 0) {
                    // Se abbiamo attributi in numero uguale alle geometrie, combiniamoli
                    if (Array.isArray(attributes) && attributes.length === geomFeatures.length) {
                        features = geomFeatures.map((geom, index) => {
                            return {
                                type: 'Feature',
                                geometry: geom,
                                properties: attributes[index] || {}
                            };
                        });
                        console.log("Geometrie e attributi combinati con successo");
                    } else {
                        // Altrimenti, usiamo solo le geometrie
                        features = geomFeatures.map(geom => {
                            return {
                                type: 'Feature',
                                geometry: geom,
                                properties: {}
                            };
                        });
                        console.log("Solo geometrie utilizzate (attributi mancanti o non corrispondenti)");
                    }
                } else {
                    throw new Error("Nessuna geometria valida trovata nel file .shp");
                }
                
                // Crea il GeoJSON
                geojson = {
                    type: 'FeatureCollection',
                    features: features
                };
                
                console.log("GeoJSON creato con successo:", features.length, "feature");
                
            } catch (zipError) {
                console.error("Errore nell'elaborazione del file ZIP:", zipError);
                throw new Error("Impossibile elaborare l'archivio ZIP: " + zipError.message);
            }
        } else {
            // Elabora un file .shp singolo
            console.log("Elaborazione file .shp singolo...");
            try {
                let features = await shpjs.parseShp(buffer);
                
                if (!features || features.length === 0) {
                    throw new Error("Nessun dato trovato nel file .shp");
                }
                
                // Converti le geometrie in feature GeoJSON
                features = features.map(geom => ({
                    type: 'Feature',
                    geometry: geom,
                    properties: {}
                }));
                
                // Crea il GeoJSON
                geojson = {
                    type: 'FeatureCollection',
                    features: features
                };
                
                console.log("Shapefile (.shp) elaborato con successo:", features.length, "feature");
                
            } catch (shpError) {
                console.error("Errore nell'elaborazione del file .shp:", shpError);
                throw new Error("Impossibile elaborare il file shapefile: " + shpError.message);
            }
        }
        
        // Valida e correggi le feature
        if (geojson && geojson.features) {
            geojson.features = validateAndFixFeatures(geojson.features);
            
            if (!geojson.features || geojson.features.length === 0) {
                throw new Error("Nessuna feature valida trovata dopo la validazione");
            }
        } else {
            throw new Error("GeoJSON non valido generato dall'elaborazione");
        }
        
        // Rimuovi l'indicatore di caricamento
        hideLoadingMessageCallback();
        
        // Aggiungi il GeoJSON alla mappa
        addGeoJSONCallback(geojson, layerName);
    } catch (error) {
        hideLoadingMessageCallback();
        console.error("Errore finale nell'elaborazione dello shapefile:", error);
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
        console.warn("validateAndFixFeatures: input non è un array", features);
        return [];
    }
    
    return features.filter(feature => {
        if (!feature) {
            console.warn("validateAndFixFeatures: feature è null o undefined");
            return false;
        }
        
        // Se la feature non ha type='Feature', verifichiamo se è direttamente una geometria
        if (feature.type !== 'Feature') {
            console.warn("validateAndFixFeatures: feature non ha type='Feature'", feature);
            
            // Se sembra una geometria valida, la convertiamo in Feature
            if (feature.type && feature.coordinates) {
                const validGeometryTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
                if (validGeometryTypes.includes(feature.type)) {
                    console.log("validateAndFixFeatures: convertita geometria in Feature", feature.type);
                    return {
                        type: 'Feature',
                        geometry: {
                            type: feature.type,
                            coordinates: feature.coordinates
                        },
                        properties: feature.properties || {}
                    };
                }
            }
            return false;
        }
        
        // Verifica che la feature abbia una geometria
        if (!feature.geometry) {
            console.warn("validateAndFixFeatures: feature senza geometria", feature);
            return false;
        }
        
        // Verifica che la geometria abbia un tipo valido
        const validTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
        if (!feature.geometry.type || !validTypes.includes(feature.geometry.type)) {
            console.warn("validateAndFixFeatures: tipo di geometria non valido", feature.geometry.type);
            return false;
        }
        
        // Verifica che ci siano coordinate valide
        if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
            console.warn("validateAndFixFeatures: coordinate non valide", feature.geometry.coordinates);
            return false;
        }
        
        // Assicura che le properties esistano
        if (!feature.properties) {
            feature.properties = {};
        }
        
        return true;
    });
}

/**
 * Verifica se un ArrayBuffer contiene un file ZIP
 * @param {ArrayBuffer} buffer - Il buffer da verificare
 * @returns {boolean} - true se il buffer contiene un file ZIP
 */
export function isZipBuffer(buffer) {
    if (!buffer || buffer.byteLength < 4) {
        return false;
    }
    // Verifica la firma (magic number) del file ZIP: 0x50 0x4B 0x03 0x04
    const bytes = new Uint8Array(buffer.slice(0, 4));
    return bytes[0] === 0x50 && 
           bytes[1] === 0x4B && 
           bytes[2] === 0x03 && 
           bytes[3] === 0x04;
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