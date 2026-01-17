<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import GraphNode from './GraphNode.svelte';
  import GraphEdge from './GraphEdge.svelte';
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
    updateNode,
    addEdge
  } from '$lib/stores/graph';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import {
    layoutMode,
    layoutTrigger,
    clusterData,
    setClusterData,
    focusCluster,
    expandedClusters
  } from '$lib/stores/layout';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { createSimulation } from '$lib/engine/physics';
  import {
    applyLayout,
    computeRadialLayout,
    computeClusterLayout,
    computeHierarchicalLayout,
    getClusterData,
    easeInOutCubic
  } from '$lib/engine/layouts';
  import type { GraphNode as GraphNodeType, Simulation, LayoutType, ClusterData } from '$lib/types';

  let svgElement: SVGSVGElement;
  let gElement: SVGGElement;
  let width = $state(800);
  let height = $state(600);
  let simulation: Simulation | null = null;
  let animationFrame: number | null = null;
  let draggedNode: GraphNodeType | null = $state(null);
  let isRunning = $state(false);
  let isAnimating = $state(false);
  let hasInitialized = false;
  let previousMode: LayoutType | null = null;

  // Pan/Zoom state
  let transform = $state({ x: 0, y: 0, scale: 1 });
  let isPanning = $state(false);
  let panStart = { x: 0, y: 0 };

  // Connection dragging state
  let isConnecting = $state(false);
  let connectionSource: { nodeId: string; x: number; y: number } | null = $state(null);
  let connectionEndPos = $state({ x: 0, y: 0 });
  let connectionTargetId: string | null = $state(null);

  // Cluster background data
  let clusterBackgrounds = $state<ClusterData[]>([]);

  // Fit all nodes in view
  export function fitToView() {
    const currentNodes = get(nodes);
    if (currentNodes.length === 0) return;

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    currentNodes.forEach(node => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      minX = Math.min(minX, x - 50);
      maxX = Math.max(maxX, x + 50);
      minY = Math.min(minY, y - 50);
      maxY = Math.max(maxY, y + 50);
    });

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const padding = 60;

    // Calculate scale to fit
    const scaleX = (width - padding * 2) / boxWidth;
    const scaleY = (height - padding * 2) / boxHeight;
    const newScale = Math.min(scaleX, scaleY, 1.5); // Max zoom 1.5x

    // Calculate center offset
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    transform = {
      x: width / 2 - centerX * newScale,
      y: height / 2 - centerY * newScale,
      scale: newScale
    };
  }

  // Reset view to default
  export function resetView() {
    transform = { x: 0, y: 0, scale: 1 };
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
        applyCurrentLayout(mode);
        hasInitialized = true;
        previousMode = mode;
        // Auto fit to view after initial layout
        setTimeout(() => fitToView(), 700);
      }
    }, 100);

    // Subscribe to mode changes
    const unsubscribeMode = layoutMode.subscribe((mode) => {
      if (hasInitialized && previousMode !== null && previousMode !== mode) {
        applyCurrentLayout(mode);
        // Auto fit to view after layout change
        setTimeout(() => fitToView(), 700);
      }
      previousMode = mode;
    });

    // Subscribe to layout trigger (force re-layout when loading new data)
    let initialTrigger = true;
    const unsubscribeTrigger = layoutTrigger.subscribe(() => {
      // Skip the initial subscription call
      if (initialTrigger) {
        initialTrigger = false;
        return;
      }
      const currentNodes = get(nodes);
      const mode = get(layoutMode);
      if (currentNodes.length > 0 && width > 0 && height > 0) {
        applyCurrentLayout(mode);
        // Auto fit to view after new data loaded
        setTimeout(() => fitToView(), 700);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      simulation?.stop();
      unsubscribeMode();
      unsubscribeTrigger();
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

    switch (mode) {
      case 'physics':
        initializePositions();
        startSimulation();
        clusterBackgrounds = [];
        break;

      case 'radial':
        const radialNodes = computeRadialLayout(currentNodes, currentEdges, config);
        animateToPositions(radialNodes);
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
        break;

      case 'hierarchical':
        const hierarchyNodes = computeHierarchicalLayout(currentNodes, currentEdges, config);
        animateToPositions(hierarchyNodes);
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
    // Cancel any existing animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

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
    // Always cancel animation frame and reset animating state
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    isAnimating = false;
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

  // Transform screen coordinates to graph coordinates
  function screenToGraph(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - transform.x) / transform.scale,
      y: (screenY - transform.y) / transform.scale
    };
  }

  // Handle mouse wheel for zoom
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const rect = svgElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Zoom factor
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, transform.scale * zoomFactor));

    // Zoom towards mouse position
    const scaleChange = newScale / transform.scale;
    transform = {
      x: mouseX - (mouseX - transform.x) * scaleChange,
      y: mouseY - (mouseY - transform.y) * scaleChange,
      scale: newScale
    };
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

  // Start panning with middle mouse or when clicking on background
  function handleCanvasMouseDown(event: MouseEvent) {
    // Middle mouse button or background click for panning
    if (event.button === 1) {
      event.preventDefault();
      isPanning = true;
      panStart = { x: event.clientX - transform.x, y: event.clientY - transform.y };
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Handle panning
    if (isPanning) {
      transform = {
        ...transform,
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y
      };
      return;
    }

    // Transform to graph coordinates for connection and dragging
    const { x, y } = screenToGraph(screenX, screenY);

    // Handle connection dragging (use screen coords for the preview line)
    if (isConnecting && connectionSource) {
      connectionEndPos = { x: screenX, y: screenY };
      // Check if hovering over a potential target node (excluding source)
      const hoveredId = findNodeAtPosition(x, y);
      connectionTargetId = hoveredId !== connectionSource.nodeId ? hoveredId : null;
      return; // Don't do node dragging while connecting
    }

    // Handle node dragging (use graph coordinates)
    if (draggedNode) {
      updateNode(draggedNode.id, { x, y, vx: 0, vy: 0 });
    }
  }

  function handleMouseUp() {
    isPanning = false;
    draggedNode = null;

    // Handle connection completion
    if (isConnecting && connectionSource) {
      if (connectionTargetId && connectionTargetId !== connectionSource.nodeId) {
        const edgeId = addEdge(connectionSource.nodeId, connectionTargetId);
        if (edgeId) {
          toastStore.success('Connection created');
        } else {
          toastStore.error('Connection already exists');
        }
      }
      // Reset connection state
      isConnecting = false;
      connectionSource = null;
      connectionTargetId = null;
    }
  }

  function handleStartConnection(nodeId: string, x: number, y: number) {
    isConnecting = true;
    // Convert graph coords to screen coords for the preview line
    const screenX = x * transform.scale + transform.x;
    const screenY = y * transform.scale + transform.y;
    connectionSource = { nodeId, x: screenX, y: screenY };
    connectionEndPos = { x: screenX, y: screenY };
    connectionTargetId = null;
  }

  // Find node at graph coordinates
  function findNodeAtPosition(x: number, y: number): string | null {
    const currentNodes = get(nodes);
    const NODE_HIT_RADIUS = 25 / transform.scale; // Adjust for zoom

    for (const node of currentNodes) {
      const dx = (node.x ?? 0) - x;
      const dy = (node.y ?? 0) - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < NODE_HIT_RADIUS) {
        return node.id;
      }
    }
    return null;
  }

  function handleCanvasClick(event: MouseEvent) {
    const target = event.target as Element;
    if (target === svgElement || target.tagName === 'rect' || target.tagName === 'pattern') {
      selectNode(null);
    }
  }

  // Handle double-click to fit view
  function handleDoubleClick(event: MouseEvent) {
    const target = event.target as Element;
    if (target === svgElement || target.tagName === 'rect' || target.tagName === 'pattern') {
      fitToView();
    }
  }

  function handleNodeClick(nodeId: string) {
    const current = get(selectedNodeId);
    selectNode(current === nodeId ? null : nodeId);
  }

  function getEdgeColor(fromId: string): string {
    const map = get(nodeMap);
    const node = map.get(fromId);
    if (!node) return themeState.currentTheme.colors.edge;
    return getNodeColor(themeState.currentTheme, node.type);
  }

  // Check if node is dimmed based on hover/selection
  function isNodeDimmed(node: GraphNodeType): boolean {
    const hovered = get(hoveredNodeId);
    const selected = get(selectedNodeId);
    const hasActiveNode = hovered !== null || selected !== null;

    // Hover/selection dimming
    if (hasActiveNode && !get(connectedNodeIds).has(node.id)) {
      return true;
    }

    return false;
  }

  // Cluster interaction handlers
  function handleClusterFocus(_cluster: ClusterData) {
    // The focus state is already set in ClusterBackgrounds
    // This could be used to trigger zoom/pan to cluster center
  }

  function handleClusterExpand(cluster: ClusterData) {
    // Note: toggleClusterExpand was already called in ClusterBackgrounds
    // So if cluster is now in expandedClusters, it was just expanded
    const nowExpanded = get(expandedClusters).has(cluster.id);
    const expansionFactor = nowExpanded ? 1.5 : (1 / 1.5); // Expand or contract

    const currentNodes = get(nodes);
    const clusterNodeIds = new Set(cluster.nodeIds);

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
    ondblclick={handleDoubleClick}
    onmousedown={handleCanvasMouseDown}
    onmousemove={handleMouseMove}
    onwheel={handleWheel}
  >
    <!-- Background grid (not transformed) -->
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      </pattern>
    </defs>
    <rect {width} {height} fill="url(#grid)" />

    <!-- Connection preview line (not transformed - uses screen coords) -->
    {#if isConnecting && connectionSource}
      <line
        class="connection-preview"
        x1={connectionSource.x}
        y1={connectionSource.y}
        x2={connectionEndPos.x}
        y2={connectionEndPos.y}
        stroke="#00d4ff"
        stroke-width="2"
        stroke-dasharray="6,4"
        opacity="0.8"
      />
    {/if}

    <!-- Transformed group for graph content -->
    <g bind:this={gElement} transform="translate({transform.x}, {transform.y}) scale({transform.scale})">
      <!-- Cluster backgrounds (only in cluster mode) -->
      {#if $layoutMode === 'cluster' && clusterBackgrounds.length > 0}
        <ClusterBackgrounds
          clusters={clusterBackgrounds}
          onClusterFocus={handleClusterFocus}
          onClusterExpand={handleClusterExpand}
          onClusterDrag={handleClusterDrag}
        />
      {/if}

      <!-- Radial glow centered on goal node -->
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

      <!-- Edges layer (hidden in cluster mode) -->
      {#if $layoutMode !== 'cluster'}
        <g class="edges">
          {#each $edges as edge (edge.id)}
            {@const map = $nodeMap}
            {@const sourceNode = map.get(edge.from)}
            {@const targetNode = map.get(edge.to)}
            {#if sourceNode && targetNode}
              <GraphEdge
                {edge}
                {sourceNode}
                {targetNode}
                isHighlighted={$connectedNodeIds.has(edge.from) && $connectedNodeIds.has(edge.to)}
                color={getEdgeColor(edge.from)}
                clusters={[]}
                enableBundling={false}
              />
            {/if}
          {/each}
        </g>
      {/if}

      <!-- Nodes layer -->
      <g class="nodes">
        {#each $nodes as node (node.id)}
          <GraphNode
            {node}
            color={getNodeColor(themeState.currentTheme, node.type)}
            isSelected={$selectedNodeId === node.id}
            isHovered={$hoveredNodeId === node.id}
            isConnected={$connectedNodeIds.has(node.id) && node.id !== ($hoveredNodeId ?? $selectedNodeId)}
            isDimmed={isNodeDimmed(node)}
            isConnectionTarget={connectionTargetId === node.id}
            onmouseenter={() => hoverNode(node.id)}
            onmouseleave={() => hoverNode(null)}
            onclick={() => handleNodeClick(node.id)}
            onmousedown={(e) => handleNodeMouseDown(node, e)}
            onStartConnection={handleStartConnection}
          />
        {/each}
      </g>
    </g>
  </svg>
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
    cursor: grab;
  }

  svg:active {
    cursor: grabbing;
  }
</style>
