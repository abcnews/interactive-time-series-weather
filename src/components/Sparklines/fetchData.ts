import type { LocationsFeatureCollection, TimeSeriesData } from '../../types';
import { metricProperties } from '../../lib/chartTypes';
import { blockingFetch, LOCATIONS_URL } from '../../lib/util';
let i = 0;
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
        .then(async res => {
          const id = i++;
          console.time('parse' + i);
          const ret = await res.json();
          console.timeEnd('parse' + i);
          return ret;
        })
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
  locations,
  range = { startDate: '2026-01-01', endDate: '2026-01-07' },
  metric = ''
}): Promise<Array<{ name: string; chartData: Array<{ x: number; y: number }> }>> {
  const props = metricProperties[metric];
  const { dataUrl = '', parseValue = (num: number) => num } = props;
  if (!dataUrl) {
    throw new Error(`baseUrl missing for metric "${metric}"`);
  }
  const [geojson, datasets] = await Promise.all([
    blockingFetch(LOCATIONS_URL).then(res => res.json() as Promise<LocationsFeatureCollection>),
    fetchChunkedData(dataUrl, range)
  ]);

  const data = locations
    // Resolve each location string (supports "Name|Display Override" syntax) to
    // its matching GeoJSON feature so we can look up the Aurora station ID later.
    .map(location => {
      const [name, override] = location.split('|');
      const feature = geojson.features.find(f => f.properties.name === name);
      return { feature, name: override || name };
    })

    // Drop any locations that didn't match a feature in the GeoJSON.
    .filter(({ feature }) => !!feature)

    // Transform multiple daily datasets into a single flat {x, y}[] array
    // suitable for charting, where x is a Unix timestamp (ms) and y is the
    // parsed observation value.
    .map(({ feature, name }) => {
      const auroraId = feature!.properties.auroraId;

      const chartData: { x: number; y: number }[] = [];
      let runningTotal = 0;
      datasets.forEach(dataset => {
        // Skip days where the fetch failed (null returned by fetchChunkedData).
        if (!dataset) return;

        const values = dataset.series[auroraId];
        const startDate = new Date(dataset.startDate);

        // Each value is [offsetMinutes, reading] — convert the offset to an
        // absolute timestamp and apply any caller-supplied value transform.
        values?.forEach(([offsetMinutes, value]) => {
          const thisDate = new Date(Number(startDate) + offsetMinutes * 60 * 1000);
          const parsedValue = typeof value === 'number' ? parseValue(value) : value;

          if (metric === 'rainCumulative' && typeof parsedValue === 'number') {
            runningTotal += parsedValue;
            chartData.push({
              x: thisDate.getTime(),
              y: runningTotal
            });
          } else {
            chartData.push({
              x: thisDate.getTime(),
              y: parsedValue
            });
          }
        });
      });

      return { name, chartData };
    });

  return data;
}
