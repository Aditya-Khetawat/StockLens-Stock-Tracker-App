"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import WatchlistButton from "@/components/WatchlistButton";
import ChangeText from "@/components/ChangeText";
import Link from "next/link";
import { useState } from "react";

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
  const [stocks, setStocks] = useState<StockWithData[]>(watchlist);

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    if (!isAdded) {
      // Remove from local state when removed from watchlist
      setStocks((prev) => prev.filter((stock) => stock.symbol !== symbol));
    }
  };

  if (stocks.length === 0) {
    return null;
  }

  return (
    <div className="watchlist-table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="watchlist-table-head">Company</TableHead>
            <TableHead className="watchlist-table-head">Symbol</TableHead>
            <TableHead className="watchlist-table-head">Price</TableHead>
            <TableHead className="watchlist-table-head">Change</TableHead>
            <TableHead className="watchlist-table-head">Market Cap</TableHead>
            <TableHead className="watchlist-table-head">P/E Ratio</TableHead>
            <TableHead className="watchlist-table-head text-center">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.symbol} className="watchlist-table-row">
              <TableCell className="watchlist-table-cell">
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="watchlist-table-link"
                >
                  {stock.company}
                </Link>
              </TableCell>
              <TableCell className="watchlist-table-cell">
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="watchlist-table-link"
                >
                  {stock.symbol}
                </Link>
              </TableCell>
              <TableCell className="watchlist-table-cell">
                {stock.priceFormatted}
              </TableCell>
              <TableCell className="watchlist-table-cell">
                {stock.changePercent ? (
                  <ChangeText percent={stock.changePercent} />
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </TableCell>
              <TableCell className="watchlist-table-cell">
                {stock.marketCap}
              </TableCell>
              <TableCell className="watchlist-table-cell">
                {stock.peRatio}
              </TableCell>
              <TableCell className="watchlist-table-cell text-center">
                <WatchlistButton
                  symbol={stock.symbol}
                  company={stock.company}
                  isInWatchlist={true}
                  showTrashIcon={true}
                  type="icon"
                  onWatchlistChange={handleWatchlistChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WatchlistTable;
