import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { Watchlist } from "@/database/models/watchlist.model";
import { roundMoney } from "@/lib/trading/money";
import { DEMO_HOLDINGS, DEMO_WATCHLIST } from "./constants";

const STARTING_BALANCE = 100_000;

type PriceSource = { getPrice: (symbol: string) => Promise<number | null> };

async function resetWatchlist(userId: string, session: mongoose.ClientSession) {
  await Watchlist.deleteMany({ userId }, { session });
  await Watchlist.insertMany(
    DEMO_WATCHLIST.map((w) => ({ userId, symbol: w.symbol, company: w.company })),
    { session },
  );
}

/** Balance after the permanent seed buys: the state every reset returns to. */
async function seededBalance(userObjectId: mongoose.Types.ObjectId, session: mongoose.ClientSession) {
  const seeds = await Transaction.find({ userId: userObjectId, seed: true }, { totalAmount: 1 })
    .session(session)
    .lean();
  return roundMoney(STARTING_BALANCE - seeds.reduce((sum, t) => sum + t.totalAmount, 0));
}

/**
 * Give the demo account its starting holdings and watchlist, once.
 * Returns { seeded: false } if it already has them.
 */
export async function seedDemoPortfolio(userId: string, prices: PriceSource) {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  if (await Transaction.exists({ userId: userObjectId, seed: true })) return { seeded: false };

  const quotes = await Promise.all(DEMO_HOLDINGS.map((h) => prices.getPrice(h.symbol).catch(() => null)));

  let seeded = false;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Claim the account first. Concurrent seeders write the same document,
      // so all but one conflict, retry, and then find the claim already taken.
      const claim = await mongoose.connection.db!
        .collection("user")
        .updateOne({ _id: userObjectId, demoSeeded: { $ne: true } }, { $set: { demoSeeded: true } }, { session });
      seeded = claim.modifiedCount === 1;
      if (!seeded) return;

      await Transaction.insertMany(
        DEMO_HOLDINGS.flatMap((h, i) => {
          const price = quotes[i];
          if (!price) return []; // skip a symbol Finnhub cannot price right now
          const rounded = roundMoney(price);
          return [{
            userId: userObjectId, symbol: h.symbol, type: "BUY", quantity: h.quantity,
            price: rounded, totalAmount: roundMoney(rounded * h.quantity), seed: true,
          }];
        }),
        { session },
      );
      await User.updateOne(
        { _id: userObjectId },
        { $set: { balance: await seededBalance(userObjectId, session), startingBalance: STARTING_BALANCE } },
        { session },
      );
      await resetWatchlist(userId, session);
    });
  } finally {
    await session.endSession();
  }
  return { seeded };
}

/** Undo visitors' activity: drop non-seed trades, restore cash and watchlist. */
export async function resetDemoAccount(userId: string) {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  let removedTrades = 0;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const removed = await Transaction.deleteMany(
        { userId: userObjectId, seed: { $ne: true } },
        { session },
      );
      removedTrades = removed.deletedCount;
      await User.updateOne(
        { _id: userObjectId },
        { $set: { balance: await seededBalance(userObjectId, session) } },
        { session },
      );
      await resetWatchlist(userId, session);
    });
  } finally {
    await session.endSession();
  }
  return { removedTrades };
}
