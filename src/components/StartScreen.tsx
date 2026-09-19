/**
 * ============================================================================
 * Graph-Based Agentic Migration Engine - Intro & Configuration (StartScreen.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * Renders the primary project onboarding interface for the Graph-Based Agentic
 * Migration Engine. Provides interactive selection of dependency graph scopes
 * (including math engines like QuantLib and non-math libraries like nlohmann/json)
 * and exposed text fields for custom migration variables: source repository URL,
 * target framework, target package name, and agent prompt directives text field.
 * 
 * Use Cases:
 * 1. Migrating math libraries (e.g. QuantLib) or non-math libraries (e.g. parsers, data structures, fmt).
 * 2. Configuring custom migration variables (source repo, target framework, target package).
 * 3. Providing specific agent directives in the free-form text field (tolerances for math,
 *    or schema/type/exception parity for non-math libraries).
 * 4. Dispatching project ingestion into the interactive dependency graph workbench.
 * ============================================================================
 */

import { useState } from 'react';
import { ProjectConfig } from '../types';
import { EXAMPLE_PRESETS, LIBRARY_PRESETS, LibraryPreset, getExamplePresetById } from '../data/examplePresets';
export type { LibraryPreset };
export { LIBRARY_PRESETS, EXAMPLE_PRESETS };
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
  Zap,
  Binary,
  Package,
  FileCode2,
  Plus,
  BookOpen
} from 'lucide-react';

interface StartScreenProps {
  onLoadProject: (config: ProjectConfig) => void;
  defaultConfig: ProjectConfig;
}

const SUGGESTED_FRAMEWORKS = ['pytorch', 'python', 'jax', 'numpy', 'triton'];

const QUICK_DIRECTIVE_SNIPPETS = [
  'numerical diff tolerance should be 1e-5',
  'functional & logical equality assertions (non-math)',
  'preserve strict exception handling & boundary validation',
  'vectorize inner loops with batched tensors',
  'preserve original C++ docstrings & comments',
  'strictly annotate with Python 3.11 type hints & dataclasses',
  'export canonical symbol aliases',
  'target CUDA device with zero-copy CPU fallback',
  'include shippable pytest assertions with comprehensive test vectors'
];

/**
 * StartScreen Component
 *
 * Renders the modern, developer-centric onboarding screen for the
 * Graph-Based Agentic Migration Engine.
 *
 * @param props - Component properties containing defaultConfig and onLoadProject
 * @returns React functional component
 */
