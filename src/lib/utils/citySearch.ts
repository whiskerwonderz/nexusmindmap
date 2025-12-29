import { City, Country, type ICity, type ICountry } from 'country-state-city';
import type { TripLocation } from '$lib/types/traveler';

/**
 * Extended city data combining country-state-city with our needs
 */
export interface CitySearchResult {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  stateCode?: string;
}

// Cache for country lookups
const countryCache: Map<string, ICountry> = new Map();

/**
 * Get country by ISO code (cached)
 */
function getCountry(isoCode: string): ICountry | undefined {
  if (!countryCache.has(isoCode)) {
    const country = Country.getCountryByCode(isoCode);
    if (country) countryCache.set(isoCode, country);
  }
  return countryCache.get(isoCode);
}

/**
 * Manual entries for popular cities and places not well-represented in the database
 * These get priority in search results
 */
const MANUAL_CITIES: CitySearchResult[] = [
  // Major world capitals and cities (prioritized)
  { city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522 },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
  { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.0060 },
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503 },
  { city: 'Los Angeles', country: 'United States', countryCode: 'US', lat: 34.0522, lng: -118.2437 },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198 },
  { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708 },
  { city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093 },
  { city: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.7563, lng: 100.5018 },
  { city: 'Seoul', country: 'South Korea', countryCode: 'KR', lat: 37.5665, lng: 126.9780 },
  { city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.3874, lng: 2.1686 },
  { city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', lat: 52.3676, lng: 4.9041 },
  { city: 'Rome', country: 'Italy', countryCode: 'IT', lat: 41.9028, lng: 12.4964 },
  { city: 'Berlin', country: 'Germany', countryCode: 'DE', lat: 52.5200, lng: 13.4050 },
  { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lng: -122.4194 },

  // Hong Kong (no cities in country-state-city)
  { city: 'Hong Kong', country: 'Hong Kong S.A.R.', countryCode: 'HK', lat: 22.3193, lng: 114.1694 },
  { city: 'Kowloon', country: 'Hong Kong S.A.R.', countryCode: 'HK', lat: 22.3282, lng: 114.1875 },
  { city: 'Central', country: 'Hong Kong S.A.R.', countryCode: 'HK', lat: 22.2816, lng: 114.1585 },

  // Macau
  { city: 'Macau', country: 'Macau S.A.R.', countryCode: 'MO', lat: 22.1987, lng: 113.5439 },

  // High Tatras (Slovakia - small resort towns)
  { city: 'Štrbské Pleso', country: 'Slovakia', countryCode: 'SK', lat: 49.1186, lng: 20.0631 },
  { city: 'Tatranská Lomnica', country: 'Slovakia', countryCode: 'SK', lat: 49.1653, lng: 20.2847 },

  // Popular European cities
  { city: 'Prague', country: 'Czech Republic', countryCode: 'CZ', lat: 50.0755, lng: 14.4378 },
  { city: 'Vienna', country: 'Austria', countryCode: 'AT', lat: 48.2082, lng: 16.3738 },
  { city: 'Budapest', country: 'Hungary', countryCode: 'HU', lat: 47.4979, lng: 19.0402 },
  { city: 'Kraków', country: 'Poland', countryCode: 'PL', lat: 50.0647, lng: 19.9450 },
  { city: 'Warsaw', country: 'Poland', countryCode: 'PL', lat: 52.2297, lng: 21.0122 },
  { city: 'Lisbon', country: 'Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393 },
  { city: 'Copenhagen', country: 'Denmark', countryCode: 'DK', lat: 55.6761, lng: 12.5683 },
  { city: 'Stockholm', country: 'Sweden', countryCode: 'SE', lat: 59.3293, lng: 18.0686 },
];

/**
 * Convert ICity to CitySearchResult
 */
function cityToResult(city: ICity): CitySearchResult | null {
  const lat = parseFloat(city.latitude || '');
  const lng = parseFloat(city.longitude || '');

  if (isNaN(lat) || isNaN(lng)) return null;

  const country = getCountry(city.countryCode);

  return {
    city: city.name,
    country: country?.name || city.countryCode,
    countryCode: city.countryCode,
    lat,
    lng,
    stateCode: city.stateCode,
  };
}

/**
 * Normalize string for search (remove diacritics)
 */
function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Search cities by query string
 * Returns up to `limit` results
 */
export function searchCitiesGlobal(query: string, limit: number = 20): CitySearchResult[] {
  const q = query.toLowerCase().trim();
  const qNorm = normalizeString(query);
  if (q.length < 2) return [];

  const results: CitySearchResult[] = [];
  const seen = new Set<string>();

  // First, check manual cities (higher priority for special locations)
  for (const city of MANUAL_CITIES) {
    const cityNorm = normalizeString(city.city);
    const countryNorm = normalizeString(city.country);
    if (cityNorm.includes(qNorm) || countryNorm.includes(qNorm)) {
      const key = `${city.city}-${city.countryCode}`;
      if (!seen.has(key)) {
        results.push(city);
        seen.add(key);
      }
    }
  }

  // Then search the main database
  const allCities = City.getAllCities();

  // Score and filter cities
  const scored: { city: ICity; score: number }[] = [];

  for (const city of allCities) {
    const nameLower = city.name.toLowerCase();
    const nameNorm = normalizeString(city.name);
    const country = getCountry(city.countryCode);
    const countryLower = country?.name.toLowerCase() || '';

    let score = 0;

    // Exact match (with diacritics) gets highest score
    if (nameLower === q || nameNorm === qNorm) {
      score = 200;
    }
    // Exact match at start gets high score
    else if (nameLower.startsWith(q) || nameNorm.startsWith(qNorm)) {
      score = 150;
    }
    // Contains query
    else if (nameLower.includes(q) || nameNorm.includes(qNorm)) {
      score = 75;
    }
    // Country match
    else if (countryLower.includes(q)) {
      score = 25;
    }

    // Boost capital cities and well-known places
    // Shorter names are often more well-known (Kraków vs Krakauhintermühlen)
    if (score > 0 && city.name.length <= 12) {
      score += 20;
    }

    if (score > 0) {
      scored.push({ city, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Convert to results
  for (const { city } of scored) {
    if (results.length >= limit) break;

    const result = cityToResult(city);
    if (result) {
      const key = `${result.city}-${result.countryCode}`;
      if (!seen.has(key)) {
        results.push(result);
        seen.add(key);
      }
    }
  }

  return results.slice(0, limit);
}

/**
 * Convert search result to TripLocation
 */
export function resultToLocation(result: CitySearchResult, order: number = 1): TripLocation {
  return {
    city: result.city,
    country: result.country,
    countryCode: result.countryCode,
    lat: result.lat,
    lng: result.lng,
    order,
  };
}

/**
 * Get all countries for dropdown
 */
export function getAllCountries(): ICountry[] {
  return Country.getAllCountries();
}
