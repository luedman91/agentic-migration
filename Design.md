# Design & Architecture Specification: Graph Based Agentic Migration Engine

## Executive Overview
The **Graph based agentic migration engine** is an enterprise-grade automated transpilation, verification, and code generation platform. It transforms legacy codebases (such as object-oriented C++ mathematical and distributed libraries) into vectorized, differentiable target frameworks (such as PyTorch or JAX tensor operations) running on GPU/TPU hardware accelerators and serverless clouds.

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

### 1. Topological Dependency Cone & Tree Decomposition Visualizer (`GraphView.tsx`, `treeLayout.ts`)
- **Tree Decomposition & Space Colonization Layout:** Replaced rigid, uniform grid spacing with an organic dendritic tree structure. Primitives cluster along natural functional branch trunks (`math`, `time`, `termstructures`, `volatility`, `solvers`, `pricingengines`) with non-equal spacing: compact intra-branch spacing for tight siblings and spacious inter-branch gaps between distinct functional trunks.
- **Barycentric Branch Growth:** Higher layers position at the barycentric centroid of their upstream dependencies with lateral fork offsets for single-parent children and collision-relaxation passes to ensure visual clarity.
- **Dendritic Bézier Tree Branches:** Connects nodes with smooth SVG cubic Bézier curves that dynamically orient marker arrowheads along tangent lines at node perimeters.
- **Topological Sorting:** Parses upstream and downstream dependencies. Leaves (pure mathematical primitives like `NormalDistribution` or `FlatForward`) are migrated first, guaranteeing that complex composite nodes (such as `AnalyticEuropeanEngine`) always have tested upstream dependencies available.
- **Canvas Navigation:** Built for vast multi-layer trees (28 and 150 nodes) with smooth pan/zoom, auto-fit view framing, and stable layout toggles.
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
- **Parity Tolerance Verification:** Compares float64 C++ legacy evaluations against PyTorch GPU tensors under customizable tolerance limits (e.g. $\varepsilon = 10^{-5}$).
- **Pytest Code Generator:** Generates runnable end-to-end integration tests verifying both price NPV and analytical Greeks via PyTorch Autograd.

### 6. Migrated Repository & Mirrored Folder Structure (`MigratedFilesDrawer.tsx`, `src/data/initialFiles.ts`)
- **Mirrored Package & Test Architecture:** Structured into modular domain subfolders (`torch_quantlib/math`, `torch_quantlib/pricingengines`, `torch_quantlib/termstructures`, `torch_quantlib/time`, `torch_quantlib/api`) with a strictly mirrored test suite under `tests/` (`tests/math`, `tests/pricingengines`, `tests/termstructures`, `tests/time`, `tests/api`, `tests/integration`).
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

### 9. Project Initialization & Variable-Driven Configuration (`StartScreen.tsx`)
- **Focused Scope Archetypes (28 & 150 Nodes):** Displays two real-world graph sizes: the 28-node distributed function pipeline and the 150-node enterprise ultra-deep dependency graph.
- **User-Editable Parameter Fields (No Dropdowns):** Replaces rigid select dropdowns with clean, developer-centric text inputs:
  - **Source repo:** URL to legacy source repository (e.g. `https://github.com/lballabio/QuantLib.git`), branch, and entry point.
  - **Target framework:** User-specified framework (e.g. `pytorch`, `jax`, `triton`).
  - **Target package name:** Custom destination package identifier (e.g. `torch_quantlib`).
  - **Other instructions & Numerical Diff Tolerance:** Multiline instructions prefilled with `numerical diff tolerance should be 1e-5`, tensor vectorization, strict type hints, and symbol aliases, complemented with quick-click directive chips.
- **Runtime Dispatch Configuration:** Allows toggling between local container simulation and Modal serverless distributed cloud execution.

