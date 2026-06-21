import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { formatTime } from "../format.ts";
import { useD3Chart } from "../hooks/useD3Chart.ts";
import {
  attachTooltipHandlers,
  createTimeXScale,
  renderJitteredPoints,
  renderRunLine,
  renderXAxis,
  renderYAxis,
} from "../d3-utils.ts";
import { getTopFinishes, sortRunsByDateAsc, type TopFinish } from "../stats.ts";

const AXIS_GAP_SECONDS = 15;
const MAX_TIME_SECONDS = 3600;
const MAX_VISIBLE_RUNS = 25;
const MEDAL_COUNT = 3;

// Indexed by rank - 1.
const MEDAL_GLYPHS = ["🥇", "🥈", "🥉"];
const MEDAL_ORDINALS = ["1st", "2nd", "3rd"];
const MEDAL_LEGEND_LABELS = ["Best", "2nd best", "3rd best"];

export function FinishTimeChart(
  { runs, width = 600, height = 300 }: ChartProps,
) {
  const svgRef = useD3Chart(
    ({ g, tooltip, dimensions, colors }) => {
      const { innerWidth, innerHeight } = dimensions;
      // Only the most recent runs are drawn; older history would make the chart
      // too dense. Best-time reference lines below still come from all of `runs`.
      const visibleRuns = sortRunsByDateAsc(runs).slice(-MAX_VISIBLE_RUNS);
      const topFinishes = getTopFinishes(runs, MEDAL_COUNT);
      const medalColor = (rank: number) =>
        [colors.medal.gold, colors.medal.silver, colors.medal.bronze][rank - 1];

      const x = createTimeXScale(visibleRuns, innerWidth);

      const allTimes = visibleRuns.map((d) => d.finishTimeSeconds).sort(
        d3.ascending,
      );
      const minTime = d3.min(allTimes) ?? 0;
      const maxTime = d3.max(allTimes) ?? MAX_TIME_SECONDS;

      // Detect outliers (Tukey's Fences) ---
      const q1 = d3.quantile(allTimes, 0.25) ?? minTime;
      const q3 = d3.quantile(allTimes, 0.75) ?? maxTime;
      const iqr = q3 - q1;

      // Points > q3 + 1.5 * iqr are considered outliers.
      // We find the largest point that is NOT an outlier.
      const upperThreshold = q3 + 1.5 * iqr;
      const normalTimes = allTimes.filter((t) => t <= upperThreshold);
      const effectiveMaxTime = d3.max(normalTimes) ?? maxTime;

      // Extend the domain downward so all medal lines are visible, even when the
      // all-time bests are faster than anything in the recent window.
      const medalMin =
        d3.min(topFinishes, (t: TopFinish) => t.finishTimeSeconds) ??
          minTime;

      const y = d3
        .scaleLinear()
        .domain([
          Math.min(minTime, medalMin) - AXIS_GAP_SECONDS,
          effectiveMaxTime + AXIS_GAP_SECONDS,
        ])
        .range([innerHeight, 0]);

      const windowSize = Math.min(7, Math.floor(visibleRuns.length / 3));
      const rollingMedian = visibleRuns.map((_: Run, i: number) => {
        const start = Math.max(0, i - windowSize + 1);
        const window = visibleRuns.slice(start, i + 1);
        return d3.median(window, (d: Run) => d.finishTimeSeconds) ?? 0;
      });

      renderXAxis(g, x, innerHeight, innerWidth, colors, {
        tickFormat: d3.timeFormat("%b '%y"),
      });
      renderYAxis(g, y, colors, (d) => formatTime(d as number));

      renderRunLine(
        g,
        visibleRuns,
        x,
        y,
        (d) => d.finishTimeSeconds,
        colors.primary,
      );

      if (windowSize > 1) {
        const medianLine = d3
          .line<number>()
          .x((_: number, i: number) => x(new Date(visibleRuns[i].eventDate)))
          .y((d: number) => y(d))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(rollingMedian)
          .attr("fill", "none")
          .attr("stroke", colors.warning)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("d", medianLine);
      }

      const points = renderJitteredPoints(g, visibleRuns, x, y, {
        value: (d) => d.finishTimeSeconds,
        radius: (d) => (d.wasPb ? 6 : 3),
        fill: (d) => (d.wasPb ? colors.success : colors.primary),
      });

      // --- All-time best reference lines (gold/silver/bronze) ---
      // Drawn after the points so the lines and labels read on top.
      const medalGroup = g.append("g").attr("class", "medal-lines");

      medalGroup
        .selectAll<SVGLineElement, TopFinish>(".medal-line")
        .data(topFinishes)
        .enter()
        .append("line")
        .attr("class", "medal-line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", (d: TopFinish) => y(d.finishTimeSeconds))
        .attr("y2", (d: TopFinish) => y(d.finishTimeSeconds))
        .attr("stroke", (d: TopFinish) => medalColor(d.rank))
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9);

      // Time label at the right end of each line; colour conveys the rank.
      medalGroup
        .selectAll<SVGTextElement, TopFinish>(".medal-label")
        .data(topFinishes)
        .enter()
        .append("text")
        .attr("class", "medal-label")
        .attr("x", innerWidth)
        .attr("y", (d: TopFinish) => y(d.finishTimeSeconds) - 3)
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", (d: TopFinish) => medalColor(d.rank))
        .text((d: TopFinish) => formatTime(d.finishTimeSeconds));

      // Wide transparent hit area so the thin lines are easy to hover.
      const medalHitAreas = medalGroup
        .selectAll<SVGLineElement, TopFinish>(".medal-hit")
        .data(topFinishes)
        .enter()
        .append("line")
        .attr("class", "medal-hit")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", (d: TopFinish) => y(d.finishTimeSeconds))
        .attr("y2", (d: TopFinish) => y(d.finishTimeSeconds))
        .attr("stroke", "transparent")
        .attr("stroke-width", 10)
        .style("pointer-events", "stroke")
        .style("cursor", "pointer");

      attachTooltipHandlers<TopFinish>(
        medalHitAreas,
        tooltip,
        (finish) => [
          {
            text: `${MEDAL_GLYPHS[finish.rank - 1]} ${
              MEDAL_ORDINALS[finish.rank - 1]
            } best`,
            bold: true,
          },
          { text: finish.run.eventName },
          { text: new Date(finish.run.eventDate).toLocaleDateString() },
          { text: `Time: ${formatTime(finish.finishTimeSeconds)}` },
        ],
      );

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
        .attr("stroke", colors.primary)
        .attr("stroke-width", 1.5);
      legend.append("text").attr("x", 25).attr("y", 4).attr("font-size", "11px")
        .attr("fill", colors.axis).text("Finish time");

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 15)
        .attr("y2", 15)
        .attr("stroke", colors.warning)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
      legend.append("text").attr("x", 25).attr("y", 19).attr(
        "font-size",
        "11px",
      )
        .attr("fill", colors.axis).text(`${windowSize}-run median`);

      legend
        .append("circle")
        .attr("cx", 10)
        .attr("cy", 30)
        .attr("r", 5)
        .attr("fill", colors.success);
      legend.append("text").attr("x", 25).attr("y", 34).attr(
        "font-size",
        "11px",
      )
        .attr("fill", colors.axis).text("PB");

      // Medal legend rows, one per available best time.
      topFinishes.forEach((finish, i) => {
        const yOffset = 45 + i * 15;
        legend
          .append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", yOffset)
          .attr("y2", yOffset)
          .attr("stroke", medalColor(finish.rank))
          .attr("stroke-width", 1.5);
        legend.append("text").attr("x", 25).attr("y", yOffset + 4).attr(
          "font-size",
          "11px",
        )
          .attr("fill", colors.axis).text(MEDAL_LEGEND_LABELS[finish.rank - 1]);
      });

      attachTooltipHandlers<Run>(
        points,
        tooltip,
        (run) => [
          { text: run.eventName, bold: true },
          { text: new Date(run.eventDate).toLocaleDateString() },
          {
            text: `Time: ${formatTime(run.finishTimeSeconds)}${
              run.wasPb ? " (PB!)" : ""
            }`,
          },
        ],
      );
    },
    [runs, width, height],
    width,
    height,
    { top: 20, right: 10, bottom: 25, left: 45 },
  );

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Line chart of finish times for the last 25 runs, with gold, silver and bronze reference lines for the three fastest finish times overall"
    />
  );
}
