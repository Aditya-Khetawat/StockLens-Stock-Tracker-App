import { describe, expect, it } from "vitest";
import { dayChange, pickMovers, replayLedger, valuePortfolio, type LedgerEntry } from "./engine";

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
  const positions = [
    { symbol: "AAPL", netQty: 10, marketValue: 1_200 },
    { symbol: "MSFT", netQty: 5, marketValue: 900 },
  ];

  it("sums each holding's move since the previous close", () => {
    // AAPL +2/share, MSFT -4/share: +20 - 20 = 0 on 2,100 of holdings.
    expect(dayChange(positions, { AAPL: 2, MSFT: -4 }, 1_000)).toEqual({ amount: 0, percent: 0 });
    // +30 on yesterday's equity of 1,000 + 2,100 - 30 = 3,070.
    expect(dayChange(positions, { AAPL: 3, MSFT: 0 }, 1_000)).toEqual({ amount: 30, percent: (30 / 3_070) * 100 });
  });

  it("is unknown when no held symbol has a daily change", () => {
    expect(dayChange(positions, {}, 1_000)).toBeNull();
    expect(dayChange([], { AAPL: 1 }, 1_000)).toBeNull();
  });

  it("counts only the holdings that have a change", () => {
    expect(dayChange(positions, { AAPL: -1 }, 1_000)?.amount).toBe(-10);
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
