<script>
  /**
   * @file Renders a data point as an SVG circle with color based on the metric value.
   */

  import { getContext } from 'svelte';

  export let data;

  const { xGet, yGet, y, custom } = getContext('LayerCake');
</script>

<circle cx={$xGet(data)} cy={$yGet(data)} r="4.5" fill={$custom.gradientScale($y(data))} />
