/**
 * ============================================================================
 * Unit Tests: Tree Layout Engine (treeLayout.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates spatial layout calculations, topological ranks, and coordinate
 * allocations for vertical and horizontal orientations.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { computeTreeLayout } from '../../src/utils/treeLayout';
import { Node } from '../../src/types';

describe('Tree Layout Engine', () => {
  const nodes: Node[] = [
    { id: 'n1', ql_symbol: 'Root1', path: 'src/r1.cpp', kind: 'pure_math', status: 'tested', deps: [], note: '' },
    { id: 'n2', ql_symbol: 'Root2', path: 'src/r2.cpp', kind: 'pure_math', status: 'tested', deps: [], note: '' },
    { id: 'n3', ql_symbol: 'Mid1', path: 'src/m1.cpp', kind: 'solver', status: 'todo', deps: ['n1'], note: '' },
    { id: 'n4', ql_symbol: 'Leaf1', path: 'src/l1.cpp', kind: 'solver', status: 'todo', deps: ['n3', 'n2'], note: '' },
  ];

  it('returns empty position map when given empty node array', () => {
    const pos = computeTreeLayout([], { orientation: 'vertical', width: 800, height: 600 });
    expect(pos.size).toBe(0);
  });

  it('computes vertical positions with increasing Y coordinates for higher ranks', () => {
    const pos = computeTreeLayout(nodes, { orientation: 'vertical', width: 1000, height: 800 });

    expect(pos.has('n1')).toBe(true);
    expect(pos.has('n2')).toBe(true);
    expect(pos.has('n3')).toBe(true);
    expect(pos.has('n4')).toBe(true);

    const rootY = pos.get('n1')!.y;
    const midY = pos.get('n3')!.y;
    const leafY = pos.get('n4')!.y;

    expect(rootY).toBeLessThan(midY);
    expect(midY).toBeLessThan(leafY);
  });

  it('computes horizontal positions with increasing X coordinates for higher ranks', () => {
    const pos = computeTreeLayout(nodes, { orientation: 'horizontal', width: 1000, height: 800 });

    const rootX = pos.get('n1')!.x;
    const midX = pos.get('n3')!.x;
    const leafX = pos.get('n4')!.x;

    expect(rootX).toBeLessThan(midX);
    expect(midX).toBeLessThan(leafX);
  });
});
