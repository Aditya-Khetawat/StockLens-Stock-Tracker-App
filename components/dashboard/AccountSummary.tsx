import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import ChangeText from "@/components/ChangeText";
import SearchCommand from "@/components/SearchCommand";
import { getSessionUser } from "@/lib/better-auth/session";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import { getWatchlistMovers } from "@/lib/services/dashboard.service";
import { formatUsd } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";

const panel = "flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 md:p-6";

/** The signed-in user's account at a glance. Streams in under Suspense. */
export default async function AccountSummary() {
  const user = (await getSessionUser())!;
  const [portfolio, movers] = await Promise.all([
    getUserPortfolio(user.id),
    getWatchlistMovers(user.id, 5),
  ]);
  const hasPositions = portfolio.positions.length > 0;

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-5">
      <section aria-labelledby="account-heading" className={`${panel} lg:col-span-3`}>
        <div className="flex items-center justify-between gap-4">
          <h2 id="account-heading" className="text-lg font-semibold text-fg">
            Your account
          </h2>
          <Link
            href="/portfolio"
            className="flex items-center gap-1 text-sm text-fg-muted hover:text-brand transition-colors"
          >
            Portfolio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-3xl md:text-4xl font-semibold text-fg tabular-nums">
            {formatUsd(portfolio.totalEquity)}
          </p>
          {portfolio.dayChange ? (
            <p className="text-base font-medium">
              <ChangeText value={portfolio.dayChange.amount} percent={portfolio.dayChange.percent} />
              <span className="ml-2 text-sm text-fg-subtle">today</span>
            </p>
          ) : (
            <p className="text-sm text-fg-subtle">
              {hasPositions ? "No price change yet today" : "Total equity"}
            </p>
          )}
        </div>

        <dl className="mt-auto grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-fg-muted">Cash</dt>
            <dd className="text-lg font-semibold text-fg tabular-nums">{formatUsd(portfolio.balance)}</dd>
          </div>
          <div>
            <dt className="text-sm text-fg-muted">Invested</dt>
            <dd className="text-lg font-semibold text-fg tabular-nums">
              {formatUsd(portfolio.totalMarketValue)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-fg-muted">Total return</dt>
            <dd className="text-lg font-semibold">
              <ChangeText value={portfolio.totalReturn} percent={portfolio.totalReturnPercent} />
            </dd>
          </div>
        </dl>

        {!hasPositions && (
          <p className="text-sm text-fg-muted">
            You have {formatUsd(portfolio.balance)} in virtual cash.{" "}
            <Link href="/portfolio" className="font-medium text-brand hover:underline underline-offset-4">
              Place your first trade
            </Link>
            .
          </p>
        )}
        {portfolio.missingPrices.length > 0 && (
          <p className="text-xs text-fg-subtle">
            Excludes {portfolio.missingPrices.join(", ")}: no price available right now.
          </p>
        )}
      </section>

      <section aria-labelledby="movers-heading" className={`${panel} lg:col-span-2`}>
        <div className="flex items-center justify-between gap-4">
          <h2 id="movers-heading" className="text-lg font-semibold text-fg">
            Watchlist movers
          </h2>
          <Link
            href="/watchlist"
            className="flex items-center gap-1 text-sm text-fg-muted hover:text-brand transition-colors"
          >
            Watchlist
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {movers.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-4">
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <Star className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
              Star stocks to see their biggest moves here.
            </p>
            <SearchCommand label="Find stocks" />
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-raised">
            {movers.map((m) => (
              <li key={m.symbol}>
                <Link
                  href={`/stocks/${m.symbol}`}
                  className="flex items-center justify-between gap-4 py-2.5 rounded hover:bg-raised/40 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-fg">{m.symbol}</span>
                    <span className="block truncate text-xs text-fg-subtle">{m.company}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-fg tabular-nums">{formatUsd(m.price)}</span>
                    <ChangeText percent={m.changePercent} className="text-sm" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AccountSummarySkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-5" aria-busy="true" aria-label="Loading your account">
      <div className={`${panel} lg:col-span-3`}>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-3 gap-4 border-t border-line pt-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
      <div className={`${panel} lg:col-span-2`}>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
