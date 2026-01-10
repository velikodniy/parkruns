import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { formatTime } from "../format.ts";
import { hideTooltip, showTooltip } from "../d3-utils.ts";
import { getChartColors } from "../theme.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";

const EVENT_MIX_MARGIN = { top: 20, right: 80, bottom: 40, left: 150 };

export function EventMixChart({ runs, width = 600, height = 400 }: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions }) => {
      const { innerWidth, innerHeight } = dimensions;
      const colors = getChartColors();

      const eventData = d3.rollups(
        runs,
        (v) => ({
          count: v.length,
          bestTime: d3.min(v, (d) => d.finishTimeSeconds) ?? 0,
          avgTime: d3.mean(v, (d) => d.finishTimeSeconds) ?? 0,
        }),
        (d: Run) => d.eventName,
      );

      const sortedData = eventData
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      const y = d3
        .scaleBand()
        .domain(sortedData.map((d) => d.name))
        .range([0, innerHeight])
        .padding(0.2);

      const maxCount = d3.max(sortedData, (d) => d.count) ?? 0;
      const x = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);

      g.append("g").call(d3.axisLeft(y)).attr("color", colors.axis);

      const tickCount = Math.max(2, Math.min(8, Math.floor(innerWidth / 60)));
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(tickCount))
        .attr("color", colors.axis);

      g.selectAll(".bar")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => y(d.name) ?? 0)
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", (d) => x(d.count))
        .attr("fill", colors.primary)
        .attr("opacity", 0.8);

      g.selectAll(".count-label")
        .data(sortedData)
        .enter()
        .append("text")
        .attr("class", "count-label")
        .attr("y", (d) => (y(d.name) ?? 0) + y.bandwidth() / 2)
        .attr("x", (d) => x(d.count) + 5)
        .attr("dy", "0.35em")
        .attr("font-size", "11px")
        .attr("fill", colors.text)
        .text((d) => `${d.count} (${formatTime(d.bestTime)})`);

      g.selectAll(".bar")
        .on("mouseover", (event: MouseEvent, d: unknown) => {
          const data = d as {
            name: string;
            count: number;
            bestTime: number;
            avgTime: number;
          };
          showTooltip(tooltip, event, [
            { text: data.name, bold: true },
            { text: `Runs: ${data.count}` },
            { text: `Best: ${formatTime(data.bestTime)}` },
            { text: `Avg: ${formatTime(Math.round(data.avgTime))}` },
          ]);
        })
        .on("mouseout", () => hideTooltip(tooltip));
    },
    [runs, width, height],
    width,
    height,
    EVENT_MIX_MARGIN,
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Bar chart showing top 15 most visited parkrun events by run count"
    />
  );
}
