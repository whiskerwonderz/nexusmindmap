<script lang="ts">
  import { nodes, edges } from '$lib/stores/graph';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';
  import ModeSwitcher from './ui/ModeSwitcher.svelte';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
</script>

<header class="h-14 px-6 flex items-center justify-between border-b border-panel">
  <div class="flex items-center gap-4">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <img src="/logo.png" alt="NexusMindMap" class="w-8 h-8 rounded-lg object-cover" />
      <span class="font-semibold text-lg">NexusMindMap</span>
    </div>
  </div>

  <!-- Center: Mode Switcher -->
  <div class="flex items-center">
    <ModeSwitcher />
  </div>

  <div class="flex items-center gap-4">
    <!-- Stats -->
    <div class="flex items-center gap-4 text-xs text-graph-muted">
      {#if appStore.mode === 'builder'}
        <span>{$nodes.length} nodes</span>
        <span>{$edges.length} connections</span>
      {:else}
        <span>{travelerStore.stats.totalTrips} trips</span>
        <span>{travelerStore.stats.uniqueCountries} countries</span>
      {/if}
    </div>

    <!-- Theme Switcher -->
    <ThemeSwitcher />
  </div>
</header>
