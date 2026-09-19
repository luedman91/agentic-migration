/**
 * ============================================================================
 * Unit Tests: Building Blocks & Deterministic Parser (buildingBlocks.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates deterministic C++ AST signature parsing, type mapping detection,
 * custom building block registration, and fallback heuristic synthesis.
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBuildingBlocks,
  addBuildingBlock,
  resetBuildingBlocks,
  analyzeFunctionDeterministic,
  fallbackHeuristicMigration,
} from '../../server/agent';

describe('Deterministic AST Parser & Building Blocks Registry', () => {
  beforeEach(() => {
    resetBuildingBlocks();
  });

  it('provides comprehensive default QuantLib to PyTorch building blocks', () => {
    const blocks = getBuildingBlocks();
    expect(blocks.length).toBeGreaterThan(10);
    expect(blocks.some((b) => b.sourceType === 'Real')).toBe(true);
    expect(blocks.some((b) => b.sourceType === 'CumulativeNormalDistribution')).toBe(true);
    expect(blocks.some((b) => b.sourceType === 'Matrix')).toBe(true);
  });

  it('adds custom building blocks and permits retrieval', () => {
    const newBlock = addBuildingBlock({
      sourceType: 'CustomTensorType',
      targetType: 'torch.Tensor(dtype=torch.float32)',
      category: 'primitive',
      isVectorized: true,
      notes: 'Test mapping',
    });

    expect(newBlock.id).toBeDefined();
    const blocks = getBuildingBlocks();
    expect(blocks.some((b) => b.sourceType === 'CustomTensorType')).toBe(true);
  });

  it('resets registry back to defaults cleanly', () => {
    addBuildingBlock({
      sourceType: 'DisposableType',
      targetType: 'torch.Tensor',
      category: 'container',
      isVectorized: false,
      notes: '',
    });

    const reset = resetBuildingBlocks();
    expect(reset.some((b) => b.sourceType === 'DisposableType')).toBe(false);
  });

  it('parses C++ function signatures and detects parameter types', () => {
    const cppCode = `
      Real calculateEuropeanNPV(Real spot, Rate riskFreeRate, Volatility vol, Time maturity) {
        Real d1 = (std::log(spot) + (riskFreeRate + 0.5 * vol * vol) * maturity) / (vol * std::sqrt(maturity));
        return spot * CumulativeNormalDistribution()(d1);
      }
    `;

    const analysis = analyzeFunctionDeterministic(cppCode);
    expect(analysis.functionName).toBe('calculateEuropeanNPV');
    expect(analysis.returnType).toBe('Real');
    expect(analysis.parameters.length).toBe(4);
    expect(analysis.parameters[0].name).toBe('spot');
    expect(analysis.parameters[0].mappedType).toContain('torch');
    expect(analysis.isPureMath).toBe(true);
    expect(analysis.detectedBuildingBlocks.length).toBeGreaterThan(0);
  });

  it('generates a valid heuristic fallback response when external APIs are offline', () => {
    const analysis = analyzeFunctionDeterministic('Real calculate() { return 1.0; }');
    const result = fallbackHeuristicMigration('BlackCalculator', 'Real calculate() { return 1.0; }', 'cuda', 'float64', analysis);

    expect(result.targetSymbol).toBe('BlackCalculator');
    expect(result.pythonCode).toContain('class BlackCalculator');
    expect(result.pythonCode).toContain('import torch');
    expect(result.unitTestCode).toContain('def test_blackcalculator_broadcasting');
    expect(result.numericalTolerance).toBeLessThanOrEqual(1e-8);
  });
});
