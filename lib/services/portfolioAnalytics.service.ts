import "server-only";

import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { getEquitySnapshots } from "@/lib/services/equitySnapshot.service";
import { getCompanyProfile } from "@/lib/finnhub/client";
import { computeRiskMetrics, MIN_RETURNS_FOR_RISK } from "@/lib/portfolio/metrics";

interface SectorAllocation {
  sector: string;
  allocationPct: number;
}

interface LargestPosition {
  symbol: string;
  allocationPct: number;
}

export interface PortfolioSnapshot {
  totalEquity: number;
  totalReturnPct: number;
  displayTotalReturnPct: string;
  cashAllocationPct: number;
  largestPosition: LargestPosition | null;
  concentrationRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  sectorBreakdown: SectorAllocation[];
  /** Annualized, from daily snapshots. Null until enough history exists. */
  volatility: number | null;
  sharpeRatio: number | null;
  /** Daily returns available, and how many risk metrics need. */
  riskHistoryDays: number;
  riskHistoryDaysRequired: number;
  topGainer: string | null;
  topLoser: string | null;
}

// Process-level cache: a company's sector does not change between requests.
const sectorCache = new Map<string, string>();

async function getSymbolSector(symbol: string): Promise<string> {
  const key = symbol.toUpperCase();
  const cached = sectorCache.get(key);
  if (cached) return cached;

  try {
    const sector = (await getCompanyProfile(key))?.finnhubIndustry || "Unknown";
    sectorCache.set(key, sector);
    return sector;
  } catch {
    return "Unknown"; // Not cached, so a transient failure is retried next time.
  }
}

const pct = (value: number, total: number) =>
  total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0;

/** Analytics inputs for the AI analysis. Read-only. */
export async function buildPortfolioSnapshot(userId: string): Promise<PortfolioSnapshot> {
  const [portfolio, equityHistory] = await Promise.all([
    getUserPortfolio(userId),
    getEquitySnapshots(userId),
  ]);

  const { positions, totalEquity, balance } = portfolio;

  let largestPosition: LargestPosition | null = null;
  if (positions.length > 0) {
    const largest = positions.reduce((a, b) => (a.marketValue > b.marketValue ? a : b));
    largestPosition = { symbol: largest.symbol, allocationPct: pct(largest.marketValue, totalEquity) };
  }

  const topAllocation = largestPosition?.allocationPct ?? 0;
  const concentrationRiskLevel: "LOW" | "MEDIUM" | "HIGH" =
    topAllocation > 40 ? "HIGH" : topAllocation > 25 ? "MEDIUM" : "LOW";

  const sectorValues = new Map<string, number>();
  const sectors = await Promise.all(positions.map((p) => getSymbolSector(p.symbol)));
  positions.forEach((p, i) =>
    sectorValues.set(sectors[i], (sectorValues.get(sectors[i]) ?? 0) + p.marketValue),
  );
  const sectorBreakdown = [...sectorValues.entries()]
    .map(([sector, value]) => ({ sector, allocationPct: pct(value, totalEquity) }))
    .sort((a, b) => b.allocationPct - a.allocationPct);

  const risk = computeRiskMetrics(equityHistory);

  let topGainer: string | null = null;
  let topLoser: string | null = null;
  if (positions.length > 0) {
    const sorted = [...positions].sort((a, b) => a.gainPercent - b.gainPercent);
    topLoser = sorted[0].symbol;
    topGainer = sorted[sorted.length - 1].symbol;
    if (topGainer === topLoser) topLoser = null;
  }

  const totalReturnPct = Number(portfolio.totalReturnPercent.toFixed(2));

  return {
    totalEquity,
    totalReturnPct,
    displayTotalReturnPct: `${totalReturnPct}%`,
    cashAllocationPct: pct(balance, totalEquity),
    largestPosition,
    concentrationRiskLevel,
    sectorBreakdown,
    volatility: risk ? Number(risk.volatility.toFixed(4)) : null,
    sharpeRatio: risk?.sharpeRatio != null ? Number(risk.sharpeRatio.toFixed(4)) : null,
    riskHistoryDays: Math.max(equityHistory.length - 1, 0),
    riskHistoryDaysRequired: MIN_RETURNS_FOR_RISK,
    topGainer,
    topLoser,
  };
}
