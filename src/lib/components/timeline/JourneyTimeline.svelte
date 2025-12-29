<script lang="ts">
  import { onMount } from 'svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import type { TripNode } from '$lib/types/traveler';
  import TimelineHeader from './TimelineHeader.svelte';
  import YearSection from './YearSection.svelte';
  import TimelineControls from './TimelineControls.svelte';
  import TimelineEmpty from './TimelineEmpty.svelte';

  interface Props {
    class?: string;
    onTripClick?: (trip: TripNode) => void;
  }

  let { class: className = '', onTripClick }: Props = $props();

  let containerRef: HTMLDivElement;
  let scrollProgress = $state(0);

  // Get filtered trips
  const trips = $derived(travelerStore.filteredTrips);

  // Group trips by year
  const tripsByYear = $derived.by(() => {
    const yearMap = new Map<number, TripNode[]>();

    trips.forEach((trip) => {
      const year = new Date(trip.metadata.startDate).getFullYear();
      const existing = yearMap.get(year) || [];
      yearMap.set(year, [...existing, trip]);
    });

    // Sort years descending (most recent first)
    return Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, yearTrips]) => ({
        year,
        trips: yearTrips.sort(
          (a, b) => new Date(b.metadata.startDate).getTime() - new Date(a.metadata.startDate).getTime()
        ),
      }));
  });

  // Calculate stats
  const stats = $derived.by(() => {
    const countries = new Set<string>();
    const cities = new Set<string>();
    let totalDays = 0;

    trips.forEach((trip) => {
      trip.metadata.locations.forEach((loc) => {
        countries.add(loc.country);
        cities.add(`${loc.city}, ${loc.country}`);
      });
      const start = new Date(trip.metadata.startDate);
      const end = new Date(trip.metadata.endDate);
      totalDays += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

    return {
      journeys: trips.length,
      countries: countries.size,
      cities: cities.size,
      totalDays,
    };
  });

  // Setup scroll progress tracking
  onMount(() => {
    const handleScroll = () => {
      if (!containerRef) return;
      const scrollTop = containerRef.scrollTop;
      const scrollHeight = containerRef.scrollHeight - containerRef.clientHeight;
      scrollProgress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    };

    containerRef?.addEventListener('scroll', handleScroll, { passive: true });
    return () => containerRef?.removeEventListener('scroll', handleScroll);
  });

  function handleTripClick(trip: TripNode): void {
    onTripClick?.(trip);
  }
</script>

<div class="journey-timeline {className}" bind:this={containerRef}>
  <!-- Scroll Progress Bar -->
  <div class="scroll-progress" style="--progress: {scrollProgress}">
    <div class="progress-fill"></div>
  </div>

  <!-- Timeline Controls -->
  <TimelineControls />

  <!-- Main Content -->
  <div class="timeline-content">
    {#if trips.length === 0}
      <TimelineEmpty />
    {:else}
      <!-- Header with Stats -->
      <TimelineHeader {stats} />

      <!-- Year Sections -->
      <div class="year-sections">
        {#each tripsByYear as { year, trips: yearTrips }}
          <YearSection {year} trips={yearTrips} {onTripClick} />
        {/each}
      </div>

      <!-- End Cap -->
      <div class="timeline-end">
        <div class="end-marker"></div>
        <span class="end-text">The journey continues...</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .journey-timeline {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    background: linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%);
    scroll-behavior: smooth;
  }

  /* Hide scrollbar but keep functionality */
  .journey-timeline::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }

  .scroll-progress {
    position: fixed;
    top: 0;
    right: 0;
    width: 3px;
    height: 100%;
    background: rgba(255, 255, 255, 0.05);
    z-index: 100;
  }

  .progress-fill {
    width: 100%;
    height: calc(var(--progress, 0) * 100%);
    background: linear-gradient(180deg, #00d4ff, #a855f7);
    transition: height 0.1s ease-out;
  }

  .timeline-content {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 2rem 6rem;
  }

  .year-sections {
    position: relative;
  }

  /* Vertical timeline spine */
  .year-sections::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 212, 255, 0.3) 5%,
      rgba(0, 212, 255, 0.3) 95%,
      transparent 100%
    );
  }

  .timeline-end {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 0;
    margin-top: 2rem;
  }

  .end-marker {
    width: 12px;
    height: 12px;
    background: rgba(0, 212, 255, 0.3);
    border: 2px solid rgba(0, 212, 255, 0.5);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.7;
    }
  }

  .end-text {
    font-size: 0.875rem;
    font-style: italic;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.05em;
  }

  @media (max-width: 768px) {
    .timeline-content {
      padding: 1rem 1rem 4rem;
    }

    .year-sections::before {
      left: 16px;
    }
  }
</style>
