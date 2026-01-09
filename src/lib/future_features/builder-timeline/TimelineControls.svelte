<script lang="ts">
  import { onMount } from 'svelte';
  import {
    timelineState,
    setTimelineRange,
    startTimelinePlay,
    stopTimelinePlay,
    setTimelinePlayProgress
  } from '$lib/stores/layout';

  interface Props {
    width: number;
    padding?: number;
  }

  let { width, padding = 80 }: Props = $props();

  let isDragging = $state<'start' | 'end' | 'middle' | null>(null);
  let dragStartX = $state(0);
  let dragStartRange = $state({ start: 0, end: 1 });
  let containerRef = $state<HTMLDivElement | null>(null);
  let playAnimationFrame: number | null = null;

  const trackWidth = $derived(width - padding * 2);
  const brushLeft = $derived($timelineState.range.start * trackWidth);
  const brushWidth = $derived(($timelineState.range.end - $timelineState.range.start) * trackWidth);

  // Format date from progress
  function formatDate(progress: number): string {
    const { minDate, maxDate } = $timelineState;
    const timestamp = minDate + progress * (maxDate - minDate);
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function handleMouseDown(e: MouseEvent, handle: 'start' | 'end' | 'middle') {
    e.preventDefault();
    isDragging = handle;
    dragStartX = e.clientX;
    dragStartRange = { ...$timelineState.range };
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaProgress = deltaX / trackWidth;

    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(dragStartRange.start + deltaProgress, $timelineState.range.end - 0.05));
      setTimelineRange(newStart, $timelineState.range.end);
    } else if (isDragging === 'end') {
      const newEnd = Math.min(1, Math.max(dragStartRange.end + deltaProgress, $timelineState.range.start + 0.05));
      setTimelineRange($timelineState.range.start, newEnd);
    } else if (isDragging === 'middle') {
      const rangeWidth = dragStartRange.end - dragStartRange.start;
      let newStart = dragStartRange.start + deltaProgress;
      let newEnd = dragStartRange.end + deltaProgress;

      if (newStart < 0) {
        newStart = 0;
        newEnd = rangeWidth;
      }
      if (newEnd > 1) {
        newEnd = 1;
        newStart = 1 - rangeWidth;
      }

      setTimelineRange(newStart, newEnd);
    }
  }

  function handleMouseUp() {
    isDragging = null;
  }

  function togglePlay() {
    if ($timelineState.isPlaying) {
      stopTimelinePlay();
      if (playAnimationFrame) {
        cancelAnimationFrame(playAnimationFrame);
        playAnimationFrame = null;
      }
    } else {
      startTimelinePlay();
      animatePlay();
    }
  }

  function animatePlay() {
    const duration = 3000; // 3 seconds for full animation
    const startTime = performance.now();
    const { start, end } = $timelineState.range;

    function tick(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Map progress to the selected range
      const rangeProgress = start + progress * (end - start);
      setTimelinePlayProgress(rangeProgress);

      if (progress < 1 && $timelineState.isPlaying) {
        playAnimationFrame = requestAnimationFrame(tick);
      } else {
        stopTimelinePlay();
        playAnimationFrame = null;
      }
    }

    playAnimationFrame = requestAnimationFrame(tick);
  }

  onMount(() => {
    return () => {
      if (playAnimationFrame) {
        cancelAnimationFrame(playAnimationFrame);
      }
    };
  });
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
  bind:this={containerRef}
  class="timeline-controls"
  style:width="{width}px"
  style:padding-left="{padding}px"
  style:padding-right="{padding}px"
>
  <!-- Play button -->
  <button
    type="button"
    class="play-btn"
    onclick={togglePlay}
    title={$timelineState.isPlaying ? 'Stop' : 'Play chronological animation'}
  >
    {#if $timelineState.isPlaying}
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    {/if}
  </button>

  <!-- Brush range selector -->
  <div class="brush-track">
    <!-- Background track -->
    <div class="track-bg"></div>

    <!-- Selected range (brush) -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="brush-selection"
      style:left="{brushLeft}px"
      style:width="{brushWidth}px"
      onmousedown={(e) => handleMouseDown(e, 'middle')}
    >
      <!-- Left handle -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="brush-handle left"
        onmousedown={(e) => { e.stopPropagation(); handleMouseDown(e, 'start'); }}
      ></div>

      <!-- Right handle -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="brush-handle right"
        onmousedown={(e) => { e.stopPropagation(); handleMouseDown(e, 'end'); }}
      ></div>
    </div>

    <!-- Play progress indicator -->
    {#if $timelineState.isPlaying || $timelineState.playProgress > 0}
      <div
        class="play-indicator"
        style:left="{$timelineState.playProgress * trackWidth}px"
      ></div>
    {/if}
  </div>

  <!-- Date labels -->
  <div class="date-labels">
    <span class="date-label start">{formatDate($timelineState.range.start)}</span>
    <span class="date-label end">{formatDate($timelineState.range.end)}</span>
  </div>
</div>

<style>
  .timeline-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 48px;
    box-sizing: border-box;
  }

  .play-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .play-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .play-btn svg {
    width: 14px;
    height: 14px;
  }

  .brush-track {
    flex: 1;
    height: 24px;
    position: relative;
  }

  .track-bg {
    position: absolute;
    top: 10px;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  .brush-selection {
    position: absolute;
    top: 4px;
    height: 16px;
    background: rgba(59, 130, 246, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.6);
    border-radius: 4px;
    cursor: grab;
    transition: background 0.15s ease;
  }

  .brush-selection:hover {
    background: rgba(59, 130, 246, 0.4);
  }

  .brush-selection:active {
    cursor: grabbing;
  }

  .brush-handle {
    position: absolute;
    top: 0;
    width: 8px;
    height: 100%;
    background: rgba(59, 130, 246, 0.8);
    cursor: ew-resize;
    transition: background 0.15s ease;
  }

  .brush-handle:hover {
    background: rgba(59, 130, 246, 1);
  }

  .brush-handle.left {
    left: 0;
    border-radius: 4px 0 0 4px;
  }

  .brush-handle.right {
    right: 0;
    border-radius: 0 4px 4px 0;
  }

  .play-indicator {
    position: absolute;
    top: 2px;
    width: 2px;
    height: 20px;
    background: #F59E0B;
    border-radius: 1px;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  }

  .date-labels {
    display: flex;
    justify-content: space-between;
    position: absolute;
    bottom: -16px;
    left: 0;
    right: 0;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
  }

  .date-label {
    background: var(--color-background, #0a0a0f);
    padding: 0 4px;
  }
</style>
