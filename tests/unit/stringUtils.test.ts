/**
 * ============================================================================
 * Python Naming & Snake Case Transformation Unit Tests
 * ============================================================================
 * 
 * Feature Description:
 * Validates that all generated and normalized Python module and test filenames
 * strictly enforce PEP 8 snake_case conventions with underscore word boundaries.
 * 
 * Use Cases:
 * 1. Testing PascalCase and camelCase conversion to underscored lowercase names.
 * 2. Testing uppercase acronym preservation and boundary segmentation (e.g. SVD, QR, SIMD).
 * 3. Testing dictionary-based segmentation for squished legacy C++ filenames.
 * 4. Testing full path normalization for virtual filesystem module and test files.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { toSnakeCase, splitCompoundLowercaseWords, ensurePythonFilePathHasUnderscores } from '../../src/utils/stringUtils';
import {
  toSnakeCase as serverToSnakeCase,
  splitCompoundLowercaseWords as serverSplitCompound,
  ensurePythonFilePathHasUnderscores as serverEnsurePythonFilePath
} from '../../server/naming';

describe('Python File Naming & Snake Case Transformation Utilities', () => {
  it('converts PascalCase and camelCase symbols to snake_case with underscores', () => {
    expect(toSnakeCase('AnalyticHestonEngine')).toBe('analytic_heston_engine');
    expect(toSnakeCase('CumulativeNormalDistribution')).toBe('cumulative_normal_distribution');
    expect(toSnakeCase('VanillaOption')).toBe('vanilla_option');
    expect(toSnakeCase('FlatForward')).toBe('flat_forward');
    expect(toSnakeCase('DayCounter')).toBe('day_counter');
    expect(toSnakeCase('Actual365Fixed')).toBe('actual_365_fixed');
    expect(toSnakeCase('BlackScholesCalculator')).toBe('black_scholes_calculator');
    expect(toSnakeCase('BlackCalculator')).toBe('black_calculator');
    expect(toSnakeCase('BlackFormula')).toBe('black_formula');
    expect(toSnakeCase('GaussianErrorFunction')).toBe('gaussian_error_function');
    expect(toSnakeCase('CashFlows.npv')).toBe('cash_flows_npv');
  });

  it('handles acronyms and multi-capital abbreviations properly', () => {
    expect(toSnakeCase('HouseholderQRDecomposer')).toBe('householder_qr_decomposer');
    expect(toSnakeCase('SingularValueDecompositionSVD')).toBe('singular_value_decomposition_svd');
    expect(toSnakeCase('SIMDFloatDoublePacker')).toBe('simd_float_double_packer');
    expect(toSnakeCase('ProtobufFastStreamReader')).toBe('protobuf_fast_stream_reader');
    expect(toSnakeCase('FDVanillaEngine')).toBe('fd_vanilla_engine');
  });

  it('segments squished all-lowercase C++ filenames using domain vocabulary', () => {
    expect(splitCompoundLowercaseWords('analytichestonengine')).toBe('analytic_heston_engine');
    expect(splitCompoundLowercaseWords('flatforward')).toBe('flat_forward');
    expect(splitCompoundLowercaseWords('daycounter')).toBe('day_counter');
    expect(splitCompoundLowercaseWords('blackformula')).toBe('black_formula');
    expect(splitCompoundLowercaseWords('normaldistribution')).toBe('normal_distribution');
    expect(splitCompoundLowercaseWords('discountcurve')).toBe('discount_curve');
  });

  it('leaves already underscored strings intact', () => {
    expect(toSnakeCase('flat_forward')).toBe('flat_forward');
    expect(toSnakeCase('day_counter')).toBe('day_counter');
    expect(toSnakeCase('analytic_heston_engine')).toBe('analytic_heston_engine');
  });

  it('normalizes full module file paths with underscores', () => {
    expect(
      ensurePythonFilePathHasUnderscores(
        'torch_quantlib/pricingengines/vanilla/analytichestonengine.py',
        'AnalyticHestonEngine'
      )
    ).toBe('torch_quantlib/pricingengines/vanilla/analytic_heston_engine.py');

    expect(
      ensurePythonFilePathHasUnderscores(
        'torch_quantlib/termstructures/yield/flatforward.py',
        'FlatForward'
      )
    ).toBe('torch_quantlib/termstructures/yield/flat_forward.py');

    expect(
      ensurePythonFilePathHasUnderscores(
        'tests/pricingengines/vanilla/test_analytichestonengine.py',
        'AnalyticHestonEngine'
      )
    ).toBe('tests/pricingengines/vanilla/test_analytic_heston_engine.py');

    expect(
      ensurePythonFilePathHasUnderscores(
        'tests/termstructures/yield/test_flatforward.py',
        'FlatForward'
      )
    ).toBe('tests/termstructures/yield/test_flat_forward.py');

    // Preserves dunder and standard test files
    expect(ensurePythonFilePathHasUnderscores('torch_quantlib/__init__.py')).toBe('torch_quantlib/__init__.py');
    expect(ensurePythonFilePathHasUnderscores('tests/conftest.py')).toBe('tests/conftest.py');
  });

  it('matches server-side naming behavior identically', () => {
    expect(serverToSnakeCase('AnalyticHestonEngine')).toBe('analytic_heston_engine');
    expect(serverToSnakeCase('FlatForward')).toBe('flat_forward');
    expect(serverSplitCompound('analytichestonengine')).toBe('analytic_heston_engine');
    expect(serverSplitCompound('flatforward')).toBe('flat_forward');
    expect(
      serverEnsurePythonFilePath(
        'torch_quantlib/pricingengines/vanilla/analytichestonengine.py',
        'AnalyticHestonEngine'
      )
    ).toBe('torch_quantlib/pricingengines/vanilla/analytic_heston_engine.py');
    expect(
      serverEnsurePythonFilePath(
        'tests/termstructures/yield/test_flatforward.py',
        'FlatForward'
      )
    ).toBe('tests/termstructures/yield/test_flat_forward.py');
  });
});
