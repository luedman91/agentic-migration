/**
 * ============================================================================
 * Tree Decomposition & Space Colonization Layout Engine (treeLayout.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Implements an organic, dendritic tree layout inspired by Tree Decomposition
 * and Space Colonization algorithms. Replaces artificial equidistant grids with
 * authentic branch corridors, non-uniform branch widths, barycentric parent
 * centroids, and dynamic multi-parent fan-in. Nodes cluster naturally around
 * architectural trunks with breathing space for large graphs (up to 150+ nodes).
 * 
 * Use Cases:
 * 1. Laying out multi-layer quantitative DAGs with authentic tree structures
 *    (e.g., SIMD allocators, special math, SDE steppers, PDE solvers, pricing engines).
 * 2. Visualizing multi-parent convergence where composite nodes sit at the
 *    true barycenter of their upstream dependencies.
 * 3. Eliminating rigid horizontal equidistant spacing through non-linear branch
 *    clearances and spring relaxation.
 * 4. Supporting both vertical (top-to-bottom) and horizontal (left-to-right) orientations.
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
  minNodeSpacing?: number;
  interBranchSpacing?: number;
}

/**
 * 15 Functional Architectural Domains for Quantitative Finance Systems
 */
export function getFunctionalBranchCategory(node: Node): number {
  const path = (node.path || '').toLowerCase();
  const symbol = (node.ql_symbol || node.id || '').toLowerCase();
  const note = (node.note || '').toLowerCase();

  // Layer 0: Hardware, Memory & SIMD Allocators
  if (path.includes('alloc') || path.includes('io') || path.includes('telemetry') || symbol.includes('arena') || symbol.includes('simd') || symbol.includes('protobuf') || symbol.includes('timer')) {
    return 0;
  }
  // Layer 1: Special Math Functions & Distributions
  if (path.includes('math') || symbol.includes('erf') || symbol.includes('normal') || symbol.includes('distrib') || symbol.includes('gamma') || symbol.includes('legendre') || symbol.includes('hermite')) {
    return 1;
  }
  // Layer 2: Dense Linear Algebra & Matrix Solvers
  if (path.includes('linalg') || symbol.includes('cholesky') || symbol.includes('qr') || symbol.includes('svd') || symbol.includes('thomas') || symbol.includes('householder') || symbol.includes('matrix')) {
    return 2;
  }
  // Layer 3: Quasi-Monte Carlo & Sobol Sequences
  if (path.includes('random') || symbol.includes('sobol') || symbol.includes('mt19937') || symbol.includes('brownian') || symbol.includes('faure') || symbol.includes('halton')) {
    return 3;
  }
  // Layer 4: Term Structures, Discount Curves & Yield Surfaces
  if (path.includes('curves') || path.includes('termstructure') || symbol.includes('yield') || symbol.includes('curve') || symbol.includes('discount') || symbol.includes('spline') || symbol.includes('daycounter')) {
    return 4;
  }
  // Layer 5: Volatility Surfaces, SABR & Dupire
  if (path.includes('vol') || symbol.includes('volatility') || symbol.includes('sabr') || symbol.includes('dupire') || symbol.includes('smile') || symbol.includes('variance')) {
    return 5;
  }
  // Layer 6: SDE Integrators & Path Generators
  if (path.includes('sde') || symbol.includes('euler') || symbol.includes('milstein') || symbol.includes('rungekutta') || symbol.includes('rk45') || symbol.includes('hestonstepper') || symbol.includes('rosenbrock')) {
    return 6;
  }
  // Layer 7: Numerical PDE Solvers, Crank-Nicolson & ADI
  if (path.includes('pde') || symbol.includes('crank') || symbol.includes('adi') || symbol.includes('boundary') || symbol.includes('mesh') || symbol.includes('upwind') || symbol.includes('multigrid')) {
    return 7;
  }
  // Layer 8: Automatic Differentiation & Adjoint Tapes
  if (path.includes('autodiff') || symbol.includes('dual') || symbol.includes('adjoint') || symbol.includes('vjp') || symbol.includes('jvp') || symbol.includes('hvp') || symbol.includes('aad') || symbol.includes('autograd')) {
    return 8;
  }
  // Layer 9: Non-Linear Solvers, Levenberg-Marquardt & Optimization
  if (path.includes('optim') || symbol.includes('levenberg') || symbol.includes('bfgs') || symbol.includes('annealing') || symbol.includes('simplex') || symbol.includes('brent') || symbol.includes('sqp')) {
    return 9;
  }
  // Layer 10: State Estimation & Particle Filters
  if (path.includes('state') || symbol.includes('kalman') || symbol.includes('ekf') || symbol.includes('ukf') || symbol.includes('particle') || symbol.includes('hmm') || symbol.includes('hnsw')) {
    return 10;
  }
  // Layer 11: Quantitative Pricing Engines (Analytic, MC, American)
  if (path.includes('pricing') || symbol.includes('analytic') || symbol.includes('european') || symbol.includes('longstaff') || symbol.includes('barrier') || symbol.includes('asian') || symbol.includes('basket') || symbol.includes('kirk')) {
    return 11;
  }
  // Layer 12: Enterprise Risk Aggregation & Basel Metrics
  if (path.includes('risk') || symbol.includes('cvar') || symbol.includes('var') || symbol.includes('frtb') || symbol.includes('basel') || symbol.includes('cva') || symbol.includes('sa_ccr')) {
    return 12;
  }
  // Layer 13: Decision Policies, Circuit Breakers & Parquet Audit
  if (path.includes('policy') || path.includes('audit') || symbol.includes('breaker') || symbol.includes('parquet') || symbol.includes('throttle') || symbol.includes('margin') || symbol.includes('killswitch')) {
    return 13;
  }
  // Layer 14: Gateways & Global System Coordinator
  if (path.includes('orchestrator') || path.includes('api') || symbol.includes('coordinator') || symbol.includes('gateway') || symbol.includes('scheduler') || symbol.includes('modal') || symbol.includes('cluster')) {
    return 14;
  }

  // Fallback heuristic based on kind or generic keyword
  if (node.kind === 'pure_math') return 1;
  if (node.kind === 'solver') return 9;
  if (node.kind === 'date_logic' || (node.kind as string) === 'time') return 4;
  return 11;
}

