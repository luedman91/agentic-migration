# Design & Architecture Specification: QuantLib to PyTorch Migration Studio

## Executive Overview
The **QuantLib to PyTorch Migration Studio** is an enterprise-grade automated transpilation, verification, and code generation platform. It ports legacy object-oriented C++ quantitative finance libraries (e.g. QuantLib) and high-throughput systems into vectorized, differentiable PyTorch tensor operations running on GPU/TPU hardware accelerators.

---

## System Architecture

```
                                    +-----------------------------------------+
                                    |         User Interface (React 19)       |
                                    |   - D3 Topological Graph View           |
                                    |   - Node Detail Inspector               |
                                    |   - Building Blocks Symbol Table        |
                                    |   - Pytest Integration Test Authoring   |
                                    |   - Files & Guide Explorer              |
                                    +--------------------+--------------------+
                                                         |
                                                         v
                                    +--------------------+--------------------+
                                    |       Client Orchestration Hooks        |
                                    |   - useDagState (Topological DAG)       |
                                    |   - useMigrationEngine (Batch / Agent)  |
                                    |   - useTestRunner (Pytest Suites)       |
                                    |   - useFileManager (Virtual FS & ZIP)   |
                                    |   - Centralized Client Logger           |
                                    +--------------------+--------------------+
                                                         |  HTTP /api/*
                                                         v
                                    +--------------------+--------------------+
                                    |      Express Application Server         |
                                    |   - Deterministic AST Parser            |
                                    |   - Symbol Registry Manager             |
                                    |   - Centralized Backend Logger          |
                                    +---------+---------------------+---------+
                                              |                     |
                        +---------------------+                     +---------------------+
                        v                                                                 v
+-----------------------+-----------------------+             +---------------------------+-----------------------+
|        Google Gemini 2.5/3.8 Flash Agent      |             |         Modal Serverless Worker Fleet         |
|  - Structured Pydantic-like Schema Output     |             |  - 32-way GPU concurrency (NVIDIA A10G)           |
|  - Differentiable Autograd vectorization      |             |  - Microsecond latency & PyTorch compilation      |
|  - Zero-scalar tensor loop enforcement        |             |  - End-to-end Python/C++ parity benchmarks        |
+-----------------------------------------------+             +---------------------------------------------------+
```

---

## Core Features & Modules

### 1. Topological Dependency Cone & Graph Visualizer (`GraphView.tsx`)
- **Topological Sorting:** Parses upstream and downstream dependencies. Leaves (pure mathematical primitives like `NormalDistribution` or `FlatForward`) are migrated first, guaranteeing that complex composite nodes (such as `AnalyticEuropeanEngine`) always have tested upstream dependencies available.
- **D3 Layout:** Force-directed and hierarchical layered DAG layouts supporting up to 150 nodes across 15 topological layers.
- **Node Status Indicators:** Tracks live lifecycle states (`todo`, `mapped`, `translated`, `tested`, `failed`).

### 2. Deterministic Building Blocks Registry (`BuildingBlocksModal.tsx`, `server/agent.ts`)
- **AST Mapping Engine:** Maps C++ standard library, QuantLib classes, and math functions to their vectorized tensor counterparts (e.g. `Real` &rarr; `torch.Tensor(dtype=torch.float64)`, `CumulativeNormalDistribution` &rarr; `torch.distributions.Normal().cdf`).
- **Dynamic Extensibility:** Users can inspect, add custom domain mappings, or reset the symbol registry at runtime.

### 3. Agentic Migration Engine with Gemini (`server/agent.ts`, `src/hooks/useMigrationEngine.ts`)
- **Structured Output Schema:** Leverages Google GenAI with strict JSON schema constraints. Produces vectorized Python code, shippable Pytest unit test suites, import statements, and discovered idiom mappings.
- **Telemetry & Centralized Logging:** Every GenAI request records the model used, prompt, config, and sanitized output with inline data safely stripped.

