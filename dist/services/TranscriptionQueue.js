"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptionQueue = void 0;
const events_1 = require("events");
class TranscriptionQueue extends events_1.EventEmitter {
    constructor(sttService, config = {}) {
        super();
        this.queue = [];
        this.processing = new Map();
        this.completed = new Map();
        this.failed = new Map();
        this.isRunning = false;
        this.lastProcessTime = 0;
        this.sttService = sttService;
        this.config = {
            maxConcurrentJobs: 3,
            maxQueueSize: 50,
            defaultPriority: 1,
            retryDelay: 2000,
            maxRetries: 3,
            rateLimitDelay: 1000,
            ...config
        };
    }
    async addSegment(segment, priority = this.config.defaultPriority, maxRetries = this.config.maxRetries) {
        if (this.queue.length >= this.config.maxQueueSize) {
            throw new Error(`Queue is full (max ${this.config.maxQueueSize} items)`);
        }
        const item = {
            id: `queue_${segment.id}_${Date.now()}`,
            segment,
            priority,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries
        };
        // Insert item in priority order (higher priority first)
        const insertIndex = this.queue.findIndex(queueItem => queueItem.priority < priority);
        if (insertIndex === -1) {
            this.queue.push(item);
        }
        else {
            this.queue.splice(insertIndex, 0, item);
        }
        this.emit('itemAdded', { item, queueLength: this.queue.length });
        // Start processing if not already running
        if (!this.isRunning) {
            this.startProcessing();
        }
        return item.id;
    }
    async startProcessing() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.emit('processingStarted');
        while (this.queue.length > 0 || this.processing.size > 0) {
            // Start new jobs if we have capacity and items in queue
            while (this.processing.size < this.config.maxConcurrentJobs && this.queue.length > 0) {
                const item = this.queue.shift();
                this.processItem(item);
            }
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.isRunning = false;
        this.emit('processingCompleted');
    }
    async processItem(item) {
        const startTime = Date.now();
        this.processing.set(item.id, item);
        this.emit('itemProcessingStarted', { item });
        try {
            // Apply rate limiting
            const timeSinceLastProcess = Date.now() - this.lastProcessTime;
            if (timeSinceLastProcess < this.config.rateLimitDelay) {
                await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay - timeSinceLastProcess));
            }
            this.lastProcessTime = Date.now();
            // Process transcription
            const result = await this.sttService.transcribe(item.segment);
            const processingTime = Date.now() - startTime;
            // Move to completed
            this.processing.delete(item.id);
            this.completed.set(item.id, { item, result, processingTime });
            this.emit('itemCompleted', { item, result, processingTime });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            this.processing.delete(item.id);
            // Check if we should retry
            if (item.retryCount < item.maxRetries && this.shouldRetry(error)) {
                item.retryCount++;
                this.emit('itemRetrying', {
                    item,
                    error,
                    retryCount: item.retryCount,
                    maxRetries: item.maxRetries
                });
                // Add back to queue with delay
                setTimeout(() => {
                    // Re-add to queue (maintain priority)
                    const insertIndex = this.queue.findIndex(queueItem => queueItem.priority < item.priority);
                    if (insertIndex === -1) {
                        this.queue.push(item);
                    }
                    else {
                        this.queue.splice(insertIndex, 0, item);
                    }
                }, this.config.retryDelay * Math.pow(2, item.retryCount - 1)); // Exponential backoff
            }
            else {
                // Move to failed
                this.failed.set(item.id, { item, error: error, processingTime });
                this.emit('itemFailed', { item, error, processingTime });
            }
        }
    }
    shouldRetry(error) {
        const errorMessage = error.message.toLowerCase();
        // Don't retry on authentication errors
        if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('api key')) {
            return false;
        }
        // Don't retry on validation errors
        if (errorMessage.includes('validation') || errorMessage.includes('invalid audio')) {
            return false;
        }
        // Retry on rate limits, timeouts, and network errors
        if (errorMessage.includes('429') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('network') ||
            errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503')) {
            return true;
        }
        // Default to retry for unknown errors
        return true;
    }
    getQueueStats() {
        const completedItems = Array.from(this.completed.values());
        const averageProcessingTime = completedItems.length > 0
            ? completedItems.reduce((sum, item) => sum + item.processingTime, 0) / completedItems.length
            : 0;
        return {
            totalItems: this.queue.length + this.processing.size + this.completed.size + this.failed.size,
            processingItems: this.processing.size,
            completedItems: this.completed.size,
            failedItems: this.failed.size,
            averageProcessingTime: Math.round(averageProcessingTime),
            queueLength: this.queue.length
        };
    }
    getQueuedItems() {
        return [...this.queue];
    }
    getProcessingItems() {
        return Array.from(this.processing.values());
    }
    getCompletedResults() {
        return Array.from(this.completed.values());
    }
    getFailedItems() {
        return Array.from(this.failed.values());
    }
    getItemStatus(itemId) {
        if (this.queue.some(item => item.id === itemId))
            return 'queued';
        if (this.processing.has(itemId))
            return 'processing';
        if (this.completed.has(itemId))
            return 'completed';
        if (this.failed.has(itemId))
            return 'failed';
        return 'not_found';
    }
    getResult(itemId) {
        const completed = this.completed.get(itemId);
        return completed ? completed.result : null;
    }
    removeItem(itemId) {
        // Remove from queue if present
        const queueIndex = this.queue.findIndex(item => item.id === itemId);
        if (queueIndex !== -1) {
            this.queue.splice(queueIndex, 1);
            this.emit('itemRemoved', { itemId, location: 'queue' });
            return true;
        }
        // Cannot remove items that are currently processing
        if (this.processing.has(itemId)) {
            return false;
        }
        // Remove from completed/failed
        if (this.completed.delete(itemId)) {
            this.emit('itemRemoved', { itemId, location: 'completed' });
            return true;
        }
        if (this.failed.delete(itemId)) {
            this.emit('itemRemoved', { itemId, location: 'failed' });
            return true;
        }
        return false;
    }
    clearQueue() {
        this.queue = [];
        this.emit('queueCleared');
    }
    clearCompleted() {
        this.completed.clear();
        this.emit('completedCleared');
    }
    clearFailed() {
        this.failed.clear();
        this.emit('failedCleared');
    }
    clearAll() {
        this.clearQueue();
        this.clearCompleted();
        this.clearFailed();
        this.emit('allCleared');
    }
    pauseProcessing() {
        this.isRunning = false;
        this.emit('processingPaused');
    }
    resumeProcessing() {
        if (!this.isRunning && (this.queue.length > 0 || this.processing.size > 0)) {
            this.startProcessing();
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.emit('configUpdated', this.config);
    }
    getConfig() {
        return { ...this.config };
    }
    dispose() {
        this.pauseProcessing();
        this.clearAll();
        this.removeAllListeners();
    }
}
exports.TranscriptionQueue = TranscriptionQueue;
//# sourceMappingURL=TranscriptionQueue.js.map