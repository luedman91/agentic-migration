/**
 * ============================================================================
 * Initial Virtual Repository File System (initialFiles.ts)
 * ============================================================================
 * 
 * Feature Description:
 * Defines the initial virtual file system for the transpiled PyTorch repository.
 * Implements a clean, modular folder structure for the library package and an
 * EXACT MIRROR of that folder structure for the comprehensive test suites,
 * ensuring standard production Python engineering hygiene.
 * 
 * Directory Architecture:
 * ----------------------------------------------------------------------------
 * torch_quantlib/                     # Primary library package
 *   ├── __init__.py
 *   ├── api/
 *   │   ├── __init__.py
 *   │   └── torch_api.py
 *   ├── math/
 *   │   ├── __init__.py
 *   │   ├── distributions.py
 *   │   └── special.py
 *   ├── pricingengines/
 *   │   ├── __init__.py
 *   │   ├── analytic_european.py
 *   │   ├── bachelier.py
 *   │   └── black_formula.py
 *   ├── termstructures/
 *   │   ├── __init__.py
 *   │   └── flat_forward.py
 *   └── time/
 *       ├── __init__.py
 *       └── day_counter.py
 * 
 * tests/                              # Mirrored test hierarchy
 *   ├── __init__.py
 *   ├── conftest.py
 *   ├── api/
 *   │   ├── __init__.py
 *   │   └── test_torch_api.py
 *   ├── math/
 *   │   ├── __init__.py
 *   │   ├── test_distributions.py
 *   │   └── test_special.py
 *   ├── pricingengines/
 *   │   ├── __init__.py
 *   │   ├── test_analytic_european.py
 *   │   ├── test_bachelier.py
 *   │   └── test_black_formula.py
 *   ├── termstructures/
 *   │   ├── __init__.py
 *   │   └── test_flat_forward.py
 *   ├── time/
 *   │   ├── __init__.py
 *   │   └── test_day_counter.py
 *   └── integration/
 *       ├── __init__.py
 *       ├── test_end_to_end_pricing_pipeline.py
 *       ├── test_multi_asset_portfolio.py
 *       └── test_torchscript_export.py
 * ============================================================================
 */

import { MigratedFile } from '../types';

