export class AudioCaptureControls {
    constructor(captureService, voiceDetector, processingPipeline, containerId) {
        this.isRecording = false;
        this.audioLevels = [];
        this.animationFrame = null;
        this.captureService = captureService;
        this.voiceDetector = voiceDetector;
        this.processingPipeline = processingPipeline;
        this.createUI(containerId);
        this.setupEventListeners();
    }
    createUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        container.innerHTML = `
      <div class="audio-capture-controls">
        <div class="control-buttons">
          <button id="start-capture" class="capture-button start-button">
            <i class="icon-microphone"></i>
            <span>Start Recording</span>
          </button>
          <button id="stop-capture" class="capture-button stop-button" disabled>
            <i class="icon-stop"></i>
            <span>Stop Recording</span>
          </button>
        </div>
        
        <div class="audio-status">
          <div id="status-indicator" class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">Ready to record</span>
          </div>
          
          <div id="voice-indicator" class="voice-indicator">
            <i class="icon-voice"></i>
            <span class="voice-text">No voice detected</span>
          </div>
        </div>
        
        <div class="audio-levels">
          <label class="level-label">Audio Level:</label>
          <div id="level-meter" class="level-meter">
            <div id="level-bar" class="level-bar"></div>
            <div class="level-markers">
              <span class="marker low">Low</span>
              <span class="marker medium">Medium</span>
              <span class="marker high">High</span>
            </div>
          </div>
          <div class="level-info">
            <span id="level-value" class="level-value">0%</span>
            <span id="peak-value" class="peak-value">Peak: 0%</span>
          </div>
        </div>
      </div>
    `;
        // Get references to UI elements
        this.startButton = container.querySelector('#start-capture');
        this.stopButton = container.querySelector('#stop-capture');
        this.statusIndicator = container.querySelector('#status-indicator');
        this.levelMeter = container.querySelector('#level-meter');
        this.levelBar = container.querySelector('#level-bar');
        this.voiceIndicator = container.querySelector('#voice-indicator');
    }
    setupEventListeners() {
        // Button event listeners
        this.startButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        // Capture service events
        this.captureService.on('captureStarted', () => {
            this.updateRecordingState(true);
            this.startLevelMonitoring();
        });
        this.captureService.on('captureStopped', () => {
            this.updateRecordingState(false);
            this.stopLevelMonitoring();
        });
        this.captureService.on('audioData', (audioData) => {
            this.updateAudioLevels(audioData);
        });
        this.captureService.on('audioSegment', async (segment) => {
            // Process segment through pipeline and voice detection
            try {
                const processedSegment = await this.processingPipeline.processSegment(segment);
                const voiceActivity = this.voiceDetector.analyzeSegment(processedSegment);
                this.updateVoiceIndicator(voiceActivity);
            }
            catch (error) {
                console.error('Error processing audio segment:', error);
            }
        });
        // Voice detector events
        this.voiceDetector.on('voiceStarted', (event) => {
            this.updateVoiceStatus('Voice detected', 'active');
        });
        this.voiceDetector.on('voiceEnded', (event) => {
            this.updateVoiceStatus('Voice ended', 'inactive');
        });
        this.voiceDetector.on('activityUpdate', (activity) => {
            this.updateVoiceIndicator(activity);
        });
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && event.ctrlKey) {
                event.preventDefault();
                if (this.isRecording) {
                    this.stopRecording();
                }
                else {
                    this.startRecording();
                }
            }
        });
    }
    async startRecording() {
        try {
            this.updateStatus('Starting...', 'loading');
            this.startButton.disabled = true;
            await this.captureService.startCapture();
        }
        catch (error) {
            console.error('Failed to start recording:', error);
            this.updateStatus('Failed to start recording', 'error');
            this.startButton.disabled = false;
            // Show user-friendly error message
            this.showErrorMessage(error);
        }
    }
    async stopRecording() {
        try {
            this.updateStatus('Stopping...', 'loading');
            this.stopButton.disabled = true;
            await this.captureService.stopCapture();
        }
        catch (error) {
            console.error('Failed to stop recording:', error);
            this.updateStatus('Failed to stop recording', 'error');
        }
        finally {
            this.stopButton.disabled = false;
        }
    }
    updateRecordingState(isRecording) {
        this.isRecording = isRecording;
        this.startButton.disabled = isRecording;
        this.stopButton.disabled = !isRecording;
        if (isRecording) {
            this.updateStatus('Recording...', 'recording');
            this.startButton.classList.add('recording');
        }
        else {
            this.updateStatus('Ready to record', 'ready');
            this.startButton.classList.remove('recording');
            this.resetAudioLevels();
        }
    }
    updateStatus(message, status) {
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        const statusText = this.statusIndicator.querySelector('.status-text');
        // Remove all status classes
        statusDot.className = 'status-dot';
        // Add current status class
        statusDot.classList.add(`status-${status}`);
        statusText.textContent = message;
    }
    updateVoiceStatus(message, status) {
        const voiceText = this.voiceIndicator.querySelector('.voice-text');
        const voiceIcon = this.voiceIndicator.querySelector('i');
        voiceText.textContent = message;
        // Update voice indicator styling
        this.voiceIndicator.className = 'voice-indicator';
        this.voiceIndicator.classList.add(`voice-${status}`);
        if (status === 'active') {
            voiceIcon.className = 'icon-voice-active';
        }
        else {
            voiceIcon.className = 'icon-voice';
        }
    }
    updateVoiceIndicator(activity) {
        const confidence = Math.round(activity.confidence * 100);
        if (activity.isVoiceActive) {
            this.updateVoiceStatus(`Voice active (${confidence}%)`, 'active');
        }
        else {
            this.updateVoiceStatus('Listening...', 'inactive');
        }
    }
    updateAudioLevels(audioData) {
        // Calculate volume level
        let sum = 0;
        for (let i = 0; i < audioData.data.length; i++) {
            sum += Math.abs(audioData.data[i]);
        }
        const volume = sum / audioData.data.length;
        // Add to recent levels for averaging
        this.audioLevels.push(volume);
        if (this.audioLevels.length > 10) {
            this.audioLevels.shift();
        }
        // Calculate average and peak
        const average = this.audioLevels.reduce((a, b) => a + b, 0) / this.audioLevels.length;
        const peak = Math.max(...this.audioLevels);
        this.updateLevelDisplay({ volume, peak, average });
    }
    updateLevelDisplay(levels) {
        const volumePercent = Math.min(100, levels.volume * 1000); // Scale for display
        const peakPercent = Math.min(100, levels.peak * 1000);
        // Update level bar
        this.levelBar.style.width = `${volumePercent}%`;
        // Update level bar color based on volume
        this.levelBar.className = 'level-bar';
        if (volumePercent > 70) {
            this.levelBar.classList.add('level-high');
        }
        else if (volumePercent > 30) {
            this.levelBar.classList.add('level-medium');
        }
        else {
            this.levelBar.classList.add('level-low');
        }
        // Update text displays
        const levelValue = document.getElementById('level-value');
        const peakValue = document.getElementById('peak-value');
        if (levelValue)
            levelValue.textContent = `${Math.round(volumePercent)}%`;
        if (peakValue)
            peakValue.textContent = `Peak: ${Math.round(peakPercent)}%`;
    }
    startLevelMonitoring() {
        const updateLevels = () => {
            if (this.isRecording) {
                this.animationFrame = requestAnimationFrame(updateLevels);
            }
        };
        updateLevels();
    }
    stopLevelMonitoring() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    resetAudioLevels() {
        this.audioLevels = [];
        this.updateLevelDisplay({ volume: 0, peak: 0, average: 0 });
    }
    showErrorMessage(error) {
        let message = 'An unknown error occurred';
        if (error.message.includes('Permission denied')) {
            message = 'Microphone access denied. Please enable microphone permissions and try again.';
        }
        else if (error.message.includes('NotFound')) {
            message = 'No microphone found. Please connect a microphone and try again.';
        }
        else if (error.message.includes('NotReadable')) {
            message = 'Microphone is in use by another application. Please close other applications and try again.';
        }
        else {
            message = `Recording failed: ${error.message}`;
        }
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
      <div class="notification-content">
        <i class="icon-error"></i>
        <span>${message}</span>
        <button class="close-notification">&times;</button>
      </div>
    `;
        document.body.appendChild(notification);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        // Manual close
        const closeButton = notification.querySelector('.close-notification');
        closeButton?.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    getRecordingState() {
        return this.isRecording;
    }
    dispose() {
        this.stopLevelMonitoring();
        this.captureService.removeAllListeners();
        this.voiceDetector.removeAllListeners();
    }
}
//# sourceMappingURL=AudioCaptureControls.js.map