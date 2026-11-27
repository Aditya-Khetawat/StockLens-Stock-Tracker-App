import "server-only";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { getQuote } from "@/lib/finnhub/client";
import { pickMovers } from "@/lib/portfolio/engine";

export type Mover = {
  symbol: string;
  company: string;
  price: number;
  change: number | null;
  changePercent: number | null;
};

/** The user's watchlist stocks with the biggest moves today. */
export async function getWatchlistMovers(userId: string, limit: number): Promise<Mover[]> {
  await connectToDatabase();
  const items = await Watchlist.find({ userId }, { symbol: 1, company: 1 }).lean();

  const priced = await Promise.all(
    items.map(async (item): Promise<Mover | null> => {
      const quote = await getQuote(String(item.symbol)).catch(() => null);
      if (!quote) return null;
      return {
        symbol: String(item.symbol),
        company: String(item.company),
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      };
    }),
  );
  return pickMovers(priced.filter((m): m is Mover => m !== null), limit);
}
