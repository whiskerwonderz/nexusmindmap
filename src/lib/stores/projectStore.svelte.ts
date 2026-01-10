import type {
  ProjectMeta,
  ProjectIndex,
  BuilderProject,
  TravelerProject,
  Project,
} from '$lib/types/project';
import {
  STORAGE_KEYS,
  DEFAULT_PROJECT_INDEX,
  createProjectMeta,
} from '$lib/types/project';
import type { BuilderNode, BuilderSettings } from '$lib/types/builder';
import { DEFAULT_BUILDER_SETTINGS } from '$lib/types/builder';
import type { TripNode, TravelerSettings } from '$lib/types/traveler';
import { DEFAULT_TRAVELER_SETTINGS } from '$lib/types/traveler';
import type { Edge } from '$lib/types/common';
import { get } from 'svelte/store';
import { appStore } from './appStore.svelte';
import { loadData as loadGraphData, clear as clearGraph, nodes as graphNodes, edges as graphEdges } from './graph';
import { forceRelayout } from './layout';

// Import demo data
import exampleData from '$lib/data/example.json';
import demoTripsData from '$lib/data/demo-trips.json';

// ============================================
// PERSISTENCE HELPERS
// ============================================

function loadIndex(): ProjectIndex {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_INDEX;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load project index:', e);
  }
  return DEFAULT_PROJECT_INDEX;
}

function saveIndex(index: ProjectIndex): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.INDEX, JSON.stringify(index));
  } catch (e) {
    console.error('Failed to save project index:', e);
  }
}

function loadProject<T extends Project>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load project:', e);
  }
  return null;
}

function saveProject(key: string, project: Project): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(project));
  } catch (e) {
    console.error('Failed to save project:', e);
  }
}

function deleteProjectStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to delete project:', e);
  }
}

function getStorageKey(mode: 'builder' | 'traveler', id: string): string {
  return mode === 'builder'
    ? `${STORAGE_KEYS.BUILDER_PREFIX}${id}`
    : `${STORAGE_KEYS.TRAVELER_PREFIX}${id}`;
}

// ============================================
// STATE
// ============================================

let index = $state<ProjectIndex>(loadIndex());
let hasUnsavedChanges = $state(false);
let isLoading = $state(false);

// ============================================
// DERIVED STATE
// ============================================

const builderProjects = $derived(index.builder);
const travelerProjects = $derived(index.traveler);

const currentBuilderProject = $derived<ProjectMeta | null>(
  index.currentBuilder
    ? index.builder.find(p => p.id === index.currentBuilder) ?? null
    : null
);

const currentTravelerProject = $derived<ProjectMeta | null>(
  index.currentTraveler
    ? index.traveler.find(p => p.id === index.currentTraveler) ?? null
    : null
);

const currentProject = $derived<ProjectMeta | null>(
  appStore.mode === 'builder' ? currentBuilderProject : currentTravelerProject
);

// ============================================
// ACTIONS
// ============================================

/**
 * Create a new project and set it as current
 */
function createProject(mode: 'builder' | 'traveler', name: string): ProjectMeta {
  const meta = createProjectMeta(mode, name);

  if (mode === 'builder') {
    const project: BuilderProject = {
      ...meta,
      mode: 'builder',
      nodes: [],
      edges: [],
      settings: { ...DEFAULT_BUILDER_SETTINGS },
    };
    saveProject(getStorageKey('builder', meta.id), project);
    index.builder = [...index.builder, meta];
    index.currentBuilder = meta.id;

    // Clear app state for builder
    clearBuilderData();
    clearGraph(); // Clear graph store for GraphCanvas
    appStore.updateBuilderSettings(project.settings);
  } else {
    const project: TravelerProject = {
      ...meta,
      mode: 'traveler',
      trips: [],
      settings: { ...DEFAULT_TRAVELER_SETTINGS },
    };
    saveProject(getStorageKey('traveler', meta.id), project);
    index.traveler = [...index.traveler, meta];
    index.currentTraveler = meta.id;

    // Clear app state for traveler
    clearTravelerData();
    appStore.updateTravelerSettings(project.settings);
  }

  saveIndex(index);
  hasUnsavedChanges = false;
  return meta;
}

