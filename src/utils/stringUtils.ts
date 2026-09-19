/**
 * ============================================================================
 * Python Naming & Snake Case Transformation Utilities
 * ============================================================================
 * 
 * Feature Description:
 * Provides robust transformation, normalization, and validation utilities for
 * Python module and test filenames in the migration engine. Ensures all generated
 * Python files follow standard PEP 8 naming conventions using lowercase letters
 * and underscore separators between words, preventing squished or camelCased
 * module names.
 * 
 * Use Cases:
 * 1. Converting C++ PascalCase / camelCase symbols (e.g. AnalyticHestonEngine)
 *    into clean snake_case filenames (e.g. analytic_heston_engine.py).
 * 2. Normalizing legacy squished C++ filenames (e.g. flatforward.cpp, daycounter.cpp)
 *    into underscored Python module paths (e.g. flat_forward.py, day_counter.py).
 * 3. Guaranteeing that both module files and mirrored test files consistently
 *    use underscores across the virtual filesystem and ZIP package exports.
 * ============================================================================
 */

import { logClientFunctionCall } from './logger';

/**
 * Common domain vocabulary dictionary for financial engineering, mathematics,
 * algorithms, and system programming. Used to reliably segment squished lowercase
 * C++ filenames that lack uppercase boundary cues (e.g. "analytichestonengine").
 */
const DOMAIN_SEGMENT_TERMS: string[] = [
  'analytic', 'european', 'heston', 'bachelier', 'black', 'scholes', 'calculator',
  'formula', 'constant', 'flat', 'forward', 'day', 'counter', 'counters', 'actual',
  'fixed', 'normal', 'distribution', 'distributions', 'term', 'structure', 'structures',
  'discount', 'curve', 'curves', 'yield', 'cash', 'flows', 'flow', 'monte', 'carlo',
  'sobol', 'linear', 'algebra', 'error', 'function', 'functions', 'gaussian', 'vanilla',
  'option', 'options', 'engine', 'engines', 'pricing', 'process', 'processes',
  'stochastic', 'volatility', 'surface', 'cube', 'matrix', 'vector', 'solver', 'solvers',
  'pde', 'finite', 'difference', 'tree', 'lattice', 'swap', 'bond', 'cap', 'floor',
  'swaption', 'barrier', 'asian', 'american', 'integral', 'quadrature', 'interpolation',
  'spline', 'cholesky', 'decomposer', 'generator', 'profiler', 'packer', 'segment',
  'stream', 'reader', 'snappy', 'encoder', 'round', 'trip', 'quickstart', 'pipeline',
  'portfolio', 'multi', 'asset', 'jump', 'diffusion', 'bessel', 'beta', 'gamma',
  'legendre', 'hermite', 'hypergeometric', 'hypergeom', 'arena', 'buffer', 'pool',
  'lock', 'free', 'ring', 'queue', 'direct', 'dma', 'packet', 'murmur', 'hash',
  'bitmapped', 'flag', 'register', 'compressed', 'complementary', 'erf', 'erfc',
  'standard', 'density', 'density', 'density', 'abscissae', 'roots', 'orthogonal',
  'thomas', 'eigen', 'symmetric', 'strassen', 'tensor', 'kronecker', 'band', 'banded',
  'svd', 'qr', 'lu', 'pade', 'exponential', 'expm', 'inv', 'moro', 'lanczos'
];

/**
 * Splits an all-lowercase squished word using known quantitative domain terms.
 *
 * @param str - All-lowercase string without separators (e.g. "analytichestonengine")
 * @returns Underscore-separated string (e.g. "analytic_heston_engine")
 */
