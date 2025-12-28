<script lang="ts">
  import type { NodeType } from '$lib/types';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';
  import { timelineState } from '$lib/stores/layout';

  interface Props {
    years: { year: number; x: number }[];
    swimLanes: { type: NodeType; label: string; y: number }[];
    width: number;
    height: number;
    padding?: number;
  }

  let { years, swimLanes, width, height, padding = 80 }: Props = $props();

  const trackWidth = $derived(width - padding * 2);

  // Calculate X position from range
  const rangeStartX = $derived(padding + $timelineState.range.start * trackWidth);
  const rangeEndX = $derived(padding + $timelineState.range.end * trackWidth);

  // Format date from X position
  function formatDateFromX(x: number): string {
    const progress = (x - padding) / trackWidth;
    const { minDate, maxDate } = $timelineState;
    const timestamp = minDate + progress * (maxDate - minDate);
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Play progress line position
  const playLineX = $derived(padding + $timelineState.playProgress * trackWidth);
</script>

<g class="timeline-axis">
  <!-- Dimmed regions outside range -->
  <rect
    x={padding}
    y={padding / 2}
    width={rangeStartX - padding}
    height={height - padding}
    fill="rgba(0, 0, 0, 0.4)"
    class="pointer-events-none"
  />
  <rect
    x={rangeEndX}
    y={padding / 2}
    width={width - padding - rangeEndX}
    height={height - padding}
    fill="rgba(0, 0, 0, 0.4)"
    class="pointer-events-none"
  />

  <!-- Horizontal axis line -->
  <line
    x1={padding}
    y1={height - padding / 2}
    x2={width - padding}
    y2={height - padding / 2}
    stroke="rgba(255, 255, 255, 0.2)"
    stroke-width="1"
    class="pointer-events-none"
  />

  <!-- Year markers -->
  {#each years as { year, x }}
    <g transform="translate({x}, {height - padding / 2})" class="pointer-events-none">
      <!-- Tick mark -->
      <line
        y1="0"
        y2="8"
        stroke="rgba(255, 255, 255, 0.3)"
        stroke-width="1"
      />
      <!-- Year label -->
      <text
        y="22"
        fill="rgba(255, 255, 255, 0.6)"
        font-size="11"
        font-weight="500"
        text-anchor="middle"
      >
        {year}
      </text>
      <!-- Vertical guide line -->
      <line
        y1={-(height - padding * 1.5)}
        y2="0"
        stroke="rgba(255, 255, 255, 0.05)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
    </g>
  {/each}

  <!-- Swim lane labels and backgrounds -->
  {#each swimLanes as { type, label, y }}
    <!-- Lane background stripe -->
    <rect
      x={padding}
      y={y - 25}
      width={width - padding * 2}
      height="50"
      fill={getNodeColor(themeState.currentTheme, type)}
      opacity="0.03"
      rx="4"
      class="pointer-events-none"
    />
    <!-- Lane divider line -->
    <line
      x1={padding}
      y1={y + 25}
      x2={width - padding}
      y2={y + 25}
      stroke="rgba(255, 255, 255, 0.05)"
      stroke-width="1"
      class="pointer-events-none"
    />
    <!-- Lane label -->
    <text
      x={padding - 12}
      y={y}
      fill={getNodeColor(themeState.currentTheme, type)}
      opacity="0.7"
      font-size="10"
      font-weight="500"
      text-anchor="end"
      dominant-baseline="middle"
      class="pointer-events-none select-none"
    >
      {label}
    </text>
  {/each}

  <!-- Hover vertical line -->
  {#if $timelineState.hoverX !== null && $timelineState.hoverX >= padding && $timelineState.hoverX <= width - padding}
    <g class="hover-line pointer-events-none">
      <line
        x1={$timelineState.hoverX}
        y1={padding / 2}
        x2={$timelineState.hoverX}
        y2={height - padding / 2}
        stroke="rgba(255, 255, 255, 0.6)"
        stroke-width="1"
        stroke-dasharray="4 2"
      />
      <!-- Date tooltip -->
      <g transform="translate({$timelineState.hoverX}, {padding / 2 - 8})">
        <rect
          x="-40"
          y="-12"
          width="80"
          height="20"
          rx="4"
          fill="rgba(0, 0, 0, 0.8)"
          stroke="rgba(255, 255, 255, 0.2)"
          stroke-width="1"
        />
        <text
          y="2"
          fill="white"
          font-size="10"
          font-weight="500"
          text-anchor="middle"
        >
          {formatDateFromX($timelineState.hoverX)}
        </text>
      </g>
    </g>
  {/if}

  <!-- Play progress line -->
  {#if $timelineState.isPlaying || $timelineState.playProgress > 0}
    <g class="play-line pointer-events-none">
      <line
        x1={playLineX}
        y1={padding / 2}
        x2={playLineX}
        y2={height - padding / 2}
        stroke="#F59E0B"
        stroke-width="2"
      />
      <!-- Glow effect -->
      <line
        x1={playLineX}
        y1={padding / 2}
        x2={playLineX}
        y2={height - padding / 2}
        stroke="#F59E0B"
        stroke-width="6"
        opacity="0.3"
      />
    </g>
  {/if}

  <!-- Range boundary indicators -->
  <line
    x1={rangeStartX}
    y1={padding / 2}
    x2={rangeStartX}
    y2={height - padding / 2}
    stroke="rgba(59, 130, 246, 0.4)"
    stroke-width="1"
    stroke-dasharray="2 2"
    class="pointer-events-none"
  />
  <line
    x1={rangeEndX}
    y1={padding / 2}
    x2={rangeEndX}
    y2={height - padding / 2}
    stroke="rgba(59, 130, 246, 0.4)"
    stroke-width="1"
    stroke-dasharray="2 2"
    class="pointer-events-none"
  />
</g>
