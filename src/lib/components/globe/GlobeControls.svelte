<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import type { ArcColorScheme, GlobeStyle, DisplayMode } from '$lib/types/traveler';
  import { exportTripsToJSON, exportTripsToCSV, importFromJSON, importFromCSV, validateImportedTrips } from '$lib/utils/dataExport';

  interface Props {
    onResetView?: () => void;
    onFocusHome?: () => void;
    class?: string;
  }

  let { onResetView, onFocusHome, class: className = '' }: Props = $props();

  let fileInput: HTMLInputElement;
  let aiFileInput: HTMLInputElement;
  let isExporting = $state(false);
  let isImporting = $state(false);

  // n8n webhook URL for AI-powered import (configure in environment or settings)
  const AI_IMPORT_WEBHOOK = 'https://n8n.nullis.pl/webhook/ai-import-trips';

  // Use direct getters for reactive individual settings
  const autoRotate = $derived(travelerStore.autoRotate);
  const animateArcs = $derived(travelerStore.animateArcs);
  const globeStyleValue = $derived(travelerStore.globeStyle);
  const colorSchemeValue = $derived(travelerStore.colorScheme);
  const displayModeValue = $derived(travelerStore.displayMode);
  const settings = $derived(travelerStore.settings);
  const availableYears = $derived(travelerStore.availableYears);
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

  function triggerAIImport(): void {
    aiFileInput?.click();
  }

  async function handleAIFileImport(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    isImporting = true;
    try {
      // Read file content
      const content = await file.text();

      // Send to n8n webhook for AI processing
      const response = await fetch(AI_IMPORT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          content: content,
          type: 'traveler-trips',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Import failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.trips && Array.isArray(result.trips)) {
        result.trips.forEach((trip: any) => {
          // Ensure required fields exist
          if (trip.label && trip.metadata?.locations?.length > 0) {
            travelerStore.addTrip({
              id: `ai-import-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'trip',
              label: trip.label,
              description: trip.description,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sourceMode: 'traveler',
              metadata: trip.metadata,
            });
          }
        });
        toastStore.success(`AI imported ${result.trips.length} trip${result.trips.length > 1 ? 's' : ''}!`);
      } else {
        toastStore.warning('AI could not parse any trips from the file.');
      }
    } catch (error) {
      console.error('AI Import error:', error);
      toastStore.error(`AI Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isImporting = false;
      target.value = '';
    }
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
      <div class="import-row">
        <button type="button" class="data-btn import" onclick={triggerImport} disabled={isImporting}>
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {isImporting ? 'Importing...' : 'Import CSV'}
        </button>
        <div class="help-tooltip">
          <button type="button" class="help-btn" title="CSV Format Help">?</button>
          <div class="tooltip-content">
            <p><strong>Expected CSV columns:</strong></p>
            <ul>
              <li>Trip Name (required)</li>
              <li>Start Date (YYYY-MM-DD)</li>
              <li>End Date (YYYY-MM-DD)</li>
              <li>Locations (e.g., Paris → Rome)</li>
              <li>Category (leisure/business/family)</li>
              <li>Description</li>
            </ul>
            <p class="tip">Tip: Export first to see the exact format!</p>
          </div>
        </div>
      </div>
      <button type="button" class="data-btn ai-import" onclick={triggerAIImport} disabled={isImporting}>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 1 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5"/>
        </svg>
        {isImporting ? 'Processing...' : 'AI Import (any format)'}
      </button>
    </div>
    <input
      type="file"
      accept=".csv"
      class="hidden-input"
      bind:this={fileInput}
      onchange={handleFileImport}
    />
    <input
      type="file"
      accept=".csv,.txt,.xlsx"
      class="hidden-input"
      bind:this={aiFileInput}
      onchange={handleAIFileImport}
    />
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

  /* Import row with help tooltip */
  .import-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .import-row .data-btn {
    flex: 1;
  }

  .help-tooltip {
    position: relative;
  }

  .help-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
    font-weight: 600;
    cursor: help;
    transition: all 0.15s ease;
  }

  .help-btn:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.4);
    color: #00d4ff;
  }

  .tooltip-content {
    display: none;
    position: absolute;
    bottom: 100%;
    right: 0;
    width: 220px;
    padding: 0.75rem;
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.9);
    z-index: 100;
    margin-bottom: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .help-tooltip:hover .tooltip-content {
    display: block;
  }

  .tooltip-content p {
    margin: 0 0 0.5rem;
  }

  .tooltip-content ul {
    margin: 0;
    padding-left: 1rem;
    list-style: disc;
  }

  .tooltip-content li {
    margin-bottom: 0.25rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .tooltip-content .tip {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-style: italic;
    color: #00d4ff;
  }

  /* AI Import button */
  .data-btn.ai-import {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15));
    border-color: rgba(168, 85, 247, 0.3);
    color: #c084fc;
  }

  .data-btn.ai-import:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25));
    color: #e879f9;
  }
</style>
