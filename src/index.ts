import acto from '@abcnews/alternating-case-to-object';
import { whenDOMReady } from '@abcnews/env-utils';
import { getMountValue, selectMounts } from '@abcnews/mount-utils';
// import MapViz from './components/MapViz/MapViz.svelte';
import { mount } from 'svelte';
import SparklineViz from './components/SparklineViz/SparklineViz.svelte';
import { setTransparent } from './components/util';
setTransparent();

whenDOMReady.then(() => {
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
    const locationParams = params.get('locations') || 'Brisbane,Sydney,Melbourne,Adelaide';
    const locations = locationParams.split(',');
    mount(SparklineViz, {
      target: sparklineMountEl,
      props: { locations }
    });
  }
});

if (process.env.NODE_ENV === 'development') {
  console.debug(`[interactive-time-series-weather-map] public path: ${__webpack_public_path__}`);
}
