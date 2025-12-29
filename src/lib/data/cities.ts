import type { TripLocation } from '$lib/types/traveler';

/**
 * City database for geocoding
 * Subset of cities for demo - in production would use API
 */
export interface CityData {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  region?: string;
  timezone: string;
  nearestAirport?: string;
}

export const CITIES: Record<string, CityData> = {
  // ============================================
  // SLOVAKIA
  // ============================================
  'kosice-sk': {
    city: 'Košice',
    country: 'Slovakia',
    countryCode: 'SK',
    lat: 48.7164,
    lng: 21.2611,
    timezone: 'Europe/Bratislava',
    nearestAirport: 'KSC',
  },
  'strbske-pleso-sk': {
    city: 'Štrbské Pleso',
    country: 'Slovakia',
    countryCode: 'SK',
    lat: 49.1186,
    lng: 20.0631,
    region: 'High Tatras',
    timezone: 'Europe/Bratislava',
    nearestAirport: 'TAT',
  },
  'bratislava-sk': {
    city: 'Bratislava',
    country: 'Slovakia',
    countryCode: 'SK',
    lat: 48.1486,
    lng: 17.1077,
    timezone: 'Europe/Bratislava',
    nearestAirport: 'BTS',
  },

  // ============================================
  // AUSTRIA
  // ============================================
  'vienna-at': {
    city: 'Vienna',
    country: 'Austria',
    countryCode: 'AT',
    lat: 48.2082,
    lng: 16.3738,
    timezone: 'Europe/Vienna',
    nearestAirport: 'VIE',
  },

  // ============================================
  // ITALY
  // ============================================
  'rome-it': {
    city: 'Rome',
    country: 'Italy',
    countryCode: 'IT',
    lat: 41.9028,
    lng: 12.4964,
    timezone: 'Europe/Rome',
    nearestAirport: 'FCO',
  },
  'gubbio-it': {
    city: 'Gubbio',
    country: 'Italy',
    countryCode: 'IT',
    lat: 43.3514,
    lng: 12.5764,
    region: 'Umbria',
    timezone: 'Europe/Rome',
    nearestAirport: 'PEG',
  },
  'milan-it': {
    city: 'Milan',
    country: 'Italy',
    countryCode: 'IT',
    lat: 45.4642,
    lng: 9.19,
    timezone: 'Europe/Rome',
    nearestAirport: 'MXP',
  },

  // ============================================
  // HONG KONG
  // ============================================
  'hong-kong-hk': {
    city: 'Hong Kong',
    country: 'Hong Kong',
    countryCode: 'HK',
    lat: 22.3193,
    lng: 114.1694,
    timezone: 'Asia/Hong_Kong',
    nearestAirport: 'HKG',
  },

  // ============================================
  // VIETNAM
  // ============================================
  'da-nang-vn': {
    city: 'Da Nang',
    country: 'Vietnam',
    countryCode: 'VN',
    lat: 16.0544,
    lng: 108.2022,
    timezone: 'Asia/Ho_Chi_Minh',
    nearestAirport: 'DAD',
  },

  // ============================================
  // CHINA
  // ============================================
  'ningbo-cn': {
    city: 'Ningbo',
    country: 'China',
    countryCode: 'CN',
    lat: 29.8683,
    lng: 121.544,
    region: 'Zhejiang',
    timezone: 'Asia/Shanghai',
    nearestAirport: 'NGB',
  },
  'beijing-cn': {
    city: 'Beijing',
    country: 'China',
    countryCode: 'CN',
    lat: 39.9042,
    lng: 116.4074,
    timezone: 'Asia/Shanghai',
    nearestAirport: 'PEK',
  },

  // ============================================
  // SWITZERLAND
  // ============================================
  'lausanne-ch': {
    city: 'Lausanne',
    country: 'Switzerland',
    countryCode: 'CH',
    lat: 46.5197,
    lng: 6.6323,
    region: 'Vaud',
    timezone: 'Europe/Zurich',
    nearestAirport: 'GVA',
  },
  'geneva-ch': {
    city: 'Geneva',
    country: 'Switzerland',
    countryCode: 'CH',
    lat: 46.2044,
    lng: 6.1432,
    timezone: 'Europe/Zurich',
    nearestAirport: 'GVA',
  },
  'zurich-ch': {
    city: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    lat: 47.3769,
    lng: 8.5417,
    timezone: 'Europe/Zurich',
    nearestAirport: 'ZRH',
  },

  // ============================================
  // POLAND
  // ============================================
  'gdynia-pl': {
    city: 'Gdynia',
    country: 'Poland',
    countryCode: 'PL',
    lat: 54.5189,
    lng: 18.5305,
    region: 'Pomerania',
    timezone: 'Europe/Warsaw',
    nearestAirport: 'GDN',
  },
  'warsaw-pl': {
    city: 'Warsaw',
    country: 'Poland',
    countryCode: 'PL',
    lat: 52.2297,
    lng: 21.0122,
    timezone: 'Europe/Warsaw',
    nearestAirport: 'WAW',
  },

  // ============================================
  // GERMANY
  // ============================================
  'berlin-de': {
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    lat: 52.52,
    lng: 13.405,
    timezone: 'Europe/Berlin',
    nearestAirport: 'BER',
  },

  // ============================================
  // LITHUANIA
  // ============================================
  'vilnius-lt': {
    city: 'Vilnius',
    country: 'Lithuania',
    countryCode: 'LT',
    lat: 54.6872,
    lng: 25.2797,
    timezone: 'Europe/Vilnius',
    nearestAirport: 'VNO',
  },
  'kaunas-lt': {
    city: 'Kaunas',
    country: 'Lithuania',
    countryCode: 'LT',
    lat: 54.8985,
    lng: 23.9036,
    timezone: 'Europe/Vilnius',
    nearestAirport: 'KUN',
  },
  'rukliai-lt': {
    city: 'Rukliai',
    country: 'Lithuania',
    countryCode: 'LT',
    lat: 55.2833,
    lng: 24.05,
    timezone: 'Europe/Vilnius',
    nearestAirport: 'KUN',
  },

  // ============================================
  // AUSTRALIA
  // ============================================
  'brisbane-au': {
    city: 'Brisbane',
    country: 'Australia',
    countryCode: 'AU',
    lat: -27.4698,
    lng: 153.0251,
    region: 'Queensland',
    timezone: 'Australia/Brisbane',
    nearestAirport: 'BNE',
  },
  'sydney-au': {
    city: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    lat: -33.8688,
    lng: 151.2093,
    region: 'New South Wales',
    timezone: 'Australia/Sydney',
    nearestAirport: 'SYD',
  },
  'melbourne-au': {
    city: 'Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    lat: -37.8136,
    lng: 144.9631,
    region: 'Victoria',
    timezone: 'Australia/Melbourne',
    nearestAirport: 'MEL',
  },
};

