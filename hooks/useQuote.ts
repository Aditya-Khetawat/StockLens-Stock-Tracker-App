"use client";

import { useEffect, useState } from "react";

export type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; price: number; changePercent: number | null }
  | { status: "error"; message: string };

/**
 * Live price for `symbol` from GET /api/quote, fetched once typing pauses.
 * Changing the symbol aborts the previous request, so a slow answer for "AA"
 * can never replace the price for "AAPL".
 */
export function useQuote(symbol: string, delayMs = 400): QuoteState {
  const key = symbol.trim().toUpperCase();
  const [result, setResult] = useState<{ key: string; state: QuoteState } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(key)}`, {
          signal: controller.signal,
        });
        const body = await res.json().catch(() => ({}));
        setResult({
          key,
          state: res.ok
            ? { status: "ready", price: body.price, changePercent: body.changePercent ?? null }
            : { status: "error", message: body.error ?? "Price unavailable." },
        });
      } catch {
        if (controller.signal.aborted) return;
        setResult({ key, state: { status: "error", message: "Price service unavailable." } });
      }
    }, delayMs);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, delayMs]);

  if (!key) return { status: "idle" };
  // Until the answer for this exact symbol arrives, it is loading.
  return result?.key === key ? result.state : { status: "loading" };
}
