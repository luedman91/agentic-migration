/**
 * ============================================================================
 * Unit Tests: DAG Scheduler & Parallel Dispatch (dagScheduler.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the candidate selection, worker dispatch, dependency checking, and
 * fallback mechanisms in `src/utils/dagScheduler.ts`.
 * 
 * Use Cases:
 * 1. Verifying roots with 0 dependencies are dispatched first.
 * 2. Ensuring child nodes are never dispatched while parent dependencies are in-flight.
 * 3. Verifying independent graph branches can run in parallel.
 * 4. Cycle fallback and pipeline completion detection.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { getAvailableCandidates, getSafeFallbackCandidate, isPipelineFinished } from '../../src/utils/dagScheduler';
import { Node } from '../../src/types';

describe('DAG Scheduler & Parallel Dispatch (dagScheduler.ts)', () => {
  const createMockNode = (id: string, deps: string[] = [], status: Node['status'] = 'todo'): Node => ({
    id,
    ql_symbol: `Symbol_${id}`,
    path: `ql/math/${id.toLowerCase()}.cpp`,
    kind: 'pure_math',
    note: `Description for ${id}`,
    deps,
    status,
    complexity: 'medium',
  });

  it('selects root nodes with zero dependencies first', () => {
    const nodes: Node[] = [
      createMockNode('A', []),
      createMockNode('B', ['A']),
      createMockNode('C', ['B']),
    ];

    const candidates = getAvailableCandidates(nodes, []);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe('A');
  });

  it('does NOT select child node when parent dependency is currently in-flight', () => {
    const nodes: Node[] = [
      createMockNode('A', [], 'mapped'), // In-flight in worker 1
      createMockNode('B', ['A'], 'todo'),
    ];

    // Worker 1 is running node A, so 'A' is in excludeIds
    const candidates = getAvailableCandidates(nodes, ['A']);
    expect(candidates).toHaveLength(0); // B must wait until A is translated/tested!
  });

  it('selects child node once all parent dependencies are translated or tested', () => {
    const nodes: Node[] = [
      createMockNode('A', [], 'tested'),
      createMockNode('B', ['A'], 'todo'),
      createMockNode('C', ['B'], 'todo'),
    ];

    const candidates = getAvailableCandidates(nodes, []);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe('B');
  });

  it('allows independent branches to be selected in parallel', () => {
    const nodes: Node[] = [
      createMockNode('A', [], 'tested'),
      createMockNode('Branch1', ['A'], 'todo'),
      createMockNode('Branch2', ['A'], 'todo'),
    ];

    const candidates = getAvailableCandidates(nodes, []);
    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.id)).toEqual(['Branch1', 'Branch2']);

    // If Worker 1 picks Branch1, Worker 2 can still pick Branch2
    const candidatesForWorker2 = getAvailableCandidates(nodes, ['Branch1']);
    expect(candidatesForWorker2).toHaveLength(1);
    expect(candidatesForWorker2[0].id).toBe('Branch2');
  });

  it('ignores nodes that have already failed or completed', () => {
    const nodes: Node[] = [
      createMockNode('A', [], 'tested'),
      createMockNode('B', ['A'], 'failed'),
      createMockNode('C', ['A'], 'translated'),
    ];

    const candidates = getAvailableCandidates(nodes, []);
    expect(candidates).toHaveLength(0);
  });

  it('provides safe fallback candidate if a dependency cycle occurs', () => {
    // A depends on B, B depends on A (cycle)
    const nodes: Node[] = [
      createMockNode('A', ['B'], 'todo'),
      createMockNode('B', ['A'], 'todo'),
    ];

    const candidates = getAvailableCandidates(nodes, []);
    expect(candidates).toHaveLength(0);

    const fallback = getSafeFallbackCandidate(nodes, []);
    expect(fallback).not.toBeNull();
    expect(['A', 'B']).toContain(fallback?.id);
  });

  it('correctly determines when the entire pipeline is finished', () => {
    const nodesUnfinished: Node[] = [
      createMockNode('A', [], 'tested'),
      createMockNode('B', ['A'], 'todo'),
    ];
    expect(isPipelineFinished(nodesUnfinished, 0)).toBe(false);
    expect(isPipelineFinished(nodesUnfinished, 1)).toBe(false);

    const nodesFinished: Node[] = [
      createMockNode('A', [], 'tested'),
      createMockNode('B', ['A'], 'translated'),
    ];
    expect(isPipelineFinished(nodesFinished, 1)).toBe(false); // In flight worker still active
    expect(isPipelineFinished(nodesFinished, 0)).toBe(true);
  });
});