export function splitCompoundLowercaseWords(str: string): string {
  if (!str || str.length < 4) return str;
  if (str.includes('_') || str.includes('-')) return str;

  // Attempt greedy segment matching from the start of the string
  const segments: string[] = [];
  let remaining = str;

  while (remaining.length > 0) {
    let matched = false;

    // First check numeric blocks: e.g. "365", "64", "0", "1"
    const numMatch = remaining.match(/^(\d+)/);
    if (numMatch) {
      segments.push(numMatch[1]);
      remaining = remaining.slice(numMatch[1].length);
      continue;
    }

    // Sort terms by length descending to match longest prefixes first
    for (const term of DOMAIN_SEGMENT_TERMS) {
      if (remaining.startsWith(term)) {
        segments.push(term);
        remaining = remaining.slice(term.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // If we couldn't match a known term, advance character by character
      if (segments.length > 0 && remaining.length <= 3) {
        // Short trailing leftover (e.g. "vol", "npv", "pdf")
        segments.push(remaining);
        remaining = '';
      } else {
        // Cannot segment reliably without tearing arbitrary words, return original
        return str;
      }
    }
  }

  return segments.length > 1 ? segments.join('_') : str;
}

/**
 * Converts any symbol, class name, or filename into clean Python snake_case with underscores.
 * Handles PascalCase, camelCase, acronyms (e.g. QR, SVD, SIMD), and squished lowercase terms.
 *
 * @param str - Input symbol or name (e.g. "AnalyticHestonEngine", "FlatForward", "ql/daycounter.cpp")
 * @returns Underscore-separated lowercase snake_case string (e.g. "analytic_heston_engine", "flat_forward")
 */
export function toSnakeCase(str: string): string {
  if (!str) return 'module';

  // Strip path prefixes and file extensions if present
  let clean = str
    .replace(/^.*[\\/]/, '')
    .replace(/\.(cpp|hpp|c|h|py|ts|tsx|js)$/i, '')
    .replace(/::/g, '_')
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_');

  // Check if string has uppercase characters indicating PascalCase / camelCase
  const hasUppercase = /[A-Z]/.test(clean);

  if (hasUppercase) {
    // 1. Handle multi-letter uppercase acronyms followed by PascalCase word:
    // e.g. "HouseholderQRDecomposer" -> "Householder_QR_Decomposer"
    clean = clean.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');

    // 2. Handle lowercase / digit transition to uppercase:
    // e.g. "AnalyticHestonEngine" -> "Analytic_Heston_Engine"
    clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1_$2');

    // 3. Handle letter-to-digit and digit-to-letter transitions:
    // e.g. "Actual365Fixed" -> "Actual_365_Fixed"
    clean = clean.replace(/([a-zA-Z])(\d+)/g, '$1_$2');
    clean = clean.replace(/(\d+)([a-zA-Z])/g, '$1_$2');
  } else if (!clean.includes('_')) {
    // All-lowercase squished string without underscores: try domain segmentation
    clean = splitCompoundLowercaseWords(clean);
  }

  // Normalize underscores and lowercase
  clean = clean
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return clean || 'module';
}

/**
 * Ensures a Python file path (.py) uses underscore separators in its file name.
 * Preserves standard dunder files (__init__.py) and mirror test directories.
 *
 * @param filePath - Full or relative file path (e.g. "torch_quantlib/pricingengines/analytichestonengine.py")
 * @param fallbackSymbol - Optional symbol name used to recover original capitalization if path is squished
 * @returns Normalized file path with underscores in the filename
 */
export function ensurePythonFilePathHasUnderscores(filePath: string, fallbackSymbol?: string): string {
  if (!filePath) return 'module.py';

  // Preserve __init__.py and __main__.py
  if (filePath.endsWith('__init__.py') || filePath.endsWith('__main__.py') || filePath.endsWith('conftest.py')) {
    return filePath;
  }

  const parts = filePath.split('/');
  const rawFileName = parts.pop() || 'module.py';
  const dir = parts.length > 0 ? parts.join('/') + '/' : '';

  let baseName = rawFileName.replace(/\.py$/i, '');
  const isTest = baseName.startsWith('test_');
  if (isTest) {
    baseName = baseName.slice(5); // remove "test_" prefix
  }

  // Derive snake_case name using fallbackSymbol if available, else the baseName
  let snakeBase = toSnakeCase(fallbackSymbol ? fallbackSymbol.replace(/^test_/i, '') : baseName);

  // If baseName already had valid underscores and fallbackSymbol wasn't given, retain it
  if (baseName.includes('_') && (!fallbackSymbol || fallbackSymbol.toLowerCase() === baseName)) {
    snakeBase = baseName.toLowerCase();
  }

  const finalFileName = isTest ? `test_${snakeBase}.py` : `${snakeBase}.py`;
  return `${dir}${finalFileName}`;
}
