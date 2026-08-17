import { z } from "zod";

/** GeoJSON coordinate order per RFC 7946 */
export type LngLat = [longitude: number, latitude: number];
/** Map/API coordinate order (Leaflet, Open-Meteo, Nominatim) */
export type LatLng = [latitude: number, longitude: number];

export interface PointGeometry {
  type: "Point";
  coordinates: LngLat;
}

export interface EventProperties {
  eventname: string;
  EventLongName: string;
  EventShortName: string;
  LocalisedEventLongName: string | null;
  countrycode: number;
  seriesid: number;
  EventLocation: string;
}

export interface EventFeature {
  id: number;
  type: "Feature";
  geometry: PointGeometry;
  properties: EventProperties;
}

export interface CountryInfo {
  url: string | null;
  bounds: [number, number, number, number];
}

export interface EventsData {
  countries: Record<string, CountryInfo>;
  events: {
    type: "FeatureCollection";
    features: EventFeature[];
  };
}

const PointGeometrySchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number().finite(), z.number().finite()]),
});

const EventPropertiesSchema = z.object({
  eventname: z.string().min(1),
  EventLongName: z.string().min(1),
  EventShortName: z.string().min(1),
  LocalisedEventLongName: z.string().nullable(),
  countrycode: z.number().int(),
  seriesid: z.number().int(),
  EventLocation: z.string(),
});

const EventFeatureSchema = z.object({
  id: z.number().int().positive(),
  type: z.literal("Feature"),
  geometry: PointGeometrySchema,
  properties: EventPropertiesSchema,
});

export const EventsDataSchema = z.object({
  countries: z.record(
    z.string(),
    z.object({
      url: z.string().nullable(),
      bounds: z.tuple([
        z.number().finite(),
        z.number().finite(),
        z.number().finite(),
        z.number().finite(),
      ]),
    }),
  ).refine((countries) => Object.keys(countries).length > 0, {
    message: "At least one country is required",
  }),
  events: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(EventFeatureSchema).min(1),
  }),
}).superRefine((data, ctx) => {
  const eventIds = new Set<number>();
  for (const [index, event] of data.events.features.entries()) {
    if (eventIds.has(event.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate event id ${event.id}`,
        path: ["events", "features", index, "id"],
      });
    }
    eventIds.add(event.id);

    if (!(String(event.properties.countrycode) in data.countries)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unknown country code ${event.properties.countrycode}`,
        path: ["events", "features", index, "properties", "countrycode"],
      });
    }
  }
});

const MINIMUM_EVENT_RETENTION = 0.9;

export function validateEventsUpdate(
  currentValue: unknown,
  candidateValue: unknown,
): EventsData {
  const current = EventsDataSchema.parse(currentValue);
  const candidate = EventsDataSchema.parse(candidateValue);
  const minimumCount = Math.floor(
    current.events.features.length * MINIMUM_EVENT_RETENTION,
  );

  if (candidate.events.features.length < minimumCount) {
    throw new Error(
      `Candidate event data has ${candidate.events.features.length} events; expected at least ${minimumCount} based on the current ${current.events.features.length}`,
    );
  }

  return candidate;
}
