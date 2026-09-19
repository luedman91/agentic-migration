/**
 * ============================================================================
 * Example Presets & Showcase Codebases Module (src/data/examplePresets.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Houses standalone showcase examples and reference archetype configurations
 * for the Graph-Based Agentic Code Migration Engine. Decouples concrete
 * demonstration repositories (such as QuantLib C++ -> PyTorch or nlohmann/json ->
 * Python) from the generalized, framework-agnostic migration core.
 * 
 * Use Cases:
 * 1. Loading reference mathematical DAG archetypes (QuantLib to PyTorch with Autograd).
 * 2. Loading non-mathematical system library archetypes (nlohmann/json AST serializer).
 * 3. Loading dense numerical linear algebra archetypes (Eigen / BLAS to JAX/PyTorch).
 * 4. Serving as templates for custom arbitrary repository migrations.
 * ============================================================================
 */

import { ProjectConfig } from '../types';

export interface LibraryPreset {
  id: string;
  name: string;
  category: string;
  repoUrl: string;
  branch: string;
  entryPoint: string;
  sourceLanguage: string;
  targetFramework: string;
  targetDevice: ProjectConfig['targetDevice'];
  precision: ProjectConfig['precision'];
  sourceLibraryName: string;
  targetLibraryName: string;
  nodeCount: number;
  depth: number;
  description: string;
  badge: string;
  highlight?: boolean;
  isMathLibrary?: boolean;
  isExamplePreset: boolean;
  otherInstructions: string;
}

/**
 * Showcase Reference Examples:
 * The Graph-Based Agentic Code Migration Engine is generalized to migrate any
 * legacy codebase (C/C++, Fortran, Object-Oriented libraries) to modern
 * frameworks (PyTorch, JAX, Python, Triton). These preloaded entries serve
 * as demonstration examples.
 */
export const EXAMPLE_PRESETS: LibraryPreset[] = [
  {
    id: 'deep_distributed_pipeline',
    name: '[Showcase Example] 28 Nodes: Distributed Function Pipeline (QuantLib C++ → PyTorch)',
    category: 'Showcase: Quantitative Finance (Math)',
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analyticeuropeanengine.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'pytorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_quantlib',
    nodeCount: 28,
    depth: 10,
    description: 'Reference mathematical example: 28-node graph spanning 10 topological layers: closed-form Black-Scholes formulas, Bachelier distributions, yield curves, and batched Autograd Greeks.',
    badge: 'Example • 28 Nodes • Math',
    isMathLibrary: true,
    isExamplePreset: true,
    otherInstructions: `numerical diff tolerance should be 1e-5
vectorize inner mathematical loops with batched PyTorch tensor operations
preserve original C++ docstrings and mathematical LaTeX comments
strictly annotate all function signatures with Python 3.11 type hints
export canonical symbol aliases (e.g. GaussianErrorFunction = ErrorFunction)`
  },
  {
    id: 'massive_enterprise_150_dag',
    name: '[Showcase Example] 150 Nodes: Enterprise Ultra-Deep Dependency Graph (QuantLib Core & C++ Engine)',
    category: 'Showcase: Quantitative Finance (Math)',
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analytichestonengine.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'pytorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'QuantLib C++ Core',
    targetLibraryName: 'torch_quantlib',
    nodeCount: 150,
    depth: 15,
    description: 'Reference enterprise ultra-deep graph: 150 nodes across 15 topological layers: SIMD buffers, Cholesky, Milstein SDEs, stochastic volatility calibration, and distributed tensor pipelines.',
    badge: 'Example • 150 Nodes • Deep Graph',
    highlight: true,
    isMathLibrary: true,
    isExamplePreset: true,
    otherInstructions: `numerical diff tolerance should be 1e-5
vectorize inner mathematical loops with batched PyTorch tensor operations
preserve original C++ docstrings and mathematical LaTeX comments
strictly annotate all function signatures with Python 3.11 type hints
export canonical symbol aliases (e.g. GaussianErrorFunction = ErrorFunction)`
  },
  {
    id: 'nlohmann_json_parser',
    name: '[Example 3] nlohmann/json C++ → Python/Pydantic (24 Nodes • Non-Math AST)',
    category: 'Showcase: Data Structures & Parsers (Non-Math)',
    repoUrl: 'https://github.com/nlohmann/json.git',
    branch: 'v3.11.3',
    entryPoint: 'include/nlohmann/json.hpp',
    sourceLanguage: 'C++',
    targetFramework: 'python',
    targetDevice: 'cpu',
    precision: 'float64',
    sourceLibraryName: 'nlohmann::json',
    targetLibraryName: 'py_json_fast',
    nodeCount: 24,
    depth: 6,
    description: 'Reference non-mathematical system library: recursive JSON token parsing, UTF-8 unicode handling, serializer object models, and strict Pydantic schemas without numerical tolerances.',
    badge: 'Example • 24 Nodes • Non-Math',
    isMathLibrary: false,
    isExamplePreset: true,
    otherInstructions: `functional & logical equality assertions (non-math)
preserve strict exception handling & boundary validation
generate idiomatic Python dataclasses and Pydantic validation schemas
preserve original C++ docstrings & comments
strictly annotate with Python 3.11 type hints`
  },
  {
    id: 'eigen_blas_algebra',
    name: '[Example 4] Eigen C++ → JAX / PyTorch (18 Nodes • Dense Linear Algebra)',
    category: 'Showcase: Linear Algebra (Math)',
    repoUrl: 'https://gitlab.com/libeigen/eigen.git',
    branch: '3.4.0',
    entryPoint: 'Eigen/Dense',
    sourceLanguage: 'C++',
    targetFramework: 'pytorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'Eigen C++',
    targetLibraryName: 'torch_eigen_dense',
    nodeCount: 18,
    depth: 5,
    description: 'Reference linear algebra example: Householder reflections, Cholesky factorization, QR decomposition, and BLAS-accelerated batched tensor contractions.',
    badge: 'Example • 18 Nodes • Linear Algebra',
    isMathLibrary: true,
    isExamplePreset: true,
    otherInstructions: `numerical diff tolerance should be 1e-7
vectorize matrix decompositions with torch.linalg and JAX lax
preserve original C++ algorithmic comments
export numerical oracle parity tests`
  }
];

/**
 * Backward compatibility alias
 */
export const LIBRARY_PRESETS = EXAMPLE_PRESETS;

/**
 * Retrieves an example preset by ID or returns the first preset.
 * 
 * @param id - Preset identifier string
 * @returns Matching LibraryPreset or the default first preset
 */
export function getExamplePresetById(id: string): LibraryPreset {
  return EXAMPLE_PRESETS.find((p) => p.id === id) || EXAMPLE_PRESETS[0];
}
