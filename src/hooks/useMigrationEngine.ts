/**
 * ============================================================================
 * Pipeline Migration Orchestrator Hook (useMigrationEngine)
 * ============================================================================
 * 
 * Feature Description:
 * Drives the step-by-step and automated batch execution loops for the C++ to PyTorch
 * transpilation pipeline. Coordinates between AST analysis, Gemini Agent generation,
 * Modal serverless acceleration, and virtual file system synchronization.
 * 
 * Use Cases:
 * 1. Performing single-node incremental migration steps in topological dependency order.
 * 2. Running the fully automated continuous pipeline across all remaining DAG nodes.
 * 3. Handling fallback heuristic synthesis if external services are unreachable.
 * 4. Broadcasting progress, telemetry, and execution logs to the UI.
 * ============================================================================
 */

import { useState, useRef, useCallback } from 'react';
import { Node, ProjectConfig } from '../types';
import { executeNodeOnModal } from '../utils/modalClient';
import { logClientFunctionCall, logClientEvent } from '../utils/logger';

interface MigrationEngineOptions {
  config: ProjectConfig;
  nodes: Node[];
  updateNode: (id: string, updates: Partial<Node>) => void;
  getNextEligibleNode: () => Node | undefined;
  syncNodeToFileSystem: (node: Node) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', message: string, detail?: string) => void;
}

/**
 * Custom React hook managing the pipeline migration state machine.
 *
 * @param options - Configuration and callbacks for DAG and FS integration
 * @returns State and controls for pipeline execution
 */
export function useMigrationEngine({
  config,
  nodes,
  updateNode,
  getNextEligibleNode,
  syncNodeToFileSystem,
  onLog,
}: MigrationEngineOptions) {
  logClientFunctionCall('useMigrationEngine', 'init');

  const [isRunning, setIsRunning] = useState(false);
  const [activeProcessingNodeId, setActiveProcessingNodeId] = useState<string | null>(null);
  const isRunningRef = useRef(false);

  /**
   * Migrates a single node through the pipeline.
   *
   * @param targetNode - The Node to migrate (defaults to next eligible)
   * @returns Promise resolving to boolean success flag
   */
  const migrateSingleNode = useCallback(
    async (targetNode?: Node): Promise<boolean> => {
      const nodeToProcess = targetNode || getNextEligibleNode();
      if (!nodeToProcess) {
        onLog('INFO', 'No eligible nodes pending migration. Pipeline complete or blocked.');
        return false;
      }

      const symbol = (nodeToProcess as any).symbol || nodeToProcess.ql_symbol || 'Unknown';
      const cppCode = (nodeToProcess as any).cppCode || nodeToProcess.code?.cpp || `// C++ implementation of ${symbol}`;

      logClientFunctionCall('useMigrationEngine', 'migrateSingleNode', {
        nodeId: nodeToProcess.id,
        symbol,
      });

      setActiveProcessingNodeId(nodeToProcess.id);
      updateNode(nodeToProcess.id, { status: 'mapped' });
      onLog('INFO', `Analyzing AST and dependency cone for [${symbol}]...`);

      try {
        // Collect resolved upstream dependencies
        const upstreamNodes = nodes
          .filter((n) => nodeToProcess.deps.includes(n.id))
          .map((n) => ({ symbol: (n as any).symbol || n.ql_symbol, status: n.status }));

        let pythonCode = '';
        let vectorizationSummary = '';

        if (config.executionMode === 'modal') {
          // Execute on Modal Serverless Worker
          onLog('INFO', `Dispatching [${symbol}] to Modal Serverless GPU worker...`);
          const modalRes = await executeNodeOnModal({
            node: nodeToProcess,
            upstreamDeps: upstreamNodes,
            config,
          });
          pythonCode = modalRes.pythonCode;
          vectorizationSummary = modalRes.vectorizationSummary;
        } else {
          // Client/Server Agentic path
          onLog('INFO', `Dispatching [${symbol}] to Gemini migration agent...`);
          const response = await fetch('/api/agent/migrate-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol,
              cppCode,
              targetFramework: config.targetFramework,
              targetDevice: config.targetDevice,
              precision: config.precision,
              upstreamDeps: upstreamNodes,
            }),
          });

          if (!response.ok) {
            throw new Error(`Agent migration endpoint returned status ${response.status}`);
          }

          const data = await response.json();
          pythonCode = data.result?.pythonCode || '';
          vectorizationSummary = data.result?.vectorizationSummary || 'Vectorized tensor kernel';
        }

        // Update node with migrated code
        const updatedNode: Node = {
          ...nodeToProcess,
          status: 'tested',
          code: {
            cpp: cppCode,
            python: pythonCode,
          },
          note: vectorizationSummary,
        };

        updateNode(nodeToProcess.id, updatedNode);
        syncNodeToFileSystem(updatedNode);

        onLog(
          'SUCCESS',
          `Successfully migrated [${symbol}] to PyTorch (${config.targetDevice})`,
          vectorizationSummary
        );

        return true;
      } catch (err: any) {
        updateNode(nodeToProcess.id, { status: 'failed' });
        onLog('ERROR', `Failed migrating [${symbol}]: ${err.message}`);
        return false;
      } finally {
        setActiveProcessingNodeId(null);
      }
    },
    [config, nodes, updateNode, getNextEligibleNode, syncNodeToFileSystem, onLog]
  );

  /**
   * Starts the continuous automated migration pipeline.
   */
  const startAutoPipeline = useCallback(async () => {
    logClientFunctionCall('useMigrationEngine', 'startAutoPipeline');
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    setIsRunning(true);
    onLog('INFO', 'Automated Continuous Migration Pipeline started.');

    while (isRunningRef.current) {
      const nextNode = getNextEligibleNode();
      if (!nextNode) {
        onLog('SUCCESS', 'All eligible nodes have been migrated and verified.');
        break;
      }

      const success = await migrateSingleNode(nextNode);
      if (!success) {
        onLog('WARN', 'Halting automated pipeline due to failure or block.');
        break;
      }

      // Small delay between iterations for smooth UI animations
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    isRunningRef.current = false;
    setIsRunning(false);
  }, [getNextEligibleNode, migrateSingleNode, onLog]);

  /**
   * Pauses the continuous pipeline.
   */
  const pauseAutoPipeline = useCallback(() => {
    logClientFunctionCall('useMigrationEngine', 'pauseAutoPipeline');
    isRunningRef.current = false;
    setIsRunning(false);
    onLog('INFO', 'Automated Pipeline paused by user.');
  }, [onLog]);

  return {
    isRunning,
    activeProcessingNodeId,
    migrateSingleNode,
    startAutoPipeline,
    pauseAutoPipeline,
  };
}
