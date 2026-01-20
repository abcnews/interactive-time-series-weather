<script lang="ts">
  import { getContext, untrack } from 'svelte';
  import type { maplibregl } from '../mapLibre/maplibre.d.ts';

  let {
    onClick,
    geojson,
    locations = []
  } = $props<{
    onClick?: (newLocations: string[]) => void;
    geojson: any;
    locations?: string[];
  }>();

  const locationNames = $derived(locations.map(l => l.split('|')[0]));

  const mapInstance = getContext<{ map: maplibregl.Map | undefined }>('mapInstance');
  const sourceId = 'geo-location-pins-source';
  const layerId = 'geo-location-pins-layer';
  let isMapReady = $state(false);

  /**
   * Effect 1: Map Setup and Teardown
   * This effect handles the creation and destruction of the MapLibre source and layer.
   * It untracks location-specific state to avoid re-adding the layer every time a location is toggled.
   */
  $effect(() => {
    const map = mapInstance.map;
    if (!map || !geojson) return;

    const setupMap = () => {
      if (map.getSource(sourceId)) return;

      const features = untrack(() =>
        geojson.features
          .filter(feature => feature.properties.auroraId)
          .sort((a, b) => {
            const aMatch = locationNames.includes(a.properties.name);
            const bMatch = locationNames.includes(b.properties.name);
            if (aMatch === bMatch) return 0;
            return aMatch ? 1 : -1;
          })
      );

      map.addSource(sourceId, {
        type: 'geojson',
        data: { ...geojson, features }
      });

      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': untrack(() => ['case', ['in', ['get', 'name'], ['literal', locationNames]], 'green', '#ccc']),
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('click', layerId, e => {
        const feature = e.features?.[0];
        if (!feature) return;
        const { name, auroraName } = feature.properties;
        const abcName = auroraName || name;
        const isSelected = locationNames.includes(name);

        const popupNode = document.createElement('div');
        popupNode.innerHTML = `
            <div style="color: #333;">
              <dl>
                <dt>Weather station</dt>
                <dd>${name}</dd>
                <dt>ABC Location</dt>
                <dd>${abcName}</dd>
              </dl>
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; margin-top: 10px;">
                <input type="checkbox" ${isSelected ? 'checked' : ''} />
                Include in map
              </label>
            </div>
          `;

        const checkbox = popupNode.querySelector('input');
        checkbox?.addEventListener('change', () => {
          let newLocations;
          if (checkbox.checked) {
            newLocations = [...locations, name];
          } else {
            newLocations = locations.filter(l => l.split('|')[0] !== name);
          }
          if (onClick) {
            onClick(newLocations);
          }
        });

        new (window as any).maplibregl.Popup().setLngLat(e.lngLat).setDOMContent(popupNode).addTo(map);
      });

      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });

      isMapReady = true;
    };

    if (map.loaded()) {
      setupMap();
    } else {
      map.once('load', setupMap);
    }

    return () => {
      isMapReady = false;
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  });

  /**
   * Effect 2: Reactive Updates
   * This effect handles updates to the map data and styling when the locations or geojson change.
   * It ensures that selected pins are colored green and sorted to the top of the rendering stack.
   */
  $effect(() => {
    if (!isMapReady) return;
    const map = mapInstance.map;
    if (!map || !geojson) return;

    const features = geojson.features
      .filter(feature => feature.properties.auroraId)
      .sort((a, b) => {
        const aMatch = locationNames.includes(a.properties.name);
        const bMatch = locationNames.includes(b.properties.name);
        if (aMatch === bMatch) return 0;
        return aMatch ? 1 : -1;
      });

    const source = map.getSource(sourceId) as any;
    if (source) {
      source.setData({ ...geojson, features });
    }
    map.setPaintProperty(layerId, 'circle-color', [
      'case',
      ['in', ['get', 'name'], ['literal', locationNames]],
      '#B400F5',
      '#888'
    ]);
  });
</script>

<style type="scss">
  :global(.maplibregl-popup dt) {
    font-weight: bold;
    min-width: 13em;
  }
</style>
