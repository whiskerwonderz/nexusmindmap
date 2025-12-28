/**
 * SkillGraph Type Definitions
 */

// Node Types
export type NodeType = 'goal' | 'skill' | 'project' | 'source' | 'cert' | 'concept';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  date?: string;
  url?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

// Theme Types
export interface ThemeColors {
  background: string;
  goal: string;
  skill: string;
  project: string;
  source: string;
  cert: string;
  concept: string;
  edge: string;
  edgeHighlight: string;
  text: string;
  textMuted: string;
  panelBg: string;
  panelBorder: string;
  inputBg: string;
  buttonPrimary: string;
  buttonHover: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

export type ThemeId =
  | 'midnight'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'aurora'
  | 'minimal'
  | 'noir'
  | 'cyberpunk';

// Graph Data (for persistence)
export interface GraphMeta {
  title: string;
  author?: string;
  created: string;
  updated: string;
  theme: ThemeId | string;
  customColors?: Partial<ThemeColors>;
}

export interface GraphData {
  version: '1.0';
  meta: GraphMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Physics Engine Types
export interface PhysicsConfig {
  repulsion: number;
  attraction: number;
  idealDistance: number;
  centerGravity: number;
  damping: number;
  minDistance: number;
  alphaDecay: number;
  alphaMin: number;
}

export interface Simulation {
  tick: () => boolean;
  stop: () => void;
  restart: () => void;
  reheat: (alpha?: number) => void;
}

// UI State Types
export interface EditorState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  isAddModalOpen: boolean;
  isConnectionModalOpen: boolean;
  connectionSource: string | null;
  connectionTarget: string | null;
  searchQuery: string;
  collapsedSections: Record<NodeType, boolean>;
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

// Event Types
export interface NodeClickEvent {
  node: GraphNode;
  event: MouseEvent;
}

export interface NodeDragEvent {
  node: GraphNode;
  x: number;
  y: number;
}

export interface CanvasClickEvent {
  x: number;
  y: number;
  event: MouseEvent;
}

// Form Types
export interface AddNodeFormData {
  label: string;
  type: NodeType;
  description: string;
  date: string;
  url: string;
  connectTo: string[];
}

export interface ConnectionFormData {
  from: string;
  to: string;
  label: string;
}

// Constants
export const NODE_TYPES: readonly NodeType[] = ['goal', 'skill', 'project', 'source', 'cert', 'concept'];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  goal: 'Goal',
  skill: 'Skill',
  project: 'Project',
  source: 'Source',
  cert: 'Certification',
  concept: 'Concept'
};

export const NODE_SIZES: Record<NodeType, number> = {
  goal: 28,
  skill: 18,
  project: 14,
  source: 12,
  cert: 16,
  concept: 10
};

export const EDGE_LABEL_PRESETS: readonly string[] = [
  'requires',
  'built',
  'built with',
  'learned from',
  'achieved',
  'validates',
  'enables',
  'related',
  'pattern',
  'uses',
  'complements',
  'foundation'
];

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  repulsion: 5000,
  attraction: 0.015,
  idealDistance: 100,
  centerGravity: 0.003,
  damping: 0.4,
  minDistance: 60,
  alphaDecay: 0.99,
  alphaMin: 0.001
};
