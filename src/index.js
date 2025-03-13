import maplibregl from 'maplibre-gl'
// Import CSS
import 'maplibre-theme/icons.default.css';
import 'maplibre-theme/classic.css';
import './styles.css';
// Import stile e controlli
import style from './style.json';
import CopyrightControl from './CopyrightControl';
import SettingsControl from './SettingsControl';
import MinimapControl from './MinimapControls';
import ThemeToggleControl from './ThemeToggle';
// Import del selettore di basemap
import BasemapSelector from './BasemapSelector';
// Import del controllo per i layer vettoriali
import VectorLayerControl from './VectorLayerControl';
// Import del modulo di ottimizzazione mobile
import { applyMobileOptimizations, isMobileDevice } from './mobile-optimization';

document.addEventListener('DOMContentLoaded', () => {
    // Controlla se è stato salvato un tema e applicalo
    const storedTheme = localStorage.getItem('mapTheme');
    
    if (!storedTheme || storedTheme === 'light') {
        localStorage.setItem('mapTheme', 'dark');
        document.body.classList.add('dark');
    } else if (storedTheme === 'dark') {
        document.body.classList.add('dark');
    }
   
    // Crea la mappa con lo stile
    const map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [12.4963, 41.9027], // Coordinate di Roma
        zoom: 5,
        pitch: 0,
        maxPitch: 85
    });

    // Quando la mappa è caricata, aggiungi i controlli
    // L'ordine di aggiunta rispecchierà l'ordine con cui i controlli sono inseriti nella mappa (dall'alto verso il basso)
    map.once('style.load', () => {
        // Aggiungi i controlli standard
        map.addControl(new CopyrightControl(), 'top-left');
        map.addControl(new MinimapControl(), 'top-left');
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new ThemeToggleControl(), 'top-right');
        map.addControl(new maplibregl.GlobeControl(), 'top-right');

        // Aggiungi il controllo per i layer vettoriali
        map.addControl(new VectorLayerControl({
            position: 'top-right',
            supportedFormats: ['csv', 'geojson', 'json', 'gpx', 'kml']
        }), 'top-right');
        
        map.addControl(new SettingsControl(), 'top-right');
        map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
        
        // Crea il selettore di basemap (non è necessario aggiungerlo come controllo)
        // poiché si posiziona automaticamente sulla mappa
        new BasemapSelector(map, {
            defaultBasemap: 'satellite'
        });
        
        // Applica le ottimizzazioni mobile se necessario
        applyMobileOptimizations(map, {
            // Personalizza le opzioni se necessario
            // forceOptimizations: true, // Forza le ottimizzazioni anche su desktop (solo per test)
            enableQuickZoom: true,
            enableTwoFingerRotation: true,
            enableTwoFingerTiltUp: true,
            enableQuickReset: true
        });
        
        // Il messaggio di benvenuto è stato rimosso come richiesto
    });
});