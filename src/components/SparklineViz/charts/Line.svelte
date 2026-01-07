<script>
  /**
   * @file Renders an SVG path connecting data points in a line chart.
   */

  import { getContext } from 'svelte';

  const { data, xGet, yGet, yScale, extents } = getContext('LayerCake');

  /** @type {String} [stroke='#ab00d6'] - The shape's fill color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
  export let stroke = '#ab00d6';

  // Stroking with a gradient doesn't work on a completely horizontal or vertical line, so we fudge the data a tiny bit
  // if it looks like that.
  $: possiblyVertical = $xGet($data[0]) === $xGet($data[$data.length - 1]);
  $: possiblyHorizontal = $yGet($data[0]) === $yGet($data[$data.length - 1]);

  $: path =
    'M' +
    $data
      .map(
        (d, i) =>
          (possiblyVertical && i === 0 ? $xGet(d) - 1 : $xGet(d)) +
          ',' +
          (possiblyHorizontal && i === 0 ? $yGet(d) + 1 : $yGet(d))
      )
      .join('L');
</script>

<path class="path-line" d={path} {stroke}></path>

<style>
  .path-line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-width: 3;
  }
</style>
