import type { BaseNode, TravelerLayout } from './common';

// ============================================
// DISPLAY MODE
// ============================================

/**
 * Display mode for filtering travel entries
 * - 'all': Show both journeys (multi-stop) and destinations (single-stop)
 * - 'journeys': Show only multi-stop trips with routes
 * - 'destinations': Show only single-stop visits (pins only, no arcs)
 */
export type DisplayMode = 'all' | 'journeys' | 'destinations';

// ============================================
// TRIP LOCATION
// ============================================

export interface TripLocation {
  /** City name */
  city: string;
  /** Country name */
  country: string;
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** State/Province/Region */
  region?: string;
  /** IANA timezone */
  timezone?: string;
  /** Nearest airport IATA code */
  nearestAirport?: string;
  /** Order in multi-city trip */
  order: number;
}

// ============================================
// TRIP NODE
// ============================================

export interface TripNode extends BaseNode {
  type: 'trip';
  metadata: TripMetadata;
}

export interface TripMetadata {
  /** Trip start date (YYYY-MM-DD) */
  startDate: string;
  /** Trip end date (YYYY-MM-DD) */
  endDate: string;
  /** Trip category */
  category?: TripCategory;
  /** Locations visited in this trip */
  locations: TripLocation[];
  /** Computed: duration in days */
  durationDays?: number;
  /** Computed: total distance traveled */
  distanceKm?: number;
  /** Photo URLs */
  photos?: string[];
  /** Trip highlights/memories */
  highlights?: string[];
}

export type TripCategory =
  | 'leisure'
  | 'business'
  | 'family'
  | 'nomad'
  | 'adventure';

// ============================================
// TRAVEL ENTRY (ALIAS + HELPERS)
// ============================================

/**
 * TravelEntry is an alias for TripNode
 * Used for clearer semantics when handling both journeys and destinations
 */
export type TravelEntry = TripNode;

/**
 * Check if a travel entry is a journey (multi-stop with route)
 * @returns true if the entry has 2+ locations
 */
export function isJourney(entry: TripNode): boolean {
  return entry.metadata.locations.length >= 2;
}

/**
 * Check if a travel entry is a destination (single-stop, pin only)
 * @returns true if the entry has exactly 1 location
 */
export function isDestination(entry: TripNode): boolean {
  return entry.metadata.locations.length === 1;
}

/**
 * Filter entries by display mode
 */
export function filterByDisplayMode(entries: TripNode[], mode: DisplayMode): TripNode[] {
  switch (mode) {
    case 'journeys':
      return entries.filter(isJourney);
    case 'destinations':
      return entries.filter(isDestination);
    case 'all':
    default:
      return entries;
  }
}

// ============================================
// TRAVELER SETTINGS
// ============================================

export interface TravelerSettings {
  layout: TravelerLayout;
  homeBase?: TripLocation;
  yearFilter?: number;
  /** Filter by entry type: all, journeys only, or destinations only */
  displayMode: DisplayMode;
  colorScheme: ArcColorScheme;
  globeStyle: GlobeStyle;
  showArcs: boolean;
  showMarkers: boolean;
  animateArcs: boolean;
  autoRotate: boolean;
}

export type ArcColorScheme = 'cosmic' | 'sunset' | 'ocean' | 'mono';
export type GlobeStyle = 'night' | 'dark' | 'satellite' | 'dotted';

export const DEFAULT_TRAVELER_SETTINGS: TravelerSettings = {
  layout: 'globe',
  displayMode: 'all',
  colorScheme: 'cosmic',
  globeStyle: 'night',
  showArcs: true,
  showMarkers: true,
  animateArcs: true,
  autoRotate: true,
};

// ============================================
// ARC COLORS
// ============================================

export const ARC_COLORS: Record<ArcColorScheme, [string, string]> = {
  cosmic: ['#00d4ff', '#a855f7'],
  sunset: ['#f97316', '#ec4899'],
  ocean: ['#0ea5e9', '#14b8a6'],
  mono: ['#e2e8f0', '#94a3b8'],
};

// ============================================
// GLOBE TEXTURES
// ============================================

export const GLOBE_TEXTURES: Record<GlobeStyle, string> = {
  night: '//unpkg.com/three-globe/example/img/earth-night.jpg',
  dark: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
  satellite: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  dotted: '//unpkg.com/three-globe/example/img/earth-topology.png',
};

// ============================================
// TRAVEL STATS (Derived)
// ============================================

export interface TravelStats {
  totalTrips: number;
  totalDays: number;
  totalDistanceKm: number;
  countriesVisited: string[];
  citiesVisited: string[];
  uniqueCountries: number;
  uniqueCities: number;
  mostVisitedCountry: { country: string; countryCode: string; days: number } | null;
  mostVisitedCity: { city: string; visits: number } | null;
  longestTrip: { label: string; days: number } | null;
  shortestTrip: { label: string; days: number } | null;
  tripsByMonth: Record<string, number>;
  tripsByCategory: Record<TripCategory, number>;
  averageTripLength: number;
}

// ============================================
// GLOBE RENDERING TYPES
// ============================================

export interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string | [string, string];
  stroke?: number;
  altitude?: number;
  label?: string;
  tripId?: string;
  dashLength?: number;
  dashGap?: number;
  dashAnimateTime?: number;
}

export interface GlobeMarker {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
  visits: number;
  location: TripLocation;
}

// ============================================
// CATEGORY COLORS
// ============================================

export const TRIP_CATEGORY_COLORS: Record<TripCategory, string> = {
  leisure: '#22c55e',
  business: '#3b82f6',
  family: '#f59e0b',
  nomad: '#a855f7',
  adventure: '#ef4444',
};
