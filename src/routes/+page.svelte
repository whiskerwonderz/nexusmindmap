<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import Header from '$lib/components/Header.svelte';
  import Sidebar from '$lib/components/editor/Sidebar.svelte';
  import Inspector from '$lib/components/editor/Inspector.svelte';
  import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
  import AddNodeModal from '$lib/components/editor/AddNodeModal.svelte';
  import ConnectionModal from '$lib/components/editor/ConnectionModal.svelte';
  import LayoutSwitcher from '$lib/components/ui/LayoutSwitcher.svelte';
  import ZoomControls from '$lib/components/ui/ZoomControls.svelte';
  import TravelerView from '$lib/components/traveler/TravelerView.svelte';
  import { nodes, edges, loadData } from '$lib/stores/graph';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import type { GraphNode, GraphData } from '$lib/types';

  // Import example data for demo
  import exampleData from '$lib/data/example.json';

  // Mobile detection and redirect
  function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Mode state
  const mode = $derived(appStore.mode);

  // Header ref for opening project manager
  let headerComponent: Header;

  // Modal states
  let isAddNodeModalOpen = $state(false);
  let isConnectionModalOpen = $state(false);
  let connectionSourceNodeId = $state<string | null>(null);

  // Inspector minimize state
  let isInspectorMinimized = $state(false);

  function toggleInspector() {
    isInspectorMinimized = !isInspectorMinimized;
  }

  // Zoom state
  let zoom = $state(1);
  let canvasContainer = $state<HTMLElement | null>(null);

  function handleZoomIn() {
    zoom = Math.min(3, zoom + 0.25);
  }

  function handleZoomOut() {
    zoom = Math.max(0.25, zoom - 0.25);
  }

  function handleZoomReset() {
    zoom = 1;
  }

  function openAddNodeModal() {
    isAddNodeModalOpen = true;
  }

  function closeAddNodeModal() {
    isAddNodeModalOpen = false;
  }

  function openConnectionModal(sourceNodeId?: string) {
    connectionSourceNodeId = sourceNodeId ?? null;
    isConnectionModalOpen = true;
  }

  function closeConnectionModal() {
    isConnectionModalOpen = false;
    connectionSourceNodeId = null;
  }

  // Keyboard shortcuts handler
  function handleKeydown(e: KeyboardEvent): void {
    // Ctrl/Cmd + S - Save project
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      projectStore.saveCurrentProject(appStore.mode);
      toastStore.success('Project saved');
    }

    // Ctrl/Cmd + N - New project (opens project manager)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      headerComponent?.openProjectManager();
    }
  }

  onMount(() => {
    // Redirect mobile users to landing page
    if (isMobileDevice()) {
      goto(base + '/landing?mobile=true');
      return;
    }

    // Initialize the project store (creates default projects if none exist)
    projectStore.initialize();
  });
</script>

<svelte:head>
  <title>NexusMindGraph - {mode === 'builder' ? 'Builder' : 'Traveler'}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="h-screen flex flex-col bg-graph-bg text-graph-text">
  <Header bind:this={headerComponent} />

  {#if mode === 'traveler'}
    <!-- Traveler Mode: Full-width globe view -->
    <div class="flex-1 relative">
      <div class="absolute inset-0 overflow-hidden">
        <TravelerView />
      </div>
    </div>
  {:else}
    <!-- Builder Mode: Three-panel layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar: 240px fixed -->
      <aside class="w-60 border-r border-panel overflow-y-auto bg-panel/50 shrink-0">
        <Sidebar onAddNode={openAddNodeModal} />
      </aside>

      <!-- Graph Canvas: flexible -->
      <main bind:this={canvasContainer} class="flex-1 relative overflow-hidden bg-graph-bg">
        <div
          class="w-full h-full transition-transform duration-200 origin-center"
          style:transform="scale({zoom})"
        >
          <GraphCanvas />
        </div>

        <!-- Layout switcher -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <LayoutSwitcher />
        </div>

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

        <!-- Zoom controls -->
        <div class="absolute bottom-4 right-4 z-10">
          <ZoomControls
            {zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleZoomReset}
            fullscreenTarget={canvasContainer}
          />
        </div>
      </main>

      <!-- Inspector: collapsible -->
      <aside
        class="border-l border-panel bg-panel/50 shrink-0 transition-all duration-300 relative flex flex-col"
        style:width={isInspectorMinimized ? '48px' : '280px'}
      >
        <!-- Minimize/Expand button -->
        <button
          type="button"
          class="m-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          class:p-2={isInspectorMinimized}
          class:p-1={!isInspectorMinimized}
          onclick={toggleInspector}
          title={isInspectorMinimized ? 'Expand inspector' : 'Minimize inspector'}
        >
          {#if isInspectorMinimized}
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          {:else}
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          {/if}
        </button>

        {#if !isInspectorMinimized}
          <div class="flex-1 overflow-y-auto">
            <Inspector onAddConnection={openConnectionModal} />
          </div>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<!-- Modals (Builder mode only) -->
{#if mode === 'builder'}
  <AddNodeModal isOpen={isAddNodeModalOpen} onClose={closeAddNodeModal} />
  <ConnectionModal
    isOpen={isConnectionModalOpen}
    sourceNodeId={connectionSourceNodeId}
    onClose={closeConnectionModal}
  />
{/if}
