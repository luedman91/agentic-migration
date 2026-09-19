export type NodeKind = 'pure_math' | 'date_logic' | 'infrastructure' | 'solver';
export type NodeStatus = 'todo' | 'mapped' | 'translated' | 'tested' | 'failed' | 'skipped';

export interface CodeSnippet {
  cpp: string;
  python: string;
}

export interface Node {
  id: string;
  ql_symbol: string;
  path: string;
  kind: NodeKind;
  status: NodeStatus;
  deps: string[];
  note: string;
  code?: CodeSnippet;
  complexity?: 'low' | 'medium' | 'high';
  estimatedHours?: number;
}

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';

export interface AgentCallDetails {
  model: string;
  symbol: string;
  sourceLang: string;
  targetLang: string;
  targetDevice: string;
  promptTokensEstimate?: number;
  durationMs?: number;
  deterministicMappingsCount?: number;
  upstreamDeps?: string[];
  status: 'invoked' | 'streaming' | 'completed' | 'failed';
  vectorizationSummary?: string;
  tolerance?: number;
  maxDiff?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  nodeId?: string;
  symbol?: string;
  message: string;
  detail?: string;
  agentCall?: AgentCallDetails;
}

export type TestStatus = 'passed' | 'failed' | 'running' | 'pending' | 'skipped';

export type UnitTestCategory = 'target_library' | 'integration' | 'oracle_parity';

export interface UnitTestResult {
  id: string;
  name: string;
  suite: string;
  category: UnitTestCategory; // 'target_library' (shipped unit test) vs 'integration' (shipped end-to-end test) vs 'oracle_parity' (source vs target diff, dev only)
  shippable: boolean; // true for migrated library unit & integration tests, false for oracle comparison
  targetNodeId: string;
  targetSymbol: string;
  integrationModules?: string[]; // interconnected modules for integration tests
  pipelineDescription?: string; // description of the end-to-end pipeline dataflow
  testCodeSnippet?: string; // executable pytest python test code snippet
  status: TestStatus;
  tolerance: number; // e.g. 1e-9
  maxObservedDiff: number; // e.g. 3.2e-12
  quantLibExecutionTimeMs: number;
  torchExecutionTimeMs: number;
  speedup: number; // e.g. 18.5x
  assertionsCount: number;
  sampleInput: string;
  qlExpected: string;
  torchActual: string;
  errorMessage?: string;
  lastRunAt?: string;
}

export interface MigratedFile {
  id: string;
  path: string;
  nodeId: string;
  symbol: string;
  sizeBytes: number;
  linesCount: number;
  isTest: boolean;
  shippable: boolean;
  content: string;
  createdAt: string;
}

export interface ProjectConfig {
  repoUrl: string;
  branch: string;
  entryPoint: string;
  sourceLanguage?: string; // e.g. 'C++', 'Fortran', 'Matlab', 'Julia', 'C'
  targetLanguage?: string; // e.g. 'Python', 'Rust', 'Julia', 'C++'
  targetFramework: 'PyTorch' | 'JAX' | 'TensorFlow' | 'Triton';
  targetDevice: 'cpu' | 'cuda' | 'mps';
  precision: 'float64' | 'mixed_precision';
  oracleEngine: string;
  sourceLibraryName?: string; // e.g. 'QuantLib', 'Sundials', 'OpenFOAM', 'BLAS/LAPACK'
  targetLibraryName?: string; // e.g. 'torch_quantlib', 'jax_sim', 'torch_sundials'
}

export type MigrationTrigger = 'manual' | 'on_dependency' | 'scheduled' | 'continuous';

export interface MigrationConfig {
  trigger: MigrationTrigger;
  scheduledDelaySeconds: number;
  autoTestAfterTranslate: boolean;
  concurrency: number;
  speedMultiplier: number;
  stopOnFailure: boolean;
  targetDevice: 'cpu' | 'cuda' | 'mps';
  useAgentEngine?: boolean; // Whether to run hybrid AI agent mode
}

export type BuildingBlockCategory = 'primitive' | 'math_op' | 'container' | 'domain_object';

export interface SymbolMapping {
  id: string;
  sourceType: string;
  targetType: string;
  category: BuildingBlockCategory;
  isVectorized: boolean;
  notes: string;
}

export interface FunctionAnalysisResult {
  functionName: string;
  returnType: string;
  parameters: Array<{ name: string; type: string; mappedType?: string }>;
  detectedBuildingBlocks: SymbolMapping[];
  complexity: 'low' | 'medium' | 'high';
  isPureMath: boolean;
  suggestedKind: NodeKind;
}

export interface AgentMigrationResponse {
  targetSymbol: string;
  pythonCode: string;
  imports: string[];
  unitTestCode: string;
  vectorizationSummary: string;
  numericalTolerance: number;
  maxExpectedDiff: number;
  oracleSampleInput: string;
  oracleExpected: string;
  torchActual: string;
  newDiscoveredMappings: Array<{ sourceType: string; targetType: string; notes: string }>;
}


