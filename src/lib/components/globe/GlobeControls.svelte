<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import type { GlobeStyle, DisplayMode } from '$lib/types/traveler';
  import { exportTripsToJSON, exportTripsToCSV, exportShareableMap } from '$lib/utils/dataExport';
  import { projectStore } from '$lib/stores/projectStore.svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  let isExporting = $state(false);

  // Use direct getters for reactive individual settings
  const autoRotate = $derived(travelerStore.autoRotate);
  const animateArcs = $derived(travelerStore.animateArcs);
  const globeStyleValue = $derived(travelerStore.globeStyle);
  const displayModeValue = $derived(travelerStore.displayMode);

  const globeStyles: { value: GlobeStyle; label: string }[] = [
    { value: 'night', label: 'Night' },
    { value: 'dark', label: 'Dark' },
    { value: 'satellite', label: 'Satellite' },
    { value: 'dotted', label: 'Topology' },
  ];

  function handleExportJSON(): void {
    isExporting = true;
    try {
      exportTripsToJSON(travelerStore.trips);
      toastStore.success('Trips exported as JSON');
    } catch {
      toastStore.error('Failed to export trips');
    } finally {
      isExporting = false;
    }
  }

  function handleExportCSV(): void {
    isExporting = true;
    try {
      exportTripsToCSV(travelerStore.trips);
      toastStore.success('Trips exported as CSV');
    } catch {
      toastStore.error('Failed to export trips');
    } finally {
      isExporting = false;
    }
  }

  function handleExportShareableMap(): void {
    isExporting = true;
    try {
      const projectName = projectStore.currentTravelerProject?.name || 'My Travel Map';
      exportShareableMap(travelerStore.trips, projectName);
      toastStore.success('Shareable map exported as HTML');
    } catch {
      toastStore.error('Failed to export shareable map');
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="globe-controls {className}">
  <div class="control-section">
    <h4 class="section-title">Display</h4>
    <div class="display-modes">
      <button
        type="button"
        class="display-mode-btn"
        class:active={displayModeValue === 'all'}
        onclick={() => travelerStore.setDisplayMode('all')}
      >
        <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span class="mode-label">All</span>
      </button>
      <button
        type="button"
        class="display-mode-btn"
        class:active={displayModeValue === 'journeys'}
        onclick={() => travelerStore.setDisplayMode('journeys')}
      >
        <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
        <span class="mode-label">Journeys</span>
      </button>
      <button
        type="button"
        class="display-mode-btn"
        class:active={displayModeValue === 'destinations'}
        onclick={() => travelerStore.setDisplayMode('destinations')}
      >
        <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span class="mode-label">Destinations</span>
      </button>
    </div>
  </div>

  <div class="control-section">
    <h4 class="section-title">Animation</h4>
    <div class="toggle-group">
      <label class="toggle-item">
        <input type="checkbox" checked={autoRotate}
          onchange={() => travelerStore.toggleAutoRotate(!autoRotate)} />
        <span>Auto-rotate</span>
      </label>
      <label class="toggle-item">
        <input type="checkbox" checked={animateArcs}
          onchange={() => travelerStore.toggleArcAnimation(!animateArcs)} />
        <span>Animate arcs</span>
      </label>
    </div>
  </div>

  <div class="control-section">
    <h4 class="section-title">Globe Style</h4>
    <div class="style-dropdown">
      <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <select class="style-select" value={globeStyleValue} onchange={(e) => travelerStore.setGlobeStyle((e.target as HTMLSelectElement).value as import('$lib/types/traveler').GlobeStyle)}>
        {#each globeStyles as style}
          <option value={style.value}>{style.label}</option>
        {/each}
      </select>
      <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  </div>

  <div class="control-section">
    <h4 class="section-title">Export</h4>

    <!-- DATA exports -->
    <div class="export-category">
      <span class="category-label">DATA</span>
      <div class="data-buttons">
        <button type="button" class="data-btn" onclick={handleExportJSON} disabled={isExporting}>
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          JSON
        </button>
        <button type="button" class="data-btn" onclick={handleExportCSV} disabled={isExporting}>
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          CSV
        </button>
      </div>
    </div>

    <!-- VISUAL exports -->
    <div class="export-category">
      <span class="category-label">VISUAL</span>
      <div class="data-buttons">
        <button type="button" class="data-btn visual" onclick={handleExportShareableMap} disabled={isExporting}>
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Export Map
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .globe-controls {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .control-section { display: flex; flex-direction: column; gap: 0.5rem; }

  .section-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  .toggle-group { display: flex; flex-direction: row; gap: 1rem; }

  .toggle-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .toggle-item input { accent-color: #00d4ff; }

  /* Globe style dropdown */
  .style-dropdown {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .dropdown-icon {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.7);
    flex-shrink: 0;
  }

  .style-select {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 0.8125rem;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
  }

  .style-select option {
    background: #1a1a2e;
    color: white;
  }

  .dropdown-arrow {
    width: 14px;
    height: 14px;
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
    pointer-events: none;
  }

  /* Display mode styles */
  .display-modes {
    display: flex;
    gap: 0.375rem;
  }

  .display-mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .display-mode-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  .display-mode-btn.active {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
    color: white;
  }

  .mode-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .mode-label {
    font-size: 0.6875rem;
    font-weight: 500;
  }

  /* Data buttons */
  .data-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .data-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .data-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .data-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .data-btn.visual {
    background: rgba(147, 51, 234, 0.1);
    border-color: rgba(147, 51, 234, 0.25);
    color: rgb(196, 167, 231);
  }

  .data-btn.visual:hover:not(:disabled) {
    background: rgba(147, 51, 234, 0.2);
    color: rgb(216, 180, 254);
  }

  /* Export categories */
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
    margin-bottom: 0.375rem;
  }
</style>
