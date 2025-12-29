import type {
  TripNode,
  TripLocation,
  TravelStats,
  GlobeArc,
  GlobeMarker,
  TripCategory,
  ArcColorScheme,
} from '$lib/types/traveler';
import { ARC_COLORS, isJourney, isDestination } from '$lib/types/traveler';
import { calculateTripDistance, distanceBetweenLocations } from './geo';
import { generateId, nowISO } from '$lib/types/common';

/**
 * Calculate duration in days between two dates
 */
export function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Create a TripNode from basic data
 */
export function createTrip(
  label: string,
  startDate: string,
  endDate: string,
  locations: TripLocation[],
  category?: TripCategory
): TripNode {
  const durationDays = calculateDuration(startDate, endDate);
  const distanceKm = calculateTripDistance(locations);

  return {
    id: generateId(),
    type: 'trip',
    label,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    sourceMode: 'traveler',
    metadata: {
      startDate,
      endDate,
      category,
      locations,
      durationDays,
      distanceKm,
    },
  };
}

/**
 * Sort trips chronologically
 */
export function sortTripsByDate(trips: TripNode[]): TripNode[] {
  return [...trips].sort((a, b) =>
    new Date(a.metadata.startDate).getTime() - new Date(b.metadata.startDate).getTime()
  );
}

/**
 * Calculate comprehensive travel statistics
 */
export function calculateTravelStats(trips: TripNode[]): TravelStats {
  if (trips.length === 0) {
    return {
      totalTrips: 0,
      totalDays: 0,
      totalDistanceKm: 0,
      countriesVisited: [],
      citiesVisited: [],
      uniqueCountries: 0,
      uniqueCities: 0,
      mostVisitedCountry: null,
      mostVisitedCity: null,
      longestTrip: null,
      shortestTrip: null,
      tripsByMonth: {},
      tripsByCategory: {
        leisure: 0,
        business: 0,
        family: 0,
        nomad: 0,
        adventure: 0,
      },
      averageTripLength: 0,
    };
  }

  const countriesSet = new Set<string>();
  const citiesSet = new Set<string>();
  const countryDays = new Map<string, { country: string; countryCode: string; days: number }>();
  const cityVisits = new Map<string, number>();
  const tripsByMonth: Record<string, number> = {};
  const tripsByCategory: Record<TripCategory, number> = {
    leisure: 0,
    business: 0,
    family: 0,
    nomad: 0,
    adventure: 0,
  };

  let totalDays = 0;
  let totalDistanceKm = 0;
  let longestTrip: { label: string; days: number } | null = null;
  let shortestTrip: { label: string; days: number } | null = null;

  for (const trip of trips) {
    const { metadata } = trip;
    const days = metadata.durationDays ?? calculateDuration(metadata.startDate, metadata.endDate);

    totalDays += days;
    totalDistanceKm += metadata.distanceKm ?? calculateTripDistance(metadata.locations);

    // Longest/shortest
    if (!longestTrip || days > longestTrip.days) {
      longestTrip = { label: trip.label, days };
    }
    if (!shortestTrip || days < shortestTrip.days) {
      shortestTrip = { label: trip.label, days };
    }

    // Countries and cities
    for (const loc of metadata.locations) {
      countriesSet.add(loc.countryCode);
      citiesSet.add(loc.city);

      // Country days (attribute days to first country in trip for simplicity)
      const countryKey = loc.countryCode;
      const existing = countryDays.get(countryKey);
      if (existing) {
        existing.days += days / metadata.locations.length;
      } else {
        countryDays.set(countryKey, {
          country: loc.country,
          countryCode: loc.countryCode,
          days: days / metadata.locations.length
        });
      }

      // City visits
      cityVisits.set(loc.city, (cityVisits.get(loc.city) || 0) + 1);
    }

    // Trips by month
    const month = metadata.startDate.substring(0, 7); // "2025-01"
    tripsByMonth[month] = (tripsByMonth[month] || 0) + 1;

    // Trips by category
    if (metadata.category) {
      tripsByCategory[metadata.category]++;
    }
  }

  // Find most visited country
  let mostVisitedCountry: { country: string; countryCode: string; days: number } | null = null;
  countryDays.forEach(data => {
    if (!mostVisitedCountry || data.days > mostVisitedCountry.days) {
      mostVisitedCountry = data;
    }
  });

  // Find most visited city
  let mostVisitedCity: { city: string; visits: number } | null = null;
  cityVisits.forEach((visits, city) => {
    if (!mostVisitedCity || visits > mostVisitedCity.visits) {
      mostVisitedCity = { city, visits };
    }
  });

  return {
    totalTrips: trips.length,
    totalDays: Math.round(totalDays),
    totalDistanceKm: Math.round(totalDistanceKm),
    countriesVisited: Array.from(countriesSet),
    citiesVisited: Array.from(citiesSet),
    uniqueCountries: countriesSet.size,
    uniqueCities: citiesSet.size,
    mostVisitedCountry,
    mostVisitedCity,
    longestTrip,
    shortestTrip,
    tripsByMonth,
    tripsByCategory,
    averageTripLength: Math.round(totalDays / trips.length),
  };
}

