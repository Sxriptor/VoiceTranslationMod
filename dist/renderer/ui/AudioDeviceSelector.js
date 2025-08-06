export class AudioDeviceSelector {
    constructor(deviceService, configManager, containerId) {
        this.deviceService = deviceService;
        this.configManager = configManager;
        this.createUI(containerId);
        this.setupEventListeners();
        this.loadSavedDevice();
    }
    createUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        container.innerHTML = `
      <div class="audio-device-selector">
        <label for="device-select" class="device-label">
          <i class="icon-microphone"></i>
          Microphone Device:
        </label>
        <div class="device-controls">
          <select id="device-select" class="device-select">
            <option value="">Loading devices...</option>
          </select>
          <button id="refresh-devices" class="refresh-button" title="Refresh device list">
            <i class="icon-refresh"></i>
          </button>
          <div id="device-status" class="device-status">
            <span class="status-indicator"></span>
            <span class="status-text">Not connected</span>
          </div>
        </div>
      </div>
    `;
        this.selectElement = container.querySelector('#device-select');
        this.refreshButton = container.querySelector('#refresh-devices');
        this.statusIndicator = container.querySelector('#device-status');
    }
    setupEventListeners() {
        // Device selection change
        this.selectElement.addEventListener('change', async (event) => {
            const target = event.target;
            const deviceId = target.value;
            if (deviceId) {
                await this.selectDevice(deviceId);
            }
        });
        // Refresh button
        this.refreshButton.addEventListener('click', async () => {
            await this.refreshDevices();
        });
        // Device service events
        this.deviceService.on('devicesUpdated', (devices) => {
            this.updateDeviceList(devices);
        });
        this.deviceService.on('devicesAdded', (devices) => {
            this.showNotification(`${devices.length} new audio device(s) detected`, 'info');
            this.updateDeviceList(this.deviceService.getAvailableDevices());
        });
        this.deviceService.on('devicesRemoved', (devices) => {
            this.showNotification(`${devices.length} audio device(s) disconnected`, 'warning');
            this.updateDeviceList(this.deviceService.getAvailableDevices());
            // Check if selected device was removed
            const selectedDeviceId = this.selectElement.value;
            const removedIds = devices.map(d => d.deviceId);
            if (removedIds.includes(selectedDeviceId)) {
                this.handleDeviceDisconnection();
            }
        });
        this.deviceService.on('enumerationError', (error) => {
            this.updateStatus('error', 'Failed to load devices');
            console.error('Device enumeration error:', error);
        });
    }
    async loadSavedDevice() {
        try {
            const config = await this.configManager.getConfiguration();
            const savedDeviceId = config.selectedMicrophone;
            // Load initial device list
            await this.refreshDevices();
            if (savedDeviceId) {
                const device = this.deviceService.getDeviceById(savedDeviceId);
                if (device) {
                    this.selectElement.value = savedDeviceId;
                    await this.testSelectedDevice();
                }
                else {
                    // Saved device not found, select default
                    await this.selectDefaultDevice();
                }
            }
            else {
                await this.selectDefaultDevice();
            }
        }
        catch (error) {
            console.error('Failed to load saved device:', error);
            await this.selectDefaultDevice();
        }
    }
    async refreshDevices() {
        this.refreshButton.disabled = true;
        this.updateStatus('loading', 'Refreshing devices...');
        try {
            await this.deviceService.refreshDevices();
        }
        catch (error) {
            this.updateStatus('error', 'Failed to refresh devices');
            console.error('Failed to refresh devices:', error);
        }
        finally {
            this.refreshButton.disabled = false;
        }
    }
    updateDeviceList(devices) {
        const currentValue = this.selectElement.value;
        // Clear existing options
        this.selectElement.innerHTML = '';
        if (devices.length === 0) {
            this.selectElement.innerHTML = '<option value="">No microphones found</option>';
            this.updateStatus('error', 'No devices available');
            return;
        }
        // Add device options
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label;
            if (device.isDefault) {
                option.textContent += ' (Default)';
            }
            this.selectElement.appendChild(option);
        });
        // Restore selection if device still exists
        if (currentValue && devices.some(d => d.deviceId === currentValue)) {
            this.selectElement.value = currentValue;
        }
        else if (devices.length > 0) {
            // Select default or first device
            const defaultDevice = devices.find(d => d.isDefault) || devices[0];
            this.selectElement.value = defaultDevice.deviceId;
        }
        this.updateStatus('ready', `${devices.length} device(s) available`);
    }
    async selectDevice(deviceId) {
        try {
            this.updateStatus('testing', 'Testing device...');
            const isWorking = await this.deviceService.testDevice(deviceId);
            if (isWorking) {
                // Save selection to configuration
                const config = await this.configManager.getConfiguration();
                config.selectedMicrophone = deviceId;
                await this.configManager.saveConfiguration(config);
                this.updateStatus('connected', 'Device ready');
                // Emit device selected event
                const device = this.deviceService.getDeviceById(deviceId);
                if (device) {
                    this.dispatchEvent(new CustomEvent('deviceSelected', { detail: device }));
                }
            }
            else {
                this.updateStatus('error', 'Device test failed');
                this.showNotification('Selected device is not working properly', 'error');
            }
        }
        catch (error) {
            this.updateStatus('error', 'Device selection failed');
            console.error('Device selection error:', error);
        }
    }
    async selectDefaultDevice() {
        const defaultDevice = this.deviceService.getDefaultDevice();
        if (defaultDevice) {
            this.selectElement.value = defaultDevice.deviceId;
            await this.selectDevice(defaultDevice.deviceId);
        }
    }
    async testSelectedDevice() {
        const selectedDeviceId = this.selectElement.value;
        if (selectedDeviceId) {
            await this.selectDevice(selectedDeviceId);
        }
    }
    handleDeviceDisconnection() {
        this.updateStatus('disconnected', 'Device disconnected');
        this.showNotification('Selected microphone was disconnected', 'warning');
        // Try to select a new default device
        setTimeout(async () => {
            await this.selectDefaultDevice();
        }, 1000);
    }
    updateStatus(status, message) {
        const indicator = this.statusIndicator.querySelector('.status-indicator');
        const text = this.statusIndicator.querySelector('.status-text');
        // Remove all status classes
        indicator.className = 'status-indicator';
        // Add current status class
        indicator.classList.add(`status-${status}`);
        text.textContent = message;
    }
    showNotification(message, type) {
        // Create a simple notification (you might want to integrate with a proper notification system)
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    dispatchEvent(event) {
        this.selectElement.dispatchEvent(event);
    }
    getSelectedDevice() {
        const selectedId = this.selectElement.value;
        return selectedId ? this.deviceService.getDeviceById(selectedId) : null;
    }
    startMonitoring() {
        this.deviceService.startDeviceMonitoring();
    }
    stopMonitoring() {
        this.deviceService.stopDeviceMonitoring();
    }
    dispose() {
        this.stopMonitoring();
        this.deviceService.removeAllListeners();
    }
}
//# sourceMappingURL=AudioDeviceSelector.js.map