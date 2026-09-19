/**
 * ============================================================================
 * Unit Tests: Backend Server Configuration (serverConfig.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates backend server configurations, network ports, payload size limits,
 * and dynamic model resolution.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { SERVER_CONFIG, getActiveGeminiModel } from '../../server/config';

describe('Server Configuration Hub', () => {
  it('binds to port 3000 and 0.0.0.0 host', () => {
    expect(SERVER_CONFIG.PORT).toBe(3000);
    expect(SERVER_CONFIG.HOST).toBe('0.0.0.0');
    expect(SERVER_CONFIG.BODY_LIMIT).toBe('5mb');
  });

  it('defines fallback Gemini models and token limits', () => {
    expect(SERVER_CONFIG.GEMINI_MODEL).toBeDefined();
    expect(SERVER_CONFIG.TEMPERATURE).toBe(0.1);
    expect(SERVER_CONFIG.MAX_TOKENS).toBe(8192);
  });

  it('resolves active Gemini model with optional override', () => {
    expect(getActiveGeminiModel()).toBe(SERVER_CONFIG.GEMINI_MODEL);
    expect(getActiveGeminiModel('gemini-custom-model')).toBe('gemini-custom-model');
    expect(getActiveGeminiModel('')).toBe(SERVER_CONFIG.GEMINI_MODEL);
    expect(getActiveGeminiModel('   ')).toBe(SERVER_CONFIG.GEMINI_MODEL);
  });
});
