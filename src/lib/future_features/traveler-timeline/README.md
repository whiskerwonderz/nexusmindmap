# Traveler Timeline Feature (Disabled)

This feature provides a cinematic vertical timeline view for traveler mode, displaying trips chronologically with visual journey cards.

## Components

- `JourneyTimeline.svelte` - Main timeline container with scrollable trip cards
- `JourneyCard.svelte` - Individual trip card with route visualization
- `TimelineHeader.svelte` - Stats header for timeline view
- `TimelineAxis.svelte` - Horizontal axis with date markers
- `TimelineControls.svelte` - Timeline-specific controls
- `TimelineEmpty.svelte` - Empty state placeholder
- `TimelineProgress.svelte` - Progress indicator
- `TravelTimeline.svelte` - Alternative horizontal timeline view
- `YearSection.svelte` - Year grouping component
- `MiniRouteMap.svelte` - Small map preview in cards
- `PhotoSlot.svelte` - Photo placeholder slots
- `index.ts` - Component exports

## Re-enable Instructions

### 1. Move components back to main location

```bash
mv src/lib/future_features/traveler-timeline/*.svelte src/lib/components/timeline/
mv src/lib/future_features/traveler-timeline/index.ts src/lib/components/timeline/
```

### 2. Update TravelerLayout type in `src/lib/types/common.ts`

```typescript
/** Traveler mode layouts */
export type TravelerLayout =
  | 'globe'
  | 'map'
  | 'timeline';  // Add this back
```

### 3. Update TravelerView.svelte

Add import:
```typescript
import { JourneyTimeline } from '$lib/components/timeline';
```

Add timeline button in layout switcher:
```svelte
<button
  type="button"
  class="layout-btn"
  class:active={layout === 'timeline'}
  onclick={() => appStore.setTravelerLayout('timeline')}
>
  <svg class="layout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
  <span class="layout-label">Timeline</span>
</button>
```

Add timeline rendering in visualization area:
```svelte
{#if layout === 'globe'}
  <TravelGlobe ... />
{:else if layout === 'map'}
  <TravelMap ... />
{:else}
  <JourneyTimeline
    onTripClick={handleTripSelect}
    class="visualization"
  />
{/if}
```

Add timeline-mode class to container:
```svelte
<div class="traveler-view" class:timeline-mode={layout === 'timeline'}>
```

Update stats and sidebar conditionals:
```svelte
{#if layout !== 'timeline'}
  <div class="stats-section">
    <GlobeStats />
  </div>
{/if}

{#if layout !== 'timeline'}
  <aside class="sidebar">
    ...
  </aside>
{/if}
```

### 4. Add timeline-mode CSS in TravelerView.svelte

```css
.traveler-view.timeline-mode {
  grid-template-columns: 1fr;
  padding: 0;
}

.traveler-view.timeline-mode .main-content {
  gap: 0;
}

.traveler-view.timeline-mode .layout-switcher {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 60;
}

.traveler-view.timeline-mode .viz-area {
  border-radius: 0;
}
```

## Features

- Chronological trip display
- Animated journey cards
- Year-based grouping
- Mini route maps
- Photo placeholders
- Responsive design
- Smooth scrolling
