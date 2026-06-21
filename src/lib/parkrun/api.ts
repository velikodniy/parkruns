import type { Athlete, Run } from "../../types.ts";
import { fetchWithRetry } from "../http.ts";

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
const CLIENT_ID = Deno.env.get("PARKRUN_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("PARKRUN_CLIENT_SECRET") ?? "";
const USER_AGENT = "parkrun/1.2.7 CFNetwork/1121.2.2 Darwin/19.3.0";

interface AuthResponse {
  access_token: string;
}

interface AthleteResponse {
  AthleteID: string;
  FirstName: string;
  LastName: string;
  ClubName: string;
  HomeRunID: string;
  HomeRunLocation: string;
  HomeRunName: string;
}

interface RunResultResponse {
  AgeCategory: string;
  AgeGrading: string;
  AthleteID: string;
  EventDate: string;
  EventLongName: string;
  EventNumber: string;
  FinishPosition: string;
  FirstTimer: "0" | "1";
  GenderPosition: string;
  RunTime: string;
  WasPbRun: "0" | "1";
  abstractId: string;
}

interface RunSummaryResponse {
  EventNumber: string;
  EventDate: string;
  NumberRunners: string;
  abstractId: string;
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
): Promise<AccessToken> {
  const params = new URLSearchParams({
    username: athleteId,
    password: password,
    scope: "app",
    grant_type: "password",
  });

  const response = await apiRequest("/user_auth.php", {
    method: "POST",
    auth: { user: CLIENT_ID, pass: CLIENT_SECRET },
    body: params.toString(),
    contentType: "application/x-www-form-urlencoded",
  });

  const data: AuthResponse = await response.json();
  return data.access_token;
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

  const json = await response.json();
  const athletes = json?.data?.Athletes;
  if (!Array.isArray(athletes) || athletes.length === 0) {
    throw new Error("Unexpected athlete response: missing data.Athletes");
  }
  const data: AthleteResponse = athletes[0];

  return {
    id: Number.parseInt(data.AthleteID),
    firstName: data.FirstName,
    lastName: data.LastName,
    clubName: data.ClubName || null,
    homeRun: data.HomeRunName || null,
  };
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

  const json = await response.json();
  const runs: RunSummaryResponse[] = json?.data?.Runs ?? [];

  const statsMap = new Map<string, number>();
  for (const r of runs) {
    const key = `${r.EventNumber}-${r.abstractId}`;
    statsMap.set(key, Number.parseInt(r.NumberRunners));
  }
  return statsMap;
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

    const json = await response.json();
    // Fail loud on a malformed envelope (e.g. a 200 with an error body) rather
    // than letting a missing `data` look like the end of pagination and
    // silently truncate the run history. An empty/absent Results array is the
    // normal end-of-pages signal.
    if (!json?.data) {
      throw new Error("Unexpected runs response: missing data");
    }
    const results: RunResultResponse[] = json.data.Results ?? [];

    if (results.length === 0) break;

    for (const r of results) {
      const statsKey = `${r.EventNumber}-${r.abstractId}`;
      allRuns.push({
        eventName: r.EventLongName,
        eventId: Number.parseInt(r.EventNumber),
        eventEdition: Number.parseInt(r.abstractId),
        eventDate: new Date(r.EventDate).toISOString(),
        finishTime: r.RunTime,
        finishTimeSeconds: parseTimeToSeconds(r.RunTime),
        position: Number.parseInt(r.FinishPosition),
        totalFinishers: runStats.get(statsKey) ??
          Number.parseInt(r.FinishPosition),
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
