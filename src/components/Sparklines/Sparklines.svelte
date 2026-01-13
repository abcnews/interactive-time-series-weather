<script lang="ts">
  import TempCSparklineViz from './TempCSparklineViz.svelte';
  import MaximumGustKmh from './MaximumGustKmh.svelte';
  import PrecipitationSince9amMM from './PrecipitationSince9amMM.svelte';
  import AverageWindSpeedKmViz from './AverageWindSpeedKmViz.svelte';
  import RelativeHumidityPct from './RelativeHumidityPct.svelte';

  let { vizType, locations = [] } = $props();
  const vizComponents = {
    tempc: TempCSparklineViz,
    wind: AverageWindSpeedKmViz,
    gust: MaximumGustKmh,
    rain: PrecipitationSince9amMM,
    humidity: RelativeHumidityPct
  };
  let ComponentToLoad = $derived.by(() => {
    return vizComponents[vizType];
  });
</script>

{#if ComponentToLoad}
  <ComponentToLoad {locations} />
{/if}

{#if !ComponentToLoad}
  <p>viz=${JSON.stringify(vizType)} not found. Must be one of {Object.keys(vizComponents)}</p>
{/if}
