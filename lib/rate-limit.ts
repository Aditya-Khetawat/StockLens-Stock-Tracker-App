import "server-only";

import { headers } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";

// Fixed-window rate limiting stored in MongoDB: one counter document per key
// and window, incremented atomically and deleted by a TTL index afterwards.

export type RateLimitRule = { limit: number; windowSeconds: number };
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

type Counter = { _id: string; count: number; expiresAt: Date };

let indexReady: Promise<unknown> | null = null;

async function counters() {
  const conn = await connectToDatabase();
  const collection = conn.connection.db!.collection<Counter>("rateLimits");
  indexReady ??= collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await indexReady;
  return collection;
}

export async function checkRateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitRule,
  now = Date.now(),
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const id = `${key}:${windowStart}`;
  const collection = await counters();

  const increment = () =>
    collection.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
      { upsert: true, returnDocument: "after" },
    );

  let doc: Counter | null;
  try {
    doc = await increment();
  } catch (err) {
    // Two first requests can race to insert the same counter; the loser retries as an update.
    if ((err as { code?: number }).code !== 11000) throw err;
    doc = await increment();
  }

  const count = doc?.count ?? 1;
  return {
    allowed: count <= limit,
    retryAfterSeconds: Math.ceil((windowStart + windowMs - now) / 1000),
  };
}

/**
 * Client IP for keying anonymous requests. Vercel overwrites x-forwarded-for
 * with the connecting IP, so clients cannot spoof it there. Behind any other
 * proxy, make sure it does the same before relying on these limits.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Limits per action. Generous for real use, tight enough to stop scripted abuse. */
export const RATE_LIMITS = {
  trade: { limit: 30, windowSeconds: 60 },
  aiAnalysis: { limit: 10, windowSeconds: 60 * 60 },
  marketData: { limit: 120, windowSeconds: 60 },
  signUp: { limit: 5, windowSeconds: 60 * 60 },
  signIn: { limit: 10, windowSeconds: 10 * 60 },
  verificationEmail: { limit: 3, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;
