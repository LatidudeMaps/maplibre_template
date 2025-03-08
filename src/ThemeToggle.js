import * as maplibregl from 'maplibre-gl';

// Costante per l'evento personalizzato di cambio tema
export const THEME_CHANGE_EVENT = 'themeChange';

class ThemeToggleControl {
    constructor() {
        this._container = null;
        this._map = null;
        this._isDarkTheme = true; // Imposta il tema scuro come predefinito
    }

    onAdd(map) {
        this._map = map;
        
        // Create main container
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        // Create toggle button
        this._button = document.createElement('button');
        this._button.type = 'button';
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-theme-toggle';
        this._button.setAttribute('title', 'Toggle dark/light theme');
        
        // Check if theme preference is stored
        const storedTheme = localStorage.getItem('mapTheme');
        
        // Se non c'è un tema memorizzato o è esplicitamente 'light', 
        // lo impostiamo a 'dark' come predefinito
        if (!storedTheme || storedTheme === 'light') {
            this._isDarkTheme = true;
            localStorage.setItem('mapTheme', 'dark');
            this._enableDarkTheme();
        } else if (storedTheme === 'dark') {
            // Se è già dark, assicuriamoci che sia abilitato
            this._isDarkTheme = true;
            this._enableDarkTheme();
        } else {
            // In tutti gli altri casi, seguiamo il tema salvato
            this._isDarkTheme = storedTheme === 'dark';
            
            if (this._isDarkTheme) {
                this._enableDarkTheme();
            }
        }
        
        // Add click handler
        this._button.addEventListener('click', () => {
            this._isDarkTheme = !this._isDarkTheme;
            
            if (this._isDarkTheme) {
                this._enableDarkTheme();
            } else {
                this._disableDarkTheme();
            }
            
            // Store theme preference
            localStorage.setItem('mapTheme', this._isDarkTheme ? 'dark' : 'light');
        });
        
        this._container.appendChild(this._button);
        
        return this._container;
    }

    _enableDarkTheme() {
        // Aggiungi solo le classi, evita la manipolazione diretta del DOM
        document.body.classList.add('dark-theme');
        this._button.classList.add('dark');
        
        // Emetti un evento personalizzato per notificare il cambio tema
        const event = new CustomEvent(THEME_CHANGE_EVENT, {
            detail: { theme: 'dark' }
        });
        document.dispatchEvent(event);
    }

    _disableDarkTheme() {
        document.body.classList.remove('dark-theme');
        this._button.classList.remove('dark');
        
        // Emetti un evento personalizzato per notificare il cambio tema
        const event = new CustomEvent(THEME_CHANGE_EVENT, {
            detail: { theme: 'light' }
        });
        document.dispatchEvent(event);
    }

    onRemove() {
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        
        this._map = null;
    }
}

export default ThemeToggleControl;