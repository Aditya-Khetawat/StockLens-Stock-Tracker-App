"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Star } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import ChangeText from "@/components/ChangeText";
import SearchCommand from "@/components/SearchCommand";
import { cn } from "@/lib/utils";

type SortKey = "symbol" | "price" | "change";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const value = (s: StockWithData, key: SortKey) =>
  key === "symbol" ? s.symbol : key === "price" ? (s.currentPrice ?? -Infinity) : (s.changePercent ?? -Infinity);

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
  const [stocks, setStocks] = useState<StockWithData[]>(watchlist);
  const [sort, setSort] = useState<Sort>({ key: "change", dir: "desc" });

  const sorted = useMemo(() => {
    const out = [...stocks].sort((a, b) => {
      const x = value(a, sort.key);
      const y = value(b, sort.key);
      const cmp = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [stocks, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" ? "asc" : "desc" }));

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    if (!isAdded) setStocks((prev) => prev.filter((stock) => stock.symbol !== symbol));
  };

  if (stocks.length === 0) {
    return (
      <div className="sheet flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-raised text-brand">
          <Star className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium text-fg">Your watchlist is empty</p>
          <p className="mt-1 text-sm text-fg-subtle">Search for a company and star it to follow its price here.</p>
        </div>
        <SearchCommand label="Find a stock" triggerClassName="btn-secondary" />
      </div>
    );
  }

  return (
    <div className="sheet overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Watchlist, sortable by symbol, price and day change</caption>
          <thead className="border-b border-line bg-canvas/40">
            <tr>
              <SortHead sort={sort} onSort={toggle} k="symbol" label="Company" align="left" />
              <SortHead sort={sort} onSort={toggle} k="price" label="Price" />
              <SortHead sort={sort} onSort={toggle} k="change" label="Today" />
              <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-fg-subtle">Market cap</th>
              <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-fg-subtle">P/E</th>
              <th scope="col" className="py-2.5 pr-5 pl-4"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock) => (
              <tr key={stock.symbol} className="border-b border-line transition-colors last:border-b-0 hover:bg-hover">
                <td className="py-3 pr-4 pl-5">
                  <Link href={`/stocks/${stock.symbol}`} className="group flex min-w-0 flex-col">
                    <span className="font-mono text-[0.8125rem] font-semibold text-fg group-hover:text-brand">{stock.symbol}</span>
                    <span className="truncate text-xs text-fg-subtle">{stock.company}</span>
                  </Link>
                </td>
                <td className="figure px-4 py-3 text-right font-medium text-fg">{stock.priceFormatted}</td>
                <td className="px-4 py-3 text-right">
                  {stock.changePercent ? (
                    <ChangeText percent={stock.changePercent} className="text-[0.8125rem] font-semibold" />
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </td>
                <td className="figure px-4 py-3 text-right text-fg-soft">{stock.marketCap}</td>
                <td className="figure px-4 py-3 text-right text-fg-soft">{stock.peRatio}</td>
                <td className="py-3 pr-5 pl-4 text-right">
                  <WatchlistButton
                    symbol={stock.symbol}
                    company={stock.company}
                    isInWatchlist={true}
                    showTrashIcon={true}
                    type="icon"
                    className="h-8 w-8 hover:!bg-loss/10 hover:!text-loss-soft"
                    onWatchlistChange={handleWatchlistChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function SortHead({
k,
label,
align = "right",
sort,
onSort,
}: {
k: SortKey;
label: string;
align?: "left" | "right";
sort: Sort;
onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-4 py-2.5 text-xs font-medium whitespace-nowrap", align === "left" ? "pl-5 text-left" : "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-fg",
          active ? "text-fg" : "text-fg-subtle",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}

export default WatchlistTable;
