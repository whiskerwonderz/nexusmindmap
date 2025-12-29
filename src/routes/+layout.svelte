<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initTheme } from '$lib/stores/theme.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';

  let { children } = $props();

  onMount(() => {
    initTheme();
  });
</script>

{@render children()}
<Toast />
