/**
 * Layout mode store for SkillGraph
 * Manages switching between 5 layout modes
 */

import { writable, derived } from 'svelte/store';
import type { LayoutType, ClusterData } from '$lib/types';

// Default to radial layout for clear visualization
export const layoutMode = writable<LayoutType>('radial');

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
