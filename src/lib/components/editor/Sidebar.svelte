<script lang="ts">
  import { nodes, nodesByType, selectNode, selectedNodeId } from '$lib/stores/graph';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPE_LABELS, NODE_TYPES, type NodeType } from '$lib/types';

  interface Props {
    onAddNode?: () => void;
  }

  let { onAddNode }: Props = $props();

  let searchQuery = $state('');
  let collapsedSections = $state<Record<NodeType, boolean>>({
    goal: false,
    skill: false,
    project: false,
    source: false,
    cert: false,
    concept: false
  });

  // Filter nodes by search query
  const filteredNodesByType = $derived.by(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return $nodesByType;

    const result: Record<NodeType, typeof $nodes> = {
      goal: [],
      skill: [],
      project: [],
      source: [],
      cert: [],
      concept: []
    };

    $nodes.forEach(node => {
      if (node.label.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query)) {
        result[node.type].push(node);
      }
    });

    return result;
  });

  // Total filtered count
  const totalFiltered = $derived(
    Object.values(filteredNodesByType).reduce((sum, arr) => sum + arr.length, 0)
  );

  function toggleSection(type: NodeType) {
    collapsedSections[type] = !collapsedSections[type];
  }

  function handleNodeClick(nodeId: string) {
    const current = $selectedNodeId;
    selectNode(current === nodeId ? null : nodeId);
  }

  function clearSearch() {
    searchQuery = '';
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header with Add Button -->
  <div class="p-4 border-b border-panel">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-semibold text-sm">Nodes</h2>
      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-btn-primary hover:opacity-90 transition-opacity text-xs font-medium"
        onclick={() => onAddNode?.()}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <svg
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-graph-muted pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search nodes..."
        bind:value={searchQuery}
        class="w-full pl-8 pr-8 py-1.5 rounded-lg bg-input border border-panel text-sm placeholder:text-graph-muted focus:outline-none focus:border-white/20"
      />
      {#if searchQuery}
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-graph-muted hover:text-white"
          onclick={clearSearch}
          aria-label="Clear search"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      {/if}
    </div>

    {#if searchQuery && totalFiltered === 0}
      <p class="text-xs text-graph-muted mt-2">No nodes found</p>
    {:else if searchQuery}
      <p class="text-xs text-graph-muted mt-2">{totalFiltered} result{totalFiltered === 1 ? '' : 's'}</p>
    {/if}
  </div>

  <!-- Node list -->
  <div class="flex-1 overflow-y-auto p-2">
    {#each NODE_TYPES as type}
      {@const nodesOfType = filteredNodesByType[type]}
      {@const color = getNodeColor(themeState.currentTheme, type)}
      {#if nodesOfType.length > 0}
        <div class="mb-2">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
            onclick={() => toggleSection(type)}
          >
            <svg
              class="w-3 h-3 text-graph-muted transition-transform {!collapsedSections[type] ? 'rotate-90' : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
            <span class="w-2.5 h-2.5 rounded-full" style:background={color}></span>
            <span class="text-sm font-medium">{NODE_TYPE_LABELS[type]}</span>
            <span class="ml-auto text-xs text-graph-muted bg-white/5 px-1.5 py-0.5 rounded">{nodesOfType.length}</span>
          </button>

          {#if !collapsedSections[type]}
            <div class="ml-4 mt-1 space-y-0.5">
              {#each nodesOfType as node}
                {@const isSelected = $selectedNodeId === node.id}
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors text-sm {isSelected ? 'bg-white/10 text-white' : 'text-graph-muted hover:bg-white/5'}"
                  onclick={() => handleNodeClick(node.id)}
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    style:background={color}
                    style:opacity={isSelected ? 1 : 0.6}
                  ></span>
                  <span class="truncate">{node.label}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/each}

    {#if $nodes.length === 0}
      <div class="text-center text-graph-muted text-sm py-8">
        <p>No nodes yet</p>
        <p class="mt-1 text-xs">Click "Add" to create your first node</p>
      </div>
    {/if}
  </div>
</div>
