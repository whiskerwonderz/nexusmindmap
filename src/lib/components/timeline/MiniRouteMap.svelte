<script lang="ts">
  import type { TripLocation } from '$lib/types/traveler';

  interface Props {
    locations: TripLocation[];
    color?: string;
    class?: string;
  }

  let { locations, color = '#00d4ff', class: className = '' }: Props = $props();

  // Simple mercator projection for SVG
  function projectToSVG(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
    const padding = 15;
    const width = 120;
    const height = 80;

    // Normalize to 0-1 range
    const x = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1);
    const y = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1);

    return {
      x: padding + x * (width - padding * 2),
      y: padding + y * (height - padding * 2),
    };
  }

  // Calculate bounds and projected points
  const projectedData = $derived.by(() => {
    if (locations.length === 0) return { points: [], pathD: '' };

    // Calculate bounds with some padding
    const lats = locations.map((l) => l.lat);
    const lngs = locations.map((l) => l.lng);
    const latPadding = (Math.max(...lats) - Math.min(...lats)) * 0.2 || 5;
    const lngPadding = (Math.max(...lngs) - Math.min(...lngs)) * 0.2 || 5;

    const bounds = {
      minLat: Math.min(...lats) - latPadding,
      maxLat: Math.max(...lats) + latPadding,
      minLng: Math.min(...lngs) - lngPadding,
      maxLng: Math.max(...lngs) + lngPadding,
    };

    // Project all points
    const points = locations.map((loc, i) => ({
      ...projectToSVG(loc.lat, loc.lng, bounds),
      city: loc.city,
      isFirst: i === 0,
      isLast: i === locations.length - 1,
    }));

    // Create curved path between points
    let pathD = '';
    if (points.length > 1) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        // Add slight curve
        const curve = Math.abs(curr.x - prev.x) * 0.2;
        pathD += ` Q ${midX} ${midY - curve} ${curr.x} ${curr.y}`;
      }
    }

    return { points, pathD };
  });
</script>

<svg class="mini-route-map {className}" viewBox="0 0 120 80" fill="none">
  <!-- Background -->
  <rect width="120" height="80" rx="8" fill="rgba(0, 0, 0, 0.3)" />

  <!-- Route path with glow -->
  {#if projectedData.pathD}
    <!-- Glow layer -->
    <path
      d={projectedData.pathD}
      stroke={color}
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
      opacity="0.3"
      filter="url(#glow)"
    />
    <!-- Main path -->
    <path
      d={projectedData.pathD}
      stroke={color}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="4 2"
      fill="none"
      opacity="0.8"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="0"
        to="12"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  {/if}

  <!-- Location markers -->
  {#each projectedData.points as point, i}
    <g class="marker-group">
      <!-- Marker ring -->
      <circle
        cx={point.x}
        cy={point.y}
        r={point.isFirst || point.isLast ? 6 : 4}
        fill="none"
        stroke={color}
        stroke-width="1.5"
        opacity="0.5"
      />
      <!-- Marker dot -->
      <circle
        cx={point.x}
        cy={point.y}
        r={point.isFirst || point.isLast ? 3 : 2}
        fill={color}
      />
      <!-- Number -->
      <text
        x={point.x}
        y={point.y + 0.5}
        text-anchor="middle"
        dominant-baseline="middle"
        fill="white"
        font-size="5"
        font-weight="600"
      >
        {i + 1}
      </text>
    </g>
  {/each}

  <!-- Filters -->
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
</svg>

<style>
  .mini-route-map {
    width: 120px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .marker-group {
    cursor: pointer;
  }

  .marker-group:hover circle {
    filter: brightness(1.2);
  }
</style>
