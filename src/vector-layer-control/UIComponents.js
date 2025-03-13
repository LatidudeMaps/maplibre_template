/**
 * Aggiunge gli stili CSS necessari per il controllo
 */
export function addStyles() {
    if (!document.getElementById('vector-layer-control-styles')) {
        const style = document.createElement('style');
        style.id = 'vector-layer-control-styles';
        style.innerHTML = `
            /* Applica il font "Source Sans 3" a tutti gli elementi del controllo */
            .vector-layer-dropdown,
            .vector-layer-option,
            .vector-layer-message,
            .vector-layer-dialog,
            .vector-layer-dialog h3,
            .vector-layer-dialog input,
            .vector-layer-dialog select,
            .vector-layer-dialog textarea,
            .vector-layer-dialog button,
            .layer-item,
            .layer-item button,
            .maplibregl-popup-content,
            .layer-empty,
            .vector-layer-panel,
            .vector-layer-panel-header,
            .vector-layer-panel-content,
            .vector-layer-panel-item,
            .vector-layer-panel-label,
            .vector-layer-panel-empty {
                font-family: "Source Sans 3", "Helvetica Neue", Arial, Helvetica, sans-serif;
            }
            
            .vector-layer-dropdown {
                position: absolute;
                right: 0;
                top: 40px;
                background: white;
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                z-index: 100;
                min-width: 150px;
            }
            .vector-layer-option {
                padding: 8px 12px;
                cursor: pointer;
            }
            .vector-layer-option:hover {
                background-color: #f5f5f5;
            }
            .dark .vector-layer-dropdown {
                background: #111725;
                color: #cbd5e1;
            }
            .dark .vector-layer-option {
                color: #cbd5e1;
            }
            .dark .vector-layer-option:hover {
                background-color: #2c333d;
            }
            .vector-layer-message {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.9);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 80%;
                text-align: center;
                transition: opacity 0.3s ease;
            }
            .vector-layer-message.info {
                background-color: rgba(33, 150, 243, 0.9);
                color: white;
            }
            .vector-layer-message.error {
                background-color: rgba(244, 67, 54, 0.9);
                color: white;
            }
            .vector-layer-message.success {
                background-color: rgba(76, 175, 80, 0.9);
                color: white;
            }
            .dark .vector-layer-message {
                background-color: rgba(20, 25, 35, 0.9);
                color: #cbd5e1;
            }
            
            /* Stili per il pannello dei layer */
            .vector-layer-panel {
                position: absolute;
                width: 250px;
                max-height: 80vh;
                background: white;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
                z-index: 99;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .dark .vector-layer-panel {
                background: #111725;
                color: #cbd5e1;
                box-shadow: 0 0 0 2px rgb(0 0 0 / 35%);
            }
            .vector-layer-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #f8f8f8;
                border-bottom: 1px solid #ddd;
                user-select: none;
            }
            .dark .vector-layer-panel-header {
                background: #414853;
                border-bottom-color: #323436;
            }
            .vector-layer-panel-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            .dark .vector-layer-panel-header h3 {
                color: #cbd5e1;
            }
            .vector-layer-panel-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                color: #666;
            }
            .dark .vector-layer-panel-close {
                color: #cbd5e1;
            }
            .vector-layer-panel-content {
                padding: 10px;
                overflow-y: auto;
                max-height: calc(80vh - 50px);
            }
            .vector-layer-panel-empty {
                padding: 15px 0;
                text-align: center;
                color: #888;
            }
            .dark .vector-layer-panel-empty {
                color: #8b9cb3;
            }
            .vector-layer-panel-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .vector-layer-panel-item {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .dark .vector-layer-panel-item {
                border-bottom-color: #323436;
            }
            .vector-layer-panel-item:last-child {
                border-bottom: none;
            }
            .vector-layer-panel-item input[type="checkbox"] {
                margin-right: 10px;
            }
            .vector-layer-panel-label {
                flex-grow: 1;
                margin-right: 10px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
            }
            .dark .vector-layer-panel-label {
                color: #cbd5e1;
            }
            .vector-layer-panel-remove {
                background: none;
                border: none;
                color: #f44336;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                margin: 0;
                line-height: 1;
            }
            .dark .vector-layer-panel-remove {
                color: #ff6b6b;
            }
            
            .vector-layer-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                max-width: 500px;
                width: 90%;
            }
            .dark .vector-layer-dialog {
                background: #111725;
                color: #cbd5e1;
                box-shadow: 0 0 0 2px rgb(0 0 0 / 35%);
            }
            .vector-layer-dialog h3 {
                margin-top: 0;
            }
            .dark .vector-layer-dialog h3 {
                color: #cbd5e1;
            }
            .vector-layer-dialog input,
            .vector-layer-dialog select,
            .vector-layer-dialog textarea {
                width: 100%;
                padding: 8px;
                margin: 8px 0;
                border-radius: 4px;
                border: 1px solid #ddd;
                box-sizing: border-box;
            }
            .dark .vector-layer-dialog input,
            .dark .vector-layer-dialog select,
            .dark .vector-layer-dialog textarea {
                background: #323436;
                color: #cbd5e1;
                border: 1px solid #414853;
            }
            .vector-layer-dialog-buttons {
                display: flex;
                justify-content: flex-end;
                margin-top: 15px;
            }
            .vector-layer-dialog-buttons button {
                padding: 8px 15px;
                margin-left: 10px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
            .vector-layer-dialog-buttons button.cancel {
                background: #f5f5f5;
            }
            .vector-layer-dialog-buttons button.confirm {
                background: #0078ff;
                color: white;
            }
            .dark .vector-layer-dialog-buttons button.cancel {
                background: #414853;
                color: #cbd5e1;
            }
            .vector-layer-dialog-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
            }
            .layer-list {
                max-height: 300px;
                overflow-y: auto;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .dark .layer-list {
                border-color: #414853;
            }
            .layer-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
            }
            .dark .layer-item {
                border-bottom-color: #323436;
                color: #cbd5e1;
            }
            .layer-item:last-child {
                border-bottom: none;
            }
            .layer-item button {
                background: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
            }
            .layer-item button:hover {
                background: #d32f2f;
            }
            .layer-empty {
                padding: 15px;
                text-align: center;
                color: #888;
            }
            .dark .layer-empty {
                color: #8b9cb3;
            }
            .vector-loading-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid rgba(0, 120, 255, 0.3);
                border-radius: 50%;
                border-top-color: #0078ff;
                animation: vector-spin 1s linear infinite;
                margin-right: 8px;
            }
            .dark .vector-loading-indicator {
                border: 2px solid rgba(0, 120, 255, 0.3);
                border-top-color: #0078ff;
            }
            @keyframes vector-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Mostra un dialog personalizzato
 * @param {Object} options - Opzioni del dialog
 */
export function showDialog(options) {
    // Creare il backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'vector-layer-dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // Creare il dialog
    const dialog = document.createElement('div');
    dialog.className = 'vector-layer-dialog';
    
    // Titolo
    let content = `<h3>${options.title}</h3>`;
    
    // Campi
    options.fields.forEach(field => {
        content += `<div>
            <label for="${field.id}">${field.label}:</label>`;
            
        if (field.type === 'select') {
            content += `<select id="${field.id}">
                ${field.options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('')}
            </select>`;
        } else if (field.type === 'textarea') {
            content += `<textarea id="${field.id}" placeholder="${field.placeholder || ''}"></textarea>`;
        } else {
            content += `<input type="${field.type}" id="${field.id}" placeholder="${field.placeholder || ''}">`;
        }
        
        content += `</div>`;
    });
    
    // Pulsanti
    content += `<div class="vector-layer-dialog-buttons">
        <button class="cancel">Annulla</button>
        <button class="confirm">Conferma</button>
    </div>`;
    
    dialog.innerHTML = content;
    document.body.appendChild(dialog);
    
    // Gestione degli eventi
    const cancelBtn = dialog.querySelector('button.cancel');
    const confirmBtn = dialog.querySelector('button.confirm');
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        document.body.removeChild(backdrop);
    });
    
    confirmBtn.addEventListener('click', () => {
        const values = {};
        
        options.fields.forEach(field => {
            values[field.id] = dialog.querySelector(`#${field.id}`).value;
        });
        
        options.onConfirm(values);
        
        document.body.removeChild(dialog);
        document.body.removeChild(backdrop);
    });
}

