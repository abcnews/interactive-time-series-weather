<script lang="ts">
  /**
   * @file Renders an SVG path connecting data points in a line chart.
   */

  import { getContext } from 'svelte';

  const { data, xGet, yGet } = getContext<any>('LayerCake');

  let path = $derived('M' + $data.map((d: any) => $xGet(d) + ',' + $yGet(d)).join('L'));
</script>

<path class="path-line" d={path}></path>

<style>
  .path-line {
    fill: none;
    stroke: var(--weather-viz-metric-colour);
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-width: 1;
  }
</style>
