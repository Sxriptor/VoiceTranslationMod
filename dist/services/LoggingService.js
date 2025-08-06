"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Simple logging service for debugging and monitoring
 */
class LoggingService {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = LogLevel.DEBUG;
    }
    static getInstance() {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }
    debug(component, message, data) {
        this.log(LogLevel.DEBUG, component, message, data);
    }
    info(component, message, data) {
        this.log(LogLevel.INFO, component, message, data);
    }
    warn(component, message, data) {
        this.log(LogLevel.WARN, component, message, data);
    }
    error(component, message, data) {
        this.log(LogLevel.ERROR, component, message, data);
    }
    log(level, component, message, data) {
        if (level < this.logLevel) {
            return;
        }
        const entry = {
            timestamp: Date.now(),
            level,
            component,
            message,
            data
        };
        this.logs.push(entry);
        // Keep only the most recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            const levelName = LogLevel[level];
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`[${timestamp}] ${levelName} [${component}] ${message}`, data || '');
        }
    }
    getLogs(level, component) {
        let filteredLogs = this.logs;
        if (level !== undefined) {
            filteredLogs = filteredLogs.filter(log => log.level >= level);
        }
        if (component) {
            filteredLogs = filteredLogs.filter(log => log.component === component);
        }
        return filteredLogs;
    }
    clearLogs() {
        this.logs = [];
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    getLogLevel() {
        return this.logLevel;
    }
}
exports.LoggingService = LoggingService;
//# sourceMappingURL=LoggingService.js.map