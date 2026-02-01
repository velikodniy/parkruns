import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { getEventShortName } from "../lib/parkrun/index.ts";
import { formatTime } from "../format.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";
import {
  attachTooltipHandlers,
  createTimeXScale,
  renderXAxis,
  renderYAxis,
  sortRunsByDate,
} from "../d3-utils.ts";

interface PBPoint {
  date: Date;
  time: number;
  run: Run;
}

export function PBProgressionChart(
  { runs, width = 600, height = 300 }: ChartProps,
) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions, colors }) => {
      const { innerWidth, innerHeight } = dimensions;
      const sortedRuns = sortRunsByDate(runs);

      let bestSoFar = Number.POSITIVE_INFINITY;
      const pbProgression: PBPoint[] = sortedRuns
        .map((run) => {
          if (run.finishTimeSeconds < bestSoFar) {
            bestSoFar = run.finishTimeSeconds;
            return {
              date: new Date(run.eventDate),
              time: run.finishTimeSeconds,
              run,
            };
          }
          return null;
        })
        .filter((d): d is PBPoint => d !== null);

      const x = createTimeXScale(sortedRuns, innerWidth);

      const minTime = d3.min(pbProgression, (d: PBPoint) => d.time) ?? 0;
      const maxTime = d3.max(pbProgression, (d: PBPoint) => d.time) ?? 0;
      const y = d3
        .scaleLinear()
        .domain([minTime - 30, maxTime + 30])
        .range([innerHeight, 0]);

      renderXAxis(g, x, innerHeight, innerWidth, colors, {
        tickFormat: d3.timeFormat("%b '%y"),
      });
      renderYAxis(g, y, colors, (d) => formatTime(d as number));

      const stepLine = d3
        .line<PBPoint>()
        .x((d: PBPoint) => x(d.date))
        .y((d: PBPoint) => y(d.time))
        .curve(d3.curveStepAfter);

      g.append("path")
        .datum(pbProgression)
        .attr("fill", "none")
        .attr("stroke", colors.success)
        .attr("stroke-width", 2)
        .attr("d", stepLine);

      g.selectAll(".pb-point")
        .data(pbProgression)
        .enter()
        .append("circle")
        .attr("class", "pb-point")
        .attr("cx", (d: PBPoint) => x(d.date))
        .attr("cy", (d: PBPoint) => y(d.time))
        .attr("r", 5)
        .attr("fill", colors.success)
        .attr("opacity", 0.85);

      attachTooltipHandlers<PBPoint>(
        g.selectAll(".pb-point"),
        tooltip,
        (data) => [
          {
            text: getEventShortName(data.run.eventId) ?? data.run.eventName,
            bold: true,
          },
          { text: data.date.toLocaleDateString() },
          { text: `Time: ${formatTime(data.time)}` },
        ],
      );
    },
    [runs, width, height],
    width,
    height,
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Line chart showing personal best progression over time"
    />
  );
}
