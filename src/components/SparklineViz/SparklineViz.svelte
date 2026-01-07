<script lang="ts">
  import { onMount } from 'svelte';
  import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
  import { DATA_URL, emitResize, LOCATIONS_URL } from '../util';
  import WeatherChart from './charts/WeatherChart.svelte';
  import { setGradientScale } from './charts/lib/stores';
  let { locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'] } = $props();
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
          console.log(val, previousNulls);

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

  // Calculate global min and max values across all locations for shared y-axis
  // let { globalMin = 0, globalMax = 0 } = $derived.by(() => {
  //   if (foundLocations.length === 0) {
  //     return { min: 0, max: 0 };
  //   }

  //   const allYValues = foundLocations.flatMap(location => location.chartData.map(d => d.y));

  //   let globalMin = Math.min(...allYValues);
  //   let globalMax = Math.max(...allYValues);

  //   return {
  //     globalMin,
  //     globalMax
  //   };
  // });

  // Hard-code these for now so they're consistent across multiple frames.
  const [globalMin, globalMax] = [10, 55];
  setGradientScale(globalMin, globalMax);

  $effect(() => console.log({ globalMin, globalMax }));
</script>

<div class="app" bind:clientHeight>
  {#if foundLocations.length}
    <div class="charts">
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
    <div>
      <p class="attribution">Times shown in user's local time. Source: Bureau of Meteorology.</p>
    </div>
  {/if}
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
