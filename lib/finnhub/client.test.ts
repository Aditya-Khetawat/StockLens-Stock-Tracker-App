import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Real client code against a stubbed fetch: Finnhub itself is the only fake.
let responses: Array<{ status: number; body?: unknown }>;
let calls: number;

beforeEach(() => {
  vi.resetModules();
  process.env.FINNHUB_API_KEY = "test-key";
  calls = 0;
  vi.stubGlobal("fetch", async () => {
    const r = responses[Math.min(calls++, responses.length - 1)];
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const load = () => import("./client");

describe("getQuote", () => {
  it("retries a transient Finnhub failure", async () => {
    responses = [{ status: 502 }, { status: 200, body: { c: 101.5, dp: 1.2 } }];
    const { getQuote } = await load();
    await expect(getQuote("AAPL")).resolves.toMatchObject({ price: 101.5, changePercent: 1.2, stale: false });
    expect(calls).toBe(2);
  });

  it("falls back to the last good price, marked stale, while Finnhub is down", async () => {
    const { getQuote } = await load();
    responses = [{ status: 200, body: { c: 100, dp: 0 } }];
    await getQuote("MSFT");

    responses = [{ status: 503 }];
    await expect(getQuote("MSFT")).resolves.toMatchObject({ price: 100, stale: true });
  });

  it("does not serve a fallback older than 15 minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { getQuote } = await load();
    responses = [{ status: 200, body: { c: 100, dp: 0 } }];
    await getQuote("TSLA");

    vi.setSystemTime(Date.now() + 16 * 60 * 1000);
    responses = [{ status: 503 }];
    await expect(getQuote("TSLA")).rejects.toThrow(/503/);
  });
});
