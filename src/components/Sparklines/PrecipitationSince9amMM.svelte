<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  const metric = metricProperties.rain;
</script>

<SparklineViz
  name={metric.name}
  placeholders={locations}
  loadData={async () => {
    const charts = await fetchData({
      dataBaseUrl: metric.dataUrl,
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  formatValue={metric.formatValue}
  colour={metric.colour}
  darkColour={metric.darkColour}
  attribution={metric.attribution}
/>
