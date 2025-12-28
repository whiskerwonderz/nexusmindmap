/**
 * Layout mode store for SkillGraph
 * Manages switching between radial (organized) and physics (dynamic) layouts
 */

import { writable, derived } from 'svelte/store';
import type { LayoutMode } from '$lib/engine/layouts';

// Default to radial layout for clear visualization
export const layoutMode = writable<LayoutMode>('radial');

// Derived stores for easy mode checking
export const isRadialMode = derived(layoutMode, $mode => $mode === 'radial');
export const isPhysicsMode = derived(layoutMode, $mode => $mode === 'physics');

/**
 * Toggle between radial and physics modes
 */
export function toggleLayoutMode(): void {
  layoutMode.update(mode => (mode === 'radial' ? 'physics' : 'radial'));
}

/**
 * Set a specific layout mode
 */
export function setLayoutMode(mode: LayoutMode): void {
  layoutMode.set(mode);
}
