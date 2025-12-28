<script lang="ts">
  import { layoutMode, setLayoutMode } from '$lib/stores/layout';
  import type { LayoutMode } from '$lib/engine/layouts';
</script>

<div class="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
  <button
    type="button"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all {$layoutMode === 'radial' ? 'bg-white/15 text-white' : 'text-graph-muted hover:text-white hover:bg-white/5'}"
    onclick={() => setLayoutMode('radial')}
    title="Organized radial layout"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" stroke-dasharray="2 2" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <circle cx="18.9" cy="8" r="1.5" fill="currentColor" />
      <circle cx="18.9" cy="16" r="1.5" fill="currentColor" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
      <circle cx="5.1" cy="16" r="1.5" fill="currentColor" />
      <circle cx="5.1" cy="8" r="1.5" fill="currentColor" />
    </svg>
    Radial
  </button>
  <button
    type="button"
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all {$layoutMode === 'physics' ? 'bg-white/15 text-white' : 'text-graph-muted hover:text-white hover:bg-white/5'}"
    onclick={() => setLayoutMode('physics')}
    title="Physics-based dynamic layout"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="6" cy="14" r="2" />
      <circle cx="14" cy="12" r="2" />
      <circle cx="18" cy="17" r="2" />
      <circle cx="9" cy="19" r="2" />
      <line x1="7" y1="6" x2="10" y2="5" opacity="0.5" />
      <line x1="14" y1="5" x2="17" y2="7" opacity="0.5" />
      <line x1="8" y1="14" x2="12" y2="12" opacity="0.5" />
      <line x1="16" y1="12" x2="18" y2="15" opacity="0.5" />
      <line x1="11" y1="19" x2="14" y2="14" opacity="0.5" />
    </svg>
    Physics
  </button>
</div>
