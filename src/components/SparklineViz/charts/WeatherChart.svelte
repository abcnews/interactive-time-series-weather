<script lang="ts">
  /**
   * @file Renders a simple chart for numeric time series data.
   *
   * A dumb component that accepts labels, data, and formatting options.
   * Uses LayerCake to create a chart with line, area, circles, and tooltips.
   */

  import { Html, LayerCake, Svg } from 'layercake';
  import { gradientScale, activeObservation } from './lib/stores';
  import Line from './Line.svelte';
  import Area from './Area.svelte';
  import Circle from './Circle.svelte';
  import ValueLabel from './ValueLabel.svelte';
  import Observations from './Observations.svelte';
  import { padding } from './lib/constants';

  interface DataPoint {
    x: number;
    y: number;
  }

  interface Props {
    /** The chart title displayed above the visualization */
    name: string;
    /** Accessible description of the chart for screen readers */
    altText: string;
    /** Time series data points to visualize */
    data: DataPoint[];
    /** Formats y values for display in labels and tooltips. Defaults to plain number display */
    formatValue?: (value: number) => string;
    /** Formats time for tooltip display. Defaults to locale-based day/month and time */
    formatTime?: (point: DataPoint) => string;
    /** Sets explicit y-axis bounds. When omitted, bounds are calculated from data min/max */
    yDomain?: [number, number];
  }

  let {
    name,
    altText,
    data,
    formatValue = (v: number) => `${v}`,
    formatTime = (d: DataPoint) => {
      const date = new Date(d.x);
      return date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit'
      });
    },
    yDomain
  }: Props = $props();

  // Generate a slug for unique gradient IDs
  let slug = $derived(name.toLowerCase().replace(/\s+/g, '-'));

  // Extract y values for gradient calculations
  let values = $derived(data.map(d => d.y));
  // Use provided yDomain if available, otherwise calculate from local data
  let minValue = $derived(yDomain ? yDomain[0] : Math.min(...values));
  let maxValue = $derived(yDomain ? yDomain[1] : Math.max(...values));
  let midValue = $derived(minValue + (maxValue - minValue) / 2);

  // Calculate primary and secondary data points
  let primaryPoint = $derived(data.length > 0 ? data.reduce((max, d) => (d.y > max.y ? d : max), data[0]) : null);
  let secondaryPoint = $derived(data.length > 0 ? data[data.length - 1] : null);
  let hideSecondaryLabel = $derived(
    primaryPoint && secondaryPoint && Math.abs(data.indexOf(primaryPoint) - data.indexOf(secondaryPoint)) < 6
  );

  // Format functions
  function formatAriaLabel(d: DataPoint): string {
    const value = formatValue(d.y);
    const time = formatTime(d);
    return time ? `${value} ${time}` : value;
  }
</script>

<div class="weather-chart">
  <h2>{name}</h2>
  <div role="figure" class="chart" aria-label={altText}>
    <LayerCake
      {data}
      {padding}
      x={d => d.x}
      y={d => d.y}
      {yDomain}
      custom={{ gradientScale: $gradientScale, formatValue }}
    >
      <Svg>
        <Area fill={`url('#gradient-shade-${slug}')`} />
        <Line stroke={`url('#gradient-${slug}')`} />
        <defs>
          <linearGradient id="gradient-{slug}" gradientTransform="rotate(90)">
            <stop offset="0%" stop-color={$gradientScale(maxValue)} />
            <stop offset="50%" stop-color={$gradientScale(midValue)} />
            <stop offset="100%" stop-color={$gradientScale(minValue)} />
          </linearGradient>
          <linearGradient id="gradient-shade-{slug}" gradientTransform="rotate(90)">
            <stop offset="0%" stop-color={$gradientScale(maxValue)} />
            <stop offset="50%" stop-color={$gradientScale(maxValue / 2)} />
            <stop offset="100%" stop-color={$gradientScale(0)} />
          </linearGradient>
        </defs>
        {#if $activeObservation !== null && data.includes($activeObservation as any)}
          <Circle data={$activeObservation} />
        {:else if primaryPoint}
          <Circle data={primaryPoint} />
          {#if secondaryPoint && !hideSecondaryLabel && secondaryPoint !== primaryPoint}
            <Circle data={secondaryPoint} />
          {/if}
        {/if}
      </Svg>
      <Html>
        {#if $activeObservation !== null && data.includes($activeObservation as any)}
          <div role="tooltip" id="tooltip">
            <ValueLabel
              data={$activeObservation}
              value={formatValue(($activeObservation as any).y)}
              timeDisplay={formatTime($activeObservation as any)}
              showTime={true}
            />
          </div>
        {:else if primaryPoint}
          <ValueLabel data={primaryPoint} value={formatValue(primaryPoint.y)} highlight={true} />
          {#if secondaryPoint && !hideSecondaryLabel && secondaryPoint !== primaryPoint}
            <ValueLabel data={secondaryPoint} value={formatValue(secondaryPoint.y)} alignment="below" />
          {/if}
        {/if}
        <Observations
          {data}
          {formatAriaLabel}
          onenter={d => ($activeObservation = d)}
          onleave={() => ($activeObservation = null)}
        />
      </Html>
    </LayerCake>
  </div>
</div>

<style>
  .weather-chart {
    font-family: ABCSans;
    position: relative;
    z-index: 2;
  }
  h2 {
    display: inline-block;
    margin: 0;
    padding: 2px 0.75rem;
    font-size: 1.125rem;
    font-weight: bold;
    color: #333;
    background: #fff;
    border-radius: 1000px;
  }
  @media (min-width: 48em) {
    h2 {
      font-size: 1.25rem;
    }
  }
  .chart {
    width: 100%;
    height: 100px;
  }
</style>
