import { useState } from 'react';
import { Node, NodeStatus, UnitTestResult } from '../types';
import { areSymbolsEquivalent } from '../config/appConfig';
import {
  X,
  Code2,
  GitCommit,
  FlaskConical,
  Copy,
  Check,
  Play,
  ArrowRight,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface NodeDetailPanelProps {
  node: Node;
  allNodes: Node[];
  unitTests: UnitTestResult[];
  onClose: () => void;
  onUpdateStatus: (nodeId: string, newStatus: NodeStatus) => void;
  onMigrateSingleNode: (node: Node) => void;
  onMigrateWithAgent?: (node: Node) => void;
  onRunTestForNode: (symbol: string) => void;
  onSelectNode: (node: Node) => void;
}

export default function NodeDetailPanel({
  node,
  allNodes,
  unitTests,
  onClose,
  onUpdateStatus,
  onMigrateSingleNode,
  onMigrateWithAgent,
  onRunTestForNode,
  onSelectNode,
}: NodeDetailPanelProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'both' | 'python' | 'cpp'>('both');
  const [copiedCpp, setCopiedCpp] = useState(false);
  const [copiedPy, setCopiedPy] = useState(false);

  // Upstream dependencies (nodes this node depends on)
  const upstreamNodes = allNodes.filter((n) => node.deps.includes(n.id));

  // Downstream dependents (nodes that depend on this node)
  const downstreamNodes = allNodes.filter((n) => n.deps.includes(node.id));

  // Unit & integration tests associated with this node
  const nodeTests = unitTests.filter(
    (t) =>
      t.targetNodeId === node.id ||
      areSymbolsEquivalent(t.targetSymbol, node.ql_symbol) ||
      t.integrationModules?.some((m) => areSymbolsEquivalent(m, node.ql_symbol))
  );

  const copyCode = (text: string, type: 'cpp' | 'python') => {
    navigator.clipboard.writeText(text);
    if (type === 'cpp') {
      setCopiedCpp(true);
      setTimeout(() => setCopiedCpp(false), 2000);
    } else {
      setCopiedPy(true);
      setTimeout(() => setCopiedPy(false), 2000);
    }
  };

  const getStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'tested':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
            TESTED (ORACLE VERIFIED)
          </span>
        );
      case 'translated':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-950 text-amber-300 border border-amber-800">
            TRANSLATED
          </span>
        );
      case 'mapped':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-sky-950 text-sky-300 border border-sky-800">
            AST MAPPED
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
            SKIPPED
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800">
            FAILED
          </span>
        );
      case 'todo':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-900 text-slate-400 border border-slate-800">
            TODO (PENDING)
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 overflow-y-auto w-full md:w-96 text-xs text-slate-300 font-sans shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white font-mono tracking-tight">
                {node.ql_symbol}
              </h2>
              {getStatusBadge(node.status)}
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-1 break-all">{node.path}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => onMigrateSingleNode(node)}
            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Migrate</span>
          </button>
          {onMigrateWithAgent && (
            <button
              onClick={() => onMigrateWithAgent(node)}
              className="py-1.5 px-2.5 bg-gradient-to-r from-emerald-900 to-indigo-900 hover:from-emerald-800 hover:to-indigo-800 text-emerald-200 border border-emerald-500/40 rounded font-medium text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              title="Execute full Agentic AI porting with Gemini 3.8 Flash using Building Blocks"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Agent</span>
            </button>
          )}
          {nodeTests.length > 0 && (
            <button
              onClick={() => onRunTestForNode(node.ql_symbol)}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
              <span>Run Test</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
          <div>
            <span className="text-slate-500 block">KIND:</span>
            <span className="text-cyan-400 font-semibold">{node.kind}</span>
          </div>
          <div>
            <span className="text-slate-500 block">STATUS:</span>
            <select
              value={node.status}
              onChange={(e) => onUpdateStatus(node.id, e.target.value as NodeStatus)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
            >
              <option value="todo">todo</option>
              <option value="mapped">mapped</option>
              <option value="translated">translated</option>
              <option value="tested">tested</option>
              <option value="skipped">skipped</option>
              <option value="failed">failed</option>
            </select>
          </div>
          <div>
            <span className="text-slate-500 block">COMPLEXITY:</span>
            <span className="text-slate-300 capitalize">{node.complexity || 'medium'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">EST. EFFORT:</span>
            <span className="text-slate-300">{node.estimatedHours || 4} hours</span>
          </div>
        </div>

        {/* Translation Notes */}
        <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Translation Strategy & Notes
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">{node.note}</p>
        </div>

        {/* Dependencies & Dependents */}
        <div className="space-y-3">
          {/* Upstream */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
              Prerequisite Dependencies ({upstreamNodes.length})
            </span>
            {upstreamNodes.length === 0 ? (
              <p className="text-slate-500 text-[11px] italic">Root node (no upstream dependencies)</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {upstreamNodes.map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => onSelectNode(dep)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{dep.ql_symbol}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dep.status === 'tested'
                          ? 'bg-emerald-400'
                          : dep.status === 'translated'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Downstream */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
              Downstream Consumers ({downstreamNodes.length})
            </span>
            {downstreamNodes.length === 0 ? (
              <p className="text-slate-500 text-[11px] italic">Terminal node (end of numeric cone)</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {downstreamNodes.map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => onSelectNode(dep)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{dep.ql_symbol}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Associated Unit & Integration Tests */}
        {nodeTests.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Associated Tests ({nodeTests.length})
            </span>
            {nodeTests.map((t) => (
              <div
                key={t.id}
                className="p-2 bg-slate-900 rounded border border-slate-800 space-y-1 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                        t.category === 'integration'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                          : t.category === 'target_library'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                      }`}
                    >
                      {t.category === 'integration'
                        ? 'INTEG'
                        : t.category === 'target_library'
                        ? 'UNIT'
                        : 'ORACLE'}
                    </span>
                    <span className="font-semibold text-slate-200 truncate">{t.name}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                      t.status === 'passed'
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-400 flex justify-between text-[10px]">
                  <span>Max diff: {t.maxObservedDiff ? t.maxObservedDiff.toExponential(2) : 'N/A'}</span>
                  <span>Tol: {t.tolerance.toExponential()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Code Comparison C++ vs PyTorch */}
        {node.code && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-sky-400" /> Source & Target Implementation
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCodeTab('both')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    activeCodeTab === 'both' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  Both
                </button>
                <button
                  onClick={() => setActiveCodeTab('cpp')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    activeCodeTab === 'cpp' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  C++
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    activeCodeTab === 'python' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  Torch
                </button>
              </div>
            </div>

            {/* Source Code Box */}
            {(activeCodeTab === 'both' || activeCodeTab === 'cpp') && (
              <div className="relative bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="p-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Source Kernel Reference</span>
                  <button
                    onClick={() => copyCode(node.code!.cpp, 'cpp')}
                    className="p-1 hover:text-white"
                    title="Copy Source"
                  >
                    {copiedCpp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {node.code.cpp}
                </pre>
              </div>
            )}

            {/* Target Code Box */}
            {(activeCodeTab === 'both' || activeCodeTab === 'python') && (
              <div className="relative bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="p-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                  <span>Target Vectorized Module</span>
                  <button
                    onClick={() => copyCode(node.code!.python, 'python')}
                    className="p-1 hover:text-white"
                    title="Copy Target"
                  >
                    {copiedPy ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="p-2.5 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {node.code.python}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
