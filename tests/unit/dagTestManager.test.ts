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
  isNodeGreen,
  getIntegrationPathFromGreenNodes,
  generateIntegrationTestFromGreenNodes,
} from '../../src/utils/dagTestManager';
import { Node, UnitTestResult } from '../../src/types';

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

  const sampleUnitTests: UnitTestResult[] = [
    {
      id: 'test_unit_1',
      name: 'test_cumulativenormaldistribution_kernel_parity',
      suite: 'QuantLib Math Primitives',
      category: 'target_library',
      targetNodeId: 'root_norm_cdf',
      targetSymbol: 'CumulativeNormalDistribution',
      status: 'passed',
      tolerance: 1e-9,
      maxObservedDiff: 1e-13,
      speedup: 12.4,
      shippable: true,
      quantLibExecutionTimeMs: 4.2,
      torchExecutionTimeMs: 0.35,
      assertionsCount: 1500,
      sampleInput: 'x=0.5',
      qlExpected: '0.69146246',
      torchActual: '0.69146246',
    },
    {
      id: 'test_integ_leaf',
      name: 'test_integration_european_pipeline',
      suite: 'End-to-End Pricing Pipelines',
      category: 'integration',
      targetNodeId: 'engine_european',
      targetSymbol: 'AnalyticEuropeanEngine',
      status: 'passed',
      tolerance: 1e-9,
      maxObservedDiff: 2e-12,
      speedup: 35.0,
      shippable: true,
      quantLibExecutionTimeMs: 25.0,
      torchExecutionTimeMs: 0.72,
      assertionsCount: 5000,
      sampleInput: 'S=100, K=100, r=0.05, v=0.2, T=1.0',
      qlExpected: '10.45058',
      torchActual: '10.45058',
    },
  ];

  it('determines green node status: only leaves with passing integration tests are green', () => {
    // root_norm_cdf is a source leaf, but only has unit test (category: 'target_library'), not integration test
    expect(isNodeGreen(sampleNodes[0], sampleUnitTests)).toBe(false);

    // math_black_formula is an intermediate node (not a leaf)
    expect(isNodeGreen(sampleNodes[1], sampleUnitTests)).toBe(false);

    // engine_european is a terminal leaf AND has a passing integration test
    expect(isNodeGreen(sampleNodes[2], sampleUnitTests)).toBe(true);

    // If unit test failed, it shouldn't be green
    const failedTests: UnitTestResult[] = [
      { ...sampleUnitTests[1], status: 'failed' },
    ];
    expect(isNodeGreen(sampleNodes[2], failedTests)).toBe(false);
  });

  it('computes integration path starting from green checkpoint nodes', () => {
    // Let's add a downstream node that depends on engine_european
    const downstreamNode: Node = {
      id: 'downstream_portfolio',
      ql_symbol: 'PortfolioRiskEngine',
      path: 'pricing/portfolio.cpp',
      kind: 'solver',
      status: 'todo',
      deps: ['engine_european'],
      note: 'Portfolio risk engine',
    };
    const extendedNodes = [...sampleNodes, downstreamNode];

    const pathInfo = getIntegrationPathFromGreenNodes(downstreamNode, extendedNodes, sampleUnitTests);
    const greenSymbols = pathInfo.greenOrigins.map((g) => g.ql_symbol);
    expect(greenSymbols).toContain('AnalyticEuropeanEngine');
    expect(pathInfo.symbols).toContain('PortfolioRiskEngine');
    expect(pathInfo.isFromGreen).toBe(true);
  });

  it('generates an integration test utilizing green nodes as verified checkpoints', () => {
    const downstreamNode: Node = {
      id: 'downstream_portfolio',
      ql_symbol: 'PortfolioRiskEngine',
      path: 'pricing/portfolio.cpp',
      kind: 'solver',
      status: 'todo',
      deps: ['engine_european'],
      note: 'Portfolio risk engine',
    };
    const extendedNodes = [...sampleNodes, downstreamNode];

    const test = generateIntegrationTestFromGreenNodes(downstreamNode, extendedNodes, sampleUnitTests);
    expect(test.category).toBe('integration');
    expect(test.targetNodeId).toBe('downstream_portfolio');
    expect(test.shippable).toBe(true);
    expect(test.pipelineDescription).toContain('AnalyticEuropeanEngine');
    expect(test.testCodeSnippet).toContain('From Green Checkpoint(s)');
    expect(test.testCodeSnippet).toContain('test_integration_from_green_portfolio_risk_engine');
  });

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
    expect(unitTest.testCodeSnippet).toContain('def test_cumulative_normal_distribution_kernel_parity');
  });
});
