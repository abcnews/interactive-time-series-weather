<script lang="ts">
  /**
   * @file Displays a value label positioned at a data point location.
   *
   * A native SVG component used for static labels (High/Low points).
   */
  import { getContext, untrack } from 'svelte';

  interface Props {
    data: any;
    value: string; // Formatted value string (e.g., "25km/h")
    alignment?: 'above' | 'below';
    highlight?: boolean;
    class: string;
  }

  let { data, value, alignment = 'above', highlight = false, class: className }: Props = $props();

  let textEl = $state<SVGTextElement | null>(null);
  let width = $state(0);
  let height = $state(0);
  const { xGet, yGet, width: chartWidth, height: chartHeight } = getContext<any>('LayerCake');

  const margin = 10;

  // Persistent state for current alignment flips
  let hAlign = $state<'center' | 'left' | 'right'>('center');
  let vAlign = $state<'above' | 'below'>(untrack(() => alignment));

  // Measure SVG text dimensions
  $effect(() => {
    if (textEl) {
      const bbox = textEl.getBBox();
      width = bbox.width;
      height = bbox.height;
    }
  });

  // Monitor boundaries and trigger stateful flips. Don't derive this because we
  // want our labels to stay stable rather than flipping all over the place as
  // the values themselves flip-flop.
  $effect(() => {
    const x = $xGet(data);
    const y = $yGet(data);
    const w = width || 40;
    const h = height || 15;

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

    if (vAlign === 'above') {
      if (y - h - margin < 0) vAlign = 'below';
    } else {
      if (y + h + margin > $chartHeight) vAlign = 'above';
    }
  });

  // Derived anchor properties for SVG text
  let textAnchor = $derived(hAlign === 'left' ? 'end' : hAlign === 'right' ? 'start' : 'middle');
  let dominantBaseline = $derived(vAlign === 'above' ? 'auto' : 'hanging');
  let dx = $derived(hAlign === 'left' ? -margin : hAlign === 'right' ? margin : 0);
  let dy = $derived(vAlign === 'above' ? -margin : margin);
</script>

<g class="{className || ''} value-label" class:highlight>
  <text
    bind:this={textEl}
    x={$xGet(data)}
    y={$yGet(data)}
    {dx}
    {dy}
    text-anchor={textAnchor}
    dominant-baseline={dominantBaseline}
  >
    {value}
  </text>
</g>

<style>
  .value-label text {
    fill: var(--theme-text);
    stroke: var(--theme-shadow);
    stroke-width: 3px;
    paint-order: stroke fill;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    transition: all 0.2s ease;
    pointer-events: none;
    -webkit-font-smoothing: antialiased;
  }

  .highlight text {
    font-weight: 700;
  }
</style>
