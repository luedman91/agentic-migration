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
  Scan
} from 'lucide-react';

interface GraphViewProps {
  nodes: Node[];
  onSelect: (node: Node) => void;
  selectedNodeId?: string;
  activeNodeId?: string;
  viewMode: 'cone' | 'map';
  unitTests?: UnitTestResult[];
  onRunTestForNode?: (symbol: string) => void;
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

// Color mapping based on status
const getStatusColor = (status: NodeStatus) => {
  switch (status) {
    case 'tested':
      return '#10b981'; // Emerald
    case 'translated':
      return '#f59e0b'; // Amber
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

export default function GraphView({
  nodes,
  onSelect,
  selectedNodeId,
  activeNodeId,
  viewMode,
  unitTests = [],
  onRunTestForNode,
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
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical'); // Vertical tree layout by default
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true); // Pin layout once converged
  const [isTestTreeMode, setIsTestTreeMode] = useState<boolean>(true); // Test tree mode active by default

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
      .attr('refX', orientation === 'vertical' ? 24 : 26)
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
      .attr('refX', orientation === 'vertical' ? 24 : 26)
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
      .attr('refX', orientation === 'vertical' ? 24 : 26)
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
          .distance(viewMode === 'cone' ? 85 : 105)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength(-140))
      .force('collision', d3.forceCollide().radius(45))
      .force('x', d3.forceX((d: any) => d.targetX || width / 2).strength(0.85))
      .force('y', d3.forceY((d: any) => d.targetY || height / 2).strength(0.85))
      .alphaDecay(0.06);

    simulationRef.current = simulation;

    // Draw Links
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => (d.source.status === 'tested' ? '#059669' : '#334155'))
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => (d.source.status === 'tested' ? 'none' : '4 2'))
      .attr('marker-end', (d) => (d.source.status === 'tested' ? 'url(#arrow-tested)' : 'url(#arrow)'));

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

    // Tested outer glow ring (shown when tested)
    nodeGroup
      .append('circle')
      .attr('class', 'tested-glow-ring')
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', 'none')
      .attr('opacity', (d) => (d.status === 'tested' ? 0.7 : 0))
      .attr('pointer-events', 'none');

    // Node body circle
    nodeGroup
      .append('circle')
      .attr('class', 'body-circle')
      .attr('r', 13)
      .attr('fill', (d) => getStatusColor(d.status))
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

    // Tested badge icon group in top-right
    const badgeG = nodeGroup
      .append('g')
      .attr('class', 'tested-badge-group')
      .attr('transform', 'translate(10, -10)')
      .attr('pointer-events', 'none')
      .attr('opacity', (d) => (d.status === 'tested' || isTestTreeMode ? 1 : 0));

    badgeG
      .append('circle')
      .attr('class', 'tested-badge-bg')
      .attr('r', 7)
      .attr('fill', (d) => (d.status === 'tested' ? '#065f46' : '#78350f'))
      .attr('stroke', (d) => (d.status === 'tested' ? '#10b981' : '#f59e0b'))
      .attr('stroke-width', 1.5);

    badgeG
      .append('text')
      .attr('class', 'tested-badge-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3px')
      .attr('fill', '#ffffff')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold')
      .text((d) => (d.status === 'tested' ? '✓' : '⏳'));

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
      .attr('stroke', (d) => (d.status === 'tested' ? '#059669' : '#1e293b'))
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

    // Status tag under symbol (e.g. "✓ TESTED" or "TODO")
    nodeGroup
      .append('text')
      .attr('class', 'status-tag-text')
      .attr('text-anchor', 'middle')
      .attr('y', 38)
      .attr('fill', (d) => (d.status === 'tested' ? '#34d399' : '#94a3b8'))
      .attr('font-size', '7.5px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', '700')
      .attr('pointer-events', 'none')
      .text((d) => (d.status === 'tested' ? '✓ TESTED' : d.status.toUpperCase()));

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
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

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

    // Auto-fit immediately if large graph (>20 nodes like 150-node enterprise pipeline)
    if (simNodes.length > 20) {
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

        const padding = 60;
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
        d3.select(this)
          .select('.body-circle')
          .transition()
          .duration(200)
          .attr('fill', getStatusColor(currentNode.status));
      }

      const isTested = d.status === 'tested';
      const inActiveTestTree = testTreeSet.size > 0 ? testTreeSet.has(d.id) : true;

