<script lang="ts">
  import type { NodeType } from '$lib/types';
  import { themeState } from '$lib/stores/theme.svelte';
  import { getNodeColor } from '$lib/themes';

  interface Props {
    years: { year: number; x: number }[];
    swimLanes: { type: NodeType; label: string; y: number }[];
    width: number;
    height: number;
    padding?: number;
  }

  let { years, swimLanes, width, height, padding = 80 }: Props = $props();
</script>

<g class="timeline-axis pointer-events-none">
  <!-- Horizontal axis line -->
  <line
    x1={padding}
    y1={height - padding / 2}
    x2={width - padding}
    y2={height - padding / 2}
    stroke="rgba(255, 255, 255, 0.2)"
    stroke-width="1"
  />

  <!-- Year markers -->
  {#each years as { year, x }}
    <g transform="translate({x}, {height - padding / 2})">
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
    />
    <!-- Lane divider line -->
    <line
      x1={padding}
      y1={y + 25}
      x2={width - padding}
      y2={y + 25}
      stroke="rgba(255, 255, 255, 0.05)"
      stroke-width="1"
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
    >
      {label}
    </text>
  {/each}
</g>
