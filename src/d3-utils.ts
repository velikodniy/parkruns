import * as d3 from "d3";
import type { Run } from "./types.ts";
import { chartColors } from "./theme.ts";

export function createTooltip() {
  return d3
    .select("body")
    .append("div")
    .attr("class", "chart-tooltip")
    .style("position", "absolute")
    .style("background", chartColors.background)
    .style("border", `1px solid ${chartColors.border}`)
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("font-size", "12px")
    .style("color", chartColors.text)
    .style("pointer-events", "none")
    .style("opacity", 0);
}

export function sortRunsByDate(runs: Run[]): Run[] {
  return [...runs].sort(
    (a, b) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
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

export function renderXAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.AxisScale<Date | d3.NumberValue>,
  innerHeight: number,
  ticks = 6,
): void {
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(scale).ticks(ticks))
    .attr("color", chartColors.axis);
}

export function renderYAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.AxisScale<d3.NumberValue>,
  tickFormat?: (d: d3.NumberValue) => string,
): void {
  const axis = tickFormat
    ? d3.axisLeft(scale).tickFormat(tickFormat)
    : d3.axisLeft(scale);
  g.append("g").call(axis).attr("color", chartColors.axis);
}

export function showTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
  event: MouseEvent,
  html: string,
): void {
  tooltip
    .style("opacity", 1)
    .html(html)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 10}px`);
}

export function hideTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
): void {
  tooltip.style("opacity", 0);
}
