<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import GraphNode from './GraphNode.svelte';
  import GraphEdge from './GraphEdge.svelte';
  import TimelineAxis from './TimelineAxis.svelte';
  import TimelineControls from './TimelineControls.svelte';
  import ClusterBackgrounds from './ClusterBackgrounds.svelte';
  import {
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    connectedNodeIds,
    nodeMap,
    selectNode,
    hoverNode,
    updateNode
  } from '$lib/stores/graph';
  import {
    layoutMode,
    clusterData,
    setClusterData,
    timelineState,
    setTimelineDateBounds,
    setTimelineHoverX,
    setTimelinePlayProgress,
    resetTimelineState,
    focusCluster,
    expandedClusters,
    type TimelineState
  } from '$lib/stores/layout';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { createSimulation } from '$lib/engine/physics';
  import {
    applyLayout,
    computeRadialLayout,
    computeTimelineLayout,
    computeClusterLayout,
    computeHierarchicalLayout,
    getTimelineAxisData,
    getClusterData,
    easeInOutCubic
  } from '$lib/engine/layouts';
  import type { GraphNode as GraphNodeType, Simulation, LayoutType, ClusterData } from '$lib/types';

  let svgElement: SVGSVGElement;
  let width = $state(800);
  let height = $state(600);
  let simulation: Simulation | null = null;
  let animationFrame: number | null = null;
  let draggedNode: GraphNodeType | null = $state(null);
  let isRunning = $state(false);
  let isAnimating = $state(false);
  let isScrubbing = $state(false);
  let hasInitialized = false;
  let previousMode: LayoutType | null = null;

  // Timeline axis data
  let timelineAxisData = $state<{
    years: { year: number; x: number }[];
    swimLanes: { type: any; label: string; y: number }[];
  }>({ years: [], swimLanes: [] });

  // Cluster background data
  let clusterBackgrounds = $state<ClusterData[]>([]);

  // Parse date helper
  function parseDate(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  // Calculate timeline progress from X position
  function getProgressFromX(x: number): number {
    const padding = 80;
    const trackWidth = width - padding * 2;
    const progress = (x - padding) / trackWidth;
    return Math.max(0, Math.min(1, progress));
  }

  // Calculate timeline date bounds from nodes
  function calculateDateBounds(nodeList: GraphNodeType[]): { min: number; max: number } {
    const dates = nodeList
      .map(n => parseDate(n.date))
      .filter((d): d is number => d !== null);

    if (dates.length === 0) {
      return { min: Date.now(), max: Date.now() };
    }

    return {
      min: Math.min(...dates),
      max: Math.max(...dates)
    };
  }

  onMount(() => {
    // Update dimensions
    if (svgElement?.parentElement) {
      width = svgElement.parentElement.clientWidth;
      height = svgElement.parentElement.clientHeight;
    }

    const handleResize = () => {
      if (svgElement?.parentElement) {
        width = svgElement.parentElement.clientWidth;
        height = svgElement.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial layout after a small delay to ensure dimensions are set
    setTimeout(() => {
      const currentNodes = get(nodes);
      const mode = get(layoutMode);
      if (currentNodes.length > 0 && width > 0 && height > 0 && !hasInitialized) {
        console.log('Initial layout with mode:', mode);
        applyCurrentLayout(mode);
        hasInitialized = true;
        previousMode = mode;
      }
    }, 100);

    // Subscribe to mode changes
    const unsubscribe = layoutMode.subscribe((mode) => {
      if (hasInitialized && previousMode !== null && previousMode !== mode) {
        console.log('Mode changed:', previousMode, '->', mode);
        applyCurrentLayout(mode);
      }
      previousMode = mode;
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      simulation?.stop();
      unsubscribe();
    };
  });

  function getLayoutConfig() {
    return {
      width,
      height,
      centerX: width / 2,
      centerY: height / 2,
      padding: 80
    };
  }

  function applyCurrentLayout(mode: LayoutType) {
    stopSimulation();

    const currentNodes = get(nodes);
    const currentEdges = get(edges);
    const config = getLayoutConfig();

    // Reset timeline state when leaving timeline mode
    if (previousMode === 'timeline' && mode !== 'timeline') {
      resetTimelineState();
    }

    switch (mode) {
      case 'physics':
        initializePositions();
        startSimulation();
        // Clear overlays
        timelineAxisData = { years: [], swimLanes: [] };
        clusterBackgrounds = [];
        break;

      case 'radial':
        const radialNodes = computeRadialLayout(currentNodes, currentEdges, config);
        animateToPositions(radialNodes);
        // Clear overlays
        timelineAxisData = { years: [], swimLanes: [] };
        clusterBackgrounds = [];
        break;

      case 'timeline':
        const timelineNodes = computeTimelineLayout(currentNodes, currentEdges, config);
        animateToPositions(timelineNodes);
        // Update timeline axis data
        timelineAxisData = getTimelineAxisData(currentNodes, config);
        // Set date bounds for timeline state
        const bounds = calculateDateBounds(currentNodes);
        setTimelineDateBounds(bounds.min, bounds.max);
        clusterBackgrounds = [];
        break;

      case 'cluster':
        const clusterNodes = computeClusterLayout(currentNodes, currentEdges, config);
        animateToPositions(clusterNodes);
        // Update cluster backgrounds after animation
        setTimeout(() => {
          const layoutNodes = get(nodes);
          clusterBackgrounds = getClusterData(layoutNodes, config);
          setClusterData(clusterBackgrounds);
        }, 650);
        timelineAxisData = { years: [], swimLanes: [] };
        break;

      case 'hierarchical':
        const hierarchyNodes = computeHierarchicalLayout(currentNodes, currentEdges, config);
        animateToPositions(hierarchyNodes);
        // Clear overlays
        timelineAxisData = { years: [], swimLanes: [] };
        clusterBackgrounds = [];
        break;
    }
  }

  function initializePositions() {
    const currentNodes = get(nodes);
    const updatedNodes = currentNodes.map((node, i) => {
      const angle = (i / currentNodes.length) * Math.PI * 2;
      const radius = node.type === 'goal' ? 0 : 150 + Math.random() * 100;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });
    nodes.set(updatedNodes);
  }

  function animateToPositions(targetNodes: GraphNodeType[]) {
    if (isAnimating) return;

    const startNodes = get(nodes).map(n => ({ ...n }));
    const duration = 600;
    const startTime = performance.now();
    isAnimating = true;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const interpolated = startNodes.map((start) => {
        const target = targetNodes.find(t => t.id === start.id) || start;
        return {
          ...start,
          x: (start.x ?? 0) + ((target.x ?? 0) - (start.x ?? 0)) * eased,
          y: (start.y ?? 0) + ((target.y ?? 0) - (start.y ?? 0)) * eased,
          vx: 0,
          vy: 0,
          level: target.level // Preserve level for hierarchy
        };
      });

      nodes.set(interpolated);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        isAnimating = false;
        animationFrame = null;
      }
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function stopSimulation() {
    if (simulation) {
      simulation.stop();
      isRunning = false;
    }
    if (animationFrame && !isAnimating) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function startSimulation() {
    stopSimulation();

    simulation = createSimulation(
      () => get(nodes),
      () => get(edges),
      width,
      height
    );

    isRunning = true;

    const animate = () => {
      const currentMode = get(layoutMode);
      if (!isRunning || currentMode !== 'physics') return;

      if (simulation?.tick()) {
        const currentNodes = get(nodes);
        const updatedNodes = currentNodes.map(node => ({
          ...node,
          x: node.x,
          y: node.y,
          vx: node.vx,
          vy: node.vy
        }));
        nodes.set(updatedNodes);
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  function handleNodeMouseDown(node: GraphNodeType, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    draggedNode = node;

    const currentMode = get(layoutMode);
    if (currentMode === 'physics') {
      simulation?.reheat(0.15);
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update timeline hover position
    if (get(layoutMode) === 'timeline') {
      setTimelineHoverX(x);

      // Handle timeline scrubbing
      if (isScrubbing) {
        const progress = getProgressFromX(x);
        setTimelinePlayProgress(progress);
      }
    }

    // Handle dragging
    if (draggedNode) {
      updateNode(draggedNode.id, { x, y, vx: 0, vy: 0 });
    }
  }

  function handleMouseLeave() {
    if (get(layoutMode) === 'timeline') {
      setTimelineHoverX(null);
    }
  }

  function handleMouseUp() {
    draggedNode = null;
    isScrubbing = false;
  }

  function handleCanvasMouseDown(event: MouseEvent) {
    const target = event.target as Element;
    const isBackground = target === svgElement || target.tagName === 'rect' || target.tagName === 'pattern' || target.tagName === 'line';

    // Start scrubbing in timeline mode when clicking on background
    if (get(layoutMode) === 'timeline' && isBackground) {
      const rect = svgElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const progress = getProgressFromX(x);

      isScrubbing = true;
      setTimelinePlayProgress(progress);
    }
  }

  function handleCanvasClick(event: MouseEvent) {
    const target = event.target as Element;
    if (target === svgElement || target.tagName === 'rect' || target.tagName === 'pattern') {
      selectNode(null);
    }
  }

  function handleNodeClick(nodeId: string) {
    console.log('Node clicked:', nodeId);
    const current = get(selectedNodeId);
    selectNode(current === nodeId ? null : nodeId);
  }

  function getEdgeColor(fromId: string): string {
    const map = get(nodeMap);
    const node = map.get(fromId);
    if (!node) return themeState.currentTheme.colors.edge;
    return getNodeColor(themeState.currentTheme, node.type);
  }

  // Check if node is dimmed based on various factors
  function isNodeDimmed(node: GraphNodeType, state: TimelineState, mode: string): boolean {
    const hovered = get(hoveredNodeId);
    const selected = get(selectedNodeId);
    const hasActiveNode = hovered !== null || selected !== null;

    // Hover/selection dimming
    if (hasActiveNode && !get(connectedNodeIds).has(node.id)) {
      return true;
    }

    // Timeline mode dimming
    if (mode === 'timeline') {
      const nodeDate = parseDate(node.date);

      if (nodeDate !== null) {
        const { minDate, maxDate, range, isPlaying, playProgress } = state;
        const timeRange = maxDate - minDate || 1;
        const nodeProgress = (nodeDate - minDate) / timeRange;

        // Range filtering - dim nodes outside selected range
        if (nodeProgress < range.start || nodeProgress > range.end) {
          return true;
        }

        // Play animation - dim nodes not yet "reached"
        if (isPlaying && nodeProgress > playProgress) {
          return true;
        }
      }
    }

    return false;
  }

  // Calculate node opacity for timeline play animation
  function getNodeOpacity(node: GraphNodeType, state: TimelineState, mode: string): number {
    if (mode !== 'timeline') return 1;

    const nodeDate = parseDate(node.date);

    if (nodeDate === null) return 1;

    const { minDate, maxDate, range, isPlaying, playProgress } = state;
    const timeRange = maxDate - minDate || 1;
    const nodeProgress = (nodeDate - minDate) / timeRange;

    // Range filtering
    if (nodeProgress < range.start || nodeProgress > range.end) {
      return 0.15;
    }

    // Play animation
    if (isPlaying || playProgress > 0) {
      if (nodeProgress > playProgress) {
        return 0.15;
      }
    }

    return 1;
  }

  // Check current mode for conditional rendering
  const isTimelineMode = $derived($layoutMode === 'timeline');

  // Cluster interaction handlers
  function handleClusterFocus(cluster: ClusterData) {
    // The focus state is already set in ClusterBackgrounds
    // This could be used to trigger zoom/pan to cluster center
    console.log('Cluster focused:', cluster.label);
  }

  function handleClusterExpand(cluster: ClusterData) {
    // Note: toggleClusterExpand was already called in ClusterBackgrounds
    // So if cluster is now in expandedClusters, it was just expanded
    const nowExpanded = get(expandedClusters).has(cluster.id);
    const expansionFactor = nowExpanded ? 1.5 : (1 / 1.5); // Expand or contract

    console.log('Cluster expand:', cluster.label, 'nowExpanded:', nowExpanded, 'factor:', expansionFactor);

    const currentNodes = get(nodes);
    const clusterNodeIds = new Set(cluster.nodeIds);

    console.log('Cluster nodeIds:', cluster.nodeIds);

    const updatedNodes = currentNodes.map(node => {
      if (!clusterNodeIds.has(node.id)) return node;

      // Calculate vector from cluster center
      const dx = (node.x ?? 0) - cluster.x;
      const dy = (node.y ?? 0) - cluster.y;

      // Apply expansion/contraction
      return {
        ...node,
        x: cluster.x + dx * expansionFactor,
        y: cluster.y + dy * expansionFactor
      };
    });

    nodes.set(updatedNodes);

    // Update cluster backgrounds after expansion
    setTimeout(() => {
      const layoutNodes = get(nodes);
      clusterBackgrounds = getClusterData(layoutNodes, getLayoutConfig());
      setClusterData(clusterBackgrounds);
    }, 50);
  }

  function handleClusterDrag(clusterId: string, deltaX: number, deltaY: number) {
    const cluster = clusterBackgrounds.find(c => c.id === clusterId);
    if (!cluster) return;

    const clusterNodeIds = new Set(cluster.nodeIds);
    const currentNodes = get(nodes);

    // Move all nodes in the cluster
    const updatedNodes = currentNodes.map(node => {
      if (!clusterNodeIds.has(node.id)) return node;
      return {
        ...node,
        x: (node.x ?? 0) + deltaX,
        y: (node.y ?? 0) + deltaY
      };
    });

    nodes.set(updatedNodes);

    // Update cluster background position
    clusterBackgrounds = clusterBackgrounds.map(c => {
      if (c.id !== clusterId) return c;
      return {
        ...c,
        x: c.x + deltaX,
        y: c.y + deltaY
      };
    });
  }
</script>

<svelte:window onmouseup={handleMouseUp} />

<div class="graph-container">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svg
    bind:this={svgElement}
    class="w-full h-full"
    viewBox="0 0 {width} {height}"
    onclick={handleCanvasClick}
    onmousedown={handleCanvasMouseDown}
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
  >
    <!-- Background grid -->
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      </pattern>
    </defs>
    <rect {width} {height} fill="url(#grid)" />

    <!-- Timeline axis (only in timeline mode) -->
    {#if isTimelineMode && timelineAxisData.years.length > 0}
      <TimelineAxis
        years={timelineAxisData.years}
        swimLanes={timelineAxisData.swimLanes}
        {width}
        {height}
        padding={80}
      />
    {/if}

    <!-- Cluster backgrounds (only in cluster mode) -->
    {#if $layoutMode === 'cluster' && clusterBackgrounds.length > 0}
      <ClusterBackgrounds
        clusters={clusterBackgrounds}
        onClusterFocus={handleClusterFocus}
        onClusterExpand={handleClusterExpand}
        onClusterDrag={handleClusterDrag}
      />
    {/if}

    <!-- Radial glow centered on goal node (not in timeline mode) -->
    {#if !isTimelineMode}
      {#each $nodes.filter((n) => n.type === 'goal') as goalNode}
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color={getNodeColor(themeState.currentTheme, 'goal')} stop-opacity="0.08" />
            <stop offset="100%" stop-color={getNodeColor(themeState.currentTheme, 'goal')} stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx={goalNode.x ?? width / 2}
          cy={goalNode.y ?? height / 2}
          r={Math.min(width, height) * 0.4}
          fill="url(#center-glow)"
          class="pointer-events-none"
        />
      {/each}
    {/if}

    <!-- Edges layer -->
    <g class="edges">
      {#each $edges as edge (edge.id)}
        {@const map = $nodeMap}
        {@const sourceNode = map.get(edge.from)}
        {@const targetNode = map.get(edge.to)}
        {#if sourceNode && targetNode}
          <g style:opacity={Math.min(getNodeOpacity(sourceNode, $timelineState, $layoutMode), getNodeOpacity(targetNode, $timelineState, $layoutMode))}>
            <GraphEdge
              {edge}
              {sourceNode}
              {targetNode}
              isHighlighted={$connectedNodeIds.has(edge.from) && $connectedNodeIds.has(edge.to)}
              color={getEdgeColor(edge.from)}
              clusters={$layoutMode === 'cluster' ? clusterBackgrounds : []}
              enableBundling={$layoutMode === 'cluster'}
            />
          </g>
        {/if}
      {/each}
    </g>

    <!-- Nodes layer -->
    <g class="nodes">
      {#each $nodes as node (node.id)}
        <g style:opacity={getNodeOpacity(node, $timelineState, $layoutMode)} class="transition-opacity duration-200">
          <GraphNode
            {node}
            color={getNodeColor(themeState.currentTheme, node.type)}
            isSelected={$selectedNodeId === node.id}
            isHovered={$hoveredNodeId === node.id}
            isConnected={$connectedNodeIds.has(node.id) && node.id !== ($hoveredNodeId ?? $selectedNodeId)}
            isDimmed={isNodeDimmed(node, $timelineState, $layoutMode)}
            onmouseenter={() => hoverNode(node.id)}
            onmouseleave={() => hoverNode(null)}
            onclick={() => handleNodeClick(node.id)}
            onmousedown={(e) => handleNodeMouseDown(node, e)}
          />
        </g>
      {/each}
    </g>
  </svg>

  <!-- Timeline controls (outside SVG, at bottom) -->
  {#if isTimelineMode}
    <div class="timeline-controls-container">
      <TimelineControls {width} padding={80} />
    </div>
  {/if}
</div>

<style>
  .graph-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  svg {
    display: block;
    background-color: var(--color-background);
  }

  .timeline-controls-container {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
  }

  .transition-opacity {
    transition: opacity 0.2s ease;
  }
</style>
