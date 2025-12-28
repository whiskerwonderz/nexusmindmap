<script lang="ts">
  import type { GraphNode, GraphEdge, ClusterData } from '$lib/types';

  interface Props {
    edge: GraphEdge;
    sourceNode: GraphNode;
    targetNode: GraphNode;
    isHighlighted: boolean;
    color: string;
    clusters?: ClusterData[];
    enableBundling?: boolean;
  }

  let { edge, sourceNode, targetNode, isHighlighted, color, clusters = [], enableBundling = false }: Props = $props();

  // Find which cluster a node belongs to
  function getNodeCluster(nodeId: string): ClusterData | null {
    for (const cluster of clusters) {
      if (cluster.nodeIds.includes(nodeId)) {
        return cluster;
      }
    }
    return null;
  }

  // Compute path - with optional bundling for cross-cluster edges
  function computePath(src: GraphNode, tgt: GraphNode): string {
    const x1 = src.x ?? 0;
    const y1 = src.y ?? 0;
    const x2 = tgt.x ?? 0;
    const y2 = tgt.y ?? 0;

    // Check if bundling should be applied
    if (enableBundling && clusters.length > 0) {
      const srcCluster = getNodeCluster(src.id);
      const tgtCluster = getNodeCluster(tgt.id);

      // If nodes are in different clusters, create a bundled curved path
      if (srcCluster && tgtCluster && srcCluster.id !== tgtCluster.id) {
        // Route through cluster edge points for bundling effect
        const srcEdgeX = srcCluster.x + (tgtCluster.x - srcCluster.x) * 0.3;
        const srcEdgeY = srcCluster.y + (tgtCluster.y - srcCluster.y) * 0.3;
        const tgtEdgeX = tgtCluster.x + (srcCluster.x - tgtCluster.x) * 0.3;
        const tgtEdgeY = tgtCluster.y + (srcCluster.y - tgtCluster.y) * 0.3;

        // Create a smooth cubic bezier through the bundle points
        return `M ${x1} ${y1} C ${srcEdgeX} ${srcEdgeY}, ${tgtEdgeX} ${tgtEdgeY}, ${x2} ${y2}`;
      }
    }

    // Default: slight curve for non-bundled edges
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const perpX = -dy / dist;
    const perpY = dx / dist;
    const curveAmount = dist * 0.05;
    const ctrlX = midX + perpX * curveAmount;
    const ctrlY = midY + perpY * curveAmount;

    return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
  }

  const pathD = $derived(computePath(sourceNode, targetNode));
  const labelPos = $derived({
    x: ((sourceNode.x ?? 0) + (targetNode.x ?? 0)) / 2,
    y: ((sourceNode.y ?? 0) + (targetNode.y ?? 0)) / 2 - 6
  });

  // Check if this is a cross-cluster edge for styling
  const isCrossCluster = $derived(() => {
    if (!enableBundling || clusters.length === 0) return false;
    const srcCluster = getNodeCluster(sourceNode.id);
    const tgtCluster = getNodeCluster(targetNode.id);
    return srcCluster && tgtCluster && srcCluster.id !== tgtCluster.id;
  });
</script>

<g class="graph-edge" class:highlighted={isHighlighted}>
  <!-- Edge line -->
  <path
    d={pathD}
    fill="none"
    stroke={isHighlighted ? '#ffffff' : color}
    stroke-width={isHighlighted ? 2.5 : 1.5}
    stroke-opacity={isHighlighted ? 1 : 0.5}
    class="transition-all duration-200"
  />

  <!-- Edge label (only visible on highlight) -->
  {#if edge.label && isHighlighted}
    <text
      x={labelPos.x}
      y={labelPos.y}
      fill="var(--color-text-muted)"
      font-size="9"
      text-anchor="middle"
      class="pointer-events-none select-none"
      opacity="0.9"
    >
      {edge.label}
    </text>
  {/if}
</g>

<style>
  .graph-edge {
    transition: opacity 0.2s ease;
  }
</style>
