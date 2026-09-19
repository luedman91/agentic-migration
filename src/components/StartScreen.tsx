import { useState } from 'react';
import { ProjectConfig } from '../types';
import {
  GitBranch,
  FolderGit2,
  Cpu,
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight,
  Code2,
  Sparkles,
  Terminal,
  Binary,
  TrendingUp,
  Flame,
  Globe2
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
  sourceLibraryName: string;
  targetLibraryName: string;
  nodeCount: number;
  depth: number;
  description: string;
  badge: string;
}

const LIBRARY_PRESETS: LibraryPreset[] = [
  {
    id: 'analytic_european',
    name: 'Quantitative Finance & Derivatives (QuantLib / C++ → PyTorch)',
    category: 'Quantitative Finance',
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analyticeuropeanengine.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'PyTorch',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_quantlib',
    nodeCount: 16,
    depth: 6,
    description: 'Closed-form pricing, Bachelier distributions, yield curves, and batched Autograd Greeks.',
    badge: 'Deep Cone (6 Levels)'
  },
  {
    id: 'heston_semi_analytic',
    name: 'Stochastic Calculus & PDE Quadrature (C++ → JAX / PyTorch)',
    category: 'Stochastic Calculus',
    repoUrl: 'https://github.com/lballabio/QuantLib.git',
    branch: 'v1.34.0',
    entryPoint: 'ql/pricingengines/vanilla/analytichestonengine.cpp',
    sourceLanguage: 'C++',
    targetFramework: 'PyTorch',
    sourceLibraryName: 'QuantLib C++',
    targetLibraryName: 'torch_stochastics',
    nodeCount: 18,
    depth: 7,
    description: 'Complex characteristic functions, Gauss-Laguerre numerical quadrature, and GPU parameter calibration.',
    badge: 'High Complexity (7 Levels)'
  },
  {
    id: 'scientific_ode_solvers',
    name: 'Scientific ODE & Differential Systems (SUNDIALS / C → JAX / PyTorch)',
    category: 'Scientific Computing',
    repoUrl: 'https://github.com/LLNL/sundials.git',
    branch: 'v6.6.0',
    entryPoint: 'src/cvode/cvode_stepper.c',
    sourceLanguage: 'C',
    targetFramework: 'JAX',
    sourceLibraryName: 'SUNDIALS (LLNL)',
    targetLibraryName: 'jax_cvode',
    nodeCount: 15,
    depth: 5,
    description: 'Stiff non-linear ordinary differential equation solvers, Runge-Kutta, and Jacobian-free Newton-Krylov methods.',
    badge: 'Physics & ODE'
  }
];

