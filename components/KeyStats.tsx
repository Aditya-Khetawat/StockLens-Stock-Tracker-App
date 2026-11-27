import { ExternalLink } from "lucide-react";
import { formatMarketCap, formatUsd } from "@/lib/format";

type Profile = {
  exchange?: string;
  finnhubIndustry?: string;
  country?: string;
  ipo?: string;
  weburl?: string;
  marketCapitalization?: number;
} | null;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const pct = (v: number | null, digits = 1) => (v == null ? "—" : `${v.toFixed(digits)}%`);
const fixed = (v: number | null, digits = 2) => (v == null ? "—" : v.toFixed(digits));
const ipoDate = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Native key statistics from Finnhub: the 52-week range with today's price
 * marked on it, then valuation, profitability and company facts.
 */
export default function KeyStats({
  price,
  metrics,
  profile,
}: {
  price: number | null;
  metrics: Record<string, number>;
  profile: Profile;
}) {
  const low = num(metrics["52WeekLow"]);
  const high = num(metrics["52WeekHigh"]);
  const position = price != null && low != null && high != null && high > low
    ? Math.min(1, Math.max(0, (price - low) / (high - low)))
    : null;

  const rows: Array<[string, string]> = [
    ["Market cap", formatMarketCap(profile?.marketCapitalization ?? num(metrics.marketCapitalization))],
    ["P/E (TTM)", fixed(num(metrics.peTTM) ?? num(metrics.peBasicExclExtraTTM))],
    ["EPS (TTM)", num(metrics.epsTTM) == null ? "—" : formatUsd(num(metrics.epsTTM)!)],
    ["Beta", fixed(num(metrics.beta))],
    ["Dividend yield", pct(num(metrics.dividendYieldIndicatedAnnual) ?? num(metrics.currentDividendYieldTTM), 2)],
    ["52-week return", pct(num(metrics["52WeekPriceReturnDaily"]))],
    ["Revenue growth (YoY)", pct(num(metrics.revenueGrowthTTMYoy))],
    ["Net margin", pct(num(metrics.netProfitMarginTTM))],
    ["Return on equity", pct(num(metrics.roeTTM))],
    ["Avg volume (10 day)", num(metrics["10DayAverageTradingVolume"]) == null ? "—" : `${num(metrics["10DayAverageTradingVolume"])!.toFixed(1)}M`],
  ];
  const facts: Array<[string, string]> = [
    ["Industry", profile?.finnhubIndustry ?? "—"],
    ["Exchange", profile?.exchange ?? "—"],
    ["Country", profile?.country ?? "—"],
    ["Listed since", profile?.ipo ? ipoDate.format(new Date(profile.ipo)) : "—"],
  ];

  return (
    <section aria-labelledby="stats-heading" className="sheet overflow-hidden">
      <div className="sheet-head">
        <h2 id="stats-heading" className="sheet-title">
          Key statistics
        </h2>
        <span className="text-xs text-fg-subtle">Finnhub</span>
      </div>

      {low != null && high != null && (
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="caption">52-week range</span>
            {position != null && (
              <span className="text-xs text-fg-subtle">
                {Math.round(position * 100)}% of the way to the high
              </span>
            )}
          </div>
          <div className="relative mt-3 h-1.5 rounded-full bg-raised" aria-hidden="true">
            {position != null && (
              <>
                <span className="absolute inset-y-0 left-0 rounded-full bg-brand/40" style={{ width: `${position * 100}%` }} />
                <span
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand"
                  style={{ left: `${position * 100}%` }}
                />
              </>
            )}
          </div>
          <div className="figure mt-2 flex justify-between text-xs">
            <span className="text-fg-muted">{formatUsd(low)}</span>
            <span className="text-fg-muted">{formatUsd(high)}</span>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={`flex flex-col gap-0.5 border-line px-5 py-3 ${i % 2 === 1 ? "border-l" : ""} ${i > 1 ? "border-t" : ""}`}
          >
            <dt className="caption">{label}</dt>
            <dd className="figure text-sm font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>

      <dl className="flex flex-col gap-2 border-t border-line px-5 py-4 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-fg-subtle">{label}</dt>
            <dd className="truncate text-right text-fg-soft">{value}</dd>
          </div>
        ))}
        {profile?.weburl && (
          <a
            href={profile.weburl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-bright"
          >
            {profile.weburl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </dl>
    </section>
  );
}
