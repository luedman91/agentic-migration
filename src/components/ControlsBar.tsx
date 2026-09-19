import { useState, useEffect } from 'react';
import { MigrationConfig, MigrationTrigger, Node, ProjectConfig } from '../types';
import { fetchModalStatus, ModalStatusInfo } from '../utils/modalClient';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Clock,
  Settings2,
  Cpu,
  Flame,
  X,
  Package,
  FolderGit2,
  ChevronRight,
  Download,
  Layers,
  Sparkles,
  CloudLightning,
  Monitor,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';

interface ControlsBarProps {
  nodes: Node[];
  config: MigrationConfig;
  onChangeConfig: (newConfig: Partial<MigrationConfig>) => void;
  isRunning: boolean;
  isPaused: boolean;
  onStartMigration: () => void;
  onPauseMigration: () => void;
  onResumeMigration: () => void;
  onStepNextNode: () => void;
  onResetMigration: () => void;
  activeNode: Node | null;
  scheduledCountdown: number | null;
  onCancelScheduled: () => void;
  migratedFilesCount: number;
  onOpenFilesDrawer: () => void;
  onSwitchRepository: () => void;
  projectConfig?: ProjectConfig;
  onOpenBuildingBlocks?: () => void;
  buildingBlocksCount?: number;
}

