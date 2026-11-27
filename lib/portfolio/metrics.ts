import { roundMoney } from "@/lib/trading/money";

/** One end-of-day equity value per trading day, oldest first. */
export type EquityPoint = { date: string; equity: number };

export type RiskMetrics = {
  volatility: number;
  sharpeRatio: number | null;
  sampleDays: number;
};

/** About one trading month of returns before volatility means anything. */
export const MIN_RETURNS_FOR_RISK = 20;
const TRADING_DAYS_PER_YEAR = 252;
const RISK_FREE_RATE = 0.03;

/**
 * Annualized volatility and Sharpe ratio from daily equity snapshots.
 * Returns null when there are fewer than MIN_RETURNS_FOR_RISK daily returns.
 */
export function computeRiskMetrics(points: EquityPoint[]): RiskMetrics | null {
  const returns: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].equity;
    if (prev > 0) returns.push(points[i].equity / prev - 1);
  }
  if (returns.length < MIN_RETURNS_FOR_RISK) return null;

  const n = returns.length;
  const mean = returns.reduce((sum, r) => sum + r, 0) / n;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (n - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);

  const annualReturn = mean * TRADING_DAYS_PER_YEAR;
  const sharpeRatio = volatility > 1e-12 ? (annualReturn - RISK_FREE_RATE) / volatility : null;

  return { volatility: volatility > 1e-12 ? volatility : 0, sharpeRatio, sampleDays: n };
}

/**
 * P&L series for the chart: daily snapshots, with today's value replaced by
 * the live equity so the line always ends at the current number.
 */
export function buildPnlSeries(
  snapshots: EquityPoint[],
  live: { date: string; equity: number },
  startingBalance: number,
): { date: string; pnl: number }[] {
  const today = live.date.slice(0, 10);
  return [
    ...snapshots.filter((s) => s.date.slice(0, 10) !== today),
    live,
  ].map((p) => ({ date: p.date, pnl: roundMoney(p.equity - startingBalance) }));
}
