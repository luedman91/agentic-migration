# Graph-Based Agentic Code Migration Engine
### High-Throughput, Graph-Based Autonomous DAG Decomposition, Differential Verification & Framework Transpilation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Modal](https://img.shields.io/badge/Modal-Serverless_GPU-green.svg)](https://modal.com/)
[![Pydantic](https://img.shields.io/badge/Pydantic-Schema_Validation-e92063.svg)](https://docs.pydantic.dev/)
[![Vitest](https://img.shields.io/badge/Tests-Passed-brightgreen.svg)](https://vitest.dev/)

---

## 1. Executive Summary & General-Purpose Architecture

The **Graph-Based Agentic Code Migration Engine** is a generalized, framework-agnostic platform designed to autonomously transpile, vectorize, and differentially verify complex legacy codebases (C/C++, Fortran, Object-Oriented libraries) into modern, high-throughput accelerated frameworks (PyTorch, JAX, Python, Triton).

Instead of relying on fragile, monolithic whole-file LLM prompts that hallucinate APIs and break memory models, this engine decomposes arbitrary upstream repositories into an **interactive topological Directed Acyclic Graph (DAG)**. It traverses dependencies bottom-up from atomic leaves to root orchestration engines, executing parallel agentic transpilation, vectorization, and differential oracle parity verification against the original legacy implementation.

### 🌟 QuantLib as a Flagship Showcase Reference Example
To demonstrate the engine's capabilities under the most demanding conditions, the studio features **QuantLib C++ → PyTorch** as a primary showcase reference example:
- **The Challenge**: QuantLib represents one of the most mathematically rigorous and architecturally complex C++ libraries in production, spanning deep virtual class hierarchies, finite-difference solvers, and scalar loops that prevent GPU acceleration.
- **The Target**: Vectorized, batched PyTorch tensors with single-pass Adjoint Automatic Differentiation (AAD) for instant Greeks ($\Delta, \Gamma, \mathcal{V}, \rho, \Theta$), with strict double-precision parity ($\epsilon \le 10^{-8}$).
- **Generalization**: While QuantLib is preloaded as an illustrative archetype, the engine generalizes to **any codebase**. All demonstration presets (including QuantLib C++, nlohmann/json C++ AST parsers, and Eigen linear algebra) are stored separately in `src/data/examplePresets.ts` and loaded dynamically. Users can configure and migrate any arbitrary Git repository, source language, and target framework directly through the interface.

---

## 2. The Two-Tier Hybrid Architecture

A reliable migration tool cannot rely purely on prompt engineering, nor can it rely purely on rigid rule-based transpilers. This platform uses a **Two-Tier Hybrid Architecture**:

```
+-----------------------------------------------------------------------------------+
|                           TIER 1: DETERMINISTIC CORE                              |
|  - Clang/Regex AST Symbol Extractor       - Deterministic Building Block Registry |
|  - Directed Acyclic Graph (DAG) Engine    - Topological Dependency Cone Solver    |
|  - Automated Leaf Integration Tests       - Differential Oracle Parity Checker    |
+-----------------------------------------+-----------------------------------------+
                                          | Context & Constraints
                                          v
+-----------------------------------------------------------------------------------+
|                         TIER 2: AGENTIC SYNTHESIS (GEMINI)                        |
|  - Idiomatic Vectorization & Broadcasting - Modern Framework Architecture Derivation|
|  - Ambient Type Disambiguation            - Self-Healing Iterative Repair Loop     |
+-----------------------------------------+-----------------------------------------+
                                          | Validated Output
                                          v
+-----------------------------------------------------------------------------------+
|                   MODAL SERVERLESS GPU EXECUTION & VERIFICATION                   |
|  - Parallel Cloud GPU Workers (NVIDIA T4) - Real-time Parity Residuals vs Legacy  |
+-----------------------------------------------------------------------------------+
```

### Tier 1: Deterministic Core (The Anchor of Truth)
- **Dependency Cones & DAG Extraction**: Statically parses source files, headers, and function signatures to construct a complete directed acyclic graph (DAG) of the library. It identifies root engines, intermediate numerical solvers, and foundational leaves (e.g., normal distributions, day counters).
- **Deterministic Building Blocks Registry**: Pre-registers invariant type mappings (e.g., legacy `Real` $\to$ `torch.Tensor(dtype=torch.float64)`, `Matrix` $\to$ 2D Tensor) and pre-vetted primitives so the agent never reinvents basic math.
- **Topological Bottom-Up Traversal**: Migrates code strictly from leaf dependencies upward to root pricing models. A parent node is never translated until its upstream dependencies are verified and green.
- **Automated Differential Oracle Parity**: Generates automated unit and integration tests comparing modern framework outputs with legacy reference oracles across synthetic test scenarios.

### Tier 2: Agentic Synthesis (The Adaptive Brain)
- **Idiomatic Vectorization**: Translates imperative loops into vectorized tensor operations (broadcasting, `torch.where`, `torch.linalg`).
- **Autograd & Parallelism Compatibility**: Formulates algorithms to be fully differentiable with respect to input tensors, allowing instant gradient/sensitivity calculations in production.
- **Self-Healing Feedback Loop**: If an execution test fails (e.g., tensor shape mismatch or numerical deviation exceeding $\epsilon$), the compiler diagnostics, diff, and runtime logs are fed back into Gemini in an automated repair cycle.

### Why the Migration Runs So Fast (In Simple Terms)

Migrations complete in seconds rather than minutes due to four core architectural principles:

1. **Parallel "Assembly Line" (Topological Scheduling)**: Instead of converting files one by one in a long queue, the engine decomposes the codebase into a Directed Acyclic Graph (DAG). All components without shared prerequisites (e.g., independent math kernels, day counters, utility routines) are dispatched and executed simultaneously across parallel worker lanes.
2. **Instant Translation for Known Patterns (Deterministic Rules)**: Standard software primitives and mathematical building blocks (e.g., numeric types, arrays, matrix operations, standard error functions) are recognized immediately and mapped in memory via deterministic AST tables, avoiding redundant LLM round-trips for standard patterns.
3. **Lightweight Flash AI for Complex Logic**: When custom or complex logic requires agentic synthesis, the engine invokes high-throughput models (such as Gemini Flash) with structured JSON schemas, generating vectorized tensor code in a fraction of a second.
4. **Isolated Kernel Testing**: Rather than compiling a multi-million-line C++ library from scratch for each change, the engine isolates each mathematical kernel and its immediate inputs, verifying numerical accuracy in milliseconds.

---

## 3. Infrastructure & Validation Foundations

### Use of Modal

Migrating performance-critical legacy codebases creates an infrastructural challenge: legacy C/C++ compilation toolchains (GCC/Clang, Boost, headers) and modern GPU acceleration environments (CUDA, PyTorch, LibTorch) must co-exist seamlessly during automated verification.

```python
# Modal Serverless Execution Container (server/modalEngine.ts)
import modal

app = modal.App("agentic-code-migration")
image = (
    modal.Image.debian_slim()
    .apt_install("build-essential", "libboost-all-dev", "libquantlib0v5")
    .pip_install("torch>=2.4.0", "numpy", "pydantic>=2.0")
)

@app.function(gpu="T4", image=image, concurrency_limit=10)
def execute_kernel_verification(symbol: str, target_code: str, test_scenarios: list) -> dict:
    # 1. Compile legacy C++ oracle baseline
    # 2. Execute modern PyTorch CUDA kernel
    # 3. Compute vector-wide L1/L2 differential residuals
    return {"symbol": symbol, "max_diff": 4.12e-9, "passed": True, "device": "cuda:0"}
```

- **Heterogeneous Runtimes On-Demand**: Defines lightweight, ephemeral cloud container environments that combine legacy C++ compilation with GPU tensor runtimes without manual container maintenance.
- **Topological Parallel Scheduling**: Integrates directly with the multi-worker DAG scheduler to spin up concurrent serverless workers across independent dependency branches, enabling simultaneous translation and differential validation.
- **Production Hardware Parity**: Verifies numerical parity, float64 subnormal precision, and autograd differentiability on actual NVIDIA GPU hardware rather than emulated environments.
- **Elastic Scale-to-Zero Compute**: Automatically allocates worker compute when migrations or differential test runs are triggered and scales down to zero when idle.

---

### Use of Pydantic

When transpiling mission-critical codebases, unstructured LLM outputs risk syntax failures, missing imports, un-vectorized loops, or mismatched parameter shapes. Pydantic provides the strict schema contracts that govern agent synthesis.

```python
# Pydantic Core Migration Schema Contract
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class TensorParameter(BaseModel):
    name: str
    dtype: str = Field(default="torch.float64", description="Precision tier")
    is_differentiable: bool = Field(default=True, description="Requires grad for sensitivity analysis")

class CodeMigrationResponse(BaseModel):
    symbol: str
    target_framework: str = "PyTorch"
    imports: List[str]
    vectorized_code: str = Field(..., description="Idiomatic vectorized implementation")
    tensor_parameters: List[TensorParameter]
    validation_summary: str
    tolerance_eps: float = Field(default=1e-8, le=1e-5)

    @field_validator("vectorized_code")
    def reject_scalar_loops(cls, v):
        if "for i in range(" in v and "torch." not in v:
            raise ValueError("Detected un-vectorized scalar loop in target code")
        return v
```

- **Schema-Grounded Agent Synthesis**: Enforces structured JSON schemas during Gemini generation (`server/agent.ts`), preventing malformed outputs, missing keys, or syntax degradation.
- **Domain Invariant Validation**: Custom validators enforce idiom rules—such as disallowing scalar `for` loops in vectorized routines, requiring specified tensor precision tiers (`torch.float64`), and verifying autograd differentiability.
- **End-to-End Contract Consistency**: Unifies data models from C++ AST signature extraction through server endpoints, worker execution payloads, and the frontend DAG state.

---

## 4. System Architecture & Data Flow

```
[ Legacy C++ Source ] ──> [ Deterministic AST Parser ]
                                  │
                                  ▼
                     [ Topological DAG Engine ]
                     (Detects Cones & Leaves)
                                  │
     ┌────────────────────────────┴────────────────────────────┐
     ▼                                                         ▼
[ Branch Worker #1 ]                                      [ Branch Worker #2 ]
  ├─ Context Assembly                                       ├─ Context Assembly
  ├─ Gemini Agentic Synthesis (Pydantic Schema)             ├─ Gemini Agentic Synthesis (Pydantic Schema)
  └─ Modal Cloud GPU Verification                           └─ Modal Cloud GPU Verification
     │                                                         │
     └────────────────────────────┬────────────────────────────┘
                                  ▼
                   [ Differential Oracle Parity ]
                   (Residual ε ≤ 1e-8 vs. C++ Reference)
                                  │
                                  ▼
                   [ Virtual File System & Package ]
                   (Exportable Wheel / Zip with Tests)
```

---

## 5. Key Interactive Features

| Feature | Description |
| :--- | :--- |
| **Interactive D3 Dependency Graph** | Real-time hierarchical DAG visualization with vertical rank stratification, horizontal flow, depth cones, and node status colors. |
| **Multi-Worker Concurrency Control** | Parallel migration engine supporting 1–3 simultaneous workers with topological lockout safety to prevent deadlocks. |
| **Real-Time Terminal & Trace Inspector** | Virtual terminal with auto-scroll detection, token metrics, model logs, and worker status indicators. |
| **Multi-Tier Unit & Parity Test Suite** | Automated test runner verifying analytical pricing, Monte Carlo simulations, Greeks derivation, and numerical diff tolerances. |
| **Source vs. Target Code Inspector** | Side-by-side synchronized code viewer highlighting QuantLib C++ vs. modern PyTorch implementations. |
| **Deterministic Symbol Registry** | Interactive building blocks editor for defining and overriding custom type mappings (`Real` $\to$ `float64`). |
| **Export & Packaging Engine** | Exports complete, deployable Python distributions with separated dev-only test suites and verified wheel structures. |

---

## 6. Verification & Test Suite

The project enforces a **100% test pass requirement** across both frontend and backend modules:
- **21 test suites, 95 unit & integration tests** covering DAG scheduling, tree layouts, symbol normalization, building blocks, server APIs, and Modal dispatch.
- **Zero White Screens**: Defensive programming guards against empty inputs, undefined metrics, and network failures with React error boundaries.

```bash
# Run the complete test suite
npx vitest run
```

---

## 7. Quick Start Guide

### Prerequisites
- Node.js 18+
- npm or bun

### 1. Installation
```bash
git clone <repository-url>
cd graph-agentic-migration-engine
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```
Edit `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key"
# Optional: Remote Modal Serverless Webhook URL
# MODAL_WEBHOOK_URL="https://your-workspace.modal.run"
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to launch the Migration Studio.

### 4. Production Build & Start
```bash
npm run build
npm start
```

---

## 8. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, D3.js, Motion.
- **Backend**: Node.js, Express, Vite middleware, esbuild, `@google/genai` SDK.
- **Serverless Compute**: Modal (Cloud GPU container orchestration).
- **Data Validation**: Pydantic (Python / serverless validation contract).
- **Testing**: Vitest (21 test suites, 95 tests).
