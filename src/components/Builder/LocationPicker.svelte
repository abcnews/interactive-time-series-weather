<script lang="ts">
  import { Typeahead } from '@abcnews/components-builder';
  import type { LocationsFeatureCollection } from '../../types';

  let {
    values = [],
    value = $bindable([]),
    disabled,
    geojson
  }: {
    values: {
      value: string;
      label: string;
    }[];
    value: string[];
    disabled: boolean;
    /** Locations feature collection, used to look up each station's coordinates */
    geojson?: LocationsFeatureCollection;
  } = $props();

  /** Google Maps search url for a station's point, or undefined if it has no coordinates */
  function mapUrl(bomId: string) {
    const geometry = geojson?.features.find(f => f.properties.bomId === bomId)?.geometry;
    if (geometry?.type !== 'Point') {
      return;
    }
    const [longitude, latitude] = geometry.coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  /**
   * Stored values are `bomId` or `bomId|Custom name`. A custom name only changes how the location
   * is labelled in the charts; reverting to the station's default name drops the override.
   */
  function rename(storedValue: string, setValue: (newValue: string) => void) {
    const [id, override] = storedValue.split('|');
    const defaultLabel = values.find(v => v.value === id)?.label;
    const currentLabel = override || defaultLabel || id;
    const newName = prompt(`Rename ${currentLabel}`, currentLabel);
    if (newName === null) {
      return;
    }
    setValue(newName === '' || newName === defaultLabel ? id : `${id}|${newName}`);
  }
</script>

<!-- Each location gets its own full-width row -->
<div class="location-picker">
  <Typeahead {values} bind:value {disabled}>
    {#snippet item({ value: storedValue, setValue, remove })}
      {@const [id, override] = storedValue.split('|')}
      {@const label = override || values.find(v => v.value === id)?.label || id}
      {@const url = mapUrl(id)}
      <div class="label">{label}</div>
      {#if url}
        <button
          aria-label={`Open ${label} in Google Maps`}
          title={`Open ${label} in Google Maps`}
          onclick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path
              d="M3 2.5A1.5 1.5 0 0 1 4.5 1h1A1.5 1.5 0 0 1 7 2.5V5h2V2.5A1.5 1.5 0 0 1 10.5 1h1A1.5 1.5 0 0 1 13 2.5v2.382a.5.5 0 0 0 .276.447l.895.447A1.5 1.5 0 0 1 15 7.118V14.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 14.5v-3a.5.5 0 0 1 .146-.354l.854-.853V9.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v.793l.854.853A.5.5 0 0 1 7 11.5v3A1.5 1.5 0 0 1 5.5 16h-3A1.5 1.5 0 0 1 1 14.5V7.118a1.5 1.5 0 0 1 .83-1.342l.894-.447A.5.5 0 0 0 3 4.882zM4.5 2a.5.5 0 0 0-.5.5V3h2v-.5a.5.5 0 0 0-.5-.5zM6 4H4v.882a1.5 1.5 0 0 1-.83 1.342l-.894.447A.5.5 0 0 0 2 7.118V13h4v-1.293l-.854-.853A.5.5 0 0 1 5 10.5v-1A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5v1a.5.5 0 0 1-.146.354l-.854.853V13h4V7.118a.5.5 0 0 0-.276-.447l-.895-.447A1.5 1.5 0 0 1 12 4.882V4h-2v1.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5zm4-1h2v-.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5zm4 11h-4v.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5zm-8 0H2v.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5z"
            />
          </svg>
        </button>
      {/if}
      <button aria-label={`Rename ${label}`} title={`Rename ${label}`} onclick={() => rename(storedValue, setValue)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path
            d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.12 1.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"
          />
          <path
            fill-rule="evenodd"
            d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
          />
        </svg>
      </button>
      <button aria-label={`Remove ${label}`} title={`Remove ${label}`} onclick={remove}>✕</button>
    {/snippet}
  </Typeahead>
</div>

<style>
  .location-picker {
    --typeahead-item-flex: 1 1 100%;
    --typeahead-items-max-height: 24rem;
  }
  .label {
    flex: 1;
  }
  /* Fixed square so the icons keep their proportions inside the flex row */
  .location-picker button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: none;
  }
</style>
