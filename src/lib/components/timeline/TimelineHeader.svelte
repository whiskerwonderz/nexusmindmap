<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    stats: {
      journeys: number;
      countries: number;
      cities: number;
      totalDays: number;
    };
    class?: string;
  }

  let { stats, class: className = '' }: Props = $props();

  let headerRef: HTMLElement;
  let isVisible = $state(false);

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isVisible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(headerRef);
    return () => observer.disconnect();
  });
</script>

<header class="timeline-header {className}" class:visible={isVisible} bind:this={headerRef}>
  <div class="header-content">
    <h1 class="title">
      <span class="title-line">Your Journey</span>
      <span class="title-accent">Through Time</span>
    </h1>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{stats.journeys}</span>
        <span class="stat-label">Journeys</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{stats.countries}</span>
        <span class="stat-label">Countries</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{stats.cities}</span>
        <span class="stat-label">Cities</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{stats.totalDays}</span>
        <span class="stat-label">Days</span>
      </div>
    </div>
  </div>

  <div class="scroll-indicator">
    <svg class="scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
    <span>Scroll to explore</span>
  </div>
</header>

<style>
  .timeline-header {
    position: relative;
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 4rem 2rem;
    margin-bottom: 3rem;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  }

  .timeline-header.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .header-content {
    text-align: center;
  }

  .title {
    margin: 0 0 3rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .title-line {
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .title-accent {
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    font-weight: 700;
    background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .stats-grid {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0 1rem;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
  }

  .scroll-indicator {
    position: absolute;
    bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.4);
    animation: float 2s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(8px);
    }
  }

  .scroll-icon {
    width: 24px;
    height: 24px;
  }

  .scroll-indicator span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  @media (max-width: 640px) {
    .timeline-header {
      min-height: 50vh;
      padding: 3rem 1rem;
    }

    .stats-grid {
      gap: 1rem;
    }

    .stat-item {
      padding: 0 0.75rem;
    }

    .stat-value {
      font-size: 1.75rem;
    }

    .stat-divider {
      height: 30px;
    }
  }
</style>
