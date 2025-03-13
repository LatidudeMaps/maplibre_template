import * as Papa from 'papaparse';
import { showDialog } from './UIComponents';
import { csvToGeoJSON } from './FileHandlers';

/**
 * Analizza file CSV
 * @param {string} csvContent - Contenuto del file CSV
 * @param {string} layerName - Nome del layer
 * @param {Function} addGeoJSONCallback - Callback per aggiungere GeoJSON alla mappa
 * @param {Function} showMessageCallback - Callback per mostrare messaggi
 */
export function parseCSV(csvContent, layerName, addGeoJSONCallback, showMessageCallback) {
    Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                console.error('Errori nel parsing CSV:', results.errors);
                showMessageCallback('Errore nel parsing del CSV', 'error');
                return;
            }
            
            const rows = results.data;
            if (rows.length === 0) {
                showMessageCallback('Il CSV non contiene dati', 'error');
                return;
            }
            
            // Cerca automaticamente colonne lat/lon
            const firstRow = rows[0];
            const columns = Object.keys(firstRow);
            
            let latCol = columns.find(c => /^(lat|latitude|y)$/i.test(c));
            let lonCol = columns.find(c => /^(lon|lng|longitude|long|x)$/i.test(c));
            
            if (!latCol || !lonCol) {
                // Se non trova automaticamente, mostra un dialog per selezionare le colonne
                showCSVColumnDialog(rows, columns, layerName, addGeoJSONCallback);
                return;
            }
            
            // Converti in GeoJSON
            const geojson = csvToGeoJSON(rows, lonCol, latCol);
            addGeoJSONCallback(geojson, layerName);
        }
    });
}

/**
 * Mostra un dialog per selezionare le colonne lat/lon in un CSV
 * @param {Array} rows - Righe del CSV
 * @param {Array} columns - Colonne del CSV
 * @param {string} layerName - Nome del layer
 * @param {Function} addGeoJSONCallback - Callback per aggiungere GeoJSON alla mappa
 */
export function showCSVColumnDialog(rows, columns, layerName, addGeoJSONCallback) {
    const options = columns.map(col => ({ value: col, label: col }));
    
    showDialog({
        title: 'Seleziona le colonne geografiche',
        fields: [
            {
                type: 'select',
                id: 'latColumn',
                label: 'Colonna latitudine',
                options: options
            },
            {
                type: 'select',
                id: 'lonColumn',
                label: 'Colonna longitudine',
                options: options
            }
        ],
        onConfirm: (values) => {
            const geojson = csvToGeoJSON(rows, values.lonColumn, values.latColumn);
            addGeoJSONCallback(geojson, layerName);
        }
    });
}