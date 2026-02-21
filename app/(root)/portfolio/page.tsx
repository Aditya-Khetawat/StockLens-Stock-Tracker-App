import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { redirect } from "next/navigation";
import PortfolioTradeButton from "@/components/PortfolioTradeButton";
import PositionSellButton from "@/components/PositionSellButton";
import EquityChart from "@/components/EquityChart";
import AIPortfolioAnalysis from "@/components/AIPortfolioAnalysis";

const Portfolio = async () => {
  // Get authenticated user
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Fetch portfolio data
  const portfolio = await getUserPortfolio(session.user.id);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const isPositive = (value: number) => value >= 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <h1 className="watchlist-title">Portfolio</h1>
        <PortfolioTradeButton
          availableBalance={portfolio.balance}
          positions={portfolio.positions.map((p) => ({
            symbol: p.symbol,
            netQty: p.netQty,
          }))}
        />
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
            <Wallet className="h-5 w-5 text-gray-500" />
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
            <TrendingUp className="h-5 w-5 text-gray-500" />
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
            <PiggyBank className="h-5 w-5 text-gray-500" />
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
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isPositive(portfolio.totalReturn)
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {formatCurrency(portfolio.totalReturn)}
            </div>
            <p
              className={`text-sm font-medium mt-1 ${
                isPositive(portfolio.totalReturnPercent)
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {formatPercent(portfolio.totalReturnPercent)}
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
            <TrendingUp className="h-16 w-16 text-gray-600" />
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
                  const isProfitable = isPositive(position.unrealizedPnL);

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
                      <TableCell
                        className={`text-right font-semibold ${
                          isProfitable ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatCurrency(position.unrealizedPnL)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          isProfitable ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatPercent(position.gainPercent)}
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
              <p
                className={`text-xl font-bold ${
                  isPositive(portfolio.totalUnrealizedPnL)
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatCurrency(portfolio.totalUnrealizedPnL)}
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
