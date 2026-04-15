<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  const colour = metricProperties.humidity.colour;
  const formatValue = (v: number) => `${v.toFixed(0)}%`;
</script>

<SparklineViz
  placeholders={locations}
  metric="humidity"
  loadData={async () => {
    const charts = await fetchData({
      dataBaseUrl:
        'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/assets/relativeHumidityPct',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  {formatValue}
  {colour}
  darkColour={metricProperties.humidity.darkColour}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
