<script lang="ts">
  import { travelerStore } from '$lib/stores/travelerStore.svelte';
  import { toastStore } from '$lib/stores/toastStore.svelte';
  import { importFromJSON, importFromCSV, validateImportedTrips, downloadTravelerTripsTemplate } from '$lib/utils/dataExport';
  import type { TripNode } from '$lib/types/traveler';

  interface Props {
    onTripSelect?: (trip: TripNode) => void;
    onAddTrip?: () => void;
    onEditTrip?: (trip: TripNode) => void;
    class?: string;
  }

  let {
    onTripSelect,
    onAddTrip,
    onEditTrip,
    class: className = '',
  }: Props = $props();

  let searchQuery = $state('');
  let sortBy = $state<'date' | 'duration' | 'name'>('date');
  let tripToDelete = $state<TripNode | null>(null);
  let showDeleteConfirm = $state(false);
  let fileInput: HTMLInputElement;
  let isImporting = $state(false);

  const trips = $derived(travelerStore.trips);

  function handleEditClick(e: Event, trip: TripNode): void {
    e.stopPropagation();
    onEditTrip?.(trip);
  }

  function handleDeleteClick(e: Event, trip: TripNode): void {
    e.stopPropagation();
    tripToDelete = trip;
    showDeleteConfirm = true;
  }

  function confirmDelete(): void {
    if (tripToDelete) {
      const tripName = tripToDelete.label;
      travelerStore.removeTrip(tripToDelete.id);
      toastStore.success(`"${tripName}" deleted`);
      tripToDelete = null;
      showDeleteConfirm = false;
    }
  }

  function cancelDelete(): void {
    tripToDelete = null;
    showDeleteConfirm = false;
  }

  const filteredTrips = $derived.by(() => {
    let result = [...trips];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(trip =>
        trip.label.toLowerCase().includes(query) ||
        trip.metadata.locations.some(loc =>
          loc.city.toLowerCase().includes(query) ||
          loc.country.toLowerCase().includes(query)
        )
      );
    }

    // Sort
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.metadata.startDate).getTime() - new Date(a.metadata.startDate).getTime());
        break;
      case 'duration':
        result.sort((a, b) => (b.metadata.durationDays ?? 0) - (a.metadata.durationDays ?? 0));
        break;
      case 'name':
        result.sort((a, b) => a.label.localeCompare(b.label));
        break;
    }

    return result;
  });

  function formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
    }
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
  }

  function getLocationSummary(trip: TripNode): string {
    const cities = trip.metadata.locations.map(l => l.city);
    if (cities.length <= 2) return cities.join(' → ');
    return `${cities[0]} → ... → ${cities[cities.length - 1]}`;
  }

  function triggerImport(): void {
    fileInput?.click();
  }

  async function handleFileImport(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    isImporting = true;
    try {
      const isCSV = file.name.toLowerCase().endsWith('.csv');

      if (isCSV) {
        const trips = await importFromCSV(file);
        if (trips.length > 0) {
          trips.forEach(trip => travelerStore.addTrip(trip));
          toastStore.success(`Imported ${trips.length} trip${trips.length > 1 ? 's' : ''} from CSV`);
        } else {
          toastStore.warning('No valid trips found in the CSV file');
        }
      } else {
        const data = await importFromJSON(file);
        if (data.type === 'trips' && data.trips) {
          const validTrips = validateImportedTrips(data.trips);
          if (validTrips.length > 0) {
            validTrips.forEach(trip => travelerStore.addTrip(trip));
            toastStore.success(`Imported ${validTrips.length} trip${validTrips.length > 1 ? 's' : ''}`);
          } else {
            toastStore.warning('No valid trips found in the file');
          }
        }
      }
    } catch (error) {
      toastStore.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isImporting = false;
      target.value = '';
    }
  }
</script>

