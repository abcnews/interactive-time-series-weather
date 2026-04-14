import type { MetricType } from './data';

export const padding = { top: 25, left: 2, right: 25, bottom: 5 };
export const HOUR = 1000 * 60 * 60;
export const WED_8AM = 1741125600000;
export const TUE_5PM = 1741676400000;

export const metricProperties: Record<MetricType, { colour: string; darkColour: string }> = {
  gust: {
    colour: '#00297E',
    darkColour: '#AFD6FD'
  },
  humidity: {
    colour: '#664CB3',
    darkColour: '#AB96EB'
  },
  rain: {
    colour: '#007BC7',
    darkColour: '#0092ED'
  },
  swell: {
    colour: '#007BC7',
    darkColour: '#0092ED'
  },
  tempc: {
    colour: '#A61268',
    darkColour: '#BA4A9F'
  }
};
