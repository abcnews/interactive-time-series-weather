<script lang="ts">
  /**
   * @file Container component that renders all observations as interactive hitboxes.
   *
   * A dumb component that renders Observation components for each data point.
   */

  import Observation from './Observation.svelte';
  import AccessibleHide from '../../AccessibleHide/AccessibleHide.svelte';

  interface Props {
    data: any[];
    formatAriaLabel: (d: any) => string;
    onenter?: (data: any) => void;
    onleave?: () => void;
    hitboxWidth?: number;
  }

  let { data, formatAriaLabel, onenter, onleave, hitboxWidth }: Props = $props();

  // Calculate min, max, and current values
  let minPoint = $derived(data.length > 0 ? data.reduce((min, d) => (d.y < min.y ? d : min), data[0]) : null);
  let maxPoint = $derived(data.length > 0 ? data.reduce((max, d) => (d.y > max.y ? d : max), data[0]) : null);
</script>

<AccessibleHide>
  {#if minPoint && maxPoint}
    <p>
      Minimum: {formatAriaLabel(minPoint)}. Maximum: {formatAriaLabel(maxPoint)}.
    </p>
  {/if}
</AccessibleHide>

<ol>
  {#each data.slice().reverse() as observation}
    <Observation data={observation} ariaLabel={formatAriaLabel(observation)} {onenter} {onleave} {hitboxWidth} />
  {/each}
</ol>

<style>
  ol {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
</style>
