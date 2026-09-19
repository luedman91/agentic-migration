/**
 * ============================================================================
 * Centralized Server Logging Engine
 * ============================================================================
 * 
 * Feature Description:
 * Provides structured telemetry and logging across all backend services,
 * function invocations, and generative AI model transactions.
 * 
 * Use Cases:
 * 1. Automatically logging every backend function invocation at INFO level with
 *    its parameters for full observability and debugging.
 * 2. Logging all Google GenAI calls with complete fidelity (model used, prompt,
 *    and configuration options) along with raw model output, while safely
 *    stripping high-density inline binary/base64 data.
 * 3. Providing standardized formatting with ISO timestamps and log levels.
 * 4. Maintaining an in-memory buffer of recent transactions for diagnostic queries.
 * ============================================================================
 */

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogRecord {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  functionName?: string;
  message: string;
  parameters?: Record<string, any>;
  genaiTelemetry?: GenAITelemetry;
}

export interface GenAITelemetry {
  model: string;
  prompt: string;
  config: Record<string, any>;
  output: string;
  latencyMs?: number;
  tokensEstimate?: number;
}

/** In-memory ring buffer of recent logs (capped at 500 entries) */
const LOG_BUFFER: LogRecord[] = [];
const MAX_LOG_BUFFER_SIZE = 500;

/**
 * Strips bulky inline data (e.g. data URLs, base64 images, huge raw buffers)
 * from payloads before logging to prevent terminal and memory bloat.
 *
 * @param data - Any input object or string
 * @returns Sanitized clone of the input with inline data stripped or truncated
 */
export function stripInlineData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    if (data.startsWith("data:") && data.includes(";base64,")) {
      return "[INLINE_BASE64_DATA_STRIPPED]";
    }
    if (data.length > 5000) {
      return data.slice(0, 5000) + "... [TRUNCATED_FOR_LOGGING]";
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => stripInlineData(item));
  }
  if (typeof data === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        key.toLowerCase().includes("inline") ||
        key.toLowerCase().includes("base64") ||
        key.toLowerCase().includes("bytes")
      ) {
        sanitized[key] = "[INLINE_DATA_STRIPPED]";
      } else {
        sanitized[key] = stripInlineData(value);
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * Logs a function invocation at INFO level with its parameters.
 *
 * @param source - The module or service initiating the call
 * @param functionName - Name of the invoked function
 * @param parameters - Dictionary of arguments passed to the function
 */
export function logFunctionCall(
  source: string,
  functionName: string,
  parameters: Record<string, any> = {}
): LogRecord {
  const sanitizedParams = stripInlineData(parameters);
  const record: LogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level: "INFO",
    source,
    functionName,
    message: `[FUNCTION_CALL] ${source}.${functionName}()`,
    parameters: sanitizedParams,
  };

  pushLogRecord(record);
  console.log(
    `[INFO] [${record.timestamp}] ${source}.${functionName}() params:`,
    JSON.stringify(sanitizedParams, null, 2)
  );
  return record;
}

/**
 * Logs a GenAI model invocation with full telemetry parameters (model, prompt, config, output).
 * Inline and high-density binary data are stripped automatically.
 *
 * @param source - Originating service name
 * @param telemetry - GenAI call telemetry containing model, prompt, config, and output
 */
export function logGenAICall(source: string, telemetry: GenAITelemetry): LogRecord {
  const sanitizedTelemetry: GenAITelemetry = {
    model: telemetry.model,
    prompt: typeof telemetry.prompt === "string" && telemetry.prompt.length > 4000
      ? telemetry.prompt.slice(0, 4000) + "... [PROMPT_TRUNCATED_FOR_LOG]"
      : telemetry.prompt,
    config: stripInlineData(telemetry.config),
    output: typeof telemetry.output === "string" && telemetry.output.length > 4000
      ? telemetry.output.slice(0, 4000) + "... [OUTPUT_TRUNCATED_FOR_LOG]"
      : stripInlineData(telemetry.output),
    latencyMs: telemetry.latencyMs,
    tokensEstimate: telemetry.tokensEstimate,
  };

  const record: LogRecord = {
    id: `log-genai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level: "INFO",
    source,
    functionName: "generateContent",
    message: `[GENAI_CALL] Model: ${telemetry.model} | Latency: ${telemetry.latencyMs || 0}ms`,
    genaiTelemetry: sanitizedTelemetry,
  };

  pushLogRecord(record);
  console.log(
    `[INFO] [${record.timestamp}] [GENAI_CALL] Model: ${telemetry.model}\n` +
    `  Config: ${JSON.stringify(sanitizedTelemetry.config)}\n` +
    `  Prompt preview: ${sanitizedTelemetry.prompt.slice(0, 200)}...\n` +
    `  Output preview: ${sanitizedTelemetry.output.slice(0, 200)}...`
  );
  return record;
}

/**
 * Logs an error with context.
 *
 * @param source - Originating module name
 * @param message - Error description
 * @param error - The error instance or error details object
 */
export function logError(source: string, message: string, error?: any): LogRecord {
  const record: LogRecord = {
    id: `log-err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level: "ERROR",
    source,
    message: `[ERROR] ${message}: ${error?.message || String(error)}`,
    parameters: error ? stripInlineData(error) : undefined,
  };

  pushLogRecord(record);
  console.error(`[ERROR] [${record.timestamp}] ${source}: ${message}`, error);
  return record;
}

/**
 * Appends a log record into the internal ring buffer.
 *
 * @param record - Structured log record to retain
 */
function pushLogRecord(record: LogRecord): void {
  LOG_BUFFER.push(record);
  if (LOG_BUFFER.length > MAX_LOG_BUFFER_SIZE) {
    LOG_BUFFER.shift();
  }
}

/**
 * Retrieves a copy of the current in-memory log buffer.
 *
 * @returns Array of recent log records
 */
export function getRecentServerLogs(): LogRecord[] {
  return [...LOG_BUFFER];
}

/**
 * Clears the in-memory log buffer (useful for unit tests).
 */
export function clearServerLogs(): void {
  LOG_BUFFER.length = 0;
}
