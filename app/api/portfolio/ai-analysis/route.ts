import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { buildPortfolioSnapshot } from "@/lib/services/portfolioAnalytics.service";

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

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text().catch(() => "");
      console.error("Gemini API error:", geminiResponse.status, errText);
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 502 },
      );
    }

    const geminiData = await geminiResponse.json();
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
