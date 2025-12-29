// ============================================
// APP MODE
// ============================================

export type AppMode = 'builder' | 'traveler';

// ============================================
// BASE NODE (shared by all node types)
// ============================================

export interface BaseNode {
  /** Unique identifier */
  id: string;
  /** Node type determines rendering and behavior */
  type: NodeType;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** User-defined tags */
  tags?: string[];
  /** Which mode created this node */
  sourceMode: AppMode;
}

// ============================================
// NODE TYPES
// ============================================

/** Builder mode node types */
export type BuilderNodeType =
  | 'goal'
  | 'skill'
  | 'project'
  | 'resource'
  | 'concept'
  | 'note';

/** Traveler mode node types */
export type TravelerNodeType = 'trip';

/** All node types */
export type NodeType = BuilderNodeType | TravelerNodeType;

// ============================================
// EDGES
// ============================================

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  createdAt: string;
}

export type EdgeType =
  // Builder edges
  | 'requires'
  | 'enables'
  | 'uses'
  | 'teaches'
  | 'part-of'
  // Traveler edges
  | 'traveled-to'
  | 'followed-by'
  // Cross-modal
  | 'related';

// ============================================
// LAYOUT TYPES
// ============================================

/** Builder mode layouts */
export type BuilderLayout =
  | 'radial'
  | 'physics'
  | 'timeline'
  | 'cluster'
  | 'hierarchy';

/** Traveler mode layouts */
export type TravelerLayout =
  | 'globe'
  | 'map'
  | 'timeline';

// ============================================
// THEME
// ============================================

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'forest' | 'sunset';

// ============================================
// UI STATE
// ============================================

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/** Generate unique ID */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Get current ISO timestamp */
export function nowISO(): string {
  return new Date().toISOString();
}
