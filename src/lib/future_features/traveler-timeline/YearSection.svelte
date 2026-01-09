<script lang="ts">
  import { onMount } from 'svelte';
  import type { TripNode } from '$lib/types/traveler';
  import JourneyCard from './JourneyCard.svelte';

  interface Props {
    year: number;
    trips: TripNode[];
    onTripClick?: (trip: TripNode) => void;
    class?: string;
  }

  let { year, trips, onTripClick, class: className = '' }: Props = $props();

  let sectionRef: HTMLElement;
  let isVisible = $state(false);

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '-50px' }
    );

    observer.observe(sectionRef);
    return () => observer.disconnect();
  });

  // Calculate year stats
  const yearStats = $derived.by(() => {
    const countries = new Set<string>();
    trips.forEach((trip) => {
      trip.metadata.locations.forEach((loc) => countries.add(loc.country));
    });
    return {
      tripCount: trips.length,
      countryCount: countries.size,
    };
  });
</script>

<section class="year-section {className}" class:visible={isVisible} bind:this={sectionRef}>
  <!-- Year Divider -->
  <div class="year-divider">
    <div class="year-marker">
      <div class="marker-dot"></div>
      <div class="marker-ring"></div>
    </div>
    <div class="year-content">
      <h2 class="year-number">{year}</h2>
      <div class="year-stats">
        <span>{yearStats.tripCount} {yearStats.tripCount === 1 ? 'journey' : 'journeys'}</span>
        <span class="stat-separator">•</span>
        <span>{yearStats.countryCount} {yearStats.countryCount === 1 ? 'country' : 'countries'}</span>
      </div>
    </div>
    <div class="year-line"></div>
  </div>

  <!-- Journey Cards -->
  <div class="journeys-list">
    {#each trips as trip, index}
      <JourneyCard {trip} {index} {onTripClick} />
    {/each}
  </div>
</section>

<style>
  .year-section {
    position: relative;
    padding: 1rem 0 2rem;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }

  .year-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .year-divider {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-left: 0;
  }

  .year-marker {
    position: relative;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .marker-dot {
    width: 14px;
    height: 14px;
    background: #00d4ff;
    border-radius: 50%;
    z-index: 2;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  }

  .marker-ring {
    position: absolute;
    inset: 0;
    border: 2px solid rgba(0, 212, 255, 0.3);
    border-radius: 50%;
    animation: ringPulse 2s ease-in-out infinite;
  }

  @keyframes ringPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.5;
    }
  }

  .year-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .year-number {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .year-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .stat-separator {
    opacity: 0.5;
  }

  .year-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(0, 212, 255, 0.3),
      transparent
    );
  }

  .journeys-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-left: 60px;
  }

  @media (max-width: 768px) {
    .year-marker {
      width: 40px;
      height: 40px;
    }

    .marker-dot {
      width: 10px;
      height: 10px;
    }

    .year-number {
      font-size: 1.5rem;
    }

    .journeys-list {
      padding-left: 50px;
    }
  }
</style>
