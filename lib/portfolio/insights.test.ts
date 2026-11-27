import { describe, expect, it } from "vitest";
import { buildInsights } from "./insights";

const position = (symbol: string, marketValue: number, gainPercent: number, allocationPercent: number) => ({
  symbol,
  marketValue,
  gainPercent,
  allocationPercent,
});

describe("buildInsights", () => {
  it("points an all-cash account at its first trade", () => {
    const insights = buildInsights({ balance: 100_000, totalEquity: 100_000, positions: [] });
    expect(insights).toEqual([
      expect.objectContaining({ id: "all-cash", tone: "neutral", action: "trade" }),
    ]);
  });

  it("flags a single holding at a quarter or more of the account", () => {
    const insights = buildInsights({
      balance: 50_000,
      totalEquity: 100_000,
      positions: [position("NVDA", 34_000, 4, 34), position("JPM", 16_000, -1, 16)],
    });
    const concentration = insights.find((i) => i.id === "concentration");
    expect(concentration).toMatchObject({ tone: "warning", symbol: "NVDA" });
    expect(concentration?.title).toBe("NVDA is 34% of your account");
  });

  it("does not flag concentration below 25%", () => {
    const insights = buildInsights({
      balance: 80_000,
      totalEquity: 100_000,
      positions: [position("NVDA", 20_000, 4, 20)],
    });
    expect(insights.find((i) => i.id === "concentration")).toBeUndefined();
  });

  it("names the best and worst holdings since purchase", () => {
    const insights = buildInsights({
      balance: 70_000,
      totalEquity: 100_000,
      positions: [position("AAPL", 10_000, 12.34, 10), position("TSLA", 10_000, -8.1, 10), position("JPM", 10_000, 1, 10)],
    });
    expect(insights.find((i) => i.id === "best")).toMatchObject({ tone: "gain", symbol: "AAPL", title: "AAPL is up 12.3% since you bought" });
    expect(insights.find((i) => i.id === "worst")).toMatchObject({ tone: "loss", symbol: "TSLA", title: "TSLA is down 8.1% since you bought" });
  });

  it("notes a low cash balance", () => {
    const insights = buildInsights({
      balance: 2_000,
      totalEquity: 100_000,
      positions: [position("AAPL", 98_000, 0, 98)],
    });
    expect(insights.find((i) => i.id === "cash")).toMatchObject({ title: "2% of your account is cash" });
  });

  it("returns at most four insights", () => {
    const insights = buildInsights({
      balance: 1_000,
      totalEquity: 100_000,
      positions: [position("A", 60_000, 10, 60), position("B", 39_000, -10, 39)],
    });
    expect(insights.length).toBeLessThanOrEqual(4);
  });
});
