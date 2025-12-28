<script lang="ts">
  import { nodes, addNode, addEdge } from '$lib/stores/graph';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPES, NODE_TYPE_LABELS, type NodeType } from '$lib/types';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  // Form state
  let selectedType = $state<NodeType>('skill');
  let label = $state('');
  let description = $state('');
  let date = $state('');
  let url = $state('');
  let connectTo = $state<string[]>([]);

  // Reset form when modal opens
  $effect(() => {
    if (isOpen) {
      selectedType = 'skill';
      label = '';
      description = '';
      date = '';
      url = '';
      connectTo = [];
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();

    if (!label.trim()) return;

    // Get canvas center for initial position
    const centerX = 400 + Math.random() * 100 - 50;
    const centerY = 300 + Math.random() * 100 - 50;

    const nodeId = addNode({
      label: label.trim(),
      type: selectedType,
      description: description.trim() || undefined,
      date: date.trim() || undefined,
      url: url.trim() || undefined,
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0
    });

    // Add connections
    connectTo.forEach(targetId => {
      addEdge(nodeId, targetId);
    });

    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function toggleConnection(nodeId: string) {
    if (connectTo.includes(nodeId)) {
      connectTo = connectTo.filter(id => id !== nodeId);
    } else {
      connectTo = [...connectTo, nodeId];
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
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
        <h2 class="font-semibold">Add Node</h2>
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
        <!-- Type Selection -->
        <div>
          <span class="text-xs text-graph-muted uppercase tracking-wide mb-2 block">Type</span>
          <div class="grid grid-cols-3 gap-2" role="group" aria-label="Node type selection">
            {#each NODE_TYPES as type}
              {@const color = getNodeColor(themeState.currentTheme, type)}
              {@const isSelected = selectedType === type}
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all {isSelected ? 'ring-2 ring-white/30' : 'hover:bg-white/5'}"
                style:background={isSelected ? `${color}30` : `${color}10`}
                style:color={color}
                style:border="1px solid {isSelected ? color : `${color}30`}"
                onclick={() => selectedType = type}
              >
                <span class="w-2 h-2 rounded-full" style:background={color}></span>
                {NODE_TYPE_LABELS[type]}
              </button>
            {/each}
          </div>
        </div>

        <!-- Label -->
        <div>
          <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="node-label">
            Label *
          </label>
          <input
            id="node-label"
            type="text"
            bind:value={label}
            placeholder="Enter node label..."
            required
            class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="node-description">
            Description
          </label>
          <textarea
            id="node-description"
            bind:value={description}
            placeholder="Optional description..."
            rows="2"
            class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20 resize-none"
          ></textarea>
        </div>

        <!-- Date and URL row -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="node-date">
              Date
            </label>
            <input
              id="node-date"
              type="text"
              bind:value={date}
              placeholder="e.g., 2024-01"
              class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block" for="node-url">
              URL
            </label>
            <input
              id="node-url"
              type="url"
              bind:value={url}
              placeholder="https://..."
              class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        <!-- Connect to existing nodes -->
        {#if $nodes.length > 0}
          <div>
            <span class="text-xs text-graph-muted uppercase tracking-wide mb-2 block">
              Connect to ({connectTo.length} selected)
            </span>
            <div class="max-h-32 overflow-y-auto space-y-1 p-2 rounded-lg bg-white/5" role="group" aria-label="Select nodes to connect">
              {#each $nodes as node}
                {@const color = getNodeColor(themeState.currentTheme, node.type)}
                {@const isSelected = connectTo.includes(node.id)}
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors {isSelected ? 'bg-white/10' : 'hover:bg-white/5'}"
                  onclick={() => toggleConnection(node.id)}
                >
                  <span
                    class="w-4 h-4 rounded border flex items-center justify-center shrink-0 {isSelected ? 'border-white/40 bg-white/20' : 'border-white/20'}"
                  >
                    {#if isSelected}
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    {/if}
                  </span>
                  <span class="w-2 h-2 rounded-full shrink-0" style:background={color}></span>
                  <span class="truncate">{node.label}</span>
                  <span class="ml-auto text-xs text-graph-muted">{NODE_TYPE_LABELS[node.type]}</span>
                </button>
              {/each}
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
          disabled={!label.trim()}
          onclick={handleSubmit}
        >
          Create Node
        </button>
      </div>
    </div>
  </div>
{/if}
