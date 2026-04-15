<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  // Temperature-specific configuration
  const yDomain: [number, number] = [10, 45];
  const colour = metricProperties.tempc.colour;
  const formatValue = (v: number) => `${v.toFixed(1)}°C`;
</script>

<SparklineViz
  placeholders={locations}
  metric="tempc"
  loadData={async () => {
    const charts = await fetchData({
      dataBaseUrl: 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/assets/tempC',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  {formatValue}
  {yDomain}
  {colour}
  darkColour={metricProperties.tempc.darkColour}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
