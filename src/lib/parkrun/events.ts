import eventsJson from "./events.json" with { type: "json" };
import type { EventsData, EventFeature } from "./types.ts";
import { getCountryISO } from "./countries.ts";

const data = eventsJson as unknown as EventsData;

const eventById = new Map<number, EventFeature>(
  data.events.features.map((f) => [f.id, f]),
);

export function getEventById(id: number): EventFeature | undefined {
  return eventById.get(id);
}

export function getEventShortName(id: number): string | null {
  return eventById.get(id)?.properties.EventShortName ?? null;
}

export function getEventCoordinates(id: number): [number, number] | null {
  const event = eventById.get(id);
  if (!event) return null;
  const [lon, lat] = event.geometry.coordinates;
  return [lat, lon];
}

export function getEventCountryCode(id: number): number | null {
  return eventById.get(id)?.properties.countrycode ?? null;
}

export function getEventCountryISO(id: number): string | null {
  const countryCode = getEventCountryCode(id);
  if (countryCode === null) return null;
  return getCountryISO(countryCode);
}

export function getAllEvents(): EventFeature[] {
  return data.events.features;
}
