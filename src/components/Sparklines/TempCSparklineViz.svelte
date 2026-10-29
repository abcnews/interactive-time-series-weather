<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import BomAttribution from '../BomAttribution/BomAttribution.svelte';
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
  {#if usedHistorical}<BomAttribution />{/if}
{/snippet}

<SparklineViz
  {...metric}
  {twoColumns}
  placeholders={locations}
  attributionExtra={bomAttribution}
  loadData={() => fetchData({ locations, range: { startDate, endDate }, metric: 'tempc' })}
/>
