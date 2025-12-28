/**
 * Layout algorithms for SkillGraph
 * Provides 5 layout modes: physics, radial, timeline, cluster, hierarchical
 */

import type {
  GraphNode,
  GraphEdge,
  NodeType,
  LayoutType,
  LayoutConfig,
  TimelineLayoutConfig,
  ClusterLayoutConfig,
  HierarchyLayoutConfig,
  ClusterData
} from '$lib/types';
import { NODE_TYPE_LABELS } from '$lib/types';

// Re-export LayoutMode as alias for LayoutType (backwards compatibility)
export type LayoutMode = LayoutType;

// Node type hierarchy - which ring each type belongs to (for radial)
const TYPE_RINGS: Record<NodeType, number> = {
  goal: 0,     // Center
  skill: 1,    // First ring
  project: 2,  // Second ring
  cert: 2,     // Second ring (milestones)
  source: 3,   // Third ring
  concept: 4   // Outer ring
};

// Swim lane order for timeline layout
const TYPE_SWIM_LANES: Record<NodeType, number> = {
  goal: 0,
  skill: 1,
  project: 2,
  cert: 3,
  source: 4,
  concept: 5
};

// Colors for clusters (will be used in ClusterBackgrounds)
const CLUSTER_COLORS: Record<NodeType, string> = {
  goal: '#F59E0B',
  skill: '#3B82F6',
  project: '#10B981',
  source: '#8B5CF6',
  cert: '#EC4899',
  concept: '#6B7280'
};

/**
 * Unified layout function - dispatches to appropriate algorithm
 */
export function applyLayout(
  type: LayoutType,
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
): GraphNode[] {
  switch (type) {
    case 'physics':
      // Physics layout is handled separately by the simulation
      return nodes;
    case 'radial':
      return computeRadialLayout(nodes, edges, config);
    case 'timeline':
      return computeTimelineLayout(nodes, edges, config as TimelineLayoutConfig);
    case 'cluster':
      return computeClusterLayout(nodes, edges, config as ClusterLayoutConfig);
    case 'hierarchical':
      return computeHierarchicalLayout(nodes, edges, config as HierarchyLayoutConfig);
    default:
      return nodes;
  }
}

/**
 * Group nodes by their type
 */
function groupNodesByType(nodes: GraphNode[]): Record<NodeType, GraphNode[]> {
  const grouped: Record<NodeType, GraphNode[]> = {
    goal: [],
    skill: [],
    project: [],
    cert: [],
    source: [],
    concept: []
  };

  nodes.forEach(node => {
    grouped[node.type].push(node);
  });

  return grouped;
}

/**
 * Build adjacency map for quick edge lookups
 */
function buildAdjacencyMap(edges: GraphEdge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();

  edges.forEach(edge => {
    if (!adj.has(edge.from)) adj.set(edge.from, new Set());
    if (!adj.has(edge.to)) adj.set(edge.to, new Set());
    adj.get(edge.from)!.add(edge.to);
    adj.get(edge.to)!.add(edge.from);
  });

  return adj;
}

/**
 * Find the best parent node for positioning (closest connected node in inner ring)
 */
function findParentNode(
  node: GraphNode,
  parentRingNodes: GraphNode[],
  adjacency: Map<string, Set<string>>
): GraphNode | null {
  const connected = adjacency.get(node.id);
  if (!connected) return null;

  for (const parent of parentRingNodes) {
    if (connected.has(parent.id)) {
      return parent;
    }
  }

  return null;
}

// ============================================================================
// RADIAL LAYOUT
// ============================================================================

/**
 * Compute radial layout - nodes arranged in concentric rings by type
 */
