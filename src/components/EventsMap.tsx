import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Run } from "../types.ts";
import { getEventById } from "../lib/parkrun/index.ts";

const defaultIcon = new L.Icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface EventsMapProps {
  runs: Run[];
  height?: number;
}

interface VisitedEvent {
  id: number;
  name: string;
  coordinates: [number, number]; // [lat, lon] for Leaflet
  visitCount: number;
}

function FitBounds({ events }: { events: VisitedEvent[] }) {
  const map = useMap();

  useEffect(() => {
    if (events.length === 0) return;

    const bounds = L.latLngBounds(events.map((e) => e.coordinates));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [events, map]);

  return null;
}

export function EventsMap({ runs, height = 400 }: EventsMapProps) {
  const events = useMemo(() => {
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
          coordinates: [lat, lon], // Leaflet uses [lat, lon]
          visitCount: 1,
        });
      }
    }

    return Array.from(visitedEvents.values());
  }, [runs]);

  if (events.length === 0) {
    return null;
  }

  // Default center (will be overridden by FitBounds)
  const defaultCenter: [number, number] = events[0]?.coordinates ?? [51.5, -0.1];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={10}
      scrollWheelZoom={true}
      style={{ height, width: "100%", borderRadius: 8 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds events={events} />
      {events.map((event) => (
        <Marker key={event.id} position={event.coordinates}>
          <Popup>
            <strong>{event.name}</strong>
            <br />
            Visits: {event.visitCount}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
