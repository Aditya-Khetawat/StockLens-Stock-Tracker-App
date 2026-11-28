import { notFound } from "next/navigation";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import StockTradeButtons from "@/components/StockTradeButtons";
import ChangeText from "@/components/ChangeText";
import {
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
} from "@/lib/constants";
import { getBasicMetrics, getCompanyProfile, getQuote } from "@/lib/finnhub/client";
import KeyStats from "@/components/KeyStats";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import { getSessionUser } from "@/lib/better-auth/session";
import { getHolding } from "@/lib/services/portfolio.service";
import { formatMarketCap, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const SYMBOL = /^[A-Z0-9.\-]{1,15}$/;
const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

export async function generateMetadata({ params }: StockDetailsPageProps) {
  return { title: decodeURIComponent((await params).symbol).toUpperCase() };
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const symbol = decodeURIComponent((await params).symbol).trim().toUpperCase();
  if (!SYMBOL.test(symbol)) notFound();

  // The layout has already redirected signed-out visitors.
  const user = (await getSessionUser())!;
  const [profile, quote, watchlist, account, metrics] = await Promise.all([
    getCompanyProfile(symbol).catch(() => null),
    getQuote(symbol).catch(() => null),
    getUserWatchlist(),
    getHolding(user.id, symbol),
    getBasicMetrics(symbol).catch(() => ({}) as Record<string, number>),
  ]);

  const companyName = profile?.name || symbol;
  const isInWatchlist = watchlist.some((item) => item.symbol.toUpperCase() === symbol);
  const holding = account.holding;
  const marketValue = holding && quote ? holding.quantity * quote.price : null;
  const unrealized = holding && quote ? (quote.price - holding.avgCost) * holding.quantity : null;
  const unrealizedPct = holding && quote && holding.avgCost > 0 ? ((quote.price - holding.avgCost) / holding.avgCost) * 100 : null;
  const facts = [
    profile?.exchange && { label: "Exchange", value: profile.exchange },
    profile?.finnhubIndustry && { label: "Industry", value: profile.finnhubIndustry },
    profile?.marketCapitalization && { label: "Market cap", value: formatMarketCap(profile.marketCapitalization) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="stock-heading" className="sheet overflow-hidden">
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-end md:justify-between md:p-7">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1
                id="stock-heading"
                className="text-[1.75rem] leading-tight font-semibold tracking-tight text-fg"
              >
                {companyName}
              </h1>
              <span className="rounded-sm border border-line-strong px-1.5 py-0.5 text-xs font-bold tracking-wide text-fg-soft">
                {symbol}
              </span>
            </div>

            {quote ? (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span
                  className={cn(
                    "figure text-[2.5rem] leading-none font-semibold tracking-[-0.03em] text-fg md:text-[3rem]",
                    // A stale price is drawn dashed: form, not colour, carries the state.
                    quote.stale && "underline decoration-line-strong decoration-dashed decoration-2 underline-offset-8",
                  )}
                >
                  {formatUsd(quote.price)}
                </span>
                <ChangeText value={quote.change} percent={quote.changePercent} className="text-lg font-semibold" />
                <span className="text-sm text-fg-muted">
                  {quote.stale ? "Delayed price: live feed unavailable" : "today"}
                </span>
              </div>
            ) : (
              <p className="text-fg-muted">No live price for {symbol} right now.</p>
            )}

            {facts.length > 0 && (
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {facts.map((f) => (
                  <div key={f.label} className="flex gap-1.5">
                    <dt className="text-fg-subtle">{f.label}</dt>
                    <dd className="font-medium text-fg-soft">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StockTradeButtons symbol={symbol} cash={account.cash} ownedQty={holding?.quantity ?? 0} />
            <WatchlistButton
              symbol={symbol}
              company={companyName}
              isInWatchlist={isInWatchlist}
              type="icon"
              className="h-10 w-10 border border-line-strong bg-surface hover:bg-raised"
            />
          </div>
        </div>

        <div className="border-t border-line bg-raised/40">
          {holding ? (
            <dl className="grid grid-cols-2 md:grid-cols-4">
              <PositionFact label="Your shares">{holding.quantity}</PositionFact>
              <PositionFact label="Average cost">{formatUsd(holding.avgCost)}</PositionFact>
              <PositionFact label="Market value">{marketValue != null ? formatUsd(marketValue) : "—"}</PositionFact>
              <PositionFact label="Unrealized P&L">
                {unrealized != null ? (
                  <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                    <ChangeText value={unrealized} />
                    <ChangeText percent={unrealizedPct} className="text-sm font-medium" />
                  </span>
                ) : (
                  "—"
                )}
              </PositionFact>
            </dl>
          ) : (
            <p className="px-5 py-3 text-sm text-fg-muted md:px-7">
              You don&apos;t own {symbol}. You have{" "}
              <span className="figure font-semibold text-fg">{formatUsd(account.cash)}</span> in cash to buy with.
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <TradingViewWidget
            title="Price chart"
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={560}
          />
          <TradingViewWidget
            title="Performance"
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={420}
          />
        </div>
        <div className="flex flex-col gap-6">
          {/* Native, fully themed: TradingView's profile and financials embeds
              either never render or ignore the dark theme. */}
          <KeyStats price={quote?.price ?? null} metrics={metrics} profile={profile} />
        </div>
      </div>
    </div>
  );
}

function PositionFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line px-5 py-3.5 md:px-7 [&:not(:first-child)]:border-l max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(n+3)]:border-t">
      <dt className="caption">{label}</dt>
      <dd className="figure mt-0.5 text-lg font-semibold text-fg">{children}</dd>
    </div>
  );
}
