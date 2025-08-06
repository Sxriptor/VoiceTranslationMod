"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechToTextMonitor = void 0;
const events_1 = require("events");
class SpeechToTextMonitor extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.metrics = [];
        this.errors = [];
        this.debugLogs = [];
        this.maxMetricsHistory = 1000;
        this.maxErrorHistory = 100;
        this.maxLogHistory = 500;
        this.startTime = Date.now();
    }
    recordTranscriptionStart(segment) {
        this.log('debug', 'transcription', `Starting transcription for segment ${segment.id}`, {
            segmentId: segment.id,
            audioSize: segment.data.length,
            audioDuration: segment.duration,
            sampleRate: segment.sampleRate
        });
    }
    recordTranscriptionSuccess(segment, result, processingTime, cost, model) {
        const metrics = {
            segmentId: segment.id,
            audioSize: segment.data.length,
            audioDuration: segment.duration,
            processingTime,
            transcriptionLength: result.text.length,
            confidence: result.confidence,
            cost,
            timestamp: Date.now(),
            language: result.language,
            model
        };
        this.addMetrics(metrics);
        this.log('info', 'transcription', `Transcription completed for segment ${segment.id}`, {
            ...metrics,
            text: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : '')
        });
        // Check for quality issues
        this.checkTranscriptionQuality(result, metrics);
        this.emit('transcriptionCompleted', metrics);
    }
    recordTranscriptionError(segment, error, processingTime) {
        this.addError(error);
        this.log('error', 'transcription', `Transcription failed for segment ${segment.id}`, {
            segmentId: segment.id,
            errorType: error.type,
            errorMessage: error.message,
            processingTime,
            retryable: error.retryable
        });
        this.emit('transcriptionFailed', { segment, error, processingTime });
    }
    recordAudioProcessing(segment, processingStage, duration) {
        this.log('debug', 'audio', `Audio processing: ${processingStage}`, {
            segmentId: segment.id,
            stage: processingStage,
            duration,
            audioSize: segment.data.length
        });
    }
    recordApiCall(endpoint, duration, success, responseSize) {
        this.log('debug', 'api', `API call to ${endpoint}`, {
            endpoint,
            duration,
            success,
            responseSize
        });
        if (duration > 10000) { // Warn about slow API calls
            this.log('warn', 'performance', `Slow API call detected: ${endpoint} took ${duration}ms`);
        }
    }
    addMetrics(metrics) {
        this.metrics.push(metrics);
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics.shift();
        }
    }
    addError(error) {
        this.errors.push(error);
        if (this.errors.length > this.maxErrorHistory) {
            this.errors.shift();
        }
    }
    log(level, category, message, data) {
        const logEntry = {
            timestamp: Date.now(),
            level,
            category,
            message,
            data
        };
        this.debugLogs.push(logEntry);
        if (this.debugLogs.length > this.maxLogHistory) {
            this.debugLogs.shift();
        }
        // Emit log event for real-time monitoring
        this.emit('logEntry', logEntry);
        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date(logEntry.timestamp).toISOString();
            const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
            switch (level) {
                case 'debug':
                    console.debug(logMessage, data);
                    break;
                case 'info':
                    console.info(logMessage, data);
                    break;
                case 'warn':
                    console.warn(logMessage, data);
                    break;
                case 'error':
                    console.error(logMessage, data);
                    break;
            }
        }
    }
    checkTranscriptionQuality(result, metrics) {
        // Check for low confidence
        if (result.confidence < 0.5) {
            this.log('warn', 'transcription', `Low confidence transcription: ${result.confidence}`, {
                segmentId: metrics.segmentId,
                confidence: result.confidence,
                text: result.text.substring(0, 50)
            });
        }
        // Check for empty transcription
        if (result.text.trim().length === 0) {
            this.log('warn', 'transcription', 'Empty transcription result', {
                segmentId: metrics.segmentId,
                audioDuration: metrics.audioDuration,
                audioSize: metrics.audioSize
            });
        }
        // Check for very short transcription with long audio
        if (result.text.length < 10 && metrics.audioDuration > 2) {
            this.log('warn', 'transcription', 'Suspiciously short transcription for long audio', {
                segmentId: metrics.segmentId,
                textLength: result.text.length,
                audioDuration: metrics.audioDuration
            });
        }
        // Check for processing time issues
        if (metrics.processingTime > 30000) { // 30 seconds
            this.log('warn', 'performance', 'Slow transcription processing', {
                segmentId: metrics.segmentId,
                processingTime: metrics.processingTime,
                audioDuration: metrics.audioDuration
            });
        }
    }
    getPerformanceStats(timeWindow) {
        const cutoffTime = timeWindow ? Date.now() - timeWindow : 0;
        const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
        const relevantErrors = this.errors.filter(e => e.timestamp > cutoffTime);
        if (relevantMetrics.length === 0) {
            return {
                totalTranscriptions: 0,
                successfulTranscriptions: 0,
                failedTranscriptions: relevantErrors.length,
                averageProcessingTime: 0,
                averageConfidence: 0,
                totalCost: 0,
                averageAudioSize: 0,
                averageAudioDuration: 0,
                successRate: 0,
                throughput: 0
            };
        }
        const totalTranscriptions = relevantMetrics.length + relevantErrors.length;
        const successfulTranscriptions = relevantMetrics.length;
        const failedTranscriptions = relevantErrors.length;
        const averageProcessingTime = relevantMetrics.reduce((sum, m) => sum + m.processingTime, 0) / relevantMetrics.length;
        const averageConfidence = relevantMetrics.reduce((sum, m) => sum + m.confidence, 0) / relevantMetrics.length;
        const totalCost = relevantMetrics.reduce((sum, m) => sum + m.cost, 0);
        const averageAudioSize = relevantMetrics.reduce((sum, m) => sum + m.audioSize, 0) / relevantMetrics.length;
        const averageAudioDuration = relevantMetrics.reduce((sum, m) => sum + m.audioDuration, 0) / relevantMetrics.length;
        const successRate = totalTranscriptions > 0 ? successfulTranscriptions / totalTranscriptions : 0;
        // Calculate throughput (transcriptions per minute)
        const timeSpan = timeWindow || (Date.now() - this.startTime);
        const throughput = (totalTranscriptions / timeSpan) * 60000; // Convert to per minute
        return {
            totalTranscriptions,
            successfulTranscriptions,
            failedTranscriptions,
            averageProcessingTime: Math.round(averageProcessingTime),
            averageConfidence: Math.round(averageConfidence * 100) / 100,
            totalCost: Math.round(totalCost * 1000) / 1000,
            averageAudioSize: Math.round(averageAudioSize),
            averageAudioDuration: Math.round(averageAudioDuration * 100) / 100,
            successRate: Math.round(successRate * 100) / 100,
            throughput: Math.round(throughput * 100) / 100
        };
    }
    getQualityMetrics(timeWindow) {
        const cutoffTime = timeWindow ? Date.now() - timeWindow : 0;
        const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);
        if (relevantMetrics.length === 0) {
            return {
                averageConfidence: 0,
                lowConfidenceCount: 0,
                emptyTranscriptionCount: 0,
                languageDistribution: {},
                confidenceDistribution: { high: 0, medium: 0, low: 0 }
            };
        }
        const averageConfidence = relevantMetrics.reduce((sum, m) => sum + m.confidence, 0) / relevantMetrics.length;
        const lowConfidenceCount = relevantMetrics.filter(m => m.confidence < 0.5).length;
        const emptyTranscriptionCount = relevantMetrics.filter(m => m.transcriptionLength === 0).length;
        // Language distribution
        const languageDistribution = {};
        relevantMetrics.forEach(m => {
            if (m.language) {
                languageDistribution[m.language] = (languageDistribution[m.language] || 0) + 1;
            }
        });
        // Confidence distribution
        const confidenceDistribution = {
            high: relevantMetrics.filter(m => m.confidence > 0.8).length,
            medium: relevantMetrics.filter(m => m.confidence >= 0.5 && m.confidence <= 0.8).length,
            low: relevantMetrics.filter(m => m.confidence < 0.5).length
        };
        return {
            averageConfidence: Math.round(averageConfidence * 100) / 100,
            lowConfidenceCount,
            emptyTranscriptionCount,
            languageDistribution,
            confidenceDistribution
        };
    }
    getDebugLogs(level, category, limit = 100) {
        let filteredLogs = this.debugLogs;
        if (level) {
            filteredLogs = filteredLogs.filter(log => log.level === level);
        }
        if (category) {
            filteredLogs = filteredLogs.filter(log => log.category === category);
        }
        return filteredLogs.slice(-limit);
    }
    exportMetrics() {
        return {
            metrics: [...this.metrics],
            errors: [...this.errors],
            logs: [...this.debugLogs],
            stats: this.getPerformanceStats(),
            quality: this.getQualityMetrics()
        };
    }
    clearHistory() {
        this.metrics = [];
        this.errors = [];
        this.debugLogs = [];
        this.startTime = Date.now();
        this.emit('historyCleared');
    }
    // Real-time monitoring methods
    startRealTimeMonitoring() {
        // Set up periodic performance checks
        setInterval(() => {
            const stats = this.getPerformanceStats(60000); // Last minute
            // Alert on performance issues
            if (stats.successRate < 0.8 && stats.totalTranscriptions > 5) {
                this.log('warn', 'performance', `Low success rate detected: ${stats.successRate * 100}%`, stats);
            }
            if (stats.averageProcessingTime > 15000) {
                this.log('warn', 'performance', `High average processing time: ${stats.averageProcessingTime}ms`, stats);
            }
            this.emit('performanceUpdate', stats);
        }, 30000); // Check every 30 seconds
    }
    dispose() {
        this.clearHistory();
        this.removeAllListeners();
    }
}
exports.SpeechToTextMonitor = SpeechToTextMonitor;
//# sourceMappingURL=SpeechToTextMonitor.js.map