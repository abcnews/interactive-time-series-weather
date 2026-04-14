<script lang="ts">
  /**
   * @file Renders an SVG path connecting data points in a line chart.
   */

  import { getContext } from 'svelte';

  const { data, xGet, yGet, width, height } = getContext<any>('LayerCake');

  let path = $derived('M' + $data.map((d: any) => $xGet(d) + ',' + $yGet(d)).join('L'));

  $effect(() => {
    console.log('[Line] Dimensions:', { width: $width, height: $height });
    const yValues = $data.map((d: any) => $yGet(d));
    const outOfBounds = yValues.filter((y: number) => y < 0 || y > $height);
    if (outOfBounds.length > 0) {
      console.warn('[Line] Points out of bounds:', outOfBounds);
    }
  });
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
