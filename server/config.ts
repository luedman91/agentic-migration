/**
 * ============================================================================
 * Backend Configuration Hub
 * ============================================================================
 * 
 * Feature Description:
 * Centralizes all server-side settings, port bindings, AI model names,
 * timeouts, and external webhook definitions for the migration backend.
 * 
 * Use Cases:
 * 1. Single location for backend Gemini model versions.
 * 2. Configuration of Modal serverless endpoint fallbacks and concurrency limits.
 * 3. Centralizing payload body limits and HTTP timeout configurations.
 * ============================================================================
 */

export const SERVER_CONFIG = {
  /** Network port binding (must strictly be 3000 in this sandboxed environment) */
  PORT: 3000,
  /** Host binding address */
  HOST: "0.0.0.0",
  /** Request body size limit for AST payloads */
  BODY_LIMIT: "5mb",
  /** Primary Gemini model used for code transpilation */
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  /** Reasoning Gemini model for complex solver derivations */
  GEMINI_REASONING_MODEL: process.env.GEMINI_REASONING_MODEL || "gemini-2.5-pro",
  /** Default temperature for deterministic transpilation */
  TEMPERATURE: 0.1,
  /** Maximum generation tokens */
  MAX_TOKENS: 8192,
  /** Modal webhook base URL or placeholder */
  MODAL_WEBHOOK_URL: process.env.MODAL_WEBHOOK_URL || "https://modal.com/apps/quantlib-migration-worker",
} as const;

/**
 * Returns the active Gemini model identifier.
 *
 * @param modelOverride - Optional client-supplied model override
 * @returns Sanitized model identifier string
 */
export function getActiveGeminiModel(modelOverride?: string): string {
  if (modelOverride && typeof modelOverride === "string" && modelOverride.trim().length > 0) {
    return modelOverride.trim();
  }
  return SERVER_CONFIG.GEMINI_MODEL;
}
