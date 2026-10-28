import type { FeatureCollection, Geometry } from 'geojson';

export type LocationsFeatureCollection = FeatureCollection<
  Geometry,
  {
    /** Canonical place name; the source of truth for all display names */
    storyLabName: string;
    auroraId: string;
    bomId: string;
    wmoId?: string;
    metraId?: string;
    height?: number;
    colour?: string;
    temp?: number | null;
  }
>;

/**
 * One station's observations for one day, from `<dataUrl>/<YYYY-MM-DD>/<bomId>.json`.
 */
export type StationDayData = {
  name: string;
  updatedDate: string;
  /** Start of the day, ISO 8601. Each point's minute offset is from here */
  startDate: string;
  /** [minutes since startDate, observation value] */
  series: Array<[number, number]>;
};

// Weather Chart Data Models
export type ObservationType = {
  local_date_time: string;
  aifstime_utc: Date;
  gust_kmh: number | null;
  air_temp: number;
  wind_dir: string;
  wind_spd_kmh: number;
  rain_trace_accumulation: number | null;
};

export type LocationType = {
  name: string;
  slug: string;
  refresh_message: string;
  observations: ObservationType[];
};

/** Which sources made it onto the chart; drives attribution and the Builder's warnings. */
export type DataStatus = {
  /** False when none of the data came from the live source, so the live source isn't credited. */
  usedLive: boolean;
  usedHistorical: boolean;
  /** Historical data had days with no reading */
  hasMissingData: boolean;
};

// Available Chart Metrics
export type MetricType = 'gust' | 'rainSince9am' | 'humidity' | 'tempc' | 'rainCumulative';

/**
 * Daily BOM data covering the period before our own high-res data starts (`DATA_START`).
 * One file per station at `<url>/<bomId>.json`; `field` is the key holding `{ [year]: daily values }`.
 */
export type HistoricalSource = {
  url: string;
  field: string;
};

export type MetricProps = {
  name: string;
  editorialNotes: string;
  parseValue?: (value: number) => number;
  formatValue: (value: number) => string;
  dataUrl: string;
  /** 'cumulative' turns each reading into a running total across the whole range. Absent = plot values as-is. */
  aggregate?: 'cumulative';
  /** Absent = live data only */
  historical?: HistoricalSource;
  attribution: string;
  colour: string;
  darkColour: string;
  yMin?: number;
  yMax?: number;
};
