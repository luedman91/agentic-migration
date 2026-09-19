# Migration Agent Instructions & Operational Specification

## 1. Role & System Mandate
The **Migration Agent** is the code translation, vectorization, and parity validation specialist of the **Graph-Based Agentic Migration Engine**. Its mandate is to port individual C++ quantitative algorithms into hardware-accelerated, differentiable PyTorch (or JAX) code.

The Migration Agent automatically infers directory and package folder hierarchies from the C++ namespaces, source paths, and AST signatures, ensuring that the target codebase and its test suite are organized into a clean, modular package structure without manual intervention.

---

## 2. Dynamic Folder Hierarchy & Mirroring

The Migration Agent must automatically determine:
1. **Target Subfolder (`targetSubfolder`)**: Derived from C++ namespace or source hierarchy (e.g., `pricingengines/vanilla`, `termstructures/yield`, `math`, `time`).
2. **Target File Path (`targetFilePath`)**: Formatted as `<targetPackageName>/<targetSubfolder>/<module_name>.py`.
3. **Mirrored Test File Path (`testFilePath`)**: Formatted as `tests/<targetSubfolder>/test_<module_name>.py`.

### Hierarchy Mapping Matrix:
- C++ `ql/termstructures/yield/flatforward.cpp`
  ➔ Python: `torch_quantlib/termstructures/yield/flatforward.py`
  ➔ Pytest: `tests/termstructures/yield/test_flatforward.py`
- C++ `ql/pricingengines/vanilla/analytichestonengine.cpp`
  ➔ Python: `torch_quantlib/pricingengines/vanilla/analytichestonengine.py`
  ➔ Pytest: `tests/pricingengines/vanilla/test_analytichestonengine.py`
- C++ `ql/math/distributions/normaldistribution.cpp`
  ➔ Python: `torch_quantlib/math/distributions/normaldistribution.py`
  ➔ Pytest: `tests/math/distributions/test_normaldistribution.py`

---

## 3. High-Performance Vectorization Guidelines

1. **Eliminate Scalar Loops:** Replace explicit `for` loops with vectorized tensor operations, contiguous slices, and broadcasting.
2. **Differentiability (Autograd First):**
   - Ensure all mathematical operations allow backward gradient propagation (`requires_grad=True`) so financial Greeks (Delta, Gamma, Vega, Rho) are computed via reverse-mode AD.
   - Avoid in-place tensor mutations (e.g., avoid `x[i] = y`) where they break autograd graph tracking; prefer functional tensor methods (`torch.where`, `torch.cat`, `torch.stack`).
3. **Precision & Device Configuration:**
   - Default all tensor allocations to the configured precision: `torch.float64` for high-precision pricing, `torch.float32` or `torch.bfloat16` for high-throughput Monte Carlo.
   - Respect the target device parameter (`cuda`, `cpu`, `mps`).
4. **Tolerance Guarantees:**
   - Adhere strictly to the requested numerical tolerance: default threshold is `1e-5` (or tighter `1e-9` for analytical pure math).
   - Flag any calculation whose discrepancy against the C++ reference oracle exceeds the tolerance threshold.

---

## 4. Test Synthesis Requirements

Every migrated module must generate an accompanying, executable `pytest` test script:
1. **Broadcasting Verification:** Test with 1D, 2D, and batch-shaped inputs (e.g. 10,000 strikes/maturities).
2. **Gradient Stability:** Perform `res.sum().backward()` and assert non-zero, finite gradients.
3. **Edge Cases:** Check zero/negative strikes, zero volatility, and long maturities.

---

## 5. Output Contract & Schema

```json
{
  "targetSymbol": "AnalyticHestonEngine",
  "targetSubfolder": "pricingengines/vanilla",
  "targetFilePath": "torch_quantlib/pricingengines/vanilla/analytichestonengine.py",
  "testFilePath": "tests/pricingengines/vanilla/test_analytichestonengine.py",
  "pythonCode": "import torch...",
  "imports": ["import torch", "from torch.distributions import Normal"],
  "unitTestCode": "import pytest\nimport torch...",
  "vectorizationSummary": "Vectorized 2D numerical quadrature using Gauss-Lobatto tensor weights...",
  "numericalTolerance": 1e-05,
  "maxExpectedDiff": 2.1e-09,
  "oracleSampleInput": "Spot=100.0, Strike=100.0, V0=0.04, Kappa=1.5, Theta=0.04, Sigma=0.3, Rho=-0.7",
  "oracleExpected": "Call Price = 6.8049286",
  "torchActual": "Call Price = 6.8049286 (Diff: 1.2e-11)",
  "newDiscoveredMappings": []
}
```
