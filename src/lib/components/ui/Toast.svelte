<script lang="ts">
  import { toastStore, type Toast } from '$lib/stores/toastStore.svelte';

  const toasts = $derived(toastStore.toasts);

  function getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '!';
      case 'info':
      default: return 'i';
    }
  }
</script>

{#if toasts.length > 0}
  <div class="toast-container" role="status" aria-live="polite">
    {#each toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}" role="alert">
        <span class="toast-icon">{getIcon(toast.type)}</span>
        <span class="toast-message">{toast.message}</span>
        <button
          type="button"
          class="toast-close"
          onclick={() => toastStore.remove(toast.id)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 1000;
    max-width: 360px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    color: white;
    font-size: 0.875rem;
    pointer-events: auto;
    animation: slideIn 0.25s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .toast-success .toast-icon {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .toast-error .toast-icon {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .toast-warning .toast-icon {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .toast-info .toast-icon {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }

  .toast-success {
    border-color: rgba(34, 197, 94, 0.3);
  }

  .toast-error {
    border-color: rgba(239, 68, 68, 0.3);
  }

  .toast-warning {
    border-color: rgba(251, 191, 36, 0.3);
  }

  .toast-info {
    border-color: rgba(0, 212, 255, 0.3);
  }

  .toast-message {
    flex: 1;
    line-height: 1.4;
  }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.625rem;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  @media (max-width: 480px) {
    .toast-container {
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
      max-width: none;
    }
  }
</style>
