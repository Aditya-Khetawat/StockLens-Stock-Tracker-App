import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { buildPortfolioSnapshot } from "@/lib/services/portfolioAnalytics.service";
import { HttpError, withRetry } from "@/lib/net/retry";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

interface GeminiAnalysis {
  summary: string;
  riskAnalysis: string;
  diversification: string;
  suggestions: string[];
  concentrationRiskLevel: "LOW" | "MEDIUM" | "HIGH";
}

/**
 * GET /api/portfolio/ai-analysis
 *
 * Returns a Gemini-generated portfolio analysis as structured JSON.
 * Stateless – no database writes or background jobs.
 */
export async function GET() {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Each analysis is a paid model call.
    const limit = await checkRateLimit(`ai:${userId}`, RATE_LIMITS.aiAnalysis);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Analysis limit reached. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    // ── Snapshot ──────────────────────────────────────────────────────────────
    const snapshot = await buildPortfolioSnapshot(userId);

    const hasNoPositions =
      snapshot.largestPosition === null &&
      snapshot.sectorBreakdown.length === 0;

    if (hasNoPositions) {
      return NextResponse.json(
        { error: "No active positions in portfolio" },
        { status: 400 },
      );
    }

    // ── Gemini prompt ─────────────────────────────────────────────────────────
    const snapshotJson = JSON.stringify(snapshot, null, 2);

    const prompt = `You are a professional portfolio analyst.

Analyze the following simulated portfolio snapshot.

Return ONLY valid JSON in this exact format:

{
  "summary": "2-3 sentence professional overview",
  "riskAnalysis": "Discuss concentration risk, volatility, and cash exposure.",
  "diversification": "Evaluate sector distribution and single-position exposure.",
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2"]
}

No markdown.
No extra text.
No code blocks.

Important: totalReturnPct is already expressed as a percentage value (e.g., 0.39 means 0.39%, not 39%).
Important: volatility and sharpeRatio come from daily account snapshots. When they are null, the account has only riskHistoryDays of the riskHistoryDaysRequired days of history: say that risk-adjusted metrics are not available yet. Never estimate or invent them.

Portfolio snapshot:
${snapshotJson}`;

    // ── Gemini API call ───────────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 },
      );
    }

    // Gemini regularly answers 503 "high demand"; retry with backoff first.
    let geminiData;
    try {
      geminiData = await withRetry(
        async () => {
          const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
              },
            }),
          });
          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new HttpError(res.status, `Gemini ${res.status}: ${errText.slice(0, 300)}`);
          }
          return res.json();
        },
        { retries: 3, baseDelayMs: 800 },
      );
    } catch (err) {
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "The AI service is busy. Please try again in a minute." },
        { status: 503 },
      );
    }
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    // ── Parse response ────────────────────────────────────────────────────────
    // Strip wrapping code fences (```json ... ``` or ``` ... ```) if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: GeminiAnalysis;
    try {
      parsed = JSON.parse(cleaned) as GeminiAnalysis;

      if (
        typeof parsed.summary !== "string" ||
        typeof parsed.riskAnalysis !== "string" ||
        typeof parsed.diversification !== "string" ||
        !Array.isArray(parsed.suggestions)
      ) {
        throw new Error("Invalid AI response structure");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Raw Gemini output:", rawText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...parsed,
      concentrationRiskLevel: snapshot.concentrationRiskLevel,
    });
  } catch (error) {
    console.error("Error in /api/portfolio/ai-analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
