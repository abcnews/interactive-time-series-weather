<script lang="ts">
  /**
   * @file Renders a filled area beneath a line chart using D3's area generator.
   */

  import { getContext } from 'svelte';
  import { area, curveLinear } from 'd3-shape';

  let { fill = '#ab00d610', curve = curveLinear, opacity = '1', class: className } = $props();

  const { data, xGet, yGet, yScale, height } = getContext<any>('LayerCake');

  let path = $derived(
    area()
      .x((d: any) => Math.round($xGet(d)))
      .y1((d: any) => Math.round($yGet(d)))
      .y0((d: any) => Math.round($height))
      .curve(curve)($data)
  );
</script>

<path class="{className || ''} path-area" d={path} {fill} {opacity}></path>
