import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { EquitySnapshot } from "@/database/models/equitySnapshot.model";
import { Transaction } from "@/database/models/transaction.model";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { roundMoney } from "@/lib/trading/money";
import type { EquityPoint } from "@/lib/portfolio/metrics";

/** Daily snapshots for a user, oldest first (about one trading year). */
export async function getEquitySnapshots(userId: string, limit = 260): Promise<EquityPoint[]> {
  await connectToDatabase();
  const rows = await EquitySnapshot.find(
    { userId: new mongoose.Types.ObjectId(userId) },
    { date: 1, equity: 1, _id: 0 },
  )
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return rows.reverse().map((r) => ({ date: r.date, equity: r.equity }));
}

/** Every user who has ever traded: the population the daily job values. */
export async function getTradingUserIds(): Promise<string[]> {
  await connectToDatabase();
  const ids = await Transaction.distinct("userId");
  return ids.map((id) => String(id));
}

/**
 * Value a user's account at current market prices and store it for `date`.
 * Skips the day rather than storing a wrong number if any holding is unpriced.
 */
export async function recordEquitySnapshot(
  userId: string,
  date: string,
): Promise<{ recorded: boolean; reason?: string }> {
  const portfolio = await getUserPortfolio(userId);
  if (portfolio.missingPrices.length > 0) {
    return { recorded: false, reason: `No price for ${portfolio.missingPrices.join(", ")}` };
  }

  await EquitySnapshot.updateOne(
    { userId: new mongoose.Types.ObjectId(userId), date },
    {
      $set: {
        cash: roundMoney(portfolio.balance),
        holdingsValue: roundMoney(portfolio.totalMarketValue),
        equity: roundMoney(portfolio.totalEquity),
      },
    },
    { upsert: true },
  );
  return { recorded: true };
}
