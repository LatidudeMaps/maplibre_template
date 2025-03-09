import maplibregl from 'maplibre-gl';
import { THEME_CHANGE_EVENT } from './ThemeToggle';

class LayerManager {
    constructor() {
        this._container = null;
        this._map = null;
        this._layers = new Map(); // Map<layerId, { name, type, visible, parentId }>
        this._isExpanded = false;
        this._panel = null;
        this._layerListContainer = null;
    }

    onAdd(map) {
        this._map = map;

        // Crea il container principale
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        // Crea il pulsante per mostrare/nascondere il pannello dei layer
        this._button = document.createElement('button');
        this._button.type = 'button';
        this._button.className = 'maplibregl-ctrl-icon maplibregl-ctrl-layers';
        this._button.setAttribute('title', 'Gestione layer');
        
        // Aggiungi un'icona SVG al pulsante
        this._button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
        `;

        // Crea il pannello dei layer
        this._panel = document.createElement('div');
        this._panel.className = 'layers-panel';
        this._panel.style.position = 'absolute';
        this._panel.style.right = '0';
        this._panel.style.top = '100%';
        this._panel.style.width = '250px';
        this._panel.style.maxHeight = '300px';
        this._panel.style.overflowY = 'auto';
        this._panel.style.backgroundColor = 'var(--color-background-light)';
        this._panel.style.borderRadius = 'var(--border-radius-md)';
        this._panel.style.boxShadow = 'var(--shadow-light)';
        this._panel.style.padding = 'var(--spacing-md)';
        this._panel.style.marginTop = '10px';
        this._panel.style.zIndex = '1';
        this._panel.style.transition = 'var(--transition-smooth)';
        this._panel.style.visibility = 'hidden';
        this._panel.style.opacity = '0';
        this._panel.style.transform = 'translateY(-10px)';
        this._panel.style.display = 'flex';
        this._panel.style.flexDirection = 'column';
        this._panel.style.gap = 'var(--spacing-sm)';

        // Titolo del pannello
        const panelTitle = document.createElement('h3');
        panelTitle.style.margin = '0 0 10px 0';
        panelTitle.style.fontSize = '14px';
        panelTitle.style.fontFamily = 'var(--font-primary)';
        panelTitle.style.fontWeight = '600';
        panelTitle.style.color = 'var(--color-text-light)';
        panelTitle.style.transition = 'color 0.3s ease';
        panelTitle.textContent = 'Gestione Layer';
        this._panel.appendChild(panelTitle);

        // Contenitore dei layer
        this._layerListContainer = document.createElement('div');
        this._layerListContainer.className = 'layer-list';
        this._layerListContainer.style.display = 'flex';
        this._layerListContainer.style.flexDirection = 'column';
        this._layerListContainer.style.gap = 'var(--spacing-xs)';
        this._panel.appendChild(this._layerListContainer);

        // Messaggio quando non ci sono layer
        this._emptyMessage = document.createElement('p');
        this._emptyMessage.style.fontFamily = 'var(--font-primary)';
        this._emptyMessage.style.fontSize = '12px';
        this._emptyMessage.style.color = 'var(--color-text-secondary-light)';
        this._emptyMessage.style.fontStyle = 'italic';
        this._emptyMessage.style.margin = '5px 0';
        this._emptyMessage.style.transition = 'color 0.3s ease';
        this._emptyMessage.textContent = 'Nessun layer caricato. Usa il pulsante di upload per aggiungere dati.';
        this._layerListContainer.appendChild(this._emptyMessage);

        // Gestione dell'evento di click sul pulsante
        this._button.addEventListener('click', (e) => {
            e.stopPropagation();
            this._togglePanel();
        });

        // Gestione dell'evento di click all'esterno per chiudere il pannello
        document.addEventListener('click', (e) => {
            if (!this._container.contains(e.target) && 
                !e.target.closest('.layers-panel') && 
                this._isExpanded) {
                this._hidePanel();
            }
        });

        // Ascolto dell'evento di cambio tema
        document.addEventListener(THEME_CHANGE_EVENT, () => {
            this._updateThemeStyles();
        });

        // Controllo iniziale del tema
        if (document.body.classList.contains('dark-theme')) {
            this._updateThemeStyles();
        }

        this._container.appendChild(this._button);
        this._container.appendChild(this._panel);

        return this._container;
    }

    _updateThemeStyles() {
        if (this._panel) {
            if (document.body.classList.contains('dark-theme')) {
                this._panel.style.backgroundColor = 'var(--color-background-dark)';
                this._panel.style.boxShadow = 'var(--shadow-dark)';
                this._emptyMessage.style.color = 'var(--color-text-secondary-dark)';
                
                // Aggiorna il colore del titolo
                const panelTitle = this._panel.querySelector('h3');
                if (panelTitle) {
                    panelTitle.style.color = 'var(--color-text-dark)';
                }
                
                // Aggiorna i colori del testo per tutti gli elementi del layer
                const layerItems = this._panel.querySelectorAll('.layer-item');
                layerItems.forEach(item => {
                    const label = item.querySelector('label');
                    if (label) {
                        label.style.color = 'var(--color-text-dark)';
                    }
                });
            } else {
                this._panel.style.backgroundColor = 'var(--color-background-light)';
                this._panel.style.boxShadow = 'var(--shadow-light)';
                this._emptyMessage.style.color = 'var(--color-text-secondary-light)';
                
                // Aggiorna il colore del titolo
                const panelTitle = this._panel.querySelector('h3');
                if (panelTitle) {
                    panelTitle.style.color = 'var(--color-text-light)';
                }
                
                // Aggiorna i colori del testo per tutti gli elementi del layer
                const layerItems = this._panel.querySelectorAll('.layer-item');
                layerItems.forEach(item => {
                    const label = item.querySelector('label');
                    if (label) {
                        label.style.color = 'var(--color-text-light)';
                    }
                });
            }
        }
    }

    _togglePanel() {
        if (this._isExpanded) {
            this._hidePanel();
        } else {
            this._showPanel();
        }
    }

    _showPanel() {
        this._panel.style.visibility = 'visible';
        this._panel.style.opacity = '1';
        this._panel.style.transform = 'translateY(0)';
        this._button.classList.add('active');
        this._isExpanded = true;
    }

    _hidePanel() {
        this._panel.style.opacity = '0';
        this._panel.style.transform = 'translateY(-10px)';
        this._button.classList.remove('active');
        this._isExpanded = false;

        // Impostiamo un timeout per nascondere il pannello dopo l'animazione
        this._hideTimeout = setTimeout(() => {
            if (!this._isExpanded) {
                this._panel.style.visibility = 'hidden';
            }
            this._hideTimeout = null;
        }, 300);
    }

    addLayer(layerId, layerName, layerType, parentId = null) {
        // Aggiungi il layer alla mappa interna
        this._layers.set(layerId, {
            name: layerName, 
            type: layerType, 
            visible: true,
            parentId: parentId
        });

        // Aggiorna l'interfaccia utente solo se non è un layer figlio
        if (!parentId) {
            this._updateLayerListUI();
        }
    }

    removeLayer(layerId) {
        // Rimuovi tutti i layer figli
        const childLayersToRemove = [];
        this._layers.forEach((layer, id) => {
            if (layer.parentId === layerId) {
                childLayersToRemove.push(id);
            }
        });
        
        // Rimuovi i layer figli
        childLayersToRemove.forEach(id => {
            if (this._map.getLayer(id)) {
                this._map.removeLayer(id);
            }
            this._layers.delete(id);
        });

        // Rimuovi il layer principale
        if (this._map.getLayer(layerId)) {
            this._map.removeLayer(layerId);
        }

        // Rimuovi la source solo se esiste
        if (this._map.getSource(layerId)) {
            this._map.removeSource(layerId);
        }

        this._layers.delete(layerId);
        this._updateLayerListUI();
    }

    toggleLayerVisibility(layerId, visible) {
        const layer = this._layers.get(layerId);
        if (layer) {
            layer.visible = visible;
            
            // Aggiorna la visibilità del layer sulla mappa
            if (this._map.getLayer(layerId)) {
                this._map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }
            
            // Aggiorna anche eventuali layer figli
            this._layers.forEach((childLayer, childId) => {
                if (childLayer.parentId === layerId) {
                    childLayer.visible = visible;
                    if (this._map.getLayer(childId)) {
                        this._map.setLayoutProperty(childId, 'visibility', visible ? 'visible' : 'none');
                    }
                }
            });
        }
    }

    _updateLayerListUI() {
        // Rimuovi tutti gli elementi della lista tranne il messaggio vuoto
        while (this._layerListContainer.firstChild) {
            this._layerListContainer.removeChild(this._layerListContainer.firstChild);
        }

        // Aggiungi di nuovo il messaggio vuoto
        this._layerListContainer.appendChild(this._emptyMessage);

        // Nascondi o mostra il messaggio vuoto a seconda che ci siano layer o meno
        // Conta solo i layer principali (non i figli)
        let hasMainLayers = false;
        this._layers.forEach(layer => {
            if (!layer.parentId) {
                hasMainLayers = true;
            }
        });

        this._emptyMessage.style.display = hasMainLayers ? 'none' : 'block';

        // Crea gli elementi della lista solo per i layer principali
        this._layers.forEach((layer, layerId) => {
            if (!layer.parentId) {
                this._createLayerListItem(layerId, layer);
            }
        });
    }

    _createLayerListItem(layerId, layer) {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        
        // Contenitore del layer
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.style.display = 'flex';
        layerItem.style.alignItems = 'center';
        layerItem.style.justifyContent = 'space-between';
        layerItem.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
        layerItem.style.backgroundColor = isDarkTheme ? 'var(--color-hover-dark)' : 'var(--color-hover-light)';
        layerItem.style.borderRadius = 'var(--border-radius-sm)';
        layerItem.style.transition = 'var(--transition-default)';
        
        // Toggle switch moderno - Ora come primo elemento
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-switch';
        toggleContainer.style.position = 'relative';
        toggleContainer.style.display = 'inline-block';
        toggleContainer.style.width = '30px';
        toggleContainer.style.height = '16px';
        toggleContainer.style.flexShrink = '0';
        toggleContainer.style.marginRight = 'var(--spacing-sm)';
        
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = layer.visible;
        toggleInput.style.opacity = '0';
        toggleInput.style.width = '0';
        toggleInput.style.height = '0';
        
        const toggleSlider = document.createElement('span');
        toggleSlider.className = 'toggle-slider';
        toggleSlider.style.position = 'absolute';
        toggleSlider.style.cursor = 'pointer';
        toggleSlider.style.top = '0';
        toggleSlider.style.left = '0';
        toggleSlider.style.right = '0';
        toggleSlider.style.bottom = '0';
        toggleSlider.style.backgroundColor = layer.visible ? 'var(--color-primary)' : 'var(--color-text-secondary-light)';
        toggleSlider.style.transition = 'var(--transition-default)';
        toggleSlider.style.borderRadius = '16px';
        
        // Crea solo un pallino (knob) per lo switch
        const toggleKnob = document.createElement('span');
        toggleKnob.className = 'toggle-knob';
        toggleKnob.style.position = 'absolute';
        toggleKnob.style.height = '12px';
        toggleKnob.style.width = '12px';
        toggleKnob.style.top = '2px';
        toggleKnob.style.left = layer.visible ? '16px' : '2px';
        toggleKnob.style.backgroundColor = isDarkTheme ? 'var(--color-text-dark)' : 'white';
        toggleKnob.style.borderRadius = '50%';
        toggleKnob.style.transition = 'var(--transition-default)';
        
        toggleSlider.appendChild(toggleKnob);
        toggleContainer.appendChild(toggleInput);
        toggleContainer.appendChild(toggleSlider);
        
        // Nome layer - In mezzo
        const nameContainer = document.createElement('div');
        nameContainer.style.flex = '1';
        nameContainer.style.overflow = 'hidden';
        
        const label = document.createElement('span'); // Cambiato da label a span
        label.textContent = layer.name;
        label.style.fontFamily = 'var(--font-primary)';
        label.style.fontSize = '12px';
        label.style.fontWeight = '500';
        label.style.color = isDarkTheme ? 'var(--color-text-dark)' : 'var(--color-text-light)';
        label.style.whiteSpace = 'nowrap';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.transition = 'color 0.3s ease';
        nameContainer.appendChild(label);
        
        // Pulsante elimina - A destra
        const deleteButton = document.createElement('button');
        deleteButton.className = 'layer-delete-button';
        deleteButton.style.border = 'none';
        deleteButton.style.background = 'none';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.padding = '2px';
        deleteButton.style.display = 'flex';
        deleteButton.style.alignItems = 'center';
        deleteButton.style.justifyContent = 'center';
        deleteButton.style.color = isDarkTheme ? 'var(--color-text-secondary-dark)' : 'var(--color-text-secondary-light)';
        deleteButton.style.transition = 'color 0.3s ease';
        deleteButton.style.flexShrink = '0';
        deleteButton.style.marginLeft = 'var(--spacing-sm)';
        deleteButton.setAttribute('title', 'Rimuovi layer');
        
        // Icona SVG per il pulsante elimina
        deleteButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        
        // Evento hover per il pulsante elimina
        deleteButton.addEventListener('mouseover', () => {
            deleteButton.style.color = 'var(--color-primary)';
        });
        
        deleteButton.addEventListener('mouseout', () => {
            deleteButton.style.color = isDarkTheme ? 'var(--color-text-secondary-dark)' : 'var(--color-text-secondary-light)';
        });
        
        // Gestione degli eventi
        toggleInput.addEventListener('change', () => {
            this.toggleLayerVisibility(layerId, toggleInput.checked);
            toggleSlider.style.backgroundColor = toggleInput.checked ? 'var(--color-primary)' : 'var(--color-text-secondary-light)';
            toggleKnob.style.left = toggleInput.checked ? '16px' : '2px';
        });
        
        // Gestione click diretto sul toggle slider
        toggleSlider.addEventListener('click', (e) => {
            e.preventDefault();
            toggleInput.checked = !toggleInput.checked;
            toggleInput.dispatchEvent(new Event('change'));
        });
        
        // Gestione click sul contenitore toggle
        toggleContainer.addEventListener('click', (e) => {
            e.preventDefault();
            toggleInput.checked = !toggleInput.checked;
            toggleInput.dispatchEvent(new Event('change'));
        });
        
        // Click sul nome del layer
        nameContainer.addEventListener('click', () => {
            toggleInput.checked = !toggleInput.checked;
            toggleInput.dispatchEvent(new Event('change'));
        });
        
        deleteButton.addEventListener('click', () => {
            this.removeLayer(layerId);
        });
        
        // Assembla gli elementi nell'ordine corretto: Toggle -> Nome -> Delete
        layerItem.appendChild(toggleContainer);
        layerItem.appendChild(nameContainer);
        layerItem.appendChild(deleteButton);
        
        // Aggiungi l'elemento al contenitore
        this._layerListContainer.appendChild(layerItem);
    }

    onRemove() {
        // Cancelliamo eventuali timeout pendenti
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
        }
        
        // Rimuoviamo gli event listener
        document.removeEventListener(THEME_CHANGE_EVENT, this._updateThemeStyles);
        
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        
        this._map = null;
    }
}

export default LayerManager;