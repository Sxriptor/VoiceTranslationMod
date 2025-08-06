export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    component: string;
    message: string;
    data?: any;
}
/**
 * Simple logging service for debugging and monitoring
 */
export declare class LoggingService {
    private static instance;
    private logs;
    private maxLogs;
    private logLevel;
    private constructor();
    static getInstance(): LoggingService;
    debug(component: string, message: string, data?: any): void;
    info(component: string, message: string, data?: any): void;
    warn(component: string, message: string, data?: any): void;
    error(component: string, message: string, data?: any): void;
    private log;
    getLogs(level?: LogLevel, component?: string): LogEntry[];
    clearLogs(): void;
    setLogLevel(level: LogLevel): void;
    getLogLevel(): LogLevel;
}
//# sourceMappingURL=LoggingService.d.ts.map