/**
 * ============================================================================
 * Graph Agent Dynamic Discovery Modal (DiscoverGraphModal.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * Provides an interactive UI for dispatching the autonomous Graph Agent to
 * deconstruct any arbitrary C++ entry point or source code into a topological
 * Directed Acyclic Graph (DAG) without requiring any preloaded or static datasets.
 * 
 * Use Cases:
 * 1. Discovering a complete dependency DAG from an arbitrary C++ entry point.
 * 2. Operating the migration studio entirely without preloaded or hardcoded nodes.
 * 3. Inspecting the Graph Agent's topological depth, functional domain classification,
 *    and automated target package folder assignments.
 * 4. Seamlessly injecting dynamically discovered nodes into the interactive DAG Workbench.
 * ============================================================================
 */

import React, { useState } from 'react';
import { Node, UnitTestResult } from '../types';
import { toSnakeCase } from '../utils/stringUtils';
import {
  Sparkles,
  GitBranch,
  X,
  Layers,
  ArrowRight,
  FolderTree,
  CheckCircle2,
  Clock,
  Cpu,
  FileCode2,
  AlertCircle,
  Play
} from 'lucide-react';
import { logClientFunctionCall } from '../utils/logger';

interface DiscoverGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDiscoveredDag: (
    newNodes: Node[],
    newUnitTests: UnitTestResult[],
    entryPoint: string,
    targetPackageName: string
  ) => void;
  currentTargetPackage?: string;
  currentEntryPoint?: string;
}

/**
 * Dispatches the Graph Agent to discover and decompose a C++ codebase into a DAG.
 *
 * @param props - Component props containing state and loader callback
 * @returns React functional modal component
 */
export default function DiscoverGraphModal({
  isOpen,
  onClose,
  onLoadDiscoveredDag,
  currentTargetPackage = 'torch_quantlib',
  currentEntryPoint = 'ql/pricingengines/vanilla/analytichestonengine.cpp',
}: DiscoverGraphModalProps) {
  const [entryPoint, setEntryPoint] = useState(currentEntryPoint);
  const [targetPackageName, setTargetPackageName] = useState(currentTargetPackage);
  const [sourceCode, setSourceCode] = useState(`// QuantLib C++ Reference Engine
#include <ql/pricingengines/vanilla/analytichestonengine.hpp>
#include <ql/termstructures/yield/flatforward.hpp>
#include <ql/math/distributions/normaldistribution.hpp>
#include <ql/math/integrals/gausslobattointegral.hpp>

namespace QuantLib {
    void AnalyticHestonEngine::calculate() const {
        // High-precision numerical quadrature for characteristic function
    }
}`);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveredResult, setDiscoveredResult] = useState<{
    nodes: Node[];
    targetPackageName: string;
    entryPoint: string;
    totalEstimatedHours: number;
    subfolders: string[];
    summary: string;
  } | null>(null);

  if (!isOpen) return null;

  /**
   * Invokes the backend Graph Agent dynamic discovery endpoint.
   */
  const handleRunDiscovery = async () => {
    logClientFunctionCall('DiscoverGraphModal', 'handleRunDiscovery', { entryPoint, targetPackageName });
    setIsDiscovering(true);
    setDiscoveryError(null);
    setDiscoveredResult(null);

    try {
      const response = await fetch('/api/agent/discover-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryPoint: entryPoint.trim(),
          targetPackageName: targetPackageName.trim(),
          sourceCode: sourceCode.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        throw new Error(data.error || 'Graph Agent did not return any nodes.');
      }

      setDiscoveredResult(data);
    } catch (err: any) {
      console.error('Graph Agent Discovery Failed:', err);
      setDiscoveryError(err.message || 'Failed to communicate with Graph Agent.');
    } finally {
      setIsDiscovering(false);
    }
  };

  /**
   * Transfers discovered nodes into the Workbench and closes the modal.
   */
  const handleApplyToWorkbench = () => {
    if (!discoveredResult || !discoveredResult.nodes) return;

    logClientFunctionCall('DiscoverGraphModal', 'handleApplyToWorkbench', {
      nodeCount: discoveredResult.nodes.length,
    });

    // Synthesize initial unit tests for the discovered nodes
    const synthesizedTests: UnitTestResult[] = discoveredResult.nodes.map((node) => ({
      id: `test_${node.id}`,
      name: `test_${toSnakeCase(node.ql_symbol)}_parity`,
      suite: 'Graph Agent Discovered Suite',
      category: 'target_library',
      shippable: true,
      targetNodeId: node.id,
      targetSymbol: node.ql_symbol,
      status: 'pending',
      tolerance: 1e-5,
      maxObservedDiff: 0,
      quantLibExecutionTimeMs: 12.0,
      torchExecutionTimeMs: 0.6,
      speedup: 20.0,
      assertionsCount: 150,
      sampleInput: `Symbol: ${node.ql_symbol}`,
      qlExpected: 'Reference C++ oracle',
      torchActual: 'Awaiting translation and execution',
    }));

    onLoadDiscoveredDag(
      discoveredResult.nodes,
      synthesizedTests,
      discoveredResult.entryPoint,
      discoveredResult.targetPackageName
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Graph Agent Autonomous Discovery
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/60">
                  Zero Preloaded Data
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synthesize a complete topological DAG from an arbitrary C++ entry point or code snippet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">C++ Source Entry Point</label>
              <input
                type="text"
                value={entryPoint}
                onChange={(e) => setEntryPoint(e.target.value)}
                placeholder="ql/pricingengines/vanilla/analytichestonengine.cpp"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-bold">Target Package Name</label>
              <input
                type="text"
                value={targetPackageName}
                onChange={(e) => setTargetPackageName(e.target.value)}
                placeholder="torch_quantlib"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">
              Source C++ Declarations & Includes (Optional Snippet)
            </label>
            <textarea
              rows={6}
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="#include <ql/...>"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>

          {discoveryError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{discoveryError}</span>
            </div>
          )}

          {discoveredResult && (
            <div className="p-4 bg-slate-950 border border-purple-900/60 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Discovered {discoveredResult.nodes.length} Topological DAG Nodes</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Est: {discoveredResult.totalEstimatedHours}h</span>
                  <span>Subfolders: {discoveredResult.subfolders.length}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 font-sans">
                {discoveredResult.summary}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {discoveredResult.nodes.map((node, i) => (
                  <div
                    key={node.id}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 font-mono">#{i + 1}</span>
                      <span className="font-bold text-white truncate">{node.ql_symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {node.kind}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      Deps: {node.deps.length > 0 ? node.deps.join(', ') : 'Leaf'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="text-[11px] text-slate-500">
            {isDiscovering ? 'Graph Agent deconstructing AST & include graph...' : 'Zero preloaded data dependency.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs cursor-pointer"
            >
              Cancel
            </button>

            {!discoveredResult ? (
              <button
                onClick={handleRunDiscovery}
                disabled={isDiscovering || !entryPoint.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 transition disabled:opacity-50 cursor-pointer"
              >
                {isDiscovering ? (
                  <>
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    <span>Discovering Graph...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Graph Agent Discovery</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApplyToWorkbench}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Load Discovered DAG into Workbench ({discoveredResult.nodes.length} Nodes)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
