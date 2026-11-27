import { getSessionUser } from "@/lib/better-auth/session";
import { getQuote } from "@/lib/finnhub/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SYMBOL = /^[A-Z0-9.\-]{1,15}$/;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/**
 * GET /api/quote?symbol=AAPL: the live price for the trade dialog.
 * A GET route rather than a server action so the dialog can cancel a lookup
 * when the symbol changes (server actions from one client run one at a time).
 * Stale fallback prices are never served here, matching trade execution.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return json({ error: "Please sign in." }, 401);

  const limit = await checkRateLimit(`market:${user.id}`, RATE_LIMITS.marketData);
  if (!limit.allowed) {
    return json({ error: "Too many requests. Please slow down." }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const symbol = (new URL(request.url).searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!SYMBOL.test(symbol)) return json({ error: "Invalid symbol." }, 400);

  try {
    const quote = await getQuote(symbol);
    if (!quote) return json({ error: "No price for this symbol." }, 404);
    if (quote.stale) return json({ error: "Live price unavailable. Please try again shortly." }, 503);
    return json({ symbol, price: quote.price, changePercent: quote.changePercent });
  } catch (err) {
    console.error("Quote lookup failed:", err);
    return json({ error: "Price service unavailable." }, 503);
  }
}
