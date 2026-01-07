import type { Athlete, Run } from "../../types.ts";

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
  GenderPosition: string;
  RunId: string;
  RunTime: string;
  WasPbRun: "0" | "1";
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

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body,
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
  const data: AthleteResponse = json.data.Athletes[0];

  return {
    id: Number.parseInt(data.AthleteID),
    firstName: data.FirstName,
    lastName: data.LastName,
    clubName: data.ClubName || null,
    homeRun: data.HomeRunName || null,
  };
}

export async function getRuns(
  accessToken: AccessToken,
  athleteId: number,
): Promise<Run[]> {
  const allRuns: Run[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
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
    const results: RunResultResponse[] = json.data.Results;

    if (!results || results.length === 0) break;

    for (const r of results) {
      allRuns.push({
        eventName: r.EventLongName,
        eventId: Number.parseInt(r.EventNumber),
        eventDate: new Date(r.EventDate).toISOString(),
        finishTime: r.RunTime,
        finishTimeSeconds: parseTimeToSeconds(r.RunTime),
        position: Number.parseInt(r.FinishPosition),
        genderPosition: Number.parseInt(r.GenderPosition),
        ageGrade: Number.parseFloat(r.AgeGrading) * 100,
        ageCategory: r.AgeCategory,
        wasPB: r.WasPbRun === "1",
        runNumber: Number.parseInt(r.RunId),
      });
    }

    if (results.length < limit) break;
    offset += limit;
  }

  return allRuns;
}
