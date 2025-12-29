<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import type { GlobeMarker } from '$lib/types/traveler';

  // ============================================
  // PROPS
  // ============================================

  interface Props {
    class?: string;
    onMarkerClick?: (marker: GlobeMarker) => void;
  }

  let { class: className = '', onMarkerClick }: Props = $props();

  // ============================================
  // STATE
  // ============================================

  let container: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let isReady = $state(false);
  let isLoading = $state(true);
  let currentMapStyle = $state<'dark' | 'light' | 'terrain'>('dark');
  let currentPopup: maplibregl.Popup | null = null;

  // ============================================
  // REACTIVE DATA
  // ============================================

  const trips = $derived(travelerStore.filteredTrips);
  const markers = $derived(travelerStore.markers);
  const settings = $derived(travelerStore.settings);
  const displayMode = $derived(travelerStore.displayMode);
  const homeBase = $derived(travelerStore.homeBase);

  // Map style URLs (free, no API key required)
  const MAP_STYLES = {
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    terrain: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  };

  // Route colors based on scheme
  const routeColor = $derived(
    settings.colorScheme === 'cosmic' ? '#00d4ff' :
    settings.colorScheme === 'sunset' ? '#f97316' :
    settings.colorScheme === 'ocean' ? '#0ea5e9' : '#94a3b8'
  );

  const routeGlow = $derived(
    settings.colorScheme === 'cosmic' ? '#a855f7' :
    settings.colorScheme === 'sunset' ? '#ec4899' :
    settings.colorScheme === 'ocean' ? '#14b8a6' : '#64748b'
  );

  // ============================================
  // LIFECYCLE
  // ============================================

  onMount(() => {
    initializeMap();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  // ============================================
  // MAP INITIALIZATION
  // ============================================

  function initializeMap(): void {
    map = new maplibregl.Map({
      container,
      style: MAP_STYLES.dark,
      center: [100, 25],
      zoom: 2,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true,
    }), 'top-right');

    // Add scale
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric',
    }), 'bottom-left');

    map.on('load', () => {
      isReady = true;
      isLoading = false;
      addRouteLayers();
      addMarkerLayer();
      addHomeBaseMarker();
      fitToTrips();
    });
  }

  // ============================================
  // POPUP MANAGEMENT
  // ============================================

  function closeCurrentPopup(): void {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  }

  function showPopup(lngLat: [number, number], html: string, className: string = 'travel-popup'): void {
    closeCurrentPopup();

    if (!map) return;

    currentPopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      className,
    })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);

    // Clear reference when popup is closed
    currentPopup.on('close', () => {
      currentPopup = null;
    });
  }

  // ============================================
  // ROUTE LAYERS
  // ============================================

  function addRouteLayers(): void {
    if (!map || !isReady) return;

    // Only show routes for journeys (multi-stop trips)
    const journeyTrips = trips.filter(trip => trip.metadata.locations.length >= 2);

    // Create GeoJSON from trips
    const routeFeatures = journeyTrips.map(trip => {
      const locations = trip.metadata.locations;
      const coordinates: [number, number][] = locations.map(loc => [loc.lng, loc.lat]);

      return {
        type: 'Feature' as const,
        properties: {
          tripId: trip.id,
          label: trip.label,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
      };
    });

    // Hide routes in destinations-only mode
    const showRoutes = displayMode !== 'destinations' && routeFeatures.length > 0;

    // Add or update source
    if (map.getSource('routes')) {
      (map.getSource('routes') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: routeFeatures,
      });
      // Update visibility
      if (map.getLayer('routes-glow')) {
        map.setLayoutProperty('routes-glow', 'visibility', showRoutes ? 'visible' : 'none');
        map.setLayoutProperty('routes-line', 'visibility', showRoutes ? 'visible' : 'none');
        map.setLayoutProperty('routes-dash', 'visibility', showRoutes ? 'visible' : 'none');
      }
    } else {
      map.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures,
        },
      });

      // Glow layer (behind)
      map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showRoutes ? 'visible' : 'none',
        },
        paint: {
          'line-color': routeGlow,
          'line-width': 8,
          'line-opacity': 0.3,
          'line-blur': 4,
        },
      });

      // Main route line
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showRoutes ? 'visible' : 'none',
        },
        paint: {
          'line-color': routeColor,
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });

      // Animated dashes (direction indicator)
      map.addLayer({
        id: 'routes-dash',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showRoutes ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [0, 4, 3],
        },
      });

      // Route hover interaction
      map.on('mouseenter', 'routes-line', () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'routes-line', () => {
        if (map) map.getCanvas().style.cursor = '';
      });

      map.on('click', 'routes-line', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];

          showPopup(coordinates, `
            <div class="popup-content">
              <h3>${props?.label || 'Trip'}</h3>
              <p class="route-hint">Click markers for details</p>
            </div>
          `);
        }
      });
    }
  }

  // ============================================
  // HOME BASE MARKER
  // ============================================

  function addHomeBaseMarker(): void {
    if (!map || !isReady) return;

    // Remove existing home marker if any
    if (map.getLayer('home-marker-icon')) map.removeLayer('home-marker-icon');
    if (map.getLayer('home-marker-glow')) map.removeLayer('home-marker-glow');
    if (map.getSource('home-marker')) map.removeSource('home-marker');

    if (!homeBase) return;

    // Add home marker source
    map.addSource('home-marker', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            city: homeBase.city,
            country: homeBase.country,
          },
          geometry: {
            type: 'Point',
            coordinates: [homeBase.lng, homeBase.lat],
          },
        }],
      },
    });

    // Outer glow
    map.addLayer({
      id: 'home-marker-glow',
      type: 'circle',
      source: 'home-marker',
      paint: {
        'circle-radius': 20,
        'circle-color': '#22c55e',
        'circle-opacity': 0.15,
        'circle-blur': 1,
      },
    });

    // Home icon circle
    map.addLayer({
      id: 'home-marker-icon',
      type: 'circle',
      source: 'home-marker',
      paint: {
        'circle-radius': 8,
        'circle-color': '#22c55e',
        'circle-opacity': 1,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.9,
      },
    });

    // Home marker click
    map.on('click', 'home-marker-icon', (e) => {
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

        showPopup(coords, `
          <div class="popup-content">
            <div class="home-badge">HOME BASE</div>
            <h3>${props?.city}</h3>
            <p>${props?.country}</p>
          </div>
        `, 'travel-popup home-popup');
      }
    });

    map.on('mouseenter', 'home-marker-icon', () => {
      if (map) map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'home-marker-icon', () => {
      if (map) map.getCanvas().style.cursor = '';
    });
  }

  // ============================================
  // MARKER LAYER
  // ============================================

  function addMarkerLayer(): void {
    if (!map || !isReady) return;

    // Create GeoJSON from markers
    const markerFeatures = markers.map(marker => ({
      type: 'Feature' as const,
      properties: {
        id: marker.id,
        city: marker.location.city,
        country: marker.location.country,
        visits: marker.visits,
        color: marker.color,
        size: marker.size,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.lng, marker.lat],
      },
    }));

    if (map.getSource('markers')) {
      (map.getSource('markers') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: markerFeatures,
      });
    } else {
      map.addSource('markers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: markerFeatures,
        },
      });

      // Outer glow circle
      map.addLayer({
        id: 'markers-glow',
        type: 'circle',
        source: 'markers',
        paint: {
          'circle-radius': ['*', ['get', 'size'], 12],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.2,
          'circle-blur': 1,
        },
      });

      // Inner circle
      map.addLayer({
        id: 'markers-inner',
        type: 'circle',
        source: 'markers',
        paint: {
          'circle-radius': ['*', ['get', 'size'], 5],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8,
        },
      });

      // Click handler for markers
      map.on('click', 'markers-inner', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

          // Find the full marker data
          const marker = markers.find(m => m.id === props?.id);
          if (marker && onMarkerClick) {
            onMarkerClick(marker);
          }

          // Show popup (closes any existing popup first)
          showPopup(coords, `
            <div class="popup-content">
              <h3>${props?.city}</h3>
              <p>${props?.country}</p>
              <span class="visits">${props?.visits} visit${props?.visits > 1 ? 's' : ''}</span>
            </div>
          `);
        }
      });

      // Cursor change on hover
      map.on('mouseenter', 'markers-inner', () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'markers-inner', () => {
        if (map) map.getCanvas().style.cursor = '';
      });
    }
  }

  // ============================================
  // EFFECTS - Reactive Updates
  // ============================================

  $effect(() => {
    if (map && isReady && trips) {
      addRouteLayers();
    }
  });

  $effect(() => {
    if (map && isReady && markers) {
      addMarkerLayer();
    }
  });

  $effect(() => {
    if (map && isReady) {
      // Update route colors
      if (map.getLayer('routes-line')) {
        map.setPaintProperty('routes-line', 'line-color', routeColor);
      }
      if (map.getLayer('routes-glow')) {
        map.setPaintProperty('routes-glow', 'line-color', routeGlow);
      }
    }
  });

  $effect(() => {
    if (map && isReady && homeBase !== undefined) {
      addHomeBaseMarker();
    }
  });

  // ============================================
  // PUBLIC METHODS
  // ============================================

  function fitToTrips(): void {
    if (!map || markers.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    markers.forEach(marker => {
      bounds.extend([marker.lng, marker.lat]);
    });

    map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 10,
      duration: 1000,
    });
  }

  export function focusOn(lat: number, lng: number, zoom: number = 8): void {
    if (map) {
      map.flyTo({
        center: [lng, lat],
        zoom,
        duration: 1500,
        essential: true,
      });
    }
  }

  export function resetView(): void {
    fitToTrips();
  }

  export function focusOnHome(): void {
    const home = travelerStore.homeBase;
    if (home) {
      focusOn(home.lat, home.lng, 10);
    }
  }

  export function setMapStyle(style: 'dark' | 'light' | 'terrain'): void {
    if (map && style !== currentMapStyle) {
      currentMapStyle = style;
      map.setStyle(MAP_STYLES[style]);
      // Re-add layers after style change
      map.once('style.load', () => {
        addRouteLayers();
        addMarkerLayer();
        addHomeBaseMarker();
      });
    }
  }
