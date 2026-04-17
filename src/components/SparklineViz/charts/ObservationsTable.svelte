<script lang="ts">
  /**
   * @file Renders a hidden table for screen readers to provide access to the raw data points.
   */

  import { onMount } from 'svelte';
  import AccessibleHide from '../../AccessibleHide/AccessibleHide.svelte';

  interface Props {
    data: any[];
    class?: string;
  }

  let { data, class: className }: Props = $props();
  let showTable = $state(false);

  // Defer rendering of the table to avoid blocking the main thread
  onMount(() => {
    const timer = setTimeout(() => {
      showTable = true;
    }, 100);

    return () => clearTimeout(timer);
  });
</script>

<AccessibleHide>
  {#if showTable}
    <div class="{className || ''} observations-table">
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
    </div>
  {/if}
</AccessibleHide>

<style>
  .observations-table {
    display: none;
  }
</style>
