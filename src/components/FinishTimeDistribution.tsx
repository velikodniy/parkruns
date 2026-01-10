import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { formatTime } from "../format.ts";
import { chartMargins, getChartColors } from "../theme.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";
import { hideTooltip, renderYAxis, showTooltip } from "../d3-utils.ts";

interface MonthData {
  month: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

const DISTRIBUTION_MARGIN = { top: 20, right: 30, bottom: 60, left: 50 };

export function FinishTimeDistribution({
  runs,
  width = 600,
  height = 300,
}: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions }) => {
      const { innerWidth, innerHeight } = dimensions;
      const colors = getChartColors();

      const byMonth = d3.rollups(
        runs,
        (v: Run[]) => v.map((r) => r.finishTimeSeconds).sort((a, b) => a - b),
        (d: Run) => d3.timeFormat("%Y-%m")(new Date(d.eventDate)),
      );

      const monthlyData: MonthData[] = byMonth
        .map(([month, times]: [string, number[]]) => {
          if (times.length === 0) return null;
          const q1Index = Math.floor(times.length * 0.25);
          const medianIndex = Math.floor(times.length * 0.5);
          const q3Index = Math.floor(times.length * 0.75);
          return {
            month,
            min: times[0],
            q1: times[q1Index],
            median: times[medianIndex],
            q3: times[q3Index],
            max: times[times.length - 1],
            count: times.length,
          };
        })
        .filter((d: MonthData | null): d is MonthData => d !== null)
        .sort((a: MonthData, b: MonthData) => a.month.localeCompare(b.month));

      const x = d3
        .scaleBand()
        .domain(monthlyData.map((d: MonthData) => d.month))
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
        .filter((_: MonthData, i: number) => i % tickStep === 0)
        .map((d: MonthData) => d.month);

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

      renderYAxis(g, y, (d) => formatTime(d as number));

      const boxWidth = x.bandwidth();

      for (const d of monthlyData) {
        const xPos = x(d.month) ?? 0;
        const centerX = xPos + boxWidth / 2;
        const narrowWidth = boxWidth * 0.5;
        const narrowOffset = (boxWidth - narrowWidth) / 2;

        g.append("line")
          .attr("x1", centerX)
          .attr("x2", centerX)
          .attr("y1", y(d.min))
          .attr("y2", y(d.q1))
          .attr("stroke", colors.boxStroke)
          .attr("stroke-width", 1);

        g.append("line")
          .attr("x1", centerX)
          .attr("x2", centerX)
          .attr("y1", y(d.q3))
          .attr("y2", y(d.max))
          .attr("stroke", colors.boxStroke)
          .attr("stroke-width", 1);

        g.append("rect")
          .attr("x", xPos + narrowOffset)
          .attr("y", y(d.q3))
          .attr("width", narrowWidth)
          .attr("height", Math.abs(y(d.q1) - y(d.q3)))
          .attr("fill", colors.box)
          .attr("opacity", 0.8)
          .attr("stroke", colors.boxStroke)
          .attr("stroke-width", 1);

        g.append("line")
          .attr("x1", xPos + narrowOffset)
          .attr("x2", xPos + narrowOffset + narrowWidth)
          .attr("y1", y(d.median))
          .attr("y2", y(d.median))
          .attr("stroke", colors.text)
          .attr("stroke-width", 2);
      }

      g.selectAll("rect").on("mouseover", (event: MouseEvent) => {
        const target = event.target as SVGRectElement;
        const xVal = Number.parseFloat(target.getAttribute("x") ?? "0");
        const narrowOffset = boxWidth * 0.25;
        const monthData = monthlyData.find(
          (d) => Math.abs((x(d.month) ?? 0) + narrowOffset - xVal) < 1,
        );
        if (monthData) {
          showTooltip(tooltip, event, [
            { text: monthData.month, bold: true },
            { text: `Runs: ${monthData.count}` },
            { text: `Best: ${formatTime(monthData.min)}` },
            { text: `Q1: ${formatTime(monthData.q1)}` },
            { text: `Median: ${formatTime(monthData.median)}` },
            { text: `Q3: ${formatTime(monthData.q3)}` },
            { text: `Worst: ${formatTime(monthData.max)}` },
          ]);
        }
      });

      g.selectAll("rect").on("mouseout", () => hideTooltip(tooltip));
    },
    [runs, width, height],
    width,
    height,
    DISTRIBUTION_MARGIN,
  );

  return <svg ref={svgRef} width={width} height={height} />;
}
