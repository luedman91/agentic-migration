import { useState, useMemo, useRef, useEffect } from 'react';
import { LogEntry, LogLevel } from '../types';
import {
  Terminal,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Clock,
  Bot,
  Cpu,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LogsSectionProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  selectedNodeSymbol?: string;
}

export default function LogsSection({ logs, onClearLogs, selectedNodeSymbol }: LogsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL' | 'AGENT'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter === 'AGENT') {
        if (!log.agentCall) return false;
      } else if (levelFilter !== 'ALL' && log.level !== levelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMessage = log.message.toLowerCase().includes(q);
        const matchSymbol = log.symbol?.toLowerCase().includes(q);
        const matchDetail = log.detail?.toLowerCase().includes(q);
        const matchLevel = log.level.toLowerCase().includes(q);
        const matchAgent = log.agentCall?.model.toLowerCase().includes(q) ||
          log.agentCall?.vectorizationSummary?.toLowerCase().includes(q);
        if (!matchMessage && !matchSymbol && !matchDetail && !matchLevel && !matchAgent) return false;
      }
      return true;
    });
  }, [logs, levelFilter, searchQuery]);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const copyAllLogs = () => {
    const text = filteredLogs
      .map((l) => {
        let line = `[${l.timestamp}] [${l.level}] ${l.symbol ? `[${l.symbol}] ` : ''}${l.message}`;
        if (l.agentCall) {
          line += `\n  ↳ [Agent Call: ${l.agentCall.model} | ${l.agentCall.sourceLang} -> ${l.agentCall.targetLang} | Status: ${l.agentCall.status}]`;
        }
        if (l.detail) {
          line += `\n  ↳ ${l.detail}`;
        }
        return line;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SUCCESS
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950/80 text-amber-400 border border-amber-800/50">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-950/80 text-rose-400 border border-rose-800/50">
            <XCircle className="w-3 h-3 text-rose-400" /> ERROR
          </span>
        );
      case 'DEBUG':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-950/80 text-purple-400 border border-purple-800/50">
            DEBUG
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-sky-950/80 text-sky-400 border border-sky-800/50">
            <Info className="w-3 h-3 text-sky-400" /> INFO
          </span>
        );
    }
  };

  const counts = useMemo(() => {
    return {
      all: logs.length,
      info: logs.filter((l) => l.level === 'INFO').length,
      success: logs.filter((l) => l.level === 'SUCCESS').length,
      warn: logs.filter((l) => l.level === 'WARN').length,
      error: logs.filter((l) => l.level === 'ERROR').length,
      agent: logs.filter((l) => Boolean(l.agentCall)).length,
    };
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Log Header Toolbar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-slate-700/60 text-slate-200 font-mono font-semibold">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>MIGRATION RUNTIME LOGS</span>
          </div>
          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono text-[11px]">
            {filteredLogs.length} / {logs.length} entries
          </span>
          {selectedNodeSymbol && (
            <button
              onClick={() => setSearchQuery(selectedNodeSymbol)}
              className="text-sky-400 hover:underline text-[11px] font-mono bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40"
            >
              Filter symbol: {selectedNodeSymbol}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 border transition-colors ${
              autoScroll
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Auto Scroll to Bottom"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Auto-scroll {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={copyAllLogs}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Copy Logs to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={onClearLogs}
            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded flex items-center gap-1.5 border border-slate-700 hover:border-rose-800/50 transition-colors"
            title="Clear All Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-md bg-slate-950 px-2.5 py-1 rounded border border-slate-800 focus-within:border-sky-500">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs, agents, symbols, errors..."
            className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Level & Agent Filters */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setLevelFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              levelFilter === 'ALL'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ALL ({counts.all})
          </button>
          <button
            onClick={() => setLevelFilter('AGENT')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
              levelFilter === 'AGENT'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-indigo-300 hover:text-white hover:bg-indigo-950/60'
            }`}
          >
            <Bot className="w-3 h-3 text-indigo-400" />
            AGENT ({counts.agent})
          </button>
          <button
            onClick={() => setLevelFilter('INFO')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              levelFilter === 'INFO'
                ? 'bg-sky-900 text-sky-200 font-medium'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
            }`}
          >
            INFO ({counts.info})
          </button>
          <button
            onClick={() => setLevelFilter('SUCCESS')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              levelFilter === 'SUCCESS'
                ? 'bg-emerald-900 text-emerald-200 font-medium'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
          >
            SUCCESS ({counts.success})
          </button>
          <button
            onClick={() => setLevelFilter('WARN')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
              levelFilter === 'WARN'
                ? 'bg-amber-900 text-amber-200 font-medium'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            WARN ({counts.warn})
          </button>
          {counts.error > 0 && (
            <button
              onClick={() => setLevelFilter('ERROR')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                levelFilter === 'ERROR'
                  ? 'bg-rose-900 text-rose-200 font-medium'
                  : 'text-rose-400 hover:bg-rose-950/60'
              }`}
            >
              ERRORS ({counts.error})
            </button>
          )}
        </div>
      </div>

      {/* Terminal Log Output */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed space-y-1 bg-slate-950 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
            <Terminal className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
            <p>No log records match the current filter</p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setLevelFilter('ALL');
                }}
                className="mt-2 text-xs text-sky-400 hover:underline"
              >
                Reset search filter
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const hasExpandable = Boolean(log.detail || log.agentCall);
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                onClick={() => hasExpandable && setExpandedLogId(isExpanded ? null : log.id)}
                className={`group px-2 py-1.5 rounded transition-colors ${
                  isExpanded ? 'bg-slate-900/90 border border-slate-700/60' : 'hover:bg-slate-900/50'
                } ${hasExpandable ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                  {/* Timestamp */}
                  <span className="text-slate-500 text-[11px] shrink-0 select-none flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 opacity-60" />
                    {log.timestamp}
                  </span>

                  {/* Level */}
                  <div className="shrink-0">{getLevelBadge(log.level)}</div>

                  {/* Agent Call Badge if present */}
                  {log.agentCall && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-950 text-indigo-300 border border-indigo-700/70 shrink-0">
                      <Bot className="w-3 h-3 text-indigo-400" />
                      <span>{log.agentCall.model}</span>
                      {log.agentCall.durationMs !== undefined && (
                        <span className="text-indigo-400/80">({log.agentCall.durationMs}ms)</span>
                      )}
                    </span>
                  )}

                  {/* Symbol Tag if present */}
                  {log.symbol && (
                    <span className="px-1.5 py-0.2 rounded text-[11px] bg-slate-800 text-cyan-300 font-semibold border border-slate-700/60 shrink-0">
                      [{log.symbol}]
                    </span>
                  )}

                  {/* Message */}
                  <div className="flex-1 text-slate-300 break-words">
                    <span>{log.message}</span>
                    {hasExpandable && (
                      <span className="ml-2 text-[10px] text-slate-500 underline opacity-75 group-hover:opacity-100 inline-flex items-center gap-0.5">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-2.5 h-2.5" /> hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-2.5 h-2.5" /> inspect call
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details / Agent Call Inspector Card */}
                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-2">
                    {/* Agent Call Inspector Details */}
                    {log.agentCall && (
                      <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs font-mono text-indigo-200 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-indigo-800/40 text-[11px]">
                          <span className="flex items-center gap-1.5 font-bold text-indigo-300">
                            <Bot className="w-3.5 h-3.5 text-indigo-400" /> AI Agent Dispatch Trace
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                            Status: {log.agentCall.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Model</span>
                            <span className="text-white font-semibold">{log.agentCall.model}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Transformation</span>
                            <span className="text-white font-semibold">
                              {log.agentCall.sourceLang} &rarr; {log.agentCall.targetLang}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Execution Target</span>
                            <span className="text-emerald-400 font-semibold uppercase flex items-center gap-1">
                              <Cpu className="w-3 h-3" /> {log.agentCall.targetDevice}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Latency</span>
                            <span className="text-amber-300 font-semibold">
                              {log.agentCall.durationMs !== undefined ? `${log.agentCall.durationMs} ms` : 'In flight'}
                            </span>
                          </div>
                        </div>

                        {log.agentCall.upstreamDeps && log.agentCall.upstreamDeps.length > 0 && (
                          <div className="pt-1.5 border-t border-indigo-800/40 text-[11px]">
                            <span className="text-slate-400 text-[10px] block mb-1">Upstream DAG Dependencies Bound:</span>
                            <div className="flex flex-wrap gap-1">
                              {log.agentCall.upstreamDeps.map((dep) => (
                                <span
                                  key={dep}
                                  className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-700 text-[10px]"
                                >
                                  {dep}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.agentCall.vectorizationSummary && (
                          <div className="pt-1.5 border-t border-indigo-800/40 text-[11px] text-slate-300">
                            <span className="text-slate-400 text-[10px] block mb-0.5">Vectorization Policy:</span>
                            <p className="text-indigo-200/90 italic">{log.agentCall.vectorizationSummary}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Execution Trace Log Detail */}
                    {log.detail && (
                      <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 font-mono whitespace-pre-wrap">
                        <div className="text-slate-500 mb-1 text-[10px] uppercase font-semibold tracking-wider">
                          Diagnostic Information:
                        </div>
                        {log.detail}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer status */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Transpiler Engine &bull; AI Agent Migration &bull; Numerical Oracle Parity</span>
        </div>
        <div>Stream: Active /dev/stdout</div>
      </div>
    </div>
  );
}
