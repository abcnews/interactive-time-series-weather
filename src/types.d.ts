import type { FeatureCollection, Geometry } from 'geojson';

type LocationsFeatureCollection = FeatureCollection<
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
 * @property {string} updatedDate - The date and time when the data was last updated, in ISO 8601 format.
 * @property {string} startDate - The start date and time of the time series, in ISO 8601 format.
 * @property {Record<string, Array<[number, any]>>} series - A record where each key is a location ID and the value is an array of tuples.
 *    Each tuple contains the minutes offset from midnight and the corresponding weather value.
 */
type TimeSeriesData = {
  updatedDate: string;
  startDate: string;
  series: Record<string, Array<[number, any]>>;
};

// Weather Chart types
type ObservationType = {
  local_date_time: string;
  aifstime_utc: Date;
  gust_kmh: number | null;
  air_temp: number;
  wind_dir: string;
  wind_spd_kmh: number;
  rain_trace_accumulation: number | null;
};

type LocationType = {
  name: string;
  slug: string;
  refresh_message: string;
  observations: ObservationType[];
};

type MetricType = 'gust' | 'rain' | 'air_temp';
