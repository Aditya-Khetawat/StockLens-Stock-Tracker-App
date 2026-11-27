import "server-only";

import { getQuote } from "@/lib/finnhub/client";
import { findDemoUserId } from "@/lib/data/users";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { buildInsights, type Insight } from "@/lib/portfolio/insights";
import { DEMO_HOLDINGS } from "@/lib/demo/constants";

export const LANDING_SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM"] as const;

export type LandingQuote = { symbol: string; price: number; changePercent: number | null };

export type LandingDemo = {
  /** True when this is the shared demo account itself, false for its seed holdings at today's prices. */
  live: boolean;
  totalEquity: number;
  cash: number;
  dayChange: { amount: number; percent: number } | null;
  totalReturn: number;
  totalReturnPercent: number;
  positions: Array<{ symbol: string; netQty: number; currentPrice: number; marketValue: number; gainPercent: number }>;
  insights: Insight[];
};

/**
 * Real data for the public landing page: live quotes, and the shared demo
 * account as it stands. Every failure degrades to less content, never to
 * invented numbers.
 */
export async function getLandingData(): Promise<{ quotes: LandingQuote[]; demo: LandingDemo | null }> {
  const settled = await Promise.all(LANDING_SYMBOLS.map((s) => getQuote(s).catch(() => null)));
  const quotes = settled.flatMap((q, i) =>
    q && !q.stale ? [{ symbol: LANDING_SYMBOLS[i], price: q.price, changePercent: q.changePercent }] : [],
  );

  let demo: LandingDemo | null = null;
  try {
    const demoId = await findDemoUserId();
    if (demoId) {
      const p = await getUserPortfolio(demoId);
      demo = {
        live: true,
        totalEquity: p.totalEquity,
        cash: p.balance,
        dayChange: p.dayChange,
        totalReturn: p.totalReturn,
        totalReturnPercent: p.totalReturnPercent,
        positions: [...p.positions].sort((a, b) => b.marketValue - a.marketValue),
        insights: buildInsights(p),
      };
    }
  } catch (err) {
    console.error("Landing demo snapshot failed:", err);
  }

  // Before anyone has opened the demo: its starting holdings at today's prices.
  if (!demo) {
    const priced = await Promise.all(DEMO_HOLDINGS.map((h) => getQuote(h.symbol).catch(() => null)));
    const positions = DEMO_HOLDINGS.flatMap((h, i) => {
      const q = priced[i];
      if (!q || q.stale) return [];
      return [{ symbol: h.symbol, netQty: h.quantity, currentPrice: q.price, marketValue: q.price * h.quantity, gainPercent: 0 }];
    });
    if (positions.length) {
      const invested = positions.reduce((n, p) => n + p.marketValue, 0);
      const cash = 100_000 - invested;
      demo = {
        live: false,
        totalEquity: 100_000,
        cash,
        dayChange: null,
        totalReturn: 0,
        totalReturnPercent: 0,
        positions,
        insights: buildInsights({
          balance: cash,
          totalEquity: 100_000,
          positions: positions.map((p) => ({ ...p, allocationPercent: (p.marketValue / 100_000) * 100 })),
        }),
      };
    }
  }

  return { quotes, demo };
}
