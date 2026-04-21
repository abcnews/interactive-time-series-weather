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

  const metric = metricProperties.rainCumulative;
</script>

<SparklineViz
  {...metric}
  {twoColumns}
  placeholders={locations}
  loadData={async () => {
    const charts = await fetchData({
      locations,
      range: { startDate, endDate },
      metric: 'rainCumulative'
    });

    return { charts };
  }}
/>
