/**
 * ============================================================================
 * Project Initialization & Archetype Selector (StartScreen.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * Renders the project introduction screen allowing engineers to select source
 * function dependency cones, configure target frameworks and libraries (PyTorch,
 * JAX, TensorFlow, Triton), customize hardware acceleration, and choose
 * execution runtimes (Modal serverless cloud vs. local container).
 * 
 * Use Cases:
 * 1. Selecting pre-configured mathematical archetypes (150-node enterprise DAG,
 *    distributed pipelines, European engine, Heston stochastic calculus).
 * 2. Interactively selecting and customizing the target framework and library.
 * 3. Toggling between distributed Modal serverless GPU execution and local sandboxes.
 * ============================================================================
 */

import { useState } from 'react';
import { ProjectConfig } from '../types';
import {
  FolderGit2,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Terminal,
  CloudLightning,
  Monitor,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Zap,
  Binary,
  Package
} from 'lucide-react';

interface StartScreenProps {
  onLoadProject: (config: ProjectConfig) => void;
  defaultConfig: ProjectConfig;
}

interface LibraryPreset {
  id: string;
  name: string;
  category: string;
  repoUrl: string;
  branch: string;
  entryPoint: string;
  sourceLanguage: string;
  targetFramework: ProjectConfig['targetFramework'];
  targetDevice: ProjectConfig['targetDevice'];
  precision: ProjectConfig['precision'];
  sourceLibraryName: string;
  targetLibraryName: string;
  nodeCount: number;
  depth: number;
  description: string;
  badge: string;
  highlight?: boolean;
}

export const LIBRARY_PRESETS: LibraryPreset[] = [
  {
    id: 'massive_enterprise_150_dag',
    name: 'Enterprise Ultra-Deep Quantitative Simulation (C++ → PyTorch)',
    category: 'Ultra-Deep DAG (150 Nodes)',
    repoUrl: 'https://github.com/uber/athenadriver.git',
    branch: 'main',
    entryPoint: 'src/orchestrator/system_coordinator.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'PyTorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'Athena Engine + QuantLib Core (C++)',
    targetLibraryName: 'py_enterprise_distributed_engine',
    nodeCount: 150,
    depth: 15,
    description: '150-node deep DAG across 15 topological layers: from SIMD buffers, Cholesky, and Milstein SDEs to Dual Tensors, American pricing, CVaR 99%, and Modal serverless gateways.',
    badge: '150 Nodes • 15 Layers',
    highlight: true
  },
  {
    id: 'deep_distributed_pipeline',
    name: 'Distributed High-Throughput Pipeline (C++ → PyTorch)',
    category: 'Distributed Systems',
    repoUrl: 'https://github.com/uber/athenadriver.git',
    branch: 'main',
    entryPoint: 'src/orchestrator/system_coordinator.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'PyTorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'Athena Engine (C++)',
    targetLibraryName: 'py_distributed_pipeline',
    nodeCount: 28,
    depth: 10,
    description: '10-level deep function DAG mixing non-mathematical modules (Protobuf, Rate Limiter, Hashing, WebSockets) with GPU simulation to showcase Modal parallelization.',
    badge: '28 Nodes • 10 Layers'
  },
  {
    id: 'analytic_european',
    name: 'Quantitative Finance & Derivatives (QuantLib / C++ → PyTorch)',
    category: 'Quantitative Finance',
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analyticeuropeanengine.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'PyTorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_quantlib',
    nodeCount: 16,
    depth: 6,
    description: 'Closed-form pricing, Bachelier distributions, yield curves, and batched Autograd Greeks.',
    badge: '16 Nodes • 6 Layers'
  },
  {
    id: 'heston_semi_analytic',
    name: 'Stochastic Calculus & PDE Quadrature (C++ → PyTorch)',
    category: 'Stochastic Calculus',
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analytichestonengine.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'PyTorch',
    targetDevice: 'cuda',
    precision: 'float64',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_stochastics',
    nodeCount: 18,
    depth: 7,
    description: 'Complex characteristic functions, Gauss-Laguerre numerical quadrature, and GPU parameter calibration.',
    badge: '18 Nodes • 7 Layers'
  }
];