/**
 * Crea un dialog personalizzato con HTML
 * @param {Object} options - Opzioni del dialog
 * @returns {HTMLElement} - Elemento del dialog
 */
export function createDialog(options) {
    // Creare il backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'vector-layer-dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // Creare il dialog
    const dialog = document.createElement('div');
    dialog.className = 'vector-layer-dialog';
    
    // Titolo e contenuto
    dialog.innerHTML = `
        <h3>${options.title}</h3>
        ${options.content}
    `;
    
    document.body.appendChild(dialog);
    
    return dialog;
}

/**
 * Mostra un messaggio
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - Tipo di messaggio (info, error, success)
 */
export function showMessage(message, type = 'info') {
    let messageElement = document.querySelector('.vector-layer-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = `vector-layer-message ${type}`;
        document.body.appendChild(messageElement);
    } else {
        messageElement.className = `vector-layer-message ${type}`;
    }
    
    messageElement.textContent = message;
    messageElement.style.opacity = '1';
    
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}

/**
 * Mostra un messaggio di caricamento
 * @param {string} message - Messaggio da mostrare
 */
export function showLoadingMessage(message) {
    let loadingElement = document.querySelector('.vector-layer-loading');
    
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'vector-layer-message info vector-layer-loading';
        
        const spinner = document.createElement('span');
        spinner.className = 'vector-loading-indicator';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        
        loadingElement.appendChild(spinner);
        loadingElement.appendChild(textSpan);
        
        document.body.appendChild(loadingElement);
    } else {
        const textSpan = loadingElement.querySelector('span:not(.vector-loading-indicator)');
        if (textSpan) {
            textSpan.textContent = message;
        }
    }
    
    loadingElement.style.opacity = '1';
}

/**
 * Nasconde il messaggio di caricamento
 */
export function hideLoadingMessage() {
    const loadingElement = document.querySelector('.vector-layer-loading');
    
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
            if (loadingElement.parentNode) {
                loadingElement.parentNode.removeChild(loadingElement);
            }
        }, 300);
    }
}