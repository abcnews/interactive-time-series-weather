<script lang="ts">
  /**
   * @file Renders an SVG path connecting data points in a line chart.
   */

  import { getContext } from 'svelte';

  let { class: className } = $props();
  const { data, xGet, yGet, width, height } = getContext<any>('LayerCake');

  // A point with `gapBefore: true` starts a new segment, so no line is drawn between it and the previous point.
  let path = $derived.by(() => {
    const segments: string[] = [];
    let current: string[] = [];
    const flush = () => {
      // A lone point between two gaps would draw nothing; a zero-length line renders as a dot via the round linecap.
      if (current.length === 1) segments.push(`M${current[0]}h0`);
      else if (current.length > 1) segments.push('M' + current.join('L'));
      current = [];
    };
    for (const d of $data) {
      if (d.gapBefore) flush();
      current.push(Math.round($xGet(d)) + ',' + Math.round($yGet(d)));
    }
    flush();
    return segments.join('');
  });
</script>

<path class="{className + ' ' || ''}path-line" d={path}></path>

<style>
  .path-line {
    fill: none;
    stroke: var(--weather-viz-metric-colour);
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-width: 1;
  }
</style>
