/**
 * ============================================================================
 * Unit Tests: Telemetry & Logging Engine (logger.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates both client-side and server-side centralized logging mechanisms,
 * verifying that function calls are logged as INFO with parameters, GenAI calls
 * are logged with all parameters, and bulky inline data is safely stripped.
 * ============================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logClientFunctionCall,
  logClientGenAICall,
  logClientEvent,
  stripClientInlineData,
  subscribeToLogs,
  getClientLogHistory,
  clearClientLogs,
} from '../../src/utils/logger';
import {
  logFunctionCall,
  logGenAICall,
  logError,
  stripInlineData,
  getRecentServerLogs,
  clearServerLogs,
} from '../../server/logger';

describe('Centralized Client-Side Logger', () => {
  beforeEach(() => {
    clearClientLogs();
  });

  it('strips base64 and long inline strings from telemetry payloads', () => {
    const rawData = {
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
      normalText: 'Valid short parameter',
      inlineBytes: '0x1234567890',
      nested: {
        base64Payload: 'AQIDBAU=',
        cleanValue: 42,
      },
    };

    const sanitized = stripClientInlineData(rawData);
    expect(sanitized.image).toBe('[INLINE_DATA_STRIPPED]');
    expect(sanitized.normalText).toBe('Valid short parameter');
    expect(sanitized.inlineBytes).toBe('[INLINE_DATA_STRIPPED]');
    expect(sanitized.nested.base64Payload).toBe('[INLINE_DATA_STRIPPED]');
    expect(sanitized.nested.cleanValue).toBe(42);
  });

  it('logs function calls at INFO level with parameter values', () => {
    const entry = logClientFunctionCall('TestComponent', 'computeRiskMatrix', {
      dimension: 5,
      method: 'cholesky',
    });

    expect(entry.level).toBe('INFO');
    expect(entry.message).toContain('TestComponent.computeRiskMatrix()');
    expect(entry.detail).toContain('cholesky');

    const history = getClientLogHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(entry.id);
  });

  it('logs GenAI calls with complete model, prompt, and output telemetry', () => {
    const entry = logClientGenAICall({
      model: 'gemini-2.5-flash',
      prompt: 'Translate C++ BlackCalculator to PyTorch',
      config: { temperature: 0.1, symbol: 'BlackCalculator' },
      output: 'class BlackCalculator(torch.nn.Module): pass',
      durationMs: 420,
    });

    expect(entry.level).toBe('SUCCESS');
    expect(entry.agentCall?.model).toBe('gemini-2.5-flash');
    expect(entry.agentCall?.symbol).toBe('BlackCalculator');
    expect(entry.agentCall?.durationMs).toBe(420);
    expect(entry.agentCall?.targetLang).toBe('Python');
  });

  it('supports subscriber callbacks for real-time log streaming', () => {
    const mockListener = vi.fn();
    const unsubscribe = subscribeToLogs(mockListener);

    logClientEvent('INFO', 'Test real-time event');
    expect(mockListener).toHaveBeenCalledTimes(1);

    unsubscribe();
    logClientEvent('INFO', 'After unsubscribe event');
    expect(mockListener).toHaveBeenCalledTimes(1);
  });
});

describe('Centralized Server-Side Logger', () => {
  beforeEach(() => {
    clearServerLogs();
  });

  it('strips inline base64 and excessive data on the backend', () => {
    const directBase64 = 'data:application/octet-stream;base64,AAAA';
    expect(stripInlineData(directBase64)).toBe('[INLINE_BASE64_DATA_STRIPPED]');

    const serverPayload = {
      userToken: 'token-123',
      inlineBuffer: 'data:application/octet-stream;base64,AAAA',
    };

    const cleaned = stripInlineData(serverPayload);
    expect(cleaned.userToken).toBe('token-123');
    expect(cleaned.inlineBuffer).toBe('[INLINE_DATA_STRIPPED]');
  });

  it('logs server function calls at INFO level with parameters', () => {
    const log = logFunctionCall('agentService', 'analyzeAST', {
      language: 'C++',
      symbolsCount: 12,
    });

    expect(log.level).toBe('INFO');
    expect(log.functionName).toBe('analyzeAST');
    expect(log.parameters?.symbolsCount).toBe(12);

    const logs = getRecentServerLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(log.id);
  });

  it('logs GenAI model requests with full parameters and stripped output', () => {
    const log = logGenAICall('geminiDriver', {
      model: 'gemini-2.5-flash',
      prompt: 'Convert BlackScholes to PyTorch',
      config: { temperature: 0.1, maxTokens: 4096 },
      output: '{"targetSymbol": "BlackScholes", "pythonCode": "import torch"}',
      latencyMs: 380,
    });

    expect(log.level).toBe('INFO');
    expect(log.genaiTelemetry?.model).toBe('gemini-2.5-flash');
    expect(log.genaiTelemetry?.latencyMs).toBe(380);
  });

  it('logs errors safely with error message extraction', () => {
    const err = new Error('Database connection failed');
    const log = logError('dbModule', 'Query execution error', err);

    expect(log.level).toBe('ERROR');
    expect(log.message).toContain('Database connection failed');
  });
});
