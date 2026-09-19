/**
 * ============================================================================
 * Integration Tests: End-to-End Migration Pipeline (migrationPipeline.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the full topological pipeline lifecycle: resolving root mathematical
 * primitives, propagating code to dependent engines, generating shippable Pytest
 * suites, and updating the virtual package filesystem without crashes.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { Node, ProjectConfig, MigratedFile, UnitTestResult } from '../../src/types';
import { getRootToNodePath, generateRootToNodeIntegrationTest } from '../../src/utils/dagTestManager';
import { buildFolderTree } from '../../src/components/MigratedFilesDrawer';

describe('Integration Test: End-to-End Migration Pipeline', () => {
  const initialPipelineNodes: Node[] = [
    {
      id: 'step_1_cdf',
      ql_symbol: 'CumulativeNormalDistribution',
      path: 'math/normal.cpp',
      kind: 'pure_math',
      status: 'todo',
      deps: [],
      note: 'Foundational standard normal CDF',
      code: {
        cpp: 'Real CumulativeNormalDistribution::operator()(Real x) const { return 0.5 * (1 + std::erf(x / std::sqrt(2.0))); }',
        python: '',
      },
    },
    {
      id: 'step_2_black',
      ql_symbol: 'BlackCalculator',
      path: 'pricingengines/blackcalculator.cpp',
      kind: 'solver',
      status: 'todo',
      deps: ['step_1_cdf'],
      note: 'Vectorized Black-76 formula',
      code: {
        cpp: 'Real BlackCalculator::value() const { return spot_ * cdf_(d1_) - strike_ * discount_ * cdf_(d2_); }',
        python: '',
      },
    },
    {
      id: 'step_3_engine',
      ql_symbol: 'AnalyticEuropeanEngine',
      path: 'pricingengines/vanilla/analyticeuropeanengine.cpp',
      kind: 'solver',
      status: 'todo',
      deps: ['step_2_black'],
      note: 'Closed-form European option pricer with autograd Greeks',
      code: {
        cpp: 'void AnalyticEuropeanEngine::calculate() const { results_.value = black.value(); }',
        python: '',
      },
    },
  ];

  it('executes topological stage 1: Leaf primitive migration', () => {
    // 1. Identify leaf node (0 dependencies)
    const leaf = initialPipelineNodes.find((n) => n.deps.length === 0);
    expect(leaf).toBeDefined();
    expect(leaf?.ql_symbol).toBe('CumulativeNormalDistribution');

    // 2. Simulate migration to PyTorch
    const migratedPython = `import torch
from torch.distributions import Normal

class CumulativeNormalDistribution:
    def __init__(self, device: str = "cuda", dtype: torch.dtype = torch.float64):
        self.normal = Normal(torch.tensor(0.0, device=device, dtype=dtype),
                             torch.tensor(1.0, device=device, dtype=dtype))

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        return self.normal.cdf(x)
`;
    const updatedLeaf: Node = {
      ...leaf!,
      status: 'tested',
      code: { cpp: leaf!.code!.cpp, python: migratedPython },
    };

    expect(updatedLeaf.status).toBe('tested');
    expect(updatedLeaf.code?.python).toContain('self.normal.cdf(x)');
  });

  it('executes topological stage 2: Upstream dependency satisfaction for composite engine', () => {
    // Composite engine step_3_engine depends on step_2_black which depends on step_1_cdf
    const engine = initialPipelineNodes[2];
    const path = getRootToNodePath(engine, initialPipelineNodes);

    expect(path.rootSymbols).toContain('CumulativeNormalDistribution');
    expect(path.symbols).toEqual([
      'CumulativeNormalDistribution',
      'BlackCalculator',
      'AnalyticEuropeanEngine',
    ]);
    expect(path.depth).toBe(3);

    // Generate root-to-node multi-layer integration test
    const integrationTest = generateRootToNodeIntegrationTest(engine, initialPipelineNodes, {
      isModal: true,
      workerId: 'worker-a10g-04',
      gpuAllocated: 'NVIDIA A10G',
    });

    expect(integrationTest.category).toBe('integration');
    expect(integrationTest.shippable).toBe(true);
    expect(integrationTest.pipelineDescription).toContain('CumulativeNormalDistribution');
    expect(integrationTest.testCodeSnippet).toContain('loss.backward()');
    expect(integrationTest.speedup).toBeGreaterThan(10);
  });

  it('synchronizes migrated artifacts into the virtual package repository', () => {
    const generatedFiles: MigratedFile[] = [
      {
        id: 'pkg_readme',
        path: 'README.md',
        content: '# Migrated PyTorch Package\nGetting started guide',
        shippable: true,
      },
      {
        id: 'pkg_init',
        path: 'torch_quantlib/__init__.py',
        content: 'from .math.normal import CumulativeNormalDistribution',
        shippable: true,
      },
      {
        id: 'pkg_normal',
        path: 'torch_quantlib/math/normal.py',
        content: 'class CumulativeNormalDistribution: pass',
        shippable: true,
      },
      {
        id: 'pkg_test_integ',
        path: 'torch_quantlib/tests/test_integration_engine.py',
        content: 'def test_integration_chain(): assert True',
        isTest: true,
        shippable: true,
      },
    ];

    const folderTree = buildFolderTree(generatedFiles);
    expect(folderTree.children.length).toBe(2); // 'torch_quantlib' and 'README.md'

    const torchFolder = folderTree.children.find((c) => c.name === 'torch_quantlib');
    expect(torchFolder).toBeDefined();
    expect(torchFolder?.children.some((c) => c.name === 'math')).toBe(true);
    expect(torchFolder?.children.some((c) => c.name === 'tests')).toBe(true);
  });
});
