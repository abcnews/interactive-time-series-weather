export const DATA_URL = 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-time-series-weather/tempc.json';

/**
 * Sets the parent iframe's color scheme to "light" so that we can set a
 * transparent iframe background.
 */
export function setTransparent() {
  try {
    const frame = Array.from(window.parent.document.querySelectorAll('iframe'))?.find(
      iframe => (iframe.src = String(window.location))
    );
    if (frame) {
      frame.style.colorScheme = 'light';
    }
  } catch (e) {
    console.warn('Interactive: Could not set dark mode on iframe. This only works in prod/same domain.', e.message);
  }
}

export function emitResize(height: number) {
  var payload = {
    type: 'embed-size',
    height
  };
  window.parent?.postMessage(payload, '*');
}
