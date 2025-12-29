<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { TRIP_CATEGORY_COLORS, type TripNode } from '$lib/types/traveler';
  import TimelineAxis from './TimelineAxis.svelte';
  import TimelineProgress from './TimelineProgress.svelte';

  interface Props {
    class?: string;
    onTripClick?: (trip: TripNode) => void;
  }

  let { class: className = '', onTripClick }: Props = $props();

  let containerRef: HTMLDivElement;
  let scrollContainerRef: HTMLDivElement;
  let horizontalRef: HTMLDivElement;
  let ctx: gsap.Context | null = null;
  let scrollTriggerInstance: ScrollTrigger | null = null;

  // Get trips sorted by date
  const trips = $derived(travelerStore.filteredTrips);

  // Calculate timeline bounds
  const timelineBounds = $derived.by(() => {
    if (trips.length === 0) {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
        totalDays: 365,
      };
    }

    const dates = trips.flatMap((t) => [
      new Date(t.metadata.startDate),
      new Date(t.metadata.endDate),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding of 30 days on each side
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 30);

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return { startDate, endDate, totalDays };
  });

  // Group trips by country for swim lanes
  const tripsByCountry = $derived.by(() => {
    const countryMap = new Map<string, TripNode[]>();

    trips.forEach((trip) => {
      const primaryCountry = trip.metadata.locations[0]?.country || 'Unknown';
      const existing = countryMap.get(primaryCountry) || [];
      countryMap.set(primaryCountry, [...existing, trip]);
    });

    // Sort by number of trips (most visited first)
    return Array.from(countryMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8); // Limit to top 8 countries
  });

  // Calculate position for a date on the timeline
  function getDatePosition(dateStr: string): number {
    const date = new Date(dateStr);
    const daysSinceStart = Math.ceil(
      (date.getTime() - timelineBounds.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return (daysSinceStart / timelineBounds.totalDays) * 100;
  }

  // Calculate width for a trip duration
  function getTripWidth(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max((days / timelineBounds.totalDays) * 100, 2); // Min 2% width
  }

  // Get trip color based on category
  function getTripColor(trip: TripNode): string {
    return TRIP_CATEGORY_COLORS[trip.metadata.category || 'leisure'];
  }

  // Current scroll progress (0-1)
  let scrollProgress = $state(0);

  onMount(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    ctx = gsap.context(() => {
      // Calculate the scroll distance
      const totalWidth = horizontalRef.scrollWidth;
      const viewportWidth = scrollContainerRef.offsetWidth;
      const scrollDistance = totalWidth - viewportWidth;

      // Create horizontal scroll animation
      const tween = gsap.to(horizontalRef, {
        x: -scrollDistance,
        ease: 'none',
      });

      scrollTriggerInstance = ScrollTrigger.create({
        trigger: scrollContainerRef,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        scrub: 1,
        pin: true,
        animation: tween,
        onUpdate: (self) => {
          scrollProgress = self.progress;
        },
      });

      // Animate trip cards on scroll
      gsap.utils.toArray<HTMLElement>('.trip-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          {
            opacity: 0.3,
            scale: 0.9,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left 80%',
              end: 'left 20%',
              scrub: true,
            },
          }
        );
      });
    }, containerRef);
  });

  onDestroy(() => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
    }
    if (ctx) {
      ctx.revert();
    }
  });

  function handleTripClick(trip: TripNode): void {
    onTripClick?.(trip);
  }

  function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  }
</script>

