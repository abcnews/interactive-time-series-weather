<script lang="ts">
  /**
   * @file Renders a simple chart for numeric time series data.
   *
   * A dumb component that accepts labels, data, and formatting options.
   * Uses LayerCake to create a chart with line, area, circles, and tooltips.
   */

  import { Html, LayerCake, Svg } from 'layercake';
  import { scaleLinear } from 'd3-scale';
  import { activeObservation, observationHandlingLeave } from './lib/stores';
  import Line from './Line/Line.svelte';
  import Area from './Area/Area.svelte';
  import Circle from './Circle/Circle.svelte';
  import Gradient from './Gradient/Gradient.svelte';
  import ValueLabel from './ValueLabel/ValueLabel.svelte';
  import ActiveTooltip from './ActiveTooltip/ActiveTooltip.svelte';
  import InteractionLayer from './InteractionLayer/InteractionLayer.svelte';
  import ObservationsTable from './ObservationsTable/ObservationsTable.svelte';
  import AxisX from './AxisX/AxisX.svelte';
  import AxisY from './AxisY/AxisY.svelte';
  import { calculateDomain } from './lib/utils';

  interface DataPoint {
    x: number;
    y: number;
  }

  interface Props {
    /** The chart title displayed above the visualization (usually location) */
    name: string;
    /** The description (usually the measurement type and units)*/
    description: string;
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
    /** Sets explicit x-axis bounds. When omitted, bounds are calculated from data min/max */
    xDomain?: [number, number];
    /** Solid colour for the chart */
    colour?: string;
    /** The height of the chart in pixels. Defaults to 150. */
    height?: number;
  }

  let {
    name,
    description,
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
    yDomain,
    xDomain,
    colour,
    height = 150
  }: Props = $props();

  const padding = { top: 2.5, right: 2.5, bottom: 25 };

  // Generate a slug for unique gradient IDs
  let slug = $derived(name.toLowerCase().replace(/\s+/g, '-'));

  // Extract y values for gradient calculations
  let values = $derived(data.map(d => d.y));
  // Use provided yDomain if available, otherwise calculate from local data
  let minValue = $derived(Math.min(...values));
  let maxValue = $derived(Math.max(...values));

  // Calculate primary and secondary data points
  let primaryPoint = $derived(data.length > 0 ? data.reduce((max, d) => (d.y > max.y ? d : max), data[0]) : null);
  let secondaryPoint = $derived(data.length > 0 ? data[data.length - 1] : null);
  let hideSecondaryLabel = $derived(
    primaryPoint && secondaryPoint && Math.abs(data.indexOf(primaryPoint) - data.indexOf(secondaryPoint)) < 6
  );

  let isActiveObservation = $derived($activeObservation !== null && data.includes($activeObservation as any));
  let activeDataPoint = $derived(isActiveObservation ? ($activeObservation as any as DataPoint) : null);

  /**
   * Close the popup when we click outside of the chart.
   */
  function onclick(e) {
    // If an Observation component is handling this leave event, ignore it here
    if ($observationHandlingLeave) {
      $observationHandlingLeave = false;
      return;
    }
    $observationHandlingLeave = false;
    $activeObservation = null;
  }

  let lastUpdated = $derived.by(() => data[data.length - 1]);

  // Dynamic padding calculation based on label width estimation
  // Using 3 chars = 16px (~5.33px per char)
  // Plus 8px for label offset, no extra gutter to keep it tight.
  let leftPadding = $derived.by(() => {
    const domain = yDomain || calculateDomain(values, 0.1);
    // Axis ticks use the raw value or simple formatting - we assume up to 3-4 chars
    const labels = [Math.round(domain[0]).toString(), Math.round(domain[1]).toString()];
    const maxChars = Math.max(...labels.map(l => l.length), 3);
    return Math.round(maxChars * 5.33 + 8);
  });
  // Track when the chart is actually rendered and ready to be shown
  let isReady = $state(false);

  $effect(() => {
    if (data.length > 0 && !isReady) {
      // Wait for two frames to ensure the SVG children have processed their initial data
      // and the browser has performed its first layout.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isReady = true;
        });
      });
    }
  });
