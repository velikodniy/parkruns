import { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Run } from "../types.ts";
import { getEventById } from "../../lib/parkrun/index.ts";
import worldData from "../../lib/geo/world-110m.json" with { type: "json" };
import { createTooltip, hideTooltip, showTooltip } from "../d3-utils.ts";

interface EventsMapProps {
  runs: Run[];
  width?: number;
  height?: number;
}

interface VisitedEvent {
  id: number;
  name: string;
  coordinates: [number, number];
  visitCount: number;
}

export function EventsMap({ runs, width = 800, height = 400 }: EventsMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || runs.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tooltip = createTooltip();

    const visitedEvents = new Map<number, VisitedEvent>();
    for (const run of runs) {
      const event = getEventById(run.eventId);
      if (!event) continue;

      const [lon, lat] = event.geometry.coordinates;
      const existing = visitedEvents.get(run.eventId);
      if (existing) {
        existing.visitCount++;
      } else {
        visitedEvents.set(run.eventId, {
          id: run.eventId,
          name: event.properties.EventShortName,
          coordinates: [lon, lat],
          visitCount: 1,
        });
      }
    }

    const events = Array.from(visitedEvents.values());
    if (events.length === 0) return;

    const lons = events.map((e) => e.coordinates[0]);
    const lats = events.map((e) => e.coordinates[1]);
    const padding = 2;
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lons) - padding, Math.min(...lats) - padding],
      [Math.max(...lons) + padding, Math.max(...lats) + padding],
    ];

    const projection = d3
      .geoMercator()
      .fitSize([width, height], {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [bounds[0][0], bounds[0][1]],
              [bounds[1][0], bounds[0][1]],
              [bounds[1][0], bounds[1][1]],
              [bounds[0][0], bounds[1][1]],
              [bounds[0][0], bounds[0][1]],
            ],
          ],
        },
        properties: {},
      });

    const path = d3.geoPath().projection(projection);

    const world = worldData as unknown as {
      type: string;
      objects: { countries: unknown };
    };
    const countries = topojson.feature(
      world as Parameters<typeof topojson.feature>[0],
      world.objects.countries as Parameters<typeof topojson.feature>[1],
    ) as unknown as { features: Array<{ geometry: unknown }> };

    svg
      .append("g")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("d", (d: { geometry: unknown }) => path(d.geometry as d3.GeoPermissibleObjects) ?? "")
      .attr("fill", "#e9ecef")
      .attr("stroke", "#dee2e6")
      .attr("stroke-width", 0.5);

    svg
      .append("g")
      .selectAll("circle")
      .data(events)
      .join("circle")
      .attr("cx", (d: VisitedEvent) => projection(d.coordinates)?.[0] ?? 0)
      .attr("cy", (d: VisitedEvent) => projection(d.coordinates)?.[1] ?? 0)
      .attr("r", (d: VisitedEvent) => Math.min(4 + d.visitCount, 10))
      .attr("fill", "#228be6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", (event: MouseEvent, d: VisitedEvent) => {
        showTooltip(
          tooltip,
          event,
          `<strong>${d.name}</strong><br/>Visits: ${d.visitCount}`,
        );
      })
      .on("mouseout", () => {
        hideTooltip(tooltip);
      });

    return () => {
      tooltip.remove();
    };
  }, [runs, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