### 10. Dynamic Graph Discovery & Zero-Preloaded Data Workflow (`DiscoverGraphModal.tsx`, `server/agent.ts`)
- **Arbitrary Source Deconstruction:** Enables zero-preloaded data operation where users provide an arbitrary C++ entry point or header file, and the Graph Discovery Agent (`POST /api/agent/discover-graph`) dynamically derives the complete topological DAG, dependency cones, estimated hours, and code stubs.
- **Dedicated Agent Instruction Manuals:** Governed by `GRAPH_AGENT_INSTRUCTIONS.md` (topological decomposition, cycle detection, leaf-to-root ordering) and `MIGRATION_AGENT_INSTRUCTIONS.md` (vectorization, autograd compliance, Pytest validation at 1e-5 numerical tolerance).
- **Graceful Empty State:** App seamlessly transitions from a zero-node empty state into an active migration workbench when a DAG is discovered or imported.

### 11. Automated Agent-Driven Folder Hierarchy Generation (`server/agent.ts`, `App.tsx`)
- **Semantic Path Inference (`inferFolderHierarchy`):** Automatically maps C++ namespaces, directory headers, and function types to structured target subpackages (`math`, `pricingengines`, `termstructures`, `time`, `methods`, etc.) and automatically generates mirrored test paths (`tests/<subfolder>/test_<module>.py`).
- **Dynamic File Recording:** Migrated artifacts are cataloged on-the-fly into their deduced folder hierarchy without relying on hardcoded file lists.

### 12. Non-Equal Spacing Tree Decomposition Layout (`src/utils/treeLayout.ts`, `GraphView.tsx`)
- **Tree Decomposition & Space Colonization:** Eliminates rigid horizontal grid alignments by organizing the DAG into organic dendritic trunks and branch corridors.
- **Variable Cluster Spacing:** Uses tight intra-branch spacing for cohesive siblings and expansive inter-branch spacing between different mathematical domains.
- **Barycentric Centering & Organic Lateral Jitter:** Multi-parent nodes position at the barycenter of their upstream inputs, while single-parent chains fork with subtle branch offsets to prevent artificial linear stacking.

### 13. Split View Independent Scroll Isolation & Clean Package Namespaces
- **Scroll & Viewport Decoupling:** In the Split View workbench, the runtime logs pane and dependency graph are strictly decoupled using CSS `min-h-0`, `overflow-hidden`, and `overscroll-contain`. Mouse wheel events within the terminal are stopped via `e.stopPropagation()`, ensuring the user can scroll through lengthy agent trace logs without shifting or altering the zoom and transform of the D3 graph canvas.
- **Dynamic Package Hierarchies & `py_distributed` Clarification:** Replaced legacy prototyping directories (such as `py_distributed`) with user-specified target library package structures (e.g. `torch_quantlib/<subfolder>/...` and mirrored `tests/<subfolder>/...`). Specifically, `py_distributed` is the distributed tensor execution subsystem responsible for multi-GPU/multi-node parallelization (e.g., PyTorch `torch.distributed` DDP, collective all-reduce operations for Monte Carlo path aggregations, and Modal serverless worker dispatching).

### 14. DAG Green Leaf Visualization & Integration Test Checkpoint System (`src/utils/dagTestManager.ts`, `GraphView.tsx`)
- **Strict Green Leaf Visualization Rule:** In the DAG visualization, only nodes that are DAG leaves AND have an associated passing integration test are rendered green (`#10b981`). Unit-tested kernels retain their distinctive amber/gold indicator (`#f59e0b`), and mapped nodes remain sky blue (`#38bdf8`).
- **Integration Tests From Green Checkpoints:** Nodes that are already green serve as verified calculation checkpoints. Downstream integration tests do not need to re-verify or re-run upstream foundations; they can ingest validated tensor outputs directly from green checkpoints, dramatically accelerating integration test generation and reducing test execution time.
- **HUD & Modal Integration:** The Test Tree HUD and `WriteIntegrationTestModal` automatically identify all green upstream checkpoints, display direct synthesis buttons ("Run Integration Test From Green Checkpoints"), and synthesize production pytest pipelines.

