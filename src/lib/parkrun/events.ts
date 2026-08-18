import eventsJson from "./events.json" with { type: "json" };
import { type EventFeature, EventsDataSchema } from "./types.ts";
import type { EventContext, EventContextInput } from "./event-context.ts";
import { getCountryName, numericToISO } from "./countries.ts";

const data = EventsDataSchema.parse(eventsJson);

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

const eventCountryISOs = [...new Set(eventISO.values())].sort((a, b) =>
  (getCountryName(a) ?? a).localeCompare(getCountryName(b) ?? b)
);

export function getShortNameByLongName(longName: string): string | null {
  return eventByLongName.get(longName.toLowerCase())?.properties
    .EventShortName ?? null;
}

export function getAllEvents(): EventFeature[] {
  return data.events.features;
}

export function getAllEventCountryISOs(): string[] {
  return eventCountryISOs;
}

function getEventBaseUrl(event: EventFeature): string | null {
  const countryUrl = data.countries[event.properties.countrycode]?.url;
  if (!countryUrl) return null;
  return `https://${countryUrl}/${event.properties.eventname}`;
}

export function getRunEventContext(input: EventContextInput): EventContext {
  const event = eventById.get(input.eventId);
  if (!event) {
    return {
      coordinates: null,
      regionCoordinates: null,
      countryISO: null,
      displayName: input.eventName.replace(/ parkrun$/i, ""),
      eventUrl: null,
      resultsUrl: null,
    };
  }

  const [longitude, latitude] = event.geometry.coordinates;
  const baseUrl = getEventBaseUrl(event);

  return {
    coordinates: [latitude, longitude],
    regionCoordinates: event.geometry.coordinates,
    countryISO: eventISO.get(event.id) ?? null,
    displayName: event.properties.EventShortName,
    eventUrl: baseUrl ? `${baseUrl}/` : null,
    resultsUrl: baseUrl ? `${baseUrl}/results/${input.eventEdition}/` : null,
  };
}
