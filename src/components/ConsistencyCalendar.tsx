import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Run } from "../types.ts";
import { createTooltip } from "../d3-utils.ts";

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

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const dates = runs.map((r) => new Date(r.eventDate));
    const minYear = d3.min(dates, (d: Date) => d.getFullYear()) ??
      new Date().getFullYear();
    const maxYear = d3.max(dates, (d: Date) => d.getFullYear()) ??
      new Date().getFullYear();
    const years = d3.range(minYear, maxYear + 1);

    const cellSize = 14;
    const cellGap = 2;
    const rowHeight = cellSize + 8;
    const leftMargin = 45;
    const topMargin = 25;
    const height = topMargin + years.length * rowHeight + 10;

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
    svg.attr("height", height);

    const tooltip = createTooltip();

    const g = svg.append("g").attr(
      "transform",
      `translate(${leftMargin}, ${topMargin})`,
    );

    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 1, 2, 3])
      .range(["#2c2e33", "#2f9e44", "#37b24d", "#40c057"])
      .clamp(true);

    const refYear = maxYear;
    const refFirstDay = new Date(refYear, 0, 1);
    const refLastDay = new Date(refYear, 11, 31);
    const refWeeks = d3.timeWeeks(
      d3.timeSunday.floor(refFirstDay),
      d3.timeSunday.ceil(refLastDay),
    );
    const months = d3.timeMonths(refFirstDay, refLastDay);

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
          .attr("fill", "#888")
          .text(d3.timeFormat("%b")(month));
      }
    }

    years.forEach((year: number, rowIndex: number) => {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      const weeks = d3.timeWeeks(
        d3.timeSunday.floor(firstDay),
        d3.timeSunday.ceil(lastDay),
      );

      const weekData: WeekData[] = weeks
        .filter((week: Date) =>
          week.getFullYear() === year ||
          d3.timeDay.offset(week, 6).getFullYear() === year
        )
        .map((week: Date) => {
          const weekKey = d3.timeFormat("%Y-%W")(week);
          const weekRuns = runsByWeek.get(weekKey) ?? [];
          return { week, runs: weekRuns, count: weekRuns.length };
        });

      g.append("text")
        .attr("x", -8)
        .attr("y", rowIndex * rowHeight + cellSize / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .attr("fill", "#888")
        .attr("text-anchor", "end")
        .text(year);

      weekData.forEach((wd, wi) => {
        const rect = g
          .append("rect")
          .attr("x", wi * (cellSize + cellGap))
          .attr("y", rowIndex * rowHeight)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("rx", 2)
          .attr("fill", colorScale(wd.count))
          .attr("stroke", "#1a1b1e")
          .attr("stroke-width", 1);

        if (wd.count > 0) {
          rect
            .on("mouseover", (event: MouseEvent) => {
              const weekEnd = d3.timeDay.offset(wd.week, 6);
              const dateRange = `${d3.timeFormat("%b %d")(wd.week)} - ${
                d3.timeFormat("%b %d")(weekEnd)
              }`;
              const runsList = wd.runs
                .map((r) => `${r.eventName} (${r.finishTime})`)
                .join("<br/>");
              tooltip
                .style("opacity", 1)
                .html(
                  `<strong>Week of ${dateRange}, ${year}</strong><br/>
                  ${wd.count} run${wd.count > 1 ? "s" : ""}<br/>
                  <br/>
                  ${runsList}`,
                )
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", () => {
              tooltip.style("opacity", 0);
            });
        }
      });
    });

    return () => {
      tooltip.remove();
    };
  }, [runs, width]);

  return <svg ref={svgRef} width={width} style={{ overflow: "visible" }} />;
}