<div class="timeline-container {className}" bind:this={containerRef}>
  <TimelineProgress progress={scrollProgress} />

  <div class="scroll-container" bind:this={scrollContainerRef}>
    <div class="horizontal-scroll" bind:this={horizontalRef}>
      <!-- Timeline Axis -->
      <TimelineAxis
        startDate={timelineBounds.startDate}
        endDate={timelineBounds.endDate}
        totalDays={timelineBounds.totalDays}
      />

      <!-- Country Swim Lanes -->
      <div class="swim-lanes">
        {#each tripsByCountry as [country, countryTrips], laneIndex}
          <div class="swim-lane" style="--lane-index: {laneIndex}">
            <div class="lane-label">
              <span class="country-name">{country}</span>
              <span class="trip-count">{countryTrips.length}</span>
            </div>

            <div class="lane-content">
              {#each countryTrips as trip}
                <button
                  type="button"
                  class="trip-card"
                  style="
                    left: {getDatePosition(trip.metadata.startDate)}%;
                    width: {getTripWidth(trip.metadata.startDate, trip.metadata.endDate)}%;
                    --trip-color: {getTripColor(trip)};
                  "
                  onclick={() => handleTripClick(trip)}
                >
                  <div class="trip-glow"></div>
                  <div class="trip-content">
                    <span class="trip-name">{trip.label}</span>
                    <span class="trip-dates">{formatDateRange(trip.metadata.startDate, trip.metadata.endDate)}</span>
                    {#if trip.metadata.locations.length > 1}
                      <span class="trip-stops">{trip.metadata.locations.length} stops</span>
                    {/if}
                  </div>
                </button>
              {/each}

              <!-- Connectors between trips -->
              {#each countryTrips.slice(0, -1) as trip, i}
                {@const nextTrip = countryTrips[i + 1]}
                {@const startPos = getDatePosition(trip.metadata.endDate)}
                {@const endPos = getDatePosition(nextTrip.metadata.startDate)}
                {#if endPos > startPos}
                  <div
                    class="connector"
                    style="
                      left: {startPos}%;
                      width: {endPos - startPos}%;
                      --trip-color: {getTripColor(trip)};
                    "
                  ></div>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Empty State -->
      {#if trips.length === 0}
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <p>No trips to display</p>
          <span>Add some trips to see them on the timeline</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .timeline-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
    overflow: hidden;
  }

  .scroll-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .horizontal-scroll {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 200%;
    height: 100%;
    padding: 4rem 2rem 2rem;
    box-sizing: border-box;
  }

  .swim-lanes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    padding-top: 3rem;
  }

  .swim-lane {
    position: relative;
    display: flex;
    align-items: center;
    height: 80px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    animation: fadeInLane 0.5s ease-out;
    animation-delay: calc(var(--lane-index) * 0.1s);
    animation-fill-mode: both;
  }

  @keyframes fadeInLane {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .lane-label {
    position: sticky;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.125rem;
    width: 100px;
    padding: 0.5rem 0.75rem;
    background: rgba(15, 15, 25, 0.95);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10;
  }

  .country-name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 85px;
  }

  .trip-count {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .lane-content {
    position: relative;
    flex: 1;
    height: 100%;
  }

  .trip-card {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    min-width: 120px;
    height: 56px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--trip-color, #00d4ff);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
    padding: 0;
    text-align: left;
    font-family: inherit;
  }

  .trip-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-50%) scale(1.05);
    z-index: 20;
  }

  .trip-glow {
    position: absolute;
    inset: -1px;
    background: var(--trip-color, #00d4ff);
    opacity: 0.15;
    filter: blur(8px);
    border-radius: 8px;
  }

  .trip-content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.5rem 0.75rem;
    z-index: 1;
  }

  .trip-name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trip-dates {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
  }

  .trip-stops {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: var(--trip-color, #00d4ff);
    opacity: 0.8;
    border-radius: 4px;
    font-size: 0.625rem;
    color: white;
    width: fit-content;
  }

  .connector {
    position: absolute;
    top: 50%;
    height: 2px;
    background: linear-gradient(
      90deg,
      var(--trip-color, #00d4ff),
      transparent 30%,
      transparent 70%,
      var(--trip-color, #00d4ff)
    );
    opacity: 0.3;
    transform: translateY(-50%);
  }

  .connector::before,
  .connector::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 6px;
    height: 6px;
    background: var(--trip-color, #00d4ff);
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .connector::before {
    left: 0;
  }

  .connector::after {
    right: 0;
  }

  .empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .empty-state span {
    font-size: 0.875rem;
    opacity: 0.7;
  }
</style>
