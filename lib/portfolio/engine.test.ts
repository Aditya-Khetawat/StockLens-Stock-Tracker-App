import { describe, expect, it } from "vitest";
import { dayChange, pickMovers, replayLedger, startOfEasternDay, valuePortfolio, type LedgerEntry } from "./engine";

const buy = (symbol: string, quantity: number, price: number): LedgerEntry => ({
  symbol, type: "BUY", quantity, totalAmount: quantity * price,
});
const sell = (symbol: string, quantity: number, price: number): LedgerEntry => ({
  symbol, type: "SELL", quantity, totalAmount: quantity * price,
});

describe("replayLedger", () => {
  it("averages the cost of repeated buys", () => {
    expect(replayLedger([buy("AAPL", 10, 100), buy("AAPL", 10, 200)])).toEqual([
      { symbol: "AAPL", quantity: 20, avgCost: 150 },
    ]);
  });

  it("keeps the average cost after a partial sell", () => {
    expect(replayLedger([buy("AAPL", 10, 100), buy("AAPL", 10, 200), sell("AAPL", 5, 999)])).toEqual([
      { symbol: "AAPL", quantity: 15, avgCost: 150 },
    ]);
  });

  it("starts a fresh cost basis after a position is fully closed", () => {
    const holdings = replayLedger([buy("AAPL", 10, 100), sell("AAPL", 10, 120), buy("AAPL", 2, 300)]);
    expect(holdings).toEqual([{ symbol: "AAPL", quantity: 2, avgCost: 300 }]);
  });

  it("drops closed positions and ignores sells of symbols never bought", () => {
    expect(replayLedger([buy("MSFT", 1, 50), sell("MSFT", 1, 60), sell("TSLA", 3, 10)])).toEqual([]);
  });

  it("tracks symbols independently", () => {
    const holdings = replayLedger([buy("AAPL", 1, 100), buy("MSFT", 2, 50)]);
    expect(holdings).toEqual([
      { symbol: "AAPL", quantity: 1, avgCost: 100 },
      { symbol: "MSFT", quantity: 2, avgCost: 50 },
    ]);
  });
});

describe("valuePortfolio", () => {
  const holdings = [
    { symbol: "AAPL", quantity: 10, avgCost: 100 },
    { symbol: "MSFT", quantity: 5, avgCost: 200 },
  ];

  it("values positions at market prices against total equity", () => {
    const p = valuePortfolio(holdings, { AAPL: 120, MSFT: 180 }, { cash: 98_000, startingBalance: 100_000 });

    expect(p.positions).toEqual([
      { symbol: "AAPL", netQty: 10, avgCost: 100, currentPrice: 120, marketValue: 1200, unrealizedPnL: 200, gainPercent: 20, allocationPercent: 1.2 },
      { symbol: "MSFT", netQty: 5, avgCost: 200, currentPrice: 180, marketValue: 900, unrealizedPnL: -100, gainPercent: -10, allocationPercent: 0.9 },
    ]);
    expect(p).toMatchObject({
      balance: 98_000,
      totalMarketValue: 2100,
      totalEquity: 100_100,
      totalUnrealizedPnL: 100,
      totalReturn: 100,
      totalReturnPercent: 0.1,
      missingPrices: [],
    });
  });

  it("reports unpriced holdings instead of valuing them at zero silently", () => {
    const p = valuePortfolio(holdings, { AAPL: 120 }, { cash: 98_000, startingBalance: 100_000 });
    expect(p.missingPrices).toEqual(["MSFT"]);
    expect(p.positions.map((x) => x.symbol)).toEqual(["AAPL"]);
  });
});

