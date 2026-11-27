import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { getQuote } from "@/lib/finnhub/client";
import { replayLedger, valuePortfolio, type PortfolioValuation } from "@/lib/portfolio/engine";

export type Portfolio = PortfolioValuation;

/** Current holdings valued at market prices. */
export async function getUserPortfolio(userId: string): Promise<Portfolio> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [user, ledger] = await Promise.all([
    User.findById(userObjectId).lean(),
    Transaction.find({ userId: userObjectId }, { symbol: 1, type: 1, quantity: 1, totalAmount: 1 })
      .sort({ createdAt: 1 })
      .lean(),
  ]);
  if (!user) throw new Error("User not found");

  const holdings = replayLedger(ledger);
  const quotes = await Promise.all(
    holdings.map((h) => getQuote(h.symbol).catch(() => null)),
  );
  const prices = Object.fromEntries(holdings.map((h, i) => [h.symbol, quotes[i]?.price]));

  return valuePortfolio(holdings, prices, {
    // Better Auth creates users without these fields; the model defaults apply.
    cash: user.balance ?? 100_000,
    startingBalance: user.startingBalance ?? 100_000,
  });
}
