import * as d3 from "d3";
import type { Run } from "./types.ts";
import type { ChartColors } from "./context/ThemeContext.tsx";

/** A single line of tooltip content */
export interface TooltipLine {
  text: string;
  bold?: boolean;
}

export type TooltipContent = TooltipLine[];

export function createTooltip(colors: ChartColors) {
  return d3
    .select("body")
    .append("div")
    .attr("class", "chart-tooltip")
    .style("position", "absolute")
    .style("background", colors.background)
    .style("border", `1px solid ${colors.border}`)
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("font-size", "12px")
    .style("color", colors.text)
    .style("pointer-events", "none")
    .style("opacity", 0);
}

export function sortRunsByDate(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  );
}

export function createTimeXScale(
  runs: Run[],
  innerWidth: number,
): d3.ScaleTime<number, number> {
  const extent = d3.extent(runs, (d: Run) => new Date(d.eventDate)) as [
    Date,
    Date,
  ];
  return d3.scaleTime().domain(extent).range([0, innerWidth]);
}

export interface XAxisOptions {
  /** Custom tick formatter */
  tickFormat?: (d: Date | d3.NumberValue) => string;
  /** Padding between tick and label (default: 8) */
  tickPadding?: number;
  /** Target pixel spacing per tick (default: 80) */
  tickSpacing?: number;
}

export function renderXAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.AxisScale<Date | d3.NumberValue>,
  innerHeight: number,
  innerWidth: number,
  colors: ChartColors,
  options: XAxisOptions = {},
): void {
  const { tickFormat, tickPadding = 8, tickSpacing = 80 } = options;
  const tickCount = Math.max(
    2,
    Math.min(10, Math.floor(innerWidth / tickSpacing)),
  );

  const axis = d3.axisBottom(scale).ticks(tickCount).tickPadding(tickPadding);
  if (tickFormat) {
    axis.tickFormat(tickFormat as (d: d3.NumberValue) => string);
  }

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(axis)
    .attr("color", colors.axis);
}

export function renderYAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.AxisScale<d3.NumberValue>,
  colors: ChartColors,
  tickFormat?: (d: d3.NumberValue) => string,
): void {
  const axis = tickFormat
    ? d3.axisLeft(scale).tickFormat(tickFormat)
    : d3.axisLeft(scale);
  g.append("g").call(axis).attr("color", colors.axis);
}

export interface PointerPosition {
  pageX: number;
  pageY: number;
}

export function showTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
  position: PointerPosition,
  content: TooltipContent,
): void {
  tooltip.selectAll("*").remove();

  content.forEach((line, i) => {
    if (i > 0) tooltip.append("br");
    if (line.bold) {
      tooltip.append("strong").text(line.text);
    } else {
      tooltip.append("span").text(line.text);
    }
  });

  tooltip
    .style("opacity", 1)
    .style("left", `${position.pageX + 10}px`)
    .style("top", `${position.pageY - 10}px`);
}

export function hideTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
): void {
  tooltip.style("opacity", 0);
}

/**
 * Creates a jitter offset function for runs on the same date.
 * Used to prevent overlapping points in scatter plots.
 */
export function createJitterOffset(runs: Run[]): (run: Run) => number {
  const runsByDate = d3.group(runs, (d: Run) => d.eventDate);
  return (run: Run): number => {
    const runsOnDate = runsByDate.get(run.eventDate) ?? [];
    if (runsOnDate.length <= 1) return 0;
    const idx = runsOnDate.indexOf(run);
    return (idx - (runsOnDate.length - 1) / 2) * 5;
  };
}

/** Type alias for tooltip selection */
export type TooltipSelection = d3.Selection<
  HTMLDivElement,
  unknown,
  HTMLElement,
  undefined
>;

/**
 * Attaches type-safe tooltip hover handlers to a D3 selection.
 * Removes the need for `d: unknown` and type assertions in chart code.
 *
 * @example
 * attachTooltipHandlers<Run>(
 *   g.selectAll(".point"),
 *   tooltip,
 *   (run) => [{ text: run.eventName, bold: true }]
 * );
 */
export function attachTooltipHandlers<Datum>(
  selection: d3.Selection<d3.BaseType, Datum, d3.BaseType, unknown>,
  tooltip: TooltipSelection,
  contentFn: (d: Datum) => TooltipContent,
): void {
  selection
    .on("mouseover", (event: MouseEvent, d: Datum) => {
      showTooltip(tooltip, event, contentFn(d));
    })
    .on("mouseout", () => hideTooltip(tooltip));
}
