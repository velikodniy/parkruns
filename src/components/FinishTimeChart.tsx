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

export function FinishTimeChart({ runs, width = 600, height = 300 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const sortedRuns = [...runs].sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const timeExtent = d3.extent(
      sortedRuns,
      (d: Run) => new Date(d.eventDate),
    ) as [Date, Date];
    const x = d3.scaleTime().domain(timeExtent).range([0, innerWidth]);

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

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6))
      .attr("color", "#888");

    g.append("g")
      .call(
        d3.axisLeft(y).tickFormat((d: d3.NumberValue) =>
          formatTime(d as number)
        ),
      )
      .attr("color", "#888");

    const line = d3
      .line<Run>()
      .x((d: Run) => x(new Date(d.eventDate)))
      .y((d: Run) => y(d.finishTimeSeconds));

    g.append("path")
      .datum(sortedRuns)
      .attr("fill", "none")
      .attr("stroke", "#228be6")
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
        .attr("stroke", "#fab005")
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
      .attr("fill", (d: Run) => (d.wasPB ? "#40c057" : "#228be6"));

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
      .attr("stroke", "#228be6")
      .attr("stroke-width", 1.5);
    legend.append("text").attr("x", 25).attr("y", 4).attr("font-size", "11px")
      .attr("fill", "#888").text("Finish time");

    legend
      .append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 15)
      .attr("y2", 15)
      .attr("stroke", "#fab005")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
    legend.append("text").attr("x", 25).attr("y", 19).attr("font-size", "11px")
      .attr("fill", "#888").text("7-run average");

    legend
      .append("circle")
      .attr("cx", 10)
      .attr("cy", 30)
      .attr("r", 5)
      .attr("fill", "#40c057");
    legend.append("text").attr("x", 25).attr("y", 34).attr("font-size", "11px")
      .attr("fill", "#888").text("PB");

    const tooltip = createTooltip();

    g.selectAll(".point")
      .on("mouseover", (event: MouseEvent, d: unknown) => {
        const run = d as Run;
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${run.eventName}</strong><br/>
            ${new Date(run.eventDate).toLocaleDateString()}<br/>
            Time: ${run.finishTime}${run.wasPB ? " (PB!)" : ""}`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
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
