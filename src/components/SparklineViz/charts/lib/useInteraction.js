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
    onpointerdown: (event) => {
      const point = findPoint(event);
      if (point) params.onenter(point);
    },
    onpointermove: (event) => {
      const point = findPoint(event);
      if (point) params.onenter(point);
    },
    onpointerleave: (event) => {
      if (params.observationHandlingLeave && typeof params.observationHandlingLeave.set === 'function') {
        params.observationHandlingLeave.set(true);
      }
      
      // Don't clear active state on touch to allow label persistence
      if (event.pointerType === 'touch') return;
      
      params.onleave();
    }
  };
}
