import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { formatTime } from "../format.ts";
import { attachTooltipHandlers } from "../d3-utils.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";

const EVENT_MIX_MARGIN = { top: 20, right: 80, bottom: 40, left: 150 };

export function EventMixChart({ runs, width = 600, height = 400 }: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions, colors }) => {
      const { innerWidth, innerHeight } = dimensions;

      interface EventStats {
        count: number;
        bestTime: number;
        avgTime: number;
      }

      type EventEntry = { name: string } & EventStats;

      const eventData = d3.rollups(
        runs,
        (v: Run[]) => ({
          count: v.length,
          bestTime: d3.min(v, (d: Run) => d.finishTimeSeconds) ?? 0,
          avgTime: d3.mean(v, (d: Run) => d.finishTimeSeconds) ?? 0,
        }),
        (d: Run) => d.eventName,
      );

      const sortedData: EventEntry[] = eventData
        .map(([name, stats]: [string, EventStats]) => ({ name, ...stats }))
        .sort((a: EventEntry, b: EventEntry) => b.count - a.count)
        .slice(0, 15);

      const y = d3
        .scaleBand<string>()
        .domain(sortedData.map((d: EventEntry) => d.name))
        .range([0, innerHeight])
        .padding(0.2);

      const maxCount = d3.max(sortedData, (d: EventEntry) => d.count) ?? 0;
      const x = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);

      g.append("g").call(d3.axisLeft(y)).attr("color", colors.axis);

      const tickCount = Math.max(2, Math.min(8, Math.floor(innerWidth / 60)));
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(tickCount))
        .attr("color", colors.axis);

      g.selectAll<SVGRectElement, EventEntry>(".bar")
        .data(sortedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d: EventEntry) => y(d.name) ?? 0)
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", (d: EventEntry) => x(d.count))
        .attr("fill", colors.primary)
        .attr("opacity", 0.8);

      g.selectAll<SVGTextElement, EventEntry>(".count-label")
        .data(sortedData)
        .enter()
        .append("text")
        .attr("class", "count-label")
        .attr("y", (d: EventEntry) => (y(d.name) ?? 0) + y.bandwidth() / 2)
        .attr("x", (d: EventEntry) => x(d.count) + 5)
        .attr("dy", "0.35em")
        .attr("font-size", "11px")
        .attr("fill", colors.text)
        .text((d: EventEntry) => `${d.count} (${formatTime(d.bestTime)})`);

      attachTooltipHandlers<EventEntry>(
        g.selectAll(".bar"),
        tooltip,
        (data) => [
          { text: data.name, bold: true },
          { text: `Runs: ${data.count}` },
          { text: `Best: ${formatTime(data.bestTime)}` },
          { text: `Avg: ${formatTime(Math.round(data.avgTime))}` },
        ],
      );
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
