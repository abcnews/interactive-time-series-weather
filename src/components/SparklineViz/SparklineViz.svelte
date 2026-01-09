<script lang="ts">
  import Chart from './charts/Chart.svelte';
  import { intersectionObserver } from './useIntersectionObserver.js';
  import { emitResize } from '../util';
  import { untrack } from 'svelte';

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
      /** Optional override for gradient scale function */
      gradientScale?: (value: number) => string;
      /** Optional override for value formatting function */
      formatValue?: (value: number) => string;
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
     * Scale function for mapping values to colors.
     */
    gradientScale?: (value: number) => string;

    /**
     * Free text attribution to display below the charts.
     */
    attribution?: string;
  }

  let {
    placeholders,
    loadData,
    formatValue: formatValueProp,
    yDomain: yDomainProp,
    gradientScale: gradientScaleProp,
    attribution
  }: SparklineVizProps = $props();

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
    gradientScale?: (value: number) => string;
    formatValue?: (value: number) => string;
  }>({});

  // Calculate final values using $derived
  let formatValue = $derived(overrides.formatValue ?? formatValueProp);
  let gradientScale = $derived(overrides.gradientScale ?? gradientScaleProp);

  // Calculate yDomain with default fallback
  let yDomain = $derived.by<[number, number]>(() => {
    // Use override if provided
    if (overrides.yDomain) return overrides.yDomain;

    // Use prop if provided
    if (yDomainProp) return yDomainProp;

    // Calculate default domain from chart data
    if (charts.length > 0) {
      const allYValues = charts.flatMap(chart => chart.chartData.map(point => point.y));
      const minY = Math.min(...allYValues);
      const maxY = Math.max(...allYValues);

      // Add some padding to the domain
      const padding = (maxY - minY) * 0.1; // 10% padding
      const calculatedYDomain = [minY - padding, maxY + padding] as [number, number];
      return calculatedYDomain;
    }

    // Fallback default
    return [0, 100];
  });

  // Create a derived version of charts that returns placeholders when data is loading
  let displayCharts = $derived(
    charts.length > 0
      ? charts
      : placeholders.map(name => ({
          name,
          chartData: []
        }))
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

        // Store overrides from the result
        overrides = {
          yDomain: result.yDomain,
          gradientScale: result.gradientScale,
          formatValue: result.formatValue
        };
      });
    }
  });
</script>

<div
  class="app"
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
          {gradientScale}
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
  }
  .charts {
    display: flex;
    flex-direction: column;
    gap: 50px;
    margin-bottom: 20px;
  }

  .attribution {
    font-family: ABCSans;
    color: #333;
    background: #fff;
    border-radius: 1000px;
    padding: 2px 0.75rem;
    display: inline-block;
  }
</style>
