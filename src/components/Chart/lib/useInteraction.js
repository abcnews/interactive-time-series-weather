import { bisector } from 'd3-array';
import { get } from 'svelte/store';

/**
 * Handle chart interactions by finding the nearest data point to the pointer.
 * Returns event handlers that can be attached to the SVG or a container.
 */
export function useInteraction(params) {
  const bisectX = bisector((d) => d.x).left;

  function findPoint(event) {
    const { data, xScale } = params;
    if (!data || data.length === 0) return null;

    // Use getBoundingClientRect for robust coordinate calculation.
    const rect = event.currentTarget.getBoundingClientRect();
    let x = event.clientX - rect.left;

    // Adjust x if the interaction layer includes padding (expanded to full SVG surface)
    if (params.padding && params.padding.left) {
      x -= params.padding.left;
    }

    // Scale handling: Standardise extraction from potential Svelte stores or functions
    const scale = typeof xScale === 'function' ? xScale : get(xScale);

    if (!scale || typeof scale.invert !== 'function') return null;

    // Clamp x to the chart area range [0, width]
    const range = scale.range();
    x = Math.max(range[0], Math.min(x, range[1]));

    const xVal = scale.invert(x);
    const index = bisectX(data, xVal);

    if (index === 0) return data[0];
    if (index === data.length) return data[data.length - 1];

    const d0 = data[index - 1];
    const d1 = data[index];

    return xVal - d0.x > d1.x - xVal ? d1 : d0;
  }

  return {
    /**
     * Start the interaction and lock the pointer to this element.
     * setPointerCapture ensures that even if the finger moves outside the chart
     * or at small diagonals, the browser continues to send us events rather than
     * immediately starting a scroll if we haven't crossed the scroll threshold.
     */
    onpointerdown: (event) => {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (e) {
        // Ignore errors for devices/browsers that don't support capture or for invalid pointer IDs
      }
      const point = findPoint(event);
      if (point) params.onenter(point);
    },
    onpointermove: (event) => {
      const point = findPoint(event);
      if (point) params.onenter(point);
    },
    /**
     * Clear the hover state when the pointer leaves the element (mouse only).
     */
    onpointerleave: (event) => {
      if (params.observationHandlingLeave && typeof params.observationHandlingLeave.set === 'function') {
        params.observationHandlingLeave.set(true);
      }

      params.onleave();
    },
    /**
     * Ensure we clear the state when the user lifts their finger or mouse button.
     */
    onpointerup: () => {
      params.onleave();
    },
    /**
     * If the browser takes over (e.g. starting a vertical scroll), immediately
     * clear the interactive labels to avoid "stuck" tooltips.
     */
    onpointercancel: () => {
      params.onleave();
    }
  };
}
