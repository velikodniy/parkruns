import * as d3 from "d3";
import type { ChartProps } from "../types.ts";
import { formatTime } from "../format.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";
import { attachTooltipHandlers, renderYAxis } from "../d3-utils.ts";
import {
  buildMonthlyFinishTimeData,
  type MonthlyFinishTimeData,
} from "../chart-data.ts";

const DISTRIBUTION_MARGIN = { top: 20, right: 30, bottom: 60, left: 50 };

export function FinishTimeDistribution({
  runs,
  width = 600,
  height = 300,
}: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions, colors }) => {
      const { innerWidth, innerHeight } = dimensions;

      const monthlyData = buildMonthlyFinishTimeData(runs);

      const x = d3
        .scaleBand()
        .domain(monthlyData.map((d: MonthlyFinishTimeData) => d.month))
        .range([0, innerWidth])
        .padding(0.3);

      const allTimes = runs.map((r) => r.finishTimeSeconds);
      const minTime = d3.min(allTimes) ?? 0;
      const maxTime = d3.max(allTimes) ?? 0;
      const y = d3
        .scaleLinear()
        .domain([minTime - 30, maxTime + 30])
        .range([innerHeight, 0]);

      const maxTicks = Math.max(2, Math.floor(innerWidth / 50));
      const tickStep = Math.max(1, Math.ceil(monthlyData.length / maxTicks));
      const tickValues = monthlyData
        .filter((_: MonthlyFinishTimeData, i: number) => i % tickStep === 0)
        .map((d: MonthlyFinishTimeData) => d.month);

      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3.axisBottom(x)
            .tickValues(tickValues)
            .tickFormat((d: string) => {
              const [year, month] = d.split("-");
              return `${month}/${year.slice(2)}`;
            }),
        )
        .attr("color", colors.axis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      renderYAxis(g, y, colors, (d) => formatTime(d as number));

      const boxWidth = x.bandwidth();
      const narrowWidth = boxWidth * 0.5;
      const narrowOffset = (boxWidth - narrowWidth) / 2;

      const boxes = g
        .selectAll<SVGGElement, MonthlyFinishTimeData>(".box-group")
        .data(monthlyData)
        .enter()
        .append("g")
        .attr("class", "box-group")
        .attr(
          "transform",
          (d: MonthlyFinishTimeData) => `translate(${x(d.month) ?? 0},0)`,
        );

      // Lower whisker (min to q1)
      boxes
        .append("line")
        .attr("x1", boxWidth / 2)
        .attr("x2", boxWidth / 2)
        .attr("y1", (d: MonthlyFinishTimeData) => y(d.min))
        .attr("y2", (d: MonthlyFinishTimeData) => y(d.q1))
        .attr("stroke", colors.boxStroke)
        .attr("stroke-width", 1);

      // Upper whisker (q3 to max)
      boxes
        .append("line")
        .attr("x1", boxWidth / 2)
        .attr("x2", boxWidth / 2)
        .attr("y1", (d: MonthlyFinishTimeData) => y(d.q3))
        .attr("y2", (d: MonthlyFinishTimeData) => y(d.max))
        .attr("stroke", colors.boxStroke)
        .attr("stroke-width", 1);

      // IQR Box (q1 to q3)
      const rects = boxes
        .append("rect")
        .attr("x", narrowOffset)
        .attr("y", (d: MonthlyFinishTimeData) => y(d.q3))
        .attr("width", narrowWidth)
        .attr(
          "height",
          (d: MonthlyFinishTimeData) => Math.abs(y(d.q1) - y(d.q3)),
        )
        .attr("fill", colors.box)
        .attr("opacity", 0.8)
        .attr("stroke", colors.boxStroke)
        .attr("stroke-width", 1)
        .style("cursor", "pointer");

      // Median line
      boxes
        .append("line")
        .attr("x1", narrowOffset)
        .attr("x2", narrowOffset + narrowWidth)
        .attr("y1", (d: MonthlyFinishTimeData) => y(d.median))
        .attr("y2", (d: MonthlyFinishTimeData) => y(d.median))
        .attr("stroke", colors.text)
        .attr("stroke-width", 2);

      attachTooltipHandlers<MonthlyFinishTimeData>(
        rects,
        tooltip,
        (d) => [
          { text: d.month, bold: true },
          { text: `Runs: ${d.count}` },
          { text: `Best: ${formatTime(d.min)}` },
          { text: `Q1: ${formatTime(d.q1)}` },
          { text: `Median: ${formatTime(d.median)}` },
          { text: `Q3: ${formatTime(d.q3)}` },
          { text: `Worst: ${formatTime(d.max)}` },
        ],
      );
    },
    [runs, width, height],
    width,
    height,
    DISTRIBUTION_MARGIN,
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Box plot showing monthly finish time distribution"
    />
  );
}
