import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

// Finnhub is the only external dependency; everything else runs for real.
const prices: Record<string, number | null> = {};
vi.mock("@/lib/finnhub/client", () => ({
  getQuote: async (symbol: string) =>
    prices[symbol] == null ? null : { price: prices[symbol], changePercent: 0 },
  getCompanyProfile: async () => null,
}));

let replSet: MongoMemoryReplSet;
let svc: typeof import("./equitySnapshot.service");
let executeTrade: typeof import("./trade.service").executeTrade;

async function newUser() {
  const { insertedId } = await mongoose.connection
    .db!.collection("user")
    .insertOne({ email: `s-${Math.random()}@example.test`, name: "S" });
  return insertedId.toString();
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("stocklens-snapshots");
  svc = await import("./equitySnapshot.service");
  ({ executeTrade } = await import("./trade.service"));
  const { connectToDatabase } = await import("@/database/mongoose");
  await connectToDatabase();
  await mongoose.connection.db!.createCollection("transactions").catch(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

describe("recordEquitySnapshot", () => {
  it("values holdings at the current market price, not the trade price", async () => {
    const userId = await newUser();
    await executeTrade(userId, { symbol: "AAPL", type: "BUY", quantity: 10 }, { getPrice: async () => 100 });

    prices.AAPL = 130; // market moved after the trade
    expect(await svc.recordEquitySnapshot(userId, "2026-03-02")).toEqual({ recorded: true });

    expect(await svc.getEquitySnapshots(userId)).toEqual([{ date: "2026-03-02", equity: 100_300 }]);
  });

  it("overwrites the same day instead of duplicating it", async () => {
    const userId = await newUser();
    await executeTrade(userId, { symbol: "AAPL", type: "BUY", quantity: 1 }, { getPrice: async () => 100 });

    prices.AAPL = 110;
    await svc.recordEquitySnapshot(userId, "2026-03-03");
    prices.AAPL = 120;
    await svc.recordEquitySnapshot(userId, "2026-03-03");

    expect(await svc.getEquitySnapshots(userId)).toEqual([{ date: "2026-03-03", equity: 100_020 }]);
  });

  it("skips the day rather than store a value missing a holding", async () => {
    const userId = await newUser();
    await executeTrade(userId, { symbol: "TSLA", type: "BUY", quantity: 1 }, { getPrice: async () => 200 });

    prices.TSLA = null;
    const result = await svc.recordEquitySnapshot(userId, "2026-03-04");

    expect(result.recorded).toBe(false);
    expect(await svc.getEquitySnapshots(userId)).toEqual([]);
  });

  it("lists only users who have traded", async () => {
    const trader = await newUser();
    const idle = await newUser();
    await executeTrade(trader, { symbol: "AAPL", type: "BUY", quantity: 1 }, { getPrice: async () => 100 });

    const ids = await svc.getTradingUserIds();
    expect(ids).toContain(trader);
    expect(ids).not.toContain(idle);
  });
});
