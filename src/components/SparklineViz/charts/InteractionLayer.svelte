<script lang="ts">
  /**
   * @file Invisible SVG layer that captures pointer events and triggers interaction callbacks.
   */

  import { getContext } from 'svelte';
  import { useInteraction } from './lib/useInteraction.js';
  import { observationHandlingLeave } from './lib/stores';

  interface Props {
    data: any[];
    onenter: (d: any) => void;
    onleave: () => void;
  }

  let props: Props = $props();

  const { xScale, width, height, padding } = getContext<any>('LayerCake');

  // Initialize the interaction hook
  const handlers = useInteraction({ 
    ...props, 
    xScale, 
    padding: $padding,
    observationHandlingLeave 
  });
</script>

<rect
  class="interaction-layer"
  x={-$padding.left}
  y={-$padding.top}
  width={$width + $padding.left + $padding.right}
  height={$height + $padding.top + $padding.bottom}
  fill="transparent"
  style="pointer-events: all; cursor: crosshair;"
  onpointerdown={handlers.onpointerdown}
  onpointermove={handlers.onpointermove}
  onpointerleave={handlers.onpointerleave}
/>

<style>
  .interaction-layer {
    touch-action: pan-y;
  }
</style>
