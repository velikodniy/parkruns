import eventsJson from "./events.json" with { type: "json" };
import type { EventFeature, EventsData, LatLng } from "./types.ts";
import { numericToISO } from "./countries.ts";

const data = eventsJson as unknown as EventsData;

const eventById = new Map<number, EventFeature>(
  data.events.features.map((f) => [f.id, f]),
);

const eventByLongName = new Map<string, EventFeature>(
  data.events.features.map((
    f,
  ) => [f.properties.EventLongName.toLowerCase(), f]),
);

const eventISO = new Map<number, string>();
for (const event of data.events.features) {
  const iso = numericToISO(event.properties.countrycode);
  if (iso) eventISO.set(event.id, iso);
}

export function getEventById(id: number): EventFeature | undefined {
  return eventById.get(id);
}

export function getEventShortName(id: number): string | null {
  return eventById.get(id)?.properties.EventShortName ?? null;
}

export function getShortNameByLongName(longName: string): string | null {
  return eventByLongName.get(longName.toLowerCase())?.properties
    .EventShortName ?? null;
}

export function getEventCoordinates(id: number): LatLng | null {
  const event = eventById.get(id);
  if (!event) return null;
  const [longitude, latitude] = event.geometry.coordinates;
  return [latitude, longitude];
}

export function getEventCountryISO(id: number): string | null {
  return eventISO.get(id) ?? null;
}

export function getAllEvents(): EventFeature[] {
  return data.events.features;
}

function getEventBaseUrl(id: number): string | null {
  const event = eventById.get(id);
  if (!event) return null;
  const countryUrl = data.countries[event.properties.countrycode]?.url;
  if (!countryUrl) return null;
  return `https://${countryUrl}/${event.properties.eventname}`;
}

export function getEventUrl(id: number): string | null {
  const base = getEventBaseUrl(id);
  return base ? `${base}/` : null;
}

export function getEventResultsUrl(
  id: number,
  edition: number,
): string | null {
  const base = getEventBaseUrl(id);
  return base ? `${base}/results/${edition}/` : null;
}
