<script lang="ts">
  /**
   * @file Interactive hitbox for a single observation data point.
   *
   * A dumb component that creates an invisible positioned element that responds to pointer events.
   */

  import { getContext } from 'svelte';

  interface Props {
    data: any;
    ariaLabel: string; // Formatted aria label (e.g., "25km/h 5:30pm")
    onenter?: (data: any) => void; // Optional callback for pointer enter
    onleave?: () => void; // Optional callback for pointer leave
    hitboxWidth?: number; // Width in pixels
  }

  let { data, ariaLabel, onenter, onleave, hitboxWidth = 30 }: Props = $props();

  const { xGet } = getContext<any>('LayerCake');

  function handlePointerEnter() {
    if (onenter) onenter(data);
  }

  function handlePointerLeave() {
    if (onleave) onleave();
  }
</script>

<li
  onpointerenter={handlePointerEnter}
  onpointerleave={handlePointerLeave}
  style:left="{$xGet(data)}px"
  style:width="{hitboxWidth}px"
  role="listitem"
  aria-label={ariaLabel}
></li>

<style>
  li {
    position: absolute;
    top: 0;
    bottom: 0;
    transform: translateX(-50%);
    margin: 0;
    padding: 0;
  }
</style>
