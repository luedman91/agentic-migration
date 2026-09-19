/**
 * ============================================================================
 * Unit Tests: Application Configuration Hub (appConfig.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the centralized frontend configuration definitions, model mappings,
 * hardware accelerator profiles, and precision validators.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  AI_CONFIG,
  RUNTIME_HARDWARE_CONFIG,
  DEFAULT_PROJECT_CONFIG,
  getRecommendedModelForComplexity,
  isSupportedPrecision,
} from '../../src/config/appConfig';

describe('Application Configuration Hub', () => {
  it('defines valid Gemini model identifiers in AI_CONFIG', () => {
    expect(AI_CONFIG.PRIMARY_MIGRATION_MODEL).toBeDefined();
    expect(typeof AI_CONFIG.PRIMARY_MIGRATION_MODEL).toBe('string');
    expect(AI_CONFIG.REASONING_MIGRATION_MODEL).toBeDefined();
    expect(AI_CONFIG.FAST_ANALYSIS_MODEL).toBeDefined();
    expect(AI_CONFIG.CODE_GEN_TEMPERATURE).toBeLessThanOrEqual(0.5);
    expect(AI_CONFIG.MAX_OUTPUT_TOKENS).toBeGreaterThan(1000);
  });

  it('configures supported hardware frameworks and devices', () => {
    expect(RUNTIME_HARDWARE_CONFIG.SUPPORTED_FRAMEWORKS).toContain('PyTorch');
    expect(RUNTIME_HARDWARE_CONFIG.SUPPORTED_DEVICES).toContain('cuda');
    expect(RUNTIME_HARDWARE_CONFIG.SUPPORTED_DEVICES).toContain('cpu');
    expect(RUNTIME_HARDWARE_CONFIG.SUPPORTED_PRECISIONS).toContain('float64');
    expect(RUNTIME_HARDWARE_CONFIG.DEFAULT_PRECISION).toBe('float64');
  });

  it('selects the correct AI model based on code complexity', () => {
    expect(getRecommendedModelForComplexity('high')).toBe(AI_CONFIG.REASONING_MIGRATION_MODEL);
    expect(getRecommendedModelForComplexity('medium')).toBe(AI_CONFIG.PRIMARY_MIGRATION_MODEL);
    expect(getRecommendedModelForComplexity('low')).toBe(AI_CONFIG.PRIMARY_MIGRATION_MODEL);
    expect(getRecommendedModelForComplexity(undefined)).toBe(AI_CONFIG.PRIMARY_MIGRATION_MODEL);
  });

  it('validates supported precision strings correctly', () => {
    expect(isSupportedPrecision('float64')).toBe(true);
    expect(isSupportedPrecision('float32')).toBe(true);
    expect(isSupportedPrecision('mixed_precision')).toBe(true);
    expect(isSupportedPrecision('int8')).toBe(false);
    expect(isSupportedPrecision('invalid_precision')).toBe(false);
  });

  it('provides a complete default project configuration baseline', () => {
    expect(DEFAULT_PROJECT_CONFIG.targetFramework).toBe('PyTorch');
    expect(DEFAULT_PROJECT_CONFIG.targetDevice).toBe('cuda');
    expect(DEFAULT_PROJECT_CONFIG.precision).toBe('float64');
    expect(DEFAULT_PROJECT_CONFIG.presetId).toBe('massive_enterprise_150_dag');
  });
});
