import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

// Transactions need a replica set, exactly like MongoDB Atlas.
let replSet: MongoMemoryReplSet;
let executeTrade: typeof import("./trade.service").executeTrade;

const fixedPrice = (price: number | null) => ({
  getPrice: async () => price,
});

async function createUser(): Promise<string> {
  // Better Auth inserts users without our balance fields.
  const { insertedId } = await mongoose.connection
    .db!.collection("user")
    .insertOne({ email: `t-${Date.now()}-${Math.random()}@example.test`, name: "T" });
  return insertedId.toString();
}

async function balanceOf(userId: string): Promise<number> {
  const user = await mongoose.connection
    .db!.collection("user")
    .findOne({ _id: new mongoose.Types.ObjectId(userId) });
  return user?.balance;
}

async function transactionCount(userId: string): Promise<number> {
  return mongoose.connection.db!.collection("transactions").countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
  });
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("stocklens-test");
  ({ executeTrade } = await import("./trade.service"));
  const { connectToDatabase } = await import("@/database/mongoose");
  await connectToDatabase();
  // Create collections up front: they cannot be created inside a transaction under contention.
  await mongoose.connection.db!.createCollection("transactions").catch(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

describe("executeTrade", () => {
  let userId: string;
  beforeEach(async () => {
    userId = await createUser();
  });

  it("buys at the server price and stores cent-rounded amounts", async () => {
    const result = await executeTrade(
      userId,
      { symbol: "AAPL", type: "BUY", quantity: 3 },
      fixedPrice(355.583),
    );

    expect(result).toMatchObject({
      success: true,
      // Price is rounded to the cent first, then multiplied: 3 x 355.58.
      data: { symbol: "AAPL", quantity: 3, price: 355.58, totalAmount: 1066.74, newBalance: 98933.26 },
    });
    expect(await balanceOf(userId)).toBe(98933.26);
  });

  it("rejects a buy larger than the cash balance without changing anything", async () => {
    const result = await executeTrade(
      userId,
      { symbol: "AAPL", type: "BUY", quantity: 1000 },
      fixedPrice(200),
    );

    expect(result).toEqual({ success: false, error: "Insufficient balance." });
    expect(await transactionCount(userId)).toBe(0);
  });

  it("rejects selling more shares than the user holds", async () => {
    await executeTrade(userId, { symbol: "MSFT", type: "BUY", quantity: 2 }, fixedPrice(100));

    const result = await executeTrade(
      userId,
      { symbol: "MSFT", type: "SELL", quantity: 3 },
      fixedPrice(100),
    );

    expect(result).toEqual({ success: false, error: "Insufficient holdings." });
  });

  it("fails cleanly when no price is available", async () => {
    const result = await executeTrade(
      userId,
      { symbol: "NOPE", type: "BUY", quantity: 1 },
      fixedPrice(null),
    );

    expect(result).toEqual({ success: false, error: "Price unavailable for this symbol." });
  });

  it("does not leak internal error details", async () => {
    const result = await executeTrade(
      userId,
      { symbol: "AAPL", type: "BUY", quantity: 1 },
      { getPrice: async () => { throw new Error("connect ECONNREFUSED 10.0.0.5:443"); } },
    );

    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/);
  });

  it("completes concurrent orders for one user by retrying write conflicts", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        executeTrade(userId, { symbol: "AAPL", type: "BUY", quantity: 1 }, fixedPrice(100)),
      ),
    );

    expect(results.every((r) => r.success)).toBe(true);
    expect(await balanceOf(userId)).toBe(99500);
    expect(await transactionCount(userId)).toBe(5);
  });
});
