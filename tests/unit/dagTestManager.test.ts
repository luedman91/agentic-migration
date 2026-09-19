/**
 * ============================================================================
 * Unit Tests: Root-to-Node DAG Test Manager (dagTestManager.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates DAG cone traversal, leaf detection, upstream dependency order,
 * and automated integration test generation.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  getRootToNodePath,
  isDagLeaf,
  getUpstreamDependencySymbols,
  generateRootToNodeIntegrationTest,
  generateUnitTestForNode,
} from '../../src/utils/dagTestManager';
import { Node } from '../../src/types';

describe('Root-to-Node DAG Test Manager', () => {
  const sampleNodes: Node[] = [
    {
      id: 'root_norm_cdf',
      ql_symbol: 'CumulativeNormalDistribution',
      path: 'math/normal.cpp',
      kind: 'pure_math',
      status: 'tested',
      deps: [],
      note: 'Foundation root CDF',
    },
    {
      id: 'math_black_formula',
      ql_symbol: 'BlackFormula',
      path: 'pricing/black.cpp',
      kind: 'pure_math',
      status: 'tested',
      deps: ['root_norm_cdf'],
      note: 'Black-76 pricing formula',
    },
    {
      id: 'engine_european',
      ql_symbol: 'AnalyticEuropeanEngine',
      path: 'pricing/european.cpp',
      kind: 'solver',
      status: 'todo',
      deps: ['math_black_formula'],
      note: 'Composite option engine',
    },
  ];

  it('traverses from composite engine node back to foundation root', () => {
    const targetNode = sampleNodes[2]; // AnalyticEuropeanEngine
    const pathInfo = getRootToNodePath(targetNode, sampleNodes);

    expect(pathInfo.symbols).toContain('CumulativeNormalDistribution');
    expect(pathInfo.symbols).toContain('BlackFormula');
    expect(pathInfo.symbols).toContain('AnalyticEuropeanEngine');
    expect(pathInfo.rootSymbols).toContain('CumulativeNormalDistribution');
    expect(pathInfo.depth).toBe(3);
  });

  it('identifies source and terminal leaf nodes correctly', () => {
    const rootNode = sampleNodes[0];
    const middleNode = sampleNodes[1];
    const leafNode = sampleNodes[2];

    expect(isDagLeaf(rootNode, sampleNodes)).toBe(true); // source leaf (no deps)
    expect(isDagLeaf(leafNode, sampleNodes)).toBe(true); // terminal leaf (no dependents)
    expect(isDagLeaf(middleNode, sampleNodes)).toBe(false); // intermediate
  });

  it('collects all upstream dependency symbols in topological sequence', () => {
    const targetNode = sampleNodes[2];
    const upstream = getUpstreamDependencySymbols(targetNode, sampleNodes);

    expect(upstream).toContain('CumulativeNormalDistribution');
    expect(upstream).toContain('BlackFormula');
    expect(upstream).not.toContain('AnalyticEuropeanEngine');
  });

  it('generates a complete shippable integration test for the root-to-node chain', () => {
    const targetNode = sampleNodes[2];
    const testResult = generateRootToNodeIntegrationTest(targetNode, sampleNodes, {
      isModal: true,
      workerId: 'worker-gpu-01',
      gpuAllocated: 'NVIDIA A10G',
    });

    expect(testResult.category).toBe('integration');
    expect(testResult.shippable).toBe(true);
    expect(testResult.targetNodeId).toBe(targetNode.id);
    expect(testResult.pipelineDescription).toContain('CumulativeNormalDistribution');
    expect(testResult.testCodeSnippet).toContain('def test_integration_chain_root_to_');
    expect(testResult.testCodeSnippet).toContain('torch.isfinite');
    expect(testResult.testCodeSnippet).toContain('loss.backward()');
    expect(testResult.speedup).toBeGreaterThan(1);
  });

  it('synthesizes an isolated unit test for individual kernels', () => {
    const node = sampleNodes[0];
    const unitTest = generateUnitTestForNode(node);

    expect(unitTest.category).toBe('target_library');
    expect(unitTest.shippable).toBe(true);
    expect(unitTest.targetNodeId).toBe(node.id);
    expect(unitTest.testCodeSnippet).toContain('def test_cumulativenormaldistribution_kernel_parity');
  });
});
