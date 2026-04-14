<script lang="ts">
  /**
   * @file Renders a filled area beneath a line chart using D3's area generator.
   */

  import { getContext } from 'svelte';
  import { area, curveLinear } from 'd3-shape';

  let { fill = '#ab00d610', curve = curveLinear, opacity = '1' } = $props();

  const { data, xGet, yGet, yScale } = getContext<any>('LayerCake');

  let path = $derived(
    area()
      .x($xGet as any)
      .y1($yGet as any)
      .y0((d: any) => $yScale(0))
      .curve(curve)($data)
  );
</script>

<path class="path-area" d={path} {fill} {opacity}></path>
