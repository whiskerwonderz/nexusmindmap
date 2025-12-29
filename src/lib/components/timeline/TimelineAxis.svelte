<script lang="ts">
  interface Props {
    startDate: Date;
    endDate: Date;
    totalDays: number;
    class?: string;
  }

  let { startDate, endDate, totalDays, class: className = '' }: Props = $props();

  // Generate month markers
  const monthMarkers = $derived.by(() => {
    const markers: { date: Date; position: number; isYear: boolean }[] = [];
    const current = new Date(startDate);
    current.setDate(1); // Start from first of month

    while (current <= endDate) {
      const daysSinceStart = Math.ceil(
        (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const position = (daysSinceStart / totalDays) * 100;

      if (position >= 0 && position <= 100) {
        markers.push({
          date: new Date(current),
          position,
          isYear: current.getMonth() === 0, // January
        });
      }

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  });

  function formatMonth(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  function formatYear(date: Date): string {
    return date.getFullYear().toString();
  }

  // Today marker calculation
  const todayMarker = $derived.by(() => {
    const today = new Date();
    const todayDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const todayPosition = (todayDays / totalDays) * 100;
    return {
      position: todayPosition,
      visible: todayPosition >= 0 && todayPosition <= 100,
    };
  });
</script>

<div class="timeline-axis {className}">
  <div class="axis-line"></div>

  {#each monthMarkers as marker}
    <div
      class="month-marker"
      class:is-year={marker.isYear}
      style="left: {marker.position}%"
    >
      <div class="marker-tick"></div>
      <div class="marker-label">
        {#if marker.isYear}
          <span class="year-label">{formatYear(marker.date)}</span>
        {/if}
        <span class="month-label">{formatMonth(marker.date)}</span>
      </div>
    </div>
  {/each}

  <!-- Today marker -->
  {#if todayMarker.visible}
    <div class="today-marker" style="left: {todayMarker.position}%">
      <div class="today-line"></div>
      <span class="today-label">Today</span>
    </div>
  {/if}
</div>

<style>
  .timeline-axis {
    position: absolute;
    top: 1rem;
    left: 100px;
    right: 2rem;
    height: 2.5rem;
    z-index: 5;
  }

  .axis-line {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2) 5%,
      rgba(255, 255, 255, 0.2) 95%,
      transparent
    );
  }

  .month-marker {
    position: absolute;
    top: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .marker-tick {
    width: 1px;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
  }

  .month-marker.is-year .marker-tick {
    height: 12px;
    background: rgba(0, 212, 255, 0.6);
  }

  .marker-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
  }

  .month-label {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .year-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #00d4ff;
  }

  .today-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
  }

  .today-line {
    width: 2px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      #ef4444,
      rgba(239, 68, 68, 0.5)
    );
    border-radius: 1px;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  }

  .today-label {
    position: absolute;
    top: -1.25rem;
    padding: 0.125rem 0.5rem;
    background: #ef4444;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    color: white;
    white-space: nowrap;
  }
</style>
