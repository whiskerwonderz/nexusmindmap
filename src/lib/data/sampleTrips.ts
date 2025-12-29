import type { TripNode, TripLocation } from '$lib/types/traveler';
import { CITIES, cityToLocation } from './cities';
import { calculateDuration } from '$lib/utils/tripUtils';
import { generateId, nowISO } from '$lib/types/common';

/**
 * Helper to create a trip node
 */
function trip(
  label: string,
  startDate: string,
  endDate: string,
  cityKeys: string[],
  category: TripNode['metadata']['category'] = 'nomad'
): TripNode {
  const locations: TripLocation[] = cityKeys.map((key, index) => {
    const city = CITIES[key];
    if (!city) {
      console.warn(`City not found: ${key}`);
      return null;
    }
    return cityToLocation(city, index + 1);
  }).filter((loc): loc is TripLocation => loc !== null);

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
      durationDays: calculateDuration(startDate, endDate),
    },
  };
}

/**
 * Crystal's 2025 Travel Data
 * 21 trip segments across 12 countries
 */
export const SAMPLE_TRIPS_2025: TripNode[] = [
  // 1. Slovakia Winter (Dec 31 - Jan 10)
  trip(
    'Slovakia Winter',
    '2024-12-31',
    '2025-01-10',
    ['kosice-sk', 'strbske-pleso-sk', 'bratislava-sk'],
    'leisure'
  ),

  // 2. Vienna Stopover (Jan 10-12)
  trip(
    'Vienna Stopover',
    '2025-01-10',
    '2025-01-12',
    ['vienna-at'],
    'leisure'
  ),

  // 3. Italy (Jan 12-27)
  trip(
    'Italy Winter',
    '2025-01-12',
    '2025-01-27',
    ['rome-it', 'gubbio-it', 'milan-it'],
    'leisure'
  ),

  // 4. Hong Kong (Jan 28 - Feb 9)
  trip(
    'Hong Kong Return',
    '2025-01-28',
    '2025-02-09',
    ['hong-kong-hk'],
    'nomad'
  ),

  // 5. Da Nang (Feb 10-15)
  trip(
    'Da Nang Beach',
    '2025-02-10',
    '2025-02-15',
    ['da-nang-vn'],
    'leisure'
  ),

  // 6. Hong Kong (Feb 15 - Mar 17)
  trip(
    'Hong Kong Base',
    '2025-02-15',
    '2025-03-17',
    ['hong-kong-hk'],
    'nomad'
  ),

  // 7. Ningbo (Mar 17-20)
  trip(
    'Ningbo Visit',
    '2025-03-17',
    '2025-03-20',
    ['ningbo-cn'],
    'family'
  ),

  // 8. Hong Kong (Mar 20 - May 13)
  trip(
    'Hong Kong Extended',
    '2025-03-20',
    '2025-05-13',
    ['hong-kong-hk'],
    'nomad'
  ),

  // 9. Switzerland (May 14-18)
  trip(
    'Swiss Alps',
    '2025-05-14',
    '2025-05-18',
    ['lausanne-ch', 'geneva-ch'],
    'business'
  ),

  // 10. Poland - Gdynia (May 18 - Jun 3)
  trip(
    'Gdynia Spring',
    '2025-05-18',
    '2025-06-03',
    ['gdynia-pl'],
    'nomad'
  ),

  // 11. Zurich Stopover (Jun 3-4)
  trip(
    'Zurich Transit',
    '2025-06-03',
    '2025-06-04',
    ['zurich-ch'],
    'business'
  ),

  // 12. Poland - Gdynia (Jun 4-10)
  trip(
    'Gdynia Return',
    '2025-06-04',
    '2025-06-10',
    ['gdynia-pl'],
    'nomad'
  ),

  // 13. Berlin (Jun 10-12)
  trip(
    'Berlin Weekend',
    '2025-06-10',
    '2025-06-12',
    ['berlin-de'],
    'leisure'
  ),

  // 14. Poland - Gdynia (Jun 12-22)
  trip(
    'Gdynia Summer',
    '2025-06-12',
    '2025-06-22',
    ['gdynia-pl'],
    'nomad'
  ),

  // 15. Warsaw (Jun 23 - Jul 22)
  trip(
    'Warsaw Month',
    '2025-06-23',
    '2025-07-22',
    ['warsaw-pl'],
    'nomad'
  ),

  // 16. Lithuania (Jul 22-31)
  trip(
    'Baltic Road Trip',
    '2025-07-22',
    '2025-07-31',
    ['vilnius-lt', 'kaunas-lt', 'rukliai-lt'],
    'adventure'
  ),

  // 17. Australia (Jul 31 - Sep 7)
  trip(
    'Australia Winter',
    '2025-07-31',
    '2025-09-07',
    ['brisbane-au', 'sydney-au', 'melbourne-au'],
    'adventure'
  ),

  // 18. Hong Kong (Sep 7 - Oct 15)
  trip(
    'Hong Kong Autumn',
    '2025-09-07',
    '2025-10-15',
    ['hong-kong-hk'],
    'nomad'
  ),

  // 19. Beijing (Oct 15-19)
  trip(
    'Beijing Visit',
    '2025-10-15',
    '2025-10-19',
    ['beijing-cn'],
    'business'
  ),

  // 20. Hong Kong (Oct 19 - Nov 17)
  trip(
    'Hong Kong Late Autumn',
    '2025-10-19',
    '2025-11-17',
    ['hong-kong-hk'],
    'nomad'
  ),

  // 21. Poland - Gdynia (Nov 18 - Dec 31)
  trip(
    'Gdynia Winter',
    '2025-11-18',
    '2025-12-31',
    ['gdynia-pl'],
    'nomad'
  ),
];

/**
 * Home base location
 */
export const HOME_BASE: TripLocation = cityToLocation(CITIES['hong-kong-hk'], 0);

/**
 * Get sample travel data with all computed fields
 */
export function getSampleTravelData() {
  return {
    trips: SAMPLE_TRIPS_2025,
    homeBase: HOME_BASE,
  };
}
