import { LogEntry } from '../types';

export const initialLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '10:37:45.102',
    level: 'INFO',
    message: 'QuantLib AST Parser initialized with Clang 18.1 LibTooling',
    detail: 'Target QuantLib version: v1.34.0-release | System: Linux x86_64'
  },
  {
    id: 'log-2',
    timestamp: '10:37:46.331',
    level: 'INFO',
    message: 'Built include dependency DAG: 12 nodes, 10 directed edges',
    detail: 'Topological sort order resolved. Black-Scholes numeric cone identified.'
  },
  {
    id: 'log-3',
    timestamp: '10:38:02.124',
    level: 'SUCCESS',
    nodeId: '1',
    symbol: 'ErrorFunction',
    message: 'AST mapped: ErrorFunction -> torch.special.erf',
    detail: 'Preserves vectorized broadcasting and fp32/fp64 dtypes'
  },
  {
    id: 'log-4',
    timestamp: '10:38:05.419',
    level: 'SUCCESS',
    nodeId: '2',
    symbol: 'CumulativeNormalDistribution',
    message: 'AST mapped: CumulativeNormalDistribution -> torch.special.ndtr',
    detail: 'High-precision asymptotic expansion matching Cephes library'
  },
  {
    id: 'log-5',
    timestamp: '10:38:08.874',
    level: 'SUCCESS',
    nodeId: '3',
    symbol: 'NormalDistribution',
    message: 'AST mapped: NormalDistribution -> normal_pdf(x)',
    detail: 'Emitted torch tensor Gaussian kernel with inverse sqrt(2*pi) constant'
  },
  {
    id: 'log-6',
    timestamp: '10:38:15.650',
    level: 'INFO',
    nodeId: '4',
    symbol: 'blackFormula',
    message: 'Transpiling ql/pricingengines/blackformula.cpp into PyTorch module',
    detail: 'Synthesizing call/put branch via torch.where to avoid Python GIL branching'
  },
  {
    id: 'log-7',
    timestamp: '10:38:22.912',
    level: 'SUCCESS',
    nodeId: '4',
    symbol: 'blackFormula',
    message: 'Oracle validation PASSED: test_black_formula_call_put_parity',
    detail: '50,000 assertions passed | max_diff=3.8e-11 | speedup: 32.35x over QuantLib C++'
  },
  {
    id: 'log-8',
    timestamp: '10:38:31.042',
    level: 'INFO',
    nodeId: '5',
    symbol: 'bachelierBlackFormula',
    message: 'Translated bachelierBlackFormula -> awaiting oracle test suite execution',
    detail: 'Dependencies CumulativeNormalDistribution and NormalDistribution satisfied'
  },
  {
    id: 'log-9',
    timestamp: '10:38:35.201',
    level: 'WARN',
    nodeId: '6',
    symbol: 'blackFormulaImpliedStdDev',
    message: 'Node skipped: classical 1D Newton-Raphson not GPU-optimal',
    detail: 'Recommendation: replace with batched Halley iteration or autograd loss minimizer'
  },
  {
    id: 'log-10',
    timestamp: '10:38:40.115',
    level: 'INFO',
    nodeId: '7',
    symbol: 'BlackCalculator',
    message: 'Agent call [MODEL=gemini-2.5-pro] [PHASE=CODE_SYNTHESIS]: ql/pricingengines/blackcalculator.cpp',
    detail: 'Agent Prompt Tokens: 2,840 | Completion Tokens: 890 | Latency: 1.42s | Autograd vectorization rules applied'
  },
  {
    id: 'log-11',
    timestamp: '10:38:42.502',
    level: 'DEBUG',
    nodeId: '7',
    symbol: 'BlackCalculator',
    message: 'Agent AST inspection completed: resolved 4 upstream tensor bindings [ErrorFunction, CumulativeNormalDistribution, NormalDistribution, blackFormula]',
    detail: 'Agent verified Jacobian autograd path without branching overhead.'
  },
  {
    id: 'log-12',
    timestamp: '10:38:44.881',
    level: 'SUCCESS',
    nodeId: '7',
    symbol: 'BlackCalculator',
    message: 'Agent call [MODEL=gemini-2.5-pro] completed: generated torch_quantlib/pricingengines/black_calculator.py',
    detail: 'Transpiled 340 LOC C++ class into PyTorch tensorized batch calculator with CUDA broadcast support.'
  }
];
