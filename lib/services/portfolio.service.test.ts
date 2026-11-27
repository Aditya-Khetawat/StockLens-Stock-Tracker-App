import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

vi.mock("@/lib/finnhub/client", () => ({
  getQuote: async () => ({ price: 100, changePercent: 0, change: 0, stale: false, asOf: Date.now() }),
}));

let replSet: MongoMemoryReplSet;
let svc: typeof import("./portfolio.service");
let executeTrade: typeof import("./trade.service").executeTrade;

const at = (price: number) => ({ getPrice: async () => price });

async function newUser() {
  const { insertedId } = await mongoose.connection
    .db!.collection("user")
    .insertOne({ email: `p-${Math.random()}@example.test`, name: "P" });
  return insertedId.toString();
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("stocklens-portfolio");
  svc = await import("./portfolio.service");
  ({ executeTrade } = await import("./trade.service"));
  const { connectToDatabase } = await import("@/database/mongoose");
  await connectToDatabase();
  await mongoose.connection.db!.createCollection("transactions").catch(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

describe("getHolding", () => {
  it("returns cash and the open position in one symbol", async () => {
    const userId = await newUser();
    await executeTrade(userId, { symbol: "AAPL", type: "BUY", quantity: 10 }, at(100));
    await executeTrade(userId, { symbol: "AAPL", type: "BUY", quantity: 10 }, at(200));
    await executeTrade(userId, { symbol: "AAPL", type: "SELL", quantity: 5 }, at(300));
    await executeTrade(userId, { symbol: "MSFT", type: "BUY", quantity: 1 }, at(50));

    expect(await svc.getHolding(userId, "aapl")).toEqual({
      cash: 100_000 - 1000 - 2000 + 1500 - 50,
      holding: { symbol: "AAPL", quantity: 15, avgCost: 150 },
    });
  });

  it("returns no holding for a symbol never traded or fully sold", async () => {
    const userId = await newUser();
    await executeTrade(userId, { symbol: "TSLA", type: "BUY", quantity: 2 }, at(10));
    await executeTrade(userId, { symbol: "TSLA", type: "SELL", quantity: 2 }, at(10));
    expect((await svc.getHolding(userId, "TSLA")).holding).toBeNull();
    expect((await svc.getHolding(userId, "NVDA")).holding).toBeNull();
  });
});
