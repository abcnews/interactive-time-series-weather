import {
  type InferOutput,
  array,
  date,
  union,
  isoDateTime,
  nullable,
  number,
  object,
  pipe,
  string,
  transform,
  literal
} from 'valibot';
import { BASE_URL } from './util';

// --- Constants ---

const METRAWEATHER_ATTR = "Times shown in user's local time. Source: MetraWeather.";

// --- Schemas & Types ---

export const ObservationSchema = object({
  local_date_time: string(),
  aifstime_utc: pipe(
    string(),
    transform(str => {
      const segments = str.match(/.{2}/g);
      if (!segments) {
        throw new Error('Invalid date string');
      }
      return `${segments[0]}${segments[1]}-${segments[2]}-${segments[3]}T${segments[4]}:${segments[5]}:${segments[6]}Z`;
    }),
    transform(str => new Date(Date.parse(str))),
    date()
  ),
  gust_kmh: nullable(number()),
  air_temp: number(),
  wind_dir: string(),
  wind_spd_kmh: number(),
  rain_trace_accumulation: nullable(number())
});

export const LocationSchema = object({
  name: string(),
  refresh_message: string(),
  observations: array(ObservationSchema)
});

export type ObservationType = InferOutput<typeof ObservationSchema>;

export const MetricSchema = union([literal('gust'), literal('rainSince9am'), literal('humidity'), literal('tempc')]);
export type MetricType = InferOutput<typeof MetricSchema>;

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

// --- Metric Configuration (The "One-Stop Shop") ---

export const metricProperties: Record<MetricType, MetricProps> = {
  gust: {
    name: 'Wind kilometre per hour (peak gust)',
    editorialNotes: `The wind gust (mean over last 10 min) in km/h. Data is fetched by Data Services every ~30 mins, so we're missing ⅔ the data points required to make an accurate chart. We may miss official max or min values on our chart which may or may not be critical.`,
    // knot to km - https://en.wikipedia.org/wiki/Knot_(unit)
    parseValue: (value: number) => value * 1.852,
    formatValue: (v: number) => `${v.toFixed(0)} km/h`,
    dataUrl: BASE_URL + '/assets/windGustSpdKnots',
    attribution: METRAWEATHER_ATTR,
    colour: '#00297E',
    darkColour: '#AFD6FD',
    yMin: 0
  },
  humidity: {
    name: 'Relative humidity',
    editorialNotes: '',
    formatValue: (v: number) => `${v.toFixed(0)}%`,
    dataUrl: BASE_URL + '/assets/relativeHumidityPct',
    attribution: METRAWEATHER_ATTR,
    colour: '#664CB3',
    darkColour: '#AB96EB',
    yMin: 0,
    yMax: 100
  },
  rainSince9am: {
    name: 'Rainfall (since 9am)',
    editorialNotes: `Rainfall accumulates each day and resets at 9am local time.`,
    dataUrl: BASE_URL + '/assets/precipitationSince9amMM',
    formatValue: (v: number) => `${v.toFixed(0)} mm`,
    attribution: METRAWEATHER_ATTR,
    colour: '#007BC7',
    darkColour: '#0092ED',
    yMin: 0
  },
  tempc: {
    name: 'Temperature (degrees celsius)',
    editorialNotes: ``,
    dataUrl: BASE_URL + '/assets/tempC',
    formatValue: (v: number) => `${v.toFixed(1)}°C`,
    attribution: METRAWEATHER_ATTR,
    colour: '#A61268',
    darkColour: '#BA4A9F'
  }
};
