export function emitResize(height: number) {
  var payload = {
    type: 'embed-size',
    height
  };
  window.parent.postMessage(payload, '*');
}

// Run a function repeatedly but back off exponentially
export const backoff = (fn: () => void, interval = 1000) => {
  const run = () => {
    fn();
    setTimeout(run, interval);
    interval *= 2;
  };
  run();
};
