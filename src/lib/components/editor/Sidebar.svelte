<script lang="ts">
  import { nodes, edges, nodesByType, selectNode, selectedNodeId, loadData, clear } from '$lib/stores/graph';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { NODE_TYPES, type NodeType } from '$lib/types';
  import { exportNodesToCSV, importNodesFromCSV, exportShareableGraph, downloadBuilderNodesTemplate, downloadBuilderEdgesTemplate } from '$lib/utils/dataExport';
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';

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

  // File input refs
  let fileInputRef = $state<HTMLInputElement | null>(null);
  let isImporting = $state(false);

  // Export functions
  function handleExportCSV(): void {
    exportNodesToCSV($nodes, $edges);
    toastStore.success('Nodes exported to CSV');
  }

  function handleExportGraph(): void {
    const projectName = projectStore.currentBuilderProject?.name || 'My Knowledge Graph';
    const customLabels = appStore.builderSettings.customNodeTypeLabels || {};
    const currentLayout = appStore.builderSettings.layout || 'physics';
    exportShareableGraph($nodes, $edges, projectName, customLabels, currentLayout);
    toastStore.success('Graph exported as HTML');
  }

  // Import trigger
  function triggerImport(): void {
    fileInputRef?.click();
  }

  // Handle CSV file import
  async function handleFileImport(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    isImporting = true;

    try {
      const result = await importNodesFromCSV(file);

      // Load the imported data (replaces existing)
      loadData({
        version: '1.0',
        meta: { title: 'Imported Graph' },
        nodes: result.nodes,
        edges: result.edges,
      });

      toastStore.success(`Imported ${result.nodes.length} nodes and ${result.edges.length} connections`);
    } catch (error) {
      console.error('Import failed:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to import file');
    } finally {
      isImporting = false;
      target.value = '';
    }
  }

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
            <span class="text-sm font-medium">{appStore.getNodeTypeLabel(type)}</span>
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

  <!-- Import/Export Section -->
  <div class="p-4 border-t border-panel">
    <h3 class="text-xs text-graph-muted uppercase tracking-wide mb-3">Data</h3>

    <!-- Hidden file inputs -->
    <input
      type="file"
      accept=".csv"
      bind:this={fileInputRef}
      onchange={handleFileImport}
      class="hidden"
    />

    <div class="space-y-3">
      <!-- EXPORT section -->
      <div class="export-category">
        <span class="category-label">EXPORT</span>
        <div class="space-y-2">
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
            onclick={handleExportCSV}
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Export CSV
          </button>
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg export-graph-btn text-sm transition-colors"
            onclick={handleExportGraph}
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="3"/>
              <circle cx="5" cy="19" r="3"/>
              <circle cx="19" cy="19" r="3"/>
              <line x1="12" y1="8" x2="5" y2="16"/>
              <line x1="12" y1="8" x2="19" y2="16"/>
            </svg>
            Export Graph (HTML)
          </button>
        </div>
      </div>

      <!-- IMPORT section with 2-step flow -->
      <div class="export-category">
        <span class="category-label">IMPORT</span>
        <div class="space-y-2">
          <!-- Step 1: Download Templates -->
          <div class="import-step">
            <span class="step-number">1</span>
            <span class="step-label">Get template</span>
            <div class="template-buttons">
              <button
                type="button"
                class="template-btn"
                onclick={downloadBuilderNodesTemplate}
                title="Download CSV template"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Nodes
              </button>
              <button
                type="button"
                class="template-btn"
                onclick={downloadBuilderEdgesTemplate}
                title="Download CSV template"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Edges
              </button>
            </div>
          </div>

          <!-- Step 2: Upload CSV -->
          <div class="import-step">
            <span class="step-number">2</span>
            <span class="step-label">Upload CSV</span>
            <button
              type="button"
              class="import-btn"
              class:opacity-50={isImporting}
              disabled={isImporting}
              onclick={triggerImport}
              title="Use CSV template for correct format"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .help-tooltip {
    position: relative;
  }

  .help-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .help-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .tooltip-content {
    display: none;
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 8px;
    padding: 12px;
    background: rgba(30, 30, 30, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    font-size: 11px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    width: 280px;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .help-tooltip:hover .tooltip-content {
    display: block;
  }

  .tooltip-content strong {
    color: white;
    display: block;
    margin-bottom: 8px;
  }

  .tooltip-content pre {
    background: rgba(255, 255, 255, 0.1);
    padding: 6px 8px;
    border-radius: 4px;
    margin-bottom: 8px;
    overflow-x: auto;
    font-size: 10px;
  }

  .tooltip-content p {
    margin: 4px 0;
  }

  .tooltip-content p strong {
    display: inline;
    margin: 0;
  }

  .export-category {
    margin-bottom: 0.5rem;
  }

  .export-category:last-child {
    margin-bottom: 0;
  }

  .category-label {
    display: block;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.35);
    margin-bottom: 0.5rem;
  }

  .export-graph-btn {
    background: rgba(147, 51, 234, 0.1);
    border: 1px solid rgba(147, 51, 234, 0.25);
    color: rgb(196, 167, 231);
  }

  .export-graph-btn:hover {
    background: rgba(147, 51, 234, 0.2);
    color: rgb(216, 180, 254);
  }

  /* Import 2-step flow styles */
  .import-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  .step-number {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(0, 212, 255, 0.15);
    color: #00d4ff;
    font-size: 0.625rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    flex: 1;
  }

  .template-buttons {
    display: flex;
    gap: 0.375rem;
  }

  .template-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.25);
    border-radius: 6px;
    color: #22c55e;
    font-size: 0.6875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .template-btn:hover {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
  }

  .import-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.25);
    border-radius: 6px;
    color: #00d4ff;
    font-size: 0.6875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .import-btn:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.4);
  }

  .import-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