### 15. Asynchronous Multi-Worker Parallel Migration Pool (`App.tsx`, `ControlsBar.tsx`)
- **Concurrent Worker Pool (1 to 3 Workers):** Migration execution can be parallelized with 2 to 3 concurrent workers (`W1`, `W2`, `W3`).
- **Topological Invariant Enforcement:** The scheduler continuously evaluates the DAG and dispatches only nodes whose dependencies have been 100% satisfied and tested. Mutual exclusion guarantees no two workers ever process the same node or violate dependency constraints.
- **Live Worker Observability:** The DAG graph dynamically renders active worker badges (e.g., `[W1]`, `[W2]`, `[W3]`) with pulse animations over the corresponding nodes, and an active worker banner at the top of the canvas displays the live assignment and symbol for each worker thread.
- **Flexible Concurrency Selector:** Users can toggle concurrency between 1, 2, and 3 workers directly from the controls bar or within the configuration settings modal.

### 16. Non-Math Software Library Migration & Instruction-Driven Diff Tolerance
- **General-Purpose Software Migration:** In addition to high-performance mathematical modeling engines (like QuantLib), the platform supports non-mathematical software repositories (such as `nlohmann/json` modern C++ JSON serialization library to Python/Pydantic/Orjson).
- **Prompt-Driven Tolerance Configuration:** Numerical diff tolerance is no longer a dedicated numerical field. Instead, tolerance criteria (e.g., `1e-5`, `1e-8`) are specified purely as textual instructions within the text area prompt and automatically parsed into configuration metadata when relevant, allowing non-math libraries to migrate cleanly without artificial numerical constraints.
- **Free-Floating Dynamic Physics & Horizontal DAG by Default:** The DAG visualizer initializes with horizontal (left-to-right) orientation and free-floating physics (`isLocked = false`) as the default state, providing an intuitive left-to-right dependency pipeline and natural fluid physics simulations, while retaining vertical layout toggling and manual pin-down locking whenever desired.

### 17. Modular DAG Scheduler & Multi-Worker Parallel Dispatch Engine (`src/utils/dagScheduler.ts`, `tests/unit/dagScheduler.test.ts`)
- **Strict Dependency Cones & Topological Isolation:** Extracted `getAvailableCandidates`, `getSafeFallbackCandidate`, and `isPipelineFinished` into a pure, modular scheduler utility. Ensures that child nodes are never dispatched to worker slots while their upstream parent nodes are still in-flight or incomplete.
- **Worker Starvation & Stall Prevention:** Synchronizes `nodesRef.current` state immediately across all mutation boundaries. When upstream dependencies complete verification (`tested`), child branches are immediately made available to idle workers, preventing workers from getting stuck waiting for stale React batching cycles.
- **Deadlock & Cycle Fallback:** In the event of cyclical dependencies or disconnected non-rooted subgraphs, `getSafeFallbackCandidate` provides a deterministic fallback candidate to prevent pipeline stalls.
- **100% Test Coverage:** Covered by unit test suite in `tests/unit/dagScheduler.test.ts` validating single-branch, multi-branch, in-flight exclusion, cycle fallback, and terminal condition detection.

### 18. Enhanced Log Terminal Scrolling & Auto-Scroll Resume Engine (`src/components/LogsSection.tsx`, `src/index.css`)
- **Container Viewport Flex Constraint:** Enforced `flex-1 min-h-0 h-full overflow-hidden flex flex-col` on all tab container wrappers (`activeTab === 'logs'`, `activeTab === 'tests'`), enabling the inner terminal `overflow-y-auto scrollbar-thin` container to correctly calculate scroll dimensions and scrollbars.
- **Intelligent User Scroll Detection:** The terminal tracks scroll events. When a user scrolls up to inspect previous compilation logs or agent prompts, `autoScroll` is automatically paused without jumpy layout snapping.
- **Floating Resume Auto-Scroll Pill:** A floating badge appears whenever new logs arrive while scrolled up, displaying a "New logs below • Click to resume auto-scroll" button with a down arrow, smoothly snapping back to the bottom when clicked.

