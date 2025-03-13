/**
 * Modulo per correggere problemi di visualizzazione e interazione 
 * con il Vector Layer Control nella versione mobile
 */

/**
 * Applica correzioni specifiche al controllo Vector Layer per renderlo 
 * utilizzabile nell'interfaccia mobile
 */
export function fixVectorLayerControl() {
    // Attendi che tutti i controlli siano caricati
    setTimeout(() => {
        // Trova il pulsante del vector layer
        const vectorButton = document.querySelector('.vector-layer-control');
        if (vectorButton) {
            // Sovrascriviamo gli stili per assicurarci che sia cliccabile
            vectorButton.style.pointerEvents = 'auto';
            
            // Cloniamo il click listener dal pulsante originale
            const clonedButton = document.querySelector('.settings-controls-container .vector-layer-control');
            if (clonedButton) {
                // Assicuriamoci che il pulsante nella tendina attivi quello originale
                clonedButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    vectorButton.click();
                });
            }
        }
        
        // Corregge il posizionamento del pannello dei layer se viene visualizzato
        const layerPanel = document.querySelector('.vector-layer-panel');
        if (layerPanel) {
            layerPanel.style.top = '60px'; // Sotto la barra superiore
            layerPanel.style.zIndex = '999';
            layerPanel.style.maxWidth = '80%';
            layerPanel.style.width = '260px';
        }
        
        // Corregge il posizionamento dei dialoghi se vengono visualizzati
        const layerDialog = document.querySelector('.vector-layer-dialog');
        if (layerDialog) {
            layerDialog.style.top = '60px'; // Sotto la barra superiore
            layerDialog.style.zIndex = '1000';
            layerDialog.style.width = '85%';
            layerDialog.style.maxWidth = '300px';
        }
    }, 500); // Ritardo per assicurarsi che tutto sia caricato
}
