<script lang="ts">
  interface Props {
    src?: string;
    alt?: string;
    class?: string;
  }

  let { src, alt = 'Photo', class: className = '' }: Props = $props();
</script>

<div class="photo-slot {className}" class:has-photo={!!src}>
  {#if src}
    <img {src} {alt} class="photo-image" />
  {:else}
    <div class="placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
  {/if}
</div>

<style>
  .photo-slot {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }

  .photo-slot:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .photo-slot.has-photo {
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-icon {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.2);
  }

  .photo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
