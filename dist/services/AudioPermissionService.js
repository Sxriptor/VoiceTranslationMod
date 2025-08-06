"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioPermissionService = exports.PermissionStatus = void 0;
const events_1 = require("events");
var PermissionStatus;
(function (PermissionStatus) {
    PermissionStatus["GRANTED"] = "granted";
    PermissionStatus["DENIED"] = "denied";
    PermissionStatus["PROMPT"] = "prompt";
    PermissionStatus["UNKNOWN"] = "unknown";
})(PermissionStatus || (exports.PermissionStatus = PermissionStatus = {}));
class AudioPermissionService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.currentStatus = PermissionStatus.UNKNOWN;
    }
    async requestMicrophonePermission() {
        try {
            // Check if permissions API is available
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'microphone' });
                this.currentStatus = permission.state;
                permission.addEventListener('change', () => {
                    this.currentStatus = permission.state;
                    this.emit('permissionChanged', this.currentStatus);
                });
            }
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately as we only needed permission
            stream.getTracks().forEach(track => track.stop());
            this.currentStatus = PermissionStatus.GRANTED;
            this.emit('permissionGranted');
            return {
                status: PermissionStatus.GRANTED,
                message: 'Microphone permission granted successfully'
            };
        }
        catch (error) {
            this.currentStatus = PermissionStatus.DENIED;
            this.emit('permissionDenied', error);
            return {
                status: PermissionStatus.DENIED,
                message: this.getPermissionErrorMessage(error)
            };
        }
    }
    async checkPermissionStatus() {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'microphone' });
                this.currentStatus = permission.state;
                return this.currentStatus;
            }
            // Fallback: try to access microphone briefly
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            this.currentStatus = PermissionStatus.GRANTED;
            return PermissionStatus.GRANTED;
        }
        catch (error) {
            this.currentStatus = PermissionStatus.DENIED;
            return PermissionStatus.DENIED;
        }
    }
    getCurrentStatus() {
        return this.currentStatus;
    }
    getPermissionErrorMessage(error) {
        if (error.name === 'NotAllowedError') {
            return 'Microphone access was denied. Please enable microphone permissions in your browser settings and try again.';
        }
        else if (error.name === 'NotFoundError') {
            return 'No microphone device found. Please connect a microphone and try again.';
        }
        else if (error.name === 'NotReadableError') {
            return 'Microphone is already in use by another application. Please close other applications using the microphone and try again.';
        }
        else if (error.name === 'OverconstrainedError') {
            return 'Microphone constraints could not be satisfied. Please check your audio device settings.';
        }
        else {
            return `Microphone access failed: ${error.message}`;
        }
    }
    getUserFriendlyPermissionMessage() {
        switch (this.currentStatus) {
            case PermissionStatus.GRANTED:
                return 'Microphone access is enabled and ready to use.';
            case PermissionStatus.DENIED:
                return 'Microphone access is blocked. Please enable microphone permissions in your browser settings to use voice translation.';
            case PermissionStatus.PROMPT:
                return 'Click "Allow" when prompted to enable microphone access for voice translation.';
            default:
                return 'Microphone permission status is unknown. Click the test button to check access.';
        }
    }
}
exports.AudioPermissionService = AudioPermissionService;
//# sourceMappingURL=AudioPermissionService.js.map