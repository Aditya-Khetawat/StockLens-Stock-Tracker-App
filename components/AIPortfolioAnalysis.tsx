"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface GeminiAnalysis {
  summary: string;
  riskAnalysis: string;
  diversification: string;
  suggestions: string[];
  concentrationRiskLevel?: "LOW" | "MEDIUM" | "HIGH";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIPortfolioAnalysis() {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  async function fetchAnalysis() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/ai-analysis");

      if (response.status === 401) {
        setError("You must be signed in to generate an analysis.");
        return;
      }

      if (response.status === 400) {
        setError("No active positions found in your portfolio.");
        return;
      }

      if (!response.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data: GeminiAnalysis = await response.json();
      setAnalysis(data);
      setGeneratedAt(new Date());
    } catch {
      setError("Failed to connect to the AI service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          AI Portfolio Analysis
        </h2>
        <p className="text-sm text-muted-foreground">
          Generate an AI-powered analysis of your current portfolio allocation
          and risk profile.
        </p>
      </div>

      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <Button
        onClick={fetchAnalysis}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 h-10 rounded-md text-sm shadow-sm hover:shadow-md transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : analysis ? (
          "Regenerate Analysis"
        ) : (
          "Generate Analysis"
        )}
      </Button>

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      {/* ── Analysis result ────────────────────────────────────────────── */}
      {generatedAt && (
        <p className="text-xs text-muted-foreground">
          Generated {generatedAt.toLocaleTimeString()}
        </p>
      )}

      {/* ── Concentration risk badge ───────────────────────────────────── */}
      {analysis?.concentrationRiskLevel && (
        <div>
          {analysis.concentrationRiskLevel === "HIGH" && (
            <span className="text-loss-soft bg-loss/10 px-3 py-1 rounded-md text-xs font-medium">
              🔴 Concentration Risk: HIGH
            </span>
          )}
          {analysis.concentrationRiskLevel === "MEDIUM" && (
            <span className="text-brand-bright bg-brand/10 px-3 py-1 rounded-md text-xs font-medium">
              🟡 Concentration Risk: MEDIUM
            </span>
          )}
          {analysis.concentrationRiskLevel === "LOW" && (
            <span className="text-gain-soft bg-gain/10 px-3 py-1 rounded-md text-xs font-medium">
              🟢 Concentration Risk: LOW
            </span>
          )}
        </div>
      )}

      {analysis && (
        <div className="relative">
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-blue-500/70" />
          <Card className="bg-surface border-line shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
            <CardHeader className="pb-4 border-b border-line">
              <CardTitle className="text-base font-semibold tracking-tight text-fg">
                🧠AI Portfolio Intelligence
              </CardTitle>
              <CardDescription className="text-xs text-fg-muted">
                Narrative analysis generated from structured portfolio metrics.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Summary */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Summary
                </p>
                <p className="text-sm leading-relaxed text-fg">
                  {analysis.summary}
                </p>
              </div>

              <hr className="border-line" />

              {/* Risk Analysis */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Risk Analysis
                </p>
                <p className="text-sm leading-relaxed text-fg">
                  {analysis.riskAnalysis}
                </p>
              </div>

              <hr className="border-line" />

              {/* Diversification */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Diversification
                </p>
                <p className="text-sm leading-relaxed text-fg">
                  {analysis.diversification}
                </p>
              </div>

              <hr className="border-line" />

              {/* Suggestions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Suggestions
                </p>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-fg"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
