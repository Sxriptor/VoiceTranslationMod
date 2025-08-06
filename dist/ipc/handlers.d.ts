import { IpcMainInvokeEvent } from 'electron';
import { IPCRequest, IPCResponse } from './messages';
/**
 * Type-safe IPC handler function
 */
export type IPCHandler<TRequest extends IPCRequest, TResponse extends IPCResponse> = (event: IpcMainInvokeEvent, request: TRequest) => Promise<TResponse> | TResponse;
/**
 * Register all IPC handlers in the main process
 */
export declare function registerIPCHandlers(): void;
/**
 * Unregister all IPC handlers
 */
export declare function unregisterIPCHandlers(): void;
//# sourceMappingURL=handlers.d.ts.map