/**
 * ============================================================================
 * Project DAG State & Topological Hierarchy Hook (useProjectDag)
 * ============================================================================
 * 
 * Feature Description:
 * Manages the dependency Directed Acyclic Graph (DAG) state, topological sorting,
 * active node selection, node lifecycle updates (todo -> mapped -> translated -> tested),
 * and preset loading across all quantitative finance archetypes.
 * 
 * Use Cases:
 * 1. Selecting and inspecting nodes in the 2D/3D topological canvas.
 * 2. Traversing upstream and downstream dependencies for targeted root-to-leaf cones.
 * 3. Computing live migration metrics (translated percentage, tested count, failed nodes).
 * 4. Switching presets seamlessly between ultra-deep 150-node enterprise graphs,
 *    QuantLib equity options, fixed income curves, and math primitives.
 * ============================================================================
 */

import { useState, useMemo, useCallback } from 'react';
import { Node, ProjectConfig } from '../types';
import { initialNodes as defaultPresetNodes } from '../data';
import { massive150PipelineNodes } from '../data/massivePipelineData';
import { logClientFunctionCall } from '../utils/logger';

export interface DagStats {
  total: number;
  todo: number;
  mapped: number;
  translated: number;
  tested: number;
  failed: number;
  progressPercent: number;
}

/**
 * Custom React hook for managing the DAG nodes, selection, and topological metrics.
 *
 * @param initialConfig - Current project configuration
 * @returns State and controller methods for DAG management
 */
export function useProjectDag(initialConfig: ProjectConfig) {
  logClientFunctionCall('useProjectDag', 'init', { presetId: initialConfig.presetId });

  // Initialize nodes according to chosen preset
  const initialList = initialConfig?.presetId === 'massive_enterprise_150_dag'
    ? (Array.isArray(massive150PipelineNodes) ? [...massive150PipelineNodes] : [])
    : (Array.isArray(defaultPresetNodes) ? [...defaultPresetNodes] : []);

  const [nodes, setNodes] = useState<Node[]>(initialList);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    const defaultNode = initialList.find((n) => n.id === 'engine_analytic_european') || initialList[0];
    return defaultNode ? defaultNode.id : null;
  });

  // Active selected node reference
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  /**
   * Computed summary statistics of node statuses
   */
  const stats: DagStats = useMemo(() => {
    const total = nodes.length;
    if (total === 0) {
      return { total: 0, todo: 0, mapped: 0, translated: 0, tested: 0, failed: 0, progressPercent: 0 };
    }
    const todo = nodes.filter((n) => n.status === 'todo').length;
    const mapped = nodes.filter((n) => n.status === 'mapped').length;
    const translated = nodes.filter((n) => n.status === 'translated').length;
    const tested = nodes.filter((n) => n.status === 'tested').length;
    const failed = nodes.filter((n) => n.status === 'failed').length;
    const progressPercent = Math.round(((translated + tested) / total) * 100);

    return { total, todo, mapped, translated, tested, failed, progressPercent };
  }, [nodes]);

  /**
   * Updates a specific node's fields (e.g. status, pythonCode, or tests).
   *
   * @param id - Target node ID
   * @param updates - Partial node updates
   */
  const updateNode = useCallback((id: string, updates: Partial<Node>) => {
    logClientFunctionCall('useProjectDag', 'updateNode', { id, updates: Object.keys(updates) });
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === id ? { ...node, ...updates } : node))
    );
  }, []);

  /**
   * Selects a node by its identifier.
   *
   * @param id - Target node identifier
   */
  const selectNode = useCallback((id: string | null) => {
    logClientFunctionCall('useProjectDag', 'selectNode', { id });
    setSelectedNodeId(id);
  }, []);

  /**
   * Resets the entire DAG state back to a designated preset.
   *
   * @param presetId - Preset identifier ('massive_enterprise_150_dag' | etc.)
   */
  const resetToPreset = useCallback((presetId: string) => {
    logClientFunctionCall('useProjectDag', 'resetToPreset', { presetId });
    if (presetId === 'massive_enterprise_150_dag') {
      setNodes([...massive150PipelineNodes]);
      setSelectedNodeId(massive150PipelineNodes[0]?.id || null);
    } else {
      setNodes([...defaultPresetNodes]);
      setSelectedNodeId(defaultPresetNodes[0]?.id || null);
    }
  }, []);

  /**
   * Identifies the next eligible unmigrated node whose dependencies are all satisfied.
   *
   * @returns Next node ready for migration or undefined
   */
  const getNextEligibleNode = useCallback((): Node | undefined => {
    logClientFunctionCall('useProjectDag', 'getNextEligibleNode');
    return nodes.find((node) => {
      if (node.status === 'tested' || node.status === 'translated') {
        return false;
      }
      // Check if all upstream dependencies are satisfied
      const allDepsSatisfied = node.deps.every((depId) => {
        const depNode = nodes.find((n) => n.id === depId);
        return depNode && (depNode.status === 'tested' || depNode.status === 'translated');
      });
      return allDepsSatisfied;
    });
  }, [nodes]);

  return {
    nodes,
    setNodes,
    selectedNodeId,
    selectedNode,
    selectNode,
    updateNode,
    stats,
    resetToPreset,
    getNextEligibleNode,
  };
}
