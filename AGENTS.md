# Engineering Standards & Agent Best Practices

This document defines the strict engineering guidelines, architectural standards, and development workflows for the **QuantLib to PyTorch Migration Studio** codebase. Every contributor, human or automated AI agent, must adhere to these practices.

---

## 1. Modularity & Single Responsibility Principle

- **File per Feature:** Create a separate file per feature or tightly cohesive set of related functions. Avoid monolithic "junk-drawer" files or huge 1,000+ line components.
- **Granular Splitting:** Extract state management, API interactions, business algorithms, and UI presentation into dedicated modules (e.g., custom hooks, services, data transformers, and UI atoms).
- **Clear Boundaries:** Never mix direct DOM manipulation or network side effects inside presentation components. Use dedicated hooks and client wrappers.

---

## 2. File Header Comment Standard

Every source code file (`.ts`, `.tsx`, `.py`) **must begin** with a comprehensive multi-line header comment structured as follows:

```typescript
/**
 * ============================================================================
 * [Module / Feature Name]
 * ============================================================================
 * 
 * Feature Description:
 * Detailed explanation of the domain problem this file solves, its scope,
 * and how it fits into the broader architecture.
 * 
 * Use Cases:
 * 1. Concrete user or system use case #1.
 * 2. Concrete user or system use case #2.
 * 3. Edge cases and failure mitigation scenarios.
 * ============================================================================
 */
```

---

## 3. Comprehensive Function Docstrings

- **Every function** (exported or internal) must have a JSDoc or Python docstring explicitly describing:
  - What the function does.
  - `@param` descriptions with expected types and boundary values.
  - `@returns` description of the computed output.
  - `@throws` or error conditions handled.
- Example:
```typescript
/**
 * Asynchronously dispatches a batch of DAG nodes to serverless workers.
 *
 * @param nodes - Ordered array of topological nodes ready for translation
 * @param config - Project hardware acceleration and precision settings
 * @returns Promise resolving to the batch execution summary
 * @throws Error if worker pool is unreachable or validation fails
 */
export async function executeNodeBatch(nodes: Node[], config: ProjectConfig): Promise<BatchResult> {
  // ...
}
```

---

## 4. Centralized Configuration

- **Zero Hardcoded Values:** Never scatter model names, API endpoints, timeout constants, or hardware presets throughout component logic.
- **Frontend Hub:** All client settings, Gemini model tiers (`gemini-2.5-flash`, `gemini-2.5-pro`), precision options, and default tolerances are stored in `src/config/appConfig.ts`.
- **Backend Hub:** All server settings, network ports, payload size limits, and fallback endpoints are stored in `server/config.ts`.

---

## 5. Centralized Telemetry & Logging

- **Function Call Logging:** Log all function calls as `INFO` with their parameter values.
- **GenAI Call Logging:** Every GenAI model request must be logged with:
  - Model identifier used (e.g. `gemini-2.5-flash`).
  - Input prompt / system instructions.
  - Configuration options (temperature, schema, max tokens).
  - Model output response.
  - **Inline Data Stripping:** High-density inline data (Base64 strings, binary buffers, large images) must be stripped or truncated (`[INLINE_DATA_STRIPPED]`) prior to logging to protect memory and log parsers.
- **Central Loggers:**
  - Backend: `server/logger.ts`
  - Frontend: `src/utils/logger.ts`

---

## 6. Living Architecture Documentation (`Design.md`)

- Maintain a comprehensive `Design.md` document at the root of the project.
- Whenever a new feature, API route, or component is introduced or modified, `Design.md` must be updated to describe the feature, dataflow, and interaction contracts.

---

## 7. Defensive Programming & Zero White Screens

- **Error Boundaries:** Complex interactive modals and root component trees must be wrapped with `ErrorBoundary` components to intercept runtime render exceptions.
- **Safe Navigation:** Always guard against missing, null, or empty array values (`files = Array.isArray(files) ? files : []`).
- **Defensive String & Number Operations:** Guard numeric formatting against `undefined` or `NaN` (e.g., `(Number(file.sizeBytes) || 0) / 1024`).

---

## 8. 100% Test Coverage Requirement

- **Test Suite:** The project uses `vitest` as the primary test runner.
- **Unit Testing:** All utility functions, layout engines, configurations, and state hooks must have corresponding unit tests under `tests/unit/`.
- **Integration Testing:** Core workflows (DAG compilation, node execution, file generation, and API endpoints) must have integration tests under `tests/integration/`.
- **Automated Verification:** Run `npm test` before any deployment or pull request.
