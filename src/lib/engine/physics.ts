import type { GraphNode, GraphEdge, PhysicsConfig, Simulation } from '$lib/types';
import { DEFAULT_PHYSICS_CONFIG, NODE_SIZES } from '$lib/types';

// Get the visual radius of a node (including outer ring)
function getNodeRadius(node: GraphNode): number {
  const baseSize = NODE_SIZES[node.type] ?? 14;
  return baseSize + 12; // Account for outer glow/ring
}

export function createSimulation(
  getNodes: () => GraphNode[],
  getEdges: () => GraphEdge[],
  width: number,
  height: number,
  config: Partial<PhysicsConfig> = {}
): Simulation {
  const cfg = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  let alpha = 1;
  let running = true;

  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize positions if not set
  function initPositions(): void {
    const nodes = getNodes();
    nodes.forEach((node, i) => {
      if (node.x === undefined || node.y === undefined) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const radius = node.type === 'goal' ? 0 : 200 + Math.random() * 100;
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
      }
      node.vx = node.vx ?? 0;
      node.vy = node.vy ?? 0;
    });
  }

  initPositions();

  function applyRepulsion(nodes: GraphNode[]): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = (b.x ?? 0) - (a.x ?? 0);
        const dy = (b.y ?? 0) - (a.y ?? 0);
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

        // Calculate minimum distance based on actual node sizes
        const radiusA = getNodeRadius(a);
        const radiusB = getNodeRadius(b);
        const minDist = Math.max(cfg.minDistance, radiusA + radiusB + 20);

        // Always apply some repulsion
        const force = cfg.repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        a.vx = (a.vx ?? 0) - fx;
        a.vy = (a.vy ?? 0) - fy;
        b.vx = (b.vx ?? 0) + fx;
        b.vy = (b.vy ?? 0) + fy;

        // Strong push if nodes are overlapping
        if (dist < minDist) {
          const overlap = minDist - dist;
          const pushStrength = overlap * 0.8; // Stronger push
          const pushX = (dx / dist) * pushStrength;
          const pushY = (dy / dist) * pushStrength;
          a.vx = (a.vx ?? 0) - pushX;
          a.vy = (a.vy ?? 0) - pushY;
          b.vx = (b.vx ?? 0) + pushX;
          b.vy = (b.vy ?? 0) + pushY;
        }
      }
    }
  }

  function applyAttraction(nodes: GraphNode[], edges: GraphEdge[]): void {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    edges.forEach((edge) => {
      const source = nodeMap.get(edge.from);
      const target = nodeMap.get(edge.to);
      if (!source || !target) return;

      const dx = (target.x ?? 0) - (source.x ?? 0);
      const dy = (target.y ?? 0) - (source.y ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const diff = dist - cfg.idealDistance;

      const force = diff * cfg.attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx = (source.vx ?? 0) + fx;
      source.vy = (source.vy ?? 0) + fy;
      target.vx = (target.vx ?? 0) - fx;
      target.vy = (target.vy ?? 0) - fy;
    });
  }

  function applyCenterGravity(nodes: GraphNode[]): void {
    nodes.forEach((node) => {
      node.vx = (node.vx ?? 0) + (centerX - (node.x ?? 0)) * cfg.centerGravity;
      node.vy = (node.vy ?? 0) + (centerY - (node.y ?? 0)) * cfg.centerGravity;
    });
  }

  function tick(): boolean {
    if (!running || alpha < cfg.alphaMin) return false;

    const nodes = getNodes();
    const edges = getEdges();

    // Reset forces
    nodes.forEach((n) => {
      n.vx = n.vx ?? 0;
      n.vy = n.vy ?? 0;
    });

    // Apply forces
    applyRepulsion(nodes);
    applyAttraction(nodes, edges);
    applyCenterGravity(nodes);

    // Update positions
    nodes.forEach((node) => {
      // Skip nodes being dragged (they have very high velocity set externally)
      node.vx = (node.vx ?? 0) * cfg.damping;
      node.vy = (node.vy ?? 0) * cfg.damping;
      node.x = (node.x ?? 0) + (node.vx ?? 0) * alpha;
      node.y = (node.y ?? 0) + (node.vy ?? 0) * alpha;

      // Bounds
      node.x = Math.max(60, Math.min(width - 60, node.x ?? 0));
      node.y = Math.max(60, Math.min(height - 60, node.y ?? 0));
    });

    alpha *= cfg.alphaDecay;
    return true;
  }

  function stop(): void {
    running = false;
  }

  function restart(): void {
    alpha = 1;
    running = true;
    initPositions();
  }

  function reheat(newAlpha = 0.3): void {
    alpha = Math.max(alpha, newAlpha);
    running = true;
  }

  return { tick, stop, restart, reheat };
}

export function updateDimensions(
  simulation: { restart: () => void },
  _width: number,
  _height: number
): void {
  simulation.restart();
}
