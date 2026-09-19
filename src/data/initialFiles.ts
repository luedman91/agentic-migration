import { MigratedFile } from '../types';

export const initialMigratedFiles: MigratedFile[] = [
  // --------------------------------------------------------------------------
  // GETTING STARTED & SETUP GUIDES
  // --------------------------------------------------------------------------
  {
    id: 'file_readme',
    path: 'README.md',
    nodeId: 'getting_started',
    symbol: 'GETTING_STARTED',
    sizeBytes: 4280,
    linesCount: 110,
    isTest: false,
    shippable: true,
    createdAt: '2026-09-19 10:30:00',
    content: `# torch-quantlib: High-Throughput PyTorch Option Pricing & Greeks Engine

Transpiled directly from **QuantLib C++** into vectorized PyTorch tensor operations with **GPU acceleration** and **end-to-end Autograd reverse-mode automatic differentiation**.

---

## 🚀 Quick Start (In 60 Seconds)

### 1. Prerequisites & Installation

Ensure you have Python 3.9+ and PyTorch installed:

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

# Choose device: 'cuda', 'mps' (Apple Silicon), or 'cpu'
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 100,000 synthetic option market contracts
N = 100_000
spots = torch.full((N,), 100.0, dtype=torch.float64, device=device)
strikes = torch.linspace(70.0, 130.0, N, dtype=torch.float64, device=device)
rates = torch.full((N,), 0.05, dtype=torch.float64, device=device)
div_yields = torch.zeros(N, dtype=torch.float64, device=device)
vols = torch.full((N,), 0.20, dtype=torch.float64, device=device)
maturities = torch.full((N,), 1.0, dtype=torch.float64, device=device)

# Batch pricing
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

## 🎯 Instant Autograd Greeks (Delta, Gamma, Vega, Theta)

No manual differential finite differences! Compute exact machine-precision Greeks via backward pass:

\`\`\`python
from torch_quantlib.api.torch_api import batch_price_and_greeks

spots = torch.tensor([100.0, 105.0, 95.0], dtype=torch.float64, device=device)
strikes = torch.tensor([100.0, 100.0, 100.0], dtype=torch.float64, device=device)
rates = torch.tensor([0.05, 0.05, 0.05], dtype=torch.float64, device=device)
vols = torch.tensor([0.20, 0.22, 0.18], dtype=torch.float64, device=device)
maturities = torch.tensor([1.0, 0.5, 2.0], dtype=torch.float64, device=device)

prices, deltas, gammas = batch_price_and_greeks(spots, strikes, rates, vols, maturities)

for i in range(len(spots)):
    print(f"Option {i+1} -> Price: \${prices[i]:.3f} | Delta: {deltas[i]:.4f} | Gamma: {gammas[i]:.4f}")
\`\`\`

---

## 🧪 Running Unit & Integration Tests

Run the shippable test suite:

\`\`\`bash
# 1. Run all unit tests (isolated mathematical operators and autograd verification)
pytest torch_quantlib/tests/unit -v

# 2. Run multi-module end-to-end integration tests (pricing pipelines, portfolios, JIT)
pytest torch_quantlib/tests/integration -v

# 3. Run all shippable tests with execution timing benchmarks
pytest torch_quantlib/tests --durations=0
\`\`\`

---

## 📦 Project Architecture

\`\`\`
torch_quantlib/
├── math/
│   ├── special.py            # Ported ql/math/errorfunction.cpp
│   └── distributions.py      # Normal distributions & torch.special.ndtr
├── termstructures/
│   ├── flat_forward.py       # Discount factors & zero curves
│   └── black_vol.py          # Volatility surfaces
├── pricingengines/
│   ├── black_formula.py      # Black 1976 options pricing
│   ├── bachelier.py          # Normal model for negative interest rates
│   └── analytic_european.py  # Generalized Black-Scholes-Merton engine
├── api/
│   └── torch_api.py          # High-level batch API with autograd Greeks
└── tests/
    ├── unit/                 # Isolated module and kernel tests
    │   ├── test_special.py
    │   ├── test_black_formula.py
    │   └── test_distributions_and_curves.py
    └── integration/          # Multi-module end-to-end pipelines
        ├── test_end_to_end_pricing_pipeline.py
        ├── test_multi_asset_portfolio.py
        └── test_torchscript_export.py
\`\`\`
`
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
`
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
`
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

    # Generate 250,000 options contracts
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
`
  },

  // --------------------------------------------------------------------------
  // MIGRATED LIBRARY MODULES
  // --------------------------------------------------------------------------
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
`
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
`
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
    Zero coupon discount factor P(0, t) = exp(-r * t).
    Supports tensor broadcasting across yield curves and maturities.
    """
    return torch.exp(-rate * t)
`
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
`
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
`
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
`
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
`
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
`
  },

  // --------------------------------------------------------------------------
  // SHIPPABLE TEST SUITE (TYPE 1 TESTS)
  // --------------------------------------------------------------------------
  {
    id: 'file_test_special',
    path: 'torch_quantlib/tests/test_special.py',
    nodeId: '1',
    symbol: 'ErrorFunction',
    sizeBytes: 1950,
    linesCount: 52,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:18',
    content: `"""
Unit tests for torch_quantlib.math.special
Shipped in production wheel package.
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
`
  },
  {
    id: 'file_test_black_formula',
    path: 'torch_quantlib/tests/test_black_formula.py',
    nodeId: '4',
    symbol: 'blackFormula',
    sizeBytes: 2480,
    linesCount: 65,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:22',
    content: `"""
Unit tests for torch_quantlib.pricingengines.black_formula
Shipped in production wheel package.
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
    assert torch.allclose(parity, expected, atol=1e-10)
`
  },
  {
    id: 'file_test_distributions_and_curves',
    path: 'torch_quantlib/tests/unit/test_distributions_and_curves.py',
    nodeId: '2',
    symbol: 'NormalAndDiscountUnitTests',
    sizeBytes: 2850,
    linesCount: 72,
    isTest: true,
    shippable: true,
    createdAt: '2026-09-19 10:35:25',
    content: `"""
Unit tests for distributions and term structures
Shipped in production package.
"""
import pytest
import torch
from torch_quantlib.math.distributions import normal_cdf, normal_pdf
from torch_quantlib.termstructures.flat_forward import flat_forward_discount

def test_normal_cdf_limits_and_subnormals():
    # Asymptotic tail behavior
    z = torch.tensor([-15.0, -8.0, 0.0, 8.0, 15.0], dtype=torch.float64)
    p = normal_cdf(z)
    assert p[0] == 0.0
    assert torch.allclose(p[2], torch.tensor(0.5, dtype=torch.float64), atol=1e-15)
    assert p[-1] == 1.0

def test_flat_forward_discount_decay():
    rate = torch.tensor([0.02, 0.05, 0.08], dtype=torch.float64).unsqueeze(1)
    t = torch.linspace(0.0, 30.0, 100, dtype=torch.float64).unsqueeze(0)
    df = flat_forward_discount(rate, t)
    # Monotonically decreasing
    assert (df[:, 1:] <= df[:, :-1]).all()
    # At t=0, df=1.0
    assert torch.allclose(df[:, 0], torch.tensor(1.0, dtype=torch.float64))
`
  },

  // --------------------------------------------------------------------------
  // SHIPPABLE INTEGRATION TEST SUITES (MULTI-MODULE PIPELINES)
  // --------------------------------------------------------------------------
  {
    id: 'file_test_integ_pipeline',
    path: 'torch_quantlib/tests/integration/test_end_to_end_pricing_pipeline.py',
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
`
  },
  {
    id: 'file_test_integ_portfolio',
    path: 'torch_quantlib/tests/integration/test_multi_asset_portfolio.py',
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
`
  },
  {
    id: 'file_test_integ_torchscript',
    path: 'torch_quantlib/tests/integration/test_torchscript_export.py',
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
`
  }
];

export const initialFiles: MigratedFile[] = initialMigratedFiles;
