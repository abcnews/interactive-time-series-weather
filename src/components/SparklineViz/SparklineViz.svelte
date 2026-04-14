<script lang="ts">
  import Chart from './charts/Chart.svelte';
  import { intersectionObserver } from './useIntersectionObserver.js';
  import { emitResize } from '../util';
  import { calculateDomain } from './charts/lib/utils';
  import { untrack } from 'svelte';
  import { extentStores, rawData } from './charts/lib/stores';
  import type { MetricType } from './charts/lib/data';

  /**
   * Props for the SparklineViz component.
   */
  interface SparklineVizProps {
    /**
     * Array of placeholder names to display charts for.
     */
    placeholders: string[];

    /**
     * Function to load chart data asynchronously.
     * @returns A promise that resolves to an object containing charts array and optional overrides.
     */
    loadData: () => Promise<{
      charts: Array<{
        /** The name of the chart (e.g., location name) */
        name: string;
        /** Array of data points for the chart */
        chartData: Array<{ x: number; y: number }>;
      }>;
      /** Optional override for y-axis domain */
      yDomain?: [number, number];
      /** Optional override for x-axis domain */
      xDomain?: [number, number];
      /** Optional override for value formatting function */
      formatValue?: (value: number) => string;
      /** Optional override for solid colour */
      colour?: string;
      /** Optional override for dark mode solid colour */
      darkColour?: string;
    }>;

    /**
     * Function to format y-axis values for display.
     */
    formatValue: (value: number) => string;

    /**
     * The domain (min/max) for the y-axis.
     */
    yDomain?: [number, number];

    /**
     * The domain (min/max) for the x-axis.
     */
    xDomain?: [number, number];

    /**
     * Scale function for mapping values to colors.
     */

    /**
     * Solid colour for the chart.
     */
    colour?: string;

    /**
     * Solid colour for the chart in dark mode.
     */
    darkColour?: string;

    /**
     * Free text attribution to display below the charts.
     */
    attribution?: string;
    /**
     * Optional metric type for scale synchronization.
     */
    metric?: MetricType;
  }

  let {
    placeholders,
    loadData,
    formatValue: formatValueProp,
    yDomain: yDomainProp,
    xDomain: xDomainProp,
    colour: colourProp,
    darkColour: darkColourProp,
    attribution,
    metric
  }: SparklineVizProps = $props();

  // Synchronize extents across instances via BroadcastChannel if a metric is provided
  let sharedExtents = $state<{ y: [number, number]; x: [number, number] } | undefined>();

  $effect(() => {
    if (metric && extentStores[metric]) {
      const unsubscribe = extentStores[metric].subscribe(value => {
        sharedExtents = value;
      });
      return unsubscribe;
    }
  });

  $effect(() => {
    if (metric && extentStores[metric] && charts.length > 0) {
      const allYValues = charts.flatMap(chart => chart.chartData.map(point => point.y));
      const allXValues = charts.flatMap(chart => chart.chartData.map(point => point.x));

      const localYDomain = calculateDomain(allYValues);
      const localXDomain = calculateDomain(allXValues, 0);

      extentStores[metric].update(current => {
        const nextY: [number, number] = [
          Math.min(current?.y[0] ?? Infinity, localYDomain[0]),
          Math.max(current?.y[1] ?? -Infinity, localYDomain[1])
        ];
        const nextX: [number, number] = [
          Math.min(current?.x[0] ?? Infinity, localXDomain[0]),
          Math.max(current?.x[1] ?? -Infinity, localXDomain[1])
        ];

        // Only update if changed
        if (
          current?.y[0] === nextY[0] &&
          current?.y[1] === nextY[1] &&
          current?.x[0] === nextX[0] &&
          current?.x[1] === nextX[1]
        ) {
          return current;
        }

        return { y: nextY, x: nextX };
      });
    }
  });

  let charts = $state<
    Array<{
      name: string;
      chartData: Array<{ x: number; y: number }>;
    }>
  >([]);
  let clientHeight = $state(0);
  let status = $state('offscreen');

  // Store overrides from loadData
  let overrides = $state<{
    yDomain?: [number, number];
    xDomain?: [number, number];
    formatValue?: (value: number) => string;
    colour?: string;
    darkColour?: string;
  }>({});

  let formatValue = $derived(overrides.formatValue ?? formatValueProp);
  let colour = $derived(overrides.colour ?? colourProp);
  let darkColour = $derived(overrides.darkColour ?? darkColourProp);

  let xDomain = $derived.by<[number, number]>(() => {
    // Determine the baseline domain
    let baseline: [number, number] = [0, 100];
    if (overrides.xDomain) {
      baseline = overrides.xDomain;
    } else if (xDomainProp) {
      baseline = xDomainProp;
    } else if (charts.length > 0) {
      const allXValues = charts.flatMap(chart => chart.chartData.map(point => point.x));
      baseline = calculateDomain(allXValues, 0);
    }

    // Merge with shared extents if available
    if (sharedExtents?.x) {
      return [Math.min(baseline[0], sharedExtents.x[0]), Math.max(baseline[1], sharedExtents.x[1])];
    }

    return baseline;
  });

  let yDomain = $derived.by<[number, number]>(() => {
    // Determine the baseline domain
    let baseline: [number, number] = [0, 100];
    if (overrides.yDomain) {
      baseline = overrides.yDomain;
    } else if (yDomainProp) {
      baseline = yDomainProp;
    } else if (charts.length > 0) {
      const allYValues = charts.flatMap(chart => chart.chartData.map(point => point.y));
      baseline = calculateDomain(allYValues);
    }

    // Merge with shared extents if available
    if (sharedExtents?.y) {
      return [Math.min(baseline[0], sharedExtents.y[0]), Math.max(baseline[1], sharedExtents.y[1])];
    }

    return baseline;
  });

  // Create a derived version of charts that returns placeholders when data is loading
  let displayCharts = $derived(
    charts.length > 0
      ? charts
      : placeholders.map(placeholder => {
          const [name, override] = placeholder.split('|');
          return {
            name: override || name,
            chartData: []
          };
        })
  );

  $effect(() => {
    if (clientHeight) {
      emitResize(clientHeight);
    }
  });

  $effect(() => {
    if (status === 'inview') {
      untrack(async () => {
        const result = await loadData();
        charts = result.charts;
        $rawData = charts;

        // Store overrides from the result
        overrides = {
          yDomain: result.yDomain,
          xDomain: result.xDomain,
          formatValue: result.formatValue,
          colour: result.colour,
          darkColour: result.darkColour
        };
      });
    }
  });
