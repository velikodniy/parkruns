import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Run } from "../types.ts";
import { formatTime } from "../format.ts";
import { createTooltip, hideTooltip, showTooltip } from "../d3-utils.ts";
import { getChartColors } from "../theme.ts";

interface Props {
  runs: Run[];
  width?: number;
  height?: number;
}

export function EventMixChart({ runs, width = 600, height = 400 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const colors = getChartColors();
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

    g.append("g").call(d3.axisLeft(y)).attr("color", colors.axis);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr("color", colors.axis);

    g.selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.name) ?? 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", (d) => x(d.count))
      .attr("fill", colors.primary)
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
      .attr("fill", colors.text)
      .text((d) => `${d.count} (${formatTime(d.bestTime)})`);

    const tooltip = createTooltip();

    g.selectAll(".bar")
      .on("mouseover", (event: MouseEvent, d: unknown) => {
        const data = d as {
          name: string;
          count: number;
          bestTime: number;
          avgTime: number;
        };
        showTooltip(tooltip, event, [
          { text: data.name, bold: true },
          { text: `Runs: ${data.count}` },
          { text: `Best: ${formatTime(data.bestTime)}` },
          { text: `Avg: ${formatTime(Math.round(data.avgTime))}` },
        ]);
      })
      .on("mouseout", () => hideTooltip(tooltip));

    return () => {
      tooltip.remove();
    };
  }, [runs, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
