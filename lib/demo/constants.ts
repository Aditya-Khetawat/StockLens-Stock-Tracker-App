import { createHmac } from "node:crypto";

// A shared demo account for visitors who want to try the app without signing
// up. The .demo TLD is reserved, so no email can ever be delivered to it.
export const DEMO_EMAIL = "demo@stocklens.demo";
export const DEMO_NAME = "Demo Investor";

/** Permanent starting holdings; their cost basis stays fixed over time. */
export const DEMO_HOLDINGS = [
  { symbol: "AAPL", quantity: 25 },
  { symbol: "MSFT", quantity: 15 },
  { symbol: "NVDA", quantity: 20 },
  { symbol: "JPM", quantity: 30 },
  { symbol: "JNJ", quantity: 20 },
] as const;

export const DEMO_WATCHLIST = [
  { symbol: "AAPL", company: "Apple Inc" },
  { symbol: "MSFT", company: "Microsoft Corp" },
  { symbol: "NVDA", company: "NVIDIA Corp" },
  { symbol: "TSLA", company: "Tesla Inc" },
  { symbol: "AMZN", company: "Amazon.com Inc" },
] as const;

export const isDemoEmail = (email: string) => email.trim().toLowerCase() === DEMO_EMAIL;

/** Derived from the auth secret, so the demo needs no secret of its own. */
export function demoPassword(secret: string): string {
  return createHmac("sha256", secret).update("stocklens-demo-account").digest("base64url");
}
