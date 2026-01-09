// Re-export all types from a single entry point

export * from './common';
export * from './builder';
export * from './traveler';
export * from './project';

// ============================================
// UNIFIED APP STATE TYPE
// ============================================

import type { AppMode, Edge, ThemeMode, ViewportState } from './common';
import type { BuilderNode, BuilderSettings } from './builder';
import type { TripNode, TravelerSettings } from './traveler';

/** Union of all node types */
export type AnyNode = BuilderNode | TripNode;

/** Complete application state */
export interface AppState {
  /** Current mode */
  mode: AppMode;

  /** All nodes (both modes) */
  nodes: AnyNode[];

  /** All edges */
  edges: Edge[];

  /** Builder mode settings */
  builderSettings: BuilderSettings;

  /** Traveler mode settings */
  travelerSettings: TravelerSettings;

  /** Current theme */
  theme: ThemeMode;

  /** Currently selected node ID */
  selectedNodeId: string | null;

  /** Viewport state */
  viewport: ViewportState;

  /** Current graph/journey name */
  graphName: string;
}
