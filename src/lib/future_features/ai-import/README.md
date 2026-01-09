# AI Import Feature (Disabled)

This feature allows users to import data from any format (text, images, PDFs, etc.) by sending it to an AI-powered n8n webhook that extracts structured data.

## Webhook Endpoints

- **Builder (nodes):** `https://n8n.nullis.pl/webhook/ai-import-nodes`
- **Explorer (trips):** `https://n8n.nullis.pl/webhook/ai-import-trips`

## Re-enable in Builder Mode (Sidebar.svelte)

### 1. Add state and constants:

```typescript
let aiFileInputRef = $state<HTMLInputElement | null>(null);

// n8n webhook URL for AI import
const AI_IMPORT_WEBHOOK = 'https://n8n.nullis.pl/webhook/ai-import-nodes';
```

### 2. Add trigger function:

```typescript
function triggerAIImport(): void {
  aiFileInputRef?.click();
}
```

### 3. Add handler function:

```typescript
// Handle AI-powered import (sends to n8n webhook)
async function handleAIFileImport(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isImporting = true;

  try {
    const content = await file.text();

    // Send to n8n webhook for AI processing
    const response = await fetch(AI_IMPORT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        content,
        type: 'builder-nodes',
      }),
    });

    if (!response.ok) {
      throw new Error(`AI import failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.nodes && Array.isArray(result.nodes)) {
      loadData({
        version: '1.0',
        meta: { title: 'AI Imported Graph' },
        nodes: result.nodes,
        edges: result.edges || [],
      });
      toastStore.success(`AI imported ${result.nodes.length} nodes`);
    } else {
      throw new Error('Invalid response from AI import');
    }
  } catch (error) {
    console.error('AI Import failed:', error);
    toastStore.error(error instanceof Error ? error.message : 'AI import failed');
  } finally {
    isImporting = false;
    target.value = '';
  }
}
```

### 4. Add hidden file input:

```svelte
<input
  type="file"
  bind:this={aiFileInputRef}
  onchange={handleAIFileImport}
  accept="*/*"
  class="hidden"
/>
```

### 5. Add button in template:

```svelte
<button
  type="button"
  class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm transition-colors"
  class:opacity-50={isImporting}
  disabled={isImporting}
  onclick={triggerAIImport}
>
  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="16" cy="14" r="1" />
  </svg>
  AI Import (any format)
</button>
```

---

## Re-enable in Explorer Mode (GlobeControls.svelte)

### 1. Add state and constants:

```typescript
let aiFileInput: HTMLInputElement;

const AI_IMPORT_WEBHOOK = 'https://n8n.nullis.pl/webhook/ai-import-trips';
```

### 2. Add trigger and handler:

```typescript
function triggerAIImport(): void {
  aiFileInput?.click();
}

async function handleAIFileImport(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isImporting = true;
  try {
    const content = await file.text();

    const response = await fetch(AI_IMPORT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        content: content,
        type: 'traveler-trips',
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Import failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.trips && Array.isArray(result.trips)) {
      result.trips.forEach((trip: any) => {
        if (trip.label && trip.metadata?.locations?.length > 0) {
          travelerStore.addTrip({
            id: `ai-import-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'trip',
            label: trip.label,
            description: trip.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceMode: 'traveler',
            metadata: trip.metadata,
          });
        }
      });
      toastStore.success(`AI imported ${result.trips.length} trip${result.trips.length > 1 ? 's' : ''}!`);
    } else {
      toastStore.warning('AI could not parse any trips from the file.');
    }
  } catch (error) {
    console.error('AI Import error:', error);
    toastStore.error(`AI Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    isImporting = false;
    target.value = '';
  }
}
```

### 3. Add hidden input and button:

```svelte
<input
  type="file"
  bind:this={aiFileInput}
  onchange={handleAIFileImport}
  accept="*/*"
  class="hidden"
/>

<button type="button" class="data-btn ai-import" onclick={triggerAIImport} disabled={isImporting}>
  <svg><!-- AI robot icon --></svg>
  {isImporting ? 'Processing...' : 'AI Import (any format)'}
</button>
```

### 4. Add CSS:

```css
.ai-import {
  background: rgba(147, 51, 234, 0.2);
  border-color: rgba(147, 51, 234, 0.3);
  color: rgb(216, 180, 254);
}

.ai-import:hover:not(:disabled) {
  background: rgba(147, 51, 234, 0.3);
  border-color: rgba(147, 51, 234, 0.5);
}
```

---

## n8n Webhook Response Format

### Builder (nodes):
```json
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Node Name",
      "type": "skill|goal|project|source|cert|concept",
      "description": "Optional description",
      "date": "2024-01-15"
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "from": "source-node-id",
      "to": "target-node-id",
      "label": "relationship"
    }
  ]
}
```

### Explorer (trips):
```json
{
  "trips": [
    {
      "label": "Trip Name",
      "description": "Trip description",
      "metadata": {
        "startDate": "2024-03-15",
        "endDate": "2024-03-20",
        "category": "leisure|business|adventure|family|nomad",
        "locations": [
          {
            "city": "Tokyo",
            "country": "Japan",
            "countryCode": "JP",
            "lat": 35.6762,
            "lng": 139.6503,
            "order": 1
          }
        ],
        "highlights": ["Highlight 1", "Highlight 2"]
      }
    }
  ]
}
```
