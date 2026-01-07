import {
  type InferOutput,
  array,
  date,
  union,
  isoDateTime,
  nullable,
  number,
  object,
  parse,
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

export const fetchJurisdictionData = async (jurisdiction: string) => {
  return fetch(
    window.location.hash === '#debug'
      ? '/examples.json'
      : `https://www.abc.net.au/dat/news/wind-tracker-data/${jurisdiction}.json`
  )
    .then(res => res.json())
    .then(d => parse(array(LocationSchema), d));
};

export type LocationType = InferOutput<typeof LocationSchema>;
export type ObservationType = InferOutput<typeof ObservationSchema>;

export const MetricSchema = union([literal('gust'), literal('rain'), literal('swell')]);
export type MetricType = InferOutput<typeof MetricSchema>;

export const filterObservationsWithMissingData = (location: LocationType, metric: MetricType) => {
  return location.observations.flatMap(observation => {
    if (
      observation[metricProperties[metric].property] === null ||
      observation[metricProperties[metric].property] === undefined
    ) {
      console.log(
        `Dropping observation for ${location.name} at ${observation.aifstime_utc} because it has no ${metricProperties[metric].property}`
      );
      return [];
    } else {
      return [observation];
    }
  });
};
