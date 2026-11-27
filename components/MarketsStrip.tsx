import Link from "next/link";
import ChangeText from "@/components/ChangeText";
import { getWatchlistMovers } from "@/lib/services/dashboard.service";
import { formatUsd } from "@/lib/format";

const strip = "border-t border-line/70";

/**
 * The reader's watchlist at a glance: price and the day's move, biggest
 * moves first. Static, never a scrolling ticker.
 */
export default async function MarketsStrip({ userId }: { userId: string }) {
  const movers = await getWatchlistMovers(userId, 12).catch(() => []);

  return (
    <div className={strip}>
      <div className="container">
        {movers.length === 0 ? (
          <p className="flex h-9 items-center text-[0.8125rem] text-fg-subtle">
            Star stocks to follow their prices here.
          </p>
        ) : (
          <ul
            aria-label="Your watchlist today"
            className="scrollbar-hide -mx-4 flex h-9 items-center gap-1 overflow-x-auto px-4 md:mx-0 md:-ml-3 md:px-0"
          >
            {movers.map((m) => (
              <li key={m.symbol} className="flex shrink-0 items-center">
                <Link
                  href={`/stocks/${m.symbol}`}
                  className="flex items-baseline gap-2 rounded-md px-3 py-1 text-[0.8125rem] transition-colors hover:bg-raised"
                >
                  <span className="font-mono text-xs font-semibold tracking-tight text-fg">{m.symbol}</span>
                  <span className="figure text-fg-muted">{formatUsd(m.price)}</span>
                  <ChangeText percent={m.changePercent} className="text-[0.8125rem] font-medium" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MarketsStripSkeleton() {
  return (
    <div className={strip} aria-hidden="true">
      <div className="container flex h-9 items-center gap-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-2.5 w-24 animate-pulse rounded-sm bg-raised" />
        ))}
      </div>
    </div>
  );
}
