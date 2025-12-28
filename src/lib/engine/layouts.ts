/**
 * Layout algorithms for SkillGraph
 * Provides radial/hierarchical layouts as alternative to force-directed physics
 */

import type { GraphNode, GraphEdge, NodeType } from '$lib/types';

export type LayoutMode = 'radial' | 'physics';

export interface LayoutConfig {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

// Node type hierarchy - which ring each type belongs to
const TYPE_RINGS: Record<NodeType, number> = {
  goal: 0,     // Center
  skill: 1,    // First ring
  project: 2,  // Second ring
  cert: 2,     // Second ring (milestones)
  source: 3,   // Third ring
  concept: 4   // Outer ring
};

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
    (node as any)._angle = angle; // Store for child positioning
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

/**
 * Easing function for smooth animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for snappy animations
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
