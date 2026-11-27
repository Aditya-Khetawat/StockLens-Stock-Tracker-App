import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let server: MongoMemoryServer;
let checkRateLimit: typeof import("./rate-limit").checkRateLimit;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri("stocklens-ratelimit");
  ({ checkRateLimit } = await import("./rate-limit"));
});

afterAll(async () => {
  await mongoose.disconnect();
  await server?.stop();
});

const rule = { limit: 3, windowSeconds: 60 };
const t0 = Date.UTC(2026, 0, 1, 12, 0, 0);

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks with a retry hint", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await checkRateLimit("trade:u1", rule, t0 + 10_000));

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBe(50);
  });

  it("counts keys independently", async () => {
    await checkRateLimit("trade:u2", rule, t0);
    await checkRateLimit("trade:u2", rule, t0);
    await checkRateLimit("trade:u2", rule, t0);
    expect((await checkRateLimit("trade:u3", rule, t0)).allowed).toBe(true);
  });

  it("starts a fresh budget in the next window", async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit("trade:u4", rule, t0);
    expect((await checkRateLimit("trade:u4", rule, t0)).allowed).toBe(false);
    expect((await checkRateLimit("trade:u4", rule, t0 + 60_000)).allowed).toBe(true);
  });

  it("stays exact under concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => checkRateLimit("burst:u5", { limit: 5, windowSeconds: 60 }, t0)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });
});
