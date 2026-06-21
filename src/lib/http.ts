/**
 * Small fetch wrapper adding a per-attempt timeout and bounded retries with
 * exponential backoff. The data download talks to two external, occasionally
 * flaky services (the unofficial parkrun API and Open-Meteo); without this a
 * single transient 5xx or a hung socket fails the whole run.
 */

export interface RetryOptions {
  /** Number of retries after the first attempt (default 3 → up to 4 tries). */
  retries?: number;
  /** Per-attempt timeout in ms (default 30s; 0 disables the timeout). */
  timeoutMs?: number;
  /** Base backoff in ms; doubles each attempt (default 500). */
  baseDelayMs?: number;
  /** Cap on a single backoff wait (default 8s). */
  maxDelayMs?: number;
  /** Injectable fetch, for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Called before each retry with the attempt index and the reason. */
  onRetry?: (attempt: number, reason: string) => void;
}

/** Retry on rate-limiting and server errors; client errors are caller bugs. */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Exponential backoff: base * 2^attempt, capped at maxDelayMs. */
export function retryDelayMs(
  attempt: number,
  baseDelayMs = 500,
  maxDelayMs = 8000,
): number {
  return Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Like fetch, but retries transient failures (network errors, timeouts, 429,
 * 5xx) with backoff. Non-retryable responses (incl. 4xx) are returned as-is for
 * the caller to handle. Throws the last error only after retries are exhausted.
 */
export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const {
    retries = 3,
    timeoutMs = 30_000,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    fetchImpl = fetch,
    onRetry,
  } = options;

  for (let attempt = 0;; attempt++) {
    try {
      const signal = timeoutMs > 0
        ? AbortSignal.timeout(timeoutMs)
        : init.signal;
      const response = await fetchImpl(input, { ...init, signal });

      if (isRetryableStatus(response.status) && attempt < retries) {
        onRetry?.(attempt, `status ${response.status}`);
        await delay(retryDelayMs(attempt, baseDelayMs, maxDelayMs));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < retries) {
        onRetry?.(attempt, reason(error));
        await delay(retryDelayMs(attempt, baseDelayMs, maxDelayMs));
        continue;
      }
      throw error;
    }
  }
}
