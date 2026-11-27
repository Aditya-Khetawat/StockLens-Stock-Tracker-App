import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const quotes: Record<string, { price: number; change: number; changePercent: number } | null> = {
  AAPL: { price: 200, change: 2, changePercent: 1 },
  TSLA: { price: 300, change: -18, changePercent: -6 },
  NVDA: { price: 100, change: 3, changePercent: 3 },
  ZZZZ: null,
};
vi.mock("@/lib/finnhub/client", () => ({
  getQuote: async (symbol: string) => {
    if (symbol === "FAIL") throw new Error("down");
    return quotes[symbol] ? { ...quotes[symbol], stale: false, asOf: 0 } : null;
  },
}));

let mongo: MongoMemoryServer;
let getWatchlistMovers: typeof import("./dashboard.service").getWatchlistMovers;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("stocklens-dashboard");
  ({ getWatchlistMovers } = await import("./dashboard.service"));
  const { connectToDatabase } = await import("@/database/mongoose");
  await connectToDatabase();
  await mongoose.connection.db!.collection("watchlists").insertMany(
    ["AAPL", "TSLA", "NVDA", "ZZZZ", "FAIL"].map((symbol) => ({
      userId: "u1", symbol, company: `${symbol} Inc`, addedAt: new Date(),
    })),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe("getWatchlistMovers", () => {
  it("lists the watchlist's biggest moves first, skipping unpriced symbols", async () => {
    expect(await getWatchlistMovers("u1", 2)).toEqual([
      { symbol: "TSLA", company: "TSLA Inc", price: 300, change: -18, changePercent: -6 },
      { symbol: "NVDA", company: "NVDA Inc", price: 100, change: 3, changePercent: 3 },
    ]);
  });

  it("is empty for an empty watchlist", async () => {
    expect(await getWatchlistMovers("nobody", 5)).toEqual([]);
  });
});
