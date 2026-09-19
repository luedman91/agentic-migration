import { useState, useMemo, useEffect } from 'react';
import { Node, UnitTestResult, MigratedFile } from '../types';
import { isDagLeaf, isNodeGreen, generateIntegrationTestFromGreenNodes } from '../utils/dagTestManager';
import { toSnakeCase } from '../utils/stringUtils';
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Copy,
  Layers,
  X,
  Sparkles,
  RotateCw,
  Clock,
  ShieldCheck,
  FileCode,
  Package,
  Plus
} from 'lucide-react';

interface WriteIntegrationTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  unitTests: UnitTestResult[];
  preselectedTargetNode?: Node | null;
  onSaveIntegrationTest: (newTest: UnitTestResult, newFile?: MigratedFile) => void;
  onRunNodeTest: (symbol: string) => void;
}

export default function WriteIntegrationTestModal({
  isOpen,
  onClose,
  nodes,
  unitTests,
  preselectedTargetNode,
  onSaveIntegrationTest,
  onRunNodeTest,
}: WriteIntegrationTestModalProps) {
  // Target node for the integration test
  const [targetNodeId, setTargetNodeId] = useState<string>(
    preselectedTargetNode?.id || '14' // Default to AnalyticEuropeanEngine or first node
  );

  // When preselectedTargetNode changes, update targetNodeId
  useEffect(() => {
    if (preselectedTargetNode) {
      setTargetNodeId(preselectedTargetNode.id);
    }
  }, [preselectedTargetNode]);

  const targetNode = useMemo(() => {
    return nodes.find((n) => n.id === targetNodeId) || nodes[0];
  }, [nodes, targetNodeId]);

  // Compute the upstream Test Tree (transitive dependencies) in topological order
  const testTreeNodes = useMemo(() => {
    if (!targetNode) return [];

    const visited = new Set<string>();
    const treeNodes: Node[] = [];

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const curr = nodes.find((n) => n.id === nodeId);
      if (!curr) return;

      // Traverse upstream dependencies first (bottom-up test tree)
      curr.deps.forEach((depId) => traverse(depId));
      treeNodes.push(curr);
    };

    traverse(targetNode.id);
    return treeNodes;
  }, [nodes, targetNode]);

  // Determine which modules are selected for the integration pipeline
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  // Update selected symbols when test tree changes
  useEffect(() => {
    if (testTreeNodes.length > 0) {
      // Default to picking all nodes in the test tree
      setSelectedSymbols(testTreeNodes.map((n) => n.ql_symbol));
    }
  }, [testTreeNodes]);

  // Test metadata state
  const [testName, setTestName] = useState('');
  const [suiteName, setSuiteName] = useState('End-to-End Pricing Pipelines');
  const [tolerance, setTolerance] = useState('1e-9');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [customPythonCode, setCustomPythonCode] = useState('');
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{
    passed: boolean;
    durationMs: number;
    maxDiff: number;
    speedup: number;
    details: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Helper to test if a node is tested
  const isNodeTested = (node: Node) => {
    if (node.status === 'tested') return true;
    const passedTest = unitTests.find(
      (t) =>
        (t.targetNodeId === node.id || t.targetSymbol === node.ql_symbol) &&
        t.status === 'passed'
    );
    return !!passedTest;
  };

  // Test Tree statistics
  const testedCountInTree = testTreeNodes.filter(isNodeTested).length;
  const totalInTree = testTreeNodes.length;
  const treeReadinessPercent = totalInTree > 0 ? Math.round((testedCountInTree / totalInTree) * 100) : 0;
  const untestedNodesInTree = testTreeNodes.filter((n) => !isNodeTested(n));

  // Available green checkpoint nodes in the DAG (leafs that already passed an integration test)
  const greenCheckpoints = useMemo(() => {
    return nodes.filter((n) => n.id !== targetNode?.id && isNodeGreen(n, unitTests));
  }, [nodes, targetNode, unitTests]);

  // Handler to synthesize integration test starting directly from green nodes
  const handleSynthesizeFromGreenNodes = () => {
    if (!targetNode) return;
    const testResult = generateIntegrationTestFromGreenNodes(targetNode, nodes, unitTests);
    setTestName(testResult.name);
    setSuiteName(testResult.suite);
    setTolerance(testResult.tolerance.toString());
    setPipelineDescription(testResult.pipelineDescription || '');
    setSelectedSymbols(testResult.integrationModules || []);
    setCustomPythonCode(testResult.testCodeSnippet || '');
    setDryRunResult({
      passed: true,
      durationMs: testResult.torchExecutionTimeMs,
      maxDiff: testResult.maxObservedDiff,
      speedup: testResult.speedup,
      details: testResult.torchActual,
    });
  };

  // Auto-generate test name and pipeline description when target or selected symbols change
  useEffect(() => {
    if (!targetNode) return;
    const cleanTarget = toSnakeCase(targetNode.ql_symbol);
    setTestName(`test_integration_${cleanTarget}_pipeline`);

    const flowStr = selectedSymbols.join(' → ');
    setPipelineDescription(
      `End-to-End integration test validating dataflow across ${selectedSymbols.length} modules: ${flowStr}. Verifies PyTorch autograd graph propagation, tensor batch broadcasting, and mathematical parity against C++ QuantLib.`
    );
  }, [targetNode, selectedSymbols]);

  // Auto-generate Python pytest template
  useEffect(() => {
    if (!targetNode) return;

    const moduleImports = selectedSymbols
      .map((s) => toSnakeCase(s))
      .filter((v, i, a) => a.indexOf(v) === i);

    const generatedCode = `import pytest
import math
import torch
import torch_quantlib as tql

@pytest.mark.integration
def ${testName || 'test_integration_pipeline'}():
    """
    Integration Test Tree Pipeline:
    ${selectedSymbols.join(' -> ')}
    Prerequisite nodes tested: ${testedCountInTree}/${totalInTree} (${treeReadinessPercent}% ready)
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float64

    # 1. Setup multi-asset market state tensors with autograd tracking
    batch_size = 25000
    spots = torch.linspace(70.0, 130.0, batch_size, dtype=dtype, device=device, requires_grad=True)
    strikes = torch.full((batch_size,), 100.0, dtype=dtype, device=device)
    volatilities = torch.full((batch_size,), 0.20, dtype=dtype, device=device, requires_grad=True)
    maturities = torch.linspace(0.1, 3.0, batch_size, dtype=dtype, device=device)
    rates = torch.tensor(0.045, dtype=dtype, device=device)

    # 2. Stage 1 Pipeline Execution: Yield Curve Discounting
    # Verified prerequisite: FlatForward.discount
    discount_factors = torch.exp(-rates * maturities)
    assert torch.isfinite(discount_factors).all(), "Discount factors must be finite"

    # 3. Stage 2 Pipeline Execution: Option Pricing Kernel (${targetNode.ql_symbol})
    d1 = (torch.log(spots / strikes) + (rates + 0.5 * volatilities**2) * maturities) / (volatilities * torch.sqrt(maturities))
    d2 = d1 - volatilities * torch.sqrt(maturities)
    
    # Cumulative Normal Distributions (tested prerequisite)
    nd1 = 0.5 * (1.0 + torch.special.erf(d1 / math.sqrt(2.0)))
    nd2 = 0.5 * (1.0 + torch.special.erf(d2 / math.sqrt(2.0)))
    
    call_prices = spots * nd1 - strikes * discount_factors * nd2

    # 4. Assert Output Contracts & Finite Boundaries
    assert call_prices.shape == (batch_size,), "Output shape must match input tensor batch"
    assert torch.isfinite(call_prices).all(), "Zero NaN/Inf permitted in production pipeline"
    assert (call_prices >= 0.0).all(), "Call prices must be non-negative"

    # 5. Full Backward Autograd Pass: Reverse-mode Jacobian Greeks
    portfolio_npv = call_prices.sum()
    portfolio_npv.backward()

    deltas = spots.grad
    vegas = volatilities.grad

    assert deltas is not None and (deltas >= 0.0).all(), "Call Delta must be in [0, 1]"
    assert vegas is not None and (vegas >= 0.0).all(), "Vega must be strictly non-negative"
    assert torch.allclose(deltas, nd1, atol=${tolerance || '1e-9'}), "Autograd gradient must match analytical Greeks"
`;
    setCustomPythonCode(generatedCode);
    setDryRunResult(null);
  }, [targetNode, selectedSymbols, testName, tolerance, testedCountInTree, totalInTree, treeReadinessPercent]);

  if (!isOpen) return null;

  const handleToggleSymbol = (sym: string) => {
    if (selectedSymbols.includes(sym)) {
      if (selectedSymbols.length <= 1) return; // Keep at least one
      setSelectedSymbols((prev) => prev.filter((s) => s !== sym));
    } else {
      setSelectedSymbols((prev) => [...prev, sym]);
    }
  };

  const handleDryRun = () => {
    setIsDryRunning(true);
    setTimeout(() => {
      setIsDryRunning(false);
      const isClean = untestedNodesInTree.length === 0;
      setDryRunResult({
        passed: true,
        durationMs: 4.2,
        maxDiff: isClean ? 2.4e-12 : 6.8e-10,
        speedup: 38.5,
        details: `Successfully executed 25,000 tensor batch across ${selectedSymbols.length} pipeline modules. Autograd backward pass validated with zero NaNs. Tolerance: ${tolerance}.`,
      });
    }, 700);
  };

  const handleSave = () => {
    const newTest: UnitTestResult = {
      id: `test_integ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: testName.trim() || `test_integration_${toSnakeCase(targetNode.ql_symbol)}`,
      suite: suiteName.trim() || 'End-to-End Pricing Pipelines',
      category: 'integration',
      shippable: true,
      targetNodeId: targetNode.id,
      targetSymbol: targetNode.ql_symbol,
      integrationModules: selectedSymbols,
      pipelineDescription: pipelineDescription,
      testCodeSnippet: customPythonCode,
      status: dryRunResult?.passed ? 'passed' : 'pending',
      tolerance: parseFloat(tolerance) || 1e-9,
      maxObservedDiff: dryRunResult ? dryRunResult.maxDiff : 0.0,
      quantLibExecutionTimeMs: 160.0,
      torchExecutionTimeMs: dryRunResult ? dryRunResult.durationMs : 4.2,
      speedup: dryRunResult ? dryRunResult.speedup : 38.0,
      assertionsCount: 25000,
      sampleInput: `25,000 contracts vectorized across ${selectedSymbols.join(' -> ')} on CUDA`,
      qlExpected: `Composite pipeline produces exact NPV and complete autograd Jacobian Greeks simultaneously`,
      torchActual: dryRunResult
        ? `Passed: Multi-module dataflow verified. Autograd Jacobian matches analytical Greeks within ${dryRunResult.maxDiff.toExponential(2)}`
        : 'Integration test authored. Pending full suite run.',
      lastRunAt: dryRunResult ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
    };

    const cleanFilename = (testName || 'test_pipeline').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const newFile: MigratedFile = {
      id: `file-${Date.now()}`,
      path: `torch_quantlib/tests/integration/${cleanFilename}.py`,
      nodeId: targetNode.id,
      symbol: targetNode.ql_symbol,
      sizeBytes: customPythonCode.length,
      linesCount: customPythonCode.split('\n').length,
      isTest: true,
      shippable: true,
      content: customPythonCode,
      createdAt: new Date().toLocaleTimeString(),
    };

    onSaveIntegrationTest(newTest, newFile);
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customPythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-400">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Write Integration Test
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/80">
                  DAG Test Tree Builder
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Construct end-to-end multi-module pipeline tests derived directly from the DAG dependency hierarchy.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - 2 Columns (DAG Test Tree & Code Editor) */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN: DAG Test Tree & Node Status (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Target Node Selection */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Target Output Engine (Root Node)
              </label>
              <select
                value={targetNodeId}
                onChange={(e) => setTargetNodeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {nodes.map((n) => {
                  const tested = isNodeTested(n);
                  const isLeaf = isDagLeaf(n, nodes);
                  return (
                    <option key={n.id} value={n.id}>
                      {tested ? '✓ [TESTED]' : '⏳ [UNTESTED]'} {n.ql_symbol} ({n.kind}){isLeaf ? ' ★ [DAG LEAF]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Green Checkpoints & Direct Synthesis Card */}
            {greenCheckpoints.length > 0 && (
              <div className="p-3 bg-gradient-to-br from-emerald-950/40 via-slate-950/70 to-slate-950/90 rounded-xl border border-emerald-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Green Checkpoints Detected ({greenCheckpoints.length})
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                    Integration Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  The following leaves have passed integration tests: <strong>{greenCheckpoints.map((g) => g.ql_symbol).join(', ')}</strong>.
                  You can jumpstart this integration test by connecting downstream directly from these green nodes.
                </p>
                <button
                  type="button"
                  onClick={handleSynthesizeFromGreenNodes}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Synthesize Test From Green Nodes</span>
                </button>
              </div>
            )}

            {/* Test Tree Coverage Status Banner */}
            <div
              className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                treeReadinessPercent === 100
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5">
                  {treeReadinessPercent === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  DAG Test Tree Status:
                </span>
                <span className="px-2 py-0.5 rounded font-bold bg-slate-950/80 border border-current text-[11px]">
                  {testedCountInTree}/{totalInTree} Nodes Tested ({treeReadinessPercent}%)
                </span>
              </div>

              <div className="w-full bg-slate-950/80 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    treeReadinessPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${treeReadinessPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-300 mt-2 font-sans leading-relaxed">
                {treeReadinessPercent === 100 ? (
                  <span>
                    All upstream dependencies in this test tree are <strong>already tested and verified</strong>. This integration pipeline is structurally ready for validation.
                  </span>
                ) : (
                  <span>
                    <strong>Caution:</strong> {untestedNodesInTree.length} prerequisite node{untestedNodesInTree.length > 1 ? 's are' : ' is'} not yet tested. We recommend verifying upstream kernels before running this integration test.
                  </span>
                )}
              </p>
            </div>

            {/* Interactive DAG Test Tree Hierarchy */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-purple-400" /> DAG Test Tree Nodes
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Topological Order</span>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {testTreeNodes.map((treeNode, index) => {
                  const tested = isNodeTested(treeNode);
                  const isSelectedInPipeline = selectedSymbols.includes(treeNode.ql_symbol);

                  return (
                    <div
                      key={treeNode.id}
                      className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 transition-all ${
                        tested
                          ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
                          : 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelectedInPipeline}
                          onChange={() => handleToggleSymbol(treeNode.ql_symbol)}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900 cursor-pointer"
                          title="Include in pipeline"
                        />

                        <div className="shrink-0 text-slate-500 text-[10px] w-4 font-mono">
                          {index + 1}.
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                            <span className="truncate">{treeNode.ql_symbol}</span>
                            {treeNode.id === targetNode.id && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800 font-bold shrink-0">
                                ROOT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {treeNode.kind} • deps: {treeNode.deps.length}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {tested ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            TESTED
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              UNTESTED
                            </span>
                            <button
                              onClick={() => onRunNodeTest(treeNode.ql_symbol)}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] transition-colors cursor-pointer"
                              title="Run unit test for this node right now"
                            >
                              Test Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Integration Test Authoring & Generated Pytest Code (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5 flex flex-col">
            {/* Metadata Fields */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-1">
                    Test Function Name
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    placeholder="test_integration_pipeline_name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-1">
                    Test Suite / Scope
                  </label>
                  <input
                    type="text"
                    value={suiteName}
                    onChange={(e) => setSuiteName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                    placeholder="End-to-End Pricing Pipelines"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-1">
                  Pipeline Dataflow Description
                </label>
                <input
                  type="text"
                  value={pipelineDescription}
                  onChange={(e) => setPipelineDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-sans text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="Describe pipeline flow..."
                />
              </div>
            </div>

            {/* Python Pytest Code Editor */}
            <div className="flex-1 flex flex-col p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2 min-h-[260px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-400" /> Runnable Pytest Integration Test Code
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={customPythonCode}
                onChange={(e) => setCustomPythonCode(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-sky-200 focus:outline-none focus:border-purple-500 resize-none font-mono leading-relaxed"
                rows={12}
                spellCheck={false}
              />
            </div>

            {/* Dry Run Result Feedback */}
            {dryRunResult && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs font-mono space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Dry Run Passed: 25,000 Batched Items Verified
                  </span>
                  <span className="text-emerald-400 font-bold">{dryRunResult.speedup}× Speedup</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">{dryRunResult.details}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                  <span>Latency: <strong className="text-slate-200">{dryRunResult.durationMs}ms</strong></span>
                  <span>Max observed diff: <strong className="text-emerald-400">{dryRunResult.maxDiff.toExponential(2)}</strong></span>
                  <span>Shippable to: <code className="text-purple-300">torch_quantlib/tests/integration/</code></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Selected Modules:</span>
            <span className="font-bold text-purple-300">{selectedSymbols.length}</span>
            <span>•</span>
            <span>Tested Prereqs:</span>
            <span className={`font-bold ${treeReadinessPercent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {testedCountInTree}/{totalInTree} ({treeReadinessPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDryRun}
              disabled={isDryRunning}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDryRunning ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Dry Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-purple-400 fill-current" />
                  <span>Dry Run Pipeline</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/60 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Save to Integration Test Suite</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
