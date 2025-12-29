<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import type { DisplayMode } from '$lib/types/traveler';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const displayMode = $derived(travelerStore.displayMode);

  const displayModes: { value: DisplayMode; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'globe' },
    { value: 'journeys', label: 'Journeys', icon: 'route' },
    { value: 'destinations', label: 'Destinations', icon: 'pin' },
  ];

  function handleModeChange(mode: DisplayMode): void {
    travelerStore.setDisplayMode(mode);
  }
</script>

<div class="timeline-controls {className}">
  <div class="control-group">
    <span class="group-label">Show</span>
    <div class="mode-buttons">
      {#each displayModes as mode}
        <button
          type="button"
          class="mode-btn"
          class:active={displayMode === mode.value}
          onclick={() => handleModeChange(mode.value)}
        >
          {#if mode.icon === 'globe'}
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          {:else if mode.icon === 'route'}
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          {:else}
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          {/if}
          <span class="mode-label">{mode.label}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .timeline-controls {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    justify-content: center;
    padding: 1rem 0;
    background: linear-gradient(
      180deg,
      #0a0a0f 0%,
      rgba(10, 10, 15, 0.95) 70%,
      transparent 100%
    );
    backdrop-filter: blur(8px);
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
  }

  .group-label {
    padding-left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mode-buttons {
    display: flex;
    gap: 0.25rem;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  .mode-btn.active {
    background: rgba(0, 212, 255, 0.15);
    color: #00d4ff;
  }

  .mode-icon {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 640px) {
    .mode-label {
      display: none;
    }

    .mode-btn {
      padding: 0.5rem;
    }

    .group-label {
      display: none;
    }
  }
</style>
