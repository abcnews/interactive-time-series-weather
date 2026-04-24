/**
 * Calculate domain bounds from data values with optional padding and rounding.
 * @param values Array of numeric values
 * @param padding Percentage padding to add to min/max (default: 0.1 = 10%)
 * @param roundTo Power of 10 to round to (default: 10)
 * @param minLimit Optional hard minimum limit
 * @param maxLimit Optional hard maximum limit
 * @returns [min, max] domain bounds
 */
export function calculateDomain(
  values: number[],
  padding = 0.1,
  roundTo = 10,
  minLimit?: number,
  maxLimit?: number
): [number, number] {
  if (values.length === 0) {
    const fallbackMin = minLimit ?? 0;
    const fallbackMax = maxLimit ?? 100;
    return [fallbackMin, fallbackMax];
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin;
  const paddingAmount = range * padding;

  let min = rawMin - paddingAmount;
  let max = rawMax + paddingAmount;

  // Zero-guard: If raw data is entirely positive, don't let padding/rounding dip below zero
  if (rawMin >= 0 && min < 0) min = 0;
  // Similarly for negative data (optional but consistent)
  if (rawMax <= 0 && max > 0) max = 0;

  // If a constraint is provided, we clamp to it
  if (minLimit !== undefined) min = Math.max(min, minLimit);
  if (maxLimit !== undefined) max = Math.min(max, maxLimit);

  // Apply rounding to the nearest "roundTo" (usually 10)
  // We floor the min and ceil the max to ensure data fits inside
  if (roundTo > 0) {
    min = Math.floor(min / roundTo) * roundTo;
    max = Math.ceil(max / roundTo) * roundTo;
  }

  // Re-clamp after rounding if needed (e.g. padding + rounding pushed it past a hard limit)
  if (minLimit !== undefined) min = Math.max(min, minLimit);
  if (maxLimit !== undefined) max = Math.min(max, maxLimit);

  // Ensure we have a valid range (at least one tick interval)
  if (min === max) {
    min -= roundTo || 5;
    max += roundTo || 5;
    if (minLimit !== undefined) min = Math.max(min, minLimit);
    if (maxLimit !== undefined) max = Math.min(max, maxLimit);
  }

  return [min, max];
}

/**
 * Estimates the width of a string in ABCSans 8px.
 * Narrow characters like ., -, and ° take up significantly less horizontal space.
 * This is close enough to work, and significantly faster than trying to copyfit.
 * @param str The string to estimate the width of
 * @returns Estimated width in pixels
 */
export function estimateTextWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    if (/[0-9a-zA-Z]/.test(char)) width += 5.5;
    else if (/[.\-°\s,]/.test(char)) width += 2.8;
    else width += 5;
  }
  return width;
}
