import type { TripLocation } from '$lib/types/traveler';

const EARTH_RADIUS_KM = 6371;
const EARTH_CIRCUMFERENCE_KM = 40075;

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate distance between two locations
 */
export function distanceBetweenLocations(
  loc1: TripLocation,
  loc2: TripLocation
): number {
  return calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
}

/**
 * Calculate total distance for a trip with multiple locations
 */
export function calculateTripDistance(locations: TripLocation[]): number {
  if (locations.length < 2) return 0;

  // Sort by order
  const sorted = [...locations].sort((a, b) => a.order - b.order);

  let total = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    total += distanceBetweenLocations(sorted[i], sorted[i + 1]);
  }

  return total;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km >= 10000) {
    return `${(km / 1000).toFixed(0)}k km`;
  } else if (km >= 1000) {
    return `${(km / 1000).toFixed(1)}k km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Calculate how many times around Earth
 */
export function calculateEarthCircumferences(totalKm: number): number {
  return totalKm / EARTH_CIRCUMFERENCE_KM;
}

/**
 * Get center point of multiple locations
 */
export function getCenterPoint(locations: TripLocation[]): { lat: number; lng: number } {
  if (locations.length === 0) {
    return { lat: 25, lng: 100 }; // Default: Asia region
  }

  const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
  const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0);

  return {
    lat: sumLat / locations.length,
    lng: sumLng / locations.length,
  };
}

/**
 * Get bounding box for locations
 */
export function getBoundingBox(locations: TripLocation[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  if (locations.length === 0) {
    return { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 };
  }

  return {
    minLat: Math.min(...locations.map(l => l.lat)),
    maxLat: Math.max(...locations.map(l => l.lat)),
    minLng: Math.min(...locations.map(l => l.lng)),
    maxLng: Math.max(...locations.map(l => l.lng)),
  };
}
