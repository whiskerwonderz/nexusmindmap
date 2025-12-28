<script lang="ts">
  import { themeState, setTheme } from '$lib/stores/theme.svelte';
  import type { ThemeId } from '$lib/types';

  let isOpen = $state(false);

  function handleSelect(themeId: ThemeId) {
    console.log('handleSelect called with:', themeId);
    setTheme(themeId);
    isOpen = false;
  }

  function toggleDropdown() {
    console.log('Toggle dropdown, current state:', isOpen);
    isOpen = !isOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.theme-switcher')) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="theme-switcher relative">
  <button
    type="button"
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
    onclick={toggleDropdown}
  >
    <span class="w-3 h-3 rounded-full" style:background={themeState.currentTheme.colors.goal}
    ></span>
    <span>{themeState.currentTheme.name}</span>
    <svg
      class="w-4 h-4 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 top-full mt-2 w-56 py-2 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50"
    >
      {#each themeState.allThemes as theme}
        {@const isSelected = theme.id === themeState.currentTheme.id}
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors {isSelected
            ? 'bg-white/10'
            : ''}"
          onclick={() => handleSelect(theme.id as ThemeId)}
        >
          <div class="flex gap-1">
            <span class="w-3 h-3 rounded-full" style:background={theme.colors.goal}></span>
            <span class="w-3 h-3 rounded-full" style:background={theme.colors.skill}></span>
            <span class="w-3 h-3 rounded-full" style:background={theme.colors.project}></span>
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium">{theme.name}</div>
            <div class="text-xs text-gray-400">{theme.description}</div>
          </div>
          {#if isSelected}
            <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
