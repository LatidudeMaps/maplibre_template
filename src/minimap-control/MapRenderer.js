import * as maplibregl from "maplibre-gl";

/**
 * Inizializza la minimappa.
 * @param {HTMLElement} container - Container della minimappa
 * @param {Object} mainMap - Istanza della mappa principale
 * @param {number} width - Larghezza della minimappa
 * @param {number} height - Altezza della minimappa
 * @param {number} zoomOffset - Offset di zoom tra la mappa principale e la minimappa
 * @returns {Object} Oggetto contenente la minimappa e il canvas
 */
export function initMinimap(container, mainMap, width, height, zoomOffset) {
    // Crea lo stile per la minimappa
    const minimapStyle = {
        version: 8,
        sources: {
            'opentopo': {
                type: 'raster',
                tiles: [
                    'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                    'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                    'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '© OpenTopoMap (CC-BY-SA)'
            }
        },
        layers: [
            {
                id: 'opentopo-tiles',
                type: 'raster',
                source: 'opentopo',
                minzoom: 0,
                maxzoom: 17
            }
        ]
    };

    // Inizializza la minimappa con lo stile
    const minimap = new maplibregl.Map({
        container: container,
        style: minimapStyle,
        center: mainMap.getCenter(),
        zoom: mainMap.getZoom() - zoomOffset,
        interactive: false,
        attributionControl: false,
        pitchWithRotate: false,
        pitch: 0,
        bearing: 0
    });

    // Crea e aggiungi il canvas in overlay
    const minimapCanvas = document.createElement('canvas');
    minimapCanvas.style.position = 'absolute';
    minimapCanvas.style.top = '0';
    minimapCanvas.style.left = '0';
    minimapCanvas.style.pointerEvents = 'none';
    minimapCanvas.width = width;
    minimapCanvas.height = height;
    container.appendChild(minimapCanvas);
    
    return { minimap, minimapCanvas };
}

/**
 * Aggiorna la minimappa in base allo stato della mappa principale.
 * @param {Object} mainMap - Istanza della mappa principale
 * @param {Object} minimap - Istanza della minimappa
 * @param {HTMLCanvasElement} canvas - Canvas per il rendering dell'overlay
 * @param {number} width - Larghezza della minimappa
 * @param {number} height - Altezza della minimappa
 * @param {number} zoomOffset - Offset di zoom tra la mappa principale e la minimappa
 */
export function updateMinimap(mainMap, minimap, canvas, width, height, zoomOffset) {
    // Aggiorna il centro e lo zoom della minimappa
    minimap.setCenter(mainMap.getCenter());
    minimap.setZoom(mainMap.getZoom() - zoomOffset);

    // Pulisci il canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Ottieni il viewport della mappa principale
    const viewport = mainMap.getContainer();
    const pitch = mainMap.getPitch();
    
    const MAX_Y_OFFSET = viewport.offsetHeight * 0.5;
    
    // Calcola gli angoli del viewport
    const corners = [
        [0, 0],
        [viewport.offsetWidth, 0],
        [viewport.offsetWidth, viewport.offsetHeight],
        [0, viewport.offsetHeight]
    ].map(point => {
        // Gestisci la distorsione prospettica per pitch elevati
        if (point[1] === 0 && pitch > 70) {
            const factor = (pitch - 70) / 20;
            const limitedY = Math.min(MAX_Y_OFFSET * factor, MAX_Y_OFFSET);
            return mainMap.unproject([point[0], limitedY]);
        }
        return mainMap.unproject(point);
    });

    // Proietta gli angoli sulla minimappa
    const minimapPoints = corners.map(lngLat => 
        minimap.project(lngLat)
    );

    // Calcola i punti centrali in alto e in basso
    const topMidPoint = {
        x: (minimapPoints[0].x + minimapPoints[1].x) / 2,
        y: (minimapPoints[0].y + minimapPoints[1].y) / 2
    };
    
    const bottomMidPoint = {
        x: (minimapPoints[2].x + minimapPoints[3].x) / 2,
        y: (minimapPoints[2].y + minimapPoints[3].y) / 2
    };

    // Crea un gradiente per il riempimento
    const gradient = ctx.createLinearGradient(
        bottomMidPoint.x, bottomMidPoint.y,
        topMidPoint.x, topMidPoint.y
    );
    
    // Imposta i colori del gradiente
    if (pitch > 70) {
        gradient.addColorStop(0, 'rgba(166, 75, 155, 0.8)');
        gradient.addColorStop(0.2, 'rgba(166, 75, 155, 0)');
        gradient.addColorStop(1, 'rgba(166, 75, 155, 0)');
    } else {
        gradient.addColorStop(0, 'rgba(166, 75, 155, 0.8)');
        gradient.addColorStop(1, 'rgba(166, 75, 155, 0.2)');
    }

    // Disegna il poligono
    ctx.beginPath();
    minimapPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();

    // Imposta gli stili e colora il poligono
    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(166, 75, 155, 0.8)';
    ctx.lineWidth = 1.5;
    
    ctx.fill();
    ctx.stroke();
}