### 19. Decoupled Example Presets & Split View Optimization (`src/data/examplePresets.ts`, `src/components/GraphView.tsx`)
- **Decoupled Demonstration Presets:** Standalone reference presets (`EXAMPLE_PRESETS`) are isolated in `src/data/examplePresets.ts`. QuantLib C++ $\to$ PyTorch, nlohmann/json, and Eigen linear algebra serve as demonstration archetypes. The UX and architecture clearly present the engine as a general-purpose migration platform capable of ingesting arbitrary codebases and target frameworks.
- **Split View Vertical Orientation & Auto-Centering:** In Split View (`activeTab === 'split'`), `GraphView` defaults to vertical orientation (`defaultOrientation="vertical"`). A `ResizeObserver` monitors pane dimensions and automatically triggers bounding-box auto-centering (`handleFitToScreen`), ensuring the DAG graph is comfortably centered without manual panning.
- **Dual-Pane Scroll Isolation:** Split View logs pane features isolated wheel and scroll listeners (`e.stopPropagation()`) with flex-1 height constraints, guaranteeing that the terminal scrollbar remains active, responsive, and unclipped alongside the interactive D3 graph canvas.

### 20. Python Output File Naming & PEP 8 Snake Case Standard (`src/utils/stringUtils.ts`, `server/naming.ts`)
- **PEP 8 File Naming Enforcement:** Standardizes all generated target Python modules and test files to strictly follow lowercase snake_case with underscore word boundaries (e.g., `analytic_heston_engine.py`, `cumulative_normal_distribution.py`, `flat_forward.py`, `day_counter.py`).
- **Comprehensive Casing Transformations:**
  - **PascalCase & camelCase:** Converts upper-camel symbols by splitting at capital transitions (`AnalyticHestonEngine` $\to$ `analytic_heston_engine`).
  - **Acronym Preservation:** Accurately separates multi-letter uppercase acronyms followed by words (`HouseholderQRDecomposer` $\to$ `householder_qr_decomposer`, `SIMDFloatDoublePacker` $\to$ `simd_float_double_packer`).
  - **Alphanumeric Digit Transitions:** Separates letter-to-digit and digit-to-letter transitions (`Actual365Fixed` $\to$ `actual_365_fixed`).
  - **Dictionary Segmentation for Legacy Squished Files:** Employs an algorithmic vocabulary segmenter to automatically introduce underscores into legacy C++ paths that lacked casing cues (`analytichestonengine` $\to$ `analytic_heston_engine`, `discountcurve` $\to$ `discount_curve`).
- **Mirrored Test Hierarchy with Underscores:** Test files mirror the package structure with `test_` prefixes and underscored module names (e.g., `tests/pricingengines/vanilla/test_analytic_heston_engine.py`).
- **Full Architectural Propagation:** Naming normalization is enforced across server-side AST analysis (`server/agent.ts`), Modal serverless workers (`server/modalEngine.ts`), virtual file system synchronizers (`src/hooks/useFileManager.ts`), and the application orchestrator (`src/App.tsx`). Covered with 100% unit test coverage in `tests/unit/stringUtils.test.ts`.

---

## Data Model & Types (`src/types.ts`)
- `Node`: Represents a unit of C++ code in the DAG (symbol, path, kind, status, deps, complexity).
- `UnitTestResult`: Captures test results, category (`target_library`, `integration`, `oracle_parity`), tolerance, latency, and speedup.
- `MigratedFile`: Represents a virtual file inside the target Python repository.
- `ProjectConfig`: User-defined or preset project specifications (target framework, device, precision, repo URL).
- `WorkerState`: Tracks parallel migration worker instances (id, name, activeNodeId, activeSymbol, status, startedAt).
