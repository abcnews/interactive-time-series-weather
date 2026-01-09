<script lang="ts">
  import { LOCATIONS_URL } from '../util';
  import { interpolateRgbBasis } from 'd3-interpolate';
  import { scaleSequential } from 'd3-scale';
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'] } = $props();

  // Temperature-specific configuration
  const yDomain: [number, number] = [10, 100];
  const gradientColors = metricProperties.gust.gradientColours;
  const formatValue = (v: number) => `${v.toFixed(1)} km/h`;
  const gradientScale = scaleSequential(yDomain, interpolateRgbBasis(gradientColors));

  // Temperature-specific data loading
  let loadData = $derived.by(() => {
    return () =>
      fetchData(
        LOCATIONS_URL,
        'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/averageWindSpeedKm.json',
        locations
      );
  });
</script>

<SparklineViz
  {loadData}
  {formatValue}
  {yDomain}
  {gradientScale}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
