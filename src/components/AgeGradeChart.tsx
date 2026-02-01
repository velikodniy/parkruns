import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { getEventShortName } from "../lib/parkrun/index.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";
import {
  attachTooltipHandlers,
  createJitterOffset,
  createTimeXScale,
  hideTooltip,
  renderXAxis,
  renderYAxis,
  showTooltip,
  sortRunsByDate,
} from "../d3-utils.ts";

export function AgeGradeChart({ runs, width = 600, height = 300 }: ChartProps) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions, colors }) => {
      const { innerWidth, innerHeight } = dimensions;
      const sortedRuns = sortRunsByDate(runs);

      const ageGradeBands = [
        { y: 90, label: "90%", color: colors.ageGrade.worldClass, description: "World Class" },
        { y: 80, label: "80%", color: colors.ageGrade.nationalClass, description: "National Class" },
        { y: 70, label: "70%", color: colors.ageGrade.regionalClass, description: "Regional Class" },
        { y: 60, label: "60%", color: colors.ageGrade.localClass, description: "Local Class" },
      ];

      const x = createTimeXScale(sortedRuns, innerWidth);
      const minAgeGrade = Math.min(
        40,
        d3.min(sortedRuns, (d: Run) => d.ageGrade) ?? 40,
      );
      const y = d3
        .scaleLinear()
        .domain([minAgeGrade - 5, 100])
        .range([innerHeight, 0]);

      const minHitboxHeight = 44;
      const bandPositions = ageGradeBands.map((band) => ({
        ...band,
        yPos: y(band.y),
      }));

      for (let i = 0; i < bandPositions.length; i++) {
        const band = bandPositions[i];
        const prevBandY = i > 0 ? bandPositions[i - 1].yPos : 0;
        const nextBandY =
          i < bandPositions.length - 1
            ? bandPositions[i + 1].yPos
            : innerHeight;

        const spaceAbove = band.yPos - prevBandY;
        const spaceBelow = nextBandY - band.yPos;
        const hitboxTop = band.yPos - Math.min(spaceAbove / 2, minHitboxHeight / 2);
        const hitboxBottom = band.yPos + Math.min(spaceBelow / 2, minHitboxHeight / 2);
        const hitboxHeight = hitboxBottom - hitboxTop;

        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", band.yPos)
          .attr("y2", band.yPos)
          .attr("stroke", band.color)
          .attr("stroke-dasharray", "4,4")
          .attr("opacity", 0.5);

        g.append("text")
          .attr("x", innerWidth + 5)
          .attr("y", band.yPos)
          .attr("dy", "0.35em")
          .attr("font-size", "10px")
          .attr("fill", band.color)
          .attr("pointer-events", "none")
          .text(band.label);

        g.append("rect")
          .attr("x", 0)
          .attr("y", hitboxTop)
          .attr("width", innerWidth + 35)
          .attr("height", hitboxHeight)
          .attr("fill", "transparent")
          .attr("cursor", "pointer")
          .on("mouseover", (event: MouseEvent) => {
            showTooltip(tooltip, event, [
              { text: `${band.label} · ${band.description}`, bold: true },
              { text: "WMA age-grading standard" },
            ]);
          })
          .on("mouseout", () => hideTooltip(tooltip))
          .on("touchstart", (event: TouchEvent) => {
            event.preventDefault();
            const touch = event.touches[0];
            if (!touch) return;
            showTooltip(tooltip, touch, [
              { text: `${band.label} · ${band.description}`, bold: true },
              { text: "WMA age-grading standard" },
            ]);
          })
          .on("touchend", () => hideTooltip(tooltip));
      }

      renderXAxis(g, x, innerHeight, innerWidth, colors, {
        tickFormat: d3.timeFormat("%b '%y"),
      });
      renderYAxis(g, y, colors, (d) => `${d}%`);

      const line = d3
        .line<Run>()
        .x((d: Run) => x(new Date(d.eventDate)))
        .y((d: Run) => y(d.ageGrade));

      g.append("path")
        .datum(sortedRuns)
        .attr("fill", "none")
        .attr("stroke", colors.primary)
        .attr("stroke-width", 1.5)
        .attr("d", line);

      const getJitterOffset = createJitterOffset(sortedRuns);

      g.selectAll(".point")
        .data(sortedRuns)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (d: Run) => x(new Date(d.eventDate)) + getJitterOffset(d))
        .attr("cy", (d: Run) => y(d.ageGrade))
        .attr("r", 3)
        .attr("fill", colors.primary)
        .attr("opacity", 0.8);

      attachTooltipHandlers<Run>(
        g.selectAll(".point"),
        tooltip,
        (run) => [
          { text: getEventShortName(run.eventId) ?? run.eventName, bold: true },
          { text: new Date(run.eventDate).toLocaleDateString() },
          { text: `Age Grade: ${run.ageGrade.toFixed(1)}%` },
          { text: `Category: ${run.ageCategory}` },
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
      aria-label="Line chart showing age grade percentage over time"
    />
  );
}