export default function StartScreen({ onLoadProject, defaultConfig }: StartScreenProps) {
  const initialPreset = LIBRARY_PRESETS.find((p) => p.id === defaultConfig.presetId) || LIBRARY_PRESETS[0];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset.id);

  // Form State using direct text fields for full developer flexibility
  const [sourceRepo, setSourceRepo] = useState<string>(defaultConfig.repoUrl || initialPreset.repoUrl);
  const [branch, setBranch] = useState<string>(defaultConfig.branch || initialPreset.branch);
  const [entryPoint, setEntryPoint] = useState<string>(defaultConfig.entryPoint || initialPreset.entryPoint);
  const [targetFramework, setTargetFramework] = useState<string>(defaultConfig.targetFramework || initialPreset.targetFramework);
  const [targetPackageName, setTargetPackageName] = useState<string>(defaultConfig.targetLibraryName || initialPreset.targetLibraryName);
  const [otherInstructions, setOtherInstructions] = useState<string>(
    defaultConfig.otherInstructions || initialPreset.otherInstructions
  );

  const [executionMode, setExecutionMode] = useState<'local' | 'modal'>(defaultConfig.executionMode === 'local' ? 'local' : 'modal');
  const [targetDevice, setTargetDevice] = useState<ProjectConfig['targetDevice']>(defaultConfig.targetDevice || 'cuda');
  const [precision, setPrecision] = useState<ProjectConfig['precision']>(defaultConfig.precision || 'float64');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const activePreset = LIBRARY_PRESETS.find((p) => p.id === selectedPresetId) || LIBRARY_PRESETS[0];

  /**
   * Updates state when user selects one of the preset graphs
   */
  const handleSelectPreset = (preset: LibraryPreset) => {
    setSelectedPresetId(preset.id);
    setSourceRepo(preset.repoUrl);
    setBranch(preset.branch);
    setEntryPoint(preset.entryPoint);
    setTargetFramework(preset.targetFramework);
    setTargetPackageName(preset.targetLibraryName);
    setOtherInstructions(preset.otherInstructions);
  };

  /**
   * Appends a suggested directive into the other instructions textarea
   */
  const handleAddDirective = (directive: string) => {
    if (otherInstructions.includes(directive)) return;
    setOtherInstructions((prev) => (prev ? `${prev}\n${directive}` : directive));
  };

  /**
   * Dispatches project loading with step-by-step telemetry feedback
   */
  const handleLaunch = () => {
    setIsAnalyzing(true);
    setAnalysisStep(`Parsing repository AST from ${sourceRepo.replace(/^https?:\/\//, '')}...`);

    setTimeout(() => {
      setAnalysisStep(`Analyzing entry point ${entryPoint} (${activePreset.sourceLanguage} AST Extraction)...`);
    }, 400);

    setTimeout(() => {
      setAnalysisStep(`Configuring target framework '${targetFramework}' (${targetPackageName}) with migration directives...`);
    }, 850);

    setTimeout(() => {
      setAnalysisStep(`Discovered ${activePreset.nodeCount} functions across ${activePreset.depth} topological layers. Constructing Dependency Graph (${executionMode === 'modal' ? 'Modal Parallel Compute' : 'Local Container'})...`);
    }, 1300);

    setTimeout(() => {
      setIsAnalyzing(false);
      // Extract tolerance from otherInstructions if specified in the text field
      const tolMatch = otherInstructions.match(/(?:numerical\s+diff\s+tolerance|tolerance)\s*(?:should\s+be|:|is|=)\s*([0-9eE.-]+)/i);
      const parsedTolerance = tolMatch ? tolMatch[1] : (activePreset.isMathLibrary ? '1e-5' : undefined);

      const configuredProject: ProjectConfig = {
        ...defaultConfig,
        presetId: selectedPresetId,
        repoUrl: sourceRepo.trim() || 'https://github.com/lballabio/QuantLib.git',
        branch: branch.trim() || 'v1.34.0',
        entryPoint: entryPoint.trim() || 'ql/pricingengines/vanilla/analyticeuropeanengine.cpp',
        sourceLanguage: activePreset.sourceLanguage || 'C++',
        targetFramework: targetFramework.trim() || 'pytorch',
        targetLibraryName: targetPackageName.trim() || 'torch_quantlib',
        sourceLibraryName: activePreset.sourceLibraryName || 'QuantLib C++',
        executionMode,
        targetDevice,
        precision,
        numericalTolerance: parsedTolerance,
        otherInstructions: otherInstructions.trim(),
      };

      onLoadProject(configuredProject);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top minimal header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-white">Graph based agentic migration engine</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
              Topological AST Decomposition &bull; Parity Verification &bull; Modal Cloud
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Automated Agentic Transpiler</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-4xl bg-slate-900/85 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur relative">
          
          {/* Header & Prompt Overview */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-800/80 text-sky-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Interactive Graph Ingestion & Agent Directives</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
              Configure Codebase & Migration Parameters
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select a dependency graph scope and customize your migration variables. The agentic engine decomposes upstream call trees, synthesizes topological DAGs, and guarantees mathematical parity.
            </p>
          </div>

          {/* Generalization Notice Callout */}
          <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-sky-900/50 flex items-start gap-3 shadow-inner">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-300 font-mono">
                  Generalized Graph-Based Agentic Migration Engine
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-200 border border-sky-700">
                  Framework Agnostic
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">
                This studio is a generalized migration engine designed to ingest <span className="text-white font-semibold">any arbitrary codebase or language</span> (C/C++, Fortran, Object-Oriented libraries) and transpile it into modern target frameworks (PyTorch, JAX, Python, Triton) with automated topological AST decomposition and differential parity checking.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                The presets below are stored separately and preloaded as <span className="text-amber-300 font-semibold">Demonstration Showcase Examples</span> (using <span className="text-sky-300 font-mono">QuantLib C++ → PyTorch</span>, <span className="text-sky-300 font-mono">nlohmann/json</span>, and <span className="text-sky-300 font-mono">Eigen</span> as representative cases). You can load an example preset or edit the parameters below for any arbitrary repository.
              </p>
            </div>
          </div>

          {/* Example Graphs: Mathematical Simulation & Non-Math System Libraries */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Showcase Reference Examples (Stored Separately):</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Click a showcase preset to load example parameters
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold truncate max-w-[130px]">
                          {preset.category}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                          preset.highlight
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          {preset.badge}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white font-mono mb-1 leading-snug">
                        {preset.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="text-slate-300 font-semibold">{preset.nodeCount} Functions</span>
                      <span className="text-sky-400 font-semibold">{preset.depth} Layers</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User-Configurable Variables Form (Text Inputs Instead of Dropdowns) */}
          <div className="p-5 rounded-xl bg-slate-950/95 border border-slate-800 space-y-4 font-mono text-xs mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-bold text-white">Migration Variables & Parameters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Execution Runtime:</span>
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('local')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                      executionMode === 'local'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-400" /> Local
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('modal')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      executionMode === 'modal'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CloudLightning className="w-3 h-3 text-emerald-300" />
                    <span>Modal Cloud</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Source Repo & Details */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="source-repo-input" className="text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
                  <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Source repo:</span>
                </label>
                <span className="text-[10px] text-slate-500">Git repository containing legacy source code</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-8">
                  <input
                    id="source-repo-input"
                    type="text"
                    value={sourceRepo}
                    onChange={(e) => setSourceRepo(e.target.value)}
                    placeholder="https://github.com/lballabio/QuantLib.git"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    id="source-branch-input"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Branch/Tag (e.g. v1.34.0)"
                    title="Git Branch or Release Tag"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Target Framework & Target Package Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="target-framework-input" className="text-sky-300 font-semibold flex items-center gap-1.5 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Target framework:</span>
                  </label>
                  <span className="text-[10px] text-slate-500">e.g. pytorch, jax, triton</span>
                </div>
                <input
                  id="target-framework-input"
                  type="text"
                  value={targetFramework}
                  onChange={(e) => setTargetFramework(e.target.value)}
                  placeholder="pytorch"
                  className="w-full bg-slate-900 border border-sky-600/80 rounded-lg px-3 py-2 text-xs text-sky-300 font-semibold placeholder-slate-500 focus:outline-none focus:border-sky-400 shadow-sm shadow-sky-950/50"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500">Quick set:</span>
                  {SUGGESTED_FRAMEWORKS.map((fw) => (
                    <button
                      key={fw}
                      type="button"
                      onClick={() => setTargetFramework(fw)}
                      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                        targetFramework.toLowerCase() === fw.toLowerCase()
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="target-package-input" className="text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
                    <Package className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Target package name:</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Exported Python package</span>
                </div>
                <input
                  id="target-package-input"
                  type="text"
                  value={targetPackageName}
                  onChange={(e) => setTargetPackageName(e.target.value)}
                  placeholder="torch_quantlib"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Namespace: <code className="text-indigo-300 font-mono font-bold">{targetPackageName || 'migrated_module'}</code></span>
                  <span>Entry: <code className="text-slate-400 font-mono truncate max-w-[140px]">{entryPoint}</code></span>
                </div>
              </div>
            </div>

            {/* Other Instructions & Migration Directives (Text Field Only) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="other-instructions-input" className="text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Other instructions & migration directives:</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Custom instructions, tolerances, or non-math rules
                </span>
              </div>

              <textarea
                id="other-instructions-input"
                rows={4}
                value={otherInstructions}
                onChange={(e) => setOtherInstructions(e.target.value)}
                placeholder="e.g. numerical diff tolerance should be 1e-5 (for math) OR preserve JSON schema/exception parity (for non-math libraries)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:border-sky-500 resize-y"
              />

              {/* Quick Directive Insertion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 mr-1">
                  <Plus className="w-3 h-3 text-slate-400" /> Directives:
                </span>
                {QUICK_DIRECTIVE_SNIPPETS.map((snippet) => {
                  const isIncluded = otherInstructions.includes(snippet);
                  return (
                    <button
                      key={snippet}
                      type="button"
                      onClick={() => handleAddDirective(snippet)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        isIncluded
                          ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 opacity-60'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {snippet}
                    </button>
                  );
                })}
              </div>
            </div>
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
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-slate-500 hidden sm:block">
              Target: <span className="text-sky-400 font-bold">{targetFramework}</span> &bull; Package: <span className="text-indigo-400 font-bold">{targetPackageName}</span> &bull; Architecture: <span className="text-emerald-400 font-bold">{activePreset.sourceLibraryName} ({activePreset.nodeCount} nodes)</span>
            </div>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Constructing Dependency Graph & Decomposing AST...</span>
                </>
              ) : (
                <>
                  <span>Load {activePreset.nodeCount}-Node Graph & Begin Migration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-500 font-mono">
        Graph based agentic migration engine &bull; Autonomous AI Agent Transpiler &bull; Modal Serverless Cloud Sandbox
      </footer>
    </div>
  );
}