/**
 * Computes an authentic tree layout using Tree Decomposition and Space Colonization.
 * Nodes cluster organically along branch corridors with variable branch spacing,
 * child fan-out, and barycentric multi-parent alignment.
 *
 * @param nodes - Array of DAG Nodes
 * @param options - Layout configuration options
 * @returns Map of node ID to {x, y} coordinates
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

  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));

  // 1. Calculate topological rank / depth for each node
  const rankMap = new Map<string, number>();

  const getRank = (id: string, depth = 0): number => {
    if (depth > 60) return 0; // Guard against cycles
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

  // Group nodes by rank
  const ranks: Node[][] = Array.from({ length: maxRank + 1 }, () => []);
  nodes.forEach((n) => {
    const r = rankMap.get(n.id) || 0;
    ranks[r].push(n);
  });

  // Build dependents adjacency list (upstream -> downstream children)
  const dependentsMap = new Map<string, string[]>();
  nodes.forEach((n) => {
    (n.deps || []).forEach((depId) => {
      const existing = dependentsMap.get(depId) || [];
      existing.push(n.id);
      dependentsMap.set(depId, existing);
    });
  });

  // 2. Tree Decomposition: Cluster Rank 0 Roots into Distinct Architectural Trunks
  const rank0Nodes = ranks[0] || [];
  rank0Nodes.sort((a, b) => {
    const catA = getFunctionalBranchCategory(a);
    const catB = getFunctionalBranchCategory(b);
    if (catA !== catB) return catA - catB;
    return (a.ql_symbol || a.id).localeCompare(b.ql_symbol || b.id);
  });

  // Variable spacing parameters: Non-uniform gaps between different architectural trunks
  const baseNodeClearance = options.minNodeSpacing || (nodes.length > 50 ? 95 : 120);
  const interBranchGap = options.interBranchSpacing || (nodes.length > 50 ? 220 : 260);
  const layerStep = isVertical ? 155 : 175;

  const lateralCoords = new Map<string, number>();

  // Allocate Rank 0 roots along the lateral axis with natural branch gaps
  let currentLateral = 0;
  let lastCategory = -1;

  rank0Nodes.forEach((node, idx) => {
    const cat = getFunctionalBranchCategory(node);
    if (idx > 0) {
      if (cat !== lastCategory) {
        // Distinct inter-branch space between different tree trunks
        currentLateral += interBranchGap;
      } else {
        // Compact intra-branch space within the same trunk, with slight non-uniformity
        const intraJitter = ((idx * 17) % 25) - 12;
        currentLateral += baseNodeClearance + intraJitter;
      }
    }
    lateralCoords.set(node.id, currentLateral);
    lastCategory = cat;
  });

  // 3. Space Colonization: Grow Higher Layers (Rank 1 .. maxRank)
  // Higher nodes position themselves at the barycenter of their upstream parents,
  // splaying outward or converging naturally based on fan-in degree.
  for (let r = 1; r <= maxRank; r++) {
    const rankNodes = ranks[r];

    // Compute ideal barycenter target for each node in this layer
    const nodeTargets: Array<{ node: Node; idealLateral: number; weight: number }> = [];

    rankNodes.forEach((node, nodeIdx) => {
      const validDeps = (node.deps || []).filter((d) => lateralCoords.has(d));
      const cat = getFunctionalBranchCategory(node);

      if (validDeps.length > 0) {
        // Multi-parent weighted barycentric centroid
        // Weights prioritize parents with same domain affinity
        let totalWeight = 0;
        let weightedSum = 0;

        validDeps.forEach((depId) => {
          const depNode = nodeMap.get(depId);
          const depCat = depNode ? getFunctionalBranchCategory(depNode) : -1;
          const w = depCat === cat ? 2.0 : 1.0;
          weightedSum += (lateralCoords.get(depId) || 0) * w;
          totalWeight += w;
        });

        const centroid = totalWeight > 0 ? weightedSum / totalWeight : 0;

        // Tree branch splay: give siblings breathing room based on branch fan-out
        let branchOffset = 0;
        if (validDeps.length === 1) {
          const parentId = validDeps[0];
          const siblings = dependentsMap.get(parentId) || [];
          const sIdx = siblings.indexOf(node.id);
          if (siblings.length > 1 && sIdx >= 0) {
            const spread = (siblings.length - 1) * 75;
            branchOffset = -spread / 2 + sIdx * 75;
          }
        } else {
          // Multi-parent fan-in: Add subtle organic splay based on node category and layer index
          const splaySign = (nodeIdx % 2 === 0 ? 1 : -1);
          const splayMagnitude = ((nodeIdx * 19) % 35);
          branchOffset = splaySign * splayMagnitude;
        }

        nodeTargets.push({
          node,
          idealLateral: centroid + branchOffset,
          weight: validDeps.length,
        });
      } else {
        // Fallback for unconnected nodes: align with functional trunk
        const refNode = rank0Nodes.find((n0) => getFunctionalBranchCategory(n0) === cat);
        const fallback = refNode && lateralCoords.has(refNode.id)
          ? lateralCoords.get(refNode.id)!
          : (currentLateral / (ranks[0]?.length || 1)) * (nodeIdx + 0.5);
        nodeTargets.push({ node, idealLateral: fallback, weight: 1 });
      }
    });

    // Sort by ideal lateral position
    nodeTargets.sort((a, b) => a.idealLateral - b.idealLateral);

    // Iterative Spring Relaxation Pass (Collision Avoidance without Equal Spacing)
    // Instead of forcing curr = prev + minClearance, push colliding pairs gently
    // while preserving variable gaps and branch clustering
    const clearances = nodeTargets.map((t, i) => {
      // Dynamic clearance: nodes with higher fan-in need more breathing room
      const deg = (t.node.deps || []).length;
      return baseNodeClearance + Math.min(deg * 6, 30);
    });

    // Run 5 relaxation iterations
    for (let iter = 0; iter < 5; iter++) {
      for (let i = 0; i < nodeTargets.length - 1; i++) {
        const curr = nodeTargets[i];
        const next = nodeTargets[i + 1];
        const reqDist = clearances[i];
        const actualDist = next.idealLateral - curr.idealLateral;

        if (actualDist < reqDist) {
          const overlap = reqDist - actualDist;
          // Distribute shift proportionally
          curr.idealLateral -= overlap * 0.5;
          next.idealLateral += overlap * 0.5;
        }
      }
    }

    // Assign relaxed lateral positions
    nodeTargets.forEach(({ node, idealLateral }) => {
      lateralCoords.set(node.id, idealLateral);
    });
  }

  // 4. Calculate Global Bounding Box & Center Tree
  let minLateral = Infinity;
  let maxLateral = -Infinity;
  lateralCoords.forEach((val) => {
    if (val < minLateral) minLateral = val;
    if (val > maxLateral) maxLateral = val;
  });

  if (minLateral === Infinity) {
    minLateral = 0;
    maxLateral = 0;
  }

  const treeSpan = maxLateral - minLateral;
  const paddingLateral = 140;
  const paddingTop = 100;

  // Center tree horizontally in vertical mode, or vertically in horizontal mode
  const canvasCenter = isVertical
    ? Math.max(width, treeSpan + paddingLateral * 2) / 2
    : Math.max(height, treeSpan + paddingLateral * 2) / 2;
  const treeMid = (minLateral + maxLateral) / 2;
  const lateralOffset = canvasCenter - treeMid;

  // 5. Assign Final 2D Spatial Coordinates with Subtle Organic Undulation
  nodes.forEach((node) => {
    const rank = rankMap.get(node.id) || 0;
    const rawLateral = lateralCoords.get(node.id) || 0;
    const adjustedLateral = Math.round(rawLateral + lateralOffset);

    // Add subtle dendritic organic depth undulation (±8px based on ID hash) so nodes
    // don't form perfectly rigid horizontal laser lines
    const idHash = node.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const depthJitter = (rank > 0 && rank < maxRank) ? ((idHash % 16) - 8) : 0;
    const depthPos = Math.round(paddingTop + rank * layerStep + depthJitter);

    if (isVertical) {
      positions.set(node.id, {
        x: adjustedLateral,
        y: depthPos,
      });
    } else {
      // Horizontal mode: depth flows left-to-right, lateral flows top-to-bottom
      positions.set(node.id, {
        x: depthPos,
        y: adjustedLateral,
      });
    }
  });

  return positions;
}
