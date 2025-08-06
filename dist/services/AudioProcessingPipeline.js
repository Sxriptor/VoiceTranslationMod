"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioProcessingPipeline = void 0;
const events_1 = require("events");
class AudioProcessingPipeline extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.stages = [];
        this.audioContext = null;
        this.config = {
            enableNoiseReduction: true,
            enableVolumeNormalization: true,
            enableHighPassFilter: true,
            highPassFrequency: 80, // Remove low-frequency noise
            volumeThreshold: 0.01,
            ...config
        };
        this.initializeStages();
    }
    initializeStages() {
        this.stages = [];
        if (this.config.enableHighPassFilter) {
            this.stages.push(new HighPassFilterStage(this.config.highPassFrequency));
        }
        if (this.config.enableNoiseReduction) {
            this.stages.push(new NoiseReductionStage());
        }
        if (this.config.enableVolumeNormalization) {
            this.stages.push(new VolumeNormalizationStage());
        }
    }
    async processSegment(segment) {
        let processedSegment = segment;
        try {
            // Process through each stage
            for (const stage of this.stages) {
                this.emit('stageStarted', stage.name, processedSegment.id);
                processedSegment = await stage.process(processedSegment);
                this.emit('stageCompleted', stage.name, processedSegment.id);
            }
            this.emit('processingCompleted', processedSegment);
            return processedSegment;
        }
        catch (error) {
            this.emit('processingError', error, segment.id);
            throw error;
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.initializeStages();
    }
    getConfig() {
        return { ...this.config };
    }
    dispose() {
        this.removeAllListeners();
    }
}
exports.AudioProcessingPipeline = AudioProcessingPipeline;
// High-pass filter to remove low-frequency noise
class HighPassFilterStage {
    constructor(cutoffFrequency) {
        this.name = 'HighPassFilter';
        this.cutoffFrequency = cutoffFrequency;
    }
    async process(segment) {
        const filteredData = this.applyHighPassFilter(segment.data, segment.sampleRate);
        return {
            ...segment,
            data: filteredData
        };
    }
    applyHighPassFilter(data, sampleRate) {
        const filtered = new Float32Array(data.length);
        const rc = 1.0 / (2 * Math.PI * this.cutoffFrequency);
        const dt = 1.0 / sampleRate;
        const alpha = rc / (rc + dt);
        filtered[0] = data[0];
        for (let i = 1; i < data.length; i++) {
            filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
        }
        return filtered;
    }
}
// Simple noise reduction using spectral subtraction
class NoiseReductionStage {
    constructor() {
        this.name = 'NoiseReduction';
        this.noiseProfile = null;
        this.isLearningNoise = true;
        this.noiseSamples = 0;
        this.noiseLearningDuration = 8000; // Learn noise for first 0.5 seconds
    }
    async process(segment) {
        // Simple noise reduction: if we're still learning noise, collect noise profile
        if (this.isLearningNoise && this.noiseSamples < this.noiseLearningDuration) {
            this.updateNoiseProfile(segment.data);
            this.noiseSamples += segment.data.length;
            if (this.noiseSamples >= this.noiseLearningDuration) {
                this.isLearningNoise = false;
            }
            return segment; // Return original during noise learning
        }
        // Apply noise reduction if we have a noise profile
        if (this.noiseProfile) {
            const reducedData = this.reduceNoise(segment.data);
            return {
                ...segment,
                data: reducedData
            };
        }
        return segment;
    }
    updateNoiseProfile(data) {
        if (!this.noiseProfile) {
            this.noiseProfile = new Float32Array(data.length);
        }
        // Simple averaging for noise profile
        for (let i = 0; i < Math.min(data.length, this.noiseProfile.length); i++) {
            this.noiseProfile[i] = (this.noiseProfile[i] + Math.abs(data[i])) / 2;
        }
    }
    reduceNoise(data) {
        if (!this.noiseProfile)
            return data;
        const reduced = new Float32Array(data.length);
        const reductionFactor = 0.5; // Reduce noise by 50%
        for (let i = 0; i < data.length; i++) {
            const noiseLevel = this.noiseProfile[i % this.noiseProfile.length];
            const signalLevel = Math.abs(data[i]);
            if (signalLevel > noiseLevel * 2) {
                // Signal is significantly above noise, keep it
                reduced[i] = data[i];
            }
            else {
                // Reduce noise
                reduced[i] = data[i] * reductionFactor;
            }
        }
        return reduced;
    }
}
// Volume normalization to ensure consistent levels
class VolumeNormalizationStage {
    constructor() {
        this.name = 'VolumeNormalization';
        this.targetRMS = 0.1; // Target RMS level
    }
    async process(segment) {
        const normalizedData = this.normalizeVolume(segment.data);
        return {
            ...segment,
            data: normalizedData
        };
    }
    normalizeVolume(data) {
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);
        // Avoid division by zero
        if (rms < 0.001) {
            return data;
        }
        // Calculate gain
        const gain = this.targetRMS / rms;
        // Apply gain with limiting to prevent clipping
        const normalized = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            normalized[i] = Math.max(-1, Math.min(1, data[i] * gain));
        }
        return normalized;
    }
}
//# sourceMappingURL=AudioProcessingPipeline.js.map