### 4. Modal Serverless Cloud Execution (`src/utils/modalClient.ts`, `server/modalEngine.ts`)
- **Distributed GPU Worker Simulation:** Simulates or connects live to high-concurrency Modal serverless workers executing GPU benchmark kernels.
- **Accelerated Verification:** Evaluates 25,000+ batched option contracts in milliseconds, demonstrating 15&times; to 80&times; parallel speedups.

### 5. Root-to-Node DAG Test Tree & Integration Suite (`WriteIntegrationTestModal.tsx`, `UnitTestOverview.tsx`)
- **Transitive Upstream Traversal:** Automatically isolates the complete sub-DAG cone for any target root node.
- **Parity Tolerance Verification:** Compares float64 C++ legacy evaluations against PyTorch GPU tensors under customizable tolerance limits (e.g. $\varepsilon = 10^{-9}$).
- **Pytest Code Generator:** Generates runnable end-to-end integration tests verifying both price NPV and analytical Greeks via PyTorch Autograd.

### 6. Migrated Repository & Getting Started Guide Explorer (`MigratedFilesDrawer.tsx`)
- **Virtual Packaging Tree:** Structures generated modules into a standard Python package (`torch_quantlib/`, `tests/`, `examples/`, `pyproject.toml`).
- **Interactive Guide:** Displays the comprehensive `README.md` Getting Started Guide with copyable snippets.
- **One-Click Export:** Bundles the entire package into a valid `.zip` archive for immediate `pip install -e .` installation.
- **Defensive Error Handling:** Built with internal error boundaries, preventing white screens under all conditions.

### 7. Centralized Configuration & Observability Engine (`src/config/`, `server/config.ts`, `server/logger.ts`, `src/utils/logger.ts`)
- **Central Config:** Single source of truth for AI model versions, hardware options, default precisions, and network endpoints.
- **Central Logger:** Structured logging of all function calls at INFO level and all GenAI transactions with parameter transparency.

### 8. Canonical Symbol Aliasing & Cross-Framework Normalization (`src/config/appConfig.ts`, `server/agent.ts`, `server/modalEngine.ts`)
- **Symbol Canonicalization:** Standardizes historical or naming variations (such as `GaussianErrorFunction`) to their canonical QuantLib / PyTorch mathematical representations (`ErrorFunction`, utilizing `torch.special.erf`).
- **Semantic Equivalence Normalizer (`areSymbolsEquivalent`):** Normalizes symbols across DAG node graphs, unit test suites, integration test pipelines, and worker execution engines to prevent naming divergence and missing test associations.
- **Bidirectional Module Aliases:** Transpiled kernels automatically export bidirectional Python aliases (`GaussianErrorFunction = ErrorFunction`), guaranteeing zero-breakage when imported by legacy or alternative downstream scripts.

### 9. Project Initialization & Target Library Selection (`StartScreen.tsx`)
- **Multi-Framework Archetypes:** Provides pre-configured, deep dependency cones spanning quantitative finance, stochastic calculus, distributed systems, and scientific computing.
- **Target Framework & Library Selection:** Fully interactive UI controls for choosing the target execution framework (`PyTorch`, `JAX`, `TensorFlow`, `Triton`), target library package namespace (e.g. `torch_quantlib`, `py_enterprise_distributed_engine`), hardware accelerator (`cuda`, `cpu`, `mps`), and numerical precision (`float64`, `mixed_precision`).
- **Runtime Dispatch Configuration:** Allows seamless toggling between local container simulation and Modal serverless distributed cloud execution before launching the migration workbench.

---

## Data Model & Types (`src/types.ts`)
- `Node`: Represents a unit of C++ code in the DAG (symbol, path, kind, status, deps, complexity).
- `UnitTestResult`: Captures test results, category (`target_library`, `integration`, `oracle_parity`), tolerance, latency, and speedup.
- `MigratedFile`: Represents a virtual file inside the target Python repository.
- `ProjectConfig`: User-defined or preset project specifications (target framework, device, precision, repo URL).
