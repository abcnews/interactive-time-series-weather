<script lang="ts">
  /**
   * @file Container component that renders all observations as interactive hitboxes.
   *
   * A dumb component that renders Observation components for each data point.
   */

  import Observation from './Observation.svelte';

  interface Props {
    data: any[];
    formatAriaLabel: (d: any) => string;
    onenter?: (data: any) => void;
    onleave?: () => void;
    hitboxWidth?: number;
  }

  let { data, formatAriaLabel, onenter, onleave, hitboxWidth }: Props = $props();
</script>

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
