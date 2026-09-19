# Graph Agent Instructions & Operational Specification

## 1. Role & System Mandate
The **Graph Agent** is the autonomous architectural decomposition engine of the **Graph-Based Agentic Migration Engine**. Its primary mandate is to ingest an arbitrary C++ source file, entry point, or whole repository (e.g., QuantLib C++, legacy pricing engines, risk libraries) and synthesize a clean, strictly acyclic, topologically sorted Directed Acyclic Graph (DAG) **without requiring any preloaded or hardcoded static datasets**.

When all preset catalogs are removed, the Graph Agent operates as the primary discovery mechanism, parsing code structure dynamically and feeding executable nodes to the Migration Agent.

---

## 2. Dynamic Discovery Workflow

```
[Arbitrary C++ Source / Entry Point]
                  │
                  ▼
       1. Header & Include Parsing
          (Extract #include <ql/...> & local references)
                  │
                  ▼
       2. AST Symbol & Call-Graph Extraction
          (Classes, methods, pure virtual interfaces, templates)
                  │
                  ▼
       3. Dependency Resolution & Topological Sorting
          (Assign ranks, break cycles, detect leaf primitives)
                  │
                  ▼
       4. Domain & Complexity Classification
          (pure_math, date_logic, solver, infrastructure)
                  │
                  ▼
       5. Automated Package Subfolder Mapping
          (e.g., termstructures/yield, pricingengines/vanilla)
                  │
                  ▼
      [Target DAG Nodes Emitted to Execution Engine]
```

---

## 3. Node Specification & Schema

Every discovered node must conform strictly to the platform interface:

```typescript
export interface DiscoveredNode {
  id: string;               // Unique slug (e.g., "node_m_erf", "node_heston_engine")
  ql_symbol: string;        // C++ Class or Function identifier
  path: string;             // Original C++ source path (e.g., "ql/pricingengines/vanilla/analytichestonengine.cpp")
  kind: "pure_math" | "solver" | "date_logic";
  status: "todo" | "mapped" | "translated" | "tested";
  deps: string[];           // IDs of direct upstream dependencies
  note: string;             // Concise mathematical / algorithmic architectural role
  complexity: "low" | "medium" | "high";
  estimatedHours: number;   // Engineering estimation based on line count & branching
  code: {
    cpp: string;            // C++ declaration & implementation snippet
    python: string;         // Target Python placeholder or migrated code
  };
}
```

---

## 4. Architectural Domain Classification Rules

The Graph Agent must categorize discovered nodes into functional domains to power Tree Decomposition layout and automated folder generation:

| Domain | C++ Keywords / Includes | Recommended Subfolder | Node Kind |
| :--- | :--- | :--- | :--- |
| **Hardware & Memory** | `alloc`, `arena`, `simd`, `protobuf`, `tsc_timer` | `infrastructure/alloc` | `pure_math` |
| **Special Math & Distributions** | `erf`, `gamma`, `normal`, `legendre`, `chebyshev` | `math/distributions` | `pure_math` |
| **Linear Algebra** | `cholesky`, `qr`, `svd`, `thomas`, `matrix` | `math/linalg` | `pure_math` |
| **Quasi-Monte Carlo** | `sobol`, `mt19937`, `faure`, `halton`, `brownian` | `random` | `pure_math` |
| **Term Structures** | `yield`, `discount`, `zero`, `flatforward`, `curve` | `termstructures/yield` | `pure_math` |
| **Volatility Surfaces** | `volatility`, `sabr`, `dupire`, `heston`, `smile` | `termstructures/volatility` | `pure_math` |
| **SDE Integrators** | `euler`, `milstein`, `rk45`, `stepper`, `sde` | `methods/montecarlo` | `solver` |
| **PDE Solvers** | `crank`, `nicolson`, `adi`, `multigrid`, `boundary` | `methods/finitedifferences` | `solver` |
| **Date & Calendar** | `Date`, `Calendar`, `DayCounter`, `Actual365Fixed` | `time` | `date_logic` |
| **Pricing Engines** | `PricingEngine`, `BlackFormula`, `Analytic`, `MC` | `pricingengines/vanilla` | `solver` |
| **Risk & Basel** | `cvar`, `var`, `frtb`, `sa_ccr`, `pfe`, `cva` | `risk` | `solver` |

---

## 5. Fallback Heuristics When LLM API Is Offline

If Gemini API is unreachable or unconfigured:
1. Parse top-level `#include` statements in the C++ file.
2. For each include path, generate a prerequisite foundation node.
3. Map known standard patterns (e.g. `Actual365Fixed`, `ErrorFunction`, `NormalDistribution`, `FlatForward`).
4. Link the target entry point as the apex root depending on all discovered prerequisites.
5. Compute topological depth from leaves upward.
