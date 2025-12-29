<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import { searchCitiesGlobal, resultToLocation, type CitySearchResult } from '$lib/utils/citySearch';
  import { nowISO } from '$lib/types/common';
  import { calculateDuration } from '$lib/utils/tripUtils';
  import type { TripLocation, TripNode } from '$lib/types/traveler';

  interface Props {
    isOpen: boolean;
    trip: TripNode | null;
    onClose: () => void;
  }

  let { isOpen, trip, onClose }: Props = $props();

  // Form state - initialized from trip
  let tripName = $state('');
  let startDate = $state('');
  let endDate = $state('');
  let description = $state('');
  let locations = $state<TripLocation[]>([]);

  // City search state
  let citySearch = $state('');
  let cityResults = $state<CitySearchResult[]>([]);
  let showCityDropdown = $state(false);
  let isSearching = $state(false);

  // Initialize form when trip changes
  $effect(() => {
    if (trip && isOpen) {
      tripName = trip.label;
      startDate = trip.metadata.startDate;
      endDate = trip.metadata.endDate;
      description = trip.description ?? '';
      locations = [...trip.metadata.locations];
    }
  });

  // Form validation
  const isValid = $derived(
    tripName.trim().length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    new Date(endDate) >= new Date(startDate) &&
    locations.length > 0
  );

  // Check if form has changes
  const hasChanges = $derived(() => {
    if (!trip) return false;
    return (
      tripName !== trip.label ||
      startDate !== trip.metadata.startDate ||
      endDate !== trip.metadata.endDate ||
      description !== (trip.description ?? '') ||
      JSON.stringify(locations) !== JSON.stringify(trip.metadata.locations)
    );
  });

  // React to city search changes
  $effect(() => {
    if (citySearch.trim().length >= 2) {
      isSearching = true;
      const timeoutId = setTimeout(() => {
        const results = searchCitiesGlobal(citySearch, 15);
        cityResults = results;
        showCityDropdown = results.length > 0;
        isSearching = false;
      }, 150);
      return () => clearTimeout(timeoutId);
    } else {
      cityResults = [];
      showCityDropdown = false;
      isSearching = false;
    }
  });

  function addLocation(city: CitySearchResult): void {
    const location = resultToLocation(city, locations.length + 1);
    locations = [...locations, location];
    citySearch = '';
    cityResults = [];
    showCityDropdown = false;
  }

  function removeLocation(index: number): void {
    locations = locations.filter((_, i) => i !== index).map((loc, i) => ({
      ...loc,
      order: i + 1,
    }));
  }

  function moveLocation(index: number, direction: 'up' | 'down'): void {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= locations.length) return;

    const newLocations = [...locations];
    [newLocations[index], newLocations[newIndex]] = [newLocations[newIndex], newLocations[index]];
    locations = newLocations.map((loc, i) => ({ ...loc, order: i + 1 }));
  }

  function handleSubmit(): void {
    if (!isValid || !trip) return;

    const updates: Partial<TripNode> = {
      label: tripName.trim(),
      description: description.trim() || undefined,
      updatedAt: nowISO(),
      metadata: {
        ...trip.metadata,
        startDate,
        endDate,
        locations,
        durationDays: calculateDuration(startDate, endDate),
      },
    };

    travelerStore.updateTrip(trip.id, updates);
    toastStore.success('Trip updated');
    onClose();
  }

  function handleClose(): void {
    citySearch = '';
    cityResults = [];
    showCityDropdown = false;
    isSearching = false;
    onClose();
  }
</script>

<Modal isOpen={isOpen} title="Edit Trip" onClose={handleClose} size="lg">
  <form class="trip-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <!-- Trip Name -->
    <div class="form-group">
      <label for="edit-trip-name">Trip Name *</label>
      <input
        id="edit-trip-name"
        type="text"
        bind:value={tripName}
        placeholder="e.g., Summer in Italy"
        class="form-input"
        required
      />
    </div>

    <!-- Dates -->
    <div class="form-row">
      <div class="form-group">
        <label for="edit-start-date">Start Date *</label>
        <input
          id="edit-start-date"
          type="date"
          bind:value={startDate}
          class="form-input"
          required
        />
      </div>
      <div class="form-group">
        <label for="edit-end-date">End Date *</label>
        <input
          id="edit-end-date"
          type="date"
          bind:value={endDate}
          min={startDate}
          class="form-input"
          required
        />
      </div>
    </div>

    <!-- Description -->
    <div class="form-group">
      <label for="edit-description">Description (optional)</label>
      <textarea
        id="edit-description"
        bind:value={description}
        placeholder="What made this trip special?"
        class="form-input form-textarea"
        rows="2"
      ></textarea>
    </div>

    <!-- Locations -->
    <div class="form-group">
      <label for="edit-city-search">Locations *</label>

      <!-- Location Search -->
      <div class="city-search">
        <input
          id="edit-city-search"
          type="text"
          bind:value={citySearch}
          onfocus={() => { if (cityResults.length > 0) showCityDropdown = true; }}
          onblur={() => setTimeout(() => showCityDropdown = false, 200)}
          placeholder="Search 148k+ cities worldwide..."
          class="form-input"
        />
        {#if showCityDropdown && cityResults.length > 0}
          <div class="city-dropdown">
            {#each cityResults as city}
              <button
                type="button"
                class="city-option"
                onclick={() => addLocation(city)}
              >
                <span class="city-name">{city.city}</span>
                <span class="city-country">{city.country}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Added Locations -->
      {#if locations.length > 0}
        <div class="location-list">
          {#each locations as location, index (location.order)}
            <div class="location-item">
              <span class="location-order">{index + 1}</span>
              <div class="location-info">
                <span class="location-city">{location.city}</span>
                <span class="location-country">{location.country}</span>
              </div>
              <div class="location-actions">
                <button
                  type="button"
                  class="location-btn"
                  onclick={() => moveLocation(index, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="location-btn"
                  onclick={() => moveLocation(index, 'down')}
                  disabled={index === locations.length - 1}
                  title="Move down"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="location-btn remove"
                  onclick={() => removeLocation(index)}
                  title="Remove"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="location-hint">Add at least one location to your trip</p>
      {/if}
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick={handleClose}>
        Cancel
      </button>
      <button type="submit" class="btn-primary" disabled={!isValid}>
        Save Changes
      </button>
    </div>
  </form>
</Modal>

<style>
  .trip-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  .form-input {
    padding: 0.625rem 0.875rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    font-size: 0.875rem;
    color: white;
    outline: none;
    transition: all 0.15s ease;
  }

  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .form-input:focus {
    border-color: rgba(0, 212, 255, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .form-textarea {
    resize: vertical;
    min-height: 60px;
  }

  /* City Search */
  .city-search {
    position: relative;
  }

  .city-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: #1f1f35;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-top: none;
    border-radius: 0 0 8px 8px;
    z-index: 20;
  }

  .city-option {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .city-option:hover {
    background: rgba(0, 212, 255, 0.15);
  }

  .city-name {
    font-size: 0.875rem;
  }

  .city-country {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Location List */
  .location-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .location-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
  }

  .location-order {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(0, 212, 255, 0.15);
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
    color: #00d4ff;
  }

  .location-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .location-city {
    font-size: 0.875rem;
    color: white;
  }

  .location-country {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .location-actions {
    display: flex;
    gap: 0.25rem;
  }

  .location-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.1s;
  }

  .location-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .location-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .location-btn.remove:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .location-hint {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
  }

  /* Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.8);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-primary {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(168, 85, 247, 0.9));
    border: none;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