</script>

<!-- This is a bubbled click handler to remove labels for touch events that have suitable alt text in the Observations <ol> -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="chart" {onclick}>
  <h2 class="chart__name">{name}</h2>
  <p class="chart__description">{description}</p>
  <p class="chart__last-updated">
    &nbsp;
    {#if lastUpdated}Last updated {formatTime(lastUpdated)}{/if}
  </p>
  <div
    role="figure"
    class="chart__figure"
    class:is-ready={isReady}
    style:height="{height}px"
    aria-label={altText}
  >
    {#if data.length > 0}
      <LayerCake
        {data}
        padding={{ ...padding, left: leftPadding }}
        x={d => d.x}
        y={d => d.y}
        {yDomain}
        {xDomain}
        yScale={scaleLinear().clamp(true).nice()}
        custom={{ formatValue }}
      >
        <Svg>
          <AxisX class="x-axis" />
          <AxisY class="y-axis" />
          <Area fill={`url('#gradient-shade-${slug}')`} />
          <Line />
          <Gradient id="gradient-shade-{slug}" {colour} />
          <InteractionLayer
            {data}
            onenter={d => ($activeObservation = d)}
            onleave={() => ($activeObservation = null)}
          />

          {#if !isActiveObservation && primaryPoint}
            <ValueLabel
              class="label-maximum"
              data={primaryPoint}
              value={formatValue(primaryPoint.y)}
              highlight={true}
            />
            {#if secondaryPoint && !hideSecondaryLabel && secondaryPoint !== primaryPoint}
              <ValueLabel
                class="label-most-recent"
                data={secondaryPoint}
                value={formatValue(secondaryPoint.y)}
                alignment="below"
              />
            {/if}
          {/if}

          {#if isActiveObservation}
            <Circle class="active-marker" data={$activeObservation} />
          {:else if primaryPoint}
            <Circle class="circle-maximum" data={primaryPoint} />
            {#if secondaryPoint && !hideSecondaryLabel && secondaryPoint !== primaryPoint}
              <Circle class="circle-most-recent" data={secondaryPoint} />
            {/if}
          {/if}
        </Svg>
        <Html pointerEvents={false}>
          {#if isActiveObservation && activeDataPoint}
            <div role="tooltip" id="tooltip">
              <ActiveTooltip
                class="active-tooltip"
                data={activeDataPoint}
                value={formatValue(activeDataPoint.y)}
                timeDisplay={formatTime(activeDataPoint)}
              />
            </div>
          {/if}
          <ObservationsTable {data} />
        </Html>
      </LayerCake>
    {/if}
  </div>
</div>

<style>
  .chart {
    font-family: ABCSans;
    position: relative;
    z-index: 2;
  }
  .chart__figure {
    width: 100%;
    min-height: 100px;
    overflow: hidden;
    :global(.layercake-container) {
      opacity: 0;
    }
    &.is-ready :global(.layercake-container) {
      animation: fadeIn 0.25s;
      animation-delay: calc(20ms * var(--index, 0));
      animation-duration: calc(400ms + 400ms * var(--index, 0));
      animation-fill-mode: forwards;
    }
  }
  .chart__name {
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 135%; /* 18.9px */
    margin-bottom: 1px;
  }
  .chart__description {
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 135%; /* 16.2px */
  }
  .chart__last-updated {
    color: #6e7787;
    text-align: right;
    font-size: 11px;
    font-style: normal;
    font-weight: 400;
    line-height: 135%; /* 14.85px */
    margin-bottom: 8px;
  }
  @media (min-width: 48em) {
    h2 {
      font-size: 1.25rem;
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