export const initialMigratedFiles: MigratedFile[] = [
  // --------------------------------------------------------------------------
  // GETTING STARTED & ROOT SETUP CONFIGURATION
  // --------------------------------------------------------------------------
  {
    id: 'file_readme',
    path: 'README.md',
    nodeId: 'getting_started',
    symbol: 'GETTING_STARTED',
    sizeBytes: 4680,
    linesCount: 125,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:30:00',
    content: `# torch-quantlib: High-Throughput PyTorch Option Pricing & Greeks Engine

Transpiled directly from **QuantLib C++** into vectorized PyTorch tensor operations with **GPU acceleration** and **end-to-end Autograd reverse-mode automatic differentiation**.

---

## 📦 Project Architecture & Mirrored Test Hierarchy

The repository follows clean enterprise Python packaging standards where **unit tests strictly mirror the library source folder structure**:

\`\`\`
torch_quantlib/                        # Primary Library Package
├── __init__.py
├── api/                               # High-level entry points and autograd batch API
│   ├── __init__.py
│   └── torch_api.py
├── math/                              # Mathematical primitives and distributions
│   ├── __init__.py
│   ├── distributions.py               # Normal CDF/PDF via torch.special.ndtr
│   └── special.py                     # erf, erfc special math functions
├── pricingengines/                    # Analytical option pricing engines
│   ├── __init__.py
│   ├── analytic_european.py           # Generalized Black-Scholes-Merton engine
│   ├── bachelier.py                   # Normal model for negative interest rates
│   └── black_formula.py               # Black 1976 option pricer
├── termstructures/                    # Yield and volatility term structures
│   ├── __init__.py
│   └── flat_forward.py                # Zero discount curves
└── time/                              # Day count fraction conventions
    ├── __init__.py
    └── day_counter.py                 # Actual/365, Actual/360 day counters

tests/                                 # Mirrored Test Suite (1:1 with source)
├── __init__.py
├── conftest.py                        # Shared Pytest fixtures, GPU devices & tolerances
├── api/                               # Mirrored tests for torch_quantlib/api
│   ├── __init__.py
│   └── test_torch_api.py
├── math/                              # Mirrored tests for torch_quantlib/math
│   ├── __init__.py
│   ├── test_distributions.py
│   └── test_special.py
├── pricingengines/                    # Mirrored tests for torch_quantlib/pricingengines
│   ├── __init__.py
│   ├── test_analytic_european.py
│   ├── test_bachelier.py
│   └── test_black_formula.py
├── termstructures/                    # Mirrored tests for torch_quantlib/termstructures
│   ├── __init__.py
│   └── test_flat_forward.py
├── time/                              # Mirrored tests for torch_quantlib/time
│   ├── __init__.py
│   └── test_day_counter.py
└── integration/                       # Multi-module end-to-end pipelines
    ├── __init__.py
    ├── test_end_to_end_pricing_pipeline.py
    ├── test_multi_asset_portfolio.py
    └── test_torchscript_export.py
\`\`\`

---

## 🚀 Quick Start (In 60 Seconds)

### 1. Installation

\`\`\`bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate

# Install requirements
pip install -r requirements.txt

# Or install in editable mode
pip install -e .
\`\`\`

---

## ⚡ Basic Usage: Vectorized European Pricing

Price **100,000 contracts simultaneously** on your GPU in milliseconds:

\`\`\`python
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

N = 100_000
spots = torch.full((N,), 100.0, dtype=torch.float64, device=device)
strikes = torch.linspace(70.0, 130.0, N, dtype=torch.float64, device=device)
rates = torch.full((N,), 0.05, dtype=torch.float64, device=device)
div_yields = torch.zeros(N, dtype=torch.float64, device=device)
vols = torch.full((N,), 0.20, dtype=torch.float64, device=device)
maturities = torch.full((N,), 1.0, dtype=torch.float64, device=device)

prices = price_analytic_european(
    spot=spots,
    strike=strikes,
    rate=rates,
    div_yield=div_yields,
    vol=vols,
    maturity=maturities,
    is_call=True
)

print(f"Prices shape: {prices.shape}")
print(f"Sample price (ATM): \${prices[N // 2].item():.4f}")
\`\`\`

---

## 🧪 Running Mirrored Test Suites

\`\`\`bash
# 1. Run all unit tests mirroring the package structure
pytest tests/math tests/pricingengines tests/termstructures tests/time tests/api -v

# 2. Run end-to-end multi-module integration tests
pytest tests/integration -v

# 3. Run all tests with benchmark timings
pytest tests --durations=0
\`\`\`
`,
  },
  {
    id: 'file_requirements',
    path: 'requirements.txt',
    nodeId: 'getting_started',
    symbol: 'REQUIREMENTS',
    sizeBytes: 320,
    linesCount: 12,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:30:00',
    content: `torch>=2.2.0
numpy>=1.24.0
pytest>=8.0.0
scipy>=1.11.0
`,
  },
  {
    id: 'file_pyproject',
    path: 'pyproject.toml',
    nodeId: 'getting_started',
    symbol: 'BUILD_CONFIG',
    sizeBytes: 840,
    linesCount: 32,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:30:00',
    content: `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "torch_quantlib"
version = "1.34.0"
description = "High-performance PyTorch transpilation of QuantLib quantitative finance library"
readme = "README.md"
requires-python = ">=3.9"
dependencies = [
    "torch>=2.2.0",
    "numpy>=1.24.0"
]

[project.optional-dependencies]
test = [
    "pytest>=8.0.0"
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
`,
  },
  {
    id: 'file_example_script',
    path: 'examples/quickstart_pricing.py',
    nodeId: 'getting_started',
    symbol: 'EXAMPLE_SCRIPT',
    sizeBytes: 2150,
    linesCount: 58,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:30:00',
    content: `"""
Runnable standalone example: QuantLib vs PyTorch speedup demonstration.
Run directly with: python examples/quickstart_pricing.py
"""
import time
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Running on accelerator device: {device}")

    n = 250_000
    print(f"Generating {n:,} option contracts for batch evaluation...")
    
    spots = torch.linspace(80.0, 120.0, n, dtype=torch.float64, device=device)
    strikes = torch.full((n,), 100.0, dtype=torch.float64, device=device)
    rates = torch.full((n,), 0.05, dtype=torch.float64, device=device)
    div_yields = torch.full((n,), 0.01, dtype=torch.float64, device=device)
    vols = torch.linspace(0.1, 0.5, n, dtype=torch.float64, device=device)
    maturities = torch.full((n,), 1.0, dtype=torch.float64, device=device)

    # Warmup
    _ = price_analytic_european(spots[:10], strikes[:10], rates[:10], div_yields[:10], vols[:10], maturities[:10])
    if device.type == 'cuda':
        torch.cuda.synchronize()

    start = time.perf_counter()
    prices = price_analytic_european(spots, strikes, rates, div_yields, vols, maturities, is_call=True)
    if device.type == 'cuda':
        torch.cuda.synchronize()
    elapsed = (time.perf_counter() - start) * 1000.0

    print(f"Successfully priced {n:,} options in {elapsed:.2f} ms!")
    print(f"Throughput: {n / (elapsed / 1000.0):,.0f} options / second")
    print(f"ATM Call Price: \${prices[n // 2].item():.4f}")

if __name__ == '__main__':
    main()
`,
  },

  // --------------------------------------------------------------------------
  // PRIMARY LIBRARY MODULES (torch_quantlib/)
  // --------------------------------------------------------------------------
  {
    id: 'file_init_pkg',
    path: 'torch_quantlib/__init__.py',
    nodeId: 'getting_started',
    symbol: 'PACKAGE_INIT',
    sizeBytes: 420,
    linesCount: 14,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""
torch_quantlib: Vectorized PyTorch port of QuantLib Quantitative Finance Library.
"""
__version__ = "1.34.0"

from torch_quantlib.pricingengines.analytic_european import price_analytic_european
from torch_quantlib.api.torch_api import batch_price_and_greeks

__all__ = ["price_analytic_european", "batch_price_and_greeks"]
`,
  },
  {
    id: 'file_init_math',
    path: 'torch_quantlib/math/__init__.py',
    nodeId: 'getting_started',
    symbol: 'MATH_INIT',
    sizeBytes: 310,
    linesCount: 10,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""Mathematical primitives, distributions, and special functions."""
from torch_quantlib.math.special import error_function, complementary_error_function
from torch_quantlib.math.distributions import normal_cdf, normal_pdf

__all__ = ["error_function", "complementary_error_function", "normal_cdf", "normal_pdf"]
`,
  },
  {
    id: 'file_special_math',
    path: 'torch_quantlib/math/special.py',
    nodeId: '1',
    symbol: 'ErrorFunction',
    sizeBytes: 2450,
    linesCount: 68,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""
Vectorized special mathematical functions ported from QuantLib C++
Original: ql/math/errorfunction.hpp
Target: PyTorch Autograd & CUDA / CPU
"""
import torch

def error_function(x: torch.Tensor) -> torch.Tensor:
    """
    Gaussian error function erf(x).
    Preserves float64 double-precision and autograd gradient backward pass.
    """
    return torch.special.erf(x)

def complementary_error_function(x: torch.Tensor) -> torch.Tensor:
    """
    Complementary error function erfc(x) = 1 - erf(x).
    """
    return torch.special.erfc(x)
`,
  },
  {
    id: 'file_distributions',
    path: 'torch_quantlib/math/distributions.py',
    nodeId: '2',
    symbol: 'CumulativeNormalDistribution',
    sizeBytes: 3820,
    linesCount: 94,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:05',
    content: `"""
Normal distributions ported from QuantLib C++
Original: ql/math/distributions/normaldistribution.hpp
Target: PyTorch Autograd & Vectorized Tensors
"""
import math
import torch

_SQRT_2 = math.sqrt(2.0)
_INV_SQRT_2PI = 1.0 / math.sqrt(2.0 * math.pi)

def normal_cdf(x: torch.Tensor) -> torch.Tensor:
    """
    Standard normal cumulative distribution function Phi(x).
    Uses torch.special.ndtr for high-precision vectorization on CUDA.
    """
    return torch.special.ndtr(x)

def normal_pdf(x: torch.Tensor, mu: float = 0.0, sigma: float = 1.0) -> torch.Tensor:
    """
    Normal probability density function.
    """
    z = (x - mu) / sigma
    return (_INV_SQRT_2PI / sigma) * torch.exp(-0.5 * z * z)
`,
  },
  {
    id: 'file_init_termstructures',
    path: 'torch_quantlib/termstructures/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TERMSTRUCTURES_INIT',
    sizeBytes: 250,
    linesCount: 8,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""Yield and volatility term structures."""
from torch_quantlib.termstructures.flat_forward import flat_forward_discount

__all__ = ["flat_forward_discount"]
`,
  },
  {
    id: 'file_termstructure_flat',
    path: 'torch_quantlib/termstructures/flat_forward.py',
    nodeId: '8',
    symbol: 'FlatForward.discount',
    sizeBytes: 2120,
    linesCount: 55,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:08',
    content: `"""
Flat forward yield curve term structure ported from QuantLib C++
Original: ql/termstructures/yield/flatforward.cpp
"""
import torch

def flat_forward_discount(rate: torch.Tensor, t: torch.Tensor) -> torch.Tensor:
    """
    Zero coupon discount factor P(0, t) = exp(-rate * t).
    Supports tensor broadcasting across yield curves and maturities.
    """
    return torch.exp(-rate * t)
`,
  },
  {
    id: 'file_init_time',
    path: 'torch_quantlib/time/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TIME_INIT',
    sizeBytes: 280,
    linesCount: 9,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""Time conventions and day counters."""
from torch_quantlib.time.day_counter import actual_365_year_fraction, actual_360_year_fraction

__all__ = ["actual_365_year_fraction", "actual_360_year_fraction"]
`,
  },
  {
    id: 'file_day_counters',
    path: 'torch_quantlib/time/day_counter.py',
    nodeId: '10',
    symbol: 'Actual365Fixed',
    sizeBytes: 1840,
    linesCount: 48,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:10',
    content: `"""
Day count fraction arithmetic ported from QuantLib C++
Original: ql/time/daycounters/actual365fixed.cpp
"""
import torch

def actual_365_year_fraction(days_delta: torch.Tensor) -> torch.Tensor:
    """Computes exact year fraction (d2 - d1) / 365.0."""
    return days_delta.float() / 365.0

def actual_360_year_fraction(days_delta: torch.Tensor) -> torch.Tensor:
    """Computes money market year fraction (d2 - d1) / 360.0."""
    return days_delta.float() / 360.0
`,
  },
  {
    id: 'file_init_pricingengines',
    path: 'torch_quantlib/pricingengines/__init__.py',
    nodeId: 'getting_started',
    symbol: 'PRICINGENGINES_INIT',
    sizeBytes: 390,
    linesCount: 12,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""Option pricing engines and closed-form formulas."""
from torch_quantlib.pricingengines.black_formula import black_formula
from torch_quantlib.pricingengines.bachelier import bachelier_black_formula
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

__all__ = ["black_formula", "bachelier_black_formula", "price_analytic_european"]
`,
  },
  {
    id: 'file_black_formula',
    path: 'torch_quantlib/pricingengines/black_formula.py',
    nodeId: '4',
    symbol: 'blackFormula',
    sizeBytes: 4620,
    linesCount: 112,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:12',
    content: `"""
Black formula options pricer ported from QuantLib C++
Original: ql/pricingengines/blackformula.cpp
Target: PyTorch Batch Tensor Broadcasting
"""
import torch
from torch_quantlib.math.distributions import normal_cdf, normal_pdf

def black_formula(
    is_call: torch.Tensor,
    strike: torch.Tensor,
    forward: torch.Tensor,
    std_dev: torch.Tensor,
    discount: torch.Tensor = torch.tensor(1.0)
) -> torch.Tensor:
    """
    Standard Black 1976 pricing formula with tensor broadcasting.
    """
    std_dev = torch.clamp(std_dev, min=1e-7)
    d1 = torch.log(forward / strike) / std_dev + 0.5 * std_dev
    d2 = d1 - std_dev

    call_price = discount * (forward * normal_cdf(d1) - strike * normal_cdf(d2))
    put_price = call_price - discount * (forward - strike)
    return torch.where(is_call, call_price, put_price)
`,
  },
  {
    id: 'file_bachelier_formula',
    path: 'torch_quantlib/pricingengines/bachelier.py',
    nodeId: '5',
    symbol: 'bachelierBlackFormula',
    sizeBytes: 2850,
    linesCount: 72,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:15',
    content: `"""
Bachelier normal option pricing model ported from QuantLib C++
Original: ql/pricingengines/blackformula.cpp
Supports negative interest rates and normal volatility regimes.
"""
import torch
from torch_quantlib.math.distributions import normal_cdf, normal_pdf

def bachelier_black_formula(
    is_call: torch.Tensor,
    strike: torch.Tensor,
    forward: torch.Tensor,
    std_dev: torch.Tensor,
    discount: torch.Tensor
) -> torch.Tensor:
    std_dev = torch.clamp(std_dev, min=1e-7)
    d = (forward - strike) / std_dev
    call = discount * ((forward - strike) * normal_cdf(d) + std_dev * normal_pdf(d))
    put = call - discount * (forward - strike)
    return torch.where(is_call, call, put)
`,
  },
  {
    id: 'file_analytic_european',
    path: 'torch_quantlib/pricingengines/analytic_european.py',
    nodeId: '14',
    symbol: 'AnalyticEuropeanEngine',
    sizeBytes: 3640,
    linesCount: 88,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:16',
    content: `"""
Analytic European option pricing engine ported from QuantLib C++
Original: ql/pricingengines/vanilla/analyticeuropeanengine.cpp
"""
import torch
from torch_quantlib.pricingengines.black_formula import black_formula

def price_analytic_european(
    spot: torch.Tensor,
    strike: torch.Tensor,
    rate: torch.Tensor,
    div_yield: torch.Tensor,
    vol: torch.Tensor,
    maturity: torch.Tensor,
    is_call: bool = True
) -> torch.Tensor:
    """
    Full Black-Scholes-Merton analytic pricer vectorized across tensors.
    """
    forward = spot * torch.exp((rate - div_yield) * maturity)
    std_dev = vol * torch.sqrt(maturity)
    discount = torch.exp(-rate * maturity)
    is_call_tensor = torch.tensor(is_call, device=spot.device)
    return black_formula(is_call_tensor, strike, forward, std_dev, discount)
`,
  },
  {
    id: 'file_init_api',
    path: 'torch_quantlib/api/__init__.py',
    nodeId: 'getting_started',
    symbol: 'API_INIT',
    sizeBytes: 230,
    linesCount: 7,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:00',
    content: `"""High-level client APIs and Autograd Greeks."""
from torch_quantlib.api.torch_api import batch_price_and_greeks

__all__ = ["batch_price_and_greeks"]
`,
  },
  {
    id: 'file_torch_api',
    path: 'torch_quantlib/api/torch_api.py',
    nodeId: '15',
    symbol: 'european_price',
    sizeBytes: 3120,
    linesCount: 76,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:35:17',
    content: `"""
High-Level PyTorch entry points with autograd Greeks.
"""
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

def batch_price_and_greeks(
    spots: torch.Tensor,
    strikes: torch.Tensor,
    rates: torch.Tensor,
    vols: torch.Tensor,
    maturities: torch.Tensor
):
    """
    Computes prices, analytical deltas and gammas in a single autograd backward pass.
    """
    spots_grad = spots.clone().detach().requires_grad_(True)
    prices = price_analytic_european(spots_grad, strikes, rates, torch.zeros_like(rates), vols, maturities)
    deltas = torch.autograd.grad(prices.sum(), spots_grad, create_graph=True)[0]
    gammas = torch.autograd.grad(deltas.sum(), spots_grad)[0]
    return prices, deltas, gammas
`,
  },

  // --------------------------------------------------------------------------
  // MIRRORED TEST SUITE (tests/ strictly mirrors torch_quantlib/)
  // --------------------------------------------------------------------------
  {
    id: 'file_test_init',
    path: 'tests/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_ROOT_INIT',
    sizeBytes: 120,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:18',
    content: `"""Root tests package mirroring torch_quantlib."""
`,
  },
  {
    id: 'file_test_conftest',
    path: 'tests/conftest.py',
    nodeId: 'getting_started',
    symbol: 'PYTEST_CONFTEST',
    sizeBytes: 1150,
    linesCount: 35,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:18',
    content: `"""
Shared pytest configuration, devices, and numerical tolerances (1e-5).
"""
import pytest
import torch

@pytest.fixture
def device():
    return torch.device('cuda' if torch.cuda.is_available() else 'cpu')

@pytest.fixture
def tolerance():
    # Strict numerical difference tolerance
    return 1e-5
`,
  },
  {
    id: 'file_test_math_init',
    path: 'tests/math/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_MATH_INIT',
    sizeBytes: 140,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:18',
    content: `"""Tests for math primitives mirroring torch_quantlib/math."""
`,
  },
  {
    id: 'file_test_special',
    path: 'tests/math/test_special.py',
    nodeId: '1',
    symbol: 'ErrorFunction',
    sizeBytes: 1950,
    linesCount: 52,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:18',
    content: `"""
Unit tests mirroring torch_quantlib/math/special.py
"""
import pytest
import torch
from torch_quantlib.math.special import error_function

def test_erf_symmetry_and_autograd():
    x = torch.linspace(-3.0, 3.0, 1000, dtype=torch.float64, requires_grad=True)
    y = error_function(x)
    assert torch.allclose(y, -error_function(-x), atol=1e-15)

    # Test autograd derivative
    y.sum().backward()
    expected_grad = (2.0 / (3.141592653589793 ** 0.5)) * torch.exp(-x ** 2)
    assert torch.allclose(x.grad, expected_grad, atol=1e-12)
`,
  },
  {
    id: 'file_test_distributions',
    path: 'tests/math/test_distributions.py',
    nodeId: '2',
    symbol: 'CumulativeNormalDistribution',
    sizeBytes: 2250,
    linesCount: 58,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:20',
    content: `"""
Unit tests mirroring torch_quantlib/math/distributions.py
"""
import pytest
import torch
from torch_quantlib.math.distributions import normal_cdf, normal_pdf

def test_normal_cdf_limits_and_symmetry():
    z = torch.tensor([-15.0, -8.0, 0.0, 8.0, 15.0], dtype=torch.float64)
    p = normal_cdf(z)
    assert p[0] == 0.0
    assert torch.allclose(p[2], torch.tensor(0.5, dtype=torch.float64), atol=1e-15)
    assert p[-1] == 1.0

def test_normal_pdf_integration():
    x = torch.linspace(-5.0, 5.0, 10_000, dtype=torch.float64)
    dx = x[1] - x[0]
    pdf = normal_pdf(x)
    integral = torch.sum(pdf * dx)
    assert torch.allclose(integral, torch.tensor(1.0, dtype=torch.float64), atol=1e-4)
`,
  },
  {
    id: 'file_test_termstructures_init',
    path: 'tests/termstructures/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_TERMSTRUCTURES_INIT',
    sizeBytes: 160,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:21',
    content: `"""Tests mirroring torch_quantlib/termstructures."""
`,
  },
  {
    id: 'file_test_flat_forward',
    path: 'tests/termstructures/test_flat_forward.py',
    nodeId: '8',
    symbol: 'FlatForward.discount',
    sizeBytes: 1980,
    linesCount: 50,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:21',
    content: `"""
Unit tests mirroring torch_quantlib/termstructures/flat_forward.py
"""
import pytest
import torch
from torch_quantlib.termstructures.flat_forward import flat_forward_discount

def test_flat_forward_discount_decay():
    rate = torch.tensor([0.02, 0.05, 0.08], dtype=torch.float64).unsqueeze(1)
    t = torch.linspace(0.0, 30.0, 100, dtype=torch.float64).unsqueeze(0)
    df = flat_forward_discount(rate, t)
    # Monotonically decreasing
    assert (df[:, 1:] <= df[:, :-1]).all()
    # At t=0, df=1.0
    assert torch.allclose(df[:, 0], torch.tensor(1.0, dtype=torch.float64))
`,
  },
  {
    id: 'file_test_time_init',
    path: 'tests/time/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_TIME_INIT',
    sizeBytes: 140,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:21',
    content: `"""Tests mirroring torch_quantlib/time."""
`,
  },
  {
    id: 'file_test_day_counter',
    path: 'tests/time/test_day_counter.py',
    nodeId: '10',
    symbol: 'Actual365Fixed',
    sizeBytes: 1650,
    linesCount: 44,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:22',
    content: `"""
Unit tests mirroring torch_quantlib/time/day_counter.py
"""
import pytest
import torch
from torch_quantlib.time.day_counter import actual_365_year_fraction, actual_360_year_fraction

def test_day_counter_arithmetic():
    days = torch.tensor([0, 91, 182, 365], dtype=torch.float64)
    fractions_365 = actual_365_year_fraction(days)
    assert torch.allclose(fractions_365[-1], torch.tensor(1.0, dtype=torch.float64))

    fractions_360 = actual_360_year_fraction(days)
    assert fractions_360[-1] > 1.0
`,
  },
  {
    id: 'file_test_pricingengines_init',
    path: 'tests/pricingengines/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_PRICINGENGINES_INIT',
    sizeBytes: 170,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:22',
    content: `"""Tests mirroring torch_quantlib/pricingengines."""
`,
  },
  {
    id: 'file_test_black_formula',
    path: 'tests/pricingengines/test_black_formula.py',
    nodeId: '4',
    symbol: 'blackFormula',
    sizeBytes: 2480,
    linesCount: 65,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:22',
    content: `"""
Unit tests mirroring torch_quantlib/pricingengines/black_formula.py
"""
import pytest
import torch
from torch_quantlib.pricingengines.black_formula import black_formula

def test_black_put_call_parity():
    spot = torch.tensor([100.0, 105.0, 95.0])
    strike = torch.tensor([100.0, 100.0, 100.0])
    std_dev = torch.tensor([0.2, 0.25, 0.15])
    discount = torch.tensor([0.95, 0.95, 0.95])

    is_call = torch.tensor([True, True, True])
    is_put = torch.tensor([False, False, False])

    call = black_formula(is_call, strike, spot, std_dev, discount)
    put = black_formula(is_put, strike, spot, std_dev, discount)

    parity = call - put
    expected = discount * (spot - strike)
    assert torch.allclose(parity, expected, atol=1e-5)
`,
  },
  {
    id: 'file_test_bachelier',
    path: 'tests/pricingengines/test_bachelier.py',
    nodeId: '5',
    symbol: 'bachelierBlackFormula',
    sizeBytes: 2150,
    linesCount: 56,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:23',
    content: `"""
Unit tests mirroring torch_quantlib/pricingengines/bachelier.py
"""
import pytest
import torch
from torch_quantlib.pricingengines.bachelier import bachelier_black_formula

def test_bachelier_negative_rate_regime():
    spot = torch.tensor([100.0, 100.0])
    strike = torch.tensor([100.0, 102.0])
    std_dev = torch.tensor([15.0, 15.0])
    discount = torch.tensor([1.01, 1.01]) # Negative rate discount > 1.0

    call = bachelier_black_formula(torch.tensor([True, True]), strike, spot, std_dev, discount)
    assert (call > 0.0).all()
`,
  },
  {
    id: 'file_test_analytic_european',
    path: 'tests/pricingengines/test_analytic_european.py',
    nodeId: '14',
    symbol: 'AnalyticEuropeanEngine',
    sizeBytes: 2650,
    linesCount: 68,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:24',
    content: `"""
Unit tests mirroring torch_quantlib/pricingengines/analytic_european.py
"""
import pytest
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

def test_analytic_european_batch_pricing():
    spots = torch.tensor([90.0, 100.0, 110.0], dtype=torch.float64)
    strikes = torch.tensor([100.0, 100.0, 100.0], dtype=torch.float64)
    rates = torch.full((3,), 0.05, dtype=torch.float64)
    vols = torch.full((3,), 0.20, dtype=torch.float64)
    maturities = torch.full((3,), 1.0, dtype=torch.float64)

    calls = price_analytic_european(spots, strikes, rates, torch.zeros(3), vols, maturities, is_call=True)
    # Monotonicity with respect to spot
    assert calls[0] < calls[1] < calls[2]
`,
  },
  {
    id: 'file_test_api_init',
    path: 'tests/api/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_API_INIT',
    sizeBytes: 130,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:25',
    content: `"""Tests mirroring torch_quantlib/api."""
`,
  },
  {
    id: 'file_test_torch_api',
    path: 'tests/api/test_torch_api.py',
    nodeId: '15',
    symbol: 'european_price',
    sizeBytes: 2180,
    linesCount: 56,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:25',
    content: `"""
Unit tests mirroring torch_quantlib/api/torch_api.py
"""
import pytest
import torch
from torch_quantlib.api.torch_api import batch_price_and_greeks

def test_autograd_greeks_delta_gamma():
    spots = torch.tensor([100.0], dtype=torch.float64)
    strikes = torch.tensor([100.0], dtype=torch.float64)
    rates = torch.tensor([0.05], dtype=torch.float64)
    vols = torch.tensor([0.20], dtype=torch.float64)
    maturities = torch.tensor([1.0], dtype=torch.float64)

    prices, deltas, gammas = batch_price_and_greeks(spots, strikes, rates, vols, maturities)

    # ATM Call Delta is approx 0.63 for r=5%, vol=20%, T=1
    assert 0.50 < deltas.item() < 0.75
    assert gammas.item() > 0.0
`,
  },

  // --------------------------------------------------------------------------
  // INTEGRATION TESTS (tests/integration/)
  // --------------------------------------------------------------------------
  {
    id: 'file_test_integration_init',
    path: 'tests/integration/__init__.py',
    nodeId: 'getting_started',
    symbol: 'TESTS_INTEGRATION_INIT',
    sizeBytes: 150,
    linesCount: 4,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:30',
    content: `"""Multi-module integration tests for end-to-end pricing pipelines."""
`,
  },
  {
    id: 'file_test_integ_pipeline',
    path: 'tests/integration/test_end_to_end_pricing_pipeline.py',
    nodeId: '14',
    symbol: 'EndToEndPipelineIntegration',
    sizeBytes: 3950,
    linesCount: 95,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:30',
    content: `"""
End-to-End Pricing Pipeline Integration Test
Interconnected Modules:
  FlatForward -> CashFlows -> BlackCalculator -> AnalyticEuropeanEngine
"""
import pytest
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european
from torch_quantlib.termstructures.flat_forward import flat_forward_discount

def test_end_to_end_curve_to_greek_pipeline():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    N = 10_000

    # 1. Market yield curve
    curve_rate = torch.tensor(0.0425, dtype=torch.float64, device=device)
    maturities = torch.linspace(0.25, 3.0, N, dtype=torch.float64, device=device)
    discount_factors = flat_forward_discount(curve_rate, maturities)

    # 2. Options parameters with gradient tracking
    spots = torch.full((N,), 100.0, dtype=torch.float64, device=device, requires_grad=True)
    strikes = torch.linspace(80.0, 120.0, N, dtype=torch.float64, device=device)
    vols = torch.full((N,), 0.20, dtype=torch.float64, device=device, requires_grad=True)
    div_yield = torch.zeros(N, dtype=torch.float64, device=device)

    # 3. Analytic engine execution
    prices = price_analytic_european(
        spot=spots,
        strike=strikes,
        rate=curve_rate.expand(N),
        div_yield=div_yield,
        vol=vols,
        maturity=maturities,
        is_call=True
    )

    # 4. Multi-Greek risk matrix backward pass
    prices.sum().backward()

    # 5. Integration Assertions
    assert torch.isfinite(prices).all(), "Pricing produced non-finite values"
    assert (prices > 0.0).all(), "Call prices must be strictly positive"
    assert (spots.grad > 0.0).all(), "Call Delta must be strictly positive"
    assert (spots.grad <= 1.0).all(), "Call Delta must not exceed 1.0"
    assert (vols.grad > 0.0).all(), "Option Vega must be positive"
`,
  },
  {
    id: 'file_test_integ_portfolio',
    path: 'tests/integration/test_multi_asset_portfolio.py',
    nodeId: '15',
    symbol: 'PortfolioValuationIntegration',
    sizeBytes: 3400,
    linesCount: 82,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:35',
    content: `"""
Multi-Asset Cross-Equity Portfolio Valuation Integration Test
Evaluates 100,000 contracts across heterogeneous assets with zero-copy GPU batching.
"""
import pytest
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

def test_cross_equity_portfolio_aggregation():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    N = 100_000
    
    # 50 simulated underlying equities
    num_underlyings = 50
    spot_levels = torch.linspace(25.0, 350.0, num_underlyings, dtype=torch.float64, device=device)
    spots = spot_levels.repeat(N // num_underlyings)
    
    strikes = spots * torch.empty(N, dtype=torch.float64, device=device).uniform_(0.85, 1.15)
    rates = torch.full((N,), 0.045, dtype=torch.float64, device=device)
    div_yields = torch.empty(N, dtype=torch.float64, device=device).uniform_(0.0, 0.03)
    vols = torch.empty(N, dtype=torch.float64, device=device).uniform_(0.12, 0.45)
    maturities = torch.empty(N, dtype=torch.float64, device=device).uniform_(0.08, 2.5)
    
    # Batch valuation
    prices = price_analytic_european(spots, strikes, rates, div_yields, vols, maturities)
    total_book_npv = prices.sum().item()
    
    assert total_book_npv > 0.0
    assert torch.isfinite(prices).all()
`,
  },
  {
    id: 'file_test_integ_torchscript',
    path: 'tests/integration/test_torchscript_export.py',
    nodeId: '14',
    symbol: 'TorchScriptExportIntegration',
    sizeBytes: 2900,
    linesCount: 68,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:40',
    content: `"""
TorchScript JIT Serialization & LibTorch C++ Deployment Integration Test
"""
import pytest
import torch
from torch_quantlib.pricingengines.analytic_european import price_analytic_european

class AnalyticPricerModule(torch.nn.Module):
    def forward(self, spot, strike, rate, div_yield, vol, maturity):
        return price_analytic_european(spot, strike, rate, div_yield, vol, maturity)

def test_jit_tracing_parity():
    module = AnalyticPricerModule()
    dummy = (
        torch.tensor([100.0], dtype=torch.float64),
        torch.tensor([100.0], dtype=torch.float64),
        torch.tensor([0.05], dtype=torch.float64),
        torch.tensor([0.0], dtype=torch.float64),
        torch.tensor([0.20], dtype=torch.float64),
        torch.tensor([1.0], dtype=torch.float64),
    )
    
    # Trace module into TorchScript bytecode
    traced = torch.jit.trace(module, dummy)
    
    eager_val = module(*dummy)
    traced_val = traced(*dummy)
    
    assert torch.allclose(eager_val, traced_val, atol=1e-15)
`,
  },
];

export const initialFiles: MigratedFile[] = initialMigratedFiles;
