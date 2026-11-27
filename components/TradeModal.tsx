"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useQuote } from "@/hooks/useQuote";
import { formatUsd } from "@/lib/format";
import { checkOrder } from "@/lib/trading/order-form";
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
        className="bg-surface border-line text-fg sm:max-w-md"
        // Radix handles Escape before the input sees it. While the symbol
        // suggestions are open, Escape closes them and the dialog stays open.
        // Start in the first field to fill: the symbol, or the quantity when the symbol is fixed.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>("[data-autofocus]")?.focus();
        }}
        onEscapeKeyDown={(e) => {
          const el = document.activeElement;
          if (el?.getAttribute("role") === "combobox" && el.getAttribute("aria-expanded") === "true") {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-fg">Trade</DialogTitle>
          <DialogDescription className="text-fg-muted">
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
        { description: `Total ${formatUsd(t.totalAmount)}. Cash balance ${formatUsd(t.newBalance)}.` },
      );
      onDone();
      router.refresh();
    } catch {
      setServerError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="p-4 bg-raised/50 rounded-lg border border-line">
        <p className="text-sm text-fg-muted">Available cash</p>
        <p className="text-2xl font-bold text-fg tabular-nums">{formatUsd(availableBalance)}</p>
      </div>

      <div className="space-y-2">
        <p id={`${ids}-type`} className="text-sm font-medium text-fg-soft">
          Order type
        </p>
        <div role="group" aria-labelledby={`${ids}-type`} className="grid grid-cols-2 gap-3">
          {(["BUY", "SELL"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              aria-pressed={type === option}
              disabled={submitting}
              onClick={() => setType(option)}
              className={cn(
                type === option
                  ? option === "BUY"
                    ? "bg-gain-strong hover:bg-gain-deep text-white"
                    : "bg-loss-strong hover:bg-loss-deep text-white"
                  : "bg-transparent border border-line text-fg-soft hover:bg-raised",
              )}
            >
              {option === "BUY" ? "Buy" : "Sell"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${ids}-symbol`} className="text-fg-soft">
          Stock symbol
        </Label>
        {lockSymbol ? (
          <Input
            id={`${ids}-symbol`}
            value={symbol}
            readOnly
            className="bg-raised/50 border-line text-fg font-semibold"
          />
        ) : (
          <SymbolCombobox
            id={`${ids}-symbol`}
            value={symbol}
            onChange={setSymbol}
            disabled={submitting}
            busy={quote.status === "loading"}
            // Selling: suggest what you own, without a network round trip.
            ownedSymbols={type === "SELL" ? positions.map((p) => p.symbol) : null}
          />
        )}
        <div aria-live="polite" className="min-h-5 text-sm">
          {quote.status === "error" && (
            <p className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {quote.message}
            </p>
          )}
          {quote.status === "ready" && (
            <p className="text-fg-soft tabular-nums">Live price {formatUsd(quote.price)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${ids}-qty`} className="text-fg-soft">
            Quantity
          </Label>
          {type === "SELL" && ownedQty > 0 && (
            <button
              type="button"
              onClick={() => setQuantity(String(ownedQty))}
              className="text-xs font-semibold text-loss-soft hover:text-loss-faint border border-loss/50 hover:border-loss-soft rounded px-2 py-0.5 transition-colors"
            >
              Sell all ({ownedQty})
            </button>
          )}
        </div>
        <Input
          id={`${ids}-qty`}
          data-autofocus={lockSymbol ? true : undefined}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Number of shares"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-invalid={showCheckMessage || undefined}
          aria-describedby={showCheckMessage ? `${ids}-qty-msg` : undefined}
          className="bg-raised border-line text-fg placeholder:text-fg-subtle tabular-nums"
          disabled={submitting}
        />
        {showCheckMessage && (
          <p id={`${ids}-qty-msg`} className="text-sm text-warning">
            {check.message}
          </p>
        )}
      </div>

      <div className="p-4 bg-raised/50 rounded-lg border border-line">
        <p className="text-sm text-fg-muted mb-1">Estimated total</p>
        {check.ok ? (
          <>
            <p className="text-xl font-semibold text-fg tabular-nums">{formatUsd(check.total)}</p>
            <p className="text-xs text-fg-subtle mt-1 tabular-nums">
              {check.quantity} × {formatUsd(price!)}, final price set when the order fills
            </p>
          </>
        ) : (
          <p className="text-lg text-fg-subtle">
            {quote.status === "loading" ? "Fetching price…" : "Enter a symbol and quantity"}
          </p>
        )}
      </div>

      {serverError && (
        <div role="alert" className="p-3 bg-loss/10 border border-loss/50 rounded-lg">
          <p className="text-sm text-loss-soft">{serverError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onDone}
          disabled={submitting}
          className="flex-1 bg-transparent border border-line text-fg-soft hover:bg-raised"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!check.ok || submitting}
          aria-busy={submitting}
          className={cn(
            "flex-1 text-white",
            type === "BUY" ? "bg-gain-strong hover:bg-gain-deep" : "bg-loss-strong hover:bg-loss-deep",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Placing order…
            </>
          ) : check.ok ? (
            `${type === "BUY" ? "Buy" : "Sell"} ${check.quantity} share${check.quantity === 1 ? "" : "s"}`
          ) : (
            `${type === "BUY" ? "Buy" : "Sell"}`
          )}
        </Button>
      </div>
    </form>
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
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + suggestions.length) % suggestions.length);
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
      <Input
        id={id}
        data-autofocus
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="e.g. AAPL"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="bg-raised border-line text-fg placeholder:text-fg-subtle"
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
      />
      {busy && (
        <Loader2
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-fg-muted"
          aria-hidden="true"
        />
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label="Matching stocks"
        hidden={!expanded}
        className="absolute z-50 mt-1 w-full rounded-md border border-line bg-surface shadow-lg overflow-hidden"
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
                "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                i === active && "bg-raised",
              )}
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="font-medium text-fg text-sm">{s.symbol}</span>
              <span className="text-fg-muted text-xs truncate">{s.name}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
