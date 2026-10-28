<script lang="ts">
  import SparklineViz from '../SparklineViz/SparklineViz.svelte';
  import { fetchData, getDatesInRange, resolveLocations, DATA_START } from './fetchData';
  import { metricProperties } from '../../lib/chartTypes';

  let {
    locations = ['Brisbane', 'Sydney', 'Melbourne', 'Adelaide'],
    startDate = '',
    endDate = '',
    twoColumns = true
  } = $props();

  const metric = metricProperties.rainCumulative;

  // ---------------------------------------------------------------------------
  // BOM historical supplement
  // Dates before BOM_CUTOFF come from the compact daily BOM dataset; dates on/after it
  // come from our high-res data. Cumulative totals run across the whole range.
  //
  // In the BOM files a `null` means no measurement was recorded for that day. Days that are
  // missing from the file (e.g. trailing days, or a year with no key) are treated the same way.
  // Missing days are left out of the running total and reported to the reader as a warning.
  // Days before a station's first record are not "missing" (the station didn't exist yet).
  // ---------------------------------------------------------------------------
  const BOM_URL = 'https://abcnewsdata.sgp1.digitaloceanspaces.com/data-bom-weather-historical/rainfall';
  const BOM_CUTOFF = DATA_START; // BOM covers everything before our own data starts
  const DAY_MS = 24 * 60 * 60 * 1000;

  type BomFile = {
    storyLabName?: string;
    rainMm: Record<string, Array<number | null>>;
  };
  type Chart = Awaited<ReturnType<typeof fetchData>>[number];
  type Point = Chart['chartData'][number] & { gapBefore?: boolean };
  type MissingReport = { name: string; dates: string[] };

  // True when BOM data ends up in the chart; drives the attribution line.
  let usedBom = $state(false);
  // Stations with at least one missing day in the BOM period; drives the warning.
  let missingReports = $state<MissingReport[]>([]);

  /** Index into the daily array for a YYYY-MM-DD date (0 = 1 January). */
  function dayIndex(date: string) {
    const year = Number(date.slice(0, 4));
    return (Date.parse(date) - Date.UTC(year, 0, 1)) / DAY_MS;
  }

  /** First YYYY-MM-DD with a recorded value in the file, or null if the file has none. */
  function firstRecordDate(file: BomFile): string | null {
    const years = Object.keys(file.rainMm ?? {}).sort();
    for (const year of years) {
      const index = file.rainMm[year].findIndex(v => typeof v === 'number');
      if (index !== -1) return new Date(Date.UTC(Number(year), 0, 1 + index)).toISOString().slice(0, 10);
    }
    return null;
  }

  /** Daily cumulative points (plotted at midday UTC) for one station, for the given YYYY-MM-DD dates. */
  async function fetchBomCumulative(bomId: string, dates: string[]) {
    const file = await fetch(`${BOM_URL}/${bomId}.json`)
      .then(res => (res.ok ? (res.json() as Promise<BomFile>) : null))
      .catch(() => null);

    // Missing or unreadable file: carry on as if no data was received for this period.
    if (!file) {
      return { chartData: [] as Point[], total: 0, name: null, missing: [] as string[], endsWithGap: false };
    }

    const firstRecord = firstRecordDate(file);
    let total = 0;
    const chartData: Point[] = [];
    const missing: string[] = [];
    let pendingGap = false; // a day was missing since the last plotted point

    for (const date of dates) {
      if (!firstRecord || date < firstRecord) continue; // before the station's record began

      const rain = file.rainMm?.[date.slice(0, 4)]?.[dayIndex(date)];
      if (typeof rain !== 'number') {
        missing.push(date); // null, or beyond the end of the stored array
        pendingGap = true;
        continue;
      }

      total = Math.round((total + rain) * 10) / 10; // BOM is 0.1 mm precision; avoid float drift
      // Break the line after missing days (no break if nothing has been plotted yet)
      chartData.push({
        x: Date.parse(date) + DAY_MS / 2,
        y: total,
        ...(pendingGap && chartData.length > 0 ? { gapBefore: true } : {})
      });
      pendingGap = false;
    }
    return { chartData, total, name: file.storyLabName ?? null, missing, endsWithGap: pendingGap };
  }

  /**
   * Like fetchData for rainCumulative, but dates before BOM_CUTOFF use BOM daily data.
   * Ranges crossing the cutoff use both, with the running total carried across.
   */
  async function fetchRainWithBom(): Promise<{ charts: Chart[]; usedBom: boolean; missing: MissingReport[] }> {
    const bomDates = getDatesInRange({ startDate, endDate }).filter(date => date < BOM_CUTOFF);

    // Nothing before the cutoff (or no valid range): existing behaviour.
    if (bomDates.length === 0) {
      return {
        charts: await fetchData({ locations, range: { startDate, endDate }, metric: 'rainCumulative' }),
        usedBom: false,
        missing: []
      };
    }

    const stations = await resolveLocations(locations);
    const bom = await Promise.all(stations.map(({ bomId }) => fetchBomCumulative(bomId, bomDates)));

    // Range extends past the cutoff: fetch high-res data, starting from the BOM total.
    const hasLiveData = endDate >= BOM_CUTOFF;
    const live = hasLiveData
      ? await fetchData({
          // Already resolved to BOM IDs, so fetchData won't re-fetch the locations file
          locations: stations.map(({ bomId, override }) => (override ? `${bomId}|${override}` : bomId)),
          range: { startDate: startDate > BOM_CUTOFF ? startDate : BOM_CUTOFF, endDate },
          metric: 'rainCumulative',
          initialTotals: Object.fromEntries(stations.map(({ bomId }, i) => [bomId, bom[i].total]))
        })
      : [];

    const missing: MissingReport[] = [];
    const charts = stations.map(({ bomId, override }, i) => {
      // fetchData falls back to the bare BOM ID when it has no name, so treat that as "no name"
      const liveName = live[i]?.name !== bomId ? live[i]?.name : undefined;
      // Display override wins, then the high-res data's name, then the BOM file's storyLabName
      const name = override || liveName || bom[i].name || bomId;
      if (bom[i].missing.length > 0) missing.push({ name, dates: bom[i].missing });
      // If BOM days were missing right up to the cutoff, break the line where the high-res data begins
      const liveData: Point[] = (live[i]?.chartData ?? []).map((point, index) =>
        index === 0 && bom[i].endsWithGap && bom[i].chartData.length > 0 ? { ...point, gapBefore: true } : point
      );
      return { name, chartData: [...bom[i].chartData, ...liveData] };
    });

    // Attribution is only needed if BOM data actually made it onto a chart
    return { charts, usedBom: bom.some(s => s.chartData.length > 0), missing };
  }
</script>

<SparklineViz
  {...metric}
  {twoColumns}
  showMaxOnly
  placeholders={locations}
  loadData={async () => {
    const result = await fetchRainWithBom();
    usedBom = result.usedBom;
    missingReports = result.missing;

    return { charts: result.charts };
  }}
/>

{#if usedBom}
  <p>
    Rainfall data: © <a href="https://www.bom.gov.au/">Bureau of Meteorology</a>, from
    <a href="https://www.bom.gov.au/climate/data/">CDO</a>.
    <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Cumulative totals were calculated, provided
    without warranties of any kind.
  </p>
{/if}
