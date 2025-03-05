import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import style from './style.json';

document.addEventListener('DOMContentLoaded', () => {
    // Recupera l'ultimo valore di esagerazione o usa quello predefinito
    const lastExaggeration = parseFloat(localStorage.getItem('terrainExaggeration') || '0.15');
    
    // Crea la mappa con lo stile
    const map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [12.4963, 41.9027], // Coordinate di Roma, cambia in base alle tue esigenze
        zoom: 5,
        pitch: 45,
        maxPitch: 85
    });

    // Aggiunta controlli di navigazione
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    
    // Crea il controllo per l'esagerazione del terreno
    const exaggerationControl = document.createElement('div');
    exaggerationControl.className = 'exaggeration-control';
    
    const exaggerationLabel = document.createElement('label');
    exaggerationLabel.textContent = 'Esagerazione terreno: ';
    exaggerationLabel.htmlFor = 'exaggeration-slider';
    
    const exaggerationValue = document.createElement('span');
    exaggerationValue.textContent = lastExaggeration.toFixed(2);
    exaggerationValue.id = 'exaggeration-value';
    
    const exaggerationSlider = document.createElement('input');
    exaggerationSlider.type = 'range';
    exaggerationSlider.id = 'exaggeration-slider';
    exaggerationSlider.min = '0.05';
    exaggerationSlider.max = '1.0';
    exaggerationSlider.step = '0.05';
    exaggerationSlider.value = lastExaggeration;
    
    exaggerationControl.appendChild(exaggerationLabel);
    exaggerationControl.appendChild(exaggerationValue);
    exaggerationControl.appendChild(document.createElement('br'));
    exaggerationControl.appendChild(exaggerationSlider);
    
    document.body.appendChild(exaggerationControl);
    exaggerationControl.style.display = 'none'; // Nascosto inizialmente
    
    // Gestisci il cambio di esagerazione
    exaggerationSlider.addEventListener('input', (e) => {
        const exaggeration = parseFloat(e.target.value);
        exaggerationValue.textContent = exaggeration.toFixed(2);
        
        // Salva il valore in localStorage
        localStorage.setItem('terrainExaggeration', exaggeration);
        
        // Aggiorna l'esagerazione del terreno solo se il terreno è attivo
        if (map.getTerrain()) {
            map.setTerrain({ 'source': 'terrain-source', 'exaggeration': exaggeration });
        }
    });
    
    // Quando la mappa è caricata, aggiungi il controllo terreno
    map.once('style.load', () => {
        // Crea il controllo terreno
        const terrainControl = new maplibregl.TerrainControl({
            source: 'terrain-source',
            exaggeration: lastExaggeration
        });
        
        map.addControl(terrainControl, 'top-right');
        
        // Attiva il terreno se era attivo in precedenza
        if (localStorage.getItem('terrain3DActive') === 'true') {
            map.setTerrain({ 'source': 'terrain-source', 'exaggeration': lastExaggeration });
            exaggerationControl.style.display = 'block';
        }
    });
    
    // Ascolta gli eventi di attivazione/disattivazione del terreno
    map.on('terrain', (e) => {
        const isTerrainActive = e.terrain !== null;
        
        // Salva lo stato
        localStorage.setItem('terrain3DActive', isTerrainActive ? 'true' : 'false');
        
        // Mostra/nascondi il controllo di esagerazione
        exaggerationControl.style.display = isTerrainActive ? 'block' : 'none';
    });
});