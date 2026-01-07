import * as d3 from "d3";
import type { Run } from "./types.ts";
import { getChartColors } from "./theme.ts";

/** A single line of tooltip content */
export interface TooltipLine {
  text: string;
  bold?: boolean;
}

export type TooltipContent = TooltipLine[];

export function createTooltip() {
  const colors = getChartColors();
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
  const colors = getChartColors();
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(scale).ticks(ticks))
    .attr("color", colors.axis);
}

export function renderYAxis(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.AxisScale<d3.NumberValue>,
  tickFormat?: (d: d3.NumberValue) => string,
): void {
  const colors = getChartColors();
  const axis = tickFormat
    ? d3.axisLeft(scale).tickFormat(tickFormat)
    : d3.axisLeft(scale);
  g.append("g").call(axis).attr("color", colors.axis);
}

export function showTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
  event: MouseEvent,
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
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 10}px`);
}

export function hideTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>,
): void {
  tooltip.style("opacity", 0);
}
