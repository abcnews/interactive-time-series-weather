import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
import { blockingFetch } from '../util';

export type ChartData = {
  name: string;
  chartData: Array<{ x: number; y: number }>;
};

export async function fetchData(locationsUrl, dataUrl, locations): Promise<ChartData[]> {
  const [geojson, data] = await Promise.all([
    blockingFetch(locationsUrl).then(res => res.json() as Promise<LocationsFeatureCollection>),
    blockingFetch(dataUrl).then(res => res.json() as Promise<TimeSeriesData>)
  ]);

  return locations
    .map(location => geojson.features.find(feature => feature.properties.name === location))
    .filter(feature => feature && locations.includes(feature.properties.name))
    .map(feature => {
      const auroraId = feature.properties.auroraId;
      const timeSeries = (data.series[auroraId] ||= []);

      const chartData = timeSeries.reduce((acc: Array<{ x: number; y: number }>, val, index) => {
        const timestamp = new Date(data.timestamps[index]);

        // Filter out data older than 5 days
        if (Number(timestamp) < Date.now() - 1000 * 60 * 60 * 24 * 5) {
          return acc;
        }

        const hasVal = val !== null;
        // Ignore null values. This will truncate the start/end of the charts
        // when values are missing.
        // BUG: When data is missing in the middle of a chart (rare) this will
        // draw a line between the two good points, which may not be desirable.
        if (hasVal) {
          acc.push({
            x: timestamp.getTime(),
            y: val
          });
        }

        return acc;
      }, []);

      return {
        name: feature.properties.name,
        chartData
      };
    });
}
