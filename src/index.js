import maplibregl from 'maplibre-gl';
// Rimuoviamo l'import del CSS originale di maplibre-gl
// import 'maplibre-gl/dist/maplibre-gl.css';
// Aggiungiamo gli import per maplibre-theme
import 'maplibre-theme/icons.default.css';
import 'maplibre-theme/classic.css';
import './styles.css';
import style from './style.json';
import CopyrightControl from './CopyrightControl';
import SettingsControl from './SettingsControl';
import MinimapControl from './MinimapControls';
import ThemeToggleControl from './ThemeToggle';
// import LayerManager from './LayerManager';
// import FileLoaderControl from './FileLoaderControl';

document.addEventListener('DOMContentLoaded', () => {
    // Controlla se è stato salvato un tema e applicalo subito 
    // prima di creare qualsiasi controllo
    const storedTheme = localStorage.getItem('mapTheme');
    
    // Se non c'è un tema memorizzato o è impostato su 'light', lo impostiamo a 'dark'
    // come predefinito e lo salviamo in localStorage
    if (!storedTheme || storedTheme === 'light') {
        localStorage.setItem('mapTheme', 'dark');
        document.body.classList.add('dark'); // Usiamo solo la classe 'dark' di MapLibre
    } else if (storedTheme === 'dark') {
        // Se è già dark, assicuriamoci che la classe sia applicata
        document.body.classList.add('dark');
    }
   
    // Crea la mappa con lo stile
    const map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [12.4963, 41.9027], // Coordinate di Roma, cambia in base alle tue esigenze
        zoom: 5,
        pitch: 0,
        maxPitch: 85
    });

    // Quando la mappa è caricata, aggiungi i controlli
    map.once('style.load', () => {
        // Aggiungi il copyright control
        map.addControl(new CopyrightControl(), 'top-left');
        
        // Aggiungi il minimap control
        map.addControl(new MinimapControl(), 'top-left');
        
        // Aggiungi i controlli di navigazione nella parte superiore destra
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        
        // Aggiungi il theme toggle control
        map.addControl(new ThemeToggleControl(), 'top-right');

        // Aggiungi il globe toggle control
        map.addControl(new maplibregl.GlobeControl(), 'top-right');
        
        // Aggiungi il settings control per ultimo, così sarà in fondo
        map.addControl(new SettingsControl(), 'top-right');
        
        // Aggiungi la scala in basso a sinistra
        map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    });
});