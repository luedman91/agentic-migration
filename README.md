# Universal Library Migration Workbench

A universal dependency DAG transpilation, deterministic symbol registry, and differential oracle parity platform for migrating complex numerical, simulation, infrastructure, and domain libraries (e.g. C++, Fortran, MATLAB, Julia) into modern vectorized tensor acceleration frameworks (PyTorch, JAX, TensorFlow, Triton).

---

## Key Features

- **Universal Function Dependency DAG Engine**:
  - Interactive D3-powered directed acyclic graph (DAG) visualizer with top-to-bottom vertical tree hierarchy, horizontal flow, depth cones, and topological sort orders.
  - Automatically handles both pure mathematical kernels (solvers, distributions, numerical integration) and non-mathematical library components (infrastructure, I/O pipelines, logging, hardware buffers, and telemetry).
  - Stabilized pin-and-drag mechanics with layer-based rank stratification.

- **Dual Execution Engine: Local Mode & Modal Cloud Serverless**:
  - **Local Mode**: Execute AST passes and transpilation steps locally within your container/environment.
  - **Modal Cloud Serverless**: Dispatches tasks across distributed Modal GPU/CPU workers for deep dependency DAG pipelines, achieving 50x–100x speedups via parallel node transpilation and concurrent test execution.

- **Deterministic Symbol Registry & Building Blocks**:
  - Dual-engine migration combining deterministic building blocks (e.g., standard normal CDF/PDF, vectorized distributions, buffer allocators, automatic differentiation-ready tensors) with hybrid AI agent reasoning.
  - Custom symbol mapping table for registering project-specific numerical types and tensor broadcasting semantics.

- **Agentic AI Migration Loop (Gemini 3.8 Flash)**:
  - Powered by `@google/genai` with Pydantic-grounded JSON schema output for mathematically rigorous transpilation.
  - Automated vectorization, autograd Jacobian derivation, and numerical stability error-budget handling (&epsilon; &le; 10⁻⁸).
  - Real-time agent dispatch traces with latency tracking, token usage, and lifecycle event logging.

- **Differential Oracle Parity & Multi-Tier Verification**:
  - **Unit Tests**: Targeted tensor tests for shape consistency, subnormal handling, and autograd gradient checks.
  - **Integration Tests**: Multi-module pipeline execution (e.g., term structures &rarr; cash flows &rarr; analytical engines or I/O &rarr; precomputation &rarr; execution).
  - **Oracle Parity**: High-precision differential residual testing against reference source libraries with configurable error tolerances.
  - Synthetic data generators and custom integration test authoring modal.

- **Export & Packaging Pipeline**:
  - Wheel and zip distribution export packaging shippable unit/integration tests while safely separating dev-only oracle test runners.
  - In-browser generated source package file explorer.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion, Lucide Icons, D3.js.
- **Backend Server**: Node.js, Express, Vite middleware integration, esbuild bundler, `@google/genai` SDK, Modal Cloud API dispatch.
- **Build / Tooling**: Vite 8, TypeScript 7.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `bun`

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your environment variables:

```env
# .env
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: Modal Webhook URL for remote GPU cluster execution
# MODAL_WEBHOOK_URL="https://your-modal-app.modal.run"
```

> **Security Note**: Never commit your `.env` file or raw API keys to version control. The `.gitignore` file is pre-configured to ignore all `.env` files except `.env.example`.

### 3. Development Server

Start the full-stack development server on port 3000:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Production Build

Build the client bundle and bundle the Express server:

```bash
npm run build
npm start
```

### 5. Linting & Type Checking

```bash
npm run lint
```

---

## Project Structure

```
├── .env.example         # Environment template (NO secrets)
├── .gitignore           # Git ignore configuration (strictly excludes .env & credentials)
├── index.html           # Application HTML entry point
├── metadata.json        # Application metadata & capabilities
├── package.json         # Project scripts and dependencies
├── server.ts            # Express server entry point with Vite middleware & Modal endpoints
├── server/
│   ├── agent.ts         # Server-side Gemini AI agent & symbol registry
│   └── modalEngine.ts   # Modal serverless execution engine & remote webhook dispatcher
├── src/
│   ├── App.tsx          # Main workbench orchestrator & state manager
│   ├── main.tsx         # React root
│   ├── index.css        # Tailwind styling
│   ├── types.ts         # Shared TypeScript interfaces & types
│   ├── data.ts          # Presets (Heston, European, Deep Multi-Stage Pipeline)
│   ├── utils/
│   │   ├── modalClient.ts    # Modal serverless API client
│   │   └── dagTestManager.ts # Automatic DAG leaf test & unit test generation
│   └── components/
│       ├── StartScreen.tsx        # Library & framework selection configuration
│       ├── ControlsBar.tsx        # Migration execution controls, speed & Modal slider
│       ├── GraphView.tsx          # D3 interactive dependency DAG visualizer
│       ├── LogsSection.tsx        # Runtime logging & Agent dispatch trace inspector
│       ├── UnitTestOverview.tsx   # Multi-tier test suite & oracle parity runner
│       ├── NodeDetailPanel.tsx    # Source vs. Target code comparison & test runner
│       ├── BuildingBlocksModal.tsx # Building blocks symbol mapping manager
│       ├── MigratedFilesDrawer.tsx # Generated distribution files explorer
│       └── WriteIntegrationTestModal.tsx # Custom integration test authoring modal
└── tsconfig.json        # TypeScript configuration
```

---

## Security & API Key Best Practices

- **Zero Client-Side Exposure**: All Gemini API and Modal cloud webhook calls are strictly routed through server-side endpoints (`/api/*`). Secrets (`GEMINI_API_KEY`, `MODAL_WEBHOOK_URL`) are loaded exclusively in server-side modules and are never prefixed with `VITE_` or exposed to the browser.
- **Git Exclusions**: All `.env*` files (except `.env.example`), private keys, and credential stores are ignored by `.gitignore`.
- **Safe Version Control**: Automated verification ensures git commits remain sanitized of secrets and API tokens.
