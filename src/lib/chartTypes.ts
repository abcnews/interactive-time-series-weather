import { BASE_URL } from './util';
import type { MetricType, MetricProps } from '../types';

const METRAWEATHER_ATTR = "Times shown in user's local time. Source: MetraWeather.";

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
