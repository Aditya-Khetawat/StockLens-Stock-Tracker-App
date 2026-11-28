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

const RECENT_TRADE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

/** Current holdings valued at market prices. */
export async function getUserPortfolio(userId: string): Promise<Portfolio> {
  await connectToDatabase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [user, ledger] = await Promise.all([
    User.findById(userObjectId).lean(),
    Transaction.find({ userId: userObjectId }, { symbol: 1, type: 1, quantity: 1, totalAmount: 1, createdAt: 1 })
      .sort({ createdAt: 1 })
      .lean(),
  ]);
  if (!user) throw new Error("User not found");

  const holdings = replayLedger(ledger);
  // Trades that may belong to the current session. Five days spans a weekend
  // plus a holiday; dayChange keeps only those inside each quote's session.
  const since = Date.now() - RECENT_TRADE_WINDOW_MS;
  const recentTrades = ledger
    .filter((t) => t.createdAt.getTime() >= since)
    .map((t) => ({ ...t, at: t.createdAt.getTime() }));
  // Positions closed out today still count toward today's change, so price them too.
  const symbols = [...new Set([...holdings.map((h) => h.symbol), ...recentTrades.map((t) => t.symbol)])];
  const quoteList = await Promise.all(symbols.map((s) => getQuote(s).catch(() => null)));
  const quotes = Object.fromEntries(symbols.map((s, i) => [s, quoteList[i]]));
  const prices = Object.fromEntries(holdings.map((h) => [h.symbol, quotes[h.symbol]?.price]));

  const cash = user.balance ?? 100_000;
  const valuation = valuePortfolio(holdings, prices, {
    // Better Auth creates users without these fields; the model defaults apply.
    cash,
    startingBalance: user.startingBalance ?? 100_000,
  });
  const sessionQuotes = Object.fromEntries(
    symbols.map((s) => {
      const q = quotes[s];
      return [s, q ? { price: q.price, change: q.change, tradedAt: q.tradedAt ?? null } : null];
    }),
  );
  return { ...valuation, dayChange: dayChange(holdings, sessionQuotes, recentTrades, cash) };
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
