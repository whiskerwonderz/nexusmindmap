<script lang="ts">
  import { nodes, edges } from '$lib/stores/graph';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';
  import ModeSwitcher from './ui/ModeSwitcher.svelte';
  import ProjectManager from './ui/ProjectManager.svelte';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';

  let isProjectManagerOpen = $state(false);

  const currentProject = $derived(projectStore.currentProject);
  const hasUnsavedChanges = $derived(projectStore.hasUnsavedChanges);

  function handleSave(): void {
    projectStore.saveCurrentProject(appStore.mode);
    toastStore.success('Project saved');
  }

  export function openProjectManager(): void {
    isProjectManagerOpen = true;
  }
</script>

<header class="h-14 px-6 flex items-center justify-between border-b border-panel">
  <div class="flex items-center gap-4">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <a href="/landing" class="hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="NexusMindMap" class="w-8 h-8 rounded-lg object-cover" />
      </a>
      <div class="flex flex-col">
        <a href="/landing" class="logo-text hover:opacity-80 transition-opacity">NexusMindMap</a>
        <a href="https://whiskerwonderz.github.io/whisker_wonderz/" target="_blank" rel="noopener noreferrer" class="text-xs italic text-graph-muted hover:text-white transition-colors">by WhiskerWonderz</a>
      </div>
    </div>

    <!-- Project Name & Actions -->
    <div class="project-section">
      <button class="project-btn" onclick={() => isProjectManagerOpen = true} title="Manage projects - Stored in browser localStorage (this device only)">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span class="project-name">{currentProject?.name ?? 'Untitled'}</span>
        {#if hasUnsavedChanges}
          <span class="unsaved-dot" title="Unsaved changes"></span>
        {/if}
      </button>
      <button
        class="save-btn"
        onclick={handleSave}
        title="Save to browser localStorage (Ctrl+S) - Data stays on this device only"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>
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

<!-- Project Manager Modal -->
<ProjectManager
  isOpen={isProjectManagerOpen}
  onClose={() => isProjectManagerOpen = false}
/>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<style>
  .logo-text {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .project-section {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
    padding-left: 16px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .project-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .project-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .project-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unsaved-dot {
    width: 6px;
    height: 6px;
    background: rgb(251, 146, 60);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
</style>
