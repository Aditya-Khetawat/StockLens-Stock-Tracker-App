import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;
let getTransactionHistory: typeof import("./transactions").getTransactionHistory;

const userA = new mongoose.Types.ObjectId();
const userB = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("stocklens-history");
  ({ getTransactionHistory } = await import("./transactions"));
  const { connectToDatabase } = await import("@/database/mongoose");
  await connectToDatabase();

  const base = Date.UTC(2026, 0, 1);
  await mongoose.connection.db!.collection("transactions").insertMany([
    ...Array.from({ length: 25 }, (_, i) => ({
      userId: userA,
      symbol: i % 2 ? "AAPL" : "MSFT",
      type: i % 3 ? "BUY" : "SELL",
      quantity: i + 1,
      price: 10,
      totalAmount: (i + 1) * 10,
      createdAt: new Date(base + i * 60_000),
    })),
    { userId: userB, symbol: "TSLA", type: "BUY", quantity: 1, price: 1, totalAmount: 1, createdAt: new Date(base) },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe("getTransactionHistory", () => {
  it("returns the newest trades first, one page at a time", async () => {
    const page1 = await getTransactionHistory(userA.toString(), { page: 1, pageSize: 10 });
    expect(page1.total).toBe(25);
    expect(page1.pageCount).toBe(3);
    expect(page1.items).toHaveLength(10);
    expect(page1.items[0].quantity).toBe(25);
    expect(page1.items[9].quantity).toBe(16);

    const page3 = await getTransactionHistory(userA.toString(), { page: 3, pageSize: 10 });
    expect(page3.items.map((t) => t.quantity)).toEqual([5, 4, 3, 2, 1]);
  });

  it("returns plain serialisable rows", async () => {
    const { items } = await getTransactionHistory(userA.toString(), { page: 1, pageSize: 1 });
    expect(items[0]).toEqual({
      id: expect.any(String),
      symbol: "MSFT",
      type: "SELL",
      quantity: 25,
      price: 10,
      totalAmount: 250,
      createdAt: expect.any(String),
    });
  });

  it("only ever shows the user's own trades", async () => {
    const { items, total } = await getTransactionHistory(userB.toString(), { page: 1, pageSize: 10 });
    expect(total).toBe(1);
    expect(items[0].symbol).toBe("TSLA");
  });

  it("clamps out-of-range and malformed pages", async () => {
    expect((await getTransactionHistory(userA.toString(), { page: 99, pageSize: 10 })).page).toBe(3);
    expect((await getTransactionHistory(userA.toString(), { page: -4, pageSize: 10 })).page).toBe(1);
    expect((await getTransactionHistory(userA.toString(), { page: Number.NaN, pageSize: 10 })).page).toBe(1);
  });

  it("handles a user with no trades", async () => {
    const empty = await getTransactionHistory(new mongoose.Types.ObjectId().toString(), { page: 1, pageSize: 10 });
    expect(empty).toEqual({ items: [], total: 0, page: 1, pageCount: 1 });
  });
});
