import type { Run } from "../../types.ts";
import type { LatLng, LngLat } from "./types.ts";

export type EventContextInput = Pick<
  Run,
  "eventId" | "eventEdition" | "eventDate" | "eventName"
>;

export interface EventContext {
  coordinates: LatLng | null;
  regionCoordinates: LngLat | null;
  countryISO: string | null;
  displayName: string;
  eventUrl: string | null;
  resultsUrl: string | null;
  weatherHour: number | null;
}

export interface ContextualRun {
  run: Run;
  event: EventContext;
}

export type EventContextResolver = (input: EventContextInput) => EventContext;

export function contextualizeRuns(
  runs: readonly Run[],
  resolveEventContext: EventContextResolver,
): ContextualRun[] {
  return runs.map((run) => ({
    run,
    event: resolveEventContext(run),
  }));
}
