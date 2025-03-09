// Evento personalizzato emesso quando il tema viene cambiato
export const THEME_CHANGE_EVENT = 'theme-change';

class ThemeToggleControl {
    constructor() {
        this._isDark = false;
        this._map = null;
        this._container = null;
        this._button = null;
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        this._button = document.createElement('button');
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-theme-toggle';
        this._button.type = 'button';
        this._button.setAttribute('title', 'Toggle theme');
        
        // Controlla lo stato corrente del tema
        this._isDark = document.body.classList.contains('dark');
        this._updateButton();
        
        this._button.addEventListener('click', () => {
            this._toggleTheme();
        });
        
        this._container.appendChild(this._button);
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = null;
    }

    _toggleTheme() {
        this._isDark = !this._isDark;
        
        if (this._isDark) {
            document.body.classList.add('dark');
            localStorage.setItem('mapTheme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('mapTheme', 'light');
        }
        
        this._updateButton();
        
        // Emetti un evento che può essere ascoltato da altri componenti
        document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, {
            detail: { isDark: this._isDark }
        }));
    }

    _updateButton() {
        if (this._isDark) {
            this._button.classList.add('dark');
        } else {
            this._button.classList.remove('dark');
        }
    }
}

export default ThemeToggleControl;