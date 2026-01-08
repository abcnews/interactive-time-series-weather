<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { interpolateRgbBasis } from 'd3-interpolate';
  import { scaleSequential } from 'd3-scale';
  import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
  import { DATA_URL, emitResize, LOCATIONS_URL } from '../util';
  import WeatherChart from './charts/WeatherChart.svelte';
  import { intersectionObserver } from './useIntersectionObserver.js';

  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'] } = $props();
  let geojson = $state<LocationsFeatureCollection>();
  let data = $state<TimeSeriesData>();
  let clientHeight = $state(0);
  let status = $state('offscreen');

  $effect(() => {
    if (clientHeight) {
      emitResize(clientHeight);
    }
  });

  $effect(() => {
    console.log({ status });
    if (status === 'inview') {
      console.log("in view, let's go");
      untrack(async () => {
        const [loadedGeojson, loadedData] = await Promise.all([
          fetch(LOCATIONS_URL).then(res => res.json() as Promise<LocationsFeatureCollection>),
          fetch(DATA_URL).then(res => res.json() as Promise<TimeSeriesData>)
        ]);
        geojson = loadedGeojson;
        data = loadedData;
      });
    }
  });

  let foundLocations = $derived.by(() => {
    if (!geojson || !data) {
      return locations.map(name => ({ name, chartData: [] }));
    }

    return locations
      .map(location => geojson.features.find(feature => feature.properties.name === location))

      .filter(feature => locations.includes(feature.properties.name))
      .map(feature => {
        const auroraId = feature.properties.auroraId;

        // Transform data into LayerCake-compatible format
        // Fill null values with the previous non-null value
        const timeSeries = data!.series[auroraId];
        let previousNulls = 0;
        let previousValue;
        const chartData = timeSeries.reduce((acc: Array<{ x: number; y: number }>, val, index) => {
          previousValue = val ?? previousValue ?? 0;
          const timestamp = new Date(data!.timestamps[index]);
          if (Number(timestamp) < Date.now() - 1000 * 60 * 60 * 24 * 5) {
            return acc;
          }
          const hasVal = val !== null;
          previousNulls = hasVal ? 0 : previousNulls + 1;

          acc.push({
            x: timestamp.getTime(),
            y: hasVal ? val : previousNulls < 10 ? previousValue : 0
          });

          return acc;
        }, []);

        return {
          name: feature.properties.name,
          chartData
        };
      });
  });

  // Hard-code these for now so they're consistent across multiple frames.
  const [globalMin, globalMax] = [10, 45];
  const gradientColors = ['#779E00', '#DB7C00', '#F53500'];
  let gradientScale = $state(scaleSequential([globalMin, globalMax], interpolateRgbBasis(gradientColors)));
</script>

<div
  class="app"
  bind:clientHeight
  use:intersectionObserver={{
    threshold: 0.1,
    onEnter: () => {
      status = 'inview';
    }
  }}
>
  <div class="charts">
    {#each foundLocations as location, i}
      <div style:--delay="{i * 0.5}ms">
        <WeatherChart
          name={location.name}
          altText={`A chart shows temperatures at ${location.name}`}
          data={location.chartData}
          formatValue={v => `${v.toFixed(1)}°C`}
          yDomain={[globalMin, globalMax]}
          {gradientScale}
        />
      </div>
    {/each}
  </div>
  <div>
    <p class="attribution">Times shown in user's local time. Source: MetraWeather.</p>
  </div>
</div>

<style lang="scss">
  :global {
    * {
      margin: 0;
      padding: 0;
    }
    body {
      background: transparent;
    }
  }
  .app {
    overflow: hidden;
  }
  .charts {
    display: flex;
    flex-direction: column;
    gap: 50px;
    margin-bottom: 20px;
  }

  .attribution {
    font-family: ABCSans;
    color: #333;
    background: #fff;
    border-radius: 1000px;
    padding: 2px 0.75rem;
    display: inline-block;
  }
</style>
