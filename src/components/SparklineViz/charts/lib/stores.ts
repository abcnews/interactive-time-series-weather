import { broadcastable } from './broadcastable';
import { derived, readable, writable } from 'svelte/store';
import type { ObservationType } from './data';
import { metricProperties, TUE_5PM } from './constants';

export const now = readable(Date.now(), set => {
  set(Math.min(Date.now(), TUE_5PM));

  const interval = setInterval(() => {
    set(Math.min(Date.now(), TUE_5PM));
  }, 1000);

  return () => clearInterval(interval);
});

export const hoursAgo24 = derived(now, now => {
  return now - 1000 * 60 * 60 * 24;
});
export const hoursAgo3 = derived(now, now => {
  return now - 1000 * 60 * 60 * 3;
});
export const hoursAgo12 = derived(now, now => {
  return now - 1000 * 60 * 60 * 12;
});

export const extentStores = Object.fromEntries(
  Object.keys(metricProperties).map(key => {
    return [key, broadcastable<{ y: [number, number]; x: [number, number] } | undefined>('extents-' + key, undefined)];
  })
);

export const devmode = readable(false, (set, update) => {
  let devmodeToggleCount = 0;
  let devmodeCountTimeout: ReturnType<typeof setTimeout> | undefined;

  const listener = (evt: KeyboardEvent) => {
    if (evt.key === 'D') {
      devmodeToggleCount++;

      if (!devmodeCountTimeout) {
        devmodeCountTimeout = setTimeout(() => {
          devmodeToggleCount = 0;
          devmodeCountTimeout = undefined;
        }, 1000);
      }
      if (devmodeToggleCount > 2) {
        update(current => {
          return !current;
        });
        clearTimeout(devmodeCountTimeout);
        devmodeToggleCount = 0;
      }
    }
  };

  addEventListener('keyup', listener);

  return () => {
    removeEventListener('keyup', listener);
    clearTimeout(devmodeCountTimeout);
  };
});

export const activeObservation = writable<null | ObservationType>(null);

/** When this is true we don't close the popup in the WeatherChart root because the click came from an interaction with the chart. */
export const observationHandlingLeave = writable<boolean>(false);
