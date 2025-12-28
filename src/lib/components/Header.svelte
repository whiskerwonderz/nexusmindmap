<script lang="ts">
  import { tick } from 'svelte';
  import { nodes, edges, title, setTitle } from '$lib/stores/graph';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';

  let isEditing = $state(false);
  let editValue = $state('');
  let inputRef = $state<HTMLInputElement | null>(null);

  async function startEditing() {
    editValue = $title;
    isEditing = true;
    await tick();
    inputRef?.focus();
    inputRef?.select();
  }

  function saveTitle() {
    if (editValue.trim()) {
      setTitle(editValue.trim());
    }
    isEditing = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      isEditing = false;
    }
  }
</script>

<header class="h-14 px-6 flex items-center justify-between border-b border-panel">
  <div class="flex items-center gap-4">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
      >
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" stroke-width="2" />
          <circle cx="19" cy="7" r="2" stroke-width="2" />
          <circle cx="5" cy="7" r="2" stroke-width="2" />
          <circle cx="5" cy="17" r="2" stroke-width="2" />
          <circle cx="19" cy="17" r="2" stroke-width="2" />
          <line x1="12" y1="9" x2="12" y2="6" stroke-width="2" />
          <line x1="14.5" y1="10.5" x2="17" y2="8" stroke-width="2" />
          <line x1="9.5" y1="10.5" x2="7" y2="8" stroke-width="2" />
          <line x1="9.5" y1="13.5" x2="7" y2="16" stroke-width="2" />
          <line x1="14.5" y1="13.5" x2="17" y2="16" stroke-width="2" />
        </svg>
      </div>
      <span class="font-semibold text-lg">SkillGraph</span>
    </div>

    <!-- Title -->
    <div class="h-5 w-px bg-white/10"></div>
    {#if isEditing}
      <input
        bind:this={inputRef}
        type="text"
        bind:value={editValue}
        onblur={saveTitle}
        onkeydown={handleKeydown}
        class="text-sm bg-input border border-panel rounded px-2 py-1 focus:outline-none focus:border-white/20 min-w-[200px]"
      />
    {:else}
      <button
        type="button"
        class="text-sm text-graph-muted hover:text-white transition-colors cursor-text"
        onclick={startEditing}
        title="Click to edit title"
      >
        {$title}
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-4">
    <!-- Stats -->
    <div class="flex items-center gap-4 text-xs text-graph-muted">
      <span>{$nodes.length} nodes</span>
      <span>{$edges.length} connections</span>
    </div>

    <!-- Theme Switcher -->
    <ThemeSwitcher />
  </div>
</header>