export function computeRadialLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig
): GraphNode[] {
  const { centerX, centerY, width, height } = config;
  const maxRadius = Math.min(width, height) * 0.42;
  const ringCount = 5;
  const ringSpacing = maxRadius / ringCount;

  // Group nodes by type
  const grouped = groupNodesByType(nodes);
  const adjacency = buildAdjacencyMap(edges);

  // Result array - we'll update positions
  const result = nodes.map(n => ({ ...n }));
  const nodeById = new Map(result.map(n => [n.id, n]));

  // Ring 0: Goal at center
  grouped.goal.forEach(goal => {
    const node = nodeById.get(goal.id)!;
    node.x = centerX;
    node.y = centerY;
    node.vx = 0;
    node.vy = 0;
  });

  // Ring 1: Skills - evenly distributed around goal
  const skills = grouped.skill;
  const skillRadius = ringSpacing * 1.3;
  skills.forEach((skill, i) => {
    const angle = (i / Math.max(skills.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const node = nodeById.get(skill.id)!;
    node.x = centerX + Math.cos(angle) * skillRadius;
    node.y = centerY + Math.sin(angle) * skillRadius;
    node.vx = 0;
    node.vy = 0;
  });

  // Ring 2: Projects and Milestones (certs)
  const ring2Nodes = [...grouped.project, ...grouped.cert];
  const ring2Radius = ringSpacing * 2.3;
  positionRingNodes(ring2Nodes, skills, ring2Radius, centerX, centerY, adjacency, nodeById);

  // Ring 3: Sources
  const ring3Radius = ringSpacing * 3.2;
  positionRingNodes(grouped.source, skills, ring3Radius, centerX, centerY, adjacency, nodeById);

  // Ring 4: Concepts
  const ring4Radius = ringSpacing * 4.0;
  positionRingNodes(grouped.concept, skills, ring4Radius, centerX, centerY, adjacency, nodeById);

  return result;
}

/**
 * Position nodes in a ring, trying to place them near their connected parent nodes
 */
function positionRingNodes(
  ringNodes: GraphNode[],
  parentNodes: GraphNode[],
  radius: number,
  centerX: number,
  centerY: number,
  adjacency: Map<string, Set<string>>,
  nodeById: Map<string, GraphNode>
): void {
  if (ringNodes.length === 0) return;

  // Group ring nodes by their parent (connected skill)
  const nodesByParent = new Map<string | null, GraphNode[]>();

  ringNodes.forEach(ringNode => {
    const parent = findParentNode(ringNode, parentNodes, adjacency);
    const parentId = parent?.id ?? null;
    if (!nodesByParent.has(parentId)) {
      nodesByParent.set(parentId, []);
    }
    nodesByParent.get(parentId)!.push(ringNode);
  });

  // Position nodes near their parents
  const usedAngles: number[] = [];
  const minAngleSeparation = (Math.PI * 2) / Math.max(ringNodes.length * 1.5, 12);

  nodesByParent.forEach((children, parentId) => {
    let baseAngle: number;

    if (parentId) {
      const parent = nodeById.get(parentId)!;
      // Calculate angle from center to parent
      baseAngle = Math.atan2(
        (parent.y ?? centerY) - centerY,
        (parent.x ?? centerX) - centerX
      );
    } else {
      // No parent - distribute evenly in remaining space
      baseAngle = usedAngles.length > 0
        ? usedAngles[usedAngles.length - 1] + Math.PI / 4
        : 0;
    }

    // Spread children around the base angle
    const spreadAngle = Math.min(Math.PI / 3, minAngleSeparation * children.length);
    const startAngle = baseAngle - spreadAngle / 2;

    children.forEach((child, i) => {
      let angle = startAngle + (i / Math.max(children.length - 1, 1)) * spreadAngle;

      // Adjust if too close to existing nodes
      while (usedAngles.some(a => Math.abs(a - angle) < minAngleSeparation)) {
        angle += minAngleSeparation * 0.5;
      }

      const node = nodeById.get(child.id)!;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.vx = 0;
      node.vy = 0;

      usedAngles.push(angle);
    });
  });

  // Handle any remaining nodes without parents
  const orphans = ringNodes.filter(n => {
    const node = nodeById.get(n.id)!;
    return node.x === undefined || node.x === n.x;
  });

  if (orphans.length > 0) {
    orphans.forEach((orphan, i) => {
      const angle = (i / orphans.length) * Math.PI * 2;
      const node = nodeById.get(orphan.id)!;
      if (node.x === undefined) {
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
        node.vx = 0;
        node.vy = 0;
      }
    });
  }
}

// ============================================================================
// TIMELINE LAYOUT
// ============================================================================

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute timeline layout - nodes positioned by date with swim lanes by type
 */
export function computeTimelineLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: TimelineLayoutConfig
): GraphNode[] {
  const { width, height, padding = 80 } = config;
  const swimLaneHeight = config.swimLaneHeight ?? (height - padding * 2) / 6;

  // Get nodes with dates
  const nodesWithDates = nodes.filter(n => n.date);
  const nodesWithoutDates = nodes.filter(n => !n.date);

  // Calculate date range
  const dates = nodesWithDates.map(n => parseDate(n.date)!.getTime());
  const minTime = config.minDate?.getTime() ?? (dates.length > 0 ? Math.min(...dates) : Date.now());
  const maxTime = config.maxDate?.getTime() ?? (dates.length > 0 ? Math.max(...dates) : Date.now());
  const timeRange = maxTime - minTime || 1; // Avoid division by zero

  // Result array
  const result = nodes.map(n => ({ ...n }));
  const nodeById = new Map(result.map(n => [n.id, n]));

  // Position nodes with dates
  nodesWithDates.forEach(n => {
    const node = nodeById.get(n.id)!;
    const date = parseDate(n.date)!;
    const timeProgress = (date.getTime() - minTime) / timeRange;

    // X position based on date
    node.x = padding + timeProgress * (width - padding * 2);

    // Y position based on swim lane (node type)
    const lane = TYPE_SWIM_LANES[n.type];
    node.y = padding + lane * swimLaneHeight + swimLaneHeight / 2;

    node.vx = 0;
    node.vy = 0;
  });

  // Position nodes without dates at the right side, stacked by type
  const typeCounters: Record<NodeType, number> = {
    goal: 0, skill: 0, project: 0, cert: 0, source: 0, concept: 0
  };

  nodesWithoutDates.forEach(n => {
    const node = nodeById.get(n.id)!;
    const lane = TYPE_SWIM_LANES[n.type];
    const offset = typeCounters[n.type]++;

    // Position at the right edge with slight offset
    node.x = width - padding - offset * 30;
    node.y = padding + lane * swimLaneHeight + swimLaneHeight / 2;
    node.vx = 0;
    node.vy = 0;
  });

  // Apply collision avoidance within swim lanes
  resolveTimelineCollisions(result, swimLaneHeight);

  return result;
}

/**
 * Resolve collisions in timeline layout
 */
function resolveTimelineCollisions(nodes: GraphNode[], swimLaneHeight: number): void {
  const minSpacing = 50;

  // Group by swim lane
  const grouped = groupNodesByType(nodes);

  Object.values(grouped).forEach(laneNodes => {
    // Sort by x position
    laneNodes.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

    // Push overlapping nodes apart
    for (let i = 1; i < laneNodes.length; i++) {
      const prev = laneNodes[i - 1];
      const curr = laneNodes[i];
      const gap = (curr.x ?? 0) - (prev.x ?? 0);

      if (gap < minSpacing) {
        curr.x = (prev.x ?? 0) + minSpacing;
      }
    }
  });
}

/**
 * Get timeline axis data for rendering
 */
export function getTimelineAxisData(
  nodes: GraphNode[],
  config: TimelineLayoutConfig
): { years: { year: number; x: number }[]; swimLanes: { type: NodeType; label: string; y: number }[] } {
  const { width, height, padding = 80 } = config;
  const swimLaneHeight = config.swimLaneHeight ?? (height - padding * 2) / 6;

  // Get date range
  const nodesWithDates = nodes.filter(n => n.date);
  const dates = nodesWithDates.map(n => parseDate(n.date)!.getTime());
  const minTime = config.minDate?.getTime() ?? (dates.length > 0 ? Math.min(...dates) : Date.now());
  const maxTime = config.maxDate?.getTime() ?? (dates.length > 0 ? Math.max(...dates) : Date.now());
  const timeRange = maxTime - minTime || 1;

  // Generate year markers
  const minYear = new Date(minTime).getFullYear();
  const maxYear = new Date(maxTime).getFullYear();
  const years: { year: number; x: number }[] = [];

  for (let year = minYear; year <= maxYear; year++) {
    const yearTime = new Date(year, 0, 1).getTime();
    const progress = (yearTime - minTime) / timeRange;
    if (progress >= 0 && progress <= 1) {
      years.push({
        year,
        x: padding + progress * (width - padding * 2)
      });
    }
  }

  // Generate swim lane labels
  const swimLanes = Object.entries(TYPE_SWIM_LANES).map(([type, lane]) => ({
    type: type as NodeType,
    label: NODE_TYPE_LABELS[type as NodeType],
    y: padding + lane * swimLaneHeight + swimLaneHeight / 2
  }));

  return { years, swimLanes };
}

// ============================================================================
// CLUSTER LAYOUT
// ============================================================================

/**
 * Get cluster key for a node (type or custom cluster)
 */
function getClusterKey(node: GraphNode): string {
  return node.cluster ?? node.type;
}

/**
 * Compute cluster layout - nodes grouped by type/cluster
 */
export function computeClusterLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: ClusterLayoutConfig
): GraphNode[] {
  const { centerX, centerY, width, height, padding = 60 } = config;
  const clusterPadding = config.clusterPadding ?? 40;
  const nodePadding = config.nodePadding ?? 25;

  // Group nodes by cluster
  const clusters = new Map<string, GraphNode[]>();
  nodes.forEach(node => {
    const key = getClusterKey(node);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(node);
  });

  // Result array
  const result = nodes.map(n => ({ ...n }));
  const nodeById = new Map(result.map(n => [n.id, n]));

  // Calculate cluster sizes and positions
  const clusterCount = clusters.size;
  const clusterRadius = Math.min(width, height) * 0.35;

  let clusterIndex = 0;
  clusters.forEach((clusterNodes, clusterKey) => {
    // Position cluster center in a circle
    const angle = (clusterIndex / clusterCount) * Math.PI * 2 - Math.PI / 2;
    const clusterCenterX = centerX + Math.cos(angle) * clusterRadius * 0.6;
    const clusterCenterY = centerY + Math.sin(angle) * clusterRadius * 0.6;

    // Calculate radius needed for this cluster's nodes
    const nodeCount = clusterNodes.length;
    const innerRadius = Math.sqrt(nodeCount) * nodePadding;

    // Position nodes within the cluster using a spiral/pack pattern
    clusterNodes.forEach((clusterNode, nodeIndex) => {
      const node = nodeById.get(clusterNode.id)!;

      if (nodeCount === 1) {
        node.x = clusterCenterX;
        node.y = clusterCenterY;
      } else {
        // Spiral pattern within cluster
        const spiralAngle = (nodeIndex / nodeCount) * Math.PI * 2 * 2; // 2 rotations
        const spiralRadius = (nodeIndex / nodeCount) * innerRadius;
        node.x = clusterCenterX + Math.cos(spiralAngle) * spiralRadius;
        node.y = clusterCenterY + Math.sin(spiralAngle) * spiralRadius;
      }

      node.vx = 0;
      node.vy = 0;
    });

    clusterIndex++;
  });

  return result;
}

