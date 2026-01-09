<script lang="ts">
  import {
    selectedNode,
    selectNode,
    getConnectedNodes,
    getConnectedEdges,
    updateNode,
    deleteNode,
    deleteEdge,
    edges,
    nodeMap,
    nodes
  } from '$lib/stores/graph';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPE_LABELS } from '$lib/types';

  interface Props {
    onAddConnection?: (nodeId: string) => void;
  }

  let { onAddConnection }: Props = $props();

  let showDeleteConfirm = $state(false);
  let isEditingTypeName = $state(false);
  let editTypeName = $state('');

  // Editable form state
  let editLabel = $state('');
  let editDescription = $state('');
  let editDate = $state('');
  let editUrl = $state('');
  let editParent = $state<string | null>(null);

  // Track which node we're editing to reset form when selection changes
  let editingNodeId = $state<string | null>(null);

  // Reactive derived values - use $derived for Svelte 5
  const connectedNodes = $derived($selectedNode ? getConnectedNodes($selectedNode.id) : []);
  const connectedEdges = $derived($selectedNode ? getConnectedEdges($selectedNode.id) : []);

  // Sync form state when selected node changes
  $effect(() => {
    if ($selectedNode && $selectedNode.id !== editingNodeId) {
      editLabel = $selectedNode.label;
      editDescription = $selectedNode.description ?? '';
      editDate = $selectedNode.date ?? '';
      editUrl = $selectedNode.url ?? '';
      editParent = $selectedNode.parent ?? null;
      editingNodeId = $selectedNode.id;
      showDeleteConfirm = false;
    } else if (!$selectedNode) {
      editingNodeId = null;
      showDeleteConfirm = false;
    }
  });

  // Get available parent nodes (all nodes except current and its descendants)
  const availableParents = $derived.by(() => {
    if (!$selectedNode) return [];
    return $nodes.filter(n => n.id !== $selectedNode.id);
  });

  function handleLabelChange() {
    if ($selectedNode && editLabel.trim()) {
      updateNode($selectedNode.id, { label: editLabel.trim() });
    }
  }

  function handleDescriptionChange() {
    if ($selectedNode) {
      updateNode($selectedNode.id, { description: editDescription.trim() || undefined });
    }
  }

  function handleDateChange() {
    if ($selectedNode) {
      updateNode($selectedNode.id, { date: editDate.trim() || undefined });
    }
  }

  function handleUrlChange() {
    if ($selectedNode) {
      updateNode($selectedNode.id, { url: editUrl.trim() || undefined });
    }
  }

  function handleParentChange() {
    if ($selectedNode) {
      updateNode($selectedNode.id, { parent: editParent || undefined });
    }
  }

  function handleDeleteNode() {
    if ($selectedNode) {
      deleteNode($selectedNode.id);
      showDeleteConfirm = false;
    }
  }

  function handleDeleteEdge(edgeId: string) {
    deleteEdge(edgeId);
  }

  function getOtherNode(edge: { from: string; to: string }, currentNodeId: string) {
    const otherId = edge.from === currentNodeId ? edge.to : edge.from;
    return $nodeMap.get(otherId);
  }

  function getEdgeDirection(edge: { from: string; to: string }, currentNodeId: string): 'from' | 'to' {
    return edge.from === currentNodeId ? 'to' : 'from';
  }

  function startEditingTypeName() {
    if ($selectedNode) {
      editTypeName = appStore.getNodeTypeLabel($selectedNode.type);
      isEditingTypeName = true;
    }
  }

  function saveTypeName() {
    if ($selectedNode && editTypeName.trim()) {
      appStore.setNodeTypeLabel($selectedNode.type, editTypeName.trim());
    }
    isEditingTypeName = false;
  }

  function cancelEditTypeName() {
    isEditingTypeName = false;
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="p-4 border-b border-panel">
    <h2 class="font-semibold text-sm">Inspector</h2>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    {#if $selectedNode}
      {@const color = getNodeColor(themeState.currentTheme, $selectedNode.type)}

      <!-- Node type badge (click to edit) -->
      <div class="flex items-center gap-2 mb-4">
        {#if isEditingTypeName}
          <div class="flex items-center gap-2 flex-1">
            <input
              type="text"
              bind:value={editTypeName}
              onkeydown={(e) => {
                if (e.key === 'Enter') saveTypeName();
                if (e.key === 'Escape') cancelEditTypeName();
              }}
              onblur={saveTypeName}
              class="flex-1 px-2 py-1 rounded-lg bg-input border border-panel text-xs focus:outline-none focus:border-white/20"
              autofocus
            />
          </div>
        {:else}
          <button
            type="button"
            onclick={startEditingTypeName}
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
            style:background="{color}20"
            style:color={color}
            style:border="1px solid {color}40"
            title="Click to rename this node type"
          >
            <span class="w-2 h-2 rounded-full" style:background={color}></span>
            {appStore.getNodeTypeLabel($selectedNode.type)}
            <svg class="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Label field -->
      <div class="mb-4">
        <label for="inspector-label" class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block">
          Label
        </label>
        <input
          id="inspector-label"
          type="text"
          bind:value={editLabel}
          onblur={handleLabelChange}
          onkeydown={(e) => e.key === 'Enter' && handleLabelChange()}
          class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
        />
      </div>

      <!-- Description field -->
      <div class="mb-4">
        <label for="inspector-description" class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block">
          Description
        </label>
        <textarea
          id="inspector-description"
          bind:value={editDescription}
          onblur={handleDescriptionChange}
          placeholder="Add a description..."
          rows="3"
          class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20 resize-none"
        ></textarea>
      </div>

      <!-- Date field -->
      <div class="mb-4">
        <label for="inspector-date" class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block">
          Date
        </label>
        <input
          id="inspector-date"
          type="text"
          bind:value={editDate}
          onblur={handleDateChange}
          onkeydown={(e) => e.key === 'Enter' && handleDateChange()}
          placeholder="e.g., 2024-01"
          class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
        />
      </div>

      <!-- URL field -->
      <div class="mb-4">
        <label for="inspector-url" class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block">
          URL
        </label>
        <input
          id="inspector-url"
          type="url"
          bind:value={editUrl}
          onblur={handleUrlChange}
          onkeydown={(e) => e.key === 'Enter' && handleUrlChange()}
          placeholder="https://..."
          class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20"
        />
        {#if editUrl}
          <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open link
          </a>
        {/if}
      </div>

      <!-- Parent field (for hierarchy) -->
      <div class="mb-4">
        <label for="inspector-parent" class="text-xs text-graph-muted uppercase tracking-wide mb-1.5 block">
          Parent (Hierarchy)
        </label>
        <select
          id="inspector-parent"
          bind:value={editParent}
          onchange={handleParentChange}
          class="w-full px-3 py-2 rounded-lg bg-input border border-panel text-sm focus:outline-none focus:border-white/20 cursor-pointer"
        >
          <option value={null}>No parent (root)</option>
          {#each availableParents as node}
            {@const nodeColor = getNodeColor(themeState.currentTheme, node.type)}
            <option value={node.id}>
              {node.label} ({appStore.getNodeTypeLabel(node.type)})
            </option>
          {/each}
        </select>
        {#if editParent}
          {@const parentNode = $nodeMap.get(editParent)}
          {#if parentNode}
            {@const parentColor = getNodeColor(themeState.currentTheme, parentNode.type)}
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-xs mt-1.5 hover:opacity-80"
              style:color={parentColor}
              onclick={() => selectNode(parentNode.id)}
            >
              <span class="w-1.5 h-1.5 rounded-full" style:background={parentColor}></span>
              Go to {parentNode.label}
            </button>
          {/if}
        {/if}
      </div>

      <!-- Connections -->
      <div class="mt-6 pt-4 border-t border-panel">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-graph-muted uppercase tracking-wide">
            Connections ({connectedEdges.length})
          </span>
          {#if onAddConnection}
            <button
              type="button"
              class="text-xs text-blue-400 hover:text-blue-300"
              onclick={() => onAddConnection?.($selectedNode!.id)}
            >
              + Add
            </button>
          {/if}
        </div>

        {#if connectedEdges.length > 0}
          <div class="space-y-1.5">
            {#each connectedEdges as edge}
              {@const otherNode = getOtherNode(edge, $selectedNode.id)}
              {@const direction = getEdgeDirection(edge, $selectedNode.id)}
              {#if otherNode}
                {@const connColor = getNodeColor(themeState.currentTheme, otherNode.type)}
                <div
                  class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 group"
                >
                  <span class="text-xs text-graph-muted">
                    {direction === 'to' ? '→' : '←'}
                  </span>
                  <button
                    type="button"
                    class="flex-1 flex items-center gap-1.5 text-left text-sm hover:opacity-80 truncate"
                    style:color={connColor}
                    onclick={() => selectNode(otherNode.id)}
                  >
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" style:background={connColor}></span>
                    <span class="truncate">{otherNode.label}</span>
                  </button>
                  {#if edge.label}
                    <span class="text-xs text-graph-muted truncate max-w-[60px]">{edge.label}</span>
                  {/if}
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 text-graph-muted hover:text-red-400 transition-opacity"
                    onclick={() => handleDeleteEdge(edge.id)}
                    title="Remove connection"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        {:else}
          <p class="text-xs text-graph-muted">No connections yet</p>
        {/if}
      </div>

      <!-- Delete Node -->
      <div class="mt-6 pt-4 border-t border-panel">
        {#if showDeleteConfirm}
          <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p class="text-sm text-red-400 mb-3">Delete "{$selectedNode.label}"?</p>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                onclick={handleDeleteNode}
              >
                Delete
              </button>
              <button
                type="button"
                class="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs transition-colors"
                onclick={() => showDeleteConfirm = false}
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <button
            type="button"
            class="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-graph-muted hover:text-red-400 text-sm transition-colors"
            onclick={() => showDeleteConfirm = true}
          >
            Delete Node
          </button>
        {/if}
      </div>
    {:else}
      <div class="text-center text-graph-muted text-sm py-8">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <p>Select a node to view details</p>
        <p class="text-xs mt-1">Click on any node in the graph</p>
      </div>
    {/if}
  </div>
</div>
