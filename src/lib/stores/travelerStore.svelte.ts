import type {
  TripNode,
  TripLocation,
  TravelerSettings,
  TravelStats,
  GlobeArc,
  GlobeMarker,
} from '$lib/types/traveler';
import { SAMPLE_TRIPS_2025, HOME_BASE } from '$lib/data/sampleTrips';
import {
  calculateTravelStats,
  sortTripsByDate,
  tripsToArcs,
  tripsToMarkers,
  filterTripsByYear,
  getUniqueYears,
} from '$lib/utils/tripUtils';
import { appStore } from './appStore.svelte';

// ============================================
// DERIVED STATE (from appStore)
// ============================================

/** All trip nodes from the main store */
const allTrips = $derived(
  appStore.allNodes.filter((n): n is TripNode => n.type === 'trip')
);

/** Traveler settings from main store */
const settings = $derived(appStore.travelerSettings);

/** Individual setting values for better reactivity */
const autoRotate = $derived(appStore.travelerSettings.autoRotate);
const animateArcs = $derived(appStore.travelerSettings.animateArcs);
const globeStyle = $derived(appStore.travelerSettings.globeStyle);
const colorScheme = $derived(appStore.travelerSettings.colorScheme);

/** Sorted trips */
const sortedTrips = $derived(sortTripsByDate(allTrips));

/** Available years */
const availableYears = $derived(getUniqueYears(allTrips));

/** Filtered trips (by year if filter set) */
const filteredTrips = $derived.by((): TripNode[] => {
  if (settings.yearFilter) {
    return filterTripsByYear(sortedTrips, settings.yearFilter);
  }
  return sortedTrips;
});

/** Travel statistics */
const stats = $derived<TravelStats>(
  calculateTravelStats(filteredTrips)
);

/** Globe arcs */
const arcs = $derived<GlobeArc[]>(
  tripsToArcs(filteredTrips, settings.colorScheme, settings.homeBase)
);

/** Globe markers */
const markers = $derived<GlobeMarker[]>(
  tripsToMarkers(filteredTrips, settings.homeBase)
);

// ============================================
// ACTIONS
// ============================================

/**
 * Load sample trip data
 */
function loadSampleData(): void {
  // Clear existing trips
  const existingTrips = appStore.allNodes.filter(n => n.type === 'trip');
  existingTrips.forEach(trip => appStore.removeNode(trip.id));

  // Add sample trips
  SAMPLE_TRIPS_2025.forEach(trip => appStore.addNode(trip));

  // Set home base
  appStore.updateTravelerSettings({ homeBase: HOME_BASE });
}

/**
 * Add a new trip
 */
function addTrip(trip: TripNode): void {
  appStore.addNode(trip);
}

/**
 * Update a trip
 */
function updateTrip(tripId: string, updates: Partial<TripNode>): void {
  appStore.updateNode(tripId, updates);
}

/**
 * Remove a trip
 */
function removeTrip(tripId: string): void {
  appStore.removeNode(tripId);
}

/**
 * Set year filter
 */
function setYearFilter(year: number | undefined): void {
  appStore.updateTravelerSettings({ yearFilter: year });
}

/**
 * Set home base
 */
function setHomeBase(location: TripLocation | undefined): void {
  appStore.updateTravelerSettings({ homeBase: location });
}

/**
 * Update color scheme
 */
function setColorScheme(scheme: TravelerSettings['colorScheme']): void {
  appStore.updateTravelerSettings({ colorScheme: scheme });
}

/**
 * Update globe style
 */
function setGlobeStyle(style: TravelerSettings['globeStyle']): void {
  appStore.updateTravelerSettings({ globeStyle: style });
}

/**
 * Toggle arc animation
 */
function toggleArcAnimation(enabled: boolean): void {
  appStore.updateTravelerSettings({ animateArcs: enabled });
}

/**
 * Toggle auto-rotate
 */
function toggleAutoRotate(enabled: boolean): void {
  appStore.updateTravelerSettings({ autoRotate: enabled });
}

// ============================================
// EXPORT STORE
// ============================================

export const travelerStore = {
  // Getters
  get trips() { return sortedTrips; },
  get filteredTrips() { return filteredTrips; },
  get stats() { return stats; },
  get arcs() { return arcs; },
  get markers() { return markers; },
  get settings() { return settings; },
  get availableYears() { return availableYears; },
  get homeBase() { return settings.homeBase; },

  // Individual settings for reactive access
  get autoRotate() { return autoRotate; },
  get animateArcs() { return animateArcs; },
  get globeStyle() { return globeStyle; },
  get colorScheme() { return colorScheme; },

  // Actions
  loadSampleData,
  addTrip,
  updateTrip,
  removeTrip,
  setYearFilter,
  setHomeBase,
  setColorScheme,
  setGlobeStyle,
  toggleArcAnimation,
  toggleAutoRotate,
};
