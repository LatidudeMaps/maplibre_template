import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import style from './src/style.json';

document.addEventListener('DOMContentLoaded', () => {
    const map = new maplibregl.Map({
        container: 'map',
        style: style,  // Usa lo stile locale invece dell'URL
        center: [12.4963, 41.9027], // Coordinate di Roma, cambia in base alle tue esigenze
        zoom: 5
    });

    // Aggiunta controlli di navigazione
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
});