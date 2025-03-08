import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import style from './style.json';
import CopyrightControl from './CopyrightControl';
import SettingsControl from './SettingsControl';
import MinimapControl from './MinimapControls';
import ThemeToggleControl from './ThemeToggle';

document.addEventListener('DOMContentLoaded', () => {
    // Controlla se è stato salvato un tema e applicalo subito 
    // prima di creare qualsiasi controllo
    const storedTheme = localStorage.getItem('mapTheme');
    
    // Se non c'è un tema memorizzato o è impostato su 'light', lo impostiamo a 'dark'
    // come predefinito e lo salviamo in localStorage
    if (!storedTheme || storedTheme === 'light') {
        localStorage.setItem('mapTheme', 'dark');
        document.body.classList.add('dark-theme');
    } else if (storedTheme === 'dark') {
        // Se è già dark, assicuriamoci che la classe sia applicata
        document.body.classList.add('dark-theme');
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

    // Aggiunta controlli di navigazione
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    
    // Aggiungi il controllo per il tema
    map.addControl(new ThemeToggleControl(), 'top-right');
       
    // Quando la mappa è caricata, aggiungi gli altri controlli
    map.once('style.load', () => {
        // Add copyright control
        map.addControl(new CopyrightControl(), 'top-left');

        // Add settings control
        map.addControl(new SettingsControl(), 'top-right');

        // Add minimap control
        map.addControl(new MinimapControl(), 'top-left');
    });
});