<script lang="ts">
  /**
   * @file Container component that renders a single interaction layer and a deferred accessible table.
   */

  import { onMount, getContext, untrack } from 'svelte';
  import AccessibleHide from '../../AccessibleHide/AccessibleHide.svelte';
  import { bisector } from 'd3-array';
  import { observationHandlingLeave } from './lib/stores';

  interface Props {
    data: any[];
    formatAriaLabel: (d: any) => string;
    onenter?: (data: any) => void;
    onleave?: () => void;
    hitboxWidth?: number; // Unused now but kept for compatibility
  }

  let { data, formatAriaLabel, onenter, onleave }: Props = $props();

  const { xGet, xScale, width, height } = getContext<any>('LayerCake');
  const bisectX = bisector((d: any) => d.x).left;

  let showTable = $state(false);

  // Defer rendering of the table to avoid blocking the main thread
  onMount(() => {
    const timer = setTimeout(() => {
      showTable = true;
    }, 100);

    return () => clearTimeout(timer);
  });

  function findPoint(event: PointerEvent) {
    if (!data || data.length === 0) return null;

    const x = event.offsetX;
    // Invert scale to get data domain value
    const xVal = $xScale.invert(x);
    // Find closest index using manual logic (since d3-array < 3.3 doesn't have .center)
    const index = bisectX(data, xVal);

    // If closest to the very beginning
    if (index === 0) return data[0];
    // If closest to the very end
    if (index === data.length) return data[data.length - 1];

    // Otherwise, compare closer of the two surrounding points
    const d0 = data[index - 1];
    const d1 = data[index];
    return xVal - d0.x > d1.x - xVal ? d1 : d0;
  }

  function handlePointerMove(event: PointerEvent) {
    const point = findPoint(event);
    if (point && onenter) {
      onenter(point);
    }
  }

  function handlePointerLeave(event: PointerEvent) {
    // Signal that we are handling this leave event (logic copied from original Observation component)
    $observationHandlingLeave = true;

    // Don't call onleave for touch events so touch devices can see labels
    if (event.pointerType === 'touch') {
      return;
    }
    if (onleave) onleave();
  }
</script>

<div
  class="interaction-layer"
  role="presentation"
  onpointermove={handlePointerMove}
  onpointerleave={handlePointerLeave}
  style:width="100%"
  style:height="100%"
></div>

<AccessibleHide>
  {#if showTable}
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {#each data.toReversed() as observation}
          <tr>
            <td>
              <time datetime={new Date(observation.x).toISOString()}>
                {new Date(observation.x).toLocaleString()}
              </time>
            </td>
            <td>{observation.y}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</AccessibleHide>

<style>
  .interaction-layer {
    position: absolute;
    top: 0;
    left: 0;
    touch-action: none; /* Prevent scroll interference if desired, or pan-y */
  }
</style>
