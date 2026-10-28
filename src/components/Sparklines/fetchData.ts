import type { DataStatus, LocationsFeatureCollection, StationDayData } from '../../types';
import { metricProperties, type MetricType } from '../../lib/chartTypes';
import { LOCATIONS_URL } from '../../lib/util';

const DAY_MS = 24 * 60 * 60 * 1000;
const BOM_ID = /^\d+$/;

/** We have no high-res data of any metric before this date (YYYY-MM-DD). */
export const DATA_START = '2026-09-28';

export type Point = { x: number; y: number; gapBefore?: boolean };
export type Chart = { name: string; chartData: Point[] };
type DateRange = { startDate?: string; endDate?: string };
type DailyByYear = Record<string, Array<number | null>>;

// ---------------------------------------------------------------------------
// Locations and dates
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Live (high-res) data: one tiny file per station per day
// ---------------------------------------------------------------------------

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
 * Fetch live data for the given locations and date range. Every station-day file is
 * requested in parallel; they're small and the browser caches them.
 */
async function fetchLive({
  locations,
  range,
  metric,
  initialTotals = {}
}: {
  locations: string[];
  range: DateRange;
  metric: MetricType;
  /** Starting value of the running total (aggregate: 'cumulative'), keyed by BOM ID, e.g. rain that fell before `range`. */
  initialTotals?: Record<string, number>;
}): Promise<Chart[]> {
  const { dataUrl, aggregate, parseValue = (num: number) => num } = metricProperties[metric];
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

          if (aggregate === 'cumulative' && typeof y === 'number') {
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

// ---------------------------------------------------------------------------
// Historical data (before DATA_START): compact daily BOM files, one per station
//
// In the BOM files a `null` means no measurement was recorded for that day. Days that are
// missing from the file (e.g. trailing days, or a year with no key) are treated the same way.
// Missing days are left out of the running total and reported to the reader as a warning.
// Days before a station's first record are not "missing" (the station didn't exist yet).
// ---------------------------------------------------------------------------

/** Index into the daily array for a YYYY-MM-DD date (0 = 1 January). */
export function dayIndex(date: string) {
  const year = Number(date.slice(0, 4));
  return (Date.parse(date) - Date.UTC(year, 0, 1)) / DAY_MS;
}

/** First YYYY-MM-DD with a recorded value, or null if there is none. */
export function firstRecordDate(dailyByYear: DailyByYear): string | null {
  const [firstDate = null] = Object.keys(dailyByYear)
    .sort()
    .flatMap(year => {
      const index = dailyByYear[year].findIndex(v => typeof v === 'number');
      return index === -1 ? [] : [new Date(Date.UTC(Number(year), 0, 1 + index)).toISOString().slice(0, 10)];
    });
  return firstDate;
}

/**
 * Daily points (plotted at midday UTC) for one station, for the given YYYY-MM-DD dates.
 * `total` is the running total at the end, used to seed the live data.
 */
export function buildHistoricalPoints({
  dailyByYear,
  dates,
  aggregate
}: {
  dailyByYear: DailyByYear;
  dates: string[];
  aggregate?: 'cumulative';
}) {
  const firstRecord = firstRecordDate(dailyByYear);
  const recordedDates = firstRecord ? dates.filter(date => date >= firstRecord) : [];

  const state = recordedDates.reduce(
    (acc, date) => {
      const value = dailyByYear[date.slice(0, 4)]?.[dayIndex(date)];
      if (typeof value !== 'number') {
        acc.missing.push(date); // null, or beyond the end of the stored array
        acc.pendingGap = true;
        return acc;
      }

      acc.total = Math.round((acc.total + value) * 10) / 10; // BOM is 0.1 precision; avoid float drift
      // Break the line after missing days (no break if nothing has been plotted yet)
      acc.chartData.push({
        x: Date.parse(date) + DAY_MS / 2,
        y: aggregate === 'cumulative' ? acc.total : value,
        ...(acc.pendingGap && acc.chartData.length > 0 ? { gapBefore: true } : {})
      });
      acc.pendingGap = false;
      return acc;
    },
    { chartData: [] as Point[], total: 0, missing: [] as string[], pendingGap: false }
  );

  const { pendingGap: endsWithGap, ...result } = state;
  return { ...result, endsWithGap };
}

async function fetchHistoricalStation({
  bomId,
  dates,
  metric
}: {
  bomId: string;
  dates: string[];
  metric: MetricType;
}) {
  const { historical, aggregate } = metricProperties[metric];
  const file = await fetch(`${historical?.url}/${bomId}.json`)
    .then(res => (res.ok ? (res.json() as Promise<Record<string, unknown>>) : null))
    .catch(() => null);

  // Missing or unreadable file: carry on as if no data was received for this period.
  if (!file || !historical) {
    return { chartData: [] as Point[], total: 0, missing: [] as string[], endsWithGap: false, name: null };
  }

  const dailyByYear = (file[historical.field] ?? {}) as DailyByYear;
  const name = typeof file.storyLabName === 'string' ? file.storyLabName : null;
  return { ...buildHistoricalPoints({ dailyByYear, dates, aggregate }), name };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/** True if any chart has data, i.e. the source actually contributed something worth attributing. */
const hasPoints = (charts: Chart[]) => charts.some(({ chartData }) => chartData.length > 0);

type HistoricalStation = Awaited<ReturnType<typeof fetchHistoricalStation>>;

/**
 * Join each station's historical points and live points into one chart. `stations`, `past` and
 * `live` are index-aligned (live is empty when the range ends before DATA_START).
 */
export function stitchCharts({
  stations,
  past,
  live
}: {
  stations: Array<{ bomId: string; override?: string }>;
  past: HistoricalStation[];
  live: Chart[];
}): Chart[] {
  return stations.map(({ bomId, override }, i) => {
    // fetchLive falls back to the bare BOM ID when it has no name, so treat that as "no name"
    const liveName = live[i]?.name !== bomId ? live[i]?.name : undefined;
    // Display override wins, then the live data's name, then the BOM file's storyLabName
    const name = override || liveName || past[i].name || bomId;
    // If days were missing right up to the cutoff, break the line where the live data begins
    const liveData = (live[i]?.chartData ?? []).map((point, index) =>
      index === 0 && past[i].endsWithGap && past[i].chartData.length > 0 ? { ...point, gapBefore: true } : point
    );
    return { name, chartData: [...past[i].chartData, ...liveData] };
  });
}

/**
 * Fetch charts for the given locations, date range and metric.
 *
 * Metrics with a `historical` source use it for dates before DATA_START and live data
 * from then on. Ranges crossing the cutoff use both, with any running total carried across.
 */
export async function fetchData({
  locations,
  range = { startDate: '2026-01-01', endDate: '2026-01-07' },
  metric
}: {
  locations: string[];
  range?: DateRange;
  metric: MetricType;
}): Promise<{ charts: Chart[]; status: DataStatus }> {
  const { historical, aggregate } = metricProperties[metric];
  const { startDate = '', endDate = '' } = range;
  const historicalDates = historical ? getDatesInRange(range).filter(date => date < DATA_START) : [];

  // No historical source, or nothing before the cutoff (or no valid range): live data only.
  if (historicalDates.length === 0) {
    const charts = await fetchLive({ locations, range, metric });
    return { charts, status: { usedLive: hasPoints(charts), usedHistorical: false, hasMissingData: false } };
  }

  const stations = await resolveLocations(locations);
  const past = await Promise.all(
    stations.map(({ bomId }) => fetchHistoricalStation({ bomId, dates: historicalDates, metric }))
  );

  // Range extends past the cutoff: fetch live data, starting from the historical total.
  const live =
    endDate >= DATA_START
      ? await fetchLive({
          // Already resolved to BOM IDs, so fetchLive won't re-fetch the locations file
          locations: stations.map(({ bomId, override }) => (override ? `${bomId}|${override}` : bomId)),
          range: { startDate: startDate > DATA_START ? startDate : DATA_START, endDate },
          metric,
          initialTotals:
            aggregate === 'cumulative'
              ? Object.fromEntries(stations.map(({ bomId }, i) => [bomId, past[i].total]))
              : {}
        })
      : [];

  return {
    charts: stitchCharts({ stations, past, live }),
    status: {
      usedLive: hasPoints(live),
      // Attribution is only needed if historical data actually made it onto a chart
      usedHistorical: past.some(station => station.chartData.length > 0),
      hasMissingData: past.some(station => station.missing.length > 0)
    }
  };
}
