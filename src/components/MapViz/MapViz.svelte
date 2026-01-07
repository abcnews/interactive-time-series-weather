<script lang="ts">
  import Maplibre from '../Maplibre/Maplibre.svelte';
  import { onMount } from 'svelte';
  import SpikeLayer from './SpikeLayer';
  import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';

  let geojson = $state<LocationsFeatureCollection>({} as LocationsFeatureCollection);
  let data = $state<TimeSeriesData>({} as TimeSeriesData);
  let status = $state<'loading' | 'ready'>('loading');
  const spikeLayer = new SpikeLayer({ id: 'hi', baseDiameter: 20000 });

  onMount(async () => {
    const [loadedGeojson, loadedData] = await Promise.all([
      fetch('/au.geo.json').then(res => res.json() as Promise<LocationsFeatureCollection>),
      fetch('https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/tempc.json').then(
        res => res.json() as Promise<TimeSeriesData>
      )
    ]);
    geojson = loadedGeojson;
    data = loadedData;
    status = 'ready';

    // 1. Initial Setup: Extract fixed locations
    const featuresWithData = loadedGeojson.features.filter(f => data.series[f.properties.auroraId]);
    const coords = featuresWithData.map(f => f.geometry.coordinates);

    // Initialize the 3D objects at their locations
    spikeLayer.setLocations(coords);

    // 2. Data Update Function: Convert your logic to Typed Arrays
    function refreshSpikes(index) {
      const count = featuresWithData.length;
      const heights = new Float32Array(count);
      const colours = new Float32Array(count * 3); // 3 values (R, G, B) per spike

      featuresWithData.forEach((feature, i) => {
        const series = data.series[feature.properties.auroraId];
        const temp = series?.[index] || 0;
        const fraction = temp ? Math.min(1, Math.max(0, (temp - 10) / 35)) : 0;

        // Set Height
        heights[i] = Math.round(1000000 * fraction);

        // Set Color (Normalize 0-255 to 0.0-1.0 for Three.js)
        colours[i * 3] = fraction; // Red
        colours[i * 3 + 1] = 0; // Green
        colours[i * 3 + 2] = 1 - fraction; // Blue
      });

      // Push to GPU
      spikeLayer.updateData(heights, colours);
    }
    refreshSpikes(0);

    const go = () => {
      index++;
      if (index > data.timestamps.length) {
        index = 0;
      }
      refreshSpikes(index);
      requestAnimationFrame(go);
    };

    go();
  });

  let index = 0;
</script>

<div class="app">
  <Maplibre
    onLoad={async ({ rootNode, maplibregl }) => {
      const map = new maplibregl.Map({
        zoom: 1,
        minZoom: 2,
        maxZoom: 10,
        attributionControl: false,
        dragRotate: false,
        doubleClickZoom: false,
        style: 'https://www.abc.net.au/res/sites/news-projects/map-vector-style-bright/style.json',
        container: rootNode,
        interactive: true,
        cooperativeGestures: true,
        center: [133.28, -28.15]
      });

      await new Promise(resolve => map.on('load', resolve));

      map.setProjection({
        type: 'globe' // Set projection to globe
      });
      map.addLayer(spikeLayer);

      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        })
      );
    }}
  />
</div>

<style lang="scss">
  :global {
    * {
      margin: 0;
      padding: 0;
    }
  }
  .app {
    width: 100%;
    height: 100dvh;
    position: relative;
    background: linear-gradient(to bottom, black, purple);
  }
</style>
