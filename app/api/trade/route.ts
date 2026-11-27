import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/better-auth/session";
import { executeTrade } from "@/lib/services/trade.service";
import { parseTradeRequest } from "@/lib/trading/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Other HTTP methods get an automatic 405 from Next.js.
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const limit = await checkRateLimit(`trade:${user.id}`, RATE_LIMITS.trade);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many orders. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseTradeRequest(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const result = await executeTrade(user.id, parsed.data);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
