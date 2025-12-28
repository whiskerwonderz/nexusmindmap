<script lang="ts">
  import { browser } from '$app/environment';

  interface Props {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onReset?: () => void;
    zoom?: number;
    fullscreenTarget?: HTMLElement | null;
  }

  let { onZoomIn, onZoomOut, onReset, zoom = 1, fullscreenTarget = null }: Props = $props();

  let isFullscreen = $state(false);

  // Check fullscreen state
  $effect(() => {
    if (!browser) return;

    function handleFullscreenChange() {
      isFullscreen = !!document.fullscreenElement;
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  function toggleFullscreen() {
    if (!browser) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (fullscreenTarget) {
      fullscreenTarget.requestFullscreen();
    }
  }

  const zoomPercent = $derived(Math.round(zoom * 100));
</script>

<div class="zoom-controls">
  <!-- Zoom Out -->
  <button
    type="button"
    class="zoom-btn"
    onclick={onZoomOut}
    disabled={zoom <= 0.25}
    title="Zoom out"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>

  <!-- Zoom level indicator / Reset -->
  <button
    type="button"
    class="zoom-level"
    onclick={onReset}
    title="Reset zoom"
  >
    {zoomPercent}%
  </button>

  <!-- Zoom In -->
  <button
    type="button"
    class="zoom-btn"
    onclick={onZoomIn}
    disabled={zoom >= 3}
    title="Zoom in"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </button>

  <div class="divider"></div>

  <!-- Fullscreen -->
  <button
    type="button"
    class="zoom-btn"
    onclick={toggleFullscreen}
    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
  >
    {#if isFullscreen}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    {/if}
  </button>
</div>

<style>
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    background: var(--color-panel-bg, rgba(18, 18, 26, 0.95));
    border: 1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }

  .zoom-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-muted, #9ca3af);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zoom-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text, #ffffff);
  }

  .zoom-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .zoom-btn svg {
    width: 14px;
    height: 14px;
  }

  .zoom-level {
    min-width: 44px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-muted, #9ca3af);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .zoom-level:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text, #ffffff);
  }

  .divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 4px;
  }
</style>
