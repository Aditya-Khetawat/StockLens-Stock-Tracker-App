"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import WatchlistButton from "@/components/WatchlistButton";

type SearchCommandProps = {
  /** "field": an input-shaped trigger for the masthead. */
  renderAs?: "button" | "text" | "field" | "custom";
  label?: string;
  /** Content of the trigger when renderAs is "custom". */
  trigger?: React.ReactNode;
  triggerClassName?: string;
  /** Open with Ctrl/Cmd+K. Give it to exactly one instance per page. */
  shortcut?: boolean;
};

export default function SearchCommand({
  renderAs = "button",
  label = "Find a stock",
  trigger,
  triggerClassName,
  shortcut = false,
}: SearchCommandProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>([]);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks.slice(0, 10);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  // Load only while the dialog is open: the popular list on opening, search
  // results 300 ms after typing stops. A newer query cancels an older one, so
  // a slow response can never overwrite fresher results.
  useEffect(() => {
    if (!open) return;
    const term = searchTerm.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchStocks(term || undefined).catch(() => []);
      if (cancelled) return;
      setStocks(results);
      setLoading(false);
    }, term ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, searchTerm]);

  const openStock = (symbol: string) => {
    setOpen(false);
    setSearchTerm("");
    router.push(`/stocks/${symbol}`);
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    setStocks((prev) =>
      prev.map((stock) => (stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock)),
    );
  };

  const triggerProps = { type: "button" as const, onClick: () => setOpen(true), "aria-haspopup": "dialog" as const };

  return (
    <>
      {renderAs === "field" ? (
        <button
          {...triggerProps}
          className="group flex h-9 w-56 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm text-fg-subtle transition-colors hover:border-fg-subtle lg:w-72"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1 text-left">Search stocks</span>
          <kbd className="rounded border border-line bg-raised px-1.5 font-sans text-xs font-semibold text-fg-muted">
            Ctrl K
          </kbd>
        </button>
      ) : renderAs === "custom" ? (
        <button {...triggerProps} className={triggerClassName}>
          {trigger ?? label}
        </button>
      ) : renderAs === "text" ? (
        <button {...triggerProps} className="search-text">
          {label}
        </button>
      ) : (
        <button {...triggerProps} className={triggerClassName ?? "btn-primary"}>
          <Search className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search stocks"
        description="Search US stocks by name or symbol, then open one or add it to your watchlist."
        className="search-dialog"
        showCloseButton={false}
        shouldFilter={false}
      >
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Company name or symbol"
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" aria-label="Loading" />}
        </div>
        <CommandList className="search-list">
          {loading && displayStocks.length === 0 ? (
            <ul aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-4 border-b border-line px-5 py-3.5">
                  <span className="h-4 w-14 animate-pulse rounded-sm bg-raised" />
                  <span className="h-4 flex-1 animate-pulse rounded-sm bg-raised/70" />
                </li>
              ))}
            </ul>
          ) : displayStocks.length === 0 ? (
            <p className="search-list-indicator">
              {isSearchMode ? (
                <>
                  No US stock matches &ldquo;{searchTerm.trim()}&rdquo;. Try the ticker symbol, such as{" "}
                  <span className="font-semibold text-fg">AAPL</span>.
                </>
              ) : (
                "Stock data is unavailable right now. Please try again shortly."
              )}
            </p>
          ) : (
            <CommandGroup
              heading={isSearchMode ? `Results for “${searchTerm.trim()}”` : "Most watched"}
              className="p-0 [&_[cmdk-group-heading]]:caption [&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-line [&_[cmdk-group-heading]]:bg-raised/60 [&_[cmdk-group-heading]]:px-5 [&_[cmdk-group-heading]]:py-2"
            >
              {displayStocks.map((stock) => (
                <div key={stock.symbol} className="flex items-center border-b border-line last:border-b-0">
                  <CommandItem
                    value={stock.symbol}
                    onSelect={() => openStock(stock.symbol)}
                    className="flex-1 cursor-pointer gap-4 rounded-none px-5 py-3 data-[selected=true]:bg-raised/70"
                  >
                    <span className="w-16 shrink-0 font-semibold text-fg">{stock.symbol}</span>
                    <span className="min-w-0 flex-1 truncate text-fg-soft">{stock.name}</span>
                    <span className="hidden shrink-0 text-xs text-fg-subtle sm:inline">{stock.exchange}</span>
                  </CommandItem>
                  <div className="pr-4 pl-1">
                    <WatchlistButton
                      symbol={stock.symbol}
                      company={stock.name}
                      isInWatchlist={stock.isInWatchlist}
                      type="icon"
                      className="h-8 w-8"
                      onWatchlistChange={handleWatchlistChange}
                    />
                  </div>
                </div>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center justify-between gap-4 border-t border-line bg-raised/50 px-5 py-2 text-xs text-fg-muted">
          <span>
            <kbd className="font-sans font-semibold">↑</kbd> <kbd className="font-sans font-semibold">↓</kbd> to
            move, <kbd className="font-sans font-semibold">Enter</kbd> to open
          </span>
          <span>US listings only</span>
        </div>
      </CommandDialog>
    </>
  );
}
