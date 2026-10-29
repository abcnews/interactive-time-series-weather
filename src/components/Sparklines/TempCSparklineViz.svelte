<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../../lib/chartTypes';

  let {
    locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'],
    startDate = '',
    endDate = '',
    twoColumns = true
  } = $props();

  const metric = metricProperties.tempc;
</script>

{#snippet bomAttribution({ usedHistorical })}
  {#if usedHistorical}
    Historical temperature data (daily maximum and minimum): © <a href="https://www.bom.gov.au/">Bureau of Meteorology</a>, from
    <a href="https://www.bom.gov.au/climate/data/">CDO</a>.
    <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Provided without warranties of any kind.
  {/if}
{/snippet}

<SparklineViz
  {...metric}
  {twoColumns}
  placeholders={locations}
  attributionExtra={bomAttribution}
  loadData={() => fetchData({ locations, range: { startDate, endDate }, metric: 'tempc' })}
/>
