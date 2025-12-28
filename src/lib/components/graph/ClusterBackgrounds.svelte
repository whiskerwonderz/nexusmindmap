<script lang="ts">
  import type { ClusterData } from '$lib/types';

  interface Props {
    clusters: ClusterData[];
  }

  let { clusters }: Props = $props();
</script>

<g class="cluster-backgrounds pointer-events-none">
  {#each clusters as cluster}
    <!-- Outer glow -->
    <circle
      cx={cluster.x}
      cy={cluster.y}
      r={cluster.radius + 10}
      fill={cluster.color}
      opacity="0.03"
    />

    <!-- Main cluster circle -->
    <circle
      cx={cluster.x}
      cy={cluster.y}
      r={cluster.radius}
      fill="none"
      stroke={cluster.color}
      stroke-width="1.5"
      stroke-dasharray="6 4"
      opacity="0.25"
    />

    <!-- Inner fill -->
    <circle
      cx={cluster.x}
      cy={cluster.y}
      r={cluster.radius}
      fill={cluster.color}
      opacity="0.04"
    />

    <!-- Cluster label -->
    <text
      x={cluster.x}
      y={cluster.y - cluster.radius - 12}
      fill={cluster.color}
      opacity="0.8"
      font-size="11"
      font-weight="600"
      text-anchor="middle"
      class="select-none"
    >
      {cluster.label}
    </text>

    <!-- Node count badge -->
    <g transform="translate({cluster.x + cluster.radius * 0.7}, {cluster.y - cluster.radius * 0.7})">
      <circle
        r="12"
        fill={cluster.color}
        opacity="0.2"
      />
      <text
        fill={cluster.color}
        font-size="9"
        font-weight="600"
        text-anchor="middle"
        dominant-baseline="middle"
        class="select-none"
      >
        {cluster.nodeCount}
      </text>
    </g>
  {/each}
</g>
