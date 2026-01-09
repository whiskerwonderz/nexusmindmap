# Builder Timeline Feature (Disabled)

This folder contains the Timeline layout feature for Builder mode, disabled for the initial release.

## Files

- `TimelineAxis.svelte` - Renders year markers and swim lanes
- `TimelineControls.svelte` - Play/pause, range slider controls

## To Re-enable

### 1. Move components back
Move `TimelineAxis.svelte` and `TimelineControls.svelte` to `src/lib/components/graph/`

### 2. Update LayoutSwitcher.svelte
Add 'timeline' back to builderLayouts:
```typescript
const builderLayouts = ['radial', 'physics', 'cluster', 'hierarchical', 'timeline'] as const;
```

### 3. Update GraphCanvas.svelte

Add imports:
```typescript
import TimelineAxis from './TimelineAxis.svelte';
import TimelineControls from './TimelineControls.svelte';
```

Add to layout store imports:
```typescript
import {
  // ... existing imports
  timelineState,
  setTimelineDateBounds,
  setTimelineHoverX,
  setTimelinePlayProgress,
  resetTimelineState,
  type TimelineState
} from '$lib/stores/layout';
```

Add to layouts engine imports:
```typescript
import {
  // ... existing imports
  computeTimelineLayout,
  getTimelineAxisData,
} from '$lib/engine/layouts';
```

Add state:
```typescript
let isScrubbing = $state(false);

let timelineAxisData = $state<{
  years: { year: number; x: number }[];
  swimLanes: { type: any; label: string; y: number }[];
}>({ years: [], swimLanes: [] });
```

Add helper functions:
```typescript
function parseDate(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function getProgressFromX(x: number): number {
  const padding = 80;
  const trackWidth = width - padding * 2;
  const progress = (x - padding) / trackWidth;
  return Math.max(0, Math.min(1, progress));
}

function calculateDateBounds(nodeList: GraphNodeType[]): { min: number; max: number } {
  const dates = nodeList
    .map(n => parseDate(n.date))
    .filter((d): d is number => d !== null);

  if (dates.length === 0) {
    return { min: Date.now(), max: Date.now() };
  }

  return {
    min: Math.min(...dates),
    max: Math.max(...dates)
  };
}
```

Add to applyCurrentLayout switch:
```typescript
case 'timeline':
  const timelineNodes = computeTimelineLayout(currentNodes, currentEdges, config);
  animateToPositions(timelineNodes);
  timelineAxisData = getTimelineAxisData(currentNodes, config);
  const bounds = calculateDateBounds(currentNodes);
  setTimelineDateBounds(bounds.min, bounds.max);
  clusterBackgrounds = [];
  break;
```

Add timeline reset when leaving timeline mode:
```typescript
// In applyCurrentLayout, before the switch:
if (previousMode === 'timeline' && mode !== 'timeline') {
  resetTimelineState();
}
```

Add to handleMouseMove:
```typescript
if (get(layoutMode) === 'timeline') {
  setTimelineHoverX(x);
  if (isScrubbing) {
    const progress = getProgressFromX(x);
    setTimelinePlayProgress(progress);
  }
}
```

Add handleMouseLeave:
```typescript
function handleMouseLeave() {
  if (get(layoutMode) === 'timeline') {
    setTimelineHoverX(null);
  }
}
```

Add to handleCanvasMouseDown:
```typescript
if (get(layoutMode) === 'timeline' && isBackground) {
  const rect = svgElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const progress = getProgressFromX(x);
  isScrubbing = true;
  setTimelinePlayProgress(progress);
}
```

Add to handleMouseUp:
```typescript
isScrubbing = false;
```

Add derived state:
```typescript
const isTimelineMode = $derived($layoutMode === 'timeline');
```

Add to SVG (after grid rect):
```svelte
{#if isTimelineMode && timelineAxisData.years.length > 0}
  <TimelineAxis
    years={timelineAxisData.years}
    swimLanes={timelineAxisData.swimLanes}
    {width}
    {height}
    padding={80}
  />
{/if}
```

Add after closing </svg> tag:
```svelte
{#if isTimelineMode}
  <div class="timeline-controls-container">
    <TimelineControls {width} padding={80} />
  </div>
{/if}
```

Add CSS:
```css
.timeline-controls-container {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
}
```
