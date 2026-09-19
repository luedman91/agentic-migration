import { useState, useMemo } from 'react';
import { UnitTestResult, TestStatus, UnitTestCategory, Node } from '../types';
import { areSymbolsEquivalent } from '../config/appConfig';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  Play,
  RotateCw,
  Search,
  Filter,
  Zap,
  Gauge,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldCheck,
  HelpCircle,
  Boxes,
  Workflow,
  Layers,
  Copy,
  Check,
  FileCode,
  Plus
} from 'lucide-react';

interface UnitTestOverviewProps {
  unitTests: UnitTestResult[];
  onRunTest: (testId: string) => void;
  onRunAllTests: (category?: UnitTestCategory) => void;
  isRunningTests: boolean;
  onSelectNodeBySymbol?: (symbol: string) => void;
  nodes?: Node[];
  onOpenWriteIntegrationTest?: () => void;
  onViewInDAGTestTree?: (targetNodeId: string, moduleSymbols?: string[]) => void;
}

export default function UnitTestOverview({
  unitTests,
  onRunTest,
  onRunAllTests,
  isRunningTests,
  onSelectNodeBySymbol,
  nodes = [],
  onOpenWriteIntegrationTest,
  onViewInDAGTestTree,
}: UnitTestOverviewProps) {
  const [categoryFilter, setCategoryFilter] = useState<UnitTestCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'ALL'>('ALL');
  const [suiteFilter, setSuiteFilter] = useState<string>('ALL');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Available suites
  const suites = useMemo(() => {
    const set = new Set(unitTests.map((t) => t.suite));
    return Array.from(set);
  }, [unitTests]);

  // Counts by category
  const targetLibCount = unitTests.filter((t) => t.category === 'target_library').length;
  const integrationCount = unitTests.filter((t) => t.category === 'integration').length;
  const oracleParityCount = unitTests.filter((t) => t.category === 'oracle_parity').length;

  const handleCopySnippet = (id: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // Filtered tests
  const filteredTests = useMemo(() => {
    return unitTests.filter((test) => {
      if (categoryFilter !== 'ALL' && test.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && test.status !== statusFilter) return false;
      if (suiteFilter !== 'ALL' && test.suite !== suiteFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = test.name.toLowerCase().includes(q);
        const matchSymbol = test.targetSymbol.toLowerCase().includes(q);
        const matchSuite = test.suite.toLowerCase().includes(q);
        const matchModules = test.integrationModules?.some((m) => m.toLowerCase().includes(q));
        if (!matchName && !matchSymbol && !matchSuite && !matchModules) return false;
      }
      return true;
    });
  }, [unitTests, categoryFilter, statusFilter, suiteFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = filteredTests.length;
    const passed = filteredTests.filter((t) => t.status === 'passed').length;
    const failed = filteredTests.filter((t) => t.status === 'failed').length;
    const pending = filteredTests.filter((t) => t.status === 'pending').length;
    const skipped = filteredTests.filter((t) => t.status === 'skipped').length;
    const running = filteredTests.filter((t) => t.status === 'running').length;

    const passRate = total > 0 ? Math.round((passed / Math.max(1, total - skipped)) * 100) : 0;

    // Average speedup for passed tests
    const passedTests = filteredTests.filter((t) => t.status === 'passed' && t.speedup > 0);
    const avgSpeedup =
      passedTests.length > 0
        ? (passedTests.reduce((acc, t) => acc + t.speedup, 0) / passedTests.length).toFixed(1)
        : '0.0';

    return { total, passed, failed, pending, skipped, running, passRate, avgSpeedup };
  }, [filteredTests]);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'running':
        return <RotateCw className="w-4 h-4 text-sky-400 animate-spin" />;
      case 'skipped':
        return <MinusCircle className="w-4 h-4 text-slate-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-amber-400/80" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/80">
            PASSED
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800/80">
            FAILED
          </span>
        );
      case 'running':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-950 text-sky-300 border border-sky-800/80 animate-pulse">
            RUNNING
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 text-slate-400 border border-slate-700">
            SKIPPED
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/70 text-amber-300 border border-amber-800/70">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white font-mono flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-400" />
                Unit & Integration Test Suite Dashboard
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
                {unitTests.length} Total Tests
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive test suite: Module Unit Tests, End-to-End Pipeline Integration Tests, and QuantLib C++ Differential Parity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManifestModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inspect package manifest to verify which tests ship in wheel"
            >
              <Boxes className="w-3.5 h-3.5 text-sky-400" />
              <span>Package Manifest</span>
            </button>

            <button
              onClick={() => onRunAllTests(categoryFilter === 'ALL' ? undefined : categoryFilter)}
              disabled={isRunningTests}
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isRunningTests ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Run {categoryFilter === 'ALL' ? 'All' : categoryFilter === 'target_library' ? 'Unit' : categoryFilter === 'integration' ? 'Integration' : 'Oracle'} Tests
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Category Selector Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto gap-1">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg font-mono font-medium transition-colors cursor-pointer text-center whitespace-nowrap ${
              categoryFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tests ({unitTests.length})
          </button>

          {/* Unit Tests Tab */}
          <button
            onClick={() => setCategoryFilter('target_library')}
            className={`flex-1 min-w-[170px] py-1.5 px-3 rounded-lg font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'target_library'
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/80 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unit Tests</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold">
              {targetLibCount}
            </span>
            <span className="hidden sm:inline text-[9px] text-emerald-400 border border-emerald-800/60 px-1 rounded">
              Shipped
            </span>
          </button>

          {/* Integration Tests Tab */}
          <button
            onClick={() => setCategoryFilter('integration')}
            className={`flex-1 min-w-[190px] py-1.5 px-3 rounded-lg font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'integration'
                ? 'bg-purple-950/80 text-purple-200 border border-purple-800/80 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-purple-400" />
            <span>Integration Tests</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-900/60 text-purple-300 font-bold">
              {integrationCount}
            </span>
            <span className="hidden sm:inline text-[9px] text-purple-400 border border-purple-800/60 px-1 rounded">
              Shipped
            </span>
          </button>

          {/* Oracle Parity Tab */}
          <button
            onClick={() => setCategoryFilter('oracle_parity')}
            className={`flex-1 min-w-[170px] py-1.5 px-3 rounded-lg font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'oracle_parity'
                ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-800/80 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Oracle Parity</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-900/60 text-indigo-300 font-bold">
              {oracleParityCount}
            </span>
            <span className="hidden sm:inline text-[9px] text-indigo-400 border border-indigo-800/60 px-1 rounded">
              Dev Only
            </span>
          </button>
        </div>

        {/* Category Description Banner */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-2.5">
          {categoryFilter === 'target_library' ? (
            <>
              <Package className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 leading-relaxed">
                <strong className="text-emerald-300 font-mono">Shipped Library Unit Tests:</strong>{' '}
                Tests isolated mathematical kernels, tensor shapes, autograd differentiability (<code className="text-sky-300">d(price)/d(spot) == delta</code>), asymptotic boundaries (zero vol, negative interest rates, subnormals), and CUDA execution.
                <span className="text-emerald-400 ml-1 font-semibold">
                  Shipped directly inside <code className="text-emerald-300">torch_quantlib/tests/unit/</code>.
                </span>
              </div>
            </>
          ) : categoryFilter === 'integration' ? (
            <>
              <Workflow className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-slate-300 leading-relaxed">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong className="text-purple-300 font-mono">Shipped End-to-End Integration Tests:</strong>{' '}
                    Validates multi-module pipelines across the entire pricing cone: Yield Curve Bootstrapping &rarr; Cashflow Discounting &rarr; Option Engines &rarr; Reverse Autograd Risk Matrices, multi-asset portfolio batching, macro stress shifting, and TorchScript JIT serialization.
                    <span className="text-purple-400 ml-1 font-semibold">
                      Shipped in <code className="text-purple-300">torch_quantlib/tests/integration/</code>.
                    </span>
                  </span>
                  {onOpenWriteIntegrationTest && (
                    <button
                      onClick={onOpenWriteIntegrationTest}
                      className="px-2.5 py-1 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-[11px] font-mono font-medium flex items-center gap-1 border border-purple-700/80 shrink-0 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Write Integration Test</span>
                    </button>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                  <span>DAG Test Tree status: All prerequisite nodes in the dependency tree must be tested to ensure high test coverage.</span>
                </div>
              </div>
            </>
          ) : categoryFilter === 'oracle_parity' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 leading-relaxed">
                <strong className="text-indigo-300 font-mono">Source vs Target Differential Oracle Tests:</strong>{' '}
                Directly executes QuantLib C++ Python wrapper and PyTorch side-by-side to assert floating-point tolerance <code className="text-indigo-300">&epsilon; &le; 10⁻⁸</code> across 50,000 randomized market vectors.
                <span className="text-amber-300 ml-1 font-semibold">
                  CI/CD validation only; excluded from distribution wheel so end-users do not require C++ QuantLib.
                </span>
              </div>
            </>
          ) : (
            <>
              <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 leading-relaxed">
                <strong className="text-white font-mono">Three-Tier Quality Assurance Hierarchy:</strong>{' '}
                <strong className="text-emerald-300">Unit Tests</strong> verify isolated mathematical operators; <strong className="text-purple-300">Integration Tests</strong> verify multi-module pipelines and cross-asset portfolios; and <strong className="text-indigo-300">Oracle Parity Tests</strong> verify bit-level parity against original C++ QuantLib.
              </div>
            </>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
          <div className="p-2.5 bg-emerald-950/20 rounded-lg border border-emerald-900/40 flex flex-col">
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> PASSED
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-emerald-300">{stats.passed}</span>
              <span className="text-xs text-emerald-500">({stats.passRate}%)</span>
            </div>
          </div>

          <div className="p-2.5 bg-amber-950/20 rounded-lg border border-amber-900/40 flex flex-col">
            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> PENDING
            </span>
            <span className="text-xl font-bold text-amber-300 mt-0.5">{stats.pending}</span>
          </div>

          <div className="p-2.5 bg-purple-950/20 rounded-lg border border-purple-900/40 flex flex-col">
            <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
              <Workflow className="w-3 h-3" /> INTEGRATION
            </span>
            <span className="text-xl font-bold text-purple-300 mt-0.5">{integrationCount}</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
              <Gauge className="w-3 h-3" /> ORACLE TOL
            </span>
            <span className="text-xl font-bold text-sky-300 mt-0.5">10⁻⁸</span>
          </div>

          <div className="p-2.5 bg-indigo-950/20 rounded-lg border border-indigo-900/40 flex flex-col">
            <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" /> MEAN SPEEDUP
            </span>
            <span className="text-xl font-bold text-indigo-300 mt-0.5">{stats.avgSpeedup}×</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 focus-within:border-sky-500">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test name, target symbol, module..."
            className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {(['ALL', 'passed', 'pending', 'skipped'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-sky-950 text-sky-300 border border-sky-800/80 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Test List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-full bg-slate-800/80 text-slate-400">
              {categoryFilter === 'integration' ? (
                <Workflow className="w-6 h-6 text-purple-400" />
              ) : (
                <Filter className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {categoryFilter === 'integration'
                ? 'No Integration Tests Synthesized Yet'
                : 'No tests match current filter criteria'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              {categoryFilter === 'integration'
                ? 'Integration tests are automatically generated for every DAG leaf as migration progresses, or you can author a custom pipeline test.'
                : 'Try adjusting your search query or status filter to view available tests.'}
            </p>
            {categoryFilter === 'integration' && onOpenWriteIntegrationTest && (
              <button
                onClick={onOpenWriteIntegrationTest}
                className="mt-2 px-3 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-mono font-medium flex items-center gap-1.5 border border-purple-700/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Integration Test</span>
              </button>
            )}
          </div>
        ) : (
          filteredTests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            const isTargetLib = test.category === 'target_library';
            const isIntegration = test.category === 'integration';

            return (
              <div
                key={test.id}
                className={`rounded-xl border transition-all ${
                  test.status === 'passed'
                    ? isIntegration
                      ? 'border-purple-900/50 bg-slate-900/70 hover:border-purple-700/60'
                      : 'border-emerald-900/40 bg-slate-900/60 hover:border-emerald-700/60'
                    : test.status === 'failed'
                    ? 'border-rose-900/40 bg-slate-900/60 hover:border-rose-700/60'
                    : test.status === 'running'
                    ? 'border-sky-800/60 bg-sky-950/20'
                    : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700'
                }`}
              >
                {/* Test Row Header */}
                <div className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="shrink-0">{getStatusIcon(test.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-white text-xs">{test.name}</span>
                        {getStatusBadge(test.status)}

                        {/* Category Badges */}
                        {isIntegration ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/80 flex items-center gap-1 font-semibold">
                            <Workflow className="w-2.5 h-2.5 text-purple-400" /> Integration Test (Shipped)
                          </span>
                        ) : isTargetLib ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                            <Package className="w-2.5 h-2.5 text-emerald-400" /> Unit Test (Shipped)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" /> Oracle Parity (Dev Only)
                          </span>
                        )}
                      </div>

                      {/* Interconnected Modules for Integration Tests */}
                      {test.integrationModules && test.integrationModules.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-900/50 mt-1.5 w-fit">
                          <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="text-slate-400 mr-0.5">Pipeline Tree:</span>
                          {test.integrationModules.map((mod, i) => {
                            const modNode = nodes.find((n) => areSymbolsEquivalent(n.ql_symbol, mod));
                            const isTested = modNode?.status === 'tested' || unitTests.some(
                              (t) => (areSymbolsEquivalent(t.targetSymbol, mod) || t.targetNodeId === modNode?.id) && t.status === 'passed'
                            );

                            return (
                              <span key={mod} className="flex items-center gap-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-semibold flex items-center gap-1 ${
                                    isTested
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                  }`}
                                  title={`${mod}: ${isTested ? 'Tested' : 'Untested Prerequisite'}`}
                                >
                                  {isTested ? (
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                  ) : (
                                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                                  )}
                                  <span>{mod}</span>
                                  <span className="text-[8px] opacity-75">
                                    {isTested ? '✓ TESTED' : '⏳ UNTESTED'}
                                  </span>
                                </span>
                                {i < test.integrationModules!.length - 1 && (
                                  <span className="text-purple-400/80 mx-0.5">→</span>
                                )}
                              </span>
                            );
                          })}

                          {onViewInDAGTestTree && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewInDAGTestTree(test.targetNodeId, test.integrationModules);
                              }}
                              className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[9px] flex items-center gap-1 border border-purple-700/60 transition-colors cursor-pointer"
                              title="Focus and highlight this test pipeline in the DAG Test Tree"
                            >
                              <Workflow className="w-2.5 h-2.5" />
                              <span>View in DAG</span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                        <span>
                          Target:{' '}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectNodeBySymbol?.(test.targetSymbol);
                            }}
                            className="text-sky-400 hover:underline font-semibold"
                          >
                            {test.targetSymbol}
                          </button>
                        </span>
                        <span>•</span>
                        <span>Suite: {test.suite}</span>
                        <span>•</span>
                        <span>{test.assertionsCount.toLocaleString()} assertions</span>
                      </div>
                    </div>
                  </div>

                  {/* Benchmark & Error Comparison */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    {test.status === 'passed' ? (
                      <>
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] block">MAX RESIDUAL</span>
                          <span className="font-bold text-emerald-400">
                            {test.maxObservedDiff.toExponential(2)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] block">FRAMEWORK</span>
                          <span className="text-slate-200">{test.torchExecutionTimeMs} ms</span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] block">SPEEDUP</span>
                          <span className="font-bold text-indigo-400">{test.speedup}×</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-right text-slate-500 text-[11px]">
                        Tolerance: {test.tolerance.toExponential(1)}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRunTest(test.id)}
                        disabled={isRunningTests || test.status === 'running'}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Run this test individually"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse' : 'Inspect input & output assertions'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Drawer: Input vectors, QL expected, Torch actual, Pipeline Description, Code Snippet */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-2 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono space-y-3">
                    {/* Integration Pipeline Description */}
                    {test.pipelineDescription && (
                      <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px] uppercase tracking-wider font-mono">
                          <Workflow className="w-3.5 h-3.5" /> End-to-End Pipeline Architecture & Multi-Module Dataflow
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed font-sans">{test.pipelineDescription}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                          Test Input Vector / Scenario
                        </span>
                        <div className="text-slate-200 text-[11px] break-all">{test.sampleInput}</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">
                          {isIntegration
                            ? 'Integration Specification Assertion'
                            : isTargetLib
                            ? 'Library Specification Assertion'
                            : 'Source Oracle Expected Output'}
                        </span>
                        <div className="text-slate-200 text-[11px] break-all">{test.qlExpected}</div>
                      </div>

                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                          Migrated Target Verified Output
                        </span>
                        <div className="text-slate-200 text-[11px] break-all">{test.torchActual}</div>
                      </div>
                    </div>

                    {/* Runnable Pytest Code Snippet */}
                    {test.testCodeSnippet && (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-sky-400" /> Runnable Pytest Test Implementation
                          </span>
                          <button
                            onClick={() => handleCopySnippet(test.id, test.testCodeSnippet!)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedSnippetId === test.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy Pytest Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-sky-200 font-mono overflow-x-auto whitespace-pre leading-relaxed">
                          {test.testCodeSnippet}
                        </pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Tolerance threshold: <code className="text-sky-300">{test.tolerance.toExponential()}</code>
                      </span>
                      {test.lastRunAt && <span>Last verified: {test.lastRunAt}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Package Manifest Modal */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Final Package Manifest: torch_quantlib-1.34.0.whl
                </h3>
              </div>
              <button
                onClick={() => setShowManifestModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <p className="text-slate-300">
                The migration pipeline enforces strict packaging boundaries between target production code and development verification harnesses:
              </p>

              {/* Shipped Unit Tests */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-xl space-y-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SHIPPED UNIT TESTS ({targetLibCount} tests):
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                  <li><code className="text-emerald-400">torch_quantlib/tests/unit/test_special.py</code> (Shapes, autograd, subnormals)</li>
                  <li><code className="text-emerald-400">torch_quantlib/tests/unit/test_distributions.py</code> (Normal CDF/PDF, inverse quantiles)</li>
                  <li><code className="text-emerald-400">torch_quantlib/tests/unit/test_black_formula.py</code> (Put-Call parity, boundary limits)</li>
                  <li><code className="text-emerald-400">torch_quantlib/tests/unit/test_calculators.py</code> (Analytical Greeks & Hessian autograd)</li>
                </ul>
              </div>

              {/* Shipped Integration Tests */}
              <div className="p-3 bg-purple-950/20 border border-purple-900/60 rounded-xl space-y-2">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-purple-400" />
                  SHIPPED INTEGRATION TESTS ({integrationCount} tests):
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                  <li><code className="text-purple-400">torch_quantlib/tests/integration/test_pipeline.py</code> (Yield curve &rarr; Cashflows &rarr; BlackCalculator &rarr; Analytic Engine)</li>
                  <li><code className="text-purple-400">torch_quantlib/tests/integration/test_portfolio.py</code> (100,000 multi-asset cross-equity batch aggregation)</li>
                  <li><code className="text-purple-400">torch_quantlib/tests/integration/test_torchscript.py</code> (GIL-free C++ LibTorch JIT serialization)</li>
                  <li><code className="text-purple-400">torch_quantlib/tests/integration/test_cuda_stream.py</code> (Asynchronous 4-stream GPU throughput)</li>
                </ul>
              </div>

              {/* Excluded Dev Oracle Tests */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/60 rounded-xl space-y-2">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-indigo-400" />
                  EXCLUDED FROM WHEEL - DEV ORACLE ONLY ({oracleParityCount} tests):
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                  <li><strong className="text-white">Parity Oracle:</strong> <code className="text-indigo-300">tests/oracle_parity/test_*.py</code> (Direct C++ QuantLib differential comparisons)</li>
                  <li>Original QuantLib C++ source files & headers</li>
                  <li>Heavy QuantLib Python native extension binaries</li>
                </ul>
                <p className="text-[10px] text-slate-400 pt-1">
                  *End-users installing <code className="text-slate-200">pip install torch_quantlib</code> run all Unit & Integration tests without C++ compiler toolchains or libQuantLib dependencies.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowManifestModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
