import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { fetchJSON } from "@/lib/actions/finnhub.actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EquityPoint {
  date: string;
  equity: number;
}

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
  volatility: number;
  sharpeRatio: number;
  topGainer: string | null;
  topLoser: string | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute daily returns from a sorted array of equity data points.
 * Each element represents the last-known equity value at a given timestamp.
 * Points are first collapsed to one value per calendar day (last value wins),
 * then day-over-day percentage returns are computed.
 */
export function calculateDailyReturns(points: EquityPoint[]): number[] {
  if (points.length < 2) return [];

  // Collapse to one equity value per UTC date (last value per day)
  const byDay = new Map<string, number>();
  for (const p of points) {
    const day = p.date.slice(0, 10); // "YYYY-MM-DD"
    byDay.set(day, p.equity);
  }

  const dailyEquities = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, equity]) => equity);

  const returns: number[] = [];
  for (let i = 1; i < dailyEquities.length; i++) {
    const prev = dailyEquities[i - 1];
    if (prev === 0) continue;
    returns.push((dailyEquities[i] - prev) / prev);
  }

  return returns;
}

/**
 * Compute annualised volatility (standard deviation of daily returns × √252).
 */
export function calculateVolatility(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;

  const n = dailyReturns.length;
  const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / n;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const dailyStdDev = Math.sqrt(variance);

  return dailyStdDev * Math.sqrt(252);
}

/**
 * Compute the Sharpe Ratio.
 * Sharpe = (annualisedReturn − riskFreeRate) / annualisedVolatility
 */
export function calculateSharpe(
  annualisedReturn: number,
  annualisedVolatility: number,
  riskFreeRate = 0.03,
): number {
  if (annualisedVolatility === 0) return 0;
  return (annualisedReturn - riskFreeRate) / annualisedVolatility;
}

/**
 * Rebuild the equity time series for a given userId directly from transactions,
 * mirroring the logic in /api/portfolio/equity/route.ts, but server-side.
 */
async function getEquityTimeSeries(userId: string): Promise<EquityPoint[]> {
  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjectId).lean();

  if (!user) throw new Error("User not found");

  const startingBalance: number =
    typeof user.startingBalance === "number" ? user.startingBalance : 100000;

  const transactions = await Transaction.find({ userId: userObjectId })
    .sort({ createdAt: 1 })
    .lean();

  if (transactions.length === 0) {
    return [{ date: new Date().toISOString(), equity: startingBalance }];
  }

  let cash = startingBalance;
  const holdings = new Map<string, number>();
  const lastPrice = new Map<string, number>();
  const points: EquityPoint[] = [];

  for (const txn of transactions) {
    if (!txn.createdAt) continue;
    if (typeof txn.totalAmount !== "number" || txn.totalAmount <= 0) continue;
    if (txn.type !== "BUY" && txn.type !== "SELL") continue;

    const symbol: string = txn.symbol;
    const quantity: number = txn.quantity;

    if (txn.type === "BUY") {
      cash -= txn.totalAmount;
      holdings.set(symbol, (holdings.get(symbol) ?? 0) + quantity);
    } else {
      cash += txn.totalAmount;
      const newQty = (holdings.get(symbol) ?? 0) - quantity;
      newQty <= 0 ? holdings.delete(symbol) : holdings.set(symbol, newQty);
    }

    lastPrice.set(symbol, txn.price);

    let holdingsValue = 0;
    for (const [sym, qty] of holdings) {
      holdingsValue += qty * (lastPrice.get(sym) ?? 0);
    }

    points.push({
      date: (txn.createdAt as Date).toISOString(),
      equity: cash + holdingsValue,
    });
  }

  return points;
}

// Module-level in-memory cache — avoids redundant Finnhub calls within a
// single snapshot build and across successive calls in the same process.
const sectorCache = new Map<string, string>();

/**
 * Fetch the Finnhub industry (sector) for a symbol.
 * Results are memoised in `sectorCache` for the lifetime of the process.
 * Returns "Unknown" if the API call fails or the field is absent.
 */
