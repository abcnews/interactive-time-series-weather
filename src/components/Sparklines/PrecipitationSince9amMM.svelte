<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  const metric = metricProperties.rainSince9am;
</script>

<SparklineViz
  name={metric.name}
  placeholders={locations}
  loadData={async () => {
    const charts = await fetchData({
      locations,
      range: { startDate, endDate },
      metric: 'rainSince9am'
    });

    return { charts };
  }}
  formatValue={metric.formatValue}
  colour={metric.colour}
  darkColour={metric.darkColour}
  attribution={metric.attribution}
/>
