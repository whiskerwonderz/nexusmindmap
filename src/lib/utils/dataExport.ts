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

// ============================================
// CSV TEMPLATE DOWNLOADS
// ============================================

/**
 * Download CSV template for Builder mode nodes
 */
export function downloadBuilderNodesTemplate(): void {
  const template = `id,type,label,description,date,url,tags
node-1,goal,Learn TypeScript,Master TypeScript for web development,2024-01,https://typescriptlang.org,"programming,typescript"
node-2,skill,JavaScript,Frontend scripting language,2023-06,,web
node-3,project,Portfolio Website,Personal portfolio built with SvelteKit,2024-03,https://myportfolio.com,
node-4,resource,TypeScript Handbook,Official TypeScript documentation,2024-01,https://typescriptlang.org/docs,docs
node-5,concept,Type Safety,Compile-time type checking,,,programming
node-6,note,Meeting Notes,Notes from weekly standup,2024-03-15,,`;

  downloadFile(template, 'nexusmind-nodes-template.csv', 'text/csv');
}

/**
 * Download CSV template for Builder mode edges/connections
 */
export function downloadBuilderEdgesTemplate(): void {
  const template = `source,target,type,label
node-1,node-2,requires,prerequisite
node-2,node-3,enables,builds on
node-4,node-1,teaches,learning resource
node-5,node-2,related,related concept`;

  downloadFile(template, 'nexusmind-edges-template.csv', 'text/csv');
}

/**
 * Download CSV template for Traveler mode trips
 * Note: Multiple rows with same label create multi-stop trips
 */
