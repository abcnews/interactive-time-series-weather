<script lang="ts">
  import { getContext } from 'svelte';

  let { class: className } = $props();
  const { yScale, width, height, custom } = getContext<any>('LayerCake');
 
  /**
   * Raw number formatting for Y axis.
   */
  const formatTick = (d: number) => $custom.formatValue(d);

  // Get ticks from the scale
  let ticks = $derived($yScale.ticks(4));

  // Ensure the top and bottom of the domain are included to "box it in"
  let displayTicks = $derived.by(() => {
    const [domainMin, domainMax] = $yScale.domain();
    const hasMin = ticks.some(t => Math.abs(t - domainMin) < 1e-6);
    const hasMax = ticks.some(t => Math.abs(t - domainMax) < 1e-6);

    let result = [...ticks];
    if (!hasMin) result.push(domainMin);
    if (!hasMax) result.push(domainMax);

    return result.sort((a, b) => a - b);
  });

  function isBoundary(tick: number) {
    const [min, max] = $yScale.domain();
    return Math.abs(tick - min) < 1e-6 || Math.abs(tick - max) < 1e-6;
  }
</script>

<g class="{className || ''} axis">
  <!-- Seamless box vertical lines -->
  <line x1="0" y1="0" x2="0" y2={Math.round($height)} class="box-line"></line>
  <line x1={Math.round($width)} y1="0" x2={Math.round($width)} y2={Math.round($height)} class="box-line"></line>

  {#each displayTicks as tick}
    <g class="tick" transform="translate(0, {Math.round($yScale(tick))})">
      <!-- Grid line / Horizontal box edge -->
      <line x2={Math.round($width)} class={isBoundary(tick) ? 'box-line' : 'grid-line'}></line>
      <text x="-8" dy="4" text-anchor="end" class="tick-label">
        {formatTick(tick)}
      </text>
    </g>
  {/each}
</g>

<style>
  .tick-label {
    fill: var(--theme-label);
    font-size: 8px;
    font-style: normal;
    font-weight: 400;
    line-height: 15px; /* 187.5% */
  }
  line {
    fill: none;
    shape-rendering: crispEdges; /* Ensure lines are sharp and touch perfectly */
    stroke-linecap: square;
  }
  .box-line {
    stroke: var(--theme-axis);
    stroke-width: 1px;
  }
  .grid-line {
    stroke: var(--theme-grid);
    stroke-width: 1px;
  }
</style>
