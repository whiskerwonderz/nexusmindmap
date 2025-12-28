<script lang="ts">
  import { nodes, edges, addEdge, getConnectedEdges } from '$lib/stores/graph';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPE_LABELS, EDGE_LABEL_PRESETS } from '$lib/types';

  interface Props {
    isOpen: boolean;
    sourceNodeId?: string | null;
    onClose: () => void;
  }

  let { isOpen, sourceNodeId = null, onClose }: Props = $props();

  // Form state
  let selectedSource = $state<string>('');
  let selectedTarget = $state<string>('');
  let edgeLabel = $state('');
  let showLabelPresets = $state(false);

  // Get already connected node IDs for the current source
  const existingConnections = $derived(() => {
    if (!selectedSource) return new Set<string>();
    const sourceEdges = getConnectedEdges(selectedSource);
    const connected = new Set<string>();
    sourceEdges.forEach(e => {
      if (e.from === selectedSource) connected.add(e.to);
      if (e.to === selectedSource) connected.add(e.from);
    });
    return connected;
  });

  // Available targets (all nodes except source and already connected)
  const availableTargets = $derived(
    $nodes.filter(n => n.id !== selectedSource && !existingConnections().has(n.id))
  );

  // Reset form when modal opens
  $effect(() => {
    if (isOpen) {
      selectedSource = sourceNodeId ?? '';
      selectedTarget = '';
      edgeLabel = '';
      showLabelPresets = false;
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();

    if (!selectedSource || !selectedTarget) return;

    addEdge(selectedSource, selectedTarget, edgeLabel.trim() || undefined);
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function selectPreset(preset: string) {
    edgeLabel = preset;
    showLabelPresets = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  // Get source node for display
  const sourceNode = $derived($nodes.find(n => n.id === selectedSource));
  const targetNode = $derived($nodes.find(n => n.id === selectedTarget));
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onclick={handleBackdropClick}
  >
    <div class="bg-panel border border-panel rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-panel">
        <h2 class="font-semibold">Add Connection</h2>
        <button
          type="button"
          class="text-graph-muted hover:text-white transition-colors"
          onclick={onClose}
          aria-label="Close modal"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={handleSubmit} class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Source Node -->
        <div>
          <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="source-node">
            From
          </label>
          {#if sourceNodeId}
            <!-- Pre-selected source, show as readonly -->
            {#if sourceNode}
              {@const color = getNodeColor(themeState.currentTheme, sourceNode.type)}
              <div
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style:background="{color}15"
                style:border="1px solid {color}30"
              >
                <span class="w-2 h-2 rounded-full" style:background={color}></span>
                <span>{sourceNode.label}</span>
                <span class="ml-auto text-xs text-graph-muted">{NODE_TYPE_LABELS[sourceNode.type]}</span>
              </div>
            {/if}
          {:else}
            <!-- Selectable source -->
            <select
              id="source-node"
              bind:value={selectedSource}
              required
              class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
            >
              <option value="">Select a node...</option>
              {#each $nodes as node}
                <option value={node.id}>{node.label} ({NODE_TYPE_LABELS[node.type]})</option>
              {/each}
            </select>
          {/if}
        </div>

        <!-- Connection Arrow -->
        {#if selectedSource}
          <div class="flex justify-center">
            <svg class="w-6 h-6 text-graph-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        {/if}

        <!-- Target Node -->
        <div>
          <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="target-node">
            To
          </label>
          {#if availableTargets.length > 0}
            <div class="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-white/5">
              {#each availableTargets as node}
                {@const color = getNodeColor(themeState.currentTheme, node.type)}
                {@const isSelected = selectedTarget === node.id}
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors {isSelected ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/5'}"
                  onclick={() => selectedTarget = node.id}
                >
                  <span
                    class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 {isSelected ? 'border-white' : 'border-white/30'}"
                  >
                    {#if isSelected}
                      <span class="w-2 h-2 rounded-full bg-white"></span>
                    {/if}
                  </span>
                  <span class="w-2 h-2 rounded-full shrink-0" style:background={color}></span>
                  <span class="truncate">{node.label}</span>
                  <span class="ml-auto text-xs text-graph-muted">{NODE_TYPE_LABELS[node.type]}</span>
                </button>
              {/each}
            </div>
          {:else if selectedSource}
            <p class="text-sm text-graph-muted px-3 py-2 rounded-lg bg-white/5">
              No available nodes to connect. All nodes are already connected.
            </p>
          {:else}
            <p class="text-sm text-graph-muted px-3 py-2 rounded-lg bg-white/5">
              Select a source node first
            </p>
          {/if}
        </div>

        <!-- Edge Label -->
        <div>
          <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="edge-label">
            Label (optional)
          </label>
          <div class="relative">
            <input
              id="edge-label"
              type="text"
              bind:value={edgeLabel}
              placeholder="e.g., requires, enables, built with..."
              class="w-full px-3 py-2 pr-10 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
              onfocus={() => showLabelPresets = true}
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-graph-muted hover:text-white"
              onclick={() => showLabelPresets = !showLabelPresets}
              aria-label="Toggle presets"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <!-- Preset labels -->
          {#if showLabelPresets}
            <div class="mt-2 flex flex-wrap gap-1.5">
              {#each EDGE_LABEL_PRESETS as preset}
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors {edgeLabel === preset ? 'ring-1 ring-white/30' : ''}"
                  onclick={() => selectPreset(preset)}
                >
                  {preset}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Preview -->
        {#if sourceNode && targetNode}
          {@const sourceColor = getNodeColor(themeState.currentTheme, sourceNode.type)}
          {@const targetColor = getNodeColor(themeState.currentTheme, targetNode.type)}
          <div class="p-3 rounded-lg bg-white/5 border border-white/10">
            <div class="text-xs text-graph-muted uppercase tracking-wide mb-2">Preview</div>
            <div class="flex items-center gap-2 text-sm">
              <span class="flex items-center gap-1.5" style:color={sourceColor}>
                <span class="w-2 h-2 rounded-full" style:background={sourceColor}></span>
                {sourceNode.label}
              </span>
              <span class="text-graph-muted">
                {edgeLabel || '→'}
              </span>
              <span class="flex items-center gap-1.5" style:color={targetColor}>
                <span class="w-2 h-2 rounded-full" style:background={targetColor}></span>
                {targetNode.label}
              </span>
            </div>
          </div>
        {/if}
      </form>

      <!-- Footer -->
      <div class="flex gap-3 p-4 border-t border-panel">
        <button
          type="button"
          class="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
          onclick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="flex-1 px-4 py-2 rounded-lg bg-btn-primary hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedSource || !selectedTarget}
          onclick={handleSubmit}
        >
          Create Connection
        </button>
      </div>
    </div>
  </div>
{/if}
