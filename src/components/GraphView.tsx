/**
 * ============================================================================
 * GraphView Component (Interactive Dependency DAG & Tree Engine)
 * ============================================================================
 * 
 * Feature Description:
 * Implements an interactive D3-powered directed acyclic graph (DAG) visualizer
 * rendering quantitative finance dependency cones, topological stratifications,
 * organic dendritic branch corridors, status indicators, and test cones.
 * 
 * Use Cases:
 * 1. Default horizontal (left-to-right) and vertical (top-to-bottom) DAG tree inspection.
 * 2. Interactive node selection, zoom, pan, and active test tree cone isolation.
 * 3. Physics stabilization, position caching, and worker concurrency tracking.
 * ============================================================================
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Node, NodeKind, NodeStatus, UnitTestResult } from '../types';
import { areSymbolsEquivalent } from '../config/appConfig';
import { computeTreeLayout } from '../utils/treeLayout';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Pin,
  RotateCcw,
  Lock,
  Workflow,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Play,
  ArrowDownUp,
  ArrowLeftRight,
  Scan,
  Cpu,
  Layers
} from 'lucide-react';
import { isNodeGreen } from '../utils/dagTestManager';

interface GraphViewProps {
  nodes: Node[];
  onSelect: (node: Node) => void;
  selectedNodeId?: string;
  activeNodeId?: string;
  activeNodeIds?: string[];
  workerAssignments?: Record<string, number>;
  viewMode: 'cone' | 'map';
  unitTests?: UnitTestResult[];
  defaultOrientation?: 'vertical' | 'horizontal';
  onRunTestForNode?: (symbol: string) => void;
  onRunIntegrationTestForNode?: (node: Node) => void;
  onOpenWriteIntegrationTest?: (node: Node) => void;
}

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  ql_symbol: string;
  path: string;
  kind: NodeKind;
  status: NodeStatus;
  deps: string[];
  note: string;
  rank: number;
  targetX?: number;
  targetY?: number;
}

/**
 * Determines node fill color based on status and integration test verification.
 * Per specification: ONLY nodes that have an integration test are colored Green (#10b981).
 * Unit-tested kernels are colored Amber (#f59e0b).
 */
const getNodeDisplayColor = (status: NodeStatus, isGreen: boolean) => {
  if (isGreen) {
    return '#10b981'; // Emerald: Integration Tested Leaf
  }
  switch (status) {
    case 'tested':
    case 'translated':
      return '#f59e0b'; // Amber: Unit Tested Kernel / Translated
    case 'mapped':
      return '#38bdf8'; // Sky
    case 'failed':
      return '#f43f5e'; // Rose
    case 'skipped':
      return '#818cf8'; // Indigo/Purple
    case 'todo':
    default:
      return '#64748b'; // Slate
  }
};

const getStatusColor = (status: NodeStatus) => {
  return getNodeDisplayColor(status, false);
};

