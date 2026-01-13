import type { MetricType } from './data';

export const padding = { top: 25, left: 2, right: 25, bottom: 5 };
export const HOUR = 1000 * 60 * 60;
export const WED_8AM = 1741125600000;
export const TUE_5PM = 1741676400000;

export const metricProperties: Record<MetricType, { gradientColours: string[] }> = {
  gust: {
    gradientColours: ['#24A800', '#DB7C00', '#F53500']
  },
  humidity: {
    gradientColours: ['#DB7C00', '#DB7C00', '#B400F5', '#B400F5']
  },

  rain: {
    gradientColours: ['#00A87B', '#0090F3', '#B400F5']
  },

  swell: {
    gradientColours: ['#00A87B', '#0090F3', '#B400F5']
  },
  bomtemp: {
    gradientColours: ['#0A1B59', '#1D76B5', '#98DDA7', '#FFE48D', '#FC8C3B', '#E21B1D', '#4C0119']
  }
};
