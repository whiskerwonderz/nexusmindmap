import { writable, derived, get } from 'svelte/store';
import type { GraphNode, GraphEdge, GraphData, NodeType } from '$lib/types';

// Create writable stores
export const nodes = writable<GraphNode[]>([]);
export const edges = writable<GraphEdge[]>([]);
export const selectedNodeId = writable<string | null>(null);
export const hoveredNodeId = writable<string | null>(null);
export const title = writable<string>('My SkillGraph');

// Derived stores
export const selectedNode = derived(
  [nodes, selectedNodeId],
  ([$nodes, $selectedNodeId]) => $nodes.find((n) => n.id === $selectedNodeId) ?? null
);

export const hoveredNode = derived(
  [nodes, hoveredNodeId],
  ([$nodes, $hoveredNodeId]) => $nodes.find((n) => n.id === $hoveredNodeId) ?? null
);

export const connectedNodeIds = derived(
  [nodes, edges, hoveredNodeId, selectedNodeId],
  ([$nodes, $edges, $hoveredNodeId, $selectedNodeId]) => {
    const activeId = $hoveredNodeId ?? $selectedNodeId;
    if (!activeId) return new Set<string>();
    const connected = new Set<string>([activeId]);
    $edges.forEach((e) => {
      if (e.from === activeId) connected.add(e.to);
      if (e.to === activeId) connected.add(e.from);
    });
    return connected;
  }
);

export const nodesByType = derived(nodes, ($nodes) => {
  const grouped: Record<NodeType, GraphNode[]> = {
    goal: [],
    skill: [],
    project: [],
    source: [],
    cert: [],
    concept: []
  };
  $nodes.forEach((n) => {
    grouped[n.type].push(n);
  });
  return grouped;
});

export const nodeMap = derived(nodes, ($nodes) => {
  const map = new Map<string, GraphNode>();
  $nodes.forEach((n) => map.set(n.id, n));
  return map;
});

// Actions
export function addNode(node: Omit<GraphNode, 'id'>): string {
  const id = crypto.randomUUID();
  nodes.update((n) => [...n, { ...node, id }]);
  return id;
}

export function updateNode(id: string, updates: Partial<GraphNode>): void {
  nodes.update((n) =>
    n.map((node) => (node.id === id ? { ...node, ...updates } : node))
  );
}

export function deleteNode(id: string): void {
  nodes.update((n) => n.filter((node) => node.id !== id));
  edges.update((e) => e.filter((edge) => edge.from !== id && edge.to !== id));
  selectedNodeId.update((s) => (s === id ? null : s));
  hoveredNodeId.update((h) => (h === id ? null : h));
}

export function addEdge(from: string, to: string, label?: string): string {
  const currentEdges = get(edges);
  const exists = currentEdges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
  );
  if (exists) return '';

  const id = crypto.randomUUID();
  edges.update((e) => [...e, { id, from, to, label }]);
  return id;
}

export function deleteEdge(id: string): void {
  edges.update((e) => e.filter((edge) => edge.id !== id));
}

export function selectNode(id: string | null): void {
  selectedNodeId.set(id);
}

export function hoverNode(id: string | null): void {
  hoveredNodeId.set(id);
}

export function setTitle(newTitle: string): void {
  title.set(newTitle);
}

export function loadData(data: GraphData): void {
  console.log('loadData called with', data.nodes?.length, 'nodes');

  if (data.nodes && Array.isArray(data.nodes)) {
    nodes.set(data.nodes.map((n) => ({ ...n })));
  }
  if (data.edges && Array.isArray(data.edges)) {
    edges.set(data.edges.map((e) => ({ ...e })));
  }
  title.set(data.meta?.title ?? 'My SkillGraph');
  selectedNodeId.set(null);
  hoveredNodeId.set(null);

  console.log('After loadData, nodes:', get(nodes).length);
}

export function clear(): void {
  nodes.set([]);
  edges.set([]);
  selectedNodeId.set(null);
  hoveredNodeId.set(null);
  title.set('My SkillGraph');
}

export function getConnectedEdges(nodeId: string): GraphEdge[] {
  return get(edges).filter((e) => e.from === nodeId || e.to === nodeId);
}

export function getConnectedNodes(nodeId: string): GraphNode[] {
  const currentEdges = get(edges);
  const currentNodes = get(nodes);
  const connectedIds = new Set<string>();
  currentEdges.forEach((e) => {
    if (e.from === nodeId) connectedIds.add(e.to);
    if (e.to === nodeId) connectedIds.add(e.from);
  });
  return currentNodes.filter((n) => connectedIds.has(n.id));
}
