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
  let webglError = $state<string | null>(null);
  let initAttempted = false;

  function checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        webglError = 'WebGL is not supported in your browser. Please try Chrome or Safari.';
        return false;
      }
      return true;
    } catch {
      webglError = 'WebGL initialization failed. Please try a different browser.';
      return false;
    }
  }

  // Derived data for globe layers
  const arcs = $derived(travelerStore.arcs);
  const markers = $derived(travelerStore.markers);

  onMount(() => {
    initGlobe();
  });

  async function initGlobe(): Promise<void> {
    // Prevent multiple initialization attempts
    if (initAttempted) {
      return;
    }
    initAttempted = true;

    // Check WebGL support first
    if (!checkWebGLSupport()) {
      isLoading = false;
      return;
    }

    // Detect Firefox - known compatibility issues with globe.gl
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
    if (isFirefox) {
      webglError = 'Firefox has limited support for the 3D globe. Please use the 2D Map view for the best experience.';
      isLoading = false;
      return;
    }

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
      webglError = 'Globe failed to load. Try using the 2D Map view instead.';
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
  {#if webglError}
    <div class="globe-error">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>{webglError}</p>
      <span class="error-hint">Switch to "Map" view for a 2D alternative</span>
    </div>
  {:else if isLoading}
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
    min-height: 300px;
    position: relative;
    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
    border-radius: 12px;
    overflow: hidden;
    touch-action: pan-x pan-y;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .globe-container :global(canvas) {
    outline: none;
    touch-action: none; /* Let globe.gl handle touch */
  }

  .globe-loading,
  .globe-error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    z-index: 100;
    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
  }

  .globe-error {
    text-align: center;
    padding: 2rem;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    color: rgba(251, 146, 60, 0.8);
  }

  .globe-error p {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
  }

  .error-hint {
    color: rgba(0, 212, 255, 0.8);
    font-size: 0.875rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #00d4ff;
    border-radius: 50%;
    -webkit-animation: spin 1s linear infinite;
    animation: spin 1s linear infinite;
  }

  @-webkit-keyframes spin { to { -webkit-transform: rotate(360deg); transform: rotate(360deg); } }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
