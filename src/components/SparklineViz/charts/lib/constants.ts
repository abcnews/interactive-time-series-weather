import type { MetricType } from './data';

export const padding = { top: 25, left: 2, right: 25, bottom: 5 };
export const HOUR = 1000 * 60 * 60;
export const WED_8AM = 1741125600000;
export const TUE_5PM = 1741676400000;

export const metricProperties: Record<
  MetricType,
  { property: string; units: string; gradientColours: [string, string, string]; description: string }
> = {
  gust: {
    property: 'gust_kmh',
    units: 'kph',
    gradientColours: ['#24A800', '#DB7C00', '#F53500'],
    description: 'wind speeds'
  },

  rain: {
    property: 'rain_trace_accumulation',
    units: 'mm',
    gradientColours: ['#00A87B', '#0090F3', '#B400F5'],
    description: 'rainfall totals'
  },

  swell: {
    property: 'swell_height',
    units: 'm',
    gradientColours: ['#00A87B', '#0090F3', '#B400F5'],
    description: 'swell height'
  }
};
