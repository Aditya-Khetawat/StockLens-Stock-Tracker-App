// Pure portfolio math: no database or network access, so it is fully testable.

export type LedgerEntry = {
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  totalAmount: number;
};

export type Holding = { symbol: string; quantity: number; avgCost: number };

export type Position = {
  symbol: string;
  netQty: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  gainPercent: number;
  allocationPercent: number;
};

export type PortfolioValuation = {
  balance: number;
  positions: Position[];
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalEquity: number;
  totalReturn: number;
  totalReturnPercent: number;
  /** Symbols held but not priced; totals exclude them. */
  missingPrices: string[];
};

/**
 * Replay a ledger (oldest first) into open holdings with average cost.
 * Sells reduce cost at the pre-sell average; a fully closed position resets,
 * so a later buy starts a fresh cost basis.
 */
export function replayLedger(entries: LedgerEntry[]): Holding[] {
  const state = new Map<string, { quantity: number; totalCost: number }>();

  for (const entry of entries) {
    if (entry.type === "BUY") {
      const s = state.get(entry.symbol) ?? { quantity: 0, totalCost: 0 };
      s.quantity += entry.quantity;
      s.totalCost += entry.totalAmount;
      state.set(entry.symbol, s);
    } else {
      const s = state.get(entry.symbol);
      if (!s) continue;
      const avgCost = s.quantity > 0 ? s.totalCost / s.quantity : 0;
      s.totalCost -= avgCost * entry.quantity;
      s.quantity -= entry.quantity;
      if (s.quantity <= 0) state.delete(entry.symbol);
    }
  }

  return [...state.entries()].map(([symbol, s]) => ({
    symbol,
    quantity: s.quantity,
    avgCost: s.totalCost / s.quantity,
  }));
}

/** Value holdings at market prices. Allocation is relative to total equity. */
export function valuePortfolio(
  holdings: Holding[],
  prices: Record<string, number | undefined>,
  account: { cash: number; startingBalance: number },
): PortfolioValuation {
  const missingPrices: string[] = [];
  const priced: Omit<Position, "allocationPercent">[] = [];

  for (const h of holdings) {
    const price = prices[h.symbol];
    if (!price || price <= 0) {
      missingPrices.push(h.symbol);
      continue;
    }
    priced.push({
      symbol: h.symbol,
      netQty: h.quantity,
      avgCost: h.avgCost,
      currentPrice: price,
      marketValue: h.quantity * price,
      unrealizedPnL: (price - h.avgCost) * h.quantity,
      gainPercent: h.avgCost > 0 ? ((price - h.avgCost) / h.avgCost) * 100 : 0,
    });
  }

  const totalMarketValue = priced.reduce((sum, p) => sum + p.marketValue, 0);
  const totalEquity = account.cash + totalMarketValue;
  const positions = priced.map((p) => ({
    ...p,
    allocationPercent: totalEquity > 0 ? Number(((p.marketValue / totalEquity) * 100).toFixed(2)) : 0,
  }));
  const totalReturn = totalEquity - account.startingBalance;

  return {
    balance: account.cash,
    positions,
    totalMarketValue,
    totalUnrealizedPnL: positions.reduce((sum, p) => sum + p.unrealizedPnL, 0),
    totalEquity,
    totalReturn,
    totalReturnPercent:
      account.startingBalance > 0 ? (totalReturn / account.startingBalance) * 100 : 0,
    missingPrices,
  };
}

/**
 * Today's change in the portfolio: each holding's per-share move since the
 * previous close times shares held. An approximation: shares bought today
 * also count from the previous close, not from their purchase price.
 * Null when no held symbol has a change yet.
 */
export function dayChange(
  positions: Array<{ symbol: string; netQty: number; marketValue: number }>,
  changePerShare: Record<string, number | null | undefined>,
  cash: number,
): { amount: number; percent: number } | null {
  let amount = 0;
  let known = false;
  for (const p of positions) {
    const change = changePerShare[p.symbol];
    if (typeof change !== "number") continue;
    amount += change * p.netQty;
    known = true;
  }
  if (!known) return null;
  const equity = cash + positions.reduce((sum, p) => sum + p.marketValue, 0);
  const previous = equity - amount;
  return { amount, percent: previous > 0 ? (amount / previous) * 100 : 0 };
}

/** The biggest moves today, up or down; symbols without a change are skipped. */
export function pickMovers<T extends { changePercent: number | null }>(items: T[], limit: number): T[] {
  return items
    .filter((i) => typeof i.changePercent === "number")
    .sort((a, b) => Math.abs(b.changePercent!) - Math.abs(a.changePercent!))
    .slice(0, limit);
}
