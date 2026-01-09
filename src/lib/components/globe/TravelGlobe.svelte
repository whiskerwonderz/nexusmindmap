<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { GLOBE_TEXTURES } from '$lib/types/traveler';
  import type { GlobeMarker } from '$lib/types/traveler';

  interface Props {
    class?: string;
    onMarkerClick?: (marker: GlobeMarker) => void;
  }

  let {
    class: className = '',
    onMarkerClick,
  }: Props = $props();

  let container: HTMLDivElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let globeInstance: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let isReady = $state(false);
  let isLoading = $state(true);

  // Derived data for globe layers
  const arcs = $derived(travelerStore.arcs);
  const markers = $derived(travelerStore.markers);

  onMount(() => {
    initGlobe();
  });

  async function initGlobe(): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      const GlobeGL = (await import('globe.gl')).default;

      // Get initial settings
      const initialStyle = travelerStore.globeStyle;
      const initialTexture = GLOBE_TEXTURES[initialStyle] || GLOBE_TEXTURES.night;
      const initialAtmosphereColor = travelerStore.explorerColors.atmosphereColor;

      globeInstance = new GlobeGL(container)
        .globeImageUrl(initialTexture)
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundColor('rgba(0, 0, 0, 0)')
        .showAtmosphere(true)
        .atmosphereColor(initialAtmosphereColor)
        .atmosphereAltitude(0.18)

        // Arc layer
        .arcsData(arcs)
        .arcStartLat('startLat')
        .arcStartLng('startLng')
        .arcEndLat('endLat')
        .arcEndLng('endLng')
        .arcColor('color')
        .arcAltitude('altitude')
        .arcStroke('stroke')
        .arcDashLength('dashLength')
        .arcDashGap('dashGap')
        .arcDashAnimateTime((d: { dashAnimateTime?: number }) =>
          travelerStore.animateArcs ? (d.dashAnimateTime ?? 2000) : 0
        )
        .arcLabel('label')

        // Points layer
        .pointsData(markers)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointAltitude(0.01)
        .pointRadius(0.4)
        .pointLabel((d: object) => {
          const marker = d as { location: { city: string; country: string }; visits: number };
          return `
          <div style="
            background: rgba(15, 15, 25, 0.95);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 8px 12px;
            font-family: system-ui, sans-serif;
            color: white;
            font-size: 13px;
            backdrop-filter: blur(8px);
          ">
            <div style="font-weight: 600; margin-bottom: 2px;">${marker.location.city}</div>
            <div style="opacity: 0.7; font-size: 12px;">${marker.location.country}</div>
            <div style="color: #fbbf24; font-size: 11px; margin-top: 4px;">
              ${marker.visits} visit${marker.visits > 1 ? 's' : ''}
            </div>
          </div>
        `})
        .onPointClick((point: unknown) => {
          const marker = point as GlobeMarker;
          if (onMarkerClick) onMarkerClick(marker);
          focusOn(marker.lat, marker.lng, 1.5);
        })

        // Initial view
        .pointOfView({ lat: 25, lng: 100, altitude: 2.5 }, 0);

      // Configure controls
      const controls = globeInstance.controls();
      controls.autoRotate = travelerStore.autoRotate;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.enablePan = false;
      controls.minDistance = 120;
      controls.maxDistance = 600;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

      updateDimensions();
      isReady = true;
      isLoading = false;

      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(container);
    } catch (error) {
      console.error('Failed to initialize globe:', error);
      isLoading = false;
    }
  }

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (globeInstance) {
      try {
        const scene = globeInstance.scene();
        if (scene) {
          scene.traverse((obj: { geometry?: { dispose: () => void }; material?: { dispose: () => void } | Array<{ dispose: () => void }> }) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((m) => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
        }
      } catch {
        // Ignore cleanup errors
      }
      globeInstance = null;
    }
  });

  // Reactive updates
  $effect(() => {
    if (globeInstance && isReady) globeInstance.arcsData(arcs);
  });

  $effect(() => {
    if (globeInstance && isReady) globeInstance.pointsData(markers);
  });

  $effect(() => {
    const style = travelerStore.globeStyle;
    const texture = GLOBE_TEXTURES[style] || GLOBE_TEXTURES.night;
    if (globeInstance && isReady) {
      globeInstance.globeImageUrl(texture);
    }
  });

  $effect(() => {
    const color = travelerStore.explorerColors.atmosphereColor;
    if (globeInstance && isReady) {
      globeInstance.atmosphereColor(color);
    }
  });

  $effect(() => {
    const rotate = travelerStore.autoRotate;
    if (globeInstance && isReady) {
      globeInstance.controls().autoRotate = rotate;
    }
  });

  $effect(() => {
    const animate = travelerStore.animateArcs;
    if (globeInstance && isReady) {
      globeInstance.arcDashAnimateTime(animate ? 2000 : 0);
    }
  });

  function updateDimensions(): void {
    if (globeInstance && container) {
      const rect = container.getBoundingClientRect();
      globeInstance.width(rect.width);
      globeInstance.height(rect.height);
    }
  }

  export function focusOn(lat: number, lng: number, altitude: number = 1.8): void {
    if (globeInstance) {
      const controls = globeInstance.controls();
      const wasRotating = controls.autoRotate;
      controls.autoRotate = false;
      globeInstance.pointOfView({ lat, lng, altitude }, 1000);
      if (wasRotating) setTimeout(() => controls.autoRotate = true, 1200);
    }
  }

  export function resetView(): void {
    if (globeInstance) {
      globeInstance.pointOfView({ lat: 25, lng: 100, altitude: 2.5 }, 1000);
    }
  }

  export function focusOnHome(): void {
    const home = travelerStore.homeBase;
    if (home) focusOn(home.lat, home.lng, 1.5);
  }
</script>

<div class="globe-container {className}" bind:this={container}>
  {#if isLoading}
    <div class="globe-loading">
      <div class="loading-spinner"></div>
      <span>Loading globe...</span>
    </div>
  {/if}
</div>

<style>
  .globe-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    position: relative;
    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
    border-radius: 12px;
    overflow: hidden;
  }

  .globe-container :global(canvas) { outline: none; }

  .globe-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
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

  @keyframes spin { to { transform: rotate(360deg); } }
</style>
