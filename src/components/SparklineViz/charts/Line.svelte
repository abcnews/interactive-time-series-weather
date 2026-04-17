<script lang="ts">
  /**
   * @file Renders an SVG path connecting data points in a line chart.
   */

  import { getContext } from 'svelte';

  let { class: className } = $props();
  const { data, xGet, yGet, width, height } = getContext<any>('LayerCake');

  let path = $derived('M' + $data.map((d: any) => Math.round($xGet(d)) + ',' + Math.round($yGet(d))).join('L'));
</script>

<path class="{className || ''} path-line" d={path}></path>

<style>
  .path-line {
    fill: none;
    stroke: var(--weather-viz-metric-colour);
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-width: 1;
  }
</style>
