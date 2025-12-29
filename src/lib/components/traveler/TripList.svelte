<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import type { TripNode } from '$lib/types/traveler';

  interface Props {
    onTripSelect?: (trip: TripNode) => void;
    onAddTrip?: () => void;
    class?: string;
  }

  let {
    onTripSelect,
    onAddTrip,
    class: className = '',
  }: Props = $props();

  let searchQuery = $state('');
  let sortBy = $state<'date' | 'duration' | 'name'>('date');

  const trips = $derived(travelerStore.trips);

  const filteredTrips = $derived.by(() => {
    let result = [...trips];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(trip =>
        trip.label.toLowerCase().includes(query) ||
        trip.metadata.locations.some(loc =>
          loc.city.toLowerCase().includes(query) ||
          loc.country.toLowerCase().includes(query)
        )
      );
    }

    // Sort
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.metadata.startDate).getTime() - new Date(a.metadata.startDate).getTime());
        break;
      case 'duration':
        result.sort((a, b) => (b.metadata.durationDays ?? 0) - (a.metadata.durationDays ?? 0));
        break;
      case 'name':
        result.sort((a, b) => a.label.localeCompare(b.label));
        break;
    }

    return result;
  });

  function formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
    }
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
  }

  function getLocationSummary(trip: TripNode): string {
    const cities = trip.metadata.locations.map(l => l.city);
    if (cities.length <= 2) return cities.join(' → ');
    return `${cities[0]} → ... → ${cities[cities.length - 1]}`;
  }
</script>

<div class="trip-list {className}">
  <header class="list-header">
    <div class="header-row">
      <h3 class="list-title">Your Trips</h3>
      <span class="trip-count">{trips.length}</span>
    </div>
    {#if onAddTrip}
      <button type="button" class="add-trip-btn" onclick={onAddTrip}>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Trip
      </button>
    {/if}
  </header>

  <div class="search-bar">
    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      placeholder="Search trips..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <div class="sort-controls">
    <span class="sort-label">Sort by:</span>
    <div class="sort-buttons">
      <button
        type="button"
        class="sort-btn"
        class:active={sortBy === 'date'}
        onclick={() => sortBy = 'date'}
      >
        Date
      </button>
      <button
        type="button"
        class="sort-btn"
        class:active={sortBy === 'duration'}
        onclick={() => sortBy = 'duration'}
      >
        Duration
      </button>
      <button
        type="button"
        class="sort-btn"
        class:active={sortBy === 'name'}
        onclick={() => sortBy = 'name'}
      >
        Name
      </button>
    </div>
  </div>

  <div class="trips-container">
    {#each filteredTrips as trip (trip.id)}
      <button
        type="button"
        class="trip-card"
        onclick={() => onTripSelect?.(trip)}
      >
        <div class="trip-header">
          <span class="trip-name">{trip.label}</span>
          <span class="trip-duration">{trip.metadata.durationDays ?? 0}d</span>
        </div>
        <div class="trip-route">{getLocationSummary(trip)}</div>
        <div class="trip-meta">
          <span class="trip-dates">{formatDateRange(trip.metadata.startDate, trip.metadata.endDate)}</span>
          <span class="trip-countries">{trip.metadata.locations.length} stops</span>
        </div>
      </button>
    {:else}
      <div class="empty-state">
        {#if searchQuery}
          <p>No trips match "{searchQuery}"</p>
        {:else}
          <p>No trips yet</p>
          {#if onAddTrip}
            <button type="button" class="add-first-btn" onclick={onAddTrip}>
              Add your first trip
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .trip-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .list-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .list-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
  }

  .trip-count {
    padding: 0.125rem 0.5rem;
    background: rgba(0, 212, 255, 0.15);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #00d4ff;
  }

  .add-trip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(168, 85, 247, 0.2));
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-trip-btn:hover {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(168, 85, 247, 0.3));
    border-color: rgba(0, 212, 255, 0.5);
  }

  .search-bar {
    position: relative;
    margin-bottom: 0.75rem;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.875rem;
    color: white;
    outline: none;
    transition: all 0.15s ease;
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .search-input:focus {
    border-color: rgba(0, 212, 255, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .sort-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .sort-buttons {
    display: flex;
    gap: 0.25rem;
  }

  .sort-btn {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sort-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .sort-btn.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
  }

  .trips-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
  }

  .trip-card {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .trip-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .trip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .trip-name {
    font-size: 0.9375rem;
    font-weight: 500;
    color: white;
  }

  .trip-duration {
    padding: 0.125rem 0.375rem;
    background: rgba(251, 191, 36, 0.15);
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #fbbf24;
  }

  .trip-route {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .trip-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
  }

  .add-first-btn {
    padding: 0.5rem 1rem;
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 6px;
    font-size: 0.8125rem;
    color: #00d4ff;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-first-btn:hover {
    background: rgba(0, 212, 255, 0.25);
  }
</style>
