<script lang="ts">
  import { LOCATIONS_URL } from '../util';
  import { interpolateRgbBasis } from 'd3-interpolate';
  import { scaleSequential } from 'd3-scale';
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData } from './fetchData';
  import { metricProperties } from '../SparklineViz/charts/lib/constants';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'] } = $props();

  // Wind speed configuration
  const gradientColors = metricProperties.gust.gradientColours;
  const formatValue = (v: number) => `${v.toFixed(1)} km/h`;
  const gradientScale = scaleSequential([0, 100], interpolateRgbBasis(gradientColors));
</script>

<SparklineViz
  placeholders={locations}
  loadData={async () => {
    const charts = await fetchData(
      LOCATIONS_URL,
      'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/averageWindSpeedKm.json',
      locations
    );
    return { charts };
  }}
  {formatValue}
  {gradientScale}
  attribution="Times shown in user's local time. Source: MetraWeather."
/>
