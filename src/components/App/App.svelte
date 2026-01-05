<script lang="ts">
  import Maplibre from '../Maplibre/Maplibre.svelte';
  import type { FeatureCollection, Geometry } from 'geojson';
  import { onMount } from 'svelte';
  import SpikeLayer from './SpikeLayer';
  type MyFeatureCollection = FeatureCollection<
    Geometry,
    {
      // Your types go here
      name: string;
      auroraId: string;
      height?: number;
      colour?: string;
      temp?: number | null;
    }
  >;

  type Data = {
    timestamps: string[];
    series: Record<string, (number | null)[]>;
  };

  let geojson = $state<MyFeatureCollection>({} as MyFeatureCollection);
  let data = $state<Data>({} as Data);
  let status = $state<'loading' | 'ready'>('loading');
  onMount(async () => {
    const [loadedGeojson, loadedData] = await Promise.all([
      fetch('/au.geo.json').then(res => res.json() as Promise<MyFeatureCollection>),
      fetch('/data.json').then(res => res.json() as Promise<Data>)
    ]);
    geojson = loadedGeojson;
    data = loadedData;
    status = 'ready';
    setInterval(() => {
      index++;
      if (index > data.timestamps.length) {
        index = 0;
      }
    }, 5000);
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

      const coneGeoJson = {
        ...geojson,
        features: (geojson.features = geojson.features
          .map(feature => {
            const series = data.series[feature.properties.auroraId];
            const temp = series?.[3] || 0;
            const fraction = temp ? Math.min(1, Math.max(0, (temp - 10) / 35)) : 0;
            feature.properties = {
              ...feature.properties,
              height: 3000000 * fraction,
              colour: `rgb(${Math.round(fraction * 255)}, 0, ${Math.round((1 - fraction) * 255)})`,
              temp
            };
            return feature;
          })
          .filter(feature => feature.properties.temp))
      };
      map.addLayer(new SpikeLayer({ id: 'hi', geojson: coneGeoJson, baseDiameter: 20000 }));
      console.log('added cone layer');
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
  }
</style>
