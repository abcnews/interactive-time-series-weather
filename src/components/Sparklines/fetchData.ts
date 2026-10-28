import type { LocationsFeatureCollection, StationDayData } from '../../types';
import { metricProperties, type MetricType } from '../../lib/chartTypes';
import { LOCATIONS_URL } from '../../lib/util';

const DAY_MS = 24 * 60 * 60 * 1000;
const BOM_ID = /^\d+$/;

/** We have no high-res data of any metric before this date (YYYY-MM-DD). */
export const DATA_START = '2026-09-28';

/** Every YYYY-MM-DD from startDate to endDate, inclusive */
export function getDatesInRange({ startDate = '', endDate = '' }) {
  const dayCount = (Number(new Date(endDate)) - Number(new Date(startDate))) / DAY_MS + 1;
  return Array.from({ length: Math.max(dayCount, 0) }, (_, i) =>
    new Date(Number(new Date(startDate)) + i * DAY_MS).toISOString().slice(0, 10)
  );
}

/**
 * Locations are "BOMID|Display Override" or "BOMID". Legacy embeds use station names
 * ("Whyalla Aero|Whyalla"), which we can only map to a BOM ID with the locations file,
 * so it's fetched only when a name is present. Names that match no station are dropped.
 */
export async function resolveLocations(locations: string[]) {
  const parsed = locations.map(location => {
    const [identifier = '', override] = location.split('|');
    return { identifier, override };
  });

  const geojson = parsed.every(({ identifier }) => BOM_ID.test(identifier))
    ? undefined
    : await fetch(LOCATIONS_URL).then(res => res.json() as Promise<LocationsFeatureCollection>);

  return parsed.flatMap(({ identifier, override }) => {
    const bomId = BOM_ID.test(identifier)
      ? identifier
      : geojson?.features.find(f => f.properties.storyLabName === identifier)?.properties.bomId;
    return bomId ? [{ bomId, override }] : [];
  });
}

/**
 * Each station has one tiny file per day: `<dataUrl>/<YYYY-MM-DD>/<bomId>.json`.
 * Days without a file (not generated yet, or before we started recording) come back as null.
 */
function fetchStationDay(dataUrl: string, bomId: string, date: string): Promise<StationDayData | null> {
  return fetch(`${dataUrl}/${date}/${bomId}.json`)
    .then(res => (res.ok ? (res.json() as Promise<StationDayData>) : null))
    .catch(() => null);
}

/**
 * Fetch data for the given locations and date range. Every station-day file is
 * requested in parallel; they're small and the browser caches them.
 */
export async function fetchData({
  locations,
  range = { startDate: '2026-01-01', endDate: '2026-01-07' },
  metric,
  initialTotals = {}
}: {
  locations: string[];
  range?: { startDate?: string; endDate?: string };
  metric: MetricType;
  /** Starting value of the rainCumulative running total, keyed by BOM ID (e.g. rain that fell before `range`). */
  initialTotals?: Record<string, number>;
}): Promise<Array<{ name: string; chartData: Array<{ x: number; y: number }> }>> {
  const { dataUrl, parseValue = (num: number) => num } = metricProperties[metric];
  // Hard clamp (all metrics): never request days before we started recording
  const dates = getDatesInRange(range).filter(date => date >= DATA_START);

  return Promise.all(
    (await resolveLocations(locations)).map(async ({ bomId, override }) => {
      const days = await Promise.all(dates.map(date => fetchStationDay(dataUrl, bomId, date)));
      const availableDays = days.filter(day => day !== null);

      // Transform the daily files into a single flat {x, y}[] array suitable for
      // charting, where x is a Unix timestamp (ms) and y is the parsed observation value.
      let runningTotal = initialTotals[bomId] ?? 0;
      const chartData = availableDays.flatMap(({ startDate, series }) =>
        // Each value is [offsetMinutes, reading] — convert the offset to an absolute timestamp
        series.map(([offsetMinutes, value]) => {
          const x = Number(new Date(startDate)) + offsetMinutes * 60 * 1000;
          const y = typeof value === 'number' ? parseValue(value) : value;

          if (metric === 'rainCumulative' && typeof y === 'number') {
            runningTotal += y;
            return { x, y: runningTotal };
          }
          return { x, y };
        })
      );

      // Sort by timestamp to handle any out-of-order points or boundary leaks,
      // and remove exact duplicates to keep the line clean.
      const sortedData = chartData.sort((a, b) => a.x - b.x).filter((d, i, arr) => i === 0 || d.x !== arr[i - 1].x);

      return { name: override || availableDays[0]?.name || bomId, chartData: sortedData };
    })
  );
}