/**
 * Convert trips to globe arcs
 * Creates arcs between consecutive trip locations
 * Note: Destinations (single-location entries) only contribute to
 * travel arcs (from previous location), not internal route arcs
 */
export function tripsToArcs(
  trips: TripNode[],
  colorScheme: ArcColorScheme = 'cosmic',
  homeBase?: TripLocation
): GlobeArc[] {
  const arcs: GlobeArc[] = [];
  const sortedTrips = sortTripsByDate(trips);
  const colors = ARC_COLORS[colorScheme];

  let previousLocation: TripLocation | null = homeBase ?? null;

  for (let i = 0; i < sortedTrips.length; i++) {
    const trip = sortedTrips[i];
    const locations = [...trip.metadata.locations].sort((a, b) => a.order - b.order);

    if (locations.length === 0) continue;

    // Arc from previous location to first location of this trip
    // This creates the "travel between trips" arc
    if (previousLocation) {
      const firstLoc = locations[0];
      // Only create arc if it's a different location
      const isSameLocation =
        previousLocation.lat === firstLoc.lat &&
        previousLocation.lng === firstLoc.lng;

      if (!isSameLocation) {
        const distance = distanceBetweenLocations(previousLocation, firstLoc);

        arcs.push({
          startLat: previousLocation.lat,
          startLng: previousLocation.lng,
          endLat: firstLoc.lat,
          endLng: firstLoc.lng,
          color: colors,
          stroke: 2,
          altitude: Math.min(0.5, Math.max(0.1, distance / 15000)),
          label: `${previousLocation.city} → ${firstLoc.city}`,
          tripId: trip.id,
          dashLength: 0.6,
          dashGap: 0.2,
          dashAnimateTime: 2000 + i * 300,
        });
      }
    }

    // Arcs within the trip (multi-city journeys only)
    // Destinations (single location) don't have internal arcs
    if (isJourney(trip)) {
      for (let j = 0; j < locations.length - 1; j++) {
        const from = locations[j];
        const to = locations[j + 1];
        const distance = distanceBetweenLocations(from, to);

        arcs.push({
          startLat: from.lat,
          startLng: from.lng,
          endLat: to.lat,
          endLng: to.lng,
          color: colors,
          stroke: 1.5,
          altitude: Math.min(0.3, Math.max(0.05, distance / 15000)),
          label: `${from.city} → ${to.city}`,
          tripId: trip.id,
          dashLength: 0.4,
          dashGap: 0.1,
          dashAnimateTime: 1500,
        });
      }
    }

    // Update previous location to last location of this trip
    previousLocation = locations[locations.length - 1];
  }

  return arcs;
}

/**
 * Extract unique markers from all trips
 */
export function tripsToMarkers(trips: TripNode[], homeBase?: TripLocation): GlobeMarker[] {
  const locationMap = new Map<string, { location: TripLocation; visits: number }>();

  for (const trip of trips) {
    for (const loc of trip.metadata.locations) {
      const key = `${loc.lat.toFixed(4)}-${loc.lng.toFixed(4)}`;
      const existing = locationMap.get(key);

      if (existing) {
        existing.visits++;
      } else {
        locationMap.set(key, { location: loc, visits: 1 });
      }
    }
  }

  const markers: GlobeMarker[] = [];

  locationMap.forEach(({ location, visits }) => {
    const isHome = homeBase &&
      location.lat === homeBase.lat &&
      location.lng === homeBase.lng;

    markers.push({
      lat: location.lat,
      lng: location.lng,
      size: Math.min(1, 0.3 + visits * 0.15),
      color: isHome ? '#22c55e' : '#fbbf24',
      label: `${location.city}, ${location.country} (${visits} visits)`,
      visits,
      location,
    });
  });

  return markers;
}

/**
 * Filter trips by year
 */
export function filterTripsByYear(trips: TripNode[], year: number): TripNode[] {
  return trips.filter(trip => {
    const tripYear = new Date(trip.metadata.startDate).getFullYear();
    return tripYear === year;
  });
}

/**
 * Get unique years from trips
 */
export function getUniqueYears(trips: TripNode[]): number[] {
  const years = new Set<number>();

  for (const trip of trips) {
    years.add(new Date(trip.metadata.startDate).getFullYear());
  }

  return Array.from(years).sort((a, b) => b - a); // Most recent first
}