</script>

<div class="map-container {className}" bind:this={container}>
  {#if isLoading}
    <div class="map-loading">
      <div class="loading-spinner"></div>
      <span>Loading map...</span>
    </div>
  {/if}
</div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
  }

  .map-container :global(.maplibregl-map) {
    font-family: inherit;
  }

  /* Dark theme for controls */
  .map-container :global(.maplibregl-ctrl-group) {
    background: rgba(15, 15, 25, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }

  .map-container :global(.maplibregl-ctrl-group button) {
    background: transparent;
    border: none;
    width: 32px;
    height: 32px;
  }

  .map-container :global(.maplibregl-ctrl-group button:hover) {
    background: rgba(255, 255, 255, 0.1);
  }

  .map-container :global(.maplibregl-ctrl-group button span) {
    filter: invert(1);
  }

  .map-container :global(.maplibregl-ctrl-scale) {
    background: rgba(15, 15, 25, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 10px;
    padding: 2px 6px;
  }

  /* Custom popup styling */
  .map-container :global(.travel-popup .maplibregl-popup-content) {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .map-container :global(.travel-popup .maplibregl-popup-tip) {
    border-top-color: rgba(15, 15, 25, 0.95);
  }

  .map-container :global(.travel-popup .maplibregl-popup-close-button) {
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
    padding: 4px 8px;
  }

  .map-container :global(.travel-popup .maplibregl-popup-close-button:hover) {
    color: white;
    background: transparent;
  }

  .map-container :global(.popup-content) {
    padding: 12px 16px;
    color: white;
  }

  .map-container :global(.popup-content h3) {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .map-container :global(.popup-content p) {
    margin: 4px 0 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .map-container :global(.popup-content .visits) {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 8px;
    background: rgba(251, 191, 36, 0.15);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #fbbf24;
  }

  .map-container :global(.popup-content .route-hint) {
    font-size: 0.75rem;
    font-style: italic;
    opacity: 0.6;
  }

  .map-container :global(.popup-content .home-badge) {
    display: inline-block;
    margin-bottom: 6px;
    padding: 3px 8px;
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #22c55e;
  }

  .map-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #00d4ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
