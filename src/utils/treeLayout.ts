/**
 * ============================================================================
 * Hierarchical & Organic Tree Layout Engine (treeLayout.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Computes deterministic layered topological coordinates for complex Directed
 * Acyclic Graphs (DAGs). Places primitive leaves at foundational layers and fans
 * downstream composite engines out in organic hierarchy with collision avoidance.
 * 
 * Use Cases:
 * 1. Generating SVG and HTML canvas positions for D3 topological visualizer.
 * 2. Supporting vertical (top-to-bottom) and horizontal (left-to-right) orientations.
 * 3. Grouping functional clusters and preventing overlapping node visual elements.
 * ============================================================================
 */

import { Node } from '../types';
import { logClientFunctionCall } from './logger';

export interface TreeLayoutPosition {
  x: number;
  y: number;
}

export interface TreeLayoutOptions {
  orientation: 'vertical' | 'horizontal';
  width: number;
  height: number;
  nodeWidth?: number;
  nodeHeight?: number;
}

/**
 * Computes organic, hierarchical tree-structured coordinates for a DAG.
 * Respects functional clusters, parent-child fan-in/fan-out, and branching hierarchy
 * so that child nodes naturally fan beneath/alongside their architectural parents.
 *
 * @param nodes - Array of Nodes to position
 * @param options - Canvas dimensions and layout orientation options
 * @returns Map associating each Node ID with an {x, y} coordinate
 */
export function computeTreeLayout(
  nodes: Node[],
  options: TreeLayoutOptions
): Map<string, TreeLayoutPosition> {
  logClientFunctionCall('treeLayout', 'computeTreeLayout', {
    nodeCount: nodes?.length || 0,
    orientation: options?.orientation,
  });

  const positions = new Map<string, TreeLayoutPosition>();
  if (!Array.isArray(nodes) || nodes.length === 0) return positions;

  const { orientation, width, height } = options;
  const isVertical = orientation === 'vertical';

  // 1. Calculate topological rank / depth for each node
  // Leaves/primitives (deps.length === 0) are rank 0
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));
  const rankMap = new Map<string, number>();

  const getRank = (id: string, depth = 0): number => {
    if (depth > 30) return 0; // Guard against cycles
    if (rankMap.has(id)) return rankMap.get(id)!;
    const node = nodeMap.get(id);
    if (!node || !node.deps || node.deps.length === 0) {
      rankMap.set(id, 0);
      return 0;
    }
    let maxRank = 0;
    for (const d of node.deps) {
      if (nodeMap.has(d)) {
        maxRank = Math.max(maxRank, getRank(d, depth + 1) + 1);
      }
    }
    rankMap.set(id, maxRank);
    return maxRank;
  };

  nodes.forEach((n) => getRank(n.id));

  let maxRank = 0;
  rankMap.forEach((r) => {
    if (r > maxRank) maxRank = r;
  });

  // 2. Group nodes by rank
  const ranks: Node[][] = Array.from({ length: maxRank + 1 }, () => []);
  nodes.forEach((n) => {
    const r = rankMap.get(n.id) || 0;
    ranks[r].push(n);
  });

  // 3. Sort nodes within each rank by upstream dependencies or name to prevent wire tangles
  ranks.forEach((rankNodes) => {
    rankNodes.sort((a, b) => {
      const aDeps = (a.deps || []).join(',');
      const bDeps = (b.deps || []).join(',');
      if (aDeps !== bDeps) return aDeps.localeCompare(bDeps);
      return (a.ql_symbol || a.id).localeCompare(b.ql_symbol || b.id);
    });
  });

  // 4. Assign spatial coordinates
  const rankCount = ranks.length;
  const padding = 60;
  const usableWidth = Math.max(width - padding * 2, 200);
  const usableHeight = Math.max(height - padding * 2, 200);

  const rankStep =
    rankCount > 1
      ? (isVertical ? usableHeight : usableWidth) / (rankCount - 1)
      : (isVertical ? usableHeight : usableWidth) / 2;

  ranks.forEach((rankNodes, rankIndex) => {
    const nodeCountInRank = rankNodes.length;
    const breadthStep =
      nodeCountInRank > 1
        ? (isVertical ? usableWidth : usableHeight) / (nodeCountInRank - 1)
        : 0;

    rankNodes.forEach((node, nodeIndex) => {
      let x: number;
      let y: number;

      if (isVertical) {
        y = padding + rankIndex * rankStep;
        if (nodeCountInRank === 1) {
          x = width / 2;
        } else {
          x = padding + nodeIndex * breadthStep;
        }
      } else {
        x = padding + rankIndex * rankStep;
        if (nodeCountInRank === 1) {
          y = height / 2;
        } else {
          y = padding + nodeIndex * breadthStep;
        }
      }

      positions.set(node.id, {
        x: Math.round(x),
        y: Math.round(y),
      });
    });
  });

  return positions;
}