describe("dayChange", () => {
  // Friday 27 Nov 2026 was a half day: the close printed at 1:00 PM ET.
  const fridayClose = Date.parse("2026-11-27T18:00:00Z");
  const fridayMorning = Date.parse("2026-11-27T15:00:00Z"); // 10:00 AM ET
  const thursdayEvening = Date.parse("2026-11-27T01:00:00Z"); // 8:00 PM ET, 26 Nov
  const fridayNight = Date.parse("2026-11-28T04:39:00Z"); // 11:39 PM ET, after the close

  const quote = (price: number, change: number | null, tradedAt: number | null = fridayClose) => ({
    price, change, tradedAt,
  });
  const at = (entry: LedgerEntry, time: number) => ({ ...entry, at: time });

  it("sums each holding's move since the previous close", () => {
    const holdings = [{ symbol: "AAPL", quantity: 10 }, { symbol: "MSFT", quantity: 5 }];
    const quotes = { AAPL: quote(120, 3), MSFT: quote(180, 0) };
    // +30 on yesterday's equity of 1,000 + 2,100 - 30 = 3,070.
    expect(dayChange(holdings, quotes, [], 1_000)).toEqual({ amount: 30, percent: (30 / 3_070) * 100 });
  });

  it("counts shares bought this session from their purchase price, not the previous close", () => {
    // The demo account: bought after Friday's close at the closing price, so
    // Friday's rise happened before it owned the shares.
    const holdings = [{ symbol: "NVDA", quantity: 20 }];
    const trades = [at(buy("NVDA", 20, 150.49), fridayNight)];
    expect(dayChange(holdings, { NVDA: quote(150.49, 1.19) }, trades, 1_000)).toEqual({ amount: 0, percent: 0 });
  });

  it("splits a position between shares held before and shares bought today", () => {
    // 10 held from yesterday (close 100) gain 5 each; 5 bought today at 102 gain 3 each.
    const holdings = [{ symbol: "AAPL", quantity: 15 }];
    const trades = [at(buy("AAPL", 10, 90), thursdayEvening), at(buy("AAPL", 5, 102), fridayMorning)];
    expect(dayChange(holdings, { AAPL: quote(105, 5) }, trades, 1_000)?.amount).toBe(65);
  });

  it("includes the gain realised by selling today", () => {
    // 10 held at yesterday's close of 100; 4 sold today at 104, 6 still held at 105.
    const holdings = [{ symbol: "AAPL", quantity: 6 }];
    const trades = [at(sell("AAPL", 4, 104), fridayMorning)];
    expect(dayChange(holdings, { AAPL: quote(105, 5) }, trades, 1_000)?.amount).toBe(46);
  });

  it("includes positions closed out today", () => {
    const trades = [at(sell("TSLA", 10, 104), fridayMorning)];
    expect(dayChange([], { TSLA: quote(105, 5) }, trades, 1_000)?.amount).toBe(40);
  });

  it("treats trades from before this session as held since the previous close", () => {
    const holdings = [{ symbol: "AAPL", quantity: 10 }];
    const trades = [at(buy("AAPL", 10, 99), thursdayEvening)];
    expect(dayChange(holdings, { AAPL: quote(105, 5) }, trades, 1_000)?.amount).toBe(50);
  });

  it("is unknown when no held symbol has a daily change", () => {
    const holdings = [{ symbol: "AAPL", quantity: 10 }];
    expect(dayChange(holdings, {}, [], 1_000)).toBeNull();
    expect(dayChange(holdings, { AAPL: quote(120, null) }, [], 1_000)).toBeNull();
    expect(dayChange([], { AAPL: quote(120, 1) }, [], 1_000)).toBeNull();
  });

  it("counts only the holdings that have a change", () => {
    const holdings = [{ symbol: "AAPL", quantity: 10 }, { symbol: "MSFT", quantity: 5 }];
    expect(dayChange(holdings, { AAPL: quote(120, -1) }, [], 1_000)?.amount).toBe(-10);
  });
});

describe("startOfEasternDay", () => {
  it("returns midnight New York time in winter and summer", () => {
    // 11:39 PM EST on 27 Nov is still 27 Nov in New York.
    expect(startOfEasternDay(Date.parse("2026-11-28T04:39:00Z"))).toBe(Date.parse("2026-11-27T05:00:00Z"));
    // 11:00 PM EDT on 30 Jun.
    expect(startOfEasternDay(Date.parse("2026-07-01T03:00:00Z"))).toBe(Date.parse("2026-06-30T04:00:00Z"));
  });
});

describe("pickMovers", () => {
  it("ranks by the size of the move, either direction", () => {
    const movers = pickMovers(
      [
        { symbol: "A", changePercent: 1 },
        { symbol: "B", changePercent: -5 },
        { symbol: "C", changePercent: null },
        { symbol: "D", changePercent: 3 },
      ],
      2,
    );
    expect(movers.map((m) => m.symbol)).toEqual(["B", "D"]);
  });
});
