<script lang="ts">
  import { BuilderStyleRoot, BuilderFrame, UpdateChecker, Typeahead, Loader } from '@abcnews/components-builder';
  import { onMount } from 'svelte';
  import { LOCATIONS_URL } from '../util';
  import Sparklines from '../Sparklines/Sparklines.svelte';
  import LocationPicker from './LocationPicker.svelte';
  import GeoLocationPicker from './GeoLocationPicker/GeoLocationPicker.svelte';
  import { rawData } from '../SparklineViz/charts/lib/stores';
  const defaultParams = new URLSearchParams(location.hash.slice(1));

  let locations = $state(
    (
      defaultParams.get('locations') ||
      'Brisbane,Fort Denison,Melbourne Airport,Adelaide Airport,Perth Airport,Darwin Airport,Canberra Airport,Hobart (Ellerslie Road)'
    )
      .split(',')
      .filter(Boolean)
  );
  let vizType = $state(defaultParams.get('viz') || 'tempc');
  let hash = $state(window.location.hash.slice(1));
  let locationOptions = $state<{ value: string; label: string }[]>([]);
  let isLoading = $state(true);
  let startDate = $state(
    defaultParams.get('startDate') || new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().substring(0, 10)
  );
  let endDate = $state(defaultParams.get('endDate') || new Date().toISOString().substring(0, 10));
  let scheme = $state(defaultParams.get('scheme') || 'auto');
  let geojson = $state();
  let daysDifference = $derived.by(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  let validLocations = $derived(
    locationOptions.length > 0
      ? locations.filter(loc => locationOptions.some(opt => opt.value === loc.split('|')[0]))
      : locations
  );

  function bulkPasteLocations() {
    const input = prompt('Paste locations one per line (e.g. from a spreadsheet)', locations.join('\n'));
    if (input === null) {
      return;
    }
    locations = input
      .split('\n')
      .map(location => location.trim())
      .filter(Boolean);
  }

  function loadFromIframeUrl() {
    const input = prompt('Paste an iframe URL to load its settings');
    const search = input?.split('?')[1];
    if (!input || !search) {
      return;
    }
    window.location.hash = search;
    window.location.reload();
  }

  $effect(() => {
    if (!startDate) {
      startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10);
    }
    if (!endDate) {
      endDate = new Date(Date.now()).toISOString().slice(0, 10);
    }
  });

  onMount(async () => {
    addEventListener('hashchange', () => {
      const newHash = window.location.hash.slice(1);
      if (hash !== newHash) {
        hash = newHash;
      }
    });

    // Fetch locations data
    try {
      const response = await fetch(LOCATIONS_URL);
      geojson = await response.json();

      // Transform geojson features into Typeahead format
      locationOptions = geojson.features
        .map(feature => ({
          value: feature.properties.name,
          label: [feature.properties.name, feature.properties.auroraName && `(${feature.properties.auroraName})`]
            .filter(Boolean)
            .join(' ')
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      isLoading = false;
    }
  });

  $effect(() => {
    if (validLocations.length !== locations.length) {
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
    window.location.hash = params.toString().replace(/%7C/g, '|').replace(/%2C/g, ',');
  });

  let iframeUrl = $derived.by(
    () => `https://${location.host}${location.pathname.replace(/\/builder\/?/, '/')}?${hash}&abcnewsembedheight=600`
  );

  function csvExport() {
    const data = $rawData;
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Get all unique timestamps (x values) across all locations
    const timestamps = Array.from(new Set(data.flatMap(d => d.chartData.map(p => p.x)))).sort((a, b) => a - b);

    // Create header row
    const headers = ['Date', ...data.map(d => d.name)];
    const rows = [headers];

    // Create data rows
    timestamps.forEach(ts => {
      const date = new Date(ts);
      const row = [`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`];
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
    {#key locations.join() + startDate + endDate + scheme}
      <Sparklines {vizType} {locations} {startDate} {endDate} />
    {/key}
  </div>
{/snippet}

{#snippet Sidebar()}
  <fieldset class="chart-type">
    <legend>Chart type</legend>
    <div class="radio-group">
      <label>
        <input type="radio" name="vizType" value="tempc" bind:group={vizType} />
        Temperature
      </label>
      <label>
        <input type="radio" name="vizType" value="wind" bind:group={vizType} />
        Wind (average)
      </label>
      <label>
        <input type="radio" name="vizType" value="gust" bind:group={vizType} />
        Wind (max gust)
      </label>
      <label>
        <input type="radio" name="vizType" value="rain" bind:group={vizType} />
        Rainfall since 9am
      </label>
      <label>
        <input type="radio" name="vizType" value="humidity" bind:group={vizType} />
        Relative Humidity
      </label>
    </div>
  </fieldset>
  <fieldset>
    <legend>Locations</legend>
    <small>
      Note that not all locations will have data. The builder doesn't let you rearrange locations, but you can edit the
      URL and refresh the page. <br /> <br /> Locations are in <code>Weather Station (Aurora Location)</code> format. You
      can rename them with the edit button.
    </small>
    {#if isLoading}
      <Loader />
    {:else}
      <LocationPicker
        disabled={isLoading}
        values={locationOptions}
        value={locations}
        onChange={newLocations => {
          locations = newLocations;
        }}
      />
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
        ⚠️ Warning: Date range is &gt;2 weeks. Large date ranges will cause slow loading and excessive data transfers.
      </small>
    {/if}
  </fieldset>
  <fieldset>
    <legend>Iframe url</legend>
    <input readonly value={iframeUrl} />
  </fieldset>
  <fieldset>
    <legend>Tools</legend>
    <button onclick={bulkPasteLocations}>Bulk paste locations</button>
    <button onclick={loadFromIframeUrl}>Load from iframe URL</button>
    <GeoLocationPicker {geojson} onClick={newLocations => (locations = newLocations)} {locations} />
    <button onclick={csvExport}>Export as CSV</button>
  </fieldset>
  <fieldset>
    <legend>Colour scheme</legend>
    <small>Leave this on Auto unless you're embedding in an Odyssey.</small>
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
  <UpdateChecker />
{/snippet}

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