<div class="trip-list {className}">
  <header class="list-header">
    <div class="header-row">
      <h3 class="list-title">Your Trips</h3>
      <span class="trip-count">{trips.length}</span>
    </div>
    {#if onAddTrip}
      <button type="button" class="add-trip-btn" onclick={onAddTrip}>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Trip
      </button>
    {/if}
    <div class="import-actions">
      <button type="button" class="template-btn" onclick={downloadTravelerTripsTemplate} title="Download CSV Template">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Template
      </button>
      <button type="button" class="import-btn" onclick={triggerImport} disabled={isImporting} title="Upload CSV">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {isImporting ? 'Uploading...' : 'Upload'}
      </button>
    </div>
    <input
      type="file"
      accept=".csv,.json"
      class="hidden-input"
      bind:this={fileInput}
      onchange={handleFileImport}
    />
  </header>

  <div class="search-bar">
    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      placeholder="Search trips..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <div class="sort-controls">
    <span class="sort-label">Sort by:</span>
    <div class="sort-buttons">
      <button
        type="button"
        class="sort-btn"
        class:active={sortBy === 'date'}
        onclick={() => sortBy = 'date'}
      >
        Date
      </button>
      <button
        type="button"
        class="sort-btn"
        class:active={sortBy === 'duration'}
        onclick={() => sortBy = 'duration'}
      >
        Duration
      </button>
      <button
        type="button"
        class="sort-btn"
        class:active={sortBy === 'name'}
        onclick={() => sortBy = 'name'}
      >
        Name
      </button>
    </div>
  </div>

  <div class="trips-container">
    {#each filteredTrips as trip (trip.id)}
      <div class="trip-card" role="button" tabindex="0" onclick={() => onTripSelect?.(trip)} onkeydown={(e) => e.key === 'Enter' && onTripSelect?.(trip)}>
        <div class="trip-header">
          <span class="trip-name">{trip.label}</span>
          <div class="trip-actions">
            <span class="trip-duration">{trip.metadata.durationDays ?? 0}d</span>
            {#if onEditTrip}
              <button type="button" class="action-btn edit" onclick={(e) => handleEditClick(e, trip)} title="Edit trip">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            {/if}
            <button type="button" class="action-btn delete" onclick={(e) => handleDeleteClick(e, trip)} title="Delete trip">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="trip-route">{getLocationSummary(trip)}</div>
        <div class="trip-meta">
          <span class="trip-dates">{formatDateRange(trip.metadata.startDate, trip.metadata.endDate)}</span>
          <span class="trip-countries">{trip.metadata.locations.length} stops</span>
        </div>
      </div>
    {:else}
      <div class="empty-state">
        {#if searchQuery}
          <p>No trips match "{searchQuery}"</p>
        {:else}
          <p>No trips yet</p>
          {#if onAddTrip}
            <button type="button" class="add-first-btn" onclick={onAddTrip}>
              Add your first trip
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Delete Confirmation Dialog -->
{#if showDeleteConfirm && tripToDelete}
  <div class="delete-overlay" onclick={cancelDelete} role="dialog" aria-modal="true">
    <div class="delete-dialog" onclick={(e) => e.stopPropagation()}>
      <h4>Delete Trip?</h4>
      <p>Are you sure you want to delete "<strong>{tripToDelete.label}</strong>"? This action cannot be undone.</p>
      <div class="delete-actions">
        <button type="button" class="btn-cancel" onclick={cancelDelete}>Cancel</button>
        <button type="button" class="btn-delete" onclick={confirmDelete}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .trip-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .list-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .list-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
  }

  .trip-count {
    padding: 0.125rem 0.5rem;
    background: rgba(0, 212, 255, 0.15);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #00d4ff;
  }

  .add-trip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(168, 85, 247, 0.2));
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-trip-btn:hover {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(168, 85, 247, 0.3));
    border-color: rgba(0, 212, 255, 0.5);
  }

  .import-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .import-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .import-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .import-actions {
    display: flex;
    gap: 0.375rem;
  }

  .template-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.25);
    border-radius: 6px;
    color: #22c55e;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .template-btn:hover {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
  }

  .hidden-input {
    display: none;
  }

  .search-bar {
    position: relative;
    margin-bottom: 0.75rem;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.875rem;
    color: white;
    outline: none;
    transition: all 0.15s ease;
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .search-input:focus {
    border-color: rgba(0, 212, 255, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .sort-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .sort-buttons {
    display: flex;
    gap: 0.25rem;
  }

  .sort-btn {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sort-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .sort-btn.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
  }

  .trips-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
  }

  .trip-card {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .trip-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .trip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .trip-name {
    font-size: 0.9375rem;
    font-weight: 500;
    color: white;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trip-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .trip-duration {
    padding: 0.125rem 0.375rem;
    background: rgba(251, 191, 36, 0.15);
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #fbbf24;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s ease;
    opacity: 0;
  }

  .trip-card:hover .action-btn {
    opacity: 1;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .action-btn.edit:hover {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .trip-route {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .trip-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
  }

  .add-first-btn {
    padding: 0.5rem 1rem;
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 6px;
    font-size: 0.8125rem;
    color: #00d4ff;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-first-btn:hover {
    background: rgba(0, 212, 255, 0.25);
  }

  /* Delete Confirmation Dialog */
  .delete-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .delete-dialog {
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 360px;
    width: 90%;
  }

  .delete-dialog h4 {
    margin: 0 0 0.75rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
  }

  .delete-dialog p {
    margin: 0 0 1.25rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
  }

  .delete-dialog strong {
    color: white;
  }

  .delete-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn-cancel,
  .btn-delete {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-delete {
    background: rgba(239, 68, 68, 0.9);
    border: none;
    color: white;
  }

  .btn-delete:hover {
    background: rgba(239, 68, 68, 1);
  }
</style>
