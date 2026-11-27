import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { setNewsOptOut } from "@/lib/data/users";

async function unsubscribe(request: NextRequest): Promise<boolean> {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const userId = verifyUnsubscribeToken(token, process.env.BETTER_AUTH_SECRET!);
  return userId ? setNewsOptOut(userId) : false;
}

const page = (message: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StockLens</title></head><body style="font-family:system-ui,sans-serif;background:#050505;color:#e5e7eb;display:grid;place-items:center;min-height:100vh;margin:0"><p>${message}</p></body></html>`;

// Link clicked in the email footer.
export async function GET(request: NextRequest) {
  const ok = await unsubscribe(request);
  return new NextResponse(
    page(ok ? "You have been unsubscribed from the daily news email." : "This unsubscribe link is invalid."),
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

// One-click unsubscribe from the mail client (RFC 8058).
export async function POST(request: NextRequest) {
  const ok = await unsubscribe(request);
  return NextResponse.json({ success: ok }, { status: ok ? 200 : 400 });
}
