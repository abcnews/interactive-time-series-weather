<script lang="ts">
  /**
   * @file Displays a value label positioned at a data point location.
   *
   * A dumb component that displays formatted values at specified positions.
   * Can be shown above or below the data point, optionally highlighted, and can display time information.
   */

  import { getContext } from 'svelte';

  interface Props {
    data: any;
    value: string; // Formatted value string (e.g., "25km/h")
    timeDisplay?: string; // Optional formatted time string
    alignment?: 'above' | 'below';
    showTime?: boolean;
    highlight?: boolean;
  }

  let { data, value, timeDisplay, alignment = 'above', showTime = false, highlight = false }: Props = $props();

  let width = $state(0);
  const { xGet, yGet, width: chartWidth } = getContext<any>('LayerCake');
</script>

<div
  class="value-label"
  bind:clientWidth={width}
  style:left="{Math.round(Math.min($chartWidth - width / 2, Math.max($xGet(data), width / 2)))}px"
  class:below={alignment === 'below'}
  class:tooltip={showTime}
  class:highlight
  style:top="{Math.round($yGet(data))}px"
>
  {value}
  {#if showTime && timeDisplay}
    <time>{timeDisplay}</time>
  {/if}
</div>

<style>
  .value-label {
    position: absolute;
    transform: translate(-50%, calc(-100% - 10px));
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: var(--theme-shadow);
    color: var(--theme-text);
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 15px; /* 125% */
    white-space: nowrap;
  }

  .highlight {
    font-size: 12px;
    -webkit-text-stroke: 3px var(--theme-shadow);
    paint-order: markers stroke fill;
  }

  .tooltip {
    text-align: center;
    padding: 3px;
    border-radius: 2px;
    background: var(--theme-tooltip-bg);
    color: var(--theme-text);
    -webkit-text-stroke: 0;
  }

  .below {
    transform: translate(-50%, 10px);
    -webkit-text-stroke: 3px var(--theme-shadow);
    paint-order: markers stroke fill;
  }

  time {
    display: block;
    margin: 0;
  }
</style>
