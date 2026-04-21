<script lang="ts">
  import { getContext } from 'svelte';

  let { class: className } = $props();
  const { xScale, height, width } = getContext<any>('LayerCake');

  /**
   * Format the date for the X axis labels.
   * e.g., "21 Mar"
   */
  const formatTick = (d: number | Date) => {
    const date = new Date(d);
    return date.toLocaleString('en-AU', { day: 'numeric', month: 'short' });
  };

  // Find every midnight local time within the chart's current domain
  let midnights = $derived.by(() => {
    const [min, max] = $xScale.domain();
    const result: number[] = [];
    const curr = new Date(min);

    // Normalize to the start of the day
    curr.setHours(0, 0, 0, 0);

    // If our start midnight is before the domain start, move to the next one
    if (curr.getTime() < min) {
      curr.setDate(curr.getDate() + 1);
    }

    while (curr.getTime() <= max) {
      result.push(curr.getTime());
      curr.setDate(curr.getDate() + 1);
    }

    return result;
  });

  // Calculate density: show fewer ticks on smaller screens to prevent overlap.
  // We assume a minimum of ~80px is needed per "21 Mar" label for comfortable breathing room.
  let visibleTicks = $derived.by(() => {
    const totalMidnights = midnights.length;
    if (totalMidnights === 0) return [];

    const maxReasonableLabels = Math.max(1, Math.floor($width / 80));
    const every = Math.ceil(totalMidnights / maxReasonableLabels);

    return midnights.filter((_, i) => i % every === 0);
  });

  // Calculate text-anchor based on position to prevent edge clipping
  function getAnchor(tick: number) {
    const xPos = $xScale(tick);
    if (xPos < 20) return 'start';
    if ($width - xPos < 20) return 'end';
    return 'middle';
  }
</script>

<g class="{className || ''} axis">
  {#each visibleTicks as tick}
    {@const xPos = Math.round($xScale(tick))}
    <g class="tick" transform="translate({xPos}, {Math.round($height)})">
      <!-- No ticks requested. y=28 provides a ~20px gap between chart bottom and top of 10px text -->
      <text y="20" text-anchor={getAnchor(tick)} class="tick-label">
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
    line-height: normal;
  }
</style>
