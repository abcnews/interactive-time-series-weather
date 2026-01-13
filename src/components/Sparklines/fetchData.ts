import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
import { blockingFetch, LOCATIONS_URL } from '../util';

export type ChartData = {
  name: string;
  chartData: Array<{ x: number; y: number }>;
};

function getAestDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Brisbane', // UTC+10, no DST
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(); // en-CA yields yyyy-mm-dd
}

async function fetchChunkedData(dataBaseUrl = '', { startDate, endDate }, locations) {
  const distanceDays = (Number(new Date(endDate)) - Number(new Date(startDate))) / 1000 / 60 / 60 / 24;
  if (distanceDays > 14 || distanceDays < 0) {
    throw new Error('Dates out of range');
  }
  const filenames = Array.from({ length: distanceDays + 1 })
    .map((_, i) => new Date(Number(new Date(startDate)) + i * 24 * 60 * 60 * 1000))
    .map(date => `${date.toISOString().slice(0, 10)}`);

  const urls = filenames.map(filename => `${dataBaseUrl}/${filename}.json`);
  console.log(urls);

  const datasets = await Promise.all(
    urls.map(url =>
      blockingFetch(url)
        .then(res => res.json() as Promise<TimeSeriesData>)
        .catch(e => {
          return { timestamps: [], series: {} };
        })
    )
  );

  return datasets;
}

export async function fetchData({
  dataBaseUrl,
  locations,
  range = { startDate: '2026-01-01', endDate: '2026-01-07' }
}): Promise<ChartData[]> {
  if (!dataBaseUrl) {
    throw new Error('baseUrl missing');
  }
  const [geojson, datasets] = await Promise.all([
    blockingFetch(LOCATIONS_URL).then(res => res.json() as Promise<LocationsFeatureCollection>),
    fetchChunkedData(dataBaseUrl, range, locations)
  ]);

  const timestamps = datasets.flatMap(dataset => dataset.timestamps).map(time => new Date(time));

  return locations
    .map(location => geojson.features.find(feature => feature.properties.name === location))
    .filter(feature => feature && locations.includes(feature.properties.name))
    .map(feature => {
      const auroraId = feature.properties.auroraId;

      // Combine the values for this location from potentially multiple day datasets
      const combinedValues = datasets.flatMap(dataset => dataset.series[auroraId] || []);

      console.log({ timestamps, combinedValues });

      const chartData = combinedValues.reduce((acc: Array<{ x: number; y: number }>, val, index) => {
        const timestamp = timestamps[index];

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
