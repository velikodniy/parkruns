import type { Athlete, Run } from "../../types.ts";
import { eventDateToISOString } from "../../event-date.ts";
import { fetchWithRetry } from "../http.ts";
import { z } from "zod";

export type AccessToken = string;

/**
 * DISCLAIMER: This module uses the unofficial parkrun API.
 *
 * The API credentials are reverse-engineered from the official parkrun mobile app.
 * This project is NOT affiliated with, endorsed by, or connected to parkrun Limited.
 * Use at your own risk and responsibility.
 *
 * The credentials are loaded from environment variables to avoid exposing them
 * in the source code. They are required only during the data download phase
 * (CI/CD or local development), not in the browser runtime.
 */
const API_BASE = "https://api.parkrun.com";
const USER_AGENT = "parkrun/1.2.7 CFNetwork/1121.2.2 Darwin/19.3.0";

function getClientCredentials(): { user: string; pass: string } {
  return {
    user: Deno.env.get("PARKRUN_CLIENT_ID") ?? "",
    pass: Deno.env.get("PARKRUN_CLIENT_SECRET") ?? "",
  };
}

const PositiveIntegerStringSchema = z.string().refine((value) => {
  if (!/^\d+$/.test(value)) return false;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
});

const NonNegativeNumberStringSchema = z.string().refine((value) =>
  /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value))
);

const EventDateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, value.length) === value;
});

const FinishTimeSchema = z.string()
  .regex(/^\d{1,2}:[0-5]\d(?::[0-5]\d)?$/)
  .refine((value) => value.split(":").some((part) => Number(part) > 0));

const AuthResponseSchema = z.object({
  access_token: z.string().min(1),
});

const AthleteResponseSchema = z.object({
  data: z.object({
    Athletes: z.array(z.object({
      AthleteID: PositiveIntegerStringSchema,
      FirstName: z.string(),
      LastName: z.string(),
      ClubName: z.string().nullish(),
      HomeRunName: z.string().nullish(),
    })).min(1),
  }),
});

const RunResultResponseSchema = z.object({
  AgeCategory: z.string().min(1),
  AgeGrading: NonNegativeNumberStringSchema,
  EventDate: EventDateSchema,
  EventLongName: z.string().min(1),
  EventNumber: PositiveIntegerStringSchema,
  FinishPosition: PositiveIntegerStringSchema,
  FirstTimer: z.enum(["0", "1"]),
  GenderPosition: PositiveIntegerStringSchema,
  RunTime: FinishTimeSchema,
  WasPbRun: z.enum(["0", "1"]),
  abstractId: PositiveIntegerStringSchema,
});

const ResultsResponseSchema = z.object({
  data: z.object({
    // The API omits this field, or returns null, after the final page.
    Results: z.array(RunResultResponseSchema).nullish(),
  }),
});

type RunResultResponse = z.infer<typeof RunResultResponseSchema>;

function parseResponse<T>(
  schema: z.ZodType<T>,
  json: unknown,
  errorMessage: string,
): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    // Athlete responses can contain PII, so never include the payload or Zod's
    // value-bearing diagnostics in errors that may be written to CI logs.
    throw new Error(errorMessage);
  }
  return result.data;
}

export function parseAuthenticationResponse(json: unknown): AccessToken {
  return parseResponse(
    AuthResponseSchema,
    json,
    "Unexpected authentication response",
  ).access_token;
}

export function parseAthleteResponse(json: unknown): Athlete {
  const data = parseResponse(
    AthleteResponseSchema,
    json,
    "Unexpected athlete response",
  ).data.Athletes[0];

  return {
    id: Number(data.AthleteID),
    firstName: data.FirstName,
    lastName: data.LastName,
    clubName: data.ClubName || null,
    homeRun: data.HomeRunName || null,
  };
}

