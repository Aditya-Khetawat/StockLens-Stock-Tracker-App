import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";

export const dynamic = "force-dynamic";

const timeout = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));

/**
 * GET /api/health: for uptime monitors. 200 when the database answers a ping
 * within 3 seconds, 503 otherwise (for example, a paused Atlas cluster).
 */
export async function GET() {
  const started = Date.now();
  try {
    await Promise.race([
      connectToDatabase().then((conn) => conn.connection.db!.admin().ping()),
      timeout(3000),
    ]);
    return NextResponse.json(
      { status: "ok", database: "up", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
