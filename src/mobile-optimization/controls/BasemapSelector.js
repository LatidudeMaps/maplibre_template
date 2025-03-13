/**
 * Controllo selettore basemap per dispositivi mobili
 */

/**
 * Configura il selettore di basemap in basso al centro
 * @param {Object} map - Istanza della mappa MapLibre
 */
export function setupBasemapSelector(map) {
    const bottomCenterSection = document.querySelector('.mobile-controls-bottom .mobile-controls-center');
    if (!bottomCenterSection) return;
    
    // Crea il contenitore per i pulsanti
    const basemapContainer = document.createElement('div');
    basemapContainer.className = 'mobile-basemap-buttons';
    
    // Versione abbreviata dei nomi dei basemap
    const shortBasemaps = [
        { id: 'satellite', text: 'Sat' },
        { id: 'osm', text: 'OSM' },
        { id: 'terrain', text: 'Topo' }
    ];
    
    // Trova gli elementi originali
    const originalButtons = document.querySelectorAll('.basemap-button');
    
    if (originalButtons && originalButtons.length > 0) {
        // Crea pulsanti compatti
        shortBasemaps.forEach(basemap => {
            // Trova il pulsante originale corrispondente
            const originalButton = Array.from(originalButtons).find(
                btn => btn.getAttribute('data-basemap') === basemap.id
            );
            
            if (!originalButton) return;
            
            const newButton = document.createElement('button');
            newButton.textContent = basemap.text;
            newButton.className = originalButton.classList.contains('active') ? 'active' : '';
            
            // Aggiungi evento click per attivare il pulsante originale
            newButton.addEventListener('click', () => {
                // Rimuovi classe active da tutti i pulsanti
                basemapContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                // Aggiungi active al pulsante cliccato
                newButton.classList.add('active');
                // Triggera il click sull'elemento originale
                originalButton.click();
            });
            
            basemapContainer.appendChild(newButton);
        });
    } else {
        // Se non troviamo i pulsanti originali, crea una versione predefinita
        shortBasemaps.forEach((basemap, index) => {
            const button = document.createElement('button');
            button.textContent = basemap.text;
            button.className = index === 0 ? 'active' : '';
            
            // Aggiungi evento click
            button.addEventListener('click', () => {
                // Aggiorna classe active
                basemapContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Cerca di impostare la basemap
                try {
                    if (map.getLayer(basemap.id)) {
                        // Nasconde tutti gli altri layer di basemap
                        shortBasemaps.forEach(b => {
                            if (map.getLayer(b.id)) {
                                map.setLayoutProperty(b.id, 'visibility', b.id === basemap.id ? 'visible' : 'none');
                            }
                        });
                    }
                } catch (error) {
                    console.log(`Impossibile cambiare basemap a: ${basemap.id}`);
                }
            });
            
            basemapContainer.appendChild(button);
        });
    }
    
    bottomCenterSection.appendChild(basemapContainer);
    
    // Aggiungi un event listener per aggiornare lo stato attivo quando cambia il basemap
    const updateActiveButton = () => {
        const origActiveButton = document.querySelector('.basemap-button.active');
        if (origActiveButton) {
            const activeId = origActiveButton.getAttribute('data-basemap');
            const newButtons = basemapContainer.querySelectorAll('button');
            
            for (let i = 0; i < newButtons.length; i++) {
                const btn = newButtons[i];
                const shortBasemap = shortBasemaps[i];
                if (shortBasemap.id === activeId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        }
    };
    
    // Controlla periodicamente se lo stato del basemap è cambiato
    setInterval(updateActiveButton, 500);
}
