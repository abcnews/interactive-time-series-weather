<script lang="ts">
  /**
   * @file Displays a tooltip positioned at a data point location.
   *
   * An HTML component used for the active hover state.
   * Includes time information and a background.
   */

  import { getContext, untrack } from 'svelte';

  interface Props {
    data: any;
    value: string;
    timeDisplay?: string;
    alignment?: 'above' | 'below';
    class?: string;
  }

  let { data, value, timeDisplay, alignment = 'above', class: className }: Props = $props();

  let width = $state(0);
  let height = $state(0);
  const { xGet, yGet, width: chartWidth, height: chartHeight } = getContext<any>('LayerCake');

  const margin = 4;

  // Persistent state for current alignment flips
  let hAlign = $state<'center' | 'left' | 'right'>('center');
  let vAlign = $state<'above' | 'below'>(untrack(() => alignment));

  // Monitor boundaries and trigger stateful flips
  $effect(() => {
    const x = $xGet(data);
    const y = $yGet(data);
    const w = width || 40;
    const h = height || 25;

    // Horizontal Hysteresis
    if (hAlign === 'center') {
      if (x - w / 2 < 0) hAlign = 'right';
      else if (x + w / 2 > $chartWidth) hAlign = 'left';
    } else if (hAlign === 'right') {
      if (x + w + margin > $chartWidth) hAlign = 'left';
      else if (x > 50 && x < $chartWidth - 50) hAlign = 'center';
    } else if (hAlign === 'left') {
      if (x - w - margin < 0) hAlign = 'right';
      else if (x > 50 && x < $chartWidth - 50) hAlign = 'center';
    }

    // Vertical Hysteresis
    if (vAlign === 'above') {
      if (y - h - margin < 0) vAlign = 'below';
    } else {
      if (y + h + margin > $chartHeight) vAlign = 'above';
    }
  });

  // Calculate final positions
  let top = $derived.by(() => {
    const y = $yGet(data);
    const h = height || 25;
    const target = vAlign === 'above' ? y - h - margin : y + margin;
    return Math.max(0, Math.min(target, $chartHeight - h));
  });

  let left = $derived.by(() => {
    const x = $xGet(data);
    const w = width || 40;
    if (hAlign === 'center') return Math.max(w / 2, Math.min(x, $chartWidth - w / 2));
    if (hAlign === 'left') return Math.max(w, x);
    return Math.min(x, $chartWidth - w);
  });
</script>

<div
  role="tooltip"
  class="{className || ''} active-tooltip"
  bind:clientWidth={width}
  bind:clientHeight={height}
  style:left="{Math.round(left)}px"
  style:top="{Math.round(top)}px"
  class:align-left={hAlign === 'left'}
  class:align-right={hAlign === 'right'}
>
  {value}
  {#if timeDisplay}
    <time>{timeDisplay}</time>
  {/if}
</div>

<style>
  .active-tooltip {
    position: absolute;
    transform: translate(-50%, 0);
    text-align: center;
    padding: 3px;
    border-radius: 2px;
    background: var(--theme-tooltip-bg);
    color: var(--theme-text);
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 135%;
    white-space: nowrap;
    transition: transform 0.2s ease;
    pointer-events: none;
    z-index: 10;
  }

  .align-left {
    transform: translate(calc(-100% - 4px), 0);
  }

  .align-right {
    transform: translate(4px, 0);
  }

  time {
    display: block;
    margin: 0;
    font-size: 11px;
    opacity: 0.9;
  }
</style>
