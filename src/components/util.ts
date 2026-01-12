import { BroadcastBlocker } from './broadcastBlocker';

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

/**
 * Standard fetch() but with request blocking, so other iframes don't try to request data in parallel and void the cache.
 */
export async function blockingFetch(input: string, init?: RequestInit | undefined): Promise<Response> {
  const name = `abc:news:fetchBlock:${input.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const broadcastBlocker = new BroadcastBlocker(name);
  await broadcastBlocker.waitUntilUnblocked();

  broadcastBlocker.block();
  const response = await fetch(input, init);
  broadcastBlocker.unblock();
  return response;
}
