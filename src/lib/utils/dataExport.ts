import type { TripNode, TripLocation, TripCategory } from '$lib/types/traveler';
import type { GraphData } from '$lib/types';
import { searchCitiesGlobal, resultToLocation } from './citySearch';
import { nowISO } from '$lib/types/common';
import { calculateDuration } from './tripUtils';

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

// ============================================
// BUILDER MODE CSV EXPORT/IMPORT
// ============================================

import type { GraphNode, GraphEdge } from '$lib/types';

/**
 * Export builder nodes to CSV file
 */
export function exportNodesToCSV(nodes: GraphNode[], edges: GraphEdge[]): void {
  const headers = [
    'Label',
    'Type',
    'Description',
    'Date',
    'URL',
    'Connections',
  ];

  const rows = nodes.map(node => {
    // Find connections for this node
    const connections = edges
      .filter(e => e.from === node.id || e.to === node.id)
      .map(e => {
        const otherId = e.from === node.id ? e.to : e.from;
        const otherNode = nodes.find(n => n.id === otherId);
        return otherNode?.label || otherId;
      })
      .join('; ');

    return [
      escapeCSV(node.label),
      node.type,
      escapeCSV(node.description ?? ''),
      node.date ?? '',
      node.url ?? '',
      escapeCSV(connections),
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const filename = `nexusmind-nodes-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Import builder nodes from CSV file
 * Expected CSV format:
 * Label, Type, Description, Date, URL, Connections
 */
export async function importNodesFromCSV(file: File): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('CSV file must have a header row and at least one data row');
        }

        // Parse header to determine column indices
        const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

        // Find column indices (flexible matching)
        const findColumn = (patterns: string[]): number => {
          return header.findIndex(h =>
            patterns.some(p => h.includes(p.toLowerCase()))
          );
        };

        const labelCol = findColumn(['label', 'name', 'title']);
        const typeCol = findColumn(['type', 'node type', 'category']);
        const descriptionCol = findColumn(['description', 'desc', 'notes']);
        const dateCol = findColumn(['date', 'created']);
        const urlCol = findColumn(['url', 'link']);
        const connectionsCol = findColumn(['connections', 'links', 'related']);

        if (labelCol === -1) {
          throw new Error('CSV must have a "Label" or "Name" column');
        }

        const validTypes = ['goal', 'skill', 'project', 'source', 'cert', 'concept'];
        const nodes: GraphNode[] = [];
        const edgePairs: Array<{ from: string; toLabel: string }> = [];

        // First pass: create nodes
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);

          const label = row[labelCol];
          if (!label || label.trim() === '') continue;

          // Parse type
          let nodeType = typeCol !== -1 ? row[typeCol]?.toLowerCase().trim() : 'concept';
          if (!validTypes.includes(nodeType)) {
            nodeType = 'concept'; // Default to concept if invalid type
          }

          const nodeId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          // Get center coordinates for positioning
          const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
          const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
          const angle = (i / lines.length) * Math.PI * 2;
          const radius = 100 + Math.random() * 80;

          const node: GraphNode = {
            id: nodeId,
            label: label.trim(),
            type: nodeType as GraphNode['type'],
            description: descriptionCol !== -1 ? row[descriptionCol]?.trim() || undefined : undefined,
            date: dateCol !== -1 ? row[dateCol]?.trim() || undefined : undefined,
            url: urlCol !== -1 ? row[urlCol]?.trim() || undefined : undefined,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
          };

          nodes.push(node);

          // Parse connections for later
          if (connectionsCol !== -1 && row[connectionsCol]) {
            const connectionLabels = row[connectionsCol]
              .split(/[;,]/)
              .map(s => s.trim())
              .filter(s => s.length > 0);

            for (const toLabel of connectionLabels) {
              edgePairs.push({ from: nodeId, toLabel });
            }
          }
        }

        if (nodes.length === 0) {
          throw new Error('No valid nodes found in CSV file');
        }

        // Second pass: create edges based on connection labels
        const edges: GraphEdge[] = [];
        for (const { from, toLabel } of edgePairs) {
          const toNode = nodes.find(n => n.label.toLowerCase() === toLabel.toLowerCase());
          if (toNode && from !== toNode.id) {
            // Check if edge already exists
            const exists = edges.some(
              e => (e.from === from && e.to === toNode.id) || (e.from === toNode.id && e.to === from)
            );
            if (!exists) {
              edges.push({
                id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                from,
                to: toNode.id,
              });
            }
          }
        }

        resolve({ nodes, edges });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse CSV'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// ============================================
// CSV IMPORT
// ============================================

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Parse locations string (e.g., "Paris → Rome → Barcelona")
 * Returns TripLocation[] with coordinates looked up
 */
function parseLocationsString(locationsStr: string): TripLocation[] {
  if (!locationsStr || locationsStr.trim() === '') return [];

  // Split by arrow separator (with various formats)
  const cityNames = locationsStr
    .split(/\s*[→➔>]\s*|,\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const locations: TripLocation[] = [];

  for (let i = 0; i < cityNames.length; i++) {
    const cityName = cityNames[i];

    // Search for the city to get coordinates
    const results = searchCitiesGlobal(cityName, 1);

    if (results.length > 0) {
      locations.push(resultToLocation(results[0], i + 1));
    } else {
      // If city not found, create a placeholder with 0,0 coordinates
      // This allows the import to proceed but the location won't display correctly
      locations.push({
        city: cityName,
        country: 'Unknown',
        countryCode: 'XX',
        lat: 0,
        lng: 0,
        order: i + 1,
      });
    }
  }

  return locations;
}

/**
 * Parse category string to TripCategory
 */
function parseCategory(categoryStr: string): TripCategory | undefined {
  const normalized = categoryStr.toLowerCase().trim();
  const validCategories: TripCategory[] = ['leisure', 'business', 'family', 'nomad', 'adventure'];

  if (validCategories.includes(normalized as TripCategory)) {
    return normalized as TripCategory;
  }

  return undefined;
}

/**
 * Generate a unique ID for imported trips
 */
function generateTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Import data from CSV file
 * Expected CSV format (matching export):
 * Trip Name, Start Date, End Date, Duration (Days), Locations, Countries, Category, Description
 */
export async function importFromCSV(file: File): Promise<TripNode[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('CSV file must have a header row and at least one data row');
        }

        // Parse header to determine column indices
        const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

        // Find column indices (flexible matching)
        const findColumn = (patterns: string[]): number => {
          return header.findIndex(h =>
            patterns.some(p => h.includes(p.toLowerCase()))
          );
        };

        const nameCol = findColumn(['trip name', 'name', 'title']);
        const startCol = findColumn(['start date', 'start', 'from']);
        const endCol = findColumn(['end date', 'end', 'to']);
        const durationCol = findColumn(['duration', 'days']);
        const locationsCol = findColumn(['locations', 'cities', 'route']);
        const categoryCol = findColumn(['category', 'type']);
        const descriptionCol = findColumn(['description', 'notes', 'memo']);

        if (nameCol === -1) {
          throw new Error('CSV must have a "Trip Name" or "Name" column');
        }

        const trips: TripNode[] = [];
        const now = nowISO();

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);

          const tripName = row[nameCol];
          if (!tripName || tripName.trim() === '') continue;

          // Get or compute dates
          let startDate = startCol !== -1 ? row[startCol]?.trim() : '';
          let endDate = endCol !== -1 ? row[endCol]?.trim() : '';

          // Default to today if no dates
          if (!startDate) {
            startDate = new Date().toISOString().split('T')[0];
          }
          if (!endDate) {
            endDate = startDate;
          }

          // Parse locations
          const locationsStr = locationsCol !== -1 ? row[locationsCol] : '';
          const locations = parseLocationsString(locationsStr);

          // If no locations found, skip this trip
          if (locations.length === 0) {
            console.warn(`Skipping trip "${tripName}" - no valid locations`);
            continue;
          }

          // Parse other fields
          const category = categoryCol !== -1 ? parseCategory(row[categoryCol] || '') : undefined;
          const description = descriptionCol !== -1 ? row[descriptionCol]?.trim() : undefined;

          const trip: TripNode = {
            id: generateTripId(),
            type: 'trip',
            label: tripName.trim(),
            description: description || undefined,
            createdAt: now,
            updatedAt: now,
            sourceMode: 'traveler',
            metadata: {
              startDate,
              endDate,
              locations,
              category,
              durationDays: calculateDuration(startDate, endDate),
            },
          };

          trips.push(trip);
        }

        if (trips.length === 0) {
          throw new Error('No valid trips found in CSV file');
        }

        resolve(trips);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse CSV'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