/**
 * Save the current project
 */
function saveCurrentProject(mode: 'builder' | 'traveler'): void {
  const currentId = mode === 'builder' ? index.currentBuilder : index.currentTraveler;
  if (!currentId) return;

  const meta = mode === 'builder'
    ? index.builder.find(p => p.id === currentId)
    : index.traveler.find(p => p.id === currentId);
  if (!meta) return;

  const now = new Date().toISOString();
  const updatedMeta = { ...meta, updatedAt: now };

  if (mode === 'builder') {
    // Read from graph store (where AddNodeModal writes) instead of appStore
    const currentGraphNodes = get(graphNodes);
    const currentGraphEdges = get(graphEdges);

    // Convert GraphNode to BuilderNode
    const nodes: BuilderNode[] = currentGraphNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      description: n.description,
      date: n.date,
      url: n.url,
      parent: n.parent,
      sourceMode: 'builder' as const,
      metadata: {},
    }));

    // Convert GraphEdge to Edge
    const edges: Edge[] = currentGraphEdges.map(e => ({
      id: e.id,
      source: e.from,
      target: e.to,
      label: e.label,
    }));

    const project: BuilderProject = {
      ...updatedMeta,
      mode: 'builder',
      nodes,
      edges,
      settings: appStore.builderSettings,
    };
    saveProject(getStorageKey('builder', currentId), project);
    index.builder = index.builder.map(p => p.id === currentId ? updatedMeta : p);
  } else {
    const trips = appStore.allNodes.filter(
      (n): n is TripNode => n.type === 'trip'
    );
    const project: TravelerProject = {
      ...updatedMeta,
      mode: 'traveler',
      trips,
      settings: appStore.travelerSettings,
    };
    saveProject(getStorageKey('traveler', currentId), project);
    index.traveler = index.traveler.map(p => p.id === currentId ? updatedMeta : p);
  }

  saveIndex(index);
  hasUnsavedChanges = false;
}

/**
 * Load a project by ID
 */
function loadProject_(mode: 'builder' | 'traveler', projectId: string): boolean {
  isLoading = true;

  const key = getStorageKey(mode, projectId);
  const project = loadProject<Project>(key);

  if (!project) {
    isLoading = false;
    return false;
  }

  if (mode === 'builder' && project.mode === 'builder') {
    // Clear existing builder data
    clearBuilderData();

    // Load project data into appStore
    project.nodes.forEach(node => appStore.addNode(node));
    project.edges.forEach(edge => appStore.addEdge(edge));
    appStore.updateBuilderSettings(project.settings);

    // Also load into graph store (for GraphCanvas)
    loadGraphData({
      meta: { title: project.name },
      nodes: project.nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        description: n.description,
        date: n.date,
        parent: n.parent,
      })),
      edges: project.edges.map(e => ({
        id: e.id,
        from: e.source,
        to: e.target,
        label: e.label,
      })),
    });

    index.currentBuilder = projectId;

    // Trigger layout recalculation after loading
    setTimeout(() => forceRelayout(), 100);
  } else if (mode === 'traveler' && project.mode === 'traveler') {
    // Clear existing traveler data
    clearTravelerData();

    // Load project data
    project.trips.forEach(trip => appStore.addNode(trip));
    appStore.updateTravelerSettings(project.settings);

    index.currentTraveler = projectId;
  }

  saveIndex(index);
  hasUnsavedChanges = false;
  isLoading = false;
  return true;
}

/**
 * Delete a project
 */
function deleteProject(mode: 'builder' | 'traveler', projectId: string): void {
  const key = getStorageKey(mode, projectId);
  deleteProjectStorage(key);

  if (mode === 'builder') {
    index.builder = index.builder.filter(p => p.id !== projectId);
    if (index.currentBuilder === projectId) {
      index.currentBuilder = index.builder[0]?.id ?? null;
    }
  } else {
    index.traveler = index.traveler.filter(p => p.id !== projectId);
    if (index.currentTraveler === projectId) {
      index.currentTraveler = index.traveler[0]?.id ?? null;
    }
  }

  saveIndex(index);
}

