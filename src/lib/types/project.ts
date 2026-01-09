import type { BuilderNode, BuilderSettings } from './builder';
import type { TripNode, TravelerSettings } from './traveler';
import type { Edge } from './common';

// ============================================
// PROJECT METADATA
// ============================================

export interface ProjectMeta {
  id: string;
  name: string;
  mode: 'builder' | 'traveler';
  createdAt: string;
  updatedAt: string;
  description?: string;
}

// ============================================
// PROJECT DATA TYPES
// ============================================

export interface BuilderProject extends ProjectMeta {
  mode: 'builder';
  nodes: BuilderNode[];
  edges: Edge[];
  settings: BuilderSettings;
}

export interface TravelerProject extends ProjectMeta {
  mode: 'traveler';
  trips: TripNode[];
  settings: TravelerSettings;
}

export type Project = BuilderProject | TravelerProject;

// ============================================
// PROJECT INDEX (stored in localStorage)
// ============================================

export interface ProjectIndex {
  builder: ProjectMeta[];
  traveler: ProjectMeta[];
  currentBuilder: string | null;
  currentTraveler: string | null;
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  INDEX: 'nexusmind:project-index',
  BUILDER_PREFIX: 'nexusmind:builder:',
  TRAVELER_PREFIX: 'nexusmind:traveler:',
} as const;

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_PROJECT_INDEX: ProjectIndex = {
  builder: [],
  traveler: [],
  currentBuilder: null,
  currentTraveler: null,
};

export function createProjectMeta(
  mode: 'builder' | 'traveler',
  name: string
): ProjectMeta {
  const now = new Date().toISOString();
  return {
    id: `${mode}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    mode,
    createdAt: now,
    updatedAt: now,
  };
}
