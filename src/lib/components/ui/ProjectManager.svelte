<script lang="ts">
  import { projectStore } from '$lib/stores/projectStore.svelte';
  import { appStore } from '$lib/stores/appStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import type { ProjectMeta } from '$lib/types/project';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let newProjectName = $state('');
  let isCreating = $state(false);
  let renamingId = $state<string | null>(null);
  let renameValue = $state('');
  let deleteConfirmId = $state<string | null>(null);

  const mode = $derived(appStore.mode);
  const projects = $derived(
    mode === 'builder' ? projectStore.builderProjects : projectStore.travelerProjects
  );
  const currentProject = $derived(
    mode === 'builder' ? projectStore.currentBuilderProject : projectStore.currentTravelerProject
  );

  function handleCreateProject(): void {
    if (!newProjectName.trim()) return;

    // Save current project first if there are changes
    if (projectStore.hasUnsavedChanges && currentProject) {
      projectStore.saveCurrentProject(mode);
    }

    projectStore.createProject(mode, newProjectName.trim());
    toastStore.success(`Created "${newProjectName.trim()}"`);
    newProjectName = '';
    isCreating = false;
  }

  function handleLoadProject(project: ProjectMeta): void {
    if (project.id === currentProject?.id) return;

    // Save current project first
    if (projectStore.hasUnsavedChanges && currentProject) {
      projectStore.saveCurrentProject(mode);
    }

    projectStore.loadProject(mode, project.id);
    toastStore.success(`Loaded "${project.name}"`);
    onClose();
  }

  function handleDeleteProject(projectId: string): void {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    projectStore.deleteProject(mode, projectId);
    toastStore.success(`Deleted "${project.name}"`);
    deleteConfirmId = null;
  }

  function handleRename(projectId: string): void {
    if (!renameValue.trim()) {
      renamingId = null;
      return;
    }
    projectStore.renameProject(mode, projectId, renameValue.trim());
    toastStore.success('Project renamed');
    renamingId = null;
  }

  function handleDuplicate(projectId: string): void {
    const newProject = projectStore.duplicateProject(mode, projectId);
    if (newProject) {
      toastStore.success(`Duplicated as "${newProject.name}"`);
    }
  }

  function startRename(project: ProjectMeta): void {
    renamingId = project.id;
    renameValue = project.name;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (isCreating) {
        isCreating = false;
      } else if (renamingId) {
        renamingId = null;
      } else if (deleteConfirmId) {
        deleteConfirmId = null;
      } else {
        onClose();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="overlay" onclick={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{mode === 'builder' ? 'Builder' : 'Traveler'} Projects</h2>
        <button class="close-btn" onclick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-content">
        <!-- New Project Button/Form -->
        {#if isCreating}
          <div class="new-project-form">
            <input
              type="text"
              bind:value={newProjectName}
              placeholder="Project name..."
              autofocus
              onkeydown={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            <div class="form-actions">
              <button class="btn-primary" onclick={handleCreateProject}>Create</button>
              <button class="btn-secondary" onclick={() => isCreating = false}>Cancel</button>
            </div>
          </div>
        {:else}
          <button class="new-project-btn" onclick={() => isCreating = true}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        {/if}

        <!-- Storage Notice -->
        <div class="storage-notice" title="Data is stored in your browser's localStorage. Use Export to backup your data.">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div class="storage-text">
            <span>Saved in browser localStorage</span>
            <span class="storage-detail">Data stays on this device only. Export to backup.</span>
          </div>
        </div>

        <!-- Project List -->
        <div class="project-list">
          {#each projects as project (project.id)}
            {@const isCurrent = project.id === currentProject?.id}
            <div class="project-item" class:active={isCurrent}>
              {#if renamingId === project.id}
                <div class="rename-form">
                  <input
                    type="text"
                    bind:value={renameValue}
                    autofocus
                    onkeydown={(e) => e.key === 'Enter' && handleRename(project.id)}
                    onblur={() => handleRename(project.id)}
                  />
                </div>
              {:else if deleteConfirmId === project.id}
                <div class="delete-confirm">
                  <span>Delete "{project.name}"?</span>
                  <div class="confirm-actions">
                    <button class="btn-danger" onclick={() => handleDeleteProject(project.id)}>Delete</button>
                    <button class="btn-secondary" onclick={() => deleteConfirmId = null}>Cancel</button>
                  </div>
                </div>
              {:else}
                <button
                  class="project-info"
                  onclick={() => handleLoadProject(project)}
                  disabled={isCurrent}
                >
                  <div class="project-name">
                    {project.name}
                    {#if isCurrent}
                      <span class="current-badge">Current</span>
                    {/if}
                  </div>
                  <div class="project-meta">
                    Updated {formatDate(project.updatedAt)}
                  </div>
                </button>
                <div class="project-actions">
                  <button
                    class="action-btn"
                    onclick={() => startRename(project)}
                    title="Rename"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    class="action-btn"
                    onclick={() => handleDuplicate(project.id)}
                    title="Duplicate"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <button
                    class="action-btn danger"
                    onclick={() => deleteConfirmId = project.id}
                    title="Delete"
                    disabled={projects.length <= 1}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              {/if}
            </div>
          {:else}
            <div class="empty-state">No projects yet</div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: rgba(30, 30, 35, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
  }

  .modal-content {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  }

  .new-project-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px dashed rgba(59, 130, 246, 0.5);
    border-radius: 12px;
    color: rgb(147, 197, 253);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 16px;
  }

  .new-project-btn:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.7);
  }

  .new-project-btn svg {
    width: 18px;
    height: 18px;
  }

  .new-project-form {
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .new-project-form input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .new-project-form input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
  }

  .form-actions {
    display: flex;
    gap: 8px;
  }

  .project-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .project-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .project-item:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .project-item.active {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .project-info {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
  }

  .project-info:disabled {
    cursor: default;
  }

  .project-name {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .current-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.3);
    color: rgb(147, 197, 253);
    border-radius: 4px;
    font-weight: 600;
  }

  .project-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }

  .project-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .project-item:hover .project-actions {
    opacity: 1;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .action-btn.danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(248, 113, 113);
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .action-btn svg {
    width: 14px;
    height: 14px;
  }

  .rename-form, .delete-confirm {
    flex: 1;
  }

  .rename-form input {
    width: 100%;
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.5);
    border-radius: 6px;
    color: white;
    font-size: 14px;
  }

  .rename-form input:focus {
    outline: none;
  }

  .delete-confirm {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }

  .delete-confirm span {
    flex: 1;
  }

  .confirm-actions {
    display: flex;
    gap: 8px;
  }

  .btn-primary, .btn-secondary, .btn-danger {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-primary {
    background: rgb(59, 130, 246);
    color: white;
  }

  .btn-primary:hover {
    background: rgb(37, 99, 235);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .btn-danger {
    background: rgb(239, 68, 68);
    color: white;
  }

  .btn-danger:hover {
    background: rgb(220, 38, 38);
  }

  .empty-state {
    text-align: center;
    padding: 32px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
  }

  .storage-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    margin-bottom: 16px;
    cursor: help;
  }

  .storage-notice svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.7;
    margin-top: 1px;
  }

  .storage-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .storage-text span:first-child {
    font-size: 13px;
    font-weight: 500;
    color: rgba(147, 197, 253, 1);
  }

  .storage-detail {
    font-size: 11px;
    color: rgba(147, 197, 253, 0.7);
  }
</style>
