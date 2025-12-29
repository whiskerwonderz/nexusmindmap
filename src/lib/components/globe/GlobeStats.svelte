<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { formatDistance, calculateEarthCircumferences } from '$lib/utils/geo';

  interface Props { class?: string; }
  let { class: className = '' }: Props = $props();

  const stats = $derived(travelerStore.stats);
  const earthsCircled = $derived(calculateEarthCircumferences(stats.totalDistanceKm).toFixed(1));
</script>

<div class="globe-stats {className}">
  <div class="stats-row primary">
    <div class="stat-item">
      <span class="stat-value">{stats.totalTrips}</span>
      <span class="stat-label">Trips</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{stats.uniqueCountries}</span>
      <span class="stat-label">Countries</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{stats.uniqueCities}</span>
      <span class="stat-label">Cities</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{stats.totalDays}</span>
      <span class="stat-label">Days</span>
    </div>
  </div>

  <div class="distance-highlight">
    <div class="distance-main">
      <span class="distance-value">{formatDistance(stats.totalDistanceKm)}</span>
      <span class="distance-label">traveled</span>
    </div>
    <div class="earth-count">
      <span class="earth-icon">&#127757;</span>
      <span>x {earthsCircled} around Earth</span>
    </div>
  </div>

  {#if stats.mostVisitedCountry || stats.longestTrip}
    <div class="stats-row secondary">
      {#if stats.mostVisitedCountry}
        <div class="stat-card">
          <span class="card-label">Most visited</span>
          <span class="card-value">{stats.mostVisitedCountry.country}</span>
          <span class="card-detail">{Math.round(stats.mostVisitedCountry.days)} days</span>
        </div>
      {/if}
      {#if stats.longestTrip}
        <div class="stat-card">
          <span class="card-label">Longest trip</span>
          <span class="card-value">{stats.longestTrip.label}</span>
          <span class="card-detail">{stats.longestTrip.days} days</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .globe-stats { display: flex; flex-direction: column; gap: 1rem; }

  .stats-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .stats-row.primary {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0 0.75rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-divider {
    width: 1px;
    height: 2rem;
    background: rgba(255, 255, 255, 0.1);
  }

  .distance-highlight {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(168, 85, 247, 0.1));
    border-radius: 12px;
    border: 1px solid rgba(0, 212, 255, 0.2);
  }

  .distance-main { display: flex; align-items: baseline; gap: 0.5rem; }

  .distance-value {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #00d4ff, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .distance-label { font-size: 1rem; color: rgba(255, 255, 255, 0.6); }

  .earth-count {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .earth-icon {
    font-size: 1.25rem;
  }

  .stats-row.secondary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .card-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.4);
  }

  .card-value { font-size: 0.9375rem; font-weight: 600; color: white; }
  .card-detail { font-size: 0.75rem; color: #fbbf24; }
</style>