export default function ControlsBar({
  nodes,
  config,
  onChangeConfig,
  isRunning,
  isPaused,
  onStartMigration,
  onPauseMigration,
  onResumeMigration,
  onStepNextNode,
  onResetMigration,
  activeNode,
  scheduledCountdown,
  onCancelScheduled,
  migratedFilesCount,
  onOpenFilesDrawer,
  onSwitchRepository,
  projectConfig,
  onOpenBuildingBlocks,
  buildingBlocksCount = 17,
}: ControlsBarProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatusInfo | null>(null);
  const [isCheckingModal, setIsCheckingModal] = useState(false);

  // Probe modal status when settings modal is opened
  useEffect(() => {
    if (showConfigModal && !modalStatus && !isCheckingModal) {
      handleTestModal();
    }
  }, [showConfigModal]);

  const handleTestModal = async () => {
    setIsCheckingModal(true);
    try {
      const res = await fetchModalStatus();
      setModalStatus(res);
    } catch {
      // Ignored
    } finally {
      setIsCheckingModal(false);
    }
  };

  // Compute node statistics
  const total = nodes.length;
  const testedCount = nodes.filter((n) => n.status === 'tested').length;
  const translatedCount = nodes.filter((n) => n.status === 'translated').length;
  const mappedCount = nodes.filter((n) => n.status === 'mapped').length;
  const skippedCount = nodes.filter((n) => n.status === 'skipped').length;
  const todoCount = nodes.filter((n) => n.status === 'todo').length;

  const completedCount = testedCount + skippedCount;
  const progressPercent = Math.round((completedCount / total) * 100);

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 sticky top-0 z-30 shadow-xl backdrop-blur">
      {/* Scheduled start countdown banner */}
      {scheduledCountdown !== null && (
        <div className="mb-2.5 p-2 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 rounded-lg flex items-center justify-between text-xs text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Migration Scheduled:</strong> Starting automatically in{' '}
              <span className="font-mono font-bold text-amber-300 text-sm">{scheduledCountdown}s</span>...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onStartMigration}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-xs transition-colors cursor-pointer"
            >
              Start Immediately
            </button>
            <button
              onClick={onCancelScheduled}
              className="p-1 hover:bg-amber-900/60 rounded text-amber-400 hover:text-white cursor-pointer"
              title="Cancel Scheduled Start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5 min-h-[40px]">
        {/* Left Side: Primary Execution Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Start / Pause / Resume Button (Default Agentic Migration) */}
          {!isRunning ? (
            <button
              onClick={onStartMigration}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30"
              title="Launch autonomous Agentic Migration across the Mathematical DAG"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 fill-emerald-400/20" />
              <span>Start Agentic Migration</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResumeMigration}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-xs flex items-center gap-2 shadow-lg shadow-amber-950/60 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Resume Agentic Migration</span>
            </button>
          ) : (
            <button
              onClick={onPauseMigration}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {/* Step Next Node */}
          <button
            onClick={onStepNextNode}
            disabled={isRunning && !isPaused}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Translate & test next unmigrated node in DAG topological order"
          >
            <StepForward className="w-3.5 h-3.5 text-sky-400" />
            <span>Step Node</span>
          </button>

          {/* Reset Pipeline & Clean Files */}
          <button
            onClick={onResetMigration}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 hover:border-rose-800/60 transition-colors cursor-pointer"
            title="Reset DAG state to unmigrated baseline and delete generated library files"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset & Clean</span>
          </button>

          {/* Trigger Mode Selector ("When to start") */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Trigger:
            </span>
            <select
              value={config.trigger}
              onChange={(e) => onChangeConfig({ trigger: e.target.value as MigrationTrigger })}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-xs cursor-pointer"
            >
              <option value="manual" className="bg-slate-900">Manual Start</option>
              <option value="on_dependency" className="bg-slate-900">Auto on Dependency Ready</option>
              <option value="scheduled" className="bg-slate-900">Scheduled (Timer)</option>
              <option value="continuous" className="bg-slate-900">Continuous Auto-Pilot</option>
            </select>
          </div>

          {/* Execution Mode Slider: Run locally vs Modal */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onChangeConfig({ executionMode: 'local' })}
              className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                (config.executionMode || 'local') === 'local'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Execute migration and unit test suite in local container sandbox"
            >
              <Monitor className="w-3 h-3 text-slate-400" />
              <span>Run locally</span>
            </button>
            <button
              onClick={() => onChangeConfig({ executionMode: 'modal' })}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                config.executionMode === 'modal'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dispatch parallel compilation, GPU parity tests, and autograd across Modal serverless cloud workers"
            >
              <CloudLightning className="w-3 h-3 text-emerald-300" />
              <span>Modal</span>
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Speed:
            </span>
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeConfig({ speedMultiplier: spd })}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  config.speedMultiplier === spd
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Migrated Files Explorer Button */}
          <button
            onClick={onOpenFilesDrawer}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Preview files, folder structure, getting-started guide, and download .zip repo"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Files & Guide</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
              {migratedFilesCount}
            </span>
            <Download className="w-3 h-3 text-sky-400 ml-0.5" />
          </button>

          {/* Core Building Blocks / Symbol Registry Button */}
          {onOpenBuildingBlocks && (
            <button
              onClick={onOpenBuildingBlocks}
              className="px-2.5 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-indigo-700/60 transition-colors cursor-pointer"
              title="Inspect and edit deterministic type and math building blocks"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Building Blocks</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900 text-indigo-300 border border-indigo-700 font-bold">
                {buildingBlocksCount}
              </span>
            </button>
          )}

          {/* Switch Codebase / Archetype Preset Trigger */}
          <button
            onClick={onSwitchRepository}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Switch codebase archetype or reload preset (Ultra-Deep 150-Node DAG, Distributed Pipeline, Heston, etc.)"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Archetype:</span>
            <span className="text-sky-300 font-semibold truncate max-w-[120px]">
              {nodes.length >= 100
                ? 'Ultra-Deep (150)'
                : nodes.length >= 25
                ? 'Distributed (28)'
                : nodes.length === 18
                ? 'Heston (18)'
                : 'European (16)'}
            </span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showConfigModal
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Configure migration triggers & target hardware"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Migration Progress & Active Node Badge - Rock-solid stable layout, zero layout shifts */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Stable Active Node Pill: strictly fixed width & height so it NEVER pushes sibling labels or wraps */}
          <div className="w-48 sm:w-56 h-7 shrink-0 flex items-center">
            {isRunning && activeNode ? (
              <div
                className="w-full h-full flex items-center gap-1.5 px-2.5 bg-sky-950/80 border border-sky-500/40 rounded-lg text-xs font-mono text-sky-300 shadow-sm overflow-hidden"
                title={`Translating symbol: ${activeNode.ql_symbol}`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0"></span>
                <span className="text-[10px] uppercase font-bold text-sky-400 shrink-0">Translating:</span>
                <span className="truncate text-sky-200 font-medium">{activeNode.ql_symbol}</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center gap-1.5 px-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs font-mono text-slate-500 overflow-hidden">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isPaused ? 'bg-amber-400' : isRunning ? 'bg-sky-400 animate-ping' : 'bg-slate-600'
                  }`}
                ></span>
                <span className="truncate text-[11px] text-slate-400">
                  {isPaused
                    ? 'Migration Paused'
                    : isRunning
                    ? 'Selecting AST node...'
                    : completedCount === total
                    ? 'DAG Migrated (100%)'
                    : 'Pipeline Idle'}
                </span>
              </div>
            )}
          </div>

          {/* Status Breakdown Pills with tabular-nums and fixed minimum widths to prevent digit shifts */}
          <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
            <span
              className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 tabular-nums min-w-[62px] text-center"
              title="Tested & verified"
            >
              Tested: {testedCount}
            </span>
            <span
              className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 tabular-nums min-w-[58px] text-center"
              title="Transpiled to PyTorch"
            >
              Trans: {translatedCount}
            </span>
            <span
              className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60 tabular-nums min-w-[64px] text-center"
              title="AST mapped"
            >
              Mapped: {mappedCount}
            </span>
            <span
              className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 tabular-nums min-w-[52px] text-center"
              title="Pending translation"
            >
              Todo: {todoCount}
            </span>
          </div>

          {/* Overall Progress Bar with shrink-0 and tabular-nums */}
          <div className="w-24 sm:w-28 flex flex-col gap-1 shrink-0">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>MIGRATED</span>
              <span className="text-slate-200 font-semibold tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Migration Settings Modal / Popover */}
      {showConfigModal && (
        <div className="mt-3 p-4 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Settings2 className="w-4 h-4 text-sky-400" />
              <span>Migration Execution Controls & Scheduler Configuration</span>
            </div>
            <button
              onClick={() => setShowConfigModal(false)}
              className="text-slate-400 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* When to Start Migration Settings */}
            <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="font-semibold text-sky-400 uppercase text-[11px] tracking-wider block">
                1. When to Start Migration
              </span>
              <p className="text-slate-400 text-[11px]">
                Define automatic or trigger-based rules for initializing the migration pipeline.
              </p>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="triggerMode"
                    checked={config.trigger === 'manual'}
                    onChange={() => onChangeConfig({ trigger: 'manual' })}
                    className="accent-sky-500"
                  />
                  <span>Manual (Only start when Start button is pressed)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="triggerMode"
                    checked={config.trigger === 'on_dependency'}
                    onChange={() => onChangeConfig({ trigger: 'on_dependency' })}
                    className="accent-sky-500"
                  />
                  <span>Auto-start on Dependency Ready (DAG cascade)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="triggerMode"
                    checked={config.trigger === 'scheduled'}
                    onChange={() => onChangeConfig({ trigger: 'scheduled' })}
                    className="accent-sky-500"
                  />
                  <span>Scheduled countdown timer:</span>
                </label>
                {config.trigger === 'scheduled' && (
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-slate-400">Delay:</span>
                    {[5, 10, 30].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => onChangeConfig({ scheduledDelaySeconds: sec })}
                        className={`px-2 py-1 rounded font-mono cursor-pointer ${
                          config.scheduledDelaySeconds === sec
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test & Oracle Automation */}
            <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="font-semibold text-emerald-400 uppercase text-[11px] tracking-wider block">
                2. Automated Verification & Oracle
              </span>
              <p className="text-slate-400 text-[11px]">
                Validate translated tensors against the source library oracle implementation immediately.
              </p>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.autoTestAfterTranslate}
                    onChange={(e) => onChangeConfig({ autoTestAfterTranslate: e.target.checked })}
                    className="accent-emerald-500"
                  />
                  <span>Auto-run unit test suite upon node translation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.stopOnFailure}
                    onChange={(e) => onChangeConfig({ stopOnFailure: e.target.checked })}
                    className="accent-rose-500"
                  />
                  <span>Halt pipeline if unit test numerical tolerance fails</span>
                </label>
              </div>
            </div>

            {/* Hardware Acceleration Target */}
            <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="font-semibold text-indigo-400 uppercase text-[11px] tracking-wider block">
                3. Execution Device & Compute Backend
              </span>
              <p className="text-slate-400 text-[11px]">
                Target device placement for vectorized kernels and parallel execution environment.
              </p>
              
              {/* Execution backend slider */}
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 mb-2">
                <span className="text-xs text-slate-300 font-mono flex-1">Compute Backend:</span>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ executionMode: 'local' })}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                    (config.executionMode || 'local') === 'local'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Run locally</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ executionMode: 'modal' })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    config.executionMode === 'modal'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border border-emerald-400/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CloudLightning className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Modal Cloud</span>
                </button>
              </div>

              {/* Modal Cloud Diagnostics & Credit Explanation */}
              {config.executionMode === 'modal' && (
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-200 font-mono text-[11px] font-semibold">
                      <CloudLightning className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Modal Serverless Worker Status</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestModal}
                      disabled={isCheckingModal}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingModal ? 'animate-spin' : ''}`} />
                      <span>{isCheckingModal ? 'Pinging...' : 'Test Connection'}</span>
                    </button>
                  </div>

                  {modalStatus ? (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {modalStatus.isLive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className={modalStatus.isLive ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                          {modalStatus.isLive
                            ? 'Live Cloud Worker Active (Credits will be deducted from your Modal account)'
                            : 'Local Distributed Sandbox Active (0 Modal credits deducted)'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed pl-5 font-mono">
                        {modalStatus.message}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[10px] font-mono">
                      Checking status of remote Modal cloud worker...
                    </p>
                  )}

                  <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                    <div className="flex items-start gap-1">
                      <Info className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-300 font-semibold">Why aren't Modal credits deducted?</span>
                        <p className="text-slate-400 mt-0.5">
                          When the target webhook URL returns 404 (i.e. <code className="text-sky-300">modal_worker.py</code> hasn't been deployed to your Modal account yet), the app safely uses its built-in local distributed runner so migrations never fail. To bill against your live Modal compute credits:
                        </p>
                        <ol className="list-decimal list-inside text-slate-400 font-mono text-[9px] mt-1 space-y-0.5 pl-1">
                          <li>Run <span className="text-emerald-300">modal deploy modal_worker.py</span> in your terminal</li>
                          <li>Copy your generated Modal web endpoint URL</li>
                          <li>Set <span className="text-amber-300">MODAL_WEBHOOK_URL</span> in your environment secrets</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {(['cuda', 'cpu', 'mps'] as const).map((dev) => (
                  <button
                    key={dev}
                    onClick={() => onChangeConfig({ targetDevice: dev })}
                    className={`flex-1 py-1.5 px-2 rounded font-mono uppercase text-center border transition-colors cursor-pointer ${
                      config.targetDevice === dev
                        ? 'bg-indigo-600 text-white border-indigo-400 font-semibold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {dev === 'cuda' ? 'NVIDIA CUDA' : dev === 'cpu' ? 'CPU AVX-512' : 'Apple MPS'}
                  </button>
                ))}
              </div>
            </div>

            {/* Hybrid Agent Engine */}
            <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="font-semibold text-emerald-400 uppercase text-[11px] tracking-wider block">
                4. Agent Architecture
              </span>
              <p className="text-slate-400 text-[11px]">
                Toggle between fast deterministic mock compiler and real Gemini 3.8 Flash hybrid AI agent.
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={config.useAgentEngine ?? true}
                  onChange={(e) => onChangeConfig({ useAgentEngine: e.target.checked })}
                  className="accent-emerald-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Enable Gemini 3.8 Flash Hybrid Agent (Schema-grounded with Pydantic)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowConfigModal(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs transition-colors cursor-pointer"
            >
              Done & Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
