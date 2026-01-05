import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Run } from "../types.ts";
import { createTooltip } from "../d3-utils.ts";

interface Props {
  runs: Run[];
  width?: number;
  height?: number;
}

export function AgeGradeChart({ runs, width = 600, height = 300 }: Props) {
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
    const minAgeGrade = Math.min(40, d3.min(sortedRuns, (d: Run) => d.ageGrade) ?? 40);
    const y = d3.scaleLinear().domain([minAgeGrade - 5, 100]).range([innerHeight, 0]);

    const bands = [
      { y: 80, label: "80%", color: "#40c057" },
      { y: 70, label: "70%", color: "#fab005" },
      { y: 60, label: "60%", color: "#ff6b6b" },
    ];

    bands.forEach((band) => {
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
    });

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6))
      .attr("color", "#888");

    g.append("g")
      .call(d3.axisLeft(y).tickFormat((d: d3.NumberValue) => `${d}%`))
      .attr("color", "#888");

    const line = d3
      .line<Run>()
      .x((d: Run) => x(new Date(d.eventDate)))
      .y((d: Run) => y(d.ageGrade));

    g.append("path")
      .datum(sortedRuns)
      .attr("fill", "none")
      .attr("stroke", "#228be6")
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
      .attr("fill", "#228be6");

    const tooltip = createTooltip();

    g.selectAll(".point")
      .on("mouseover", (event: MouseEvent, d: unknown) => {
        const run = d as Run;
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${run.eventName}</strong><br/>
            ${new Date(run.eventDate).toLocaleDateString()}<br/>
            Age Grade: ${run.ageGrade.toFixed(1)}%<br/>
            Category: ${run.ageCategory}`,
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