      // Opacity: emphasize test tree when a node is selected
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', selectedNodeId ? (inActiveTestTree ? 1.0 : isTestTreeMode ? 0.25 : 0.4) : 1.0);

      // Tested outer glow ring
      d3.select(this)
        .select('.tested-glow-ring')
        .transition()
        .duration(200)
        .attr('opacity', isTested ? 0.7 : 0);

      // Tested badge icon group in top right
      const badgeG = d3.select(this).select('.tested-badge-group');
      badgeG.attr('opacity', isTested || isTestTreeMode ? 1 : 0);
      badgeG.select('.tested-badge-bg')
        .attr('fill', isTested ? '#065f46' : '#78350f')
        .attr('stroke', isTested ? '#10b981' : '#f59e0b');
      badgeG.select('.tested-badge-text').text(isTested ? '✓' : '⏳');

      // Status text
      d3.select(this)
        .select('.status-tag-text')
        .attr('fill', isTested ? '#34d399' : '#94a3b8')
        .text(isTested ? '✓ TESTED' : d.status.toUpperCase());

      // Label background pill border
      d3.select(this)
        .select('.label-bg-pill')
        .attr('stroke', isTested ? '#059669' : '#1e293b');

      // Active node ring
      const isActive = d.id === activeNodeId;
      const activeRing = d3.select(this).select('.active-ring');
      if (isActive) {
        activeRing.attr('opacity', 0.9).attr('class', 'active-ring animate-ping');
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
        const sourceStatus = nodes.find((n) => n.id === d.source.id)?.status;
        const inTree = testTreeSet.has(d.source.id) && testTreeSet.has(d.target.id);
        if (inTree) {
          return sourceStatus === 'tested' ? '#10b981' : '#f59e0b';
        }
        return sourceStatus === 'tested' ? '#059669' : '#334155';
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
        const sourceStatus = nodes.find((n) => n.id === d.source.id)?.status;
        return sourceStatus === 'tested' ? 'none' : '4 2';
      })
      .attr('marker-end', (d: any) => {
        const sourceStatus = nodes.find((n) => n.id === d.source.id)?.status;
        return sourceStatus === 'tested' ? 'url(#arrow-tested)' : 'url(#arrow)';
      });
  }, [nodes, activeNodeId, selectedNodeId, isTestTreeMode]);

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

        {/* Orientation Toggle: Vertical (Top-to-Bottom) / Horizontal (Left-to-Right) */}
        <button
          onClick={() => {
            const nextOrientation = orientation === 'vertical' ? 'horizontal' : 'vertical';
            setOrientation(nextOrientation);
            persistentPositionsRef.current.clear();
          }}
          className="px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60 bg-slate-900"
          title={`Switch to ${orientation === 'vertical' ? 'Horizontal (Left-to-Right)' : 'Vertical (Top-to-Bottom)'} DAG tree view`}
        >
          <ArrowDownUp className="w-3 h-3 text-sky-400" />
          <span className="capitalize">{orientation}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Layout Stabilizer & Lock Controls */}
        <button
          onClick={handleToggleLock}
          className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
            isLocked
              ? 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={isLocked ? 'Layout is locked in stable DAG positions (click to float)' : 'Layout is free-floating (click to lock)'}
        >
          {isLocked ? <Lock className="w-3 h-3 text-sky-400" /> : <Pin className="w-3 h-3 text-slate-400" />}
          <span>{isLocked ? 'Stable' : 'Free'}</span>
        </button>

        <button
          onClick={handleReorganizeLayout}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          title="Re-align DAG nodes to hierarchical functional tree structure"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

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
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
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
              <strong className={hoveredNode.status === 'tested' ? 'text-emerald-400 uppercase' : 'text-slate-200 uppercase'}>
                {hoveredNode.status === 'tested' ? '✓ TESTED' : hoveredNode.status}
              </strong>
            </span>
            <span>Kind: <strong className="text-cyan-400">{hoveredNode.kind}</strong></span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deps: {hoveredNode.deps.length} upstream</div>
        </div>
      )}

      {/* Status Legend at bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-500 font-semibold">DAG TEST TREE:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ✓ Tested Node
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> ⏳ Untested Prerequisite
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> AST Mapped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Pending Todo
          </span>
        </div>
        <div className="hidden sm:block text-slate-500 text-[10px]">
          Select any node to highlight its upstream Test Tree & write integration tests
        </div>
      </div>
    </div>
  );
}
