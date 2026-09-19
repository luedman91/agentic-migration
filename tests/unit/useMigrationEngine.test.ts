/**
 * @vitest-environment jsdom
 * ============================================================================
 * Unit Tests: Pipeline Migration Engine Hook (useMigrationEngine.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the pipeline migration engine hook: single step execution, batch loop,
 * error handling, and file system synchronization callbacks.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMigrationEngine } from '../../src/hooks/useMigrationEngine';
import { DEFAULT_PROJECT_CONFIG } from '../../src/config/appConfig';
import { Node } from '../../src/types';

describe('useMigrationEngine Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles empty eligible node gracefully when executing single step', async () => {
    const mockUpdateNode = vi.fn();
    const mockSyncFS = vi.fn();
    const mockLog = vi.fn();

    const { result } = renderHook(() =>
      useMigrationEngine({
        config: DEFAULT_PROJECT_CONFIG,
        nodes: [],
        updateNode: mockUpdateNode,
        getNextEligibleNode: () => undefined,
        syncNodeToFileSystem: mockSyncFS,
        onLog: mockLog,
      })
    );

    let success: boolean = true;
    await act(async () => {
      success = await result.current.migrateSingleNode();
    });

    expect(success).toBe(false);
    expect(mockLog).toHaveBeenCalledWith(
      'INFO',
      expect.stringContaining('No eligible nodes pending migration')
    );
  });

  it('migrates a node successfully using agent API response', async () => {
    const mockNode: Node = {
      id: 'node-norm',
      ql_symbol: 'CumulativeNormalDistribution',
      path: 'math/normal.cpp',
      kind: 'pure_math',
      status: 'todo',
      deps: [],
      note: '',
      code: {
        cpp: 'Real calculate() { return 1.0; }',
        python: '',
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          pythonCode: 'import torch\nclass CumulativeNormalDistribution: pass',
          vectorizationSummary: 'Migrated to PyTorch',
        },
      }),
    });

    const mockUpdateNode = vi.fn();
    const mockSyncFS = vi.fn();
    const mockLog = vi.fn();

    const { result } = renderHook(() =>
      useMigrationEngine({
        config: { ...DEFAULT_PROJECT_CONFIG, executionMode: 'agent' },
        nodes: [mockNode],
        updateNode: mockUpdateNode,
        getNextEligibleNode: () => mockNode,
        syncNodeToFileSystem: mockSyncFS,
        onLog: mockLog,
      })
    );

    let success: boolean = false;
    await act(async () => {
      success = await result.current.migrateSingleNode(mockNode);
    });

    expect(success).toBe(true);
    expect(mockUpdateNode).toHaveBeenCalledWith(
      'node-norm',
      expect.objectContaining({ status: 'tested' })
    );
    expect(mockSyncFS).toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith(
      'SUCCESS',
      expect.stringContaining('CumulativeNormalDistribution'),
      'Migrated to PyTorch'
    );
  });

  it('marks node as failed when migration endpoint errors', async () => {
    const mockNode: Node = {
      id: 'node-err',
      ql_symbol: 'BrokenSolver',
      path: 'math/broken.cpp',
      kind: 'solver',
      status: 'todo',
      deps: [],
      note: '',
    };

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection aborted'));

    const mockUpdateNode = vi.fn();
    const mockSyncFS = vi.fn();
    const mockLog = vi.fn();

    const { result } = renderHook(() =>
      useMigrationEngine({
        config: DEFAULT_PROJECT_CONFIG,
        nodes: [mockNode],
        updateNode: mockUpdateNode,
        getNextEligibleNode: () => mockNode,
        syncNodeToFileSystem: mockSyncFS,
        onLog: mockLog,
      })
    );

    let success: boolean = true;
    await act(async () => {
      success = await result.current.migrateSingleNode(mockNode);
    });

    expect(success).toBe(false);
    expect(mockUpdateNode).toHaveBeenCalledWith('node-err', { status: 'failed' });
    expect(mockLog).toHaveBeenCalledWith(
      'ERROR',
      expect.stringContaining('Connection aborted')
    );
  });

  it('runs continuous automated pipeline until all nodes are processed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          pythonCode: 'import torch\nclass LoopKernel: pass',
          vectorizationSummary: 'Loop vectorized',
        },
      }),
    });

    let callCount = 0;
    const mockNode: Node = {
      id: 'node-loop',
      ql_symbol: 'LoopKernel',
      path: 'loop.cpp',
      kind: 'pure_math',
      status: 'todo',
      deps: [],
      note: '',
    };

    const mockUpdateNode = vi.fn();
    const mockSyncFS = vi.fn();
    const mockLog = vi.fn();

    const { result } = renderHook(() =>
      useMigrationEngine({
        config: { ...DEFAULT_PROJECT_CONFIG, executionMode: 'agent' },
        nodes: [mockNode],
        updateNode: mockUpdateNode,
        getNextEligibleNode: () => {
          if (callCount === 0) {
            callCount++;
            return mockNode;
          }
          return undefined;
        },
        syncNodeToFileSystem: mockSyncFS,
        onLog: mockLog,
      })
    );

    await act(async () => {
      await result.current.startAutoPipeline();
    });

    expect(mockLog).toHaveBeenCalledWith(
      'INFO',
      'Automated Continuous Migration Pipeline started.'
    );
    expect(mockLog).toHaveBeenCalledWith(
      'SUCCESS',
      'All eligible nodes have been migrated and verified.'
    );
  });

  it('pauses automated pipeline when requested', () => {
    const mockUpdateNode = vi.fn();
    const mockSyncFS = vi.fn();
    const mockLog = vi.fn();

    const { result } = renderHook(() =>
      useMigrationEngine({
        config: DEFAULT_PROJECT_CONFIG,
        nodes: [],
        updateNode: mockUpdateNode,
        getNextEligibleNode: () => undefined,
        syncNodeToFileSystem: mockSyncFS,
        onLog: mockLog,
      })
    );

    act(() => {
      result.current.pauseAutoPipeline();
    });

    expect(result.current.isRunning).toBe(false);
    expect(mockLog).toHaveBeenCalledWith('INFO', 'Automated Pipeline paused by user.');
  });
});
