"use server";

// Every export in this file is a public endpoint. Each one must check the
// session first; Finnhub access itself lives in the server-only client.

import { cache } from "react";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { getSessionUser } from "@/lib/better-auth/session";
import { getWatchlistSymbolsByUserId } from "@/lib/data/watchlist";
import {
  getCompanyProfile,
  getQuote as fetchQuote,
  searchSymbols,
  type Quote,
} from "@/lib/finnhub/client";

/** Current price for the trade dialog. Signed-in users only. */
export async function getQuote(
  symbol: string,
): Promise<{ success: true; data: Quote } | { success: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Please sign in." };

  const trimmed = typeof symbol === "string" ? symbol.trim() : "";
  if (!/^[A-Za-z0-9.\-]{1,15}$/.test(trimmed)) {
    return { success: false, error: "Invalid symbol." };
  }

  try {
    const quote = await fetchQuote(trimmed);
    if (!quote) return { success: false, error: "No price for this symbol." };
    return { success: true, data: quote };
  } catch (err) {
    console.error("getQuote error:", err);
    return { success: false, error: "Price service unavailable." };
  }
}

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    const user = await getSessionUser();
    if (!user) return [];

    try {
      const watchlistSymbols = await getWatchlistSymbolsByUserId(user.id);
      const trimmed = typeof query === "string" ? query.trim().slice(0, 50) : "";

      let results: Array<FinnhubSearchResult & { exchange?: string }>;

      if (!trimmed) {
        // Default list: profiles of the top popular symbols.
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              return { sym, profile: await getCompanyProfile(sym) };
            } catch (e) {
              console.error("Error fetching profile for", sym, e);
              return { sym, profile: null };
            }
          }),
        );

        results = profiles.flatMap(({ sym, profile }) => {
          const name = profile?.name || profile?.ticker;
          if (!name) return [];
          return [
            {
              symbol: sym.toUpperCase(),
              description: name,
              displaySymbol: sym.toUpperCase(),
              type: "Common Stock",
              exchange: profile?.exchange,
            },
          ];
        });
      } else {
        results = await searchSymbols(trimmed);
      }

      return results.slice(0, 15).map((r) => {
        const upper = (r.symbol || "").toUpperCase();
        return {
          symbol: upper,
          name: r.description || upper,
          exchange: r.displaySymbol || r.exchange || "US",
          type: r.type || "Stock",
          isInWatchlist: watchlistSymbols.includes(upper),
        };
      });
    } catch (err) {
      console.error("Error in stock search:", err);
      return [];
    }
  },
);
