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
    name?: string;
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
    name
  }: SparklineVizProps = $props();

  // Internal utility for synchronizing domains across instances
  let sharedExtents = $state<{ y: [number, number]; x: [number, number] } | undefined>();

  // Subscribe to shared extents from the broadcast channel
  $effect(() => {
    if (name && extentStores[name]) {
      const unsubscribe = extentStores[name].subscribe(value => {
        sharedExtents = value;
      });
      return unsubscribe;
    }
  });

  // Update shared extents based on local data
  $effect(() => {
    if (name && extentStores[name] && charts.length > 0) {
      const allYValues = charts.flatMap(chart => chart.chartData.map(point => point.y));
      const allXValues = charts.flatMap(chart => chart.chartData.map(point => point.x));

      const localYDomain = calculateDomain(allYValues);
      const localXDomain = calculateDomain(allXValues, 0);

      extentStores[name].update(current => {
        const nextY: [number, number] = [
          Math.min(current?.y[0] ?? Infinity, localYDomain[0]),
          Math.max(current?.y[1] ?? -Infinity, localYDomain[1])
        ];
        const nextX: [number, number] = [
          Math.min(current?.x[0] ?? Infinity, localXDomain[0]),
          Math.max(current?.x[1] ?? -Infinity, localXDomain[1])
        ];

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

  /**
   * Internal helper to calculate the domain for either X or Y axis.
   */
  function calculateBaseDomain(key: 'x' | 'y', padding: number) {
    const propDomain = key === 'x' ? xDomainProp : yDomainProp;
    const overrideDomain = key === 'x' ? overrides.xDomain : overrides.yDomain;

    // Determine the baseline domain
    let baseline: [number, number] = [0, 100];

    if (overrideDomain) {
      baseline = overrideDomain;
    } else if (propDomain) {
      baseline = propDomain;
    } else if (charts.length > 0) {
      const values = charts.flatMap(chart => chart.chartData.map(point => point[key]));
      baseline = calculateDomain(values, padding);
    }

    // Merge with shared broadcasted extents if available
    if (sharedExtents?.[key]) {
      return [Math.min(baseline[0], sharedExtents[key][0]), Math.max(baseline[1], sharedExtents[key][1])] as [
        number,
        number
      ];
    }

    return baseline;
  }

  let xDomain = $derived(calculateBaseDomain('x', 0));
  let yDomain = $derived(calculateBaseDomain('y', 0.1));

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
      <div style:--index={i}>
        <Chart
          name={chart.name}
          description={name}
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

    /* Unidied Theme Variables - Light Mode (Default) */
    --theme-text: #000;
    --theme-label: #6e7787;
    --theme-axis: #ccc;
    --theme-grid: var(--theme-axis);
    --theme-shadow: rgba(255, 255, 255, 0.75);
    --theme-tooltip-bg: white;
    --weather-viz-metric-colour: var(--weather-viz-colour);

    /* Scoped Dark Mode Overrides */
    &:global([data-scheme='dark']),
    :global([data-scheme='dark']) & {
      --theme-text: #eee;
      --theme-label: #a0aec0;
      --theme-axis: #4a5568;
      --theme-grid: var(--theme-axis);
      --theme-shadow: rgba(0, 0, 0, 0.75);
      --theme-tooltip-bg: #1a202c;
      --weather-viz-metric-colour: var(--weather-viz-dark-colour);
    }

    /* Force Light Mode (if nested) */
    &:global([data-scheme='light']),
    :global([data-scheme='light']) & {
      --theme-text: #000;
      --theme-label: #6e7787;
      --theme-axis: #ccc;
      --theme-grid: var(--theme-axis);
      --theme-shadow: rgba(255, 255, 255, 0.75);
      --theme-tooltip-bg: white;
      --weather-viz-metric-colour: var(--weather-viz-colour);
    }
  }
  .charts {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 20px;
  }

  .attribution {
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 135%; /* 16.2px */
  }
</style>
