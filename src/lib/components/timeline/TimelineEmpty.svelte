<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<div class="timeline-empty {className}">
  <div class="empty-content">
    <div class="icon-container">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="12" r="10" stroke-dasharray="4 2" />
        <path d="M2 12h20" opacity="0.3" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" opacity="0.3" />
        <path d="M8 9l4 3-4 3" />
      </svg>
    </div>

    <h2 class="empty-title">Your journey awaits</h2>
    <p class="empty-description">
      Start documenting your travels by adding your first trip.
      Each journey becomes a chapter in your story.
    </p>

    <div class="empty-cta">
      <svg class="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
      <span>Add your first trip to get started</span>
    </div>
  </div>
</div>

<style>
  .timeline-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 4rem 2rem;
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 400px;
  }

  .icon-container {
    margin-bottom: 2rem;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    color: rgba(0, 212, 255, 0.4);
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-10px) rotate(5deg);
    }
  }

  .empty-title {
    margin: 0 0 1rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: white;
    letter-spacing: -0.02em;
  }

  .empty-description {
    margin: 0 0 2rem;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.6;
  }

  .empty-cta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 12px;
    color: #00d4ff;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .cta-icon {
    width: 20px;
    height: 20px;
  }
</style>
