import eventsJson from "./events.json" with { type: "json" };
import { type EventFeature, EventsDataSchema, type LatLng } from "./types.ts";
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

// Open-Meteo exposes hourly observations, so half-hour starts use the
// observation from the beginning of that hour. Event ids are explicit because
// even countries with a standard start time can have local exceptions.
const nineOClockWeatherEvents = new Set([
  1,
  2,
  4,
  24,
  53,
  56,
  72,
  75,
  107,
  126,
  183,
  191,
  218,
  230,
  302,
  343,
  389,
  390,
  392,
  468,
  581,
  620,
  674,
  682,
  882,
  1395,
  1712,
  1882,
  2073,
  2205,
  2259,
  2619,
  2926,
  2968,
  3082,
  3272,
  3557,
  3614,
  3801,
  3837,
]);

type WeatherHourRule = number | ((eventDate: string) => number);

function getMonth(eventDate: string): number {
  return Number(eventDate.slice(5, 7));
}

function northernSummerHour(eventDate: string): number {
  const month = getMonth(eventDate);
  return month >= 5 && month <= 9 ? 8 : 9;
}

function southernSummerHour(eventDate: string): number {
  const month = getMonth(eventDate);
  return month >= 10 || month <= 3 ? 7 : 8;
}

function isNewZealandDaylightSaving(eventDate: string): boolean {
  const [year, month, day] = eventDate.slice(0, 10).split("-").map(Number);
  if (![year, month, day].every(Number.isInteger)) return false;

  // New Zealand daylight saving ends on the first Sunday in April and starts
  // on the last Sunday in September.
  const firstSundayInApril = 1 +
    (7 - new Date(Date.UTC(year, 3, 1)).getUTCDay()) % 7;
  const septemberLastDay = new Date(Date.UTC(year, 9, 0));
  const lastSundayInSeptember = 30 - septemberLastDay.getUTCDay();

  return month < 4 || month > 9 ||
    (month === 4 && day < firstSundayInApril) ||
    (month === 9 && day >= lastSundayInSeptember);
}

const eventWeatherHours: Readonly<Record<number, WeatherHourRule>> = {
  336: 8, // Delta
  434: 7, // South Bank
  471: 7, // Darwin
  1819: (eventDate) => isNewZealandDaylightSaving(eventDate) ? 8 : 9,
  2237: southernSummerHour, // Louis Trichardt
  3718: northernSummerHour, // Brooklyn Bridge
  3745: northernSummerHour, // Budapest Park
};

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

export function getEventWeatherHour(
  id: number,
  eventDate: string,
): number | null {
  const rule = eventWeatherHours[id];
  if (typeof rule === "number") return rule;
  if (rule) return rule(eventDate);
  if (nineOClockWeatherEvents.has(id)) return 9;

  // Unknown schedules deliberately omit weather rather than attach an
  // observation from the wrong hour.
  return null;
}

export function getAllEvents(): EventFeature[] {
  return data.events.features;
}

export function getAllEventCountryISOs(): string[] {
  return eventCountryISOs;
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
