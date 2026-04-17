import { broadcastable } from './broadcastable';
import { writable } from 'svelte/store';
import type { ObservationType, MetricType } from '../../../lib/chartTypes';
import { metricProperties } from '../../../lib/chartTypes';

export const rawData = writable<
  Array<{
    /** The name of the chart (e.g., location name) */
    name: string;
    /** Array of data points for the chart */
    chartData: Array<{ x: number; y: number }>;
  }>
>();

export const extentStores = Object.fromEntries(
  Object.keys(metricProperties).map(key => {
    return [key, broadcastable<{ y: [number, number]; x: [number, number] } | undefined>('extents-' + key, undefined)];
  })
);

export const activeObservation = writable<null | ObservationType>(null);

/** When this is true we don't close the popup in the WeatherChart root because the click came from an interaction with the chart. */
export const observationHandlingLeave = writable<boolean>(false);
