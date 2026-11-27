import { notFound } from "next/navigation";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import StockTradeButtons from "@/components/StockTradeButtons";
import ChangeText from "@/components/ChangeText";
import {
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { getCompanyProfile, getQuote } from "@/lib/finnhub/client";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import { getSessionUser } from "@/lib/better-auth/session";
import { getHolding } from "@/lib/services/portfolio.service";
import { formatUsd } from "@/lib/format";

const SYMBOL = /^[A-Z0-9.\-]{1,15}$/;

export async function generateMetadata({ params }: StockDetailsPageProps) {
  return { title: decodeURIComponent((await params).symbol).toUpperCase() };
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const symbol = decodeURIComponent((await params).symbol).trim().toUpperCase();
  if (!SYMBOL.test(symbol)) notFound();
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  // The layout has already redirected signed-out visitors.
  const user = (await getSessionUser())!;
  const [profile, quote, watchlist, account] = await Promise.all([
    getCompanyProfile(symbol).catch(() => null),
    getQuote(symbol).catch(() => null),
    getUserWatchlist(),
    getHolding(user.id, symbol),
  ]);

  const companyName = profile?.name || symbol;
  const isInWatchlist = watchlist.some((item) => item.symbol.toUpperCase() === symbol);
  const holding = account.holding;
  const marketValue = holding && quote ? holding.quantity * quote.price : null;
  const unrealized = holding && quote ? (quote.price - holding.avgCost) * holding.quantity : null;

  return (
    <div className="flex flex-col gap-8 min-h-screen p-4 md:p-6 lg:p-8">
      <section
        aria-labelledby="stock-heading"
        className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-4 md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 id="stock-heading" className="text-2xl md:text-3xl font-bold text-fg">
              {companyName}
            </h1>
            <p className="text-sm text-fg-muted">
              {symbol}
              {profile?.exchange ? ` · ${profile.exchange}` : ""}
            </p>
            {quote ? (
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-semibold text-fg tabular-nums">
                  {formatUsd(quote.price)}
                </span>
                <ChangeText value={quote.change} percent={quote.changePercent} className="text-base font-medium" />
                <span className="text-xs text-fg-subtle">
                  {quote.stale ? "Delayed: live price unavailable" : "Today"}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-fg-muted">Price unavailable right now.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StockTradeButtons symbol={symbol} cash={account.cash} ownedQty={holding?.quantity ?? 0} />
            <WatchlistButton
              symbol={symbol}
              company={companyName}
              isInWatchlist={isInWatchlist}
              type="icon"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:border-brand"
            />
          </div>
        </div>

        {holding && (
          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-fg-muted">Your shares</dt>
              <dd className="text-lg font-semibold text-fg tabular-nums">{holding.quantity}</dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted">Average cost</dt>
              <dd className="text-lg font-semibold text-fg tabular-nums">{formatUsd(holding.avgCost)}</dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted">Market value</dt>
              <dd className="text-lg font-semibold text-fg tabular-nums">
                {marketValue != null ? formatUsd(marketValue) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted">Unrealized P&amp;L</dt>
              <dd className="text-lg font-semibold">
                {unrealized != null ? <ChangeText value={unrealized} /> : "—"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
          />
        </div>
      </section>
    </div>
  );
}