/**
 * Get cluster background data for rendering
 */
export function getClusterData(
  nodes: GraphNode[],
  config: ClusterLayoutConfig
): ClusterData[] {
  const nodePadding = config.nodePadding ?? 25;

  // Group nodes by cluster
  const clusters = new Map<string, GraphNode[]>();
  nodes.forEach(node => {
    const key = getClusterKey(node);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(node);
  });

  // Calculate cluster bounds
  const clusterDataList: ClusterData[] = [];

  clusters.forEach((clusterNodes, clusterKey) => {
    if (clusterNodes.length === 0) return;

    // Calculate bounding circle
    const xs = clusterNodes.map(n => n.x ?? 0);
    const ys = clusterNodes.map(n => n.y ?? 0);
    const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;

    // Find maximum distance from center
    let maxDist = 0;
    clusterNodes.forEach(n => {
      const dist = Math.sqrt(
        Math.pow((n.x ?? 0) - centerX, 2) +
        Math.pow((n.y ?? 0) - centerY, 2)
      );
      maxDist = Math.max(maxDist, dist);
    });

    // Get cluster color (based on majority type or first node)
    const majorityType = clusterNodes[0].type;
    const color = CLUSTER_COLORS[majorityType] ?? '#6B7280';

    clusterDataList.push({
      id: clusterKey,
      label: NODE_TYPE_LABELS[clusterKey as NodeType] ?? clusterKey,
      x: centerX,
      y: centerY,
      radius: maxDist + nodePadding + 20,
      nodeCount: clusterNodes.length,
      color,
      nodeIds: clusterNodes.map(n => n.id)
    });
  });

  return clusterDataList;
}

