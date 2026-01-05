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

export function PBProgressionChart({ runs, width = 600, height = 300 }: Props) {
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

    let bestSoFar = Infinity;
    const pbProgression = sortedRuns
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
      .filter((d): d is { date: Date; time: number; run: Run } => d !== null);

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

    const minTime = d3.min(pbProgression, (d) => d.time) ?? 0;
    const maxTime = d3.max(pbProgression, (d) => d.time) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([minTime - 30, maxTime + 30])
      .range([innerHeight, 0]);

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

    const stepLine = d3
      .line<{ date: Date; time: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.time))
      .curve(d3.curveStepAfter);

    g.append("path")
      .datum(pbProgression)
      .attr("fill", "none")
      .attr("stroke", "#40c057")
      .attr("stroke-width", 2)
      .attr("d", stepLine);

    g.selectAll(".pb-point")
      .data(pbProgression)
      .enter()
      .append("circle")
      .attr("class", "pb-point")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.time))
      .attr("r", 5)
      .attr("fill", "#40c057");

    const tooltip = createTooltip();

    g.selectAll(".pb-point")
      .on("mouseover", (event: MouseEvent, d: unknown) => {
        const data = d as { date: Date; time: number; run: Run };
        tooltip
          .style("opacity", 1)
          .html(
            `${data.date.toLocaleDateString()}<br/>
            <strong>${data.run.eventName}</strong><br/>
            Time: ${formatTime(data.time)}`,
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
