/**
 * ============================================================================
 * Application Configuration Hub (Frontend)
 * ============================================================================
 * 
 * Feature Description:
 * This module acts as the single source of truth for all configurable runtime
 * parameters, AI model identifiers, hardware target definitions, precision options,
 * and default project presets across the QuantLib to PyTorch translation suite.
 * 
 * Use Cases:
 * 1. Centralizing Gemini model identifiers (e.g. gemini-2.5-flash, gemini-2.5-pro)
 *    so model upgrades or fallbacks require modifying a single location.
 * 2. Providing typed presets for computational archetypes (Ultra-deep 150-node
 *    DAG, distributed pipelines, stochastic quadrature, and option pricing engines).
 * 3. Enforcing system-wide default thresholds (numerical tolerances, batch sizes,
 *    worker concurrencies, and UI animation timeouts).
 * 4. Ensuring modularity and testability by decoupling hardcoded strings from UI
 *    components.
 * ============================================================================
 */

import { ProjectConfig } from '../types';

/**
 * AI Model Configurations
 * All AI and GenAI model references must be retrieved from here.
 */
export const AI_CONFIG = {
  /** Default Gemini model used for C++ AST to PyTorch transpilation */
  PRIMARY_MIGRATION_MODEL: 'gemini-2.5-flash',
  /** High-reasoning model for complex stochastic calculus and PDE solver verification */
  REASONING_MIGRATION_MODEL: 'gemini-2.5-pro',
  /** Fast model for quick signature analysis and building block matching */
  FAST_ANALYSIS_MODEL: 'gemini-2.5-flash',
  /** Temperature setting for deterministic code generation */
  CODE_GEN_TEMPERATURE: 0.1,
  /** Maximum output tokens for complex AST vectorization */
  MAX_OUTPUT_TOKENS: 8192,
} as const;

/**
 * Numerical Precision and Acceleration Hardware Configurations
 */
export const RUNTIME_HARDWARE_CONFIG = {
  SUPPORTED_FRAMEWORKS: ['PyTorch', 'JAX', 'TensorFlow', 'Triton'] as const,
  SUPPORTED_DEVICES: ['cuda', 'cpu', 'mps'] as const,
  SUPPORTED_PRECISIONS: ['float64', 'float32', 'mixed_precision'] as const,
  DEFAULT_FRAMEWORK: 'PyTorch' as const,
  DEFAULT_DEVICE: 'cuda' as const,
  DEFAULT_PRECISION: 'float64' as const,
  DEFAULT_NUMERICAL_TOLERANCE: 1e-9,
  DEFAULT_BATCH_SIZE: 100_000,
} as const;

/**
 * Modal Serverless Cloud Execution Constants
 */
export const MODAL_CLOUD_CONFIG = {
  DEFAULT_WORKER_CONCURRENCY: 32,
  DEFAULT_GPU_TYPE: 'NVIDIA A10G (24GB VRAM)',
  FALLBACK_STATUS_CHECK_INTERVAL_MS: 30000,
  TASK_EXECUTION_TIMEOUT_MS: 60000,
} as const;

/**
 * Default Project Configuration Baseline
 */
export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  repoUrl: 'https://github.com/uber/athenadriver.git',
  branch: 'main',
  entryPoint: 'src/orchestrator/system_coordinator.cpp',
  sourceLanguage: 'C++',
  targetLanguage: 'Python',
  targetFramework: 'PyTorch',
  targetDevice: 'cuda',
  precision: 'float64',
  sourceLibraryName: 'Athena Engine + QuantLib Core (C++)',
  targetLibraryName: 'py_enterprise_distributed_engine',
  oracleEngine: 'C++ Simulation Reference & Modal Oracle',
  executionMode: 'modal',
  presetId: 'massive_enterprise_150_dag',
};

/**
 * Retrieves the recommended AI model name for a specific complexity tier.
 *
 * @param complexity - The code complexity tier ('low' | 'medium' | 'high')
 * @returns The designated Gemini model identifier string
 */
export function getRecommendedModelForComplexity(complexity?: 'low' | 'medium' | 'high'): string {
  if (complexity === 'high') {
    return AI_CONFIG.REASONING_MIGRATION_MODEL;
  }
  return AI_CONFIG.PRIMARY_MIGRATION_MODEL;
}

/**
 * Validates whether a given precision is supported by the runtime.
 *
 * @param precision - Candidate precision string
 * @returns True if precision is within supported list
 */
export function isSupportedPrecision(precision: string): boolean {
  return (RUNTIME_HARDWARE_CONFIG.SUPPORTED_PRECISIONS as readonly string[]).includes(precision);
}

/**
 * Canonical symbol alias dictionary for cross-framework compatibility.
 * Maps non-standard, alternative, or historical symbol names to canonical QuantLib / PyTorch symbols.
 */
export const SYMBOL_ALIASES: Readonly<Record<string, string>> = {
  GaussianErrorFunction: 'ErrorFunction',
} as const;

/**
 * Normalizes any symbol to its canonical form using the system-wide alias table.
 *
 * @param symbol - Candidate symbol string to normalize
 * @returns Canonical symbol string
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  return SYMBOL_ALIASES[symbol] || symbol;
}

/**
 * Compares two symbols for semantic equivalence, taking canonical aliases into account.
 *
 * @param s1 - First symbol string to compare
 * @param s2 - Second symbol string to compare
 * @returns True if the symbols match directly or map to the identical canonical symbol
 */
export function areSymbolsEquivalent(s1?: string, s2?: string): boolean {
  if (!s1 || !s2) return false;
  if (s1 === s2) return true;
  return normalizeSymbol(s1) === normalizeSymbol(s2);
}
