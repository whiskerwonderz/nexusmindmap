<script lang="ts">
  import { nodesByType, selectNode, selectedNodeId } from '$lib/stores/graph';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPE_LABELS, NODE_TYPES, type NodeType } from '$lib/types';

  let collapsedSections = $state<Record<NodeType, boolean>>({
    goal: false,
    skill: false,
    project: false,
    source: false,
    cert: false,
    concept: false
  });

  function toggleSection(type: NodeType) {
    collapsedSections[type] = !collapsedSections[type];
  }

  function handleNodeClick(nodeId: string) {
    const current = $selectedNodeId;
    selectNode(current === nodeId ? null : nodeId);
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="p-4 border-b border-panel">
    <h2 class="font-semibold text-sm">Nodes</h2>
  </div>

  <!-- Node list -->
  <div class="flex-1 overflow-y-auto p-2">
    {#each NODE_TYPES as type}
      {@const nodesOfType = $nodesByType[type]}
      {@const color = getNodeColor(themeState.currentTheme, type)}
      {#if nodesOfType.length > 0}
        <div class="mb-2">
          <button
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
            <span class="ml-auto text-xs text-graph-muted">{nodesOfType.length}</span>
          </button>

          {#if !collapsedSections[type]}
            <div class="ml-4 mt-1 space-y-0.5">
              {#each nodesOfType as node}
                {@const isSelected = $selectedNodeId === node.id}
                <button
                  class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors text-sm {isSelected ? 'bg-white/10 text-white' : 'text-graph-muted hover:bg-white/5'}"
                  onclick={() => handleNodeClick(node.id)}
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
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
  </div>
</div>
