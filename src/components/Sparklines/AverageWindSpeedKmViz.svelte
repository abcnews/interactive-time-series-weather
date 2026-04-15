<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  // Wind speed configuration
  const colour = metricProperties.gust.colour;
  const formatValue = (v: number) => `${v.toFixed(0)} km/h`;
</script>

<SparklineViz
  placeholders={locations}
  metric="gust"
  loadData={async () => {
    const charts = await fetchData({
      dataBaseUrl: 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/assets/averageWindSpeedKm',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  {formatValue}
  {colour}
  darkColour={metricProperties.gust.darkColour}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
