import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
import { blockingFetch, LOCATIONS_URL } from '../util';

export type ChartData = {
  name: string;
  chartData: Array<{ x: number; y: number }>;
};

/**
 * Data is chunked by day, so when we fetch a date range we must fetch the file
 * for each day individually. For perf reasons let's not select more than 2 wks.
 * @param dataBaseUrl - the base url for the files. Files are YYYY-MM-DD.json
 * @returns
 */
async function fetchChunkedData(dataBaseUrl: string, { startDate = '', endDate = '' }) {
  const distanceDays = (Number(new Date(endDate)) - Number(new Date(startDate))) / 1000 / 60 / 60 / 24;
  const filenames = Array.from({ length: distanceDays + 1 })
    .map((_, i) => new Date(Number(new Date(startDate)) + i * 24 * 60 * 60 * 1000))
    .map(date => `${date.toISOString().slice(0, 10)}`);

  const urls = filenames.map(filename => `${dataBaseUrl}/${filename}.json`);

  const datasets = await Promise.all(
    urls.map(url =>
      blockingFetch(url)
        .then(res => res.json() as Promise<TimeSeriesData>)
        .catch(e => {
          return null;
        })
    )
  );

  return datasets;
}

/**
 * Fetch data for the given baseUrl and date range.
 */
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
    fetchChunkedData(dataBaseUrl, range)
  ]);

  return (
    locations
      .map(location => {
        const [name, override] = location.split('|');
        const feature = geojson.features.find(f => f.properties.name === name);
        return { feature, name: override || name };
      })
      .filter(({ feature }) => !!feature)

      // transform multiple days into one {x,y}[] chart format
      .map(({ feature, name }) => {
        const auroraId = feature!.properties.auroraId;

        const chartData: { x: number; y: number }[] = [];
        datasets.forEach(dataset => {
          if (!dataset) {
            return;
          }
          const values = dataset.series[auroraId];
          const startDate = new Date(dataset.startDate);
          values?.forEach(([offsetMinutes, value]) => {
            const thisDate = new Date(Number(startDate) + offsetMinutes * 60 * 1000);
            chartData.push({
              x: thisDate.getTime(),
              y: value
            });
          });
        });

        return {
          name,
          chartData
        };
      })
  );
}
