<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Sidebar from '$lib/components/editor/Sidebar.svelte';
  import Inspector from '$lib/components/editor/Inspector.svelte';
  import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
  import { nodes, edges, loadData } from '$lib/stores/graph';
  import type { GraphNode, GraphData } from '$lib/types';

  // Import example data
  import exampleData from '$lib/data/example.json';

  onMount(() => {
    console.log('=== onMount START ===');
    console.log('Example data nodes:', exampleData.nodes?.length);

    // Get center coordinates
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    console.log('Center:', centerX, centerY);

    // Create nodes with positions - start closer together for better physics
    const nodesWithPositions: GraphNode[] = exampleData.nodes.map((node, i) => {
      const angle = (i / exampleData.nodes.length) * Math.PI * 2;
      const radius = node.type === 'goal' ? 0 : 100 + Math.random() * 80;

      return {
        id: node.id,
        label: node.label,
        type: node.type as GraphNode['type'],
        description: node.description,
        date: node.date,
        url: node.url,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    // Create the data object
    const dataWithPositions: GraphData = {
      version: '1.0',
      meta: exampleData.meta as GraphData['meta'],
      nodes: nodesWithPositions,
      edges: exampleData.edges
    };

    // Load the data
    loadData(dataWithPositions);

    console.log('=== onMount END ===');
  });
</script>

<svelte:head>
  <title>SkillGraph - Your Learning Journey, Beautifully Mapped</title>
</svelte:head>

<div class="h-screen flex flex-col bg-graph-bg text-graph-text">
  <Header />

  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar: 240px fixed -->
    <aside class="w-60 border-r border-panel overflow-y-auto bg-panel/50 shrink-0">
      <Sidebar />
    </aside>

    <!-- Graph Canvas: flexible -->
    <main class="flex-1 relative overflow-hidden">
      <GraphCanvas />

      <!-- Instructions overlay -->
      <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-graph-muted pointer-events-none"
      >
        <span class="text-white/60">Hover</span> to highlight
        <span class="mx-2">•</span>
        <span class="text-white/60">Click</span> to inspect
        <span class="mx-2">•</span>
        <span class="text-white/60">Drag</span> to move nodes
      </div>
    </main>

    <!-- Inspector: 280px fixed -->
    <aside class="w-70 border-l border-panel overflow-y-auto bg-panel/50 shrink-0">
      <Inspector />
    </aside>
  </div>
</div>
