<script lang="ts">
  import { nodes, edges, title } from '$lib/stores/graph';
  import ThemeSwitcher from './ui/ThemeSwitcher.svelte';
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
    <span class="text-sm text-graph-muted">{$title}</span>
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
