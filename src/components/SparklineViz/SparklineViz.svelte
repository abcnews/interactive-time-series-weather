<script lang="ts">
  import { onMount } from 'svelte';
  import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
  import { DATA_URL, emitResize, LOCATIONS_URL } from '../util';
  import WeatherChart from './charts/WeatherChart.svelte';
  import { setGradientScale } from './charts/lib/stores';
  let geojson = $state<LocationsFeatureCollection>();
  let data = $state<TimeSeriesData>();
  let clientHeight = $state(0);

  $effect(() => {
    if (clientHeight) {
      emitResize(clientHeight);
    }
  });

  onMount(async () => {
    const [loadedGeojson, loadedData] = await Promise.all([
      fetch(LOCATIONS_URL).then(res => res.json() as Promise<LocationsFeatureCollection>),
      fetch(DATA_URL).then(res => res.json() as Promise<TimeSeriesData>)
    ]);
    geojson = loadedGeojson;
    data = loadedData;
  });

  const locations = [
    'Port Augusta', // SA
    'Coober Pedy', // SA
    'Adelaide', // SA
    'Mildura', // VIC
    // 'Echuca', // VIC
    'Melbourne', // VIC
    'Bendigo', // VIC
    'Broken Hill', // NSW
    'Sydney', // NSW
    'Canberra', // ACT
    'Hobart', // TAS
    'Launceston' // TAS

    // 'Brisbane',
    // 'Sydney',
    // 'Melbourne',
    // 'Adelaide'
  ];

  let foundLocations = $derived.by(() => {
    if (!geojson || !data) {
      return [];
    }

    return locations
      .map(location => geojson.features.find(feature => feature.properties.name === location))
      .filter(feature => typeof feature !== 'undefined')
      .filter(feature => locations.includes(feature.properties.name))
      .map(feature => {
        const auroraId = feature.properties.auroraId;

        // Transform data into LayerCake-compatible format
        // Fill null values with the previous non-null value
        const timeSeries = data!.series[auroraId];
        let previousValue;
        const chartData = timeSeries.reduce((acc: Array<{ x: number; y: number }>, val, index) => {
          previousValue = val ?? previousValue ?? 0;
          const timestamp = new Date(data!.timestamps[index]);
          if (Number(timestamp) < Date.now() - 1000 * 60 * 60 * 24 * 5) {
            return acc;
          }
          if (val) {
            acc.push({
              x: timestamp.getTime(),
              y: val
            });
          }

          return acc;
        }, []);

        return {
          name: feature.properties.name,
          chartData
        };
      });
  });

  // Calculate global min and max values across all locations for shared y-axis
  let { globalMin = 0, globalMax = 0 } = $derived.by(() => {
    if (foundLocations.length === 0) {
      return { min: 0, max: 0 };
    }

    const allYValues = foundLocations.flatMap(location => location.chartData.map(d => d.y));

    const globalMin = Math.min(...allYValues);
    const globalMax = Math.max(...allYValues);

    setGradientScale(globalMin, globalMax);

    return {
      globalMin,
      globalMax
    };
  });
</script>

<div class="app" bind:clientHeight>
  {#each foundLocations as location}
    <WeatherChart
      name={location.name}
      altText={`A chart shows temperatures at ${location.name}`}
      data={location.chartData}
      formatValue={v => `${v.toFixed(1)}°C`}
      yDomain={[globalMin, globalMax]}
    />
  {/each}
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
    display: flex;
    flex-direction: column;
    gap: 50px;
  }
</style>
