import { assertEquals, assertRejects } from "@std/assert";
import { fetchWithRetry, isRetryableStatus, retryDelayMs } from "./http.ts";

// Fast, deterministic retry options for tests: no timer, no backoff wait.
const FAST = { timeoutMs: 0, baseDelayMs: 0 } as const;

Deno.test("isRetryableStatus - retries on 429 and 5xx only", () => {
  assertEquals(isRetryableStatus(429), true);
  assertEquals(isRetryableStatus(500), true);
  assertEquals(isRetryableStatus(503), true);
  assertEquals(isRetryableStatus(200), false);
  assertEquals(isRetryableStatus(400), false);
  assertEquals(isRetryableStatus(404), false);
});

Deno.test("retryDelayMs - doubles each attempt and caps at maxDelay", () => {
  assertEquals(retryDelayMs(0, 500, 8000), 500);
  assertEquals(retryDelayMs(1, 500, 8000), 1000);
  assertEquals(retryDelayMs(2, 500, 8000), 2000);
  assertEquals(retryDelayMs(5, 500, 8000), 8000); // 16000 capped to 8000
});

Deno.test("fetchWithRetry - returns immediately on success without retrying", async () => {
  let calls = 0;
  const res = await fetchWithRetry("https://x.test", {}, {
    ...FAST,
    fetchImpl: () => {
      calls++;
      return Promise.resolve(new Response("ok", { status: 200 }));
    },
  });
  assertEquals(calls, 1);
  assertEquals(res.status, 200);
});

Deno.test("fetchWithRetry - retries 5xx then succeeds", async () => {
  let calls = 0;
  const res = await fetchWithRetry("https://x.test", {}, {
    ...FAST,
    retries: 3,
    fetchImpl: () => {
      calls++;
      const status = calls < 3 ? 503 : 200;
      return Promise.resolve(new Response("", { status }));
    },
  });
  assertEquals(calls, 3); // 503, 503, 200
  assertEquals(res.status, 200);
});

Deno.test("fetchWithRetry - does not retry a 404", async () => {
  let calls = 0;
  const res = await fetchWithRetry("https://x.test", {}, {
    ...FAST,
    fetchImpl: () => {
      calls++;
      return Promise.resolve(new Response("nope", { status: 404 }));
    },
  });
  assertEquals(calls, 1);
  assertEquals(res.status, 404);
});

Deno.test("fetchWithRetry - returns the last response when retries are exhausted", async () => {
  let calls = 0;
  const res = await fetchWithRetry("https://x.test", {}, {
    ...FAST,
    retries: 2,
    fetchImpl: () => {
      calls++;
      return Promise.resolve(new Response("", { status: 503 }));
    },
  });
  assertEquals(calls, 3); // initial + 2 retries
  assertEquals(res.status, 503);
});

Deno.test("fetchWithRetry - retries network errors then succeeds", async () => {
  let calls = 0;
  const res = await fetchWithRetry("https://x.test", {}, {
    ...FAST,
    retries: 3,
    fetchImpl: () => {
      calls++;
      if (calls < 2) return Promise.reject(new TypeError("network down"));
      return Promise.resolve(new Response("", { status: 200 }));
    },
  });
  assertEquals(calls, 2);
  assertEquals(res.status, 200);
});

Deno.test("fetchWithRetry - rethrows after exhausting retries on persistent errors", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      fetchWithRetry("https://x.test", {}, {
        ...FAST,
        retries: 2,
        fetchImpl: () => {
          calls++;
          return Promise.reject(new TypeError("network down"));
        },
      }),
    TypeError,
    "network down",
  );
  assertEquals(calls, 3); // initial + 2 retries
});

Deno.test("fetchWithRetry - reports each retry through onRetry", async () => {
  const reasons: string[] = [];
  let calls = 0;
  await fetchWithRetry("https://x.test", {}, {
    ...FAST,
    retries: 3,
    onRetry: (_attempt, why) => reasons.push(why),
    fetchImpl: () => {
      calls++;
      const status = calls < 3 ? 500 : 200;
      return Promise.resolve(new Response("", { status }));
    },
  });
  assertEquals(reasons, ["status 500", "status 500"]);
});