export default function StartScreen({ onLoadProject, defaultConfig }: StartScreenProps) {
  const initialPreset = LIBRARY_PRESETS.find((p) => p.id === 'massive_enterprise_150_dag') || LIBRARY_PRESETS[0];
  const [config, setConfig] = useState<ProjectConfig>({
    ...defaultConfig,
    presetId: 'massive_enterprise_150_dag',
    sourceLanguage: initialPreset.sourceLanguage,
    sourceLibraryName: initialPreset.sourceLibraryName,
    targetLibraryName: initialPreset.targetLibraryName,
    repoUrl: initialPreset.repoUrl,
    branch: initialPreset.branch,
    entryPoint: initialPreset.entryPoint,
    targetFramework: initialPreset.targetFramework,
    targetDevice: initialPreset.targetDevice,
    precision: initialPreset.precision,
    executionMode: defaultConfig.executionMode || 'modal',
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>('massive_enterprise_150_dag');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const activePreset = LIBRARY_PRESETS.find((p) => p.id === selectedPresetId) || LIBRARY_PRESETS[0];

  const handleSelectPreset = (preset: LibraryPreset) => {
    setSelectedPresetId(preset.id);
    setConfig({
      ...config,
      presetId: preset.id,
      repoUrl: preset.repoUrl,
      branch: preset.branch,
      entryPoint: preset.entryPoint,
      sourceLanguage: preset.sourceLanguage,
      targetFramework: preset.targetFramework,
      targetDevice: preset.targetDevice,
      precision: preset.precision,
      sourceLibraryName: preset.sourceLibraryName,
      targetLibraryName: preset.targetLibraryName,
    });
  };

  const handleLaunch = () => {
    setIsAnalyzing(true);
    setAnalysisStep(`Auto-detecting repository AST from ${config.repoUrl.replace(/^https?:\/\//, '')}...`);

    setTimeout(() => {
      setAnalysisStep(`Parsing entry point ${config.entryPoint} (inferred: ${config.sourceLanguage || 'C++'})...`);
    }, 400);

    setTimeout(() => {
      setAnalysisStep(`Automatically inferred target: ${config.targetFramework} on ${config.targetDevice.toUpperCase()} (${config.precision})...`);
    }, 850);

    setTimeout(() => {
      setAnalysisStep(`Discovered ${activePreset.nodeCount} functions across ${activePreset.depth} topological layers. Constructing complete Dependency DAG (${config.executionMode === 'modal' ? 'Modal Parallel Compute' : 'Local Container'})...`);
    }, 1300);

    setTimeout(() => {
      setIsAnalyzing(false);
      onLoadProject(config);
    }, 1700);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top minimal header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-white">Function & Mathematical Library Migration Studio</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
              Auto-Inferred Architecture &bull; Root-to-Node Tests &bull; Modal Cloud
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Automated Transpiler & Verification Engine</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur relative">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-800/80 text-sky-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>One-Click Ingestion & Auto-Inferred Setup</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
              Select Source Function Dependency Cone
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select a codebase archetype to instantly trace its complete function graph. Framework configurations, AST language drivers, precision, and hardware targets are automatically inferred.
            </p>
          </div>

          {/* Quick Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {LIBRARY_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-500 shadow-md ring-1 ring-sky-500/60'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {preset.category}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        preset.highlight
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}>
                        {preset.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono mb-1">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-slate-300 font-semibold">{preset.nodeCount} Modules</span>
                    <span className="text-sky-400 font-semibold">{preset.depth} Levels Deep</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inferred Settings Summary Banner */}
          <div className="mb-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-slate-200">Execution Runtime:</span>
                {config.executionMode === 'modal' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CloudLightning className="w-3 h-3 text-emerald-400" /> Modal Serverless Cloud
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-slate-400" /> Local Container
                  </span>
                )}
              </div>

              {/* Quick toggle slider */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, executionMode: 'local' })}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    config.executionMode === 'local'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Local
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, executionMode: 'modal' })}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    config.executionMode === 'modal'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CloudLightning className="w-3 h-3 text-emerald-300" />
                  <span>Modal Cloud</span>
                </button>
              </div>
            </div>

            {/* Selectable Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label htmlFor="source-language-select" className="text-slate-400 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-slate-400" /> Source Language
                </label>
                <select
                  id="source-language-select"
                  value={config.sourceLanguage || 'C++'}
                  onChange={(e) => setConfig({ ...config, sourceLanguage: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="C++">C++ (ISO C++20 / QuantLib)</option>
                  <option value="C">C (C99 / C11 / SUNDIALS)</option>
                  <option value="Fortran">Fortran (90 / 2008)</option>
                  <option value="Julia">Julia (v1.10+)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="target-framework-select" className="text-sky-300 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" /> Target Framework / Library
                </label>
                <select
                  id="target-framework-select"
                  value={config.targetFramework}
                  onChange={(e) => {
                    const fw = e.target.value as ProjectConfig['targetFramework'];
                    const defaultLibName = fw === 'PyTorch'
                      ? (config.presetId?.includes('150') ? 'py_enterprise_distributed_engine' : 'torch_quantlib')
                      : fw === 'JAX'
                      ? 'jax_sim'
                      : fw === 'TensorFlow'
                      ? 'tf_sim'
                      : 'triton_kernels';
                    setConfig({
                      ...config,
                      targetFramework: fw,
                      targetLibraryName: defaultLibName,
                    });
                  }}
                  className="w-full bg-slate-900 border border-sky-600/80 rounded-lg px-2.5 py-1.5 text-xs text-sky-400 font-semibold focus:outline-none focus:border-sky-400 cursor-pointer shadow-sm shadow-sky-950"
                >
                  <option value="PyTorch">PyTorch (Vectorized Tensors)</option>
                  <option value="JAX">JAX (jit / vmap / Pallas)</option>
                  <option value="TensorFlow">TensorFlow 2.x (Graph Mode)</option>
                  <option value="Triton">Triton (GPU Acceleration)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="target-device-select" className="text-slate-400 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-emerald-400" /> Hardware Accelerator
                </label>
                <select
                  id="target-device-select"
                  value={config.targetDevice}
                  onChange={(e) => setConfig({ ...config, targetDevice: e.target.value as ProjectConfig['targetDevice'] })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="cuda">CUDA (NVIDIA A10G / H100)</option>
                  <option value="cpu">CPU (AVX-512 Vectorized)</option>
                  <option value="mps">Apple MPS (Metal Performance)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="precision-select" className="text-slate-400 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Binary className="w-3 h-3 text-sky-400" /> Numerical Precision
                </label>
                <select
                  id="precision-select"
                  value={config.precision}
                  onChange={(e) => setConfig({ ...config, precision: e.target.value as ProjectConfig['precision'] })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="float64">Float64 (Strict Double)</option>
                  <option value="mixed_precision">Mixed (FP32 / FP64 Accum)</option>
                </select>
              </div>
            </div>

            {/* Target Library Package Name Customization */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 flex-1">
                <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <label htmlFor="target-library-name-input" className="text-slate-400 text-[11px] whitespace-nowrap">
                  Target Library Package Name:
                </label>
                <input
                  id="target-library-name-input"
                  type="text"
                  value={config.targetLibraryName || ''}
                  onChange={(e) => setConfig({ ...config, targetLibraryName: e.target.value })}
                  placeholder="e.g. torch_quantlib, py_enterprise_distributed_engine"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-semibold flex-1 max-w-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-500">
                Target Module: <span className="text-indigo-300 font-bold">{config.targetLibraryName || 'dist_package'}</span> ({config.targetFramework})
              </span>
            </div>
          </div>

          {/* Collapsible Advanced Settings (Optional for Power Users) */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer py-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>{showAdvanced ? 'Hide Advanced Git & AST Settings' : 'Customize Git Repository & Entry Point (Optional)'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-400 text-[11px] flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3 text-sky-400" /> Git Repository URL
                    </label>
                    <input
                      type="text"
                      value={config.repoUrl}
                      onChange={(e) => setConfig({ ...config, repoUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Branch</label>
                    <input
                      type="text"
                      value={config.branch}
                      onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Entry Point File</label>
                  <input
                    type="text"
                    value={config.entryPoint}
                    onChange={(e) => setConfig({ ...config, entryPoint: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Analysis indicator if running */}
          {isAnalyzing && (
            <div className="mb-4 p-3 bg-sky-950/40 border border-sky-800/70 rounded-xl flex items-center gap-3 text-xs text-sky-200 animate-pulse font-mono">
              <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="flex-1 truncate">
                <span className="font-semibold text-sky-300 mr-2">[Analysis Engine]</span>
                <span>{analysisStep}</span>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tracing AST & Building Function DAG...</span>
                </>
              ) : (
                <>
                  <span>Load {activePreset.nodeCount}-Node Function DAG ({activePreset.depth} Levels Deep)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-500 font-mono">
        Function & Mathematical Library Migration Studio &bull; Autonomous AI Agent Transpiler &bull; Modal Serverless Cloud Sandbox
      </footer>
    </div>
  );
}
