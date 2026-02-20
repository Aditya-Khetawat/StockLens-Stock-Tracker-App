import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { executeTrade } from "@/lib/services/trade.service";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { symbol, type, quantity } = body;

    // Validate inputs
    if (!symbol || typeof symbol !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid symbol" },
        { status: 400 },
      );
    }

    if (!type || (type !== "BUY" && type !== "SELL")) {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be BUY or SELL" },
        { status: 400 },
      );
    }

    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid quantity. Must be a positive number",
        },
        { status: 400 },
      );
    }

    // Execute trade
    const result = await executeTrade(session.user.id, symbol, type, quantity);

    // Return result
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Trade API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Trade execution failed",
      },
      { status: 500 },
    );
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 },
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 },
  );
}
