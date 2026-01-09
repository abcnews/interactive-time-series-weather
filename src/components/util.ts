export const LOCATIONS_URL = 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/au.geo.json';

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
