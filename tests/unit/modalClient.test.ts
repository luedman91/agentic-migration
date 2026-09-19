/**
 * ============================================================================
 * Unit Tests: Modal Cloud Client (modalClient.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the client interface for dispatching migration jobs to Modal
 * serverless GPU workers and handling responses safely.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModalStatus, executeModalNodeMigration } from '../../src/utils/modalClient';
import { Node } from '../../src/types';
import { DEFAULT_PROJECT_CONFIG } from '../../src/config/appConfig';

describe('Modal Serverless Cloud Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches diagnostic status and handles fetch errors gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const status = await fetchModalStatus();
    expect(status.isLive).toBe(false);
    expect(status.message).toContain('Network offline');
  });

  it('formats payload correctly when dispatching node migration', async () => {
    const mockResponse = {
      success: true,
      result: {
        taskId: 'task-123',
        workerId: 'worker-gpu-01',
        gpuAllocated: 'NVIDIA A10G',
        computeLatencyMs: 14.5,
        parallelSpeedup: 65.2,
        nodeResult: {
          pythonCode: 'import torch\nclass EuropeanEngine: pass',
          vectorizationSummary: 'Vectorized with autograd',
          maxExpectedDiff: 1.2e-14,
        },
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => mockResponse,
    });

    const testNode: Node = {
      id: 'node-eur',
      ql_symbol: 'AnalyticEuropeanEngine',
      path: 'src/engines/european.cpp',
      kind: 'solver',
      status: 'todo',
      deps: [],
      note: '',
      code: { cpp: 'void calculate() {}', python: '' },
    };

    const result = await executeModalNodeMigration(
      testNode,
      'PyTorch',
      'cuda',
      'float64',
      ['BlackFormula'],
      []
    );

    expect(result.workerId).toBe('worker-gpu-01');
    expect(result.gpuAllocated).toBe('NVIDIA A10G');
    expect(result.parallelSpeedup).toBe(65.2);
    expect(result.files.length).toBe(2);
    expect(result.unitTest.category).toBe('target_library');
    expect(result.unitTest.shippable).toBe(true);
  });

  it('throws error when server responds with failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, error: 'Cluster capacity exceeded' }),
    });

    const testNode: Node = {
      id: 'node-fail',
      ql_symbol: 'FailSymbol',
      path: 'fail.cpp',
      kind: 'solver',
      status: 'todo',
      deps: [],
      note: '',
    };

    await expect(
      executeModalNodeMigration(testNode, 'PyTorch', 'cuda', 'float64', [], [])
    ).rejects.toThrow('Cluster capacity exceeded');
  });

  it('calls executeNodeOnModal and extracts pythonCode and summary', async () => {
    const mockResponse = {
      success: true,
      result: {
        workerId: 'worker-a10g',
        gpuAllocated: 'A10G',
        nodeResult: {
          pythonCode: 'import torch\nclass TestedNode: pass',
          vectorizationSummary: 'Vectorized with autograd',
        },
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => mockResponse,
    });

    const testNode: Node = {
      id: 'node-mod',
      ql_symbol: 'TestedNode',
      path: 'test.cpp',
      kind: 'pure_math',
      status: 'todo',
      deps: [],
      note: '',
    };

    const res = await (await import('../../src/utils/modalClient')).executeNodeOnModal({
      node: testNode,
      upstreamDeps: [{ symbol: 'Dep1', status: 'tested' }],
      config: DEFAULT_PROJECT_CONFIG,
    });

    expect(res.pythonCode).toContain('class TestedNode');
    expect(res.vectorizationSummary).toContain('Vectorized with autograd');
  });
});
