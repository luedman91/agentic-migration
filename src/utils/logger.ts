/**
 * ============================================================================
 * Centralized Client-Side Logger & Telemetry Engine
 * ============================================================================
 * 
 * Feature Description:
 * Client-side logging utility responsible for capturing function invocations,
 * agent operations, and GenAI requests with full parameter observability.
 * 
 * Use Cases:
 * 1. Logging UI and business logic function calls at INFO level with arguments.
 * 2. Logging AI Studio / Gemini agent requests with model, prompt, configuration,
 *    and response payload with inline data safely stripped.
 * 3. Providing subscriber hooks for real-time log streaming into the UI console.
 * 4. Exporting diagnostic event logs for verification and audit trails.
 * ============================================================================
 */

import { LogEntry, LogLevel, AgentCallDetails } from '../types';

export interface ClientGenAITelemetry {
  model: string;
  prompt: string;
  config: Record<string, any>;
  output: string;
  durationMs?: number;
}

type LogListener = (entry: LogEntry) => void;

const listeners: Set<LogListener> = new Set();
const logHistory: LogEntry[] = [];
const MAX_CLIENT_LOG_HISTORY = 1000;

/**
 * Strips bulky inline data and base64 strings from payloads.
 *
 * @param data - Any data payload
 * @returns Cleaned payload suitable for console and UI rendering
 */
export function stripClientInlineData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    if (data.startsWith('data:') && data.includes(';base64,')) {
      return '[INLINE_DATA_STRIPPED]';
    }
    if (data.length > 3000) {
      return data.slice(0, 3000) + '... [TRUNCATED]';
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(stripClientInlineData);
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (
        k.toLowerCase().includes('inline') ||
        k.toLowerCase().includes('base64')
      ) {
        cleaned[k] = '[INLINE_DATA_STRIPPED]';
      } else {
        cleaned[k] = stripClientInlineData(v);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Logs a client-side function call at INFO level with parameter values.
 *
 * @param source - Component or hook name
 * @param functionName - Name of the function executed
 * @param params - Function parameter object
 * @returns Created LogEntry
 */
export function logClientFunctionCall(
  source: string,
  functionName: string,
  params: Record<string, any> = {}
): LogEntry {
  const sanitizedParams = stripClientInlineData(params);
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    level: 'INFO',
    message: `[CALL] ${source}.${functionName}()`,
    detail: Object.keys(sanitizedParams).length > 0 ? JSON.stringify(sanitizedParams) : undefined,
  };

  recordEntry(entry);
  console.info(`%c[INFO]%c ${source}.${functionName}()`, 'color: #38bdf8; font-weight: bold;', '', sanitizedParams);
  return entry;
}

/**
 * Logs a GenAI model transaction with all parameters and output (stripping inline data).
 *
 * @param telemetry - Full GenAI call telemetry details
 * @returns Created LogEntry
 */
export function logClientGenAICall(telemetry: ClientGenAITelemetry): LogEntry {
  const cleanedConfig = stripClientInlineData(telemetry.config);
  const agentDetails: AgentCallDetails = {
    model: telemetry.model,
    symbol: (cleanedConfig as any)?.symbol || 'UNKNOWN_SYMBOL',
    sourceLang: 'C++',
    targetLang: 'Python',
    targetDevice: (cleanedConfig as any)?.targetDevice || 'cuda',
    durationMs: telemetry.durationMs,
    status: 'completed',
    vectorizationSummary: typeof telemetry.output === 'string' ? telemetry.output.slice(0, 120) : undefined,
  };

  const entry: LogEntry = {
    id: `log-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    level: 'SUCCESS',
    message: `[GENAI] Model: ${telemetry.model} (${telemetry.durationMs || 0}ms)`,
    detail: `Prompt: ${telemetry.prompt.slice(0, 300)}... | Output: ${telemetry.output.slice(0, 300)}...`,
    agentCall: agentDetails,
  };

  recordEntry(entry);
  console.info(`%c[GENAI]%c ${telemetry.model} completed in ${telemetry.durationMs || 0}ms`, 'color: #10b981; font-weight: bold;', '');
  return entry;
}

/**
 * Generic logging method for UI events.
 *
 * @param level - Log level
 * @param message - Primary message
 * @param detail - Optional secondary detail or metadata
 * @returns Created LogEntry
 */
export function logClientEvent(level: LogLevel, message: string, detail?: string): LogEntry {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
    detail,
  };

  recordEntry(entry);
  return entry;
}

/**
 * Appends a log entry into the history and notifies all subscribers.
 *
 * @param entry - The LogEntry to record
 */
function recordEntry(entry: LogEntry): void {
  logHistory.push(entry);
  if (logHistory.length > MAX_CLIENT_LOG_HISTORY) {
    logHistory.shift();
  }
  listeners.forEach((listener) => {
    try {
      listener(entry);
    } catch (e) {
      console.error('Log listener error:', e);
    }
  });
}

/**
 * Subscribes a listener to receive real-time log entries.
 *
 * @param listener - Callback receiving new LogEntry
 * @returns Unsubscribe function
 */
export function subscribeToLogs(listener: LogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Retrieves the full retained client log history.
 *
 * @returns Array of log entries
 */
export function getClientLogHistory(): LogEntry[] {
  return [...logHistory];
}

/**
 * Clears the client log history.
 */
export function clearClientLogs(): void {
  logHistory.length = 0;
}
