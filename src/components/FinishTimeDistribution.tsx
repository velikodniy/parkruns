import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Run } from "../types.ts";
import { formatTime } from "../format.ts";
import { createTooltip } from "../d3-utils.ts";

interface Props {
  runs: Run[];
  width?: number;
  height?: number;
}

interface MonthData {
  month: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

export function FinishTimeDistribution(
  { runs, width = 600, height = 300 }: Props,
) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const byMonth = d3.rollups(
      runs,
      (v: Run[]) => v.map((r) => r.finishTimeSeconds).sort((a, b) => a - b),
      (d: Run) => d3.timeFormat("%Y-%m")(new Date(d.eventDate)),
    );

    const monthlyData: MonthData[] = byMonth
      .map(([month, times]) => {
        if (times.length === 0) return null;
        const q1Index = Math.floor(times.length * 0.25);
        const medianIndex = Math.floor(times.length * 0.5);
        const q3Index = Math.floor(times.length * 0.75);
        return {
          month,
          min: times[0],
          q1: times[q1Index],
          median: times[medianIndex],
          q3: times[q3Index],
          max: times[times.length - 1],
          count: times.length,
        };
      })
      .filter((d): d is MonthData => d !== null)
      .sort((a, b) => a.month.localeCompare(b.month));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(monthlyData.map((d) => d.month))
      .range([0, innerWidth])
      .padding(0.3);

    const allTimes = runs.map((r) => r.finishTimeSeconds);
    const minTime = d3.min(allTimes) ?? 0;
    const maxTime = d3.max(allTimes) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([minTime - 30, maxTime + 30])
      .range([innerHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x).tickFormat((d: string) => {
          const [year, month] = d.split("-");
          return `${month}/${year.slice(2)}`;
        }),
      )
      .attr("color", "#888")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .call(
        d3.axisLeft(y).tickFormat((d: d3.NumberValue) =>
          formatTime(d as number)
        ),
      )
      .attr("color", "#888");

    const boxWidth = x.bandwidth();

    for (const d of monthlyData) {
      const xPos = x(d.month) ?? 0;
      const centerX = xPos + boxWidth / 2;
      const narrowWidth = boxWidth * 0.5;
      const narrowOffset = (boxWidth - narrowWidth) / 2;

      g.append("line")
        .attr("x1", centerX)
        .attr("x2", centerX)
        .attr("y1", y(d.min))
        .attr("y2", y(d.q1))
        .attr("stroke", "#4c6ef5")
        .attr("stroke-width", 1);

      g.append("line")
        .attr("x1", centerX)
        .attr("x2", centerX)
        .attr("y1", y(d.q3))
        .attr("y2", y(d.max))
        .attr("stroke", "#4c6ef5")
        .attr("stroke-width", 1);

      g.append("rect")
        .attr("x", xPos + narrowOffset)
        .attr("y", y(d.q3))
        .attr("width", narrowWidth)
        .attr("height", Math.abs(y(d.q1) - y(d.q3)))
        .attr("fill", "#364fc7")
        .attr("opacity", 0.8)
        .attr("stroke", "#4c6ef5")
        .attr("stroke-width", 1);

      g.append("line")
        .attr("x1", xPos + narrowOffset)
        .attr("x2", xPos + narrowOffset + narrowWidth)
        .attr("y1", y(d.median))
        .attr("y2", y(d.median))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
    }

    const tooltip = createTooltip();

    g.selectAll("rect")
      .on("mouseover", (event: MouseEvent) => {
        const target = event.target as SVGRectElement;
        const xVal = Number.parseFloat(target.getAttribute("x") ?? "0");
        const narrowOffset = boxWidth * 0.25;
        const monthData = monthlyData.find((d) =>
          Math.abs((x(d.month) ?? 0) + narrowOffset - xVal) < 1
        );
        if (monthData) {
          tooltip
            .style("opacity", 1)
            .html(
              `<strong>${monthData.month}</strong><br/>
              Runs: ${monthData.count}<br/>
              Best: ${formatTime(monthData.min)}<br/>
              Q1: ${formatTime(monthData.q1)}<br/>
              Median: ${formatTime(monthData.median)}<br/>
              Q3: ${formatTime(monthData.q3)}<br/>
              Worst: ${formatTime(monthData.max)}`,
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`);
        }
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [runs, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