export default function GraphView({
  nodes,
  onSelect,
  selectedNodeId,
  activeNodeId,
  activeNodeIds = [],
  workerAssignments = {},
  viewMode,
  unitTests = [],
  defaultOrientation,
  onRunTestForNode,
  onRunIntegrationTestForNode,
  onOpenWriteIntegrationTest,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Persistent references to simulation and persistent node coordinate cache
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(null);
  const persistentPositionsRef = useRef<Map<string, { x: number; y: number; fx?: number | null; fy?: number | null }>>(new Map());
  const elementsRef = useRef<{
    nodeGroup: d3.Selection<any, any, any, any> | null;
    link: d3.Selection<any, any, any, any> | null;
    nodesData: SimulationNode[];
  }>({ nodeGroup: null, link: null, nodesData: [] });

  const [kindFilter, setKindFilter] = useState<NodeKind | 'ALL'>('ALL');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(defaultOrientation || 'horizontal');
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false); // Free-floating physics simulation by default per specification
  const [isTestTreeMode, setIsTestTreeMode] = useState<boolean>(true); // Test tree mode active by default

  // Synchronize orientation if caller provides a different defaultOrientation (e.g. Split View vertical default)
  useEffect(() => {
    if (defaultOrientation && defaultOrientation !== orientation) {
      setOrientation(defaultOrientation);
      persistentPositionsRef.current.clear();
    }
  }, [defaultOrientation]);

  const filteredNodes = useMemo(() => {
    if (kindFilter === 'ALL') return nodes;
    return nodes.filter((n) => n.kind === kindFilter);
  }, [nodes, kindFilter]);

  // Keep latest callbacks/props in refs so d3 handlers don't need to rebuild
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const nodesPropRef = useRef(nodes);
  nodesPropRef.current = nodes;

  // Selected node object
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Compute the upstream Test Tree for the currently selected node
  const activeTestTree = useMemo(() => {
    if (!selectedNode) return null;

    const visited = new Set<string>();
    const treeNodes: Node[] = [];

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const curr = nodes.find((n) => n.id === nodeId);
      if (!curr) return;
      curr.deps.forEach((depId) => traverse(depId));
      treeNodes.push(curr);
    };

    traverse(selectedNode.id);

    const isTested = (n: Node) => {
      if (n.status === 'tested') return true;
      return unitTests.some(
        (t) => (t.targetNodeId === n.id || areSymbolsEquivalent(t.targetSymbol, n.ql_symbol)) && t.status === 'passed'
      );
    };

    const testedCount = treeNodes.filter(isTested).length;
    const totalCount = treeNodes.length;
    const percent = totalCount > 0 ? Math.round((testedCount / totalCount) * 100) : 0;
    const untested = treeNodes.filter((n) => !isTested(n));

    return {
      treeNodes,
      nodeIdSet: visited,
      testedCount,
      totalCount,
      percent,
      untested,
      isFullyTested: testedCount === totalCount,
    };
  }, [nodes, selectedNode, unitTests]);

  // Compute topological rank / layer depth for each node in the DAG
  const nodeRanks = useMemo(() => {
    const ranks = new Map<string, number>();

    const getRank = (id: string, depth = 0): number => {
      if (depth > 20) return 0; // cycle guard
      if (ranks.has(id)) return ranks.get(id)!;
      const node = nodes.find((n) => n.id === id);
      if (!node || node.deps.length === 0) {
        ranks.set(id, 0);
        return 0;
      }
      let maxDepRank = 0;
      for (const d of node.deps) {
        maxDepRank = Math.max(maxDepRank, getRank(d, depth + 1) + 1);
      }
      ranks.set(id, maxDepRank);
      return maxDepRank;
    };

    nodes.forEach((n) => getRank(n.id));
    return ranks;
  }, [nodes]);

  // 1. INITIALIZE OR RESTRUCTURE GRAPH (ONLY when filteredNodes count/IDs, viewMode, or orientation changes)
  const nodeIdsKey = useMemo(() => {
    return `${viewMode}_${orientation}_${filteredNodes.map((n) => n.id).sort().join(',')}`;
  }, [filteredNodes, viewMode, orientation]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Arrow markers
    const defs = svg.append('defs');
    
    // Normal link marker
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 21)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    // Tested link marker (emerald)
    defs
      .append('marker')
      .attr('id', 'arrow-tested')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 21)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981');

    // Warning/untested link marker (amber)
    defs
      .append('marker')
      .attr('id', 'arrow-warning')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 21)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    // Create container group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-main-group');

    // Zoom setup with saved transform if possible (expanded scale extent to [0.08, 4] for 150-200 nodes)
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Compute organic hierarchical tree coordinates that reflect the true function structure
    const treePositions = computeTreeLayout(filteredNodes, {
      orientation,
      width,
      height,
    });

    let maxRank = 0;
    const simNodes: SimulationNode[] = filteredNodes.map((n) => {
      const rank = nodeRanks.get(n.id) || 0;
      if (rank > maxRank) maxRank = rank;
      const tPos = treePositions.get(n.id) || { x: width / 2, y: height / 2 };
      
      const cached = persistentPositionsRef.current.get(n.id);
      const x = cached ? cached.x : tPos.x;
      const y = cached ? cached.y : tPos.y;
      const fx = isLocked ? (cached ? cached.fx ?? x : tPos.x) : (cached ? cached.fx : null);
      const fy = isLocked ? (cached ? cached.fy ?? y : tPos.y) : (cached ? cached.fy : null);

      return {
        ...n,
        rank,
        targetX: tPos.x,
        targetY: tPos.y,
        x,
        y,
        fx,
        fy,
      };
    });

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const links: Array<{ source: SimulationNode; target: SimulationNode }> = [];
    filteredNodes.forEach((n) => {
      n.deps.forEach((d) => {
        const sourceNode = nodeMap.get(d);
        const targetNode = nodeMap.get(n.id);
        if (sourceNode && targetNode) {
          links.push({ source: sourceNode, target: targetNode });
        }
      });
    });

    // Layout configuration: anchor gracefully to hierarchical tree coordinates
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(viewMode === 'cone' ? 95 : 120)
          .strength(0.12)
      )
      .force('charge', d3.forceManyBody().strength(-90))
      .force('collision', d3.forceCollide().radius(42))
      .force('x', d3.forceX((d: any) => d.targetX || width / 2).strength(0.92))
      .force('y', d3.forceY((d: any) => d.targetY || height / 2).strength(0.92))
      .alphaDecay(0.06);

    simulationRef.current = simulation;

    // Draw Links as Organic Dendritic Tree Branches (Cubic Bézier Paths)
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (d) => (isNodeGreen(d.source, unitTests) ? '#059669' : d.source.status === 'tested' ? '#b45309' : '#334155'))
      .attr('stroke-width', (d) => (isNodeGreen(d.source, unitTests) ? 2.5 : d.source.status === 'tested' ? 2 : 1.5))
      .attr('stroke-dasharray', (d) => (isNodeGreen(d.source, unitTests) ? 'none' : '4 2'))
      .attr('marker-end', (d) => (isNodeGreen(d.source, unitTests) ? 'url(#arrow-tested)' : 'url(#arrow)'));

    // Draw Node Groups
    const nodeGroup = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SimulationNode>('g')
      .data(simNodes, (d) => d.id)
      .join('g')
      .attr('class', 'node-element')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.15).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (!isLocked) {
              d.fx = null;
              d.fy = null;
            }
            if (d.x !== undefined && d.y !== undefined) {
              persistentPositionsRef.current.set(d.id, { x: d.x, y: d.y, fx: d.fx, fy: d.fy });
            }
          })
      );

    // Active pulse ring holder
    nodeGroup
      .append('circle')
      .attr('class', 'active-ring')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    // Selection ring holder
    nodeGroup
      .append('circle')
      .attr('class', 'selection-ring')
      .attr('r', 20)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    // Tested outer glow ring (shown ONLY when integration tested green leaf)
    nodeGroup
      .append('circle')
      .attr('class', 'tested-glow-ring')
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', 'none')
      .attr('opacity', (d) => (isNodeGreen(d, unitTests) ? 0.8 : 0))
      .attr('pointer-events', 'none');

    // Node body circle
    nodeGroup
      .append('circle')
      .attr('class', 'body-circle')
      .attr('r', 13)
      .attr('fill', (d) => getNodeDisplayColor(d.status, isNodeGreen(d, unitTests)))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))');

    // Inner icon or dot
    nodeGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none');

    // Multi-Worker Badge Group (above node)
    const workerBadgeG = nodeGroup
      .append('g')
      .attr('class', 'worker-badge-group')
      .attr('transform', 'translate(0, -22)')
      .attr('pointer-events', 'none')
      .attr('opacity', 0);

    workerBadgeG
      .append('rect')
      .attr('class', 'worker-badge-bg')
      .attr('x', -14)
      .attr('y', -7)
      .attr('width', 28)
      .attr('height', 15)
      .attr('rx', 4)
      .attr('fill', '#0284c7')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1);

    workerBadgeG
      .append('text')
      .attr('class', 'worker-badge-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '4px')
      .attr('fill', '#ffffff')
      .attr('font-size', '8.5px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', 'bold')
      .text('W1');

    // Tested badge icon group in top-right
    const badgeG = nodeGroup
      .append('g')
      .attr('class', 'tested-badge-group')
      .attr('transform', 'translate(10, -10)')
      .attr('pointer-events', 'none')
      .attr('opacity', (d) => (isNodeGreen(d, unitTests) || d.status === 'tested' || isTestTreeMode ? 1 : 0));

    badgeG
      .append('circle')
      .attr('class', 'tested-badge-bg')
      .attr('r', 7)
      .attr('fill', (d) => (isNodeGreen(d, unitTests) ? '#065f46' : d.status === 'tested' ? '#78350f' : '#1e293b'))
      .attr('stroke', (d) => (isNodeGreen(d, unitTests) ? '#10b981' : d.status === 'tested' ? '#f59e0b' : '#64748b'))
      .attr('stroke-width', 1.5);

    badgeG
      .append('text')
      .attr('class', 'tested-badge-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3px')
      .attr('fill', '#ffffff')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold')
      .text((d) => (isNodeGreen(d, unitTests) ? '✓' : d.status === 'tested' ? 'λ' : '⏳'));

    // Label background pill
    nodeGroup
      .append('rect')
      .attr('class', 'label-bg-pill')
      .attr('x', -40)
      .attr('y', 16)
      .attr('width', 80)
      .attr('height', 26)
      .attr('rx', 5)
      .attr('fill', '#020617')
      .attr('stroke', (d) => (isNodeGreen(d, unitTests) ? '#059669' : d.status === 'tested' ? '#b45309' : '#1e293b'))
      .attr('stroke-width', 1)
      .attr('opacity', 0.95)
      .attr('pointer-events', 'none');

    // Label symbol text
    nodeGroup
      .append('text')
      .text((d) => d.ql_symbol)
      .attr('text-anchor', 'middle')
      .attr('y', 27)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none');

    // Status tag under symbol (e.g. "✓ INTEGRATION", "λ UNIT TESTED" or "TODO")
    nodeGroup
      .append('text')
      .attr('class', 'status-tag-text')
      .attr('text-anchor', 'middle')
      .attr('y', 38)
      .attr('fill', (d) => (isNodeGreen(d, unitTests) ? '#34d399' : d.status === 'tested' ? '#fbbf24' : '#94a3b8'))
      .attr('font-size', '7px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '700')
      .attr('pointer-events', 'none')
      .text((d) => (isNodeGreen(d, unitTests) ? '✓ INTEGRATION' : d.status === 'tested' ? 'λ UNIT TESTED' : d.status.toUpperCase()));

    // Hover & Click Events
    nodeGroup
      .on('click', (_, d) => {
        const originalNode = nodesPropRef.current.find((n) => n.id === d.id);
        if (originalNode) onSelectRef.current(originalNode);
      })
      .on('mouseenter', (_, d) => {
        const originalNode = nodesPropRef.current.find((n) => n.id === d.id);
        if (originalNode) setHoveredNode(originalNode);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Store references
    elementsRef.current = {
      nodeGroup,
      link,
      nodesData: simNodes,
    };

    // Position updates on tick
    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const sx = d.source.x ?? 0;
        const sy = d.source.y ?? 0;
        const tx = d.target.x ?? 0;
        const ty = d.target.y ?? 0;

        if (orientation === 'vertical') {
          // Vertical tree: curves organically from parent/dependency to child
          const dy = ty - sy;
          const cy1 = sy + dy * 0.45;
          const cy2 = ty - dy * 0.45;
          return `M ${sx},${sy} C ${sx},${cy1} ${tx},${cy2} ${tx},${ty}`;
        } else {
          // Horizontal tree: curves organically left-to-right
          const dx = tx - sx;
          const cx1 = sx + dx * 0.45;
          const cx2 = tx - dx * 0.45;
          return `M ${sx},${sy} C ${cx1},${sy} ${cx2},${ty} ${tx},${ty}`;
        }
      });

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      // Cache persistent positions continuously
      simNodes.forEach((n) => {
        if (n.x !== undefined && n.y !== undefined) {
          persistentPositionsRef.current.set(n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy });
        }
      });
    });

    // When simulation cools down, pin positions if lock mode is on
    simulation.on('end', () => {
      if (isLocked) {
        simNodes.forEach((n) => {
          n.fx = n.x;
          n.fy = n.y;
        });
      }
    });

    // Auto-fit tree view smoothly on initial load
    if (simNodes.length > 0) {
      setTimeout(() => {
        if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth || 800;
        const containerHeight = containerRef.current.clientHeight || 600;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        simNodes.forEach((d) => {
          const x = d.x ?? d.targetX ?? 0;
          const y = d.y ?? d.targetY ?? 0;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });

        const padding = 70;
        const graphWidth = Math.max(100, maxX - minX + padding * 2);
        const graphHeight = Math.max(100, maxY - minY + padding * 2);

        const scale = Math.max(0.08, Math.min(1.0, Math.min(containerWidth / graphWidth, containerHeight / graphHeight)));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const translateX = containerWidth / 2 - centerX * scale;
        const translateY = containerHeight / 2 - centerY * scale;

        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
        d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, transform);
      }, 50);
    }

    return () => {
      simulation.stop();
    };
  }, [nodeIdsKey]);

  // 2. SURGICAL VISUAL UPDATES (Node status, test tree highlight, tested badges)
  useEffect(() => {
    const { nodeGroup, link, nodesData } = elementsRef.current;
    if (!nodeGroup || !link || nodesData.length === 0) return;

    // Determine the active test tree if a node is selected
    const testTreeSet = new Set<string>();
    if (selectedNodeId) {
      const traverse = (id: string) => {
        if (testTreeSet.has(id)) return;
        testTreeSet.add(id);
        const n = nodes.find((item) => item.id === id);
        if (n) {
          n.deps.forEach((depId) => traverse(depId));
        }
      };
      traverse(selectedNodeId);
    }

    nodeGroup.each(function (d) {
      const currentNode = nodes.find((n) => n.id === d.id);
      if (currentNode) {
        d.status = currentNode.status;
      }

      const isGreen = isNodeGreen(currentNode || d, unitTests);
      const isTested = currentNode ? (currentNode.status === 'tested' || currentNode.status === 'translated') : (d.status === 'tested');
      const inActiveTestTree = testTreeSet.size > 0 ? testTreeSet.has(d.id) : true;

      d3.select(this)
        .select('.body-circle')
        .transition()
        .duration(200)
        .attr('fill', getNodeDisplayColor(currentNode ? currentNode.status : d.status, isGreen));

      // Opacity: emphasize test tree when a node is selected
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', selectedNodeId ? (inActiveTestTree ? 1.0 : isTestTreeMode ? 0.25 : 0.4) : 1.0);

      // Tested outer glow ring (shown ONLY when green leaf integration tested)
      d3.select(this)
        .select('.tested-glow-ring')
        .transition()
        .duration(200)
        .attr('opacity', isGreen ? 0.8 : 0);

      // Tested badge icon group in top right
      const badgeG = d3.select(this).select('.tested-badge-group');
      badgeG.attr('opacity', isGreen || isTested || isTestTreeMode ? 1 : 0);
      badgeG.select('.tested-badge-bg')
        .attr('fill', isGreen ? '#065f46' : isTested ? '#78350f' : '#1e293b')
        .attr('stroke', isGreen ? '#10b981' : isTested ? '#f59e0b' : '#64748b');
      badgeG.select('.tested-badge-text').text(isGreen ? '✓' : isTested ? 'λ' : '⏳');

      // Status text
      d3.select(this)
        .select('.status-tag-text')
        .attr('fill', isGreen ? '#34d399' : isTested ? '#fbbf24' : '#94a3b8')
        .text(isGreen ? '✓ INTEGRATION' : isTested ? 'λ UNIT TESTED' : (currentNode ? currentNode.status.toUpperCase() : d.status.toUpperCase()));

      // Label background pill border
      d3.select(this)
        .select('.label-bg-pill')
        .attr('stroke', isGreen ? '#059669' : isTested ? '#b45309' : '#1e293b');

      // Worker badge and active node ring
      const isActive = (activeNodeIds && activeNodeIds.includes(d.id)) || d.id === activeNodeId;
      const workerId = workerAssignments?.[d.id] || 1;
      const workerColors = [
        { bg: '#0369a1', border: '#38bdf8' }, // W1 Sky
        { bg: '#047857', border: '#34d399' }, // W2 Emerald
        { bg: '#6d28d9', border: '#c084fc' }, // W3 Purple
      ];
      const colorPreset = workerColors[(workerId - 1) % workerColors.length];

      const workerBadge = d3.select(this).select('.worker-badge-group');
      if (isActive) {
        workerBadge.attr('opacity', 1);
        workerBadge.select('.worker-badge-bg').attr('fill', colorPreset.bg).attr('stroke', colorPreset.border);
        workerBadge.select('.worker-badge-text').text(`W${workerId}`);
      } else {
        workerBadge.attr('opacity', 0);
      }

      const activeRing = d3.select(this).select('.active-ring');
      if (isActive) {
        activeRing.attr('opacity', 0.9).attr('class', 'active-ring animate-ping').attr('stroke', colorPreset.border);
      } else {
        activeRing.attr('opacity', 0).attr('class', 'active-ring');
      }

      // Selection ring
      const isSelected = d.id === selectedNodeId;
      d3.select(this)
        .select('.selection-ring')
        .attr('opacity', isSelected ? 1 : 0);
    });

    // Update link strokes based on tested status and test tree membership
    link
      .transition()
      .duration(200)
      .attr('stroke', (d: any) => {
        const sourceNode = nodes.find((n) => n.id === d.source.id);
        const sourceIsGreen = sourceNode ? isNodeGreen(sourceNode, unitTests) : false;
        const sourceIsTested = sourceNode?.status === 'tested' || sourceNode?.status === 'translated';
        const inTree = testTreeSet.has(d.source.id) && testTreeSet.has(d.target.id);
        if (inTree) {
          return sourceIsGreen ? '#10b981' : sourceIsTested ? '#f59e0b' : '#38bdf8';
        }
        return sourceIsGreen ? '#059669' : sourceIsTested ? '#b45309' : '#334155';
      })
      .attr('stroke-width', (d: any) => {
        const inTree = testTreeSet.has(d.source.id) && testTreeSet.has(d.target.id);
        return inTree ? 2.5 : 1.5;
      })
      .attr('opacity', (d: any) => {
        if (!selectedNodeId) return 0.85;
        const inTree = testTreeSet.has(d.source.id) && testTreeSet.has(d.target.id);
        return inTree ? 1.0 : 0.15;
      })
      .attr('stroke-dasharray', (d: any) => {
        const sourceNode = nodes.find((n) => n.id === d.source.id);
        const sourceIsGreen = sourceNode ? isNodeGreen(sourceNode, unitTests) : false;
        return sourceIsGreen ? 'none' : '4 2';
      })
      .attr('marker-end', (d: any) => {
        const sourceNode = nodes.find((n) => n.id === d.source.id);
        const sourceIsGreen = sourceNode ? isNodeGreen(sourceNode, unitTests) : false;
        return sourceIsGreen ? 'url(#arrow-tested)' : 'url(#arrow)';
      });
  }, [nodes, activeNodeId, activeNodeIds, workerAssignments, selectedNodeId, isTestTreeMode, unitTests]);

  // Toggle layout lock/unlock
  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    const { nodesData } = elementsRef.current;
    if (simulationRef.current && nodesData) {
      nodesData.forEach((n) => {
        if (nextLocked) {
          n.fx = n.x;
          n.fy = n.y;
        } else {
          n.fx = null;
          n.fy = null;
        }
      });
      if (!nextLocked) {
        simulationRef.current.alphaTarget(0.1).restart();
      }
    }
  };

  // Re-organize DAG into hierarchical functional tree structure
  const handleReorganizeLayout = () => {
    persistentPositionsRef.current.clear();
    const { nodesData } = elementsRef.current;
    if (!containerRef.current || !nodesData) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const treePositions = computeTreeLayout(nodesData, {
      orientation,
      width,
      height,
    });

    nodesData.forEach((node) => {
      const tPos = treePositions.get(node.id) || { x: width / 2, y: height / 2 };
      node.targetX = tPos.x;
      node.targetY = tPos.y;
      node.x = tPos.x;
      node.y = tPos.y;
      node.fx = isLocked ? tPos.x : null;
      node.fy = isLocked ? tPos.y : null;
      persistentPositionsRef.current.set(node.id, { x: tPos.x, y: tPos.y, fx: node.fx, fy: node.fy });
    });

    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart();
    }
  };

  // Zoom helpers
  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Smart Fit to View: Auto-scales and centers the entire graph (whether 16 nodes or 150 nodes)
  const handleFitView = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const { nodesData } = elementsRef.current;
    if (!nodesData || nodesData.length === 0) {
      handleResetZoom();
      return;
    }

    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 600;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodesData.forEach((d) => {
      const x = d.x ?? d.targetX ?? 0;
      const y = d.y ?? d.targetY ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Add margin around nodes
    const padding = 60;
    const graphWidth = Math.max(100, maxX - minX + padding * 2);
    const graphHeight = Math.max(100, maxY - minY + padding * 2);

    const scale = Math.max(0.08, Math.min(1.2, Math.min(containerWidth / graphWidth, containerHeight / graphHeight)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const translateX = containerWidth / 2 - centerX * scale;
    const translateY = containerHeight / 2 - centerY * scale;

    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, transform);
  };

  // Dynamically observe container resizing (e.g., entering Split View or resizing panels)
  // to ensure graph coordinates remain centered and comfortably bounded.
  useEffect(() => {
    if (!containerRef.current) return;
    let resizeTimer: NodeJS.Timeout | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        handleFitView();
      }, 80);
    });

    observer.observe(containerRef.current);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [orientation, nodes.length]);

  const totalTestedCount = nodes.filter((n) => n.status === 'tested').length;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-950 select-none">
      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating Toolbar & Filter */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur p-1.5 rounded-lg border border-slate-800 shadow-xl text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-[11px] px-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Kind:
          </span>
          {(['ALL', 'pure_math', 'solver', 'date_logic'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                kindFilter === k
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {k === 'ALL' ? 'ALL' : k.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Test Tree View Toggle */}
        <button
          onClick={() => setIsTestTreeMode(!isTestTreeMode)}
          className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            isTestTreeMode
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
          }`}
          title="Toggle Test Tree Mode: highlights tested nodes and upstream dependency coverage"
        >
          <Workflow className={`w-3.5 h-3.5 ${isTestTreeMode ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Test Tree Mode</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-700 font-bold">
            {totalTestedCount}/{nodes.length} Tested
          </span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Orientation Toggle: Horizontal (Left-to-Right) / Vertical (Top-to-Bottom) */}
        <button
          onClick={() => {
            const nextOrientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
            setOrientation(nextOrientation);
            persistentPositionsRef.current.clear();
          }}
          className="px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60 bg-slate-900"
          title={`Switch to ${orientation === 'horizontal' ? 'Vertical (Top-to-Bottom)' : 'Horizontal (Left-to-Right)'} DAG tree view`}
        >
          {orientation === 'horizontal' ? (
            <ArrowLeftRight className="w-3 h-3 text-sky-400" />
          ) : (
            <ArrowDownUp className="w-3 h-3 text-sky-400" />
          )}
          <span className="capitalize">{orientation}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Layout Stabilizer & Lock Controls (Free by default) */}
        <button
          onClick={handleToggleLock}
          className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
            !isLocked
              ? 'bg-sky-950/80 text-sky-300 border border-sky-700/80 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={isLocked ? 'Layout is locked in stable DAG positions (click to float freely with spring physics)' : 'Layout is free-floating with organic spring physics (default - click to lock)'}
        >
          {isLocked ? <Lock className="w-3 h-3 text-slate-400" /> : <Sparkles className="w-3 h-3 text-sky-400" />}
          <span>{isLocked ? 'Stable' : 'Free (Default)'}</span>
        </button>

        <button
          onClick={handleReorganizeLayout}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Re-align DAG nodes to hierarchical functional tree structure"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Active Parallel Workers HUD Banner */}
      {activeNodeIds && activeNodeIds.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/95 border border-sky-500/60 shadow-2xl rounded-full px-3.5 py-1.5 backdrop-blur font-mono text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span>Workers Active ({activeNodeIds.length})</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />
          <div className="flex items-center gap-1.5">
            {activeNodeIds.map((nodeId) => {
              const activeNode = nodes.find((n) => n.id === nodeId);
              const workerId = workerAssignments?.[nodeId] || 1;
              const workerColors = [
                { bg: 'bg-sky-950/80', text: 'text-sky-300', border: 'border-sky-500/80', badge: 'bg-sky-600' },
                { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/80', badge: 'bg-emerald-600' },
                { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-500/80', badge: 'bg-purple-600' },
              ];
              const c = workerColors[(workerId - 1) % workerColors.length];
              return (
                <div
                  key={nodeId}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text} text-[11px]`}
                >
                  <span className={`px-1 rounded text-[9px] font-bold text-white ${c.badge}`}>W{workerId}</span>
                  <span className="font-semibold truncate max-w-[110px]">{activeNode?.ql_symbol || nodeId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-800 shadow-xl text-xs">
        <button
          onClick={handleFitView}
          className="px-2 py-1 text-sky-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px] font-medium"
          title="Auto-Fit all nodes into screen view (essential for 150-node DAG)"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Fit DAG ({filteredNodes.length})</span>
        </button>
        <div className="h-4 w-px bg-slate-800 my-auto" />
        <button
          onClick={() => handleZoom(1.3)}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.7)}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Zoom (1:1)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Floating Test Tree HUD */}
      {selectedNode && activeTestTree ? (
        <div className="absolute top-14 right-3 z-20 w-80 max-w-[calc(100vw-24px)] p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur font-mono text-xs text-slate-200 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <Workflow className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-bold text-white truncate">{selectedNode.ql_symbol}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
              DAG Test Tree
            </span>
          </div>

          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Prerequisites Tested:</span>
              <span className={`font-bold ${activeTestTree.isFullyTested ? 'text-emerald-400' : 'text-amber-400'}`}>
                {activeTestTree.testedCount}/{activeTestTree.totalCount} ({activeTestTree.percent}%)
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  activeTestTree.isFullyTested ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${activeTestTree.percent}%` }}
              />
            </div>

            {/* Green Leaf or Integration Status */}
            {isNodeGreen(selectedNode, unitTests) ? (
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center gap-2 text-[11px] text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Green Leaf Verified:</strong> Integration test passed with full Autograd risk matrix parity.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTestTree.isFullyTested ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>All prerequisite nodes tested. Ready for integration test.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-sans">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{activeTestTree.untested.length} untested prerequisite node(s):</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {activeTestTree.untested.map((un) => (
                        <div
                          key={un.id}
                          className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-[10px] text-amber-300 flex items-center gap-1"
                        >
                          <span className="truncate max-w-[120px]">{un.ql_symbol}</span>
                          {onRunTestForNode && (
                            <button
                              onClick={() => onRunTestForNode(un.ql_symbol)}
                              className="text-[9px] bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-1 rounded cursor-pointer"
                              title="Run unit test now"
                            >
                              Test
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integration Tests From Green Nodes */}
                {(() => {
                  const greenPrereqs = activeTestTree.treeNodes.filter(
                    (n) => n.id !== selectedNode.id && isNodeGreen(n, unitTests)
                  );
                  return (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      {greenPrereqs.length > 0 && (
                        <div className="text-[10px] text-emerald-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" /> Green Checkpoints:
                          </span>
                          <span className="font-bold">{greenPrereqs.map((g) => g.ql_symbol).join(', ')}</span>
                        </div>
                      )}
                      {onRunIntegrationTestForNode && (
                        <button
                          onClick={() => onRunIntegrationTestForNode(selectedNode)}
                          className="w-full py-1.5 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Integration Test {greenPrereqs.length > 0 ? '(From Green Checkpoints)' : ''}</span>
                        </button>
                      )}
                      {onOpenWriteIntegrationTest && (
                        <button
                          onClick={() => onOpenWriteIntegrationTest(selectedNode)}
                          className="w-full py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3 h-3 text-purple-400" />
                          <span>Author Custom Integration Test</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Hovered Node Tooltip Card */}
      {hoveredNode && !selectedNode && (
        <div className="absolute bottom-12 left-3 z-20 p-2.5 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl text-xs font-mono text-slate-200 pointer-events-none max-w-xs backdrop-blur">
          <div className="font-bold text-sky-400">{hoveredNode.ql_symbol}</div>
          <div className="text-[10px] text-slate-400 truncate">{hoveredNode.path}</div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span>
              Status:{' '}
              <strong className={isNodeGreen(hoveredNode, unitTests) ? 'text-emerald-400 uppercase font-bold' : hoveredNode.status === 'tested' ? 'text-amber-400 uppercase' : 'text-slate-200 uppercase'}>
                {isNodeGreen(hoveredNode, unitTests) ? '✓ GREEN LEAF (INTEGRATION TESTED)' : hoveredNode.status === 'tested' ? 'λ UNIT TESTED' : hoveredNode.status}
              </strong>
            </span>
            <span>Kind: <strong className="text-cyan-400">{hoveredNode.kind}</strong></span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deps: {hoveredNode.deps.length} upstream</div>
        </div>
      )}

      {/* Status Legend at bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-500 font-semibold">DAG TEST TREE:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40"></span> ✓ Green Leaf (Integration Tested)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> λ Unit Tested Kernel
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> AST Mapped IR
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Pending Todo
          </span>
          <span className="flex items-center gap-1 text-slate-500 border-l border-slate-800 pl-2">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span className="text-sky-300 font-bold">W1-W3</span> Parallel Workers
          </span>
        </div>
        <div className="hidden sm:block text-slate-500 text-[10px]">
          Only integration-tested leaves are colored green • Trigger tests from green checkpoints
        </div>
      </div>
    </div>
  );
}
