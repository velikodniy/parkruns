import { assertEquals, assertThrows } from "@std/assert";
import {
  parseAthleteResponse,
  parseAuthenticationResponse,
  parseResultsResponse,
  parseRunStatsResponse,
  requireTotalFinishers,
} from "./api.ts";

function runResult(overrides: Record<string, unknown> = {}) {
  return {
    AgeCategory: "VM40-44",
    AgeGrading: "0.7134",
    AthleteID: "private-athlete-id",
    EventDate: "2026-08-15",
    EventLongName: "Example parkrun",
    EventNumber: "12",
    FinishPosition: "23",
    FirstTimer: "0",
    GenderPosition: "18",
    RunTime: "00:22:24",
    WasPbRun: "1",
    abstractId: "678",
    ...overrides,
  };
}

Deno.test("parseAuthenticationResponse returns a validated token", () => {
  assertEquals(
    parseAuthenticationResponse({
      access_token: "token-value",
      expires_in: 7200,
    }),
    "token-value",
  );
});

Deno.test("parseAuthenticationResponse uses a generic validation error", () => {
  const error = assertThrows(
    () =>
      parseAuthenticationResponse({
        access_token: null,
        error_description: "private authentication details",
      }),
    Error,
  );

  assertEquals(error.message, "Unexpected authentication response");
});

Deno.test("parseAthleteResponse maps nullable and optional profile fields", () => {
  assertEquals(
    parseAthleteResponse({
      data: {
        Athletes: [{
          AthleteID: "123456",
          FirstName: "Ada",
          LastName: "Lovelace",
          ClubName: null,
          // The expanded endpoint includes fields that must not be retained.
          eMailID: "private@example.com",
          Postcode: "PRIVATE",
        }],
      },
    }),
    {
      id: 123456,
      firstName: "Ada",
      lastName: "Lovelace",
      clubName: null,
      homeRun: null,
    },
  );
});

Deno.test("parseAthleteResponse does not expose PII in validation errors", () => {
  const error = assertThrows(
    () =>
      parseAthleteResponse({
        data: {
          Athletes: [{
            AthleteID: "invalid",
            FirstName: "Private",
            LastName: "Person",
            eMailID: "private@example.com",
          }],
        },
      }),
    Error,
  );

  assertEquals(error.message, "Unexpected athlete response");
});

Deno.test("parseResultsResponse validates date-only run results", () => {
  assertEquals(
    parseResultsResponse({ data: { Results: [runResult()] } }),
    [{
      AgeCategory: "VM40-44",
      AgeGrading: "0.7134",
      EventDate: "2026-08-15",
      EventLongName: "Example parkrun",
      EventNumber: "12",
      FinishPosition: "23",
      FirstTimer: "0",
      GenderPosition: "18",
      RunTime: "00:22:24",
      WasPbRun: "1",
      abstractId: "678",
    }],
  );
});

Deno.test("parseResultsResponse accepts omitted or null final pages", () => {
  assertEquals(parseResultsResponse({ data: {} }), []);
  assertEquals(parseResultsResponse({ data: { Results: null } }), []);
});

Deno.test("parseResultsResponse rejects malformed rows generically", () => {
  for (
    const malformed of [
      runResult({ EventDate: "2026-08-15T00:00:00Z" }),
      runResult({ EventDate: "2026-02-30" }),
      runResult({ EventNumber: "12invalid" }),
      runResult({ FirstTimer: true }),
      runResult({ RunTime: "not a time" }),
    ]
  ) {
    const error = assertThrows(
      () => parseResultsResponse({ data: { Results: [malformed] } }),
      Error,
    );
    assertEquals(error.message, "Unexpected runs response");
  }
});

Deno.test("parseRunStatsResponse validates and indexes run summaries", () => {
  const stats = parseRunStatsResponse({
    data: {
      Runs: [{
        EventNumber: "12",
        EventDate: "2026-08-15",
        NumberRunners: "345",
        abstractId: "678",
      }],
    },
  });

  assertEquals(stats, new Map([["12-678", 345]]));
});

Deno.test("parseRunStatsResponse rejects a missing Runs array", () => {
  assertThrows(
    () => parseRunStatsResponse({ data: {} }),
    Error,
    "missing data.Runs",
  );
});

Deno.test("parseRunStatsResponse rejects invalid finisher totals", () => {
  assertThrows(
    () =>
      parseRunStatsResponse({
        data: {
          Runs: [{
            EventNumber: "12",
            EventDate: "2026-08-15",
            NumberRunners: "unknown",
            abstractId: "678",
          }],
        },
      }),
    Error,
    "invalid NumberRunners",
  );
});

Deno.test("requireTotalFinishers rejects a missing run summary", () => {
  assertThrows(
    () => requireTotalFinishers(new Map(), "12-678"),
    Error,
    "Missing run summary for event 12-678",
  );
});
