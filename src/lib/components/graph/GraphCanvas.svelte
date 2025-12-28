<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import GraphNode from './GraphNode.svelte';
  import GraphEdge from './GraphEdge.svelte';
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
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { createSimulation } from '$lib/engine/physics';
  import type { GraphNode as GraphNodeType, Simulation } from '$lib/types';

  let svgElement: SVGSVGElement;
  let width = $state(800);
  let height = $state(600);
  let simulation: Simulation | null = null;
  let animationFrame: number | null = null;
  let draggedNode: GraphNodeType | null = $state(null);
  let isRunning = $state(false);

  // Track dimensions
  onMount(() => {
    const updateDimensions = () => {
      if (svgElement?.parentElement) {
        width = svgElement.parentElement.clientWidth;
        height = svgElement.parentElement.clientHeight;
        console.log('Dimensions updated:', width, height);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Initialize node positions to canvas center after dimensions are known
    const currentNodes = get(nodes);
    if (currentNodes.length > 0 && width > 0 && height > 0) {
      console.log('Repositioning nodes to canvas center:', width/2, height/2);
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

    // Subscribe to nodes changes to start simulation
    const unsubscribe = nodes.subscribe(($nodes) => {
      console.log('Nodes changed:', $nodes.length);
      if (width > 0 && height > 0 && $nodes.length > 0 && !isRunning) {
        startSimulation();
      }
    });

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      simulation?.stop();
      unsubscribe();
    };
  });

  function startSimulation() {
    console.log('Starting simulation with', get(nodes).length, 'nodes');

    // Stop existing
    if (simulation) {
      simulation.stop();
      isRunning = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }

    // Create new simulation
    simulation = createSimulation(
      () => get(nodes),
      () => get(edges),
      width,
      height
    );

    isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      if (simulation?.tick()) {
        // Create new node objects to trigger full reactivity (including edges)
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
    simulation?.reheat(0.15);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!draggedNode || !svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    updateNode(draggedNode.id, {
      x,
      y,
      vx: 0,
      vy: 0
    });
  }

  function handleMouseUp() {
    draggedNode = null;
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

  function isNodeDimmed(nodeId: string): boolean {
    const hovered = get(hoveredNodeId);
    const selected = get(selectedNodeId);
    const hasActiveNode = hovered !== null || selected !== null;
    if (!hasActiveNode) return false;
    return !get(connectedNodeIds).has(nodeId);
  }
</script>

<svelte:window onmouseup={handleMouseUp} onmousemove={handleMouseMove} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<svg
  bind:this={svgElement}
  class="w-full h-full"
  viewBox="0 0 {width} {height}"
  onclick={handleCanvasClick}
>
  <!-- Background grid -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    </pattern>
  </defs>
  <rect {width} {height} fill="url(#grid)" />

  <!-- Radial glow centered on goal node -->
  {#each $nodes.filter((n) => n.type === 'goal') as goalNode}
    <defs>
      <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
        <stop
          offset="0%"
          stop-color={getNodeColor(themeState.currentTheme, 'goal')}
          stop-opacity="0.08"
        />
        <stop
          offset="100%"
          stop-color={getNodeColor(themeState.currentTheme, 'goal')}
          stop-opacity="0"
        />
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

  <!-- Edges layer -->
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
        />
      {/if}
    {/each}
  </g>

  <!-- Nodes layer -->
  <g class="nodes">
    {#each $nodes as node (node.id)}
      <GraphNode
        {node}
        color={getNodeColor(themeState.currentTheme, node.type)}
        isSelected={$selectedNodeId === node.id}
        isHovered={$hoveredNodeId === node.id}
        isConnected={$connectedNodeIds.has(node.id) &&
          node.id !== ($hoveredNodeId ?? $selectedNodeId)}
        isDimmed={isNodeDimmed(node.id)}
        onmouseenter={() => hoverNode(node.id)}
        onmouseleave={() => hoverNode(null)}
        onclick={() => handleNodeClick(node.id)}
        onmousedown={(e) => handleNodeMouseDown(node, e)}
      />
    {/each}
  </g>
</svg>

<style>
  svg {
    display: block;
    background-color: var(--color-background);
  }
</style>
