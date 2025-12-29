import type {
  AppMode,
  AppState,
  AnyNode,
  Edge,
  ThemeMode,
  ViewportState,
  BuilderNodeType,
  TravelerNodeType,
  BuilderLayout,
  TravelerLayout,
} from '$lib/types/index';
import {
  DEFAULT_BUILDER_SETTINGS,
  DEFAULT_TRAVELER_SETTINGS,
  nowISO,
} from '$lib/types/index';
import type { BuilderNode } from '$lib/types/builder';
import type { TripNode } from '$lib/types/traveler';

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_STATE: AppState = {
  mode: 'builder',
  nodes: [],
  edges: [],
  builderSettings: DEFAULT_BUILDER_SETTINGS,
  travelerSettings: DEFAULT_TRAVELER_SETTINGS,
  theme: 'midnight',
  selectedNodeId: null,
  viewport: { zoom: 1, panX: 0, panY: 0 },
  graphName: 'My Journey',
};

// ============================================
// PERSISTENCE
// ============================================

const STORAGE_KEY = 'nexusmindgraph:state';

function loadFromStorage(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
}

function saveToStorage(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// ============================================
// STATE (Svelte 5 Runes)
// ============================================

let state = $state<AppState>(loadFromStorage() ?? INITIAL_STATE);

// ============================================
// HELPER CONSTANTS
// ============================================

const BUILDER_TYPES: BuilderNodeType[] = ['goal', 'skill', 'project', 'resource', 'concept', 'note'];
const TRAVELER_TYPES: TravelerNodeType[] = ['trip'];

// ============================================
// DERIVED STATE
// ============================================

/** All nodes for current mode */
const visibleNodes = $derived.by((): AnyNode[] => {
  if (state.mode === 'builder') {
    return state.nodes.filter((n: AnyNode) => BUILDER_TYPES.includes(n.type as BuilderNodeType));
  } else {
    return state.nodes.filter((n: AnyNode) => TRAVELER_TYPES.includes(n.type as TravelerNodeType));
  }
});

/** Builder nodes only */
const builderNodes = $derived(
  state.nodes.filter((n: AnyNode) => n.sourceMode === 'builder') as BuilderNode[]
);

/** Traveler nodes (trips) only */
const tripNodes = $derived(
  state.nodes.filter((n: AnyNode) => n.type === 'trip') as TripNode[]
);

/** Nodes grouped by type */
const nodesByType = $derived.by((): Record<string, AnyNode[]> => {
  const grouped: Record<string, AnyNode[]> = {};
  for (const node of visibleNodes) {
    if (!grouped[node.type]) {
      grouped[node.type] = [];
    }
    grouped[node.type].push(node);
  }
  return grouped;
});

/** Currently selected node */
const selectedNode = $derived(
  state.selectedNodeId
    ? state.nodes.find((n: AnyNode) => n.id === state.selectedNodeId) ?? null
    : null
);

/** Available layouts for current mode */
const availableLayouts = $derived.by((): readonly BuilderLayout[] | readonly TravelerLayout[] => {
  if (state.mode === 'builder') {
    return ['radial', 'physics', 'timeline', 'cluster', 'hierarchy'] as const;
  } else {
    return ['globe', 'map', 'timeline'] as const;
  }
});

/** Current layout */
const currentLayout = $derived.by((): BuilderLayout | TravelerLayout => {
  if (state.mode === 'builder') {
    return state.builderSettings.layout;
  } else {
    return state.travelerSettings.layout;
  }
});

// ============================================
// ACTIONS
// ============================================

function setMode(newMode: AppMode): void {
  state.mode = newMode;
  state.selectedNodeId = null;
  saveToStorage(state);
}

function toggleMode(): void {
  setMode(state.mode === 'builder' ? 'traveler' : 'builder');
}

function setTheme(theme: ThemeMode): void {
  state.theme = theme;
  saveToStorage(state);
}

function setGraphName(name: string): void {
  state.graphName = name;
  saveToStorage(state);
}

function selectNode(nodeId: string | null): void {
  state.selectedNodeId = nodeId;
}

function addNode(node: AnyNode): void {
  state.nodes = [...state.nodes, node];
  saveToStorage(state);
}

function updateNode(nodeId: string, updates: Partial<AnyNode>): void {
  state.nodes = state.nodes.map((n: AnyNode) =>
    n.id === nodeId
      ? { ...n, ...updates, updatedAt: nowISO() }
      : n
  ) as AnyNode[];
  saveToStorage(state);
}

function removeNode(nodeId: string): void {
  state.nodes = state.nodes.filter((n: AnyNode) => n.id !== nodeId);
  state.edges = state.edges.filter((e: Edge) => e.source !== nodeId && e.target !== nodeId);
  if (state.selectedNodeId === nodeId) {
    state.selectedNodeId = null;
  }
  saveToStorage(state);
}

function addEdge(edge: Edge): void {
  state.edges = [...state.edges, edge];
  saveToStorage(state);
}

function removeEdge(edgeId: string): void {
  state.edges = state.edges.filter((e: Edge) => e.id !== edgeId);
  saveToStorage(state);
}

// Builder-specific actions
function setBuilderLayout(layout: BuilderLayout): void {
  state.builderSettings = { ...state.builderSettings, layout };
  saveToStorage(state);
}

function updateBuilderSettings(updates: Partial<typeof state.builderSettings>): void {
  state.builderSettings = { ...state.builderSettings, ...updates };
  saveToStorage(state);
}

// Traveler-specific actions
function setTravelerLayout(layout: TravelerLayout): void {
  state.travelerSettings.layout = layout;
  saveToStorage(state);
}

function updateTravelerSettings(updates: Partial<typeof state.travelerSettings>): void {
  // Mutate properties directly for proper Svelte 5 reactivity
  Object.assign(state.travelerSettings, updates);
  saveToStorage(state);
}

// Viewport actions
function setViewport(viewport: Partial<ViewportState>): void {
  state.viewport = { ...state.viewport, ...viewport };
}

function resetViewport(): void {
  state.viewport = { zoom: 1, panX: 0, panY: 0 };
}

// Data actions
function clearCurrentModeData(): void {
  if (state.mode === 'builder') {
    state.nodes = state.nodes.filter((n: AnyNode) => n.sourceMode !== 'builder');
  } else {
    state.nodes = state.nodes.filter((n: AnyNode) => n.sourceMode !== 'traveler');
  }
  state.selectedNodeId = null;
  saveToStorage(state);
}

function importData(data: { nodes: AnyNode[]; edges: Edge[] }): void {
  state.nodes = data.nodes;
  state.edges = data.edges;
  saveToStorage(state);
}

function exportData(): { nodes: AnyNode[]; edges: Edge[] } {
  return {
    nodes: state.nodes,
    edges: state.edges,
  };
}

// ============================================
// EXPORT STORE
// ============================================

export const appStore = {
  // State getters
  get state() { return state; },
  get mode() { return state.mode; },
  get visibleNodes() { return visibleNodes; },
  get builderNodes() { return builderNodes; },
  get tripNodes() { return tripNodes; },
  get nodesByType() { return nodesByType; },
  get selectedNode() { return selectedNode; },
  get selectedNodeId() { return state.selectedNodeId; },
  get availableLayouts() { return availableLayouts; },
  get currentLayout() { return currentLayout; },
  get builderSettings() { return state.builderSettings; },
  get travelerSettings() { return state.travelerSettings; },
  get theme() { return state.theme; },
  get graphName() { return state.graphName; },
  get viewport() { return state.viewport; },
  get edges() { return state.edges; },
  get allNodes() { return state.nodes; },

  // Mode actions
  setMode,
  toggleMode,

  // Theme actions
  setTheme,
  setGraphName,

  // Node actions
  selectNode,
  addNode,
  updateNode,
  removeNode,

  // Edge actions
  addEdge,
  removeEdge,

  // Builder actions
  setBuilderLayout,
  updateBuilderSettings,

  // Traveler actions
  setTravelerLayout,
  updateTravelerSettings,

  // Viewport actions
  setViewport,
  resetViewport,

  // Data actions
  clearCurrentModeData,
  importData,
  exportData,

  // Persistence
  saveToStorage: () => saveToStorage(state),
};
