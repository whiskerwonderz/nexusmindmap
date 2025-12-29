<script lang="ts">
  import { onMount } from 'svelte';
  import { TravelGlobe, GlobeControls, GlobeStats } from '$lib/components/globe';
  import TripList from './TripList.svelte';
  import AddTripModal from './AddTripModal.svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import type { GlobeMarker, TripNode } from '$lib/types/traveler';

  let globeComponent: TravelGlobe;
  let selectedMarker = $state<GlobeMarker | null>(null);
  let selectedTrip = $state<TripNode | null>(null);
  let isAddTripModalOpen = $state(false);

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
      globeComponent?.focusOn(firstLocation.lat, firstLocation.lng, 1.5);
    }
  }

  function handleResetView(): void {
    globeComponent?.resetView();
    selectedMarker = null;
    selectedTrip = null;
  }

  function handleFocusHome(): void {
    globeComponent?.focusOnHome();
  }

  function openAddTripModal(): void {
    isAddTripModalOpen = true;
  }

  function closeAddTripModal(): void {
    isAddTripModalOpen = false;
  }

  function closeTripDetails(): void {
    selectedTrip = null;
  }
</script>

<div class="traveler-view">
  <div class="main-content">
    <!-- Globe Area -->
    <div class="globe-area">
      <TravelGlobe
        bind:this={globeComponent}
        onMarkerClick={handleMarkerClick}
        class="globe"
      />

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

    <!-- Stats Below Globe -->
    <div class="stats-section">
      <GlobeStats />
    </div>
  </div>

  <aside class="sidebar">
    <GlobeControls onResetView={handleResetView} onFocusHome={handleFocusHome} />

    <TripList
      onTripSelect={handleTripSelect}
      onAddTrip={openAddTripModal}
      class="trip-list-container"
    />
  </aside>
</div>

<AddTripModal isOpen={isAddTripModalOpen} onClose={closeAddTripModal} />

<style>
  .traveler-view {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.5rem;
    height: 100%;
    min-height: 0;
    padding: 1rem;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }

  .globe-area {
    position: relative;
    flex: 1;
    min-height: 400px;
    border-radius: 16px;
    overflow: hidden;
  }

  :global(.globe) { width: 100%; height: 100%; }

  .stats-section {
    flex-shrink: 0;
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
    backdrop-filter: blur(12px);
    z-index: 10;
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

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    overflow-y: auto;
  }

  :global(.trip-list-container) {
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 768px) {
    .traveler-view {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
      overflow-y: auto;
    }

    .sidebar {
      padding-bottom: 1rem;
    }
  }
</style>
