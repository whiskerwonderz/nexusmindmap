<script lang="ts">
  import { onMount } from 'svelte';
  import { TravelGlobe, GlobeControls, GlobeStats } from '$lib/components/globe';
  import { TravelMap, MapControls } from '$lib/components/map';
  import TripList from './TripList.svelte';
  import AddTripModal from './AddTripModal.svelte';
  import EditTripModal from './EditTripModal.svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { appStore } from '$lib/stores/appStore.svelte';
  import type { GlobeMarker, TripNode } from '$lib/types/traveler';
  import type { TravelerLayout } from '$lib/types/common';

  let globeComponent: TravelGlobe;
  let mapComponent: TravelMap;
  let selectedMarker = $state<GlobeMarker | null>(null);
  let selectedTrip = $state<TripNode | null>(null);
  let isAddTripModalOpen = $state(false);
  let isEditTripModalOpen = $state(false);
  let tripToEdit = $state<TripNode | null>(null);
  let showTripList = $state(true);
  let isSidebarMinimized = $state(false);

  function toggleSidebar(): void {
    isSidebarMinimized = !isSidebarMinimized;
  }

  // Get current layout from app store
  const layout = $derived(appStore.travelerSettings.layout);

  onMount(() => {
    if (travelerStore.trips.length === 0) {
      travelerStore.loadSampleData();
    }
  });

  function handleMarkerClick(marker: GlobeMarker): void {
    selectedMarker = marker;
  }

  function handleTripSelect(trip: TripNode): void {
    selectedTrip = trip;
    const firstLocation = trip.metadata.locations[0];
    if (firstLocation) {
      if (layout === 'globe') {
        globeComponent?.focusOn(firstLocation.lat, firstLocation.lng, 1.5);
      } else if (layout === 'map') {
        mapComponent?.focusOn(firstLocation.lat, firstLocation.lng, 8);
      }
    }
  }

  function handleResetView(): void {
    if (layout === 'globe') {
      globeComponent?.resetView();
    } else if (layout === 'map') {
      mapComponent?.resetView();
    }
    selectedMarker = null;
    selectedTrip = null;
  }

  function handleFocusHome(): void {
    if (layout === 'globe') {
      globeComponent?.focusOnHome();
    } else if (layout === 'map') {
      mapComponent?.focusOnHome();
    }
  }

  function handleMapStyleChange(style: 'dark' | 'light' | 'terrain'): void {
    mapComponent?.setMapStyle(style);
  }

  function openAddTripModal(): void {
    isAddTripModalOpen = true;
  }

  function closeAddTripModal(): void {
    isAddTripModalOpen = false;
  }

  function openEditTripModal(trip: TripNode): void {
    tripToEdit = trip;
    isEditTripModalOpen = true;
  }

  function closeEditTripModal(): void {
    isEditTripModalOpen = false;
    tripToEdit = null;
  }

  function closeTripDetails(): void {
    selectedTrip = null;
  }

  function toggleTripList(): void {
    showTripList = !showTripList;
  }
</script>

