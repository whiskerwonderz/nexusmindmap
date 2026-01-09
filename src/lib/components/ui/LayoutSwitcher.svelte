<script lang="ts">
  import { appStore } from '$lib/stores/appStore.svelte';
  import { layoutMode, setLayoutMode } from '$lib/stores/layout';
  import type { BuilderLayout, TravelerLayout } from '$lib/types/index';
  import type { LayoutType } from '$lib/types';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const mode = $derived(appStore.mode);

  // Layout metadata
  type LayoutMeta = { icon: string; label: string; description: string };

  const LAYOUT_META: Record<string, LayoutMeta> = {
    // Builder layouts
    radial: {
      icon: `<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="2 2"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="18.9" cy="8" r="1.5" fill="currentColor"/><circle cx="18.9" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="20" r="1.5" fill="currentColor"/><circle cx="5.1" cy="16" r="1.5" fill="currentColor"/><circle cx="5.1" cy="8" r="1.5" fill="currentColor"/>`,
      label: 'Radial',
      description: 'Concentric rings by type',
    },
    physics: {
      icon: `<circle cx="5" cy="6" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="8" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="18" cy="17" r="2"/><circle cx="9" cy="19" r="2"/><line x1="7" y1="6" x2="10" y2="5" opacity="0.5"/><line x1="14" y1="5" x2="17" y2="7" opacity="0.5"/><line x1="8" y1="14" x2="12" y2="12" opacity="0.5"/>`,
      label: 'Constellation',
      description: 'Force-directed simulation',
    },
    cluster: {
      icon: `<circle cx="7" cy="7" r="6" fill="none" stroke-dasharray="2 2" opacity="0.5"/><circle cx="17" cy="9" r="5" fill="none" stroke-dasharray="2 2" opacity="0.5"/><circle cx="12" cy="17" r="4" fill="none" stroke-dasharray="2 2" opacity="0.5"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="7" cy="5" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="18" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/>`,
      label: 'Cluster',
      description: 'Grouped by type',
    },
    hierarchical: {
      icon: `<circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="12" r="2" fill="currentColor"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="8" cy="20" r="1.5" fill="currentColor"/><circle cx="16" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/><line x1="12" y1="6" x2="6" y2="10" opacity="0.5"/><line x1="12" y1="6" x2="12" y2="10" opacity="0.5"/><line x1="12" y1="6" x2="18" y2="10" opacity="0.5"/><line x1="6" y1="14" x2="4" y2="18" opacity="0.5"/><line x1="6" y1="14" x2="8" y2="18" opacity="0.5"/><line x1="18" y1="14" x2="16" y2="18" opacity="0.5"/><line x1="18" y1="14" x2="20" y2="18" opacity="0.5"/>`,
      label: 'Hierarchy',
      description: 'Tree structure',
    },
    // Traveler layouts
    globe: {
      icon: `<circle cx="12" cy="12" r="9"/><path d="M12 3a18 18 0 0 0 0 18" /><path d="M12 3a18 18 0 0 1 0 18" /><line x1="3" y1="12" x2="21" y2="12"/>`,
      label: 'Globe',
      description: '3D globe view',
    },
    map: {
      icon: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14"/><path d="M16 5v14"/><circle cx="6" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="9" r="1" fill="currentColor"/>`,
      label: 'Map',
      description: '2D map projection',
    },
    timeline: {
      icon: `<line x1="12" y1="3" x2="12" y2="21" opacity="0.3"/><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/><line x1="14" y1="5" x2="18" y2="5" opacity="0.5"/><line x1="14" y1="12" x2="18" y2="12" opacity="0.5"/><line x1="14" y1="19" x2="18" y2="19" opacity="0.5"/>`,
      label: 'Timeline',
      description: 'Cinematic journey view',
    },
  };

  // Get layouts based on mode
  const builderLayouts = ['radial', 'physics', 'cluster', 'hierarchical'] as const;
  const travelerLayouts = ['globe', 'map', 'timeline'] as const;

  const availableLayouts = $derived(mode === 'builder' ? builderLayouts : travelerLayouts);

  // Get current layout based on mode
  const currentLayout = $derived(
    mode === 'builder' ? $layoutMode : appStore.travelerSettings.layout
  );

  function handleLayoutChange(layout: string): void {
    if (mode === 'builder') {
      // Use the old layout store for builder mode (GraphCanvas compatibility)
      setLayoutMode(layout as LayoutType);
      // Also sync to appStore
      appStore.setBuilderLayout(layout as BuilderLayout);
    } else {
      // Use appStore for traveler mode
      appStore.setTravelerLayout(layout as TravelerLayout);
    }
  }
</script>

<div class="layout-switcher {className}" role="tablist" aria-label="Layout options">
  {#each availableLayouts as layout}
    {@const meta = LAYOUT_META[layout] ?? { icon: '', label: layout, description: '' }}
    <button
      type="button"
      role="tab"
      aria-selected={currentLayout === layout}
      class="layout-btn"
      class:active={currentLayout === layout}
      onclick={() => handleLayoutChange(layout)}
      title={meta.description}
    >
      <svg class="layout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        {@html meta.icon}
      </svg>
      <span class="label">{meta.label}</span>
    </button>
  {/each}
</div>

<style>
  .layout-switcher {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .layout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .layout-btn:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.05);
  }

  .layout-btn.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
  }

  .layout-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .label {
    display: none;
  }

  @media (min-width: 768px) {
    .label {
      display: inline;
    }
  }
</style>
