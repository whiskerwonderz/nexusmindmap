<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';

  interface Props {
    class?: string;
    onShowTrips?: () => void;
  }
  let { class: className = '', onShowTrips }: Props = $props();

  const stats = $derived(travelerStore.stats);
</script>

<div class="globe-stats {className}">
  <div class="stats-row primary">
    <button
      type="button"
      class="stat-item clickable"
      onclick={() => onShowTrips?.()}
      title="View all trips"
    >
      <span class="stat-value">{stats.totalTrips}</span>
      <span class="stat-label">Trips</span>
    </button>
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
  </div>

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
    background: transparent;
    border: none;
  }

  .stat-item.clickable {
    cursor: pointer;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    margin: -0.5rem 0;
    transition: all 0.15s ease;
  }

  .stat-item.clickable:hover {
    background: rgba(0, 212, 255, 0.1);
  }

  .stat-item.clickable:hover .stat-value {
    color: #00d4ff;
  }

  .stat-item.clickable:hover .stat-label {
    color: rgba(0, 212, 255, 0.8);
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
</style>