<div class="traveler-view" style:grid-template-columns={isSidebarMinimized ? '1fr 48px' : '1fr 320px'}>
  <div class="main-content">
    <!-- Layout Switcher -->
    <div class="layout-switcher">
      <button
        type="button"
        class="layout-btn"
        class:active={layout === 'globe'}
        onclick={() => appStore.setTravelerLayout('globe')}
      >
        <svg class="layout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span class="layout-label">Globe</span>
      </button>
      <button
        type="button"
        class="layout-btn"
        class:active={layout === 'map'}
        onclick={() => appStore.setTravelerLayout('map')}
      >
        <svg class="layout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="m3 7 6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"/>
          <path d="M9 4v13M15 7v13"/>
        </svg>
        <span class="layout-label">Map</span>
      </button>
    </div>

    <!-- Visualization Area -->
    <div class="viz-area">
      {#if layout === 'globe'}
        <TravelGlobe
          bind:this={globeComponent}
          onMarkerClick={handleMarkerClick}
          class="visualization"
        />
      {:else}
        <TravelMap
          bind:this={mapComponent}
          onMarkerClick={handleMarkerClick}
          class="visualization"
        />
      {/if}

      {#if selectedMarker}
        <div class="location-info">
          <button class="close-btn" onclick={() => selectedMarker = null}>✕</button>
          <h3>{selectedMarker.location.city}</h3>
          <p>{selectedMarker.location.country}</p>
          <span class="visits">{selectedMarker.visits} visit{selectedMarker.visits > 1 ? 's' : ''}</span>
        </div>
      {/if}

      {#if selectedTrip}
        <div class="trip-details">
          <button class="close-btn" onclick={closeTripDetails}>✕</button>
          <h3>{selectedTrip.label}</h3>
          <p class="trip-dates">
            {new Date(selectedTrip.metadata.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            -
            {new Date(selectedTrip.metadata.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div class="trip-stops">
            {#each selectedTrip.metadata.locations as location, i}
              <div class="stop">
                <span class="stop-number">{i + 1}</span>
                <span class="stop-name">{location.city}, {location.country}</span>
              </div>
            {/each}
          </div>
          {#if selectedTrip.description}
            <p class="trip-description">{selectedTrip.description}</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Stats Below Visualization -->
    <div class="stats-section">
      <GlobeStats onShowTrips={toggleTripList} />
    </div>
  </div>

  <!-- Sidebar -->
  <aside class="sidebar" class:minimized={isSidebarMinimized}>
    <button
      type="button"
      class="minimize-btn"
      class:expanded={!isSidebarMinimized}
      onclick={toggleSidebar}
      title={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
    >
      {#if isSidebarMinimized}
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      {:else}
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      {/if}
    </button>

    {#if !isSidebarMinimized}
      {#if showTripList}
        <TripList
          onTripSelect={handleTripSelect}
          onAddTrip={openAddTripModal}
          onEditTrip={openEditTripModal}
          class="trip-list-container"
        />
      {/if}

      {#if layout === 'globe'}
        <GlobeControls />
      {:else}
        <MapControls
          onResetView={handleResetView}
          onFocusHome={handleFocusHome}
          onStyleChange={handleMapStyleChange}
        />
      {/if}
    {/if}
  </aside>
</div>

<AddTripModal isOpen={isAddTripModalOpen} onClose={closeAddTripModal} />
<EditTripModal isOpen={isEditTripModalOpen} trip={tripToEdit} onClose={closeEditTripModal} />

<style>
  .traveler-view {
    position: absolute;
    inset: 0;
    display: grid;
    gap: 1.5rem;
    padding: 1rem;
    box-sizing: border-box;
    transition: grid-template-columns 0.2s ease;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
    overflow: hidden;
  }

  /* Layout Switcher */
  .layout-switcher {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .layout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .layout-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  .layout-btn.active {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
  }

  .layout-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .layout-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .layout-label {
    font-weight: 500;
  }

  .viz-area {
    position: relative;
    flex: 1 1 auto;
    min-height: 400px;
    border-radius: 16px;
    overflow: hidden;
  }

  :global(.visualization) { width: 100%; height: 100%; }

  .stats-section {
    flex-shrink: 0;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: hidden;
    min-height: 0;
    transition: width 0.2s ease;
  }

  .sidebar.minimized {
    width: 48px !important;
    flex-shrink: 0;
  }

  .sidebar > :global(:last-child) {
    flex-shrink: 0;
    max-height: 50%;
    overflow-y: auto;
  }

  .minimize-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .minimize-btn.expanded {
    padding: 0.25rem;
  }

  .minimize-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .location-info,
  .trip-details {
    position: absolute;
    bottom: 1.5rem;
    left: 1.5rem;
    max-width: 280px;
    padding: 1rem 1.25rem;
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    z-index: 10;
  }

  /* Firefox fallback for backdrop-filter */
  @supports not (backdrop-filter: blur(12px)) {
    .location-info,
    .trip-details {
      background: rgba(15, 15, 25, 0.98);
    }
  }

  .location-info h3,
  .trip-details h3 {
    margin: 0;
    font-size: 1.125rem;
    color: white;
  }

  .location-info p,
  .trip-details .trip-dates {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .location-info .visits {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(251, 191, 36, 0.15);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #fbbf24;
  }

  .trip-stops {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stop {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stop-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: rgba(0, 212, 255, 0.2);
    border-radius: 50%;
    font-size: 0.625rem;
    font-weight: 600;
    color: #00d4ff;
  }

  .stop-name {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .trip-description {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  }

  .close-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  :global(.trip-list-container) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  /* Tablet breakpoint */
  @media (max-width: 1024px) {
    .traveler-view {
      grid-template-columns: 1fr 280px;
      gap: 1rem;
      padding: 0.75rem;
    }
  }

  /* Mobile breakpoint */
  @media (max-width: 768px) {
    .traveler-view {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(300px, 1fr) auto;
      gap: 0.75rem;
      padding: 0.5rem;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .main-content {
      min-height: 300px;
    }

    .viz-area {
      min-height: 250px;
      border-radius: 12px;
    }

    .sidebar {
      padding-bottom: 1rem;
      max-height: 50vh;
      overflow-y: auto;
    }

    .location-info,
    .trip-details {
      left: 0.75rem;
      bottom: 0.75rem;
      max-width: calc(100% - 1.5rem);
      padding: 0.75rem 1rem;
    }
  }

  /* Small mobile */
  @media (max-width: 480px) {
    .traveler-view {
      padding: 0.25rem;
    }

    .layout-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .layout-label {
      display: none;
    }
  }
</style>