/**
 * Search cities by query
 */
export function searchCities(query: string): CityData[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return Object.values(CITIES).filter(city =>
    city.city.toLowerCase().includes(q) ||
    city.country.toLowerCase().includes(q) ||
    city.countryCode.toLowerCase() === q
  );
}

/**
 * Get city by key
 */
export function getCity(key: string): CityData | undefined {
  return CITIES[key.toLowerCase()];
}

/**
 * Create a city key from city name and country code
 */
export function createCityKey(city: string, countryCode: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${countryCode.toLowerCase()}`;
}

/**
 * Convert CityData to TripLocation
 */
export function cityToLocation(city: CityData, order: number = 1): TripLocation {
  return {
    city: city.city,
    country: city.country,
    countryCode: city.countryCode,
    lat: city.lat,
    lng: city.lng,
    region: city.region,
    timezone: city.timezone,
    nearestAirport: city.nearestAirport,
    order,
  };
}

/**
 * Get location by city name (fuzzy match)
 */
export function getLocationByCity(cityName: string, countryCode?: string): TripLocation | null {
  const matches = searchCities(cityName);

  if (matches.length === 0) return null;

  // If country code provided, filter by it
  if (countryCode) {
    const exact = matches.find(m => m.countryCode.toLowerCase() === countryCode.toLowerCase());
    if (exact) return cityToLocation(exact);
  }

  // Return first match
  return cityToLocation(matches[0]);
}
