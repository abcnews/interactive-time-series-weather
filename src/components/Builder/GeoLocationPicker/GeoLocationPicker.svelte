<script>
  import { Modal } from '@abcnews/components-builder';
  import MapLibreLoader from '../mapLibre/MapLibreLoader/MapLibreLoader.svelte';
  import { STYLE_BRIGHT } from '../mapLibre/utils';
  import GeoLocationPins from './GeoLocationPins.svelte';
  let { onClick, geojson, locations } = $props();
  let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = !isOpen)}>Geo location picker</button>

{#if isOpen}
  <Modal onClose={() => (isOpen = false)} title="Geo location picker">
    <div style="color-scheme:light;color:black;">
      <MapLibreLoader
        rootElStyle="width:80vw;height:calc(50vh - 1rem)"
        onLoad={async ({ rootNode, maplibregl }) => {
          return new maplibregl.Map({
            zoom: 1,
            minZoom: 2,
            maxZoom: 13,
            attributionControl: false,
            dragRotate: false,
            doubleClickZoom: false,
            style: STYLE_BRIGHT,
            container: rootNode,
            interactive: true,
            center: [133.28, -28.15],
            attributionControl: {
              customAttribution: 'Hold shift+drag to zoom quickly to an area.'
            }
          });
        }}
      >
        <GeoLocationPins {onClick} {geojson} {locations} />
      </MapLibreLoader>
    </div>
  </Modal>
{/if}
