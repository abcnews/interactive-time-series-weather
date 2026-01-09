import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';

export type ChartData = {
  name: string;
  chartData: Array<{ x: number; y: number }>;
};

export async function fetchData(locationsUrl, dataUrl, locations): Promise<ChartData[]> {
  const [geojson, data] = await Promise.all([
    fetch(locationsUrl).then(res => res.json() as Promise<LocationsFeatureCollection>),
    fetch(dataUrl).then(res => res.json() as Promise<TimeSeriesData>)
  ]);

  return locations
    .map(location => geojson.features.find(feature => feature.properties.name === location))
    .filter(feature => feature && locations.includes(feature.properties.name))
    .map(feature => {
      const auroraId = feature.properties.auroraId;
      const timeSeries = data.series[auroraId];

      // Transform data with null handling
      let previousNulls = 0;
      let previousValue;
      const chartData = timeSeries.reduce((acc: Array<{ x: number; y: number }>, val, index) => {
        previousValue = val ?? previousValue ?? 0;
        const timestamp = new Date(data.timestamps[index]);

        // Filter out data older than 5 days
        if (Number(timestamp) < Date.now() - 1000 * 60 * 60 * 24 * 5) {
          return acc;
        }

        const hasVal = val !== null;
        previousNulls = hasVal ? 0 : previousNulls + 1;

        acc.push({
          x: timestamp.getTime(),
          y: hasVal ? val : previousNulls < 10 ? previousValue : 0
        });

        return acc;
      }, []);

      return {
        name: feature.properties.name,
        chartData
      };
    });
}
