"use server";

// Every export in this file is a public endpoint and must check the session.

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { getSessionUser as getAuthenticatedUser } from "@/lib/better-auth/session";
import {
  getBasicMetrics,
  getCompanyProfile,
  getQuote,
} from "@/lib/finnhub/client";
import { revalidatePath } from "next/cache";
import { formatMarketCap, formatSignedPercent, formatUsd } from "@/lib/format";

export async function addToWatchlist({
  symbol,
  company,
}: {
  symbol: string;
  company: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: "Please sign in to add stocks to your watchlist.",
      };
    }

    const normalizedSymbol = symbol?.trim().toUpperCase();
    const normalizedCompany = company?.trim();

    if (!normalizedSymbol) {
      return { success: false, error: "Stock symbol is required." };
    }

    if (!normalizedCompany) {
      return { success: false, error: "Company name is required." };
    }

    await connectToDatabase();

    const existing = await Watchlist.findOne({
      userId: user.id,
      symbol: normalizedSymbol,
    }).lean();

    if (existing) {
      return { success: true, message: "Stock is already in your watchlist." };
    }

    await Watchlist.create({
      userId: user.id,
      symbol: normalizedSymbol,
      company: normalizedCompany,
    });

    revalidatePath("/watchlist");

    return { success: true };
  } catch (err) {
    console.error("addToWatchlist error:", err);
    return { success: false, error: "Failed to add stock to watchlist." };
  }
}

export async function removeFromWatchlist(symbol: string) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: "Please sign in to remove stocks from your watchlist.",
      };
    }

    const normalizedSymbol = symbol?.trim().toUpperCase();

    if (!normalizedSymbol) {
      return { success: false, error: "Stock symbol is required." };
    }

    await connectToDatabase();

    // Idempotent: if the stock is already absent, the requested state holds.
    await Watchlist.deleteOne({
      userId: user.id,
      symbol: normalizedSymbol,
    });

    revalidatePath("/watchlist");

    return { success: true };
  } catch (err) {
    console.error("removeFromWatchlist error:", err);
    return { success: false, error: "Failed to remove stock from watchlist." };
  }
}

export async function getUserWatchlist() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return [];
    }

    await connectToDatabase();

    const items = await Watchlist.find({ userId: user.id })
      .sort({ addedAt: -1 })
      .lean();

    return items.map((item) => ({
      symbol: String(item.symbol),
      company: String(item.company),
      addedAt: item.addedAt,
    }));
  } catch (err) {
    console.error("getUserWatchlist error:", err);
    return [];
  }
}

export async function getWatchlistWithData(): Promise<StockWithData[]> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return [];
    }

    await connectToDatabase();

    const items = await Watchlist.find({ userId: user.id })
      .sort({ addedAt: -1 })
      .lean();

    if (items.length === 0) return [];

    const enrichedStocks = await Promise.all(
      items.map(async (item) => {
        const symbol = String(item.symbol);
        try {
          const [quote, profile, metrics] = await Promise.all([
            getQuote(symbol),
            getCompanyProfile(symbol),
            getBasicMetrics(symbol),
          ]);

          const currentPrice = quote?.price ?? 0;
          const changePercent = quote?.changePercent ?? 0;
          const peRatio =
            metrics.peBasicExclExtraTTM || metrics.peTTM || 0;

          const priceFormatted = currentPrice > 0 ? formatUsd(currentPrice) : "N/A";
          const changeFormatted = changePercent !== 0 ? formatSignedPercent(changePercent) : "N/A";
          // Finnhub's marketCapitalization is in millions of dollars.
          const marketCapFormatted = formatMarketCap(profile?.marketCapitalization);
          const peFormatted = peRatio > 0 ? peRatio.toFixed(2) : "N/A";

          return {
            userId: user.id,
            symbol,
            company: String(item.company),
            addedAt: item.addedAt,
            currentPrice,
            changePercent,
            priceFormatted,
            changeFormatted,
            marketCap: marketCapFormatted,
            peRatio: peFormatted,
          };
        } catch (err) {
          console.error(`Error fetching data for ${symbol}:`, err);
          return {
            userId: user.id,
            symbol,
            company: String(item.company),
            addedAt: item.addedAt,
            priceFormatted: "N/A",
            changeFormatted: "N/A",
            marketCap: "N/A",
            peRatio: "N/A",
          };
        }
      }),
    );

    return enrichedStocks;
  } catch (err) {
    console.error("getWatchlistWithData error:", err);
    return [];
  }
}
