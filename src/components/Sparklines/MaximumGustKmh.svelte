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

  const metric = metricProperties.gust;
</script>

<SparklineViz
  {...metric}
  {twoColumns}
  placeholders={locations}
  loadData={async () => {
    const charts = await fetchData({
      metric: 'gust',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
/>
