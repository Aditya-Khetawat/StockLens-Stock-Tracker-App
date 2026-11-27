import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { getQuote } from "@/lib/finnhub/client";
import {
  dayChange,
  replayLedger,
  valuePortfolio,
  type Holding,
  type PortfolioValuation,
} from "@/lib/portfolio/engine";

export type Portfolio = PortfolioValuation & {
  /** Change since the previous close, or null before any held symbol has one. */
  dayChange: { amount: number; percent: number } | null;
};

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

  const cash = user.balance ?? 100_000;
  const valuation = valuePortfolio(holdings, prices, {
    // Better Auth creates users without these fields; the model defaults apply.
    cash,
    startingBalance: user.startingBalance ?? 100_000,
  });
  const changes = Object.fromEntries(holdings.map((h, i) => [h.symbol, quotes[i]?.change]));
  return { ...valuation, dayChange: dayChange(valuation.positions, changes, cash) };
}

/** Cash plus the open position in one symbol, without pricing the portfolio. */
export async function getHolding(
  userId: string,
  symbol: string,
): Promise<{ cash: number; holding: Holding | null }> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const normalized = symbol.trim().toUpperCase();

  const [user, ledger] = await Promise.all([
    User.findById(userObjectId, { balance: 1 }).lean(),
    Transaction.find(
      { userId: userObjectId, symbol: normalized },
      { symbol: 1, type: 1, quantity: 1, totalAmount: 1 },
    )
      .sort({ createdAt: 1 })
      .lean(),
  ]);
  if (!user) throw new Error("User not found");

  return { cash: user.balance ?? 100_000, holding: replayLedger(ledger)[0] ?? null };
}
