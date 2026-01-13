<script lang="ts">
  import { BuilderStyleRoot, BuilderFrame, UpdateChecker, Typeahead, Loader } from '@abcnews/components-builder';
  import { onMount } from 'svelte';
  import { LOCATIONS_URL } from '../util';
  import Sparklines from '../Sparklines/Sparklines.svelte';
  const defaultParams = new URLSearchParams(location.hash.slice(1));

  let textarea = $state('');

  let locations = $state(
    (defaultParams.get('locations') || 'Brisbane,Sydney,Melbourne,Adelaide,Perth,Darwin,Canberra,Hobart')
      .split(',')
      .filter(Boolean)
  );
  let vizType = $state(defaultParams.get('viz') || 'tempc');
  let hash = $state(window.location.hash.slice(1));
  let locationOptions = $state<{ value: string; label: string }[]>([]);
  let isLoading = $state(true);

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
      const geojson = await response.json();

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
    const params = new URLSearchParams();
    params.append('locations', locations.join());
    params.append('viz', vizType);
    window.location.hash = params.toString();
  });

  $effect(() => {
    if (textarea) {
      locations = textarea
        .split('\n')
        .map(location => location.trim())
        .filter(Boolean);
      textarea = '';
    }
  });

  let iframeUrl = $derived.by(
    () => `https://${location.host}${location.pathname.replace(/\/builder\/?/, '/')}?${hash}&abcnewsembedheight=600`
  );
</script>

{#snippet Viz()}
  <div class="frame">
    {#key locations}
      <Sparklines {vizType} {locations} />
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
      URL and refresh the page.
    </small>
    {#if isLoading}
      <Loader />
    {:else}
      <Typeahead
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
    <legend>Bulk paste locations</legend>

    <textarea bind:value={textarea}> </textarea>
  </fieldset>
  <fieldset>
    <legend>Iframe url</legend>
    <input readonly value={iframeUrl} />
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
  }

  .chart-type label {
    white-space: nowrap;
  }
</style>
