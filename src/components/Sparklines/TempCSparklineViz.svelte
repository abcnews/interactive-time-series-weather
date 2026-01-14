<script lang="ts">
  import { interpolateRgbBasis } from 'd3-interpolate';
  import { scaleSequential } from 'd3-scale';
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData, type ChartData } from './fetchData';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'], startDate = '', endDate = '' } = $props();

  // Temperature-specific configuration
  const yDomain: [number, number] = [10, 45];
  const gradientColors = ['#779E00', '#DB7C00', '#F53500'];
  const formatValue = (v: number) => `${v.toFixed(1)}°C`;
  const gradientScale = scaleSequential(yDomain, interpolateRgbBasis(gradientColors));
</script>

<SparklineViz
  placeholders={locations}
  loadData={async (): Promise<{ charts: ChartData[] }> => {
    const charts = await fetchData({
      dataBaseUrl: 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/assets/tempC',
      locations,
      range: { startDate, endDate }
    });

    return { charts };
  }}
  {formatValue}
  {yDomain}
  {gradientScale}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
