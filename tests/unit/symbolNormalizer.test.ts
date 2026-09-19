/**
 * ============================================================================
 * Unit Tests: Symbol Aliases and Equivalence Normalizer (symbolNormalizer.test.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Validates cross-framework symbol equivalence and canonicalization between
 * legacy or non-standard symbol naming variations (e.g. GaussianErrorFunction)
 * and canonical QuantLib / PyTorch mathematical representations (e.g. ErrorFunction).
 * 
 * Use Cases:
 * 1. Resolving non-standard symbol names (GaussianErrorFunction -> ErrorFunction).
 * 2. Bi-directional equivalence checking between canonical and alias symbols.
 * 3. Graceful fallback for unknown or empty symbol strings.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  SYMBOL_ALIASES,
  normalizeSymbol,
  areSymbolsEquivalent,
} from '../../src/config/appConfig';

describe('Symbol Normalizer and Equivalence Engine', () => {
  it('maps GaussianErrorFunction to ErrorFunction in SYMBOL_ALIASES', () => {
    expect(SYMBOL_ALIASES.GaussianErrorFunction).toBe('ErrorFunction');
  });

  it('normalizes GaussianErrorFunction to canonical ErrorFunction', () => {
    expect(normalizeSymbol('GaussianErrorFunction')).toBe('ErrorFunction');
  });

  it('returns unchanged symbol when no alias is registered', () => {
    expect(normalizeSymbol('BlackScholesMertonEngine')).toBe('BlackScholesMertonEngine');
    expect(normalizeSymbol('AnalyticEuropeanEngine')).toBe('AnalyticEuropeanEngine');
    expect(normalizeSymbol('')).toBe('');
  });

  it('determines equivalence between GaussianErrorFunction and ErrorFunction', () => {
    expect(areSymbolsEquivalent('GaussianErrorFunction', 'ErrorFunction')).toBe(true);
    expect(areSymbolsEquivalent('ErrorFunction', 'GaussianErrorFunction')).toBe(true);
    expect(areSymbolsEquivalent('GaussianErrorFunction', 'GaussianErrorFunction')).toBe(true);
    expect(areSymbolsEquivalent('ErrorFunction', 'ErrorFunction')).toBe(true);
  });

  it('correctly handles identity equality for arbitrary symbols', () => {
    expect(areSymbolsEquivalent('HestonModel', 'HestonModel')).toBe(true);
    expect(areSymbolsEquivalent('MoroInverseCumulative', 'MoroInverseCumulative')).toBe(true);
  });

  it('rejects equivalence for unrelated symbols', () => {
    expect(areSymbolsEquivalent('GaussianErrorFunction', 'NormalDistribution')).toBe(false);
    expect(areSymbolsEquivalent('ErrorFunction', 'CumulativeNormalDistribution')).toBe(false);
    expect(areSymbolsEquivalent('BlackFormula', 'BachelierFormula')).toBe(false);
  });

  it('safely handles undefined and null inputs without throwing', () => {
    expect(areSymbolsEquivalent(undefined, 'ErrorFunction')).toBe(false);
    expect(areSymbolsEquivalent('ErrorFunction', undefined)).toBe(false);
    expect(areSymbolsEquivalent(undefined, undefined)).toBe(false);
    expect(areSymbolsEquivalent('', 'ErrorFunction')).toBe(false);
  });
});
