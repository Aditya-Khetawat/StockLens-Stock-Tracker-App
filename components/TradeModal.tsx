"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ChangeText from "@/components/ChangeText";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useQuote } from "@/hooks/useQuote";
import { formatUsd } from "@/lib/format";
import { checkOrder } from "@/lib/trading/order-form";
import { MAX_TRADE_QUANTITY } from "@/lib/trading/validation";
import { cn } from "@/lib/utils";

type OrderType = "BUY" | "SELL";
type Suggestion = { symbol: string; name: string };

interface TradeModalProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
  defaultSymbol?: string;
  defaultType?: OrderType;
  positions?: Array<{ symbol: string; netQty: number }>;
  /** Fix the symbol (for example on a stock page or a position row). */
  lockSymbol?: boolean;
}

export default function TradeModal({ open, onClose, ...formProps }: TradeModalProps) {
  // The form lives inside DialogContent, which unmounts on close, so every
  // opening starts from the defaults instead of the last order's leftovers.
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-xl border-line bg-surface p-0 text-fg shadow-[var(--shadow-pop)] sm:max-w-[440px]"
        // Start in the first field to fill: the symbol, or the quantity when the symbol is fixed.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>("[data-autofocus]")?.focus();
        }}
        // Radix handles Escape before the input sees it. While the symbol
        // suggestions are open, Escape closes them and the dialog stays open.
        onEscapeKeyDown={(e) => {
          const el = document.activeElement;
          if (el?.getAttribute("role") === "combobox" && el.getAttribute("aria-expanded") === "true") {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b border-line px-5 py-4 text-left">
          <DialogTitle className="text-base font-semibold text-fg">Place an order</DialogTitle>
          <DialogDescription className="text-[0.8125rem] text-fg-subtle">
            Paper trade at the live market price. No real money is involved.
          </DialogDescription>
        </DialogHeader>
        <TradeForm onDone={onClose} {...formProps} />
      </DialogContent>
    </Dialog>
  );
}

function TradeForm({
  onDone,
  availableBalance,
  defaultSymbol = "",
  defaultType = "BUY",
  positions = [],
  lockSymbol = false,
}: Omit<TradeModalProps, "open" | "onClose"> & { onDone: () => void }) {
  const router = useRouter();
  const ids = useId();
  const [symbol, setSymbol] = useState(defaultSymbol.toUpperCase());
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<OrderType>(defaultType);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const quote = useQuote(symbol);
  const price = quote.status === "ready" ? quote.price : null;
  const ownedQty = positions.find((p) => p.symbol === symbol.trim())?.netQty ?? 0;
  const check = checkOrder({ type, quantity, price, cash: availableBalance, ownedQty });
  const showCheckMessage = quantity.trim() !== "" && !check.ok && price !== null;
  const isBuy = type === "BUY";

  // The most this order could be: what cash buys, or everything owned.
  const maxQty = isBuy ? (price ? Math.min(Math.floor(availableBalance / price), MAX_TRADE_QUANTITY) : 0) : ownedQty;
  const qtyNumber = Number(quantity) || 0;
  const step = (delta: number) => setQuantity(String(Math.max(1, Math.min(maxQty || MAX_TRADE_QUANTITY, qtyNumber + delta))));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check.ok || submitting) return;
    setServerError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim(), type, quantity: check.quantity }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        setServerError(result?.error ?? "The order could not be completed. Please try again.");
        return;
      }
      const t = result.data;
      // The executed price can differ from the estimate shown a moment ago.
      toast.success(
        `${t.type === "BUY" ? "Bought" : "Sold"} ${t.quantity} ${t.symbol} at ${formatUsd(t.price)}`,
        { description: `Total ${formatUsd(t.totalAmount)} · Buying power ${formatUsd(t.newBalance)}` },
      );
      onDone();
      router.refresh();
    } catch {
      setServerError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const cashAfter = check.ok ? availableBalance + (isBuy ? -check.total : check.total) : null;
  const sharesAfter = check.ok ? ownedQty + (isBuy ? check.quantity : -check.quantity) : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Side */}
        <div role="group" aria-label="Order side" className="grid grid-cols-2 rounded-lg bg-raised p-1">
          {(["BUY", "SELL"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              disabled={submitting}
              onClick={() => setType(option)}
              className={cn(
                "h-8 cursor-pointer rounded-md text-sm font-semibold transition-colors",
                type === option
                  ? option === "BUY"
                    ? "bg-gain text-on-brand"
                    : "bg-loss text-on-brand"
                  : "text-fg-subtle hover:text-fg",
              )}
            >
              {option === "BUY" ? "Buy" : "Sell"}
            </button>
          ))}
        </div>

        {/* Symbol and live quote */}
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-symbol`} className="form-label">
            Stock
          </label>
          {lockSymbol ? (
            <input
              id={`${ids}-symbol`}
              value={symbol}
              readOnly
              className="h-10 rounded-lg border border-line bg-raised px-3 font-mono text-sm font-semibold text-fg"
            />
          ) : (
            <SymbolCombobox
              id={`${ids}-symbol`}
              value={symbol}
              onChange={setSymbol}
              disabled={submitting}
              busy={quote.status === "loading"}
              // Selling: suggest what you own, without a network round trip.
              ownedSymbols={isBuy ? null : positions.map((p) => p.symbol)}
            />
          )}
          <div aria-live="polite" className="min-h-5 text-sm">
            {quote.status === "error" && (
              <p className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {quote.message}
              </p>
            )}
            {quote.status === "loading" && <p className="text-fg-subtle">Fetching the live price…</p>}
            {quote.status === "ready" && (
              <p className="flex items-baseline gap-2">
                <span className="figure font-semibold text-fg">{formatUsd(quote.price)}</span>
                <ChangeText percent={quote.changePercent} className="text-xs font-semibold" />
                <span className="text-xs text-fg-subtle">live price</span>
              </p>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor={`${ids}-qty`} className="form-label">
              Shares
            </label>
            {maxQty > 0 && (
              <button
                type="button"
                onClick={() => setQuantity(String(maxQty))}
                className="text-xs font-semibold text-brand hover:text-brand-bright"
              >
                {isBuy ? `Max ${maxQty.toLocaleString("en-US")}` : `Sell all ${ownedQty}`}
              </button>
            )}
          </div>
          <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-line bg-canvas focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
            <button
              type="button"
              aria-label="One share fewer"
              onClick={() => step(-1)}
              disabled={submitting || qtyNumber <= 1}
              className="w-11 cursor-pointer text-fg-subtle transition-colors hover:bg-raised hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="mx-auto h-4 w-4" aria-hidden="true" />
            </button>
            <input
              id={`${ids}-qty`}
              data-autofocus={lockSymbol ? true : undefined}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-invalid={showCheckMessage || undefined}
              aria-describedby={showCheckMessage ? `${ids}-qty-msg` : undefined}
              className="figure min-w-0 flex-1 border-x border-line bg-transparent text-center text-lg font-semibold text-fg outline-none placeholder:text-fg-subtle"
              disabled={submitting}
            />
            <button
              type="button"
              aria-label="One share more"
              onClick={() => step(1)}
              disabled={submitting || (maxQty > 0 && qtyNumber >= maxQty)}
              className="w-11 cursor-pointer text-fg-subtle transition-colors hover:bg-raised hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="mx-auto h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {showCheckMessage && (
            <p id={`${ids}-qty-msg`} className="text-sm text-warning">
              {check.message}
            </p>
          )}
        </div>
      </div>

      {/* Order preview */}
      <dl className="flex flex-col gap-2 border-t border-line bg-canvas/60 px-5 py-4 text-sm">
        <PreviewRow label={isBuy ? "Estimated cost" : "Estimated proceeds"} strong>
          {check.ok ? formatUsd(check.total) : "—"}
        </PreviewRow>
        <PreviewRow label="Buying power after">{cashAfter != null ? formatUsd(cashAfter) : formatUsd(availableBalance)}</PreviewRow>
        <PreviewRow label={`${symbol.trim() || "Shares"} held after`}>
          {sharesAfter != null ? sharesAfter.toLocaleString("en-US") : ownedQty.toLocaleString("en-US")}
        </PreviewRow>
        <p className="pt-1 text-xs text-fg-subtle">Market order. The final price is set when the order fills.</p>
      </dl>

      {serverError && (
        <div role="alert" className="mx-5 mt-4 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2.5 text-sm text-loss-soft">
          {serverError}
        </div>
      )}

      <div className="flex gap-2 px-5 py-4">
        <button type="button" onClick={onDone} disabled={submitting} className="btn-secondary h-10 flex-1">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!check.ok || submitting}
          aria-busy={submitting}
          className={cn("h-10 flex-[2]", isBuy ? "btn-buy" : "btn-sell")}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Placing order…
            </>
          ) : check.ok ? (
            `${isBuy ? "Buy" : "Sell"} ${check.quantity} ${symbol.trim()}`
          ) : (
            `Review ${isBuy ? "buy" : "sell"} order`
          )}
        </button>
      </div>
    </form>
  );
}

function PreviewRow({ label, strong, children }: { label: string; strong?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className={cn("figure", strong ? "text-base font-semibold text-fg" : "text-fg-soft")}>{children}</dd>
    </div>
  );
}

/** Symbol input with a keyboard-navigable suggestion list (ARIA combobox). */
function SymbolCombobox({
  id,
  value,
  onChange,
  disabled,
  busy,
  ownedSymbols,
}: {
  id: string;
  value: string;
  onChange: (symbol: string) => void;
  disabled: boolean;
  busy: boolean;
  ownedSymbols: string[] | null;
}) {
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<{ term: string; items: Suggestion[] }>({ term: "", items: [] });
  const term = value.trim();

  // Buying: search Finnhub once typing pauses; drop answers for older terms.
  useEffect(() => {
    if (ownedSymbols || !open || !term) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchStocks(term).catch(() => []);
      if (!cancelled) {
        setRemote({ term, items: results.slice(0, 6).map((s) => ({ symbol: s.symbol, name: s.name })) });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, open, ownedSymbols]);

  const suggestions: Suggestion[] = ownedSymbols
    ? ownedSymbols
        .filter((s) => s.startsWith(term))
        .slice(0, 6)
        .map((s) => ({ symbol: s, name: "In your portfolio" }))
    : remote.term === term
      ? remote.items
      : [];
  const expanded = open && term !== "" && suggestions.length > 0 && suggestions[0]?.symbol !== term;

  const choose = (symbol: string) => {
    onChange(symbol);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!expanded) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + delta + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active].symbol);
    } else if (e.key === "Escape") {
      // Close the list only (the dialog ignores this Escape); a second one closes the dialog.
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        data-autofocus
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Symbol or company, e.g. AAPL"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
      />
      {busy && (
        <Loader2
          className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-fg-subtle"
          aria-hidden="true"
        />
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label="Matching stocks"
        hidden={!expanded}
        className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-[var(--shadow-pop)]"
      >
        {expanded &&
          suggestions.map((s, i) => (
            <li
              key={s.symbol}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: it fires before the input's blur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s.symbol);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors",
                i === active && "bg-raised",
              )}
            >
              <span className="w-14 shrink-0 font-mono text-[0.8125rem] font-semibold text-fg">{s.symbol}</span>
              <span className="truncate text-xs text-fg-subtle">{s.name}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
