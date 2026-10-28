<script lang="ts">
  /**
   * @file Renders a filled area beneath a line chart using D3's area generator.
   */

  import { getContext } from 'svelte';
  import { area, curveLinear } from 'd3-shape';

  let { fill = '#ab00d610', curve = curveLinear, opacity = '1', class: className } = $props();

  const { data, xGet, yGet, yScale, height } = getContext<any>('LayerCake');

  // A point with `gapBefore: true` starts a new segment, so the fill stops at missing data and restarts after it.
  let path = $derived.by(() => {
    const generator = area()
      .x((d: any) => Math.round($xGet(d)))
      .y1((d: any) => Math.round($yGet(d)))
      .y0((d: any) => Math.round($height))
      .curve(curve);

    const segments: any[][] = [];
    for (const d of $data as any[]) {
      if (d.gapBefore || segments.length === 0) segments.push([]);
      segments[segments.length - 1].push(d);
    }
    return segments.map(segment => generator(segment) ?? '').join('');
  });
</script>

<path class="{className || ''} path-area" d={path} {fill} {opacity}></path>
