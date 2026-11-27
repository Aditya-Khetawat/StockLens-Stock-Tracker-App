import { getSessionUser } from "@/lib/better-auth/session";
import { getUserPortfolio } from "@/lib/services/portfolio.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  History,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import PortfolioTradeButton from "@/components/PortfolioTradeButton";
import PositionSellButton from "@/components/PositionSellButton";
import EquityChart from "@/components/EquityChart";
import AIPortfolioAnalysis from "@/components/AIPortfolioAnalysis";
import ChangeText from "@/components/ChangeText";
import SearchCommand from "@/components/SearchCommand";
import { formatUsd } from "@/lib/format";

export const metadata = { title: "Portfolio" };

const Portfolio = async () => {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const portfolio = await getUserPortfolio(user.id);

  const formatCurrency = formatUsd;

  const isPositive = (value: number) => value >= 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <h1 className="watchlist-title">Portfolio</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/portfolio/history"
            className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            History
          </Link>
          <PortfolioTradeButton
            availableBalance={portfolio.balance}
            positions={portfolio.positions.map((p) => ({
              symbol: p.symbol,
              netQty: p.netQty,
            }))}
          />
        </div>
      </div>

      <EquityChart />

      <AIPortfolioAnalysis />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Cash Balance Card */}
        <Card className="bg-surface border-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-fg-muted">
              Cash Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-fg-subtle" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg tabular-nums">
              {formatCurrency(portfolio.balance)}
            </div>
          </CardContent>
        </Card>

        {/* Total Market Value Card */}
        <Card className="bg-surface border-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-fg-muted">
              Total Market Value
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-fg-subtle" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg tabular-nums">
              {formatCurrency(portfolio.totalMarketValue)}
            </div>
          </CardContent>
        </Card>

        {/* Total Equity Card */}
        <Card className="bg-surface border-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-fg-muted">
              Total Equity
            </CardTitle>
            <PiggyBank className="h-5 w-5 text-fg-subtle" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg tabular-nums">
              {formatCurrency(portfolio.totalEquity)}
            </div>
          </CardContent>
        </Card>

        {/* Total Return Card */}
        <Card className="bg-surface border-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-fg-muted">
              Total Return
            </CardTitle>
            {isPositive(portfolio.totalReturn) ? (
              <TrendingUp className="h-5 w-5 text-gain" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-5 w-5 text-loss" aria-hidden="true" />
            )}
          </CardHeader>
          <CardContent>
            <ChangeText value={portfolio.totalReturn} className="text-2xl font-bold" />
            <p className="mt-1">
              <ChangeText percent={portfolio.totalReturnPercent} className="text-sm font-medium" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        <div className="p-4 md:p-6 border-b border-line">
          <h2 className="text-lg md:text-xl font-bold text-fg">
            Active Positions
          </h2>
        </div>

        {portfolio.positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 px-6 py-14 text-center">
            <TrendingUp className="h-12 w-12 text-fg-subtle" aria-hidden="true" />
            <div className="max-w-md">
              <p className="text-fg text-lg font-medium">No positions yet</p>
              <p className="text-fg-muted text-sm mt-2">
                You have {formatUsd(portfolio.balance)} in virtual cash. Find a stock to research it,
                or use Trade above to buy your first shares at the live price.
              </p>
            </div>
            <SearchCommand label="Find a stock" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-surface z-10">
                <TableRow className="border-b border-line hover:bg-surface">
                  <TableHead className="text-fg-soft font-semibold">
                    Symbol
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    Quantity
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    Avg Cost
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    Current Price
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    Market Value
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    Unrealized P&L
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    % Gain
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-right">
                    Allocation %
                  </TableHead>
                  <TableHead className="text-fg-soft font-semibold text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.positions.map((position) => {
                  return (
                    <TableRow
                      key={position.symbol}
                      className="border-b border-line hover:bg-raised/50"
                    >
                      <TableCell className="font-semibold text-fg">
                        {position.symbol}
                      </TableCell>
                      <TableCell className="text-right text-fg">
                        {position.netQty}
                      </TableCell>
                      <TableCell className="text-right text-fg-soft">
                        {formatCurrency(position.avgCost)}
                      </TableCell>
                      <TableCell className="text-right text-fg-soft">
                        {formatCurrency(position.currentPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-fg">
                        {formatCurrency(position.marketValue)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <ChangeText value={position.unrealizedPnL} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <ChangeText percent={position.gainPercent} />
                      </TableCell>
                      <TableCell className="text-right text-fg-muted">
                        {position.allocationPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <PositionSellButton
                          symbol={position.symbol}
                          availableBalance={portfolio.balance}
                          netQty={position.netQty}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Portfolio Summary Footer */}
      {portfolio.positions.length > 0 && (
        <div className="bg-surface border border-line rounded-lg p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div>
              <p className="text-sm text-fg-muted mb-1">Total Positions</p>
              <p className="text-xl font-bold text-fg tabular-nums">
                {portfolio.positions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-fg-muted mb-1">Total Unrealized P&L</p>
              <p className="text-xl font-bold">
                <ChangeText value={portfolio.totalUnrealizedPnL} />
              </p>
            </div>
            <div>
              <p className="text-sm text-fg-muted mb-1">Portfolio Value</p>
              <p className="text-xl font-bold text-fg tabular-nums">
                {formatCurrency(portfolio.totalEquity)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
