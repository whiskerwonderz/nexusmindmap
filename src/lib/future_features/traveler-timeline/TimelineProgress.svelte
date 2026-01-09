<script lang="ts">
  interface Props {
    progress: number;
    class?: string;
  }

  let { progress, class: className = '' }: Props = $props();

  // Clamp progress between 0 and 1
  const clampedProgress = $derived(Math.max(0, Math.min(1, progress)));
  const percentage = $derived(Math.round(clampedProgress * 100));
</script>

<div class="progress-container {className}">
  <div class="progress-bar">
    <div class="progress-track">
      <div
        class="progress-fill"
        style="width: {clampedProgress * 100}%"
      >
        <div class="progress-glow"></div>
      </div>
    </div>

    <div
      class="progress-thumb"
      style="left: {clampedProgress * 100}%"
    >
      <div class="thumb-ring"></div>
    </div>
  </div>

  <div class="progress-label">
    <span class="label-text">Timeline Progress</span>
    <span class="label-value">{percentage}%</span>
  </div>
</div>

<style>
  .progress-container {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 50;
  }

  .progress-bar {
    position: relative;
    width: 200px;
    height: 4px;
  }

  .progress-track {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    position: relative;
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #a855f7);
    border-radius: 2px;
    transition: width 0.1s ease-out;
  }

  .progress-glow {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 10px;
    background: #00d4ff;
    filter: blur(8px);
    opacity: 0.8;
  }

  .progress-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    transition: left 0.1s ease-out;
  }

  .thumb-ring {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 50%;
    box-shadow:
      0 0 0 2px rgba(0, 212, 255, 0.5),
      0 0 10px rgba(0, 212, 255, 0.5),
      0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .progress-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.375rem 0.75rem;
    background: rgba(15, 15, 25, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }

  .label-text {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #00d4ff;
    min-width: 2.5rem;
    text-align: right;
  }
</style>
