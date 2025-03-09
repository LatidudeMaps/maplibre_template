import * as maplibregl from "maplibre-gl";
import { THEME_CHANGE_EVENT } from './ThemeToggle';

class MinimapControl {
    constructor(options = {}) {
        this._container = null;
        this._minimap = null;
        this._minimapCanvas = null;
        this._mainMap = null;
        this._width = options.width || 200;
        this._height = options.height || 200;
        this._zoomOffset = options.zoomOffset || 4;
        this._isVisible = true;
        this._themeHandler = this._updateTheme.bind(this);
    }

    onAdd(map) {
        this._mainMap = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl';
        this._container.style.backgroundColor = 'transparent';
        this._container.style.position = 'relative';
        
        // Create minimapWrapper that will handle the animations
        const minimapWrapper = document.createElement('div');
        minimapWrapper.style.width = this._width + 'px';
        minimapWrapper.style.height = this._height + 'px';
        minimapWrapper.style.position = 'relative';
        minimapWrapper.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        minimapWrapper.style.transformOrigin = 'top left';
        minimapWrapper.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        minimapWrapper.style.borderRadius = '8px';
        minimapWrapper.style.overflow = 'hidden';
        minimapWrapper.style.backdropFilter = 'blur(8px)';
        minimapWrapper.style.WebkitBackdropFilter = 'blur(8px)';
        minimapWrapper.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
        
        // Add toggle button con dimensioni ridotte
        const toggleButton = document.createElement('button');
        toggleButton.className = 'minimap-toggle-btn';
        toggleButton.style.width = '26px';  // Dimensione del bottone
        toggleButton.style.height = '26px'; 
        toggleButton.style.display = 'flex';
        toggleButton.style.alignItems = 'center';    // Centra l'icona verticalmente
        toggleButton.style.justifyContent = 'center'; // Centra l'icona orizzontalmente
        this._toggleButton = toggleButton;

        // Define both icons for minimize and maximize con icone ancora più piccole (8px)
        const minimizeIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                style="min-width: 8px; min-height: 8px; max-width: 18px; max-height: 18px;">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
        `;

        const maximizeIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                style="min-width: 8px; min-height: 8px; max-width: 18px; max-height: 18px;">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
        `;

        toggleButton.innerHTML = minimizeIcon;
        this._minimizeIcon = minimizeIcon;
        this._maximizeIcon = maximizeIcon;

        // Add hover effect
        toggleButton.addEventListener('mouseover', () => {
            toggleButton.style.backgroundColor = document.body.classList.contains('dark') ? 
                '#444' : '#f0f0f0';
        });
        
        toggleButton.addEventListener('mouseout', () => {
            toggleButton.style.backgroundColor = document.body.classList.contains('dark') ? 
                '#333' : 'white';
        });

        // Add click handler
        toggleButton.addEventListener('click', () => {
            this._toggleMinimap(minimapWrapper, toggleButton);
        });

        // Ascolto l'evento personalizzato di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, this._themeHandler);
        
        // Inizializza il tema corretto
        this._updateTheme();

        this._container.appendChild(toggleButton);
        this._container.appendChild(minimapWrapper);
        
        if (map.loaded()) {
            this._initMinimap(minimapWrapper);
        } else {
            map.on('load', () => this._initMinimap(minimapWrapper));
        }

        return this._container;
    }

    _updateTheme() {
        const isDarkTheme = document.body.classList.contains('dark');
        if (!this._toggleButton) return;
        
        // Imposta il colore di sfondo corretto
        this._toggleButton.style.backgroundColor = isDarkTheme ? '#333' : 'white';
        
        // Imposta il colore del testo (per l'SVG)
        this._toggleButton.style.color = isDarkTheme ? '#fff' : '#333';
        
        // Imposta l'ombra appropriata
        this._toggleButton.style.boxShadow = isDarkTheme ? 
            '0 1px 4px rgba(0,0,0,0.5)' : 
            '0 1px 4px rgba(0,0,0,0.3)';
    }

