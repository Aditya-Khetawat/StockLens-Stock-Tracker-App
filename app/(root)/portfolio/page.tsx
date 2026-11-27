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
import { formatUsd } from "@/lib/format";

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
            className="flex items-center gap-2 rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
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
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Cash Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(portfolio.balance)}
            </div>
          </CardContent>
        </Card>

        {/* Total Market Value Card */}
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Market Value
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(portfolio.totalMarketValue)}
            </div>
          </CardContent>
        </Card>

        {/* Total Equity Card */}
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Equity
            </CardTitle>
            <PiggyBank className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(portfolio.totalEquity)}
            </div>
          </CardContent>
        </Card>

        {/* Total Return Card */}
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Return
            </CardTitle>
            {isPositive(portfolio.totalReturn) ? (
              <TrendingUp className="h-5 w-5 text-green-500" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" aria-hidden="true" />
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
      <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-600">
          <h2 className="text-lg md:text-xl font-bold text-gray-100">
            Active Positions
          </h2>
        </div>

        {portfolio.positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
            <TrendingUp className="h-16 w-16 text-gray-600" aria-hidden="true" />
            <div>
              <p className="text-gray-400 text-lg font-medium">
                No active positions
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Start trading to build your Portfolio
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-800 z-10">
                <TableRow className="border-b border-gray-600 hover:bg-gray-800">
                  <TableHead className="text-gray-300 font-semibold">
                    Symbol
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Quantity
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Avg Cost
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Current Price
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Market Value
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Unrealized P&L
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    % Gain
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">
                    Allocation %
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.positions.map((position) => {
                  return (
                    <TableRow
                      key={position.symbol}
                      className="border-b border-gray-600 hover:bg-gray-700/50"
                    >
                      <TableCell className="font-semibold text-gray-100">
                        {position.symbol}
                      </TableCell>
                      <TableCell className="text-right text-gray-100">
                        {position.netQty}
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        {formatCurrency(position.avgCost)}
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        {formatCurrency(position.currentPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-100">
                        {formatCurrency(position.marketValue)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <ChangeText value={position.unrealizedPnL} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <ChangeText percent={position.gainPercent} />
                      </TableCell>
                      <TableCell className="text-right text-gray-400">
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
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Positions</p>
              <p className="text-xl font-bold text-gray-100">
                {portfolio.positions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Unrealized P&L</p>
              <p className="text-xl font-bold">
                <ChangeText value={portfolio.totalUnrealizedPnL} />
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
              <p className="text-xl font-bold text-gray-100">
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
