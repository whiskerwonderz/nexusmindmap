<script lang="ts">
  import { appStore } from '$lib/stores/appStore.svelte';
  import type { AppMode } from '$lib/types/index';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const mode = $derived(appStore.mode);

  function handleModeChange(newMode: AppMode): void {
    if (newMode !== mode) {
      appStore.setMode(newMode);
    }
  }
</script>

<div class="mode-switcher {className}" role="tablist" aria-label="App mode">
  <button
    type="button"
    role="tab"
    aria-selected={mode === 'builder'}
    class="mode-tab"
    class:active={mode === 'builder'}
    onclick={() => handleModeChange('builder')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      <path d="M20 3v4"/>
      <path d="M22 5h-4"/>
    </svg>
    <span>Builder</span>
  </button>

  <button
    type="button"
    role="tab"
    aria-selected={mode === 'traveler'}
    class="mode-tab"
    class:active={mode === 'traveler'}
    onclick={() => handleModeChange('traveler')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
    <span>Traveler</span>
  </button>
</div>

<style>
  .mode-switcher {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mode-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mode-tab:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.05);
  }

  .mode-tab.active {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .mode-tab svg {
    flex-shrink: 0;
  }
</style>
