import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Run } from "../types.ts";
import { useChartTheme } from "../context/ThemeContext.tsx";
import { createTooltip, hideTooltip, showTooltip } from "../d3-utils.ts";
import { formatTime } from "../format.ts";

interface Props {
  runs: Run[];
  width?: number;
}

interface WeekData {
  week: Date;
  runs: Run[];
  count: number;
}

export function ConsistencyCalendar({ runs, width = 900 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { colors } = useChartTheme();

  const isMobile = width < 600;
  const leftMargin = 40;
  const topMargin = 25;
  const cellGap = isMobile ? 1 : 2;

  // A calendar year + overlap spans at most 54 weeks.
  const totalWeeks = 54;
  const extraPadding = 5;

  const cellSize = isMobile ? 12 : 14;
  const availableWidth = width - leftMargin - extraPadding;
  const colsPerRow = Math.max(
    1,
    Math.floor(availableWidth / (cellSize + cellGap)),
  );

  const actualCols = Math.min(colsPerRow, totalWeeks);
  const minSvgWidth = leftMargin + actualCols * (cellSize + cellGap) +
    extraPadding;
  const svgWidth = Math.max(width, minSvgWidth);

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const dates = runs.map((r: Run) => new Date(r.eventDate));
    const minYear = d3.min(dates, (d: Date) => d.getFullYear()) ??
      new Date().getFullYear();
    const maxYear = d3.max(dates, (d: Date) => d.getFullYear()) ??
      new Date().getFullYear();
    const years = d3.range(minYear, maxYear + 1);

    const runsByWeek = new Map<string, Run[]>();
    for (const run of runs) {
      const weekStart = d3.timeSunday.floor(new Date(run.eventDate));
      const weekKey = d3.timeFormat("%Y-%W")(weekStart);
      const existing = runsByWeek.get(weekKey) ?? [];
      existing.push(run);
      runsByWeek.set(weekKey, existing);
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", svgWidth);

    const tooltip = createTooltip(colors);

    const g = svg
      .append("g")
      .attr("transform", `translate(${leftMargin}, ${topMargin})`);

    const colorScale = d3
      .scaleLinear<string>()
      .domain([1, 2, 3])
      .range(["#69db7c", "#40c057", "#2f9e44"])
      .clamp(true);

    const firstRunWeek = d3.timeSunday.floor(
      new Date(runs[runs.length - 1].eventDate),
    ).getTime();
    const currentWeek = d3.timeSunday.floor(new Date()).getTime();

    const refYear = maxYear;
    const refFirstDay = new Date(refYear, 0, 1);
    const refLastDay = new Date(refYear, 11, 31);
    const refWeeks = d3.timeWeeks(
      d3.timeSunday.floor(refFirstDay),
      d3.timeSunday.ceil(refLastDay),
    );
    const months = d3.timeMonths(refFirstDay, refLastDay);

    // Only show month labels if we are not wrapping
    if (colsPerRow >= totalWeeks) {
      for (const month of months) {
        const weekIndex = refWeeks.findIndex(
          (w: Date) =>
            w.getTime() <= month.getTime() &&
            d3.timeWeek.offset(w, 1).getTime() > month.getTime(),
        );
        if (weekIndex >= 0) {
          g.append("text")
            .attr("x", weekIndex * (cellSize + cellGap))
            .attr("y", -8)
            .attr("font-size", "10px")
            .attr("fill", colors.axis)
            .text(d3.timeFormat("%b")(month));
        }
      }
    }

    const getWeekYear = (weekStart: Date): number => {
      const thursday = d3.timeDay.offset(weekStart, 4);
      return thursday.getFullYear();
    };

    let currentY = 0;

    years.forEach((year: number) => {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      const weeks = d3.timeWeeks(
        d3.timeSunday.floor(d3.timeDay.offset(firstDay, -6)),
        d3.timeSunday.ceil(d3.timeDay.offset(lastDay, 6)),
      );

      const weekData: WeekData[] = weeks
        .filter((week: Date) => getWeekYear(week) === year)
        .map((week: Date) => {
          const weekKey = d3.timeFormat("%Y-%W")(week);
          const weekRuns = runsByWeek.get(weekKey) ?? [];
          return { week, runs: weekRuns, count: weekRuns.length };
        });

      g.append("text")
        .attr("x", -8)
        .attr("y", currentY + cellSize / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .attr("fill", colors.axis)
        .attr("text-anchor", "end")
        .text(year);

      weekData.forEach((wd: WeekData, wi: number) => {
        const col = wi % colsPerRow;
        const subRow = Math.floor(wi / colsPerRow);

        const weekTime = wd.week.getTime();
        let fill = "";

        if (wd.count > 0) {
          fill = colorScale(wd.count);
        } else {
          if (weekTime < firstRunWeek || weekTime >= currentWeek) {
            fill = colors.inactive; // gray
          } else {
            fill = colors.skipped;
          }
        }

        const rect = g
          .append("rect")
          .attr("x", col * (cellSize + cellGap))
          .attr("y", currentY + subRow * (cellSize + cellGap))
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("rx", 2)
          .attr("fill", fill)
          .attr("stroke", colors.background)
          .attr("stroke-width", 1);

        if (wd.count > 0) {
          rect
            .on("mouseover", (event: MouseEvent) => {
              const weekEnd = d3.timeDay.offset(wd.week, 6);
              const dateRange = `${d3.timeFormat("%b %d")(wd.week)} — ${
                d3.timeFormat("%b %d")(weekEnd)
              }`;
              const runLines = wd.runs.map((r: Run) => {
                const date = d3.timeFormat("%b %d")(new Date(r.eventDate));
                return {
                  text: `${date}: ${r.eventName} ${
                    formatTime(r.finishTimeSeconds)
                  }`,
                };
              });
              showTooltip(tooltip, event, [
                { text: dateRange, bold: true },
                ...runLines,
              ]);
            })
            .on("mouseout", () => hideTooltip(tooltip));
        }
      });

      const totalSubRows = Math.ceil(weekData.length / colsPerRow);
      currentY += totalSubRows * (cellSize + cellGap) + (isMobile ? 12 : 18);
    });

    svg.attr("height", topMargin + currentY);

    return () => {
      tooltip.remove();
    };
  }, [runs, colors]);

  return (
    <svg
      ref={svgRef}
      width={svgWidth}
      style={{ overflow: "visible" }}
      role="img"
      aria-label="Calendar heatmap showing weekly parkrun consistency by year"
    />
  );
}
