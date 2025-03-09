// BasemapSelector.js - Selettore di basemap con pulsanti testuali distanziati
import maplibregl from 'maplibre-gl';

/**
 * Classe che gestisce il selettore di basemap con pulsanti testuali distanziati
 */
class BasemapSelector {
    /**
     * Inizializza il selettore di basemap
     * @param {Object} map - Istanza della mappa MapLibre
     * @param {Object} options - Opzioni di configurazione
     */
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            // Basemap predefinita
            defaultBasemap: 'satellite',
            ...options
        };
        
        // Basemap attiva
        this.activeBasemap = this.options.defaultBasemap;
        
        // Crea il controllo appena viene inizializzata l'istanza
        this._createControl();
        
        // Quando la mappa è caricata, imposta la basemap predefinita
        this.map.once('load', () => {
            this.switchBasemap(this.activeBasemap);
        });
    }
    
    /**
     * Crea il controllo e lo aggiunge direttamente al contenitore della mappa
     */
    _createControl() {
        // Ottieni il contenitore della mappa
        const mapContainer = this.map.getContainer();
        
        // Crea il container del controllo
        this.container = document.createElement('div');
        this.container.className = 'basemap-buttons-control';
        
        // Configura le basemap con i testi
        const basemaps = [
            { 
                id: 'satellite', 
                title: 'Satellite'
            },
            { 
                id: 'osm', 
                title: 'OpenStreetMap'
            },
            { 
                id: 'terrain', 
                title: 'Topographic'
            }
        ];
        
        // Crea il contenuto HTML per i pulsanti
        let buttonsHTML = '';
        basemaps.forEach(basemap => {
            const isActive = this.activeBasemap === basemap.id ? 'active' : '';
            buttonsHTML += `
                <button 
                    class="basemap-button ${basemap.id} ${isActive}" 
                    data-basemap="${basemap.id}">
                    ${basemap.title}
                </button>
            `;
        });
        
        // Imposta l'HTML del container
        this.container.innerHTML = `
            <div class="basemap-buttons-container">
                ${buttonsHTML}
            </div>
        `;
        
        // Aggiungi gli event listener ai pulsanti
        const buttons = this.container.querySelectorAll('.basemap-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const basemapId = e.currentTarget.getAttribute('data-basemap');
                this.switchBasemap(basemapId);
            });
        });
        
        // Aggiungi il container alla mappa
        mapContainer.appendChild(this.container);
        
        // Aggiungi stili CSS
        this._addStyles();
        
        // Salva i riferimenti ai pulsanti
        this.buttons = {};
        buttons.forEach(button => {
            const basemapId = button.getAttribute('data-basemap');
            this.buttons[basemapId] = button;
        });
    }
    
    /**
     * Cambia la basemap attiva
     * @param {string} basemapId - ID della basemap da attivare
     */
    switchBasemap(basemapId) {
        // Verifica che l'ID sia valido
        if (!['satellite', 'osm', 'terrain'].includes(basemapId)) {
            console.error(`Basemap non valida: ${basemapId}`);
            return;
        }
        
        // Se è già la basemap attiva, non fare nulla
        if (this.activeBasemap === basemapId) return;
        
        // Aggiorna la basemap attiva
        this.activeBasemap = basemapId;
        
        // Imposta a 'none' la visibilità di tutte le basemap
        ['satellite', 'osm', 'terrain'].forEach(id => {
            this.map.setLayoutProperty(id, 'visibility', 'none');
            
            // Rimuovi la classe active da tutti i pulsanti
            if (this.buttons[id]) {
                this.buttons[id].classList.remove('active');
            }
        });
        
        // Imposta a 'visible' la visibilità della basemap selezionata
        this.map.setLayoutProperty(basemapId, 'visibility', 'visible');
        
        // Aggiungi la classe active al pulsante selezionato
        if (this.buttons[basemapId]) {
            this.buttons[basemapId].classList.add('active');
        }
        
        // Emetti un evento personalizzato
        const event = new CustomEvent('basemapchange', {
            detail: { basemapId }
        });
        
        window.dispatchEvent(event);
        console.log(`Basemap cambiata a: ${basemapId}`);
    }
    
    /**
     * Aggiungi stili CSS
     */
    _addStyles() {
        // Verifica se gli stili sono già stati aggiunti
        if (document.getElementById('basemap-buttons-styles')) return;
        
        // Crea l'elemento di stile
        const style = document.createElement('style');
        style.id = 'basemap-buttons-styles';
        style.textContent = `
            .basemap-buttons-control {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
            }
            
            .basemap-buttons-container {
                display: flex;
                gap: 10px; /* Spazio tra i pulsanti */
            }
            
            .basemap-button {
                display: inline-block;
                padding: 4px 10px;
                background: white;
                border: none;
                border-radius: 16px;
                font-family: "Source Sans 3";
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                color: #333;
                box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;
            }
            
            .basemap-button:hover {
                background-color: #f0f0f0;
            }
            
            .basemap-button.active {
                background-color: #0078FF;
                color: white;
                box-shadow: 0 0 0 2px rgba(0, 120, 255, 0.4);
            }
            
            /* Stile per tema scuro */
            .dark .basemap-button {
                background: #333;
                color: #fff;
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
            }
            
            .dark .basemap-button:hover {
                background-color: #444;
            }
            
            .dark .basemap-button.active {
                background-color: #0078FF;
                color: white;
                box-shadow: 0 0 0 2px rgba(0, 120, 255, 0.4);
            }
        `;
        
        // Aggiungi lo stile al documento
        document.head.appendChild(style);
    }
    
    /**
     * Rimuovi il controllo
     */
    remove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default BasemapSelector;