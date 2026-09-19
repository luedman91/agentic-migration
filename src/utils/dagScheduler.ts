/**
 * ============================================================================
 * DAG Scheduler & Parallel Dispatch Engine (dagScheduler.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Implements deterministic topological candidate filtering and worker dispatch
 * algorithms for parallel code migration pipelines. Ensures that nodes are only
 * dispatched when all prerequisite dependencies have successfully completed,
 * prevents worker stalling, and manages in-flight node exclusions.
 * 
 * Use Cases:
 * 1. Filtering ready topological candidates for multi-worker parallel execution.
 * 2. Guaranteeing upstream dependencies are verified before child nodes are launched.
 * 3. Detecting pipeline completion and providing cycle/deadlock safe fallback candidates.
 * ============================================================================
 */

import { Node } from '../types';

/**
 * Filters the given node set to find nodes that are ready to be migrated.
 * A node is ready if:
 * - Its status is 'todo' or 'mapped'
 * - It is not currently in-flight (not in excludeIds)
 * - All of its dependencies (parents) have status 'tested' or 'translated'
 *
 * @param nodes - Current array of DAG nodes
 * @param excludeIds - Node IDs currently running in workers
 * @returns Array of nodes ready for immediate migration
 */
export function getAvailableCandidates(nodes: Node[], excludeIds: string[] = []): Node[] {
  const excludeSet = new Set(excludeIds);

  const uncompletedNodes = nodes.filter(
    (n) => (n.status === 'todo' || n.status === 'mapped') && !excludeSet.has(n.id)
  );
  if (uncompletedNodes.length === 0) return [];

  return uncompletedNodes.filter((cand) => {
    return cand.deps.every((depId) => {
      const dep = nodes.find((n) => n.id === depId);
      return !dep || dep.status === 'tested' || dep.status === 'translated';
    });
  });
}

/**
 * Finds a safe fallback node in case of cyclical dependencies or disconnected components
 * where no standard topological candidate is ready, but uncompleted nodes still remain.
 *
 * @param nodes - Current array of DAG nodes
 * @param excludeIds - Node IDs currently running in workers
 * @returns An uncompleted node that has not failed and is not currently in-flight, or null
 */
export function getSafeFallbackCandidate(nodes: Node[], excludeIds: string[] = []): Node | null {
  const excludeSet = new Set(excludeIds);
  const remaining = nodes.filter(
    (n) => (n.status === 'todo' || n.status === 'mapped') && !excludeSet.has(n.id)
  );
  return remaining.length > 0 ? remaining[0] : null;
}

/**
 * Checks whether the entire DAG migration pipeline has reached terminal completion.
 *
 * @param nodes - Current array of DAG nodes
 * @param inFlightCount - Number of currently active worker tasks
 * @returns True if all nodes are completed (translated/tested) and no tasks are in-flight
 */
export function isPipelineFinished(nodes: Node[], inFlightCount: number): boolean {
  if (inFlightCount > 0) return false;
  const remaining = nodes.filter((n) => n.status === 'todo' || n.status === 'mapped');
  return remaining.length === 0;
}
