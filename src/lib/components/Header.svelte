<script lang="ts">
  import { base } from '$app/paths';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';
  import ModeSwitcher from './ui/ModeSwitcher.svelte';
  import ProjectManager from './ui/ProjectManager.svelte';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';

  let isProjectManagerOpen = $state(false);

  const currentProject = $derived(projectStore.currentProject);
  const hasUnsavedChanges = $derived(projectStore.hasUnsavedChanges);

  function handleSave(): void {
    projectStore.saveCurrentProject(appStore.mode);
    toastStore.success('Project saved');
  }

  function handleNew(): void {
    const name = appStore.mode === 'builder' ? 'New Knowledge Graph' : 'New Travel Map';
    projectStore.createProject(appStore.mode, name);
    toastStore.success('New project created');
  }

  export function openProjectManager(): void {
    isProjectManagerOpen = true;
  }
</script>

<header class="h-14 px-6 flex items-center justify-between border-b border-panel">
  <div class="flex items-center gap-4">
    <!-- Logo -->
    <a href="{base}/landing" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <img src="{base}/logo.png" alt="NexusMindMap" class="w-8 h-8 rounded-lg object-cover" />
      <span class="logo-text">NexusMindMap</span>
      <span class="beta-badge">Beta</span>
    </a>

    <!-- Project Name & Actions -->
    <div class="project-section">
      <button
        class="new-btn"
        onclick={handleNew}
        title="Create new project"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New</span>
      </button>
      <button class="project-btn" onclick={() => isProjectManagerOpen = true} title="Manage projects - Stored in browser localStorage (this device only)">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span class="project-name">{currentProject?.name ?? 'Untitled'}</span>
        {#if hasUnsavedChanges}
          <span class="unsaved-dot" title="Unsaved changes"></span>
        {/if}
        <svg class="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <button
        class="save-btn"
        onclick={handleSave}
        title="Save to local browser storage (this device only)"
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
    <!-- Bug Report -->
    <a
      href="mailto:whiskerwonderz001@gmail.com?subject=NexusMindMap Bug Report&body=Please describe the bug:%0A%0ABrowser:%0ASteps to reproduce:%0A"
      class="feedback-btn"
      title="Send feedback"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    </a>

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

  .beta-badge {
    padding: 2px 8px;
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    color: rgb(251, 191, 36);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .feedback-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .feedback-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .project-section {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
    padding-left: 16px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .new-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 8px;
    color: rgba(147, 197, 253, 1);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .new-btn:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
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
