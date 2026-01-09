<script lang="ts">
  import type { ClusterData } from '$lib/types';
  import { focusedClusterId, focusCluster, toggleClusterExpand, expandedClusters } from '$lib/stores/layout';

  interface Props {
    clusters: ClusterData[];
    onClusterFocus?: (cluster: ClusterData) => void;
    onClusterExpand?: (cluster: ClusterData) => void;
    onClusterDrag?: (clusterId: string, deltaX: number, deltaY: number) => void;
  }

  let { clusters, onClusterFocus, onClusterExpand, onClusterDrag }: Props = $props();

  let isDragging = $state(false);
  let dragClusterId = $state<string | null>(null);
  let dragStartX = $state(0);
  let dragStartY = $state(0);

  function handleClusterClick(cluster: ClusterData, event: MouseEvent) {
    event.stopPropagation();
    focusCluster(cluster.id);
    onClusterFocus?.(cluster);
  }

  function handleClusterDblClick(cluster: ClusterData, event: MouseEvent) {
    event.stopPropagation();
    toggleClusterExpand(cluster.id);
    onClusterExpand?.(cluster);
  }

  function handleLabelMouseDown(cluster: ClusterData, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = true;
    dragClusterId = cluster.id;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging || !dragClusterId) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    onClusterDrag?.(dragClusterId, deltaX, deltaY);

    dragStartX = event.clientX;
    dragStartY = event.clientY;
  }

  function handleMouseUp() {
    isDragging = false;
    dragClusterId = null;
  }

  // Check if cluster is focused
  function isFocused(clusterId: string): boolean {
    return $focusedClusterId === clusterId;
  }

  // Check if cluster is expanded
  function isExpanded(clusterId: string): boolean {
    return $expandedClusters.has(clusterId);
  }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<g class="cluster-backgrounds">
  {#each clusters as cluster}
    {@const focused = isFocused(cluster.id)}
    {@const expanded = isExpanded(cluster.id)}

    <!-- Clickable background area -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <g
      class="cluster-group"
      class:focused
      class:expanded
      onclick={(e) => handleClusterClick(cluster, e)}
      ondblclick={(e) => handleClusterDblClick(cluster, e)}
      style="pointer-events: all;"
    >
      <!-- Outer glow - larger when focused -->
      <circle
        cx={cluster.x}
        cy={cluster.y}
        r={cluster.radius + (focused ? 20 : 10)}
        fill={cluster.color}
        opacity={focused ? 0.08 : 0.03}
        class="transition-all duration-300"
        style="pointer-events: none;"
      />

      <!-- Main cluster circle - this is the clickable area -->
      <circle
        cx={cluster.x}
        cy={cluster.y}
        r={cluster.radius}
        fill={cluster.color}
        fill-opacity="0.01"
        stroke={cluster.color}
        stroke-width={focused ? 2.5 : 1.5}
        stroke-dasharray={expanded ? "none" : "6 4"}
        opacity={focused ? 0.5 : 0.25}
        class="transition-all duration-300 cursor-pointer"
        style="pointer-events: all;"
      />

      <!-- Inner fill overlay -->
      <circle
        cx={cluster.x}
        cy={cluster.y}
        r={cluster.radius}
        fill={cluster.color}
        opacity={focused ? 0.08 : 0.04}
        class="transition-all duration-300"
        style="pointer-events: none;"
      />

      <!-- Expanded indicator ring -->
      {#if expanded}
        <circle
          cx={cluster.x}
          cy={cluster.y}
          r={cluster.radius + 5}
          fill="none"
          stroke={cluster.color}
          stroke-width="1"
          opacity="0.3"
          class="animate-pulse"
        />
      {/if}
    </g>

    <!-- Cluster label - draggable -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <g
      class="cluster-label cursor-grab"
      class:cursor-grabbing={isDragging && dragClusterId === cluster.id}
      onmousedown={(e) => handleLabelMouseDown(cluster, e)}
    >
      <text
        x={cluster.x}
        y={cluster.y - cluster.radius - 12}
        fill={cluster.color}
        opacity={focused ? 1 : 0.8}
        font-size={focused ? "13" : "11"}
        font-weight="600"
        text-anchor="middle"
        class="select-none transition-all duration-200"
      >
        {cluster.label}
      </text>

      <!-- Drag handle indicator -->
      <rect
        x={cluster.x - 30}
        y={cluster.y - cluster.radius - 24}
        width="60"
        height="20"
        fill="transparent"
        class="cursor-grab"
      />
    </g>

    <!-- Node count badge -->
    <g transform="translate({cluster.x + cluster.radius * 0.7}, {cluster.y - cluster.radius * 0.7})">
      <circle
        r={focused ? 14 : 12}
        fill={cluster.color}
        opacity={focused ? 0.3 : 0.2}
        class="transition-all duration-200"
      />
      <text
        fill={cluster.color}
        font-size={focused ? "10" : "9"}
        font-weight="600"
        text-anchor="middle"
        dominant-baseline="middle"
        class="select-none pointer-events-none"
      >
        {cluster.nodeCount}
      </text>
    </g>

    <!-- Focus indicator -->
    {#if focused}
      <circle
        cx={cluster.x}
        cy={cluster.y}
        r={cluster.radius + 15}
        fill="none"
        stroke={cluster.color}
        stroke-width="1"
        stroke-dasharray="3 3"
        opacity="0.4"
        class="animate-spin-slow pointer-events-none"
      />
    {/if}
  {/each}
</g>

<style>
  .cluster-group {
    transition: all 0.3s ease;
  }

  .cluster-label {
    transition: all 0.2s ease;
  }

  .cursor-grab {
    cursor: grab;
  }

  .cursor-grabbing {
    cursor: grabbing;
  }

  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin-slow {
    animation: spin-slow 20s linear infinite;
    transform-origin: center;
    transform-box: fill-box;
  }

  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.1;
    }
  }
</style>