export default function StartScreen({ onLoadProject, defaultConfig }: StartScreenProps) {
  const [config, setConfig] = useState<ProjectConfig>({
    ...defaultConfig,
    sourceLanguage: defaultConfig.sourceLanguage || 'C++',
    sourceLibraryName: defaultConfig.sourceLibraryName || 'QuantLib C++',
    targetLibraryName: defaultConfig.targetLibraryName || 'torch_quantlib',
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('analytic_european');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const handleSelectPreset = (preset: LibraryPreset) => {
    setSelectedPreset(preset.id);
    setConfig({
      ...config,
      repoUrl: preset.repoUrl,
      branch: preset.branch,
      entryPoint: preset.entryPoint,
      sourceLanguage: preset.sourceLanguage,
      targetFramework: preset.targetFramework,
      sourceLibraryName: preset.sourceLibraryName,
      targetLibraryName: preset.targetLibraryName,
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisStep(`Cloning source AST and header hierarchy from ${config.repoUrl.replace(/^https?:\/\//, '')}...`);

    setTimeout(() => {
      setAnalysisStep(`Invoking Multi-Language AST parser on ${config.entryPoint} (${config.sourceLanguage || 'Source'})...`);
    }, 450);

    setTimeout(() => {
      setAnalysisStep('Resolving transitive includes, tensor bindings, and mathematical function dependencies...');
    }, 900);

    const activePreset = LIBRARY_PRESETS.find((p) => p.entryPoint === config.entryPoint) || LIBRARY_PRESETS[0];

    setTimeout(() => {
      setAnalysisStep(`Discovered ${activePreset.nodeCount} dependency cone nodes across ${activePreset.depth} topological layers. Constructing DAG...`);
    }, 1350);

    setTimeout(() => {
      setIsAnalyzing(false);
      onLoadProject(config);
    }, 1750);
  };

  const currentPreset = LIBRARY_PRESETS.find((p) => p.entryPoint === config.entryPoint) || LIBRARY_PRESETS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top minimal bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-white">Mathematical Library Migration Studio</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
              Universal Transpiler &bull; AST Parity
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Cross-Language AST Analyzer & Numerical Oracle</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur relative">
          {/* Card Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-800/80 text-sky-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Project Ingestion & Target Architecture Setup</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
              Configure Source Repository & Mathematical Dependency DAG
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Migrate numerical algorithms, physics simulators, pricing kernels, and differential equation engines from any source language (C++, C, Fortran, MATLAB) into vectorized accelerator frameworks (PyTorch, JAX, Triton).
            </p>
          </div>

          {/* Library Presets Selector */}
          <div className="mb-6 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Select Mathematical Library Archetype / Dependency Cone
              </span>
              <span className="text-[11px] text-slate-400">Choose a reference dependency cone</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LIBRARY_PRESETS.map((preset) => {
                const isSelected = config.entryPoint === preset.entryPoint;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-950/70 border-sky-600 shadow-md ring-1 ring-sky-500/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {preset.category}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          preset.id === 'heston_semi_analytic'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}>
                          {preset.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white font-mono line-clamp-2 mb-1">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{preset.nodeCount} modules</span>
                      <span className="text-sky-400 font-semibold">{preset.depth} levels deep</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Repository URL, Branch, and Source Language */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-sky-400" /> Source Git Repository
                </label>
                <input
                  type="text"
                  value={config.repoUrl}
                  onChange={(e) => setConfig({ ...config, repoUrl: e.target.value })}
                  placeholder="https://github.com/org/mathematical-library.git"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-sky-400" /> Branch / Tag
                </label>
                <input
                  type="text"
                  value={config.branch}
                  onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-indigo-400" /> Source Language
                </label>
                <select
                  value={config.sourceLanguage || 'C++'}
                  onChange={(e) => setConfig({ ...config, sourceLanguage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="C++">C++ (17 / 20 / 23)</option>
                  <option value="C">C (C99 / C11 / C17)</option>
                  <option value="Fortran">Fortran (77 / 90 / 2008)</option>
                  <option value="MATLAB">MATLAB / Octave</option>
                  <option value="Julia">Julia</option>
                  <option value="Python">Legacy Python (NumPy / SciPy)</option>
                </select>
              </div>
            </div>

            {/* Target Entry Point File */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Target File / Dependency Cone Root
              </label>
              <input
                type="text"
                value={config.entryPoint}
                onChange={(e) => setConfig({ ...config, entryPoint: e.target.value })}
                placeholder="src/engines/pricing_kernel.cpp"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
            </div>

            {/* Dropdowns Row: Target Framework, Device, Precision */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Target Framework */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Target Framework
                </label>
                <select
                  value={config.targetFramework}
                  onChange={(e) =>
                    setConfig({ ...config, targetFramework: e.target.value as ProjectConfig['targetFramework'] })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="PyTorch">PyTorch (Tensor / Autograd)</option>
                  <option value="JAX">JAX (jit / vmap / Pallas)</option>
                  <option value="TensorFlow">TensorFlow 2.x (tf.function)</option>
                  <option value="Triton">Triton (Custom GPU Kernels)</option>
                </select>
              </div>

              {/* Target Device */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Accelerator Hardware
                </label>
                <select
                  value={config.targetDevice}
                  onChange={(e) =>
                    setConfig({ ...config, targetDevice: e.target.value as ProjectConfig['targetDevice'] })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="cuda">CUDA (NVIDIA Tensor Cores)</option>
                  <option value="cpu">CPU (x86_64 AVX-512 / AMX)</option>
                  <option value="mps">Apple MPS (Metal Performance)</option>
                </select>
              </div>

              {/* Precision Policy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-sky-400" /> Numerical Precision
                </label>
                <select
                  value={config.precision}
                  onChange={(e) =>
                    setConfig({ ...config, precision: e.target.value as ProjectConfig['precision'] })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="float64">Float64 (Strict Double Precision)</option>
                  <option value="mixed_precision">Mixed (FP32 with FP64 accum)</option>
                </select>
              </div>
            </div>

            {/* Ingestion Preview Summary Box */}
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
              <div className="flex items-center justify-between text-slate-300 pb-1.5 border-b border-slate-800">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Detected Target Cone Profile ({currentPreset.name.split(' (')[0]})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  Ready to Ingest
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Identified Nodes</span>
                  <span className="text-slate-200 font-bold">{currentPreset.nodeCount} Modules</span>
                </div>
                <div>
                  <span className="text-slate-500 block">DAG Hierarchy</span>
                  <span className="text-slate-200 font-bold">{currentPreset.depth} Topological Layers</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source Architecture</span>
                  <span className="text-slate-200 font-bold">{config.sourceLanguage || 'C++'} &bull; {currentPreset.sourceLibraryName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Parity Tolerance</span>
                  <span className="text-emerald-400 font-bold">&le; 10⁻⁸ ε</span>
                </div>
              </div>
            </div>

            {/* Analysis Progress Overlay / Indicator */}
            {isAnalyzing && (
              <div className="p-3 bg-sky-950/40 border border-sky-800/70 rounded-xl flex items-center gap-3 text-xs text-sky-200 animate-pulse font-mono">
                <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="flex-1 truncate">
                  <span className="font-semibold text-sky-300 mr-2">[Analysis Engine]</span>
                  <span>{analysisStep}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfig(defaultConfig);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 cursor-pointer"
              >
                Reset to Default Settings
              </button>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing AST & Building Mathematical DAG...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Repository & Build Dependency DAG</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-500 font-mono">
        Mathematical Library Migration Studio &bull; Autonomous AI Agent Transpiler &bull; Differential Numerical Oracle
      </footer>
    </div>
  );
}
