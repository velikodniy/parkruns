import { useState } from "react";
import { Group, SegmentedControl } from "@mantine/core";
import * as d3 from "d3";
import type { ChartProps, Run } from "../types.ts";
import { formatPace, formatTime } from "../format.ts";
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
import { runKey } from "./run-utils.ts";

const AXIS_GAP_SECONDS = 15;
const MAX_TIME_SECONDS = 3600;
const MAX_VISIBLE_RUNS = 25;
const MEDAL_COUNT = 3;
// Minimum vertical spacing between right-end time labels when best times cluster.
const MEDAL_LABEL_MIN_GAP = 12;

// Indexed by rank - 1.
const MEDAL_GLYPHS = ["🥇", "🥈", "🥉"];
const MEDAL_ORDINALS = ["1st", "2nd", "3rd"];

/** A best-time line's right-end label with a collision-adjusted y position. */
interface MedalLabel {
  finish: TopFinish;
  labelY: number;
}

/** Which value the y-axis (and its gutter labels) display. */
type Metric = "time" | "pace";

// Pace labels ("4:25/km") are wider than time labels ("22:05"), so the axis
// gutters need extra room when pace is shown.
const TIME_MARGIN = { top: 20, right: 36, bottom: 25, left: 45 };
const PACE_MARGIN = { top: 20, right: 52, bottom: 25, left: 58 };

export function FinishTimeChart(
  { runs, width = 600, height = 300 }: ChartProps,
) {
  const [metric, setMetric] = useState<Metric>("time");
  // The finish-time and pace lines are the same curve (every parkrun is 5km),
  // so the toggle only swaps how the y-axis and gutter labels are formatted.
  const formatMetric = metric === "pace" ? formatPace : formatTime;

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
      renderYAxis(g, y, colors, (d) => formatMetric(d as number));

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

      // Colour the dots for the all-time best finishes to match their medal
      // lines (keyed by run so only the actual best runs light up, not every
      // run that happens to share a best time).
      const medalRankByRun = new Map(
        topFinishes.map((f) => [runKey(f.run), f.rank]),
      );

      const points = renderJitteredPoints(g, visibleRuns, x, y, {
        value: (d) => d.finishTimeSeconds,
        radius: (d) => (medalRankByRun.has(runKey(d)) || d.wasPb ? 6 : 3),
        fill: (d) => {
          const rank = medalRankByRun.get(runKey(d));
          if (rank) return medalColor(rank);
          return d.wasPb ? colors.success : colors.primary;
        },
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
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.5);

      // Time labels live in the right gutter (outside the plot) so they never
      // overlap the data, mirroring the Age Grade chart's band labels. Best
      // times can be only seconds apart, so nudge labels apart vertically to
      // keep them legible when the lines nearly coincide.
      const labelLayout: MedalLabel[] = topFinishes
        .map((finish) => ({ finish, labelY: y(finish.finishTimeSeconds) }))
        .sort((a, b) => a.labelY - b.labelY);
      for (let i = 1; i < labelLayout.length; i++) {
        const minY = labelLayout[i - 1].labelY + MEDAL_LABEL_MIN_GAP;
        if (labelLayout[i].labelY < minY) labelLayout[i].labelY = minY;
      }

      medalGroup
        .selectAll<SVGTextElement, MedalLabel>(".medal-label")
        .data(labelLayout)
        .enter()
        .append("text")
        .attr("class", "medal-label")
        .attr("x", innerWidth + 5)
        .attr("y", (d: MedalLabel) => d.labelY)
        .attr("dy", "0.35em")
        .attr("font-size", "10px")
        .attr("fill", (d: MedalLabel) => medalColor(d.finish.rank))
        .attr("pointer-events", "none")
        .text((d: MedalLabel) => formatMetric(d.finish.finishTimeSeconds));

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
          { text: `Pace: ${formatPace(finish.finishTimeSeconds)}` },
        ],
      );

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
          { text: `Pace: ${formatPace(run.finishTimeSeconds)}` },
        ],
      );
    },
    [runs, width, height, metric],
    width,
    height,
    metric === "pace" ? PACE_MARGIN : TIME_MARGIN,
  );

  return (
    <div>
      <Group justify="flex-end" mb="xs">
        <SegmentedControl
          size="xs"
          value={metric}
          onChange={(value) => setMetric(value as Metric)}
          data={[
            { label: "Time", value: "time" },
            { label: "Pace", value: "pace" },
          ]}
          aria-label="Show finish time or pace on the y-axis"
        />
      </Group>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={`Line chart of finish ${
          metric === "pace" ? "pace" : "times"
        } for the last 25 runs, with gold, silver and bronze reference lines for the three fastest finishes overall`}
      />
    </div>
  );
}
