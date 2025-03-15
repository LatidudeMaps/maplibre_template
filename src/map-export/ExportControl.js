/**
 * Controllo per l'esportazione della mappa utilizzando @watergis/maplibre-gl-export
 */
import { MaplibreExportControl } from '@watergis/maplibre-gl-export';
import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';

/**
 * Estende MaplibreExportControl con personalizzazioni per LatidudeMaps
 */
class ExportControl extends MaplibreExportControl {
  /**
   * Crea un'istanza di ExportControl
   * @param {Object} options - Opzioni per l'esportazione
   */
  constructor(options = {}) {
    // Opzioni di default
    const defaultOptions = {
      // Posizione del controllo sulla mappa
      position: 'top-right',
      
      // Formato di default
      format: 'pdf', // 'jpg', 'png', 'svg', 'pdf'
      
      // Dimensione carta di default
      size: 'a4', // 'a2', 'a3', 'a4', 'a5', 'letter', 'legal', 'tabloid'
      
      // Layout pagina di default
      landscape: true,
      
      // Risoluzione
      dpi: 300, // 96, 150, 300, 600
      
      // Unità di misura per il layout
      unit: 'mm', // 'mm', 'in'
      
      // Dimensione margini in unità selezionate
      margins: 0, 
      
      // Abilita la personalizzazione dell'area di stampa
      enablePrintableArea: true, // true: mostra un'area stampabile trascinabile
      
      // Abilita la visualizzazione del mirino al centro della mappa
      enableCrosshair: true, // true: mostra un mirino al centro della mappa
      
      // Visualizza i crediti sulla mappa
      credits: '© LatidudeMaps',

      // Prefisso per il nome del file
      filename: 'Mappa_'
    };

    // Unisci le opzioni di default con quelle fornite
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Chiama il costruttore della classe genitore
    super(mergedOptions);
  }
}

export default ExportControl;