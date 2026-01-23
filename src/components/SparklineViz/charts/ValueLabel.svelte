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
  bind:clientWidth={width}
  style:left="{Math.min($chartWidth - width / 2, Math.max($xGet(data), width / 2))}px"
  class:below={alignment === 'below'}
  class:tooltip={showTime}
  class:highlight
  style:top="{$yGet(data)}px"
>
  {value}
  {#if showTime && timeDisplay}
    <time>{timeDisplay}</time>
  {/if}
</div>

<style>
  div {
    position: absolute;
    font-weight: bold;
    font-size: 0.875rem;
    transform: translate(-50%, calc(-100% - 10px));
    line-height: 1.1;
    white-space: nowrap;
  }

  .highlight {
    font-size: 1rem;
    --shadow: white;
    -webkit-text-stroke: 3px var(--shadow);
    paint-order: markers stroke fill;
    :global([data-scheme='dark']) & {
      --shadow: black;
    }
  }

  .tooltip {
    text-align: center;
    padding: 3px;
    border-radius: 2px;
    background: white;
    color: black;
  }

  .below {
    transform: translate(-50%, 10px);
    --shadow: white;
    -webkit-text-stroke: 3px var(--shadow);
    paint-order: markers stroke fill;
    :global([data-scheme='dark']) & {
      --shadow: black;
    }
  }

  time {
    display: block;
    margin: 0;
  }
</style>
