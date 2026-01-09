<script lang="ts">
  import { onMount } from 'svelte';
  import { TRIP_CATEGORY_COLORS, type TripNode } from '$lib/types/traveler';
  import MiniRouteMap from './MiniRouteMap.svelte';
  import PhotoSlot from './PhotoSlot.svelte';

  interface Props {
    trip: TripNode;
    index: number;
    onTripClick?: (trip: TripNode) => void;
    class?: string;
  }

  let { trip, index, onTripClick, class: className = '' }: Props = $props();

  let cardRef: HTMLElement;
  let isVisible = $state(false);

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '-30px' }
    );

    observer.observe(cardRef);
    return () => observer.disconnect();
  });

  const tripColor = $derived(TRIP_CATEGORY_COLORS[trip.metadata.category || 'leisure']);

  const dateRange = $derived.by(() => {
    const start = new Date(trip.metadata.startDate);
    const end = new Date(trip.metadata.endDate);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', opts);
    const endStr = end.toLocaleDateString('en-US', opts);
    return `${startStr} – ${endStr}`;
  });

  const duration = $derived.by(() => {
    const start = new Date(trip.metadata.startDate);
    const end = new Date(trip.metadata.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days === 1 ? '1 day' : `${days} days`;
  });

  const isJourney = $derived(trip.metadata.locations.length > 1);

  function handleClick(): void {
    onTripClick?.(trip);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="journey-card {className}"
  class:visible={isVisible}
  class:is-journey={isJourney}
  style="--trip-color: {tripColor}; --index: {index}"
  bind:this={cardRef}
  onclick={handleClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <!-- Timeline connector -->
  <div class="connector">
    <div class="connector-line"></div>
    <div class="connector-dot"></div>
  </div>

  <div class="card-content">
    <!-- Header -->
    <header class="card-header">
      <div class="title-section">
        <h3 class="trip-title">{trip.label}</h3>
        <div class="trip-meta">
          <span class="date-range">{dateRange}</span>
          <span class="separator">•</span>
          <span class="duration">{duration}</span>
        </div>
      </div>
      <div class="category-badge" style="--badge-color: {tripColor}">
        {trip.metadata.category || 'leisure'}
      </div>
    </header>

    <!-- Route Visualization -->
    {#if isJourney}
      <div class="route-section">
        <MiniRouteMap locations={trip.metadata.locations} color={tripColor} />
        <div class="stops-list">
          {#each trip.metadata.locations as location, i}
            <div class="stop-item">
              <span class="stop-number">{i + 1}</span>
              <span class="stop-name">{location.city}</span>
              <span class="stop-country">{location.country}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="destination-section">
        <div class="destination-info">
          <svg class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <div class="location-text">
            <span class="city">{trip.metadata.locations[0]?.city}</span>
            <span class="country">{trip.metadata.locations[0]?.country}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Description -->
    {#if trip.description}
      <p class="trip-description">{trip.description}</p>
    {/if}

    <!-- Photo Slots (future-ready) -->
    <div class="photo-section">
      <PhotoSlot />
      <PhotoSlot />
      <PhotoSlot />
    </div>
  </div>
</div>

<style>
  .journey-card {
    position: relative;
    display: flex;
    gap: 1rem;
    opacity: 0;
    transform: translateY(20px) translateX(-10px);
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    transition-delay: calc(var(--index) * 0.1s);
    cursor: pointer;
  }

  .journey-card.visible {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }

  .connector {
    position: relative;
    width: 20px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .connector-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(0, 212, 255, 0.15);
  }

  .connector-dot {
    position: relative;
    width: 8px;
    height: 8px;
    margin-top: 24px;
    background: var(--trip-color, #00d4ff);
    border-radius: 50%;
    z-index: 1;
    box-shadow: 0 0 10px var(--trip-color, rgba(0, 212, 255, 0.5));
  }

  .card-content {
    flex: 1;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .journey-card:hover .card-content {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .title-section {
    flex: 1;
    min-width: 0;
  }

  .trip-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    line-height: 1.3;
  }

  .trip-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .separator {
    opacity: 0.5;
  }

  .category-badge {
    padding: 0.25rem 0.625rem;
    background: color-mix(in srgb, var(--badge-color) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--badge-color) 30%, transparent);
    border-radius: 999px;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--badge-color);
    text-transform: capitalize;
    white-space: nowrap;
  }

  .route-section {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stops-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .stop-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .stop-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: var(--trip-color, #00d4ff);
    opacity: 0.8;
    border-radius: 50%;
    font-size: 0.625rem;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .stop-name {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .stop-country {
    color: rgba(255, 255, 255, 0.4);
  }

  .destination-section {
    margin-bottom: 1rem;
  }

  .destination-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .pin-icon {
    width: 32px;
    height: 32px;
    color: var(--trip-color, #00d4ff);
    opacity: 0.8;
  }

  .location-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .city {
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  .country {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .trip-description {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    font-style: italic;
  }

  .photo-section {
    display: flex;
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    .route-section {
      flex-direction: column;
    }

    .card-content {
      padding: 1rem;
    }

    .trip-title {
      font-size: 1.125rem;
    }
  }
</style>