// ============================================================================
// HIERARCHICAL LAYOUT
// ============================================================================

/**
 * Compute hierarchical layout - tree structure with BFS levels
 */
export function computeHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: HierarchyLayoutConfig
): GraphNode[] {
  const { centerX, width, height, padding = 60 } = config;
  const levelHeight = config.levelHeight ?? 100;
  const nodeSpacing = config.nodeSpacing ?? 80;

  // Build adjacency for traversal
  const adjacency = buildAdjacencyMap(edges);

  // Find root nodes (goals, or nodes with no incoming edges)
  const goals = nodes.filter(n => n.type === 'goal');
  const roots = goals.length > 0 ? goals : [nodes[0]];

  // BFS to assign levels
  const levels = new Map<string, number>();
  const queue: { id: string; level: number }[] = [];
  const visited = new Set<string>();

  roots.forEach(root => {
    if (root) {
      queue.push({ id: root.id, level: 0 });
      visited.add(root.id);
      levels.set(root.id, 0);
    }
  });

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const neighbors = adjacency.get(id);

    if (neighbors) {
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          levels.set(neighborId, level + 1);
          queue.push({ id: neighborId, level: level + 1 });
        }
      });
    }
  }

  // Add any unvisited nodes to the last level
  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, maxLevel + 1);
    }
  });

  // Group nodes by level
  const levelGroups = new Map<number, GraphNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(node);
  });

  // Result array
  const result = nodes.map(n => ({ ...n, level: levels.get(n.id) ?? 0 }));
  const nodeById = new Map(result.map(n => [n.id, n]));

  // Position nodes by level
  const totalLevels = levelGroups.size;
  const startY = padding;
  const availableHeight = height - padding * 2;
  const actualLevelHeight = Math.min(levelHeight, availableHeight / Math.max(totalLevels, 1));

  levelGroups.forEach((levelNodes, level) => {
    const y = startY + level * actualLevelHeight + actualLevelHeight / 2;
    const nodeCount = levelNodes.length;
    const totalWidth = (nodeCount - 1) * nodeSpacing;
    const startX = centerX - totalWidth / 2;

    levelNodes.forEach((levelNode, i) => {
      const node = nodeById.get(levelNode.id)!;
      node.x = startX + i * nodeSpacing;
      node.y = y;
      node.vx = 0;
      node.vy = 0;
    });
  });

  // Second pass: try to center children under their parents
  for (let level = 1; level <= maxLevel + 1; level++) {
    const levelNodes = levelGroups.get(level);
    if (!levelNodes) continue;

    levelNodes.forEach(levelNode => {
      const node = nodeById.get(levelNode.id)!;
      const neighbors = adjacency.get(levelNode.id);

      if (neighbors) {
        // Find parent nodes (neighbors in previous level)
        const parents = Array.from(neighbors)
          .map(id => nodeById.get(id))
          .filter(n => n && (levels.get(n.id) ?? 0) < level);

        if (parents.length > 0) {
          // Average x position of parents
          const avgParentX = parents.reduce((sum, p) => sum + (p!.x ?? 0), 0) / parents.length;
          // Nudge towards parent position
          node.x = (node.x ?? 0) * 0.6 + avgParentX * 0.4;
        }
      }
    });
  }

  return result;
}

/**
 * Get hierarchy level data for rendering
 */
export function getHierarchyLevelData(
  nodes: GraphNode[],
  config: HierarchyLayoutConfig
): { level: number; y: number; nodeCount: number }[] {
  const { height, padding = 60 } = config;
  const levelHeight = config.levelHeight ?? 100;

  // Count nodes per level
  const levelCounts = new Map<number, number>();
  nodes.forEach(n => {
    const level = n.level ?? 0;
    levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
  });

  const startY = padding;
  const availableHeight = height - padding * 2;
  const totalLevels = levelCounts.size;
  const actualLevelHeight = Math.min(levelHeight, availableHeight / Math.max(totalLevels, 1));

  return Array.from(levelCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, nodeCount]) => ({
      level,
      y: startY + level * actualLevelHeight + actualLevelHeight / 2,
      nodeCount
    }));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Easing function for smooth animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for smooth start and end
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Easing function for snappy animations
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
