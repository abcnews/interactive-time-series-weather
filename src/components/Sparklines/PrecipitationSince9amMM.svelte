<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  const colour = metricProperties.rain.colour;
  const formatValue = (v: number) => `${v.toFixed(0)} mm`;
</script>

<SparklineViz
  placeholders={locations}
  metric="rain"
  loadData={async () => {
    const charts = await fetchData({
      dataBaseUrl:
        'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/assets/precipitationSince9amMM',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  {formatValue}
  {colour}
  darkColour={metricProperties.rain.darkColour}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
