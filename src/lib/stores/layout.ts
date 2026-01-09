/**
 * Layout mode store for SkillGraph
 * Manages switching between 5 layout modes
 */

import { writable, derived, get } from 'svelte/store';
import type { LayoutType, ClusterData } from '$lib/types';

// Default to radial layout for clear visualization
export const layoutMode = writable<LayoutType>('radial');

// Trigger counter to force layout recalculation (increment to trigger)
export const layoutTrigger = writable<number>(0);

/**
 * Force re-apply the current layout (used after loading new project data)
 */
export function forceRelayout(): void {
  layoutTrigger.update(n => n + 1);
}

// Timeline-specific state
export interface TimelineRange {
  start: number; // 0-1 percentage
  end: number;   // 0-1 percentage
}

export interface TimelineState {
  range: TimelineRange;
  isPlaying: boolean;
  playProgress: number; // 0-1, current position in animation
  hoverX: number | null; // X position for vertical line
  minDate: number; // timestamp
  maxDate: number; // timestamp
}

const defaultTimelineState: TimelineState = {
  range: { start: 0, end: 1 },
  isPlaying: false,
  playProgress: 0,
  hoverX: null,
  minDate: Date.now(),
  maxDate: Date.now()
};

export const timelineState = writable<TimelineState>(defaultTimelineState);

// Re-export LayoutMode as alias for backwards compatibility
export type LayoutMode = LayoutType;

// Derived stores for easy mode checking
export const isRadialMode = derived(layoutMode, $mode => $mode === 'radial');
export const isPhysicsMode = derived(layoutMode, $mode => $mode === 'physics');
export const isTimelineMode = derived(layoutMode, $mode => $mode === 'timeline');
export const isClusterMode = derived(layoutMode, $mode => $mode === 'cluster');
export const isHierarchicalMode = derived(layoutMode, $mode => $mode === 'hierarchical');

// Check if current mode uses physics simulation
export const usesPhysics = derived(layoutMode, $mode => $mode === 'physics');

// Check if current mode is static (no simulation)
export const isStaticMode = derived(layoutMode, $mode => $mode !== 'physics');

// Store for cluster background data (used by cluster layout)
export const clusterData = writable<ClusterData[]>([]);

// Store for focused cluster (for zoom/focus effect)
export const focusedClusterId = writable<string | null>(null);

// Store for expanded clusters
export const expandedClusters = writable<Set<string>>(new Set());

// Cluster interaction functions
export function focusCluster(clusterId: string | null): void {
  focusedClusterId.set(clusterId);
}

export function toggleClusterExpand(clusterId: string): void {
  expandedClusters.update(set => {
    const newSet = new Set(set);
    if (newSet.has(clusterId)) {
      newSet.delete(clusterId);
    } else {
      newSet.add(clusterId);
    }
    return newSet;
  });
}

export function isClusterExpanded(clusterId: string): boolean {
  let expanded = false;
  expandedClusters.subscribe(set => {
    expanded = set.has(clusterId);
  })();
  return expanded;
}

// Store for timeline axis visibility
export const showTimelineAxis = derived(layoutMode, $mode => $mode === 'timeline');

// Store for cluster backgrounds visibility
export const showClusterBackgrounds = derived(layoutMode, $mode => $mode === 'cluster');

/**
 * Toggle to next layout mode (cycles through all 5)
 */
export function cycleLayoutMode(): void {
  layoutMode.update(mode => {
    const modes: LayoutType[] = ['radial', 'physics', 'timeline', 'cluster', 'hierarchical'];
    const currentIndex = modes.indexOf(mode);
    return modes[(currentIndex + 1) % modes.length];
  });
}

/**
 * Set a specific layout mode
 */
export function setLayoutMode(mode: LayoutType): void {
  layoutMode.set(mode);
}

/**
 * Update cluster data (called after cluster layout is applied)
 */
export function setClusterData(data: ClusterData[]): void {
  clusterData.set(data);
}

// Timeline functions
export function setTimelineRange(start: number, end: number): void {
  timelineState.update(state => ({
    ...state,
    range: { start: Math.max(0, Math.min(start, end)), end: Math.min(1, Math.max(start, end)) }
  }));
}

export function setTimelineDateBounds(minDate: number, maxDate: number): void {
  timelineState.update(state => ({
    ...state,
    minDate,
    maxDate
  }));
}

export function setTimelineHoverX(x: number | null): void {
  timelineState.update(state => ({ ...state, hoverX: x }));
}

export function startTimelinePlay(): void {
  timelineState.update(state => ({ ...state, isPlaying: true, playProgress: 0 }));
}

export function stopTimelinePlay(): void {
  timelineState.update(state => ({ ...state, isPlaying: false }));
}

export function setTimelinePlayProgress(progress: number): void {
  timelineState.update(state => ({ ...state, playProgress: Math.min(1, Math.max(0, progress)) }));
}

export function resetTimelineState(): void {
  timelineState.set(defaultTimelineState);
}
