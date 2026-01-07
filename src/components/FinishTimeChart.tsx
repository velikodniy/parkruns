import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { getEventShortName } from "../lib/parkrun/index.ts";
import { formatTime } from "../format.ts";
import { chartColors } from "../theme.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";
import {
  createTimeXScale,
  hideTooltip,
  renderXAxis,
  renderYAxis,
  showTooltip,
  sortRunsByDate,
} from "../d3-utils.ts";

export function FinishTimeChart({ runs, width = 600, height = 300 }: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions }) => {
      const { innerWidth, innerHeight } = dimensions;
      const sortedRuns = sortRunsByDate(runs);

      const x = createTimeXScale(sortedRuns, innerWidth);

      const minTime = d3.min(sortedRuns, (d: Run) => d.finishTimeSeconds) ?? 0;
      const maxTime = d3.max(sortedRuns, (d: Run) => d.finishTimeSeconds) ?? 0;
      const y = d3
        .scaleLinear()
        .domain([minTime - 60, maxTime + 60])
        .range([innerHeight, 0]);

      const windowSize = Math.min(7, Math.floor(sortedRuns.length / 3));
      const rollingAvg = sortedRuns.map((_: Run, i: number) => {
        const start = Math.max(0, i - windowSize + 1);
        const window = sortedRuns.slice(start, i + 1);
        return d3.mean(window, (d: Run) => d.finishTimeSeconds) ?? 0;
      });

      renderXAxis(g, x, innerHeight);
      renderYAxis(g, y, (d) => formatTime(d as number));

      const line = d3
        .line<Run>()
        .x((d: Run) => x(new Date(d.eventDate)))
        .y((d: Run) => y(d.finishTimeSeconds));

      g.append("path")
        .datum(sortedRuns)
        .attr("fill", "none")
        .attr("stroke", chartColors.primary)
        .attr("stroke-width", 1.5)
        .attr("d", line);

      if (windowSize > 1) {
        const avgLine = d3
          .line<number>()
          .x((_: number, i: number) => x(new Date(sortedRuns[i].eventDate)))
          .y((d: number) => y(d))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(rollingAvg)
          .attr("fill", "none")
          .attr("stroke", chartColors.warning)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("d", avgLine);
      }

      g.selectAll(".point")
        .data(sortedRuns)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (d: Run) => x(new Date(d.eventDate)))
        .attr("cy", (d: Run) => y(d.finishTimeSeconds))
        .attr("r", (d: Run) => (d.wasPB ? 6 : 3))
        .attr("fill", (d: Run) => (d.wasPB ? chartColors.success : chartColors.primary));

      const legend = g.append("g").attr(
        "transform",
        `translate(${innerWidth - 140}, 0)`,
      );

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", chartColors.primary)
        .attr("stroke-width", 1.5);
      legend.append("text").attr("x", 25).attr("y", 4).attr("font-size", "11px")
        .attr("fill", chartColors.axis).text("Finish time");

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 15)
        .attr("y2", 15)
        .attr("stroke", chartColors.warning)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
      legend.append("text").attr("x", 25).attr("y", 19).attr("font-size", "11px")
        .attr("fill", chartColors.axis).text(`${windowSize}-run average`);

      legend
        .append("circle")
        .attr("cx", 10)
        .attr("cy", 30)
        .attr("r", 5)
        .attr("fill", chartColors.success);
      legend.append("text").attr("x", 25).attr("y", 34).attr("font-size", "11px")
        .attr("fill", chartColors.axis).text("PB");

      g.selectAll(".point")
        .on("mouseover", (event: MouseEvent, d: unknown) => {
          const run = d as Run;
          showTooltip(
            tooltip,
            event,
            `<strong>${getEventShortName(run.eventId) ?? run.eventName}</strong><br/>
            ${new Date(run.eventDate).toLocaleDateString()}<br/>
            Time: ${formatTime(run.finishTimeSeconds)}${run.wasPB ? " (PB!)" : ""}`,
          );
        })
        .on("mouseout", () => hideTooltip(tooltip));
    },
    [runs, width, height],
    width,
    height,
  );

  return <svg ref={svgRef} width={width} height={height} />;
}