export function parseResultsResponse(json: unknown): RunResultResponse[] {
  return parseResponse(
    ResultsResponseSchema,
    json,
    "Unexpected runs response",
  ).data.Results ?? [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error(`Unexpected run summary: invalid ${field}`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Unexpected run summary: invalid ${field}`);
  }
  return parsed;
}

export function parseRunStatsResponse(json: unknown): Map<string, number> {
  if (
    !isRecord(json) || !isRecord(json.data) ||
    !Array.isArray(json.data.Runs)
  ) {
    throw new Error("Unexpected run summary response: missing data.Runs");
  }

  const stats = new Map<string, number>();
  for (const value of json.data.Runs) {
    if (!isRecord(value)) {
      throw new Error("Unexpected run summary: expected an object");
    }

    const eventId = parsePositiveInteger(value.EventNumber, "EventNumber");
    const edition = parsePositiveInteger(value.abstractId, "abstractId");
    const finishers = parsePositiveInteger(
      value.NumberRunners,
      "NumberRunners",
    );
    stats.set(`${eventId}-${edition}`, finishers);
  }
  return stats;
}

export function requireTotalFinishers(
  stats: Map<string, number>,
  key: string,
): number {
  const total = stats.get(key);
  if (total === undefined) {
    throw new Error(`Missing run summary for event ${key}`);
  }
  return total;
}

function parseTimeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

async function apiRequest(
  path: string,
  options: {
    params?: Record<string, string>;
    auth?: { user: string; pass: string };
    method?: string;
    body?: string;
    contentType?: string;
  },
): Promise<Response> {
  const url = new URL(path, API_BASE);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
  };

  if (options.auth) {
    headers.Authorization = `Basic ${
      btoa(`${options.auth.user}:${options.auth.pass}`)
    }`;
  }

  if (options.contentType) {
    headers["Content-Type"] = options.contentType;
  }

  const response = await fetchWithRetry(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  }, {
    onRetry: (attempt, why) =>
      console.warn(`Retrying ${path} (attempt ${attempt + 1}): ${why}`),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export async function authenticate(
  athleteId: string,
  password: string,
  credentials = getClientCredentials(),
): Promise<AccessToken> {
  const params = new URLSearchParams({
    username: athleteId,
    password: password,
    scope: "app",
    grant_type: "password",
  });

  const response = await apiRequest("/user_auth.php", {
    method: "POST",
    auth: credentials,
    body: params.toString(),
    contentType: "application/x-www-form-urlencoded",
  });

  return parseAuthenticationResponse(await response.json());
}

export async function getAthlete(
  accessToken: AccessToken,
  athleteId: number,
): Promise<Athlete> {
  const response = await apiRequest(`/v1/athletes/${athleteId}`, {
    params: {
      access_token: accessToken,
      scope: "app",
      expandedDetails: "true",
    },
  });

  return parseAthleteResponse(await response.json());
}

async function getRunStats(
  accessToken: AccessToken,
  athleteId: number,
): Promise<Map<string, number>> {
  const response = await apiRequest(`/v1/athletes/${athleteId}/runs`, {
    params: {
      access_token: accessToken,
      scope: "app",
    },
  });

  return parseRunStatsResponse(await response.json());
}

export async function getRuns(
  accessToken: AccessToken,
  athleteId: number,
): Promise<Run[]> {
  const runStats = await getRunStats(accessToken, athleteId);

  const allRuns: Run[] = [];
  let offset = 0;
  const limit = 100;
  // Safety valve: if the API ever ignored `offset` it would page forever. No
  // athlete has anywhere near 100k runs, so this only ever trips on a bug.
  const maxPages = 1000;

  for (let page = 0; page < maxPages; page++) {
    const response = await apiRequest("/v1/results", {
      params: {
        access_token: accessToken,
        scope: "app",
        expandedDetails: "true",
        athleteId: athleteId.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
      },
    });

    // Fail loud on malformed envelopes or rows rather than treating them as
    // the end of pagination and silently truncating the run history.
    const results = parseResultsResponse(await response.json());

    if (results.length === 0) break;

    for (const r of results) {
      const statsKey = `${r.EventNumber}-${r.abstractId}`;
      const totalFinishers = requireTotalFinishers(runStats, statsKey);
      allRuns.push({
        eventName: r.EventLongName,
        eventId: Number.parseInt(r.EventNumber),
        eventEdition: Number.parseInt(r.abstractId),
        eventDate: eventDateToISOString(r.EventDate),
        finishTime: r.RunTime,
        finishTimeSeconds: parseTimeToSeconds(r.RunTime),
        position: Number.parseInt(r.FinishPosition),
        totalFinishers,
        genderPosition: Number.parseInt(r.GenderPosition),
        ageGrade: Number.parseFloat(r.AgeGrading) * 100,
        ageCategory: r.AgeCategory,
        wasPb: r.WasPbRun === "1",
        wasFirstVisit: r.FirstTimer === "1",
      });
    }

    if (results.length < limit) break;
    offset += limit;
  }

  return allRuns;
}
