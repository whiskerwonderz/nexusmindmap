<script lang="ts">
  import type { GraphNode } from '$lib/types';
  import { NODE_SIZES } from '$lib/types';

  interface Props {
    node: GraphNode;
    color: string;
    isSelected: boolean;
    isHovered: boolean;
    isConnected: boolean;
    isDimmed: boolean;
    isConnectionTarget?: boolean;
    onmouseenter: () => void;
    onmouseleave: () => void;
    onclick: () => void;
    onmousedown: (e: MouseEvent) => void;
    onStartConnection?: (nodeId: string, x: number, y: number) => void;
  }

  let {
    node,
    color,
    isSelected,
    isHovered,
    isConnected,
    isDimmed,
    isConnectionTarget = false,
    onmouseenter,
    onmouseleave,
    onclick,
    onmousedown,
    onStartConnection
  }: Props = $props();

  const radius = $derived(NODE_SIZES[node.type] ?? 14);
  const x = $derived(node.x ?? 0);
  const y = $derived(node.y ?? 0);

  // Visual states
  const isActive = $derived(isSelected || isHovered);
  const showRing = $derived(isActive || isConnected);
  const ringOpacity = $derived(isActive ? 0.8 : isConnected ? 0.4 : 0);
  const groupOpacity = $derived(isDimmed ? 0.12 : 1);

  // Connection handles at 4 cardinal points
  const connectionHandles = $derived([
    { dir: 'top', cx: 0, cy: -radius - 3 },
    { dir: 'right', cx: radius + 3, cy: 0 },
    { dir: 'bottom', cx: 0, cy: radius + 3 },
    { dir: 'left', cx: -radius - 3, cy: 0 }
  ]);

  function handleConnectionStart(e: MouseEvent, handle: { cx: number; cy: number }) {
    e.preventDefault();
    e.stopPropagation();
    if (onStartConnection) {
      // Pass world coordinates (node position + handle offset)
      onStartConnection(node.id, x + handle.cx, y + handle.cy);
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<g
  class="graph-node"
  transform="translate({x}, {y})"
  style:cursor="pointer"
  style:opacity={groupOpacity}
  {onmouseenter}
  {onmouseleave}
  {onclick}
  {onmousedown}
>
  <!-- Selection/hover ring -->
  <circle
    r={radius + 6}
    fill="none"
    stroke={isConnectionTarget ? '#00d4ff' : color}
    stroke-width={isConnectionTarget ? 3 : 2}
    opacity={isConnectionTarget ? 1 : ringOpacity}
    stroke-dasharray={isActive ? 'none' : '4 4'}
    class="transition-all duration-200"
    class:connection-target={isConnectionTarget}
  />

  <!-- Outer glow (on hover/select) -->
  {#if isActive}
    <circle r={radius + 12} fill={color} opacity="0.1" class="pointer-events-none" />
  {/if}

  <!-- Node background circle -->
  <circle
    r={radius}
    fill="{color}25"
    stroke={color}
    stroke-width={isActive ? 3 : 2}
    class="transition-all duration-200"
  />

  <!-- Inner filled circle -->
  <circle r={radius * 0.55} fill={color} class="transition-all duration-200" />

  <!-- Label -->
  <text
    dy={radius + 14}
    fill={isActive ? 'var(--color-text)' : 'var(--color-text-muted)'}
    font-size={node.type === 'goal' ? 11 : 9}
    font-weight={isActive ? 600 : 400}
    text-anchor="middle"
    class="pointer-events-none select-none transition-all duration-200"
  >
    {node.label}
  </text>

  <!-- Connection target glow -->
  {#if isConnectionTarget}
    <circle r={radius + 16} fill="#00d4ff" opacity="0.15" class="pointer-events-none" />
  {/if}

  <!-- Connection handles (visible on hover/select) -->
  {#if isActive && onStartConnection}
    {#each connectionHandles as handle}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <circle
        class="connection-handle"
        cx={handle.cx}
        cy={handle.cy}
        r="5"
        fill="#00d4ff"
        stroke="#fff"
        stroke-width="1.5"
        onmousedown={(e) => handleConnectionStart(e, handle)}
      />
    {/each}
  {/if}
</g>

<style>
  .graph-node {
    transition: opacity 0.2s ease;
  }

  .connection-handle {
    cursor: crosshair;
    transition: transform 0.15s ease, fill 0.15s ease;
    transform-origin: center;
  }

  .connection-handle:hover {
    fill: #fff;
    transform: scale(1.3);
  }

  .connection-target {
    filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.6));
  }
</style>
