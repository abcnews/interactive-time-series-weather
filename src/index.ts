import acto from '@abcnews/alternating-case-to-object';
import { whenDOMReady } from '@abcnews/env-utils';
import { getMountValue, selectMounts } from '@abcnews/mount-utils';
import { mount } from 'svelte';
import Sparklines from './components/Sparklines/Sparklines.svelte';

whenDOMReady.then(async () => {
  const [sparklineMountEl] = selectMounts('interactivetimeseriesweathersparkline');

  if (sparklineMountEl) {
    const params = new URLSearchParams(location.search);
    const vizType = params.get('viz') || '';
    const locationParams = params.get('locations') || 'Brisbane,Sydney,Melbourne,Adelaide';
    const locations = locationParams.split(',');

    mount(Sparklines, {
      target: sparklineMountEl,
      props: {
        vizType,
        locations
      }
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