</script>

<div
  class="app"
  style:--weather-viz-colour={colour}
  style:--weather-viz-dark-colour={darkColour}
  bind:clientHeight
  use:intersectionObserver={{
    threshold: 0.1,
    onEnter: () => {
      status = 'inview';
    }
  }}
>
  <div class="charts">
    {#each displayCharts as chart, i}
      <div style:--delay="{i * 0.5}ms">
        <Chart
          name={chart.name}
          altText={`A chart shows temperatures at ${chart.name}`}
          data={chart.chartData}
          {formatValue}
          {yDomain}
          {xDomain}
          colour="var(--weather-viz-metric-colour)"
        />
      </div>
    {/each}
  </div>
  {#if attribution}
    <div>
      <p class="attribution">{attribution}</p>
    </div>
  {/if}
</div>

<style lang="scss">
  :global {
    * {
      margin: 0;
      padding: 0;
    }
    body {
      background: transparent;
    }
  }
  .app {
    overflow: hidden;
    --weather-viz-metric-colour: var(--weather-viz-colour);
  }
  :global([data-scheme='dark']) .app {
    --weather-viz-metric-colour: var(--weather-viz-dark-colour);
  }
  :global([data-scheme='light']) .app {
    --weather-viz-metric-colour: var(--weather-viz-colour);
  }
  .charts {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 20px;
  }

  .attribution {
    font-family: ABCSans;
    border-radius: 1000px;
    padding: 2px 0;
    display: inline-block;
  }
</style>
