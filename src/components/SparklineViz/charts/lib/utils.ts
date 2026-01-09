// Run a function repeatedly but back off exponentially
export const backoff = (fn: () => void, interval = 1000) => {
  const run = () => {
    fn();
    setTimeout(run, interval);
    interval *= 2;
  };
  run();
};

/**
 * Calculate domain bounds from data values with optional padding
 * @param values Array of numeric values
 * @param padding Percentage padding to add to min/max (default: 0.1 = 10%)
 * @returns [min, max] domain bounds
 */
export function calculateDomain(values: number[], padding = 0.1): [number, number] {
  if (values.length === 0) {
    return [0, 100]; // Default fallback
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const paddingAmount = range * padding;

  return [min - paddingAmount, max + paddingAmount];
}
