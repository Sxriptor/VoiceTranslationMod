/**
 * API Key Management Modal
 */
export class ApiKeyModal {
    constructor() {
        this.modal = null;
    }
    /**
     * Show the API key management modal
     */
    show(currentKeys, onSave) {
        this.onSave = onSave;
        this.createModal(currentKeys);
        document.body.appendChild(this.modal);
        this.modal.style.display = 'flex';
    }
    /**
     * Hide the modal
     */
    hide() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
            this.modal = null;
        }
    }
    /**
     * Create the modal HTML structure
     */
    createModal(currentKeys) {
        this.modal = document.createElement('div');
        this.modal.className = 'api-key-modal';
        this.modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>🔑 API Key Management</h2>
            <button class="close-button" type="button">&times;</button>
          </div>
          
          <div class="modal-body">
            <p class="modal-description">
              Configure your API keys for the translation services. These keys are stored locally and encrypted.
            </p>
            
            <div class="api-key-section">
              <div class="api-key-group">
                <label for="openai-key">
                  <span class="service-icon">🤖</span>
                  OpenAI API Key
                  <span class="required">*</span>
                </label>
                <div class="input-group">
                  <input 
                    type="password" 
                    id="openai-key" 
                    placeholder="sk-..." 
                    value="${currentKeys.openai === '***' ? '' : currentKeys.openai}"
                  />
                  <button type="button" class="toggle-visibility" data-target="openai-key">👁️</button>
                  <button type="button" class="validate-key" data-service="openai">✓</button>
                </div>
                <div class="validation-status" id="openai-status"></div>
                <small class="help-text">
                  Required for speech-to-text and translation. Get your key from 
                  <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>
                </small>
              </div>

              <div class="api-key-group">
                <label for="elevenlabs-key">
                  <span class="service-icon">🎙️</span>
                  ElevenLabs API Key
                  <span class="required">*</span>
                </label>
                <div class="input-group">
                  <input 
                    type="password" 
                    id="elevenlabs-key" 
                    placeholder="32-character hex string" 
                    value="${currentKeys.elevenlabs === '***' ? '' : currentKeys.elevenlabs}"
                  />
                  <button type="button" class="toggle-visibility" data-target="elevenlabs-key">👁️</button>
                  <button type="button" class="validate-key" data-service="elevenlabs">✓</button>
                </div>
                <div class="validation-status" id="elevenlabs-status"></div>
                <small class="help-text">
                  Required for voice cloning and text-to-speech. Get your key from 
                  <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank">ElevenLabs</a>
                </small>
              </div>

              <div class="api-key-group">
                <label for="google-key">
                  <span class="service-icon">🌐</span>
                  Google Translate API Key
                  <span class="optional">(Optional)</span>
                </label>
                <div class="input-group">
                  <input 
                    type="password" 
                    id="google-key" 
                    placeholder="AIza..." 
                    value="${currentKeys.google === '***' ? '' : (currentKeys.google || '')}"
                  />
                  <button type="button" class="toggle-visibility" data-target="google-key">👁️</button>
                  <button type="button" class="validate-key" data-service="google">✓</button>
                </div>
                <div class="validation-status" id="google-status"></div>
                <small class="help-text">
                  Fallback translation service. Get your key from 
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>
                </small>
              </div>

              <div class="api-key-group">
                <label for="deepl-key">
                  <span class="service-icon">🔄</span>
                  DeepL API Key
                  <span class="optional">(Optional)</span>
                </label>
                <div class="input-group">
                  <input 
                    type="password" 
                    id="deepl-key" 
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx" 
                    value="${currentKeys.deepl === '***' ? '' : (currentKeys.deepl || '')}"
                  />
                  <button type="button" class="toggle-visibility" data-target="deepl-key">👁️</button>
                  <button type="button" class="validate-key" data-service="deepl">✓</button>
                </div>
                <div class="validation-status" id="deepl-status"></div>
                <small class="help-text">
                  High-quality translation service. Get your key from 
                  <a href="https://www.deepl.com/account/summary" target="_blank">DeepL Account</a>
                </small>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="cancel-button">Cancel</button>
            <button type="button" class="btn-primary" id="save-button">Save API Keys</button>
          </div>
        </div>
      </div>
    `;
        this.addModalStyles();
        this.attachEventListeners();
    }
    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('api-key-modal-styles')) {
            return; // Styles already added
        }
        const styles = document.createElement('style');
        styles.id = 'api-key-modal-styles';
        styles.textContent = `
      .api-key-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: none;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid #e1e5e9;
      }

      .modal-header h2 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0.5rem;
        border-radius: 4px;
      }

      .close-button:hover {
        background: #f5f5f5;
        color: #333;
      }

      .modal-body {
        padding: 2rem;
      }

      .modal-description {
        margin-bottom: 2rem;
        color: #666;
        line-height: 1.5;
      }

      .api-key-group {
        margin-bottom: 2rem;
      }

      .api-key-group label {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }

      .service-icon {
        margin-right: 0.5rem;
        font-size: 1.2rem;
      }

      .required {
        color: #e74c3c;
        margin-left: 0.25rem;
      }

      .optional {
        color: #7f8c8d;
        margin-left: 0.25rem;
        font-weight: normal;
        font-size: 0.9rem;
      }

      .input-group {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .input-group input {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid #e1e5e9;
        border-radius: 6px;
        font-size: 1rem;
        font-family: monospace;
      }

      .input-group input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .toggle-visibility,
      .validate-key {
        padding: 0.75rem;
        border: 2px solid #e1e5e9;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 1rem;
      }

      .toggle-visibility:hover,
      .validate-key:hover {
        background: #f8f9fa;
        border-color: #667eea;
      }

      .validation-status {
        min-height: 1.5rem;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }

      .validation-status.success {
        color: #27ae60;
      }

      .validation-status.error {
        color: #e74c3c;
      }

      .validation-status.loading {
        color: #3498db;
      }

      .help-text {
        color: #7f8c8d;
        font-size: 0.85rem;
        line-height: 1.4;
      }

      .help-text a {
        color: #667eea;
        text-decoration: none;
      }

      .help-text a:hover {
        text-decoration: underline;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem 2rem;
        border-top: 1px solid #e1e5e9;
        background: #f8f9fa;
        border-radius: 0 0 12px 12px;
      }

      .btn-secondary,
      .btn-primary {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-secondary {
        background: #e9ecef;
        color: #495057;
      }

      .btn-secondary:hover {
        background: #dee2e6;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
    `;
        document.head.appendChild(styles);
    }
    /**
     * Attach event listeners to modal elements
     */
    attachEventListeners() {
        if (!this.modal)
            return;
        // Close button
        const closeButton = this.modal.querySelector('.close-button');
        closeButton?.addEventListener('click', () => this.hide());
        // Cancel button
        const cancelButton = this.modal.querySelector('#cancel-button');
        cancelButton?.addEventListener('click', () => this.hide());
        // Save button
        const saveButton = this.modal.querySelector('#save-button');
        saveButton?.addEventListener('click', () => this.handleSave());
        // Toggle visibility buttons
        const toggleButtons = this.modal.querySelectorAll('.toggle-visibility');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target.dataset.target;
                if (target) {
                    this.togglePasswordVisibility(target);
                }
            });
        });
        // Validate key buttons
        const validateButtons = this.modal.querySelectorAll('.validate-key');
        validateButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                if (service) {
                    this.validateApiKey(service);
                }
            });
        });
        // Close on overlay click
        const overlay = this.modal.querySelector('.modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
            }
        });
    }
    /**
     * Toggle password visibility for an input
     */
    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }
    /**
     * Validate an API key
     */
    async validateApiKey(service) {
        const input = document.getElementById(`${service}-key`);
        const status = document.getElementById(`${service}-status`);
        if (!input || !status)
            return;
        const apiKey = input.value.trim();
        if (!apiKey) {
            status.textContent = 'Please enter an API key';
            status.className = 'validation-status error';
            return;
        }
        status.textContent = 'Validating...';
        status.className = 'validation-status loading';
        try {
            // Use the electronAPI to validate the key
            const response = await window.electronAPI.invoke('config:validate-api-key', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: { service, apiKey }
            });
            if (response.success && response.payload.valid) {
                status.textContent = '✓ Valid API key';
                status.className = 'validation-status success';
            }
            else {
                status.textContent = `✗ ${response.payload.error || 'Invalid API key'}`;
                status.className = 'validation-status error';
            }
        }
        catch (error) {
            status.textContent = '✗ Validation failed';
            status.className = 'validation-status error';
        }
    }
    /**
     * Handle save button click
     */
    handleSave() {
        const apiKeys = {};
        // Collect all API keys
        const services = ['openai', 'elevenlabs', 'google', 'deepl'];
        services.forEach(service => {
            const input = document.getElementById(`${service}-key`);
            if (input && input.value.trim()) {
                apiKeys[service] = input.value.trim();
            }
        });
        // Call the save callback
        if (this.onSave) {
            this.onSave(apiKeys);
        }
        this.hide();
    }
}
//# sourceMappingURL=ApiKeyModal.js.map