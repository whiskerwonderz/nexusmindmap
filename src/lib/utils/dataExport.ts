import type { TripNode } from '$lib/types/traveler';
import type { GraphData } from '$lib/types';

/**
 * Export format version
 */
const EXPORT_VERSION = '1.0';

/**
 * Export data structure
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  type: 'trips' | 'full';
  trips?: TripNode[];
  graphData?: GraphData;
}

/**
 * Download a file with the given content
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export trips to JSON file
 */
export function exportTripsToJSON(trips: TripNode[]): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'trips',
    trips,
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = `nexusmind-trips-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Export trips to CSV file
 */
export function exportTripsToCSV(trips: TripNode[]): void {
  const headers = [
    'Trip Name',
    'Start Date',
    'End Date',
    'Duration (Days)',
    'Locations',
    'Countries',
    'Category',
    'Description',
  ];

  const rows = trips.map(trip => {
    const locations = trip.metadata.locations.map(l => l.city).join(' → ');
    const countries = [...new Set(trip.metadata.locations.map(l => l.country))].join(', ');

    return [
      escapeCSV(trip.label),
      trip.metadata.startDate,
      trip.metadata.endDate,
      trip.metadata.durationDays?.toString() ?? '',
      escapeCSV(locations),
      escapeCSV(countries),
      trip.metadata.category ?? '',
      escapeCSV(trip.description ?? ''),
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const filename = `nexusmind-trips-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export full graph data to JSON
 */
export function exportGraphDataToJSON(data: GraphData): void {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'full',
    graphData: data,
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = `nexusmind-full-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Import data from JSON file
 */
export async function importFromJSON(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // Validate the data structure
        if (!data.version || !data.type) {
          throw new Error('Invalid export file format');
        }

        if (data.type === 'trips' && !Array.isArray(data.trips)) {
          throw new Error('Invalid trips data');
        }

        if (data.type === 'full' && !data.graphData) {
          throw new Error('Invalid graph data');
        }

        resolve(data);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse JSON'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate imported trips
 */
export function validateImportedTrips(trips: unknown[]): TripNode[] {
  return trips.filter((trip): trip is TripNode => {
    if (typeof trip !== 'object' || trip === null) return false;

    const t = trip as Record<string, unknown>;

    // Check required fields
    if (typeof t.id !== 'string') return false;
    if (t.type !== 'trip') return false;
    if (typeof t.label !== 'string') return false;

    // Check metadata
    if (typeof t.metadata !== 'object' || t.metadata === null) return false;

    const meta = t.metadata as Record<string, unknown>;
    if (typeof meta.startDate !== 'string') return false;
    if (typeof meta.endDate !== 'string') return false;
    if (!Array.isArray(meta.locations)) return false;

    return true;
  });
}

/**
 * Generate a shareable link (placeholder for future implementation)
 */
export function generateShareableLink(_trips: TripNode[]): string {
  // In a real implementation, this would:
  // 1. Upload data to a server
  // 2. Return a shareable URL
  // For now, return a placeholder
  console.warn('Shareable links are not yet implemented');
  return '';
}

/**
 * Copy trips data to clipboard as JSON
 */
export async function copyTripsToClipboard(trips: TripNode[]): Promise<void> {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'trips',
    trips,
  };

  const json = JSON.stringify(exportData, null, 2);
  await navigator.clipboard.writeText(json);
}

/**
 * Get trip statistics summary as text
 */
export function getTripStatsSummary(trips: TripNode[]): string {
  const totalDays = trips.reduce((sum, t) => sum + (t.metadata.durationDays ?? 0), 0);
  const countries = new Set(trips.flatMap(t => t.metadata.locations.map(l => l.country)));
  const cities = new Set(trips.flatMap(t => t.metadata.locations.map(l => l.city)));

  return [
    `Total Trips: ${trips.length}`,
    `Total Days: ${totalDays}`,
    `Countries Visited: ${countries.size}`,
    `Cities Visited: ${cities.size}`,
    `Average Trip Length: ${(totalDays / trips.length).toFixed(1)} days`,
  ].join('\n');
}
