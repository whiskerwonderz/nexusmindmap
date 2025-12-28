<script lang="ts">
  import { layoutMode, setLayoutMode } from '$lib/stores/layout';
  import type { LayoutType } from '$lib/types';
  import { LAYOUT_TYPE_LABELS, LAYOUT_TYPE_DESCRIPTIONS } from '$lib/types';

  const layouts: LayoutType[] = ['radial', 'physics', 'timeline', 'cluster', 'hierarchical'];

  // SVG icons for each layout type
  const icons: Record<LayoutType, string> = {
    radial: `<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="2 2"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="18.9" cy="8" r="1.5" fill="currentColor"/><circle cx="18.9" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="20" r="1.5" fill="currentColor"/><circle cx="5.1" cy="16" r="1.5" fill="currentColor"/><circle cx="5.1" cy="8" r="1.5" fill="currentColor"/>`,
    physics: `<circle cx="5" cy="6" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="8" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="18" cy="17" r="2"/><circle cx="9" cy="19" r="2"/><line x1="7" y1="6" x2="10" y2="5" opacity="0.5"/><line x1="14" y1="5" x2="17" y2="7" opacity="0.5"/><line x1="8" y1="14" x2="12" y2="12" opacity="0.5"/>`,
    timeline: `<line x1="4" y1="12" x2="20" y2="12" opacity="0.3"/><circle cx="6" cy="8" r="2" fill="currentColor"/><circle cx="12" cy="8" r="2" fill="currentColor"/><circle cx="18" cy="8" r="2" fill="currentColor"/><circle cx="8" cy="16" r="2" fill="currentColor"/><circle cx="15" cy="16" r="2" fill="currentColor"/><line x1="6" y1="10" x2="6" y2="12" opacity="0.3"/><line x1="12" y1="10" x2="12" y2="12" opacity="0.3"/><line x1="18" y1="10" x2="18" y2="12" opacity="0.3"/>`,
    cluster: `<circle cx="7" cy="7" r="6" fill="none" stroke-dasharray="2 2" opacity="0.5"/><circle cx="17" cy="9" r="5" fill="none" stroke-dasharray="2 2" opacity="0.5"/><circle cx="12" cy="17" r="4" fill="none" stroke-dasharray="2 2" opacity="0.5"/><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="7" cy="5" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="18" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/>`,
    hierarchical: `<circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="12" r="2" fill="currentColor"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="8" cy="20" r="1.5" fill="currentColor"/><circle cx="16" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/><line x1="12" y1="6" x2="6" y2="10" opacity="0.5"/><line x1="12" y1="6" x2="12" y2="10" opacity="0.5"/><line x1="12" y1="6" x2="18" y2="10" opacity="0.5"/><line x1="6" y1="14" x2="4" y2="18" opacity="0.5"/><line x1="6" y1="14" x2="8" y2="18" opacity="0.5"/><line x1="18" y1="14" x2="16" y2="18" opacity="0.5"/><line x1="18" y1="14" x2="20" y2="18" opacity="0.5"/>`
  };
</script>

<div class="layout-switcher">
  {#each layouts as layout}
    <button
      type="button"
      class="layout-btn"
      class:active={$layoutMode === layout}
      onclick={() => setLayoutMode(layout)}
      title={LAYOUT_TYPE_DESCRIPTIONS[layout]}
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        {@html icons[layout]}
      </svg>
      <span class="label">{LAYOUT_TYPE_LABELS[layout]}</span>
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
    color: var(--color-text-muted, #888);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .layout-btn:hover {
    color: var(--color-text, #fff);
    background: rgba(255, 255, 255, 0.05);
  }

  .layout-btn.active {
    color: var(--color-text, #fff);
    background: rgba(255, 255, 255, 0.15);
  }

  .layout-btn svg {
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