export function downloadTravelerTripsTemplate(): void {
  const template = `label,startDate,endDate,category,city,country,countryCode,lat,lng,description
Summer Europe Trip,2024-06-15,2024-06-30,leisure,Paris,France,FR,48.8566,2.3522,Two week adventure through Europe
Summer Europe Trip,2024-06-15,2024-06-30,leisure,Rome,Italy,IT,41.9028,12.4964,Two week adventure through Europe
Summer Europe Trip,2024-06-15,2024-06-30,leisure,Barcelona,Spain,ES,41.3851,2.1734,Two week adventure through Europe
Business Conference,2024-08-10,2024-08-12,business,San Francisco,United States,US,37.7749,-122.4194,Annual tech conference
Tokyo Adventure,2024-09-01,2024-09-14,adventure,Tokyo,Japan,JP,35.6762,139.6503,Exploring Japanese culture
Family Reunion,2024-07-20,2024-07-25,family,Denver,United States,US,39.7392,-104.9903,Annual family gathering
Digital Nomad Month,2024-10-01,2024-10-31,nomad,Lisbon,Portugal,PT,38.7223,-9.1393,Working remotely from Portugal`;

  downloadFile(template, 'nexusmind-trips-template.csv', 'text/csv');
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

// ============================================
// SHAREABLE HTML EXPORTS
// ============================================

/**
 * Export trips as a standalone shareable HTML map
 */
export function exportShareableMap(trips: TripNode[], title: string = 'My Travel Map'): void {
  const html = generateShareableMapHTML(trips, title);
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
  downloadFile(html, filename, 'text/html');
}

/**
 * Generate standalone HTML for travel map
 */
function generateShareableMapHTML(trips: TripNode[], title: string): string {
  // Collect all locations
  const allLocations = trips.flatMap(trip =>
    trip.metadata?.locations?.map(loc => ({
      ...loc,
      tripLabel: trip.label,
      tripId: trip.id,
    })) || []
  );

  // Calculate center point
  const avgLat = allLocations.reduce((sum, loc) => sum + loc.lat, 0) / (allLocations.length || 1);
  const avgLng = allLocations.reduce((sum, loc) => sum + loc.lng, 0) / (allLocations.length || 1);

  // Trip colors
  const tripColors = ['#22d3ee', '#f472b6', '#a78bfa', '#4ade80', '#fbbf24', '#fb923c', '#60a5fa', '#e879f9'];
  const getTripColor = (i: number) => tripColors[i % tripColors.length];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.js"><\/script>
  <link href="https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0f; }
    #map { width: 100vw; height: 100vh; }
    .header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      background: linear-gradient(to bottom, rgba(10, 10, 15, 0.9), transparent);
      z-index: 10;
    }
    .header h1 { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .header p { font-size: 14px; color: rgba(255, 255, 255, 0.6); }
    .legend {
      position: absolute;
      bottom: 24px;
      left: 24px;
      background: rgba(20, 20, 25, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      max-width: 280px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 10;
    }
    .legend h3 {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .legend-item:last-child { border-bottom: none; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-text { font-size: 13px; color: rgba(255, 255, 255, 0.8); }
    .maplibregl-popup-content {
      background: rgba(20, 20, 25, 0.95) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
      padding: 12px !important;
      color: #fff !important;
    }
    .maplibregl-popup-tip { border-top-color: rgba(20, 20, 25, 0.95) !important; }
    .popup-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .popup-trip { font-size: 12px; color: rgba(255, 255, 255, 0.6); }
    .branding {
      position: absolute;
      bottom: 24px;
      right: 24px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      z-index: 10;
    }
    .branding a { color: rgba(255, 255, 255, 0.6); text-decoration: none; }
    .branding a:hover { color: #22d3ee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <p>${trips.length} trip${trips.length !== 1 ? 's' : ''} · ${allLocations.length} destination${allLocations.length !== 1 ? 's' : ''}</p>
  </div>
  <div id="map"></div>
  <div class="legend">
    <h3>Trips</h3>
    ${trips.map((trip, i) => `<div class="legend-item"><div class="legend-dot" style="background: ${getTripColor(i)}"></div><span class="legend-text">${escapeHtml(trip.label)}</span></div>`).join('')}
  </div>
  <div class="branding">Created with <a href="https://github.com/user/nexusmindmap" target="_blank">NexusMindMap</a></div>
  <script>
    const trips = ${JSON.stringify(trips.map((trip, i) => ({
      label: trip.label,
      color: getTripColor(i),
      locations: trip.metadata?.locations || [],
    })))};
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [${avgLng}, ${avgLat}],
      zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => {
      trips.forEach((trip, tripIndex) => {
        if (trip.locations.length >= 2) {
          map.addSource('route-' + tripIndex, {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trip.locations.map(loc => [loc.lng, loc.lat]) } },
          });
          map.addLayer({
            id: 'route-line-' + tripIndex,
            type: 'line',
            source: 'route-' + tripIndex,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': trip.color, 'line-width': 2, 'line-opacity': 0.7 },
          });
        }
        trip.locations.forEach((loc) => {
          const el = document.createElement('div');
          el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:' + trip.color + ';border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer';
          new maplibregl.Marker(el)
            .setLngLat([loc.lng, loc.lat])
            .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML('<div class="popup-title">' + loc.city + ', ' + loc.country + '</div><div class="popup-trip">' + trip.label + '</div>'))
            .addTo(map);
        });
      });
      const allCoords = trips.flatMap(t => t.locations.map(l => [l.lng, l.lat]));
      if (allCoords.length > 1) {
        const bounds = allCoords.reduce((b, coord) => b.extend(coord), new maplibregl.LngLatBounds(allCoords[0], allCoords[0]));
        map.fitBounds(bounds, { padding: 60 });
      }
    });
  <\/script>
</body>
</html>`;
}

/**
 * Escape HTML entities for safe embedding
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// BUILDER MODE SHAREABLE GRAPH EXPORT
// ============================================

/**
 * Export builder graph as a standalone shareable HTML file
 */
export function exportShareableGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  title: string = 'My Knowledge Graph',
  nodeTypeLabels: Record<string, string> = {},
  layout: string = 'physics'
): void {
  const html = generateShareableGraphHTML(nodes, edges, title, nodeTypeLabels, layout);
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
  downloadFile(html, filename, 'text/html');
}

/**
 * Generate standalone HTML for knowledge graph
 */
function generateShareableGraphHTML(
  nodes: GraphNode[],
  edges: GraphEdge[],
  title: string,
  nodeTypeLabels: Record<string, string>,
  layout: string
): string {
  // Node type colors (matching the app theme)
  const nodeColors: Record<string, string> = {
    goal: '#22c55e',
    skill: '#ec4899',
    project: '#06b6d4',
    source: '#a855f7',
    cert: '#f59e0b',
    concept: '#64748b',
  };

  // Default labels
  const defaultLabels: Record<string, string> = {
    goal: 'Goals',
    skill: 'Skills',
    project: 'Projects',
    source: 'Sources',
    cert: 'Milestones',
    concept: 'Concepts',
  };

  // Merge custom labels with defaults
  const labels = { ...defaultLabels, ...nodeTypeLabels };

  // Get unique node types present in the graph
  const presentTypes = [...new Set(nodes.map(n => n.type))];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://unpkg.com/d3@7.8.5/dist/d3.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
      overflow: hidden;
    }
    #graph { width: 100vw; height: 100vh; }
    .header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      background: linear-gradient(to bottom, rgba(10, 10, 15, 0.95), transparent);
      z-index: 10;
      pointer-events: none;
    }
    .header h1 { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .header p { font-size: 14px; color: rgba(255, 255, 255, 0.6); }
    .legend {
      position: absolute;
      top: 80px;
      left: 24px;
      background: rgba(20, 20, 25, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      z-index: 10;
    }
    .legend h3 {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-text {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }
    .legend-count {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      margin-left: auto;
    }
    .tooltip {
      position: absolute;
      background: rgba(20, 20, 25, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 12px 16px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 100;
      max-width: 280px;
    }
    .tooltip.visible { opacity: 1; }
    .tooltip-label { font-weight: 600; font-size: 14px; color: #fff; margin-bottom: 4px; }
    .tooltip-type { font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
    .tooltip-desc { font-size: 12px; color: rgba(255, 255, 255, 0.7); line-height: 1.4; }
    .controls {
      position: absolute;
      bottom: 24px;
      left: 24px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    .control-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 8px 16px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .control-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
    .branding {
      position: absolute;
      bottom: 24px;
      right: 24px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      z-index: 10;
    }
    .branding a { color: rgba(255, 255, 255, 0.6); text-decoration: none; }
    .branding a:hover { color: #22d3ee; }
    .node { cursor: pointer; }
    .node circle { transition: r 0.15s, filter 0.15s; }
    .node:hover circle { filter: brightness(1.2); }
    .node text {
      fill: rgba(255, 255, 255, 0.9);
      font-size: 11px;
      text-anchor: middle;
      pointer-events: none;
    }
    .link {
      stroke: rgba(255, 255, 255, 0.15);
      stroke-width: 1;
    }
    .link.highlighted {
      stroke: rgba(255, 255, 255, 0.5);
      stroke-width: 2;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <p>${nodes.length} node${nodes.length !== 1 ? 's' : ''} · ${edges.length} connection${edges.length !== 1 ? 's' : ''}</p>
  </div>
  <div class="legend">
    <h3>Node Types</h3>
    ${presentTypes.map(type => {
      const count = nodes.filter(n => n.type === type).length;
      return `<div class="legend-item">
        <div class="legend-dot" style="background: ${nodeColors[type] || '#64748b'}"></div>
        <span class="legend-text">${escapeHtml(labels[type] || type)}</span>
        <span class="legend-count">${count}</span>
      </div>`;
    }).join('')}
  </div>
  <div class="controls">
    <button class="control-btn" onclick="resetZoom()">Reset View</button>
    <button class="control-btn" onclick="toggleLabels()">Toggle Labels</button>
  </div>
  <div class="branding">Created with <a href="https://github.com/user/nexusmindmap" target="_blank">NexusMindMap</a></div>
  <div class="tooltip"></div>
  <svg id="graph"></svg>

  <script>
    const nodesData = ${JSON.stringify(nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      description: n.description || '',
    })))};

    const linksData = ${JSON.stringify(edges.map(e => ({
      source: e.from,
      target: e.to,
    })))};

    const nodeColors = ${JSON.stringify(nodeColors)};
    const nodeLabels = ${JSON.stringify(labels)};
    const nodeSizes = { goal: 24, skill: 16, project: 14, source: 12, cert: 14, concept: 10 };
    const currentLayout = '${layout}';

    let showLabels = true;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select('#graph')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    // Layout functions
    function applyRadialLayout() {
      const typeOrder = ['goal', 'skill', 'project', 'source', 'cert', 'concept'];
      const nodesByType = {};
      nodesData.forEach(n => {
        if (!nodesByType[n.type]) nodesByType[n.type] = [];
        nodesByType[n.type].push(n);
      });

      let ringIndex = 0;
      typeOrder.forEach(type => {
        const nodes = nodesByType[type] || [];
        if (nodes.length === 0) return;
        const radius = 80 + ringIndex * 100;
        nodes.forEach((n, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          n.x = centerX + Math.cos(angle) * radius;
          n.y = centerY + Math.sin(angle) * radius;
        });
        ringIndex++;
      });
    }

    function applyClusterLayout() {
      const typeOrder = ['goal', 'skill', 'project', 'source', 'cert', 'concept'];
      const nodesByType = {};
      nodesData.forEach(n => {
        if (!nodesByType[n.type]) nodesByType[n.type] = [];
        nodesByType[n.type].push(n);
      });

      const presentTypes = typeOrder.filter(t => nodesByType[t]?.length > 0);
      const cols = Math.ceil(Math.sqrt(presentTypes.length));
      const cellWidth = width / (cols + 1);
      const cellHeight = height / (Math.ceil(presentTypes.length / cols) + 1);

      presentTypes.forEach((type, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const clusterX = cellWidth * (col + 1);
        const clusterY = cellHeight * (row + 1);
        const nodes = nodesByType[type];
        const nodesPerRow = Math.ceil(Math.sqrt(nodes.length));

        nodes.forEach((n, j) => {
          const nodeCol = j % nodesPerRow;
          const nodeRow = Math.floor(j / nodesPerRow);
          const spacing = 50;
          n.x = clusterX + (nodeCol - nodesPerRow / 2) * spacing;
          n.y = clusterY + (nodeRow - nodes.length / nodesPerRow / 2) * spacing;
        });
      });
    }

    function applyHierarchyLayout() {
      const typeOrder = ['goal', 'skill', 'project', 'source', 'cert', 'concept'];
      const nodesByType = {};
      nodesData.forEach(n => {
        if (!nodesByType[n.type]) nodesByType[n.type] = [];
        nodesByType[n.type].push(n);
      });

      const presentTypes = typeOrder.filter(t => nodesByType[t]?.length > 0);
      const levelHeight = height / (presentTypes.length + 1);

      presentTypes.forEach((type, level) => {
        const nodes = nodesByType[type];
        const levelY = levelHeight * (level + 1);
        const spacing = width / (nodes.length + 1);

        nodes.forEach((n, i) => {
          n.x = spacing * (i + 1);
          n.y = levelY;
        });
      });
    }

    function applyPhysicsLayout() {
      const simulation = d3.forceSimulation(nodesData)
        .force('link', d3.forceLink(linksData).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(centerX, centerY))
        .force('collision', d3.forceCollide().radius(d => (nodeSizes[d.type] || 12) + 15));

      simulation.on('tick', updatePositions);
      return simulation;
    }

    // Apply initial layout
    let simulation = null;
    if (currentLayout === 'radial') {
      applyRadialLayout();
    } else if (currentLayout === 'cluster') {
      applyClusterLayout();
    } else if (currentLayout === 'hierarchy') {
      applyHierarchyLayout();
    } else {
      simulation = applyPhysicsLayout();
    }

    // Create link elements
    const link = g.append('g')
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('class', 'link');

    // Create node elements
    const node = g.append('g')
      .selectAll('g')
      .data(nodesData)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => nodeSizes[d.type] || 12)
      .attr('fill', d => nodeColors[d.type] || '#64748b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3);

    const labels = node.append('text')
      .text(d => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label)
      .attr('dy', d => (nodeSizes[d.type] || 12) + 14);

    // Update positions function
    function updatePositions() {
      link
        .attr('x1', d => d.source.x || d.source)
        .attr('y1', d => d.source.y || 0)
        .attr('x2', d => d.target.x || d.target)
        .attr('y2', d => d.target.y || 0);
      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    }

    // For static layouts, update positions immediately
    if (!simulation) {
      // Resolve link references for static layouts
      linksData.forEach(l => {
        if (typeof l.source === 'string') {
          l.source = nodesData.find(n => n.id === l.source) || l.source;
        }
        if (typeof l.target === 'string') {
          l.target = nodesData.find(n => n.id === l.target) || l.target;
        }
      });
      updatePositions();
    }

    // Tooltip
    const tooltip = document.querySelector('.tooltip');

    node.on('mouseenter', (event, d) => {
      tooltip.innerHTML = \`
        <div class="tooltip-label">\${d.label}</div>
        <div class="tooltip-type">\${nodeLabels[d.type] || d.type}</div>
        \${d.description ? '<div class="tooltip-desc">' + d.description + '</div>' : ''}
      \`;
      tooltip.classList.add('visible');
      link.classed('highlighted', l => l.source.id === d.id || l.target.id === d.id);
    })
    .on('mousemove', (event) => {
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY + 15) + 'px';
    })
    .on('mouseleave', () => {
      tooltip.classList.remove('visible');
      link.classed('highlighted', false);
    });

    function dragstarted(event) {
      if (simulation) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
      if (!simulation) updatePositions();
    }

    function dragended(event) {
      if (simulation) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }

    function resetZoom() {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }

    function toggleLabels() {
      showLabels = !showLabels;
      labels.style('opacity', showLabels ? 1 : 0);
    }

    // Initial zoom to fit
    setTimeout(() => {
      const bounds = g.node().getBBox();
      if (bounds.width > 0 && bounds.height > 0) {
        const dx = bounds.width, dy = bounds.height;
        const x = bounds.x + dx / 2, y = bounds.y + dy / 2;
        const scale = Math.min(0.9, 0.9 / Math.max(dx / width, dy / height));
        const translate = [width / 2 - scale * x, height / 2 - scale * y];
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
      }
    }, simulation ? 1500 : 100);
  <\/script>
</body>
</html>`;
}
