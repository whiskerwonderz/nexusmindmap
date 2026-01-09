<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import type { ArcColorScheme, DisplayMode } from '$lib/types/traveler';
  import { exportTripsToJSON, exportTripsToCSV, importFromJSON, importFromCSV, validateImportedTrips } from '$lib/utils/dataExport';

  interface Props {
    onResetView?: () => void;
    onFocusHome?: () => void;
    onStyleChange?: (style: 'dark' | 'light' | 'terrain') => void;
    class?: string;
  }

  let { onResetView, onFocusHome, onStyleChange, class: className = '' }: Props = $props();

  let fileInput: HTMLInputElement;
  let isExporting = $state(false);
  let isImporting = $state(false);
  let mapStyle = $state<'dark' | 'light' | 'terrain'>('dark');

  const settings = $derived(travelerStore.settings);
  const availableYears = $derived(travelerStore.availableYears);
  const displayModeValue = $derived(travelerStore.displayMode);
  const colorSchemeValue = $derived(travelerStore.colorScheme);
  const journeyCount = $derived(travelerStore.journeyCount);
  const destinationCount = $derived(travelerStore.destinationCount);

  const displayModes: { value: DisplayMode; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'journeys', label: 'Journeys' },
    { value: 'destinations', label: 'Destinations' },
  ];

  const colorSchemes: { value: ArcColorScheme; label: string; preview: string[] }[] = [
    { value: 'cosmic', label: 'Cosmic', preview: ['#00d4ff', '#a855f7'] },
    { value: 'sunset', label: 'Sunset', preview: ['#f97316', '#ec4899'] },
    { value: 'ocean', label: 'Ocean', preview: ['#0ea5e9', '#14b8a6'] },
    { value: 'mono', label: 'Mono', preview: ['#e2e8f0', '#94a3b8'] },
  ];

  const mapStyles: { value: 'dark' | 'light' | 'terrain'; label: string }[] = [
    { value: 'dark', label: 'Dark Matter' },
    { value: 'light', label: 'Positron' },
    { value: 'terrain', label: 'Voyager' },
  ];

  function handleStyleChange(style: 'dark' | 'light' | 'terrain'): void {
    mapStyle = style;
    onStyleChange?.(style);
  }

  function handleYearChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    travelerStore.setYearFilter(target.value ? parseInt(target.value) : undefined);
  }

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

  function triggerImport(): void {
    fileInput?.click();
  }

  async function handleFileImport(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    isImporting = true;
    try {
      const isCSV = file.name.toLowerCase().endsWith('.csv');

      if (isCSV) {
        // Import from CSV
        const trips = await importFromCSV(file);
        if (trips.length > 0) {
          trips.forEach(trip => travelerStore.addTrip(trip));
          toastStore.success(`Successfully imported ${trips.length} trip${trips.length > 1 ? 's' : ''} from CSV!`);
        } else {
          toastStore.warning('No valid trips found in the CSV file.');
        }
      } else {
        // Import from JSON
        const data = await importFromJSON(file);
        if (data.type === 'trips' && data.trips) {
          const validTrips = validateImportedTrips(data.trips);
          if (validTrips.length > 0) {
            validTrips.forEach(trip => travelerStore.addTrip(trip));
            toastStore.success(`Successfully imported ${validTrips.length} trip${validTrips.length > 1 ? 's' : ''}!`);
          } else {
            toastStore.warning('No valid trips found in the file.');
          }
        }
      }
    } catch (error) {
      toastStore.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isImporting = false;
      target.value = '';
    }
  }
</script>

<div class="map-controls {className}">
  <div class="control-section">
    <h4 class="section-title">View</h4>
    <div class="button-group">
      <button type="button" class="control-btn" onclick={onResetView}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
        </svg>
        Fit All
      </button>
      {#if travelerStore.homeBase}
        <button type="button" class="control-btn" onclick={onFocusHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
      {/if}
    </div>
  </div>

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
        <span class="mode-count">{journeyCount + destinationCount}</span>
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
        <span class="mode-count">{journeyCount}</span>
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
        <span class="mode-count">{destinationCount}</span>
      </button>
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
    <h4 class="section-title">Route Colors</h4>
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
    <h4 class="section-title">Map Style</h4>
    <div class="map-styles">
      {#each mapStyles as style}
        <button type="button" class="style-btn" class:active={mapStyle === style.value}
          onclick={() => handleStyleChange(style.value)}>
          {style.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="control-section">
    <h4 class="section-title">Data</h4>
    <div class="data-buttons">
      <button type="button" class="data-btn" onclick={handleExportCSV} disabled={isExporting}>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Export CSV
      </button>
      <button type="button" class="data-btn import" onclick={triggerImport} disabled={isImporting}>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {isImporting ? 'Importing...' : 'Import CSV'}
      </button>
    </div>
    <input
      type="file"
      accept=".csv"
      class="hidden-input"
      bind:this={fileInput}
      onchange={handleFileImport}
    />
  </div>
</div>

<style>
  .map-controls {
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

  .year-select {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
  }

  .color-schemes, .map-styles {
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

  .mode-count {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
  }

  .display-mode-btn.active .mode-count {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
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

  .data-btn.import {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }

  .data-btn.import:hover:not(:disabled) {
    background: rgba(0, 212, 255, 0.2);
  }

  .hidden-input {
    display: none;
  }
</style>
