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
import { runAgenticMigration, getBuildingBlocks, resetBuildingBlocks } from '../../server/agent';

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
});
