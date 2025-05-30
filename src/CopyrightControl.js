import { THEME_CHANGE_EVENT } from './ThemeToggle';

class CopyrightControl {
    constructor() {
        this._container = null;
        this._map = null;
        this._logo = null;
        this._panel = null;
        this._links = [];
        this._logoElement = null; // Referenza all'elemento SVG
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl';
        this._container.style.pointerEvents = 'auto';
        
        // Create copyright panel
        this._panel = document.createElement('div');
        this._panel.className = 'copyright-panel';
        
        // Create wrapper for hover effect
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.position = 'relative';

        // Creiamo un contenitore per il logo che verrà popolato dopo
        this._logoContainer = document.createElement('div');
        this._logoContainer.style.width = '24px';
        this._logoContainer.style.height = '24px';
        this._logoContainer.style.display = 'flex';
        this._logoContainer.style.alignItems = 'center';
        this._logoContainer.style.justifyContent = 'center';
        wrapper.appendChild(this._logoContainer);

        // Carica il logo (sempre lo stesso, indipendentemente dal tema)
        this._loadLogo();

        // Add text container
        const textContainer = document.createElement('div');
        textContainer.style.position = 'relative';

        // Add main text
        const mainText = document.createElement('div');
        mainText.className = 'copyright-main-text';
        mainText.textContent = 'Maplibre Basic Template';
        textContainer.appendChild(mainText);

        // Add author text
        const authorText = document.createElement('div');
        authorText.className = 'copyright-author-text';
        authorText.textContent = 'by Michele Tricarico / LatidudeMaps';
        textContainer.appendChild(authorText);

        wrapper.appendChild(textContainer);

        // Add expanded content
        const expandedContent = document.createElement('div');
        expandedContent.style.marginTop = '0';
        expandedContent.style.maxHeight = '0';
        expandedContent.style.overflow = 'hidden';
        expandedContent.style.opacity = '0';
        expandedContent.style.transition = 'opacity 0.3s ease, max-height 0.3s ease, margin-top 0.3s ease';
        expandedContent.style.borderTop = '1px solid transparent';

        // Add links
        const links = [
            { icon: 'link', text: 'My Links & Social Media', url: 'https://linktr.ee/latidudemaps' },
            { icon: 'globe', text: 'My Personal Website', url: 'https://latidudemaps.github.io/' },
            { icon: 'github', text: 'View on GitHub', url: 'https://github.com/LatidudeMaps' }
        ];

        // Salva i link creati per poterli aggiornare facilmente
        this._links = [];

        links.forEach(link => {
            const linkElement = this._createLink(link);
            this._links.push(linkElement);
            expandedContent.appendChild(linkElement);
        });

        // Add copyright text
        const copyright = document.createElement('div');
        copyright.className = 'copyright-text';
        copyright.textContent = `© ${new Date().getFullYear()} - All rights reserved`;
        expandedContent.appendChild(copyright);

        // Memorizza il riferimento al contenuto espanso
        this._expandedContent = expandedContent;

        // Add hover effects
        this._panel.addEventListener('mouseenter', () => {
            this._panel.style.transform = 'scale(1.02)';
            expandedContent.style.marginTop = '8px';
            expandedContent.style.maxHeight = '200px';
            expandedContent.style.opacity = '1';
            
            // Ingrandisci il logo
            if (this._logoElement) {
                this._logoElement.style.width = '26px';
                this._logoElement.style.height = '26px';
            }
        });

        this._panel.addEventListener('mouseleave', () => {
            this._panel.style.transform = 'scale(1)';
            expandedContent.style.marginTop = '0';
            expandedContent.style.maxHeight = '0';
            expandedContent.style.opacity = '0';
            
            // Ripristina dimensione logo
            if (this._logoElement) {
                this._logoElement.style.width = '24px';
                this._logoElement.style.height = '24px';
            }
        });

        this._panel.appendChild(wrapper);
        this._panel.appendChild(expandedContent);
        this._container.appendChild(this._panel);
        
        return this._container;
    }

    async _loadLogo() {
        try {
            // URL fisso del logo, indipendentemente dal tema
            const logoUrl = 'https://raw.githubusercontent.com/latidudemaps/GeologiaVDA/main/data/logo_color.svg';
                
            const response = await fetch(logoUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
            }
            
            const svgText = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            
            if (svgElement) {
                // Imposta le dimensioni e lo stile dell'SVG
                svgElement.setAttribute('width', '24');
                svgElement.setAttribute('height', '24');
                svgElement.style.transition = 'all 0.3s ease';
                
                // Salva un riferimento all'elemento SVG
                this._logoElement = svgElement;
                
                // Svuota il contenitore e aggiungi il nuovo logo
                if (this._logoContainer) {
                    this._logoContainer.innerHTML = '';
                    this._logoContainer.appendChild(svgElement);
                }
            } else {
                throw new Error('SVG element not found in response');
            }
        } catch (error) {
            console.error('Error loading logo:', error);
            
            // In caso di errore, mostra un fallback
            if (this._logoContainer) {
                this._logoContainer.innerHTML = '';
                
                const fallback = document.createElement('div');
                fallback.textContent = '🗺️';
                fallback.style.fontSize = '20px';
                
                this._logoContainer.appendChild(fallback);
            }
        }
    }

    _createLink({ icon, text, url }) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'flex';
        link.style.alignItems = 'center';
        link.style.gap = '8px';
        link.style.textDecoration = 'none';
        link.style.padding = '4px 0';
        link.style.transition = 'all 0.2s ease';
        
        const iconSvg = this._getSocialIcon(icon);
        if (iconSvg) {
            link.appendChild(iconSvg);
        }

        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        link.appendChild(textSpan);
        
        // Gli stili di colore sono gestiti dalle classi CSS
        
        return link;
    }

    _getSocialIcon(type) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        switch (type) {
            case 'github':
                svg.innerHTML = `<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>`;
                break;
            case 'link':
                svg.innerHTML = `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`;
                break;
            case 'globe':
                svg.innerHTML = `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`;
                break;
            case 'book':
                svg.innerHTML = `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>`;
                break;
            default:
                return null;
        }

        return svg;
    }

    onRemove() {
        if (this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._map = null;
    }
}

export default CopyrightControl;