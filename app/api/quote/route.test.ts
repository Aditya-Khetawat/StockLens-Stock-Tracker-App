import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  allowed: true,
  quote: { price: 190.12, changePercent: 1.5, stale: false, asOf: 0 } as unknown,
  fail: false,
}));

vi.mock("@/lib/better-auth/session", () => ({ getSessionUser: async () => state.user }));
vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { marketData: { limit: 1, windowSeconds: 60 } },
  checkRateLimit: async () => ({ allowed: state.allowed, retryAfterSeconds: 7 }),
}));
vi.mock("@/lib/finnhub/client", () => ({
  getQuote: async () => {
    if (state.fail) throw new Error("down");
    return state.quote;
  },
}));

const { GET } = await import("./route");
const call = (symbol: string) => GET(new Request(`http://test/api/quote?symbol=${encodeURIComponent(symbol)}`));

beforeEach(() => {
  state.user = { id: "u1" };
  state.allowed = true;
  state.quote = { price: 190.12, changePercent: 1.5, stale: false, asOf: 0 };
  state.fail = false;
});

describe("GET /api/quote", () => {
  it("returns the live price", async () => {
    const res = await call("aapl");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ symbol: "AAPL", price: 190.12, changePercent: 1.5 });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("requires a session", async () => {
    state.user = null;
    expect((await call("AAPL")).status).toBe(401);
  });

  it("is rate limited", async () => {
    state.allowed = false;
    const res = await call("AAPL");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
  });

  it("rejects malformed symbols", async () => {
    expect((await call("AAPL;DROP")).status).toBe(400);
    expect((await call("")).status).toBe(400);
  });

  it("reports unknown symbols as 404", async () => {
    state.quote = null;
    expect((await call("ZZZZ")).status).toBe(404);
  });

  it("never serves a stale price", async () => {
    state.quote = { price: 1, changePercent: null, stale: true, asOf: 0 };
    expect((await call("AAPL")).status).toBe(503);
  });

  it("reports an upstream outage as 503", async () => {
    state.fail = true;
    expect((await call("AAPL")).status).toBe(503);
  });
});
