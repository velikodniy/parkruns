import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { getEventShortName } from "../lib/parkrun/index.ts";
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

const AGE_GRADE_BANDS = [
  { y: 80, label: "80%", color: chartColors.success },
  { y: 70, label: "70%", color: chartColors.warning },
  { y: 60, label: "60%", color: "#ff6b6b" },
] as const;

export function AgeGradeChart({ runs, width = 600, height = 300 }: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions }) => {
      const { innerWidth, innerHeight } = dimensions;
      const sortedRuns = sortRunsByDate(runs);

      const x = createTimeXScale(sortedRuns, innerWidth);
      const minAgeGrade = Math.min(
        40,
        d3.min(sortedRuns, (d: Run) => d.ageGrade) ?? 40,
      );
      const y = d3
        .scaleLinear()
        .domain([minAgeGrade - 5, 100])
        .range([innerHeight, 0]);

      for (const band of AGE_GRADE_BANDS) {
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", y(band.y))
          .attr("y2", y(band.y))
          .attr("stroke", band.color)
          .attr("stroke-dasharray", "4,4")
          .attr("opacity", 0.5);

        g.append("text")
          .attr("x", innerWidth + 5)
          .attr("y", y(band.y))
          .attr("dy", "0.35em")
          .attr("font-size", "10px")
          .attr("fill", band.color)
          .text(band.label);
      }

      renderXAxis(g, x, innerHeight);
      renderYAxis(g, y, (d) => `${d}%`);

      const line = d3
        .line<Run>()
        .x((d: Run) => x(new Date(d.eventDate)))
        .y((d: Run) => y(d.ageGrade));

      g.append("path")
        .datum(sortedRuns)
        .attr("fill", "none")
        .attr("stroke", chartColors.primary)
        .attr("stroke-width", 1.5)
        .attr("d", line);

      g.selectAll(".point")
        .data(sortedRuns)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (d: Run) => x(new Date(d.eventDate)))
        .attr("cy", (d: Run) => y(d.ageGrade))
        .attr("r", 3)
        .attr("fill", chartColors.primary);

      g.selectAll(".point")
        .on("mouseover", (event: MouseEvent, d: unknown) => {
          const run = d as Run;
          showTooltip(tooltip, event, [
            { text: getEventShortName(run.eventId) ?? run.eventName, bold: true },
            { text: new Date(run.eventDate).toLocaleDateString() },
            { text: `Age Grade: ${run.ageGrade.toFixed(1)}%` },
            { text: `Category: ${run.ageCategory}` },
          ]);
        })
        .on("mouseout", () => hideTooltip(tooltip));
    },
    [runs, width, height],
    width,
    height,
  );

  return <svg ref={svgRef} width={width} height={height} />;
}
