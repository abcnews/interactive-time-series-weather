import type { FeatureCollection, Geometry } from 'geojson';

export type LocationsFeatureCollection = FeatureCollection<
  Geometry,
  {
    name: string;
    auroraId: string;
    auroraName?: string;
    height?: number;
    colour?: string;
    temp?: number | null;
  }
>;

/**
 * Represents time series data for weather observations.
 */
export type TimeSeriesData = {
  updatedDate: string;
  startDate: string;
  series: Record<string, Array<[number, any]>>;
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

// Available Chart Metrics
export type MetricType = 'gust' | 'rainSince9am' | 'humidity' | 'tempc' | 'rainCumulative';

export type MetricProps = {
  name: string;
  editorialNotes: string;
  parseValue?: (value: number) => number;
  formatValue: (value: number) => string;
  dataUrl: string;
  attribution: string;
  colour: string;
  darkColour: string;
  yMin?: number;
  yMax?: number;
};
