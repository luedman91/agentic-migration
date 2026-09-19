/**
 * ============================================================================
 * Unit Tests: Server Modal Engine (modalEngine.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates remote Modal serverless dispatch, timeout handling, fallback sandbox
 * execution, and hardware accelerator profile assignment.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkModalStatus, dispatchModalMigration } from '../../server/modalEngine';

describe('Server Modal Execution Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.MODAL_WEBHOOK_URL;
  });

  it('checks status and reports unconfigured state when webhook is unreachable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const status = await checkModalStatus();
    expect(status.isLive).toBe(false);
    expect(status.configured).toBe(false);
    expect(status.message).toContain('Failed to reach Modal endpoint');
  });

  it('reports live connection when webhook responds with HTTP 200', async () => {
    process.env.MODAL_WEBHOOK_URL = 'https://mock.modal.run';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
    });

    const status = await checkModalStatus();
    expect(status.isLive).toBe(true);
    expect(status.configured).toBe(true);
    expect(status.statusCode).toBe(200);
  });

  it('dispatches migration task in local distributed sandbox when webhook is unconfigured', async () => {
    const request = {
      nodeId: 'norm-cdf',
      symbol: 'CumulativeNormalDistribution',
      path: 'math/normal.cpp',
      kind: 'pure_math',
      cppCode: 'Real calculate() { return 1.0; }',
      targetFramework: 'PyTorch',
      targetDevice: 'cuda',
      precision: 'float64',
      upstreamDeps: [],
      testIds: ['test-1'],
    };

    const response = await dispatchModalMigration(request);
    expect(response.executionEngine).toBe('modal_serverless');
    expect(response.isLiveCloud).toBe(false);
    expect(response.gpuAllocated).toContain('NVIDIA A10G');
    expect(response.nodeResult.pythonCode).toContain('class CumulativeNormalDistribution');
    expect(response.testResults.length).toBe(1);
    expect(response.testResults[0].passed).toBe(true);
  });

  it('handles remote webhook response properly when webhook is configured and live', async () => {
    process.env.MODAL_WEBHOOK_URL = 'https://mock.modal.run';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        worker_id: 'remote-worker-modal-99',
        cold_start_ms: 12,
        compute_ms: 22,
        speedup: 94.2,
        node_result: {
          symbol: 'BlackFormula',
          pythonCode: 'import torch\n# Remote Modal Code',
          vectorizationSummary: 'Vectorized with autograd',
          numericalTolerance: 1e-9,
          maxExpectedDiff: 1.1e-14,
        },
        test_results: [{ testId: 't1', passed: true, durationMs: 0.15, speedup: 94.2, diff: 0, log: 'OK' }],
      }),
    });

    const request = {
      nodeId: 'black-formula',
      symbol: 'BlackFormula',
      path: 'pricing/black.cpp',
      kind: 'pure_math',
      cppCode: 'Real calculate() { return 1.0; }',
      targetFramework: 'PyTorch',
      targetDevice: 'cuda',
      precision: 'float64',
      upstreamDeps: [],
      testIds: ['t1'],
    };

    const response = await dispatchModalMigration(request);
    expect(response.isLiveCloud).toBe(true);
    expect(response.workerId).toBe('remote-worker-modal-99');
    expect(response.nodeResult.pythonCode).toContain('Remote Modal Code');
  });
});
