import type { FeatureCollection, Geometry } from 'geojson';

type LocationsFeatureCollection = FeatureCollection<
  Geometry,
  {
    name: string;
    auroraId: string;
    height?: number;
    colour?: string;
    temp?: number | null;
  }
>;

type TimeSeriesData = {
  timestamps: string[];
  series: Record<string, (number | null)[]>;
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
