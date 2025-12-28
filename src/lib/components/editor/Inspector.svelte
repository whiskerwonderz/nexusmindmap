<script lang="ts">
  import { selectedNode, selectNode, getConnectedNodes } from '$lib/stores/graph';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPE_LABELS } from '$lib/types';

  // Reactive derived values
  $: connectedNodes = $selectedNode ? getConnectedNodes($selectedNode.id) : [];
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="p-4 border-b border-panel">
    <h2 class="font-semibold text-sm">Inspector</h2>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if $selectedNode}
      {@const color = getNodeColor(themeState.currentTheme, $selectedNode.type)}

      <!-- Node header -->
      <div class="flex items-start gap-3 mb-4">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center"
          style:background="{color}20"
          style:border="2px solid {color}"
        >
          <div class="w-4 h-4 rounded-full" style:background={color}></div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-base truncate">{$selectedNode.label}</h3>
          <p class="text-xs text-graph-muted uppercase tracking-wide">
            {NODE_TYPE_LABELS[$selectedNode.type]}
          </p>
        </div>
      </div>

      <!-- Description -->
      {#if $selectedNode.description}
        <div class="mb-4">
          <div class="text-xs text-graph-muted uppercase tracking-wide mb-1">
            Description
          </div>
          <p class="text-sm">{$selectedNode.description}</p>
        </div>
      {/if}

      <!-- Date -->
      {#if $selectedNode.date}
        <div class="mb-4">
          <div class="text-xs text-graph-muted uppercase tracking-wide mb-1">Date</div>
          <p class="text-sm">{$selectedNode.date}</p>
        </div>
      {/if}

      <!-- URL -->
      {#if $selectedNode.url}
        <div class="mb-4">
          <div class="text-xs text-graph-muted uppercase tracking-wide mb-1">Link</div>
          <a
            href={$selectedNode.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-blue-400 hover:text-blue-300 underline break-all"
          >
            {$selectedNode.url}
          </a>
        </div>
      {/if}

      <!-- Connections -->
      {#if connectedNodes.length > 0}
        <div class="mt-6">
          <div class="text-xs text-graph-muted uppercase tracking-wide mb-2">
            Connections ({connectedNodes.length})
          </div>
          <div class="flex flex-wrap gap-1.5">
            {#each connectedNodes as connNode}
              {@const connColor = getNodeColor(themeState.currentTheme, connNode.type)}
              <button
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-opacity hover:opacity-80"
                style:background="{connColor}20"
                style:color={connColor}
                style:border="1px solid {connColor}40"
                onclick={() => selectNode(connNode.id)}
              >
                <span class="w-1.5 h-1.5 rounded-full" style:background={connColor}></span>
                {connNode.label}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <div class="text-center text-graph-muted text-sm py-8">
        <p>Select a node to view details</p>
      </div>
    {/if}
  </div>
</div>
