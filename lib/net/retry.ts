/** An HTTP failure from an upstream API, carrying its status code. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Rate limits, server errors and network failures are worth retrying. */
export function isTransient(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 429 || error.status >= 500;
  return error instanceof TypeError; // fetch rejects with TypeError on network failure
}

/**
 * Run `op`, retrying transient failures with exponential backoff and jitter.
 * `retries` is the number of extra attempts after the first.
 */
export async function withRetry<T>(
  op: () => Promise<T>,
  { retries = 2, baseDelayMs = 300 }: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await op();
    } catch (error) {
      if (attempt >= retries || !isTransient(error)) throw error;
      const delay = baseDelayMs * 2 ** attempt * (0.5 + Math.random() / 2);
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
