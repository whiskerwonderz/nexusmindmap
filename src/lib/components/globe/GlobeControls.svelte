<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import type { ArcColorScheme, GlobeStyle } from '$lib/types/traveler';

  interface Props {
    onResetView?: () => void;
    onFocusHome?: () => void;
    class?: string;
  }

  let { onResetView, onFocusHome, class: className = '' }: Props = $props();

  // Use direct getters for reactive individual settings
  const autoRotate = $derived(travelerStore.autoRotate);
  const animateArcs = $derived(travelerStore.animateArcs);
  const globeStyleValue = $derived(travelerStore.globeStyle);
  const colorSchemeValue = $derived(travelerStore.colorScheme);
  const settings = $derived(travelerStore.settings);
  const availableYears = $derived(travelerStore.availableYears);

  const colorSchemes: { value: ArcColorScheme; label: string; preview: string[] }[] = [
    { value: 'cosmic', label: 'Cosmic', preview: ['#00d4ff', '#a855f7'] },
    { value: 'sunset', label: 'Sunset', preview: ['#f97316', '#ec4899'] },
    { value: 'ocean', label: 'Ocean', preview: ['#0ea5e9', '#14b8a6'] },
    { value: 'mono', label: 'Mono', preview: ['#e2e8f0', '#94a3b8'] },
  ];

  const globeStyles: { value: GlobeStyle; label: string }[] = [
    { value: 'night', label: 'Night' },
    { value: 'dark', label: 'Dark' },
    { value: 'satellite', label: 'Satellite' },
    { value: 'dotted', label: 'Topology' },
  ];

  function handleYearChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    travelerStore.setYearFilter(target.value ? parseInt(target.value) : undefined);
  }
</script>

<div class="globe-controls {className}">
  <div class="control-section">
    <h4 class="section-title">View</h4>
    <div class="button-group">
      <button type="button" class="control-btn" onclick={onResetView}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
        </svg>
        Reset
      </button>
      {#if travelerStore.homeBase}
        <button type="button" class="control-btn" onclick={onFocusHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
      {/if}
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

  {#if availableYears.length > 0}
    <div class="control-section">
      <h4 class="section-title">Filter by Year</h4>
      <select class="year-select" value={settings.yearFilter ?? ''} onchange={handleYearChange}>
        <option value="">All years</option>
        {#each availableYears as year}<option value={year}>{year}</option>{/each}
      </select>
    </div>
  {/if}

  <div class="control-section">
    <h4 class="section-title">Arc Colors</h4>
    <div class="color-schemes">
      {#each colorSchemes as scheme}
        <button type="button" class="color-scheme-btn" class:active={colorSchemeValue === scheme.value}
          onclick={() => travelerStore.setColorScheme(scheme.value)}>
          <div class="color-preview">
            <span style="background: {scheme.preview[0]}"></span>
            <span style="background: {scheme.preview[1]}"></span>
          </div>
          <span class="scheme-label">{scheme.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="control-section">
    <h4 class="section-title">Globe Style</h4>
    <div class="globe-styles">
      {#each globeStyles as style}
        <button type="button" class="style-btn" class:active={globeStyleValue === style.value}
          onclick={() => travelerStore.setGlobeStyle(style.value)}>
          {style.label}
        </button>
      {/each}
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

  .button-group { display: flex; gap: 0.5rem; }

  .control-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .control-btn:hover { background: rgba(255, 255, 255, 0.1); }

  .toggle-group { display: flex; flex-direction: column; gap: 0.5rem; }

  .toggle-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .toggle-item input { accent-color: #00d4ff; }

  .year-select {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
  }

  .color-schemes, .globe-styles {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .color-scheme-btn, .style-btn {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .color-scheme-btn:hover, .style-btn:hover { background: rgba(255, 255, 255, 0.08); }

  .color-scheme-btn.active, .style-btn.active {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
    color: white;
  }

  .color-scheme-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
  }

  .color-preview { display: flex; gap: 2px; }
  .color-preview span { width: 20px; height: 12px; border-radius: 2px; }
  .scheme-label { font-size: 0.75rem; }
</style>