/**
 * Rename a project
 */
function renameProject(mode: 'builder' | 'traveler', projectId: string, newName: string): void {
  const now = new Date().toISOString();

  if (mode === 'builder') {
    index.builder = index.builder.map(p =>
      p.id === projectId ? { ...p, name: newName, updatedAt: now } : p
    );
    // Also update the stored project
    const key = getStorageKey('builder', projectId);
    const project = loadProject<BuilderProject>(key);
    if (project) {
      project.name = newName;
      project.updatedAt = now;
      saveProject(key, project);
    }
  } else {
    index.traveler = index.traveler.map(p =>
      p.id === projectId ? { ...p, name: newName, updatedAt: now } : p
    );
    const key = getStorageKey('traveler', projectId);
    const project = loadProject<TravelerProject>(key);
    if (project) {
      project.name = newName;
      project.updatedAt = now;
      saveProject(key, project);
    }
  }

  saveIndex(index);
}

/**
 * Duplicate a project
 */
function duplicateProject(mode: 'builder' | 'traveler', projectId: string): ProjectMeta | null {
  const key = getStorageKey(mode, projectId);
  const original = loadProject<Project>(key);
  if (!original) return null;

  const newMeta = createProjectMeta(mode, `${original.name} (Copy)`);
  const newProject = { ...original, ...newMeta };
  saveProject(getStorageKey(mode, newMeta.id), newProject);

  if (mode === 'builder') {
    index.builder = [...index.builder, newMeta];
  } else {
    index.traveler = [...index.traveler, newMeta];
  }

  saveIndex(index);
  return newMeta;
}

/**
 * Get list of projects for a mode
 */
function getProjects(mode: 'builder' | 'traveler'): ProjectMeta[] {
  return mode === 'builder' ? index.builder : index.traveler;
}

/**
 * Mark as having unsaved changes
 */
function markUnsaved(): void {
  hasUnsavedChanges = true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function clearBuilderData(): void {
  const builderNodes = appStore.allNodes.filter(n => n.sourceMode === 'builder');
  builderNodes.forEach(n => appStore.removeNode(n.id));
}

function clearTravelerData(): void {
  const travelerNodes = appStore.allNodes.filter(n => n.type === 'trip');
  travelerNodes.forEach(n => appStore.removeNode(n.id));
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize project system - call on app mount
 * If no projects exist, creates a default one with demo data
 */
function initialize(): void {
  // Reload index from localStorage on client-side (SSR leaves it empty)
  if (typeof window !== 'undefined') {
    const savedIndex = loadIndex();
    index.builder = savedIndex.builder;
    index.traveler = savedIndex.traveler;
    index.currentBuilder = savedIndex.currentBuilder;
    index.currentTraveler = savedIndex.currentTraveler;
  }

  // Create default builder project if none exist
  if (index.builder.length === 0) {
    createProjectWithDemoData();
  } else if (index.currentBuilder) {
    loadProject_('builder', index.currentBuilder);
  }

  // Create default traveler project if none exist
  if (index.traveler.length === 0) {
    createTravelerProjectWithDemoData();
  } else if (index.currentTraveler) {
    loadProject_('traveler', index.currentTraveler);
  }
}

/**
 * Create a default traveler project with demo trips
 */
function createTravelerProjectWithDemoData(): ProjectMeta {
  const meta = createProjectMeta('traveler', demoTripsData.meta.title);

  // Convert demo trips to TripNodes
  const trips: TripNode[] = demoTripsData.trips.map((trip) => ({
    id: trip.id,
    type: 'trip' as const,
    label: trip.label,
    description: trip.description,
    sourceMode: 'traveler' as const,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    metadata: trip.metadata as TripNode['metadata'],
  }));

  const project: TravelerProject = {
    ...meta,
    mode: 'traveler',
    trips,
    settings: { ...DEFAULT_TRAVELER_SETTINGS },
  };

  saveProject(getStorageKey('traveler', meta.id), project);
  index.traveler = [...index.traveler, meta];
  index.currentTraveler = meta.id;

  // Load data into app state
  clearTravelerData();
  trips.forEach(trip => appStore.addNode(trip));
  appStore.updateTravelerSettings(project.settings);

  saveIndex(index);
  hasUnsavedChanges = false;
  return meta;
}

/**
 * Create a default builder project with demo data (ML & AI Learning Journey)
 */
function createProjectWithDemoData(): ProjectMeta {
  const meta = createProjectMeta('builder', exampleData.meta.title);

  // Convert example data nodes to BuilderNodes
  const nodes: BuilderNode[] = exampleData.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type as BuilderNode['type'],
    description: node.description,
    date: node.date,
    sourceMode: 'builder' as const,
    metadata: {},
  }));

  // Convert example data edges
  const edges: Edge[] = exampleData.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: edge.label,
  }));

  const project: BuilderProject = {
    ...meta,
    mode: 'builder',
    nodes,
    edges,
    settings: { ...DEFAULT_BUILDER_SETTINGS },
  };

  saveProject(getStorageKey('builder', meta.id), project);
  index.builder = [...index.builder, meta];
  index.currentBuilder = meta.id;

  // Load data into app state
  clearBuilderData();
  nodes.forEach(node => appStore.addNode(node));
  edges.forEach(edge => appStore.addEdge(edge));
  appStore.updateBuilderSettings(project.settings);

  // Also load into the graph store (for GraphCanvas)
  loadGraphData({
    meta: { title: exampleData.meta.title },
    nodes: exampleData.nodes,
    edges: exampleData.edges,
  });

  saveIndex(index);
  hasUnsavedChanges = false;
  return meta;
}

