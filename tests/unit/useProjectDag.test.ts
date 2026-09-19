/**
 * @vitest-environment jsdom
 * ============================================================================
 * Unit Tests: Project DAG State Hook (useProjectDag.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the custom React hook managing DAG nodes, selection, status metrics,
 * next eligible node resolution, and preset switching.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectDag } from '../../src/hooks/useProjectDag';
import { DEFAULT_PROJECT_CONFIG } from '../../src/config/appConfig';

describe('useProjectDag Hook', () => {
  it('initializes with enterprise 150-node pipeline preset', () => {
    const { result } = renderHook(() => useProjectDag(DEFAULT_PROJECT_CONFIG));

    expect(result.current.nodes.length).toBeGreaterThan(10);
    expect(result.current.selectedNode).toBeDefined();
    expect(result.current.stats.total).toBe(result.current.nodes.length);
    expect(result.current.stats.progressPercent).toBeGreaterThanOrEqual(0);
  });

  it('selects nodes and updates node status safely', () => {
    const { result } = renderHook(() => useProjectDag(DEFAULT_PROJECT_CONFIG));
    const firstNode = result.current.nodes[0];

    act(() => {
      result.current.selectNode(firstNode.id);
    });

    expect(result.current.selectedNodeId).toBe(firstNode.id);
    expect(result.current.selectedNode?.id).toBe(firstNode.id);

    act(() => {
      result.current.updateNode(firstNode.id, { status: 'tested' });
    });

    const updated = result.current.nodes.find((n) => n.id === firstNode.id);
    expect(updated?.status).toBe('tested');
  });

  it('identifies next eligible node whose upstream dependencies are satisfied', () => {
    const { result } = renderHook(() => useProjectDag(DEFAULT_PROJECT_CONFIG));
    const next = result.current.getNextEligibleNode();

    // If an eligible node is found, all its deps must be tested or translated
    if (next) {
      const allDepsReady = next.deps.every((dId) => {
        const dNode = result.current.nodes.find((n) => n.id === dId);
        return dNode && (dNode.status === 'tested' || dNode.status === 'translated');
      });
      expect(allDepsReady).toBe(true);
    }
  });

  it('resets DAG back to custom preset when requested', () => {
    const { result } = renderHook(() => useProjectDag(DEFAULT_PROJECT_CONFIG));

    act(() => {
      result.current.resetToPreset('default');
    });

    expect(result.current.nodes.length).toBeGreaterThan(0);

    act(() => {
      result.current.resetToPreset('massive_enterprise_150_dag');
    });

    expect(result.current.nodes.length).toBeGreaterThan(100);
  });
});
