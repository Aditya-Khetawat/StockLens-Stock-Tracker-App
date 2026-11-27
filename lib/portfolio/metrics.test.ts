import { describe, expect, it } from "vitest";
import { buildPnlSeries, computeRiskMetrics, MIN_RETURNS_FOR_RISK } from "./metrics";

const day = (n: number) => `2026-01-${String(n).padStart(2, "0")}`;

/** Equity series whose daily returns are exactly `returns`. */
function seriesFromReturns(returns: number[], start = 100_000) {
  const points = [{ date: day(1), equity: start }];
  returns.forEach((r, i) => points.push({ date: day(i + 2), equity: points[i].equity * (1 + r) }));
  return points;
}

describe("computeRiskMetrics", () => {
  it("returns null until there is enough daily history", () => {
    const returns = Array.from({ length: MIN_RETURNS_FOR_RISK - 1 }, () => 0.01);
    expect(computeRiskMetrics(seriesFromReturns(returns))).toBeNull();
  });

  it("annualizes volatility and Sharpe from daily snapshot returns", () => {
    // +1%, -1% alternating: mean 0, sample std 0.01 * sqrt(20/19).
    const returns = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 0.01 : -0.01));
    const metrics = computeRiskMetrics(seriesFromReturns(returns));

    const expectedVol = 0.01 * Math.sqrt(20 / 19) * Math.sqrt(252);
    expect(metrics?.volatility).toBeCloseTo(expectedVol, 6);
    expect(metrics?.sharpeRatio).toBeCloseTo((0 - 0.03) / expectedVol, 6);
    expect(metrics?.sampleDays).toBe(20);
  });

  it("reports no Sharpe ratio when the equity never moves", () => {
    const flat = Array.from({ length: 25 }, (_, i) => ({ date: day(i + 1), equity: 100_000 }));
    expect(computeRiskMetrics(flat)).toEqual({ volatility: 0, sharpeRatio: null, sampleDays: 24 });
  });
});

describe("buildPnlSeries", () => {
  // Not an exact half-cent: those are ambiguous in binary floating point.
  const live = { date: "2026-01-10T15:30:00.000Z", equity: 101_000.556 };

  it("shows only the live point for a new account", () => {
    expect(buildPnlSeries([], live, 100_000)).toEqual([{ date: live.date, pnl: 1000.56 }]);
  });

  it("appends the live point after earlier daily snapshots", () => {
    const series = buildPnlSeries(
      [
        { date: "2026-01-08", equity: 99_500 },
        { date: "2026-01-09", equity: 100_250 },
      ],
      live,
      100_000,
    );
    expect(series.map((p) => p.pnl)).toEqual([-500, 250, 1000.56]);
  });

  it("replaces today's snapshot with the live value", () => {
    const series = buildPnlSeries([{ date: "2026-01-10", equity: 50 }], live, 100_000);
    expect(series).toEqual([{ date: live.date, pnl: 1000.56 }]);
  });
});