// ============================================
// LOAD DEMO PROJECT
// ============================================

const DEMO_PROJECT_PREFIX = 'Demo';

/**
 * Load or create demo project for a specific mode
 * Always recreates demo from fresh JSON data to ensure latest content
 * Does NOT delete user projects - only replaces demo project
 */
function loadDemoProject(mode: 'builder' | 'traveler'): void {
  if (typeof window === 'undefined') return;

  isLoading = true;

  try {
    // Save current project if there are unsaved changes
    if (hasUnsavedChanges) {
      saveCurrentProject(mode);
    }

    if (mode === 'builder') {
      // Delete existing demo project if it exists (to get fresh data)
      const existingDemo = index.builder.find(p => p.name.startsWith(DEMO_PROJECT_PREFIX));
      if (existingDemo) {
        deleteProjectStorage(getStorageKey('builder', existingDemo.id));
        index.builder = index.builder.filter(p => p.id !== existingDemo.id);
      }
      // Create fresh demo project from JSON
      createProjectWithDemoData();
      // Trigger layout recalculation for builder graph (nodes don't have positions)
      setTimeout(() => forceRelayout(), 100);
    } else {
      // Delete existing demo project if it exists (to get fresh data)
      const existingDemo = index.traveler.find(p => p.name.startsWith(DEMO_PROJECT_PREFIX));
      if (existingDemo) {
        deleteProjectStorage(getStorageKey('traveler', existingDemo.id));
        index.traveler = index.traveler.filter(p => p.id !== existingDemo.id);
      }
      // Create fresh demo project from JSON
      createTravelerProjectWithDemoData();
    }

    saveIndex(index);
    hasUnsavedChanges = false;
  } catch (e) {
    console.error('Failed to load demo project:', e);
  } finally {
    isLoading = false;
  }
}

// ============================================
// EXPORT STORE
// ============================================

export const projectStore = {
  // State
  get builderProjects() { return builderProjects; },
  get travelerProjects() { return travelerProjects; },
  get currentBuilderProject() { return currentBuilderProject; },
  get currentTravelerProject() { return currentTravelerProject; },
  get currentProject() { return currentProject; },
  get hasUnsavedChanges() { return hasUnsavedChanges; },
  get isLoading() { return isLoading; },

  // Actions
  createProject,
  saveCurrentProject,
  loadProject: loadProject_,
  deleteProject,
  renameProject,
  duplicateProject,
  getProjects,
  markUnsaved,
  initialize,
  loadDemoProject,
};