    _toggleMinimap(wrapper, button) {
        if (this._isVisible) {
            wrapper.style.transform = 'scale(0)';
            wrapper.style.opacity = '0';
            button.innerHTML = this._maximizeIcon;
            this._isVisible = false;
        } else {
            wrapper.style.transform = 'scale(1)';
            wrapper.style.opacity = '1';
            button.innerHTML = this._minimizeIcon;
            this._isVisible = true;
        }
    }

    _initMinimap(container) {
        // Il resto del codice rimane invariato
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

        // Initialize the minimap with the combined style
        this._minimap = new maplibregl.Map({
            container: container,
            style: minimapStyle,
            center: this._mainMap.getCenter(),
            zoom: this._mainMap.getZoom() - this._zoomOffset,
            interactive: false,
            attributionControl: false,
            pitchWithRotate: false,
            pitch: 0,
            bearing: 0
        });

        // Create and add the canvas overlay
        this._minimapCanvas = document.createElement('canvas');
        this._minimapCanvas.style.position = 'absolute';
        this._minimapCanvas.style.top = '0';
        this._minimapCanvas.style.left = '0';
        this._minimapCanvas.style.pointerEvents = 'none';
        this._minimapCanvas.width = this._width;
        this._minimapCanvas.height = this._height;
        container.appendChild(this._minimapCanvas);

        // Set up event listeners
        this._minimap.on('load', () => {
            this._mainMap.on('move', this._updateMinimap.bind(this));
            this._mainMap.on('pitch', this._updateMinimap.bind(this));
            this._mainMap.on('rotate', this._updateMinimap.bind(this));
            this._updateMinimap();
        });
    }

    _updateMinimap() {
        // Il resto del codice rimane invariato
        if (!this._minimap || !this._mainMap) return;
    
        this._minimap.setCenter(this._mainMap.getCenter());
        this._minimap.setZoom(this._mainMap.getZoom() - this._zoomOffset);
    
        const ctx = this._minimapCanvas.getContext('2d');
        ctx.clearRect(0, 0, this._width, this._height);
    
        const viewport = this._mainMap.getContainer();
        const pitch = this._mainMap.getPitch();
        
        const MAX_Y_OFFSET = viewport.offsetHeight * 0.5;
        
        const corners = [
            [0, 0],
            [viewport.offsetWidth, 0],
            [viewport.offsetWidth, viewport.offsetHeight],
            [0, viewport.offsetHeight]
        ].map(point => {
            if (point[1] === 0 && pitch > 70) {
                const factor = (pitch - 70) / 20;
                const limitedY = Math.min(MAX_Y_OFFSET * factor, MAX_Y_OFFSET);
                return this._mainMap.unproject([point[0], limitedY]);
            }
            return this._mainMap.unproject(point);
        });
    
        const minimapPoints = corners.map(lngLat => 
            this._minimap.project(lngLat)
        );
    
        const topMidPoint = {
            x: (minimapPoints[0].x + minimapPoints[1].x) / 2,
            y: (minimapPoints[0].y + minimapPoints[1].y) / 2
        };
        
        const bottomMidPoint = {
            x: (minimapPoints[2].x + minimapPoints[3].x) / 2,
            y: (minimapPoints[2].y + minimapPoints[3].y) / 2
        };
    
        const gradient = ctx.createLinearGradient(
            bottomMidPoint.x, bottomMidPoint.y,
            topMidPoint.x, topMidPoint.y
        );
        
        if (pitch > 70) {
            gradient.addColorStop(0, 'rgba(166, 75, 155, 0.8)');
            gradient.addColorStop(0.2, 'rgba(166, 75, 155, 0)');
            gradient.addColorStop(1, 'rgba(166, 75, 155, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(166, 75, 155, 0.8)');
            gradient.addColorStop(1, 'rgba(166, 75, 155, 0.2)');
        }
    
        ctx.beginPath();
        minimapPoints.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
    
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'rgba(166, 75, 155, 0.8)';
        ctx.lineWidth = 1.5;
        
        ctx.fill();
        ctx.stroke();
    }

    onRemove() {
        // Rimuovi l'event listener del tema
        document.removeEventListener(THEME_CHANGE_EVENT, this._themeHandler);
        
        if (this._minimap) {
            this._minimap.remove();
        }
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._mainMap = null;
    }
}

export default MinimapControl;