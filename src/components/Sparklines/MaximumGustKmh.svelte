<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../../lib/chartTypes';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  const metric = metricProperties.gust;
</script>

<SparklineViz
  {...metric}
  placeholders={locations}
  loadData={async () => {
    const charts = await fetchData({
      dataBaseUrl: metric.dataUrl,
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
/>
