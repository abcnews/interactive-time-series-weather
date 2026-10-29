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

  const metric = metricProperties.rainCumulative;
</script>

{#snippet bomAttribution({ usedHistorical })}
  {#if usedHistorical}<BomAttribution note="Cumulative totals were calculated." />{/if}
{/snippet}

<SparklineViz
  {...metric}
  {twoColumns}
  showMaxOnly
  placeholders={locations}
  attributionExtra={bomAttribution}
  loadData={() => fetchData({ locations, range: { startDate, endDate }, metric: 'rainCumulative' })}
/>
