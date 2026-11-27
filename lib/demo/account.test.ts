import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { DEMO_HOLDINGS, DEMO_WATCHLIST, demoPassword } from "./constants";

let replSet: MongoMemoryReplSet;
let demo: typeof import("./account");
let executeTrade: typeof import("@/lib/services/trade.service").executeTrade;

const price = { getPrice: async () => 100 };
const db = () => mongoose.connection.db!;

async function newUser() {
  const { insertedId } = await db().collection("user").insertOne({ email: `d-${Math.random()}@example.test`, name: "D" });
  return insertedId.toString();
}
const oid = (id: string) => new mongoose.Types.ObjectId(id);
const balanceOf = async (id: string) => (await db().collection("user").findOne({ _id: oid(id) }))?.balance;
const tradesOf = (id: string) => db().collection("transactions").countDocuments({ userId: oid(id) });
const watchlistOf = async (id: string) =>
  (await db().collection("watchlists").find({ userId: id }).toArray()).map((w) => w.symbol).sort();

const seedCost = DEMO_HOLDINGS.reduce((sum, h) => sum + h.quantity * 100, 0);

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("stocklens-demo");
  demo = await import("./account");
  ({ executeTrade } = await import("@/lib/services/trade.service"));
  const { connectToDatabase } = await import("@/database/mongoose");
  await connectToDatabase();
  for (const name of ["transactions", "watchlists"]) await db().createCollection(name).catch(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

describe("demoPassword", () => {
  it("is derived from the auth secret, so no extra secret is needed", () => {
    expect(demoPassword("secret-a")).toBe(demoPassword("secret-a"));
    expect(demoPassword("secret-a")).not.toBe(demoPassword("secret-b"));
    expect(demoPassword("secret-a").length).toBeGreaterThanOrEqual(32);
  });
});

describe("seedDemoPortfolio", () => {
  it("buys the starting holdings and fills the watchlist", async () => {
    const userId = await newUser();
    expect(await demo.seedDemoPortfolio(userId, price)).toEqual({ seeded: true });

    expect(await tradesOf(userId)).toBe(DEMO_HOLDINGS.length);
    expect(await balanceOf(userId)).toBe(100_000 - seedCost);
    expect(await watchlistOf(userId)).toEqual(DEMO_WATCHLIST.map((w) => w.symbol).sort());
  });

  it("seeds exactly once when two first visitors arrive together", async () => {
    const userId = await newUser();
    await Promise.all([demo.seedDemoPortfolio(userId, price), demo.seedDemoPortfolio(userId, price)]);
    expect(await tradesOf(userId)).toBe(DEMO_HOLDINGS.length);
    expect(await balanceOf(userId)).toBe(100_000 - seedCost);
  });

  it("does nothing once the account is seeded", async () => {
    const userId = await newUser();
    await demo.seedDemoPortfolio(userId, price);
    expect(await demo.seedDemoPortfolio(userId, price)).toEqual({ seeded: false });
    expect(await tradesOf(userId)).toBe(DEMO_HOLDINGS.length);
  });
});

describe("resetDemoAccount", () => {
  it("removes visitors' trades and watchlist edits but keeps the seed holdings", async () => {
    const userId = await newUser();
    await demo.seedDemoPortfolio(userId, price);
    await executeTrade(userId, { symbol: "TSLA", type: "BUY", quantity: 50 }, price);
    await executeTrade(userId, { symbol: "AAPL", type: "SELL", quantity: 10 }, price);
    await db().collection("watchlists").deleteMany({ userId });

    expect(await demo.resetDemoAccount(userId)).toEqual({ removedTrades: 2 });

    expect(await tradesOf(userId)).toBe(DEMO_HOLDINGS.length);
    expect(await balanceOf(userId)).toBe(100_000 - seedCost);
    expect(await watchlistOf(userId)).toEqual(DEMO_WATCHLIST.map((w) => w.symbol).sort());
  });
});
