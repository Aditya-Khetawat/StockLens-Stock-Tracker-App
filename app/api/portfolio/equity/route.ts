import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/better-auth/session";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { getEquitySnapshots } from "@/lib/services/equitySnapshot.service";
import { buildPnlSeries } from "@/lib/portfolio/metrics";
import { User } from "@/database/models/user.model";

const NO_CACHE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/portfolio/equity
 * P&L over time: one point per trading day from the daily snapshot job,
 * ending with the account's live value at current market prices.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [portfolio, snapshots, account] = await Promise.all([
      getUserPortfolio(user.id),
      getEquitySnapshots(user.id),
      User.findById(user.id, { startingBalance: 1 }).lean(),
    ]);

    const series = buildPnlSeries(
      snapshots,
      { date: new Date().toISOString(), equity: portfolio.totalEquity },
      account?.startingBalance ?? 100000,
    );

    return NextResponse.json(series, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Error fetching portfolio P&L:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
