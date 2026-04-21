<script lang="ts">
  import MaximumGustKmh from './MaximumGustKmh.svelte';
  import PrecipitationSince9amMM from './PrecipitationSince9amMM.svelte';
  import RelativeHumidityPct from './RelativeHumidityPct.svelte';
  import RainCumulative from './RainCumulative.svelte';
  import TempCSparklineViz from './TempCSparklineViz.svelte';

  let { vizType, locations = [], startDate = '', endDate = '', twoColumns = true } = $props();
  const vizComponents = {
    gust: MaximumGustKmh,
    humidity: RelativeHumidityPct,
    rainSince9am: PrecipitationSince9amMM,
    rainCumulative: RainCumulative,
    tempc: TempCSparklineViz
  };
  let ComponentToLoad = $derived.by(() => {
    return vizComponents[vizType];
  });
</script>

{#if ComponentToLoad}
  <ComponentToLoad {locations} {startDate} {endDate} {twoColumns} />
{/if}

{#if !ComponentToLoad}
  <p>viz=${JSON.stringify(vizType)} not found. Must be one of {Object.keys(vizComponents)}</p>
{/if}
