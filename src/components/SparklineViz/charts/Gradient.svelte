<script lang="ts">
  /**
   * @file Renders a vertical linear gradient anchored to the chart height.
   * Uses userSpaceOnUse to ensure consistent intensity across all charts.
   */

  import { getContext } from 'svelte';

  let { id, colour } = $props();

  const { height } = getContext<any>('LayerCake');
</script>

<defs>
  <linearGradient {id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={$height}>
    <stop offset="0%" stop-color={colour} stop-opacity="0.5" />
    <stop offset="100%" stop-color={colour} stop-opacity="0.1" />
  </linearGradient>
</defs>
