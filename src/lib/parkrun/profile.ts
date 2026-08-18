import {
  type Athlete,
  type Profile,
  ProfileSchema,
  type Run,
  type Weather,
} from "../../types.ts";
import {
  contextualizeRuns,
  type EventContextResolver,
} from "./event-context.ts";
import { enrichRuns } from "./enrich.ts";
import type { LngLat } from "./types.ts";
import type { WeatherRun } from "./weather.ts";

export interface BuildProfileDependencies {
  athlete: Athlete;
  runs: readonly Run[];
  eventCountries: readonly string[];
  resolveEventContext: EventContextResolver;
  getShortNameByLongName(longName: string): string | null;
  fetchWeather(
    runs: readonly WeatherRun[],
  ): Promise<ReadonlyMap<string, Weather>>;
  resolveRegions(
    coordinates: readonly LngLat[],
  ): Promise<ReadonlyMap<string, string>>;
  now(): Date;
  log?(message: string): void;
  warn?(message: string): void;
}

function capitalize(value: string): string {
  return value.toLowerCase().replace(
    /\b\w/g,
    (character) => character.toUpperCase(),
  );
}

export async function buildProfile(
  dependencies: BuildProfileDependencies,
): Promise<Profile> {
  const contextualRuns = contextualizeRuns(
    dependencies.runs,
    dependencies.resolveEventContext,
  );

  const weatherRuns = contextualRuns.flatMap(({ run, event }) => {
    if (event.coordinates === null) return [];
    return [{
      eventDate: run.eventDate,
      coordinates: event.coordinates,
    }];
  });
  const omittedWeatherRuns = contextualRuns.length - weatherRuns.length;
  if (omittedWeatherRuns > 0) {
    dependencies.warn?.(
      `Skipping weather for ${omittedWeatherRuns} runs with no event coordinates`,
    );
  }

  dependencies.log?.("Fetching weather data...");
  const weather = await dependencies.fetchWeather(weatherRuns);

  const ukCoordinates = contextualRuns.flatMap(({ event }) =>
    event.countryISO === "gb" && event.regionCoordinates
      ? [event.regionCoordinates]
      : []
  );
  dependencies.log?.("Resolving regions...");
  const regions = await dependencies.resolveRegions(ukCoordinates);

  const runs = enrichRuns(contextualRuns, { weather, regions });
  const { athlete } = dependencies;

  return ProfileSchema.parse({
    schemaVersion: 1,
    generatedAt: dependencies.now().toISOString(),
    eventCountries: [...dependencies.eventCountries],
    athlete: {
      id: athlete.id,
      fullName: `${capitalize(athlete.firstName)} ${
        capitalize(athlete.lastName)
      }`,
      clubName: athlete.clubName,
      homeRun: athlete.homeRun,
      homeRunShortName: athlete.homeRun
        ? dependencies.getShortNameByLongName(athlete.homeRun)
        : null,
    },
    runs,
  });
}
