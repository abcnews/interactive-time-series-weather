import { debounce } from 'lodash-es';

export const DATA_URL = 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/tempc.json';
export const LOCATIONS_URL = 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/au.geo.json';

/**
 * Sets the parent iframe's color scheme to "light" so that we can set a
 * transparent iframe background.
 */
export function setTransparent() {
  // don't do this. Is this causing crashes? Maybe. Let's find out.
  // try {
  //   const frame = Array.from(window.parent.document.querySelectorAll('iframe'))?.find(
  //     iframe => (iframe.src = String(window.location))
  //   );
  //   if (frame) {
  //     frame.style.colorScheme = 'light';
  //   }
  // } catch (e: any) {
  //   console.warn('Interactive: Could not set dark mode on iframe. This only works in prod/same domain.', e.message);
  // }
}

let prevHeight = 0;

export function emitResize(height: number) {
  if (prevHeight === height) {
    console.warn('Not resizing, same height as before.');
    return;
  }
  prevHeight = height;
  var payload = {
    type: 'embed-size',
    height
  };
  window.parent?.postMessage(payload, '*');
}
