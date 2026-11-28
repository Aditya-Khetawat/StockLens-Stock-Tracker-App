import Link from "next/link";
import { AlertTriangle, ArrowRight, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import ChangeText from "@/components/ChangeText";
import SearchCommand from "@/components/SearchCommand";
import PortfolioTradeButton from "@/components/PortfolioTradeButton";
import EquityChart from "@/components/EquityChart";
import AllocationColumn from "@/components/dashboard/AllocationColumn";
import MoveBar from "@/components/dashboard/MoveBar";
import { Skeleton } from "@/components/Skeleton";
import { getSessionUser } from "@/lib/better-auth/session";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { getWatchlistMovers } from "@/lib/services/dashboard.service";
import { buildInsights, type Insight } from "@/lib/portfolio/insights";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<Insight["tone"], { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  neutral: { icon: Wallet, className: "bg-raised text-fg-muted" },
  warning: { icon: AlertTriangle, className: "bg-warning/12 text-warning" },
  gain: { icon: ArrowUpRight, className: "bg-gain/12 text-gain" },
  loss: { icon: ArrowDownRight, className: "bg-loss/12 text-loss" },
};

/** The signed-in user's account at a glance. Streams in under Suspense. */
export default async function AccountSummary() {
  const user = (await getSessionUser())!;
  const [portfolio, movers] = await Promise.all([
    getUserPortfolio(user.id),
    getWatchlistMovers(user.id, 6),
  ]);
  const hasPositions = portfolio.positions.length > 0;
  const insights = buildInsights(portfolio);
  const biggestMove = Math.max(1, ...movers.map((m) => Math.abs(m.changePercent ?? 0)));
  const positionsForTrade = portfolio.positions.map((p) => ({ symbol: p.symbol, netQty: p.netQty }));

  return (
    <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-8">
        <section aria-labelledby="account-heading" className="sheet animate-rise overflow-hidden">
          <div className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
              <div className="flex flex-col gap-1.5">
                <h2 id="account-heading" className="caption">
                  Total equity
                </h2>
                <p className="figure text-[2.5rem] leading-none font-semibold tracking-[-0.035em] text-fg md:text-5xl">
                  {formatUsd(portfolio.totalEquity)}
                </p>
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  {portfolio.dayChange ? (
                    <>
                      <ChangeText
                        value={portfolio.dayChange.amount}
                        percent={portfolio.dayChange.percent}
                        className="font-semibold"
                      />
                      <span className="text-fg-subtle">today</span>
                    </>
                  ) : (
                    <span className="text-fg-subtle">
                      {hasPositions ? "No price change yet today" : "Starting balance, all in cash"}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/portfolio" className="btn-secondary">
                  Positions
                </Link>
                <PortfolioTradeButton availableBalance={portfolio.balance} positions={positionsForTrade} />
              </div>
            </div>

            <EquityChart bare />
          </div>

          <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
            <Stat label="Buying power">{formatUsd(portfolio.balance)}</Stat>
            <Stat label="Invested">{formatUsd(portfolio.totalMarketValue)}</Stat>
            <Stat label="Unrealized P&L">
              <ChangeText value={portfolio.totalUnrealizedPnL} />
            </Stat>
            <Stat label="Total return">
              <ChangeText percent={portfolio.totalReturnPercent} />
            </Stat>
          </dl>
          {portfolio.missingPrices.length > 0 && (
            <p className="border-t border-line px-5 py-2 text-xs text-warning md:px-6">
              Excludes {portfolio.missingPrices.join(", ")}: no live price right now.
            </p>
          )}
        </section>

        <section aria-labelledby="allocation-heading" className="sheet animate-rise">
          <div className="sheet-head">
            <h2 id="allocation-heading" className="sheet-title">
              Allocation
            </h2>
            <span className="text-xs text-fg-subtle">
              {portfolio.positions.length} {portfolio.positions.length === 1 ? "holding" : "holdings"} and cash
            </span>
          </div>
          <div className="p-5 md:p-6">
            <AllocationColumn
              slices={portfolio.positions.map((p) => ({ symbol: p.symbol, value: p.marketValue }))}
              cash={portfolio.balance}
              total={portfolio.totalEquity}
            />
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-5 lg:col-span-4">
        <section aria-labelledby="insights-heading" className="sheet animate-rise">
          <div className="sheet-head">
            <h2 id="insights-heading" className="sheet-title">
              Insights
            </h2>
            <span className="text-xs text-fg-subtle">From your positions</span>
          </div>
          <ul className="flex flex-col">
            {insights.map((insight) => {
              const tone = TONE[insight.tone];
              const Icon = tone.icon;
              const body = (
                <>
                  <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", tone.className)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{insight.title}</span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-snug text-fg-subtle">{insight.detail}</span>
                  </span>
                </>
              );
              return (
                <li key={insight.id} className="border-b border-line last:border-b-0">
                  {insight.symbol ? (
                    <Link
                      href={`/stocks/${insight.symbol}`}
                      className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-hover"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-3 px-5 py-3.5">
                      <div className="flex gap-3">{body}</div>
                      {insight.action === "trade" && (
                        <div className="pl-10">
                          <PortfolioTradeButton availableBalance={portfolio.balance} positions={positionsForTrade} variant="secondary" />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="movers-heading" className="sheet animate-rise flex flex-col">
          <div className="sheet-head">
            <h2 id="movers-heading" className="sheet-title">
              Watchlist movers
            </h2>
            <Link href="/watchlist" className="-my-2 flex items-center gap-1 py-2 text-xs font-semibold text-fg-muted hover:text-fg">
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {movers.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-5 py-6">
              <p className="text-sm text-fg-subtle">
                Star the companies you follow and their biggest moves of the day show up here.
              </p>
              <SearchCommand label="Find a stock" triggerClassName="btn-secondary" />
            </div>
          ) : (
            <ul className="flex flex-col py-1">
              {movers.map((m) => (
                <li key={m.symbol}>
                  <Link
                    href={`/stocks/${m.symbol}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-2.5 transition-colors hover:bg-hover"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[0.8125rem] font-semibold text-fg">{m.symbol}</span>
                      <span className="block truncate text-xs text-fg-subtle">{m.company}</span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="figure text-sm font-medium text-fg">{formatUsd(m.price)}</span>
                      <ChangeText percent={m.changePercent} className="text-xs font-semibold" />
                    </span>
                    <MoveBar percent={m.changePercent ?? 0} scale={biggestMove} className="col-span-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line px-5 py-3.5 md:px-6 [&:not(:first-child)]:border-l max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(n+3)]:border-t">
      <dt className="caption">{label}</dt>
      <dd className="figure mt-1 text-base font-semibold text-fg">{children}</dd>
    </div>
  );
}

export function AccountSummarySkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-12" aria-busy="true" aria-label="Loading your account">
      <div className="sheet flex flex-col gap-5 p-5 md:p-6 lg:col-span-8">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="flex flex-col gap-5 lg:col-span-4">
        <div className="sheet flex flex-col gap-3 p-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <div className="sheet flex flex-col gap-3 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    </div>
  );
}
