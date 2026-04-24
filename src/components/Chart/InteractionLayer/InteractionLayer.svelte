<script lang="ts">
  /**
   * @file Invisible SVG layer that captures pointer events and triggers interaction callbacks.
   */

  import { getContext } from 'svelte';
  import { useInteraction } from '../lib/useInteraction.js';
  import { observationHandlingLeave } from '../lib/stores';

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

<!-- We have the table as alt text already, so this isn't necessary -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
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
  onpointerup={handlers.onpointerup}
  onpointercancel={handlers.onpointercancel}
  oncontextmenu={e => e.preventDefault()}
/>

<style>
  .interaction-layer {
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
