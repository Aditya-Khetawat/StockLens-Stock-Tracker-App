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

export type SessionQuote = {
  price: number;
  /** Per-share change since the previous close. */
  change: number | null;
  /** When the price last traded (ms since epoch), which dates its session. */
  tradedAt: number | null;
};

const easternParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric", month: "numeric", day: "numeric",
  hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
});

/** Midnight US Eastern time on the day of `ms`. */
export function startOfEasternDay(ms: number): number {
  const p = Object.fromEntries(easternParts.formatToParts(ms).map((x) => [x.type, Number(x.value)]));
  const wallClock = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = wallClock - Math.floor(ms / 1000) * 1000;
  return Date.UTC(p.year, p.month - 1, p.day) - offset;
}

/**
 * Today's change in the portfolio: what the account is worth now minus what
 * it was worth at the previous close. Shares bought this session count from
 * their purchase price, shares sold this session from the previous close to
 * the sale price. A quote's session starts at midnight Eastern on the day it
 * last traded; trades before then were held through the previous close.
 * Null when no held or traded symbol has a change yet.
 */
export function dayChange(
  holdings: Array<{ symbol: string; quantity: number }>,
  quotes: Record<string, SessionQuote | null | undefined>,
  trades: Array<LedgerEntry & { at: number }>,
  cash: number,
): { amount: number; percent: number } | null {
  const symbols = new Set([...holdings.map((h) => h.symbol), ...trades.map((t) => t.symbol)]);
  const held = new Map(holdings.map((h) => [h.symbol, h.quantity]));

  let amount = 0;
  let known = false;
  for (const symbol of symbols) {
    const q = quotes[symbol];
    if (!q || typeof q.change !== "number") continue;
    const sessionStart = q.tradedAt == null ? Infinity : startOfEasternDay(q.tradedAt);

    let bought = 0, boughtCost = 0, sold = 0, soldProceeds = 0;
    for (const t of trades) {
      if (t.symbol !== symbol || t.at < sessionStart) continue;
      if (t.type === "BUY") { bought += t.quantity; boughtCost += t.totalAmount; }
      else { sold += t.quantity; soldProceeds += t.totalAmount; }
    }
    const quantity = held.get(symbol) ?? 0;
    const heldAtClose = quantity - bought + sold;
    const previousClose = q.price - q.change;
    amount += quantity * q.price + soldProceeds - boughtCost - heldAtClose * previousClose;
    known = true;
  }
  if (!known) return null;

  amount = Math.round(amount * 100) / 100 + 0; // cents; "+ 0" turns -0 into 0
  const equity = cash + holdings.reduce((sum, h) => sum + h.quantity * (quotes[h.symbol]?.price ?? 0), 0);
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
