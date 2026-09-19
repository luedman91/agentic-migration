/**
 * ============================================================================
 * Unit Tests: Agentic Migration Engine (agentMigration.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates the agentic transpilation module `runAgenticMigration`, verifying
 * deterministic AST extraction, prompt formulation, fallback synthesis, and
 * auto-discovered symbol mapping registration.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runAgenticMigration,
  getBuildingBlocks,
  resetBuildingBlocks,
  inferFolderHierarchy,
  discoverGraphFromSource,
} from '../../server/agent';

describe('Agentic Migration Engine (server/agent.ts)', () => {
  beforeEach(() => {
    resetBuildingBlocks();
    vi.restoreAllMocks();
  });

  it('generates a complete migration response via fallback heuristic when API key is unset', async () => {
    delete process.env.GEMINI_API_KEY;

    const cppCode = `
      Real BlackFormula(Real spot, Real strike, Real forward, Real stdDev) {
        Real d1 = std::log(forward / strike) / stdDev + 0.5 * stdDev;
        return spot * CumulativeNormalDistribution()(d1);
      }
    `;

    const result = await runAgenticMigration(
      'BlackFormula',
      cppCode,
      'PyTorch',
      'cuda',
      'float64',
      [{ symbol: 'CumulativeNormalDistribution', status: 'tested' }]
    );

    expect(result.targetSymbol).toBe('BlackFormula');
    expect(result.pythonCode).toContain('class BlackFormula');
    expect(result.pythonCode).toContain('import torch');
    expect(result.unitTestCode).toContain('def test_blackformula_broadcasting');
    expect(result.numericalTolerance).toBeLessThanOrEqual(1e-8);
  });

  it('automatically infers target folder hierarchy and mirrored test path', () => {
    const pricingEngineHierarchy = inferFolderHierarchy(
      'AnalyticHestonEngine',
      'namespace QuantLib { class AnalyticHestonEngine {}; }',
      'ql/pricingengines/vanilla/analytichestonengine.cpp',
      'torch_quantlib'
    );
    expect(pricingEngineHierarchy.targetSubfolder).toBe('pricingengines/vanilla');
    expect(pricingEngineHierarchy.targetFilePath).toBe('torch_quantlib/pricingengines/vanilla/analytic_heston_engine.py');
    expect(pricingEngineHierarchy.testFilePath).toBe('tests/pricingengines/vanilla/test_analytic_heston_engine.py');

    const yieldCurveHierarchy = inferFolderHierarchy(
      'FlatForward',
      'namespace QuantLib { class FlatForward : public YieldTermStructure {}; }',
      'ql/termstructures/yield/flatforward.cpp',
      'torch_quantlib'
    );
    expect(yieldCurveHierarchy.targetSubfolder).toBe('termstructures/yield');
    expect(yieldCurveHierarchy.targetFilePath).toBe('torch_quantlib/termstructures/yield/flat_forward.py');
    expect(yieldCurveHierarchy.testFilePath).toBe('tests/termstructures/yield/test_flat_forward.py');
  });

  it('discovers and generates a complete topological DAG dynamically without preloaded data', async () => {
    delete process.env.GEMINI_API_KEY;

    const discovered = await discoverGraphFromSource(
      'ql/pricingengines/vanilla/analytichestonengine.cpp',
      '#include <ql/math/distributions/normaldistribution.hpp>\n#include <ql/termstructures/yield/flatforward.hpp>',
      'torch_quantlib'
    );

    expect(discovered.nodes).toBeDefined();
    expect(discovered.nodes.length).toBeGreaterThanOrEqual(4);
    expect(discovered.entryPoint).toBe('ql/pricingengines/vanilla/analytichestonengine.cpp');
    expect(discovered.targetPackageName).toBe('torch_quantlib');

    // Confirm that foundation leaf nodes have empty deps and apex root engine depends on them
    const rootNode = discovered.nodes.find((n) => n.id === 'node_e_entrypoint');
    expect(rootNode).toBeDefined();
    expect(rootNode?.deps.length).toBeGreaterThan(0);

    const foundationLeaf = discovered.nodes.find((n) => n.id === 'node_m_erf');
    expect(foundationLeaf).toBeDefined();
    expect(foundationLeaf?.deps.length).toBe(0);
  });
});
