<script lang="ts">
  import { getContext } from 'svelte';

  const { xScale, height, padding } = getContext<any>('LayerCake');

  /**
   * Format the date for the X axis labels.
   * e.g., "March 21"
   */
  const formatTick = (d: number) => {
    const date = new Date(d);
    const month = date.toLocaleString('en-AU', { month: 'long' });
    const day = date.toLocaleString('en-AU', { day: 'numeric' });
    return `${month} ${day}`;
  };

  // Get ticks from the scale
  let ticks = $derived($xScale.ticks(3)); // Just 3 ticks for sparkline-style charts to prevent clutter
</script>

<g class="axis x-axis">
  {#each ticks as tick}
    <g class="tick" transform="translate({Math.round($xScale(tick))}, {Math.round($height)})">
      <line y2="6"></line>
      <text y="20" text-anchor="middle" class="tick-label">
        {formatTick(tick)}
      </text>
    </g>
  {/each}
</g>

<style>
  .tick-label {
    fill: var(--theme-label);
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
    line-height: 15px; /* 150% */
  }
  line {
    stroke: var(--theme-axis);
  }
</style>
