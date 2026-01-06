import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Run } from "../types.ts";
import { formatTime } from "../format.ts";

interface Props {
  runs: Run[];
  width?: number;
  height?: number;
}

export function EventMixChart({ runs, width = 600, height = 400 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const margin = { top: 20, right: 80, bottom: 40, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const eventData = d3.rollups(
      runs,
      (v) => ({
        count: v.length,
        bestTime: d3.min(v, (d) => d.finishTimeSeconds) ?? 0,
        avgTime: d3.mean(v, (d) => d.finishTimeSeconds) ?? 0,
      }),
      (d) => d.eventName,
    );

    const sortedData = eventData
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.name))
      .range([0, innerHeight])
      .padding(0.2);

    const maxCount = d3.max(sortedData, (d) => d.count) ?? 0;
    const x = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);

    g.append("g").call(d3.axisLeft(y)).attr("color", "#888");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr("color", "#888");

    g.selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.name) ?? 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", (d) => x(d.count))
      .attr("fill", "#228be6")
      .attr("opacity", 0.8);

    g.selectAll(".count-label")
      .data(sortedData)
      .enter()
      .append("text")
      .attr("class", "count-label")
      .attr("y", (d) => (y(d.name) ?? 0) + y.bandwidth() / 2)
      .attr("x", (d) => x(d.count) + 5)
      .attr("dy", "0.35em")
      .attr("font-size", "11px")
      .attr("fill", "#c1c2c5")
      .text((d) => `${d.count} (${formatTime(d.bestTime)})`);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "#1a1b1e")
      .style("border", "1px solid #373a40")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("color", "#c1c2c5")
      .style("pointer-events", "none")
      .style("opacity", 0);

    g.selectAll(".bar")
      .on("mouseover", (event: MouseEvent, d: unknown) => {
        const data = d as {
          name: string;
          count: number;
          bestTime: number;
          avgTime: number;
        };
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${data.name}</strong><br/>
            Runs: ${data.count}<br/>
            Best: ${formatTime(data.bestTime)}<br/>
            Avg: ${formatTime(Math.round(data.avgTime))}`,
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
