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
import { metricProperties } from './constants';

const ObservationSchema = object({
  local_date_time: string(),
  // local_date_time_full: pipe(string(), transform(Number), number()),
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

const LocationSchema = object({
  name: string(),
  refresh_message: string(),
  observations: array(ObservationSchema)
});

export type ObservationType = InferOutput<typeof ObservationSchema>;

const MetricSchema = union([literal('gust'), literal('rainSince9am'), literal('humidity'), literal('tempc')]);
export type MetricType = InferOutput<typeof MetricSchema>;
