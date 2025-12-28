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
    onmouseenter: () => void;
    onmouseleave: () => void;
    onclick: () => void;
    onmousedown: (e: MouseEvent) => void;
  }

  let {
    node,
    color,
    isSelected,
    isHovered,
    isConnected,
    isDimmed,
    onmouseenter,
    onmouseleave,
    onclick,
    onmousedown
  }: Props = $props();

  const radius = $derived(NODE_SIZES[node.type] ?? 14);
  const x = $derived(node.x ?? 0);
  const y = $derived(node.y ?? 0);

  // Visual states
  const isActive = $derived(isSelected || isHovered);
  const showRing = $derived(isActive || isConnected);
  const ringOpacity = $derived(isActive ? 0.8 : isConnected ? 0.4 : 0);
  const groupOpacity = $derived(isDimmed ? 0.12 : 1);
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
    stroke={color}
    stroke-width="2"
    opacity={ringOpacity}
    stroke-dasharray={isActive ? 'none' : '4 4'}
    class="transition-all duration-200"
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
</g>

<style>
  .graph-node {
    transition: opacity 0.2s ease;
  }
</style>
