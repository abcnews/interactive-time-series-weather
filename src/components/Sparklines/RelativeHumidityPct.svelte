<script lang="ts">
  import { interpolateRgbBasis } from 'd3-interpolate';
  import { scaleSequential } from 'd3-scale';
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData, type ChartData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  const gradientColors = metricProperties.humidity.gradientColours;
  const formatValue = (v: number) => `${v.toFixed(0)}%`;
  const gradientScale = scaleSequential([0, 100], interpolateRgbBasis(gradientColors));
</script>

<SparklineViz
  placeholders={locations}
  loadData={async (): Promise<{ charts: ChartData[] }> => {
    const charts = await fetchData({
      dataBaseUrl:
        'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/assets/relativeHumidityPct',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  {formatValue}
  {gradientScale}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
