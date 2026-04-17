<script lang="ts">
  /**
   * @file Renders a data point as an SVG circle with color based on the metric value or a provided solid colour.
   */

  import { getContext } from 'svelte';

  let { data, class: className } = $props();

  const { xGet, yGet } = getContext<any>('LayerCake');
</script>

<circle cx={$xGet(data)} cy={$yGet(data)} r="2.5" class="{className || ''} chart-point" />

<style>
  .chart-point {
    fill: var(--weather-viz-metric-colour);
  }
</style>