async function getSymbolSector(symbol: string): Promise<string> {
  const key = symbol.toUpperCase();

  if (sectorCache.has(key)) return sectorCache.get(key)!;

  const token =
    process.env.FINNHUB_API_KEY ??
    process.env.NEXT_PUBLIC_FINNHUB_API_KEY ??
    "";
  if (!token) return "Unknown";

  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(key)}&token=${token}`;
    const profile = await fetchJSON<{ finnhubIndustry?: string }>(url, 3600);
    const sector = profile?.finnhubIndustry || "Unknown";
    sectorCache.set(key, sector);
    return sector;
  } catch {
    sectorCache.set(key, "Unknown");
    return "Unknown";
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a pure analytics snapshot for a given user's portfolio.
 * No database writes are performed.
 */
export async function buildPortfolioSnapshot(
  userId: string,
): Promise<PortfolioSnapshot> {
  // Fetch portfolio and equity time series concurrently
  const [portfolio, equityPoints] = await Promise.all([
    getUserPortfolio(userId),
    getEquityTimeSeries(userId),
  ]);

  const { positions, totalEquity, totalMarketValue, balance } = portfolio;

  // --- Cash allocation ---
  const cashAllocationPct = totalEquity > 0 ? (balance / totalEquity) * 100 : 0;

  // --- Largest position (by allocationPercent relative to total equity) ---
  let largestPosition: LargestPosition | null = null;
  if (positions.length > 0) {
    const largest = positions.reduce((a, b) =>
      a.marketValue > b.marketValue ? a : b,
    );
    largestPosition = {
      symbol: largest.symbol,
      allocationPct:
        totalEquity > 0
          ? Number(((largest.marketValue / totalEquity) * 100).toFixed(2))
          : 0,
    };
  }

  // --- Concentration risk level ---
  const topAllocation = largestPosition?.allocationPct ?? 0;
  const concentrationRiskLevel: "LOW" | "MEDIUM" | "HIGH" =
    topAllocation > 40 ? "HIGH" : topAllocation > 25 ? "MEDIUM" : "LOW";

  // --- Sector breakdown ---
  let sectorBreakdown: SectorAllocation[] = [];
  if (positions.length > 0) {
    const sectorResults = await Promise.all(
      positions.map(async (pos) => ({
        sector: await getSymbolSector(pos.symbol),
        marketValue: pos.marketValue,
      })),
    );

    const sectorMap = new Map<string, number>();
    for (const { sector, marketValue } of sectorResults) {
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + marketValue);
    }

    sectorBreakdown = Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        sector,
        // Use totalEquity (cash + holdings) so denominator matches largestPosition
        allocationPct:
          totalEquity > 0
            ? Number(((value / totalEquity) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.allocationPct - a.allocationPct);
  }

  // --- Volatility & Sharpe ---
  const dailyReturns = calculateDailyReturns(equityPoints);
  const annualisedVolatility = calculateVolatility(dailyReturns);

  // Derive annualised return from the equity time series so that the holding
  // period is accounted for.  A user who traded for 10 days vs 200 days will
  // get a comparable figure rather than a raw cumulative return.
  const firstEquity = equityPoints[0]?.equity ?? 0;
  const lastEquity = equityPoints[equityPoints.length - 1]?.equity ?? 0;
  const totalReturn =
    firstEquity > 0 ? (lastEquity - firstEquity) / firstEquity : 0;
  const numDays = dailyReturns.length;
  const annualisedReturn =
    numDays > 0 ? Math.pow(1 + totalReturn, 252 / numDays) - 1 : 0;

  const sharpeRatio = calculateSharpe(annualisedReturn, annualisedVolatility);

  // --- Top Gainer / Top Loser ---
  let topGainer: string | null = null;
  let topLoser: string | null = null;

  if (positions.length > 0) {
    const sorted = [...positions].sort((a, b) => a.gainPercent - b.gainPercent);
    topLoser = sorted[0].symbol;
    topGainer = sorted[sorted.length - 1].symbol;

    // If top gainer and loser are the same (single position), treat loser as null
    if (topGainer === topLoser) {
      topLoser = null;
    }
  }

  const roundedTotalReturnPct = Number(portfolio.totalReturnPercent.toFixed(2));

  return {
    totalEquity,
    totalReturnPct: roundedTotalReturnPct,
    displayTotalReturnPct: `${roundedTotalReturnPct}%`,
    cashAllocationPct,
    largestPosition,
    concentrationRiskLevel,
    sectorBreakdown,
    volatility: Number(annualisedVolatility.toFixed(4)),
    sharpeRatio: Number(sharpeRatio.toFixed(4)),
    topGainer,
    topLoser,
  };
}
