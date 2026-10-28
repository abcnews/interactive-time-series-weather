import { describe, expect, it } from 'vitest';
import { buildHistoricalPoints, dayIndex, firstRecordDate, getDatesInRange, stitchCharts } from './fetchData';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('dayIndex', () => {
  it('is 0 on 1 January and counts leap days', () => {
    expect(dayIndex('2026-01-01')).toBe(0);
    expect(dayIndex('2026-03-01')).toBe(59);
    expect(dayIndex('2024-03-01')).toBe(60);
  });
});

describe('firstRecordDate', () => {
  it('skips leading nulls and earlier empty years', () => {
    expect(firstRecordDate({ '2024': [null, null], '2025': [null, null, 1.2] })).toBe('2025-01-03');
  });

  it('is null when nothing was recorded', () => {
    expect(firstRecordDate({ '2025': [null] })).toBeNull();
  });
});

describe('stitchCharts', () => {
  const station = { bomId: '123' };
  const historicalPoints = [{ x: 1, y: 1 }];
  const livePoints = [
    { x: 2, y: 2 },
    { x: 3, y: 3 }
  ];
  const past = (overrides = {}) => ({
    chartData: historicalPoints,
    total: 1,
    missing: [],
    endsWithGap: false,
    name: 'BOM name',
    ...overrides
  });

  it('puts historical points before live points', () => {
    const [chart] = stitchCharts({ stations: [station], past: [past()], live: [{ name: 'Live', chartData: livePoints }] });
    expect(chart.chartData.map(({ x }) => x)).toEqual([1, 2, 3]);
  });

  it('names a chart: override, then live name, then BOM name, then BOM ID', () => {
    const name = (override: string | undefined, liveName: string, bomName: string | null) =>
      stitchCharts({
        stations: [{ ...station, override }],
        past: [past({ name: bomName })],
        live: [{ name: liveName, chartData: [] }]
      })[0].name;

    expect(name('Mine', 'Live', 'BOM name')).toBe('Mine');
    expect(name(undefined, 'Live', 'BOM name')).toBe('Live');
    expect(name(undefined, '123', 'BOM name')).toBe('BOM name'); // live falls back to the bare ID
    expect(name(undefined, '123', null)).toBe('123');
  });

  it('breaks the line at the join only if historical data ended in a gap', () => {
    const live = [{ name: 'Live', chartData: livePoints }];
    const joined = (endsWithGap: boolean) =>
      stitchCharts({ stations: [station], past: [past({ endsWithGap })], live })[0].chartData[1];

    expect(joined(true).gapBefore).toBe(true);
    expect(joined(false).gapBefore).toBeUndefined();
  });

  it('works when the range has no live data', () => {
    const [chart] = stitchCharts({ stations: [station], past: [past()], live: [] });
    expect(chart.chartData).toEqual(historicalPoints);
  });
});

describe('buildHistoricalPoints', () => {
  const dailyByYear = { '2026': [1.1, 0.2, null, 0.4] };
  const dates = getDatesInRange({ startDate: '2026-01-01', endDate: '2026-01-04' });

  it('keeps a running total at 0.1 precision when cumulative', () => {
    const { chartData, total } = buildHistoricalPoints({ dailyByYear, dates, aggregate: 'cumulative' });
    expect(chartData.map(({ y }) => y)).toEqual([1.1, 1.3, 1.7]);
    expect(total).toBe(1.7);
  });

  it('plots raw values when not aggregating', () => {
    const { chartData } = buildHistoricalPoints({ dailyByYear, dates });
    expect(chartData.map(({ y }) => y)).toEqual([1.1, 0.2, 0.4]);
  });

  it('reports missing days and breaks the line after them', () => {
    const { chartData, missing, endsWithGap } = buildHistoricalPoints({ dailyByYear, dates });
    expect(missing).toEqual(['2026-01-03']);
    expect(chartData[2].gapBefore).toBe(true);
    expect(chartData[1].gapBefore).toBeUndefined();
    expect(endsWithGap).toBe(false);
  });

  it('flags a gap that runs up to the end of the period', () => {
    const { endsWithGap } = buildHistoricalPoints({ dailyByYear: { '2026': [1, null] }, dates: dates.slice(0, 2) });
    expect(endsWithGap).toBe(true);
  });

  it('ignores days before the first record rather than calling them missing', () => {
    const { chartData, missing } = buildHistoricalPoints({ dailyByYear: { '2026': [null, 2] }, dates: dates.slice(0, 2) });
    expect(missing).toEqual([]);
    expect(chartData).toHaveLength(1);
  });

  it('plots points at midday UTC', () => {
    const { chartData } = buildHistoricalPoints({ dailyByYear, dates });
    expect(chartData[0].x).toBe(Date.parse('2026-01-01') + DAY_MS / 2);
  });
});
