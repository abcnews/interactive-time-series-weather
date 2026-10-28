import { getContext, setContext } from 'svelte';
import type { DataStatus } from '../../types';

/** Assume live data until told otherwise, so its attribution shows while loading. */
export const DEFAULT_DATA_STATUS: DataStatus = { usedLive: true, usedHistorical: false, hasMissingData: false };

const CONTEXT_KEY = Symbol('dataStatus');

/**
 * For a parent (the Builder) that wants to know what the chart inside it was made from.
 * Scoped by context rather than a global store, so separate parents never see each other's charts.
 */
export function provideDataStatus() {
  const status = $state<DataStatus>({ ...DEFAULT_DATA_STATUS });
  setContext(CONTEXT_KEY, status);
  return status;
}

/** Call during component init. Returns a function that reports a chart's status to the nearest parent, if any. */
export function getDataStatusReporter() {
  const status = getContext<DataStatus | undefined>(CONTEXT_KEY);
  return (next: DataStatus) => {
    if (status) Object.assign(status, next);
  };
}
