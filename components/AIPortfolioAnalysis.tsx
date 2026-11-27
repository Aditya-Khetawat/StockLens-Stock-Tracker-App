"use client";

import { useState } from "react";
import { Loader2, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { cn } from "@/lib/utils";

interface GeminiAnalysis {
  summary: string;
  riskAnalysis: string;
  diversification: string;
  suggestions: string[];
  concentrationRiskLevel?: "LOW" | "MEDIUM" | "HIGH";
}

const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
const RISK_STYLE: Record<(typeof RISK_LEVELS)[number], string> = {
  LOW: "bg-gain",
  MEDIUM: "bg-warning",
  HIGH: "bg-loss",
};

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** On-demand AI review of the portfolio, presented as a structured brief. */
export default function AIPortfolioAnalysis({ hasPositions = true }: { hasPositions?: boolean }) {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  async function fetchAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/portfolio/ai-analysis");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          response.status === 400
            ? "Buy at least one stock first: the review analyses your open positions."
            : data?.error ?? "The analysis could not be generated. Please try again.",
        );
        return;
      }
      setAnalysis(data as GeminiAnalysis);
      setGeneratedAt(new Date());
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const level = analysis?.concentrationRiskLevel;

  return (
    <section aria-labelledby="ai-heading" className="sheet overflow-hidden">
      <div className="sheet-head">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/12 text-brand">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="ai-heading" className="sheet-title">
              AI portfolio review
            </h2>
            <p className="text-xs text-fg-subtle">
              {generatedAt ? `Generated at ${time.format(generatedAt)} by Gemini` : "Risk, diversification and next steps, from your live positions"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchAnalysis}
          disabled={loading || !hasPositions}
          className="btn-secondary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : analysis ? (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? "Analysing…" : analysis ? "Refresh" : "Generate review"}
        </button>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {loading && !analysis ? (
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/5" />
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-fg">{error}</p>
              {hasPositions && (
                <button type="button" onClick={fetchAnalysis} className="w-fit text-sm font-semibold text-brand hover:text-brand-bright">
                  Try again
                </button>
              )}
            </div>
          </div>
        ) : analysis ? (
          <div className={cn("flex flex-col", loading && "opacity-60 transition-opacity")}>
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:gap-8">
              <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed text-fg-soft">{analysis.summary}</p>
              {level && (
                <div className="shrink-0 md:w-48">
                  <p className="caption">Concentration risk</p>
                  <div className="mt-2 flex gap-1" aria-hidden="true">
                    {RISK_LEVELS.map((l, i) => (
                      <span
                        key={l}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i <= RISK_LEVELS.indexOf(level) ? RISK_STYLE[level] : "bg-raised",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-fg">
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </p>
                </div>
              )}
            </div>

            <div className="grid border-t border-line md:grid-cols-2">
              <Finding title="Risk">{analysis.riskAnalysis}</Finding>
              <Finding title="Diversification" className="max-md:border-t md:border-l">
                {analysis.diversification}
              </Finding>
            </div>

            {analysis.suggestions.length > 0 && (
              <div className="border-t border-line p-5">
                <h3 className="caption">Worth considering</h3>
                <ol className="mt-3 flex flex-col gap-2.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-fg-soft">
                      <span className="figure mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-raised text-xs font-semibold text-fg-muted">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="border-t border-line px-5 py-2.5 text-xs text-fg-subtle">
              AI-generated from your paper portfolio. Educational only, not financial advice.
            </p>
          </div>
        ) : (
          <p className="p-5 text-sm text-fg-subtle">
            {hasPositions
              ? "Generate a review to see how concentrated your portfolio is, how it is spread across sectors, and what to look at next."
              : "Your review becomes available once you own at least one stock."}
          </p>
        )}
      </div>
    </section>
  );
}

function Finding({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-line p-5", className)}>
      <h3 className="caption">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-soft">{children}</p>
    </div>
  );
}
