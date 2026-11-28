import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, History } from "lucide-react";
import { getSessionUser } from "@/lib/better-auth/session";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import PortfolioTradeButton from "@/components/PortfolioTradeButton";
import PositionSellButton from "@/components/PositionSellButton";
import EquityChart from "@/components/EquityChart";
import AIPortfolioAnalysis from "@/components/AIPortfolioAnalysis";
import ChangeText from "@/components/ChangeText";
import SearchCommand from "@/components/SearchCommand";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Portfolio" };

const th = "px-4 py-2.5 text-xs font-medium whitespace-nowrap text-fg-subtle";

export default async function Portfolio() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const portfolio = await getUserPortfolio(user.id);
  const positions = [...portfolio.positions].sort((a, b) => b.marketValue - a.marketValue);
  const tradePositions = positions.map((p) => ({ symbol: p.symbol, netQty: p.netQty }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="mt-1 text-sm text-fg-subtle">
            {positions.length} {positions.length === 1 ? "position" : "positions"} · valued at live prices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portfolio/history" className="btn-secondary">
            <History className="h-4 w-4" aria-hidden="true" />
            History
          </Link>
          <PortfolioTradeButton availableBalance={portfolio.balance} positions={tradePositions} />
        </div>
      </div>

      <dl className="sheet grid grid-cols-2 lg:grid-cols-4">
        <Stat label="Total equity">{formatUsd(portfolio.totalEquity)}</Stat>
        <Stat label="Buying power">{formatUsd(portfolio.balance)}</Stat>
        <Stat label="Market value">{formatUsd(portfolio.totalMarketValue)}</Stat>
        <Stat label="Total return">
          <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <ChangeText value={portfolio.totalReturn} />
            <ChangeText percent={portfolio.totalReturnPercent} className="text-sm font-medium" />
          </span>
        </Stat>
      </dl>

      <section aria-labelledby="performance-heading" className="sheet p-5 md:p-6">
        <h2 id="performance-heading" className="sheet-title mb-3">
          Performance
        </h2>
        <EquityChart bare />
      </section>

      <section aria-labelledby="positions-heading" className="sheet overflow-hidden">
        <div className="sheet-head">
          <h2 id="positions-heading" className="sheet-title">
            Positions
          </h2>
          {positions.length > 0 && (
            <p className="text-xs text-fg-subtle">
              Unrealized <ChangeText value={portfolio.totalUnrealizedPnL} className="text-xs font-semibold" />
            </p>
          )}
        </div>

        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-raised text-fg-muted">
              <Briefcase className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="max-w-md">
              <p className="font-medium text-fg">No positions yet</p>
              <p className="mt-1 text-sm text-fg-subtle">
                You have {formatUsd(portfolio.balance)} of buying power. Research a company first, or place an order at
                the live price.
              </p>
            </div>
            <SearchCommand label="Find a stock" renderAs="button" triggerClassName="btn-secondary" />
          </div>
        ) : (
          <>
          {/* Phones and tablets: one stacked row per position instead of a wide table. */}
          <ul className="divide-y divide-line lg:hidden">
            {positions.map((p) => (
              <li key={p.symbol} className="flex flex-col gap-2.5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/stocks/${p.symbol}`} className="-my-1 py-1">
                    <span className="block font-mono text-sm font-semibold text-fg">{p.symbol}</span>
                    <span className="figure block text-xs text-fg-subtle">
                      {p.netQty.toLocaleString("en-US")} shares · avg {formatUsd(p.avgCost)}
                    </span>
                  </Link>
                  <div className="text-right">
                    <span className="figure block font-semibold text-fg">{formatUsd(p.marketValue)}</span>
                    <ChangeText value={p.unrealizedPnL} percent={p.gainPercent} className="text-xs font-medium" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-hidden="true">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, p.allocationPercent)}%` }} />
                  </span>
                  <span className="figure w-12 text-right text-xs text-fg-muted">{p.allocationPercent.toFixed(1)}%</span>
                  <PositionSellButton symbol={p.symbol} availableBalance={portfolio.balance} netQty={p.netQty} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Open positions, largest first</caption>
              <thead className="border-b border-line bg-canvas/40">
                <tr>
                  <th scope="col" className={`${th} pl-5 text-left`}>Symbol</th>
                  <th scope="col" className={`${th} text-right`}>Shares</th>
                  <th scope="col" className={`${th} text-right`}>Avg cost</th>
                  <th scope="col" className={`${th} text-right`}>Price</th>
                  <th scope="col" className={`${th} text-right`}>Market value</th>
                  <th scope="col" className={`${th} text-right`}>Unrealized P&amp;L</th>
                  <th scope="col" className={`${th} w-44 text-left`}>Allocation</th>
                  <th scope="col" className={`${th} pr-5 text-right`}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.symbol} className="group border-b border-line transition-colors last:border-b-0 hover:bg-hover">
                    <td className="py-3 pr-4 pl-5">
                      <Link href={`/stocks/${p.symbol}`} className="font-mono text-[0.8125rem] font-semibold text-fg hover:text-brand">
                        {p.symbol}
                      </Link>
                    </td>
                    <td className="figure px-4 py-3 text-right text-fg-soft">{p.netQty.toLocaleString("en-US")}</td>
                    <td className="figure px-4 py-3 text-right text-fg-soft">{formatUsd(p.avgCost)}</td>
                    <td className="figure px-4 py-3 text-right text-fg">{formatUsd(p.currentPrice)}</td>
                    <td className="figure px-4 py-3 text-right font-medium text-fg">{formatUsd(p.marketValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <ChangeText value={p.unrealizedPnL} percent={p.gainPercent} className="text-[0.8125rem] font-medium" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-hidden="true">
                          <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, p.allocationPercent)}%` }} />
                        </span>
                        <span className="figure w-12 text-right text-xs text-fg-muted">{p.allocationPercent.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-5 pl-4 text-right">
                      <PositionSellButton symbol={p.symbol} availableBalance={portfolio.balance} netQty={p.netQty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        {portfolio.missingPrices.length > 0 && (
          <p className="border-t border-line px-5 py-2.5 text-xs text-warning">
            {portfolio.missingPrices.join(", ")} {portfolio.missingPrices.length === 1 ? "has" : "have"} no live price right
            now and {portfolio.missingPrices.length === 1 ? "is" : "are"} left out of the totals.
          </p>
        )}
      </section>

      <AIPortfolioAnalysis hasPositions={positions.length > 0} />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line px-5 py-4 [&:not(:first-child)]:border-l max-lg:[&:nth-child(3)]:border-l-0 max-lg:[&:nth-child(n+3)]:border-t">
      <dt className="caption">{label}</dt>
      <dd className="figure mt-1 text-xl font-semibold tracking-tight text-fg">{children}</dd>
    </div>
  );
}
