/**
 * @vitest-environment jsdom
 * ============================================================================
 * Unit Tests: Virtual File Manager Hook (useFileManager.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the custom React hook managing virtual files, file upserts,
 * node synchronization, and file system resets.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileManager } from '../../src/hooks/useFileManager';
import { Node } from '../../src/types';

describe('useFileManager Hook', () => {
  it('initializes with default template files', () => {
    const { result } = renderHook(() => useFileManager());
    expect(result.current.files.length).toBeGreaterThan(0);
    expect(result.current.files.some((f) => f.path === 'README.md')).toBe(true);
  });

  it('upserts new files and updates existing files by path', () => {
    const { result } = renderHook(() => useFileManager());

    act(() => {
      result.current.upsertFile({
        id: 'new-file-1',
        path: 'torch_quantlib/custom.py',
        content: '# Custom module',
        shippable: true,
      });
    });

    expect(result.current.files.some((f) => f.path === 'torch_quantlib/custom.py')).toBe(true);

    // Update the same file
    act(() => {
      result.current.upsertFile({
        id: 'new-file-1',
        path: 'torch_quantlib/custom.py',
        content: '# Updated custom module',
        shippable: true,
      });
    });

    const updated = result.current.files.find((f) => f.path === 'torch_quantlib/custom.py');
    expect(updated?.content).toBe('# Updated custom module');
  });

  it('syncs a migrated node to the file system', () => {
    const { result } = renderHook(() => useFileManager());

    const sampleNode: Node = {
      id: 'node-norm',
      ql_symbol: 'CumulativeNormalDistribution',
      path: 'math/normal.cpp',
      kind: 'pure_math',
      status: 'tested',
      deps: [],
      note: '',
      code: {
        cpp: '',
        python: 'import torch\nclass CumulativeNormalDistribution: pass',
      },
    };

    act(() => {
      result.current.syncNodeToFileSystem(sampleNode);
    });

    const synced = result.current.files.find((f) => f.nodeId === 'node-norm');
    expect(synced).toBeDefined();
    expect(synced?.path).toBe('torch_quantlib/math/cumulativenormaldistribution.py');
    expect(synced?.content).toContain('CumulativeNormalDistribution');
  });

  it('resets virtual files back to initial baseline', () => {
    const { result } = renderHook(() => useFileManager());

    act(() => {
      result.current.upsertFile({
        id: 'temp-file',
        path: 'temp.txt',
        content: 'temporary',
        shippable: false,
      });
    });

    expect(result.current.files.some((f) => f.path === 'temp.txt')).toBe(true);

    act(() => {
      result.current.resetFiles();
    });

    expect(result.current.files.some((f) => f.path === 'temp.txt')).toBe(false);
  });
});
