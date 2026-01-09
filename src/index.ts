import acto from '@abcnews/alternating-case-to-object';
import { whenDOMReady } from '@abcnews/env-utils';
import { getMountValue, selectMounts } from '@abcnews/mount-utils';
// import MapViz from './components/MapViz/MapViz.svelte';
import { mount } from 'svelte';
import TempCSparklineViz from './components/Sparklines/TempCSparklineViz.svelte';
import AverageWindSpeedKmViz from './components/Sparklines/AverageWindSpeedKmViz.svelte';

whenDOMReady.then(async () => {
  // const [mapMountEl] = selectMounts('interactivetimeseriesweathermap');

  // if (mapMountEl) {
  //   const appProps = acto(getMountValue(mapMountEl));
  //   mount(MapViz, {
  //     target: mapMountEl,
  //     props: appProps
  //   });
  // }

  const [sparklineMountEl] = selectMounts('interactivetimeseriesweathersparkline');

  if (sparklineMountEl) {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('viz') || '';
    const locationParams = params.get('locations') || 'Brisbane,Sydney,Melbourne,Adelaide';
    const locations = locationParams.split(',');

    const vizComponents = {
      tempc: TempCSparklineViz,
      wind: AverageWindSpeedKmViz
    };
    const ComponentToLoad = vizComponents[typeParam];
    if (!ComponentToLoad) {
      throw new Error(`viz=${JSON.stringify(typeParam)} not found. Must be one of ${Object.keys(vizComponents)}`);
    }
    mount(ComponentToLoad, {
      target: sparklineMountEl,
      props: { locations }
    });
  }

  const [builderMountEl] = selectMounts('interactivetimeseriesweatherbuilder');

  if (builderMountEl) {
    const appProps = acto(getMountValue(builderMountEl));
    const builderModule = await import('./components/Builder/Builder.svelte');
    mount(builderModule.default, {
      target: builderMountEl,
      props: appProps
    });
  }
});

if (process.env.NODE_ENV === 'development') {
  console.debug(`[interactive-time-series-weather-map] public path: ${__webpack_public_path__}`);
}
