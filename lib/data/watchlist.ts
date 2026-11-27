import "server-only";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

// Server-only lookups used by trusted code (pages, background jobs).
// Never re-export these from a "use server" file: they take a user id or
// email from the caller and do no authorization of their own.

export async function getWatchlistSymbolsByUserId(
  userId: string,
): Promise<string[]> {
  if (!userId) return [];
  await connectToDatabase();
  const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
  return items.map((i) => String(i.symbol));
}

export async function getWatchlistSymbolsByEmail(
  email: string,
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Better Auth stores users in the "user" collection.
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string }>({ email });
    if (!user) return [];

    const userId = user.id || String(user._id || "");
    return getWatchlistSymbolsByUserId(userId);
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}
