<script lang="ts">
  import { BuilderStyleRoot, BuilderFrame, UpdateChecker, Typeahead, Loader } from '@abcnews/components-builder';
  import { onMount, tick } from 'svelte';
  import { LOCATIONS_URL } from '../../lib/util';
  import Sparklines from '../Sparklines/Sparklines.svelte';
  import LocationPicker from './LocationPicker.svelte';
  import GeoLocationPicker from './GeoLocationPicker/GeoLocationPicker.svelte';
  import { rawData } from '../Chart/lib/stores';
  const defaultParams = new URLSearchParams(location.hash.slice(1));
  // Initialize dynamic favicon
  import faviconUrl from './favicon.svg';
  import Favicon from '../Favicon/Favicon.svelte';
  import { metricProperties } from '../../lib/chartTypes';

  const DEFAULT_BOM_IDS = [
    '040913', // Brisbane
    '066022', // Fort Denison (Sydney)
    '086282', // Melbourne Airport
    '023034', // Adelaide Airport
    '009021', // Perth Airport
    '014015', // Darwin Airport
    '070351', // Canberra Airport
    '094029' // Hobart (Ellerslie Road)
  ];

  const defaultStartDate = () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().substring(0, 10);
  const defaultEndDate = () => new Date().toISOString().substring(0, 10);

  /** An explicit empty `locations=` (after "Clear all") must stay empty, so only fall back to defaults when absent */
  const locationsFromParams = (params: URLSearchParams) =>
    (params.has('locations') ? params.get('locations')! : DEFAULT_BOM_IDS.join(',')).split(',').filter(Boolean);

  let locations = $state(locationsFromParams(defaultParams));
  let vizType = $state(defaultParams.get('viz') || 'tempc');
  let hash = $state(window.location.hash.slice(1));
  let locationOptions = $state<{ value: string; label: string }[]>([]);
  let isLoading = $state(true);
  let startDate = $state(defaultParams.get('startDate') || defaultStartDate());
  let endDate = $state(defaultParams.get('endDate') || defaultEndDate());
  let scheme = $state(defaultParams.get('scheme') || 'auto');
  let isTwoColumn = $state(defaultParams.get('columns') !== '1');
  let geojson = $state();

  /**
   * True while state is being restored from the url (back/forward). Any normalisation write that follows must
   * replace the history entry, otherwise the back button would get stuck re-pushing the entry we just left.
   */
  let isReplacingHistory = false;
  let hasWrittenHash = false;
  let daysDifference = $derived.by(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  /** Legacy urls use station names (`Whyalla Aero|Whyalla`) rather than BOM IDs (`018120|Whyalla`); convert to the ID form */
  function resolveLocation(loc: string) {
    const [idOrName, override] = loc.split('|');
    const bomId = geojson?.features.find(f => f.properties.storyLabName?.toLowerCase() === idOrName.toLowerCase())
      ?.properties.bomId;
    if (!bomId) {
      return loc;
    }
    return override ? `${bomId}|${override}` : bomId;
  }

  let validLocations = $derived(
    locationOptions.length > 0 && geojson
      ? locations.map(resolveLocation).filter(loc => locationOptions.some(opt => opt.value === loc.split('|')[0]))
      : locations
  );

  const serialiseHash = (params: URLSearchParams) => params.toString().replace(/%7C/g, '|').replace(/%2C/g, ',');

  function loadFromIframeUrl() {
    const input = prompt('Paste an iframe URL to load its settings');
    const search = input?.split('?')[1];
    if (!input || !search) {
      return;
    }
    const params = new URLSearchParams(search);
    // Supports both current (BOM ID) and legacy (station name) locations
    if (params.has('locations')) {
      params.set('locations', params.get('locations')!.split(',').filter(Boolean).map(resolveLocation).join());
    }
    params.delete('abcnewsembedheight');
    // The hashchange handler applies the new settings
    window.location.hash = serialiseHash(params);
  }

  /** Restores builder state from url params (used for back/forward navigation) */
  function applyParams(params: URLSearchParams) {
    const nextLocations = locationsFromParams(params);
    if (nextLocations.join() !== locations.join()) {
      locations = nextLocations;
    }
    vizType = params.get('viz') || 'tempc';
    startDate = params.get('startDate') || defaultStartDate();
    endDate = params.get('endDate') || defaultEndDate();
    scheme = params.get('scheme') || 'auto';
    isTwoColumn = params.get('columns') !== '1';
  }

  async function onHashChange() {
    const newHash = window.location.hash.slice(1);
    if (hash === newHash) {
      return;
    }
    hash = newHash;
    isReplacingHistory = true;
    applyParams(new URLSearchParams(newHash));
    await tick();
    isReplacingHistory = false;
  }

  $effect(() => {
    if (!startDate) {
      startDate = defaultStartDate();
    }
    if (!endDate) {
      endDate = defaultEndDate();
    }
  });

  onMount(async () => {
    // Fetch locations data
    try {
      const response = await fetch(LOCATIONS_URL);
      geojson = await response.json();

      // Transform geojson features into Typeahead format
      locationOptions = geojson.features
        .filter(feature => feature.properties.bomId)
        .map(feature => ({
          value: feature.properties.bomId,
          label: feature.properties.storyLabName
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      isLoading = false;
    }
  });

  $effect(() => {
    if (validLocations.length !== locations.length || validLocations.some((loc, i) => loc !== locations[i])) {
      locations = validLocations;
      return;
    }

    const params = new URLSearchParams();
    params.append('locations', locations.join());
    params.append('viz', vizType);
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (scheme !== 'auto') {
      params.append('scheme', scheme);
    }
    if (!isTwoColumn) {
      params.append('columns', '1');
    }
    const nextHash = serialiseHash(params);
    if (nextHash === window.location.hash.slice(1)) {
      hasWrittenHash = true;
      return;
    }
    hash = nextHash;
    // The first write only normalises the initial url, so it shouldn't add a history entry either
    if (isReplacingHistory || !hasWrittenHash) {
      history.replaceState(null, '', `#${nextHash}`);
    } else {
      window.location.hash = nextHash;
    }
    hasWrittenHash = true;
  });

  let iframeUrl = $derived.by(
    () => `https://${location.host}${location.pathname.replace(/\/builder\/?/, '/')}?${hash}&abcnewsembedheight=600`
  );
  function formatIsoWithTimezone(ts, tzHours) {
    const pad = n => String(n).padStart(2, '0');
    const abs = Math.abs(tzHours);
    const offset = `${tzHours < 0 ? '-' : '+'}${pad(Math.floor(abs))}${pad(Math.round((abs % 1) * 60))}`;
    return new Date(ts + tzHours * 3600000).toISOString().replace(/\.\d{3}Z$/, offset);
  }

  function csvExport() {
    const data = $rawData;
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Get all unique timestamps (x values) across all locations
    const timestamps = Array.from(new Set(data.flatMap(d => d.chartData.map(p => p.x)))).sort((a, b) => a - b);

    // Create header row
    const headers = ['Date', 'Date (AEST)', ...data.map(d => d.name)];
    const rows = [headers];

    // Create data rows
    timestamps.forEach(ts => {
      const row = [new Date(ts).toISOString(), formatIsoWithTimezone(ts, 10)];
      data.forEach(locationData => {
        const point = locationData.chartData.find(p => p.x === ts);
        row.push(point ? point.y.toString() : '');
      });
      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weather-data-${vizType}-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

{#snippet Viz()}
  <div class="frame" data-scheme={scheme === 'auto' ? null : scheme}>
    {#key locations.join() + startDate + endDate + scheme + isTwoColumn}
      <Sparklines {vizType} {locations} {startDate} {endDate} twoColumns={isTwoColumn} />
    {/key}
  </div>
{/snippet}

{#snippet Sidebar()}
  <fieldset class="chart-type">
    <legend>Chart type</legend>
    <div class="radio-group">
      {#each Object.entries(metricProperties) as [key, metric]}
        <label>
          <input type="radio" name="vizType" value={key} bind:group={vizType} />
          {metric.name}
        </label>{' '}
      {/each}
    </div>
    <small>
      {metricProperties[vizType]?.editorialNotes}
    </small>
  </fieldset>
  <fieldset>
    <legend>Locations</legend>
    <small> Not all locations will have data. You can rename them with the edit button. </small>
    {#if isLoading}
      <Loader />
    {:else}
      <LocationPicker disabled={isLoading} values={locationOptions} bind:value={locations} {geojson} />
      <button disabled={locations.length === 0} onclick={() => (locations = [])}>Clear all</button>
    {/if}
  </fieldset>
  <fieldset>
    <legend>Date range</legend>
    <label>
      Start date
      <input type="date" min="2026-01-01" bind:value={startDate} />
    </label>
    <label>
      End date
      <input type="date" min="2026-01-02" bind:value={endDate} />
    </label>
    {#if daysDifference > 14}
      <small class="warning">
        ⚠️ Warning: Date range is &gt;2 weeks. Large date ranges cause slow loading and excessive data transfers.
      </small>
    {/if}
  </fieldset>
  <fieldset>
    <legend>Display</legend>
    <label>
      <input type="checkbox" bind:checked={isTwoColumn} />
      Two-columns on desktop
    </label>
    <hr />
    <small>Colour scheme. Leave on Auto unless you're embedding in an Odyssey.</small>
    <div class="radio-group">
      <label>
        <input type="radio" name="scheme" value="auto" bind:group={scheme} />
        Auto
      </label>
      <label>
        <input type="radio" name="scheme" value="dark" bind:group={scheme} />
        Dark
      </label>
      <label>
        <input type="radio" name="scheme" value="light" bind:group={scheme} />
        Light
      </label>
    </div>
  </fieldset>
  <fieldset>
    <legend>Iframe url</legend>
    <input readonly value={iframeUrl} />
  </fieldset>
  <fieldset>
    <legend>Tools</legend>
    <button onclick={loadFromIframeUrl}>Load from iframe URL</button>
    <GeoLocationPicker {geojson} onClick={newLocations => (locations = newLocations)} {locations} />
    <button onclick={csvExport}>Export as CSV</button>
  </fieldset>
  <UpdateChecker />
{/snippet}

<svelte:window onhashchange={onHashChange} />
<Favicon url={faviconUrl} />
<BuilderStyleRoot>
  <BuilderFrame {Viz} {Sidebar} />
</BuilderStyleRoot>

<style lang="scss">
  .frame {
    width: 100%;
    height: 100%;
    border: 0;
    position: relative;
    overflow: auto;
    padding: 1rem;
    border-radius: 1rem;

    &[data-scheme='dark'] {
      background: #121212;
      color: #eee;
    }
    &[data-scheme='light'] {
      background: #fff;
      color: #000;
    }
  }

  .chart-type label {
    white-space: nowrap;
  }

  .warning {
    color: #d73a49;
    font-weight: bold;
  }
</style>
